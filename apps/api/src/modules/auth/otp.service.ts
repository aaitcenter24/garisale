import { Injectable, BadRequestException, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async generateOtp(phone: string, purpose: string, ipAddress?: string): Promise<string> {
    // 1. Rate limit check: Max 3 requests per phone per 10 minutes
    const rateLimitKey = `otp_rate:${phone}`;
    const currentRequestsStr = await this.redis.get(rateLimitKey);
    const currentRequests = currentRequestsStr ? parseInt(currentRequestsStr, 10) : 0;

    if (currentRequests >= 3) {
      throw new HttpException('Max OTP requests reached. Please try again in 10 minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }

    // 2. Generate 6-digit numeric code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 300 * 1000); // 5 minutes TTL

    // 3. Save to DB
    await this.prisma.otp.create({
      data: {
        phone,
        code,
        purpose,
        expires_at: expiresAt,
        ip_address: ipAddress,
      },
    });

    // 4. Increment rate limit counter and set TTL if new
    await this.redis.incr(rateLimitKey);
    if (currentRequests === 0) {
      await this.redis.expire(rateLimitKey, 600); // 10 minutes rate limit window
    }

    // 5. In a real application, we would send this code via SMS (Greenweb BD)
    // For local dev/test, we return it or log it
    return code;
  }

  async verifyOtp(phone: string, code: string, purpose: string): Promise<boolean> {
    const now = new Date();

    // Find the latest active OTP for this phone and purpose
    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        phone,
        purpose,
        is_used: false,
        expires_at: { gt: now },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('OTP expired or not found');
    }

    // Check attempt limit (max 5 attempts)
    if (otpRecord.attempts >= 5) {
      // Mark as used to prevent further brute forcing
      await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { is_used: true },
      });
      throw new BadRequestException('Too many failed attempts. This OTP is now invalidated.');
    }

    if (otpRecord.code !== code) {
      // Increment attempts
      const updated = await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });

      if (updated.attempts >= 5) {
        await this.prisma.otp.update({
          where: { id: otpRecord.id },
          data: { is_used: true },
        });
        throw new BadRequestException('Too many failed attempts. This OTP is now invalidated.');
      }

      throw new BadRequestException(`Invalid OTP code. ${5 - updated.attempts} attempts remaining.`);
    }

    // Mark as used on successful verification
    await this.prisma.otp.update({
      where: { id: otpRecord.id },
      data: { is_used: true, used_at: now },
    });

    return true;
  }
}
