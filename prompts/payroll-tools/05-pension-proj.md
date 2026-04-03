# Prompt 05 — Pension Projection Calculator (Upgrade Spec)

## Identity

| Field | Value |
|-------|-------|
| **Tool ID** | `pension-proj` |
| **Name** | Pension Projection Calculator |
| **Tagline** | "See your future. Fix it now." |
| **Path** | `/tools/pension-proj/` |
| **CSS prefix** | `pp-` |
| **Accent color** | Purple `#7C3AED` / dark `#4C1D95` / pale `#F5F3FF` |
| **Engine** | `engines/pension-proj-engine.js` |
| **AI advisor key** | `"pension-proj"` in TOOL_CONTEXT |
| **Supabase tables** | `pp_projections` (saved projections, auth-gated) |
| **Netlify function** | none required |

---

## Current State
15 countries. Monte Carlo simulation. Chart.js visualizations. Inflation-adjusted projections. Annuity vs lump sum comparison. Scenario table (optimistic/moderate/pessimistic). Year-by-year projection table. Progress ring. PDF retirement readiness report.

## What's Missing (full upgrade list)

---

## Feature Upgrades

### 1. Real Return Dashboard (Inflation-Honest)
The current tool shows nominal projections. Most Africans are being misled by nominal figures. The real story is crushing.

**New prominent section:**
- "Nominal value at retirement: NGN 45M"
- "In today's money (inflation-adjusted): NGN 8M" — shown in red/warning style
- Slider: "Adjust assumed inflation rate" (default: country's historical average)
- Chart: nominal vs. real value over time (two lines on same chart)
- Callout: "At Nigeria's average 18% inflation, NGN 1M today will be worth only NGN 150,000 in 10 years"

### 2. PFA / Fund Manager Comparison (Nigeria)
PenCom publishes fund performance data for all PFAs quarterly. No one makes it accessible. This is the highest-value Nigeria-specific feature.

**UI:**
- Section: "Your PFA's Performance" (appears after country = NG)
- Table: PFA Name | 1-Year Return | 3-Year Return | 5-Year Return | Net of Fees
- Source: PenCom quarterly report (updated quarterly, AfroTools curates)
- Your PFA (if entered): highlighted row
- "Switching alert": "You are in [Crusader Sterling] — their 5-year return (8.2%) is below the median (11.3%). You're losing approximately NGN 240,000/year vs. the median fund. [How to transfer →]"
- Transfer guide: PenCom form, process, timeline (one transfer per year rule)

### 3. "Start Now vs. 5 Years Later" Comparison
The compound interest regret calculator. Most viral output in the entire suite.

**UI:**
- Always shown on results page as a callout card
- "If you start contributing today at age [25]: projected fund NGN 85M"
- "If you wait 5 years (start at 30): projected fund NGN 45M"
- "The 5-year delay costs you NGN 40M"
- Large, bold, orange warning color
- "Share this with someone who keeps saying 'I'll start saving next year'" → WhatsApp

### 4. Voluntary Contribution (AVC) Optimizer
"Add NGN 10,000/month more in AVCs. You retire 3.2 years earlier."

**UI:**
- Slider: "Monthly AVC amount" (0 → 100,000)
- Live update: projected fund changes as slider moves
- "Tax saving": "In the 24% PAYE band, NGN 10,000 AVC saves you NGN 2,400 in monthly tax. Net cost: NGN 7,600."
- "Earlier retirement": "This AVC gets you to your target fund 3.2 years sooner"

### 5. Drawdown Calculator
"You retire with NGN 25M. You need NGN 150,000/month. How long does it last?"

**UI:**
- New tab on results: "Drawdown calculator"
- Inputs: projected fund at retirement, monthly withdrawal need
- Output: "At 12% nominal return: lasts 34 years. At 15% inflation-adjusted: lasts only 12 years."
- Side-by-side: nominal vs. real drawdown period
- "Safe withdrawal amount": what you can withdraw sustainably without depleting fund (4% rule adapted for Africa)

### 6. Death Benefit Calculator
"If you die today, your next of kin receives X from your RSA plus Y from group life insurance."

**UI:**
- Section: "Death & disability benefits"
- Inputs: current RSA balance (or calculated)
- Output:
  - RSA lump sum to beneficiaries (total balance)
  - Group life insurance: 3× annual basic salary (PenCom mandatory in Nigeria)
  - Disability pension: if permanently disabled before retirement
- "Have you named your beneficiaries? [Check RSA →]"

### 7. Expand to All 54 Countries
Currently 15. The remaining 39 should have at minimum a generic projection using the country's statutory contribution rate.

**For countries with no specific scheme:**
- Use ISSA (International Social Security Association) data for typical pension system type
- Calculate generic defined contribution projection at statutory rate
- Label clearly: "Generic projection — [Country] pension system data is limited"

### 8. PDF Retirement Readiness Report
Already exists — upgrade it:
- Add PFA comparison section (Nigeria)
- Add real return dashboard
- Add "3 actions to improve your retirement outlook" (AI-generated, personalized)
- Add "retirement readiness score" (0–100): based on current savings rate, projected vs. target, years to retirement

---

## AI System Prompt Upgrade

```javascript
"pension-proj": {
  name: "Pension Projection Calculator — African Retirement Planning",
  systemPrompt: `You are an African retirement planning and pension expert. You know pension systems across all 54 African countries and understand the real challenges of saving for retirement in high-inflation African economies.

Your role:
- Project pension fund values honestly: show both nominal and inflation-adjusted figures
- Calculate the "start now vs. later" regret: quantify the cost of delayed contributions
- Compare PFA performance in Nigeria (PenCom data) — be specific, not vague
- Explain the AVC tax advantage: pension contributions often reduce taxable income
- Calculate drawdown: how long a fund lasts at different withdrawal rates
- Explain death and disability benefits under each country's pension scheme
- Help workers understand if their employer is underremitting: cross-check expected contributions
- Guide workers on voluntary pension options (AVCs, voluntary NSSF, SSNIT Tier 3)
- Advise on lump sum vs. annuity decision at retirement
- Know transfer procedures: PenCom PFA transfer, SSNIT benefit options, GEPF choices

The core message:
- High African inflation means nominal pension numbers are misleading
- The real purchasing power of a pension at retirement is often 60-80% less than the nominal figure
- Starting early and making AVCs are the most powerful tools available
- PFA choice in Nigeria matters more than most people think — 3% difference in returns over 30 years is transformative

Always show real (inflation-adjusted) values alongside nominal.`
}
```

---

## Cross-Tool Integration
- **NG Pension**: Detailed Nigeria-specific tool — "For detailed Nigeria CPS calculation →"
- **KE NSSF / GH SSNIT / ZA GEPF**: Country-specific tools linked from pension-proj
- **Social Security**: Feeds contribution rates into projection
- **Savings & Investment Hub**: "Also see FIRE calculator, compound interest"
- **AfroPayroll OS**: Step 5 of New Hire journey
- **WhatsApp Bot**: `PENSION Nigeria 300000` routes here for projection
