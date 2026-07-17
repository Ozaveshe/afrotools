# Site Inventory Workflow

## Purpose

This workflow gives AfroTools a storekeeper-style ledger of what exists in the repo right now.

It separates:

- registry entries in `assets/js/components/tool-registry.js`
- English tool instances after `toolCount` family expansion
- explicit subcategory hubs from leaf tools where hub pages declare `window.HUB_CONFIG.toolIds`
- physical HTML pages on disk
- language page counts
- page-type buckets such as tools, country pages, widgets, and internal dashboards

## Command

```bash
npm run inventory:site
```

## Outputs

The command writes these files:

- `admin/data/site-inventory.json`
- `admin/data/tool-registry-export.csv`
- `admin/data/category-inventory.csv`
- `admin/data/subcategory-inventory.csv`
- `admin/data/site-pages-export.csv`

## Definitions

### Registry entry

One row inside `AFRO_TOOLS`.

### English tool instance

The English-only tool count after deduplicating URLs and re-adding hidden country-family variants declared through `toolCount`.

### Subcategory hub

A hub page with explicit `window.HUB_CONFIG.toolIds`. It is a container page and should not be counted as a tool itself.

### Category leaf tool

A live or new tool row that belongs directly to a category or is explicitly listed inside a subcategory hub.

### HTML page

A physical `.html` file on disk after excluding non-site folders like `node_modules`, `.git`, `.playwright`, and test output folders.

### Other public pages

Public pages that are not tools, country routes, widgets, or internal dashboards. This is the closest bucket to "just pages."

## Dashboard Use

`mc-7a2f9x.html` reads `admin/data/site-inventory.json` for the internal inventory view.

If the dashboard numbers look stale after large page or registry changes, regenerate the inventory snapshot before relying on it.
