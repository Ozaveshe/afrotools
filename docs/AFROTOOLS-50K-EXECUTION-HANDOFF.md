# AfroTools 50K Execution Handoff

Updated: 2026-05-04

## Direction

AfroTools is now sales-led, SEO-assisted.

The free tool directory still matters, but it is no longer the whole product. Free tools are acquisition, proof, distribution, and trust. The operating goal is to turn high-intent calculator traffic into B2B revenue, backlinks, email capture, partner distribution, widget pilots, sponsored placements, API/data subscriptions, custom calculator builds, and business subscriptions.

Every new feature, page, workflow, or tool upgrade must answer at least one of these:

- Does this create or support revenue?
- Does this earn backlinks or partner distribution?
- Does this capture a qualified email or B2B enquiry?
- Does this improve a page that can sell widgets, API access, sponsorships, calculators, or subscriptions?

If the answer is no, the work is lower priority unless it fixes a live user problem, security issue, data accuracy problem, or release blocker.

## Competitor Signals To Beat

Observed 2026-05-12:

- PDF competitors such as iLovePDF sell speed, bulk work, mobile/desktop availability, saved workflows, cloud integrations, and privacy/offline handling as first-class product value. AfroTools document and widget work should keep emphasizing browser-local processing, repeatable workflows, script/iframe fallback, and low-friction publishing.
- Focused African tax competitors such as Kadiria, WAKATAX, and Taxngr win trust by loudly stating current 2026 law coverage, no-signup use, browser-local calculations, visible breakdowns, and clear filing disclaimers. AfroTools should keep top money tools source-backed, dated, locally contextual, and honest about estimates versus official filing.
- Generic calculator and PDF platforms win by removing steps. For AfroTools, the commercial edge is not only tool count; it is letting a user calculate, save/export, embed, sponsor, request a custom build, or move into an API pilot from the same high-intent workflow.

## Priority Offers

1. Widgets
   - Public route: `/widgets/`
   - Technical gallery: `/widgets/demo/`
   - Embed loader: `/widgets/embed.js`
   - Iframe utility pages: `/widgets/iframe/`
   - Offer shape: Free widget with AfroTools badge and backlink, Widget Pro with white-label branding, setup, analytics, and lead capture, plus custom widget builds.

2. Sponsored tools
   - Public route: `/sponsored-tools/`
   - Sell tool, category, country, and newsletter/media placements.
   - Must show practical placements, pilot pricing ranges, and the lead path.

3. API and data subscriptions
   - Public routes: `/api/`, `/api/pricing.html`, `/api/docs/`, `/developers/`
   - Dashboard route: `/dashboard/api/`
   - Offer shape: Free sandbox/key, API Growth or Starter pilot, API Pro, Enterprise/custom.
   - Do not hide API under low-price consumer Pro. If backend tiering is not ready, public copy must say pilot/contact instead of overclaiming live paid tiers.

4. Custom calculators
   - Public route: `/custom-calculators/`
   - Sell branded calculator builds for HR, payroll, fintech, accounting, schools, immigration, business media, trade, and tax workflows.

5. Business subscriptions
   - Public routes: `/pro/`, `/pricing/`
   - Work routes: `/pro/workspace/`, `/pro/apps/`
   - Pro remains a paid operating surface. Keep public homepage mostly free and discovery-led; place Pro prompts near high-intent workflows and gated features.

6. Media kit and partner inventory
   - Public route: `/media-kit/`
   - Should make buying easy: audience, inventory, offer ladder, pricing ranges, example placements, FAQ, and enquiry CTA.

7. B2B enquiry capture
   - Public route: `/business-enquiry/`
   - Component: `assets/js/components/b2b-enquiry-form.js`
   - Function: `netlify/functions/capture-b2b-lead.js`
   - Endpoint: `/api/b2b-enquiry`
   - Workflow doc: `docs/B2B-LEAD-CAPTURE-WORKFLOW.md`

## Priority Pages

### Built or current source routes

- `/widgets/`
- `/widgets/demo/`
- `/sponsored-tools/`
- `/custom-calculators/`
- `/media-kit/`
- `/business-enquiry/`
- `/api/`
- `/api/pricing.html`
- `/api/docs/`
- `/developers/`
- `/pricing/`
- `/pro/`
- `/pro/workspace/`
- `/pro/apps/`
- `/advertise/`
- `/contact/`
- `/for-accountants/`
- `/for-hr-payroll/`
- `/for-fintechs/`
- `/for-schools/`

### Segment routes

The first four 50K segment routes now exist and should route buyers into `/business-enquiry/`, not become generic landing pages:

- `/for-accountants/` for VAT, PAYE, invoice, tax-calendar, import-duty, widget, custom calculator, and API pilots.
- `/for-hr-payroll/` for PAYE, payslip, employer-cost, payroll education, Widget Pro, custom calculator, and API pilots.
- `/for-fintechs/` for fee, loan, remittance, savings, FX, sponsored tool, custom calculator, and API pilots.
- `/for-schools/` for admissions, fees, grades, scholarships, education sponsorship, and custom calculator pilots.

## Priority Money Tools

These pages are revenue surfaces, not only calculators. They need strong SEO, honest assumptions, worked examples, related links, business CTA, and a save/download/email path where relevant.

Core top-money set:

- Nigeria PAYE: `nigeria/ng-salary-tax.html`
- Nigeria VAT: `nigeria/ng-vat.html`
- Nigeria invoice generator: `tools/invoice-generator/index.html`
- Nigeria business tax calendar: `tools/compliance-calendar/index.html`
- Kenya PAYE: `kenya/ke-paye.html`
- Kenya VAT: `kenya/ke-vat.html`
- Kenya employer cost: `tools/employee-cost/kenya/index.html`
- Kenya payslip: `tools/payslip-generator/index.html`
- Ghana PAYE: `ghana/gh-paye.html`
- Ghana VAT: `ghana/gh-vat.html`
- Ghana invoice generator: `tools/invoice-generator/index.html`
- Ghana employer cost: `tools/employee-cost/ghana/index.html`
- South Africa PAYE: `south-africa/za-paye.html`
- South Africa VAT: `south-africa/za-vat.html`
- South Africa invoice generator: `tools/invoice-generator/index.html`
- South Africa employer cost: `tools/employee-cost/south-africa/index.html`
- Africa payroll hub: `tools/afropayroll-os/index.html`
- Africa VAT rates hub: `vat-business-tax/index.html`
- Remittance calculator: `tools/remittance-compare/index.html`
- Import duty calculator: `tools/import-duty/index.html`

For high-intent salary, tax, invoice, payroll, import, remittance, employer-cost, and VAT pages, use the shared business CTA component documented in `docs/ADDING-A-TOOL.md`:

```html
<script src="/assets/js/components/business-cta.js" defer></script>
```

```html
<afro-business-cta
  tool-name="Nigeria PAYE Calculator"
  save-note="Save named salary scenarios or use the PDF report action after calculating."></afro-business-cta>
```

Do not write one-off commercial CTA blocks when the shared component fits.

## LATMtools Launch Gate

`LATMtools` is a launch gate name in this repo, not an existing route or product folder as of 2026-05-04.

Do not launch or present LATMtools as a public campaign until all gate checks are true:

- The main commercial pages exist and have working B2B enquiry CTAs: `/widgets/`, `/sponsored-tools/`, `/custom-calculators/`, `/media-kit/`, `/api/`.
- `/business-enquiry/` works through the server-side Netlify function, not anonymous browser Supabase writes.
- The top money tools listed above have business CTA coverage and honest tax/finance disclaimers.
- Widget demos and embed routes still work: `/widgets/demo/`, `/widgets/embed.js`, `/embed/`, and `/widgets/iframe/`.
- API public pages are honest about what is live, what is sandbox, and what is pilot/custom.
- There is a founder-facing operating surface for tracking outreach, demos, proposals, widgets, sponsorships, backlinks, subscribers, and revenue.
- No public copy claims official tax filing, statutory compliance, live quotes, guaranteed savings, or cloud sync unless the backend and source data prove it.
- A targeted link check, relevant syntax checks, and at least one browser smoke pass have been run on the launch routes.

## Implementation Order

Follow this order unless the user gives a narrower emergency task:

1. Revenue capture path
   - Keep `/business-enquiry/` and `/api/b2b-enquiry` safe, validated, and usable.
   - Prefer extending `capture-b2b-lead.js` over adding browser-only writes.

2. Commercial offer pages
   - `/widgets/`
   - `/sponsored-tools/`
   - `/custom-calculators/`
   - `/media-kit/`
   - `/api/` and `/api/pricing.html`

3. Top money tools
   - Add or preserve title, description, use case, worked example, methodology, updated date, disclaimer, FAQ, related tools, business CTA, and save/download/email path.
   - Do not fake official accuracy. If source data is stale or uncertain, say so.

4. Partner distribution
   - Preserve `/widgets/demo/` as technical gallery.
   - Preserve `/embed/` and iframe utility pages.
   - Keep free widget attribution and backlink terms visible.

5. Segment pages
   - Build `/for-accountants/`, `/for-hr-payroll/`, `/for-fintechs/`, and `/for-schools/` after the offer pages and top money pages have working CTAs.

6. Business subscriptions and Pro
   - Keep `/pro/workspace/` as the active SaaS start screen.
   - Keep `/pro/` and `/pricing/` honest about what is account-backed, local-only, shell, or live.
   - Run `npm run pro:verify` after Pro registry, app directory, workspace, or route changes.

7. Internal operating dashboard
   - Keep founder metrics operational: MRR, one-time revenue, outreach, follow-ups, replies, demos, proposals, deals, widget partners, sponsored conversations, backlinks, organic clicks, and subscribers.
   - Label manual/local/pending fields clearly.
   - Keep the 50K surface in `mc-7a2f9x.html` useful for route QA, the first 300 local prospects, copyable proposal/outreach templates, and the 7-day execution checklist.
   - Prospect tracking is localStorage/CSV only until a safe backend or CRM path is explicitly added.

## Validation Commands

Use the narrowest proof that matches the change. Do not run broad checks just to look busy if targeted proof is enough.

### HTML and route content

```powershell
npm run check-links
npm run audit
```

For a small page batch, a targeted local link/DOM script is acceptable if the whole repo check is too noisy. Report baseline issues separately from net-new issues.

### Widgets and embeds

```powershell
npm run seo:widgets
npm run check-links
```

Also browser-smoke:

- `/widgets/`
- `/widgets/demo/`
- one iframe route under `/widgets/iframe/`
- `/embed/` if routing or redirects changed

### B2B enquiry path

```powershell
node --check netlify/functions/capture-b2b-lead.js
node --check assets/js/components/b2b-enquiry-form.js
npm run security:scan
```

Browser-smoke `/business-enquiry/?offer=widget-demo&prospect=hr-payroll&source=widgets&tool=nigeria-paye`.

### API commercial path

```powershell
node --check netlify/functions/api-keys-create.js
node --check netlify/functions/api-keys.js
node --check netlify/functions/api-v1.js
node --check netlify/functions/api-gateway.js
node --check netlify/functions/api-tax.js
node --check netlify/functions/api-vat.js
node --check netlify/functions/_shared/api-auth.js
npm run check-links
```

If Netlify functions, redirects, or publish surface changed, add:

```powershell
npm run security:scan
npm run build:deploy
npm run audit:dist
```

### Pro and business subscriptions

```powershell
npm run pro:verify
npm run check-links
npm run audit
```

### SEO metadata and internal links

```powershell
npm run seo:report
```

Use `npm run seo`, `npm run seo:og`, or `npm run seo:widgets` only when their matching source behavior changed.

## What Not To Do

- Do not turn the homepage into a Pro billboard. Keep the homepage broadly useful and discovery-led.
- Do not make commercial pages vague "contact us" pages. They need offer shape, buyer examples, pricing ranges or pilot ranges, placements, terms, and a direct enquiry CTA.
- Do not overclaim official tax, payroll, VAT, customs, remittance, or compliance accuracy.
- Do not call static examples live quotes, official filings, compliance approvals, bank sync, payment execution, or cloud sync unless backed by real systems.
- Do not create anonymous browser Supabase lead writes. Use validated Netlify functions.
- Do not bury API revenue inside a cheap consumer Pro plan. API/data is a B2B subscription or pilot.
- Do not hand-edit minified files, generated sitemap files, `dist/`, widget iframe outputs, or translated build outputs when a source or generator exists.
- Do not break `/widgets/demo/`, `/embed/`, `/widgets/embed.js`, or `/widgets/iframe/` while improving `/widgets/`.
- Do not add decorative marketing fluff. B2B pages should help the founder sell pilots this week.
- Do not invent numbers for founder dashboards. Use manual/local/pending labels if live data does not exist.
- Do not apply live Supabase schema changes without using the configured Supabase MCP first and keeping repo migrations separate from live actions.

## Source Docs To Read

Use these docs before touching the matching surface:

- Tool/page work: `docs/ADDING-A-TOOL.md`
- Lead capture: `docs/B2B-LEAD-CAPTURE-WORKFLOW.md`
- Email flows: `docs/EMAIL-MARKETING-WORKFLOW.md`
- API inventory and subscriptions: `docs/API-INVENTORY.md`
- Pro architecture: `docs/AFROTOOLS-PRO-20-APP-ARCHITECTURE.md`
- Pro backbone: `docs/AFROTOOLS-PRO-CONTROL-BACKBONE.md`
- Payroll Pro app: `docs/AFROPAYROLL-OS-PRO-APP-BRIEF.md`
- VAT/business tax workflow: `docs/VAT-BUSINESS-TAX-WORKFLOW.md`
- Release and publish surface: `docs/release-checklist.md`
- General agent traps: `docs/known-traps.md`
