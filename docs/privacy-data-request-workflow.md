# Privacy Data-Request (DSAR) Workflow

_Last updated: 2026-07-13._

How AfroTools handles data-subject requests (access, export, correction, deletion,
opt-out, restriction, objection) end to end. Public entry point:
[`/privacy/data-request/`](https://afrotools.com/privacy/data-request/).

## Components

| Piece | Path |
|---|---|
| Public form | `privacy/data-request/index.html` |
| Backend function | `netlify/functions/privacy-data-request.js` |
| Route | `_redirects`: `/api/privacy-data-request → /.netlify/functions/privacy-data-request` |
| Ledger table | `supabase/migrations/056-privacy-data-requests.sql` (`privacy_requests`) |
| Data map | [`data-handling.md`](./data-handling.md) |

## Request lifecycle

1. **Lodge** — user submits email + request type on the public form. The function
   validates input, applies per-IP (20/day) and per-email (5/day) rate limits, drops
   honeypot hits, stores a row with `status='pending_verification'` and a random
   verification token, and emails the requester a one-time confirmation link. Raw IP
   is never stored — only a salted SHA-256 hash. Response is generic (no account
   enumeration).
2. **Verify** — user clicks `GET /api/privacy-data-request?verify=<token>`. The
   function flips `status='verified'`, sets `verified_at`, clears the token
   (single-use), and emails **privacy@afrotools.com** with the request details.
3. **Fulfil** — an operator actions the verified request (below) and replies to the
   requester. Target: **within 30 days**. Update the row: `status='completed'`,
   `completed_at`, `handled_by`, `resolution_note`.

## Operator fulfilment

Query the queue (Supabase MCP or SQL editor, service role):

```sql
select id, email, request_type, details, created_at
from privacy_requests
where status = 'verified'
order by created_at;
```

Then, by `request_type` — search every store in [`data-handling.md`](./data-handling.md)
for the email (`lower(email)`):

- **access / export** — gather rows from `email_leads`, `profiles`, saved tool data,
  `search_queries` (by session if known), afropoints, scholarship tables. Return a
  structured JSON/CSV export. Do **not** include another person's data.
- **correction** — update the specific fields the user identified.
- **deletion / erasure** — delete from `email_leads`, account/profile + saved tool
  data, afropoints, scholarship tables; delete or anonymise the Supabase Auth user.
  Retain only what law requires (e.g. minimal billing records) and note it in the reply.
- **opt_out** — set `email_leads.opt_in_digest=false`, `email_status='unsubscribed'`,
  and disable profile email flags. This can also be self-served via any email footer.
- **restrict / object** — flag the account/lead so marketing and optional processing stop.

Always reply to the **verified** email address only.

```sql
update privacy_requests
set status = 'completed', completed_at = now(), handled_by = '<you>', resolution_note = '<what was done>'
where id = '<id>';
```

## Environment variables

| Var | Purpose | Fallback |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` (or marketing variants) | write to `privacy_requests` | fails closed (request not recorded) |
| `RESEND_API_KEY` | verification + notification email | fails closed |
| `PRIVACY_NOTIFY_EMAIL` | where verified requests are sent | `privacy@afrotools.com` |
| `PRIVACY_REQUEST_SALT` | salt for IP hashing | `afrotools-dsar-v1` (set a real secret in prod) |

## Deploy checklist

- [ ] Apply migration `056-privacy-data-requests.sql` to the Supabase project.
- [ ] Confirm `PRIVACY_REQUEST_SALT` is set to a private value in Netlify env.
- [ ] `node --check netlify/functions/privacy-data-request.js`
- [ ] Smoke test: submit the form → receive verification email → click → confirm the
      privacy inbox notification and the `status='verified'` row.
- [ ] `npm run security:scan && npm run build:deploy && npm run audit:dist`.

## Security notes

- Double opt-in prevents someone lodging an erasure/access request against another
  person's email.
- Verification tokens are single-use and cleared on verify.
- Responses never reveal whether an email exists in any dataset.
- The endpoint is CORS-locked and rate-limited like other capture endpoints.
