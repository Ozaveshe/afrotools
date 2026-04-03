# Prompt 12 — Ghana SSNIT Calculator (Upgrade Spec)

## Identity

| Field | Value |
|-------|-------|
| **Tool ID** | `gh-ssnit` |
| **Name** | Ghana SSNIT Benefits Calculator |
| **Tagline** | "Three tiers. One calculator. Full picture." |
| **Path** | `/tools/gh-ssnit/` |
| **CSS prefix** | `ssnit-` |
| **Accent color** | Amber `#B45309` / dark `#78350F` / pale `#FFFBEB` |
| **Engine** | `engines/gh-ssnit-engine.js` |
| **AI advisor key** | `"gh-ssnit"` in TOOL_CONTEXT |
| **Supabase tables** | none required initially |
| **Netlify function** | none required |

---

## Current State
3-tier system breakdown. Contribution rates per tier. Projected retirement benefits. Breakdown table. NPRA compliance. Sidebar SSNIT information.

## What's Missing (full upgrade list)

---

## Feature Upgrades

### 1. "36 Best Months" Pension Calculator
SSNIT pension is calculated on the highest 36 consecutive months of contribution salary — not final salary. This surprises most Ghanaians and can significantly change retirement planning.

**UI:**
- Prominent explanation: "Ghana's SSNIT pension is NOT based on your final salary. It's based on your highest 36 consecutive months of contribution."
- Input: salary history (year by year for last 10 years)
- Tool identifies: "Your highest 36 months were [2019–2022] at an average GHS X"
- Projection based on the 36-month average, not current salary
- Insight: "If you're expecting a big raise in your final 3 years, it may NOT boost your SSNIT pension — you need 36 consecutive peak months"

### 2. Reduced Pension at 55 vs. Full Pension at 60
Show the exact monthly and lifetime difference.

**UI:**
- Comparison card: "Retire at 55 vs. 60"
- At 55: pension reduced by [% per early year] — SSNIT has a specific reduction formula
- At 60: full pension
- Monthly difference: GHS X/month
- Break-even age: "If you live to [age], retiring at 60 gives more total money"
- Life expectancy context: "Average Ghanaian life expectancy is 65 for men, 67 for women"

### 3. Invalidity Benefit Calculator
If permanently disabled before retirement: SSNIT pays an invalidity pension.

**UI:**
- "Disability benefit" section
- Eligibility: minimum 12 months' contributions, permanent invalidity certified by SSNIT medical board
- Calculation: based on years of contribution + average salary
- Shows estimated monthly invalidity pension
- "How to claim" guide: SSNIT district office process

### 4. Tier 2 Fund Manager Performance Comparison
SSNIT Tier 2 (5% of gross — 2.5% employer + 2.5% employee) goes to private fund managers or NPRA-licensed trustees. Which fund has the best returns?

**UI:**
- "Your Tier 2 fund manager" section
- Table: licensed Tier 2 trustees + their reported returns (from NPRA annual reports)
- "Which fund manager is your employer using?" — if user knows, show specific returns
- Impact: "1% difference in Tier 2 return over 20 years on GHS 500,000: GHS 124,000 difference"
- Guide: can you change Tier 2 fund manager? Who decides — employer or employee?

### 5. Tier 3 Tax Advantage Calculator
Voluntary Tier 3 contributions are tax-deductible up to 16.5% of income. Massive benefit almost nobody uses.

**UI:**
- "Tier 3 tax advantage" section
- Input: current salary + tax band
- Shows:
  - Monthly Tier 3 contribution (input slider)
  - PAYE saved: "GHS 1,000 Tier 3 → saves GHS 330 in tax (at 33% band). Net cost: GHS 670."
  - Fund growth: projection of Tier 3 over 20 years
- "Why Tier 3?": "Unlike Tier 1 and 2, Tier 3 has more flexible withdrawal rules and is managed by NPRA-licensed providers of your choice"
- List: recommended NPRA-licensed Tier 3 providers

### 6. Non-Citizen Contributor Guide
Many West African nationals work in Ghana under ECOWAS free movement. Can they access SSNIT?

**UI:**
- "I'm not a Ghanaian citizen" toggle
- ECOWAS citizens: covered under ECOWAS social security portability agreement in principle
- Non-ECOWAS citizens: bilateral agreement status shown per nationality
- "What happens to your contributions if you leave Ghana?" guide:
  - ECOWAS citizens: can transfer or claim
  - Others: lump sum benefit available after leaving

### 7. SSNIT Lump Sum on Early Exit
If you leave formal employment before 15 years: what do you get?

**UI:**
- "Leaving formal employment before retirement" section
- < 15 years contributions: lump sum (return of employee contributions with interest)
- 15–179 months: reduced pension options
- Shows exact lump sum calculation based on contribution history input
- Strong messaging: "If you can preserve your SSNIT contributions until retirement, the pension benefit is worth significantly more than the early lump sum"

---

## AI System Prompt Upgrade

```javascript
"gh-ssnit": {
  name: "Ghana SSNIT Benefits Calculator",
  systemPrompt: `You are a Ghana SSNIT pension and social security expert. You know the 3-tier pension system regulated by NPRA (National Pensions Regulatory Authority).

Your role:
- Calculate Tier 1 (13.5% — 5.5% employee + 8% employer, goes to SSNIT)
- Calculate Tier 2 (5% — 2.5% each, goes to private fund manager/trustee)
- Explain voluntary Tier 3 (tax-deductible up to 16.5% of gross income)
- Explain the "36 best months" pension calculation — not final salary
- Compare retire at 55 (reduced) vs. 60 (full pension)
- Calculate invalidity benefit for permanent disability
- Guide on Tier 2 fund manager selection and performance comparison
- Explain the Tier 3 tax advantage: PAYE reduction + long-term growth
- Help non-citizens understand portability under ECOWAS agreements
- Explain early exit: lump sum vs. preserving for full pension
- Know SSNIT minimum pension and cost-of-living adjustment history

Filing deadlines:
- SSNIT Tier 1 + Tier 2: due by 14th of following month
- Penalty for late payment: 3.5% per month on outstanding amount
- Employer registration: mandatory before first employee starts

Key SSNIT facts:
- Minimum qualifying period: 15 years (180 months)
- Normal retirement age: 60 (voluntary from 55 with reduction)
- Pension = 37.5% of "best 36 months" average + 1.125% per year of service above 15 years`
}
```

---

## Cross-Tool Integration
- **Pension Projection**: SSNIT Tier 1 projection → long-term retirement planning
- **Social Security**: Ghana full social security picture (SSNIT covers pension + basic health)
- **Compliance Calendar**: SSNIT deadline (14th of month)
- **Payroll API**: Ghana social security endpoint uses this engine
- **WhatsApp Bot**: `SSNIT Ghana 5000` command
