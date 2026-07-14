---
name: afrotools-main-branch-shipping
description: Handle AfroTools requests like "commit all" or "commit and push all" on main with dirty-worktree inventory, rescue-branch boundaries, cached-diff checks, and generated-output drift recovery.
argument-hint: "[commit-or-push]"
disable-model-invocation: true
user-invocable: false
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# AfroTools Main-Branch Shipping

Use this when:
- The user asks to "commit all", "commit and push all", or otherwise ship the intended AfroTools tree on `main`.
- The checkout is dirty, there are multiple worktrees, or rescue branches exist and ship scope needs to be separated carefully.
- Generated outputs, sitemap churn, or CI "generated files are out of date" failures are part of the shipping lane.

Do not use this when:
- The task is only a narrow code patch with no request to commit or push.
- The user wants packaging/reviewability only and does not want a full `main` ship pass.
- The repo is not AfroTools.

Inputs / context to gather first:
1. Confirm the shipping intent from the user wording.
   - Distinguish "commit all" from "commit and push all".
   - Look for explicit mentions of worktrees, automations, or rescue branches.
2. Read the repo guidance before staging.
   - `AGENTS.md`
   - `docs/codex-playbook.md`
   - `docs/known-traps.md`
   - `package.json`
3. Inspect branch and tree state.
   - `git status --short --branch`
   - `git worktree list --porcelain`
4. Identify whether `main` is behind origin before you commit or push.
   - Fetch if needed.
   - Be ready to rebase and regenerate generated outputs.

Procedure:
1. Inventory ship scope before touching staging.
   - Use `git worktree list --porcelain` to separate dirty detached worktrees from `codex/rescue-*` branches.
   - If the user explicitly asked to include worktree batches, checkpoint the dirty non-rescue worktrees first.
   - Keep rescue branches out unless the user explicitly asks for salvage work.
2. Stage the intended repo changes on `main`.
   - Default to all intended unignored changes when the user says "commit all".
   - Keep local/offline junk and scratch logs out of the ship commit.
3. Run the pre-commit gate.
   - `git diff --cached --check`
   - Fix `trailing whitespace` and `new blank line at EOF` noise before committing.
4. If `main` is behind, rebase carefully.
   - If conflicts are only in generated sitemap XML, run `npm run sitemap` and continue the rebase instead of hand-editing XML hunks.
5. Commit with a clear boundary.
   - Keep generated/localization/audit/source-of-truth outputs together only when they are the intended ship set.
6. If the user asked to push, continue through CI-safe proof.
   - Run `npm run build:deploy` when generated outputs are in play.
   - Push and watch the generated-output gate plus the Git-linked Netlify deploy.
   - The normal production result must carry the pushed `main` commit SHA. Do
     not follow a healthy Git deploy with a second CLI production upload.
7. Recover from generated-output CI drift if needed.
   - If CI says `Generated files are out of date. Run 'npm run build:deploy' and commit source outputs.`, rerun `npm run build:deploy`, inspect the remaining diff, and commit the regenerated outputs.
   - If only `sitemap-index.xml` and `sitemap.xml` still drift, rerun `node scripts/generate-sitemaps.js` and commit just those two files.
8. Close only when repo and CI agree.
   - Verify `git status --short --branch --ahead-behind` is clean.
   - Verify the GitHub Actions `Verify generated outputs are committed` gate passed.
   - Verify Netlify published the exact `main` commit. If a manual recovery was
     explicitly authorized, label its CLI source separately because it has no
     reliable Git `commit_ref`.

Efficiency plan:
- Use `git worktree list --porcelain` once up front to classify worktrees instead of exploring branches one by one.
- Let `git diff --cached --check` and the CI job diff tell you where the real problems are before broad manual inspection.
- Treat generated-output failures as synchronization work first; do not start content debugging unless the diff points there.
- Stop once `main...origin/main` is clean and the generated-output gate is green.

Pitfalls and fixes:
- Symptom: rescue branches or scratch logs get mixed into the ship pass.
  - Likely cause: worktree scope was not inventoried first.
  - Fix: separate `codex/rescue-*` and scratch checkouts before staging `main`.
- Symptom: rebase conflicts on sitemap XML consume time.
  - Likely cause: generated files are being merged by hand.
  - Fix: regenerate with `npm run sitemap` and continue the rebase.
- Symptom: local commit succeeds but CI fails on generated files.
  - Likely cause: `build:deploy` outputs were not fully refreshed or committed.
  - Fix: rerun `npm run build:deploy`, inspect the exact diff, and commit the generated outputs.
- Symptom: CI still fails after `build:deploy` and only the sitemap index drifts.
  - Likely cause: `seo-daily-fix` updated sub-sitemap `lastmod` values after the earlier index build.
  - Fix: rerun `node scripts/generate-sitemaps.js` and commit the tiny sitemap follow-up.

Verification checklist:
- `git worktree list --porcelain` was used to classify dirty worktrees and skip rescue branches unless requested.
- `git diff --cached --check` passed before each commit.
- Any rebase conflicts in generated sitemap files were resolved by regeneration, not hand edits.
- If the user asked to push, `npm run build:deploy` was used when generated outputs mattered.
- Any generated-output CI drift was repaired from the exact diff.
- Final state is clean locally and the generated-output CI gate passed.

Minimal usage example:
- User asks: "commit all, we have so many pending files"
- Do:
  1. inspect `git status --short --branch`
  2. inspect `git worktree list --porcelain`
  3. stage intended non-junk changes
  4. run `git diff --cached --check`
  5. commit on `main`
  6. if they also asked to push, run `npm run build:deploy`, push, and repair any generated-output drift until CI passes
