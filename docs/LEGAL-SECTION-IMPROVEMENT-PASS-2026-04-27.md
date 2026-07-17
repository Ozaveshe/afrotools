# Legal Section Improvement Pass - 2026-04-27

## Scope

Reviewed and improved the 69 apps linked from `/legal/`:

- Business legal: `business-registration`, `company-type-selector`, `business-license`, `tin-guide`, `annual-returns`, `trademark-registration`, `ip-protection`, `nda-generator`, `partnership-agreement`, `shareholder-agreement`, `board-resolution`, `winding-up`, `foreign-company-reg`
- Data privacy: `ndpa-checker`, `popia-checker`, `kenya-dpa`, `gdpr-vs-africa`, `privacy-policy-gen`, `cookie-consent`, `breach-notification`, `dpa-generator`, `cross-border-data`, `dpia-tool`
- Personal legal: `will-generator`, `power-of-attorney`, `divorce-settlement`, `child-support`, `inheritance-tax`, `bail-calculator`, `court-fees`, `legal-aid`, `statutory-declaration`, `affidavit-generator`
- Registry-tagged legal apps: the additional property, labour, travel, housing, tax, tenancy, construction, and registry tools surfaced in the `/legal/` hub under `LEGAL-REGISTRY-APPS`.

## Online Review Signals Used

- CAC business-name registration flow still centres on name availability, reservation, pre-registration form upload, and filing fee payment.
- CIPC annual returns guidance treats annual returns as mandatory, ties non-compliance to deregistration risk, and links annual returns to beneficial ownership and AFS/FAS obligations.
- Kenya ODPC breach reporting asks for breach description, affected categories, short-term remediation, recurrence prevention, discovery timing, 72-hour status, data-subject communication, and supporting attachments.
- DPIA guidance from a data protection authority frames a DPIA as a documented project-risk process: describe processing, assess necessity and proportionality, identify risks, define measures, sign off, and feed outcomes back into the project.

## Product Changes

- Added a reusable review layer to every `/legal/` app: `LEGAL-ACTION-PACK`.
- Each app now has a copyable review note with:
  - app purpose and coverage
  - result fields to save
  - evidence to attach
  - escalation triggers
  - primary official-source links
- Added a small clipboard helper per improved tool page so users can copy the review pack into a matter file, compliance folder, board pack, or lawyer handoff.
- Added `LEGAL-WORKFLOW-COPILOT` to all 69 hub-listed app pages. It turns each app result into an evidence checklist, risk review, saved local draft, copyable handoff note, and print/PDF action.
- Added a bespoke filing planner to `tools/business-registration/index.html` with business intake fields, operational triggers, selectable entity cards, risk level, recommended sequence, document bundle, local draft save/load, and copyable filing note.
- Added `assets/js/legal-workflow-copilot.js` for the shared workflow workspace.
- Extended `assets/css/legal-enhancements.css` with responsive styling for the action-pack, workflow copilot, and business-registration filing planner.
- Kept the existing `LEGAL-DEEP-IMPROVEMENT` blocks as the conceptual review layer, then added the action pack as the operational follow-through.

## Workflow Source

The canonical batch source is:

- `scripts/enhance-legal-section-pass.js`
- `scripts/apply-legal-workflow-copilot.js` is now a compatibility wrapper that runs the canonical script.

Run it after changing profile text, source links, or action-pack copy:

```bash
node scripts/enhance-legal-section-pass.js
```

Expected invariant:

- `/legal/` exposes 69 app cards.
- Each linked tool page has one `LEGAL-DEEP-IMPROVEMENT` block.
- Each linked tool page has one `LEGAL-ACTION-PACK` block.
- Each linked tool page has one `LEGAL-WORKFLOW-COPILOT` block.
- Each linked tool page includes `assets/css/legal-enhancements.css`.
- Each linked tool page includes `/assets/js/legal-workflow-copilot.js`.

## Validation Plan

- Parse `/legal/index.html` and confirm all 69 linked pages exist.
- Count `LEGAL-ACTION-PACK` and `LEGAL-WORKFLOW-COPILOT` across tool pages and confirm each matches the 69 hub-linked apps.
- Run syntax checks for the two batch scripts and the workflow copilot JS.
- Smoke test `tools/business-registration/index.html` planner against `data/legal/country-legal-index.js`.
- Smoke test `assets/js/legal-workflow-copilot.js` against at least one generated workflow config.
- Run `npm run check-links`.
- Run `npm run audit`.
- Run `npm run seo:report`.

## Notes For Future Agents

- The `/legal/` hub is now a 69-app surface. If new legal-adjacent apps are added to the hub, run both scripts and re-check the 69-style invariants.
- If legal facts are edited, re-check current official authority pages first. Legal and regulatory details drift.
- Keep coverage labels honest. Some pages are 54-country directories, while many legal calculators and generators are deeper 16-market tools.

## Follow-Up Pass - 2026-04-27

This pass made the legal category behave as a connected product surface rather than a list of isolated pages.

### Added

- Upgraded the `/legal/` homepage into a workflow entry point with dashboard resume and six user journeys: company setup, privacy evidence, personal legal, property/tenancy, labour/contractor, and travel/visa.
- Added `LEGAL-COMPETITOR-CHECK` to every improved legal app. The section is generated per app from `scripts/enhance-legal-section-pass.js` and maps each app to one competitor pattern group:
  - company formation and registry portals
  - privacy and consent platforms
  - document and contract generators
  - employment compliance platforms
  - property and rental intelligence tools
  - visa and immigration workflow tools
  - personal-law and legal-aid flows
- Upgraded `LEGAL-WORKFLOW-COPILOT` into the primary action workspace for each app:
  - matter, country/regime, target date and status fields
  - app-specific evidence checklist and risk flags
  - copyable handoff note
  - local save into `afro_legal_workflows`
  - account workspace sync through `AfroWorkspace.upsert()` when signed in
  - email-gated PDF/print unlock through `/api/capture-lead`
- Added dashboard surfacing for legal workflows:
  - `renderMyWorkspace()` adds a Legal Workflows tab when its renderer owns the workspace.
  - `renderLegalWorkflowDashboardBlock()` adds a resilient dashboard block when the newer dashboard workspace renderer replaces the older tab output.
- Kept the email gate value-after-result: users can use the app first, then provide email only when exporting or saving the report-style checklist.

### Source Of Truth

Use one script for this complete pass:

```bash
node scripts/enhance-legal-section-pass.js
```

The older `scripts/apply-legal-workflow-copilot.js` was superseded by the generated workflow section in `enhance-legal-section-pass.js`.

### Current Invariants

- `/legal/` exposes 69 app cards.
- All 69 improved legal app pages contain:
  - `LEGAL-WORKFLOW-COPILOT`
  - `LEGAL-COMPETITOR-CHECK`
  - `LEGAL-DEEP-IMPROVEMENT`
  - `LEGAL-ACTION-PACK`
  - `data-workflow-gate`
  - `/assets/js/legal-workflow-copilot.js`
- `assets/js/legal-workflow-copilot.js` owns local saves, lead capture, PDF unlock state and optional signed-in dashboard sync.
- `dashboard/index.html` must keep `dashGetLegalWorkflows()`, `loadLegalWorkflows()` and `renderLegalWorkflowDashboardBlock()` aligned.

### Validation Evidence

- `node scripts/enhance-legal-section-pass.js` is idempotent with `Files changed: 0`.
- `node --check scripts/enhance-legal-section-pass.js`
- `node --check assets/js/legal-workflow-copilot.js`
- Inline executable scripts parsed across `dashboard/index.html`, `legal/index.html`, and the 69 improved tool pages.
- Browser smoke covered:
  - `/legal/` homepage workflow intake
  - `/tools/business-registration/` workflow save
  - `/api/capture-lead` email/PDF gate
  - `/dashboard/` legal workflow block rendering from saved local state
- `npm test`
- `npm run seo:report`

Residual note: `seo:report` still reports 164 JSON-LD auto-fixes available as baseline SEO maintenance. It does not report missing canonicals, titles, descriptions, hreflang violations, or broken `/fr/` homepage links.

## Complete Package Pass - 2026-04-28

This pass tightened the category as a product, not just a content batch.

### Competitor Review Inputs

The 69 apps remain mapped to seven competitor families in `scripts/enhance-legal-section-pass.js`:

- Company and registry workflows: LegalZoom, Firstbase, Stripe Atlas and official registry portals.
- Privacy and consent workflows: Termly, OneTrust and consent-management platforms.
- Legal document workflows: Rocket Lawyer, LawDepot, Wonder.Legal, PandaDoc and Docusign CLM.
- Employment and contractor workflows: Deel, Oyster and HR compliance platforms.
- Property workflows: Rentometer, AirDNA, Zillow Rental Manager and BuildZoom.
- Travel and visa workflows: iVisa, Atlys, Sherpa and official immigration portals.
- Personal-law workflows: legal-aid portals plus consumer legal-document flows.

The recurring product lesson was consistent: strong competitors keep a matter moving through intake, evidence, risk checks, status, export, reminders and the next action. The legal category now implements that pattern locally with Africa-specific official-source caution.

### Added Or Improved

- Added `LEGAL-JOURNEY-MAP` on `/legal/`, turning the homepage into six connected workflows:
  - register and operate a company
  - launch a privacy-ready product
  - prepare a contract or board file
  - screen property and tenancy risk
  - classify labour and contractor exposure
  - build a travel or visa record
- Updated all generated review dates and competitor-check dates to `28 April 2026`.
- Kept all 69 app pages on one generated pattern: case workspace, competitor check, deep improvement block, review pack and PDF/email gate.
- Fixed the PDF-gate lead payload so it now sends top-level `pageUrl`, `referrerUrl`, UTM fields, `deviceType`, `industry=Legal`, valid country code when inferable, and a conversion marker that `netlify/functions/capture-lead.js` can persist.
- Made `capture-lead.js` backward-compatible with nested attribution/device payloads while preserving the current Supabase column contract.
- Replaced the older `apply-legal-workflow-copilot.js` implementation with a wrapper so future agents cannot accidentally overwrite the richer workflow sections with the superseded version.
- Corrected the hub journey link for property screening to `/tools/land-title-check/`, the existing legal app route.
- Added a signed-out dashboard nudge for saved local legal workflows so users who export or save before signing in still see the work waiting on the dashboard sign-in screen.

### Current Complete-Package Invariants

- `/legal/` exposes 69 app cards.
- `/legal/` contains `LEGAL-HUB-UPGRADE`, `LEGAL-JOURNEY-MAP` and `LEGAL-REGISTRY-APPS`.
- Every linked legal app contains `LEGAL-WORKFLOW-COPILOT`, `LEGAL-COMPETITOR-CHECK`, `LEGAL-DEEP-IMPROVEMENT`, `LEGAL-ACTION-PACK`, `data-workflow-gate`, `data-workflow-email`, `data-workflow-save` and `/assets/js/legal-workflow-copilot.js`.
- Legal workflow saves are visible to the dashboard through `afro_legal_workflows` and optional `AfroWorkspace.upsert()`.
- PDF unlocks remain value-after-result: the tool stays usable first, email is requested when the user wants a portable checklist/report.
