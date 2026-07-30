# French Climate native parity evidence

Date: 2026-07-29
Foundation: `8ce5cac175e42201968b1f7540752d6acf92d4ca`
Branch: `codex/fr-wave4-climate`
Worktree: `C:\Users\Oza\.codex\worktrees\fr-wave4-climate`

## Acceptance

- Canonical English Climate apps reconciled: 13.
- Native French application owners accepted: 13/13.
- Native French category hubs accepted: 1/1.
- Legacy bridge owners remaining in the canonical 13: 0.
- Duplicate promoted owners: 0. The two former Nigeria-specific Carbon/Flood URLs are retained as `noindex,follow` compatibility aliases to the semantic canonical routes.
- Dedicated application artwork resolved: 13/13; missing: 0.
- French AI route ownership: 13/13 exact English-to-French pairs.
- Shared calculation owner: `window.AfroClimateTools.calculate(toolId, inputs)`. No English calculation engine was changed.

## Product contract

Each French application has visible French labels, native validation, meaningful local results, four French result labels, a French action plan, copy, explicit local save, and ungated local PDF export. Inputs are not placed in the URL or sent to AI, analytics, or external services.

Each app exposes three methodology sources from its English owner configuration. The public boundary states that the model was reviewed on 28 April 2026, country presets are not live measurements, confidence is low, and local current evidence must be checked before a formal decision.

## Browser and export proof

- `54/54` focused Chromium tests passed on port `4279`, with a worktree-root sentinel.
- `13/13` same-fixture English/French owner oracle comparisons passed.
- `26/26` physical app workflows passed at 320px and 375px.
- `13/13` independent system-dark checks passed.
- `2/2` native hub discovery checks passed at 320px and 375px.
- Every 320px app generated a PDF and `pdf-parse` reopened it: `13/13`.
- Copy and local-save actions passed at both widths: `26/26` each.
- App-owned content passed 200% text reflow after shared shadow-DOM chrome was isolated. Ordinary full pages were also exercised at both mobile widths with the shared chrome present.
- No app runtime or page errors remained. Harness-created `net::ERR_FAILED` messages from deliberate external-request blocking were excluded; no input value appeared in the local request log.

## Validation

- PASS: `node tests/fr-climate-parity.test.js`
- PASS: `playwright test tests/e2e/fr-climate-native-parity.spec.js --project=chromium --workers=3` with `PORT=4279`
- PASS: `npm run lint`
- PASS: `npm run type-check`
- PASS: `npm run ai:french-routes:check`
- PASS: `npm run audit`
- PASS: `npm run validate:hreflang`
- PASS: `npm run check-links` — 126,147 internal links across 10,838 HTML files
- PASS: `git diff --check`
- PASS: zero deleted files

## Carried baseline notes

- The sitewide AI route check reports 156 unmapped and five ambiguous French routes outside this 13-app Climate scope; all 13 Climate mappings pass exactly.
- The registry audit still reports two unrelated missing-page records (`job-offer-evaluator` and its Swahili route).
- At text-only 200% zoom, shared navbar/chat shadow DOM retains a wider hidden canvas. The app-owned Climate surface itself has no overflowing element; changing shared chrome was outside this category lane.

No broad locale build, sitemap generation, master-ledger edit, push, PR, merge, deployment, or live Supabase action was performed.
