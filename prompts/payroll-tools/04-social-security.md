# Prompt 04 — Social Security Calculator (Upgrade Spec)

## Identity

| Field | Value |
|-------|-------|
| **Tool ID** | `social-security` |
| **Name** | Social Security Calculator |
| **Tagline** | "Know what you pay in. Know what you get out." |
| **Path** | `/tools/social-security/` |
| **CSS prefix** | `ss-` |
| **Accent color** | Indigo `#4F46E5` / dark `#3730A3` / pale `#EEF2FF` |
| **Engine** | `engines/social-security-engine.js` |
| **AI advisor key** | `"social-security"` in TOOL_CONTEXT |
| **Supabase tables** | `ss_contribution_tracker` |
| **Netlify function** | none required |

---

## Current State
30+ countries. Employee + employer contributions. Scheme breakdown (pension, health insurance, work injury, housing fund). Contribution caps. Annual totals. AI observations.

## What's Missing (full upgrade list)

---

## Feature Upgrades

### 1. "What Do I Actually Receive?" Benefits Explainer
The most critical missing feature. Currently the tool only shows what goes IN. Nobody explains what comes OUT. Benefits make contributions feel worthwhile.

**Per scheme, show:**
- **Pension benefit**: "After 20 years of NSSF contributions at this salary, you'd receive approximately KES X/month at retirement"
- **Health insurance benefit**: "NHIS/SHIF covers up to X% of hospital bills at public hospitals"
- **Work injury benefit**: "If permanently disabled, you receive X% of annual salary for life"
- **Death benefit**: "On death, dependants receive X months' salary as lump sum"

**UI:**
- Tab toggle on results: "Contributions" (current) | "Benefits"
- Benefits tab: 4 cards per active scheme with benefit amount

### 2. Contribution History Gap Analyzer
"I worked for 3 companies over 10 years. Company 2 probably didn't remit my pension. How do I check?"

**UI:**
- New section: "Check your contribution history"
- Step-by-step guide per country:
  - Nigeria: Check RSA statement on PenCom MiPension app or PFA portal
  - Kenya: NSSF self-service portal (nssf.or.ke), request statement
  - Ghana: SSNIT member self-service (ssnit.com.gh)
  - South Africa: GEPF member portal / retirement fund statement
- "Red flags to look for": missing months, lower amounts than expected
- "If you find discrepancies": who to report to, template letter

### 3. Self-Employed / Informal Sector Pathway
"I'm a Lagos street trader. Can I access NSSF? Yes — here's how." Almost entirely unserved.

**UI:**
- Toggle: "I'm self-employed / informal worker"
- Shows: which schemes are accessible for voluntary contributions in this country
- Kenya NSSF: voluntary self-enrollment possible, rates shown
- Nigeria micro-pension: PenCom micro-pension scheme since 2019, explains enrollment
- Ghana SSNIT Tier 3: voluntary
- Step-by-step enrollment guide with links to official portals

### 4. Cross-Country Comparison Table
"Working in Nigeria vs Kenya vs South Africa: total social security burden as % of gross salary."

**UI:**
- Multi-select countries (up to 5)
- Results: side-by-side table with % of gross salary per country for both employee and employer
- Bar chart comparison
- "Cheapest for employers" highlight
- "Best benefits coverage" note per country

### 5. Expat Double-Contribution Checker
"I'm a French citizen working in Côte d'Ivoire. Am I paying into both French and Ivoirian social security simultaneously?"

**UI:**
- Toggle: "I'm a foreign national / expat"
- Input: nationality/home country + work country
- Shows: bilateral social security agreement status
  - "Agreement exists: you likely only pay in [work country]"
  - "No agreement: you may be liable in both countries — consult a tax advisor"
- List of African bilateral agreements (expanding dataset)

### 6. Benefits-Received vs. Contributed Ratio
Show the value proposition of each scheme. This is a behavioral nudge to keep people contributing.

**Highlight case (UIF South Africa):**
"You earn ZAR 25,000/month. UIF contribution: ZAR 250/month = ZAR 3,000/year. If retrenched: UIF pays up to ZAR 347,000 total. UIF is the best-value insurance in Africa."

**UI:**
- After calculation: "Is social security worth it?" expandable card
- Shows: annual contribution vs. maximum potential benefit per scheme
- ROI framing: "You put in ZAR 3,000/year. You could get back ZAR 347,000. That's 115:1."

### 7. Employer Non-Remittance Alert
"70% of Nigerian private sector employees are not registered for pension." Make this gap visible.

**UI:**
- After calculating expected contributions: "Are you receiving these contributions?"
- Checklist: "Does your payslip show pension deducted? ✓ Have you received an RSA statement? ✓"
- "If no to either: your employer may not be remitting. Steps to verify and report [→]"

---

## AI System Prompt Upgrade

```javascript
"social-security": {
  name: "Social Security Calculator — African Contributions & Benefits",
  systemPrompt: `You are an African social security and workers' benefits expert. You know contribution rates AND benefit entitlements for social security schemes across all 54 African countries.

Your role:
- Calculate both employee and employer contributions accurately
- Explain what contributors receive in return: pension, health, injury, death benefits
- Guide self-employed and informal workers on voluntary contribution options
- Help workers identify if their employer is not remitting contributions
- Explain bilateral social security agreements for expats
- Compare social security burdens across countries for expansion planning
- Know the micro-pension scheme (Nigeria), SSNIT Tier 3 (Ghana), NSSF voluntary (Kenya)
- Explain contribution caps and their impact on high earners
- Help workers check their contribution history through official portals

Key knowledge:
- Nigeria: PenCom RSA, NSITF (work injury 1% employer), NHIS (employer mandatory in some sectors), NHF (2.5% employee housing fund), ITF (1% employer training levy)
- Kenya: NSSF Tier I + II, SHIF (replaced NHIF 2024 at 2.75%), AHL (Affordable Housing Levy 1.5%)
- South Africa: UIF (1% each), SDL (1% employer), no national health insurance yet
- Ghana: SSNIT 3-tier system (13.5% Tier 1, 5% Tier 2, voluntary Tier 3)
- Always clarify which deductions are pension vs. health vs. injury insurance`
}
```

---

## Cross-Tool Integration
- **Pension Projection**: Social security contributions feed into long-term projection
- **Staff Cost**: Employer social security contributions are a major component of true cost
- **UIF Calculator (ZA)**: Direct link when South Africa UIF is discussed
- **Labour Law Advisor**: "Is my employer legally required to pay [scheme]?"
- **AfroPayroll OS**: Step 6 of New Hire journey (Register for Social Security)
- **WhatsApp Bot**: `PENSION Nigeria 300000` command
