# Garisale Project Constitution & Agent Rules

## 1. Naming Attestation (Step 22)
Garisale is the official product name (public-facing, legally registered). The design codename was "AutoVerse".
Apply the following name substitutions strictly across all code, content, configuration, and communications:

- **"AutoVerse"** -> **"Garisale"**
- **"autoverse"** -> **"garisale"**
- **"autoverse.com.bd"** -> **"garisale.com"**
- **"AUTOVERSE"** -> **"GARISALE"**
- **"AutoVerse OS"** -> **"Garisale Dealer OS"**
- **"AutoVerse app"** -> **"Garisale app"**
- **"AutoVerse team"** -> **"Garisale team"**
- **"AutoVerse platform"** -> **"Garisale platform"**

*Technical Exceptions (Keep as-is):*
- Keep sub-product name: **"Maestro AI"**
- Keep pricing feature name: **"IMV"**
- Keep all queue names, API paths, DB table names, Prisma enums, and internal technical identifiers from the blueprints.

## 2. Canonical Tech Stack Constraints (Section 2)
Do not substitute or replace any technical component without human approval.
- **Backend**: NestJS, Prisma, PostgreSQL (managed, RLS), Redis, BullMQ (all 18 named queues), MeiliSearch (self-hosted), Cloudflare R2, Sharp, Puppeteer, Passport.js + JWT (RS256 for dealers, HS256 for admin), class-validator, Firebase FCM.
- **Frontend**: Next.js 14 (App Router), TypeScript (strict), Tailwind CSS, shadcn/ui, Zustand, TanStack Query v5, React Hook Form + Zod, Recharts, @vis.gl/react-google-maps, Framer Motion.
- **Infrastructure**: Vercel, DigitalOcean App Platform, Cloudflare, Cloudflare Worker (CNAME worker for domain routing), Sentry, PostHog, BetterUptime, NHTSA vPIC API.
- **Payments & Communications**: bKash Direct API (Tokenized Checkout), Nagad Direct API (RSA-signed), SSLCommerz (IPN hash verification), Greenweb BD (SMS), WhatsApp Business API, Meta Graph API v19.0, Google Merchant Center API, Resend.

## 3. Decision Authority & Escalation Protocol (Section 5)
Stop all work and escalate immediately using the standard escalation format for:
1. Any tech stack substitution.
2. Any RLS policy relaxation or bypass.
3. Any changes to bKash/Nagad payment flow or double-charge logic.
4. Any changes to JWT signing key strategy.
5. Any vehicle status state machine transition adjustments.
6. Any destructive database migrations (e.g., DROP TABLE, DROP COLUMN).
7. Unachievable performance targets.
8. Third-party API breaking changes.
9. Sequence deviations.
10. Security architecture modifications.
