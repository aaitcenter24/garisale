import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../../modules/auth/token.service';
import { RedisService } from '../../modules/redis/redis.service';

@Injectable()
export class JwtAdminGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('AUTH_TOKEN_MISSING');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.tokenService.verifyAdminAccessToken(token);

      // Verify session exists in Redis to enforce idle session timeout
      const sessionKey = `admin_session:${payload.jti}`;
      const sessionActive = await this.redis.get(sessionKey);
      if (!sessionActive) {
        throw new UnauthorizedException('AUTH_SESSION_EXPIRED');
      }

      // Reset TTL to 1800 seconds (30 minutes) on each request
      await this.redis.set(sessionKey, 'active', 1800);

      const ADMIN_ROLES = [
        'admin_user',
        'operations_manager',
        'super_admin',
        'finance_admin',
        'content_moderator',
        'marketing_admin',
        'system_admin'
      ];
      if (!ADMIN_ROLES.includes(payload.role)) {
        throw new UnauthorizedException('AUTH_INSUFFICIENT_ROLE');
      }
      request.user = {
        sub: payload.sub,
        user_id: payload.sub,
        role: payload.role,
      };
      return true;
    } catch (err) {
      throw new UnauthorizedException('AUTH_TOKEN_INVALID');
    }
  }
}
