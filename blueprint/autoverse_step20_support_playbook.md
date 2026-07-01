# AutoVerse — Step 20: Customer Support Playbook
### Response Templates · Escalation Paths · Fraud Detection · Issue Resolutions · v1.0

> **For:** AutoVerse Customer Support Agents, Operations Managers, Finance Admins
> **Language:** All dealer-facing templates in Bangla (primary) with English guide notes
> **Scope:** Dealer support, buyer support, C2C seller support, admin-side fraud procedures
> **Channels:** WhatsApp (primary), Email (secondary), In-app chat (tertiary)

---

## TABLE OF CONTENTS

1. [Support Team Structure & SLAs](#1-support-team-structure--slas)
2. [Triage Guide — Issue Classification](#2-triage-guide--issue-classification)
3. [Response Templates — Account & Access](#3-response-templates--account--access)
4. [Response Templates — Inventory & Sync](#4-response-templates--inventory--sync)
5. [Response Templates — Leads & CRM](#5-response-templates--leads--crm)
6. [Response Templates — Payments & Billing](#6-response-templates--payments--billing)
7. [Response Templates — Automation & WhatsApp](#7-response-templates--automation--whatsapp)
8. [Response Templates — Marketplace & Listings](#8-response-templates--marketplace--listings)
9. [Response Templates — Buyers & C2C Sellers](#9-response-templates--buyers--c2c-sellers)
10. [Escalation Decision Tree](#10-escalation-decision-tree)
11. [Finance Admin Fraud Detection Procedures](#11-finance-admin-fraud-detection-procedures)
12. [Support Metrics & Quality Standards](#12-support-metrics--quality-standards)

---

## 1. SUPPORT TEAM STRUCTURE & SLAs

### Team Roles

```
TIER 1 — Support Agent (Front Line)
  Handles: Password resets, basic how-to questions, billing queries,
           listing help, sync issues, WhatsApp setup
  Cannot: Approve/suspend dealers, issue refunds > BDT 1,000,
           access admin panel without Ops Manager
  Escalates to: Tier 2 (CS Agent) or Ops Manager

TIER 2 — CS Agent (Customer Success)
  Handles: Escalated account issues, churn prevention, upsell conversations,
           complex technical troubleshooting, refund decisions ≤ BDT 5,000
  Cannot: Terminate dealers, process refunds > BDT 5,000, IMV overrides
  Escalates to: Ops Manager or Finance Admin

TIER 3 — Operations Manager
  Handles: Dealer approvals, suspensions, reinstatements, fraud investigations,
           refunds > BDT 5,000, policy exceptions
  
TIER 4 — Finance Admin
  Handles: Revenue reconciliation, large refunds, failed payment resolution,
           fraud detection and reporting to management

TIER 5 — System Admin / Tech Team
  Handles: Platform bugs, data corruption, infrastructure issues
```

### Support Channels & SLA

```
CHANNEL           AVAILABLE HOURS           FIRST RESPONSE SLA   RESOLUTION SLA
──────────────────────────────────────────────────────────────────────────────────
WhatsApp (Primary) Sat–Thu 9AM–9PM BD time  2 hours              24 hours
Email              Sat–Thu 9AM–6PM           4 hours              48 hours
In-app chat        Sat–Thu 9AM–9PM           2 hours              24 hours
──────────────────────────────────────────────────────────────────────────────────
CRITICAL issues    24/7 on-call (Ops Mgr)   15 minutes           2 hours
  (payment failures, data breach suspicion, platform down)
```

### Auto-Acknowledgment (sent within 60 seconds of any message)

```
Bangla:
"আপনার বার্তা পেয়েছি! আমরা শীঘ্রই যোগাযোগ করব।
রেফারেন্স: #[TICKET_ID]
সময়: [TIMESTAMP]
সাধারণত ২ ঘণ্টার মধ্যে সাড়া দেওয়া হয়।"

English:
"We've received your message! We'll be in touch shortly.
Reference: #[TICKET_ID]
Time: [TIMESTAMP]
We typically respond within 2 hours."
```

---

## 2. TRIAGE GUIDE — ISSUE CLASSIFICATION

### Priority Matrix

```
PRIORITY 1 — CRITICAL (respond within 15 minutes, page on-call)
  ⛔ Platform completely inaccessible (all users)
  ⛔ Confirmed or suspected data breach
  ⛔ Double-charge confirmed (dealer billed twice)
  ⛔ bKash/Nagad payment gateway down
  ⛔ Dealer threatening public complaint / media
  ⛔ Legal notice received

PRIORITY 2 — HIGH (respond within 2 hours)
  🔴 Dealer cannot log in (account locked, OTP failing)
  🔴 Listings not appearing on marketplace (active dealer, urgent)
  🔴 Leads not being received (active paid dealer)
  🔴 WhatsApp automation not sending (automation failure)
  🔴 Payment failed but dealer claims they paid
  🔴 Dealer account wrongly suspended

PRIORITY 3 — MEDIUM (respond within 4 hours)
  🟡 Photos not uploading
  🟡 VIN scan not working
  🟡 Sync error on vehicle (single vehicle, not all inventory)
  🟡 Bill of Sale PDF not generating
  🟡 Staff member cannot log in
  🟡 Billing question (invoice clarification)

PRIORITY 4 — LOW (respond within 24 hours)
  🟢 How-to questions (feature explanation)
  🟢 Feature requests
  🟢 Minor display issues (non-functional)
  🟢 Password change request
  🟢 Business profile update
```

### Triage Questions (ask if priority unclear)

```
1. "আপনি কি এখন ব্যবসায়িক কাজে আটকে আছেন?"
   [Are you currently blocked from doing business?]
   YES → Priority 2+; NO → Priority 3-4

2. "কোনো টাকা-পয়সার বিষয় আছে?"
   [Is there a payment/money issue involved?]
   YES → Priority 2+; escalate to Finance Admin

3. "এই সমস্যা কতক্ষণ ধরে হচ্ছে?"
   [How long has this issue been happening?]
   > 4 hours for a paid dealer → escalate to Tier 2
```

---

## 3. RESPONSE TEMPLATES — ACCOUNT & ACCESS

### T-ACC-01: Cannot Log In (OTP not receiving)

```
TRIGGER: "OTP আসছে না" / "লগইন হচ্ছে না"

FIRST RESPONSE:
Bangla:
"ভাই/আপু, অসুবিধার জন্য দুঃখিত। OTP সমস্যাটা দেখছি।

এই কাজগুলো করে দেখুন:
১. নম্বরটা ঠিক আছে কিনা চেক করুন (01X-XXXX-XXXX ফরম্যাটে)
২. SMS inbox-এ AutoVerse লিখে সার্চ করুন
৩. Spam/block folder চেক করুন
৪. আরেকবার 'Resend Code' ট্যাপ করুন

কোনটা কাজ করেছে? জানান।
Reference: #[TICKET_ID]"

INTERNAL ACTION WHILE WAITING:
  → Check Greenweb BD logs for this phone number
  → Verify phone number is in correct format in database
  → Check if number is on DND registry

IF PERSISTS AFTER 5 MINUTES:
Bangla:
"সিস্টেম থেকে দেখছি আপনার নম্বরে SMS পাঠানো হয়েছে।
কিছু ক্ষেত্রে বাংলাদেশে SMS একটু দেরি হয়।

বিকল্প হিসেবে, password দিয়ে লগইন করার চেষ্টা করুন।
অথবা আমাদের একটু সাহায্য করতে দিন — আপনার [registered phone] নম্বরে
আমরা সরাসরি ফোন করব।"

ESCALATION: If unresolved after 15 minutes → Ops Manager to manually trigger OTP
             or reset account via admin panel.
```

### T-ACC-02: Password Reset

```
TRIGGER: "পাসওয়ার্ড ভুলে গেছি" / "লক হয়ে গেছে"

RESPONSE:
Bangla:
"পাসওয়ার্ড রিসেট করা সহজ:

১. app.autoverse.com.bd/login খুলুন
২. 'Forgot Password?' ট্যাপ করুন
৩. আপনার রেজিস্টার্ড মোবাইল নম্বর দিন
৪. OTP দিয়ে নতুন পাসওয়ার্ড সেট করুন

কাজ হয়েছে? জানান। না হলে সরাসরি সাহায্য করব।"

NOTE: If account was locked after failed attempts (> 10):
  → Admin must unlock via admin panel → Operations Manager required
  → After unlocking: send password reset instructions above
```

### T-ACC-03: Account Approval Delay

```
TRIGGER: "অ্যাকাউন্ট অ্যাপ্রুভ হচ্ছে না" / "অনেকক্ষণ হয়ে গেছে"

CHECK FIRST: Was registration complete? (business name, phone, district all filled?)
             When was registration submitted? (> 4 hours = SLA breach)

RESPONSE (within SLA):
Bangla:
"ধন্যবাদ রেজিস্ট্রেশনের জন্য। আমরা সাধারণত ২-৪ ঘণ্টার মধ্যে অ্যাপ্রুভ করি।
আপনার আবেদনটা দেখছি। শীঘ্রই SMS পাঠানো হবে।"

RESPONSE (SLA breached — > 4 hours):
Bangla:
"দুঃখিত, একটু দেরি হয়ে গেছে। এখনই অ্যাপ্রুভ করছি।
কয়েক মিনিটের মধ্যে SMS আসবে।"

INTERNAL: Immediately escalate to Ops Manager via #autoverse-ops group:
  "Approval SLA breached: [Business Name], registered [time]. Please approve."
  Ops Manager must action within 15 minutes of this message.
```

### T-ACC-04: Staff Member Cannot Access Account

```
TRIGGER: "আমার সেলসম্যান ঢুকতে পারছে না"

RESPONSE:
Bangla:
"আপনার সেলসম্যানের ব্যাপারে কিছু প্রশ্ন:

১. তাকে কি Settings → Team Members থেকে invite করা হয়েছে?
২. Invite SMS পেয়েছেন? Link ট্যাপ করেছেন?
৩. Account নিজে create করেছেন?

যদি invite না করা থাকে, আপনার account থেকে করে দেব — নম্বরটা দিন।"

ESCALATION CHECKLIST:
  → Is the dealer on a plan with ≥ 2 staff seats? (Free plan = 1 seat)
  → If staff seat limit reached: upsell opportunity → explain plan upgrade
  → If invite link expired (> 7 days): resend invite from admin panel
```

---

## 4. RESPONSE TEMPLATES — INVENTORY & SYNC

### T-INV-01: Vehicle Not Appearing on Marketplace

```
TRIGGER: "গাড়ি Marketplace-এ দেখা যাচ্ছে না"

DIAGNOSTIC FLOW (check internally before responding):
  1. Is dealership.status = 'active'? (not pending, suspended)
  2. Is vehicle.status = 'available'? (not in_recon, acquired, sold)
  3. Is vehicle.marketplace_published = true?
  4. Does vehicle have ≥ 4 photos?
  5. Is there a sync error? (sync_error Redis key set?)
  6. Is marketplace_listing record present with status = 'active'?

RESPONSE (general):
Bangla:
"গাড়িটা Marketplace-এ না দেখানোর কারণ সাধারণত এগুলোর একটা:

১. গাড়ির status 'Available' আছে? (In Recon বা অন্য status থেকে দেখা যায় না)
২. 'Publish to Marketplace' toggle ON আছে? (Stock card → Marketplace tab)
৩. কমপক্ষে ৪টা ছবি আছে?
৪. Sync error badge দেখাচ্ছে কিনা চেক করুন

Stock number বা গাড়ির নাম জানালে আমি সরাসরি দেখতে পারব।"

IF SYNC ERROR CONFIRMED:
Bangla:
"আপনার [Make Model] এ sync সমস্যা ছিল — এখন ঠিক করা হয়েছে।
'Sync Now' চাপলে ২ সেকেন্ডের মধ্যে Marketplace-এ দেখাবে।
[লিংক: autoverse.com.bd/cars/search?make=...]"

INTERNAL ACTION:
  → If multiple vehicles affected: check sync-vehicle queue depth in Bull Board
  → If queue depth > 500: alert System Admin
  → Manual sync trigger via admin panel if needed
```

### T-INV-02: VIN Scan Not Working

```
TRIGGER: "VIN স্ক্যান কাজ করছে না"

RESPONSE:
Bangla:
"VIN scan-এর জন্য কিছু টিপস:

১. ভালো আলোতে স্ক্যান করুন — রোদের দিকে গাড়ির পিঠ রাখুন
২. বারকোড পরিষ্কার করুন — মাঝেমধ্যে ধুলো থাকে
৩. ক্যামেরা বারকোড থেকে ১৫-২০ সেমি দূরে রাখুন
৪. ফোনটা স্থির রাখুন

এরপরও না হলে 'Manual Entry' করুন — VIN নম্বরটা সরাসরি টাইপ করুন।
জাপানি reconditioned গাড়িতে কখনো কখনো JDM VIN কাজ করে না —
সেক্ষেত্রে manually make/model/year দিন।"
```

### T-INV-03: Photos Not Uploading

```
TRIGGER: "ছবি আপলোড হচ্ছে না"

RESPONSE:
Bangla:
"ছবি আপলোড সমস্যার সমাধান:

১. App-এ camera/storage permission আছে কিনা দেখুন
   (Phone Settings → Apps → AutoVerse → Permissions)
২. Internet connection চেক করুন — ছবি আপলোডে ভালো connection দরকার
৩. সরাসরি App camera দিয়ে তুলুন (gallery থেকে না) — size automatically ছোট হয়
৪. Phone storage কম থাকলে সমস্যা হতে পারে — delete করুন কিছু

যদি এরপরও না হয়, আমাকে screenshot পাঠান — সমস্যাটা দেখব।"

INTERNAL NOTES:
  → Check R2 bucket health
  → Check if Sharp compression is failing (large files > 10MB sometimes cause timeout)
  → If platform-wide: escalate to Tech Team immediately
```

### T-INV-04: Bill of Sale PDF Not Generating

```
TRIGGER: "Bill of Sale তৈরি হচ্ছে না" / "PDF error"

RESPONSE:
Bangla:
"Bill of Sale তৈরিতে সমস্যা হচ্ছে। কিছু চেক করুন:

১. Deal কি 'Approved' status-এ আছে? (Draft বা Pending থেকে PDF হয় না)
২. সব required field পূরণ হয়েছে? (Buyer NID, full address?)

Deal number বা Buyer-এর নাম জানালে সরাসরি দেখতে পারব।"

INTERNAL:
  → Check Puppeteer service health
  → Check R2 upload status for this dealer
  → If Puppeteer timeout: retry job manually from admin panel
  → Resolution SLA: 2 hours (Bill of Sale directly affects deal closing)
```

---

## 5. RESPONSE TEMPLATES — LEADS & CRM

### T-CRM-01: Not Receiving Lead Notifications

```
TRIGGER: "লিড পাচ্ছি না" / "notification আসছে না"

RESPONSE:
Bangla:
"Notification-এর ব্যাপারে কিছু check করুন:

১. Phone-এ AutoVerse app-এর notification permission ON আছে?
   (Phone Settings → Notifications → AutoVerse → Allow)
২. App-এ Settings → Notifications-এ 'New Lead Push' ON আছে?
৩. Phone silent/DND mode-এ নেই তো?

এগুলো ঠিক থাকলে, Lead কি CRM-এ দেখা যাচ্ছে কিন্তু notification আসছে না?
নাকি Lead-ই আসছে না?

সর্বশেষ গাড়িটা কবে add করেছেন? Marketplace-এ live আছে?"

NOTE: If no leads in > 7 days for an active dealer:
  → Check listing quality (photos, price vs IMV)
  → Proactively offer listing optimization call
  → This is a churn risk signal — escalate to CS Agent
```

### T-CRM-02: Lead Showing Duplicate / Merged Incorrectly

```
TRIGGER: "একটা লিড দুইবার দেখাচ্ছে" / "ভুল merge হয়েছে"

RESPONSE:
Bangla:
"ঠিক আছে, দেখছি। একটু জানান:
- কোন দুটো lead-এর কথা বলছেন? (buyer name / phone)
- কোনটা আলাদা থাকা উচিত ছিল?

আমরা admin থেকে separate করে দিতে পারব।"

INTERNAL:
  → Admin can split merged leads (Operations Manager access)
  → Document the case to improve deduplication logic
  → Same phone + different vehicle = should NOT merge (possible bug if merging)
```

### T-CRM-03: Lost Reason Dropdown Not Working (Salesperson Complaint)

```
TRIGGER: "Lost mark করতে পারছি না"

RESPONSE:
Bangla:
"'Lost' করার সময় একটু নিচে scroll করুন — একটা dropdown আসে
'Why was this lead lost?' লেখা।

সেখান থেকে একটা reason select করতে হবে — এটা না করলে Submit হবে না।
এটা ইচ্ছাকৃত — কারণটা জানলে আপনার ব্যবসা উন্নত করতে সাহায্য হয়।

Reason দেওয়ার পরও সমস্যা হলে জানান।"
```

---

## 6. RESPONSE TEMPLATES — PAYMENTS & BILLING

### T-PAY-01: bKash/Nagad Payment Failed

```
TRIGGER: "পেমেন্ট হচ্ছে না" / "bKash কাজ করছে না"

RESPONSE:
Bangla:
"পেমেন্ট সমস্যার জন্য দুঃখিত। কিছু check করুন:

১. bKash/Nagad-এ balance আছে?
২. bKash app খুলে manually transaction আছে কিনা দেখুন
   (কখনো payment হয়ে যায় কিন্তু confirmation আসে না)
৩. আবার try করলে double charge হবে না — আমাদের system এটা protect করে

আপনার invoice number বা transaction reference জানালে
আমি সরাসরি check করতে পারব।

Reference: #[TICKET_ID]"

IF PAYMENT WAS ACTUALLY PROCESSED (bKash shows deduction):
Bangla:
"দেখছি আপনার bKash-এ [amount] কাটা গেছে। আমাদের system-এ
একটু delay হয়েছে — এখনই update করছি।
২-৩ মিনিটের মধ্যে আপনার plan active হবে।"

INTERNAL ACTION:
  → Query bKash payment status via API (GET /payment/status)
  → If status = Completed: manually activate subscription via admin panel
  → Log all manual activations in platform_audit_log
  → Alert Finance Admin if activation required without system confirmation
```

### T-PAY-02: Subscription Grace Period Warning

```
TRIGGER: Proactive outreach (Day 7, 3, 0 before expiry) OR dealer asks about expiry

Bangla:
"আপনার AutoVerse [Plan Name] subscription [X] দিন পরে renew হবে।
Amount: BDT [amount]

bKash বা Nagad-এ balance রাখুন — auto-renewal হবে।
আগেই renew করতে: Settings → Subscription → Renew Now

কোনো সমস্যা হলে আমাদের জানান। #[TICKET_ID]"
```

### T-PAY-03: Account in Read-Only Mode

```
TRIGGER: Dealer complaining they cannot add vehicles or receive leads

CONFIRM FIRST: Is subscription expired + grace period elapsed?

Bangla:
"আপনার subscription-এর grace period শেষ হয়েছে। এই কারণে account
এখন read-only mode-এ — নতুন গাড়ি add করা বা lead receive করা যাচ্ছে না।

Renew করলে সঙ্গে সঙ্গে (৬০ সেকেন্ডের মধ্যে) সব feature ফিরে আসবে।

Renew করুন: Settings → Subscription → Renew Now

Payment সংক্রান্ত কোনো সমস্যা থাকলে আমি সাহায্য করব।"
```

### T-PAY-04: Invoice Clarification (Per-Lead Charges)

```
TRIGGER: "এত টাকা কেন কাটা?" / "per lead charge বুঝলাম না"

Bangla:
"আপনার [Month]-এর invoice-এ per-lead charge আছে। Free plan-এ
Marketplace থেকে আসা qualified lead-এর জন্য charge হয়:
- Standard lead: BDT 150
- High-intent lead: BDT 300

এই invoice-এ [N] টা lead charge করা হয়েছে।

বিস্তারিত দেখতে: Settings → Billing → Lead Invoice

যদি কোনো lead invalid মনে হয় (48 ঘণ্টার মধ্যে) — সেটা 'Mark Invalid' করুন।
Starter plan-এ upgrade করলে এই per-lead charge আর থাকবে না।"

INTERNAL: Provide breakdown of charges if dealer requests
          Cross-reference with lead records in database
          Dispute window check: was dispute filed within 48 hours?
```

### T-PAY-05: Refund Request

```
TRIGGER: "টাকা ফেরত চাই" / "refund দেন"

ESCALATION: All refund requests must go to Finance Admin. Support agent does NOT process refunds.

RESPONSE:
Bangla:
"আপনার refund request বুঝতে পেরেছি। আমাদের Finance team
আপনার case টা দেখবে — সাধারণত ২৪ ঘণ্টার মধ্যে সিদ্ধান্ত নেওয়া হয়।

বিস্তারিত জানান:
- কত টাকার refund চাইছেন?
- কী কারণে?
- কোন invoice/transaction?

Reference: #[TICKET_ID] — Finance Admin forward করা হচ্ছে।"

INTERNAL: Create Finance Admin ticket with:
  - Dealer name, ID, subscription tier
  - Invoice numbers in question
  - Reason for refund request
  - Agent's assessment (legitimate / suspicious / unclear)
  Finance Admin responds within 24 hours with decision.
```

### T-PAY-06: Potential Double Charge

```
TRIGGER: "দুইবার কাটা গেছে" / "double charge"

⚠️ CRITICAL — HANDLE IMMEDIATELY (Priority 1)

RESPONSE:
Bangla:
"এটা অবশ্যই সমাধান করব — অনুগ্রহ করে এখনই জানান:

১. কোন payment method (bKash/Nagad/Card)?
২. কোন তারিখে?
৩. আপনার bKash/Nagad statement-এ কতটা transaction দেখাচ্ছে?
৪. AutoVerse-এ কতটা invoice আছে?

Reference: #[TICKET_ID] — এটা আমাদের সর্বোচ্চ priority।
৩০ মিনিটের মধ্যে আপনাকে জানাব।"

INTERNAL (CRITICAL PROCEDURE):
  1. DO NOT promise refund without Finance Admin confirmation
  2. Immediately alert Finance Admin and Ops Manager
  3. Collect: payment_transaction records, bKash trxIDs, invoice records
  4. Finance Admin checks: is this genuinely a double charge or confusion?
  5. If confirmed double charge: refund within 3 business days via same channel
  6. Document in platform_audit_log as CRITICAL incident
  7. Tech team reviews idempotency logs to find root cause
  See Section 11 for full fraud detection procedure.
```

---

## 7. RESPONSE TEMPLATES — AUTOMATION & WHATSAPP

### T-AUTO-01: WhatsApp Not Sending

```
TRIGGER: "WhatsApp auto-reply কাজ করছে না" / "automation off"

DIAGNOSTIC QUESTIONS:
  → Which tier? Basic (Away/Greeting only) or Advanced (WABA sequences)?
  → What specifically isn't working?

RESPONSE (Basic tier — Away Message):
Bangla:
"WhatsApp Away Message-এর জন্য:

১. Automation Hub → WhatsApp → Away Message toggle ON আছে?
২. Business Hours ঠিকমতো set করা আছে?
   (Settings → Business Profile → Business Hours)
৩. বর্তমান সময় কি business hours-এর বাইরে?
   (Away message শুধু outside hours-এ কাজ করে)

Correctly set থাকলে next message-এ test করে দেখুন।"

RESPONSE (Advanced tier — Sequence not triggering):
Bangla:
"Sequence সমস্যার জন্য:
১. Rule টা 'Active' আছে কিনা (toggle ON)?
২. Daily limit পৌঁছে গেছে কিনা?
   (Automation Hub → Logs দেখুন — 'rate_limit_exceeded' আছে?)
ৃ৩. WhatsApp API connection ঠিক আছে?
   (Automation Hub → WhatsApp → Connection status)

Automation Logs-এ কোনো error দেখলে screenshot পাঠান।"
```

### T-AUTO-02: Facebook Lead Ads Not Syncing

```
TRIGGER: "Facebook leads CRM-এ আসছে না"

Bangla:
"Facebook Lead Ads sync check:

১. Automation Hub → Facebook → Lead Ads Sync status দেখুন
   'Active ✅' আছে? নাকি অন্য কিছু?
২. Facebook Business Manager-এ connection আছে?
   (Website & Marketing → Channel Connections → Facebook)
৩. Lead Ad form-টা কোন Facebook Page-এ? সেই Page কি connected?

Last sync time কত? ওটা জানালে দেখতে পারব।

Facebook token expire করলে reconnect করতে হয় — সেটাও
check করুন। #[TICKET_ID]"

INTERNAL:
  → Check dealer_integration.fb_page_access_token expiry
  → Check facebook-catalog-sync queue for errors
  → If error 190 (token expired): dealer must reconnect in Channel Connections
```

### T-AUTO-03: WhatsApp Rate Limit Reached

```
TRIGGER: "WhatsApp message যাচ্ছে না" / "limit শেষ"

Bangla:
"দেখছি আপনার আজকের WhatsApp limit (১,০০০ messages) পৌঁছে গেছে।
আজকের বাকি messages গুলো আগামীকাল সকালে automatically পাঠানো হবে।

Limit বাড়ানোর জন্য WABA Tier upgrade দরকার — এটা Meta এর কাছে
আবেদন করতে হয়। আপনি চাইলে আমরা এটা শুরু করতে সাহায্য করব।

Professional plan-এ upgrade করলে higher tier পাওয়া সহজ হয়।"
```

---

## 8. RESPONSE TEMPLATES — MARKETPLACE & LISTINGS

### T-MKT-01: C2C Listing Rejected

```
TRIGGER: "আমার listing reject হয়েছে কেন?"

Check admin panel for rejection reason, then:

Bangla (if fake_photos reason):
"আপনার listing review করে দেখা গেছে ছবিগুলো আসল গাড়ির মনে হচ্ছে না।
আপনার নিজের গাড়ির সত্যিকার ছবি দিয়ে আবার submit করুন।
আরো ৩ বার submit করার সুযোগ আছে।"

Bangla (if price_out_of_range reason):
"আপনার listing-এ দেওয়া দাম বাজার মূল্য থেকে অনেক বেশি বা কম।
সঠিক দাম দিয়ে আবার submit করুন — listing wizard-এ দাম দেওয়ার সময়
market range দেখানো হয়।"

Bangla (if specs_mismatch reason):
"আপনার listing-এর তথ্য গাড়িটার সাথে মিলছে না।
সঠিক make/model/year দিয়ে আবার submit করুন।"

ESCALATION: If dealer disagrees with rejection:
  → CS Agent reviews with Content Moderator
  → If moderation was incorrect: approve manually, apologize to dealer
```

### T-MKT-02: Buyer Reports Fake Listing

```
TRIGGER: Buyer contacts saying a dealer listing is fraudulent/misleading

⚠️ PRIORITY 2 — Handle within 2 hours

Bangla (to buyer):
"আপনার report পেয়েছি। ধন্যবাদ জানানোর জন্য। আমরা এটা যাচাই করব।
৪ ঘণ্টার মধ্যে আপনাকে জানাব।
Reference: #[TICKET_ID]"

INTERNAL:
  1. Log report in moderation queue
  2. Check: is this the 2nd report on this listing in 24h?
     YES → Auto-hide listing → Content Moderator reviews
     NO → Add flag, monitor
  3. Contact dealer via WhatsApp:
     "ভাই, আপনার [listing] নিয়ে একটা customer report এসেছে।
      বিস্তারিত জানুন এবং আমাদের জানান কোনো সমস্যা আছে কিনা।
      #[TICKET_ID]"
  4. If fraudulent listing confirmed: remove listing, warn dealer,
     flag account for monitoring, second offense = suspension
```

### T-MKT-03: IMV Rating Seems Wrong (Dealer Complaint)

```
TRIGGER: "আমার গাড়িতে Overpriced দেখাচ্ছে, ঠিক না"

Bangla:
"IMV rating টা বাজারের তুলনামূলক listing থেকে automatically calculate হয়।
যদি মনে হয় rating ঠিক নেই, কারণ হতে পারে:

১. আপনার গাড়ির variant বা condition unique (fewer comparable listings)
২. আপনার গাড়ি অন্যদের চেয়ে ভালো condition-এ — listing-এ বিস্তারিত লিখুন
৩. দাম সামান্য কমালেই 'Fair Price' বা 'Good Deal' হবে

Market range দেখানো হচ্ছে [p25]–[p75] BDT।
আপনার দাম [price], market median [imv_p50]।

Rating টা automatically update হয় — দাম পরিবর্তন করলে ২ সেকেন্ডে নতুন rating দেখাবে।"
```

---

## 9. RESPONSE TEMPLATES — BUYERS & C2C SELLERS

### T-BUYER-01: Buyer — How to Contact a Dealer

```
TRIGGER: "ডিলারের সাথে কথা বলব কীভাবে?"

Bangla:
"গাড়ির listing page-এ দুটো option আছে:

১. 'WhatsApp' button — ডিলারের WhatsApp-এ সরাসরি message যাবে
   (সবচেয়ে দ্রুত পদ্ধতি)
২. 'Enquire' button — আপনার নাম ও phone number দিয়ে form submit করুন,
   ডিলার ফোন করবে

কোনো listing-এর link পাঠাতে পারেন — আমি সেই ডিলারের contact info দিতে পারব।"
```

### T-BUYER-02: Buyer — Suspected Scam

```
TRIGGER: "মনে হচ্ছে scam" / "ডিলার সন্দেহজনক"

⚠️ PRIORITY 2

Bangla:
"গুরুত্বপূর্ণ তথ্য দেওয়ার জন্য ধন্যবাদ।

অনুগ্রহ করে জানান:
- কোন listing-এর কথা বলছেন? (link বা গাড়ির নাম)
- কী সন্দেহজনক মনে হয়েছে?
- কোনো টাকা দিয়েছেন? (দিলে অবশ্যই জানান)

আমরা অবিলম্বে যাচাই করব।
Reference: #[TICKET_ID]

IMPORTANT: কোনো advance payment দেবেন না গাড়ি না দেখে।
AutoVerse কখনো advance payment বা token money নেওয়ার জন্য বলে না।"

INTERNAL:
  → Immediately flag listing for review
  → If money involved: alert Ops Manager, advise buyer to contact DNCRP
  → If dealer confirmed fraudulent: suspend immediately, preserve evidence
```

### T-BUYER-03: C2C Seller — Listing Not Approved After 2+ Hours

```
TRIGGER: "listing submit করলাম, approve হচ্ছে না"

Bangla:
"আপনার listing review করা হচ্ছে। Business hours-এ (Sat–Thu 9AM–9PM)
সাধারণত ২ ঘণ্টার মধ্যে হয়।

আপনার listing reference number: [ID]
Status: Pending Moderation

কোনো সমস্যা থাকলে আপনার registered number-এ SMS পাঠানো হবে।
এখন কোনো অতিরিক্ত কাজ করার দরকার নেই।"

IF > 4 HOURS (business hours):
  → Content Moderator must review immediately
  → If approved: "আপনার listing এখন live: [URL]"
  → If issues found: reject with clear reason and resubmission guide
```

---

## 10. ESCALATION DECISION TREE

```
INCOMING ISSUE
     │
     ▼
┌─────────────────────────────────────────────────┐
│ Is this a Priority 1 (Critical) issue?          │
│ (Platform down, double charge, data breach,     │
│  dealer threatening media)                      │
└─────────────────────────────────────────────────┘
     │
   YES ──────────────────────────────────────────────►
     │                                               IMMEDIATELY:
   NO                                                1. Alert on-call Ops Manager (phone call)
     │                                               2. Post in #autoverse-ops: "P1 ALERT: [issue]"
     ▼                                               3. Do NOT attempt to resolve alone
┌─────────────────────────────────────────────────┐  4. Keep dealer updated every 15 minutes
│ Is money involved?                              │◄──
│ (Payment failed, refund request, double charge) │
└─────────────────────────────────────────────────┘
     │
   YES ──────────────────────────────────────────────►
     │                                               1. Tier 1: Do NOT promise refund
   NO                                               2. Collect all transaction details
     │                                               3. Create Finance Admin ticket
     ▼                                               4. Finance Admin responds in 24h
┌─────────────────────────────────────────────────┐
│ Is account access blocked?                      │
│ (Cannot log in, account wrongly suspended)      │
└─────────────────────────────────────────────────┘
     │
   YES ──────────────────────────────────────────────►
     │                                               1. Tier 1 handles OTP/password resets
   NO                                               2. Escalate account unlocks to Ops Manager
     │                                               3. SLA: resolved within 2 hours
     ▼
┌─────────────────────────────────────────────────┐
│ Is this a paid dealer (Starter+)?               │
│ with a functional issue (sync, leads, PDF)?     │
└─────────────────────────────────────────────────┘
     │
   YES ──────────────────────────────────────────────►
     │                                               1. Tier 1 attempts resolution
   NO                                               2. If unresolved in 30 min → Tier 2
     │                                               3. CS Agent takes ownership
     ▼                                               4. Resolution SLA: 4 hours
┌─────────────────────────────────────────────────┐
│ Is this a how-to question or general query?     │
└─────────────────────────────────────────────────┘
     │
   YES ──────────────────────────────────────────────► Tier 1 resolves with templates
     │                                                  SLA: 24 hours
   NO
     │
     ▼
Assess and escalate to appropriate tier based on complexity
```

### Escalation Message Format (Agent → Manager)

```
When escalating, always use this format in the internal group:

"🚨 ESCALATION [PRIORITY LEVEL]
Ticket: #[ID]
Dealer: [Business Name] | [Plan] | Account: [X months old]
Issue: [One sentence]
What I tried: [Steps taken]
What I need: [Specific ask — approval, refund auth, admin action]
Time sensitive: YES/NO
Customer mood: Calm / Frustrated / Threatening
Direct link: [Admin panel URL if applicable]"
```

---

## 11. FINANCE ADMIN FRAUD DETECTION PROCEDURES

### 11.1 Types of Financial Fraud to Monitor

```
TYPE 1: Double-Charge Claims
  Definition: Dealer claims bKash/Nagad deducted twice for one invoice
  Risk level: CRITICAL (brand-destroying if true)
  
TYPE 2: Payment Without Activation
  Definition: Payment gateway confirms payment but system didn't activate subscription
  Risk level: HIGH (revenue reconciliation issue)
  
TYPE 3: Fake C2C Payment
  Definition: C2C seller claims to have paid listing fee but no transaction in system
  Risk level: MEDIUM
  
TYPE 4: Subscription Manipulation
  Definition: Dealer downgraded themselves but claims they shouldn't have been
  Risk level: LOW
  
TYPE 5: Fraudulent Dealer
  Definition: Fake dealership registered to abuse free plan benefits or
              to create fake listings for advance payment scams
  Risk level: HIGH
```

### 11.2 Double-Charge Investigation Procedure

```
STEP 1: COLLECT EVIDENCE (Finance Admin)
  From dealer:
    □ Screenshot of bKash/Nagad transaction history showing 2 deductions
    □ Transaction dates and amounts
    □ Reference numbers from bKash/Nagad SMS receipts
    □ Invoice numbers from AutoVerse Settings → Billing

  From system:
    □ payment_transaction records WHERE dealership_id = X AND created_at BETWEEN [dates]
    □ invoice records for the alleged period
    □ idempotency_key values for each transaction
    □ gateway_transaction_id for each transaction
    □ Redis payment_processing lock records (if still available)

STEP 2: VERIFY WITH PAYMENT GATEWAY (Finance Admin)
  bKash:
    → Login to bKash merchant dashboard
    → Transaction History → filter by date range and amount
    → Confirm: how many transactions show for this dealer?
    → Get trxIDs for all matching transactions

  Nagad:
    → Login to Nagad merchant dashboard
    → Cross-reference with dealer's provided transaction IDs

STEP 3: DETERMINATION
  Case A: Genuine double charge confirmed
    (Two different trxIDs, same amount, same dealer, same invoice)
    ACTION:
      1. Process refund via bKash Refund API for the duplicate amount
         POST /tokenized/checkout/payment/refund
         {paymentID, amount, trxID, reason: "duplicate_charge"}
      2. Settlement: 1–3 business days to dealer's bKash
      3. Notify dealer immediately with trxID confirmation
      4. Compensation: add 1 month free to subscription
      5. File incident report (template below)
      6. Tech team investigates root cause within 48 hours

  Case B: Misunderstanding (one payment, one failed attempt fee)
    (Some banks/mobile wallets briefly hold funds on failed attempts)
    ACTION:
      1. Explain clearly: "bKash-এ যে hold দেখাচ্ছে সেটা 3-5 দিনে
         ফেরত আসবে — এটা charge নয়, hold। আমাদের কাছে শুধু একটা payment আসে।"
      2. Provide evidence: show dealer the single payment_transaction record
      3. Share transaction ID so dealer can cross-reference with bKash

  Case C: Unable to determine
    ACTION:
      1. Do NOT process refund yet
      2. Escalate to Ops Manager and CTO
      3. Engage bKash merchant support directly
      4. Resolution within 48 hours with dealer kept updated

STEP 4: INCIDENT REPORT (all confirmed double charges)
  File in Finance Admin logs:
  
  "DOUBLE CHARGE INCIDENT REPORT
  Date: [DATE]
  Dealer: [Name] | [ID] | [Plan]
  Amount overcharged: BDT [X]
  Payment method: [bKash/Nagad]
  Transaction IDs: [trxID1] | [trxID2]
  Invoice ID: [ID]
  Root cause (from Tech): [explanation]
  Resolution: Refund processed [DATE] via [method]
  Compensation: [1 month free / other]
  Prevention measure: [what was fixed]"
```

### 11.3 Failed Payment Reconciliation Procedure

```
DAILY RECONCILIATION (Finance Admin, 11:00 AM)

Step 1: Pull report from admin panel
  GET /admin/payments/failed
  Filter: last 24 hours

Step 2: For each failed payment:
  □ Check: was it a genuine failure or a timeout (status = 'pending')?
  □ Check: was gateway queried for actual status?
  □ Check: how many retry attempts were made?

Step 3: Manual interventions required:
  □ Payment status = 'pending' for > 2 hours:
    → Manually query gateway API
    → If Completed: manually activate subscription via admin panel
    → Log in platform_audit_log

  □ Payment status = 'failed' after all retries:
    → Send dealer a personal WhatsApp (not automated):
      "ভাই, আপনার payment-এ একটু সমস্যা হয়েছে।
       আমরা সাহায্য করতে পারি — কি এখন সুবিধা আছে?"
    → Offer: direct payment link, alternative method, grace period reminder

Step 4: Weekly reconciliation
  Every Sunday:
  □ Total revenue in system vs total gateway settlements match?
  □ Any transactions with status = 'success' but no activation?
  □ Any activations without a matching payment_transaction?
  Discrepancies > BDT 1,000: escalate to CTO immediately
```

### 11.4 Fraudulent Dealer Detection

```
RED FLAGS — review any dealer account that shows ≥ 2 of these:

REGISTRATION RED FLAGS:
  □ Multiple accounts from same IP address
  □ Phone number registered before (different business name)
  □ Business name is generic ("Car Dealer BD", "Auto House")
  □ Trade license number format doesn't match Bangladesh RJSC format
  □ Unusually rapid registration completion (< 2 minutes for all fields)

BEHAVIOR RED FLAGS:
  □ Listing vehicles with prices far below market (< IMV_p5)
     [Advance payment scam: low price attracts buyers, then asks for token]
  □ All listings have stock photo watermarks or duplicate images
  □ High volume of buyer complaints about same dealer in short period
  □ Dealer asks buyers to pay "booking fee" outside the platform
  □ Multiple C2C sellers with same vehicle on same account
  □ Listing deleted immediately after enquiry received (bait-and-switch)

AUTOMATED ALERTS (system generates these, Finance Admin reviews):
  □ Single dealer with > 10 buyer complaints in 7 days
  □ Dealer with > 3 listing removals for policy violations
  □ New dealer (< 30 days) attempting to list > plan limit immediately
  □ Unusual login pattern (multiple countries/cities in same day)

INVESTIGATION PROCEDURE:
  1. Do NOT suspend immediately without evidence
  2. Ops Manager reviews red flags with Content Moderator
  3. If advance payment scam suspected: suspend listings (not full account) pending review
  4. If confirmed fraud: terminate account, preserve all data for potential legal action
  5. If buyer lost money: refer to relevant Bangladesh consumer protection authority
     (Directorate of National Consumer Rights Protection — DNCRP)
  6. File incident report with all evidence

BLACKLIST PROCEDURE:
  After confirmed fraud:
    → Add business name, phone number, NID (if known) to suspended_entities table
    → Block re-registration with same phone or business name
    → Ban IP if single IP was used exclusively
```

### 11.5 Finance Admin Monthly Reporting

```
MONTHLY FINANCE REPORT (due on 5th of each month)

Section 1: Revenue Summary
  Total subscription revenue: BDT [X]
  Total per-lead revenue: BDT [X]
  Total C2C listing fees: BDT [X]
  Total featured boost fees: BDT [X]
  Total refunds issued: BDT [X]
  Net revenue: BDT [X]

Section 2: Payment Health
  Payment success rate: X%
  Failed payments: X (X% of attempts)
  Manual activations required: X
  Double-charge incidents: X (amount: BDT [X])

Section 3: Fraud Summary
  Fraudulent accounts detected: X
  Accounts terminated for fraud: X
  Buyer complaints: X
  Estimated fraud losses prevented: BDT [X]

Section 4: Exceptions Requiring Management Review
  [List any anomalies > BDT 5,000 or policy-level decisions]
```

---

## 12. SUPPORT METRICS & QUALITY STANDARDS

### Key Performance Indicators

```
METRIC                          TARGET              MEASUREMENT
─────────────────────────────────────────────────────────────────────
First Response Time (WhatsApp)  ≤ 2 hours           Per-ticket time log
First Response Time (Priority1) ≤ 15 minutes        Per-ticket time log
Resolution Time (P1)            ≤ 2 hours           Ticket close time
Resolution Time (P2)            ≤ 24 hours          Ticket close time
Resolution Time (P3-P4)         ≤ 48 hours          Ticket close time
Customer Satisfaction (CSAT)    ≥ 4.0 / 5.0         Post-resolution survey
First Contact Resolution Rate   ≥ 60%               Tickets resolved in 1 interaction
Escalation Rate                 ≤ 20%               Escalated / Total tickets
SLA Breach Rate                 ≤ 5%                Breached / Total tickets
Double-Charge Incidents         0 per month         Finance Admin report
```

### Post-Resolution Message (send after every resolved ticket)

```
Bangla:
"আপনার সমস্যাটা সমাধান হয়েছে বলে আশা করি।
কোনো মতামত থাকলে এখানে বলুন — আমরা সবসময় উন্নত হওয়ার চেষ্টা করি।

ধন্যবাদ AutoVerse ব্যবহারের জন্য।
[Your Name] — AutoVerse Support"

English:
"I hope your issue is resolved.
If you have any feedback, please let us know — we're always looking to improve.

Thank you for using AutoVerse.
[Your Name] — AutoVerse Support"
```

### CSAT Survey (sent 4 hours after resolution)

```
WhatsApp message:
"আপনার support experience কেমন ছিল? (1–5)
1️⃣ খুব খারাপ | 2️⃣ খারাপ | 3️⃣ ঠিকঠাক | 4️⃣ ভালো | 5️⃣ চমৎকার

একটি নম্বর reply করুন।"
```

### Quality Review Checklist (weekly, per agent)

```
WEEKLY QUALITY AUDIT — review 5 random tickets per agent:

  ☐ First response was within SLA?
  ☐ Correct template used (or appropriate adaptation)?
  ☐ Issue was correctly classified (right priority)?
  ☐ Escalation decision was correct (under/over-escalated)?
  ☐ Resolution was complete (issue actually fixed, not just closed)?
  ☐ Dealer communication was in Bangla (unless dealer communicated in English)?
  ☐ Follow-up sent after resolution?
  ☐ CSAT survey sent?
  ☐ No promises made that couldn't be kept?
  ☐ Payment/refund decisions only made with Finance Admin approval?

Score: X / 10 (each point = 1 mark)
Below 7: coaching required
Below 5: retraining required
```

### Support Agent Daily Shift Routine

```
START OF SHIFT (9:00 AM):
  ☐ Check overnight messages (off-hours queue)
  ☐ Prioritize any P1/P2 issues from overnight
  ☐ Review Finance Admin overnight alerts
  ☐ Check system health dashboard for any active incidents
  ☐ Review BullMQ queue depths (any DLQ items?)

DURING SHIFT:
  ☐ Respond to all new messages within SLA
  ☐ Follow up on open tickets approaching SLA breach
  ☐ Update ticket status in CRM as issues progress
  ☐ Escalate anything outside your resolution authority immediately

END OF SHIFT (6:00 PM / 9:00 PM):
  ☐ Handover note to on-call/next shift: any open P1/P2 issues
  ☐ Close all resolved tickets
  ☐ Log daily ticket count for metrics
  ☐ Flag any recurring issue pattern to Ops Manager
```

---

*AutoVerse — Step 20: Customer Support Playbook*
*Response Templates · Escalation Paths · Fraud Detection · Issue Resolutions · v1.0*
