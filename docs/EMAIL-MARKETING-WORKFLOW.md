# AfroTools Email Marketing Workflow

AfroTools uses Resend for lifecycle and digest emails.

## Restart Decision - 2026-10-09

The consent-backed newsletter restart was sent to 43 recipients on October 9
local time after sender authentication, suppression and unsubscribe checks.
The broader account marketing programme remains paused pending consent and
cross-store unsubscribe reconciliation. Payment alone did not resume it.

### Initial inspection evidence (before restart actions)

| Layer | Observed result | Meaning |
| --- | --- | --- |
| Resend Settings / Usage | Transactional Pro; 2 / 50,000 monthly emails; unlimited daily allowance | Paid API capacity is available |
| Resend Marketing | Free; 5 / 1,000 contacts; 1 / 3 segments; unlimited broadcasts | No marketing upgrade needed for a small eligible pilot |
| Resend Domains | `afrotools.com` verified | Provider verification; DNS not independently audited |
| Resend Emails / Metrics, last 15 days | One AfroAlerts email delivered; no bounces or complaints | Delivery has worked; too little volume to establish list health |
| Resend Webhooks | No webhooks configured | Repository suppression handler is not connected |
| Resend Broadcasts | One sent broadcast named Untitled, about six months old | No recent broadcast programme visible |
| Tracking notice | Root domain uses shared click tracking | Custom tracking remains outstanding |
| Supabase target | `https://zpclagtgczsygrgztlts.supabase.co` verified before read-only SQL | Correct AfroTools project; schema and aggregate counts only |
| Account records | 1,175 profiles; 1,168 digest-enabled; 1,168 weekly-enabled | Preference flags, not verified marketing consent |
| Send markers | 690 welcome markers; 101 weekly markers | Recorded application sends, not delivery proof |
| Weekly selection | 141 meet preference/activity/grace conditions before current-week dedupe and batch limit | Candidate ceiling, not approved audience; old milestones can still qualify |
| Leads | 34 records; 33 marked opted in; 31 first-email markers | Separate store; deduplicate before combining with profiles |
| Token coverage | No digest-enabled profile lacks an unsubscribe token | Token presence only; behavior still needs a live test |

These are snapshots. Quota usage and email metrics use different accounting
windows; the two usage counts are not two proven deliveries. The Resend account
also hosts SalaryPadi; this strategy covers AfroTools only. The July audit's
high bounce/complaint figures are historical, but today's one-message sample
does not remove the need to reconcile historical suppressions.

### Audience and consent

`008-email-preferences.sql` originally defaulted `email_digest_enabled` to true.
`capture-lead.js` treats omitted opt-in fields as enabled. Neither an account nor
an enabled boolean alone proves explicit marketing consent. Require recorded
opt-in source, date, wording/version and topic before importing or sending;
exclude uncertain records. Capture fresh consent through an unchecked signup
or dashboard preference, not an unsolicited bulk permission-request email.
Sensitive-tool exports must remain independent of marketing consent.

Normalize and deduplicate within the sending system. Apply opt-outs, permanent
bounces, complaints and provider suppressions across profiles, leads and Resend
contacts. Never reactivate an opt-out on import. JAMB and scholarship consent
covers the requested topic, not the general newsletter. Keep prospect outreach
and SalaryPadi separate. Do not export contact lists or private inputs into docs.

### Restart sequence

1. Verify deployed handlers, production send key presence, current
   `EMAIL_MARKETING_PAUSED` value, correct Supabase target, verified sender and
   monitored reply address. Record production environment checks and deployed
   commit identity separately from repository checks.
2. Connect the existing signed `resend-webhook` handler for `email.bounced`,
   `email.complained` and `email.suppressed`. Keep `RESEND_WEBHOOK_SECRET` in the
   production secret store. Prove signed-event suppression with a synthetic
   recipient and rejection of invalid signatures. Reconcile old suppressions
   separately; registering a webhook does not backfill them.
3. Test unsubscribe end to end with a controlled record. The current endpoint
   updates either profiles or leads and does not synchronize Resend contacts.
   Implement/test cross-store opt-outs before overlapping API and Broadcast
   audiences are used.
4. Choose one marketing sending path for the pilot. Prefer the existing API
   path until Broadcast consent and suppression sync are proven. API messages
   consume transactional quota even when the content is marketing; consent
   requirements still apply. Do not duplicate a scheduled email in Broadcasts.
5. Use branded links with tracking explicitly disabled and verified for the
   pilot, or verify the exact custom tracking DNS records Resend supplies.
   Never guess DNS values or change transactional tracking blindly.
6. Send a fresh seed test only to designated internal test inboxes. Record the
   accepted message ID, delivery event, inbox/spam placement, mobile rendering,
   CTA, reply handling and unsubscribe as separate checks.
7. Pilot with up to 25 recently active, explicitly opted-in recipients. Use
   fewer if fewer qualify. Inspect results after 48 hours before considering
   cohorts of 50 and then 100. Never fill a batch with uncertain accounts.
8. Stop the pilot on any complaint or permanent bounce and investigate. Keep
   the existing programme limits of bounce rate above 4% or complaint rate
   above 0.08%; these are internal controls, not deliverability guarantees.

Keep legacy automated marketing paused until its audience consent and
cross-store unsubscribe gates pass. The execution record below distinguishes
the authorized Broadcast restart from that legacy automation restart.

### Restart execution - 2026-10-09

The founder authorized provider setup, delivery/suppression tests and a current
broadcast, including older newsletter subscribers. Do not replay missed weekly
editions. Send one current issue and then maintain the weekly cadence.

- Production `EMAIL_MARKETING_PAUSED=1` was verified. It remains enabled to
  prevent account-default preferences from triggering a backlog burst.
- Last weekly acceptance marker: **2026-07-13 08:19:29 UTC**. 99 profiles have
  that day's latest marker; 101 profiles have any weekly marker. These are
  application acceptance markers, not provider delivery evidence.
- Last monthly digest marker: **2026-07-01 08:09:38 UTC**. Last welcome marker:
  **2026-07-23 05:37:03 UTC**. The latest lead follow-up marker is July 21.
- The footer newsletter form is a separate audience from account profiles:
  61 submissions, 58 with the explicit footer source, 43 unique valid
  addresses after deduplication. Ten are recent subscribers and 33 are older
  subscribers. None match current application opt-outs or provider suppressions.
  Three submissions without the footer source are excluded. Do not describe
  these 10 people as 10 new accounts or as individually proven never emailed.
- There are 82 previously mailed weekly profiles still enabled after
  suppression reconciliation. Their flags and prior sends do not establish
  newsletter consent; keep them separate until signup evidence is reconciled.
- Provider suppression export contained 24 addresses: 21 bounces, 3 complaints.
  All matched profiles; 23 still-enabled profiles were disabled. A follow-up
  query confirmed none of the 24 remained digest/weekly enabled. No leads matched.
- Created the Resend bounce, complaint and suppressed-event webhook to the
  existing `/.netlify/functions/resend-webhook` endpoint. Stored its signing
  secret in Netlify production, Functions scope, marked secret. Triggered
  deploy `6ac812df18fa994b03327ff8` at unchanged source commit
  `7929fc7e0ecbf37063cefae79aed1c0086d29908` to activate the setting.
- Controlled lead one-click unsubscribe returned HTTP 200; live SQL confirmed
  `opt_in_digest=false` and `email_status=unsubscribed`.
- A Gmail seed exposed a missing `resend._domainkey.afrotools.com` TXT record,
  despite the provider's verified badge. Restored the exact public key shown
  in Resend in Hostinger DNS, TTL 300. Authoritative DNS and Google DNS returned
  the expected value. A fresh Gmail test passed AfroTools DKIM, SPF and DMARC.
- Disabled shared click tracking for `afrotools.com`; this affects future
  domain emails, including click-event reporting. Open tracking was already
  disabled. A fresh received HTML test contains the direct AfroTools CTA and
  no Resend click-wrapper URL. SalaryPadi settings were not changed.
- Both the API seed and actual Broadcast preview reached the owner's Gmail
  INBOX. The final authentication test is Gmail message `1a11d996b4c19248`.
  Broadcast preview includes plain text, HTML, a resolved test unsubscribe URL
  and one-click unsubscribe headers. Test unsubscribe URLs do not prove a real
  Broadcast contact was unsubscribed.
- Created segment `16522f16-8c38-42a1-ba9c-617f6d1b6a1e` and added the 43
  newsletter-form subscribers. The UI confirms 43 subscribed, zero unsubscribed.
  CSV upload stalled; direct entry from the same verified form submissions
  completed the import. The original General segment was not used for the send.

- Deployment published at **2026-10-08 22:21:32 UTC** (October 9 locally).
  An unsigned webhook POST returned HTTP 400 `Invalid webhook signature`.
  Real provider simulator sends produced signed webhook events: bounce email
  `01a11d9c-821f-702b-ab38-a8332b212448` and complaint email
  `01a11d9c-846c-7d00-96c1-4f978b875fb0`. Live SQL confirmed the controlled leads
  became `permanent_bounce` / `complained`, both opted out. All three synthetic
  QA records are now disabled, including the unsubscribe test.
- Broadcast `be2b4333-4ba8-40d4-86bd-890a748bcf08` was dispatched after the final
  Resend review showed 43 total recipients and zero global/topic opt-outs.
  The provider displayed **Your email was sent**. Delivery metrics are recorded
  separately below. The user authorized including the 33 older explicit
  subscribers in this small restart send, expanding the original 10-person pilot.
- Initial provider result at approximately **2026-10-08 22:26 UTC**: **41
  delivered, 1 bounced, 1 sent awaiting a delivery event**, zero complaints and
  zero unsubscribes. Aggregate Broadcast metrics and all 43 individual email
  log rows were checked. The bounce is a nonexistent recipient; its event
  timeline shows `bounced` followed by `suppressed`. Do not retry it. No further
  expansion is authorized by these early results; review delayed outcomes and
  list quality before the next issue. Delivery is not proof of inbox placement.

Broadcast report:
https://resend.com/broadcasts/be2b4333-4ba8-40d4-86bd-890a748bcf08

Validation: production exact-SHA identity verified; live unsigned rejection,
signed bounce/complaint suppression, controlled unsubscribe and Gmail inbox
authentication tests passed; `git diff --check` passed. No product source or
function logic changed in this worktree. A same-SHA Netlify production rebuild
activated the webhook secret. Private temporary CSV files were removed after
reconciliation/import. No recipient list or secret is stored in this document.

Broad account automation remains paused. The consent-backed newsletter audience
is now managed in Resend; use its global unsubscribe state for subsequent
broadcasts and do not re-enable contacts during imports. Before resuming the
separate account API programme, reconcile its consent and cross-store opt-outs.
Resume with one current edition per week, never a burst of missed editions.

### Content and cadence

Optimize for a useful return visit and completed task. Start with one practical
email a week, tailored to stated country, language and interest. Do not infer
interests from sensitive document contents. Use short mobile-friendly HTML,
plain text, one primary CTA, recognizable sender, monitored replies and a
visible unsubscribe link.

| Week after pilot approval | Theme | Primary action |
| --- | --- | --- |
| 1 | Find one useful tool for this week's task | Open tool search |
| 2 | Start with your country when assumptions vary | Open a verified country hub |
| 3 | Finish one document task | Open a tested document workflow |
| 4 | Return to a useful tool | Reopen it; optional reply about the next task |

New opted-in subscribers receive one welcome. Keep at least three days between
welcome and weekly brief. During recovery, hold discretionary activation,
milestone and re-engagement messages to avoid a backlog burst. Target at most
one discretionary marketing message per recipient in seven days across all
paths. Current per-function timestamps do not enforce this shared cap.

A monthly digest should replace that week's brief and contain only information
the user expects by email. Do not personalize marketing with salary figures,
CV contents or private workspace details. Requested service alerts remain a
separate stream. After recovery, allow one re-engagement message for verified
subscribers only; sunset after 60 further days without a meaningful visit or
reply. The shared cap, sunset and editorial calendar are strategy to implement,
not verified production behavior. Promote Pro only where readiness is proven;
label partner placements and keep them secondary to the useful task.

### Restart issue - sent through Resend Broadcasts

- Campaign key: `afrotools_practical_restart_2026_10`
- Audience: 43 explicitly subscribed newsletter-form recipients (10 recent, 33 older)
- Subject: **Your AfroTools update: one useful tool for your week**
- Preview: **Start with the task you need to finish.**
- Sender: AfroTools, using the verified configured address and monitored replies

> Hi there,
>
> Thanks for subscribing to AfroTools updates. It has been a while since our last
> newsletter, so here is a simple place to start.
>
> What is one task you want to finish this week?
>
> Search AfroTools for a calculator or document tool that fits the job. If the
> result depends on your country, choose the local version and check the source
> date and assumptions shown on the tool.
>
> Find a tool: https://afrotools.com/search/?utm_source=resend&utm_medium=email&utm_campaign=afrotools_practical_restart_2026_10
>
> One useful task is enough for today.
>
> The AfroTools team

The production CTA was checked. Sent HTML includes the subscription explanation
and Resend's recipient-specific unsubscribe variable; preview delivery verified
its resolution and the one-click headers. Do not reuse a test unsubscribe URL
for real recipients.

### Measurement and ownership

Record cohort ID, eligibility/exclusion counts, accepted, delivered, bounced,
complained, unsubscribed, useful visits and completed tasks. Use aggregate,
consent-respecting analytics; put no address or private input in URLs. Opens
are diagnostic, not engagement proof. API acceptance is not delivery; delivery
is not inbox placement.

Founder approves audience/copy; engineering verifies consent, suppression,
production settings and deduplication; operator reviews the 48-hour results
before expansion. Do not upgrade merely to import all 1,175 accounts: that is
above 1,000 contacts, but the eligible audience has not been established.

Provider references checked on 2026-10-09:
[plan and API/Broadcast accounting](https://resend.com/pricing),
[webhook setup](https://resend.com/docs/webhooks/introduction),
[custom tracking](https://resend.com/docs/dashboard/domains/tracking).

## Live Links

- Netlify project: https://app.netlify.com/projects/afrotools
- Resend email log: https://resend.com/emails
- Public site: https://afrotools.com

## Source Of Truth

- Account recipients live in AfroTools project `zpclagtgczsygrgztlts`, `public.profiles`.
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
- `netlify/functions/resend-webhook.js` suppresses permanent bounces,
  complaints, and provider-suppressed recipients in both recipient stores.
- `netlify/functions/capture-b2b-lead.js` stores B2B commercial enquiries for widgets, sponsorships, calculators, API pilots, and media kit requests. It does not send lifecycle email.

## Active Email Triggers

| Trigger | Function | Timing | Suppression |
|---------|----------|--------|-------------|
| New account signup | `auth-session.js` + `send-lifecycle-email.js` | Immediate | `email_welcome_sent_at`, `email_digest_enabled` |
| Existing-user welcome backfill | `send-welcome-backfill.js` | Manual one-time send | `email_welcome_sent_at`, admin bearer token |
| PDF/report gate completion | `capture-lead.js` | Immediate | `email_leads.first_email_sent_at`, `opt_in_digest` |
| Weekly AfroTools brief | `send-weekly-newsletter.js` | Mondays 08:19 UTC | Recent signup or first-activity milestone, `email_last_weekly_at`, `email_weekly_enabled`, `email_digest_enabled` |
| Re-engagement check-in | `send-signin-reminders.js` | Wednesdays 09:29 UTC | 30 days inactive, one send only, 6 day welcome grace |
| Account activation nudge | `send-onboarding-nudges.js` | Daily 10:11 UTC | 3 day account age, 3 day welcome grace, no saved/favorite/calculation/workspace/contribution activity, `email_onboarding_nudge_sent_at` |
| First activity milestone | `send-activity-milestones.js` | Daily 11:23 UTC | Recent activity in calculation, favorite, saved tool, saved calculation, workspace item, or contribution tables, `email_activity_milestone_sent_at` |
| PDF/report lead follow-up | `send-lead-followups.js` | Daily 12:37 UTC | 2 days after lead welcome, lead still opted in, no account profile, `email_followup_sent_at` |
| Monthly digest | `send-monthly-digest.js` | First day of month 08:09 UTC | Prior-month calculation activity, first-activity milestone, `email_last_digest_at`, `email_digest_enabled` |
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

- Keep `EMAIL_MARKETING_PAUSED=1` while the rolling bounce rate is above 4%,
  complaint rate is above 0.08%, or recipient health cannot be verified.
- Marketing sends support `EMAIL_MARKETING_PAUSED`; privacy requests and
  explicit scholarship reminders remain transactional and are not paused by it.
- `EMAIL_MARKETING_FROM` can move marketing mail to a separately verified
  sending subdomain without changing transactional mail. `EMAIL_REPLY_TO`
  configures a monitored reply inbox for both streams.
- Register `https://afrotools.com/.netlify/functions/resend-webhook` in Resend
  for `email.bounced`, `email.complained`, and `email.suppressed`, then store
  its signing secret as `RESEND_WEBHOOK_SECRET` in Netlify Functions.
- Never remove a permanently bounced or complained address from Resend's
  suppression list without confirming the recipient and correcting the cause.
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
node --check netlify/functions/resend-webhook.js
node tests/email-delivery-safety.test.js
npm run security:scan
```

## Recovery And Growth Plan

Do not increase volume until the suppression webhook is live and the rolling
bounce rate is below 4%. Restart with the most recently active, explicitly
opted-in recipients in small batches, then expand only while bounce and
complaint rates stay healthy.

| Stream | Trigger | Cadence | Main job | Exit or suppression |
| --- | --- | --- | --- | --- |
| Welcome | New opted-in account or report lead | Immediate | Deliver the first useful path | Sent marker, opt-out, bounce, complaint |
| Activation | No meaningful activity after 3 days | Once | Help the user save or complete one useful task | First activity or sent marker |
| Milestone | First saved tool, calculation, report, or workspace item | Once | Reinforce the work trail | Sent marker |
| Practical brief | Active opted-in accounts | Weekly | One timely job with one primary CTA | Weekly opt-out or inactivity |
| Personal digest | Account activity exists | Monthly | Summarize useful account activity | Digest opt-out |
| Re-engagement | No sign-in for 30 days | One message, then 60-day sunset | Confirm interest or clean the list | Click/sign-in, opt-out, or sunset |

The current `send-weekly-newsletter.js` selects four generic editions by ISO
week with one primary CTA: saved work, country context, report workflow and tool
discovery. The following richer editorial formats are proposed, not implemented
by that rotation:

1. One practical tool and a worked example.
2. One country-specific change with source and checked date.
3. One saved-work or report workflow tip.
4. One new or materially improved AfroTools release.

Each email should keep one primary CTA, a plain-text part, branded full URLs,
Resend tags, and one-click unsubscribe headers. Transactional and marketing
mail should move to separate sending subdomains before the list grows.

## Resend Dashboard Checklist

1. Verify SPF and DKIM remain green for `afrotools.com`.
2. Add a custom tracking subdomain such as `links.afrotools.com`; do not remove
   an old tracking DNS record after links have been sent.
3. Keep click/open tracking off for sensitive transactional mail. Enable
   marketing tracking only after the custom tracking domain is verified.
4. Use a full-access operator key only for dashboard automation. Keep the
   production function key send-only.
5. Review bounce details, correct obvious typos, and retain permanent bounce and
   complaint suppressions.

## Automatic funnel implementation - 2026-10-09

The restart implementation removes the need to pause the whole funnel. Deploy
this source together with the four `20261009` email migrations before setting
production `EMAIL_MARKETING_PAUSED=0` and rebuilding the production deploy.
Earlier paused-state notes above describe the pre-restart snapshot.

- Netlify's signed `submission-created` event captures verified newsletter
  forms into service-only `newsletter_subscribers`. Repeated submissions do
  not resubscribe an opted-out address. A first subscription sends a welcome;
  the hourly job retries unsent welcomes from the previous seven days.
- Newsletter subscribers receive the existing rotating practical weekly brief
  on Mondays, from 08:04 UTC, with continuation runs until 12:00 UTC. The
  account weekly brief starts at 08:19 UTC with twenty-minute continuation
  batches through 11:59 UTC. These continuations process the same current
  edition, never missed historical editions.
- The subscriber store is Supabase. Sends use Resend's email API and appear in
  Resend Emails; new signups are not automatically added to the native Resend
  Audience/Broadcast interface because the existing key permits sending only.
  Use this funnel for weekly sends; reconcile the audience and send ledger
  before any separate manual Broadcast so it cannot bypass cadence or opt-outs.
- Every marketing send reserves an email/type/edition identity under a
  database lock. The shared adapter enforces one marketing email per seven
  days across account, lead and newsletter streams, with five minutes of
  scheduling tolerance so cron jitter cannot skip a weekly edition. Transactional messages do
  not use this cap. The provider receives the same idempotency key.
- Provider acceptance is recorded separately from delivery. Ambiguous timeouts
  and provider server errors keep the reservation; reconcile them with Resend
  before retrying. Explicit provider rejection allows another attempt.
- Signed bounce, complaint, suppression and `contact.updated` unsubscribe
  events update the shared suppression list and every matching recipient
  store. One-click opt-out does the same. Neither a repeated form submission
  nor toggling an old account flag overrides a shared suppression; an explicit
  resubscribe request needs review, and hard bounces/complaints stay excluded.
- Activation nudges require an incomplete account created 3-30 days ago.
  Report follow-ups require a welcome 2-30 days ago. The shared seven-day cap
  can defer either. Inactivity check-ins cover 30-60 inactive days, once, with Wednesday
  continuation batches from 09:29 through 12:49 UTC.
- Activity and inactivity candidates are filtered before batching. Weekly
  account selection retains its existing recent-welcome/activity eligibility;
  the flags alone do not imply every historical account receives weekly mail.
- Report capture now requires an explicit true opt-in value. Omitted consent
  no longer silently enables follow-up marketing.
- Existing 43-recipient broadcast acceptance timestamps are preserved so no
  welcome or duplicate weekly edition is sent immediately. One permanent
  bounce is suppressed, leaving 42 active newsletter records at migration.

Checks: `node tests/email-funnel.test.js`,
`node tests/email-delivery-safety.test.js`, database rollback tests for
reservation/deduplication/cadence/suppression/access controls,
`npm run security:scan`, `npm run build:deploy`, `npm run audit:dist`.
Record actual command outcomes and production proof separately in the report.

Provider references: [Netlify event signatures](https://docs.netlify.com/build/functions/trigger-on-events/),
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys),
[Resend contact unsubscribe webhooks](https://resend.com/changelog/new-contact-webhooks).
