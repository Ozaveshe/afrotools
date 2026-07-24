# Day 4 Developer Tools VIP Ledger

Date: 2026-07-25  
Branch: `codex/day4-developer-tools`  
Base: `4544d89142efdbd1eeb67e5f4a30e5d1696f16b4`  
Scope: English canonical free Developer Tools hub plus 32 free app routes. Pro apps and localized derivatives were not changed.

## Inventory reconciliation

- Registry category: `developer`
- Hub groups: flagship 8, data 9, launch 8, utility 7
- Unique free canonical app routes: 32
- Hub-listed routes missing from the registry: 0
- Registry routes missing from the hub: 0
- Missing route files: 0
- Pro routes in scope: 0

The hub previously displayed the expanded registry-instance count (83 before hydration and 100 after hydration) as “Published tools.” That was not the number of free canonical apps on this hub. The stat now derives the 32 unique listed registry IDs and is labelled “Free app routes.”

## Evidence contract

Every route received:

- HTTP, H1, canonical, schema JSON and main-landmark inspection.
- Browser render checks at 320, 360, 375 and 768 CSS px.
- Saved manual light/dark (`aft_theme`) and system-dark checks.
- A forced 200% text reflow check at 375px.
- Console/page-error inspection.
- A primary valid functional interaction.
- Invalid or hostile-input handling where the workflow accepts executable-looking markup, URLs, tokens or code.
- Copy/download/export inspection when the route exposes that action; `N/A` means the route is a directory or comparison surface with no primary file export.

## Per-app receipt

| # | Route | Primary functional evidence | Copy/download/export | Privacy/security and failure evidence | Render, dark, SEO, a11y | Verdict |
|---:|---|---|---|---|---|---|
| 1 | `/tools/json-formatter/` | Format and key output PASS | Copy/download PASS | Invalid JSON status and text-only output PASS | 4 widths, dark, canonical/schema/main PASS | PASS |
| 2 | `/tools/data-converter/` | Sample conversion PASS | Copy/download PASS | Local conversion and redacted copy affordance PASS | 4 widths, dark, canonical/schema/main PASS | PASS |
| 3 | `/tools/hash-generator/` | SHA result grid PASS | Copy/file workflow PASS | Local hashing; 200% tab/container reflow repaired | 4 widths, dark, canonical/schema/main PASS | PASS |
| 4 | `/tools/base64/` | `Hello` to `SGVsbG8=` PASS | Copy/download PASS | Local reversible encoding warning; verification badge reflow repaired | 4 widths, dark, canonical/schema/main PASS | PASS |
| 5 | `/tools/regex-tester/` | `a+` match PASS | Copy/save PASS | Invalid-pattern status present; rendered match is constrained PASS | 4 widths, dark, canonical/schema/main PASS | PASS |
| 6 | `/tools/cron-builder/` | `*/5 * * * *` description PASS | Copy/save PASS | Platform/timezone warnings present PASS | Description trimmed; render/dark/schema/main PASS | PASS |
| 7 | `/tools/jwt-decoder/` | Sample claims decode PASS | Redacted copy/local handoff PASS | Secret field protected; decode is not signature trust PASS | 4 widths, dark, canonical/schema/main PASS | PASS |
| 8 | `/tools/url-encoder/` | Space encoding to `%20` PASS | Copy/local API handoff PASS | Credentials warning and component-safe encoding PASS | 4 widths including 200% text PASS | PASS |
| 9 | `/tools/uuid-generator/` | Three UUIDs generated PASS | Copy/CSV/JSON PASS | Local cryptographic generation path PASS | 4 widths, dark, canonical/schema/main PASS | PASS |
| 10 | `/tools/html-entities/` | Script-looking text encoded to entities PASS | Copy/download PASS | No executable HTML insertion PASS | 4 widths, dark, canonical/schema/main PASS | PASS |
| 11 | `/tools/diff-checker/` | Line diff exposes changed lines PASS | N/A | Compared content stays in local rendered diff PASS | 4 widths, dark, canonical/schema/main PASS | PASS |
| 12 | `/tools/markdown-editor/` | Markdown preview PASS | Editor export controls inspected PASS | DOMPurify path tested; `onerror` payload did not execute PASS | 4 widths, dark, canonical/schema/main PASS | PASS |
| 13 | `/tools/color-contrast/` | Black/white contrast status PASS | Copy/JSON PASS | Deterministic local calculation PASS | 4 widths, dark, canonical/schema/main PASS | PASS |
| 14 | `/tools/ussd-simulator/` | M-Pesa preset load PASS | QA brief copy PASS | Custom flow remains local; no live USSD claim PASS | 4 widths, dark, main landmark added PASS | PASS |
| 15 | `/tools/api-tester/` | Intercepted GET returned expected JSON PASS | cURL/fetch/JSON controls inspected PASS | Network request was test-intercepted; secret fields protected and safe brief available | 4 widths, dark, canonical/schema/main PASS | PASS |
| 16 | `/tools/sql-playground/` | Bundled Products query returned rows PASS | CSV/SQL/SQLite controls inspected PASS | SQLite runs in browser memory; mutating-query warnings present | Description trimmed; render/dark/schema/main PASS | PASS |
| 17 | `/tools/css-gradient/` | 45-degree code generation PASS | CSS copy PASS | Generated CSS shown as code, not injected markup PASS | 4 widths, dark, main landmark added PASS | PASS |
| 18 | `/tools/meta-tag-gen/` | Title updates generated tags PASS | Copy PASS | Script-looking title remained text; no script node created PASS | 4 widths, dark, canonical/schema/main PASS | PASS |
| 19 | `/tools/htaccess-gen/` | Apache rewrite output generated PASS | Copy PASS | Staging warning and module guards present PASS | 4 widths, dark, main landmark added PASS | PASS |
| 20 | `/tools/robots-txt/` | Sitemap directive generation PASS | Copy/download PASS | AI-bot controls are explicit; long root URL reflow repaired | 4 widths including 200% text PASS | PASS |
| 21 | `/tools/sitemap-gen/` | Valid `urlset` XML generated PASS | Copy/download PASS | URL validation and XML text output PASS; long robots entry reflow repaired | 4 widths, dark, main landmark added PASS | PASS |
| 22 | `/tools/password-generator/` | Web Crypto password generation PASS | Copy/bulk copy PASS | Local generation and security notes PASS; container reflow repaired | 4 widths including 200% text PASS | PASS |
| 23 | `/tools/sql-formatter/` | SQL format output contains `SELECT` PASS | Copy PASS | Destructive/share-risk review present PASS | Description trimmed; render/dark/schema/main PASS | PASS |
| 24 | `/tools/meta-tag-generator/` | Title updates generated tags PASS | Copy PASS | Image-looking title remained text; no image node created PASS | 4 widths, dark, canonical/schema/main PASS | PASS |
| 25 | `/tools/african-api-directory/` | Paystack search PASS | cURL/local API handoff PASS | Source/auth/sandbox notes remain visible; no live credential use | Title trimmed; render/dark/schema/main PASS | PASS |
| 26 | `/tools/african-domains/` | `afrotools` combinations include `.ng` PASS | N/A | Explicitly not a live availability check; source links retained | 4 widths, dark, main landmark added PASS | PASS |
| 27 | `/tools/commit-message-gen/` | Conventional message generation PASS | One-line/full copy PASS | User text rendered safely; examples and verification badge now reflow | 4 widths including 200% text PASS | PASS |
| 28 | `/tools/dev-tools/` | JWT search narrows the registry list PASS | N/A | Registry strings escaped before insertion PASS | Mobile card overflow fixed; title/description trimmed; main added PASS | PASS |
| 29 | `/tools/docker-compose-gen/` | Compose output contains `services` PASS | Multi-file copy/download controls inspected PASS | Secret-file and preflight guidance present PASS | Description trimmed; render/dark/schema/main PASS | PASS |
| 30 | `/tools/hosting-compare/` | Budget filter returns candidates PASS | Brief/JSON/TXT controls inspected PASS | Planning/risk/source notes retained; no purchase claim | 4 widths including 200% text PASS | PASS |
| 31 | `/tools/pwa-manifest/` | App name updates manifest JSON PASS | Active-output copy PASS | Generated snippets remain code; readiness checklist present | Description trimmed; 200% tab reflow PASS | PASS |
| 32 | `/tools/ussd-flow-builder/` | Product name updates exported flow JSON PASS | JSON and code exports inspected PASS | Local flow model and provider caveats retained PASS | 4 widths, dark, canonical/schema/main PASS | PASS |

## Defects changed

1. Hub dark mode: white cards combined with light dark-theme text, producing unreadable contrast.
2. Hub count truth: expanded registry instances were presented as canonical app count.
3. `/tools/dev-tools/`: a later shared anchor rule changed cards from grid to inline flex, causing 320–375px overflow.
4. Forced 200% text reflow: Base64, Hash Generator, Password Generator, Robots.txt, Sitemap Generator and Commit Message Generator had container, badge or long-token overflow.
5. Main landmarks: 19 legacy pages lacked a `main` or `role="main"` landmark; all 32 routes now expose exactly one.
6. Search snippets: 14 routes with overlong title or description fields were shortened without changing routes, canonicals or claims.

## Harness classifications

The first function run had 28 direct passes and four failures. Each failure was reproduced and classified:

- Markdown Editor: transient local service-worker registration 404 from the sparse test checkout; five fresh-browser replays plus the hostile-markup test passed with no request, page or console errors. Product verdict: PASS.
- SQL Playground: the harness waited for a hidden loading element to become visible. Correct `state: hidden` wait followed by a real bundled Products query passed. Product verdict: PASS.
- `.htaccess` Generator: the harness read `textContent` from a textarea. Reading `value` produced the complete guarded Apache configuration. Product verdict: PASS.
- African Domains: the harness expected accessible name `.ng`; the control is correctly named `Toggle .ng domain`. The page already selects seven TLDs and generated `afrotools.ng`; the corrected assertion passed. Product verdict: PASS.

## Browser and repository proof

- Initial matrix: 33 routes × 4 widths = 132 HTTP/render cases.
- Final 375px forced-200%-text replay: 32/32 apps, zero document overflow.
- Final semantic replay: 32/32 apps, exactly one H1 and at least one main landmark.
- Final saved-theme replay: 32/32 apps, manual dark applied; hub card contrast repaired.
- Functional replay: 32/32 primary workflows PASS; API request was intercepted locally.
- Hostile rendering: Markdown and both meta generators PASS; script/image event payloads did not execute.
- `git diff --check`: PASS after each repair group.
- `tests/progressive-directories.test.js` and `tests/canonical-registry.test.js`: not valid in the sparse checkout because the tests intentionally validate every repository route and most unrelated route trees were absent. This is an environment limitation, not a product failure.

## Evidence images

Local, uncommitted browser artifacts:

- `artifacts/hub-320.png`
- `artifacts/hub-768.png`
- `artifacts/hub-1440.png`
- `artifacts/hub-375-dark.png` (before)
- `artifacts/hub-375-dark-after.png` (after)
- `artifacts/hub-320-final.png` (final light proof, 32 cards/count, no overflow)
- `artifacts/hub-375-dark-final.png` (final dark proof, 32 cards/count, no overflow)

## Remaining risk

- Full-repository generated-output/build gates must run after this local branch is reconciled into a complete checkout; the sparse worktree cannot provide honest whole-site route or deploy proof.
- No push, merge, Netlify deploy or production verification was performed in this lane.
