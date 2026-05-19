# V3 Final Commands

## Verification Table

| Command | Result | Exit | Key counts / notes | Blocking? |
|---|---|---:|---|---|
| `npm run build:deploy` | PASS after retry-safe write fixes | 0 | Final evidence: `audit-results/v3-final-build-deploy-rerun4.txt`. Built `dist/`, copied 11046 files, 117 files skipped by publish rules. | No |
| `npm test` | PASS | 0 | 80784 internal links checked across 8524 HTML files. Broken links: 0. Registry pages found: 2454, missing: 0. Public claim warnings: 83, failures: 0. | No |
| `node scripts/comprehensive-quality-crawl.js` | PASS | 0 | 8501 routes/pages audited. Broken pages: 0. Broken links: 0. Broken images: 0. Accessibility issues: 0. Metadata heuristic issues: 3355. Copy heuristic issues: 135. | No |
| `npm run seo:report` | PASS | 0 | Missing canonical/title/meta/hreflang: 0. No SEO fixes needed. | No |
| `npm run security:scan` | PASS | 0 | Publish-surface scan passed. | No |
| `npm run audit:dist` | PASS | 0 | Deploy artifact audit passed. | No |
| `npm run validate:hreflang` | PASS | 0 | 7889 pages scanned, 7887 with hreflang, 20495 pairs, 0 errors. | No |
| `npm run mobile:audit` | PASS | 0 | 8461 pages audited, 97 issue-bearing pages, 148 total issues. | No, with documented remaining debt |
| `npm run mobile:network` | WARN | 0 | 6 routes audited, 2 PASS, 4 WARN, 0 FAIL. Search and salary hub now pass. Remaining WARN fully explained in `v3-network-fixes.md`. | No, if accepted as known debt |
| `npx playwright test tests/e2e/product-quality-v2.spec.js tests/e2e/product-quality-v3.spec.js --reporter=line` | PASS | 0 | 14 passed, 0 failed. | No |
| `git diff --check` | PASS after whitespace fix | 0 | Final evidence: `audit-results/v3-final-git-diff-check-post-report.txt`. CRLF warnings only for `netlify.toml` and `scripts/update-html-bundles.js`. | No |
| `git status --short` | WARN | 0 | 8662 dirty status entries. Classified in `v3-dirty-file-classification.md`. | Packaging blocker if not split |
| `git diff --stat` | WARN | 0 | 8476 diff files, 31535 insertions, 125087 deletions. Classified by group. | Packaging blocker if reviewed as one diff |

## Failed Attempts That Were Fixed

- Early `build:deploy` attempts hit Windows file-lock `UNKNOWN` errors while generated files were being rewritten.
- Fixed by increasing retry-safe writes in `scripts/lib/safe-write.js` and using retry-safe output in affected scripts.

## Release-Gate Interpretation

All functional, crawl, SEO, security, dist, hreflang, mobile audit, and product-quality Playwright gates pass or have a documented WARN. The remaining release hygiene risk is packaging: the raw dirty tree is too large to review as a single diff.
