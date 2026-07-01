import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminIpGuard } from '../../common/guards/admin-ip.guard';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminService, AdminIpGuard],
  exports: [AdminService],
})
export class AdminModule {}
