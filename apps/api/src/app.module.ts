import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CrmModule } from './modules/crm/crm.module';
import { SalesModule } from './modules/sales/sales.module';
import { AutomationModule } from './modules/automation/automation.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { AdminModule } from './modules/admin/admin.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { SyncModule } from './modules/sync/sync.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { DomainModule } from './modules/domain/domain.module';
import { ImvModule } from './modules/imv/imv.module';
import { MaestroModule } from './modules/maestro/maestro.module';
import { SecurityHeadersMiddleware, RateLimiterMiddleware } from './common/middleware/security.middleware';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL') || 'redis://localhost:6379';
        const connectionConfig = redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')
          ? { url: redisUrl }
          : { host: 'localhost', port: 6379 };
        return {
          connection: {
            ...connectionConfig,
            maxRetriesPerRequest: null,
          },
        };
      },
      inject: [ConfigService],
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    InventoryModule,
    CrmModule,
    SalesModule,
    ExpensesModule,
    AutomationModule,
    MarketplaceModule,
    AdminModule,
    PaymentsModule,
    SyncModule,
    RealtimeModule,
    DomainModule,
    ImvModule,
    MaestroModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityHeadersMiddleware, RateLimiterMiddleware)
      .forRoutes('*');
  }
}


