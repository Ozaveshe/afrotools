# Prompt 01 — Minimum Wage Checker (Upgrade Spec)

## Identity

| Field | Value |
|-------|-------|
| **Tool ID** | `minimum-wage` |
| **Name** | Minimum Wage Checker |
| **Tagline** | "Know the floor. Protect your rights." |
| **Path** | `/tools/minimum-wage/` |
| **CSS prefix** | `mw-` |
| **Accent color** | Green `#059669` / dark `#065F46` / pale `#ECFDF5` |
| **Engine** | `engines/minimum-wage-engine.js` |
| **AI advisor key** | `"minimum-wage"` in TOOL_CONTEXT |
| **Supabase tables** | `mw_wage_data`, `mw_crowdsource_reports`, `mw_alert_subscriptions` |
| **Netlify function** | `netlify/functions/minimum-wage-alerts.js` |

---

## Current State
54 African countries covered. Shows monthly/daily/hourly minimum wage. Living wage comparison bar chart. Historical wage trends. Sector-specific rates. AI observations sidebar. Chart.js visualizations.

## What's Missing (full upgrade list)

---

## Feature Upgrades

### 1. State / Province Breakdown
Nigeria has 36 states + FCT each setting their own minimum wage floor — Lagos differs from Oyo, Rivers differs from Kebbi. South Africa has sector-specific rates set by bargaining councils: MEIBC (engineering), domestic workers, farm workers, hospitality.

**Implementation:**
- Add `state_rates` array to wage data for NG and ZA
- Second dropdown appears after country: "Refine by state/sector (optional)"
- Nigeria: 36 states + FCT + Federal rate
- South Africa: Domestic Worker rate | Farm Worker rate | EPWP rate | General rate
- Morocco: industry sector rates (regulated sectors differ)

### 2. Sector-Specific Rates (all countries)
Domestic workers, farm workers, mining workers, and hospitality workers are the most exploited and most need this data.

**Sectors to cover:**
- Domestic workers (most African countries have a lower or equal sector rate)
- Agricultural / farm workers
- Mining (Nigeria, Zambia, South Africa, DRC)
- Hospitality / catering
- Security / guarding
- Construction

### 3. Compliance Checker Widget
The most actionable feature. Employer or employee inputs their actual salary → tool tells them if they're compliant.

**UI:**
- Toggle: "Check if I'm compliant"
- Input: "My monthly salary is [____] [NGN ▾]"
- Output A (compliant): "✓ Your salary of NGN 120,000 is NGN 50,000 above the NGN 70,000 minimum. You are compliant."
- Output B (non-compliant): "✗ Your salary of NGN 25,000 is NGN 45,000 BELOW the minimum wage of NGN 70,000. This is illegal. [What to do →]"
- "What to do" expands with: steps to report (Ministry of Labour, state-specific reporting body), template complaint letter link → Document Generator

### 4. Living Wage Gap Indicator
Show the gap between the legal minimum and what a living wage actually costs using Wageindicator Foundation data. This stat is viral.

**UI:**
- Three-tier bar: Legal Minimum | Living Wage (individual) | Living Wage (family of 4)
- Gap in % and absolute: "Nigeria minimum wage is NGN 70,000. A living wage for a Lagos family of 4 is NGN 210,000 — a 200% gap."
- Country ranking: "Nigeria has the 3rd largest legal-vs-living wage gap in Africa"

### 5. Inflation Erosion Tracker
"Nigeria minimum wage is NGN 70,000. In 2019 purchasing power, that equals NGN 21,000 — the real minimum wage has fallen 70%." This is a powerful, shareable insight.

**UI:**
- Timeline chart: nominal minimum wage vs. inflation-adjusted value from 2000 to today
- "Purchasing power today vs. [year] in [year]'s money"
- Selectable base year

### 6. Multi-Country Comparison Table
All 54 countries sortable by wage in USD PPP-adjusted. The "which African country pays workers the most?" table.

**UI:**
- Full 54-row sortable table: Country | Local Currency Rate | USD equivalent | PPP-adjusted | Last Updated
- Sort by any column
- "Export CSV" button (for HR teams and researchers)
- Flag + country name clickable — jumps to that country's detail view
- Top 10 / Bottom 10 filter

### 7. Regulatory Alert Subscription
"Notify me when Kenya minimum wage changes" — email or WhatsApp. Integrates with Regulatory Alerts tool.

**UI:**
- After viewing a country: "Get notified when [Kenya] minimum wage changes →"
- Email or WhatsApp input
- Stored in `mw_alert_subscriptions` → fed into `afrowork_alert_subscriptions`

### 8. AfroPoints Crowdsource — Report Violations
Community-verified employer violations (anonymous reporting). "My employer in Lagos garment sector pays NGN 20,000 — below minimum wage."

**UI:**
- "Report a violation" button (small, secondary)
- Form: sector, state/city, reported salary, industry — anonymous
- AfroPoints: 50 points for verified reports
- Data feeds `mw_crowdsource_reports` — moderated before public display
- Public display: "X violations reported this month in [sector/state]" aggregate stats only — no employer names without verification

### 9. Employer Bulk Export
CSV download of all 54 countries for compliance teams. Columns: Country, Sector, Monthly Rate, Local Currency, USD Equivalent, Effective Date, Law Reference.

### 10. Embeddable Widget
```html
<script src="https://afrotools.com/embed/minimum-wage.js"></script>
<div data-afrotools-widget="minimum-wage" data-country="NG"></div>
```
For labour NGOs, news sites, union websites. "Powered by AfroTools" badge links back.

---

## Pages & Views

### Landing Page (existing — upgrade)
- Add compliance checker widget above the fold (high-value action)
- Add living wage gap callout (shareable stat)
- Add "Compare all 54 countries" table below country detail

### Country Detail View (upgrade)
- State/sector breakdown (where applicable)
- Compliance checker
- Inflation erosion chart
- "Alert me when this changes" subscription
- Related tools: Staff Cost Calculator, Social Security, Payslip Generator

---

## AI System Prompt Upgrade

```javascript
"minimum-wage": {
  name: "Minimum Wage Checker — All 54 African Countries",
  systemPrompt: `You are an African minimum wage and labour compliance expert. You know current and historical minimum wage rates, sector-specific rates, and compliance requirements for all 54 African countries.

Your role:
- Confirm current minimum wage rates with effective dates
- Explain sector-specific variations (domestic workers, farm workers, etc.)
- Calculate the living wage gap: "The legal minimum is X but a living wage in [city] costs Y"
- Help employers check compliance: "Your salary of X is [above/below] the minimum by Y"
- Explain the inflation erosion story: real purchasing power vs. nominal rate
- Guide workers on what to do if paid below minimum: reporting body, process, template letters
- Compare wages across countries in PPP-adjusted USD
- Know when minimum wages changed recently and what changed
- Explain the political/economic context behind wage levels ("Nigeria's minimum wage hasn't increased since 2019 in real terms because...")

Always give the current rate with effective date. Never give a rate without the date it came into force.`
}
```

---

## Data Schema

```sql
create table mw_wage_data (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  state_province text,      -- null = national
  sector text default 'general',
  monthly_rate numeric not null,
  daily_rate numeric,
  hourly_rate numeric,
  currency text not null,
  effective_date date not null,
  law_reference text,
  source_url text,
  last_verified date,
  living_wage_individual numeric,  -- from Wageindicator
  living_wage_family numeric
);

create table mw_alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  email text,
  whatsapp text,
  created_at timestamptz default now()
);
```

---

## Cross-Tool Integration
- **Staff Cost**: Link — "Now calculate total employer cost at this salary"
- **Compliance Calendar**: "See PAYE filing deadlines for [country]"
- **Regulatory Alerts**: Minimum wage changes auto-trigger alerts to subscribers
- **Document Generator**: Non-compliant employers → "Generate a formal complaint letter"
- **AfroPayroll OS**: Step 1 of New Hire journey
- **WhatsApp Bot**: `MINWAGE Nigeria` command returns result from this engine

---

## Mobile UX
- Compliance checker: large salary input at top of mobile view (thumb-zone)
- Multi-country table: horizontal scroll with sticky country column
- Inflation chart: pinch-to-zoom on mobile
- "Share this rate" → WhatsApp pre-filled: "🇳🇬 Nigeria minimum wage is ₦70,000/month (March 2026). Check yours: [link]"
