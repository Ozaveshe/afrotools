const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function loadRegistry() {
  const context = { window: {}, console };
  vm.createContext(context);
  vm.runInContext(read('assets/js/components/tool-registry.js'), context);
  return context;
}

function publicCategoryRows(registry, category) {
  return registry.AFRO_TOOLS.filter((tool) => {
    const language = tool.lang || 'en';
    return language === 'en'
      && tool.category === category
      && (tool.status === 'live' || tool.status === 'new');
  });
}

function routeFilesFor(tool) {
  const ownerDirectory = path.join(ROOT, tool.href.replace(/^\/|\/$/g, ''));
  const files = [path.join(ownerDirectory, 'index.html')];
  if ((tool.toolCount || 1) > 1) {
    for (const entry of fs.readdirSync(ownerDirectory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const candidate = path.join(ownerDirectory, entry.name, 'index.html');
      if (fs.existsSync(candidate)) files.push(candidate);
    }
  }
  return files.sort();
}

function extract(html, expression, label, file) {
  const match = html.match(expression);
  assert(match, `${file}: missing ${label}`);
  return match[1].trim();
}

const registry = loadRegistry();
const telecom = publicCategoryRows(registry, 'telecom');
const energy = publicCategoryRows(registry, 'energy');

assert.strictEqual(telecom.length, 14, 'Telecom canonical owner count drifted');
assert.strictEqual(energy.length, 20, 'Energy canonical owner count drifted');
assert.strictEqual(
  registry.getTotalToolCount((tool) => tool.category === 'telecom' && ['live', 'new'].includes(tool.status)),
  14,
  'Telecom public experience count drifted'
);
assert.strictEqual(
  registry.getTotalToolCount((tool) => tool.category === 'energy' && ['live', 'new'].includes(tool.status)),
  287,
  'Energy public experience count drifted'
);

const allRoutes = [];
for (const tool of telecom.concat(energy)) {
  const files = routeFilesFor(tool);
  assert.strictEqual(
    files.length,
    tool.toolCount || 1,
    `${tool.id}: disk route count does not match registry toolCount`
  );
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const relative = path.relative(ROOT, file).replace(/\\/g, '/');
    const title = extract(html, /<title>([\s\S]*?)<\/title>/i, 'title', relative);
    const description = extract(
      html,
      /<meta\s+name=["']description["']\s+content="([^"]+)"/i,
      'meta description',
      relative
    );
    const canonical = extract(
      html,
      /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i,
      'canonical',
      relative
    );
    assert(title.length >= 12, `${relative}: title is too thin`);
    assert(description.length >= 50, `${relative}: description is too thin`);
    assert(canonical.startsWith('https://afrotools.com/'), `${relative}: canonical must be absolute`);
    assert(/<h1\b/i.test(html), `${relative}: missing h1`);
    assert(/application\/ld\+json/i.test(html), `${relative}: missing structured data`);
    allRoutes.push({ toolId: tool.id, file: relative, canonical });
  }
}

assert.strictEqual(allRoutes.length, 301, 'Combined Day 11 route inventory drifted');
assert.strictEqual(new Set(allRoutes.map((route) => route.canonical)).size, 301, 'Day 11 canonicals are not unique');

for (const tool of telecom) {
  const html = read(path.join(tool.href.replace(/^\/|\/$/g, ''), 'index.html'));
  assert(
    html.includes('/assets/js/pages/telecom-freshness-guard.js'),
    `${tool.id}: missing fail-closed freshness guard`
  );
}
assert(
  read('telecom/index.html').includes('/assets/js/pages/telecom-freshness-guard.js'),
  'Telecom hub is missing fail-closed freshness guard'
);

const freshnessContext = {
  console,
  Date,
  globalThis: {}
};
vm.createContext(freshnessContext);
vm.runInContext(read('assets/js/pages/telecom-freshness-guard.js'), freshnessContext);
const freshness = freshnessContext.globalThis.AfroTools.telecomFreshness;
assert.strictEqual(freshness.cadenceDays, 30);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(freshness.classify('2026-03-01', new Date('2026-07-27T00:00:00Z')))),
  { reviewedAt: '2026-03-01', ageDays: 148, stale: true, cadenceDays: 30 }
);
assert.strictEqual(freshness.classify('2026-07-20', new Date('2026-07-27T00:00:00Z')).stale, false);
assert.strictEqual(freshness.classify('not-a-date', new Date('2026-07-27T00:00:00Z')).stale, true);
assert.strictEqual(freshness.classify('2026-02-31', new Date('2026-07-27T00:00:00Z')).stale, true);
assert.strictEqual(freshness.classify('2026-08-01', new Date('2026-07-27T00:00:00Z')).stale, true);

console.log(
  `Day 11 inventory verified: ${telecom.length} Telecom owners/routes, `
  + `${energy.length} Energy owners expanding to ${allRoutes.length - telecom.length} routes, `
  + `${allRoutes.length} combined route contracts.`
);
