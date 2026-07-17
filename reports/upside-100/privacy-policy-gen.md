# Privacy Policy Generator — Upside-100 Audit

- Live: https://afrotools.com/tools/privacy-policy-gen/
- File: `tools/privacy-policy-gen/index.html`

## What it does
Client-side generator: user picks a country + org details + checkbox data categories/purposes, and `generatePolicy()` assembles a 12-section privacy policy string keyed to a `COUNTRY_DATA` map (law name, regulator, data-subject rights, complaint body). Output is copy/print-to-PDF. Green legal theme (violet `#7c3aed` accents), shared legal-engine + workflow-copilot scaffolding.

## Competitors & gaps
- Competitors: Termly, iubenda, OneTrust, GetTerms, FreePrivacyPolicy. Those auto-scan sites, keep policies in sync, and bundle cookie consent + DSAR flows.
- AfroTools edge: Africa-first, law-specific clauses (NDPA/POPIA/Kenya DPA), free, no signup.
- Gaps: no versioned hosted policy/update reminders; no cookie-scanner; several dropdown countries lack real law data (see overclaim).

## Audit checks
- **(a) Dup-H1 from generate():** NOT present. `generatePolicy()` writes the policy via `document.getElementById('policyText').textContent = policy` (line ~453). `textContent` cannot inject markup, so the literal "PRIVACY POLICY" title is plain text inside a `<div>`, never an `<h1>`. DOM has exactly one real `<h1>` ("African Privacy Policy Generator"). (WebFetch's "8 H1s" is markdown flattening of h2s.)
- **(b) Print/export broken inline JS:** NOT present. There is no `document.write`; export is `window.print()` + clipboard copy. No injected `<script>` string. Inline JS compiles (`new Function` check passes).
- **Jurisdiction coverage vs overclaim:** Dropdown offers 16 countries and badge says "16 Countries", but `COUNTRY_DATA` only defines law-specific records for 8 (NG, ZA, KE, GH, RW, MA, EG, MU). The other 8 fall back to `DEFAULT` ("applicable data protection legislation" / "the relevant data protection authority"). For TZ, UG, TN, SN, CI, AO the dropdown label names a specific statute (e.g. "Tanzania (PDPA 2022)") yet the generated doc omits it — an overclaim. ET and CM options honestly say "(general)". Deferred: adding the 8 records requires verified regulator/rights/complaint-body facts (no fabrication of legal data), so flagged rather than invented.
- **SEO:** title/meta improved (below). Two valid JSON-LD blocks (WebApplication + BreadcrumbList). No FAQ on page, so no FAQPage added. Rich SEO prose section present. hreflang en/fr/sw + canonical present.
- **UX:** clean form→doc flow, copy + print, smooth-scroll to result. Result panel visibility toggled via `.on` class. Mobile: check-grid uses `auto-fill minmax(180px,1fr)`; pills wrap fine at 375px.
- **A11y:** several text inputs had `aria-label` but their visible `<label>` lacked `for`; fixed by adding `for` on org/url/email/retention/third-parties fields.
- **Trust:** strong. Above-output info note + under-output disclaimer + global disclaimer, all pointing to lawyer review; links to official regulators (NDPC, ODPC, Information Regulator).

## Fixes applied 2026-07-14
- Title → `Free Privacy Policy Generator for Africa (NDPA, POPIA) | AfroTools` (adds "Free" intent + law keywords).
- Meta description rewritten to 153 chars (was ~190, over limit).
- Added disclaimer directly under the generated document: "This is a template, not legal advice — have a qualified data protection lawyer review it…" (`role="note"`).
- A11y: added `for` attributes linking labels to `ppOrgName`, `ppUrl`, `ppEmail`, `ppRetention`, `ppThirdParties`.
- No FAQPage JSON-LD added (no real visible FAQ). No dup-H1 fix needed (none existed). Inline JS unchanged (already correct).
- Verified: both `ld+json` blocks parse; inline JS compiles; single `<h1>`; meta 153 chars.

## Deferred
- Populate `COUNTRY_DATA` for the 8 fallback countries (TZ, UG, TN, ET, SN, CI, CM, AO) with verified law/regulator/rights/complaint data, or relabel those dropdown options as "(general)" to remove the overclaim.
