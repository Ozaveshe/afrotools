---
name: afrotools-localization-prompt-workflow
description: Build deep, bounded AfroTools localization prompt packs when the user wants a "workflow" with discovery-first, implementation, and validation-review phases for Swahili, French, or Hausa lanes.
argument-hint: "[lane] [countries-or-batch]"
disable-model-invocation: true
user-invocable: false
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# AfroTools Localization Prompt Workflow

Use this when:
- The user asks for the "next course of action" in AfroTools localization.
- The user says to make prompts "deep and complicated", "comprehensive", or suitable for "longer sessions".
- The lane is explicitly Swahili, French, or Hausa and the user wants a reusable coordination prompt rather than immediate broad edits.

Do not use this when:
- The user wants direct code/content edits in the repo right now.
- The task is a small one-file fix that does not need discovery and review gates.

Inputs / context to gather first:
1. Confirm the lane and hard scope boundary from the user wording.
   - Examples: `Sw-only`, `Do not touch French pages`, `Djibouti out of scope`, `salary blocked`.
   - If the user separates workstreams, keep the inactive locale out of the thread entirely.
2. Read the repo guidance and lane-specific docs first.
   - `AGENTS.md`
   - `docs/codex-playbook.md`
   - `docs/known-traps.md`
   - Sw lane: `docs/SWAHILI-LOCALIZATION-STRATEGY.md`
   - Hausa lane: `lang/ha.json`, `assets/js/components/navbar.js`, `assets/js/components/footer.js`, `scripts/validate-hreflang.js`, and `node scripts/build-i18n.js --lang ha --dry-run`
3. Discover actual source-of-truth files and route shapes before writing prompts.
   - Prefer source pages and registry/hub files.
   - If `rg` fails with `Access is denied`, switch immediately to PowerShell-native enumeration or another simple file walk.
   - For next-lane handoffs, inspect the current hub plus candidate English routes and note which ones already have Sw/French alternates so the prompt does not duplicate owned surfaces.
   - For Hausa, enumerate the real `/ha/` tree instead of assuming the lane is blank; the route tree can exist even when `--lang ha --dry-run` still builds `0` pages.
4. Identify whether this batch is discovery-only, implementation, validation-review, or the next candidate batch after a previous review.
5. Check whether the user wants a fixed report schema.
   - Reuse the established numbered handoff format when they ask for output "in the same 1-9 format".

Procedure:
1. Preserve the user's exact operating mode.
   - If they said "workflow", default to a staged prompt chain.
   - If they said "comprehensive prompt" or "longer sessions", make the prompt large enough to occupy a full implementation session while staying bounded.
   - If they clarified separate agents/workstreams for French and Swahili, restate that split near the top of the prompt.
2. Start with discovery when product truth is uncertain.
   - Discovery prompt should forbid edits, registry changes, minification, and broad sweeps.
   - Require a route inventory, registry inventory, hub inventory, exact batch scope, blockers, validation plan, and a final classification.
   - For French audits, tell the executor to verify page truth in this order: app shell, canonical/hreflang shape, English counterpart evidence, then registry/hubs.
   - For Swahili review gates, require separate counts for total routes, indexable routes, registry hrefs, resolving/broken hrefs, spot checks, and carried SEO noise instead of one blended readiness number.
3. Use explicit classification labels in uncertain French work:
   - `SAFE_CANONICALIZE`
   - `SAFE_REGISTRY_REPOINT_ONLY`
   - `BLOCKED_PRODUCT_TRUTH`
   - `MISSING_FRENCH_CANONICAL`
   - `OUT_OF_SCOPE`
   - If the page is only a placeholder shell or still points at a missing bundle such as `tool-page.4701dd1d.min.js`, prefer de-promotion over canonicalization.
4. Only write an implementation prompt after discovery output says the surface is safe.
   - Separate VAT from salary/PAYE if product truth diverges.
   - Name exact files, canonical routes, bridge pages, registry rows, hub pages, and English reciprocity expectations.
   - If the user frames the lane as "small enough for a tight batch" or says it should connect to neighboring pillars "without duplicating them", add an explicit "do not duplicate" ownership-boundary section to the prompt.
5. Follow implementation with a validation-review prompt.
   - Require a shippability verdict.
   - Require direct blockers to be separated from stale repo debt or related-but-non-blocking warnings.
6. Require a narrow validation stack in the prompt pack.
   - Common stack: `npm run check-links`, `npm run audit`, `npm run build:i18n:validate`, `npm run validate:hreflang`, `npm run seo:report`
   - Tell the executor to separate baseline debt from net-new issues.
7. Preserve repo-specific route spellings in the prompt.
   - Examples seen in this repo: `cote-d-ivoire`, `cape-verde`, `congo`, `sao-tome`
8. For Sw health/family/care-cost work, pick the stronger English source page before writing the prompt.
   - Prefer `health/*` pages over duplicate `tools/*` routes when the health page is the real source of truth.
   - Keep medical pages informational only with estimate/disclaimer language; avoid diagnostic or treatment promises.
9. For Hausa startup batches, treat shell and route creation as the first-class task if the current `--lang ha --dry-run` still builds `0` pages.
   - Start with shared shell, the existing `/ha/` hubs, and Nigeria-first route families before deeper category expansion.
   - Audit runtime Hausa route literals in `navbar.js` and `footer.js` directly; `check-links` and `validate:hreflang` can stay green while shared JS still points at missing `/ha/...` paths.
10. Keep the output format strict.
   - Ask for changed files.
   - Ask for validation results.
   - Ask for baseline-vs-net-new issues.
   - Ask for final verdict and what is still blocked.
   - If the user already approved a numbered handoff/report layout, preserve that numbering instead of inventing a new format.

Efficiency plan:
- Reuse the same prompt skeleton across batches; only swap lane, country set, blocked items, and validation focus.
- Gather the file list once from real routes and hubs, then reuse it in the staged prompts.
- Do not spend time on registry-wide exploration if the user said to keep the lane narrow.
- Stop early and stay discovery-only if product truth is still conflicted.

Pitfalls and fixes:
- Symptom: prompt drifts into a vague plan.
  - Likely cause: not enough exact files, constraints, or output requirements.
  - Fix: add concrete file scope, exclusions, required commands, and exact report sections.
- Symptom: review comes back noisy and unusable.
  - Likely cause: repo-wide warnings are mixed with touched-file defects.
  - Fix: require baseline-vs-net-new separation and a direct blocker vs non-blocking debt split.
- Symptom: route names are wrong.
  - Likely cause: guessed slug normalization.
  - Fix: inspect actual repo paths and state the route mapping explicitly in the prompt.
- Symptom: Hausa looks like a blank lane because `--lang ha --dry-run` built `0` pages.
  - Likely cause: the dry-run is being treated as the only source of truth.
  - Fix: enumerate the real `/ha/` tree, compare it to `navbar.js` / `footer.js`, and treat the lane as shared-shell plus copy cleanup when the pages already exist.
- Symptom: the implementation prompt duplicates adjacent surfaces that already belong to another lane.
  - Likely cause: existing alternates and ownership boundaries were not inventoried first.
  - Fix: check the current hub plus candidate routes, mark pre-existing alternates, and add an explicit excluded-surfaces list to the prompt.
- Symptom: the lane broadens into unrelated languages or products.
  - Likely cause: prompt did not restate the user's out-of-scope rules.
  - Fix: put the scope boundary near the top of every prompt.
- Symptom: the prompt starts mixing French and Swahili context.
  - Likely cause: the thread reused earlier localization context without honoring the current workstream split.
  - Fix: restate the active lane and explicitly ban the inactive lane in the prompt header.

Verification checklist:
- The prompt explicitly names the lane and out-of-scope areas.
- The prompt says whether it is discovery-only, implementation, or validation-review.
- The prompt includes exact files/routes/hubs to inspect or edit.
- The prompt includes validation commands and required report format.
- The prompt tells the executor to separate baseline debt from net-new issues.
- The prompt preserves blocked-vs-safe distinctions instead of forcing a mixed batch.
- The prompt preserves any user-required numbered handoff schema and does not mix active and inactive localization lanes once the workstreams are split.

Minimal usage example:
- User asks for the next French batch after a discovery run.
- Build:
  1. a discovery-only prompt if product truth is still uncertain, or
  2. a VAT-only implementation prompt if salary is blocked but VAT is safe, then
  3. a validation-review prompt that ends with a shippability verdict.
