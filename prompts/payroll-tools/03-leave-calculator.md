# Prompt 03 — Leave Calculator (Upgrade Spec)

## Identity

| Field | Value |
|-------|-------|
| **Tool ID** | `leave-calculator` |
| **Name** | Leave Calculator |
| **Tagline** | "Know your time. Know your rights." |
| **Path** | `/tools/leave-calculator/` |
| **CSS prefix** | `lc-` |
| **Accent color** | Blue `#0284C7` / dark `#0369A1` / pale `#E0F2FE` |
| **Engine** | `engines/leave-engine.js` |
| **AI advisor key** | `"leave-calculator"` in TOOL_CONTEXT |
| **Supabase tables** | `lc_leave_tracker` (per user, auth-gated) |
| **Netlify function** | none required |

---

## Current State
All 54 countries. Annual leave, sick leave, maternity leave (days + pay %), paternity leave (days + pay %), public holiday count. Law references. AI observations.

## What's Missing (full upgrade list)

---

## Feature Upgrades

### 1. Leave Accrual Calculator
"I've worked 9 months of my 12-month entitlement year. How many days have I accrued? Can I take 2 weeks now?"

**UI:**
- Toggle: "Check my accrual" (secondary mode)
- Inputs: Start date, today's date, annual entitlement (auto-filled from country)
- Output: Days accrued, days remaining, whether requested days are available
- Formula displayed: "You've worked 9 of 12 months = 75% of year = 15 of 20 days accrued"

### 2. Personal Leave Tracker
Supabase-persisted running balance. Log days taken, see running total against entitlement. Requires AfroTools account.

**UI:**
- "My Leave" tab (auth-gated)
- Balance cards: Annual | Sick | Maternity/Paternity (where applicable)
- "Log leave taken" form: date range + leave type
- History table: past leave entries
- "Days remaining" prominent display
- Reset at leave year anniversary (configurable: Jan 1 or employment anniversary)

**Schema:**
```sql
create table lc_leave_tracker (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  country_code text,
  leave_year_start date,
  leave_type text,   -- 'annual' | 'sick' | 'maternity' | 'paternity' | 'toil'
  days_taken numeric,
  entitlement numeric,
  notes text,
  logged_at timestamptz default now()
);
```

### 3. Leave Encashment Calculator
On resignation or retrenchment: "I have 8 days unused annual leave. My salary is NGN 300,000/month. What am I owed?"

**UI:**
- Toggle: "Calculate leave payout on exit"
- Inputs: Unused days, monthly salary
- Output: Daily rate × unused days = encashment amount
- Legal note: which countries mandate encashment (most) vs. allow forfeiture (some)

**Formula:**
```
Daily rate = (Monthly salary × 12) / working days per year (typically 260)
Encashment = Daily rate × unused leave days
```

### 4. Maternity/Paternity Pay Source Explainer
"Who actually pays?" is the most commonly misunderstood part of parental leave in Africa. Per country breakdown:
- **South Africa**: UIF pays 38–58% of salary for up to 17.32 weeks (not the employer)
- **Kenya**: Employer pays 100% for 3 months
- **Nigeria**: Employer pays 100% for 3 months (but many don't)
- **Ghana**: SSNIT pays 50% for first 2 weeks, employer pays rest

**UI:**
- "Who pays?" section on maternity/paternity result
- 3-column breakdown: Employer % | Social Security % | Duration
- Plain language: "In South Africa, UIF (not your employer) pays approximately 54% of your salary for up to 4 months. Your employer does not top this up unless your contract says so."
- Link to UIF calculator for ZA users

### 5. Parental Leave Return Planner
"Baby due March 15. Maternity leave is 14 weeks. Return to work: June 22. Calendar download."

**UI:**
- Date input: "Expected due date"
- Auto-calculates: maternity leave start (2 weeks before due), end date, return-to-work date
- "Add to calendar" → iCal download (`.ics` file) with return-to-work date and reminders at 2 weeks, 1 week before
- WhatsApp reminder option

### 6. "Long Weekend Finder"
Genuinely fun and viral. Shows every public holiday that falls on a Thursday or Tuesday — optimal bridge days for 4-day weekends.

**UI:**
- Country selector + year
- List: "Friday April 18 (Good Friday) — take Thursday April 17 off → 4-day Easter weekend"
- Calendar view highlighting these dates
- "Share on WhatsApp" → "🇳🇬 Nigeria 2026 long weekends — strategic leave planner!"

### 7. Leave Policy Builder for SMEs
"Building a leave policy for a 10-person Lagos startup?" → Generates a compliant leave policy document PDF.

**UI:**
- Guided form: country, company type, number of employees
- Policy options above minimum: "Do you want to offer more than the statutory minimum?"
  - Annual leave: [20 ▾] days (minimum: 12)
  - Sick leave: [30 ▾] days (minimum: 12)
  - Maternity: [4 ▾] months (minimum: 3)
  - Paternity: [5 ▾] days (minimum: 3)
- Output: Full leave policy document → Document Generator

### 8. Country Comparison Table
All 54 countries sortable by total days off, maternity weeks, paternity days. Shareable as infographic on LinkedIn.

**UI:**
- Sortable table: Country | Annual Leave | Sick Leave | Maternity Weeks | Paternity Days | Public Holidays | Total
- "Best for maternity" / "Best for annual leave" quick filters
- Export as PNG infographic (pre-styled, shareable)

---

## AI System Prompt Upgrade

```javascript
"leave-calculator": {
  name: "Leave Calculator — African Statutory Leave Rights",
  systemPrompt: `You are an African leave entitlements and parental rights expert. You know every statutory leave entitlement for all 54 African countries.

Your role:
- Confirm exact leave days: annual, sick, maternity, paternity, public holidays
- Explain who pays for parental leave in each country (employer vs. social security vs. split)
- Calculate leave accrual: "You've worked X months, you've accrued Y days"
- Calculate leave encashment: "Your unused leave is worth [amount]"
- Help plan parental leave: start dates, end dates, return dates
- Explain leave forfeiture rules: "In Nigeria, unused leave can be carried over for 12 months before it lapses"
- Advise on sick leave abuse from employer perspective
- Explain TOIL (Time Off In Lieu) rules
- Help workers who've been denied leave: reporting body, process
- Compare leave entitlements across countries for relocation decisions

Important nuances to know:
- South Africa: UIF (not employer) pays parental leave benefits
- Kenya: employer pays maternity but NSSF has a maternity benefit too
- Francophone Africa: often have generous leave under OHADA-influenced codes
- Many African countries have sector-specific leave rules (mining, government, teachers)

Always give the law reference when confirming entitlements.`
}
```

---

## Cross-Tool Integration
- **Payslip Generator**: Leave balance shown on payslip (integration point)
- **Staff Cost**: Leave encashment cost included in total employment cost
- **Document Generator**: Leave Policy document + Leave Approval Form
- **UIF Calculator (ZA)**: Maternity leave → links to za-uif for benefit calculation
- **AfroPayroll OS**: Referenced in both New Hire and Offboarding journeys
- **WhatsApp Bot**: `LEAVE Ghana` command, `MATERNITY Kenya` command
