# Burkina Faso review guardrail: generator compatibility

Date: 26 September 2026. Base: `53e1482b`. Fetch verified origin/main `c5f1c08269bcb1f9814b55e8170155e017bdb784` before creating the isolated branch `codex/bf-payroll-generator-compat-20260926` from the requested followup base.

## Confirmed failure and correction

The completed followup build retained the unavailable-payroll behavior, but strict generator checks failed. Comparing the BF owner against the coordinator's actual built EN/FR/SW pages found duplicate reason/scope paragraphs reconstructed by the owner after the content normalizer removed them. French navigation also changed `/contact/` to `/fr/contact/`. Separately, the Swahili snippet owner expected its generic payroll title instead of the review-required title.

- `scripts/build-bf-payroll-review.js`: keep the full reason in the hero and full scope beside the inputs, each once. The review panel retains the saved-draft explanation, recovery guidance and live status. Generate the native French contact link directly.
- Give search and social metadata concise, truthful unavailable/review-required copy. EN/FR/SW titles are 50/54/53 characters; descriptions are 137/145/136. Full native explanations remain visible. SW uses the existing country registry spelling, Bukinafaso.
- `scripts/repair-swahili-search-snippets.js`: reuse the BF owner's metadata for this payroll route, including descriptions. Other country/family metadata contracts are unchanged.
- Regenerate only the three BF routes. Runtime, legacy controller bodies, formulas, rates, source registry and historical review date (1 July 2025) are unchanged.
- Strengthen static checks for exact owner and downstream-normalizer compatibility; strengthen all nine browser cases to require each native safety paragraph to appear exactly once and visibly.

No duplicate-normalizer bypass, metadata comparison relaxation, financial check removal or freshness reset was introduced.

## Verification

PASS:

- `node scripts/build-bf-payroll-review.js --write`, then `--check`: three regenerated; zero drift.
- `node tests/bf-payroll-review.test.js`: all three static gates, exact idempotence, native paragraph uniqueness, metadata length/social contracts, actual duplicate-content normalizer, French navigation and Swahili snippet owner compatibility.
- `node scripts/repair-swahili-search-snippets.js --check`: 134 checked, zero stale.
- `node tests/swahili-search-snippet-repair.test.js`: all employment titles and 18 descriptions.
- `node scripts/repair-french-search-snippets.js --check`: 261 checked, zero stale.
- Canonical existing Playwright CLI, `tests/e2e/bf-payroll-review.spec.js`, isolated port 4268: **9 passed**. EN/FR/SW normal, JavaScript disabled and runtime blocked; real `afrotools-saved-bf-paye` synthetic records preserved byte-for-byte, historical summaries suppressed, no payroll output/export/AI path, editable inputs, full native explanation visible. Normal cases also check 320px overflow and browser errors.
- `git diff --check`.

A separate deterministic probe used read-only copies of the coordinator's actual completed-build pages, applied the corrected BF owner once, then the real `dedupeRepeatedParagraphs`, French `repairHtml` and Swahili snippet transforms. All three outputs were byte-for-byte fixed points for both downstream transforms and a second BF-owner pass. Input tags and inactive controller bodies remained byte-for-byte identical to their completed-build inputs. The prior failure diffs and SHA-256 evidence are preserved outside the product tree in `../evidence/before-drift.json` and `../evidence/postbuild-proof.json`; nine browser results/screenshots are in `../evidence/browser/`.

## Scope and integration

No full build, production deploy, main push, live financial records or source-freshness changes. This is deterministic phase proof plus focused source-browser proof, not a newly built deploy artifact. The coordinator's built tree was read only. When integrating onto its generated checkpoint, retain newer cache fingerprints and unrelated generated markup; the three intended page changes are metadata, repeated paragraphs and the French contact URL.

Payroll remains temporarily unavailable in all three languages. Stage 2/3 (shared verified engine, explicit base/category inputs, current amendments/RAMU/rounding evidence) remain pending. This does not mark payroll parity complete.
