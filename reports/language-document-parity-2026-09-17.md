# Free document-tool parity batch

This batch follows release candidate `db561f908080fac7aa6ad4da27307dbbc8293678`. It covers English, French and Swahili form filling, signing, redaction, password protection/unlocking, and the shared consent panel on Swahili document pages. It is not whole-app or catalogue acceptance. Free apps remain ahead of Pro assessment.

## Confirmed repairs

- Form filler: local guest exports, a shared readable controller, required-field validation, correct radio clearing and multiple selections, current-file replacement handling, native errors, and keyboard upload/reset.
- Signing: working current/all-page controls, local guest exports, preview-image preservation for typed/drawn/uploaded signatures, stale-result rejection, and ordinary mixed-page image/date placement. **Release hold:** peer review reproduced tiny-page date/image clipping and an asynchronous upload preview/export mismatch. Follow-up repair and independent tests are required before freezing this batch.
- Redaction: local guest exports, readable runtime ownership, stale-download/review invalidation, native review messages, and corrected search bounds on rotated/cropped pages. The reproduced visual leak was verified fixed in the integrated source fixtures.
- Password tools: local guest protect/unlock downloads and native processing/results/errors. QPDF cryptographic wrapper and vendor files are unchanged.
- Consent panel: Swahili category styles no longer override the shared panel. The measured message contrast increased from 1.17:1 to 14.04:1 without changing consent events, storage or analytics behavior.

## Integrated source evidence

| Area | Final targeted check | Scope |
|---|---|---|
| Form filler | 18 browser cases; one installer test | Actual editable/flattened PDFs, selections, required fields, replacement recovery, keyboard and mobile |
| Signing | 12 browser cases | Actual image bytes/placement, original content, current/all pages, stale generation and ordinary dated output; peer edge cases remain open |
| Redaction | 15 browser cases; five dictionary-owner tests | 12 geometry PDFs / 48 pages, fixed CropBox, quarter-turn rotations, three search qualities, manual balanced output, retained public pixels and removed extractable text |
| Password | Six browser cases | Actual encrypted/decrypted PDFs, missing/wrong password rejection, user/owner passwords, permission metadata, exact text, native errors and observed privacy |
| Consent | Five browser cases | Three locale contrast/keyboard/persistence cases and existing consent-mode/single-banner behavior |

The category/workflow verifier passed for 31 registry tools and 34 surfaces. Focused repository lint and type checks passed; their scope does not constitute full application type coverage. Actual locale generators and relevant minifiers were run and checked during integration. No production proof exists for this batch yet.

## Release requirements still open

1. Resolve the independently reproduced signing edge cases and rerun affected output tests.
2. Freeze source, rebuild the deploy artifact, and review generated changes separately.
3. Run artifact/security/build checks, selected artifact browser cases, and the full repository suite.
4. Obtain exact-commit CI success, deploy, verify public release identity, and run selected live cases.

## Limits

Detailed fixtures and limitations are in the per-tool reports. Complex scripts, arbitrary malformed/encrypted forms, OCR/scanned redaction, rotated signing page boxes, every permission combination and reader enforcement, named external cursive-font availability, and complete keyboard/accessibility coverage remain unproven. Redaction intentionally rasterizes exported pages; visual signatures are not cryptographic signatures. Narrow passing cases must not promote any whole catalogue dimension to accepted.
