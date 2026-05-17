#!/usr/bin/env node
/**
 * Build the lightweight data feed for Salary & Tax hubs.
 *
 * Salary pages only need financial-category discovery rows, not the full
 * AFRO_TOOLS registry. This feed lets the hub and subhub renderers hydrate
 * from a compact route-specific payload on constrained mobile networks.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'assets/js/components/tool-registry.js');
const OUTPUT_PATH = path.join(ROOT, 'data/salary-tax-index.json');

function loadRegistry() {
  const code = fs.readFileSync(REGISTRY_PATH, 'utf8');
  function FakeEvent() {}
  const sandbox = {
    window: {},
    CustomEvent: FakeEvent,
    document: {
      readyState: 'complete',
      getElementById: () => null,
      createElement: () => ({ textContent: '', style: {}, appendChild() {} }),
      head: { appendChild() {} },
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {},
      querySelector: () => null,
    },
  };
  sandbox.window = sandbox;
  vm.runInNewContext(code, sandbox, { filename: REGISTRY_PATH });
  return Array.isArray(sandbox.AFRO_TOOLS) ? sandbox.AFRO_TOOLS : [];
}

function countriesFor(tool) {
  if (Array.isArray(tool.countries)) return tool.countries.filter(Boolean);
  if (typeof tool.countries === 'string' && tool.countries.trim()) return [tool.countries.trim()];
  return [];
}

function toRecord(tool) {
  return [
    tool.id,
    tool.name || tool.id,
    tool.desc || '',
    tool.category || 'financial',
    countriesFor(tool),
    tool.status || 'planned',
    tool.href || `/tools/${tool.id}/`,
    tool.icon || '',
    Number(tool.priority || 0),
    tool.lang || 'en',
  ];
}

const records = loadRegistry()
  .filter((tool) => tool && tool.id && tool.category === 'financial')
  .map(toRecord);

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(records) + '\n', 'utf8');

const bytes = fs.statSync(OUTPUT_PATH).size;
console.log(`Built ${records.length} salary-tax rows (${Math.round(bytes / 1024)} KB)`);
