# Swahili Flyer Maker final proof

Date: 2026-08-09

Route: `/sw/zana/kitengeneza-flyer/`

English owner: `/tools/flyer-maker/`

Source owner: `scripts/build-sw-flyer-maker-final.js`

Shared controller: `assets/js/lib/flyer-maker-studio.js`

## Accepted product surface

- Full English-owner workspace retained: 45 named controls, 8 templates, 6 palettes, 5 exact size presets, 6 layouts and 4 font choices.
- Native Swahili static and dynamic interface, prompt recognition, template content, readiness checklist, status/error messages, clipboard briefs and AI-language instruction.
- Background, logo and QR image decoding stays in the browser. Brand-kit state, draft state and recent export history stay in local storage.
- Design-link reopen carries text and settings but deliberately removes background, logo and QR data.
- Optional AI assist remains explicit-consent only. The request contains the written prompt and structured instructions; it does not contain uploaded image data. Local prompt generation remains available without consent or network access.
- PNG, JPEG and WebP single-file export plus the three-size variant action remain ungated.

## Browser evidence

Chromium, one worker, isolated local server:

- Exact parsed and browser-reopened files:
  - PNG, 1080 x 1350.
  - JPEG, 1080 x 1080.
  - WebP, 1080 x 1920.
  - A4 PNG, 2480 x 3508.
  - Letter JPEG, 2550 x 3300.
- Three-file variant export parsed at 1080 x 1350, 1080 x 1080 and 1080 x 1920.
- Deterministic PNG fixtures were decoded through the real background, logo and QR upload controls.
- Brand save/reset/load, local prompt generation, invalid AI-without-consent state, caption/brief clipboard readback and design-link reopen passed.
- Before consent, no POST occurred. The consented branch was exercised with an in-page deterministic fetch double: method `POST`, `X-AfroTools-AI-Consent: accepted`, prompt present, no `data:image` payload. This proves the browser request contract without external egress.
- English-owner regression, 320 px, 375 px, 200% text reflow, manual/system dark mode, reduced motion, keyboard focus and console checks passed.

Browser run history:

- Full three-test run: export/reopen and English/reflow lanes passed; product lane reached only a test-double interception mismatch.
- Focused rerun after correcting the deterministic fetch double: product/privacy lane passed 1/1.
- No additional broad browser rerun was made after the final copy-only locale additions and source minification because the coordinator requested immediate disk conservation. The same shared-controller logic had already passed its focused browser assertions before minification.

## Static evidence

- `node scripts/build-sw-flyer-maker-final.js --check` — PASS.
- `node tests/sw-flyer-maker-final.test.js` — PASS (45 controls, 8 templates, 5 sizes, 3 formats).
- `node -c assets/js/lib/flyer-maker-studio.js` — PASS.
- `node -c scripts/build-sw-flyer-maker-final.js` — PASS.
- `git diff --check` — PASS.
- Canonical, English/French/Swahili/x-default hreflang and dedicated `assets/img/tools/flyer-maker.webp` artwork are present.
- Zero deleted files.

## Scope boundaries

- No central acceptance, AI route map, locale coverage, sitemap, service worker, redirect, build/dist, push, PR, merge or deployment change.
- No physical-device proof is relevant to this canvas/file workflow.
