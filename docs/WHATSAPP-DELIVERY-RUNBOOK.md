# WhatsApp delivery activation and recovery

This workflow targets only AfroTools: `https://zpclagtgczsygrgztlts.supabase.co` and Netlify site `8aa543db-b4bd-4631-98f8-221440055c41`.

## Activation order

1. The publisher verifies the exact source commit, its build/artifact checks, and the existing database schema through the AfroTools Supabase MCP.
2. Apply `supabase/migrations/20261012214500_whatsapp_delivery_receipts.sql` before enabling the updated webhook. Verify that anonymous and authenticated clients cannot read receipts or invoke the receipt functions.
3. Confirm the WhatsApp token, phone ID, app secret and verification token in production function scope without printing their values. Confirm the receipt-store service key and canonical project URL. Verify a currently supported Meta API version before activation; `WHATSAPP_GRAPH_VERSION` is required and has no default. Malformed or absent versions prevent delivery. Syntax validation does not establish provider support.
4. Deploy the verified artifact and perform a controlled provider delivery test using an authorized test recipient. Local mocks do not prove registration, webhook subscription or real delivery.
5. Keep the page's launch-pending notice until the public number and real delivery have been verified.

The current candidate must not be declared READY while activation/recovery prerequisites or required release checks remain unresolved.

## Receipt behavior

The database retains a SHA-256 hash of the provider message ID, an attempt token, state and timestamps. It does not retain phone numbers, message text, salary values or a stable user identifier. A new attempt atomically claims an unseen or confirmed-retryable message. Completed receipts skip reply generation and sending.

The worker records `sending` immediately before contacting Meta. An explicit rejected response is retryable. A timeout, invalid acceptance response or interrupted send is uncertain; it is not automatically resent. An expired pre-send processing lease can be reclaimed. An expired sending lease becomes uncertain. The attempt token prevents an older worker from advancing a replacement worker's receipt.

Local tests cover receipt SQL and privileges, overlapping handler invocations, repeated partial batches, missing configuration, database outages and ambiguous provider responses. The local PostgreSQL runtime has one serialized connection; this is not live multi-session or provider proof.

## Recovery

Use aggregate counts by state to detect pending or uncertain work. Never include message bodies, phone numbers or access tokens in reports.

For an uncertain receipt, an operator must inspect authorized Meta delivery evidence and match the provider message ID hash. If acceptance/delivery is confirmed, mark that exact receipt sent. If non-acceptance is confirmed, make only that receipt retryable. If the outcome is still unknown, leave it uncertain; do not reset all receipts or assume failure. Record the evidence and conditional before/after state. This is an operational follow-up, not an exactly-once guarantee across independent provider and database systems.

Do not delete receipts while their provider retry window or an unresolved delivery investigation remains relevant. A retention schedule requires the provider retry contract to be verified before publication; no automatic deletion has been introduced.

For rollback, disable new webhook delivery first, preserve receipt state, and inspect any sending/uncertain attempts. Do not drop receipts or revert to the old fail-open handler while provider credentials remain enabled.

## Reproducing the local database checks

Install `@electric-sql/pglite@0.5.8` in a temporary directory outside the checkout. Run these from the candidate checkout, passing absolute paths to that package directory and a separate evidence directory:

```text
node scripts/verify-whatsapp-delivery-sql.cjs <runtime>/node_modules/@electric-sql/pglite <evidence>
node scripts/verify-whatsapp-handler-replay.cjs <runtime>/node_modules/@electric-sql/pglite <evidence>
```

Both commands use the checkout's actual migration and implementation. They create only an in-memory local database; all provider traffic is mocked. A failed assertion exits nonzero. Preserve the JSON proofs with the release evidence. These checks supplement the ordinary Node unit suite and do not establish live provider delivery or multi-session database contention.

The provider-owned [Meta OpenAPI specification](https://github.com/facebook/openapi/blob/main/business-messaging-api_v23.0.yaml) documents v23.0. It establishes an API contract, not its current support end date or this app's activation. Verify those before setting the production version.
