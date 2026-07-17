# Certificate Generator — Audit (tools/certificate-maker/)

Live: https://afrotools.com/tools/certificate-maker/
File: `tools/certificate-maker/index.html`

## What it does
Client-side certificate generator. Pick one of 4 starter templates (School Award,
Bootcamp, Church Service, Community), fill recipient / course-event / date /
organisation fields, watch a live preview, then export the preview as **PNG**
(html2canvas) or **PDF** (html2canvas → pdf-lib). All processing is in-browser,
no account, no server submission. Verified working: preview updates on input,
template switch swaps title/intro/action + smart-fills course/org, PNG and PDF
handlers are sound (no `document.write` print path, so the build-injector class of
bug does not apply here).

## Gaps found
- **JSON-LD placeholder junk (main issue):** the `WebApplication` and `WebPage`
  blocks had `name`/`description`/`url` all literally set to `"https://afrotools.com/"`
  — valid JSON but meaningless to crawlers/AI.
- **Brand/keyword inconsistency:** title/breadcrumb/JSON-LD said "Certificate
  Generator" while H1 said "Certificate Maker".
- **Title/meta:** generic, no African intent, meta lacked PNG/PDF + free signals.
- **A11y:** template toggle buttons had no `aria-pressed`; icon-only download
  buttons ("📥 PNG/PDF") had no aria-label; live preview not announced.
- **Feature/FAQ match:** visible FAQ mentions a "signatory name" field that the
  form does not have (FAQ #2). The FAQPage JSON-LD mirrors the *visible* FAQ, so
  schema is consistent — noted as a copy/feature mismatch, not a schema defect.
  Left unchanged (FAQ copy is out of the surgical print/SEO/a11y scope; flag for
  a content pass — either add a signatory field or drop the claim).

## Fixes applied 2026-07-14
- `<title>` → "Certificate Generator | Free Award & Completion Certificates for Africa" (keyword + African intent).
- Meta description rewritten, 160 chars, African orgs + PNG/PDF + free/browser.
- H1 → "Free Certificate *Generator* for African Schools & Organisations" (unique, keyword-bearing, unifies the Maker/Generator split).
- `WebApplication` JSON-LD: real name/description/canonical url + `featureList`; kept `DesignApplication`.
- `WebPage` JSON-LD: real name/canonical url/description.
- A11y: `aria-pressed` on all 4 template buttons (synced in the click handler), `aria-live="polite"` on `.preview`, `aria-label` on both download buttons.

## Deferred
- Feature/FAQ mismatch: no signatory-name input despite FAQ claim (content decision).
- No shared-file edits required; nothing appended to `_shared-fixes.md`.

## Verification
- All 4 `application/ld+json` blocks parse (`JSON.parse`): WebApplication, WebPage, BreadcrumbList, FAQPage.
- FAQPage JSON-LD still mirrors the 5 visible `<details>` questions exactly.
- Inline export script passes `node --check`.
