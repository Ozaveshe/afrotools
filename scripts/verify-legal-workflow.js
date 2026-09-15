const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function routeFile(href) {
  const clean = href.replace(/^\/+|\/+$/g, '');
  const indexPath = path.join(root, clean, 'index.html');
  const htmlPath = path.join(root, clean + '.html');
  if (fs.existsSync(indexPath)) return indexPath;
  if (fs.existsSync(htmlPath)) return htmlPath;
  return '';
}

function routeExists(href) {
  return !!routeFile(href);
}

const hub = read('legal/index.html');
const lite = read('assets/js/lib/category-workflow-lite.js');
const copilot = read('assets/js/legal-workflow-copilot.js');
const dashboard = read('dashboard/index.html');

assert(hub.includes('Legal & Compliance Tools for Africa - 69 Tools'), 'Legal hub title is not the 69-tool standard');
assert(hub.includes('"numberOfItems":69'), 'Legal hub JSON-LD numberOfItems is not 69');
assert(!hub.includes('data-category-workflow-lite="legal"'), 'Legal hub must not auto-mount category workflow packs on the public hub');
assert(!hub.includes('/assets/css/category-workflow-lite.css'), 'Legal hub must not load category workflow CSS on the public hub');
assert(!hub.includes('/assets/js/lib/category-workflow-lite.js'), 'Legal hub must not load category workflow JS on the public hub');
assert(hub.includes('Resume saved legal workflows'), 'Legal hub missing dashboard continuation CTA');

const cardLinks = [...hub.matchAll(/<a\s+href="([^"]+)"\s+class="leg-tool-card"/g)].map((match) => match[1]);
const uniqueLinks = [...new Set(cardLinks)];
assert(cardLinks.length === 69, `Expected 69 legal tool cards, found ${cardLinks.length}`);
assert(uniqueLinks.length === 69, `Expected 69 unique legal tool routes, found ${uniqueLinks.length}`);

const missingRoutes = uniqueLinks.filter((href) => !routeExists(href));
assert(!missingRoutes.length, `Legal hub links missing route files: ${missingRoutes.join(', ')}`);

// These source-owned workflows intentionally replaced the generic legal copilot.
// Run their input, privacy and route contracts before accepting their exact routes.
const nativePropertyRoutes = new Set(['rental-agreement','land-title-check','building-permit','survey-cost','property-valuation','plot-converter','diaspora-property','stamp-duty','property-cgt','rental-yield','rent-affordability','tenant-screening','property-mgmt-fees','building-materials','construction-budget','dev-feasibility','service-charge','short-let-calc','agent-commission','offplan-vs-ready']);
for (const testFile of ['day7-property-tool-contract.test.js','property-assumption-engine.test.js','day7-kenya-dpa.test.js']) {
  require('node:child_process').execFileSync(process.execPath, [path.join(root, 'tests', testFile)], { cwd: root, stdio: 'inherit' });
}
const missingCopilot = [];
const thinWorkflowData = [];
for (const href of uniqueLinks) {
  const file = routeFile(href);
  const html = fs.readFileSync(file, 'utf8');
  const slug = href.replace(/^\/tools\//, '').replace(/\/$/, '');
  if (nativePropertyRoutes.has(slug)) {
    assert(html.includes('data-property-workflow') && html.includes('data-tool="' + slug + '"'), 'Native property route owner missing: ' + href);
    assert(html.includes('/assets/js/engines/property-assumption.js') && html.includes('/assets/js/pages/property-assumption-workflow.js'), 'Native property runtime missing: ' + href);
    assert(html.includes('data-result') && html.includes('aria-live="polite"'), 'Native property result missing: ' + href);
    continue;
  }
  if (slug === 'kenya-dpa') {
    assert(html.includes('id="gv-config"') && html.includes('id="gv-form"') && html.includes('id="gv-result"'), 'Kenya evidence planner contract missing');
    assert(html.includes('/assets/js/pages/government-verification-planner.js'), 'Kenya evidence planner runtime missing');
    continue;
  }
  if (!html.includes('leg-workflow-copilot') || !html.includes('legal-workflow-copilot.js')) {
    missingCopilot.push(href);
    continue;
  }
  ['data-workflow-save', 'data-workflow-load', 'data-workflow-copy', 'data-workflow-pdf-gate', 'data-workflow-print'].forEach((needle) => {
    if (!html.includes(needle)) missingCopilot.push(`${href} missing ${needle}`);
  });
  const match = html.match(/<script type="application\/json" class="leg-workflow-data">([\s\S]*?)<\/script>/);
  if (!match) {
    thinWorkflowData.push(`${href}: missing workflow data`);
    continue;
  }
  const data = JSON.parse(match[1]);
  if (!data.slug || !data.workflowTitle || !data.decision ||
      !Array.isArray(data.evidence) || data.evidence.length < 3 ||
      !Array.isArray(data.redFlags) || data.redFlags.length < 3 ||
      !Array.isArray(data.related) || data.related.length < 1 ||
      !data.competitor || !Array.isArray(data.competitor.implemented) || data.competitor.implemented.length < 2) {
    thinWorkflowData.push(`${href}: incomplete workflow data`);
  }
}
assert(!missingCopilot.length, `Legal workflow copilot coverage gaps: ${missingCopilot.slice(0, 8).join(', ')}`);
assert(!thinWorkflowData.length, `Legal workflow data gaps: ${thinWorkflowData.slice(0, 8).join(', ')}`);

[
  'afro_legal_workflows',
  'legal-workflow',
  'AfroWorkspace.upsert',
  '/api/capture-lead',
  'legal-pdf-gate',
  'window.print'
].forEach((needle) => {
  assert(copilot.includes(needle), `Legal copilot missing ${needle}`);
});

[
  '/tools/legal-aid/',
  '/tools/visa-cost/',
  'afro_category_workflow_packs_v1',
  'category-workflow-pack',
  'guardPromise',
  'Free accounts can keep',
  'route details only'
].forEach((needle) => {
  assert(lite.includes(needle), `Category workflow lite missing legal marker ${needle}`);
});

[
  /label\s*:\s*['"]Legal & Compliance['"]/,
  /id\s*:\s*['"]company['"]/,
  /id\s*:\s*['"]privacy['"]/,
  /id\s*:\s*['"]contracts['"]/,
  /id\s*:\s*['"]property['"]/,
  /id\s*:\s*['"]labour['"]/,
  /id\s*:\s*['"]personal['"]/,
  /id\s*:\s*['"]travel-records['"]/
].forEach((pattern) => {
  assert(pattern.test(lite), `Category workflow lite missing legal pattern ${pattern}`);
});

[
  '/tools/business-registration/',
  '/tools/privacy-policy-gen/',
  '/tools/contract-generator/',
  '/tools/land-title-check/',
  '/tools/employment-contract/',
  '/tools/legal-aid/',
  '/tools/visa-cost/',
  '/document-pdf/',
  '/vat-business-tax/',
  '/dashboard/'
].forEach((href) => {
  assert(routeExists(href), `Legal workflow route missing: ${href}`);
});

[
  'getCategoryWorkflowPacksLocal',
  'renderCategoryWorkflowPackWorkspace',
  'ws-category-workflows',
  'categoryWorkflowPacks'
].forEach((needle) => {
  assert(dashboard.includes(needle), `Dashboard missing legal workflow continuation marker ${needle}`);
});

console.log('Legal workflow verified (69 tool routes, 48 copilot routes and 21 source-owned replacements, public hub boundary, gates, and dashboard continuation).');
