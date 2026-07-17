# B2B Lead Capture Workflow

AfroTools business enquiries use a server-side Netlify function. Do not write B2B leads directly from browser Supabase clients.

## Public Flow

- Page: `/business-enquiry/`
- Embedded buyer forms: `/sponsored-tools/#sponsorship-request`, `/custom-calculators/#calculator-request`, `/media-kit/#media-kit-request`
- Component: `assets/js/components/b2b-enquiry-form.js`
- Function route: `/api/b2b-enquiry`
- Function source: `netlify/functions/capture-b2b-lead.js`
- Storage target: `public.data_buyer_leads`

The form supports these offer types:

- Widget demo request
- Widget Pro enquiry
- Sponsored tool enquiry
- Custom calculator request
- API pilot request
- Media kit request
- White-label request
- Business subscription enquiry

## Captured Fields

The browser sends company, name, email, website, country, prospect type, requested offer, relevant tool or use case, message, and explicit consent.

Commercial CTA context is also preserved when available:

- `offer`
- `tool` or relevant tool/use case
- `source_path`
- `source_route`
- `prospect_segment`
- `cta_type`
- safe referrer URL, stripped to origin and path in the browser helper
- UTM source, medium, campaign, and content

When a commercial page embeds the shared form directly, set `data-b2b-enquiry-form`, `data-source`, and any `data-default-offer` values on the `<form>`. Keep hidden `source_path`, `source_route`, and `cta_type` fields aligned with the public route so `/api/b2b-enquiry` receives the same attribution as the standalone `/business-enquiry/` page.

The Netlify function validates the payload, rate limits by connection, hashes the client IP, normalizes offer/prospect aliases, accepts JSON and URL-encoded fallback form submissions, and writes with a server-side Supabase service key.

## Storage Compatibility

The function first attempts to write enriched columns added by `supabase/migrations/046-b2b-commercial-enquiry-fields.sql`.

The enriched schema includes route/source fields for 50K commercial attribution, including `source_path`, `source_route`, `cta_type`, `prospect_segment`, `page_url`, `referrer_url`, UTM metadata, user agent, and hashed IP. If the live table does not have those columns yet, the function falls back to the base schema and stores the key context inside the structured `use_case` text.

If the live table has not been upgraded yet, the function retries using the existing `data_buyer_leads` schema:

- `company`
- `contact_name`
- `contact_email`
- `use_case` as a structured text envelope
- `verticals` for prospect type
- `countries` for country
- `delivery_format` for requested offer
- `consent`
- `review_status`

This keeps the lead path usable before the migration is applied, while still giving a replayable schema upgrade for cleaner reporting.

## Live Supabase Boundary

Repo work does not apply the migration. To upgrade live storage:

1. Use the configured Supabase MCP first for live schema inspection.
2. Confirm `public.data_buyer_leads` exists in the target AUTH/marketing project.
3. Apply `supabase/migrations/046-b2b-commercial-enquiry-fields.sql`.
4. Run Supabase security advisors and record any remaining owner-level findings separately.

## Validation

After changes to this flow, run:

```bash
node --check netlify/functions/capture-b2b-lead.js
node --check assets/js/components/b2b-enquiry-form.js
npm run security:scan
```

For browser proof, open `/business-enquiry/?offer=widget-demo&prospect=hr-payroll&source=widgets&tool=nigeria-paye`, confirm the form preselects the offer, and submit against a mocked or deployed `/api/b2b-enquiry` endpoint.
