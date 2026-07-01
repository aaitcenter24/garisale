# STEP 22 — OFFICIAL NAME ATTESTATION
## Project Identity Correction for All AI Agents and Developers

---

## ⚠️ MANDATORY READ BEFORE ANY ACTION

This document is **authoritative and supersedes all prior naming** found in Steps 1–21.

Throughout the 21 blueprint documents, the platform is referred to as **"AutoVerse"**. That was the working codename used during design and documentation. The **official, public-facing, legally registered product name is GARISALE**.

**Every AI agent, developer, or tool working on this project must treat all occurrences of "AutoVerse" as "Garisale" unless explicitly noted otherwise.**

---

## 1. THE NAME

| Field | Value |
|---|---|
| **Official Product Name** | Garisale |
| **Bangla Name** | গাড়িসেল |
| **Meaning** | গাড়ি (Gari) = Car/Vehicle + Sale = Car Sale |
| **Primary Domain** | garisale.com ✅ (already purchased) |
| **Market** | Bangladesh (primary), Southeast Asia (expansion) |
| **Tagline** | Every car. Every dealer. Every deal — in one place. |
| **Bangla Tagline** | প্রতিটা গাড়ি। প্রতিটা ডিলার। প্রতিটা ডিল — এক জায়গায়। |

---

## 2. COMPLETE NAME SUBSTITUTION TABLE

Every instance of "AutoVerse" in Steps 1–21 must be replaced with "Garisale" as follows:

### 2.1 Brand & Product Names

| Old (AutoVerse) | New (Garisale) |
|---|---|
| AutoVerse | Garisale |
| AutoVerse Marketplace | Garisale Marketplace |
| AutoVerse Dealer OS | Garisale Dealer OS |
| AutoVerse Automation Hub | Garisale Automation Hub |
| AutoVerse Website Builder | Garisale Website Builder |
| Maestro AI | Maestro AI ✅ (keep — this is a sub-product name, not the brand) |
| IMV (Intelligent Market Value) | IMV ✅ (keep — this is a feature name) |
| AutoVerse Admin Panel | Garisale Admin Panel |
| AutoVerse Dealer Support | Garisale Dealer Support |

### 2.2 URLs & Domains

| Old (autoverse.com.bd) | New (garisale.com) |
|---|---|
| autoverse.com.bd | garisale.com |
| app.autoverse.com.bd | app.garisale.com |
| admin.autoverse.com.bd | admin.garisale.com |
| api.autoverse.com.bd | api.garisale.com |
| media.autoverse.com.bd | media.garisale.com |
| dealer.autoverse.com.bd | dealer.garisale.com |
| status.autoverse.com.bd | status.garisale.com |
| {slug}.autoverse.com.bd | {slug}.garisale.com |
| staging.autoverse.com.bd | staging.garisale.com |
| staging.api.autoverse.com.bd | staging.api.garisale.com |

### 2.3 Email Addresses

| Old | New |
|---|---|
| noreply@autoverse.com.bd | noreply@garisale.com |
| noreply@mail.autoverse.com.bd | noreply@mail.garisale.com |
| {slug}@mail.autoverse.com.bd | {slug}@mail.garisale.com |
| support@autoverse.com.bd | support@garisale.com |
| legal@autoverse.com.bd | legal@garisale.com |
| privacy@autoverse.com.bd | privacy@garisale.com |
| billing@autoverse.com.bd | billing@garisale.com |
| engineering@autoverse.com.bd | engineering@garisale.com |
| hello@autoverse.com.bd | hello@garisale.com |
| admin@autoverse.com.bd | admin@garisale.com |

### 2.4 Environment Variables

| Old Variable Value | New Variable Value |
|---|---|
| APP_URL=https://autoverse.com.bd | APP_URL=https://garisale.com |
| API_URL=https://api.autoverse.com.bd | API_URL=https://api.garisale.com |
| NEXT_PUBLIC_API_URL=https://api.autoverse.com.bd | NEXT_PUBLIC_API_URL=https://api.garisale.com |
| BKASH_CALLBACK_URL=https://api.autoverse.com.bd/... | BKASH_CALLBACK_URL=https://api.garisale.com/... |
| EMAIL_FROM=noreply@mail.autoverse.com.bd | EMAIL_FROM=noreply@mail.garisale.com |
| JWT issuer: autoverse.com.bd | JWT issuer: garisale.com |
| JWT audience: autoverse-api | JWT audience: garisale-api |

### 2.5 Database & Code Identifiers

| Old | New |
|---|---|
| Database name: `autoverse` | Database name: `garisale` |
| Redis key prefix: `cache:autoverse:*` | Redis key prefix: `cache:garisale:*` |
| Cloudflare Worker name: `autoverse-domain-router` | `garisale-domain-router` |
| R2 bucket: `autoverse-media-production` | `garisale-media-production` |
| GitHub org: `autoverse` | `garisale` |
| Docker registry: `registry.digitalocean.com/autoverse` | `registry.digitalocean.com/garisale` |
| NestJS app name: `autoverse-api` | `garisale-api` |
| DO App Platform name: `autoverse-api` | `garisale-api` |

### 2.6 Legal & Business Documents (Steps 19)

| Old | New |
|---|---|
| Privacy Policy URL: autoverse.com.bd/privacy | garisale.com/privacy |
| Terms URL: autoverse.com.bd/terms | garisale.com/terms |
| Company referred to as "AutoVerse" | Company referred to as "Garisale" |
| All "autoverse.com.bd" in legal text | "garisale.com" |

### 2.7 Marketing & Sales Materials (Steps 17, 18, 20)

| Old | New |
|---|---|
| "AutoVerse থেকে এসেছি" | "Garisale থেকে এসেছি" |
| "AutoVerse Marketplace-এ" | "Garisale Marketplace-এ" |
| "app.autoverse.com.bd" in scripts | "app.garisale.com" |
| WhatsApp message "AutoVerse Support" | "Garisale Support" |
| SMS sender "AutoVerse" | "Garisale" |

### 2.8 WhatsApp Templates (Step 14)

All WhatsApp template payloads that reference "AutoVerse" in body text must replace it with "Garisale". Template **names** (the API identifier strings like `lead_instant_reply`) remain unchanged — these are internal API slugs, not visible to end users.

---

## 3. WHAT DOES NOT CHANGE

The following internal technical identifiers from the blueprints are **kept as-is** regardless of the brand name change. They are technical implementation details, not brand elements:

```
✅ KEEP UNCHANGED:
  - BullMQ queue names (e.g., sync-vehicle, automation-whatsapp)
  - Database table names (vehicles, leads, deals, etc.)
  - API endpoint paths (/api/v1/vehicles, etc.)
  - NestJS module names (InventoryModule, CrmModule, etc.)
  - Prisma model names
  - JWT claim field names (dealer_id, dealer_role, etc.)
  - Redis key patterns (structure only — prefix changes as shown above)
  - Feature flag key names
  - BullMQ job names
  - Prisma enum values
  - All architecture decisions, algorithms, and technical logic
```

---

## 4. DOMAIN CONFIGURATION NOTE

The primary domain is `garisale.com` (already purchased by the owner).

```
SUBDOMAINS TO CONFIGURE ON garisale.com:
  garisale.com          → Marketplace (Next.js on Vercel)
  www.garisale.com      → Redirect to garisale.com
  app.garisale.com      → Dealer OS (Next.js on Vercel)
  admin.garisale.com    → Admin Panel (Vercel, IP-restricted)
  api.garisale.com      → NestJS API (DigitalOcean App Platform)
  media.garisale.com    → Cloudflare R2 (photos, PDFs)
  dealer.garisale.com   → Dealer microsite routing (Cloudflare Worker)
  {slug}.garisale.com   → Individual dealer websites (via Worker)
  status.garisale.com   → BetterUptime status page

DEALER MICROSITE URL FORMAT:
  Before: dhaka-auto-house.autoverse.com.bd
  After:  dhaka-auto-house.garisale.com

CUSTOM DOMAIN (for Business plan dealers):
  Before: CNAME cars.dealer.com.bd → dealer.autoverse.com.bd
  After:  CNAME cars.dealer.com.bd → dealer.garisale.com
```

---

## 5. INFRASTRUCTURE SERVICES TO REGISTER UNDER "GARISALE"

When provisioning any service from Step 21, use "Garisale" (not "AutoVerse"):

```
SERVICE               REGISTER AS
──────────────────────────────────────────────────────
DigitalOcean          Team/org name: Garisale
GitHub                Organization: garisale
Vercel                Team: Garisale
Cloudflare            Account: Garisale
Firebase              Project name: garisale-production
Sentry                Organization: Garisale
PostHog               Organization: Garisale
BetterUptime          Team: Garisale
Meta Business Manager Business name: Garisale
WhatsApp WABA         Display name: "Garisale Dealer Support"
Google Cloud          Project: garisale-production
Resend                Organization: Garisale
Greenweb BD           Business name: Garisale
bKash Merchant        Business name: [Legal entity name] / Brand: Garisale
Nagad Merchant        Business name: [Legal entity name] / Brand: Garisale
SSLCommerz            Store: Garisale
```

---

## 6. QUICK REFERENCE FOR AI AGENTS

```
IF YOU SEE          →    REPLACE WITH
────────────────────────────────────────────────────────
"AutoVerse"         →    "Garisale"
"autoverse"         →    "garisale"
"autoverse.com.bd"  →    "garisale.com"
"AUTOVERSE"         →    "GARISALE"
"AutoVerse OS"      →    "Garisale Dealer OS"
"AutoVerse app"     →    "Garisale app"
"AutoVerse team"    →    "Garisale team"
"AutoVerse platform"→    "Garisale platform"

EXCEPTIONS (keep as-is):
  "Maestro AI"      →    keep "Maestro AI"
  "IMV"             →    keep "IMV"
  All queue names, API paths, DB table names, Prisma enums → keep unchanged
```

---

## 7. ATTESTATION STATEMENT

> This attestation is issued by the project owner. All 21 blueprint documents (Steps 1–21), the Master Goal Directive, and all associated artifacts were produced under the working codename "AutoVerse." The official product name, domain, and brand identity going forward is **GARISALE** (garisale.com). Any AI agent, developer, contractor, or tool working on this project should treat this document as the authoritative naming reference and apply all substitutions above consistently across all code, content, configuration, and communications.

---

*Garisale — Step 22: Official Name Attestation*
*Supersedes all "AutoVerse" references in Steps 1–21*
*Issued by: Project Owner*
