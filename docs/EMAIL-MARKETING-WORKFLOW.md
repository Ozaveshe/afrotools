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
- `profiles.email_last_weekly_at` prevents duplicate weekly newsletters.
- `profiles.email_last_signin_reminder_at` keeps sign-in reminders on a cooldown.
- `profiles.email_onboarding_nudge_sent_at` prevents duplicate activation nudges.
- `profiles.email_activity_milestone_sent_at` prevents duplicate first-activity milestone emails.
- `email_leads.email_followup_sent_at` prevents duplicate PDF/report lead follow-ups.
- `profiles.email_digest_enabled` and `email_leads.opt_in_digest` are suppression gates.
- `profiles.email_weekly_enabled` can disable only the weekly newsletter while leaving other account email preferences intact.
- `email_unsubscribe_token` powers one-click unsubscribe links.

## Functions

- `netlify/functions/_shared/lifecycle-email.js` builds lifecycle email HTML/text.
- `netlify/functions/send-lifecycle-email.js` sends eligible single-recipient lifecycle emails.
- `netlify/functions/send-welcome-backfill.js` sends the one-time founding-user welcome to existing profiles.
- `netlify/functions/capture-lead.js` stores PDF/report-gate leads and sends the lead welcome.
- `netlify/functions/send-weekly-newsletter.js` sends the weekly AfroTools brief.
- `netlify/functions/send-signin-reminders.js` sends inactivity/sign-in reminders.
- `netlify/functions/send-onboarding-nudges.js` sends account activation nudges when a new profile has no activity yet.
- `netlify/functions/send-activity-milestones.js` sends the first meaningful activity milestone email.
- `netlify/functions/send-lead-followups.js` sends the delayed PDF/report lead follow-up.
- `netlify/functions/send-monthly-digest.js` sends the monthly digest.
- `netlify/functions/email-unsubscribe.js` handles profile and lead unsubscribe links.
- `netlify/functions/capture-b2b-lead.js` stores B2B commercial enquiries for widgets, sponsorships, calculators, API pilots, and media kit requests. It does not send lifecycle email.

## Active Email Triggers

| Trigger | Function | Timing | Suppression |
|---------|----------|--------|-------------|
| New account signup | `auth-session.js` + `send-lifecycle-email.js` | Immediate | `email_welcome_sent_at`, `email_digest_enabled` |
| Existing-user welcome backfill | `send-welcome-backfill.js` | Manual one-time send | `email_welcome_sent_at`, admin bearer token |
| PDF/report gate completion | `capture-lead.js` | Immediate | `email_leads.first_email_sent_at`, `opt_in_digest` |
| Weekly AfroTools brief | `send-weekly-newsletter.js` | Mondays 08:00 UTC | `email_last_weekly_at`, `email_weekly_enabled`, `email_digest_enabled` |
| Sign-in reminder | `send-signin-reminders.js` | Wednesdays 09:00 UTC | 14 days inactive, 21 day reminder cooldown, 6 day welcome grace |
| Account activation nudge | `send-onboarding-nudges.js` | Daily 10:00 UTC | 3 day account age, 3 day welcome grace, no saved/favorite/calculation/workspace/contribution activity, `email_onboarding_nudge_sent_at` |
| First activity milestone | `send-activity-milestones.js` | Daily 11:00 UTC | Recent activity in calculation, favorite, saved tool, saved calculation, workspace item, or contribution tables, `email_activity_milestone_sent_at` |
| PDF/report lead follow-up | `send-lead-followups.js` | Daily 12:00 UTC | 2 days after lead welcome, lead still opted in, no account profile, `email_followup_sent_at` |
| Monthly digest | `send-monthly-digest.js` | First day of month 08:00 UTC | `email_last_digest_at`, `email_digest_enabled` |
| Scholarship deadline reminder | `scheduled-send-scholarship-reminders.js` | Hourly queue sweep | User reminder settings and job status |
| AfroJAMB daily question | `scheduled-send-jamb-daily.js` | Hourly by subscriber send hour | JAMB subscriber active flag and daily delivery key |

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
node --check netlify/functions/send-weekly-newsletter.js
node --check netlify/functions/send-signin-reminders.js
node --check netlify/functions/send-onboarding-nudges.js
node --check netlify/functions/send-activity-milestones.js
node --check netlify/functions/send-lead-followups.js
node --check netlify/functions/capture-lead.js
node --check netlify/functions/capture-b2b-lead.js
node --check netlify/functions/send-monthly-digest.js
npm run security:scan
```
