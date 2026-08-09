# Swahili Creative final A evidence

- Frozen base: `2f5fb8988ddd40e28eb17123fe653b18ff0801c3`
- Branch: `codex/sw-final-creative-a-20260809`
- Scope: 13 exact English owners and 13 native Swahili counterparts
- Adversarial acceptance: 6/13 currently accepted; 7 remain blocked for English-workspace feature restoration
- Deletions: 0

## Adversarial status

| English owner | Native Swahili route | Status and proof |
|---|---|---|
| `afrostream` | `/sw/zana/afrostream/` | **Accepted after repair:** safe API DOM, correct country/category mapping, freshness/fallback, reopened JSON/CSV |
| `creator-carousel` | `/sw/zana/carousel-ya-mitandao/` | **Accepted after repair:** complete colour controls, canvas preview, JSON/TXT, reopened ZIP with five 1080x1350 PNGs |
| `creator-clip` | `/sw/zana/kukata-video-za-mtayarishi/` | **Accepted after repair:** full English feature matrix, uploaded WebM edited/exported/reopened, project save, 320px reflow |
| `creator-desk` | `/sw/zana/dawati-la-mtayarishi/` | **Blocked:** missing Quoted status and English currency options |
| `creator-hashtags` | `/sw/zana/hashtag-za-maudhui/` | **Blocked:** missing optional consented AI, custom mix, copy/clear and local history |
| `creator-hooks` | `/sw/zana/hook-za-video/` | **Accepted:** deterministic Swahili hooks, timing, JSON/TXT |
| `creator-invoice` | `/sw/zana/ankara-ya-mtayarishi/` | **Blocked:** missing multi-line invoice, dates, discounts, notes, save/restore and copy workflow |
| `creator-kit` | `/sw/zana/media-kit-ya-mtayarishi/` | **Accepted:** complete local rate card, JSON/TXT and explicit AI consent boundary |
| `creator-mail` | `/sw/zana/barua-ya-mtayarishi/` | **Blocked:** missing rendered newsletter preview and full preheader export parity |
| `creator-mind` | `/sw/zana/mawazo-ya-mtayarishi/` | **Accepted:** deterministic local idea plan, JSON/TXT |
| `creator-money` | `/sw/zana/mapato-ya-mtayarishi/` | **Blocked:** missing margin, effective-hourly and copy-plan surfaces |
| `creator-page` | `/sw/zana/ukurasa-wa-mtayarishi/` | **Blocked:** missing TXT export and accent styling in exported HTML |
| `creator-polish` | `/sw/zana/boresha-maudhui-ya-mtayarishi/` | **Blocked:** incomplete visible metrics and repeated-word guidance bug |

## Browser contract

The isolated Chromium suite uses a unique server port and one worker. It covers all 13 routes, every advertised export, invalid/reset/stale behavior, 320px and 375px layouts, effective 200% reflow, manual light/dark themes, labels/focusable controls, page and console errors, local resources, native canonicals, and local-first behavior.

CreatorClip proof now uses a real uploaded browser-generated WebM fixture through the complete editor, including captions, overlays, resizing, filters and local project save. The exported WebM is reopened and its EBML signature and media duration are verified.

AfroStream never fabricates a successful live state. Failed public APIs fall back to the committed local snapshot with a visible snapshot label, review date, and unverified-metrics boundary. If neither source is available, the UI withholds profiles.

## Scope boundaries

No Swahili acceptance ledger, AI route map, locale coverage output, sitemap, redirect, service worker, broad generated output, push, PR, merge, deployment, live Supabase action, or non-metadata English product behavior was changed.

The smaller HTML diffs replace prior generated gap shells or one-off inline pages with source-owned native products. The replacement contract was checked per route for a real form/workflow, results/status surface, all exports, local-first/privacy copy, canonical, OG metadata, WebApplication schema, artwork, reciprocal `en`/`fr`/`sw`/`x-default` hreflang, and absence of iframes or remote runtime scripts.

## Validation receipt

- `node scripts/build-sw-creative-final-a.js`
- `node tests/sw-creative-final-a.test.js`
- `playwright test tests/e2e/sw-creative-final-a.spec.js --workers=1` on isolated port `43191`: 5/5 passed, covering 13/13 routes and all advertised exports
- `node scripts/build-localization-platform.js --check`: 11,383 pages consistent
- `node scripts/build-i18n.js --validate`: French, Swahili, Yoruba and Hausa catalogs valid
- `node scripts/validate-hreflang.js`: 33,960 relationships / 5,350 groups reciprocal
- `node scripts/check-links.js`: 137,279 internal links across 11,602 pages, zero broken
- `node tests/ai-consent-server.test.js`: passed
- `node scripts/ci-lint.js`: passed
- `node scripts/ci-type-check.js`: passed
- `git diff --check`
- `git diff --diff-filter=D --summary`: empty

`node scripts/audit-afrostream-live-media.js` could not reach its external audit target (`fetch failed`). This is recorded as external live-source evidence unavailable, not as a successful live-data check. The route's deterministic API/failure browser proof passed and the product visibly falls back rather than presenting stale data as live.
