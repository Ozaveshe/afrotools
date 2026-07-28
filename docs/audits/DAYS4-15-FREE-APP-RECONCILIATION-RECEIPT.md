# Days 4-15 Free-App Reconciliation Receipt

Date: 2026-07-28

Release branch: `codex/free-app-reconciliation-days4-15`

Verified baseline: `origin/main` at `f3d8bfa4`

## Decision

Days 4-11 were not accepted from session summaries alone. Their category and
app evidence was replayed from the last confident Day 3 boundary. Days 12-14
were then executed as cross-category closure gates. The candidate is at
`ARTIFACT PASS`; CI, the single grouped production deploy and representative
live replay remain the final Day 15 gates.

The public `2,612` figure is an expanded-experience measure. Current registry
truth is `1,258` canonical published English tools, `3,663` canonical published
records across locales, and `2,612` expanded live experiences. These measures
must not be added together or described as 2,612 separately improved English
apps.

## Category and app evidence

| Day | Scope | Reconciliation result |
| --- | --- | --- |
| 4 | Document & PDF; Image & Design; Developer Tools | 88/88 grouped browser checks across 82 canonical apps plus hubs/inventories |
| 5 | Education; Health & Wellness; Language & Translation | Language 31/31, Health 35/35 maintained browser checks, Education 263/263 effective app routes plus hub, and 113/113 Education engine/static checks |
| 6 | Agriculture; Transport & Logistics; Trade & Import | 487/487 physical routes and all 16 maintained family workflows |
| 7 | Government & Civic; Insurance; Mortgage & Property | Government/Property 51/51 effective routes, Insurance 323/323, visa/work-permit 108/108 |
| 8 | Engineering & Construction; Climate & Environment; Mining & Extractives | All 46 hub-real routes and 3/3 Crypto Mining workflows |
| 9 | Creative Economy; Sports & Entertainment; Travel & Tourism | 165/165 effective browser surfaces; Sports 15/15 and Travel 9/9 |
| 10 | Uniquely African; Religious & Cultural; Data & Productivity | 72/72 category workflows across 69 canonical apps and 84 expanded experiences |
| 11 | Telecom & Mobile; Energy & Utilities | All 301 physical routes and all 34 canonical-owner workflows |

This replay repaired actual product defects instead of merely changing status:
the shared navbar discovery error, Crypto Mining overlap/cookie behavior,
Health mobile overflow, stale browser harness assumptions, the Day 11
freshness assertion, and SEO JSON-LD serialization that previously collapsed
localized markup. The SEO fixer now changes URL string tokens without
reformatting the surrounding JSON-LD. The `/ai/` hub retains crawlable direct
links to six high-value tools, the AI quota test matches the shared
browser/server 99/999 contract, and newly routable Mining tools were removed
from the AI exception ledger.

## Cross-category gates

- Full test command: 403 files, 884 tests, 884 passed, 0 failed, 0 quarantined.
- Content integrity: 10,831 HTML pages, 0 blockers, 0 warnings, 7 reviewed
  exceptions.
- Links: 124,730 internal links across 10,837 HTML files, no broken internal
  links.
- Registry: 1,258 canonical published English tools, 3,663 canonical published
  records, 2,612 expanded live experiences.
- Localization: 10,660 pages; 8,125 native, 2,476 localized shells, 38 explicit
  English fallbacks, 20 unavailable and 1 deprecated.
- Hreflang: 30,495 relationships across 5,147 equivalence groups passed before
  the release build; the build regenerated the current route contract and
  sitemaps.
- PDF/document, category workflow, privacy/AI consent and Pro architecture
  verification passed.
- `npm run lint`, `npm run type-check`, `npm run security:scan`,
  `npm run build:deploy`, `npm run audit:dist` and `git diff --check` passed.
- The build generated 16,024 deploy files and the deploy artifact audit passed.

## Generated-output explanation

The release build legitimately cache-busted committed asset references across
10,320 HTML files. These are generated two-line hash changes, not 10,320
individual app improvements. No file deletion was introduced. The underlying
app/category evidence above remains the acceptance basis.

## Carried risks and exclusions

- Mining has seven working hub routes but zero Mining-owned registry rows in
  the historical ownership ledger. Working behavior is proved; ownership
  reconciliation remains open.
- CreatorClip, CreatorRecord and CreatorVoice pass simulated device/workspace
  checks but still require reopened output on representative real-device
  codecs before receiving that specific media-device proof.
- Telecom and Energy snapshots are 149 days old on 2026-07-28 and retain
  source-ledger gaps; affected interfaces disclose this rather than presenting
  the data as live.
- Government source verification retains changed/manual/blocked rows. This is
  a source-freshness boundary, not a hidden green result.
- The broad public-claim audit passes, but 422 money-tool routes still lack a
  source-registry entry.
- Three registry rows intentionally point to `africa-tools.com` and therefore
  have no local AfroTools page.
- Four malformed historical JAMB documents are skipped by analytics injection;
  all 10,536 eligible pages are covered.
- Production status is not recorded as complete until the exact merged SHA is
  green in CI, deployed once as the grouped release, and replayed live on
  representative category/app routes.
