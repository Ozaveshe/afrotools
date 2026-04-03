# Prompt 14 — Job Offer Evaluator (Upgrade Spec)

## Identity

| Field | Value |
|-------|-------|
| **Tool ID** | `job-offer-evaluator` |
| **Name** | Job Offer Evaluator |
| **Tagline** | "Beyond the number. The full picture." |
| **Path** | `/tools/job-offer-evaluator/` |
| **CSS prefix** | `joe-` |
| **Accent color** | Violet `#6D28D9` / dark `#4C1D95` / pale `#F5F3FF` |
| **Engine** | `engines/job-offer-engine.js` |
| **AI advisor key** | `"job-offer-evaluator"` in TOOL_CONTEXT |
| **Supabase tables** | `joe_saved_evaluations` |
| **Netlify function** | none required |

---

## Current State
2 offers side-by-side. Net pay after tax for each. Benefits comparison. Commute cost. Career value score. Winner recommendation with reasoning. Verdict section.

## What's Missing (full upgrade list)

---

## Feature Upgrades

### 1. 3+ Offer Comparison
Remove the arbitrary 2-offer limit. First job + 3 competing offers. Incumbent role + 3 new offers. Four at once.

**UI:**
- "Add another offer" button (up to 4 offers)
- Comparison shifts from side-by-side to a ranked table when 3+ offers
- Mobile: swipeable offer cards (one visible at a time, dots for pagination)
- "Remove offer" button on each card

### 2. Counter-Offer Simulator
"You earn NGN 250,000. New offer: NGN 350,000. You want to counter at NGN 380,000. Here is the negotiation script."

**UI:**
- "Simulate a counter-offer" section
- Input: current offer received + your counter amount
- Output:
  - Negotiation script: "Based on [market data / your X years experience / competing offer], I'm targeting NGN 380,000. I'm confident I can add [value] in the first 90 days."
  - "Walk-away line": "I'd need at least NGN 350,000 to move from my current role. Is there flexibility there?"
  - Probability assessment: "At 8.6% above the offered amount, this counter is [likely / risky / aggressive]"
- AfroSalary DB integration: "Your ask is at the [72nd] percentile for [role] in [city] — that's your market rate justification"

### 3. Equity / ESOP Valuation
Critical for startup roles. Most African tech professionals don't know how to value equity.

**UI:**
- "This offer includes equity" toggle
- Inputs:
  - Options/shares granted
  - Current company valuation
  - Vesting schedule (typical: 4 years, 1-year cliff)
  - Strike price
  - Your % of fully diluted cap table
- Scenario modeling:
  - "If the company reaches $10M valuation: your options worth $X"
  - "If $50M: $Y"
  - "If $100M: $Z"
  - "If acqui-hired at 1× revenue: $W"
- Probability-weighted expected value: "At a 20% chance of $50M exit, 50% chance of $10M, 30% chance of zero: expected value = $X"
- Comparison: "Is this worth more than a NGN X signing bonus?"
- Vesting schedule visualizer: calendar showing cliff date + monthly vest amounts

### 4. 5-Year Career Trajectory Model
Not just current salary — total earnings and career path over 5 years.

**UI:**
- "5-year projection" tab
- Per offer, model:
  - Typical promotion timeline in this type of company (startup / corporate / MNC / government)
  - Assumed salary growth rate: startup (variable/equity upside) vs. bank (structured 10-15%/year)
  - Total 5-year earnings (salary + expected increases)
  - Title at year 5 (based on industry norms)
- Output: "Company A (fintech startup): 5-year total earnings NGN 28M, likely Senior Engineer title. Company B (bank): 5-year total NGN 22M, likely Senior Associate."
- "5-year financial winner: Company A by NGN 6M"
- "Career title winner: Depends on your goals"

### 5. Relocation Cost Calculator
"Moving from Lagos to Nairobi for this job. Break-even on salary increase: 4.2 months."

**UI:**
- "This role requires relocation" toggle
- Inputs: from city + to city
- Auto-estimates (with editable fields):
  - Moving costs (flight + freight)
  - First month rent deposit (typical for destination city)
  - Settling-in costs (new furniture, connection fees)
  - Temporary accommodation (if any)
- Salary difference: new offer vs. current role
- Break-even: "At NGN X/month salary increase, relocation costs break even in [Y] months"
- "Is relocation allowance included?" toggle — if yes, deducted from total cost

### 6. Benefits Monetization
Benefits have real monetary value that most job seekers ignore.

**UI per offer:**
- Medical cover: "Family of 4 market rate: NGN 480,000/year"
- Company car / transport: "NGN 240,000/year value or [fuel + driver] equivalent"
- Remote work: "NGN 120,000/year saved commuting (2hrs/day × 250 days)"
- Gym: "NGN 60,000/year (12-month gym membership Lagos)"
- Housing allowance: show tax-free portion value
- 13th month / bonus: "Expected value based on company type"
- Stock / equity: see section above
- **Total benefits value per offer**: shown prominently
- **True total compensation**: salary + benefits + expected bonus
- "Offer A's gross salary is NGN 50,000 lower but total comp is NGN 180,000 higher"

### 7. Happiness / Culture Score
Data beyond money. Weighted against salary.

**Per offer, rate 1–10:**
- Work-life balance expected
- Manager quality (if known from interview)
- Growth potential
- Company stability / runway
- Mission alignment
- Team quality
- Office environment / remote flexibility

**Output:**
- Culture score per offer (1–100)
- "You're trading NGN 50,000/month (8% of salary) for a role with 34% higher culture score. Based on your weighting, [Offer A/B] is the better fit."
- "How much is a 10-point culture score worth to you?" slider → personalized happiness premium

### 8. The Regret Minimization Test
Jeff Bezos' framework, gamified for African professionals.

**UI:**
- "The 80-year test"
- Prompt: "Imagine yourself at 80, looking back. Which choice would you most regret NOT making?"
- Offer cards shown with their key upside (equity, mission, money, growth)
- AI generates: "If you choose [Offer B], the most likely regret scenario is [missing the equity upside / not taking the stretch role / choosing safety over growth]"
- Not prescriptive — the point is to surface the emotional choice, not override the financial one

### 9. "Walk Away" Deadline Alert
"Offer expires Friday. Set a reminder."

**UI:**
- "Offer deadline" date input per offer
- "Remind me" → email or WhatsApp alert 48 hours before deadline
- "Deadline passed" detection: if deadline passed, shows "This offer may have expired"

### 10. Saved Evaluations (Auth-Gated)
For users juggling multiple job searches over weeks.

**Schema:**
```sql
create table joe_saved_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text,           -- "April 2026 job search"
  offers jsonb,         -- array of offer objects
  winner text,          -- which offer was selected
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## AI System Prompt Upgrade

```javascript
"job-offer-evaluator": {
  name: "Job Offer Evaluator — African Career Decision Tool",
  systemPrompt: `You are an African career advisor and compensation specialist. You help professionals make the most important career and financial decisions of their lives — choosing between job offers.

Your role:
- Analyze job offers comprehensively: not just salary but total compensation (benefits, equity, bonus)
- Calculate real net pay after PAYE and social security for any African country
- Monetize benefits: "Medical cover for family of 4 is worth NGN 480,000/year"
- Value equity for startup offers: scenario modeling, vesting, probability-weighted expected value
- Coach on negotiation: counter-offer scripts, justification from market data, walk-away lines
- Project 5-year career trajectories: earnings + title + skills in different company types
- Calculate relocation break-even when moves are involved
- Advise on culture vs. money trade-offs honestly
- Use the AfroSalary Database: "Your ask is at the [X]th percentile for [role] in [city]"
- Help with the regret minimization frame: financial analysis is necessary but not sufficient

African-specific nuances:
- 13th month bonus: common in Nigerian corporates, legally mandated in some sectors
- Pension (CPS/NSSF/SSNIT/GEPF): different schemes affect real take-home
- Benefits like NHIS/SHIF/medical coverage have higher real value in Africa than the face amount suggests (healthcare costs are high relative to salary)
- Startup equity in African startups has higher binary risk: most African startups do not IPO — the exit is acquisition or shutdown
- Remote work from Africa for foreign employers: always negotiate in USD/GBP, not local currency

Never just tell someone which offer to take — present the full picture and let them decide. Your job is to ensure they're deciding with complete information.`,

  exampleQueries: [
    "I have two offers: NGN 450,000 at a bank vs NGN 350,000 + 0.3% equity at a fintech startup. Which is better?",
    "How do I counter a job offer in Nigeria without being aggressive?",
    "My new offer is in USD but I'm staying in Lagos. How do I negotiate?",
    "The startup is offering equity but the vesting is 5 years — is that normal?",
    "I need to relocate from Lagos to Nairobi for this job. Is the salary increase worth it?"
  ]
}
```

---

## Cross-Tool Integration
- **PAYE calculators**: Net pay calculation per country for each offer
- **Salary Compare / AfroSalary DB**: Market rate context for negotiation
- **Pension Projection**: Long-term pension difference between employers
- **Staff Cost**: Employer's perspective (if user is the employer evaluating a counter)
- **Leave Calculator**: Leave entitlement differences between offers
- **Document Generator**: "Generate a negotiation counter-offer letter"
- **AfroPayroll OS**: Step 1 of New Job journey (Evaluate the Offer)
- **WhatsApp Bot**: Can receive offer details via chat and return quick comparison

---

## Mobile UX
- Offer cards: full-screen swipeable (one offer per screen on mobile)
- Benefits input: toggles not text fields (faster on mobile)
- Results: single winner card prominently at top, tap to expand full breakdown
- Counter-offer script: "Copy to WhatsApp" button — one tap to copy the negotiation script
- 5-year projection: horizontal scroll chart (Chart.js) on mobile
- Equity calculator: sliders not number inputs for scenario modeling
