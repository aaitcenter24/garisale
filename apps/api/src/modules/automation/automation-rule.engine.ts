import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface AutomationContext {
  dealerId: string;
  triggerEvent: string;
  chainDepth: number;
  contactId?: string;
  contactPhone?: string;
  contactEmail?: string;
  leadId?: string;
  vehicleId?: string;
  [key: string]: any;
}

const DAILY_LIMITS: Record<string, number> = {
  whatsapp: 1000,
  sms: 500,
  facebook: 3,
  instagram: 3,
  email: 99999,
  push: 99999,
};

@Injectable()
export class AutomationRuleEngine {
  private readonly logger = new Logger(AutomationRuleEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Resolve template variables with filters
  resolveTemplate(template: string, ctx: AutomationContext): string {
    if (!template) return '';
    return template.replace(/\{\{([^}]+)\}\}/g, (match: string, expression: string) => {
      const parts = expression.trim().split('|').map((s: string) => s.trim());
      const path = parts[0];
      const filters = parts.slice(1);

      let value = '';

      // Resolver lookup
      if (path === 'lead.buyer_name') {
        value = ctx.buyerName || ctx.lead?.buyer_name || 'Customer';
      } else if (path === 'lead.assignee.full_name') {
        value = ctx.salespersonName || ctx.lead?.assignee?.full_name || 'our sales rep';
      } else if (path === 'lead.vehicle.make') {
        value = ctx.vehicleMake || ctx.lead?.vehicle?.make || '';
      } else if (path === 'lead.vehicle.model') {
        value = ctx.vehicleModel || ctx.lead?.vehicle?.model || '';
      } else if (path === 'lead.vehicle.year') {
        value = String(ctx.vehicleYear || ctx.lead?.vehicle?.year || '');
      } else if (path === 'lead.vehicle.asking_price') {
        value = String(ctx.vehiclePrice || ctx.lead?.vehicle?.asking_price || '');
      } else if (path === 'dealership.business_name') {
        value = ctx.dealerName || ctx.dealer?.business_name || 'Garisale Dealer';
      } else if (path === 'stock_no') {
        value = ctx.stockNo || ctx.vehicle?.stock_no || '';
      } else if (path === 'recommended_price') {
        value = String(ctx.recommendedPrice || '');
      } else if (path === 'reduction') {
        value = String(ctx.reduction || '');
      } else {
        // Fallback context property lookup
        const keys = path.split('.');
        let obj: any = ctx;
        for (const k of keys) {
          obj = obj ? obj[k] : undefined;
        }
        value = obj !== undefined ? String(obj) : match;
      }

      // Apply filters
      for (const filter of filters) {
        if (filter === 'format_bdt') {
          const num = Number(value);
          if (!isNaN(num)) {
            value = num >= 100000 ? `${(num / 100000).toFixed(num % 100000 !== 0 ? 1 : 0)}L` : num.toLocaleString('en-IN');
          }
        } else if (filter === 'first_name') {
          value = value.split(' ')[0] || '';
        } else if (filter === 'bd_date') {
          value = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        }
      }

      return value;
    });
  }

  // Loop detection
  wouldCreateLoop(rules: any[], ctx: AutomationContext): boolean {
    if (ctx.chainDepth >= 3) return true;

    // Circular check: if rule actions emit an event that matches the trigger event
    for (const rule of rules) {
      const actions = typeof rule.actions === 'string' ? JSON.parse(rule.actions) : rule.actions;
      if (actions && actions.emitted_event === ctx.triggerEvent) {
        return true;
      }
    }
    return false;
  }

  // Rate limiting check per channel
  async checkChannelRateLimit(dealerId: string, channel: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const key = `rate:automation:${channel}:${dealerId}:${today}`;
    const limit = DAILY_LIMITS[channel] || 99999;

    const count = await this.redis.incr(key);
    if (count === 1) {
      // Set end of day expiry (approx 86400s)
      await this.redis.expire(key, 86400);
    }

    if (count === Math.floor(limit * 0.8) + 1) {
      // Emit alert warning at 80%
      await this.eventEmitter.emit('automation.rate_limit_warning', { dealerId, channel, count, limit });
    }

    return count <= limit;
  }

  // Contact Daily Message limit check (max 3/contact/day)
  async checkContactDailyLimit(dealerId: string, contactPhone: string): Promise<boolean> {
    if (!contactPhone) return true;
    const today = new Date().toISOString().split('T')[0];
    const key = `rate:contact:${dealerId}:${contactPhone}:${today}`;

    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, 86400);
    }

    return count <= 3;
  }

  // Opt-out Check
  async checkOptOut(contactId: string, channel: string): Promise<boolean> {
    if (!contactId) return false;
    const customer = await this.prisma.customer.findUnique({
      where: { id: contactId },
    });
    if (!customer) return false;

    if (channel === 'sms' && customer.opted_in_sms === false) return true;
    if (channel === 'whatsapp' && customer.opted_in_whatsapp === false) return true;
    if (channel === 'email' && customer.opted_in_email === false) return true;

    return false;
  }

  // Festival Mode Suppression lookup
  async isSuppressedByFestivalMode(triggerEvent: string): Promise<boolean> {
    const todayStr = new Date().toISOString().split('T')[0];
    const calendar = await this.prisma.platformCalendar.findFirst({
      where: {
        date: new Date(todayStr + 'T00:00:00Z'),
        country: 'BD',
      },
    });

    if (!calendar) return false; // Not a holiday/festival

    // Suppress only non-critical events
    const criticalEvents = [
      'lead.created', // Day 0 reply
      'crm.lead.hot',
      'deal.delivered',
      'contact_sla_2h',
      'payments.invoice.payment_failed',
      'vehicle.available', // Inventory alerts
      'daily_briefing',
    ];

    return !criticalEvents.includes(triggerEvent);
  }

  // Primary execution handler
  async evaluate(triggerEvent: string, ctx: AutomationContext): Promise<void> {
    const rules = await this.prisma.automationRule.findMany({
      where: {
        dealership_id: ctx.dealerId,
        trigger_event: triggerEvent,
        is_active: true,
      },
    });

    if (rules.length === 0) return;

    // Loop detection check
    if (this.wouldCreateLoop(rules, ctx)) {
      this.logger.warn(`Automation loop detected for event: ${triggerEvent}`);
      for (const rule of rules) {
        await this.prisma.automationLog.create({
          data: {
            dealership_id: ctx.dealerId,
            lead_id: ctx.leadId || null,
            contact_phone: ctx.contactPhone || null,
            channel: rule.channel,
            rule_id: rule.id,
            status: 'skipped',
            error_message: 'loop_detected',
          },
        });
      }
      return;
    }

    // Festival Mode Check
    const suppressed = await this.isSuppressedByFestivalMode(triggerEvent);
    if (suppressed) {
      this.logger.log(`Festival Mode active: Suppressed automation for ${triggerEvent}`);
      for (const rule of rules) {
        await this.prisma.automationLog.create({
          data: {
            dealership_id: ctx.dealerId,
            lead_id: ctx.leadId || null,
            contact_phone: ctx.contactPhone || null,
            channel: rule.channel,
            rule_id: rule.id,
            status: 'skipped',
            error_message: 'festival_mode_suppressed',
          },
        });
      }
      return;
    }

    for (const rule of rules) {
      // Check opt-out status
      if (ctx.contactId) {
        const optedOut = await this.checkOptOut(ctx.contactId, rule.channel);
        if (optedOut) {
          await this.prisma.automationLog.create({
            data: {
              dealership_id: ctx.dealerId,
              lead_id: ctx.leadId || null,
              contact_phone: ctx.contactPhone || null,
              channel: rule.channel,
              rule_id: rule.id,
              status: 'opted_out',
            },
          });
          continue;
        }
      }

      // Check contact daily message count
      if (ctx.contactPhone) {
        const withinContactLimit = await this.checkContactDailyLimit(ctx.dealerId, ctx.contactPhone);
        if (!withinContactLimit) {
          await this.prisma.automationLog.create({
            data: {
              dealership_id: ctx.dealerId,
              lead_id: ctx.leadId || null,
              contact_phone: ctx.contactPhone || null,
              channel: rule.channel,
              rule_id: rule.id,
              status: 'skipped',
              error_message: 'contact_daily_limit',
            },
          });
          continue;
        }
      }

      // Check channel rate limits
      const withinChannelLimit = await this.checkChannelRateLimit(ctx.dealerId, rule.channel);
      if (!withinChannelLimit) {
        // Carry forward to next day at 9:00 AM (queued)
        const scheduledTime = new Date();
        scheduledTime.setDate(scheduledTime.getDate() + 1);
        scheduledTime.setHours(9, 0, 0, 0);

        await this.prisma.automationLog.create({
          data: {
            dealership_id: ctx.dealerId,
            lead_id: ctx.leadId || null,
            contact_phone: ctx.contactPhone || null,
            channel: rule.channel,
            rule_id: rule.id,
            status: 'queued',
            error_message: 'rate_limit_carry_forward',
            metadata: { scheduled_send_time: scheduledTime.toISOString() },
          },
        });
        continue;
      }

      // Resolve and Send actions
      const actions = typeof rule.actions === 'string' ? JSON.parse(rule.actions) : rule.actions;
      if (actions) {
        const body = this.resolveTemplate(actions.template_body, ctx);
        const appendOptOut = rule.channel === 'sms' && !body.includes('STOP');
        const finalBody = appendOptOut ? `${body} Reply STOP to unsubscribe` : body;

        // Emit channel delivery
        await this.eventEmitter.emit(`automation.send_${rule.channel}`, {
          to: ctx.contactPhone || ctx.contactEmail || '',
          body: finalBody,
          dealership_id: ctx.dealerId,
          rule_id: rule.id,
          lead_id: ctx.leadId,
        });

        await this.prisma.automationLog.create({
          data: {
            dealership_id: ctx.dealerId,
            lead_id: ctx.leadId || null,
            contact_phone: ctx.contactPhone || null,
            channel: rule.channel,
            rule_id: rule.id,
            status: 'sent',
            metadata: { body: finalBody },
          },
        });
      }
    }
  }
}
