# AfroTools Pro Changelog

## 2026-05-13

- Pro activation now writes canonical `profiles` subscription fields from Paystack events.
- Pro checkout plan metadata uses the central `assets/js/lib/pro-plan.js` file.
- `/pro/success/` now waits for profile activation and exposes a safe Paystack replay path.
- `/pro/cancel/` now gives failed or cancelled payments a clean retry path.
- `/pro/settings/billing/` now reads plan, renewal, card summary, and invoice history from the Pro billing API when connected.
- Pro shell apps now include the shared early-access waitlist component.
- Pro gate coverage is generated at `admin/data/pro-gate-coverage.json`.
