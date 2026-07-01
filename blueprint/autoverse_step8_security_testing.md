# AutoVerse — Step 8: Security + Testing
### JWT RS256 · Admin Security · Automation Security · Multi-Tenant Penetration · Role Test Matrix · Load Targets · v1.0

> Complete security architecture and testing specification: JWT RS256 implementation for dealer and admin tiers, admin panel hardening, automation credential security, 25 multi-tenant penetration scenarios with expected outcomes, 50+ role-based test scenarios across all module/role combinations, and load test targets per critical endpoint.

---

## Table of Contents

1. [JWT RS256 — Dealer & Admin Separate Signing Keys](#1-jwt-rs256--dealer--admin-separate-signing-keys)
2. [Admin Panel Security Architecture](#2-admin-panel-security-architecture)
3. [Automation Security](#3-automation-security)
4. [Multi-Tenant Isolation — 25 Penetration Scenarios](#4-multi-tenant-isolation--25-penetration-scenarios)
5. [BD-Specific Security Concerns](#5-bd-specific-security-concerns)
6. [Role-Based Test Matrix — 50+ Scenarios](#6-role-based-test-matrix--50-scenarios)
7. [API Integration Test Suite](#7-api-integration-test-suite)
8. [Load Test Targets Per Critical Endpoint](#8-load-test-targets-per-critical-endpoint)
9. [Security Monitoring & Incident Response](#9-security-monitoring--incident-response)
10. [Penetration Test Checklist](#10-penetration-test-checklist)

---

## 1. JWT RS256 — Dealer & Admin Separate Signing Keys

### 1.1 Key Generation & Management

```
KEY ALGORITHM: RSA-SHA256 (RS256)
KEY SIZE: 2048-bit (NIST recommended minimum; 4096 for long-lived admin keys)

WHY ASYMMETRIC (RS256) OVER SYMMETRIC (HS256):
  HS256: any service that can verify tokens can also create them (single secret)
         Risk: if BullMQ worker or analytics service is compromised, it can issue tokens
  RS256: only the API with the private key can CREATE tokens
         Any service can VERIFY tokens using the public key
         Compromised worker cannot forge tokens — only verify them

WHY SEPARATE KEYS FOR DEALER VS ADMIN:
  If dealer signing key is compromised: admin tokens are unaffected
  Admin tokens cannot be forged using dealer key
  Principle of minimal blast radius

KEY STORAGE:
  Private keys: environment variables ONLY (never in code, never in Git)
    JWT_PRIVATE_KEY     → dealer token signing
    ADMIN_JWT_SECRET    → admin token signing (HS256 acceptable for internal-only tokens)
  Public key: environment variable (safe to distribute to worker processes)
    JWT_PUBLIC_KEY      → dealer token verification
  Admin tokens: HS256 with ADMIN_JWT_SECRET (admin panel is internal, no worker verification needed)

KEY ROTATION PROCEDURE (quarterly):
  1. Generate new key pair: openssl genrsa -out new_private.pem 2048
  2. Extract public key:    openssl rsa -in new_private.pem -pubout -out new_public.pem
  3. Deploy new keys to environment (both keys active simultaneously)
  4. Grace period: 15 minutes (old access tokens expire naturally)
  5. Remove old key from environment
  6. Force re-login: set a global token_invalidate_before timestamp in Redis
     All tokens issued before this timestamp rejected (JwtStrategy.validate())
  7. Monitor: no 401 error spike after 15 minutes → rotation complete
```

### 1.2 Key Generation Script

```bash
#!/bin/bash
# generate-jwt-keys.sh
# Run once per environment. Store output in secrets manager.

# Dealer signing key (2048-bit)
openssl genrsa -out dealer_jwt_private.pem 2048
openssl rsa -in dealer_jwt_private.pem -pubout -out dealer_jwt_public.pem

# Convert to single-line for env var (replace newlines with \n):
echo "JWT_PRIVATE_KEY=$(cat dealer_jwt_private.pem | tr '\n' '|' | sed 's/|/\\n/g')"
echo "JWT_PUBLIC_KEY=$(cat dealer_jwt_public.pem | tr '\n' '|' | sed 's/|/\\n/g')"

# Admin signing secret (HS256 — simpler for internal-only use)
echo "ADMIN_JWT_SECRET=$(openssl rand -hex 64)"

# IMPORTANT: Delete .pem files after extracting env vars
rm dealer_jwt_private.pem dealer_jwt_public.pem
echo "Keys generated. Store securely."
```

### 1.3 Token Issuance — Full Implementation

```typescript
// auth/token.service.ts
@Injectable()
export class TokenService {
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly adminSecret: string;

  constructor(
    private config: ConfigService,
    private redis: RedisService,
  ) {
    // Parse the \n-escaped keys back to actual PEM format
    this.privateKey = this.config.get('JWT_PRIVATE_KEY').replace(/\\n/g, '\n');
    this.publicKey  = this.config.get('JWT_PUBLIC_KEY').replace(/\\n/g, '\n');
    this.adminSecret = this.config.get('ADMIN_JWT_SECRET');
  }

  // Issue dealer access token (RS256)
  async issueAccessToken(payload: DealerJwtPayload): Promise<string> {
    const jti = randomUUID();
    return sign(
      {
        sub:           payload.user_id,
        phone:         payload.phone,
        dealer_id:     payload.dealer_id,
        dealer_role:   payload.dealer_role,
        dealer_status: payload.dealer_status,
        plan_tier:     payload.plan_tier,
        jti,
        iat:           Math.floor(Date.now() / 1000),
      },
      this.privateKey,
      {
        algorithm:  'RS256',
        expiresIn:  900,              // 15 minutes
        issuer:     'autoverse.com.bd',
        audience:   'autoverse-api',
      }
    );
  }

  // Issue refresh token (opaque, stored in DB)
  async issueRefreshToken(userId: string, deviceInfo: string): Promise<string> {
    const token = randomBytes(64).toString('hex');         // 128-char hex string
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.refreshToken.create({
      data: {
        user_id:    userId,
        token_hash: tokenHash,
        device_info: deviceInfo,
        expires_at:  expiresAt,
      }
    });

    // Store in Redis for fast lookup (DB is source of truth)
    await this.redis.set(
      `session:refresh:${userId}:${tokenHash}`,
      JSON.stringify({ user_id: userId, expires_at: expiresAt.toISOString() }),
      { EX: 30 * 24 * 60 * 60 }
    );

    return token; // returned raw (hashed only on storage)
  }

  // Issue admin token (HS256 — internal only)
  issueAdminToken(payload: AdminJwtPayload): string {
    const sessionId = randomUUID();
    const token = sign(
      {
        sub:        payload.admin_user_id,
        admin_role: payload.admin_role,
        session_id: sessionId,
        jti:        randomUUID(),
      },
      this.adminSecret,
      {
        algorithm: 'HS256',
        expiresIn: 1800,             // 30 minutes
      }
    );

    // Store session in Redis for idle timeout enforcement
    this.redis.set(
      `admin_session:${sessionId}`,
      payload.admin_user_id,
      { EX: 1800 }
    );

    return token;
  }

  // Verify dealer token (RS256)
  async verifyAccessToken(token: string): Promise<DealerJwtPayload> {
    try {
      const payload = verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer:     'autoverse.com.bd',
        audience:   'autoverse-api',
      }) as DealerJwtPayload;

      // Check global invalidation timestamp (key rotation event)
      const invalidateBefore = await this.redis.get('token_invalidate_before');
      if (invalidateBefore && payload.iat < parseInt(invalidateBefore)) {
        throw new UnauthorizedException('Token invalidated by key rotation');
      }

      // Check per-token revocation (logout, security event)
      const revoked = await this.redis.get(`revoked_jti:${payload.jti}`);
      if (revoked) {
        throw new UnauthorizedException('Token has been revoked');
      }

      return payload;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException({ code: 'AUTH_TOKEN_EXPIRED' });
      }
      throw new UnauthorizedException({ code: 'AUTH_TOKEN_INVALID' });
    }
  }

  // Revoke specific JTI (for immediate logout or security events)
  async revokeJti(jti: string, ttl: number = 900): Promise<void> {
    await this.redis.set(`revoked_jti:${jti}`, '1', { EX: ttl });
  }
}
```

### 1.4 JWT Strategy (Passport.js)

```typescript
// auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private redis: RedisService,
    private dealerships: DealershipsService,
  ) {
    super({
      jwtFromRequest:   ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:      config.get('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
      algorithms:       ['RS256'],
      issuer:           'autoverse.com.bd',
      audience:         'autoverse-api',
      ignoreExpiration: false,    // NEVER ignore expiration
    });
  }

  async validate(payload: DealerJwtPayload): Promise<DealerJwtPayload> {
    // 1. Check global invalidation
    const invalidateBefore = await this.redis.get('token_invalidate_before');
    if (invalidateBefore && payload.iat < parseInt(invalidateBefore)) {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    // 2. Check per-JTI revocation
    const isRevoked = await this.redis.get(`revoked_jti:${payload.jti}`);
    if (isRevoked) throw new UnauthorizedException('Session has been terminated.');

    // 3. Validate dealer still exists and is not terminated
    //    (lightweight check — uses Redis cache TTL 900s)
    const dealerStatus = await this.redis.get(`dealer_status:${payload.dealer_id}`);
    if (dealerStatus === 'terminated') {
      throw new ForbiddenException('Account has been terminated.');
    }

    return payload; // attached to request.user
  }
}

// auth/strategies/jwt-admin.strategy.ts
@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  constructor(private config: ConfigService, private redis: RedisService) {
    super({
      jwtFromRequest:   ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:      config.get('ADMIN_JWT_SECRET'),
      algorithms:       ['HS256'],
      ignoreExpiration: false,
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AdminJwtPayload> {
    // Check session in Redis (idle timeout: 30 minutes)
    const sessionExists = await this.redis.get(`admin_session:${payload.session_id}`);
    if (!sessionExists) {
      throw new UnauthorizedException('Admin session expired. Please log in again.');
    }

    // Refresh idle timeout on each request
    await this.redis.expire(`admin_session:${payload.session_id}`, 1800);

    // Verify admin user still active
    const admin = await this.prisma.adminUser.findFirst({
      where: { user_id: payload.sub, is_active: true }
    });
    if (!admin) throw new ForbiddenException('Admin account deactivated.');

    return payload;
  }
}
```

### 1.5 Refresh Token Rotation

```typescript
// POST /auth/refresh
async refreshTokens(
  refreshToken: string,
  deviceInfo: string,
): Promise<{ access_token: string; refresh_token: string }> {
  const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

  // Find refresh token in DB
  const storedToken = await this.prisma.refreshToken.findFirst({
    where: {
      token_hash:  tokenHash,
      revoked_at:  null,
      expires_at:  { gt: new Date() },
    },
    include: { user: { include: { dealer_staff: true } } }
  });

  if (!storedToken) {
    // SECURITY: Token not found OR already used (rotation attack)
    // If attacker used a stolen refresh token before victim:
    // Their use revoked it. Victim's next use hits this branch.
    // Response: revoke ALL sessions for this user (assume compromise).
    if (await this.detectRotationAttack(tokenHash)) {
      await this.revokeAllUserSessions(storedToken?.user_id);
      await this.notifyUserSuspiciousActivity(storedToken?.user_id);
    }
    throw new UnauthorizedException('Refresh token invalid or expired.');
  }

  // Revoke used refresh token (rotation: issue new one)
  await this.prisma.refreshToken.update({
    where: { id: storedToken.id },
    data:  { revoked_at: new Date() }
  });
  await this.redis.del(`session:refresh:${storedToken.user_id}:${tokenHash}`);

  // Issue new tokens
  const user = storedToken.user;
  const dealerContext = await this.buildDealerContext(user);

  const newAccessToken  = await this.tokenService.issueAccessToken(dealerContext);
  const newRefreshToken = await this.tokenService.issueRefreshToken(user.id, deviceInfo);

  return { access_token: newAccessToken, refresh_token: newRefreshToken };
}

// Rotation attack detection:
// If a token that was ALREADY revoked is being used → flag as potential theft
private async detectRotationAttack(tokenHash: string): Promise<boolean> {
  const revokedToken = await this.prisma.refreshToken.findFirst({
    where: { token_hash: tokenHash, revoked_at: { not: null } }
  });
  return revokedToken !== null;
}
```

---

## 2. Admin Panel Security Architecture

### 2.1 IP Allowlist Enforcement

```typescript
// middleware/ip-allowlist.middleware.ts
@Injectable()
export class IpAllowlistMiddleware implements NestMiddleware {
  private allowedIps: Set<string>;
  private allowedCidrs: string[];

  constructor(private config: ConfigService) {
    const rawList = this.config.get('ADMIN_IP_ALLOWLIST', '');
    const entries = rawList.split(',').map(s => s.trim()).filter(Boolean);

    this.allowedIps   = new Set(entries.filter(e => !e.includes('/')));
    this.allowedCidrs = entries.filter(e => e.includes('/'));
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Extract real IP (Cloudflare passes CF-Connecting-IP)
    const ip =
      req.headers['cf-connecting-ip'] as string ||
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket.remoteAddress;

    const normalizedIp = ip?.replace('::ffff:', ''); // normalize IPv4-mapped IPv6

    if (this.isAllowed(normalizedIp)) {
      return next();
    }

    // Log blocked attempt
    logger.warn('Admin panel access blocked', {
      ip: normalizedIp,
      path: req.path,
      user_agent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });

    // Generic 404 (not 403) — don't confirm that admin panel exists
    return res.status(404).json({ message: 'Not found' });
  }

  private isAllowed(ip: string | undefined): boolean {
    if (!ip) return false;
    if (this.allowedIps.has(ip)) return true;

    // CIDR range check
    return this.allowedCidrs.some(cidr => this.ipInCidr(ip, cidr));
  }

  private ipInCidr(ip: string, cidr: string): boolean {
    // Simple CIDR check implementation
    const [range, bits] = cidr.split('/');
    const mask = ~((1 << (32 - parseInt(bits))) - 1);
    const ipInt   = ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0);
    const rangeInt = range.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0);
    return (ipInt & mask) === (rangeInt & mask);
  }
}

// Applied ONLY to admin routes:
// admin.module.ts
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IpAllowlistMiddleware)
      .forRoutes({ path: 'admin/*', method: RequestMethod.ALL });
  }
}
```

### 2.2 2FA Enforcement (TOTP)

```typescript
// Admin 2FA: TOTP (Time-based One-Time Password) via Authenticator apps
// Library: otplib (speakeasy alternative, actively maintained)

// 2FA Setup Flow (first login after account creation):
async setup2FA(adminUserId: string): Promise<TwoFASetupResult> {
  const secret = authenticator.generateSecret();     // 32-char base32

  // Store encrypted secret (not yet verified)
  await this.prisma.adminUser.update({
    where: { id: adminUserId },
    data: { two_fa_secret: await this.encrypt(secret) }
  });

  // Generate QR code for authenticator app
  const otpAuthUrl = authenticator.keyuri(
    'admin@autoverse.com.bd',
    'AutoVerse Admin',
    secret
  );

  return {
    secret,
    qr_code_url: otpAuthUrl,  // client renders as QR
    backup_codes: this.generateBackupCodes(), // 8 one-time backup codes
  };
}

// 2FA Verification on Login:
async adminLogin(email: string, password: string, totpCode: string): Promise<AdminTokens> {
  const adminUser = await this.verifyAdminCredentials(email, password);
  if (!adminUser) throw new UnauthorizedException('Invalid credentials');

  if (adminUser.two_fa_enabled) {
    const secret = await this.decrypt(adminUser.two_fa_secret);
    const isValid = authenticator.verify({ token: totpCode, secret });

    if (!isValid) {
      // Check backup codes
      const backupValid = await this.verifyBackupCode(adminUser.id, totpCode);
      if (!backupValid) {
        await this.recordFailedAttempt(adminUser.id);
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }
  }

  // Issue admin token
  const token = this.tokenService.issueAdminToken({
    admin_user_id: adminUser.id,
    admin_role: adminUser.admin_role,
  });

  // Log successful admin login
  await this.prisma.platformAuditLog.create({
    data: {
      actor_id:   adminUser.id,
      actor_role: adminUser.admin_role,
      action:     'admin.login',
      target_type: 'admin_user',
      target_id:  adminUser.id,
      ip_address: this.requestIp,
    }
  });

  return { access_token: token };
}

// Failed login lockout (admin):
// 5 failed attempts → lock account for 30 minutes
// Notify Super Admin of repeated failures (possible brute force)
private async recordFailedAttempt(adminUserId: string): Promise<void> {
  const key = `admin_login_failures:${adminUserId}`;
  const count = await this.redis.incr(key);
  await this.redis.expire(key, 1800); // 30 minute window

  if (count >= 5) {
    await this.prisma.adminUser.update({
      where: { id: adminUserId },
      data: { is_active: false }
    });
    await this.notifySuperAdmin(`Admin account locked after 5 failed 2FA attempts: ${adminUserId}`);
  }
}
```

### 2.3 Impersonation Security

```typescript
// Super Admin only: impersonate dealer to view their DMS as they see it

// Step 1: Request impersonation
@Post('admin/dealers/:dealerId/impersonate')
@UseGuards(JwtAdminGuard, AdminRoleGuard)
@RequiredAdminRole('super_admin')                // ONLY super admin
async impersonate(
  @Param('dealerId', ParseUuidPipe) dealerId: string,
  @AdminUser() adminUser: AdminJwtPayload,
  @Request() req: any,
): Promise<{ impersonation_token: string }> {

  // Verify dealer exists
  const dealer = await this.dealershipsService.findOne(dealerId);
  if (!dealer) throw new NotFoundException('Dealer not found');

  // Log impersonation initiation (cannot be suppressed)
  await this.prisma.platformAuditLog.create({
    data: {
      actor_id:    adminUser.sub,
      actor_role:  adminUser.admin_role,
      action:      'dealer.impersonation_started',
      target_type: 'dealership',
      target_id:   dealerId,
      ip_address:  req.ip,
      after_state: { dealership_name: dealer.business_name },
    }
  });

  // Issue short-lived impersonation token
  const impersonationToken = sign(
    {
      sub:              dealer.owner_id,
      dealer_id:        dealerId,
      dealer_role:      'dealer_owner',
      dealer_status:    dealer.status,
      plan_tier:        dealer.subscription_tier,
      is_impersonation: true,           // FLAG: marks all actions as admin-performed
      impersonated_by:  adminUser.sub,
      jti:              randomUUID(),
    },
    this.privateKey,
    { algorithm: 'RS256', expiresIn: 3600 } // 1 hour max impersonation
  );

  return { impersonation_token: impersonationToken };
}

// Step 2: All actions by impersonated user watermarked
// In AuditInterceptor:
if (request.user.is_impersonation) {
  await prisma.entityChangeLog.create({
    data: {
      ...changeData,
      // Override actor to show it was admin, not dealer
      actor_id:   request.user.impersonated_by,
      actor_role: 'super_admin_impersonating',
      metadata: {
        impersonated_dealer_id: request.user.dealer_id,
        actual_dealer_action:   changeData.action,
      }
    }
  });
}

// Step 3: End impersonation
@Post('admin/dealers/:dealerId/impersonate/end')
async endImpersonation(...) {
  await this.tokenService.revokeJti(req.user.jti);

  await this.prisma.platformAuditLog.create({
    data: {
      actor_id:   req.user.impersonated_by,
      action:     'dealer.impersonation_ended',
      target_id:  req.user.dealer_id,
    }
  });
}
```

### 2.4 Session Security

```typescript
// Admin session additional protections:

// 1. Bind session to IP address (if IP changes, force re-auth)
// Stored in admin_session Redis key:
{
  admin_user_id: string,
  ip_address:    string,  // IP at login time
  created_at:    string,
}

// On each request: if req.ip !== session.ip_address:
//   Log suspicious IP change
//   If change is dramatic (different country): force re-auth
//   If minor (same ISP range): allow with warning log

// 2. Concurrent session limit: max 2 admin sessions per user
// On 3rd login: revoke oldest session

// 3. Sensitive action re-authentication:
// For: dealer termination, IMV override approval, refunds > BDT 10,000
// Require: fresh TOTP code even if session active
@Post('admin/dealers/:id/terminate')
async terminateDealer(
  @Body('totp_code') totpCode: string,
  ...
) {
  // Verify fresh TOTP code (not cached — prevent replay)
  const freshVerification = await this.verify2FAFresh(adminUser.sub, totpCode);
  if (!freshVerification) throw new ForbiddenException('Fresh 2FA verification required.');
  // Proceed with termination...
}

// "Fresh" means: this exact TOTP code not used in last 90 seconds
// Store used codes: Redis SET add(totp_used:{admin_id}, code) TTL 90s
```

---

## 3. Automation Security

### 3.1 API Credential Storage

```typescript
// All third-party API credentials stored in dealer_integration table
// Fields: access_token, refresh_token — encrypted at rest

// Encryption service (AES-256-GCM)
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyBuffer: Buffer;

  constructor(private config: ConfigService) {
    // ENCRYPTION_KEY must be exactly 32 bytes (256 bits), hex-encoded in env
    this.keyBuffer = Buffer.from(this.config.get('ENCRYPTION_KEY'), 'hex');
    if (this.keyBuffer.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
    }
  }

  encrypt(plaintext: string): string {
    const iv  = randomBytes(16);          // 128-bit IV (unique per encryption)
    const cipher = createCipheriv(this.algorithm, this.keyBuffer, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);
    const authTag = cipher.getAuthTag(); // GCM authentication tag (16 bytes)

    // Format: iv:authTag:ciphertext (all base64)
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  decrypt(ciphertext: string): string {
    const [ivB64, authTagB64, dataB64] = ciphertext.split(':');
    const iv      = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const data    = Buffer.from(dataB64, 'base64');

    const decipher = createDecipheriv(this.algorithm, this.keyBuffer, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(data),
      decipher.final()
    ]).toString('utf8');
  }
}

// Usage in DealerIntegrationService:
async storeCredentials(dealerId: string, provider: string, tokens: TokenData) {
  await this.prisma.dealerIntegration.upsert({
    where: { dealership_id_provider: { dealership_id: dealerId, provider } },
    create: {
      dealership_id: dealerId,
      provider,
      access_token:  this.encryption.encrypt(tokens.access_token),
      refresh_token: tokens.refresh_token
        ? this.encryption.encrypt(tokens.refresh_token)
        : null,
      token_expires_at: tokens.expires_at,
    },
    update: { /* same fields */ }
  });
}

// CRITICAL: credentials are NEVER returned in API responses
// GET /integrations → returns { provider, status, connected_at } but NOT tokens
// Token is decrypted only within the service, never serialized to JSON response
```

### 3.2 Webhook Signature Verification

```typescript
// All incoming webhooks verified before processing.
// Never process a webhook without signature verification.

// WhatsApp/Facebook webhook verification
verifyMetaSignature(
  rawBody: Buffer,
  signatureHeader: string,
  appSecret: string,
): boolean {
  const expected = 'sha256=' + createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  // Constant-time comparison (prevents timing attacks)
  return timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(expected)
  );
}

// SSLCommerz IPN hash verification
verifySslCommerzHash(ipnData: Record<string, string>, storePassword: string): boolean {
  const { verify_sign, verify_key } = ipnData;

  const keys = verify_key.split(',');
  const sortedValues = keys.map(k => ipnData[k]).join('');
  const hash = MD5(storePassword + sortedValues);

  return hash === verify_sign;
}

// Greenweb SMS delivery callback (if configured)
// Greenweb uses IP allowlist verification (no HMAC)
// Allowed IPs: provided by Greenweb in documentation
verifyGreenwwebIp(ip: string): boolean {
  const allowedIps = ['103.230.104.61', '103.230.104.62']; // Greenweb server IPs
  return allowedIps.includes(ip);
}

// Generic webhook endpoint with signature verification:
@Post('automation/whatsapp/webhook')
async handleWhatsAppWebhook(
  @RawBody() rawBody: Buffer,
  @Headers('x-hub-signature-256') signature: string,
  @Request() req: any,
) {
  if (!this.verifyMetaSignature(rawBody, signature, this.config.get('META_APP_SECRET'))) {
    logger.warn('WhatsApp webhook signature verification failed', { ip: req.ip });
    throw new UnauthorizedException('Webhook signature invalid');
  }
  // Process payload...
}
```

### 3.3 Automation Abuse Prevention

```typescript
// Rate limit enforcement — multi-layer

// Layer 1: Per-dealer per-channel daily limit (Redis)
async enforceChannelRateLimit(dealerId: string, channel: string): Promise<void> {
  const date = new Date().toISOString().split('T')[0];
  const key  = `rate:automation:${channel}:${dealerId}:${date}`;
  const limit = await this.getPlanLimit(dealerId, channel);

  const current = await this.redis.incr(key);
  await this.redis.expireat(key, this.getEndOfDayUnix());

  if (current > limit) {
    // Don't execute — log and alert
    await this.logSkipped(dealerId, channel, 'daily_limit_exceeded');
    if (current === Math.floor(limit * 0.8) + 1) {
      await this.notifyDealerApproachingLimit(dealerId, channel, current, limit);
    }
    throw new TooManyRequestsException(`Daily ${channel} limit exceeded`);
  }
}

// Layer 2: Per-contact per-day anti-spam (max 3 msgs any channel combined)
async enforceContactLimit(dealerId: string, contactPhone: string): Promise<void> {
  const date  = new Date().toISOString().split('T')[0];
  const key   = `rate:contact:${dealerId}:${contactPhone}:${date}`;
  const count = parseInt(await this.redis.get(key) || '0', 10);

  if (count >= 3) {
    throw new TooManyRequestsException('Contact daily message limit reached');
  }
  await this.redis.incr(key);
  await this.redis.expireat(key, this.getEndOfDayUnix());
}

// Layer 3: Loop detection (max 3 depth in automation chain)
detectAutomationLoop(
  currentEvent: string,
  ruleActions: RuleAction[],
  chainDepth: number,
): void {
  if (chainDepth >= 3) {
    throw new BadRequestException('Automation chain depth limit reached (max 3)');
  }

  const emittedEvents = this.getEventsFromActions(ruleActions);
  if (emittedEvents.includes(currentEvent)) {
    throw new BadRequestException(`Circular automation detected: ${currentEvent}`);
  }
}

// Layer 4: Opt-out enforcement (cannot be bypassed)
async checkOptOut(contactPhone: string, channel: string, dealerId: string): Promise<boolean> {
  const customer = await this.prisma.customer.findFirst({
    where: { phone: contactPhone, dealership_id: dealerId }
  });
  if (!customer) return false; // no record = no opt-out (new contact)

  switch (channel) {
    case 'whatsapp': return !customer.opted_in_whatsapp;
    case 'sms':      return !customer.opted_in_sms;
    case 'email':    return !customer.opted_in_email;
    default:         return false;
  }
}
// opt-out = true → skip message, log as opted_out
// CANNOT be overridden by any dealer action
// CANNOT be bypassed by automation rules
```

---

## 4. Multi-Tenant Isolation — 25 Penetration Scenarios

```
FORMAT: SCENARIO | ATTACK VECTOR | DEFENSE MECHANISM | EXPECTED OUTCOME

All tests assume: attacker has valid account on the platform (Dealer A)
                  target is: Dealer B's data

──────────────────────────────────────────────────────────────────────────────
SCENARIO 1: Direct UUID substitution (vehicle)
  Attack:  Attacker changes vehicle UUID in URL to another dealer's vehicle UUID
           GET /api/v1/vehicles/{dealer_b_vehicle_id}
  Defense: RLS policy (dealership_id = current_setting('app.current_dealer_id'))
  Result:  0 rows returned → 404 "Vehicle not found"
  Pass Criteria: No data from Dealer B exposed ✅

SCENARIO 2: JWT dealer_id manipulation
  Attack:  Attacker modifies JWT payload to change dealer_id claim
           (alters base64 encoded payload, keeps original signature)
  Defense: RS256 asymmetric signature verification — signature becomes invalid
           Any payload change = signature mismatch = 401
  Result:  401 "Token signature invalid"
  Pass Criteria: JWT rejected before any DB access ✅

SCENARIO 3: dealer_id injection in request body
  Attack:  POST /api/v1/vehicles with body { ..., dealership_id: "{dealer_b_id}" }
  Defense: DTO validation strips unknown fields (class-transformer whitelist)
           NestJS strips dealership_id from body entirely
           DealerContextGuard injects dealership_id from JWT (not from body)
           RLS WITH CHECK blocks insert with wrong dealership_id anyway
  Result:  Vehicle created for ATTACKER's dealer (JWT dealer_id), not Dealer B
  Pass Criteria: Cross-tenant write impossible ✅

SCENARIO 4: Lead UUID substitution
  Attack:  PUT /api/v1/leads/{dealer_b_lead_id}/stage
  Defense: RLS on lead table (dealership_id = current_dealer)
  Result:  0 rows updated → 404 "Lead not found"
  Pass Criteria: Cannot modify another dealer's leads ✅

SCENARIO 5: Deal record cross-access
  Attack:  GET /api/v1/deals/{dealer_b_deal_id}
  Defense: RLS on deal table
  Result:  404
  Pass Criteria: Deal data not accessible ✅

SCENARIO 6: Customer phone number lookup across tenants
  Attack:  GET /api/v1/customers?phone=01711234567
           Trying to find if a specific buyer is in ANOTHER dealer's CRM
  Defense: RLS on customer table (per dealer)
  Result:  Only attacker's own customers with that phone returned
           (Each dealer has their own customer record per phone number)
  Pass Criteria: Cannot enumerate customers across tenants ✅

SCENARIO 7: File upload path traversal
  Attack:  Upload file with filename: "../../../../etc/passwd"
  Defense: Sharp processing strips filename (UUID assigned to R2 object)
           Multer filename sanitization: all uploads get UUID filename
           R2 key format: vehicles/{dealerId}/{vehicleId}/{uuid}.webp
  Result:  File uploaded with sanitized UUID name, no path traversal possible
  Pass Criteria: Filesystem traversal impossible ✅

SCENARIO 8: Sync engine targeting another dealer's vehicle
  Attack:  POST /api/v1/vehicles/{dealer_b_vehicle_id}/force-sync
  Defense: RLS prevents reading Dealer B's vehicle
           SyncService double-checks dealership_id before update
  Result:  404 (vehicle not found in attacker's tenant context)
  Pass Criteria: Cannot trigger sync for another dealer's vehicle ✅

SCENARIO 9: Marketplace listing → dealer data reverse lookup
  Attack:  GET /api/v1/marketplace/listings/{listing_id}
           Trying to access private vehicle data through marketplace endpoint
  Defense: MarketplaceModule reads from marketplace_listing table (public)
           NOT from vehicle table (tenant-isolated)
           marketplace_listing contains NO private fields (no cost, no staff notes)
  Result:  Public listing data only (asking_price, specs, photos)
           acquisition_cost, recon_total, staff notes = NOT in response (not in table)
  Pass Criteria: No private data accessible via marketplace ✅

SCENARIO 10: IDOR on expense records
  Attack:  GET /api/v1/vehicles/{dealer_b_vehicle_id}/expenses
  Defense: RLS on vehicle_expense (dealership_id filter)
           Parent vehicle 404 prevents expense access
  Result:  404
  Pass Criteria: Cannot access another dealer's expense records ✅

SCENARIO 11: Automation rule cross-execution
  Attack:  POST /api/v1/automation/test/{dealer_b_rule_id}
  Defense: RLS on automation_rule (dealership_id)
           Rule not found in attacker's tenant context
  Result:  404
  Pass Criteria: Cannot trigger another dealer's automation rules ✅

SCENARIO 12: SMS campaign targeting another dealer's customers
  Attack:  POST /api/v1/automation/sms/campaign
           with body: { segment: 'all', dealer_id_override: '{dealer_b_id}' }
  Defense: DealerContextGuard sets dealer_id from JWT (ignores body)
           SMS campaign service queries customers WHERE dealership_id = JWT_dealer_id
           dealer_id_override stripped by DTO whitelist
  Result:  Campaign only targets attacker's own customers
  Pass Criteria: Cannot spam another dealer's customer list ✅

SCENARIO 13: Mass enumeration via marketplace search
  Attack:  GET /api/v1/marketplace/search?dealer_id={dealer_b_id}
           Enumerate all of Dealer B's inventory via public marketplace
  Defense: marketplace_listing is public — this is intentional
           BUT: private fields not included (no acquisition_cost, no staff notes)
           Only public listing data visible
  Result:  Public listing data for active vehicles — same as what any buyer sees
  Pass Criteria: No more data than intentionally public ✅

SCENARIO 14: Forced browser error reveals stack trace
  Attack:  Send malformed request to trigger 500 error
           Check error response for stack traces with DB schema info
  Defense: GlobalExceptionFilter catches all errors
           Production: only { code, message } returned (no stack trace)
           Development: full stack trace (never in production)
           NODE_ENV check: if (env !== 'development') strip stack
  Result:  { "success": false, "error": { "code": "INTERNAL_ERROR", "message": "..." } }
  Pass Criteria: No stack traces or schema info in production responses ✅

SCENARIO 15: Timing attack on auth (user enumeration)
  Attack:  POST /auth/login with known vs unknown phone numbers
           Measure response time to determine if phone exists in system
  Defense: Constant-time response regardless of whether user exists
           bcrypt.compare() always runs even for non-existent user
           (Compare against a fixed dummy hash if user not found)
  Result:  Response time identical for valid/invalid phones
  Pass Criteria: Cannot enumerate valid users via timing ✅

SCENARIO 16: Account takeover via OTP brute force
  Attack:  Try all 1,000,000 possible 6-digit OTPs
  Defense: OTP TTL: 5 minutes (limits time window)
           Rate limit: 3 OTP requests per phone per 10 minutes
           OTP attempt limit: 5 attempts per OTP → OTP invalidated
           Account lockout: after 10 failed logins → locked 30 minutes
  Result:  At 5 attempts/OTP × 3 OTPs/10 min = 15 attempts per 10 minutes
           At this rate: would take 110+ years to brute force
  Pass Criteria: Brute force mathematically infeasible ✅

SCENARIO 17: Admin panel access without IP allowlist
  Attack:  Access admin.autoverse.com.bd from non-allowlisted IP
  Defense: IpAllowlistMiddleware rejects request before JWT processing
           Returns 404 (not 403) — doesn't confirm admin panel exists
  Result:  HTTP 404 from untrusted IP
  Pass Criteria: Admin panel unreachable from public internet ✅

SCENARIO 18: Replay attack on payment IPN
  Attack:  Capture a valid SSLCommerz IPN POST, replay it
           Attempting to trigger duplicate subscription activation
  Defense: Idempotency key check: payment_transaction WHERE idempotency_key already success
           Redis lock: payment_processing:{key} SETNX prevents concurrent processing
           IPN signature verified (hash check fails if payload altered)
  Result:  Duplicate IPN detected → 200 OK returned (to prevent SSLCommerz retry)
           Subscription not double-activated (idempotency check)
  Pass Criteria: No double-activation on replay ✅

SCENARIO 19: SQL injection via search filters
  Attack:  GET /marketplace/search?make=Toyota'; DROP TABLE vehicle; --
  Defense: Prisma ORM parameterizes all queries
           MeiliSearch: search term is a string parameter, not injected into SQL
           Input validation: make field validated against vehicle_reference table
  Result:  Search returns 0 results; no SQL executed
  Pass Criteria: SQL injection impossible via Prisma parameterization ✅

SCENARIO 20: NoSQL injection via MeiliSearch
  Attack:  Search term: {"$where": "this.price > 0"}
  Defense: MeiliSearch uses its own query language (not JSON operators)
           Search term treated as string, not parsed as query object
           URL parameter sanitization strips JSON-like strings
  Result:  Literal string search (no results)
  Pass Criteria: No NoSQL injection ✅

SCENARIO 21: Privilege escalation via role manipulation
  Attack:  Salesperson adds role: 'manager' to their profile update request
  Defense: role field not in UpdateUserDto (DTO whitelist)
           Role changes only possible via DealerAdminService (owner only)
           RLS + role check on any role-modifying endpoint
  Result:  Role field ignored; user remains salesperson
  Pass Criteria: Self-promotion impossible ✅

SCENARIO 22: C2C listing fraud (fake dealer listings)
  Attack:  C2C seller creates listing claiming to be a "verified dealer"
           Hoping IMV rating trust transfers
  Defense: listing_type = 'c2c' stored and displayed (cannot be changed to 'dealer')
           "Verified Dealer" badge only shown on dealership profiles (dealer_id linked)
           C2C listings show: "Private Seller" badge prominently
  Result:  C2C listing shows "Private Seller" — cannot impersonate dealer
  Pass Criteria: Seller type cannot be faked ✅

SCENARIO 23: SSRF via webhook URL configuration
  Attack:  Set automation webhook URL to: http://169.254.169.254/
           (AWS metadata endpoint — attempts SSRF)
  Defense: Webhook URL validation:
           - Must be HTTPS (not HTTP)
           - Hostname must not be: private IP ranges (10.x, 172.16.x, 192.168.x, 169.254.x)
           - Hostname must resolve to public IP
           - Validated on save, not just on use
  Result:  Webhook URL rejected at configuration time
  Pass Criteria: SSRF via webhook impossible ✅

SCENARIO 24: Mass assignment via bulk import
  Attack:  CSV import with columns: dealership_id, acquisition_cost, etc.
           Attempting to overwrite another dealer's vehicles
  Defense: CSV import processor reads only allowed columns (whitelist)
           dealership_id ignored from CSV — always taken from JWT context
           RLS enforced on all created records
  Result:  All imported vehicles assigned to attacker's own dealer account
  Pass Criteria: Bulk import cannot affect other tenants ✅

SCENARIO 25: Session fixation
  Attack:  Attacker obtains victim's session token before login
           Victim logs in → attacker uses same token
  Defense: On successful login: always issue NEW tokens (never reuse existing)
           Refresh token rotation: each use generates a new token (old one revoked)
           httpOnly cookie for refresh token: JS cannot access it
  Result:  Login always generates fresh tokens; pre-login tokens worthless post-login
  Pass Criteria: Session fixation impossible ✅
```

---

## 5. BD-Specific Security Concerns

### 5.1 bKash Double-Charge Prevention — Full Test Suite

```
TEST 1: Successful payment, callback arrives correctly
  Setup:    bKash confirms payment, callback URL called with status=success
  Action:   Execute payment → SUCCESS
  Assert:   subscription activated exactly once
            payment_transaction.status = 'success'
            Invoice.status = 'paid'
  Pass: ✅

TEST 2: Timeout — callback never arrives
  Setup:    bKash processes payment but our callback URL times out
  Action:   No callback → query API after timeout → status = Completed
  Assert:   subscription activated via query result
            No duplicate activation on subsequent retry
  Pass: ✅

TEST 3: Callback arrives with status=failure, payment actually succeeded
  Setup:    bKash sends failure callback (network issue)
            but actual payment was processed
  Action:   Query API → status = Completed
  Assert:   subscription activated (not failed)
            Failure callback ignored (overridden by query result)
  Pass: ✅

TEST 4: Dealer retries payment, first attempt actually succeeded
  Setup:    First payment succeeded (bKash processed it)
            Our system missed the confirmation
            Dealer retries within 5-minute window
  Action:   Retry uses SAME idempotency_key (same 5-minute bucket)
            payment_transaction with this key already exists (status=success)
  Assert:   Second payment NOT initiated with bKash
            Existing success transaction returned
            No double-charge ✅

TEST 5: Dealer retries payment, first attempt actually succeeded (>5 min later)
  Setup:    Same as TEST 4 but retry is 10 minutes later
            Different idempotency_key (different 5-minute bucket)
  Action:   New payment initiation attempted
            BUT: before calling bKash, check invoice.status = already paid
  Assert:   Payment not reinitiated (invoice already paid check)
            Return success to dealer
            No double-charge ✅

TEST 6: Concurrent IPN + redirect callback
  Setup:    bKash sends IPN AND redirect fires simultaneously
            Two concurrent requests to process same payment
  Action:   Redis SETNX lock: payment_processing:{key}
            First request: acquires lock, processes payment
            Second request: lock not acquired, returns 200 without processing
  Assert:   Subscription activated exactly once
            Both requests return 200 (SSLCommerz/bKash doesn't retry)
  Pass: ✅
```

### 5.2 Automation Abuse Prevention Tests

```
TEST 1: Dealer tries to send unlimited WhatsApp messages
  Setup:    Dealer has 1,000 WhatsApp messages/day limit (Starter plan)
  Action:   Send 1,001st message via automation
  Assert:   1,001st message → rate limit exceeded error
            Job queued for next day (not dropped)
            Dealer notified at 800th message (80% alert)
  Pass: ✅

TEST 2: Automation loop detection
  Setup:    Rule A: trigger on lead.created → send WhatsApp → emits automation.sent
            Rule B: trigger on automation.sent → send WhatsApp → emits automation.sent
  Action:   Lead created → Rule A fires → checks Rule B
  Assert:   Loop detected at depth 1 (Rule B would create loop)
            Rule B NOT executed
            Warning logged in automation_log
  Pass: ✅

TEST 3: Contact opted out, automation still tries to send
  Setup:    Customer.opted_in_sms = false
  Action:   Abandoned lead recovery SMS triggered
  Assert:   SMS NOT sent
            automation_log.status = 'opted_out'
            No Greenweb API call made
  Pass: ✅

TEST 4: Third-party adapter webhook injection
  Setup:    Attacker crafts webhook payload pretending to be ManyChat
  Action:   POST /automation/whatsapp/inbound-webhook/{dealer_id}
  Assert:   HMAC signature verified before processing
            Invalid signature → 401 rejected
            No lead created in CRM
  Pass: ✅

TEST 5: Contact spam via automation (>3 messages/day)
  Setup:    Multiple automation rules target same contact
            WhatsApp: 1 message + Facebook: 1 message + SMS: 1 message
  Action:   4th message to same contact same day
  Assert:   4th message blocked (contact daily limit = 3)
            Job logged as 'skipped' (contact_daily_limit)
  Pass: ✅
```

---

## 6. Role-Based Test Matrix — 50+ Scenarios

### 6.1 Inventory Module Tests

```
FORMAT: TEST | ROLE | ACTION | EXPECTED RESULT

#1  Owner    | Create vehicle                     | ✅ 201 Created
#2  Manager  | Create vehicle                     | ✅ 201 Created
#3  Salesperson | Create vehicle                  | ✅ 201 Created (can add inventory)
#4  Owner    | GET vehicle (all fields)            | ✅ All fields including acquisition_cost
#5  Manager  | GET vehicle (financial fields)      | acquisition_cost = null, recon_total visible
#6  Salesperson | GET vehicle (financial fields)   | acquisition_cost = null, recon_total = null
#7  Owner    | Update asking_price                 | ✅ 200 Updated
#8  Manager  | Update asking_price                 | ✅ 200 Updated
#9  Salesperson | Update asking_price              | ❌ 403 Forbidden
#10 Owner    | Change vehicle status               | ✅ 200 OK
#11 Manager  | Change vehicle status               | ✅ 200 OK
#12 Salesperson | Change vehicle status            | ❌ 403 Forbidden
#13 Owner    | Delete (soft) vehicle               | ✅ 200 OK
#14 Manager  | Delete vehicle                      | ✅ 200 OK
#15 Salesperson | Delete vehicle                   | ❌ 403 Forbidden
#16 Any role | Upload photos to own dealer vehicle | ✅ 200 OK
#17 Any role | Toggle marketplace publish          | Manager+ ✅; Salesperson ❌
#18 Owner    | View profit calculator              | ✅ Visible
#19 Manager  | View profit calculator              | ❌ Null (not rendered)
#20 Salesperson | View profit calculator           | ❌ Null (not rendered)
```

### 6.2 CRM Module Tests

```
#21 Owner    | View all leads (any salesperson)    | ✅ All leads returned
#22 Manager  | View all leads                      | ✅ All leads returned
#23 Salesperson | View all leads (default)         | Own leads only (sees_all_leads=false)
#24 Salesperson | View all leads (sees_all=true)   | ✅ All leads (if configured by owner)
#25 Owner    | Reassign lead to different user     | ✅ 200 OK
#26 Manager  | Reassign lead                       | ✅ 200 OK
#27 Salesperson | Reassign lead                    | ❌ 403 Forbidden
#28 Salesperson | Update stage on own lead         | ✅ 200 OK
#29 Salesperson | Update stage on other's lead     | ❌ 403 (when sees_all=false)
#30 Any role | Mark lead as lost without reason    | ❌ 422 lost_reason required
#31 Any role | Mark lead as lost WITH reason       | ✅ 200 OK
#32 Owner    | View customer list                  | ✅ All customers
#33 Salesperson | View customer list               | Own interactions only
#34 Any role | Log interaction on own lead         | ✅ 201 OK
#35 Salesperson | View lead_score field            | ✅ Visible (helps them prioritize)
#36 Salesperson | View budget_min/budget_max       | ✅ Visible (needed for their work)
```

### 6.3 Sales & Deals Module Tests

```
#37 Salesperson | Create deal on own lead         | ✅ 201 Created (draft status)
#38 Salesperson | Create deal on other's lead     | Manager+ only ✅; Salesperson ❌
#39 Owner    | Approve deal                        | ✅ 200 OK
#40 Manager  | Approve deal (within threshold)     | ✅ 200 OK
#41 Manager  | Approve deal (above threshold)      | ❌ 403 Requires owner approval
#42 Salesperson | Approve deal                     | ❌ 403 Forbidden
#43 Owner    | View gross_profit on deal           | ✅ Visible
#44 Manager  | View gross_profit on deal           | ❌ null
#45 Salesperson | View gross_profit               | ❌ null
#46 Manager  | Cancel an approved deal             | ✅ 200 (with reason)
#47 Salesperson | Cancel a deal                   | ❌ 403 Forbidden
#48 Owner    | View all deals                      | ✅ All
#49 Salesperson | View all deals                  | Own deals only
#50 Any role | Record payment on approved deal     | Manager+ ✅; Salesperson ❌
```

### 6.4 Analytics & Expenses Module Tests

```
#51 Owner    | View revenue analytics              | ✅ Full (including GP, margins)
#52 Manager  | View revenue analytics              | ❌ Revenue figures hidden
#53 Salesperson | View revenue analytics           | Own performance only
#54 Owner    | View Type 2 expenses (full)         | ✅ All items + receipts
#55 Manager  | View Type 2 expenses                | Totals only (no line items)
#56 Salesperson | View Type 2 expenses             | ❌ Hidden entirely
#57 Owner    | Add Type 1 vehicle expense          | ✅ 201 OK
#58 Manager  | Add Type 1 vehicle expense          | ✅ 201 OK
#59 Salesperson | Add Type 1 vehicle expense       | ❌ 403 Forbidden
#60 Owner    | Add Type 2 operational expense      | ✅ 201 OK
#61 Manager  | Add Type 2 operational expense      | ❌ 403 Forbidden
#62 Owner    | View staff performance table        | ✅ All staff data
#63 Salesperson | View staff performance table     | Own row only
```

### 6.5 Settings & Admin Tests

```
#64 Owner    | Add team member                     | ✅ 201 OK
#65 Manager  | Add team member                     | ❌ 403 Forbidden
#66 Salesperson | Add team member                  | ❌ 403 Forbidden
#67 Owner    | Change subscription plan            | ✅ 200 OK
#68 Manager  | Change subscription plan            | ❌ 403 Forbidden
#69 Owner    | View billing history                | ✅ All invoices
#70 Manager  | View billing history                | ❌ 403 Forbidden
#71 Owner    | View/edit Automation Hub rules      | ✅ Full access
#72 Manager  | View/edit Automation Hub rules      | ✅ Full access
#73 Salesperson | View Automation Hub              | Read-only (no edit)
#74 Salesperson | Edit WhatsApp template           | ❌ 403 Forbidden
```

### 6.6 Cross-Tenant Tests

```
#75 Dealer A owner | GET /vehicles/{Dealer_B_vehicle_id}  | ❌ 404 Not Found
#76 Dealer A owner | GET /leads/{Dealer_B_lead_id}        | ❌ 404 Not Found
#77 Dealer A | GET /marketplace/listings/{any_id}         | ✅ Public data only
#78 Dealer A | POST /leads with dealer_B's vehicle_id     | Lead created for Dealer A's dealer_id
#79 Admin    | GET /admin/dealers/{any_id}                | ✅ (admin role required)
#80 Dealer   | GET /admin/dealers                         | ❌ 403 (admin JWT required)
```

### 6.7 Admin Role Tests

```
#81 Operations Manager | Approve pending dealer             | ✅ 200 OK
#82 Operations Manager | Terminate dealer                   | ❌ 403 (Super Admin only)
#83 Finance Admin     | View revenue dashboard              | ✅ Full access
#84 Finance Admin     | Suspend dealer for policy violation | ❌ 403 (Operations role)
#85 Content Moderator | Approve C2C listing                 | ✅ 200 OK
#86 Content Moderator | View dealer billing data            | ❌ 403 Forbidden
#87 Marketing Admin   | Submit IMV override request         | ✅ 200 (request created)
#88 Marketing Admin   | Approve IMV override               | ❌ 403 (Super Admin only)
#89 System Admin      | Toggle feature flag                 | ✅ 200 OK
#90 System Admin      | Access dealer CRM data              | ❌ 403 Forbidden
#91 Super Admin       | Impersonate dealer                  | ✅ 200 (impersonation token issued)
#92 Operations Manager | Impersonate dealer                 | ❌ 403 (Super Admin only)
```

---

## 7. API Integration Test Suite

### 7.1 Critical Path Tests (Run on Every Deploy)

```typescript
// tests/integration/critical-paths.test.ts

describe('Critical Path: Dealer Onboarding Flow', () => {
  test('Register → OTP → Login → Create Vehicle → Marketplace Sync', async () => {
    // Step 1: Register
    const regResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({ phone: '+8801711111111', full_name: 'Test Dealer', password: 'secure123' });
    expect(regResponse.status).toBe(201);

    // Step 2: OTP
    const otpResponse = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: '+8801711111111', code: getTestOtp(), purpose: 'registration' });
    expect(otpResponse.status).toBe(200);

    // Step 3: Create dealership
    const dealerResponse = await request(app)
      .post('/api/v1/dealerships')
      .set('Authorization', `Bearer ${otpResponse.body.data.access_token}`)
      .send({ business_name: 'Test Motors', district: 'Dhaka', division: 'Dhaka' });
    expect(dealerResponse.status).toBe(201);

    // Step 4: Create vehicle
    const vehicleResponse = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${otpResponse.body.data.access_token}`)
      .send({
        make: 'Toyota', model: 'Axio', year: 2019,
        mileage_km: 45000, fuel_type: 'petrol',
        transmission: 'automatic', condition: 'reconditioned',
        asking_price: 1450000,
      });
    expect(vehicleResponse.status).toBe(201);
    const vehicleId = vehicleResponse.body.data.id;

    // Step 5: Verify marketplace listing created (sync triggered)
    await waitForSync(vehicleId, 3000); // wait up to 3 seconds
    const listingResponse = await request(app)
      .get(`/api/v1/marketplace/search?make=Toyota&model=Axio`);
    expect(listingResponse.status).toBe(200);
    const listing = listingResponse.body.data.results.find(
      (l: any) => l.vehicle_id === vehicleId
    );
    expect(listing).toBeDefined();
    expect(listing.asking_price).toBe(1450000);
  });
});

describe('Critical Path: Lead Flow', () => {
  test('Marketplace enquiry → CRM lead → WhatsApp automation fired', async () => {
    // Submit buyer enquiry from marketplace
    const enquiryResponse = await request(app)
      .post('/api/v1/marketplace/leads')
      .send({
        listing_id: testListingId,
        buyer_name: 'Rafiq Hossain',
        buyer_phone: '+8801722222222',
      });
    expect(enquiryResponse.status).toBe(201);
    const leadId = enquiryResponse.body.data.lead_id;

    // Wait for BullMQ to process lead assignment
    await waitFor(500);

    // Verify lead created in dealer's CRM
    const leadResponse = await request(app)
      .get(`/api/v1/leads/${leadId}`)
      .set('Authorization', `Bearer ${dealerToken}`);
    expect(leadResponse.status).toBe(200);
    expect(leadResponse.body.data.stage).toBe('new');
    expect(leadResponse.body.data.buyer_phone).toBe('+8801722222222');

    // Verify automation log entry created (Day 0 WhatsApp — mocked)
    const logsResponse = await request(app)
      .get('/api/v1/automation/logs?trigger_event=lead.created')
      .set('Authorization', `Bearer ${dealerToken}`);
    expect(logsResponse.body.data.logs.length).toBeGreaterThan(0);
  });
});

describe('Critical Path: Deal + Payment', () => {
  test('Lead → Deal → Bill of Sale PDF generated', async () => {
    // Convert lead to deal
    const dealResponse = await request(app)
      .post('/api/v1/deals')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        lead_id: testLeadId,
        vehicle_id: testVehicleId,
        sale_price: 1420000,
        deal_type: 'cash',
      });
    expect(dealResponse.status).toBe(201);
    const dealId = dealResponse.body.data.id;

    // Approve deal
    const approveResponse = await request(app)
      .post(`/api/v1/deals/${dealId}/approve`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(approveResponse.status).toBe(200);
    expect(approveResponse.body.data.status).toBe('approved');

    // Generate Bill of Sale
    const bosResponse = await request(app)
      .post(`/api/v1/deals/${dealId}/bill-of-sale`)
      .set('Authorization', `Bearer ${managerToken}`);
    expect(bosResponse.status).toBe(200);
    expect(bosResponse.body.data.bill_of_sale_url).toMatch(/^https:\/\/media\.autoverse/);

    // Verify vehicle is reserved
    const vehicleResponse = await request(app)
      .get(`/api/v1/vehicles/${testVehicleId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(vehicleResponse.body.data.status).toBe('reserved');
  });
});
```

### 7.2 Edge Case Tests

```typescript
describe('Edge Cases: Idempotency', () => {
  test('Duplicate lead creation from same buyer phone', async () => {
    // Create lead 1
    await createLead({ phone: '+8801733333333', vehicle_id: vehicleA });
    // Create lead 2 (same phone, same vehicle)
    const result = await createLead({ phone: '+8801733333333', vehicle_id: vehicleA });

    // Should merge — only one lead exists, enquiry_count incremented
    const leads = await getLeads({ phone: '+8801733333333' });
    expect(leads.length).toBe(1);
    expect(leads[0].enquiry_count).toBe(2);
  });

  test('Concurrent vehicle status changes', async () => {
    // Two concurrent requests to change same vehicle status
    const [result1, result2] = await Promise.all([
      updateVehicleStatus(vehicleId, 'reserved'),
      updateVehicleStatus(vehicleId, 'reserved'),
    ]);
    // Both should succeed (idempotent operation)
    expect(result1.status).toBe(200);
    expect(result2.status).toBe(200);

    // Only one deal linked
    const vehicle = await getVehicle(vehicleId);
    expect(vehicle.status).toBe('reserved');
  });

  test('Payment idempotency — same key retried', async () => {
    const idempotencyKey = generateKey(dealerId, invoiceId, currentRound());

    // First payment attempt
    const payment1 = await initiatePayment({ idempotencyKey });
    expect(payment1.status).toBe(201);

    // Second attempt with same key (retry within 5-min window)
    const payment2 = await initiatePayment({ idempotencyKey });
    expect(payment2.status).toBe(200);          // 200 = existing found
    expect(payment2.body.already_processed).toBe(true);

    // Only one payment_transaction in DB
    const transactions = await getTransactions({ idempotencyKey });
    expect(transactions.length).toBe(1);
  });
});

describe('Edge Cases: State Machine Violations', () => {
  test('Cannot change vehicle status from sold', async () => {
    await setVehicleStatus(vehicleId, 'sold');
    const result = await updateVehicleStatus(vehicleId, 'available');
    expect(result.status).toBe(422);
    expect(result.body.error.code).toBe('VEHICLE_SOLD_IMMUTABLE');
  });

  test('Cannot mark lead lost without reason', async () => {
    const result = await updateLeadStage(leadId, 'lost', { lost_reason: null });
    expect(result.status).toBe(422);
    expect(result.body.error.code).toBe('LEAD_LOST_REASON_REQUIRED');
  });

  test('Invalid vehicle status transition (reserved → acquired)', async () => {
    await setVehicleStatus(vehicleId, 'reserved');
    const result = await updateVehicleStatus(vehicleId, 'acquired');
    expect(result.status).toBe(422);
    expect(result.body.error.code).toBe('VEHICLE_STATUS_TRANSITION_INVALID');
  });
});
```

### 7.3 Sync Engine Tests

```typescript
describe('Sync Engine', () => {
  test('Vehicle publish triggers marketplace listing creation within 2s', async () => {
    const startTime = Date.now();
    await createVehicle({ marketplace_published: true });
    await waitForMarketplaceListing(vehicleId, 2000); // max 2 second wait
    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeLessThan(2000); // sync SLA: 2 seconds
    const listing = await getMarketplaceListing({ vehicle_id: vehicleId });
    expect(listing).toBeDefined();
    expect(listing.asking_price).toBe(vehicle.asking_price);
    // CRITICAL: private fields must NOT be in marketplace listing
    expect(listing.acquisition_cost).toBeUndefined();
    expect(listing.recon_total).toBeUndefined();
    expect(listing.staff_notes).toBeUndefined();
  });

  test('Price update syncs deal_score within 500ms', async () => {
    const startTime = Date.now();
    await updateVehiclePrice(vehicleId, 1200000); // update price
    await waitForDealScoreUpdate(vehicleId, 500);
    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeLessThan(500);
    const listing = await getMarketplaceListing({ vehicle_id: vehicleId });
    expect(listing.deal_score).toBeDefined();
    expect(listing.deal_rating).toMatch(/great_deal|good_deal|fair_price|overpriced|unrated/);
  });

  test('Dealer suspension hides all listings', async () => {
    await suspendDealer(dealerId);
    const listings = await getMarketplaceListings({ dealership_id: dealerId });
    const activeListings = listings.filter(l => l.status === 'active');
    expect(activeListings.length).toBe(0);
  });

  test('Dealer reinstatement restores listings', async () => {
    await reinstateDealer(dealerId);
    const listings = await getMarketplaceListings({ dealership_id: dealerId });
    const activeListings = listings.filter(l => l.status === 'active');
    expect(activeListings.length).toBeGreaterThan(0);
  });
});
```

---

## 8. Load Test Targets Per Critical Endpoint

### 8.1 Load Test Tool & Strategy

```
TOOL: k6 (Grafana k6 — JavaScript-based load testing, free open source)
ENVIRONMENT: staging (never production)
WARM-UP: 10% of target load for 60s before full load

METRICS TO CAPTURE PER TEST:
  p50, p95, p99 response time
  Error rate (target: < 0.1% at sustained load)
  Throughput (requests/second)
  DB connection pool utilization
  Redis hit rate
  BullMQ queue depth during load
```

### 8.2 Endpoint Load Targets

```
FORMAT: ENDPOINT | LOAD SCENARIO | P95 TARGET | P99 TARGET | MAX ERROR RATE

PUBLIC MARKETPLACE (read-heavy, no auth):
──────────────────────────────────────────────────────────────────────────────
GET /marketplace/search          | 100 RPS sustained | 200ms | 500ms | 0.1%
  Simulates: peak marketplace traffic, 100 concurrent searchers
  Cache strategy: Redis TTL 120s for common queries
  Expected: > 90% cache hits at steady state
  DB query: should NEVER hit for cached searches

GET /marketplace/listings/:slug  | 200 RPS sustained | 150ms | 300ms | 0.1%
  Simulates: listing detail pages (ISR served by Vercel CDN primarily)
  Most traffic: CDN hit (< 5ms) — test measures CDN miss path
  Scenarios: cold cache, warm cache, stale ISR revalidation

GET /imv                         | 50 RPS sustained  | 100ms | 200ms | 0.1%
  Simulates: C2C listing wizard pricing widget
  Cache: Redis TTL 3600s per cluster

──────────────────────────────────────────────────────────────────────────────
DEALER OS (authenticated, write-heavy):
──────────────────────────────────────────────────────────────────────────────
GET /vehicles                    | 50 RPS sustained  | 200ms | 400ms | 0.1%
  Simulates: 500 dealers with 1 staff each browsing inventory simultaneously
  Auth overhead: JWT verify + Redis RLS context

POST /vehicles                   | 10 RPS sustained  | 500ms | 1000ms | 0.5%
  Simulates: 10 dealers simultaneously adding vehicles
  Includes: DB write + event emit + BullMQ job creation
  Note: higher P99 acceptable (write path with side effects)

PUT /vehicles/:id/status         | 10 RPS sustained  | 300ms | 600ms | 0.1%
  Status change triggers sync event → BullMQ job
  DB write + event bus + queue should complete < 300ms p95

GET /leads                       | 50 RPS sustained  | 150ms | 300ms | 0.1%
  CRM pipeline list: most common dealer dashboard action

POST /leads                      | 20 RPS sustained  | 300ms | 600ms | 0.1%
  New lead creation (from marketplace, Facebook, manual)
  Includes: dedup check, salesperson assignment, BullMQ job

PUT /leads/:id/stage             | 20 RPS sustained  | 200ms | 400ms | 0.1%

POST /deals                      | 5 RPS sustained   | 500ms | 1000ms | 0.5%
  Deal creation: complex transaction, multi-table writes

──────────────────────────────────────────────────────────────────────────────
SYNC ENGINE (internal, BullMQ workers):
──────────────────────────────────────────────────────────────────────────────
BullMQ: sync-vehicle queue processing
  Target throughput: 200 jobs/minute at 10 workers
  P95 job processing time: < 2000ms (sync SLA)
  Queue depth: should not exceed 500 at sustained 200 vehicles/min update rate

BullMQ: automation-whatsapp queue
  Target throughput: 500 messages/minute at 5 workers
  P95 job processing: < 5000ms (WhatsApp API call included)

──────────────────────────────────────────────────────────────────────────────
PAYMENT ENDPOINTS:
──────────────────────────────────────────────────────────────────────────────
POST /payments/bkash/create      | 2 RPS sustained   | 2000ms | 5000ms | 1%
  bKash API is slow (1–3s response time typical)
  P95 target accounts for network round-trip to bKash
  Error rate 1%: bKash timeouts are expected (~5% peak hours)

POST /payments/bkash/execute     | 2 RPS sustained   | 3000ms | 8000ms | 2%
  Execute = bKash processes payment → higher latency
  8000ms P99: our 8-second timeout before fallback query

POST /payments/sslcommerz/ipn   | 5 RPS sustained   | 200ms  | 500ms  | 0.1%
  IPN processing should be fast (just DB writes after hash verify)
  bKash/Nagad IPNs arrive in bursts after campaigns

──────────────────────────────────────────────────────────────────────────────
ADMIN PANEL (low volume, correctness critical):
──────────────────────────────────────────────────────────────────────────────
GET /admin/dealers               | 5 RPS sustained   | 500ms  | 1000ms | 0.1%
GET /admin/moderation/listings   | 5 RPS sustained   | 200ms  | 500ms  | 0.1%
PUT /admin/dealers/:id/approve   | 1 RPS sustained   | 300ms  | 600ms  | 0.1%
```

### 8.3 Stress Test Scenarios

```typescript
// k6 stress test script example (for marketplace search)
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '60s',  target: 10  }, // Warm-up: ramp to 10 VUs
    { duration: '120s', target: 100 }, // Load: ramp to 100 VUs (target load)
    { duration: '300s', target: 100 }, // Sustained: hold 100 VUs for 5 minutes
    { duration: '120s', target: 200 }, // Stress: double the load
    { duration: '60s',  target: 0   }, // Cool-down: ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed:   ['rate<0.001'],  // < 0.1% error rate
  },
};

export default function () {
  const queries = [
    '/api/v1/marketplace/search?make=Toyota&district=Dhaka',
    '/api/v1/marketplace/search?body_type=suv&price_max=2000000',
    '/api/v1/marketplace/search?fuel_type=hybrid&year_min=2018',
    '/api/v1/marketplace/search?deal_rating=great_deal&district=Dhaka',
  ];

  const query = queries[Math.floor(Math.random() * queries.length)];
  const response = http.get(`https://staging.api.autoverse.com.bd${query}`);

  check(response, {
    'status 200':           (r) => r.status === 200,
    'response < 200ms':     (r) => r.timings.duration < 200,
    'has results':          (r) => JSON.parse(r.body).data.total > 0,
  });

  sleep(0.1); // 100ms think time between requests
}
```

### 8.4 Database Query Performance Targets

```sql
-- These queries must meet targets at 500K+ listings

-- Marketplace search (most critical):
EXPLAIN ANALYZE
SELECT id, asking_price, make, model, year, deal_rating, district, photos
FROM marketplace_listing
WHERE make = 'Toyota' AND district = 'Dhaka' AND status = 'active'
ORDER BY deal_score ASC
LIMIT 20;
-- Target: < 20ms execution time with idx_ml_search_core

-- Dealer inventory list:
EXPLAIN ANALYZE
SELECT id, stock_no, make, model, year, asking_price, status, days_on_lot
FROM vehicle
WHERE dealership_id = $1 AND status = 'available' AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 50;
-- Target: < 10ms with idx_v_dealer_status

-- IMV cluster lookup:
EXPLAIN ANALYZE
SELECT p25, p50, p75, sample_size, confidence
FROM imv_cluster
WHERE make = 'Toyota' AND model = 'Axio' AND year = 2019
  AND mileage_bucket = '30-60K' AND condition = 'reconditioned'
  AND district = 'Dhaka';
-- Target: < 5ms (unique index lookup, should be index scan)

-- Lead pipeline query:
EXPLAIN ANALYZE
SELECT id, buyer_name, stage, lead_score, next_follow_up, assigned_to
FROM lead
WHERE dealership_id = $1
  AND stage NOT IN ('closed', 'lost')
  AND deleted_at IS NULL
ORDER BY next_follow_up ASC NULLS LAST;
-- Target: < 10ms with idx_l_pipeline

-- EXECUTION PLAN REQUIREMENTS:
-- All queries above MUST show: Index Scan (not Seq Scan) in EXPLAIN output
-- If Seq Scan appears: index missing or query needs adjustment
-- Check with: SET enable_seqscan = off; to force index usage investigation
```

---

## 9. Security Monitoring & Incident Response

### 9.1 Security Event Monitoring

```typescript
// Security events that trigger immediate alerts:

const SECURITY_ALERT_EVENTS = {
  // Authentication
  'auth.otp_rate_limit_exceeded':      PRIORITY.HIGH,   // SMS OTP brute force
  'auth.failed_login_spike':           PRIORITY.HIGH,   // > 10 failures/min per account
  'auth.admin_login_failed_5x':        PRIORITY.CRITICAL, // Admin brute force
  'auth.refresh_rotation_attack':      PRIORITY.CRITICAL, // Token theft detected
  'auth.admin_ip_blocked':             PRIORITY.MEDIUM, // Unknown IP hit admin panel

  // Data access
  'rls.unexpected_zero_rows':          PRIORITY.MEDIUM, // Possible RLS bypass attempt
  'api.uuid_substitution_detected':    PRIORITY.MEDIUM, // IDOR attempt

  // Payments
  'payment.duplicate_charge_prevented': PRIORITY.HIGH,  // Idempotency key conflict
  'payment.hash_verification_failed':  PRIORITY.CRITICAL, // IPN tampering
  'payment.amount_mismatch':           PRIORITY.CRITICAL, // Amount manipulation

  // Automation
  'automation.loop_detected':          PRIORITY.MEDIUM,
  'automation.opt_out_bypass_attempt': PRIORITY.HIGH,
  'webhook.signature_invalid':         PRIORITY.MEDIUM,

  // Rate limits
  'rate_limit.api_exceeded_100rps':    PRIORITY.HIGH,   // DDoS or scraping
  'rate_limit.payment_exceeded':       PRIORITY.MEDIUM,
};

// Alert routing:
// CRITICAL → immediate Slack + SMS to System Admin + CEO
// HIGH     → Slack + SMS to System Admin
// MEDIUM   → Slack to System Admin channel
// LOW      → Dashboard log only

// Sentry performance monitoring alerts:
// p95 > 2× baseline for any endpoint → alert
// Error rate > 1% for 5 minutes → alert
// Queue depth > 1,000 for sync-vehicle → alert
```

### 9.2 Incident Response Playbook

```
INCIDENT LEVEL 1 — Data Breach Suspected
  Definition: Evidence of cross-tenant data access or credential exposure
  Immediate actions (< 15 minutes):
    1. Rotate all JWT signing keys (invalidates all sessions)
       SET token_invalidate_before = NOW() in Redis
    2. Rotate all admin 2FA sessions
    3. Force re-login for all active sessions
    4. Preserve all logs (freeze log deletion jobs)
  Investigation:
    5. Review platform_audit_log for unusual cross-tenant queries
    6. Check entity_change_log for unauthorized modifications
    7. Review IP access logs in Cloudflare
  Communication:
    8. Notify affected dealers if data was exposed
    9. File mandatory notification (if BD regulations require)

INCIDENT LEVEL 2 — Payment System Compromise
  Definition: Double-charge detected, payment manipulation suspected
  Immediate actions:
    1. Suspend affected payment gateway (disable bKash/Nagad routes)
    2. Freeze all billing jobs in BullMQ
    3. Notify Finance Admin
  Investigation:
    4. Run reconciliation: compare gateway records vs our payment_transaction
    5. Identify all transactions in affected time window
  Resolution:
    6. Manual refund for any double-charged accounts
    7. Restore payment processing after root cause confirmed

INCIDENT LEVEL 3 — Admin Panel Unauthorized Access
  Definition: Admin panel accessed from unauthorized IP or credentials compromised
  Immediate actions:
    1. Revoke ALL admin sessions (Redis: flush admin_session:*)
    2. Force 2FA reset for all admin accounts
    3. Update IP allowlist to temporarily block all external access
  Investigation:
    4. Review platform_audit_log for all admin actions in last 48h
    5. Check for dealer data modifications, plan changes, IMV overrides
  Communication:
    6. Alert all affected dealers if any unauthorized changes made

INCIDENT LEVEL 4 — Automation Abuse
  Definition: WhatsApp/SMS spam, automation loop caused mass sends
  Immediate actions:
    1. Pause all BullMQ automation queues
    2. Check rate counters for affected dealers
  Resolution:
    3. Identify which rules caused the issue
    4. Fix rule config and resume
    5. Contact Meta/Greenweb if WABA/SMS account flagged
```

---

## 10. Penetration Test Checklist

```
PRE-LAUNCH SECURITY CHECKLIST

AUTHENTICATION & AUTHORIZATION:
  ☐ JWT RS256 signature verification tested (tampered payload → 401)
  ☐ Admin JWT separate key tested (dealer token rejected on admin endpoint)
  ☐ Token expiry tested (expired token → 401 with AUTH_TOKEN_EXPIRED code)
  ☐ Refresh token rotation tested (old token rejected after rotation)
  ☐ Rotation attack detection tested (revoked token → all sessions revoked)
  ☐ OTP rate limiting tested (3 max per 10 min)
  ☐ OTP brute force tested (5 attempts → OTP invalidated)
  ☐ 2FA enforcement tested on all admin logins

MULTI-TENANT ISOLATION:
  ☐ All 25 penetration scenarios from Section 4 executed and passed
  ☐ RLS policies verified: no rows returned for wrong tenant context
  ☐ DTO whitelist tested: dealership_id from body is ignored
  ☐ Private financial fields tested: null for non-owner roles
  ☐ Admin bypass confirmed: admin reads use explicit dealer_id filter

INPUT VALIDATION:
  ☐ SQL injection attempts tested on all filter parameters (Prisma parameterization)
  ☐ Path traversal tested on file upload endpoints
  ☐ SSRF tested on webhook URL configuration
  ☐ XSS tested on all text input fields stored to DB (output encoding)
  ☐ Integer overflow tested on BDT amount fields (DECIMAL(12,2) bounds)
  ☐ Negative amounts rejected (CHECK constraints tested)
  ☐ UUID format validated on all UUID parameters (ParseUuidPipe)

PAYMENT SECURITY:
  ☐ All 6 bKash idempotency tests from Section 5.1 passed
  ☐ SSLCommerz IPN hash verification tested (tampered payload → rejected)
  ☐ Nagad response signature verification tested
  ☐ Amount manipulation tested (IPN with different amount → rejected)
  ☐ Replay attack on IPN tested → idempotency prevents double-activation
  ☐ Concurrent payment processing tested → Redis lock prevents race condition

AUTOMATION SECURITY:
  ☐ Webhook signature verification tested (WhatsApp, Facebook, Greenweb)
  ☐ Opt-out bypass attempt tested → message blocked
  ☐ Rate limit enforcement tested per channel
  ☐ Automation loop detection tested
  ☐ Contact daily limit tested (max 3 messages)

ADMIN PANEL:
  ☐ IP allowlist blocks access from non-allowlisted IP
  ☐ 404 (not 403) returned from non-allowlisted IP (obscures existence)
  ☐ 2FA required on all admin logins
  ☐ 5 failed attempts → account locked
  ☐ Impersonation logging tested (audit trail verified)
  ☐ Re-authentication required for sensitive actions (termination, refunds)
  ☐ Session idle timeout tested (30 min → re-auth required)

INFRASTRUCTURE:
  ☐ HTTPS enforced (HTTP redirects to HTTPS at Cloudflare level)
  ☐ HSTS header present
  ☐ Content-Security-Policy header present
  ☐ X-Content-Type-Options: nosniff present
  ☐ Sensitive data not logged (no passwords, tokens in logs)
  ☐ Error responses don't expose stack traces in production
  ☐ Database connection strings not in code repository (env vars only)
  ☐ Encryption keys not in code repository
  ☐ R2 bucket not publicly listable (objects accessible by URL, not directory)
  ☐ Redis not exposed to public internet (Upstash TLS + auth token)

DEPENDENCY SECURITY:
  ☐ npm audit run: 0 high/critical vulnerabilities
  ☐ Prisma version: latest stable
  ☐ Node.js version: LTS (not EOL)
  ☐ Docker base image: latest stable with no critical CVEs
  ☐ GitHub Dependabot: enabled for automatic security PRs
```

---

*AutoVerse — Step 8: Security + Testing*
*JWT RS256 · Admin Security · Automation Security · Multi-Tenant Penetration · Role Test Matrix · Load Targets*
*Built against Blueprint v7.0*
