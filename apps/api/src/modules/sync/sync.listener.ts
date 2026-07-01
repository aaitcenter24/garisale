import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SyncListener {
  private readonly logger = new Logger(SyncListener.name);

  constructor(
    @InjectQueue('sync-vehicle') private readonly syncQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('inventory.vehicle.created')
  @OnEvent('inventory.vehicle.updated')
  async handleVehicleSync(payload: { vehicleId: string; dealershipId: string }) {
    try {
      this.logger.log(`Received vehicle sync event for vehicle: ${payload.vehicleId}`);
      await this.syncQueue.add(
        'sync',
        { vehicleId: payload.vehicleId, dealershipId: payload.dealershipId },
        {
          jobId: `sync:${payload.vehicleId}`,
          attempts: 4,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );
    } catch (err: any) {
      this.logger.error(`Failed to handle vehicle sync event for vehicle ${payload.vehicleId}: ${err.message}`, err.stack);
    }
  }

  @OnEvent('inventory.vehicle.deleted')
  async handleVehicleDeleted(payload: { vehicleId: string; dealershipId: string }) {
    try {
      this.logger.log(`Received vehicle deleted event for vehicle: ${payload.vehicleId}`);
      await this.syncQueue.add(
        'delete',
        { vehicleId: payload.vehicleId, dealershipId: payload.dealershipId },
        {
          jobId: `delete:${payload.vehicleId}`,
        },
      );
    } catch (err: any) {
      this.logger.error(`Failed to handle vehicle deleted event for vehicle ${payload.vehicleId}: ${err.message}`, err.stack);
    }
  }

  @OnEvent('sales.deal.delivered')
  async handleDealDelivered(payload: { dealId: string; dealershipId: string; vehicleId: string }) {
    try {
      this.logger.log(`Received deal delivered event for vehicle: ${payload.vehicleId}`);
      await this.syncQueue.add(
        'sync',
        { vehicleId: payload.vehicleId, dealershipId: payload.dealershipId },
        {
          jobId: `sync:${payload.vehicleId}`,
          attempts: 4,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );
    } catch (err: any) {
      this.logger.error(`Failed to handle deal delivered event for deal ${payload.dealId}: ${err.message}`, err.stack);
    }
  }

  @OnEvent('sales.deal.cancelled')
  async handleDealCancelled(payload: { dealId: string; dealershipId: string; vehicleId: string }) {
    try {
      this.logger.log(`Received deal cancelled event for vehicle: ${payload.vehicleId}`);
      await this.syncQueue.add(
        'sync',
        { vehicleId: payload.vehicleId, dealershipId: payload.dealershipId },
        {
          jobId: `sync:${payload.vehicleId}`,
          attempts: 4,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );
    } catch (err: any) {
      this.logger.error(`Failed to handle deal cancelled event for deal ${payload.dealId}: ${err.message}`, err.stack);
    }
  }

  @OnEvent('dealer.status_changed')
  async handleDealerStatusChanged(payload: { dealershipId: string; status: string }) {
    try {
      this.logger.log(`Received dealer status changed event for dealer: ${payload.dealershipId}`);
      const vehicles = await this.prisma.vehicle.findMany({
        where: { dealership_id: payload.dealershipId },
        select: { id: true },
      });

      for (const v of vehicles) {
        await this.syncQueue.add(
          'sync',
          { vehicleId: v.id, dealershipId: payload.dealershipId },
          {
            jobId: `sync:${v.id}`,
            attempts: 4,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          },
        );
      }
    } catch (err: any) {
      this.logger.error(`Failed to handle dealer status changed event for dealer ${payload.dealershipId}: ${err.message}`, err.stack);
    }
  }
}
