# Prompt 20: Insight Engine (Aggregated Intelligence)

## Context

Read these files first:
- `supabase/migrations/` (all tables — calculation_history, email_leads, salary_submissions if created)
- `netlify/functions/api-history.js` (calculation history API)
- `netlify/functions/aggregate-salary-benchmarks.js` (existing aggregation)
- `assets/js/lib/analytics.js` (tracking events)
- `data/` directory (forex, fuel, rates data files)

AfroTools has calculators (tools) and data (forex/fuel/rates). What's missing is the ENGINE that connects them — turning raw calculation data into actionable insights for users.

## Objective

Build an **Insight Engine** that generates personalized and aggregated intelligence from platform data. This sits between raw data and user-facing features.

### Insight Types

1. **Personal Insights** (for logged-in users, based on their calculation history)
   - "Your effective tax rate is 15.2% — that's 2.1% lower than the average in Nigeria"
   - "You've calculated PAYE 8 times this quarter. Set up auto-reminders?"
   - "The Naira weakened 4.5% since your last forex calculation. Your USD equivalent salary dropped from $620 to $592."
   - "Based on your salary, you'd pay 8% less tax in Rwanda"

2. **Aggregated Insights** (for all users, anonymous trends)
   - "Most popular tools this week: Nigeria PAYE (+12%), Kenya PAYE (+8%)"
   - "Average salary calculated in Nigeria: ₦450,000/month (up 5% from last quarter)"
   - "Top countries by tool usage: 🇳🇬 NG (45%), 🇰🇪 KE (18%), 🇬🇭 GH (12%)"
   - "Fuel prices in Nigeria rose 15% this month — check your budget"

3. **Contextual Insights** (shown within tools based on current calculation)
   - After PAYE: "You're in the [X]% tax bracket. [Y]% of users in your country earn more."
   - After Forex: "This rate is 2% worse than the 30-day average"
   - After VAT: "Your effective VAT burden is [X]% of your total purchase"

### Architecture

```
Data Sources                    Insight Engine                    Delivery
─────────────                   ──────────────                    ─────────
calculation_history ──┐
salary_submissions ───┤
forex rates ──────────┤──→  Aggregation Jobs (scheduled) ──→  insight_cache table
fuel prices ──────────┤        │
central bank rates ───┘        ├──→ Personal insight generator
                               │
                               └──→ Contextual insight generator ──→  API endpoint
                                                                        │
                                                          ┌─────────────┼──────────────┐
                                                          ▼             ▼              ▼
                                                    Dashboard     Tool Pages    Monthly Digest
```

### New Table: `insight_cache`

```sql
CREATE TABLE insight_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_type TEXT NOT NULL,       -- 'personal' | 'aggregated' | 'contextual'
  scope TEXT NOT NULL,              -- 'global' | 'NG' | 'KE' | user_id
  tool_slug TEXT,                   -- nullable, for tool-specific insights
  insight_key TEXT NOT NULL,        -- unique identifier: 'avg_salary_ng', 'top_tools_weekly'
  insight_data JSONB NOT NULL,      -- the actual insight payload
  valid_until TIMESTAMPTZ NOT NULL, -- when this insight expires
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(insight_type, scope, insight_key)
);
```

## Constraints

- Aggregated insights must be computed from anonymized data only — never expose individual records
- Minimum sample sizes: 10 calculations before showing averages, 5 salaries before showing benchmarks
- Insights are cached with TTL (aggregated: 24h, contextual: 1h, personal: 6h)
- Follow IIFE pattern for client-side components
- Insight display must be non-intrusive — subtle cards/banners, not modals
- Personal insights require authentication
- Use existing design system tokens for insight cards
- Contextual insights appear BELOW the result, not interrupting it
- The scheduled job should be lightweight — pre-compute and cache, not compute on every request
- All monetary values in insights must use the user's preferred currency

## Implementation Steps

1. Create migration: `supabase/migrations/0XX-insight-cache.sql`
2. Create `netlify/functions/scheduled-generate-insights.js`:
   - Runs daily at 3 AM UTC
   - Aggregated insights:
     - Top tools by usage (weekly, monthly)
     - Average salary by country (from calculation_history, anonymized)
     - Forex trend summaries (from data files)
     - Fuel price change alerts
   - Write to `insight_cache` table with appropriate TTLs
3. Create `netlify/functions/api-insights.js`:
   - GET `/api/insights?type=aggregated&scope=NG` → returns cached insights
   - GET `/api/insights?type=personal` (auth required) → generates personal insights on demand
   - GET `/api/insights?type=contextual&tool=ng-salary-tax&gross=500000` → tool-specific context
4. Create `assets/js/components/insight-card.js`:
   - Web component `<afro-insight>` with `type` attribute
   - Renders insight as a subtle card with icon + text + optional action link
   - Dismissible with 7-day remember
   - Animate in on scroll (IntersectionObserver)
5. Integrate insights into tool pages:
   - After calculation, fetch contextual insights for current tool + inputs
   - Display below result as insight cards
6. Integrate insights into dashboard:
   - Personal insights section on dashboard home
   - "Your Activity" with trend data
7. Integrate insights into monthly digest email:
   - Include top aggregated insights for user's country
8. Add redirect: `/api/insights /.netlify/functions/api-insights 200`
9. Add scheduled function to `netlify.toml`
10. Run `npm run minify`

## Verification

- Manually trigger insight generation → check `insight_cache` table for entries
- Call `/api/insights?type=aggregated&scope=NG` → returns Nigeria insights
- Open PAYE calculator → calculate → insight cards appear below result
- Login → open dashboard → personal insights section shows data
- Insights should display correctly with design system styling
- Expired insights should auto-refresh on next request
- No individual user data visible in aggregated insights
