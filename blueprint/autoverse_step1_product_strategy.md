# AutoVerse — Step 1: Product Strategy & Market Architecture
### v1.0 · Bangladesh Primary Market · Southeast Asia Expansion Ready

---

## Table of Contents

1. [BD Market Failure Analysis](#1-bd-market-failure-analysis)
2. [User Personas — All 8 Types with BD Behavioral Depth](#2-user-personas--all-8-types-with-bd-behavioral-depth)
3. [Complete Journey Maps](#3-complete-journey-maps)
4. [Admin Journey](#4-admin-journey)
5. [Monetization Model with Unit Economics](#5-monetization-model-with-unit-economics)
6. [PRD — Feature Prioritization Matrix](#6-prd--feature-prioritization-matrix)

---

## 1. BD Market Failure Analysis

### 1.1 Market Context

| Metric | Value |
|---|---|
| BD used car market size (2025) | USD 1.54 billion |
| CAGR | 7.1% |
| Est. annual transactions | ~600,000–800,000 units |
| Share through unorganized dealers | 64% |
| Average buyer overpay | 20–40% above market rate |
| Lead loss due to no follow-up | ~40% |
| Dealers with any digital tool | < 15% |
| Dealers with a proper website | < 5% |

The BD used car market is large, fast-growing, and almost entirely undigitized. This is not a distribution problem — it is a trust, tooling, and intelligence problem.

---

### 1.2 Platform-Type Failure Analysis

Each existing platform type solves one slice of the problem but fails at the system level. AutoVerse is designed around these specific failure points.

---

#### Failure Type A: Classified Marketplace Only (Bikroy, OLX, Facebook Marketplace)

**What they do well:**
- High listing volume and brand awareness
- Low barrier to entry for C2C and dealer listings
- Large existing user base

**Where they fail:**

| Failure | Mechanism | BD Impact |
|---|---|---|
| No price intelligence | Listings are raw price entries with no market context | Buyers cannot judge if a price is fair; dealers cannot price competitively |
| Zero dealer tooling | No CRM, no inventory management, no analytics | Dealers list once and abandon; leads come in via call/text and are lost |
| No trust signals | Any account can list anything; no verification | 34% of BD buyers cite "fear of fraud" as primary barrier to online car purchase |
| No lead routing | Enquiry goes to a generic inbox or phone number | No salesperson assignment, no pipeline, no follow-up enforcement |
| Static listings | A sold car stays listed until manually removed | Buyers contact sellers of already-sold inventory daily |
| No lifecycle support | Platform engagement ends at listing | No retention, no service reminder, no resale loop |

**Outcome:** High traffic, near-zero transaction facilitation. These platforms are digital notice boards, not automotive ecosystems.

---

#### Failure Type B: DMS/CRM Only (CDK Global, VinSolutions equivalents)

**What they do well:**
- Deep dealer workflow management
- Mature feature sets for large dealerships

**Where they fail:**

| Failure | Mechanism | BD Impact |
|---|---|---|
| No marketplace | DMS is invisible to buyers | Dealers still need Bikroy/Facebook; tools are disconnected |
| Pricing above BD threshold | USD 300–500+/month | Not viable for BD dealerships with avg monthly revenue BDT 3–8 lakh |
| English-only, foreign UX patterns | Designed for US/EU markets | High friction for BD staff; requires training investment most dealers won't make |
| Complex onboarding | Implementation takes weeks | BD dealer decision cycle is 1–3 days; if not live in a day, they drop off |
| No automation | Manual follow-up culture assumed | 40% lead loss due to no follow-up infrastructure |
| No mobile-first design | Desktop-centric architecture | 78% of BD dealer staff work primarily on mobile |

**Outcome:** Priced out of BD market, wrong UX assumptions, no buyer-side component.

---

#### Failure Type C: Dealer Website Builders Only (Generic WordPress/Wix)

**What they do well:**
- Low cost, some degree of customization

**Where they fail:**

| Failure | Mechanism | BD Impact |
|---|---|---|
| Manual inventory management | Each car must be manually added and removed from website | Dealers with 30+ cars cannot maintain accuracy; they abandon the site |
| No marketplace connection | Website traffic is isolated | Buyers still go to Bikroy; website gets zero organic traffic |
| No lead intelligence | Contact form → email → lost | No CRM, no assignment, no follow-up |
| No analytics | No conversion tracking, no Facebook Pixel, no GA4 | Dealers have no idea if the site is working |
| No GMC/Facebook integration | Can't run dynamic vehicle ads | Can't retarget buyers who viewed specific cars |
| SEO requires expertise | Dealers cannot do their own SEO | Websites sit unfound; no value delivered |

**Outcome:** One-time setup cost with zero ongoing value. Dealers eventually stop paying.

---

#### Failure Type D: Marketplace + Partial Tools (CarGurus UK model)

**What they do well:**
- Deal rating / price intelligence
- Some dealer dashboard functionality

**Where they fail (in BD context):**

| Failure | Mechanism | BD Impact |
|---|---|---|
| Not present in BD | No localized product | Irrelevant until someone builds the BD equivalent |
| No DMS | Inventory still managed separately | Dual data entry problem persists |
| No automation | No WhatsApp, SMS, social integration | Not built for BD communication patterns |
| No website builder | Dealer still needs a separate site | Fragmented tooling remains |

**Conclusion:** The market gap is for a fully integrated platform — DMS + marketplace + website builder + automation — built natively for BD constraints, BD prices, and BD communication habits.

---

### 1.3 AutoVerse's Unique Competitive Position

```
                MARKETPLACE INTELLIGENCE
                        ↑
                    CarGurus
                   (not in BD)
                        |
DEALER           ───────┼───────     AUTOMATION
TOOLING                 |            & CHANNELS
(CDK)           AutoVerse            (missing
                 FILLS THIS          everywhere)
                   SPACE
                        |
                ───────┼───────
                        ↓
                  DEALER WEBSITE
                  (generic builders)
```

AutoVerse is the only platform that occupies all four quadrants simultaneously, at BD price points, on BD infrastructure, in the Bangla language.

---

## 2. User Personas — All 8 Types with BD Behavioral Depth

### Persona Framework

Eight distinct user types interact with the AutoVerse platform. Each has a unique job-to-be-done, different technological comfort levels, different communication preferences, and different definitions of success.

---

### Persona 1 — The Dealer Owner (Mohammad Karim, 42)

**Profile:**
- Owns a used car dealership in Dholaikhal, Dhaka
- 15–40 cars in stock at any time
- 2–5 staff: 1 manager, 2–3 salespeople
- Revenue: BDT 4–10 lakh/month
- Education: HSC to Bachelor's degree
- Primary device: Samsung mid-range Android, occasionally laptop

**Current reality:**
- Tracks inventory in a notebook or basic Excel sheet
- Manages leads through personal WhatsApp
- Posts cars on Bikroy and personal Facebook profile manually
- Has no idea how many leads came in last month or what the conversion rate was
- Sets prices based on gut feeling and what competitors are listing
- Loses 3–5 deals per month to non-response or bad follow-up

**Primary motivation:** More sales, less chaos, better margin

**Pain intensity ranking:**
1. "I don't know which leads my salespeople are ignoring" — HIGH
2. "I don't know if my prices are right vs the market" — HIGH
3. "Posting the same car to 3 platforms takes 30 minutes" — MEDIUM
4. "I can't see my profit on a vehicle without calculating it manually" — HIGH
5. "My staff lose WhatsApp messages and forget to follow up" — CRITICAL

**AutoVerse value levers:**
- Profit calculator per VIN (finally know what he's making)
- Lead pipeline (know exactly where each lead is)
- Maestro AI pricing (know if a car is overpriced vs market)
- Automation Hub (no more lost follow-ups)
- One-click listing to marketplace + website + Facebook

**BD behavioral nuances:**
- Will not commit to a subscription without seeing it "work" first — needs a free plan with real value
- Will make buying decision after talking to someone; not purely digital conversion
- Trusts recommendations from other dealers he knows personally
- Price-sensitive but will pay if ROI is visible and fast
- Responds to SMS; rarely opens email
- Will abandon any onboarding flow that takes more than 5 minutes

**Success metric:** "Within 30 days I can see which salesperson is performing, what my best-selling models are, and my profit on every car."

---

### Persona 2 — The Dealer Manager (Rakib Hasan, 31)

**Profile:**
- Manages day-to-day operations for a mid-size dealership
- Reports to owner, manages 3–5 salespeople
- Previous experience in retail or informal trade
- Primary device: Xiaomi mid-range Android
- Uses WhatsApp constantly; some Facebook; no email habit

**Current reality:**
- Manually assigns incoming leads from Bikroy/phone to salespeople via WhatsApp groups
- No visibility into what a salesperson is doing with a lead after assignment
- Resolves pricing disputes manually by calling the owner
- Tracks recon work via verbal updates from mechanics
- Manages test drive schedules in his head or a personal notebook

**Primary motivation:** Not getting blamed when things go wrong; being in control

**Pain intensity ranking:**
1. "I can't see what my salespeople are doing without asking them" — CRITICAL
2. "When a lead falls through, no one knows whose fault it was" — HIGH
3. "Recon costs are hard to track; owner always asks me about it" — HIGH
4. "I don't have a way to reassign leads quickly when staff are absent" — MEDIUM

**AutoVerse value levers:**
- Lead pipeline with salesperson-level visibility
- Recon task assignment and status tracking
- Lead reassignment in 2 taps
- Type 1 expense tracking per vehicle (answers to the owner)

**BD behavioral nuances:**
- Will use the platform if it makes him look competent to the owner
- Will resist if it creates extra documentation work for him
- Needs to see "all leads" with status at a glance — not clicks away
- Does not trust systems that "hide things" — must have visibility into team activity

---

### Persona 3 — The Salesperson (Sumon Ahmed, 24)

**Profile:**
- 1–3 years experience, first or second job
- Works 6 days a week, primarily on showroom floor
- Earns base + commission; commission visibility is key motivation
- Phone is primary work tool; never uses a laptop
- Native Bangla speaker; limited English reading comfort

**Current reality:**
- Receives leads from manager via WhatsApp group
- Follows up via personal WhatsApp — no tracking, no templates
- Forgets to follow up after 2–3 days if there's no immediate response
- Has no idea what his conversion rate is
- Misses test drive appointments because reminders are manual

**Primary motivation:** Close more deals, earn more commission, look good to the manager

**Pain intensity ranking:**
1. "I forget to follow up with leads after a few days" — HIGH
2. "I waste time with leads who will never buy" — MEDIUM
3. "I don't know what to say when a customer asks about price comparison" — MEDIUM
4. "I can't send a car photo quickly with specs from my phone" — HIGH

**AutoVerse value levers:**
- One-tap WhatsApp reply with pre-filled template from Lead Card
- Lead score to know who to prioritize (Hot/Warm/Cold)
- Follow-up reminders
- Quick Replies in WhatsApp automation (10 templates, one tap)
- Vehicle photo + specs available instantly on Lead Card → share to WhatsApp

**BD behavioral nuances:**
- Needs UI in Bangla or very simple English
- Will use only if it's faster than his current process; any extra step = abandonment
- Responds to gamification — if his conversion rate is visible and comparable, he'll compete
- Needs thumb-navigable UI exclusively; will never use a mouse for work tasks

---

### Persona 4 — The Active Car Buyer (Nafis Islam, 35)

**Profile:**
- Middle-class professional in Dhaka or Chittagong
- Budget: BDT 8–25 lakh
- Looking for a first or second car for family use
- Research phase: 2–6 weeks of browsing
- Primary device: iPhone or flagship Android
- Uses Facebook Groups, Bikroy, and Google search to find cars

**Current reality:**
- Browses 30–50 listings before making an enquiry
- Cannot tell if a price is fair or inflated; heavily depends on friend/family advice
- Enquires on 5–10 cars simultaneously but only receives responses on 2–3
- Goes to showroom based on gut feel after initial WhatsApp chat
- Often gets different prices at showroom vs what was stated online
- High anxiety about buying a flood-damaged or accident-repair car

**Primary motivation:** Get a reliable car at a fair price without being cheated

**Pain intensity ranking:**
1. "I don't know if the price is fair" — CRITICAL
2. "Half the cars I enquire about get no response" — HIGH
3. "I'm scared of buying a flood car or accident car" — HIGH
4. "I have to talk to 10 different dealers to compare" — HIGH

**AutoVerse value levers:**
- IMV deal rating badge (Great Deal / Good Deal / Fair Price / Overpriced)
- Price trend charts per make/model
- Verified dealer badges (reduces fraud anxiety)
- Instant WhatsApp CTA (primary contact method)
- Save vehicle + saved search with alerts
- Valuation report (BDT 149 — still affordable, high perceived value)

**BD behavioral nuances:**
- Will share a listing with spouse/family before deciding; sharing must be effortless
- Budget range is negotiable upward if car "feels right"
- Prefers WhatsApp over phone call for initial contact (less commitment)
- Will walk away if dealer takes more than 4 hours to respond
- Purchases are often timed around salary receipt, bonuses, or Eid savings
- Searches in Bangla on Facebook but in English on Google; both must work

---

### Persona 5 — The Passive/Researching Buyer (Tasnim Chowdhury, 28)

**Profile:**
- Thinking about buying a car "in the next 3–6 months"
- Budget not finalized; doing market research
- Browses listings casually on mobile, often late at night
- Primary need: market education, not transaction

**Current reality:**
- No good source of "what does a 2019 Toyota Axio actually cost in Dhaka?"
- Bookmarks listing pages in browser, loses them
- Relies on Facebook groups for price opinions — unreliable, biased

**AutoVerse value levers:**
- IMV price trend charts (the single most useful thing for this persona)
- Saved searches with email/SMS alerts
- Expert reviews and buying guides
- Valuation tool (for understanding what their current car is worth as trade-in)

**BD behavioral nuances:**
- Not ready to call or WhatsApp — browsing stage is anonymous
- Will convert to Active Buyer if given trust-building content
- Price trend feature alone could drive this persona to AutoVerse as a regular destination

---

### Persona 6 — The C2C Seller (Arif Mahmud, 45)

**Profile:**
- Selling a personal vehicle — not a dealer
- One transaction every 2–3 years
- Not tech-savvy with car platforms
- Already listed on Bikroy; getting few serious enquiries
- Concerned about lowballers and wasted time

**Current reality:**
- Lists on Bikroy and personal Facebook feed
- Gets high call volume but low-quality leads
- Has no way to price intelligently; priced based on similar Bikroy listings (which are also priced by guessing)
- Worried about safety meeting strangers

**AutoVerse value levers:**
- C2C listing wizard (guided, 5 steps, no expertise required)
- IMV range shown during pricing step — first time he's seen what the market actually says
- Verification badge (filtered buyers feel safer to deal with)
- Listing expiry reminder and relisting option

**BD behavioral nuances:**
- Will not pay more than BDT 500 to list a personal car (price elasticity very low for one-time users)
- Needs simple photo upload from phone camera
- May share listing on Facebook manually after publishing — must make sharing easy
- If AutoVerse gets him a sale faster, he will recommend the platform to his network (word-of-mouth is strong in this segment)

---

### Persona 7 — The AutoVerse Operations Staff (Internal)

Covers: Operations Manager, Finance Admin, Content Moderator, Marketing Admin — all admin roles that interact with dealer-facing and marketplace-facing workflows.

**Profile:**
- Young professional, 22–32, university educated
- Comfortable with SaaS dashboards
- Works from office; desktop primary
- Juggles multiple moderation tasks simultaneously

**Current reality (without AutoVerse admin panel):**
- Would manage dealer applications via email and spreadsheet
- Moderation would be manual and inconsistent
- Payment failures would require manual follow-up via phone/WhatsApp
- No audit trail for decisions made

**Primary motivation:** Process efficiency and accountability

**AutoVerse admin value levers:**
- Dealer approval queue with one-click actions
- Moderation queue with clear accept/reject workflows and reason logging
- Failed payment queue with recovery actions
- Platform audit log for accountability
- System health dashboard (for System Admin role)

**BD behavioral nuances:**
- Will need onboarding documentation; cannot learn the admin panel intuitively
- SMS is most reliable communication channel to reach dealers from admin
- Needs to handle Eid/peak periods with batch tools (bulk suspension/reinstatement)

---

### Persona 8 — The AutoVerse Super Admin / Founder (Internal)

**Profile:**
- Founder or CTO-level operator
- Needs macro visibility: platform health, revenue, growth, risk
- Travels; needs mobile access to key metrics
- Makes strategic decisions based on data (IMV overrides, plan pricing changes, market expansion)

**Primary motivation:** Platform growth, unit economics, risk management, investor readiness

**AutoVerse admin value levers:**
- Platform KPI dashboard (dealers active, MRR, churn, listing volume, marketplace GMV)
- IMV parameter management
- Feature flag system (gradual rollout, A/B capability)
- Impersonation for dealer support
- Revenue projections and cohort analytics

---

## 3. Complete Journey Maps

### 3.1 Journey Map A: Lead Acquisition → Delivery → Service → Re-engagement Automation Loop

This is the full commercial lifecycle of a single buyer-dealer relationship, showing every touchpoint, system action, and automation trigger.

---

#### Phase 1: Discovery & Enquiry (Buyer side)

```
BUYER ACTION                          SYSTEM ACTION
─────────────────────────────────────────────────────────────────
Searches "2019 Toyota Axio Dhaka"
  → Google (SEO page)                 → ISR page served from Vercel
  → Bikroy (ad or organic)            → External referral tracked via UTM
  → Facebook (dealer post/DVA)        → Facebook Pixel fires on landing

Lands on vehicle listing page
  → Sees IMV deal rating badge        → deal_score pulled from Redis cache
  → Views photos (4–20)               → views++ via Redis counter (async)
  → Reads specs                       → structured data served (Schema.org)
  → Checks price vs market chart      → imv_p25/p50/p75 from imv_data table

Saves vehicle                         → saved_vehicles record created
                                      → BullMQ: price-drop-alert subscription set

Taps WhatsApp button                  → Pre-filled message:
                                        "Hi, I'm interested in your
                                         2019 Toyota Axio BDT 14.5L.
                                         Is it still available?"

Submits enquiry form (alternative)    → POST /marketplace/leads
                                      → lead record created in dealer's CRM
                                      → BullMQ: assign to salesperson (round-robin
                                        or dealer default assignment rule)
                                      → Socket.io: real-time push to dealer dashboard
                                      → FCM: push notification to assigned salesperson
                                      → Automation: Day 0 WhatsApp reply fires (if
                                        Advanced tier) within 60 seconds
```

---

#### Phase 2: Lead Qualification & Nurturing (CRM Pipeline)

```
STAGE: New → Contacted

Salesperson receives push notification
  → Taps → Lead Card opens (full screen mobile)
  → Taps WhatsApp button
  → WhatsApp opens: pre-filled template sent
  → Auto-logged in Lead Timeline

2-hour contact SLA timer starts on lead creation
  → If uncontacted in 2h → manager receives alert
  → Maestro flags in morning briefing

STAGE: Contacted → Qualified

Salesperson confirms buyer's budget range and timeline
  → Updates lead: budget_min / budget_max
  → Confirms vehicle of interest
  → Sets next_follow_up (default: 24h)
  → BullMQ: follow-up reminder job scheduled

If no response after Day 1:
  → Automation fires: "Still interested in the [vehicle]?"

If no response after Day 3:
  → Automation fires: "We can arrange a test drive this week."

STAGE: Qualified → Test Drive

Salesperson schedules test drive
  → Date/time recorded in Lead Card
  → Auto-SMS to customer 24h before: "Reminder: Test drive tomorrow at 3pm
    at [dealer address]. Directions: [Google Maps link]"
  → Auto-SMS day-of: "We look forward to seeing you today."
```

---

#### Phase 3: Negotiation & Deal Close

```
STAGE: Test Drive → Quote Sent

Quote created in Deal Record
  → sale_price, payment method, any finance details
  → 3-day auto follow-up reminder set (BullMQ)
  → If Auto-send quote enabled: Bill of Sale draft PDF sent via WhatsApp

STAGE: Quote Sent → Negotiation

Buyer counter-offers
  → Salesperson logs note in Lead Timeline
  → Manager discount alert if discount requested > threshold
    (configured per dealership in Settings)
  → Manager approves / rejects discount in 2 taps from mobile

STAGE: Negotiation → Closed

Deal Record created / updated
  → sale_price confirmed
  → vehicle status: available → reserved
  → marketplace_listing status: reserved (buyer sees "Reserved" badge)
  → Payment recorded (deposit first, balance on delivery)
  → Bill of Sale PDF generated (Puppeteer)
    → Stored in R2
    → Sent to buyer via WhatsApp + email
```

---

#### Phase 4: Delivery

```
Salesperson marks deal as delivered
  → deal status: approved → delivered
  → vehicle status: reserved → sold
  → marketplace_listing: hidden → status: sold (shown 7 days as "Sold", then archived)
  → Dealer website ISR revalidated
  → GMC feed item removed
  → Facebook catalog item updated

Automation: Post-Sale Sequence begins
  Day 3:  "How are you enjoying your new [car]? Any questions?"
  Day 30: "Your first service is due. Book now: [service link]"
  Day 180: 6-month check-in message
  Day 365: "Annual service reminder + we have some great new arrivals
            if you're looking to upgrade. [Personalized inventory link]"
```

---

#### Phase 5: Re-engagement Loop

```
Customer in database → tagged with purchase history, make/model preference

New inventory arrives matching customer profile:
  → vehicle status becomes 'available'
  → Automation: New Inventory Alert fires to opted-in customers
    "New arrival matching your interest: 2021 Toyota Axio — BDT 17.2L.
     View here: [deeplink]"

Customer referral pathway:
  → Post-delivery satisfaction message includes:
    "If you have friends looking for a car, we'd love to help them too."
  → Referral tracked via UTM on dealer website link shared

Win-back (if customer went cold pre-purchase):
  → 30 days after last interaction, cold leads enter win-back sequence
  → "Still looking? We have [N] new arrivals in your budget range."
  → Personalized vehicle link auto-generated from saved preferences
```

---

### 3.2 Journey Map B: Dealer Onboarding → First Week Activation

The critical 7-day window that determines long-term retention.

```
DAY 0 — Registration
────────────────────────────────
Dealer submits registration form:
  business_name, phone, trade_license_no, district
  → status: pending_approval
  → Operations Manager receives in-app alert + SMS
  → Dealer receives SMS: "Application received. We'll review within 4 hours."

Operations Manager approves:
  → status: active
  → Free plan activated
  → Welcome SMS sent: "Welcome to AutoVerse! Set up your dealership:
    [onboarding link]"
  → In-app onboarding checklist appears (5 items)

ONBOARDING CHECKLIST:
  ☐ Upload business logo
  ☐ Add first vehicle (VIN scan or manual)
  ☐ Set WhatsApp number
  ☐ Publish dealer website
  ☐ Add first salesperson (optional on Free)

DAY 0–1 — First Vehicle Added
────────────────────────────────
Dealer opens app → FAB tap → Camera → VIN scan
  → Specs auto-populated
  → Dealer adds: price, mileage, color
  → Photos: minimum 4 captured
  → Save → vehicle status: available
  → Sync triggers: marketplace + dealer website

Dealer sees their car live on:
  → autoverse.com.bd/cars/[slug]        (marketplace)
  → dealer.autoverse.com.bd/[slug]      (dealer microsite)

MOMENT OF VALUE: The first time a dealer sees their listing live
on a real marketplace page is the activation event that drives retention.

DAY 2–3 — First Lead Received
────────────────────────────────
Buyer enquires on dealer's listing
  → Push notification fires to dealer phone
  → Lead Card opens → WhatsApp reply in < 30 seconds
  → Dealer sees CRM pipeline for the first time with a real lead

SECOND MOMENT OF VALUE: First real lead from the platform.

DAY 4–7 — Habit Formation
────────────────────────────────
Morning briefing push at 8am
  → "2 leads uncontacted. 1 car at 30-day threshold."
  → Dealer taps → Dashboard → acts on priorities

Dealer logs expenses on first recon vehicle
  → Sees live profit calculator update

RETENTION SIGNAL: If dealer logs in 5+ times in first 7 days,
30-day retention probability > 80%.
```

---

## 4. Admin Journey

### 4.1 Dealer Approval Journey

```
TRIGGER: New dealer registration submitted

1. System auto-checks:
   a. Duplicate phone number → reject immediately (notify dealer)
   b. Duplicate business_name in same district → flag for manual review
   c. Blacklist check (suspended_entities table) → reject if match
   d. Trade license format validation (BD format)

2. Operations Manager receives:
   a. In-app notification: "New dealer application: [Business Name], [District]"
   b. SMS: "New AutoVerse dealer application. Review now: [admin link]"

3. Operations Manager reviews:
   a. Business name + district + trade license
   b. Phone number not already active on another account
   c. Runs quick Google/Facebook check on business name (BD fraud pattern)
   d. Optional: calls dealer to verify (especially outside Dhaka)

4. APPROVED path:
   → status = active
   → Free plan features activated
   → Welcome SMS + email sent automatically
   → Onboarding checklist appears in dealer dashboard
   → Dealer record created in CRM with: source = self_registration,
     assigned_ops_manager = [reviewer]

5. REJECTED path:
   → reason_code selected (duplicate / blacklisted / invalid_license /
     suspicious_pattern / incomplete_info)
   → Rejection SMS sent: reason + "You may reapply after 30 days."
   → Record retained in pending_applications with rejection reason

SLA TARGET: Review within 4 business hours.
```

---

### 4.2 Subscription Billing Journey

```
MONTHLY BILLING CYCLE:

Day -7 before renewal:
  → SMS to dealer: "Your AutoVerse subscription renews in 7 days.
    Ensure your bKash/Nagad balance is sufficient."

Day -3:
  → SMS + in-app banner: "3 days to renewal. Update payment method: [link]"

Day 0 — Renewal attempt:
  → Initiate bKash/Nagad/bank charge with idempotency_key
  → SUCCESS → subscription_expires_at extended 30 days
              → Invoice generated, stored in R2, SMS + email sent
  → FAILURE  → Retry #1 after 30 minutes
              → Retry #2 after 4 hours
              → Retry #3 next morning (attempt #3)
              → All retries fail → Manual payment queue

Grace period begins (7 days):
  → Day +1 to +7: DMS still fully functional
  → Dealer sees persistent in-app banner: "Payment due. Renew now."
  → SMS every 2 days

Day +7 — Grace period expires:
  → DMS locked: read-only mode
  → Marketplace listings: hidden (not deleted)
  → Dealer website: maintenance page
  → Finance Admin notified + dealer added to manual follow-up queue

Day +14:
  → Final warning SMS
  → Operations Manager personal outreach (WhatsApp or call)
  → Option: payment link sent manually

Day +30:
  → Account suspended
  → Data retained 90 days
  → BullMQ job scheduled: if no payment in 90 days → archive data

PAYMENT CLEARED at any point:
  → All features restored within 60 seconds
  → Listings re-synced automatically
  → Website maintenance page removed
  → Dealer notified: "Your account has been restored."
```

---

### 4.3 Marketplace Moderation Journey (C2C Listings)

```
TRIGGER: C2C seller submits listing

Step 1 — Automated pre-screen:
  → Minimum 4 photos (reject if < 4)
  → Valid BD phone format (reject if invalid)
  → Price sanity: reject if price > IMV_p95 × 3 or price < IMV_p5
  → Duplicate VIN check (same VIN already active → flag for review)
  → Image hash check (known stock photo hashes → reject)
  → Make/model/year exists in vehicle database (reject if not)

PASS → enters moderation queue (status: pending_moderation)
FAIL → immediate rejection with specific reason + resubmit guidance

Step 2 — Content Moderator review:
  REVIEW CHECKLIST:
  ☐ Photos show real car (not stock image, not competitor watermark)
  ☐ Photos show the actual car described (year/color/model plausible match)
  ☐ Specs consistent (e.g., 2019 model with 12,000km is plausible; 2015 with 5,000km is suspicious)
  ☐ Price consistent with IMV range (IMV shown to moderator in panel)
  ☐ No prohibited content in description (competitor promotion, off-platform contact push)
  ☐ Seller phone not on flagged_contacts list

Step 3 — Outcome:
  APPROVED:
  → listing status: active
  → Seller SMS: "Your listing is live: [URL]"
  → Listed in marketplace + enters MeiliSearch index

  REJECTED:
  → Specific reason selected from dropdown
  → Seller SMS: "Your listing was not approved: [reason].
    You have [X] resubmit attempts remaining."
  → Max 3 resubmit attempts; after 3 → listing closed, account flagged

  FLAGGED:
  → Listing published but tagged internally as suspicious
  → Increased monitoring on this seller's future submissions
  → No impact on listing visibility

SLA:
  Business hours (9am–6pm BD):  2-hour review
  Off-hours:                     12-hour review (morning queue)
```

---

### 4.4 Dealer Suspension & Reinstatement Journey

```
SUSPENSION TRIGGER:
  a. Payment grace period elapsed (automated → status = suspended)
  b. Policy violation confirmed (manual → Operations Manager action)
  c. Fraudulent listing pattern detected (automated flag → Operations Manager confirms)

SUSPENSION EFFECTS (immediate, automatic):
  → DMS: read-only (dealer can view data, cannot add/edit/delete)
  → Marketplace listings: hidden (not deleted — preserved for reinstatement)
  → Dealer website: maintenance page served
  → New incoming leads: blocked (enquiry form returns "dealer unavailable")
  → Automation sequences: paused
  → All suspension effects logged in platform_audit_logs

DEALER NOTIFICATION:
  → SMS: reason + "Contact support to resolve: [WhatsApp link]"
  → In-app: banner with specific reason and resolution steps

REINSTATEMENT PATH:
  A. Payment cleared:
     → Automated: all effects reversed within 60 seconds
     → Listings re-synced (sync_vehicle.restore jobs fired for all vehicles)
     → Dealer notified via SMS

  B. Policy violation lifted:
     → Operations Manager confirms resolution
     → Manual reinstatement in admin panel
     → Optional: probation flag added (extra monitoring for 90 days)

TERMINATION (irreversible, Super Admin only):
  → Requires Super Admin approval (not Operations Manager)
  → All listings deleted from marketplace
  → Website returns 404
  → CNAME deregistered from Cloudflare
  → Data retained 7 years (regulatory compliance)
  → Termination reason + approver logged in platform_audit_logs
  → Dealer cannot reapply (phone + business name blacklisted)
```

---

## 5. Monetization Model with Unit Economics

### 5.1 Subscription Plan Structure

| Feature | Free | Starter | Professional | Business | Enterprise |
|---|---|---|---|---|---|
| Monthly price (BDT) | 0 | 2,999 | 5,999 | 9,999 | Custom |
| Monthly price (USD approx.) | $0 | ~$27 | ~$54 | ~$91 | Custom |
| Staff seats | 1 | 3 | 10 | 25 | Unlimited |
| Vehicle listings | 10 | 50 | 200 | 500 | Unlimited |
| Showroom locations | 1 | 1 | 2 | 5 | Unlimited |
| Marketplace auto-publish | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dealer microsite | Subdomain | Subdomain | Subdomain | Custom domain | White-label |
| CRM (leads + pipeline) | Basic | Full | Full | Full + AI scoring | Full + AI |
| Maestro AI insights | ❌ | Basic | Full | Full | Full |
| Automation Hub | ❌ | WhatsApp basic | WhatsApp + Facebook | All channels | All + custom |
| GMC + FB Catalog | ❌ | ❌ | ✅ | ✅ | ✅ |
| Facebook Lead Ad sync | ❌ | ❌ | ✅ | ✅ | ✅ |
| Analytics & reports | Basic KPIs | Standard | Advanced | Advanced + export | Custom BI |
| SMS notifications/mo | 100 | 500 | 2,000 | 5,000 | Custom |
| Free listing boosts/mo | 0 | 0 | 2 | 5 | Unlimited |
| Support channel | In-app | WhatsApp | WhatsApp + call | Dedicated rep | SLA contract |

---

### 5.2 Additional Revenue Streams

| Stream | Unit Price | Volume Driver | Revenue Type |
|---|---|---|---|
| Per-lead charge (Free tier) | BDT 150–300/lead | Free dealer lead volume | Variable |
| C2C listing fee | BDT 199–799/30 days | Marketplace traffic | Transactional |
| Featured listing boost | BDT 500–2,000/7 days | Dealer demand | Transactional |
| Valuation report | BDT 149/report | Buyer research intent | Transactional |
| OEM advertising (Phase 3) | CPM or monthly fixed | Marketplace scale | Recurring |

---

### 5.3 Unit Economics Per Plan Tier

#### Free Plan (Acquisition vehicle — no direct revenue, critical for marketplace supply)

| Item | Value |
|---|---|
| Infrastructure cost per dealer/mo | ~BDT 200–400 |
| Direct revenue from plan | BDT 0 |
| Indirect revenue (per-lead charges) | BDT 0–3,000/mo (10–20 leads × BDT 150) |
| Target: convert to Starter within | 60 days |
| Conversion rate target | 25–35% |

**Free plan serves two purposes:** (1) seeding marketplace with dealer inventory (solves cold-start), (2) acquiring paying dealers who need more listings/seats after validating value.

---

#### Starter Plan — BDT 2,999/mo

| Item | Value |
|---|---|
| Gross revenue | BDT 2,999 |
| Infrastructure cost/dealer | ~BDT 400 |
| Gross margin | ~BDT 2,599 (~87%) |
| Customer support cost | ~BDT 300 (WhatsApp support, ~30min/mo avg) |
| Net margin per dealer | ~BDT 2,299 (~77%) |
| Break-even dealers for this plan | 15 dealers covers full MVP infrastructure |
| Target dealer profile | 10–30 cars in stock, 1–2 salespeople |
| Upsell trigger | "You've hit 50 listing limit" OR "FB Lead Ads sync needed" |

---

#### Professional Plan — BDT 5,999/mo

| Item | Value |
|---|---|
| Gross revenue | BDT 5,999 |
| Infrastructure cost/dealer | ~BDT 700 (higher sync, automation, GMC volume) |
| Gross margin | ~BDT 5,299 (~88%) |
| Support cost | ~BDT 500 (call + WhatsApp) |
| Net margin per dealer | ~BDT 4,799 (~80%) |
| Target dealer profile | 30–100 cars, 3–5 staff, active Facebook/Google ads |
| Upsell trigger | Needs all-channel automation OR 200+ listings |

---

#### Business Plan — BDT 9,999/mo

| Item | Value |
|---|---|
| Gross revenue | BDT 9,999 |
| Infrastructure cost/dealer | ~BDT 1,200 |
| Gross margin | ~BDT 8,799 (~88%) |
| Support cost | ~BDT 1,000 (dedicated rep allocation) |
| Net margin per dealer | ~BDT 7,799 (~78%) |
| Target dealer profile | 100–300 cars, multi-location, custom domain, high automation volume |

---

### 5.4 Revenue Projections (Subscription Only)

| Milestone | Free Dealers | Paying Dealers | Plan Mix | MRR (BDT) | Net Margin |
|---|---|---|---|---|---|
| Month 1 | 20 | 0 | — | 0 | — |
| Month 2 | 40 | 5 | All Starter | 14,995 | ~77% |
| Month 3 | 80 | 10 | 8 Starter, 2 Pro | 35,990 | ~80% |
| Month 6 | 150 | 30 | 20S, 8P, 2B | 1,11,980 | ~82% |
| Month 9 | 300 | 80 | 45S, 25P, 10B | 3,62,430 | ~85% |
| Month 12 | 500 | 200 | 100S, 70P, 30B | 10,19,800 | ~87% |
| Month 18 | 800 | 500 | 200S, 200P, 100B | 29,98,000 | ~88% |
| Month 24 | 1,000 | 1,000 | 350S, 450P, 200B | 60,99,500 | ~89% |

> Marketplace revenue (leads, C2C, boosts, reports) estimated at +25–40% on top of subscription MRR by Month 12.

---

### 5.5 BD Price Sensitivity Analysis

| Plan | Monthly BDT | Daily BDT equivalent | BD dealer context |
|---|---|---|---|
| Starter | 2,999 | ~100 | Cost of 2–3 cups of tea per day. Less than a single newspaper ad. |
| Professional | 5,999 | ~200 | Cost of one Facebook ad boost. Dealer spends 3–5× this on untracked manual tools. |
| Business | 9,999 | ~333 | Less than 1 hour of showroom staff cost. ROI visible if closes even 1 extra deal/month. |

**Key insight:** BD dealers are price-sensitive in absolute terms but ROI-driven. The framing must always be:
- "This costs less than your Facebook boost spend"
- "One extra deal per month pays for 3 months of subscription"
- "Free plan covers your first 10 listings — no risk"

---

### 5.6 LTV and CAC Targets

| Metric | Target | Basis |
|---|---|---|
| Monthly churn (paid) | < 5% | BD SaaS benchmark |
| Average LTV (Starter) | BDT 55,000 | 18-month avg tenure × BDT 2,999 |
| Average LTV (Professional) | BDT 1,15,000 | 19-month avg × BDT 5,999 |
| Target CAC | < BDT 5,000 | Ground sales + Facebook ads blended |
| LTV:CAC ratio target | > 10:1 | Premium for BD infrastructure economics |

---

## 6. PRD — Feature Prioritization Matrix

### 6.1 Framework

Priority ratings:
- **P0** — Launch blocker. Platform cannot go live without this.
- **P1** — Core value. Users expect this; absence causes churn within 30 days.
- **P2** — Competitive advantage. Differentiator, not table stakes.

Phases:
- **Phase 1** — MVP (Months 1–4): Dealer onboarding, core DMS, marketplace, basic website
- **Phase 2** — Growth (Months 5–9): Automation Hub, Maestro AI, advanced analytics
- **Phase 3** — Scale (Months 10+): OEM advertising, white-label, Southeast Asia expansion

Effort:
- **S (Small)** — 1–3 dev-days
- **M (Medium)** — 1–2 weeks
- **L (Large)** — 3–6 weeks
- **XL (Extra Large)** — 6+ weeks, likely spans sprints

---

### 6.2 Dealer OS Features

| Feature | Priority | Phase | Effort | Rationale |
|---|---|---|---|---|
| Dealer registration + approval flow | P0 | 1 | M | No dealers = no platform |
| JWT authentication (dealer + admin, RS256) | P0 | 1 | M | Security foundation |
| Multi-tenant RLS (dealership_id isolation) | P0 | 1 | L | Data security |
| Vehicle CRUD (manual entry) | P0 | 1 | M | Core inventory function |
| Vehicle status state machine | P0 | 1 | S | Prevents double-selling |
| Photo upload (mobile camera → R2) | P0 | 1 | M | Required for listings |
| Lead capture from marketplace | P0 | 1 | M | Core value exchange |
| Lead pipeline (8 stages, Kanban) | P0 | 1 | L | CRM core |
| Deal Record (sale price, payment, Bill of Sale) | P0 | 1 | M | Core transaction |
| Bill of Sale PDF generation | P1 | 1 | M | Dealers need this for compliance |
| VIN scan (camera → NHTSA → auto-populate) | P1 | 1 | M | BD dealers scan VINs; saves 5 min/car |
| Recon checklist + task assignment | P1 | 1 | M | Recon tracking is a core pain point |
| Type 1 expenses (per-VIN) | P1 | 1 | M | Profit visibility |
| Type 2 expenses (operational) | P1 | 1 | S | P&L completeness |
| Profit calculator per VIN | P1 | 1 | S | Owner's #1 request |
| Role-based access (Owner/Manager/Salesperson) | P1 | 1 | M | Privacy + accountability |
| Aging watchlist (30/45/60/90 day tiers) | P1 | 1 | S | Reduces dead stock |
| Lead source tracking | P1 | 1 | S | Attribution data |
| Lost reason (mandatory dropdown) | P1 | 1 | S | Insight into loss patterns |
| Follow-up reminders (BullMQ) | P1 | 1 | S | Reduces 40% lead loss |
| Morning briefing (in-app) | P2 | 1 | M | Daily engagement driver |
| Bangla UI toggle | P1 | 1 | L | Required for BD staff; not Phase 2 |
| PWA offline support (core flows) | P1 | 1 | L | BD connectivity baseline |
| Maestro AI insights (nightly) | P2 | 2 | XL | Differentiator, not MVP blocker |
| Lead scoring engine | P2 | 2 | L | Upgrades CRM from tracking to intelligence |
| Daily summary SMS (8am) | P2 | 2 | M | Owner engagement |
| Automation Hub — WhatsApp basic | P1 | 2 | L | BD primary channel; critical for Pro tier value |
| Automation Hub — WhatsApp Advanced (API) | P2 | 2 | XL | Lead nurturing sequences |
| Automation Hub — Facebook | P2 | 2 | L | Meta Lead Ad sync is key for Pro plan |
| Automation Hub — Social Media auto-post | P2 | 2 | M | Operational marketing efficiency |
| Automation Hub — Email sequences | P2 | 2 | M | Supporting channel |
| Automation Hub — SMS campaigns | P2 | 2 | M | BD primary channel; high ROI |
| Staff performance analytics | P2 | 2 | M | Manager accountability |
| Revenue/profit analytics (Owner) | P1 | 1 | M | Core owner need; drives retention |
| Inventory turnover analytics | P2 | 2 | S | Insights layer |
| Advanced analytics export | P2 | 3 | M | Enterprise plan feature |

---

### 6.3 Dealer Website Builder Features

| Feature | Priority | Phase | Effort | Rationale |
|---|---|---|---|---|
| Subdomain auto-provisioning (slug.autoverse.com.bd) | P0 | 1 | M | Live site is core value prop |
| Auto-inventory from Dealer OS (ISR) | P0 | 1 | M | Without this, website is just a landing page |
| Per-listing SEO (title, meta, Schema.org) | P1 | 1 | M | SEO is primary long-term buyer traffic source |
| WhatsApp CTA on every listing page | P0 | 1 | S | BD primary contact method |
| IMV deal rating badge on website listings | P1 | 1 | S | Trust signal for buyer on dealer's own site |
| Google Analytics 4 auto-setup | P2 | 1 | S | Small effort, high value for dealers |
| Facebook Pixel auto-inject | P1 | 2 | S | Required for Facebook DVA retargeting |
| Custom domain connection (CNAME) | P2 | 1 | M | Business plan feature; Cloudflare Worker routing |
| Google Merchant Center feed (auto-sync) | P2 | 2 | L | Shopping ads distribution |
| Facebook Catalog API sync | P2 | 2 | L | Dynamic Vehicle Ads |
| Website theme/color customization | P2 | 1 | M | Dealer branding |
| Sitemap auto-generation + GSC submission | P2 | 1 | S | SEO infrastructure |
| About page (auto-generated from profile) | P1 | 1 | S | Basic site completeness |
| Contact page (Maps, hours, phone) | P1 | 1 | S | Basic site completeness |
| White-label subdomain (enterprise) | P2 | 3 | L | Enterprise plan only |

---

### 6.4 Marketplace Features

| Feature | Priority | Phase | Effort | Rationale |
|---|---|---|---|---|
| Vehicle search (MeiliSearch) with filters | P0 | 1 | L | Core buyer experience |
| Vehicle listing detail page (ISR) | P0 | 1 | M | Core buyer experience |
| IMV deal rating display | P0 | 1 | M | The key differentiator vs Bikroy |
| Dealer profile page | P0 | 1 | M | Trust signal |
| Buyer enquiry form → dealer CRM | P0 | 1 | M | Core value exchange |
| C2C listing wizard (5 steps) | P1 | 1 | L | Marketplace supply from non-dealers |
| C2C listing moderation queue | P1 | 1 | M | Quality control |
| IMV real-time range in C2C pricing step | P1 | 1 | S | Key C2C value; shows market data in-flow |
| Save vehicle / saved search | P1 | 1 | M | Buyer retention and re-engagement |
| Price drop alert (BullMQ) | P2 | 2 | S | High engagement trigger |
| Make/model/district browse pages (SSG) | P1 | 1 | M | Programmatic SEO at scale |
| Price trends chart per make/model | P1 | 2 | M | Research buyer value; drives return visits |
| Valuation tool | P2 | 2 | M | Monetizable (BDT 149 report) + lead gen |
| Featured listing slots | P1 | 2 | S | Revenue + dealer upsell |
| Expert reviews/research pages | P2 | 2 | L | SEO content depth; buyer trust |
| IMV trends API (public) | P2 | 3 | M | Data licensing / OEM partnership potential |

---

### 6.5 Platform Admin Features

| Feature | Priority | Phase | Effort | Rationale |
|---|---|---|---|---|
| Dealer registration approval workflow | P0 | 1 | M | Platform gatekeeping |
| Dealer lifecycle management (status changes) | P0 | 1 | M | Operations foundation |
| C2C moderation queue | P1 | 1 | M | Marketplace quality |
| Subscription billing management | P0 | 1 | L | Revenue infrastructure |
| Failed payment queue + recovery actions | P1 | 1 | M | Revenue recovery |
| Platform audit logs | P1 | 1 | M | Compliance + accountability |
| Feature flag system (global/plan/dealer) | P1 | 1 | M | Rollout control |
| System health dashboard | P1 | 1 | M | Operational visibility |
| Impersonation (Super Admin) | P2 | 1 | S | Support capability |
| Platform KPIs dashboard | P1 | 2 | M | Investor + operator visibility |
| IMV parameter management | P1 | 2 | M | Market intelligence control |
| Broadcast notifications (SMS/in-app) | P2 | 2 | S | Platform comms |
| OEM advertising management (Phase 3) | P2 | 3 | L | Marketplace monetization |

---

### 6.6 Infrastructure & Technical Requirements

| Feature | Priority | Phase | Effort | Rationale |
|---|---|---|---|---|
| Sync Engine (vehicles → marketplace_listings) | P0 | 1 | XL | Core platform architecture |
| BullMQ queue architecture (all queues) | P0 | 1 | L | Async backbone |
| bKash + Nagad + SSLCommerz payment integration | P0 | 1 | L | BD payment stack |
| bKash idempotency_key implementation | P0 | 1 | S | Double-charge prevention |
| Greenweb BD SMS integration | P0 | 1 | S | Primary critical channel in BD |
| Cloudflare R2 file storage | P0 | 1 | S | Photo/PDF storage |
| MeiliSearch index setup | P0 | 1 | M | Search backbone |
| Redis caching (IMV clusters, session, queues) | P0 | 1 | M | Performance |
| WebSocket (Socket.io) for real-time lead alerts | P1 | 1 | M | Lead notification SLA |
| FCM push notifications | P1 | 1 | M | Mobile dealer engagement |
| Image optimization pipeline (Sharp → WebP) | P1 | 1 | S | BD bandwidth baseline |
| Custom domain routing (Cloudflare Worker) | P2 | 1 | M | Business plan feature |
| Google Merchant Center feed API | P2 | 2 | M | Marketing channel |
| Facebook Graph API (catalog + inbox) | P2 | 2 | L | Marketing channel |
| WhatsApp Business API integration | P2 | 2 | L | Core automation channel |
| Sentry error monitoring | P1 | 1 | S | Production stability |
| PostHog product analytics | P2 | 1 | S | Feature usage visibility |
| CI/CD pipeline (GitHub Actions) | P1 | 1 | M | Deployment safety |

---

### 6.7 Phase Summary

| Phase | Timeline | Core Goal | Success Criteria |
|---|---|---|---|
| **Phase 1: MVP** | Months 1–4 | First 50 dealers live. Marketplace with 500+ listings. First 5 paying subscriptions. | 50 active dealers, 500+ listings, first transaction tracked through platform |
| **Phase 2: Growth** | Months 5–9 | Automation Hub live. Maestro AI. 200 paying dealers. | BDT 10L MRR. < 10% monthly churn. 1,000+ marketplace leads/month |
| **Phase 3: Scale** | Months 10+ | 500+ paying dealers. OEM advertising. Regional expansion signals. | BDT 30L+ MRR. First OEM advertising contract. 50,000+ active marketplace listings |

---

*AutoVerse — Step 1: Product Strategy & Market Architecture*
*Prepared against Blueprint v7.0*
