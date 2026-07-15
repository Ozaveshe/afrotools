# Data Handling & Records of Processing (RoPA)

_Last updated: 2026-07-13._

Internal map of the personal data AfroTools processes, where it lives, which
processors it touches, why, on what legal basis, and how long we keep it. This is
the source of truth behind the public [Privacy Policy](https://afrotools.com/privacy/)
and [Cookie Policy](https://afrotools.com/cookies/), and the reference an operator
uses to fulfil a [data request](./privacy-data-request-workflow.md).

Keep this file in sync when you add a function that stores personal data, add a
processor, or change retention. It is a repo-internal doc (not shipped to `dist/`).

---

## 1. Personal data we process

| Data category | Fields | Where stored | Written by | Legal basis | Retention |
|---|---|---|---|---|---|
| **Email leads** | email, name, company, role, industry, company_size, country, currency, UTM/referrer, device_type, opt-in flag, unsubscribe token | Supabase `email_leads` | `capture-lead.js`, `capture-b2b-lead.js` | Consent (marketing) / legitimate interest (B2B enquiry) | Until unsubscribe + cleanup; opt-out sets `email_status=unsubscribed` |
| **Accounts / profiles** | email, name, country, tier, preferences, email prefs, unsubscribe token | Supabase `profiles` + Supabase Auth | Supabase Auth, `api-profile.js`, `auth-session.js` | Contract | While account exists |
| **Saved tool data** | per-tool calculation history, favourites, alerts, workspace, vault docs | Supabase (`user_*`, vault) + browser `localStorage` | client `afro-auth.js`/`afro-vault.js`, `api-*` | Contract / consent | While account or item exists; local copy until browser cleared |
| **Search queries** | query text, results count, source, country, page_url, session_id | Supabase `search_queries` | `capture-search.js` | Legitimate interest (product intelligence) | Rolling; no direct identifier |
| **AI assist content** | prompt + selected workflow context (may contain what the user pastes) | **Transient** — sent to Anthropic; not persisted as an account record by default | `ai-advisor.js`, `ai-business-plan.js`, `creator-*`, `translate.js` | Consent (gated by `ai-consent-guard.js`) | Not stored by AfroTools; provider per Anthropic policy |
| **Payment / billing** | transaction + subscription metadata (not full PAN/CVV) | Paystack/Stripe + Supabase billing rows | `paystack-webhook.js`, `create-checkout.js`, `api-pro-billing.js` | Contract / legal obligation | As required for billing records |
| **Rewards / payouts (AfroPoints)** | account balance, payout profile details | Supabase afropoints tables | `afropoints-*.js` | Contract | While account exists |
| **Student / scholarship** | email, saved scholarships, reminders, JAMB signup | Supabase | `jamb-*.js`, `api-scholarship-*.js` | Consent | Until unsubscribe / account deletion |
| **WhatsApp (AfroWork)** | phone number, message context | Meta WhatsApp (graph.facebook.com) | `afrowork-whatsapp.js` | Consent | Per Meta + workflow |
| **Data requests (DSAR)** | email, request type, details, verification token, salted IP hash | Supabase `privacy_requests` | `privacy-data-request.js` | Legal obligation (rights handling) | Ledger retained for audit; token cleared on verify |
| **Request metadata** | IP (rate-limit key only, **not persisted** except salted hash on DSAR), user-agent | Ephemeral in-memory rate limiter | shared `_shared/rate-limit.js` | Legitimate interest (abuse prevention) | In-memory, evicted ≤24h |

**Not personal data** (public/reference feeds, no PII): forex (`open.er-api.com`,
`api.frankfurter.app`), crypto (`api.coingecko.com`), World Bank, UNHCR, ACLED,
fuel/commodity/electricity/telecom scrapers.

---

## 2. Processors (sub-processors)

| Processor | Role | Data it receives | Policy |
|---|---|---|---|
| **Supabase** | Auth, database, storage | Account identifiers + records users save; leads; DSAR ledger | supabase.com/privacy |
| **Netlify** | Hosting + serverless functions + forms | Request metadata; form submissions | netlify.com/privacy |
| **Resend** | Transactional / lifecycle email | Recipient email + message | resend.com/legal/privacy-policy |
| **Paystack** | Payments | Card entered with provider; AfroTools gets status metadata | paystack.com/privacy |
| **Stripe** | Payments | Card entered with provider; AfroTools gets status metadata | stripe.com/privacy |
| **Anthropic** | AI assist (Claude API) | Prompt + selected context, after consent | anthropic.com/privacy |
| **Google** | Analytics 4 + Fonts | Consented usage metadata; IP for font requests | policies.google.com/privacy |
| **Microsoft** | Clarity diagnostics | Consented session/UX signals | privacy.microsoft.com |
| **Meta** | Pixel (where configured) | Consented conversion signals | facebook.com/policy.php |
| **Formspree** | Contact form backend (CSP `form-action`) | Contact form fields | formspree.io/legal/privacy-policy |

Active Supabase project: `zpclagtgczsygrgztlts` (single-project consolidation; the
legacy `jbmhfpkzbgyeodsqhprx` DATA project is retired — see `docs/ARCHITECTURE.md`).

---

## 3. Security controls (summary)

- **Transport:** HTTPS only; HSTS `max-age=31536000; includeSubDomains; preload`.
- **Headers (`_headers`):** CSP (single source of truth), `X-Frame-Options: SAMEORIGIN`
  globally (the public widget-embed paths `/widgets/iframe/*` + `/fr/widgets/iframe/*`
  deliberately relax to CSP `frame-ancestors *` so publishers can embed them),
  `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, restrictive `Permissions-Policy`,
  COOP/CORP. Known limitation: `script-src` still includes `'unsafe-inline'` (many
  inline scripts sitewide) — tracked, not yet removed.
- **Secrets:** no service-role/payment/AI keys in tracked source. Server writes use
  service-role env vars and **fail closed** when missing. Only the public Supabase
  anon key appears client-side (RLS-dependent, expected). Gate: `npm run security:scan`,
  `npm run audit:dist`.
- **Functions:** CORS locked to AfroTools origins (`utils/cors.js`); shared per-IP
  rate limiting (`_shared/rate-limit.js`); input validation + enum allow-lists;
  errors log status/message, **not raw PII bodies**.
- **AI:** `_shared/ai-consent-guard.js` blocks sensitive payload keys (CV, resume,
  financial, legal, health, personal profile) unless explicit content consent is present.
- **RLS:** operational tables are service-role only where writes come from validated
  functions; no anonymous write policies for lead/search/DSAR capture.

---

## 4. Retention & deletion

- Marketing: opt-out is immediate (`email_status=unsubscribed`); records purged on cleanup.
- Accounts: deleted on verified erasure request (see runbook).
- DSAR ledger (`privacy_requests`): retained as an audit trail; verification tokens
  are single-use and cleared on verification.
- Local storage: fully user-controlled — clearing site data removes it.

See [`privacy-data-request-workflow.md`](./privacy-data-request-workflow.md) for the
step-by-step fulfilment procedure across these tables.

---

## 5. Change log

- **2026-07-13** — Initial RoPA. Added self-service DSAR tool (`privacy_requests`,
  `privacy-data-request.js`, `/privacy/data-request/`), GDPR/UK coverage in the
  privacy policy, standalone Cookie Policy, `SECURITY.md` + `/.well-known/security.txt`.
  Kept global `X-Frame-Options: SAMEORIGIN` and relaxed framing on the public
  widget-embed paths (`/widgets/iframe/*`, `/fr/widgets/iframe/*`) to CSP
  `frame-ancestors *` so third-party publishers can iframe the calculator widgets.
