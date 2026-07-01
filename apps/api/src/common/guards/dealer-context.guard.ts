import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../modules/database/prisma.service';

@Injectable()
export class DealerContextGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const dealerId = user?.dealer_id;

    if (!dealerId) {
      throw new UnauthorizedException('No dealer context provided in token');
    }

    // Check if dealer is terminated
    const dealer = await this.prisma.dealership.findUnique({
      where: { id: dealerId },
    });

    if (!dealer) {
      throw new UnauthorizedException('Dealership not found');
    }

    if (dealer.status === 'terminated') {
      throw new UnauthorizedException('AUTH_DEALER_SUSPENDED'); // dealer is terminated
    }

    // Check subscription grace period & read-only status
    const sub = await this.prisma.subscription.findUnique({
      where: { dealership_id: dealerId },
    });

    if (sub) {
      const now = new Date();
      const expiresAt = new Date(sub.expires_at);

      if (now > expiresAt) {
        const diffMs = now.getTime() - expiresAt.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays > 30) {
          throw new ForbiddenException('AUTH_DEALER_SUSPENDED');
        } else if (diffDays > 7) {
          const writeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
          if (writeMethods.includes(request.method) && !request.url.includes('/payments/initiate')) {
            throw new ForbiddenException('AUTH_DEALER_READ_ONLY');
          }
        }
      }
    }

    // Set local config parameter for Row-Level Security (RLS)
    await this.prisma.setDealerContext(dealerId);

    request.dealerId = dealerId;
    return true;
  }
}
