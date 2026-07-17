# AfroWork Suite — Build Prompts Index

## What AfroWork Is

AfroWork is the platform-layer suite that sits **above** the 14 individual payroll/HR calculators in `/salary-tax/payroll/`. It is the connected product that turns standalone tools into an African employment operating system. Every feature in AfroWork connects back to the existing calculator tools, amplifying them rather than replacing them.

**Hub page:** `/afrowork/` (top-level, peer to `/creative/` and `/salary-tax/`)
**Navbar category:** `afrowork` — "AfroWork Suite" — icon ⚙️
**Accent color:** Amber `#D97706` / dark `#92400E` / light `#FEF3C7`
**Pattern:** Single-page hub with sections (follows `/creative/index.html` pattern, not the multi-sub-hub pattern of `/salary-tax/`)

---

## The 8 AfroWork Features

| # | Feature | Prompt File | Path | CSS Prefix | Accent |
|---|---------|-------------|------|------------|--------|
| 1 | AfroPayroll OS — Hire-to-Retire Workflow | `01-afropayroll-os.md` | `/tools/afropayroll-os/` | `apo-` | Blue `#1D4ED8` |
| 2 | Compliance Calendar — Statutory Deadlines | `02-compliance-calendar.md` | `/tools/compliance-calendar/` | `ccal-` | Orange `#EA580C` |
| 3 | Regulatory Change Alerts | `03-regulatory-alerts.md` | `/tools/regulatory-alerts/` | `ra-` | Red `#DC2626` |
| 4 | AI Labour Law Advisor | `04-labour-law-advisor.md` | `/tools/labour-law-advisor/` | `lla-` | Purple `#7C3AED` |
| 5 | AfroSalary Database — Crowdsourced | `05-afrosalary-database.md` | `/tools/afrosalary-db/` | `asd-` | Teal `#0D9488` |
| 6 | Document Generator Suite | `06-document-generator.md` | `/tools/doc-generator/` | `dg-` | Green `#059669` |
| 7 | Payroll API — B2B Revenue Layer | `07-payroll-api.md` | `/afrowork/api/` | `papi-` | Slate `#475569` |
| 8 | WhatsApp Bot — Zero-Friction Access | `08-whatsapp-bot.md` | `/afrowork/whatsapp/` | `wb-` | `#25D366` |

---

## The 14 Existing Payroll Tools (AfroWork connects these)

These tools already exist at `/salary-tax/payroll/` and are registered in `tool-registry.js`. AfroWork links them into workflows — it does not rebuild them.

| Tool ID | Name | Path |
|---------|------|------|
| `minimum-wage` | Minimum Wage Checker | `/tools/minimum-wage/` |
| `overtime-calc` | Overtime Calculator | `/tools/overtime-calc/` |
| `leave-calculator` | Leave Calculator | `/tools/leave-calculator/` |
| `social-security` | Social Security Calculator | `/tools/social-security/` |
| `pension-proj` | Pension Projection Calculator | `/tools/pension-proj/` |
| `payslip-generator` | Payslip Generator | `/tools/payslip-generator/` |
| `staff-cost` | Employee Cost Calculator | `/tools/staff-cost/` |
| `salary-compare` | African Salary Compare | `/tools/salary-compare/` |
| `ng-pension` | Nigeria Pension (CPS) | `/tools/ng-pension/` |
| `ke-nssf` | Kenya NSSF Calculator | `/tools/ke-nssf/` |
| `za-gepf` | South Africa GEPF Calculator | `/tools/za-gepf/` |
| `gh-ssnit` | Ghana SSNIT Calculator | `/tools/gh-ssnit/` |
| `za-uif` | South Africa UIF Calculator | `/tools/za-uif/` |
| `job-offer-evaluator` | Job Offer Evaluator | `/tools/job-offer-evaluator/` |

---

## Shared Infrastructure

- **Hub page:** `/afrowork/index.html` — single page, 8 sections with sticky nav tabs
- **Shared engine:** `engines/afrowork-engine.js` — shared auth check, AfroPoints calls, country context
- **Supabase tables (new):**
  - `afrowork_compliance_events` — statutory deadlines per country
  - `afrowork_regulatory_changes` — logged regulatory changes + crowdsource queue
  - `afrowork_alert_subscriptions` — user email/phone alert preferences
  - `afrowork_salary_submissions` — crowdsourced salary data (AfroSalary DB)
  - `afrowork_documents` — generated document vault per user
  - `afrowork_api_keys` — B2B API key management
- **Netlify functions (new):**
  - `netlify/functions/afrowork-compliance.js` — compliance calendar data
  - `netlify/functions/afrowork-alerts.js` — regulatory change webhook + email dispatch
  - `netlify/functions/afrowork-salary.js` — salary submission + retrieval
  - `netlify/functions/afrowork-docs.js` — document generation (PDF)
  - `netlify/functions/afrowork-api.js` — public Payroll API endpoint
  - `netlify/functions/afrowork-whatsapp.js` — WhatsApp webhook handler
- **AI advisor:** Each feature gets a `TOOL_CONTEXT` entry in `netlify/functions/ai-advisor.js`
- **AfroPoints:** Integrate with existing AfroPoints system for salary submissions and regulatory change reports

---

## Architecture Constraints (non-negotiable)

1. **Plain HTML + CSS + JS only** — no React, Vue, or any framework
2. **IIFE engine pattern** — all JS wrapped in `(function() { 'use strict'; ... })()`
3. **CSS custom properties** — use `tokens.min.css` variables, no hardcoded colors
4. **Supabase** — always via `AfroAuth.getSupabase()` for auth-gated features; direct client for public reads
5. **AI calls** — always through `/.netlify/functions/ai-advisor`, never direct Anthropic API calls from client
6. **Mobile-first** — 80%+ African users on phones; 3G-capable; touch targets 48px minimum
7. **No build step** — files are served as-is from Netlify, no webpack/vite
8. **Progressive enhancement** — tools must work (at basic level) without JS for core calculations

---

## Design Principles

- **Amber accent** `#D97706` for the suite shell; each feature has its own accent inside
- Mobile-first, 3G-capable — lazy load, skeleton screens, < 100KB JS per page
- AfroTools blue brand shell (`<afro-navbar>`, `<afro-footer>`) wraps all pages
- Dark mode via `prefers-color-scheme`
- `prefers-reduced-motion` — no looping animations
- Every feature must work for the SME owner on a Tecno phone in Accra as well as the CFO on a MacBook in Johannesburg
- AfroPoints integration is opt-in, never mandatory — tools work without it

---

## Hub Page Structure (`/afrowork/index.html`)

```
Hero (dark, amber accent gradient)
  ↓ Tagline: "The African Employment Operating System"
  ↓ Sticky section nav: OS | Calendar | Alerts | Legal AI | Salary DB | Docs | API | Bot

Section 1: AfroPayroll OS
Section 2: Compliance Calendar
Section 3: Regulatory Alerts
Section 4: Labour Law Advisor
Section 5: AfroSalary Database
Section 6: Document Generator
Section 7: Payroll API (B2B)
Section 8: WhatsApp Bot

Footer CTA: "Request a feature →"
```

---

## Navbar Entry (add to `assets/js/components/navbar.js`)

```javascript
{
  id: 'afrowork',
  label: 'AfroWork Suite',
  labelFr: 'Suite AfroWork',
  labelSw: 'Mfumo wa AfroWork',
  icon: '⚙️',
  desc: 'Payroll OS, compliance calendar, salary database, AI labour law advisor, document generator',
  href: '/afrowork/',
  color: '#FFFBEB',
  accent: '#D97706',
  tools: [
    { label: 'AfroPayroll OS — Hire-to-Retire Workflow', href: '/tools/afropayroll-os/', emoji: '🔄', badge: 'NEW' },
    { label: 'Compliance Calendar — Statutory Deadlines', href: '/tools/compliance-calendar/', emoji: '📅', badge: 'NEW' },
    { label: 'Regulatory Change Alerts', href: '/tools/regulatory-alerts/', emoji: '🔔', badge: 'NEW' },
    { label: 'AI Labour Law Advisor', href: '/tools/labour-law-advisor/', emoji: '⚖️', badge: 'NEW' },
    { label: 'AfroSalary Database', href: '/tools/afrosalary-db/', emoji: '📊', badge: 'NEW' },
    { label: 'Document Generator Suite', href: '/tools/doc-generator/', emoji: '📄', badge: 'NEW' },
    { label: 'Payroll API — B2B', href: '/afrowork/api/', emoji: '🔌', badge: 'NEW' },
    { label: 'WhatsApp Bot', href: '/afrowork/whatsapp/', emoji: '💬', badge: 'NEW' },
    { label: 'All AfroWork Features →', href: '/afrowork/', emoji: '⚙️' },
  ]
}
```

---

## Tool Registry Entries (add to `assets/js/components/tool-registry.js`)

```javascript
{ id: 'afropayroll-os', name: 'AfroPayroll OS', icon: '🔄', desc: 'Hire-to-retire workflow connecting all 14 payroll tools. New hire checklist, offboarding flow, compliance checkpoints.', href: '/tools/afropayroll-os/', category: 'afrowork', tier: 'T1', status: 'new', phase: 'NEW', countries: ['ALL'], revenue: 'Freemium', estTraffic: 12000, estRevenue: 300, priority: 95 },
{ id: 'compliance-calendar', name: 'Compliance Calendar', icon: '📅', desc: 'Statutory filing deadlines for all African countries. PAYE, pension, social security, levy remittance dates with email/WhatsApp alerts.', href: '/tools/compliance-calendar/', category: 'afrowork', tier: 'T1', status: 'new', phase: 'NEW', countries: ['ALL'], revenue: 'Freemium', estTraffic: 8000, estRevenue: 200, priority: 90 },
{ id: 'regulatory-alerts', name: 'Regulatory Change Alerts', icon: '🔔', desc: 'Get notified when minimum wages, tax rates, or pension contributions change in your country. AfroPoints for crowdsourced reports.', href: '/tools/regulatory-alerts/', category: 'afrowork', tier: 'T1', status: 'new', phase: 'NEW', countries: ['ALL'], revenue: 'Freemium', estTraffic: 6000, estRevenue: 150, priority: 88 },
{ id: 'labour-law-advisor', name: 'AI Labour Law Advisor', icon: '⚖️', desc: 'Claude-powered labour law Q&A for all 54 African countries. "Can my employer dock my pay?" → Answer + legal citation.', href: '/tools/labour-law-advisor/', category: 'afrowork', tier: 'T1', status: 'new', phase: 'NEW', countries: ['ALL'], revenue: 'Freemium', estTraffic: 15000, estRevenue: 400, priority: 93 },
{ id: 'afrosalary-db', name: 'AfroSalary Database', icon: '📊', desc: "Africa's crowdsourced salary database. 54 countries, every role. Contribute your salary → earn AfroPoints → unlock full benchmarks.", href: '/tools/afrosalary-db/', category: 'afrowork', tier: 'T1', status: 'new', phase: 'NEW', countries: ['ALL'], revenue: 'Freemium + API', estTraffic: 20000, estRevenue: 600, priority: 96 },
{ id: 'doc-generator', name: 'Document Generator Suite', icon: '📄', desc: 'Employment contracts, offer letters, termination letters, warning letters — country-specific, legally compliant, PDF download.', href: '/tools/doc-generator/', category: 'afrowork', tier: 'T1', status: 'new', phase: 'NEW', countries: ['ALL'], revenue: 'Freemium', estTraffic: 10000, estRevenue: 350, priority: 91 },
{ id: 'payroll-api', name: 'Payroll API', icon: '🔌', desc: 'B2B: integrate AfroTools payroll calculation engine into your app. 100 free calls/month, then $0.01/call. All 54 countries.', href: '/afrowork/api/', category: 'afrowork', tier: 'T1', status: 'new', phase: 'NEW', countries: ['ALL'], revenue: 'API Revenue', estTraffic: 3000, estRevenue: 800, priority: 85 },
{ id: 'whatsapp-bot', name: 'WhatsApp Payroll Bot', icon: '💬', desc: 'WhatsApp AfroTools: type PAYE Kenya 250000 → get net pay and deductions. Zero-friction access for Africa.', href: '/afrowork/whatsapp/', category: 'afrowork', tier: 'T1', status: 'new', phase: 'NEW', countries: ['ALL'], revenue: 'Distribution', estTraffic: 25000, estRevenue: 0, priority: 82 },
```

---

## Build Order

1. `/afrowork/index.html` — hub page (all 8 sections, "coming soon" badges where needed)
2. `04-labour-law-advisor` — highest immediate user value, builds on existing AI infrastructure
3. `05-afrosalary-database` — highest SEO/traffic flywheel, builds AfroPoints momentum
4. `06-document-generator` — clearest monetization path (PDF premium)
5. `02-compliance-calendar` — highest employer value, email capture
6. `03-regulatory-alerts` — extends compliance calendar, adds push layer
7. `01-afropayroll-os` — workflow layer, requires other tools to be deep first
8. `07-payroll-api` — B2B revenue, build last when calculation engines are stable
9. `08-whatsapp-bot` — requires WhatsApp Business API approval, longest lead time
