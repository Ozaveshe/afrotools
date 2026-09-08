# French amount-word decimal repair

New product commit: `32714d9229184256169ed8d29f54640fc5caa1b1`.
Branch: `codex/fr-amount-words-20260908`.
Parent: `334fa23d331412223fabec32e253c6d84e327b05`; original money and car-import commits are ancestors already handled by the coordinator. Integrate only this new product commit and the subsequent fixture/evidence commit.
Worktree: `C:\Users\Oza\.codex\worktrees\3466\afrotools`.
Fetched `origin/main`: `9b29eab0408eedd9442c98c2cabf567098da80ab`.

## Problem and changes

Both French pages previously converted `1.005` into `1.00`, while the repaired English owners produced `1.01`. French Ghana interpreted `1,250.75` as `1.25` and allowed rounding beyond the English Ghana maximum. French Naira added a zero-naira prefix to subunit-only English wording, breaking its exact word-result contract.

- Authoritative native owners: `fr/tools/naira-en-lettres/index.html` and `fr/tools/montant-lettres-gh/index.html`. Their inline calculation and export behavior is hand-authored; `scripts/generate-fr-uniquely-african.js` preserves them through `hardenExistingFrench`.
- `assets/js/pages/fr-amount-words-input.js` adds French grammar and localized errors around the existing exact-decimal parser. It accepts unambiguous forms such as `1250.75`, `1,250.75`, `1250,75`, `1 250,75`, NBSP/narrow-NBSP grouping, and explicitly grouped comma-thousands. It rejects ambiguous single commas followed by three or more digits (`1,250`, `1,005`), malformed groups, negatives, blanks and rounding overflow. Use a decimal point for ungrouped precision beyond two decimal places.
- `assets/js/engines/amount-words-input.js` is imported unchanged from app source commit `bd64c6ca`. Git blob identity: `d000ca49b013fd8775408585ae78ed3c813bfd9d`, identical to the coordinator's dependency. No calculation algorithm was duplicated or changed.
- Only the Naira/Ghana contracts in `assets/js/pages/fr-uniquely-african-native-guards.js` opt into this parser. The small dispatch branch leaves other route contracts unchanged. Naira clears French wording as well as its other result fields when invalid.
- Both page owners derive words and figures from exact major/minor units. Invalid copy/download/save paths return without stale payloads. Existing JSON export owner is unchanged; its amount field retains the raw input, while its numeric/word fields reflect the canonical rounded amount.

## Explicit limits

French Naira retains its supported maximum of **999 999 999 999,99 NGN after rounding**, now visible beside the input. English Naira supports **999 999 999 999 999,99 NGN**. For `999999999999.995`, English Naira produces one trillion; French Naira rejects it. No full-range Naira parity or renderer extension is claimed.

French and English Ghana are bounded at **999 999 999 999,99 GHS after rounding**. Both reject `999999999999.995` after carry. French decimal grammar intentionally differs from English grammar; French comma/space fixtures are compared with unambiguous canonical English equivalents separately from identical-string cases.

## Validation

- PASS: `node tests/fr-amount-words-input.test.js`: 14 valid and 13 invalid grammar fixtures.
- PASS: external helper, French adapter, native guard and changed test syntax; inline scripts in both pages compile with `vm.Script`.
- PASS: in-memory `hardenExistingFrench(row, source)` preserves both native inline scripts and the new adapter reference. No generator output was written.
- PASS: `npm run build:i18n:validate` and `npm run validate:hreflang`.
- PASS: `git diff --check` and staged whitespace check.
- PASS: `npx playwright test tests/e2e/fr-amount-words-decimals.spec.js --project=chromium --workers=1 --trace=off`: 4/4, 51.9 seconds; see `browser.log`.

Browser environment: `PORT=4192`, `AFROTOOLS_TEST_DISABLE_ANALYTICS=1`, `FR_AMOUNT_WORDS_EN_ROOT=C:/Users/Oza/.codex/worktrees/growth-recovery-integration-20260908/afrotools`. The focused test serves only the two reviewed English HTML owners from that read-only root via Playwright interception; French HTML and runtime dependencies come from this lane. It verifies the English and French exact-decimal engine files match. All nonlocal requests are blocked, inputs are synthetic, traces are disabled, and no real financial/person data or screenshots are included.

The suite exercises 24 valid paired scenarios: original baseline/mutations, `1.005`, `0.005`, `2.675`, `999.995`, `1,250.75`, zero, one, French comma/space equivalents and the shared maximum. Every scenario compares complete normalized English wording, independently expected exact visible figures, parsed JSON and TXT, and actual clipboard content. Eighteen invalid/recovery cycles check stale result removal, no downloads or clipboard replacement, and recovery to `1.01`; two further boundary comparisons explicitly prove Naira's domain difference and Ghana's common cap. Each route is checked for 390px document overflow. French runtime errors after navigation are collected; this is not a full load-time console audit.

## Oracle review and evidence commit

Read-only inspection of combined source at observed commit `a4c4d7372d01c0ac61d9fe97bf01e7c67962ffe3` found exactly two changed native English HTML fingerprints. After successful paired browser proof, only these rows in `tests/fixtures/fr-uniquely-african-native-oracles.json` were recaptured:

| Route | Reviewed native HTML SHA-256 |
| --- | --- |
| naira-to-words | `8c3f798613c7da2e69976a7f95050baa65d376a1a40726c87a97952218070824` |
| amount-words-gh | `c45d0f20b09a04e0c5dda3ca28bfad3063e3808565baa85767e4e1a89ee053fa` |

Native hashes use `SHA256(normalizeBuildManagedHtml(entireEnglishHtml))`, exactly as the existing native test does. The distinct nonnative helper additionally strips alternate links and must not be used for these rows. Both rows record `reviewedFrom` and this evidence path. Global `capturedFrom`, all other 12 native rows, all nonnative fixtures and the 34-route manifest remain unchanged. Independent read-only comparison verified **all 14** resulting native HTML fingerprints against the combined source.

Both updated rows also fingerprint the external exact-decimal dependency, whose cache version is normalized away in HTML: `206ac93fdf2ed6ef6f24f3476561509c44c8d9b176892187f5d3b9e56caa2120`. Dependency hashes normalize CRLF to LF. `tests/fr-uniquely-african-engine.test.js` now checks declared dependency fingerprints and reports them alongside native drift. Read-only comparison verified both dependency checks against combined source.

## Coordinator steps and remaining proof

1. Integrate only the new product and fixture/evidence commits. The unchanged parser already exists in the combined branch; preserve its identical content. Do not reapply earlier money/car-import ancestors.
2. Run `node tests/fr-amount-words-input.test.js`, `node tests/fr-uniquely-african-engine.test.js`, and the focused browser suite above against combined source. Omit `FR_AMOUNT_WORDS_EN_ROOT` there so both languages use the combined checkout.
3. No route generation is required for these hand-authored owners. The existing category owner supports `node scripts/generate-fr-uniquely-african.js --check`; `--write` affects the entire category and is not required for this repair. Use its exported `hardenExistingFrench` for a scoped, in-memory preservation check as performed here.
4. Refresh build-owned asset references through the normal combined build (`npm run build:deploy`; `node scripts/cachebust.js` is the cache-reference owner within the build). The two new script references and changed native-guard references require current versions; other pages referencing that guard may receive generated cache-only changes. Any minified assets, bundles, service-worker stamp and `dist/` remain owned by the combined build. No generated/cache outputs were hand-edited in this lane.
5. Complete coordinator full `npm test`, security/build/dist checks and final source-plus-dist browser proof. This lane intentionally retains older English owners, so the recaptured hashes are for the combined English source; a local whole native-fingerprint test would correctly reject those two old owners. Full combined acceptance remains the coordinator's responsibility.

No full 34-route browser run or global pending browser proof was produced. No full-range parity, human French language acceptance, live deployment or current banking-rule accuracy is claimed. No main merge, deployment or live database action occurred. Revert the new fixture/evidence and product commits to roll back; in combined source preserve the pre-existing shared parser dependency.
