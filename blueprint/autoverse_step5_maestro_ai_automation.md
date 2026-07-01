# AutoVerse — Step 5: AI + Automation Engine (Maestro)
### IMV Algorithm · Lead Scoring · Insight Engine · Automation Execution · v1.0

> Complete specification of every intelligent system in AutoVerse: the IMV pricing algorithm with exact percentile math, all six Maestro insight types with generation logic and priority scoring, the full automation sequence execution engine with rule storage and rate limiting, the lead scoring model with decay functions, the aging watchlist alert system, daily summary assembly, and the complete automation map across all four channels.

---

## Table of Contents

1. [IMV Algorithm — Complete Specification](#1-imv-algorithm--complete-specification)
2. [IMV Nightly Recalculation Job](#2-imv-nightly-recalculation-job)
3. [Maestro Insight Engine — Generation Architecture](#3-maestro-insight-engine--generation-architecture)
4. [Insight Type Specifications — All Six Types](#4-insight-type-specifications--all-six-types)
5. [Lead Scoring Engine — Full Model](#5-lead-scoring-engine--full-model)
6. [Aging Watchlist — Full Alert Tier Logic](#6-aging-watchlist--full-alert-tier-logic)
7. [Daily Summary Generation — Assembly & Delivery](#7-daily-summary-generation--assembly--delivery)
8. [Automation Sequence Execution Engine](#8-automation-sequence-execution-engine)
9. [Full Automation Map — All Channels](#9-full-automation-map--all-channels)
10. [Automation Failure Handling & Fallbacks](#10-automation-failure-handling--fallbacks)

---

## 1. IMV Algorithm — Complete Specification

### 1.1 What IMV Is and Is Not

```
IMV (Intelligent Market Value) is a statistical estimate of the fair market
price for a specific vehicle in a specific location at a specific point in time.

IMV IS:
  A rolling percentile distribution computed from active marketplace listings
  of comparable vehicles in the same geographic cluster.

IMV IS NOT:
  A certified valuation (like an appraisal)
  A prediction of future resale value
  A guarantee of transaction price
  Based on external data sources (Phase 1 — internal data only)

IMV DATA SOURCE (Phase 1):
  marketplace_listing table WHERE status = 'active'
  Only live asking prices — not transaction prices (not yet available at launch)
  This is a limitation acknowledged in the UI: "Based on current listing prices"

IMV DATA SOURCE (Phase 2 roadmap):
  Transaction prices from completed deals (more accurate than asking prices)
  External BD car data partnerships (Bikroy historical data licensing)
  Import duty tables (affect reconditioned vehicle pricing heavily in BD)
```

### 1.2 Cluster Definition

```
CLUSTER KEY = make + model + year + mileage_bucket + condition + district

EACH DIMENSION:
  make:           VARCHAR — "Toyota", "Honda", "Nissan", "Mitsubishi", etc.
  model:          VARCHAR — "Axio", "Fit", "X-Trail", "Outlander", etc.
  year:           SMALLINT — 4-digit year: 2015, 2016, ..., 2025
  mileage_bucket: VARCHAR — one of four bands:
                    '0-30K'   (0 to 29,999 km)
                    '30-60K'  (30,000 to 59,999 km)
                    '60-100K' (60,000 to 99,999 km)
                    '100K+'   (100,000+ km)
  condition:      ENUM — 'new' | 'used' | 'reconditioned'
                    'reconditioned' = Japanese import (most BD used cars)
                    'used' = previously registered in BD
                    'new' = brand new, zero km
  district:       VARCHAR — BD administrative district (64 districts)
                    Primary: 'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', etc.

CLUSTER EXAMPLE:
  make=Toyota, model=Axio, year=2019, mileage_bucket=30-60K,
  condition=reconditioned, district=Dhaka
  → This cluster contains all active marketplace listings of
    reconditioned 2019 Toyota Axio with 30–60K km in Dhaka.

CLUSTER CARDINALITY ESTIMATE:
  50 makes × 5 avg models × 10 active years × 4 mileage × 2 conditions × 10 active districts
  = 200,000 theoretical clusters
  In practice: ~5,000–15,000 clusters with sample_size ≥ 1 at any time
  ~500–1,000 clusters with sample_size ≥ 10 (rated clusters)
```

### 1.3 Percentile Computation — Exact SQL

```sql
-- Run per cluster. Parameters: $1=make, $2=model, $3=year,
--                               $4=mileage_bucket, $5=condition, $6=district

SELECT
  COUNT(*)                                                    AS sample_size,
  MIN(asking_price)                                           AS price_min,
  MAX(asking_price)                                           AS price_max,
  AVG(asking_price)                                           AS price_mean,
  STDDEV_POP(asking_price)                                    AS price_stddev,
  PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY asking_price)  AS p5,
  PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY asking_price)  AS p10,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY asking_price)  AS p25,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY asking_price)  AS p50,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY asking_price)  AS p75,
  PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY asking_price)  AS p90,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY asking_price)  AS p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY asking_price)  AS p99
FROM marketplace_listing
WHERE
  make           = $1
  AND model      = $2
  AND year       = $3
  AND mileage_bucket = $4
  AND condition  = $5
  AND district   = $6
  AND status     = 'active'                    -- only live listings
  AND listing_type IN ('dealer', 'c2c')        -- all seller types
  AND created_at >= NOW() - INTERVAL '90 days' -- recency window
  AND is_featured = false;                     -- exclude featured (may skew sample)

-- NOTE on recency window:
-- 90-day window balances:
--   a. Sufficient sample size (older = more data)
--   b. Price relevance (BD used car prices shift 5–10% per quarter)
-- For clusters with sample_size < 10 in 90 days:
--   Expand window to 180 days. If still < 5: no rating (unrated).
```

### 1.4 Outlier Removal

```sql
-- Before percentile computation, remove statistical outliers.
-- Outliers distort p50 in small samples.

-- IQR-based outlier removal (applied when sample_size >= 10):
WITH base AS (
  SELECT
    asking_price,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY asking_price)
      OVER () AS q1,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY asking_price)
      OVER () AS q3
  FROM marketplace_listing
  WHERE make = $1 AND model = $2 AND year = $3
    AND mileage_bucket = $4 AND condition = $5
    AND district = $6 AND status = 'active'
),
iqr_filtered AS (
  SELECT asking_price
  FROM base
  WHERE asking_price BETWEEN (q1 - 1.5 * (q3 - q1))
                         AND (q3 + 1.5 * (q3 - q1))
)
SELECT
  COUNT(*)                                                    AS sample_size,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY asking_price)  AS p50,
  -- ... other percentiles
FROM iqr_filtered;

-- When sample_size < 10: skip IQR removal (not enough data for reliable IQR).
-- Use raw data with note: "Limited data — price estimate may be less accurate."
```

### 1.5 Geographic Fallback Strategy

```
WHEN a cluster has insufficient data (sample_size < 5):

  STEP 1: District-level cluster (primary)
    cluster_key = make + model + year + mileage_bucket + condition + district
    sample_size < 5 → proceed to Step 2

  STEP 2: Division-level fallback
    cluster_key = make + model + year + mileage_bucket + condition + division
    Query: WHERE division = (SELECT division FROM district_reference WHERE name = $district)
    If sample_size >= 5 → use this cluster
    Add note on listing: "Based on [Division] region data"
    sample_size still < 5 → proceed to Step 3

  STEP 3: National-level fallback
    cluster_key = make + model + year + mileage_bucket + condition
    Query: no district/division filter
    If sample_size >= 5 → use this cluster
    Add note: "Based on national data (limited local listings)"
    sample_size still < 5 → proceed to Step 4

  STEP 4: Condition-relaxed fallback
    If condition = 'reconditioned': also include condition = 'used' in query
    (Reconditioned and used are comparable in some segments)
    Add note: "Based on similar condition vehicles"
    sample_size still < 5 → unrated

  STEP 5: Mileage-bucket-relaxed fallback
    Expand mileage bucket to adjacent bucket
    (e.g., 30-60K → also include 30-100K range)
    sample_size still < 5 → unrated

UNRATED display:
  deal_rating = 'unrated'
  Badge: grey "No Rating"
  Tooltip: "We need more comparable listings to rate this car.
            [N] listings found. Need at least 5."
```

### 1.6 Deal Score Formula & Rating Thresholds

```
DEAL SCORE FORMULA:
  deal_score = (listing.asking_price - imv_p50) / imv_p50

  Result is a signed decimal:
    Negative = price below market (good deal for buyer)
    Positive = price above market (overpriced)
    Zero     = exactly at market median

EXAMPLES:
  asking_price = 1,200,000  imv_p50 = 1,400,000
  deal_score = (1,200,000 - 1,400,000) / 1,400,000 = -0.1429  → Good Deal

  asking_price = 1,400,000  imv_p50 = 1,400,000
  deal_score = (1,400,000 - 1,400,000) / 1,400,000 = 0.0000   → Fair Price

  asking_price = 1,600,000  imv_p50 = 1,400,000
  deal_score = (1,600,000 - 1,400,000) / 1,400,000 = +0.1429  → Overpriced

RATING THRESHOLDS:
  deal_score < -0.15                         → 🟢 Great Deal
  deal_score >= -0.15 AND deal_score < -0.05 → 🟦 Good Deal
  deal_score >= -0.05 AND deal_score < +0.10 → 🟡 Fair Price
  deal_score >= +0.10                        → 🔴 Overpriced
  sample_size < 10 (regardless of score)     → ⚪ No Rating (Unrated)
  imv_p50 IS NULL (no cluster data)          → ⚪ No Rating (Unrated)

STORED PRECISION:
  deal_score: DECIMAL(6,4)  — stores up to ±9.9999 (handles extreme outliers)
  Typical range: -0.9000 to +2.0000

PRICE STATEMENT GENERATION (displayed on listing page):
  great_deal:  "BDT {abs(asking_price - imv_p50):,} below market average"
  good_deal:   "BDT {abs(asking_price - imv_p50):,} below market average"
  fair_price:  "Near market average"
               OR "BDT {asking_price - imv_p50:,} above market average" if positive
  overpriced:  "BDT {asking_price - imv_p50:,} above market average"

  Amount rounding: round to nearest BDT 1,000 for display clarity
  e.g., BDT 43,571 → displayed as "BDT 44,000 below market average"
```

### 1.7 IMV Confidence Classification

```
sample_size = 0              → confidence = 'none'   → No Rating
sample_size 1–4              → confidence = 'none'   → No Rating (insufficient)
sample_size 5–9              → confidence = 'low'    → Show range, NO rating badge
sample_size 10–29            → confidence = 'medium' → Full rating badge
sample_size 30+              → confidence = 'high'   → Full rating badge + "Based on 30+ listings"

UI DISPLAY BY CONFIDENCE:
  none:
    No IMV section shown on listing page
    Admin sees: cluster exists but no data

  low (5–9):
    IMV box shown: "Estimated Range: BDT {p25:,} – BDT {p75:,}"
    Disclaimer: "Based on {sample_size} listings — limited data"
    No deal_rating badge
    deal_rating = 'unrated' in database

  medium (10–29):
    Full IMV box: low / market avg / high
    Deal rating badge shown
    No sample size disclosed to buyer (don't discourage trust)

  high (30+):
    Same as medium
    Additional trust indicator: "Based on 30+ comparable listings"
```

### 1.8 IMV Override Protocol

```
WHEN OVERRIDES ARE NEEDED:
  Import restriction event → all imported vehicles suddenly worth more
  Flood damage season → specific districts' prices drop 15–20%
  Eid period demand spike → prices temporarily elevated
  Market data anomaly → outlier listings distorting cluster
  New model launch → adjacent model year values shift

OVERRIDE TYPES:
  adjust_p50_by_percent:
    New p50 = current p50 × (1 + override_pct)
    Use for: systematic market event affecting all similar vehicles

  set_manual_p50:
    Override p50 to specific BDT amount
    Use for: specific cluster correction with known fair value

  suppress_rating_for_period:
    deal_rating → 'unrated' for all listings in cluster
    imv_p50 still computed but badge hidden
    Use for: uncertainty periods (new import duty announced but not in effect yet)

OVERRIDE GOVERNANCE:
  Request:  Marketing Admin submits via admin panel
  Approval: Super Admin only (cannot self-approve)
  Required fields: override_type, override_value, reason_code, override_expires_at
  reason_code options:
    import_restriction_event | flood_damage | eid_demand_spike |
    data_anomaly_correction | regulation_change | other

  Expiry: mandatory (max 90 days). Auto-reverts to computed IMV at expiry.
  Notification: dealers with overridden models receive in-app notice:
    "Market data for [Make] [Model] [Year] has been manually adjusted
     due to [reason]. This affects your IMV ratings."

  Audit trail: every override logged in platform_audit_log with
    before_state, after_state, approver, reason.
```

---

## 2. IMV Nightly Recalculation Job

### 2.1 Job Architecture

```
TRIGGER: BullMQ cron — '0 2 * * *' (2:00 AM BD time = 20:00 UTC previous day)
QUEUE: imv-recalculate
WORKER: analytics-worker
CONCURRENCY: 20 workers for parallel cluster processing
EXPECTED DURATION: 5–12 minutes for full recalculation at 500K listings

EXECUTION STAGES:

Stage 1: Snapshot Previous Values (2:00:00 AM)
  For each cluster: record current p50 as prev_p50
  This enables trend calculation (pct_change_30d)

Stage 2: Identify Active Clusters (2:00:10 AM)
  Query: SELECT DISTINCT make, model, year, mileage_bucket, condition, district
         FROM marketplace_listing
         WHERE status = 'active'
  Result: list of clusters that have at least 1 active listing

Stage 3: Compute Cluster Statistics (2:00:30 AM → ~2:10 AM)
  For each cluster in parallel (20 workers):
    a. Run percentile SQL query (Section 1.3)
    b. Apply IQR outlier removal (if sample_size >= 10)
    c. Apply geographic fallback if needed (Section 1.5)
    d. Compute confidence level (Section 1.7)
    e. Compute pct_change_30d = (new_p50 - prev_p50) / prev_p50 × 100
    f. Determine trend_direction:
         pct_change_30d > +2%  → 'up'
         pct_change_30d < -2%  → 'down'
         Otherwise             → 'stable'
    g. Apply active overrides (if any, Section 1.8)
    h. UPSERT into imv_cluster table

Stage 4: Bulk Update Listing Deal Ratings (2:10 AM → ~2:15 AM)
  For all marketplace_listings WHERE status = 'active':
    a. JOIN with updated imv_cluster
    b. Recompute deal_score for each listing
    c. Recompute deal_rating from deal_score
    d. Batch UPDATE marketplace_listing (1,000 rows per batch)
    e. Set deal_rating_updated_at = NOW()

  SQL (batch update):
    UPDATE marketplace_listing ml
    SET
      imv_p25 = ic.p25,
      imv_p50 = ic.p50,
      imv_p75 = ic.p75,
      imv_sample_size = ic.sample_size,
      deal_score = CASE
        WHEN ic.p50 IS NOT NULL AND ic.p50 > 0
        THEN (ml.asking_price - ic.p50) / ic.p50
        ELSE NULL
      END,
      deal_rating = CASE
        WHEN ic.sample_size < 10 THEN 'unrated'
        WHEN (ml.asking_price - ic.p50) / ic.p50 < -0.15 THEN 'great_deal'
        WHEN (ml.asking_price - ic.p50) / ic.p50 < -0.05 THEN 'good_deal'
        WHEN (ml.asking_price - ic.p50) / ic.p50 < 0.10  THEN 'fair_price'
        ELSE 'overpriced'
      END,
      deal_rating_updated_at = NOW()
    FROM imv_cluster ic
    WHERE ml.make = ic.make AND ml.model = ic.model AND ml.year = ic.year
      AND ml.mileage_bucket = ic.mileage_bucket AND ml.condition = ic.condition
      AND ml.district = ic.district
      AND ml.status = 'active';

Stage 5: Bulk Update MeiliSearch Index (2:15 AM → ~2:20 AM)
  For all updated listings:
    MeiliSearch batch update: deal_score, deal_rating fields
    Batch size: 5,000 documents per API call
    MeiliSearch processes async — visible in search within ~30 seconds

Stage 6: Redis Cache Invalidation (2:20 AM)
  DEL all keys matching: cache:imv:*
  (All IMV cluster caches cleared — fresh data on next request)
  DEL all keys matching: cache:search:*
  (Search result caches cleared — deal ratings have changed)

Stage 7: Trend Storage for Price Trend Charts (2:22 AM)
  INSERT INTO price_trend (make, model, year, district, recorded_date, avg_price, median_price, listing_count)
  SELECT make, model, year, district, CURRENT_DATE, price_mean, p50, sample_size
  FROM imv_cluster
  WHERE last_calculated_at::date = CURRENT_DATE
  ON CONFLICT (make, model, year, district, recorded_date)
  DO UPDATE SET avg_price = EXCLUDED.avg_price, median_price = EXCLUDED.median_price,
    listing_count = EXCLUDED.listing_count;

Stage 8: Log Completion
  INSERT INTO imv_calculation_run:
    status = 'complete', clusters_updated = N, listings_rated = M,
    started_at, completed_at, triggered_by = 'nightly_cron'
```

### 2.2 Instant Recalculation (Single Listing Price Update)

```
TRIGGER: vehicle.asking_price updated in Dealer OS
         → sync_vehicle.price_update event
         → BullMQ: imv-recalculate job with type='single_listing'

EXECUTION (< 200ms target):

  Step 1: Identify cluster for this vehicle
    cluster_key = (make, model, year, mileage_bucket, condition, district)

  Step 2: Check Redis cache for cluster
    Key: cache:imv:{make}:{model}:{year}:{mileage_bucket}:{condition}:{district}
    HIT  → use cached imv_p50 (no DB query needed)
    MISS → run percentile SQL for this cluster → cache result TTL 3600s

  Step 3: Compute new deal_score and deal_rating
    deal_score = (new_asking_price - imv_p50) / imv_p50
    deal_rating = (apply thresholds, Section 1.6)

  Step 4: Update marketplace_listing
    UPDATE marketplace_listing
    SET deal_score = $1, deal_rating = $2, deal_rating_updated_at = NOW(),
        price_drop_flag = ($3 < original_price)
    WHERE vehicle_id = $4

  Step 5: Update MeiliSearch single document
    PUT /{index}/documents/{listing_id}
    Body: { deal_score, deal_rating }

  Step 6: Update price_drop_flag
    If new_price < old_price:
      price_drop_flag = true
      original_price = old_price (if first reduction; preserve original)
      → Fan-out: buyer price-drop alert job

TOTAL LATENCY TARGET: deal_score updated in marketplace within 500ms of price change
```

---

## 3. Maestro Insight Engine — Generation Architecture

### 3.1 Nightly Generation Pipeline

```
TRIGGER: BullMQ cron — '30 2 * * *' (2:30 AM — 30 min after IMV recalculation)
         Ensures fresh IMV data is available when insights are computed.

STEP 1: Enqueue per-dealer jobs (2:30:00 AM)
  SELECT id FROM dealership
  WHERE status = 'active'
  AND subscription_tier IN ('starter', 'professional', 'business', 'enterprise')
  → For each dealer_id: add job to maestro-insights queue

STEP 2: Per-dealer job execution (parallel, 5 workers)
  Worker picks up job: { dealership_id }

  2a. GATHER DEALER DATA (single batched read — not per-insight queries)
    Execute these queries in parallel:

    VEHICLES_DATA:
      SELECT v.id, v.stock_no, v.make, v.model, v.year, v.asking_price,
             v.days_on_lot, v.mileage_bucket, v.condition, v.status,
             ic.p50 AS imv_p50, ic.sample_size AS imv_sample_size,
             v.acquisition_cost, v.recon_total,
             v.net_profit_estimate,
             (v.asking_price - ic.p50) / ic.p50 AS deal_score
      FROM vehicle v
      LEFT JOIN imv_cluster ic ON
        ic.make = v.make AND ic.model = v.model AND ic.year = v.year
        AND ic.mileage_bucket = v.mileage_bucket AND ic.condition = v.condition
        AND ic.district = d.district
      WHERE v.dealership_id = $dealer_id AND v.status = 'available'
        AND v.deleted_at IS NULL

    LEADS_DATA:
      SELECT
        source, stage,
        DATE_PART('epoch', NOW() - created_at) / 3600 AS hours_since_created,
        DATE_PART('epoch', NOW() - updated_at) / 3600 AS hours_since_update,
        lost_reason,
        assigned_to,
        CASE WHEN stage = 'new' AND DATE_PART('epoch', NOW() - created_at) > 7200
             THEN true ELSE false END AS contact_sla_breached
      FROM lead
      WHERE dealership_id = $dealer_id AND deleted_at IS NULL
        AND created_at >= NOW() - INTERVAL '30 days'

    DEALS_DATA:
      SELECT
        COUNT(*) FILTER (WHERE status = 'delivered') AS deals_closed,
        AVG(gross_profit) FILTER (WHERE status = 'delivered') AS avg_gp,
        COUNT(*) FILTER (WHERE status = 'delivered' AND
          DATE_PART('epoch', delivered_at - created_at) / 86400 < 7) AS fast_closes,
        lost_reason, COUNT(*) AS lost_count
      FROM deal
      WHERE dealership_id = $dealer_id
        AND created_at >= NOW() - INTERVAL '90 days'
      GROUP BY lost_reason

    EXPENSES_DATA:
      SELECT
        v.make, v.model,
        AVG(ve.amount) AS avg_expense,
        SUM(ve.amount) AS total_expense,
        ec.slug AS category,
        COUNT(DISTINCT v.id) AS vehicle_count
      FROM vehicle_expense ve
      JOIN vehicle v ON ve.vehicle_id = v.id
      JOIN expense_category ec ON ve.category_id = ec.id
      WHERE ve.dealership_id = $dealer_id
        AND ve.date >= NOW() - INTERVAL '90 days'
      GROUP BY v.make, v.model, ec.slug

    AUTOMATION_DATA:
      SELECT
        channel,
        COUNT(*) AS messages_sent,
        COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed
      FROM automation_log
      WHERE dealership_id = $dealer_id
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY channel

    DEMAND_DATA:
      SELECT make, model, body_type,
             COUNT(*) AS new_listings_7d,
             pct_change_30d AS imv_trend_pct
      FROM marketplace_listing ml
      JOIN imv_cluster ic ON ml.make = ic.make AND ml.model = ic.model
        AND ml.year = ic.year AND ml.mileage_bucket = ic.mileage_bucket
        AND ml.condition = ic.condition
      WHERE ml.district = (SELECT district FROM dealership WHERE id = $dealer_id)
        AND ml.status = 'active'
        AND ml.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY make, model, body_type, pct_change_30d

  2b. RUN INSIGHT EVALUATORS (parallel, one per insight type)
    Each evaluator receives the pre-fetched data bundle.
    Each returns: { triggered: boolean, priority: 1–10, data: {...} }

  2c. PRIORITY SCORING & SELECTION
    Collect all triggered insights.
    Sort by priority DESC.
    Take top 5 (or fewer if < 5 triggered).

  2d. WRITE TO DATABASE
    DELETE FROM maestro_insight
    WHERE dealership_id = $dealer_id
      AND is_actioned = false AND is_dismissed = false;
    -- Replace previous night's unactioned insights

    INSERT INTO maestro_insight for each selected insight:
      { dealership_id, type, priority, title, message,
        supporting_data, deep_link, expires_at = NOW() + INTERVAL '24 hours' }

  2e. CACHE
    SET cache:maestro:{dealerId}:insights = JSON(insights array) EX 86400

STEP 3: Morning Briefing Assembly (7:45 AM — see Section 7)
  Reads from maestro_insight table (already computed in Step 2).
```

---

## 4. Insight Type Specifications — All Six Types

### 4.1 PRICING Insight

```
EVALUATOR: PricingInsightEvaluator

PURPOSE: Alert dealer to overpriced or stagnant inventory that should be repriced.

TRIGGER CONDITIONS (evaluated per vehicle):
  Condition A: days_on_lot >= 45 AND deal_score > 0   (overpriced AND sitting)
  Condition B: days_on_lot >= 60 AND deal_score >= -0.05
              (even fair price is too high after 60 days in BD market)
  Condition C: deal_score >= +0.10 (Overpriced rating) AND days_on_lot >= 21
  Condition D: asking_price > imv_p95 (extreme outlier)
  Condition E: same make/model sold by dealer in < 15 avg days,
               but this unit at 30+ days (slower than dealer's own benchmark)

  Any condition met → insight triggered for that vehicle.
  Multiple vehicles → single insight listing top 3 candidates.

PRIORITY CALCULATION:
  base_priority = 5
  + days_on_lot_bonus:
      45–59 days:  +1
      60–89 days:  +2
      90+ days:    +3
  + deal_score_bonus:
      deal_score > +0.20: +2
      deal_score > +0.30: +1 more
  + volume_bonus: +1 per additional vehicle over 3 (max +3)
  MAXIMUM: 10

RECOMMENDED PRICE CALCULATION:
  target_good_deal_price = imv_p50 × 0.94    (enters Good Deal at -6%)
  target_great_deal_price = imv_p50 × 0.84   (enters Great Deal at -16%)
  recommendation = target_good_deal_price      (default: recommend Good Deal)
  reduction_amount = asking_price - target_good_deal_price
  reduction_rounded = ROUND(reduction_amount / 5000) × 5000  (nearest BDT 5,000)

MESSAGE TEMPLATE:
  Single vehicle:
    "Your {year} {make} {model} (SK-{stock_no}) has been listed {days_on_lot} days.
     Similar cars in {district} sell in {avg_days_to_sell} days on average.
     Reduce by BDT {reduction_rounded:,} to enter 'Good Deal' — priced at
     BDT {target_good_deal_price:,}."

  Multiple vehicles (top 3 listed):
    "{count} vehicles are priced above market and sitting over 45 days.
     Top candidate: {year} {make} {model} — reduce BDT {reduction:,} to Good Deal.
     Estimated additional daily holding cost: BDT {total_daily_erosion:,}/day."

SUPPORTING_DATA JSONB:
  {
    "vehicles": [
      {
        "vehicle_id": "uuid",
        "stock_no": "SK-2025-0012",
        "make": "Toyota", "model": "Axio", "year": 2019,
        "asking_price": 1550000,
        "imv_p50": 1380000,
        "deal_score": 0.123,
        "deal_rating": "overpriced",
        "days_on_lot": 52,
        "recommended_price": 1297200,
        "reduction_amount": 252800,
        "reduction_rounded": 255000,
        "daily_erosion_bdt": 1200
      }
    ],
    "avg_days_to_sell_district": 23,
    "total_daily_erosion_all": 3600
  }

DEEP_LINK:
  Single: /inventory/vehicles/{vehicle_id}?tab=marketplace&action=reprice&highlight=price
  Multiple: /inventory?filter=overpriced&sort=days_on_lot_desc
```

### 4.2 DEMAND Insight

```
EVALUATOR: DemandInsightEvaluator

PURPOSE: Alert dealer to demand signals in their market that they are not capturing.

TRIGGER CONDITIONS:
  Condition A: imv_trend (pct_change_30d) >= +10% for a make/model in dealer's district
               AND dealer has 0 of that make/model in available inventory
  Condition B: dealer's district sees >= 5 new listings of same make/model in 7 days
               (competitor restocking signal: there's active demand)
  Condition C: dealer sold >= 2 units of same make/model in last 30 days
               (own sell-through signal: time to restock)
  Condition D: fuel_type = 'hybrid' AND district demand index up >= 15% in 30 days
               (BD hybrid adoption is accelerating; a universal demand signal)
  Condition E: a body_type has 0 units in dealer's inventory
               AND 10+ active listings of that type in district
               AND dealer's district has active search queries for that type
               (search demand from marketplace analytics — Phase 2)

PRIORITY CALCULATION:
  base_priority = 4
  + trend_bonus:
      pct_change_30d 10–19%: +1
      pct_change_30d 20–29%: +2
      pct_change_30d 30%+:   +3
  + own_sellthrough_bonus: +2 if dealer's own sales drove Condition C
  + zero_stock_bonus: +1 if dealer has exactly 0 in stock (missed all demand)

MESSAGE TEMPLATE:
  "Hybrid hatchback demand in {district} is up {pct_change}% this month.
   You have {current_stock_count} in stock.
   {competitor_count} dealers in your area have restocked {make} {model}."

  OR for own sell-through:
   "You've sold {count} {make} {model} units in 30 days — your fastest-selling model.
    Only {remaining} left in stock. Consider restocking."

SUPPORTING_DATA:
  {
    "demand_signals": [
      {
        "make": "Toyota", "model": "Aqua",
        "body_type": "hybrid hatchback",
        "pct_change_30d": 23.4,
        "new_listings_7d": 8,
        "dealer_stock_count": 0,
        "district": "Dhaka"
      }
    ],
    "dealer_recent_sales": [{ "make": "Toyota", "model": "Axio", "count": 3 }]
  }

DEEP_LINK:
  /inventory/vehicles/add?prefill_make={make}&prefill_model={model}&prefill_body_type={type}
```

### 4.3 CONVERSION Insight

```
EVALUATOR: ConversionInsightEvaluator

PURPOSE: Surface lead funnel inefficiencies that are costing the dealer sales.

DATA COMPUTED FROM leads_data:
  avg_response_time_hours:
    AVG(hours_since_created - hours_since_update) for leads in 'new' stage

  source_conversion_rates:
    per source: COUNT(stage='closed') / COUNT(*) × 100

  response_time_by_salesperson:
    per assigned_to: AVG(time from created_at to first interaction)

  stage_drop_off_rates:
    per stage pair: how many leads enter stage X but don't advance in 7 days

  lost_reason_distribution:
    GROUP BY lost_reason, COUNT(*) — what's causing losses

TRIGGER CONDITIONS:
  Condition A: avg_response_time > 2 hours for marketplace/fb/whatsapp leads
  Condition B: >= 3 leads lost with reason = 'no_response_after_7_days' this week
  Condition C: facebook/marketplace conversion rate < 5%
               AND walk_in conversion rate > 15% (response-time gap hypothesis)
  Condition D: > 30% of leads stuck in same stage for > 5 days
               (pipeline is blocked somewhere)
  Condition E: a specific salesperson's leads have 2× worse conversion than team avg
               (coaching signal — insight to owner only)
  Condition F: >= 5 leads in 'new' stage with contact_sla_breached = true this week

PRIORITY CALCULATION:
  base_priority = 6  (conversion insights directly affect revenue — high base)
  + response_time_bonus:
      avg > 4h:   +1
      avg > 8h:   +2
      avg > 24h:  +3
  + volume_bonus: +1 per 5 uncontacted leads over 3 (max +2)

MESSAGE TEMPLATE (response time variant):
  "Facebook leads convert at {fb_rate}% vs walk-in {walkin_rate}%.
   Average Facebook response time this week: {avg_response_hours:.1f} hours.
   Target: under 30 minutes.
   {uncontacted_count} leads received no response in the last 7 days."

MESSAGE TEMPLATE (stage blockage variant):
  "{stuck_count} leads have been stuck in '{stage}' for over 5 days.
   Common pattern: leads not advancing from Quote Sent.
   Consider a follow-up call rather than WhatsApp for these."

DEEP_LINK:
  Condition A: /crm/leads?filter=source:{source}&filter=stage:new,contacted&sort=created_at_asc
  Condition E: /analytics/performance?filter=salesperson:{id}&period=30d
```

### 4.4 EXPENSE Insight

```
EVALUATOR: ExpenseInsightEvaluator

PURPOSE: Alert owner to recon cost patterns that are compressing margins.

DATA: expenses_data aggregated by make/model/category

TRIGGER CONDITIONS:
  Condition A: avg recon cost for a make/model > (imv_p50 × target_margin_pct)
               i.e., recon alone is eating the target GP margin
  Condition B: a specific expense category (e.g., 'engine_service') trending up
               >= 25% vs previous quarter for same make/model
  Condition C: a specific vendor's avg cost is >= 2× the category average
               (overpriced vendor signal)
  Condition D: total Type 2 operational expenses this month > last month by >= 20%
               AND no new staff hired (unexpected OPEX spike)
  Condition E: recon_total / acquisition_cost > 0.25 on 3+ vehicles
               (spending > 25% of purchase cost on recon — acquisition problem)

PRIORITY CALCULATION:
  base_priority = 3
  + margin_impact_bonus:
      affects 1–2 vehicles: +1
      affects 3–5 vehicles: +2
      affects 6+ vehicles:  +3
  + severity_bonus:
      recon > 30% of IMV: +2

MESSAGE TEMPLATE (recon cost variant):
  "Recon costs on {make} {model} models averaged BDT {avg_cost:,} this quarter
   — {pct_above}% above your {target_margin_pct}% GP target margin.
   This has affected {vehicle_count} vehicles.
   Engine service is the highest cost category at BDT {engine_avg:,} avg."

SUPPORTING_DATA:
  {
    "make": "Corolla", "model": "Axio",
    "avg_recon_cost": 85000,
    "target_margin_cost": 62000,
    "vehicle_count": 4,
    "top_categories": [
      { "category": "engine_service", "avg_cost": 35000 },
      { "category": "paint", "avg_cost": 22000 }
    ],
    "period_label": "Q1 2025"
  }

DEEP_LINK: /analytics/reports/expenses?filter_make={make}&filter_model={model}&period=90d
```

### 4.5 AUTOMATION Insight

```
EVALUATOR: AutomationInsightEvaluator

PURPOSE: Surface unused automation opportunities that cost the dealer leads and sales.

TRIGGER CONDITIONS:
  Condition A: away_messages_received > 20 in past week
               AND follow_up_next_day_count < 3 (messages not followed up)
  Condition B: automation_channel = 'whatsapp' has 0 active rules
               AND dealer has > 10 leads from whatsapp source in 30 days
  Condition C: post_sale_sequence not configured
               AND dealer closed >= 3 deals this month
               (missing post-sale engagement = lost referral/service revenue)
  Condition D: lead_followup_sequence not enabled
               AND dealer has >= 5 leads stuck in 'new' or 'contacted' stage > 48h
  Condition E: social auto-post disabled AND no posts in last 14 days
               AND dealer has >= 10 available vehicles
               (zero social presence despite having inventory)
  Condition F: facebook_lead_ads not connected (Professional+ plan)
               AND dealer is on Professional plan
               (they're paying for the feature but not using it)

PRIORITY:
  base_priority = 3
  + missed_opportunity_volume bonus: +1 per 10 unanswered away messages (max +3)

MESSAGE TEMPLATES:
  Condition A:
    "Your away message received {count} messages this week with no follow-up next day.
     Enable the lead capture bot to convert these into CRM leads automatically."

  Condition C:
    "You've closed {count} deals this month but haven't set up post-sale messaging.
     Customers who get a follow-up are 3× more likely to refer friends."

  Condition F:
    "Your Professional plan includes Facebook Lead Ad sync — but it's not connected.
     Connect your Facebook Business Manager to automatically import leads."

DEEP_LINKS:
  Condition A: /automation/whatsapp?setup=away_message_bot
  Condition C: /automation/whatsapp?setup=post_sale_sequence
  Condition D: /automation/whatsapp?setup=lead_followup
  Condition F: /website-marketing/channel-connections?highlight=facebook
```

### 4.6 RECON_QUALITY Insight

```
EVALUATOR: ReconQualityInsightEvaluator

PURPOSE: Identify recon workflow bottlenecks and post-delivery quality issues.

TRIGGER CONDITIONS:
  Condition A: avg days from vehicle.acquired → vehicle.available > 14 days
               for vehicles processed in last 60 days
               (recon is bottlenecking time-to-market)
  Condition B: any recon_task has been in 'in_progress' status for > 7 days
               (specific task is stuck)
  Condition C: >= 2 deals in past 90 days where post-sale interaction
               mentioned a defect (detected from lead_interaction body text — Phase 2)
  Condition D: recon cost variance > 50% from estimated to actual
               on >= 3 vehicles (bad estimation = margin surprise)

PRIORITY:
  base_priority = 4
  + severity: +2 if avg recon time > 21 days (severely bottlenecked)

MESSAGE TEMPLATE (time bottleneck):
  "Average recon time for your last {count} vehicles: {avg_days} days.
   Target: under 7 days. This is delaying your listing by
   {avg_delay} days per car vs your fastest benchmark.
   {stuck_count} tasks are currently in progress for over 7 days."

DEEP_LINK: /inventory/recon?filter=overdue&sort=days_in_progress_desc
```

### 4.7 Priority Scoring Summary

```
INSIGHT TYPE    BASE    MAX    TYPICAL RANGE    NOTES
──────────────────────────────────────────────────────────────────
CONVERSION       6      10      6–9            Highest base: direct revenue impact
PRICING          5      10      5–9            Common trigger; variable priority
RECON_QUALITY    4       8      4–7            Operational bottleneck
DEMAND           4       9      4–8            High when demand signal is strong
EXPENSE          3       8      3–7            Important but less urgent than conversion
AUTOMATION       3       8      3–7            Low urgency unless large volume missed

PRIORITY SELECTION:
  Top 5 insights by priority score shown to dealer.
  Tie-break: CONVERSION > PRICING > DEMAND > RECON_QUALITY > EXPENSE > AUTOMATION
  If fewer than 5 insights trigger: show all that triggered (no padding with low-quality)
  If 0 insights trigger: show "All looking good" state in dashboard
```

---

## 5. Lead Scoring Engine — Full Model

### 5.1 Scoring Signal Definitions

```
SIGNALS AND WEIGHTS:

POSITIVE SIGNALS (increase score):
┌─────────────────────────────────────────────┬────────┬───────────────────────────────────────┐
│ Signal                                       │ Weight │ Notes                                 │
├─────────────────────────────────────────────┼────────┼───────────────────────────────────────┤
│ enquiry_submitted                           │ +30    │ Base score on lead creation            │
│ phone_number_revealed                       │ +20    │ Buyer shares phone → high intent       │
│ whatsapp_message_sent_by_buyer              │ +15    │ Proactive outreach by buyer            │
│ same_vehicle_viewed_3_plus_times            │ +15    │ Repeated interest in specific vehicle  │
│ personalized_link_viewed                    │ +5     │ Per view (cap: +15 total = 3 views)    │
│ multiple_vehicles_same_make_model           │ +10    │ Narrowing down choice                  │
│ returned_to_listing_next_day               │ +10    │ Continued interest signal              │
│ vehicle_saved_to_wishlist                  │ +10    │ Explicit save action                   │
│ budget_range_matches_price                  │ +10    │ Budget_max >= asking_price × 0.9       │
│ test_drive_scheduled                        │ +20    │ Strong commitment signal               │
│ test_drive_completed                        │ +10    │ Post-test drive (hasn't bought yet)    │
│ responded_to_automation_message             │ +8     │ Replied to any automation message      │
│ opened_email                                │ +3     │ Email open tracked via pixel           │
│ clicked_link_in_email                       │ +7     │ Email engagement                       │
│ referred_by_existing_customer               │ +15    │ Referral leads have higher close rate  │
│ returning_buyer_previous_purchase          │ +20    │ Bought before → high intent again      │
└─────────────────────────────────────────────┴────────┴───────────────────────────────────────┘

NEGATIVE SIGNALS (decrease score):
┌─────────────────────────────────────────────┬────────┬───────────────────────────────────────┐
│ Signal                                       │ Weight │ Notes                                 │
├─────────────────────────────────────────────┼────────┼───────────────────────────────────────┤
│ no_response_to_3_followups                  │ -20    │ Disengagement pattern                 │
│ unsubscribed_from_whatsapp                  │ -30    │ Explicit opt-out                       │
│ marked_not_interested_by_salesperson        │ -25    │ Salesperson judged disqualified        │
│ budget_too_low_for_vehicle                  │ -15    │ Budget_max < asking_price × 0.7        │
│ enquired_on_5_plus_vehicles_no_response     │ -10    │ Window shopper pattern                 │
└─────────────────────────────────────────────┴────────┴───────────────────────────────────────┘
```

### 5.2 Score Decay Function

```
DECAY RULE: −2 points per calendar day with no qualifying interaction.

"Qualifying interaction" = any of:
  - Inbound message from buyer (WhatsApp, email, phone call)
  - Stage advancement in pipeline
  - Personalized link viewed
  - Vehicle saved or revisited

DECAY IS SUSPENDED when:
  - Lead stage = 'closed' (deal in progress)
  - Lead stage = 'lost' (already closed; no point decaying further)
  - Lead had a qualifying interaction today (no decay on active days)

DECAY EXECUTION:
  BullMQ cron: 3:30 AM daily
  Single bulk UPDATE (not per-lead jobs):

    UPDATE lead
    SET lead_score = GREATEST(0, lead_score - 2),
        updated_at = NOW()
    WHERE dealership_id IN (SELECT id FROM dealership WHERE status = 'active')
      AND stage NOT IN ('closed', 'lost')
      AND deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM lead_interaction li
        WHERE li.lead_id = lead.id
          AND li.created_at::date = CURRENT_DATE
          AND li.type IN (
            'whatsapp_received', 'call_inbound', 'personalized_link_viewed',
            'stage_change', 'vehicle_saved'
          )
      );

  FLOOR: score cannot go below 0 (GREATEST(0, ...))
  CEILING: score can technically exceed 100 (accumulation of many signals)
           but classification thresholds still apply at 70

PRACTICAL DECAY TIMELINE:
  Lead created with enquiry: score = 30
  No interaction day 1: 28
  No interaction day 2: 26
  ...
  Day 15: score = 0 (cold floor)

  Lead created, phone revealed (50), saves vehicle (60), views listing 3×(75):
  Score = 75 → HOT triggered immediately
  Day after: 73 (still hot)
  Day 5 with no interaction: 65 (dropped below hot threshold → Warm)
```

### 5.3 Priority Classification & Thresholds

```
THRESHOLDS:
  score >= 70  → 🔥 Hot
  score 40–69  → 🌡️ Warm
  score 0–39   → 🧊 Cold

HOT LEAD TRIGGER (score crosses 70):
  Immediate actions (within 60 seconds):
    1. UPDATE lead.priority = 'hot'
    2. Emit event: crm.lead.hot
    3. SMS to assigned salesperson via notification-sms queue (highest priority)
    4. WebSocket event to dealer dashboard + salesperson's device
    5. Log in lead_interaction: type = 'hot_threshold_crossed', score = X

  SMS template:
    "🔥 HOT LEAD: {buyer_name} scored {score}/100 for {make} {model}.
     {trigger_reason}. Call now: {buyer_phone}.
     View lead: {app_deeplink}"

  trigger_reason examples:
    "Viewed listing 3× today"
    "Revealed phone number"
    "Saved vehicle and viewed personalized link"

  30-MINUTE SLA: if salesperson doesn't interact with lead within 30 min of HOT SMS:
    → Manager also notified: "{salesperson_name} has not contacted hot lead {buyer_name}.
       Taking over recommended."

WARM LEAD BEHAVIOUR:
  Standard follow-up reminder schedule applies.
  No special immediate alert.
  Appears in "Warm Leads" filter in CRM.

COLD LEAD BEHAVIOUR:
  Moved to low-priority queue.
  Automation: 30-day win-back sequence triggered (if stage != 'lost').
  No daily follow-up reminders (would spam salesperson with low-quality contacts).
  Monthly: batch review suggested in Maestro CONVERSION insight.
```

### 5.4 Score Update Architecture

```typescript
// LeadScoringService.recordSignal()
async recordSignal(
  dealerId: string,
  leadId: string,
  signalType: LeadSignalType,
): Promise<void> {
  const weight = SIGNAL_WEIGHTS[signalType];
  if (!weight) return;

  // Debounce rapid signals (e.g., multiple page views in quick succession)
  const debounceKey = `rate:score_update:${leadId}`;
  const recentUpdate = await this.redis.get(debounceKey);
  if (recentUpdate && DEBOUNCED_SIGNALS.includes(signalType)) return;
  await this.redis.set(debounceKey, '1', { EX: 60 });

  // Add to batch update queue (deduped by leadId)
  await this.scoreUpdateQueue.add(
    'update_score',
    { lead_id: leadId, dealer_id: dealerId, signal_type: signalType, delta: weight },
    { jobId: `score:${leadId}`, removeOnComplete: true }
    // jobId deduplication: if score:leadId already queued, this replaces it
    // (accumulate deltas from rapid events into single DB write)
  );
}

// Score update processor
@Processor('lead-score-update')
async processScoreUpdate(job: Job): Promise<void> {
  const { lead_id, dealer_id, signal_type, delta } = job.data;

  // Atomic score update in DB
  const updated = await this.prisma.$executeRaw`
    UPDATE lead
    SET lead_score = LEAST(200, GREATEST(0, lead_score + ${delta})),
        updated_at = NOW()
    WHERE id = ${lead_id} AND dealership_id = ${dealer_id}
      AND stage NOT IN ('closed', 'lost')
    RETURNING lead_score
  `;

  const newScore = updated[0]?.lead_score;

  // Log the signal
  await this.prisma.leadInteraction.create({
    data: {
      dealership_id: dealer_id,
      lead_id,
      type: 'score_update',
      summary: `Score ${delta > 0 ? '+' : ''}${delta} (${signal_type}). New: ${newScore}`,
      metadata: { signal_type, delta, new_score: newScore },
    }
  });

  // Check hot threshold crossing
  if (newScore >= 70) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: lead_id },
      include: { assignee: true, vehicle: true }
    });
    if (lead?.priority !== 'hot') {
      await this.eventEmitter.emit('crm.lead.hot', { ...lead, lead_score: newScore });
    }
  }
}
```

---

## 6. Aging Watchlist — Full Alert Tier Logic

### 6.1 Daily Watchlist Job

```
TRIGGER: BullMQ cron — '0 6 * * *' (6:00 AM BD)
WORKER: analytics-worker
QUERY:
  SELECT
    v.id, v.dealership_id, v.stock_no, v.make, v.model, v.year,
    v.asking_price, v.days_on_lot, v.acquisition_cost, v.recon_total,
    ic.p50 AS imv_p50,
    d.discount_threshold_pct,
    d.target_margin_pct,
    owner.phone AS owner_phone,
    manager.phone AS manager_phone,
    ds.notify_aging_sms
  FROM vehicle v
  JOIN dealership d ON v.dealership_id = d.id
  JOIN "user" owner ON d.owner_id = owner.id
  LEFT JOIN dealer_staff mgr_staff ON mgr_staff.dealership_id = d.id
    AND mgr_staff.role = 'manager' AND mgr_staff.is_active = true
  LEFT JOIN "user" manager ON mgr_staff.user_id = manager.id
  LEFT JOIN dealer_settings ds ON ds.dealership_id = d.id
  LEFT JOIN imv_cluster ic ON ic.make = v.make AND ic.model = v.model
    AND ic.year = v.year AND ic.mileage_bucket = v.mileage_bucket
    AND ic.condition = v.condition AND ic.district = d.district
  WHERE v.status = 'available'
    AND v.deleted_at IS NULL
    AND d.status = 'active'
    AND v.days_on_lot IN (30, 45, 60, 90)
    -- Only fire on EXACT threshold days (not every day at 30+)
    -- Exception: 90+ days fires DAILY until disposition recorded
  ORDER BY v.days_on_lot DESC, v.dealership_id;
```

### 6.2 Alert Tier Specifications

```
TIER 1 — 30 Days 🟡 Yellow Flag
  Condition: days_on_lot = 30
  External notification: NONE (informational only)
  UI changes:
    → Yellow flag indicator on stock card
    → Vehicle appears in "Aging Watchlist" widget on dashboard
    → Widget shows: days_on_lot, asking_price, imv_p50, gap amount, daily_erosion_bdt
  Dashboard widget update: fire immediately when flag condition met
  daily_erosion_bdt formula:
    daily_erosion_bdt = (asking_price × opportunity_cost_rate) / 30
    opportunity_cost_rate = dealership.target_margin_pct / 100 × 0.5
    (half of target margin per month as holding cost proxy)
    DEFAULT: 1.5% per month → daily = asking_price × 0.015 / 30
    Example: BDT 1,500,000 asking_price → BDT 750/day erosion

TIER 2 — 45 Days 🟠 Orange
  Condition: days_on_lot = 45
  External notification: SMS to MANAGER (not owner)
  SMS template (Greenweb BD):
    "AutoVerse: {stock_no} [{year} {make} {model}] on lot 45 days.
     Asking BDT {asking_price:,} vs market BDT {imv_p50:,}.
     Consider repricing."
  UI changes:
    → Orange flag on stock card
    → Orange row highlight in Aging Watchlist widget
  Action hint shown on stock card: "Reprice to BDT {recommended_price:,}?"
  Note: NO owner alert at 45 days — manager handles first.

TIER 3 — 60 Days 🔴 Red
  Condition: days_on_lot = 60
  External notification: SMS to OWNER + SMS to MANAGER
  SMS template (Owner):
    "AutoVerse: {stock_no} [{year} {make} {model}] — 60 days on lot.
     BDT {reduction:,} reduction enters 'Good Deal'.
     Contact us: [support link]"
  Maestro PRICING insight: automatically generated (high priority = 7)
  UI changes:
    → Red flag on stock card
    → Red row in watchlist widget
    → In-app push notification to owner
  Price recommendation shown:
    recommended_price = imv_p50 × 0.94
    reduction_amount = asking_price - recommended_price
    Message: "Reduce by BDT {reduction:,} → enters 'Good Deal' rating"

TIER 4 — 90 Days 🔴🔴 Critical
  Condition: days_on_lot >= 90 (fires DAILY until disposition recorded)
  External notification: SMS to OWNER + in-app notification
  SMS:
    "URGENT: {stock_no} at {days} days on lot. Action required.
     Choose: reduce price, wholesale, or auction. Reply to open."
  UI: CRITICAL badge on ALL list views (not just watchlist widget)
  DISPOSITION REQUIRED (blocking):
    Owner must select one of three options from mandatory dialog:
      a. reduce_price      → opens price edit for this vehicle
      b. send_to_auction   → marks vehicle for auction; creates follow-up task
      c. wholesale         → marks for wholesale; creates follow-up task
      d. retain_with_reason → requires free-text reason (min 20 chars)
    Until disposition recorded: CRITICAL badge persists and daily SMS continues.
    Disposition recorded: alerts stop until 120-day threshold (future tier, Phase 2)

DAILY EROSION DISPLAY (all tiers):
  Shown in watchlist widget for each vehicle:
    daily_erosion: BDT X/day
    total_erosion_since_listed: BDT Y (days_on_lot × daily_erosion)
  Owner can see: "This vehicle has effectively cost BDT {total:,} in holding since listing."
  Psychological anchor: makes repricing feel less painful than continuing to hold.
```

### 6.3 Maestro Price Recommendation on Aging

```
TRIGGERED when: Tier 3 or Tier 4 alert fires AND imv_p50 is available

RECOMMENDATION LOGIC:
  good_deal_target   = ROUND(imv_p50 × 0.940, -4)  // nearest BDT 10,000
  great_deal_target  = ROUND(imv_p50 × 0.840, -4)
  breakeven_price    = acquisition_cost + recon_total + (days_on_lot × daily_erosion)

  PRIMARY RECOMMENDATION:
    IF breakeven_price <= good_deal_target:
      → Recommend good_deal_target (maximizes revenue while moving the car)
    ELSE:
      → Recommend breakeven_price + small_margin
         (below breakeven = accounting loss; dealer needs to know)
         Message: "Warning: market conditions suggest a price where
                  you may not recover full costs. Consult your manager."

  ACCELERATION RECOMMENDATION (if at 90 days):
    → Also show great_deal_target
    Message: "At Great Deal pricing (BDT {great_deal_target:,}), this car
             typically sells in under 7 days in {district}."

DISPLAYED IN:
  → Maestro Insight card (with deeplink to vehicle)
  → Vehicle Stock Card → Marketplace tab → "Price Guidance" section
  → Aging Watchlist widget → tooltip on price column
```

---

## 7. Daily Summary Generation — Assembly & Delivery

### 7.1 Data Assembly (7:45 AM job)

```
PER-DEALER ASSEMBLY QUERIES (run in parallel):

YESTERDAY'S PERFORMANCE:
  SELECT
    COUNT(*) FILTER (WHERE status = 'delivered'
      AND delivered_at::date = CURRENT_DATE - 1)       AS units_sold,
    COALESCE(SUM(sale_price) FILTER (WHERE status = 'delivered'
      AND delivered_at::date = CURRENT_DATE - 1), 0)    AS revenue,
    COALESCE(SUM(gross_profit) FILTER (WHERE status = 'delivered'
      AND delivered_at::date = CURRENT_DATE - 1), 0)    AS gross_profit,
    COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE - 1) AS new_leads,
    COUNT(*) FILTER (WHERE updated_at::date = CURRENT_DATE - 1
      AND stage != 'new')                               AS leads_contacted
  FROM deal d
  LEFT JOIN lead l ON d.lead_id = l.id
  WHERE d.dealership_id = $dealer_id;

TOP 3 URGENT ACTIONS:
  Query 1: Uncontacted leads
    SELECT COUNT(*) FROM lead
    WHERE dealership_id = $dealer_id AND stage = 'new'
      AND created_at < NOW() - INTERVAL '2 hours'
      AND contact_sla_breached = false
      AND deleted_at IS NULL

  Query 2: Aged vehicles requiring attention
    SELECT COUNT(*) FROM vehicle
    WHERE dealership_id = $dealer_id AND status = 'available'
      AND days_on_lot IN (45, 60, 90) AND deleted_at IS NULL

  Query 3: Pending deal approvals
    SELECT COUNT(*) FROM deal
    WHERE dealership_id = $dealer_id AND status = 'pending_approval'
      AND deleted_at IS NULL

  Query 4: Follow-ups due today
    SELECT COUNT(*) FROM lead
    WHERE dealership_id = $dealer_id
      AND next_follow_up::date = CURRENT_DATE
      AND stage NOT IN ('closed', 'lost')
      AND deleted_at IS NULL

  PRIORITY ORDER (for selecting top 3):
    1. Pending deal approvals (most urgent — revenue at stake)
    2. Uncontacted leads > 2 hours (SLA breach)
    3. 90-day aged vehicles (critical)
    4. Follow-ups due today
    5. 60-day aged vehicles
    6. 45-day aged vehicles

MARKET SNAPSHOT (IMV changes for dealer's current inventory):
  SELECT
    ic.make, ic.model, ic.year,
    ic.p50 AS current_p50,
    ic.prev_p50,
    ic.pct_change_30d,
    ic.trend_direction,
    COUNT(v.id) AS dealer_stock_count
  FROM vehicle v
  JOIN imv_cluster ic ON ic.make = v.make AND ic.model = v.model
    AND ic.year = v.year AND ic.mileage_bucket = v.mileage_bucket
    AND ic.condition = v.condition
    AND ic.district = (SELECT district FROM dealership WHERE id = $dealer_id)
  WHERE v.dealership_id = $dealer_id AND v.status = 'available'
    AND ABS(ic.pct_change_30d) >= 3  -- only show meaningful changes
  GROUP BY ic.make, ic.model, ic.year, ic.p50, ic.prev_p50, ic.pct_change_30d, ic.trend_direction
  ORDER BY ABS(ic.pct_change_30d) DESC
  LIMIT 5;
```

### 7.2 Summary Content Assembly

```typescript
interface DailySummaryData {
  date: string;                          // "Monday, 15 January 2025"
  date_bangla?: string;                  // Bangla date if language = 'bn'

  yesterday: {
    units_sold: number;
    revenue_bdt: number;
    gross_profit_bdt: number;
    new_leads: number;
    leads_contacted: number;
    revenue_formatted: string;           // "BDT 28.5L" or "BDT 28,50,000"
  };

  urgent_actions: Array<{
    rank: number;                        // 1, 2, 3
    type: string;                        // 'uncontacted_leads' | 'aged_vehicle' | etc.
    count: number;
    message: string;                     // "3 leads uncontacted for 2+ hours"
    deep_link: string;
    urgency: 'critical' | 'high' | 'medium';
  }>;

  market_snapshot: Array<{
    make: string;
    model: string;
    year: number;
    pct_change_30d: number;
    trend_direction: 'up' | 'down' | 'stable';
    dealer_stock: number;
    implication: string;                 // "You have 3 in stock — consider pricing adjustment"
  }>;

  maestro_top_insight?: {               // highest priority unactioned insight
    type: string;
    title: string;
    one_line_summary: string;           // truncated to fit SMS
  };
}
```

### 7.3 Delivery Channels

```
IN-APP DELIVERY (full detail):
  Trigger: dealer opens app between 8:00 AM and 10:00 AM
  Rendering: Dashboard → Morning Briefing tab (default tab if unseen)
  Badge: "Today's Briefing" with dot indicator until viewed
  Content: full DailySummaryData rendered as cards
  Deep links: every action item has a tap-to-navigate link
  Dismissed: auto-dismissed after viewing OR after 10:00 AM (moves to Briefing History)

SMS DELIVERY (condensed, 160-char limit):
  Trigger: BullMQ job fires at 8:00 AM
  Target: dealer owner's phone (from dealership.phone)
  Only sent IF: notify_daily_summary_sms = true (dealer settings)

  FORMAT (160 chars max):
    "AutoVerse {date}: {units} sale(s), BDT {revenue_short}. Urgent: {top_action}.
     {market_note}. App: app.autoverse.com.bd"

  EXAMPLES:
    "AutoVerse 15 Jan: 2 sales, BDT 28.5L. Urgent: 3 leads uncontacted 2h+.
     Toyota Axio up 8%. App: app.autoverse.com.bd"

    "AutoVerse 15 Jan: 0 sales. Urgent: Vehicle SK-0012 at 90 days - action needed.
     App: app.autoverse.com.bd"

  Revenue format: BDT X.XL (lakh notation for BD readability)
    1,200,000 → "12L"
    2,850,000 → "28.5L"
    750,000   → "7.5L"

PUSH NOTIFICATION (brief):
  Trigger: 8:00 AM FCM push to all devices of dealer + manager
  Only sent IF: notify_daily_summary_push = true
  Title: "Good morning! Your AutoVerse Briefing"
  Body: "{units} sale(s) yesterday. {top_urgent_action_short}."
  Tap action: opens Dashboard → Morning Briefing tab

ZERO-PERFORMANCE HANDLING:
  If units_sold = 0 AND new_leads = 0 AND no urgent actions:
    SMS still sends (dealer expects it; absence would cause concern)
    Message: "AutoVerse {date}: Quiet day. {N} vehicles available.
              Market: {top_market_note}."
  Motivational note optional (A/B test in Phase 2): "Best dealers in Dhaka
    close 2 deals on average on days like this."
```

---

## 8. Automation Sequence Execution Engine

### 8.1 Rule Storage Format

```typescript
// automation_rule.actions JSONB structure:

// Single action (e.g., away message):
{
  "type": "send_whatsapp",
  "template": "away_message_default",
  "variables": {
    "dealer_name": "{{dealership.business_name}}",
    "business_hours": "{{dealership.business_hours_formatted}}",
    "return_time": "{{next_business_open_time}}"
  }
}

// Multi-step sequence (e.g., lead follow-up):
// Stored in automation_rule.sequence_steps JSONB:
[
  {
    "step": 1,
    "delay_hours": 0,
    "condition": "always",
    "channel": "whatsapp",
    "template": "lead_instant_reply",
    "include_vehicle_photo": true,
    "variables": {
      "contact_name": "{{lead.buyer_name}}",
      "salesperson_name": "{{lead.assignee.full_name}}",
      "dealer_name": "{{dealership.business_name}}",
      "vehicle_year": "{{lead.vehicle.year}}",
      "vehicle_make": "{{lead.vehicle.make}}",
      "vehicle_model": "{{lead.vehicle.model}}",
      "asking_price": "{{lead.vehicle.asking_price | format_bdt}}",
      "vehicle_link": "{{marketplace_listing.full_url}}"
    }
  },
  {
    "step": 2,
    "delay_hours": 24,
    "condition": "no_inbound_message_since_step_1",
    "channel": "whatsapp",
    "template": "lead_day1_followup",
    "variables": {
      "contact_name": "{{lead.buyer_name}}",
      "vehicle_make": "{{lead.vehicle.make}}",
      "vehicle_model": "{{lead.vehicle.model}}"
    }
  },
  {
    "step": 3,
    "delay_hours": 72,
    "condition": "no_inbound_message_since_step_1",
    "channel": "whatsapp",
    "template": "lead_day3_testdrive",
    "variables": {
      "contact_name": "{{lead.buyer_name}}",
      "vehicle_make": "{{lead.vehicle.make}}",
      "vehicle_model": "{{lead.vehicle.model}}"
    }
  },
  {
    "step": 4,
    "delay_hours": 168,
    "condition": "no_inbound_message_since_step_1 AND lead_priority != cold",
    "channel": "whatsapp",
    "template": "lead_day7_expires",
    "variables": {
      "contact_name": "{{lead.buyer_name}}",
      "vehicle_make": "{{lead.vehicle.make}}",
      "vehicle_model": "{{lead.vehicle.model}}"
    }
  }
]
```

### 8.2 Rule Evaluation Engine

```typescript
@Injectable()
export class AutomationRuleEngine {

  // Called on every trigger event
  async evaluate(
    triggerEvent: string,
    context: AutomationContext,
  ): Promise<void> {

    // 1. Find all matching active rules for this dealer + trigger
    const rules = await this.getMatchingRules(context.dealerId, triggerEvent);
    if (rules.length === 0) return;

    // 2. Check loop detection
    if (this.wouldCreateLoop(rules, context)) {
      this.logger.warn('Automation loop detected', { triggerEvent, dealerId: context.dealerId });
      return;
    }

    // 3. Execute each matching rule
    for (const rule of rules) {
      await this.executeRule(rule, context);
    }
  }

  private async executeRule(
    rule: AutomationRule,
    context: AutomationContext,
  ): Promise<void> {

    // Check rate limit before execution
    const withinLimit = await this.checkRateLimit(
      context.dealerId, rule.channel
    );
    if (!withinLimit) {
      await this.logRuleSkipped(rule, context, 'rate_limit_exceeded');
      return;
    }

    // Check opt-out status for contact
    if (context.contactId) {
      const optedOut = await this.checkOptOut(context.contactId, rule.channel);
      if (optedOut) {
        await this.logRuleSkipped(rule, context, 'contact_opted_out');
        return;
      }
    }

    // Check maximum messages per contact per day (anti-spam)
    const contactDailyCount = await this.getContactDailyMessageCount(
      context.dealerId, context.contactPhone, rule.channel
    );
    if (contactDailyCount >= 3) {
      await this.logRuleSkipped(rule, context, 'contact_daily_limit');
      return;
    }

    // Single action rule
    if (rule.actions && !rule.sequence_steps) {
      await this.dispatchAction(rule.actions, rule, context);
      return;
    }

    // Sequence rule: execute step 1, schedule remaining steps
    if (rule.sequence_steps) {
      await this.executeSequenceStep(rule, 1, context);
    }
  }

  private async executeSequenceStep(
    rule: AutomationRule,
    stepNumber: number,
    context: AutomationContext,
  ): Promise<void> {

    const steps = rule.sequence_steps as SequenceStep[];
    const step = steps.find(s => s.step === stepNumber);
    if (!step) return;  // no more steps

    // Evaluate step condition
    const conditionMet = await this.evaluateCondition(step.condition, context);
    if (!conditionMet) return;  // sequence cancelled

    // Execute this step's action
    if (step.delay_hours === 0) {
      // Immediate execution
      await this.dispatchAction(step, rule, context);
    } else {
      // Schedule with BullMQ delay
      await this.scheduleNextStep(rule.id, stepNumber, step.delay_hours, context);
    }

    // Schedule next step evaluation (for condition checking)
    const nextStep = steps.find(s => s.step === stepNumber + 1);
    if (nextStep) {
      await this.scheduleNextStep(rule.id, stepNumber + 1, nextStep.delay_hours, context);
    }
  }

  private async evaluateCondition(
    condition: string,
    context: AutomationContext,
  ): Promise<boolean> {

    // Parse and evaluate condition string
    const conditions = condition.split(' AND ');

    for (const cond of conditions) {
      const trimmed = cond.trim();

      switch (true) {
        case trimmed === 'always':
          continue;  // always true

        case trimmed === 'no_inbound_message_since_step_1':
          const hasReply = await this.checkInboundSinceSequenceStart(context);
          if (hasReply) return false;
          break;

        case trimmed === 'lead_priority != cold':
          const lead = await this.getLeadFromContext(context);
          if (lead?.priority === 'cold') return false;
          break;

        case trimmed === 'lead_stage_is_active':
          const activeLead = await this.getLeadFromContext(context);
          if (!activeLead || ['closed', 'lost'].includes(activeLead.stage)) return false;
          break;

        case trimmed.startsWith('dealer_plan >='):
          const requiredPlan = trimmed.replace('dealer_plan >= ', '');
          const dealer = await this.getDealerFromContext(context);
          if (!isPlanSufficient(dealer.subscription_tier, requiredPlan)) return false;
          break;

        default:
          this.logger.warn('Unknown condition', { condition: trimmed });
          return false;  // unknown condition → safe to not execute
      }
    }

    return true;
  }

  // Loop detection: max chain depth 3, circular reference check
  private wouldCreateLoop(rules: AutomationRule[], context: AutomationContext): boolean {
    if (context.chainDepth >= 3) return true;

    // Check if any rule triggers an event that would re-trigger the current event
    for (const rule of rules) {
      const triggeredEvents = this.getEventsEmittedByActions(rule.actions);
      if (triggeredEvents.some(e => e === context.triggerEvent)) {
        return true;  // circular: A triggers B which triggers A
      }
    }

    return false;
  }
}
```

### 8.3 Rate Limit Enforcement

```typescript
async checkRateLimit(
  dealerId: string,
  channel: AutomationChannel,
): Promise<boolean> {

  const today = new Date().toISOString().split('T')[0];  // YYYY-MM-DD
  const key = `rate:automation:${channel}:${dealerId}:${today}`;
  const limit = DAILY_LIMITS[channel];  // from plan config

  const current = await this.redis.incr(key);
  if (current === 1) {
    // First increment: set expiry to end of day
    await this.redis.expireat(key, getEndOfDayUnix());
  }

  if (current > limit) {
    // Alert dealer at 80% consumption
    if (current === Math.floor(limit * 0.8) + 1) {
      await this.notificationsService.notifyDealerRateLimitWarning(
        dealerId, channel, current, limit
      );
    }
    return false;  // limit exceeded
  }

  return true;
}

// Daily limits per channel (from plan_config.features):
const DAILY_LIMITS: Record<AutomationChannel, number> = {
  whatsapp:  1000,   // Meta WABA limit alignment
  facebook:  99999,  // Meta applies own limits
  instagram: 99999,
  sms:       500,    // Starter | 2000 Professional | 5000 Business
  email:     99999,  // Resend limits per domain
  push:      99999,  // FCM has no meaningful daily limit
};

// Contact-level anti-spam (across all channels combined):
async getContactDailyMessageCount(
  dealerId: string,
  contactPhone: string,
  channel: AutomationChannel,
): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const key = `rate:contact:${dealerId}:${contactPhone}:${today}`;
  const count = await this.redis.get(key);
  return parseInt(count || '0', 10);
}

// Increment on each sent message:
async incrementContactMessageCount(dealerId: string, contactPhone: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const key = `rate:contact:${dealerId}:${contactPhone}:${today}`;
  await this.redis.incr(key);
  await this.redis.expireat(key, getEndOfDayUnix());
}

// MAX 3 automated messages per contact per day across ALL channels
```

### 8.4 Template Variable Resolution

```typescript
// Template variables use double-curly syntax: {{path.to.value | filter}}

const VARIABLE_RESOLVERS: Record<string, (ctx: AutomationContext) => string> = {
  'lead.buyer_name':          (ctx) => ctx.lead?.buyer_name ?? 'there',
  'lead.assignee.full_name':  (ctx) => ctx.lead?.assignee?.full_name ?? 'our team',
  'lead.vehicle.year':        (ctx) => String(ctx.lead?.vehicle?.year ?? ''),
  'lead.vehicle.make':        (ctx) => ctx.lead?.vehicle?.make ?? '',
  'lead.vehicle.model':       (ctx) => ctx.lead?.vehicle?.model ?? '',
  'lead.vehicle.asking_price':(ctx) => formatBDT(ctx.lead?.vehicle?.asking_price),
  'marketplace_listing.full_url': (ctx) => buildListingUrl(ctx.listing),
  'dealership.business_name': (ctx) => ctx.dealer?.business_name ?? '',
  'dealership.business_hours_formatted': (ctx) => formatBusinessHours(ctx.dealer?.business_hours),
  'next_business_open_time':  (ctx) => getNextOpenTime(ctx.dealer?.business_hours),
  'personalized_link':        (ctx) => buildPersonalizedLink(ctx.lead?.id),
  'imv_market_note':          (ctx) => buildImvNote(ctx.lead?.vehicle, ctx.imvData),
};

// Filter functions:
// {{asking_price | format_bdt}} → "BDT 15,00,000" or "BDT 15L"
// {{full_name | first_name}} → "Mohammad"
// {{date | bd_date}} → "15 জানুয়ারি 2025"

function resolveTemplate(template: string, context: AutomationContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
    const [path, ...filters] = expression.trim().split('|').map(s => s.trim());
    const resolver = VARIABLE_RESOLVERS[path];
    let value = resolver ? resolver(context) : match;  // unresolved → keep original

    // Apply filters
    for (const filter of filters) {
      value = applyFilter(value, filter, context);
    }

    return value;
  });
}
```

---

## 9. Full Automation Map — All Channels

### 9.1 Master Trigger → Action Table

```
FORMAT: TRIGGER | CONDITION | ACTION | FALLBACK | CANCELLATION

─────────────────────────────────────────────────────────────────────────────────
CHANNEL: WHATSAPP
─────────────────────────────────────────────────────────────────────────────────

TRIGGER:  New message from unknown contact (first ever)
CONDITION: contact not in dealer's contact history
ACTION:   Send greeting message (dealer-configured template)
FALLBACK: No message sent if greeting not configured (do not use default)
CANCEL:   Never (one-time per contact)
RATE:     1 per contact lifetime

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  Message received outside business hours
CONDITION: current_time NOT in business_hours AND away_message_enabled = true
ACTION:   Send away message with hours and return time
FALLBACK: No message (if away_message not configured)
CANCEL:   Never; rate limit: 1 per contact per 6-hour window
RATE:     1 per 6h per contact

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  lead.created (source IN marketplace, dealer_website, facebook_lead_ad, whatsapp)
CONDITION: Advanced tier (Professional+) AND whatsapp_api_connected
ACTION:   Day 0: instant reply + vehicle photo + price + personalized link
          Day 1: (if no reply) "Still interested in the {vehicle}?"
          Day 3: (if no reply) "Can I arrange a test drive?"
          Day 7: (if no reply AND lead not cold) "Another buyer interested..."
FALLBACK: If WABA not connected → log that automation was skipped;
          push notification to salesperson to reply manually
CANCEL:   Any inbound message from buyer (salesperson takes over)
          Lead stage moves to test_drive, negotiation, closed, lost
          Salesperson manually cancels from Lead Card
RATE:     1,000 WhatsApp msgs/day/dealer; 3 per contact per day

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  lead.stale_7d (no stage change AND no interaction for 7 days)
CONDITION: lead.stage NOT IN ('closed', 'lost')
           AND NOT EXISTS recent_outbound_message
ACTION:   Send abandoned lead recovery message
          (includes imv_market_note if vehicle price was reduced since enquiry)
FALLBACK: Push notification to salesperson to manually contact
CANCEL:   Any inbound from buyer; lead moved to closed/lost
RATE:     1 recovery message per lead (not repeating)

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  deal.delivered
CONDITION: deal.status = 'delivered' AND post_sale_sequence_enabled
ACTION:   Day 3:   "How are you enjoying your new {car}?"
          Day 30:  "First service is due. Book here: {link}"
          Day 180: 6-month check-in
          Day 365: Annual service + new inventory alert
FALLBACK: Log skipped; remind dealer to set up sequence in Maestro AUTOMATION insight
CANCEL:   Customer replies STOP (opt-out); customer opts out via app
RATE:     Sequence runs once per deal (not repeating)

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  vehicle.available (vehicle published to marketplace)
CONDITION: customers with opted_in_inventory_alerts = true
           AND preferred_make matches OR preferred_body_type matches
           AND preferred_budget_max >= asking_price × 0.9
ACTION:   "New arrival: {year} {make} {model} — BDT {price}. {deeplink}"
FALLBACK: No alert if no matching opted-in customers
CANCEL:   Vehicle status changes back (reserved, hidden)
RATE:     Max 2 inventory alerts per customer per 7 days

─────────────────────────────────────────────────────────────────────────────────
CHANNEL: FACEBOOK / INSTAGRAM
─────────────────────────────────────────────────────────────────────────────────

TRIGGER:  First Facebook Page or Instagram DM message from new contact
CONDITION: fb_page_connected AND fb_inbox_reply_enabled
ACTION:   Inbox auto-reply + dealer website URL
FALLBACK: No reply if FB page not connected; log in automation_log as skipped
CANCEL:   Never (one-time per contact)
RATE:     1 per contact (Meta's own deduplication handles repeat first messages)

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  Facebook message received outside business hours
CONDITION: facebook_away_enabled = true AND current_time outside business_hours
ACTION:   Facebook-specific away message (may differ from WhatsApp away)
FALLBACK: No message if not configured
RATE:     1 per 6h per contact

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  Facebook/Instagram message body contains keyword
CONDITION: keyword_triggers configured by dealer (e.g., "price", "available")
ACTION:   Send mapped template response for that keyword
FALLBACK: If no keyword rule matches: standard greeting (if first msg) or no reply
CANCEL:   Not applicable (each message evaluated independently)
RATE:     1 keyword reply per message (not cumulative)

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  Facebook Lead Ad form submitted (webhook received)
CONDITION: fb_lead_ads_connected (Professional+ plan)
ACTION:   1. Create lead in Dealer OS CRM (source = facebook_lead_ad)
          2. Assign to salesperson (round-robin or default)
          3. Fire WhatsApp Day 0 automation (if WABA connected)
          4. Push notification to salesperson
          5. Log in lead_interaction: source = facebook_lead_ad
FALLBACK: If webhook processing fails: retry 3× (BullMQ)
          If all retries fail: admin alert; manual recovery from FB Leads Center
SLA:      Lead in CRM within 90 seconds of webhook receipt
RATE:     N/A (not a rate-limited action; each lead is unique)

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  vehicle.available AND auto_post_social = true
CONDITION: post_approval_required = false (auto-publish) OR draft created for approval
           AND NOT (3 auto-posts already sent today for this dealer)
           AND NOT (this vehicle posted in last 7 days)
ACTION:   Create social_post_queue record:
            platform = facebook + instagram
            caption = generated from template (body_type + dealer branding)
            image = vehicle primary photo
            scheduled_at = optimal_post_time (from dealer settings)
          If auto_publish: BullMQ job delayed to scheduled_at → publish
          If approval_required: record status = 'pending_approval'; notify manager
FALLBACK: If publish fails: status = 'failed'; dealer notified; manual re-publish option
CANCEL:   Vehicle status changes before scheduled_at → cancel job
RATE:     3 auto-posts per dealer per day; 1 post per vehicle per 7 days

─────────────────────────────────────────────────────────────────────────────────
CHANNEL: EMAIL
─────────────────────────────────────────────────────────────────────────────────

TRIGGER:  lead.created
CONDITION: lead.buyer_email IS NOT NULL
ACTION:   Email 1 (immediate): enquiry confirmation + vehicle card + 2 similar vehicles
          Email 2 (Day 2, no interaction): finance options
          Email 3 (Day 5, no interaction): expiring offer
FALLBACK: Skip if no email address; log in automation_log as skipped
CANCEL:   Lead closed, lead lost, buyer unsubscribes (Resend webhook → opt-out flag)
RATE:     Unlimited (Resend; 3 per contact per sequence max)

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  deal.delivered
CONDITION: customer.email IS NOT NULL
ACTION:   Email 1 (Day 1): delivery confirmation + care guide PDF
          Email 2 (Day 30): first service reminder
          Email 3 (Day 365): annual check-in + new inventory
FALLBACK: Skip if no email; log as skipped
CANCEL:   Customer unsubscribes

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  lead marked lost AND 30 days have elapsed since lost date
CONDITION: lead.stage = 'lost' AND lead.lost_reason != 'unsubscribed'
           AND lead.buyer_email IS NOT NULL
ACTION:   Win-back email: "Still looking? New arrivals in your budget."
          Content: personalized inventory matching lost lead's preferences
FALLBACK: If no email: send win-back WhatsApp instead (same delay)
CANCEL:   Customer creates new lead (already back); customer unsubscribes
RATE:     1 win-back per lead (non-repeating)

─────────────────────────────────────────────────────────────────────────────────
CHANNEL: SMS
─────────────────────────────────────────────────────────────────────────────────

TRIGGER:  crm.lead.hot (score crosses 70)
CONDITION: lead.assigned_to.phone IS NOT NULL
ACTION:   Immediate SMS to SALESPERSON (not buyer):
          "🔥 HOT LEAD: {name} scored {score}/100 for {vehicle}. Call: {phone}"
FALLBACK: Push notification (FCM) if SMS fails
SLA:      < 60 seconds from score threshold crossing
RATE:     1 per lead per hot-threshold crossing (not per score point above 70)

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  lead.created AND contact_sla_breach_timer starts
CONDITION: BullMQ job fires at +2 hours from lead.created_at
           AND lead.stage = 'new' (still uncontacted)
ACTION:   SMS to MANAGER:
          "{buyer_name} lead uncontacted 2h. Vehicle: {make} {model}.
           Assigned to: {salesperson_name}. App: {deeplink}"
FALLBACK: In-app notification + WebSocket alert (always sent regardless)
RATE:     1 per lead (not repeating)

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  dealer.subscription.expiry_reminder (subscription expires in 7 days)
CONDITION: auto_renew = true AND payment_method_on_file
ACTION:   SMS to OWNER: "Your AutoVerse subscription renews in 7 days.
           Ensure bKash balance is sufficient."
RATE:     3 SMSes total: day -7, day -3, day 0

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  vehicle.aging (days_on_lot = 45)
CONDITION: notify_aging_sms = true
ACTION:   SMS to MANAGER: "{stock_no} [{year} {make} {model}] 45 days on lot.
           Market: BDT {imv_p50:,}. Asking: BDT {asking_price:,}."
RATE:     Once at 45-day threshold

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  vehicle.aging (days_on_lot = 60)
CONDITION: notify_aging_sms = true
ACTION:   SMS to OWNER AND MANAGER: "{stock_no} at 60 days. Reduce BDT {reduction:,}
           to enter 'Good Deal'. App: {deeplink}"
RATE:     Once at 60-day threshold

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  vehicle.aging (days_on_lot >= 90)
CONDITION: disposition NOT recorded yet
ACTION:   DAILY SMS to OWNER until disposition recorded:
          "URGENT: {stock_no} at {days} days. Select action in app: {deeplink}"
CANCEL:   Disposition recorded (reduce_price | auction | wholesale | retain)

─────────────────────────────────────────────────────────────────────────────────
TRIGGER:  payments.invoice.payment_failed (billing attempt failed)
ACTION:   SMS to OWNER: "AutoVerse payment failed for {month} subscription.
           Update payment method: {link}. Grace period: {days} days."
SCHEDULE: Day 0, Day +3, Day +7 (grace period end), Day +14

─────────────────────────────────────────────────────────────────────────────────
CHANNEL: PUSH (FCM)
─────────────────────────────────────────────────────────────────────────────────

TRIGGER:  crm.lead.created
ACTION:   Push to assigned salesperson device(s)
          Title: "New Lead"
          Body: "{buyer_name} is interested in {make} {model}"
          Deep link: /crm/leads/{lead_id}
RATE:     1 per lead creation

TRIGGER:  crm.lead.hot
ACTION:   Push to assigned salesperson (redundant with SMS — belt-and-suspenders)
          Title: "🔥 Hot Lead Alert"
          Body: "{buyer_name} — {vehicle}. Call now!"
          Deep link: /crm/leads/{lead_id}
          Priority: HIGH (FCM high priority — wakes screen even in Do Not Disturb)

TRIGGER:  sales.deal.approval_needed
ACTION:   Push to MANAGER and OWNER
          Title: "Deal Approval Needed"
          Body: "{salesperson_name} — {vehicle} — BDT {discount:,} discount requested"
          Deep link: /deals/{deal_id}?action=approve

TRIGGER:  daily-summary (8:00 AM)
ACTION:   Push to OWNER and MANAGER
          Title: "Good morning! Your AutoVerse Briefing"
          Body: "{N} sale(s) yesterday. {top_action_short}."
          Deep link: /dashboard?tab=morning_briefing

TRIGGER:  automation_log.status = 'failed' AND retry_count >= 3
ACTION:   Push to OWNER and MANAGER (automation failure alert)
          Title: "Automation Message Failed"
          Body: "{channel} message to {contact_name} failed after 3 attempts."
          Deep link: /automation/logs?filter=failed
```

---

## 10. Automation Failure Handling & Fallbacks

### 10.1 Per-Channel Failure Modes & Recovery

```
WHATSAPP API FAILURES:
  error: message_undeliverable (number not on WhatsApp)
    → Log as failed (automation_log.status = 'failed')
    → Fall back to SMS (if contact has phone AND opted_in_sms)
    → If SMS also fails: push notification to salesperson to contact manually

  error: rate_limit_exceeded (Meta WABA 1,000/day/number)
    → Job moved to next-day queue automatically (delay 24h)
    → Dealer notified: "WhatsApp daily limit reached. Messages queued for tomorrow."
    → Do NOT retry same-day (would keep failing)

  error: invalid_phone_format
    → Log as permanently failed; do not retry
    → Notify salesperson: "WhatsApp message could not be sent — invalid number"

  error: token_expired (WABA access token)
    → Attempt token refresh immediately
    → If refresh succeeds: retry original job
    → If refresh fails: disable WABA for this dealer; push notification to owner:
      "WhatsApp automation disconnected. Reconnect in Channel Connections."
    → All pending WhatsApp jobs paused until reconnected (not deleted)

FACEBOOK API FAILURES:
  error: user_access_token_invalid
    → Same as WABA token_expired: refresh → retry → disable → notify

  error: page_not_found
    → Dealer's Facebook Page disconnected or deleted
    → Disable all Facebook automation
    → Owner notified with setup instructions

  error: spam_rate_limit (Meta throttling)
    → Exponential backoff; BullMQ retry config applies (10s, 100s, 1000s)
    → After 3 retries: log as failed; skip message (non-critical automation)

SMS FAILURES (Greenweb BD):
  error: network_unreachable (BD gateway timeout ~15% peak hours)
    → Retry after 1 minute (BullMQ: fixed 60s delay)
    → Retry after 5 minutes
    → After 2 retries: log status = 'failed'; fallback:
      Push notification to recipient if FCM token available

  error: do_not_disturb (BD carrier DND registry)
    → Log as opted_out; update sms_log.status = 'opted_out'
    → Remove from future SMS campaigns
    → Fall back to WhatsApp if available

  error: invalid_number
    → Log permanently failed; no retry

EMAIL FAILURES (Resend):
  bounce: hard bounce (invalid email address)
    → Update customer.email → null (to prevent future sends)
    → Log in automation_log
    → Remove from all email sequences

  bounce: soft bounce (mailbox full, server temporarily unavailable)
    → Resend automatically retries (their infrastructure handles this)
    → After 3 Resend retries: log as failed in our system

  unsubscribe: Resend webhook → unsubscribed event
    → Update customer.opted_in_email = false
    → Remove from all active email sequences

GLOBAL AUTOMATION FAILURE STRATEGY:
  CRITICAL path (hot lead SMS, SLA breach): 3 retries + fallback channel
  IMPORTANT path (lead sequences, post-sale): 3 retries, then log + manual alert
  ROUTINE path (inventory alerts, social posts): 2 retries, then log, no alert
  BEST-EFFORT path (email sequences): 1 retry, then log silently
```

### 10.2 Eid & Festival Mode

```
BD PUBLIC HOLIDAYS + EID PERIODS:
  Pre-loaded in platform_calendar table:
    { date, name, type: 'eid_ul_fitr' | 'eid_ul_adha' | 'public_holiday', country: 'BD' }
  Maintained manually by AutoVerse admin; updated annually in advance.

FESTIVAL MODE BEHAVIOUR (automatic, applies to all dealers):

  SUPPRESSED (paused during festival):
    → Non-critical lead follow-up sequences (Day 2, Day 3 messages — not Day 0)
    → Aging vehicle alerts (Tier 1, Tier 2 only — Tier 3/4 continue)
    → Social media scheduled posts (queued for day after festival)
    → Win-back email/WhatsApp campaigns
    → Operational expense recurring reminders

  NEVER SUPPRESSED (always run):
    → Lead Day 0 instant reply (buyer expects immediate response)
    → Hot lead SMS (crm.lead.hot)
    → Deal delivery confirmation
    → SLA breach alerts (contact_sla_2h)
    → Payment failure SMS
    → Inventory alerts (buyers are ACTIVELY LOOKING pre-Eid)
    → Daily summary (owner still wants their morning briefing)

  EID-SPECIFIC ENHANCEMENTS:
    New inventory alert: frequency cap increased from 2/7 days to 3/7 days
    (buyer purchase intent is highest in the 2 weeks before Eid)
    Social posts: priority queue for pre-Eid inventory (optimal posting times shift)

  DEALER OVERRIDE:
    Settings → Automation → Festival Mode → Manual toggle
    Dealer can disable festival suppression if they want full automation to run
    (Some dealers specifically want to run Eid promotions — valid use case)
```

### 10.3 Automation Audit & Compliance

```
COMPLIANCE REQUIREMENTS (BD market):

OPT-OUT MANDATORY:
  Every SMS campaign must include: "Reply STOP to unsubscribe"
  Auto-appended if not present in template (system-enforced)
  STOP reply → contact.opted_in_sms = false (permanent until re-opt-in)
  opted_in_sms = false → excluded from ALL future SMS automation

WHATSAPP GDPR-EQUIVALENT:
  BD does not have formal GDPR but following WhatsApp Business Policy:
  Only message contacts who have initiated conversation OR opted in explicitly
  STOP/unsubscribe → automation_blacklist entry for that contact+dealer

DATA RETENTION:
  automation_log: 90 days (configurable; regulatory requirement)
  After 90 days: BullMQ cron deletes logs older than 90 days
  Deletion: soft deletion first (deleted_at), hard delete after 7 additional days

RATE LIMIT COMPLIANCE REPORTING:
  Monthly automation summary (for dealer):
    Total messages sent per channel
    Delivery rate per channel
    Opt-out count per channel
    Response rate per channel
    Estimated leads converted from automation vs manual
  Surfaced in Analytics → Automation Performance tab
  Also included in Maestro AUTOMATION insight if metrics are below benchmark
```

---

*AutoVerse — Step 5: AI + Automation Engine (Maestro)*
*IMV Algorithm · Lead Scoring · Insight Engine · Automation Execution*
*Built against Blueprint v7.0*
