# French Developer Tools parity — checkpoint receipt

Date: 2026-07-29

Foundation: `8ce5cac175e42201968b1f7540752d6acf92d4ca`

Branch: `codex/fr-wave4-developer-tools`

## Exact scope

- English canonical Developer Tools rows: 32
- French native candidates: 17
- French iframe/transplant routes: 8
- French generic bridge/handoff routes: 6
- Missing French owner: 1
- English tool artwork available: 32/32
- Accepted French apps: 32/32

## Baseline route states

### Iframe/transplant routes

1. `data-converter`
2. `regex-tester`
3. `cron-builder`
4. `diff-checker`
5. `api-tester`
6. `sql-playground`
7. `css-gradient`
8. `sitemap-gen`

### Generic bridge/handoff routes

1. `african-api-directory`
2. `african-domains`
3. `commit-message-gen`
4. `docker-compose-gen`
5. `hosting-compare`
6. `pwa-manifest`

### Missing owner

1. `ussd-flow-builder`

## Resolved security boundary

The English canonical API Tester at `tools/api-tester/index.html` supports authenticated requests:

- token/password/API-key inputs are declared at lines 219 and 273–278;
- `buildHeaders()` inserts Bearer, Basic, and API-key credentials at lines 577–589;
- the preflight explicitly states that secret-like headers are sent directly by the browser at lines 625–653;
- `sendRequest()` sends those headers to the user-selected endpoint with `fetch()` at line 770.

The product decision permits a narrow intended-endpoint exception. The English owner and its deterministic native French output now:

- default to unauthenticated requests;
- identify the exact scheme, host, port, path and credential header names before every credentialed send;
- require blocking confirmation without displaying credential values;
- warn separately for localhost and private-network targets;
- use direct browser `fetch()` with redirects disabled and no retry;
- block credentialed sends to AfroTools domains and telemetry routes;
- block non-HTTP(S), URL user information and secret insertion into query or fragment data;
- keep credentials memory-only and clear fields after send, cancel or page exit;
- redact secrets from saved requests, history, downloads, code previews, responses and errors;
- record only endpoint origin, auth type, confirmation outcome and an hourly timestamp bucket in a memory-only consent audit.

The native French owner is generated from the English owner by `scripts/build-french-developer-api-tester.js`. It contains no iframe and inherits the same controller and security behavior.

## Verification

- English credential-boundary browser tests: 7/7 passed.
- Native French owner browser test: 1/1 passed.
- Seventeen pre-existing native French owners: 17/17 core workflow, 320px, dark-mode, canonical, reciprocal-locale-link and console checks passed.
- All advertised exports across those seventeen owners: 17/17 app suites passed; 19 downloaded files reopened, JSON outputs parsed, HTML outputs contained valid document markup and SQL output contained executable statement syntax.
- Hash Generator's 320px result overflow and Markdown Editor's table-driven 320px overflow were repaired and rechecked.
- Fourteen former iframe, bridge, or missing-owner routes are now deterministic native outputs generated directly from their English owners. Their 14/14 workflow suites passed at 320px in dark mode with canonical and console checks; Data Converter, SQL Playground and Sitemap exports downloaded and reopened.
- The language-quality queue was resolved through a reviewed route-specific phrase catalog, exact runtime rules for variable statuses, localized metadata and structured data, and French JSON export values with explicit machine-token preservation.
- The deterministic catalog contains 2,111 route-specific English-to-French phrases; protected platform names, URLs, identifiers, MIME types, request methods and code syntax are explicitly allowlisted.
- The 32-route language oracle passed for visible UI, attributes, metadata, structured data, keyboard entry and console output.
- Human-facing JSON export values are French while route ids, provider ids, URLs, code tokens and machine keys remain unchanged.
- The scoped French AI route build and check passed, including the accepted USSD route.
- Synthetic sentinels reached only the confirmed mock target and did not appear in storage, page URL, console output or unrelated requests.
- Cancel, changed-origin redirect, AfroTools targets and telemetry targets did not receive the sentinel.
- Inline JavaScript syntax checks passed for both owners.
- `git diff --check` passed.
- Zero deleted files and no tracked `test-results` changes.

## Final accepted scope

- 0/32 apps remain unaccepted.
- No iframe routes remain in the exact Developer Tools scope.
- No generic bridge routes remain.
- USSD Flow Builder now has a deterministic native owner.
- Combined browser proof passed 88/88 tests across credential security, workflows, exports, mobile/dark presentation, language, metadata, structured data and keyboard entry.

## Actions deliberately not performed

- No broad localized-output changes
- No sitemap, inventory, master-ledger, minified-output, or test-result changes
- No push, PR, merge, broad build, or deployment
- No files deleted
