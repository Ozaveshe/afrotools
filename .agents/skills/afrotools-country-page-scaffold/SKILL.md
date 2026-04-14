---
name: afrotools-country-page-scaffold
description: AfroTools workflow for adding or repairing country hubs, country calculators, registry entries, and related content surfaces. Use when creating a new country page, extending country coverage, wiring registry-aware pages, or aligning country content with existing architecture and docs.
---
# AfroTools Country Page Scaffold

Use this skill when the task touches country-specific surfaces.

## Read First

- `docs/ADDING-A-COUNTRY.md`
- `docs/ADDING-A-TOOL.md`
- `docs/ARCHITECTURE.md`

## Working Rules

- Follow existing country hub and tool patterns.
- Keep engines pure when calculations are involved.
- Update registry and supporting docs together.

## Workflow

1. Identify whether the task is a new country, a new country tool, or a repair to an existing country surface.
2. Inspect the matching existing country pages and any related engine or script.
3. Update the country page, registry, and supporting docs as a single unit.
4. Run the relevant validation for routing, registry, and any engine logic.

## Validation

- `npm run check-links`
- `npm run audit`
- `node scripts/validate-registry.js`