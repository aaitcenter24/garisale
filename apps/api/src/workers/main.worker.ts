import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  process.env.RUN_WORKERS = 'true';
  process.env.WORKER_TYPE = 'main';

  const logger = new Logger('MainWorker');
  logger.log('Starting Main Worker...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  app.enableShutdownHooks();
  await app.init();
  
  logger.log('Main Worker initialized. Processing: sync-vehicle, dealer-website-isr, imv-recalculate (instant), lead-follow-up, lead-contact-sla, lead-score-update, redis-cache-invalidation');
}

bootstrap().catch(err => {
  console.error('Failed to start Main Worker', err);
  process.exit(1);
});
