-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUM TYPES
CREATE TYPE user_role AS ENUM (
  'admin_user', 'dealer_owner', 'manager', 'salesperson',
  'technician', 'buyer', 'c2c_seller'
);

CREATE TYPE user_status AS ENUM (
  'active', 'suspended', 'pending_verification', 'deleted'
);

CREATE TYPE dealer_status AS ENUM (
  'pending_approval', 'active', 'suspended', 'terminated'
);

CREATE TYPE subscription_tier AS ENUM (
  'free', 'starter', 'professional', 'business', 'enterprise'
);

CREATE TYPE vehicle_condition AS ENUM (
  'new', 'used', 'reconditioned'
);

CREATE TYPE vehicle_status AS ENUM (
  'acquired', 'in_recon', 'available', 'reserved', 'sold', 'scrapped'
);

CREATE TYPE fuel_type AS ENUM (
  'petrol', 'diesel', 'hybrid', 'electric', 'cng', 'lpg'
);

CREATE TYPE transmission_type AS ENUM (
  'automatic', 'manual', 'cvt', 'dct', 'amt'
);

CREATE TYPE recon_item_status AS ENUM (
  'ok', 'needs_work', 'critical'
);

CREATE TYPE recon_task_status AS ENUM (
  'pending', 'in_progress', 'complete', 'cancelled'
);

CREATE TYPE lead_stage AS ENUM (
  'new', 'contacted', 'qualified', 'test_drive',
  'quote_sent', 'negotiation', 'closed', 'lost'
);

CREATE TYPE lead_priority AS ENUM (
  'hot', 'warm', 'cold'
);

CREATE TYPE lead_source AS ENUM (
  'walk_in', 'marketplace', 'dealer_website', 'facebook_lead_ad',
  'whatsapp', 'phone', 'referral', 'sms_campaign', 'email_campaign',
  'social_media', 'other'
);

CREATE TYPE deal_type AS ENUM (
  'cash', 'finance', 'lease', 'exchange', 'exchange_plus_cash'
);

CREATE TYPE deal_status AS ENUM (
  'draft', 'pending_approval', 'approved', 'delivered', 'cancelled'
);

CREATE TYPE payment_method AS ENUM (
  'bkash', 'nagad', 'rocket', 'bank_transfer', 'cash',
  'sslcommerz', 'card', 'cheque'
);

CREATE TYPE listing_type AS ENUM (
  'dealer', 'c2c'
);

CREATE TYPE listing_status AS ENUM (
  'active', 'reserved', 'sold', 'hidden', 'archived',
  'expired', 'under_review', 'rejected'
);

CREATE TYPE deal_rating AS ENUM (
  'great_deal', 'good_deal', 'fair_price', 'overpriced', 'unrated'
);

CREATE TYPE automation_channel AS ENUM (
  'whatsapp', 'facebook', 'instagram', 'email', 'sms', 'push'
);

CREATE TYPE recur_cycle AS ENUM (
  'weekly', 'monthly', 'quarterly', 'annual'
);

CREATE TYPE language_pref AS ENUM (
  'en', 'bn'
);

CREATE TYPE seller_type AS ENUM (
  'dealer', 'private'
);

-- 2. CORE IDENTITY & AUTH TABLES
CREATE TABLE "user" (
  id                   UUID        NOT NULL DEFAULT uuid_generate_v4(),
  phone                VARCHAR(20) NOT NULL,
  email                VARCHAR(255),
  password_hash        VARCHAR(255),
  full_name            VARCHAR(255) NOT NULL,
  role                 user_role   NOT NULL,
  status               user_status NOT NULL DEFAULT 'pending_verification',
  preferred_language   language_pref NOT NULL DEFAULT 'bn',
  avatar_url           TEXT,
  fcm_token            TEXT,
  fcm_token_updated_at TIMESTAMPTZ,
  last_login_at        TIMESTAMPTZ,
  last_login_ip        INET,
  login_count          INTEGER     NOT NULL DEFAULT 0,
  failed_login_count   INTEGER     NOT NULL DEFAULT 0,
  locked_until         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ,

  CONSTRAINT pk_user PRIMARY KEY (id),
  CONSTRAINT uq_user_phone UNIQUE (phone),
  CONSTRAINT uq_user_email UNIQUE (email),
  CONSTRAINT chk_user_phone_format CHECK (phone ~ '^\+?[0-9]{10,20}$'),
  CONSTRAINT chk_user_email_format CHECK (
    email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

CREATE TABLE otp (
  id           UUID        NOT NULL DEFAULT uuid_generate_v4(),
  phone        VARCHAR(20) NOT NULL,
  code         VARCHAR(6)  NOT NULL,
  purpose      VARCHAR(50) NOT NULL,
  is_used      BOOLEAN     NOT NULL DEFAULT false,
  attempts     SMALLINT    NOT NULL DEFAULT 0,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at      TIMESTAMPTZ,
  ip_address   INET,

  CONSTRAINT pk_otp PRIMARY KEY (id),
  CONSTRAINT chk_otp_code CHECK (code ~ '^[0-9]{6}$'),
  CONSTRAINT chk_otp_attempts CHECK (attempts <= 5)
);

CREATE TABLE refresh_token (
  id           UUID        NOT NULL DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token_hash   VARCHAR(255) NOT NULL,
  device_info  TEXT,
  ip_address   INET,
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_refresh_token PRIMARY KEY (id)
);

-- 3. DEALERSHIP CONFIGURATION TABLES
CREATE TABLE dealership (
  id                     UUID              NOT NULL DEFAULT uuid_generate_v4(),
  owner_id               UUID              NOT NULL REFERENCES "user"(id),
  business_name          VARCHAR(255)      NOT NULL,
  slug                   VARCHAR(255)      NOT NULL,
  trade_license_no       VARCHAR(100),
  nid_no                 VARCHAR(30),
  status                 dealer_status     NOT NULL DEFAULT 'pending_approval',
  subscription_tier      subscription_tier NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  listing_limit          SMALLINT          NOT NULL DEFAULT 10,
  staff_seat_limit       SMALLINT          NOT NULL DEFAULT 1,
  location_limit         SMALLINT          NOT NULL DEFAULT 1,
  district               VARCHAR(100)      NOT NULL,
  division               VARCHAR(100)      NOT NULL,
  address                TEXT,
  lat                    DECIMAL(9,6),
  lng                    DECIMAL(9,6),
  logo_url               TEXT,
  cover_photo_url        TEXT,
  primary_color          VARCHAR(7),
  secondary_color        VARCHAR(7),
  phone                  VARCHAR(20)       NOT NULL,
  whatsapp_number        VARCHAR(20),
  email                  VARCHAR(255),
  website_url            TEXT,
  business_hours         JSONB,
  rating                 DECIMAL(3,2),
  review_count           INTEGER           NOT NULL DEFAULT 0,
  total_listings         INTEGER           NOT NULL DEFAULT 0,
  total_deals            INTEGER           NOT NULL DEFAULT 0,
  approved_by            UUID              REFERENCES "user"(id),
  approved_at            TIMESTAMPTZ,
  suspended_by           UUID              REFERENCES "user"(id),
  suspended_at           TIMESTAMPTZ,
  suspension_reason      TEXT,
  terminated_at          TIMESTAMPTZ,
  termination_reason     TEXT,
  discount_threshold_pct DECIMAL(5,2)      NOT NULL DEFAULT 10.00,
  target_margin_pct      DECIMAL(5,2)      NOT NULL DEFAULT 20.00,
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

CREATE TABLE dealership_location (
  id             UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID        NOT NULL REFERENCES dealership(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
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

CREATE TABLE dealer_staff (
  id             UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID        NOT NULL REFERENCES dealership(id) ON DELETE CASCADE,
  user_id        UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role           user_role   NOT NULL,
  location_id    UUID        REFERENCES dealership_location(id),
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  invited_by     UUID        REFERENCES "user"(id),
  invited_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at    TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID        REFERENCES "user"(id),
  sees_all_leads BOOLEAN     NOT NULL DEFAULT false,
  commission_rate DECIMAL(5,2),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_dealer_staff PRIMARY KEY (id),
  CONSTRAINT uq_dealer_staff UNIQUE (dealership_id, user_id)
);

CREATE TABLE plan_config (
  id                    UUID              NOT NULL DEFAULT uuid_generate_v4(),
  tier                  subscription_tier NOT NULL,
  display_name          VARCHAR(50)       NOT NULL,
  monthly_price_bdt     DECIMAL(10,2)     NOT NULL,
  listing_limit         INTEGER           NOT NULL,
  staff_seat_limit      INTEGER           NOT NULL,
  location_limit        INTEGER           NOT NULL,
  sms_quota_monthly     INTEGER           NOT NULL,
  features              JSONB             NOT NULL,
  is_active             BOOLEAN           NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_plan_config PRIMARY KEY (id),
  CONSTRAINT uq_plan_config_tier UNIQUE (tier)
);

CREATE TABLE dealer_settings (
  id                        UUID    NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id             UUID    NOT NULL REFERENCES dealership(id) ON DELETE CASCADE,
  notify_new_lead_sms       BOOLEAN NOT NULL DEFAULT true,
  notify_new_lead_push      BOOLEAN NOT NULL DEFAULT true,
  notify_aging_sms          BOOLEAN NOT NULL DEFAULT true,
  notify_hot_lead_sms       BOOLEAN NOT NULL DEFAULT true,
  notify_daily_summary_sms  BOOLEAN NOT NULL DEFAULT true,
  notify_daily_summary_push BOOLEAN NOT NULL DEFAULT true,
  daily_summary_time        TIME    NOT NULL DEFAULT '08:00:00',
  lead_assignment_mode      VARCHAR(20) NOT NULL DEFAULT 'round_robin',
  default_assigned_to       UUID    REFERENCES "user"(id),
  whatsapp_away_enabled     BOOLEAN NOT NULL DEFAULT false,
  whatsapp_greeting_enabled BOOLEAN NOT NULL DEFAULT false,
  facebook_away_enabled     BOOLEAN NOT NULL DEFAULT false,
  post_approval_required    BOOLEAN NOT NULL DEFAULT true,
  optimal_post_time         TIME    NOT NULL DEFAULT '09:00:00',
  default_loan_rate_pct     DECIMAL(5,2) NOT NULL DEFAULT 9.00,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_dealer_settings PRIMARY KEY (id),
  CONSTRAINT uq_dealer_settings UNIQUE (dealership_id)
);

-- 4. INVENTORY TABLES
CREATE TABLE vehicle (
  id                    UUID               NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id         UUID               NOT NULL REFERENCES dealership(id),
  location_id           UUID               REFERENCES dealership_location(id),
  stock_no              VARCHAR(20)        NOT NULL,
  vin                   VARCHAR(17),
  registration_no       VARCHAR(30),
  make                  VARCHAR(100)       NOT NULL,
  model                 VARCHAR(100)       NOT NULL,
  year                  SMALLINT           NOT NULL,
  variant               VARCHAR(200),
  body_type             VARCHAR(50),
  engine_cc             INTEGER,
  engine_type           VARCHAR(50),
  fuel_type             fuel_type          NOT NULL DEFAULT 'petrol',
  transmission          transmission_type  NOT NULL DEFAULT 'automatic',
  drive_type            VARCHAR(10),
  seating_capacity      SMALLINT,
  color                 VARCHAR(50),
  doors                 SMALLINT,
  condition             vehicle_condition  NOT NULL DEFAULT 'used',
  mileage_km            INTEGER            NOT NULL,
  mileage_bucket        VARCHAR(20)        NOT NULL,
  asking_price          DECIMAL(12,2)      NOT NULL,
  acquisition_cost      DECIMAL(12,2),
  recon_total           DECIMAL(12,2)      NOT NULL DEFAULT 0,
  net_profit_estimate   DECIMAL(12,2),
  floor_plan_cost       DECIMAL(12,2),
  acquisition_source    VARCHAR(50),
  acquisition_date      DATE,
  acquired_from         VARCHAR(255),
  status                vehicle_status     NOT NULL DEFAULT 'acquired',
  available_at          TIMESTAMPTZ,
  sold_at               TIMESTAMPTZ,
  photos                JSONB              NOT NULL DEFAULT '[]'::jsonb,
  video_url             TEXT,
  photo_count           SMALLINT           NOT NULL DEFAULT 0,
  marketplace_published BOOLEAN            NOT NULL DEFAULT true,
  last_synced_at        TIMESTAMPTZ,
  sync_error            TEXT,
  specs                 JSONB              NOT NULL DEFAULT '{}'::jsonb,
  internal_notes        TEXT,
  description           TEXT,
  features              JSONB              NOT NULL DEFAULT '[]'::jsonb,
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

CREATE TABLE vehicle_status_history (
  id            UUID           NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id UUID           NOT NULL REFERENCES dealership(id),
  vehicle_id    UUID           NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
  from_status   vehicle_status,
  to_status     vehicle_status NOT NULL,
  changed_by    UUID           NOT NULL REFERENCES "user"(id),
  reason        TEXT,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_vehicle_status_history PRIMARY KEY (id)
);

CREATE TABLE recon_assessment (
  id                UUID                NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id     UUID                NOT NULL REFERENCES dealership(id),
  vehicle_id        UUID                NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
  engine_status     recon_item_status   NOT NULL DEFAULT 'ok',
  body_status       recon_item_status   NOT NULL DEFAULT 'ok',
  paint_status      recon_item_status   NOT NULL DEFAULT 'ok',
  interior_status   recon_item_status   NOT NULL DEFAULT 'ok',
  electricals_status recon_item_status  NOT NULL DEFAULT 'ok',
  tyres_status      recon_item_status   NOT NULL DEFAULT 'ok',
  ac_status         recon_item_status   NOT NULL DEFAULT 'ok',
  brakes_status     recon_item_status   NOT NULL DEFAULT 'ok',
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
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_recon_assessment PRIMARY KEY (id),
  CONSTRAINT uq_recon_assessment UNIQUE (vehicle_id)
);

CREATE TABLE recon_task (
  id               UUID               NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id    UUID               NOT NULL REFERENCES dealership(id),
  vehicle_id       UUID               NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
  assessment_id    UUID               NOT NULL REFERENCES recon_assessment(id),
  category         VARCHAR(50)        NOT NULL,
  description      TEXT               NOT NULL,
  assigned_to_user UUID               REFERENCES "user"(id),
  assigned_to_name VARCHAR(255),
  estimated_cost   DECIMAL(12,2),
  actual_cost      DECIMAL(12,2),
  status           recon_task_status  NOT NULL DEFAULT 'pending',
  priority         SMALLINT           NOT NULL DEFAULT 2,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  notes            TEXT,
  receipt_url      TEXT,
  created_by       UUID               NOT NULL REFERENCES "user"(id),
  created_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_recon_task PRIMARY KEY (id)
);

-- 5. CRM & SALES TABLES
CREATE TABLE customer (
  id                    UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id         UUID        NOT NULL REFERENCES dealership(id),
  user_id               UUID        REFERENCES "user"(id),
  full_name             VARCHAR(255) NOT NULL,
  phone                 VARCHAR(20) NOT NULL,
  email                 VARCHAR(255),
  nid_no                VARCHAR(30),
  district              VARCHAR(100),
  division              VARCHAR(100),
  address               TEXT,
  preferred_makes       JSONB,
  preferred_body_types  JSONB,
  budget_min            DECIMAL(12,2),
  budget_max            DECIMAL(12,2),
  opted_in_sms          BOOLEAN     NOT NULL DEFAULT true,
  opted_in_whatsapp     BOOLEAN     NOT NULL DEFAULT true,
  opted_in_email        BOOLEAN     NOT NULL DEFAULT true,
  opted_in_inventory_alerts BOOLEAN NOT NULL DEFAULT false,
  total_purchases       SMALLINT    NOT NULL DEFAULT 0,
  total_spend           DECIMAL(14,2) NOT NULL DEFAULT 0,
  last_interaction_at   TIMESTAMPTZ,
  notes                 TEXT,
  tags                  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,

  CONSTRAINT pk_customer PRIMARY KEY (id),
  CONSTRAINT uq_customer_phone UNIQUE (dealership_id, phone)
);

CREATE TABLE lead (
  id                  UUID          NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id       UUID          NOT NULL REFERENCES dealership(id),
  customer_id         UUID          REFERENCES customer(id),
  assigned_to         UUID          REFERENCES "user"(id),
  vehicle_id          UUID          REFERENCES vehicle(id),
  location_id         UUID          REFERENCES dealership_location(id),
  buyer_name          VARCHAR(255)  NOT NULL,
  buyer_phone         VARCHAR(20)   NOT NULL,
  buyer_email         VARCHAR(255),
  buyer_district      VARCHAR(100),
  source              lead_source   NOT NULL DEFAULT 'walk_in',
  stage               lead_stage    NOT NULL DEFAULT 'new',
  priority            lead_priority NOT NULL DEFAULT 'warm',
  lead_score          SMALLINT      NOT NULL DEFAULT 0,
  lost_reason         VARCHAR(100),
  lost_reason_detail  TEXT,
  budget_min          DECIMAL(12,2),
  budget_max          DECIMAL(12,2),
  next_follow_up      TIMESTAMPTZ,
  follow_up_method    VARCHAR(50),
  contact_sla_breached BOOLEAN      NOT NULL DEFAULT false,
  test_drive_scheduled_at TIMESTAMPTZ,
  test_drive_completed_at TIMESTAMPTZ,
  quote_amount        DECIMAL(12,2),
  quote_sent_at       TIMESTAMPTZ,
  enquiry_count       SMALLINT      NOT NULL DEFAULT 1,
  personalized_token  VARCHAR(100),
  personalized_link_views SMALLINT  NOT NULL DEFAULT 0,
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

CREATE TABLE lead_interaction (
  id             UUID        NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID        NOT NULL REFERENCES dealership(id),
  lead_id        UUID        NOT NULL REFERENCES lead(id) ON DELETE CASCADE,
  user_id        UUID        REFERENCES "user"(id),
  type           VARCHAR(50) NOT NULL,
  direction      VARCHAR(10),
  channel        automation_channel,
  summary        TEXT,
  body           TEXT,
  duration_sec   INTEGER,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_lead_interaction PRIMARY KEY (id)
);

CREATE TABLE deal (
  id                    UUID          NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id         UUID          NOT NULL REFERENCES dealership(id),
  lead_id               UUID          NOT NULL REFERENCES lead(id),
  vehicle_id            UUID          NOT NULL REFERENCES vehicle(id),
  customer_id           UUID          NOT NULL REFERENCES customer(id),
  salesperson_id        UUID          NOT NULL REFERENCES "user"(id),
  manager_approval_id   UUID          REFERENCES "user"(id),
  location_id           UUID          REFERENCES dealership_location(id),
  deal_type             deal_type     NOT NULL DEFAULT 'cash',
  sale_price            DECIMAL(12,2) NOT NULL,
  list_price            DECIMAL(12,2) NOT NULL,
  discount_amount       DECIMAL(12,2) NOT NULL DEFAULT 0,
  trade_in_vehicle_id   UUID          REFERENCES vehicle(id),
  trade_in_value        DECIMAL(12,2) NOT NULL DEFAULT 0,
  gross_profit          DECIMAL(12,2),
  lender_name           VARCHAR(255),
  loan_amount           DECIMAL(12,2),
  down_payment          DECIMAL(12,2),
  interest_rate_pct     DECIMAL(5,2),
  loan_term_months      SMALLINT,
  monthly_instalment    DECIMAL(12,2),
  finance_app_status    VARCHAR(50),
  deposit_paid          DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance_due           DECIMAL(12,2),
  total_paid            DECIMAL(12,2) NOT NULL DEFAULT 0,
  status                deal_status   NOT NULL DEFAULT 'draft',
  approval_requested_at TIMESTAMPTZ,
  approved_at           TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,
  bill_of_sale_url      TEXT,
  bill_of_sale_version  SMALLINT      NOT NULL DEFAULT 0,
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

CREATE TABLE deal_payment (
  id             UUID            NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID            NOT NULL REFERENCES dealership(id),
  deal_id        UUID            NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
  amount         DECIMAL(12,2)   NOT NULL,
  payment_method payment_method  NOT NULL,
  payment_type   VARCHAR(20)     NOT NULL DEFAULT 'deposit',
  reference_no   VARCHAR(255),
  recorded_by    UUID            NOT NULL REFERENCES "user"(id),
  notes          TEXT,
  receipt_url    TEXT,
  paid_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_deal_payment PRIMARY KEY (id),
  CONSTRAINT chk_deal_payment_amount CHECK (amount > 0)
);

-- 6. FINANCE & EXPENSES TABLES
CREATE TABLE expense_category (
  id           UUID        NOT NULL DEFAULT uuid_generate_v4(),
  type         VARCHAR(20) NOT NULL DEFAULT 'vehicle',
  name         VARCHAR(100) NOT NULL,
  slug         VARCHAR(100) NOT NULL,
  icon         VARCHAR(50),
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  sort_order   SMALLINT    NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pk_expense_category PRIMARY KEY (id),
  CONSTRAINT uq_expense_category_slug UNIQUE (type, slug)
);

CREATE TABLE vehicle_expense (
  id             UUID          NOT NULL DEFAULT uuid_generate_v4(),
  dealership_id  UUID          NOT NULL REFERENCES dealership(id),
  vehicle_id     UUID          NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
  recon_task_id  UUID          REFERENCES recon_task(id),
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

-- 7. PUBLIC & MARKETPLACE TABLES
CREATE TABLE marketplace_listing (
  id                  UUID             NOT NULL DEFAULT uuid_generate_v4(),
  vehicle_id          UUID             REFERENCES vehicle(id),
  dealership_id       UUID             REFERENCES dealership(id),
  c2c_seller_id       UUID             REFERENCES "user"(id),
  listing_type        listing_type     NOT NULL,
  seller_type         seller_type      NOT NULL,
  slug                VARCHAR(500)     NOT NULL,
  title               VARCHAR(500)     NOT NULL,
  description         TEXT,
  asking_price        DECIMAL(12,2)    NOT NULL,
  original_price      DECIMAL(12,2),
  price_updated_at    TIMESTAMPTZ,
  price_drop_flag     BOOLEAN          NOT NULL DEFAULT false,
  make                VARCHAR(100)     NOT NULL,
  model               VARCHAR(100)     NOT NULL,
  year                SMALLINT         NOT NULL,
  variant             VARCHAR(200),
  body_type           VARCHAR(50),
  engine_cc           INTEGER,
  fuel_type           fuel_type        NOT NULL DEFAULT 'petrol',
  transmission        transmission_type NOT NULL DEFAULT 'automatic',
  condition           vehicle_condition NOT NULL DEFAULT 'used',
  mileage_km          INTEGER          NOT NULL,
  mileage_bucket      VARCHAR(20)      NOT NULL,
  district            VARCHAR(100)     NOT NULL,
  division            VARCHAR(100)     NOT NULL,
  photos              JSONB            NOT NULL DEFAULT '[]'::jsonb,
  photo_count         SMALLINT         NOT NULL DEFAULT 0,
  status              listing_status   NOT NULL DEFAULT 'active',
  views               INTEGER          NOT NULL DEFAULT 0,
  inquiries           INTEGER          NOT NULL DEFAULT 0,
  is_featured         BOOLEAN          NOT NULL DEFAULT false,
  featured_slot       VARCHAR(50),
  featured_expires_at TIMESTAMPTZ,
  imv_p50             DECIMAL(12,2),
  imv_sample_size     INTEGER,
  deal_score          DECIMAL(6,4),
  deal_rating         deal_rating      NOT NULL DEFAULT 'unrated',
  created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,

  CONSTRAINT pk_marketplace_listing PRIMARY KEY (id)
);

CREATE TABLE sync_audit_log (
  id                  UUID             NOT NULL DEFAULT uuid_generate_v4(),
  vehicle_id          UUID             NOT NULL,
  dealership_id       UUID             NOT NULL,
  event_type          sync_event_type  NOT NULL,
  status              sync_status      NOT NULL,
  duration_ms         INTEGER          NOT NULL,
  error_message       TEXT,
  fan_out_results     JSONB            NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- 8. PLATFORM AUDIT TRAIL TABLES
CREATE TABLE platform_audit_log (
  id             UUID        NOT NULL DEFAULT uuid_generate_v4(),
  action         VARCHAR(100) NOT NULL,
  actor_id       UUID        REFERENCES "user"(id),
  actor_ip       INET,
  before_state   JSONB,
  after_state    JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE entity_change_log (
  id                    UUID        NOT NULL DEFAULT uuid_generate_v4(),
  entity_type           VARCHAR(50) NOT NULL,
  entity_id             UUID        NOT NULL,
  action                VARCHAR(20) NOT NULL,
  actor_id              UUID        REFERENCES "user"(id),
  impersonated_by_id    UUID        REFERENCES "user"(id),
  before_state          JSONB,
  after_state           JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. AUDIT INDEXES
CREATE INDEX idx_ecl_entity ON entity_change_log (entity_type, entity_id);

-- 10. ENABLE RLS & CREATE POLICIES FOR ALL TENANT TABLES
-- Tenant tables: dealership_location, dealer_staff, dealer_settings, vehicle, vehicle_status_history,
--   recon_assessment, recon_task, customer, lead, lead_interaction, deal, deal_payment, vehicle_expense, operational_expense

-- Helper macro to enable RLS and add basic policy
-- Dealership Location
ALTER TABLE dealership_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealership_location FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_dealership_location ON dealership_location
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

-- Dealer Staff
ALTER TABLE dealer_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_staff FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_dealer_staff ON dealer_staff
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

-- Dealer Settings
ALTER TABLE dealer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_settings FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_dealer_settings ON dealer_settings
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

-- Vehicle
ALTER TABLE vehicle ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_vehicle ON vehicle
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

-- Vehicle Status History
ALTER TABLE vehicle_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_status_history FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_vehicle_status_history ON vehicle_status_history
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

-- Recon Assessment
ALTER TABLE recon_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE recon_assessment FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_recon_assessment ON recon_assessment
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

-- Recon Task
ALTER TABLE recon_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE recon_task FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_recon_task ON recon_task
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

-- Customer
ALTER TABLE customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_customer ON customer
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

-- Lead
ALTER TABLE lead ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_lead ON lead
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

-- Lead Interaction
ALTER TABLE lead_interaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interaction FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_lead_interaction ON lead_interaction
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

-- Deal
ALTER TABLE deal ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_deal ON deal
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

-- Deal Payment
ALTER TABLE deal_payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_payment FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_deal_payment ON deal_payment
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

-- Vehicle Expense
ALTER TABLE vehicle_expense ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_expense FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_vehicle_expense ON vehicle_expense
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

-- Operational Expense
ALTER TABLE operational_expense ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_expense FORCE ROW LEVEL SECURITY;
CREATE POLICY rls_operational_expense ON operational_expense
  USING (dealership_id = current_setting('app.current_dealer_id', true)::uuid);

-- 11. INDEXES (40+ performance indexes)
CREATE INDEX idx_user_status ON "user" (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_dealership_status ON dealership (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_dealership_district ON dealership (district, status);
CREATE INDEX idx_dealership_slug ON dealership (slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_location_dealer ON dealership_location (dealership_id);
CREATE INDEX idx_dealer_staff_dealer ON dealer_staff (dealership_id) WHERE is_active = true;
CREATE INDEX idx_vehicle_make_model_year ON vehicle (make, model, year);
CREATE INDEX idx_vehicle_status ON vehicle (dealership_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicle_vin ON vehicle (vin) WHERE vin IS NOT NULL;
CREATE INDEX idx_vehicle_reg ON vehicle (registration_no) WHERE registration_no IS NOT NULL;
CREATE INDEX idx_vsh_vehicle ON vehicle_status_history (vehicle_id, created_at DESC);
CREATE INDEX idx_recon_task_vehicle ON recon_task (vehicle_id, status);
CREATE INDEX idx_customer_phone ON customer (dealership_id, phone);
CREATE INDEX idx_customer_dealer ON customer (dealership_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lead_dealer_stage ON lead (dealership_id, stage, next_follow_up) WHERE deleted_at IS NULL;
CREATE INDEX idx_lead_assigned ON lead (assigned_to, stage, next_follow_up) WHERE deleted_at IS NULL;
CREATE INDEX idx_lead_phone ON lead (dealership_id, buyer_phone);
CREATE INDEX idx_lead_score ON lead (dealership_id, lead_score DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_lead_interaction_lead ON lead_interaction (lead_id, created_at DESC);
CREATE INDEX idx_deal_dealer_status ON deal (dealership_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_deal_vehicle ON deal (vehicle_id);
CREATE INDEX idx_deal_delivered ON deal (dealership_id, delivered_at DESC) WHERE status = 'delivered';
CREATE INDEX idx_deal_payment_deal ON deal_payment (deal_id, paid_at DESC);
CREATE INDEX idx_vehicle_expense_vehicle ON vehicle_expense (vehicle_id, date DESC);
CREATE INDEX idx_op_expense_dealer_date ON operational_expense (dealership_id, date DESC);
CREATE INDEX idx_marketplace_search ON marketplace_listing (make, model, year, status, is_featured DESC);
CREATE INDEX idx_marketplace_district ON marketplace_listing (district, status);
CREATE INDEX idx_marketplace_price ON marketplace_listing (asking_price, status);
CREATE INDEX idx_marketplace_slug ON marketplace_listing (slug) WHERE deleted_at IS NULL;

-- 12. TRIGGERS

-- 12.1 Auto-update updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_vehicle BEFORE UPDATE ON vehicle FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_lead BEFORE UPDATE ON lead FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_deal BEFORE UPDATE ON deal FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_customer BEFORE UPDATE ON customer FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_dealership BEFORE UPDATE ON dealership FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_marketplace_listing BEFORE UPDATE ON marketplace_listing FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 12.2 Auto-compute mileage_bucket
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

CREATE TRIGGER set_mileage_bucket BEFORE INSERT OR UPDATE OF mileage_km ON vehicle
  FOR EACH ROW EXECUTE FUNCTION trigger_set_mileage_bucket();
CREATE TRIGGER set_mileage_bucket_listing BEFORE INSERT OR UPDATE OF mileage_km ON marketplace_listing
  FOR EACH ROW EXECUTE FUNCTION trigger_set_mileage_bucket();

-- 12.3 Auto-compute net_profit_estimate and update recon_total
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

CREATE TRIGGER update_recon_total AFTER INSERT OR UPDATE OR DELETE ON vehicle_expense
  FOR EACH ROW EXECUTE FUNCTION trigger_update_recon_total();

-- 12.4 Auto-compute deal_score and deal_rating on marketplace_listing
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
    NEW.deal_rating := 'unrated'::deal_rating;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compute_deal_score BEFORE INSERT OR UPDATE OF asking_price, imv_p50, imv_sample_size ON marketplace_listing
  FOR EACH ROW EXECUTE FUNCTION trigger_compute_deal_score();

-- 12.5 Guard sold/scrapped vehicle status
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

CREATE TRIGGER guard_vehicle_sold_status BEFORE UPDATE OF status ON vehicle
  FOR EACH ROW EXECUTE FUNCTION trigger_guard_sold_status();

-- 13. USER ROLE CREATION FOR SECURITY
-- Note: Running these in Docker-compose environment. In managed environments, they are run manually.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user LOGIN PASSWORD 'strong_password_here';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'migration_user') THEN
    CREATE ROLE migration_user LOGIN PASSWORD 'migration_password_here';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE garisale TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

ALTER ROLE migration_user BYPASSRLS;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO migration_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO migration_user;
