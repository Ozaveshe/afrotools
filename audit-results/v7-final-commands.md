# v7 final commands

## Commands run

| Command | Result | Key counts / notes | Release-blocking |
|---|---|---|---|
| `git log --oneline -5` | PASS | Latest commit was `1351161 feat: harden CV exports and study abroad trust`; no separate v6 CSS commit was present. | Yes, because v7 expected the CSS fix to be committed first. |
| `git status --short` | PASS | Broad dirty state remained. Later count: 8,024 status entries before final report files. | Yes until classified/handled. |
| `git diff --cached --name-status` | PASS | Staged files remained only `assets/css/global.css` and `assets/css/global.min.css`. | Yes: staged v6 fix is not committed. |
| `git diff --name-only -- "*.html"` | PASS | 7,942 HTML files changed. | Yes until separated. |
| `git diff --unified=0 -- "*.html"` | PASS | 7,940 cache-bust-only global CSS HTML diffs, 2 non-cache-bust outliers. | Yes until outliers are separated. |
| `git ls-files --others --exclude-standard` | PASS | 117 untracked files: 111 audit/evidence, 6 source/carryover. | Manual review required. |
| `git diff --check` | PASS | Exit 0, 22.6s. No whitespace errors reported in final check. | No. |
| `git diff --cached --check` | PASS | Exit 0, 0.1s. No staged whitespace errors reported in final check. | No. |
| `npm run audit:dist` | PASS | Exit 0, 11.1s. Deploy artifact audit passed. | No. |
| `npm test` | PASS | Exit 0, 18.7s. 0 broken internal links across 80,818 links and 8,524 HTML files. Existing automation/public-claim warnings remained non-failing. | No for v7 generated cleanup. |
| `npx playwright test` | PASS | Exit 0, 69s. 79/79 passed. | No. |

## Commands intentionally not run

| Command | Reason |
|---|---|
| `npm run build:deploy` | Not run because v7 found the v6 CSS fix still staged and an unexpected build/cachebust process already mutating the tree. Running build again would add churn before the source/index state is settled. |

## Conclusion

v7 did not regress the staged CSS patch, but it also did not clean the generated churn. The blocker is process/index safety and mixed generated/product churn, not test failure evidence.
