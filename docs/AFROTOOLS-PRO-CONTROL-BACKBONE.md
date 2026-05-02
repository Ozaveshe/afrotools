# AfroTools Pro Control Backbone

## Purpose

The Pro control backbone gives every AfroTools Pro app a shared place to send users for data vault, team, and settings work. These are operations-console pages, not marketing pages.

## Routes

- `/pro/vault/`
- `/pro/team/`
- `/pro/settings/`

## Navigation Integration

The Pro navigation layer now treats `/pro/workspace/` as the real app entry point. `/pro/` remains the plan and pricing page, but its primary work CTA points to `/pro/workspace/`.

Central navigation surfaces:

- `/pro/workspace/` links the 10 control apps and the shared Vault, Team, and Settings routes.
- `/pro/apps/` lists the 10 control apps, plus Vault, Team, Settings, and the payroll country-pack support console.
- Existing app shells that were created by individual app agents link back to `/pro/workspace/`.

Current control app route status:

| App | Route shown in Pro navigation | Status | Notes |
| --- | --- | --- | --- |
| Payroll | `/pro/apps/payroll/` | Active | Payroll can read real AfroPayroll dashboard data when available. |
| Tax Compliance | `/pro/apps/tax-compliance/` | Shell | Local shell, no statutory filing or compliance guarantee. |
| Books | `/pro/apps/books/` | Shell | Local finance shell, no bank sync or tax filing. |
| HR | `/pro/apps/hr/` | Shell | Reads Payroll local employee records where present. |
| Trade Desk | `/pro/apps/trade-desk/` | Shell | Local trade shell, no customs filing or duty payment. |
| Legal Desk | `/pro/apps/legal/` | Shell | The route exists under `/pro/apps/legal/`; `/pro/apps/legal-desk/` now forwards to it as a compatibility alias. |
| Grants & Tenders | `/pro/apps/grants-tenders/` | Shell | Local opportunity tracker shell. |
| Creator Studio | `/pro/apps/creator-studio/` | Shell | Local creator business workspace shell. |
| Stream Intelligence | `/pro/apps/stream-intelligence/` | Blocked | Route exists as a blocked planning shell; it needs source, inference, and user-edit boundaries before activation. |
| Property Projects | `/pro/apps/property-projects/` | Shell | Local property and project shell. |

Known route gaps:

- `/pro/apps/legal-desk/` is a compatibility alias that forwards to `/pro/apps/legal/`.
- `/pro/apps/stream-intelligence/` exists as a blocked planning shell, not an active intelligence product.

All three routes are Pro-gated with:

- `<meta name="pro-required" content="afrotools-pro">`
- `/assets/js/pro-gate.js`
- live status reads through `window.AfroProGate.getStatus({ fresh: true })`

## Shared Layout

The pages follow the `/pro/workspace/` pattern:

- left sidebar navigation
- sticky top account bar
- dense command section
- status card
- compact metrics
- panel/table layout
- explicit local-only and cloud-backed labels

## Vault Scope

`/pro/vault/` is the shared entry point for:

- export packets
- documents
- payslips
- compliance packs
- invoices
- local-only versus cloud-backed data labels

The current shell scans known Pro localStorage keys so it can show whether browser-local records exist. It does not upload data and does not claim cloud records.

Known local sources include:

- `afropayroll_pro_saved_runs`
- `afropayroll_pro_workspace_preview`
- `afropayroll_pro_employee_master`
- `afrotax_compliance_os_demo_v1`
- `afrobooks_finance_os_demo_v1`
- `afrohr_people_os_demo_v1`
- `afrotrade_desk_pro_demo_v1`
- `afrolegal_desk_pro_demo_v1`
- `afrogrant_tender_os_demo_v1`
- `afrocreator_studio_pro_demo_v1`
- `afroproperty_project_os_demo_v1`

## Team Scope

`/pro/team/` is the shared entry point for:

- roles
- current signed-in member display
- invite placeholder
- client directory placeholder
- permission model placeholder

The page intentionally does not create fake members, invites, or clients. It only shows the current signed-in account from the Pro gate plus role templates for future schema work.

## Settings Scope

`/pro/settings/` is the shared entry point for:

- account profile display
- Pro status
- language lane
- default country
- default currency
- data label preferences
- privacy and export-warning preferences

Profile data is read-only on this shell. Preference controls are browser-local until an account-backed settings API exists.

## Local Preference Storage

The shared backbone preference key is:

- `afrotools_pro_backbone_preferences_v1`

This key is only for shell preferences:

- vault filter
- team permission lens
- team client lens
- language lane
- default country
- default currency
- workspace label
- packet naming preference
- local/cloud data label preference
- privacy display toggles

It must not store team records, invites, clients, documents, payslips, invoices, or compliance evidence.

## Honest Data Boundaries

The backbone must keep these labels clear:

- Local-only: browser records or shell preferences stored in localStorage
- Cloud-backed: real account-backed records returned by an API or Supabase table
- Needs schema: route exists, but no backend table/API/RLS policy exists yet
- Placeholder: planning surface only, with no user data stored

Do not claim:

- synced team members
- sent invites
- cloud documents
- cloud payslips
- cloud invoices
- cloud compliance packs
- account-backed settings
- client workspace records

until those records are actually backed by real APIs and database tables.

## Future Schema Needed

Minimum shared Pro tables:

- `pro_workspaces`
- `pro_workspace_members`
- `pro_workspace_invites`
- `pro_roles`
- `pro_role_permissions`
- `pro_clients`
- `pro_client_memberships`
- `pro_user_settings`
- `pro_vault_items`
- `pro_vault_item_versions`
- `pro_export_packets`
- `pro_document_labels`
- `pro_audit_events`

Each table needs tenant-aware RLS. Vault and export tables must store data origin, app owner, client/workspace owner, created_by, and audit metadata.

## Future API Surface

Suggested endpoint family:

- `GET /api/pro/backbone?action=status`
- `GET /api/pro/backbone?action=settings`
- `POST /api/pro/backbone?action=save_settings`
- `GET /api/pro/backbone?action=team`
- `POST /api/pro/backbone?action=create_invite`
- `POST /api/pro/backbone?action=update_member_role`
- `GET /api/pro/backbone?action=clients`
- `GET /api/pro/backbone?action=vault`
- `POST /api/pro/backbone?action=create_export_packet`
- `POST /api/pro/backbone?action=label_vault_item`

## Pro App Consumers

The 10 shared Pro apps can point to these backbone routes:

- Payroll: vault for payslips and export packets, team for accountant/reviewer roles, settings for country/currency defaults
- Tax Compliance: vault for compliance packs and evidence, team for accountant reviewer, settings for language/country defaults
- Books: vault for invoices and accountant packets, team for accountant/client access, settings for currency defaults
- HR: vault for letters and employee documents, team for HR and payroll role boundaries, settings for privacy labels
- Trade Desk: vault for trade packets, team for supplier/client reviewer scopes, settings for country/currency defaults
- Legal Desk: vault for draft packets, team for external reviewer boundaries, settings for privacy warnings
- Grants & Tenders: vault for submission packets, team for reviewer roles, settings for language and country defaults
- Creator Studio: vault for media kits and invoice handoffs, team for manager/client roles, settings for currency defaults
- Stream Intelligence: vault for reports, team for analyst/reviewer roles, settings for privacy labels
- Property Projects: vault for project packets and documents, team for contractor/client scopes, settings for country/currency defaults
