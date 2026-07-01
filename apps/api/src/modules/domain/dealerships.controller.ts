import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DealerContextGuard } from '../../common/guards/dealer-context.guard';

@Controller('api/v1/dealerships')
export class DealershipController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, DealerContextGuard)
  async getMe(@Req() req: any) {
    const dealer = await this.prisma.dealership.findUnique({
      where: { id: req.dealerId },
    });

    const testFlagEnabled = (await this.redis.get('feature_flag:test_flag')) === 'true';

    return {
      success: true,
      data: {
        ...dealer,
        features: {
          test_flag: testFlagEnabled,
        },
      },
    };
  }
}
