# Qualified public claim review — 10 October 2026

Eight reviews expired at UTC midnight. The original image build and a clean-baseline claim check failed with the same eight CLAIM_REVIEW_EXPIRED IDs. This review checks their current evidence, corrects two stale selector references, and retains every existing approved meaning, translated wording and prohibited-pattern rule. No clock override or validation bypass was used.

## Counts and selector references

`node scripts/build-canonical-registry.js --check` and `node tests/canonical-registry.test.js` passed against source base `1266694ee408bcc4ae9bf22e668688165e60c2e5`. The generated registry equals its current source owner. Independent inspection of the owner output found:

| Claim | Verified selector | Result and boundary |
| --- | --- | --- |
| `count.tools` | `tools.live_experiences` | 2,612 expanded live experiences; distinct from 3,690 canonical published records, 1,257 English canonical records and 3,698 raw registry rows. |
| `count.widgets` | `widgets.published` | 223 published widgets; every iframe and corresponding full-tool destination exists in the checkout. This does not assert every widget interaction or provider is working. |
| `count.categories` | `categories.published` | 32 published category hubs; every hub exists and each category has at least one published tool. |
| `count.countries` | `countries.published` | 54 canonical African jurisdiction records and local hubs; regional sentinels excluded. Replaces nonexistent `countries.african_jurisdictions`. Individual tools may cover fewer countries. |
| `count.languages` | `languages.site_published` | Five public locales: English, French, Swahili, Yoruba and Hausa, including partial coverage. Replaces nonexistent `locales.public`. Planned Igbo and component-only hints are excluded. |

These are repository inventory selectors, not production route, provider-data, model-accuracy or complete-translation acceptance. Count dates retain the existing 90-day review cadence: verified 10 October 2026, review after 8 January 2027. The selector values are regenerated from source rather than copied into public wording.

## Measured performance

`node scripts/mobile-network-smoke.js` ran six local routes at 390px, 900 Kbps download, 350 Kbps upload, 220ms RTT and 4x CPU throttle. All returned 200 without timeouts; one PASS and five WARN results, zero horizontal overflow and zero controls below 16px. See `reports/mobile-network-smoke.json` and `.md` for all results.

Home load was 17,643ms and LCP 6,896ms. Search, mobile money and airtime routes retained layout-shift warnings; the static airtime smoke cannot serve its telecom/freshness Functions. This supports the existing requirement for named-route measurement. It does not support blanket fast, offline, 2G, carrier-field or all-device claims. Measurements reflect this local run, not a production benchmark.

## Optional account sync and explicit vault upload

Source review covered `assets/js/lib/workspace-sync.js`, `netlify/functions/api-workspace.js`, `netlify/functions/_shared/browser-session-auth.js`, `assets/js/afro-vault.js` and the vault migration. Ten synthetic, network-stubbed checks passed: signed-out client/API requests are blocked; withdrawn client permission blocks a send; explicit signed-in calls target the workspace API; API list/upsert/delete scope to the verified user even when a different user_id is supplied; service failures are retained; and an explicit synthetic vault call uses the signed-in user prefix and metadata identity. The auth-verification implementation was read, but real token validation was not exercised.

The configured `supabase_afrotools` MCP first verified `https://zpclagtgczsygrgztlts.supabase.co`. A read-only metadata query then confirmed:

- `workspace_items` and `vault_documents` have RLS enabled, with authenticated own-user SELECT, INSERT, UPDATE and DELETE policies.
- The `vault` bucket is private, with a 10,485,760-byte limit and PDF, PNG and JPEG MIME types.
- Vault storage SELECT and INSERT policies scope the first path folder to `auth.uid()`. No storage DELETE policy was established by this review.

No customer rows, tokens, file contents or credentials were read. No real account transaction, cross-device sync, upload, download, deletion or live write occurred. The workspace API uses a service role after authentication, so source-level own-user request scoping remains material alongside RLS. Vault cleanup/deletion and retention guarantees remain unverified. Local downloads remain separate from explicit cloud upload.

The performance, account and vault dates retain their existing seven-day review cadence: verified 10 October 2026, review after 17 October 2026. lastVerifiedAt records this qualified policy/evidence review, not production end-to-end acceptance.

## Preserved evidence

The delivery packet `public-claim-review-oct10` retains original failures, the metadata query and response, source hashes, 10 synthetic observations and all native command logs. Stable evidence hashes:

- `count-source-evidence.json`: SHA-256 `89fb6baaf37d658247b876678badead566059eacb3a718038175b65ed5824f79`.
- `account-vault-source-proof.json`: SHA-256 `3f35b98a6f66a9cf1ae157b5b8056c78e867aefb06b0a6dbe15c3e10e12e09aa`.
- `supabase-metadata-evidence.json`: SHA-256 `820e49fb937fe5816a44dccfadb37f1e9de868667ce016db1b4f54915d9729dd`.
- `mobile-network-evidence.json`: SHA-256 `195def4a388c81cd776b1a360d808bd86f0833c995574b2dba504cd95be909aa`.
- `original-expired-claims.log`: SHA-256 `4635b6262fa3e41b1856ea0eb3323174f8bd46a9de19bf958fc893e88b42f628`.

Full native build, artifact audit/security, exact-head CI and cumulative publisher acceptance are separate checks recorded by the handoff. Existing Netlify verification/guard restrictions are unaffected.


The mobile report owner now emits one final newline instead of an extra blank line. Its native renderer regenerated Markdown from the same captured JSON; every measurement and report word remains unchanged.
