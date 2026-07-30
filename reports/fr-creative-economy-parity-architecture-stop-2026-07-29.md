# French Creative Economy parity — architecture stop receipt

Date: 2026-07-29
Foundation: `8ce5cac175e42201968b1f7540752d6acf92d4ca`
Branch: `codex/fr-wave4-creative`
Acceptance policy: fail closed; no iframe, bridge, or duplicated French-only business logic

## Decision

Implementation stopped before product edits because the English Creative Economy
owners do not yet provide a complete shared-engine boundary from which 46 native
French applications can be produced safely.

Creating translated pages from the current HTML would copy calculation, state,
AI/network, media-device, and export logic into French. That would create a second
implementation of the product behavior and violate the required shared-engine
contract. No route is accepted by implication.

## Exact programme reconciliation

- English denominator: 46/46 physical free-app routes exist.
- Registry ownership: 46/46 IDs are present in `tool-registry.js`.
- English Creative taxonomy: 46/46 IDs are assigned.
- Current French candidates: 44/46 physical files.
- Current French states: 0 native, 7 English iframes, 37 bridge handoffs, 2
  missing.
- French AI route-map mentions: 44/46. The two missing-route owners are
  `social-media-calendar` and `wedding-photo-package`.
- Dedicated English-owner artwork: 46/46 WebP files exist. Artwork presence is
  not native-French artwork review and therefore does not earn French acceptance.
- Accepted French apps: 0/46.

The two absent French routes have no reciprocal French hreflang owner:

- `social-media-calendar`
- `wedding-photo-package`

The English hub is a real 46-app taxonomy. No equivalent native French Creative
Economy hub owns this exact programme at the foundation commit.

## Shared ownership audit

Twenty Creator apps have a file under `engines/src/`, and AfroStream has a named
engine. File presence is not sufficient proof of a safe shared owner:

- `creator-carousel`, `creator-resize`, and `creator-thumb` access the DOM from
  the purported engine.
- `creator-calendar`, `creator-hooks`, `creator-money`, `creator-page`,
  `creator-split`, and several visual engines own storage, network, or export
  side effects inside the engine.
- The remaining engine-backed pages still keep material UI, state, validation,
  export, or AI orchestration inline in the English page and require a
  route-level controller/locale contract before native French reuse can be
  proved.
- `afrostream-engine.js` is DOM-free but performs network orchestration and does
  not own the large inline platform runtime or its French presentation contract.

Twenty-six owners have no named shared engine/controller for their core inline
workflow:

### Complex Creator runtimes (13)

`creator-analytics`, `creator-brand`, `creator-clip`, `creator-club`,
`creator-course`, `creator-mail`, `creator-polish`, `creator-record`,
`creator-research`, `creator-schedule`, `creator-stock`, `creator-team`,
`creator-voice`

These pages combine substantial inline behavior with one or more of local
storage, IndexedDB, Netlify calls, AI consent paths, canvas, Blob/object-URL
exports, clipboard access, MediaRecorder, or `getUserMedia`. In particular,
`creator-clip`, `creator-record`, and `creator-voice` require real media-device
and reopened-codec proof; a translated shell cannot satisfy that contract.

### Inline Creative calculators/workflows (13)

`african-palette`, `art-commission`, `book-publishing-cost`,
`engagement-rate`, `linkedin-optimizer`, `music-royalty-splitter`,
`personal-brand-audit`, `photography-pricing`, `podcast-monetization`,
`self-publishing-royalty`, `social-media-calendar`,
`wedding-photo-package`, plus the unowned inline AfroStream presentation/runtime
layer.

Their formulas, sorting, score/quote construction, validation, or export
behavior live in the English HTML rather than an accepted reusable owner.

## Required architecture work before French implementation

1. Extract each inline calculation/model into readable shared source under
   `engines/src/` or a shared controller with a documented locale dictionary.
2. Migrate the English owner to that shared implementation first.
3. Capture English parity fixtures and invalid-input oracles before changing the
   French route.
4. Separate deterministic local behavior from opt-in AI/network behavior for
   Brand, Mail, Polish, Research, Stock, Desk, Kit, and other assisted workflows.
5. Give Clip, Record, and Voice a shared media controller and verify actual
   capture plus reopened codec output on supported devices.
6. Move export construction into shared, testable owners and parse/reopen every
   advertised format.
7. Add a locale-aware shared controller contract to the nominal engine-backed
   apps whose page still owns material workflow behavior.
8. Only then build the exact 46 native French routes, reciprocal hreflang,
   French AI mappings/evals, and the exact French Creative Economy hub.

## Work performed in this lane

- Read the required repository and localization guidance.
- Reconciled the exact 46-row inventory against registry, taxonomy, filesystem,
  French route candidates, AI map, and artwork.
- Inspected all named Creator/AfroStream engine sources for DOM, storage,
  network, Blob, and API ownership.
- Searched for reusable JavaScript owners for all 26 inline workflows; the
  matching files are registry, taxonomy, generated route maps, upgrade scripts,
  or tests rather than shared product engines/controllers.

## Explicitly not performed

- No English or French product file changed.
- No iframe or bridge was promoted to native.
- No generator, broad localized output, sitemap, ledger, service worker, build,
  push, PR, merge, or deployment action ran.
- No app received browser acceptance because the implementation precondition
  failed.

## Acceptance

`0/46 accepted`

The next authorization must cover English shared-engine/controller extraction
and parity fixtures. Authorizing only French page creation would not resolve the
boundary.
