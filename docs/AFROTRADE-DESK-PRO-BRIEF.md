# AfroTrade Desk Pro Brief

Created: 2026-05-02

## Purpose

AfroTrade Desk Pro is the Pro trade operations workspace at:

- `/pro/apps/trade-desk/`

It is for importers, exporters, SMEs, trade advisors, accountants, procurement teams, and operators preparing African trade paperwork, shipment readiness, landed cost estimates, AfCFTA preference evidence, supplier or buyer records, and broker handoff packets.

The product should feel like paid trade workflow software, not a calculator page.

## Current Scope

The first shell includes:

- Shipment pipeline.
- Landed cost workspace.
- Supplier and buyer CRM.
- Document checklist.
- AfCFTA readiness.
- Customs and duty review.
- Payment and FX notes.
- Risk queue.

Starter workflows:

- Create shipment.
- Estimate landed cost.
- Prepare document pack.
- Review tariff or duty.
- Export trade packet.

## Linked Existing Tools

The shell links to existing public trade and import tools:

- `/tools/afcfta-tracker/`
- `/tools/landed-cost/`
- `/tools/import-duty/`
- `/tools/vehicle-import-duty/`
- `/tools/mini-importation/`
- `/tools/payment-gateway/`
- `/tools/informal-fx-watch/`
- `/tools/customs-time/`
- `/tools/fx-import-impact/`
- `/tools/trade-finance-comparator/`
- `/tools/b2b-payment/`
- `/tools/commodity-tracker/`

These calculators remain the place for deeper tool-specific workflows. AfroTrade Desk is the operating shell that gathers readiness signals and exports a local handoff packet.

## Data Boundary

Current demo state is browser-only and uses:

- `afrotrade_desk_pro_demo_v1`

The shell stores shipment rows, cost estimates, CRM rows, document checklist state, AfCFTA notes, customs review notes, payment notes, risk items, and packet count in localStorage.

The export packet is a browser-generated JSON file. It is not uploaded, account-backed, or submitted to any authority.

## Honest Copy Rules

Keep these rules visible in future iterations:

- AfroTrade Desk may prepare local shipment rows, readiness checklists, planning estimates, CRM notes, and handoff packets.
- AfroTrade Desk does not file customs entries.
- AfroTrade Desk does not remit duties, taxes, or fees.
- AfroTrade Desk does not issue official clearance or origin certificates.
- AfroTrade Desk does not guarantee AfCFTA preference eligibility.
- Landed cost and duty rows are planning estimates until verified by official tariff sources, brokers, freight forwarders, banks, or customs authorities.
- Local demo rows are not account-backed trade records.

## Future Live-Data and API Needs

A production build needs account-backed tables and live data boundaries before any live trade operations claims:

- `trade_clients`
- `trade_workspaces`
- `trade_counterparties`
- `trade_shipments`
- `trade_shipment_lines`
- `trade_landed_cost_estimates`
- `trade_landed_cost_lines`
- `trade_document_checklists`
- `trade_document_vault_items`
- `trade_afcfta_readiness_checks`
- `trade_customs_reviews`
- `trade_payment_fx_notes`
- `trade_risk_items`
- `trade_export_packets`
- `trade_audit_events`

Recommended live-data sources and services:

- Official tariff book or customs tariff references by country.
- AfCFTA corridor, schedule, and rules-of-origin source review metadata.
- FX reference feeds and manually reviewed informal FX observations.
- Freight, insurance, port, inland delivery, and customs-time reference tables.
- Broker-reviewed HS code and customs-value sign-off workflow.
- Storage-backed document vault with strict RLS and audit events.

Recommended API surface after schema and RLS exist:

- `GET /api/trade?action=dashboard`
- `GET /api/trade?action=shipments`
- `POST /api/trade?action=save_shipment`
- `POST /api/trade?action=estimate_landed_cost`
- `POST /api/trade?action=save_counterparty`
- `POST /api/trade?action=update_document_checklist`
- `POST /api/trade?action=request_duty_review`
- `POST /api/trade?action=create_export_packet`

These APIs should require an authenticated Pro account, workspace-level authorization, field validation for shipment and counterparty data, source timestamps for live-data signals, and audit-event writes for every mutation.

## Validation

After changing this shell, run:

```bash
node -e "const fs=require('fs');const html=fs.readFileSync('pro/apps/trade-desk/index.html','utf8');const re=/<script\\b(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)<\\/script>/gi;let m,i=0;while((m=re.exec(html))){const code=m[1].trim();if(!code)continue;i++;new Function(code);}console.log('inline scripts parsed:',i);"
git diff --check
npm run audit
npm run check-links
```
