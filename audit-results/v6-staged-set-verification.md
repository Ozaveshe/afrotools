# AfroTools v6 Staged Set Verification

Date: 2026-05-20

## Staged set

- `assets/css/global.css`
- `assets/css/global.min.css`

## Verification results

| Command | Result | Key counts / notes | Release/staging impact |
| --- | --- | --- | --- |
| `npx playwright test` | PASS, exit 0 | 79/79 passed in 51.3s. | Confirms full Playwright suite remains green with the staged CSS fix present. |
| `npm test` | PASS, exit 0 | Link checker scanned 8,524 HTML files; 80,818 internal links; 0 broken internal links. Public claim audit had 83 warnings and 0 failures. Study Abroad conversion layer test also ran because `package.json` and the test file are dirty in the unstaged working tree. | Confirms current working tree plus staged set is green. Because Study Abroad carryover is unstaged but present, this is not an isolated source-only staged-commit proof. |
| `npm run audit:dist` | PASS, exit 0 | Deploy artifact audit passed. | No deploy artifact regression detected. |
| `git diff --check` | PASS, exit 0 | No whitespace errors in unstaged working-tree diff. | Safe from whitespace perspective. |
| `git diff --cached --check` | PASS, exit 0 | No whitespace errors in staged diff. | Staged set is safe to commit from whitespace perspective. |
| `npm run build:deploy` | NOT RUN | Skipped intentionally to avoid regenerating broad output during a staging/reviewability sprint. v5 already recorded build:deploy as passed, and v6 ran `audit:dist`. | Not a blocker for the first reviewed CSS commit, but should be rerun before release packaging. |

## Important caveat

After verification, a full Git refresh exposed broad generated/static HTML churn again:

- `git diff --name-only`: 7,946 unstaged tracked files
- HTML files in unstaged diff: 7,942
- Files whose diff includes `global.min.css?v=` changes: 7,892

This appears to be cache-busted generated HTML output tied to the global minified CSS hash. It was not staged. It should be handled as a separate generated-output decision, not mixed into the first v6 commit.

## Conclusion

The staged set is safe and reviewable. The full working tree is not clean and must not be staged broadly.
