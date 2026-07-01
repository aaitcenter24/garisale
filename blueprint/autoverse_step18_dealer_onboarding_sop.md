# AutoVerse — Step 18: Dealer Onboarding SOP
### Ground Team Step-by-Step Procedure · In-App Onboarding Checklist · 7-Day Activation Funnel · v1.0

> **Two documents in one:**
> **A)** The SOP for the AutoVerse onboarding team (sales rep, remote support)
> **B)** The in-app onboarding checklist specification (what the dealer sees in their dashboard)
>
> **Definition of "Activated":** Dealer has listed ≥ 5 vehicles with photos AND received and replied to ≥ 1 lead within 7 days of registration.
> **Activation target:** ≥ 40% of registered dealers activated within 7 days.
> **Platform health rule:** Platform must have ≥ 200 active listings before buyer acquisition begins (Step 10).

---

## TABLE OF CONTENTS

1. [Onboarding Roles & Responsibilities](#1-onboarding-roles--responsibilities)
2. [Ground Team SOP — Full Walkthrough](#2-ground-team-sop--full-walkthrough)
3. [Remote Onboarding SOP](#3-remote-onboarding-sop)
4. [In-App Onboarding Checklist Specification](#4-in-app-onboarding-checklist-specification)
5. [The 7-Day Activation Funnel](#5-the-7-day-activation-funnel)
6. [Common Blockers & Fixes](#6-common-blockers--fixes)
7. [Support Escalation Paths](#7-support-escalation-paths)
8. [Onboarding Metrics & Reporting](#8-onboarding-metrics--reporting)

---

## 1. ONBOARDING ROLES & RESPONSIBILITIES

```
ROLE                    RESPONSIBILITY                              HANDOFF POINT
─────────────────────────────────────────────────────────────────────────────────
Ground Sales Rep        In-person visits, account creation,         After first car listed
                        first vehicle listed, WhatsApp setup        → passes to Onboarding CS

Onboarding CS Agent     Remote follow-up (Day 1–7), inventory       After 5 cars listed
(Customer Success)      assistance, troubleshooting, check-ins      + first lead received
                                                                    → passes to Account Manager

Account Manager         Ongoing relationship, upsell to paid plan,  Ongoing (paid plans only)
                        monthly check-ins, feature adoption

Operations Manager      Dealer approval in admin panel (< 4h SLA)   After approval → CS notified
(Admin Panel)           Reviews registration, approves/rejects

Support (WhatsApp)      Reactive dealer questions, technical issues  Escalate to CS or Ops
                        Response SLA: 2h business hours
```

---

## 2. GROUND TEAM SOP — FULL WALKTHROUGH

### PRE-SESSION PREPARATION (Before leaving office)

```
CHECKLIST — GROUND REP:
  ☐ Confirm dealer is expecting you (or has agreed to a demo from prior visit)
  ☐ Look up dealer on Facebook: note their inventory type, approximate size
  ☐ Check if dealer has any existing digital presence (Facebook page, Bikroy listing)
  ☐ Have AutoVerse rep account logged in and synced on your phone
  ☐ Have demo dealer account loaded with realistic BD inventory (Toyota Axio, Honda Fit, etc.)
  ☐ Printed card with your name and WhatsApp number
  ☐ Battery > 80%, mobile data on
  ☐ Know nearest printer location for any physical documents if needed (rare)
  ☐ Review yesterday's follow-up notes for this dealer (if returning visit)
```

---

### STEP 1 — ACCOUNT REGISTRATION (5–8 minutes)

**Who does this:** Sales rep, on dealer's phone (preferred) or rep's phone.
**Target:** Account created AND OTP verified before moving to Step 2.

#### 1.1 Navigate to registration

```
URL: app.autoverse.com.bd/register  OR
PWA: Search "AutoVerse" in browser → Add to Home Screen
     (recommend this — dealer has app icon permanently)
```

#### 1.2 Fill registration form

**Fields to fill with dealer:**

| Field | Instructions |
|---|---|
| **Mobile Number** | Enter dealer OWNER's personal mobile (primary login). Format: 01XXXXXXXXX (auto-formats to +880) |
| **Full Name** | Owner's full name (not business name — this is the user account) |
| **Password** | Suggest: [business_name]2025 as a memorable pattern. Min 8 chars. Write it down for them. |

**Bangla guidance to say:**
> "এই নম্বরে OTP আসবে। আপনার নিজের নম্বর দিন — এটাই আপনার লগইন হবে।"
*[This number will receive an OTP. Use your own number — this will be your login.]*

#### 1.3 OTP verification

```
OTP arrives via Greenweb BD SMS within 30 seconds.
If OTP delayed > 60 seconds:
  → Tap "Resend Code"
  → If still failing: check number format, try again
  → Escalation: call support WhatsApp immediately (don't waste dealer's time)
```

#### 1.4 Create dealership profile

After OTP verified, dealer is prompted to create dealership:

| Field | Instructions |
|---|---|
| **Business Name** | Exact trading name (e.g., "Dhaka Auto House", "Rahim Motors") |
| **Trade License No.** | Ask for physical trade license if present. If unavailable: "পরে দেবেন, এখন এড়িয়ে যান" |
| **District** | Select from dropdown — where the showroom is located |
| **Phone** | Showroom landline or business mobile (can be same as owner mobile) |
| **WhatsApp Number** | The WhatsApp number buyers should contact (may differ from login number) |

```
IMPORTANT: Business name cannot be changed easily later.
Verify spelling before saving — typos cause problems on:
  - Dealer website URL: dhaka-auto-house.autoverse.com.bd
  - Bill of Sale PDFs
  - Marketplace dealer profile page
```

#### 1.5 Awaiting approval (explain this clearly)

**Bangla:**
> "এখন আমাদের টিম আপনার অ্যাকাউন্টটা একটু দেখবে — সাধারণত ২-৪ ঘণ্টার মধ্যে অ্যাপ্রুভ হয়ে যায়। অ্যাপ্রুভ হলে SMS আসবে। এর মধ্যে গাড়ি যোগ করা শুরু করতে পারবেন।"

*[Now our team will review your account — usually approved within 2-4 hours. You'll get an SMS when approved. You can start adding cars in the meantime.]*

```
NOTE FOR OPERATIONS TEAM:
  Approval SLA: ≤ 4 hours (business hours). ≤ 8 hours (off-hours).
  Approval checks:
    1. Business name is real (Google/Facebook search if suspicious)
    2. Phone number is BD mobile format
    3. Not on blacklist (suspended_entity table)
    4. No duplicate account from same phone
  Auto-approve threshold: phone verified + business name appears valid
  Manual review trigger: generic names ("Car Dealer"), no trade license, repeat IP from known fraudster
```

---

### STEP 2 — BUSINESS PROFILE COMPLETION (3–5 minutes)

**Navigate to:** Settings → Business Profile

#### 2.1 Complete profile fields

| Field | Why it matters | Instructions |
|---|---|---|
| **Logo** | Appears on dealer website + marketplace dealer page | Take photo of their sign/banner if no digital logo. Use phone camera. |
| **Tagline** | Shows on website header | Suggest: "আপনার বিশ্বস্ত গাড়ির ডিলার" or their own slogan |
| **Address** | Google Maps embed on contact page | Full showroom address including lane number |
| **Business Hours** | Used by WhatsApp away message automation | Set realistically — most BD dealers: Sat–Thu 9 AM–6 PM, Fri 2 PM–6 PM |
| **Brand Color** | Website header and UI accents | Show color picker. Suggest their existing brand color if known. |

**Bangla tip when setting business hours:**
> "এই সময়টা গুরুত্বপূর্ণ — এর বাইরে কেউ WhatsApp করলে অটোমেটিক একটা মেসেজ যাবে বলে আপনি ব্যস্ত আছেন।"
*[This is important — if someone WhatsApps outside these hours, an automatic message will go saying you're busy.]*

---

### STEP 3 — FIRST VEHICLE LISTING (8–12 minutes)

**This is the highest priority step. Do not leave without completing this.**
**Target: ≥ 5 vehicles listed. Minimum acceptable: 1 vehicle before leaving.**

#### 3.1 Navigate to inventory

```
Bottom tab: Inventory → tap + FAB button → "Add Vehicle"
```

#### 3.2 VIN scanning (preferred method)

**Bangla:**
> "এই গাড়িটার বারকোড কোথায়? সাধারণত উইন্ডশিল্ডের কোণায় থাকে, অথবা ড্যাশবোর্ডে।"
*[Where is this car's barcode? Usually at the corner of the windshield or on the dashboard.]*

```
VIN LOCATION GUIDE (for sales rep's reference):
  Toyota Axio/Allion/Premio: windshield sticker (driver side, bottom-left)
  Honda Fit/City:            VIN plate on door jamb (driver side)
  Nissan March/Note:         Windshield sticker OR engine bay plate
  If barcode damaged/missing: type 17-char VIN manually
                              OR switch to manual entry (no VIN required)

VIN scan success: specs auto-populate → confirm with dealer → move to photos
VIN scan failure: "ম্যানুয়ালি টাইপ করি" → proceed with manual entry
```

#### 3.3 Manual form completion (when VIN unavailable)

**Fields to complete (in order of importance):**

```
REQUIRED BEFORE PUBLISHING:
  Make:        Select from dropdown
  Model:       Select from dropdown (filtered by make)
  Year:        4-digit year (e.g., 2019)
  Mileage:     KM (BD dealers often say "km" — confirm unit)
  Fuel Type:   Petrol / Diesel / Hybrid / Electric / CNG
  Transmission: Automatic / Manual
  Condition:   Used / Reconditioned (Japanese reconditioned cars = "Reconditioned")
  Asking Price: In BDT (no commas — auto-formats)

IMPORTANT / NICE TO HAVE:
  Engine CC:   Ask dealer ("ইঞ্জিন কত CC?")
  Color:       Self-explanatory
  Variant:     G Grade, X Grade, etc. (helps buyers)
  Acquisition Cost: PRIVATE — dealer often reluctant → explain: "শুধু আপনি দেখতে পাবেন, লাভ হিসাব করার জন্য"
               [Only you can see this, it's for calculating profit]
```

**Bangla for mileage confusion:**
> "মাইলেজটা KM-এ দিন — ODO-তে যা দেখাচ্ছে। মাইলে দেওয়া লাগবে না।"
*[Give mileage in KM — whatever the ODO shows. No need to give in miles.]*

#### 3.4 Photos (critical for marketplace performance)

**Minimum: 4 photos. Target: 8+ photos.**

**Photo angles to take — in order:**

```
MUST HAVE (minimum 4):
  1. Front 3/4 view (exterior, driver side front — the "hero shot")
  2. Rear 3/4 view (exterior, passenger side rear)
  3. Dashboard + speedometer (shows mileage reading)
  4. Interior — front seats

STRONGLY RECOMMENDED (for 40% more enquiries):
  5. Driver side full profile
  6. Engine bay (open hood)
  7. Rear seats
  8. Boot/trunk space

OPTIONAL BUT GOOD:
  9.  Tyre tread close-up (shows condition)
  10. Any damage close-up (transparency builds trust)
  11. Infotainment / navigation screen
  12. Roof (if sunroof)
```

**Bangla photography guidance:**
> "ছবি তোলার সময় গাড়িটার সামনে ভালো আলো থাকতে হবে। রোদের দিকে গাড়ির পিঠ রাখুন — এভাবে ছবি পরিষ্কার আসে।"
*[When taking photos, there should be good light in front of the car. Keep the car's back toward the sun — photos come out clearer this way.]*

```
PHOTO QUALITY CHECKLIST:
  ☐ No blurry photos (if blurry → retake, app will warn)
  ☐ No watermarks from other platforms
  ☐ No price/phone number written on car
  ☐ Primary photo set to front exterior (not interior)
  ☐ Minimum 4 photos uploaded before "Save & Publish"
```

#### 3.5 Save and publish

```
Tap "Save & Publish" → vehicle syncs to marketplace within 2 seconds
Show dealer: open autoverse.com.bd → search their car → IT'S LIVE
"দেখুন — আপনার গাড়ি এখন সারাদেশ দেখতে পাচ্ছে।"
[See — your car is now visible to the whole country.]
```

#### 3.6 Repeat for additional vehicles

**Target: ≥ 5 vehicles listed per session.**

```
EFFICIENCY TIP: For dealers with large inventory (20+ cars):
  Instead of adding all cars one by one during the visit,
  offer the CSV import service:
    "আপনার কাছে এক্সেল ফাইল আছে? আমরা আপলোড করে দিতে পারি।"
    [Do you have an Excel file? We can upload it for you.]
  
  If yes: collect the file via WhatsApp → operations team does bulk import
  If no: list the 5 most popular/recently acquired vehicles today
         and schedule a second visit for the rest
```

---

### STEP 4 — WHATSAPP CONFIGURATION (3–5 minutes)

**Why critical:** WhatsApp is the primary lead response channel. Without this, leads die.

#### 4.1 Set WhatsApp number

```
Navigate: Settings → Business Profile → WhatsApp Number
  Enter: the WhatsApp number buyers should reach on
  Verify: tap "Test" → a test message link appears → confirm it opens correct WhatsApp
```

#### 4.2 Configure away message (Basic tier)

```
Navigate: Automation Hub → WhatsApp → Away Message
  Toggle: ON
  Review default message (pre-filled from business hours)
  Customize if dealer has specific message preferences

DEFAULT AWAY MESSAGE (shows in app):
  "Hi! We're currently closed. Our business hours are [hours].
   We'll respond first thing when we open. For urgent matters: [phone]"
  
  BANGLA VERSION (shown when language = bn):
  "হ্যালো! আমরা এখন বন্ধ আছি। আমাদের সময়: [সময়]।
   খোলার পরপরই জানাব। জরুরি বিষয়ে: [ফোন]"
```

#### 4.3 Configure greeting message (Basic tier)

```
Navigate: Automation Hub → WhatsApp → Greeting Message
  Toggle: ON (recommended)
  Message: Pre-filled. Dealer can customize.
  
PURPOSE: Sent once to every new contact who messages for the first time.
         Creates instant professional impression.
```

#### 4.4 Quick replies setup

```
Navigate: Automation Hub → WhatsApp → Quick Replies
  Pre-filled templates available. Dealer can edit.
  Recommended to keep defaults for now.
  
EXPLAIN TO DEALER:
"যখন কোনো কাস্টমার WhatsApp করে, আপনার সেলসম্যান এই Quick Reply গুলো
 ট্যাপ করে পাঠাতে পারবে — টাইপ করতে হবে না।"
[When a customer WhatsApps, your salesperson can tap these Quick Replies to send — no typing needed.]
```

---

### STEP 5 — DEALER WEBSITE LAUNCH (3–5 minutes)

**Navigate:** Website & Marketing → Set Up Website

#### 5.1 Run setup wizard

```
WIZARD STEPS (walk dealer through each):

Step 1 — Brand Setup:
  Logo: use the one uploaded in business profile (auto-populated)
  Tagline: confirm or customize
  Color: confirm or adjust
  Phone + WhatsApp: auto-populated from profile
  Business Hours: auto-populated from settings
  → Tap "Save & Continue"

Step 2 — Live Review:
  Show dealer their LIVE website URL:
  Format: [dealer-slug].autoverse.com.bd
  Example: dhaka-auto-house.autoverse.com.bd
  
  DEMO: Open URL on dealer's phone right now.
  Show vehicles auto-populated on their site.
  
  SHARE MOMENT:
  "এখন আপনি এই লিংকটা কাস্টমারদের Facebook-এ, WhatsApp-এ শেয়ার করতে পারবেন।
   এটা আপনার নিজের ওয়েবসাইট।"
  [Now you can share this link on Facebook, WhatsApp to customers. This is your own website.]
  
  Tap "Share Your Website" → WhatsApp deeplink → dealer shares to their own contacts ✅

Step 3 — Custom Domain: Skip for now
  "এটা পরে করা যাবে। আপনার নিজের domain থাকলে তখন যুক্ত করব।"
  [This can be done later. If you have your own domain, we'll add it then.]

Step 4 — Channel Connections: Skip for now
  Only connect GA4/Facebook if dealer explicitly asks
  "এটা পরে করব — আজকে মূল কাজটা হয়ে গেছে।"
  [We'll do this later — the main work is done today.]
```

---

### STEP 6 — TEAM MEMBER INVITATION (2–3 minutes, if applicable)

**Do this ONLY if dealer has salespeople with smartphones.**

#### 6.1 Invite a salesperson

```
Navigate: Settings → Team Members → Invite Team Member
  Phone: salesperson's mobile number
  Role: Salesperson (default)
  → Send Invite

Salesperson receives SMS with registration link.
They register with their own password.
They see: only their own leads (configurable by owner).
```

**Bangla explanation to dealer:**
> "আপনার সেলসম্যানকে এখানে অ্যাড করুন। সে শুধু তার নিজের লিড দেখতে পাবে — আপনার লাভ-লোকসানের হিসাব নয়। আপনি সব দেখতে পাবেন।"
*[Add your salesperson here. They can only see their own leads — not your profit/loss figures. You can see everything.]*

---

### STEP 7 — MORNING BRIEFING DEMONSTRATION (2 minutes)

**Show the dealer what their daily experience will look like.**

```
Navigate: Dashboard → Morning Briefing

SHOW:
  "প্রতিদিন সকাল ৮টায় আপনার ফোনে একটা notification আসবে।
   সেখানে গতকালের sales, urgent লিড, এবং বাজারের updates থাকবে।
   একটা ট্যাপেই সব দেখা যাবে।"

[Every morning at 8 AM you'll get a notification on your phone.
 It will have yesterday's sales, urgent leads, and market updates.
 Everything visible in one tap.]

SHOW: The empty dashboard and explain what it will look like in 7 days
      with real data. Use your demo account to show a "lived-in" state.
```

---

### STEP 8 — HANDOFF & EXIT (5 minutes)

#### 8.1 Recap what was done

**Bangla summary to say:**
> "ভাই, আজকে আমরা কী করলাম দেখুন:
> ✅ আপনার অ্যাকাউন্ট তৈরি হয়েছে
> ✅ [X]টা গাড়ি Marketplace-এ live আছে
> ✅ আপনার ওয়েবসাইট চালু হয়েছে: [URL]
> ✅ WhatsApp Away Message চালু আছে
>
> এখন থেকে কাস্টমার enquiry করলে আপনার ফোনে notification আসবে।
> পরের ৭ দিন আমি নিজে follow up করব।"

*[Brother, look at what we did today:
 ✅ Your account is created
 ✅ [X] cars are live on Marketplace
 ✅ Your website is live: [URL]
 ✅ WhatsApp Away Message is active
 
 From now on, when customers enquire you'll get a notification on your phone.
 For the next 7 days I'll personally follow up with you.]*

#### 8.2 Set expectations clearly

**Bangla:**
> "একটু জানাই — প্রথম ২-৩ দিন হয়তো enquiry নাও আসতে পারে। গাড়ির ছবি যত বেশি, দাম যত competitive, তত তাড়াতাড়ি আসে। আমরা মিলে ঠিক করব।"
*[Let me let you know — for the first 2-3 days you may not get enquiries. The more photos you have and the more competitive the price, the faster they come. We'll fix it together.]*

#### 8.3 Exchange contacts

```
Add dealer to your personal WhatsApp contact list:
  Name format: "AutoVerse - [Dealer Name] - [Business Name]"
  Example: "AutoVerse - Karim Bhai - Dhaka Auto House"

Send welcome WhatsApp immediately (within 5 minutes of leaving):
```

**WhatsApp message to send:**

```
আপনার AutoVerse account live:
🌐 Website: [slug].autoverse.com.bd
📱 Dashboard: app.autoverse.com.bd

যেকোনো সমস্যায় আমাকে জানাবেন।
আমি [আপনার নাম], AutoVerse — সবসময় আছি। 🙏

---

[English translation for record-keeping:]
Your AutoVerse account is live:
🌐 Website: [slug].autoverse.com.bd
📱 Dashboard: app.autoverse.com.bd

Let me know about any issues.
I'm [your name], AutoVerse — always here. 🙏
```

#### 8.4 Log the visit (within 30 minutes of leaving)

```
Log in your CRM/tracker:
  Dealer name + business name
  Contact number
  Address / lane number in Dholaikhal
  Visit date + time
  Outcome: Activated / Demo given / Rejected / Follow-up scheduled
  Cars listed: X
  Key pain points noted:
  Next action + date:
  Referrals given: (name + phone)
```

---

## 3. REMOTE ONBOARDING SOP

> For dealers who register via Facebook Lead Ads, SMS campaign, or direct referral — without an in-person visit.

### Remote Onboarding Sequence

```
[TRIGGER: Dealer registers via web]

IMMEDIATE (auto, within 5 minutes):
  SMS: "AutoVerse-এ স্বাগতম! আপনার প্রথম গাড়ি যোগ করুন: app.autoverse.com.bd"
  WhatsApp (if WABA active): Day 0 template — dealer welcome message

DAY 0 (within 2 hours of registration, business hours):
  Remote CS agent calls or WhatsApps:
  "হ্যালো, আমি [নাম], AutoVerse থেকে। আপনি সবে রেজিস্ট্রেশন করেছেন।
   ৫ মিনিট সময় দিলে আপনাকে প্রথম গাড়িটা যোগ করতে সাহায্য করব?"
  [Hello, I'm [name] from AutoVerse. You just registered.
   If you give me 5 minutes I'll help you add your first car?]

  GOAL: Screen share (via WhatsApp video call) OR
        Walk through on call while dealer does it on their own phone.
        Do NOT end call without at least 1 car listed.

DAY 1 (24 hours post-registration):
  If car listed:
    WhatsApp: "আপনার [Make Model] টা Marketplace-এ live আছে। আরো কয়েকটা যোগ করুন, আরো বেশি enquiry আসবে।"
  If no car listed:
    WhatsApp: "ভাই, আপনার account তৈরি হয়েছে কিন্তু এখনো গাড়ি যোগ হয়নি।
               আমি সাহায্য করতে পারি — এখন ৫ মিনিট আছে?"

DAY 3:
  If 5+ cars listed: congratulate, discuss first leads
  If 1-4 cars: push to add more
  If 0 cars: offer in-person visit if Dhaka/Chittagong area

DAY 7:
  Review activation status → hand off or flag for intervention
```

---

## 4. IN-APP ONBOARDING CHECKLIST SPECIFICATION

> This section defines what appears inside the dealer's AutoVerse dashboard as an onboarding checklist. This is a UI feature that must be built.

### Checklist Display Rules

```
WHEN SHOWN: Always visible in dashboard sidebar (desktop) and More tab (mobile)
            until all items are checked OR dealer manually dismisses.
DISMISS OPTION: "Finish later" link at bottom — checklist re-appears next session.
FULL DISMISS: Available after 14 days OR after 5+ vehicles listed.
PROGRESS BAR: Shows X of 7 complete (e.g., "3 of 7 complete").
NOTIFICATION DOT: Orange dot on nav items with unchecked actions.
```

### Checklist Items

```
ITEM 1: Upload your logo
  Icon: 🖼️
  Status: Auto-checked when dealership.logo_url is not null
  CTA: "Upload Logo →" → navigates to Settings → Business Profile
  Helper text: "Your logo appears on your website and dealer profile"
  Bengali: "আপনার লোগো আপলোড করুন"

ITEM 2: Add your first vehicle
  Icon: 🚗
  Status: Auto-checked when vehicles.count > 0
  CTA: "Add Vehicle →" → opens VIN scanner flow
  Helper text: "Scan a VIN or enter details manually — takes 3 minutes"
  Bengali: "প্রথম গাড়ি যোগ করুন"
  PRIORITY: Show this first, before logo, for dealers who came from mobile sales visit

ITEM 3: Add 5 or more vehicles
  Icon: 🚙🚙
  Status: Auto-checked when vehicles.count >= 5
  CTA: "View Inventory →" (to encourage adding more)
  Helper text: "Dealers with 5+ listings get 3× more enquiries"
  Bengali: "৫টি বা বেশি গাড়ি যোগ করুন"
  BADGE: "🔥 Most important step for getting leads"

ITEM 4: Set your WhatsApp number
  Icon: 💬
  Status: Auto-checked when dealership.whatsapp_number is not null
  CTA: "Add WhatsApp →" → navigates to Settings → Business Profile
  Helper text: "Leads will receive messages from this number"
  Bengali: "আপনার WhatsApp নম্বর যোগ করুন"

ITEM 5: Set up Away Message
  Icon: ⏰
  Status: Auto-checked when automation_rule WHERE rule_type='away_message' AND is_active=true
  CTA: "Set Up Away Message →" → navigates to Automation Hub → WhatsApp
  Helper text: "Automatically reply when you're closed — never miss a lead"
  Bengali: "Away Message চালু করুন"

ITEM 6: Invite a team member
  Icon: 👥
  Status: Auto-checked when dealer_staff.count >= 2
  CTA: "Invite Team →" → navigates to Settings → Team Members
  Helper text: "Add your salespeople so they can manage leads from their phones"
  Bengali: "টিম সদস্য আমন্ত্রণ করুন"
  Skip label: "I work alone" → marks this item as skipped (shown with ✓ skip icon)

ITEM 7: Go live with your website
  Icon: 🌐
  Status: Auto-checked when dealer_website.status = 'active'
  CTA: "Launch Website →" → navigates to Website & Marketing → Setup
  Helper text: "Your free dealer website is ready — share the link with customers"
  Bengali: "আপনার ওয়েবসাইট চালু করুন"
```

### Checklist Completion State

```
ALL 7 CHECKED (or skipped):
  Animation: confetti burst (brief, non-intrusive)
  Message: "🎉 Setup complete! Your dealership is live on AutoVerse."
  Sub-message: "Your first enquiry could arrive any moment."
  CTA: "Explore Dashboard →"
  Checklist collapses and moves to bottom of page (not deleted — accessible via "View setup guide")

DASHBOARD WIDGET (shown until first lead received):
  "📬 Waiting for your first lead
   Make sure your cars have 6+ photos and competitive prices.
   [Optimize My Listings →]"
```

### Post-Checklist Nudges (shown after 7+ days if still no lead)

```
No lead after 7 days:
  NUDGE 1: "Your [Make Model] has been viewed [N] times but no enquiry yet.
            [Common reasons + fix suggestions link]"

No lead after 14 days:
  NUDGE 2: "Most dealers get their first lead within 7 days.
            Let us check your listing quality. [Book a Review Call →]"
  → Triggers alert for Onboarding CS to contact dealer proactively

Photos < 4 on any listed vehicle:
  PERSISTENT BANNER on that vehicle's stock card:
  "⚠️ Only [N] photos — add [4-N] more to publish to marketplace"
  Marketplace publish is BLOCKED until 4 photos minimum.
```

---

## 5. THE 7-DAY ACTIVATION FUNNEL

### Day-by-Day Touchpoints

```
DAY 0 — REGISTRATION DAY
  SYSTEM (auto):
    SMS: Welcome message with login link
    In-app: Onboarding checklist appears
    Operations Manager: Dealer approval (≤ 4h SLA)
    Approval SMS: "আপনার AutoVerse অ্যাকাউন্ট অ্যাপ্রুভ হয়েছে। ব্যবহার শুরু করুন: app.autoverse.com.bd"
  
  HUMAN:
    If in-person activation: sales rep sends exit WhatsApp
    If remote registration: CS agent calls within 2 hours

DAY 1
  TRIGGER CHECK: Did dealer add ≥ 1 vehicle with photos?
  
  YES (car listed):
    SMS: "আপনার [Make Model] টা live আছে: [listing URL]
          আরো গাড়ি যোগ করুন, বেশি enquiry আসবে।"
    No phone call needed.
  
  NO (registered but no car):
    WhatsApp from CS agent:
    "ভাই, অ্যাকাউন্ট তৈরি হয়েছে কিন্তু এখনো গাড়ি নেই।
     আমি [নাম], AutoVerse থেকে। ৫ মিনিট সাহায্য করতে পারি?"
    
    If no response to WhatsApp by 6 PM:
    Phone call (1 attempt, leave voicemail if no answer)

DAY 2
  TRIGGER CHECK: Car listed? Photos ≥ 4 per car? Price competitive?
  
  CS agent checks listing quality internally:
    → If photos < 4: WhatsApp: "ভাই, আপনার [car] এ আরো ছবি দিলে বেশি enquiry আসবে।"
    → If price is "Overpriced": WhatsApp: "[car] টার দাম একটু দেখুন — বাজারের চেয়ে বেশি আছে।"
    → If all good: no action needed

DAY 3
  TRIGGER CHECK: Any leads received?
  
  YES (≥ 1 lead):
    Phone call from CS agent:
    "ভাই, দেখলাম আপনার কাছে একটা enquiry এসেছে! কাস্টমারকে কল করেছেন?
     যদি সাহায্য লাগে জানাবেন।"
    Ask: "আর কোনো সমস্যা আছে? আরো গাড়ি যোগ করব?"
    GOAL: Push to ≥ 5 vehicles listed.
  
  NO (no leads):
    Phone call:
    "ভাই, এখনো enquiry আসেনি — কিন্তু দেখলাম [N] বার ভিউ হয়েছে।
     দুটো জিনিস দেখি মিলে: ছবির কোয়ালিটি আর দামটা।"
    Walk through listing optimization on call.

DAY 5
  TRIGGER CHECK: ≥ 3 cars listed? ≥ 1 lead received?
  
  < 3 cars, no leads:
    WhatsApp from CS:
    "ভাই, বেশি গাড়ি = বেশি enquiry। আজকে ২-৩টা গাড়ি যোগ করুন?
     CSV import থাকলে আমি করে দিতে পারি।"
  
  ≥ 3 cars, leads received:
    No contact needed (healthy activation track)

DAY 7 — ACTIVATION REVIEW
  MANAGER reviews activation status of all Day 0 registrations:
  
  ACTIVATED (≥ 5 cars + ≥ 1 lead received and replied to):
    → Status: Active
    → Hand off to Account Manager for ongoing relationship
    → Schedule Day 14 check-in call
  
  PARTIAL (≥ 1 car listed, ≤ 0 leads):
    → Status: Partially active
    → CS agent: In-person visit if BD-reachable (Dhaka/Chittagong)
    → OR intensive listing optimization session via WhatsApp call
  
  INACTIVE (0 cars listed):
    → CS agent: Final phone call
    "ভাই, আপনি অ্যাকাউন্ট তৈরি করেছিলেন কিন্তু গাড়ি যোগ করা হয়নি।
     কোনো সমস্যা হচ্ছে?"
    → If no engagement after this call: flag as churned
    → Try once more via WhatsApp at Day 14
    → Move to monthly re-engagement after Day 30

DAY 14 — PLAN UPGRADE WINDOW
  For activated dealers showing engagement:
  
  CS agent review:
    - How many leads received?
    - How many deals closed (if any)?
    - Listing count vs plan limit
  
  TRIGGER: If listing count approaching plan limit (>80% used):
    "ভাই, আপনার X টার মধ্যে Y টা গাড়ি আছে।
     Starter-এ উঠলে ৫০টা পর্যন্ত রাখতে পারবেন, আর automation ফিচার পাবেন।"
  
  TRIGGER: If ≥ 3 leads received from marketplace:
    "আপনি এখন পর্যন্ত [N] টা enquiry পেয়েছেন। Starter-এ উঠলে
     lead tracking, WhatsApp sequences সব পাবেন।"
```

---

## 6. COMMON BLOCKERS & FIXES

### Blocker 1: OTP Not Receiving

```
CAUSE:      Greenweb BD SMS delay, wrong phone number format, DND registry
FIX:
  Step 1: Verify phone number format is BD mobile (01XXXXXXXXX)
  Step 2: Tap "Resend Code" after 60 seconds
  Step 3: If still no OTP after 2 minutes:
           Try a different phone number (ask if dealer has another number)
  Step 4: If persistent: call AutoVerse support WhatsApp
           Support checks Greenweb SMS log within 5 minutes

PREVENTION: During registration, confirm phone number with dealer
            before tapping "Send OTP". Say the number back to them.
```

### Blocker 2: VIN Scan Not Working

```
CAUSE:      Barcode damaged/dirty, lighting too dark/bright, barcode type mismatch
FIX:
  Step 1: Clean barcode with finger/cloth
  Step 2: Try different lighting (move car/phone)
  Step 3: Tap "Manual Entry" — type 17-character VIN
           VIN format: characters 1-3=WMI, 4-9=VDS, 10-17=VIS
           Note: VIN never contains I, O, or Q
  Step 4: If VIN unavailable entirely: enter make/model/year manually
           (no VIN required for listing — VIN is optional)

COMMON BD ISSUE: Japanese reconditioned cars have Japanese JDM VINs
                 that sometimes partially match — confirm make/model
                 visually matches what NHTSA returns
```

### Blocker 3: Photos Won't Upload

```
CAUSE:      Photo file too large, slow connection, storage permission not granted
FIX:
  Step 1: Check that AutoVerse app has camera/storage permission in phone settings
  Step 2: Try smaller photos (take new photo directly from app camera — auto-compressed)
  Step 3: If on dealer's phone: ensure not in low-storage mode
  Step 4: Use your own phone to upload if dealer's phone is an issue
  Step 5: If persistent: list car without photos (as draft) → upload photos later

NOTE: System automatically compresses to WebP max 150KB.
      Original large files may take 3-5 seconds per photo on slow 3G.
      This is normal — show dealer the progress indicator.
```

### Blocker 4: Account Approval Delayed

```
CAUSE:      Operations team hasn't seen the application yet (off-hours, busy)
FIX:
  Step 1: Explain to dealer: "অ্যাপ্রুভাল সাধারণত ২-৪ ঘণ্টা লাগে।
                              এর মধ্যে গাড়ি যোগ করতে পারবেন।"
           [Approval usually takes 2-4 hours. You can add cars in the meantime.]
  Step 2: Dealer CAN add cars before approval — cars sync to marketplace after approval
  Step 3: If > 8 hours and no approval: sales rep escalates to Operations Manager
           via internal WhatsApp group (urgent tag)
  Step 4: Operations Manager approves within 30 minutes of escalation

MANUAL ESCALATION MESSAGE (sales rep → ops group):
  "Urgent approval needed: [Business Name], [Phone], registered [time].
   I'm at the showroom. Please approve."
```

### Blocker 5: Dealer Can't Remember Password / Locked Out

```
CAUSE:      Set password and forgot, locked after failed attempts
FIX:
  Step 1: Tap "Forgot password?" on login screen
  Step 2: Enter phone number → OTP received → set new password
  Step 3: If phone number changed and old number inaccessible:
           Escalate to Support → Operations Manager can reset via admin panel

PREVENTION: During onboarding, write down the password on dealer's business card.
            Say: "এটা লিখে রাখুন।" [Write this down.]
```

### Blocker 6: Duplicate Account

```
CAUSE:      Dealer previously registered (possibly abandoned), or staff member used same phone
SYMPTOM:    "This phone number is already registered" error
FIX:
  Step 1: Ask dealer: "এই নম্বর দিয়ে কি আগে কখনো AutoVerse-এ register করেছিলেন?"
           [Did you ever register on AutoVerse with this number before?]
  Step 2: If yes: use "Forgot password" to recover existing account
  Step 3: If old account is incomplete/empty: use it as the active account
  Step 4: If old account has issues: escalate to Operations Manager
           to merge or reset via admin panel

NOTE: Two accounts from the same number is not possible (unique constraint).
      This is never a system error — always an existing account.
```

### Blocker 7: Car Listing Not Appearing on Marketplace

```
CAUSE:      marketplace_published = false, dealer account not yet approved,
            sync error, < 4 photos (publish blocked)
FIX:
  Step 1: Check vehicle stock card → Marketplace tab → toggle status
  Step 2: If toggle is OFF: turn ON → sync triggers
  Step 3: If toggle ON but not live: check sync status badge
           → If "Sync error": tap "Sync Now" button
  Step 4: If dealer account not yet approved: listings queue automatically
           and sync on approval
  Step 5: If photos < 4: system blocks publish → add more photos first

QUICK CHECK: Navigate to autoverse.com.bd, search car → if not appearing:
             check vehicle status (must be 'available'), check photos (≥ 4),
             check marketplace_published toggle (must be ON)
```

---

## 7. SUPPORT ESCALATION PATHS

### Contact Matrix

```
ISSUE TYPE                          FIRST LINE    ESCALATION    TIME LIMIT
────────────────────────────────────────────────────────────────────────────
Can't register / OTP issues         Sales Rep     CS Agent      Same visit
Account approval delay              Sales Rep     Ops Manager   4 hours
Technical bug (app crash, etc.)     CS Agent      Tech Team     24 hours
Listing not appearing               CS Agent      CS Agent      2 hours
Billing / subscription issue        CS Agent      Finance Admin 24 hours
Fraud suspicion / fake dealer       CS Agent      Ops Manager   1 hour
Admin panel issue                   System Admin  CTO           4 hours
```

### WhatsApp Support Groups (Internal)

```
GROUP 1: #autoverse-ops
  Members: Sales Reps, CS Agents, Operations Manager
  Purpose: Real-time dealer approvals, urgent account issues
  Response SLA: 30 minutes (business hours)

GROUP 2: #autoverse-tech
  Members: CS Agents, Developers, System Admin
  Purpose: Technical bugs, sync issues, platform errors
  Response SLA: 2 hours (business hours)

GROUP 3: #autoverse-finance
  Members: CS Agents, Finance Admin
  Purpose: Payment issues, billing disputes, refunds
  Response SLA: 4 hours (business hours)
```

### Dealer-Facing Support Channel

```
DEALER SUPPORT WHATSAPP: [+8801XXXXXXXXX — AutoVerse Support]
  Available: Sat–Thu 9:00 AM – 9:00 PM BD Time
  Language: Bangla primary, English available
  Response SLA: 2 hours (business hours), 8 hours (off-hours)
  
  AUTO-ACKNOWLEDGMENT (Greenweb SMS):
  "AutoVerse Support: আপনার বার্তা পেয়েছি। ২ ঘণ্টার মধ্যে
   জানানো হবে। [Ticket: #XXXXX]"
  [AutoVerse Support: We've received your message. We'll respond within 2 hours. Ticket: #XXXXX]
```

---

## 8. ONBOARDING METRICS & REPORTING

### Daily Metrics (reported by each sales rep)

```
REPORT DUE: 7:00 PM daily via WhatsApp to manager
FORMAT:

"AutoVerse Daily Report — [Date] — [Your Name]

New visits today:         X
Demos given:              X
Accounts created:         X
Cars listed today:        X
Referrals received:       X

7-Day Activations (this week):
  Registered this week:   X
  Cars listed ≥1:         X (X%)
  Cars listed ≥5:         X (X%)
  Leads received:         X (X%)
  ACTIVATED (≥5 cars + ≥1 lead): X (X%)

Top objection today: ___________
Best visit today: _____________
Escalations raised: Y/N (details if Y)"
```

### Weekly Onboarding Review (Operations Manager)

```
REVIEWS EVERY MONDAY 10:00 AM:

1. Registration cohort analysis:
   - Dealers registered this week: X
   - 7-day activation rate: X% (target: ≥40%)
   - Breakdown: Dhaka / Chittagong / Other

2. Listing quality audit:
   - Avg photos per listing: X (target: ≥6)
   - % listings with deal rating (not unrated): X% (target: ≥60%)
   - Avg asking price vs IMV: above/below market by X%

3. First lead time:
   - Avg days from registration to first lead: X (target: ≤7)
   - % dealers receiving ≥1 lead in 7 days: X% (target: ≥50%)

4. Activation funnel drop-off:
   Stage 1 → Created account:         100%
   Stage 2 → Listed ≥1 car:           X% (target: ≥80%)
   Stage 3 → Listed ≥5 cars:          X% (target: ≥60%)
   Stage 4 → Received ≥1 lead:        X% (target: ≥50%)
   Stage 5 → Replied to lead:         X% (target: ≥40%)
   ACTIVATED:                          X% (target: ≥40%)

5. Escalations this week:
   List all escalations + resolution status

6. Next week plan:
   - Follow-up visits for stalled dealers
   - New areas to target
```

### Key Thresholds That Trigger Intervention

```
Threshold 1: 7-day activation rate < 30% for any week
  Action: Review sales rep demos, check for product issues

Threshold 2: Avg first lead time > 10 days
  Action: Audit listing quality, review marketplace supply vs demand

Threshold 3: > 3 dealers reporting same technical issue in a day
  Action: Tech team investigation (potential platform bug)

Threshold 4: Approval SLA breached > 5 times in a week
  Action: Operations Manager review, add second approver if needed

Threshold 5: < 200 total active marketplace listings
  Action: ALL hands on supply acquisition — no buyer acquisition until resolved
  (This is the hard gate from Step 10 of the blueprint)
```

---

*AutoVerse — Step 18: Dealer Onboarding SOP*
*Ground Team Procedure · In-App Checklist · 7-Day Activation Funnel · v1.0*
