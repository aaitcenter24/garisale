import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TokenService {
  private dealerPrivateKey: string;
  private dealerPublicKey: string;
  private adminSecret: string;
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private config: ConfigService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {
    // Load or generate RSA keys for RS256 (dealer tokens)
    const envPrivateKey = this.config.get<string>('JWT_PRIVATE_KEY');
    const envPublicKey = this.config.get<string>('JWT_PUBLIC_KEY');

    if (envPrivateKey && envPublicKey) {
      this.dealerPrivateKey = envPrivateKey.replace(/\\n/g, '\n');
      this.dealerPublicKey = envPublicKey.replace(/\\n/g, '\n');
    } else {
      this.logger.warn('JWT_PRIVATE_KEY or JWT_PUBLIC_KEY not set. Generating ephemeral 2048-bit RSA key pair for testing.');
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      this.dealerPrivateKey = privateKey;
      this.dealerPublicKey = publicKey;
    }

    // Load admin HS256 secret (min 64 chars)
    this.adminSecret = this.config.get<string>('ADMIN_JWT_SECRET') || 'default_admin_jwt_secret_must_be_extremely_long_minimum_64_characters_for_security_2026';
    if (this.adminSecret.length < 64) {
      this.logger.warn('ADMIN_JWT_SECRET is shorter than 64 characters!');
    }
  }

  async issueDealerAccessToken(
    payload: { user_id: string; dealer_id: string; role: string },
    impersonatedBy?: string
  ): Promise<string> {
    const claims: any = {
      sub: payload.user_id,
      dealer_id: payload.dealer_id,
      role: payload.role,
      iss: 'garisale.com',
      aud: 'garisale-api',
      jti: crypto.randomUUID(),
    };
    if (impersonatedBy) {
      claims.is_impersonation = true;
      claims.impersonated_by = impersonatedBy;
    }
    return this.jwtService.sign(
      claims,
      {
        privateKey: this.dealerPrivateKey,
        algorithm: 'RS256',
        expiresIn: impersonatedBy ? '3600s' : '900s', // 3600s for impersonation, 15 minutes otherwise
      },
    );
  }

  async issueAdminAccessToken(payload: { user_id: string; role: string }): Promise<string> {
    const jti = crypto.randomUUID();
    const token = this.jwtService.sign(
      {
        sub: payload.user_id,
        role: payload.role,
        iss: 'garisale.com',
        aud: 'garisale-api',
        jti,
      },
      {
        secret: this.adminSecret,
        algorithm: 'HS256',
        expiresIn: '1800s', // 30 minutes
      },
    );

    // Save admin session in Redis with 1,800s TTL
    await this.redis.set(`admin_session:${jti}`, 'active', 1800);

    return token;
  }

  async verifyDealerAccessToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token, {
        publicKey: this.dealerPublicKey,
        algorithms: ['RS256'],
        audience: 'garisale-api',
        issuer: 'garisale.com',
      });

      if (payload && payload.jti) {
        const isRevoked = await this.redis.get(`revoked_jti:${payload.jti}`);
        if (isRevoked) {
          throw new UnauthorizedException('Impersonation token has been revoked');
        }
      }

      return payload;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired dealer token');
    }
  }

  async verifyAdminAccessToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token, {
        secret: this.adminSecret,
        algorithms: ['HS256'],
        audience: 'garisale-api',
        issuer: 'garisale.com',
      });
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired admin token');
    }
  }

  // Generates opaque refresh token and stores hash in DB
  async issueRefreshToken(userId: string, deviceInfo?: string, ipAddress?: string): Promise<string> {
    const rawToken = crypto.randomBytes(40).toString('hex'); // opaque 80-char hex
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 2592000 * 1000); // 30 days

    await this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        device_info: deviceInfo,
        ip_address: ipAddress,
        expires_at: expiresAt,
      },
    });

    return rawToken;
  }

  // Verification and rotation with attack detection
  async rotateRefreshToken(rawToken: string, deviceInfo?: string, ipAddress?: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Query both active and revoked tokens to detect replay attacks
    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: { token_hash: tokenHash },
      include: { user: { include: { staffRecords: true } } },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const now = new Date();

    // Replay attack detection: if token is already revoked or expired
    if (tokenRecord.revoked_at || tokenRecord.expires_at < now) {
      // SECURITY breach alert: revoke ALL active refresh tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { user_id: tokenRecord.user_id, revoked_at: null },
        data: { revoked_at: now },
      });
      this.logger.error(`Replay attack detected for user ${tokenRecord.user_id}. All sessions revoked.`);
      throw new UnauthorizedException('Token reuse detected. All sessions revoked.');
    }

    // Revoke the current token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked_at: now, last_used_at: now },
    });

    // Check user and dealership status
    const user = tokenRecord.user;
    if (user.status !== 'active') {
      throw new UnauthorizedException('User is not active');
    }

    let dealerId = '';
    let role = user.role;

    if (user.role !== 'admin_user') {
      // Find active staff record
      const staffRecord = user.staffRecords.find(s => s.is_active);
      if (!staffRecord) {
        throw new UnauthorizedException('User is not associated with an active dealership');
      }
      dealerId = staffRecord.dealership_id;
      role = staffRecord.role;

      // Verify dealership status
      const dealer = await this.prisma.dealership.findUnique({
        where: { id: dealerId },
      });
      if (!dealer || dealer.status === 'terminated') {
        throw new UnauthorizedException('Dealership is terminated');
      }
    }

    // Issue new pair
    let accessToken: string;
    if (user.role === 'admin_user') {
      accessToken = await this.issueAdminAccessToken({ user_id: user.id, role: user.admin_role || 'admin_user' });
    } else {
      accessToken = await this.issueDealerAccessToken({ user_id: user.id, dealer_id: dealerId, role });
    }

    const newRefreshToken = await this.issueRefreshToken(user.id, deviceInfo, ipAddress);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { token_hash: tokenHash },
      data: { revoked_at: new Date() },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }
}
