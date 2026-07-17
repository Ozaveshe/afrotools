# Prompt 14: Tax Calendar Email Reminders (Pro Feature)

## Context

Read these files first:
- Search for any tax calendar or deadline data in the codebase (country pages may have filing dates)
- `netlify/functions/send-monthly-digest.js` (existing email sending via Resend API)
- `supabase/migrations/006-extend-profiles.sql` (profile schema with email preferences)
- `netlify/functions/email-unsubscribe.js` (unsubscribe handling)
- `assets/js/components/pro-gate.js` (pro feature gating)
- `netlify.toml` (scheduled functions)

Tax filing deadlines are critical dates. Missing them costs businesses penalties. A reminder system that emails users before their country's tax deadlines is a high-value pro feature that practically sells itself.

## Objective

Build a **Tax Calendar Reminder** system:
1. Supabase table with tax deadlines for all 54 countries
2. User subscription to country-specific reminders
3. Scheduled function that sends email reminders 7 days and 1 day before deadlines
4. Dashboard UI to manage reminder preferences
5. Pro-only: email reminders. Free: view calendar only.

### Tax Calendar Data

```sql
CREATE TABLE tax_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,        -- 'NG', 'KE', etc.
  deadline_name TEXT NOT NULL,       -- 'Annual PAYE Filing'
  deadline_date DATE NOT NULL,       -- '2026-03-31'
  deadline_type TEXT NOT NULL,       -- 'paye' | 'vat' | 'corporate' | 'withholding' | 'other'
  authority TEXT,                     -- 'FIRS', 'KRA', 'GRA', etc.
  penalty_info TEXT,                  -- 'Late filing penalty: 10% of tax due + ₦50,000'
  recurring TEXT DEFAULT 'annual',   -- 'annual' | 'quarterly' | 'monthly'
  month_day TEXT,                     -- 'MM-DD' for recurring: '03-31', '01-21'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Reminder Subscriptions

```sql
CREATE TABLE tax_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  deadline_type TEXT DEFAULT 'all',   -- 'all' | 'paye' | 'vat' | 'corporate'
  remind_7_days BOOLEAN DEFAULT true,
  remind_1_day BOOLEAN DEFAULT true,
  remind_on_day BOOLEAN DEFAULT true,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Scheduled Function: `send-tax-reminders`

Runs daily at 7 AM UTC. Checks for deadlines 7 days, 1 day, and 0 days from now. Sends emails to subscribed pro users.

## Constraints

- Only PRO users receive email reminders. Free users can view the calendar page.
- Email sending via Resend API (same as monthly digest)
- Use existing email template patterns from `send-monthly-digest.js`
- RLS: users can only manage their own subscriptions
- Batch emails: max 50 per function invocation (Resend rate limits)
- Include unsubscribe link in every email
- Tax deadline data must be seeded for at least the top 10 countries initially (NG, KE, GH, ZA, EG, TZ, ET, UG, RW, SN)
- Country pages should link to the tax calendar with that country pre-selected
- Follow design system for the calendar UI
- Add the scheduled function to `netlify.toml`

## Implementation Steps

1. Create migration: `supabase/migrations/0XX-tax-calendar.sql`:
   - `tax_calendar` table with indexes on `country_code`, `deadline_date`
   - `tax_reminders` table with RLS policies
   - Seed data for top 10 countries' major deadlines
2. Create `tools/tax-calendar/index.html`:
   - Calendar view (monthly grid showing deadline dots)
   - Country filter dropdown
   - Deadline type filter (PAYE, VAT, Corporate, All)
   - Deadline detail cards with penalty info
   - "Remind Me" button per deadline (pro-gated)
   - Subscription management section (for logged-in pro users)
3. Create `tools/tax-calendar/tax-calendar.js`:
   - Fetch deadlines from Supabase via API
   - Calendar grid rendering (simple month view, no external library)
   - Filter logic
   - Subscription toggle
4. Create `netlify/functions/api-tax-calendar.js`:
   - GET: Return deadlines filtered by country_code and date range
   - POST: Create/update reminder subscription (auth required, pro check)
   - DELETE: Remove subscription
5. Create `netlify/functions/send-tax-reminders.js`:
   - Scheduled: daily at 7 AM UTC
   - Query upcoming deadlines (7 days, 1 day, today)
   - Join with subscriptions to find recipients
   - Filter for pro users only
   - Send via Resend API with deadline details
   - Include: deadline name, date, authority, penalty info, action link to tool
6. Add to `netlify.toml`:
   ```toml
   [functions."send-tax-reminders"]
   schedule = "0 7 * * *"
   ```
7. Add redirect: `/api/tax-calendar /.netlify/functions/api-tax-calendar 200`
8. Add to tool-registry.js
9. Add links from country hub pages to tax calendar filtered by country
10. Run `npm run minify` and `npm run sitemap`

## Verification

- Navigate to `/tools/tax-calendar/` → calendar should render with deadline dots
- Select Nigeria → show NG-specific deadlines
- Click "Remind Me" as free user → pro upsell
- Login as pro → toggle reminder on → check `tax_reminders` table in Supabase
- Manually trigger `send-tax-reminders` function → email received with deadline info
- Click unsubscribe in email → reminder disabled
- Country hub pages should have "View Tax Calendar" link
