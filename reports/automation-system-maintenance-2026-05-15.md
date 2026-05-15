# Automation System Maintenance - 2026-05-15

Run time: 2026-05-15T08:32:36+05:00

Scope: local Codex automation definitions under `C:\Users\Oza\.codex\automations`, automation memories, recent memory evidence, and alignment with `AGENTS.md` plus `docs/codex-playbook.md`.

No automations were deleted, paused, or rewritten in this pass.

## Summary

- Active automations: 59.
- Execution isolation: 57 `worktree`, 2 `local`.
- Missing memory files: 3 active automations.
- Exact duplicate prompts: `am-content-batch-2` and `pm-content-batch-2`.
- Current alignment: most product automations are lane-specific and explicitly say to use Supabase MCP first when live data is involved.
- Main operating risk: repeated live-data runs record Supabase MCP discovery/startup failures and fall back to REST/service-role paths, which should be standardized and escalated instead of rediscovered per lane.

## Findings

### P1 - Local recurring job can patch the dirty main checkout

- Automation id: `afrostream-tracking-health`
- Evidence:
  - `C:\Users\Oza\.codex\automations\afrostream-tracking-health\automation.toml:10` sets `execution_environment = "local"`.
  - Its prompt allows patching repo regressions when found.
  - Its memory says the worktree was heavily dirty on a run where no patch was applied because the issue was live drift, not code.
- Why it matters: `docs/codex-playbook.md` says recurring repo jobs should prefer worktree execution. This health automation touches high-risk Netlify function surfaces when it patches, so local execution is too easy to mix with the user's dirty checkout.
- Smallest safe change: change only this definition to `execution_environment = "worktree"`. If local live credentials are required, add a prompt guard: "Do not patch repo files from local execution; report the patch target and smallest fix instead."
- Validation after update: inspect `automation.toml`, then let the next scheduled run report its worktree path and run targeted checks such as `node --check netlify/functions/afrostream-*.js` only if it touches functions.

### P1 - Supabase MCP fallback behavior is inconsistent across live-data lanes

- Automation ids: `afrostream-creator-valuation-agent`, `afrostream-newswire-agent`, `scholarship-source-expansion-agent`, `skill-progression-map`
- Evidence:
  - Recent memories show MCP startup, discovery, or exposure failures followed by REST/service-role fallbacks.
  - `AGENTS.md` and `docs/codex-playbook.md` require Supabase MCP first for live project access and clear separation of repo edits from live actions.
- Why it matters: the prompts mostly say "use Supabase MCP first", but the fallback policy is not uniform. Some lanes permit live writes after fallback, others only report queues. That can make live DB actions harder to audit.
- Smallest safe change: add one shared sentence to every live-write automation prompt: "If Supabase MCP is unavailable, record the exact failure and use fallback credentials only when this prompt explicitly permits it; keep read-only inspection, live writes, and repo edits in separate report sections."
- Validation after update: run a prompt inventory grep:
  - `Select-String -Path 'C:\Users\Oza\.codex\automations\*\automation.toml' -Pattern 'Supabase MCP|fallback credentials|repo edits'`

### P2 - Three active automations lack memory files

- Automation ids: `automation-system-maintainer`, `automation-self-learning-loop`, `transport-source-freshness-sweep`
- Evidence:
  - No `memory.md` exists in those three automation directories.
  - This run created the maintainer memory after inspection.
- Why it matters: recurring automation instructions require reading and updating memory. Missing memory makes "changes since last run" and duplicate-scope review weaker.
- Smallest safe change: seed `memory.md` for `automation-self-learning-loop` and `transport-source-freshness-sweep` on their next run with a short "first observed baseline" note instead of inventing prior state.
- Validation after update:
  - `Get-ChildItem C:\Users\Oza\.codex\automations -Directory | Where-Object { -not (Test-Path (Join-Path $_.FullName 'memory.md')) }`

### P2 - AM and PM content batches are exact duplicate prompts

- Automation ids: `am-content-batch-2`, `pm-content-batch-2`
- Evidence:
  - Prompt SHA-256 prefix for both prompt lines: `0B47A8BAF57E`.
  - Both are active daily content jobs; both can create one static blog post and one AfroStream item.
- Why it matters: the duplicate may be intentional for cadence, but the scopes are not split. Two daily jobs can compete on topic choice, duplicate source research, or create deployment pressure for the 5PM gate.
- Smallest safe change: keep both active but split the prompts:
  - AM: static evergreen blog only unless a verified AfroStream story is already queued.
  - PM: AfroStream news only plus static-blog cleanup, or make PM a second static post only when AM landed cleanly.
- Validation after update:
  - duplicate prompt hash check should return no groups with count greater than 1.

### P2 - `update-agents-md` is active every day with a broad no-op trigger

- Automation id: `update-agents-md`
- Evidence:
  - `automation.toml:7` runs on all seven days.
  - `automation.toml:5` says to update `AGENTS.md` with newly discovered workflows and commands, but the prompt does not require a specific evidence source, last-run diff, or no-op report when nothing changed.
- Why it matters: `AGENTS.md` is repo guidance. Daily broad edits risk churn unless a new workflow actually exists.
- Smallest safe change: reduce to weekly or tighten the prompt: "Only patch when package scripts, docs, or recent completed automation memories show a new durable command; otherwise report no-op."
- Validation after update:
  - `git diff -- AGENTS.md`
  - `npm run check-links` only if guidance changes link or route behavior.

### P2 - Live-data watch is correctly an alarm, but repeated carried issues need a stale-noise rule

- Automation id: `skill-progression-map`
- Evidence:
  - Prompt says it is an alarm and triage layer, not the main upgrade worker.
  - Recent memory repeatedly carries remittance, scholarship, AfroKitchen media, and stale market-data findings, with focused agents named as follow-ups.
- Why it matters: daily alarm jobs are useful, but repeated unchanged carried issues can crowd the inbox and blur fresh regressions.
- Smallest safe change: add a carried-risk rule: "If the same stale lane appears unchanged for three runs, summarize it under carried risk and only escalate again when severity, public endpoint behavior, or affected counts change."
- Validation after update:
  - next memory should separate `Fresh regression`, `Recovered`, and `Carried risk`.

### P3 - Transport source sweep is lane-specific but memoryless

- Automation id: `transport-source-freshness-sweep`
- Evidence:
  - Prompt is well bounded to `npm run transport:sources`, `data/transport/source-status.json`, and `reports/transport-source-ledger.md`.
  - No memory file exists yet.
- Why it matters: this lane is exactly the kind of official-source monitor that needs last-run comparison.
- Smallest safe change: on next run, write first baseline counts for changed, blocked, broken, and manual-review sources.
- Validation after update:
  - `npm run transport:sources`
  - `npm run transport:sources:check`
  - `npm run check-links` only if routes, schema, or official-source links changed.

## Proposed Definition Updates

Do not apply these automatically without approval.

1. `afrostream-tracking-health`
   - Change: `execution_environment = "worktree"`
   - Optional prompt suffix: "If this run is not isolated in a worktree, do not patch repo files; report the exact target and smallest safe fix."

2. `automation-system-maintainer`
   - Keep local execution if it must inspect `C:\Users\Oza\.codex\automations`, but add: "Only write the maintainer memory and a report file unless explicitly asked to edit automation definitions."

3. Live Supabase automation prompts
   - Add standard fallback language to live-write lanes: `afrostream-newswire-agent`, `afrostream-creator-valuation-agent`, `afrostream-profile-integrity-agent`, `afrostream-tracking-health`, `live-data-product-upgrade-agent`, `skill-progression-map`, `scholarship-source-expansion-agent`, and any Pro lane that writes live data later.

4. `am-content-batch-2` and `pm-content-batch-2`
   - Split AM/PM responsibilities or merge into one content generator plus the existing 5PM publish gate.

5. `update-agents-md`
   - Tighten to evidence-backed no-op behavior or reduce cadence.

## Validation Commands Used In This Pass

```powershell
Get-ChildItem -LiteralPath 'C:\Users\Oza\.codex\automations' -Directory
rg --files 'C:\Users\Oza\.codex\automations'
Select-String -Path 'C:\Users\Oza\.codex\automations\*\automation.toml' -Pattern '^rrule\s*='
Select-String -Path 'C:\Users\Oza\.codex\automations\*\automation.toml' -Pattern '^execution_environment\s*='
Select-String -Path 'C:\Users\Oza\.codex\automations\*\memory.md' -Pattern 'failed|failure|blocked|timeout|MCP|Supabase|stale|risk'
Get-Content -LiteralPath 'C:\Users\Oza\Documents\afrotools\docs\codex-playbook.md' -Raw
Get-Content -LiteralPath 'C:\Users\Oza\Documents\afrotools\AGENTS.md' -Raw
```

## Follow-Up Queue

1. Approve or reject the `afrostream-tracking-health` move to worktree execution.
2. Decide whether AM/PM content should be split by surface or merged.
3. Seed missing memories for `automation-self-learning-loop` and `transport-source-freshness-sweep` on next run.
4. Standardize Supabase fallback language before more live-write automations are added.
