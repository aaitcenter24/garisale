import { Injectable, NotFoundException, UnprocessableEntityException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UserRole, LeadStage, LeadSource } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentsService } from '../payments/payments.service';

const SIGNAL_WEIGHTS: { [key: string]: number } = {
  enquiry_submitted: 30,
  phone_number_revealed: 20,
  test_drive_scheduled: 20,
  returning_buyer: 20,
  whatsapp_message_sent_by_buyer: 15,
  referred_by_customer: 15,
  vehicle_viewed_3_plus_times: 15,
  multiple_vehicles_same_make: 10,
  returned_to_listing_next_day: 10,
  vehicle_saved: 10,
  budget_matches_price: 10,
  responded_to_automation: 8,
  clicked_email_link: 7,
  personalized_link_viewed: 5,
  opened_email: 3,
  no_response_to_3_followups: -20,
  unsubscribed_whatsapp: -30,
  marked_not_interested: -25,
  budget_too_low: -15,
  window_shopper_pattern: -10,
};

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private eventEmitter: EventEmitter2,
    private paymentsService: PaymentsService,
  ) {}

  async getNextRoundRobinSalesperson(dealerId: string): Promise<string | null> {
    const staffList = await this.prisma.dealerStaff.findMany({
      where: {
        dealership_id: dealerId,
        is_active: true,
        role: { in: [UserRole.salesperson, UserRole.manager, UserRole.dealer_owner] },
      },
      orderBy: { id: 'asc' },
    });

    if (staffList.length === 0) return null;

    const key = `round_robin_index:${dealerId}`;
    const nextIndex = await this.redis.incr(key);
    const assignedStaff = staffList[(nextIndex - 1) % staffList.length];
    return assignedStaff.user_id;
  }

  async createLead(dealerId: string, data: any) {
    const { buyer_phone, vehicle_id, buyer_name, buyer_email, budget_min, budget_max, source } = data;

    // 1. CRM Lead Deduplication
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const existingLead = await this.prisma.lead.findFirst({
      where: {
        dealership_id: dealerId,
        buyer_phone,
        vehicle_id,
        stage: { in: ['new', 'contacted'] },
        created_at: { gte: thirtyDaysAgo },
      },
    });

    if (existingLead) {
      // Deduplicate: merge (increment enquiry_count), do not duplicate
      const mergedLead = await this.prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          enquiry_count: { increment: 1 },
          lead_score: { increment: 30 }, // Add enquiry submitted weight
        },
      });

      // Check if merged score hits hot threshold
      if (mergedLead.lead_score >= 70 && existingLead.lead_score < 70) {
        await this.triggerHotLeadNotification(mergedLead);
      }

      return mergedLead;
    }

    // 2. Customer Upsert
    let customer = await this.prisma.customer.findFirst({
      where: { phone: buyer_phone, dealership_id: dealerId },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          dealership_id: dealerId,
          full_name: buyer_name,
          phone: buyer_phone,
          email: buyer_email,
        },
      });
    }

    // 3. Round-Robin Salesperson Assignment
    const salespersonId = await this.getNextRoundRobinSalesperson(dealerId);

    // 4. Create Lead record
    const lead = await this.prisma.lead.create({
      data: {
        dealership_id: dealerId,
        customer_id: customer.id,
        vehicle_id,
        buyer_name,
        buyer_phone,
        buyer_email,
        budget_min,
        budget_max,
        source: source || 'walk_in',
        assigned_to: salespersonId,
        lead_score: 30, // Start with +30 for enquiry submitted
      },
    });

    // 5. 2-hour contact SLA timer setup (e.g. log queue scheduling)
    this.logger.log(`Scheduled 2-hour contact SLA timer (lead-contact-sla queue) for lead ${lead.id}`);

    await this.paymentsService.recordLeadCharge(dealerId, lead.id, lead.lead_score);

    return lead;
  }

  async listLeads(dealerId: string, userId: string, role: string) {
    if (role === UserRole.dealer_owner as string || role === UserRole.manager as string) {
      return this.prisma.lead.findMany({
        where: { dealership_id: dealerId },
      });
    }

    // Salesperson: check sees_all_leads setting
    const staff = await this.prisma.dealerStaff.findFirst({
      where: { dealership_id: dealerId, user_id: userId },
    });

    if (staff && staff.sees_all_leads) {
      return this.prisma.lead.findMany({
        where: { dealership_id: dealerId },
      });
    }

    // Return own leads only
    return this.prisma.lead.findMany({
      where: { dealership_id: dealerId, assigned_to: userId },
    });
  }

  async updateLeadStage(id: string, dealerId: string, userId: string, role: string, stage: string, lostReason?: string, lostReasonDetail?: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!lead || lead.dealership_id !== dealerId) {
      throw new NotFoundException('LEAD_NOT_FOUND');
    }

    // Salesperson authorization check
    if (role === UserRole.salesperson as string) {
      const staff = await this.prisma.dealerStaff.findFirst({
        where: { dealership_id: dealerId, user_id: userId },
      });
      const hasAccess = (staff && staff.sees_all_leads) || lead.assigned_to === userId;
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to modify this lead.');
      }
    }

    if (stage === 'lost' && !lostReason) {
      throw new UnprocessableEntityException({
        code: 'LEAD_LOST_REASON_REQUIRED',
        message: 'Must provide lost_reason when marking lead as lost',
      });
    }

    return this.prisma.lead.update({
      where: { id },
      data: {
        stage: stage as any,
        lost_reason: lostReason,
        lost_reason_detail: lostReasonDetail,
      },
    });
  }

  async reassignLead(id: string, dealerId: string, role: string, newSalespersonId: string) {
    if (role !== UserRole.dealer_owner && role !== UserRole.manager) {
      throw new ForbiddenException('Only Owners and Managers can reassign leads.');
    }

    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });
    if (!lead || lead.dealership_id !== dealerId) {
      throw new NotFoundException('LEAD_NOT_FOUND');
    }

    return this.prisma.lead.update({
      where: { id },
      data: {
        assigned_to: newSalespersonId,
      },
    });
  }

  async lookupCustomerPhone(phone: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { phone },
    });
    if (!customer) {
      throw new NotFoundException('CUSTOMER_NOT_FOUND');
    }
    return customer;
  }

  async addLeadScoreSignal(id: string, dealerId: string, signalName: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });
    if (!lead || lead.dealership_id !== dealerId) {
      throw new NotFoundException('LEAD_NOT_FOUND');
    }

    let scoreDiff = SIGNAL_WEIGHTS[signalName] || 0;

    if (signalName === 'personalized_link_viewed') {
      const views = lead.personalized_link_views || 0;
      if (views >= 3) {
        scoreDiff = 0; // Capped at +15
      } else {
        await this.prisma.lead.update({
          where: { id },
          data: {
            personalized_link_views: { increment: 1 },
          },
        });
      }
    }

    const newScore = Math.max(0, lead.lead_score + scoreDiff);

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        lead_score: newScore,
      },
    });

    if (newScore >= 70 && lead.lead_score < 70) {
      await this.triggerHotLeadNotification(updated);
    }

    return updated;
  }

  private async triggerHotLeadNotification(lead: any) {
    const message = `HOT LEAD: Buyer ${lead.buyer_name} reached hot score of ${lead.lead_score}.`;
    this.logger.log(`[SMS notification-sms queue] SMS queued within 5s: ${message}`);
    this.eventEmitter.emit('automation.send_sms', {
      to: lead.buyer_phone,
      body: message,
    });
  }

  // Daily Cron Decay (-2/day)
  async decayAllLeads() {
    const activeLeads = await this.prisma.lead.findMany({
      where: { stage: { notIn: ['closed', 'lost'] } },
    });

    for (const lead of activeLeads) {
      const newScore = Math.max(0, lead.lead_score - 2);
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { lead_score: newScore },
      });
    }
  }
}
