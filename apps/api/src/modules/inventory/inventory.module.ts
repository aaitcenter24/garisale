import { Module } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { VinService } from '../../common/services/vin.service';
import { R2Service } from '../../common/services/r2.service';
import { RedisModule } from '../redis/redis.module';
import { DatabaseModule } from '../database/database.module';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [DatabaseModule, RedisModule, ExpensesModule],
  controllers: [VehicleController],
  providers: [VehicleService, VinService, R2Service],
  exports: [VehicleService],
})
export class InventoryModule {}
