import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ImvService } from './imv.service';
import { ImvProcessor } from './imv.processor';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';

const providers: any[] = [ImvService];
if (
  process.env.RUN_WORKERS === 'true' &&
  (process.env.WORKER_TYPE === 'main' || process.env.WORKER_TYPE === 'analytics' || !process.env.WORKER_TYPE)
) {
  providers.push(ImvProcessor);
}

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    BullModule.registerQueue({
      name: 'imv-recalculate',
    }),
  ],
  providers,
  exports: [ImvService, BullModule],
})
export class ImvModule {}
