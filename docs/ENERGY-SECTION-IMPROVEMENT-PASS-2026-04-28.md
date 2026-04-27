# Energy Section Improvement Pass - 2026-04-28

## Scope

This pass covers the public Energy hub at `/energy/` and all 20 Energy category tools listed in `assets/js/components/tool-registry.js`.

The goal is to make the category work as a connected decision system, not a loose grid of calculators:

- Start from a visible hub command center.
- Improve every app with app-specific presets, competitor-informed assumptions, checklists, next steps, report actions, and source links.
- Let users save energy reports to the dashboard through local workspace storage.
- Gate PDF report downloads with a short email capture form where no account email is present.
- Keep account-backed sync best-effort and honest. Local reports remain visible even if cloud workspace sync is not available.

## Competitor And Source Baseline

Use these source families when continuing Energy work:

- Solar and quote readiness: NREL PVWatts and EnergySage.
- Generator, hybrid, and mini-grid modeling: UL HOMER Pro, World Bank ESMAP mini-grid resources, and IEA Africa access planning.
- Home audit and appliance savings: U.S. DOE home energy assessments and LBNL Home Energy Saver.
- Carbon footprint: U.S. EPA household carbon footprint calculator and EPA emission factor hub.
- PAYG solar: GSMA PAYG solar material and GOGLA consumer protection standards.
- Biogas and clean cooking: FAO sustainable bioenergy and biogas training resources.

## Implementation Notes

The shared enhancement layer is `assets/js/energy-tool-assistant.js`.

Important storage and workspace details:

- Local dashboard key: `afro_energy_reports`
- Cloud item type: `energy_report`
- Save event: `afro-workspace-change`
- PDF gate lead source: `energy-pdf-gate`

Dashboard rendering lives in `dashboard/index.html` under the `Energy Plans` workspace tab.

The hub command center is static HTML in `energy/index.html` and uses styles from `assets/css/energy-competitive.css`.

## Tool Families

- Bill and utility workflow: `electricity-tariff`, `prepaid-meter`, `electricity-bill-verify`, `water-bill`
- Solar and backup workflow: `solar-roi`, `solar-sizing`, `battery-sizing`, `backup-duration`, `solar-vs-generator`, `generator-fuel`
- Business and productive-use workflow: `outage-cost`, `mini-grid-feasibility`, `diesel-vs-solar-farm`
- Efficiency and emissions workflow: `energy-audit`, `appliance-power`, `carbon-footprint-energy`, `ev-charging`
- Clean cooking and access workflow: `gas-lpg-cost`, `paygo-solar`, `biogas-roi`

## Validation

Minimum proof for future edits:

```powershell
node --check assets/js/energy-tool-assistant.js
npm run audit
npm run check-links
```

For browser proof, run a local server and smoke:

- `/energy/`
- `/tools/solar-roi/nigeria/`
- `/tools/generator-fuel/`
- `/tools/solar-sizing/`
- `/tools/appliance-power/`
- `/dashboard/` with a sample `afro_energy_reports` item in local storage
