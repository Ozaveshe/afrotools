# UX release review — 16 September 2026

Integration base: origin/main at 9a792f300b07352a878e1503f66123e6942666b2. The five analytics/consistency repair commits were applied cleanly in a separate release worktree. Existing investigation work and prior audit outputs remain preserved.

## Reviewed fingerprint changes

- Uganda page: the calculate function delegates rendering to renderPeriodResult; monthly/annual display labels, keyboard controls, export feedback and responsive styling changed. Tax calculation engines, rates, source dates and numerical oracle expectations remain unchanged. The protected page digest was updated through build-calculation-quality.js with the scoped review record data/calculation-quality/reviews/uganda-ux-release-2026-09-16.json.
- The Swahili parity historical contract remains unchanged. Its current-source review overlay now records the Uganda English controller change, exact historical/current hashes, reviewed commit and this evidence file. Tests still compare exact hashes and all original numeric expectations.
- Naira-to-words and Ghana amount-to-words: optional details disclosure and generated reference-block placement changed. Ghana text casing now follows the selected style. Amount parsing and word conversion engines are unchanged. The market-days page changed presentation and reference-block placement; date arithmetic is unchanged. All three complete normalized HTML fingerprints were recaptured after reviewing these changes; semantic fixture values and dependency hashes were preserved.

## Validation so far

- Full build:deploy passed; 18,100 publish files, 1,800 optimized JS and 623 CSS assets.
- audit:dist, security:scan, lint and type-check passed.
- Focused contact, shared reverse-calculation, Uganda engine/interaction and Lobola tests passed.
- French uniquely African oracles passed: 20 extracted contracts and 14 native fixtures.
- Calculation-quality tests passed after the scoped review.
- Optimized-artifact browser: Uganda monthly net 1,073,000 and annual net 12,876,000 for monthly gross 1,500,000; annual selection survives recalculation. Ghana 12,500.75 converts to the expected cedis/pesewas wording. Empty contact submission focuses required name; success stays hidden. No captured console errors in those checks.
- Netlify MCP confirmed the intended AfroTools site and registered contact form. No real message was sent.

Full-suite and production evidence will be recorded when complete. This record does not claim deployment or inbox delivery.

## Release gate results

- build:checks passed, including calculation quality and generated route/localization contracts.
- Full npm test exercised 1,079 test files and all seven audits. The initial run reported three failures: calculation-quality, French uniquely-African source fingerprints, and Swahili PAYE English controller fingerprint. Each was reviewed as documented above, corrected without changing numerical expectations, and rerun together with node --test: 3 passed, 0 failed. All other tests and all seven audits passed. A clean aggregate CI run remains the final confirmation.
- Final rebuilt artifact passed audit:dist and security:scan again.
- Optimized reverse-calculation browser check: repeated clicks preserve desired monthly net 1,500,000 and required monthly gross 2,156,922.
- The release tree was clean after committing expected generated assets and reviewed contracts. Unrelated Hausa audit report churn was removed from this batch.

## Integration and release coordination

- Integrated origin/main 7e422c194f6ef126fef13d3d1eec2666c1de216c, preserving the current language/document and JAMB mobile changes. Only generated public-claims reports conflicted; regenerated them with their owning build script. The resulting UX diff against that main passes git diff --check and contains no deletions.
- After integration, six focused suites passed: calculation quality, French native oracles, Swahili PAYE parity, contact feedback, repeated reverse calculation, and Uganda period/export interactions. Public-claims audit and regeneration passed with zero errors.
- The Education Hub publisher holds lease recent-jamb-20260916-release and requested a frozen release boundary of current main plus its education batch. This UX batch is preserved separately for the next release window; it has not been pushed to main or deployed.
- Next release must integrate the completed publisher release, rebuild the combined artifact, pass release/CI checks, and verify production routes. Earlier artifact validation above applies to the pre-integration artifact; it does not prove the newly combined tree or production.
