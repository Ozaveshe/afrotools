# AfroCreator Studio Pro Brief

Created: 2026-05-02

## Purpose

AfroCreator Studio Pro is the Pro creator business workspace at:

- `/pro/apps/creator-studio/`

It is for African creators, creator teams, managers, freelancers, podcasters, agencies, and brand partnership operators who need a central place to prepare media kits, rate cards, sponsor pitches, campaign calendars, content batches, earnings estimates, and invoice or handoff packets.

The product should feel like paid creator business workflow software, not a single content generator page.

## Current Scope

The first shell includes:

- Media kit.
- Rate card.
- Brand pitch tracker.
- Campaign calendar.
- Content batch.
- Sponsor pipeline.
- Earnings estimate.
- Invoice and handoff pack.

Starter workflows:

- Refresh media kit.
- Update rate card.
- Add brand pitch.
- Create content batch.
- Export handoff pack.

## Linked Existing Creator Tools

The shell links to existing creator tools found in the registry and local routes:

- `/tools/creator-kit/`
- `/tools/creator-pricing/`
- `/tools/creator-invoice/`
- `/tools/creator-desk/`
- `/tools/creator-money/`
- `/tools/creator-analytics/`
- `/tools/creator-calendar/`
- `/tools/creator-schedule/`
- `/tools/creator-brand/`
- `/tools/creator-team/`
- `/tools/creator-captions/`
- `/tools/creator-hooks/`
- `/tools/creator-scripts/`
- `/tools/creator-thumb/`
- `/tools/creator-resize/`
- `/tools/brand-collab-roi/`

Other registry-backed creator tools that can be linked in a future expansion include:

- `/tools/creator-bios/`
- `/tools/creator-canvas/`
- `/tools/creator-carousel/`
- `/tools/creator-clip/`
- `/tools/creator-club/`
- `/tools/creator-course/`
- `/tools/creator-hashtags/`
- `/tools/creator-mail/`
- `/tools/creator-mind/`
- `/tools/creator-page/`
- `/tools/creator-polish/`
- `/tools/creator-record/`
- `/tools/creator-repurpose/`
- `/tools/creator-research/`
- `/tools/creator-split/`
- `/tools/creator-stock/`
- `/tools/creator-titles/`
- `/tools/creator-voice/`

## Data Boundary

Current demo state is browser-only and uses:

- `afrocreator_studio_pro_demo_v1`

The shell stores media-kit checklist rows, rate-card rows, pitch pipeline rows, campaign calendar rows, content batches, sponsor risks, earnings estimate notes, handoff count, and handoff history in localStorage.

The export pack is a browser-generated JSON file. It is not uploaded, account-backed, posted to platforms, sent to sponsors, sent to accounting software, or submitted as an invoice.

## Honest Copy Rules

Keep these rules visible in future iterations:

- AfroCreator Studio Pro may prepare local media kits, rate cards, pitch trackers, content plans, sponsor notes, earnings estimates, and handoff packets.
- AfroCreator Studio Pro does not connect to YouTube, Instagram, TikTok, X, Meta, newsletter, payment, payout, analytics, or ad-platform APIs yet.
- AfroCreator Studio Pro does not post content.
- AfroCreator Studio Pro does not send invoices.
- AfroCreator Studio Pro does not collect sponsor payments.
- AfroCreator Studio Pro does not verify live follower counts, reach, engagement, payouts, campaign status, or platform compliance.
- Local demo rows are not account-backed creator business records.

## Future Schema and API Needed

A production build needs account-backed tables and explicit platform integration boundaries before any live creator-business claims:

- `creator_clients`
- `creator_workspaces`
- `creator_profiles`
- `creator_media_kits`
- `creator_media_kit_sections`
- `creator_rate_cards`
- `creator_rate_card_items`
- `creator_brand_pitches`
- `creator_campaigns`
- `creator_campaign_deliverables`
- `creator_content_batches`
- `creator_content_items`
- `creator_sponsor_pipeline_items`
- `creator_earnings_estimates`
- `creator_invoice_handoff_packs`
- `creator_tool_links`
- `creator_audit_events`

Recommended future integration tables only after OAuth/API work exists:

- `creator_platform_accounts`
- `creator_platform_metrics_snapshots`
- `creator_campaign_metric_reports`
- `creator_payout_snapshots`

Recommended API surface after schema and RLS exist:

- `GET /api/creator-studio?action=dashboard`
- `GET /api/creator-studio?action=workspace`
- `POST /api/creator-studio?action=save_media_kit`
- `POST /api/creator-studio?action=save_rate_card`
- `POST /api/creator-studio?action=save_pitch`
- `POST /api/creator-studio?action=save_campaign`
- `POST /api/creator-studio?action=save_content_batch`
- `POST /api/creator-studio?action=save_earnings_estimate`
- `POST /api/creator-studio?action=create_handoff_pack`

These APIs should require an authenticated Pro account, workspace-level authorization, clear manual-vs-platform-synced source labels, and audit-event writes for every mutation.

## Validation

After changing this shell, run:

```bash
node -e "const fs=require('fs');const html=fs.readFileSync('pro/apps/creator-studio/index.html','utf8');const re=/<script\\b(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)<\\/script>/gi;let m,i=0;while((m=re.exec(html))){const code=m[1].trim();if(!code)continue;i++;new Function(code);}console.log('inline scripts parsed:',i);"
git diff --check
npm run audit
npm run check-links
```
