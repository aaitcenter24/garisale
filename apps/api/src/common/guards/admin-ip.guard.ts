import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminIpGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const listStr = this.config.get<string>('ADMIN_IP_ALLOWLIST');
    let allowlist: string[] = [];
    if (listStr) {
      allowlist = listStr.split(',').map(ip => ip.trim());
    }

    const request = context.switchToHttp().getRequest();
    
    // Cloudflare IP header fallback to request IP
    const clientIp = (request.headers['cf-connecting-ip'] || request.ip || '').toString().trim();

    if (allowlist.length === 0) {
      // If no allowlist is configured in development, allow all
      return true;
    }

    const isAllowed = allowlist.some(ipOrCidr => this.ipMatches(clientIp, ipOrCidr));

    if (!isAllowed) {
      // Throw 404 (NotFound) instead of 403 (Forbidden) to fail-secure
      throw new NotFoundException();
    }

    return true;
  }

  private ipMatches(ip: string, cidr: string): boolean {
    if (!cidr.includes('/')) {
      return ip === cidr;
    }
    try {
      const [range, bitsStr] = cidr.split('/');
      const bits = parseInt(bitsStr, 10);
      const ipOctets = ip.split('.').map(Number);
      const rangeOctets = range.split('.').map(Number);
      if (ipOctets.length !== 4 || rangeOctets.length !== 4) return false;

      const ipInt = ipOctets[0] * 16777216 + ipOctets[1] * 65536 + ipOctets[2] * 256 + ipOctets[3];
      const rangeInt = rangeOctets[0] * 16777216 + rangeOctets[1] * 65536 + rangeOctets[2] * 256 + rangeOctets[3];

      const shift = 32 - bits;
      if (shift === 32) return true; // bits === 0 matches everything
      const divisor = Math.pow(2, shift);
      return Math.floor(ipInt / divisor) === Math.floor(rangeInt / divisor);
    } catch {
      return false;
    }
  }
}
