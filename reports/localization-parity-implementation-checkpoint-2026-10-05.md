# Localization parity implementation checkpoint

Goal: complete the French, Hausa and Swahili programme in
`reports/localization-parity-review-2026-10-05.md`. The user explicitly authorized
implementation, integration into main and substantial production releases.

This is the first implementation batch, not a full-parity acceptance receipt.
The coordinating checkout started from verified `origin/main`
`e9fed80dd64f54f84866f33ea849c9de8c99b1ce`. French and Swahili document agents use
GPT-6.1 Sol with extra-high reasoning in isolated worktrees. The coordinating
chat's own model setting cannot be changed through the available tools.

## Implemented in the coordinator checkout

- Hausa CV uses explicit field references, safely renders literal user text,
  validates name/target role, and preserves Hausa characters in its TXT output.
  It remains a brief builder; full CV templates/editor/PDF parity is outstanding.
- Hausa invoice uses the current shared invoice enhancement runtime, with a
  readable source owner and a Hausa UI/export dictionary. The old route-specific
  runtime is no longer loaded. The shared runtime provides Unicode PDF output,
  current payment-state handling, and explicit sensitive-link sharing.
- Currency changes preserve the entered tax rate and amounts. Preview contact
  fields escape HTML. Default Share omits invoice data; opt-in describes the
  contacts, items, amounts and payment instructions exposed by a link.
- Export requires review, and changes invalidate review. PDF/JSON remain local
  and ungated. Automatic signed-in workspace-upload wiring was removed from
  the Hausa page; local drafts, saved invoices and JSON import/export remain.
  No new cloud-sync capability or live account proof is claimed.
- The fixed invoice mobile action no longer overlays the analytics-consent
  panel. English source and Hausa owner carry the repair; French and Swahili
  outputs have been regenerated from that source.
- Shared navigation has French, Swahili and Hausa home-link accessible names.
  Hausa native About/Contact links and catalog terms are consistent. The
  Swahili About footer link opens its native page. Homepage jargon and the
  literal insurance term were corrected through their source owners.
- The Hausa inventory covers all 1,256 current English app IDs. It records
  64 mapped IDs and 1,192 unresolved mappings, with CV and invoice explicitly
  partial. Fully accepted count is zero. Acceptance requires source-bound
  evidence, all ten gates, editor/independent reviewer, and production revision.
  Fingerprints include loaded runtime/style owners and language catalogs;
  dynamic dependencies must also be declared in the evidence record.
- French/Swahili inventory display-name drift was regenerated. Their historical
  accepted counts have not been relabeled as new source-bound acceptance.
- French invoice wording and currency identifiers are corrected. All 30 CV
  template descriptions/actions have contextual French copy; authored preview,
  backup and export text is protected from dictionary replacement.
- Swahili invoice controls, validation and saved-template/client/item actions
  use contextual copy. Restoring a saved item no longer translates its authored
  value. All 30 CV template dialogs have reviewed draft Kiswahili copy.
- A shared CV application-pack defect is repaired: asynchronous PDF generation
  is awaited before ZIP assembly. The maintained readable owner is
  `tools/cv-builder/js/src/cv-application-pack-export.js`, wired into minification.
  English, French and Swahili use the repaired PDF behavior.

Integrated product commits on `codex/localization-parity-20261005`:
`d874dabd`, `30597fcb`, `d068f5a0`, `309e4a99`, `62d489e3`, `2ef6c2d7`.
The French and Swahili handoffs are preserved in their dated evidence reports.
Generated release outputs are in `b412b2f3`. `baabe21a` additionally repairs
invoice JSON import escaping in all four languages: quote-bearing description
and numeric values cannot create DOM attributes/elements, and zero quantity is
preserved. Four actual-upload browser cases passed in the isolated source.

## Verification already completed

- New Hausa CV/invoice browser tests: passed (2). Exact names, injection-safe
  preview, validation, tax invariance, review invalidation, parsed Unicode PDF,
  JSON round trip, default/opt-in sharing, local save/reload and 320/390px reflow.
- Existing English/French/Swahili invoice workflow tests: passed (3), including
  parsed exports, saved states, sharing and payment amounts. Subsequent Swahili
  label-only refinements require the final integrated run.
- French, Swahili and Hausa product-surface unit tests: passed.
- Localization runtime/Unicode and new Hausa inventory tests: passed.
- `npm run build:i18n:validate`: passed after regenerating UI translations.
- `npm run validate:hreflang`: passed; 26,204 relationships, 4,253 groups.
- `npm run security:scan`, `npm run lint`, `npm run type-check`: passed.
- Source-safe minification tests: passed (2).
- Direct browser checks confirmed all three localized navbar accessible names.
- Integrated French source/ZIP/translation contracts: passed (50 node tests).
- Integrated Swahili editorial/runtime contracts: passed (11 node tests).
- Integrated French contextual browser checks: passed (2).
- Integrated Hausa, Swahili editorial and English/French/Swahili invoice browser
  checks: passed (9), including parsed ZIP PDFs, all 30 Swahili template dialogs,
  keyboard focus, authored data round trips and 320/390px reflow.
- An initial combined invocation preset declined cookies globally while the
  Hausa test expected the first-visit banner. The suite now explicitly starts
  with empty storage; its real decline-control assertion passes.
- Initial broad `npm test` was stopped after detecting stale generated
  analytics/asset pointers. The election-news failures showed navbar/footer
  cache-version drift. No broad-suite pass is claimed until the final rerun.
- First integrated `npm run build:deploy` and `npm run audit:dist`: passed.
  Reviewed 10,383 generated changes: 10,368 contained only cache-pointer
  replacements; the remaining 15 were inspected owner output/report changes.
  Deletion review was empty, and `git diff --check` passed.
- After the JSON repair, all six full-build stages passed again. Windows
  interrupted postbuild with an `UNKNOWN` file-access error; the file was
  immediately readable. Resuming the unchanged postbuild through the existing
  safe-filesystem helper passed content, claims, route, election-news, snippet
  and analytics checks. Final artifact construction/audit remains in progress
  at this checkpoint. Generated source returned to a clean tree before the
  checkpoint/report update; no generated drift was hidden.

## Required before this batch can be called released

1. DONE: integrate the scoped French/Swahili commits and regenerate invoice outputs.
2. DONE: rerun affected browser/export checks on the integrated source.
3. Full build/deploy-artifact validation and required release checks.
4. Coordinate with the existing publisher lease; do not override an active run.
5. Merge/push current main without losing concurrent changes; verify CI and the
   exact deployed revision, then check the changed production journeys.

## Separate follow-on work preserved for later integration

- French current verification: `0d874a94`; historical counts remain historical,
  current source-bound workflow/export evidence is separate, and full/native
  reviews remain pending. Rerun the dedicated verifier after integration.
- Swahili CV application pack: `0fc0737d`; native prose/export labels, actual
  Unicode PDFs, CSV presentation and mobile pack controls. Its scoped checks
  passed; it is not in the first frozen release candidate yet.
- Hausa invoice modes/CV themes: `bcd35253`, `fbc760f7`; invoice/receipt/estimate
  preview/PDF/JSON/local-save behavior, literal client cards, and readable CV
  panels in both themes. New modes/theme tests and prior Hausa regressions
  passed. Full Hausa CV and native review remain open.
- Further invoice recovery/print guards and Swahili current verification are
  active in isolated agent worktrees. None is production proof.

## Still open for the full goal

Complete source-bound evidence for French/Swahili; reconcile all Hausa mappings;
complete Hausa workflows; editorial/native-speaker and independent review;
whole-app account, Pro, discovery, legal/help and non-app content; all supported
exports, accessibility/assistive-technology and representative mobile performance;
change-impact gates and production verification for each released wave.

The original review's phases A–F and full route matrix remain the complete
backlog. A passing language dictionary, route count or this repair batch must
not be presented as 100% product parity.
