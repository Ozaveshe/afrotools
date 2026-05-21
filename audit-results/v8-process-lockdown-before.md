# v8 process lockdown before

## Summary

Mutating AfroTools processes were active at the start of v8. The working tree was not safe to commit.

## Mutating processes found

| PID | Parent PID | Command | Inside AfroTools | Can mutate files | Safe to stop | Restart/supervisor evidence |
|---:|---:|---|---|---|---|---|
| 83208 | 87532 | PowerShell with `AFROTOOLS_SAFE_WRITE_ATTEMPTS`, `AFROTOOLS_SAFE_WRITE_DELAY_MS`, then `npm run build` | Yes | Yes | Yes | Parent was `codex.exe` PID 87532 |
| 16180 | 83208 | `npm-cli.js run build` | Yes | Yes | Yes | Child of PID 83208 |
| 72460 | 16180 | `cmd.exe /d /s /c node scripts/build-tool-directory.js ... node scripts/cachebust.js ... node scripts/seo-daily-fix.js ...` | Yes | Yes | Yes | Child of npm build |
| 13916 | 72460 | `node scripts/cachebust.js` | Yes | Yes | Yes | Child of build command |

## Non-mutating or unrelated processes

- Local `http-server` processes for the AfroTools repo were running on ports 4181 and 4183. They are read-only static servers.
- SimbiOS Next dev processes were running outside this repo.
- Adobe Node processes were unrelated.
- Codex `node_repl.exe` helpers were unrelated.
- Several `git diff` / `git status` processes from tooling were read-only.

## Raw evidence

- `audit-results/v8-process-lockdown-before-raw.txt`
- `audit-results/v8-process-lockdown-before.json`
- `audit-results/v8-get-process-before.txt`

## Verdict

Process safety failed before intervention.
