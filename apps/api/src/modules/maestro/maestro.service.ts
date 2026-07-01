import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LeadPriority, LeadStage } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MaestroService {
  private readonly logger = new Logger(MaestroService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Daily Decay Cron execution
  async decayAllLeads() {
    const activeLeads = await this.prisma.lead.findMany({
      where: {
        stage: { notIn: ['closed', 'lost'] },
        deleted_at: null,
      },
    });

    const today = new Date().toISOString().split('T')[0];

    for (const lead of activeLeads) {
      // Check if lead had a qualifying interaction today
      const hasInteractionToday = await this.prisma.leadInteraction.findFirst({
        where: {
          lead_id: lead.id,
          created_at: {
            gte: new Date(today + 'T00:00:00Z'),
            lte: new Date(today + 'T23:59:59Z'),
          },
          type: {
            in: [
              'whatsapp_received',
              'call_inbound',
              'personalized_link_viewed',
              'stage_change',
              'vehicle_saved',
            ],
          },
        },
      });

      if (hasInteractionToday) {
        continue; // Skip decay
      }

      const newScore = Math.max(0, lead.lead_score - 2);
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: {
          lead_score: newScore,
        },
      });

      await this.prisma.leadInteraction.create({
        data: {
          dealership_id: lead.dealership_id,
          lead_id: lead.id,
          type: 'score_update',
          summary: `Nightly score decay of -2. New score: ${newScore}`,
          metadata: { decay: -2, new_score: newScore },
        },
      });
    }
    this.logger.log('Nightly lead score decay completed.');
  }

  // Formatting helper for Lakh (BD representation)
  formatLakh(amount: number): string {
    if (amount >= 100000) {
      const val = amount / 100000;
      return `${val.toFixed(val % 1 !== 0 ? 1 : 0)}L`;
    }
    return String(amount);
  }

  // Daily Summary Briefing Assembly (7:45 AM)
  async generateDailySummary(dealershipId: string): Promise<any> {
    const today = new Date();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(today.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    const dealer = await this.prisma.dealership.findUnique({
      where: { id: dealershipId },
    });
    if (!dealer) throw new NotFoundException('Dealer not found');

    const settings = await this.prisma.dealerSettings.findUnique({
      where: { dealership_id: dealershipId },
    });

    // 1. Yesterday's Performance
    const yesterdayDeals = await this.prisma.deal.findMany({
      where: {
        dealership_id: dealershipId,
        status: 'delivered',
        delivered_at: {
          gte: new Date(yesterdayStr + 'T00:00:00Z'),
          lte: new Date(yesterdayStr + 'T23:59:59Z'),
        },
      },
    });

    const unitsSold = yesterdayDeals.length;
    const revenue = yesterdayDeals.reduce((sum, d) => sum + Number(d.sale_price || 0), 0);
    const grossProfit = yesterdayDeals.reduce((sum, d) => sum + Number(d.gross_profit || 0), 0);

    const yesterdayLeads = await this.prisma.lead.findMany({
      where: {
        dealership_id: dealershipId,
        created_at: {
          gte: new Date(yesterdayStr + 'T00:00:00Z'),
          lte: new Date(yesterdayStr + 'T23:59:59Z'),
        },
      },
    });
    const newLeads = yesterdayLeads.length;

    const contactedLeads = await this.prisma.lead.count({
      where: {
        dealership_id: dealershipId,
        updated_at: {
          gte: new Date(yesterdayStr + 'T00:00:00Z'),
          lte: new Date(yesterdayStr + 'T23:59:59Z'),
        },
        stage: { not: 'new' },
      },
    });

    // 2. Urgent actions checklist selection
    const pendingApprovals = await this.prisma.deal.count({
      where: { dealership_id: dealershipId, status: 'pending_approval' },
    });

    const uncontactedSlaLeads = await this.prisma.lead.count({
      where: {
        dealership_id: dealershipId,
        stage: 'new',
        contact_sla_breached: true,
        deleted_at: null,
      },
    });

    const allAvailableVehicles = await this.prisma.vehicle.findMany({
      where: {
        dealership_id: dealershipId,
        status: 'available',
        deleted_at: null,
      },
    });

    const vehicleDays = allAvailableVehicles.map(v => {
      const dateToUse = v.acquisition_date || v.created_at;
      const diffTime = Math.abs(Date.now() - new Date(dateToUse).getTime());
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    });

    const agedCritical90 = vehicleDays.filter(days => days >= 90).length;

    const followupsDueToday = await this.prisma.lead.count({
      where: {
        dealership_id: dealershipId,
        next_follow_up: {
          gte: new Date(today.toISOString().split('T')[0] + 'T00:00:00Z'),
          lte: new Date(today.toISOString().split('T')[0] + 'T23:59:59Z'),
        },
        stage: { notIn: ['closed', 'lost'] },
        deleted_at: null,
      },
    });

    const aged60 = vehicleDays.filter(days => days === 60).length;

    const aged45 = vehicleDays.filter(days => days === 45).length;

    const urgentActions: any[] = [];
    if (pendingApprovals > 0) {
      urgentActions.push({
        type: 'pending_deal_approvals',
        count: pendingApprovals,
        message: `${pendingApprovals} deal(s) pending approval`,
        urgency: 'critical',
      });
    }
    if (uncontactedSlaLeads > 0) {
      urgentActions.push({
        type: 'uncontacted_leads_2h',
        count: uncontactedSlaLeads,
        message: `${uncontactedSlaLeads} leads uncontacted 2h+`,
        urgency: 'high',
      });
    }
    if (agedCritical90 > 0) {
      urgentActions.push({
        type: 'aged_vehicle_90',
        count: agedCritical90,
        message: `${agedCritical90} vehicle(s) on lot 90d+`,
        urgency: 'high',
      });
    }
    if (followupsDueToday > 0) {
      urgentActions.push({
        type: 'follow_ups_due',
        count: followupsDueToday,
        message: `${followupsDueToday} follow-up(s) due today`,
        urgency: 'medium',
      });
    }
    if (aged60 > 0) {
      urgentActions.push({
        type: 'aged_vehicle_60',
        count: aged60,
        message: `${aged60} vehicle(s) on lot 60d`,
        urgency: 'medium',
      });
    }
    if (aged45 > 0) {
      urgentActions.push({
        type: 'aged_vehicle_45',
        count: aged45,
        message: `${aged45} vehicle(s) on lot 45d`,
        urgency: 'low',
      });
    }

    const topAction = urgentActions[0]?.message || 'No urgent actions';

    // 3. Market Trend Snapshot
    const activeVehicles = await this.prisma.vehicle.findMany({
      where: { dealership_id: dealershipId, status: 'available', deleted_at: null },
    });

    const marketSnapshot: any[] = [];
    for (const v of activeVehicles) {
      const cluster = await this.prisma.imvCluster.findFirst({
        where: {
          make: v.make,
          model: v.model,
          year: v.year,
          district: dealer.district,
        },
      });
      if (cluster && cluster.pct_change_30d && Math.abs(Number(cluster.pct_change_30d)) >= 3) {
        marketSnapshot.push({
          make: v.make,
          model: v.model,
          year: v.year,
          pct_change_30d: Number(cluster.pct_change_30d),
          trend_direction: cluster.trend_direction,
        });
      }
    }

    const firstTrend = marketSnapshot[0];
    const trendNote = firstTrend
      ? `${firstTrend.make} ${firstTrend.model} ${firstTrend.trend_direction === 'up' ? 'up' : 'down'} ${Math.abs(firstTrend.pct_change_30d).toFixed(0)}%`
      : 'Market stable';

    // 4. SMS Delivery Formatter (condensed under 160-char)
    const dateFormatted = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); // "20 Jun"
    const revenueShort = this.formatLakh(revenue);

    const smsBody = `Garisale ${dateFormatted}: ${unitsSold} sale(s), BDT ${revenueShort}. Urgent: ${topAction}. ${trendNote}. app.garisale.com`;
    const finalSmsBody = smsBody.slice(0, 160);

    // Queue mock SMS
    if (settings?.notify_daily_summary_sms) {
      await this.eventEmitter.emit('automation.send_sms', {
        to: dealer.phone,
        body: finalSmsBody,
        dealership_id: dealershipId,
      });
    }

    // In-app briefing save (cache)
    await this.redis.set(`cache:maestro:${dealershipId}:briefing`, JSON.stringify({
      unitsSold,
      revenue,
      grossProfit,
      newLeads,
      contactedLeads,
      urgentActions,
      marketSnapshot,
      sms: finalSmsBody,
    }), 86400);

    return {
      success: true,
      data: {
        unitsSold,
        revenue,
        grossProfit,
        newLeads,
        contactedLeads,
        urgentActions,
        sms: finalSmsBody,
      },
    };
  }

  // 6 Insight Evaluators
  async generateDailyInsights(dealershipId: string): Promise<any> {
    const dealer = await this.prisma.dealership.findUnique({
      where: { id: dealershipId },
    });
    if (!dealer) throw new NotFoundException('Dealer not found');

    const insights: any[] = [];

    // Evaluator 1: PRICING
    const pricingVehicles = await this.prisma.vehicle.findMany({
      where: { dealership_id: dealershipId, status: 'available', deleted_at: null },
    });

    const pricingCandidates: any[] = [];
    for (const v of pricingVehicles) {
      // Find listing in marketplace
      const listing = await this.prisma.marketplaceListing.findFirst({
        where: { vehicle_id: v.id, status: 'active' },
      });
      if (listing && listing.imv_p50) {
        const score = Number(listing.deal_score || 0);
        const dateToUse = v.acquisition_date || v.created_at;
        const diffTime = Math.abs(Date.now() - new Date(dateToUse).getTime());
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const imvP50 = Number(listing.imv_p50);

        let triggered = false;
        if (days >= 45 && score > 0) triggered = true;
        else if (days >= 60 && score >= -0.05) triggered = true;
        else if (score >= 0.10 && days >= 21) triggered = true;

        if (triggered && listing.imv_sample_size && listing.imv_sample_size >= 10) {
          const targetGoodDeal = imvP50 * 0.94;
          const reduction = Number(v.asking_price) - targetGoodDeal;
          const reductionRounded = Math.round(reduction / 5000) * 5000;

          pricingCandidates.push({
            vehicle_id: v.id,
            stock_no: v.stock_no,
            make: v.make,
            model: v.model,
            year: v.year,
            asking_price: Number(v.asking_price),
            imv_p50: imvP50,
            deal_score: score,
            days_on_lot: days,
            recommended_price: targetGoodDeal,
            reduction_rounded: reductionRounded,
          });
        }
      }
    }

    if (pricingCandidates.length > 0) {
      const top = pricingCandidates[0];
      const count = pricingCandidates.length;
      const title = 'Inventory Repricing Opportunity';
      const message = count === 1
        ? `Your ${top.year} ${top.make} ${top.model} (SK-${top.stock_no}) has been listed ${top.days_on_lot} days. Reduce by BDT ${top.reduction_rounded.toLocaleString()} to enter 'Good Deal' — priced at BDT ${top.recommended_price.toLocaleString()}.`
        : `${count} vehicles are priced above market and sitting over 45 days. Top candidate: ${top.year} ${top.make} ${top.model} — reduce BDT ${top.reduction_rounded.toLocaleString()} to Good Deal.`;

      const priority = Math.min(10, 5 + (top.days_on_lot >= 90 ? 3 : top.days_on_lot >= 60 ? 2 : 1) + (top.deal_score > 0.2 ? 2 : 0));

      insights.push({
        dealership_id: dealershipId,
        type: 'PRICING',
        priority,
        title,
        message,
        supporting_data: { vehicles: pricingCandidates },
        deep_link: count === 1 ? `/inventory/vehicles/${top.vehicle_id}` : '/inventory?filter=overpriced',
      });
    }

    // Evaluator 2: DEMAND
    // Check district trend and see if dealer has 0 stock of that make/model
    const highTrendClusters = await this.prisma.imvCluster.findMany({
      where: {
        district: dealer.district,
        pct_change_30d: { gte: 10 },
        sample_size: { gte: 10 },
      },
    });

    const demandSignals: any[] = [];
    for (const c of highTrendClusters) {
      const count = await this.prisma.vehicle.count({
        where: { dealership_id: dealershipId, make: c.make, model: c.model, status: 'available', deleted_at: null },
      });
      if (count === 0) {
        demandSignals.push(c);
      }
    }

    if (demandSignals.length > 0) {
      const top = demandSignals[0];
      insights.push({
        dealership_id: dealershipId,
        type: 'DEMAND',
        priority: Math.min(9, 4 + (top.pct_change_30d >= 30 ? 3 : top.pct_change_30d >= 20 ? 2 : 1) + 1), // base 4 + trend + zero stock bonus (+1)
        title: 'High Regional Demand Identified',
        message: `Demand for ${top.make} ${top.model} in ${dealer.district} is up ${Number(top.pct_change_30d).toFixed(0)}% this month. You currently have 0 in stock.`,
        supporting_data: { demand_signals: demandSignals },
        deep_link: `/inventory/vehicles/add?prefill_make=${top.make}&prefill_model=${top.model}`,
      });
    }

    // Evaluator 3: CONVERSION
    // Average response time > 2 hours or new leads with SLA breached
    const totalLeads = await this.prisma.lead.count({
      where: { dealership_id: dealershipId, source: 'marketplace', deleted_at: null },
    });

    const breachedLeadsCount = await this.prisma.lead.count({
      where: { dealership_id: dealershipId, stage: 'new', contact_sla_breached: true, deleted_at: null },
    });

    if (breachedLeadsCount >= 5 && totalLeads >= 10) {
      insights.push({
        dealership_id: dealershipId,
        type: 'CONVERSION',
        priority: 8, // base 6 + volume bonus (+2)
        title: 'Response SLA Breach Warning',
        message: `You have ${breachedLeadsCount} new leads that have breached the 2-hour contact SLA limit this week. Direct response action is required.`,
        supporting_data: { uncontacted_count: breachedLeadsCount },
        deep_link: '/crm/leads?filter=stage:new',
      });
    }

    // Evaluator 4: EXPENSE
    // Recon cost eats target margin on vehicles
    const expenseVehicles = await this.prisma.vehicle.findMany({
      where: { dealership_id: dealershipId, status: 'available', deleted_at: null },
    });

    let opexBottleneckCount = 0;
    const expenseCandidates: any[] = [];
    const targetMargin = Number(dealer.target_margin_pct || 20) / 100;

    for (const v of expenseVehicles) {
      const listing = await this.prisma.marketplaceListing.findFirst({
        where: { vehicle_id: v.id },
      });
      if (listing && listing.imv_p50) {
        const p50 = Number(listing.imv_p50);
        const reconTotal = Number(v.recon_total || 0);
        if (reconTotal > p50 * targetMargin) {
          opexBottleneckCount++;
          expenseCandidates.push(v);
        }
      }
    }

    if (opexBottleneckCount >= 5) {
      const top = expenseCandidates[0];
      insights.push({
        dealership_id: dealershipId,
        type: 'EXPENSE',
        priority: 6, // base 3 + margin impact (+3)
        title: 'Reconditioning Expense Leakage',
        message: `Reconditioning costs on ${top.make} ${top.model} models are averaging above your ${Number(dealer.target_margin_pct).toFixed(0)}% margin target. This has affected ${opexBottleneckCount} vehicles.`,
        supporting_data: { vehicle_count: opexBottleneckCount },
        deep_link: `/analytics/reports/expenses?filter_make=${top.make}`,
      });
    }

    // Evaluator 5: AUTOMATION
    // WhatsApp lead ads not connected but leads coming in
    const activeRulesCount = await this.prisma.automationRule.count({
      where: { dealership_id: dealershipId, channel: 'whatsapp', is_active: true },
    });
    const fbLeads = await this.prisma.lead.count({
      where: { dealership_id: dealershipId, source: 'facebook_lead_ad', deleted_at: null },
    });

    if (activeRulesCount === 0 && fbLeads > 0) {
      insights.push({
        dealership_id: dealershipId,
        type: 'AUTOMATION',
        priority: 4, // base 3 + 1
        title: 'Unused Automation Features',
        message: 'You have active Facebook leads but have not configured any WhatsApp greeting or follow-up sequences. Enable them to capture leads instantly.',
        supporting_data: { active_rules: 0, fb_leads: fbLeads },
        deep_link: '/automation/whatsapp?setup=lead_followup',
      });
    }

    // Evaluator 6: RECON_QUALITY
    // Average recon time > 14 days
    const completedRecons = await this.prisma.reconTask.findMany({
      where: {
        status: 'complete',
        updated_at: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }, // 60 days
      },
    });

    let totalDurationDays = 0;
    let taskCount = 0;
    for (const t of completedRecons) {
      // Find matching vehicle
      const v = await this.prisma.vehicle.findFirst({
        where: { id: t.vehicle_id, dealership_id: dealershipId },
      });
      if (v) {
        const diffMs = t.updated_at.getTime() - t.created_at.getTime();
        totalDurationDays += diffMs / (1000 * 60 * 60 * 24);
        taskCount++;
      }
    }

    const avgReconTime = taskCount > 0 ? totalDurationDays / taskCount : 0;
    if (avgReconTime > 14) {
      insights.push({
        dealership_id: dealershipId,
        type: 'RECON_QUALITY',
        priority: Math.min(8, 4 + (avgReconTime > 21 ? 2 : 0)), // base 4 + severity
        title: 'Reconditioning Quality Bottleneck',
        message: `Average recon time for your last ${taskCount} vehicles is ${avgReconTime.toFixed(0)} days, exceeding the 14-day operational limit.`,
        supporting_data: { avg_recon_time: avgReconTime },
        deep_link: '/inventory/recon?filter=overdue',
      });
    }

    // Sort by priority DESC, tie break CONVERSION > PRICING > DEMAND > RECON_QUALITY > EXPENSE > AUTOMATION
    const typeOrder = ['CONVERSION', 'PRICING', 'DEMAND', 'RECON_QUALITY', 'EXPENSE', 'AUTOMATION'];
    insights.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
    });

    const top5 = insights.slice(0, 5);

    // Replace previous uncompleted insights
    await this.prisma.maestroInsight.deleteMany({
      where: { dealership_id: dealershipId, is_actioned: false, is_dismissed: false },
    });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const saved: any[] = [];
    for (const item of top5) {
      const insight = await this.prisma.maestroInsight.create({
        data: {
          dealership_id: dealershipId,
          type: item.type,
          priority: item.priority,
          title: item.title,
          message: item.message,
          supporting_data: item.supporting_data,
          deep_link: item.deep_link,
          expires_at: expiresAt,
        },
      });
      saved.push(insight);
    }

    return saved;
  }
}
