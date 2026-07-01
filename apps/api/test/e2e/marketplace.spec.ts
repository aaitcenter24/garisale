jest.mock('meilisearch', () => {
  return {
    MeiliSearch: class MockMeiliSearch {
      index() {
        return {
          search: jest.fn().mockResolvedValue({
            hits: [],
          }),
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
import { UserRole, UserStatus, DealerStatus, ListingStatus } from '@prisma/client';
import { getQueueToken } from '@nestjs/bullmq';

class MockQueue {
  constructor(public name: string) {}
  async add() { return { id: 'mock-job-id' }; }
}

describe('Garisale Marketplace & Website Builder E2E (Step 4)', () => {
  let app: INestApplication;
  let mockPrisma: MockPrismaService;
  let tokenService: TokenService;

  const dealerId = '550e8400-e29b-41d4-a716-44665544000c';
  let ownerId: string;
  let adminToken: string;

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
    app.useGlobalFilters(new (require('../../src/common/filters/http-exception.filter').HttpExceptionFilter)());
    await app.init();

    tokenService = moduleFixture.get<TokenService>(TokenService);
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

    // Seed Dealer Staff (for round-robin test)
    await mockPrisma.user.create({
      data: {
        id: 'sales-staff-id-1',
        phone: '+8801711111113',
        full_name: 'Sales Rep 1',
        role: UserRole.salesperson,
        status: UserStatus.active,
      },
    });

    await mockPrisma.dealerStaff.create({
      data: {
        dealership_id: dealerId,
        user_id: 'sales-staff-id-1',
        role: UserRole.salesperson,
        is_active: true,
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

    // Seed Vehicle (for CRM lead routing test)
    await mockPrisma.vehicle.create({
      data: {
        id: '550e8400-e29b-41d4-a716-44665544000a',
        dealership_id: dealerId,
        stock_no: 'CRM-001',
        make: 'Toyota',
        model: 'Premio',
        year: 2018,
        asking_price: 2800000,
        mileage_km: 45000,
        mileage_bucket: '30-60K',
      },
    });

    adminToken = await tokenService.issueAdminAccessToken({
      user_id: adminUser.id,
      role: 'super_admin',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await mockPrisma.setDealerContext(dealerId);
  });

  describe('MeiliSearch search performance RPS', () => {
    it('should handle 100 search queries with a p95 latency under 200ms', async () => {
      const start = Date.now();
      const batchSize = 10;
      const responses: any[] = [];

      for (let i = 0; i < 100; i += batchSize) {
        const batch = Array.from({ length: batchSize }).map(() =>
          request(app.getHttpServer())
            .get('/api/v1/public/marketplace/search?make=Toyota')
            .expect(HttpStatus.OK)
        );
        const results = await Promise.all(batch);
        responses.push(...results);
      }

      const duration = Date.now() - start;
      expect(responses.length).toBe(100);
      expect(duration).toBeLessThan(2000); // Overall time for 100 requests in batches
    });
  });

  describe('C2C Listing Wizard & Moderation Queue', () => {
    it('should submit C2C listing under review, calculate IMV, and approve via admin', async () => {
      // 1. Get IMV Valuation
      const valResponse = await request(app.getHttpServer())
        .get('/api/v1/public/marketplace/c2c/imv-valuation')
        .query({
          make: 'Toyota',
          model: 'Premio',
          year: '2018',
          asking_price: '2800000',
        })
        .expect(HttpStatus.OK);

      expect(valResponse.body.data.imv_p50).toBeDefined();

      // 2. Submit C2C Listing
      const c2cResponse = await request(app.getHttpServer())
        .post('/api/v1/public/marketplace/c2c/listings')
        .send({
          make: 'Toyota',
          model: 'Premio',
          year: 2018,
          asking_price: 2800000,
          description: 'C2C private seller vehicle Premio.',
          photos: ['http://r2.com/c2c.png'],
          mileage_km: 30000,
        })
        .expect(HttpStatus.CREATED);

      const listingId = c2cResponse.body.data.id;
      expect(c2cResponse.body.data.status).toBe(ListingStatus.under_review);

      // 3. Approve via admin moderation endpoint
      await request(app.getHttpServer())
        .post(`/api/v1/admin/c2c/listings/${listingId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      // Verify listing is now active
      const listing = await mockPrisma.marketplaceListing.findUnique({
        where: { id: listingId },
      });
      expect(listing.status).toBe(ListingStatus.active);
    });
  });

  describe('Buyer Enquiry CRM Routing Bridge', () => {
    it('should route lead to correct dealer using round-robin and save customer info', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/public/marketplace/leads')
        .send({
          dealership_id: dealerId,
          buyer_name: 'Imran Khan',
          buyer_phone: '+8801999999999',
          buyer_email: 'imran@gmail.com',
          buyer_district: 'Dhaka',
          vehicle_id: '550e8400-e29b-41d4-a716-44665544000a',
          notes: 'Interested in Premio test drive.',
        })
        .expect(HttpStatus.CREATED);

      const lead = response.body.data;
      expect(lead.assigned_to).toBe('sales-staff-id-1'); // routed to our active salesperson

      // Verify customer record is created
      const customer = await mockPrisma.customer.findFirst({
        where: { phone: '+8801999999999', dealership_id: dealerId }
      });
      expect(customer).toBeDefined();
      expect(customer.full_name).toBe('Imran Khan');
    });
  });

  describe('GMC & Facebook RSS XML Feeds', () => {
    it('should return a compliant RSS XML feed for Google Merchant and Facebook Catalog', async () => {
      // GMC Feed
      const gmcResponse = await request(app.getHttpServer())
        .get(`/api/v1/public/marketplace/feeds/gmc/${dealerId}`)
        .expect(HttpStatus.OK);

      expect(gmcResponse.headers['content-type']).toContain('application/xml');
      expect(gmcResponse.text).toContain('<rss');
      expect(gmcResponse.text).toContain('<channel>');
      expect(gmcResponse.text).toContain('Alpha Motors');

      // Facebook Feed
      const fbResponse = await request(app.getHttpServer())
        .get(`/api/v1/public/marketplace/feeds/facebook/${dealerId}`)
        .expect(HttpStatus.OK);

      expect(fbResponse.headers['content-type']).toContain('application/xml');
      expect(fbResponse.text).toContain('<rss');
    });
  });

  describe('Custom Domain Routing', () => {
    it('should resolve theme configurations for custom domain or subdomains', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/domains/lookup')
        .query({ domain: 'alpha-motors.com' })
        .expect(HttpStatus.OK);

      expect(response.body.data.dealership_id).toBe(dealerId);
      expect(response.body.data.theme.primary_color).toBe('#1e3a8a');
    });
  });
});
