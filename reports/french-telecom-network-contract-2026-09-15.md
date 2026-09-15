# French telecom network-contract correction

Candidate follows efc419c1; no product runtime or consent policy changes.

## Exact request evidence

A Chrome DevTools Protocol request trace in fresh declined and accepted contexts showed the same request: GET of `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js`, resource type Script, no POST body. Initiator call frames were `assets/js/afro-auth.js` functions `h` and `g`. Source `h` creates a script with that fixed URL; the auth bootstrap calls it to initialize the existing auth client. It does not append tool values. Transport already permits this exact static GET. Loading the SDK is distinct from sending user data or calling a Supabase API.

## Test correction

`tests/e2e/french-telecom-parity.spec.js` permits only the exact SDK URL, GET method, script resource type and empty body. Query strings, POSTs, payloads, different origins, and fetch/XHR use do not match. Existing external/API/function blocks remain; all non-GET methods and any request body are now rejected even for same-origin requests. Twemoji allowance also requires GET, no body and no query.

For all14 app workflows, explicit locality checks verify no request body, no form field keys in URL queries, and no serialized input object in URL queries. No raw inputs are added to analytics or reports. Existing genuinely fresh-context JSON/TXT reopen and strict network checks remain.

## Verification

- Full Chromium:17/17 PASS in2.7minutes (original16 browser cases plus negative guard test).
- Negative cases reject POST, supplied body, salary query, fetch resource type, and a different origin.
- Run used existing `AFROTOOLS_TEST_DISABLE_ANALYTICS=1` server seam on4197 and explicit installed Playwright NODE_PATH. This tests local product workflows independently from intended cookieless analytics; it does not suppress a product request in the network guard.
- `git diff --check`: PASS.
- Evidence output: sibling directory `fr-telecom-contract-fixed-output/`.

Separate manual-dark follow-up: coordinator reported a13-label contrast failure at readiness on764fa5c0. The same HTML/CSS/runtime in this worktree passed3/3 repeated manual-dark runs. Root4202 was closed during attempted inspection; no root-server reproduction claimed. Readiness currently checks quick-card paint only, while advanced spans have explicit light/dark colors in `assets/css/car-import-cost.css`. No source change made for this unresolved timing-sensitive finding.

No deployment, source refresh or acceptance-ledger changes.
