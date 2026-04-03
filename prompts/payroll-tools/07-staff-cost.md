# Prompt 07 — Employee Cost Calculator (Upgrade Spec)

## Identity

| Field | Value |
|-------|-------|
| **Tool ID** | `staff-cost` |
| **Name** | Employee Cost Calculator |
| **Tagline** | "The true cost of every hire. Before you sign the offer." |
| **Path** | `/tools/staff-cost/` |
| **CSS prefix** | `sc-` |
| **Accent color** | Amber `#D97706` / dark `#92400E` / pale `#FFFBEB` |
| **Engine** | `engines/staff-cost-engine.js` |
| **AI advisor key** | `"staff-cost"` in TOOL_CONTEXT |
| **Supabase tables** | none required initially |
| **Netlify function** | none required |

---

## Current State
15+ countries. Total hiring cost with employer contributions. Pie chart breakdown. Breakdown table with type badges. Toggle for additional cost components. Annual cost scaling. AI observations.

## What's Missing (full upgrade list)

---

## Feature Upgrades

### 1. Expand to All 54 Countries
Priority after current 15: Ethiopia, Egypt, Morocco, Algeria, Tunisia, Cameroon, Côte d'Ivoire, Senegal, and the remaining Francophone countries. Each requires correct employer social security rates.

### 2. "Hire vs. Contractor vs. EOR" Comparison
The three hiring models side by side. This is a startup founder and CFO's most important decision.

**UI:**
- Three columns: Full-Time Employee | Contractor | EOR (Employer of Record via Deel/Remote)
- For each model, calculate:
  - Monthly cost
  - Legal protections/risks
  - Flexibility (notice period to exit)
  - Benefits obligation
  - Tax compliance burden
- Example output for Lagos Senior Developer:
  - FTE: NGN 2.1M/month all-in
  - Contractor: NGN 1.6M/month (but: no pension, UIF, labour law exposure on misclassification)
  - EOR via Deel: ~$900/month = NGN 1.44M/month (but: no direct management complexity)
- "Recommendation" AI card: which model suits the user's situation

### 3. Multi-Country Expansion Planner
"I want to hire 5 engineers in Kenya, Nigeria, and Ghana. What is my monthly staff cost in each country?"

**UI:**
- "Multi-country mode" toggle
- Add countries (up to 5)
- Select role and salary level per country (or use AfroSalary DB benchmark)
- Results: side-by-side cost table per country
- "Cheapest country to hire [role]" highlighted
- Note: cheapest by salary does not mean cheapest total (employer contributions vary 15–30%)

### 4. 12-Month Budget Forecaster
True annual cost including all the items most budgets miss.

**Additional inputs:**
- Probation period: "Lower productivity assumed for first 3 months (ramp-up cost)"
- Mid-year salary review: % assumed increase
- 13th month bonus: mandatory in some countries (Nigeria common practice, Cameroon/Francophone mandatory)
- Annual leave encashment cost
- Recruitment cost: "Agency fee?" toggle + % input

**Output:**
- Month-by-month cost chart
- True annual total
- "You budgeted NGN 3.6M for this hire. The true first-year cost is NGN 4.8M" — the reality check

### 5. Termination Cost Calculator
"If this employee is retrenched after 3 years: statutory notice, severance, leave encashment, outstanding salary."

**UI:**
- "Termination scenario" button
- Inputs: years of service, reason (retrenchment vs. dismissal vs. resignation accepted)
- Output:
  - Notice period pay: X weeks × daily rate
  - Severance (where applicable): X weeks per year of service
  - Unused leave encashment: Y days × daily rate
  - Final salary (pro-rated): days worked in final month
  - Total termination liability: NGN/KES/ZAR X
- Legal notes: which termination types trigger which obligations

### 6. Sector-Specific Costs
Some sectors have radically different total costs that standard calculation misses.

**Sectors:**
- Oil & Gas (Nigeria/Angola): expatriate levy, local content costs, danger pay, accommodation
- Mining (Zambia/SA/DRC): shift allowances, danger pay, union agreements, medical
- Construction: project-based employment, safety levies, COID (SA)
- Agriculture: lower minimum wage sectors, seasonal worker costs

**UI:**
- "My sector" dropdown (optional)
- If sector selected: additional cost lines appear with explanation

### 7. Recruitment Cost Add-On
Most tools ignore this. First-year true cost must include recruitment.

**UI:**
- "Include recruitment cost" toggle
- Options: "Direct hire (no agency)" | "Agency fee [__% of annual salary]" | "Internal referral fee [NGN/KES X]"
- Typical rates shown: "Nigeria tech agency: 15–20%. Kenya: 12–15%. SA: 10–15%"
- Adds to first-year total cost only

### 8. "Staff vs. Tech" ROI
"This hire costs NGN 18M/year. A SaaS equivalent costs NGN 2.4M/year. ROI comparison."

**UI:**
- "Could this role be automated?" section
- User describes what the role does (text input)
- AI suggests: "A Customer Support Agent at NGN 180,000/month vs. Intercom AI Support ($299/month = NGN 478,000) — the human is 3.8× more expensive but provides [capabilities the AI cannot]"
- Framing: not "fire your staff" but "hire for what technology cannot do"

---

## AI System Prompt Upgrade

```javascript
"staff-cost": {
  name: "Employee Cost Calculator — True Cost of Hiring in Africa",
  systemPrompt: `You are an African employment cost and hiring strategy expert. You know the true all-in cost of employing someone across all 54 African countries — not just salary.

Your role:
- Calculate total employer cost including all statutory contributions
- Compare FTE vs. contractor vs. EOR for different country/role combinations
- Help with multi-country expansion cost planning
- Explain sector-specific costs: oil and gas, mining, construction, agriculture
- Include recruitment costs in first-year calculations
- Calculate termination liability: what it costs to exit an employee at each tenure milestone
- Compare cost of staff vs. technology/automation for process roles
- Explain the "hidden" costs: onboarding time, productivity ramp-up, training, equipment
- Help founders understand burn rate impact: "This hire extends your runway by X months at current burn"

Key nuances:
- Nigeria: 22–25% employer burden above gross salary (pension 10% + NHIS + NSITF + ITF + NHF not applicable to employer)
- Kenya: NSSF Tier II + AHL employer portions add ~10–12% above gross
- South Africa: UIF 1% + SDL 1% = low statutory burden but market benefit expectations are high
- Francophone Africa: typically 15–25% employer burden; varies significantly by country
- 13th month: mandatory in Cameroon, common in Nigeria (not mandatory), common in construction across Africa

Always show cost as both local currency and USD equivalent.`
}
```

---

## Cross-Tool Integration
- **Minimum Wage**: Compliance check on proposed salary before cost calculation
- **Social Security**: Employer contributions feed into cost breakdown
- **Payslip Generator**: "Generate a payslip for this employee"
- **Job Offer Evaluator**: Mirror tool for the employer perspective
- **Leave Calculator**: Annual leave encashment cost in termination scenario
- **AfroPayroll OS**: Step 2 of New Hire journey (Calculate Total Staff Cost)
- **Payroll API**: `POST /v1/payroll/staff-cost` endpoint
