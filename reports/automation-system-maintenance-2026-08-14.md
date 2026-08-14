# Automation System Maintenance - 2026-08-14

Generated: 2026-08-14T08:10:14+05:00

Machine-readable run truth: `reports/automation-run-report-2026-08-12-to-2026-08-14.json`.

## Outcome

- Schedule/registry structure is valid: 117 registry records, 34 Netlify scheduled functions, 79 Codex definitions, and no missing production runner schedules.
- The useful-window report now handles very large archived JSONL files without reading every archive into one string. It also classifies `task_complete` events carrying an error as `failed`, not `completed`.
- Current window: 39 runs, with 30 completed, 4 incomplete, 5 failed, and 0 interrupted. Forty-three active definitions have no structured archive evidence in the window. All 74 active definitions have memory files.
- Live scheduler proof is blocked. Three `npm run automation:live-health` attempts returned HTTP 522 reading `scraper_runs`; a read-only query against the verified AfroTools MCP project `zpclagtgczsygrgztlts` independently timed out. No fresh live-health JSON was written. The checked-in latest report was generated on 2026-07-15 and must not be treated as current proof.

## Definition Governance

- Active cron definitions: 74. Paused definitions: 5. No jobs were paused or deleted.
- All 74 active crons use the explicit model `gpt-5.6-sol`.
- Every producer contains the universal handoff, tracked-goal, and bounded-retry contracts. The publisher is the sole marker exception.
- The publisher is active at 17:30 (`daily-5pm-publish-deploy-gate`, display name `Daily 5:30PM Automation Publisher`). No `publisher-lock.json` exists, so there is no stale lease.
- Reasoning drift remains in the persisted definitions: 72 are still `medium`, one is `max`, and one is `ultra`. The automation manager safely persisted `afrostream-tracking-health=max` and `supabase-project-advisor-watch=ultra`. It required user-reviewed suggested updates for the remaining 72 worktree automations because they may execute a local environment setup script. Suggestions were submitted for 57 `max` and 15 `ultra` changes; raw TOML was not bypassed.

## Handoff Queue

- Scanner result: 1 ready, 5 informational (2 no-change and 3 consumed), 7 blocked, 12 quarantined, 0 invalid, 0 conflicts, 0 duplicate IDs, and 0 dependency issues.
- Ready: `africa-election-tracker-freshness-watch-2026-08-14-019ffe13`, created 2026-08-14T02:37:43Z. Remote branch reachability was proved at exact commit `7ab24c6418e5c0d23b5a4250c9a7dd295f3e586a`.
- All consumed receipts contain a consumed timestamp, release commit, deploy ID, and live-proof list.
- All blocked and quarantined receipts contain a smallest-next-action blocker.
- Repeated quarantine patterns: six receipts misuse `dependencies` for prose or integration instructions; five fail regenerated/broad-suite ownership contracts; one AM content receipt landed source/feed output but omitted its English blog-hub card. PM and localized content remain quarantined, not ready-for-later.
- Three completed producer runs lack a receipt: `faith-community-automation`, `hr-onboarding-automation`, and `japa-visa-cost-automation`. All ran before the universal handoff rollout later on 2026-08-12, so they are historical migration gaps rather than post-contract breaches.

## Run And Worktree Classification

- Failed latest runs: `africa-election-tracker-freshness-watch`, `africa-election-candidate-evidence-review`, `skill-progression-map`, `minimum-wage-source-automation`, and `overtime-law-automation`. The report now preserves their error state; three were usage-limit failures that previously looked completed.
- Incomplete latest runs: `afrostream-newswire-agent`, `property-management-fee-automation`, `live-data-product-upgrade-agent`, and `digital-lending-rates-automation`.
- Worktree inventory: 164 total, 27 detached, 1 prunable, 1 locked, and 6 carrying `automation/*` branches. No worktree was removed or pruned.
- There are 53 local `automation/*` branches not merged into current `origin/main`. The active automation worktrees checked for the ready election handoff, legacy Newswire release, legacy publisher, handoff-system rollout, and Scholarship recovery are clean. Branch age alone is not deletion authority.

## Validation

- `node -c scripts/generate-automation-run-report.js` - pass.
- `npm run automation:report -- --since=2026-08-12 --until=2026-08-14` - pass.
- `npm run audit:schedules` - pass.
- `npm run automation:preflight` - pass outside the process sandbox: 11 pass, 3 expected environment warnings, 0 failures.
- `git diff --check` - pass.
- `npm run automation:live-health` - blocked after three HTTP 522 attempts; MCP read-only SQL also timed out.

## Smallest Next Actions

1. Restore AfroTools Supabase project connectivity, then rerun `npm run automation:live-health` and use its new JSON as live scheduler truth.
2. Review/accept the 72 pending reasoning-policy automation updates; do not disable the local environment setup path merely to force unattended mutation.
3. Let the 17:30 publisher consume the independently valid election handoff even if blocked or quarantined lanes remain.
4. Reissue the six dependency-prose receipts with handoff IDs only, and repair the five isolated generated/broad-suite ownership failures independently.
