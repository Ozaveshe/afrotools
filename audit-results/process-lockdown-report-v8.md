# AfroTools v8 process-lockdown and safe-commit report

## 1. Final verdict

PROCESS SAFETY BLOCKER REMAINS.

The two-file CSS fix was not committed.

## 2. Whether mutating processes were found

Yes.

Mutating AfroTools processes were repeatedly found:

- `npm run build`
- `cmd /c npm run build`
- `node scripts/cachebust.js`
- `node scripts/seo-daily-fix.js`

The build chain included cachebust, internal-link injection, sitemap/blog/feed generation, and SEO daily fix steps.

## 3. Whether any process restarted

Yes.

After stops, new Codex-launched PowerShell commands restarted:

- a monitored hidden `cmd /c npm run build`;
- standalone `node scripts/seo-daily-fix.js`;
- standalone `node scripts/cachebust.js`.
- standalone `node --trace-uncaught scripts/cachebust.js`.

## 4. Whether the restart source was identified

Partially yes.

The direct parent was `codex.exe` PID 87532. The restart commands appear to be stale or queued Codex-launched PowerShell tasks from prior build/proof work. No thread terminal session was attached, so there was no interactive terminal to cancel from this thread.

One final restart was observed and stopped while this report was being prepared. A final immediate recheck then showed `MUTATOR_COUNT=0`, but the repeated restart behavior is still the release blocker.

## 5. Whether working tree snapshots were stable

No.

Snapshot counts changed:

- Snapshot 1: 8,072 status entries, 7,948 unstaged name-status entries.
- Snapshot 2: 8,073 status entries, 7,947 unstaged name-status entries.
- Snapshot 3: 8,072 status entries, 7,947 unstaged name-status entries.

Specific instability:

- `assets/js/components/related-tools-data.js` disappeared from the unstaged diff after snapshot 1.
- `audit-results/cv-builder-export-empty-preview-polish-screens/` appeared after snapshot 1.

## 6. Whether safety patches were created

Yes.

- `audit-results/v8-staged-css-fix.patch`
- `audit-results/v8-unstaged-working-tree.patch`
- `audit-results/v8-staged-name-status.txt`
- `audit-results/v8-unstaged-name-status.txt`

The unstaged patch had to be created with `git diff --output=...` because shell piping hit Windows `mmap failed` on the huge diff.

## 7. Exact files staged before commit

- `assets/css/global.css`
- `assets/css/global.min.css`

## 8. Exact files committed

None. No commit was created.

## 9. Whether generated HTML remained unstaged

Yes. Generated HTML remained unstaged. The cached diff stayed exactly the two CSS files.

## 10. Whether 79/79 Playwright still passed

Yes.

- `npx playwright test`: PASS, 79/79.

## 11. Whether npm test still passed

Yes.

- `npm test`: PASS.
- 0 broken internal links across 80,819 links and 8,524 HTML files.

## 12. Whether audit:dist still passed

Yes.

- `npm run audit:dist`: PASS.

## 13. Current dirty status after commit

No commit was made.

Final status count captured by v8:

- `git status --short`: 8,096 entries.
- Cached diff: exactly 2 files.
- Latest commit remains `1351161 feat: harden CV exports and study abroad trust`.

Evidence:

- `audit-results/v8-status-final.txt`
- `audit-results/v8-log-final.txt`
- `audit-results/v8-cached-name-status-final.txt`
- `audit-results/v8-cached-stat-final.txt`

## 14. Exact next action for v9

Stop or cancel the Codex-launched stale build/cachebust task source outside this thread, then rerun v8 from process lockdown.

Do not commit until:

1. `MUTATOR_COUNT=0` remains true across repeated checks.
2. Three stability snapshots match.
3. `git diff --check` can complete without `mmap failed`, or the maintainer explicitly accepts a narrower staged-only whitespace gate because the unstaged generated churn is too large for Windows Git.
4. Cached diff remains exactly:
   - `assets/css/global.css`
   - `assets/css/global.min.css`

Only then run:

```powershell
git commit -m "fix: scope hero view transition styling"
```
