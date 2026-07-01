import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  process.env.RUN_WORKERS = 'true';
  process.env.WORKER_TYPE = 'automation';

  const logger = new Logger('AutomationWorker');
  logger.log('Starting Automation Worker...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  app.enableShutdownHooks();
  await app.init();
  
  logger.log('Automation Worker initialized. Processing: automation-whatsapp, automation-facebook, automation-social, automation-email, automation-sms');
}

bootstrap().catch(err => {
  console.error('Failed to start Automation Worker', err);
  process.exit(1);
});
