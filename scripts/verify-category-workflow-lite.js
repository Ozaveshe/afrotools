const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function routeExists(route) {
  const clean = route.replace(/^\/+|\/+$/g, '');
  if (!clean) return fs.existsSync(path.join(root, 'index.html'));
  return fs.existsSync(path.join(root, clean, 'index.html')) ||
    fs.existsSync(path.join(root, clean + '.html')) ||
    fs.existsSync(path.join(root, clean));
}

const helper = read('assets/js/lib/category-workflow-lite.js');
const css = read('assets/css/category-workflow-lite.css');
const tighteningCss = read('assets/css/workflow-tightening.css');
const dashboard = read('dashboard/index.html');

[
  'afro_category_workflow_packs_v1',
  'category-workflow-pack',
  'guardPromise',
  'AfroWorkspace.upsert',
  'Free accounts can keep',
  'Metadata only'
].forEach((needle) => {
  assert(helper.includes(needle), `Missing helper marker: ${needle}`);
});

[
  /legal\s*:/,
  /agriculture\s*:/,
  /education\s*:/,
  /id\s*:\s*['"]personal['"]/,
  /id\s*:\s*['"]travel-records['"]/
].forEach((pattern) => {
  assert(pattern.test(helper), `Missing helper pattern: ${pattern}`);
});

[
  '.catflow-lite',
  '.catflow-lite__profile',
  '.catflow-lite__gate'
].forEach((needle) => {
  assert(css.includes(needle), `Missing category workflow CSS marker: ${needle}`);
});
assert(/@media\s*\(\s*max-width\s*:\s*860px\s*\)/.test(css), 'Missing category workflow CSS mobile breakpoint');

[
  '.salary-flow-lab',
  '.docpdf-flow-lab',
  '.vatbiz-flow-lab'
].forEach((needle) => {
  assert(tighteningCss.includes(needle), `Missing tightening CSS marker: ${needle}`);
});
assert(/display\s*:\s*none/.test(tighteningCss), 'Missing tightening CSS hidden disabled-button rule');

[
  ['legal/index.html', 'data-category-workflow-lite="legal"'],
  ['legal/index.html', '/assets/css/category-workflow-lite.css'],
  ['legal/index.html', '/assets/js/lib/category-workflow-lite.js'],
  ['agriculture/index.html', 'data-category-workflow-lite="agriculture"'],
  ['agriculture/index.html', '/assets/css/category-workflow-lite.css'],
  ['agriculture/index.html', '/assets/js/lib/category-workflow-lite.js'],
  ['education/index.html', 'data-category-workflow-lite="education"'],
  ['education/index.html', '/assets/css/category-workflow-lite.css'],
  ['education/index.html', '/assets/js/lib/category-workflow-lite.js'],
  ['salary-tax/index.html', '/assets/css/workflow-tightening.css'],
  ['document-pdf/index.html', '/assets/css/workflow-tightening.css'],
  ['vat-business-tax/index.html', '/assets/css/workflow-tightening.css']
].forEach(([file, needle]) => {
  assert(read(file).includes(needle), `${file} missing ${needle}`);
});

[
  'getCategoryWorkflowPacksLocal',
  'getCategoryWorkflowPacksCloud',
  'getCategoryWorkflowPackItems',
  'renderCategoryWorkflowPackWorkspace',
  'ws-category-workflows',
  'categoryWorkflowPacks',
  'afro_category_workflow_packs_v1'
].forEach((needle) => {
  assert(dashboard.includes(needle), `Dashboard missing ${needle}`);
});

[
  '/legal/',
  '/agriculture/',
  '/education/',
  '/dashboard/',
  '/document-pdf/',
  '/vat-business-tax/',
  '/trade/',
  '/insurance/',
  '/tools/business-registration/',
  '/tools/privacy-policy-gen/',
  '/tools/contract-generator/',
  '/tools/land-title-check/',
  '/tools/employment-contract/',
  '/tools/legal-aid/',
  '/tools/visa-cost/',
  '/agriculture/farm-budget/',
  '/agriculture/crop-yield/',
  '/agriculture/irrigation/',
  '/agriculture/farm-profit/',
  '/agriculture/poultry-roi/',
  '/tools/education-hub/',
  '/education/fees/',
  '/education/loans/',
  '/education/scholarships/',
  '/education/study-abroad/'
].forEach((route) => {
  assert(routeExists(route), `Missing workflow route: ${route}`);
});

console.log('Category workflow lite verification passed.');
