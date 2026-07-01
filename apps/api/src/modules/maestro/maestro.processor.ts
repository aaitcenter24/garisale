import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { MaestroService } from './maestro.service';

@Processor('maestro-insights')
export class MaestroProcessor extends WorkerHost implements OnApplicationShutdown {
  private readonly logger = new Logger(MaestroProcessor.name);

  constructor(private readonly maestroService: MaestroService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { name } = job;
    this.logger.log(`Processing Maestro job ${job.id} (name: ${name})`);

    if (name === 'daily_insights') {
      return this.maestroService.generateDailyInsights(job.data.dealershipId);
    } else if (name === 'daily_summary') {
      return this.maestroService.generateDailySummary(job.data.dealershipId);
    } else if (name === 'lead_decay') {
      return this.maestroService.decayAllLeads();
    }
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`MaestroProcessor shutting down on signal ${signal}. Closing BullMQ worker...`);
    if (this.worker) {
      const closePromise = this.worker.close();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Worker close timeout exceeded')), 30000)
      );
      try {
        await Promise.race([closePromise, timeoutPromise]);
        this.logger.log(`MaestroProcessor BullMQ worker closed gracefully.`);
      } catch (err: any) {
        this.logger.error(`MaestroProcessor BullMQ worker close error or timeout: ${err.message}`);
        await this.worker.close(true);
      }
    }
  }
}
