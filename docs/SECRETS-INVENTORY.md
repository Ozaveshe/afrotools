# Secrets Inventory - 2026-05-13

## Scope

Checked tracked source/config/doc text with a narrowed secret-pattern grep on 2026-05-13, excluding generated `dist/`, test output, large data pools, and binary assets.

## Findings

- No literal Supabase service-role key, Paystack secret key, Stripe live key, or comparable production secret was found in tracked source.
- Browser Supabase anon keys are present in public auth/client scripts. These are publishable anon keys, not service-role secrets.
- Netlify functions reference service keys through environment variables only, including `SUPABASE_AUTH_SERVICE_KEY`, `SUPABASE_DATA_SERVICE_ROLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and legacy `SUPABASE_SERVICE_KEY`.
- Paystack server code references `PAYSTACK_SECRET_KEY` through environment variables only.
- Documentation and local skill files include placeholder examples such as `<service-role-key-from-secret-store>`, `sk_test_...`, and `sk_live_...`.

## Required Secret Locations

- Supabase service-role keys: Netlify environment variables only.
- Paystack secret key: Netlify environment variable only.
- Stripe secret key, if used by checkout routes: Netlify environment variable only.
- Public Supabase anon keys: allowed in browser code, but should remain scoped by RLS and project policy.

## Release Note

`npm run security:scan` remains the release gate for accidental source leakage, and `npm run audit:dist` verifies the deploy artifact excludes repo internals.
