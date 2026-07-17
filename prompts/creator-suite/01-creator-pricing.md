# Prompt 01 — CreatorPricing: Smart Pricing Calculator

## Identity

| Field | Value |
|-------|-------|
| **Name** | CreatorPricing |
| **Tagline** | "Know your worth. Charge it." |
| **Path** | `/tools/creator-pricing/` |
| **CSS prefix** | `cp-` |
| **Accent color** | Coral `#FF6B6B` / dark `#E85D5D` / pale `rgba(255,107,107,0.08)` |
| **Engine** | `engines/creator-pricing-engine.js` |
| **AI advisor key** | `"creator-pricing"` in TOOL_CONTEXT |
| **Supabase tables** | `creator_pricing_rates`, `creator_pricing_projects` |
| **Netlify function** | `netlify/functions/creator-pricing.js` (market data API) |

---

## Design Philosophy

This is NOT a calculator with input fields and a result box. This is a **pricing confidence tool** — it should feel like talking to a senior creative who's been in the industry for 20 years and is telling you what you're worth.

**Visual personality:**
- Bold, warm, empowering — the coral accent radiates confidence
- Large typography for the final price output — the number should feel like a statement
- Card-based flow, not a form — each step is a swipeable card on mobile
- Subtle background gradient: dark navy (`#0A1628`) → charcoal, with coral accent glows
- Animated price counter that rolls up to the final number (like a slot machine landing)
- The "you're undercharging" insight should feel like a gentle wake-up call, not a lecture

**Mobile-first UX:**
- Full-screen card flow — one question per screen, swipe or tap to advance
- Bottom-anchored "Next" button (thumb-zone friendly, 56px tall)
- Results page is a single scrollable card with shareable rate card at the bottom
- Touch-friendly sliders for experience level and project complexity
- No horizontal scrolling anywhere — everything stacks vertically
- Skeleton loading for market data comparisons

---

## Pages & Views

### 1. Landing Page (`index.html`)
Standard AfroTools tool landing page pattern using `tool-landing.css`:
- Hero with breadcrumb, eyebrow badge, h1 "Know Your Worth. Charge It.", subtitle about African creative market rates
- "Calculate My Rate" CTA button (coral accent)
- Features grid: Market Rates, Project Quoter, Negotiation Coach, Rate Evolution
- How It Works: 3-step visual (Tell us your craft → Get your rate → Share your rate card)
- Who It's For: Photographers, Videographers, Designers, Musicians, Writers, Developers
- FAQ accordion (6 questions about methodology, data sources, accuracy)
- Last updated badge showing when market data was refreshed

### 2. Calculator App (`app.html`)
The main experience — a multi-step, card-based flow:

**Step 1 — Your Craft** (full-screen card)
- Large icon grid (3×2 on mobile, 3×3 on desktop):
  - Photography (camera icon)
  - Videography / Film (clapperboard)
  - Graphic Design (pen tool)
  - Music Production (waveform)
  - Writing / Copywriting (pen)
  - Web / App Development (code brackets)
  - Social Media Management (megaphone)
  - Fashion Design (scissors)
  - Illustration / Art (brush)
  - Voice Over / Audio (microphone)
  - Event Planning (calendar star)
  - Other (custom input)
- Tapping a craft highlights it with coral glow, advances to step 2

**Step 2 — Your Specialty** (depends on craft selected)
- Dynamic sub-options. E.g., Photography → Wedding | Portrait | Product | Fashion | Event | Real Estate | Food
- Chip/pill selector — multi-select allowed, primary specialty highlighted
- "I do a bit of everything" option at the bottom

**Step 3 — Your Details**
- Country (dropdown, top 15 African countries + Other)
- City (text input with autocomplete for major cities)
- Experience level: visual slider with labels
  - Beginner (0-1 yr) | Developing (1-3 yr) | Established (3-5 yr) | Expert (5-10 yr) | Master (10+ yr)
  - Slider has a coral gradient fill and snaps to positions
- Currency (auto-populated from country, editable)

**Step 4 — Results Dashboard** (scrollable, multi-section)

**Section A — Your Rate Range**
- Giant animated number: "₦85,000 — ₦150,000" (per day rate)
- Below: "per day" / "per hour" / "per project" toggle tabs
- Contextual label: "For an Established Wedding Photographer in Lagos"
- Confidence indicator: coral bar showing where you likely fall in the range

**Section B — Market Comparison**
- Horizontal bar chart (lightweight, CSS-only or Chart.js):
  - Your estimated rate vs. City average vs. National average vs. Top 10% earners
  - Each bar is labeled with the actual number
- "You're in the top 35% of Lagos wedding photographers" — motivational context

**Section C — Rate Breakdown**
- Card stack showing rates for different project types:
  - Half-day shoot: ₦50,000 – ₦85,000
  - Full-day shoot: ₦85,000 – ₦150,000
  - Wedding (full): ₦200,000 – ₦450,000
  - Per edited photo: ₦3,000 – ₦8,000
- Each card is tappable to expand with "what's included at this rate" suggestions

**Section D — AI Pricing Advisor** (requires auth)
- Chat-style interface embedded in the results
- Pre-loaded prompt: "Based on your profile, here's what I'd recommend..."
- AI gives personalized advice: when to charge premium, when to offer packages, what to never discount
- Follow-up suggestions: "Ask me about negotiation tactics" / "Help me quote a specific project"

**Section E — Shareable Rate Card**
- Auto-generated visual rate card with the creator's name, craft, rates, and "Powered by AfroTools"
- "Copy Link" and "Share to WhatsApp" buttons (WhatsApp is primary — green button, prominent)
- "Download as Image" option for sharing on Instagram stories
- The rate card has a beautiful design — coral accent, clean typography, professional look

### 3. Project Quoter (`quote.html`)
A separate flow for quoting specific projects:

- "Describe your project" — large textarea with AI assist
- OR structured input: Project type, Duration, Deliverables count, Travel required?, Editing included?, Rush job?
- AI analyzes and generates:
  - Itemized quote with line items
  - Suggested total with range (minimum / recommended / premium)
  - "Don't forget to charge for:" section (travel, editing time, raw files, commercial usage rights)
  - "Red flags in this brief:" section (if applicable)
- Export as PDF quote or copy as text for WhatsApp

---

## AI Integration (TOOL_CONTEXT for ai-advisor.js)

```javascript
"creator-pricing": {
  name: "CreatorPricing — Smart Pricing Calculator",
  systemPrompt: `You are a pricing advisor for African creative professionals. You have deep knowledge of creative industry rates across all 54 African countries, with special expertise in Nigeria, Kenya, South Africa, Ghana, Tanzania, and Egypt.

Your role:
- Help creators understand their market value and charge appropriately
- Provide specific, actionable pricing advice — not vague platitudes
- Know the difference between rates in Lagos vs Nairobi vs Johannesburg vs Accra
- Understand that undercharging is the #1 problem for African creatives
- Be encouraging but honest — if they're undercharging, say so directly
- Factor in: experience, portfolio quality, market demand, city cost of living, client type (corporate vs SME vs individual)
- Know about ancillary charges: travel, editing, usage rights, rush fees, revision limits
- Help with negotiation language that's firm but professional
- Understand African business culture — relationships matter, but so does getting paid fairly

When given a creator's profile (craft, specialty, experience, city, country), provide:
1. A specific rate range (not "it depends")
2. What justifies the higher end of the range
3. One thing they should start charging for that they probably aren't
4. A negotiation phrase they can use when clients push back

Always give numbers in the creator's local currency. Be specific, not generic.`,
  exampleQueries: [
    "What should I charge for a wedding shoot in Lagos?",
    "A client says my rate is too high. How do I respond?",
    "Should I charge per photo or per hour for product photography?",
    "How do I price a music production package in Nairobi?",
    "What's a fair rate for social media management in Accra?"
  ]
}
```

---

## Market Rate Data

The pricing engine needs baseline rate data. Store in Supabase (`creator_pricing_rates` table) and cache client-side:

```
Schema: creator_pricing_rates
- id (uuid)
- craft (text) — photography, videography, design, music, writing, dev, social-media, fashion, illustration, voiceover, events
- specialty (text) — wedding, portrait, product, etc.
- country_code (text) — NG, KE, ZA, GH, TZ, EG, etc.
- city (text, nullable) — Lagos, Nairobi, etc. (null = national average)
- experience_level (text) — beginner, developing, established, expert, master
- rate_type (text) — hourly, daily, project, per-unit
- rate_min (integer) — in local currency minor units
- rate_max (integer)
- rate_median (integer)
- currency (text) — NGN, KES, ZAR, GHS, etc.
- sample_size (integer) — how many data points
- last_updated (timestamp)
- notes (text, nullable) — e.g., "Wedding rates spike Dec-Jan"
```

Seed with researched data for top 6 countries × top 6 crafts × 5 experience levels. AI fills gaps with interpolation.

---

## Netlify Function (`creator-pricing.js`)

Endpoints:
- `GET /rates?craft=photography&specialty=wedding&country=NG&city=Lagos&experience=established`
  → Returns rate data + comparisons
- `POST /quote` — body: `{ craft, specialty, projectDescription, country, city }`
  → Returns AI-generated quote breakdown

---

## Engine (`creator-pricing-engine.js`)

```javascript
// IIFE pattern matching existing engines
(function() {
  'use strict';

  const CreatorPricing = {
    id: 'creator-pricing',
    version: '1.0.0',

    // Calculate rate range for a creator profile
    calculateRate(profile) {
      // profile: { craft, specialty, country, city, experience, currency }
      // Returns: { min, max, median, percentile, comparison, breakdown }
    },

    // Generate project quote from description
    async generateQuote(project) {
      // project: { craft, type, duration, deliverables, travel, rush }
      // Returns: { lineItems[], subtotal, recommended, premium, forgottenCharges[] }
    },

    // Get market comparison data
    getComparison(profile) {
      // Returns: { cityAvg, nationalAvg, top10pct, yourEstimate, percentileRank }
    },

    // Format rate for display
    formatRate(amount, currency) {
      // Returns formatted string: "₦85,000" or "KES 12,000"
    },

    // Get specialties for a craft
    getSpecialties(craft) {
      // Returns array of specialty objects with labels and icons
    },

    // Get supported countries with their currencies
    getCountries() {
      // Returns top African countries with currency codes
    }
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.creatorPricing = CreatorPricing;
})();
```

---

## Data Flow

```
User selects craft → specialties load
User selects specialty → details form appears
User fills details → engine.calculateRate() called
Rate data returned → Results dashboard renders
User taps "AI Advisor" → ai-advisor.js called with full context
User taps "Quote a Project" → navigates to quote.html
User describes project → engine.generateQuote() + AI analysis
Quote generated → shareable output
```

---

## Cross-Tool Integration

- **CreatorInvoice**: "Use this rate" button on results page pre-fills invoice line items
- **CreatorKit**: Rate card data feeds into media kit rate section
- **CreatorMoney**: Historical rates tracked over time → "Your rates have grown 40% this year"
- **CreatorDesk**: When creating a new project, pricing suggestions based on client history

---

## Mobile Interaction Patterns

- **Swipe between steps**: CSS scroll-snap on the card container, horizontal swipe advances
- **Pull-to-refresh**: On results page, pulls fresh market data
- **Long-press rate card**: Opens share sheet (WhatsApp, copy, download)
- **Haptic feedback** (where supported): Subtle vibration when price counter finishes rolling
- **Bottom sheet for AI**: The AI advisor slides up from bottom as a half-sheet, expandable to full-screen
- **Sticky CTA bar**: On results page, a sticky bottom bar with "Share Rate Card" and "Quote a Project" buttons

---

## Accessibility

- All interactive elements have focus states and aria-labels
- Price outputs use aria-live="polite" for screen reader announcements
- Slider has keyboard support (arrow keys) and announces current value
- Color is never the only indicator — icons and labels accompany all states
- Minimum contrast ratio 4.5:1 on all text

---

## Performance

- Landing page: static HTML, no JS required
- App page: engine JS + Chart.js (lazy-loaded only for comparison chart)
- Rate data cached in localStorage with 24h TTL
- AI calls are user-initiated only (button tap), never automatic
- Skeleton screens while data loads — matching the card layout exactly
- Images: SVG icons only, no raster images on the calculator pages
- Target: < 100KB total JS, < 50KB CSS, LCP < 2s on 3G
