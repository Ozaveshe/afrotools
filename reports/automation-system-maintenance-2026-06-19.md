# Automation System Maintenance - 2026-06-19

Run time: 2026-06-19T08:47:17+05:00

Scope: local Codex automation definitions under `C:\Users\Oza\.codex\automations`, automation memories, refreshed run evidence, duplicate scopes, inactive or noisy jobs, and alignment with `AGENTS.md` plus `docs/codex-playbook.md`.

No automations were deleted, paused, unpaused, merged, or rewritten in this pass. No live Supabase actions were performed.

## Summary

- Local cron definitions: 71.
- Active cron definitions: 61.
- Paused cron definitions: 10.
- Memory files: all 71 automation directories have `memory.md`.
- Execution isolation: 68 `worktree`, 3 `local`.
- Refreshed run evidence: `reports/automation-run-report-2026-06-05-to-2026-06-19.md` with 229 runs, 223 completed, 1 incomplete, 5 interrupted, 0 active automations without run evidence, and 0 active automations missing memory.
- Schedule registry audit: `npm run audit:schedules` passed, but now warns on interrupted archive evidence for `daily-5pm-publish-deploy-gate`, `dependency-sweep`, `medical-report-followup-automation`, and `skill-progression-map`.
- Policy drift: 3 active cron definitions are not on `gpt-5.5` with high reasoning.
- Registry drift: 3 active local Codex automations are absent from `data/automation/automation-registry.json`.

## Findings

### P1 - Active cron definitions violate model policy

- Automation ids: `africa-election-candidate-evidence-review`, `africa-election-tracker-freshness-watch`, `afrotools-car-market-data-refresh`
- Evidence:
  - `C:\Users\Oza\.codex\automations\africa-election-candidate-evidence-review\automation.toml:8` has `model = "gpt-5"`.
  - `C:\Users\Oza\.codex\automations\africa-election-tracker-freshness-watch\automation.toml:8` has `model = "gpt-5"`.
  - `C:\Users\Oza\.codex\automations\afrotools-car-market-data-refresh\automation.toml:8` has `model = "gpt-5"` and line 9 has `reasoning_effort = "medium"`.
  - The maintainer policy requires every cron automation to remain on `gpt-5.5` with high reasoning unless explicitly changed by the user.
- Why it matters: all three jobs can alter source-sensitive public data or research queues.
- Smallest safe change: update only these fields:

```toml
model = "gpt-5.5"
reasoning_effort = "high"
```

### P1 - Active local automations are missing from the registry

- Automation ids: `africa-election-candidate-evidence-review`, `africa-election-tracker-freshness-watch`, `afrotools-car-market-data-refresh`
- Evidence:
  - Local definitions exist under `C:\Users\Oza\.codex\automations\...\automation.toml`.
  - `data/automation/automation-registry.json` has no matching `codex_automation_id` for those three ids.
  - Local inventory found `local=71` and `registry_codex_or_mixed=68`.
- Why it matters: registry-absent jobs miss durable owner, surface, SLA, validation-command, and public-claim review metadata.
- Smallest safe change: add registry records for the three jobs. Use `npm run elections:validate` and `npm run elections:feeds:check` for the election jobs, and `npm run cars:catalog:refresh` for the car market refresh job.

### P1 - Paused product lanes conflict with current playbook ownership

- Automation ids: `afrostream-newswire-agent`, `scholarship-source-expansion-agent`
- Evidence:
  - `C:\Users\Oza\.codex\automations\afrostream-newswire-agent\automation.toml:6` has `status = "PAUSED"`, while `docs/codex-playbook.md:175-177` lists it as a lane-specific product freshness agent.
  - `C:\Users\Oza\.codex\automations\scholarship-source-expansion-agent\automation.toml:6` has `status = "PAUSED"`, while `data/automation/automation-registry.json:1359-1366` registers it as a mixed production lane.
  - Refreshed run evidence shows both had 0 runs in the 2026-06-05 to 2026-06-19 window.
  - `skill-progression-map` memory repeatedly hands off thin AfroStream Newswire volume and an 81-row scholarship review backlog.
- Why it matters: broad watch jobs keep reporting product gaps, but the focused owner lanes are inactive.
- Smallest safe change: choose one owner policy per lane: unpause for bounded repair runs, or keep paused and update `docs/codex-playbook.md` plus registry notes to name the replacement owner.

### P2 - AM and PM content batches remain paused and duplicate

- Automation ids: `am-content-batch-2`, `pm-content-batch-2`
- Evidence:
  - Both are paused at `automation.toml:6`.
  - Their prompt SHA-256 is identical: `7c1b11d9e36fd23820ded4c79448f6b2d2e40f421469f422f456a78812b28218`.
  - `docs/codex-playbook.md:169-171` still lists AM and PM content batches in the active production automation set.
- Why it matters: this is both a scope overlap and documentation drift.
- Smallest safe change: either document that AM/PM content is intentionally paused, or resume only after splitting AM and PM scopes so they do not run the same prompt twice per day.

### P2 - Schedule-audit warnings include stale interrupted evidence

- Automation ids: `daily-5pm-publish-deploy-gate`, `dependency-sweep`, `medical-report-followup-automation`, `skill-progression-map`
- Evidence:
  - `npm run audit:schedules` now warns on interrupted status for those four ids after refreshing `reports/automation-run-report-2026-06-05-to-2026-06-19.md`.
  - The refreshed report shows later completed runs for `dependency-sweep`, `medical-report-followup-automation`, and `skill-progression-map`, but the audit script records any non-completed status found in the latest report window.
  - `daily-5pm-publish-deploy-gate` has newer memory proof on 2026-06-18, but the refreshed archive report still shows the latest parsed archive run as interrupted on 2026-06-17.
- Why it matters: three warnings look like parser false positives after later completion, while deploy-gate may still have an archive capture gap.
- Smallest safe change: update `scripts/audit-automation-registry.js` to classify the latest status per automation by timestamp instead of any non-completed status in the window. Separately inspect the 2026-06-18 deploy-gate archive capture and make sure it emits `task_complete`.

### P2 - Local execution exception can patch repo files

- Automation id: `afrostream-tracking-health`
- Evidence:
  - `C:\Users\Oza\.codex\automations\afrostream-tracking-health\automation.toml:10` has `execution_environment = "local"`.
  - Its prompt permits narrow repo patches.
  - `docs/codex-playbook.md:184` says recurring repo jobs should prefer `worktree` execution.
  - The other local jobs are defensible: `automation-system-maintainer` needs automation-store access, and `supabase-project-advisor-watch` is live-project inspection without repo edits by design.
- Why it matters: this is the remaining local cron that can modify repo files from the main checkout.
- Smallest safe change: change `afrostream-tracking-health` to `execution_environment = "worktree"`, or add a prompt rule: if running local, do not patch repo files; report the patch target instead.

### P3 - Some live/Supabase prompts still lack explicit final-report sectioning

- Automation ids: `africa-election-candidate-evidence-review`, `commercial-funnel-integrity-sweep`, `daily-5pm-publish-deploy-gate`, `daily-bug-scan`, `government-source-freshness-sweep`, `transport-source-freshness-sweep`, plus several prompts with implicit repo/live separation.
- Evidence:
  - Prompt inventory found 60 definitions mentioning live data or Supabase.
  - Most use MCP-first wording, but several do not require separate final sections for live inspection, live writes, repo edits, and validation.
  - `AGENTS.md` requires keeping repo edits and live project actions separate in notes and summaries.
- Why it matters: the current memories are mostly disciplined, but explicit report sections reduce future mixing of live state and repo patches.
- Smallest safe change: add a standard suffix to live-capable prompts:

```text
In the final report, separate Live Supabase inspection, Live writes, Repo edits, and Validation. If Supabase MCP is unavailable, record the exact failure before using any permitted fallback path.
```

## Proposed Update Queue

Do not apply these automatically without approval.

1. Update the three model-policy offenders to `gpt-5.5` and high reasoning.
2. Add registry records for the two election jobs and `afrotools-car-market-data-refresh`.
3. Decide owner policy for `afrostream-newswire-agent` and `scholarship-source-expansion-agent`: unpause bounded repair runs or document replacement owners.
4. Decide AM/PM content-batch policy: keep paused with playbook update, or resume after splitting duplicate scopes.
5. Fix schedule-audit status parsing so later completed runs clear earlier interrupted statuses in the same report window.
6. Move `afrostream-tracking-health` to worktree execution or forbid repo patching while local.
7. Add standard live/repo final-report sectioning to Supabase-capable prompts during the next prompt-tightening pass.

## Validation Commands Used

```powershell
git status --short
npm run automation:report -- --since=2026-06-05 --until=2026-06-19
npm run audit:schedules
Select-String -Path 'C:\Users\Oza\.codex\automations\*\automation.toml' -Pattern '^model|^reasoning_effort|^status|^execution_environment'
Select-String -Path data\automation\automation-registry.json -Pattern 'africa-election-candidate-evidence-review|africa-election-tracker-freshness-watch|afrotools-car-market-data-refresh'
Select-String -Path reports\automation-run-report-2026-06-05-to-2026-06-19.md -Pattern 'interrupted|incomplete|without run evidence|missing memory'
```

## Not Changed

- No automation definitions were edited.
- No schedules were paused, unpaused, merged, or deleted.
- No live Supabase actions were performed.
- A refreshed run-evidence report was created at `reports/automation-run-report-2026-06-05-to-2026-06-19.md`.
