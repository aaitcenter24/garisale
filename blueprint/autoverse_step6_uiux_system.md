# AutoVerse — Step 6: UI/UX System
### Admin Panel · Dealer OS · Automation Hub · Website Builder · Marketplace · BD UX · v1.0

> Complete UI/UX specification: every screen, every component tree, every interaction flow, every state, and every BD-specific design decision. This document defines what gets built — not how it looks aesthetically, but exactly what appears on screen, in what order, with what actions available, and under what conditions.

---

## Table of Contents

1. [Design System Foundation](#1-design-system-foundation)
2. [Admin Panel — All Views](#2-admin-panel--all-views)
3. [Dealer OS — Layout System & Navigation](#3-dealer-os--layout-system--navigation)
4. [Dealer OS — Screen Implementations](#4-dealer-os--screen-implementations)
5. [Automation Hub UI](#5-automation-hub-ui)
6. [Website Builder UI](#6-website-builder-ui)
7. [Marketplace UI](#7-marketplace-ui)
8. [BD UX — Bangla, Skeleton Screens, Offline, Payments](#8-bd-ux--bangla-skeleton-screens-offline-payments)
9. [3-Click Enforcement Map](#9-3-click-enforcement-map)
10. [Component Library — Shared Atoms](#10-component-library--shared-atoms)

---

## 1. Design System Foundation

### 1.1 Spacing & Layout Grid

```
BASE UNIT: 4px
SPACING SCALE: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80

BREAKPOINTS:
  mobile:  < 768px   (360px minimum supported viewport)
  tablet:  768–1023px
  desktop: >= 1024px

LAYOUT WIDTHS:
  marketplace page max-width: 1280px (centered)
  dealer OS content area:     variable (fills remaining after sidebar)
  admin panel max-width:      1440px
  mobile: 100% minus 16px horizontal padding (8px each side)

BORDER RADIUS SCALE:
  xs: 4px   (input fields, small chips)
  sm: 8px   (cards, buttons)
  md: 12px  (modals, popovers)
  lg: 16px  (large cards, drawers)
  xl: 24px  (bottom sheets on mobile)
  full: 9999px (pills, badges, avatars)
```

### 1.2 Typography Scale

```
FONT FAMILY:
  Primary (Latin):  Inter (Google Fonts)
  Primary (Bangla): Noto Sans Bengali (Google Fonts)
  Monospace:        JetBrains Mono (for stock numbers, amounts in tables)

TYPE SCALE:
  display-2xl:  36px / 44px line-height / weight 700  (page titles, hero)
  display-xl:   30px / 38px / 700                      (section headers)
  display-lg:   24px / 32px / 700                      (card headers)
  display-md:   20px / 28px / 600                      (sub-section headers)
  text-xl:      18px / 28px / 400                      (body large)
  text-lg:      16px / 24px / 400                      (body default)
  text-md:      14px / 20px / 400                      (body small, labels)
  text-sm:      12px / 18px / 400                      (captions, helper text)
  text-xs:      11px / 16px / 400                      (badges, micro labels)

  Amounts (BDT):  JetBrains Mono, 16px, weight 600 (tabular numbers for alignment)

BANGLA TYPOGRAPHY ADJUSTMENTS:
  Noto Sans Bengali renders slightly larger → reduce font-size 2px across all scales
  Line-height increases 4px for Bangla (more vertical space needed for matras)
  Auto-applied when language toggle = 'bn'
```

### 1.3 Color System

```
BRAND COLORS:
  primary-600:   #2563EB  (primary actions, links, active states)
  primary-500:   #3B82F6  (hover states)
  primary-100:   #DBEAFE  (selected backgrounds, chips)
  primary-050:   #EFF6FF  (subtle tints)

DEAL RATING COLORS:
  great-deal:    #16A34A  (green-600)  background: #DCFCE7 (green-100)
  good-deal:     #0D9488  (teal-600)   background: #CCFBF1 (teal-100)
  fair-price:    #D97706  (amber-600)  background: #FEF3C7 (amber-100)
  overpriced:    #DC2626  (red-600)    background: #FEE2E2 (red-100)
  unrated:       #9CA3AF  (gray-400)   background: #F3F4F6 (gray-100)

AGING ALERT COLORS:
  tier-1-yellow: #EAB308  background: #FEF9C3
  tier-2-orange: #F97316  background: #FFF7ED
  tier-3-red:    #DC2626  background: #FEF2F2
  tier-4-critical: #991B1B background: #FEE2E2

SEMANTIC COLORS:
  success:       #16A34A  / bg: #DCFCE7
  warning:       #D97706  / bg: #FEF3C7
  error:         #DC2626  / bg: #FEE2E2
  info:          #2563EB  / bg: #DBEAFE
  neutral:       #6B7280  / bg: #F3F4F6

SURFACE COLORS:
  background:    #F9FAFB  (app background)
  surface:       #FFFFFF  (cards, panels)
  surface-hover: #F3F4F6  (hover on cards)
  border:        #E5E7EB  (dividers, input borders)
  border-focus:  #2563EB  (focused inputs)

TEXT COLORS:
  text-primary:   #111827  (headings, primary content)
  text-secondary: #6B7280  (labels, secondary content)
  text-disabled:  #9CA3AF  (disabled states)
  text-inverse:   #FFFFFF  (on dark backgrounds)
```

### 1.4 Component Design Principles

```
PRINCIPLE 1: Thumb-first design
  All interactive elements: minimum 44×44px tap target
  Primary CTAs: minimum 48px height on mobile
  Bottom-of-screen actions (most reachable for right thumb)
  No hover-only interactions anywhere

PRINCIPLE 2: Skeleton-first loading
  Every data-loading state shows skeleton (not spinner)
  Skeleton matches the shape of the content it replaces
  Never show blank white space while loading

PRINCIPLE 3: Inline actions > modals
  Prefer expanding rows, inline edits, slide-in panels over modal dialogs
  Modals only for: destructive confirmations, forms > 4 fields
  On mobile: bottom sheets replace modals

PRINCIPLE 4: Progressive disclosure
  Show summary → expand for detail
  Never load all data upfront; paginate or virtualize long lists
  Tabs > long single-scroll pages (especially on mobile)

PRINCIPLE 5: Forgiving forms
  Auto-save drafts (vehicles, lead notes)
  Validate inline on blur (not on submit)
  Never clear a form on error; preserve user input
  Required fields marked clearly; optional fields labeled "(optional)"

PRINCIPLE 6: BD-specific defaults
  Default currency display: "BDT 15,00,000" or "BDT 15L" (toggle)
  Default language: Bangla (en fallback)
  Phone field: auto-format as BD mobile (01X-XXXX-XXXX)
  Amounts: comma-separates per BD convention (lakhs: 15,00,000)
```

---

## 2. Admin Panel — All Views

### 2.1 Admin Shell Layout

```
LAYOUT (desktop only — admin panel is desktop-first):
  ┌─────────────────────────────────────────────────────────────┐
  │  TOP BAR (fixed, 64px)                                       │
  │  Logo | "Admin" badge | Search dealers | Notifications | Avatar│
  ├──────────────┬──────────────────────────────────────────────┤
  │  LEFT NAV    │  CONTENT AREA (scrollable)                   │
  │  (240px)     │                                              │
  │  ──────      │                                              │
  │  Dashboard   │                                              │
  │  Dealers     │                                              │
  │  Moderation  │                                              │
  │  Payments    │                                              │
  │  System      │                                              │
  │  ──────      │                                              │
  │  [role-      │                                              │
  │   specific   │                                              │
  │   items]     │                                              │
  └──────────────┴──────────────────────────────────────────────┘

TOP BAR ELEMENTS:
  Left:   AutoVerse logo + "Admin Panel" text badge (red background)
  Center: Global dealer search (name, phone, slug)
  Right:  System health indicator (green/amber/red dot) |
          Notification bell (badge count) |
          Admin avatar + role label + dropdown (profile, sign out)

ADMIN SESSION INDICATOR:
  Amber banner when: impersonating a dealer
    "You are viewing as [Dealer Name]. All actions are logged. Exit impersonation →"
  Red banner when: critical system alert active
    "Sync engine degraded. [X] jobs in DLQ. View →"
```

### 2.2 Admin Dashboard

```
SECTION A — Platform KPIs (Super Admin / Finance Admin)
  Cards (2×3 grid):
    Active Dealers:     [N] total | +X this week (green/red delta)
    Paying Dealers:     [N] | breakdown by plan (mini bar chart)
    MRR:                BDT [X]L | +Y% vs last month
    New MRR this month: BDT [X]  | from upgrades + new subs
    Churned MRR:        BDT [X]  | from cancellations + downgrades
    Active Listings:    [N] | dealer vs C2C split (donut)

SECTION B — Operations Alerts (Operations Manager)
  Alert cards with count + action button:
    Pending Approvals:  [N] dealer applications → "Review"
    C2C Moderation:     [N] listings in queue → "Moderate"
    Flagged Listings:   [N] buyer-flagged → "Review"
    Failed Payments:    [N] invoices overdue → "View Queue"
    Suspended Dealers:  [N] currently suspended → "View"

SECTION C — System Health (System Admin)
  Metrics row:
    API p95: [X]ms | BullMQ queue depth: [N] | Redis: [X]MB used
    Sync SLA compliance: [X]% within 2s | Failed jobs 24h: [N]
  Status indicators: green/amber/red per service

SECTION D — Recent Activity Feed
  Timeline of last 20 admin actions (platform_audit_log):
    [Time] [Admin Name] [Action] → [Target]
    "10:32 AM  Karim (Ops) approved dealer Dhaka Auto House"
    "09:15 AM  Rabeya (Finance) waived BDT 5,000 invoice #INV-0234"
  Filterable by action type, admin user, time range
```

### 2.3 Dealer Management Views

```
DEALER LIST VIEW:
  FILTERS ROW:
    Status: All | Pending | Active | Suspended | Terminated (pill tabs)
    Plan:   All | Free | Starter | Pro | Business | Enterprise (dropdown)
    District: All | [district list] (dropdown)
    Search: name / phone / slug (inline)
    Sort: Joined date | MRR | Listing count | Last active

  TABLE COLUMNS:
    Dealer Name + avatar | District | Plan (badge) | Status (badge) |
    Listings (active count) | Leads (30d) | MRR (BDT) |
    Last Active (relative: "2h ago") | Actions (⋮ menu)

  ROW ACTIONS (⋮ menu):
    View Profile | Impersonate | Add Note | Suspend | Approve (if pending)

  BULK ACTIONS (when rows selected):
    Bulk approve (pending) | Bulk suspend | Export to CSV

─────────────────────────────────────────────────────────────────
DEALER PROFILE VIEW (admin):
  HEADER:
    Logo + Business Name + Slug badge + Status badge + Plan badge
    Phone | WhatsApp | Email | District
    [Approve] [Suspend] [Impersonate] [Add Note] buttons
    If pending: [Approve] [Reject] prominent

  TABS:
    Overview | Subscription | Listings | Activity | Notes & Flags

  TAB: Overview
    Left column (60%):
      Business details: trade_license, address, location map pin
      Owner info: name, phone, joined date, approved by + date
      Staff list: name, role, last login, status
      Showroom locations list
    Right column (40%):
      Usage stats card:
        Active listings / Plan limit (progress bar)
        Staff seats used / limit
        Leads this month / Deals this month / Revenue this month
      Subscription card: plan, expires, auto-renew toggle, next billing

  TAB: Subscription
    Current plan details
    Payment history table: date | amount | method | status | invoice link
    Failed payment recovery: retry button per failed invoice
    Plan change: dropdown to change plan + effective date selector

  TAB: Listings
    Mini listing grid showing dealer's active marketplace listings
    Deal rating distribution bar (how many great/good/fair/overpriced)
    GMC sync status / Facebook catalog sync status

  TAB: Activity
    platform_audit_log entries for this dealer
    entity_change_log entries for this dealer
    Timeline format, newest first

  TAB: Notes & Flags
    Text area: add internal note (visible to all admin roles)
    Existing notes list: note text | author | timestamp
    Active flags list: flag type | added by | date | [Remove] button
    Flag types: payment_overdue | policy_warning | fraud_investigation | probation
```

### 2.4 Marketplace Moderation Views

```
C2C MODERATION QUEUE:
  QUEUE METRICS ROW:
    Pending: [N] | Avg wait: [X]h | SLA compliance: [X]% | Reviewed today: [N]

  QUEUE TABLE (sorted: oldest first):
    Thumbnail | Title (Year Make Model) | Price | Seller Phone |
    Submitted | Auto-checks (✅/❌/⚠️) | [Review] button

  AUTO-CHECK COLUMN BREAKDOWN (tooltip on hover):
    ✅ Photos: 4+ photos, not stock images
    ✅ Price: within IMV bounds
    ✅ Specs: match database
    ✅ Contact: valid BD phone
    ✅ Duplicate: no duplicate VIN
    ❌ [specific check that failed]

─────────────────────────────────────────────────────────────────
LISTING MODERATION DETAIL:
  SPLIT VIEW (two panels):

  LEFT PANEL — Listing Preview:
    Photo gallery (full-size carousel)
    Photo metadata strip: EXIF date taken, GPS (if available), device
    "Compare with known stock images" button (hash check)

  RIGHT PANEL — Decision:
    Seller info: phone, total listings, rejection history
    Vehicle specs vs database reference (side-by-side table):
      Field | Submitted | Database Reference | Match (✅/⚠️)
      Make  | Toyota    | Toyota             | ✅
      Year  | 2020      | 2018–2022 range    | ✅
    IMV Price Widget:
      Submitted price vs IMV cluster bar
      "BDT X vs market BDT Y — [Z]% [above/below]"
    Previous listings from this phone: count + link
    Platform flags for this seller: list

    DECISION SECTION:
      [APPROVE] button (green, primary)
      [REJECT] button (red) → opens reason dropdown:
        fake_photos | stock_photos | price_out_of_range | specs_mismatch |
        duplicate_listing | invalid_contact | competitor_watermark |
        incomplete_info | suspicious_seller
        + Optional note field
      [FLAG] button (amber) → flags visible listing for monitoring
      [ESCALATE] button → assigns to Super Admin for review

  KEYBOARD SHORTCUTS (for high-volume moderation):
    A = Approve | R = Reject | F = Flag | → = Next listing
```

### 2.5 Payment Management Views

```
REVENUE DASHBOARD:
  KPI CARDS ROW:
    MRR | ARR | Active paying dealers | New MRR (month) | Churned MRR | Net MRR movement
  CHART 1: MRR trend — 12-month line chart
  CHART 2: Plan distribution — donut (Free/Starter/Pro/Business/Enterprise counts + %)
  CHART 3: Revenue by stream — stacked bar (subscriptions / per-lead / C2C / featured)
  CHART 4: New vs churned dealers — bar chart, 6 months

─────────────────────────────────────────────────────────────────
FAILED PAYMENT QUEUE:
  FILTER ROW: payment_method | gateway | days_overdue (range) | amount_range
  TABLE:
    Dealer | Plan | Amount Due | Failure Reason | Attempts | Last Attempt | Days Overdue
  ROW ACTIONS (inline buttons):
    [Retry Now] [Send Link] [Waive] [Mark Bad Debt]
  DETAIL PANEL (slides in on row click):
    Full payment history for this invoice
    Gateway error detail (from payment_transaction.gateway_response)
    Dealer contact info (click-to-call WhatsApp link)
    Recovery action log (all previous retry attempts)
```

### 2.6 System Health Dashboard

```
LAYOUT: 4 sections, 2×2 grid on desktop

SECTION 1 — Queue Health:
  Table: Queue Name | Depth | Active Workers | Failed (24h) | DLQ count
  Color coding: green (< 100 pending) | amber (100–500) | red (500+)
  [Retry DLQ] button per queue

SECTION 2 — API Performance:
  Real-time: p50 / p95 / p99 response times (sparkline last 60 min)
  Error rate: % 4xx, % 5xx (last 1h)
  Top slow endpoints table: path | p95ms | call count

SECTION 3 — Infrastructure:
  DB connections: used/max (progress bar)
  Redis memory: used MB / total MB (progress bar)
  R2 storage: GB used / cost estimate
  Sync SLA: % syncs within 2s (last 24h) | avg sync time

SECTION 4 — Feature Flags:
  List of all feature flags: key | status | scope | last changed
  [Toggle] switch per flag (immediate effect, no deploy needed)
  Change confirmation: "This affects [N] dealers immediately. Confirm?"
```

### 2.7 Broadcast Message Tool

```
COMPOSE VIEW:
  Target selector:
    Radio: All Active Dealers | By Plan | By District | Specific Dealers
    If By Plan: plan checkboxes
    If By District: district multi-select
    If Specific: dealer search + tag input
  Preview: "This will reach approximately [N] dealers"

  Channel selector (tabs):
    SMS | In-App Notification | Both
    If SMS: 160-char counter, preview on mock phone
    If In-App: title field + body + deep_link (optional)

  Schedule:
    Send Now | Schedule (date/time picker)

  [Preview] → shows exact rendered message
  [Send] → confirmation dialog with recipient count + [Confirm Send]

SENT HISTORY:
  Table: Date | Message preview | Target | Channel | Sent count | Opened (push only)
```

---

## 3. Dealer OS — Layout System & Navigation

### 3.1 Desktop Layout (≥ 1024px)

```
┌──────────────────────────────────────────────────────────────────┐
│  LEFT SIDEBAR (240px, persistent, collapsible to 60px)          │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────────────┐   │
│  │ SIDEBAR         │  │ MAIN CONTENT AREA                   │   │
│  │ (240px)         │  │ (fills remaining width)             │   │
│  │                 │  │                                     │   │
│  │                 │  │    ┌─────────────────────────────┐  │   │
│  │                 │  │    │ RIGHT CONTEXT PANEL (320px)  │  │   │
│  │                 │  │    │ slides in when record opened │  │   │
│  │                 │  │    └─────────────────────────────┘  │   │
│  └─────────────────┘  └─────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘

SIDEBAR STRUCTURE:
  TOP:
    Dealer logo (40px square) + Business name (truncated)
    Plan badge (Free/Starter/Pro/Business)
    Collapse arrow (→ icon-only mode at 60px)

  PRIMARY NAV (icon + label):
    🏠 Dashboard
    🚗 Inventory
    👥 CRM
    📋 Deals
    📊 Analytics

  SECONDARY NAV (smaller, below divider):
    🌐 Website & Marketing
    ⚡ Automation Hub
    ⚙️  Settings

  BOTTOM:
    Language toggle: EN | বাংলা
    Help button → WhatsApp support link
    User avatar + name + role chip
    Sign out

SIDEBAR COLLAPSED STATE (60px):
  Shows: icons only, no labels
  Hover: tooltip showing section name
  All functionality preserved

RIGHT CONTEXT PANEL (320px):
  Slides in from right when:
    → User clicks a vehicle row in inventory list
    → User clicks a lead card in CRM pipeline
    → User clicks a deal in deals list
  Content: abbreviated record view
  [Open Full Record] button → navigates to full-screen view
  [×] to close → panel slides out
```

### 3.2 Mobile Layout (< 768px)

```
BOTTOM TAB NAVIGATION (5 tabs, fixed at bottom):
  Home | Inventory | CRM | Deals | More (⋯)

  TAB: Home → Dashboard (Morning Briefing default)
  TAB: Inventory → All Vehicles list
  TAB: CRM → Pipeline (Kanban) or Lead list
  TAB: Deals → Active Deals list
  TAB: More → Analytics, Automation Hub, Settings, Website, Logout

  Tab bar height: 56px (safe area inset aware for iPhone notch)
  Active tab: primary color fill + label
  Badge: red dot on CRM if new unread leads

FLOATING ACTION BUTTON (FAB):
  Position: bottom-right, 16px from edges, 72px above tab bar
  Size: 56px circle, primary-600 background, white icon
  Context-sensitive label (on press):
    Inventory section: "Add Vehicle" → opens VIN scan
    CRM section:       "Add Lead"    → opens new lead form
    Deals section:     "New Deal"    → opens deal creation

MOBILE SCREEN STATES:
  Full-screen detail views (no sidebar)
  Back button: top-left arrow, always present when navigated forward
  Swipe-right gesture: navigates back (one level)
  Pull-to-refresh: on all list views
```

### 3.3 Primary Navigation — Section Structure

```
1. DASHBOARD
   Default view: Morning Briefing
   Sub-view: Activity Feed (tap to switch)

2. INVENTORY
   Sub-items (top tab bar on desktop, swipe tabs on mobile):
   All Vehicles | Add Vehicle | Recon Queue | Aging Watchlist

3. CRM
   Sub-items:
   Pipeline (Kanban) | All Leads | Follow-ups Today | Customers

4. DEALS
   Sub-items:
   Active Deals | Completed | Expenses | Documents

5. ANALYTICS
   Sub-items:
   Maestro Insights | Performance | Reports | Daily Summary History

6. WEBSITE & MARKETING (secondary)
   Sub-items:
   Website Settings | SEO | Channel Connections | Post History | Analytics

7. AUTOMATION HUB (secondary)
   Sub-items:
   WhatsApp | Facebook | Social Media | Marketing | Automation Logs

8. SETTINGS (secondary)
   Sub-items:
   Business Profile | Team Members | Roles & Permissions | Subscription | Billing
```

---

## 4. Dealer OS — Screen Implementations

### 4.1 Dashboard — Morning Briefing

```
HEADER:
  "Good morning, [Owner First Name] 👋"
  Date: "Monday, 15 January 2025"

SECTION 1 — Yesterday's Snapshot (3 metric cards):
  [Sales: 2] [Revenue: BDT 28.5L] [New Leads: 7]
  Cards tap-through to: Deals list / Analytics / CRM
  If 0 sales: "Quiet day yesterday" in neutral tone (not alarming)

SECTION 2 — Urgent Actions (up to 3 items):
  Each item: icon + message + count + [Act Now →] button
  Examples:
    🔴 "3 leads uncontacted for 2+ hours"  [View Leads →]
    🟠 "SK-0034 on lot 60 days. Reduce price?" [Reprice →]
    🟡 "2 deals pending your approval" [Review →]
  Empty state: "✅ Nothing urgent today. Great start!"

SECTION 3 — Market Snapshot (collapsed by default, tap to expand):
  "Toyota Axio up 8% in Dhaka this month — you have 3 in stock"
  "Honda Fit prices stable"
  Each item: make/model | trend arrow | % change | your stock count

SECTION 4 — Top Maestro Insight (if priority >= 7):
  Insight card (full width):
    [Insight type icon] [Title]
    Message (2 lines max, truncated)
    [Take Action →] deeplink button
    [Dismiss] text button

ACTIVITY FEED TAB (alternate view):
  Chronological stream:
    "10:32 AM — New lead: Rafiq Hasan → Toyota Axio (Marketplace)"
    "09:15 AM — Deal SK-0022 approved by Manager"
    "08:44 AM — 2019 Honda Fit price updated: BDT 12.8L"
    "08:00 AM — Daily summary delivered to owner"
  Infinite scroll, last 48 hours
  Filter: All | Leads | Deals | Inventory | Automation
```

### 4.2 Vehicle Stock Card (Full Screen)

```
HEADER:
  Stock Number: SK-2025-0034 (monospace, copyable)
  Status badge: [Available] (color-coded per status)
  [Edit] button (manager+) | [⋮ More actions] menu

PHOTO GALLERY:
  Primary photo: large hero (aspect 4:3)
  Thumbnail strip below: tap to switch primary view
  Photo count: "8 of 12"
  [Add Photos] button (all roles)
  [Reorder] button (manager+) → drag-to-sort mode

CORE SPECS ROW (horizontal scroll on mobile):
  Year | Make | Model | Mileage | Fuel | Transmission

TABS (desktop: horizontal tabs; mobile: swipe):
  [Overview] [Recon] [Expenses] [Profit*] [Marketplace] [History]
  *Profit tab: HIDDEN from salesperson (not rendered in DOM)

TAB: Overview
  Two columns (desktop) / single column (mobile):
    Left: full specs list
      Body type | Engine CC | Color | Condition | Variant
      Acquisition date | Acquisition source | Acquired from
      Available since | Days on lot (with aging badge if triggered)
    Right: financial summary (owner/manager — masked for salesperson)
      Asking price: BDT X,XX,XXX (large, bold)
      Acquisition cost: BDT X,XX,XXX
      Recon total: BDT X,XX,XXX
      Estimated profit: BDT X,XX,XXX (color: green if positive, red if negative)
      [Adjust Price] inline edit button (manager+)

  Internal notes (manager/owner only):
    Text display with [Edit] button

TAB: Recon
  Assessment checklist (8 categories):
    Each row: Category | Status chip (Ok/Needs Work/Critical) | [Edit]
  Recon Tasks list (if any tasks created):
    Task: description | assigned to | estimated | actual | status
    [Mark Complete] button on in-progress tasks (with actual cost input)
    [Add Task] button
  Progress bar: X of Y tasks complete
  Completion prompt: "All tasks done! Mark vehicle as Available →"

TAB: Expenses (Type 1)
  Total recon cost: BDT X,XX,XXX (prominent)
  Expense list table:
    Date | Category | Amount | Vendor | Receipt | [Edit]
  [Add Expense] button → inline form (category, amount, vendor, date, receipt photo)
  Hidden entirely from salesperson role

TAB: Profit *(owner/manager only)
  Profit calculator card:
    Asking Price:     BDT 15,50,000
    − Acquisition:    BDT 11,00,000
    − Recon total:    BDT  1,20,000
    − Deal expenses:  BDT     0 (if no deal yet)
    ─────────────────────────────
    Net Profit:       BDT  3,30,000  (21.3% margin)
  Live-updates as expenses are added
  If asking_price < breakeven: row shows red with warning icon
  [Adjust asking price] button → opens inline price editor

TAB: Marketplace
  Sync status:
    "Last synced: 2 minutes ago ✅" or "Sync error ⚠️ [Retry]"
  Marketplace toggle:
    "Published to AutoVerse Marketplace" [toggle ON/OFF]
  IMV widget:
    Deal rating badge (Great Deal / Good Deal / Fair Price / Overpriced / Unrated)
    Price comparison bar (p25 | YOUR PRICE | p75)
    "BDT X below/above market average"
    Sample size note: "Based on 23 comparable listings"
  Listing preview button: "View on Marketplace →" (opens in new tab)
  Distribution channels (if Professional+):
    Google Merchant Center: ✅ Live / ❌ Not connected
    Facebook Catalog: ✅ Live / ❌ Not connected

TAB: History
  Timeline of all status changes:
    [Date/Time] Status changed from [X] to [Y] by [Name] — [reason if any]
  Timeline of sync events: last 10 sync operations with status
  Timeline of price changes: asking_price history

BOTTOM ACTION BAR (mobile, context-sensitive):
  Available status:
    [WhatsApp Share] [Create Deal] [Reprice]
  In-recon status:
    [View Recon Tasks] [Add Recon Task]
  Reserved status:
    [View Deal] [Release Reserve]

⋮ MORE ACTIONS MENU (all statuses):
  Force Sync to Marketplace | Print Stock Card | Archive | Delete (manager+)
```

### 4.3 CRM Pipeline — Kanban View

```
KANBAN BOARD:
  Columns: New | Contacted | Qualified | Test Drive | Quote Sent | Negotiation
  Horizontal scroll (mobile: swipe between columns)
  Column header: Stage name + lead count badge
  [+ Add Lead] button in "New" column header

  LEAD CARD (in each column):
    Buyer name (bold) + source badge (e.g., "Marketplace")
    Vehicle interest: "[Year] [Make] [Model]"
    Lead score badge: 🔥 Hot / 🌡 Warm / 🧊 Cold
    Time in stage: "2 hours" (amber if > 24h, red if > 72h)
    Assigned to: avatar (24px)
    Quick actions row: [WhatsApp icon] [Call icon] [Note icon]

  DRAG BEHAVIOR:
    Desktop: drag card between columns
    Mobile: tap card → bottom sheet with stage selector (faster than drag)
    Salesperson can only move OWN leads (role-filtered)

  KANBAN FILTERS (header bar):
    Assigned to: [All] [Mine] [Unassigned]
    Source: All | Marketplace | Facebook | WhatsApp | Walk-in
    Priority: All | Hot | Warm | Cold
    Vehicle: search by make/model

LEAD CARD — Full Detail View (tap on card):
  Fills screen on mobile; slides into right panel on desktop

  HEADER:
    Buyer name + phone (tap to call) + WhatsApp button (large, prominent)
    Source badge + lead score badge + priority badge
    Stage: [dropdown to change stage] (owner/manager can change any lead)
    Assigned to: [avatar + name] + [Reassign] button (manager+)

  TABS: [Overview] [Timeline] [Follow-up] [Vehicle] [Customer]

  TAB: Overview
    Buyer info: name, phone, email, district
    Vehicle of interest: thumbnail + make/model/year + [View Stock Card →]
    Budget range: BDT X – BDT Y
    Lead source: Marketplace (with UTM details if available)
    Notes: text area (auto-saves on blur)
    Next follow-up: date/time chip + [Reschedule] button

  TAB: Timeline
    Chronological interactions:
      [icon] [Date] [Type] [Summary]
      📞 "15 Jan, 10:30 AM — Outbound call — Discussed pricing, interested"
      💬 "15 Jan, 11:00 AM — WhatsApp sent — Day 0 auto-reply"
      ⭐ "15 Jan, 12:15 PM — Score updated +15 — Viewed vehicle 3× today"
      📋 "15 Jan, 02:00 PM — Stage changed — New → Contacted by Salesman A"
    [+ Log Interaction] button → bottom sheet:
      Type: Call | WhatsApp | In-person | Note
      Duration (for calls): [X] minutes
      Summary: text field
      [Save]

  TAB: Follow-up
    Next follow-up card:
      Date/time (large) | Method (SMS/WhatsApp/Call/In-app)
      [Change Date] [Change Method]
    Reminder note: "WhatsApp reminder will fire automatically"
    Follow-up history: previous follow-ups with status (done/missed/rescheduled)
    [Mark Follow-up Done] large button

  TAB: Vehicle
    Vehicle card:
      Primary photo | Year Make Model
      Asking price | Days on lot | Deal rating badge
      [View Full Stock Card →]
    Similar vehicles: 2 thumbnails (same make, similar price)

  TAB: Customer
    Customer profile summary:
      Purchase history count | Total spend
      Communication preferences (SMS/WhatsApp/Email opt-in status)
    [View Full Customer Profile →]

  BOTTOM ACTION BAR (mobile):
    [WhatsApp] [Log Call] [Schedule Follow-up] [Convert to Deal]
    Lost button: smaller, secondary style (prevents accidental tap)

  LOST FLOW:
    Tap [Mark as Lost] → mandatory bottom sheet:
      "Why was this lead lost?"
      Reason buttons (large tap targets, 6 options):
        Price too high | Found elsewhere | Changed mind |
        No response | Financing failed | Other
      [Other] → text field (min 10 chars)
      [Confirm Lost] button
```

### 4.4 Deal Record

```
DEAL HEADER:
  Deal number: DEAL-2025-0089 (monospace)
  Status badge: [Draft] / [Pending Approval] / [Approved] / [Delivered] / [Cancelled]
  Vehicle: "[Year] [Make] [Model] — SK-0034" + thumbnail
  Buyer: [Name] + [Phone]
  Created: [date] by [salesperson name]

STATUS-SPECIFIC BANNER:
  Pending Approval: amber banner
    "Awaiting manager approval for BDT X,XXX discount"
    [Approve Deal] [Reject] buttons visible to manager/owner ONLY
  Approved: green banner
    "Deal approved by [Manager Name] on [date]"
  Delivered: info banner
    "Delivered on [date]. Post-sale automation started."

TABS: [Deal Sheet] [Documents] [Payments] [Expenses] [Profit*] [Timeline]
*Profit: owner only

TAB: Deal Sheet
  Deal Terms section:
    Deal type: [Cash / Finance / Exchange] (radio — editable in draft only)
    List price: BDT X (auto-filled from vehicle.asking_price)
    Sale price: BDT X (editable, validates against discount_threshold)
    Discount: BDT X (auto-computed: list - sale)
    Discount %: X% (auto-computed)
    [⚠️ Exceeds threshold] warning if > dealership.discount_threshold_pct

  Finance section (if deal_type = finance, collapsible if cash):
    Lender | Loan amount | Down payment | Rate % | Term (months) | Monthly instalment
    EMI calculator: [Calculate] auto-fills monthly_instalment

  Trade-in section (collapsible):
    Trade-in vehicle: make, model, year, mileage, condition
    Agreed trade-in value: BDT X

  Buyer details:
    Full name | Phone | NID | Address | District

  Delivery details:
    Delivery date | Delivery address | Notes

  [Generate Bill of Sale] button (manager+, when deal = approved)
  [Submit for Approval] button (salesperson, when deal = draft)
  [Mark as Delivered] button (manager+, when deal = approved)

TAB: Documents
  Bill of Sale PDF: thumbnail + "Download" + "Send via WhatsApp" + version label
  Upload section: drag/drop or camera (mobile)
    Finance approval letter | Insurance | Registration copy | Other
  Document list: name | type | uploaded by | date | [View] [Delete]

TAB: Payments
  Outstanding balance: BDT X,XX,XXX (large, prominent)
  Progress bar: total paid / sale price
  Payment records table: date | type | amount | method | reference | recorded by
  [Record Payment] button → inline form:
    Type: Deposit | Instalment | Final payment
    Amount | Method | Reference | Notes | [Save]

TAB: Expenses (deal-level costs)
  Deal costs: registration fees, delivery, misc
  Same structure as vehicle_expense but scoped to deal

TAB: Profit (owner only)
  Same calculator as vehicle Profit tab but including deal-level costs

TAB: Timeline
  All deal events in chronological order:
    Created | Submitted for approval | Approved | Payment recorded | Delivered | etc.
```

### 4.5 Analytics — Performance View

```
DATE RANGE SELECTOR:
  Chips: Today | This Week | This Month | Last Month | Last 90 Days | Custom
  Custom: date range picker (calendar)

METRICS GRID (2×3 on desktop, single column on mobile):
  Units Sold | Revenue | Gross Profit | Lead Conversion % | Avg Days to Sell | Leads Today

CHART 1 — Sales Trend:
  Line chart: units sold per day (selected period)
  Toggle: Revenue overlay (second Y-axis)

CHART 2 — Lead Funnel:
  Funnel chart: New → Contacted → Qualified → Test Drive → Quote → Negotiation → Closed
  Conversion rate at each stage shown
  Drop-off amounts shown (e.g., "38 leads dropped here")

CHART 3 — Source Performance:
  Bar chart: leads by source | conversion rate per source
  Sources: Marketplace | Facebook | WhatsApp | Walk-in | Website | Referral

CHART 4 — Inventory Performance:
  Avg days to sell per make/model (horizontal bar)
  Sorted by fastest-selling
  Rolling 90-day data

STAFF PERFORMANCE TABLE (owner/manager only):
  Salesperson | Leads handled | Deals closed | Conversion % | Avg response time | Revenue generated
  Sortable columns
  Salesperson sees only own row

ROLE-FILTERED METRICS:
  Salesperson: sees only own metrics (units, leads, conversion)
    Revenue and GP cells show "—" (not blank, not error)
  Manager: sees team data, no cost/margin
  Owner: full data
```

### 4.6 Maestro Insights View

```
INSIGHTS LIST (up to 5 cards):

  INSIGHT CARD:
    ┌──────────────────────────────────────────────────────┐
    │ [ICON] [TYPE BADGE]                Priority dot      │
    │ Title (bold, 1 line)                                 │
    │ Message (2-3 lines, plain language)                  │
    │                                                      │
    │ Supporting stat (small, gray):                       │
    │ "Based on 52 days on lot / 23 avg days in district"  │
    │                                                      │
    │ [Take Action →]              [Dismiss]               │
    └──────────────────────────────────────────────────────┘

  ICON + BADGE colors:
    PRICING:        💰 amber badge
    DEMAND:         📈 green badge
    CONVERSION:     🎯 red badge (highest urgency)
    EXPENSE:        🧾 orange badge
    AUTOMATION:     ⚡ blue badge
    RECON_QUALITY:  🔧 gray badge

  ACTIONED STATE:
    Card fades to 50% opacity
    Checkmark icon + "Actioned" label
    Stays visible 24h then archived

  EMPTY STATE (when all actioned/dismissed):
    "✅ All insights actioned. Check back tomorrow morning."
    Small note: "Maestro refreshes nightly at 2:00 AM."

INSIGHT HISTORY TAB:
  Previous insights table: date | type | message preview | actioned/dismissed
  Filterable by type
  Last 30 days retained
```

---

## 5. Automation Hub UI

### 5.1 Hub Overview

```
AUTOMATION HUB SHELL:
  Left: channel selector (vertical tabs):
    💬 WhatsApp | 📘 Facebook | 📱 Social Media | 📧 Marketing | 📋 Logs
  Right: content area for selected channel

CHANNEL STATUS BADGES (in left nav):
  Each channel shows: Active rules count + connection status dot
  WhatsApp: "3 rules · ✅ Connected" or "⚠️ Not configured"
  Facebook: "2 rules · ✅ Connected"
  Social: "Auto-post ON"
  Marketing: "2 sequences active"
```

### 5.2 WhatsApp Channel View

```
CONNECTION STATUS CARD (top):
  If Basic (WA Business app):
    Status: "Basic WhatsApp Active"
    Features available: Greeting, Away message, Quick Replies
    [Upgrade to Advanced] CTA

  If Advanced (WABA API):
    Status: "WhatsApp Business API Connected ✅"
    Account name, phone number, business manager
    Token status: "Expires in 47 days" (amber if < 14 days)
    [Reconnect] button

─────────────────────────────────────────────────────────────────
RULE CARDS (Basic tier):

GREETING MESSAGE card:
  Toggle: [ON/OFF]
  Preview: message text (truncated, 2 lines)
  [Edit] → opens template editor modal

AWAY MESSAGE card:
  Toggle: [ON/OFF]
  Active hours display: "Mon–Fri 9AM–6PM, Sat 9AM–5PM"
  Preview: away message text
  [Edit] → opens editor
  [Set Business Hours] link → Settings

QUICK REPLIES card:
  Title: "Quick Replies (10 saved)"
  Mini list: first 3 templates shown
  [Edit All Templates] button → opens full template editor

─────────────────────────────────────────────────────────────────
SEQUENCE CARDS (Advanced tier, Professional+):

LEAD FOLLOW-UP SEQUENCE card:
  Toggle: [ON/OFF]
  Visual sequence timeline (horizontal):
    Day 0 ──● Day 1 ──● Day 3 ──● Day 7
    Each dot: tappable (shows step preview)
  Step count: "4 steps configured"
  [Edit Sequence] button

  SEQUENCE EDITOR (full-screen modal or new screen):
    Steps list (vertical):
      Step 1: Day 0 — Instant Reply
        Channel: WhatsApp | Template: lead_instant_reply | Condition: always
        [Preview] → rendered message with dummy data
        [Edit step] → opens step editor
        [Delete step]

      Step 2: Day 1 — Follow-up
        [Preview] [Edit] [Delete]
        Condition chip: "if no reply"

      [+ Add Step] button
    Footer: [Save Sequence] [Cancel]

  STEP EDITOR (within sequence editor):
    Step number (auto)
    Delay: [X] hours/days after [previous step / sequence start]
    Condition: dropdown (always / no reply / lead not cold / custom)
    Channel: WhatsApp (locked for WhatsApp sequence)
    Template: dropdown of available templates
    [Preview with sample data]

ABANDONED LEAD RECOVERY card:
  Toggle + description + [Edit Message] button

POST-SALE SEQUENCE card:
  Toggle + 4-step timeline + [Edit Sequence]

NEW INVENTORY ALERT card:
  Toggle + targeting description + [Configure Targeting]

─────────────────────────────────────────────────────────────────
THIRD-PARTY ADAPTERS section:
  "Connect an advanced WhatsApp provider:"
  Provider cards: ManyChat | AiSensy | Kommo | respond.io
  [Connect] button per provider → opens connection wizard

TEMPLATE EDITOR (shared component, used by all WhatsApp rule editors):
  Template name input
  Body textarea with variable chips:
    Available variables shown below: [{{buyer_name}}] [{{vehicle_make}}]
    Click chip → inserts at cursor position
  Character count
  [Preview] → renders with dummy data on mock phone
  Language toggle: EN / বাংলা (separate template per language)
  [Save Template]
```

### 5.3 Facebook Channel View

```
CONNECTION CARD:
  If not connected:
    [Connect Facebook Business Manager] button
    Instructions: "Connect to enable auto-replies, lead ad sync, and catalog sync"
  If connected:
    Page name + page avatar
    Instagram: connected/not connected
    System User Token: expires [date]
    [Disconnect] button (danger, confirm required)

RULE SECTIONS:

INBOX AUTOMATION:
  Auto-reply toggle + message preview + [Edit]
  Away message toggle + message preview + [Edit]
  Keyword triggers list:
    Row: "price" → [template name] [Edit] [Delete]
    [+ Add Keyword Rule] button
    Max 20 rules (counter shown)

INBOX ROUTING toggle:
  "Automatically tag messages with vehicle of interest"
  ON/OFF toggle + [Configure routing rules]

LEAD ADS SYNC:
  Status: "Facebook Lead Ads sync active ✅"
  Ad accounts listed: account name + account ID
  Leads synced (last 30 days): [N]
  Avg sync time: [X] seconds
  [Manage Ad Accounts] button

POST SCHEDULING:
  Auto-post toggle: "Automatically post new vehicles to Facebook + Instagram"
  Posts per day: [1] [2] [3] (stepper, max 3)
  Approval required toggle: "Require approval before posting"
  Optimal time: [09:00 AM] time picker (based on Insights data)
  [View Post Queue] button → navigates to Social Media tab
```

### 5.4 Social Media Channel View

```
CAMPAIGN MANAGER section:
  Schedule: [3] posts per week (stepper)
  Days: checkboxes Mon–Sun (select which days)
  Time: time picker
  [Enable Scheduled Posting] toggle
  Preview: "Next posts scheduled: Tuesday 9 AM, Thursday 9 AM, Saturday 12 PM"

POST QUEUE table:
  Columns: thumbnail | vehicle | platform icons | scheduled time | status | actions
  Statuses: Draft | Pending Approval | Scheduled | Published | Failed
  Row actions: [Preview] [Edit] [Approve] [Cancel] [Retry]

  [+ Create Post] button:
    Opens post creator:
      Vehicle selector (search from inventory)
      Platform: [Facebook] [Instagram] checkboxes
      Caption: pre-filled from template + editable
      Hashtags: auto-generated + editable
      Schedule: date/time picker or [Post Now]
      Preview panel: mobile mockup of how post will look

POST HISTORY table:
  Past posts: thumbnail | caption preview | platform | date | reach | engagement | clicks
  Filter by: date range | platform | vehicle type

SOCIAL ANALYTICS section (weekly summary):
  Best-performing vehicle type: "SUVs get 2× more engagement than sedans"
  Best posting time: "Thursday 8 PM gets 35% more reach"
  Avg engagement rate: X%
  Leads generated from social (last 30 days): [N]
```

### 5.5 Marketing Channel View

```
EMAIL SEQUENCES section:
  Sequence cards:
    Welcome/New Lead sequence: [ON/OFF] | 3 emails | last sent [date]
    Post-Sale sequence: [ON/OFF] | 3 emails
    Win-Back sequence: [ON/OFF] | 1 email
  [Edit] per sequence → sequence editor (same structure as WhatsApp)

LEAD SCORING section:
  Visual: "Hot Lead threshold: 70 points"
  Score scale graphic: Cold 0 ──── 40 Warm ──── 70 Hot
  Hot lead SMS template: preview + [Edit]
  [View Score Components] → popup showing all 15 signals + weights

SMS CAMPAIGNS section:
  [+ New Campaign] button:
    Campaign name input
    Segment selector:
      All customers | Recent buyers (90d) | Active leads | By district | By make preference
    Estimated recipients shown live: "~230 contacts"
    Message editor: 160-char counter + [Preview on phone]
    Opt-out text: auto-appended indicator "Reply STOP to unsubscribe"
    Schedule: [Send Now] [Schedule]
    [Review & Send] → confirmation with exact count + cost (SMS credits)

  Campaign history table:
    Name | Sent | Delivered % | Replied % | Leads generated | Date

PERSONALIZED LINKS section:
  Status: "Active for 34 leads"
  Description: "Each lead gets a unique URL showing inventory matching their preferences"
  Example URL: "dealer.autoverse.com.bd/for/[token]"
  [View Link Clicks] → table of which leads viewed their link + how many times
```

### 5.6 Automation Logs View

```
FILTERS ROW:
  Channel: All | WhatsApp | Facebook | Email | SMS | Push
  Status: All | Sent | Delivered | Failed | Skipped
  Date: Last 7 days | Last 30 days | Custom
  Search: contact name or phone

LOG TABLE:
  Columns:
    Time | Contact | Channel icon | Template | Status badge | Trigger event | [Details]

ROW DETAIL (expandable):
  Full message text
  Template used + variables resolved
  Provider response (e.g., Meta message ID, Greenweb delivery status)
  Error message (if failed)
  Retry count
  Related lead → [View Lead Card]

AGGREGATE STATS (above table):
  Messages sent | Delivery rate | Failure rate | Response rate | Opt-outs
  Time range aligned to current filter

MONTHLY SUMMARY card:
  "This month: 847 messages sent. 94.2% delivered. 31% response rate.
   3 leads converted from automation. 2 opt-outs."
```

---

## 6. Website Builder UI

### 6.1 Setup Wizard (< 10 minutes)

```
WIZARD SHELL:
  Progress bar (4 steps) at top
  Step labels: Brand Setup → Live Review → Domain (optional) → Channels (optional)
  [Save & Continue] / [Back] buttons
  Exit link: "Finish later" (saves draft, returns to website settings)

STEP 1 — Brand Setup:
  Business name: pre-filled from dealership.business_name (editable)
  Tagline: text input (placeholder: "Your trusted used car dealer in Dhaka")
  Logo: upload component (drag/drop or camera on mobile)
    Preview: 40px × 40px circle crop
  Brand color: color picker
    Presets: 6 recommended colors (automotive: blue, dark gray, red, green, black, orange)
    Custom: hex input
  Phone: pre-filled from dealership.phone
  WhatsApp: pre-filled from dealership.whatsapp_number
  Business hours: simple form
    Mon–Fri: [09:00] to [18:00]
    Saturday: [09:00] to [17:00]
    Sunday: [Closed] toggle

  LIVE PREVIEW (right side on desktop, below form on mobile):
    Mock phone screen showing dealer website header with current settings
    Updates in real-time as fields change

STEP 2 — Live Review:
  Heading: "🎉 Your website is live!"
  URL display: [dealer-slug.autoverse.com.bd] with copy button
  [View Live Site →] button (opens in new tab)
  Preview panel: desktop + mobile viewport toggle showing actual live site
  Inventory confirmation:
    "X vehicles have been automatically added from your inventory"
    Vehicle thumbnails (first 4)
  [Share Your Website] section:
    Pre-written WhatsApp message: "Check out our inventory: [url]"
    [Share on WhatsApp] button
    [Copy Link] button

STEP 3 — Custom Domain (optional, skippable):
  "Connect your own domain (e.g., cars.yourbusiness.com.bd)"
  [Skip for now] link (prominent)
  Input: domain field (placeholder: "cars.yourbusiness.com.bd")
  [Check Availability]
  If domain entered:
    CNAME instructions card:
      DNS Provider: [dropdown: Cloudflare | GoDaddy | Namecheap | BD Domain | Other]
      Instructions tailored to selected provider
      Copy box: "Name: cars | Value: dealer.autoverse.com.bd | TTL: 3600"
    Verification: [Verify DNS] button → polling starts
    Status: "Checking... (may take up to 5 minutes)" → spinner → ✅ Verified / ❌ Not found yet

STEP 4 — Channel Connections (optional):
  "Connect marketing channels to reach more buyers"
  Connection cards (checkboxes):
    ☐ Google Analytics 4
      [Connect GA4] → OAuth flow
    ☐ Facebook & Instagram
      [Connect Facebook Business Manager] → Meta OAuth
      Enables: Pixel tracking, Catalog sync, Lead Ad sync
    ☐ Google Merchant Center
      [Connect GMC] → Google OAuth
      Enables: Google Shopping listings (Professional+ only)
  [Finish Setup] button
```

### 6.2 Website Settings (Post-Setup)

```
TABS: General | SEO | Channel Connections | Templates

TAB: General
  All Step 1 fields (editable)
  Custom domain section:
    Current domain status + [Change Domain] / [Remove Domain]
  Website status toggle: [Live] / [Maintenance Mode]
  Maintenance message editor (shown to visitors when in maintenance)

TAB: SEO
  Meta title pattern:
    Template editor: "{Year} {Make} {Model} for Sale in {District} | {Dealer Name}"
    [Preview] how it looks in Google search results (mock SERP snippet)
  Meta description pattern:
    Template + character count (max 160)
  Google Search Console:
    Status: Verified ✅ / Not verified
    Sitemap: "Last submitted: [date]. [N] URLs indexed."
    [Resubmit Sitemap] button
  Structured data: "Schema.org/Vehicle markup: Active ✅"

TAB: Channel Connections
  Card per channel: connection status + last sync time + [Disconnect] / [Reconnect]
  Facebook Pixel: Pixel ID | Events firing | [View in Events Manager →]
  Google Analytics: Property ID | Sessions (last 7 days sparkline)
  GMC: Merchant ID | Active items | Last sync | Rejection rate

TAB: Templates
  Page type selector: Vehicle Listing | Home | About | Contact
  Per page: template preview + [Customize] (Phase 2 — basic customization only at MVP)
```

---

## 7. Marketplace UI

### 7.1 Homepage

```
ABOVE FOLD:
  Header: AutoVerse logo | [List Your Car] | [Sign In]
  Hero search bar (prominent, full-width):
    Placeholders (rotating): "Search Toyota Axio in Dhaka..." / "Find your next car..."
    Quick filters below bar:
      [All] [Under BDT 10L] [Hybrid] [SUV] [Sedan] [Dhaka]
    [Search] button

FEATURED VEHICLES section (if featured slots active):
  "Featured Listings" heading
  2×3 grid (desktop) / horizontal scroll (mobile)
  "Featured" badge on each card

DEAL RATING SHOWCASE:
  "Great Deals Near You"
  Cards filtered: deal_rating = 'great_deal', district = user's district (geolocation)
  [See All Great Deals →] link

BROWSE BY MAKE:
  Logo grid: top 8 makes (Toyota, Honda, Nissan, Suzuki, Mitsubishi, Hyundai, BMW, Mercedes)
  [See All Makes →]

BROWSE BY BODY TYPE:
  Icon + label grid: Sedan | SUV | Hatchback | Pickup | Minivan
  Tappable, navigates to /cars?body_type=sedan etc.

PRICE TRENDS TEASER:
  "What's happening with used car prices in Dhaka this month?"
  2–3 trend chips: "Toyota Axio ↑ 8%" | "Honda Fit ↓ 3%" | "Suzuki Alto stable"
  [View Full Trends →] link

C2C SELL CTA:
  "Want to sell your car? Get an instant market price estimate."
  [Get Your Car's Value] button → /value-my-car
  [List Your Car] button → /sell

FOOTER:
  Make/model browse links (SEO) | District browse links | How IMV works
  About | Contact | Privacy Policy | Terms
```

### 7.2 Search Results Page

```
LAYOUT (desktop): 280px left filter panel + main results area
LAYOUT (mobile): filter bar + stacked results (filter panel = bottom sheet)

LEFT FILTER PANEL:
  Location: district dropdown (auto-detected, editable)
  Price range: dual-handle slider + BDT min/max inputs
  Make: search + checkbox list (most common first)
  Model: appears after make selected
  Year: range slider (1990–current year)
  Mileage: range slider (0–200,000 km)
  Body type: visual chips (Sedan | SUV | Hatchback | etc.)
  Fuel type: chips (Petrol | Diesel | Hybrid | Electric | CNG)
  Transmission: chips (Auto | Manual)
  Condition: chips (Used | Reconditioned | New)
  Deal rating: checkboxes
    ☐ Great Deal  ☐ Good Deal  ☐ Fair Price  ☐ Overpriced  ☐ No Rating
  Seller type: chips (All | Dealer | Private)
  [Apply Filters] button (mobile only — desktop applies instantly)
  [Clear All] link

SORT BAR (above results):
  Sort by: Best Deal | Newest | Price ↑ | Price ↓ | Mileage ↑ | Most Viewed
  View toggle: [Grid] [List]
  Result count: "Showing 1,247 cars"

VEHICLE CARD (grid view):
  Primary photo (aspect 4:3)
  Deal rating badge (top-right of photo)
  "Price Reduced" badge (if price_drop_flag = true, last 48h)
  "Featured" badge (if is_featured)
  Title: "2019 Toyota Axio" (bold)
  Specs row: [Year] [Mileage] [Fuel] [Transmission]
  Price: "BDT 14,50,000" (large)
  Market note: "BDT 45,000 below market avg" (small, color-matched to rating)
  Location: "Dhaka · 2 days ago"
  WhatsApp button (icon only, right-aligned)

VEHICLE CARD (list view):
  Smaller thumbnail (left) + expanded text info (right)
  All same data, more specs visible
  WhatsApp + Enquire buttons visible

RESULTS STATE MANAGEMENT:
  Loading: skeleton grid (6 cards)
  No results: "No cars found matching your filters. Try:"
    + 3 suggested relaxations (remove mileage filter / expand price range / change district)
  Error: "Search temporarily unavailable. Try again." + refresh button

SAVE SEARCH:
  "Save this search" appears after 2+ filters applied
  [Save Search] → prompts sign in if not logged in
  Saved alert: "We'll notify you when new cars match this search"
  Notification method: Push | SMS | Email (selector)
```

### 7.3 Vehicle Detail Page

```
LAYOUT (desktop): main content (2/3) + sticky sidebar (1/3)
LAYOUT (mobile): single column, WhatsApp button floating above keyboard

STICKY SIDEBAR (desktop):
  Price: BDT 14,50,000 (36px bold)
  Deal rating badge
  Market comparison:
    Low [bar] Your Price [bar] High
    "BDT 45,000 below market avg"
  [WhatsApp] button (full width, green, 48px)
    Pre-filled message auto-generated
  [Enquire] button (outline, 48px)
  Dealer mini-card:
    Logo + name + district + rating stars
    "Verified Dealer ✅"
    "X cars available"
    [View All Cars →]

MAIN CONTENT (left):
  Photo Gallery:
    Primary photo: full width, aspect 16:9
    Thumbnail strip: horizontal scroll, 80px squares
    Photo count badge: "8 / 12"
    [Expand] → lightbox

  Quick Specs bar (horizontal, sticky on scroll):
    Year | Mileage | Fuel | Transmission | Color | Condition

  IMV Price Intelligence box:
    Heading: "Market Range for Similar Cars in Dhaka"
    Three-point bar:
      Low (p25): BDT 12.5L ─────●─────── High (p75): BDT 16.8L
      Your price: ●
    "This car: BDT 14.5L (BDT 45,000 below market average)"
    Sample note: "Based on 23 comparable listings · Updated today"

  Full Specifications section (expandable):
    Table: Spec | Value (two columns)
    All specs from vehicle.specs JSONB + core fields

  Features list (if configured):
    Chips: [AC] [Power Windows] [Reverse Camera] [Navigation] etc.

  Similar Listings (3–5 cards, horizontal scroll on mobile)

  Price History (collapsible, shown if price changed since listing):
    Simple chart: price over time for THIS listing
    "Listed at BDT 16.5L on 1 Jan → Reduced to BDT 14.5L on 20 Jan"

  About the Dealer section:
    Description | Location map embed | Business hours

MOBILE-SPECIFIC:
  Floating [WhatsApp] bar (fixed at bottom above keyboard): full-width green button
  Photo gallery: native swipe between photos
  Specs: horizontal scroll row
```

### 7.4 C2C Listing Wizard

```
PROGRESS STEPPER: Step 1 of 5 (top, non-skippable)
[Back] [Continue] navigation at bottom of each step

STEP 1 — Car Details:
  Make: searchable dropdown → loads models for selected make
  Model: dependent dropdown (loads after make selected)
  Year: numeric input (validation: 1985–current)
  Variant: text input (optional, placeholder: "G Grade / X Grade / etc.")
  Mileage: number input + "km" suffix (validation: 0–500,000)
  Fuel type: large radio buttons with icons
    ⛽ Petrol | ⛽ Diesel | 🔋 Hybrid | 🔌 Electric | 🔄 CNG
  Transmission: large radio buttons
    🔄 Automatic | ⚙️ Manual | ∞ CVT

STEP 2 — Condition & Features:
  Condition assessment (8 categories, 3-option toggle each):
    ENGINE: [Great 🟢] [OK 🟡] [Needs Work 🔴]
    BODY / PAINT / INTERIOR / ELECTRICALS / TYRES / AC / BRAKES (same)
  Feature checklist (2-column grid, checkboxes):
    AC | Power Windows | Power Steering | Central Locking | Reverse Camera |
    Navigation | Sunroof | Alloy Wheels | Bluetooth | USB Charging |
    Airbags | ABS | Push Start | Keyless Entry | Leather Seats
  [Continue] disabled until all 8 condition items selected

STEP 3 — Photos:
  Upload zone (large, dashed border):
    "Tap to take photos or select from gallery"
    Camera icon (mobile) / Upload icon (desktop)
  Photo preview grid: added photos shown as 80px thumbnails
  Minimum 4 photos counter: "3/4 minimum" (amber until 4 added)
  Primary photo: tap star to mark
  Reorder: hold + drag
  Remove: × on thumbnail
  Angle guide (collapsible):
    "Tip: Include these views for faster sales:"
    📷 Front | 📷 Rear | 📷 Driver side | 📷 Interior | 📷 Odometer | 📷 Engine

STEP 4 — Pricing:
  "Enter your asking price"
  BDT input (large, centered)
  REAL-TIME IMV WIDGET (updates as price typed, 500ms debounce):
    Market range bar:
      BDT 12.5L ─────[YOUR PRICE ●]───── BDT 16.8L
    Deal rating preview: badge updates in real-time
    Message:
      At 14.5L: "✅ Good Deal — this is a competitive price for faster sale"
      At 18L: "⚠️ Overpriced — this is 25% above market. Most buyers search below BDT 16L."
      At 11L: "🔥 Great Deal — this will sell fast!"
    Note: "Based on [N] comparable listings in [district]"

STEP 5 — Contact & Publish:
  Phone number: pre-filled from account (editable)
  District: dropdown (auto-populated from IP, editable)
  Description: textarea (optional, max 500 chars, character counter)
  Contact preference:
    [Show phone number] [WhatsApp only] [Enquiry form only] (radio)

  Review summary: collapsible card showing all entered details
  Listing fee card:
    "BDT 199 for 30-day listing"
    [Pay with bKash] [Pay with Nagad] [Pay with Card] (tabs)
  [Publish My Listing] button → initiates payment flow

  After payment success:
    Success state: "🎉 Your listing is submitted for review"
    SLA message: "Our team will review it within 2 hours during business hours"
    [View My Listing] button (shows pending moderation state)
    [Share on Facebook] button (pre-generates shareable post)
```

---

## 8. BD UX — Bangla, Skeleton Screens, Offline, Payments

### 8.1 Bangla Language Toggle

```
TOGGLE LOCATION:
  Dealer OS: bottom of left sidebar → "EN | বাংলা" toggle pill
  Marketplace: header nav → language dropdown "English | বাংলা"
  Mobile: accessible from Settings → Language

TOGGLE BEHAVIOUR:
  Instant switch (no page reload)
  Preference saved: localStorage + user account preference
  Default: Bangla (language_pref = 'bn') for new accounts

WHAT SWITCHES:
  ALL UI text: labels, buttons, navigation, error messages, tooltips
  All Maestro insights: messages generated in user's language
  SMS templates: Bangla variants used when enabled
  Date format: "15 জানুয়ারি 2025" instead of "15 January 2025"
  Numbers: BD convention maintained in both languages (15,00,000)
  Currency: "BDT" / "টাকা" (both acceptable; BDT used in tables)

WHAT STAYS IN ENGLISH:
  Vehicle make/model names (internationally standardized)
  Stock numbers (SK-YYYYMM-XXXX — alphanumeric, universal)
  Error codes (technical codes shown in English for support reference)
  URLs (never translated)

IMPLEMENTATION:
  i18next + react-i18next
  Translation files: /locales/en/translation.json and /locales/bn/translation.json
  All 1,200+ UI strings translated
  Bangla font (Noto Sans Bengali) loaded lazily (only when bn selected)
  Font-size adjustments applied via CSS class .lang-bn on body element

BANGLA KEYBOARD CONSIDERATIONS:
  All text inputs accept Unicode (UTF-8 stored in PostgreSQL)
  Phone inputs: accept Bangla digits (০–৯) auto-converted to ASCII (0–9)
  Search: Bangla text matches Bangla content in MeiliSearch
    (MeiliSearch configured with Unicode tokenizer)
```

### 8.2 Skeleton Screens — Implementation

```
SKELETON DESIGN PRINCIPLE:
  Every skeleton exactly matches the layout of the content it replaces.
  Same dimensions, same grid, same number of items (estimated).
  Animated shimmer: left-to-right gradient animation (1.5s loop).
  Background: #E5E7EB (border color) → #F3F4F6 (surface hover) shimmer.

SKELETON COMPONENTS:

VehicleCardSkeleton:
  Same card dimensions as VehicleCard
  Gray rectangle (4:3 aspect) for photo
  2 lines for title (80% width, 60% width)
  3 small pills for specs
  Price: 40% width line (right-aligned)

LeadCardSkeleton:
  Pipeline column item
  Name line: 70% width
  Vehicle line: 50% width
  Score badge: small circle
  Timestamp: 40% width

DashboardMetricCardSkeleton:
  Card outline preserved
  Large number area: 60% wide rectangle
  Label: 40% wide narrow rectangle

TableRowSkeleton:
  Repeats for each expected row (default: 10 rows)
  Columns width match actual content columns

MaestroInsightSkeleton:
  Card shape preserved
  3 content lines + button area

LOADING RULES:
  Show skeleton immediately (< 16ms, synchronous with component mount)
  Replace with actual data when first byte received (progressive replacement)
  Never show: spinner centered in a blank card area
  Never show: "Loading..." text (skeleton communicates loading visually)
  Timeout: if data not received in 8 seconds:
    Replace skeleton with error state:
    "[icon] Couldn't load this section. [Retry] [Support]"
```

### 8.3 Offline PWA Support

```
SERVICE WORKER: Workbox (via next-pwa)

OFFLINE CACHE STRATEGY:

  Cache 1: App Shell (precached on install)
    → All static assets: JS bundles, CSS, fonts, icons
    → Key screens: login, dashboard, inventory list, CRM pipeline
    → Strategy: CacheFirst (never stale — versioned by build hash)

  Cache 2: API Responses (runtime caching)
    → /api/v1/vehicles (dealer's inventory)
    → /api/v1/leads (CRM leads, filtered by assigned dealer)
    → /api/v1/dealerships/me (dealer profile)
    → Strategy: NetworkFirst with fallback to cache
    → Staleness: acceptable up to 15 minutes for inventory list
    → NOT cached: payment APIs, sync operations, auth endpoints

  Cache 3: Photos (lazy, LRU)
    → Vehicle primary photos (thumbs only)
    → Max cache size: 50MB
    → Strategy: StaleWhileRevalidate
    → Eviction: LRU when > 50MB

OFFLINE FUNCTIONALITY:
  AVAILABLE OFFLINE:
    ✅ View cached vehicle list (last loaded inventory)
    ✅ View cached lead list and lead cards
    ✅ Write offline notes (note text + timestamp stored in IndexedDB)
    ✅ Log offline interactions (stored locally, synced on reconnect)
    ✅ View previously loaded stock cards (photos from cache)

  NOT AVAILABLE OFFLINE (graceful error):
    ❌ Create new vehicle (requires sync trigger)
    ❌ Status changes (vehicle, lead)
    ❌ Payment operations
    ❌ Real-time marketplace search
    → Shows: "You're offline. Connect to perform this action."

OFFLINE SYNC (on reconnect):
  IndexedDB queue: stores { action, payload, timestamp } for offline writes
  On reconnect: detect network → process queue in order → retry failed items
  Conflict resolution: server timestamp wins over offline timestamp
  User notification: "✅ 3 offline notes synced" (non-intrusive toast)

OFFLINE INDICATOR:
  Yellow banner at top: "You're offline. Some features are unavailable."
  Disappears automatically when connection restored
  No offline icon badge (too alarmist for BD connectivity patterns)
```

### 8.4 bKash / Nagad Payment UX

```
PAYMENT UX PRINCIPLES (BD-specific):
  P1: Never call it "payment" — use "confirm subscription" or "reserve"
  P2: Show exact amount BEFORE initiating gateway redirect
  P3: Provide clear "what happens next" instructions
  P4: Handle timeout gracefully (show "checking your payment" not error)
  P5: Never show failure before checking gateway status

BKASH PAYMENT FLOW UI:

  STEP 1 — Payment initiation screen:
    Plan name + amount (large)
    "You will be charged BDT X via bKash"
    bKash logo
    Amount breakdown (if applicable): base BDT X + VAT BDT Y = BDT Z
    [Pay with bKash] button → initiates API call

  STEP 2 — bKash redirect:
    Redirect to bKash payment page (external)
    Note: "You'll be redirected to bKash to authorize the payment"
    Loading screen: animated bKash logo during redirect

  STEP 3 — Return handling:
    On return from bKash (success or failure URL):
    Show: "Checking your payment status..." (spinner, 3 seconds)
    During this: query gateway for payment status (prevents false failures)
    SUCCESS: green checkmark + "Payment successful! Your plan is now active."
    FAILURE (confirmed): "Payment was not completed. Your account has not been charged."
      [Try Again] button | [Contact Support] link
    TIMEOUT (status unknown):
      "We're checking your payment status. This may take up to 2 minutes."
      Auto-retry status check every 30 seconds (up to 4 retries)
      If still unclear after 2 minutes: "If bKash confirmed the payment, your plan
        will activate automatically. Check your bKash statement."
      [Contact Support] link

  GRACE PERIOD UI (post-subscription expiry):
    Amber banner (not red — not an error yet):
      "Your subscription expired. Renew to keep full access.
       [Renew Now] button"
    All features remain fully accessible during grace period (7 days)
    No lockout screen during grace period

  READ-ONLY MODE UI (grace period elapsed):
    System banner (top, persistent):
      "Account on hold. Renew your subscription to add inventory and receive leads."
    [Renew Now] prominent button in banner
    All pages load normally with read-only data
    Write operations: show inline message "Renew your subscription to do this." + button
    No redirect to a payment page on every action (too aggressive)
```

### 8.5 WhatsApp Flow — 3-Tap Design

```
FLOW: Lead notification → WhatsApp reply in < 30 seconds

TAP 1: Push notification arrives
  Notification: "New lead: Rafiq Hasan — Toyota Axio"
  Tap notification → app opens to Lead Card (full screen)
  Time: 0–3 seconds

TAP 2: Lead Card opens — WhatsApp button visible immediately above fold
  Large green [WhatsApp Rafiq →] button (56px height, full width, 48px from top)
  Tap → WhatsApp opens (deep link: wa.me/8801XXXXXXXXX?text=[URL-encoded message])
  Pre-filled message (dealer OS generates from template):
    "Hi Rafiq! I'm Salman from Dhaka Auto House.
    Regarding your enquiry about our 2019 Toyota Axio at BDT 14,50,000.
    It's still available! When would you like to see it?"
  Time: 3–6 seconds

TAP 3: In WhatsApp — message ready to send
  Dealer reviews pre-filled message (can edit)
  Tap SEND
  Return to app: interaction auto-logged in Lead Timeline
  Time: 6–25 seconds

TOTAL: notification → sent message = target 30 seconds

TECHNICAL IMPLEMENTATION:
  WhatsApp deep link format:
    wa.me/{phone}?text={encodeURIComponent(message)}
  Phone normalization: strip non-digits, ensure +880 prefix
  Message pre-population: template resolved with lead's context variables
  Auto-log: After returning from WhatsApp (app focus event),
    detect return → log interaction type='whatsapp_sent' in background
    This is heuristic (can't confirm WhatsApp opened without tracking pixel)
    Lead score: +15 (whatsapp_message_sent) fired optimistically
```

---

## 9. 3-Click Enforcement Map

```
DEFINITION: "3 clicks/taps" = from current screen to action completed.
These are the critical flows that must meet the 3-click target.
Each path shows: Starting screen → action

────────────────────────────────────────────────────────────────────
ACTION                        START → CLICK 1 → CLICK 2 → CLICK 3
────────────────────────────────────────────────────────────────────

VIN SCAN (mobile)
  Start: Inventory list
  1. FAB tap → camera opens
  2. VIN scanned/typed (camera auto-detects)
  3. Specs auto-populated; dealer edits price → [Save]
  ✅ 3 taps to create vehicle record

REPLY TO LEAD (WhatsApp)
  Start: Push notification
  1. Tap notification → Lead Card opens
  2. Tap [WhatsApp] button → WhatsApp opens with pre-filled message
  3. Tap Send in WhatsApp
  ✅ 3 taps to send reply

REPRICE A VEHICLE
  Start: Inventory list
  1. Tap vehicle row → context panel opens (desktop) or stock card opens (mobile)
  2. Tap price field → inline edit activates
  3. Type new price → [Save ✓] confirms
  ✅ 3 taps to update price

MOVE LEAD STAGE (mobile)
  Start: CRM Pipeline (Kanban)
  1. Tap lead card → bottom sheet opens with stage selector
  2. Tap new stage
  3. [Confirm] (only if moving to Lost, which requires reason)
  ✅ 2–3 taps depending on destination stage

LOG INTERACTION ON LEAD
  Start: Lead Card
  1. Tap [+ Log Interaction]
  2. Select type (Call / WhatsApp / Note) and type summary
  3. Tap [Save]
  ✅ 3 taps

RECORD PAYMENT ON DEAL
  Start: Deal Record
  1. Tap [Payments] tab
  2. Tap [Record Payment] → inline form appears
  3. Enter amount + method → [Save]
  ✅ 3 taps

CREATE A DEAL FROM LEAD
  Start: Lead Card
  1. Tap [Convert to Deal] button (in bottom action bar)
  2. Review deal sheet (pre-populated from lead) → adjust price if needed
  3. Tap [Submit for Approval] or [Save as Draft]
  ✅ 3 taps

APPROVE A DEAL
  Start: Dashboard (pending approval notification)
  1. Tap notification → Deal Record opens at approval banner
  2. Tap [Approve Deal] button
  3. [Confirm Approval] in dialog
  ✅ 3 taps

ADD TYPE 1 EXPENSE
  Start: Vehicle Stock Card
  1. Tap [Expenses] tab
  2. Tap [+ Add Expense] → inline form
  3. Fill amount + category → [Save]
  ✅ 3 taps

DISMISS A MAESTRO INSIGHT
  Start: Dashboard Morning Briefing
  1. Tap [Take Action] on insight card → deeplinked to relevant screen
  --- OR ---
  1. Tap [Dismiss] on insight → card collapses
  ✅ 1–2 taps

TOGGLE MARKETPLACE PUBLISH
  Start: Vehicle Stock Card
  1. Tap [Marketplace] tab
  2. Tap marketplace toggle [ON/OFF]
  3. Sync confirmation: "Published ✅" (no confirm needed — instant)
  ✅ 2 taps (no confirmation step for toggle ON; confirmation only for toggle OFF)

SCHEDULE A POST
  Start: Automation Hub → Social Media
  1. Tap [+ Create Post]
  2. Select vehicle (search) → caption auto-generated → set schedule time
  3. Tap [Schedule Post]
  ✅ 3 taps (with auto-generated caption; more if manual editing)

SHARE DEALER WEBSITE
  Start: Website & Marketing
  1. Tap [Share Your Website] button
  2. Tap [Share on WhatsApp]
  3. WhatsApp opens with pre-filled message → Send
  ✅ 3 taps

VIEW MORNING BRIEFING
  Start: Any screen (8 AM push notification)
  1. Tap push notification
  2. Dashboard opens to Morning Briefing (default tab)
  → Content immediately visible
  ✅ 1–2 taps

SEND SMS CAMPAIGN
  Start: Automation Hub → Marketing
  1. Tap [+ New Campaign]
  2. Select segment → write message → tap [Review & Send]
  3. Tap [Confirm Send] (required — irreversible action)
  ✅ 3 taps (intentionally 3; campaign send should have confirmation)

RENEW SUBSCRIPTION
  Start: Any screen (billing banner)
  1. Tap [Renew Now] in banner
  2. Confirm amount → tap [Pay with bKash]
  3. Complete payment in bKash → return → plan activated
  ✅ 3 taps

MARK A VEHICLE SOLD
  Start: Vehicle Stock Card
  1. Tap [⋯ More Actions] → [Mark as Sold]
  2. Select deal (from active deals list) OR enter manual sale price
  3. Tap [Confirm Sale]
  ✅ 3 taps

FILTER LEADS BY PRIORITY
  Start: CRM All Leads list
  1. Tap [Priority: All] filter chip
  2. Tap [Hot Only]
  → List filters immediately (no confirm)
  ✅ 2 taps

CHECK AGING WATCHLIST
  Start: Dashboard
  1. Tap aging alert in Morning Briefing → Aging Watchlist page
  → All aged vehicles visible immediately
  ✅ 1 tap

RESPOND TO BUYER FLAG (admin)
  Start: Admin Dashboard (alert badge)
  1. Tap [Flagged Listings] alert card → Moderation queue
  2. Tap [Review] on flagged listing
  3. Tap [Approved] or [Rejected + reason]
  ✅ 3 taps

────────────────────────────────────────────────────────────────────
FLOWS INTENTIONALLY REQUIRING > 3 TAPS (destructive or irreversible):
  Terminate a dealer account:     5 taps (multiple confirmation layers)
  Delete a vehicle:               4 taps (confirm + reason)
  Cancel a deal:                  4 taps (confirm + reason + manager approval if needed)
  Refund a payment:               4 taps (Finance Admin: confirm + reason + amount)
  IMV manual override:            5 taps (request + Super Admin approval)
────────────────────────────────────────────────────────────────────
```

---

## 10. Component Library — Shared Atoms

### 10.1 Button Variants

```typescript
// Primary button
<Button variant="primary" size="md">
  Save Vehicle
</Button>
// Sizes: sm (32px) | md (40px) | lg (48px) | xl (56px — mobile CTAs only)
// Variants: primary | secondary | outline | ghost | danger | success

// Loading state
<Button variant="primary" loading={true}>
  Saving...
</Button>
// → Spinner replaces text; button disabled; width preserved

// Icon button
<Button variant="ghost" iconOnly>
  <WhatsAppIcon />
</Button>
// → 44×44px tap target (meets minimum)
```

### 10.2 Deal Rating Badge

```typescript
<DealRatingBadge rating="great_deal" />
// → "🟢 Great Deal" green pill

<DealRatingBadge rating="overpriced" />
// → "🔴 Overpriced" red pill

<DealRatingBadge rating="unrated" size="sm" />
// → "⚪ No Rating" gray pill (small variant for table rows)
```

### 10.3 IMV Bar Widget

```typescript
<ImvBar
  askingPrice={1450000}
  p25={1250000}
  p50={1520000}
  p75={1680000}
  sampleSize={23}
  district="Dhaka"
/>
// Renders: three-point bar with your price marker
// Deal rating badge + price statement auto-computed
```

### 10.4 Lead Score Badge

```typescript
<LeadScoreBadge score={75} priority="hot" />
// → 🔥 "75" red badge

<LeadScoreBadge score={45} priority="warm" />
// → 🌡 "45" amber badge

<LeadScoreBadge score={15} priority="cold" />
// → 🧊 "15" gray badge
```

### 10.5 Vehicle Card

```typescript
<VehicleCard
  listing={listingData}
  showDealRating={true}
  showWhatsAppButton={true}
  variant="grid" // 'grid' | 'list' | 'compact'
  onSave={() => handleSave(listing.id)}
  saved={savedVehicleIds.includes(listing.id)}
/>
```

### 10.6 Status Badge

```typescript
// Vehicle status
<StatusBadge status="available" entity="vehicle" />
// → "Available" green badge

<StatusBadge status="reserved" entity="vehicle" />
// → "Reserved" amber badge

// Lead stage
<StatusBadge status="negotiation" entity="lead" />
// → "Negotiation" blue badge

// Deal status
<StatusBadge status="pending_approval" entity="deal" />
// → "Pending Approval" amber badge with pulse animation
```

### 10.7 Skeleton Components

```typescript
// All skeleton components accept a `count` prop for lists

<VehicleCardSkeleton count={6} variant="grid" />
<LeadCardSkeleton count={5} />
<DashboardMetricSkeleton count={3} />
<TableRowSkeleton columns={5} count={10} />
<InsightCardSkeleton count={3} />
```

### 10.8 BDT Amount Display

```typescript
<BDTAmount
  value={1450000}
  format="standard" // '15,00,000'
  // OR: format="lakh" // '14.5L'
  // OR: format="compact" // 'BDT 14.5L'
  color="primary" // inherited | primary | success | danger
  size="lg"
/>
// Auto-formats based on user's locale preference
// Lakh format used in summaries/SMS; full format in tables/forms
```

### 10.9 Aging Flag Indicator

```typescript
<AgingFlag tier={2} daysOnLot={47} />
// → Orange dot + "47 days" text
// tier 1=yellow, 2=orange, 3=red, 4=critical(pulsing red)

// In table rows, compact variant:
<AgingFlag tier={3} compact />
// → Red dot only (tooltip on hover showing full info)
```

### 10.10 Empty States

```typescript
// Standard empty state component
<EmptyState
  icon={<TruckIcon />}
  title="No vehicles yet"
  description="Add your first vehicle to get started. Scan a VIN or enter details manually."
  action={{
    label: "Add Vehicle",
    onClick: () => navigate('/inventory/add')
  }}
  secondaryAction={{
    label: "Import from CSV",
    onClick: () => navigate('/inventory/import')
  }}
/>

// Common empty states by section:
// Inventory: "Your lot is empty" + Add Vehicle CTA
// CRM: "No leads yet" + "Share your listing on WhatsApp to get your first lead" CTA
// Deals: "No deals yet" + "Convert a lead to a deal to get started" CTA
// Analytics: "Not enough data yet" + "Add more deals to unlock insights" CTA
// Maestro: "All looking good!" (not an error — positive empty state)
// Search results: "No cars found" + filter relaxation suggestions
```

### 10.11 Toast Notification System

```typescript
// Global toast stack (max 3 visible at once, bottom-right on desktop, bottom on mobile)

// Success
toast.success("Vehicle published to marketplace ✅")
// → Green, auto-dismiss 3 seconds

// Error
toast.error("Sync failed. Tap to retry.", {
  action: { label: "Retry", onClick: handleRetry }
})
// → Red, auto-dismiss 6 seconds, action button

// Info
toast.info("Offline. Changes will sync when reconnected.")
// → Blue, persists until online

// Warning
toast.warning("87% of your WhatsApp daily limit used (870/1000)")
// → Amber, auto-dismiss 5 seconds

// Rules:
// Never stack more than 3 toasts
// Critical errors (sync DLQ, payment failure) persist until dismissed
// Navigation does not dismiss toasts (they follow the user)
```

---

*AutoVerse — Step 6: UI/UX System*
*Admin Panel · Dealer OS · Automation Hub · Website Builder · Marketplace · BD UX*
*Built against Blueprint v7.0*
