# Free document-tool parity batch

This batch follows release candidate `db561f908080fac7aa6ad4da27307dbbc8293678`. It covers English, French and Swahili form filling, signing, redaction, password protection/unlocking, and the shared consent panel on Swahili document pages. It is not whole-app or catalogue acceptance. Free apps remain ahead of Pro assessment.

## Confirmed repairs

- Form filler: local guest exports, a shared readable controller, required-field validation, correct radio clearing and multiple selections, current-file replacement handling, native errors, and keyboard upload/reset.
- Signing: working current/all-page controls, local guest exports, preview-image preservation for typed/drawn/uploaded signatures, stale-result rejection, and bounded image/date placement. Peer-reproduced tiny-page clipping and asynchronous upload/preview mismatches are repaired: current upload and render identities own both preview and export, while impossible dated placement produces native guidance without a download.
- Redaction: local guest exports, readable runtime ownership, stale-download/review invalidation, native review messages, and corrected search bounds on rotated/cropped pages. The reproduced visual leak was verified fixed in the integrated source fixtures.
- Password tools: local guest protect/unlock downloads and native processing/results/errors. QPDF cryptographic wrapper and vendor files are unchanged.
- Consent panel: Swahili category styles no longer override the shared panel. The measured message contrast increased from 1.17:1 to 14.04:1 without changing consent events, storage or analytics behavior.

## Integrated source evidence

| Area | Final targeted check | Scope |
|---|---|---|
| Form filler | 18 browser cases; one installer test | Actual editable/flattened PDFs, selections, required fields, replacement recovery, keyboard and mobile |
| Signing | 18 browser cases | Actual image bytes/placement, original content, current/all pages, stale generation, tiny/narrow-page output and delayed read/parse/painting identity |
| Redaction | 15 browser cases; five dictionary-owner tests | 12 geometry PDFs / 48 pages, fixed CropBox, quarter-turn rotations, three search qualities, manual balanced output, retained public pixels and removed extractable text |
| Password | Six browser cases | Actual encrypted/decrypted PDFs, missing/wrong password rejection, user/owner passwords, permission metadata, exact text, native errors and observed privacy |
| Consent | Five browser cases | Three locale contrast/keyboard/persistence cases and existing consent-mode/single-banner behavior |

The category/workflow verifier passed for 31 registry tools and 34 surfaces. Focused repository lint and type checks passed; their scope does not constitute full application type coverage. Actual locale generators and relevant minifiers were run and checked during integration. No production proof exists for this batch yet.

## Release requirements still open

Local source, artifact, security, language, browser and full-suite gates passed. Remaining: obtain exact-commit CI success, deploy, verify public release identity, and run selected live cases.

## Limits

Detailed fixtures and limitations are in the per-tool reports. Complex scripts, arbitrary malformed/encrypted forms, OCR/scanned redaction, rotated signing page boxes, every permission combination and reader enforcement, named external cursive-font availability, and complete keyboard/accessibility coverage remain unproven. Redaction intentionally rasterizes exported pages; visual signatures are not cryptographic signatures. Narrow passing cases must not promote any whole catalogue dimension to accepted.

## Packaged artifact validation

The full deploy build completed from source9ccb9b51:18139 publish files,1831 JavaScript and623 CSS assets optimized. Content integrity checked11788 HTML pages with0 blockers/0 warnings; the three reviewed exceptions are existing declared cases. Artifact audit, security scan and build checks passed. Dictionary validation and hreflang validation passed:11561 public pages,9982 pages with declarations,32534 relationships and5290 equivalence groups.

Selected artifact browsers:63 cases passed in the first64-case run. The French Agriculture consent/theme test blocked its own local navigation because its network allowlist defaulted to4173 while the configured server used4518. Setting PLAYWRIGHT_BASE_URL=http://127.0.0.1:4518 and rerunning that single case passed in3.2seconds without source changes. All64 selected cases therefore have passing artifact evidence; preserve both logs instead of claiming one uninterrupted64-pass run. Default analytics remained enabled. Production verification must set PLAYWRIGHT_BASE_URL=https://afrotools.com for this existing test.

Generated-output review:44 HTML files changed only asset cache identifiers; four Swahili document pages additionally moved unchanged source-owner metadata/style entries within the head. Two public-claim reports reflect12843 scanned files and45486 approved hits,0 errors. No file deletions. The full repository suite passed:1117 test files,7/7 audits,0 quarantines. Exact-commit CI and production checks remain pending. Incidental Hausa ledger reports rewritten by tests were restored and excluded from this release.
