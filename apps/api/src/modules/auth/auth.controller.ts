import { Controller, Post, Body, Req, Ip, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  async sendOtp(
    @Body('phone') phone: string,
    @Body('purpose') purpose: string,
    @Ip() ipAddress: string,
  ) {
    const result = await this.authService.sendOtp(phone, purpose, ipAddress);
    return {
      success: true,
      data: {
        phone,
        purpose,
        // Expose code in response for testing/development
        code: result.code,
      },
    };
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body('phone') phone: string,
    @Body('code') code: string,
    @Body('purpose') purpose: string,
    @Req() request: Request,
    @Ip() ipAddress: string,
  ) {
    const deviceInfo = request.headers['user-agent'] || '';
    const result = await this.authService.verifyOtpAndLogin(phone, code, purpose, deviceInfo, ipAddress);

    return {
      success: true,
      data: {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        user: result.user,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginWithPassword(
    @Body('phone') phone: string,
    @Body('password') password_hash: string,
    @Body('totp_code') totpCode: string,
    @Req() request: Request,
    @Ip() ipAddress: string,
  ) {
    const deviceInfo = request.headers['user-agent'] || '';
    const result = await this.authService.loginWithPassword(phone, password_hash, deviceInfo, ipAddress, totpCode);

    return {
      success: true,
      data: {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        user: result.user,
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body('refresh_token') refreshToken: string,
    @Req() request: Request,
    @Ip() ipAddress: string,
  ) {
    const deviceInfo = request.headers['user-agent'] || '';
    const result = await this.authService.refresh(refreshToken, deviceInfo, ipAddress);

    return {
      success: true,
      data: {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
      },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body('refresh_token') refreshToken: string) {
    await this.authService.logout(refreshToken);
    return {
      success: true,
      data: {
        message: 'Successfully logged out',
      },
    };
  }
}
