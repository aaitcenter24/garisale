import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MaestroService } from './maestro.service';
import { MaestroProcessor } from './maestro.processor';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';

const providers: any[] = [MaestroService];
if (
  process.env.RUN_WORKERS === 'true' &&
  (process.env.WORKER_TYPE === 'analytics' || !process.env.WORKER_TYPE)
) {
  providers.push(MaestroProcessor);
}

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    BullModule.registerQueue({
      name: 'maestro-insights',
    }),
  ],
  providers,
  exports: [MaestroService, BullModule],
})
export class MaestroModule {}
