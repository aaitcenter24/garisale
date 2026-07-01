import { Module } from '@nestjs/common';
import { DomainController } from './domain.controller';
import { DealershipController } from './dealerships.controller';
import { DomainService } from './domain.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DomainController, DealershipController],
  providers: [DomainService],
  exports: [DomainService],
})
export class DomainModule {}
