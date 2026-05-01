# AfroPayroll Pro Build Brief

Created: 2026-05-01

## Product Thesis

AfroPayroll Pro should not be a premium calculator. It should become an Africa-first payroll workspace for the people who already run payroll with spreadsheets, WhatsApp, PDFs, bank portals, and manual tax lookups.

The promise is simple:

> Run small-team payroll across Africa, generate clean payslips and payroll summaries, and keep country-specific compliance steps in one workspace for a price small teams can actually afford.

## Expected Customers

### Primary Payers

1. Small business owners with 3 to 50 workers
   - Retail shops, restaurants, salons, clinics, private schools, logistics operators, farms, agencies, workshops, and service businesses.
   - They need monthly payslips, basic deductions, leave/overtime handling, and records for banks, staff disputes, audits, or visa proof.
   - They are often not ready for enterprise HR software, but they can pay for a tool that saves one painful payroll day every month.

2. Accountants, bookkeepers, and payroll freelancers
   - They run payroll for many small clients.
   - One $25 plan is easier to justify if it helps serve 5 to 20 client companies.
   - They need reusable company profiles, employee rosters, branded exports, and repeatable monthly runs.

3. HR and admin officers in growing SMEs
   - Often one person handles hiring, payroll, leave, benefits, documents, and exit paperwork.
   - They need structure, not a full enterprise HRMS.
   - They care about saved history, clean PDFs, compliance reminders, and fewer manual errors.

4. NGOs, churches, schools, clinics, and community organizations
   - They may have donor reporting, project staff, casual workers, and mixed payroll records.
   - They need simple audit trails and downloadable reports.
   - They may be willing to pay if exports look professional and the workflow reduces admin time.

5. Diaspora founders and remote operators hiring in Africa
   - They hire staff or contractors in Nigeria, Kenya, Ghana, South Africa, Uganda, Tanzania, Rwanda, Senegal, Cameroon, and nearby markets.
   - They need country-specific gross-to-net estimates, worker cost, document checklists, and payslips without hiring a full EOR at the start.

### Secondary Users

1. Employees checking salary offers
   - Mostly free acquisition users.
   - They use offer evaluation, take-home pay, minimum wage, leave entitlement, and payslip understanding.
   - They can invite employers by asking for proper payslips.

2. Job seekers and freelancers
   - Good top-of-funnel, but not the first payer.
   - Useful for CV, offer, invoice, tax, and contract products later.

3. Payroll consultants and HR trainers
   - Potential partner channel.
   - They can use AfroPayroll Pro in workshops and recommend it to clients.

## Who We Are Not Building For First

- Large enterprises with complex approval chains, unions, ERP integrations, and custom benefits.
- Companies that need full money movement on day one.
- EOR customers who expect legal employment, benefits administration, entity setup, and liability transfer.
- Users who only want a single free tax calculation once.

Those markets can come later, but the first product should win the under-served layer below enterprise payroll suites.

## Africa-First Language Strategy

"Afri-lingual" means the product is not just English with African country names. It must support local working language, local terms, and regional payroll expectations.

### Launch Language Lanes

1. English lane
   - Nigeria, Ghana, Kenya, Uganda, Tanzania, Rwanda, South Africa, Zambia, Zimbabwe, Botswana, Namibia, Malawi, Sierra Leone, Liberia, Gambia.
   - Primary terms: gross pay, basic salary, allowances, PAYE, pension, social security, leave, overtime, payslip, payroll run.

2. French lane
   - Senegal, Cote d'Ivoire, Cameroon, Benin, Togo, Mali, Burkina Faso, Niger, Guinea, DRC, Congo, Gabon, Chad, Madagascar, Morocco, Algeria, Tunisia.
   - Primary terms: salaire brut, salaire net, cotisations sociales, impot sur le revenu, fiche de paie, conge, heures supplementaires.

3. Swahili lane
   - Kenya, Tanzania, Uganda, Rwanda, Burundi, eastern DRC, and Swahili-first worker surfaces.
   - Primary terms: mshahara wa jumla, mshahara halisi, makato, kodi ya mshahara, pensheni, likizo, saa za ziada, hati ya mshahara.

4. Arabic-ready lane
   - Egypt, Sudan, Morocco, Algeria, Tunisia, Mauritania, Libya.
   - Build the interface so RTL can be added without redesigning the product.

5. Portuguese follow-on lane
   - Angola, Mozambique, Cape Verde, Guinea-Bissau, Sao Tome and Principe.
   - Add after the first English, French, and Swahili payroll workspace proves retention.

### Language Product Rules

- Store labels and country terms in a data layer instead of hardcoding copy into one page.
- Let each company choose workspace language separately from payroll country.
- Keep exported PDFs language-aware.
- Do not translate legal facts mechanically. Country payroll labels need local review before being marked verified.
- Use plain-language explainers beside statutory terms so non-specialists can understand deductions.

## Market Evidence

Existing payroll software confirms demand, but most visible products aim above the smallest operators.

- Sage Africa positions payroll for small businesses and medium businesses, with Sage Payroll recommended for 1 to 50 employees and starting from R83/month. Source: https://www.sage.com/africa/payroll-software/
- Workpay positions around payroll, compliance, HR, salary disbursements, employee self-service, startups, NGOs, healthcare, fintech, accountants, HR managers, and teams across Africa. Source: https://www.myworkpay.com/pricing
- SeamlessHR positions as all-in-one HR software with HRMS, payroll, performance, recruitment, time management, benefits, integrations, and country pages for Kenya, Uganda, Ghana, Nigeria, and South Africa. Source: https://seamlesshr.com/
- PaySpace emphasizes multi-national payroll, gross-to-net calculations, compliance updates, and pay-per-employee style payroll operations. Source: https://www.payspace.com/

The opening for AfroPayroll Pro is not to copy enterprise HRMS. The opening is a simpler, cheaper, multilingual payroll workspace for small teams, accountants, and operators who need professional outputs without an enterprise rollout.

## Current AfroTools Starting Assets

- Existing AfroPayroll OS surface:
  - `tools/afropayroll-os/index.html`
  - `tools/afropayroll-os/flow.html`
  - `engines/afropayroll-os-engine.js`
- Existing payroll and HR-adjacent tools:
  - `tools/payslip-generator/`
  - `tools/minimum-wage/`
  - `tools/overtime-calc/`
  - `tools/leave-calculator/`
  - `tools/social-security/`
  - country PAYE pages under `nigeria/`, `kenya/`, `ghana/`, `south-africa/`, `tanzania/`, `uganda/`, `rwanda/`, and others.
- Existing country PAYE engines:
  - `assets/js/engines/ng-paye.js`
  - `assets/js/engines/ke-paye.js`
  - `assets/js/engines/gh-paye.js`
  - `assets/js/engines/za-paye.js`
  - `assets/js/engines/eg-paye.js`
  - `assets/js/engines/tz-paye.js`
- Existing Pro and account pieces:
  - `assets/js/pro-gate.js`
  - `assets/js/afro-auth.js`
  - `assets/js/lib/workspace-sync.js`
  - `pro/index.html`
  - `pricing/index.html`
  - `netlify/functions/create-subscription.js`
  - `netlify/functions/create-checkout.js`

## First Paid Wedge

Build AfroPayroll Pro as a company payroll workspace, not a general HR suite.

### Free Layer

- Single payslip generation.
- Single country calculation.
- Offer or salary check.
- Browser-only workflow checklist.
- Watermarked or limited PDF exports where appropriate.

### Pro Layer

- Company profile.
- Employee roster.
- Monthly payroll run.
- Batch payslip generation.
- Branded PDF payslips.
- Payroll run history.
- CSV import and export.
- Country-specific payroll summaries.
- Leave and overtime fields.
- Saved compliance checklist.
- Shareable accountant or manager summary.
- Multilingual workspace labels and PDF labels.

## MVP Country Order

Start with 4 countries where the repo already has stronger payroll or PAYE assets:

1. Nigeria
2. Kenya
3. Ghana
4. South Africa

Then expand:

5. Tanzania
6. Uganda
7. Rwanda
8. Egypt
9. Senegal
10. Cameroon

The workspace can list all 54 countries, but only verified country packs should show as "full payroll pack." Others should show as "workflow and estimate mode" until their payroll rules are verified.

## MVP Build Scope

### Phase 1: Product Shell

- Upgrade `tools/afropayroll-os/` into the main Pro entry point.
- Add a clear customer split:
  - Business owner
  - Accountant/bookkeeper
  - HR/admin officer
  - Employee checking an offer
- Add language selector and language readiness copy.
- Add Pro positioning that explains what becomes paid.

### Phase 2: Workspace Core

- Add a company profile object.
- Add employee roster object.
- Add payroll run object.
- Save locally first, then sync through `AfroWorkspace` or a dedicated Supabase-backed path.
- Keep live Supabase actions separate from repo migrations and inspect schema first before relying on live tables.

### Phase 3: Payroll Run

- Use the existing payslip generator and PAYE engines where possible.
- Start with NG, KE, GH, ZA.
- Support basic salary, allowances, bonus, overtime, deductions, leave days, department, employee ID, and period.
- Generate per-employee result rows and a company summary.

### Phase 4: Exports

- Branded payslip PDF.
- Payroll summary PDF.
- CSV export for accountant handoff.
- Optional share link for signed-in Pro users.

### Phase 5: Language and Country Packs

- Add labels for English, French, and Swahili in the workspace.
- Make PDF export language-aware.
- Add country pack metadata:
  - country
  - currency
  - supported deductions
  - source confidence
  - last verified date
  - full pack vs estimate mode

## Pricing Hypothesis

- Individual Pro: $5/month stays as broad AfroTools Pro.
- AfroPayroll Pro: $25/month per workspace for small teams.
- Accountant plan: $49/month for multiple client workspaces.
- Enterprise or managed payroll: not in first build.

The $25 plan should feel like it replaces a monthly admin headache, not like it unlocks a cosmetic feature.

## First Success Metrics

- A user can create a company and add at least 3 employees.
- A user can run payroll for NG, KE, GH, or ZA.
- A user can download clean payslips and a summary report.
- A user can return later and see the saved payroll run.
- The UI supports English, French, and Swahili labels for the core workspace.
- The product clearly explains which countries are fully supported and which are estimate mode.

## Build Guardrails

- Do not claim live payroll compliance for a country unless the rules are verified.
- Do not imply AfroTools is disbursing salary until a real money-movement integration exists.
- Do not build a massive HRMS first. Build payroll records and exports first.
- Do not duplicate a parallel payroll product if `tools/afropayroll-os/` can be upgraded.
- Keep calculations pure where possible and isolate country pack data.
- Add browser QA for the actual workflow, not only page-load checks.

## First Implementation Decision

The first implementation pass should upgrade `tools/afropayroll-os/` into a clearer Pro SaaS shell and add a prototype workspace screen for:

- company profile
- employee roster
- payroll run setup
- country pack status
- language selection
- Pro upgrade prompts

The deeper payroll engine and Supabase persistence should come after the shell proves the workflow and data model.

## Current Country Pack Data Layer

- Canonical workspace source: `data/hr/afropayroll-country-packs.js`
- Browser helper: `assets/js/lib/afropayroll-country-packs.js`
- Current consumer: `tools/afropayroll-os/workspace.html`
- Launch full packs: NG, KE, GH, ZA.
- Estimate or next packs: TZ, UG, RW, SN, CM, EG.

Keep this layer as display and workflow metadata until payroll calculations, exports, and Supabase persistence are reviewed separately. Do not mark a country as filing-ready from this file alone.
