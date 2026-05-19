#!/usr/bin/env node
/**
 * Build the lightweight client search index used by /search/.
 *
 * The full tool registry is still the source of truth, but search only needs
 * compact display and matching fields. Keeping this as JSON avoids making
 * mobile users download and execute the whole registry bundle before results.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.join(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'assets/js/components/tool-registry.js');
const SEARCH_INDEX_PATH = path.join(ROOT, 'data/search-index.json');

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

function normalizeCountries(tool) {
  if (Array.isArray(tool.countries)) return tool.countries.filter(Boolean);
  if (typeof tool.countries === 'string' && tool.countries.trim()) return [tool.countries.trim()];
  if (typeof tool.country === 'string' && tool.country.trim()) return [tool.country.trim()];
  return [];
}

function searchRecord(tool) {
  return [
    tool.id,
    tool.name || tool.id,
    tool.desc || '',
    tool.category || 'uncategorized',
    normalizeCountries(tool),
    tool.status || 'planned',
    tool.href || `/tools/${tool.id}/`,
    tool.icon || '',
    Number(tool.priority || 0),
  ];
}

const records = loadRegistry()
  .filter((tool) => tool && tool.id && (tool.href || tool.name))
  .map(searchRecord);

fs.mkdirSync(path.dirname(SEARCH_INDEX_PATH), { recursive: true });
writeFileSyncWithRetry(SEARCH_INDEX_PATH, JSON.stringify(records) + '\n', 'utf8');

const bytes = fs.statSync(SEARCH_INDEX_PATH).size;
console.log(`Built ${records.length} search index rows (${Math.round(bytes / 1024)} KB)`);
