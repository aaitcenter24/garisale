# AutoVerse — Master Goal Directive
## Complete Execution Constitution for Agentic AI
### Version 1.0 · Self-Contained · No External References Required

> **This document is the sole source of truth for building AutoVerse. It contains everything required to execute the project correctly. You have zero prior context. Read every section completely before writing a single line of code. Nothing in this document is optional. Nothing requires clarification from another source.**

---

## TABLE OF CONTENTS

1. [Project Identity & Scope](#1-project-identity--scope)
2. [Canonical Tech Stack as Hard Constraints](#2-canonical-tech-stack-as-hard-constraints)
3. [Execution Sequence with Acceptance Conditions](#3-execution-sequence-with-acceptance-conditions)
4. [Non-Negotiable Quality Gates](#4-non-negotiable-quality-gates)
5. [Decision Authority Rules](#5-decision-authority-rules)
6. [Failure & Rollback Protocol](#6-failure--rollback-protocol)
7. [Output & Code Standards](#7-output--code-standards)
8. [Final Success Definition](#8-final-success-definition)
9. [Appendix of Critical Reminders](#9-appendix-of-critical-reminders)

---

## 1. PROJECT IDENTITY & SCOPE

### 1.1 What AutoVerse Is

AutoVerse is a **Unified Automotive Ecosystem OS** for the Bangladesh used car market — the only platform where a dealer's inventory record in their private DMS **is simultaneously** the marketplace listing, the dealer website listing, the Google Merchant Center item, and the Facebook Catalog entry. No copy. No export. No manual repost. One record, projected in real time across every buyer-facing surface.

It operates as two coupled engines:

**Engine 1 — Dealer OS (B2B SaaS DMS)**
A complete dealership management system accessible at `app.autoverse.com.bd`. It provides: inventory management with mobile VIN scanning, recon task tracking, per-VIN expense accounting, CRM with an 8-stage lead pipeline, deal recording with Bill of Sale PDF generation, two-type expense accounting (per-vehicle and operational), an Automation Hub covering WhatsApp, Facebook, social media, email, and SMS, and Maestro AI — a nightly intelligence engine that surfaces pricing, demand, conversion, expense, and automation insights. The Dealer OS is role-gated (Owner / Manager / Salesperson) with field-level data isolation enforced at both the database (PostgreSQL Row-Level Security) and application (NestJS guards) layers.

**Engine 2 — Central Marketplace (B2C)**
A public marketplace at `autoverse.com.bd` serving buyers searching for used cars. Every active dealer vehicle is projected here with only public-safe fields. The marketplace's unique differentiator is the **IMV (Intelligent Market Value) deal rating system** — each listing is automatically rated as Great Deal / Good Deal / Fair Price / Overpriced / No Rating based on a statistical percentile model computed from comparable active listings. Buyers see price intelligence that does not exist on Bikroy.com, OLX, or Facebook Marketplace. The marketplace also supports C2C listings from private sellers (entering a moderation queue before going live) and programmatic SEO pages for every make/model/district combination.

**The Sync Engine (connecting the two)**
An event-driven bridge that listens to vehicle state changes in the Dealer OS and propagates them to the marketplace, the dealer's microsite, Google Merchant Center, Facebook Catalog, and WhatsApp buyer alerts — all within a 2-second p95 SLA. The sync engine uses BullMQ (Redis-backed job queue) with fan-out: one vehicle change triggers up to six parallel downstream updates. The sync engine enforces that **private financial fields (acquisition_cost, recon_total, net_profit_estimate, staff_notes) never appear in marketplace_listing records**. This isolation is structural — not configuration-dependent.

### 1.2 The BD Market Problem This Solves

The Bangladesh used car market is worth USD 1.54 billion (2025), growing at 7.1% CAGR. Four categories of existing platforms fail dealers and buyers:

**Failure Type A — Classified Marketplace Only (Bikroy, OLX, Facebook)**
No price intelligence, no dealer tools, no lead routing, no pipeline. Dealers list once and abandon. 40% of leads go cold with no follow-up. Buyers overpay 20–40% above market because no price context exists.

**Failure Type B — DMS/CRM Only (CDK Global, VinSolutions)**
USD 300–500/month — 10× AutoVerse's price. No marketplace. English-only UX designed for US/EU markets. Desktop-first in a market where 78% of dealer staff work on mobile. Onboarding takes weeks in a market where decision cycles are 1–3 days.

**Failure Type C — Dealer Website Builders Only (WordPress, Wix)**
Manual inventory management means dealers abandon the site after 2 weeks. No lead intelligence. No GMC/Facebook integration. No analytics.

**Failure Type D — Partial Marketplace + Incomplete Tools**
No BD presence. No DMS layer. No WhatsApp/SMS automation for BD communication patterns. Not built for bKash/Nagad payments.

AutoVerse is the only platform that simultaneously occupies all four quadrants: full DMS, marketplace with price intelligence, automatic dealer website, and automation across BD's primary communication channels.

### 1.3 Definition of Done

> **AutoVerse is complete when: a dealer in Dholaikhal, Dhaka can register on a phone, scan a VIN, list a vehicle, receive a marketplace enquiry from a buyer, reply via WhatsApp in under 30 seconds, track the lead through to deal closure with a generated Bill of Sale PDF, receive their first subscription invoice via bKash, and an admin can approve the dealer, moderate a C2C listing, and view platform revenue — all without errors, all within documented performance SLAs, and all with zero data leakage between tenants.**

---

## 2. CANONICAL TECH STACK AS HARD CONSTRAINTS

### 2.1 Absolute Constraint Rule

**The agent must not substitute, replace, propose alternatives to, or ask clarifying questions about any item in the following tables.** Every technology in this list was selected after full architectural analysis. Deviating from this stack without human approval is a protocol violation that requires immediate escalation (see Section 5).

### 2.2 Backend Stack

| Component | Technology | Version / Notes |
|---|---|---|
| API Framework | NestJS | TypeScript, modular monolith architecture |
| ORM | Prisma | v5, migrations additive-only on production |
| Database | PostgreSQL | v16, managed (DigitalOcean); RLS on all tenant tables |
| Cache + Queues | Redis | Upstash (serverless, pay-per-request); TLS required |
| Job Queue | BullMQ | All 18 named queues; see Section 2.6 |
| Search | MeiliSearch | Self-hosted on DigitalOcean Droplet |
| WebSocket | Socket.io | Real-time lead notifications to Dealer OS |
| File Storage | Cloudflare R2 | Photos, PDFs, feeds, exports |
| Image Processing | Sharp | Resize + WebP conversion, max 150KB/photo |
| PDF Generation | Puppeteer | Bill of Sale, invoices, valuation reports |
| Auth | Passport.js + JWT | RS256 asymmetric; separate signing keys for dealer vs admin |
| Validation | class-validator + class-transformer | Decorators on DTOs |
| Push Notifications | Firebase FCM | Mobile push to dealer devices |

### 2.3 Frontend Stack

| Component | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR (marketplace), ISR (dealer microsites), CSR (Dealer OS) |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS | Utility-first, mobile-first |
| Components | shadcn/ui | Accessible, unstyled base |
| State (client) | Zustand | Auth, UI flags only |
| State (server) | TanStack Query v5 | Caching, background refetch |
| Forms | React Hook Form + Zod | Shared with backend Zod schemas |
| Charts | Recharts | Analytics dashboards |
| Maps | @vis.gl/react-google-maps | Dealer location, listing map |
| Animations | Framer Motion | Micro-interactions |

### 2.4 Infrastructure & External Services

| Service | Provider | Purpose |
|---|---|---|
| Frontend Hosting | Vercel | Marketplace + Dealer OS + Admin panel |
| Backend API + Workers | DigitalOcean App Platform | 6 separate worker dyno processes |
| CDN + Security | Cloudflare | CDN, DDoS, DNS, custom domain routing |
| Custom Domain Router | Cloudflare Worker | Dealer custom domain → Next.js routing |
| Error Tracking | Sentry | All services; strip sensitive fields before send |
| Product Analytics | PostHog | Dealer behavior, feature adoption |
| Uptime Monitoring | BetterUptime | External; every critical endpoint |
| VIN Decode | NHTSA vPIC API | `https://vpic.nhtsa.dot.gov/api/` |

### 2.5 Payment & Communication Services

| Service | Provider | Configuration |
|---|---|---|
| Primary BD Mobile Payment | bKash Direct API | v1.2.0-beta, Tokenized Checkout |
| Secondary BD Mobile Payment | Nagad Direct API | RSA-signed requests |
| Card + Alternate Payments | SSLCommerz | IPN hash verification required |
| BD SMS | Greenweb BD | `api.greenweb.com.bd`; > 95% BD delivery rate |
| WhatsApp Automation | WhatsApp Business API (Meta) | Platform-level WABA; message templates pre-approved |
| Facebook/Instagram | Meta Graph API v19.0 | System User Token (never personal token) |
| Google Shopping | Google Merchant Center API | Content API; platform-level service account |
| Email | Resend | React Email templates; `@mail.autoverse.com.bd` |

### 2.6 BullMQ Queue Registry (All 18 Named Queues — Exact Names Required)

| Queue Name | Worker Dyno | Concurrency | Max Attempts | Backoff |
|---|---|---|---|---|
| `sync-vehicle` | main-worker | 10 | 4 | Exponential (5s, 10s, 40s, 160s) |
| `dealer-website-isr` | main-worker | 20 | 3 | Fixed 2s |
| `imv-recalculate` | analytics-worker | 20 | 2 | Fixed 60s |
| `lead-follow-up` | main-worker | 10 | 2 | Fixed 30s |
| `lead-contact-sla` | main-worker | 20 | 1 | None |
| `lead-score-update` | main-worker | 15 | 1 | None |
| `automation-whatsapp` | automation-worker | 5 | 3 | Exponential (5s, 30s, 300s) |
| `automation-facebook` | automation-worker | 5 | 3 | Exponential (10s, 100s, 1000s) |
| `automation-social` | automation-worker | 3 | 3 | Fixed 300s |
| `automation-email` | automation-worker | 10 | 3 | Exponential (30s, 300s, 3000s) |
| `automation-sms` | automation-worker | 10 | 2 | Fixed 60s |
| `notification-sms` | notification-worker | 20 | 3 | Exponential (5s, 30s, 300s) |
| `notification-push` | notification-worker | 20 | 2 | Fixed 10s |
| `maestro-insights` | analytics-worker | 5 | 1 | None |
| `daily-summary` | analytics-worker | 10 | 2 | Fixed 30s |
| `aging-watchlist` | analytics-worker | 5 | 1 | None |
| `gmc-feed-sync` | feed-worker | 5 | 3 | Exponential (10s, 100s, 1000s) |
| `facebook-catalog-sync` | feed-worker | 5 | 3 | Exponential (10s, 100s, 1000s) |

Dead-letter queues for failed-after-all-retries: `{queue-name}-failed`. All DLQ entries trigger System Admin in-app alert.

### 2.7 IMV Deal Rating Design Tokens (Non-Negotiable Colors)

| Rating | Badge Color (Hex) | Background (Hex) | Label |
|---|---|---|---|
| Great Deal | `#16A34A` (green-600) | `#DCFCE7` (green-100) | 🟢 Great Deal |
| Good Deal | `#0D9488` (teal-600) | `#CCFBF1` (teal-100) | 🟦 Good Deal |
| Fair Price | `#D97706` (amber-600) | `#FEF3C7` (amber-100) | 🟡 Fair Price |
| Overpriced | `#DC2626` (red-600) | `#FEE2E2` (red-100) | 🔴 Overpriced |
| No Rating | `#9CA3AF` (gray-400) | `#F3F4F6` (gray-100) | ⚪ No Rating |

Brand primary: `#2563EB` (blue-600). Background: `#F9FAFB`. Surface: `#FFFFFF`.

### 2.8 Six Worker Dyno Processes (Separate DigitalOcean App Platform Services)

| Dyno Name | Process Command | Queues Handled |
|---|---|---|
| `main-api` | `npm run start:api` | HTTP only (no BullMQ) |
| `main-worker` | `npm run start:worker:main` | sync-vehicle, isr, lead-follow-up, lead-contact-sla, lead-score-update, cache-invalidation |
| `automation-worker` | `npm run start:worker:automation` | automation-whatsapp, facebook, social, email, sms |
| `notification-worker` | `npm run start:worker:notification` | notification-sms, notification-push |
| `analytics-worker` | `npm run start:worker:analytics` | maestro-insights, daily-summary, aging-watchlist, imv-recalculate (nightly), lead-score-decay |
| `feed-worker` | `npm run start:worker:feed` | gmc-feed-sync, facebook-catalog-sync, subscription-billing, subscription-expiry |

---

## 3. EXECUTION SEQUENCE WITH ACCEPTANCE CONDITIONS

### Sequence Rule

**Steps are strictly sequential. Do not begin Step N+1 until every acceptance condition for Step N passes.** No exceptions. If an acceptance condition cannot be met, escalate using the format in Section 5.3 before continuing.

---

### 3.1 Step 1 — Infrastructure Foundation & Multi-Tenant Database

**What to build:**

- PostgreSQL database with all tables, ENUMs, constraints, indexes, triggers, and RLS policies as specified in Section 3 of the full blueprint
- Two database users: `app_user` (RLS enforced) and `migration_user` (BYPASSRLS, used only by Prisma migrate — never by application code)
- `DealerContextGuard`: reads `dealer_id` from JWT, calls `SET LOCAL app.current_dealer_id = '{uuid}'` via `prisma.$executeRaw`, rejects if dealer status = `terminated`
- RLS policy on every tenant table: `USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid)` — the `true` parameter causes NULL return (not error) when setting is absent, meaning 0 rows returned (fails safe, never fails open)
- JWT RS256 implementation: separate 2048-bit RSA key pairs for dealer tokens and HS256 for admin tokens; token TTLs: access = 900s, refresh = 2592000s
- Refresh token rotation with rotation attack detection: if a revoked refresh token is presented, revoke ALL sessions for that user
- OTP system: 6-digit, Redis TTL 300s, max 3 OTP requests per phone per 10 minutes, max 5 verification attempts per OTP
- Docker Compose for local development (PostgreSQL 16, Redis 7, MeiliSearch 1.6)
- All 20 PostgreSQL ENUM types defined
- All database indexes from the blueprint (40+ indexes including partial indexes on `status = 'active'` for marketplace_listing)
- Soft delete Prisma middleware (transparent to all callers)
- `mileage_bucket` auto-compute trigger, `updated_at` auto-update trigger, `deal_score` auto-compute trigger, sold/scrapped status guard trigger

**Acceptance Conditions — Step 1:**

- [ ] All 20 PostgreSQL ENUMs created and verified: `user_role`, `vehicle_status`, `lead_stage`, `deal_rating`, `sync_event_type`, and 15 others
- [ ] RLS test: create Dealer A and Dealer B; Dealer A JWT cannot retrieve any row belonging to Dealer B from any tenant table — verified across: vehicle, lead, deal, customer, vehicle_expense, operational_expense, automation_rule, automation_log, dealer_staff, dealer_settings, recon_assessment, recon_task, maestro_insight
- [ ] RLS fail-safe test: execute any SELECT on a tenant table with `app.current_dealer_id` NOT set → 0 rows returned (not an error, not all rows)
- [ ] All 25 multi-tenant penetration scenarios pass (listed below — all must return the indicated result):
  1. UUID substitution on GET /vehicles/:id → 404
  2. JWT dealer_id manipulation (altered payload) → 401 (signature invalid)
  3. dealership_id injection in POST body → ignored; vehicle created for JWT dealer
  4. Lead UUID substitution PUT /leads/:id/stage → 404
  5. Deal cross-access GET /deals/:id → 404
  6. Customer phone lookup across tenants → own customers only
  7. File upload path traversal (`../../etc/passwd`) → UUID filename assigned; no traversal
  8. Force-sync another dealer's vehicle → 404
  9. Marketplace listing → no private fields (acquisition_cost, recon_total absent from response)
  10. Expense IDOR GET /vehicles/:id/expenses → 404
  11. Automation rule cross-execution POST /automation/test/:id → 404
  12. SMS campaign targeting another dealer's customers → own customers only
  13. Marketplace search `?dealer_id=X` → public listing fields only
  14. Forced error → no stack trace in response (only `{ code, message }`)
  15. Timing attack on auth (known vs unknown phone) → response time identical ± 50ms
  16. OTP brute force (5 failed attempts) → OTP invalidated; account locked after 10 total login failures
  17. Admin panel from non-allowlisted IP → HTTP 404 (not 403)
  18. Payment IPN replay → idempotency prevents double-activation
  19. SQL injection in search filters → no SQL executed; 0 results
  20. NoSQL injection via MeiliSearch → literal string search
  21. Privilege escalation (role field in update body) → ignored
  22. C2C listing claiming dealer status → listing_type='c2c'; "Private Seller" badge only
  23. SSRF via webhook URL → rejected at configuration save time
  24. Bulk CSV import with dealer_id column → all records use JWT dealer_id
  25. Session fixation → new tokens always issued on login
- [ ] `mileage_bucket` trigger fires correctly: 0–29,999 → `'0-30K'`; 30,000–59,999 → `'30-60K'`; 60,000–99,999 → `'60-100K'`; ≥ 100,000 → `'100K+'`
- [ ] `deal_score` trigger: `(asking_price - imv_p50) / imv_p50` computed automatically on INSERT/UPDATE of asking_price or imv_p50; correct deal_rating assigned per thresholds (`< -0.15` → great_deal; `< -0.05` → good_deal; `< 0.10` → fair_price; `≥ 0.10` → overpriced; sample_size `< 10` → unrated regardless)
- [ ] Sold/scrapped guard trigger: UPDATE vehicle SET status='available' WHERE status='sold' → raises exception
- [ ] JWT RS256 access token: tampered payload (base64 edit without re-signing) → 401
- [ ] JWT admin HS256 token: rejected on dealer endpoint; dealer RS256 token: rejected on admin endpoint
- [ ] OTP rate limit: 4th OTP request for same phone within 10 minutes → 429
- [ ] Refresh token rotation attack: present a revoked refresh token → all sessions for that user revoked; new login required
- [ ] Docker Compose: `docker-compose up` runs all local services without errors; `prisma migrate dev` completes successfully

---

### 3.2 Step 2 — Dealer OS Core (Inventory, CRM, Sales, Expenses)

**What to build:**

**Inventory Module:**
- Vehicle CRUD with NestJS service, Prisma, RLS context injection
- VIN scanning: NHTSA vPIC API primary (`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{vin}?format=json`); BD supplement lookup fallback; Redis cache TTL 90 days per VIN; duplicate VIN check per dealer; validation: 17 chars, A–Z except I/O/Q, digits, check digit algorithm
- Photo upload pipeline: Multer multipart → Sharp (resize max 1200px, WebP, quality 82, max 150KB output) → Cloudflare R2; UUID filenames; min 4 photos required before marketplace publish; max 30 photos
- Stock number auto-generation: `SK-YYYYMM-XXXX` format; Redis INCR atomic counter per dealer per month
- Vehicle status state machine (enforced at API level, NOT just UI):
  - Valid transitions: `acquired→in_recon`, `acquired→available`, `in_recon→available`, `in_recon→acquired` (additional recon needed), `available→reserved`, `available→in_recon`, `available→scrapped`, `reserved→available` (deal void), `reserved→sold`
  - **Forbidden transitions (hard reject with 422)**: `sold→any`, `scrapped→any`, `available→acquired`, any backward transition past recon
  - All transitions logged to `vehicle_status_history` with user_id, timestamp, reason
- Recon workflow: assessment (8 categories × 3 statuses), tasks (assigned, estimated/actual cost), auto-create `vehicle_expense` Type 1 on task completion, auto-update `vehicle.recon_total`, notification when all tasks complete
- Aging watchlist: daily cron (6:00 AM BD), tiers at 30/45/60/90 days; 45-day → SMS to manager; 60-day → SMS to owner + Maestro PRICING insight; 90-day → daily SMS + mandatory disposition dialog

**CRM Module:**
- Lead pipeline: 8 stages (`new → contacted → qualified → test_drive → quote_sent → negotiation → closed → lost`); `lost_reason` mandatory when stage = `lost` (422 if absent); 2-hour contact SLA timer (BullMQ `lead-contact-sla` delayed job, cancelled when lead moves from `new`); round-robin assignment
- Lead deduplication: same phone + same vehicle_id + stage in (new/contacted) within 30 days → merge (increment enquiry_count), not duplicate
- Lead scoring: signal weights table below; decay −2 per day (BullMQ cron 3:30 AM); floor = 0; hot threshold = 70 (immediate SMS + push to assigned salesperson within 60 seconds); score stored in Redis and DB
- Customer records: created on first lead from a phone number; upserted, not duplicated

| Signal | Weight |
|---|---|
| enquiry_submitted | +30 |
| phone_number_revealed | +20 |
| test_drive_scheduled | +20 |
| returning_buyer | +20 |
| whatsapp_message_sent_by_buyer | +15 |
| referred_by_customer | +15 |
| vehicle_viewed_3_plus_times | +15 |
| multiple_vehicles_same_make | +10 |
| returned_to_listing_next_day | +10 |
| vehicle_saved | +10 |
| budget_matches_price | +10 |
| responded_to_automation | +8 |
| clicked_email_link | +7 |
| personalized_link_viewed | +5 (cap +15) |
| opened_email | +3 |
| no_response_to_3_followups | −20 |
| unsubscribed_whatsapp | −30 |
| marked_not_interested | −25 |
| budget_too_low | −15 |
| window_shopper_pattern | −10 |
| decay_per_day (no interaction) | −2 |

**Sales Module:**
- Deal record: states `draft → pending_approval → approved → delivered → cancelled`; `delivered` and `cancelled` are terminal states
- Discount threshold: if `discount_amount / list_price > dealership.discount_threshold_pct / 100` → status must go through `pending_approval`; manager/owner approval required
- Bill of Sale PDF: Puppeteer headless Chrome; all required fields (dealer info, buyer info, vehicle details, price, payment method, signature fields); stored in R2 at `invoices/{dealership_id}/deals/{deal_id}/bill_of_sale_{version}.pdf`; generation time target < 5 seconds
- Deal payments: deposit, instalment, final; balance_due computed; vehicle → reserved on deal creation; vehicle → sold on deal delivered; vehicle → available on deal cancelled

**Expense Module:**
- Type 1 (vehicle_expense): attached to vehicle_id; feeds profit calculator live; visible to Owner + Manager; completely hidden from Salesperson (section not rendered in DOM, fields return null in API)
- Type 2 (operational_expense): dealership-level; Owner sees full detail; Manager sees totals only; Salesperson sees nothing
- Profit calculator: `asking_price − acquisition_cost − recon_total − deal_level_costs`; updates live on any expense change; visible only to Owner

**RBAC (enforced at API level, field-level in service layer):**
All role checks must be enforced in NestJS service methods, not only in guards. Financial fields (`acquisition_cost`, `recon_total`, `net_profit_estimate`, `floor_plan_cost`, `gross_profit`) return `null` for Manager and Salesperson — never omitted (omission causes frontend errors).

**Acceptance Conditions — Step 2:**

- [ ] All 90 role-based test scenarios pass (organized by module below):

  **Inventory (Tests #1–#20):**
  - [ ] #1 Owner creates vehicle → 201
  - [ ] #2 Manager creates vehicle → 201
  - [ ] #3 Salesperson creates vehicle → 201
  - [ ] #4 Owner GET vehicle → all fields including acquisition_cost
  - [ ] #5 Manager GET vehicle → acquisition_cost = null; recon_total visible
  - [ ] #6 Salesperson GET vehicle → acquisition_cost = null; recon_total = null; net_profit = null
  - [ ] #7 Owner updates asking_price → 200
  - [ ] #8 Manager updates asking_price → 200
  - [ ] #9 Salesperson updates asking_price → 403
  - [ ] #10 Owner changes vehicle status → 200
  - [ ] #11 Manager changes vehicle status → 200
  - [ ] #12 Salesperson changes vehicle status → 403
  - [ ] #13 Owner soft-deletes vehicle → 200
  - [ ] #14 Manager soft-deletes vehicle → 200
  - [ ] #15 Salesperson soft-deletes vehicle → 403
  - [ ] #16 Any role uploads photos to own dealer vehicle → 200
  - [ ] #17 Manager toggles marketplace_published → 200; Salesperson → 403
  - [ ] #18 Owner views profit calculator → visible
  - [ ] #19 Manager views profit calculator → null (not rendered)
  - [ ] #20 Salesperson views profit calculator → null (not rendered)

  **CRM (Tests #21–#36):**
  - [ ] #21 Owner views all leads → all returned
  - [ ] #22 Manager views all leads → all returned
  - [ ] #23 Salesperson views leads (sees_all_leads=false) → own leads only
  - [ ] #24 Salesperson views leads (sees_all_leads=true) → all returned
  - [ ] #25–#27 Owner/Manager reassign lead → 200; Salesperson reassign → 403
  - [ ] #28 Salesperson updates stage on own lead → 200
  - [ ] #29 Salesperson updates stage on other's lead (sees_all=false) → 403
  - [ ] #30 Mark lead lost without lost_reason → 422 with code `LEAD_LOST_REASON_REQUIRED`
  - [ ] #31 Mark lead lost WITH lost_reason → 200
  - [ ] #35 Lead score field visible to Salesperson → yes (helps prioritize)
  - [ ] #36 budget fields visible to Salesperson → yes

  **Sales/Deals (Tests #37–#50):**
  - [ ] #37 Salesperson creates deal on own lead → 201 (draft)
  - [ ] #39–#41 Owner/Manager approve deal within threshold → 200; Manager approve above threshold → 403; Salesperson approve → 403
  - [ ] #43 Owner views gross_profit → visible; #44 Manager → null; #45 Salesperson → null
  - [ ] #47 Salesperson cancels deal → 403
  - [ ] #49 Salesperson views all deals → own deals only
  - [ ] #50 Salesperson records payment → 403

  **Analytics/Expenses (Tests #51–#62):**
  - [ ] #51 Owner views revenue analytics → full including GP, margins
  - [ ] #52 Manager views revenue analytics → revenue figures null
  - [ ] #54 Owner views Type 2 expenses → all items + receipts
  - [ ] #55 Manager views Type 2 expenses → totals only (no line items)
  - [ ] #56 Salesperson views Type 2 expenses → 403
  - [ ] #57–#58 Owner/Manager add Type 1 expense → 201
  - [ ] #59 Salesperson adds Type 1 expense → 403
  - [ ] #60 Owner adds Type 2 expense → 201; #61 Manager adds Type 2 → 403

  **Settings/Admin (Tests #64–#74):**
  - [ ] #64 Owner adds team member → 201; #65 Manager → 403; #66 Salesperson → 403
  - [ ] #67 Owner changes subscription plan → 200; #68 Manager → 403
  - [ ] #71–#72 Owner/Manager edit Automation Hub rules → 200
  - [ ] #73 Salesperson views Automation Hub → read-only (no write endpoints)
  - [ ] #74 Salesperson edits WhatsApp template → 403

  **Admin Role Tests (Tests #81–#92):**
  - [ ] #81 Operations Manager approves dealer → 200
  - [ ] #82 Operations Manager terminates dealer → 403 (Super Admin only)
  - [ ] #85 Content Moderator approves C2C listing → 200
  - [ ] #86 Content Moderator views dealer billing → 403
  - [ ] #87 Marketing Admin submits IMV override request → 200
  - [ ] #88 Marketing Admin approves IMV override → 403
  - [ ] #89 System Admin toggles feature flag → 200
  - [ ] #91 Super Admin impersonates dealer → 200
  - [ ] #92 Operations Manager impersonates dealer → 403

- [ ] Vehicle status state machine: attempt `sold → available` → 422 with code `VEHICLE_SOLD_IMMUTABLE`
- [ ] Vehicle status state machine: attempt `available → acquired` → 422 with code `VEHICLE_STATUS_TRANSITION_INVALID`
- [ ] All status transitions logged to `vehicle_status_history` with user_id and timestamp
- [ ] Bill of Sale PDF generated in < 5 seconds; stored in R2; URL returned in response
- [ ] Photo upload: Sharp compresses to WebP ≤ 150KB; UUID filename in R2; no path traversal possible
- [ ] VIN decode: NHTSA API called; result cached in Redis TTL 7,776,000s (90 days); BD supplement lookup on cache miss
- [ ] Lead deduplication: same phone + same vehicle creates 1 lead with enquiry_count=2, not 2 leads
- [ ] Lost reason required: moving lead to `lost` without `lost_reason` body field → 422
- [ ] Hot lead SMS: when lead_score crosses 70 → notification-sms job queued within 5 seconds; SMS content includes buyer name, vehicle, score, phone number
- [ ] Profit calculator: adds vehicle_expense → `vehicle.recon_total` updates via trigger → `net_profit_estimate` recomputed
- [ ] Type 1 expense section not rendered for Salesperson (field returns null; not 403 — returns null to prevent frontend errors)
- [ ] Type 2 expense totals only for Manager: `SELECT SUM(amount) GROUP BY category` (no line items, no vendors, no receipts)

---

### 3.3 Step 3 — Sync Engine & Real-Time Layer

**What to build:**

- SyncModule: event listeners on `EventEmitter2` for all `inventory.vehicle.*` and `sales.deal.*` events; dispatches to `sync-vehicle` BullMQ queue
- SyncJobProcessor: reads vehicle record → builds public-safe marketplace_listing payload → UPSERT marketplace_listing → updates MeiliSearch; optimistic lock: `WHERE updated_at < job_event_timestamp`
- Fan-out jobs dispatched in parallel (not sequential) after sync completes:
  1. `dealer-website-isr`: POST Next.js revalidation endpoint
  2. `gmc-feed-sync`: update single GMC item (if dealer plan ≥ Professional and gmc_connected = true)
  3. `facebook-catalog-sync`: update single FB catalog item (same plan condition)
  4. `whatsapp-inventory-alert`: find opted-in customers with matching preferences → BullMQ job
  5. `buyer-price-drop-alert`: if price dropped → notify saved buyers via push/SMS
  6. `redis-cache-invalidation`: DEL `cache:search:*` matching affected clusters; DEL `cache:imv:*` if price changed
- Per-dealer sync rate limiting: Redis INCR `sync_rate:{dealer_id}:{unix_minute}`; max 30 sync events per dealer per minute; if exceeded → batch (last state wins)
- BullMQ job deduplication for rapid price changes: `jobId: 'sync:{vehicle_id}'` → new job replaces pending job for same vehicle
- Sync failure handling: after 4 attempts → DLQ (`sync-vehicle-failed`); System Admin in-app alert; dealer UI shows "⚠️ Sync error — Last synced X min ago" via Redis key `sync_error:{vehicle_id}`; manual retry button (POST `/vehicles/:id/force-sync`)
- Socket.io: `dealer:{dealerId}` room; emit `vehicle.synced` event within 1 second of successful sync; emit `vehicle.sync_failed` on DLQ entry
- Sync audit log: every sync attempt written to `sync_audit_log` with status, duration_ms, event_type, fan-out results

**Private fields that must NEVER appear in marketplace_listing:**
`acquisition_cost`, `recon_total`, `net_profit_estimate`, `floor_plan_cost`, `internal_notes`, `staff_notes`

**Sync event type map:**

| Trigger | Event | Sync Job |
|---|---|---|
| vehicle created + marketplace_published = true + ≥ 4 photos | `inventory.vehicle.created` | `sync_vehicle.create` |
| asking_price changed | `inventory.vehicle.updated` (changed_fields includes asking_price) | `sync_vehicle.price_update` |
| status changed | `inventory.vehicle.status_changed` | `sync_vehicle.status_change` |
| photos updated | `inventory.vehicle.photos_updated` | `sync_vehicle.photo_update` |
| marketplace_published toggled | `inventory.vehicle.visibility_toggled` | `sync_vehicle.visibility_toggle` |
| vehicle soft-deleted | `inventory.vehicle.deleted` | Hard-delete marketplace_listing |
| recon complete (all tasks done) | `inventory.recon.all_tasks_complete` | Same as `sync_vehicle.create` if new; status update if existing |
| deal delivered | `sales.deal.delivered` | `sync_vehicle.sold` — listing status → sold; archive after 7 days |
| deal cancelled | `sales.deal.cancelled` | `sync_vehicle.restore` — listing status → active |
| dealer suspended | `dealer.suspended` | Hide all dealer's listings |
| dealer reinstated | `dealer.reinstated` | Restore all dealer's listings |

**Acceptance Conditions — Step 3:**

- [ ] **Sync SLA**: under 100 simultaneous vehicle price updates, p95 sync time (vehicle update → marketplace_listing updated + MeiliSearch updated) < 2,000ms measured end-to-end
- [ ] Fan-out runs in parallel: ISR revalidation, GMC, FB catalog, and Redis cache invalidation all dispatched simultaneously (not sequentially); verify via job queue timestamps
- [ ] **Private field isolation test**: create vehicle with `acquisition_cost = 500000`; retrieve via `GET /marketplace/listings?make=Toyota`; response must contain NO field named `acquisition_cost`, `recon_total`, `net_profit_estimate`, or `floor_plan_cost` at any nesting level
- [ ] Sync deduplication: update vehicle price 5 times within 3 seconds → only 1 BullMQ job in `sync-vehicle` queue (previous jobs replaced by latest via `jobId` deduplication)
- [ ] Per-dealer rate limiting: 31 sync events within 60 seconds for same dealer → 31st event batched; queue depth does not exceed 30 for single dealer
- [ ] DLQ flow: disconnect MeiliSearch; trigger sync; all 4 retry attempts fail; job lands in `sync-vehicle-failed` DLQ; System Admin in-app notification appears; dealer UI shows "Sync error" badge; manual retry button visible on stock card
- [ ] Socket.io: dealer browser receives `vehicle.synced` event within 1 second of successful sync (measured from sync job completion to WebSocket event delivery)
- [ ] Dealer suspension: `dealer.suspended` event → all dealer's active marketplace_listings updated to `status = 'hidden'` within 60 seconds; GET /marketplace/search returns 0 listings for that dealer
- [ ] Dealer reinstatement: `dealer.reinstated` event → all previously hidden listings restored to `status = 'active'` within 60 seconds
- [ ] Sold vehicle: `deal.delivered` → listing shows `status = 'sold'` immediately; BullMQ delayed job created to archive listing after 7 days (168 hours)
- [ ] Sync audit log: every sync attempt written to `sync_audit_log`; verify via SELECT after 10 sync events

---

### 3.4 Step 4 — Marketplace & Dealer Website Builder

**What to build:**

**Marketplace (Next.js — mixed rendering):**
- `/` homepage: ISR revalidate 60s; featured vehicles, deal rating showcase, make grid, price trends teaser
- `/search`: SSR; MeiliSearch query with all filterable/sortable attributes; facet distribution; skeleton loading
- `/cars/[slug]`: ISR revalidate 300s; demand-triggered revalidation; full vehicle detail with IMV bar widget, Schema.org/Vehicle structured data
- `/dealers/[slug]`: ISR revalidate 300s; dealer profile with all active listings
- `/cars/[make]/[model]`: SSG; programmatic make/model browse
- `/cars/[district]`: SSG; district browse
- `/trends/[make]/[model]`: ISR revalidate 86400s; price trend charts from `price_trend` table
- `/sell`: CSR; C2C wizard (5 steps; real-time IMV widget updates deal rating preview as price is typed, debounced 500ms)
- `/value-my-car`: CSR; valuation tool
- MeiliSearch index: `marketplace_vehicles`; searchable: title, make, model, description, district; filterable: all spec fields + deal_rating + seller_type + is_featured + status; sortable: price, mileage_km, created_at, deal_score, views; ranking: words → typo → proximity → attribute → sort → exactness → custom (is_featured DESC)

**Buyer Features:**
- Buyer enquiry form (POST `/marketplace/leads`): creates lead in dealer CRM, source = `marketplace`; buyer receives SMS confirmation; WhatsApp Day 0 automation fires if dealer has WABA connected
- `saved_vehicle`: buyer saves listings; price drop alert subscription
- `saved_search`: buyer saves search filters + alert preferences (push/SMS/email)
- View counter: Redis INCR `views:{listing_id}` on page load; synced to `marketplace_listing.views` every 15 minutes via BullMQ

**Dealer Website Builder:**
- Sub-10-minute setup wizard (4 steps): Brand Setup → Live Review → Custom Domain → Channel Connections
- Subdomain provisioning: `{slug}.autoverse.com.bd` (instant); auto-populate inventory; inject Facebook Pixel if configured; setup GA4 if configured; generate sitemap and submit to GSC
- ISR microsite: every vehicle on subdomain at `{slug}.autoverse.com.bd/{slug}/cars/{vehicle_slug}`; revalidated on every sync event; SEO title: `[Year] [Make] [Model] for Sale in [District] | [Dealer Name]`; Schema.org/Vehicle structured data on every listing
- Custom domain: CNAME verification via Cloudflare Worker; Cloudflare Worker implementation (see Section 2.2 for `Env` interface and routing logic); KV cache TTL 300s per domain; suspended dealer → 503 maintenance page; terminated → 404
- Channel connections: GMC (per dealer), Facebook Catalog (per dealer), Facebook Pixel (auto-inject), GA4 (auto-setup)

**GMC Feed:**
- Feed URL: `api.autoverse.com.bd/feeds/gmc/{dealership_id}?key={feed_key}`
- Full sync: every 6 hours (BullMQ cron in `feed-worker`)
- Instant sync: price change, status change, new listing (via `gmc-feed-sync` queue)
- Fields: id, title, description, link, image_link, price (format: `"1450000 BDT"`), condition, brand, model, year, mileage, VIN, color, fuel_type, custom_label_0 (deal_rating), custom_label_1 (body_type), availability
- Error logging: rejections logged in `gmc_feed_log`; alert if > 10% rejection rate for any dealer

**Facebook Catalog:**
- Automotive vertical catalog created per dealer on channel connection
- Batch upload via Graph API (up to 5,000 items per request)
- DVA (Dynamic Vehicle Ads) enabled via ViewContent Pixel event: `fbq('track', 'ViewContent', { content_ids: [listing_id], content_type: 'vehicle', value: price, currency: 'BDT' })`

**Acceptance Conditions — Step 4:**

- [ ] MeiliSearch search p95 < 200ms at 100 RPS sustained (k6 load test with common filter combinations)
- [ ] Search with `make=Toyota&district=Dhaka&status=active` returns only active Toyota listings in Dhaka; `deal_rating` facet counts correct
- [ ] Featured listings appear first in search results before non-featured at equal relevance score
- [ ] Buyer enquiry (POST `/marketplace/leads`) → lead appears in dealer CRM within 60 seconds; lead.source = `marketplace`; buyer receives confirmation SMS within 60 seconds
- [ ] Schema.org/Vehicle structured data validates: use Google's Rich Results Test (or structured data linter) on a vehicle detail page; all required fields present
- [ ] ISR revalidation: update a vehicle price in Dealer OS → `/cars/[slug]` page shows new price within 10 seconds (ISR on-demand revalidation triggered by sync engine)
- [ ] Custom domain routing: configure CNAME `test.dealer.com → dealer.autoverse.com.bd`; visiting `test.dealer.com` serves correct dealer's inventory with correct branding; Cloudflare KV lookup verified working
- [ ] Dealer suspended → custom domain returns 503 maintenance page within 60 seconds
- [ ] GMC feed accessible at `api.autoverse.com.bd/feeds/gmc/{dealerId}?key={key}`; feed key validates; response is valid RSS 2.0 XML with at least one item containing all required fields
- [ ] C2C wizard: entering a price → IMV bar widget updates deal rating badge within 500ms (debounce)
- [ ] C2C listing moderation queue: submitted listing appears in admin moderation queue; approved listing appears in search results
- [ ] Price drop alert: reduce vehicle price → `buyer-price-drop-alert` job queued for buyers who saved the listing
- [ ] Programmatic SEO pages: `/cars/toyota/axio` and `/cars/dhaka` pages render with correct listings; no 404s on make/model/district combinations present in the database
- [ ] Sitemap generated and reflects current inventory; submitted to GSC endpoint

---

### 3.5 Step 5 — IMV Algorithm & Maestro AI Engine

**What to build:**

**IMV Algorithm:**
- Cluster key: `make + model + year + mileage_bucket + condition + district`
- Percentile computation SQL (run per cluster): `PERCENTILE_CONT(0.05/0.10/0.25/0.50/0.75/0.90/0.95/0.99)` using `WITHIN GROUP (ORDER BY asking_price)` from `marketplace_listing WHERE status='active' AND created_at >= NOW() - INTERVAL '90 days' AND is_featured = false`
- IQR outlier removal applied when `sample_size >= 10`
- Geographic fallback: district → division → national → condition-relaxed → mileage-relaxed → unrated
- Confidence levels: `none` (< 5 samples), `low` (5–9), `medium` (10–29), `high` (≥ 30)
- Deal score: `(asking_price - imv_p50) / imv_p50`; stored as `DECIMAL(6,4)`
- Rating thresholds: `< -0.15` → great_deal; `< -0.05` → good_deal; `< 0.10` → fair_price; `≥ 0.10` → overpriced; sample_size < 10 → unrated (regardless of score)
- Nightly job (BullMQ cron `0 2 * * *`): Stage 1 snapshot prev_p50 → Stage 2 identify active clusters → Stage 3 compute percentiles (parallel, 20 workers) → Stage 4 bulk UPDATE marketplace_listing (batches of 1,000 rows with 50ms sleep to avoid row lock contention) → Stage 5 bulk update MeiliSearch (batches of 5,000) → Stage 6 Redis cache flush → Stage 7 store daily price trend record → Stage 8 log to `imv_calculation_run`
- Instant recalculation: triggered on price change event; uses Redis cached cluster (TTL 3,600s); if miss → compute for this cluster only; target < 200ms
- IMV override: Marketing Admin requests → Super Admin approves; types: `adjust_p50_by_percent`, `set_manual_p50`, `suppress_rating_for_period`; mandatory expiry (max 90 days); logged to `platform_audit_log`

**Maestro Insight Engine:**
- Nightly job (BullMQ cron `0 2 30 * * *` — 2:30 AM, 30 min after IMV): per-dealer jobs queued (one per active paying dealer); 5 parallel workers
- Per-dealer job: batch-fetch all dealer data (vehicles, leads, deals, expenses, automation stats, demand signals) in parallel queries → run 6 evaluators → sort by priority → store top 5 in `maestro_insight` (replace previous night's unactioned) → cache in Redis TTL 86,400s
- Six evaluator types with trigger conditions and priority scoring:

| Type | Base Priority | Key Trigger | Guard (minimum threshold) |
|---|---|---|---|
| PRICING | 5 | days_on_lot ≥ 45 AND deal_score > 0 | imv_sample_size ≥ 10; no insight if cluster unrated |
| DEMAND | 4 | pct_change_30d ≥ +10% AND dealer has 0 stock | sample_size ≥ 10 AND listing_count ≥ 5 |
| CONVERSION | 6 | avg_response_time > 2h OR ≥ 3 leads lost to no-response | ≥ 10 leads per source for rate comparison |
| EXPENSE | 3 | avg_recon_cost > imv_p50 × target_margin_pct | ≥ 5 vehicles same make/model with completed recon |
| AUTOMATION | 3 | away messages ≥ 20 with no follow-up; feature unused | No threshold — intent-based |
| RECON_QUALITY | 4 | avg recon time > 14 days OR task stuck > 7 days | No threshold |

- Recommended price calculation in PRICING insight: `target_good_deal = imv_p50 × 0.94`; `reduction_rounded = ROUND((asking_price - target_good_deal) / 5000) × 5000`
- **Critical data quality guard**: if imv_p50 IS NULL for a vehicle's cluster → NO PRICING insight generated; show "Building your intelligence..." instead
- Deep links: every insight card has `deep_link` field pointing to the exact screen+action that resolves it

**Daily Summary:**
- BullMQ cron `45 7 * * *` (7:45 AM BD = 1:45 UTC): assemble per-dealer summary data
- Delivery at 8:00 AM: in-app (full detail, Morning Briefing tab) + SMS (condensed ≤ 160 chars, English) + FCM push
- SMS format: `"AutoVerse {date}: {N} sale(s), BDT {X}L. Urgent: {top_action}. app.autoverse.com.bd"`
- Revenue format: lakh notation (`1,200,000 BDT` → `"12L"`)
- Top 3 urgent actions priority: 1. pending_deal_approvals, 2. uncontacted_leads_2h+, 3. 90-day vehicles, 4. follow_ups_due, 5. 60-day vehicles, 6. 45-day vehicles

**Lead Scoring Execution:**
- `LeadScoringService.recordSignal(leadId, signalType)`: debounced 60s per signal per lead (Redis); adds to `lead-score-update` queue with `jobId: 'score:{leadId}'` (deduplication)
- Processor: atomic `UPDATE lead SET lead_score = LEAST(200, GREATEST(0, lead_score + delta))` then check hot threshold
- Daily decay: BullMQ cron `30 3 * * *`; single bulk UPDATE (not per-lead jobs); skip leads with qualifying interaction today

**Acceptance Conditions — Step 5:**

- [ ] **Nightly IMV runtime**: run full recalculation against 50,000 synthetic `marketplace_listing` rows; complete in < 15 minutes; verify via `imv_calculation_run.completed_at - started_at`
- [ ] **IMV insufficient data guard**: cluster with 3 listings → `deal_rating = 'unrated'`; no PRICING Maestro insight generated for any vehicle in this cluster; UI shows "No Rating" grey badge
- [ ] IMV fallback: no Dhaka-specific data for a cluster → falls back to division-level → correct note shown: "Based on [Division] region data"
- [ ] Deal score formula: vehicle asking_price=1,200,000 and imv_p50=1,400,000 → `deal_score = -0.1429`; rating = `good_deal` (between -0.15 and -0.05)
- [ ] Nightly recalculation: batch UPDATE uses 1,000-row batches with 50ms sleep; no row locks held for > 200ms; concurrent dealer price update succeeds during batch run without timeout
- [ ] Maestro PRICING insight: vehicle with 52 days on lot, imv_sample_size=23, asking_price 15% above imv_p50 → PRICING insight generated with priority ≥ 7; recommended_price = imv_p50 × 0.94 rounded to nearest 5,000; deep_link points to vehicle stock card
- [ ] **Lead score hot threshold**: record signal `vehicle_viewed_3_plus_times` (+15) on a lead at score 62 → score becomes 77; `notification-sms` job queued within 5 seconds with correct hot lead SMS content
- [ ] Lead score decay: lead with no interaction for 3 days and score 50 → score = 44 (50 − 2 − 2 − 2) after 3 nightly decay runs
- [ ] Daily summary SMS: correct ≤ 160 character format; lakh notation verified; top urgent action present
- [ ] Daily summary: if 0 sales and 0 leads → SMS still sent (not suppressed); contains market snapshot or encouraging note
- [ ] CONVERSION insight: dealer with avg response time 4.2h → insight generated with priority ≥ 8 (base 6 + +2 for avg > 4h); message includes avg response time and uncontacted count

---

### 3.6 Step 6 — Automation Hub

**What to build:**

**AutomationRuleEngine:**
- Evaluate on every trigger event: find rules matching `(dealership_id, trigger_event, is_active=true)` → check rate limits → check opt-out → check contact daily limit (max 3 messages any channel per 24h) → execute or skip
- Loop detection: `chain_depth` counter per execution context; abort at depth ≥ 3; circular reference check (rule A emits event that would re-trigger rule A)
- Rate limit enforcement per channel per dealer per day (Redis INCR with end-of-day expiry):
  - WhatsApp: 1,000/day
  - SMS: per plan (Free=100, Starter=500, Professional=2,000, Business=5,000)
  - Social posts: 3/day (configurable, max 5)
  - Email: unlimited (Resend limits apply)
  - Push: unlimited
- Alert at 80% consumption; block (not drop — queue for next day) at 100%
- Opt-out enforcement: check `customer.opted_in_{channel}` before every send; cannot be bypassed by any dealer action

**WhatsApp Automation (Basic — all plans):**
- Greeting message: fires once per contact (lifetime); only if configured by dealer (no default auto-send)
- Away message: fires outside `business_hours`; max 1 per contact per 6-hour window
- Quick replies: 10 pre-saved templates; accessible from Lead Card WhatsApp button

**WhatsApp Automation (Advanced — Professional+, WABA required):**
- Lead follow-up sequence (4-step): Day 0 instant (within 60 seconds), Day 1 (if no reply), Day 3 (if no reply), Day 7 (if no reply AND lead not cold)
- Condition evaluation for "no reply": check `lead_interaction` for any inbound_whatsapp after sequence start; if found → cancel remaining steps
- Abandoned lead recovery: trigger if `lead.updated_at < NOW() - INTERVAL '7 days'` AND stage not closed/lost; one message per lead
- Post-sale sequence: Day 3, Day 30, Day 180, Day 365; trigger on `deal.delivered`
- New inventory alert: trigger on `vehicle.available`; max 2 alerts per customer per 7 days; filter by customer preferences
- Sequence cancellation: any of → inbound message from buyer; stage moves to test_drive/negotiation/closed/lost; salesperson manually cancels
- All templates: must have opt-out footer "Reply STOP to unsubscribe"

**Facebook Automation:**
- Inbox auto-reply (first message from new contact); away message; keyword triggers (case-insensitive, Unicode/Bangla supported); Lead Ad → CRM sync (< 90 seconds); inbox routing by vehicle mention; post scheduling

**Social Media Automation:**
- Scheduled campaign manager: select vehicles by days_on_lot DESC + deal_rating DESC; frequency cap 3/day; optimal posting time from Facebook Insights or default 9:00 AM
- Post creator: caption from body-type template + dealer branding; approval required toggle

**Marketing Automation:**
- Email sequences (Welcome/New Lead, Post-Sale, Win-Back) via Resend
- Hot lead SMS: immediate (`notification-sms` queue, priority=1) when score ≥ 70; content: buyer name, score, vehicle, phone number
- SMS campaign manager (Owner only): segment targeting, 160-char counter, mandatory opt-out append
- Personalized vehicle links: `{slug}.autoverse.com.bd/for/{lead_token}` (JWT with lead_id, expiry 30 days); each view → `+5` lead score (cap +15)

**Eid/Festival mode:**
- Platform calendar table pre-loaded with BD public holidays and Eid dates
- Suppressed during festivals: non-Day-0 lead sequences, Tier 1/2 aging alerts, social auto-posts, win-back campaigns
- Never suppressed: Day 0 instant reply, hot lead SMS, deal delivery confirmations, SLA breach alerts, inventory alerts (pre-Eid demand peak)
- Dealer can override festival suppression in Settings

**Acceptance Conditions — Step 6:**

- [ ] **WhatsApp Day 0 auto-reply**: submit marketplace enquiry → WhatsApp message sent within 60 seconds (measured from lead.created_at to automation_log.sent_at)
- [ ] Day 1 follow-up NOT sent if buyer replied to Day 0: create lead → send Day 0 → log inbound whatsapp interaction → wait > 24 hours → Day 1 job processes → condition evaluated → Day 1 NOT sent (cancelled)
- [ ] Day 1 follow-up IS sent if buyer did NOT reply: same setup, no inbound interaction → Day 1 IS sent after 24 hours delay
- [ ] **Loop detection**: configure Rule A (trigger=lead.created → send_whatsapp) and Rule B (trigger=whatsapp.received → create_lead); send WhatsApp received event → Rule B fires → Rule A would fire again at chain_depth=1 → loop detected → Rule A blocked; `automation_log` shows `loop_detected` for blocked rule
- [ ] **Contact daily limit**: send 3 automated messages to same contact (any channel combination); 4th message → `automation_log.status = 'skipped'` with reason `contact_daily_limit`; 4th message NOT delivered
- [ ] Opt-out enforcement: set `customer.opted_in_sms = false`; trigger automation-sms job for this contact → `automation_log.status = 'opted_out'`; SMS NOT sent to Greenweb API
- [ ] Rate limit alert: reach 80% WhatsApp daily limit (800/1000) → in-app notification delivered to dealer dashboard
- [ ] Rate limit carry-forward: trigger 1,001st WhatsApp message → job NOT dropped; BullMQ delayed job created for 9:00 AM next day; `automation_log.status = 'queued'` with scheduled send time
- [ ] Facebook Lead Ad sync: POST test payload to `/automation/facebook/webhook` (with valid Meta signature) → lead created in dealer CRM within 90 seconds; `lead.source = 'facebook_lead_ad'`
- [ ] Festival mode: load Eid date in `platform_calendar`; trigger Day 1 follow-up during Eid → job processed but message NOT sent; Day 0 instant reply during Eid → IS sent
- [ ] WhatsApp webhook signature verification: POST to webhook endpoint with invalid `x-hub-signature-256` → 401 rejected; lead NOT created
- [ ] SMS opt-out: send SMS with "Reply STOP to unsubscribe" appended; POST Greenweb STOP callback → `customer.opted_in_sms` set to false → future automation-sms jobs for this contact skipped

---

### 3.7 Step 7 — Payments & Billing

**What to build:**

**bKash Direct API (v1.2.0-beta, Tokenized Checkout):**
- Access token: POST to `/tokenized/checkout/token/grant`; cache in Redis `cache:bkash:access_token` TTL 3,500s; auto-refresh using refresh_token before expiry; circuit breaker: 3 consecutive auth failures in 5 minutes → open circuit 5 minutes → System Admin alert
- Create payment: POST `/tokenized/checkout/create`; `merchantInvoiceNumber` = idempotency_key; store `paymentID` in `payment_transaction.gateway_transaction_id`; status = `initiated`
- Execute payment: POST `/tokenized/checkout/execute` after buyer returns from bKash URL; **never mark as failed based on redirect URL alone** — always query API first
- Query payment: POST `/tokenized/checkout/payment/status`; use for timeout recovery (4 attempts: immediate, +30s, +2min, +5min); if status = `Completed` after failed redirect → treat as success
- Refund: POST `/tokenized/checkout/payment/refund`; within 30 days of transaction; settlement 1–3 business days

**Idempotency implementation:**
```
idempotency_key = SHA256(dealerId + ':' + invoiceId + ':' + Math.floor(Date.now() / 300_000))
```
Before every payment initiation: check `payment_transaction WHERE idempotency_key = key`. If found and status = `success` → return existing (no re-charge). If found and status = `pending/initiated` → query gateway. If found and status = `failed` → same key, retry safe (gateway will see same `merchantInvoiceNumber`).

Redis lock before any payment callback processing: `SETNX payment_processing:{idempotency_key} {timestamp} EX 120`; if lock not acquired → duplicate callback → return 200 without processing.

**All 8 bKash double-charge scenarios must pass:**

| # | Scenario | Expected Outcome |
|---|---|---|
| 1 | Successful payment, callback arrives correctly | Subscription activated once; status = success |
| 2 | Timeout — callback never arrives | Query API → status=Completed → activate via query |
| 3 | Failure callback, payment actually succeeded | Query API → Completed → activate; failure callback ignored |
| 4 | Dealer retries within 5-min window (first succeeded, we missed) | Same idempotency_key → existing success returned; no re-charge |
| 5 | Dealer retries > 5 min later (first succeeded) | Invoice already paid check blocks new initiation |
| 6 | Concurrent IPN + redirect | Redis lock prevents dual activation; only first processes |
| 7 | bKash IPN replay attack | Idempotency key already used → 200 returned; no double-activation |
| 8 | Amount manipulation in IPN | Amount mismatch > BDT 1.00 → reject; alert Finance Admin |

**Nagad Direct API:**
- RSA key pair: merchant generates; public key registered with Nagad; private key = `NAGAD_PRIVATE_KEY` env var
- Initialize: POST `/check-out/initialize/{merchantId}/{orderId}`; body encrypted with Nagad's public key (OAEP padding) + signed with merchant's private key (SHA256withRSA)
- Response: decrypt with merchant's private key; verify signature with Nagad's public key; store `paymentReferenceId`
- Complete: POST `/check-out/complete/{merchantId}/{paymentReferenceId}`; same encrypt+sign pattern; same `challenge` from initialization
- Verify: GET `/verify/payment/{merchantId}/{paymentReferenceId}` for timeout recovery

**SSLCommerz:**
- Initiation: POST to gateway URL with required fields (store_id, amount, tran_id = idempotency_key, success_url, fail_url, cancel_url, ipn_url)
- IPN processing: **validate MD5 hash first**; amount verification: `abs(received - expected) ≤ 1.0`; status must be `VALID` or `VALIDATED`; **always return HTTP 200 to SSLCommerz IPN** (even if rejected internally)
- Redirect handling: NEVER activate subscription based on success redirect URL alone; always check `payment_transaction.status` first

**Subscription Lifecycle:**
- Monthly billing: BullMQ cron daily 9:00 AM; attempt bKash first; if fails → send manual payment link via SMS; grace period 7 days (full access); Day 7 → read-only; Day 14 → personal outreach by ops; Day 30 → suspended; Day 90 → data archive warning
- Feature activation within 60 seconds of payment clearing
- Subscription expiry reminders: Day −7, Day −3, Day 0 (SMS)

**Per-Lead Billing (Free plan):**
- BDT 150 standard lead, BDT 300 high-intent (score ≥ 50 or source = facebook_lead_ad)
- Monthly aggregation on 1st of month; minimum BDT 500; maximum BDT 3,000/month cap
- Dispute window: 48 hours from lead creation; automatic removal from invoice if marked invalid within window

**Acceptance Conditions — Step 7:**

- [ ] **All 8 bKash double-charge scenarios pass** (test each individually with mock bKash API responses for sandbox testing; document that production testing with real BDT 1 is required at Step 10)
- [ ] Redis lock prevents concurrent IPN processing: simulate two simultaneous POST requests to IPN endpoint with same idempotency_key → exactly one activates subscription; second returns 200 with no action
- [ ] bKash access token cached in Redis: verify only 1 actual bKash auth API call per 3,500-second window (not 1 per payment)
- [ ] SSLCommerz IPN hash validation: POST IPN with tampered `amount` field → signature fails → rejected internally; response is still HTTP 200 to SSLCommerz; Finance Admin alert triggered
- [ ] Nagad RSA signature: POST with unsigned body → rejected; POST with wrong merchant key → rejected
- [ ] **Subscription features restore within 60 seconds**: simulate payment clearing (status → success) → dealer plan features re-enabled; listing limit increased; automation features available; verify via GET /dealerships/me response
- [ ] Grace period: subscription expires → dealer.status changes to reflect grace period → DMS remains fully functional → Day 7 → status → read-only (write operations return 403 with code `AUTH_DEALER_READ_ONLY`)
- [ ] Per-lead billing: create 10 qualified marketplace leads for a free-plan dealer → monthly invoice generated for `10 × 150 = BDT 1,500`; mark 2 as invalid within 48h → invoice recalculated to `8 × 150 = BDT 1,200`
- [ ] Annual plan: dealer pays annual → `subscription_expires_at` = NOW + 365 days; dealer receives 2 months free (pays for 10, gets 12)
- [ ] bKash circuit breaker: simulate 3 consecutive auth failures → circuit opens; next payment attempt returns 503 with `PAYMENT_GATEWAY_UNAVAILABLE` code; circuit resets after 5 minutes

---

### 3.8 Step 8 — Admin Panel

**What to build:**

- Admin panel at `admin.autoverse.com.bd` (Vercel, separate project from main app)
- IP allowlist middleware on ALL `/admin/*` routes:
  - Return HTTP **404** (not 403) to non-allowlisted IPs — never confirm the admin panel exists
  - Extract real IP from `CF-Connecting-IP` header (Cloudflare passes this)
  - Supports CIDR notation in allowlist
- Admin JWT (HS256 with `ADMIN_JWT_SECRET`; TTL 1,800s; idle timeout enforced via Redis session key `admin_session:{session_id}` TTL 1,800s reset on each request)
- TOTP 2FA (otplib): mandatory for all admin accounts; setup flow on first login; 5 failed TOTP attempts → account deactivated + Super Admin notified
- Sensitive action re-authentication: dealer termination, IMV override approval, refund > BDT 10,000 require fresh TOTP code (not cached; used code blocked via Redis SET for 90s)
- Impersonation (Super Admin only): short-lived RS256 token with `is_impersonation: true` and `impersonated_by` claims; TTL 3,600s; every action watermarked in `entity_change_log` and `platform_audit_log`; end-impersonation revokes token JTI
- Dealer management: list, approve, suspend (with reason), reinstate, terminate (Super Admin + fresh TOTP), add notes, flag accounts
- Dealer lifecycle: `pending_approval → active → suspended → terminated` (terminated = irreversible, Super Admin only)
- C2C moderation queue: auto-checks (photo count ≥ 4, price sanity, specs match, no duplicate VIN); moderator approval/rejection with reason codes; buyer flag processing (≥ 2 flags within 24h → auto-hide listing + moderator alert)
- Revenue dashboard (Finance Admin): MRR, ARR, plan distribution, failed payment queue with recovery actions
- Feature flag system: global/plan-level/dealer-level flags; effective immediately (no redeploy needed)
- System health dashboard: queue depths, API p50/p95/p99, Redis memory, sync SLA compliance, failed jobs 24h
- Broadcast message tool: send SMS or in-app to all/plan/district/specific dealers; confirmation required showing recipient count
- All admin actions logged to `platform_audit_log` with before_state, after_state, actor IP

**Acceptance Conditions — Step 8:**

- [ ] **Admin panel returns HTTP 404 (not 403) from non-allowlisted IP**: verify with a request from a non-configured IP; response body is generic "Not found"; no auth challenge presented; no indication admin panel exists
- [ ] **All admin accounts require TOTP 2FA**: attempt admin login with correct email+password but no TOTP code → rejected; attempt with wrong TOTP code → rejected; 5 wrong attempts → account deactivated; account deactivation sends SMS to Super Admin
- [ ] Idle timeout: admin performs action, wait 31 minutes without any request, attempt another request → 401 (session expired); re-login required
- [ ] **Dealer suspension within 60 seconds**: approve dealer, then suspend via admin → dealer's marketplace listings hidden within 60 seconds (verify via GET /marketplace/search); DMS write operations return 403
- [ ] Dealer reinstatement within 60 seconds: reinstate → all listings restored to active within 60 seconds
- [ ] Dealer approval: approve pending dealer → dealer can log in; welcome SMS sent
- [ ] Impersonation audit: Super Admin impersonates Dealer A, edits a vehicle → `entity_change_log` shows `actor_role = 'super_admin_impersonating'` with `impersonated_dealer_id`; NOT attributed to dealer
- [ ] Sensitive action re-auth: attempt dealer termination without fresh TOTP → rejected with `TOTP_REQUIRED` error; submit fresh valid TOTP → proceeds
- [ ] C2C moderation: listing with < 4 photos → auto-check fails → moderation queue with `photos` check marked ❌; moderator can approve/reject with reason codes
- [ ] Buyer flag auto-hide: 2 flags within 24h on same listing → listing status → `under_review`; Content Moderator receives in-app alert within 60 seconds
- [ ] Feature flag toggle: toggle any global flag in admin → all GET /dealerships/me responses reflect new feature access within 60 seconds (cached value invalidated)
- [ ] Failed payment queue: Finance Admin can view all failed invoices; per-row actions (Retry, Send Link, Waive, Mark Bad Debt) each work correctly
- [ ] Revenue dashboard: MRR correctly computed as `SUM(monthly_price * active_subscriptions_by_tier)` for current date
- [ ] Broadcast: send test broadcast to "all active dealers" → correct recipient count shown in confirmation; SMS jobs queued in `notification-sms`

---

### 3.9 Step 9 — Security Hardening & Load Testing

**What to build (and verify):**

- Run full security test suite: all 25 penetration scenarios (already passing from Step 1); all 90 RBAC scenarios (already passing from Step 2)
- Run load tests with k6 against all critical endpoints (see Section 4 for exact targets)
- Verify rate limiting at all levels: API rate limiting (per IP, per user), automation rate limits, payment retry rate limits, OTP rate limits
- Dependency security: `npm audit --audit-level=high` must pass with 0 high/critical vulnerabilities
- Secret scanning: TruffleHog scan on entire codebase (CI must catch any accidental secret commits)
- Security headers on all responses: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (admin), `SAMEORIGIN` (main app), `Content-Security-Policy`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- Error responses: in `NODE_ENV=production`, all 500 errors return only `{ "success": false, "error": { "code": "INTERNAL_ERROR", "message": "Something went wrong" }, "request_id": "uuid" }` — NO stack traces, NO schema info, NO internal paths
- Verify all event listeners in AutomationModule, SyncModule, and NotificationsModule have `try/catch`; listener failures must NOT propagate to the EventEmitter caller

**Acceptance Conditions — Step 9:**

- [ ] All load test targets met with k6 (see Section 4.2 for exact numbers)
- [ ] `npm audit --audit-level=high`: 0 vulnerabilities
- [ ] TruffleHog scan: 0 secrets found in codebase
- [ ] Production error response: trigger intentional 500 error in production-mode server → response contains only `{ "success": false, "error": { "code": ..., "message": ... }, "request_id": ... }` — no stack trace, no file path, no schema info
- [ ] All security headers present on API responses: verify with `curl -I https://api.autoverse.com.bd/health`
- [ ] All security headers present on frontend responses: verify with `curl -I https://autoverse.com.bd`
- [ ] JWT key rotation test: rotate JWT signing keys; update `token_invalidate_before` in Redis; all existing dealer sessions invalidated within 1 second; new login with new keys works

---

### 3.10 Step 10 — DevOps, CI/CD & Production Launch

**What to build:**

- GitHub Actions CI/CD: `ci.yml` (every PR: lint, type-check, unit tests ≥ 80% coverage, integration tests, security scan, migration safety check), `staging.yml` (push to staging branch: all tests → migrate → build → deploy → smoke tests), `production.yml` (push to main: manual approval gate → DB backup → migrate → build → deploy → smoke tests → 5-min error rate monitor → auto-rollback on failure)
- Migration safety checker: CI script that fails if any migration contains: `DROP TABLE`, `DROP COLUMN`, `RENAME` (without safe procedure), `NOT NULL` without `DEFAULT`, `CREATE INDEX` without `CONCURRENTLY`
- Schema-per-environment isolation: separate databases, separate Redis, separate R2 buckets for development/staging/production
- BullMQ graceful shutdown: on SIGTERM → stop accepting new jobs → drain in-flight jobs (max 30s) → disconnect → exit 0
- DigitalOcean App Platform: minimum 2 instances for `main-api` (zero-downtime rolling deploy); health check endpoint: `GET /health` → 200
- Cloudflare Worker deployed with `wrangler deploy`; KV namespace configured per environment
- Monitoring active: Sentry DSN configured in all services; BetterUptime monitors on all public endpoints; Slack webhook for alerts; PostHog SDK initialized in frontend
- Production bKash and Nagad tested with real BDT 1 transactions
- WhatsApp message templates approved by Meta (all utility templates from blueprint)

**Acceptance Conditions — Step 10:**

- [ ] All 50+ items in Section 10.1 Technical Readiness Checklist checked (see below)
- [ ] CI pipeline: push to feature branch → all CI checks run automatically; PR to staging → preview URL posted; push to staging → staging deployment completes; push to main → manual approval gate blocks automatic deploy; after approval → production deploy + smoke tests run
- [ ] Production DB backup: CI workflow creates pg_dump before every production deploy; dump file uploaded to R2 `backups/` bucket; filename contains git SHA
- [ ] Migration safety: add a migration with `DROP COLUMN` → CI `migration-check` job fails; add a migration with `ADD COLUMN NULL` → CI passes
- [ ] Zero-downtime: deploy new version of `main-api` while running 50 concurrent requests → 0 requests fail; response times do not spike > 2× baseline during deploy
- [ ] **Production bKash real transaction**: charge BDT 1 via bKash production API → subscription activates → BDT 1 refunded via bKash refund API → subscription remains active for billing period
- [ ] **Production Nagad real transaction**: charge BDT 1 via Nagad production API → subscription activates
- [ ] **WhatsApp template approved**: at least `lead_instant_reply` template approved by Meta in production WABA account; test message delivered to real phone
- [ ] BetterUptime monitors active: `autoverse.com.bd`, `api.autoverse.com.bd/health`, and `admin.autoverse.com.bd` (admin should return 404 from BetterUptime IP, which is expected); alert fires in Slack when any goes down
- [ ] Sentry: intentionally trigger a 500 error in production → Sentry receives event within 30 seconds; Slack alert fires
- [ ] BullMQ graceful shutdown: send SIGTERM to `main-worker` while processing a job → job completes (within 30s) → worker exits 0 → job NOT requeued
- [ ] Pre-launch business readiness (verified before enabling public buyer acquisition):
  - [ ] ≥ 200 active marketplace listings
  - [ ] ≥ 15 active dealers with inventory
  - [ ] ≥ 30 IMV-rated listings (deal_rating ≠ unrated)
  - [ ] ≥ 50% of listings have ≥ 6 photos
  - [ ] All payment flows tested live (bKash + Nagad + SSLCommerz)
  - [ ] Support WhatsApp number operational with < 2-hour response SLA commitment
  - [ ] Admin panel: all 5 admin roles filled with real team members and 2FA activated
  - [ ] Status page live at `status.autoverse.com.bd`

---

## 4. NON-NEGOTIABLE QUALITY GATES

### 4.1 Security Minimums

| Requirement | Standard | Failure Consequence |
|---|---|---|
| Cross-tenant data leakage | Zero tolerance — no field from Tenant B accessible to Tenant A | Halt all operations; full escalation |
| JWT dealer signing | RS256 asymmetric; 2048-bit RSA; separate key from admin | Cannot deploy without |
| JWT admin signing | HS256 with dedicated `ADMIN_JWT_SECRET` (min 64 hex chars) | Cannot deploy without |
| Admin 2FA | TOTP mandatory; no bypass mechanism exists in code | Cannot go live without |
| Admin IP restriction | `admin.autoverse.com.bd` returns 404 to non-allowlisted IPs | Cannot go live without |
| Stack traces in production | Zero — all 500 errors return generic message only | Fix before launch |
| Payment double-charge | All 8 bKash scenarios pass; idempotency_key on every attempt | Do not launch payments without |
| Secrets in code | Zero — TruffleHog scan must pass | Cannot merge to main |
| SQL injection | All parameterized via Prisma — no raw string concatenation in queries | Fix before launch |
| Webhook signatures | All incoming webhooks (Meta, Greenweb, SSLCommerz) verified before processing | Cannot enable automation without |

### 4.2 Performance Targets (k6 Load Tests — All Must Pass)

| Endpoint | Load | p95 Target | p99 Target | Max Error Rate |
|---|---|---|---|---|
| `GET /marketplace/search` | 100 RPS sustained | 200ms | 500ms | 0.1% |
| `GET /marketplace/listings/:slug` | 200 RPS sustained | 150ms | 300ms | 0.1% |
| `GET /imv` | 50 RPS sustained | 100ms | 200ms | 0.1% |
| `GET /vehicles` (dealer, authenticated) | 50 RPS sustained | 200ms | 400ms | 0.1% |
| `POST /vehicles` | 10 RPS sustained | 500ms | 1,000ms | 0.5% |
| `PUT /vehicles/:id/status` | 10 RPS sustained | 300ms | 600ms | 0.1% |
| `GET /leads` | 50 RPS sustained | 150ms | 300ms | 0.1% |
| `POST /leads` | 20 RPS sustained | 300ms | 600ms | 0.1% |
| `PUT /leads/:id/stage` | 20 RPS sustained | 200ms | 400ms | 0.1% |
| `POST /deals` | 5 RPS sustained | 500ms | 1,000ms | 0.5% |
| `POST /payments/bkash/create` | 2 RPS sustained | 2,000ms | 5,000ms | 1% |
| `POST /payments/sslcommerz/ipn` | 5 RPS sustained | 200ms | 500ms | 0.1% |
| `GET /admin/dealers` | 5 RPS sustained | 500ms | 1,000ms | 0.1% |
| BullMQ `sync-vehicle` queue | 200 jobs/min | 2,000ms p95 | — | 0 DLQ entries |

### 4.3 Sync & Processing SLAs

| Process | Target | Measurement |
|---|---|---|
| Sync SLA (vehicle change → marketplace updated) | p95 < 2,000ms | End-to-end, 100 simultaneous updates |
| Lead notification to dealer (push + WebSocket) | < 5,000ms | From POST /marketplace/leads to WebSocket event |
| Hot lead SMS | < 60,000ms | From score crossing 70 to SMS queued |
| Subscription activation after payment | < 60,000ms | From payment_transaction.status → success to feature available |
| Admin suspension effect | < 60,000ms | From PUT /admin/dealers/:id/suspend to listings hidden |
| WhatsApp Day 0 auto-reply | < 60,000ms | From lead.created_at to automation_log.sent_at |
| Facebook Lead Ad → CRM | < 90,000ms | From webhook receipt to lead.created_at |
| Bill of Sale PDF generation | < 5,000ms | From API call to PDF stored in R2 |
| IMV nightly full recalculation | < 15 minutes | For 50,000 active listings |

### 4.4 Mobile UX Hard Constraints

| Constraint | Standard |
|---|---|
| Minimum supported viewport | 360px width |
| Walk-in lead entry time | ≤ 60 seconds (3 fields maximum on mobile: name, phone, vehicle interest) |
| Lead notification → WhatsApp reply | ≤ 2 taps (notification tap → Lead Card → WhatsApp button) |
| All core dealer workflows | Thumb-navigable (no hover-only interactions anywhere) |
| Skeleton screens | Every data-loading state; no spinners, no blank screens |
| Offline support (PWA) | Inventory list, lead list, lead cards, offline note entry all functional without network |
| Images | WebP format; lazy load; blur placeholder; max 150KB per photo |
| API timeout UX | At 8 seconds: show "Slow connection" message (never blank state, never crash) |
| Font support | Noto Sans Bengali loaded when language = 'bn'; all BD mobile number inputs accept Bengali digit input (০–৯ auto-converted) |

### 4.5 Plan Limits Enforced at API Level

All limits enforced in NestJS service methods and `SubscriptionGuard`. UI enforcement alone is insufficient — API must reject requests that exceed plan limits.

| Feature | Free | Starter | Professional | Business | Enterprise |
|---|---|---|---|---|---|
| Vehicle listings | 10 | 50 | 200 | 500 | Unlimited |
| Staff seats | 1 | 3 | 10 | 25 | Unlimited |
| Showroom locations | 1 | 1 | 2 | 5 | Unlimited |
| SMS quota/month | 100 | 500 | 2,000 | 5,000 | Custom |
| Maestro AI insights | ❌ | Basic | Full | Full | Full |
| Automation Hub | ❌ | WhatsApp basic | WA + Facebook | All channels | All + custom |
| GMC + FB Catalog | ❌ | ❌ | ✅ | ✅ | ✅ |
| Facebook Lead Ad sync | ❌ | ❌ | ✅ | ✅ | ✅ |
| Custom domain | ❌ | ❌ | ❌ | ✅ | White-label |

API enforcement: when dealer hits listing limit → `POST /vehicles` returns 402 with code `VEHICLE_LISTING_LIMIT` and `upgrade_url: '/settings/subscription'`. When dealer uses feature above plan → 402 with `required_plan` field.

---

## 5. DECISION AUTHORITY RULES

### 5.1 What the Agent Can Decide Autonomously

The agent may make independent decisions in these categories:

- **Internal naming**: helper function names, internal variable names, CSS class names, test case descriptions, migration file names
- **Implementation details within a defined stack**: which specific React hooks to use, how to structure a particular NestJS provider, choice of validation message wording, internal constant organization
- **Test case expansion**: writing additional test cases beyond the minimum specified, choosing test data values, structuring test utilities
- **Code organization**: how to split large files, which utilities to extract to shared packages, folder structure within the defined monorepo
- **Logging verbosity**: what additional fields to include in structured logs beyond the required fields
- **Comment style**: whether to add inline comments, their wording
- **Error message wording**: the human-readable `message` field in API errors (the `code` field is specified; the message wording is flexible)
- **Library utilities where no specific library is named**: e.g., which date formatting library to use for display formatting (not for core calculations)

### 5.2 What Requires Immediate Escalation Before Proceeding

The agent must STOP and escalate (using the format in 5.3) for ANY of the following:

1. **Any tech stack substitution** — any proposal to replace a named technology with an alternative (e.g., "use Prisma ORM instead of TypeORM" is fine since Prisma is specified, but "use Mongoose instead of Prisma" requires escalation)
2. **Any RLS relaxation** — any change that weakens multi-tenant isolation, any suggestion to use `migration_user` connection in application code, any bypass of `DealerContextGuard`
3. **Any change to bKash/Nagad payment flow logic** — including idempotency key strategy, retry timing, double-charge prevention mechanism, or IPN processing sequence
4. **Any JWT signing key strategy change** — signing algorithm, key type, separate-key principle, token TTL changes
5. **Any vehicle status state machine transition change** — adding new valid transitions, removing existing forbidden transitions
6. **Any destructive database migration** — `DROP TABLE`, `DROP COLUMN`, `RENAME COLUMN`, column type change, `NOT NULL` without `DEFAULT` on existing table; the migration safety checker will flag these, but the agent must also escalate to the human before running any workaround
7. **Any performance target that cannot be met within the defined stack** — if a load test target cannot be achieved without architectural change (e.g., sharding, different database), escalate rather than redesigning autonomously
8. **Any third-party API breaking change** — if a specified API (bKash, Meta, Greenweb, NHTSA) has changed its endpoints, authentication, or payload format since the blueprint was written
9. **Any deviation from the execution sequence** — if Step N cannot be completed before Step N+1 due to a dependency issue, escalate rather than reordering
10. **Any security architecture change** — CORS policy changes, cookie settings changes, admin IP allowlist mechanism changes

### 5.3 Escalation Format

When the agent must escalate, it must STOP all work and output exactly this format:

```
## ⛔ ESCALATION REQUIRED — CANNOT PROCEED AUTONOMOUSLY

**Escalation ID:** [sequential number, e.g., ESC-001]
**Step:** [current execution step, e.g., Step 3 — Sync Engine]
**Trigger Category:** [one of: tech_stack_substitution | rls_relaxation | payment_flow_change | jwt_strategy_change | state_machine_change | destructive_migration | performance_target_unachievable | api_breaking_change | sequence_deviation | security_architecture_change]

**Situation:**
[One precise paragraph describing exactly what was encountered]

**Why This Requires Escalation:**
[One sentence referencing the specific rule in Section 5.2]

**Options Considered:**
1. [Option A — what it would change and why it's not safe to decide autonomously]
2. [Option B — what it would change and why it's not safe to decide autonomously]

**Recommended Option:** [A or B, with brief justification — no more than 2 sentences]

**Work Halted At:** [exact file, function, or step where work stopped]

**Awaiting:** Human decision on which option to proceed with.
```

The agent must not attempt to resolve the escalation itself. It must not continue with any other work in the same step. It must wait for a human response.

---

## 6. FAILURE & ROLLBACK PROTOCOL

### 6.1 Sync Engine Overload

**Symptom indicators:** `sync-vehicle` queue depth > 500 jobs; sync SLA p95 > 5,000ms; dealer UI showing "Sync error" badges at scale.

**Check autonomously:**
1. Measure queue depth: `await syncVehicleQueue.getJobCounts()` — report `waiting`, `active`, `failed`, `delayed`
2. Check per-dealer rate limit counters: `KEYS sync_rate:*` in Redis
3. Check DLQ depth: `await syncVehicleFailedQueue.getJobCounts()`
4. Check if the spike is from one dealer (single dealer pricing campaign) or all dealers (post-IMV repricing wave)

**Adjust autonomously if:**
- Single dealer flooding: per-dealer rate limit is already enforced; verify Redis counter is incrementing; if not → fix rate limit implementation
- BullMQ worker count insufficient: increase `concurrency` on `sync-vehicle` worker from 10 to 20 (within existing dyno memory)

**Escalate if:**
- Queue depth > 2,000 and still growing after 10 minutes with max concurrency applied
- DLQ depth > 50 within 30 minutes (indicates systemic sync failure, not just volume)
- Scaling main-worker instance count is required (infrastructure change beyond code)

**Never do:** do not disable sync for any dealer silently; do not drop sync jobs; do not reduce sync SLA targets without escalation.

### 6.2 WhatsApp API Rate Limit Cascade

**Symptom:** HTTP 429 from Meta WABA API; `automation_log` showing `failed` status for multiple dealers; `rate:automation:whatsapp:*` Redis keys near limit.

**Immediate autonomous actions (within 5 minutes of detection):**
1. Switch all pending Day 2+ sequence steps to `automation-sms` queue (Greenweb BD) for affected dealers — this is the defined fallback
2. Pause `automation-whatsapp` queue processing for dealers above 80% daily limit (jobs remain queued for next day)
3. Log all affected dealers and queued counts for transparency

**Immediate autonomous action for single dealer rate limit:** reschedule blocked jobs to 9:00 AM next day with BullMQ `delay` option; update `automation_log.status = 'queued'`; set scheduled send time in metadata.

**Escalate after 30 minutes if:**
- Rate limit affects > 50% of Professional+ dealers simultaneously (indicates platform-level WABA tier issue, not per-dealer issue)
- WABA account shows `account_warning` or `account_suspended` status in Meta Business Manager

**Never do:** do not drop WhatsApp automation jobs silently; do not mark them as delivered without sending.

### 6.3 Facebook Access Token Expiry

**Symptom:** `automation_log` showing HTTP 190 errors for facebook-catalog-sync or facebook-automation jobs; multiple dealers' Facebook features failing.

**Autonomous actions:**
1. On first HTTP 190 detection: immediately attempt `getLongLivedToken` refresh via Meta Graph API
2. If refresh succeeds: update `dealer_integration.access_token` with new encrypted token; requeue failed jobs; log recovery
3. If refresh fails for individual dealer: set `dealer_integration.status = 'expired'`; disable that dealer's Facebook features; send in-app notification to dealer: "Facebook connection expired — reconnect in Channel Connections"

**Escalate immediately if:**
- HTTP 190 is received for the **platform-level system user token** (not a per-dealer token) — this affects ALL dealers simultaneously; this is a Critical severity event
- Refresh attempt for system user token fails
- Meta returns HTTP 403 (app review/policy violation) — not a token expiry, a compliance issue

**Collect before escalating:** count of affected dealers, time of first failure, exact HTTP 190 error message, last successful token use timestamp, whether it was per-dealer or system-user token.

**Never do:** do not attempt to resolve a system user token issue autonomously; do not generate a new system user token without human authorization (requires Meta Business Manager access).

### 6.4 bKash Double-Charge

**This failure category has zero autonomous response. Immediate full escalation.**

**On any suspicion of double-charge (any of these indicators):**
- Two `payment_transaction` records with `status = 'success'` for the same `invoice_id`
- Dealer contacts support claiming they were charged twice
- `payment_transaction.amount_bdt × 2` deducted from dealer's bKash statement
- Finance Admin dashboard shows MRR spike with same dealer appearing twice

**Actions before escalating:**
1. Do NOT make any refund or adjustment
2. Do NOT contact the dealer
3. Collect: both `payment_transaction` records (full JSON); both bKash `trxID` values; `invoice_id`; `idempotency_key` values; timestamps of all events
4. Escalate immediately using format in Section 5.3 with trigger_category = `payment_flow_change`

**Human must decide:** whether a double-charge occurred, authorize refund via bKash API, determine if idempotency logic has a bug requiring code fix.

**Post-resolution:** add a test case to the bKash double-charge test suite covering the exact scenario that occurred.

### 6.5 RLS Breach

**Definition:** any confirmed or suspected case where data from Dealer A was returned in a request authenticated as Dealer B.

**This is the highest severity failure. Immediate response:**

1. **Within 60 seconds:** Enable maintenance mode via Cloudflare page rule: `autoverse.com.bd/* → Serve maintenance page (503)`; admin panel access is not affected (needed for investigation)
2. **Within 60 seconds:** Set Redis key `maintenance_mode = "1"` (application checks this on startup)
3. **Within 5 minutes:** Escalate using format in Section 5.3 with trigger_category = `rls_relaxation`; include the exact query that leaked data, the affected tables, the dealer IDs involved, and the timestamp
4. **Do not:** restore service, modify any data, or attempt to fix the RLS policy without human review
5. **Preserve:** all logs, all query execution plans, all related `entity_change_log` and `platform_audit_log` entries

**Human must decide:** root cause, whether data was leaked externally, notification obligations to affected dealers, remediation plan.

### 6.6 Production Rollback

**When to trigger production rollback:**
- Error rate > 5% for more than 5 minutes post-deploy (CI/CD pipeline monitors this automatically for 5 minutes)
- Critical functionality broken (payments, vehicle sync, authentication)
- Data corruption detected

**Autonomous rollback (CI/CD handles this):**
```
doctl apps create-deployment {DO_APP_ID_PRODUCTION} \
  --deployment-id {previous_deployment_id} \
  --wait
vercel rollback --prod
```

**Critical rule: NEVER auto-reverse a database migration.** If a migration was applied and the rollback requires reversing schema changes:
1. Rollback the application code (point to previous deployment)
2. The old code must be compatible with the new schema (additive-only migrations guarantee this)
3. Escalate with trigger_category = `destructive_migration` before touching the database

**Reason:** Reversing a migration that added columns is safe (old code ignores new columns). Reversing a migration that dropped something would require data recovery from backup — a Finance Admin and human decision.

---

## 7. OUTPUT & CODE STANDARDS

### 7.1 TypeScript

- Strict mode in all `tsconfig.json` files: `"strict": true`
- No `any` types unless explicitly justified with a comment
- No non-null assertion (`!`) unless immediately after a null check that TypeScript cannot infer
- Shared types in `packages/types` (consumed by both `apps/api` and `apps/web`)
- Prisma-generated types used directly for database models; do not manually duplicate DB types

### 7.2 NestJS Patterns

- Every public-facing service method has a corresponding DTO class with `class-validator` decorators
- DTOs use `@IsNotEmpty()`, `@IsEnum()`, `@IsUUID()`, `@IsNumber()`, `@IsOptional()` etc. — never accept raw primitives from controllers without validation
- `ValidationPipe` global with `whitelist: true` (strip unknown properties) and `forbidNonWhitelisted: true`
- Module imports: each module imports only what it needs (no `GlobalModule` with everything)
- Every controller uses `@UseGuards(JwtAuthGuard, DealerContextGuard)` for tenant-scoped routes; admin routes use `@UseGuards(JwtAdminGuard)`
- Financial field masking at service layer (not controller, not guard): `if (role === 'salesperson') { delete result.acquisition_cost; }` → actually set to `null` (not delete — deletion causes undefined errors in frontend)

### 7.3 API Contract

- All routes versioned under `/api/v1/`
- All responses wrapped in:
  ```typescript
  // Success
  { "success": true, "data": T, "meta"?: { total, page, limit, has_more } }
  // Error
  { "success": false, "error": { "code": string, "message": string, "field"?: string }, "request_id": string }
  ```
- HTTP status codes:
  - `200` GET success, PUT success
  - `201` POST creates a resource
  - `204` DELETE (no body)
  - `400` Bad request (malformed request)
  - `401` Unauthenticated
  - `402` Payment required (plan limit, subscription required)
  - `403` Authenticated but insufficient permission
  - `404` Resource not found (also used for admin panel non-allowlisted IP)
  - `409` Conflict (duplicate, idempotency key already used)
  - `422` Validation error or business rule violation (invalid state transition, missing required field)
  - `429` Rate limit exceeded
  - `503` Service unavailable (maintenance mode, circuit breaker open)
- All `PATCH` operations use `PUT` (no partial update semantics — simpler contract)

### 7.4 BullMQ Conventions

- Queue names: `kebab-case` exactly as listed in Section 2.6
- Job names: `{entity}.{action}` (e.g., `sync.vehicle.price_update`, `lead.score.update`)
- Every job payload interface defined as TypeScript type in `packages/types/src/jobs/`
- Every job processor class: `@Processor('{queue-name}') class {QueueName}Processor`
- All processors wrapped in `try/catch`; failures log to Sentry; rethrow for BullMQ retry mechanism
- Dead-letter queue processors named: `{queue-name}-failed.processor.ts`

### 7.5 Redis Key Naming

All Redis keys follow `{namespace}:{entity}:{identifier}:{variant}`:

| Pattern | Example | TTL |
|---|---|---|
| `cache:dealer:{id}:profile` | `cache:dealer:uuid:profile` | 900s |
| `cache:imv:{make}:{model}:{year}:{bucket}:{cond}:{district}` | `cache:imv:Toyota:Axio:2019:30-60K:reconditioned:Dhaka` | 3,600s |
| `cache:search:{md5(params)}` | `cache:search:a3f9b2c1` | 120s |
| `session:refresh:{userId}:{tokenHash}` | `session:refresh:uuid:sha256hex` | 2,592,000s |
| `admin_session:{sessionId}` | `admin_session:uuid` | 1,800s (reset per request) |
| `revoked_jti:{jti}` | `revoked_jti:uuid` | 900s |
| `rate:automation:{channel}:{dealerId}:{YYYYMMDD}` | `rate:automation:whatsapp:uuid:20250115` | Until end of day |
| `rate:contact:{dealerId}:{phone}:{YYYYMMDD}` | `rate:contact:uuid:+88017...:20250115` | Until end of day |
| `sync_error:{vehicleId}` | `sync_error:uuid` | 86,400s |
| `otp:{phone}:{purpose}` | `otp:+8801...:login` | 300s |
| `otp_rate:{phone}` | `otp_rate:+8801...` | 600s |
| `payment_processing:{idempotencyKey}` | `payment_processing:sha256hex` | 120s |
| `cache:bkash:access_token` | `cache:bkash:access_token` | 3,500s |
| `maintenance_mode` | `maintenance_mode` | Set manually; DEL to clear |
| `token_invalidate_before` | `token_invalidate_before` | Permanent until next rotation |

### 7.6 Environment Variable Naming

All environment variables: `SCREAMING_SNAKE_CASE` with service prefix where applicable.

```
# Application
NODE_ENV                    # production | staging | development | test
APP_VERSION                 # injected from git SHA at build time
APP_URL                     # https://autoverse.com.bd
API_URL                     # https://api.autoverse.com.bd

# Database
DATABASE_URL                # app_user connection (RLS enforced)
MIGRATION_DATABASE_URL      # migration_user connection (BYPASSRLS — never use in app code)

# Auth
JWT_PRIVATE_KEY             # RSA private key (PEM, \n escaped as \\n)
JWT_PUBLIC_KEY              # RSA public key (PEM, \n escaped as \\n)
ADMIN_JWT_SECRET            # HS256 secret (min 64 hex chars)
ENCRYPTION_KEY              # AES-256 key (exactly 64 hex chars = 32 bytes)

# Redis
REDIS_URL                   # rediss://... (TLS required for Upstash)

# MeiliSearch
MEILISEARCH_HOST
MEILISEARCH_MASTER_KEY

# Cloudflare R2
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL               # https://media.autoverse.com.bd

# SMS
GREENWEB_TOKEN
SMS_SENDER_ID               # "AutoVerse" (pending BTRC approval) or numeric

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_ACCOUNT_ID
WHATSAPP_API_TOKEN
WHATSAPP_WEBHOOK_VERIFY_TOKEN
WHATSAPP_APP_SECRET         # for webhook signature verification

# Facebook
META_APP_ID
META_APP_SECRET
META_SYSTEM_USER_TOKEN      # platform-level; never a personal token

# bKash
BKASH_BASE_URL              # https://tokenized.pay.bka.sh/v1.2.0-beta
BKASH_APP_KEY
BKASH_APP_SECRET
BKASH_USERNAME
BKASH_PASSWORD

# Nagad
NAGAD_MERCHANT_ID
NAGAD_PUBLIC_KEY            # Nagad's public key (for verifying responses)
NAGAD_PRIVATE_KEY           # Merchant's private key (for signing requests)
NAGAD_BASE_URL

# SSLCommerz
SSLCOMMERZ_STORE_ID
SSLCOMMERZ_STORE_PASS
SSLCOMMERZ_IS_LIVE          # false in non-production

# Firebase
FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY
FIREBASE_CLIENT_EMAIL

# Google
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_SERVICE_ACCOUNT_KEY

# Email
RESEND_API_KEY
EMAIL_FROM                  # noreply@mail.autoverse.com.bd

# Admin Security
ADMIN_IP_ALLOWLIST          # comma-separated: "x.x.x.x,y.y.y.y,z.z.z.0/24"
INTERNAL_API_SECRET         # for Cloudflare Worker → API internal calls

# Cloudflare Worker
CLOUDFLARE_API_TOKEN        # for wrangler deploy and route management

# Monitoring
SENTRY_DSN
POSTHOG_API_KEY
NEXT_PUBLIC_POSTHOG_KEY

# CI/CD
DO_ACCESS_TOKEN             # DigitalOcean API token
DO_APP_ID_STAGING
DO_APP_ID_PRODUCTION
VERCEL_TOKEN
```

### 7.7 Monorepo Folder Structure

```
autoverse/
├── apps/
│   ├── api/                    # NestJS backend (HTTP API)
│   │   ├── src/
│   │   │   ├── modules/        # One folder per NestJS module
│   │   │   ├── common/         # Guards, interceptors, filters, decorators
│   │   │   ├── workers/        # Worker entry points (main.ts per worker)
│   │   │   └── main.ts         # API entry point
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── test/
│   │       ├── unit/
│   │       ├── integration/
│   │       └── e2e/
│   ├── web/                    # Next.js (marketplace + dealer OS)
│   │   ├── app/                # Next.js App Router
│   │   ├── components/
│   │   └── public/
│   └── admin/                  # Next.js admin panel (separate Vercel project)
├── packages/
│   ├── types/                  # Shared TypeScript types (DB models, API payloads, job types)
│   ├── ui/                     # Shared React components (deal rating badge, etc.)
│   ├── config/                 # Shared ESLint, TypeScript, Prettier configs
│   └── utils/                  # Shared utility functions (BDT formatting, phone normalization)
├── worker/                     # Cloudflare Worker (custom domain routing)
│   └── src/index.ts
├── scripts/                    # CI/CD scripts (migration safety, coverage check, etc.)
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── staging.yml
│       └── production.yml
├── docker-compose.yml
└── turbo.json
```

### 7.8 Git Conventions

- Branch naming: `feature/{description}`, `fix/{description}`, `hotfix/{description}`, `chore/{description}`
- Commit style: Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `perf:`
- Commit messages must be present-tense, imperative: "add vehicle sync engine" not "added vehicle sync engine"
- No squash merges on `staging` or `main` (preserve commit history for debugging)
- `main` requires: 1 PR approval + all CI checks green + manual deployment gate

### 7.9 Test Coverage Minimums

| Category | Minimum Coverage |
|---|---|
| All service classes | ≥ 80% line coverage |
| Payment flow services (BkashService, NagadService, SslCommerzService, SubscriptionService) | 100% line coverage |
| Idempotency logic | 100% branch coverage (all 8 bKash scenarios as unit tests) |
| RLS enforcement | 100% (all 25 penetration scenarios in integration tests) |
| Vehicle status state machine | 100% (all valid + all forbidden transitions tested) |
| JWT strategy (verify, revoke, rotation) | 100% |
| AutomationRuleEngine (loop detection, rate limit) | ≥ 90% |

---

## 8. FINAL SUCCESS DEFINITION

The project is **100% complete** when every item in this checklist passes. This is a binary pass/fail list. Partial completion is not acceptable for launch.

### 8.1 Functional Flows

- [ ] **Dealer onboarding end-to-end**: register → OTP verify → create dealership → pending approval → admin approves → welcome SMS received → dealer logs in → adds first vehicle via VIN scan → vehicle appears on `autoverse.com.bd` marketplace within 2 seconds → dealer website live at `{slug}.autoverse.com.bd`
- [ ] **CRM full lifecycle**: buyer searches marketplace → finds listing → submits enquiry → lead appears in dealer CRM within 60 seconds with correct source attribution → dealer replies via WhatsApp in ≤ 2 taps → lead moved through all 8 stages → mark lost with required reason → win-back automation fires 30 days later
- [ ] **Deal closure with PDF**: lead converted to deal → deal created in draft → discount requires approval → manager approves → Bill of Sale PDF generated in < 5 seconds → stored in R2 → PDF accessible via URL → deal marked delivered → vehicle status = sold → marketplace listing shows "Sold" badge → post-sale WhatsApp sequence fires within 3 days
- [ ] **Automation sequences**: configure WhatsApp lead follow-up (4 steps) → trigger with test lead → Day 0 sends within 60 seconds → simulate no reply → Day 1 sends after 24 hours → simulate buyer reply → Day 3 DOES NOT send (cancelled by inbound reply) → Day 7 DOES NOT send
- [ ] **Billing cycle end-to-end**: dealer on Starter plan (BDT 2,999) → subscription expires → grace period → read-only mode at Day 7 → dealer pays via bKash → features restored within 60 seconds → invoice PDF generated → invoice accessible in Settings → Billing
- [ ] **Marketplace search and IMV**: search `?make=Toyota&district=Dhaka&deal_rating=great_deal` → only great_deal Toyota listings in Dhaka returned; IMV bar visible on listing detail page; Schema.org structured data validates; price drop triggers buyer alert
- [ ] **C2C listing full lifecycle**: private seller submits via C2C wizard → enters moderation queue → Content Moderator reviews → approves → listing live on marketplace → expires after 30 days → expiry SMS sent at Day 25, 28, 29 → listing hidden on Day 30
- [ ] **Admin operations**: Operations Manager approves dealer; Content Moderator moderates C2C listing; Finance Admin views revenue dashboard and processes failed payment; System Admin toggles feature flag; Super Admin impersonates dealer with full audit trail; all 6 admin role permission boundaries verified
- [ ] **Maestro AI nightly cycle**: nightly IMV recalculation completes < 15 minutes; Maestro insights generated per dealer; Morning Briefing delivered at 8:00 AM via SMS + push; pricing insight with recommendation generated for an overpriced vehicle with ≥ 10 comparable listings; "Insufficient Data" shown for cluster with < 5 listings
- [ ] **Website builder and custom domain**: dealer completes 4-step setup in < 10 minutes → website live at subdomain → all inventory auto-populated → WhatsApp CTA on every listing → custom domain CNAME configured → verified → custom domain serves dealer website correctly
- [ ] **GMC and Facebook Catalog sync**: dealer connects GMC → vehicle listed → GMC feed item created within 6 hours; dealer connects FB Catalog → vehicle listed → FB catalog item created; price change → both channels updated via instant sync within 10 minutes

### 8.2 Security Tests

- [ ] All 25 multi-tenant penetration scenarios pass (from Step 1 Acceptance Conditions)
- [ ] All 90 RBAC test scenarios pass (from Step 2 Acceptance Conditions)
- [ ] Admin panel returns HTTP 404 from non-allowlisted IP
- [ ] All admin accounts have TOTP 2FA active
- [ ] Zero stack traces in production error responses
- [ ] JWT tamper (payload edit without re-signing) → 401
- [ ] `npm audit --audit-level=high` → 0 vulnerabilities
- [ ] TruffleHog scan → 0 secrets found
- [ ] All webhook signature verifications active (Meta, Greenweb, SSLCommerz)

### 8.3 Load Tests

- [ ] All 14 load test targets from Section 4.2 pass
- [ ] Sync SLA: 100 simultaneous vehicle updates → p95 < 2,000ms
- [ ] MeiliSearch: search p95 < 200ms at 100 RPS

### 8.4 Payment Providers

- [ ] All 8 bKash double-charge scenarios pass (sandbox)
- [ ] bKash real BDT 1 transaction successful (production)
- [ ] Nagad real BDT 1 transaction successful (production)
- [ ] SSLCommerz IPN hash validation verified (test IPN with valid and tampered hash)
- [ ] Greenweb BD SMS: real SMS delivered to BD mobile number
- [ ] Subscription features restore within 60 seconds of payment confirmation

### 8.5 Monitoring & Operations

- [ ] Sentry: receives events from all 6 dynos; sensitive fields stripped from payloads
- [ ] BetterUptime: monitors active for `autoverse.com.bd`, `api.autoverse.com.bd/health`; alert fires in Slack on simulated downtime
- [ ] PostHog: `dealer_registered` and `first_vehicle_added` events captured correctly
- [ ] BullMQ dashboard accessible (internal, auth-gated)
- [ ] All 18 queues visible with correct job counts
- [ ] System health dashboard in admin panel: real-time queue depths, p95 API times, Redis memory visible
- [ ] Production database: DO daily backup confirmed active; backup tested via point-in-time restore to staging

### 8.6 CI/CD

- [ ] PR to staging → CI runs automatically → preview URL posted as PR comment
- [ ] Push to `main` → manual approval gate blocks deploy → after approval → production deploy succeeds → smoke tests pass
- [ ] Migration safety checker: `DROP COLUMN` migration fails CI; `ADD COLUMN NULL` migration passes CI
- [ ] Zero-downtime deploy: 2+ API instances; rolling deploy with health check; 0 request failures during deploy
- [ ] Rollback procedure tested: previous deployment reactivated via `doctl apps create-deployment` with previous deployment ID

### 8.7 Pre-Launch Business Readiness

These must be verified before enabling public buyer acquisition (Facebook ads, paid SEO promotion):

- [ ] ≥ 200 active marketplace listings (not draft, not hidden — `status = 'active'`)
- [ ] ≥ 15 active dealers with at least 5 vehicles each
- [ ] ≥ 30 listings with `deal_rating ≠ 'unrated'` (IMV clusters populated)
- [ ] ≥ 50% of all listings have ≥ 6 photos
- [ ] WhatsApp templates approved by Meta (`lead_instant_reply` at minimum)
- [ ] Support WhatsApp number operational; first response SLA ≤ 2 hours committed
- [ ] All 5 admin roles filled (Operations Manager, Finance Admin, Content Moderator, Marketing Admin, System Admin) with real team members and active 2FA
- [ ] Status page live at `status.autoverse.com.bd` with at least 3 monitors
- [ ] Privacy policy and terms of service accessible from marketplace homepage
- [ ] BD BTRC SMS sender ID ("AutoVerse") approved or numeric fallback configured and tested

---

## 9. APPENDIX OF CRITICAL REMINDERS

These are the non-negotiable operational constraints drawn from the platform's failure prevention playbook. Each represents a class of failure that would cause significant and potentially irreversible harm to the platform.

### Reminder 1: The Cold-Start Minimum Listing Requirement

**Do not open the marketplace to paid buyer acquisition before 200 active listings exist.**

A buyer's first visit to AutoVerse is a permanent impression. If they see a sparse marketplace with 20 listings, they leave, tell peers, and never return. The product must be built to enforce this constraint: the "Enable Buyer Acquisition" flag in the admin panel should be locked until the `active listing count ≥ 200` condition is met. This is not a suggestion — it is a structural gate. The programmatic SEO pages and Facebook buyer ads must not be activated before this threshold.

### Reminder 2: The 7-Day Dealer Activation Rule

**If a dealer does not receive and act on their first lead within 7 days of registration, they will almost certainly churn.**

The single most important metric in the entire platform is: "Time to first lead received AND replied to." Every onboarding workflow, every notification, every in-app nudge must be designed to achieve this within 7 days. If a dealer is active for 7 days with no lead interaction, an automated task must be created for the operations team to do personal outreach — not an automated email. The platform can track this via: `SELECT d.id, d.business_name FROM dealership d WHERE d.created_at < NOW() - INTERVAL '7 days' AND NOT EXISTS (SELECT 1 FROM lead l WHERE l.dealership_id = d.id AND l.created_at > d.created_at)`. This query must run daily at 6:00 AM as part of the `aging-watchlist` worker and surface results in the admin dashboard.

### Reminder 3: The Salesperson 2-Tap UX Constraint

**A salesperson must be able to reply to a lead via WhatsApp in ≤ 2 taps from any state.**

The flow is: Push notification arrives → TAP 1: notification opens Lead Card (full screen on mobile) → TAP 2: WhatsApp button opens WhatsApp with pre-filled message including buyer name, vehicle details, and dealer introduction. If this flow requires 3+ taps, salespeople will not use AutoVerse for lead response. They will use their personal WhatsApp directly. The CRM becomes irrelevant. Lead tracking fails. Maestro conversion data degrades. This 2-tap constraint must be validated on real Android hardware (not simulators) during QA. The WhatsApp deep link must work on Samsung mid-range Android (the most common device in the Dholaikhal dealer market).

### Reminder 4: Mobile-First as a Hard Constraint

**78% of BD dealer staff work primarily on mobile. The Dealer OS must be fully functional at 360px viewport with no desktop required for any daily operation.**

This means: no tables that require horizontal scrolling on mobile without explicit swipe affordance, no modals that overflow the viewport, no hover states as the only way to access actions (touch devices have no hover), no file pickers that don't support direct camera access on mobile, no rich text editors that break on mobile keyboards. Every screen must be tested at 360px width (the lowest common denominator for Bangladesh market devices) before it is considered complete. The PWA must be installable on Android and function in offline mode for: viewing the inventory list (cached), reading lead cards (cached), and writing notes (IndexedDB queue for sync on reconnect).

### Reminder 5: bKash Double-Charge as a Brand-Killing Event

**A bKash double-charge to a BD dealer is not a bug. It is a brand-destroying event that will spread through the Dholaikhal dealer community within hours.**

BD dealers are deeply interconnected socially. A single dealer who gets double-charged and shares it in the Dholaikhal WhatsApp group will cost AutoVerse 50+ potential dealers before support can respond. The payment idempotency system is not optional infrastructure — it is the most critical risk mitigation in the entire platform. The Redis payment lock, the idempotency key tied to 5-minute windows, the query-before-fail bKash timeout recovery, and the Finance Admin fraud detection are all mandatory from Day 1 of payment processing. Any payment-related code change requires 100% test coverage on all 8 double-charge scenarios. Any payment-related code change in production requires the Finance Admin to manually verify bKash transaction records against `payment_transaction` records for the next 48 hours.

---

*AutoVerse Master Goal Directive — v1.0*
*Complete Execution Constitution for Agentic AI*
*Self-Contained · No External References Required*
*All specifications derived from AutoVerse Blueprint v7.0, Steps 1–10*
