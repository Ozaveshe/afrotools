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

assert(hub.includes('Legal & Compliance Apps for Africa - 69 Apps'), 'Legal hub title is not the 69-app standard');
assert(hub.includes('"numberOfItems":69'), 'Legal hub JSON-LD numberOfItems is not 69');
assert(hub.includes('data-category-workflow-lite="legal"'), 'Legal hub missing category workflow mount');
assert(hub.includes('/assets/css/category-workflow-lite.css'), 'Legal hub missing category workflow CSS');
assert(hub.includes('/assets/js/lib/category-workflow-lite.js'), 'Legal hub missing category workflow JS');
assert(hub.includes('Resume saved legal workflows'), 'Legal hub missing dashboard continuation CTA');

const cardLinks = [...hub.matchAll(/<a\s+href="([^"]+)"\s+class="leg-tool-card"/g)].map((match) => match[1]);
const uniqueLinks = [...new Set(cardLinks)];
assert(cardLinks.length === 69, `Expected 69 legal tool cards, found ${cardLinks.length}`);
assert(uniqueLinks.length === 69, `Expected 69 unique legal tool routes, found ${uniqueLinks.length}`);

const missingRoutes = uniqueLinks.filter((href) => !routeExists(href));
assert(!missingRoutes.length, `Legal hub links missing route files: ${missingRoutes.join(', ')}`);

const missingCopilot = [];
const thinWorkflowData = [];
for (const href of uniqueLinks) {
  const file = routeFile(href);
  const html = fs.readFileSync(file, 'utf8');
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
  'Metadata only'
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

console.log('Legal workflow verified (69 tool routes, copilot coverage, hub planner, gates, and dashboard continuation).');
