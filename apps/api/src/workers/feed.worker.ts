import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  process.env.RUN_WORKERS = 'true';
  process.env.WORKER_TYPE = 'feed';

  const logger = new Logger('FeedWorker');
  logger.log('Starting Feed Worker...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  app.enableShutdownHooks();
  await app.init();
  
  logger.log('Feed Worker initialized. Processing: gmc-feed-sync, facebook-catalog-sync, subscription-billing');
}

bootstrap().catch(err => {
  console.error('Failed to start Feed Worker', err);
  process.exit(1);
});
