import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/database/prisma.service';
import { MockPrismaService } from '../../src/modules/database/mock-prisma.service';
import { TokenService } from '../../src/modules/auth/token.service';
import { ImvService } from '../../src/modules/imv/imv.service';
import { MaestroService } from '../../src/modules/maestro/maestro.service';
import { AutomationRuleEngine } from '../../src/modules/automation/automation-rule.engine';
import { UserRole, UserStatus, DealerStatus, ListingStatus, VehicleCondition, DealRating, ImvOverrideType, LeadStage } from '@prisma/client';
import { getQueueToken } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import { RedisService } from '../../src/modules/redis/redis.service';
import { SyncProcessor } from '../../src/modules/sync/sync.processor';
import { ImvProcessor } from '../../src/modules/imv/imv.processor';
import { MaestroProcessor } from '../../src/modules/maestro/maestro.processor';

class MockQueue {
  constructor(public name: string) {}
  async add() { return { id: 'mock-job-id' }; }
}

describe('Garisale AI + Automation Engine E2E (Step 5 & Step 6)', () => {
  let app: INestApplication;
  let mockPrisma: MockPrismaService;
  let tokenService: TokenService;
  let imvService: ImvService;
  let maestroService: MaestroService;
  let ruleEngine: AutomationRuleEngine;
  let eventEmitter: EventEmitter2;
  let redisService: RedisService;

  const dealerId = '550e8400-e29b-41d4-a716-44665544000c';
  let ownerId: string;
  let adminToken: string;
  let dealerToken: string;

  beforeAll(async () => {
    mockPrisma = new MockPrismaService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(getQueueToken('sync-vehicle'))
      .useValue(new MockQueue('sync-vehicle'))
      .overrideProvider(getQueueToken('sync-vehicle-failed'))
      .useValue(new MockQueue('sync-vehicle-failed'))
      .overrideProvider(getQueueToken('imv-recalculate'))
      .useValue(new MockQueue('imv-recalculate'))
      .overrideProvider(getQueueToken('maestro-insights'))
      .useValue(new MockQueue('maestro-insights'))
      .overrideProvider(SyncProcessor)
      .useValue({})
      .overrideProvider(ImvProcessor)
      .useValue({})
      .overrideProvider(MaestroProcessor)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new (require('../../src/common/filters/http-exception.filter').HttpExceptionFilter)());
    await app.init();

    tokenService = moduleFixture.get<TokenService>(TokenService);
    imvService = moduleFixture.get<ImvService>(ImvService);
    maestroService = moduleFixture.get<MaestroService>(MaestroService);
    ruleEngine = moduleFixture.get<AutomationRuleEngine>(AutomationRuleEngine);
    eventEmitter = moduleFixture.get<EventEmitter2>(EventEmitter2);
    redisService = moduleFixture.get<RedisService>(RedisService);

    await mockPrisma.setDealerContext(dealerId);

    // Seed Dealer Owner User
    const ownerUser = await mockPrisma.user.create({
      data: {
        phone: '+8801711111110',
        full_name: 'Dealer Owner A',
        role: UserRole.dealer_owner,
        status: UserStatus.active,
      },
    });
    ownerId = ownerUser.id;

    // Seed Dealership
    await mockPrisma.dealership.create({
      data: {
        id: dealerId,
        owner_id: ownerId,
        business_name: 'Alpha Motors',
        slug: 'alpha-motors',
        district: 'Dhaka',
        division: 'Dhaka',
        phone: '+8801700000001',
        status: DealerStatus.active,
        website_url: 'alpha-motors.com',
      },
    });

    // Seed Dealer Settings
    await mockPrisma.dealerSettings.create({
      data: {
        dealership_id: dealerId,
        notify_daily_summary_sms: true,
        notify_daily_summary_push: true,
      },
    });

    // Seed Admin User
    const adminUser = await mockPrisma.user.create({
      data: {
        phone: '+8801711111119',
        full_name: 'System Admin',
        role: UserRole.admin_user,
        status: UserStatus.active,
      },
    });

    adminToken = await tokenService.issueAdminAccessToken({
      user_id: adminUser.id,
      role: 'super_admin',
    });

    dealerToken = await tokenService.issueDealerAccessToken({
      user_id: ownerId,
      dealer_id: dealerId,
      role: UserRole.dealer_owner,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await mockPrisma.setDealerContext(dealerId);
    mockPrisma.mockData.marketplaceListing.length = 0;
    mockPrisma.mockData.imvCluster.length = 0;
    mockPrisma.mockData.lead.length = 0;
    mockPrisma.mockData.leadInteraction.length = 0;
    mockPrisma.mockData.customer.length = 0;
    mockPrisma.mockData.platformCalendar.length = 0;
    mockPrisma.mockData.automationRule.length = 0;
    mockPrisma.mockData.automationLog.length = 0;
    mockPrisma.mockData.imvOverride.length = 0;
    mockPrisma.mockData.vehicle.length = 0;
    mockPrisma.mockData.vehicleStatusHistory.length = 0;
    mockPrisma.mockData.reconAssessment.length = 0;
    mockPrisma.mockData.reconTask.length = 0;
    mockPrisma.mockData.deal.length = 0;
    mockPrisma.mockData.dealPayment.length = 0;
    mockPrisma.mockData.expenseCategory.length = 0;
    mockPrisma.mockData.vehicleExpense.length = 0;
    mockPrisma.mockData.operationalExpense.length = 0;
    mockPrisma.mockData.syncAuditLog.length = 0;
    mockPrisma.mockData.priceTrend.length = 0;
    mockPrisma.mockData.imvCalculationRun.length = 0;
    mockPrisma.mockData.maestroInsight.length = 0;

    // Clear Redis
    const today = new Date().toISOString().split('T')[0];
    const limitKey = `rate:automation:whatsapp:${dealerId}:${today}`;
    await redisService.del(limitKey);
  });

  describe('Step 5 - IMV Pricing Algorithm math & guards', () => {
    it('should calculate correct percentiles and remove outliers when sample size >= 10', async () => {
      // Seed 10 comparable active listings
      const basePrice = 1000000;
      for (let i = 0; i < 10; i++) {
        await mockPrisma.marketplaceListing.create({
          data: {
            make: 'Toyota',
            model: 'Premio',
            year: 2018,
            mileage_bucket: '30-60K',
            mileage_km: 40000,
            condition: VehicleCondition.reconditioned,
            district: 'Dhaka',
            division: 'Dhaka',
            asking_price: basePrice + i * 20000,
            status: ListingStatus.active,
          },
        });
      }

      const stats = await imvService.computeClusterStats({
        make: 'Toyota',
        model: 'Premio',
        year: 2018,
        mileage_bucket: '30-60K',
        condition: VehicleCondition.reconditioned,
        district: 'Dhaka',
      });

      expect(stats.sample_size).toBe(10);
      expect(stats.confidence).toBe('medium');
      expect(stats.p50).toBe(1090000); // Median of 10 prices from 1,000,000 to 1,180,000
    });

    it('should trigger unrated guard (deal_rating = unrated) if listings < 5', async () => {
      for (let i = 0; i < 3; i++) {
        await mockPrisma.marketplaceListing.create({
          data: {
            make: 'Toyota',
            model: 'Premio',
            year: 2018,
            mileage_bucket: '30-60K',
            mileage_km: 40000,
            condition: VehicleCondition.reconditioned,
            district: 'Dhaka',
            division: 'Dhaka',
            asking_price: 1500000,
            status: ListingStatus.active,
          },
        });
      }

      const stats = await imvService.computeClusterStats({
        make: 'Toyota',
        model: 'Premio',
        year: 2018,
        mileage_bucket: '30-60K',
        condition: VehicleCondition.reconditioned,
        district: 'Dhaka',
      });

      expect(stats.confidence).toBe('none');
      expect(stats.p50).toBeNull();
    });

    it('should fall back to division region data if district is insufficient', async () => {
      // Seed 3 in district (Dhaka), 6 in division (Dhaka/other district but same division)
      for (let i = 0; i < 3; i++) {
        await mockPrisma.marketplaceListing.create({
          data: {
            make: 'Toyota',
            model: 'Premio',
            year: 2018,
            mileage_bucket: '30-60K',
            mileage_km: 40000,
            condition: VehicleCondition.reconditioned,
            district: 'Dhaka',
            division: 'Dhaka',
            asking_price: 1200000,
            status: ListingStatus.active,
          },
        });
      }

      for (let i = 0; i < 3; i++) {
        await mockPrisma.marketplaceListing.create({
          data: {
            make: 'Toyota',
            model: 'Premio',
            year: 2018,
            mileage_bucket: '30-60K',
            mileage_km: 40000,
            condition: VehicleCondition.reconditioned,
            district: 'Gazipur', // different district
            division: 'Dhaka', // same division
            asking_price: 1250000,
            status: ListingStatus.active,
          },
        });
      }

      const stats = await imvService.computeClusterStats({
        make: 'Toyota',
        model: 'Premio',
        year: 2018,
        mileage_bucket: '30-60K',
        condition: VehicleCondition.reconditioned,
        district: 'Dhaka',
      });

      expect(stats.fallback_level).toBe('division');
      expect(stats.sample_size).toBe(6);
      expect(stats.p50).toBe(1225000);
    });

    it('should calculate correct deal score and rating thresholds', async () => {
      // Seed cluster stats
      await mockPrisma.imvCluster.create({
        data: {
          make: 'Toyota',
          model: 'Premio',
          year: 2018,
          mileage_bucket: '30-60K',
          condition: VehicleCondition.reconditioned,
          district: 'Dhaka',
          division: 'Dhaka',
          sample_size: 15,
          price_min: 1000000,
          price_max: 2000000,
          price_mean: 1400000,
          price_stddev: 200000,
          p5: 1100000,
          p10: 1200000,
          p25: 1300000,
          p50: 1400000, // Benchmark median
          p75: 1500000,
          p90: 1600000,
          p95: 1700000,
          p99: 1800000,
          trend_direction: 'stable',
          confidence: 'medium',
        },
      });

      // Listing with asking_price = 1,200,000 BDT -> deal_score = -0.1429 (Good Deal)
      const listing = await mockPrisma.marketplaceListing.create({
        data: {
          dealership_id: dealerId,
          vehicle_id: 'vehicle-uuid-1',
          make: 'Toyota',
          model: 'Premio',
          year: 2018,
          mileage_bucket: '30-60K',
          mileage_km: 40000,
          condition: VehicleCondition.reconditioned,
          district: 'Dhaka',
          division: 'Dhaka',
          asking_price: 1200000,
          status: ListingStatus.active,
        },
      });

      const updated = await imvService.calculateSingleListingImv('vehicle-uuid-1');
      expect(updated).not.toBeNull();
      expect(Number(updated!.deal_score).toFixed(4)).toBe('-0.1429');
      expect(updated!.deal_rating).toBe(DealRating.good_deal);
    });

    it('should execute 8-stage nightly recalculation job', async () => {
      // Seed active listings
      await mockPrisma.marketplaceListing.create({
        data: {
          make: 'Toyota',
          model: 'Allion',
          year: 2019,
          mileage_bucket: '30-60K',
          mileage_km: 40000,
          condition: VehicleCondition.reconditioned,
          district: 'Dhaka',
          division: 'Dhaka',
          asking_price: 1800000,
          status: ListingStatus.active,
        },
      });
      // Need at least 5 for calculations to not return null
      for (let i = 0; i < 5; i++) {
        await mockPrisma.marketplaceListing.create({
          data: {
            make: 'Toyota',
            model: 'Allion',
            year: 2019,
            mileage_bucket: '30-60K',
            mileage_km: 40000,
            condition: VehicleCondition.reconditioned,
            district: 'Dhaka',
            division: 'Dhaka',
            asking_price: 1800000 + i * 10000,
            status: ListingStatus.active,
          },
        });
      }

      const run = await imvService.runNightlyRecalculation();
      expect(run.status).toBe('complete');
      expect(run.clusters_updated).toBeGreaterThan(0);
      expect(run.listings_rated).toBeGreaterThan(0);

      // Verify trend archived
      const trends = await mockPrisma.priceTrend.findMany({
        where: { make: 'Toyota', model: 'Allion' },
      });
      expect(trends.length).toBe(1);
    });
  });

  describe('Step 5 - Lead Scoring & Briefings', () => {
    it('should cross hot lead threshold and emit notification-sms alert within 5s', async () => {
      // Seed lead with score 62
      const lead = await mockPrisma.lead.create({
        data: {
          dealership_id: dealerId,
          buyer_name: 'Habib Rahman',
          buyer_phone: '+8801911111111',
          lead_score: 62,
          stage: LeadStage.new,
        },
      });

      const smsSpy = jest.fn();
      eventEmitter.on('automation.send_sms', smsSpy);

      // Add signal vehicle_viewed_3_plus_times (+15)
      await request(app.getHttpServer())
        .post(`/api/v1/leads/${lead.id}/score-signal`)
        .set('Authorization', `Bearer ${dealerToken}`) // we mock context
        .send({ signal: 'vehicle_viewed_3_plus_times' })
        .expect(HttpStatus.OK);

      // Verify score is 77
      const updated = await mockPrisma.lead.findUnique({ where: { id: lead.id } });
      expect(updated.lead_score).toBe(77);

      // SMS triggered
      expect(smsSpy).toHaveBeenCalled();
      const payload = smsSpy.mock.calls[0][0];
      expect(payload.to).toBe('+8801911111111');
      expect(payload.body).toContain('HOT LEAD');
    });

    it('should decay lead scores daily by 2 points', async () => {
      const lead = await mockPrisma.lead.create({
        data: {
          dealership_id: dealerId,
          buyer_name: 'Habib Rahman',
          buyer_phone: '+8801911111111',
          lead_score: 50,
          stage: LeadStage.new,
        },
      });

      // Execute daily decay
      await maestroService.decayAllLeads();

      const updated = await mockPrisma.lead.findUnique({ where: { id: lead.id } });
      expect(updated.lead_score).toBe(48);
    });

    it('should generate morning briefing SMS with lakh notation under 160 characters', async () => {
      // Seed a delivered deal yesterday (sale_price = 2,850,000 BDT)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await mockPrisma.deal.create({
        data: {
          dealership_id: dealerId,
          status: 'delivered',
          sale_price: 2850000,
          gross_profit: 300000,
          delivered_at: yesterday,
        },
      });

      const res = await maestroService.generateDailySummary(dealerId);
      expect(res.success).toBe(true);

      const sms = res.data.sms;
      expect(sms.length).toBeLessThanOrEqual(160);
      expect(sms).toContain('BDT 28.5L');
    });

    it('should trigger Conversion insight if response time exceeds 2h', async () => {
      // Seed 10 marketplace leads with SLA breached
      for (let i = 0; i < 10; i++) {
        await mockPrisma.lead.create({
          data: {
            dealership_id: dealerId,
            buyer_name: `Buyer ${i}`,
            buyer_phone: `+880191111112${i}`,
            lead_score: 30,
            stage: LeadStage.new,
            source: 'marketplace',
            contact_sla_breached: true,
          },
        });
      }

      const insights = await maestroService.generateDailyInsights(dealerId);
      const conversion = insights.find((ins: any) => ins.type === 'CONVERSION');

      expect(conversion).toBeDefined();
      expect(conversion.priority).toBe(8); // base 6 + volume bonus (+2)
      expect(conversion.title).toContain('Response SLA');
    });
  });

  describe('Step 6 - Automation Hub sequences & rules', () => {
    it('should block circular automation rule loops at depth 3', async () => {
      // Loop test: Rule A: lead.created -> whatsapp message with emitted_event = whatsapp.received
      // Rule B: whatsapp.received -> lead.created
      const ruleA = await mockPrisma.automationRule.create({
        data: {
          dealership_id: dealerId,
          name: 'Rule A',
          trigger_event: 'lead.created',
          channel: 'whatsapp',
          actions: { template_body: 'Hello', emitted_event: 'whatsapp.received' },
        },
      });

      const ctx = {
        dealerId,
        triggerEvent: 'lead.created',
        chainDepth: 3, // Already hit depth 3
      };

      await ruleEngine.evaluate('lead.created', ctx);

      // Check log shows skipped (loop_detected)
      const logs = await mockPrisma.automationLog.findMany({
        where: { rule_id: ruleA.id, status: 'skipped' },
      });
      expect(logs.length).toBe(1);
      expect(logs[0].error_message).toBe('loop_detected');
    });

    it('should skip sending and mark skipped when contact daily limit is reached (max 3)', async () => {
      const contactPhone = '+8801999999991';
      const rule = await mockPrisma.automationRule.create({
        data: {
          dealership_id: dealerId,
          name: 'Day 0 greeting',
          trigger_event: 'lead.created',
          channel: 'whatsapp',
          actions: { template_body: 'Greeting' },
        },
      });

      const ctx = {
        dealerId,
        triggerEvent: 'lead.created',
        chainDepth: 1,
        contactPhone,
      };

      // Send 3 times
      await ruleEngine.evaluate('lead.created', ctx);
      await ruleEngine.evaluate('lead.created', ctx);
      await ruleEngine.evaluate('lead.created', ctx);

      // 4th send
      await ruleEngine.evaluate('lead.created', ctx);

      // Check logs
      const logs = await mockPrisma.automationLog.findMany({
        where: { rule_id: rule.id },
      });

      const skipped = logs.filter((l: any) => l.status === 'skipped');
      expect(skipped.length).toBe(1);
      expect(skipped[0].error_message).toBe('contact_daily_limit');
    });

    it('should enforce opt-out blocks (opted_in_sms = false)', async () => {
      const customer = await mockPrisma.customer.create({
        data: {
          dealership_id: dealerId,
          full_name: 'Opted Out Customer',
          phone: '+8801999999992',
          opted_in_sms: false, // OPTED OUT!
        },
      });

      const rule = await mockPrisma.automationRule.create({
        data: {
          dealership_id: dealerId,
          name: 'SMS Campaign',
          trigger_event: 'lead.created',
          channel: 'sms',
          actions: { template_body: 'Offers' },
        },
      });

      const ctx = {
        dealerId,
        triggerEvent: 'lead.created',
        chainDepth: 1,
        contactId: customer.id,
        contactPhone: customer.phone,
      };

      await ruleEngine.evaluate('lead.created', ctx);

      const logs = await mockPrisma.automationLog.findMany({
        where: { rule_id: rule.id },
      });
      expect(logs.length).toBe(1);
      expect(logs[0].status).toBe('opted_out');
    });

    it('should process Greenweb STOP callback and opt out customer', async () => {
      const customer = await mockPrisma.customer.create({
        data: {
          dealership_id: dealerId,
          full_name: 'Campaign Buyer',
          phone: '+8801999999993',
          opted_in_sms: true,
        },
      });

      await request(app.getHttpServer())
        .post('/api/v1/automation/sms/stop')
        .send({ phone: '+8801999999993', text: 'STOP' })
        .expect(HttpStatus.CREATED);

      const updated = await mockPrisma.customer.findUnique({ where: { id: customer.id } });
      expect(updated.opted_in_sms).toBe(false);
    });

    it('should suppress non-critical follow-ups during Eid/Festival mode', async () => {
      // Seed Eid date in platform calendar
      const todayStr = new Date().toISOString().split('T')[0];
      await mockPrisma.platformCalendar.create({
        data: {
          date: new Date(todayStr + 'T00:00:00Z'),
          name: 'Eid-ul-Fitr',
          type: 'eid_ul_fitr',
          country: 'BD',
        },
      });

      const rule = await mockPrisma.automationRule.create({
        data: {
          dealership_id: dealerId,
          name: 'Lead Day 3 follow-up',
          trigger_event: 'lead.stale_7d', // non-critical stale event
          channel: 'whatsapp',
          actions: { template_body: 'Still looking?' },
        },
      });

      const ctx = {
        dealerId,
        triggerEvent: 'lead.stale_7d',
        chainDepth: 1,
        contactPhone: '+8801999999994',
      };

      await ruleEngine.evaluate('lead.stale_7d', ctx);

      const logs = await mockPrisma.automationLog.findMany({
        where: { rule_id: rule.id },
      });
      expect(logs.length).toBe(1);
      expect(logs[0].status).toBe('skipped');
      expect(logs[0].error_message).toBe('festival_mode_suppressed');
    });

    it('should carry forward WhatsApp daily limit overflow to next day 9:00 AM', async () => {
      const rule = await mockPrisma.automationRule.create({
        data: {
          dealership_id: dealerId,
          name: 'WABA Campaign',
          trigger_event: 'lead.created',
          channel: 'whatsapp',
          actions: { template_body: 'Campaign WABA' },
        },
      });

      const today = new Date().toISOString().split('T')[0];
      const limitKey = `rate:automation:whatsapp:${dealerId}:${today}`;
      // Set to 1000 limit reached
      await redisService.set(limitKey, '1000');

      const ctx = {
        dealerId,
        triggerEvent: 'lead.created',
        chainDepth: 1,
        contactPhone: '+8801999999995',
      };

      await ruleEngine.evaluate('lead.created', ctx);

      const logs = await mockPrisma.automationLog.findMany({
        where: { rule_id: rule.id },
      });
      expect(logs.length).toBe(1);
      expect(logs[0].status).toBe('queued');
      expect(logs[0].error_message).toBe('rate_limit_carry_forward');
      expect(logs[0].metadata.scheduled_send_time).toBeDefined();
    });

    it('should reject Facebook webhook signature invalid with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/automation/facebook/webhook')
        .set('x-hub-signature-256', 'sha256=invalid_test_sig')
        .send({ dealership_id: dealerId })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should accept Facebook webhook with valid signature and import lead in CRM', async () => {
      const payload = {
        dealership_id: dealerId,
        buyer_name: 'Rashed Khan',
        buyer_phone: '+8801999999996',
        buyer_email: 'rashed@gmail.com',
      };
      const rawBody = JSON.stringify(payload);
      const hmac = crypto.createHmac('sha256', 'test_secret');
      hmac.update(rawBody);
      const signature = `sha256=${hmac.digest('hex')}`;

      const response = await request(app.getHttpServer())
        .post('/api/v1/automation/facebook/webhook')
        .set('x-hub-signature-256', signature)
        .send(payload)
        .expect(HttpStatus.CREATED);

      expect(response.body.data.lead_id).toBeDefined();

      const lead = await mockPrisma.lead.findUnique({
        where: { id: response.body.data.lead_id },
      });
      expect(lead.source).toBe('facebook_lead_ad');
      expect(lead.buyer_name).toBe('Rashed Khan');
    });
  });
});
