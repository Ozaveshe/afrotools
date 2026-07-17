# Prompt 10 — Kenya NSSF Calculator (Upgrade Spec)

## Identity

| Field | Value |
|-------|-------|
| **Tool ID** | `ke-nssf` |
| **Name** | Kenya NSSF Benefits Calculator |
| **Tagline** | "Your NSSF contributions. What you pay. What you get." |
| **Path** | `/tools/ke-nssf/` |
| **CSS prefix** | `nssf-` |
| **Accent color** | Red `#DC2626` / dark `#991B1B` / pale `#FEF2F2` |
| **Engine** | `engines/ke-nssf-engine.js` |
| **AI advisor key** | `"ke-nssf"` in TOOL_CONTEXT |
| **Supabase tables** | none required initially |
| **Netlify function** | none required |

---

## Current State
Tier I and Tier II breakdown. Contribution caps. Projected benefits. Breakdown table. Sidebar NSSF information.

## What's Missing (full upgrade list)

---

## Feature Upgrades

### 1. NSSF Act 2013 vs. Old Act Comparison
The NSSF Act 2013 introduced Tier I + Tier II. It was challenged in court and phased in gradually. As of 2024 it is active but confusion remains. Many workers still don't know which rates apply to them.

**UI:**
- "Which NSSF rules apply to me?" explainer section
- Old Act: flat KES 200 employee + KES 200 employer (KES 400 total)
- New Act 2013: 6% of gross up to Lower Earnings Limit (Tier I) + 6% of excess up to Upper Earnings Limit (Tier II)
- "Your employer is using [old/new] rates" detection based on input amount
- Impact calculator: "Old act: KES 400/month vs New act: KES X/month. Difference: KES Y"

### 2. Combined NSSF + SHIF + AHL Dashboard
Kenya replaced NHIF with SHIF in October 2024. Added AHL (Affordable Housing Levy) in 2023. Most Kenyans don't understand their combined statutory burden.

**UI:**
- "My full statutory deductions" view
- Shows all three together:
  - NSSF Tier I: KES X
  - NSSF Tier II: KES Y
  - SHIF (2.75% of gross): KES Z
  - AHL (1.5% of gross): KES W
  - Total statutory deductions: KES [sum]
  - As % of gross salary: [%]
- Employer matching portions shown alongside
- "Your employer also pays KES [total employer contributions]"

### 3. NSSF Benefits Breakdown
Not just contributions — what do you actually receive?

**Benefits to explain:**
- **Age Benefit**: pension at retirement (60 years, reduced at 55)
- **Invalidity Benefit**: permanent disability pension
- **Survivor's Benefit**: paid to dependants on death
- **Funeral Grant**: lump sum on death (currently KES 2,500 — minimal but documented)
- **Withdrawal Benefit**: if you leave formal employment before retirement

**UI:**
- "What do I receive?" tab on results
- Each benefit card: eligibility criteria + how much + how to claim

### 4. NSSF Self-Registration Guide (Gig & Informal Workers)
Gig workers, casual workers, domestic workers can voluntarily register for NSSF.

**UI:**
- "I'm self-employed / gig worker" toggle
- Shows: how to register as a voluntary NSSF contributor
- Contribution options for voluntary: KES 200/month minimum
- How to pay: M-Pesa Paybill number (1000655) — this is the actual Paybill
- Benefits of voluntary contributions vs. not contributing at all

### 5. Trustee Fund Manager Comparison (Tier II)
NSSF Tier II contributions go to approved occupational pension schemes or NSSF's own fund. Which fund has better returns?

**UI:**
- "Your Tier II fund" section
- NSSF managed fund vs. approved occupational schemes (for employers who have set these up)
- Returns comparison where data is available from RBA (Retirement Benefits Authority)
- Guide: how employers can set up an approved occupational scheme

### 6. Pension Projection (NSSF-specific)
Currently the tool shows contributions but not long-term projection.

**UI:**
- "Project my NSSF retirement benefit" section
- Inputs: current age, retirement age, current salary, expected annual increases
- Output: projected NSSF fund at retirement, estimated monthly benefit
- Shown alongside: "This is your NSSF benefit. It is not enough — here's the gap to a comfortable retirement and how to fill it [→ Pension Projection tool]"

---

## AI System Prompt Upgrade

```javascript
"ke-nssf": {
  name: "Kenya NSSF Benefits Calculator",
  systemPrompt: `You are a Kenya social security and NSSF expert. You know the NSSF Act 2013, its implementation status, and how it interacts with SHIF, AHL, and other statutory deductions.

Your role:
- Calculate NSSF Tier I and Tier II accurately with current pensionable pay limits
- Explain the difference between old NSSF Act and NSSF Act 2013 rates
- Show the combined statutory deduction burden: NSSF + SHIF + AHL
- Explain all NSSF benefit types: age, invalidity, survivor, funeral grant
- Guide self-employed and gig workers on voluntary NSSF enrollment
- Explain the Tier II trustee fund options
- Know filing deadlines: NSSF due by 9th of following month (same as PAYE and SHIF)
- Explain the SHIF transition from NHIF (October 2024 change — new rates, new system)
- Know the AHL: 1.5% of gross (employee) + 1.5% employer, effective from June 2023
- Help workers check their contribution history via NSSF self-service portal`
}
```

---

## Cross-Tool Integration
- **Pension Projection**: NSSF projection feeds into broader retirement planning
- **Social Security**: Part of Kenya's full social security picture
- **Compliance Calendar**: NSSF due date (9th of following month)
- **Payroll API**: Kenya social security endpoint uses this engine
- **WhatsApp Bot**: `NSSF Kenya 120000` command
