# Developer Tools Improvement Pass - 2026-04-27

## Verdict

The Developer Tools section has real inventory, but it does not yet have a strong product thesis. A serious developer will not return for generic single-purpose utilities unless AfroTools is faster, safer, more workflow-aware, or uniquely useful for African developer work.

The section should move from "many small tools" to "a practical African developer cockpit":

- Africa API Studio: API testing, API directory, environments, collections, cURL import/export, webhook helpers, and Africa API presets.
- USSD Studio: visual flow builder, phone simulator, `CON` and `END` validation, generated handlers, session transcript, callback readiness checklist.
- Data Workbench: JSON, CSV, XML, YAML, Base64, hashes, JWT, URL encoding, diffing, and reusable local snippets.
- SQL Practice Lab: African business datasets, guided query drills, interview mode, CSV import/export, schema browser, and explain-style coaching.
- Web Launch Tools: manifest, robots, sitemap, meta tags, .htaccess, domains, hosting, and deploy checklist as one launch workflow.

## Research Anchors

Checked on 2026-04-27:

- Hoppscotch: workspaces, roles, real-time collaboration, collections, and environment variables are table stakes for a serious API client. Source: https://hoppscotch.com/features
- CyberChef: the bar for browser data utilities is recipe-style chaining across encoding, hashing, compression, parsing, and analysis. Source: https://github.com/gchq/CyberChef
- JSON Crack: JSON tools now compete on visual exploration, conversion, schema/code generation, and client-side privacy. Source: https://jsoncrack.com/
- jwt.io: JWT tools compete on decode, verify, generate, signature status, and claim breakdown. Source: https://www.jwt.io/
- regex101: regex tools compete on explanation, debugging, and code generation. Source: https://regex101.com/
- MDN Web App Manifest reference: modern PWA manifest tooling should include members such as screenshots, shortcuts, share targets, file handlers, protocol handlers, and launch behavior where supported. Source: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference
- Conventional Commits: commit tooling should validate `fix`, `feat`, optional scope, footer, and `BREAKING CHANGE` semantics. Source: https://www.conventionalcommits.org/
- Africa's Talking USSD help: callback URLs, event URLs, sessions, and `CON` or `END` response errors are real implementation concerns. Source: https://help.africastalking.com/en/collections/150775-ussd

## Inventory Snapshot

Source of truth: `assets/js/components/tool-registry.js`.

- 32 live tools are categorized as `developer`.
- The public category page had stale language: "25+" in copy, `numberOfItems: 22` in schema, and a dynamic registry count at runtime.
- There are duplicate or hub-like entries mixed into leaf tools:
  - `meta-tag-gen` and `meta-tag-generator`
  - `ussd-simulator` and `ussd-flow-builder`
  - `dev-tools` as a category-like hub inside the same category

## Product Classes

### Flagship Apps

These should be built as real workflows, not thin tools:

| Tool | Current product read | Deep improvement direction |
| --- | --- | --- |
| `api-tester` | Useful but too close to a basic fetch form. No collections, no environments, no history, no cURL import/export. | Turn into Africa API Studio with presets, environments, saved requests, assertions, history, and code export. |
| `african-api-directory` | Good niche, but reads like a static list and claims freshness without a visible maintenance model. | Add source dates, verification state, doc links, API categories, test links into API Tester, and "last checked" discipline. |
| `ussd-flow-builder` | Strong Africa-specific wedge, but shallow generated code and no linter. | Add `CON`/`END` checker, character limit warnings, session transcript, callback checklist, provider templates. |
| `ussd-simulator` | Good presets, but should share state with builder. | Merge conceptually into USSD Studio or cross-link as "simulate this flow." |
| `sql-playground` | Best generic tool positioning because African sample datasets are distinctive. | Add lessons, interview mode, import CSV, query scoring, export, saved history. |
| `hosting-compare` | Potential buyer-intent page, but pricing and latency claims need freshness. | Add last-checked dates, source links, provider fit scoring, local payment notes, affiliate/lead path. |
| `docker-compose-gen` | Useful but static generator. | Add stack profiles, healthchecks, secrets warnings, deploy target variants, validation checklist. |
| `pwa-manifest` | Useful, but modern manifest surface is broader than the current generator. | Add screenshots, shortcuts, share target, protocol handlers, install checklist, Lighthouse-style readiness score. |

### Data Workbench Utilities

These can remain separate tools, but should share a Dev Clipboard pattern: local history, file mode, result chaining, copy/export, keyboard shortcuts, and "send to related tool" links.

| Tool | Deep improvement direction |
| --- | --- |
| `json-formatter` | Add schema/type generation as a first-class feature and tune app schema. |
| `data-converter` | Add conversion recipes and import/export history. |
| `hash-generator` | Add checksum verification workflows, signed release file checklist, and HMAC presets. |
| `base64` | Add chained URL-safe/Base64/file/image workflows. |
| `jwt-decoder` | Add safer signature verification warnings, JWKS input, claim health checks. |
| `regex-tester` | Add engine differences, explanation, performance/ReDoS warnings, test case library. |
| `diff-checker` | Add unified diff export, ignore whitespace/case, JSON diff handoff. |
| `markdown-editor` | Keep, but add reusable templates and export discipline. |
| `sql-formatter` | Add dialect selector and error linting beyond beautify. |

### Web Launch Tools

These should become a launch workflow rather than isolated mini generators:

| Tool | Deep improvement direction |
| --- | --- |
| `meta-tag-gen` | Merge or redirect strategy with `meta-tag-generator`. |
| `meta-tag-generator` | Add SERP/social preview, schema choices, African business examples. |
| `robots-txt` | Add crawler test matrix and sitemap detection. |
| `sitemap-gen` | Add XML validation, lastmod discipline, robots cross-check. |
| `htaccess-gen` | Add Apache version notes and safety checks. |
| `css-gradient` | Keep as utility, but not flagship. |
| `color-contrast` | Add WCAG 2.2 labels and palette testing. |
| `african-domains` | Add source links and registrar requirement dates. |

### Quick Utilities

These should be fast, keyboard-friendly, and connected to a shared toolbox. They do not need large solo landing pages unless search proves demand.

| Tool | Deep improvement direction |
| --- | --- |
| `cron-builder` | Add next run calendar, timezone behavior, and cloud provider examples. |
| `url-encoder` | Add URL diagnostics, query diff, and tracking parameter cleanup. |
| `uuid-generator` | Add sortable ID education, collision calculator, database examples. |
| `html-entities` | Add XSS-safe escaping contexts. |
| `password-gen` | Add passphrase mode, policy presets, and offline safety messaging. |
| `commit-message-gen` | Add Conventional Commits validation and changelog preview. |
| `dev-tools` | Treat as a hub or remove from leaf-tool counting. |

## First Implementation Decisions

1. Fix the category front door:
   - Show the real live count from the registry.
   - Segment tools by product role, not one flat grid.
   - Stop overclaiming "25+" or hardcoding stale `numberOfItems`.
   - Make the page explain why AfroTools developer tools are different.

2. Start deep improvement with `api-tester`:
   - Add environments.
   - Add Africa API presets.
   - Add request history and saved requests in localStorage.
   - Add cURL import/export.
   - Add response assertions.
   - Add response headers, copy response, and fetch snippet export.
   - Add SoftwareApplication schema.

3. Deep improvement for `ussd-flow-builder`:
   - Replace the thin flat menu builder with a state-based USSD studio.
   - Add screen types: menu, input capture, and final END screen.
   - Add a phone-style session simulator with 0 Back and 00 Home behavior.
   - Add flow linting for missing screens, unreachable screens, dead links, long menu prompts, missing END screens, and input screens without next targets.
   - Add telco character-limit warnings based on Kenya Safaricom, Kenya Airtel, Nigeria conservative, and generic conservative presets.
   - Add generated Node/Express and PHP starter handlers.
   - Add flow JSON export/import and browser-local saving.
   - Add official reference links for Africa's Talking USSD, CON/END errors, and Kenya character limits.

4. Deep improvement for `pwa-manifest`:
   - Replace the basic manifest generator with an install-readiness studio.
   - Add modern manifest members: display override, screenshots, shortcuts, share target, protocol handlers, file handlers, launch handler, edge side panel, id, scope, dir, lang, categories, maskable icons.
   - Add product presets for mobile money, school portal, market directory, and clinic booking.
   - Add install preview, readiness score, and per-criterion checks.
   - Add generated HTML tags, safer service worker starter, asset checklist, and launch checklist.
   - Add official reference links for MDN manifest members, web.dev install criteria, and web.dev manifest guidance.

5. Continuation on 2026-04-28 for `sql-playground`:
   - Replace the older sample-query page with a fuller in-browser SQL practice lab.
   - Keep sql.js/SQLite in the browser, but make the product feel like a learning and interview tool.
   - Add four African datasets: commerce, school records, clinic visits, and mobile money.
   - Add guided challenges with result-shape scoring.
   - Add query linting, EXPLAIN QUERY PLAN output, schema SQL output, lesson notes, query history, CSV result export, CSV import, and SQLite database export.
   - Escape rendered query results instead of injecting raw values into result table HTML.

6. Continuation on 2026-04-28 for `african-api-directory`:
   - Replace vague "40+ APIs" and "always updated" positioning with a docs-first trust model.
   - Add documentation check dates, verification states, auth models, sandbox status, pricing notes, base URLs, production risks, and editorial fit scores.
   - Add filters for category, country, auth model, and sandbox support.
   - Add compare shortlist, copy cURL, and localStorage handoff into API Tester saved requests.
   - Add official-source links for Paystack, Flutterwave, Safaricom Daraja, MTN MoMo, and Africa's Talking.

7. Continuation on 2026-04-28 for `docker-compose-gen`:
   - Replace the basic service picker with a stack generator built around official Compose concepts.
   - Add stack profiles, service toggles, runtime/database/proxy choices, healthchecks, depends_on conditions, file secrets, optional profiles, private network, named volumes, and optional VPS resource limits.
   - Generate compose.yaml, .env example, deployment commands, reverse proxy config, and Dockerfile starter.
   - Add stack health warnings for exposed app ports, missing secrets, disabled healthchecks, debug UI exposure, and VPS resource limits.
   - Add official reference links for Compose file reference, startup order, profiles, and secrets.

8. Continuation on 2026-04-28 for `hosting-compare`:
   - Replace the stale pricing table with a source-checked hosting decision tool.
   - Add official source links and checked dates for Cloudflare, Netlify, Vercel, GitHub Pages, Render, Railway, Fly.io, DigitalOcean, Hetzner, Akamai/Linode, AWS Lightsail, Go54/WhoGoHost, and Afrihost.
   - Correct stale pricing assumptions, including Netlify's credit model and Hetzner's April 2026 cloud price adjustment.
   - Add filters for project type, market, ops comfort, budget, traffic, page weight, free/trial preference, local-payment preference, managed database need, and pricing-risk tolerance.
   - Add fit scoring, local currency planning conversion, estimated monthly transfer, ranked cards, comparison table, source log, decision brief copy/export, and a VPS handoff to the Docker Compose Generator.
   - Replace "African latency data" overclaiming with deployment-region and payment-fit guidance unless real measurement data exists.

9. Continuation on 2026-04-28 for `json-formatter`:
   - Replace the old formatter with a client-side JSON and NDJSON workbench.
   - Remove the unclear AI-assisted positioning and make privacy behavior explicit.
   - Add JSON repair for common copy-paste errors: byte order marks, smart quotes, comments, trailing commas, unquoted keys, single-quoted strings, and Python-style booleans/nulls.
   - Add JSON Pointer querying using RFC 6901 path rules, tree navigation, schema inference, TypeScript output, flattening support in code, and JSON Patch-style diff operations.
   - Add local history, file open/download, copy output, keyboard formatting, and localStorage handoff into API Tester.
   - Add official reference links for MDN JSON.parse, RFC 6901 JSON Pointer, RFC 6902 JSON Patch, and JSON Schema starter guidance.
   - Fix incorrect generic JSON-LD metadata that previously described the homepage instead of the tool.

10. Continuation on 2026-04-28 for `regex-tester`:
   - Replace the old regex page with a JavaScript RegExp workbench for validation, matching, replacement, explanation, snippets, and history.
   - Add first-class flags, live highlighting, match cards, numeric and named capture group display, replacement preview, and generated JavaScript, Python, and PHP snippets.
   - Add African validation starter patterns for Nigeria, Kenya, South Africa, Ghana, Tanzania, and Uganda.
   - Add honest ReDoS and engine warnings without claiming the browser can fully sandbox every slow pattern.
   - Add local history and JSON Formatter handoff so regex test evidence can move into the JSON workbench.
   - Add official reference links for MDN regular expressions, capture groups, Unicode property escapes, and lookbehind assertions.
   - Fix the default sample so the line-by-line Nigerian mobile test starts in multiline mode and visually shows matches on first load.

11. Continuation on 2026-04-28 for `cron-builder`:
   - Replace the old dropdown-only cron page with a deployment-focused schedule workbench.
   - Add direct expression editing, field editing, presets, local browser history, copyable expressions, and copyable platform snippets.
   - Add timezone-aware next-run previews using IANA zones, with UTC shown beside each previewed run.
   - Add target-platform modes for Linux crontab, GitHub Actions, Kubernetes CronJob, and AWS EventBridge.
   - Add EventBridge conversion from common five-field cron to the required six-field `cron(...)` shape, with warnings for day-of-month/day-of-week conflicts.
   - Add official-source warnings for GitHub's 5-minute scheduled workflow minimum, top-of-hour delay risk, Kubernetes CronJob concurrency/idempotency, Linux DOM/DOW OR semantics, and DST behavior.
   - Fix stale copy that incorrectly implied one five-field cron expression was directly compatible with AWS EventBridge.
   - Browser-check desktop and mobile layouts, including the EventBridge conversion path.

12. Continuation on 2026-04-28 for `jwt-decoder`:
   - Replace the mojibake-heavy JWT page with a local JWT decoder and security inspector.
   - Remove the remote AI assistant call and the unsafe unsigned `alg: none` token builder posture.
   - Add local compact-token parsing for JWS and JWE shape detection, with colored token anatomy.
   - Add claim timeline, registered-claim explanations, token anatomy, JOSE header risk review, and RFC 8725/OWASP-backed warnings.
   - Add HS256, HS384, and HS512 signature verification using browser Web Crypto with expected issuer and audience checks.
   - Add a local HS256 dev-token generator that signs short-lived test tokens in the browser.
   - Add localStorage handoff into API Tester for a bearer header, clearly scoped to browser-local use.
   - Add official reference links for RFC 7519, RFC 7515, RFC 8725, and the OWASP JWT cheat sheet.
   - Browser-check desktop and mobile layouts and verify the generated sample token signature path.

13. Continuation on 2026-04-28 for `url-encoder`:
   - Replace the older tabbed encoder with a URL operations workbench.
   - Keep encoding/decoding, but make it practical with `encodeURI`, `encodeURIComponent`, stricter RFC 3986 component output, and safe decode errors.
   - Add full URL parsing with editable protocol, hostname, port, path, fragment, auth field, and duplicate-preserving query rows.
   - Add query surgery actions for adding, sorting, and removing tracking parameters such as `utm_*`, `fbclid`, `gclid`, `msclkid`, and similar campaign IDs.
   - Add diagnostics for malformed percent escapes, possible double encoding, raw whitespace, fragments, HTTP with sensitive values, credentials in URLs, duplicate keys, long URLs, tracking parameters, and secret-like query keys.
   - Add rebuilt URL, clean URL, query string, original-vs-rebuilt-vs-clean diff, and copyable JavaScript fetch, cURL, and Python requests snippets.
   - Add local history and API Tester handoff for GET requests.
   - Add official reference links for MDN `encodeURIComponent`, MDN URL, MDN URLSearchParams, WHATWG URL, and RFC 3986.
   - Browser-check desktop and mobile layouts, including the tracking cleanup flow.

14. Continuation on 2026-04-28 for `uuid-generator`:
   - Replace the older generator with a local ID workbench for UUID v7, UUID v4, ULID, and NanoID-style IDs.
   - Add bulk generation up to 1,000 IDs, prefix support, output formats, copy actions, CSV export, JSON export, and browser-local generation through Web Crypto.
   - Add UUID/ULID/custom ID inspection with UUID v7 timestamp anatomy, version/variant detection, entropy estimates, and copyable implementation guidance.
   - Add a birthday-bound collision calculator for UUID v4, UUID v7, ULID, NanoID-style IDs, and custom entropy budgets.
   - Add implementation snippets for PostgreSQL, MySQL, Prisma, JavaScript, and NanoID-style browser code.
   - Add official reference links for RFC 9562 UUIDs, MDN `crypto.randomUUID()`, the ULID spec, and Nano ID.
   - Browser-check desktop and mobile layouts, including UUID v7, ULID, NanoID, collision math, and inspector flows.

15. Next pass after the first thirteen deep apps:
   - African API Directory data freshness workflow, because the directory now has a trust model but no automated source-check pipeline.
   - Data Workbench utilities, continuing with HTML Entity Encoder, Diff Checker, Markdown Editor, Base64 Encoder, and Hash Generator.
   - USSD Simulator should be merged or tightly linked with USSD Flow Builder so it stops feeling like a separate half-product.

## Validation Plan

For this pass:

- Parse edited HTML for inline script syntax.
- Run `npm run audit`.
- Run `npm run check-links` if category links or registry entries change.
- Run `npm run seo:report` if metadata changes are broad enough to require SEO proof.
