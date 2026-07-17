# AfroTools Release Readiness Review - 2026-05-18

## Verdict

PASS WITH CARRIED RISKS.

The release gates passed after self-review fixes. The largest issue found during review was not a UI regression, but an audit gap: broad Netlify rewrite rules were masking real missing internal targets. The crawler and legacy link checker were tightened, 112 stale internal hrefs were repaired, and the post-build crawls now report zero broken internal links.

## Blocking Findings Fixed

- `scripts/check-links.js` now validates redirect targets instead of treating any matching rewrite as success. It also ignores code examples inside scripts/styles when checking tag hrefs.
- `scripts/comprehensive-quality-crawl.js` now validates redirect targets, so generic rewrites such as `/:page -> /:page/index.html` cannot hide missing pages.
- 112 stale internal hrefs were replaced with existing routes across VAT country pages, category hubs, French pages, Hausa/Swahili/Yoruba pages, and tool helper pages.
- `tools/unit-converter/index.html` and `sw/zana/kubadilisha-vipimo/index.html` now have labeled selects, no duplicate pressure select ID, and working pressure conversion.
- `assets/css/vat-calculator.css` no longer uses the text token as a dark-mode background for VAT surfaces.

## Proof Commands

| Command | Result |
| --- | --- |
| `npm run build:deploy` | PASS |
| `npm test` | PASS |
| `node scripts/check-links.js` | PASS, 80,884 links checked, 0 broken |
| `node scripts/comprehensive-quality-crawl.js` | PASS, 8,501 pages audited, 0 broken pages, 0 broken links, 0 broken images |
| `npm run seo:report` | PASS, 0 canonical/title/meta/hreflang violations in report gate |
| `npm run validate:hreflang` | PASS exit, 836 warnings remain |
| `npm run security:scan` | PASS |
| `npm run audit:dist` | PASS |
| `npm run mobile:audit` | PASS exit, 1,067 issue-bearing pages remain |
| `npm run mobile:network` | WARN |
| Playwright unit converter and VAT smoke | PASS |
| `git diff --check` | PASS |

## Current Crawl Totals

- Sitemap URLs: 7,439
- HTML files: 8,501
- Routes/pages audited: 8,501
- Broken pages: 0
- Broken internal links: 0
- Broken images: 0
- Metadata issues: 3,356
- Accessibility heuristic issues: 2,632
- Dark-mode heuristic risks: 456
- Copy-quality heuristic issues: 137
- Mobile heuristic issues: 988
- Render risks: 0

## Remaining Risks

- The checkout remains very dirty, including generated/build churn and unrelated localization/content work. Package the release from the intended source set, not by assuming every dirty file belongs to this pass.
- `validate:hreflang` exits successfully but still reports 836 bidirectionality warnings, mainly carried Hausa/Swahili localization alternates.
- `mobile:audit` still reports 1,067 issue-bearing pages, led by late multi-column collapse, small tap targets, and fixed sidebars.
- `mobile:network` is WARN on constrained Africa mobile profile because several representative pages have slow DCL/load or CLS warnings.
- The new comprehensive crawler is static and heuristic. It catches broad link/metadata/a11y/dark/copy patterns, but it is not a full browser visual regression suite.
