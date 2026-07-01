import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SyncListener } from './sync.listener';
import { SyncProcessor } from './sync.processor';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';
import { RealtimeModule } from '../realtime/realtime.module';

const providers: any[] = [SyncListener];
if (
  process.env.RUN_WORKERS === 'true' &&
  (process.env.WORKER_TYPE === 'main' || !process.env.WORKER_TYPE)
) {
  providers.push(SyncProcessor);
}

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    RealtimeModule,
    BullModule.registerQueue(
      { name: 'sync-vehicle' },
      { name: 'sync-vehicle-failed' }
    ),
  ],
  providers,
  exports: [BullModule],
})
export class SyncModule {}
