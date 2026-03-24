# Prompt 21: Predictive Alerts & Rate Change Notifications

## Context

Read these files first:
- `netlify/functions/api-alerts.js` (existing alerts system — if it exists)
- `netlify/functions/scheduled-fetch-forex-rates.js` (forex data fetching)
- `netlify/functions/scheduled-fetch-fuel-prices.js` (fuel data fetching)
- `netlify/functions/scheduled-fetch-central-bank-rates.js` (rate data fetching)
- `data/forex/` (historical forex data)
- `data/fuel/` (historical fuel data)
- `data/rates/` (historical rate data)
- `supabase/migrations/` (existing tables)
- `netlify/functions/send-monthly-digest.js` (email sending reference)

The scheduled functions already fetch live data. But users can't set alerts for when rates cross thresholds. Adding price alerts turns casual users into daily active users who check AfroTools whenever they get a notification.

## Objective

Build a **Rate Alert System** where users set target prices/rates and get notified (email + browser push) when those targets are hit.

### Alert Types

1. **Forex Alert**: "Notify me when USD/NGN crosses ₦1,600"
2. **Fuel Alert**: "Notify me when petrol in Nigeria drops below ₦700/litre"
3. **Interest Rate Alert**: "Notify me when CBN changes the MPR"
4. **Tax Change Alert**: "Notify me when Nigeria PAYE rates change" (manual, admin-triggered)

### New Table: `user_alerts`

```sql
CREATE TABLE user_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,            -- 'forex' | 'fuel' | 'interest_rate' | 'tax_change'

  -- Forex-specific
  currency_pair TEXT,                   -- 'USD/NGN'

  -- Common
  country_code TEXT,
  target_value NUMERIC,                -- threshold value
  direction TEXT,                       -- 'above' | 'below' | 'any_change'
  current_value_at_creation NUMERIC,   -- value when alert was set

  -- State
  enabled BOOLEAN DEFAULT true,
  triggered BOOLEAN DEFAULT false,
  triggered_at TIMESTAMPTZ,
  triggered_value NUMERIC,

  -- Notification preferences
  notify_email BOOLEAN DEFAULT true,
  notify_push BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '90 days')
);
```

### Alert Check Flow

```
Scheduled data fetch (forex/fuel/rates)
  → After fetching new data, check all active alerts for that data type
  → For each matched alert:
     → Mark as triggered
     → Send email notification
     → Send push notification (if enabled and subscription exists)
     → Auto-disable alert (one-shot) or keep active (recurring)
```

### Push Notifications

Use the Web Push API (service worker already exists):
- On alert creation, request push permission
- Store push subscription in `push_subscriptions` table
- Send via web-push library from Netlify function

## Constraints

- Pro feature: free users get 2 active alerts, pro users get 20
- Alerts auto-expire after 90 days (prevent stale alerts)
- One-shot by default: alert triggers once, then disables. User can set recurring.
- Email notifications via Resend API (same as digest)
- Push notifications via web-push npm package
- Alert checking happens IN the scheduled fetch functions (not a separate job) — after data is fetched, check alerts
- RLS: users can only CRUD their own alerts
- Max 20 alerts per user (prevent abuse)
- Alert creation requires authentication
- Follow design system for alert management UI
- Show current rate alongside alert threshold input (so user knows where the market is)
- Visual: percentage distance from target shown as progress bar

## Implementation Steps

1. Create migration: `supabase/migrations/0XX-user-alerts.sql`:
   - `user_alerts` table with RLS
   - `push_subscriptions` table (user_id, subscription JSONB, created_at)
   - Indexes on alert_type, enabled, user_id
2. Create `netlify/functions/api-alerts.js`:
   - GET: List user's alerts (auth required)
   - POST: Create new alert (auth required, pro check for limit)
   - PUT: Update alert (enable/disable/modify)
   - DELETE: Remove alert
3. Update scheduled fetch functions to check alerts after data refresh:
   - `scheduled-fetch-forex-rates.js`: after storing new rates, query `user_alerts WHERE alert_type='forex' AND enabled=true`, check if any target values are crossed
   - `scheduled-fetch-fuel-prices.js`: same for fuel alerts
   - `scheduled-fetch-central-bank-rates.js`: same for rate alerts
   - For each triggered alert: call notification function
4. Create `netlify/functions/send-alert-notification.js`:
   - Accept alert data + user info
   - Send email via Resend with alert details + current value + link to tool
   - Send push notification if subscription exists
   - Mark alert as triggered in database
5. Add push notification support:
   - Update `service-worker.js` to handle push events
   - Create `assets/js/lib/push-notifications.js` for subscription management
   - Request permission during alert creation flow
6. Create alert management UI:
   - Add `/dashboard/alerts/` section
   - "Create Alert" form with type-specific fields
   - Active alerts list with enable/disable toggle
   - Triggered alerts history
   - Current value vs target visualization
7. Add alert creation shortcut to tool pages:
   - On forex page: "Set Alert" button next to current rate
   - On fuel page: "Alert me when price changes" button
8. Add redirects: `/api/alerts /.netlify/functions/api-alerts 200`
9. Run `npm run minify`

## Verification

- Login → navigate to dashboard alerts → create forex alert "USD/NGN above 1600"
- Check `user_alerts` table → alert exists with correct data
- Simulate rate crossing threshold (manually update data) → trigger scheduled function
- Email received with alert details
- Push notification received (if permission granted)
- Alert marked as triggered in database
- Try creating 3rd alert as free user → pro upsell
- Expired alerts (>90 days) should auto-disable
- Dashboard shows alert history with triggered timestamps
