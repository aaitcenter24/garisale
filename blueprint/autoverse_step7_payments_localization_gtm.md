# AutoVerse — Step 7: Payments + Localization + GTM
### bKash · Nagad · SSLCommerz · SMS · WhatsApp API · Facebook · Email · Dealer GTM · Marketplace Growth · v1.0

> Complete specification of every payment gateway integration with exact API flows, idempotency implementation, and BD-specific failure handling. Full third-party communication channel setup. Dealer acquisition GTM strategy grounded in BD market realities. Marketplace growth playbook from 0 to 100K+ listings.

---

## Table of Contents

1. [bKash Direct API — Complete Integration](#1-bkash-direct-api--complete-integration)
2. [Nagad Direct API — Complete Integration](#2-nagad-direct-api--complete-integration)
3. [SSLCommerz — Complete Integration](#3-sslcommerz--complete-integration)
4. [Payment Orchestration Layer](#4-payment-orchestration-layer)
5. [Per-Lead Billing Cycle](#5-per-lead-billing-cycle)
6. [Greenweb BD SMS — Setup & Integration](#6-greenweb-bd-sms--setup--integration)
7. [WhatsApp Business API — Setup & Integration](#7-whatsapp-business-api--setup--integration)
8. [Facebook Graph API — Setup & Integration](#8-facebook-graph-api--setup--integration)
9. [Resend Email — Setup & BD Routing](#9-resend-email--setup--bd-routing)
10. [Dealer Acquisition GTM](#10-dealer-acquisition-gtm)
11. [Marketplace Growth Playbook](#11-marketplace-growth-playbook)
12. [Full Monetization Model with BD Price Sensitivity](#12-full-monetization-model-with-bd-price-sensitivity)

---

## 1. bKash Direct API — Complete Integration

### 1.1 API Overview

```
API VERSION: bKash Tokenized Checkout API v1.2.0-beta
BASE URL (production):  https://tokenized.pay.bka.sh/v1.2.0-beta
BASE URL (sandbox):     https://tokenized.sandbox.pay.bka.sh/v1.2.0-beta
INTEGRATION TYPE:       Direct API (server-side, not redirect-based)
AUTHENTICATION:         Token-based (app key + app secret + username + password)
USE CASE:               Subscription billing, C2C listing fees, featured boosts
```

### 1.2 Authentication Flow

```
STEP 1: Get Access Token
  POST /tokenized/checkout/token/grant
  Headers:
    username: {BKASH_USERNAME}
    password: {BKASH_PASSWORD}
    Content-Type: application/json

  Body:
    { "app_key": "{BKASH_APP_KEY}", "app_secret": "{BKASH_APP_SECRET}" }

  Response:
    {
      "statusCode": "0000",
      "id_token": "eyJ...",          // access token (expires ~3600s)
      "token_type": "Bearer",
      "expires_in": 3600,
      "refresh_token": "eyJ...",
      "refresh_token_expires_in": "28800"
    }

  CACHING:
    Store id_token in Redis: cache:bkash:access_token TTL 3500s
    On TTL expiry: auto-refresh using refresh_token
    Refresh call:
      POST /tokenized/checkout/token/refresh
      Body: { "app_key": "...", "app_secret": "...", "refresh_token": "..." }
    If refresh fails: re-authenticate from scratch

  CIRCUIT BREAKER:
    If auth fails 3× in 5 minutes → circuit opens → alert System Admin
    All payment attempts during open circuit: return 503 (gateway unavailable)
    Circuit resets after 5 minutes
```

### 1.3 Create Payment

```
STEP 2: Create Payment
  POST /tokenized/checkout/create
  Headers:
    Authorization: Bearer {id_token}
    X-APP-Key: {BKASH_APP_KEY}
    Content-Type: application/json

  Body:
    {
      "mode": "0011",                // fixed: checkout mode
      "payerReference": "{dealership_id}",
      "callbackURL": "https://api.autoverse.com.bd/api/v1/payments/bkash/callback",
      "merchantAssociationInfo": "AutoVerse subscription",
      "amount": "2999.00",           // string format, 2 decimal places
      "currency": "BDT",
      "intent": "sale",
      "merchantInvoiceNumber": "{idempotency_key}"  // CRITICAL: our idempotency key
    }

  Response (success):
    {
      "statusCode": "0000",
      "statusMessage": "Successful",
      "paymentID": "TR0011XXXXX",    // bKash payment ID — store this
      "bkashURL": "https://sandbox.payment.bkash.com/...", // redirect URL
      "callbackURL": "...",
      "successCallbackURL": "...",
      "failureCallbackURL": "...",
      "cancelledCallbackURL": "...",
      "amount": "2999.00",
      "intent": "sale",
      "currency": "BDT",
      "paymentCreateTime": "2025-01-15T10:30:00:000 GMT+0600",
      "transactionStatus": "Initiated",
      "merchantInvoiceNumber": "{idempotency_key}"
    }

  FAILURE RESPONSES:
    statusCode: 2001 → Invalid merchant info
    statusCode: 2002 → Expired token → refresh token and retry
    statusCode: 2003 → Invalid amount format
    statusCode: 2007 → Insufficient funds (can't know until execute step)
    statusCode: 2062 → Duplicate merchantInvoiceNumber (idempotency key already used)
      → CRITICAL: query existing payment by merchantInvoiceNumber before assuming failure

  STORAGE on create:
    payment_transaction record:
      status = 'initiated'
      gateway = 'bkash'
      gateway_transaction_id = paymentID
      idempotency_key = merchantInvoiceNumber
      initiated_at = NOW()
```

### 1.4 Execute Payment (Post Redirect)

```
STEP 3: Execute Payment
  Called AFTER buyer completes payment on bKash URL
  bKash redirects to our callbackURL with ?paymentID=TR0011XXXXX&status=success

  POST /tokenized/checkout/execute
  Headers:
    Authorization: Bearer {id_token}
    X-APP-Key: {BKASH_APP_KEY}
    Content-Type: application/json

  Body: { "paymentID": "{paymentID}" }

  Response (success):
    {
      "statusCode": "0000",
      "trxID": "AAH71XXXXX",         // bKash transaction ID (for records)
      "paymentID": "TR0011XXXXX",
      "amount": "2999.00",
      "currency": "BDT",
      "transactionStatus": "Completed",
      "payerReference": "{dealership_id}",
      "customerMsisdn": "01XXXXXXXXX",
      "paymentExecuteTime": "2025-01-15T10:31:30:000 GMT+0600",
      "merchantInvoiceNumber": "{idempotency_key}"
    }

  SUCCESS PATH:
    1. UPDATE payment_transaction SET status='success', completed_at=NOW(), gateway_transaction_id=trxID
    2. UPDATE invoice SET status='paid', paid_at=NOW()
    3. Activate/extend subscription
    4. Generate invoice PDF → R2
    5. Send confirmation SMS to dealer
    6. WebSocket notification to dealer dashboard

  FAILURE RESPONSE (transactionStatus != Completed):
    statusCode: 2023 → Payment already completed (idempotency: already processed)
      → Query existing transaction → return success (not double-charge)
    statusCode: 2026 → Insufficient balance → payment failed
    statusCode: 2029 → Duplicate request → query and return existing status
    statusCode: 2062 → Payment cancelled by user

  TIMEOUT HANDLING (most critical BD scenario):
    bKash redirects to callbackURL with status=failure OR times out (no redirect)
    DO NOT immediately mark as failed.
    Instead:
      1. Call Query API to get actual status
      2. If Completed: treat as success
      3. If Initiated/Processing: wait 30s, query again (max 4 retries)
      4. If Cancelled/Failed (confirmed): mark as failed, safe to retry
```

### 1.5 Query Payment (Idempotency & Timeout Recovery)

```
STEP 4: Query Payment Status
  POST /tokenized/checkout/payment/status
  Headers: same as execute
  Body: { "paymentID": "{paymentID}" }

  Response includes: transactionStatus field
    "Initiated"  → payment created, not yet executed
    "Authorized" → payment authorized by user, awaiting execution
    "Completed"  → PAID — activate subscription
    "Cancelled"  → cancelled by user
    "Failed"     → failed (insufficient funds, expired, etc.)

  QUERY SEQUENCE (for timeout recovery):
    Attempt 1: immediately after timeout detected
    Attempt 2: 30 seconds later
    Attempt 3: 2 minutes later
    Attempt 4: 5 minutes later
    If still Initiated/Authorized after 4 queries: DLQ for manual review
    Manual review: Finance Admin checks bKash merchant dashboard
```

### 1.6 Refund API

```
POST /tokenized/checkout/payment/refund
Headers: same as execute
Body:
  {
    "paymentID": "{paymentID}",
    "amount": "2999.00",
    "trxID": "{trxID}",             // original transaction ID
    "sku": "subscription",
    "reason": "overpayment"         // or "duplicate_charge" | "service_failure"
  }

Response: statusCode 0000 → refund initiated
  Refund settlement: 1–3 business days

REFUND LIMITATIONS:
  Maximum: full amount of original transaction
  Time limit: within 30 days of original transaction
  Partial refund: supported (amount < original amount)
```

### 1.7 bKash Webhook (IPN — Instant Payment Notification)

```
bKash optionally sends webhook to our endpoint on payment status change.
This is a SECONDARY confirmation mechanism (primary = execute response).

WEBHOOK ENDPOINT: POST /api/v1/payments/bkash/ipn
NO AUTH HEADER from bKash (verify by querying payment status, not by signature)

PROCESSING:
  1. Extract paymentID from webhook payload
  2. Query payment status via API (don't trust webhook payload alone)
  3. If Completed AND our record shows 'initiated':
     → Process as success (was a timeout case we missed)
  4. Log all IPN events in payment_transaction.metadata JSONB

IDEMPOTENCY:
  Every IPN processing checks: is this payment already marked 'success'?
  YES → log duplicate IPN, no action (prevents double-activation)
  NO  → process normally
```

---

## 2. Nagad Direct API — Complete Integration

### 2.1 API Overview

```
API TYPE: Nagad Merchant API (Direct Integration)
BASE URL (production): https://api.mynagad.com/api/dfs/
BASE URL (sandbox):    http://sandbox.mynagad.com:10080/merchant-api/api/dfs/
AUTHENTICATION:        RSA-based signature (asymmetric)
KEY SETUP:
  Merchant generates RSA key pair (2048-bit)
  Public key: registered with Nagad merchant portal
  Private key: stored as NAGAD_PRIVATE_KEY env var (PEM format)
  Nagad public key: stored as NAGAD_PUBLIC_KEY env var (for verifying Nagad's responses)
```

### 2.2 Payment Initialization

```
STEP 1: Initialize Payment
  POST /check-out/initialize/{merchantId}/{orderId}
  orderId = idempotency_key (our invoice reference)

  Body construction:
    sensitive_data = {
      "merchantId": "{NAGAD_MERCHANT_ID}",
      "orderId": "{idempotency_key}",
      "amount": "2999",
      "currencyCode": "050",        // BDT
      "challenge": "{uuid}"         // random nonce
    }

  ENCRYPTION:
    encrypted_sensitive_data = RSA_encrypt(
      JSON.stringify(sensitive_data),
      nagad_public_key,             // encrypt WITH Nagad's public key
      padding: OAEP
    )

  SIGNING:
    signature = RSA_sign(
      JSON.stringify(sensitive_data),
      our_private_key,              // sign WITH our private key
      algorithm: SHA256withRSA
    )

  Request body:
    {
      "dateTime": "20250115103000",  // yyyyMMddHHmmss
      "sensitiveData": "{base64(encrypted_sensitive_data)}",
      "signature": "{base64(signature)}"
    }

  Response:
    {
      "sensitiveData": "{encrypted_response}",  // decrypt with our private key
      "signature": "{signature}"                // verify with Nagad's public key
    }

  DECRYPT RESPONSE:
    decrypted = RSA_decrypt(sensitiveData, our_private_key)
    parsed = JSON.parse(decrypted)
    // parsed contains: paymentReferenceId, challenge, tokenizedAmount

  VERIFY RESPONSE SIGNATURE:
    valid = RSA_verify(sensitiveData, signature, nagad_public_key)
    IF NOT valid → reject response (tampered)

  Store: paymentReferenceId, challenge in pending payment record
```

### 2.3 Payment Completion

```
STEP 2: Complete Payment
  Called AFTER buyer completes payment in Nagad app
  Nagad redirects to our callbackURL

  POST /check-out/complete/{merchantId}/{paymentReferenceId}

  Body:
    sensitive_data = {
      "merchantId": "{NAGAD_MERCHANT_ID}",
      "orderId": "{idempotency_key}",
      "amount": "2999",
      "currencyCode": "050",
      "challenge": "{same_challenge_from_init}"  // CRITICAL: same nonce
    }
  Encrypt + sign same as initialization step.

  Response (decrypted):
    {
      "paymentRefId": "XXXXX",
      "orderId": "{idempotency_key}",
      "amount": "2999",
      "currencyCode": "050",
      "status": "Success",
      "issuerPaymentRefId": "XXXXXX",  // Nagad transaction ID
      "issuerPaymentDateTime": "2025-01-15 10:31:30"
    }

  SUCCESS: status = "Success" → activate subscription
  FAILURE: status = "Aborted" or "Failed" → query before retrying
```

### 2.4 Payment Verification (Timeout Recovery)

```
GET /verify/payment/{merchantId}/{paymentReferenceId}
Headers: X-KM-Api-Version: v-0.2.0

No encryption needed for GET queries.

Response: same structure as completion response
Use for: timeout recovery, IPN verification, reconciliation

NAGAD TIMEOUT RATE: similar to bKash (~12% peak hours)
Apply same 4-retry query strategy as bKash
```

---

## 3. SSLCommerz — Complete Integration

### 3.1 Overview

```
USE CASE: Card payments (Visa/MasterCard) and alternate payment methods
          Primary fallback when bKash/Nagad unavailable
          Also used for: valuation report purchases, C2C listing fees from card holders

API VERSION: SSLCommerz RESTful API v4
GATEWAY URL (production): https://securepay.sslcommerz.com/gwprocess/v4/api.php
GATEWAY URL (sandbox):    https://sandbox.sslcommerz.com/gwprocess/v4/api.php
INTEGRATION: Server-side POST, redirect-based
```

### 3.2 Payment Initiation

```
POST https://securepay.sslcommerz.com/gwprocess/v4/api.php
Content-Type: application/x-www-form-urlencoded

REQUIRED FIELDS:
  store_id:         {SSLCOMMERZ_STORE_ID}
  store_passwd:     {SSLCOMMERZ_STORE_PASS}
  total_amount:     2999.00
  currency:         BDT
  tran_id:          {idempotency_key}      // our unique transaction reference
  success_url:      https://api.autoverse.com.bd/api/v1/payments/sslcommerz/success
  fail_url:         https://api.autoverse.com.bd/api/v1/payments/sslcommerz/fail
  cancel_url:       https://api.autoverse.com.bd/api/v1/payments/sslcommerz/cancel
  ipn_url:          https://api.autoverse.com.bd/api/v1/payments/sslcommerz/ipn

CUSTOMER INFO (required by SSLCommerz):
  cus_name:         {dealer.business_name}
  cus_email:        {dealer.email OR "noreply@autoverse.com.bd"}
  cus_add1:         {dealer.address OR dealer.district}
  cus_city:         {dealer.district}
  cus_country:      Bangladesh
  cus_phone:        {dealer.phone}

PRODUCT INFO:
  product_name:     "AutoVerse {tier} Subscription"
  product_category: "Software"
  product_profile:  "general"
  num_of_item:      1

SHIPPING (required even for digital goods):
  shipping_method:  NO
  ship_name:        {dealer.business_name}
  ship_add1:        {dealer.district}
  ship_city:        {dealer.district}
  ship_country:     Bangladesh

Response:
  { "status": "SUCCESS", "failedreason": "", "sessionkey": "XXXXX",
    "GatewayPageURL": "https://securepay.sslcommerz.com/..." }

Redirect buyer to: GatewayPageURL
```

### 3.3 IPN (Instant Payment Notification)

```
SSLCommerz POSTS to ipn_url with payment result.
This is the PRIMARY confirmation mechanism for SSLCommerz (not redirect).

REASON: Redirect can be blocked/manipulated; IPN is server-to-server.

IPN ENDPOINT: POST /api/v1/payments/sslcommerz/ipn
NO AUTHENTICATION HEADER — verify by hash validation

IPN HASH VALIDATION (CRITICAL — prevents fraud):
  received_hash = POST_body.verify_sign
  expected_hash = MD5(
    store_passwd + amount + currency + tran_id + val_id +
    bank_tran_id + card_type + card_no + card_issuer + card_brand +
    card_issuer_country + currency_amount + currency_type + 
    verify_sign_sha2   // SSLCommerz provides both MD5 and SHA256
  )
  IF received_hash != expected_hash: reject IPN (tampered)

  ALWAYS VALIDATE HASH before activating subscription.

IPN FIELDS OF INTEREST:
  status:         VALID | VALIDATED | FAILED | CANCELLED | UNATTEMPTED
  val_id:         SSLCommerz validation ID
  bank_tran_id:   Bank transaction ID
  tran_id:        Our idempotency_key (matches what we sent)
  amount:         Charged amount (VERIFY this matches expected amount)
  currency:       BDT

AMOUNT VERIFICATION:
  received_amount = float(IPN_body.amount)
  expected_amount = invoice.total_bdt
  IF abs(received_amount - expected_amount) > 1.0:
    → Reject IPN, log as suspicious, alert Finance Admin
    (Tolerance of BDT 1 for floating point precision)

PROCESSING:
  status = 'VALID' or 'VALIDATED':
    → Validate hash ✓
    → Verify amount ✓
    → Activate subscription / fulfill order
    → UPDATE payment_transaction SET status='success'
  status = 'FAILED':
    → Mark payment_transaction as failed
    → Trigger retry logic

  ALWAYS RETURN 200 OK to SSLCommerz IPN (even if we reject it)
  Non-200 causes SSLCommerz to retry the IPN repeatedly.
  Log rejection internally; don't surface as HTTP error to SSLCommerz.
```

### 3.4 Success/Fail Redirect Handling

```
Buyer returns to success_url or fail_url after payment.
These are BROWSER-based redirects (not server-to-server).

RULE: NEVER activate subscription based on redirect URL alone.
      Always rely on IPN (server-to-server) for activation.

success_url handler:
  1. Extract tran_id from query params
  2. Check: does payment_transaction WHERE idempotency_key=tran_id have status='success'?
     YES (IPN already processed) → show success screen
     NO (IPN not yet received) → show "Processing your payment..." screen
        → Poll payment status endpoint every 3 seconds (max 10 polls)
        → If activated within 30s: show success
        → If not: "Payment received, activating your account. Check back in 2 minutes."
           (async IPN will arrive and activate)

fail_url handler:
  1. Extract tran_id
  2. Check: does payment_transaction show success? (race condition: IPN arrived first)
     YES → redirect to success screen (ignore fail redirect)
     NO  → show failure UI with [Try Again] option
```

---

## 4. Payment Orchestration Layer

### 4.1 Idempotency Implementation

```typescript
// Core principle: one idempotency_key = one payment attempt round
// Same key = same payment = query existing, don't re-charge

function generateIdempotencyKey(
  dealerId: string,
  invoiceId: string,
  attemptRound: number,
): string {
  // attempt_round groups retries within 5-minute windows
  // This means: retries within 5 min reuse same key (safe)
  // New attempt after 5 min gets new key (safe to retry with gateway)
  return SHA256(`${dealerId}:${invoiceId}:${attemptRound}`).substring(0, 32);
}

function getAttemptRound(): number {
  return Math.floor(Date.now() / 300_000); // 5-minute buckets
}

// Before EVERY payment initiation:
async function initiatePayment(invoiceId: string, dealerId: string, gateway: string) {
  const idempotencyKey = generateIdempotencyKey(
    dealerId, invoiceId, getAttemptRound()
  );

  // Check: has this key already been used?
  const existing = await prisma.paymentTransaction.findFirst({
    where: { idempotency_key: idempotencyKey }
  });

  if (existing) {
    if (existing.status === 'success') {
      return { already_paid: true, transaction: existing };
    }
    if (existing.status === 'pending' || existing.status === 'initiated') {
      // Query gateway for actual status
      return await queryGatewayStatus(existing, gateway);
    }
    // status = 'failed' → same key, re-try is safe (gateway will see same invoice number)
  }

  // Create new payment_transaction record BEFORE calling gateway
  // This prevents double-creation if the gateway call times out
  const transaction = await prisma.paymentTransaction.create({
    data: {
      invoice_id: invoiceId,
      dealership_id: dealerId,
      idempotency_key: idempotencyKey,
      payment_method: gatewayToMethod(gateway),
      gateway,
      amount_bdt: invoice.total_bdt,
      status: 'initiated',
      attempt_number: existing ? existing.attempt_number + 1 : 1,
    }
  });

  return await callGateway(gateway, transaction);
}
```

### 4.2 Double-Charge Prevention Flow

```
SCENARIO: bKash redirects to our callback with status=failure
          BUT payment was actually completed in bKash backend.

WITHOUT PROTECTION: we mark as failed → dealer retries → double-charged.
WITH PROTECTION:

Step 1: Redirect arrives with status=failure
Step 2: DO NOT mark as failed immediately
Step 3: Query bKash API: GET payment status by paymentID
Step 4: Response = "Completed" → mark as SUCCESS (not failure)
Step 5: If response = "Cancelled/Failed" → check our idempotency record
Step 6: No duplicate record exists → safe to mark as failed
Step 7: Mark as failed → enable retry with NEW idempotency key
        (new attempt_round = new 5-minute window)

REDIS LOCK (prevents concurrent execution):
  Before processing any payment callback:
    SETNX payment_processing:{idempotency_key} {timestamp} EX 120
    IF lock not acquired: duplicate callback → return 200 without processing
  After processing: DELETE payment_processing:{idempotency_key}

This prevents two simultaneous IPN/redirect callbacks both activating subscription.
```

### 4.3 Failed Payment Recovery Flow

```typescript
// BullMQ subscription-billing queue processor
async processSubscriptionBilling(job: Job) {
  const { dealership_id, invoice_id } = job.data;

  const dealer = await dealershipsService.findOne(dealership_id);
  const invoice = await invoicesService.findOne(invoice_id);

  // Attempt 1: bKash (primary method)
  try {
    const result = await bkashService.initiateAndExecute(invoice, dealer);
    if (result.status === 'success') {
      await subscriptionService.extend(dealership_id, 30);
      await notificationsService.sendPaymentSuccessSms(dealer);
      return;
    }
  } catch (bkashError) {
    logger.warn('bKash payment attempt failed', { dealership_id, error: bkashError });
  }

  // Attempt 2: Nagad (fallback)
  try {
    // For Nagad: requires buyer interaction (redirect)
    // Can't auto-charge Nagad without buyer interaction on retry
    // Send SMS with manual payment link instead
    await paymentsService.sendManualPaymentLink(dealer, invoice, 'nagad');
    return;
  } catch (nagadError) {
    logger.warn('Nagad payment link failed', { dealership_id });
  }

  // All attempts failed: enter grace period
  await subscriptionService.beginGracePeriod(dealership_id);
  await financeAdminQueue.add({ dealership_id, invoice_id, reason: 'all_attempts_failed' });
}

// Grace period state machine:
// Payment fails → 7-day grace period (full access maintained)
// Day 7: read-only mode
// Day 14: Operations team personal outreach
// Day 30: suspension
// Day 90: data archive warning
```

---

## 5. Per-Lead Billing Cycle

### 5.1 Free Plan Lead Charging

```
WHEN CHARGED: Free plan dealers receive leads from the marketplace.
  Each qualified lead = BDT 150–300 charge.

LEAD QUALIFICATION CRITERIA:
  Qualified lead = a lead where:
    a. source = 'marketplace' (came through AutoVerse marketplace)
    b. lead.buyer_phone IS NOT NULL (phone revealed)
    c. lead is NOT a duplicate of a lead from same phone in last 30 days
    d. Lead was not marked as spam/invalid by dealer within 48 hours of receipt

PRICING:
  Standard lead: BDT 150
  Premium lead (high-intent): BDT 300
  High-intent signals: lead_score >= 50 at creation OR source = 'facebook_lead_ad'

BILLING CYCLE:
  Monthly aggregation (not per-lead charging)
  Aggregation date: 1st of each month for previous month's leads
  Minimum charge: BDT 500 (if fewer than 3–4 leads, still charge minimum)
  Maximum monthly cap: BDT 3,000 (equivalent to Starter plan — natural upsell trigger)

MONTHLY AGGREGATION JOB (BullMQ cron, 1st of month, 10:00 AM):
  SELECT COUNT(*) * avg_lead_price AS total_due
  FROM lead
  WHERE dealership_id = $1
    AND source = 'marketplace'
    AND created_at BETWEEN last_month_start AND last_month_end
    AND buyer_phone IS NOT NULL
    AND is_qualified = true
    AND is_spam = false

  IF total_due >= 500:
    Create invoice (type = 'per_lead')
    Attempt auto-charge via dealer's payment method
    If no payment method: send SMS with manual payment link

INVOICE DETAILS:
  Line items listed: date | lead name (truncated) | source | amount
  Total at bottom
  PDF generated and stored in R2
  Delivered via: SMS link + email attachment + in-app download

DISPUTE HANDLING:
  Dealer can mark lead as "invalid" within 48 hours of receipt
  Invalid lead reasons: wrong number | not a real buyer | duplicate | my existing customer
  Invalid lead disputed: removed from monthly invoice automatically
  Dispute deadline: 48 hours from lead creation (timestamp-checked)
  Disputes after 48h: must contact Finance Admin (manual review)
```

### 5.2 Pay-Per-Lead UX in Dealer OS (Free Plan)

```
LEAD RECEIVED NOTIFICATION:
  Push: "New lead from AutoVerse Marketplace"
  After viewing lead card: charge notification shown inline:
    "This is a qualified marketplace lead.
     A charge of BDT 150 will be added to your monthly invoice."
  [Mark as Invalid] button visible for 48 hours
  [Upgrade to Starter to remove per-lead charges →] upsell link

MONTHLY INVOICE PREVIEW:
  Accessible: Settings → Billing → Lead Invoice
  Shows: running total of current month's qualified leads + estimated charge
  "Upgrade to remove per-lead charges" CTA shown if total > BDT 1,500

UPSELL TRIGGER:
  When per-lead charges hit BDT 2,000 in a month:
    In-app notification: "You've been charged BDT 2,000 for leads this month.
    Starter plan costs BDT 2,999/month with unlimited marketplace leads.
    You'd save money AND get full CRM features. [Upgrade Now]"
```

---

## 6. Greenweb BD SMS — Setup & Integration

### 6.1 Account Setup

```
PROVIDER: Greenweb Technologies Ltd (greenweb.com.bd)
REASON: > 95% BD mobile carrier delivery rate vs < 60% for Twilio/AWS SNS
        Local infrastructure = no international routing latency
        Support: Bengali-speaking support team

ACCOUNT REQUIREMENTS:
  - Registered BD business
  - Sender ID approval: "AutoVerse" (6–11 chars, requires BTRC approval)
    BTRC approval time: 7–14 business days
    Temporary sender ID: 8-digit numeric (auto-assigned during approval)
  - Credit pre-purchase: minimum BDT 1,000 (~1,000 SMS)
  - Low balance alert: set at BDT 2,000 (trigger auto-recharge)

API TYPE: REST API (HTTP GET or POST)
API URL: http://api.greenweb.com.bd/api.php
```

### 6.2 SMS Sending API

```
GET/POST http://api.greenweb.com.bd/api.php

PARAMETERS:
  token:      {GREENWEB_TOKEN}           // API auth token
  to:         8801711234567              // recipient number (BD format, no +)
  message:    URL-encoded message text
  from:       AutoVerse                  // sender ID (or numeric during approval)

  UNICODE (Bangla):
  unicode:    1                          // enable for Bangla messages
  // Note: Unicode SMS = 70 chars per SMS (not 160)
  // Plan for Bangla message length accordingly

RESPONSE: plain text
  Success: "1101" (delivery accepted by Greenweb)
  Failure: error code string

ERROR CODES:
  1005 → Invalid token
  1006 → Insufficient balance
  1007 → Invalid recipient number
  1016 → Message blocked (DND registry)
  1019 → Sender ID not approved yet (use numeric)

NestJS INTEGRATION:
  @Injectable()
  export class SmsService {
    private readonly apiUrl = 'http://api.greenweb.com.bd/api.php';

    async send(phone: string, message: string, isUnicode = false): Promise<SmsResult> {
      const normalizedPhone = this.normalizePhone(phone);

      const params = new URLSearchParams({
        token: this.config.get('GREENWEB_TOKEN'),
        to: normalizedPhone,
        message,
        from: this.config.get('SMS_SENDER_ID'),
        ...(isUnicode && { unicode: '1' }),
      });

      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}?${params.toString()}`)
        .pipe(timeout(8000))
      );

      const resultCode = response.data.trim();
      const success = resultCode.startsWith('11');

      await this.logSms({
        recipient: phone,
        message,
        status: success ? 'sent' : 'failed',
        provider_msg_id: success ? resultCode : null,
        error_code: success ? null : resultCode,
      });

      return { success, code: resultCode };
    }

    private normalizePhone(phone: string): string {
      // +8801711234567 → 8801711234567
      // 01711234567 → 8801711234567
      const digits = phone.replace(/\D/g, '');
      if (digits.startsWith('880')) return digits;
      if (digits.startsWith('0')) return '88' + digits;
      return '880' + digits;
    }
  }
```

### 6.3 SMS Templates & Rate Management

```
SMS CHARACTER BUDGET:
  English: 160 chars = 1 SMS credit
  Bangla (unicode): 70 chars = 1 SMS credit
  Target: all SMS ≤ 160 chars English / ≤ 70 chars Bangla

TEMPLATE LIBRARY:
  All templates stored as constants with character counts:

  NEW_LEAD:
    "AutoVerse: New lead from {source}. {buyer_name} interested in
     {make} {model}. App: app.autoverse.com.bd"
    Character count: ~120 (within limit)

  HOT_LEAD:
    "🔥 HOT LEAD: {buyer_name} scored {score}/100 for {make} {model}.
     Call: {phone}."
    Character count: ~90 (within limit)
    NOTE: 🔥 emoji = 2 chars in SMS encoding; keep total ≤ 160

  SLA_BREACH:
    "AutoVerse: {buyer_name} lead uncontacted 2+ hours. Assigned:
     {salesperson}. Act now: app.autoverse.com.bd"
    Character count: ~120

  AGING_45:
    "AutoVerse: SK-{stock_no} [{make} {model}] 45 days on lot.
     Market: BDT {imv_short}. Review pricing."
    Character count: ~100

  AGING_60:
    "AutoVerse: SK-{stock_no} at 60 days. Reduce BDT {reduction}
     to Good Deal. App: app.autoverse.com.bd"
    Character count: ~95

  AGING_90:
    "URGENT: SK-{stock_no} at {days} days. Action required in app:
     app.autoverse.com.bd"
    Character count: ~80

  DAILY_SUMMARY:
    "AutoVerse {date}: {units} sale(s), BDT {revenue}. Urgent:
     {action}. App: app.autoverse.com.bd"
    Character count: ~100

  PAYMENT_SUCCESS:
    "AutoVerse: Payment confirmed BDT {amount}. {plan} plan active
     until {date}. Invoice: {url}"
    Character count: ~110

  PAYMENT_FAILED:
    "AutoVerse: Payment failed for {month} subscription. Grace
     period: {days} days. Renew: {url}"
    Character count: ~100

  SUBSCRIPTION_REMINDER:
    "AutoVerse: Your {plan} plan renews in {days} days (BDT {amount}).
     Ensure bKash balance is ready."
    Character count: ~105

RATE MANAGEMENT:
  Greenweb rate: ~BDT 0.28–0.40 per SMS (varies by volume)
  AutoVerse allocation per dealer per month:
    Free plan:         100 SMS/month
    Starter:           500 SMS/month
    Professional:    2,000 SMS/month
    Business:        5,000 SMS/month
  Platform system SMS (not counted against dealer quota):
    Hot lead alerts, SLA breach alerts, payment notifications
    These come from platform's own Greenweb account

LOW BALANCE ALERT:
  Redis key: sms:balance_bdt (updated after each API call via Greenweb balance API)
  Check: GET http://api.greenweb.com.bd/api.php?token=X&type=balance
  If balance < BDT 2,000: alert System Admin
  If balance < BDT 500: SMS sending disabled, all jobs log as 'skipped_low_balance'
  Auto-recharge: (manual in Phase 1, automated in Phase 2 via bKash)
```

---

## 7. WhatsApp Business API — Setup & Integration

### 7.1 Meta WABA Account Setup

```
PREREQUISITES (must complete before API access):
  1. Facebook Business Manager account (verified)
  2. Business verification: submit trade license + address + phone
     Timeline: 2–5 business days
  3. WhatsApp Business Account (WABA) creation within Business Manager
  4. Phone number registration:
     - Choose dedicated phone number for AutoVerse platform (not personal)
     - Phone receives OTP via call or SMS for verification
     - Number cannot be on WhatsApp personal app simultaneously
  5. Display name approval:
     - Submit: "AutoVerse Dealer Support"
     - Meta review: 1–3 business days
     - Reject reasons: trademarked names, misleading claims
  6. Message template approval:
     - Each template reviewed by Meta
     - Templates must follow template guidelines (no promotional language in utility templates)
     - Timeline: instant–24 hours per template

ACCOUNT TIERS (limits apply per tier):
  New WABA:
    - 250 conversations per 24 hours (business-initiated)
    - 1,000 unique users per day
  Tier 1 (after 1,000 conversations):
    - 1,000 business-initiated conversations per 24h
  Tier 2 (after 10,000):
    - 10,000 per 24h
  Tier 3 (after 100,000):
    - 100,000 per 24h
  Platform vs Per-Dealer:
    AutoVerse maintains a platform-level WABA for system messages
    Each dealer on Advanced tier gets their own sub-WABA via WABA API
```

### 7.2 Message Template Registration

```
TEMPLATE REGISTRATION VIA GRAPH API:
  POST https://graph.facebook.com/v19.0/{waba_id}/message_templates

TEMPLATE: lead_instant_reply (UTILITY category)
  {
    "name": "lead_instant_reply",
    "language": "en",
    "category": "UTILITY",
    "components": [
      {
        "type": "HEADER",
        "format": "IMAGE",
        "example": { "header_handle": ["{vehicle_photo_url}"] }
      },
      {
        "type": "BODY",
        "text": "Hi {{1}}! I'm {{2}} from {{3}}.\n\nThank you for your interest in our {{4}} {{5}} {{6}} at BDT {{7}}.\n\nView full listing with photos: {{8}}\n\nShall I arrange a viewing?",
        "example": {
          "body_text": [["Rafiq", "Salman", "Dhaka Auto", "2019", "Toyota", "Axio", "14,50,000", "https://autoverse.com.bd/cars/..."]]
        }
      },
      {
        "type": "FOOTER",
        "text": "Reply STOP to unsubscribe from messages"
      }
    ]
  }

TEMPLATE: lead_day1_followup (UTILITY)
  Body: "Hi {{1}}, still interested in the {{2}} {{3}}? It's still available. Any questions?"

TEMPLATE: lead_day3_testdrive (UTILITY)
  Body: "Hi {{1}}, I'd love to show you the {{2}} {{3}} in person. What day works for a test drive this week?"

TEMPLATE: lead_day7_expires (UTILITY)
  Body: "Hi {{1}}, heads up — we have another interested buyer for the {{2}} {{3}}. Let me know today to reserve it."

TEMPLATE: post_sale_day3 (UTILITY)
  Body: "Hi {{1}}! How are you enjoying your new {{2}} {{3}}? Any questions, I'm here to help. 😊"

TEMPLATE: post_sale_day30 (UTILITY)
  Body: "Hi {{1}}, your first service is coming up soon for your {{2}}. Book here: {{3}}"

TEMPLATE: inventory_alert (UTILITY)
  Body: "New arrival matching your interest: {{1}} {{2}} {{3}} — BDT {{4}}.\n\n{{5}} photos available.\nView here: {{6}}"

TEMPLATE: away_message (UTILITY)
  Body: "Hi! We're currently closed. Our hours are {{1}}.\nWe'll respond first thing when we open.\nFor urgent enquiries: {{2}}"

TEMPLATE: abandoned_lead (UTILITY)
  Body: "Hi {{1}}, following up on the {{2}} {{3}} you enquired about. Still available{{4}}."
  Note: {{4}} = optional price note ("— and we've just reduced the price to BDT X")

BANGLA TEMPLATES (separate registration, language: "bn"):
  Same templates translated to Bangla
  Bangla templates used when: lead's phone in BD AND dealer language_pref = 'bn'
```

### 7.3 Sending Messages via Graph API

```typescript
async sendTemplate(
  recipientPhone: string,
  templateName: string,
  variables: string[],
  mediaUrl?: string,
): Promise<WabaResult> {

  // Normalize phone to international format
  const phone = normalizeToE164(recipientPhone); // → "8801711234567"

  const components: any[] = [
    {
      type: 'body',
      parameters: variables.map(v => ({ type: 'text', text: v }))
    }
  ];

  if (mediaUrl) {
    components.unshift({
      type: 'header',
      parameters: [{ type: 'image', image: { link: mediaUrl } }]
    });
  }

  const response = await axios.post(
    `https://graph.facebook.com/v19.0/${this.config.get('WHATSAPP_PHONE_NUMBER_ID')}/messages`,
    {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components,
      }
    },
    {
      headers: {
        Authorization: `Bearer ${this.config.get('WHATSAPP_API_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  return {
    success: true,
    message_id: response.data.messages[0].id,
    wam_id: response.data.messages[0].id,
  };
}
```

### 7.4 Webhook Setup (Inbound Messages)

```
WEBHOOK REGISTRATION:
  POST https://graph.facebook.com/v19.0/{app_id}/subscriptions
  Fields: messages, message_deliveries, message_reads

WEBHOOK ENDPOINT: POST /api/v1/automation/whatsapp/webhook

VERIFICATION (Meta sends GET first):
  GET /api/v1/automation/whatsapp/webhook
    ?hub.mode=subscribe
    &hub.verify_token={WHATSAPP_WEBHOOK_VERIFY_TOKEN}
    &hub.challenge=XXXXXXXXX
  Response: return hub.challenge as plain text (200 OK)

SIGNATURE VERIFICATION (every inbound POST):
  signature = request.headers['x-hub-signature-256']
  expected = 'sha256=' + HMAC_SHA256(request.body_raw, WHATSAPP_APP_SECRET)
  IF signature !== expected: return 403

WEBHOOK PAYLOAD PROCESSING:
  Each message in webhook:
    {
      "object": "whatsapp_business_account",
      "entry": [{
        "id": "{waba_id}",
        "changes": [{
          "value": {
            "messaging_product": "whatsapp",
            "metadata": { "phone_number_id": "...", "display_phone_number": "..." },
            "contacts": [{ "profile": { "name": "Rafiq" }, "wa_id": "8801711234567" }],
            "messages": [{
              "id": "wamid.XXXXX",
              "from": "8801711234567",
              "type": "text",
              "text": { "body": "Hi, is the Axio available?" },
              "timestamp": "1705307400"
            }]
          }
        }]
      }]
    }

  PROCESSING:
    1. Extract sender phone, message text, timestamp
    2. Find matching lead by buyer_phone (within all active dealers)
    3. Log in lead_interaction (type = 'whatsapp_received')
    4. Update lead score: +15 (whatsapp_message_sent_by_buyer)
    5. Check if active automation sequence awaiting reply
       → If sequence step condition = 'no_inbound': cancel next scheduled step
    6. WebSocket: emit 'automation.sent' to dealer dashboard
    7. Push notification to assigned salesperson
```

### 7.5 Rate Limiting & Tier Management

```
META WABA RATE LIMITS:
  Business-initiated conversations (templates): 1,000/day (Tier 1)
  User-initiated conversations (replies): unlimited in 24h window
  Rate limit errors: HTTP 429 from Meta Graph API

  HANDLING 429:
    Retry-After header present → wait that duration
    No header → exponential backoff starting 60s
    BullMQ: job goes back to queue with computed delay

PLATFORM-LEVEL RATE TRACKING:
  Redis: rate:waba:{dealerId}:{YYYYMMDD}
  Check before each send
  Alert at 80% (800/1,000)
  Block at 100% (1,000/1,000) until midnight reset
  Queued-but-blocked messages: reschedule to next day 09:00 AM

MESSAGE WINDOW:
  Meta allows template messages anytime (business-initiated)
  After user replies: 24-hour "user-initiated" window opens
  Within this window: free-form messages allowed (no template required)
  AutoVerse usage: salespeople can send free-form within 24h window
    Implementation: track last_inbound_at per lead
    If NOW() - last_inbound_at < 24h: allow non-template message
    Else: require template
```

---

## 8. Facebook Graph API — Setup & Integration

### 8.1 App Configuration

```
APP TYPE: Business app (not Gaming or Consumer)
PERMISSIONS REQUIRED:
  pages_messaging              → Read/write FB Page inbox
  pages_manage_posts           → Create posts on FB Page
  pages_read_engagement        → Read post analytics
  leads_retrieval              → Download Lead Ad submissions
  catalog_management           → Manage product catalogs (vehicle inventory)
  instagram_basic              → Read Instagram account info
  instagram_content_publish    → Post to Instagram
  business_management          → Manage Business Manager

APP REVIEW:
  Most permissions require Meta's app review.
  Review timeline: 1–10 business days.
  Requires: clear use case description, screen recordings of integration, privacy policy URL.
  Special scrutiny: leads_retrieval (common for CRM tools — approved regularly)

SYSTEM USER TOKEN:
  Use platform-level system user (not individual dealer's personal token)
  Benefits:
    → Token doesn't expire when dealer staff changes Facebook passwords
    → Single token management for all dealers
    → Survives page admin changes
  Setup:
    Meta Business Manager → System Users → Create system user
    Grant: Business Admin role
    Generate token with all required permissions
    Token type: Never-expiring system user access token
  Store: FACEBOOK_SYSTEM_USER_TOKEN (encrypted, AES-256 at rest)
```

### 8.2 Page Inbox (Messenger) Integration

```
WEBHOOK REGISTRATION:
  App Settings → Webhooks → Page Subscriptions:
    messages
    messaging_postbacks
    messaging_referrals
    message_deliveries
    message_reads

ENDPOINT: POST /api/v1/automation/facebook/webhook

VERIFICATION: same pattern as WhatsApp webhook (hub.challenge echo)

SIGNATURE VERIFICATION:
  x-hub-signature-256 header → HMAC_SHA256 with META_APP_SECRET

INBOUND MESSAGE PROCESSING:
  1. Extract: sender_id (Facebook user ID), message text, page_id
  2. Find dealer by page_id → dealership_id
  3. Check if keyword trigger matches message text
  4. Send appropriate auto-reply if rule matches
  5. Create/update lead record
  6. Notify assigned salesperson

RATE LIMITING (Meta-imposed):
  No published hard limit for page messaging replies
  Soft limit: messages shouldn't appear spammy
  AutoVerse safeguard: max 3 automated replies per sender per hour
```

### 8.3 Lead Ads Webhook

```
WEBHOOK SUBSCRIPTION:
  Subscribe to leadgen field on Facebook App subscriptions

LEAD AD WEBHOOK PAYLOAD:
  {
    "object": "page",
    "entry": [{
      "id": "{page_id}",
      "time": 1705307400,
      "changes": [{
        "value": {
          "leadgen_id": "123456789",
          "page_id": "{page_id}",
          "form_id": "{lead_form_id}",
          "ad_id": "{ad_id}",
          "created_time": 1705307400
        },
        "field": "leadgen"
      }]
    }]
  }

  NOTE: Webhook only contains leadgen_id.
  Must make separate API call to get lead data.

LEAD RETRIEVAL:
  GET https://graph.facebook.com/v19.0/{leadgen_id}
    ?fields=id,created_time,field_data,form_id,ad_id
    &access_token={system_user_token}

  Response:
    {
      "id": "123456789",
      "created_time": "2025-01-15T10:30:00+0000",
      "field_data": [
        { "name": "full_name", "values": ["Rafiq Hossain"] },
        { "name": "phone_number", "values": ["+8801711234567"] },
        { "name": "email", "values": ["rafiq@example.com"] },
        { "name": "vehicle_model", "values": ["Toyota Axio"] },
        { "name": "budget", "values": ["1000000-2000000"] }
      ]
    }

FIELD MAPPING TO LEAD RECORD:
  full_name     → lead.buyer_name
  phone_number  → lead.buyer_phone (normalize to +8801XXXXXXXXX)
  email         → lead.buyer_email
  vehicle_model → lead.vehicle matching logic:
    fuzzy search vehicles WHERE make+model LIKE '%{vehicle_model}%'
    assign first matching vehicle to lead.vehicle_id
  budget        → parse range → lead.budget_min / lead.budget_max
    "1000000-2000000" → budget_min=1000000, budget_max=2000000

  lead.source = 'facebook_lead_ad'
  lead.fb_lead_form_id = form_id
  lead.fb_ad_id = ad_id

SLA: Lead available in Dealer CRM within 90 seconds of webhook receipt
     Measured: webhook_received_at → lead.created_at
     Monitor: if avg > 90s → investigate queue backlog
```

### 8.4 Facebook Catalog — Vehicle Inventory

```
CATALOG CREATION PER DEALER (on channel connection):
  POST https://graph.facebook.com/v19.0/{business_id}/owned_product_catalogs
  Body: {
    "name": "{dealer_name} — AutoVerse Vehicles",
    "vertical": "automotive"
  }
  Response: { "id": "{catalog_id}" }
  Store: dealer_website.fb_catalog_id

BATCH ITEM UPLOAD:
  POST https://graph.facebook.com/v19.0/{catalog_id}/items_batch
  Body: {
    "access_token": "{system_user_token}",
    "item_type": "VEHICLE",
    "requests": [
      {
        "method": "CREATE",
        "retailer_id": "{vehicle_id}",
        "data": {
          "availability": "in stock",
          "condition": "used",
          "title": "2019 Toyota Axio — Used Car in Dhaka",
          "description": "...",
          "url": "https://dealer.autoverse.com.bd/{slug}/cars/{vehicle_slug}",
          "image_url": "{primary_photo_url}",
          "price": "1450000 BDT",
          "brand": "Toyota",
          "make": "Toyota",
          "model": "Axio",
          "year": "2019",
          "mileage": { "value": "45000", "unit": "KM" },
          "body_style": "sedan",
          "drivetrain": "fwd",
          "fuel_type": "gasoline",
          "transmission": "automatic",
          "trim": "G Grade",
          "vin": "{vin}",
          "exterior_color": "White"
        }
      }
    ]
  }

OPERATIONS:
  CREATE: new vehicle added to inventory
  UPDATE: same as CREATE but with method: "UPDATE"
  DELETE: { "method": "DELETE", "retailer_id": "{vehicle_id}" }

BATCH SIZE: up to 5,000 items per request
FULL SYNC: every 6 hours (BullMQ feed-worker cron)
INSTANT SYNC: on individual vehicle change (price, status, photos)

PIXEL EVENTS (for DVA — Dynamic Vehicle Ads):
  Injected into dealer website and marketplace listing pages:

  ViewContent event (on listing page view):
    fbq('track', 'ViewContent', {
      content_ids: ['{listing_id}'],
      content_type: 'vehicle',
      value: {asking_price},
      currency: 'BDT'
    });

  Lead event (on enquiry form submission):
    fbq('track', 'Lead', {
      content_category: 'vehicle',
      content_ids: ['{listing_id}'],
      value: {asking_price},
      currency: 'BDT'
    });
```

---

## 9. Resend Email — Setup & BD Routing

### 9.1 Account & Domain Setup

```
PROVIDER: Resend (resend.com)
WHY RESEND: Best-in-class deliverability, React Email support, simple API
            Better BD routing than alternatives

DOMAIN SETUP:
  Primary sending domain: @mail.autoverse.com.bd
  DNS records required (add to Cloudflare):
    SPF:   TXT record → include Resend's SPF
    DKIM:  CNAME records (Resend provides 3 keys)
    DMARC: TXT record → p=quarantine
  Verification: Resend dashboard → Domain verification (auto-checks DNS)
  Timeline: 5–30 minutes after DNS propagation

SUB-DOMAIN PER DEALER:
  Format: {dealer-slug}@mail.autoverse.com.bd
  When dealer sends emails through sequences:
    From: "Dhaka Auto House via AutoVerse" <dhaka-auto@mail.autoverse.com.bd>
    Reply-To: dealer's actual email (if configured)
  Why sub-addresses: separates reputation per dealer
    If one dealer spams: only their sub-address affected, not whole domain

CUSTOM DOMAIN (Enterprise plan):
  Dealer can use their own domain: @dealercompany.com.bd
  Requires: dealer adds Resend DNS records to their domain
  AutoVerse provisions sending on their domain via Resend API
  Only available Enterprise plan (setup requires manual verification)
```

### 9.2 Email Template System (React Email)

```
TEMPLATE FRAMEWORK: React Email (react.email)
  TypeScript components, preview in browser during development
  Compiled to HTML string for Resend API payload
  Stored in: /apps/api/src/notifications/email/templates/

TEMPLATE STRUCTURE:
  Each template = React component with typed props
  Common components: EmailLayout, EmailHeader, VehicleCard, CTAButton

TEMPLATE LIBRARY:

1. LeadEnquiryConfirmation.tsx
   Props: { leadData, vehicleData, dealerData }
   Sections:
     Header: AutoVerse logo + dealer name
     Body: "Thanks for your enquiry about the 2019 Toyota Axio"
     Vehicle card: photo + title + price + deal rating badge
     WhatsApp CTA button (primary, green)
     2 Similar vehicles (from same dealer)
     Footer: unsubscribe link + dealer address

2. FinanceOptions.tsx (Day 2 of lead sequence)
   Props: { leadData, vehicleData, emiOptions }
   Sections:
     EMI calculator results: 3 loan term options
     Finance process steps
     WhatsApp CTA

3. ExpiringOffer.tsx (Day 5)
   Props: { leadData, vehicleData, similarVehicles }
   Sections:
     Subject line: "Your enquiry on the [Axio] — a few days left"
     Urgency message + current price + deal rating
     Alternative vehicles if this one sold
     WhatsApp CTA

4. DeliveryConfirmation.tsx (Post-sale Day 1)
   Props: { dealData, vehicleData, customerData }
   Sections:
     "Congratulations on your new [vehicle]!"
     Vehicle details summary
     Care guide PDF attachment (linked)
     First service reminder date
     Dealer contact for questions

5. ServiceReminder.tsx (Post-sale Day 30, Day 365)
   Props: { customerData, vehicleData, serviceType }
   Sections:
     "Time for your [first/annual] service"
     Service checklist
     Workshop link / booking CTA

6. WinBackEmail.tsx
   Props: { leadData, newInventory: VehicleData[] }
   Sections:
     "Still looking for a car?"
     New arrivals matching their previous interest
     Price trend note if market has changed

7. InvoiceEmail.tsx
   Props: { invoiceData, dealerData, pdfUrl }
   Sections:
     Invoice summary
     Line items table
     Total amount
     Download PDF button
     Payment method reminder

RENDERING & SENDING:
  const html = render(<LeadEnquiryConfirmation {...props} />);
  await resend.emails.send({
    from: `${dealer.business_name} <${dealer.slug}@mail.autoverse.com.bd>`,
    to: lead.buyer_email,
    subject: `Your enquiry about the ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    html,
    attachments: pdfUrl ? [{ url: pdfUrl, filename: 'invoice.pdf' }] : [],
    tags: [
      { name: 'dealer_id', value: dealer.id },
      { name: 'template', value: 'lead_enquiry_confirmation' },
      { name: 'lead_id', value: lead.id },
    ]
  });
```

### 9.3 BD-Specific Email Routing Rules

```
EMAIL AS SECONDARY CHANNEL (BD reality):
  BD email open rates: ~12–18% (low vs WhatsApp ~85%)
  Email used for: formal documents, receipts, sequences where no WhatsApp exists
  Email NEVER used as: primary notification channel (SMS/WhatsApp always first)

ROUTING RULES:
  SEND EMAIL if:
    lead.buyer_email IS NOT NULL
    AND customer.opted_in_email = true
    AND template is appropriate for email (transactional, not marketing)

  SKIP EMAIL and use SMS if:
    No email address (> 60% of BD leads don't provide email)
    opted_in_email = false
    Message is time-critical (use SMS instead)

  EMAIL PRIORITY ORDER:
    1. WhatsApp (if phone available + opted in)
    2. SMS (if phone available + opted in)
    3. Email (if email available + opted in)
    4. In-app notification only (fallback)

UNSUBSCRIBE HANDLING:
  Resend handles unsubscribes via:
    a. One-click unsubscribe header (List-Unsubscribe)
    b. Unsubscribe link in email footer (required by Resend ToS)
  Resend webhook: 'email.complained' or 'contact.unsubscribed'
    → SET customer.opted_in_email = false
    → Remove from all active email sequences
    → Log in automation_log

BOUNCE HANDLING:
  Hard bounce (Resend webhook 'email.bounced'):
    → SET customer.email = null (mark invalid)
    → Log event
    → Switch to SMS for future communications
  Soft bounce: Resend retries internally (not our concern)

RESEND RATE LIMITS:
  Free tier: 3,000 emails/month, 100/day
  Pro tier ($20/mo): 50,000/month, no daily limit
  Start with Pro at launch (AutoVerse as a business)
```

---

## 10. Dealer Acquisition GTM

### 10.1 Target Market Profile

```
PRIMARY TARGET: Used car dealers in Dhaka's Dholaikhal area
  WHY DHOLAIKHAL FIRST:
    - Largest concentration of used car dealers in Bangladesh
    - 200–300+ dealers within 2km radius
    - Dealers know each other (word-of-mouth spreads fast in tight community)
    - Located at: Dholaikhal, Old Dhaka (near Buriganga river)
    - Dealer profile: BDT 50L–5 crore annual revenue, 10–50 cars at any time
    - Pain level: HIGH (all using WhatsApp/paper — maximum pain, maximum willingness)

SECONDARY TARGETS (Month 2–4):
  Tejgaon used car market (Dhaka)
  Mirpur used car area (Dhaka)
  Chattogram: Agrabad and Nasirabad car markets
  Sylhet: major dealer strip on Airport Road

DEALER PROFILE BY SIZE:
  Small (target for Free/Starter):
    5–20 cars in inventory
    1–2 staff
    Revenue: BDT 20–60L/month
    Pain: primarily lead management + pricing intelligence

  Mid-size (target for Professional):
    20–80 cars
    3–5 staff including a manager
    Revenue: BDT 60L–2 crore/month
    Pain: staff accountability + inventory visibility + automation

  Large (target for Business):
    80–200+ cars
    Multiple staff + accountant
    Revenue: BDT 2–8 crore/month
    Pain: cross-location visibility + analytics + enterprise features
```

### 10.2 Ground Sales Strategy (Dholaikhal)

```
PHASE 1: AWARENESS (Weeks 1–2, before launch)
  Objective: Make AutoVerse name known in Dholaikhal before door-to-door starts.

  TACTICS:
    A. Physical presence: Rent desk space or chai shop corner near Dholaikhal entrance
       1 BD Sales Rep stationed daily (9 AM–6 PM)
       Branded: AutoVerse polo shirt, printed cards with QR code to landing page
       Approach: casual conversation ("কোন অ্যাপ ব্যবহার করেন গাড়ির জন্য?")

    B. Peer introduction:
       Identify 2–3 respected, well-connected dealers FIRST
       Offer them: "Be the first in Dholaikhal to use AutoVerse.
                    We'll set it up for you free for 3 months."
       These become: reference customers for door-to-door

    C. Facebook Group presence:
       BD automotive Facebook groups: "Car Selling BD", "Car Buyers Bangladesh"
       Share: price comparison posts (IMV data) — provide value before asking for anything
       Post 3× per week with market insights (not product ads)

PHASE 2: ACTIVATION (Weeks 3–8)
  Objective: Onboard 50 dealers. Get 20 to first value moment.

  DOOR-TO-DOOR SCRIPT (in Bangla, key points in English here):

  Opening (at dealer's showroom):
    "আপনার ব্যবসার জন্য কি কোনো সফটওয়্যার ব্যবহার করেন?"
    Most answer: "WhatsApp and notebook"
    Lead-in: "আমরা একটা নতুন প্ল্যাটফর্ম বানিয়েছি..."

  Demo (on phone, max 5 minutes):
    Show: their car listed on AutoVerse marketplace (pre-seeded demo listing)
    Show: deal rating badge ("এটা দেখুন — বাজার দামের চেয়ে ৪৫,০০০ কম")
    Show: lead coming in on phone ("এভাবেই লিড আসে — সরাসরি আপনার WhatsApp-এ")
    Show: profit calculator ("এই গাড়িতে কত লাভ তা এখানেই দেখতে পারবেন")

  Close (use one of these framings):
    Free framing: "১০টা গাড়ি পর্যন্ত সম্পূর্ণ ফ্রি। কোনো ক্রেডিট কার্ড লাগবে না।
                    এখনই সেটআপ করি?"
    FOMO framing: "আপনার পাশের [reference dealer name] এটা ইতিমধ্যে চালু করেছেন।
                   Dholaikhal-এ প্রথম ২০ জনের একজন হন।"
    ROI framing:  "আপনি মাসে ১০টা গাড়ি বিক্রি করলে, মাত্র একটা অতিরিক্ত বিক্রিই
                   এই সফটওয়্যারের খরচ উঠিয়ে দেবে।"

  Objection handlers:
    "সময় নেই" → "আমি এখনই সেটআপ করে দিচ্ছি — ১০ মিনিট লাগবে"
    "দাম বেশি" → "প্রথম মাস ফ্রি। তারপর যদি কাজে না আসে, বন্ধ করে দেন।"
    "IT বুঝি না" → "আপনার স্টাফ বুঝলেই হবে। আমরা ট্রেনিং দেবো।"
    "আগেও try করেছি, কাজ হয়নি" → "কোন প্ল্যাটফর্ম? [listen] আমাদেরটা আলাদা কারণ..."

  ON-SITE ONBOARDING:
    Rep uses sales rep's phone to start onboarding with dealer
    Takes 5–10 minutes: logo upload, first vehicle (VIN scan)
    Dealer sees vehicle live on marketplace before rep leaves
    This is the ACTIVATION moment — must happen on first visit

PHASE 3: REFERRAL ACTIVATION (Month 2+)
  Objective: Each dealer brings in 1–2 peers.

  REFERRAL MECHANICS:
    Active dealer refers another dealer → both get: 1 month free (applies to paid plans)
    Referral tracked: unique referral code per dealer in app
    Sales rep commission: BDT 500 per referred dealer who activates paid plan

  COMMUNITY BUILDING:
    WhatsApp group: "AutoVerse Dholaikhal Dealers" (invite-only)
    Content: market insights, pricing data, feature announcements
    Moderated by AutoVerse rep (not a sales channel — a value channel)
    Monthly: in-person meetup (chai + data presentation on BD car market trends)
```

### 10.3 Facebook Advertising Strategy

```
CAMPAIGN OBJECTIVE: Lead generation (Facebook Lead Ads)
TARGET AUDIENCE SPEC:

  AUDIENCE 1: Dealer owners (primary)
    Location: Bangladesh (all districts initially, focus Dhaka later)
    Job titles (FB behavioral): "Car Dealer", "Auto Dealer", "Used Car Business"
    Interests: car dealing, automotive industry, small business
    Behaviors: small business owners, Facebook Page admins
    Custom audience: lookalike from existing dealer phone list (upload after 50+ dealers)
    Estimated size: 50,000–200,000 (broad but targeted)

  AUDIENCE 2: Retargeting (website visitors)
    People who visited autoverse.com.bd in last 30 days
    AND did NOT complete registration
    → Show: testimonial ads from Dholaikhal dealers
    Budget: 20% of total ad budget

  AUDIENCE 3: Competitor targeting
    People interested in: Bikroy, OLX, used car selling
    AND are small business owners
    → Show: comparison ad ("Why AutoVerse beats Bikroy for dealers")

AD CREATIVE SPEC:
  Format: Video (15 sec) + Lead form
  Video script (15 seconds):
    0–3s: Problem hook — WhatsApp screenshot chaos (recognizable)
    3–8s: Solution — AutoVerse demo on phone (VIN scan, lead coming in)
    8–12s: Proof — "Used by 200+ dealers in Dhaka" (once achieved)
    12–15s: CTA — "ফ্রিতে শুরু করুন আজই"

  Lead form fields (3 fields only — more = abandonment):
    Name | Phone number | Business district
  Lead form headline: "AutoVerse-এ আপনার গাড়ির ব্যবসা ডিজিটাল করুন"
  Privacy policy: required (use autoverse.com.bd/privacy)

BUDGET ALLOCATION:
  Launch (Months 1–2): BDT 20,000/month (~USD 180)
  Growth (Months 3–6): BDT 50,000/month if CPL < BDT 500
  Scale (Month 7+): increase if CAC < BDT 5,000

KEY METRICS TO TRACK:
  CPL (cost per lead): target < BDT 300
  Lead-to-registration rate: target > 30%
  Registration-to-active rate: target > 60% (first vehicle listed within 7 days)
  CAC (incl. ground sales): target < BDT 5,000

FACEBOOK AD FUNNEL:
  Lead Ad → FB Lead form submitted → Auto-enroll in onboarding SMS sequence:
    Immediate: "আপনার AutoVerse অ্যাকাউন্ট তৈরি করুন: [signup link]"
    Day 1 (no signup): "মাত্র ৩ মিনিটে আপনার প্রথম গাড়ি লিস্ট করুন: [link]"
    Day 3 (no signup): "আজকে Dholaikhal-এ ৫০জন ডিলার ব্যবহার করছেন AutoVerse..."
    Day 7 (no signup): last attempt — offer personal demo call
```

### 10.4 Free Trial Model

```
FREE PLAN DESIGN (permanent, not time-limited trial):
  PHILOSOPHY: Free plan creates marketplace supply (solves cold-start)
              AND converts paying dealers who hit limits.
  LIMITS (designed to be hit within 30–60 days):
    10 active listings (most dealers have 15–30 cars)
    1 staff seat (dealers with even 1 salesperson need 2)
    No Maestro AI (withholds the most valuable differentiator)
    No automation (withholds the biggest pain reliever)
    Per-lead charging (expensive at scale vs subscription)

CONVERSION TRIGGERS:
  Listing limit hit: in-app banner:
    "You've reached your 10-listing limit. Upgrade to Starter for 50 listings."
    Upgrade CTA shown on every inventory add attempt

  Staff seat limit: when adding second salesperson:
    "Add team members with Starter plan (BDT 2,999/month)"

  Per-lead bill: when monthly lead charges exceed BDT 2,000:
    "You're spending BDT 2,000/month on leads. Starter plan (BDT 2,999/month)
    includes unlimited marketplace leads + CRM + automation."

  Maestro insight teaser: free plan sees ONE insight per week (blurred after first):
    "Upgrade to see all 5 Maestro insights and price your inventory optimally."

TARGET: 25–35% of free dealers convert to paid within 60 days
        Based on: value delivered (first lead) + limit hits + insight teasers

ONBOARDING SEQUENCE (free → paid nurture, automated):
  Day 3 post-registration: "Your first listing is live on AutoVerse marketplace"
  Day 7 (if no lead received): "Optimize your listing for more enquiries: [tips]"
  Day 14 (if lead received): "You've received [N] leads! Upgrade to track them better."
  Day 30 (if still free): "30-day summary: [N] listing views, [N] enquiries. Unlock full CRM:"
  Day 45 (if still free): "Other dealers in Dholaikhal are getting [X]% more leads on Starter."
  Day 60 (if still free): Final free upgrade offer: first month Starter at 50% off (BDT 1,499)
    This offer is valid for 7 days and creates urgency.
```

---

## 11. Marketplace Growth Playbook

### 11.1 Cold-Start Problem Resolution

```
THE PROBLEM:
  Buyers need listings to come.
  Listings need buyers to matter.
  AutoVerse starts with 0 of both.

SOLUTION: Sequence matters. Listings first, buyers second.

PHASE 1 — SUPPLY BUILD (Months 1–3): Target 500+ active listings
  Action A: Free plan dealers publish all inventory
    Each dealer averages 20 cars → 25 dealers = 500 listings
    25 dealers achievable from Dholaikhal alone
    This is the minimum viable supply threshold for buyer acquisition to start

  Action B: Retroactive listing migration
    Sales rep helps dealers list their ENTIRE current inventory on Day 1
    Offer: "Our rep will add all your cars to AutoVerse for you in 1 hour"
    Outcome: dealer activated + full inventory live (vs trickling in 1 car at a time)

  Action C: C2C seeding (zero cost listings for 6 months)
    Post in BD car Facebook groups: "Free car listing on new platform"
    Target: 200 C2C listings within 60 days
    C2C sellers: motivated (they're already trying to sell on Bikroy)
    Each C2C listing: potential buyer comes → platform grows

PHASE 2 — BUYER ACQUISITION (Month 2+, once 300+ listings live)
  Action A: Programmatic SEO (see Section 11.2)
  Action B: Facebook ads targeting car buyers in BD (separate from dealer acquisition campaign)
    Audience: "Interested in buying a used car", location = BD
    Ad: "Find the best price for any used car. AutoVerse shows you market value instantly."
    Landing: /cars/toyota/axio/dhaka (specific, high-intent page)
  Action C: IMV deal rating as the hook
    Every piece of buyer-facing content: "This car is BDT 45,000 below market average"
    This is differentiated vs Bikroy (which shows zero price intelligence)
    The deal rating is the reason buyers will prefer AutoVerse

PHASE 3 — NETWORK EFFECTS (Month 4+)
  Every dealer enquiry from marketplace → salesperson calls dealer → upgrade pitch
  "You got 12 enquiries last month from AutoVerse — upgrade to see full buyer profiles"
  Every buyer who enquires → subscribes to price drop alerts → returns repeatedly
  More dealers → more listings → more buyers → more dealer upsells
```

### 11.2 Programmatic SEO Strategy

```
OBJECTIVE: Capture high-intent Google search traffic for specific car models.
           SEO is long-term (3–6 months to rank) but near-zero marginal cost.

TARGET QUERIES:
  "toyota axio price in bangladesh 2025"      → /trends/toyota/axio
  "used toyota axio for sale dhaka"           → /cars/toyota/axio/dhaka
  "honda fit price bangladesh"                → /trends/honda/fit
  "reconditioned car price dhaka"             → /cars/dhaka
  "suzuki alto second hand price bangladesh"  → /trends/suzuki/alto
  Volume per query: 500–5,000 searches/month each (BD Google data)

PAGE TYPES TO GENERATE (programmatically at scale):

  TYPE 1: /cars/[make]/[model] — Make/model browse pages
    Content: All active listings for this make/model nationally
    + IMV price range for this model
    + Price trend chart (last 6 months)
    + "What to look for when buying a [model]" (static content, per model)
    Count at 200 dealers: ~500 unique make/model combos = 500 pages
    Rendering: SSG (pre-built at deploy) + ISR revalidate on new listings

  TYPE 2: /cars/[district] — District browse pages
    Content: All active listings in this district
    + Most popular makes in this district
    + Average price range for this district
    Count: 64 BD districts = 64 pages (start with 10 major cities)
    Rendering: SSG

  TYPE 3: /cars/[make]/[model]/[district] — Model + district intersection
    Example: /cars/toyota/axio/dhaka
    Content: Toyota Axio listings in Dhaka + Dhaka-specific IMV
    This is the highest-intent page type
    Count: 500 models × 10 districts = 5,000 pages
    Rendering: SSG (generate top 1,000 combos; fallback ISR for others)

  TYPE 4: /trends/[make]/[model] — Price trend pages
    Content: Historical price chart + current IMV + market commentary
    Example: "Toyota Axio prices in Bangladesh increased 8% in December 2024"
    Target query: "toyota axio price bangladesh 2025"
    Count: matches Type 1 (500 pages)
    Rendering: ISR (revalidate daily — price data changes)

  TYPE 5: /research/[article-slug] — Expert articles & guides
    Content: "How to buy a used car in Bangladesh"
              "What documents do you need when buying a used car in BD"
              "Toyota Axio vs Honda Fit — which is better for BD roads"
    Target: research-phase buyer queries
    Count: 50–100 articles (manual creation, high quality)
    Rendering: ISR

SEO TECHNICAL REQUIREMENTS:
  Schema.org markup:
    /cars pages: ItemList schema (list of vehicles)
    /cars/[vehicle-slug]: Vehicle schema (individual listing)
    /trends pages: Dataset schema (price data)
    /research pages: Article schema

  Canonical URLs: avoid duplicate content from filter combinations
    /cars/toyota/axio?district=dhaka → canonical: /cars/toyota/axio/dhaka

  Hreflang: en (primary) + bn (when Bangla version available)

  Sitemap submission:
    One sitemap per category (< 50,000 URLs each per Google limit)
    sitemaps/listings.xml | sitemaps/makes.xml | sitemaps/districts.xml | sitemaps/trends.xml
    Each revalidated daily → auto-submitted to GSC

  Core Web Vitals targets:
    LCP (Largest Contentful Paint): < 2.5s (SSG pages fast by default)
    CLS (Cumulative Layout Shift): < 0.1 (skeleton screens prevent CLS)
    FID (First Input Delay): < 100ms

EXPECTED SEO TRAFFIC TIMELINE:
  Month 1–2: pages indexed, minimal traffic (new domain)
  Month 3–4: 500–2,000 organic visits/month
  Month 6: 5,000–15,000 organic visits/month (if 500+ listings published)
  Month 12: 30,000–80,000 organic visits/month (at 2,000+ listings)
```

### 11.3 C2C Seeding Strategy

```
PHASE 1: Zero-cost listings (Month 1–6)
  Free C2C listings remove payment friction → more supply
  TACTICS:
    Facebook Group posts: post in top 10 BD car groups
      "Free গাড়ি বিক্রির বিজ্ঞাপন — AutoVerse-এ পোস্ট করুন, ক্রেতা আসবে।
       🔗 [list your car link]"
      Post 3× per week (different groups on rotation to avoid spam flags)

    Bikroy seller retargeting:
      People already listing on Bikroy = motivated sellers
      Cross-list offer: "Already on Bikroy? Add AutoVerse for free — double your reach."
      Target via Facebook ads: Bikroy custom audience + manual outreach

    Ground sales spillover: when visiting dealers, also ask about personal cars
      "আপনার কি কোনো নিজের গাড়ি বিক্রি করতে চান?"

  TARGET: 200 C2C listings in Month 1–2
  QUALITY CONTROL: moderation queue ensures quality (no junk listings)

PHASE 2: Freemium C2C (Month 7+)
  Free listing: 1 listing at a time, 30 days
  Paid: BDT 199 for additional/extended listings
  Premium: BDT 499 for featured listing (appears in search_top)
  First renewal: free (encourage reactivation of stale listings)
  Subsequent renewals: BDT 99 (creates small but recurring revenue stream)

C2C SELLER LIFECYCLE:
  Lists car → gets enquiries → sells car → returns next year with another car
  Post-sale email: "Congratulations on selling your car! Need a new one? Browse dealers →"
  Annual retention: remind past sellers when 1 year has passed
    "Is it time to upgrade your car? List your current one on AutoVerse →"
```

### 11.4 Scaling from 0 to 100K+ Listings

```
MILESTONE: 1,000 listings (Month 1–2)
  Source: 50 dealers × 20 cars avg
  Quality: all dealer listings (auto-synced, maintained)
  Buyer experience: usable, some categories sparse

MILESTONE: 5,000 listings (Month 3–4)
  Source: 200 dealers + 500 C2C listings
  Quality: IMV ratings meaningful (enough data per cluster)
  Buyer experience: good variety in Dhaka; sparse outside

MILESTONE: 20,000 listings (Month 6)
  Source: 500 dealers + 2,000 C2C
  Geography: Dhaka well-covered; Chittagong + Sylhet starting
  SEO: programmatic pages starting to rank
  IMV: reliable ratings for 80% of Toyota/Honda/Nissan makes

MILESTONE: 50,000 listings (Month 9–12)
  Source: 1,000 dealers + 5,000 C2C
  Geography: all major cities
  IMV: high-confidence ratings for top 20 makes
  Search: 10,000+ organic visits/month
  Feature: price trend charts meaningful (6+ months of data)

MILESTONE: 100,000 listings (Month 18–24)
  Source: 2,000+ dealers + C2C at scale
  Geography: national coverage (all 64 districts represented)
  IMV: comprehensive coverage; Phase 2 transaction data augmentation possible
  Revenue: marketplace GMV measurable (leads → deals trackable)
```

---

## 12. Full Monetization Model with BD Price Sensitivity

### 12.1 BD Price Context

```
MARKET BENCHMARKS (what dealers currently spend):
  Bikroy Pro listing: BDT 500–3,000 per listing per month
  Facebook ad boost per post: BDT 500–2,000 per boost
  Total monthly untracked spend: BDT 3,000–10,000 for active dealers
  WhatsApp Business (free) but staff time cost: ~BDT 5,000/month
  Paper/notebook inventory: free but 3–5 deals lost/month = BDT 50,000+

AUTOVERSE FRAMING:
  Starter (BDT 2,999): less than one Facebook boost per day
  Professional (BDT 5,999): less than what you spend on Bikroy listings alone
  Business (BDT 9,999): less than 1 hour of your showroom rent
  ROI frame: one extra deal per month (BDT 30,000+ GP) pays for any plan tier

PSYCHOLOGICAL PRICING ANCHORS (BD market):
  BDT 3,000/month:  perceived as "affordable subscription" (3,000 taka = 10 cups of chai/day)
  BDT 6,000/month:  "investment" — requires ROI justification
  BDT 10,000/month: "serious business tool" — needs CFO-equivalent sign-off
  BDT 30,000+/month: enterprise conversation only

PAYMENT TIMING PSYCHOLOGY:
  Monthly upfront billing: preferred over annual (BD cash flow is monthly)
  Annual plan discount: 2 months free (not % discount — "get 2 months free" is clearer)
  Annual plan conversion: Phase 2 (after dealers see value for 3+ months)
```

### 12.2 Unit Economics Per Plan Tier

```
FREE PLAN:
  Revenue:                BDT 0 (subscription)
  Per-lead revenue:       BDT 0–3,000/month (if qualified leads generated)
  Infrastructure cost:    BDT 250–400/month per dealer
  Support cost:           BDT 100 (minimal — mostly self-serve)
  Net unit margin:        BDT -350 to +2,500 (variable)
  Strategic value:        Marketplace supply + conversion funnel
  Conversion target:      25–35% upgrade within 60 days
  Break-even:             Converts to any paid plan → immediately profitable

STARTER (BDT 2,999/month):
  Revenue:                BDT 2,999
  Infrastructure:         ~BDT 400 (moderate sync + notification volume)
  Support:                ~BDT 300 (WhatsApp support, ~30 min/month avg)
  Platform overhead:      ~BDT 100 (SMS credits, storage)
  Total cost:             ~BDT 800
  Gross profit:           ~BDT 2,199 (73%)
  LTV (18-month avg):     BDT 53,982
  CAC target:             < BDT 5,000 → LTV:CAC = 10.8:1 ✅

PROFESSIONAL (BDT 5,999/month):
  Revenue:                BDT 5,999
  Infrastructure:         ~BDT 700 (GMC sync, FB catalog, automation volume)
  Support:                ~BDT 500 (WhatsApp + occasional call)
  Platform overhead:      ~BDT 200 (higher SMS quota)
  Total cost:             ~BDT 1,400
  Gross profit:           ~BDT 4,599 (77%)
  LTV (19-month avg):     BDT 1,13,981
  CAC target:             < BDT 8,000 → LTV:CAC = 14.2:1 ✅

BUSINESS (BDT 9,999/month):
  Revenue:                BDT 9,999
  Infrastructure:         ~BDT 1,200 (high volume, multi-location)
  Support:                ~BDT 1,000 (dedicated rep allocation ~2h/month)
  Platform overhead:      ~BDT 300 (high SMS quota, custom domain management)
  Total cost:             ~BDT 2,500
  Gross profit:           ~BDT 7,499 (75%)
  LTV (20-month avg):     BDT 1,99,980
  CAC target:             < BDT 15,000 → LTV:CAC = 13.3:1 ✅

ENTERPRISE (custom):
  Average deal:           BDT 20,000–50,000/month
  Cost:                   ~BDT 5,000–10,000/month (heavy support, custom features)
  Gross margin:           60–75%
  Deal cycle:             3–8 weeks (vs 1 day for SMB plans)
  Target customers:       National chains, large multi-location groups
```

### 12.3 Additional Revenue Streams — Unit Economics

```
PER-LEAD CHARGES (Free plan dealers):
  Avg qualified leads per free dealer per month: 5–10
  Avg charge per lead: BDT 150–300
  Monthly revenue per free dealer: BDT 750–3,000
  Infrastructure cost per lead: ~BDT 20 (notification + sync overhead)
  Gross margin: ~85%
  Upsell timing: when monthly charges > BDT 2,000 → pitch Starter

C2C LISTING FEES:
  Fee: BDT 199 per 30-day listing
  Volume target by Month 12: 500 active C2C listings
  New listings per month (30-day cycle): 200–300
  Monthly revenue: BDT 39,800–59,700
  Cost per listing: BDT 20 (moderation time: ~2 minutes at BDT 600/hour)
  Gross margin: ~90%
  Renewal revenue: BDT 99 per renewal × 40% renewal rate = additional BDT 8,000–12,000/month

FEATURED LISTING BOOSTS:
  Avg price per boost: BDT 1,000
  Volume target Month 12: 50–100 active boosted listings
  Monthly revenue: BDT 50,000–100,000
  Cost: ~BDT 20 per boost (admin time to process + slot management)
  Gross margin: ~98%

VALUATION REPORTS:
  Price: BDT 149 per report
  Volume target Month 12: 200–400 reports/month
  Monthly revenue: BDT 29,800–59,600
  Cost: ~BDT 5 (PDF generation, storage, delivery)
  Gross margin: ~97%

OEM ADVERTISING (Phase 3, Month 10+):
  Toyota, Honda, Suzuki BD importers — CPM advertising on marketplace
  CPM rate: BDT 200–500 per 1,000 impressions (BD automotive premium)
  At 100,000 monthly page views: 50,000–100,000 daily impressions available
  Monthly potential: BDT 300,000–1,500,000 at scale
  Cost: ~BDT 50,000/month (dedicated account management)
  Gross margin: ~90% at scale
```

### 12.4 Revenue Projections (Subscription + Marketplace Combined)

```
MONTH-BY-MONTH PROJECTIONS:

Month 1:
  Free dealers: 20 | Paying: 0
  Subscription MRR: BDT 0
  Marketplace revenue: BDT 0
  Infrastructure cost: ~BDT 8,000 (fixed + variable)
  Net: -BDT 8,000 (investment phase)

Month 2:
  Free: 40 | Paying: 5 (all Starter)
  Subscription MRR: BDT 14,995
  Per-lead revenue: BDT 5,000 (free dealer leads)
  Total revenue: BDT 19,995
  Cost: ~BDT 12,000
  Net: +BDT 7,995 (first profitable month)

Month 3:
  Free: 80 | Paying: 10 (8 Starter, 2 Pro)
  Subscription MRR: BDT 35,990
  Marketplace revenue: BDT 15,000 (leads + C2C)
  Total: BDT 50,990
  Cost: ~BDT 20,000
  Net: +BDT 30,990

Month 6:
  Free: 150 | Paying: 30 (20S, 8P, 2B)
  Subscription MRR: BDT 1,11,980
  Marketplace revenue: BDT 40,000
  Total: BDT 1,51,980
  Cost: ~BDT 40,000
  Net: +BDT 1,11,980 (~74% margin)

Month 9:
  Free: 300 | Paying: 80 (45S, 25P, 10B)
  Subscription MRR: BDT 3,62,430
  Marketplace revenue: BDT 1,20,000 (boosts + C2C + leads)
  Total: BDT 4,82,430
  Cost: ~BDT 90,000
  Net: ~BDT 3,92,430 (~81% margin)

Month 12:
  Free: 500 | Paying: 200 (100S, 70P, 30B)
  Subscription MRR: BDT 10,19,800
  Marketplace revenue: BDT 3,00,000
  Total: BDT 13,19,800 (~BDT 13.2L/month)
  Cost: ~BDT 2,50,000 (infra + 3 staff + SMS credits + office)
  Net: ~BDT 10,69,800 (~81% margin)

Month 18:
  Paying: 500 | Mix: 200S, 200P, 100B
  Subscription MRR: BDT 29,98,000
  Marketplace revenue: BDT 8,00,000
  Total: BDT 37,98,000 (~BDT 38L/month)
  Cost: ~BDT 7,00,000 (scaled team + infra)
  Net: ~BDT 30,98,000 (~82% margin)

Month 24:
  Paying: 1,000 | Mix: 350S, 450P, 200B
  Subscription MRR: BDT 60,99,500
  Marketplace revenue: BDT 20,00,000
  Total: BDT 80,99,500 (~BDT 81L/month)
  ARR: ~BDT 9.7 crore (~USD 880,000)
  Cost: ~BDT 15,00,000 (10+ staff, scaled infra, marketing)
  Net: ~BDT 65,99,500 (~81% margin)
```

### 12.5 BD Price Sensitivity Analysis

```
WILLINGNESS-TO-PAY RESEARCH (BD automotive dealer segment):

PRICE ELASTICITY BY TIER:
  Free → Starter (BDT 2,999):
    Elasticity: LOW (price not the barrier — perceived value is)
    Real barrier: "Will my staff actually use this?"
    Solution: onboarding success → first lead in < 7 days = conversion

  Starter → Professional (BDT 5,999):
    Elasticity: MEDIUM
    Trigger: need Facebook Lead Ads OR GMC feeds
    "I spend BDT 8,000/month on Facebook ads anyway" — they see the value

  Professional → Business (BDT 9,999):
    Elasticity: HIGHER
    Needs: clear ROI evidence (3+ months of data showing revenue impact)
    Anchor: "You generated BDT 2.3L in gross profit from AutoVerse leads this month"

  Business → Enterprise (BDT 20,000+):
    Elasticity: LOW (larger dealers are price-insensitive if ROI clear)
    Needs: dedicated relationship, custom features, SLA

CHURN RISK ANALYSIS:
  HIGH churn risk:
    Dealer registered but never listed a vehicle (< 7 days)
    Action: immediate call from BD sales rep
  MEDIUM churn risk:
    Active for 2 months, no deal closed through platform
    Action: Maestro insight + sales rep check-in
  LOW churn risk:
    At least 1 deal attributable to AutoVerse leads in first 30 days
    This is the "activated" state — activated dealers churn < 5%/month

PRICE INCREASE TOLERANCE:
  Established dealers (6+ months): can absorb 20–30% annual increase
  New dealers: price-sensitive, must prove value first
  Pricing strategy: lock price for 12 months, increase at renewal with clear value communication

MONTHLY VS ANNUAL:
  BD dealers prefer monthly (cash flow predictability)
  Annual plan: offer 2-month discount (10 months price for 12)
  Annual push: after dealer has been active 3+ months (proven value)
  Annual revenue benefit: eliminates monthly churn risk (~40% of churns happen at renewal)
  Annual adoption target: 20% of paying dealers by Month 12

CURRENCY RISK:
  AutoVerse charges in BDT → no currency exposure for BD dealers
  Infrastructure costs partially in USD (DigitalOcean, Vercel, Upstash)
  BDT/USD rate as of 2025: ~110 BDT/USD
  Infrastructure cost in BDT: ~BDT 10,000–15,000/month at 50 dealers
  At 1,000 dealers: ~BDT 1,20,000/month infrastructure (in USD terms)
  Hedge: as dealer base grows, BDT revenue grows faster than USD infra costs
```

---

*AutoVerse — Step 7: Payments + Localization + GTM*
*bKash · Nagad · SSLCommerz · SMS · WhatsApp API · Facebook · Email · Dealer GTM · Marketplace Growth*
*Built against Blueprint v7.0*
