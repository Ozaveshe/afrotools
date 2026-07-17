# Prompt 02: Email Leads Schema Upgrade

## Context

Read these files first:
- `supabase/migrations/009-email-leads.sql` (current schema)
- `netlify/functions/capture-lead.js` (lead capture endpoint)
- `assets/js/components/email-gate.js` (PDF gate modal)
- `assets/js/components/newsletter-cta.js` (newsletter signup)
- `docs/PLATFORM_STANDARDS.md` (form schema)

Current `email_leads` table only captures: `id`, `email`, `source`, `tool_slug`, `opt_in_digest`, `created_at`. This is insufficient for attribution, segmentation, and sales.

## Objective

Upgrade the email leads system to capture richer data for attribution, segmentation, and lifecycle marketing.

### Schema Changes (New Columns)

Add these columns to `email_leads`:
```sql
country_code       TEXT,            -- ISO 3166-1 alpha-2 (from tool context)
currency           TEXT,            -- ISO 4217 (from tool context)
device_type        TEXT,            -- 'mobile' | 'tablet' | 'desktop'
referrer_url       TEXT,            -- document.referrer at capture time
utm_source         TEXT,            -- from URL params
utm_medium         TEXT,            -- from URL params
utm_campaign       TEXT,            -- from URL params
utm_content        TEXT,            -- from URL params
name               TEXT,            -- from email gate form (if provided)
company            TEXT,            -- from email gate form (if provided)
role               TEXT,            -- from email gate form (if provided)
industry           TEXT,            -- new field to add to email gate form
company_size       TEXT,            -- new field: '1-10' | '11-50' | '51-200' | '201-500' | '500+'
page_url           TEXT,            -- full URL where lead was captured
conversion_value   NUMERIC,         -- gross salary or primary input value (for lead scoring)
```

### Form Changes

Update the email gate modal to add two optional fields:
- **Industry** — dropdown: Technology, Finance/Banking, Construction, Agriculture, Healthcare, Education, Government, Retail/Trade, Manufacturing, Energy/Mining, Legal, Other
- **Company Size** — dropdown: 1-10, 11-50, 51-200, 201-500, 500+

These fields must be optional (not required) to avoid increasing form abandonment.

## Constraints

- Use Supabase migration pattern: create a new migration file `supabase/migrations/0XX-enrich-email-leads.sql` (use next available number)
- All new columns must be nullable (ALTER TABLE ADD COLUMN ... DEFAULT NULL)
- The `capture-lead.js` function must handle both old format (email+source) and new enriched format
- Email gate modal must follow existing design system: use `--color-*` and `--size-*` CSS tokens
- Do NOT break existing Netlify Forms submissions — the `pdf-leads` form-name and existing hidden fields must remain unchanged
- UTM params should be parsed from `window.location.search` client-side and sent with the capture request
- Device type detection: use `window.innerWidth` breakpoints (< 768 = mobile, < 1024 = tablet, else desktop)
- Keep RLS policies: the `email_leads` table should remain insert-only for anonymous users, select for service role only

## Implementation Steps

1. Create migration file: `supabase/migrations/0XX-enrich-email-leads.sql`
   - ALTER TABLE to add all new columns
   - Add index on `country_code` and `utm_source` for segmentation queries
2. Update `netlify/functions/capture-lead.js`:
   - Accept new fields from request body
   - Sanitize/validate: trim strings, validate country_code against known list, cap string lengths
   - Insert enriched record
3. Update `assets/js/components/email-gate.js`:
   - Add Industry dropdown (optional)
   - Add Company Size dropdown (optional)
   - Collect UTM params from URL
   - Collect device_type, referrer_url, page_url
   - Send all enriched data to `/api/capture-lead`
4. Update `assets/js/components/newsletter-cta.js`:
   - Capture UTM params, device_type, referrer, page_url alongside email
   - Send to `/api/capture-lead` with source='newsletter-cta'
5. Update the hidden fields in Netlify Forms to include new data for backup capture
6. Run `npm run minify` for updated JS components

## Verification

- Trigger PDF download on any tool → email gate should show Industry and Company Size dropdowns
- Submit the form → check Supabase `email_leads` table for enriched columns
- Visit a page with `?utm_source=twitter&utm_medium=social` → submit email gate → confirm UTM data saved
- Test on mobile viewport → confirm `device_type` = 'mobile'
- Test newsletter CTA submission → confirm enriched data captured
- Verify old-format submissions (just email+source) still work without errors
