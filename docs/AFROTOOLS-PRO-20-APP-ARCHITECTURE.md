# AfroTools Pro 20 App Architecture

Updated: 2026-05-02

## Purpose

AfroTools Pro now has a 20-app architecture:

- 10 control and compliance apps
- 10 daily operating system apps
- Shared backbone routes for Vault, Team, Settings, and Payroll support

The goal is one Pro dashboard that can launch every app, stay honest about data readiness, and scale without each future agent inventing its own navigation or storage model.

## Architecture Spine

| Layer | File | Responsibility |
| --- | --- | --- |
| Control registry | `assets/js/lib/pro-app-registry.js` | Payroll, tax, books, HR, trade, legal, grants, creator, stream, and property app metadata. |
| Daily OS registry | `assets/js/lib/pro-daily-os-registry.js` | Seller, events, beauty, food, field service, school, clinic, faith, agri, and life-admin app metadata. |
| Architecture helper | `assets/js/lib/pro-architecture.js` | Combines both registries and backbone routes into one 20-app architecture API. |
| Shared dashboard | `pro/workspace/index.html` | Main Pro operating dashboard. |
| App directory | `pro/apps/index.html` | Dense route/status view for all Pro apps. |
| Verification gate | `scripts/verify-pro-architecture.js` | Checks IDs, counts, routes, Pro gates, aliases, and dashboard loader wiring. |

## Runtime Contract

`assets/js/lib/pro-architecture.js` exports:

- `window.AfroTools.proArchitecture`
- `window.AfroProArchitecture`

Required methods:

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

## UX Behavior Model

The public homepage stays primarily about free AfroTools discovery. Pro should remain discoverable through the shared navbar and contextual Pro links, not through a large homepage sales section.

Guest users:

- Navbar shows a quiet `Pro` link to `/pro/`.
- `/pro/` explains pricing, current Pro value, and account requirements.
- Pro-gated routes stay locked behind `assets/js/pro-gate.js` and link guests to sign in or view Pro.

Logged-in free users:

- Navbar shows a restrained `Upgrade` entry that points to `/pro/`.
- Upgrade prompts should appear only near Pro-gated features or plan decisions.
- The workspace and app directory must not render as if Pro access is active.

Logged-in Pro users:

- Navbar shows `Continue Pro work` and points directly to `/pro/workspace/`.
- `/pro/` should still show pricing and value, but its account status block points active users toward `/pro/workspace/`.
- `/pro/workspace/` is the SaaS start screen: work queue, app entry points, Vault, Team, Settings, recent activity, account status, and ready/local/schema labels.
- `/pro/apps/` remains the dense 20-app directory and should not become the main workspace.

## App Universe

### Control Apps

| App ID | Route | Status |
| --- | --- | --- |
| `payroll` | `/pro/apps/payroll/` | Active workspace |
| `tax-compliance` | `/pro/apps/tax-compliance/` | Shell |
| `books` | `/pro/apps/books/` | Shell |
| `hr` | `/pro/apps/hr/` | Shell |
| `trade-desk` | `/pro/apps/trade-desk/` | Shell |
| `legal-desk` | `/pro/apps/legal/` | Shell, with `/pro/apps/legal-desk/` alias |
| `grants-tenders` | `/pro/apps/grants-tenders/` | Shell |
| `creator-studio` | `/pro/apps/creator-studio/` | Shell |
| `stream-intelligence` | `/pro/apps/stream-intelligence/` | Blocked shell |
| `property-projects` | `/pro/apps/property-projects/` | Shell |

### Daily Operating Systems

| App ID | Route | Status |
| --- | --- | --- |
| `seller` | `/pro/apps/seller/` | Daily OS shell |
| `events` | `/pro/apps/events/` | Daily OS shell |
| `beauty` | `/pro/apps/beauty/` | Daily OS shell |
| `food-kitchen` | `/pro/apps/food-kitchen/` | Daily OS shell |
| `field-service` | `/pro/apps/field-service/` | Daily OS shell |
| `school-academy` | `/pro/apps/school-academy/` | Daily OS shell |
| `clinic-desk` | `/pro/apps/clinic-desk/` | Daily OS shell |
| `faith-community` | `/pro/apps/faith-community/` | Daily OS shell |
| `agri-farmops` | `/pro/apps/agri-farmops/` | Daily OS shell |
| `life-admin` | `/pro/apps/life-admin/` | Daily OS shell |

## Backbone Routes

| Route | Scope |
| --- | --- |
| `/pro/vault/` | Packets, documents, payslips, invoices, compliance packs, local/cloud labels. |
| `/pro/team/` | Roles, current user, invite placeholder, client placeholder, permission model. |
| `/pro/settings/` | Pro status, profile display, language, country, currency, privacy preferences. |
| `/tools/afropayroll-os/support.html` | Payroll country-pack health support console. |

## Data Boundary

Most apps are shells. They may use browser-local state, route-specific demo data, or localStorage checkpoints. They must not claim:

- official filing
- salary disbursement
- bank sync
- legal certification
- tax approval
- cloud sync
- team invites sent
- private intelligence verification

unless that flow exists in a real API or Supabase table with verified access control.

## Verification

Run the dedicated Pro architecture gate after any Pro registry, dashboard, or route change:

```powershell
npm run pro:verify
```

Expected result:

```text
Pro architecture verification passed
- control apps: 10
- daily apps: 10
- total apps: 20
- app routes ready: 20/20
- backbone routes: 4/4
```

Then run the broad repo gates when navigation changes:

```powershell
npm run audit
npm run check-links
```
