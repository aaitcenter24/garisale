import { Injectable, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CrmService } from '../crm/crm.service';
import { AutomationRuleEngine } from './automation-rule.engine';
import { OnEvent } from '@nestjs/event-emitter';
import * as crypto from 'crypto';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly crmService: CrmService,
    private readonly ruleEngine: AutomationRuleEngine,
  ) {}

  async testRule(id: string) {
    const rule = await this.prisma.reconTask.findUnique({
      where: { id },
    });
    if (!rule) {
      throw new NotFoundException('AUTOMATION_RULE_NOT_FOUND');
    }
    return { id: rule.id, executed: true };
  }

  // Meta signature validator
  verifySignature(rawBody: string, signature: string): boolean {
    const secret = this.config.get<string>('META_APP_SECRET') || 'test_secret';
    if (!signature) return false;
    const cleanSig = signature.replace('sha256=', '');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const expected = hmac.digest('hex');
    return cleanSig === expected;
  }

  // Facebook Lead Ads Sync Webhook
  async processFacebookWebhook(rawBody: string, signature: string, payload: any) {
    if (!this.verifySignature(rawBody, signature)) {
      throw new UnauthorizedException('INVALID_SIGNATURE');
    }

    const { dealership_id, buyer_name, buyer_phone, buyer_email, vehicle_id } = payload;

    // Create lead in CRM
    const lead = await this.crmService.createLead(dealership_id, {
      buyer_phone,
      buyer_name,
      buyer_email,
      vehicle_id,
      source: 'facebook_lead_ad',
    });

    // Resolve context for template resolution
    const staffUser = lead.assigned_to
      ? await this.prisma.user.findUnique({ where: { id: lead.assigned_to } })
      : null;
    const vehicle = vehicle_id
      ? await this.prisma.vehicle.findUnique({ where: { id: vehicle_id } })
      : null;
    const dealer = await this.prisma.dealership.findUnique({ where: { id: dealership_id } });

    const ctx = {
      dealerId: dealership_id,
      triggerEvent: 'lead.created',
      chainDepth: 1,
      contactId: lead.customer_id || undefined,
      contactPhone: lead.buyer_phone,
      leadId: lead.id,
      buyerName: lead.buyer_name,
      salespersonName: staffUser?.full_name || 'our sales team',
      vehicleMake: vehicle?.make || '',
      vehicleModel: vehicle?.model || '',
      vehicleYear: vehicle?.year || 0,
      vehiclePrice: vehicle?.asking_price ? Number(vehicle.asking_price) : 0,
      dealerName: dealer?.business_name || '',
    };

    // Trigger WhatsApp Day 0 Sequence
    await this.ruleEngine.evaluate('lead.created', ctx);

    return { success: true, lead_id: lead.id };
  }

  // WhatsApp Message Callback Webhook
  async processWhatsappWebhook(rawBody: string, signature: string, payload: any) {
    if (!this.verifySignature(rawBody, signature)) {
      throw new UnauthorizedException('INVALID_SIGNATURE');
    }

    const { dealership_id, contact_phone, body } = payload;

    // Find active lead for contact
    const lead = await this.prisma.lead.findFirst({
      where: {
        dealership_id,
        buyer_phone: contact_phone,
        stage: { notIn: ['closed', 'lost'] },
      },
    });

    if (lead) {
      // Record inbound interaction (which suspends decay/cancels sequences)
      await this.prisma.leadInteraction.create({
        data: {
          dealership_id,
          lead_id: lead.id,
          type: 'whatsapp_received',
          summary: `Inbound WhatsApp: ${body}`,
          metadata: { message: body },
        },
      });

      const staffUser = lead.assigned_to
        ? await this.prisma.user.findUnique({ where: { id: lead.assigned_to } })
        : null;

      const ctx = {
        dealerId: dealership_id,
        triggerEvent: 'whatsapp.received',
        chainDepth: 1,
        contactId: lead.customer_id || undefined,
        contactPhone: contact_phone,
        leadId: lead.id,
        buyerName: lead.buyer_name,
        salespersonName: staffUser?.full_name || '',
        messageBody: body,
      };

      // Trigger potential keyword rules
      await this.ruleEngine.evaluate('whatsapp.received', ctx);
    }

    return { success: true };
  }

  // SMS opt-out stop callback
  async processSmsStopCallback(payload: any) {
    const { phone } = payload;

    // Find all customers matching phone across all dealerships
    const customers = await this.prisma.customer.findMany({
      where: { phone },
    });

    for (const c of customers) {
      await this.prisma.customer.update({
        where: { id: c.id },
        data: {
          opted_in_sms: false,
        },
      });

      this.logger.log(`Opted out customer ${c.id} from SMS campaign.`);
    }

    return { success: true };
  }

  @OnEvent('automation.send_sms')
  async handleSendSms(payload: { to: string; body: string; dealership_id?: string; rule_id?: string; lead_id?: string }) {
    const { to, body } = payload;
    const token = this.config.get<string>('GREENWEB_TOKEN');
    const senderId = this.config.get<string>('SMS_SENDER_ID');

    // Normalize phone number to BD format (no leading +, prepended with 88)
    let clean = to.replace(/[^\d+]/g, '');
    if (clean.startsWith('+')) {
      clean = clean.substring(1);
    }
    if (!clean.startsWith('88')) {
      if (clean.startsWith('0')) {
        clean = '88' + clean;
      } else {
        clean = '880' + clean;
      }
    }

    if (!token || token.startsWith('PLACEHOLDER_') || token === 'your_greenweb_token_here') {
      this.logger.log(`[SMS Sandbox Mock] To: ${clean}, Message: "${body}"`);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('token', token);
      params.append('to', clean);
      params.append('message', body);
      if (senderId && !senderId.startsWith('PLACEHOLDER_')) {
        params.append('from', senderId);
      }

      const response = await fetch('https://api.greenweb.com.bd/api.php', {
        method: 'POST',
        body: params,
      });
      const responseText = await response.text();
      this.logger.log(`Greenweb BD API Response: ${responseText}`);
    } catch (err: any) {
      this.logger.error(`Failed to send Greenweb BD SMS: ${err.message}`, err.stack);
    }
  }

  @OnEvent('automation.send_whatsapp')
  async handleSendWhatsapp(payload: { to: string; body: string; dealership_id?: string; rule_id?: string; lead_id?: string; template_name?: string }) {
    const { to, body, template_name } = payload;
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const apiToken = this.config.get<string>('WHATSAPP_API_TOKEN');

    // Normalize phone number to digits only
    const clean = to.replace(/[^\d]/g, '');

    if (!phoneNumberId || phoneNumberId.startsWith('PLACEHOLDER_') || !apiToken || apiToken.startsWith('PLACEHOLDER_')) {
      this.logger.log(`[WhatsApp Sandbox Mock] To: ${clean}, Message: "${body}" (Template: ${template_name || 'none'})`);
      return;
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
      const headers = {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      };

      const requestBody = template_name
        ? {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: clean,
            type: 'template',
            template: {
              name: template_name,
              language: { code: 'en_US' }
            }
          }
        : {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: clean,
            type: 'text',
            text: { body }
          };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      const responseJson = await response.json();
      this.logger.log(`WhatsApp API Response: ${JSON.stringify(responseJson)}`);
    } catch (err: any) {
      this.logger.error(`Failed to send WhatsApp message: ${err.message}`, err.stack);
    }
  }

  async connectTestDealer(dealerId: string, phone: string, whatsappNumber?: string) {
    await this.prisma.dealership.update({
      where: { id: dealerId },
      data: {
        phone: phone,
        whatsapp_number: whatsappNumber || phone,
      },
    });

    await this.prisma.dealerSettings.upsert({
      where: { dealership_id: dealerId },
      create: {
        dealership_id: dealerId,
        notify_daily_summary_sms: true,
        notify_daily_summary_push: true,
      },
      update: {
        notify_daily_summary_sms: true,
        notify_daily_summary_push: true,
      },
    });

    return { success: true };
  }
}
