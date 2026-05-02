# AfroTools Email Marketing Workflow

AfroTools uses Resend for lifecycle and digest emails.

## Live Links

- Netlify project: https://app.netlify.com/projects/afrotools
- Resend email log: https://resend.com/emails
- Public site: https://afrotools.com

## Source Of Truth

- Account recipients live in the AUTH Supabase project `public.profiles`.
- PDF/report-gate recipients live in `public.email_leads`.
- `profiles.email_welcome_sent_at` prevents duplicate welcome sends.
- `profiles.email_digest_enabled` and `email_leads.opt_in_digest` are suppression gates.
- `email_unsubscribe_token` powers one-click unsubscribe links.

## Functions

- `netlify/functions/_shared/lifecycle-email.js` builds lifecycle email HTML/text.
- `netlify/functions/send-lifecycle-email.js` sends eligible single-recipient lifecycle emails.
- `netlify/functions/send-welcome-backfill.js` sends the one-time founding-user welcome to existing profiles.
- `netlify/functions/capture-lead.js` stores PDF/report-gate leads and sends the lead welcome.
- `netlify/functions/send-monthly-digest.js` sends the monthly digest.
- `netlify/functions/email-unsubscribe.js` handles profile and lead unsubscribe links.

## One-Time Welcome Backfill

Before sending:

1. Deploy the email-function changes.
2. Confirm `RESEND_API_KEY` is configured in Netlify.
3. Set `WELCOME_BACKFILL_TOKEN` or `EMAIL_ADMIN_TOKEN` in Netlify functions/runtime env.
4. Dry run the endpoint:

```bash
curl -s -X POST https://afrotools.com/api/email/welcome-backfill \
  -H "Content-Type: application/json" \
  -d "{\"dryRun\":true,\"limit\":39}"
```

5. Send the batch:

```bash
curl -s -X POST https://afrotools.com/api/email/welcome-backfill \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WELCOME_BACKFILL_TOKEN" \
  -d "{\"dryRun\":false,\"limit\":39}"
```

The sender only selects opted-in profiles where `email_welcome_sent_at is null`,
then marks that timestamp after Resend accepts the message.

## Safety Rules

- Do not email directly from raw Netlify form exports without importing and deduping first.
- Do not send to rows where the digest/opt-in flag is false.
- Do not reset `email_welcome_sent_at` unless deliberately re-running a tested campaign.
- Never paste Resend or Supabase secrets into docs, commits, or chat summaries.

## Validation

Run narrow checks after email changes:

```bash
node --check netlify/functions/_shared/lifecycle-email.js
node --check netlify/functions/send-lifecycle-email.js
node --check netlify/functions/send-welcome-backfill.js
node --check netlify/functions/capture-lead.js
node --check netlify/functions/send-monthly-digest.js
npm run security:scan
```
