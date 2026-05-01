# AfroTools API Inventory

Verified: 2026-05-01

This inventory separates live external subscriptions from AfroTools internal APIs. It was built from the repo, Netlify function schedules, environment variable references, public pricing pages, and the live Supabase `live_data_store` state.

Pricing changes often. Re-check each linked pricing page before buying, but this is the current purchasing map.

## Executive Purchase List

| Priority | API or service | Why it matters | Current posture | Suggested action |
| --- | --- | --- | --- | --- |
| 1 | ExchangeRate-API | Powers forex refreshes behind `/api/forex` and currency tools. `scheduled-fetch-forex-rates` runs every 15 minutes, about 2,880 scheduled calls per 30-day month before user traffic or retries. | Free/open fallback is not enough for this schedule. Current live source is `exchangerate-api`. Public pricing lists a $10/month Standard plan with 30,000 requests/month. | Buy Standard, set `EXCHANGERATE_API_KEY` in Netlify, keep Frankfurter/Fawaz fallbacks. |
| 2 | Supabase | Production data store for auth, profiles, favorites, workspace, AfroStream, live data, and other account-backed features. | Free tier exists, but this is now core infrastructure. Live project URL checked via Supabase MCP. | Move the production project to Pro if usage, backups, storage, or uptime matter. Audit whether both Supabase projects are still active. |
| 3 | Anthropic | Used by AI advisor, business-plan generation, creator text tools, and crypto advisor surfaces. | Paid pay-as-you-go API. There is no durable free production tier assumption. | Keep paid billing enabled and add usage monitoring per function. |
| 4 | Resend | Digest, scholarship/JAMB reminders, change alerts, gazette alerts, and lead flows. | Free plan is useful for low-volume sending, Pro is needed as mail volume grows. | Upgrade when monthly email volume or domain reputation needs exceed free limits. |
| 5 | Marketstack or Alpha Vantage | Stock index refreshes use Marketstack, Alpha Vantage, and Yahoo fallback. The schedule is hourly on weekdays. | Marketstack has a low-cost paid tier; Alpha Vantage free quota is very small for scheduled production. | Prefer Marketstack Basic for stock indices if this section matters. Keep Alpha Vantage as secondary unless paying for premium. |
| 6 | CoinGecko | Crypto prices and P2P helpers depend on CoinGecko, plus Binance/Bybit public endpoints. | Demo/free API can work with caching, but 429s are likely if crypto traffic grows. Paid CoinGecko plans are materially more expensive than $10/month. | Stay free until rate-limit evidence appears, then upgrade only if crypto is a priority. |
| 7 | ElevenLabs | PDF-to-audio/TTS feature. | Free tier exists, but production TTS needs paid credits. | Buy a small paid plan if PDF TTS is intended for public use. |
| 8 | WhatsApp Cloud API | Afrowork WhatsApp integration. | Meta charges per WhatsApp template/conversation category, not a simple quota subscription. | Ensure Meta billing is enabled before public WhatsApp flows. |

## Live Supabase State

Live project checked through Supabase MCP:

- Project URL: `https://zpclagtgczsygrgztlts.supabase.co`
- Important tables seen: `profiles`, `favorites`, `recipes`, `calculation_history`, `fx_snapshots`, `live_data_store`, `as_creators`, `as_streams`, `as_news`
- `live_data_store` rows checked before the source fix:
  - `forex-latest`: source `exchangerate-api`, status OK, updated `2026-05-01 04:46:45 UTC`, upstream timestamp `2026-05-01T00:00:01.000Z`
  - `rates-latest`: source `official-policy-pages+worldbank-inflation`, status OK, updated `2026-05-01 00:03:14 UTC`
  - `crypto-latest`: source `CoinGecko`, status OK, updated `2026-05-01 04:00:38 UTC`
  - `stock-indices-latest`: status OK, updated `2026-05-01 04:05:38 UTC`
  - `commodity-prices-latest`: status OK but using `ReferenceFallback`; meta said `All sources failed`, last attempt `2026-04-11T02:01:40.136Z`

The forex quota complaint is plausible even though the latest stored FX row was healthy during this check. The 15-minute schedule alone exceeds ExchangeRate-API's public free monthly quota.

## Repair Log

2026-05-01:

- Repaired `netlify/functions/scheduled-fetch-commodity-prices.js` after the old World Bank CSV URL returned `404`.
- The commodity fetcher now discovers the current official World Bank Pink Sheet XLSX from the commodity markets page, parses the workbook without adding a new dependency, and stores top-level `source` and `period` metadata.
- `API_NINJAS_KEY` is now only called when configured, so local and production runs without that optional key no longer burn a guaranteed `400 Missing API Key` fallback request.
- Repaired stale meta cleanup in `netlify/functions/_shared/scraper-base.js`; successful scraper runs now clear old `error`, `last_attempt`, and `anomaly_details` fields.
- Applied the same stale-meta success cleanup to `netlify/functions/scheduled-fetch-forex-rates.js`, which uses a custom handler outside the shared scraper runner.
- Refreshed `.env.example` to include the real production API variables referenced by Netlify functions.
- Re-ran the commodity scraper against live Supabase. `commodity-prices-latest` now has 19 records, source `worldbank-cmo-xlsx`, period `2026M03`, and the meta error fields are cleared.

## External APIs and Subscriptions

| Service | Used for | Repo evidence | Env vars | Free or paid status | Buy/upgrade note |
| --- | --- | --- | --- | --- | --- |
| ExchangeRate-API | Primary forex feed | `netlify/functions/scheduled-fetch-forex-rates.js`, `netlify/functions/scrape-fx-rates.js` | `EXCHANGERATE_API_KEY` | Free plan exists, paid Standard is listed at $10/month for 30,000 requests/month. | Buy first. Current schedule is too frequent for the free quota. |
| Frankfurter | Forex fallback | `scheduled-fetch-forex-rates.js` | none | Free/open. | Keep as fallback, do not rely on it as only production source. |
| Fawaz Ahmed Exchange API | Forex fallback | `scheduled-fetch-forex-rates.js`, `scrape-fx-rates.js` | none | Free/open GitHub/jsDelivr-hosted data. | Keep as fallback. |
| Supabase | Auth, profiles, favorites, workspace, live data, AfroStream, history | `_shared/data-store.js`, auth/data functions, many frontend modules | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, service-role variants | Free and Pro tiers. | Production should likely be on Pro once account-backed usage is real. |
| Netlify Functions and Blobs | Serverless runtime, schedules, Blob cache | `netlify.toml`, `_shared/data-store.js` | `NETLIFY_SITE_ID`, `NETLIFY_TOKEN` where admin scripts need them | Free and Pro tiers. | Watch function minutes, bandwidth, and scheduled-function volume. |
| Anthropic | AI advisor, business plans, creator copy, crypto portfolio advice | `ai-advisor.js`, `ai-business-plan.js`, `creator-*`, `crypto-portfolio-advisor.js` | `ANTHROPIC_API_KEY` | Paid token API. | Add budget alarms and per-function usage logs. |
| CoinGecko | Crypto price refresh and market data | `crypto-prices.js`, `scheduled-fetch-crypto.js`, `crypto-p2p.js` | `COINGECKO_API_KEY` | Demo/free API exists; paid plans are higher-cost. | Upgrade only after crypto traffic or 429s prove the need. |
| Alpha Vantage | Stock/index fallback data | `scheduled-fetch-stocks.js` | `ALPHA_VANTAGE_KEY` | Free quota is small; premium starts much higher than $10/month. | Not first purchase unless stocks become important. |
| Marketstack | Stock/index feed | `scheduled-fetch-stocks.js` | `MARKETSTACK_KEY` | Free quota is small; Basic is listed around $9.99/month. | Better low-cost stock-data purchase than Alpha Vantage for this repo. |
| API Ninjas | Commodity oil fallback | `scheduled-fetch-commodity-prices.js` | `API_NINJAS_KEY` | Free and paid tiers. | Investigate because live commodities are currently on fallback. |
| Numbeo | Property data reference input | `scheduled-fetch-property.js` | `NUMBEO_API_KEY` | API access is not a simple public self-serve free/pro plan; contact Numbeo for access. | Only pursue if property-data pages are strategic. |
| NewsAPI | Gazette and official-change scanning | `scheduled-scan-gazette.js` | `NEWS_API_KEY` | Free developer tier and paid tiers. | Upgrade only if the gazette/change monitor is production-critical. |
| ACLED | Conflict events | `conflict-acled.js` | `ACLED_API_KEY`, `ACLED_EMAIL` | Requires ACLED API credentials. | Treat as a data partnership/credentialed API, not generic free scraping. |
| UNHCR API | Refugee/conflict context | `conflict-unhcr.js` | none | Open API. | No paid action now. |
| World Bank APIs | Inflation, development, commodity and fallback data | central-bank/rates/property/agri/shipping scripts | none | Free/open. | Keep as baseline source. |
| ILOSTAT | Salary/employment reference data | `scheduled-fetch-salaries.js` | none | Free/open API. | No paid action now. |
| YouTube Data API | AfroStream live/video checks | `afrostream-livecheck.js`, `afrostream-sync.js` | `YOUTUBE_API_KEY` | Google API quota is free by default, quota-based. | Monitor quota because live checks run every 30 minutes. |
| Twitch API | AfroStream live checks | `afrostream-livecheck.js`, `afrostream-sync.js` | `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` | Free developer API with rate limits. | No paid action unless rate limits appear. |
| Kick API | AfroStream live checks | `afrostream-livecheck.js`, `afrostream-sync.js` | `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET` | Public developer API/OAuth; no paid plan found in repo. | Monitor for API or policy changes. |
| WhatsApp Cloud API | Afrowork WhatsApp flows | `afrowork-whatsapp.js` | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` | Paid by Meta message/conversation pricing after free allowances. | Enable billing before public traffic. |
| ElevenLabs | PDF text-to-speech | `pdf-tts.js` | `ELEVENLABS_API_KEY`, `ELEVENLABS_TTS_MODEL`, `ELEVENLABS_TTS_VOICES_JSON` | Free tier and paid creator tiers. | Buy if PDF TTS is a real public feature. |
| Resend | Transactional and scheduled emails | digest, JAMB, scholarship, gazette/change functions | `RESEND_API_KEY`, `EMAIL_FROM` | Free and paid tiers. | Upgrade when send volume grows or deliverability becomes business-critical. |
| Stripe | Card checkout | `create-checkout.js` | `STRIPE_SECRET_KEY`, webhook secret if configured | Transaction-fee service. | No quota purchase; confirm live mode and webhook setup. |
| Paystack | African card/payment checkout | `create-subscription.js`, `paystack-webhook.js` | `PAYSTACK_SECRET_KEY` | Transaction-fee service. | No quota purchase; confirm live mode and webhook setup. |
| Google Analytics | Site analytics | generated/static pages | measurement IDs, if configured | Free standard product, paid Analytics 360 for enterprise. | No action unless enterprise analytics is needed. |
| Google Fonts/CDNs | Fonts and static libraries | static HTML/CSS | none | Free public CDN usage. | No paid action. |
| MyMemory and LibreTranslate public instances | Translation fallback endpoint | `translate.js` | none | Free/public endpoints with rate and reliability limits. | Do not build paid workflow around these without replacing with a real translation API. |
| Binance and Bybit public endpoints | P2P crypto reference | `crypto-p2p.js` | none | Public endpoints, rate-limited. | Monitor only. |
| Metals.live | Commodity fallback | `scheduled-fetch-commodity-prices.js` | none | Free/public endpoint. | Current commodities fallback suggests this lane needs attention before buying. |
| GlobalPetrolPrices, Cable.co.uk, official utility pages | Fuel, electricity, telecom reference scraping | scheduled fetch scripts | none | Public pages/scraped sources. | Treat as fragile; no subscription action unless an official data vendor is chosen. |

## Internal AfroTools APIs

These are APIs AfroTools exposes from Netlify Functions. They are not vendor subscriptions, but they depend on the external services and Supabase data above.

| Internal route family | Function/source | External dependency |
| --- | --- | --- |
| `/api/forex`, `/api/fx-rates`, `/api/scrape-fx` | `api-forex.js`, `scrape-fx-rates.js`, scheduled forex scripts | ExchangeRate-API, Frankfurter, Fawaz, Supabase/Blobs |
| `/api/rates`, `/api/tax-rates`, `/api/vat-rates` | `api-rates.js`, central-bank/tax functions | Supabase/Blobs, World Bank, official pages |
| `/api/commodity-prices`, `/api/fuel`, `/api/electricity`, `/api/telecom-plans` | scheduled data functions | API Ninjas, World Bank, Metals.live, public data pages |
| `/api/crypto*` | crypto functions | CoinGecko, Binance, Bybit, Anthropic for advisor |
| `/api/ai-*`, creator text routes | AI and creator functions | Anthropic |
| `/api/pdf-tts` | `pdf-tts.js` | ElevenLabs |
| `/api/afrostream/*` and `/tools/afrostream/feed.xml` | AfroStream functions | Supabase, YouTube, Twitch, Kick |
| `/api/conflicts/*`, `/api/events/*`, `/api/stats` | conflict functions | ACLED, UNHCR, World Bank |
| `/api/profile`, `/api/history`, `/api/favorites`, `/api/workspace`, `/api/auth/*` | account/workspace functions | Supabase |
| `/api/scholarships*`, reminders, saves | scholarship functions | Supabase, Resend |
| `/api/create-checkout`, `/api/create-subscription`, webhooks | payment functions | Stripe, Paystack |
| `/api/capture-lead`, `/api/capture-search`, digests/alerts | lead/email functions | Supabase, Resend |

## Environment Template

`.env.example` has been refreshed with the production API variable names used by Netlify functions, including:

- `ACLED_API_KEY`, `ACLED_EMAIL`
- `ALPHA_VANTAGE_KEY`
- `API_NINJAS_KEY`
- `ELEVENLABS_API_KEY`, `ELEVENLABS_TTS_MODEL`, `ELEVENLABS_TTS_VOICES_JSON`
- `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET`
- `MARKETSTACK_KEY`
- `NEWS_API_KEY`
- `NUMBEO_API_KEY`
- `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`
- `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`
- `YOUTUBE_API_KEY`

Do not put real secret values in `.env.example`. Add names, comments, and purchase/status notes only.

## Official Pricing and Quota References

- ExchangeRate-API pricing: https://www.exchangerate-api.com/pricing
- Supabase pricing: https://supabase.com/pricing
- Netlify pricing: https://www.netlify.com/pricing/
- Anthropic pricing: https://www.anthropic.com/pricing
- CoinGecko API pricing: https://www.coingecko.com/en/api/pricing
- Alpha Vantage premium: https://www.alphavantage.co/premium/
- Marketstack pricing: https://marketstack.com/product
- API Ninjas pricing: https://api-ninjas.com/pricing
- Numbeo API access: https://www.numbeo.com/common/api.jsp
- NewsAPI pricing: https://newsapi.org/pricing
- Resend pricing: https://resend.com/pricing
- YouTube Data API quota: https://developers.google.com/youtube/v3/getting-started#quota
- Twitch API rate limits: https://dev.twitch.tv/docs/api/guide#rate-limits
- Kick developer docs: https://docs.kick.com/
- WhatsApp Cloud API pricing: https://developers.facebook.com/docs/whatsapp/pricing
- ElevenLabs pricing: https://elevenlabs.io/pricing
- Stripe pricing: https://stripe.com/pricing
- Paystack pricing: https://paystack.com/pricing
- Frankfurter docs: https://www.frankfurter.app/docs/
- Fawaz Ahmed Exchange API: https://github.com/fawazahmed0/exchange-api
- World Bank API docs: https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information
- ILOSTAT API docs: https://ilostat.ilo.org/resources/concepts-and-definitions/ilostat-api/
- UNHCR API docs: https://api.unhcr.org/
