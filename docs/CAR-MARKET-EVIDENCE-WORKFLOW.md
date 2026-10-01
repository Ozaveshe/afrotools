# Car market evidence workflow

The private Supabase ledger stores 482 active catalog identities. An identity is not a verified price. Public asking-price claims must come from separately reviewed listing observations and a published snapshot. Keep the current static Car Pricer price pack independent until reviewed snapshot export is wired into its generator.

## Source access

Check source terms and collection rights before any automated job or import. The source registry in `data/cars/market-source-registry.json` is a deny-by-default operational list. On 2026-10-01, Autochek Nigeria's terms restricted data extraction and commercialization, YallaMotor's terms prohibited robot/scraper collection and copying, and Jiji's terms restricted copying user content without consent. Jiji's listings were viewable through the in-app browser, while Cars45 presented a human verification challenge. BE FORWARD needs commercial-use review. None is authorized for scheduled collection in this ledger. Do not bypass challenges, copy marketplace photos, or represent search-cache prices as freshly observed.

Use a written partner feed or independently submitted dealer inventory with explicit permission for storage, aggregation, publication, and image use. Add its source row to the registry and the private database only after access review. A scheduled collector must require `automated-approved`; manual review intake may use `manual-only` only when its rights permit it. No seller contact details, VIN, or third-party photos belong in this evidence ledger.

## Intake and review

### Browser research before source approval

`car_market_research` holds minimal manually checked facts for sources awaiting policy review, without treating them as approved listing observations. Use `node scripts/car-market-research.js validate|sql INPUT.json data/cars/market-source-registry.json`. Supply actual make/model/year, condition, ask, currency, URL, observed timestamp and posting date when visible. Original mileage units are preserved. A catalog ID must match make, model and year; unmatched cars keep a null ID. Blocked/retired sources are refused. Do not copy images, seller contact, VIN, page text or query-string identifiers.

Research is append-only, private under RLS, and never queried by the snapshot generator. All rows carry `availability-unconfirmed`; postings older than 90 days carry an age flag. A fresh browser visit does not prove an old listing is still for sale. Source rights, active inventory and suspicious specifications must be resolved separately before using the normal observation intake. Motorka is `review-needed`, not authorized for scheduled scraping or public reuse.


1. Verify the AfroTools Supabase project ref `zpclagtgczsygrgztlts` with the configured MCP before SQL.
2. Read the feed or individual listing and create JSON `{ "listings": [...] }` with fields accepted by `scripts/car-market-evidence.js`. Use actual observed timestamp and individual HTTPS listing URL. Preserve make, model, year, condition, currency, and asking price; never infer a missing price.
3. Run `node scripts/car-market-evidence.js validate INPUT.json data/cars/market-source-registry.json`.
4. Run `node scripts/car-market-evidence.js sql INPUT.json data/cars/market-source-registry.json` and execute the resulting bounded SQL through the AfroTools Supabase MCP. New or refreshed observations are `pending`.
5. Review each listing against its page/feed record and set `review_status='accepted'` or `rejected`, `review_reason`, and `reviewed_at` in the private DB. Check duplicate inventory, model-year mismatch, stale inventory, obvious price outliers, and mixed conditions.
6. Generate snapshot SQL with `node scripts/car-market-snapshot-sql.js VEHICLE_ID NG foreign-used NGN`. It requires at least three accepted, distinct listing URLs seen in the last 14 days and inserts only a `draft` quartile snapshot.
7. Review the listing URLs, sample distribution, publication rights, and limitations before marking a snapshot `published`. Only reviewed published snapshots may enter public JSON and indexable car pages. Show asking-price sample size, source, observed date, condition, and limitations. Expire stale data.

The intake scripts do not fetch third-party pages. No cron may scrape a source whose registry status is blocked, review-needed, or manual-only. Recheck terms and freshness periodically; record blocked runs rather than inventing a price. BE FORWARD's terms section 5 also restricts website data reuse; its source is blocked pending an agreement. The existing 27 starter price profiles and 455 expansion identities must be reported separately from newly verified snapshots.

## Price history and refreshes

Each intake revision is preserved in the private append-only `car_market_observation_history` table. Refreshes require a newer observed timestamp, update all comparable facts, and reset review to pending. An older or repeated timestamp does not overwrite current facts. If a listing's facts change or its approval is withdrawn, contributing draft/reviewed/published snapshots expire. A new snapshot points to immutable observation IDs, so the same seller URLs with newer prices can produce a new reviewed range without losing earlier evidence. Review-only updates do not create price-history revisions. New facts at an unchanged timestamp are rejected by the database.

Withdrawing source access also expires its accepted observations and active snapshots. Re-approving a source requires reviewing its observations again. To check these database behaviors, generate a transaction with `node tests/support/car-market-history-regression-sql.js` and run it through the verified AfroTools MCP. It uses synthetic `example.org` records and rolls all test data back; confirm the zero-data counts afterwards.
