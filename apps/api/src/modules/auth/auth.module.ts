import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { OtpService } from './otp.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { DealerContextGuard } from '../../common/guards/dealer-context.guard';

@Global()
@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    OtpService,
    JwtAuthGuard,
    JwtAdminGuard,
    DealerContextGuard,
  ],
  exports: [
    AuthService,
    TokenService,
    OtpService,
    JwtAuthGuard,
    JwtAdminGuard,
    DealerContextGuard,
  ],
})
export class AuthModule {}
