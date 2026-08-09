# Swahili Creative final A evidence

- Frozen base: `2f5fb8988ddd40e28eb17123fe653b18ff0801c3`
- Branch: `codex/sw-final-creative-a-20260809`
- Scope: 13 exact English owners and 13 native Swahili counterparts
- Acceptance: 13/13 locally accepted
- Deletions: 0

## Accepted owners

| English owner | Native Swahili route | Product and export proof |
|---|---|---|
| `afrostream` | `/sw/zana/afrostream/` | Live API state, source/freshness label, fail-closed local snapshot, filters, reopened JSON and CSV |
| `creator-carousel` | `/sw/zana/carousel-ya-mitandao/` | Deterministic slide plan, invalid/reset/stale state, reopened JSON and HTML |
| `creator-clip` | `/sw/zana/kukata-video-za-mtayarishi/` | Browser MediaRecorder workflow, deterministic synthetic MediaStream fixture, reopened WebM EBML header and JSON |
| `creator-desk` | `/sw/zana/dawati-la-mtayarishi/` | Portable local project record, invalid/reset/stale state, reopened JSON and CSV |
| `creator-hashtags` | `/sw/zana/hashtag-za-maudhui/` | Deterministic local sets with no live-trend claim, reopened JSON and TXT |
| `creator-hooks` | `/sw/zana/hook-za-video/` | Deterministic Swahili hooks and timing, reopened JSON and TXT |
| `creator-invoice` | `/sw/zana/ankara-ya-mtayarishi/` | Cent-safe invoice engine, reopened JSON, TXT and parser-readable PDF |
| `creator-kit` | `/sw/zana/media-kit-ya-mtayarishi/` | Complete local rate card, reopened JSON/TXT, zero AI requests before explicit consent, visible payload preview and local fallback |
| `creator-mail` | `/sw/zana/barua-ya-mtayarishi/` | Local newsletter builder, reopened HTML, JSON and TXT |
| `creator-mind` | `/sw/zana/mawazo-ya-mtayarishi/` | Deterministic local idea plan, reopened JSON and TXT |
| `creator-money` | `/sw/zana/mapato-ya-mtayarishi/` | Existing shared planning engine, reopened JSON and TXT |
| `creator-page` | `/sw/zana/ukurasa-wa-mtayarishi/` | Portable single-page document, reopened HTML and JSON |
| `creator-polish` | `/sw/zana/boresha-maudhui-ya-mtayarishi/` | Existing deterministic text metrics with Swahili guidance, reopened JSON and TXT |

## Browser contract

The isolated Chromium suite uses a unique server port and one worker. It covers all 13 routes, every advertised export, invalid/reset/stale behavior, 320px and 375px layouts, effective 200% reflow, manual light/dark themes, labels/focusable controls, page and console errors, local resources, native canonicals, and local-first behavior.

The Creator Clip synthetic canvas stream is deterministic proof of the in-browser MediaRecorder and WebM container workflow when physical hardware is unavailable. It is explicitly labelled in the UI and is **not** claimed as real-device capture proof.

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
