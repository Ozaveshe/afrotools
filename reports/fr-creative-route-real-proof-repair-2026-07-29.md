# French Creative route-real proof repair — 2026-07-29

## Scope and isolation

- Worktree: `C:\Users\Oza\.codex\worktrees\fr-wave4-creative`
- Branch: `codex/fr-wave4-creative`
- Accepted starting commit: `b4bc425471387f5ffad88a8e6e95dfde05eaf5d5`
- The canonical checkout, coordinator-generated localization artifacts,
  sitemaps, deployment surfaces, and accepted product work were not changed.

## Failed command and recovery

The first broad diagnostic command timed out after **34,184 ms** while combining
Git inspection with a repository-wide search. It made no changes. Recovery
split Git inspection from narrowly globbed searches.

The first one-second Playwright launch was an orchestration timeout before any
test ran. The next real launch with `playwright.day9.config.js` failed before
test collection because port `4199` was held by a stale
`node tests/support/static-server.js` process (PID `38008`). The occupied
server returned `404` for the configured root health check, then Playwright's
replacement server failed with:

```text
Error: listen EADDRINUSE: address already in use 127.0.0.1:4199
```

The stale process was not killed. Recovery added
`playwright.fr-creative-proof.config.js`, using isolated port `4251` and a real
`/creative/` health URL. Every binding and regression browser run completed on
that isolated server.

## Proof audit

The previous reported **277/277** Playwright result is a useful functionality,
parsed-export, media, theme, keyboard, and regression layer, but it was not
independent route-real 200%-text proof:

- the broad canonical suite navigated English launchers;
- several French workspace suites used CSS `zoom: 2`, a 640px viewport, or an
  equivalent-width proxy;
- the old checks did not independently freeze all 46 French launcher routes
  and all 33 French workspace routes;
- the first replacement proof scanned only light-DOM elements, so its later
  80/80 result was preserved but explicitly superseded.

The binding test freezes an independent 46-owner French route inventory and
derives no acceptance count from the production route map. It navigates 46
launchers and 33 workspaces as real local routes at a `320 x 900` CSS-pixel
viewport, verifies the computed root baseline is exactly `16px`, forces it to
exactly `32px`, and verifies `window.innerWidth`,
`document.documentElement.clientWidth`, and `visualViewport.width` remain
exactly `320`.

Its overflow audit recursively visits light DOM and every open shadow root. It
checks element and control rectangles, intrinsic element overflow, and every
direct non-whitespace text node using `Range.getClientRects()`. The only
exclusions are composed ancestors that are actually hidden/inert, or
opacity-zero with pointer events disabled. Each workspace is audited before
and after its representative sensitive-input action.

All non-local requests are recorded and aborted. Network writes are reset
immediately before the representative workspace action, then both any write
and any request containing the unique synthetic content marker are rejected.

## Intentionally failing passes and repaired defects

The initial strict pass completed at **18/80**, preserving **62 failures**:

- 34 launcher overflow failures;
- 23 workspace overflow failures;
- four concrete file/media/control selector gaps;
- one synthetic numeric-marker false match.

The harness repairs kept the assertions intact: synthetic local PNG/WebM files
exercise ResizeKit and CreatorClip, CreatorRecord toggles its local microphone
preference, selects/ranges are eligible controls, and only the unique marker
is treated as content-bearing.

The second strict pass completed at **33/80**, leaving these 47 overflow-only
routes:

```text
/fr/tools/accroches-de-contenu-pour-createur/app
/fr/tools/afrostream-afrique-s-createur-streaming-hub/
/fr/tools/amelioration-de-contenu-pour-createur/
/fr/tools/amelioration-de-contenu-pour-createur/app
/fr/tools/bio-createur/app
/fr/tools/bureau-du-createur/app
/fr/tools/calendrier-createur/app
/fr/tools/club-des-createurs/
/fr/tools/courriels-pour-createur/
/fr/tools/courriels-pour-createur/app
/fr/tools/cours-pour-createurs/
/fr/tools/cout-publication-livre/
/fr/tools/createur-de-carrousel/
/fr/tools/decoupe-de-video-pour-createur/app
/fr/tools/equipe-du-createur/
/fr/tools/equipe-du-createur/app
/fr/tools/facture-createur/
/fr/tools/facture-createur/app
/fr/tools/hashtags-createur/
/fr/tools/idees-de-contenu-pour-createur/app
/fr/tools/kit-de-marque-pour-createur/
/fr/tools/kit-de-marque-pour-createur/app
/fr/tools/kit-media-pour-createur/
/fr/tools/kit-media-pour-createur/app
/fr/tools/mediatheque-pour-createur/
/fr/tools/mediatheque-pour-createur/app
/fr/tools/miniature-pour-createur/
/fr/tools/page-createur/
/fr/tools/palette-couleurs-africaines/
/fr/tools/partage-redevances-musicales/
/fr/tools/planning-du-createur/
/fr/tools/planning-du-createur/app
/fr/tools/prix-commande-art/
/fr/tools/prix-seance-photo/
/fr/tools/recherche-de-contenu-pour-createur/
/fr/tools/redimensionnement-pour-createur/
/fr/tools/redimensionnement-pour-createur/app
/fr/tools/repartition-des-revenus-entre-createurs/app
/fr/tools/reutilisation-de-contenu-pour-createur/app
/fr/tools/revenus-du-createur/
/fr/tools/revenus-du-createur/app
/fr/tools/scripts-video-pour-createur/app
/fr/tools/stats-createur/
/fr/tools/stats-createur/app
/fr/tools/tarification-pour-createur/
/fr/tools/tarification-pour-createur/app
/fr/tools/titres-de-contenu-pour-createur/app
```

The preserved selector frequency was:

```text
afro-footer 36
afro-site-assistant 19
div.en-card 4
div.en-card-title 3
span 2
section#tool-mount 2
div.en-tool-layout 2
```

The remaining one-off selectors were the palette title, caption pills,
CreatorHashtags layout/tags, art title, ResizeKit original/size labels,
CreatorBrand preview/swatches, and CreatorAnalytics table nodes.

Concrete repairs:

- added the two missing source-owned French route mappings:
  `social-media-calendar -> calendrier-medias-sociaux` and
  `wedding-photo-package -> forfait-photo-mariage`;
- added a Creative-only reflow stylesheet to the exact 79 routes;
- added a Creative-only open-shadow reflow owner for navbar, footer, and site
  assistant, without modifying their global generated/minified assets;
- made the assistant's closed panel leave layout, made the footer use one
  column at the target viewport, and made the navbar retain only its burger
  group at the constrained text size;
- repaired the named Creative grids, pills, swatches, table cells, ResizeKit
  labels/cards, and CreatorClip logo icon.

After the shared repair, **42/80** passed. Its 38 failures contained
`afro-footer` 36 times, ResizeKit size labels 15 times, and CreatorAnalytics
table nodes 10 times. The footer's late registry-count render had erased the
injected style; the shadow observer now reapplies it after any render.

The next full pass reached **79/80**. The last defect was CreatorClip's
post-file-action film icon, flex-shrunk from 19px to 2px. A scoped non-shrinking
icon rule repaired it. A light-DOM-only **80/80** journey receipt then passed
and was retained as superseded evidence.

The corrected recursive sample exposed the shadow navbar at 348px and the
clipped 1px ResizeKit accessible label. The navbar now reflows in its open
shadow root, and the visually hidden label is explicitly opacity-zero and
pointer-disabled. The corrected recursive matrix then passed **80/80**.

## Final receipts

- Binding recursive route-real proof: **80/80 passed**
  - independent inventory: 1/1
  - French launchers: **46/46**
  - French workspaces: **33/33**
  - initial and post-action workspace audits: all green
  - external requests: recorded and blocked
  - content-bearing workspace writes: zero
- Legacy Creative/French Playwright regression: **277/277 passed**
- Focused Creative/French Node suite: **193/193 passed**
- Final-wave engine suite: **6/6 passed**
- Focused French AI/artwork ownership: **8/8 passed**
- Privacy consent server test: passed
- Privacy AI consent Playwright: **3/3 passed**
- `npm run lint`: passed
- `npm run type-check`: passed
- `npm run check-links`: passed; 126,228 internal links across 10,872 HTML
  files, no broken internal links
- `npm run audit`: passed; two known missing pages are non-Creative backlog
- `npm run validate:hreflang`: passed; 30,694 relationships in 5,147 groups
- `node scripts/build-i18n.js --validate`: passed for French, Swahili, Yoruba,
  and Hausa
- exact Creative proof assets: verified on 79/79 physical routes
- `git diff --check`: passed
- deleted-file audit: zero

`npm run build:i18n:validate` remains fail-closed at
`localization:check` because these coordinator-owned generated artifacts are
stale:

```text
data/registry/locale-page-coverage.json
reports/localization-coverage.json
reports/localization-coverage.md
```

They were not regenerated or modified. The direct translation-key validator
and full route-contract hreflang validator both pass.

No push, PR, merge, deploy, sitemap change, global generated-artifact update,
or deletion was made.
