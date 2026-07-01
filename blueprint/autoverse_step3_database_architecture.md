# AutoVerse — Step 3: Database Architecture (Production Level)
### Complete Schema · Multi-Tenancy · Indexing · Audit Trail · v1.0

> Every table. Every field. Every type. Every constraint. Every index. Every RLS policy. Production-ready PostgreSQL schema built for 500K+ listings, strict tenant isolation, and zero-data-leakage between dealer and public layers.

---

## Table of Contents

1. [Multi-Tenancy Strategy & RLS Architecture](#1-multi-tenancy-strategy--rls-architecture)
2. [Naming Conventions & Type System](#2-naming-conventions--type-system)
3. [Schema: Identity & Auth Layer](#3-schema-identity--auth-layer)
4. [Schema: Dealership & Configuration Layer](#4-schema-dealership--configuration-layer)
5. [Schema: Inventory Layer](#5-schema-inventory-layer)
6. [Schema: CRM & Sales Layer](#6-schema-crm--sales-layer)
7. [Schema: Expense & Finance Layer](#7-schema-expense--finance-layer)
8. [Schema: Marketplace & Public Layer](#8-schema-marketplace--public-layer)
9. [Schema: IMV & Pricing Layer](#9-schema-imv--pricing-layer)
10. [Schema: Automation Layer](#10-schema-automation-layer)
11. [Schema: Website & Marketing Layer](#11-schema-website--marketing-layer)
12. [Schema: Payments & Billing Layer](#12-schema-payments--billing-layer)
13. [Schema: Notifications & Comms Layer](#13-schema-notifications--comms-layer)
14. [Schema: Admin & Platform Layer](#14-schema-admin--platform-layer)
15. [Schema: Audit Trail System](#15-schema-audit-trail-system)
16. [Indexing Strategy — 500K+ Listings](#16-indexing-strategy--500k-listings)
17. [Soft Delete Implementation](#17-soft-delete-implementation)
18. [RLS Policy Definitions](#18-rls-policy-definitions)
19. [Constraint & Trigger Definitions](#19-constraint--trigger-definitions)
20. [API Contract Naming Conventions & Versioning](#20-api-contract-naming-conventions--versioning)

---

## 1. Multi-Tenancy Strategy & RLS Architecture

### Decision

**Row-Level Security (RLS) with `dealership_id` on every tenant table.**

Rejected alternatives:
- Schema-per-tenant: operational overhead at 1,000+ tenants; migration complexity; connection pool fragmentation
- Application-layer filtering only: single bug exposes all tenant data; no database-level enforcement

### Three-Layer Isolation Model

```
LAYER 1 — Transport (JWT)
  dealership_id embedded in JWT payload claim: "dealer_id"
  Separate RS256 signing keys for dealer JWTs vs admin JWTs
  Token TTL: 15 minutes (access) / 30 days (refresh)

LAYER 2 — Application (NestJS Guard)
  DealerContextGuard: extracts dealer_id from JWT
  Injects into query context: SET LOCAL app.current_dealer_id = '{uuid}'
  Runs before every tenant-scoped query
  Cannot be bypassed: guard is required decorator on all dealer controllers

LAYER 3 — Database (PostgreSQL RLS)
  Policy on every tenant table:
    USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid)
  "true" parameter: returns NULL if setting not set (blocks all rows — fails safe)
  Separate DB user "app_user" with no superuser privileges (RLS applies)
  Migrations run as "migration_user" with BYPASSRLS (separate credential)

BREACH SCENARIO ANALYSIS:
  Layer 1 breach only (stolen JWT):
    → Layer 2 still enforces dealership_id from JWT
    → Layer 3 still enforces matching dealership_id in DB
    Result: attacker can only access their own tenant's data

  Layer 2 breach only (guard bypassed in code):
    → Layer 3 still enforces: app.current_dealer_id not set → 0 rows returned
    Result: empty responses, not cross-tenant leak

  Layer 3 breach only (RLS disabled by bug):
    → Layer 2 still filters to JWT's dealership_id
    Result: single-tenant exposure, not platform-wide
```

### Tenant vs Public Table Classification

```
TENANT TABLES (RLS enforced, dealership_id required):
  vehicles, recon_assessments, recon_tasks, vehicle_status_history,
  leads, lead_interactions, customers, deals, deal_payments,
  deal_documents, vehicle_expenses, operational_expenses,
  automation_rules, automation_logs, dealer_staff, dealer_locations,
  dealer_notification_settings, social_post_queue, social_post_analytics,
  maestro_insights, daily_summaries, saved_buyer_searches (dealer-context)

PUBLIC TABLES (no RLS, globally readable):
  marketplace_listings, imv_data, imv_clusters, vehicle_reference,
  makes, models, body_types, expert_articles, platform_announcements

SHARED TABLES (RLS not applicable — accessed by specific roles):
  users (accessed by auth system with user_id isolation)
  dealerships (accessed by dealer — own row only; by admin — all rows)
  subscriptions (own row only for dealers)
  payments (own records only for dealers)
  platform_audit_logs (admin only — no RLS, admin role required)

ADMIN-ONLY TABLES (admin JWT required — separate signing key):
  admin_users, admin_sessions, feature_flags, plan_configs,
  suspended_entities, platform_audit_logs, broadcast_messages,
  moderation_queue, listing_flags, gmc_feed_logs, system_health_metrics
```

---

## 2. Naming Conventions & Type System

### Table Naming

```
Singular noun, snake_case:
  vehicle (not vehicles_table, not tbl_vehicle)
  lead, deal, customer, dealership, user

Join tables: table_a_table_b
  vehicle_feature, customer_saved_vehicle

History/log tables: {entity}_history, {entity}_log
  vehicle_status_history, automation_log, sync_audit_log

Config/lookup tables: {entity}_category, {entity}_type, {entity}_config
  expense_category, lead_source_type, plan_config
```

### Column Naming

```
Primary keys:    id UUID NOT NULL DEFAULT uuid_generate_v4()
Foreign keys:    {referenced_table}_id UUID NOT NULL (or NULLABLE if optional)
Timestamps:      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                 deleted_at TIMESTAMPTZ NULL (soft delete)
Booleans:        is_{adjective} (is_featured, is_active, is_verified)
                 OR {past_tense} (published, verified, archived)
Enums:           status, type, category (inline ENUM or FK to lookup table)
Amounts:         always DECIMAL(12,2) for BDT amounts (handles up to BDT 9.99 billion)
Percentages:     DECIMAL(5,4) — e.g., 0.1523 = 15.23%
Scores:          DECIMAL(6,4) for deal_score (signed: -0.9999 to +9.9999)
URLs:            TEXT (not VARCHAR — R2 URLs can exceed 255 chars)
Phone numbers:   VARCHAR(20) (BD format: +8801XXXXXXXXX = 14 chars; headroom for intl)
JSON fields:     JSONB (not JSON — JSONB is indexed, compressed, binary)
```

### ENUM Types (PostgreSQL native ENUMs)

```sql
-- User roles
CREATE TYPE user_role AS ENUM (
  'admin_user', 'dealer_owner', 'manager', 'salesperson',
  'technician', 'buyer', 'c2c_seller'
);

-- User status
CREATE TYPE user_status AS ENUM (
  'active', 'suspended', 'pending_verification', 'deleted'
);

-- Dealer status
CREATE TYPE dealer_status AS ENUM (
  'pending_approval', 'active', 'suspended', 'terminated'
);

-- Subscription tier
CREATE TYPE subscription_tier AS ENUM (
  'free', 'starter', 'professional', 'business', 'enterprise'
);

-- Vehicle condition
CREATE TYPE vehicle_condition AS ENUM (
  'new', 'used', 'reconditioned'
);

-- Vehicle status
CREATE TYPE vehicle_status AS ENUM (
  'acquired', 'in_recon', 'available', 'reserved', 'sold', 'scrapped'
);

-- Fuel type
CREATE TYPE fuel_type AS ENUM (
  'petrol', 'diesel', 'hybrid', 'electric', 'cng', 'lpg'
);

-- Transmission
CREATE TYPE transmission_type AS ENUM (
  'automatic', 'manual', 'cvt', 'dct', 'amt'
);

-- Recon item status
CREATE TYPE recon_item_status AS ENUM (
  'ok', 'needs_work', 'critical'
);

-- Recon task status
CREATE TYPE recon_task_status AS ENUM (
  'pending', 'in_progress', 'complete', 'cancelled'
);

-- Lead stage
CREATE TYPE lead_stage AS ENUM (
  'new', 'contacted', 'qualified', 'test_drive',
  'quote_sent', 'negotiation', 'closed', 'lost'
);

-- Lead priority
CREATE TYPE lead_priority AS ENUM (
  'hot', 'warm', 'cold'
);

-- Lead source
CREATE TYPE lead_source AS ENUM (
  'walk_in', 'marketplace', 'dealer_website', 'facebook_lead_ad',
  'whatsapp', 'phone', 'referral', 'sms_campaign', 'email_campaign',
  'social_media', 'other'
);

-- Deal type
CREATE TYPE deal_type AS ENUM (
  'cash', 'finance', 'lease', 'exchange', 'exchange_plus_cash'
);

-- Deal status
CREATE TYPE deal_status AS ENUM (
  'draft', 'pending_approval', 'approved', 'delivered', 'cancelled'
);

-- Payment method
CREATE TYPE payment_method AS ENUM (
  'bkash', 'nagad', 'rocket', 'bank_transfer', 'cash',
  'sslcommerz', 'card', 'cheque'
);

-- Listing type
CREATE TYPE listing_type AS ENUM (
  'dealer', 'c2c'
);

-- Listing status
CREATE TYPE listing_status AS ENUM (
  'active', 'reserved', 'sold', 'hidden', 'archived',
  'expired', 'under_review', 'rejected'
);

-- Deal rating
CREATE TYPE deal_rating AS ENUM (
  'great_deal', 'good_deal', 'fair_price', 'overpriced', 'unrated'
);

-- Automation channel
CREATE TYPE automation_channel AS ENUM (
  'whatsapp', 'facebook', 'instagram', 'email', 'sms', 'push'
);

-- Automation status
CREATE TYPE automation_status AS ENUM (
  'queued', 'sent', 'delivered', 'failed', 'bounced', 'opted_out', 'skipped'
);

-- Recur cycle
CREATE TYPE recur_cycle AS ENUM (
  'weekly', 'monthly', 'quarterly', 'annual'
);

-- Language preference
CREATE TYPE language_pref AS ENUM (
  'en', 'bn'
);

-- Seller type
CREATE TYPE seller_type AS ENUM (
  'dealer', 'private'
);

-- Featured slot type
CREATE TYPE featured_slot AS ENUM (
  'homepage_hero', 'search_top', 'category_top', 'dealer_spotlight'
);

-- Moderation outcome
CREATE TYPE moderation_outcome AS ENUM (
  'approved', 'rejected', 'flagged', 'escalated'
);

-- Notification channel
CREATE TYPE notification_channel AS ENUM (
  'sms', 'push', 'email', 'in_app', 'whatsapp'
);

-- Sync event type
CREATE TYPE sync_event_type AS ENUM (
  'create', 'price_update', 'status_change', 'photo_update',
  'recon_complete', 'sold', 'deleted', 'visibility_toggle', 'restore'
);

-- Sync status
CREATE TYPE sync_status AS ENUM (
  'success', 'failed', 'dlq', 'skipped'
);
```

---

## 3. Schema: Identity & Auth Layer

### Table: `user`

```sql
CREATE TABLE "user" (
  id                   UUID        NOT NULL DEFAULT uuid_generate_v4(),
  phone                VARCHAR(20) NOT NULL,
  email                VARCHAR(255),
  password_hash        VARCHAR(255),              -- NULL if OTP-only login
  full_name            VARCHAR(255) NOT NULL,
  role                 user_role   NOT NULL,
  status               user_status NOT NULL DEFAULT 'pending_verification',
  preferred_language   language_pref NOT NULL DEFAULT 'bn',
  avatar_url           TEXT,
  fcm_token            TEXT,                      -- Firebase push token (updated on app launch)
  fcm_token_updated_at TIMESTAMPTZ,
  last_login_at        TIMESTAMPTZ,
  last_login_ip        INET,
  login_count          INTEGER     NOT NULL DEFAULT 0,
  failed_login_count   INTEGER     NOT NULL DEFAULT 0,  -- reset on success
  locked_until         TIMESTAMPTZ,               -- account lockout after 10 failed logins
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ,               -- soft delete

  CONSTRAINT pk_user PRIMARY KEY (id),
  CONSTRAINT uq_user_phone UNIQUE (phone),
  CONSTRAINT uq_user_email UNIQUE (email),
  CONSTRAINT chk_user_phone_format CHECK (phone ~ '^\+?[0-9]{10,20}$'),
  CONSTRAINT chk_user_email_format CHECK (
    email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

COMMENT ON TABLE "user" IS
  'All platform users: dealers, staff, buyers, C2C sellers, and admin users. '
  'Phone is the primary identifier for BD market. Email is optional.';
COMMENT ON COLUMN "user".phone IS 'Primary identifier. Format: +8801XXXXXXXXX for BD numbers.';
COMMENT ON COLUMN "user".password_hash IS 'bcrypt cost 12. NULL for OTP-only accounts.';
COMMENT ON COLUMN "user".fcm_token IS 'Firebase Cloud Messaging token. Updated on every app launch.';
```

### Table: `otp`

```sql
CREATE TABLE otp (
  id           UUID        NOT NULL DEFAULT uuid_generate_v4(),
  phone        VARCHAR(20) NOT NULL,
  code         VARCHAR(6)  NOT NULL,             -- 6-digit numeric
  purpose      VARCHAR(50) NOT NULL,             -- 'login', 'registration', 'password_reset'
  is_used      BOOLEAN     NOT NULL DEFAULT false,
  attempts     SMALLINT    NOT NULL DEFAULT 0,   -- failed verification attempts
  expires_at   TIMESTAMPTZ NOT NULL,             -- NOW() + 5 minutes
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at      TIMESTAMPTZ,
  ip_address   INET,

  CONSTRAINT pk_otp PRIMARY KEY (id),
  CONSTRAINT chk_otp_code CHECK (code ~ '^[0-9]{6}$'),
  CONSTRAINT chk_otp_attempts CHECK (attempts <= 5)
);

CREATE INDEX idx_otp_phone_purpose ON otp (phone, purpose, expires_at)
  WHERE is_used = false;
```

### Table: `refresh_token`

```sql
CREATE TABLE refresh_token (
  id           UUID        NOT NULL DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token_hash   VARCHAR(255) NOT NULL,            -- SHA-256 hash of the actual token
  device_info  TEXT,                             -- user agent / device name
  ip_address   INET,
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_refresh_token PRIMARY KEY (id)
);

CREATE INDEX idx_refresh_token_user ON refresh_token (user_id)
  WHERE revoked_at IS NULL AND expires_at > NOW();
CREATE INDEX idx_refresh_token_hash ON refresh_token (token_hash)
  WHERE revoked_at IS NULL;
```

---

## 4. Schema: Dealership & Configuration Layer

### Table: `dealership`

```sql
CREATE TABLE dealership (
  id                     UUID              NOT NULL DEFAULT uuid_generate_v4(),
  owner_id               UUID              NOT NULL REFERENCES "user"(id),
  business_name          VARCHAR(255)      NOT NULL,
  slug                   VARCHAR(255)      NOT NULL,            -- URL-safe identifier
  trade_license_no       VARCHAR(100),
  nid_no                 VARCHAR(30),                           -- National ID of owner
  status                 dealer_status     NOT NULL DEFAULT 'pending_approval',
  subscription_tier      subscription_tier NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  listing_limit          SMALLINT          NOT NULL DEFAULT 10,
  staff_seat_limit       SMALLINT          NOT NULL DEFAULT 1,
  location_limit         SMALLINT          NOT NULL DEFAULT 1,

  -- Location
  district               VARCHAR(100)      NOT NULL,
  division               VARCHAR(100)      NOT NULL,
  address                TEXT,
  lat                    DECIMAL(9,6),
  lng                    DECIMAL(9,6),

  -- Branding
  logo_url               TEXT,
  cover_photo_url        TEXT,
  primary_color          VARCHAR(7),                            -- hex: #RRGGBB
  secondary_color        VARCHAR(7),

  -- Contact
  phone                  VARCHAR(20)       NOT NULL,
  whatsapp_number        VARCHAR(20),
  email                  VARCHAR(255),
  website_url            TEXT,                                  -- external website if any

  -- Business hours (stored as JSONB for flexibility)
  business_hours         JSONB,
  -- format: { "mon": {"open": "09:00", "close": "18:00"},
  --           "sat": {"open": "09:00", "close": "17:00"},
  --           "sun": {"closed": true} }

  -- Stats (denormalized for performance)
  rating                 DECIMAL(3,2),                         -- aggregate from reviews
  review_count           INTEGER           NOT NULL DEFAULT 0,
  total_listings         INTEGER           NOT NULL DEFAULT 0,  -- updated on sync
  total_deals            INTEGER           NOT NULL DEFAULT 0,  -- updated on deal deliver

  -- Admin
  approved_by            UUID              REFERENCES "user"(id),
  approved_at            TIMESTAMPTZ,
  suspended_by           UUID              REFERENCES "user"(id),
  suspended_at           TIMESTAMPTZ,
  suspension_reason      TEXT,
  terminated_at          TIMESTAMPTZ,
  termination_reason     TEXT,

  -- Settings
  discount_threshold_pct DECIMAL(5,2)      NOT NULL DEFAULT 10.00, -- % before approval needed
  target_margin_pct      DECIMAL(5,2)      NOT NULL DEFAULT 20.00, -- for Maestro expense insight
  auto_publish_marketplace BOOLEAN         NOT NULL DEFAULT true,
  auto_post_social       BOOLEAN           NOT NULL DEFAULT false,
  posts_per_week         SMALLINT          NOT NULL DEFAULT 3,

  created_at             TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ,

  CONSTRAINT pk_dealership PRIMARY KEY (id),
  CONSTRAINT uq_dealership_slug UNIQUE (slug),
  CONSTRAINT chk_dealership_slug CHECK (slug ~ '^[a-z0-9-]{3,50}$'),
  CONSTRAINT chk_dealership_rating CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  CONSTRAINT chk_dealership_colors CHECK (
    (primary_color IS NULL OR primary_color ~ '^#[0-9A-Fa-f]{6}$')
    AND (secondary_color IS NULL OR secondary_color ~ '^#[0-9A-Fa-f]{6}$')
  )
);

CREATE INDEX idx_dealership_owner ON dealership (owner_id);
CREATE INDEX idx_dealership_status ON dealership (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_dealership_district ON dealership (district, status);
CREATE INDEX idx_dealership_slug ON dealership (slug) WHERE deleted_at IS NULL;
```

### Table: `dealership_location`

```sql
CREATE TABLE dealership_location (
  id             UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID        NOT NULL REFERENCES dealership(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,          -- "Main Showroom", "Mirpur Branch"
  address        TEXT        NOT NULL,
  district       VARCHAR(100) NOT NULL,
  division       VARCHAR(100) NOT NULL,
  lat            DECIMAL(9,6),
  lng            DECIMAL(9,6),
  phone          VARCHAR(20),
  is_primary     BOOLEAN     NOT NULL DEFAULT false,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_dealership_location PRIMARY KEY (id)
);

ALTER TABLE dealership_location ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_dealership_location ON dealership_location
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE INDEX idx_location_dealer ON dealership_location (dealership_id);
```

### Table: `dealer_staff`

```sql
CREATE TABLE dealer_staff (
  id             UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID        NOT NULL REFERENCES dealership(id) ON DELETE CASCADE,
  user_id        UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role           user_role   NOT NULL,           -- manager | salesperson | technician
  location_id    UUID        REFERENCES dealership_location(id),
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  invited_by     UUID        REFERENCES "user"(id),
  invited_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at    TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID        REFERENCES "user"(id),

  -- Salesperson-specific settings
  sees_all_leads BOOLEAN     NOT NULL DEFAULT false,
  commission_rate DECIMAL(5,2),                  -- % if commission tracking enabled

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_dealer_staff PRIMARY KEY (id),
  CONSTRAINT uq_dealer_staff UNIQUE (dealership_id, user_id)
);

ALTER TABLE dealer_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_dealer_staff ON dealer_staff
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE INDEX idx_dealer_staff_dealer ON dealer_staff (dealership_id) WHERE is_active = true;
CREATE INDEX idx_dealer_staff_user ON dealer_staff (user_id);
```

### Table: `plan_config`

```sql
CREATE TABLE plan_config (
  id                    UUID              NOT NULL DEFAULT uuid_generate_v4(),
  tier                  subscription_tier NOT NULL,
  display_name          VARCHAR(50)       NOT NULL,
  monthly_price_bdt     DECIMAL(10,2)     NOT NULL,
  listing_limit         INTEGER           NOT NULL,  -- -1 = unlimited
  staff_seat_limit      INTEGER           NOT NULL,
  location_limit        INTEGER           NOT NULL,
  sms_quota_monthly     INTEGER           NOT NULL,
  features              JSONB             NOT NULL,
  -- format: { "maestro_ai": true, "automation_hub": "basic",
  --           "gmc_feed": false, "fb_catalog": false,
  --           "custom_domain": false, "fb_lead_ads": false }
  is_active             BOOLEAN           NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_plan_config PRIMARY KEY (id),
  CONSTRAINT uq_plan_config_tier UNIQUE (tier)
);
```

### Table: `dealer_settings`

```sql
CREATE TABLE dealer_settings (
  id                        UUID    NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id             UUID    NOT NULL REFERENCES dealership(id) ON DELETE CASCADE,

  -- Notification preferences
  notify_new_lead_sms       BOOLEAN NOT NULL DEFAULT true,
  notify_new_lead_push      BOOLEAN NOT NULL DEFAULT true,
  notify_aging_sms          BOOLEAN NOT NULL DEFAULT true,
  notify_hot_lead_sms       BOOLEAN NOT NULL DEFAULT true,
  notify_daily_summary_sms  BOOLEAN NOT NULL DEFAULT true,
  notify_daily_summary_push BOOLEAN NOT NULL DEFAULT true,
  daily_summary_time        TIME    NOT NULL DEFAULT '08:00:00',

  -- Lead assignment
  lead_assignment_mode      VARCHAR(20) NOT NULL DEFAULT 'round_robin',
  -- 'round_robin' | 'manual' | 'by_location'
  default_assigned_to       UUID    REFERENCES "user"(id),

  -- Automation defaults
  whatsapp_away_enabled     BOOLEAN NOT NULL DEFAULT false,
  whatsapp_greeting_enabled BOOLEAN NOT NULL DEFAULT false,
  facebook_away_enabled     BOOLEAN NOT NULL DEFAULT false,
  post_approval_required    BOOLEAN NOT NULL DEFAULT true,
  optimal_post_time         TIME    NOT NULL DEFAULT '09:00:00',

  -- Finance
  default_loan_rate_pct     DECIMAL(5,2) NOT NULL DEFAULT 9.00,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_dealer_settings PRIMARY KEY (id),
  CONSTRAINT uq_dealer_settings UNIQUE (dealership_id)
);

ALTER TABLE dealer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_dealer_settings ON dealer_settings
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);
```

---

## 5. Schema: Inventory Layer

### Table: `vehicle`

```sql
CREATE TABLE vehicle (
  id                    UUID               NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id         UUID               NOT NULL REFERENCES dealership(id),
  location_id           UUID               REFERENCES dealership_location(id),
  stock_no              VARCHAR(20)        NOT NULL,
  vin                   VARCHAR(17),
  registration_no       VARCHAR(30),       -- BD vehicle registration

  -- Specs
  make                  VARCHAR(100)       NOT NULL,
  model                 VARCHAR(100)       NOT NULL,
  year                  SMALLINT           NOT NULL,
  variant               VARCHAR(200),                            -- trim level
  body_type             VARCHAR(50),
  engine_cc             INTEGER,
  engine_type           VARCHAR(50),                             -- "1.5L i-VTEC"
  fuel_type             fuel_type          NOT NULL DEFAULT 'petrol',
  transmission          transmission_type  NOT NULL DEFAULT 'automatic',
  drive_type            VARCHAR(10),                             -- '2WD', '4WD', 'AWD'
  seating_capacity      SMALLINT,
  color                 VARCHAR(50),
  doors                 SMALLINT,
  condition             vehicle_condition  NOT NULL DEFAULT 'used',

  -- Mileage
  mileage_km            INTEGER            NOT NULL,
  mileage_bucket        VARCHAR(20)        NOT NULL,
  -- '0-30K' | '30-60K' | '60-100K' | '100K+'
  -- computed on insert/update

  -- Financials (PRIVATE — never exposed to public)
  asking_price          DECIMAL(12,2)      NOT NULL,
  acquisition_cost      DECIMAL(12,2),                           -- what dealer paid
  recon_total           DECIMAL(12,2)      NOT NULL DEFAULT 0,   -- sum of vehicle_expenses
  net_profit_estimate   DECIMAL(12,2),                           -- asking_price - acq - recon
  floor_plan_cost       DECIMAL(12,2),                           -- finance cost if floor-planned

  -- Source
  acquisition_source    VARCHAR(50),
  -- 'auction' | 'trade_in' | 'direct_purchase' | 'consignment' | 'import'
  acquisition_date      DATE,
  acquired_from         VARCHAR(255),                            -- vendor/seller name

  -- Status
  status                vehicle_status     NOT NULL DEFAULT 'acquired',
  available_at          TIMESTAMPTZ,                             -- when status → available
  sold_at               TIMESTAMPTZ,
  days_on_lot           INTEGER GENERATED ALWAYS AS (
    CASE WHEN available_at IS NULL THEN NULL
    ELSE EXTRACT(DAY FROM COALESCE(sold_at, NOW()) - available_at)::INTEGER
    END
  ) STORED,

  -- Media
  photos                JSONB              NOT NULL DEFAULT '[]'::jsonb,
  -- [{ url, thumb_url, sort_order, is_primary, captured_at }]
  video_url             TEXT,
  photo_count           SMALLINT           NOT NULL DEFAULT 0,   -- denormalized

  -- Marketplace
  marketplace_published BOOLEAN            NOT NULL DEFAULT true,
  last_synced_at        TIMESTAMPTZ,
  sync_error            TEXT,                                    -- last sync error if any

  -- Specs (flexible KV for BD-specific fields)
  specs                 JSONB              NOT NULL DEFAULT '{}'::jsonb,
  -- { "registration_year": 2019, "imported_from": "Japan",
  --   "ac_type": "Digital", "navigation": true }

  -- Notes
  internal_notes        TEXT,                                    -- staff only
  description           TEXT,                                    -- public description

  -- Features
  features              JSONB              NOT NULL DEFAULT '[]'::jsonb,
  -- ["AC", "Power Windows", "Reverse Camera", ...]

  created_at            TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,

  CONSTRAINT pk_vehicle PRIMARY KEY (id),
  CONSTRAINT uq_vehicle_stock_no UNIQUE (dealership_id, stock_no),
  CONSTRAINT chk_vehicle_year CHECK (year BETWEEN 1970 AND EXTRACT(YEAR FROM NOW())::INTEGER + 2),
  CONSTRAINT chk_vehicle_mileage CHECK (mileage_km >= 0),
  CONSTRAINT chk_vehicle_price CHECK (asking_price > 0),
  CONSTRAINT chk_vehicle_vin CHECK (vin IS NULL OR LENGTH(vin) = 17)
);

ALTER TABLE vehicle ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_vehicle ON vehicle
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);
```

### Table: `vehicle_status_history`

```sql
CREATE TABLE vehicle_status_history (
  id            UUID           NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id UUID           NOT NULL REFERENCES dealership(id),
  vehicle_id    UUID           NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
  from_status   vehicle_status,                -- NULL for initial creation
  to_status     vehicle_status NOT NULL,
  changed_by    UUID           NOT NULL REFERENCES "user"(id),
  reason        TEXT,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_vehicle_status_history PRIMARY KEY (id)
);

ALTER TABLE vehicle_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_vehicle_status_history ON vehicle_status_history
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE INDEX idx_vsh_vehicle ON vehicle_status_history (vehicle_id, created_at DESC);
```

### Table: `recon_assessment`

```sql
CREATE TABLE recon_assessment (
  id                UUID                NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id     UUID                NOT NULL REFERENCES dealership(id),
  vehicle_id        UUID                NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,

  -- 8 categories
  engine_status     recon_item_status   NOT NULL DEFAULT 'ok',
  body_status       recon_item_status   NOT NULL DEFAULT 'ok',
  paint_status      recon_item_status   NOT NULL DEFAULT 'ok',
  interior_status   recon_item_status   NOT NULL DEFAULT 'ok',
  electricals_status recon_item_status  NOT NULL DEFAULT 'ok',
  tyres_status      recon_item_status   NOT NULL DEFAULT 'ok',
  ac_status         recon_item_status   NOT NULL DEFAULT 'ok',
  brakes_status     recon_item_status   NOT NULL DEFAULT 'ok',

  -- Extended notes per category
  engine_notes      TEXT,
  body_notes        TEXT,
  paint_notes       TEXT,
  interior_notes    TEXT,
  electricals_notes TEXT,
  tyres_notes       TEXT,
  ac_notes          TEXT,
  brakes_notes      TEXT,

  overall_notes     TEXT,
  assessed_by       UUID                NOT NULL REFERENCES "user"(id),
  assessed_at       TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,                               -- all tasks done
  created_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_recon_assessment PRIMARY KEY (id),
  CONSTRAINT uq_recon_assessment UNIQUE (vehicle_id)           -- one assessment per vehicle
);

ALTER TABLE recon_assessment ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_recon_assessment ON recon_assessment
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);
```

### Table: `recon_task`

```sql
CREATE TABLE recon_task (
  id               UUID               NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id    UUID               NOT NULL REFERENCES dealership(id),
  vehicle_id       UUID               NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
  assessment_id    UUID               NOT NULL REFERENCES recon_assessment(id),
  category         VARCHAR(50)        NOT NULL,
  -- 'engine'|'body'|'paint'|'interior'|'electricals'|'tyres'|'ac'|'brakes'|'other'
  description      TEXT               NOT NULL,
  assigned_to_user UUID               REFERENCES "user"(id),  -- internal technician
  assigned_to_name VARCHAR(255),                              -- external vendor (free text)
  estimated_cost   DECIMAL(12,2),
  actual_cost      DECIMAL(12,2),
  status           recon_task_status  NOT NULL DEFAULT 'pending',
  priority         SMALLINT           NOT NULL DEFAULT 2,      -- 1=critical, 2=normal, 3=minor
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  notes            TEXT,
  receipt_url      TEXT,
  created_by       UUID               NOT NULL REFERENCES "user"(id),
  created_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_recon_task PRIMARY KEY (id)
);

ALTER TABLE recon_task ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_recon_task ON recon_task
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE INDEX idx_recon_task_vehicle ON recon_task (vehicle_id, status);
CREATE INDEX idx_recon_task_assigned ON recon_task (assigned_to_user, status)
  WHERE assigned_to_user IS NOT NULL;
```

---

## 6. Schema: CRM & Sales Layer

### Table: `customer`

```sql
CREATE TABLE customer (
  id                    UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id         UUID        NOT NULL REFERENCES dealership(id),
  user_id               UUID        REFERENCES "user"(id),     -- if buyer has platform account
  full_name             VARCHAR(255) NOT NULL,
  phone                 VARCHAR(20) NOT NULL,
  email                 VARCHAR(255),
  nid_no                VARCHAR(30),
  district              VARCHAR(100),
  division              VARCHAR(100),
  address               TEXT,
  preferred_makes       JSONB,                                  -- ["Toyota", "Honda"]
  preferred_body_types  JSONB,                                  -- ["sedan", "suv"]
  budget_min            DECIMAL(12,2),
  budget_max            DECIMAL(12,2),
  opted_in_sms          BOOLEAN     NOT NULL DEFAULT true,
  opted_in_whatsapp     BOOLEAN     NOT NULL DEFAULT true,
  opted_in_email        BOOLEAN     NOT NULL DEFAULT true,
  opted_in_inventory_alerts BOOLEAN NOT NULL DEFAULT false,
  total_purchases       SMALLINT    NOT NULL DEFAULT 0,          -- denormalized
  total_spend           DECIMAL(14,2) NOT NULL DEFAULT 0,        -- denormalized
  last_interaction_at   TIMESTAMPTZ,
  notes                 TEXT,
  tags                  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,

  CONSTRAINT pk_customer PRIMARY KEY (id),
  CONSTRAINT uq_customer_phone UNIQUE (dealership_id, phone)
);

ALTER TABLE customer ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_customer ON customer
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE INDEX idx_customer_phone ON customer (dealership_id, phone);
CREATE INDEX idx_customer_dealer ON customer (dealership_id) WHERE deleted_at IS NULL;
```

### Table: `lead`

```sql
CREATE TABLE lead (
  id                  UUID          NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id       UUID          NOT NULL REFERENCES dealership(id),
  customer_id         UUID          REFERENCES customer(id),
  assigned_to         UUID          REFERENCES "user"(id),
  vehicle_id          UUID          REFERENCES vehicle(id),
  location_id         UUID          REFERENCES dealership_location(id),

  -- Buyer info (captured before customer record exists)
  buyer_name          VARCHAR(255)  NOT NULL,
  buyer_phone         VARCHAR(20)   NOT NULL,
  buyer_email         VARCHAR(255),
  buyer_district      VARCHAR(100),

  -- Lead data
  source              lead_source   NOT NULL DEFAULT 'walk_in',
  stage               lead_stage    NOT NULL DEFAULT 'new',
  priority            lead_priority NOT NULL DEFAULT 'warm',
  lead_score          SMALLINT      NOT NULL DEFAULT 0,
  lost_reason         VARCHAR(100),
  lost_reason_detail  TEXT,

  -- Budget
  budget_min          DECIMAL(12,2),
  budget_max          DECIMAL(12,2),

  -- Timeline
  next_follow_up      TIMESTAMPTZ,
  follow_up_method    notification_channel,
  contact_sla_breached BOOLEAN      NOT NULL DEFAULT false,

  -- Test drive
  test_drive_scheduled_at TIMESTAMPTZ,
  test_drive_completed_at TIMESTAMPTZ,

  -- Quote
  quote_amount        DECIMAL(12,2),
  quote_sent_at       TIMESTAMPTZ,

  -- Tracking
  enquiry_count       SMALLINT      NOT NULL DEFAULT 1,         -- merged duplicates
  personalized_token  VARCHAR(100),                             -- for /for/{token} URL
  personalized_link_views SMALLINT  NOT NULL DEFAULT 0,

  -- FB source tracking
  fb_lead_form_id     VARCHAR(100),
  fb_ad_id            VARCHAR(100),
  utm_source          VARCHAR(100),
  utm_medium          VARCHAR(100),
  utm_campaign        VARCHAR(100),

  notes               TEXT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,

  CONSTRAINT pk_lead PRIMARY KEY (id),
  CONSTRAINT chk_lead_score CHECK (lead_score BETWEEN -100 AND 200),
  CONSTRAINT chk_lead_lost_reason CHECK (
    (stage = 'lost' AND lost_reason IS NOT NULL) OR stage != 'lost'
  )
);

ALTER TABLE lead ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_lead ON lead
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE INDEX idx_lead_dealer_stage ON lead (dealership_id, stage, next_follow_up)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_lead_assigned ON lead (assigned_to, stage, next_follow_up)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_lead_vehicle ON lead (vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX idx_lead_phone ON lead (dealership_id, buyer_phone);
CREATE INDEX idx_lead_token ON lead (personalized_token) WHERE personalized_token IS NOT NULL;
CREATE INDEX idx_lead_score ON lead (dealership_id, lead_score DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_lead_uncontacted ON lead (dealership_id, created_at)
  WHERE stage = 'new' AND deleted_at IS NULL;
```

### Table: `lead_interaction`

```sql
CREATE TABLE lead_interaction (
  id             UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID        NOT NULL REFERENCES dealership(id),
  lead_id        UUID        NOT NULL REFERENCES lead(id) ON DELETE CASCADE,
  user_id        UUID        REFERENCES "user"(id),             -- NULL for automated
  type           VARCHAR(50) NOT NULL,
  -- 'call_outbound'|'call_inbound'|'whatsapp_sent'|'whatsapp_received'
  -- 'email_sent'|'sms_sent'|'walk_in'|'test_drive'|'note'|'stage_change'
  -- 'automation_sent'|'personalized_link_viewed'
  direction      VARCHAR(10),                                   -- 'inbound'|'outbound'|null
  channel        automation_channel,
  summary        TEXT,                                          -- short description
  body           TEXT,                                          -- full message content
  duration_sec   INTEGER,                                       -- for calls
  metadata       JSONB,                                         -- extra data per type
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_lead_interaction PRIMARY KEY (id)
);

ALTER TABLE lead_interaction ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_lead_interaction ON lead_interaction
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE INDEX idx_lead_interaction_lead ON lead_interaction (lead_id, created_at DESC);
CREATE INDEX idx_lead_interaction_type ON lead_interaction (dealership_id, type, created_at DESC);
```

### Table: `deal`

```sql
CREATE TABLE deal (
  id                    UUID          NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id         UUID          NOT NULL REFERENCES dealership(id),
  lead_id               UUID          NOT NULL REFERENCES lead(id),
  vehicle_id            UUID          NOT NULL REFERENCES vehicle(id),
  customer_id           UUID          NOT NULL REFERENCES customer(id),
  salesperson_id        UUID          NOT NULL REFERENCES "user"(id),
  manager_approval_id   UUID          REFERENCES "user"(id),
  location_id           UUID          REFERENCES dealership_location(id),

  -- Deal terms
  deal_type             deal_type     NOT NULL DEFAULT 'cash',
  sale_price            DECIMAL(12,2) NOT NULL,
  list_price            DECIMAL(12,2) NOT NULL,                 -- asking_price at deal time
  discount_amount       DECIMAL(12,2) NOT NULL DEFAULT 0,
  trade_in_vehicle_id   UUID          REFERENCES vehicle(id),   -- if trade-in involved
  trade_in_value        DECIMAL(12,2) NOT NULL DEFAULT 0,
  gross_profit          DECIMAL(12,2),                          -- computed on delivery

  -- Finance fields (if deal_type = finance)
  lender_name           VARCHAR(255),
  loan_amount           DECIMAL(12,2),
  down_payment          DECIMAL(12,2),
  interest_rate_pct     DECIMAL(5,2),
  loan_term_months      SMALLINT,
  monthly_instalment    DECIMAL(12,2),
  finance_app_status    VARCHAR(50),

  -- Payment tracking
  deposit_paid          DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance_due           DECIMAL(12,2),                          -- computed
  total_paid            DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Status
  status                deal_status   NOT NULL DEFAULT 'draft',
  approval_requested_at TIMESTAMPTZ,
  approved_at           TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,

  -- Documents
  bill_of_sale_url      TEXT,
  bill_of_sale_version  SMALLINT      NOT NULL DEFAULT 0,

  -- Buyer delivery info
  delivery_district     VARCHAR(100),
  delivery_address      TEXT,
  delivery_notes        TEXT,

  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,

  CONSTRAINT pk_deal PRIMARY KEY (id),
  CONSTRAINT chk_deal_sale_price CHECK (sale_price > 0),
  CONSTRAINT chk_deal_discount CHECK (discount_amount >= 0 AND discount_amount <= list_price)
);

ALTER TABLE deal ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_deal ON deal
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE INDEX idx_deal_dealer_status ON deal (dealership_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_deal_vehicle ON deal (vehicle_id);
CREATE INDEX idx_deal_salesperson ON deal (salesperson_id, status);
CREATE INDEX idx_deal_delivered ON deal (dealership_id, delivered_at DESC)
  WHERE status = 'delivered';
```

### Table: `deal_payment`

```sql
CREATE TABLE deal_payment (
  id             UUID            NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID            NOT NULL REFERENCES dealership(id),
  deal_id        UUID            NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
  amount         DECIMAL(12,2)   NOT NULL,
  payment_method payment_method  NOT NULL,
  payment_type   VARCHAR(20)     NOT NULL DEFAULT 'deposit',
  -- 'deposit' | 'instalment' | 'final' | 'refund'
  reference_no   VARCHAR(255),                                  -- bKash/bank ref
  recorded_by    UUID            NOT NULL REFERENCES "user"(id),
  notes          TEXT,
  receipt_url    TEXT,
  paid_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_deal_payment PRIMARY KEY (id),
  CONSTRAINT chk_deal_payment_amount CHECK (amount > 0)
);

ALTER TABLE deal_payment ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_deal_payment ON deal_payment
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE INDEX idx_deal_payment_deal ON deal_payment (deal_id, paid_at DESC);
```

---

## 7. Schema: Expense & Finance Layer

### Table: `expense_category`

```sql
CREATE TABLE expense_category (
  id           UUID        NOT NULL DEFAULT uuid_generate_v4(),
  type         VARCHAR(20) NOT NULL DEFAULT 'vehicle',          -- 'vehicle' | 'operational'
  name         VARCHAR(100) NOT NULL,
  slug         VARCHAR(100) NOT NULL,
  icon         VARCHAR(50),                                     -- icon name
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  sort_order   SMALLINT    NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_expense_category PRIMARY KEY (id),
  CONSTRAINT uq_expense_category_slug UNIQUE (type, slug)
);
-- Pre-seeded data, not tenant-specific (no RLS)
```

### Table: `vehicle_expense` (Type 1)

```sql
CREATE TABLE vehicle_expense (
  id             UUID          NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID          NOT NULL REFERENCES dealership(id),
  vehicle_id     UUID          NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
  recon_task_id  UUID          REFERENCES recon_task(id),       -- if from recon
  category_id    UUID          NOT NULL REFERENCES expense_category(id),
  amount         DECIMAL(12,2) NOT NULL,
  vendor         VARCHAR(255),
  invoice_no     VARCHAR(100),
  date           DATE          NOT NULL DEFAULT CURRENT_DATE,
  receipt_url    TEXT,
  notes          TEXT,
  created_by     UUID          NOT NULL REFERENCES "user"(id),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_vehicle_expense PRIMARY KEY (id),
  CONSTRAINT chk_vehicle_expense_amount CHECK (amount > 0)
);

ALTER TABLE vehicle_expense ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_vehicle_expense ON vehicle_expense
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE INDEX idx_vehicle_expense_vehicle ON vehicle_expense (vehicle_id, date DESC);
CREATE INDEX idx_vehicle_expense_dealer ON vehicle_expense (dealership_id, date DESC);
CREATE INDEX idx_vehicle_expense_category ON vehicle_expense (dealership_id, category_id, date);
```

### Table: `operational_expense` (Type 2)

```sql
CREATE TABLE operational_expense (
  id             UUID            NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID            NOT NULL REFERENCES dealership(id),
  category_id    UUID            NOT NULL REFERENCES expense_category(id),
  amount         DECIMAL(12,2)   NOT NULL,
  date           DATE            NOT NULL DEFAULT CURRENT_DATE,
  payment_method payment_method  NOT NULL DEFAULT 'cash',
  reference_no   VARCHAR(100),
  receipt_url    TEXT,
  notes          TEXT,
  recurring      BOOLEAN         NOT NULL DEFAULT false,
  recur_cycle    recur_cycle,
  recur_parent_id UUID           REFERENCES operational_expense(id),
  -- links auto-created recurring instances to their parent template
  created_by     UUID            NOT NULL REFERENCES "user"(id),
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_operational_expense PRIMARY KEY (id),
  CONSTRAINT chk_operational_expense_amount CHECK (amount > 0),
  CONSTRAINT chk_operational_expense_recur CHECK (
    (recurring = true AND recur_cycle IS NOT NULL) OR
    (recurring = false AND recur_cycle IS NULL)
  )
);

ALTER TABLE operational_expense ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_operational_expense ON operational_expense
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE INDEX idx_op_expense_dealer_date ON operational_expense (dealership_id, date DESC);
CREATE INDEX idx_op_expense_category ON operational_expense (dealership_id, category_id, date);
CREATE INDEX idx_op_expense_recurring ON operational_expense (dealership_id, recurring, recur_cycle)
  WHERE recurring = true;
```

---

## 8. Schema: Marketplace & Public Layer

### Table: `marketplace_listing`

```sql
CREATE TABLE marketplace_listing (
  id                  UUID             NOT NULL DEFAULT uuid_generate_v4(),
  vehicle_id          UUID             REFERENCES vehicle(id),  -- NULL for C2C
  dealership_id       UUID             REFERENCES dealership(id),
  c2c_seller_id       UUID             REFERENCES "user"(id),   -- for C2C listings
  listing_type        listing_type     NOT NULL,
  seller_type         seller_type      NOT NULL,

  -- SEO
  slug                VARCHAR(500)     NOT NULL,
  title               VARCHAR(500)     NOT NULL,
  description         TEXT,

  -- Pricing
  asking_price        DECIMAL(12,2)    NOT NULL,
  original_price      DECIMAL(12,2),                            -- for price_drop badge
  price_updated_at    TIMESTAMPTZ,
  price_drop_flag     BOOLEAN          NOT NULL DEFAULT false,

  -- IMV data (snapshot at last sync)
  imv_p5              DECIMAL(12,2),
  imv_p25             DECIMAL(12,2),
  imv_p50             DECIMAL(12,2),
  imv_p75             DECIMAL(12,2),
  imv_p95             DECIMAL(12,2),
  imv_sample_size     SMALLINT,
  deal_score          DECIMAL(6,4),
  deal_rating         deal_rating      NOT NULL DEFAULT 'unrated',
  deal_rating_updated_at TIMESTAMPTZ,

  -- Specs (denormalized for search performance)
  year                SMALLINT         NOT NULL,
  make                VARCHAR(100)     NOT NULL,
  model               VARCHAR(100)     NOT NULL,
  variant             VARCHAR(200),
  body_type           VARCHAR(50),
  fuel_type           fuel_type        NOT NULL DEFAULT 'petrol',
  transmission        transmission_type NOT NULL DEFAULT 'automatic',
  condition           vehicle_condition NOT NULL DEFAULT 'used',
  mileage_km          INTEGER          NOT NULL,
  mileage_bucket      VARCHAR(20)      NOT NULL,
  color               VARCHAR(50),
  engine_cc           INTEGER,
  seating_capacity    SMALLINT,
  vin                 VARCHAR(17),

  -- Location
  district            VARCHAR(100)     NOT NULL,
  division            VARCHAR(100)     NOT NULL,
  lat                 DECIMAL(9,6),
  lng                 DECIMAL(9,6),

  -- Media
  photos              JSONB            NOT NULL DEFAULT '[]'::jsonb,
  photo_count         SMALLINT         NOT NULL DEFAULT 0,

  -- Status & visibility
  status              listing_status   NOT NULL DEFAULT 'active',
  is_featured         BOOLEAN          NOT NULL DEFAULT false,
  featured_slot       featured_slot,
  featured_until      TIMESTAMPTZ,
  sold_at             TIMESTAMPTZ,

  -- Engagement (denormalized counters)
  views               INTEGER          NOT NULL DEFAULT 0,
  enquiries           INTEGER          NOT NULL DEFAULT 0,
  saves               INTEGER          NOT NULL DEFAULT 0,
  shares              INTEGER          NOT NULL DEFAULT 0,

  -- Moderation (C2C only)
  moderated_by        UUID             REFERENCES "user"(id),
  moderated_at        TIMESTAMPTZ,
  moderation_notes    TEXT,

  -- C2C listing expiry
  expires_at          TIMESTAMPTZ,
  renewal_count       SMALLINT         NOT NULL DEFAULT 0,

  -- Sync metadata
  last_synced_at      TIMESTAMPTZ,
  sync_version        INTEGER          NOT NULL DEFAULT 1,

  created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_marketplace_listing PRIMARY KEY (id),
  CONSTRAINT uq_marketplace_listing_slug UNIQUE (slug),
  CONSTRAINT chk_marketplace_listing_price CHECK (asking_price > 0),
  CONSTRAINT chk_marketplace_listing_type CHECK (
    (listing_type = 'dealer' AND dealership_id IS NOT NULL AND vehicle_id IS NOT NULL) OR
    (listing_type = 'c2c' AND c2c_seller_id IS NOT NULL)
  ),
  CONSTRAINT chk_marketplace_listing_featured CHECK (
    (is_featured = false AND featured_slot IS NULL) OR
    (is_featured = true AND featured_slot IS NOT NULL AND featured_until IS NOT NULL)
  )
);

-- NOTE: No RLS on marketplace_listing — it is the public read layer.
-- Write access is restricted to SyncService (dealer listings)
-- and authenticated C2C sellers (own listings only, enforced in application layer).

CREATE INDEX idx_ml_search ON marketplace_listing
  (make, model, year, district, deal_rating, status)
  WHERE status = 'active';

CREATE INDEX idx_ml_price ON marketplace_listing (asking_price)
  WHERE status = 'active';

CREATE INDEX idx_ml_mileage ON marketplace_listing (mileage_km)
  WHERE status = 'active';

CREATE INDEX idx_ml_featured ON marketplace_listing (featured_slot, featured_until)
  WHERE is_featured = true AND status = 'active';

CREATE INDEX idx_ml_dealership ON marketplace_listing (dealership_id, status);

CREATE INDEX idx_ml_vehicle ON marketplace_listing (vehicle_id)
  WHERE vehicle_id IS NOT NULL;

CREATE INDEX idx_ml_created ON marketplace_listing (created_at DESC)
  WHERE status = 'active';

CREATE INDEX idx_ml_deal_score ON marketplace_listing (deal_score ASC)
  WHERE status = 'active' AND deal_score IS NOT NULL;

CREATE INDEX idx_ml_views ON marketplace_listing (views DESC)
  WHERE status = 'active';

CREATE INDEX idx_ml_expiry ON marketplace_listing (expires_at)
  WHERE listing_type = 'c2c' AND status = 'active';

CREATE INDEX idx_ml_fts ON marketplace_listing
  USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));

CREATE INDEX idx_ml_body_type ON marketplace_listing (body_type, district, status)
  WHERE status = 'active';

CREATE INDEX idx_ml_fuel_type ON marketplace_listing (fuel_type, status)
  WHERE status = 'active';
```

### Table: `listing_flag`

```sql
CREATE TABLE listing_flag (
  id              UUID        NOT NULL DEFAULT uuid_generate_v4(),
  listing_id      UUID        NOT NULL REFERENCES marketplace_listing(id) ON DELETE CASCADE,
  flagged_by      UUID        REFERENCES "user"(id),            -- NULL for anonymous flags
  flagged_by_ip   INET,
  reason          VARCHAR(100) NOT NULL,
  description     TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- 'pending'|'reviewed'|'dismissed'|'actioned'
  reviewed_by     UUID        REFERENCES "user"(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_listing_flag PRIMARY KEY (id)
);

CREATE INDEX idx_listing_flag_listing ON listing_flag (listing_id, status);
```

### Table: `saved_vehicle`

```sql
CREATE TABLE saved_vehicle (
  id          UUID        NOT NULL DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  listing_id  UUID        NOT NULL REFERENCES marketplace_listing(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_saved_vehicle PRIMARY KEY (id),
  CONSTRAINT uq_saved_vehicle UNIQUE (user_id, listing_id)
);

CREATE INDEX idx_saved_vehicle_user ON saved_vehicle (user_id, created_at DESC);
```

### Table: `saved_search`

```sql
CREATE TABLE saved_search (
  id             UUID        NOT NULL DEFAULT uuid_generate_v4(),
  user_id        UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name           VARCHAR(255),
  filters        JSONB       NOT NULL,
  -- { "make": "Toyota", "model": "Axio", "district": "Dhaka",
  --   "price_max": 1800000, "year_min": 2018 }
  alert_enabled  BOOLEAN     NOT NULL DEFAULT true,
  alert_channel  notification_channel NOT NULL DEFAULT 'push',
  last_alerted_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_saved_search PRIMARY KEY (id)
);

CREATE INDEX idx_saved_search_user ON saved_search (user_id);
CREATE INDEX idx_saved_search_alerts ON saved_search (alert_enabled, last_alerted_at)
  WHERE alert_enabled = true;
```

### Table: `buyer_review`

```sql
CREATE TABLE buyer_review (
  id             UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID        NOT NULL REFERENCES dealership(id),
  deal_id        UUID        REFERENCES deal(id),
  reviewer_id    UUID        NOT NULL REFERENCES "user"(id),
  rating         SMALLINT    NOT NULL,
  title          VARCHAR(255),
  body           TEXT,
  is_verified    BOOLEAN     NOT NULL DEFAULT false,            -- verified purchase
  is_published   BOOLEAN     NOT NULL DEFAULT false,
  moderated_by   UUID        REFERENCES "user"(id),
  moderated_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_buyer_review PRIMARY KEY (id),
  CONSTRAINT chk_buyer_review_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT uq_buyer_review_deal UNIQUE (deal_id, reviewer_id)
);

CREATE INDEX idx_buyer_review_dealership ON buyer_review (dealership_id, is_published);
```

---

## 9. Schema: IMV & Pricing Layer

### Table: `imv_cluster`

```sql
CREATE TABLE imv_cluster (
  id                UUID          NOT NULL DEFAULT uuid_generate_v4(),
  make              VARCHAR(100)  NOT NULL,
  model             VARCHAR(100)  NOT NULL,
  year              SMALLINT      NOT NULL,
  mileage_bucket    VARCHAR(20)   NOT NULL,
  condition         vehicle_condition NOT NULL,
  district          VARCHAR(100)  NOT NULL,

  -- Percentiles
  p5                DECIMAL(12,2),
  p10               DECIMAL(12,2),
  p25               DECIMAL(12,2),
  p50               DECIMAL(12,2),
  p75               DECIMAL(12,2),
  p90               DECIMAL(12,2),
  p95               DECIMAL(12,2),
  p99               DECIMAL(12,2),
  mean              DECIMAL(12,2),
  stddev            DECIMAL(12,2),

  -- Data quality
  sample_size       INTEGER       NOT NULL DEFAULT 0,
  confidence        VARCHAR(10)   NOT NULL DEFAULT 'low',
  -- 'none' (<5) | 'low' (5-9) | 'medium' (10-29) | 'high' (30+)
  is_override       BOOLEAN       NOT NULL DEFAULT false,
  override_p50      DECIMAL(12,2),                              -- manual override value
  override_reason   TEXT,
  override_expires_at TIMESTAMPTZ,
  override_by       UUID          REFERENCES "user"(id),

  -- Trend data (vs previous period)
  prev_p50          DECIMAL(12,2),
  pct_change_30d    DECIMAL(6,3),                               -- % change in p50 last 30 days
  trend_direction   VARCHAR(10),                                -- 'up'|'down'|'stable'

  last_calculated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_imv_cluster PRIMARY KEY (id),
  CONSTRAINT uq_imv_cluster UNIQUE (make, model, year, mileage_bucket, condition, district)
);

CREATE UNIQUE INDEX idx_imv_cluster_lookup ON imv_cluster
  (make, model, year, mileage_bucket, condition, district);

CREATE INDEX idx_imv_cluster_make_model ON imv_cluster (make, model, year);
CREATE INDEX idx_imv_cluster_override ON imv_cluster (is_override, override_expires_at)
  WHERE is_override = true;
```

### Table: `imv_calculation_run`

```sql
CREATE TABLE imv_calculation_run (
  id               UUID        NOT NULL DEFAULT uuid_generate_v4(),
  started_at       TIMESTAMPTZ NOT NULL,
  completed_at     TIMESTAMPTZ,
  clusters_updated INTEGER,
  listings_rated   INTEGER,
  triggered_by     VARCHAR(50) NOT NULL DEFAULT 'nightly_cron',
  -- 'nightly_cron' | 'price_update' | 'manual'
  status           VARCHAR(20) NOT NULL DEFAULT 'running',
  -- 'running' | 'complete' | 'failed'
  error            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_imv_calculation_run PRIMARY KEY (id)
);
```

### Table: `price_trend`

```sql
CREATE TABLE price_trend (
  id             UUID          NOT NULL DEFAULT uuid_generate_v4(),
  make           VARCHAR(100)  NOT NULL,
  model          VARCHAR(100)  NOT NULL,
  year           SMALLINT      NOT NULL,
  district       VARCHAR(100)  NOT NULL,
  recorded_date  DATE          NOT NULL,
  avg_price      DECIMAL(12,2) NOT NULL,
  median_price   DECIMAL(12,2) NOT NULL,
  listing_count  INTEGER       NOT NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_price_trend PRIMARY KEY (id),
  CONSTRAINT uq_price_trend UNIQUE (make, model, year, district, recorded_date)
);

CREATE INDEX idx_price_trend_model ON price_trend (make, model, year, district, recorded_date DESC);
```

---

## 10. Schema: Automation Layer

### Table: `automation_rule`

```sql
CREATE TABLE automation_rule (
  id              UUID               NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id   UUID               NOT NULL REFERENCES dealership(id),
  channel         automation_channel NOT NULL,
  rule_type       VARCHAR(100)       NOT NULL,
  -- 'greeting_message' | 'away_message' | 'lead_followup_sequence'
  -- 'abandoned_lead' | 'post_sale_sequence' | 'inventory_alert'
  -- 'fb_inbox_reply' | 'fb_keyword_trigger' | 'social_auto_post'
  -- 'email_sequence' | 'sms_campaign' | 'hot_lead_sms'
  name            VARCHAR(255)       NOT NULL,
  trigger_event   VARCHAR(100)       NOT NULL,
  -- 'lead.created' | 'vehicle.available' | 'deal.delivered'
  -- 'message.received.outside_hours' | 'message.received.new_contact'
  -- 'lead.score.threshold' | 'lead.stale' | 'time.daily_cron'
  conditions      JSONB              NOT NULL DEFAULT '{}'::jsonb,
  -- { "score_threshold": 70, "stage": "new", "source": ["marketplace"] }
  actions         JSONB              NOT NULL DEFAULT '[]'::jsonb,
  -- [{ "type": "send_whatsapp", "template": "lead_instant_reply",
  --    "delay_hours": 0 }]
  sequence_steps  JSONB,
  -- for multi-step sequences:
  -- [{ "step": 1, "delay_hours": 0, "condition": "always",
  --    "template": "lead_instant_reply" }, ...]
  is_active       BOOLEAN            NOT NULL DEFAULT true,
  execution_count INTEGER            NOT NULL DEFAULT 0,        -- total times triggered
  last_executed_at TIMESTAMPTZ,
  created_by      UUID               NOT NULL REFERENCES "user"(id),
  created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_automation_rule PRIMARY KEY (id)
);

ALTER TABLE automation_rule ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_automation_rule ON automation_rule
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE INDEX idx_automation_rule_dealer ON automation_rule
  (dealership_id, channel, is_active);
CREATE INDEX idx_automation_rule_trigger ON automation_rule
  (trigger_event, is_active) WHERE is_active = true;
```

### Table: `automation_log`

```sql
CREATE TABLE automation_log (
  id              UUID               NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id   UUID               NOT NULL REFERENCES dealership(id),
  rule_id         UUID               REFERENCES automation_rule(id),
  channel         automation_channel NOT NULL,
  trigger_event   VARCHAR(100)       NOT NULL,
  contact_id      UUID,                                          -- lead_id or customer_id
  contact_type    VARCHAR(20),                                   -- 'lead' | 'customer'
  vehicle_id      UUID               REFERENCES vehicle(id),
  template_name   VARCHAR(100),
  message_preview TEXT,                                          -- first 200 chars
  status          automation_status  NOT NULL DEFAULT 'queued',
  provider        VARCHAR(50),                                   -- 'greenweb'|'meta'|'resend'
  provider_message_id VARCHAR(255),
  error_message   TEXT,
  retry_count     SMALLINT           NOT NULL DEFAULT 0,
  metadata        JSONB,
  created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  sent_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,

  CONSTRAINT pk_automation_log PRIMARY KEY (id)
);

ALTER TABLE automation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_automation_log ON automation_log
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE INDEX idx_automation_log_dealer ON automation_log
  (dealership_id, channel, created_at DESC);
CREATE INDEX idx_automation_log_contact ON automation_log
  (contact_id, channel, created_at DESC) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_automation_log_status ON automation_log (status, created_at)
  WHERE status IN ('queued', 'failed');

-- Retention: 90-day TTL enforced via scheduled DELETE job
CREATE INDEX idx_automation_log_retention ON automation_log (created_at)
  WHERE created_at < NOW() - INTERVAL '90 days';
```

### Table: `whatsapp_template`

```sql
CREATE TABLE whatsapp_template (
  id             UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID        NOT NULL REFERENCES dealership(id),
  name           VARCHAR(100) NOT NULL,
  body           TEXT        NOT NULL,                          -- with {{variables}}
  category       VARCHAR(50) NOT NULL DEFAULT 'quick_reply',
  -- 'quick_reply' | 'sequence' | 'away' | 'greeting' | 'campaign'
  language       language_pref NOT NULL DEFAULT 'bn',
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  sort_order     SMALLINT    NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_whatsapp_template PRIMARY KEY (id)
);

ALTER TABLE whatsapp_template ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_whatsapp_template ON whatsapp_template
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);
```

### Table: `social_post_queue`

```sql
CREATE TABLE social_post_queue (
  id               UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id    UUID        NOT NULL REFERENCES dealership(id),
  vehicle_id       UUID        REFERENCES vehicle(id),
  platform         VARCHAR(20) NOT NULL DEFAULT 'facebook',
  -- 'facebook' | 'instagram' | 'linkedin'
  caption          TEXT        NOT NULL,
  image_urls       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  hashtags         TEXT,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'draft',
  -- 'draft'|'pending_approval'|'scheduled'|'published'|'failed'|'cancelled'
  platform_post_id VARCHAR(255),                               -- FB/IG post ID after publish
  approved_by      UUID        REFERENCES "user"(id),
  approved_at      TIMESTAMPTZ,
  published_at     TIMESTAMPTZ,
  error_message    TEXT,
  automation_rule_id UUID      REFERENCES automation_rule(id), -- if auto-generated
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_social_post_queue PRIMARY KEY (id)
);

ALTER TABLE social_post_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_social_post_queue ON social_post_queue
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE INDEX idx_social_post_queue_scheduled ON social_post_queue
  (dealership_id, scheduled_at) WHERE status = 'scheduled';
```

---

## 11. Schema: Website & Marketing Layer

### Table: `dealer_website`

```sql
CREATE TABLE dealer_website (
  id                      UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id           UUID        NOT NULL REFERENCES dealership(id) ON DELETE CASCADE,
  subdomain               VARCHAR(100) NOT NULL,
  custom_domain           VARCHAR(255),
  custom_domain_verified  BOOLEAN     NOT NULL DEFAULT false,
  custom_domain_verified_at TIMESTAMPTZ,
  ssl_provisioned         BOOLEAN     NOT NULL DEFAULT false,
  status                  VARCHAR(20) NOT NULL DEFAULT 'active',
  -- 'active' | 'suspended' | 'maintenance'

  -- SEO config
  meta_title              VARCHAR(255),
  meta_description        TEXT,
  google_analytics_id     VARCHAR(50),
  facebook_pixel_id       VARCHAR(50),
  google_tag_manager_id   VARCHAR(50),
  gsc_verified            BOOLEAN     NOT NULL DEFAULT false,

  -- GMC integration
  gmc_merchant_id         VARCHAR(50),
  gmc_feed_enabled        BOOLEAN     NOT NULL DEFAULT false,
  gmc_last_sync_at        TIMESTAMPTZ,
  gmc_last_sync_status    VARCHAR(20),
  gmc_last_sync_errors    INTEGER,

  -- Facebook catalog
  fb_catalog_id           VARCHAR(50),
  fb_catalog_enabled      BOOLEAN     NOT NULL DEFAULT false,
  fb_catalog_last_sync_at TIMESTAMPTZ,
  fb_page_id              VARCHAR(50),
  fb_business_manager_id  VARCHAR(50),

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_dealer_website PRIMARY KEY (id),
  CONSTRAINT uq_dealer_website UNIQUE (dealership_id),
  CONSTRAINT uq_dealer_website_subdomain UNIQUE (subdomain),
  CONSTRAINT uq_dealer_website_custom_domain UNIQUE (custom_domain)
);

ALTER TABLE dealer_website ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_dealer_website ON dealer_website
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE INDEX idx_dealer_website_custom_domain ON dealer_website (custom_domain)
  WHERE custom_domain IS NOT NULL AND custom_domain_verified = true;
```

### Table: `dealer_integration`

```sql
CREATE TABLE dealer_integration (
  id              UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id   UUID        NOT NULL REFERENCES dealership(id) ON DELETE CASCADE,
  provider        VARCHAR(50) NOT NULL,
  -- 'whatsapp_api' | 'manychat' | 'aisensy' | 'kommo' | 'respondio'
  -- 'facebook_business' | 'google_analytics' | 'google_merchant_center'
  access_token    TEXT,                                          -- AES-256 encrypted
  refresh_token   TEXT,                                          -- AES-256 encrypted
  token_expires_at TIMESTAMPTZ,
  config          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  -- provider-specific config: account IDs, webhook URLs, etc.
  status          VARCHAR(20) NOT NULL DEFAULT 'active',
  -- 'active' | 'expired' | 'error' | 'disconnected'
  last_used_at    TIMESTAMPTZ,
  error_message   TEXT,
  connected_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  connected_by    UUID        REFERENCES "user"(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_dealer_integration PRIMARY KEY (id),
  CONSTRAINT uq_dealer_integration UNIQUE (dealership_id, provider)
);

ALTER TABLE dealer_integration ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_dealer_integration ON dealer_integration
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);
```

### Table: `gmc_feed_log`

```sql
CREATE TABLE gmc_feed_log (
  id              UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id   UUID        NOT NULL REFERENCES dealership(id),
  vehicle_id      UUID        REFERENCES vehicle(id),
  operation       VARCHAR(20) NOT NULL DEFAULT 'upsert',
  -- 'upsert' | 'delete' | 'full_feed'
  status          VARCHAR(20) NOT NULL,
  -- 'success' | 'rejected' | 'error'
  rejection_reason TEXT,
  gmc_item_id     VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_gmc_feed_log PRIMARY KEY (id)
);

CREATE INDEX idx_gmc_feed_log_dealer ON gmc_feed_log
  (dealership_id, created_at DESC);
CREATE INDEX idx_gmc_feed_log_errors ON gmc_feed_log
  (dealership_id, status, created_at DESC) WHERE status != 'success';
```

---

## 12. Schema: Payments & Billing Layer

### Table: `subscription`

```sql
CREATE TABLE subscription (
  id                UUID              NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id     UUID              NOT NULL REFERENCES dealership(id),
  plan_id           UUID              NOT NULL REFERENCES plan_config(id),
  tier              subscription_tier NOT NULL,
  status            VARCHAR(20)       NOT NULL DEFAULT 'active',
  -- 'active' | 'grace_period' | 'expired' | 'cancelled' | 'trial'
  started_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ       NOT NULL,
  cancelled_at      TIMESTAMPTZ,
  cancellation_reason TEXT,
  auto_renew        BOOLEAN           NOT NULL DEFAULT true,
  monthly_price_bdt DECIMAL(10,2)     NOT NULL,                  -- locked at time of subscription
  currency          VARCHAR(3)        NOT NULL DEFAULT 'BDT',
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_subscription PRIMARY KEY (id),
  CONSTRAINT uq_subscription_dealer UNIQUE (dealership_id)
  -- one active subscription per dealer
);

CREATE INDEX idx_subscription_expires ON subscription (expires_at, status)
  WHERE status = 'active';
CREATE INDEX idx_subscription_grace ON subscription (expires_at)
  WHERE status = 'grace_period';
```

### Table: `invoice`

```sql
CREATE TABLE invoice (
  id               UUID            NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id    UUID            NOT NULL REFERENCES dealership(id),
  invoice_no       VARCHAR(50)     NOT NULL,
  type             VARCHAR(30)     NOT NULL DEFAULT 'subscription',
  -- 'subscription' | 'per_lead' | 'c2c_listing' | 'featured_boost' | 'valuation'
  amount_bdt       DECIMAL(10,2)   NOT NULL,
  discount_bdt     DECIMAL(10,2)   NOT NULL DEFAULT 0,
  total_bdt        DECIMAL(10,2)   NOT NULL,
  status           VARCHAR(20)     NOT NULL DEFAULT 'pending',
  -- 'pending' | 'paid' | 'failed' | 'refunded' | 'waived'
  due_date         DATE            NOT NULL,
  paid_at          TIMESTAMPTZ,
  period_start     DATE,
  period_end       DATE,
  pdf_url          TEXT,
  idempotency_key  VARCHAR(100),                                  -- prevents double-charge
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_invoice PRIMARY KEY (id),
  CONSTRAINT uq_invoice_no UNIQUE (invoice_no),
  CONSTRAINT uq_invoice_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX idx_invoice_dealer ON invoice (dealership_id, created_at DESC);
CREATE INDEX idx_invoice_status ON invoice (status, due_date)
  WHERE status IN ('pending', 'failed');
```

### Table: `payment_transaction`

```sql
CREATE TABLE payment_transaction (
  id                  UUID            NOT NULL DEFAULT uuid_generate_v4(),
  invoice_id          UUID            NOT NULL REFERENCES invoice(id),
  dealership_id       UUID            NOT NULL REFERENCES dealership(id),
  idempotency_key     VARCHAR(100)    NOT NULL,
  payment_method      payment_method  NOT NULL,
  gateway             VARCHAR(30)     NOT NULL,
  -- 'bkash' | 'nagad' | 'sslcommerz' | 'manual'
  amount_bdt          DECIMAL(10,2)   NOT NULL,
  status              VARCHAR(20)     NOT NULL DEFAULT 'initiated',
  -- 'initiated'|'pending'|'success'|'failed'|'cancelled'|'refunded'
  gateway_transaction_id VARCHAR(255),
  gateway_response    JSONB,                                      -- raw gateway response
  initiated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  failure_reason      VARCHAR(255),
  attempt_number      SMALLINT        NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_payment_transaction PRIMARY KEY (id),
  CONSTRAINT uq_payment_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX idx_payment_transaction_invoice ON payment_transaction
  (invoice_id, created_at DESC);
CREATE INDEX idx_payment_transaction_status ON payment_transaction
  (status, created_at) WHERE status IN ('initiated', 'pending', 'failed');
CREATE INDEX idx_payment_transaction_gateway ON payment_transaction
  (gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;
```

### Table: `refund`

```sql
CREATE TABLE refund (
  id                  UUID          NOT NULL DEFAULT uuid_generate_v4(),
  payment_id          UUID          NOT NULL REFERENCES payment_transaction(id),
  dealership_id       UUID          NOT NULL REFERENCES dealership(id),
  amount_bdt          DECIMAL(10,2) NOT NULL,
  reason              TEXT          NOT NULL,
  status              VARCHAR(20)   NOT NULL DEFAULT 'pending',
  gateway_refund_id   VARCHAR(255),
  approved_by         UUID          REFERENCES "user"(id),
  approved_at         TIMESTAMPTZ,
  processed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_refund PRIMARY KEY (id),
  CONSTRAINT chk_refund_amount CHECK (amount_bdt > 0)
);
```

---

## 13. Schema: Notifications & Comms Layer

### Table: `notification`

```sql
CREATE TABLE notification (
  id             UUID                 NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID                 REFERENCES dealership(id),
  user_id        UUID                 NOT NULL REFERENCES "user"(id),
  channel        notification_channel NOT NULL,
  type           VARCHAR(100)         NOT NULL,
  -- 'new_lead' | 'lead_uncontacted_2h' | 'hot_lead' | 'aging_alert'
  -- 'deal_approval_needed' | 'daily_summary' | 'payment_due' | 'sync_error'
  title          VARCHAR(255),
  body           TEXT                 NOT NULL,
  deep_link      TEXT,                                           -- app deeplink URL
  metadata       JSONB,
  is_read        BOOLEAN              NOT NULL DEFAULT false,
  read_at        TIMESTAMPTZ,
  status         automation_status    NOT NULL DEFAULT 'queued',
  provider_id    VARCHAR(255),                                   -- FCM/SMS provider ID
  created_at     TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  sent_at        TIMESTAMPTZ,

  CONSTRAINT pk_notification PRIMARY KEY (id)
);

CREATE INDEX idx_notification_user ON notification (user_id, is_read, created_at DESC);
CREATE INDEX idx_notification_dealer ON notification (dealership_id, created_at DESC)
  WHERE dealership_id IS NOT NULL;
CREATE INDEX idx_notification_unread ON notification (user_id, created_at DESC)
  WHERE is_read = false;
```

### Table: `sms_log`

```sql
CREATE TABLE sms_log (
  id             UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID        REFERENCES dealership(id),
  recipient      VARCHAR(20) NOT NULL,
  message        TEXT        NOT NULL,
  type           VARCHAR(50) NOT NULL,
  provider       VARCHAR(30) NOT NULL DEFAULT 'greenweb',
  provider_msg_id VARCHAR(100),
  status         VARCHAR(20) NOT NULL DEFAULT 'queued',
  -- 'queued'|'sent'|'delivered'|'failed'|'undelivered'
  error_code     VARCHAR(20),
  error_message  TEXT,
  cost_units     DECIMAL(6,4),                                   -- SMS credit cost
  sent_at        TIMESTAMPTZ,
  delivered_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_sms_log PRIMARY KEY (id)
);

CREATE INDEX idx_sms_log_recipient ON sms_log (recipient, created_at DESC);
CREATE INDEX idx_sms_log_status ON sms_log (status, created_at)
  WHERE status IN ('queued', 'failed');

-- 90-day retention
```

---

## 14. Schema: Admin & Platform Layer

### Table: `admin_user`

```sql
CREATE TABLE admin_user (
  id               UUID        NOT NULL DEFAULT uuid_generate_v4(),
  user_id          UUID        NOT NULL REFERENCES "user"(id),
  admin_role       VARCHAR(50) NOT NULL,
  -- 'super_admin' | 'operations_manager' | 'finance_admin'
  -- 'content_moderator' | 'marketing_admin' | 'system_admin'
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  ip_allowlist     JSONB,                                        -- ["x.x.x.x", "y.y.y.y"]
  two_fa_enabled   BOOLEAN     NOT NULL DEFAULT true,
  two_fa_secret    TEXT,                                         -- TOTP secret (encrypted)
  last_login_at    TIMESTAMPTZ,
  last_login_ip    INET,
  session_timeout_min SMALLINT NOT NULL DEFAULT 30,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_admin_user PRIMARY KEY (id),
  CONSTRAINT uq_admin_user UNIQUE (user_id)
);
```

### Table: `feature_flag`

```sql
CREATE TABLE feature_flag (
  id              UUID        NOT NULL DEFAULT uuid_generate_v4(),
  key             VARCHAR(100) NOT NULL,
  description     TEXT,
  enabled_global  BOOLEAN     NOT NULL DEFAULT false,
  enabled_for_plans JSONB,
  -- ["professional", "business", "enterprise"]
  enabled_for_dealers JSONB,
  -- ["dealer-uuid-1", "dealer-uuid-2"]   (beta testers / enterprise overrides)
  rollout_pct     SMALLINT,                                      -- 0-100 gradual rollout
  created_by      UUID        NOT NULL REFERENCES "user"(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_feature_flag PRIMARY KEY (id),
  CONSTRAINT uq_feature_flag_key UNIQUE (key),
  CONSTRAINT chk_feature_flag_rollout CHECK (rollout_pct IS NULL OR rollout_pct BETWEEN 0 AND 100)
);

CREATE INDEX idx_feature_flag_key ON feature_flag (key);
```

### Table: `suspended_entity`

```sql
CREATE TABLE suspended_entity (
  id               UUID        NOT NULL DEFAULT uuid_generate_v4(),
  entity_type      VARCHAR(20) NOT NULL,
  -- 'phone' | 'email' | 'trade_license' | 'ip_address' | 'business_name'
  entity_value     VARCHAR(255) NOT NULL,
  reason           TEXT        NOT NULL,
  added_by         UUID        NOT NULL REFERENCES "user"(id),
  expires_at       TIMESTAMPTZ,                                  -- NULL = permanent
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_suspended_entity PRIMARY KEY (id),
  CONSTRAINT uq_suspended_entity UNIQUE (entity_type, entity_value)
);

CREATE INDEX idx_suspended_entity_lookup ON suspended_entity (entity_type, entity_value);
```

### Table: `broadcast_message`

```sql
CREATE TABLE broadcast_message (
  id              UUID               NOT NULL DEFAULT uuid_generate_v4(),
  title           VARCHAR(255)       NOT NULL,
  body            TEXT               NOT NULL,
  target_type     VARCHAR(20)        NOT NULL DEFAULT 'all_dealers',
  -- 'all_dealers' | 'plan_tier' | 'district' | 'specific_dealers'
  target_filter   JSONB,                                         -- filter criteria
  channel         notification_channel NOT NULL,
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  status          VARCHAR(20)        NOT NULL DEFAULT 'draft',
  sent_count      INTEGER            NOT NULL DEFAULT 0,
  created_by      UUID               NOT NULL REFERENCES "user"(id),
  created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_broadcast_message PRIMARY KEY (id)
);
```

---

## 15. Schema: Audit Trail System

### Design Principles

```
WHAT IS AUDITED:
  ALL state-changing operations on business-critical entities:
    dealer: approval, suspension, termination, plan changes
    marketplace_listing: moderation decisions, IMV overrides
    vehicle: status changes (separate vehicle_status_history table)
    deal: approval, cancellation, delivery
    admin actions: ALL — impersonation, overrides, flag operations
    payment: all payment events, refunds
    user: account creation, role changes, deletion
    feature_flag: every toggle (affects all tenants)
    automation_rule: create, update, delete (affects dealer communication)

WHAT IS NOT AUDITED (to avoid log bloat):
    Read operations (SELECT)
    Lead interaction logs (already fully logged in lead_interaction)
    Automation execution logs (already in automation_log)
    SMS/notification logs (already in sms_log, notification)
    View counter increments

TWO-TABLE STRATEGY:
  platform_audit_log: admin actions only (highest sensitivity)
  entity_change_log:  dealer-side business entity changes
```

### Table: `platform_audit_log`

```sql
CREATE TABLE platform_audit_log (
  id            UUID        NOT NULL DEFAULT uuid_generate_v4(),
  actor_id      UUID        NOT NULL REFERENCES "user"(id),
  actor_role    VARCHAR(50) NOT NULL,
  actor_ip      INET,
  action        VARCHAR(100) NOT NULL,
  -- 'dealer.approved' | 'dealer.suspended' | 'dealer.terminated'
  -- 'listing.approved' | 'listing.rejected' | 'listing.flagged'
  -- 'imv.override_applied' | 'imv.override_approved'
  -- 'plan.changed' | 'invoice.waived' | 'payment.refunded'
  -- 'user.impersonated' | 'feature_flag.toggled'
  -- 'admin_user.created' | 'admin_user.role_changed'
  target_type   VARCHAR(50) NOT NULL,
  target_id     UUID        NOT NULL,
  before_state  JSONB,
  after_state   JSONB,
  reason        TEXT,
  session_id    UUID,
  impersonating_dealer_id UUID REFERENCES dealership(id),       -- if impersonation active
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_platform_audit_log PRIMARY KEY (id)
);

-- No RLS — admin-only access enforced at application layer (admin JWT required)
CREATE INDEX idx_pal_actor ON platform_audit_log (actor_id, created_at DESC);
CREATE INDEX idx_pal_target ON platform_audit_log (target_type, target_id, created_at DESC);
CREATE INDEX idx_pal_action ON platform_audit_log (action, created_at DESC);
CREATE INDEX idx_pal_created ON platform_audit_log (created_at DESC);
-- Retention: 7 years (regulatory compliance)
```

### Table: `entity_change_log`

```sql
CREATE TABLE entity_change_log (
  id             UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID        REFERENCES dealership(id),          -- NULL for non-tenant entities
  actor_id       UUID        NOT NULL REFERENCES "user"(id),
  actor_role     VARCHAR(50) NOT NULL,
  entity_type    VARCHAR(50) NOT NULL,
  -- 'vehicle' | 'lead' | 'deal' | 'customer' | 'expense'
  -- 'automation_rule' | 'dealer_settings' | 'subscription'
  entity_id      UUID        NOT NULL,
  action         VARCHAR(50) NOT NULL,
  -- 'created' | 'updated' | 'deleted' | 'status_changed' | 'published' | 'unpublished'
  changed_fields JSONB,                                           -- { "field": [old, new] }
  before_state   JSONB,                                           -- full snapshot before change
  after_state    JSONB,                                           -- full snapshot after change
  ip_address     INET,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_entity_change_log PRIMARY KEY (id)
);

CREATE INDEX idx_ecl_entity ON entity_change_log (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_ecl_dealer ON entity_change_log (dealership_id, created_at DESC)
  WHERE dealership_id IS NOT NULL;
CREATE INDEX idx_ecl_actor ON entity_change_log (actor_id, created_at DESC);
-- Retention: 3 years
```

### Table: `sync_audit_log`

```sql
CREATE TABLE sync_audit_log (
  id              UUID             NOT NULL DEFAULT uuid_generate_v4(),
  vehicle_id      UUID             NOT NULL REFERENCES vehicle(id),
  dealership_id   UUID             NOT NULL REFERENCES dealership(id),
  event_type      sync_event_type  NOT NULL,
  status          sync_status      NOT NULL,
  attempt_number  SMALLINT         NOT NULL DEFAULT 1,
  duration_ms     INTEGER,
  error_message   TEXT,
  fan_out_results JSONB,
  -- { "website_isr": "success", "gmc": "failed",
  --   "fb_catalog": "success", "whatsapp_alert": "skipped" }
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_sync_audit_log PRIMARY KEY (id)
);

CREATE INDEX idx_sal_vehicle ON sync_audit_log (vehicle_id, created_at DESC);
CREATE INDEX idx_sal_dealer ON sync_audit_log (dealership_id, created_at DESC);
CREATE INDEX idx_sal_failed ON sync_audit_log (status, created_at)
  WHERE status IN ('failed', 'dlq');
-- Retention: 30 days
```

### Table: `maestro_insight`

```sql
CREATE TABLE maestro_insight (
  id             UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID        NOT NULL REFERENCES dealership(id),
  type           VARCHAR(50) NOT NULL,
  -- 'PRICING' | 'DEMAND' | 'CONVERSION' | 'EXPENSE' | 'AUTOMATION' | 'RECON_QUALITY'
  priority       SMALLINT    NOT NULL DEFAULT 5,                 -- 1 (urgent) to 10
  title          VARCHAR(255) NOT NULL,
  message        TEXT        NOT NULL,
  supporting_data JSONB,
  deep_link      TEXT,
  is_actioned    BOOLEAN     NOT NULL DEFAULT false,
  is_dismissed   BOOLEAN     NOT NULL DEFAULT false,
  actioned_at    TIMESTAMPTZ,
  actioned_by    UUID        REFERENCES "user"(id),
  generated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL,                           -- next nightly run replaces

  CONSTRAINT pk_maestro_insight PRIMARY KEY (id)
);

ALTER TABLE maestro_insight ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_maestro_insight ON maestro_insight
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE INDEX idx_maestro_insight_dealer ON maestro_insight
  (dealership_id, priority, is_actioned, is_dismissed)
  WHERE expires_at > NOW();
```

---

## 16. Indexing Strategy — 500K+ Listings

### Index Design Philosophy

```
RULE 1: Index what you filter, not what you store.
  Bad:  Index every column in marketplace_listing
  Good: Index only columns that appear in WHERE, ORDER BY, or JOIN clauses

RULE 2: Partial indexes reduce index size dramatically.
  Full index on marketplace_listing.status = 500K rows
  Partial WHERE status = 'active' = ~400K rows (80% typical active rate)
  Filtering on an already-filtered index is faster and smaller

RULE 3: Composite index column order = most selective first.
  (make, model, year, district) not (year, make, model, district)
  make has ~50 distinct values; year has ~30; district has ~64
  → make first reduces scan set fastest

RULE 4: Covering indexes avoid heap fetches for hot queries.
  INCLUDE extra columns that are read but not filtered
  Avoids second lookup from index to heap row

RULE 5: GIN for JSONB and full-text.
  JSONB operators (@>, ?, ?|) require GIN, not B-tree
  to_tsvector full-text requires GIN

RULE 6: Monitor with pg_stat_user_indexes.
  Unused indexes → drop (they cost write performance and storage)
  Slow queries → pg_stat_statements → missing index candidates
```

### Complete Index Definitions

```sql
-- ─────────────────────────────────────────────────
-- marketplace_listing: Search & Filter (PRIMARY HOT PATH)
-- ─────────────────────────────────────────────────

-- Main search: composite covering index for common filter combinations
CREATE INDEX idx_ml_search_core ON marketplace_listing
  (make, model, year, district, deal_rating, status, asking_price)
  WHERE status = 'active';

-- Price range filter
CREATE INDEX idx_ml_price ON marketplace_listing (asking_price ASC)
  WHERE status = 'active';

-- Mileage filter
CREATE INDEX idx_ml_mileage ON marketplace_listing (mileage_km ASC)
  WHERE status = 'active';

-- Body type + district browse (for /cars/[district] pages)
CREATE INDEX idx_ml_district_body ON marketplace_listing (district, body_type, status)
  WHERE status = 'active';

-- Deal score sort (Best Deals page)
CREATE INDEX idx_ml_deal_score ON marketplace_listing
  (deal_score ASC NULLS LAST)
  WHERE status = 'active' AND deal_score IS NOT NULL;

-- Featured listings (homepage hero, search_top, category_top)
CREATE INDEX idx_ml_featured ON marketplace_listing
  (featured_slot, is_featured, featured_until)
  WHERE is_featured = true AND status = 'active';

-- Dealer profile page (all listings for one dealer)
CREATE INDEX idx_ml_dealership_active ON marketplace_listing
  (dealership_id, status, created_at DESC)
  WHERE status = 'active';

-- Sync engine: vehicle_id lookup (sync updates by vehicle_id)
CREATE INDEX idx_ml_vehicle_id ON marketplace_listing (vehicle_id)
  WHERE vehicle_id IS NOT NULL;

-- C2C expiry processing
CREATE INDEX idx_ml_c2c_expiry ON marketplace_listing (expires_at ASC)
  WHERE listing_type = 'c2c' AND status = 'active';

-- Full-text search (GIN)
CREATE INDEX idx_ml_fts ON marketplace_listing
  USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- JSONB features search (for specific feature filter like "AC", "Reverse Camera")
CREATE INDEX idx_ml_features_gin ON marketplace_listing USING GIN (photos jsonb_path_ops);

-- Saved vehicle price drop alert (BullMQ job scans this)
CREATE INDEX idx_ml_price_drop ON marketplace_listing (price_drop_flag, updated_at)
  WHERE price_drop_flag = true AND status = 'active';

-- IMV recalculation batch (cluster key lookup)
CREATE INDEX idx_ml_imv_cluster ON marketplace_listing
  (make, model, year, mileage_bucket, condition, district)
  WHERE status = 'active';

-- ─────────────────────────────────────────────────
-- vehicle: Dealer OS inventory management
-- ─────────────────────────────────────────────────

-- Primary dealer inventory list (with status filter)
CREATE INDEX idx_v_dealer_status ON vehicle
  (dealership_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Aging watchlist (available vehicles sorted by available_at)
CREATE INDEX idx_v_aging ON vehicle (dealership_id, available_at ASC)
  WHERE status = 'available' AND deleted_at IS NULL;

-- Days on lot filter (for aging alert tier queries)
CREATE INDEX idx_v_days_on_lot ON vehicle (dealership_id, days_on_lot DESC)
  WHERE status = 'available' AND deleted_at IS NULL;

-- Sync engine: last_synced_at (find unsynced vehicles)
CREATE INDEX idx_v_sync_pending ON vehicle (dealership_id, updated_at)
  WHERE marketplace_published = true AND deleted_at IS NULL;

-- VIN duplicate check
CREATE INDEX idx_v_vin ON vehicle (dealership_id, vin)
  WHERE vin IS NOT NULL AND deleted_at IS NULL;

-- ─────────────────────────────────────────────────
-- lead: CRM pipeline performance
-- ─────────────────────────────────────────────────

-- Pipeline view (by stage, sorted by urgency)
CREATE INDEX idx_l_pipeline ON lead
  (dealership_id, stage, next_follow_up ASC)
  WHERE stage NOT IN ('closed', 'lost') AND deleted_at IS NULL;

-- Assigned salesperson's own leads
CREATE INDEX idx_l_assigned_stage ON lead
  (assigned_to, stage, next_follow_up ASC)
  WHERE deleted_at IS NULL;

-- Hot lead SMS trigger (score-based)
CREATE INDEX idx_l_score ON lead (dealership_id, lead_score DESC)
  WHERE stage NOT IN ('closed', 'lost') AND deleted_at IS NULL;

-- Follow-up due query (BullMQ job scans this)
CREATE INDEX idx_l_follow_up_due ON lead (next_follow_up ASC)
  WHERE stage NOT IN ('closed', 'lost')
  AND next_follow_up IS NOT NULL
  AND deleted_at IS NULL;

-- 2-hour SLA breach check (new uncontacted leads)
CREATE INDEX idx_l_new_uncontacted ON lead (dealership_id, created_at ASC)
  WHERE stage = 'new' AND deleted_at IS NULL;

-- Phone deduplication check
CREATE INDEX idx_l_phone_dedupe ON lead (dealership_id, buyer_phone)
  WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────────────
-- imv_cluster: Pricing engine lookups
-- ─────────────────────────────────────────────────

-- Primary lookup (must be UNIQUE for upsert conflict resolution)
CREATE UNIQUE INDEX idx_imv_lookup ON imv_cluster
  (make, model, year, mileage_bucket, condition, district);

-- Trend page: make/model/year across all districts
CREATE INDEX idx_imv_model_trend ON imv_cluster (make, model, year, last_calculated_at DESC);

-- Override expiry cleanup
CREATE INDEX idx_imv_override_expiry ON imv_cluster (override_expires_at)
  WHERE is_override = true AND override_expires_at IS NOT NULL;

-- ─────────────────────────────────────────────────
-- deal: Financial reporting
-- ─────────────────────────────────────────────────

-- Revenue/profit reports by period
CREATE INDEX idx_d_delivered ON deal
  (dealership_id, delivered_at DESC)
  WHERE status = 'delivered' AND deleted_at IS NULL;

-- Pending approval queue
CREATE INDEX idx_d_pending_approval ON deal
  (dealership_id, approval_requested_at ASC)
  WHERE status = 'pending_approval' AND deleted_at IS NULL;

-- ─────────────────────────────────────────────────
-- subscription & invoice: Billing operations
-- ─────────────────────────────────────────────────

-- Upcoming renewals (reminder SMS job)
CREATE INDEX idx_sub_renewal ON subscription
  (expires_at ASC)
  WHERE status = 'active' AND auto_renew = true;

-- Failed payment queue
CREATE INDEX idx_inv_failed ON invoice
  (dealership_id, status, due_date)
  WHERE status = 'failed';

-- Idempotency check (before every payment attempt)
CREATE UNIQUE INDEX idx_inv_idempotency ON invoice (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX idx_pt_idempotency ON payment_transaction (idempotency_key);

-- ─────────────────────────────────────────────────
-- automation_log: Analytics and monitoring
-- ─────────────────────────────────────────────────

-- Monthly automation summary per dealer
CREATE INDEX idx_al_dealer_monthly ON automation_log
  (dealership_id, channel, created_at DESC);

-- Rate limit enforcement (per dealer per channel per day)
-- Note: actual rate limit check done via Redis; this index supports analytics queries only
CREATE INDEX idx_al_rate ON automation_log
  (dealership_id, channel, DATE(created_at))
  WHERE status = 'sent';

-- ─────────────────────────────────────────────────
-- platform_audit_log: Admin monitoring
-- ─────────────────────────────────────────────────

CREATE INDEX idx_pal_target_type ON platform_audit_log
  (target_type, target_id, created_at DESC);
CREATE INDEX idx_pal_recent ON platform_audit_log (created_at DESC);
```

### Index Maintenance

```sql
-- Schedule weekly: REINDEX CONCURRENTLY on high-churn indexes
-- (marketplace_listing indexes degrade as rows are archived)

-- Monitor index bloat:
SELECT schemaname, tablename, indexname,
       pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
       idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find unused indexes (candidates for removal):
SELECT indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname = 'public';

-- Find slow queries missing indexes:
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- ms
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

## 17. Soft Delete Implementation

### Strategy

All user-facing entities use soft delete (`deleted_at TIMESTAMPTZ`). Hard delete is reserved for:
- Platform rule: marketplace_listing on `sync_vehicle.deleted` event
- Admin action: terminated dealership's listings
- Regulatory: user account deletion request (GDPR-equivalent)

### Soft Delete Pattern

```sql
-- Standard soft delete trigger (applied to all soft-deletable tables)
CREATE OR REPLACE FUNCTION set_deleted_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applied via NestJS Prisma middleware, NOT database triggers
-- Reason: Prisma soft-delete middleware is more maintainable
--         and provides application-layer consistency

-- Prisma middleware (in NestJS PrismaService):
-- All findMany/findFirst/findUnique calls automatically append:
--   WHERE deleted_at IS NULL
-- All delete() calls converted to update({ deleted_at: new Date() })
-- Except where { where: { deleted_at: null } } is explicitly overridden
```

### Soft Delete on Each Entity

```
vehicle:
  deleted_at set → marketplace_listing hard-deleted (sync_vehicle.deleted event)
  All vehicle_expenses, recon_tasks cascade soft-delete via application
  vehicle_status_history retained (audit trail)

lead:
  deleted_at set → lead_interactions NOT deleted (history preserved)
  Follow-up BullMQ jobs cancelled on delete

customer:
  deleted_at set → leads NOT deleted (history preserved)
  Opted-in flags set to false (prevent future automation)

deal:
  Soft delete only for cancelled deals (audit trail)
  Delivered deals: NEVER deleted (financial record)

user:
  deleted_at set → cannot log in (auth check: deleted_at IS NULL)
  phone/email freed for re-registration after 90 days
  All dealer records orphaned: owner_id preserved (foreign key kept)
  Data retained per regulatory requirement

dealership:
  deleted_at set on termination (soft delete)
  But: listings hard-deleted, website 404'd, CNAME removed (immediate)
  Data retained 7 years (financial records)
```

### Recovery (Admin)

```sql
-- Recover a soft-deleted vehicle:
UPDATE vehicle
SET deleted_at = NULL, updated_at = NOW()
WHERE id = $1 AND dealership_id = $2;
-- Triggers re-sync to marketplace

-- Recover a soft-deleted lead:
UPDATE lead
SET deleted_at = NULL, updated_at = NOW()
WHERE id = $1 AND dealership_id = $2;
```

---

## 18. RLS Policy Definitions

### Setup

```sql
-- Create application DB user (no superuser, RLS applies)
CREATE ROLE app_user LOGIN PASSWORD 'strong_password_here';
GRANT CONNECT ON DATABASE autoverse TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Create migration user (BYPASSRLS for schema changes)
CREATE ROLE migration_user LOGIN PASSWORD 'migration_password_here';
GRANT CONNECT ON DATABASE autoverse TO migration_user;
ALTER ROLE migration_user BYPASSRLS;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO migration_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO migration_user;
```

### Policy Template

```sql
-- Applied to all TENANT tables:
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {table_name} FORCE ROW LEVEL SECURITY; -- applies even to table owner

CREATE POLICY rls_{table_name}_select ON {table_name}
  FOR SELECT
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE POLICY rls_{table_name}_insert ON {table_name}
  FOR INSERT
  WITH CHECK (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE POLICY rls_{table_name}_update ON {table_name}
  FOR UPDATE
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid)
  WITH CHECK (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

CREATE POLICY rls_{table_name}_delete ON {table_name}
  FOR DELETE
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);
```

### Context Injection (NestJS)

```typescript
// DealerContextGuard — runs before every dealer request handler
@Injectable()
export class DealerContextGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const dealerId = request.user?.dealer_id; // from JWT payload

    if (!dealerId) throw new UnauthorizedException('No dealer context');

    // Inject dealership_id into PostgreSQL session
    await this.prisma.$executeRaw`
      SELECT set_config('app.current_dealer_id', ${dealerId}, true)
    `;
    // "true" = LOCAL (transaction-scoped, reset after transaction)

    request.dealerId = dealerId;
    return true;
  }
}

// Applied at controller level:
@UseGuards(JwtAuthGuard, DealerContextGuard)
@Controller('vehicles')
export class VehicleController {}
```

### Admin Bypass

```typescript
// Admin requests use migration_user connection (BYPASSRLS)
// OR: admin reads are always filtered by explicit dealership_id parameter
// (no context injection needed — admin queries explicitly scope by dealer)

// Example admin query (no RLS needed — explicit filter):
const vehicles = await this.prisma.vehicle.findMany({
  where: { dealership_id: targetDealerId }
  // No RLS — admin user bypasses it; explicit filter is still applied
});
```

### RLS Penetration Test Scenarios

```
SCENARIO 1: Salesperson from Dealer A attempts to view Dealer B's vehicles
  JWT: { dealer_id: "dealer-a-uuid", role: "salesperson" }
  DealerContextGuard: set_config('app.current_dealer_id', 'dealer-a-uuid')
  Query: SELECT * FROM vehicle WHERE id = 'dealer-b-vehicle-uuid'
  RLS Policy: dealership_id ('dealer-b-uuid') != current_setting = 'dealer-a-uuid'
  Result: 0 rows returned (not 403 — RLS silently filters)
  Application: 404 returned (vehicle not found)
  PASS ✓

SCENARIO 2: No JWT (unauthenticated request to tenant endpoint)
  DealerContextGuard: no dealer_id → throws UnauthorizedException
  Request never reaches DB
  PASS ✓

SCENARIO 3: Valid JWT but app.current_dealer_id not set (guard bug)
  current_setting('app.current_dealer_id', true) returns NULL
  NULL::uuid cast → NULL
  RLS: dealership_id = NULL evaluates to UNKNOWN → 0 rows
  Result: 0 rows (fails safe)
  PASS ✓

SCENARIO 4: Dealer attempts to change dealership_id in INSERT
  INSERT INTO vehicle (dealership_id, ...) VALUES ('other-dealer-uuid', ...)
  RLS WITH CHECK: 'other-dealer-uuid' != current_setting → blocked
  Result: RLS violation error
  PASS ✓

SCENARIO 5: Sync engine reads vehicles from multiple tenants
  SyncService runs as separate DB role with BYPASSRLS
  Explicit dealership_id in all queries
  Never uses app.current_dealer_id context
  PASS ✓ (controlled bypass, audited)
```

---

## 19. Constraint & Trigger Definitions

### Auto-Update `updated_at`

```sql
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at:
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON vehicle
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- (Repeat for: lead, deal, customer, dealership, marketplace_listing,
--  automation_rule, dealer_settings, dealer_website, subscription, etc.)
```

### Auto-Compute `mileage_bucket`

```sql
CREATE OR REPLACE FUNCTION compute_mileage_bucket(mileage INTEGER)
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN CASE
    WHEN mileage < 30000  THEN '0-30K'
    WHEN mileage < 60000  THEN '30-60K'
    WHEN mileage < 100000 THEN '60-100K'
    ELSE '100K+'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION trigger_set_mileage_bucket()
RETURNS TRIGGER AS $$
BEGIN
  NEW.mileage_bucket = compute_mileage_bucket(NEW.mileage_km);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_mileage_bucket
  BEFORE INSERT OR UPDATE OF mileage_km ON vehicle
  FOR EACH ROW EXECUTE FUNCTION trigger_set_mileage_bucket();

-- Same trigger on marketplace_listing
CREATE TRIGGER set_mileage_bucket_listing
  BEFORE INSERT OR UPDATE OF mileage_km ON marketplace_listing
  FOR EACH ROW EXECUTE FUNCTION trigger_set_mileage_bucket();
```

### Auto-Update `recon_total` on vehicle

```sql
CREATE OR REPLACE FUNCTION trigger_update_recon_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vehicle
  SET recon_total = (
    SELECT COALESCE(SUM(amount), 0)
    FROM vehicle_expense
    WHERE vehicle_id = COALESCE(NEW.vehicle_id, OLD.vehicle_id)
      AND dealership_id = COALESCE(NEW.dealership_id, OLD.dealership_id)
  ),
  net_profit_estimate = asking_price - COALESCE(acquisition_cost, 0) - (
    SELECT COALESCE(SUM(amount), 0)
    FROM vehicle_expense
    WHERE vehicle_id = COALESCE(NEW.vehicle_id, OLD.vehicle_id)
  )
  WHERE id = COALESCE(NEW.vehicle_id, OLD.vehicle_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recon_total
  AFTER INSERT OR UPDATE OR DELETE ON vehicle_expense
  FOR EACH ROW EXECUTE FUNCTION trigger_update_recon_total();
```

### Auto-Generate `stock_no`

```sql
CREATE OR REPLACE FUNCTION generate_stock_no(dealer_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  yr   TEXT := TO_CHAR(NOW(), 'YYYYMM');
  seq  INTEGER;
  result TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq
  FROM vehicle
  WHERE dealership_id = dealer_id
    AND TO_CHAR(created_at, 'YYYYMM') = yr;

  result := 'SK-' || yr || '-' || LPAD(seq::TEXT, 4, '0');
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Called by application on vehicle creation, not a DB trigger
-- (Avoids race conditions — application uses SELECT FOR UPDATE on sequence)
-- Better: use pg sequence per dealership, managed by application layer
```

### Auto-Compute `deal_score` on `marketplace_listing`

```sql
CREATE OR REPLACE FUNCTION trigger_compute_deal_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.imv_p50 IS NOT NULL AND NEW.imv_p50 > 0 THEN
    NEW.deal_score := (NEW.asking_price - NEW.imv_p50) / NEW.imv_p50;
    NEW.deal_rating := CASE
      WHEN NEW.deal_score < -0.15 THEN 'great_deal'::deal_rating
      WHEN NEW.deal_score < -0.05 THEN 'good_deal'::deal_rating
      WHEN NEW.deal_score < 0.10  THEN 'fair_price'::deal_rating
      ELSE 'overpriced'::deal_rating
    END;
    IF COALESCE(NEW.imv_sample_size, 0) < 10 THEN
      NEW.deal_rating := 'unrated'::deal_rating;
    END IF;
  ELSE
    NEW.deal_score := NULL;
    NEW.deal_rating := 'unrated';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compute_deal_score
  BEFORE INSERT OR UPDATE OF asking_price, imv_p50, imv_sample_size
  ON marketplace_listing
  FOR EACH ROW EXECUTE FUNCTION trigger_compute_deal_score();
```

### Guard: Prevent `sold` Status Reversal

```sql
CREATE OR REPLACE FUNCTION trigger_guard_sold_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'sold' AND NEW.status != 'sold' THEN
    RAISE EXCEPTION 'Cannot change status of a sold vehicle. Vehicle ID: %', OLD.id;
  END IF;
  IF OLD.status = 'scrapped' AND NEW.status != 'scrapped' THEN
    RAISE EXCEPTION 'Cannot change status of a scrapped vehicle. Vehicle ID: %', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guard_vehicle_sold_status
  BEFORE UPDATE OF status ON vehicle
  FOR EACH ROW EXECUTE FUNCTION trigger_guard_sold_status();
```

### Guard: bKash Idempotency

```sql
-- Enforced via UNIQUE constraint:
-- CONSTRAINT uq_payment_idempotency UNIQUE (idempotency_key) on payment_transaction
-- Application generates idempotency_key = SHA256(dealer_id + invoice_id + attempt_timestamp_rounded_to_5min)
-- Rounding to 5 minutes: retries within 5 min reuse same key → INSERT fails → application detects and queries existing transaction
```

---

## 20. API Contract Naming Conventions & Versioning

### URL Structure

```
BASE URL:        https://api.autoverse.com.bd
VERSION PREFIX:  /api/v1/
ADMIN PREFIX:    /api/v1/admin/   (separate auth, IP-restricted)
PUBLIC PREFIX:   /api/v1/public/  (no auth required)

FULL EXAMPLES:
  GET  https://api.autoverse.com.bd/api/v1/vehicles
  GET  https://api.autoverse.com.bd/api/v1/vehicles/{id}
  POST https://api.autoverse.com.bd/api/v1/vehicles
  GET  https://api.autoverse.com.bd/api/v1/public/marketplace/search
  POST https://api.autoverse.com.bd/api/v1/admin/dealers/{id}/approve
```

### Resource Naming Rules

```
RESOURCE NAMES:
  Plural nouns for collections:     /vehicles, /leads, /deals, /customers
  Singular for singleton resources: /auth/me, /subscription (one per dealer)
  Kebab-case for multi-word:        /marketplace-listings, /saved-searches
  No verbs in URLs (use HTTP method for action)

ACTIONS (when HTTP method is not enough):
  /vehicles/{id}/photos          → POST (upload photos)
  /vehicles/{id}/force-sync      → POST (trigger sync)
  /vehicles/{id}/status          → PUT (change status)
  /leads/{id}/stage              → PUT (change stage)
  /leads/{id}/activity           → POST (log interaction)
  /deals/{id}/approve            → POST (approval action)
  /deals/{id}/deliver            → POST (delivery action)
  /deals/{id}/cancel             → POST (cancel action)
  /auth/otp/send                 → POST
  /auth/otp/verify               → POST
  /auth/refresh                  → POST

SUB-RESOURCES:
  /vehicles/{id}/expenses        → vehicle expenses
  /deals/{id}/payments           → deal payments
  /deals/{id}/documents          → deal documents
  /customers/{id}/leads          → customer's lead history
  /customers/{id}/deals          → customer's purchase history
```

### Request/Response Contract

```typescript
// Standard success response wrapper:
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;       // for paginated lists
    page?: number;
    limit?: number;
    has_more?: boolean;
  };
}

// Standard error response:
interface ApiError {
  success: false;
  error: {
    code: string;         // machine-readable: 'VEHICLE_NOT_FOUND', 'VALIDATION_ERROR'
    message: string;      // human-readable
    field?: string;       // for validation errors: which field failed
    details?: object;     // additional context
  };
  request_id: string;     // UUID for log tracing
}

// Pagination parameters (query string):
interface PaginationParams {
  page?: number;          // default: 1
  limit?: number;         // default: 20, max: 100
  sort?: string;          // field name: 'created_at', 'asking_price'
  order?: 'asc' | 'desc'; // default: 'desc'
}
```

### Field Naming in JSON Responses

```
RULE: snake_case for all JSON field names (matches PostgreSQL column names)
  Good: { "asking_price": 1500000, "created_at": "...", "deal_rating": "good_deal" }
  Bad:  { "askingPrice": 1500000, "createdAt": "...", "dealRating": "good_deal" }

TIMESTAMPS: ISO 8601 UTC strings
  "2025-01-15T10:30:00.000Z" (not Unix timestamps)

MONETARY VALUES: integers in BDT (not floats, not strings)
  { "asking_price": 1500000 }  // BDT 15,00,000
  Note: DECIMAL(12,2) in DB → serialize as integer when no decimals,
        or string "1500000.00" if preserving exact decimal

ENUMS: lowercase_with_underscores strings
  { "status": "available", "deal_rating": "great_deal" }

BOOLEANS: lowercase true/false
  { "is_featured": true, "marketplace_published": false }

NULLS: explicitly null (not omitted)
  { "acquisition_cost": null }  // not omitted — omission causes frontend null-check bugs

IDs: UUID strings
  { "id": "550e8400-e29b-41d4-a716-446655440000" }

ARRAYS: empty array [], not null
  { "photos": [] }  // not null when empty
```

### DTO Validation Schema (NestJS class-validator)

```typescript
// Example: CreateVehicleDto
export class CreateVehicleDto {
  @IsOptional()
  @IsString()
  @Length(17, 17)
  vin?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  make: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  model: string;

  @IsInt()
  @Min(1970)
  @Max(new Date().getFullYear() + 2)
  year: number;

  @IsInt()
  @Min(0)
  @Max(2000000)
  mileage_km: number;

  @IsEnum(FuelType)
  fuel_type: FuelType;

  @IsEnum(TransmissionType)
  transmission: TransmissionType;

  @IsEnum(VehicleCondition)
  condition: VehicleCondition;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  asking_price: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  acquisition_cost?: number;
}

// Zod schema (shared with frontend for runtime validation):
export const createVehicleSchema = z.object({
  vin: z.string().length(17).optional(),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1970).max(new Date().getFullYear() + 2),
  mileage_km: z.number().int().min(0).max(2000000),
  fuel_type: z.enum(['petrol', 'diesel', 'hybrid', 'electric', 'cng', 'lpg']),
  transmission: z.enum(['automatic', 'manual', 'cvt', 'dct', 'amt']),
  condition: z.enum(['new', 'used', 'reconditioned']),
  asking_price: z.number().positive().multipleOf(0.01),
  acquisition_cost: z.number().nonnegative().optional(),
});
```

### Versioning Strategy

```
CURRENT VERSION: v1
VERSIONING METHOD: URL path prefix (/api/v1/)
  Reason: Most explicit; easy to route in Cloudflare/nginx; no header negotiation

v1 DEPRECATION POLICY:
  v2 launched → v1 deprecated with 12-month sunset notice
  v1 continues working for 12 months with deprecation header:
    Deprecation: Sat, 01 Jan 2027 00:00:00 GMT
    Sunset: Sat, 01 Jan 2028 00:00:00 GMT
  Active dealer notification: SMS + in-app 90 days before sunset

BREAKING CHANGE DEFINITION (requires version bump):
  Removing a field from a response
  Changing a field's type (string → number)
  Changing a field's name
  Removing an endpoint
  Changing required/optional status of request parameter

NON-BREAKING (no version bump needed):
  Adding new optional fields to responses
  Adding new optional request parameters
  Adding new endpoints
  Performance improvements

CHANGELOG MAINTAINED AT:
  api.autoverse.com.bd/api/changelog (machine-readable)
  docs.autoverse.com.bd/api/changelog (human-readable)

INTERNAL VERSIONING:
  NestJS module: VehicleControllerV1 (explicit)
  If v2 needed: VehicleControllerV2 added; V1 preserved but frozen
```

### Error Code Reference

```
AUTHENTICATION:
  AUTH_TOKEN_MISSING          → 401: No Authorization header
  AUTH_TOKEN_INVALID          → 401: JWT verification failed
  AUTH_TOKEN_EXPIRED          → 401: JWT expired (refresh needed)
  AUTH_INSUFFICIENT_ROLE      → 403: Role does not permit this action
  AUTH_DEALER_SUSPENDED       → 403: Dealer account suspended
  AUTH_DEALER_READ_ONLY       → 403: Dealer in read-only mode (grace period)

VALIDATION:
  VALIDATION_ERROR            → 422: Request body fails schema validation
  VALIDATION_REQUIRED_FIELD   → 422: Required field missing
  VALIDATION_INVALID_ENUM     → 422: Invalid enum value
  VALIDATION_DUPLICATE        → 409: Unique constraint violation

BUSINESS LOGIC:
  VEHICLE_NOT_FOUND           → 404
  VEHICLE_STATUS_TRANSITION_INVALID → 422: Cannot transition from X to Y
  VEHICLE_SOLD_IMMUTABLE      → 422: Cannot modify a sold vehicle
  VEHICLE_LISTING_LIMIT       → 402: Dealer has hit plan's listing limit
  LEAD_LOST_REASON_REQUIRED   → 422: Must provide lost_reason when marking lost
  DEAL_APPROVAL_REQUIRED      → 422: Deal requires manager approval before proceeding
  VIN_DUPLICATE               → 409: VIN already exists in this dealer's inventory
  PHOTO_MINIMUM_REQUIRED      → 422: Minimum 4 photos required to publish

SYNC:
  SYNC_IN_PROGRESS            → 409: Sync already running for this vehicle
  SYNC_FAILED                 → 500: Sync encountered an error (retry available)

PAYMENTS:
  PAYMENT_IDEMPOTENCY_CONFLICT → 409: Payment with this key already processed
  PAYMENT_GATEWAY_TIMEOUT     → 503: Payment gateway timed out; safe to retry
  PAYMENT_INSUFFICIENT_FUNDS  → 402: bKash/Nagad balance insufficient
  SUBSCRIPTION_ALREADY_ACTIVE → 409: Cannot activate subscription that is already active

RATE LIMITS:
  RATE_LIMIT_AUTOMATION       → 429: Automation channel daily limit reached
  RATE_LIMIT_API              → 429: API rate limit exceeded
```

---

*AutoVerse — Step 3: Database Architecture (Production Level)*
*Complete PostgreSQL Schema · RLS · Indexing · Audit Trail*
*Built against Blueprint v7.0*
