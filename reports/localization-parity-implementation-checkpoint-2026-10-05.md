# Localization parity implementation checkpoint

Updated 5 October 2026 after the first production release. The full French,
Hausa and Swahili parity goal remains active. The original review and its
1,256-row app matrix remain the complete backlog; this checkpoint does not
claim full app, editorial, account or provider acceptance.

## First substantial release: merged and verified in production

- PR229: https://github.com/Ozaveshe/afrotools/pull/229
- Merged main revision: 719c0fa2fc5042d224096d74ca8e7c4e6e835fc3.
- Main CI run 37262182663: Verify, Playwright smoke, and Build and audit all
  succeeded. Local release checks included npm test, lint, types, localization,
  hreflang, security, deploy build, dist audit and 15 optimized-artifact cases.
- Netlify production deployment 6ac3229f8af2550008ba7866 is ready at that exact
  revision, published 2026-10-05T04:32:23.645Z.
- Full production retry ran 04:51:47.146–04:59:31.921 UTC: **15/15 passed**,
  one attempt per case. The public release marker matched the same production
  revision before and after. No assertion or timeout limit was relaxed.
- The first production run remains preserved: 14 passed, one Swahili invoice
  case exceeded its original 90-second limit. An isolated unchanged rerun
  passed in 80.463 seconds; that was diagnostic only. The subsequent complete
  15-case run passed, including the invoice case in 62.107 seconds.
- Production checks used synthetic fixtures, blocked third-party and non-GET
  requests, blocked service workers, and omitted screenshots, traces and raw
  private-content reports. These checks do not establish account, provider,
  Supabase or every-route functionality.
- The owned publisher lease was released successfully after actual acceptance.
  Owned production runner and local preview/browser resources were closed.

Durable evidence is in the task's manual handoff directory:
C:/Users/Oza/.codex/manual-handoffs/afrotools/2026-10-05-localization-parity/.
The terminal release-status.json links the preserved failed and successful
production receipts; production-proof-719c0fa2fc50-1791176371921.json is the
complete successful run. No automation receipt or later CV work replaces it.

### Released behavior

- Hausa CV brief correctly uses the entered name, validates required fields,
  preserves literal authored text and exports Hausa characters to TXT.
- Hausa invoice shares a plain link by default; explicit opt-in is required to
  include invoice data. Review is required before export, currency changes
  preserve user-entered tax, and PDF/JSON/local save behavior remains ungated.
- French invoice terminology and currency codes are corrected. All 30 CV
  template descriptions/actions use contextual draft copy, with authored text
  protected in previews, backup and exports.
- Swahili invoice controls and saved-item actions use contextual draft copy;
  template descriptions and homepage wording were corrected.
- Shared invoice JSON import keeps quote-bearing fields inert and retains zero
  quantity. Shared CV ZIP creation awaits the actual Unicode PDF bytes.
- Navigation accessible names and native Hausa/Swahili destination labels are
  consistent. Locale inventories distinguish mapping and historical acceptance
  from currently verified functionality.

## Second release candidate: source integrated, validation pending

Draft PR230: https://github.com/Ozaveshe/afrotools/pull/230.
Branch: codex/localization-parity-wave2-20261005.
This branch is not deployed and holds no publisher lease.

- Hausa invoice/receipt/estimate modes now round-trip through preview, PDF,
  JSON and local reload. Invalid document types recover predictably. Hausa CV
  brief panels have readable light/dark themes and mobile focus treatment.
- Shared invoice review also guards print, reminders and data-bearing links.
  Invalid imports are atomic; local signed-out logo/payment drafts recover;
  readonly workspace synchronization has a defined owner; print is invoice-only.
- Shared CV tracker refreshes immediately after pack attachment and preserves
  attachment identity when notes are edited. Standalone PDF and ZIP exports
  await Unicode output and reject empty or changed state with recovery guidance.
- Local DOCX/TXT review supports Escape, focus containment and focus return.
- Shared pack/tracker/import form escaping now preserves quoted values inside
  attributes in the readable owners. Paired output regeneration and the new
  actual-browser regression are pending; no deployed fix is claimed yet.
- Mock execution found that the committed shared AI runtime reused general
  prompt consent for CV chat messages: one mock send, no new confirmation and
  no content-consent header. The readable-owner repair requires fresh CV content
  consent, with English/French/Swahili/Hausa copy. Nine source tests pass; the
  generated runtime and actual assistant-button browser cases are pending.
  This was a synthetic source test, not an observation of real user transmission.
- French CV pack, tracker and import copy is maintained at its source. Native
  prose, CSV presentation, literal user values and original language tables are
  kept separate. All 30 template PDF paths have earlier scoped browser evidence.
- Swahili pack/tracker prose and exports are localized. Authored tracker fields
  stay literal. Persistent mobile context addresses a reproduced moving-control
  defect that could cancel a CSV or ZIP click after form rerender.
- French generated letters now avoid assuming the applicant's gender. Swahili
  consistently uses Kifurushi for the application pack and clearer download
  guidance. These are draft source corrections awaiting final regeneration.
- Current source fingerprints, served bytes, and execution receipts distinguish
  current verification from the historical 1,256 accepted records.

Earlier wave-two invoice/source/artifact checks passed before the latest CV
integration. They are not evidence for the final combined revision. The French
25-stage final binding was interrupted explicitly for production resource
coordination; its receipt remains interrupted/not-run. The latest Swahili
mobile fix and DOCX harness correction require their actual browser rerun.
Generated cache references and final source fingerprints must be refreshed
through their owners before final source/artifact checks, CI and release.

The shared prerequisites and scoped CV candidates were integrated as f63c686d,
b3e5305f, 87e0816a, faa8ee31 and b1d532c1. Merge resolution preserved the prior
invoice receipt and the explicitly interrupted CV receipt. Three Swahili HTML
conflicts contained cache references only; final owner regeneration is pending.

The current verification contracts also bind the new consent owner and quoted
field repair. French now requires 29 named checks and Swahili 16 named browser
checks, plus separately executed source tests. Contract regression tests pass
23/23. An initial attempt to add a node check to the browser-only Swahili
contract was rejected; the contract was corrected without relaxing its validator.
No new passing execution receipt has been created during the resource hold.

## Full Hausa CV editor: isolated engineering work

Branch: codex/ha-cv-completion-20261005. Public route remains the released brief.
An ignored local preview reuses the English editor, 30 templates, shared engines
and protected authored data. The compiler maintains canonical keys, enum values,
selectors, existing language tables and local-first boundaries.

Current implementation includes Hausa core editor/template/privacy copy,
eight application-pack assets in five tones, tracker CSV presentation, native
import/recovery messages, Boko and common keyboard-variant section recognition,
Hausa display dates, and native Word-document headings/recovery messages.

Earlier narrow Node validation: **23 passed**, including actual DOCX ZIP/XML
and ATS PDF parser inspection, exact Unicode user fields, all 30 template
renderers and generated headings, pack generation in all five tones, canonical
state preservation, native section parsing and locale-table isolation.
These are source tests. The full browser/export/accessibility matrix is pending.
The copy is explicitly an editorial draft with no native-human sign-off.

Native JSON backup review, cancel/restore/error copy and DOCX import recovery
are now in the Hausa source branch. A focused backup/pack run passed 17 tests,
including exact Unicode restore, existing version preservation and atomic
invalid-input/storage rollback. Seventeen prepared Hausa browser cases remain
unrun; import readable-source changes still need paired-output regeneration.

The Hausa branch, including native improvement owner e26272f0 and the later
shared employment-evidence, draft-fidelity, template-warning, country-advice,
optional-AI language and fictional-sample repairs, now passes **68 combined source tests** across the
Hausa suites, shared JSON restore, native consent and ATS matching. A new ATS
readable owner keeps ƙ/ɗ/ɓ keywords intact and treats composed/decomposed French
accents consistently. Checklist state uses stable category IDs; a frozen
English fixture retains the previous scores. Forty-one draft Hausa ATS guidance
phrases and owned-HTML-array localization extend the runtime copy coverage.
This ATS/compiler tranche remains isolated from PR230 and has no generated,
browser or production proof yet. Seven native local writing tools in four
styles now generate editable draft suggestions with missing-fact placeholders;
their selection/apply/reload browser journey is prepared but unrun. Native
action-verb heuristics, spelling variants and country-advice browser/factual review still require work.
The writing tools preserve entered career/graduate notes and no longer infer
completed education or past/current employment from an empty draft or target title.
The prepared browser suite now also covers all 30 actual PDF exports in six
groups, reopening the eight-entry application ZIP, and valid/invalid local
DOCX review with language-switch preservation. These additions have syntax
checks only; no export/browser pass is claimed while the heavy slot is held.
The country-advice dictionary now localizes all existing rule guidance and
privacy actions through its own source module. Four new source tests preserve
country codes, dial prefixes, template IDs, policy enums and control defaults,
and require native display guidance. A prepared browser case covers selected
country changes and the explicit hide-private-fields action. The existing
English country recommendations still require factual review; the dictionary
does not claim native-editor, independent or country-fact approval.
Starter guidance, score feedback, graduate draft help and fictional-profile
notices also gain native copy. Display-only template warning arrays localize
without changing canonical tags or allowed values. Full sample-profile prose
now has a dedicated source owner for all three fictional samples. The optional
AI system instruction requests Hausa Boko output without inferring qualifications
or prior work; its mock request contract passes. Native-human sample review and
live provider response quality remain pending. The isolated Hausa branch is at
83b59d94 with 17 prepared browser cases, all UNRUN after these source changes.

The second-release source candidate also incorporates read-only French and
Swahili editorial review: explicit content-sending consent, clearer export and
tracker recovery copy, neutral French tone labels, and corrected application
letter fragments. A shared source fix keeps a target/profile title out of past
employment claims when no role was recorded. Its two source regressions and
in-memory French/Swahili generation across five tones pass; published outputs
and their browser assertions still require regeneration and current verification.
This AI editorial review does not substitute for native-human sign-off.

Current-verification source checks pass **23/23** after French intake is aligned
with the Swahili file-identity boundary: a same-title test from a different file
cannot satisfy the contract, and process errors/signals cannot turn buffered
passed output into accepted execution. Per-test results from an otherwise
completed multi-route run remain distinct; any required failed check blocks
its route. The new employment-evidence source regression is included in French
execution and both locale fingerprints.

The coordinated heavy-validation slot remains with CSS for its single revised
R7 acceptance cycle, including the reviewed compiler-template publish exclusion.
Localization is next only after actual process/port closure and an explicit
coordinator handoff. No generators, builds, browsers or servers were started
for these source-only changes while that slot was held.

Next integrated verification sequence: reconcile the final main baseline;
regenerate readable/public pairs, French/Swahili locale outputs and cache
references; run source/regeneration checks and the final deploy artifact build,
security and dist audits; run the current French/Swahili contracts and shared
English consent/quoted-field regressions sequentially; refresh inventories from
the resulting receipts; inspect the final diff and hosted CI; then merge and
deploy under the publisher lease with fresh exact-revision production proof.
Any failure remains recorded and must be repaired before release acceptance.

## Remaining completion work

Additional source-only country-guidance batch: the maintained Swahili CV
overrides now own complete guidance for all 56 effective country profiles,
including 39 semicolon-containing sentences previously missed by dynamic-string
discovery, native privacy warnings, field controls and the compact advisor label.
The wording retains optional/requested/lawful-process qualifications and does
not promise deletion when the actual action only hides fields. A combined run
passed 22 source/localizer/verification tests; the new mobile country-switching
case is syntax-checked but UNRUN. The Swahili CV verification contract now has
16 browser cases. Generated public output, browser execution, native-editor
review and country-fact validation remain pending. This source batch does not
change country policies, stored values or the factual recommendations themselves.

French country source commit 4b0253fb was reviewed and integrated as 2bea9340.
It owns all 56 effective profiles and the compact advisor, guards display-only
AST edits and preserves country policies and authored values. Nine new country
tests pass; combined country/context/current-verification tests pass 36/36.
The adjacent completion suite still has the inherited stale generated-pack
comparison failure (16/17); the base compiler produces the same new expected
bytes. Owner regeneration must fix that mismatch before acceptance. No failure
was waived. Its new country mobile case is prepared but UNRUN. The French
workflow review was reopened with its earlier review retained as historical
evidence, because the new country, consent and quoted-field workflows need
current execution.

The Swahili delegated implementation attempt returned model capacity twice;
the coordinator implemented the bounded source repair without switching the
requested agent model. CSS R7 passed its build/test checks and remains in
its reserved browser batch; no heavy localization process was started.

1. Regenerate and validate the final second-release candidate, then integrate
   against current main and deploy with fresh revision-bound production proof.
2. Finish and validate full Hausa CV workflows and their PDF/DOCX/TXT/JSON/ZIP
   outputs, mobile controls, recovery, accessibility and private local state.
3. Resolve all 1,192 currently unmapped Hausa English-app IDs and complete the
   route-specific product backlog rather than counting shells as finished apps.
4. Revalidate French/Swahili routes and dynamic states against current sources;
   obtain native editorial and independent review before full acceptance.
5. Complete discovery, account, Pro, saved work, support, legal/help and non-app
   content continuity, with the correct privacy and provider evidence boundaries.
6. Validate representative assistive-technology and mobile-performance journeys,
   enforce change-impact gates, and verify every shipped wave in production.

GPT-6.1 Sol with extra-high reasoning is used for the isolated French and
Swahili agents. The coordinating chat cannot change its own model through tools.
