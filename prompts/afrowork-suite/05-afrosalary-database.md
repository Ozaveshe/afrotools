# Prompt 05 — AfroSalary Database: Crowdsourced African Salary Intelligence

## Identity

| Field | Value |
|-------|-------|
| **Name** | AfroSalary Database |
| **Tagline** | "Africa's salary data. By Africans. For Africans." |
| **Path** | `/tools/afrosalary-db/` |
| **CSS prefix** | `asd-` |
| **Accent color** | Teal `#0D9488` / dark `#0F766E` / pale `#F0FDFA` |
| **Engine** | `engines/afrosalary-engine.js` |
| **AI advisor key** | `"afrosalary-db"` in TOOL_CONTEXT |
| **Supabase tables** | `asd_salary_submissions`, `asd_verified_benchmarks`, `asd_submission_votes` |
| **Netlify function** | `netlify/functions/afrowork-salary.js` |

---

## Why This Is the Most Important SEO Tool in the Suite

**The Glassdoor gap:** Glassdoor, LinkedIn Salary, and PayScale have almost no reliable African salary data. A software engineer in Lagos, a nurse in Nairobi, or an accountant in Accra cannot find out what the market rate for their role is. They walk into salary negotiations blind.

**The flywheel:** Contribute your salary → earn AfroPoints → unlock full salary benchmarks → more people contribute → better data → more people come. With 10,000 submissions this becomes the most comprehensive African salary dataset in existence.

**Annual Salary Report:** Published every January. Press coverage guaranteed. This is the single highest-impact PR move available to AfroTools — every African HR media outlet, LinkedIn influencer, and business journalist will cite it.

**The competitive moat:** Mercer charges $5,000+ per report. Deloitte reward benchmarking is enterprise-only. AfroTools is free. Nobody else is doing this at scale for Africa.

---

## Data Model

```sql
create table asd_salary_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,  -- auth required to submit

  -- Role details
  job_title text not null,           -- "Software Engineer", "Nurse", "Accountant"
  job_family text not null,          -- "Engineering", "Healthcare", "Finance" (categorized)
  seniority text not null,           -- 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director' | 'c-suite'
  years_experience integer not null,

  -- Compensation
  base_salary numeric not null,
  currency text not null,            -- 'NGN', 'KES', 'ZAR', 'GHS', etc.
  pay_frequency text default 'monthly', -- 'monthly' | 'annual'
  bonus_annual numeric,              -- null if no bonus
  equity_annual_usd numeric,         -- null if no equity
  total_comp_annual numeric,         -- calculated field

  -- Benefits (boolean flags)
  has_health_insurance boolean default false,
  has_pension boolean default false,
  has_company_car boolean default false,
  has_remote_work boolean default false,
  has_housing_allowance boolean default false,
  has_transport_allowance boolean default false,

  -- Context
  country_code text not null,
  city text,
  company_size text,         -- 'startup-1-10' | 'small-11-50' | 'medium-51-200' | 'large-200-1000' | 'enterprise-1000+'
  company_type text,         -- 'startup' | 'sme' | 'corporate' | 'multinational' | 'government' | 'ngo'
  industry text not null,    -- 'fintech' | 'banking' | 'tech' | 'healthcare' | 'fmcg' | 'oil-gas' | 'telecoms' | 'consulting' | 'manufacturing' | 'education' | etc.
  employment_type text,      -- 'full-time' | 'contract' | 'part-time'
  gender text,               -- 'male' | 'female' | 'prefer-not-to-say' (for gender pay gap analysis)
  education text,            -- 'secondary' | 'diploma' | 'bachelors' | 'masters' | 'phd'

  -- Submission metadata
  submitted_year integer not null,   -- year of submission (salary is for this year)
  verified boolean default false,    -- AfroTools spot-check verification
  afropoints_awarded integer default 0,
  status text default 'active',      -- 'active' | 'flagged' | 'removed'
  created_at timestamptz default now()
);

-- Aggregated benchmarks (computed weekly, cached for fast reads)
create table asd_verified_benchmarks (
  id uuid primary key default gen_random_uuid(),
  job_family text not null,
  seniority text not null,
  country_code text not null,
  city text,          -- null = national
  industry text,      -- null = all industries
  year integer not null,
  currency text not null,
  p25 numeric,        -- 25th percentile
  p50 numeric,        -- median
  p75 numeric,        -- 75th percentile
  p90 numeric,        -- 90th percentile
  sample_size integer,
  last_computed timestamptz default now()
);
```

---

## Pages & Views

### Landing Page (`index.html`)

- Hero: teal gradient, dark background
- Headline: "What is your role actually worth in Africa?"
- Sub: "Crowdsourced salary data from 10,000+ African professionals. Free, anonymous, built for Africa."
- Two CTAs side by side: **"Find My Market Rate"** (primary) | **"Contribute My Salary"** (secondary, teal outline)
- Stats bar: "[X] salaries submitted · [Y] job titles · [Z] countries · Updated [date]"
- Top searches: "Software Engineer Lagos" | "Nurse Nairobi" | "Accountant Accra" | "Marketing Manager Cape Town" (clickable, auto-searches)
- AfroPoints pitch: "Contribute your salary → Earn 100 AfroPoints → Unlock full salary bands"
- Annual report teaser: "2026 African Salary Report — Download free →"
- Trust signals: Methodology note ("Anonymous · Your name is never shared · Company is never required")

### Salary Search (`search.html`)

**Search bar (hero, prominent):**
- Job title autocomplete (top 500 roles)
- Country selector
- Optional: city, industry, experience level

**Search Results:**
- Salary band visualization: horizontal bar showing p25 | median | p75 | p90
- "X salaries reported" below bar
- Currency shown in local + USD equivalent
- Percentile indicator: "If you earn [X], you're at the [68th] percentile"
- Filter chips: Entry | Mid | Senior | Lead | Manager | Director
- Industry filter: All | Fintech | Banking | Tech | Healthcare | etc.
- City filter: All | [Major cities for selected country]

**Data cards below bar:**
- Median base salary (large, prominent)
- Median total comp (with bonus/equity)
- Top-paying industry for this role
- Top-paying city for this role
- Gender pay gap indicator (if enough data): "Women earn X% [more/less] in this role"
- YoY change: "↑ 14% vs. 2025" (inflation vs. salary growth)

**Locked data (logged-out / unsubmitted):**
- p25 and p90 blurred, "Contribute your salary to unlock"
- Full industry breakdown locked
- City breakdown locked

### Salary Submission Flow (`contribute.html`)

Multi-step form. Mobile-optimized, one question per screen:

**Step 1 — Your Role**
- Job title (type-ahead autocomplete, 500+ roles)
- Job family (auto-assigned from title, editable)
- Seniority level (visual cards: Intern → Junior → Mid → Senior → Lead → Manager → Director → C-Suite)

**Step 2 — Your Pay**
- Monthly or Annual toggle
- Base salary (numeric input, currency auto-set from country)
- Annual bonus? Yes/No → if Yes, input amount
- Equity/stock options? Yes/No → if Yes, annual USD value
- Benefits checkboxes (health, pension, car, remote, housing, transport)

**Step 3 — Your Situation**
- Country → City (or "other city")
- Industry (dropdown)
- Company size (5 options)
- Company type (startup/SME/corporate/MNC/government/NGO)
- Years in role | Total years experience
- Employment type

**Step 4 — Optional Context**
- Gender (for gap analysis, clearly optional)
- Education level
- Reference year (defaults to current year)

**Step 5 — Confirmation**
- Summary card: "You're submitting: Senior Software Engineer · Lagos · NGN 450,000/month · 5 YOE"
- Privacy reminder: "Your submission is anonymous. No name, email, or company is shared."
- Submit → earn 100 AfroPoints

**Post-submission:**
- "Your salary has been added to the database"
- AfroPoints awarded animation
- "Now see where you stand →" → search results page for their role/country, now with full access
- "Share with a colleague" → WhatsApp: "I just contributed to AfroSalary — the free salary database for Africa. See where you stand: [link]"

---

## AI Integration

```javascript
"afrosalary-db": {
  name: "AfroSalary Database — Salary Intelligence for Africa",
  systemPrompt: `You are an African compensation and salary intelligence expert. You interpret salary data, benchmarks, and market trends for African professionals and employers.

Your role:
- Help users interpret their percentile position ("You're at the 72nd percentile — this means 72% of [role] in [city] earn less than you")
- Give negotiation guidance based on market data ("The range for your role is X–Y. Your ask of Z is at the 65th percentile — defensible")
- Explain why salaries vary by city, industry, company type, and company size in Africa
- Highlight the remote work premium: "Working for a US company from Lagos adds 80–150% to local market rates for tech roles"
- Explain the skills premium: "Adding Python to a Data Analyst CV in South Africa: +34% salary premium on average"
- Discuss the gender pay gap honestly where data shows it
- Explain inflation-adjusted real salary changes: "Your NGN salary grew 15% but CPI was 32% — your real salary fell 17%"
- Advise on when salary data might be stale or thin (small sample sizes)
- Help employers understand whether their compensation is competitive for attraction/retention

Data caveats:
- Always mention sample size when small (< 20 submissions for a segment)
- Be clear when data is extrapolated vs. directly reported
- Don't fabricate specific numbers — use ranges when data is limited

When a user shares their salary:
- Tell them their percentile immediately
- Tell them the top-paying industry for their role in their country
- Give one actionable thing they can do to move up the percentile range`,
  exampleQueries: [
    "What is the market rate for a product manager in Lagos?",
    "I earn KES 180,000 as a data analyst in Nairobi. Am I underpaid?",
    "What skills should I add to increase my salary in South Africa?",
    "Why do tech salaries in Cape Town differ so much from Johannesburg?",
    "I'm hiring a senior engineer in Accra. What should I budget?"
  ]
}
```

---

## Salary Benchmarking Algorithm

```javascript
// engines/afrosalary-engine.js
(function() {
  'use strict';

  const AfroSalaryEngine = {

    // Compute percentile for a salary within a benchmark
    getPercentile(salary, benchmark) {
      if (salary <= benchmark.p25) return Math.round((salary / benchmark.p25) * 25);
      if (salary <= benchmark.p50) return 25 + Math.round(((salary - benchmark.p25) / (benchmark.p50 - benchmark.p25)) * 25);
      if (salary <= benchmark.p75) return 50 + Math.round(((salary - benchmark.p50) / (benchmark.p75 - benchmark.p50)) * 25);
      if (salary <= benchmark.p90) return 75 + Math.round(((salary - benchmark.p75) / (benchmark.p90 - benchmark.p75)) * 15);
      return 90 + Math.min(10, Math.round(((salary - benchmark.p90) / benchmark.p90) * 10));
    },

    // Convert salary to USD at parallel rate (for cross-country comparison)
    toUSD(amount, currency, rates) {
      return rates[currency] ? amount / rates[currency] : null;
    },

    // Format local currency
    formatSalary(amount, currency) {
      const symbols = { NGN: '₦', KES: 'KES ', ZAR: 'R', GHS: 'GH₵', EGP: 'E£', ETB: 'Br' };
      const sym = symbols[currency] || currency + ' ';
      return sym + new Intl.NumberFormat().format(Math.round(amount));
    },

    // Get seniority label
    getSeniorityLabel(seniority) {
      const labels = {
        intern: 'Intern', junior: 'Junior (0–2 yrs)', mid: 'Mid-level (2–5 yrs)',
        senior: 'Senior (5–8 yrs)', lead: 'Lead / Staff (8–12 yrs)',
        manager: 'Manager', director: 'Director', 'c-suite': 'C-Suite / Executive'
      };
      return labels[seniority] || seniority;
    }
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.afroSalary = AfroSalaryEngine;
})();
```

---

## The Annual African Salary Report

Every January, publish a PDF report from the aggregated database:

- **Top 10 highest-paying roles in Africa**
- **Salary by country: Tech, Finance, Healthcare, FMCG**
- **Gender pay gap by country and sector**
- **Real salary growth vs. inflation (by country)**
- **Remote work premium by role**
- **Rising roles (fastest salary growth YoY)**
- **City vs. city comparisons: Lagos/Abuja, Nairobi/Mombasa, Johannesburg/Cape Town**

Distribution: Free PDF download, LinkedIn post, press release to BusinessDay, TechCabal, Quartz Africa, The Exchange. This generates thousands of backlinks and positions AfroTools as the authoritative source of African salary data.

---

## Cross-Tool Integration

- **Salary Compare tool** (`/tools/salary-compare/`): AfroSalary DB becomes the data backend. Static data → live crowdsourced data.
- **Job Offer Evaluator**: Benchmarks pulled from AfroSalary DB for real-time market comparison
- **AfroPayroll OS** (New Job journey): Salary benchmark step pulls from this database
- **Regulatory Alerts**: Salary data flags as potentially affected when PAYE bands change
- **Payroll API**: B2B clients can query salary benchmarks as an endpoint (premium tier)

---

## Fraud Prevention

Submissions must pass:
1. **Auth gate**: Must be signed in to submit (reduces spam)
2. **Range check**: Salary must be within 3σ of existing data for role/country (outliers flagged for review)
3. **Duplicate check**: Same user can only submit once per role/year
4. **AfroPoints cap**: Points only awarded for accepted submissions (not flagged/rejected)
5. **Volunteer verification spot-checks**: Team reviews random 5% of submissions monthly

---

## Privacy

- No name, employer name, or email ever shown publicly
- Minimum 5 submissions required before a data point is shown (no individual identification)
- Users can request deletion of their submission at any time (GDPR-style, even in Africa)
- All salary data stored encrypted at rest in Supabase
