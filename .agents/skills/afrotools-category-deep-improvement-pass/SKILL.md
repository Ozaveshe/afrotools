---
name: afrotools-category-deep-improvement-pass
description: Run a category-wide AfroTools improvement pass when the user wants a "thorough systematic review" of a section like Energy, Legal, or Trade, with tool-by-tool upgrades, shared helpers, and browser-verified fixes.
argument-hint: "[section-or-category]"
disable-model-invocation: true
user-invocable: false
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# AfroTools Category Deep Improvement Pass

Use this when:
- The user asks for a thorough review/improvement of a whole AfroTools section such as `/energy/`, `/legal/`, or `/trade/`.
- The user says to improve one tool at a time, "go to the next app", or make the apps more useful/creative.
- The work should stay inside one category while still catching adjacent runtime issues surfaced by the sweep.

Do not use this when:
- The task is a narrow one-page copy edit or a single known bug.
- The user wants a prompt pack or review-only verdict instead of direct repo changes.

Inputs / context to gather first:
1. Confirm the target section and hard boundaries from the user wording.
   - Examples: `/energy/` only, not the broader African category; improve the whole legal surface, not just the visible hub.
2. Read repo guidance before editing.
   - `AGENTS.md`
   - `docs/codex-playbook.md`
   - `docs/known-traps.md`
   - `docs/ADDING-A-TOOL.md`
   - `docs/ADDING-A-COUNTRY.md`
3. Map the category from both the public hub and `assets/js/components/tool-registry.js`.
   - For some passes the registry is the fastest truth.
   - For others, especially hub-led sections with dead or missing local routes, the visible category page is the real user-facing scope and may expose more tools than the registry slice.
4. Note whether the tree is already dirty so validation can stay scoped to touched section files.
5. Decide early whether the hub should stay a passive catalog or be rewritten around jobs-to-be-done/workflow lanes.

Procedure:
1. Inventory the section from both sides.
   - Read the public hub page.
   - Read the registry entries for the target category.
   - Compare visible-card count vs registry-backed count.
   - Check whether each hub-linked route actually exists locally before editing.
   - For `/legal/`, treat the final scope as the hub plus registry-tagged legal apps; the visible hub can understate the true legal surface.
2. Identify tool families before editing.
   - Look for distinct workflows inside the category so improvements are not one-size-fits-all.
3. Add a shared enhancement layer only if it reduces repeated hand edits.
   - Prefer a focused shared JS/CSS helper for repeated panels, checklists, source packs, or workflow actions.
   - Good category-scale examples include local handoff layers such as readiness meters, context capture, copyable briefs, or pack-style saved snapshots when those help users move between tools.
4. Still treat each tool/tool family individually.
   - Add tailored use cases, assumptions, checklists, or next-step guidance.
   - Do not stop at generic batch copy polish.
5. If the hub is weak, make it workflow-first.
   - Group tools by user job-to-be-done instead of leaving the landing page as a flat card grid.
   - Reconcile the hub card count with the registry-backed count before wrap-up.
6. Run browser QA across representative tools and the hub.
   - Expect real runtime bugs to surface during the sweep.
   - Fix adjacent bugs in the same pass when they block the upgraded surface.
7. Use structure-aware edits.
   - Some pages do not share the same anchors or wrappers.
   - Insert near stable anchors like related-tools, FAQ, SEO sections, or the footer when needed.
   - If you inject per-page config, keep `<script type="application/json">` blocks as raw JSON with `<` escaped as `\u003c`, not HTML entities.
8. Finish with narrow proof.
   - Run syntax checks on shared helpers.
   - Run the strongest repo validation that fits the touched surface, often `npm test` and/or `npm run audit`.
   - Do a local smoke run for the hub and representative tools.
   - If you use inline-script validation, skip `type="module"` and other non-JS script blocks so JSON-LD or app config is not misclassified as broken JS.

Efficiency plan:
- Use `assets/js/components/tool-registry.js` as the source of truth first; it is faster than scanning the whole repo.
- Reuse one shared helper layer per category when the pass needs repeated workflow UI.
- Browser-smoke representative tools early so hidden runtime bugs show up before the final sweep.
- Ignore broad dirty-tree noise and keep the proof focused on category files plus shared assets you touched.
- If repo-wide checks timeout, retry with a longer timeout before treating that as a product failure.

Pitfalls and fixes:
- Symptom: the hub shows fewer tools than the category actually has.
  - Likely cause: the visible hub is lagging the registry.
  - Fix: reconcile the public hub with `tool-registry.js` before planning the pass.
- Symptom: the registry slice looks small, but the category page links many more tools.
  - Likely cause: the user-facing hub is ahead of the registry slice or many local routes are still missing.
  - Fix: treat the hub as the scope source, audit route existence on disk, then use the registry for cleanup/alignment after the route work.
- Symptom: the pass feels generic even after many edits.
  - Likely cause: improvements were written as one batch instead of per tool family.
  - Fix: group the category into tool families and add tailored workflow aids.
- Symptom: browser QA fails after apparently safe content changes.
  - Likely cause: latent runtime bugs were already present in category pages.
  - Fix: treat the sweep as both verification and bug discovery; fix blocking runtime issues before wrapping up.
- Symptom: insertion lands below the footer or breaks page structure.
  - Likely cause: the page lacks the expected wrapper or anchor.
  - Fix: target stable anchors already on the page instead of assuming every page has the same layout.
- Symptom: a category-wide config/helper patch looks correct in source but fails in browser smoke.
  - Likely cause: DOM helpers assume one page shape, or JSON config was HTML-escaped inside `application/json`.
  - Fix: accept selector-or-element inputs in helpers and emit raw JSON with `\u003c` escaping.
- Symptom: inline validation reports broken JS after a legal/content-heavy section pass.
  - Likely cause: `type="module"` or non-JS script blocks were fed into classic syntax checks.
  - Fix: validate executable classic scripts only, and repair leaked print/download HTML before rerunning.
- Symptom: `rg` fails with `Access is denied`.
  - Likely cause: this Windows setup blocks ripgrep sometimes.
  - Fix: switch immediately to PowerShell-native search or a simple Node file walk.

Verification checklist:
- The registry count and hub count are both known and reconciled.
- The pass stays inside the requested category/section boundary.
- Shared helper assets, if added, pass syntax checks and are wired into the intended pages only.
- Representative tools and the hub were smoke tested in the browser.
- Final validation clearly separates touched-surface proof from unrelated dirty-tree churn.
