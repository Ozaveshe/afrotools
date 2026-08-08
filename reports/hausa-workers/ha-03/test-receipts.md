# HA-03 test receipts

Base SHA: `6edacda8437e1fa9b9e5a512138cbdd3169e38be`

Final implementation SHA: `5bfd98cbe98e02f5db8e9257e4250e849b8c5e59`
Fixtures: synthetic only.

## Final passing checks

- `node --test tests/hausa/ha-03/ha-03-contract.test.js`
  - PASS: 9 tests, 0 failures.
  - Proves the exact denominator, native/self-canonical route contracts, zero route-scoped Hausa visible-copy blockers, clean human-facing metadata/UI copy, owned-hub discovery, central-hub base identity, protected-file scope, source-engine arithmetic, phrasebook Unicode/source contract, export contract, and static privacy boundary.
- Route-scoped `scripts/audit-hausa-visible-copy.js` report through the contract test
  - PASS: 0 `BLOCKER_VISIBLE_ENGLISH` findings across the eight exact HA-03 routes.
  - The accompanying human-copy gate also checks title, description, OG, Twitter and AI metadata plus visible labels, placeholders, alternative text and rendered body copy.
- `npx playwright test --config=tests/hausa/ha-03/playwright.config.js --trace=off --workers=1`
  - PASS: 8 tests, 0 failures on the final committed-head rerun.
  - Proves per app: native Hausa reset label, rejected English phrases absent from rendered UI, valid, invalid/no-match, reset, keyboard submit, focus, 320px, 375px, 200% reflow, manual dark, system dark, serious/critical axe scan, TXT download/reopen, artwork load, privacy request inspection, console errors, page errors, and request failures.
- `npm run ha:coverage:check`
  - PASS: 105 Hausa routes; 14 native, 59 localized shells, 32 explicit English fallbacks.
- `npm run check-links`
  - PASS: no broken internal links; 138260 links checked across 11514 HTML files.
- `npm run validate:hreflang`
  - Completed route-contract scan: 11295 public pages, 10312 pages with declared hreflang, 33417 relationships, 5356 groups.
  - Full reciprocal clusters pass for scholarship-finder, nysc-allowance, and student-budget.
  - Five new exact slugs intentionally advertise only self `ha` until coordinator serialization; the validator reports five `HREFLANG_XDEFAULT_MISMATCH` coordination warnings. No false English/French/Swahili reciprocals or false x-default were added. Exact shared patches are in `director-patch-proposal.json`.
- `git diff --check`
  - PASS.
- `git diff --diff-filter=D --summary <base> <implementation> --`
  - PASS: empty deletion summary.
- Pillow WebP reopen receipt
  - PASS: 8/8 current artwork files parsed; dimensions range from 600x375 to 800x450.

## Baseline and coordination debt separated from net-new defects

- `npm run ha:surface:check` reports the same 13 stale generated Hausa product-surface files outside HA-03 ownership: `ha/kasashe/index.html`, `ha/shiga/index.html`, `ha/allon-aiki/index.html`, `ha/maajiyar-takardu/index.html`, `ha/farashi/index.html`, `ha/sharuddan-amfani/index.html`, `ha/sirri/index.html`, `ha/tuntube-mu/index.html`, `ha/game-da-mu/index.html`, `ha/masu-habaka/index.html`, `ha/inshora/index.html`, `ha/labarai/index.html`, and `ha/kayan-kasuwanci/index.html`. HA-03 did not modify or regenerate them.
- Five new exact routes need shared-owner hreflang serialization. This is not hidden as green reciprocal proof; it is proposal-only and does not affect route-local canonical, OG, schema, or self-language proof.
- The frozen dependency install reported 14 existing audit findings (6 moderate, 8 high). No dependency or lockfile was changed, and this lane did not claim a dependency-security fix.

## Test-development history

- Coordinator visible-copy review rejected the first candidate with 10 blocker findings. The correction reproduced all 10, removed the eight `Share` reset labels plus the scholarship `ranar ƙage` and `profile` findings, then translated the additional named UI/metadata and dynamic-result leakage. The final route-scoped audit is zero.
- The first browser run used a JAMB expected value from a 60/40 fixture while the page still held its 50/50 defaults, and used a one-character privacy token that matched `127.0.0.1`; the test fixture was corrected.
- The second run exposed a real scholarship-page overflow at 320px/200% on the long `AfroScholarshipFeed` identifier. The shared HA-03 stylesheet now wraps code tokens. The final all-row rerun is green.
- Port 4173 was already occupied by another local static server. HA-03 did not terminate it; the lane-owned server uses isolated port 4313.
