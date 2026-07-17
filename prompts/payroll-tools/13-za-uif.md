# Prompt 13 — South Africa UIF Calculator (Upgrade Spec)

## Identity

| Field | Value |
|-------|-------|
| **Tool ID** | `za-uif` |
| **Name** | South Africa UIF Calculator |
| **Tagline** | "You've paid in. Now know what you can claim." |
| **Path** | `/tools/za-uif/` |
| **CSS prefix** | `uif-` |
| **Accent color** | Sky `#0369A1` / dark `#075985` / pale `#F0F9FF` |
| **Engine** | `engines/za-uif-engine.js` |
| **AI advisor key** | `"za-uif"` in TOOL_CONTEXT |
| **Supabase tables** | none required initially |
| **Netlify function** | none required |

---

## Current State
Monthly UIF benefit amount. Duration based on years of service. Total entitlement. Reason for unemployment (retrenchment, resignation, etc.). Sidebar UIF information.

## What's Missing (full upgrade list)

---

## Feature Upgrades

### 1. Full Claim Wizard
UIF is criminally underutilized. Millions of South Africans who qualify never file because the process is confusing. This wizard changes that.

**Step-by-step guide per claim type:**

**Retrenchment claim:**
1. Get UI-19 form from employer (employer must provide within 4 days of termination)
2. Get UI-2.7 form (retrenchment confirmation from employer)
3. Get 13-week bank statement
4. Get certified copy of ID
5. Get proof of registration with UIF (if not already registered)
6. Submit at: nearest Department of Employment and Labour office OR uFiling (efiling.uif.gov.za)
7. Processing time: 6–8 weeks
8. Appeal if rejected: CCMA or Labour Court

**Maternity benefit claim:**
1. Get UI-2.2 form from doctor/midwife (confirming pregnancy + expected birth)
2. Get UI-19 from employer
3. Submit before or after birth (retroactive allowed)
4. Bank statement, ID, proof of employment

**Illness benefit claim:**
1. Get UI-2.2 from registered medical practitioner (confirming illness + expected duration)
2. Claim monthly while ill (submit each month)
3. Maximum: 8 months

**Adoption / commissioning parent:**
1. Proof of adoption order or commissioning parent order (surrogacy)
2. UI-19 from employer
3. Same process as maternity

**UI:**
- Claim type selector: Retrenchment | Maternity | Illness | Reduced Work Time | Adoption
- For each: numbered step-by-step with form names, where to get them, where to submit
- Downloadable checklist PDF per claim type
- "Find your nearest DoEL office" with location input

### 2. UIF Credits Calculator
UIF accumulates at 1 day per 4 days worked, up to maximum 238 days. Workers don't understand their credit balance.

**UI:**
- Input: employment start date + end date (or "currently employed")
- Calculation: total days worked → UIF credit days earned → credit remaining after any prior claims
- Maximum: 238 days (about 8 months)
- Visual: progress bar showing credit built up vs. maximum
- "If you've claimed UIF before": input prior claim duration → deducted from available credits
- Output: "You have [X] UIF credit days available. At your salary, this = [Y] weeks of benefit."

### 3. Benefit Amount Deep Dive
The replacement rate is complex and most Africans don't understand it.

**UI:**
- "How much will I receive?" section
- Replacement rate scale: "UIF replaces 38%–58% of your salary — higher replacement for lower earners"
- Exact formula display:
  - IRR (Income Replacement Rate) = 29.2 + (7173.92 / daily remuneration)
  - Capped at 58% minimum daily wage
  - Maximum daily benefit: ZAR 632.84 (current cap)
- Examples at different salary levels:
  - ZAR 10,000/month: "UIF pays approximately ZAR 5,500/month (55% replacement)"
  - ZAR 25,000/month: "UIF pays approximately ZAR 10,200/month (41% replacement)"
  - ZAR 50,000+/month: "UIF pays approximately ZAR 17,800/month (maximum — capped)"
- "UIF is capped — high earners receive less than 40% replacement"

### 4. Maternity UIF Deep Dive
Specific calculator for maternity benefit — the most misunderstood UIF benefit.

**UI:**
- Separate maternity mode
- Duration: up to 17.32 weeks (roughly 4 months)
- Replacement rate: same formula as standard
- "My employer is paying full salary during maternity — do I still claim UIF?"
  → "Yes. UIF benefit goes directly to you, not your employer. If employer pays full salary, they may deduct the UIF amount from their payment — check your contract."
- "When to claim": before or after birth? Both valid.
- "How employer and UIF interact": visual diagram

### 5. Reduced Work Time (Short-Time) Calculator
Introduced during COVID, now permanent. If your employer cuts your hours, you can claim UIF for the lost portion.

**UI:**
- "My hours were reduced" section
- Input: previous full salary + current reduced salary
- Output: UIF benefit for the difference
- "This is called 'reduced work time' UIF — claim it every month while on short-time"
- Employer requirements: employer must apply for reduced work time on uFiling

### 6. uFiling Step-by-Step Guide
The uFiling portal (efiling.uif.gov.za) is confusing. Annotated screenshots guide.

**UI:**
- "Claim via uFiling" section
- Step 1: Register at uFiling (or login if registered)
- Step 2: Select claim type
- Step 3: Upload documents (list with file size limits)
- Step 4: Submit and get reference number
- Step 5: Track status (how to check)
- "Common rejection reasons and how to avoid them"

### 7. Employer UIF Compliance Checker
For employers: checklist of UIF obligations.

**UI:**
- "I'm an employer" toggle
- Checklist:
  - ✓ Registered as UIF employer (uFiling)
  - ✓ Deducting 1% from employee salary monthly
  - ✓ Contributing 1% employer portion monthly
  - ✓ Submitting UI-19 (monthly return) by 7th of following month
  - ✓ Submitting UI-19 within 4 days of employee termination
- "Penalty for non-compliance: 10% of arrears + interest at prime rate"
- "How to register as UIF employer" guide

---

## AI System Prompt Upgrade

```javascript
"za-uif": {
  name: "South Africa UIF Calculator — Unemployment Insurance Fund",
  systemPrompt: `You are a South Africa UIF (Unemployment Insurance Fund) expert. You help South African workers claim the benefits they've contributed to and help employers stay compliant.

Your role:
- Calculate UIF benefit amounts using the correct IRR formula (not just a flat %)
- Calculate UIF credit days based on employment history
- Guide workers through the claim process step by step: forms, documents, where to submit
- Explain all claim types: retrenchment, maternity, illness, adoption, commissioning parent, reduced work time
- Explain the uFiling process: how to register, submit, track
- Help employers understand their UIF obligations: registration, monthly returns, UI-19 on termination
- Know penalty rates for employer non-compliance
- Explain how UIF interacts with employer-paid maternity: the benefit goes to the employee regardless
- Help workers who've been rejected: appeal process, CCMA, Labour Court
- Know current benefit caps: maximum daily benefit rate

Key UIF rules:
- UIF credit: 1 day per 4 days worked, maximum 238 days
- Replacement rate: 38%–58% (IRR formula), maximum daily benefit: ZAR 632.84
- Maternity: up to 17.32 weeks (122 days)
- Illness: up to 8 months total per benefit cycle
- Reduced work time: claim monthly while on short-time
- Employer contribution: 1% of gross salary (monthly), employee 1%
- Employer filing: UI-19 due by 7th of following month, also within 4 days of each termination`
}
```

---

## Cross-Tool Integration
- **Leave Calculator**: Maternity leave calculation + UIF maternity benefit combined view
- **Labour Law Advisor**: "Can my employer deduct my UIF benefit from maternity pay?"
- **Document Generator**: "Generate UI-19 equivalent / termination notice"
- **Compliance Calendar**: UIF filing deadline (7th of month)
- **AfroPayroll OS**: Step in Offboarding journey (Calculate UIF Exit Obligations)
- **WhatsApp Bot**: `UIF South Africa 25000 3 years retrenchment` command
