# Climate Category Complete Package - 2026-04-28

## Scope

This pass treats `/climate/` as a workflow hub, not a simple directory page. The source of truth is `scripts/enhance-climate-section-pass.js`, which regenerates the hub, 13 Climate apps, and the Climate registry block in `assets/js/components/tool-registry.js`.

## Product Pattern

Each Climate app now gets a tailored improvement layer:

- competitor-informed method note
- quick scenario presets
- required form fields
- source links in a compact card
- next app routing with country and journey query parameters
- Save to dashboard
- PDF report gate for email capture

The shared runtime lives in `assets/js/climate-tools.js`. It owns calculation behavior, presets, recent-tool logging, local workspace saves, optional `AfroWorkspace` sync for signed-in users, and gated PDF generation.

## Hub Workflow

The hub starts with a pathway builder. It routes users into four workflows:

- Farm resilience
- Household resilience
- Business compliance
- Carbon project

The chosen country and workflow are passed into the first tool and kept in local storage as `afro_climate_journey`.

## Dashboard Tie-In

Climate reports are stored in `localStorage` under `afro_climate_workspace`. The dashboard reads that collection as a local-first workspace lane called Climate Reports. Signed-in users may also sync individual items through `AfroWorkspace` when it is available, but local save remains the baseline behavior.

## Lead Capture

PDF export is intentionally gated. The user can calculate freely, then enters an email only when downloading a report. The client posts to `/api/capture-lead` with source `climate-pdf-gate` and stores the email locally to avoid repeated gates on the same device.

## Validation

For future changes to this category, run:

```powershell
node --check scripts\enhance-climate-section-pass.js
node --check assets\js\climate-tools.js
node scripts\enhance-climate-section-pass.js
node scripts\check-registry-syntax.js
node scripts\validate-registry.js
npm run audit
```

When possible, also smoke `/climate/`, one risk app, one project app, and one household app in a browser. Confirm preset buttons, result rendering, Save to dashboard, and the PDF email gate.
