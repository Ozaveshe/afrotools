# AfroTools Email Deliverability Audit

Date: 2026-07-28

## Outcome

Marketing sends should remain paused while the recipient list and domain setup
are repaired. The most recent Resend screenshot shows 353 messages, a 9.86%
bounce rate (32 transient and 3 permanent bounces), and a 0.28% complaint rate
(1 complaint). Activity falls to zero after approximately 2026-07-24.

The repository still contains six scheduled lifecycle and marketing functions,
and the current production Netlify deploy exposes those six schedules. The
visible stop is therefore not explained by a deleted schedule. Live recipient
eligibility and last-send receipts could not be confirmed because the verified
AfroTools Supabase project repeatedly terminated SQL connections during this
audit.

## Verified Configuration

- Netlify site: `afrotools` (`8aa543db-b4bd-4631-98f8-221440055c41`)
- Production URL: `https://afrotools.com`
- Resend send key: present in the production Functions environment
- Default sender in code: `AfroTools <hello@afrotools.com>`
- `EMAIL_FROM`: not set in the inspected production environment
- Scheduled functions present: monthly digest, weekly brief, sign-in
  re-engagement, onboarding nudge, activity milestone, and lead follow-up
- Supabase target verified before live attempts:
  `https://zpclagtgczsygrgztlts.supabase.co`
- Supabase SQL/list/advisor calls: blocked by connection timeouts

The production Resend key returned `401` for management-only endpoints. That is
consistent with a narrowly scoped send key, but dashboard access is required to
confirm its exact permissions. No real-recipient campaign was sent during this
audit.

## DNS Snapshot

- Root SPF authorizes Hostinger mail.
- `send.afrotools.com` has Amazon SES SPF and feedback MX records.
- DMARC exists with monitoring policy `p=none`.
- No public record was found for `resend._domainkey.afrotools.com`.
- No public CNAME was found for `links.afrotools.com`,
  `click.afrotools.com`, or `email.afrotools.com`.
- The Resend screenshot explicitly reports shared click tracking.

The exact DKIM selector and custom tracking value must be copied from the
current Resend domain dashboard; they must not be guessed from convention.

## Implemented Recovery Controls

- Global `EMAIL_MARKETING_PAUSED` kill switch.
- Separate optional `EMAIL_MARKETING_FROM` and `EMAIL_REPLY_TO` settings.
- RFC-style one-click unsubscribe headers on marketing messages.
- Resend message tags and accepted-message IDs for cleaner evidence.
- Signed Resend webhook handling for complaints, provider suppressions, and
  permanent bounces.
- Automatic disabling of digest/weekly preferences in both recipient stores.
- Active-recipient segmentation for weekly briefs and activity-only monthly
  digests.
- Same-week and same-month duplicate-send protection.
- One inactivity check-in instead of a repeating reminder loop.
- Four rotating weekly brief formats with one primary action each.
- Shared responsive lifecycle email shell with plain-text fallbacks.

## Required Dashboard Actions

1. Keep marketing paused.
2. In Resend Domains, copy the current SPF/DKIM records exactly and repair any
   unverified record.
3. Add a custom tracking subdomain and publish the exact CNAME Resend supplies.
4. Register `https://afrotools.com/.netlify/functions/resend-webhook` for
   `email.bounced`, `email.complained`, and `email.suppressed`; store its signing
   secret as `RESEND_WEBHOOK_SECRET`.
5. Export/suppress permanent bounces, complaints, and provider-suppressed
   recipients before any restart.
6. Resume in small engaged cohorts and stop again if bounce or complaint rates
   remain elevated.

## Proof Boundaries

- Local syntax, safety tests, lint, type checks, deploy build, deploy artifact
  audit, and security scan: passed.
- Production configuration inventory: verified through Netlify.
- Production recipient counts and last-send receipts: not verified because
  AfroTools Supabase connections timed out.
- Resend dashboard domain/key/webhook state: not verified because an
  authenticated dashboard connector was unavailable.
- Production deployment of this recovery patch: pending.
