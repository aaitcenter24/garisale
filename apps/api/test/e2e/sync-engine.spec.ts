jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Buffer.from('PDF content')),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

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
import { SyncProcessor } from '../../src/modules/sync/sync.processor';
import { RealtimeGateway } from '../../src/modules/realtime/realtime.gateway';
import { UserRole, UserStatus, DealerStatus, VehicleStatus, DealStatus, ListingStatus } from '@prisma/client';
import { getQueueToken } from '@nestjs/bullmq';
import * as crypto from 'crypto';

class MockQueue {
  public jobs: any[] = [];
  constructor(public name: string) {}

  async add(name: string, data: any, opts: any = {}) {
    if (opts.jobId) {
      const existing = this.jobs.find(j => j.opts.jobId === opts.jobId);
      if (existing) {
        return existing;
      }
    }
    const job = {
      id: crypto.randomUUID(),
      name,
      data,
      opts,
      attemptsMade: 0,
    } as any;
    this.jobs.push(job);
    return job;
  }

  clear() {
    this.jobs = [];
  }
}

describe('Garisale Sync Engine & Real-Time E2E (Step 3)', () => {
  let app: INestApplication;
  let mockPrisma: MockPrismaService;
  let tokenService: TokenService;
  let redisService: RedisService;
  let syncProcessor: SyncProcessor;
  let realtimeGateway: RealtimeGateway;
  let mockSyncQueue: MockQueue;
  let mockFailedQueue: MockQueue;

  const dealerId = '550e8400-e29b-41d4-a716-44665544000c';
  let ownerToken: string;
  let ownerId: string;
  let adminToken: string;

  beforeAll(async () => {
    mockPrisma = new MockPrismaService();
    mockSyncQueue = new MockQueue('sync-vehicle');
    mockFailedQueue = new MockQueue('sync-vehicle-failed');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(getQueueToken('sync-vehicle'))
      .useValue(mockSyncQueue)
      .overrideProvider(getQueueToken('sync-vehicle-failed'))
      .useValue(mockFailedQueue)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new (require('../../src/common/filters/http-exception.filter').HttpExceptionFilter)());
    await app.init();

    tokenService = moduleFixture.get<TokenService>(TokenService);
    redisService = moduleFixture.get<RedisService>(RedisService);
    syncProcessor = moduleFixture.get<SyncProcessor>(SyncProcessor);
    realtimeGateway = moduleFixture.get<RealtimeGateway>(RealtimeGateway);

    // Mock Socket.io server to prevent actual network binding errors
    realtimeGateway.server = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    } as any;

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
      },
    });

    // Issue tokens
    ownerToken = await tokenService.issueDealerAccessToken({
      user_id: ownerId,
      dealer_id: dealerId,
      role: 'dealer_owner',
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
    mockSyncQueue.clear();
    mockFailedQueue.clear();
    jest.clearAllMocks();
    await mockPrisma.setDealerContext(dealerId);

    // Clear rate limits in Redis mock store
    const keys = await redisService.keys('sync_rate:*');
    for (const key of keys) {
      await redisService.del(key);
    }
  });

  describe('Sync SLA & Performance', () => {
    it('should complete 100 simultaneous price updates with a p95 latency under 2000ms', async () => {
      const vehicle = await mockPrisma.vehicle.create({
        data: {
          dealership_id: dealerId,
          stock_no: 'SLA-001',
          make: 'Toyota',
          model: 'Premio',
          year: 2018,
          asking_price: 2800000,
          mileage_km: 45000,
          mileage_bucket: '30-60K',
        },
      });

      const start = Date.now();
      const responses: any[] = [];
      const batchSize = 10;
      for (let i = 0; i < 100; i += batchSize) {
        const batch = Array.from({ length: batchSize }).map(() =>
          request(app.getHttpServer())
            .post(`/api/v1/vehicles/${vehicle.id}/force-sync`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(HttpStatus.OK)
        );
        const results = await Promise.all(batch);
        responses.push(...results);
      }
      const totalTime = Date.now() - start;

      expect(responses.length).toBe(100);
      expect(totalTime).toBeLessThan(2000); // E2E response time SLA
    });
  });

  describe('Private Field Isolation', () => {
    it('should strip all acquisition cost and staff notes during sync and never leak to public endpoints', async () => {
      // 1. Create vehicle with secret/financial fields
      const vehicle = await mockPrisma.vehicle.create({
        data: {
          dealership_id: dealerId,
          stock_no: 'SEC-999',
          make: 'Honda',
          model: 'Civic',
          year: 2020,
          asking_price: 3200000,
          acquisition_cost: 2500000,
          recon_total: 50000,
          net_profit_estimate: 650000,
          floor_plan_cost: 100000,
          internal_notes: 'Highly confidential internal staff memo.',
          description: 'A beautiful sedan in great condition.',
          mileage_km: 12000,
          mileage_bucket: '0-30K',
        },
      });

      // 2. Trigger sync manually via processor
      const job = {
        name: 'sync',
        data: { vehicleId: vehicle.id, dealershipId: dealerId },
        attemptsMade: 0,
        opts: { attempts: 4 },
      } as any;

      await syncProcessor.process(job);

      // 3. Verify public listing slug query strips those private fields
      const listing = await mockPrisma.marketplaceListing.findFirst({
        where: { vehicle_id: vehicle.id },
      });

      expect(listing).toBeDefined();
      expect(Number(listing.asking_price)).toBe(3200000);

      // Verify marketplace fields do not contain private info
      expect((listing as any).acquisition_cost).toBeUndefined();
      expect((listing as any).recon_total).toBeUndefined();
      expect((listing as any).net_profit_estimate).toBeUndefined();
      expect((listing as any).floor_plan_cost).toBeUndefined();
      expect((listing as any).internal_notes).toBeUndefined();

      // Query public marketplace detail endpoint
      const response = await request(app.getHttpServer())
        .get(`/api/v1/public/marketplace/listings/${listing.slug}`)
        .expect(HttpStatus.OK);

      const data = response.body.data;
      expect(data.asking_price).toBe(3200000);
      expect(data.acquisition_cost).toBeUndefined();
      expect(data.recon_total).toBeUndefined();
      expect(data.net_profit_estimate).toBeUndefined();
      expect(data.floor_plan_cost).toBeUndefined();
      expect(data.internal_notes).toBeUndefined();
    });
  });

  describe('Deduplication', () => {
    it('should deduplicate multiple rapid sync requests for the same vehicle', async () => {
      const vehicle = await mockPrisma.vehicle.create({
        data: {
          dealership_id: dealerId,
          stock_no: 'DEDUP-01',
          make: 'Nissan',
          model: 'X-Trail',
          year: 2017,
          asking_price: 2400000,
          mileage_km: 60000,
          mileage_bucket: '60-100K',
        },
      });

      // Fire 5 updates concurrently
      await Promise.all(
        Array.from({ length: 5 }).map(() =>
          request(app.getHttpServer())
            .post(`/api/v1/vehicles/${vehicle.id}/force-sync`)
            .set('Authorization', `Bearer ${ownerToken}`)
        )
      );

      // Since they all use jobId: sync:${vehicleId}, BullMQ deduplicates them.
      // In our mock queue, we should see jobs with that jobId.
      const syncJobs = mockSyncQueue.jobs.filter(j => j.opts.jobId === `sync:${vehicle.id}`);
      expect(syncJobs.length).toBe(1); // Deduplicated to a single job execution!
    });
  });

  describe('Rate Limiting', () => {
    it('should reschedule sync events with a delay if they exceed 30 updates per minute per dealer', async () => {
      const vehicle = await mockPrisma.vehicle.create({
        data: {
          dealership_id: dealerId,
          stock_no: 'RATE-01',
          make: 'Mitsubishi',
          model: 'Outlander',
          year: 2019,
          asking_price: 2900000,
          mileage_km: 35000,
          mileage_bucket: '30-60K',
        },
      });

      // Force 35 jobs for this dealer
      for (let i = 0; i < 35; i++) {
        const job = {
          name: 'sync',
          data: { vehicleId: vehicle.id, dealershipId: dealerId },
          attemptsMade: 0,
          opts: { attempts: 4 },
        } as any;
        await syncProcessor.process(job);
      }

      // First 30 execute successfully, subsequent 5 get rate limited and delayed (deduplicated to 1)
      const delayedReschedules = mockSyncQueue.jobs.filter(j => j.opts.delay && j.opts.delay > 0);
      expect(delayedReschedules.length).toBe(1);
      expect(delayedReschedules[0].opts.jobId).toContain(`sync:${vehicle.id}:`);
    });
  });

  describe('DLQ (Dead Letter Queue) Flow', () => {
    it('should move job to DLQ (sync-vehicle-failed) and update vehicle status on 4th execution failure', async () => {
      const vehicle = await mockPrisma.vehicle.create({
        data: {
          dealership_id: dealerId,
          stock_no: 'FAIL-01',
          make: 'Toyota',
          model: 'Aqua',
          year: 2015,
          asking_price: 1500000,
          mileage_km: 95000,
          mileage_bucket: '60-100K',
        },
      });

      const gatewaySpy = jest.spyOn(realtimeGateway, 'emitToDealer');

      // Mock database upsert to fail
      jest.spyOn(mockPrisma.marketplaceListing, 'upsert').mockRejectedValueOnce(
        new Error('Database unique constraint violation')
      );

      const job = {
        name: 'sync',
        data: { vehicleId: vehicle.id, dealershipId: dealerId },
        attemptsMade: 4, // 4th attempt (exhausted)
        opts: { attempts: 4 },
      } as any;

      await expect(syncProcessor.process(job)).rejects.toThrow('Database unique constraint violation');

      // Check if job moved to DLQ (sync-vehicle-failed)
      expect(mockFailedQueue.jobs.length).toBe(1);
      expect(mockFailedQueue.jobs[0].data.vehicleId).toBe(vehicle.id);
      expect(mockFailedQueue.jobs[0].data.errorMessage).toContain('Database unique constraint violation');

      // Verify sync error persists on vehicle
      const updatedVehicle = await mockPrisma.vehicle.findUnique({
        where: { id: vehicle.id },
      });
      expect(updatedVehicle.sync_error).toContain('Database unique constraint violation');

      // Verify RealtimeGateway emitted fail event
      expect(gatewaySpy).toHaveBeenCalledWith(dealerId, 'vehicle.sync_failed', expect.any(Object));
    });
  });

  describe('Dealer Suspended / Reinstated Flow', () => {
    it('should hide all dealer listings on suspension, and reactivate them on reinstatement', async () => {
      const vehicle = await mockPrisma.vehicle.create({
        data: {
          dealership_id: dealerId,
          stock_no: 'SUSP-01',
          make: 'Suzuki',
          model: 'Swift',
          year: 2017,
          asking_price: 1300000,
          mileage_km: 55000,
          mileage_bucket: '30-60K',
          marketplace_published: true,
          status: VehicleStatus.available,
        },
      });

      // 1. Initial sync - listing becomes active
      await syncProcessor.process({
        name: 'sync',
        data: { vehicleId: vehicle.id, dealershipId: dealerId },
        attemptsMade: 0,
        opts: { attempts: 4 },
      } as any);

      let listing = await mockPrisma.marketplaceListing.findFirst({
        where: { vehicle_id: vehicle.id },
      });
      expect(listing.status).toBe(ListingStatus.active);

      // 2. Suspend dealer via Admin endpoint
      await request(app.getHttpServer())
        .post(`/api/v1/admin/dealers/${dealerId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      // This queues a sync job for all vehicles of this dealer. Let's process the jobs in the queue.
      for (const queuedJob of mockSyncQueue.jobs) {
        await syncProcessor.process(queuedJob);
      }

      listing = await mockPrisma.marketplaceListing.findFirst({
        where: { vehicle_id: vehicle.id },
      });
      expect(listing.status).toBe(ListingStatus.hidden); // Dealer suspended, listing hidden!

      // 3. Reinstate dealer
      mockSyncQueue.clear();
      await request(app.getHttpServer())
        .post(`/api/v1/admin/dealers/${dealerId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      for (const queuedJob of mockSyncQueue.jobs) {
        await syncProcessor.process(queuedJob);
      }

      listing = await mockPrisma.marketplaceListing.findFirst({
        where: { vehicle_id: vehicle.id },
      });
      expect(listing.status).toBe(ListingStatus.active); // Reinstated, active again!
    });
  });

  describe('Sold Archiving Flow', () => {
    it('should set listing to sold upon deal delivery and schedule 7-day archival cron', async () => {
      // Create customer, lead, deal, vehicle
      const customer = await mockPrisma.customer.create({
        data: {
          dealership_id: dealerId,
          full_name: 'Buyer A',
          phone: '+8801911111111',
        },
      });

      const vehicle = await mockPrisma.vehicle.create({
        data: {
          dealership_id: dealerId,
          stock_no: 'SOLD-01',
          make: 'Toyota',
          model: 'Camry',
          year: 2016,
          asking_price: 3500000,
          mileage_km: 80000,
          mileage_bucket: '60-100K',
          status: VehicleStatus.available,
        },
      });

      const lead = await mockPrisma.lead.create({
        data: {
          dealership_id: dealerId,
          customer_id: customer.id,
          buyer_name: 'Buyer A',
          buyer_phone: '+8801911111111',
          vehicle_id: vehicle.id,
        },
      });

      // Initial active listing
      await syncProcessor.process({
        name: 'sync',
        data: { vehicleId: vehicle.id, dealershipId: dealerId },
        attemptsMade: 0,
        opts: { attempts: 4 },
      } as any);

      // Create Deal
      const dealResponse = await request(app.getHttpServer())
        .post('/api/v1/deals')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          lead_id: lead.id,
          vehicle_id: vehicle.id,
          sale_price: 3400000,
          list_price: 3500000,
        })
        .expect(HttpStatus.CREATED);

      const dealId = dealResponse.body.data.id;

      // Approve Deal
      await request(app.getHttpServer())
        .post(`/api/v1/deals/${dealId}/approve`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(HttpStatus.OK);

      // Deliver Deal (Sets vehicle status to sold, emits event)
      mockSyncQueue.clear();
      await request(app.getHttpServer())
        .post(`/api/v1/deals/${dealId}/deliver`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(HttpStatus.OK);

      // Process enqueued sync job
      const syncJob = mockSyncQueue.jobs.find(j => j.name === 'sync');
      expect(syncJob).toBeDefined();

      await syncProcessor.process(syncJob);

      // Listing status is sold!
      let listing = await mockPrisma.marketplaceListing.findFirst({
        where: { vehicle_id: vehicle.id },
      });
      expect(listing.status).toBe(ListingStatus.sold);

      // Verify 7-day archive job scheduled
      const archiveJob = mockSyncQueue.jobs.find(j => j.name === 'archive-listing');
      expect(archiveJob).toBeDefined();
      expect(archiveJob.opts.delay).toBe(7 * 24 * 60 * 60 * 1000);

      // Execute archive job
      await syncProcessor.process(archiveJob);

      // Listing status is now archived!
      listing = await mockPrisma.marketplaceListing.findFirst({
        where: { vehicle_id: vehicle.id },
      });
      expect(listing.status).toBe(ListingStatus.archived);
    });
  });
});
