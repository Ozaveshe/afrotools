# v8 process lockdown after

## Actions taken

Stopped only repo-mutating process trees and direct children:

- `audit-results/v8-stopped-mutating-processes.txt`
- `audit-results/v8-stopped-mutating-processes-2.txt`
- `audit-results/v8-stopped-mutating-processes-3.txt`
- `audit-results/v8-stopped-mutating-processes-4.txt`

## Restart source

The restart source was identified as Codex process PID 87532 launching queued/stale PowerShell commands. Parent process:

- PID 87532
- Name: `codex.exe`
- Command: `app-server --analytics-default-enabled`

Evidence file:

- `audit-results/v8-codex-parent-process.txt`

The repeated launch commands included:

- hidden monitored `cmd /c npm run build`, writing `audit-results/npm-build-study-abroad-ux-monitored.*.log`;
- standalone `node scripts/seo-daily-fix.js`;
- standalone `node scripts/cachebust.js`.
- standalone `node --trace-uncaught scripts/cachebust.js`.

## Final check

At the moment of the final report write, the last mutating-process check showed:

- `MUTATOR_COUNT=0`

Evidence:

- `audit-results/v8-mutating-process-check-at-report.txt`
- `audit-results/v8-mutating-process-check-very-final.txt`

## Important caveat

The process restarted multiple times after earlier stops, including once more while the final report was being prepared. Even though the final immediate check was clean, the required v8 outcome of proven stable process safety was not met.

## Verdict

PROCESS SAFETY BLOCKER REMAINS.
