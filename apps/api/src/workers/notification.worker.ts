import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  process.env.RUN_WORKERS = 'true';
  process.env.WORKER_TYPE = 'notification';

  const logger = new Logger('NotificationWorker');
  logger.log('Starting Notification Worker...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  app.enableShutdownHooks();
  await app.init();
  
  logger.log('Notification Worker initialized. Processing: notification-sms, notification-push');
}

bootstrap().catch(err => {
  console.error('Failed to start Notification Worker', err);
  process.exit(1);
});
