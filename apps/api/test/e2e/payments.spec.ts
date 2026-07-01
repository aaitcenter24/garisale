jest.mock('meilisearch', () => {
  return {
    MeiliSearch: class MockMeiliSearch {
      index() {
        return {
          search: jest.fn().mockResolvedValue({ hits: [] }),
        };
      }
    },
  };
});

jest.mock('bullmq', () => {
  return {
    Queue: class MockQueue {
      constructor(public name: string) {}
      add() { return Promise.resolve({ id: 'mock-job-id' }); }
      close() { return Promise.resolve(); }
    },
    Worker: class MockWorker {
      constructor() {}
      on() { return this; }
      close() { return Promise.resolve(); }
    },
    QueueEvents: class MockQueueEvents {
      constructor() {}
      on() { return this; }
      close() { return Promise.resolve(); }
    },
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/database/prisma.service';
import { MockPrismaService } from '../../src/modules/database/mock-prisma.service';
import { TokenService } from '../../src/modules/auth/token.service';
import { RedisService } from '../../src/modules/redis/redis.service';
import { UserRole, UserStatus, DealerStatus, SubscriptionTier } from '@prisma/client';
import { getQueueToken } from '@nestjs/bullmq';

class MockQueue {
  constructor(public name: string) {}
  async add() { return { id: 'mock-job-id' }; }
}

describe('Garisale Payments & Subscription Lifecycle E2E (Step 7)', () => {
  let app: INestApplication;
  let mockPrisma: MockPrismaService;
  let tokenService: TokenService;
  let redisService: RedisService;

  const dealerId = '550e8400-e29b-41d4-a716-44665544000c';
  let ownerId: string;
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
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new (require('../../src/common/filters/http-exception.filter')).HttpExceptionFilter());
    await app.init();

    tokenService = moduleFixture.get<TokenService>(TokenService);
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

    dealerToken = await tokenService.issueDealerAccessToken({
      user_id: ownerId,
      dealer_id: dealerId,
      role: UserRole.dealer_owner,
    });
  }, 40000);

  afterAll(async () => {
    await app.close();
  }, 20000);

  beforeEach(async () => {
    await mockPrisma.setDealerContext(dealerId);
    mockPrisma.mockData.subscription = [];
    mockPrisma.mockData.invoice = [];
    mockPrisma.mockData.paymentTransaction = [];
    mockPrisma.mockData.lead = [];
    await redisService.del('bkash:failures');
    await redisService.del('bkash:circuit:open');
  });

  describe('bKash Double-Charge & Timeout Recovery (Scenarios 1-8)', () => {
    it('Scenario 1: Successful payment, callback arrives correctly', async () => {
      const invoice = await mockPrisma.invoice.create({
        data: {
          dealership_id: dealerId,
          invoice_no: 'INV-S1-001',
          type: 'subscription',
          amount_bdt: 2999.00,
          total_bdt: 2999.00,
          status: 'pending',
          due_date: new Date(),
        },
      });

      const initRes = await request(app.getHttpServer())
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({ invoice_id: invoice.id, gateway: 'bkash' })
        .expect(HttpStatus.CREATED);

      expect(initRes.body.success).toBe(true);

      const callbackRes = await request(app.getHttpServer())
        .post('/api/v1/payments/bkash/callback')
        .send({
          paymentID: initRes.body.paymentID,
          status: 'success',
          tran_id: initRes.body.tran_id || initRes.body.bkashURL.split('tran_id=')[1],
        })
        .expect(HttpStatus.OK);

      expect(callbackRes.body.success).toBe(true);
      expect(callbackRes.body.duplicated).toBe(false);

      const sub = await mockPrisma.subscription.findUnique({
        where: { dealership_id: dealerId },
      });
      expect(sub).toBeDefined();
      expect(sub.status).toBe('active');
    });

    it('Scenario 2: Callback failure, but query status is Completed', async () => {
      const invoice = await mockPrisma.invoice.create({
        data: {
          dealership_id: dealerId,
          invoice_no: 'INV-S2-001',
          type: 'subscription',
          amount_bdt: 2999.00,
          total_bdt: 2999.00,
          status: 'pending',
          due_date: new Date(),
        },
      });

      const initRes = await request(app.getHttpServer())
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({ invoice_id: invoice.id, gateway: 'bkash' })
        .expect(HttpStatus.CREATED);

      const callbackRes = await request(app.getHttpServer())
        .post('/api/v1/payments/bkash/callback?scenario=Completed')
        .send({
          paymentID: initRes.body.paymentID,
          status: 'failure',
          tran_id: initRes.body.bkashURL.split('tran_id=')[1],
        })
        .expect(HttpStatus.OK);

      expect(callbackRes.body.success).toBe(true);
      expect(callbackRes.body.duplicated).toBe(false);

      const updatedInv = await mockPrisma.invoice.findUnique({ where: { id: invoice.id } });
      expect(updatedInv.status).toBe('paid');
    });

    it('Scenario 3: Callback failure, query status is Failed', async () => {
      const invoice = await mockPrisma.invoice.create({
        data: {
          dealership_id: dealerId,
          invoice_no: 'INV-S3-001',
          type: 'subscription',
          amount_bdt: 2999.00,
          total_bdt: 2999.00,
          status: 'pending',
          due_date: new Date(),
        },
      });

      const initRes = await request(app.getHttpServer())
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({ invoice_id: invoice.id, gateway: 'bkash' })
        .expect(HttpStatus.CREATED);

      const callbackRes = await request(app.getHttpServer())
        .post('/api/v1/payments/bkash/callback?scenario=Failed')
        .send({
          paymentID: initRes.body.paymentID,
          status: 'failure',
          tran_id: initRes.body.bkashURL.split('tran_id=')[1],
        })
        .expect(HttpStatus.OK);

      expect(callbackRes.body.success).toBe(false);
      expect(callbackRes.body.reason).toBe('PAYMENT_FAILED');
    });

    it('Scenario 4: Concurrent callbacks with the same paymentID / idempotencyKey', async () => {
      const invoice = await mockPrisma.invoice.create({
        data: {
          dealership_id: dealerId,
          invoice_no: 'INV-S4-001',
          type: 'subscription',
          amount_bdt: 2999.00,
          total_bdt: 2999.00,
          status: 'pending',
          due_date: new Date(),
        },
      });

      const initRes = await request(app.getHttpServer())
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({ invoice_id: invoice.id, gateway: 'bkash' })
        .expect(HttpStatus.CREATED);

      const tranId = initRes.body.bkashURL.split('tran_id=')[1];

      const p1 = request(app.getHttpServer())
        .post('/api/v1/payments/bkash/callback')
        .send({ paymentID: initRes.body.paymentID, status: 'success', tran_id: tranId });

      const p2 = request(app.getHttpServer())
        .post('/api/v1/payments/bkash/callback')
        .send({ paymentID: initRes.body.paymentID, status: 'success', tran_id: tranId });

      const [res1, res2] = await Promise.all([p1, p2]);

      expect([res1.status, res2.status]).toContain(HttpStatus.OK);
      expect([res1.body.success, res2.body.success]).toContain(true);
    });

    it('Scenario 5: Circuit breaker opens after 3 failures', async () => {
      await redisService.set('bkash:failures', '3');
      await redisService.set('bkash:circuit:open', 'true', 300);

      const invoice = await mockPrisma.invoice.create({
        data: {
          dealership_id: dealerId,
          invoice_no: 'INV-S5-001',
          type: 'subscription',
          amount_bdt: 2999.00,
          total_bdt: 2999.00,
          status: 'pending',
          due_date: new Date(),
        },
      });

      const initRes = await request(app.getHttpServer())
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({ invoice_id: invoice.id, gateway: 'bkash' })
        .expect(HttpStatus.SERVICE_UNAVAILABLE);

      expect(initRes.body.error.message).toBe('BKASH_GATEWAY_UNAVAILABLE');
    });

    it('Scenario 6: Double activation check (already paid invoice)', async () => {
      const invoice = await mockPrisma.invoice.create({
        data: {
          dealership_id: dealerId,
          invoice_no: 'INV-S6-001',
          type: 'subscription',
          amount_bdt: 2999.00,
          total_bdt: 2999.00,
          status: 'paid',
          due_date: new Date(),
        },
      });

      const initRes = await request(app.getHttpServer())
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({ invoice_id: invoice.id, gateway: 'bkash' })
        .expect(HttpStatus.CONFLICT);

      expect(initRes.body.error.message).toBe('INVOICE_ALREADY_PAID');
    });

    it('Scenario 7: Re-use of same idempotency key (within 5-minute bucket)', async () => {
      const invoice = await mockPrisma.invoice.create({
        data: {
          dealership_id: dealerId,
          invoice_no: 'INV-S7-001',
          type: 'subscription',
          amount_bdt: 2999.00,
          total_bdt: 2999.00,
          status: 'pending',
          due_date: new Date(),
        },
      });

      await request(app.getHttpServer())
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({ invoice_id: invoice.id, gateway: 'bkash' })
        .expect(HttpStatus.CREATED);

      const initRes2 = await request(app.getHttpServer())
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({ invoice_id: invoice.id, gateway: 'bkash' })
        .expect(HttpStatus.CREATED);

      expect(initRes2.body.already_initiated).toBe(true);
    });

    it('Scenario 8: Timeout - callback never arrives (recovered via query status Completed)', async () => {
      const invoice = await mockPrisma.invoice.create({
        data: {
          dealership_id: dealerId,
          invoice_no: 'INV-S8-001',
          type: 'subscription',
          amount_bdt: 2999.00,
          total_bdt: 2999.00,
          status: 'pending',
          due_date: new Date(),
        },
      });

      const initRes = await request(app.getHttpServer())
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({ invoice_id: invoice.id, gateway: 'bkash' })
        .expect(HttpStatus.CREATED);

      const tranId = initRes.body.bkashURL.split('tran_id=')[1];
      const callbackRes = await request(app.getHttpServer())
        .post('/api/v1/payments/bkash/callback?scenario=Completed')
        .send({
          paymentID: initRes.body.paymentID,
          status: 'timeout',
          tran_id: tranId,
        })
        .expect(HttpStatus.OK);

      expect(callbackRes.body.success).toBe(true);
      expect(callbackRes.body.duplicated).toBe(false);

      const updatedInv = await mockPrisma.invoice.findUnique({ where: { id: invoice.id } });
      expect(updatedInv.status).toBe('paid');
    });
  });

  describe('SSLCommerz IPN Validation & Amount Check', () => {
    it('should validate SSLCommerz IPN signature and verify amount limit', async () => {
      const invoice = await mockPrisma.invoice.create({
        data: {
          dealership_id: dealerId,
          invoice_no: 'INV-SSL-001',
          type: 'subscription',
          amount_bdt: 2999.00,
          total_bdt: 2999.00,
          status: 'pending',
          due_date: new Date(),
        },
      });

      const initRes = await request(app.getHttpServer())
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({ invoice_id: invoice.id, gateway: 'sslcommerz' })
        .expect(HttpStatus.CREATED);

      const tranId = initRes.body.GatewayPageURL.split('tran_id=')[1];

      await request(app.getHttpServer())
        .post('/api/v1/payments/sslcommerz/ipn')
        .send({
          tran_id: tranId,
          amount: '2999.00',
          status: 'VALID',
          bank_tran_id: 'BANK-12345',
          verify_sign: 'mock_verify_sign',
        })
        .expect(HttpStatus.OK);

      const updatedInv = await mockPrisma.invoice.findUnique({ where: { id: invoice.id } });
      expect(updatedInv.status).toBe('paid');
    });
  });

  describe('Per-Lead Billing (Free plan)', () => {
    beforeEach(async () => {
      await mockPrisma.dealership.update({
        where: { id: dealerId },
        data: { subscription_tier: SubscriptionTier.free },
      });
    });

    it('should increment per-lead invoice total on lead creation', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({
          buyer_phone: '+8801711112222',
          buyer_name: 'Lead Client',
          source: 'walk_in',
        })
        .expect(HttpStatus.CREATED);

      const invoices = await mockPrisma.invoice.findMany({
        where: { dealership_id: dealerId, type: 'per_lead' },
      });

      expect(invoices.length).toBe(1);
      expect(Number(invoices[0].amount_bdt)).toBe(150);
      expect(Number(invoices[0].total_bdt)).toBe(500);
    });

    it('should enforce monthly cap of BDT 3000', async () => {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      await mockPrisma.invoice.create({
        data: {
          dealership_id: dealerId,
          invoice_no: 'INV-PL-TESTCAP',
          type: 'per_lead',
          amount_bdt: 2900,
          total_bdt: 2900,
          status: 'pending',
          due_date: new Date(),
          period_start: periodStart,
          period_end: periodEnd,
        },
      });

      await request(app.getHttpServer())
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({
          buyer_phone: '+8801711112223',
          buyer_name: 'Lead Client 2',
          source: 'walk_in',
        })
        .expect(HttpStatus.CREATED);

      const invoice = await mockPrisma.invoice.findFirst({
        where: { dealership_id: dealerId, type: 'per_lead', status: 'pending' },
      });

      expect(Number(invoice.amount_bdt)).toBe(3000);
      expect(Number(invoice.total_bdt)).toBe(3000);
    });
  });

  describe('Subscription Grace Period & Read-Only Status', () => {
    it('should block write actions (returns 403) when in read-only period (>7 days expired)', async () => {
      const plan = await mockPrisma.planConfig.create({
        data: {
          tier: 'starter',
          display_name: 'Starter Plan',
          monthly_price_bdt: 2999.00,
          listing_limit: 15,
          staff_seat_limit: 3,
          location_limit: 1,
          sms_quota_monthly: 500,
          features: '{}',
        },
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() - 10);

      await mockPrisma.subscription.create({
        data: {
          dealership_id: dealerId,
          plan_id: plan.id,
          tier: 'starter',
          status: 'grace_period',
          expires_at: expiresAt,
          monthly_price_bdt: 2999.00,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({
          buyer_phone: '+8801711113333',
          buyer_name: 'Test Client',
        })
        .expect(HttpStatus.FORBIDDEN);

      expect(res.body.error.message).toBe('AUTH_DEALER_READ_ONLY');
    });

    it('should block all actions (returns 403) when suspended (>30 days expired)', async () => {
      const plan = await mockPrisma.planConfig.create({
        data: {
          tier: 'starter',
          display_name: 'Starter Plan',
          monthly_price_bdt: 2999.00,
          listing_limit: 15,
          staff_seat_limit: 3,
          location_limit: 1,
          sms_quota_monthly: 500,
          features: '{}',
        },
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() - 35);

      await mockPrisma.subscription.create({
        data: {
          dealership_id: dealerId,
          plan_id: plan.id,
          tier: 'starter',
          status: 'expired',
          expires_at: expiresAt,
          monthly_price_bdt: 2999.00,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${dealerToken}`)
        .send({
          buyer_phone: '+8801711113333',
          buyer_name: 'Test Client',
        })
        .expect(HttpStatus.FORBIDDEN);

      expect(res.body.error.message).toBe('AUTH_DEALER_SUSPENDED');
    });
  });
});
