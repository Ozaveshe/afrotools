# Prompt 07 — Payroll API: B2B Revenue Layer

## Identity

| Field | Value |
|-------|-------|
| **Name** | AfroTools Payroll API |
| **Tagline** | "African payroll compliance as an API." |
| **Path** | `/afrowork/api/` |
| **CSS prefix** | `papi-` |
| **Accent color** | Slate `#475569` / dark `#1E293B` / pale `#F8FAFC` |
| **Engine** | None (this IS the engine — Netlify function) |
| **Supabase tables** | `papi_api_keys`, `papi_usage_log`, `papi_plans` |
| **Netlify function** | `netlify/functions/afrowork-api.js` |

---

## What This Is

The Payroll API exposes AfroTools' calculation engine — all 14 payroll tools — as a REST API. Accountants, payroll SaaS startups, HR platforms, and fintechs can integrate African payroll compliance into their own products without rebuilding the regulatory logic.

**Revenue model:** Freemium. 100 API calls/month free. Paid plans from $29/month.
**This is the only B2B revenue model in AfroTools that doesn't touch the free user experience.**

---

## Why There Is Demand

- African payroll SaaS startups (Workpay, Salariopay, new entrants) need up-to-date regulatory data for 54 countries — expensive to maintain in-house
- Accounting firms building client portals need PAYE calculation without a full payroll system
- HR software vendors selling to Africa need compliance logic for countries they don't cover
- Fintechs building salary advances need net pay calculation for eligibility checks
- Digital banks need employment verification / net salary data for loan decisions

AfroTools has built and maintains this logic already. The API is monetizing existing infrastructure.

---

## API Endpoints

All endpoints: `POST https://api.afrotools.com/v1/payroll/`

Authentication: `Authorization: Bearer {api_key}` header on all requests.

### 1. PAYE Calculator
```
POST /v1/payroll/paye
Body:
{
  "country": "NG",
  "gross_salary": 450000,
  "currency": "NGN",
  "frequency": "monthly",  // "monthly" | "annual"
  "allowances": {
    "housing": 50000,
    "transport": 30000,
    "other": 0
  }
}

Response:
{
  "country": "NG",
  "gross_salary": 450000,
  "taxable_income": 370000,
  "paye": 38250,
  "net_salary": 411750,
  "effective_rate": 0.085,
  "band_breakdown": [
    { "band": "First 300,000", "rate": 0.07, "tax": 21000 },
    { "band": "Next 70,000", "rate": 0.11, "tax": 7700 },
    { "band": "Remaining 0", "rate": 0.15, "tax": 0 }
  ],
  "cra": 200000,
  "currency": "NGN",
  "tax_year": 2026,
  "law_reference": "Personal Income Tax Act (as amended 2023)"
}
```

### 2. Social Security / Pension
```
POST /v1/payroll/social-security
Body:
{
  "country": "KE",
  "gross_salary": 120000,
  "currency": "KES"
}

Response:
{
  "country": "KE",
  "gross_salary": 120000,
  "contributions": [
    { "scheme": "NSSF Tier I", "employee": 720, "employer": 720 },
    { "scheme": "NSSF Tier II", "employee": 6480, "employer": 6480 },
    { "scheme": "SHIF", "employee": 3300, "employer": 0 },
    { "scheme": "AHL", "employee": 1800, "employer": 1800 }
  ],
  "total_employee_deductions": 12300,
  "total_employer_contributions": 9000,
  "currency": "KES"
}
```

### 3. Minimum Wage Check
```
POST /v1/payroll/minimum-wage
Body:
{
  "country": "ZA",
  "sector": "general",  // "general" | "domestic" | "farm" | "expanded-public-works"
  "employment_type": "full-time"
}

Response:
{
  "country": "ZA",
  "sector": "general",
  "minimum_hourly": 27.58,
  "minimum_monthly_40hrs": 4773,
  "currency": "ZAR",
  "effective_date": "2026-03-01",
  "is_compliant": null,  // null when no salary provided to check against
  "law_reference": "National Minimum Wage Act 9 of 2018",
  "authority": "Department of Employment and Labour"
}

// With compliance check:
POST /v1/payroll/minimum-wage
Body: { "country": "ZA", "sector": "general", "proposed_salary": 5000, "currency": "ZAR" }

Response includes:
"is_compliant": true,
"margin_above_minimum": 227,
"margin_pct": 0.048
```

### 4. Full Payslip Calculation
```
POST /v1/payroll/payslip
Body:
{
  "country": "GH",
  "employee": {
    "name": "Kofi Mensah",
    "id": "EMP-001"
  },
  "period": { "month": 4, "year": 2026 },
  "earnings": {
    "basic": 5000,
    "housing": 1000,
    "transport": 500
  },
  "currency": "GHS"
}

Response:
{
  "earnings": { "basic": 5000, "housing": 1000, "transport": 500, "gross": 6500 },
  "deductions": {
    "paye": 812,
    "ssnit_employee": 357,
    "total": 1169
  },
  "employer_contributions": {
    "ssnit_employer": 877,
    "total": 877
  },
  "net_pay": 5331,
  "currency": "GHS",
  "period": "April 2026"
}
```

### 5. Overtime Calculation
```
POST /v1/payroll/overtime
Body:
{
  "country": "NG",
  "monthly_salary": 200000,
  "overtime_hours": 12,
  "day_type": "weekday"  // "weekday" | "weekend" | "public-holiday" | "night-shift"
}

Response:
{
  "base_hourly_rate": 1136.36,
  "multiplier": 1.5,
  "multiplier_label": "Standard Overtime",
  "overtime_pay": 20454.55,
  "total_monthly_pay": 220454.55,
  "law_reference": "Labour Act Cap L1, Section 13"
}
```

### 6. Leave Entitlements
```
POST /v1/payroll/leave
Body: { "country": "TZ", "employment_type": "full-time" }

Response:
{
  "country": "TZ",
  "annual_leave_days": 28,
  "sick_leave_days": 126,
  "maternity_leave_days": 84,
  "maternity_pay_pct": 100,
  "maternity_pay_source": "employer",
  "paternity_leave_days": 3,
  "paternity_pay_pct": 100,
  "public_holidays": 16,
  "total_days_off": 44,
  "law_reference": "Employment and Labour Relations Act 2004"
}
```

### 7. Staff Total Cost
```
POST /v1/payroll/staff-cost
Body:
{
  "country": "NG",
  "gross_salary": 300000,
  "currency": "NGN"
}

Response:
{
  "gross_salary": 300000,
  "employer_pension": 30000,
  "employer_nhis": 30000,
  "employer_itf": 3000,
  "employer_nsitf": 3000,
  "total_monthly_cost": 366000,
  "cost_premium_pct": 0.22,
  "currency": "NGN",
  "breakdown": [...]
}
```

---

## Pricing Plans

| Plan | Monthly Price | Calls/Month | Countries | SLA |
|------|--------------|-------------|-----------|-----|
| **Free** | $0 | 100 | All 54 | None |
| **Starter** | $29 | 5,000 | All 54 | Email support |
| **Growth** | $99 | 25,000 | All 54 | 24hr support |
| **Pro** | $299 | 100,000 | All 54 | Priority support + Slack |
| **Enterprise** | Custom | Unlimited | All 54 + custom | Dedicated SLA |

Overage: $0.01 per call above plan limit.

---

## API Key Management

```sql
create table papi_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  key_hash text not null unique,   -- hashed API key (bcrypt)
  key_prefix text not null,        -- first 8 chars shown in UI: "afro_sk_..."
  label text,                      -- "Production Key" | "Test Key"
  plan text default 'free',
  calls_this_month integer default 0,
  calls_limit integer default 100,
  active boolean default true,
  last_used_at timestamptz,
  created_at timestamptz default now()
);

create table papi_usage_log (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid references papi_api_keys(id),
  endpoint text not null,
  country text,
  response_time_ms integer,
  status_code integer,
  created_at timestamptz default now()
);
```

---

## API Docs Page (`/afrowork/api/`)

This is a static documentation page — no app logic, just documentation:

**Sections:**
1. **Overview** — what the API does, pricing, base URL
2. **Authentication** — how to get and use API keys
3. **Endpoints** — one section per endpoint with:
   - Method + path
   - Request body schema (JSON)
   - Response schema
   - Live "Try it" example (curl command)
   - Code examples: JavaScript (fetch), Python (requests), PHP (curl)
4. **Error Reference** — 400, 401, 403, 429, 500 codes with meaning
5. **Rate Limits** — per plan, per minute limits
6. **Changelog** — API version history
7. **SDKs** — future: Node.js, Python packages

**API Key Dashboard** (sub-page, auth required):
- Current plan + usage meter
- Generate / revoke API keys
- Usage chart (calls per day, last 30 days)
- Upgrade plan button → Stripe checkout (future)
- Usage logs table

---

## Netlify Function

```javascript
// netlify/functions/afrowork-api.js
// All payroll API endpoints routed through this function

exports.handler = async (event) => {
  // 1. Extract and validate API key from Authorization header
  // 2. Check rate limit (calls_this_month < calls_limit)
  // 3. Route to correct calculation function based on path
  // 4. Log usage to papi_usage_log
  // 5. Return JSON response

  const apiKey = event.headers['authorization']?.replace('Bearer ', '');
  if (!apiKey) return { statusCode: 401, body: JSON.stringify({ error: 'Missing API key' }) };

  // Key lookup: hash incoming key, find in papi_api_keys
  // Rate limit check
  // Route: /v1/payroll/paye → payeCalculator(body, country)
  //        /v1/payroll/social-security → socialSecurityCalculator(body)
  //        /v1/payroll/minimum-wage → minimumWageCheck(body)
  //        /v1/payroll/payslip → payslipCalculator(body)
  //        /v1/payroll/overtime → overtimeCalculator(body)
  //        /v1/payroll/leave → leaveEntitlements(body)
  //        /v1/payroll/staff-cost → staffCostCalculator(body)
};
```

---

## Cross-Tool Integration

- All 14 payroll tool engines are the source of truth — API calls the same calculation functions
- API data freshness: when a regulatory change is logged in `afrowork_regulatory_changes`, the API calculation functions are updated in the same deploy
- Compliance Calendar data available via `GET /v1/compliance/deadlines?country=NG&month=4&year=2026`
- AfroSalary benchmarks available via `GET /v1/salary/benchmark?role=software-engineer&country=NG&seniority=senior` (premium tier only)

---

## Go-to-Market

- **Documentation quality** is the product: clean docs, good examples, quick start guide
- **Postman collection**: publish a public Postman collection so developers can test immediately
- **GitHub README**: if AfroTools open-sources the docs, GitHub traffic converts to API signups
- **Target channels**: TechCabal, Paystack developer community, Nigerian fintech Slack groups, KCB/Equity Bank developer portals
- **Referral**: "Built with AfroTools Payroll API" badge → API users display on their product → backlinks + brand
