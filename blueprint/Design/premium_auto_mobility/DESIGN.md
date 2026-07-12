---
name: Premium Auto Mobility
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#434655'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006e2d'
  on-secondary: '#ffffff'
  secondary-container: '#7cf994'
  on-secondary-container: '#007230'
  tertiary: '#784b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#996100'
  on-tertiary-container: '#ffeedd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#7ffc97'
  secondary-fixed-dim: '#62df7d'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005320'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  price-display:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-padding: 80px
---

## Brand & Style

This design system establishes a high-trust, premium automotive marketplace identity. It bridges the gap between high-end editorial car showcases and the functional efficiency required for a high-volume regional marketplace.

The visual style is **Corporate / Modern** with a focus on precision and clarity. It utilizes heavy whitespace to allow car photography to breathe, while employing structured navigation and filtering patterns that feel familiar to the local market. The emotional goal is to evoke a sense of reliability and "newness," even when browsing used inventory. 

Key brand pillars:
- **Trustworthy:** Rigorous alignment and systematic typography.
- **Premium:** Subtle elevations and a sophisticated "Outfit" heading style.
- **Efficient:** UX patterns optimized for quick search-to-result conversion.

## Colors

The palette is designed for high legibility and clear action hierarchy.
- **Primary Blue (#2563EB):** Used for primary actions, navigation, and active states. It represents stability and professional service.
- **Price Green (#16A34A):** Specifically reserved for pricing, "Sold" indicators, and secondary success actions. It emphasizes value.
- **Tertiary Amber (#F59E0B):** Used sparingly for "Premium" or "Featured" badges and urgency-based UI elements.
- **Neutral System:** A scale of cool grays used for borders, secondary text, and icons to maintain a clean, high-end aesthetic.

## Typography

The system uses a dual-font approach to balance character with utility. 
- **Outfit** is the "voice" of the brand, used for all headings. Its geometric nature gives it a contemporary, premium automotive feel.
- **Inter** is the "workhorse," used for all body text, data points, and technical specifications. It ensures maximum legibility for both English and Bengali scripts at small sizes.

For **Bengali text**, font-weight should be increased by one tier (e.g., use 500 where 400 is used for English) to maintain visual optical weight. Price displays always use Outfit Bold to ensure they stand out as the primary data point in a listing.

## Layout & Spacing

The design system utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

- **Desktop (1280px+):** Elements follow a strict grid with 24px gutters. Search filters are typically housed in a 3-column side rail or a persistent horizontal top-bar.
- **Mobile (<768px):** The layout reflows to a single column for listings. Card density increases to show at least 1.5 cards vertically on screen.
- **Vertical Rhythm:** A base-8 spacing system is used. Card-to-card spacing is 24px, while internal card padding is 16px.

## Elevation & Depth

This system uses **Tonal Layers** combined with **Ambient Shadows** to create a structured hierarchy without looking cluttered.

- **Level 0 (Base):** The Background (#F9FAFB) acts as the canvas.
- **Level 1 (Cards/Surface):** The White (#FFFFFF) surface. It uses a very soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.05)) to separate it from the background.
- **Level 2 (Hover/Active):** When a user interacts with a card or button, the shadow deepens and the element lifts slightly (y-offset: -2px) to provide tactile feedback.
- **Overlays:** Modals and dropdowns use a higher elevation with a darker backdrop blur (8px) to focus user attention on the task at hand.

## Shapes

The shape language is modern and approachable.
- **Container Radius (12px):** Used for all main cards, image containers, and secondary sections. This creates a soft, premium feel.
- **Interactive Radius (8px):** Applied to buttons and input fields to differentiate them from static content containers.
- **Badge/Chip Radius (999px):** Fully rounded "pill" shapes for IMV badges, "New" indicators, and category tags to ensure they are instantly recognizable as distinct labels.

## Components

### Car Listing Cards
High-fidelity cards featuring a 16:9 aspect ratio image. The price is displayed in the bottom left or right in `price-display` style. IMV (Verified) badges are pinned to the top-right of the image container as a 999px pill.

### Search Filters
Premium filter system using `Inter` with 8px rounded corners for inputs. Active filters are shown as removable chips (999px radius) above the results list.

### Buttons
- **Primary:** Solid #2563EB with white text, 8px radius.
- **Secondary:** Outlined with 1px border (#D1D5DB), 8px radius.
- **CTA (Sell Car):** Solid #16A34A to differentiate the "Sell" action from "Buy" actions.

### Inputs & Selects
Uses a light gray border (#E5E7EB) that transitions to #2563EB on focus. Height is standardized to 48px for better touch targets on mobile.

### Footer
A structured, 4-column footer on a dark neutral background (#111827) with high-contrast white text for better readability and a sense of "foundation."