const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const registryPath = path.join(root, 'assets/js/components/tool-registry.js');
const source = fs.readFileSync(registryPath, 'utf8');
const sandbox = { document: undefined, window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

function englishRows(category) {
  return sandbox.AFRO_TOOLS
    .filter((tool) => tool.category === category)
    .filter((tool) => tool.status === 'live' || tool.status === 'new')
    .filter((tool) => !/^\/(?:fr|sw|ha|yo)\//.test(tool.href));
}

const expected = { agriculture: 447, transport: 18, trade: 22 };
for (const [category, count] of Object.entries(expected)) {
  const rows = englishRows(category);
  assert.strictEqual(rows.length, count, `${category} English live/new route count`);
  assert.strictEqual(new Set(rows.map((row) => row.id)).size, count, `${category} unique ids`);
  assert.strictEqual(new Set(rows.map((row) => row.href)).size, count, `${category} unique routes`);
  for (const row of rows) {
    const clean = row.href.replace(/^\/+|\/+$/g, '');
    const local = row.href.endsWith('/')
      ? path.join(root, clean, 'index.html')
      : path.join(root, `${clean}.html`);
    assert.ok(fs.existsSync(local), `${row.href} resolves to ${path.relative(root, local)}`);
    const html = fs.readFileSync(local, 'utf8');
    assert.match(html, /<main\b|role=["']main["']/, `${row.href} has an explicit main landmark`);
  }
}

const agriculture = englishRows('agriculture');
const familyCounts = agriculture.reduce((counts, row) => {
  const match = row.href.match(/^\/agriculture\/([^/]+)(?:\/[^/]+)?\/?$/);
  const key = match ? match[1] : row.href;
  counts[key] = (counts[key] || 0) + 1;
  return counts;
}, {});
for (const [family, count] of Object.entries({
  'crop-yield': 55,
  fertilizer: 55,
  irrigation: 55,
  'farm-profit': 55,
  'seed-rate': 55,
  'farm-payroll': 55,
  'fish-farming': 16,
  greenhouse: 16,
  'cassava-processing': 16,
  'livestock-feed': 16,
  'input-prices': 16,
  'farm-loans': 16
})) {
  assert.strictEqual(familyCounts[family], count, `${family} explicit registry route count`);
}

assert.strictEqual(
  (fs.readFileSync(path.join(root, 'transport/index.html'), 'utf8').match(/class="trp-tool-card"/g) || []).length,
  23,
  'Transport hub keeps 18 category routes plus five labeled cross-category planning routes'
);
assert.strictEqual(
  (fs.readFileSync(path.join(root, 'trade/index.html'), 'utf8').match(/class="tool-card (?:live |rv|live rv)/g) || []).length,
  22,
  'Trade hub card count'
);

const fxImpact = fs.readFileSync(path.join(root, 'tools/fx-import-impact/index.html'), 'utf8');
assert.match(
  fxImpact,
  /typeof Chart !== 'function'[\s\S]+trend chart is unavailable offline/,
  'FX Import Impact keeps calculated totals available when the optional chart CDN is offline'
);
const carImportEnhancements = fs.readFileSync(
  path.join(root, 'assets/js/car-import-cost-enhancements.js'),
  'utf8'
);
assert.match(
  carImportEnhancements,
  /if \(o\.innerHTML !== guideMarkup\) o\.innerHTML = guideMarkup;/,
  'Car Import Cost result observer only mutates the guide when its content changes'
);

console.log('Day 6 category inventory and explicit Agriculture family counts passed.');
