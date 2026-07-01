# AutoVerse — Step 2: Dual Engine + Sync Architecture
### Full System Design · v1.0

> This document is the complete technical specification for every system that runs inside AutoVerse. It covers all five Dealer OS modules, the three Admin modules, the Website Builder, the Marketplace Engine, and the Sync Engine — with full workflows, state machines, event contracts, conflict resolution rules, and SLAs.

---

## Table of Contents

1. [Dealer OS — Module 1: Inventory Management](#1-dealer-os--module-1-inventory-management)
2. [Dealer OS — Module 2: Sales & F&I + CRM](#2-dealer-os--module-2-sales--fi--crm)
3. [Dealer OS — Module 3: Analytics — Maestro AI Engine](#3-dealer-os--module-3-analytics--maestro-ai-engine)
4. [Dealer OS — Module 4: Automation Hub](#4-dealer-os--module-4-automation-hub)
5. [Dealer OS — Module 5: System & Team Management](#5-dealer-os--module-5-system--team-management)
6. [Admin Modules](#6-admin-modules)
7. [Website Builder Architecture](#7-website-builder-architecture)
8. [Marketplace Engine](#8-marketplace-engine)
9. [Sync Engine](#9-sync-engine)

---

## 1. Dealer OS — Module 1: Inventory Management

### 1.1 Vehicle Acquisition Entry Points

A vehicle enters the Dealer OS through one of three paths:

```
PATH A: VIN SCAN (primary — mobile)
  Camera opens → barcode detected OR 17-char manual input
  → VIN validation (check digit algorithm)
  → NHTSA vPIC API call (primary decoder)
  → Local BD supplement database lookup (secondary)
  → Stock card form pre-populated
  → Dealer completes: acquisition_cost, mileage, color, condition, price
  → Photos captured (minimum 4)
  → Save → vehicle record created

PATH B: MANUAL ENTRY (fallback — older/import vehicles)
  Dealer taps "Manual Entry" on stock card form
  → All fields empty, sequential form
  → Same completion requirements as Path A

PATH C: BULK IMPORT (Business/Enterprise plan — CSV upload)
  Template CSV downloaded from Settings → Inventory → Import
  Dealer fills: vin, make, model, year, mileage, asking_price, acquisition_cost, color, condition
  Uploaded → validation job runs → errors flagged row-by-row
  Valid rows → vehicle records created in batch
  Import summary shown: X created, Y errors (with reasons)
```

---

### 1.2 VIN Decoder — Full Flow with Error Handling

```
INPUT: 17-character VIN string

STEP 1 — Format Validation
  Length check: must be exactly 17 characters
  Character set: A-Z (no I, O, Q) and 0-9
  Check digit: position 9 calculated via NHTSA algorithm
  FAIL → inline error: "Invalid VIN. Check characters 1, 3, 9."
  PASS → continue

STEP 2 — Primary Decode (NHTSA vPIC API)
  GET https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{vin}?format=json
  Timeout: 8 seconds
  Expected fields extracted:
    Make, Model, ModelYear, BodyClass, EngineCC,
    TransmissionStyle, FuelTypePrimary, DriveType, Trim
  SUCCESS → map to vehicle record fields → pre-populate form
  TIMEOUT/ERROR → fall through to Step 3

STEP 3 — BD Supplement Lookup (local database)
  Query: SELECT * FROM vehicle_reference WHERE vin_prefix = LEFT(vin, 9)
  BD-specific data includes:
    - Japanese import variants (Toyota, Honda, Nissan reconditioned models)
    - Common BD registration patterns
    - Model-year mapping corrections for Japanese domestic market (JDM) vehicles
  HIT → merge with NHTSA data (supplement fills gaps)
  MISS → form pre-populated with whatever NHTSA returned

STEP 4 — Partial Decode Handling
  If NHTSA returns < 3 core fields (make/model/year):
    → Show inline notice: "VIN partially decoded. Please verify specs."
    → Pre-populate what was found; leave blanks empty with red required markers
    → Dealer completes manually

STEP 5 — Duplicate VIN Check
  Query: SELECT id FROM vehicles WHERE vin = $1 AND dealership_id = $2
  DUPLICATE FOUND → "This VIN already exists in your inventory: [stock_no].
    View existing vehicle?" → deeplink to existing stock card
  NOT FOUND → continue to form

NHTSA API FALLBACK STRATEGY:
  Primary: https://vpic.nhtsa.dot.gov/api/ (real-time)
  Cache:   Redis TTL 90 days per VIN (decoded once, cached)
  Offline: If both fail → full manual entry with "VIN lookup unavailable" notice
```

---

### 1.3 Photo Upload Pipeline

```
MOBILE CAPTURE FLOW:
  Camera opens directly (no gallery-first UX — reduces friction)
  Each photo taken → immediately compressed:
    Sharp: resize to max 1200px wide, WebP conversion, quality 82
    Max output size: 150KB per image
  Photo thumbnail rendered in upload tray
  Drag-to-reorder: sort_order updated locally
  Primary photo: tap star icon on any photo → is_primary = true

UPLOAD TRIGGERS:
  Option A: Upload-as-you-go (default)
    Each photo uploaded immediately after capture
    Progress indicator per photo (not total batch)
  Option B: Upload all on save
    Photos queued locally, batch-uploaded on form submit
    Required for poor connectivity scenarios

REQUIREMENTS ENFORCEMENT:
  Minimum 4 photos required before "Publish to Marketplace" is available
  Maximum 30 photos per vehicle
  "Save as Draft" available with 0 photos (vehicle stays in acquired/in_recon status)

R2 STORAGE STRUCTURE:
  Original (post-compression): media.autoverse.com.bd/vehicles/{dealership_id}/{vehicle_id}/{uuid}.webp
  Thumbnail (240px):           media.autoverse.com.bd/vehicles/{dealership_id}/{vehicle_id}/{uuid}_thumb.webp

PHOTOS JSONB FIELD STRUCTURE:
  [
    {
      "url": "https://media.autoverse.com.bd/vehicles/.../abc.webp",
      "thumb_url": "https://media.autoverse.com.bd/vehicles/.../abc_thumb.webp",
      "sort_order": 1,
      "is_primary": true,
      "captured_at": "2025-01-15T10:30:00Z"
    },
    ...
  ]
```

---

### 1.4 Vehicle Status State Machine

```
STATES:
  acquired     → Vehicle purchased, not yet assessed for recon
  in_recon     → Recon assessment created; work underway
  available    → Recon complete; listed for sale
  reserved     → Deal in progress; removed from available pool
  sold         → Deal delivered; revenue recognized
  scrapped     → Vehicle written off; no sale

VALID TRANSITIONS:
  acquired    → in_recon     (recon assessment created by manager/owner)
  acquired    → available    (no recon needed; skip directly)
  in_recon    → available    (all recon tasks marked complete)
  available   → reserved     (deal created and linked to vehicle)
  available   → in_recon     (additional recon required; send back)
  available   → scrapped     (owner/manager decision; reason required)
  reserved    → available    (deal voided; vehicle back to pool)
  reserved    → sold         (deal status = delivered)
  sold        → [terminal]   (no transitions out of sold)
  scrapped    → [terminal]   (no transitions out of scrapped)

FORBIDDEN TRANSITIONS (enforced at API level):
  available → acquired        (cannot go backward past recon)
  sold → any state            (sold is immutable for accounting)
  scrapped → any state        (scrapped is immutable)

TRANSITION LOGGING:
  Every transition writes to vehicle_status_history:
    vehicle_id, from_status, to_status, changed_by (user_id), reason (optional), timestamp

SIDE EFFECTS PER TRANSITION:
  acquired → in_recon:
    → Recon assessment record created
    → Notification to assigned technician (SMS if configured)

  in_recon → available:
    → recon_total computed from vehicle_expenses (Type 1) for this vehicle
    → net_profit_estimate computed: asking_price - acquisition_cost - recon_total
    → available_at = NOW()
    → Sync trigger: sync_vehicle.recon_complete → marketplace publish (if marketplace_published = true)
    → Aging watchlist timer starts from available_at

  available → reserved:
    → Deal record linked to vehicle_id
    → marketplace_listing status → reserved (badge shown on marketplace)
    → Dealer website ISR revalidated

  reserved → sold:
    → sold_at = NOW()
    → marketplace_listing status → sold (shown 7 days with "Sold" badge, then archived)
    → Fan-out: GMC feed item removed, Facebook catalog updated
    → Post-sale automation sequence begins (if configured)

  reserved → available (deal voided):
    → marketplace_listing status → active (restored)
    → Dealer notified: "Vehicle SK-001 is available again (deal voided)."
```

---

### 1.5 Recon Workflow — Full Detail

```
RECON ASSESSMENT CREATION:
  Triggered when vehicle transitions to in_recon
  Creates one recon_assessments record per vehicle

ASSESSMENT CHECKLIST (8 categories, each item: ok / needs_work / critical):
  engine       → oil condition, belts, coolant, unusual sounds
  body         → dents, rust, panel alignment, frame damage
  paint        → scratches, resprays, colour consistency
  interior     → seats, dashboard, carpet, headliner
  electricals  → all lights, windows, locks, infotainment
  tyres        → tread depth, brand consistency, spare condition
  ac           → cooling performance, compressor condition
  brakes       → pad thickness, rotor condition, brake fluid

RECON TASK CREATION:
  For each item marked needs_work or critical:
    dealer creates recon_task record:
      description     → free text
      assigned_to     → technician (users with role = technician, if configured)
                          OR external vendor name (free text)
      estimated_cost  → BDT amount
      actual_cost     → filled on completion
      status          → pending / in_progress / complete
      notes           → optional

TASK COMPLETION FLOW:
  Technician (or manager) marks task complete
  → actual_cost entered (can differ from estimate)
  → vehicle_expense record auto-created (Type 1):
      category_id → mapped from recon task type
      amount      → actual_cost
      vendor      → assigned_to
      date        → completion date
  → profit calculator updates live for owner/manager
  → recon_total recomputed on vehicle record

ALL TASKS COMPLETE CHECK:
  BullMQ job evaluates after each task completion:
    SELECT COUNT(*) FROM recon_tasks
    WHERE vehicle_id = $1 AND status != 'complete'
  IF count = 0:
    → vehicle eligible for available status
    → Manager/Owner receives notification: "Recon complete on SK-001.
      Ready to price and publish."
    → Maestro pricing suggestion generated (see Section 3.3)
```

---

### 1.6 Aging Watchlist — Full Alert Logic

```
WATCHLIST COMPUTATION:
  BullMQ cron: daily at 6:00 AM
  Query:
    SELECT v.*, EXTRACT(DAY FROM NOW() - v.available_at) as days_on_lot
    FROM vehicles v
    WHERE v.status = 'available'
      AND v.dealership_id = $1
    ORDER BY days_on_lot DESC

ALERT TIERS:
  30 days (Yellow):
    → Flag added to stock card UI (yellow indicator)
    → Vehicle appears in "Aging Watchlist" dashboard widget
    → No external notification (informational only)

  45 days (Orange):
    → Orange flag on stock card
    → SMS to manager: "SK-001 [2018 Toyota Axio] has been on lot 45 days.
      Consider repricing."
    → Daily gross profit erosion estimate shown:
        erosion_per_day = (asking_price × opportunity_cost_rate) / 30
        where opportunity_cost_rate = 1.5% per month (configurable in Settings)

  60 days (Red):
    → Red flag on stock card
    → SMS to owner: "SK-001 is on lot 60 days. Market data suggests
      reducing BDT X to enter 'Good Deal' rating."
    → Maestro PRICING insight generated (see Section 3.2)
    → Price reduction suggestion: IMV_p50 × 0.93 (enter Good Deal territory)

  90 days (Critical):
    → Double red flag
    → SMS + in-app to owner: "SK-001 at 90 days. Action required:
      Reduce price / Send to auction / Wholesale."
    → Owner must select one of three dispositions from a mandatory dialog
    → Until disposition recorded: vehicle shows CRITICAL tag on every stock list view
    → Dispositions: reduce_price / auction / wholesale / retain_with_reason

DASHBOARD WIDGET:
  Shows: stock_no | make/model/year | days_on_lot | asking_price
         | IMV_p50 | price_gap (asking - p50) | daily_erosion_BDT
  Sorted: days_on_lot descending
  Quick action: "Reprice" button → opens price edit inline
```

---

## 2. Dealer OS — Module 2: Sales & F&I + CRM

### 2.1 CRM Lead Pipeline — Full State Machine

```
STAGES (in order):
  new → contacted → qualified → test_drive → quote_sent → negotiation → closed → lost

STAGE: new
  Entry conditions:
    → Marketplace enquiry submitted (automatic)
    → Dealer website enquiry (automatic)
    → Facebook Lead Ad submitted (automatic via webhook)
    → Manual entry by salesperson (walk-in, phone call, referral)
  Auto-actions on entry:
    → Assign to salesperson (round-robin OR manual assignment by manager)
    → 2-hour contact SLA timer starts (BullMQ delayed job)
    → Push notification to assigned salesperson
    → Socket.io event to dealer dashboard (new lead badge)
  2-hour SLA breach:
    → SMS to manager: "Lead [buyer_name] uncontacted for 2h. Assign now."
    → Lead gets ⚠️ flag in pipeline
    → Morning briefing includes it in "Urgent: Uncontacted Leads"

STAGE: contacted
  Entry condition: salesperson logs first interaction (call, WhatsApp, in-person)
  Auto-actions:
    → 2-hour SLA timer cleared
    → Default next_follow_up set = NOW() + 24 hours
    → BullMQ follow-up reminder job scheduled for next_follow_up timestamp
  Outbound from this stage:
    → No response after 24h → salesperson receives push reminder
    → No response after 72h → WhatsApp automation day-3 fires (Advanced tier)
    → No response after 7 days → lead auto-moves to cold priority (not lost stage)

STAGE: qualified
  Entry condition: budget_min/budget_max AND vehicle_id set by salesperson
  Auto-actions:
    → Lead score recalculated (budget confirmation = +10 pts)
    → next_follow_up default = NOW() + 48 hours
  Required fields: budget_min, budget_max, vehicle_id (at least one vehicle of interest)

STAGE: test_drive
  Entry condition: test drive scheduled or completed
  Auto-actions:
    → If scheduled (future date): auto-SMS to customer 24h before:
      "Reminder: Test drive at [dealer address] tomorrow, [date] at [time].
       Directions: [Google Maps link]"
    → 2-hour before: SMS to salesperson: "Test drive with [buyer_name] in 2 hours."
  Required fields: test_drive_scheduled_at (datetime)

STAGE: quote_sent
  Entry condition: formal quote/deal sheet sent to buyer
  Auto-actions:
    → 3-day follow-up BullMQ job created
    → Day 3 no-response: push to salesperson + optional WhatsApp template
  Required fields: quote_amount (sale price proposed)

STAGE: negotiation
  Entry condition: buyer counter-offer or active price discussion underway
  Auto-actions:
    → If discount requested > dealer's discount_threshold (set in Settings):
      Push to manager: "Deal on SK-001 needs approval. Salesperson requesting
      BDT X discount."
    → Manager action required (approve/reject) to proceed

STAGE: closed
  Entry condition: Deal Record created and linked to lead
  Auto-actions:
    → vehicle_id → status: reserved
    → marketplace_listing → status: reserved
    → lead.priority → closed (removed from active pipeline)
    → Salesperson commission trigger (if commission tracking enabled)

STAGE: lost
  Entry condition: manual movement by salesperson or manager
  MANDATORY: lost_reason selected from dropdown
  Lost reason options (configurable, defaults):
    price_too_high | found_elsewhere | changed_mind | no_budget |
    no_response_after_7_days | bought_different_vehicle | financing_failed |
    vehicle_sold_to_other_buyer | quality_concern | other
  Auto-actions:
    → Vehicle unreserved (if was reserved)
    → Lead score set to 0
    → 30-day win-back BullMQ job created:
      After 30 days, send win-back email/WhatsApp: "Still looking? We have
      [N] new arrivals in your budget range."
    → Lost reason aggregated for Maestro CONVERSION insight
```

---

### 2.2 Lead Deduplication & Merge Logic

```
DEDUPLICATION TRIGGER:
  Runs on every new lead creation
  Check: does a lead with same buyer_phone already exist for this dealership?

SCENARIOS:
  A. Same phone, same vehicle_id, stage = new:
     → Suppress duplicate (merge enquiries, increment enquiry_count on existing lead)
     → Notify salesperson: "Duplicate enquiry merged for [name]."

  B. Same phone, different vehicle_id:
     → Create new lead record
     → Link both leads to same customer record (or create if new customer)
     → Customer profile shows both vehicle interests

  C. Same phone, existing lead in closed/lost:
     → Create fresh lead (previous closed/lost preserved in history)
     → Note on new lead: "Previous enquiry: [date], [outcome]"
     → Lead score starts with history bonus: +5 for returning enquirer

CUSTOMER RECORD CREATION:
  Customer record created when:
    → Lead's buyer_phone first seen across any lead at this dealership
    OR
    → Deal is completed (definitive customer creation)
  Customer record stores:
    name, phone, email (optional), district, preferred_makes, preferred_budget_range
    purchase_history (linked deals), enquiry_history (linked leads)
```

---

### 2.3 Deal Record — Full Lifecycle

```
DEAL CREATION:
  Triggered from Lead Card → "Convert to Deal" button
  Pre-conditions:
    → Lead must be in negotiation or quote_sent stage
    → vehicle_id must be set on lead
    → manager approval may be required (depends on discount threshold)

DEAL STATUS STATE MACHINE:
  draft → pending_approval → approved → delivered → cancelled

TRANSITIONS:
  draft → pending_approval:
    If sale_price < vehicle.asking_price × (1 - discount_threshold%):
      Manager must approve
    Else: auto-move to approved

  pending_approval → approved:
    Manager taps "Approve" in Deal Record
    → manager_approval_id recorded
    → Timestamp recorded
    → Salesperson notified

  pending_approval → draft (rejected):
    Manager taps "Reject" with reason
    → Salesperson notified to revise terms
    → Deal back to draft for editing

  approved → delivered:
    Salesperson/manager marks as delivered
    → delivered_at = NOW()
    → vehicle.status → sold
    → vehicle.sold_at = NOW()
    → gross_profit computed and stored:
        gross_profit = sale_price - vehicle.acquisition_cost
                       - vehicle.recon_total
                       - deal-level expenses
    → Post-sale automation sequence initiated

  approved → cancelled:
    Manager+ only; reason required
    → vehicle.status → available (restored)
    → marketplace_listing.status → active (restored)
    → Lead.stage → lost (with reason = deal_cancelled)

  delivered → [terminal]
  cancelled → [terminal]

BILL OF SALE PDF GENERATION:
  Triggered on: deal status → approved (draft generated)
                deal status → delivered (final version)
  Engine: Puppeteer (headless Chrome)
  Template fields:
    Dealer: business_name, address, trade_license_no, phone
    Buyer:  name, phone, NID number (if provided), address
    Vehicle: make, model, year, variant, color, VIN/registration, mileage
    Transaction: sale_price, deposit_amount, balance_due, payment_method
    Finance: lender name, loan amount, monthly instalment, term (if finance deal)
    Signatures: dealer representative, buyer (fields for wet signature)
    Date: deal date
  Output: PDF stored in R2 at
    invoices/{dealership_id}/deals/{deal_id}/bill_of_sale_{version}.pdf
  Delivery: WhatsApp (direct link) + in-deal-record download button

PAYMENT RECORDING:
  Deposit:
    → record_payment(deal_id, amount, method, type=deposit, recorded_by)
    → balance_due computed: sale_price - deposit_amount
  Final payment:
    → record_payment(deal_id, amount, method, type=final)
    → balance_due → 0
    → deal eligible for status → delivered
  Partial payments supported (multiple instalments for installment deals)
```

---

### 2.4 Two-Type Expense System — Full Accounting Logic

```
TYPE 1 — Per-VIN Vehicle Expenses
────────────────────────────────
PURPOSE: Track all costs attached to a specific vehicle.
         Feeds directly into profit calculator.

ENTRY POINTS:
  A. Recon task completion (automatic — see Section 1.5)
  B. Manual expense entry on Vehicle Stock Card → Expenses tab
  C. Bulk entry: multiple expenses on same vehicle in one session

EXPENSE CATEGORIES (Type 1, configurable by dealer):
  engine_service | paint | ac_recharge | battery | tyre_change |
  upholstery | windshield | bodywork | parts | detailing |
  transport | inspection_fee | registration | other_vehicle

PROFIT CALCULATOR — LIVE UPDATE:
  Formula:
    net_profit_estimate = asking_price
                        − acquisition_cost
                        − SUM(vehicle_expenses WHERE vehicle_id = $1)
                        − deal_level_costs (from deal record)

  Recalculates on:
    → Any vehicle_expense created, updated, or deleted
    → asking_price changed
    → deal_level_cost added/removed

  Visibility: Owner (full detail) | Manager (full detail) | Salesperson (HIDDEN — section not rendered)

TYPE 2 — Operational Expenses
────────────────────────────────
PURPOSE: Dealership running costs not attached to any vehicle.
         Feeds into P&L report only.

ENTRY POINT:
  Settings → Expenses → Operational (Owner only)
  OR: Deals → Expenses → Add Operational (Manager+)

EXPENSE CATEGORIES (Type 2):
  staff_salary | electricity | water | rent | software_subscriptions |
  internet | vehicle_logistics | advertising_spend | office_supplies |
  accountant_fees | bank_charges | fuel | cleaning | security | other_operational

RECURRING EXPENSE AUTOMATION:
  recurring = true + recur_cycle (monthly/quarterly/annual):
    BullMQ cron creates next expense record automatically
    On creation: in-app notification to owner: "Monthly expense recorded:
    [category] BDT [amount]. Edit in Settings → Expenses."
    Owner can edit actual amount before or after auto-creation

P&L REPORT ASSEMBLY:
  Revenue:     SUM(deals.sale_price WHERE status = delivered, period)
  Type 1 COGS: SUM(vehicle_expenses) for vehicles sold in period
               + SUM(vehicles.acquisition_cost) for vehicles sold in period
  Type 2 OPEX: SUM(operational_expenses WHERE period)
  Gross Profit: Revenue - Type 1 COGS
  Net Profit:   Gross Profit - Type 2 OPEX
  Margin%:      Net Profit / Revenue × 100
```

---

### 2.5 F&I — Finance Module

```
EMI CALCULATOR (all plan tiers):
  Inputs:  vehicle_price, down_payment, loan_term_months, interest_rate
  Output:  monthly_instalment, total_interest, total_cost
  Formula: EMI = P × r × (1+r)^n / ((1+r)^n − 1)
           where P = principal, r = monthly rate, n = months

FINANCE APPLICATION TRACKING (Business/Enterprise):
  Captures: lender_name, loan_amount, application_date, status
  Statuses: submitted | under_review | approved | rejected | disbursed
  Lender list: configurable by dealer (common BD banks + NBFIs)
  Integration: no automatic API integration with lenders (Phase 3 roadmap)
               Phase 1/2: manual status updates by dealer
```

---

## 3. Dealer OS — Module 3: Analytics — Maestro AI Engine

### 3.1 Performance Dashboard — Data Sources

```
REAL-TIME METRICS (live queries on dealer's tables):
  Units sold today:    SELECT COUNT(*) FROM deals WHERE status = 'delivered'
                       AND DATE(delivered_at) = CURRENT_DATE
                       AND dealership_id = $1

  Revenue today:       SELECT SUM(sale_price) FROM deals
                       WHERE status = 'delivered'
                       AND DATE(delivered_at) = CURRENT_DATE
                       AND dealership_id = $1

  Active leads:        SELECT COUNT(*) FROM leads
                       WHERE stage NOT IN ('closed', 'lost')
                       AND dealership_id = $1

  Inventory count:     SELECT COUNT(*), status FROM vehicles
                       WHERE dealership_id = $1
                       GROUP BY status

  Avg days to sell:    SELECT AVG(EXTRACT(DAY FROM sold_at - available_at))
                       FROM vehicles
                       WHERE status = 'sold'
                       AND dealership_id = $1
                       AND sold_at >= NOW() - INTERVAL '90 days'

CACHING STRATEGY:
  Dashboard widgets: Redis TTL 5 minutes (stale-while-revalidate pattern)
  Cache key: dashboard:{dealership_id}:{metric_name}:{period}
  Invalidation: on deal delivered, vehicle status change, lead stage change
```

---

### 3.2 Maestro Insight Engine — Generation Logic

```
EXECUTION: BullMQ job (maestro-insights queue), nightly at 2:00 AM
CONCURRENCY: 5 workers (each handles one dealership)
JOB INPUT: { dealership_id }

FOR EACH DEALER:
  Step 1 — Gather dealer data (single query batch, not per-insight):
    a. vehicles: all available/in_recon/acquired with days_on_lot, asking_price, imv_p50
    b. leads: stage distribution, source distribution, avg response time by salesperson
    c. deals: last 90 days closed/lost, gross_profit, loss_reason distribution
    d. expenses: Type 1 avg by make/model last 90 days
    e. marketplace_listings: deal_rating distribution for this dealer's vehicles
    f. automation_logs: messages sent vs response rate last 30 days
    g. imv_demand: demand index for makes/models in dealer's district (see IMV section)

  Step 2 — Evaluate each insight type:
    Run evaluation function per insight type
    Each function returns: { triggered: boolean, data: {...}, priority: 1-10 }

  Step 3 — Priority scoring:
    Sort triggered insights by priority score descending
    Store top 5 in maestro_insights table (replace previous night's set)
    Mark old insights as expired

  Step 4 — Morning briefing assembly (see Section 3.3)
```

---

### 3.3 Insight Types — Complete Specification

#### INSIGHT TYPE: PRICING

```
TRIGGER CONDITIONS (ANY of):
  A. Vehicle days_on_lot ≥ 45 AND asking_price > imv_p50
  B. Vehicle asking_price / imv_p50 > 1.15 (Overpriced badge) AND days_on_lot ≥ 21
  C. 60-day alert tier reached (see Section 1.6)

PRIORITY SCORE:
  Base: 5
  +3 if days_on_lot ≥ 60
  +2 if asking_price > imv_p95 (extreme overprice)
  +1 per 10 days over 45

MESSAGE TEMPLATE:
  "Your [year] [make] [model] (SK-[stock_no]) has been listed [days] days.
   Similar cars in [district] sell in [avg_days_to_sell] days avg.
   Reduce by BDT [reduction_amount] → enters 'Good Deal' rating."

REDUCTION AMOUNT CALCULATION:
  target_price = imv_p50 × 0.93   (enters Good Deal territory)
  reduction_amount = asking_price - target_price
  Round to nearest BDT 5,000

DEEPLINK: /inventory/vehicles/{vehicle_id}?tab=marketplace&action=reprice
```

#### INSIGHT TYPE: DEMAND

```
TRIGGER CONDITIONS (ANY of):
  A. imv_demand_index for a make/model/district is up ≥ 15% vs 30 days prior
     AND dealer has 0 of that make/model in stock
  B. Dealer's district shows ≥ 3 new listings of a make/model in 7 days
     (suggests competitor restocking activity)
  C. Dealer has sold > 2 units of same make/model in 30 days
     (strong sell-through signal — time to restock)

PRIORITY SCORE:
  Base: 4
  +3 if demand_delta ≥ 30%
  +2 if dealer's own sell-through ≥ 3 units

MESSAGE TEMPLATE:
  "Hybrid hatchback demand in [district] is up [X]% this month.
   You have [0/N] in stock. [N] dealers in your area are listing them."

DEEPLINK: /inventory/vehicles/add?prefill_make=[make]&prefill_body_type=[type]
```

#### INSIGHT TYPE: CONVERSION

```
TRIGGER CONDITIONS (ANY of):
  A. Lead response time > 2 hours for ≥ 30% of leads this week
  B. Facebook/marketplace lead conversion < 5% AND walk-in > 15% (response-time issue)
  C. ≥ 3 leads marked lost with reason = no_response_after_7_days this week
  D. Stage drop-off spike: > 20% of leads not advancing past contacted in 7 days

PRIORITY SCORE:
  Base: 6 (conversion problems are high-priority; revenue impact is direct)
  +2 if response_time avg > 4 hours
  +2 if ≥ 5 leads lost to no_response this week

MESSAGE TEMPLATE (response time):
  "Facebook leads convert at [X]% vs walk-in [Y]%.
   Avg Facebook response time: [Z] hours. Target: < 30 min.
   [N] leads lost this week due to slow response."

DEEPLINK: /crm/leads?filter=source:facebook&filter=stage:new,contacted
```

#### INSIGHT TYPE: EXPENSE

```
TRIGGER CONDITIONS (ANY of):
  A. Average Type 1 expense for a make/model exceeds target GP margin
     (target_margin configured in Settings, default: 20%)
  B. Recon cost on specific category (e.g., engine) trending up ≥ 25% this quarter
  C. A specific vendor's costs are 2× the category average

PRIORITY SCORE:
  Base: 3
  +2 if margin compression affects ≥ 3 vehicles
  +1 if expense spike is on engine or bodywork (high-cost categories)

MESSAGE TEMPLATE:
  "Recon costs on [make] [model] models averaging BDT [amount] this quarter
   — [X]% above your [Y]% GP target margin."

DEEPLINK: /analytics/reports/expenses?filter_make=[make]&filter_model=[model]
```

#### INSIGHT TYPE: AUTOMATION

```
TRIGGER CONDITIONS (ANY of):
  A. Away messages received > 20 in past week with no follow-up next day
  B. WhatsApp automation is OFF but dealer has active leads from WhatsApp source
  C. Post-sale sequence not enabled AND ≥ 3 deals delivered this month
  D. Lead follow-up sequence not enabled AND ≥ 5 leads in new stage > 2 days

PRIORITY SCORE:
  Base: 3
  +2 if away_message_count ≥ 50 (significant missed opportunities)

MESSAGE TEMPLATE (away message):
  "Your WhatsApp away message received [N] messages this week with no
   follow-up. Enable the lead capture bot to convert these into CRM leads."

DEEPLINK: /automation/whatsapp?setup=away_message_bot
```

#### INSIGHT TYPE: RECON_QUALITY

```
TRIGGER CONDITIONS:
  A. ≥ 2 deals in past 90 days where a buyer reported a defect
     post-delivery (feedback from post-sale sequence)
  B. Recon completion time > 14 days average (bottleneck detection)

PRIORITY SCORE: Base 4 (+3 if customer complaint received)

MESSAGE TEMPLATE:
  "Average recon time for [make] models is [N] days. This is delaying
   your time-to-market by [X] days per vehicle vs your target."

DEEPLINK: /inventory/recon?filter=overdue
```

---

### 3.4 Daily Summary — Assembly & Delivery

```
EXECUTION: BullMQ job (daily-summary queue), every day at 7:45 AM
           Delivery: 8:00 AM (15-minute processing window)

DATA ASSEMBLY (per dealership):
  Yesterday's performance:
    units_sold     = deals delivered yesterday
    revenue        = SUM(sale_price) yesterday
    gross_profit   = SUM(gross_profit) yesterday
    new_leads      = leads created yesterday
    leads_contacted = leads moved from new→contacted yesterday

  Top 3 urgent actions (sorted by urgency score):
    a. Uncontacted leads > 2 hours (urgency: 10 − score increases per hour)
    b. Vehicles at 60-day or 90-day aging tier
    c. Pending deal approvals
    d. Failed automation messages requiring attention
    e. Subscriptions expiring within 7 days

  Market snapshot (for makes/models dealer has in available inventory):
    SELECT m.make, m.model, m.imv_p50, m.imv_p50_prev,
           ((m.imv_p50 - m.imv_p50_prev) / m.imv_p50_prev * 100) as pct_change
    FROM imv_data m
    WHERE m.make IN (dealer's current inventory makes)
    AND ABS(pct_change) >= 3  -- Only show meaningful changes

IN-APP DELIVERY:
  Dashboard → Morning Briefing tab (full detail)
  Renders at login if accessed in 8:00–10:00 AM window
  Deep links on each action item

SMS DELIVERY (3-line format, 160 char limit):
  "AutoVerse: [date] | [N] sales, BDT [revenue]L revenue yesterday.
   Urgent: [top action]. [N] aged vehicles need attention.
   Open app: app.autoverse.com.bd"
```

---

## 4. Dealer OS — Module 4: Automation Hub

### 4.1 Channel 1 — WhatsApp Automation

#### Basic Tier — All Dealers (Starter+)

```
GREETING MESSAGE
  Trigger: first ever message from a contact (new WhatsApp number, first message)
  Detection: contact not in dealer's WhatsApp contacts table
  Message: configured by dealer in Automation Hub → WhatsApp → Greeting
  Default template:
    "Welcome to [Dealer Name]! 🚗 We're here to help you find your perfect car.
     How can we help you today? Our team will respond shortly."
  Constraints: one greeting per contact (lifetime, not per-session)
  Fallback: if not configured, no message sent (no default used without dealer setup)

AWAY MESSAGE
  Trigger: message received outside business_hours (configured in Settings → Business Hours)
  Business hours fields: Mon-Fri start/end, Sat start/end, Sun closed/open
  Message: configured by dealer
  Default template:
    "Hi! We're currently closed. Our business hours are [hours].
     We'll get back to you first thing when we open.
     For urgent enquiries, call: [phone]"
  Away message also fires: if all salesperson accounts are in "away" status
  Rate limit: 1 away message per contact per 6-hour window (prevents spam on repeat messages)

QUICK REPLIES
  Available in: WhatsApp Business app (Basic tier) via WA Business message templates
  10 pre-saved templates, accessible from salesperson's WhatsApp integration tab
  Sending method: salesperson opens Lead Card → tap WhatsApp button
                  → pre-filled message with Quick Reply selected from dropdown
  Default Quick Reply templates:
    1. "What's your budget range?"
    2. "Which model are you interested in?"
    3. "Would you like to schedule a test drive?"
    4. "This car is still available. When can you visit?"
    5. "Can you share your preferred location?"
    6. "We can arrange delivery. Would that work for you?"
    7. "Our price is firm. Would you like to proceed?"
    8. "I'll check availability and call you right back."
    9. "Great news — the car is still available and ready to view!"
    10. "We have similar options in your budget. Let me share them with you."
  All templates configurable (dealer can edit text for any slot)
```

#### Advanced Tier — WhatsApp Business API (Professional+)

```
LEAD FOLLOW-UP SEQUENCE
  Trigger: new lead created with source IN (marketplace, dealer_website, facebook_lead_ad, whatsapp)
  Sequence stored in automation_rules JSONB:
    [
      { "delay_hours": 0,  "condition": "always",            "template": "lead_instant_reply" },
      { "delay_hours": 24, "condition": "no_reply_from_lead","template": "lead_day1_followup" },
      { "delay_hours": 72, "condition": "no_reply_from_lead","template": "lead_day3_testdrive" },
      { "delay_hours": 168,"condition": "no_reply_from_lead","template": "lead_day7_expires" }
    ]

  Day 0 instant reply (≤ 60 seconds from lead creation):
    Template: lead_instant_reply
    Variables: {{contact_name}}, {{vehicle_year}}, {{vehicle_make}}, {{vehicle_model}},
               {{asking_price}}, {{vehicle_whatsapp_deeplink}}, {{dealer_name}},
               {{salesperson_name}}
    Content: "Hi {{contact_name}}! I'm {{salesperson_name}} from {{dealer_name}}.
              Thank you for your interest in our {{vehicle_year}} {{vehicle_make}}
              {{vehicle_model}} at BDT {{asking_price}}.
              Here's the full listing with photos: {{vehicle_whatsapp_deeplink}}
              Shall I arrange a viewing for you?"
    Includes: vehicle primary photo (WhatsApp image message, separate message)

  Day 1 follow-up (if no reply AND lead still in new/contacted stage):
    "Hi {{contact_name}}, still interested in the {{vehicle_make}} {{vehicle_model}}?
     It's still available. Any questions I can help with?"

  Day 3 test drive offer:
    "Hi {{contact_name}}, we'd love to show you the {{vehicle_make}} {{vehicle_model}}
     in person. We can arrange a test drive this week — what day works for you?"

  Day 7 expiry urgency (ONLY if lead.priority != cold):
    "Hi {{contact_name}}, just a heads up — we have another interested buyer
     for the {{vehicle_make}} {{vehicle_model}}. Let me know today if you'd
     like to reserve it."

  SEQUENCE CANCELLATION triggers:
    → Lead stage moves to test_drive, negotiation, closed, or lost
    → Customer sends any reply (sequence pauses; salesperson takes over)
    → Salesperson manually pauses sequence from Lead Card

NO-REPLY DETECTION:
  After each message sent, BullMQ evaluates at next scheduled step:
    SELECT COUNT(*) FROM lead_interactions
    WHERE lead_id = $1 AND type = 'inbound_whatsapp'
    AND created_at > (previous_step_sent_at)
  IF count = 0 → condition "no_reply_from_lead" = true → send next step
  IF count > 0 → sequence pauses; notification to salesperson

ABANDONED LEAD RECOVERY
  Trigger: lead.updated_at has not changed in 7 days (no stage movement, no interactions)
         AND lead.stage NOT IN ('closed', 'lost')
  Message: "Hi {{contact_name}}, following up on the {{vehicle_make}} {{vehicle_model}}
            you enquired about. It's still available.
            {{maestro_price_note_if_applicable}}"
  maestro_price_note: "We've also adjusted the price to BDT X, which is now
                       a 'Good Deal' vs market." (only if price was reduced since original enquiry)

POST-SALE SEQUENCE
  Trigger: deal.status → delivered
  Sequence:
    Day 3:   "Hi {{buyer_name}}, how are you enjoying your new {{vehicle_make}}
              {{vehicle_model}}? Any questions about the car, feel free to ask! 😊"
    Day 30:  "Hi {{buyer_name}}, your first service is coming up soon.
              Book at [dealer service link or partner workshop].
              Any issues so far?"
    Day 180: "Hi {{buyer_name}}, hope your {{vehicle_make}} is running great
              at 6 months! Let us know if you need anything."
    Day 365: "Hi {{buyer_name}}, it's been a year! Time for your annual service.
              We also have some great new arrivals if you're thinking about upgrading:
              {{personalized_inventory_link}}"
  All steps cancellable individually from Automation Hub → WhatsApp → Post-Sale

NEW INVENTORY ALERT
  Trigger: vehicle.status → available
  Recipient selection:
    customers WHERE opted_in_inventory_alerts = true
    AND (preferred_make = vehicle.make OR preferred_body_type = vehicle.body_type)
    AND preferred_budget_max >= vehicle.asking_price × 0.9
  Message: "New arrival matching your interest: {{year}} {{make}} {{model}}
            — BDT {{price}}. {{photos_count}} photos available.
            View here: {{deeplink}}"
  Rate limit: max 2 inventory alerts per customer per 7-day window
  Opt-out: reply STOP → auto-removed from all automation (regulatory compliance)
```

#### WhatsApp Third-Party Adapter Contract

```
PURPOSE: Dealers who want advanced bot flows, AI chatbots, or multi-agent inbox
         connect a third-party provider (ManyChat, AiSensy, Kommo, respond.io)

AutoVerse provides:
  Webhook endpoint: POST /api/v1/automation/whatsapp/inbound-webhook/{dealership_id}
  Auth: HMAC-SHA256 signature verification

Incoming webhook payload (adapter → AutoVerse):
  {
    "contact_phone": "+8801XXXXXXXXX",
    "contact_name": "string",
    "message": "string",
    "vehicle_interest": "string or null",
    "intent": "enquiry | test_drive | price_query | general",
    "budget_mentioned": 1500000 or null
  }

AutoVerse processes:
  → Creates or updates lead record
  → Returns: { "lead_id": "uuid", "assigned_to": "salesperson_name",
               "vehicle_id": "uuid or null", "crm_deeplink": "url" }

Outbound (AutoVerse → adapter):
  POST adapter's configured webhook URL
  Payload: new lead created, lead stage changed, deal closed
  Adapters use this to trigger their own flows or update their CRM

Security:
  Adapter credentials stored encrypted in dealer_integrations table
  dealer_integrations.access_token → AES-256 encrypted at rest
  Never returned in API responses (write-only from dealer's perspective)
```

---

### 4.2 Channel 2 — Facebook Automation

```
FACEBOOK/INSTAGRAM PAGE INBOX AUTO-REPLY
  Trigger: first message from a contact on FB Page or Instagram DM
  Method: Meta Messenger Platform webhook (page subscriptions: messages, messaging_postbacks)
  Delay: < 5 seconds
  Message: configured by dealer in Automation Hub → Facebook → Inbox Reply
  Default: "Hi! Thanks for reaching out to [Dealer Name]. We'll reply shortly.
            Browse our inventory: [dealer_website_url]"

AWAY MESSAGE (Facebook)
  Same business hours logic as WhatsApp
  Separate message template from WhatsApp away (Facebook-specific tone is acceptable)

KEYWORD TRIGGER RULES
  Configuration: keyword → template mapping, max 20 rules per dealer
  Detection: case-insensitive substring match in incoming message body

  Default rules:
    "price" OR "দাম"     → Send: "[Vehicle Name] is listed at BDT [price].
                                   Full details: [deeplink]"
    "available" OR "আছে"  → Send: "[Vehicle Name] is still available! Photos: [deeplink]"
    "test drive"          → Send: "We'd love to arrange a test drive!
                                   Reply with your preferred date and location."
    "loan" OR "finance"   → Send: "We can help with financing. Our EMI on
                                   BDT X at Y% over Z months is BDT [amount]/mo.
                                   Shall we discuss?"
  Bangla keywords: BD dealers should set up Bangla variants; system supports Unicode matching

META LEAD ADS → CRM SYNC
  Setup: dealer connects Facebook Ad Account in Automation Hub → Facebook → Lead Ads
  Webhook: Meta Leads webhook → AutoVerse webhook endpoint
  Processing:
    Webhook received → verify Meta signature
    → Extract: lead_gen_id, ad_id, form_id, field_data
    → Map fields to lead record:
        buyer_name  = field "full_name"
        buyer_phone = field "phone_number"
        vehicle_of_interest = field "vehicle_model" (if in form)
        budget = field "budget" (if in form)
    → lead.source = facebook_lead_ad
    → lead.dealership_id = dealer's linked fb_page_id → dealership_id lookup
    → Lead created in Dealer OS CRM (same flow as marketplace enquiry)
    → Push notification to assigned salesperson
    → WhatsApp Day 0 automation fires (if Advanced tier)
  SLA: lead available in CRM within 90 seconds of Meta webhook receipt

POST SCHEDULING (inventory auto-post)
  Trigger: vehicle.status → available AND dealer has auto_post_enabled = true
  Behavior:
    Draft post created (status: pending_approval OR auto_publish based on dealer setting)
    Post content:
      Caption: "[Year] [Make] [Model] | [Mileage]km | BDT [Price]
                [N] photos available | Call/WhatsApp: [phone]
                [dealer_website_url]/[vehicle_slug]"
      Template: pre-designed per body_type using dealer's brand colors (from Website Builder)
      Image: vehicle primary photo (auto-resized to 1200×630 for FB feed)
    Frequency cap: max 3 auto-posts per day
    Optimal posting time: 8–10 AM, 12–1 PM, or 8–10 PM (BD audience activity peaks)
                          Selected based on dealer's historical Facebook Insights data
                          Default: 9:00 AM if no Insights data available

INBOX ROUTING
  When a message mentions a stock number (e.g., "SK-001") or model name:
    → Message auto-tagged with vehicle_id in CRM
    → Routed to salesperson assigned to that vehicle
    → Notification: "FB message about SK-001 ([Make Model]) assigned to you."
```

---

### 4.3 Channel 3 — Social Media Automation

```
SCHEDULED CAMPAIGN MANAGER
  Dealer sets: posts_per_week (1–7), preferred_days, preferred_time
  System selects each week:
    Vehicles in available status NOT posted in the last 7 days
    Sorted by: (days_on_lot DESC, deal_rating DESC)
    i.e., oldest unsold + best deal = highest priority for promotion

  Post content assembly:
    Primary image: vehicle primary photo
    Caption: template based on body_type + dealer's customizations
    Hashtags: auto-generated: #[make] #[model] #usedcar #[district]car
              #autoverse #[dealer_name_slug]
    CTA: "DM us to arrange viewing" or "WhatsApp: [link]"
    Link: dealer website vehicle page

  Approval workflow:
    Option A: Auto-publish (dealer opts in; posts go live at scheduled time)
    Option B: Approval required (draft shown in Automation Hub → Social → Queue;
              dealer approves/edits/rejects each post before publishing)

  Platform targets: Facebook Page + Instagram Business (linked via Meta Business Manager)
  LinkedIn: available but not default-recommended for BD automotive dealers

SOCIAL LISTENING
  Scope: BD automotive Facebook Groups (public groups)
  Method: periodic search via Facebook Graph API (Groups that dealer has joined)
  Triggers:
    A. Dealer's business_name mentioned in a group post or comment
    B. Dealer's vehicle listing URL shared in a group
  Alert: in-app notification to manager: "[Group Name] — someone mentioned
          [Dealer Name]. View post: [FB link]"
  Use case: rapid response to public complaints or praise; competitor price monitoring

PERFORMANCE ANALYTICS
  Data source: Facebook Graph API → post insights
  Metrics per post:
    reach, impressions, engagement_rate (likes+comments+shares / reach),
    link_clicks, whatsapp_button_clicks, photo_views
  Aggregation:
    Best-performing body type (by engagement_rate, last 30 days)
    Best-performing post time (by reach, last 30 days)
    Weekly summary surfaced in Maestro AUTOMATION insight
  Data stored in: social_post_analytics table (dealership_id, post_fb_id, metrics_jsonb)
```

---

### 4.4 Channel 4 — Marketing Automation

```
EMAIL SEQUENCE ENGINE
  Email provider: Resend (resend.com)
  From domain: [dealer-slug]@mail.autoverse.com.bd (subdomain-based sending)
                OR dealer's own email domain (Enterprise plan)
  Templates: React Email components, pre-designed per sequence

  SEQUENCE: WELCOME / NEW LEAD
    Trigger: new lead created (any source)
    Email 1 (immediate):
      Subject: "Thanks for your enquiry about the [Year] [Make] [Model]"
      Content: Enquiry confirmation + vehicle card (photo, specs, price) +
               2 similar vehicles from same dealer + WhatsApp CTA
    Email 2 (Day 2, if no WhatsApp reply logged):
      Subject: "Finance options for your [Make] [Model]"
      Content: EMI calculator results for this vehicle's price +
               finance application steps + WhatsApp CTA
    Email 3 (Day 5, if no interaction logged):
      Subject: "This offer may not last — [Make] [Model]"
      Content: Inventory scarcity message (if vehicle is still available) +
               alternative vehicles in budget + "Save BDT X vs market" (if deal-rated)
    Cancellation: any of → deal created, lead marked lost, buyer unsubscribes

  SEQUENCE: POST-SALE
    Trigger: deal.status → delivered
    Email 1 (Day 1):
      Subject: "Your [Make] [Model] — Care Guide and Documents"
      Content: Delivery confirmation + vehicle care guide PDF attachment +
               first service reminder dates + dealer contact info
    Email 2 (Day 30):
      Subject: "Time for your first service — [Make] [Model]"
      Content: Service reminder + recommended workshop (if dealer has service dept) +
               service checklist
    Email 3 (Day 365):
      Subject: "Happy 1-year anniversary with your [Make] [Model]!"
      Content: Annual service reminder + new inventory highlights matching
               buyer's profile + referral ask

  SEQUENCE: WIN-BACK
    Trigger: lead.stage = lost AND 30 days since last interaction
    Email 1:
      Subject: "Still looking for a car?"
      Content: "New arrivals matching your previous interest" +
               personalized vehicle link + market update
               (e.g., "Prices for [Make] have dropped [X]% this month")
    Max 1 email (no multi-step win-back; single attempt)

LEAD SCORING HOT TRIGGER
  Threshold: lead_score >= 70
  Action: immediate SMS to assigned salesperson (not push — SMS for highest reliability):
    "🔥 HOT LEAD: [buyer_name] viewed [Make Model] 3× today.
     Call now: [phone]. Lead Card: [app_deeplink]"
  Delivery SLA: < 60 seconds from score threshold breach
  Salesperson has 30-minute SLA from HOT notification before manager is also alerted

SMS CAMPAIGN MANAGER
  Access: Owner role only
  Segmentation options:
    all             → all customers + active leads with phone
    recent_buyers   → deals delivered in last 90 days
    active_leads    → leads not in closed/lost, any stage
    by_district     → filter customers/leads by district
    by_make         → filter by preferred_make or vehicle_interest
    opted_in_only   → only contacts with opted_in_sms = true (recommended default)

  Campaign creation:
    Segment selected → estimated recipient count shown
    Message written (max 160 chars; counter shown; SMS credit estimate shown)
    Schedule: send now OR pick datetime
    
  OPT-OUT COMPLIANCE:
    Every campaign SMS must include opt-out instruction
    Auto-appended if not present: "Reply STOP to unsubscribe."
    On STOP reply: contact.opted_in_sms → false (automated via Greenweb webhook)
    opted_in_sms = false → contact excluded from all future campaigns
    Excludes from: sequences, campaigns, alerts (opt-out is universal for SMS)

PERSONALIZED VEHICLE LINKS
  URL format: dealer.autoverse.com.bd/for/{lead_token}
  lead_token: JWT containing lead_id, expires 30 days
  Page renders: dealer's inventory filtered to match lead's stated preferences
                (preferred_make, budget_range, body_type from lead record)
  Behaviour:
    Each page view → BullMQ job updates lead_score +5 (engagement signal)
    If same lead visits 3+ times → HOT score trigger may fire
    Click data visible in Lead Card → Timeline as "Viewed personalized link"
  Generation: automatic on lead creation (link included in Day 0 WhatsApp message)
              also accessible from Lead Card → "Copy Link" button

AUTOMATION LOGS — FULL SCHEMA:
  dealer_id       UUID
  rule_id         UUID FK → automation_rules
  channel         ENUM: whatsapp|facebook|social|email|sms
  trigger_event   VARCHAR(255): e.g., lead.created, vehicle.available, deal.delivered
  contact_id      UUID nullable (lead or customer)
  vehicle_id      UUID nullable
  message_sent    TEXT (full message content)
  template_id     VARCHAR (which template was used)
  status          ENUM: queued|sent|delivered|failed|bounced|opted_out
  error_message   TEXT nullable
  meta_response   JSONB (raw API response for debugging)
  timestamp       TIMESTAMPTZ
  Retention: 90 days rolling window
```

---

### 4.5 Automation Rate Limits and Abuse Prevention

```
PER-DEALER PER-CHANNEL DAILY LIMITS (enforced in Redis):
  WhatsApp messages:      1,000/day (Meta API limit alignment)
  Facebook inbox replies: unlimited (Meta applies its own throttling)
  Social media posts:     3 auto-posts/day (configurable up to 5 in Settings)
  SMS campaigns:          500/day (Starter) | 2,000/day (Professional) | 5,000/day (Business)
  Email sequences:        unlimited (Resend rate limits apply per domain)

RATE LIMIT ENFORCEMENT:
  On each automation job execution:
    Redis INCR: automation_rate:{channel}:{dealership_id}:{YYYYMMDD}
    Redis TTL: 86400 (24h from first increment)
    IF count > limit: job is NOT executed; contact scheduled for next-day queue
    Dealer notified at 80% consumption: "You've used 800/1,000 WhatsApp messages today."

AUTOMATION LOOP PREVENTION:
  Maximum 3 automated messages per contact per 24-hour window (all channels combined)
  Circular trigger detection:
    Rule A triggers Rule B which triggers Rule A → detected in rule_engine.evaluate()
    Max rule chain depth: 3 (prevent infinite automation cycles)
  If loop detected: both rules flagged in admin panel; Dealer notified

EID/FESTIVAL SUPPRESSION:
  BD public holidays + Eid dates pre-loaded in platform_calendar table
  On festival days: non-critical automations paused (lead sequences, social posts)
  EXCEPTIONS (still fire): Hot lead SMS, test drive reminders, deal delivery confirmations
  Dealer can override in Settings → Automation → Festival Mode
```

---

## 5. Dealer OS — Module 5: System & Team Management

### 5.1 Staff Onboarding Flow

```
OWNER ADDS STAFF MEMBER:
  Settings → Team Members → Add Member
  Fields: name, phone (primary), email (optional), role (Manager|Salesperson)
  
  System:
    → Sends SMS invite: "You've been added to [Dealer Name] on AutoVerse.
      Set up your account: [invite_link] (expires 48h)"
    → invite_link contains: signed JWT with dealership_id, role, invited_by, exp=48h
    
  New staff member:
    → Opens link → sets password (or uses OTP login — phone-first)
    → Account created with dealership_id from invite JWT
    → Role assigned per invite (cannot self-select role)
    → Onboarding tip sequence (in-app, 5 steps for Salesperson, 7 for Manager)

STAFF DEACTIVATION:
  Owner taps "Deactivate" on team member
  → user.status → suspended (for this dealership context)
  → All open leads assigned to deactivated user → auto-assigned to manager
  → Active automation rules authored by this user remain active (not deleted)
  → BullMQ jobs for their follow-up reminders → reassigned
  → Deactivated user cannot log in (401 on JWT refresh)
  → Data retained (lead history, deal records — compliance)

PERMISSION INHERITANCE:
  If Manager is deactivated: their lead assignments → Owner
  If Salesperson is deactivated: their lead assignments → Manager (or Owner if no Manager)
  Reassignment notification sent: "N leads from [name] have been reassigned to you."
```

---

### 5.2 Role-Based Access Control — Enforcement Map

```
OWNER (full access):
  All 8 sidebar sections visible
  Cost prices, acquisition_cost, recon_total visible on all stock cards
  Profit calculator visible on all stock cards and deal records
  Type 1 expenses: full detail (amount, vendor, receipt)
  Type 2 expenses: full detail
  CRM: all leads regardless of assigned_to
  Analytics: all staff data, all cost/margin data
  Automation Hub: full control (edit, delete, create all rules)
  Settings: all (subscription, billing, team management)

MANAGER (operational access, no financials):
  Sidebar: all except Subscription & Billing
  Cost prices on stock cards: HIDDEN (shown as "—")
  Profit calculator: HIDDEN (section not rendered in DOM)
  Type 1 expenses: VISIBLE for recon management (can add/edit recon expenses)
  Type 2 expenses: TOTALS ONLY (no per-item breakdown, no receipts)
  CRM: all leads (including other salespeople's leads)
  Analytics: team data (no cost/margin line items)
  Automation Hub: full control
  Deal approval: within discount_threshold configured by Owner

SALESPERSON (own-data access):
  Sidebar: Dashboard, Inventory (no cost view), CRM (own leads), Deals (own deals)
  Hidden entirely: Automation Hub, Website & Marketing, Settings
  Cost prices: HIDDEN
  Profit calculator: HIDDEN
  All expenses: HIDDEN
  CRM: own leads only
      (configurable: Owner can set "salesperson_sees_all_leads" = true)
  Analytics: own performance only
  Deal approval: cannot approve; always escalates to Manager

API-LEVEL ENFORCEMENT:
  Every protected field returned as null if role insufficient (NOT omitted — omission causes UI errors)
  Every write operation guarded by RoleGuard decorator in NestJS
  Example:
    GET /vehicles/:id → returns acquisition_cost: null for Salesperson
                     → returns acquisition_cost: 1500000 for Owner
  RoleGuard: checks JWT claim dealership_role against required roles array
  DealerContextGuard: injects dealership_id into query context (RLS)
```

---

### 5.3 Subscription & Billing Management (Dealer-Facing)

```
SUBSCRIPTION PAGE DISPLAYS:
  Current plan name and tier features
  Next billing date and amount
  Payment method on file (masked bKash/card number)
  Invoice history (last 12 months, PDF download per invoice)
  Plan comparison table (upgrade/downgrade options)

PLAN UPGRADE FLOW:
  Dealer selects higher plan
  → Prorated charge calculated:
      days_remaining = days until current period ends
      upgrade_charge = (new_price - old_price) × (days_remaining / 30)
  → Confirmation dialog: "You'll be charged BDT [X] today for the remainder
    of this billing period. From [date], BDT [new_price]/month."
  → Payment initiated immediately
  → On success: new plan features activated within 60 seconds
  → Invoice generated

PLAN DOWNGRADE FLOW:
  Dealer selects lower plan
  → If current usage exceeds new plan limits:
      Warning shown: "You currently have [N] vehicles. [Plan] allows [limit].
      You must archive [X] vehicles before downgrading."
  → If within limits: downgrade scheduled for next billing date (not immediate)
  → Confirmation: "Your plan will change to [Plan] on [date]. No charge today."

PAYMENT METHOD UPDATE:
  Dealer goes to Settings → Billing → Update Payment Method
  → Initiates bKash/Nagad/card verification flow
  → New method stored after successful BDT 1 verification charge (immediately refunded)
  → Old method deleted after new method confirmed
```

---

## 6. Admin Modules

### 6.1 Module A — Dealer Management (Deep Spec)

```
DEALER LIST VIEW:
  Columns: dealer_name | district | plan | status | MRR | listing_count | last_active | days_since_join
  Filters: status | plan_tier | district | division | joined_date_range | MRR_range
  Sort: any column
  Search: name, phone, trade_license_no, slug

DEALER PROFILE (Admin View):
  Section 1 — Identity:
    business_name, slug, trade_license_no, owner_name, phone, email, district
    Registration date, approval date, approved_by (admin user)
  Section 2 — Subscription:
    Current plan, next_billing_date, subscription_expires_at
    Payment history: all invoices with status
    MRR contribution
  Section 3 — Usage Metrics:
    Active vehicle listings, staff count, leads (last 30 days), deals (last 30 days)
    Last login timestamp, avg daily logins (last 30 days)
    Automation rules configured (count per channel)
  Section 4 — Marketplace:
    Total live listings, avg deal_rating distribution, featured slots active
    View count (total), enquiry count (total, last 30 days)
  Section 5 — Flags & Notes:
    Admin notes (internal, not visible to dealer)
    Active flags: payment_overdue | policy_warning | fraud_investigation | probation
    Flag history with timestamps and admin who added

ADMIN ACTIONS ON DEALER:
  Approve (pending → active): sets approval date, sends welcome
  Suspend (active → suspended): requires reason_code + optional note
  Reinstate (suspended → active): clears suspension; triggers listing restore
  Upgrade/downgrade plan (manual for enterprise deals)
  Reset password: sends SMS OTP to dealer phone
  Impersonate: Super Admin only; opens dealer's DMS view as that dealer
               Every impersonated action watermarked: "Actioned by AutoVerse Support"
               in platform_audit_logs
  Add admin note: internal note visible to all admin roles
  Flag account: marks for monitoring; adds internal flag to dealer profile

BLACKLIST MANAGEMENT:
  Blacklist table: suspended_entities (phone, business_name, trade_license_no, ip_address)
  Add to blacklist: part of termination flow (Super Admin) OR manual (Operations Manager)
  Check on registration: exact match phone | fuzzy match business_name (Levenshtein distance ≤ 2)
  False positive handling: Operations Manager can override and approve with note
```

---

### 6.2 Module B — Marketplace Moderation (Deep Spec)

```
C2C MODERATION QUEUE:
  Sorted by: submitted_at ASC (oldest first, FIFO)
  Columns: thumbnail | make/model/year | price | seller_phone | submitted_at | auto_checks_status
  Quick filter: auto_check_passed | auto_check_failed | flagged_by_buyer | duplicate_suspected

PER-LISTING MODERATION VIEW:
  Left panel:
    All photos (full size on click)
    Photo metadata if available (EXIF: GPS location, device, date taken)
    Auto-check results summary (what passed/failed)
  Right panel:
    Seller info: phone, name, previous listings count, rejection history
    Vehicle specs vs database reference (side-by-side comparison)
    IMV range for this cluster (price vs market shown graphically)
    Price history: has seller already listed similar VIN/car before?
    Platform flags: has this phone number been reported before?

  MODERATOR DECISION:
    APPROVE → listing status: active; seller SMS sent; listing enters search index
    REJECT  → reason_code required (from dropdown):
                fake_photos | stock_photos | price_out_of_range | specs_mismatch |
                duplicate_listing | invalid_contact | competitor_watermark |
                incomplete_info | suspicious_seller
              → seller SMS: "[Reason]. You have [N] resubmit attempts remaining."
              → resubmit_attempts_remaining decremented
              → At 0 attempts: listing permanently closed; seller account flagged
    FLAG    → listing published with internal suspicious flag
              → Increased buyer complaint sensitivity for this listing
              → Seller's future listings enter moderation queue (even if auto-checks pass)

BUYER FLAG PROCESSING:
  Buyer reports a live listing → flag created (listing_flags table)
  If flag count ≥ 2 on same listing within 24h:
    → listing automatically hidden (status: under_review)
    → Content Moderator notified: "Listing [ID] flagged by [N] buyers. Review required."
  Moderator reviews and decides: restore | confirm_violation | escalate
  SLA: flag-to-review within 15 minutes during business hours

FEATURED SLOT MANAGEMENT:
  Slots: homepage_hero | search_top | category_top | dealer_spotlight
  Admin can assign:
    A. Dealer purchases featured boost (self-serve via dealer billing)
    B. Admin manually assigns (for promotional/enterprise deals)
  featured_until: datetime field on marketplace_listings
  BullMQ job checks expiry hourly: featured_until < NOW() → is_featured = false
  Analytics per slot: impressions, CTR, enquiries generated (shown in admin panel)

IMV OVERRIDE PROTOCOL:
  Override request: Marketing Admin submits → Super Admin must approve
  Reason required (dropdown): import_restriction_event | flood_damage_market_effect |
                               regulation_change | insufficient_sample_adjustment | other
  Override scope: a single cluster OR all clusters for a make/model
  Override type: adjust_p50_by_percent | set_manual_p50 | suppress_rating_for_period
  Expiry: all overrides must have expiry_at datetime (max 90 days)
  Audit: all overrides logged in platform_audit_logs with before/after states
```

---

### 6.3 Module C — Payment Management (Deep Spec)

```
REVENUE DASHBOARD (Finance Admin):
  Real-time metrics:
    MRR: SUM(active subscriptions × monthly_price)
    ARR: MRR × 12
    Active paying dealers: COUNT by plan tier
    New MRR this month (from upgrades + new subscriptions)
    Churned MRR this month
    Net MRR movement: new − churned
    Avg revenue per dealer

  Charts:
    MRR trend: last 12 months (line chart)
    Plan distribution: donut chart (Free/Starter/Pro/Business/Enterprise counts)
    New vs churned dealers: bar chart last 6 months
    Revenue by stream: subscriptions | per-lead | C2C | featured | reports (last 30 days)

FAILED PAYMENT QUEUE (Finance Admin):
  Columns: dealer_name | plan | amount_due | failure_reason | attempts | last_attempt | days_overdue
  Sorted: days_overdue DESC

  Per-failed-payment actions:
    Retry now:        initiate payment immediately with same method
    Send manual link: generate payment URL → send via SMS to dealer
    Change method:    dealer's contact → instruct them to update payment method
    Apply credit:     if dealer has account credit (e.g., refund from previous billing)
    Waive (partial):  reduce amount owed with documented reason
    Mark bad debt:    write off; no further retry; initiate suspension
    Escalate:         tag for Operations Manager call

  FAILURE REASON CODES (from bKash/Nagad/SSLCommerz):
    insufficient_funds | payment_method_expired | timeout | network_error |
    account_blocked | limit_exceeded | cancelled_by_user | fraud_suspected

C2C LISTING FEE PROCESSING:
  BDT 199–799 per 30-day listing
  Payment via: bKash | Nagad | SSLCommerz
  On success: listing approved for moderation queue; seller notified
  On failure: listing held; seller notified to retry within 24h before listing is cancelled

REFUND MANAGEMENT:
  Refund types: subscription_overpayment | accidental_double_charge | service_failure
  Process: Finance Admin creates refund record → payment gateway reverse charge
  Timeline: bKash/Nagad refund: 1–3 business days | SSLCommerz: 5–7 days
  Documentation: refund reason required; stored in refunds table
  Refund limit per event: Finance Admin can refund up to BDT 10,000 without Super Admin approval
```

---

## 7. Website Builder Architecture

### 7.1 Full Provisioning Flow

```
DEALER INITIATES SETUP:
  Settings → Website & Marketing → Website Settings → Set Up Website
  
STEP 1 — Basic Info (pre-filled from dealer profile):
  business_name (editable), tagline (new), primary_color (color picker),
  secondary_color, logo_upload, cover_photo (optional), phone, whatsapp_number,
  address_display, business_hours, google_maps_embed_url

STEP 2 — System provisions automatically (< 30 seconds):
  a. Subdomain allocation:
       slug = sanitize(business_name) → remove special chars → lowercase → max 50 chars
       Check uniqueness: SELECT COUNT(*) FROM dealer_websites WHERE subdomain = slug
       If duplicate: slug + "-" + district_code
       Store in dealer_websites.subdomain

  b. Next.js ISR microsite generation:
       Template instantiated with dealer's brand config
       dealer_websites record created:
         { dealership_id, subdomain, status: active, primary_color, secondary_color, logo_url }
       ISR page at dealer.autoverse.com.bd/{slug} immediately live

  c. Inventory population:
       All vehicles WHERE dealership_id = $1 AND status = 'available'
       AND marketplace_published = true
       → Rendered as ISR pages at dealer.autoverse.com.bd/{slug}/cars/{vehicle_slug}

  d. SEO setup:
       Per-listing title: "[Year] [Make] [Model] for Sale in [District] | [Dealer Name]"
       Meta description: auto-generated from specs + price + IMV rating
       Schema.org/Vehicle structured data injected on each vehicle page

  e. Analytics injection:
       Google Analytics 4: GA4 measurement_id provisioned (via Google Analytics Admin API)
                           → Injected into microsite <head>
       Facebook Pixel: injected if dealer has connected FB Business Manager
                       (can be done post-setup in Channel Connections)

  f. Sitemap generation:
       Sitemap XML generated: dealer root + all vehicle pages
       Submitted to Google Search Console (via GSC API with platform service account)

STEP 3 — Site Live Confirmation:
  Preview shown in setup wizard (iframe preview)
  Dealer sees: "Your website is live at [url]"
  WhatsApp CTA shown: "Share your new website" → generates shareable message

RE-GENERATION TRIGGERS (ISR revalidation):
  → Any vehicle sync event (price, photos, status, new vehicle)
  → Dealer profile update (logo, colors, contact info)
  → Subscription plan change (may affect available features)
  Revalidation: Next.js ISR on-demand revalidation via API route
  Endpoint: POST /api/revalidate?path=/[slug]/cars/[vehicle_slug]&secret=[ISR_SECRET]
```

---

### 7.2 Custom Domain Routing Architecture

```
DEALER SETUP FLOW:
  Website Settings → Custom Domain → Enter domain: cars.dealername.com.bd
  System shows:
    "Add this CNAME record to your domain's DNS:
     Name:  cars (or www, or your subdomain)
     Value: dealer.autoverse.com.bd
     TTL:   Auto or 3600"

VERIFICATION (Cloudflare Worker, polling every 2 minutes for 20 minutes):
  1. DNS lookup: cars.dealername.com.bd CNAME record value
  2. If value = dealer.autoverse.com.bd → verification passed
  3. Update dealer_websites.custom_domain = 'cars.dealername.com.bd'
  4. Update dealer_websites.custom_domain_verified = true
  5. Cloudflare SSL certificate provisioned (Cloudflare's Universal SSL — automatic)

CUSTOM DOMAIN ROUTING (Cloudflare Worker):
  Worker deployed at: *.autoverse.com.bd (wildcard) + all verified custom domains

  On request to cars.dealername.com.bd:
    1. Read Host header: cars.dealername.com.bd
    2. DB lookup (via Cloudflare KV cache, TTL 5 min):
         SELECT dealership_id, subdomain, status FROM dealer_websites
         WHERE custom_domain = 'cars.dealername.com.bd'
    3. Dealer not found → return 404 (custom AutoVerse 404 page)
    4. Dealer status = suspended → return maintenance page (503):
         "This dealer's website is temporarily unavailable."
    5. Dealer found + active:
         Inject header: X-Dealership-ID: {dealership_id}
         Rewrite URL to: dealer.autoverse.com.bd/{slug}/{path}
         Forward to Next.js (Vercel)

NEXT.JS CONTEXT INJECTION:
  Middleware reads X-Dealership-ID header
  All data fetches scoped to dealership_id
  Dealer brand config (colors, logo) applied

CNAME DEREGISTRATION (on termination or domain removal):
  dealer_websites.custom_domain → null
  dealer_websites.custom_domain_verified → false
  Cloudflare KV cache invalidated immediately
  Domain now returns 404 within < 1 minute
```

---

### 7.3 Google Merchant Center Feed

```
FEED FORMAT: RSS 2.0 with Google Custom Labels and Automotive extension
FEED URL: api.autoverse.com.bd/feeds/gmc/{dealership_id}?key={feed_key}

FEED FIELDS PER VEHICLE:
  id:           vehicle.id (UUID)
  title:        "[Year] [Make] [Model] [Variant] — Used Car in [District]"
  description:  "[Mileage]km | [Fuel Type] | [Transmission] | [Color] | [Condition]
                 BDT [Price]. [IMV Deal Rating] — [% above/below] market average."
  link:         dealer_website_url/cars/[vehicle_slug]
  image_link:   vehicle primary photo URL (WebP, https, ≥ 800px wide)
  additional_image_link: [second, third photo URLs]
  price:        [price] BDT  (format: "1500000 BDT")
  condition:    "used" or "new" (mapped from vehicle.condition)
  brand:        vehicle.make
  google_product_category: "2271" (Vehicles & Parts > Vehicles)
  custom_label_0: deal_rating (great_deal|good_deal|fair_price|overpriced)
  custom_label_1: body_type
  custom_label_2: fuel_type
  custom_label_3: mileage_bucket
  custom_label_4: district
  availability: "in stock" (available) | "out of stock" (sold/reserved)
  year:         vehicle.year
  mileage:      vehicle.mileage_km (appended " km")
  vin:          vehicle.vin (if available)
  color:        vehicle.color
  fuel_type:    mapped to GMC values: "Gasoline" | "Diesel" | "Hybrid" | "Electric" | "Other"

SYNC SCHEDULE:
  Full feed regeneration:    BullMQ cron, every 6 hours
  Instant item update:       price change, status change, new vehicle, photos changed
                             → targeted update (single item update via Content API, not full feed)

FEED GENERATION:
  NestJS FeedsModule → generates XML feed in memory → streams to Cloudflare R2
  R2 path: feeds/gmc/{dealership_id}/feed_{timestamp}.xml
  CDN-served URL: media.autoverse.com.bd/feeds/gmc/{dealership_id}/feed.xml
  Note: R2 serves the latest feed via a stable URL (symlink-equivalent via redirect rule)

ERROR HANDLING:
  GMC rejects an item → logged in gmc_feed_logs:
    { dealership_id, vehicle_id, rejection_reason, rejected_at }
  Alert trigger: if > 10% of a dealer's items rejected in a single feed submission
    → Content Moderator notified in admin panel
    → Dealer notified: "Some of your vehicle listings have issues with Google Shopping.
      Review in Website & Marketing → Channel Connections."

AUTHENTICATION:
  Platform-level Google Service Account (not per-dealer)
  Scopes: https://www.googleapis.com/auth/content
  Each dealer's GMC account linked via: dealer connects GMC merchant ID in Channel Connections
  AutoVerse Service Account added as feed manager to each dealer's GMC account
```

---

### 7.4 Facebook Catalog Sync

```
CATALOG CREATION (on dealer activation of Facebook channel):
  Create catalog via Facebook Catalog API (catalog_type: "vehicles")
  Catalog name: "{dealer_name} — AutoVerse Inventory"
  Store catalog_id in dealer_facebook_settings table

  Create product set (for DPA targeting):
    All available vehicles → product_set_id stored

FEED SYNC METHOD: Facebook Catalog Batch Upload (not Pixel feed upload)
  Endpoint: POST /{catalog_id}/items_batch
  Each batch: up to 5,000 items (vehicles)

PER-VEHICLE FIELDS (Facebook Automotive Vertical):
  id:                vehicle.id
  availability:      "in stock" | "out of stock"
  condition:         "used" | "new"
  description:       same as GMC description
  image_url:         primary photo URL
  additional_image_url: [up to 19 additional photo URLs]
  link:              dealer_website_url/cars/[vehicle_slug]
  title:             same as GMC title
  price:             [price] BDT
  brand:             vehicle.make
  year:              vehicle.year
  mileage:           vehicle.mileage_km
  body_style:        mapped: sedan|suv|hatchback|pickup_truck|minivan|van|coupe|convertible
  drivetrain:        "fwd" | "rwd" | "4wd"
  fuel_type:         "gasoline" | "diesel" | "hybrid" | "electric"
  transmission:      "automatic" | "manual" | "cvt"
  trim:              vehicle.variant
  vin:               vehicle.vin
  exterior_color:    vehicle.color
  sale_price:        same as price (no sale discount in BD automotive context)
  url:               same as link

SYNC TRIGGERS: same as GMC (price change, status change, new vehicle, photos)
SYNC EXECUTOR: BullMQ queue (facebook-catalog-sync), 5 workers, 3 retries

AUTHENTICATION:
  Platform-level Meta System User Token (long-lived — NOT dealer's personal token)
  Token refresh: getLongLivedToken() 7 days before expiry (proactive refresh cron)
  Token stored encrypted: dealer_facebook_settings.system_user_token (AES-256)
  Scope needed: catalog_management, business_management

DYNAMIC VEHICLE ADS (DVA) SETUP:
  Requires: Facebook Pixel installed on dealer website (auto-injected by Website Builder)
  DVA workflow:
    Buyer views vehicle on dealer website
    → Pixel fires: ViewContent event { content_ids: [vehicle_id], content_type: 'vehicle' }
    → Facebook creates Custom Audience of viewers
    → Dealer runs DVA campaign targeting this audience
    → Dynamic ad automatically shows the exact vehicle the buyer viewed
  AutoVerse role: pixel injection, catalog sync (foundation)
  Dealer role: creates DVA campaign in their own Facebook Ads Manager
```

---

## 8. Marketplace Engine

### 8.1 Search Architecture (MeiliSearch)

```
INDEX: marketplace_vehicles
  Primary key: id (marketplace_listing.id)

SEARCHABLE ATTRIBUTES (in priority order):
  1. title          ("2019 Toyota Axio for Sale in Dhaka")
  2. make           ("Toyota")
  3. model          ("Axio")
  4. description    (free text description)
  5. district       ("Dhaka")
  6. variant        (trim level)

FILTERABLE ATTRIBUTES:
  make, model, year, price (range), mileage_km (range), body_type,
  fuel_type, transmission, condition, district, division, deal_rating,
  seller_type (dealer|c2c), is_featured, status, listing_type

SORTABLE ATTRIBUTES:
  price ASC/DESC, mileage_km ASC, created_at DESC, deal_score ASC (lower = better deal),
  views DESC (popularity), days_on_lot ASC (newest to lot)

FACET DISTRIBUTION (returned with every search):
  make, body_type, fuel_type, transmission, condition, district, deal_rating
  (enables dynamic filter counts in search UI)

RANKING RULES (in priority order):
  1. words       (match quality)
  2. typo        (fewer typos ranked higher)
  3. proximity   (search terms closer together)
  4. attribute   (match in title > model > description)
  5. sort        (user's selected sort or default)
  6. exactness   (exact match preferred)
  7. custom:     is_featured DESC (featured listings always ranked above non-featured at equal score)

DEFAULT SORT (no explicit sort selected):
  is_featured DESC → deal_score ASC → created_at DESC
  (Featured first, then best deals, then newest)

INDEX UPDATE TRIGGERS:
  → Vehicle created: add document to index
  → Vehicle price updated: update asking_price + deal_score + deal_rating
  → Vehicle status changed: update status field (inactive listings hidden via filter)
  → Vehicle photos updated: update image_url fields
  → Vehicle deleted: delete document from index
  → IMV nightly recalculation: bulk update deal_score + deal_rating for all affected documents
  
  All updates go through: sync event → BullMQ → NestJS MeiliSearch client → index update

CACHE STRATEGY:
  Common search result pages cached in Redis:
    Key: search:{hash(filters+sort+page)}
    TTL: 120 seconds
  Invalidated on: any sync event that affects that filter set
  User-specific searches (unique combinations): not cached; served live from MeiliSearch
  
  MeiliSearch query latency target: < 50ms (single-server Droplet at 500K listings)
```

---

### 8.2 Search Ranking — Full Logic

```
BASE RELEVANCE SCORE (MeiliSearch internal):
  Computed per query (text matching quality, typo penalty, attribute priority)

FEATURED BOOST:
  is_featured = true → ranked above all non-featured results at same relevance tier
  Featured slots:
    homepage_hero:  shown before search results (hardcoded position 0)
    search_top:     shown as first 2 results in search results list (position 1–2)
    category_top:   shown first in make/model category browse pages
  Non-slot featured: still benefits from ranking rule, not positional guarantee

DEAL RATING SORT (when user sorts by "Best Deal"):
  deal_score ASC (most negative score = furthest below market = best deal)
  Unrated vehicles (sample_size < 10) sorted below rated vehicles

RECENCY SORT (when user sorts by "Newest"):
  created_at DESC (when the listing was first published on marketplace)

POPULARITY SORT (when user sorts by "Most Popular"):
  views DESC (Redis counter, synced to MeiliSearch index daily)

PRICE DROP SIGNAL:
  Listings where price was reduced in last 48 hours:
    price_drop_flag = true → highlighted in search results with "Price Reduced" badge
    Not a ranking factor; purely visual signal

DEALER QUALITY SIGNAL (future, Phase 2):
  dealer_rating (avg of buyer reviews) as soft ranking factor
  Higher-rated dealers get minor boost in unfiltered results
  Not implemented in Phase 1 (insufficient review data)
```

---

### 8.3 Vehicle Listing Detail Page

```
URL PATTERN: autoverse.com.bd/cars/[slug]
  slug format: {year}-{make}-{model}-{district}-{short_id}
  example: 2019-toyota-axio-dhaka-xk7p2

RENDERING: ISR (revalidate: 300 seconds)
  Triggered revalidation: on any sync event for this listing_id

PAGE SECTIONS:
  1. Photo Gallery:
     Primary photo hero (above fold)
     Gallery strip: all photos, tap to expand (lightbox)
     Photo count badge: "12 Photos"

  2. Title & Price:
     "[Year] [Make] [Model] [Variant]"
     Asking price: "BDT 14,50,000"
     IMV deal rating badge (Green/Teal/Amber/Red/Grey)
     Price vs market: "BDT 45,000 below market avg" (if rated)

  3. Quick Stats Bar:
     Mileage | Fuel type | Transmission | Year | Condition

  4. Key Specs (full):
     Engine CC, body type, color, drive type, seats (if known)

  5. IMV Price Intelligence Box:
     "Market Range for Similar Cars in [District]"
     Low / Market Avg / High (p25 / p50 / p75 with amounts)
     Visual bar with this listing's price plotted
     "Based on [N] comparable listings in [District]"
     If unrated: "Insufficient data for this model in your area"

  6. Contact Section (primary CTA):
     WhatsApp button: LARGEST BUTTON ON PAGE (per BD UX principle)
     Click triggers: deeplink to WhatsApp with pre-filled message
     Secondary: "Enquire" form (name + phone only, 2 fields max)
     Dealer name + rating (stars) + review count
     "View all cars from this dealer →"

  7. Vehicle History (if available):
     Service records (if dealer has logged them)
     Ownership count (if known)

  8. Similar Listings:
     5 vehicles: same make OR same body_type, same district, similar price range
     Sorted by: deal_score ASC (best deals shown)

  9. Price History (if listing has been up > 7 days with price changes):
     Simple chart: price over time for THIS listing

  10. Structured Data (invisible, for Google):
      Schema.org/Vehicle:
        name, description, image, offers.price, mileage, fuelType,
        vehicleTransmission, color, modelDate, vehicleEngine

ENQUIRY FORM SUBMISSION:
  POST /api/v1/marketplace/leads
  Body: { listing_id, buyer_name, buyer_phone, message (optional) }
  Server actions:
    → Lead created in dealer's CRM (source = marketplace)
    → Push notification to dealer's assigned salesperson
    → Enquiry confirmation SMS to buyer: "Enquiry sent to [Dealer Name].
      They'll contact you shortly on this number."
    → WhatsApp Day 0 automation fires (if dealer has Advanced tier)

VIEW COUNTER:
  Increment: Redis INCR views:{listing_id} on page load
  Persistence: BullMQ job syncs Redis counters to marketplace_listings.views every 15 minutes
  Purpose: MeiliSearch "popularity" sort, Maestro analytics, dealer dashboard
```

---

### 8.4 Dealer Profile Page

```
URL: autoverse.com.bd/dealers/[slug]
RENDERING: ISR (revalidate: 300 seconds)

SECTIONS:
  1. Header:
     Logo, business_name, district, "Verified Dealer" badge (if active plan)
     Rating (stars, review count), WhatsApp number, phone
     "View Website" button → custom domain or subdomain

  2. Inventory Summary:
     "[N] Cars Available" count
     Search/filter within dealer's inventory (client-side, MeiliSearch with dealer filter)

  3. Inventory Grid:
     All active marketplace_listings for this dealership
     Same card format as main marketplace (photo, title, price, deal_rating, mileage, year)
     Sorted: featured first, then deal_score ASC

  4. About:
     Business description (from dealer profile settings)
     Location with Google Maps embed
     Business hours

  5. Reviews (Phase 2):
     Buyer reviews of this dealership
     Average rating, rating distribution
```

---

### 8.5 IMV Display — Full Logic

```
IMV CALCULATION CLUSTER:
  cluster_key = make + model + year + mileage_bucket + condition + district

DISPLAY SCENARIOS:

  Scenario A — cluster has sample_size ≥ 10 (rated):
    Display: deal_rating badge + price comparison statement
    Badge colors:
      great_deal  → Green (price > 15% below market)
      good_deal   → Teal (5–15% below)
      fair_price  → Amber (within 10% of market)
      overpriced  → Red (> 10% above market)
    Price statement:
      great_deal: "BDT [X] below market average — Great Deal"
      good_deal:  "BDT [X] below market average — Good Deal"
      fair_price: "Near market average"
      overpriced: "BDT [X] above market average"
    IMV box: p25 / p50 / p75 shown with amounts

  Scenario B — cluster has sample_size 5–9 (low confidence):
    Display: No deal_rating badge
    IMV box shown: "Price Range (Limited Data): BDT [p25] — BDT [p75]"
    Tooltip: "Based on [N] comparable listings. More data needed for a rating."

  Scenario C — cluster has sample_size < 5 (no rating):
    Display: Grey badge "No Rating"
    IMV box: "Insufficient market data for this model in [district]"
    Tooltip: "We need more comparable listings to provide a price rating."

  Scenario D — no cluster exists at district level:
    Fallback 1: use division-level cluster (district → division)
    Fallback 2: use national-level cluster (no district/division filter)
    Note shown: "Based on national data (limited local listings)"
    If no cluster at any level: Scenario C displayed

DEAL_SCORE FORMULA:
  deal_score = (listing.asking_price - imv_p50) / imv_p50
  Negative = below market. Positive = above market.
  Stored as DECIMAL(6,4) — e.g., -0.1523 = 15.23% below market

RATING THRESHOLDS:
  deal_score < -0.15  → great_deal
  deal_score < -0.05  → good_deal
  deal_score < +0.10  → fair_price
  deal_score >= +0.10 → overpriced

IMV UPDATE SCHEDULE:
  Nightly: BullMQ cron at 2:00 AM — full recalculation of all clusters
  Instant: triggered on price_update sync event (recalculates single listing's deal_score)
  Cache: Redis, TTL 1 hour per cluster_key
         Key: imv:{make}:{model}:{year}:{mileage_bucket}:{condition}:{district}
```

---

### 8.6 C2C Listing Wizard — Full Specification

```
URL: autoverse.com.bd/sell
RENDERING: CSR (client-side; no SEO value to wizard itself)

AUTH REQUIREMENT:
  Must be logged in (buyer account or new account)
  Phone OTP login built into wizard (can complete signup mid-wizard without losing progress)
  Wizard state: persisted in localStorage during session; survives OTP flow

STEP 1 — Car Details (5 fields):
  make (dropdown, sourced from vehicle_reference.makes)
  → model (filtered dropdown based on make)
  → year (dropdown: 1990–current year)
  → variant (free text optional)
  mileage_km (number input, with "km" unit label)
  fuel_type (radio: Petrol | Diesel | Hybrid | Electric | CNG)
  transmission (radio: Auto | Manual | CVT)
  Condition (radio: Excellent | Good | Fair — maps to: new | used | reconditioned)

STEP 2 — Condition & Features:
  Condition checklist (same 8 categories as dealer recon, adapted for C2C):
    engine | body | paint | interior | electricals | tyres | ac | brakes
    Each: Great | OK | Needs Work
  Feature checklist (multi-select):
    AC | Power Windows | Power Locks | Central Locking | Reverse Camera |
    Navigation/GPS | Sunroof | Alloy Wheels | Bluetooth | USB Charging |
    Airbags | ABS | Push Start | Keyless Entry | Leather Seats | etc.

STEP 3 — Photo Upload:
  Mobile camera direct or gallery upload
  Minimum: 4 photos
  Maximum: 20 photos
  Required angles nudge (non-blocking guidance):
    "Tip: Include front, rear, side, interior, odometer, engine bay"
  Drag-to-reorder: tap to set primary photo
  Compression: same Sharp pipeline as dealer uploads (150KB max per photo)

STEP 4 — Pricing:
  Seller enters asking_price (BDT number input)
  REAL-TIME IMV RESPONSE as price is typed:
    Debounced 500ms API call: GET /imv?make=&model=&year=&mileage_bucket=&condition=&district=
    Response: { p25, p50, p75, deal_rating, sample_size }
    Display: price slider showing seller's price vs market range
    Deal rating badge preview: shows what badge their listing would get at current price
    If overpriced: gentle nudge (not blocking): "This is above the typical market range.
                   Consider BDT [p50] for a faster sale."
    If great_deal: positive reinforcement: "Great — this is a very competitive price!"

STEP 5 — Contact & Publish:
  Display phone (auto-populated from account)
  District (dropdown — used for IMV cluster and search filtering)
  Description (optional, max 500 chars): free text
  Contact preference: Show phone | WhatsApp only | Enquiry form only
  Review summary (all entered details shown)
  Listing fee display: "BDT 199 for 30-day listing"
  Payment button → initiates bKash/Nagad flow
  On payment success: listing submitted to moderation queue
  On payment failure: listing saved as draft (can retry payment later)

LISTING MANAGEMENT (post-publish):
  Seller dashboard: my-listings at autoverse.com.bd/account/listings
  Actions per listing: edit (re-enters moderation) | boost (pay for featured slot) | delete
  Expiry reminders:
    Day 25: SMS "Your listing expires in 5 days."
    Day 28: SMS "Your listing expires in 2 days. Renew for BDT 99."
    Day 29: SMS "Final reminder: renew tomorrow or listing expires."
  Expiry: listing status → expired; hidden from search
  Renewal: BDT 99 for first renewal | BDT 199 for subsequent
```

---

### 8.7 Featured Slot System

```
SLOT TYPES AND PLACEMENT:
  homepage_hero:
    Position: top banner on autoverse.com.bd homepage
    Capacity: 1 listing at a time (or rotating carousel max 3)
    Visibility: all site visitors
    CTR benchmark target: > 8%

  search_top:
    Position: first 1–2 results in all search results pages
    Capacity: up to 2 simultaneous listings
    Label shown: "Featured" (grey badge, not distracting)

  category_top:
    Position: top of make/model browse page (e.g., /cars/toyota/axio)
    Capacity: 1 per make/model combination
    Label: "Featured"

  dealer_spotlight:
    Position: dedicated section on marketplace homepage: "Featured Dealers"
    Capacity: up to 4 simultaneous dealer cards
    Shows: dealer logo, rating, vehicle count, district

SELF-SERVE BOOST (dealer purchases from dealer dashboard):
  Dealer selects: listing → Boost → slot type → duration (7/14/30 days)
  Price schedule:
    search_top 7 days:   BDT 500
    search_top 14 days:  BDT 900
    search_top 30 days:  BDT 1,500
    homepage_hero 7 days: BDT 2,000
    category_top 7 days:  BDT 800
    dealer_spotlight 7 days: BDT 1,200
  Payment: dealer's existing payment method
  Activation: within 5 minutes of payment confirmation
  Expiry: BullMQ job checks every hour; expired slots deactivated immediately

ADMIN-ASSIGNED SLOTS:
  Marketing Admin can assign any slot to any dealer/listing
  Duration: must set featured_until datetime
  Reason logged: promotional | enterprise_deal | partnership | compensation

CONFLICT RESOLUTION:
  search_top has capacity 2:
    If 3+ active featured listings: sorted by featured_until ASC (soonest-to-expire shown first)
    Dashboard shows: "You're in queue. Position: [N]. Estimated activation: [date]."
  homepage_hero is exclusive (capacity 1):
    Booking system: calendar shows available dates
    Double-booking prevented: slot locked on payment initiation
```

---

## 9. Sync Engine

### 9.1 Core Architecture Principle

```
                vehicles (tenant DB)
                      |
                      | trigger event
                      ↓
            BullMQ: sync-vehicle queue
                      |
                      | job processing
                      ↓
           marketplace_listings (public DB)
                      |
              fan-out (concurrent)
          ┌──────────────────────────────┐
          ↓          ↓         ↓        ↓
    dealer       GMC feed  FB catalog  WhatsApp
    website                            alerts
    (ISR)

ISOLATION GUARANTEE:
  vehicles table: dealer-scoped (RLS enforced)
  marketplace_listings table: public, only contains safe fields
  NO financial data, NO cost prices, NO staff notes cross the boundary
  Sync job is the ONLY entity that reads from vehicles and writes to marketplace_listings
```

---

### 9.2 Full Event Map

```
EVENT: sync_vehicle.create
  Trigger: vehicle.status transitions to 'available' for first time
           AND vehicle.marketplace_published = true
           AND vehicle has ≥ 4 photos
  Source: InventoryService.updateStatus() → emits event
  Payload:
    { event: 'sync_vehicle.create', vehicle_id, dealership_id, timestamp }

  Job execution:
    1. Read vehicle record (full)
    2. Read dealership record (for dealer info on listing)
    3. Read imv_data for cluster (for initial deal_rating)
    4. Generate listing slug: {year}-{make}-{model}-{district}-{nanoid(6)}
    5. Create marketplace_listings record with public fields only
    6. Insert into MeiliSearch index
    7. Emit: sync.complete → fan-out (see Section 9.4)

EVENT: sync_vehicle.price_update
  Trigger: vehicle.asking_price updated by dealer
  Payload:
    { event: 'sync_vehicle.price_update', vehicle_id, dealership_id,
      old_price, new_price, timestamp }

  Job execution:
    1. Recalculate deal_score: (new_price - imv_p50) / imv_p50
    2. Recalculate deal_rating from new deal_score
    3. UPDATE marketplace_listings SET asking_price = new_price,
         deal_score = new_score, deal_rating = new_rating,
         price_updated_at = NOW()
    4. Set price_drop_flag = (new_price < old_price)
    5. Update MeiliSearch document
    6. Emit: sync.complete → fan-out (price-specific fan-out includes buyer alerts)

EVENT: sync_vehicle.status_change
  Trigger: vehicle.status changes (any transition)
  Payload:
    { event: 'sync_vehicle.status_change', vehicle_id, dealership_id,
      old_status, new_status, timestamp }

  Status mapping:
    vehicle.available → marketplace_listings.status: active
    vehicle.reserved  → marketplace_listings.status: reserved
    vehicle.sold      → marketplace_listings.status: sold
    vehicle.in_recon  → marketplace_listings.status: hidden (not deleted)
    vehicle.acquired  → marketplace_listings.status: hidden
    vehicle.scrapped  → marketplace_listings.status: archived

  Job execution:
    1. UPDATE marketplace_listings.status
    2. If new_status = 'sold':
         marketplace_listings.sold_at = NOW()
         Schedule BullMQ delayed job: archive listing after 7 days
    3. Update MeiliSearch document
    4. Emit: sync.complete → fan-out

EVENT: sync_vehicle.photo_update
  Trigger: vehicle.photos JSONB field updated (upload, delete, reorder)
  Payload:
    { event: 'sync_vehicle.photo_update', vehicle_id, dealership_id, timestamp }

  Job execution:
    1. Read updated photos from vehicle
    2. Update marketplace_listings.photos with same JSONB structure
    3. Update MeiliSearch image_url field
    4. Emit: sync.complete → fan-out (website ISR, FB catalog)

EVENT: sync_vehicle.recon_complete
  Trigger: all recon tasks for vehicle_id are complete
  Same as sync_vehicle.create if listing doesn't exist yet
  Same as sync_vehicle.status_change (in_recon → available) if listing exists

EVENT: sync_vehicle.sold
  Trigger: deal.status → delivered → vehicle.status → sold
  Job execution:
    1. marketplace_listings.status → 'sold'
    2. marketplace_listings.sold_at = NOW()
    3. Add "SOLD" overlay to listing (CSS class in MeiliSearch metadata)
    4. Delayed BullMQ job (7 days): status → 'archived' (removed from search)
    5. Fan-out: GMC remove, FB catalog remove, ISR revalidate

EVENT: sync_vehicle.visibility_toggle
  Trigger: dealer toggles marketplace_published on/off from stock card
  Payload:
    { event: 'sync_vehicle.visibility_toggle', vehicle_id, dealership_id,
      marketplace_published: true/false, timestamp }

  Job execution:
    If marketplace_published = false:
      marketplace_listings.status → 'hidden'
      Remove from MeiliSearch active index
    If marketplace_published = true:
      marketplace_listings.status → 'active'
      Re-add to MeiliSearch index

EVENT: sync_vehicle.deleted
  Trigger: vehicle soft-deleted from Dealer OS (vehicles.deleted_at set)
  Job execution:
    1. Hard-delete marketplace_listings record (NOT soft delete — listing must be gone)
    2. Delete from MeiliSearch index
    3. Log deletion in sync_audit_log
    4. Fan-out: GMC remove, FB catalog remove, ISR 404
```

---

### 9.3 Conflict Resolution Rules

```
SCENARIO 1: Price updated twice in rapid succession (race condition)
  Problem: two BullMQ jobs for same vehicle_id both running
  Solution: optimistic locking on marketplace_listings
    UPDATE marketplace_listings
    SET asking_price = $1, deal_score = $2, updated_at = NOW()
    WHERE id = $2 AND updated_at < $3  -- $3 = job's event timestamp
  If update affected 0 rows: job discards itself (a newer update already won)
  Result: last write wins, but only if it's actually newer

SCENARIO 2: Status change arrives before create job completes
  Problem: vehicle transitions to reserved while create sync is in-flight
  Solution: BullMQ job ordering — use dealership-specific queue prefix
    Queue key: sync-vehicle:{dealership_id}
    FIFO within dealership: events processed in order
    This prevents out-of-order status updates for same vehicle

SCENARIO 3: IMV recalculation concurrent with price update
  Problem: nightly IMV recalculation updates deal_score at same time as price sync
  Solution: advisory lock on cluster_key during IMV recalculation
    pg_advisory_lock(hashtext(cluster_key))
    After recalculation complete: all affected listings updated atomically
    Price sync checks: was my vehicle part of a recent IMV batch? If so, skip
    (vehicle was already included in the batch update)

SCENARIO 4: Dealer suspended mid-sync
  Problem: sync job is running; dealer gets suspended before completion
  Solution:
    Before writing to marketplace_listings:
      Check dealership.status = 'active'
    If status = 'suspended': job aborts; logs DealerSuspendedError
    BullMQ marks job as failed (no retry — correct behaviour; will be re-triggered on reinstatement)
    On dealer reinstatement: sync_all_vehicles job fires for this dealer

SCENARIO 5: C2C listing vs dealer listing for same VIN
  Problem: dealer has a vehicle listed AND a C2C seller lists the same VIN
  Detection:
    C2C listing creation checks: SELECT COUNT(*) FROM marketplace_listings
      WHERE vin = $1 AND listing_type = 'dealer' AND status = 'active'
  Resolution:
    If dealer listing found: C2C listing still allowed (different seller, valid listing)
    But note shown to C2C moderation team: "Dealer listing exists for this VIN"
    No hard block — BD market has high JDM import duplication rate
    Moderator manually determines if same physical car or different import

SCENARIO 6: Fan-out partial failure
  Problem: sync completes but 1 of 4 fan-out jobs fails (e.g., GMC API down)
  Solution:
    Fan-out jobs are independent BullMQ jobs (not chained)
    Each has own retry config (3 retries with exponential backoff)
    Partial failure does not cascade: ISR, FB catalog, WhatsApp alerts can succeed
    independently even if GMC fails
    Failed fan-out jobs enter DLQ and show in System Health dashboard
    Manual retry available per-job from admin panel
```

---

### 9.4 Fan-Out Architecture

```
AFTER SYNC JOB COMPLETES:
  SyncService.onSyncComplete(vehicle_id, event_type) fires fan-out:

  Fan-out jobs added to BullMQ (parallel, not sequential):
  ┌─────────────────────────────────────────────────────────────────┐
  │  Job 1: dealer-website-isr                                      │
  │    Queue: main-worker                                           │
  │    Action: POST /api/revalidate?path={vehicle_page_path}        │
  │            POST /api/revalidate?path={dealer_homepage}          │
  │    Condition: ALWAYS                                             │
  ├─────────────────────────────────────────────────────────────────┤
  │  Job 2: gmc-feed-sync                                           │
  │    Queue: feed-worker                                           │
  │    Action: Update single GMC item via Content API               │
  │    Condition: dealer plan >= Professional AND gmc_connected      │
  │    Rate limit: max 10 GMC API calls per minute per dealer        │
  ├─────────────────────────────────────────────────────────────────┤
  │  Job 3: facebook-catalog-sync                                   │
  │    Queue: feed-worker                                           │
  │    Action: Update single FB catalog item via Graph API          │
  │    Condition: dealer plan >= Professional AND fb_catalog_connected│
  ├─────────────────────────────────────────────────────────────────┤
  │  Job 4: whatsapp-inventory-alert                                │
  │    Queue: automation-whatsapp                                   │
  │    Action: Check saved preferences → send alerts to opted-in    │
  │    Condition: event = sync_vehicle.create OR                    │
  │              event = sync_vehicle.price_update (price drop only)│
  │    Rate limit: max 2 inventory alerts per recipient per 7 days  │
  ├─────────────────────────────────────────────────────────────────┤
  │  Job 5: buyer-price-drop-alert                                  │
  │    Queue: notification-sms OR notification-push                 │
  │    Action: SMS/push to buyers who saved this vehicle            │
  │    Condition: event = price_update AND new_price < old_price    │
  ├─────────────────────────────────────────────────────────────────┤
  │  Job 6: redis-cache-invalidation                                │
  │    Queue: main-worker                                           │
  │    Action: DEL keys matching search:{make}:{model}:{district}:* │
  │            DEL key imv:{cluster_key} (if price changed)         │
  │    Condition: ALWAYS                                             │
  └─────────────────────────────────────────────────────────────────┘

FAN-OUT CONCURRENCY: all 6 jobs added simultaneously, executed in parallel
FAN-OUT SLA: all 6 jobs complete within 5 seconds of sync completion
TOTAL SYNC-TO-LIVE SLA: < 2 seconds (sync) + < 5 seconds (fan-out) = < 7 seconds wall-clock
```

---

### 9.5 Sync Failure Protocol — Full Specification

```
RETRY CONFIGURATION (sync-vehicle queue):
  attempts: 4 (1 initial + 3 retries)
  backoff: { type: 'exponential', delay: 5000 }
  Delays: attempt 1 = 5s, attempt 2 = 30s, attempt 3 = 5min

RETRY 1 (5 seconds):
  Log: warn | SyncRetry1 | vehicle_id | error_type
  No external notification

RETRY 2 (30 seconds):
  Log: warn | SyncRetry2 | vehicle_id | error_type
  No external notification

RETRY 3 (5 minutes):
  Log: error | SyncRetry3 | vehicle_id | error_type
  No external notification

ALL RETRIES FAILED → DEAD LETTER QUEUE (DLQ):
  Job moved to: sync-vehicle-failed queue
  Alert 1: System Admin in-app alert: "Sync failure: vehicle {id}, dealership {id}. [Error]"
  Alert 2: Slack/Discord webhook (internal team, if configured)

DEALER UI NOTIFICATION (on DLQ entry):
  Vehicle stock card shows: "⚠️ Sync error — marketplace may not reflect latest changes"
  Last synced timestamp shown: "Last synced: [X] minutes ago"
  Manual retry button: dealer taps → adds sync job back to queue
  If manual retry fails: "Sync unavailable. Contact support." + support WhatsApp link

SYNC HEALTH MONITORING:
  System Admin dashboard metric: "Sync failures (last 24h)"
  Alert threshold: > 5 DLQ entries in 30 minutes → system-wide alert
  Could indicate: database issue, MeiliSearch down, Redis overload

SYNC AUDIT LOG:
  Every sync job completion (success or failure) logged in sync_audit_log:
    vehicle_id, dealership_id, event_type, status (success|failed|dlq),
    duration_ms, error_message, attempt_number, timestamp
  Retained: 30 days
  Query: check sync health per dealer, per event type

MARKETPLACE DISPLAY ON SYNC LAG:
  If marketplace_listings.last_synced_at < NOW() - 10 minutes:
    Listing page shows small warning badge: "Data may not be current"
  Cleared: on successful sync update
```

---

### 9.6 Sync SLA Monitoring

```
TARGET SLAs:
  Sync complete (vehicle → marketplace_listing): < 2 seconds
  ISR revalidation (dealer website page): < 3 seconds
  MeiliSearch index update: < 1 second (included in sync time)
  GMC feed update (instant item update): < 30 seconds
  Facebook catalog update: < 60 seconds
  WhatsApp inventory alert delivery: < 120 seconds
  Total sync-to-all-channels: < 3 minutes

SLA MEASUREMENT:
  Each sync job records: started_at, completed_at, duration_ms
  Each fan-out job records same
  System health dashboard shows:
    p50 sync time (last 24h)
    p95 sync time (last 24h)
    p99 sync time (last 24h)
    % syncs within SLA (< 2 seconds)
  Alert: if p95 sync time > 5 seconds for 10 consecutive syncs → System Admin notified

DEGRADED MODE (sync is slow but not failing):
  If sync queue depth > 500 jobs:
    → Instant sync priority: price_update, status_change (user expects fast update)
    → Deprioritize: photo_update (lower urgency; user not waiting for this)
  If queue depth > 2,000 jobs:
    → Enable backpressure: rate-limit new sync jobs per dealer to 5/minute
    → Alert: "Sync engine under heavy load. Some updates may be delayed."
    → This is a scaling bottleneck trigger (see blueprint Section 17 scaling playbook)
```

---

*AutoVerse — Step 2: Dual Engine + Sync Architecture*
*Complete System Design · Built against Blueprint v7.0*
