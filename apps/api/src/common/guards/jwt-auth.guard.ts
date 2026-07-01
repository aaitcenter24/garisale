import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../../modules/auth/token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('AUTH_TOKEN_MISSING');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.tokenService.verifyDealerAccessToken(token);
      request.user = {
        sub: payload.sub,
        user_id: payload.sub,
        dealer_id: payload.dealer_id,
        role: payload.role,
      };
      return true;
    } catch (err) {
      throw new UnauthorizedException('AUTH_TOKEN_INVALID');
    }
  }
}
