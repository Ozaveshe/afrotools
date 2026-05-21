# v7 generated churn decision

## Decision

D. Manual decision required.

## Why this is not safe for automatic cleanup

1. The v6 CSS fix is still staged, not committed.
2. An unexpected `npm run build` / `scripts/cachebust.js` process was active during v7 and was stopped.
3. An unexpected `git add -u` process appeared during v7. Cached diff inspection showed only the two CSS files remained staged, but the event makes automatic cleanup too risky.
4. 7,940 HTML diffs are cache-bust-only, but 2 HTML files contain real product/content changes.
5. The root HTML generated/static layer appears intentionally tracked, so a broad revert would risk throwing away expected cache-bust output.

## Recommended path

1. Commit the staged v6 CSS fix by itself.
2. Decide whether the CV Builder and Study Abroad carryover files belong in this release.
3. Re-run `npm run build` or `npm run build:deploy` from a stable index if generated output is expected.
4. Commit generated cache-bust-only HTML separately from source/product changes.

## Files requiring manual decision before generated commit

- `package.json`
- `docs/product-backbone/free-apps-backbone.md`
- `scripts/lib/safe-write.js`
- `tools/cv-builder/js/cv-sponsors.js`
- `education/study-abroad/index.html`
- `tools/cv-builder/index.html`
- `tools/study-abroad-cost/index.html`
- `tools/cv-builder/css/cv-layout-decongestion.css`
- `tools/cv-builder/js/cv-layout-decongestion.js`
- `tools/study-abroad-cost/study-abroad-conversion-auto.js`
- `tools/study-abroad-cost/study-abroad-conversion-layer.css`
- `tools/study-abroad-cost/study-abroad-conversion-layer.js`
- `tests/study-abroad-conversion-layer.test.js`
