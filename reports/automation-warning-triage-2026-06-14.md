# Automation Registry Warning Triage - 2026-06-14

The public-claim cleanup also inspected the two pre-existing automation registry warnings.

## business-planner-followup-automation

- Current warning cause: the latest repo report still contains an `incomplete` status for the archived run window.
- Evidence note: the report includes later recovery-validation text, but it also says the archived run still lacks a `task_complete` event.
- Decision: intentionally deferred. Do not suppress this warning without a real completed run or a regenerated report that contains complete evidence.

## daily-5pm-publish-deploy-gate

- Current warning cause: the registry audit does not find recent completed Codex run evidence in the repo report window it scans.
- Evidence note: local automation memory contains newer operational entries, but the repo report consumed by the audit has not been refreshed to include them.
- Decision: intentionally deferred. The safe fix is to run or regenerate the automation report from real evidence, not to edit the registry by hand.

## Follow-Up

- Re-run `npm run automation:report` or the relevant automation validation workflow when the next real run evidence is available.
- Keep live automation state separate from repo edits in summaries.
