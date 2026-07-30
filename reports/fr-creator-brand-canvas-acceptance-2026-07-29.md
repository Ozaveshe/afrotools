# French Creative Economy — CreatorBrand and CreatorCanvas acceptance

Date: 2026-07-29
Scope: exactly `creator-brand` and `creator-canvas`
Decision: **2/2 strictly accepted**

## Product closure

### CreatorBrand

- Replaced the English server/AI-heavy workspace and French handoff bridge with one shared deterministic engine and native English/French workspaces.
- Supports brand profile, audience, mission, three colors, exact WCAG contrast ratio, typography, tone keywords and three locally generated sample posts.
- Optional browser-only save and validated local JSON import.
- Reopened and parsed:
  - JSON kit export
  - TXT handoff
  - standalone HTML brand guide
  - clipboard summary
- Removed logo-upload, automatic cross-tool sync, online AI voice generation and unsupported font-integration claims from the live landing contract.

### CreatorCanvas

- Replaced the English Supabase/account/AI gallery and French handoff bridge with one shared deterministic engine and native English/French workspaces.
- Supports ten platform formats, exact output dimensions, headline, supporting line, CTA, alignment and three colors.
- Renders the actual final canvas locally.
- Reopened and parsed:
  - PNG encoded from the canvas at the selected dimensions
  - JSON project
  - TXT brief
  - clipboard brief
- Removed template-marketplace, photo/logo upload, AI design, JPG, direct-social-share, cloud gallery and brand-sync claims from the live landing contract.

## Search, discovery and artwork

- Canonical, Open Graph, schema, `geo.region=002`, English/French reciprocal hreflang and x-default are present on all four landing/workspace pairs.
- English and French registry discovery already resolves both source owners.
- Added two scoped route-only French AI discovery evals; they do not claim that workspace inputs are sent to AI.
- Existing dedicated artwork resolves:
  - `/assets/img/tools/creator-brand.webp`
  - `/assets/img/tools/creator-canvas.webp`

## Privacy and accessibility

- No workspace input is sent to Supabase, Netlify Functions, AI endpoints or application APIs.
- No auth or account dependency remains in either primary workspace.
- All inputs have wrapping visible labels.
- Primary controls are keyboard reachable with visible focus.
- Status updates use live regions.
- Light/dark themes, 320px, 375px and 200% reflow-equivalent layouts passed without page-level horizontal overflow.
- Reduced-motion behavior is explicit in the shared CSS.

## Verification

Passed:

- `node --test tests/fr-creator-brand-canvas-native.test.js` — 4/4.
- Focused Day 9 expanded app-route checks for `creator-brand` and `creator-canvas` — 2/2.
- Focused Day 9 canonical checks for `creator-brand` and `creator-canvas` — 2/2.
- `npx playwright test tests/e2e/fr-creator-brand-canvas-native.spec.js --project=chromium --workers=1` — 9/9.
- Real French CreatorBrand JSON/TXT/HTML downloads reopened and parsed.
- Real French CreatorCanvas PNG signature and IHDR reopened at `1280×720`; JSON/TXT reopened and parsed.
- English shared-engine workflows executed in the browser.
- `npm run lint`.
- `npm run type-check`.
- Scoped `git diff --check`.
- `git diff --diff-filter=D --summary` — zero deleted files.

Carried outside this two-owner scope:

- Sitewide `npm run validate:hreflang` remains red on 11 reciprocal Swahili relationships owned by other Creative routes (`creator-polish`, `creator-schedule`, `creator-team`, `social-media-calendar`, `creator-kit`, `creator-resize`). Neither CreatorBrand nor CreatorCanvas appears in that failure list.
- The broad Day 9 expanded suite retains stale assertions against concurrently rewritten `creator-kit` and other owners. The two assigned app-route checks pass.

## Files

- Engines:
  - `engines/src/creator-brand-engine.js`
  - `engines/creator-brand-engine.js`
  - `engines/src/creator-canvas-engine.js`
  - `engines/creator-canvas-engine.js`
- Shared presentation:
  - `assets/css/creator-brand-canvas-native.css`
  - `assets/css/creator-native-landing.css`
  - `assets/js/pages/creative/creator-brand-controller.js`
  - `assets/js/pages/creative/creator-canvas-controller.js`
- English:
  - `tools/creator-brand/index.html`
  - `tools/creator-brand/app.html`
  - `tools/creator-canvas/index.html`
  - `tools/creator-canvas/app.html`
- French:
  - `fr/tools/kit-de-marque-pour-createur/index.html`
  - `fr/tools/kit-de-marque-pour-createur/app.html`
  - `fr/tools/canevas-de-projet-pour-createur/index.html`
  - `fr/tools/canevas-de-projet-pour-createur/app.html`
- Evidence:
  - `data/ai/fr-creative-brand-canvas-evals.json`
  - `tests/fr-creator-brand-canvas-native.test.js`
  - `tests/e2e/fr-creator-brand-canvas-native.spec.js`

No commit, push, build, sitemap, master-ledger or deployment action was performed.
