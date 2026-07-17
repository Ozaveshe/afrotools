# Prompt 09 — Nigeria Pension Calculator (Upgrade Spec)

## Identity

| Field | Value |
|-------|-------|
| **Tool ID** | `ng-pension` |
| **Name** | Nigeria Pension Calculator (CPS) |
| **Tagline** | "Your RSA. Your future. Know the numbers." |
| **Path** | `/tools/ng-pension/` |
| **CSS prefix** | `ngp-` |
| **Accent color** | Green `#16A34A` / dark `#14532D` / pale `#F0FDF4` |
| **Engine** | `engines/ng-pension-engine.js` |
| **AI advisor key** | `"ng-pension"` in TOOL_CONTEXT |
| **Supabase tables** | none required initially |
| **Netlify function** | none required |

---

## Current State
Nigeria CPS calculation. 8% employee + 10% employer. Fund projection at retirement. Annual contribution totals. Green color scheme. Result grid. Sidebar CPS information card.

## What's Missing (full upgrade list)

---

## Feature Upgrades

### 1. PFA Performance Comparison Engine
The highest-value Nigeria-specific feature. PenCom publishes RSA fund performance quarterly. No one makes it accessible and comparable. This tool becomes the definitive source.

**Data to surface (updated quarterly from PenCom reports):**
- ARM Pension
- Stanbic IBTC Pension Managers
- Leadway Pensure
- Crusader Sterling Pensions
- NPF Pensions
- NLPC PFA
- AXA Mansard Pensions (and all other licensed PFAs)

**Per PFA:**
- 1-year net-of-fees return
- 3-year net-of-fees return
- 5-year net-of-fees return
- AUM (Assets Under Management)
- Number of RSA holders
- Employer contribution remittance record (% of expected contributions received on time)

**UI:**
- Sortable table: PFA | 1-yr | 3-yr | 5-yr | AUM | RSA holders
- "Best 5-year performer" highlighted
- "Median" row for comparison
- Impact calculator: "If you're in [Crusader Sterling] at 8.2% vs. median 11.3%, over 20 years on NGN 5M RSA: you lose NGN 12.4M"
- "How to transfer" guide: PenCom transfer form, process, 1-transfer-per-year rule, steps

### 2. AVC (Additional Voluntary Contribution) Optimizer
AVCs reduce taxable income AND grow the retirement fund. Most Nigerians don't know about them.

**UI:**
- "Add voluntary contribution" section
- Slider: monthly AVC amount
- Live calculation:
  - Additional RSA growth
  - PAYE tax saved (based on entered salary)
  - Net cost of AVC: "NGN 10,000 AVC costs you NGN 7,600 after tax saving"
  - Earlier retirement date with AVC

### 3. Micro-Pension Feature
PenCom launched micro-pension in 2019 for self-employed and informal sector workers. Almost nobody knows about it. AfroTools can drive adoption.

**UI:**
- Toggle: "I'm self-employed / informal worker"
- Shows: micro-pension enrollment process
  - Any licensed PFA can enroll micro-pension contributors
  - Minimum contribution: NGN 500/week or NGN 2,000/month
  - Tax relief applies
  - Immediate access to 40% of contributions (unlike formal RSA)
- Calculator: "If you contribute NGN 2,000/month for 20 years at 11% return: NGN 1.7M"
- "Enroll at [PFA links]"

### 4. Lump Sum vs. Annuity Decision Engine
At retirement, PenCom allows a 25% lump sum. Should you take it?

**UI:**
- "I'm retiring soon" mode
- Inputs: projected RSA balance, target monthly expenses
- Shows both scenarios:
  - 25% lump sum now + reduced monthly annuity
  - No lump sum + full monthly annuity
- Break-even age: "If you live beyond [age], the no-lump-sum option gives more total money"
- Tax implications: lump sum is tax-free up to a threshold under PITA

### 5. Gratuity vs. CPS Comparison
Some companies offer gratuity instead of pension (older arrangement, pre-CPS era). Many workers don't know which is better.

**UI:**
- Toggle: "My company offers gratuity instead of pension"
- Input: gratuity formula (e.g., "2% per year of service × final salary")
- Compare: gratuity payout at retirement vs. CPS accumulated fund
- "Which is worth more?" clear winner card
- Legal note: "Since 2004, all companies with 15+ employees must operate CPS — gratuity can only supplement, not replace"

### 6. Death Benefit Calculator
"If I die today, my family receives X."

**UI:**
- "Death & disability benefits" section
- Shows:
  - RSA balance (goes to next of kin)
  - Group life insurance: 3× annual basic salary (mandatory for CPS employers under PenCom regulations)
  - "Have you named your beneficiaries on your RSA?" checklist with PFA portal links

### 7. "Am I Being Shortchanged?" Checker
Cross-check expected contributions vs. RSA statement.

**UI:**
- Input: monthly gross salary (basic + housing + transport only — pensionable pay)
- Output: "Expected monthly RSA credit: NGN 90,000 (8% employee + 10% employer)"
- "If your RSA statement shows less than NGN 90,000 last month, your employer may not be remitting"
- "Steps to verify: 1. Log into your PFA's app/portal. 2. Check last month's credit. 3. If shortfall exists: [report to PenCom at pencom.gov.ng/complaints]"

---

## AI System Prompt Upgrade

```javascript
"ng-pension": {
  name: "Nigeria Pension Calculator — CPS & PFA Guide",
  systemPrompt: `You are a Nigeria pension and retirement planning expert specializing in the Contributory Pension Scheme (CPS) regulated by PenCom.

Your role:
- Calculate RSA contributions accurately (8% employee + 10% employer of basic+housing+transport)
- Compare PFA performance using PenCom's quarterly published data
- Explain AVCs: tax benefit, how to set up, which PFAs allow flexible AVC amounts
- Guide workers on how to check if their employer is remitting correctly
- Explain the micro-pension scheme for self-employed workers (launched 2019)
- Help with lump sum vs. annuity decision at retirement (25% lump sum rule)
- Compare gratuity schemes vs. CPS
- Explain death benefit: RSA to next of kin + group life insurance (3× annual basic)
- Guide on PFA transfers: once per year, PenCom form, processing timeline
- Know the PFA landscape: ARM, Stanbic IBTC, Leadway, Crusader Sterling, NPF, NLPC

Key regulations:
- Pension Reform Act 2014 (as amended)
- PenCom regulations on contribution remittance (7th of following month)
- Employer default: penalty is 2% of unremitted contributions per month
- Eligible withdrawals: 25% lump sum at 50 (if unemployed for 4 months) or at retirement age`
}
```

---

## Cross-Tool Integration
- **Pension Projection**: NG Pension feeds detailed data → pension-proj for long-term model
- **Social Security**: NHF, NSITF, NHIS shown alongside CPS
- **Regulatory Alerts**: Subscribe to "Nigeria pension rate changes"
- **WhatsApp Bot**: `PENSION Nigeria 300000` routes to ng-pension engine
- **Payroll API**: `POST /v1/payroll/social-security?country=NG` uses this engine
