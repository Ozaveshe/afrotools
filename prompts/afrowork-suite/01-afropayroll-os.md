# Prompt 01 — AfroPayroll OS: Hire-to-Retire Workflow

## Identity

| Field | Value |
|-------|-------|
| **Name** | AfroPayroll OS |
| **Tagline** | "Every step. Every country. Every hire." |
| **Path** | `/tools/afropayroll-os/` |
| **CSS prefix** | `apo-` |
| **Accent color** | Blue `#1D4ED8` / dark `#1E3A8A` / pale `#EFF6FF` |
| **Engine** | `engines/afropayroll-os-engine.js` |
| **AI advisor key** | `"afropayroll-os"` in TOOL_CONTEXT |
| **Supabase tables** | `apo_workflows`, `apo_workflow_steps`, `apo_employee_profiles` |
| **Netlify function** | none required (client-side workflow state only) |

---

## What This Is

AfroPayroll OS is **not a calculator**. It is a guided workflow that chains the 14 existing payroll tools into logical employment journeys. The user picks a journey ("I'm hiring someone", "I'm being hired", "I'm calculating cost to expand"), and the OS walks them through each relevant tool in sequence — pre-filling data between steps where possible.

It makes the 14 individual tools feel like one coherent product rather than 14 separate pages.

---

## The Four Core Journeys

### Journey 1: New Hire Checklist (for employers)
The flagship flow. Steps in order:

1. **Check minimum wage** → `/tools/minimum-wage/` (country, sector) — "Is the salary you're offering legal?"
2. **Calculate staff cost** → `/tools/staff-cost/` (pre-filled with country + salary from step 1) — "What is the true monthly cost?"
3. **Generate offer letter** → `/tools/doc-generator/` (pre-filled: country, salary, role) — "Create a legally compliant offer letter"
4. **Generate first payslip** → `/tools/payslip-generator/` (pre-filled: same data) — "Set up the payslip template"
5. **Register for pension** → `/tools/pension-proj/` or country-specific (NG → ng-pension, KE → ke-nssf, GH → gh-ssnit, ZA → za-gepf) — "Understand the pension obligation"
6. **Register for social security** → `/tools/social-security/` — "Know the full contribution picture"
7. **Set up compliance alerts** → `/tools/compliance-calendar/` — "Never miss a filing deadline"

### Journey 2: New Job Evaluation (for employees/job seekers)
1. **Evaluate the offer** → `/tools/job-offer-evaluator/` — "Is this a good deal?"
2. **Check minimum wage** → `/tools/minimum-wage/` — "Are they offering at least the legal minimum?"
3. **Calculate net take-home** → country PAYE tool (pre-filled salary, country) — "What will I actually receive?"
4. **Check leave entitlements** → `/tools/leave-calculator/` — "What am I entitled to?"
5. **Understand pension deductions** → country-specific pension tool — "What happens to my pension?"
6. **Benchmark vs market** → `/tools/salary-compare/` — "Am I being paid fairly?"
7. **Set regulatory alerts** → `/tools/regulatory-alerts/` — "Get notified of changes affecting your pay"

### Journey 3: Expansion Cost Planner (for growing companies)
1. **Choose target country** (multi-select up to 3)
2. **Staff cost comparison** → `/tools/staff-cost/` (run for each country) — "Where is cheapest to hire?"
3. **Minimum wage check** → `/tools/minimum-wage/` — "What is the floor in each market?"
4. **Social security obligations** → `/tools/social-security/` — "What are the employer contribution rates?"
5. **Compliance calendar** → `/tools/compliance-calendar/` — "What are the filing deadlines?"
6. **Generate employment contract** → `/tools/doc-generator/` — "Create country-specific contracts"
7. **AI Labour Law briefing** → `/tools/labour-law-advisor/` — "Key things to know before hiring in [country]"

### Journey 4: Separation & Offboarding (for employers)
1. **Check notice period requirements** → `/tools/leave-calculator/` (statutory notice section) — "How much notice is required?"
2. **Calculate leave encashment** → `/tools/leave-calculator/` — "Unused leave owed at exit"
3. **Calculate UIF/social security exit** → `/tools/za-uif/` or `/tools/social-security/` — "Final social security obligations"
4. **Generate termination letter** → `/tools/doc-generator/` — "Create legally compliant termination document"
5. **Calculate final payslip** → `/tools/payslip-generator/` — "Pro-rated final pay"
6. **AI Labour Law review** → `/tools/labour-law-advisor/` — "Am I doing this correctly?"

---

## Pages & Views

### Landing Page (`index.html`)
- Hero: dark blue background, animated workflow diagram showing tools connecting
- "Which journey are you on?" — 4 large cards (New Hire / New Job / Expansion / Offboarding)
- "Used by 10,000+ African employers and employees" (social proof)
- How it works: 3 steps (Pick your journey → Follow the steps → Tools pre-fill each other)
- FAQ: 5 questions about data privacy, pre-fill accuracy, which countries are covered

### Workflow App (`flow.html`)
The main experience — a step-by-step guided flow:

**Progress bar** (sticky top):
- Step indicators: 1 → 2 → 3 → 4 → 5 → 6 → 7
- Current step highlighted in blue
- Completed steps show ✓ checkmark
- "X of 7 steps complete"

**Step Card** (one visible at a time):
- Step number + title
- Brief explanation of why this step matters (1-2 sentences)
- **"Open Tool"** button → opens the tool in a new tab (or iframe on desktop)
- **"Mark as Done"** button → advances to next step, saves progress
- Pre-fill notice: "We've pre-filled [salary, country] from your previous step"
- Skip option for optional steps

**Data Carry-Forward:**
- After each tool interaction, user confirms key outputs
- Confirmed data carries to next step as pre-fill context
- Stored in `localStorage` under `apo_journey_{journeyId}_{sessionId}`
- Supabase persistence for logged-in users (`apo_workflow_steps` table)

**Completion Screen:**
- "You've completed the [New Hire] checklist"
- Summary of all key numbers: salary, net pay, employer cost, pension, filing deadlines
- "Share this checklist" (WhatsApp link, copy link)
- "Start another journey" CTA
- Download summary as PDF

---

## Data Carry-Forward Logic

The engine passes context between tools via URL query parameters where tools support it, and via `localStorage` where they don't:

```javascript
// Example: After minimum-wage step, staff-cost gets pre-filled
const carryData = {
  country: 'NG',
  salary: 150000,
  currency: 'NGN',
  sector: 'technology',
  employeeType: 'full-time'
};

// URL pre-fill (where tool supports it):
const staffCostUrl = `/tools/staff-cost/?country=NG&salary=150000&currency=NGN`;

// localStorage pre-fill (universal fallback):
localStorage.setItem('apo_prefill', JSON.stringify(carryData));
// Tools check for apo_prefill on load and auto-populate fields
```

---

## AI Integration (TOOL_CONTEXT for ai-advisor.js)

```javascript
"afropayroll-os": {
  name: "AfroPayroll OS — Hire-to-Retire Workflow",
  systemPrompt: `You are an African employment compliance expert. You guide employers and employees through the full employment lifecycle across all 54 African countries.

Your role in AfroPayroll OS:
- Help users choose the right journey for their situation
- Explain why each step in the workflow matters
- Warn about compliance risks at each stage ("In Nigeria, failing to register a new hire for pension within 3 months triggers PenCom penalties")
- Pre-empt common mistakes ("Don't sign the offer letter before checking if the salary meets sector minimum wage")
- Give country-specific advice on timing ("In Kenya, NSSF registration must happen before the first payslip")
- Be a checklist enforcer — if a user wants to skip a step, explain the legal risk

You have deep knowledge of:
- Employment Acts for all 54 African countries
- Pension registration procedures (PenCom Nigeria, NSSF Kenya, SSNIT Ghana, GEPF South Africa)
- Statutory deductions and filing timelines
- Document requirements for employment contracts in each country
- Retrenchment and termination procedures
- Social security registration requirements

Be specific, be actionable, cite the specific law when relevant. Never say "consult a lawyer" as the first response — give the actual answer, then suggest professional advice for complex situations.`,
  exampleQueries: [
    "I'm hiring my first employee in Nigeria. What do I need to do?",
    "What documents must I give a new employee in Kenya?",
    "How long do I have to register a new hire for pension in Ghana?",
    "What's the correct order of steps when firing someone in South Africa?",
    "I'm expanding to three African countries. Where should I start?"
  ]
}
```

---

## Supabase Schema

```sql
-- Saved workflow progress for logged-in users
create table apo_workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  journey_type text not null, -- 'new-hire' | 'new-job' | 'expansion' | 'offboarding'
  country text,
  status text default 'in-progress', -- 'in-progress' | 'complete'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table apo_workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references apo_workflows(id) on delete cascade,
  step_number integer not null,
  tool_id text not null,
  status text default 'pending', -- 'pending' | 'done' | 'skipped'
  carry_data jsonb, -- data captured from this step for next steps
  completed_at timestamptz
);

create table apo_employee_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  name text,
  country text,
  role text,
  salary numeric,
  currency text,
  start_date date,
  employer_name text,
  created_at timestamptz default now()
);
```

---

## Engine (`engines/afropayroll-os-engine.js`)

```javascript
(function() {
  'use strict';

  const AfroPayrollOS = {
    id: 'afropayroll-os',
    version: '1.0.0',

    JOURNEYS: {
      'new-hire': {
        label: 'New Hire Checklist',
        icon: '👤',
        audience: 'employer',
        steps: [
          { toolId: 'minimum-wage', label: 'Check Minimum Wage', required: true },
          { toolId: 'staff-cost', label: 'Calculate Total Staff Cost', required: true },
          { toolId: 'doc-generator', label: 'Generate Offer Letter', required: false, docType: 'offer-letter' },
          { toolId: 'payslip-generator', label: 'Set Up First Payslip', required: true },
          { toolId: 'pension-proj', label: 'Set Up Pension', required: true, countryVariants: { NG: 'ng-pension', KE: 'ke-nssf', GH: 'gh-ssnit', ZA: 'za-gepf' } },
          { toolId: 'social-security', label: 'Register Social Security', required: true },
          { toolId: 'compliance-calendar', label: 'Set Compliance Alerts', required: false },
        ]
      },
      'new-job': {
        label: 'New Job Evaluation',
        icon: '💼',
        audience: 'employee',
        steps: [
          { toolId: 'job-offer-evaluator', label: 'Evaluate the Offer', required: true },
          { toolId: 'minimum-wage', label: 'Check Minimum Wage', required: false },
          { toolId: 'salary-compare', label: 'Benchmark vs Market', required: false },
          { toolId: 'leave-calculator', label: 'Check Leave Entitlements', required: false },
          { toolId: 'pension-proj', label: 'Understand Pension Deductions', required: false },
          { toolId: 'regulatory-alerts', label: 'Set Pay Change Alerts', required: false },
        ]
      },
      'expansion': {
        label: 'Expansion Cost Planner',
        icon: '🌍',
        audience: 'employer',
        steps: [
          { toolId: 'staff-cost', label: 'Compare Staff Costs by Country', required: true },
          { toolId: 'minimum-wage', label: 'Check Minimum Wages', required: true },
          { toolId: 'social-security', label: 'Review Employer Contributions', required: true },
          { toolId: 'compliance-calendar', label: 'Review Filing Deadlines', required: true },
          { toolId: 'doc-generator', label: 'Generate Country-Specific Contracts', required: false, docType: 'employment-contract' },
          { toolId: 'labour-law-advisor', label: 'Get Labour Law Briefing', required: false },
        ]
      },
      'offboarding': {
        label: 'Separation & Offboarding',
        icon: '🚪',
        audience: 'employer',
        steps: [
          { toolId: 'leave-calculator', label: 'Check Notice Period', required: true },
          { toolId: 'leave-calculator', label: 'Calculate Leave Encashment', required: true },
          { toolId: 'za-uif', label: 'Calculate UIF / Social Security Exit', required: false, countryRestricted: ['ZA'] },
          { toolId: 'doc-generator', label: 'Generate Termination Letter', required: true, docType: 'termination-letter' },
          { toolId: 'payslip-generator', label: 'Generate Final Payslip', required: true },
          { toolId: 'labour-law-advisor', label: 'Review Compliance', required: false },
        ]
      }
    },

    // Get country-specific tool variant
    getToolForCountry(step, country) {
      if (step.countryVariants && step.countryVariants[country]) {
        return step.countryVariants[country];
      }
      return step.toolId;
    },

    // Build pre-fill URL for next tool
    buildPreFillUrl(toolId, carryData) {
      const base = this.getToolPath(toolId);
      const params = new URLSearchParams();
      if (carryData.country) params.set('country', carryData.country);
      if (carryData.salary) params.set('salary', carryData.salary);
      if (carryData.currency) params.set('currency', carryData.currency);
      if (carryData.role) params.set('role', carryData.role);
      const qs = params.toString();
      return qs ? `${base}?${qs}` : base;
    },

    getToolPath(toolId) {
      const paths = {
        'minimum-wage': '/tools/minimum-wage/',
        'staff-cost': '/tools/staff-cost/',
        'doc-generator': '/tools/doc-generator/',
        'payslip-generator': '/tools/payslip-generator/',
        'ng-pension': '/tools/ng-pension/',
        'ke-nssf': '/tools/ke-nssf/',
        'gh-ssnit': '/tools/gh-ssnit/',
        'za-gepf': '/tools/za-gepf/',
        'pension-proj': '/tools/pension-proj/',
        'social-security': '/tools/social-security/',
        'compliance-calendar': '/tools/compliance-calendar/',
        'job-offer-evaluator': '/tools/job-offer-evaluator/',
        'salary-compare': '/tools/salary-compare/',
        'leave-calculator': '/tools/leave-calculator/',
        'regulatory-alerts': '/tools/regulatory-alerts/',
        'za-uif': '/tools/za-uif/',
        'labour-law-advisor': '/tools/labour-law-advisor/',
      };
      return paths[toolId] || `/tools/${toolId}/`;
    },

    // Save progress to localStorage
    saveProgress(journeyId, stepIndex, carryData) {
      const key = `apo_journey_${journeyId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      existing.currentStep = stepIndex;
      existing.carryData = { ...existing.carryData, ...carryData };
      existing.updatedAt = Date.now();
      localStorage.setItem(key, JSON.stringify(existing));
    },

    // Load progress
    loadProgress(journeyId) {
      const key = `apo_journey_${journeyId}`;
      return JSON.parse(localStorage.getItem(key) || '{}');
    }
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.afropayrollOs = AfroPayrollOS;
})();
```

---

## Cross-Tool Integration

- **All 14 payroll tools**: AfroPayroll OS is the connector; it does not duplicate any calculation logic
- **AfroSalary Database**: Salary benchmark shown in New Job journey after Evaluate step
- **Compliance Calendar**: Final step of New Hire and Expansion journeys
- **Labour Law Advisor**: Optional final step of Expansion and Offboarding journeys
- **Document Generator**: Embedded directly into New Hire (offer letter) and Offboarding (termination letter)

---

## Mobile UX

- Journey selection: full-screen cards, one per journey, large icon + title + one-line description
- Progress bar: horizontal dots on mobile (not full step labels — too narrow)
- Each step card: full-width, thumb-zone "Mark Done" button anchored to bottom
- "Open Tool" opens in same tab on mobile, new tab on desktop (detect via screen width)
- Offline support: journey progress saved to localStorage, survives network drops
- "Resume where I left off" prompt on return visits if incomplete journey found

---

## Performance

- No heavy JS frameworks — vanilla JS IIFE
- Journey state in localStorage — zero server calls until user logs in
- Tool navigation is just `<a>` links — no preloading needed
- Landing page is pure HTML/CSS (no JS) — instant load
- Target: < 30KB JS on flow page
