# Day 9 Creative, Sports, and Travel Deep-Improvement Receipt

Date: 2026-07-27
Branch: `codex/day9-creative-sports-travel`
Verified base: `origin/main` at `ff501112a155374a304e6fa4b16fd3d83a1fe38f`

## Scope and counting

This receipt keeps discovery destinations, expanded experiences, and translations separate.

- Category hubs: 3 (`/creative/`, `/sports/`, `/travel/`)
- English canonical live/new registry destinations: 70
  - Creative: 46
  - Sports: 15
  - Travel & Tourism: 9
- Additional English expanded Creative experiences with canonical `/tools/<id>/app`: 33
- Total English app/destination surfaces reviewed: 103
- Translations: reconciled as generated/localized surfaces, not counted as English app acceptance and not edited

Local acceptance after this pass:

- Hubs: **3 accepted / 0 left**
- English app/destination surfaces: **103 accepted / 0 left**
- Creative: **79 accepted / 0 left** across 79 landing plus expanded surfaces
- Sports: **15 accepted / 0 left**
- Travel & Tourism: **9 accepted / 0 left**

`creator-clip/app`, `creator-record/app`, and `creator-voice/app` now have
synthetic-device browser proof in addition to their workspace checks.
CreatorClip imported, exported and reopened a real WebM file; CreatorRecord
captured, downloaded and reopened WebM audio; CreatorVoice captured microphone
audio and exported a reopened RIFF/WAVE file. Physical-device permission prompts
remain a manual release check, but codec/output acceptance is complete.

## Hub-first work

- Creative: reconciled the dynamic catalog against all 46 English registry
  destinations and added a useful no-JavaScript fallback.
- Sports: replaced betting-forward language with odds literacy and harm-aware
  boundaries; removed invented live-data implications and gated-report copy.
- Travel: added the missing Africa flight destination, corrected the count to
  nine, and separated editable planning assumptions from live fares, rules,
  health advice, availability, and guarantees.

Browser proof covered each hub at 320px/system dark and 375px/manual dark with
200% text reflow. Exact route counts, accessible controls, overflow, console
errors, and canonical links were checked.

## Sports app proof

All 15 Sports apps were executed with deterministic default fixtures and their
result values independently asserted. Empty input, reset, storage stability,
local print/copy, keyboard labels, live result status, 320px layout, manual dark,
and 200% reflow were checked.

The category-scoped safety layer:

- removes the calculation-time email lead form and account/dashboard actions;
- preserves local print and copy without a network submission;
- identifies all figures as user-entered scenarios;
- adds adults-only, never-borrow, and never-chase-losses language to betting
  calculators; and
- prevents the default probability estimate from being presented as a winning
  bet or outcome prediction.

No live score, odds, entrant, ticket, scholarship, earnings, or outcome claim
was accepted.

## Travel app proof

All nine Travel apps completed their real primary button workflow with a
deterministic baseline. Reset, invalid input, result status, storage/network
behavior, 320/375px layout, manual/system dark, and 200% reflow were checked.
Wide comparison tables scroll within their own region rather than forcing page
overflow.

The travel-health page was re-scoped from an unsourced country vaccination
calculator to a local appointment brief. The accepted workflow:

- does not decide vaccine requirements or treatment;
- does not quote clinic prices;
- rejects invalid day/traveller counts;
- asks the user to verify route and transit details with a clinician; and
- links to current WHO travel-vaccine guidance and the IATA Travel Centre.

The Africa flight page is now a static planning range, not a price tracker or
live fare search.

## Creative canonical proof

All 46 Creative landing destinations passed canonical, title, description,
schema, privacy/assumption-copy, control-name, dark-mode, and reflow checks.
All 33 launcher CTAs opened their corresponding real `/app` workspace. Twelve
self-contained tools produced deterministic results and survived empty/reload
reset checks; AfroStream's filter was exercised separately.

Six pages needed app-level reflow repairs: CreatorCaptions, CreatorInvoice,
CreatorKit, CreatorMoney, CreatorPage, and Wedding Photo Package.

## Creative expanded-workspace proof

All 33 expanded routes received a visible local/privacy/export boundary and
route-specific file type/size rejection where uploads are exposed. Their
primary editable input path was exercised at 320px and at 200% reflow with no
user-content network write.

Reopened artifact proof:

- CreatorBrand JSON parsed and retained the edited synthetic brand name.
- CreatorMail HTML reopened as a complete HTML document.
- CreatorCarousel PNG reopened at exactly 1080 x 1350.
- CreatorThumb PNG reopened at exactly 1280 x 720.
- CreatorResize PNG reopened at exactly 1080 x 1080.
- CreatorResize rejected a synthetic text file before editor processing.
- CreatorClip WebM had the expected EBML signature and reopened with non-zero
  duration and dimensions.
- CreatorRecord WebM had the expected EBML signature and reopened as playable
  audio.
- CreatorVoice WAV had valid RIFF/WAVE markers and reopened as playable audio.

CreatorStock no longer substitutes invented provider, photo, or licensing
results when its source is unavailable. CreatorKit no longer claims a generated
PNG exists, labels its print view honestly, and displays the exact prompt for
explicit confirmation before any online AI send.

## Accessibility, privacy, search, and storage

- Changed results use polite live status where applicable.
- Touched controls have stable accessible names and keyboard focus.
- Manual and system dark modes were exercised.
- No app primary workflow sends synthetic content to lead capture, workspace,
  Supabase, or an app API without an explicit online action.
- Known infrastructure caches such as Pro-status and consent are not confused
  with app-result persistence.
- Canonicals were preserved. Expanded apps remain intentional `noindex,follow`
  surfaces; search authority remains on their landing routes.
- No localized/generated output, sitemap, service-worker hash, deployment
  artifact, or master readiness ledger was edited.

## Validation evidence

Passed:

- `npm run automation:preflight` — 13 pass, 1 expected local email-provider warning
- `npm run audit`
- `npm run check-links` — 124,762 internal links checked
- `node --test tests/day9-category-hubs.test.js tests/day9-sports-apps.test.js tests/day9-travel-apps.test.js` — 25/25
- `node --test tests/day9-creative-canonical-apps.test.js` — 48/48
- `node --test tests/day9-creative-expanded-apps.test.js` — 39/39
- Hub browser harness — 6/6
- Sports browser harness — 13/15 in the full run, then the two repaired routes 2/2
- Travel browser harness — 10/10
- Creative canonical route reflow harness — 40/46, then six repaired routes 6/6
- Creative canonical CTA/output harness — 44/46, then two reruns 2/2
- Creative expanded route harness — 26/33, then seven repaired routes 7/7
- Creative artifact checks — Brand JSON, Mail HTML, Carousel PNG, Thumbnail PNG,
  Resize PNG, and invalid upload all passed
- `node --check` on the changed Day 9 helpers and browser specs
- `git diff --check`
- Full Day 9 browser matrix, including synthetic media devices and reopened
  codec output: **165/165 passed**

Browser runs used the maintained `playwright.day9.config.js` on port 4199 because
other serialized lanes occupied the repository's default 4173 server.

## Risks and serialization notes

- Physical microphone/camera permission UX remains a manual release check; the
  automated device, binary-format and codec-reopen lane is green.
- The Sports and Travel helpers and the two Creative helpers are category-scoped
  shared files. They do not change the navbar, design system, registry, or
  localized output, but a director should serialize them with other category
  lanes touching the same pages.
- `npm ci` reported 11 dependency advisories. No dependency upgrade was made in
  this scoped app pass.
- No deploy, merge, master-ledger edit, broad hash regeneration, or live
  Supabase action was performed.
