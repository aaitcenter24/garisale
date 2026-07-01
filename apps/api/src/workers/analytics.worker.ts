import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  process.env.RUN_WORKERS = 'true';
  process.env.WORKER_TYPE = 'analytics';

  const logger = new Logger('AnalyticsWorker');
  logger.log('Starting Analytics Worker...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  app.enableShutdownHooks();
  await app.init();
  
  logger.log('Analytics Worker initialized. Processing: maestro-insights, daily-summary, aging-watchlist, lead-score-decay, imv-recalculate (nightly), subscription-expiry');
}

bootstrap().catch(err => {
  console.error('Failed to start Analytics Worker', err);
  process.exit(1);
});
