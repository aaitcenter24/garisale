import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ImvService } from './imv.service';

@Processor('imv-recalculate')
export class ImvProcessor extends WorkerHost implements OnApplicationShutdown {
  private readonly logger = new Logger(ImvProcessor.name);

  constructor(private readonly imvService: ImvService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { name } = job;
    this.logger.log(`Processing IMV job ${job.id} (name: ${name})`);

    if (name === 'nightly_recalculate') {
      return this.imvService.runNightlyRecalculation();
    } else if (name === 'single_recalculate') {
      return this.imvService.calculateSingleListingImv(job.data.vehicleId);
    }
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`ImvProcessor shutting down on signal ${signal}. Closing BullMQ worker...`);
    if (this.worker) {
      const closePromise = this.worker.close();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Worker close timeout exceeded')), 30000)
      );
      try {
        await Promise.race([closePromise, timeoutPromise]);
        this.logger.log(`ImvProcessor BullMQ worker closed gracefully.`);
      } catch (err: any) {
        this.logger.error(`ImvProcessor BullMQ worker close error or timeout: ${err.message}`);
        await this.worker.close(true);
      }
    }
  }
}
