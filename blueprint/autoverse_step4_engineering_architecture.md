# AutoVerse — Step 4: Engineering Architecture
### NestJS Modules · Service Boundaries · Redis · BullMQ · WebSocket · RBAC · v1.0

> Complete engineering specification: every NestJS module with its full responsibility surface, service boundary decisions with extraction triggers, Redis caching strategy per data type with TTLs and invalidation rules, all BullMQ queues with retry config and dead-letter handling, the internal event bus contract, and the full JWT RS256 + RBAC guard system.

---

## Table of Contents

1. [NestJS Module Architecture — Full Map](#1-nestjs-module-architecture--full-map)
2. [Module Specifications — Responsibilities & Dependencies](#2-module-specifications--responsibilities--dependencies)
3. [Service Boundaries & Microservice Extraction Triggers](#3-service-boundaries--microservice-extraction-triggers)
4. [REST API Design — Guards, Interceptors & Pipes](#4-rest-api-design--guards-interceptors--pipes)
5. [WebSocket Architecture (Socket.io)](#5-websocket-architecture-socketio)
6. [Redis — Caching Strategy Per Data Type](#6-redis--caching-strategy-per-data-type)
7. [BullMQ — All Queues with Full Configuration](#7-bullmq--all-queues-with-full-configuration)
8. [Internal Event Bus — Naming Convention & Payload Schemas](#8-internal-event-bus--naming-convention--payload-schemas)
9. [RBAC — JWT RS256 Claims, Guard Logic & Permission Matrix](#9-rbac--jwt-rs256-claims-guard-logic--permission-matrix)
10. [Error Handling Architecture](#10-error-handling-architecture)
11. [Observability — Logging, Tracing & Metrics](#11-observability--logging-tracing--metrics)

---

## 1. NestJS Module Architecture — Full Map

### Module Dependency Graph

```
AppModule (root)
│
├── INFRASTRUCTURE MODULES (no business logic)
│   ├── DatabaseModule          (Prisma client, connection pool, RLS context)
│   ├── RedisModule             (Upstash Redis client, pub/sub)
│   ├── BullModule              (BullMQ queue registration)
│   ├── EventEmitterModule      (internal sync event bus)
│   ├── ConfigModule            (env vars, validation)
│   └── HealthModule            (health check endpoints)
│
├── AUTH & IDENTITY MODULES
│   ├── AuthModule              (JWT RS256, OTP, login, refresh)
│   └── UsersModule             (user CRUD, profile)
│
├── CORE DEALER OS MODULES (tenant-scoped)
│   ├── DealershipsModule       (dealer profile, config, team)
│   ├── InventoryModule         (vehicle CRUD, VIN decode, photos, status)
│   ├── ReconModule             (recon assessment, tasks, completion)
│   ├── CrmModule               (leads, pipeline, interactions, customers)
│   ├── SalesModule             (deals, approvals, Bill of Sale, payments)
│   ├── ExpensesModule          (vehicle_expense + operational_expense)
│   └── FinanceModule           (EMI calculator, loan tracking)
│
├── INTELLIGENCE MODULES
│   ├── MaestroModule           (AI insights, daily summaries)
│   ├── AnalyticsModule         (dashboards, reports, exports)
│   └── ImvModule               (IMV algorithm, cluster data, deal rating)
│
├── AUTOMATION MODULE (composite)
│   ├── AutomationModule
│   │   ├── WhatsAppService     (templates, API adapter connections)
│   │   ├── FacebookService     (Meta Graph API, Lead Ads, inbox)
│   │   ├── SocialService       (post scheduling, publishing, analytics)
│   │   ├── MarketingService    (email sequences, SMS campaigns, lead scoring)
│   │   └── AutomationRuleEngine (rule evaluation, sequence execution)
│   └── AutomationLogsModule    (log storage, analytics)
│
├── PLATFORM MODULES
│   ├── MarketplaceModule       (public search, listing pages, C2C wizard)
│   ├── WebsiteModule           (microsite provisioning, domain routing)
│   ├── SyncModule              (sync engine, event dispatch, fan-out)
│   ├── FeedsModule             (GMC feed, Facebook catalog)
│   └── PaymentsModule          (bKash, Nagad, SSLCommerz, billing)
│
├── COMMUNICATION MODULES
│   ├── NotificationsModule     (SMS, email, push, in-app)
│   └── FilesModule             (R2 upload, Sharp processing, URL generation)
│
├── ADMIN MODULE (IP-restricted, separate JWT signing key)
│   └── AdminModule
│       ├── DealerAdminService
│       ├── ModerationService
│       ├── PaymentAdminService
│       ├── SystemAdminService
│       └── AuditService
│
└── CROSS-CUTTING MODULES
    └── AuditModule             (entity_change_log, platform_audit_log writers)
```

---

## 2. Module Specifications — Responsibilities & Dependencies

### 2.1 DatabaseModule

```typescript
// prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private config: ConfigService) {
    super({
      datasources: {
        db: { url: config.get('DATABASE_URL') }
      },
      log: ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();

    // Soft-delete middleware: automatically filter deleted_at IS NULL
    this.$use(async (params, next) => {
      const softDeleteModels = [
        'Vehicle', 'Lead', 'Customer', 'Deal', 'User', 'Dealership'
      ];

      if (softDeleteModels.includes(params.model)) {
        if (params.action === 'findMany' || params.action === 'findFirst') {
          params.args.where = {
            ...params.args.where,
            deleted_at: null,
          };
        }
        if (params.action === 'delete') {
          params.action = 'update';
          params.args.data = { deleted_at: new Date() };
        }
        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          params.args.data = { deleted_at: new Date() };
        }
      }
      return next(params);
    });
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}

// RLS context injection (called by DealerContextGuard before every tenant query)
async setDealerContext(dealerId: string): Promise<void> {
  await this.$executeRaw`
    SELECT set_config('app.current_dealer_id', ${dealerId}, true)
  `;
}
```

**Responsibilities:**
- Prisma client singleton with connection pooling (PgBouncer via DATABASE_URL)
- Soft delete middleware (transparent to all callers)
- RLS context injection via `setDealerContext()`
- Query logging (warn/error only in production; verbose in development)

**Does NOT do:**
- Business logic
- Caching (Redis handles that)
- Transaction coordination across modules (each module manages its own transactions)

---

### 2.2 AuthModule

```typescript
// Exports: JwtStrategy, JwtAdminStrategy, LocalStrategy, OtpStrategy
// Guards: JwtAuthGuard, JwtAdminGuard, OtpGuard
// Services: AuthService, TokenService, OtpService

RESPONSIBILITIES:
  AuthService:
    - register(dto): create user, send OTP
    - loginWithOtp(phone, code): verify OTP → issue JWT pair
    - loginWithPassword(phone, password): verify bcrypt → issue JWT pair
    - refreshToken(refreshToken): rotate refresh token → new access token
    - logout(userId, refreshToken): revoke refresh token in Redis + DB
    - revokeAllSessions(userId): revoke all refresh tokens (security event)

  TokenService:
    - issueAccessToken(payload): sign JWT with RS256 private key (dealer)
    - issueAdminAccessToken(payload): sign JWT with ADMIN_JWT_SECRET
    - issueRefreshToken(userId): generate opaque token, hash, store in DB
    - verifyAccessToken(token): verify with RS256 public key
    - verifyAdminToken(token): verify with admin signing key

  OtpService:
    - generateOtp(phone, purpose): 6-digit, store in Redis TTL 5min
    - verifyOtp(phone, code, purpose): check code, mark used
    - rateLimit: max 3 OTP requests per phone per 10 minutes (Redis counter)

SECURITY DETAILS:
  Access token TTL:   900 seconds (15 minutes)
  Refresh token TTL:  2592000 seconds (30 days)
  Refresh storage:    httpOnly cookie (web) + Redis session store
  Redis key format:   refresh:{user_id}:{token_hash}
  OTP Redis key:      otp:{phone}:{purpose}
  OTP rate limit key: otp_rate:{phone}  (TTL: 600s, max: 3)
  Admin sessions:     30-minute idle timeout enforced via Redis TTL on admin session key
```

---

### 2.3 InventoryModule

```typescript
SERVICES:
  VehicleService:
    - create(dealerId, dto): create vehicle, emit vehicle.created event
    - findAll(dealerId, filters, pagination): list with MeiliSearch or DB
    - findOne(dealerId, vehicleId): full stock card data
    - update(dealerId, vehicleId, dto): update vehicle, emit vehicle.updated
    - softDelete(dealerId, vehicleId): soft delete, emit vehicle.deleted
    - updateStatus(dealerId, vehicleId, newStatus, reason): state machine validation,
        log to vehicle_status_history, emit vehicle.status_changed
    - toggleMarketplacePublish(dealerId, vehicleId, published): emit visibility_toggle
    - getAgingWatchlist(dealerId): vehicles by days_on_lot tier
    - getAgingStats(dealerId): aggregate aging metrics

  VinScanService:
    - decode(vin): NHTSA API + local BD supplement, with Redis cache TTL 90 days
    - validate(vin): format + check digit
    - checkDuplicate(dealerId, vin): check existing vehicle with same VIN

  PhotoService:
    - upload(dealerId, vehicleId, files): Sharp compress → R2 upload
    - reorder(dealerId, vehicleId, sortOrders): update photos JSONB
    - delete(dealerId, vehicleId, photoIndex): remove from JSONB + R2
    - setPrimary(dealerId, vehicleId, photoIndex): update is_primary flag

  StockNoService:
    - generate(dealerId): SK-YYYYMM-XXXX with atomic counter (Redis INCR)
    -- Key: stock_no_seq:{dealerId}:{YYYYMM}  TTL: until end of month

EMITTED EVENTS (internal EventEmitter):
  vehicle.created      → SyncModule listens
  vehicle.updated      → SyncModule listens (if price or photos changed)
  vehicle.status_changed → SyncModule listens
  vehicle.deleted      → SyncModule listens
  vehicle.visibility_toggled → SyncModule listens
  vehicle.photos_updated → SyncModule listens
  vehicle.recon_complete → SyncModule listens (emitted by ReconModule)

INJECTED DEPENDENCIES:
  DatabaseModule, RedisModule, FilesModule, EventEmitter2, BullModule
```

---

### 2.4 ReconModule

```typescript
SERVICES:
  ReconService:
    - createAssessment(dealerId, vehicleId, dto): create recon_assessment,
        transition vehicle to in_recon
    - updateAssessment(dealerId, assessmentId, dto): update checklist items
    - createTask(dealerId, assessmentId, dto): create recon_task
    - updateTask(dealerId, taskId, dto): update task status/cost
    - completeTask(dealerId, taskId, actualCost): mark complete,
        auto-create vehicle_expense record,
        check if ALL tasks complete → if yes, emit recon.all_tasks_complete
    - getAssessment(dealerId, vehicleId): full assessment with tasks

  ReconCompletionChecker:  (called after every task completion)
    - checkAllComplete(dealerId, vehicleId):
        SELECT COUNT(*) FROM recon_task WHERE vehicle_id = $1 AND status != 'complete'
        IF count = 0:
          → emit vehicle.recon_complete
          → notify manager/owner: "Recon complete on [stock_no]"
          → trigger Maestro pricing suggestion generation

EMITTED EVENTS:
  recon.all_tasks_complete → InventoryModule (status transition)
  recon.task_completed     → ExpensesModule (auto-create vehicle_expense)
```

---

### 2.5 CrmModule

```typescript
SERVICES:
  LeadService:
    - create(dealerId, dto): create lead, run dedup check, assign salesperson,
        start 2h SLA timer (BullMQ), emit lead.created
    - findAll(dealerId, userId, role, filters): role-filtered list
    - findOne(dealerId, leadId, userId, role): role-filtered single lead
    - updateStage(dealerId, leadId, newStage, data): state machine,
        validate lost_reason if stage=lost, emit lead.stage_changed
    - updateScore(dealerId, leadId, scoreDelta): atomic score update via Redis
    - assign(dealerId, leadId, assigneeId): reassign, notify new assignee
    - logInteraction(dealerId, leadId, dto): create lead_interaction record
    - scheduleFollowUp(dealerId, leadId, datetime, method): update next_follow_up,
        cancel existing BullMQ job, schedule new one
    - merge(dealerId, primaryId, duplicateId): merge duplicate leads

  CustomerService:
    - findOrCreate(dealerId, phone, name): upsert customer record
    - findAll(dealerId, filters): customer list with purchase history
    - findOne(dealerId, customerId): full profile + history
    - updatePreferences(dealerId, customerId, dto): update opt-in flags,
        preferred makes, budget range

  LeadScoringService:
    - computeScore(leadId, signalType): apply scoring weights, update score
    - decayScores(dealerId): daily cron — subtract 2 per day per lead
    - checkHotThreshold(leadId, score): if score >= 70 → emit lead.hot
    - Signal weights:
        enquiry_submitted:       +30
        phone_revealed:          +20
        whatsapp_message_sent:   +15
        vehicle_viewed_3x:       +15
        multiple_models_viewed:  +10
        returned_next_day:       +10
        vehicle_saved:           +10
        budget_matches:          +10
        no_response_3_followups: -20
        decay_per_day:           -2

  LeadAssignmentService:
    - assignRoundRobin(dealerId, leadId): cycle through active salespeople
    - assignByLocation(dealerId, leadId, locationId): assign to location's staff
    - reassignOnStaffDeactivation(dealerId, deactivatedUserId): bulk reassign

EMITTED EVENTS:
  lead.created           → AutomationModule (Day 0 WhatsApp), NotificationsModule
  lead.stage_changed     → SyncModule (if reserved vehicle changes)
  lead.hot               → NotificationsModule (immediate SMS to salesperson)
  lead.uncontacted_2h    → NotificationsModule (manager alert)
  lead.follow_up_due     → NotificationsModule (salesperson reminder)
  lead.stale_7d          → AutomationModule (abandoned lead recovery)
```

---

### 2.6 SalesModule

```typescript
SERVICES:
  DealService:
    - create(dealerId, leadId, vehicleId, dto): create deal in draft,
        reserve vehicle (status → reserved), emit deal.created
    - requestApproval(dealerId, dealId): check discount threshold,
        if above threshold → status pending_approval, notify manager
        if within threshold → auto-approve, status → approved
    - approve(dealerId, dealId, managerId): status → approved, emit deal.approved
    - reject(dealerId, dealId, managerId, reason): back to draft, notify salesperson
    - deliver(dealerId, dealId): status → delivered,
        vehicle status → sold, emit deal.delivered
    - cancel(dealerId, dealId, reason): void deal, vehicle → available,
        emit deal.cancelled
    - recordPayment(dealerId, dealId, dto): create deal_payment record,
        update balance_due

  BillOfSaleService:
    - generate(dealId): Puppeteer → PDF → R2
    - getUrl(dealId): return signed R2 URL

  DealApprovalService:
    - checkDiscountThreshold(dealId): compare discount vs dealership.discount_threshold_pct
    - getPendingApprovals(dealerId, managerId): list deals pending approval
    - notifyManagerForApproval(dealId): push + SMS to manager

EMITTED EVENTS:
  deal.created     → InventoryModule (vehicle → reserved)
  deal.approved    → NotificationsModule
  deal.delivered   → InventoryModule (vehicle → sold),
                     AutomationModule (post-sale sequence),
                     SyncModule (listing → sold),
                     AnalyticsModule (revenue update)
  deal.cancelled   → InventoryModule (vehicle → available),
                     SyncModule (listing → active)
```

---

### 2.7 SyncModule

```typescript
SERVICES:
  SyncService: (the core sync engine)
    - onVehicleCreated(event): build sync job payload, add to sync-vehicle queue
    - onVehiclePriceUpdated(event): add price_update job to queue
    - onVehicleStatusChanged(event): add status_change job to queue
    - onVehiclePhotosUpdated(event): add photo_update job to queue
    - onVehicleDeleted(event): hard-delete marketplace_listing, MeiliSearch remove
    - onVehicleVisibilityToggled(event): update listing status
    - onDealerSuspended(dealerId): hide all dealer's active listings
    - onDealerReinstated(dealerId): restore all dealer's listings

  SyncJobProcessor: (BullMQ worker — sync-vehicle queue)
    - process(job): execute the sync for a single vehicle event
        1. Read vehicle (full record)
        2. Upsert marketplace_listing (public fields only)
        3. Update MeiliSearch index
        4. Write sync_audit_log
        5. Emit sync.complete → FanOutService

  FanOutService:
    - onSyncComplete(vehicleId, eventType, listingId):
        Dispatch all fan-out jobs in parallel:
        - dealer-website-isr job
        - gmc-feed-sync job (if dealer plan ≥ Professional)
        - facebook-catalog-sync job (if dealer plan ≥ Professional)
        - whatsapp-inventory-alert job (if eventType = create or price drop)
        - buyer-price-drop-alert job (if price dropped)
        - redis-cache-invalidation job

  SyncConflictResolver:
    - resolveRaceCondition(vehicleId): optimistic lock check
    - detectOutOfOrderEvent(vehicleId, eventTimestamp): compare with last_synced_at
    - handleDealerSuspendedMidSync(dealerId): abort + log

LISTENS TO EVENTS:
  vehicle.created, vehicle.updated, vehicle.status_changed,
  vehicle.photos_updated, vehicle.deleted, vehicle.visibility_toggled,
  vehicle.recon_complete, deal.delivered, deal.cancelled,
  dealer.suspended, dealer.reinstated
```

---

### 2.8 AutomationModule — Composite Structure

```typescript
AutomationModule contains 5 services + 1 rule engine:

AutomationRuleEngine: (core evaluator)
  - evaluate(triggerEvent, context): find all active rules matching trigger_event
      for the dealer, evaluate conditions against context, return matching rules
  - executeRule(rule, context): dispatch action to appropriate channel service
  - checkRateLimit(dealerId, channel): Redis INCR check before execution
  - detectLoop(ruleChain): max depth 3, circular reference detection
  - executeSequence(ruleId, contactId, stepIndex, context): execute one step
      of a multi-step sequence, schedule next step in BullMQ with delay

WhatsAppService:
  - sendTemplate(dealerId, phone, template, variables): Meta WABA API call
  - sendMedia(dealerId, phone, mediaUrl, caption): send image + caption
  - sendQuickReply(dealerId, phone, template): pre-configured template
  - handleInbound(dealerId, webhookPayload): process incoming message,
      log in lead_interaction, notify salesperson
  - connectAdapter(dealerId, provider, config): store in dealer_integration
  - forwardToAdapter(dealerId, payload): POST to configured adapter webhook

FacebookService:
  - sendInboxReply(dealerId, recipientId, message): Meta Graph API
  - syncLeadAdSubmission(dealerId, fbLeadPayload): create lead in CRM
  - schedulePost(dealerId, vehicleId): create social_post_queue record
  - publishPost(postId): Graph API → page post
  - getPageInsights(dealerId): engagement data per post
  - handleInboundMessage(dealerId, message): keyword matching, routing
  - rotateLongLivedToken(dealerId): refresh before expiry

SocialService:
  - selectVehiclesForWeek(dealerId): algorithm to pick optimal vehicles
  - generateCaption(vehicle, template): template engine + dealer branding
  - scheduleWeeklyPosts(dealerId): BullMQ delayed jobs for week
  - publishScheduledPost(postId): Facebook + Instagram via Graph API
  - getPostAnalytics(dealerId, period): aggregate from social_post_analytics

MarketingService:
  - sendEmailSequence(leadId, sequence, step): Resend API
  - sendSmsCampaign(dealerId, campaign): batch SMS via Greenweb
  - generatePersonalizedLink(leadId): JWT token → URL
  - trackPersonalizedLinkView(token): score update + lead_interaction log
  - triggerHotLeadSms(leadId): immediate SMS to assigned salesperson
  - runWinBackCampaign(dealerId): query cold leads, dispatch sequence

LISTENS TO EVENTS:
  lead.created           → Day 0 WhatsApp reply
  lead.stale_7d          → abandoned lead recovery
  deal.delivered         → post-sale sequence
  vehicle.available      → inventory alert to opted-in customers
  lead.hot               → hot lead SMS to salesperson
  lead.follow_up_due     → follow-up reminder
```

---

### 2.9 MaestroModule

```typescript
SERVICES:
  MaestroInsightService:
    - generateForDealer(dealerId): run all 6 insight evaluators,
        prioritize, store top 5 in maestro_insight table
    - generateForAllDealers(): BullMQ cron at 2:00 AM — enqueue per-dealer jobs
    - getInsights(dealerId): fetch active, unactioned insights
    - markActioned(dealerId, insightId, userId): mark actioned
    - dismiss(dealerId, insightId): mark dismissed

  InsightEvaluators (one per type):
    PricingInsightEvaluator: aging + overpriced vehicles
    DemandInsightEvaluator:  IMV demand index trends
    ConversionInsightEvaluator: lead response time, loss patterns
    ExpenseInsightEvaluator: recon cost vs margin targets
    AutomationInsightEvaluator: unused automation opportunities
    ReconQualityInsightEvaluator: post-delivery issues, recon delays

  DailySummaryService:
    - generateForDealer(dealerId): assemble yesterday's metrics + top 3 actions
    - deliverSummary(dealerId): in-app notification + SMS (3-line format)
    - generateForAllDealers(): BullMQ cron at 7:45 AM

  LeadScoringDecayService:
    - runDecay(): BullMQ daily cron — UPDATE lead SET lead_score = lead_score - 2
        WHERE stage NOT IN ('closed', 'lost')
        AND DATE(updated_at) < CURRENT_DATE  (only decay if no activity today)
```

---

### 2.10 PaymentsModule

```typescript
SERVICES:
  BkashService:
    - createPayment(invoiceId, amount, idempotencyKey): POST /checkout/payment/create
    - executePayment(paymentId, token): POST /checkout/payment/execute
    - queryPayment(paymentId): POST /checkout/payment/query (status check)
    - refundPayment(paymentId, amount, trxId, sku, reason): refund API
    - getToken(): cached access token (Redis TTL 3500s, auto-refresh)
    - handleTimeout(): detect timeout → query before retry (prevent double-charge)

  NagadService:
    - initPayment(invoiceId, amount, idempotencyKey): POST /api/dfs/check-out/initialize
    - completePayment(paymentRefId, signature): POST /api/dfs/check-out/complete
    - verifyPayment(paymentRefId): GET payment status
    - signRequest(payload): RSA private key signing for Nagad API

  SslCommerzService:
    - initiatePayment(invoiceId, amount, returnUrls): POST to SSLCommerz gateway
    - validateIpn(ipnPayload): verify IPN hash signature
    - handleSuccess(sessionId): activate subscription on verified success

  SubscriptionService:
    - createSubscription(dealerId, tier): provision plan features
    - renewSubscription(dealerId): attempt payment, handle grace period
    - upgradeSubscription(dealerId, newTier): prorate charge + upgrade features
    - downgradeSubscription(dealerId, newTier): schedule for next billing date
    - handlePaymentFailure(dealerId, invoiceId): retry logic + grace period
    - expireSubscription(dealerId): read-only mode, hide listings
    - reinstateSubscription(dealerId): restore all features + listings

IDEMPOTENCY STRATEGY:
  Every payment attempt generates idempotency_key = SHA256(dealerId:invoiceId:attemptRound)
  attemptRound = Math.floor(Date.now() / 300000)  // 5-minute buckets
  Before every payment initiation:
    SELECT id FROM payment_transaction WHERE idempotency_key = $1
    IF found AND status = 'success' → return existing transaction (skip re-charge)
    IF found AND status = 'pending' → query gateway for current status
    IF not found → proceed with new payment

BD-SPECIFIC TIMEOUT HANDLING:
  bKash/Nagad timeout rate: ~15% at peak hours
  Timeout detected: response takes > 8 seconds OR network error
  Recovery:
    1. Query payment by idempotency_key on gateway
    2. IF gateway shows success → activate subscription, return success
    3. IF gateway shows pending → wait 30s, query again
    4. IF gateway shows failed → safe to retry with same idempotency_key
    5. After 3 failed queries → Dead letter queue for manual review
```

---

## 3. Service Boundaries & Microservice Extraction Triggers

### 3.1 Current Architecture: Modular Monolith

```
RATIONALE FOR MONOLITH AT MVP:
  ✓ Single deployment = simpler DevOps for 2-person team
  ✓ No network latency between modules (in-process calls)
  ✓ Single database transaction across modules (atomicity)
  ✓ Shared Prisma client = no data duplication between services
  ✓ NestJS modules already enforce boundary discipline
  ✗ Not infinite scale — but 1,000 dealers do not require microservices

MONOLITH BOUNDARY DISCIPLINE (enforced even before extraction):
  Modules communicate ONLY via:
    a. Injected service (direct call, same process)
    b. Internal EventEmitter2 events (async, same process)
    c. BullMQ jobs (async, durable across restarts)
  Modules do NOT:
    a. Import Prisma models from another module's domain
    b. Call another module's controller
    c. Access another module's Redis keys directly
```

### 3.2 Module Boundary Contracts

```
BOUNDARY: SyncModule ↔ InventoryModule
  InventoryModule emits: EventEmitter2 events (vehicle.*)
  SyncModule listens: handles event, dispatches to BullMQ
  SyncModule does NOT: call InventoryService directly
  InventoryModule does NOT: know that SyncModule exists

BOUNDARY: AutomationModule ↔ CrmModule
  CrmModule emits: EventEmitter2 events (lead.*)
  AutomationModule listens: fires appropriate sequences
  CrmModule does NOT: call AutomationService directly
  Result: disable AutomationModule entirely with no CRM impact

BOUNDARY: MarketplaceModule ↔ ImvModule
  MarketplaceModule calls: ImvService.getRatingForListing()
  ImvModule is pure READ service for marketplace display
  ImvModule does NOT: write to marketplace_listing (that's SyncModule's job)

BOUNDARY: MaestroModule ↔ AnalyticsModule
  MaestroModule reads: raw data via its own Prisma queries
  AnalyticsModule provides: pre-computed aggregates for dashboards
  They do NOT share internal services — both can be extracted independently
```

### 3.3 Extraction Triggers — When to Split

```
TRIGGER 1: AutomationModule → AutomationService
  WHEN: BullMQ automation workers are consuming > 40% of single-instance CPU
  OR:   WhatsApp API rate limit handling requires independent scaling
  OR:   > 500 dealers each with > 5 active automation rules
  HOW:  Extract AutomationModule to separate NestJS app
        Communication: REST API calls (internal) + shared Redis queues
        Migration risk: LOW (already event-driven, no shared transactions needed)

TRIGGER 2: SyncModule → SyncService
  WHEN: sync-vehicle queue depth consistently > 1,000 pending jobs
  OR:   Sync SLA (< 2s) p95 exceeds 5 seconds
  OR:   > 2,000 active dealers all triggering syncs simultaneously
  HOW:  Extract SyncModule to separate NestJS app
        Communication: EventBridge or Redis pub/sub from main app → sync service
        Migration risk: LOW (already queue-based, minimal DB transactions)

TRIGGER 3: MarketplaceModule → MarketplaceService
  WHEN: Public marketplace traffic > 500K page views/day
  OR:   Marketplace read queries affecting dealer OS response times
  HOW:  Separate read replica database for marketplace
        Extract MarketplaceModule to read-only service pointing at replica
        Migration risk: MEDIUM (requires DB read replica setup)

TRIGGER 4: Full Microservice Split
  WHEN: > 2,000 dealers with full Business/Enterprise plans
  OR:   Southeast Asia expansion (separate deployments per country)
  HOW:  Domain-based split:
        - auth-service        (AuthModule, UsersModule)
        - dealer-service      (InventoryModule, ReconModule, CrmModule, SalesModule)
        - automation-service  (AutomationModule)
        - marketplace-service (MarketplaceModule, ImvModule)
        - sync-service        (SyncModule, FeedsModule)
        - analytics-service   (AnalyticsModule, MaestroModule)
        - payments-service    (PaymentsModule)
        - admin-service       (AdminModule, AuditModule)
  Communication: REST (synchronous) + BullMQ (asynchronous)
  Migration risk: HIGH — only when revenue justifies 3+ dedicated engineers
```

### 3.4 Current Worker Separation

```
Even within the monolith, workers run as SEPARATE PROCESSES:

main-api           → HTTP server (NestJS app, PORT 3000)
main-worker        → BullMQ workers: sync, IMV, general jobs
automation-worker  → BullMQ workers: WhatsApp, Facebook, social, email, SMS
notification-worker → BullMQ workers: SMS, push, email notifications
analytics-worker   → BullMQ workers: Maestro nightly, daily summary
feed-worker        → BullMQ workers: GMC sync, Facebook catalog sync

Each runs as separate DO App Platform dyno.
Crash in automation-worker does NOT take down main-api.
Scale automation-worker independently if WhatsApp volume spikes.

Shared: same Prisma DATABASE_URL, same Redis URL, same BullMQ queues
Different: no shared in-process memory (each is a separate Node.js process)
```

---

## 4. REST API Design — Guards, Interceptors & Pipes

### 4.1 Request Processing Pipeline

```
Incoming HTTP Request
        ↓
[1] Global Middleware
    - CorrelationIdMiddleware: attach/generate X-Request-ID header
    - RequestLoggerMiddleware: log method, path, dealerId, duration
    - RateLimitMiddleware: Redis-based rate limiting (per IP, per user)

        ↓
[2] Guards (execute IN ORDER — fail fast)
    - IpAllowlistGuard (admin routes only): check ADMIN_IP_ALLOWLIST
    - JwtAuthGuard: verify JWT signature + expiry
    - JwtAdminGuard (admin routes): verify admin JWT + admin_role
    - DealerContextGuard: inject dealership_id into DB context
    - RoleGuard: verify user's role has required permission
    - SubscriptionGuard: verify dealer plan allows this endpoint
    - FeatureFlagGuard: verify feature_flag is enabled for dealer

        ↓
[3] Interceptors
    - TransformInterceptor: wrap response in ApiResponse<T> envelope
    - CacheInterceptor: Redis cache check for cacheable GET routes
    - AuditInterceptor: write entity_change_log for state-mutating routes
    - TimeoutInterceptor: abort requests > 30 seconds

        ↓
[4] Pipes
    - ValidationPipe (global): class-validator DTOs
    - ParseUuidPipe: validate route params are valid UUIDs
    - TrimPipe: strip leading/trailing whitespace from string inputs
    - FileSizeValidationPipe: for upload endpoints

        ↓
[5] Controller → Service → Repository (Prisma)

        ↓
[6] Exception Filters
    - GlobalExceptionFilter: catch all unhandled errors
        → Prisma errors → map to ApiError codes
        → class-validator errors → VALIDATION_ERROR response
        → Custom domain exceptions → mapped error codes
        → Unknown errors → 500 + Sentry report
```

### 4.2 Guard Implementations

```typescript
// JwtAuthGuard
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid or expired token',
      });
    }
    return user;
  }
}

// DealerContextGuard (runs after JwtAuthGuard)
@Injectable()
export class DealerContextGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private dealerships: DealershipsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.dealer_id) {
      throw new UnauthorizedException({ code: 'AUTH_TOKEN_MISSING' });
    }

    // Check dealer status
    const dealer = await this.dealerships.findCached(user.dealer_id);
    if (!dealer) throw new NotFoundException({ code: 'DEALER_NOT_FOUND' });

    if (dealer.status === 'suspended') {
      // Allow read-only (GET) in grace period; block writes
      if (context.switchToHttp().getRequest().method !== 'GET') {
        throw new ForbiddenException({ code: 'AUTH_DEALER_READ_ONLY' });
      }
    }
    if (dealer.status === 'terminated') {
      throw new ForbiddenException({ code: 'AUTH_DEALER_SUSPENDED' });
    }

    // Inject RLS context
    await this.prisma.setDealerContext(user.dealer_id);
    request.dealerId = user.dealer_id;
    request.dealer = dealer;

    return true;
  }
}

// RoleGuard (uses @Roles() decorator)
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    const hasRole = requiredRoles.some(role => user.dealer_role === role);

    if (!hasRole) {
      throw new ForbiddenException({
        code: 'AUTH_INSUFFICIENT_ROLE',
        message: `Required: ${requiredRoles.join(' or ')}. You have: ${user.dealer_role}`,
      });
    }
    return true;
  }
}

// SubscriptionGuard
@Injectable()
export class SubscriptionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { dealer } = request;
    const requiredTier = this.reflector.get<string>('required_tier', context.getHandler());

    if (!requiredTier) return true;

    const tierOrder = ['free', 'starter', 'professional', 'business', 'enterprise'];
    const dealerTierIdx = tierOrder.indexOf(dealer.subscription_tier);
    const requiredTierIdx = tierOrder.indexOf(requiredTier);

    if (dealerTierIdx < requiredTierIdx) {
      throw new PaymentRequiredException({
        code: 'VEHICLE_LISTING_LIMIT',
        message: `This feature requires ${requiredTier} plan or higher`,
        required_plan: requiredTier,
        upgrade_url: '/settings/subscription',
      });
    }
    return true;
  }
}
```

### 4.3 Controller Decorators — Convention

```typescript
// Example: VehicleController
@Controller('vehicles')
@UseGuards(JwtAuthGuard, DealerContextGuard, RoleGuard)
@ApiBearerAuth()
export class VehicleController {

  // List vehicles — all roles
  @Get()
  @Roles('dealer_owner', 'manager', 'salesperson')
  findAll(@Query() query: VehicleFilterDto, @Req() req: AuthRequest) {
    return this.vehicleService.findAll(req.dealerId, query);
  }

  // Create vehicle — manager+ only
  @Post()
  @Roles('dealer_owner', 'manager')
  @UseInterceptors(AuditInterceptor)
  create(@Body() dto: CreateVehicleDto, @Req() req: AuthRequest) {
    return this.vehicleService.create(req.dealerId, dto, req.user.id);
  }

  // Get stock card — all roles (financial fields filtered by role in service)
  @Get(':id')
  @Roles('dealer_owner', 'manager', 'salesperson')
  findOne(@Param('id', ParseUuidPipe) id: string, @Req() req: AuthRequest) {
    return this.vehicleService.findOne(req.dealerId, id, req.user.dealer_role);
  }

  // Upload photos — all roles (salespeople can upload)
  @Post(':id/photos')
  @Roles('dealer_owner', 'manager', 'salesperson')
  @UseInterceptors(FilesInterceptor('photos', 30))
  uploadPhotos(
    @Param('id', ParseUuidPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: AuthRequest,
  ) {
    return this.photoService.upload(req.dealerId, id, files);
  }

  // Status change — manager+
  @Put(':id/status')
  @Roles('dealer_owner', 'manager')
  @UseInterceptors(AuditInterceptor)
  updateStatus(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateVehicleStatusDto,
    @Req() req: AuthRequest,
  ) {
    return this.vehicleService.updateStatus(req.dealerId, id, dto, req.user.id);
  }

  // GMC feed — professional+ required
  @Post(':id/force-sync')
  @Roles('dealer_owner', 'manager')
  @RequiredTier('starter')
  forceSync(@Param('id', ParseUuidPipe) id: string, @Req() req: AuthRequest) {
    return this.syncService.forceSync(req.dealerId, id);
  }
}
```

### 4.4 Financial Field Filtering by Role

```typescript
// VehicleService.findOne — role-based field masking
async findOne(dealerId: string, vehicleId: string, role: string) {
  const vehicle = await this.prisma.vehicle.findFirst({
    where: { id: vehicleId },
  });

  if (!vehicle) throw new NotFoundException({ code: 'VEHICLE_NOT_FOUND' });

  // Private financial fields: null for non-owner roles
  if (role === 'salesperson') {
    return {
      ...vehicle,
      acquisition_cost: null,
      recon_total: null,
      net_profit_estimate: null,
      floor_plan_cost: null,
    };
  }

  // Manager sees recon but not acquisition cost
  if (role === 'manager') {
    return {
      ...vehicle,
      acquisition_cost: null,
      net_profit_estimate: null,
      floor_plan_cost: null,
      // recon_total visible for recon management
    };
  }

  // Owner sees everything
  return vehicle;
}
```

### 4.5 Global Exception Filter

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private logger: Logger,
    private sentry: SentryService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.headers['x-request-id'] as string;

    // Map Prisma errors to API errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = this.mapPrismaError(exception);
      return response.status(mapped.status).json({
        success: false,
        error: mapped.error,
        request_id: requestId,
      });
    }

    // Map class-validator errors
    if (exception instanceof HttpException && exception.getStatus() === 422) {
      return response.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', ...exception.getResponse() },
        request_id: requestId,
      });
    }

    // Domain exceptions (thrown by services)
    if (exception instanceof DomainException) {
      return response.status(exception.statusCode).json({
        success: false,
        error: { code: exception.code, message: exception.message },
        request_id: requestId,
      });
    }

    // Unknown: log + Sentry + 500
    this.logger.error('Unhandled exception', exception);
    this.sentry.captureException(exception, { requestId });
    return response.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      request_id: requestId,
    });
  }

  private mapPrismaError(e: Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2002':  // unique constraint
        return { status: 409, error: { code: 'VALIDATION_DUPLICATE',
          message: 'Record already exists', field: e.meta?.target } };
      case 'P2025':  // record not found
        return { status: 404, error: { code: 'NOT_FOUND',
          message: 'Record not found' } };
      case 'P2003':  // foreign key
        return { status: 422, error: { code: 'REFERENCE_ERROR',
          message: 'Referenced record does not exist' } };
      default:
        return { status: 500, error: { code: 'DATABASE_ERROR',
          message: 'Database error' } };
    }
  }
}
```

---

## 5. WebSocket Architecture (Socket.io)

### 5.1 Connection & Authentication

```typescript
// websocket/ws.gateway.ts
@WebSocketGateway({
  cors: { origin: ['https://app.autoverse.com.bd', 'https://dealer.autoverse.com.bd'] },
  transports: ['websocket', 'polling'],  // polling fallback for BD network
  pingTimeout: 30000,
  pingInterval: 10000,
})
@UseGuards(WsJwtGuard)
export class AutoVerseGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private jwtService: JwtService,
    private redis: RedisService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token || client.handshake.headers.authorization;
    try {
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.data.dealerId = payload.dealer_id;
      client.data.role = payload.dealer_role;

      // Join dealer-specific room
      await client.join(`dealer:${payload.dealer_id}`);

      // Join user-specific room (for personal notifications)
      await client.join(`user:${payload.sub}`);

      // Track connection in Redis (for connected-user awareness)
      await this.redis.sadd(`ws_connected:${payload.dealer_id}`, payload.sub);

    } catch (e) {
      client.disconnect(true);  // invalid token → kick
    }
  }

  async handleDisconnect(client: Socket) {
    if (client.data.dealerId) {
      await this.redis.srem(`ws_connected:${client.data.dealerId}`, client.data.userId);
    }
  }
}
```

### 5.2 Event Definitions

```typescript
// Server → Client events (emitted by backend, received by frontend)

DEALER-ROOM EVENTS (to all connected users of a dealership):
  'lead.new'
    payload: { lead_id, buyer_name, source, vehicle_make, vehicle_model, assigned_to_name }
    use: show new lead badge in nav, add to pipeline, push notification

  'lead.stage_changed'
    payload: { lead_id, from_stage, to_stage, changed_by_name }
    use: update kanban card position in real-time for all staff

  'vehicle.synced'
    payload: { vehicle_id, stock_no, sync_status, last_synced_at }
    use: update "Last synced" timestamp on stock card

  'vehicle.sync_failed'
    payload: { vehicle_id, stock_no, error_type }
    use: show sync error badge on stock card

  'deal.approval_needed'
    payload: { deal_id, vehicle_make_model, sale_price, discount_amount, salesperson_name }
    use: show approval badge for managers/owners

  'automation.sent'
    payload: { lead_id, channel, template_name, timestamp }
    use: show in Lead Timeline in real-time

  'dashboard.metric_updated'
    payload: { metric: 'units_today' | 'revenue_today', value }
    use: live dashboard counter update (throttled to 1/minute)

USER-ROOM EVENTS (personal notifications, to one user only):
  'notification.new'
    payload: { notification_id, type, title, body, deep_link }
    use: show in-app notification badge + toast

  'lead.follow_up_due'
    payload: { lead_id, buyer_name, vehicle_make_model }
    use: reminder toast for assigned salesperson

  'lead.hot'
    payload: { lead_id, buyer_name, lead_score, vehicle_make_model }
    use: urgent toast + sound alert for assigned salesperson

// Client → Server events (emitted by frontend, received by backend)
  'lead.viewed'
    payload: { lead_id }
    use: mark notification as read, update last_viewed_at

  'notification.read'
    payload: { notification_id }
    use: mark notification is_read = true
```

### 5.3 Emitting Events from Services

```typescript
// In NotificationsService:
@Injectable()
export class NotificationsService {
  constructor(
    @InjectWebSocketGateway() private gateway: AutoVerseGateway,
  ) {}

  async notifyNewLead(dealerId: string, lead: Lead) {
    // Real-time: WebSocket to all connected staff
    this.gateway.server.to(`dealer:${dealerId}`).emit('lead.new', {
      lead_id: lead.id,
      buyer_name: lead.buyer_name,
      source: lead.source,
      vehicle_make: lead.vehicle?.make,
      vehicle_model: lead.vehicle?.model,
      assigned_to_name: lead.assignee?.full_name,
    });

    // Durable: Push notification (FCM) for offline users
    await this.sendPushToDealer(dealerId, {
      title: 'New Lead',
      body: `${lead.buyer_name} is interested in ${lead.vehicle?.make} ${lead.vehicle?.model}`,
      deep_link: `/crm/leads/${lead.id}`,
    });
  }

  async notifyHotLead(lead: Lead) {
    // Personal: WebSocket to assigned salesperson
    this.gateway.server.to(`user:${lead.assigned_to}`).emit('lead.hot', {
      lead_id: lead.id,
      buyer_name: lead.buyer_name,
      lead_score: lead.lead_score,
      vehicle_make_model: `${lead.vehicle?.make} ${lead.vehicle?.model}`,
    });

    // Critical path: also SMS (most reliable in BD)
    await this.smsService.send(
      lead.assignee.phone,
      `🔥 HOT LEAD: ${lead.buyer_name} scored ${lead.lead_score}. Call now.`
    );
  }
}
```

### 5.4 Scaling WebSocket Connections

```typescript
// Socket.io adapter for Redis Pub/Sub (required when running > 1 API instance)
// Without this, WebSocket events only go to clients on the SAME instance.

// main.ts
const app = await NestFactory.create(AppModule);
const redisClient = createClient({ url: process.env.REDIS_URL });
const subClient = redisClient.duplicate();

await redisClient.connect();
await subClient.connect();

app.useWebSocketAdapter(
  new RedisIoAdapter(app, redisClient, subClient)
);
// Now: emitting to `dealer:${dealerId}` room reaches clients on ALL instances.
// The Redis adapter broadcasts to all instances via pub/sub.
```

---

## 6. Redis — Caching Strategy Per Data Type

### 6.1 Key Naming Convention

```
FORMAT:  {namespace}:{entity}:{identifier}:{variant}
EXAMPLES:
  cache:dealer:550e8400:profile          → dealer profile object
  cache:imv:Toyota:Axio:2019:30-60K:used:Dhaka  → IMV cluster
  cache:search:a3f9b2c1                  → search result hash
  cache:vehicle:uuid:stock_card          → full stock card
  rate:otp:+8801XXXXXXXXX               → OTP rate limit counter
  rate:automation:whatsapp:dealer-uuid:20250115  → daily automation counter
  session:refresh:user-uuid:token-hash   → refresh token session
  ws_connected:dealer-uuid               → SET of connected user IDs
  stock_no_seq:dealer-uuid:202501        → stock number sequence counter
  lock:sync:vehicle-uuid                 → distributed sync lock
  lock:payment:idempotency-key          → payment processing lock
```

### 6.2 Cache Strategy Per Data Type

```
DATA TYPE: Dealer Profile (frequently read, rarely changes)
  Key:        cache:dealer:{dealerId}:profile
  Value:      JSON — dealership row + plan_config features
  TTL:        900s (15 minutes)
  Populate:   DealershipsService.findOne() → miss → DB query → SET
  Invalidate: On dealership update (plan change, status change, profile edit)
  Pattern:    Cache-aside (read-through)
  Used by:    DealerContextGuard (every request), SubscriptionGuard

DATA TYPE: IMV Cluster (read on every marketplace listing view, updated nightly)
  Key:        cache:imv:{make}:{model}:{year}:{mileage_bucket}:{condition}:{district}
  Value:      JSON — { p5, p25, p50, p75, p95, sample_size, confidence }
  TTL:        3600s (1 hour)
  Populate:   ImvService.getCluster() → miss → DB query → SET
  Invalidate: After nightly IMV recalculation run (bulk DEL matching pattern)
              After manual override applied
  Pattern:    Cache-aside
  Size est:   ~50 makes × 5 models × 30 years × 4 mileage × 2 condition × 10 districts
              = ~600,000 possible clusters, but only ~5,000–10,000 active
  Used by:    MarketplaceModule (listing pages), SyncModule (deal rating)

DATA TYPE: Vehicle Search Results (high-traffic, short TTL)
  Key:        cache:search:{md5(queryParams)}
  Value:      JSON — MeiliSearch result (listing IDs + pagination meta)
  TTL:        120s (2 minutes)
  Populate:   MarketplaceModule.search() → miss → MeiliSearch query → SET
  Invalidate: On ANY sync event — pattern delete: cache:search:*
              Note: broad invalidation acceptable; search results are cheap to rebuild
  Pattern:    Cache-aside with broad invalidation
  Used by:    Public marketplace search

DATA TYPE: Dealer Stock Card (read by dealer dashboard; write on inventory change)
  Key:        cache:vehicle:{vehicleId}:stock_card
  Value:      JSON — full vehicle row
  TTL:        300s (5 minutes)
  Populate:   VehicleService.findOne() → miss → DB query → SET
  Invalidate: On vehicle update (any field), on expense added (profit changes)
  Pattern:    Write-through on update (update DB + update cache atomically)
  Used by:    Dealer OS stock card view, sync engine

DATA TYPE: Dashboard Metrics (live dashboard; stale-while-revalidate)
  Key:        cache:dashboard:{dealerId}:{metric}:{period}
              e.g. cache:dashboard:uuid:units_sold:today
  Value:      Computed metric value
  TTL:        300s (5 minutes)
  Populate:   AnalyticsService.getMetric() → miss → DB aggregate → SET
  Invalidate: On deal delivered (revenue metrics), on vehicle status change
  Pattern:    Cache-aside + event-driven invalidation
  Used by:    Dealer dashboard, Morning Briefing

DATA TYPE: Nightly IMV / Maestro Results (write once, read many)
  Key:        cache:maestro:{dealerId}:insights
  Value:      JSON — array of top 5 insight objects
  TTL:        86400s (24 hours — refreshed by nightly job)
  Populate:   MaestroModule nightly job → compute → SET
  Invalidate: Only by next nightly run
  Pattern:    Write-on-compute (background job writes to cache after computation)
  Used by:    Dashboard Morning Briefing, Maestro Insights tab

DATA TYPE: Feature Flags (read on every request, changed rarely)
  Key:        cache:feature_flags:all
  Value:      JSON — all active feature flags
  TTL:        600s (10 minutes)
  Populate:   FeatureFlagService.getAll() → miss → DB → SET
  Invalidate: On any feature flag update (admin action)
  Pattern:    Cache-aside
  Used by:    FeatureFlagGuard, plan-check guards

DATA TYPE: bKash Access Token (expires in ~3600s)
  Key:        cache:bkash:access_token
  Value:      String — Bearer token
  TTL:        3500s (slightly less than bKash's 3600s TTL)
  Populate:   BkashService.getToken() → miss → bKash auth API → SET
  Invalidate: Never (TTL-based expiry)
  Pattern:    Cache-aside with TTL expiry
  Used by:    BkashService (every payment initiation)

DATA TYPE: VIN Decode Results (immutable — a VIN's specs don't change)
  Key:        cache:vin:{vin}:decode
  Value:      JSON — NHTSA decoded specs
  TTL:        7776000s (90 days)
  Populate:   VinScanService.decode() → miss → NHTSA API → SET
  Invalidate: Never (TTL-based only; specs don't change for a VIN)
  Pattern:    Cache-aside
  Used by:    VIN scan flow

DATA TYPE: Saved Search Alert State (for deduplication)
  Key:        cache:search_alert:{userId}:{searchId}:{listingId}
  Value:      "1" (existence = already alerted)
  TTL:        604800s (7 days)
  Populate:   On alert sent → SET
  Invalidate: TTL expiry (re-alert after 7 days)
  Pattern:    Write-on-send
  Used by:    Price drop alert job, new inventory alert job

DATA TYPE: Rate Limits (various)
  OTP rate:          rate:otp:{phone}          TTL: 600s    MAX: 3
  API rate:          rate:api:{userId}:{route} TTL: 60s     MAX: 30/min
  Automation:        rate:automation:{channel}:{dealerId}:{date}  TTL: 86400s
  Social posts:      rate:social_posts:{dealerId}:{date}   TTL: 86400s  MAX: 3
  Lead score update: rate:score_update:{leadId} TTL: 60s   (debounce multiple events)
  All use:           Redis INCR + EXPIRE (set on first increment)
```

### 6.3 Redis Memory Management

```
MEMORY ESTIMATE AT 1,000 DEALERS:
  IMV clusters:       5,000 keys × ~200B = 1MB
  Search cache:       500 active queries × ~5KB = 2.5MB
  Dashboard metrics:  1,000 dealers × 10 metrics = 10,000 keys × ~50B = 500KB
  Feature flags:      1 key × ~5KB = 5KB
  Rate limit keys:    ~50,000 × ~10B = 500KB
  Refresh tokens:     10,000 active sessions × ~50B = 500KB
  WS connections:     1,000 dealers × 5 users = 5,000 entries × ~50B = 250KB
  TOTAL ESTIMATE:     ~6MB active data

  Upstash Redis free tier: 256MB — sufficient for > 5,000 dealers.
  Scale consideration: at 10,000 dealers → upgrade to Upstash paid tier (~$20/mo)

EVICTION POLICY: allkeys-lru
  (When memory limit hit, evict least recently used keys)
  Safe because: all cache keys can be reconstructed from DB on miss

KEY EXPIRY MONITORING:
  BullMQ daily job: count keys by namespace prefix
  Alert if: total key count > 1,000,000 (unexpected growth)
```

---

## 7. BullMQ — All Queues with Full Configuration

### 7.1 Queue Configuration Reference

```typescript
// Queue defaults (overridden per queue where noted)
const DEFAULT_JOB_OPTIONS: JobsOptions = {
  removeOnComplete: { age: 86400, count: 1000 },  // keep 24h or 1000 jobs
  removeOnFail: { age: 604800 },                   // keep failed jobs 7 days for debugging
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
};
```

### 7.2 Complete Queue Inventory

```typescript
// ─────────────────────────────────────────────────────────────────────────
// QUEUE: sync-vehicle
// PURPOSE: Sync vehicle record to marketplace_listing + MeiliSearch
// WORKER: main-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'sync-vehicle'
Concurrency: 10
JobOptions: {
  attempts: 4,
  backoff: { type: 'exponential', delay: 5000 },  // 5s, 10s, 40s, 160s
  removeOnComplete: { count: 500 },
  priority: { price_update: 1, status_change: 1, create: 2, photo_update: 3 }
  // Lower number = higher priority (price changes and status changes are urgent)
}
DLQ: 'sync-vehicle-failed'
  → Processor: system admin alert + dealer UI warning
  → Manual retry: available via admin panel or dealer stock card
Job payload: {
  event_type: SyncEventType,
  vehicle_id: string,
  dealership_id: string,
  timestamp: string,    // ISO8601 — used for optimistic locking check
  old_price?: number,   // for price_update events
  new_price?: number,
}
Timeout per job: 10_000ms
Rate limiting: max 20 sync jobs per dealer per minute (per-dealer Redis counter)

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: dealer-website-isr
// PURPOSE: Revalidate dealer microsite Next.js ISR pages
// WORKER: main-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'dealer-website-isr'
Concurrency: 20  // fast HTTP calls, high concurrency safe
JobOptions: {
  attempts: 3,
  backoff: { type: 'fixed', delay: 2000 },
  removeOnComplete: { count: 100 },
}
Job payload: {
  dealership_id: string,
  vehicle_id?: string,
  slug: string,           // dealer subdomain
  paths: string[],        // ISR paths to revalidate: ['/cars/[slug]', '/']
}
Timeout: 8_000ms

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: gmc-feed-sync
// PURPOSE: Update Google Merchant Center feed item
// WORKER: feed-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'gmc-feed-sync'
Concurrency: 5   // GMC API rate limit: 1 req/sec per merchant; 5 workers = safe
JobOptions: {
  attempts: 3,
  backoff: { type: 'exponential', delay: 10000 },
  removeOnComplete: { count: 200 },
}
Rate limiter (BullMQ built-in):
  { max: 50, duration: 60000 }  // 50 jobs per 60s globally
Condition check in processor:
  Skip if dealer plan < professional OR gmc not connected
Job payload: {
  dealership_id: string,
  vehicle_id: string,
  operation: 'upsert' | 'delete',
}

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: facebook-catalog-sync
// PURPOSE: Update Facebook catalog via Graph API
// WORKER: feed-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'facebook-catalog-sync'
Concurrency: 5
JobOptions: {
  attempts: 3,
  backoff: { type: 'exponential', delay: 10000 },
}
Condition: dealer plan >= professional AND fb_catalog_connected
Failure mode: token expired → emit dealer_integration.token_expired event
              → FacebookService.rotateLongLivedToken() (if rotation fails → disable + alert)

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: imv-recalculate
// PURPOSE: Nightly IMV percentile recalculation for all clusters
// WORKER: analytics-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'imv-recalculate'
Concurrency: 20  // pure DB computation, no external API
Cron: '0 2 * * *'  (2:00 AM BD time = 20:00 UTC)
JobOptions: {
  attempts: 2,
  backoff: { type: 'fixed', delay: 60000 },
  removeOnComplete: { count: 7 },  // keep 7 days of history
}
Job types:
  a. 'full_recalculation'  — all clusters (nightly cron)
  b. 'single_listing'      — single vehicle price update (instant, triggered by sync)
  c. 'emergency_manual'    — admin-triggered from admin panel
Duration estimate: full recalculation at 500K listings = ~8 minutes

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: lead-follow-up
// PURPOSE: Fire follow-up reminder at scheduled next_follow_up time
// WORKER: main-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'lead-follow-up'
Concurrency: 10
JobOptions: {
  attempts: 2,
  backoff: { type: 'fixed', delay: 30000 },
  delay: computed dynamically (job added with delay = next_follow_up_ms - now_ms)
}
Job payload: { lead_id, dealership_id, assigned_to, reminder_method }
On execution:
  → Verify lead is still in active stage (not closed/lost)
  → Send reminder via specified channel
  → Log in lead_interaction
  → Do NOT auto-schedule next reminder (salesperson reschedules)
Cancellation: when follow_up is updated (cancel existing job + create new one)
  Implementation: job ID = 'follow_up:{lead_id}' (named job → can be removed by ID)

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: lead-contact-sla
// PURPOSE: Alert manager when new lead uncontacted for 2 hours
// WORKER: main-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'lead-contact-sla'
Concurrency: 20
JobOptions: {
  attempts: 1,   // if missed, window has passed
  delay: 7200000 (2 hours in ms)
}
Job payload: { lead_id, dealership_id }
On execution:
  Check: lead.stage = 'new' (still uncontacted)?
  IF YES: SMS to manager + WebSocket alert + set lead.contact_sla_breached = true
  IF NO: job discards (lead was already contacted)
Cancellation: job ID = 'sla:{lead_id}', cancelled when lead moves out of 'new' stage

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: lead-score-update
// PURPOSE: Asynchronous lead score updates (debounced)
// WORKER: main-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'lead-score-update'
Concurrency: 15
JobOptions: {
  attempts: 1,
  removeOnComplete: { count: 500 },
  // Deduplication: if score update already queued for this lead, skip
}
Job ID: 'score:{lead_id}' (deduplicates rapid multiple score events)
Job payload: { lead_id, signal_type, delta }
On execution:
  → Atomic Redis INCRBY on cached score
  → DB update (batch write every 60 seconds via cron to reduce DB writes)
  → Check hot threshold (>= 70): emit lead.hot if crossed

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: automation-whatsapp
// PURPOSE: WhatsApp message sending (sequences + alerts)
// WORKER: automation-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'automation-whatsapp'
Concurrency: 5   // Meta WABA API: conservative concurrency
JobOptions: {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: { count: 1000 },
}
Rate limiting: Redis check (1,000 msgs/dealer/day) before job execution
Job payload: {
  rule_id: string,
  contact_phone: string,
  dealership_id: string,
  template: string,
  variables: Record<string, string>,
  media_url?: string,
  lead_id?: string,
}
On completion: write automation_log + lead_interaction

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: automation-facebook
// PURPOSE: Facebook inbox replies + post publishing
// WORKER: automation-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'automation-facebook'
Concurrency: 5
JobOptions: {
  attempts: 3,
  backoff: { type: 'exponential', delay: 10000 },
}
Failure handling: token_expired → trigger token refresh job
                  page_not_found → disable facebook integration, notify dealer

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: automation-social
// PURPOSE: Social media post publishing at scheduled time
// WORKER: automation-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'automation-social'
Concurrency: 3   // social API is lower priority; conservative
JobOptions: {
  attempts: 3,
  backoff: { type: 'fixed', delay: 300000 },  // retry in 5 minutes
}
Rate limiting: 3 auto-posts per dealer per day (Redis counter)
On failure: post status → 'failed', dealer notified in Social Media → Post History

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: automation-email
// PURPOSE: Email sequence delivery via Resend
// WORKER: automation-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'automation-email'
Concurrency: 10  // Resend API can handle higher concurrency
JobOptions: {
  attempts: 3,
  backoff: { type: 'exponential', delay: 30000 },
}

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: automation-sms
// PURPOSE: SMS campaigns and alerts via Greenweb BD
// WORKER: automation-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'automation-sms'
Concurrency: 10
JobOptions: {
  attempts: 2,
  backoff: { type: 'fixed', delay: 60000 },
}
Rate limiting: per dealer per day limit from plan_config.sms_quota_monthly / 30
Opt-out check: before every SMS, check customer.opted_in_sms = true

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: maestro-insights
// PURPOSE: Nightly AI insight generation per dealer
// WORKER: analytics-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'maestro-insights'
Concurrency: 5   // one job per dealer; 5 dealers processed simultaneously
Cron: '0 2 * * *' (2:00 AM — after IMV recalculation completes)
JobOptions: {
  attempts: 1,   // insights are best-effort; failed = stale data, not critical
  removeOnComplete: { count: 1000 },
}
Job payload: { dealership_id }
Duration estimate: ~200ms per dealer → 1,000 dealers = 40s total at concurrency 5

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: daily-summary
// PURPOSE: 8:00 AM daily summary push to dealers
// WORKER: analytics-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'daily-summary'
Concurrency: 10
Cron: '45 7 * * *' (7:45 AM BD = 1:45 UTC — pre-assembly for 8:00 delivery)
JobOptions: {
  attempts: 2,
  backoff: { type: 'fixed', delay: 30000 },
}

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: aging-watchlist
// PURPOSE: Daily aging tier check for all dealers
// WORKER: analytics-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'aging-watchlist'
Concurrency: 5
Cron: '0 6 * * *' (6:00 AM BD = 0:00 UTC)
JobOptions: { attempts: 1 }
Action per dealer:
  → Query vehicles WHERE status = 'available' AND days_on_lot IN (30,45,60,90)
  → For each tier hit: fire appropriate alert (SMS/notification per tier)

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: subscription-billing
// PURPOSE: Monthly subscription renewal charging
// WORKER: main-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'subscription-billing'
Concurrency: 3   // payment API calls; conservative to prevent gateway throttling
Cron: '0 9 * * *' (9:00 AM — charge subscriptions expiring today)
JobOptions: {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1800000 },  // 30min, 1h, 4h
}
Job payload: { dealership_id, invoice_id, idempotency_key }
DLQ: 'subscription-billing-failed' → Finance Admin queue

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: notification-sms
// PURPOSE: Critical SMS notifications (new lead, hot lead, SLA breach)
// WORKER: notification-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'notification-sms'
Concurrency: 20  // Greenweb API can handle high volume
JobOptions: {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  priority: urgency-based (hot_lead: 1, new_lead: 2, aging: 3, general: 5)
}
Timeout: 8000ms (BD SMS gateway timeout threshold)

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: notification-push
// PURPOSE: Firebase FCM push notifications
// WORKER: notification-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'notification-push'
Concurrency: 20
JobOptions: {
  attempts: 2,
  backoff: { type: 'fixed', delay: 10000 },
}
Failure handling: FCM token invalid → remove from user.fcm_token in DB

// ─────────────────────────────────────────────────────────────────────────
// QUEUE: lead-score-decay
// PURPOSE: Daily lead score decay (−2 per day per inactive lead)
// WORKER: analytics-worker
// ─────────────────────────────────────────────────────────────────────────
Queue: 'lead-score-decay'
Concurrency: 1  // single bulk update job
Cron: '30 3 * * *' (3:30 AM)
JobOptions: { attempts: 2 }
Execution: single UPDATE query (not per-lead jobs):
  UPDATE lead
  SET lead_score = GREATEST(0, lead_score - 2),
      updated_at = NOW()
  WHERE stage NOT IN ('closed', 'lost')
  AND DATE(updated_at) < CURRENT_DATE
  AND deleted_at IS NULL
```

### 7.3 Dead Letter Queue Strategy

```typescript
// All DLQs named: {original-queue}-failed
// DLQ processor: stores jobs in Redis indefinitely until manual action

@Processor('sync-vehicle-failed')
export class SyncDlqProcessor {
  async process(job: Job) {
    // Write to sync_audit_log with status = 'dlq'
    await this.syncAuditService.logDlq(job.data);

    // Alert System Admin via WebSocket (admin panel)
    await this.adminNotify.syncDlqAlert(job.data);

    // Set vehicle UI state: show sync error badge
    await this.redis.set(
      `sync_error:${job.data.vehicle_id}`,
      JSON.stringify({ error: job.data.error, timestamp: new Date().toISOString() }),
      { EX: 86400 }
    );
  }
}

// Manual retry: available from admin panel + dealer stock card
// Admin: POST /admin/system/queues/sync-vehicle-failed/{jobId}/retry
// Dealer: POST /vehicles/{id}/force-sync (re-adds to main queue)

// DLQ monitoring threshold: > 5 DLQ entries in 30 minutes → system-wide alert
// Implemented via: BullMQ Event 'failed' listener with Redis counter
```

---

## 8. Internal Event Bus — Naming Convention & Payload Schemas

### 8.1 Event Naming Convention

```
FORMAT:   {domain}.{entity}.{action}
DOMAIN:   inventory | crm | sales | sync | automation | payments | dealer | admin
ENTITY:   vehicle | lead | deal | customer | recon | expense | listing | dealer | subscription
ACTION:   created | updated | deleted | status_changed | completed | failed | hot | suspended

EXAMPLES:
  inventory.vehicle.created
  inventory.vehicle.status_changed
  inventory.vehicle.photos_updated
  inventory.recon.all_tasks_complete
  crm.lead.created
  crm.lead.stage_changed
  crm.lead.hot
  crm.lead.stale_7d
  crm.lead.follow_up_due
  sales.deal.created
  sales.deal.delivered
  sales.deal.cancelled
  sync.vehicle.complete       (sync engine internal)
  dealer.suspended
  dealer.reinstated
  payments.subscription.activated
  payments.subscription.expired
  payments.subscription.payment_failed
```

### 8.2 Event Payload Schemas

```typescript
// All events extend this base:
interface BaseEvent {
  event_id: string;         // UUID (for deduplication)
  timestamp: string;        // ISO8601 UTC
  dealer_id: string;        // always present (even for global events)
  triggered_by?: string;    // user_id if user action; 'system' if automated
}

// ─────────────────────────────────
// inventory.vehicle.created
// ─────────────────────────────────
interface VehicleCreatedEvent extends BaseEvent {
  vehicle_id: string;
  stock_no: string;
  make: string;
  model: string;
  year: number;
  asking_price: number;
  marketplace_published: boolean;
  photo_count: number;
}

// ─────────────────────────────────
// inventory.vehicle.status_changed
// ─────────────────────────────────
interface VehicleStatusChangedEvent extends BaseEvent {
  vehicle_id: string;
  stock_no: string;
  from_status: VehicleStatus;
  to_status: VehicleStatus;
  reason?: string;
  deal_id?: string;          // present when status = reserved or sold
}

// ─────────────────────────────────
// inventory.vehicle.updated
// ─────────────────────────────────
interface VehicleUpdatedEvent extends BaseEvent {
  vehicle_id: string;
  changed_fields: string[];  // ['asking_price', 'color']
  old_asking_price?: number;
  new_asking_price?: number;
}

// ─────────────────────────────────
// crm.lead.created
// ─────────────────────────────────
interface LeadCreatedEvent extends BaseEvent {
  lead_id: string;
  source: LeadSource;
  buyer_name: string;
  buyer_phone: string;
  vehicle_id?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  assigned_to: string;       // user_id
  assigned_to_phone: string; // for SMS notification
}

// ─────────────────────────────────
// crm.lead.stage_changed
// ─────────────────────────────────
interface LeadStageChangedEvent extends BaseEvent {
  lead_id: string;
  from_stage: LeadStage;
  to_stage: LeadStage;
  lost_reason?: string;
  vehicle_id?: string;
}

// ─────────────────────────────────
// crm.lead.hot
// ─────────────────────────────────
interface LeadHotEvent extends BaseEvent {
  lead_id: string;
  lead_score: number;
  buyer_name: string;
  buyer_phone: string;
  vehicle_id?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  assigned_to: string;       // user_id
  assigned_to_phone: string;
  assigned_to_fcm_token?: string;
}

// ─────────────────────────────────
// sales.deal.delivered
// ─────────────────────────────────
interface DealDeliveredEvent extends BaseEvent {
  deal_id: string;
  vehicle_id: string;
  customer_id: string;
  customer_phone: string;
  customer_name: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  salesperson_id: string;
  sale_price: number;
  gross_profit: number;
}

// ─────────────────────────────────
// sync.vehicle.complete
// ─────────────────────────────────
interface SyncCompleteEvent extends BaseEvent {
  vehicle_id: string;
  listing_id: string;
  event_type: SyncEventType;
  old_price?: number;
  new_price?: number;
  is_price_drop: boolean;
  dealer_plan: string;       // for conditional fan-out
  gmc_enabled: boolean;
  fb_catalog_enabled: boolean;
}

// ─────────────────────────────────
// dealer.suspended
// ─────────────────────────────────
interface DealerSuspendedEvent extends BaseEvent {
  reason: string;
  suspension_type: 'payment_failure' | 'policy_violation' | 'fraud';
  active_listing_count: number;  // for sync engine to hide listings
}
```

### 8.3 EventEmitter2 Configuration

```typescript
// app.module.ts
EventEmitterModule.forRoot({
  wildcard: true,           // enables 'inventory.*' wildcard listeners
  delimiter: '.',           // use dot notation
  maxListeners: 20,         // warn if > 20 listeners on single event
  verboseMemoryLeak: true,  // log warning if memory leak detected
  ignoreErrors: false,      // throw on emit errors (don't silently swallow)
})

// Listener registration example:
@OnEvent('inventory.vehicle.*')
async handleVehicleEvent(event: VehicleCreatedEvent | VehicleUpdatedEvent | ...) {
  // Routes to appropriate sync job based on event type
}

@OnEvent('crm.lead.hot', { async: true })  // async: true = don't block caller
async handleHotLead(event: LeadHotEvent) {
  await this.notificationsService.notifyHotLead(event);
}

// Error handling in event listeners:
// Wrap in try/catch; failures in listeners must NOT propagate to emitter
@OnEvent('sales.deal.delivered')
async handleDealDelivered(event: DealDeliveredEvent) {
  try {
    await this.automationService.startPostSaleSequence(event);
  } catch (error) {
    // Log error, do NOT re-throw
    this.logger.error('Post-sale sequence failed', { event, error });
    // Non-critical path: dealer can manually trigger from automation hub
  }
}
```

---

## 9. RBAC — JWT RS256 Claims, Guard Logic & Permission Matrix

### 9.1 JWT Structure

```typescript
// DEALER JWT PAYLOAD:
interface DealerJwtPayload {
  sub: string;               // user.id (UUID)
  phone: string;             // primary identifier
  dealer_id: string;         // dealership.id (UUID)
  dealer_role: DealerRole;   // 'dealer_owner' | 'manager' | 'salesperson' | 'technician'
  dealer_status: string;     // 'active' | 'suspended' (for fast status check)
  plan_tier: string;         // 'free' | 'starter' | 'professional' | 'business' | 'enterprise'
  iat: number;               // issued at
  exp: number;               // expiry (iat + 900)
  jti: string;               // JWT ID (for revocation)
}

// ADMIN JWT PAYLOAD (separate signing key):
interface AdminJwtPayload {
  sub: string;               // admin_user.id
  admin_role: AdminRole;     // 'super_admin' | 'operations_manager' | ...
  iat: number;
  exp: number;               // iat + 1800 (30-min admin sessions)
  jti: string;
  session_id: string;        // Redis session key for idle timeout
}

// BUYER JWT PAYLOAD:
interface BuyerJwtPayload {
  sub: string;               // user.id
  phone: string;
  user_type: 'buyer' | 'c2c_seller';
  iat: number;
  exp: number;               // iat + 86400 (24h buyer sessions)
}

// SIGNING:
Dealer tokens:   RS256 with JWT_PRIVATE_KEY (2048-bit RSA)
Admin tokens:    HS256 with ADMIN_JWT_SECRET (256-bit symmetric)
  Reason: admin tokens are internal only; symmetric is sufficient + simpler
Buyer tokens:    RS256 with JWT_PRIVATE_KEY (same as dealer — both public platform)

// JWT signing in TokenService:
async issueAccessToken(payload: DealerJwtPayload): Promise<string> {
  return this.jwtService.sign(
    { ...payload, jti: uuid() },
    {
      algorithm: 'RS256',
      privateKey: this.config.get('JWT_PRIVATE_KEY'),
      expiresIn: 900,
    }
  );
}

// Verification in JwtStrategy:
async validate(payload: DealerJwtPayload) {
  // Check if token has been revoked (logout or security event)
  const isRevoked = await this.redis.get(`revoked_jti:${payload.jti}`);
  if (isRevoked) throw new UnauthorizedException('Token revoked');

  return payload;  // attached to request.user
}
```

### 9.2 Permission Matrix — All Modules

```
PERMISSION NOTATION:
  ✅ Full access (read + write)
  📖 Read only
  🔢 Aggregates only (no per-item detail)
  👤 Own records only
  ❌ No access (section not rendered in UI, endpoint returns 403)

───────────────────────────────────────────────────────────────────────────────
MODULE / FEATURE                       OWNER     MANAGER    SALESPERSON
───────────────────────────────────────────────────────────────────────────────
INVENTORY
  Vehicle list (all)                    ✅        ✅         ✅ (no cost fields)
  Vehicle list (own assigned vehicles)  N/A       N/A        N/A (sees all)
  Vehicle create                        ✅        ✅         ✅
  Vehicle edit (specs, price)           ✅        ✅         ❌
  Vehicle status change                 ✅        ✅         ❌
  Vehicle soft delete                   ✅        ✅         ❌
  Acquisition cost field                ✅        ❌         ❌
  Profit calculator                     ✅        ❌         ❌
  Net profit estimate field             ✅        ❌         ❌
  Photo upload                          ✅        ✅         ✅
  Toggle marketplace publish            ✅        ✅         ❌
  Force sync                            ✅        ✅         ❌
  Aging watchlist (view)                ✅        ✅         ❌
  Recon assessment create/edit          ✅        ✅         ❌
  Recon task create/edit                ✅        ✅         ✅ (assigned tasks)

EXPENSES
  Vehicle expenses (Type 1) — full      ✅        ✅         ❌
  Vehicle expenses (Type 1) — view      ✅        ✅         ❌
  Operational expenses (Type 2) — full  ✅        ❌         ❌
  Operational expenses (Type 2) — totals ✅       🔢         ❌
  Add expense                           ✅        ✅         ❌

CRM
  Lead list (all staff's leads)         ✅        ✅         ❌ (own only default)
  Lead list (own leads only)            ✅        ✅         ✅
  Lead create                           ✅        ✅         ✅
  Lead edit                             ✅        ✅         👤
  Lead assign/reassign                  ✅        ✅         ❌
  Log interaction                       ✅        ✅         ✅
  Change stage                          ✅        ✅         👤
  Lost reason (required on close)       ✅        ✅         ✅
  Customer list                         ✅        ✅         👤
  Customer edit                         ✅        ✅         ❌

DEALS
  Deal list (all)                       ✅        ✅         ❌ (own only)
  Deal list (own)                       ✅        ✅         ✅
  Deal create                           ✅        ✅         ✅
  Deal edit                             ✅        ✅         👤 (draft only)
  Deal approve                          ✅        ✅ (within limit) ❌
  Deal deliver                          ✅        ✅         ❌
  Deal cancel                           ✅        ✅         ❌
  Deal gross profit field               ✅        ❌         ❌
  Bill of Sale generate                 ✅        ✅         👤
  Record payment                        ✅        ✅         ❌

ANALYTICS
  Units sold (own/team/all)             ✅        📖 (team)  📖 (own)
  Revenue (own/team/all)                ✅        ❌         ❌
  Gross profit                          ✅        ❌         ❌
  Gross profit per unit                 ✅        ❌         ❌
  Target vs actual                      ✅        ❌         ❌
  Lead conversion rate                  ✅        ✅ (team)  📖 (own)
  Inventory turnover                    ✅        ✅         ❌
  Expense burn                          ✅        ❌         ❌
  Staff performance table               ✅        ✅         👤
  Maestro insights                      ✅        ✅         ❌
  Daily summary                         ✅        ✅         ❌
  Reports export                        ✅        ❌         ❌

AUTOMATION HUB
  View templates/rules                  ✅        ✅         📖
  Create/edit rules                     ✅        ✅         ❌
  Delete rules                          ✅        ✅         ❌
  View automation logs                  ✅        ✅         ❌
  Run test automation                   ✅        ✅         ❌
  SMS campaign create/send              ✅        ❌         ❌
  View post queue                       ✅        ✅         📖
  Approve/reject post                   ✅        ✅         ❌

WEBSITE & MARKETING
  Website settings                      ✅        ✅         ❌
  SEO settings                          ✅        ✅         ❌
  Channel connections                   ✅        ✅         ❌
  Post history view                     ✅        ✅         📖
  Website analytics                     ✅        ✅         ❌

SETTINGS
  Business profile edit                 ✅        ❌         ❌
  Team members view                     ✅        ❌         ❌
  Team members add/edit/remove          ✅        ❌         ❌
  Roles & permissions                   ✅        ❌         ❌
  Subscription view                     ✅        ❌         ❌
  Subscription upgrade/downgrade        ✅        ❌         ❌
  Billing & invoices                    ✅        ❌         ❌
  Payment method update                 ✅        ❌         ❌
  Notification settings                 ✅        ✅         ✅ (own only)
  Dealer settings (thresholds)          ✅        ❌         ❌
───────────────────────────────────────────────────────────────────────────────
```

### 9.3 Admin Permission Matrix

```
───────────────────────────────────────────────────────────────────────────────
ACTION                            SUPER   OPS_MGR  FINANCE  CONTENT  MKTG  SYS
───────────────────────────────────────────────────────────────────────────────
Dealer list + search               ✅      ✅       📖       ❌       ❌    📖
Dealer approve/reject              ✅      ✅       ❌       ❌       ❌    ❌
Dealer suspend/reinstate           ✅      ✅       ❌       ❌       ❌    ❌
Dealer terminate                   ✅      ❌       ❌       ❌       ❌    ❌
Dealer profile edit (admin)        ✅      ✅       ❌       ❌       ❌    ❌
Dealer plan change (manual)        ✅      ✅       ✅       ❌       ❌    ❌
Dealer impersonate                 ✅      ❌       ❌       ❌       ❌    ❌
Add admin note                     ✅      ✅       ✅       ✅       ✅    ✅

C2C moderation queue               ✅      ✅       ❌       ✅       ❌    ❌
C2C approve/reject                 ✅      ✅       ❌       ✅       ❌    ❌
Dealer listing moderation          ✅      ✅       ❌       ✅       ❌    ❌
Make/model database edit           ✅      ❌       ❌       ✅       ❌    ❌
Expert article management          ✅      ❌       ❌       ✅       ❌    ❌

Revenue dashboard view             ✅      ❌       ✅       ❌       ❌    ❌
Failed payment queue               ✅      ❌       ✅       ❌       ❌    ❌
Invoice actions (waive/refund)     ✅      ❌       ✅       ❌       ❌    ❌
Subscription billing ops           ✅      ❌       ✅       ❌       ❌    ❌
Invoice > BDT 10K refund           ✅      ❌       ❌       ❌       ❌    ❌

IMV parameter view                 ✅      ❌       ❌       ❌       ✅    ❌
IMV override request               ✅      ❌       ❌       ❌       ✅    ❌
IMV override approve               ✅      ❌       ❌       ❌       ❌    ❌
Featured slot management           ✅      ❌       ❌       ❌       ✅    ❌
Homepage banner management         ✅      ❌       ❌       ❌       ✅    ❌
Broadcast message send             ✅      ✅       ❌       ❌       ❌    ❌

Feature flag toggle (global)       ✅      ❌       ❌       ❌       ❌    ✅
Feature flag toggle (plan/dealer)  ✅      ✅       ❌       ❌       ❌    ✅
System health dashboard            ✅      ❌       ❌       ❌       ❌    ✅
BullMQ queue monitoring            ✅      ❌       ❌       ❌       ❌    ✅
BullMQ job retry (manual)          ✅      ❌       ❌       ❌       ❌    ✅
Environment config                 ✅      ❌       ❌       ❌       ❌    ✅
API rate limit config              ✅      ❌       ❌       ❌       ❌    ✅
Blacklist management               ✅      ✅       ❌       ❌       ❌    ❌

Platform audit log view            ✅      ✅       ✅       ❌       ❌    ✅
Platform KPIs / investor view      ✅      ❌       ✅       ❌       ❌    ❌
───────────────────────────────────────────────────────────────────────────────
```

### 9.4 JWT Revocation Strategy

```typescript
// Logout: revoke current refresh token
async logout(userId: string, refreshTokenHash: string): Promise<void> {
  // 1. Remove from DB
  await this.prisma.refreshToken.update({
    where: { token_hash: refreshTokenHash },
    data: { revoked_at: new Date() },
  });
  // 2. Remove from Redis session store
  await this.redis.del(`session:refresh:${userId}:${refreshTokenHash}`);
}

// Access token revocation (on security event: password change, account suspend):
// Access tokens (15min TTL) are NOT individually revocable by default.
// For CRITICAL revocation (account suspension, fraud):
async revokeAccessToken(jti: string): Promise<void> {
  // Blocklist JTI in Redis until token would have expired
  await this.redis.set(`revoked_jti:${jti}`, '1', { EX: 900 });
  // JwtStrategy.validate() checks this on every request
}

// Revoke all sessions (account takeover response):
async revokeAllSessions(userId: string): Promise<void> {
  // 1. Revoke all refresh tokens in DB
  await this.prisma.refreshToken.updateMany({
    where: { user_id: userId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
  // 2. Access tokens expire in max 15min (acceptable for security event)
  // 3. WebSocket connections kicked
  const gateway = this.moduleRef.get(AutoVerseGateway);
  gateway.server.to(`user:${userId}`).disconnectSockets(true);
}

// Admin session idle timeout:
// On every admin request: EXPIRE admin_session:{session_id} 1800
// If session key missing (expired): 401 → re-login required
async touchAdminSession(sessionId: string): Promise<void> {
  const exists = await this.redis.expire(`admin_session:${sessionId}`, 1800);
  if (!exists) throw new UnauthorizedException('Session expired');
}
```

---

## 10. Error Handling Architecture

### 10.1 Domain Exception Hierarchy

```typescript
// Base domain exception
export class DomainException extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}

// Specific domain exceptions:
export class VehicleNotFoundException extends DomainException {
  constructor(vehicleId: string) {
    super('VEHICLE_NOT_FOUND', `Vehicle ${vehicleId} not found`, 404);
  }
}

export class InvalidStatusTransitionException extends DomainException {
  constructor(from: string, to: string) {
    super(
      'VEHICLE_STATUS_TRANSITION_INVALID',
      `Cannot transition vehicle from ${from} to ${to}`,
      422,
      { from_status: from, to_status: to }
    );
  }
}

export class SoldVehicleImmutableException extends DomainException {
  constructor(vehicleId: string) {
    super('VEHICLE_SOLD_IMMUTABLE', `Vehicle ${vehicleId} is sold and cannot be modified`, 422);
  }
}

export class ListingLimitExceededException extends DomainException {
  constructor(currentPlan: string, limit: number) {
    super(
      'VEHICLE_LISTING_LIMIT',
      `Your ${currentPlan} plan allows ${limit} listings. Upgrade to add more.`,
      402,
      { current_plan: currentPlan, listing_limit: limit, upgrade_url: '/settings/subscription' }
    );
  }
}

export class LostReasonRequiredException extends DomainException {
  constructor() {
    super('LEAD_LOST_REASON_REQUIRED', 'Please select a reason for marking this lead as lost', 422);
  }
}

export class PaymentIdempotencyConflictException extends DomainException {
  constructor(idempotencyKey: string) {
    super(
      'PAYMENT_IDEMPOTENCY_CONFLICT',
      'A payment with this key has already been processed',
      409,
      { idempotency_key: idempotencyKey }
    );
  }
}
```

### 10.2 Error Recovery Patterns

```typescript
// PATTERN 1: Retry with exponential backoff (for external API calls)
async callWithRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      if (this.isRetryable(error)) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await sleep(delay);
        continue;
      }
      throw error;  // non-retryable error (validation, auth) → throw immediately
    }
  }
}

isRetryable(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return [408, 429, 500, 502, 503, 504].includes(error.response?.status);
  }
  return error instanceof NetworkError || error instanceof TimeoutError;
}

// PATTERN 2: Circuit breaker (for critical external services)
// bKash gateway: if > 5 failures in 30 seconds → open circuit for 60 seconds
// Implementation: opossum npm package

const bkashCircuitBreaker = new CircuitBreaker(bkashService.createPayment, {
  timeout: 8000,          // call timeout
  errorThresholdPercentage: 50,  // open if > 50% failures
  resetTimeout: 60000,    // try again after 60s
  volumeThreshold: 5,     // min calls before opening
});

bkashCircuitBreaker.on('open', () => {
  logger.warn('bKash circuit breaker OPEN — using fallback payment methods');
  notifyAdminSlack('bKash gateway circuit breaker opened');
});

// PATTERN 3: Graceful degradation for non-critical features
async getMaestroInsights(dealerId: string) {
  try {
    return await this.maestroCache.get(dealerId);
  } catch (error) {
    // Maestro is non-critical; return empty state, don't fail the request
    logger.error('Maestro cache read failed', { dealerId, error });
    return [];  // Dashboard shows "No insights available" — not an error state
  }
}
```

---

## 11. Observability — Logging, Tracing & Metrics

### 11.1 Structured Logging

```typescript
// Logger configuration (Pino — high-performance structured JSON logs)
@Injectable()
export class AppLogger {
  private logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    formatters: {
      level: (label) => ({ level: label }),
    },
    // Required fields in every log line:
    base: {
      service: 'autoverse-api',
      version: process.env.APP_VERSION,
      env: process.env.NODE_ENV,
    },
  });

  // Standard log context:
  log(level: string, message: string, context: LogContext) {
    this.logger[level]({
      ...context,
      request_id: context.requestId,
      dealer_id: context.dealerId,
      user_id: context.userId,
      duration_ms: context.durationMs,
    }, message);
  }
}

// REQUIRED LOG FIELDS BY CATEGORY:
HTTP Request:
  { request_id, method, path, status_code, duration_ms, dealer_id, user_id, ip }

BullMQ Job:
  { job_id, queue, job_name, attempt, dealer_id, vehicle_id (if applicable), duration_ms }

External API Call:
  { provider, method, endpoint, status_code, duration_ms, request_id }

Domain Event:
  { event_type, event_id, dealer_id, entity_id, triggered_by }

Error:
  { error_code, error_message, stack_trace, request_id, dealer_id }
```

### 11.2 Sentry Integration

```typescript
// Sentry captures: unhandled errors, BullMQ job failures, payment failures
// NOT captured: expected domain exceptions (404, validation), rate limit hits

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,     // 10% of requests traced (performance impact)
  profilesSampleRate: 0.1,
  beforeSend(event) {
    // Strip sensitive fields before sending to Sentry
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    // Strip dealer financial data from breadcrumbs
    return event;
  },
});

// Context enrichment on every request:
Sentry.setContext('dealer', { dealer_id, plan_tier });
Sentry.setUser({ id: user_id, username: phone });
```

### 11.3 PostHog Product Analytics

```typescript
// Track feature usage (not errors) — dealer behavior analytics
// Used by: product decisions, onboarding optimization, feature adoption

EVENTS TRACKED:
  // Onboarding funnel
  dealer_registered, dealer_approved, first_vehicle_added,
  first_vehicle_published, first_lead_received, first_deal_created

  // Feature adoption
  vin_scan_used, automation_rule_created, website_published,
  custom_domain_connected, maestro_insight_actioned,
  gmc_connected, fb_catalog_connected

  // Engagement
  daily_summary_opened, morning_briefing_viewed,
  aging_vehicle_repriced, hot_lead_sms_clicked

  // Upgrade signals
  listing_limit_hit, staff_seat_limit_hit, feature_upgrade_prompted,
  plan_upgraded, plan_downgraded

// PostHog Node SDK
posthog.capture({
  distinctId: dealerId,
  event: 'first_vehicle_added',
  properties: {
    plan_tier: dealer.subscription_tier,
    days_since_registration: daysSinceReg,
    source: 'vin_scan' | 'manual',
  },
});

// Feature flags via PostHog (alternative to DB feature_flags for A/B testing):
const showNewDashboard = await posthog.isFeatureEnabled('new-dashboard-v2', dealerId);
```

### 11.4 Health Check Endpoints

```typescript
// GET /health → used by DigitalOcean App Platform health checks
// GET /health/ready → readiness check (DB + Redis connected)
// GET /health/live → liveness check (process alive)

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private redisHealth: RedisHealthIndicator,
    private bullHealth: BullHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database'),
      () => this.redisHealth.pingCheck('redis'),
      () => this.bullHealth.isHealthy('main-worker', { gracePeriodSeconds: 120 }),
    ]);
  }
}

// System Health Dashboard metrics (for admin panel):
@Get('admin/system/metrics')
@UseGuards(JwtAdminGuard)
async getSystemMetrics(): Promise<SystemMetrics> {
  const [queueDepths, dbPool, redisMemory, syncLag] = await Promise.all([
    this.bullMonitor.getQueueDepths(QUEUE_NAMES),
    this.prisma.$queryRaw`SELECT count FROM pg_stat_activity`,
    this.redis.info('memory'),
    this.syncMonitor.getAverageLag(),
  ]);

  return {
    queues: queueDepths,
    sync_lag_p95_ms: syncLag.p95,
    sync_within_sla_pct: syncLag.within2sPercent,
    db_connection_pool_used: dbPool.active,
    redis_memory_used_mb: redisMemory.used_memory / 1024 / 1024,
    api_p95_response_ms: await this.metricsService.getApiP95(),
    failed_jobs_24h: await this.bullMonitor.getFailedCount('24h'),
  };
}
```

---

*AutoVerse — Step 4: Engineering Architecture*
*NestJS Modules · Service Boundaries · Redis · BullMQ · WebSocket · RBAC*
*Built against Blueprint v7.0*
