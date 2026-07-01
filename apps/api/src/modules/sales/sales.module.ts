import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PdfService } from '../../common/services/pdf.service';
import { R2Service } from '../../common/services/r2.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SalesController],
  providers: [SalesService, PdfService, R2Service],
  exports: [SalesService],
})
export class SalesModule {}
