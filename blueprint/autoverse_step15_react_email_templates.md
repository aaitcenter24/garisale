# AutoVerse — Step 15: React Email Templates
### 8 Production-Ready React Email Components · v1.0

> Location: `apps/api/src/notifications/email/templates/`
> Framework: `@react-email/components` + `@react-email/render`
> Render call: `const html = render(<TemplateName {...props} />)`
> Send via: Resend API (`resend.emails.send({ html, ... })`)

---

## Shared Types & Utilities

**File: `apps/api/src/notifications/email/templates/_shared/types.ts`**

```typescript
export interface DealerInfo {
  business_name: string;
  slug: string;
  logo_url: string | null;
  phone: string;
  whatsapp_number: string;
  district: string;
  primary_color?: string;
}

export interface VehicleInfo {
  year: number;
  make: string;
  model: string;
  variant: string | null;
  asking_price: number;
  mileage_km: number;
  fuel_type: string;
  transmission: string;
  condition: string;
  primary_photo_url: string | null;
  listing_url: string;
  deal_rating: 'great_deal' | 'good_deal' | 'fair_price' | 'overpriced' | 'unrated';
  imv_p50: number | null;
  imv_sample_size: number | null;
}

export interface BuyerInfo {
  full_name: string;
  phone: string;
  email: string;
}

export interface EmiOption {
  term_months: number;
  monthly_bdt: number;
  total_bdt: number;
  total_interest_bdt: number;
}
```

**File: `apps/api/src/notifications/email/templates/_shared/styles.ts`**

```typescript
import { CSSProperties } from 'react';

export const C = {
  primary:       '#2563EB',
  primaryLight:  '#DBEAFE',
  primaryDark:   '#1D4ED8',
  background:    '#F9FAFB',
  surface:       '#FFFFFF',
  textPrimary:   '#111827',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#E5E7EB',
  success:       '#16A34A',
  successBg:     '#DCFCE7',
  teal:          '#0D9488',
  tealBg:        '#CCFBF1',
  warning:       '#D97706',
  warningBg:     '#FEF3C7',
  danger:        '#DC2626',
  dangerBg:      '#FEE2E2',
};

export const DEAL_RATING = {
  great_deal: { color: '#16A34A', bg: '#DCFCE7', label: '🟢 Great Deal' },
  good_deal:  { color: '#0D9488', bg: '#CCFBF1', label: '🟦 Good Deal'  },
  fair_price: { color: '#D97706', bg: '#FEF3C7', label: '🟡 Fair Price' },
  overpriced: { color: '#DC2626', bg: '#FEE2E2', label: '🔴 Above Market' },
  unrated:    { color: '#9CA3AF', bg: '#F3F4F6', label: '⚪ No Rating'  },
};

export const S: Record<string, CSSProperties> = {
  body: {
    backgroundColor: C.background,
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
    margin: 0,
    padding: 0,
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: C.surface,
  },
  header: {
    backgroundColor: C.primary,
    padding: '24px 32px',
  },
  headerLogo: {
    height: '32px',
    display: 'inline-block',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: '20px',
    fontWeight: '700',
    margin: 0,
    lineHeight: '1.3',
  },
  headerSubtitle: {
    color: '#BFDBFE',
    fontSize: '14px',
    margin: '4px 0 0 0',
  },
  body_section: {
    padding: '32px',
  },
  h1: {
    color: C.textPrimary,
    fontSize: '22px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    lineHeight: '1.3',
  },
  h2: {
    color: C.textPrimary,
    fontSize: '18px',
    fontWeight: '600',
    margin: '24px 0 12px 0',
  },
  p: {
    color: C.textPrimary,
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
  },
  pMuted: {
    color: C.textSecondary,
    fontSize: '13px',
    lineHeight: '1.6',
    margin: '0 0 12px 0',
  },
  cta_button: {
    backgroundColor: C.primary,
    borderRadius: '8px',
    color: '#FFFFFF',
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: '600',
    padding: '12px 28px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  whatsapp_button: {
    backgroundColor: '#16A34A',
    borderRadius: '8px',
    color: '#FFFFFF',
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: '600',
    padding: '12px 28px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  vehicle_card: {
    border: `1px solid ${C.border}`,
    borderRadius: '12px',
    overflow: 'hidden',
    margin: '16px 0',
  },
  vehicle_photo: {
    width: '100%',
    height: '220px',
    objectFit: 'cover' as const,
    display: 'block',
  },
  vehicle_photo_placeholder: {
    width: '100%',
    height: '220px',
    backgroundColor: C.background,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  vehicle_info: {
    padding: '16px 20px',
  },
  vehicle_title: {
    color: C.textPrimary,
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 4px 0',
  },
  vehicle_specs: {
    color: C.textSecondary,
    fontSize: '13px',
    margin: '0 0 12px 0',
  },
  vehicle_price: {
    color: C.textPrimary,
    fontSize: '22px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    fontVariantNumeric: 'tabular-nums',
  },
  deal_badge: {
    display: 'inline-block',
    borderRadius: '6px',
    padding: '3px 10px',
    fontSize: '12px',
    fontWeight: '600',
  },
  info_row: {
    borderTop: `1px solid ${C.border}`,
    padding: '12px 0',
  },
  info_label: {
    color: C.textSecondary,
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: '0 0 2px 0',
  },
  info_value: {
    color: C.textPrimary,
    fontSize: '15px',
    fontWeight: '500',
    margin: 0,
  },
  divider: {
    borderTop: `1px solid ${C.border}`,
    margin: '24px 0',
  },
  footer: {
    backgroundColor: '#F3F4F6',
    padding: '24px 32px',
    borderTop: `1px solid ${C.border}`,
  },
  footer_text: {
    color: C.textMuted,
    fontSize: '12px',
    lineHeight: '1.6',
    margin: '0 0 8px 0',
  },
  footer_link: {
    color: C.primary,
    textDecoration: 'none',
    fontSize: '12px',
  },
  imv_bar_container: {
    backgroundColor: C.background,
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 0',
    border: `1px solid ${C.border}`,
  },
  highlight_box: {
    backgroundColor: C.primaryLight,
    borderRadius: '8px',
    padding: '16px 20px',
    margin: '16px 0',
    borderLeft: `4px solid ${C.primary}`,
  },
  warning_box: {
    backgroundColor: C.warningBg,
    borderRadius: '8px',
    padding: '16px 20px',
    margin: '16px 0',
    borderLeft: `4px solid ${C.warning}`,
  },
  success_box: {
    backgroundColor: C.successBg,
    borderRadius: '8px',
    padding: '16px 20px',
    margin: '16px 0',
    borderLeft: `4px solid ${C.success}`,
  },
  emi_table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    border: `1px solid ${C.border}`,
    borderRadius: '8px',
    overflow: 'hidden',
    margin: '16px 0',
  },
  emi_header_cell: {
    backgroundColor: C.primary,
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: '600',
    padding: '10px 14px',
    textAlign: 'left' as const,
  },
  emi_cell: {
    color: C.textPrimary,
    fontSize: '14px',
    padding: '10px 14px',
    borderBottom: `1px solid ${C.border}`,
  },
  emi_cell_alt: {
    color: C.textPrimary,
    fontSize: '14px',
    padding: '10px 14px',
    borderBottom: `1px solid ${C.border}`,
    backgroundColor: C.background,
  },
};

export function formatBdt(amount: number): string {
  if (amount >= 10000000) return `BDT ${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000)   return `BDT ${(amount / 100000).toFixed(1)}L`;
  return `BDT ${amount.toLocaleString('en-BD')}`;
}

export function formatBdtFull(amount: number): string {
  return `BDT ${amount.toLocaleString('en-BD')}`;
}

export const BASE_URL  = process.env.NEXT_PUBLIC_APP_URL  || 'https://autoverse.com.bd';
export const MEDIA_URL = process.env.R2_PUBLIC_URL        || 'https://media.autoverse.com.bd';
export const LOGO_URL  = `${MEDIA_URL}/brand/autoverse-logo-white.png`;
export const LOGO_DARK = `${MEDIA_URL}/brand/autoverse-logo-dark.png`;
```

---

## Template 1 — Lead Enquiry Confirmation

**File: `LeadEnquiryConfirmation.tsx`**
**When sent:** Immediately after buyer submits marketplace enquiry
**To:** Buyer's email address (if provided)
**Subject:** `Your enquiry about the {{year}} {{make}} {{model}}`

```tsx
import {
  Html, Head, Body, Container, Section, Row, Column,
  Text, Heading, Button, Link, Img, Hr, Preview,
} from '@react-email/components';
import * as React from 'react';
import {
  S, C, DEAL_RATING, formatBdt, formatBdtFull,
  BASE_URL, LOGO_URL, BuyerInfo, DealerInfo, VehicleInfo,
} from './_shared/styles';

interface LeadEnquiryConfirmationProps {
  buyer:          BuyerInfo;
  dealer:         DealerInfo;
  vehicle:        VehicleInfo;
  similar_vehicles?: VehicleInfo[];
}

export const LeadEnquiryConfirmation = ({
  buyer,
  dealer,
  vehicle,
  similar_vehicles = [],
}: LeadEnquiryConfirmationProps) => {
  const rating  = DEAL_RATING[vehicle.deal_rating];
  const waLink  = `https://wa.me/${dealer.whatsapp_number.replace(/\D/g, '')}`;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {dealer.business_name} received your enquiry about the {vehicle.year} {vehicle.make} {vehicle.model}.
      </Preview>
      <Body style={S.body}>
        <Container style={S.container}>

          {/* HEADER */}
          <Section style={S.header}>
            <Img src={LOGO_URL} alt="AutoVerse" height={28} />
          </Section>

          {/* BODY */}
          <Section style={S.body_section}>
            <Heading style={S.h1}>
              Hi {buyer.full_name}! 👋
            </Heading>
            <Text style={S.p}>
              Your enquiry has been sent to{' '}
              <strong>{dealer.business_name}</strong>. They'll be in
              touch with you shortly.
            </Text>

            {/* VEHICLE CARD */}
            <div style={S.vehicle_card}>
              {vehicle.primary_photo_url ? (
                <Img
                  src={vehicle.primary_photo_url}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  style={S.vehicle_photo}
                />
              ) : (
                <div style={{ ...S.vehicle_photo_placeholder }}>
                  <Text style={{ color: C.textMuted, fontSize: '13px' }}>
                    No photo
                  </Text>
                </div>
              )}
              <div style={S.vehicle_info}>
                <Text style={S.vehicle_title}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                  {vehicle.variant ? ` — ${vehicle.variant}` : ''}
                </Text>
                <Text style={S.vehicle_specs}>
                  {vehicle.mileage_km.toLocaleString()} km · {vehicle.fuel_type} ·{' '}
                  {vehicle.transmission} · {vehicle.condition}
                </Text>
                <Text style={S.vehicle_price}>
                  {formatBdtFull(vehicle.asking_price)}
                </Text>

                {/* IMV badge */}
                {vehicle.deal_rating !== 'unrated' && (
                  <span
                    style={{
                      ...S.deal_badge,
                      backgroundColor: rating.bg,
                      color: rating.color,
                    }}
                  >
                    {rating.label}
                  </span>
                )}

                {/* IMV note */}
                {vehicle.imv_p50 && vehicle.deal_rating !== 'unrated' && (
                  <Text style={{ ...S.pMuted, marginTop: '8px' }}>
                    {vehicle.asking_price < vehicle.imv_p50
                      ? `${formatBdt(vehicle.imv_p50 - vehicle.asking_price)} below market average`
                      : `Near market average`}
                    {vehicle.imv_sample_size
                      ? ` · Based on ${vehicle.imv_sample_size} comparable listings`
                      : ''}
                  </Text>
                )}
              </div>
            </div>

            {/* WHAT HAPPENS NEXT */}
            <div style={S.highlight_box}>
              <Text style={{ ...S.p, margin: 0, fontWeight: '600' }}>
                What happens next?
              </Text>
              <Text style={{ ...S.p, margin: '8px 0 0 0' }}>
                {dealer.business_name} will contact you on{' '}
                <strong>{buyer.phone}</strong>. Most dealers reply
                within a few hours.
              </Text>
            </div>

            {/* WHATSAPP CTA */}
            <Section style={{ textAlign: 'center', margin: '24px 0' }}>
              <Button href={waLink} style={S.whatsapp_button}>
                💬 WhatsApp {dealer.business_name}
              </Button>
            </Section>
            <Text style={{ ...S.pMuted, textAlign: 'center' }}>
              Or call them on{' '}
              <Link href={`tel:${dealer.phone}`} style={{ color: C.primary }}>
                {dealer.phone}
              </Link>
            </Text>

            {/* VIEW LISTING */}
            <Section style={{ textAlign: 'center', margin: '16px 0 24px' }}>
              <Link href={vehicle.listing_url} style={S.cta_button}>
                View Full Listing →
              </Link>
            </Section>

            <Hr style={S.divider} />

            {/* SIMILAR VEHICLES */}
            {similar_vehicles.length > 0 && (
              <>
                <Heading style={S.h2}>Similar Cars You Might Like</Heading>
                <Row>
                  {similar_vehicles.slice(0, 2).map((v, i) => {
                    const vRating = DEAL_RATING[v.deal_rating];
                    return (
                      <Column key={i} style={{ paddingRight: i === 0 ? '8px' : '0' }}>
                        <div style={{ border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                          {v.primary_photo_url && (
                            <Img
                              src={v.primary_photo_url}
                              alt={`${v.year} ${v.make} ${v.model}`}
                              width="100%"
                              style={{ height: '120px', objectFit: 'cover', display: 'block' }}
                            />
                          )}
                          <div style={{ padding: '10px 12px' }}>
                            <Text style={{ ...S.vehicle_title, fontSize: '14px', margin: '0 0 2px 0' }}>
                              {v.year} {v.make} {v.model}
                            </Text>
                            <Text style={{ ...S.vehicle_price, fontSize: '15px', margin: '0 0 4px 0' }}>
                              {formatBdt(v.asking_price)}
                            </Text>
                            {v.deal_rating !== 'unrated' && (
                              <span style={{ ...S.deal_badge, backgroundColor: vRating.bg, color: vRating.color, fontSize: '11px' }}>
                                {vRating.label}
                              </span>
                            )}
                            <div style={{ marginTop: '8px' }}>
                              <Link href={v.listing_url} style={{ color: C.primary, fontSize: '13px' }}>
                                View →
                              </Link>
                            </div>
                          </div>
                        </div>
                      </Column>
                    );
                  })}
                </Row>
                <Hr style={S.divider} />
              </>
            )}
          </Section>

          {/* FOOTER */}
          <Section style={S.footer}>
            <Text style={S.footer_text}>
              This email was sent because you submitted an enquiry on{' '}
              <Link href={BASE_URL} style={S.footer_link}>AutoVerse Marketplace</Link>.
            </Text>
            <Text style={S.footer_text}>
              <Link href={`${BASE_URL}/unsubscribe?email=${buyer.email}`} style={S.footer_link}>
                Unsubscribe
              </Link>
              {' · '}
              <Link href={`${BASE_URL}/privacy`} style={S.footer_link}>
                Privacy Policy
              </Link>
            </Text>
            <Text style={{ ...S.footer_text, margin: 0 }}>
              AutoVerse · Dhaka, Bangladesh · autoverse.com.bd
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

export default LeadEnquiryConfirmation;
```

---

## Template 2 — Lead Finance Options

**File: `LeadFinanceOptions.tsx`**
**When sent:** Day 2 of lead email sequence (if no WhatsApp reply received)
**To:** Buyer's email
**Subject:** `Finance options for the {{year}} {{make}} {{model}}`

```tsx
import {
  Html, Head, Body, Container, Section, Row, Column,
  Text, Heading, Button, Link, Img, Hr, Preview,
} from '@react-email/components';
import * as React from 'react';
import {
  S, C, DEAL_RATING, formatBdt, formatBdtFull,
  BASE_URL, LOGO_URL, BuyerInfo, DealerInfo, VehicleInfo, EmiOption,
} from './_shared/styles';

interface LeadFinanceOptionsProps {
  buyer:       BuyerInfo;
  dealer:      DealerInfo;
  vehicle:     VehicleInfo;
  emi_options: EmiOption[];
}

export const LeadFinanceOptions = ({
  buyer,
  dealer,
  vehicle,
  emi_options,
}: LeadFinanceOptionsProps) => {
  const waLink = `https://wa.me/${dealer.whatsapp_number.replace(/\D/g, '')}`;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Finance options for the {vehicle.year} {vehicle.make} {vehicle.model} — starting from {formatBdt(emi_options[0]?.monthly_bdt ?? 0)}/month.
      </Preview>
      <Body style={S.body}>
        <Container style={S.container}>

          {/* HEADER */}
          <Section style={S.header}>
            <Img src={LOGO_URL} alt="AutoVerse" height={28} />
          </Section>

          <Section style={S.body_section}>
            <Heading style={S.h1}>
              Finance options for the {vehicle.year} {vehicle.make} {vehicle.model}
            </Heading>
            <Text style={S.p}>
              Hi {buyer.full_name}, buying a car doesn't have to mean paying the
              full price upfront. Here are some finance options available for the{' '}
              <strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong> at{' '}
              <strong>{formatBdtFull(vehicle.asking_price)}</strong>:
            </Text>

            {/* EMI TABLE */}
            <table style={S.emi_table}>
              <thead>
                <tr>
                  <th style={S.emi_header_cell}>Loan Term</th>
                  <th style={S.emi_header_cell}>Monthly Payment</th>
                  <th style={S.emi_header_cell}>Total Cost</th>
                  <th style={S.emi_header_cell}>Total Interest</th>
                </tr>
              </thead>
              <tbody>
                {emi_options.map((opt, i) => (
                  <tr key={opt.term_months}>
                    <td style={i % 2 === 0 ? S.emi_cell : S.emi_cell_alt}>
                      {opt.term_months} months
                    </td>
                    <td style={{
                      ...(i % 2 === 0 ? S.emi_cell : S.emi_cell_alt),
                      fontWeight: '600',
                      color: C.primary,
                    }}>
                      {formatBdt(opt.monthly_bdt)}/mo
                    </td>
                    <td style={i % 2 === 0 ? S.emi_cell : S.emi_cell_alt}>
                      {formatBdt(opt.total_bdt)}
                    </td>
                    <td style={i % 2 === 0 ? S.emi_cell : S.emi_cell_alt}>
                      {formatBdt(opt.total_interest_bdt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Text style={S.pMuted}>
              * Illustrative figures based on typical BD bank lending rates (10–14% per annum).
              Actual rates depend on your bank and credit assessment.
            </Text>

            {/* FINANCE PROCESS */}
            <Heading style={S.h2}>How Finance Works</Heading>
            <div style={{ ...S.highlight_box, padding: '16px 20px' }}>
              {[
                { step: '1', title: 'Choose your car', desc: 'Select the vehicle and agree on the sale price with the dealer.' },
                { step: '2', title: 'Apply to your bank', desc: 'Submit your salary slip, bank statement, and NID to your preferred bank or NBFI.' },
                { step: '3', title: 'Approval & disbursal', desc: 'Banks typically take 3–7 business days. The loan is disbursed directly to the dealer.' },
                { step: '4', title: 'Drive your car', desc: 'Registration and insurance are completed. Monthly instalments begin the following month.' },
              ].map((item) => (
                <Row key={item.step} style={{ marginBottom: '12px' }}>
                  <Column style={{ width: '32px', verticalAlign: 'top' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      backgroundColor: C.primary, color: '#FFF',
                      fontSize: '12px', fontWeight: '700',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      textAlign: 'center', lineHeight: '24px',
                    }}>
                      {item.step}
                    </div>
                  </Column>
                  <Column style={{ verticalAlign: 'top' }}>
                    <Text style={{ ...S.p, margin: 0, fontWeight: '600' }}>{item.title}</Text>
                    <Text style={{ ...S.pMuted, marginTop: '2px' }}>{item.desc}</Text>
                  </Column>
                </Row>
              ))}
            </div>

            <Text style={S.p}>
              Want to discuss finance options? WhatsApp{' '}
              <strong>{dealer.business_name}</strong> — they can connect you with
              their finance partners.
            </Text>

            <Section style={{ textAlign: 'center', margin: '24px 0 16px' }}>
              <Button href={waLink} style={S.whatsapp_button}>
                💬 Ask About Finance
              </Button>
            </Section>

            <Section style={{ textAlign: 'center' }}>
              <Link href={vehicle.listing_url} style={S.cta_button}>
                View Vehicle →
              </Link>
            </Section>
          </Section>

          {/* FOOTER */}
          <Section style={S.footer}>
            <Text style={S.footer_text}>
              This email is part of your enquiry follow-up from{' '}
              <Link href={BASE_URL} style={S.footer_link}>AutoVerse</Link>.
            </Text>
            <Text style={{ ...S.footer_text, margin: 0 }}>
              <Link href={`${BASE_URL}/unsubscribe?email=${buyer.email}`} style={S.footer_link}>
                Unsubscribe
              </Link>
              {' · '}
              <Link href={`${BASE_URL}/privacy`} style={S.footer_link}>
                Privacy Policy
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

export default LeadFinanceOptions;
```

---

## Template 3 — Expiring Offer (Day 5)

**File: `LeadExpiringOffer.tsx`**
**When sent:** Day 5 of lead email sequence with soft urgency
**To:** Buyer's email
**Subject:** `The {{year}} {{make}} {{model}} — still available?`

```tsx
import {
  Html, Head, Body, Container, Section, Row, Column,
  Text, Heading, Button, Link, Img, Hr, Preview,
} from '@react-email/components';
import * as React from 'react';
import {
  S, C, DEAL_RATING, formatBdt, formatBdtFull,
  BASE_URL, LOGO_URL, BuyerInfo, DealerInfo, VehicleInfo,
} from './_shared/styles';

interface LeadExpiringOfferProps {
  buyer:             BuyerInfo;
  dealer:            DealerInfo;
  vehicle:           VehicleInfo;
  price_was_reduced: boolean;
  original_price?:   number;
  alternative_vehicles?: VehicleInfo[];
}

export const LeadExpiringOffer = ({
  buyer,
  dealer,
  vehicle,
  price_was_reduced,
  original_price,
  alternative_vehicles = [],
}: LeadExpiringOfferProps) => {
  const rating = DEAL_RATING[vehicle.deal_rating];
  const waLink = `https://wa.me/${dealer.whatsapp_number.replace(/\D/g, '')}`;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {price_was_reduced
          ? `Price reduced! The ${vehicle.year} ${vehicle.make} ${vehicle.model} is now ${formatBdt(vehicle.asking_price)}.`
          : `The ${vehicle.year} ${vehicle.make} ${vehicle.model} is still available — a few things to know.`}
      </Preview>
      <Body style={S.body}>
        <Container style={S.container}>

          {/* HEADER */}
          <Section style={S.header}>
            <Img src={LOGO_URL} alt="AutoVerse" height={28} />
          </Section>

          <Section style={S.body_section}>

            {/* PRICE REDUCED BADGE */}
            {price_was_reduced && original_price && (
              <div style={{
                backgroundColor: C.successBg,
                border: `1px solid ${C.success}`,
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
              }}>
                <Text style={{ color: C.success, fontWeight: '700', fontSize: '15px', margin: 0 }}>
                  🎉 Price Reduced!{' '}
                  <span style={{ textDecoration: 'line-through', fontWeight: '400', color: C.textSecondary }}>
                    {formatBdtFull(original_price)}
                  </span>{' '}
                  → <span>{formatBdtFull(vehicle.asking_price)}</span>
                </Text>
              </div>
            )}

            <Heading style={S.h1}>
              Hi {buyer.full_name}, still thinking about the {vehicle.make} {vehicle.model}?
            </Heading>
            <Text style={S.p}>
              The <strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong> is still
              available at <strong>{dealer.business_name}</strong>.
              {price_was_reduced
                ? ` The price has been reduced to ${formatBdtFull(vehicle.asking_price)}.`
                : ''}
            </Text>

            {/* VEHICLE CARD */}
            <div style={S.vehicle_card}>
              {vehicle.primary_photo_url && (
                <Img
                  src={vehicle.primary_photo_url}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  style={S.vehicle_photo}
                />
              )}
              <div style={S.vehicle_info}>
                <Text style={S.vehicle_title}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </Text>
                <Text style={S.vehicle_specs}>
                  {vehicle.mileage_km.toLocaleString()} km ·{' '}
                  {vehicle.fuel_type} · {vehicle.transmission}
                </Text>
                <Text style={S.vehicle_price}>
                  {formatBdtFull(vehicle.asking_price)}
                </Text>
                {vehicle.deal_rating !== 'unrated' && (
                  <span style={{ ...S.deal_badge, backgroundColor: rating.bg, color: rating.color }}>
                    {rating.label}
                  </span>
                )}
              </div>
            </div>

            {/* IMV CONTEXT */}
            {vehicle.imv_p50 && vehicle.asking_price <= vehicle.imv_p50 && (
              <div style={S.highlight_box}>
                <Text style={{ ...S.p, margin: 0, fontWeight: '600', color: C.primary }}>
                  This car is priced well for the current market.
                </Text>
                <Text style={{ ...S.pMuted, marginTop: '4px' }}>
                  {vehicle.imv_sample_size
                    ? `Based on ${vehicle.imv_sample_size} comparable listings, the market average for a similar ${vehicle.make} ${vehicle.model} in this area is ${formatBdtFull(vehicle.imv_p50)}.`
                    : `This price is at or below the current market average for similar vehicles.`}
                </Text>
              </div>
            )}

            <Section style={{ textAlign: 'center', margin: '24px 0 16px' }}>
              <Button href={waLink} style={S.whatsapp_button}>
                💬 Reserve This Car
              </Button>
            </Section>
            <Section style={{ textAlign: 'center' }}>
              <Link href={vehicle.listing_url} style={S.cta_button}>
                View Listing →
              </Link>
            </Section>

            {/* ALTERNATIVE VEHICLES */}
            {alternative_vehicles.length > 0 && (
              <>
                <Hr style={S.divider} />
                <Heading style={S.h2}>
                  Other Cars That Might Interest You
                </Heading>
                <Text style={S.pMuted}>
                  Looking for something slightly different? Here are other options
                  from {dealer.business_name}:
                </Text>
                {alternative_vehicles.slice(0, 3).map((v, i) => {
                  const vr = DEAL_RATING[v.deal_rating];
                  return (
                    <Row key={i} style={{ ...S.info_row, alignItems: 'center' }}>
                      <Column style={{ width: '80px' }}>
                        {v.primary_photo_url ? (
                          <Img
                            src={v.primary_photo_url}
                            alt={`${v.year} ${v.make} ${v.model}`}
                            style={{ width: '72px', height: '54px', objectFit: 'cover', borderRadius: '6px', display: 'block' }}
                          />
                        ) : (
                          <div style={{ width: '72px', height: '54px', backgroundColor: C.background, borderRadius: '6px' }} />
                        )}
                      </Column>
                      <Column style={{ paddingLeft: '12px' }}>
                        <Text style={{ ...S.p, fontWeight: '600', margin: '0 0 2px 0' }}>
                          {v.year} {v.make} {v.model}
                        </Text>
                        <Text style={{ ...S.pMuted, margin: '0 0 4px 0' }}>
                          {formatBdtFull(v.asking_price)} · {v.mileage_km.toLocaleString()} km
                        </Text>
                        {v.deal_rating !== 'unrated' && (
                          <span style={{ ...S.deal_badge, backgroundColor: vr.bg, color: vr.color, fontSize: '11px' }}>
                            {vr.label}
                          </span>
                        )}
                      </Column>
                      <Column style={{ width: '80px', textAlign: 'right' }}>
                        <Link href={v.listing_url} style={{ color: C.primary, fontSize: '13px', fontWeight: '600' }}>
                          View →
                        </Link>
                      </Column>
                    </Row>
                  );
                })}
              </>
            )}
          </Section>

          {/* FOOTER */}
          <Section style={S.footer}>
            <Text style={S.footer_text}>
              This email was sent because you enquired on{' '}
              <Link href={BASE_URL} style={S.footer_link}>AutoVerse</Link>.
            </Text>
            <Text style={{ ...S.footer_text, margin: 0 }}>
              <Link href={`${BASE_URL}/unsubscribe?email=${buyer.email}`} style={S.footer_link}>
                Unsubscribe
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

export default LeadExpiringOffer;
```

---

## Template 4 — Delivery Confirmation

**File: `DeliveryConfirmation.tsx`**
**When sent:** Day 1 after deal.delivered (post-sale sequence Step 0)
**To:** Buyer's email
**Subject:** `Congratulations on your new {{year}} {{make}} {{model}}! 🎉`

```tsx
import {
  Html, Head, Body, Container, Section, Row, Column,
  Text, Heading, Button, Link, Img, Hr, Preview,
} from '@react-email/components';
import * as React from 'react';
import {
  S, C, formatBdtFull, BASE_URL, LOGO_URL,
  BuyerInfo, DealerInfo, VehicleInfo,
} from './_shared/styles';

interface DeliveryConfirmationProps {
  buyer:          BuyerInfo;
  dealer:         DealerInfo;
  vehicle:        VehicleInfo;
  deal_date:      string;
  first_service_due_km: number;
  care_guide_url?: string;
}

export const DeliveryConfirmation = ({
  buyer,
  dealer,
  vehicle,
  deal_date,
  first_service_due_km,
  care_guide_url,
}: DeliveryConfirmationProps) => {
  const waLink = `https://wa.me/${dealer.whatsapp_number.replace(/\D/g, '')}`;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Congratulations {buyer.full_name}! Your {vehicle.year} {vehicle.make} {vehicle.model} has been delivered. Here's everything you need to know.
      </Preview>
      <Body style={S.body}>
        <Container style={S.container}>

          {/* HEADER — success green for delivery */}
          <Section style={{ ...S.header, backgroundColor: C.success }}>
            <Img src={LOGO_URL} alt="AutoVerse" height={28} />
          </Section>

          <Section style={S.body_section}>
            {/* HERO */}
            <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
              <Text style={{ fontSize: '48px', margin: '0 0 8px 0', lineHeight: '1' }}>🎉</Text>
              <Heading style={{ ...S.h1, textAlign: 'center' }}>
                Congratulations, {buyer.full_name}!
              </Heading>
              <Text style={{ ...S.p, textAlign: 'center', color: C.textSecondary }}>
                Your new car is officially yours.
              </Text>
            </div>

            {/* VEHICLE SUMMARY */}
            <div style={{ ...S.vehicle_card, margin: '0 0 24px 0' }}>
              {vehicle.primary_photo_url && (
                <Img
                  src={vehicle.primary_photo_url}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  style={S.vehicle_photo}
                />
              )}
              <div style={S.vehicle_info}>
                <Text style={S.vehicle_title}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                  {vehicle.variant ? ` — ${vehicle.variant}` : ''}
                </Text>
                <Text style={S.vehicle_specs}>
                  {vehicle.mileage_km.toLocaleString()} km · {vehicle.fuel_type} ·{' '}
                  {vehicle.transmission}
                </Text>
                <Row style={{ marginTop: '12px' }}>
                  <Column>
                    <Text style={S.info_label}>Purchased from</Text>
                    <Text style={S.info_value}>{dealer.business_name}</Text>
                  </Column>
                  <Column>
                    <Text style={S.info_label}>Date</Text>
                    <Text style={S.info_value}>{deal_date}</Text>
                  </Column>
                  <Column>
                    <Text style={S.info_label}>Price Paid</Text>
                    <Text style={S.info_value}>{formatBdtFull(vehicle.asking_price)}</Text>
                  </Column>
                </Row>
              </div>
            </div>

            {/* CARE CHECKLIST */}
            <Heading style={S.h2}>Your First Month Checklist</Heading>
            <div style={{ ...S.highlight_box }}>
              {[
                `✅ Keep the first service receipt — important for resale value`,
                `✅ Register the car in your name if not done yet (BRTA, within 30 days)`,
                `✅ Purchase motor insurance if not already covered`,
                `✅ First service due at ${(vehicle.mileage_km + first_service_due_km).toLocaleString()} km or 3 months — whichever comes first`,
                `✅ Save ${dealer.business_name}'s WhatsApp number for quick support`,
              ].map((item, i) => (
                <Text key={i} style={{ ...S.p, margin: '0 0 8px 0' }}>
                  {item}
                </Text>
              ))}
            </div>

            {/* CARE GUIDE */}
            {care_guide_url && (
              <>
                <Text style={S.p}>
                  We've put together a care guide for new car owners in Bangladesh:
                </Text>
                <Section style={{ textAlign: 'center', margin: '16px 0' }}>
                  <Link href={care_guide_url} style={S.cta_button}>
                    Download Care Guide (PDF)
                  </Link>
                </Section>
              </>
            )}

            <Hr style={S.divider} />

            {/* DEALER CONTACT */}
            <Heading style={S.h2}>Questions? {dealer.business_name} is here to help.</Heading>
            <Text style={S.p}>
              Have a question about your car? The team at{' '}
              <strong>{dealer.business_name}</strong> know your vehicle inside out.
            </Text>
            <Row>
              <Column>
                <Button href={waLink} style={{ ...S.whatsapp_button, fontSize: '14px', padding: '10px 20px' }}>
                  💬 WhatsApp
                </Button>
              </Column>
              <Column style={{ paddingLeft: '12px' }}>
                <Button
                  href={`tel:${dealer.phone}`}
                  style={{ ...S.cta_button, fontSize: '14px', padding: '10px 20px', backgroundColor: C.textSecondary }}
                >
                  📞 Call
                </Button>
              </Column>
            </Row>
          </Section>

          {/* FOOTER */}
          <Section style={S.footer}>
            <Text style={S.footer_text}>
              Thank you for buying through{' '}
              <Link href={BASE_URL} style={S.footer_link}>AutoVerse Marketplace</Link>.
              Enjoy your new car!
            </Text>
            <Text style={{ ...S.footer_text, margin: 0 }}>
              <Link href={`${BASE_URL}/unsubscribe?email=${buyer.email}`} style={S.footer_link}>
                Unsubscribe
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

export default DeliveryConfirmation;
```

---

## Template 5 — Service Reminder

**File: `ServiceReminder.tsx`**
**When sent:** Post-sale Day 30 (first service) and Day 365 (annual)
**To:** Customer's email
**Subject (Day 30):** `Time for your first service — {{year}} {{make}} {{model}}`
**Subject (Day 365):** `Annual service time for your {{make}} {{model}} 🔧`

```tsx
import {
  Html, Head, Body, Container, Section, Row, Column,
  Text, Heading, Button, Link, Img, Hr, Preview,
} from '@react-email/components';
import * as React from 'react';
import {
  S, C, BASE_URL, LOGO_URL, BuyerInfo, DealerInfo, VehicleInfo,
} from './_shared/styles';

interface ServiceReminderProps {
  customer:       BuyerInfo;
  dealer:         DealerInfo;
  vehicle:        VehicleInfo;
  service_type:   'first' | 'annual';
  months_owned:   number;
  booking_url?:   string;
}

export const ServiceReminder = ({
  customer,
  dealer,
  vehicle,
  service_type,
  months_owned,
  booking_url,
}: ServiceReminderProps) => {
  const isFirst = service_type === 'first';
  const waLink  = `https://wa.me/${dealer.whatsapp_number.replace(/\D/g, '')}`;

  const service_items = isFirst
    ? [
        'Engine oil and filter change',
        'Tyre pressure check and rotation',
        'Brake fluid level check',
        'AC filter inspection',
        'Battery condition check',
        'All fluid top-ups',
        'Visual undercarriage inspection',
      ]
    : [
        'Full engine oil and filter change',
        'Air filter replacement',
        'Spark plug inspection (petrol)',
        'Brake pad measurement and inspection',
        'Tyre tread depth and rotation',
        'AC service and refrigerant check',
        'Suspension and steering check',
        'All fluid replacement (coolant, brake fluid)',
      ];

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {isFirst
          ? `Your ${vehicle.make} ${vehicle.model}'s first service is due. Book now at ${dealer.business_name}.`
          : `${months_owned} months with your ${vehicle.make} ${vehicle.model} — annual service time!`}
      </Preview>
      <Body style={S.body}>
        <Container style={S.container}>

          <Section style={S.header}>
            <Img src={LOGO_URL} alt="AutoVerse" height={28} />
          </Section>

          <Section style={S.body_section}>
            <Heading style={S.h1}>
              {isFirst
                ? `⚙️ First service time for your ${vehicle.make} ${vehicle.model}`
                : `🔧 Annual service — ${months_owned} months with your ${vehicle.make}`}
            </Heading>
            <Text style={S.p}>
              Hi {customer.full_name},{' '}
              {isFirst
                ? `your ${vehicle.year} ${vehicle.make} ${vehicle.model} is ready for its first service. Regular maintenance is the single best thing you can do to protect your investment.`
                : `it's been ${months_owned} months since you got your ${vehicle.make} ${vehicle.model}. Time for your annual service to keep it running perfectly.`}
            </Text>

            {/* VEHICLE RECAP */}
            <div style={{ ...S.info_row, borderTop: 'none', padding: '12px 16px', backgroundColor: C.background, borderRadius: '8px', marginBottom: '20px' }}>
              <Row>
                <Column>
                  <Text style={S.info_label}>Your Vehicle</Text>
                  <Text style={S.info_value}>{vehicle.year} {vehicle.make} {vehicle.model}</Text>
                </Column>
                <Column>
                  <Text style={S.info_label}>Last Recorded Mileage</Text>
                  <Text style={S.info_value}>{vehicle.mileage_km.toLocaleString()} km</Text>
                </Column>
                <Column>
                  <Text style={S.info_label}>Service Type</Text>
                  <Text style={S.info_value}>{isFirst ? 'First Service' : 'Annual Service'}</Text>
                </Column>
              </Row>
            </div>

            {/* SERVICE CHECKLIST */}
            <Heading style={S.h2}>What's included in this service</Heading>
            <div style={{ ...S.highlight_box }}>
              {service_items.map((item, i) => (
                <Text key={i} style={{ ...S.p, margin: '0 0 6px 0' }}>
                  🔹 {item}
                </Text>
              ))}
            </div>

            {/* BOOKING CTA */}
            {booking_url ? (
              <>
                <Text style={S.p}>
                  Book your service appointment with{' '}
                  <strong>{dealer.business_name}</strong>:
                </Text>
                <Section style={{ textAlign: 'center', margin: '20px 0' }}>
                  <Button href={booking_url} style={S.cta_button}>
                    Book Service Appointment
                  </Button>
                </Section>
              </>
            ) : (
              <>
                <Text style={S.p}>
                  Contact <strong>{dealer.business_name}</strong> to schedule your service:
                </Text>
                <Section style={{ textAlign: 'center', margin: '20px 0' }}>
                  <Button href={waLink} style={S.whatsapp_button}>
                    💬 WhatsApp to Book
                  </Button>
                </Section>
              </>
            )}

            {/* WHY REGULAR SERVICE */}
            <Hr style={S.divider} />
            <Heading style={S.h2}>Why regular servicing matters</Heading>
            {[
              ['Protects engine life', 'Engine oil breaks down over time. Fresh oil prevents wear and reduces the chance of costly engine damage.'],
              ['Maintains resale value', 'Cars with full service history sell faster and at higher prices. Keep all service receipts.'],
              ['Identifies issues early', 'Small problems caught at service cost a fraction of what they cost when they become major failures.'],
            ].map(([title, desc], i) => (
              <Row key={i} style={{ marginBottom: '12px' }}>
                <Column style={{ width: '24px', verticalAlign: 'top' }}>
                  <Text style={{ color: C.primary, fontSize: '18px', margin: 0 }}>✓</Text>
                </Column>
                <Column style={{ paddingLeft: '8px', verticalAlign: 'top' }}>
                  <Text style={{ ...S.p, fontWeight: '600', margin: '0 0 2px 0' }}>{title}</Text>
                  <Text style={{ ...S.pMuted, marginTop: 0 }}>{desc}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Section style={S.footer}>
            <Text style={S.footer_text}>
              This reminder was sent by{' '}
              <Link href={BASE_URL} style={S.footer_link}>AutoVerse</Link>{' '}
              on behalf of {dealer.business_name}.
            </Text>
            <Text style={{ ...S.footer_text, margin: 0 }}>
              <Link href={`${BASE_URL}/unsubscribe?email=${customer.email}`} style={S.footer_link}>
                Unsubscribe
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

export default ServiceReminder;
```

---

## Template 6 — Win-Back Email

**File: `WinBackEmail.tsx`**
**When sent:** 30+ days after lead was marked lost or went cold, if new matching inventory arrives
**To:** Customer's email
**Subject:** `Still looking for a car? New arrivals match your search 🚗`

```tsx
import {
  Html, Head, Body, Container, Section, Row, Column,
  Text, Heading, Button, Link, Img, Hr, Preview,
} from '@react-email/components';
import * as React from 'react';
import {
  S, C, DEAL_RATING, formatBdt, formatBdtFull,
  BASE_URL, LOGO_URL, BuyerInfo, DealerInfo, VehicleInfo,
} from './_shared/styles';

interface WinBackEmailProps {
  customer:          BuyerInfo;
  dealer:            DealerInfo;
  new_inventory:     VehicleInfo[];
  original_search?:  { make?: string; model?: string; budget_max?: number };
  market_note?:      string;
}

export const WinBackEmail = ({
  customer,
  dealer,
  new_inventory,
  original_search,
  market_note,
}: WinBackEmailProps) => {
  const waLink = `https://wa.me/${dealer.whatsapp_number.replace(/\D/g, '')}`;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        New arrivals at {dealer.business_name} matching your car search.
        {new_inventory.length > 0
          ? ` Starting from ${formatBdt(new_inventory[0].asking_price)}.`
          : ''}
      </Preview>
      <Body style={S.body}>
        <Container style={S.container}>

          <Section style={S.header}>
            <Img src={LOGO_URL} alt="AutoVerse" height={28} />
          </Section>

          <Section style={S.body_section}>
            <Heading style={S.h1}>
              Hi {customer.full_name}, still looking for a car?
            </Heading>
            <Text style={S.p}>
              {original_search?.make
                ? `We noticed you were looking for a ${original_search.make}${original_search.model ? ` ${original_search.model}` : ''}. `
                : 'We have new arrivals that might be exactly what you\'re looking for. '}
              <strong>{dealer.business_name}</strong> has some fresh stock that might interest you.
            </Text>

            {/* MARKET NOTE */}
            {market_note && (
              <div style={S.warning_box}>
                <Text style={{ ...S.p, margin: 0, color: C.warning, fontWeight: '600' }}>
                  📊 Market Update
                </Text>
                <Text style={{ ...S.p, margin: '4px 0 0 0' }}>
                  {market_note}
                </Text>
              </div>
            )}

            {/* NEW INVENTORY LIST */}
            <Heading style={S.h2}>
              New arrivals matching your search
            </Heading>

            {new_inventory.slice(0, 4).map((v, i) => {
              const rating = DEAL_RATING[v.deal_rating];
              return (
                <div key={i} style={{ ...S.vehicle_card, marginBottom: '16px' }}>
                  <Row>
                    <Column style={{ width: '140px' }}>
                      {v.primary_photo_url ? (
                        <Img
                          src={v.primary_photo_url}
                          alt={`${v.year} ${v.make} ${v.model}`}
                          style={{
                            width: '140px', height: '105px',
                            objectFit: 'cover', display: 'block',
                          }}
                        />
                      ) : (
                        <div style={{ width: '140px', height: '105px', backgroundColor: C.background }} />
                      )}
                    </Column>
                    <Column style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                      <Text style={{ ...S.vehicle_title, fontSize: '15px', margin: '0 0 2px 0' }}>
                        {v.year} {v.make} {v.model}
                      </Text>
                      <Text style={{ ...S.vehicle_specs, margin: '0 0 6px 0' }}>
                        {v.mileage_km.toLocaleString()} km · {v.fuel_type} · {v.condition}
                      </Text>
                      <Text style={{ ...S.vehicle_price, fontSize: '17px', margin: '0 0 6px 0' }}>
                        {formatBdtFull(v.asking_price)}
                      </Text>
                      <Row>
                        {v.deal_rating !== 'unrated' && (
                          <Column style={{ paddingRight: '8px' }}>
                            <span style={{ ...S.deal_badge, backgroundColor: rating.bg, color: rating.color, fontSize: '11px' }}>
                              {rating.label}
                            </span>
                          </Column>
                        )}
                        <Column>
                          <Link href={v.listing_url} style={{ color: C.primary, fontSize: '13px', fontWeight: '600' }}>
                            View →
                          </Link>
                        </Column>
                      </Row>
                    </Column>
                  </Row>
                </div>
              );
            })}

            {/* CTA */}
            <Section style={{ textAlign: 'center', margin: '24px 0 16px' }}>
              <Button href={waLink} style={S.whatsapp_button}>
                💬 Ask About These Cars
              </Button>
            </Section>
            <Section style={{ textAlign: 'center' }}>
              <Link
                href={`${BASE_URL}/dealers/${dealer.slug}`}
                style={S.cta_button}
              >
                See All Cars at {dealer.business_name} →
              </Link>
            </Section>
          </Section>

          <Section style={S.footer}>
            <Text style={S.footer_text}>
              This email was sent by{' '}
              <Link href={BASE_URL} style={S.footer_link}>AutoVerse</Link>{' '}
              based on your previous car search.
            </Text>
            <Text style={{ ...S.footer_text, margin: 0 }}>
              <Link
                href={`${BASE_URL}/unsubscribe?email=${customer.email}`}
                style={S.footer_link}
              >
                Unsubscribe
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

export default WinBackEmail;
```

---

## Template 7 — Invoice Email

**File: `InvoiceEmail.tsx`**
**When sent:** After any successful payment (subscription, per-lead bill, C2C listing fee)
**To:** Dealer owner's email
**Subject:** `Invoice #{{invoice_no}} — AutoVerse {{plan}} — {{month}}`

```tsx
import {
  Html, Head, Body, Container, Section, Row, Column,
  Text, Heading, Button, Link, Img, Hr, Preview,
} from '@react-email/components';
import * as React from 'react';
import {
  S, C, formatBdtFull, BASE_URL, LOGO_URL, DealerInfo,
} from './_shared/styles';

export interface InvoiceLineItem {
  description: string;
  quantity:    number;
  unit_price:  number;
  total:       number;
}

interface InvoiceEmailProps {
  dealer:         DealerInfo;
  invoice_no:     string;
  invoice_date:   string;
  period_start?:  string;
  period_end?:    string;
  line_items:     InvoiceLineItem[];
  subtotal:       number;
  vat_pct:        number;
  vat_amount:     number;
  total:          number;
  payment_method: string;
  transaction_id: string;
  pdf_url:        string;
  support_email:  string;
}

export const InvoiceEmail = ({
  dealer,
  invoice_no,
  invoice_date,
  period_start,
  period_end,
  line_items,
  subtotal,
  vat_pct,
  vat_amount,
  total,
  payment_method,
  transaction_id,
  pdf_url,
  support_email,
}: InvoiceEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      Invoice {invoice_no} from AutoVerse — {formatBdtFull(total)} — Payment confirmed.
    </Preview>
    <Body style={S.body}>
      <Container style={S.container}>

        <Section style={S.header}>
          <Img src={LOGO_URL} alt="AutoVerse" height={28} />
        </Section>

        <Section style={S.body_section}>
          {/* SUCCESS BANNER */}
          <div style={S.success_box}>
            <Text style={{ ...S.p, margin: 0, fontWeight: '700', color: C.success }}>
              ✅ Payment Confirmed
            </Text>
            <Text style={{ ...S.pMuted, marginTop: '4px' }}>
              Transaction ID: <strong>{transaction_id}</strong> via {payment_method}
            </Text>
          </div>

          {/* INVOICE HEADER */}
          <Row style={{ margin: '24px 0 16px' }}>
            <Column>
              <Text style={S.info_label}>Invoice Number</Text>
              <Text style={{ ...S.info_value, fontSize: '18px', fontWeight: '700' }}>
                #{invoice_no}
              </Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={S.info_label}>Date</Text>
              <Text style={S.info_value}>{invoice_date}</Text>
              {period_start && period_end && (
                <>
                  <Text style={{ ...S.info_label, marginTop: '8px' }}>Period</Text>
                  <Text style={S.info_value}>{period_start} – {period_end}</Text>
                </>
              )}
            </Column>
          </Row>

          {/* BILL TO */}
          <div style={{ backgroundColor: C.background, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
            <Text style={{ ...S.info_label, marginBottom: '4px' }}>Billed To</Text>
            <Text style={{ ...S.p, margin: 0, fontWeight: '600' }}>
              {dealer.business_name}
            </Text>
            <Text style={{ ...S.pMuted, margin: 0 }}>
              {dealer.district}, Bangladesh
            </Text>
          </div>

          {/* LINE ITEMS TABLE */}
          <table style={{ ...S.emi_table }}>
            <thead>
              <tr>
                <th style={{ ...S.emi_header_cell, width: '55%' }}>Description</th>
                <th style={{ ...S.emi_header_cell, textAlign: 'center' as const }}>Qty</th>
                <th style={{ ...S.emi_header_cell, textAlign: 'right' as const }}>Unit Price</th>
                <th style={{ ...S.emi_header_cell, textAlign: 'right' as const }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {line_items.map((item, i) => (
                <tr key={i}>
                  <td style={i % 2 === 0 ? S.emi_cell : S.emi_cell_alt}>
                    {item.description}
                  </td>
                  <td style={{ ...(i % 2 === 0 ? S.emi_cell : S.emi_cell_alt), textAlign: 'center' as const }}>
                    {item.quantity}
                  </td>
                  <td style={{ ...(i % 2 === 0 ? S.emi_cell : S.emi_cell_alt), textAlign: 'right' as const }}>
                    {formatBdtFull(item.unit_price)}
                  </td>
                  <td style={{ ...(i % 2 === 0 ? S.emi_cell : S.emi_cell_alt), textAlign: 'right' as const, fontWeight: '600' }}>
                    {formatBdtFull(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTALS */}
          <div style={{ padding: '0 0 16px 0' }}>
            <Row style={{ padding: '8px 0' }}>
              <Column><Text style={{ ...S.p, margin: 0, color: C.textSecondary }}>Subtotal</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ ...S.p, margin: 0 }}>{formatBdtFull(subtotal)}</Text></Column>
            </Row>
            {vat_pct > 0 && (
              <Row style={{ padding: '8px 0' }}>
                <Column><Text style={{ ...S.p, margin: 0, color: C.textSecondary }}>VAT ({vat_pct}%)</Text></Column>
                <Column style={{ textAlign: 'right' }}><Text style={{ ...S.p, margin: 0 }}>{formatBdtFull(vat_amount)}</Text></Column>
              </Row>
            )}
            <Hr style={{ ...S.divider, margin: '8px 0' }} />
            <Row style={{ padding: '8px 0' }}>
              <Column>
                <Text style={{ ...S.p, margin: 0, fontWeight: '700', fontSize: '17px' }}>Total</Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ ...S.p, margin: 0, fontWeight: '700', fontSize: '17px', color: C.primary }}>
                  {formatBdtFull(total)}
                </Text>
              </Column>
            </Row>
          </div>

          {/* DOWNLOAD CTA */}
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={pdf_url} style={S.cta_button}>
              Download PDF Invoice
            </Button>
          </Section>

          <Hr style={S.divider} />

          <Text style={S.p}>
            Questions about this invoice? Contact us at{' '}
            <Link href={`mailto:${support_email}`} style={{ color: C.primary }}>
              {support_email}
            </Link>
          </Text>
        </Section>

        <Section style={S.footer}>
          <Text style={S.footer_text}>
            AutoVerse · Dhaka, Bangladesh ·{' '}
            <Link href={BASE_URL} style={S.footer_link}>autoverse.com.bd</Link>
          </Text>
          <Text style={{ ...S.footer_text, margin: 0 }}>
            This is an automated invoice. Please do not reply to this email.
          </Text>
        </Section>

      </Container>
    </Body>
  </Html>
);

export default InvoiceEmail;
```

---

## Template 8 — Dealer Welcome Email

**File: `DealerWelcome.tsx`**
**When sent:** Immediately after dealer account is approved by Operations Manager
**To:** Dealer owner's email
**Subject:** `Welcome to AutoVerse, {{business_name}}! Your account is live. 🚀`

```tsx
import {
  Html, Head, Body, Container, Section, Row, Column,
  Text, Heading, Button, Link, Img, Hr, Preview,
} from '@react-email/components';
import * as React from 'react';
import {
  S, C, BASE_URL, LOGO_URL, DealerInfo,
} from './_shared/styles';

interface DealerWelcomeProps {
  dealer:          DealerInfo;
  owner_name:      string;
  login_url:       string;
  onboarding_url:  string;
  support_whatsapp: string;
}

export const DealerWelcome = ({
  dealer,
  owner_name,
  login_url,
  onboarding_url,
  support_whatsapp,
}: DealerWelcomeProps) => {
  const dashboardUrl = `${BASE_URL}/app/dashboard`;
  const addVehicleUrl = `${BASE_URL}/app/inventory/add`;
  const supportLink  = `https://wa.me/${support_whatsapp.replace(/\D/g, '')}`;

  const steps = [
    {
      icon: '🚗',
      title: 'Add your inventory',
      desc: 'Scan VINs or enter manually. Your cars are on AutoVerse Marketplace the moment you hit save.',
      cta: 'Add Vehicles →',
      url: addVehicleUrl,
    },
    {
      icon: '💬',
      title: 'Set up your WhatsApp',
      desc: 'Connect your WhatsApp number so leads go straight to your phone. Takes 2 minutes.',
      cta: 'Set Up WhatsApp →',
      url: `${BASE_URL}/app/automation`,
    },
    {
      icon: '🌐',
      title: 'Publish your website',
      desc: 'Your dealer website at autoverse.com.bd/' + dealer.slug + ' is ready. Customise it in 5 minutes.',
      cta: 'Go Live →',
      url: `${BASE_URL}/app/website`,
    },
    {
      icon: '📊',
      title: 'Add your team',
      desc: 'Invite your salespeople so they can manage leads from their own phones.',
      cta: 'Invite Team →',
      url: `${BASE_URL}/app/settings/team`,
    },
  ];

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Welcome to AutoVerse, {dealer.business_name}! Your account is approved. Here's how to get your first lead within 7 days.
      </Preview>
      <Body style={S.body}>
        <Container style={S.container}>

          {/* HEADER */}
          <Section style={S.header}>
            <Img src={LOGO_URL} alt="AutoVerse" height={28} />
          </Section>

          <Section style={S.body_section}>
            {/* HERO */}
            <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
              <Text style={{ fontSize: '48px', margin: '0 0 8px 0', lineHeight: '1' }}>🚀</Text>
              <Heading style={{ ...S.h1, textAlign: 'center' }}>
                Welcome, {owner_name}!
              </Heading>
              <Text style={{ ...S.p, textAlign: 'center', color: C.textSecondary }}>
                {dealer.business_name} is now live on AutoVerse.
              </Text>
            </div>

            <Section style={{ textAlign: 'center', margin: '0 0 32px' }}>
              <Button href={login_url} style={S.cta_button}>
                Go to My Dashboard →
              </Button>
            </Section>

            {/* GETTING STARTED */}
            <Heading style={S.h2}>Get your first lead in 7 days</Heading>
            <Text style={S.p}>
              Most dealers get their first enquiry within a week. Follow these 4 steps:
            </Text>

            {steps.map((step, i) => (
              <Row key={i} style={{ marginBottom: '20px', alignItems: 'flex-start' }}>
                <Column style={{ width: '48px', verticalAlign: 'top' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    backgroundColor: C.primaryLight, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', lineHeight: '40px', textAlign: 'center',
                  }}>
                    {step.icon}
                  </div>
                </Column>
                <Column style={{ paddingLeft: '12px', verticalAlign: 'top' }}>
                  <Text style={{ ...S.p, fontWeight: '700', margin: '0 0 4px 0' }}>
                    Step {i + 1}: {step.title}
                  </Text>
                  <Text style={{ ...S.pMuted, margin: '0 0 6px 0' }}>
                    {step.desc}
                  </Text>
                  <Link href={step.url} style={{ color: C.primary, fontSize: '13px', fontWeight: '600' }}>
                    {step.cta}
                  </Link>
                </Column>
              </Row>
            ))}

            <Hr style={S.divider} />

            {/* PLAN INFO */}
            <div style={S.highlight_box}>
              <Text style={{ ...S.p, fontWeight: '700', margin: '0 0 8px 0' }}>
                Your Free Plan includes:
              </Text>
              {[
                '✅ Up to 10 vehicle listings',
                '✅ Full marketplace visibility on autoverse.com.bd',
                '✅ Your dealer website at autoverse.com.bd/' + dealer.slug,
                '✅ WhatsApp lead notifications',
                '✅ CRM with lead tracking',
              ].map((item, i) => (
                <Text key={i} style={{ ...S.p, margin: '0 0 4px 0' }}>{item}</Text>
              ))}
              <Hr style={{ ...S.divider, margin: '12px 0' }} />
              <Text style={{ ...S.pMuted, margin: 0 }}>
                Ready to unlock AI insights, automation, and unlimited listings?{' '}
                <Link href={`${BASE_URL}/app/settings/subscription`} style={{ color: C.primary }}>
                  See all plans →
                </Link>
              </Text>
            </div>

            <Hr style={S.divider} />

            {/* SUPPORT */}
            <Heading style={S.h2}>Need help? We're here.</Heading>
            <Text style={S.p}>
              Our Bangladesh-based support team speaks Bangla and English. Message us
              on WhatsApp — we respond within 2 hours during business hours.
            </Text>
            <Row>
              <Column>
                <Button href={supportLink} style={{ ...S.whatsapp_button, fontSize: '14px', padding: '10px 20px' }}>
                  💬 WhatsApp Support
                </Button>
              </Column>
              <Column style={{ paddingLeft: '12px' }}>
                <Button href={onboarding_url} style={{ ...S.cta_button, fontSize: '14px', padding: '10px 20px', backgroundColor: C.textSecondary }}>
                  📖 Setup Guide
                </Button>
              </Column>
            </Row>
          </Section>

          <Section style={S.footer}>
            <Text style={S.footer_text}>
              You're receiving this because your{' '}
              <Link href={BASE_URL} style={S.footer_link}>AutoVerse</Link>{' '}
              dealer account was just approved.
            </Text>
            <Text style={{ ...S.footer_text, margin: 0 }}>
              AutoVerse · Dhaka, Bangladesh · autoverse.com.bd
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

export default DealerWelcome;
```

---

## Email Rendering & Sending Service

**File: `apps/api/src/notifications/email/email.service.ts`**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import * as React from 'react';

import { LeadEnquiryConfirmation } from './templates/LeadEnquiryConfirmation';
import { LeadFinanceOptions }       from './templates/LeadFinanceOptions';
import { LeadExpiringOffer }        from './templates/LeadExpiringOffer';
import { DeliveryConfirmation }     from './templates/DeliveryConfirmation';
import { ServiceReminder }          from './templates/ServiceReminder';
import { WinBackEmail }             from './templates/WinBackEmail';
import { InvoiceEmail }             from './templates/InvoiceEmail';
import { DealerWelcome }            from './templates/DealerWelcome';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromBase = 'mail.autoverse.com.bd';

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get('RESEND_API_KEY'));
  }

  /** Send lead enquiry confirmation to buyer */
  async sendLeadEnquiryConfirmation(props: React.ComponentProps<typeof LeadEnquiryConfirmation>) {
    if (!props.buyer.email) return;
    const html = render(React.createElement(LeadEnquiryConfirmation, props));
    return this.send({
      from: `${props.dealer.business_name} <${props.dealer.slug}@${this.fromBase}>`,
      replyTo: props.dealer.slug + '@' + this.fromBase,
      to: props.buyer.email,
      subject: `Your enquiry about the ${props.vehicle.year} ${props.vehicle.make} ${props.vehicle.model}`,
      html,
      tags: [
        { name: 'template',  value: 'lead_enquiry_confirmation' },
        { name: 'dealer_id', value: props.dealer.slug },
      ],
    });
  }

  /** Send finance options Day 2 */
  async sendLeadFinanceOptions(props: React.ComponentProps<typeof LeadFinanceOptions>) {
    if (!props.buyer.email) return;
    const html = render(React.createElement(LeadFinanceOptions, props));
    return this.send({
      from: `${props.dealer.business_name} <${props.dealer.slug}@${this.fromBase}>`,
      to: props.buyer.email,
      subject: `Finance options for the ${props.vehicle.year} ${props.vehicle.make} ${props.vehicle.model}`,
      html,
      tags: [{ name: 'template', value: 'lead_finance_options' }],
    });
  }

  /** Send expiring offer Day 5 */
  async sendLeadExpiringOffer(props: React.ComponentProps<typeof LeadExpiringOffer>) {
    if (!props.buyer.email) return;
    const html = render(React.createElement(LeadExpiringOffer, props));
    return this.send({
      from: `${props.dealer.business_name} <${props.dealer.slug}@${this.fromBase}>`,
      to: props.buyer.email,
      subject: props.price_was_reduced
        ? `Price reduced! ${props.vehicle.year} ${props.vehicle.make} ${props.vehicle.model}`
        : `The ${props.vehicle.year} ${props.vehicle.make} ${props.vehicle.model} — still available?`,
      html,
      tags: [{ name: 'template', value: 'lead_expiring_offer' }],
    });
  }

  /** Send delivery confirmation post-sale */
  async sendDeliveryConfirmation(props: React.ComponentProps<typeof DeliveryConfirmation>) {
    if (!props.buyer.email) return;
    const html = render(React.createElement(DeliveryConfirmation, props));
    return this.send({
      from: `${props.dealer.business_name} <${props.dealer.slug}@${this.fromBase}>`,
      to: props.buyer.email,
      subject: `Congratulations on your new ${props.vehicle.year} ${props.vehicle.make} ${props.vehicle.model}! 🎉`,
      html,
      tags: [{ name: 'template', value: 'delivery_confirmation' }],
    });
  }

  /** Send service reminder (Day 30 or Day 365) */
  async sendServiceReminder(props: React.ComponentProps<typeof ServiceReminder>) {
    if (!props.customer.email) return;
    const html = render(React.createElement(ServiceReminder, props));
    const subject = props.service_type === 'first'
      ? `Time for your first service — ${props.vehicle.year} ${props.vehicle.make} ${props.vehicle.model}`
      : `Annual service time for your ${props.vehicle.make} ${props.vehicle.model} 🔧`;
    return this.send({
      from: `${props.dealer.business_name} <${props.dealer.slug}@${this.fromBase}>`,
      to: props.customer.email,
      subject,
      html,
      tags: [{ name: 'template', value: `service_reminder_${props.service_type}` }],
    });
  }

  /** Send win-back email */
  async sendWinBackEmail(props: React.ComponentProps<typeof WinBackEmail>) {
    if (!props.customer.email) return;
    const html = render(React.createElement(WinBackEmail, props));
    return this.send({
      from: `${props.dealer.business_name} <${props.dealer.slug}@${this.fromBase}>`,
      to: props.customer.email,
      subject: `Still looking for a car? New arrivals match your search 🚗`,
      html,
      tags: [{ name: 'template', value: 'win_back' }],
    });
  }

  /** Send invoice email with PDF attachment */
  async sendInvoiceEmail(
    props: React.ComponentProps<typeof InvoiceEmail>,
    ownerEmail: string,
  ) {
    const html = render(React.createElement(InvoiceEmail, props));
    return this.send({
      from: `AutoVerse Billing <billing@${this.fromBase}>`,
      to: ownerEmail,
      subject: `Invoice #${props.invoice_no} — AutoVerse — ${props.invoice_date}`,
      html,
      tags: [
        { name: 'template',  value: 'invoice' },
        { name: 'dealer_id', value: props.dealer.slug },
      ],
    });
  }

  /** Send dealer welcome email on account approval */
  async sendDealerWelcome(
    props: React.ComponentProps<typeof DealerWelcome>,
    ownerEmail: string,
  ) {
    const html = render(React.createElement(DealerWelcome, props));
    return this.send({
      from: `AutoVerse Team <hello@${this.fromBase}>`,
      to: ownerEmail,
      subject: `Welcome to AutoVerse, ${props.dealer.business_name}! Your account is live. 🚀`,
      html,
      tags: [{ name: 'template', value: 'dealer_welcome' }],
    });
  }

  // ─── Internal send helper ───────────────────────────────────────
  private async send(payload: {
    from: string;
    to: string;
    replyTo?: string;
    subject: string;
    html: string;
    tags?: { name: string; value: string }[];
  }) {
    try {
      const result = await this.resend.emails.send({
        from:    payload.from,
        to:      [payload.to],
        replyTo: payload.replyTo,
        subject: payload.subject,
        html:    payload.html,
        tags:    payload.tags,
      });

      this.logger.log(`Email sent: ${payload.subject} → ${payload.to} (id: ${result.data?.id})`);
      return result;
    } catch (error) {
      this.logger.error(`Email failed: ${payload.subject} → ${payload.to}`, error);
      // Do not rethrow — email failure should not break the parent flow
      // BullMQ automation-email worker handles retry logic
    }
  }
}
```

---

## Package Installation

```bash
# Install React Email packages
npm install @react-email/components @react-email/render react react-dom

# Types
npm install -D @types/react @types/react-dom

# Add to package.json scripts (for local preview during development)
# "email:dev": "email dev --dir apps/api/src/notifications/email/templates --port 3001"
# Then open http://localhost:3001 to preview all templates with hot reload
```

---

*AutoVerse — Step 15: React Email Templates*
*8 Production-Ready Components · React Email · Resend · v1.0*
