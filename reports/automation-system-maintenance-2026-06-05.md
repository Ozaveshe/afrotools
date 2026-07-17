# Automation System Maintenance - 2026-06-05

Run time: 2026-06-05T07:52:27+05:00

Scope: local Codex automation definitions under `C:\Users\Oza\.codex\automations`, automation memories, recent run evidence, duplicate scopes, inactive/noisy jobs, and alignment with `AGENTS.md` plus `docs/codex-playbook.md`.

No automations were deleted, paused, unpaused, or rewritten in this pass.

## Summary

- Local cron definitions: 69.
- Active cron definitions: 58.
- Paused cron definitions: 11.
- Memory files: all 69 automation directories now have `memory.md`.
- Execution isolation: 66 `worktree`, 3 `local`.
- Schedule registry audit: `npm run audit:schedules` passed; one warning remains for `business-planner-followup-automation` because its latest archived run is still classified as incomplete.
- Policy drift: one active cron is not on `gpt-5.5` with high reasoning.
- Registry drift: one local Codex automation is not represented in `data/automation/automation-registry.json`.

## Findings

### P1 - Active cron violates model and reasoning policy

- Automation id: `afrotools-car-market-data-refresh`
- Evidence:
  - `C:\Users\Oza\.codex\automations\afrotools-car-market-data-refresh\automation.toml:8` has `model = "gpt-5"`.
  - `C:\Users\Oza\.codex\automations\afrotools-car-market-data-refresh\automation.toml:9` has `reasoning_effort = "medium"`.
  - The maintainer prompt requires every cron automation to remain on `gpt-5.5` with high reasoning unless the user explicitly changes the policy.
- Why it matters: car market refresh work is source-sensitive and can alter catalog/research queues, so it should not be the single lower-reasoning active cron.
- Smallest safe change: update only this definition to:

```toml
model = "gpt-5.5"
reasoning_effort = "high"
```

- Validation after update:

```powershell
Select-String -Path 'C:\Users\Oza\.codex\automations\*\automation.toml' -Pattern '^model = "gpt-5"$|^reasoning_effort = "medium"$'
npm run audit:schedules
```

### P1 - Core production content loops are paused and still duplicate each other

- Automation ids: `am-content-batch-2`, `pm-content-batch-2`
- Evidence:
  - `C:\Users\Oza\.codex\automations\am-content-batch-2\automation.toml:6` has `status = "PAUSED"`.
  - `C:\Users\Oza\.codex\automations\pm-content-batch-2\automation.toml:6` has `status = "PAUSED"`.
  - Their prompt SHA-256 prefix is identical: `7C1B11D9E36F`.
  - `docs/codex-playbook.md:169` says the active production automation set should include the highest-value loops, and `docs/codex-playbook.md:170-171` lists `AM Content Batch` and `PM Content Batch`.
- Why it matters: this is both an availability conflict and a scope conflict. If paused intentionally, the playbook should say so. If not, the main content production loop is inactive.
- Smallest safe change: ask for one explicit policy decision, then apply one of these narrow updates:
  - Keep paused: update `docs/codex-playbook.md` to state AM/PM content is intentionally paused and name the replacement publishing workflow.
  - Resume: unpause only after splitting scope so AM and PM are not exact duplicate prompts.
  - Merge: keep one content batch cron, retire or keep the second paused as a backup with a clear memory note.
- Validation after update:

```powershell
Select-String -Path 'C:\Users\Oza\.codex\automations\am-content-batch-2\automation.toml','C:\Users\Oza\.codex\automations\pm-content-batch-2\automation.toml' -Pattern '^status|^prompt'
npm run audit:schedules
```

### P1 - Live data alarm shows repeated stale lanes while a focused producer is paused

- Automation ids: `skill-progression-map`, `afrostream-newswire-agent`
- Evidence:
  - `C:\Users\Oza\.codex\automations\skill-progression-map\memory.md:79-84` reports stale `automation-health-latest`, no recent `market_data_source_runs`, empty remittance quote output, stale AfroStream news, old creator snapshots, and a scholarship review backlog.
  - `C:\Users\Oza\.codex\automations\skill-progression-map\memory.md:92-97` hands several issues to focused agents, including AfroStream Newswire.
  - `C:\Users\Oza\.codex\automations\afrostream-newswire-agent\automation.toml:6` has `status = "PAUSED"`.
- Why it matters: the alarm is doing the right thing, but at least one focused lane it points to is inactive. That makes repeated daily alarm output noisier without moving the repair lane.
- Smallest safe change: either unpause/tighten `afrostream-newswire-agent` for a bounded repair run, or keep it paused and add a memory note plus handoff target explaining who owns stale AfroStream news.
- Validation after update:

```powershell
npm run audit:schedules
Select-String -Path 'C:\Users\Oza\.codex\automations\skill-progression-map\memory.md' -Pattern 'AfroStream Newswire|stale'
```

### P2 - New car refresh automation is absent from the automation registry

- Automation id: `afrotools-car-market-data-refresh`
- Evidence:
  - Local automation definition exists at `C:\Users\Oza\.codex\automations\afrotools-car-market-data-refresh\automation.toml`.
  - `data/automation/automation-registry.json:3` was generated on `2026-05-19T07:43:18.087Z`.
  - Local-vs-registry inventory found `afrotools-car-market-data-refresh` in `LOCAL_NOT_IN_REGISTRY`.
  - `npm run audit:schedules` still passed because missing non-production Codex records are not treated as fatal by the audit script.
- Why it matters: the registry is the durable product/schedule map. A local job outside the registry can miss SLA, owner, validation-command, and public-claim review.
- Smallest safe change: regenerate or add a registry record for `codex:afrotools-car-market-data-refresh` with product surface `cars`, validation command `npm run cars:catalog:refresh`, and owner category `Car market data refresh`.
- Validation after update:

```powershell
npm run audit:schedules
Select-String -Path data/automation/automation-registry.json -Pattern 'afrotools-car-market-data-refresh'
```

### P2 - Daily image queue has repeated no-summary archive entries

- Automation id: `daily-blog-image-queue`
- Evidence:
  - Recent run report shows 10 completed runs for this automation.
  - Several entries in `reports/automation-run-report-2026-05-20-to-2026-06-04.md` say `task_complete captured; no agent summary in archive`.
  - Its latest memory at `C:\Users\Oza\.codex\automations\daily-blog-image-queue\memory.md:5-10` has useful coverage details, so the issue is archive/inbox signal, not total absence of memory.
- Why it matters: this job is a queue producer. A completed run without an archive summary makes it harder to scan whether assets are needed.
- Smallest safe change: tighten the prompt with a required final shape:

```text
Always end with a compact queue status: static_blog_needed=N, afrostream_news_needed=N, creator_avatar_needed=N, output_file=<path or none>, checked_since=<timestamp>.
```

- Validation after update: inspect the next run archive and memory for that status line.

### P2 - Business Planner remains classified incomplete after recovery

- Automation id: `business-planner-followup-automation`
- Evidence:
  - `npm run audit:schedules` warns that the latest report includes non-completed status `incomplete`.
  - `C:\Users\Oza\.codex\automations\business-planner-followup-automation\memory.md:16-20` says recovery validation passed on 2026-06-04, but the 2026-05-20 archive still lacks a `task_complete` event.
- Why it matters: this appears to be runner/archive completion evidence, not a Business Planner product defect. Repatching the route would be noise.
- Smallest safe change: leave the automation active and add one prompt suffix only if the next scheduled worktree run also lacks `task_complete`:

```text
Before final response, write an explicit completion summary with changed files, validation, and next action so the run archive captures task_complete.
```

- Validation after update:

```powershell
npm run audit:schedules
Select-String -Path reports/automation-run-report-*.md -Pattern 'business-planner-followup-automation'
```

### P2 - Live/repo separation wording is implicit in many product prompts

- Automation scope: product automations that mention Supabase.
- Evidence:
  - Prompt inventory found all Supabase-mentioning prompts include MCP-first wording.
  - Many prompts still ask for live state, repo patches, and validation in one paragraph without requiring separate report sections.
  - `AGENTS.md` requires keeping repo edits and live project actions separate in notes and summaries.
- Why it matters: the observed memories are mostly disciplined, but explicit separation wording prevents future agents from mixing live truth, live writes, and repo patches in one unreviewable result.
- Smallest safe change: add a common sentence to Supabase-capable product prompts:

```text
In the final report, separate Live Supabase inspection, Live writes, Repo edits, and Validation. If Supabase MCP is unavailable, record the exact failure before using any permitted fallback path.
```

- Validation after update:

```powershell
Select-String -Path 'C:\Users\Oza\.codex\automations\*\automation.toml' -Pattern 'Live Supabase inspection|Live writes|Repo edits|Validation'
```

### P3 - Local execution exceptions should be documented

- Automation ids: `automation-system-maintainer`, `supabase-project-advisor-watch`, `afrostream-tracking-health`
- Evidence:
  - Local execution is used by three cron definitions.
  - `docs/codex-playbook.md:184` says recurring repo jobs should prefer worktree execution.
  - `automation-system-maintainer` needs local access to the Codex automation store, and `supabase-project-advisor-watch` performs live project inspection without repo patching by design.
  - `afrostream-tracking-health` is local and its prompt permits narrow repo patching.
- Why it matters: two local jobs have defensible reasons; one can patch repo files from the main checkout.
- Smallest safe change:
  - Keep `automation-system-maintainer` local.
  - Keep `supabase-project-advisor-watch` local only if it remains read-only and no-repo-edit.
  - Change `afrostream-tracking-health` to `worktree`, or add: `If running local, do not patch repo files; report the patch target instead.`
- Validation after update:

```powershell
Select-String -Path 'C:\Users\Oza\.codex\automations\*\automation.toml' -Pattern '^execution_environment = "local"'
```

## Proposed Update Queue

Do not apply these automatically without approval.

1. `afrotools-car-market-data-refresh`: change to `model = "gpt-5.5"` and `reasoning_effort = "high"`, then add it to the registry.
2. `am-content-batch-2` and `pm-content-batch-2`: decide paused-vs-resumed policy; if resumed, split duplicate prompt scope.
3. `afrostream-newswire-agent`: decide whether to unpause for bounded stale-news repair or keep paused with an explicit owner handoff.
4. `daily-blog-image-queue`: add a final compact queue status requirement to reduce no-summary archive entries.
5. Supabase-capable product prompts: add standardized final-report sectioning for live inspection, live writes, repo edits, and validation.
6. `afrostream-tracking-health`: move to worktree execution or forbid repo patching during local execution.

## Validation Commands Used

```powershell
git status --short
npm run audit:schedules
Get-ChildItem -LiteralPath 'C:\Users\Oza\.codex\automations' -Directory
Select-String -Path 'C:\Users\Oza\.codex\automations\*\automation.toml' -Pattern '^status = "PAUSED"|^model = "gpt-5"|^reasoning_effort = "medium"|^execution_environment = "local"'
Select-String -Path 'C:\Users\Oza\.codex\automations\*\memory.md' -Pattern 'failed|failure|blocked|timeout|Supabase MCP|MCP|stale|dirty|Playwright|missing|read-only|fallback'
Select-String -Path reports/automation-run-report-2026-05-20-to-2026-06-04.md -Pattern 'business-planner-followup-automation|incomplete|daily-blog-image-queue|afrotools-car-market-data-refresh'
Select-String -Path docs/codex-playbook.md -Pattern 'Keep the active production automation set|recurring repo jobs|worktree'
```

## Not Changed

- No automation definitions were edited.
- No schedules were paused, unpaused, merged, or deleted.
- No live Supabase actions were performed for this maintenance pass.
- Existing dirty checkout change in `netlify/functions/afrostream-health.js` was left untouched.
