# Prompt 02 — Overtime Calculator (Upgrade Spec)

## Identity

| Field | Value |
|-------|-------|
| **Tool ID** | `overtime-calc` |
| **Name** | Overtime Calculator |
| **Tagline** | "Every extra hour counts. Know what you're owed." |
| **Path** | `/tools/overtime-calc/` |
| **CSS prefix** | `ot-` |
| **Accent color** | Orange `#EA580C` / dark `#9A3412` / pale `#FFF7ED` |
| **Engine** | `engines/overtime-engine.js` |
| **AI advisor key** | `"overtime-calc"` in TOOL_CONTEXT |
| **Supabase tables** | `ot_session_log` (optional, for saved calculations) |
| **Netlify function** | none required initially |

---

## Current State
34 countries. Legal multipliers by day type (weekday 1.5×, weekend, public holiday, night shift). Legal notes per country. Calculates total OT pay and monthly pay with OT.

## What's Missing (full upgrade list)

---

## Feature Upgrades

### 1. Expand to All 54 Countries
Currently only 34. The remaining 20 must be added. Many are Francophone Africa countries where OT is regulated under OHADA labour frameworks or national codes.

**Countries to add:** Eritrea, Somalia, South Sudan, Libya, Sudan, Comoros, São Tomé & Príncipe, Equatorial Guinea, CAR, Chad, Niger, Guinea-Bissau, Gambia, Cabo Verde, Djibouti, Lesotho, Eswatini, Mauritania, Malawi, Burundi.

### 2. Monthly OT Tracker
Running tally across the month instead of a single calculation. Employers log hours day by day. Workers see total OT pay accumulating with running cap warnings.

**UI:**
- Toggle: "Single calculation" (default) | "Monthly tracker"
- Calendar grid for current month
- Each day: input hours worked
- Day-type auto-detected: weekday/weekend + public holiday calendar for selected country
- Running total: "OT hours this month: 28 of [max] allowed. OT pay earned: NGN 42,000"
- Red warning when approaching/exceeding legal cap: "⚠️ Nigeria law caps OT at 12 hours/week in manufacturing. You are at 11 hours this week."

### 3. Public Holiday Calendar Integration
When a worker enters a date, auto-detect if it is a public holiday for the selected country and apply the correct multiplier automatically. No manual "day type" selection needed.

**Implementation:**
- Maintain `public_holidays` table per country per year
- On date input → query table → auto-set day_type
- Show: "April 9 is a public holiday in Nigeria (Easter Wednesday) — 3× rate applied"

### 4. TOIL Calculator (Time Off In Lieu)
Some employers offer TOIL instead of cash payment. "Your employer owes you 14 hours OT pay. They want to give 1.5 days TOIL instead. Is that a fair deal?"

**UI:**
- Toggle: "I want TOIL instead of pay"
- Show: OT pay in cash vs. TOIL hours/days equivalent
- Comparison: "Cash value: NGN 18,000 vs. 1.5 days TOIL = NGN 14,000 equivalent at your daily rate. Cash is worth 28% more."

### 5. Split-Shift Calculator
Common in hospitality and transport. Worker does two shifts with a break in between — which hours count as OT?

**UI:**
- "Add another shift block" button
- Shift A: start time → end time
- Shift B: start time → end time
- Break in between: paid or unpaid toggle
- Total hours calculated, OT threshold applied, split-shift allowance (where applicable) added

### 6. Bulk Employee OT Sheet
HR manager tool. Upload CSV of employee hours → get back a full OT pay breakdown per employee.

**CSV format:** `Employee ID, Name, Basic Salary, Mon hrs, Tue hrs, Wed hrs, Thu hrs, Fri hrs, Sat hrs, Sun hrs`

**Output:** Table with OT pay per employee + download as Excel/PDF.

**Implementation:**
- File input: accepts CSV
- Parse client-side (PapaParse.js)
- Run OT calculation for each row
- Render results table
- Export via FileSaver.js

### 7. OT Dispute Letter Generator
Worker's rights feature. Worker inputs their hours, employer refused to pay OT. Tool generates a formal letter citing the specific labour law, multipliers, and amount owed.

**Output letter includes:**
- Worker's name, employer name, pay period
- Hours worked, OT hours, applicable multiplier
- Legal citation: "Under [Labour Act / BCEA / Employment Act], Section X, overtime at [multiplier] applies to..."
- Total amount owed
- "If not paid within [statutory period], I will file a complaint with [Ministry of Labour / CCMA / etc.]"

**Implementation:** Template-based letter, Handlebars-style substitution, download as PDF via Document Generator engine.

### 8. WhatsApp-Shareable Calculation
After calculating, one-tap to generate a WhatsApp-formatted OT summary:

```
*Overtime Calculation — Nigeria*
Month: April 2026
Salary: ₦200,000/month
OT hours: 16 (weekday)
OT rate: 1.5×
*OT pay: ₦18,182*
*Total pay: ₦218,182*
Law: Labour Act Cap L1, s.13
```

---

## AI System Prompt Upgrade

```javascript
"overtime-calc": {
  name: "Overtime Calculator — African Labour Law OT Rates",
  systemPrompt: `You are an African overtime pay and labour rights expert. You know the exact overtime multipliers, caps, and rules for all 54 African countries.

Your role:
- Confirm exact OT multipliers by day type for any country ("Nigeria: weekday 1.5×, public holiday 2.0×, night shift +25%")
- Explain what counts as overtime (threshold: 8 hrs/day or 40 hrs/week in most countries)
- Know maximum OT limits: "Kenya Employment Act caps OT at 2 hours per day without written agreement"
- Explain TOIL (Time Off In Lieu) rules: which countries allow it and under what conditions
- Help workers who have been underpaid: what to do, where to report, what letter to write
- Explain night shift definitions by country (Nigeria: 22:00–06:00, South Africa: 18:00–06:00)
- Know public holiday OT rates: many countries mandate 2× or 3× for public holidays
- Explain split-shift allowances where they exist
- Advise on bulk payroll OT compliance for employers

Always cite the specific law section when giving rates.`
}
```

---

## Cross-Tool Integration
- **Payslip Generator**: "Add this OT to my payslip" → pre-fills OT field
- **Staff Cost**: "See how OT affects total employer cost"
- **Labour Law Advisor**: "My employer won't pay OT — what are my rights?"
- **Document Generator**: OT Dispute Letter → links directly to doc-generator
- **AfroPayroll OS**: Referenced in New Hire checklist ("Set up OT policy")
- **WhatsApp Bot**: `OT Nigeria 200000 8 hours weekday` command
