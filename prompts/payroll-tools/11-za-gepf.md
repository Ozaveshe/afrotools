# Prompt 11 — South Africa GEPF Calculator (Upgrade Spec)

## Identity

| Field | Value |
|-------|-------|
| **Tool ID** | `za-gepf` |
| **Name** | South Africa GEPF Pension Calculator |
| **Tagline** | "Your government pension. Every rand accounted for." |
| **Path** | `/tools/za-gepf/` |
| **CSS prefix** | `gepf-` |
| **Accent color** | Blue `#1D4ED8` / dark `#1E3A8A` / pale `#EFF6FF` |
| **Engine** | `engines/za-gepf-engine.js` |
| **AI advisor key** | `"za-gepf"` in TOOL_CONTEXT |
| **Supabase tables** | none required initially |
| **Netlify function** | none required |

---

## Current State
Annuity + gratuity calculation. Years of pensionable service. Final salary based. Sidebar GEPF information.

## What's Missing (full upgrade list)

---

## Feature Upgrades

### 1. Early vs. Normal Retirement Comparison
"Retiring at 55 vs. 60: what is the financial difference?"

**UI:**
- Dual scenario: "Retire at [55 ▾]" vs. "Retire at [60 ▾]"
- Side-by-side:
  - Gratuity difference: "ZAR 340,000 more at 60"
  - Monthly pension difference: "ZAR 3,200/month more at 60"
  - Break-even age: "If you live to [73], retiring at 60 gives more total money"
- "Health considerations" note: "The break-even age assumes average life expectancy. If you have health concerns, retiring earlier may be worth the reduced pension."

### 2. Spouse / Beneficiary Survivor's Pension
GEPF pays 50% of pension to surviving spouse for life. This is critical estate planning information.

**UI:**
- "Beneficiary benefits" section
- Shows: "If you die [in service / after retirement], your spouse receives:"
  - In-service death: spouse pension based on years of service
  - Post-retirement death: 50% of your pension for life
  - Children's pension: 25% each, up to 3 children, until age 22
- Input: "Number of dependants" → shows total dependant pension
- "Have you updated your GEPF beneficiary nomination?" checklist

### 3. GEPF Resignation Benefit Calculator
The most misunderstood GEPF decision. Many government employees resign and cash out — devastating for retirement. Tool shows the true cost.

**UI:**
- "I'm resigning before retirement" section
- Option A: Take resignation benefit (lump sum now)
  - Calculated: fund credit based on contributions
  - Tax implications: resignation benefit subject to tax
- Option B: Preserve in GEPF or transfer to preservation fund
  - Future annuity value if preserved
- "Cost of cashing out": "By taking the resignation benefit now, you lose ZAR X in future pension income. That is [Y] years of monthly income foregone."
- Strong messaging: "Most financial advisors recommend preservation over cashing out"

### 4. Pension Increase Tracker
GEPF grants annual pension increases (recently CPI − 0.5%). Show how the pension keeps up with inflation over a 20-year retirement.

**UI:**
- "Inflation protection" section
- Shows: current monthly pension → value in 10 years → value in 20 years (with GEPF's historical increase rate)
- Compare: GEPF pension + expected increases vs. projected inflation
- "Real purchasing power of your pension in 20 years: ZAR X (in today's money)"
- Historical GEPF increase rates table: 2019, 2020, 2021, 2022, 2023, 2024, 2025

### 5. Pension-Backed Home Loan Calculator
GEPF members can borrow against their pension benefit through the GEPF Housing Loan Guarantee.

**UI:**
- "GEPF home loan" section
- Maximum borrowable: typically up to 60% of fund credit
- Shows: monthly repayment at current GEPF loan rate
- Impact on pension: "Borrowing ZAR 500,000 reduces your fund credit by ZAR X which reduces your monthly pension by ZAR Y"
- Guide: how to apply, which banks participate in the GEPF-backed scheme

### 6. Combined GEPF + GEMS Deduction Dashboard
Most GEPF members also contribute to GEMS (Government Employees Medical Scheme). Combined deduction from salary is significant.

**UI:**
- "My total government deductions" view
- GEPF contribution (employee): 7.5% of pensionable salary
- GEMS contribution (if applicable): input or select GEMS option level
- UIF (1%): shown
- Total statutory government deductions: %
- "Your take-home after all deductions: ZAR X"

### 7. Private Sector Pension Integration
Many government employees have previous private sector employment with occupational pension. Tool helps combine both into a single retirement picture.

**UI:**
- "I have previous pension funds" section
- Add prior fund: type (provident/pension fund) + current value
- Combined projection: GEPF annuity + prior fund drawdown = total monthly retirement income
- "Transfer prior fund to preservation fund or retirement annuity?" guide

---

## AI System Prompt Upgrade

```javascript
"za-gepf": {
  name: "South Africa GEPF Pension Calculator",
  systemPrompt: `You are a South Africa GEPF (Government Employees Pension Fund) expert. You help South Africa's 1.2 million government employees — teachers, nurses, police, civil servants — understand and maximize their pension benefits.

Your role:
- Calculate GEPF annuity and gratuity accurately using the defined benefit formula
- Compare early retirement (55) vs. normal retirement (60): gratuity and monthly pension differences
- Explain survivor's benefits: spouse gets 50% of pension for life; children's pension until age 22
- Guide on resignation benefit vs. preservation: make the case for preservation strongly
- Explain pension increases: GEPF's CPI-linked increase history
- Calculate pension-backed home loan eligibility and monthly repayments
- Help combine GEPF with previous private sector pensions for full retirement picture
- Explain GEMS deductions in context of total take-home pay
- Know beneficiary nomination: many members haven't updated nominations after divorce/remarriage
- Guide on purchasing additional pensionable service

Key GEPF formulas:
- Annuity: (years of pensionable service × pensionable remuneration) / 55 (capped at 30 years for full pension)
- Gratuity: typically 1× annual pensionable remuneration for full service
- Minimum pension: government guarantees a minimum monthly pension floor
- Normal retirement age: 60 (optional at 55 with reduced benefit)

The GEPF is a defined benefit scheme — the benefit is guaranteed regardless of investment returns, unlike CPS (Nigeria) or NSSF (Kenya).`
}
```

---

## Cross-Tool Integration
- **ZA UIF**: "Also understand your UIF entitlement as a government employee"
- **Pension Projection**: GEPF defined benefit + private sector funds combined projection
- **Document Generator**: GEPF-related correspondence templates
- **Compliance Calendar**: GEPF employer reporting deadlines
- **WhatsApp Bot**: `GEPF South Africa 45000 25 years` command
