# AfroTools Pro Changelog

## 2026-07-13

- New app: AfroSEO Studio — live single-page SEO audits with graded fixes, device-saved history with score deltas, Google preview editor, and schema generators. Free audits (3/day) on `/tools/seo-studio/`, unlimited in `/pro/apps/seo-studio/`.
- Pro workspace home now opens with a "Today" board built from the work you saved across Pro apps (unpaid orders, low stock, RSVPs, vendor balances, payroll review flags, deadlines).
- Pick your business type on the workspace to arrange the app shelf around what you run.
- New app switcher: press Ctrl+K (or the grid button) on any Pro page to jump between apps.
- Status labels across Pro now use plain words — Ready, Early preview, Limited preview, Coming soon.

## 2026-05-13

- Pro activation now writes canonical `profiles` subscription fields from Paystack events.
- Pro checkout plan metadata uses the central `assets/js/lib/pro-plan.js` file.
- `/pro/success/` now waits for profile activation and exposes a safe Paystack replay path.
- `/pro/cancel/` now gives failed or cancelled payments a clean retry path.
- `/pro/settings/billing/` now reads plan, renewal, card summary, and invoice history from the Pro billing API when connected.
- Pro shell apps now include the shared early-access waitlist component.
- Pro gate coverage is generated at `admin/data/pro-gate-coverage.json`.
