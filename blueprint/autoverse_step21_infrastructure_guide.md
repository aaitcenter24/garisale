# AutoVerse — Step 21: Infrastructure Pre-Provisioning Guide
### Exact CLI Commands · All Services · Approval Timelines · Critical Path · v1.0

> **Purpose:** Every infrastructure resource needed to run AutoVerse in production, with exact commands and sign-up URLs. Execute in the order shown — several services have mandatory approval wait times that must run in parallel with development.
>
> **Estimated total setup time (active work):** 6–8 hours over 2–3 days
> **Estimated total calendar time (including approvals):** 14–21 business days
> **Critical bottleneck:** bKash + Nagad merchant account approval (7–14 business days). Start these on Day 1 regardless of development status.

---

## CRITICAL PATH TIMELINE

```
START IMMEDIATELY (Day 1 — before writing any code):
  ● bKash merchant account application     → 7–14 business days approval
  ● Nagad merchant account application     → 7–14 business days approval
  ● BTRC SMS sender ID ("AutoVerse")        → 7–14 business days approval
  ● Meta Facebook App creation + review    → 1–10 business days
  ● WhatsApp Business account setup        → 2–5 business days

START WEEK 1:
  ● Domain registration (autoverse.com.bd) → 1–3 business days
  ● Resend email domain verification       → DNS propagation: 1–24 hours
  ● SSLCommerz store registration          → 1–3 business days
  ● Firebase project setup                 → Immediate (no approval)
  ● Google Cloud project + APIs            → Immediate (no approval)

START WHEN DEVELOPMENT BEGINS (can be done same day):
  ● DigitalOcean account + resources       → Immediate
  ● Upstash Redis                          → Immediate
  ● Cloudflare account + R2 + DNS          → Immediate
  ● Vercel projects                        → Immediate
  ● GitHub repository + secrets            → Immediate
  ● Sentry, PostHog, BetterUptime          → Immediate

CRITICAL PATH DIAGRAM:

Day 1   ────────────────────────────────────────────────────── Launch
         │                                                         │
         ├─ bKash application ──(7-14d)──► bKash credentials       │
         ├─ Nagad application ──(7-14d)──► Nagad credentials       │
         ├─ BTRC sender ID ───(7-14d)──► "AutoVerse" SMS sender    │
         ├─ Meta App setup ───(1-10d)──► Facebook/WhatsApp API     │
         │                                                         │
         ├─ Domain registration ──(1-3d)──► DNS configured         │
         ├─ Resend domain ────(1-24h)──► Email sending ready       │
         │                                                         │
         └─ All other services ──(same day)──► Infrastructure ready │
                                                                    │
                                              ◄──────── Dev builds ─┘
                                              ◄──────── All approvals done
```

---

## SECTION 1 — DIGITALOCEAN

### 1.1 Account Setup

```bash
# Sign up at: https://cloud.digitalocean.com/registrations/new
# Use a business email address

# Install DigitalOcean CLI (doctl)
# macOS:
brew install doctl

# Linux:
wget https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz
tar xf doctl-1.104.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin

# Authenticate (get token from: cloud.digitalocean.com/account/api/tokens)
doctl auth init
# Paste your Personal Access Token when prompted

# Verify authentication:
doctl account get
```

### 1.2 Container Registry

```bash
# Create container registry for Docker images
doctl registry create autoverse --region sgp1 --subscription-tier basic
# Output: Registry created: registry.digitalocean.com/autoverse

# Authenticate Docker to push images:
doctl registry login
# Run this before any docker push command in CI/CD
```

### 1.3 Managed PostgreSQL Database

```bash
# Create production PostgreSQL 16 database (Singapore region)
doctl databases create autoverse-db \
  --engine pg \
  --version 16 \
  --region sgp1 \
  --size db-s-1vcpu-1gb \
  --num-nodes 1

# Get the database ID (needed for subsequent commands):
doctl databases list
# Note the ID: e.g., abc12345-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DB_ID="<your-database-id>"

# Wait for database to be ready (status = online, ~3-5 minutes):
doctl databases get $DB_ID --format Status

# Create two database users:
# 1. app_user — for application (RLS enforced)
doctl databases user create $DB_ID app_user
# Note the generated password

# 2. migration_user — for Prisma migrations ONLY (BYPASSRLS)
doctl databases user create $DB_ID migration_user
# Note the generated password

# Get connection string:
doctl databases connection $DB_ID --user app_user --format URI
# Example output: postgresql://app_user:PASSWORD@host:port/defaultdb?sslmode=require

# In PostgreSQL: grant migration_user BYPASSRLS privilege
# (Do this after connecting with the admin doadmin user)
# psql "$(doctl databases connection $DB_ID --format URI)"
# Then run:
# ALTER USER migration_user BYPASSRLS;
# ALTER USER app_user NOSUPERUSER NOCREATEDB NOCREATEROLE;
# GRANT ALL PRIVILEGES ON DATABASE defaultdb TO app_user;

# Create staging database (same specs):
doctl databases create autoverse-db-staging \
  --engine pg \
  --version 16 \
  --region sgp1 \
  --size db-s-1vcpu-1gb \
  --num-nodes 1

# IMPORTANT: Save these connection strings as GitHub Actions secrets
# PRODUCTION_DATABASE_URL → app_user connection string
# MIGRATION_DATABASE_URL → migration_user connection string (NEVER use in app code)
# STAGING_DATABASE_URL → staging app_user connection string
```

### 1.4 MeiliSearch Droplet

```bash
# Create 1GB RAM Droplet for MeiliSearch search engine
doctl compute droplet create autoverse-search \
  --region sgp1 \
  --size s-1vcpu-1gb \
  --image ubuntu-24-04-x64 \
  --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
  --tag-names autoverse,production,search

# Wait for Droplet to be active:
doctl compute droplet list --format Name,Status,PublicIPv4
# Note the IP address: MEILI_DROPLET_IP

# SSH in and install MeiliSearch:
ssh root@$MEILI_DROPLET_IP << 'EOF'
# Update system
apt-get update && apt-get upgrade -y

# Install MeiliSearch
curl -L https://install.meilisearch.com | sh

# Generate master key (save this securely):
MEILI_MASTER_KEY=$(openssl rand -hex 32)
echo "Master Key: $MEILI_MASTER_KEY"

# Create systemd service
cat > /etc/systemd/system/meilisearch.service << SERVICE
[Unit]
Description=MeiliSearch
After=network.target

[Service]
ExecStart=/usr/local/bin/meilisearch \
  --http-addr 0.0.0.0:7700 \
  --master-key ${MEILI_MASTER_KEY} \
  --env production \
  --db-path /var/lib/meilisearch/data \
  --http-payload-size-limit 104857600
Restart=on-failure
User=root
WorkingDirectory=/var/lib/meilisearch

[Install]
WantedBy=multi-user.target
SERVICE

mkdir -p /var/lib/meilisearch
systemctl daemon-reload
systemctl enable meilisearch
systemctl start meilisearch

# Configure UFW firewall:
ufw allow 22/tcp
ufw allow 7700/tcp
ufw --force enable

echo "MeiliSearch installed and running on port 7700"
EOF

# Verify MeiliSearch is running:
curl http://$MEILI_DROPLET_IP:7700/health
# Expected: {"status":"available"}

# SAVE: MEILISEARCH_HOST=http://$MEILI_DROPLET_IP:7700
# SAVE: MEILISEARCH_MASTER_KEY=<generated key>
```

### 1.5 App Platform Configuration

```bash
# Save the app.yaml spec below as .do/app.yaml in your repo,
# then create the app:
doctl apps create --spec .do/app.yaml

# Get the App ID:
doctl apps list
# Note: DO_APP_ID_PRODUCTION

# To update after changes:
doctl apps update $DO_APP_ID_PRODUCTION --spec .do/app.yaml

# To deploy:
doctl apps create-deployment $DO_APP_ID_PRODUCTION

# To get deployment status:
doctl apps list-deployments $DO_APP_ID_PRODUCTION
```

---

## SECTION 2 — UPSTASH REDIS

```bash
# Sign up at: https://console.upstash.com
# Create account with business email

# Via Upstash Console (no CLI needed — too simple):
# 1. Click "Create Database"
# 2. Name: autoverse-production
# 3. Type: Regional (not Global for cost efficiency at this scale)
# 4. Region: Singapore (ap-southeast-1)
# 5. Enable TLS: YES (mandatory)
# 6. Click "Create"

# After creation, copy from Console:
# REDIS_URL = "rediss://default:PASSWORD@ENDPOINT.upstash.io:6379"
# (Note: "rediss" with double-s = TLS enabled)

# Create a second database for staging:
# Name: autoverse-staging
# Same settings

# IMPORTANT: Upstash Free tier = 10,000 commands/day (too low for production)
# Use Pay-per-request plan (~$0.20 per 100K commands)
# Set monthly budget alert at $20 in Upstash settings

# SAVE:
# REDIS_URL=rediss://default:PASSWORD@ENDPOINT.upstash.io:6379 (production)
# STAGING_REDIS_URL=rediss://default:PASSWORD@ENDPOINT.upstash.io:6379 (staging)

# Verify connection:
npx redis-cli -u $REDIS_URL ping
# Expected: PONG
```

---

## SECTION 3 — CLOUDFLARE

### 3.1 Account & Domain Setup

```bash
# Sign up at: https://dash.cloudflare.com/sign-up
# Use business email

# Install Wrangler CLI (Cloudflare Workers):
npm install -g wrangler

# Authenticate:
wrangler login
# Opens browser for OAuth

# Register domain: autoverse.com.bd
# URL: https://www.cloudflare.com/products/registrar/
# OR: Register with a BD registrar and point nameservers to Cloudflare
#
# BD domain registrars that support .com.bd:
#   - BDIX (bdix.net)
#   - ExonHost
#   - BDCOM
#   Typical cost: ~BDT 1,500–2,500/year for .com.bd
#
# If registering with external registrar:
# Change nameservers to: ns1.cloudflare.com and ns2.cloudflare.com
# DNS propagation: 1–48 hours

# Get zone ID after domain is in Cloudflare:
# Dashboard → autoverse.com.bd → Overview → Zone ID (right sidebar)
ZONE_ID="<your-zone-id>"
```

### 3.2 DNS Records

```bash
# Install Cloudflare CLI or use dashboard
# These records must be added to autoverse.com.bd zone:

# Via Cloudflare dashboard → DNS → Add Records:

# API (DigitalOcean App Platform):
# Type: CNAME  Name: api    Value: <DO_APP_PLATFORM_DOMAIN>  Proxy: ON

# Marketplace + Dealer OS (Vercel):
# Type: CNAME  Name: @      Value: cname.vercel-dns.com    Proxy: ON
# Type: CNAME  Name: www    Value: cname.vercel-dns.com    Proxy: ON

# Admin panel (Vercel, separate project):
# Type: CNAME  Name: admin  Value: cname.vercel-dns.com    Proxy: ON
# NOTE: Add Cloudflare Access or WAF rule to restrict admin subdomain to allowlisted IPs

# Media/R2 (custom domain for R2 bucket):
# Type: CNAME  Name: media  Value: <R2_BUCKET_DOMAIN>      Proxy: ON

# Dealer subdomain routing (handled by Cloudflare Worker):
# Type: CNAME  Name: dealer Value: <VERCEL_APP_DOMAIN>     Proxy: ON
# Worker will intercept *.autoverse.com.bd and route accordingly

# Resend (email sending domain):
# Resend will provide specific CNAME records for:
#   - SPF: TXT record at @
#   - DKIM: 3 CNAME records at specific subdomains
#   - DMARC: TXT record at _dmarc
# Follow Resend's exact instructions (they vary per account)

# Status page (BetterUptime):
# Type: CNAME  Name: status Value: <BETTERUPTIME_CNAME>    Proxy: OFF
```

### 3.3 R2 Object Storage

```bash
# Create R2 bucket for production media:
# Note: R2 is configured via Cloudflare Dashboard (no CLI for bucket creation)
# Dashboard → R2 → Create Bucket
# Bucket name: autoverse-media-production
# Location: Automatic (Cloudflare optimizes)

# Create a second bucket for backups:
# Bucket name: autoverse-backups-production

# Create staging bucket:
# Bucket name: autoverse-media-staging

# Generate R2 API credentials:
# Dashboard → R2 → Manage R2 API Tokens → Create API Token
# Permissions: Edit (for read + write)
# Specify bucket: autoverse-media-production
# SAVE: R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY

# Get Account ID:
# Dashboard → Right sidebar → Account ID
# SAVE: R2_ACCOUNT_ID

# Set custom domain for R2 bucket (for media URLs):
# Dashboard → R2 → autoverse-media-production → Settings → Custom Domains
# Add: media.autoverse.com.bd
# This creates the CNAME record automatically

# R2 CORS configuration (needed for browser photo uploads):
# Dashboard → R2 → autoverse-media-production → Settings → CORS Policy
# Add this rule:
cat << 'EOF'
[
  {
    "AllowedOrigins": [
      "https://autoverse.com.bd",
      "https://app.autoverse.com.bd",
      "https://admin.autoverse.com.bd",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
EOF

# SAVE:
# R2_ACCOUNT_ID=<account-id>
# R2_ACCESS_KEY_ID=<key-id>
# R2_SECRET_ACCESS_KEY=<secret>
# R2_BUCKET_NAME=autoverse-media-production
# R2_PUBLIC_URL=https://media.autoverse.com.bd
```

### 3.4 Cloudflare Worker Deployment

```bash
# Navigate to worker directory:
cd worker/

# Install dependencies:
npm install

# Create KV namespace for domain cache (production):
wrangler kv:namespace create DOMAIN_CACHE
# Save the ID from output: e.g., xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
KV_NAMESPACE_ID_PRODUCTION="<id-from-output>"

# Create KV namespace for staging:
wrangler kv:namespace create DOMAIN_CACHE --env staging
KV_NAMESPACE_ID_STAGING="<id-from-output>"

# Update wrangler.toml with the IDs:
sed -i "s/KV_NAMESPACE_ID_PRODUCTION/$KV_NAMESPACE_ID_PRODUCTION/" wrangler.toml
sed -i "s/KV_NAMESPACE_ID_STAGING/$KV_NAMESPACE_ID_STAGING/" wrangler.toml

# Set Worker secrets:
wrangler secret put DB_LOOKUP_URL --env production
# Enter: https://api.autoverse.com.bd

wrangler secret put DB_LOOKUP_SECRET --env production
# Enter: <generate with: openssl rand -hex 32>

# Deploy Worker to production:
wrangler deploy --env production

# Add wildcard route for dealer subdomains:
# Dashboard → Workers & Pages → autoverse-domain-router → Triggers → Add Route
# Route: *.autoverse.com.bd/*
# Zone: autoverse.com.bd

# Verify Worker is running:
curl -H "Host: test.autoverse.com.bd" https://dealer.autoverse.com.bd/
# Should return 404 (no dealer with slug "test")
```

### 3.5 Cloudflare WAF — Admin Panel IP Restriction

```bash
# Dashboard → autoverse.com.bd → Security → WAF → Custom Rules → Create Rule

# Rule name: Block non-allowlisted admin access
# Expression (enter in the editor):
# (http.host eq "admin.autoverse.com.bd")
# and not (ip.src in {YOUR_OFFICE_IP/32 YOUR_VPN_IP/32})
#
# Action: Block
# Save and deploy

# VERIFY: Access admin.autoverse.com.bd from a non-allowlisted IP
# Expected: 403 Cloudflare block page (before reaching your server)
```

---

## SECTION 4 — VERCEL

```bash
# Install Vercel CLI:
npm install -g vercel

# Authenticate:
vercel login
# Opens browser for OAuth

# Create production project (Marketplace + Dealer OS):
cd apps/web
vercel link
# Follow prompts: Create new project → autoverse-web → Production branch: main

# Add custom domains to Vercel project:
# Vercel Dashboard → autoverse-web → Settings → Domains
# Add: autoverse.com.bd
# Add: www.autoverse.com.bd
# Add: app.autoverse.com.bd
# Add: dealer.autoverse.com.bd (for dealer microsites)
# Vercel provides CNAME value to add to Cloudflare DNS

# Create admin panel project (separate Vercel project):
cd apps/admin
vercel link
# Create new project → autoverse-admin → Production branch: main

# Add domain:
# Add: admin.autoverse.com.bd

# Set environment variables in Vercel (Dashboard → Project → Settings → Environment Variables):
# For each project, add all NEXT_PUBLIC_* variables + any needed server-side vars
# Critical for marketplace:
#   NEXT_PUBLIC_API_URL=https://api.autoverse.com.bd
#   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<from Google Cloud>
#   NEXT_PUBLIC_POSTHOG_KEY=<from PostHog>
# For admin:
#   NEXT_PUBLIC_API_URL=https://api.autoverse.com.bd
#   NEXT_PUBLIC_ADMIN_ENV=production

# Get Vercel Token for CI/CD:
# Dashboard → Settings → Tokens → Create Token: "autoverse-ci"
# SAVE: VERCEL_TOKEN=<token>

# Get Project IDs (needed for CI/CD):
vercel project ls
# Note Project IDs for both projects
# SAVE: VERCEL_PROJECT_ID_WEB=<id>
# SAVE: VERCEL_PROJECT_ID_ADMIN=<id>
# SAVE: VERCEL_ORG_ID=<org-id>

# Deploy staging manually to test:
vercel --env staging
```

---

## SECTION 5 — FIREBASE (PUSH NOTIFICATIONS)

```bash
# Sign up / log in at: https://console.firebase.google.com
# No approval needed — immediate

# Create project:
# Console → Add Project → Name: AutoVerse → Disable Analytics (optional) → Create

# Enable Cloud Messaging (FCM):
# Console → autoverse project → Engage → Messaging → Get Started

# Generate service account credentials:
# Console → Project Settings (gear icon) → Service Accounts
# → Generate new private key → Download JSON
# This file contains: project_id, private_key, client_email

# Parse from the downloaded JSON:
# FIREBASE_PROJECT_ID: "project_id" field
# FIREBASE_PRIVATE_KEY: "private_key" field (the RSA private key)
# FIREBASE_CLIENT_EMAIL: "client_email" field

# SAVE:
# FIREBASE_PROJECT_ID=autoverse-<generated-id>
# FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@autoverse-xxx.iam.gserviceaccount.com

# For frontend (Next.js) — get Web Push Certificate:
# Console → Project Settings → Cloud Messaging → Web configuration
# Generate key pair → VAPID Key
# SAVE: NEXT_PUBLIC_FIREBASE_VAPID_KEY=<vapid-key>
# Also save Firebase config for frontend:
# Console → Project Settings → General → Your apps → Add app → Web
# NEXT_PUBLIC_FIREBASE_API_KEY=<api-key>
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
# NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>
```

---

## SECTION 6 — GOOGLE SERVICES

### 6.1 Google Cloud Project

```bash
# Install Google Cloud CLI:
# macOS: brew install --cask google-cloud-sdk
# Linux: https://cloud.google.com/sdk/docs/install

gcloud init
# Follow prompts: sign in → create new project → autoverse-production

# Set project:
gcloud config set project autoverse-production

# Enable required APIs:
gcloud services enable \
  maps-backend.googleapis.com \
  places-backend.googleapis.com \
  content.googleapis.com \
  searchconsole.googleapis.com \
  analyticsdata.googleapis.com

# Create API key for Google Maps (frontend):
gcloud beta services api-keys create \
  --display-name="AutoVerse Maps - Production" \
  --allowed-referrers="autoverse.com.bd/*,app.autoverse.com.bd/*,*.autoverse.com.bd/*"
# Note the key string
# SAVE: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<key>

# Create Service Account for GMC, GSC (server-side):
gcloud iam service-accounts create autoverse-api \
  --display-name="AutoVerse API Service Account"

# Grant roles:
gcloud projects add-iam-policy-binding autoverse-production \
  --member="serviceAccount:autoverse-api@autoverse-production.iam.gserviceaccount.com" \
  --role="roles/content.admin"

# Generate key file:
gcloud iam service-accounts keys create ~/autoverse-service-account.json \
  --iam-account=autoverse-api@autoverse-production.iam.gserviceaccount.com

# Parse JSON for env vars:
cat ~/autoverse-service-account.json | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('GOOGLE_SERVICE_ACCOUNT_EMAIL:', data['client_email'])
print('GOOGLE_SERVICE_ACCOUNT_KEY:', data['private_key'][:50], '...')
"
# SAVE: GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY

# Shred the downloaded JSON file:
shred -u ~/autoverse-service-account.json
```

### 6.2 Google Merchant Center

```bash
# Sign up at: https://merchants.google.com
# Create account: AutoVerse
# Claim website: autoverse.com.bd
# Verification: add Google Site Verification HTML tag to homepage

# Create GMC API project linking:
# GMC Dashboard → Tools → API Center → Link to Google Cloud project
# Select: autoverse-production
# This allows the service account to manage merchant data

# Note your Merchant ID from GMC dashboard top bar
# SAVE: GOOGLE_MERCHANT_ID=<merchant-id>

# GMC feed registration:
# In GMC: Products → Feeds → Add Feed
# Feed name: AutoVerse Vehicle Feed
# Country: Bangladesh
# Language: English
# Destination: Google Shopping (if available in BD) or Search Ads
# Fetch URL: https://api.autoverse.com.bd/feeds/gmc/{dealerId}?key={key}
# (This is per-dealer — the platform registers feeds dynamically)
```

---

## SECTION 7 — META (FACEBOOK, WHATSAPP, INSTAGRAM)

### 7.1 Facebook App Setup

```bash
# Sign up at: https://developers.facebook.com
# Create App:
# apps.facebook.com → Create App → Business → Name: AutoVerse → Create

# Note App ID and App Secret:
# Dashboard → Settings → Basic
# SAVE: META_APP_ID=<app-id>
# SAVE: META_APP_SECRET=<app-secret>

# Add required products to the app:
# Dashboard → Add Products:
#   ☐ Messenger (for Facebook inbox automation)
#   ☐ Instagram Graph API (for Instagram automation)
#   ☐ Marketing API (for Lead Ads integration)
#   ☐ Facebook Login for Business (for dealer OAuth)
#   ☐ WhatsApp Business API (for WhatsApp automation)
#   ☐ Webhooks (for receiving events)

# Configure OAuth redirect URIs:
# Dashboard → Facebook Login for Business → Settings
# Valid OAuth Redirect URIs: https://api.autoverse.com.bd/api/v1/oauth/facebook/callback

# Submit App for Review:
# Dashboard → App Review → Request Permissions:
#   REQUIRED (submit for review):
#   - pages_messaging           (Facebook inbox automation)
#   - pages_manage_posts        (post scheduling)
#   - leads_retrieval           (Lead Ads sync)
#   - catalog_management        (vehicle catalog)
#   - instagram_content_publish (Instagram posts)
#
# Each permission requires: use case description + screen recording
# Estimated review time: 1–10 business days (often faster for standard integrations)
```

### 7.2 WhatsApp Business Account

```bash
# Prerequisite: Facebook Business Manager account + business verification

# Business Verification (do this first — takes 2-5 business days):
# business.facebook.com → Business Settings → Business Info → Start Verification
# Required: Trade license, business address, phone number verification
# BD business verification documents:
#   - Trade License (latest renewal)
#   - Bank statement or utility bill with business address
#   - Business phone number (must receive call/SMS)

# Create WhatsApp Business Account after verification:
# business.facebook.com → Business Settings → WhatsApp Accounts → Add
# Name: AutoVerse
# Time zone: Asia/Dhaka (UTC+6)

# Register phone number for WABA:
# Settings → WhatsApp Manager → Add Phone Number
# Choose: Use an existing number OR get new number
# IMPORTANT: This number cannot be on WhatsApp personal app simultaneously
# Verification: receive OTP via call or SMS

# Note after setup:
# SAVE: WHATSAPP_BUSINESS_ACCOUNT_ID=<waba-id> (from WhatsApp Manager URL)
# SAVE: WHATSAPP_PHONE_NUMBER_ID=<phone-number-id> (from Phone Numbers list)

# Create System User for long-lived token:
# business.facebook.com → Business Settings → System Users → Add
# Name: AutoVerse System User
# Role: Admin
# → Generate Token (for this system user)
# Select all necessary permissions including:
#   whatsapp_business_messaging, whatsapp_business_management,
#   pages_messaging, catalog_management, leads_retrieval
# Token type: Never expires
# SAVE: META_SYSTEM_USER_TOKEN=<never-expiring-token>
# SAVE: WHATSAPP_API_TOKEN=<same-token> (or generate separate one)

# Set up Webhook for incoming messages:
# WhatsApp Manager → Configuration → Webhook
# Callback URL: https://api.autoverse.com.bd/api/v1/automation/whatsapp/webhook
# Verify Token: <generate random string, save as WHATSAPP_WEBHOOK_VERIFY_TOKEN>
# Subscribe to: messages, message_deliveries, message_reads

# Submit WhatsApp message templates (see Step 14):
# Dashboard → WhatsApp → Message Templates → Create Template
# Submit each template from autoverse_step14_whatsapp_templates.json
# Estimated approval: instant to 24 hours per template

# SAVE:
# WHATSAPP_PHONE_NUMBER_ID=<id>
# WHATSAPP_BUSINESS_ACCOUNT_ID=<id>
# WHATSAPP_API_TOKEN=<system-user-token>
# WHATSAPP_WEBHOOK_VERIFY_TOKEN=<random-string>
# WHATSAPP_APP_SECRET=<same-as-META_APP_SECRET>
```

---

## SECTION 8 — BKASH MERCHANT ACCOUNT

```
⏰ CRITICAL PATH: START ON DAY 1. Approval takes 7–14 business days.

STEP 1: Contact bKash
  Website: https://www.bkash.com/en/business/merchants
  Email:   merchants@bkash.com
  Phone:   16247 (bKash merchant hotline)
  
  Request: "Tokenized Payment Gateway (PGW) integration"
  Product needed: bKash PGW / Checkout API (Tokenized)

STEP 2: Documents Required
  □ Trade License (valid, renewed current year)
  □ TIN certificate
  □ NID/Passport of business owner
  □ Bank account information (for settlements)
  □ Business address proof
  □ Website URL (autoverse.com.bd — must be live or at least a landing page)
  □ Integration purpose: "SaaS subscription billing and C2C listing fees"

STEP 3: What bKash Provides After Approval
  □ Merchant account credentials
  □ Sandbox credentials (for testing) — usually provided within 2-3 days
  □ API keys for production — after compliance review

STEP 4: Save credentials when received
  # Sandbox (for development/staging):
  BKASH_BASE_URL_SANDBOX=https://tokenized.sandbox.pay.bka.sh/v1.2.0-beta
  BKASH_APP_KEY_SANDBOX=<sandbox-key>
  BKASH_APP_SECRET_SANDBOX=<sandbox-secret>
  BKASH_USERNAME_SANDBOX=<sandbox-username>
  BKASH_PASSWORD_SANDBOX=<sandbox-password>
  
  # Production (only use after full testing):
  BKASH_BASE_URL=https://tokenized.pay.bka.sh/v1.2.0-beta
  BKASH_APP_KEY=<production-key>
  BKASH_APP_SECRET=<production-secret>
  BKASH_USERNAME=<production-username>
  BKASH_PASSWORD=<production-password>

STEP 5: Test transaction (before go-live)
  Run a real BDT 1 test with production credentials.
  Confirm in bKash Merchant Dashboard that it appears.
  Then refund the BDT 1 via the refund API.
  This is required in the Master Goal Directive before launch.
```

---

## SECTION 9 — NAGAD MERCHANT ACCOUNT

```
⏰ CRITICAL PATH: START ON DAY 1. Approval takes 7–14 business days.

STEP 1: Contact Nagad
  Website: https://nagad.com.bd/merchant
  Email:   merchant@nagad.com.bd
  Phone:   16167 (Nagad merchant support)
  
  Request: "Merchant API Direct Integration"
  
STEP 2: Documents Required (same as bKash)
  □ Trade License
  □ TIN certificate
  □ Owner NID/Passport
  □ Bank account for settlements
  □ Website URL

STEP 3: RSA Key Pair Generation
  # You generate these — your public key goes to Nagad:
  openssl genrsa -out nagad_merchant_private.pem 2048
  openssl rsa -in nagad_merchant_private.pem -pubout -out nagad_merchant_public.pem
  
  # Send nagad_merchant_public.pem to Nagad support
  # They will register it and send you:
  #   1. Your Merchant ID
  #   2. Nagad's public key (for verifying their responses)
  
  # CRITICAL: Keep nagad_merchant_private.pem SECRET
  # Store as environment variable:
  NAGAD_PRIVATE_KEY=$(cat nagad_merchant_private.pem | tr '\n' '|' | sed 's/|/\\n/g')
  
  # Shred the .pem file after extracting env var:
  shred -u nagad_merchant_private.pem nagad_merchant_public.pem

STEP 4: Save credentials when received
  NAGAD_MERCHANT_ID=<merchant-id-from-nagad>
  NAGAD_PUBLIC_KEY=<nagad-provided-public-key>
  NAGAD_PRIVATE_KEY=<your-private-key-from-step-3>
  NAGAD_BASE_URL=https://api.mynagad.com/api/dfs  # production
  NAGAD_BASE_URL_SANDBOX=http://sandbox.mynagad.com:10080/merchant-api/api/dfs
```

---

## SECTION 10 — SSLCOMMERZ

```
⏰ Approval: 1–3 business days

STEP 1: Register at https://sslcommerz.com/develop
  Choose: Merchant/Business account
  Business type: Software/SaaS

STEP 2: Documents Required
  □ Trade License
  □ Business bank account details
  □ Website URL (must be functional)
  □ NID of owner

STEP 3: After approval
  # You receive:
  SSLCOMMERZ_STORE_ID=<your-store-id>
  SSLCOMMERZ_STORE_PASS=<your-store-password>
  
  # Sandbox (immediate, for testing):
  SSLCOMMERZ_STORE_ID_SANDBOX=testbox
  SSLCOMMERZ_STORE_PASS_SANDBOX=qwerty
  SSLCOMMERZ_IS_LIVE=false  # use 'true' for production

STEP 4: Configure IPN URL in SSLCommerz merchant panel
  IPN URL: https://api.autoverse.com.bd/api/v1/payments/sslcommerz/ipn
  
STEP 5: Test card payment in sandbox
  Test card numbers available at: https://developer.sslcommerz.com/payment-testing/
```

---

## SECTION 11 — GREENWEB BD (SMS)

```
⏰ Account: Immediate. Sender ID "AutoVerse" approval: 7–14 business days.

STEP 1: Sign up at https://greenweb.com.bd
  Click: "Get Started" or "Register"
  Account type: Business

STEP 2: Documents for sender ID registration
  □ Trade License
  □ Business name that matches sender ID ("AutoVerse")
  □ Purpose: "OTP delivery, transactional notifications, dealer alerts"
  
  IMPORTANT: Sender IDs must be approved by BTRC (Bangladesh Telecommunication
  Regulatory Commission). Greenweb submits on your behalf.
  
  While waiting for "AutoVerse" approval:
  → Use the temporary numeric sender ID assigned to your account
  → All SMS will still deliver; sender shows as a number instead of "AutoVerse"

STEP 3: Purchase SMS credits
  Minimum purchase: BDT 1,000 (≈ 2,500–3,500 SMS)
  Bulk pricing available at higher volumes
  
  Set auto-recharge alert at BDT 2,000 balance

STEP 4: Get API credentials
  Dashboard → API Settings → API Token
  SAVE: GREENWEB_TOKEN=<your-api-token>
  SAVE: SMS_SENDER_ID=AutoVerse  # (or numeric ID while waiting for approval)

STEP 5: Test SMS delivery
  curl "http://api.greenweb.com.bd/api.php?token=$GREENWEB_TOKEN&to=8801711234567&message=AutoVerse+test+message&from=$SMS_SENDER_ID"
  # Expected response: 1101 (success code)
```

---

## SECTION 12 — RESEND (EMAIL)

```bash
# Sign up at: https://resend.com/signup
# No approval needed — immediate

# After signup, set up email domain:
# Dashboard → Domains → Add Domain
# Enter: mail.autoverse.com.bd

# Resend will provide DNS records to add:
# (exact values are unique per account — copy from Resend dashboard)
# Typically 3 CNAME records + 1 TXT record

# Add these DNS records in Cloudflare:
# Dashboard → autoverse.com.bd → DNS → Add Records
# (copy exact values from Resend dashboard)

# Click "Verify DNS Records" in Resend dashboard
# Domain verification: usually within 5–30 minutes after DNS propagation

# Get API key:
# Dashboard → API Keys → Create API Key
# Name: AutoVerse Production
# Permission: Sending Access (Full Access)
# SAVE: RESEND_API_KEY=re_xxxxxxxxxxxxxxxx

# Set from address:
# SAVE: EMAIL_FROM=noreply@mail.autoverse.com.bd

# Test email sending:
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@mail.autoverse.com.bd",
    "to": ["your-test-email@example.com"],
    "subject": "AutoVerse Email Test",
    "html": "<p>Email sending is working!</p>"
  }'
# Expected: {"id":"re_xxxxxxxx"}
```

---

## SECTION 13 — GITHUB REPOSITORY

```bash
# Create organization or use personal account:
# github.com → New Organization → autoverse (or your chosen name)

# Create repository:
gh repo create autoverse/autoverse \
  --private \
  --description "AutoVerse Automotive Ecosystem OS" \
  --gitignore Node \
  --license proprietary

# Clone and set up:
git clone git@github.com:autoverse/autoverse.git
cd autoverse

# Set branch protection rules (via GitHub API or Dashboard):
# Settings → Branches → Add Branch Protection Rule

# For 'main':
gh api repos/autoverse/autoverse/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI / Lint & Type Check","CI / Unit Tests","CI / Integration Tests","CI / Security Scan"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false

# Set up GitHub Environments (for deployment gates):
# Settings → Environments → New Environment

# Environment 1: staging
# No protection rules (auto-deploy on push to staging branch)

# Environment 2: production-approval
# Required reviewers: [add owner/CTO GitHub usernames]
# Wait timer: 0 (approval is the gate)

# Environment 3: production
# No additional protection (approval happens in production-approval env)

# Add all secrets to GitHub:
# Settings → Secrets and Variables → Actions → New Repository Secret

# Run this script to add all secrets at once:
add_secret() {
  gh secret set "$1" --body "$2"
}

# DigitalOcean
add_secret "DO_ACCESS_TOKEN"        "<doctl-token>"
add_secret "DO_APP_ID_PRODUCTION"   "<app-id>"
add_secret "DO_APP_ID_STAGING"      "<staging-app-id>"

# Database
add_secret "PRODUCTION_DATABASE_URL" "<prod-app-user-connection-string>"
add_secret "MIGRATION_DATABASE_URL"  "<prod-migration-user-connection-string>"
add_secret "STAGING_DATABASE_URL"    "<staging-connection-string>"

# Auth
add_secret "JWT_PRIVATE_KEY"         "<rsa-private-key-escaped>"
add_secret "JWT_PUBLIC_KEY"          "<rsa-public-key-escaped>"
add_secret "ADMIN_JWT_SECRET"        "<64-hex-char-secret>"
add_secret "ENCRYPTION_KEY"          "<64-hex-chars-for-aes256>"

# Redis
add_secret "REDIS_URL"               "<upstash-production-url>"
add_secret "STAGING_REDIS_URL"       "<upstash-staging-url>"

# Payments
add_secret "BKASH_APP_KEY"           "<key>"
add_secret "BKASH_APP_SECRET"        "<secret>"
add_secret "BKASH_USERNAME"          "<username>"
add_secret "BKASH_PASSWORD"          "<password>"
add_secret "NAGAD_MERCHANT_ID"       "<id>"
add_secret "NAGAD_PRIVATE_KEY"       "<key>"
add_secret "NAGAD_PUBLIC_KEY"        "<key>"
add_secret "SSLCOMMERZ_STORE_ID"     "<id>"
add_secret "SSLCOMMERZ_STORE_PASS"   "<pass>"

# Communications
add_secret "GREENWEB_TOKEN"          "<token>"
add_secret "META_APP_ID"             "<id>"
add_secret "META_APP_SECRET"         "<secret>"
add_secret "META_SYSTEM_USER_TOKEN"  "<token>"
add_secret "WHATSAPP_PHONE_NUMBER_ID" "<id>"
add_secret "WHATSAPP_BUSINESS_ACCOUNT_ID" "<id>"
add_secret "WHATSAPP_API_TOKEN"      "<token>"
add_secret "WHATSAPP_WEBHOOK_VERIFY_TOKEN" "<token>"
add_secret "RESEND_API_KEY"          "<key>"

# Storage
add_secret "R2_ACCOUNT_ID"           "<id>"
add_secret "R2_ACCESS_KEY_ID"        "<key>"
add_secret "R2_SECRET_ACCESS_KEY"    "<secret>"

# Google
add_secret "GOOGLE_SERVICE_ACCOUNT_EMAIL" "<email>"
add_secret "GOOGLE_SERVICE_ACCOUNT_KEY"   "<key>"

# Firebase
add_secret "FIREBASE_PROJECT_ID"     "<id>"
add_secret "FIREBASE_PRIVATE_KEY"    "<key>"
add_secret "FIREBASE_CLIENT_EMAIL"   "<email>"

# Search
add_secret "MEILISEARCH_HOST"        "http://<droplet-ip>:7700"
add_secret "MEILISEARCH_MASTER_KEY"  "<key>"

# Monitoring
add_secret "SENTRY_DSN"             "<dsn>"

# Vercel
add_secret "VERCEL_TOKEN"            "<token>"
add_secret "VERCEL_ORG_ID"           "<org-id>"

# Admin
add_secret "ADMIN_IP_ALLOWLIST"      "x.x.x.x/32,y.y.y.y/32"

# Test JWT keys (for CI)
add_secret "TEST_JWT_PRIVATE_KEY"    "<test-rsa-private-key>"
add_secret "TEST_JWT_PUBLIC_KEY"     "<test-rsa-public-key>"
```

---

## SECTION 14 — SENTRY

```bash
# Sign up at: https://sentry.io/signup
# Plan: Team ($26/month recommended, Free for MVP)

# Create organization: AutoVerse

# Create projects (one per service):
# Dashboard → Projects → Create Project

# Project 1: autoverse-api (Node.js)
# Project 2: autoverse-web (Next.js)
# Project 3: autoverse-admin (Next.js)

# For each project, copy the DSN:
# Project → Settings → Client Keys (DSN)
# Format: https://<key>@o<org>.ingest.sentry.io/<project>

# SAVE per project:
# SENTRY_DSN_API=https://...
# SENTRY_DSN_WEB=https://...
# SENTRY_DSN_ADMIN=https://...
# (Or use one DSN for all if on free plan)

# Configure alert rules in Sentry:
# Alerts → Create Alert → Metric Alert:
#   Condition: Error rate > 1% over 5 minutes
#   Action: Notify Slack #alerts-critical

# Configure source maps upload for better error tracing:
# Install Sentry CLI:
npm install -g @sentry/cli

# In CI/CD, after build:
# sentry-cli releases new $VERSION
# sentry-cli releases set-commits $VERSION --auto
# sentry-cli releases files $VERSION upload-sourcemaps ./dist
```

---

## SECTION 15 — POSTHOG

```bash
# Sign up at: https://posthog.com
# Plan: Free (1M events/month free, sufficient for early stage)

# Create organization: AutoVerse
# Create project: AutoVerse Production

# Get API key:
# Project Settings → Project API Key
# SAVE: POSTHOG_API_KEY=phc_xxxxxxxxxxxxxxxx
# SAVE: NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxx
# SAVE: NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Key events to configure as custom events:
# (PostHog will auto-capture pageviews; configure these custom events in code)
#   dealer_registered         → dealer.created
#   first_vehicle_listed      → vehicle.created (first for this dealer)
#   first_lead_received       → lead.created (first for this dealer)
#   subscription_upgraded     → subscription.upgraded
#   deal_closed               → deal.delivered
#   c2c_listing_submitted     → c2c.submitted

# Configure feature flags in PostHog:
# (Useful for A/B testing before full feature flag system in admin panel)
# Features → Feature Flags → New Feature Flag
```

---

## SECTION 16 — BETTERUPTIME

```bash
# Sign up at: https://betteruptime.com
# Plan: Free (sufficient for MVP monitoring)

# After signup, create monitors:
# Dashboard → Monitors → New Monitor

# Monitor 1: API Health
#   URL: https://api.autoverse.com.bd/health
#   Check interval: 1 minute
#   Alert after: 2 consecutive failures
#   Notifications: Slack + Email

# Monitor 2: Marketplace Homepage
#   URL: https://autoverse.com.bd
#   Check interval: 1 minute
#   Keyword check: "AutoVerse" (confirms page rendered)

# Monitor 3: Admin Panel (expected 404 from BetterUptime IP)
#   URL: https://admin.autoverse.com.bd
#   Expected status: 404 (it's IP-restricted; 404 from Cloudflare = correct behavior)
#   Alert if: status != 404

# Create Status Page:
# Status Pages → New Status Page
# Domain: status.autoverse.com.bd
# Add CNAME record in Cloudflare as provided by BetterUptime
# Add all 3 monitors to status page

# Set up Slack notification:
# Settings → Notifications → Slack → Connect

# Get on-call phone number:
# Settings → On-call → Add phone number for SMS alerts
```

---

## SECTION 17 — JWT KEY GENERATION

```bash
# Generate RSA key pair for dealer JWT signing
# Run this once per environment. Keys are NEVER committed to Git.

# Dealer JWT keys:
openssl genrsa -out dealer_jwt_private.pem 2048
openssl rsa -in dealer_jwt_private.pem -pubout -out dealer_jwt_public.pem

# Convert to single-line format for environment variables:
JWT_PRIVATE_KEY=$(cat dealer_jwt_private.pem | awk '{printf "%s\\n", $0}')
JWT_PUBLIC_KEY=$(cat dealer_jwt_public.pem | awk '{printf "%s\\n", $0}')
echo "JWT_PRIVATE_KEY=$JWT_PRIVATE_KEY"
echo "JWT_PUBLIC_KEY=$JWT_PUBLIC_KEY"

# Admin JWT secret (HS256 — simpler for internal tokens):
ADMIN_JWT_SECRET=$(openssl rand -hex 64)
echo "ADMIN_JWT_SECRET=$ADMIN_JWT_SECRET"

# AES-256 encryption key (for storing API credentials at rest):
ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"

# Clean up PEM files:
shred -u dealer_jwt_private.pem dealer_jwt_public.pem

# Test JWT keys (generate a token and verify it):
node -e "
const jwt = require('jsonwebtoken');
const privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\\\n/g, '\n');
const publicKey = process.env.JWT_PUBLIC_KEY.replace(/\\\\n/g, '\n');
const token = jwt.sign({sub: 'test', dealer_id: 'uuid'}, privateKey, {algorithm: 'RS256'});
const decoded = jwt.verify(token, publicKey, {algorithms: ['RS256']});
console.log('JWT keys working:', decoded.sub === 'test' ? '✅' : '❌');
"
```

---

## SECTION 18 — ENVIRONMENT FILES

```bash
# Generate .env.example (committed to repo — shows required vars, no values):
cat > .env.example << 'EOF'
# Application
NODE_ENV=development
APP_URL=https://autoverse.com.bd
API_URL=https://api.autoverse.com.bd
NEXT_PUBLIC_API_URL=https://api.autoverse.com.bd
APP_VERSION=local

# Database (two separate connections — DO NOT USE migration_user in app code)
DATABASE_URL=postgresql://app_user:PASSWORD@localhost:5432/autoverse?sslmode=disable
MIGRATION_DATABASE_URL=postgresql://migration_user:PASSWORD@localhost:5432/autoverse?sslmode=disable

# Redis
REDIS_URL=redis://localhost:6379

# Auth (RS256 keys — generate with Section 17 commands)
JWT_PRIVATE_KEY=
JWT_PUBLIC_KEY=
ADMIN_JWT_SECRET=
ENCRYPTION_KEY=

# MeiliSearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_MASTER_KEY=localdevmasterkey

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=autoverse-media-production
R2_PUBLIC_URL=https://media.autoverse.com.bd

# SMS (Greenweb BD)
GREENWEB_TOKEN=
SMS_SENDER_ID=AutoVerse

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=noreply@mail.autoverse.com.bd

# bKash
BKASH_BASE_URL=https://tokenized.sandbox.pay.bka.sh/v1.2.0-beta
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=

# Nagad
NAGAD_MERCHANT_ID=
NAGAD_PUBLIC_KEY=
NAGAD_PRIVATE_KEY=
NAGAD_BASE_URL=http://sandbox.mynagad.com:10080/merchant-api/api/dfs

# SSLCommerz
SSLCOMMERZ_STORE_ID=testbox
SSLCOMMERZ_STORE_PASS=qwerty
SSLCOMMERZ_IS_LIVE=false

# Facebook / Meta
META_APP_ID=
META_APP_SECRET=
META_SYSTEM_USER_TOKEN=

# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_API_TOKEN=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Google
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_KEY=

# Monitoring
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Admin Security
ADMIN_IP_ALLOWLIST=127.0.0.1
INTERNAL_API_SECRET=

# Cloudflare Worker
CLOUDFLARE_API_TOKEN=
EOF

# .env.example is committed. Actual .env.local is gitignored.
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
echo "*.pem" >> .gitignore
echo "service-account*.json" >> .gitignore
```

---

## SECTION 19 — FINAL PRE-LAUNCH VERIFICATION

```bash
#!/bin/bash
# pre_launch_checklist.sh
# Run this before going live. All checks must pass.

echo "🚀 AutoVerse Pre-Launch Infrastructure Verification"
echo "=================================================="

# 1. API Health
echo -n "1. API health check... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.autoverse.com.bd/health)
[ "$STATUS" = "200" ] && echo "✅ ($STATUS)" || echo "❌ ($STATUS)"

# 2. API Readiness (DB + Redis connected)
echo -n "2. API readiness check... "
READY=$(curl -s https://api.autoverse.com.bd/health/ready | python3 -c "import sys,json; d=json.load(sys.stdin); print('ok' if d.get('status')=='ok' else 'fail')")
[ "$READY" = "ok" ] && echo "✅" || echo "❌"

# 3. Marketplace homepage
echo -n "3. Marketplace homepage... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://autoverse.com.bd)
[ "$STATUS" = "200" ] && echo "✅" || echo "❌ ($STATUS)"

# 4. Admin panel returns 404 from public IP
echo -n "4. Admin panel IP restriction (should be 404)... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://admin.autoverse.com.bd)
[ "$STATUS" = "404" ] && echo "✅ (correctly blocked)" || echo "⚠️  ($STATUS — check WAF rule)"

# 5. R2 media URL accessible
echo -n "5. R2 media URL accessible... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://media.autoverse.com.bd/)
[ "$STATUS" = "404" ] || [ "$STATUS" = "200" ] && echo "✅ (R2 responding)" || echo "❌ ($STATUS)"

# 6. MeiliSearch health
echo -n "6. MeiliSearch health... "
MEILI=$(curl -s "http://${MEILISEARCH_HOST}/health" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','fail'))" 2>/dev/null)
[ "$MEILI" = "available" ] && echo "✅" || echo "❌ ($MEILI)"

# 7. SMS delivery
echo -n "7. Greenweb SMS (send test)... "
RESULT=$(curl -s "http://api.greenweb.com.bd/api.php?token=$GREENWEB_TOKEN&to=8801711234567&message=AutoVerse+test&from=$SMS_SENDER_ID")
echo "$RESULT" | grep -q "11" && echo "✅ ($RESULT)" || echo "❌ ($RESULT)"

# 8. WhatsApp template count
echo -n "8. WhatsApp templates approved... "
TEMPLATES=$(curl -s "https://graph.facebook.com/v19.0/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?status=APPROVED&limit=100" \
  -H "Authorization: Bearer $META_SYSTEM_USER_TOKEN" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])))")
[ "$TEMPLATES" -ge "16" ] && echo "✅ ($TEMPLATES templates)" || echo "⚠️  (Only $TEMPLATES approved — need 16+)"

# 9. BullMQ queues running
echo -n "9. BullMQ queue health (via API)... "
QUEUES=$(curl -s https://api.autoverse.com.bd/api/v1/admin/system/health \
  -H "Authorization: Bearer $ADMIN_TEST_TOKEN" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('ok' if 'queues' in d.get('data',{}) else 'fail')" 2>/dev/null)
[ "$QUEUES" = "ok" ] && echo "✅" || echo "⚠️  (need admin token to test)"

echo ""
echo "=================================================="
echo "MANUAL VERIFICATION REQUIRED:"
echo "  □ bKash BDT 1 test transaction completed and refunded"
echo "  □ Nagad BDT 1 test transaction completed and refunded"
echo "  □ SSLCommerz test card payment completed"
echo "  □ All 16 WhatsApp templates (en + bn) approved by Meta"
echo "  □ BTRC SMS sender ID 'AutoVerse' approved (or numeric fallback active)"
echo "  □ Sentry: test error received in dashboard"
echo "  □ BetterUptime: monitors all showing green"
echo "  □ GitHub Actions: production pipeline ran successfully once"
echo "  □ Marketplace has ≥ 200 active listings"
echo "  □ ≥ 15 active dealers with inventory"
echo "  □ ≥ 30 IMV-rated listings"
echo ""
echo "When all checks pass: enable Facebook ads and SEO promotion."
```

---

## MASTER ENVIRONMENT VARIABLE REFERENCE

```bash
# Complete list of all environment variables for production
# (values redacted — fill from each service's setup above)

# === APPLICATION ===
NODE_ENV=production
APP_URL=https://autoverse.com.bd
API_URL=https://api.autoverse.com.bd
NEXT_PUBLIC_API_URL=https://api.autoverse.com.bd
APP_VERSION=git-sha-injected-at-build-time

# === DATABASE ===
DATABASE_URL=postgresql://app_user:PWD@host:PORT/defaultdb?sslmode=require
MIGRATION_DATABASE_URL=postgresql://migration_user:PWD@host:PORT/defaultdb?sslmode=require

# === REDIS ===
REDIS_URL=rediss://default:PWD@ENDPOINT.upstash.io:6379

# === AUTH ===
JWT_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n
ADMIN_JWT_SECRET=128-char-hex-string
ENCRYPTION_KEY=64-char-hex-string-for-aes256

# === SEARCH ===
MEILISEARCH_HOST=http://DROPLET_IP:7700
MEILISEARCH_MASTER_KEY=64-char-hex-string

# === STORAGE ===
R2_ACCOUNT_ID=your-cf-account-id
R2_ACCESS_KEY_ID=your-r2-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret
R2_BUCKET_NAME=autoverse-media-production
R2_PUBLIC_URL=https://media.autoverse.com.bd

# === SMS ===
GREENWEB_TOKEN=your-greenweb-token
SMS_SENDER_ID=AutoVerse

# === EMAIL ===
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@mail.autoverse.com.bd

# === PAYMENTS ===
BKASH_BASE_URL=https://tokenized.pay.bka.sh/v1.2.0-beta
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=
NAGAD_MERCHANT_ID=
NAGAD_PUBLIC_KEY=
NAGAD_PRIVATE_KEY=
NAGAD_BASE_URL=https://api.mynagad.com/api/dfs
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASS=
SSLCOMMERZ_IS_LIVE=true

# === META / FACEBOOK / WHATSAPP ===
META_APP_ID=
META_APP_SECRET=
META_SYSTEM_USER_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_API_TOKEN=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=

# === FIREBASE ===
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# === GOOGLE ===
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_KEY=

# === MONITORING ===
SENTRY_DSN=https://KEY@oORG.ingest.sentry.io/PROJECT
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# === ADMIN & SECURITY ===
ADMIN_IP_ALLOWLIST=IP1/32,IP2/32,CIDR/24
INTERNAL_API_SECRET=64-char-hex-for-cloudflare-worker-auth

# === CI/CD ===
DO_ACCESS_TOKEN=
DO_APP_ID_PRODUCTION=
DO_APP_ID_STAGING=
VERCEL_TOKEN=
VERCEL_ORG_ID=
CLOUDFLARE_API_TOKEN=
```

---

*AutoVerse — Step 21: Infrastructure Pre-Provisioning Guide*
*All Services · Exact CLI Commands · Approval Timelines · Critical Path · v1.0*

---

## BLUEPRINT COMPLETE — ALL 21 STEPS

All documentation phases are now complete:

| Steps | Phase | Documents |
|---|---|---|
| 1–10 | **Architecture & Design** | Product strategy, system design, database, engineering, AI/automation, UI/UX, payments, security, DevOps, failure playbook |
| 11 | **Execution Constitution** | Master Goal Directive |
| 12–16 | **Technical Artifacts** | OpenAPI spec, i18n strings, WhatsApp templates, React Email templates, database seeds |
| 17–21 | **Operational Materials** | Sales script, onboarding SOP, legal documents, support playbook, infrastructure guide |

**The build begins at Step 1 of the Master Goal Directive.**
