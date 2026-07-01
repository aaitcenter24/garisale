import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TokenService } from './token.service';
import { OtpService } from './otp.service';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { authenticator } from 'otplib';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private token: TokenService,
    private otp: OtpService,
    private eventEmitter: EventEmitter2,
  ) {}

  async sendOtp(phone: string, purpose: string, ipAddress?: string): Promise<{ code: string }> {
    const code = await this.otp.generateOtp(phone, purpose, ipAddress);
    return { code };
  }

  async verifyOtpAndLogin(phone: string, code: string, purpose: string, deviceInfo?: string, ipAddress?: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    // 1. Verify OTP
    await this.otp.verifyOtp(phone, code, purpose);

    // 2. Find or register user
    let user = await this.prisma.user.findUnique({
      where: { phone },
      include: { staffRecords: true },
    });

    if (!user) {
      // For testing, register a new buyer role if they don't exist
      user = await this.prisma.user.create({
        data: {
          phone,
          full_name: 'New Registered User',
          role: UserRole.buyer,
          status: UserStatus.active,
        },
        include: { staffRecords: true },
      });
    }

    if (user.status !== UserStatus.active) {
      throw new UnauthorizedException('User account is not active');
    }

    // 3. Issue tokens
    let dealerId = '';
    let role = user.role;

    if (user.role !== UserRole.admin_user) {
      const activeStaff = user.staffRecords.find(s => s.is_active);
      if (activeStaff) {
        dealerId = activeStaff.dealership_id;
        role = activeStaff.role;
      }
    }

    let accessToken: string;
    if (user.role === UserRole.admin_user) {
      accessToken = await this.token.issueAdminAccessToken({ user_id: user.id, role: user.role });
    } else {
      accessToken = await this.token.issueDealerAccessToken({ user_id: user.id, dealer_id: dealerId, role });
    }

    const refreshToken = await this.token.issueRefreshToken(user.id, deviceInfo, ipAddress);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
        login_count: { increment: 1 },
        failed_login_count: 0,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        dealer_id: dealerId,
      },
    };
  }

  async loginWithPassword(phone: string, password_hash: string, deviceInfo?: string, ipAddress?: string, totpCode?: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          { email: phone }
        ]
      },
      include: { staffRecords: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account lockout
    if (user.locked_until && user.locked_until > new Date()) {
      throw new UnauthorizedException('Account locked due to too many failed attempts. Try again later.');
    }

    if (!user.password_hash) {
      throw new BadRequestException('This account does not have password login configured. Use OTP instead.');
    }

    const isMatch = await bcrypt.compare(password_hash, user.password_hash);
    if (!isMatch) {
      const failedCount = user.failed_login_count + 1;
      const lockedUntil = failedCount >= 10 ? new Date(Date.now() + 1800 * 1000) : null; // lock 30 min on 10 failures

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failed_login_count: failedCount,
          locked_until: lockedUntil,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.active) {
      throw new UnauthorizedException('User account is not active');
    }

    // Check if user is an admin
    const isAdmin = user.role === UserRole.admin_user;

    if (isAdmin) {
      if (!user.totp_enabled) {
        // Setup flow
        if (!totpCode) {
          const secret = user.totp_secret || authenticator.generateSecret();
          if (!user.totp_secret) {
            await this.prisma.user.update({
              where: { id: user.id },
              data: { totp_secret: secret },
            });
          }
          const otpauthUrl = authenticator.keyuri(user.email || user.phone, 'Garisale Dealer OS', secret);
          throw new BadRequestException({
            code: 'MFA_SETUP_REQUIRED',
            message: 'TOTP 2FA setup is required.',
            totp_secret: secret,
            otpauth_url: otpauthUrl,
          });
        }

        // Verify setup
        const isValid = authenticator.verify({
          token: totpCode,
          secret: user.totp_secret || '',
        });

        if (!isValid) {
          throw new UnauthorizedException('Invalid TOTP token.');
        }

        await this.prisma.user.update({
          where: { id: user.id },
          data: { totp_enabled: true, totp_failed_attempts: 0 },
        });
      } else {
        // Verification flow
        if (!totpCode) {
          throw new UnauthorizedException('TOTP_REQUIRED');
        }

        const isValid = authenticator.verify({
          token: totpCode,
          secret: user.totp_secret || '',
        });

        if (!isValid) {
          const failedCount = user.totp_failed_attempts + 1;
          
          if (failedCount >= 5) {
            await this.prisma.user.update({
              where: { id: user.id },
              data: {
                totp_failed_attempts: failedCount,
                status: UserStatus.suspended, // Deactivate
              },
            });

            // Notify Super Admin
            let superAdminPhone = '+8801711111110';
            const superAdmin = await this.prisma.user.findFirst({
              where: { role: UserRole.admin_user, admin_role: 'super_admin' },
            });
            if (superAdmin) {
              superAdminPhone = superAdmin.phone;
            }

            this.eventEmitter.emit('automation.send_sms', {
              to: superAdminPhone,
              body: `Garisale Admin Security Alert: Admin account for ${user.email || user.phone} has been deactivated due to 5 failed TOTP attempts.`,
              dealership_id: 'SYSTEM',
            });

            throw new UnauthorizedException('Account deactivated due to too many failed TOTP attempts.');
          }

          await this.prisma.user.update({
            where: { id: user.id },
            data: { totp_failed_attempts: failedCount },
          });

          throw new UnauthorizedException(`Invalid TOTP token. ${5 - failedCount} attempts remaining.`);
        }

        await this.prisma.user.update({
          where: { id: user.id },
          data: { totp_failed_attempts: 0 },
        });
      }
    }

    // Issue tokens
    let dealerId = '';
    let role = user.role;

    if (user.role !== UserRole.admin_user) {
      const activeStaff = user.staffRecords.find(s => s.is_active);
      if (activeStaff) {
        dealerId = activeStaff.dealership_id;
        role = activeStaff.role;
      }
    }

    let accessToken: string;
    if (user.role === UserRole.admin_user) {
      accessToken = await this.token.issueAdminAccessToken({ user_id: user.id, role: user.admin_role || 'admin_user' });
    } else {
      accessToken = await this.token.issueDealerAccessToken({ user_id: user.id, dealer_id: dealerId, role });
    }

    const refreshToken = await this.token.issueRefreshToken(user.id, deviceInfo, ipAddress);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
        login_count: { increment: 1 },
        failed_login_count: 0,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        admin_role: user.admin_role,
        dealer_id: dealerId,
      },
    };
  }

  async refresh(refreshToken: string, deviceInfo?: string, ipAddress?: string) {
    return this.token.rotateRefreshToken(refreshToken, deviceInfo, ipAddress);
  }

  async logout(refreshToken: string) {
    await this.token.revokeRefreshToken(refreshToken);
  }
}
