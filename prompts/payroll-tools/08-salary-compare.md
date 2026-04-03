# Prompt 08 — African Salary Compare (Upgrade Spec)

## Identity

| Field | Value |
|-------|-------|
| **Tool ID** | `salary-compare` |
| **Name** | African Salary Compare |
| **Tagline** | "What is your role actually worth? Find out." |
| **Path** | `/tools/salary-compare/` |
| **CSS prefix** | `scy-` |
| **Accent color** | Rose `#E11D48` / dark `#9F1239` / pale `#FFF1F2` |
| **Engine** | `engines/salary-compare-engine.js` |
| **AI advisor key** | `"salary-compare"` in TOOL_CONTEXT |
| **Supabase tables** | Uses `asd_verified_benchmarks` from AfroSalary Database |
| **Netlify function** | `netlify/functions/afrowork-salary.js` (shared with AfroSalary DB) |

---

## Current State
15 countries. PPP adjustments. Role/industry/experience filtering. Salary bars comparison. Currency toggle (USD/local). Cost-of-living factors. Skill premium data.

## What's Missing (full upgrade list)

---

## Feature Upgrades

### 1. AfroSalary DB Integration (Live Crowdsourced Data)
This is the transformation of the tool. Currently static data. After AfroSalary Database is built, salary-compare becomes its front-end. Static → living database.

**Implementation:**
- Query `asd_verified_benchmarks` for role + country + seniority
- Show p25/median/p75/p90 from real submissions
- "Based on X salary reports" — real sample size shown
- "Data last updated: [date]" — freshness indicator
- Fallback to static data if <5 submissions for a segment

### 2. Negotiation Band Calculator
"The range for your role is X–Y. Your ask of Z is at the 68th percentile. It is defensible. Here is the framing."

**UI:**
- After seeing the band: "Where am I negotiating?"
- Input: "My current ask is [____]"
- Output: percentile position + negotiation coaching:
  - Below p50: "You're asking below the median — consider going higher. The market supports it."
  - p50–p75: "Strong ask. Defensible with the right framing."
  - p75–p90: "Premium ask. You need a strong story: specialist skills, urgency, competing offers."
  - Above p90: "Aggressive ask — you'll need leverage (another offer, rare skill) to land this."
- Negotiation script: "Here's how to say it: 'Based on market data for [role] in [city], the range is X–Y. Given my [X years experience / specific skill], I'm targeting Z.'"

### 3. Remote Work Premium
"Working for a US company from Lagos: expected salary premium 80–150% over local market rate."

**UI:**
- Toggle: "Remote/diaspora employer"
- Select: employer country (US, UK, EU, Canada, Australia)
- Shows: expected premium over local rate for this role
- "USD equivalent at local market rate: $1,200/month. Remote employer typical rate: $2,200–$3,500/month."
- "Negotiation floor for remote work: never accept less than 1.5× local market rate"

### 4. Skills Premium Database
"Adding Python to a Data Analyst CV in South Africa: +34% salary premium."

**UI:**
- After viewing role benchmark: "Boost your salary with skills"
- Role-specific skill recommendations with premium %
- Examples:
  - Data Analyst + Python: +34%
  - Software Engineer + AWS: +28%
  - Finance Analyst + SQL: +22%
  - HR Manager + HRIS certification: +18%
- Source: calculated from AfroSalary DB submissions that include skills
- "These skills add the most value in [country]" section

### 5. Gender Pay Gap by Country and Sector
This data doesn't exist publicly for Africa. AfroTools can surface it from AfroSalary DB submissions.

**UI:**
- "Gender pay gap" toggle (only appears when sufficient data)
- Shows: "In Nigeria's banking sector, women at Senior Manager level earn 18% less than men"
- Bar chart: male median vs. female median for selected role
- Country ranking: which African countries have the smallest gender pay gap
- Disclaimer: "Based on AfroSalary Database submissions — sample may not be representative"
- This is a media magnet — publish annually with press release

### 6. City-Level Breakdown
Lagos vs. Abuja, Nairobi vs. Mombasa, Cape Town vs. Johannesburg, Accra vs. Kumasi.

**UI:**
- After selecting country: "Refine by city"
- City dropdown populated from AfroSalary DB submissions for that country
- City comparison bars: e.g., "Lagos +12% vs. Abuja median for Software Engineers"

### 7. Inflation-Adjusted Salary Trend
"Your NGN salary is up 15% but inflation was 32%. Your real salary fell 17%."

**UI:**
- Year-over-year salary change for selected role/country
- Inflation rate for that country overlay
- Real salary change = nominal change − inflation
- "Real salary growth" highlighted in red where negative
- "Has your salary kept up with inflation?" personalized check

### 8. Promotion Timeline Benchmarks
"Average time from Junior to Mid in Lagos fintech: 2.1 years."

**UI:**
- Section: "Career progression timeline"
- Role family + country → median time to next level
- Comparison: startup vs. corporate vs. multinational in same country
- "Are you overdue a promotion? The median Junior-to-Mid in your sector is 2.1 years. You've been Junior for 3 years."

### 9. Annual African Salary Report
See AfroSalary Database prompt (05) — salary-compare is the primary surface for this report's data visualizations.

---

## AI System Prompt Upgrade

```javascript
"salary-compare": {
  name: "African Salary Compare — Market Rate Benchmarking",
  systemPrompt: `You are an African compensation intelligence expert. You know salary benchmarks, market rates, and compensation trends for all roles across all 54 African countries.

Your role:
- Give specific salary ranges for any role/country/seniority combination
- Help users understand their percentile position ("You're at the 72nd percentile")
- Coach on salary negotiation: what to say, how to frame the ask, what leverage to use
- Explain the remote work salary premium: "For a UK company, expect 2–2.5× local market rate"
- Highlight skills that increase salary most for a given role
- Discuss the gender pay gap honestly where data exists
- Explain city-level salary differences within countries
- Show real (inflation-adjusted) salary trends: "Nominal up 15% but real fell 17%"
- Advise employers on competitive compensation: "To attract top engineers in Lagos, you need to be at the 75th percentile minimum"

Data context: Salary data comes from AfroSalary Database (crowdsourced submissions from African professionals) + curated market research. Always mention if sample size is small.

Negotiation principles for Africa:
- Know your market rate before negotiating — the biggest mistake is not knowing
- Counter-offers are expected — the first offer is rarely the best
- Benefits have real value: health insurance, car, remote work — quantify them
- For USD-remote jobs: never accept below local p75 equivalent in USD`
}
```

---

## Cross-Tool Integration
- **AfroSalary Database**: Backend data source — these tools are the same product at different levels
- **Job Offer Evaluator**: Salary benchmark feeds into offer evaluation
- **AfroPayroll OS** (New Job journey): Benchmark step uses this tool
- **Staff Cost**: Employers use salary-compare to set competitive salary before calculating total cost
- **Labour Law Advisor**: "Is my salary below what I should be earning? Do I have recourse?"
- **WhatsApp Bot**: `SALARY software engineer lagos` command
