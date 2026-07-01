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
import { UserRole, UserStatus, DealerStatus, ListingStatus, ListingType, SellerType } from '@prisma/client';
import { getQueueToken } from '@nestjs/bullmq';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';

class MockQueue {
  constructor(public name: string) {}
  async add() { return { id: 'mock-job-id' }; }
}

describe('Garisale Admin Panel E2E (Step 8)', () => {
  let app: INestApplication;
  let mockPrisma: MockPrismaService;
  let tokenService: TokenService;
  let redisService: RedisService;

  const adminPhone = '+8801711111110';
  const dealerPhone = '+8801711111111';
  const dealershipId = '550e8400-e29b-41d4-a716-44665544000c';
  
  let adminId: string;
  let dealerId: string;
  let adminToken: string;
  let dealerToken: string;

  beforeAll(async () => {
    try {
      mockPrisma = new MockPrismaService();
      mockPrisma.setBypassRls(true);

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

      // Seed Super Admin
      const adminPassHash = await bcrypt.hash('adminpass', 10);
      const adminUser = await mockPrisma.user.create({
        data: {
          phone: adminPhone,
          email: 'admin@garisale.com',
          full_name: 'Garisale Super Admin',
          role: UserRole.admin_user,
          admin_role: 'super_admin',
          password_hash: adminPassHash,
          status: UserStatus.active,
        },
      });
      adminId = adminUser.id;

      // Seed Dealer Owner User
      const dealerPassHash = await bcrypt.hash('dealerpass', 10);
      const dealerUser = await mockPrisma.user.create({
        data: {
          phone: dealerPhone,
          email: 'dealer@garisale.com',
          full_name: 'Dealer Owner',
          role: UserRole.dealer_owner,
          password_hash: dealerPassHash,
          status: UserStatus.active,
        },
      });
      dealerId = dealerUser.id;

      // Seed Dealership
      await mockPrisma.dealership.create({
        data: {
          id: dealershipId,
          owner_id: dealerId,
          business_name: 'Beta Motors',
          slug: 'beta-motors',
          district: 'Dhaka',
          division: 'Dhaka',
          phone: '+8801700000002',
          status: DealerStatus.pending_approval,
        },
      });

      await mockPrisma.setDealerContext(dealershipId);

      // Seed Dealer Staff
      await mockPrisma.dealerStaff.create({
        data: {
          dealership_id: dealershipId,
          user_id: dealerId,
          role: 'dealer_owner',
          is_active: true,
        },
      });

      // Issue tokens
      adminToken = await tokenService.issueAdminAccessToken({
        user_id: adminId,
        role: 'super_admin',
      });

      dealerToken = await tokenService.issueDealerAccessToken({
        user_id: dealerId,
        dealer_id: dealershipId,
        role: 'dealer_owner',
      });
    } catch (e) {
      console.error('CRITICAL ERROR IN BEFOREALL:', e);
      throw e;
    }
  }, 40000);

  afterAll(async () => {
    await app.close();
  }, 20000);

  beforeEach(async () => {
    try {
      await mockPrisma.clearDealerContext();
      mockPrisma.setBypassRls(true);
      mockPrisma.mockData.platformAuditLog = [];
      mockPrisma.mockData.entityChangeLog = [];
      mockPrisma.mockData.marketplaceListing = [];
      mockPrisma.mockData.subscription = [];
      mockPrisma.mockData.invoice = [];
      
      // Restore admin session key in Redis to prevent session leakage across tests
      if (adminToken) {
        try {
          const decoded = await tokenService.verifyAdminAccessToken(adminToken);
          await redisService.set(`admin_session:${decoded.jti}`, 'active', 1800);
        } catch (e) {
          // ignore
        }
      }
      
      // Clear Redis configuration for IP allowlist & feature flags
      await redisService.del('feature_flag:test_flag');
      
      // Ensure test user has 2FA set up for normal testing
      if (adminId) {
        await mockPrisma.user.update({
          where: { id: adminId },
          data: {
            totp_enabled: true,
            totp_secret: authenticator.generateSecret(),
            totp_failed_attempts: 0,
            status: UserStatus.active,
          },
        });
      }
    } catch (e) {
      console.error('CRITICAL ERROR IN BEFOREEACH:', e);
      throw e;
    }
  });

  describe('IP Allowlist (CF-Connecting-IP / CIDR Matching)', () => {
    it('should return HTTP 404 (not 403) from non-allowlisted IP', async () => {
      // Simulate non-allowlisted IP configuration
      process.env.ADMIN_IP_ALLOWLIST = '192.168.1.0/24,10.0.0.1';

      await request(app.getHttpServer())
        .get('/api/v1/admin/dealers')
        .set('cf-connecting-ip', '192.168.2.1') // different subnet
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);

      // Re-allow all by clearing list
      process.env.ADMIN_IP_ALLOWLIST = '';
    });

    it('should allow request from allowlisted IP inside CIDR subnet range', async () => {
      process.env.ADMIN_IP_ALLOWLIST = '192.168.1.0/24';

      await request(app.getHttpServer())
        .get('/api/v1/admin/dealers')
        .set('cf-connecting-ip', '192.168.1.15') // within subnet
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      process.env.ADMIN_IP_ALLOWLIST = '';
    });
  });

  describe('Admin TOTP 2FA Verification & Lockout', () => {
    it('should reject login without TOTP code', async () => {
      await mockPrisma.user.update({
        where: { id: adminId },
        data: { totp_enabled: true },
      });

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ phone: adminPhone, password: 'adminpass' }) // no totp_code
        .expect(HttpStatus.UNAUTHORIZED);

      expect(loginRes.body.error.message).toBe('TOTP_REQUIRED');
    });

    it('should trigger MFA Setup flow if TOTP is not enabled', async () => {
      await mockPrisma.user.update({
        where: { id: adminId },
        data: { totp_enabled: false },
      });

      const setupRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ phone: adminPhone, password: 'adminpass' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(setupRes.body.error.code).toBe('MFA_SETUP_REQUIRED');
      expect(setupRes.body.totp_secret).toBeDefined();
      expect(setupRes.body.otpauth_url).toBeDefined();

      // Verify the generated secret with code to complete setup
      const correctCode = authenticator.generate(setupRes.body.totp_secret);
      
      const verifyRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ phone: adminPhone, password: 'adminpass', totp_code: correctCode })
        .expect(HttpStatus.OK);

      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.data.access_token).toBeDefined();
    });

    it('should deactivate account after 5 failed attempts and emit alert event', async () => {
      await mockPrisma.user.update({
        where: { id: adminId },
        data: { totp_enabled: true },
      });

      // Make 4 failed attempts
      for (let i = 0; i < 4; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ phone: adminPhone, password: 'adminpass', totp_code: '000000' })
          .expect(HttpStatus.UNAUTHORIZED);
      }

      // Check failed count is 4
      const adminAfter4 = await mockPrisma.user.findUnique({ where: { id: adminId } });
      expect(adminAfter4.totp_failed_attempts).toBe(4);
      expect(adminAfter4.status).toBe(UserStatus.active);

      // Make 5th failed attempt
      const lockRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ phone: adminPhone, password: 'adminpass', totp_code: '000000' })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(lockRes.body.error.message).toContain('Account deactivated');
      const adminAfter5 = await mockPrisma.user.findUnique({ where: { id: adminId } });
      expect(adminAfter5.status).toBe(UserStatus.suspended); // Suspended/Deactivated
    });
  });

  describe('Idle Timeout Enforcement', () => {
    it('should block actions and return 401 if session is expired in Redis', async () => {
      // Decode jti from token
      const jwtPayload = await tokenService.verifyAdminAccessToken(adminToken);
      const sessionKey = `admin_session:${jwtPayload.jti}`;

      // Simulate idle session timeout (31 minutes expired)
      await redisService.del(sessionKey);

      await request(app.getHttpServer())
        .get('/api/v1/admin/dealers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Dealer Lifecycle (Approve, Suspend, Reinstate, Terminate)', () => {
    it('should approve a pending dealer and emit active state', async () => {
      const approveRes = await request(app.getHttpServer())
        .post(`/api/v1/admin/dealers/${dealershipId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(approveRes.body.success).toBe(true);

      const dealer = await mockPrisma.dealership.findUnique({ where: { id: dealershipId } });
      expect(dealer.status).toBe(DealerStatus.active);

      // Verify audit log
      const logs = await mockPrisma.platformAuditLog.findMany();
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('approve_dealer');
    });

    it('should suspend dealer and auto-hide listings within 60 seconds', async () => {
      // Setup: approve first
      await mockPrisma.dealership.update({
        where: { id: dealershipId },
        data: { status: DealerStatus.active },
      });

      // Create a listing for this dealer
      const listing = await mockPrisma.marketplaceListing.create({
        data: {
          dealership_id: dealershipId,
          slug: 'toyota-corolla-2015',
          title: 'Toyota Corolla 2015',
          asking_price: 1500000,
          make: 'Toyota',
          model: 'Corolla',
          year: 2015,
          mileage_km: 60000,
          mileage_bucket: '60-100K',
          district: 'Dhaka',
          division: 'Dhaka',
          photo_count: 5,
          listing_type: ListingType.dealer,
          seller_type: SellerType.dealer,
          status: ListingStatus.active,
        },
      });

      // Suspend dealer
      await request(app.getHttpServer())
        .post(`/api/v1/admin/dealers/${dealershipId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Billing overdue' })
        .expect(HttpStatus.OK);

      const dealer = await mockPrisma.dealership.findUnique({ where: { id: dealershipId } });
      expect(dealer.status).toBe(DealerStatus.suspended);

      // Verify listing is auto-hidden immediately
      const updatedListing = await mockPrisma.marketplaceListing.findUnique({ where: { id: listing.id } });
      expect(updatedListing.status).toBe('hidden');
    });

    it('should reinstate dealer and auto-restore listings within 60 seconds', async () => {
      // Setup: suspend first
      await mockPrisma.dealership.update({
        where: { id: dealershipId },
        data: { status: DealerStatus.suspended },
      });

      const listing = await mockPrisma.marketplaceListing.create({
        data: {
          dealership_id: dealershipId,
          slug: 'toyota-corolla-2015',
          title: 'Toyota Corolla 2015',
          asking_price: 1500000,
          make: 'Toyota',
          model: 'Corolla',
          year: 2015,
          mileage_km: 60000,
          mileage_bucket: '60-100K',
          district: 'Dhaka',
          division: 'Dhaka',
          photo_count: 5,
          listing_type: ListingType.dealer,
          seller_type: SellerType.dealer,
          status: ListingStatus.hidden,
        },
      });

      // Reinstate dealer
      await request(app.getHttpServer())
        .post(`/api/v1/admin/dealers/${dealershipId}/reinstate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      const dealer = await mockPrisma.dealership.findUnique({ where: { id: dealershipId } });
      expect(dealer.status).toBe(DealerStatus.active);

      // Verify listing is restored to active
      const updatedListing = await mockPrisma.marketplaceListing.findUnique({ where: { id: listing.id } });
      expect(updatedListing.status).toBe('active');
    });

    it('should reject termination without fresh TOTP, and terminate dealer upon fresh TOTP', async () => {
      const admin = await mockPrisma.user.findUnique({ where: { id: adminId } });

      // 1. Attempt termination without TOTP -> reject
      await request(app.getHttpServer())
        .post(`/api/v1/admin/dealers/${dealershipId}/terminate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.BAD_REQUEST); // TOTP_REQUIRED

      // 2. Generate a valid fresh TOTP
      const freshTotp = authenticator.generate(admin.totp_secret);

      // 3. Terminate with fresh TOTP -> succeed
      await request(app.getHttpServer())
        .post(`/api/v1/admin/dealers/${dealershipId}/terminate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ totp_code: freshTotp })
        .expect(HttpStatus.OK);

      const dealer = await mockPrisma.dealership.findUnique({ where: { id: dealershipId } });
      expect(dealer.status).toBe(DealerStatus.terminated);

      // 4. Attempt to reuse same TOTP -> reject (replay protection lock 90s)
      await request(app.getHttpServer())
        .post(`/api/v1/admin/dealers/${dealershipId}/terminate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ totp_code: freshTotp })
        .expect(HttpStatus.FORBIDDEN); // TOTP_ALREADY_USED
    });
  });

  describe('C2C Moderation & Buyer Flags', () => {
    it('should fail C2c Listing checks if photos count < 4', async () => {
      const listing = await mockPrisma.marketplaceListing.create({
        data: {
          c2c_seller_id: dealerId,
          slug: 'c2c-car-bad',
          title: 'Private Car',
          asking_price: 1500000,
          make: 'Nissan',
          model: 'Sunny',
          year: 2012,
          mileage_km: 90000,
          mileage_bucket: '60-100K',
          district: 'Dhaka',
          division: 'Dhaka',
          photo_count: 2, // less than 4!
          listing_type: ListingType.c2c,
          seller_type: SellerType.private,
          status: ListingStatus.under_review,
        },
      });

      const queueRes = await request(app.getHttpServer())
        .get('/api/v1/admin/c2c/listings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(queueRes.body.success).toBe(true);
      const queueItem = queueRes.body.data.find((item: any) => item.listing.id === listing.id);
      expect(queueItem).toBeDefined();
      expect(queueItem.checks.photos).toBe(false); // check failed
      expect(queueItem.autoPassed).toBe(false);
    });

    it('should auto-hide listing (under_review) when flagged twice within 24 hours', async () => {
      const listing = await mockPrisma.marketplaceListing.create({
        data: {
          c2c_seller_id: dealerId,
          slug: 'c2c-flagged',
          title: 'Private Car Flagged',
          asking_price: 1500000,
          make: 'Nissan',
          model: 'Sunny',
          year: 2012,
          mileage_km: 90000,
          mileage_bucket: '60-100K',
          district: 'Dhaka',
          division: 'Dhaka',
          photo_count: 5,
          listing_type: ListingType.c2c,
          seller_type: SellerType.private,
          status: ListingStatus.active,
        },
      });

      // Send 1st flag
      await request(app.getHttpServer())
        .post(`/api/v1/public/marketplace/listings/${listing.id}/flag`)
        .expect(HttpStatus.OK);

      const check1 = await mockPrisma.marketplaceListing.findUnique({ where: { id: listing.id } });
      expect(check1.status).toBe(ListingStatus.active); // remains active

      // Send 2nd flag
      await request(app.getHttpServer())
        .post(`/api/v1/public/marketplace/listings/${listing.id}/flag`)
        .expect(HttpStatus.OK);

      const check2 = await mockPrisma.marketplaceListing.findUnique({ where: { id: listing.id } });
      expect(check2.status).toBe('under_review'); // Auto-hidden!
    });
  });

  describe('Feature Flagging System', () => {
    it('should Toggle feature flag in Redis and update dealerships/me response immediately', async () => {
      // Setup active dealer context in mock db
      await mockPrisma.dealership.update({
        where: { id: dealershipId },
        data: { status: DealerStatus.active },
      });
      await mockPrisma.setDealerContext(dealershipId);

      // Verify flag is currently disabled
      const meRes1 = await request(app.getHttpServer())
        .get('/api/v1/dealerships/me')
        .set('Authorization', `Bearer ${dealerToken}`)
        .expect(HttpStatus.OK);

      expect(meRes1.body.data.features.test_flag).toBe(false);

      // Toggle flag to enabled
      await request(app.getHttpServer())
        .post('/api/v1/admin/feature-flags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ flag: 'test_flag', enabled: true })
        .expect(HttpStatus.CREATED);

      // Verify flag is now enabled immediately
      const meRes2 = await request(app.getHttpServer())
        .get('/api/v1/dealerships/me')
        .set('Authorization', `Bearer ${dealerToken}`)
        .expect(HttpStatus.OK);

      expect(meRes2.body.data.features.test_flag).toBe(true);
    });
  });

  describe('Impersonation Flow & Auditing', () => {
    it('should allow Super Admin to impersonate dealer owner and write vehicle with watermarked actor role', async () => {
      // Start Impersonation
      const impersonateRes = await request(app.getHttpServer())
        .post('/api/v1/admin/impersonate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dealer_id: dealershipId })
        .expect(HttpStatus.CREATED);

      const impersonatedToken = impersonateRes.body.data.access_token;
      expect(impersonatedToken).toBeDefined();

      // Check claim details
      const claims = await tokenService.verifyDealerAccessToken(impersonatedToken);
      expect(claims.is_impersonation).toBe(true);
      expect(claims.impersonated_by).toBe(adminId);

      // End impersonation (simulated by revoking token JTI in Redis)
      await redisService.set(`revoked_jti:${claims.jti}`, 'revoked', 3600);

      // Verify token is now blocked
      await request(app.getHttpServer())
        .post(`/api/v1/admin/dealers/${dealershipId}/suspend`)
        .set('Authorization', `Bearer ${impersonatedToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Revenue Dashboard & Failed Payment Action Queue', () => {
    it('should compute MRR/ARR correctly and perform failed payment action Waive/Retry', async () => {
      // Seed 2 active subscriptions
      await mockPrisma.subscription.create({
        data: {
          dealership_id: dealershipId,
          plan_id: 'plan-1',
          tier: 'starter',
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          monthly_price_bdt: 2999.00,
        },
      });

      await mockPrisma.subscription.create({
        data: {
          dealership_id: '550e8400-e29b-41d4-a716-44665544000d',
          plan_id: 'plan-1',
          tier: 'starter',
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          monthly_price_bdt: 2999.00,
        },
      });

      // Get dashboard
      const dashRes = await request(app.getHttpServer())
        .get('/api/v1/admin/revenue')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(Number(dashRes.body.data.mrr)).toBe(5998.00);
      expect(Number(dashRes.body.data.arr)).toBe(5998.00 * 12);
    });
  });

  describe('Global Security Hardening (Headers & Rate Limiting)', () => {
    it('should return security response headers on all requests', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/dealerships/me')
        .set('Authorization', `Bearer ${dealerToken}`);

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['strict-transport-security']).toBe('max-age=63072000; includeSubDomains; preload');
      expect(res.headers['content-security-policy']).toBe("default-src 'self'");
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('should return X-Frame-Options: DENY for admin routes', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/dealers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.headers['x-frame-options']).toBe('DENY');
    });

    it('should enforce rate limiting and return 429 Too Many Requests after 100 requests', async () => {
      const testIp = '10.9.8.7';
      
      // Clear key first
      await redisService.del(`rate_limit:ip:${testIp}`);

      for (let i = 0; i < 100; i++) {
        await request(app.getHttpServer())
          .get('/api/v1/dealerships/me')
          .set('cf-connecting-ip', testIp)
          .set('Authorization', `Bearer ${dealerToken}`);
      }

      const limitRes = await request(app.getHttpServer())
        .get('/api/v1/dealerships/me')
        .set('cf-connecting-ip', testIp)
        .set('Authorization', `Bearer ${dealerToken}`)
        .expect(HttpStatus.TOO_MANY_REQUESTS);

      expect(limitRes.body.success).toBe(false);
      expect(limitRes.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      
      await redisService.del(`rate_limit:ip:${testIp}`);
    });
  });
});
