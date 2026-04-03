# Prompt 03 — Regulatory Change Alerts

## Identity

| Field | Value |
|-------|-------|
| **Name** | Regulatory Change Alerts |
| **Tagline** | "Know before your payroll breaks." |
| **Path** | `/tools/regulatory-alerts/` |
| **CSS prefix** | `ra-` |
| **Accent color** | Red `#DC2626` / dark `#991B1B` / pale `#FEF2F2` |
| **Engine** | `engines/regulatory-alerts-engine.js` |
| **AI advisor key** | `"regulatory-alerts"` in TOOL_CONTEXT |
| **Supabase tables** | `afrowork_regulatory_changes`, `afrowork_alert_subscriptions`, `afrowork_crowdsource_queue` |
| **Netlify function** | `netlify/functions/afrowork-alerts.js` |

---

## What This Is

Every time a minimum wage changes, a tax band shifts, a pension rate is amended, or a new social levy is introduced — every payroll in Africa breaks silently. Employers only find out when they get a penalty notice. Employees only find out when their payslip changes.

Regulatory Change Alerts solves this with two components:
1. **Official tracking**: AfroTools monitors government gazettes, finance act amendments, and central bank circulars for all 54 countries and logs changes
2. **Crowdsourcing**: AfroPoints rewards users who report changes before the AfroTools team has verified them

---

## The Change Log

Every regulatory change is stored in `afrowork_regulatory_changes`:

```sql
create table afrowork_regulatory_changes (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  change_type text not null,     -- 'minimum-wage' | 'paye-bands' | 'pension-rate' | 'social-security' | 'new-levy' | 'tax-threshold' | 'cit-rate' | 'filing-deadline'
  title text not null,           -- "Nigeria Minimum Wage Increase to NGN 70,000"
  summary text not null,         -- 1-2 sentences: what changed and what it means
  old_value text,                -- "NGN 30,000 / month"
  new_value text,                -- "NGN 70,000 / month"
  effective_date date not null,  -- when the change takes effect
  announced_date date,           -- when it was announced/gazetted
  source_url text,               -- link to official gazette or government press release
  source_name text,              -- "Official Gazette Vol. 111 No. 28"
  verified boolean default false, -- AfroTools team verified
  verified_by text,              -- 'afrotools-team' | 'crowdsource'
  tools_affected text[],         -- ['minimum-wage', 'ng-paye', 'payslip-generator'] — which tools to update
  created_at timestamptz default now(),
  submitted_by uuid references auth.users -- null for team submissions
);

create table afrowork_crowdsource_queue (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  change_type text not null,
  title text not null,
  description text,
  source_url text,
  submitted_by uuid references auth.users,
  afropoints_awarded integer default 0,
  status text default 'pending',  -- 'pending' | 'verified' | 'rejected' | 'duplicate'
  verified_at timestamptz,
  created_at timestamptz default now()
);
```

---

## Pages & Views

### Landing Page (`index.html`)

- Hero: red accent, dark background, headline "Know the moment your payroll laws change"
- Live ticker: recent changes scrolling — "Nigeria • 3 days ago — Minimum wage increased to NGN 70,000" style
- "Subscribe to Alerts" CTA → alert setup flow
- "Report a Change" CTA (secondary) → crowdsource submission form
- AfroPoints callout: "Earn 150 AfroPoints for every verified regulatory change you report first"
- Recent changes feed: last 10 verified changes, all countries
- Filter by country: flag chips
- Stats: "X changes tracked in 2026 · Y countries monitored · Z users alerted"

### Alerts Dashboard (`alerts.html`)

For subscribed users (auth required):

**My Subscriptions panel:**
- List of country + change-type combinations the user subscribed to
- Each row: flag + "Nigeria — All Changes" | "Kenya — PAYE only" with toggle to pause
- "Add subscription" button → country/type picker

**Change Feed:**
- Chronological feed of changes matching user's subscriptions
- Each change card: flag + title + date + old vs. new value + "What this means for me" expandable
- Expandable section uses AI to personalize: "Based on your salary of NGN 250,000, your new minimum wage check passes ✓ / your payslip will change by approximately NGN X"
- Affected tools listed: "Update your payslip in [Payslip Generator →]"

**All Changes (public, no auth):**
- Full public change log, filterable by country and change type
- Each change: country flag | date | title | summary | source link
- "Subscribe to get alerted" CTA on each card

### Crowdsource Submission (`report.html`)

A simple form any user can submit to report a regulatory change:

1. **Country** — dropdown
2. **Change Type** — select: Minimum Wage | PAYE Bands | Pension Rate | New Levy | Filing Deadline | Other
3. **Title** — short description of the change
4. **Details** — what changed, old vs. new value
5. **Source** — URL to official source (required for higher AfroPoints award)
6. **Effective date** — when it takes effect

Submission → stored in `afrowork_crowdsource_queue` → AfroTools team reviews → on verification:
- User earns **150 AfroPoints** (first to submit verified change)
- User earns **50 AfroPoints** (subsequent confirming submissions)
- Duplicate submissions earn 10 AfroPoints

Leaderboard on the page: "Top Reporters This Month" — name, country, changes reported, AfroPoints earned. This is a public recognition mechanic.

---

## Alert Delivery

### Email Alerts

Template for a regulatory change email:

```
Subject: 🇳🇬 Nigeria Minimum Wage Changed — Update Your Payroll

[Flag] Nigeria — Minimum Wage Update
Effective: March 1, 2026

What changed:
Old: NGN 30,000/month
New: NGN 70,000/month

What this means:
Any employee earning below NGN 70,000/month must have their salary adjusted immediately.
Failure to comply is an offence under the National Minimum Wage Act 2019.

Tools to update:
→ [Minimum Wage Checker]
→ [Payslip Generator]
→ [Staff Cost Calculator]

Source: Official Gazette Vol. 111 | [View Source →]

Manage your alerts → [Link]
```

### WhatsApp Alerts

```
*🔴 Nigeria Regulatory Alert*

*Minimum Wage Increase*
New rate: ₦70,000/month
Effective: 1 March 2026

Any employee below ₦70,000 must be updated now.

👉 Update payslip: afrotools.com/tools/payslip-generator/
📋 Full details: afrotools.com/tools/regulatory-alerts/
```

---

## Subscription Types

Users can subscribe to:
- All changes for a country ("Nigeria — Everything")
- Specific change types ("Nigeria — Minimum Wage only")
- Specific tools ("Alert me when data behind the Payslip Generator changes")
- All African changes (for compliance professionals, consultants)

```sql
-- Reuses afrowork_alert_subscriptions from Compliance Calendar
-- Additional fields for regulatory alerts:
-- alert_type: 'compliance-deadline' | 'regulatory-change' (differentiates the two tools)
-- change_types: text[] — ['minimum-wage', 'paye-bands'] or null for all
```

---

## AI Integration

```javascript
"regulatory-alerts": {
  name: "Regulatory Change Alerts — African Labour Law Monitor",
  systemPrompt: `You are an African regulatory compliance analyst. You monitor and explain regulatory changes across all 54 African countries, with focus on employment law, tax, and social security.

Your role:
- Explain what a regulatory change means in plain language for employers and employees
- Quantify the impact: "This change increases your monthly payroll cost by approximately X%"
- Tell users which tools they need to update and in what order
- Warn about transition deadlines: "You have until [date] to update payroll systems"
- Explain crowdsourcing: how to report changes, what qualifies for AfroPoints
- Know recent history: what changed in the last 12 months per country
- Help users understand if a reported change is real or rumour (common — "I heard minimum wage is increasing" → check if gazetted)

Never speculate about changes that haven't been officially announced. Say "not yet official" clearly when a change is rumoured.`,
  exampleQueries: [
    "Has the Nigeria minimum wage changed recently?",
    "What payroll changes are coming in South Africa in 2026?",
    "How do I report a regulatory change to earn AfroPoints?",
    "The Kenya AHL levy rate changed — which tools do I need to update?",
    "What happens to my payslip if the Ghana SSNIT rate changes?"
  ]
}
```

---

## Cross-Tool Integration

- **Compliance Calendar**: When a filing deadline date changes, auto-creates a regulatory change record and triggers alerts
- **All 14 payroll tools**: `tools_affected` array on each change record links directly to the tools whose data is now stale — "These 3 tools need updating" shown prominently
- **AfroSalary Database**: Salary benchmark data flagged as "may be affected" when PAYE bands change
- **AfroPayroll OS**: Regulatory change cards appear as "Heads up" alerts in the active workflow

---

## AfroPoints Integration

```javascript
// When a crowdsource submission is verified:
const AFROPOINTS_REWARDS = {
  first_verified_submitter: 150,
  subsequent_confirming_submitter: 50,
  duplicate_submitter: 10,
  report_with_official_source: 50,     // bonus on top of base
  report_with_correct_effective_date: 25  // bonus
};

// AfroPoints call (uses existing AfroPoints API/Supabase function):
await awardAfroPoints(userId, points, 'regulatory-report', changeId);
```

---

## Mobile UX

- Push notification support via Web Push API (prompt on subscription)
- Alert cards are swipeable: swipe right to "Saved", swipe left to "Dismiss"
- Crowdsource report form: 5 fields, mobile-optimized, can attach screenshot of source
- Live ticker on landing page: CSS marquee, pauses on touch
- "Share this change" → WhatsApp pre-filled message with change summary
