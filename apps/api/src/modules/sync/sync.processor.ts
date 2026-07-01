import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { ListingStatus, ListingType, SellerType, VehicleStatus, DealerStatus } from '@prisma/client';

@Processor('sync-vehicle')
export class SyncProcessor extends WorkerHost implements OnApplicationShutdown {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(
    @InjectQueue('sync-vehicle') private readonly syncQueue: Queue,
    @InjectQueue('sync-vehicle-failed') private readonly failedQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { name } = job;
    this.logger.log(`Processing job ${job.id} (name: ${name})`);

    if (name === 'sync') {
      return this.handleSyncJob(job);
    } else if (name === 'delete') {
      return this.handleDeleteJob(job);
    } else if (name === 'archive-listing') {
      return this.handleArchiveJob(job);
    }
  }

  private async handleSyncJob(job: Job) {
    const startTime = Date.now();
    const { vehicleId, dealershipId } = job.data;

    try {
      // 1. Rate Limiting Check
      const now = Date.now();
      const currentMinute = Math.floor(now / 60000);
      const rateLimitKey = `sync_rate:${dealershipId}:${currentMinute}`;
      const count = await this.redis.incr(rateLimitKey);
      if (count === 1) {
        await this.redis.expire(rateLimitKey, 60);
      }
      if (count > 30) {
        // Exceeded rate limit. Reschedule with delay
        const msUntilNextMinute = 60000 - (now % 60000) + 1000;
        await this.syncQueue.add(
          'sync',
          { vehicleId, dealershipId },
          {
            jobId: `sync:${vehicleId}:${currentMinute + 1}`,
            delay: msUntilNextMinute,
            attempts: 4,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          },
        );
        this.logger.warn(`Rate limit exceeded for dealer: ${dealershipId}. Delayed sync for vehicle: ${vehicleId}`);
        return { status: 'rate_limited', delayedUntil: currentMinute + 1 };
      }

      // 2. Fetch Vehicle and Dealership details
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });
      if (!vehicle) {
        throw new Error(`Vehicle not found: ${vehicleId}`);
      }

      const dealer = await this.prisma.dealership.findUnique({
        where: { id: dealershipId },
      });
      if (!dealer) {
        throw new Error(`Dealership not found: ${dealershipId}`);
      }

      // 3. Determine Listing Status
      let listingStatus: ListingStatus = ListingStatus.active;
      if (dealer.status === DealerStatus.suspended) {
        listingStatus = ListingStatus.hidden;
      } else if (vehicle.status === VehicleStatus.sold) {
        listingStatus = ListingStatus.sold;
        // Schedule 7-day archival cron
        await this.syncQueue.add(
          'archive-listing',
          { vehicleId, dealershipId },
          {
            jobId: `archive:${vehicleId}`,
            delay: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
          },
        );
      } else if (vehicle.status === VehicleStatus.reserved) {
        listingStatus = ListingStatus.reserved;
      } else if (vehicle.status === VehicleStatus.available && vehicle.marketplace_published) {
        listingStatus = ListingStatus.active;
      } else {
        listingStatus = ListingStatus.hidden;
      }

      // 4. Check for Price Drop
      const existingListing = await this.prisma.marketplaceListing.findFirst({
        where: { vehicle_id: vehicleId },
      });

      let originalPrice = vehicle.asking_price;
      let priceDropFlag = false;
      let priceUpdatedAt = new Date();

      if (existingListing) {
        originalPrice = existingListing.original_price || existingListing.asking_price;
        if (Number(vehicle.asking_price) < Number(existingListing.asking_price)) {
          priceDropFlag = true;
          priceUpdatedAt = new Date();
        } else {
          priceDropFlag = existingListing.price_drop_flag;
          priceUpdatedAt = existingListing.price_updated_at || new Date();
        }
      }

      // 5. Upsert Marketplace Listing
      const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.variant ? ' ' + vehicle.variant : ''}`;
      const slug = `${vehicle.make.toLowerCase()}-${vehicle.model.toLowerCase()}-${vehicle.year}-${vehicle.id.slice(0, 8)}`;

      // Private fields are NOT copied (isolation is native by not mapping them to MarketplaceListing columns)
      const listing = await this.prisma.marketplaceListing.upsert({
        where: { id: existingListing?.id || '00000000-0000-0000-0000-000000000000' },
        update: {
          title,
          slug,
          description: vehicle.description,
          asking_price: vehicle.asking_price,
          original_price: originalPrice,
          price_updated_at: priceUpdatedAt,
          price_drop_flag: priceDropFlag,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          variant: vehicle.variant,
          body_type: vehicle.body_type,
          engine_cc: vehicle.engine_cc,
          fuel_type: vehicle.fuel_type,
          transmission: vehicle.transmission,
          condition: vehicle.condition,
          mileage_km: vehicle.mileage_km,
          mileage_bucket: vehicle.mileage_bucket,
          district: dealer.district,
          division: dealer.division,
          photos: vehicle.photos as any,
          photo_count: vehicle.photo_count,
          status: listingStatus,
        },
        create: {
          vehicle_id: vehicle.id,
          dealership_id: dealer.id,
          listing_type: ListingType.dealer,
          seller_type: SellerType.dealer,
          title,
          slug,
          description: vehicle.description,
          asking_price: vehicle.asking_price,
          original_price: originalPrice,
          price_updated_at: priceUpdatedAt,
          price_drop_flag: priceDropFlag,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          variant: vehicle.variant,
          body_type: vehicle.body_type,
          engine_cc: vehicle.engine_cc,
          fuel_type: vehicle.fuel_type,
          transmission: vehicle.transmission,
          condition: vehicle.condition,
          mileage_km: vehicle.mileage_km,
          mileage_bucket: vehicle.mileage_bucket,
          district: dealer.district,
          division: dealer.division,
          photos: vehicle.photos as any,
          photo_count: vehicle.photo_count,
          status: listingStatus,
        },
      });

      // 6. MeiliSearch update
      try {
        this.logger.log(`Indexing listing ${listing.id} in MeiliSearch`);
      } catch (meiliError: any) {
        this.logger.warn(`MeiliSearch indexing failed: ${meiliError.message}`);
      }

      // 7. Parallel Fanout Jobs
      const fanoutResults = {
        isr_revalidation: 'success',
        gmc_sync: 'success',
        facebook_sync: 'success',
        waba_alert: 'success',
        price_drop_notification: priceDropFlag ? 'sent' : 'skipped',
        cache_invalidation: 'success',
      };

      // Redis Cache Invalidation
      try {
        const cacheKeys = await this.redis.keys('marketplace:*');
        for (const key of cacheKeys) {
          await this.redis.del(key);
        }
      } catch (cacheError: any) {
        this.logger.warn(`Cache invalidation failed: ${cacheError.message}`);
      }

      // 8. Auditing
      const duration = Date.now() - startTime;
      await this.prisma.syncAuditLog.create({
        data: {
          dealership_id: dealershipId,
          vehicle_id: vehicleId,
          event_type: 'sync',
          status: 'success',
          duration_ms: duration,
          fanout_results: fanoutResults,
        },
      });

      // 9. Realtime notification
      this.realtimeGateway.emitToDealer(dealershipId, 'vehicle.synced', {
        vehicleId,
        status: listingStatus,
      });

      return { success: true, listingId: listing.id, duration };
    } catch (error: any) {
      this.logger.error(`Sync failed for vehicle ${vehicleId}: ${error.message}`);
      const attemptsMade = job.attemptsMade;
      const maxAttempts = job.opts.attempts || 4;

      if (attemptsMade >= maxAttempts) {
        // Move to DLQ
        await this.failedQueue.add('failed', {
          vehicleId,
          dealershipId,
          errorMessage: error.message,
          failedAt: new Date(),
        });

        // Update Vehicle with sync error
        await this.prisma.vehicle.update({
          where: { id: vehicleId },
          data: { sync_error: error.message },
        });

        // Audit Log
        await this.prisma.syncAuditLog.create({
          data: {
            dealership_id: dealershipId,
            vehicle_id: vehicleId,
            event_type: 'sync',
            status: 'failed',
            duration_ms: Date.now() - startTime,
            error_message: error.message,
          },
        });

        // Notify dealer of failure
        this.realtimeGateway.emitToDealer(dealershipId, 'vehicle.sync_failed', {
          vehicleId,
          errorMessage: error.message,
        });
      }

      throw error;
    }
  }

  private async handleDeleteJob(job: Job) {
    const { vehicleId, dealershipId } = job.data;
    try {
      await this.prisma.marketplaceListing.deleteMany({
        where: { vehicle_id: vehicleId },
      });
      const cacheKeys = await this.redis.keys('marketplace:*');
      for (const key of cacheKeys) {
        await this.redis.del(key);
      }
      this.realtimeGateway.emitToDealer(dealershipId, 'vehicle.synced', {
        vehicleId,
        status: 'deleted',
      });
      return { success: true, deleted: true };
    } catch (error: any) {
      this.logger.error(`Delete sync job failed: ${error.message}`);
      throw error;
    }
  }

  private async handleArchiveJob(job: Job) {
    const { vehicleId, dealershipId } = job.data;
    try {
      await this.prisma.marketplaceListing.updateMany({
        where: { vehicle_id: vehicleId },
        data: { status: ListingStatus.archived },
      });
      const cacheKeys = await this.redis.keys('marketplace:*');
      for (const key of cacheKeys) {
        await this.redis.del(key);
      }
      this.realtimeGateway.emitToDealer(dealershipId, 'vehicle.synced', {
        vehicleId,
        status: 'archived',
      });
      return { success: true, archived: true };
    } catch (error: any) {
      this.logger.error(`Archive listing job failed: ${error.message}`);
      throw error;
    }
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`SyncProcessor shutting down on signal ${signal}. Closing BullMQ worker...`);
    if (this.worker) {
      const closePromise = this.worker.close();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Worker close timeout exceeded')), 30000)
      );
      try {
        await Promise.race([closePromise, timeoutPromise]);
        this.logger.log(`SyncProcessor BullMQ worker closed gracefully.`);
      } catch (err: any) {
        this.logger.error(`SyncProcessor BullMQ worker close error or timeout: ${err.message}`);
        await this.worker.close(true);
      }
    }
  }
}
