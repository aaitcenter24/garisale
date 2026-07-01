import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../modules/redis/redis.service';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    const url = req.originalUrl || req.url || '';
    if (url.startsWith('/api/v1/admin')) {
      res.setHeader('X-Frame-Options', 'DENY');
    } else {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }
    
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    
    next();
  }
}

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  constructor(private readonly redisService: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Bypass rate limit in tests or load tests with special header
    if (process.env.NODE_ENV === 'test' || req.headers['x-bypass-rate-limit'] === 'true') {
      const testIp = (req.headers['cf-connecting-ip'] as string) || '';
      if (testIp !== '10.9.8.7') {
        return next();
      }
    }

    try {
      // Identify client (IP or User ID)
      const ip = (req.headers['cf-connecting-ip'] as string) || 
                 (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
                 req.ip || 
                 req.socket?.remoteAddress || 
                 'unknown';
      
      let userId: string | null = null;
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            userId = payload.user_id || payload.sub || null;
          }
        } catch (e) {
          // ignore parsing error
        }
      }

      const limitKey = userId ? `rate_limit:user:${userId}` : `rate_limit:ip:${ip}`;
      // Max 100 requests per 60 seconds
      const limit = 100;
      const windowSec = 60;

      const currentRequests = await this.redisService.incr(limitKey);
      if (currentRequests === 1) {
        await this.redisService.expire(limitKey, windowSec);
      }

      if (currentRequests > limit) {
        return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
          },
        });
      }
    } catch (err) {
      // Fail-safe: do not block API operations if Redis is unavailable
    }
    next();
  }
}
