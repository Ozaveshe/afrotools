# AfroTools v7 generated/static churn cleanup report

## 1. Final verdict

NOT SAFE TO CLEAN.

The generated churn is mostly understood, but the cleanup should not be applied automatically from this working tree.

## 2. Whether the v6 CSS fix remains committed

No. The v6 CSS fix is still staged only:

- `assets/css/global.css`
- `assets/css/global.min.css`

The latest commit in `git log --oneline -5` is `1351161 feat: harden CV exports and study abroad trust`; no separate commit for the v6 hero view-transition CSS fix exists.

## 3. Dirty status before/after

- Before v7 evidence files: 8,014 status entries captured in `audit-results/v7-status-before.txt`.
- After v7 evidence and verification files: 8,049 status entries captured in `audit-results/v7-status-after.txt`.
- Tracked modified files after: 7,947.
- Staged files after: 2.
- Untracked files after: 117.
- Deleted files after: 0.

The count increased because v7 created audit evidence files. No product cleanup was applied.

## 4. HTML files changed before/after

- Before: 7,942 HTML files.
- After: 7,942 HTML files.

Full current list: `audit-results/v7-html-cachebust-files-current.txt`.

## 5. Cache-bust-only diffs before/after

- Cache-bust-only global CSS HTML diffs: 7,940.
- Non-cache-bust HTML outliers: 2.

Outliers:

- `tools/cv-builder/index.html`
- `tools/study-abroad-cost/index.html`

The outliers contain real product/content changes and must not be mixed into a generated HTML cache-bust commit.

## 6. Whether generated HTML belongs in git

Yes, root/static HTML appears to be intentionally tracked in this repo.

Evidence:

- `index.html`, `404.html`, and tool pages are tracked.
- `dist/` is ignored and has 0 tracked files.
- Netlify publishes `dist/`.
- `npm run build:deploy` runs the root build mutation pipeline and then prepares `dist/`.
- `docs/known-traps.md` confirms the repo has a generated layer even though it is static-first.

Generated root HTML should be committed only as a separate generated-output commit after source changes are committed and outliers are separated.

## 7. Cache-bust source of truth

`scripts/cachebust.js`.

It writes `?v=` query strings for local CSS and JS references in HTML. It uses a deterministic content hash over normalized asset content, not a timestamp or random value.

Current global CSS cache-bust changes:

- `global.min.css`: `98898086` to `e7ad73c8`
- `global.css`: `4b86b610` to `8ba19bad`

## 8. Whether cache-busting is deterministic

Yes. The script uses an MD5 content hash and takes the first 8 hex characters.

Release risk is not the hash algorithm. The risk is that unexpected `npm run build` steps ran during v7, including `scripts/cachebust.js`, `scripts/inject-internal-links.js`, and `scripts/seo-daily-fix.js`, and an unexpected `git add -u` process appeared. A new build/cachebust process also restarted after earlier stops. The cached diff stayed clean, but that is enough to block automatic cleanup.

## 9. Whether build:deploy was run

No.

It was intentionally not run because:

- the v6 CSS fix is still staged, not committed;
- unexpected build/cachebust/internal-link/SEO build steps had already mutated the tree during v7 and restarted after being stopped;
- running `build:deploy` would regenerate broad output before the source/index decision is settled.

## 10. Whether Playwright still passes

Yes.

- `npx playwright test`: PASS, 79/79.
- Output saved to `audit-results/v7-playwright-final.txt`.

## 11. Whether npm test still passes

Yes.

- `npm test`: PASS.
- 0 broken internal links across 80,818 internal links and 8,524 HTML files.
- Existing automation/public-claim warnings remained non-failing.
- Output saved to `audit-results/v7-npm-test-final.txt`.

## 12. Whether audit:dist still passes

Yes.

- `npm run audit:dist`: PASS.
- Output saved to `audit-results/v7-audit-dist-final.txt`.

## 13. Exact files still dirty

Full exact lists:

- `audit-results/v7-status-after.txt`
- `audit-results/v7-name-status-after.txt`
- `audit-results/v7-dirty-tracked-files-current.txt`
- `audit-results/v7-untracked-files-current.txt`
- `audit-results/v7-cached-name-status-after.txt`

Key groups:

- Staged CSS fix: `assets/css/global.css`, `assets/css/global.min.css`.
- Generated/cache-bust HTML churn: 7,940 cache-bust-only HTML diffs.
- Non-cache-bust HTML outliers: `tools/cv-builder/index.html`, `tools/study-abroad-cost/index.html`.
- Other tracked non-HTML carryover: `package.json`, `docs/product-backbone/free-apps-backbone.md`, `scripts/lib/safe-write.js`, `tools/cv-builder/js/cv-sponsors.js`, `audit-results/study-abroad-source-gap-report.json`.
- Untracked source/carryover: `tests/study-abroad-conversion-layer.test.js`, `tools/cv-builder/css/cv-layout-decongestion.css`, `tools/cv-builder/js/cv-layout-decongestion.js`, `tools/study-abroad-cost/study-abroad-conversion-auto.js`, `tools/study-abroad-cost/study-abroad-conversion-layer.css`, `tools/study-abroad-cost/study-abroad-conversion-layer.js`.
- Untracked audit evidence: 111 files.

## 14. Exact next human action

First stop the external source that is launching `npm run build`. Then commit or unstage the reviewed v6 CSS fix. If committing it:

```powershell
git diff --cached --check
git commit -m "fix: narrow hero view transition selector"
```

Then handle generated/static churn in a separate decision:

1. Review and decide the CV Builder and Study Abroad carryover files.
2. Run `npm run build:deploy` only after the source/index state is stable.
3. Stage only cache-bust-only HTML as a generated-output commit if the regenerated output remains deterministic.
4. Keep audit artifacts out of the product commit unless intentionally preserving evidence.
