#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const requiredReportPages = [
  'nigeria/ng-salary-tax.html',
  'kenya/ke-paye.html',
  'ghana/gh-paye.html',
  'south-africa/za-paye.html',
  'tanzania/tz-paye.html',
  'uganda/ug-paye.html',
];

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function routeExists(route) {
  const clean = String(route || '').replace(/[?#].*$/, '').replace(/^\//, '');
  if (!clean) return true;
  const candidates = [];
  if (clean.endsWith('/')) candidates.push(`${clean}index.html`);
  else if (clean.endsWith('.html')) candidates.push(clean);
  else candidates.push(`${clean}.html`, `${clean}/index.html`);
  return candidates.some(exists);
}

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function assertIncludes(relPath, needle, label) {
  const text = read(relPath);
  assert(text.includes(needle), `${relPath} is missing ${label || needle}`);
}

for (const page of requiredReportPages) {
  const html = read(page);
  const calcIndex = html.indexOf('/assets/js/lib/paye-calculation-sync.js');
  const reportIndex = html.indexOf('/assets/js/lib/paye-report-sync.js');
  assert(calcIndex !== -1, `${page} is missing paye-calculation-sync.js`);
  assert(reportIndex !== -1, `${page} is missing paye-report-sync.js`);
  assert(calcIndex === -1 || reportIndex === -1 || reportIndex > calcIndex, `${page} must load paye-report-sync.js after paye-calculation-sync.js`);
}

assertIncludes('assets/js/lib/pdf-download-gate.js', 'guardPromise', 'promise download gate API');
assertIncludes('assets/js/lib/pdf-download-gate.js', 'afro_pdf_gate_context_v1', 'gate context storage');
assertIncludes('assets/js/lib/pdf-download-gate.js', 'afro-pdf-gate-passed', 'gate completion event');
assertIncludes('assets/js/lib/auto-email-gate.js', 'ensurePdfDownloadGate', 'legacy gate bridge');
assertIncludes('assets/js/lib/auto-email-gate.js', 'pdf-download-gate.js?v=20260502', 'current gate loader');
assertIncludes('assets/js/lib/pdf-template.js', 'guardPromise', 'PDF template gate call');
assertIncludes('assets/js/lib/pdf-template.js', 'afro-pdf-generated', 'PDF report event');
assertIncludes('assets/js/lib/paye-report-sync.js', 'afro_salary_reports_v1', 'salary report local store');
assertIncludes('assets/js/lib/paye-report-sync.js', 'salary-report', 'salary report workspace item type');
assertIncludes('assets/js/lib/salary-tax-workflow.js', 'afro_salary_workflow_plan_v1', 'salary planner local store');
assertIncludes('assets/js/lib/salary-tax-workflow.js', 'afro_salary_handoff_briefs_v1', 'salary handoff local store');
assertIncludes('assets/js/lib/salary-tax-workflow.js', 'afro_salary_run_readiness_v1', 'salary readiness local store');
assertIncludes('assets/js/lib/salary-tax-workflow.js', 'afro_salary_audit_packets_v1', 'salary audit packet local store');
assertIncludes('assets/js/lib/salary-tax-workflow.js', 'salary-handoff', 'salary handoff workspace item type');
assertIncludes('assets/js/lib/salary-tax-workflow.js', 'salary-run-readiness', 'salary readiness item type');
assertIncludes('assets/js/lib/salary-tax-workflow.js', 'salary-audit-packet', 'salary audit packet workspace item type');
assertIncludes('assets/js/lib/salary-tax-workflow.js', 'guardPromise', 'gated handoff download');
assertIncludes('assets/js/lib/salary-tax-workflow.js', 'Exception queue', 'salary exception queue UI');
assertIncludes('assets/js/lib/salary-tax-workflow.js', 'Run readiness', 'salary readiness score UI');
assertIncludes('assets/css/salary-tax-workflow.css', '.salary-flow-lab', 'salary workflow planner styles');
assertIncludes('assets/css/salary-tax-workflow.css', '.salary-flow-checklist', 'salary checklist styles');
assertIncludes('assets/css/salary-tax-workflow.css', '.salary-flow-exceptions', 'salary exception styles');

const workflowJs = read('assets/js/lib/salary-tax-workflow.js');
const workflowRoutes = new Set();
for (const match of workflowJs.matchAll(/\b(?:paye|francophone|href):\s*"([^"]+)"/g)) {
  if (match[1] && match[1].startsWith('/')) workflowRoutes.add(match[1]);
}
for (const route of workflowRoutes) {
  assert(routeExists(route), `salary workflow route is missing locally: ${route}`);
}

const salaryHub = read('salary-tax/index.html');
assert(salaryHub.includes('data-salary-workflow-app'), 'salary-tax/index.html is missing workflow planner mount');
assert(/\/assets\/js\/lib\/salary-tax-workflow\.js\?v=[a-z0-9]+/.test(salaryHub), 'salary-tax/index.html is missing salary workflow script');
assert(/\/assets\/css\/salary-tax-workflow\.css\?v=[a-z0-9]+/.test(salaryHub), 'salary-tax/index.html is missing salary workflow stylesheet');

const manifest = JSON.parse(read('assets/js/bundles/manifest.json'));
const toolPage = manifest['tool-page'] || {};
assert(toolPage.path && exists(toolPage.path.replace(/^\//, '')), 'current tool-page bundle file is missing');
for (const alias of ['/assets/js/bundles/tool-page.4701dd1d.min.js', '/assets/js/bundles/tool-page.c4ee75a0.min.js']) {
  assert((toolPage.aliases || []).includes(alias), `tool-page manifest is missing alias ${alias}`);
  assert(exists(alias.replace(/^\//, '')), `tool-page alias file is missing: ${alias}`);
}

assertIncludes('dashboard/index.html', 'afro_salary_reports_v1', 'salary report local dashboard source');
assertIncludes('dashboard/index.html', 'afro_salary_handoff_briefs_v1', 'salary handoff local dashboard source');
assertIncludes('dashboard/index.html', 'afro_salary_run_readiness_v1', 'salary readiness local dashboard source');
assertIncludes('dashboard/index.html', 'afro_salary_audit_packets_v1', 'salary audit local dashboard source');
assertIncludes('dashboard/index.html', 'salary-report', 'salary report workspace item type');
assertIncludes('dashboard/index.html', 'salary-handoff', 'salary handoff workspace item type');
assertIncludes('dashboard/index.html', 'salary-audit-packet', 'salary audit packet workspace item type');
assertIncludes('dashboard/index.html', 'Readiness boards', 'salary readiness dashboard section');
assertIncludes('dashboard/index.html', 'Audit packets', 'salary audit dashboard section');
assertIncludes('dashboard/index.html', 'ws-salary', 'salary report dashboard tab');
assertIncludes('docs/PAYE-STANDARD.md', 'item_type = \'salary-report\'', 'PAYE report workspace contract');
assertIncludes('docs/PAYE-STANDARD.md', 'item_type = \'salary-handoff\'', 'PAYE handoff workspace contract');
assertIncludes('docs/PAYE-STANDARD.md', 'item_type = \'salary-audit-packet\'', 'PAYE audit packet workspace contract');
assertIncludes('docs/PDF-CATEGORY-WORKFLOW.md', 'pdf-download-gate.js?v=20260502', 'current PDF gate version');
assertIncludes('docs/PDF-CATEGORY-WORKFLOW.md', 'audit packets', 'metadata audit packet gate policy');

if (failures.length) {
  console.error('Salary and PAYE workflow verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Salary and PAYE workflow verified (${requiredReportPages.length} report-enabled PAYE pages).`);
