---
name: afrotools-closeout-proof-pass
description: Run an AfroTools "close out" or "repo debug check" as a proof-backed release/readiness sweep with the right repo docs, validator stack, dirty-tree framing, and durable doc updates.
argument-hint: "[scope-or-lane]"
disable-model-invocation: true
user-invocable: false
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# AfroTools Closeout Proof Pass

Use this when:
- The user asks for a "close out phase", "repo debug check", release/readiness proof, or a final green pass for AfroTools free tools.
- The checkout is dirty and the job is to prove the real release surface instead of guessing from `git status`.
- The deliverable needs durable proof in docs, not only terminal output.

Do not use this when:
- The task is a narrow one-file bugfix with no close-out/release framing.
- The user explicitly wants package isolation only; use the packaging memory first if the task is just separating a shippable diff from generated churn.

Inputs / context to gather first:
1. Confirm the checkout and current task framing from the user wording.
   - Pay attention to phrases like "close out", "repo debug check", "all free tools", or "smallest safe fix".
2. Read the repo guidance before choosing commands.
   - `AGENTS.md`
   - `docs/release-checklist.md`
   - `docs/known-traps.md`
   - `docs/CLOSE-OUT-2026-05.md`
   - `docs/FINAL-BUILD-2026-05.md`
   - `docs/PRO-APP-READINESS.md`
   - `docs/PRO-FENCE.md`
3. Inspect repo state without assuming clean tree means success or failure.
   - Check branch.
   - Check `git status --short`.
   - If the tree is very dirty, quickly determine whether that looks like broad generated churn or a narrow source patch.
4. Identify the lane.
   - Broad free-tools/release sweep.
   - Hreflang/i18n close-out.
   - Narrow config/release-surface proof.

Procedure:
1. Choose the proof stack from the lane, not from guesswork.
   - Broad free-tools close-out stack:
     - `npm run audit`
     - `npm run check-links`
     - `npm run seo:report`
     - `npm run build:i18n:validate`
     - `npm run validate:hreflang`
     - `npm run pdf:verify`
     - `npm run salary-tax:verify`
     - `npm run vat-business-tax:verify`
     - `npm run legal-workflow:verify`
     - `npm run category-workflow:verify`
     - `npm test`
     - `npm run pro:verify`
     - `npm run security:scan`
     - `npm run build:deploy`
     - `npm run audit:dist`
     - `git diff --check`
   - Hreflang close-out stack:
     - `npm run build:i18n:full`
     - `npm run validate:hreflang`
     - `npm run check-links`
     - `npm run seo:report`
     - `npm test`
     - `npm run pro:verify`
     - `npm run security:scan`
     - `npm run build:deploy`
     - `npm run audit:dist`
     - `git diff --check`
   - Narrow config/release-surface stack:
     - run syntax on touched files
     - run the lane-specific smoke or existence checks
     - `git diff --check`
     - `npm run security:scan`
     - `npm run audit:dist`
2. Treat dirty-tree output as evidence to classify, not as a release verdict.
   - If `git status` is huge, check whether the churn is generated HTML, redirects, sitemaps, docs, or other expected build artifacts.
   - Do not claim the repo is broken only because the tree is large.
3. Run the chosen validators with enough timeout budget.
   - Broad repo commands can be expensive.
   - A timeout means "increase budget and rerun" before you treat it as a repo defect.
4. Separate proof outcomes from edits.
   - If validators are green, do not invent speculative code fixes.
   - If validators fail, patch only the real failing lane and rerun the relevant proof.
5. Update durable close-out docs when the pass is green.
   - Keep notes factual and command-backed.
   - Prefer exact counts and exact commands over "everything passed".
6. End with a concrete handoff.
   - What stack ran.
   - What stayed green.
   - Whether dirty-tree churn was expected generated output or real source risk.
   - Which docs were updated.

Efficiency plan:
- Read the repo docs once, then reuse the same proof stack unless the task lane changes.
- On dirty trees, use quick diff-stat sampling to classify churn before deeper inspection.
- Prefer the narrow config proof set when the user asks for a smallest-safe or release-surface review.
- Stop broad exploration once the chosen proof stack answers the release question.

Pitfalls and fixes:
- Symptom: a close-out request turns into speculative bug fixing.
  - Likely cause: the proof surface was not chosen first.
  - Fix: read the release docs/skill and run the lane-specific validators before editing.
- Symptom: a broad dirty tree is treated as automatic failure.
  - Likely cause: generated build churn is being conflated with source regression.
  - Fix: classify churn and trust validator output unless the proof stack finds a concrete failure.
- Symptom: the close-out result is only in terminal history.
  - Likely cause: proof docs were treated as optional.
  - Fix: update the durable close-out docs with the exact commands and counts.
- Symptom: long-running QA commands look broken because they time out.
  - Likely cause: timeout budget is too short for repo-wide validators.
  - Fix: rerun with a larger timeout before escalating.

Verification checklist:
- The repo guidance was read before the proof stack was chosen.
- The lane was identified correctly: broad free-tools, hreflang close-out, or narrow release-surface.
- Dirty-tree churn was classified instead of hand-waved.
- The validator stack ran to completion or was rerun with enough timeout budget.
- `git diff --check` was included in the final proof set when edits or generated outputs were touched.
- If the pass was green, the durable close-out docs were updated with exact commands and counts.

Minimal usage example:
- User asks: "do a repo debug check and close out phase for all free tools"
- Do:
  1. read the close-out docs and release checklist
  2. classify current dirty-tree state
  3. run the broad free-tools proof stack
  4. update the close-out docs with exact passing counts
  5. report the green proof and any expected generated churn
