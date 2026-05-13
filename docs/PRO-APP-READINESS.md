# Pro App Readiness

Updated: 2026-05-13

This matrix is the close-out truth sheet for the 20-app Pro architecture. Payroll is the only fully active Pro app. Other routes may be useful local previews, but they must keep the early-access waitlist and must not promise account sync, official filing, payment execution, legal certification, or private intelligence.

| App | Status | Data backing | Pro gate | Timeline | Close-out decision |
| --- | --- | --- | --- | --- | --- |
| Payroll | Active | Account/profile plus device workspace history | Yes | Ship | Keep as the active Pro app and continue hardening. |
| Tax Compliance | Shell | localStorage/device review data | Yes | Disclaim | Review packet only, not filing or payment proof. |
| Books | Shell | localStorage/device finance records | Yes | Disclaim | Local preview until account-backed Books tables are applied and tested. |
| HR | Shell | localStorage/device HR records | Yes | Disclaim | Local preview until team/member and document storage are verified. |
| Trade Desk | Shell | localStorage/device shipment notes | Yes | Disclaim | Preparation packets only, no customs submission or duty remittance. |
| Legal Desk | Shell | localStorage/device legal intake | Yes | Disclaim | Draft/handoff only, no legal advice, e-signature, or certification. |
| Grants & Tenders | Shell | localStorage/device opportunity pipeline | Yes | Disclaim | Pipeline preview until source/deadline model is live. |
| Creator Studio | Shell | localStorage/device creator workspace | Yes | Disclaim | Separate from public AfroStream data; no account sync claim. |
| Stream Intelligence | Blocked shell | limited public-source review notes | Yes | Sunset unless hardened | Keep private intelligence and account-saved review queues out of copy until verified. |
| Property Projects | Shell | localStorage plus workspace API bridge where available | Yes | Disclaim | Local/project packet only, no escrow, valuation, title, or filing claim. |
| Seller | Shell | localStorage/device commerce records | Yes | Disclaim | Practical local workspace, no hosted storefront, checkout, or payment collection. |
| Events | Shell | localStorage/device event records | Yes | Disclaim | Local ceremony workspace only. |
| Beauty | Shell | localStorage/device booking records | Yes | Candidate | Priority daily OS candidate, but still no automated payment or message send claim. |
| Food & Kitchen | Shell | localStorage/device menu and stock records | Yes | Disclaim | Local costing and prep workspace only. |
| Field Service | Shell | localStorage/device job records | Yes | Disclaim | Quote/job-card workspace only, no live dispatch or payment collection. |
| School & Academy | Shell | localStorage/device school records | Yes | Disclaim | Local record workspace only, no parent portal claim. |
| Clinic Desk | Shell | localStorage/device admin records | Yes | Disclaim | Administrative only, not medical advice or diagnosis. |
| Faith & Community | Shell | localStorage/device community records | Yes | Disclaim | Local community admin workspace only. |
| Agri FarmOps | Shell | localStorage/device farm records | Yes | Disclaim | Seasonal record workspace only. |
| Life Admin | Shell | localStorage/device family records | Yes | Disclaim | Family admin workspace only, no official document storage guarantee. |

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
