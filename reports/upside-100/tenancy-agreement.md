# Tenancy Agreement Generator — Audit

- URL: https://afrotools.com/tools/tenancy-agreement/
- File: `tools/tenancy-agreement/index.html`
- Date: 2026-07-14

## What it does
Client-side generator that assembles a printable residential/commercial tenancy
(lease) agreement. User picks a country, property type, landlord/tenant/guarantor
details, rent + deposit terms, and optional clauses; `generate()` builds a formatted
preview in `#agreementContent`. Export = `window.print()` or download-as-text.
Legal data lives in an inline `LAWS` object covering **8 countries** (NG, KE, GH, ZA,
TZ, UG, RW, ET). A country grid + SEO link list point to dedicated per-country pages
for all 54.

## H1 situation (audit flag: "missing or duplicate h1") — EXACT finding
- **Static HTML has exactly one `<h1>`** — the hero, `tools/tenancy-agreement/index.html:113`
  ("Tenancy Agreement Generator"). The SEO section (line 214) and FAQ (223) are correctly `<h2>`.
- **The duplicate is JS-injected at runtime.** `generate()` builds the preview HTML
  starting with `'<h1>Tenancy Agreement</h1>'` (line 457) and writes it into
  `#agreementContent`. After a user clicks **Generate Agreement**, the DOM contains
  **two `<h1>`s**: the hero + the injected document title. Dedicated CSS
  `.agreement-preview h1{...}` (line 39) styles that injected title, confirming it is
  intentional page markup, not stray text.
- So: not missing — **duplicate H1 appears dynamically on generate**. Fix = demote the
  injected document title to `<h2 class="doc-title">` and retarget the CSS.

## Competitors + gaps
- **LawDepot / Rocket Lawyer / LegalZoom** — guided lease builders with state/jurisdiction
  clause libraries, **PDF + Word export**, and **e-signature**. AfroTools gaps: no real PDF
  (print only), no Word/DOCX, no e-sign, no clause explanations inline.
- **PandaDoc / Lawpath (AU/local)** — template + e-sign + audit trail. Gap: no signing flow.
- **Local template sites (LegalNaija, PropertyPro NG lease templates, Kenya "AGREEMENT
  OF TENANCY" PDFs)** — static PDFs, no customisation. AfroTools *beats* these on
  interactivity but *loses* on jurisdiction depth (only 8 countries have tailored law text;
  the other 46 dedicated pages need verification — flagged in `_shared-fixes.md`).
- Net differentiators to lean on: Africa-first law references, guarantor/surety clause,
  witness blocks, deposit-norm guidance in FAQ.

## SEO
- **Title** (flagged weak): `Tenancy Agreement Generator — African Rental Contracts` — generic,
  no "free/printable", no jurisdiction hook. Strengthened.
- **Meta description**: was ~230 chars (truncates in SERP) — trimmed to 120-160.
- **JSON-LD**: only BreadcrumbList present. **No FAQPage** despite 6 real visible Q&As. Added.
- FAQ copy is strong and specific (deposit norms, guarantor, 2022/2023/2024 law updates) — good
  passage-level citability for GEO once wrapped in FAQPage schema.
- Country-coverage **overclaim**: hero + meta say "54 countries" but the interactive form only
  tailors clauses for 8. Reworded to name the 8 tailored jurisdictions + "dedicated generators
  for more" so the claim matches the working tool.

## UX / a11y
- Form → doc flow is clean; labels present; deposit label updates per country.
- Mobile 375px: `.form-grid` collapses to 1 col at 600px — OK. `.container` max 900px.
- Export weak: text download loses formatting; no PDF/DOCX. Print CSS hides chrome — good.
- Non-brand accent: inline `--blue:#1d4ed8` instead of brand `#0062CC`/`var(--color-primary)`.
  Left as-is this pass (whole-page recolour is out of surgical scope; noted).

## Trust
- No "not legal advice" disclaimer **on/under the generated document** — only inside the
  legal-workflow-copilot df blocks far below. Added a visible disclaimer under `#output`.

## Fixes applied 2026-07-14
- Injected document title `'<h1>Tenancy Agreement</h1>'` → `'<h2 class="doc-title">Tenancy Agreement</h2>'`;
  CSS selector `.agreement-preview h1` → `.agreement-preview .doc-title`. Result: exactly one `<h1>`
  (hero) at all times, even after generate.
- `<title>` → stronger, keyword-led, jurisdiction hook.
- Meta description rewritten to 120-160 chars, coverage-accurate.
- Hero subcopy reworded to name the 8 tailored jurisdictions + dedicated generators (removes 54 overclaim).
- Added visible "template, not legal advice — consult a qualified lawyer" disclaimer directly under the
  generated agreement (`#output`).
- Added FAQPage JSON-LD mirroring the 6 visible FAQ items verbatim.
- Deferred: PDF/DOCX export, e-sign, verifying legal depth of the 46 non-`LAWS` country pages,
  brand-colour migration (#1d4ed8 → var(--color-primary)). Shared-file items logged in `_shared-fixes.md`.
