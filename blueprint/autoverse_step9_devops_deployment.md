# AutoVerse — Step 9: DevOps & Deployment
### Infrastructure Map · Cloudflare Worker · Admin Deployment · CI/CD · Zero-Downtime · Worker Dynos · Monitoring · Backup · v1.0

> Complete DevOps specification: infrastructure map with costs at every dealer scale milestone, Cloudflare Worker configuration for custom domain routing, admin panel separate deployment with IP restriction, full GitHub Actions CI/CD pipeline with environment promotion gates, zero-downtime deployment strategy with migration safety, automation worker architecture per channel, monitoring stack with alert routing, and backup + point-in-time recovery.

---

## Table of Contents

1. [Infrastructure Map — All Services with Costs at Scale](#1-infrastructure-map--all-services-with-costs-at-scale)
2. [Environment Strategy](#2-environment-strategy)
3. [Cloudflare Worker — Dealer Custom Domain Routing](#3-cloudflare-worker--dealer-custom-domain-routing)
4. [Admin Panel — Separate Deployment & IP Restriction](#4-admin-panel--separate-deployment--ip-restriction)
5. [CI/CD — GitHub Actions with Environment Promotion Gates](#5-cicd--github-actions-with-environment-promotion-gates)
6. [Zero-Downtime Deployment Strategy with Migration Safety](#6-zero-downtime-deployment-strategy-with-migration-safety)
7. [Automation Workers — Separate Dynos Per Channel](#7-automation-workers--separate-dynos-per-channel)
8. [Monitoring — Sentry, PostHog, Uptime & BullMQ Dashboard](#8-monitoring--sentry-posthog-uptime--bullmq-dashboard)
9. [Backup & Point-in-Time Recovery](#9-backup--point-in-time-recovery)
10. [Scaling Runbook — When and How to Scale](#10-scaling-runbook--when-and-how-to-scale)

---

## 1. Infrastructure Map — All Services with Costs at Scale

### 1.1 Service Architecture Diagram

```
                    ┌─────────────────────────────────────────────┐
                    │            CLOUDFLARE (Edge)                 │
                    │  CDN · DDoS · DNS · Custom Domain Routing    │
                    │  Worker: dealer domain → Next.js routing     │
                    └──────────────┬──────────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
    ┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐
    │   VERCEL         │  │  VERCEL         │  │  VERCEL          │
    │   Marketplace    │  │  Dealer OS      │  │  Admin Panel     │
    │   (Next.js SSR)  │  │  (Next.js CSR)  │  │  (Next.js CSR)   │
    │   autoverse.com  │  │  app.autoverse  │  │  admin.autoverse │
    └────────┬─────────┘  └────────┬────────┘  └────────┬─────────┘
             │                     │                     │
             └─────────────────────┴─────────────────────┘
                                   │ HTTPS API calls
                    ┌──────────────▼──────────────────────┐
                    │    DIGITALOCEAN APP PLATFORM         │
                    │                                      │
                    │  ┌─────────────────────────────┐    │
                    │  │  main-api (NestJS, 2+ inst)  │    │
                    │  │  Port 3000                   │    │
                    │  └─────────────────────────────┘    │
                    │  ┌──────────┐ ┌──────────────────┐  │
                    │  │main-     │ │automation-worker  │  │
                    │  │worker    │ │(WhatsApp/FB/Email) │  │
                    │  └──────────┘ └──────────────────┘  │
                    │  ┌──────────┐ ┌──────────────────┐  │
                    │  │notif-    │ │analytics-worker   │  │
                    │  │worker    │ │(Maestro/Summary)  │  │
                    │  └──────────┘ └──────────────────┘  │
                    │  ┌──────────────────────────────┐   │
                    │  │  feed-worker (GMC/FB catalog) │   │
                    │  └──────────────────────────────┘   │
                    └───────────────┬─────────────────────┘
                                    │
          ┌─────────────────────────┼────────────────────────────┐
          ▼                         ▼                            ▼
┌──────────────────┐   ┌────────────────────────┐   ┌──────────────────────┐
│  DO MANAGED      │   │  UPSTASH REDIS          │   │  DO DROPLET          │
│  POSTGRESQL      │   │  (Serverless Redis)     │   │  MeiliSearch         │
│  (Primary DB)    │   │  Queues + Cache         │   │  (Search Engine)     │
└──────────────────┘   └────────────────────────┘   └──────────────────────┘
          │
          ▼
┌──────────────────┐   ┌────────────────────────┐
│  CLOUDFLARE R2   │   │  EXTERNAL SERVICES      │
│  (Object Storage)│   │  bKash · Nagad          │
│  Photos · PDFs   │   │  SSLCommerz · Greenweb  │
│  Feeds · Exports │   │  Meta WABA · Resend     │
└──────────────────┘   │  NHTSA · Firebase FCM   │
                        └────────────────────────┘
```

### 1.2 Cost Table at Every Scale Milestone

```
SERVICE                    MVP (50)    GROWTH (200)  SCALE (500)  ENT (1000)
                           dealers     dealers       dealers      dealers
─────────────────────────────────────────────────────────────────────────────
FRONTEND (Vercel)
  Marketplace + Dealer OS  Free tier   Pro $20       Pro $20      Pro $20
  (Vercel Pro = team)      $0          $20           $20          $20
  Note: Vercel free = OK   ──────────────────────────────────────────────
  until bandwidth exceeds  Monthly:    $20           $20          $20
  100GB/month

BACKEND API (DO App Platform)
  main-api instances        1×Basic     2×Basic       3×Basic      4×Pro
  ($12/mo per Basic,        $12         $24           $36          $96
   $25/mo per Pro)
  main-worker               1×Basic     1×Basic       2×Basic      2×Pro
                            $12         $12           $24          $50
  automation-worker         1×Basic     1×Basic       2×Basic      3×Pro
                            $12         $12           $24          $75
  notification-worker       1×Basic     1×Basic       1×Basic      2×Basic
                            $12         $12           $12          $24
  analytics-worker          1×Basic     1×Basic       1×Basic      2×Basic
                            $12         $12           $12          $24
  feed-worker               1×Basic     1×Basic       1×Basic      2×Basic
                            $12         $12           $12          $24
  ─────────────────────────────────────────────────────────────────────
  API subtotal              $72         $85           $120         $293

DATABASE (DO Managed PostgreSQL)
  Plan                      Basic       Basic         Pro           Pro
  Specs                     1CPU/1GB    1CPU/1GB      2CPU/4GB     4CPU/8GB
  Backup retention          7 days      7 days        14 days      30 days
  Cost                      $15         $15           $50          $100
  Read replica              —           —             +$25         +$50
  PgBouncer (connection      Built-in    Built-in      Built-in     Built-in
  pooling)

REDIS (Upstash)
  Plan                      Free        Pay-per-req   Pay-per-req  Pro
  Monthly requests (est)    ~5M         ~20M          ~50M         ~100M
  Cost                      $0          $5–10         $15–25       $40–80
  Note: Upstash free = 10K  ──────────────────────────────────────────────
  commands/day (too low);   Monthly:    $8            $20          $60
  use pay-per-request

SEARCH (MeiliSearch on DO Droplet)
  Droplet size              1CPU/1GB    2CPU/2GB      2CPU/4GB     4CPU/8GB
  Index size (est)          500K docs   2M docs       5M docs      10M docs
  Cost                      $6          $12           $24          $48
  Note: MeiliSearch is      ──────────────────────────────────────────────
  memory-hungry — size to   Monthly:    $12           $24          $48
  fit index in RAM

FILE STORAGE (Cloudflare R2)
  Storage                   10GB        50GB          200GB        500GB
  Operations (Class A)      ~1M/mo      ~5M/mo        ~20M/mo      ~50M/mo
  Operations (Class B)      ~5M/mo      ~20M/mo       ~80M/mo      ~200M/mo
  Cost (storage + ops)      ~$1         ~$3           ~$8          ~$18
  Egress: FREE              ──────────────────────────────────────────────
  (R2 has zero egress fees) Monthly:    $3            $8           $18

CDN + DNS (Cloudflare)
  Plan                      Free        Free          Pro          Pro
  Workers (custom domain)   Free (100K  Free          $5           $5
                            req/day)
  Cost                      $0          $0            $5           $5

SMS (Greenweb BD)
  Platform SMS/month (est)  5,000       20,000        60,000       150,000
  Cost per SMS              BDT 0.35    BDT 0.33      BDT 0.30     BDT 0.28
  Monthly cost (BDT)        1,750       6,600         18,000       42,000
  Monthly cost (USD ~110)   $16         $60           $164         $382

FIREBASE FCM               Free         Free          Free         Free
  (Push notifications)     $0           $0            $0           $0

MONITORING
  Sentry (error tracking)   Free tier    Team $26      Team $26     Business $80
  PostHog (product analytics) Free       Cloud $0      Cloud $0     Scale $450
                                         (1M events)   (1M events)
  Uptime monitoring         BetterUptime BetterUptime  BetterUptime BetterUptime
  (external)                Free         Free          Pro $20      Pro $20

CI/CD
  GitHub Actions            Free (2K     Free          Free         Free
                            min/month)

TOTAL MONTHLY (USD):
  Infrastructure only        ~$120       ~$200         ~$320        ~$620
  + SMS (USD)                $16         $60           $164         $382
  TOTAL                      ~$136       ~$260         ~$484        ~$1,002

TOTAL MONTHLY (BDT approximate at 110 BDT/USD):
  Infrastructure             BDT 13,200  BDT 22,000   BDT 35,200  BDT 68,200
  + SMS                      BDT 1,750   BDT 6,600    BDT 18,000  BDT 42,000
  GRAND TOTAL                BDT 14,950  BDT 28,600   BDT 53,200  BDT 1,10,200

REVENUE VS COST RATIO:
  50 dealers (avg BDT 3,500 ARPU):  Revenue BDT 1,75,000 → Infra 8.5%
  200 dealers:                       BDT 7,00,000 → Infra 4.1%
  500 dealers:                       BDT 17,50,000 → Infra 3.0%
  1,000 dealers:                     BDT 35,00,000 → Infra 3.1%
```

### 1.3 DigitalOcean App Platform Configuration

```yaml
# .do/app.yaml — App Platform spec
name: autoverse-api
region: sgp              # Singapore (closest to BD with low latency)
                         # Alternative: BLR (Bangalore) when DO adds India

services:
  - name: main-api
    github:
      repo: autoverse/autoverse-api
      branch: main
      deploy_on_push: false      # CI/CD pipeline controls deploys
    build_command: npm run build
    run_command: npm run start:api
    instance_count: 2            # Minimum 2 for zero-downtime deploy
    instance_size_slug: basic-xxs  # 512MB RAM, 1 shared vCPU
    http_port: 3000
    health_check:
      http_path: /health
      initial_delay_seconds: 30
      period_seconds: 10
      timeout_seconds: 5
      success_threshold: 1
      failure_threshold: 3
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        scope: RUN_TIME
        type: SECRET          # pulled from DO Secrets
      - key: REDIS_URL
        scope: RUN_TIME
        type: SECRET
      # ... all other env vars as secrets

  - name: main-worker
    github:
      repo: autoverse/autoverse-api
      branch: main
      deploy_on_push: false
    run_command: npm run start:worker:main
    instance_count: 1
    instance_size_slug: basic-xxs
    # No HTTP port — worker process only
    # Health check: BullMQ worker heartbeat (custom metric)

  - name: automation-worker
    run_command: npm run start:worker:automation
    instance_count: 1
    instance_size_slug: basic-xs   # 1GB RAM (more memory for WhatsApp/FB API calls)

  - name: notification-worker
    run_command: npm run start:worker:notification
    instance_count: 1
    instance_size_slug: basic-xxs

  - name: analytics-worker
    run_command: npm run start:worker:analytics
    instance_count: 1
    instance_size_slug: basic-xs   # 1GB RAM for Maestro AI computations

  - name: feed-worker
    run_command: npm run start:worker:feed
    instance_count: 1
    instance_size_slug: basic-xxs

databases:
  - name: autoverse-db
    engine: PG
    version: "16"
    size: db-s-1vcpu-1gb    # Upgrade to db-s-2vcpu-4gb at 200+ dealers
    num_nodes: 1

# Note: Redis via Upstash (external), MeiliSearch on separate Droplet
```

---

## 2. Environment Strategy

### 2.1 Three-Environment Setup

```
ENVIRONMENT HIERARCHY:
  development → staging → production

ENVIRONMENT CHARACTERISTICS:

DEVELOPMENT (local):
  Database:   Local PostgreSQL (Docker Compose)
  Redis:      Local Redis (Docker Compose)
  MeiliSearch: Local Docker container
  Payments:   bKash sandbox, Nagad sandbox, SSLCommerz sandbox
  SMS:        Greenweb sandbox (or mock — no real SMS sent)
  WhatsApp:   Meta test WABA (test phone numbers only)
  Email:      Resend test mode (emails not delivered, logged in dashboard)
  Purpose:    Daily development. Unsafe to commit secrets. Uses .env.local

STAGING (cloud, mirrors production):
  Database:   DO Managed PostgreSQL (separate DB, not production copy)
  Redis:      Upstash (separate instance)
  MeiliSearch: Dedicated staging Droplet
  Payments:   All gateway sandboxes
  SMS:        Greenweb sandbox (or restricted to test numbers)
  R2:         Separate staging bucket (media-staging.autoverse.com.bd)
  URL:        staging.autoverse.com.bd (not public-facing)
  Purpose:    Pre-release testing. Preview deploys for PRs. QA sign-off.
  Data:       Anonymized copy of production (weekly refresh, PII stripped)

PRODUCTION:
  All live services
  URL: autoverse.com.bd
  Access: only via CI/CD (no manual deployments)
  Secrets: stored in DO Secrets + Vercel environment variables

DATA ISOLATION RULES:
  Staging has NO access to production database (enforced via separate credentials)
  No shared Redis instances between environments
  No shared R2 buckets between environments
  Staging Cloudflare Worker: separate worker for staging subdomain

ENVIRONMENT VARIABLES:
  File: .env.example (committed — shows all required vars, no values)
  File: .env.local   (not committed — development values)
  File: .env.test    (committed — non-sensitive test values only)
  Production secrets: DO Secrets + Vercel environment variables (never in files)
```

### 2.2 Docker Compose for Local Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: autoverse_dev
      POSTGRES_USER: autoverse
      POSTGRES_PASSWORD: localdevpassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U autoverse"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  meilisearch:
    image: getmeili/meilisearch:v1.6
    ports:
      - "7700:7700"
    environment:
      MEILI_MASTER_KEY: localdevmasterkey
      MEILI_ENV: development
    volumes:
      - meili_data:/meili_data

  # Optional: BullMQ dashboard for local queue inspection
  bull-board:
    image: deadly0/bull-board
    ports:
      - "3001:3000"
    environment:
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      - redis

volumes:
  postgres_data:
  redis_data:
  meili_data:
```

---

## 3. Cloudflare Worker — Dealer Custom Domain Routing

### 3.1 Worker Overview

```
PURPOSE: Route requests from dealer custom domains (cars.dealer.com.bd)
         to the correct Next.js dealer microsite on Vercel.

WHY CLOUDFLARE WORKER (not just CNAME):
  Pure CNAME: dealer.com.bd → vercel-cname.vercel.app
  Problem: Next.js can't distinguish which dealer is being requested
           (it only sees the CNAME target, not the original domain)
  Solution: Worker intercepts request, reads Host header,
            looks up which dealer owns this domain,
            rewrites the request with dealer context.

WORKER DEPLOYMENT:
  wrangler deploy
  Worker bound to: *.autoverse.com.bd (all subdomains)
                 + all verified custom domains (via route patterns)

REQUEST FLOW:
  1. Buyer visits: cars.dhaka-auto.com.bd
  2. DNS: cars.dhaka-auto.com.bd CNAME → dealer.autoverse.com.bd
     (CNAME set up by dealer in their DNS panel)
  3. Cloudflare resolves dealer.autoverse.com.bd → Worker intercepts
  4. Worker reads Host: cars.dhaka-auto.com.bd
  5. Worker looks up: which dealership owns this custom domain?
  6. Worker rewrites request: forward to dealer.autoverse.com.bd/{slug}
     with X-Dealership-ID and X-Dealer-Slug headers injected
  7. Vercel Next.js receives request with dealer context
  8. Page renders with correct dealer's inventory and branding
```

### 3.2 Worker Implementation

```typescript
// worker/src/index.ts
// Deployed via Wrangler to Cloudflare Workers

export interface Env {
  DOMAIN_CACHE: KVNamespace;     // Cloudflare KV: custom_domain → { dealership_id, slug, status }
  DB_LOOKUP_URL: string;          // API endpoint for cache misses
  DB_LOOKUP_SECRET: string;       // Shared secret for internal API calls
  VERCEL_APP_URL: string;         // e.g., https://dealer.autoverse.com.bd
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url     = new URL(request.url);
    const host    = request.headers.get('Host') || '';
    const pathname = url.pathname;

    // 1. Determine if this is a custom domain or subdomain request
    const isSubdomain = host.endsWith('.autoverse.com.bd');
    const isCustomDomain = !isSubdomain && host !== 'autoverse.com.bd';

    if (!isCustomDomain && !isSubdomain) {
      // Pass through to marketplace (main domain)
      return fetch(request);
    }

    // 2. For subdomains: extract slug from host
    let dealerSlug: string | null = null;
    let dealershipId: string | null = null;

    if (isSubdomain) {
      // host = "dhaka-auto.autoverse.com.bd" → slug = "dhaka-auto"
      dealerSlug = host.replace('.autoverse.com.bd', '').split('.')[0];
    }

    if (isCustomDomain) {
      // 3. Look up custom domain in Cloudflare KV (fast — < 1ms)
      const cached = await env.DOMAIN_CACHE.get(host);
      if (cached) {
        const data = JSON.parse(cached) as DomainRecord;
        dealerSlug      = data.slug;
        dealershipId    = data.dealership_id;

        // Handle suspended dealer
        if (data.status === 'suspended' || data.status === 'terminated') {
          return new Response(MAINTENANCE_HTML, {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
      } else {
        // KV miss: call internal API to look up domain
        const lookupResult = await lookupDomain(host, env);
        if (!lookupResult) {
          return new Response('404 — Domain not found', { status: 404 });
        }

        // Cache result in KV (TTL: 5 minutes)
        await env.DOMAIN_CACHE.put(
          host,
          JSON.stringify(lookupResult),
          { expirationTtl: 300 }
        );

        dealerSlug   = lookupResult.slug;
        dealershipId = lookupResult.dealership_id;

        if (lookupResult.status === 'suspended') {
          return new Response(MAINTENANCE_HTML, { status: 503 });
        }
      }
    }

    if (!dealerSlug) {
      return new Response('404 — Not found', { status: 404 });
    }

    // 4. Build target URL
    // Rewrite cars.dhaka-auto.com.bd/cars/2019-toyota-axio
    // → dealer.autoverse.com.bd/dhaka-auto/cars/2019-toyota-axio
    const targetUrl = new URL(
      `${env.VERCEL_APP_URL}/${dealerSlug}${pathname}${url.search}`
    );

    // 5. Forward request with dealer context headers
    const modifiedRequest = new Request(targetUrl.toString(), {
      method:  request.method,
      headers: new Headers({
        ...Object.fromEntries(request.headers),
        'X-Dealership-ID':     dealershipId || '',
        'X-Dealer-Slug':       dealerSlug,
        'X-Original-Host':     host,
        'X-Forwarded-Host':    host,    // for canonical URL generation in Next.js
      }),
      body: request.body,
      redirect: 'manual',
    });

    const response = await fetch(modifiedRequest);

    // 6. Fix response headers (ensure CORS and canonical headers are correct)
    const modifiedResponse = new Response(response.body, response);
    modifiedResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
    modifiedResponse.headers.set('X-Content-Type-Options', 'nosniff');

    return modifiedResponse;
  }
};

async function lookupDomain(host: string, env: Env): Promise<DomainRecord | null> {
  const response = await fetch(
    `${env.DB_LOOKUP_URL}/api/v1/internal/domain-lookup?host=${encodeURIComponent(host)}`,
    {
      headers: {
        'X-Internal-Secret': env.DB_LOOKUP_SECRET,
        'Content-Type': 'application/json',
      },
      cf: { cacheTtl: 300 }  // Cloudflare caches this response too
    }
  );
  if (!response.ok) return null;
  return response.json();
}

const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Temporarily Unavailable</title></head>
<body style="font-family:sans-serif;text-align:center;padding:60px">
  <h1>Site Temporarily Unavailable</h1>
  <p>This dealership's website is temporarily offline. Please check back later.</p>
  <p>Find other dealers on <a href="https://autoverse.com.bd">AutoVerse Marketplace</a></p>
</body></html>`;

interface DomainRecord {
  dealership_id: string;
  slug:          string;
  status:        'active' | 'suspended' | 'terminated';
}
```

### 3.3 Worker Configuration (wrangler.toml)

```toml
# worker/wrangler.toml
name = "autoverse-domain-router"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
  routes = [
    { pattern = "*.autoverse.com.bd/*", zone_name = "autoverse.com.bd" },
    # Custom domains added dynamically via Cloudflare API when dealer connects domain
  ]

  kv_namespaces = [
    { binding = "DOMAIN_CACHE", id = "KV_NAMESPACE_ID_PRODUCTION" }
  ]

  [env.production.vars]
    VERCEL_APP_URL = "https://dealer.autoverse.com.bd"

  [env.production.secrets]
    # Set via: wrangler secret put DB_LOOKUP_URL
    # DB_LOOKUP_SECRET

[env.staging]
  routes = [
    { pattern = "*.staging.autoverse.com.bd/*", zone_name = "autoverse.com.bd" }
  ]

  kv_namespaces = [
    { binding = "DOMAIN_CACHE", id = "KV_NAMESPACE_ID_STAGING" }
  ]

  [env.staging.vars]
    VERCEL_APP_URL = "https://dealer.staging.autoverse.com.bd"
```

### 3.4 Custom Domain Registration API (Internal)

```typescript
// Called when dealer successfully verifies their custom domain DNS

@Post('internal/domain-register')
@UseGuards(InternalSecretGuard)       // validates X-Internal-Secret header
async registerCustomDomain(
  @Body() dto: { domain: string; dealership_id: string },
): Promise<void> {
  // 1. Verify DNS CNAME record actually points to dealer.autoverse.com.bd
  const dnsRecord = await this.dnsService.lookupCname(dto.domain);
  if (dnsRecord !== 'dealer.autoverse.com.bd') {
    throw new BadRequestException('CNAME record not found or incorrect');
  }

  // 2. Update dealer_website record
  await this.prisma.dealerWebsite.update({
    where: { dealership_id: dto.dealership_id },
    data: {
      custom_domain:           dto.domain,
      custom_domain_verified:  true,
      custom_domain_verified_at: new Date(),
    }
  });

  // 3. Add route to Cloudflare Worker via Cloudflare API
  await this.cloudflareService.addWorkerRoute(dto.domain);

  // 4. Warm KV cache immediately
  await this.cloudflareKvService.put(
    dto.domain,
    JSON.stringify({
      dealership_id: dto.dealership_id,
      slug:          await this.getSlug(dto.dealership_id),
      status:        'active',
    }),
    300  // 5-minute TTL
  );
}

// KV cache invalidation on dealer status change:
@OnEvent('dealer.suspended')
async invalidateDomainCache(event: DealerSuspendedEvent): Promise<void> {
  const website = await this.prisma.dealerWebsite.findFirst({
    where: { dealership_id: event.dealer_id }
  });
  if (website?.custom_domain) {
    // Overwrite KV with suspended status
    await this.cloudflareKvService.put(
      website.custom_domain,
      JSON.stringify({
        dealership_id: event.dealer_id,
        slug:          website.subdomain,
        status:        'suspended',
      }),
      300
    );
  }
}
```

---

## 4. Admin Panel — Separate Deployment & IP Restriction

### 4.1 Separate Vercel Deployment

```
RATIONALE FOR SEPARATE DEPLOYMENT:
  Main app (autoverse.com.bd) is public — optimized for SEO, ISR, public caching
  Admin panel (admin.autoverse.com.bd) must NEVER be publicly cached
  Different security headers, different CSP, different access control
  Separate deployment = separate Vercel project = independent deploy pipeline

ADMIN PANEL VERCEL PROJECT:
  Project name: autoverse-admin
  Domain: admin.autoverse.com.bd
  Framework: Next.js (App Router, CSR-only — no SSR/SSG for admin)
  Build command: npm run build:admin
  Root directory: apps/admin

  ENVIRONMENT VARIABLES (in Vercel admin project):
    NEXT_PUBLIC_API_URL=https://api.autoverse.com.bd
    NEXT_PUBLIC_ADMIN_ENV=production
    # No DB credentials needed (admin is a pure API consumer)

SECURITY HEADERS (next.config.js for admin):
  const securityHeaders = [
    { key: 'X-Frame-Options',        value: 'DENY' },         // block iframes
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy',        value: 'strict-origin' },
    {
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",   // needed for Next.js inline scripts
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https://media.autoverse.com.bd",
        "connect-src 'self' https://api.autoverse.com.bd",
        "frame-ancestors 'none'",              // block embedding
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload'
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=()',
    }
  ];
```

### 4.2 IP Restriction at Cloudflare Level

```
APPROACH: Two layers of IP restriction.
Layer 1: Cloudflare WAF (firewall rule) — fastest rejection, before request hits origin
Layer 2: NestJS middleware (IpAllowlistMiddleware) — defense in depth

CLOUDFLARE WAF RULE (configured in Cloudflare dashboard):
  Rule name: Block non-allowlisted admin access
  Expression:
    (http.host eq "admin.autoverse.com.bd")
    and not (
      ip.src in {x.x.x.x/32 y.y.y.y/32 z.z.z.0/24}  # replace with actual IPs
    )
  Action: Block (returns 403 without exposing response from origin)

  IMPORTANT: This rule means attackers never reach our servers.
             Even DDoS on admin.autoverse.com.bd is absorbed by Cloudflare.

CLOUDFLARE ZERO TRUST (alternative, more scalable):
  For team size > 5 admins: use Cloudflare Access (Zero Trust)
  Every admin login requires: email OTP via Cloudflare Access + our own 2FA
  No IP management needed (identity-based access)
  Cost: Free for up to 50 users
  Setup: Cloudflare Access > Applications > Add Application > Self-hosted
         Configure email policy: allowed_domains = ["autoverse.com.bd"]
  Result: admin.autoverse.com.bd requires Cloudflare Access auth BEFORE our login screen

DYNAMIC IP ALLOWLIST (for remote work):
  Admin team members on home IP or VPN can add their IP via:
    VPN: company VPN (all team uses same VPN IP) — recommended
    Dynamic: Ops Manager can add IP via admin panel (Super Admin approval required)
             New IP active within 5 minutes (Cloudflare API update)
    Auto-expire: dynamically added IPs expire after 24 hours (prevent forgotten additions)
```

### 4.3 Admin API Routes — Separate NestJS Module

```typescript
// Admin routes are on the SAME NestJS API server BUT:
//   1. Separate route prefix: /api/v1/admin/
//   2. Different JWT strategy (JwtAdminGuard vs JwtAuthGuard)
//   3. IP allowlist middleware applied to all /admin/* routes
//   4. All admin actions logged to platform_audit_log

// Deployment note: admin.autoverse.com.bd (frontend) → api.autoverse.com.bd/api/v1/admin/
// The admin frontend calls the same API server as the dealer app
// Access control via: IP allowlist + admin JWT (separate signing key)
// Cloudflare WAF: admin.autoverse.com.bd restricted by IP
// api.autoverse.com.bd/api/v1/admin/: restricted by IpAllowlistMiddleware + JwtAdminGuard

// Additional admin API security:
const ADMIN_RATE_LIMITS = {
  'POST /admin/dealers/:id/approve':     { max: 100, window: '1h' },
  'POST /admin/dealers/:id/suspend':     { max: 50,  window: '1h' },
  'POST /admin/dealers/:id/terminate':   { max: 10,  window: '24h' },
  'POST /admin/broadcast':               { max: 5,   window: '24h' },
  'POST /admin/imv/override':            { max: 20,  window: '24h' },
};
// These limits prevent runaway scripts even from authenticated admins
```

---

## 5. CI/CD — GitHub Actions with Environment Promotion Gates

### 5.1 Repository Structure

```
MONOREPO STRUCTURE (Turborepo):
  autoverse/
  ├── apps/
  │   ├── api/          (NestJS backend)
  │   ├── web/          (Next.js marketplace + dealer OS)
  │   └── admin/        (Next.js admin panel)
  ├── packages/
  │   ├── types/        (shared TypeScript types)
  │   ├── ui/           (shared component library)
  │   └── config/       (shared ESLint, TypeScript configs)
  ├── .github/
  │   └── workflows/
  │       ├── ci.yml           (PR checks)
  │       ├── staging.yml      (deploy to staging)
  │       └── production.yml   (deploy to production)
  └── turbo.json

BRANCH STRATEGY:
  main          → production deploys (protected branch, requires PR + review)
  staging       → staging deploys (protected, requires PR from feature branches)
  feature/*     → development branches (PRs to staging)
  hotfix/*      → emergency fixes (PR directly to main, also cherry-pick to staging)

PROTECTION RULES (GitHub branch protection):
  main:
    Require PR review: 1 approval (or 2 for schema migrations)
    Require CI checks pass
    No direct pushes (even admins)
    Linear history required
  staging:
    Require PR review: 0 approvals (any dev can merge feature branches)
    Require CI checks pass
```

### 5.2 CI Workflow (Every PR)

```yaml
# .github/workflows/ci.yml
name: CI — Pull Request Checks

on:
  pull_request:
    branches: [main, staging]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true  # cancel older runs on new push to same branch

jobs:
  # ─────────────────────────────────────────────────────────────────
  # JOB 1: Code Quality
  # ─────────────────────────────────────────────────────────────────
  quality:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check  # tsc --noEmit across all packages
      - run: npm run lint        # ESLint + Prettier check
      - run: npm run check:imports  # check no circular dependencies

  # ─────────────────────────────────────────────────────────────────
  # JOB 2: Unit Tests
  # ─────────────────────────────────────────────────────────────────
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - name: Run unit tests with coverage
        run: npm run test:unit -- --coverage --coverageReporters=json-summary
      - name: Check coverage thresholds
        run: |
          # Fail if any coverage metric drops below thresholds
          node scripts/check-coverage.js \
            --lines=80 \
            --functions=80 \
            --branches=70 \
            --statements=80
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/

  # ─────────────────────────────────────────────────────────────────
  # JOB 3: Integration Tests
  # ─────────────────────────────────────────────────────────────────
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    timeout-minutes: 20
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: autoverse_test
          POSTGRES_USER: autoverse
          POSTGRES_PASSWORD: testpassword
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
        ports: ["5432:5432"]
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s
        ports: ["6379:6379"]
      meilisearch:
        image: getmeili/meilisearch:v1.6
        env: { MEILI_MASTER_KEY: testkey }
        ports: ["7700:7700"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - name: Run Prisma migrations on test DB
        run: npm run db:migrate:test
        env:
          DATABASE_URL: postgresql://autoverse:testpassword@localhost:5432/autoverse_test
      - name: Seed test data
        run: npm run db:seed:test
        env:
          DATABASE_URL: postgresql://autoverse:testpassword@localhost:5432/autoverse_test
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://autoverse:testpassword@localhost:5432/autoverse_test
          REDIS_URL: redis://localhost:6379
          MEILISEARCH_HOST: http://localhost:7700
          MEILISEARCH_MASTER_KEY: testkey
          NODE_ENV: test
          JWT_PRIVATE_KEY: ${{ secrets.TEST_JWT_PRIVATE_KEY }}
          JWT_PUBLIC_KEY: ${{ secrets.TEST_JWT_PUBLIC_KEY }}
          ADMIN_JWT_SECRET: test_admin_secret_32chars_minimum

  # ─────────────────────────────────────────────────────────────────
  # JOB 4: Security Scan
  # ─────────────────────────────────────────────────────────────────
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high  # fail on high/critical vulnerabilities
      - uses: trufflesecurity/trufflehog-actions-scan@main
        with: { base: ${{ github.event.pull_request.base.sha }} }
        # Scans diff for accidentally committed secrets

  # ─────────────────────────────────────────────────────────────────
  # JOB 5: Schema Migration Safety Check
  # ─────────────────────────────────────────────────────────────────
  migration-check:
    name: Migration Safety Check
    runs-on: ubuntu-latest
    if: contains(github.event.pull_request.files, 'prisma/migrations')
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - name: Check migration is backwards-compatible
        run: node scripts/check-migration-safety.js
        # Fails if migration contains:
        # - DROP TABLE or DROP COLUMN (data loss)
        # - NOT NULL column without DEFAULT (breaks existing rows)
        # - Rename without backward alias (breaks queries)
        # - Foreign key without index (locks table)
      - name: Require 2 reviewers for schema changes
        uses: actions/github-script@v7
        with:
          script: |
            const reviews = await github.rest.pulls.listReviews({
              owner: context.repo.owner, repo: context.repo.repo,
              pull_number: context.issue.number
            });
            const approvals = reviews.data.filter(r => r.state === 'APPROVED').length;
            if (approvals < 2) {
              core.setFailed('Schema migrations require 2 reviewer approvals');
            }

  # ─────────────────────────────────────────────────────────────────
  # JOB 6: Preview Deployment (Staging + Vercel Preview)
  # ─────────────────────────────────────────────────────────────────
  preview-deploy:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: [quality, unit-tests, integration-tests, security]
    if: success()
    steps:
      - uses: actions/checkout@v4
      - name: Deploy API to staging preview
        run: |
          doctl apps create-deployment ${{ vars.DO_APP_ID_STAGING }} \
            --wait --no-interactive
        env:
          DIGITALOCEAN_ACCESS_TOKEN: ${{ secrets.DO_ACCESS_TOKEN }}
      - name: Get staging preview URL
        id: staging-url
        run: echo "url=https://staging.api.autoverse.com.bd" >> $GITHUB_OUTPUT
      - name: Comment PR with preview URLs
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🚀 Preview Deployment Ready
              | Service | URL |
              |---------|-----|
              | API | ${{ steps.staging-url.outputs.url }} |
              | Frontend | [Vercel Preview](${{ steps.vercel-url.outputs.url }}) |
              | Admin | [Admin Preview](${{ steps.admin-url.outputs.url }}) |`
            })
```

### 5.3 Staging Deploy Workflow

```yaml
# .github/workflows/staging.yml
name: Deploy to Staging

on:
  push:
    branches: [staging]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    environment:
      name: staging
      url: https://staging.autoverse.com.bd

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci

      # GATE 1: All tests must pass
      - name: Run full test suite
        run: npm run test:all
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}

      # GATE 2: Build all packages
      - name: Build
        run: npm run build

      # GATE 3: Run database migrations on staging (must succeed)
      - name: Run Prisma migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}

      # GATE 4: Deploy API workers
      - name: Build and push Docker image
        run: |
          docker build -t registry.digitalocean.com/autoverse/api:${{ github.sha }} .
          docker push registry.digitalocean.com/autoverse/api:${{ github.sha }}
        env:
          DOCKER_CONFIG: /tmp/docker-config

      - name: Deploy to DO App Platform (staging)
        run: |
          doctl apps create-deployment ${{ vars.DO_APP_ID_STAGING }} \
            --wait \
            --force-rebuild \
            --no-interactive
        env:
          DIGITALOCEAN_ACCESS_TOKEN: ${{ secrets.DO_ACCESS_TOKEN }}

      # GATE 5: Deploy frontend to Vercel
      - name: Deploy marketplace to Vercel (staging)
        run: vercel deploy --env staging --token ${{ secrets.VERCEL_TOKEN }}

      - name: Deploy admin panel to Vercel (staging)
        run: vercel deploy --env staging --token ${{ secrets.VERCEL_TOKEN }}
          working-directory: apps/admin

      # GATE 6: Smoke tests against staging
      - name: Run smoke tests
        run: npm run test:smoke -- --baseUrl=https://staging.api.autoverse.com.bd
        timeout-minutes: 5

      - name: Notify Slack — Staging Deploy Success
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Staging deployed: ${{ github.sha }} by ${{ github.actor }}",
              "channel": "#deploys"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 5.4 Production Deploy Workflow

```yaml
# .github/workflows/production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  # ─────────────────────────────────────────────────────────────────
  # GATE 0: Manual approval required for production
  # ─────────────────────────────────────────────────────────────────
  production-approval:
    runs-on: ubuntu-latest
    environment:
      name: production-approval   # GitHub Environment with required reviewers
      # In GitHub: Settings → Environments → production-approval
      # Required reviewers: [CEO, CTO] — must manually approve
    steps:
      - name: Approval gate
        run: echo "Production deploy approved"

  deploy-production:
    runs-on: ubuntu-latest
    needs: production-approval
    timeout-minutes: 45
    environment:
      name: production
      url: https://autoverse.com.bd

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci

      # GATE 1: Verify staging was deployed and tests passed
      - name: Verify staging smoke tests passed recently
        run: node scripts/verify-staging-health.js
        # Fails if staging health check not green in last 2 hours

      # GATE 2: Create database backup BEFORE migration
      - name: Backup production database
        run: |
          doctl databases db dump ${{ vars.PRODUCTION_DB_ID }} \
            --output autoverse_pre_deploy_${{ github.sha }}.dump
          # Upload backup to R2 for safe keeping
          aws s3 cp autoverse_pre_deploy_${{ github.sha }}.dump \
            s3://${{ vars.R2_BACKUP_BUCKET }}/pre-deploy/ \
            --endpoint-url https://${{ vars.R2_ACCOUNT_ID }}.r2.cloudflarestorage.com
        env:
          DIGITALOCEAN_ACCESS_TOKEN: ${{ secrets.DO_ACCESS_TOKEN }}
          AWS_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}

      # GATE 3: Run migrations (backwards-compatible only — see Section 6)
      - name: Run database migrations (production)
        run: |
          npx prisma migrate deploy
          # If migration fails: halt deploy, alert team
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}

      # GATE 4: Build and push versioned Docker image
      - name: Build Docker image
        run: |
          docker build \
            -t registry.digitalocean.com/autoverse/api:${{ github.sha }} \
            -t registry.digitalocean.com/autoverse/api:latest \
            --build-arg APP_VERSION=${{ github.sha }} \
            .
          docker push registry.digitalocean.com/autoverse/api:${{ github.sha }}
          docker push registry.digitalocean.com/autoverse/api:latest

      # GATE 5: Blue-Green deploy (see Section 6)
      - name: Deploy to DO App Platform (production)
        run: |
          doctl apps create-deployment ${{ vars.DO_APP_ID_PRODUCTION }} \
            --wait \
            --no-interactive
        env:
          DIGITALOCEAN_ACCESS_TOKEN: ${{ secrets.DO_ACCESS_TOKEN }}

      # GATE 6: Deploy frontends
      - name: Deploy marketplace (Vercel production)
        run: vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}

      - name: Deploy admin panel (Vercel production)
        run: vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}
        working-directory: apps/admin

      # GATE 7: Post-deploy smoke tests
      - name: Production smoke tests
        run: npm run test:smoke -- --baseUrl=https://api.autoverse.com.bd
        timeout-minutes: 5

      # GATE 8: Monitor error rate for 5 minutes
      - name: Monitor error rate post-deploy
        run: node scripts/monitor-error-rate.js --duration=300 --threshold=0.01
        # Fails if error rate > 1% in first 5 minutes after deploy
        # This triggers automatic rollback (see below)

      - name: Notify Slack — Production Deploy Success
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚀 Production deployed: ${{ github.sha }}. Monitor: https://autoverse.com.bd",
              "channel": "#deploys"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

      # ROLLBACK on any gate failure:
      - name: Rollback on failure
        if: failure()
        run: |
          echo "Deployment failed. Rolling back..."
          # DO App Platform: revert to previous deployment
          doctl apps create-deployment ${{ vars.DO_APP_ID_PRODUCTION }} \
            --deployment-id ${{ steps.previous-deployment.outputs.id }} \
            --wait
          # Vercel: automatic rollback via Vercel dashboard or CLI
          vercel rollback --prod --token ${{ secrets.VERCEL_TOKEN }}
          # Notify team
        env:
          DIGITALOCEAN_ACCESS_TOKEN: ${{ secrets.DO_ACCESS_TOKEN }}
```

---

## 6. Zero-Downtime Deployment Strategy with Migration Safety

### 6.1 Zero-Downtime on DO App Platform

```
DO APP PLATFORM ZERO-DOWNTIME BEHAVIOUR:
  When a new deployment is created:
  1. New instances spin up alongside old instances
  2. Health check runs on new instances (GET /health → 200)
  3. Once new instances are healthy, traffic shifts to new instances
  4. Old instances kept alive 30 seconds (drain in-flight requests)
  5. Old instances terminated

  REQUIREMENT: At least 2 instances per service (instance_count >= 2)
  With 1 instance: there IS downtime during deployment
  With 2+ instances: rolling update (1 new, 1 old, then swap)

WORKER ZERO-DOWNTIME:
  Workers don't receive HTTP traffic — they process BullMQ jobs
  Strategy for workers:
    1. New worker starts, connects to BullMQ
    2. Old worker: stop accepting new jobs (SIGTERM handling)
    3. Old worker: drain currently-processing jobs (up to 30 seconds)
    4. Old worker exits after drain complete

  NestJS graceful shutdown (in main.ts):
    app.enableShutdownHooks();
    // When SIGTERM received:
    // 1. NestJS emits OnApplicationShutdown lifecycle
    // 2. BullMQ workers: worker.close() — stops accepting new jobs
    // 3. Wait for in-flight jobs to complete (max 30s timeout)
    // 4. Disconnect Prisma, Redis
    // 5. Process exits
```

### 6.2 Database Migration Safety Rules

```
PRINCIPLE: All migrations must be backwards-compatible.
           Reason: During rolling deploy, OLD code runs against NEW schema for ~30 seconds.
           If schema is incompatible with old code: errors during deployment window.

SAFE MIGRATIONS (no deploy coordination needed):
  ✅ ADD new nullable column
     Old code: ignores new column (doesn't read it)
     New code: reads new column (null for old rows until populated)

  ✅ ADD new table
     Old code: never references new table
     New code: can write to and read from new table

  ✅ ADD new index
     No impact on running queries
     PostgreSQL: CREATE INDEX CONCURRENTLY (non-blocking)

  ✅ ADD new foreign key (with NOT VALID first)
     Step 1: ALTER TABLE ADD CONSTRAINT ... NOT VALID (doesn't validate existing rows)
     Step 2: ALTER TABLE VALIDATE CONSTRAINT (validates in background, non-blocking)

  ✅ WIDEN a column (e.g., VARCHAR(50) → VARCHAR(255))
     Old code: writes shorter values (still valid)
     New code: can write longer values

UNSAFE MIGRATIONS (require multi-step deployment):
  ❌ DROP COLUMN
     Old code tries to read/write dropped column → error
     Safe approach: 3-step process:
       Deploy 1: Stop writing to old column in new code
       Deploy 2: Drop column (old code no longer deployed)
       (Can combine if old code doesn't reference column)

  ❌ RENAME COLUMN
     Old code uses old name → error
     Safe approach:
       Step 1: Add new column (new name)
       Step 2: Copy data: UPDATE table SET new_col = old_col
       Step 3: Deploy new code using new column name
       Step 4: Drop old column (in later deploy)

  ❌ NOT NULL constraint on existing column without DEFAULT
     Existing rows fail the constraint
     Safe approach: Add DEFAULT value in the migration

  ❌ CHANGE column type (e.g., INTEGER → BIGINT)
     Old code may write wrong type
     Safe approach: add new column, migrate data, switch code, drop old column

MIGRATION PRE-FLIGHT CHECKLIST:
  # scripts/check-migration-safety.js
  Reads latest Prisma migration SQL file and checks for:
    - DROP TABLE or DROP COLUMN → FAIL
    - RENAME → FAIL (suggest safe rename process)
    - NOT NULL without DEFAULT → FAIL
    - Missing CONCURRENTLY on CREATE INDEX → WARN
    - Column type change → FAIL (unless from nullable to nullable widening)
  CI job: runs this script on every PR touching prisma/migrations/
```

### 6.3 Migration Execution Strategy

```bash
# deploy-migration.sh
# Runs before new code deployment

set -e  # exit on any error

echo "=== AutoVerse Database Migration ==="
echo "Target: $DATABASE_URL"
echo "Migration: $(ls prisma/migrations | tail -1)"

# Step 1: Verify connection
npx prisma db execute --stdin <<< "SELECT 1;"
echo "✅ Database connection verified"

# Step 2: Check migration is safe (automated check)
node scripts/check-migration-safety.js
echo "✅ Migration safety check passed"

# Step 3: Create a snapshot (manual backup done earlier in CI, this is extra)
echo "Creating pre-migration snapshot..."
# pg_dump is fast for point-in-time reference — not a full backup
pg_dump $DATABASE_URL \
  --schema-only \
  --file=schema_snapshot_$(date +%Y%m%d_%H%M%S).sql
echo "✅ Schema snapshot created"

# Step 4: Apply migration (Prisma handles transactions internally)
echo "Applying migration..."
npx prisma migrate deploy
echo "✅ Migration applied successfully"

# Step 5: Verify schema matches expected state
npx prisma validate
echo "✅ Schema validation passed"

echo "=== Migration complete. Proceeding with deployment. ==="
```

---

## 7. Automation Workers — Separate Dynos Per Channel

### 7.1 Worker Entry Points

```typescript
// apps/api/src/workers/main.worker.ts
async function bootstrapMainWorker() {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Register queues this worker processes
  const queues = [
    'sync-vehicle',
    'dealer-website-isr',
    'imv-recalculate',      // single-listing instant recalculation
    'lead-follow-up',
    'lead-contact-sla',
    'lead-score-update',
    'redis-cache-invalidation',
  ];

  logger.log(`Main worker started. Processing: ${queues.join(', ')}`);
  await app.init();
}

// apps/api/src/workers/automation.worker.ts
async function bootstrapAutomationWorker() {
  const app = await NestFactory.createApplicationContext(AutomationWorkerModule);

  const queues = [
    'automation-whatsapp',
    'automation-facebook',
    'automation-social',
    'automation-email',
    'automation-sms',
  ];

  logger.log(`Automation worker started. Processing: ${queues.join(', ')}`);
  await app.init();
}

// apps/api/src/workers/notification.worker.ts
async function bootstrapNotificationWorker() {
  const queues = ['notification-sms', 'notification-push'];
  // ...
}

// apps/api/src/workers/analytics.worker.ts
async function bootstrapAnalyticsWorker() {
  const queues = [
    'maestro-insights',
    'daily-summary',
    'aging-watchlist',
    'lead-score-decay',
    'imv-recalculate',    // nightly full recalculation (separate from instant)
    'subscription-expiry',
  ];
  // ...
}

// apps/api/src/workers/feed.worker.ts
async function bootstrapFeedWorker() {
  const queues = ['gmc-feed-sync', 'facebook-catalog-sync', 'subscription-billing'];
  // ...
}
```

### 7.2 Worker Isolation Benefits

```
WHY SEPARATE WORKER PROCESSES:

  FAILURE ISOLATION:
    If automation-worker crashes (WhatsApp API down, FB token expired):
      → Only automation queues are paused
      → main-api continues serving requests
      → Sync engine continues working
      → Dealers can still use DMS (no disruption)
    Without isolation: one crashed worker = degraded API for all features

  INDEPENDENT SCALING:
    During Eid: automation-worker needs 3× capacity (high message volume)
    → Scale automation-worker to 3 instances
    → Other workers unchanged
    Without isolation: must scale entire API (expensive, inefficient)

  INDEPENDENT DEPLOY:
    Automation logic change → only automation-worker restarted
    Critical bug in feed-worker → redeploy ONLY feed-worker
    Without isolation: any worker change requires full API restart

  RESOURCE OPTIMIZATION:
    analytics-worker: memory-heavy (Maestro computations) → larger instance
    notification-worker: I/O-bound (SMS/push API calls) → more concurrency
    Without isolation: largest worker determines instance size for all

WORKER HEALTH MONITORING:
  Each worker exposes: GET /worker-health (internal port, not public)
    Response: { status: 'ok', queues: { 'queue-name': { processing, waiting, failed } } }
  DO App Platform health check targets this endpoint
  If worker is processing but health returns unhealthy: restart triggered

WORKER GRACEFUL SHUTDOWN (BullMQ):
  On SIGTERM received:
    1. Stop picking up new jobs from all queues
    2. Allow currently-processing jobs to complete (max 30s timeout)
    3. Jobs still in-flight after 30s: returned to queue (not lost)
    4. BullMQ cleanup, Redis disconnect
    5. Process exits with code 0 (clean)
  On SIGKILL: jobs in-flight are re-queued automatically by BullMQ
    (BullMQ uses Redis lock TTL — if lock expires, job is requeued)
```

### 7.3 BullMQ Worker Configuration

```typescript
// Shared worker configuration for all worker types

import { Worker, WorkerOptions } from 'bullmq';

const WORKER_OPTIONS: WorkerOptions = {
  connection: {
    url: process.env.REDIS_URL,
    tls: { rejectUnauthorized: true },  // TLS for Upstash
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,            // Upstash compatibility
    lazyConnect: true,
  },
  concurrency: 10,                      // overridden per queue
  limiter: {
    max: 1000,                          // max jobs per duration
    duration: 60000,                    // per minute
  },
  lockDuration: 30000,                  // 30s lock (job timeout before requeue)
  stalledInterval: 60000,               // check for stalled jobs every 60s
  maxStalledCount: 3,                   // max stalled before job fails

  // Retry configuration
  settings: {
    backoffStrategy: (attemptsMade) => {
      // Exponential backoff: 5s, 30s, 5min, 20min
      return [5000, 30000, 300000, 1200000][Math.min(attemptsMade, 3)];
    },
  },
};

// Queue-specific overrides
const QUEUE_CONCURRENCY: Record<string, number> = {
  'sync-vehicle':         10,
  'automation-whatsapp':  5,   // conservative: Meta API rate limits
  'automation-facebook':  5,
  'automation-social':    3,
  'automation-email':     10,
  'automation-sms':       10,
  'notification-sms':     20,  // Greenweb can handle high concurrency
  'notification-push':    20,  // FCM: high concurrency fine
  'maestro-insights':     5,
  'lead-score-update':    15,
  'imv-recalculate':      20,
};
```

---

## 8. Monitoring — Sentry, PostHog, Uptime & BullMQ Dashboard

### 8.1 Monitoring Stack Overview

```
MONITORING STACK:
  Error tracking:    Sentry (sentry.io)
  Product analytics: PostHog (posthog.com) — dealer behavior, feature adoption
  Performance:       Sentry Performance (API p95/p99 per endpoint)
  Infrastructure:    DigitalOcean Monitoring (CPU, memory, disk per dyno)
  Uptime (external): BetterUptime (betteruptime.com)
  Queue monitoring:  Bull Board (self-hosted on DO, internal access only)
  Logs:              Papertrail (log aggregation, search, alerting)
  Database:          DO Managed DB insights (query performance, slow queries)

ALERT ROUTING:
  CRITICAL alerts: Slack #alerts-critical + SMS to on-call engineer
  HIGH alerts:     Slack #alerts-high
  MEDIUM alerts:   Slack #alerts-medium
  LOW alerts:      Dashboard only (no push notification)
```

### 8.2 Sentry Configuration

```typescript
// apps/api/src/main.ts
Sentry.init({
  dsn:         process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release:     process.env.APP_VERSION,   // git SHA injected at build time

  // Performance monitoring
  tracesSampleRate:   0.1,     // 10% of transactions traced
  profilesSampleRate: 0.1,

  // Filter out noisy non-errors
  ignoreErrors: [
    'UnauthorizedException',   // 401s — expected behavior
    'ForbiddenException',      // 403s — expected
    'NotFoundException',       // 404s — expected
    /Rate limit exceeded/,     // normal rate limiting
  ],

  beforeSend(event, hint) {
    // Strip sensitive data before sending to Sentry
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    if (event.request?.data) {
      // Strip password, token fields from request body
      const sensitive = ['password', 'access_token', 'refresh_token', 'otp_code'];
      sensitive.forEach(field => {
        if (event.request.data[field]) event.request.data[field] = '[Filtered]';
      });
    }
    return event;
  },

  integrations: [
    Sentry.prismaIntegration(),         // tracks Prisma query performance
    Sentry.httpIntegration({ breadcrumbs: true }),
  ],
});

// Custom Sentry alerts (via Sentry Alert Rules):
// 1. Error rate > 1% for 5 minutes → Slack + SMS
// 2. p95 latency > 2× baseline for any endpoint → Slack
// 3. New issue (first occurrence) → Slack
// 4. Issue regression (resolved then re-opens) → Slack + SMS
```

### 8.3 BullMQ Dashboard (Bull Board)

```typescript
// apps/api/src/bull-board.ts
// Internal admin tool — not publicly accessible

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(syncVehicleQueue),
    new BullMQAdapter(automationWhatsappQueue),
    new BullMQAdapter(automationFacebookQueue),
    new BullMQAdapter(automationSocialQueue),
    new BullMQAdapter(automationEmailQueue),
    new BullMQAdapter(automationSmsQueue),
    new BullMQAdapter(maestroInsightsQueue),
    new BullMQAdapter(dailySummaryQueue),
    new BullMQAdapter(notificationSmsQueue),
    new BullMQAdapter(notificationPushQueue),
    new BullMQAdapter(imvRecalculateQueue),
    new BullMQAdapter(leadFollowUpQueue),
    new BullMQAdapter(subscriptionBillingQueue),
    // ... all queues
  ],
  serverAdapter,
});

// Mount on internal-only port (not 3000)
const bullBoardApp = express();
bullBoardApp.use('/admin/queues', serverAdapter.getRouter());
bullBoardApp.listen(3001, '127.0.0.1');  // ONLY localhost (not 0.0.0.0)

// SECURITY: Bull Board accessible only via:
//   1. SSH tunnel: ssh -L 3001:localhost:3001 admin@api-server
//   2. Or via admin panel API proxy (auth-gated endpoint)
//      GET /api/v1/admin/system/queues → proxies to Bull Board

// Dashboard shows per queue:
//   Active jobs (currently processing)
//   Waiting jobs (queued but not yet picked up)
//   Completed jobs (last 1,000)
//   Failed jobs (with error details, stack traces)
//   Delayed jobs (scheduled for future)
//   DLQ jobs (dead letter queue)
// Actions: Retry failed, Drain queue, Pause/Resume queue
```

### 8.4 Uptime Monitoring (BetterUptime)

```
MONITORS CONFIGURED:

  EXTERNAL ENDPOINTS (public-facing):
    https://autoverse.com.bd → Check every 1 minute
      Keyword check: "Toyota" (confirms search results loading)
      Alert on: HTTP ≠ 200 OR keyword missing for 2 consecutive checks

    https://api.autoverse.com.bd/health → Check every 1 minute
      Response check: JSON { status: "ok" }
      Alert on: non-200 for 2 consecutive checks

    https://autoverse.com.bd/cars/toyota/axio/dhaka → Check every 5 minutes
      (Programmatic SEO page — confirms ISR working)

  INTERNAL ENDPOINTS (via BetterUptime's agents or Cloudflare health checks):
    BullMQ queue health: custom metric check
    Database connection: via /health/ready endpoint

  STATUS PAGE:
    Create public status page: status.autoverse.com.bd
    Shows: API status | Marketplace status | Payment gateway status
    Auto-updates from BetterUptime monitors
    Dealers can subscribe to email/SMS alerts

ALERT CHANNELS:
  Primary: Slack #alerts-critical
  Secondary: PagerDuty (on-call rotation, Phase 2)
  Tertiary: SMS to CTO mobile

INCIDENT ESCALATION:
  Down for < 5 minutes: Slack alert only
  Down for 5–15 minutes: Slack + SMS to CTO
  Down for > 15 minutes: Slack + SMS + Phone call
  Payment gateway down: immediate SMS + Slack (revenue impact)
```

### 8.5 Custom Metrics Dashboard

```typescript
// Custom metrics collected and displayed in admin panel health dashboard

interface SystemMetrics {
  // API Performance (last 1 hour)
  api: {
    requests_per_minute:     number;
    p50_response_ms:         number;
    p95_response_ms:         number;
    p99_response_ms:         number;
    error_rate_pct:          number;
    active_connections:      number;
  };

  // BullMQ Queue Health
  queues: Record<string, {
    waiting:    number;
    active:     number;
    completed:  number;
    failed:     number;
    dlq:        number;
    rate_per_min: number;   // jobs processed per minute
  }>;

  // Sync Engine
  sync: {
    avg_sync_time_ms:        number;  // p50
    p95_sync_time_ms:        number;
    within_sla_pct:          number;  // % syncs completing < 2000ms
    pending_syncs:           number;
    failed_last_24h:         number;
  };

  // Database
  database: {
    connection_pool_used:    number;
    connection_pool_max:     number;
    slow_queries_last_hour:  number;  // queries > 100ms
    replication_lag_ms:      number;  // 0 if no replica
  };

  // Redis
  redis: {
    memory_used_mb:          number;
    hit_rate_pct:            number;
    connections:             number;
    operations_per_sec:      number;
  };

  // Storage
  storage: {
    r2_used_gb:              number;
    r2_cost_month_usd:       number;
  };
}

// Metrics collected via:
// - PostgreSQL pg_stat_statements (query performance)
// - Redis INFO command (memory, hit rate)
// - BullMQ getJobCounts() per queue
// - Custom timing middleware (API response times)
// - DO Managed DB metrics API (connection pool)
// All aggregated and served from: GET /api/v1/admin/system/metrics
```

---

## 9. Backup & Point-in-Time Recovery

### 9.1 Backup Strategy

```
BACKUP TIERS:

TIER 1 — DigitalOcean Managed PostgreSQL Built-in Backups
  Frequency:  Daily (DO performs automatically)
  Retention:  7 days (Basic plan) / 14 days (Pro plan) / 30 days (Larger plans)
  Type:       Full daily + continuous WAL archiving (point-in-time)
  Recovery:   DO Dashboard → Restore → Pick point in time (1-minute granularity)
  RTO (Recovery Time Objective): 30–60 minutes
  RPO (Recovery Point Objective): 1 minute (WAL archiving)
  Cost:       Included in managed DB price

TIER 2 — Pre-Deploy Snapshots (CI/CD triggered)
  Frequency:  Before every production deployment
  Storage:    Cloudflare R2 (backups/ bucket, separate from media)
  Retention:  Last 10 deployments kept
  Type:       pg_dump (schema + data)
  Recovery:   Manual restore from R2 dump file
  Purpose:    Fast rollback if deployment causes data corruption
  Script:     See deploy workflow Section 5.4

TIER 3 — Weekly Off-Site Export
  Frequency:  Every Sunday at 3:00 AM
  Trigger:    BullMQ cron job
  Export:     pg_dump → gzip → upload to R2 /weekly-backups/
  Retention:  52 weeks (1 year of weekly backups)
  Type:       Full dump (schema + data)
  Encryption: AES-256 encrypted before upload
  Purpose:    Regulatory compliance (financial records 7 years), disaster recovery
```

### 9.2 Point-in-Time Recovery Procedure

```bash
#!/bin/bash
# recover-database.sh
# Usage: ./recover-database.sh "2025-01-15 14:30:00" target_db_url

RECOVERY_TIMESTAMP="$1"
TARGET_DB_URL="$2"

if [ -z "$RECOVERY_TIMESTAMP" ] || [ -z "$TARGET_DB_URL" ]; then
  echo "Usage: ./recover-database.sh '<timestamp>' '<db_url>'"
  exit 1
fi

echo "=== AutoVerse Database Point-in-Time Recovery ==="
echo "Recovering to: $RECOVERY_TIMESTAMP"
echo "Target: $TARGET_DB_URL"

# Step 1: Create new database from backup
echo "Step 1: Creating recovery database from DO backup..."
doctl databases db restore $DO_DB_ID \
  --backup-created-at "$RECOVERY_TIMESTAMP" \
  --name autoverse-recovery-$(date +%Y%m%d_%H%M%S) \
  --wait
RECOVERY_DB_URL=$(get_new_db_url)

echo "Step 2: Verifying data integrity..."
psql $RECOVERY_DB_URL -c "
  SELECT
    (SELECT COUNT(*) FROM vehicle) as vehicles,
    (SELECT COUNT(*) FROM lead) as leads,
    (SELECT COUNT(*) FROM deal WHERE status = 'delivered') as completed_deals,
    (SELECT COUNT(*) FROM marketplace_listing WHERE status = 'active') as active_listings;
"

echo "Step 3: Manual verification required"
echo "Connect to recovery DB: $RECOVERY_DB_URL"
echo "Verify data looks correct for timestamp: $RECOVERY_TIMESTAMP"
echo ""
echo "When ready to switch production to recovery DB:"
echo "  1. Enable maintenance mode in admin panel"
echo "  2. Update DATABASE_URL in DO App Platform secrets"
echo "  3. Redeploy all services"
echo "  4. Disable maintenance mode"
echo "  5. Notify dealers if data gap exists"
```

### 9.3 Data Retention Policy

```
RETENTION SCHEDULE (all data in PostgreSQL):

  OPERATIONAL DATA:
    vehicle records:           Indefinite (soft-deleted records retained 7 years)
    deal records:              7 years (financial compliance)
    invoice records:           7 years
    payment_transaction:       7 years
    platform_audit_log:        7 years (admin actions)
    entity_change_log:         3 years
    lead records:              3 years after last interaction
    customer records:          3 years after last interaction
    automation_log:            90 days (rolling delete)
    sms_log:                   90 days
    notification:              30 days
    sync_audit_log:            30 days
    imv_calculation_run:       1 year

  AUTOMATED CLEANUP:
    BullMQ cron (monthly, 3:00 AM on 1st):
      DELETE FROM automation_log WHERE created_at < NOW() - INTERVAL '90 days'
      DELETE FROM sms_log WHERE created_at < NOW() - INTERVAL '90 days'
      DELETE FROM notification WHERE created_at < NOW() - INTERVAL '30 days'
      DELETE FROM sync_audit_log WHERE created_at < NOW() - INTERVAL '30 days'

  GDPR-EQUIVALENT (BD):
    User data deletion request (buyer requests account deletion):
      1. Anonymize: UPDATE user SET full_name='[Deleted]', phone=uuid, email=null
      2. Retain: transaction history (financial compliance)
      3. Remove: personal preferences, saved searches, FCM tokens
      Timeline: process within 7 days of request
```

---

## 10. Scaling Runbook — When and How to Scale

### 10.1 Scaling Triggers and Actions

```
TRIGGER: API response time p95 > 500ms (current target: 200ms)
  INVESTIGATION:
    1. Check Sentry: which endpoint is slow?
    2. Check PostgreSQL slow queries (pg_stat_statements)
    3. Check BullMQ: is queue backlog growing?
  ACTIONS:
    If DB slow queries: add missing index, optimize query
    If connection pool exhausted: increase PgBouncer pool size
    If queue backlog: scale affected worker dyno instance_count += 1
    If API CPU bound: scale main-api instance_count += 1

TRIGGER: Database connection pool > 80% utilized
  ACTION: Increase PgBouncer pool size in connection string
    DATABASE_URL → ?connection_limit=25 (default 10)
  NEXT STEP (at sustained 90%): Upgrade to DO Pro DB plan (more connections)

TRIGGER: BullMQ sync-vehicle queue depth > 500 jobs
  CURRENT CAPACITY: 10 concurrent workers, ~200 jobs/min
  ACTION: Scale main-worker instance_count from 1 → 2
  COST: +$12/month
  MONITORING: Check if depth reduces to < 100 within 10 minutes

TRIGGER: Redis memory > 80% utilization
  CURRENT: Upstash pay-per-request (no memory limit with pay-per-request plan)
  ACTION: None required (Upstash auto-scales)
  If using fixed memory plan: upgrade tier or enable key eviction alerts

TRIGGER: MeiliSearch index size > 80% of RAM
  SYMPTOMS: Search responses > 100ms, OOM errors
  CURRENT DROPLET: 1GB RAM (supports ~300K indexed documents)
  200K dealers × 5 cars = too large for 1GB
  ACTION: Resize Droplet to 2CPU/4GB RAM (supports ~5M documents)
  COMMAND: doctl compute droplet-action resize {id} --size s-2vcpu-4gb

100 DEALERS → action needed:
  Scale main-api: 1 instance → 2 instances (+$12/mo)
  Total additional cost: ~$12/mo

200 DEALERS → action needed:
  Upgrade PostgreSQL to Pro plan (2CPU/4GB) (+$35/mo)
  Add read replica for analytics queries (+$25/mo)
  Scale main-api: 2 instances → 3 instances (+$12/mo)
  Total additional cost: ~$72/mo

500 DEALERS → action needed:
  Upgrade MeiliSearch Droplet: 1GB → 4GB (+$18/mo)
  Scale automation-worker: 1 → 2 instances (+$12/mo)
  Consider Redis Cluster (if single Redis hits limits)
  Total additional cost: ~$30/mo

1,000 DEALERS → architecture review:
  Migrate MeiliSearch → Elasticsearch (more scalable, better geo-search)
  Add dedicated analytics DB (separate read replica for Maestro queries)
  Consider extracting SyncModule and AutomationModule to separate services
  Budget: ~$200-400/mo increase (see Section 1.2 cost table)
```

### 10.2 Emergency Response Runbook

```
SCENARIO: Production database unreachable (complete outage)

  IMMEDIATE (< 5 minutes):
    1. Enable maintenance mode in Cloudflare:
       cloudflare page rule: autoverse.com.bd/* → Serve maintenance page
    2. Enable dealer maintenance banner in Redis (resilient to DB outage):
       redis-cli SET maintenance_mode "1" EX 3600
    3. Post status update to status.autoverse.com.bd

  INVESTIGATION (5–15 minutes):
    1. Check DO Dashboard: database cluster status
    2. Check DO Status: https://status.digitalocean.com
    3. Test connection: psql $DATABASE_URL -c "SELECT 1;"
    4. Review Sentry for last errors before outage

  RECOVERY:
    A. Transient DO issue (resolved itself):
       1. API services will reconnect automatically (PgBouncer retries)
       2. Disable maintenance mode
       3. Monitor for 5 minutes: no errors → normal operation

    B. Database corruption (needs restore):
       1. Follow point-in-time recovery procedure (Section 9.2)
       2. Switch DATABASE_URL to recovery DB
       3. Test core flows: login, search, dealer inventory
       4. Disable maintenance mode
       5. Notify dealers of data gap (if any)

    C. DO regional outage:
       1. Do App Platform will auto-failover (if HA enabled)
       2. If prolonged: escalate with DO support
       3. Consider temporary failover to alternative region

POST-INCIDENT:
  1. Write incident report (timeline, root cause, impact, prevention)
  2. Share with team (no blame, systems focus)
  3. Create GitHub issue for prevention measures
  4. Update runbook with lessons learned
```

### 10.3 Feature Flag Rollout Procedure

```
NEW FEATURE ROLLOUT (using feature flags from Section 2.6 of Step 4):

STAGE 1: Internal testing (5% rollout)
  Toggle feature flag: enabled_for_dealers = [internal_test_dealer_ids]
  Test with AutoVerse's own dealer account
  Monitor: Sentry errors, API performance, BullMQ queue depths
  Duration: 2–5 days

STAGE 2: Beta dealers (20% rollout)
  enabled_for_dealers += [5–10 volunteer beta dealers from Dholaikhal]
  Collect feedback via: WhatsApp group for beta dealers
  Monitor: same as Stage 1 + user behavior via PostHog
  Duration: 5–7 days

STAGE 3: Plan-tier rollout (staged by plan)
  enabled_for_plans = ['business', 'enterprise']   (most paying, most engaged)
  Monitor: 48 hours
  enabled_for_plans += ['professional']
  Monitor: 48 hours
  enabled_for_plans += ['starter']
  Duration: ~1 week

STAGE 4: Full rollout
  enabled_global = true
  Remove plan/dealer-specific flags (simplify config)

ROLLBACK AT ANY STAGE:
  Toggle feature flag → enabled_global = false
  All users see old behavior immediately (no deploy needed)
  This is the primary safety valve for new features

FLAG NAMING CONVENTION:
  new-maestro-pricing-v2       → lowercase-hyphenated
  enable-fb-catalog-sync       → feature capability flags
  experimental-bangla-search   → experimental features (always easy to disable)
  show-listing-price-history   → UI features
```

---

*AutoVerse — Step 9: DevOps & Deployment*
*Infrastructure Map · Cloudflare Worker · Admin Deployment · CI/CD · Zero-Downtime · Workers · Monitoring · Backup*
*Built against Blueprint v7.0*
