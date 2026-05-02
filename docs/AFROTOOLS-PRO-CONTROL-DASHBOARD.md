# AfroTools Pro Control Dashboard

Updated: 2026-05-02

## Purpose

`/pro/workspace/` is the shared operating console for AfroTools Pro. It should route users into Pro apps, show honest build status, surface real AfroPayroll state where available, and avoid implying that shell apps have live data or production schemas.

The directory route `/pro/apps/` is the dense app index. It reads `assets/js/lib/pro-app-registry.js` for the control/compliance apps, `assets/js/lib/pro-daily-os-registry.js` for the daily operating system expansion, and `assets/js/lib/pro-architecture.js` for the combined 20-app architecture summary.

## Route Inventory

| Route | Status | Notes |
| --- | --- | --- |
| `/pro/` | Found | Public Pro plan page. Primary product CTA should open `/pro/workspace/`; secondary CTA opens `/pro/apps/`. |
| `/pro/workspace/` | Found | Pro-gated control dashboard and app launcher. |
| `/pro/apps/` | Found | Pro-gated app directory generated from the registry. |
| `/pro/apps/payroll/` | Found | Most mature Pro app. Reads cloud payroll dashboard and browser-local payroll state. |
| `/pro/apps/tax-compliance/` | Found | Shell route. Local workflow state only; shared tax schema needed. |
| `/pro/apps/books/` | Found | Shell route. Local demo finance state only; ledger schema needed. |
| `/pro/apps/hr/` | Found | Coming-online shell. Reads browser-local payroll employee master records where present. |
| `/pro/apps/trade-desk/` | Found | Shell route. Browser-local trade operations state only; private trade workspace schema needed. |
| `/pro/apps/legal/` | Found | Current AfroLegal Desk Pro shell and compatibility target. |
| `/pro/apps/legal-desk/` | Found | Expected registry route. This route forwards to `/pro/apps/legal/`. |
| `/pro/apps/grants-tenders/` | Found | Grants and Tenders OS shell. |
| `/pro/apps/creator-studio/` | Found | AfroCreator Studio Pro shell. |
| `/pro/apps/stream-intelligence/` | Found | Blocked planning shell. It is intentionally not active until source, inference, and user-edit boundaries exist. |
| `/pro/apps/property-projects/` | Found | AfroProperty and Project OS shell. |
| `/pro/vault/` | Found | Shared Pro backbone shell for packets, documents, and local/cloud labels. |
| `/pro/team/` | Found | Shared Pro backbone shell for roles, members, invites, clients, and permissions placeholders. |
| `/pro/settings/` | Found | Shared Pro backbone shell for profile, Pro status, language, country, currency, and privacy preferences. |
| `/tools/afropayroll-os/support.html` | Found | Gated read-only Payroll country-pack support console. |

## Daily OS Route Inventory

| Route | Status | Notes |
| --- | --- | --- |
| `/pro/apps/daily-os/` | Found | Hub for the ten daily operating system shells and agent prompts. |
| `/pro/apps/seller/` | Found | AfroSeller Social Commerce OS shell. |
| `/pro/apps/events/` | Found | AfroEvents & Ceremony OS shell. |
| `/pro/apps/beauty/` | Found | AfroBeauty Booking OS shell. |
| `/pro/apps/food-kitchen/` | Found | AfroFood & Kitchen OS shell. |
| `/pro/apps/field-service/` | Found | AfroFix Field Service OS shell. |
| `/pro/apps/school-academy/` | Found | AfroSchool & Academy OS shell. |
| `/pro/apps/clinic-desk/` | Found | AfroClinic Desk Pro admin-only shell. |
| `/pro/apps/faith-community/` | Found | AfroFaith & Community OS shell. |
| `/pro/apps/agri-farmops/` | Found | AfroAgri FarmOps & Co-op OS shell. |
| `/pro/apps/life-admin/` | Found | AfroLife Admin & Diaspora OS shell. |

## App Status

| App ID | Route | Route status | Product status | Data status |
| --- | --- | --- | --- | --- |
| `payroll` | `/pro/apps/payroll/` | active | Live workspace | Real cloud data through `/api/afropayroll?action=dashboard` when synced, plus browser-local payroll saves. |
| `tax-compliance` | `/pro/apps/tax-compliance/` | needs schema | Needs schema | Local shell state only. |
| `books` | `/pro/apps/books/` | setup needed | Setup needed | Local demo finance state only. |
| `hr` | `/pro/apps/hr/` | coming online | Coming online | Reads browser-local payroll employee master records; does not mutate payroll storage automatically. |
| `trade-desk` | `/pro/apps/trade-desk/` | shell | Local shell | Route exists with browser-local shell state; no Pro data store yet. |
| `legal-desk` | `/pro/apps/legal-desk/` | shell | Shell | Expected route exists and forwards to `/pro/apps/legal/`; browser-local legal shell state only. |
| `grants-tenders` | `/pro/apps/grants-tenders/` | shell | Shell | Route exists with browser-local opportunity shell state. |
| `creator-studio` | `/pro/apps/creator-studio/` | shell | Shell | Route exists with browser-local creator workspace shell state. |
| `stream-intelligence` | `/pro/apps/stream-intelligence/` | needs schema | Needs schema | Route exists as a blocked planning shell; no private intelligence queue is wired. |
| `property-projects` | `/pro/apps/property-projects/` | shell | Shell | Route exists with browser-local property project shell state. |

## Shared Registry Contract

The registry exports `window.AfroTools.proAppRegistry` and `window.AfroProAppRegistry`.

It must expose:

- `getApps()`
- `getApp(id)`
- `getRoutes()`
- `getSupportRoutes()`
- `getStatusCounts()`
- `getBuildSummary()`
- `safeRoute(item)`

The app list must remain exactly these ten IDs:

- `payroll`
- `tax-compliance`
- `books`
- `hr`
- `trade-desk`
- `legal-desk`
- `grants-tenders`
- `creator-studio`
- `stream-intelligence`
- `property-projects`

## Daily OS Registry Contract

The daily expansion registry exports `window.AfroTools.proDailyOsRegistry` and `window.AfroProDailyOsRegistry`.

It must expose:

- `getApps()`
- `getApp(id)`
- `getPriorityApps()`
- `getSharedBackbone()`
- `getBuildSummary()`
- `getAgentPrompts()`
- `buildAgentPrompt(idOrApp)`
- `safeRoute(app)`

The daily app list must remain these ten IDs unless the product strategy changes:

- `seller`
- `events`
- `beauty`
- `food-kitchen`
- `field-service`
- `school-academy`
- `clinic-desk`
- `faith-community`
- `agri-farmops`
- `life-admin`

## 20 App Architecture Contract

The combined architecture helper exports `window.AfroTools.proArchitecture` and `window.AfroProArchitecture`.

It must expose:

- `getControlApps()`
- `getDailyApps()`
- `getBackboneRoutes()`
- `getApps()`
- `getApp(id)`
- `getGroups()`
- `getRouteManifest()`
- `getSummary()`
- `isReadyForTwentyApps()`
- `safeRoute(item)`

The Pro dashboard and app directory must load the architecture helper after both registries. The dedicated verification command is:

```powershell
npm run pro:verify
```

## Real Data Surfaces

- Pro entitlement: `window.AfroProGate.getStatus({ fresh: true })`
- Payroll cloud dashboard: `/api/afropayroll?action=dashboard`
- Payroll cloud clients and runs returned by that dashboard endpoint
- Payroll country-pack support console reads repo-owned country pack metadata and local engine availability

## Local-Only Surfaces

- Payroll saved runs: `afropayroll_pro_saved_runs`
- Payroll draft: `afropayroll_pro_workspace_preview`
- Payroll employee master: `afropayroll_pro_employee_master`
- Tax compliance shell local workflow state
- Books shell local demo finance state
- HR shell local onboarding, leave, document, and handoff state
- Trade Desk shell local trade operations state
- Legal Desk shell local document, entity, reminder, and review state
- Grants and Tenders shell local opportunity, deadline, document, and review state
- Creator Studio shell local media kit, rate card, pitch, campaign, and handoff state
- Stream Intelligence blocked shell planning state; no private queue is wired
- Property Projects shell local budget, contractor, procurement, rental, document, and milestone state
- Daily OS shell checkpoints under `afropro_daily_os_<app-id>_checkpoint_v1`

Local state is useful operational context, but it is not cloud sync proof.

## Future Supabase Schemas Needed

- Cross-app Pro vault for shared files, packets, and references
- Account-backed Pro team membership, roles, invites, settings, and preference schemas behind the shared backbone routes
- Tax filing calendar, source-review, evidence pack, and reviewer sign-off schema
- Books ledger, invoice, expense, journal, close-pack, and accounting export schema
- HR profile, onboarding, document, leave, and payroll-readiness schema separate from salary rows
- Trade scenarios, shipment records, duties, supplier files, and FX watchlist schema
- Legal document packets, clause notes, review events, and storage boundaries
- Grants and tenders opportunity pipeline, requirements matrix, deadlines, and reviewer workflow
- Creator workspace private asset/task schema
- Stream intelligence queue with source/inference/user-edit boundaries
- Property project, contractor, milestone, budget, and document schema
- Daily OS shared records, reminders, approvals, vault, portal, WhatsApp template, payment note, and report schema

## Data Honesty Rules

- Payroll may show real account-backed data from `/api/afropayroll` and real browser-local data from the AfroPayroll local storage keys.
- Non-payroll apps must stay marked as shells until their route, schema, and data contract exist.
- Missing app routes should display their intended path but use a safe fallback link to `/pro/apps/` or `/pro/workspace/`; current control-app routes all have at least a shell or alias.
- The country-pack support console is read-only. It does not mutate live database pack versions.
- No Pro surface should claim filing, salary disbursement, bank sync, accounting posting, or legal/tax certification unless that flow exists and is verified.

## Validation

After changing the registry, directory, dashboard, or app navigation:

```powershell
node --check assets/js/lib/pro-app-registry.js
node --check assets/js/lib/pro-daily-os-registry.js
node --check assets/js/lib/pro-daily-os-shell.js
node --check assets/js/lib/pro-architecture.js
npm run pro:verify
```

Parse inline scripts for:

- `pro/workspace/index.html`
- `pro/apps/index.html`
- `pro/index.html`
- Any Pro app page touched in the same pass

Then run route HTTP checks for existing routes and:

```powershell
git diff --check -- <touched files>
npm run audit
npm run check-links
```
