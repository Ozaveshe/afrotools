# Scholarship Pipeline MVP

This doc describes the first durable scholarship platform layer for AfroTools.

## Scope

The MVP covers:

- source registry
- scholarship ingestion into the auth-side Supabase project
- normalized scholarship records with freshness and provenance
- user saves
- reminder records and queued deadline jobs
- Scholarship Finder and Education Hub trust-state integration

The MVP does not try to scrape the whole web or promise real-time certainty everywhere.

## Live Project Boundary

Scholarship platform data now lives in the auth-side Supabase project alongside user profile and save data.

- Auth project: durable scholarship mirror, user saves, reminders, notification queue
- Data project: upstream structured scholarship catalog used as the primary import source for MVP
- Repo fallback: curated scholarship backup from `assets/js/education-scholarship-feed.js`

Keep repo edits and live project actions separate in notes and summaries.

## Tables

The auth-side Supabase migration `supabase/migrations/022-scholarship-platform.sql` adds:

- `scholarship_sources`
- `scholarship_ingest_runs`
- `scholarship_raw_items`
- `scholarships`
- `user_saved_scholarships`
- `user_scholarship_reminders`
- `scholarship_notification_jobs`
- `scholarship_notification_log`

## Source Strategy

Start with stable sources only. Source definitions now live in
`data/scholarships/official-sources.json`; that file is a source registry, not
a scholarship-row seed file.

- `afrotools-data-catalog`
  - parser key: `data_instance_scholarship_catalog`
  - trust: structured import from the AfroTools data catalog
- `afrotools-curated-backup`
  - parser key: `curated_backup_catalog`
  - trust: curated backup from the repo fallback dataset

MVP rule:

- prefer official pages, APIs, RSS, or structured imports
- only add scrape-heavy sources when they are permitted and operationally sane
- keep every scholarship tied to a source URL, source type, confidence mode,
  and freshness timestamps
- do not create rows from official pages that do not have a reliable parser yet
- for manual-review official pages, record source health/run evidence and leave
  scholarship row creation to a verified parser or curated review flow
- public scholarship-count copy must stay exact until the live API has enough
  active verified or explicitly curated records to support a larger claim

Curated official-link expansion:

- use `node scripts/seed-curated-scholarships.js --dry-run` before seeding live
  rows
- the script checks each official URL and skips dead, errored, and rejected
  links before writing to Supabase
- rows created by this script are intentionally `confidence_mode: curated`,
  `status: unclear`, and `deadline_text: Check official page` unless a parser
  or manual review verifies the current application cycle
- these rows are meant to make the public finder useful at scale without
  pretending every scholarship has a fresh deadline or open status

Stale retirement:

- source-owned rows not seen for 7 days become `unclear` with `manual_review`
  proof level
- source-owned rows not seen for 30 days become inactive
- the repo curated backup is exempt from automatic retirement unless it is
  replaced by a verified source-owned row

## Netlify Functions

Core functions:

- `api-scholarships`
  - serves the normalized feed
  - reports trust mode: `live`, `cached`, `curated`, or `fallback`
  - attaches signed-in save summary when auth is available
- `api-scholarship-saves`
  - list saves
  - save a scholarship
  - unsave a scholarship
- `api-scholarship-reminders`
  - update reminder enablement and offsets
- `scheduled-verify-scholarships`
  - runs scholarship mirror sync every 6 hours
- `scheduled-discover-scholarships`
  - syncs the official source registry every 6 hours without scraping
    manual-review pages
- `scheduled-reconcile-scholarship-deadlines`
  - reconciles saved reminder jobs every 2 hours after deadline/status changes
- `scheduled-send-scholarship-reminders`
  - processes queued reminder jobs hourly

Shared helpers:

- `netlify/functions/_shared/scholarship-platform.js`
- `netlify/functions/_shared/email-adapter.js`
- `netlify/functions/_shared/browser-session-auth.js`

Browser-session hardening:

- scholarship auth refresh now returns cookies through Netlify `multiValueHeaders`
- both `afro_session` and `afro_refresh` are persisted together instead of relying on duplicate-cased header keys

## Browser Contract

`assets/js/education-scholarship-feed.js` is the shared browser contract for Scholarship Finder and Education Hub.

It owns:

- feed loading
- cache fallback
- signed-in save loading
- save / unsave requests
- reminder toggle requests
- local shortlist fallback for guest flows
- dispatching:
  - `afroedu:scholarship-feed-updated`
  - `afroedu:scholarship-saves-updated`

## Reminder Model

Supported deadline offsets:

- 30 days
- 14 days
- 7 days
- 1 day
- same day

Reminder flow:

1. save scholarship
2. upsert deadline reminder record
3. create queued jobs from the deadline date
4. scheduled worker sends due jobs if the email provider is configured
5. write send outcome to `scholarship_notification_log`

Hardening rules:

- reminder jobs are reconciled again after scholarship ingest touches deadline-bearing rows
- sender skips stale jobs if the queued schedule no longer matches the latest scholarship deadline state
- closed, inactive, or deadline-less scholarships do not continue through the reminder sender

## Email Adapter

The MVP adapter uses Resend when `RESEND_API_KEY` is present.

If the provider is missing:

- reminder jobs stay queued
- the worker returns a clean skip result
- UI still behaves honestly about saves and reminder settings

## Trust-State Rules

Scholarship Finder and Education Hub must surface mode honestly:

- `live`
- `cached`
- `curated`
- `fallback`

Do not silently degrade to a narrower or older feed.

## Operations

Typical checks:

- run `scheduled-verify-scholarships` after source or parser changes
- inspect `scholarship_ingest_runs` when feed freshness looks wrong
- inspect `scholarship_notification_jobs` and `scholarship_notification_log` when reminders do not send
- use the configured Supabase MCP server first for live schema or SQL checks

## Phase 2 Ideas

- weekly digest for new matching scholarships
- moderator review queue for uncertain imports
- more official source coverage
- richer provider-specific parsers
- source-level freshness dashboards in admin surfaces
