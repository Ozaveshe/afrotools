const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function htmlFiles(root) {
  const files = [];
  if (!fs.existsSync(root)) return files;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(target));
    else if (entry.name.endsWith('.html')) files.push(target);
  }
  return files;
}

const registrySandbox = { document: undefined, window: {} };
vm.createContext(registrySandbox);
vm.runInContext(fs.readFileSync('assets/js/components/tool-registry.js', 'utf8'), registrySandbox);
const healthRoutes = registrySandbox.AFRO_TOOLS
  .filter((tool) => (tool.lang || 'en') === 'en' && tool.category === 'health')
  .map((tool) => tool.href);

assert.strictEqual(healthRoutes.length, 42, 'Health workflow coverage must follow the exact English registry inventory');
assert.strictEqual(new Set(healthRoutes).size, 42, 'Health registry routes must remain unique');

function routeFile(route) {
  return route.replace(/^\/+|\/+$/g, '') + '/index.html';
}

const appFiles = healthRoutes.map(routeFile);
for (const file of appFiles) assert.ok(fs.existsSync(file), `${file} must exist`);

const appSurfaces = appFiles.filter((file) =>
  fs.readFileSync(file, 'utf8').includes('/assets/js/health-workflow.js')
);
const appOwnedWorkflowSurfaces = appFiles.filter((file) => !appSurfaces.includes(file));
const hubFile = 'health/index.html';
const surfaces = [hubFile].concat(appSurfaces);

assert.strictEqual(
  new Set(appSurfaces.concat(appOwnedWorkflowSurfaces)).size,
  42,
  'shared and app-owned workflows must cover all 42 Health apps'
);

for (const file of surfaces) {
  const html = fs.readFileSync(file, 'utf8');
  const loads = html.match(/<script[^>]+src="\/assets\/js\/health-workflow\.js[^"]*"[^>]*>/g) || [];
  assert.strictEqual(loads.length, 1, `${file} must load the shared runtime exactly once`);
  assert.doesNotMatch(html, /auto-email-gate\.js/i, `${file} must not load the legacy email download gate`);
}

for (const file of appSurfaces) {
  const html = fs.readFileSync(file, 'utf8');
  assert.match(html, /data-health-action="save"/, `${file} must expose the shared device-save action`);
  assert.match(html, /data-health-action="pdf"/, `${file} must expose the shared local-PDF action`);
}

for (const file of appOwnedWorkflowSurfaces) {
  const html = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(html, /\/assets\/js\/health-workflow\.js/, `${file} must not reload the retired shared workflow`);
  assert.match(html, /Print(?:\s*\/|\s+or)?\s*(?:Save|save)(?:\s+as)?(?:\s+local)?\s+PDF|Download (?:local )?PDF(?:\s+(?:plan|summary|worksheet))?/i, `${file} must expose an ungated local print-to-PDF action`);
  assert.match(html, /Download (?:local )?(?:summary|TXT|text)(?:\s+(?:plan|summary|worksheet))?|Export (?:summary|TXT)/i, `${file} must expose an ungated local text export`);
  assert.doesNotMatch(html, /auto-email-gate\.js|email-gated PDF|unlock PDF/i, `${file} must not restore an email export gate`);
}

const generator = fs.readFileSync('scripts/complete-health-category-package.js', 'utf8');
assert.doesNotMatch(generator, /email-gated PDF|Health email gate|unlock PDF|gated PDF/i);
assert.match(generator, /Save on this device/);
assert.match(generator, /Download PDF/);
assert.match(generator, /Save metadata to account \(optional\)/);

const runtime = fs.readFileSync('assets/js/health-workflow.js', 'utf8');
assert.match(runtime, /\/assets\/vendor\/jspdf\/jspdf\.umd\.min\.js/);
assert.doesNotMatch(runtime, /cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|health-pdf-gate|afrotools_health_pdf_lead/);

console.log(`health workflow surface tests passed (${surfaces.length} shared surfaces + ${appOwnedWorkflowSurfaces.length} app-owned workflows: 42 apps + hub)`);
