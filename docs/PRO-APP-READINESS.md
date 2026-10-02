# Pro App Readiness

Updated: 2026-10-02

This matrix describes the 21 app routes in the current Pro registries: 11 control/growth apps and 10 daily OS apps. Payroll and SEO Studio have `active` route status. Payroll has account-backed workspace code; SEO Studio combines server-side audits with device-saved work. An active route or passing repository check does not prove live account access, provider configuration, or production readiness.

Shell and limited-preview routes must retain their truthful readiness labels and early-access waitlist. They must not promise unverified account sync, official filing, payment execution, legal certification, or private intelligence.

Commercial product strategy for the original 20 apps lives in `docs/AFROTOOLS-PRO-APP-PRODUCT-BRIEFS.md`. Use that brief for market references, unique selling points, sellable packaging, and app-specific improvement priorities. Current route membership and status come from `assets/js/lib/pro-app-registry.js` and `assets/js/lib/pro-daily-os-registry.js`; this matrix records their implementation boundaries, not a live certification.

| App | Status | Data backing | Pro gate | Timeline | Close-out decision |
| --- | --- | --- | --- | --- | --- |
| Payroll | Active | Account/profile plus device workspace history | Yes | Maintain | Continue hardening; verify live account access and provider behavior separately. |
| Tax Compliance | Shell | localStorage/device review data | Yes | Disclaim | Review packet only, not filing or payment proof. |
| Books | Shell | localStorage/device finance records | Yes | Disclaim | Local preview until account-backed Books tables are applied and tested. |
| HR | Shell | localStorage/device HR records | Yes | Disclaim | Local preview until team/member and document storage are verified. |
| Trade Desk | Shell | localStorage/device shipment notes | Yes | Disclaim | Preparation packets only, no customs submission or duty remittance. |
| Legal Desk | Shell | localStorage/device legal intake | Yes | Disclaim | Draft/handoff only, no legal advice, e-signature, or certification. |
| Grants & Tenders | Shell | localStorage/device opportunity pipeline | Yes | Disclaim | Pipeline preview until source/deadline model is live. |
| Creator Studio | Shell | localStorage/device creator workspace | Yes | Disclaim | Separate from public AfroStream data; no account sync claim. |
| Stream Intelligence | Limited preview | Public-source review notes | Yes | Disclaim | Keep private intelligence and account-saved review queues out of copy until verified. |
| SEO Studio | Active | Server-side page audits plus device-saved projects and history | Yes | Maintain | Account-synced history and multi-page crawling are not established by this status; verify server execution separately. |
| Property Projects | Shell | localStorage plus workspace API bridge where available | Yes | Disclaim | Local/project packet only, no escrow, valuation, title, or filing claim. |
| Seller | Shell | localStorage/device commerce records | Yes | Disclaim | Practical local workspace, no hosted storefront, checkout, or payment collection. |
| Events | Shell | localStorage/device event records | Yes | Disclaim | Local ceremony workspace only. |
| Beauty | Shell | Device-saved concept checkpoint | Yes | Candidate | Review the proposed workflow; no booking records, reminders, payments, messaging or portal. |
| Food & Kitchen | Shell | Device-saved concept checkpoint | Yes | Disclaim | Review the proposed workflow; no menu or stock records, reminders, payments, messaging or portal. |
| Field Service | Shell | Device-saved concept checkpoint | Yes | Disclaim | Review the proposed workflow; no job records, dispatch, payments, messaging or portal. |
| School & Academy | Shell | Device-saved concept checkpoint | Yes | Disclaim | Review the proposed workflow; no school records, reminders, payments, messaging or portal. |
| Clinic Desk | Shell | Device-saved concept checkpoint | Yes | Disclaim | Review the proposed workflow; no patient or administrative records, reminders, payments, messaging or portal. |
| Faith & Community | Shell | localStorage/device community records | Yes | Disclaim | Local community admin workspace only. |
| Agri FarmOps | Shell | Device-saved concept checkpoint | Yes | Disclaim | Review the proposed workflow; no farm records, reminders, payments, messaging or portal. |
| Life Admin | Shell | Device-saved concept checkpoint | Yes | Disclaim | Review the proposed workflow; no family records, reminders, payments, messaging or portal. |

## Shared Backbone

| Route | Status | Data backing | Pro gate | Decision |
| --- | --- | --- | --- | --- |
| `/pro/workspace/` | Active control surface | Pro registries plus profile status | Yes | Daily landing for active Pro users. |
| `/pro/vault/` | Active shell | Current session/device/account labels | Yes | Keep honest about local versus cloud-backed records. |
| `/pro/team/` | Active shell | Current user only | Yes | No fake invites or members. |
| `/pro/settings/` | Active shell | Profile read-only | Yes | Keep as profile/status/preferences view. |
| `/pro/settings/billing/` | Active support surface | Profile plus Paystack subscription when connected | Yes | Safe self-service read, support review for risky changes. |

## Validation

```powershell
npm run pro:verify
node scripts/audit-pro-gate-coverage.js
```
