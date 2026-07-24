#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const failures = [];

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function assertIncludes(relPath, needle, label) {
  const text = read(relPath);
  assert(text.includes(needle), `${relPath} is missing ${label || needle}`);
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

function parseEcommerceTools() {
  const registry = read('assets/js/components/tool-registry.js');
  const tools = [];
  const objectPattern = /\{\s*id:\s*'[^']+'[\s\S]*?\},/g;
  for (const match of registry.matchAll(objectPattern)) {
    const entry = match[0];
    if (!entry.includes("category: 'ecommerce'")) continue;
    const id = /id:\s*'([^']+)'/.exec(entry)?.[1];
    const href = /href:\s*'([^']+)'/.exec(entry)?.[1];
    if (!id || !href) {
      const line = registry.slice(0, match.index).split(/\r?\n/).length;
      failures.push(`Could not parse ecommerce registry entry on tool-registry.js:${line}`);
      continue;
    }
    tools.push({ id, href });
  }
  return tools;
}

function verifyWorkflowRoutes() {
  const workflow = read('assets/js/lib/vat-business-tax-workflow.js');
  const routes = new Set();
  for (const match of workflow.matchAll(/\b(?:href|primaryHref):\s*"([^"]+)"/g)) {
    if (match[1] && match[1].startsWith('/')) routes.add(match[1]);
  }
  routes.forEach((route) => {
    assert(routeExists(route), `VAT workflow route is missing locally: ${route}`);
  });
}

function verifyHub() {
  const hub = read('vat-business-tax/index.html');
  assert(!hub.includes('data-vatbiz-workflow-app'), 'vat-business-tax/index.html must not auto-mount the internal VAT workflow planner on the public hub');
  assert(!/\/assets\/css\/vat-business-tax-workflow\.css\?v=/.test(hub), 'vat-business-tax/index.html must not load the internal VAT workflow stylesheet on the public hub');
  assert(!/\/assets\/js\/lib\/workspace-sync\.js\?v=/.test(hub), 'vat-business-tax/index.html must not load workspace sync on the public hub');
  assert(!/\/assets\/js\/lib\/vat-business-tax-report-sync\.js\?v=/.test(hub), 'vat-business-tax/index.html must not load VAT report sync on the public hub');
  assert(!/\/assets\/js\/lib\/vat-business-tax-workflow\.js\?v=/.test(hub), 'vat-business-tax/index.html must not load the internal VAT workflow script on the public hub');
}

function verifyCalculator() {
  const calc = read('tools/vat-calculator/index.html');
  const controller = read('assets/js/pages/pan-african-vat-vip.js');
  const pack = JSON.parse(read('data/vat-business-tax/pan-african-vat-presets.json'));
  const statuses = Object.values(pack.countries || {}).reduce((counts, country) => {
    counts[country.status] = (counts[country.status] || 0) + 1;
    return counts;
  }, {});
  assert(calc.includes('/assets/js/engines/pan-african-vat.js'), 'VAT calculator should load the shared pure VAT engine');
  assert(calc.includes('/assets/js/pages/pan-african-vat-vip.js'), 'VAT calculator should load the custom-rate-first controller');
  assert(calc.includes('/assets/vendor/jspdf/jspdf.umd.min.js'), 'VAT calculator should load the local PDF dependency');
  assert(controller.includes("category: 'vat-business-tax'"), 'VAT PDF events should declare vat-business-tax category');
  assert(!/ai-advisor|auto-email-gate|share-state|workspace-sync|vat-business-tax-report-sync/.test(calc + controller), 'VAT flagship must not load AI, email gate, workspace sync, or stateful share code');
  assert(!/localStorage|sessionStorage|afro_vat|history/i.test(controller), 'VAT calculation controller must not persist amounts or history');
  assert(Object.keys(pack.countries || {}).length === 54, 'VAT planning pack should name exactly 54 markets');
  assert(statuses['authority-bound-planning-preset'] === 15, 'VAT planning pack should expose only 15 authority-bound presets');
  assert(statuses['authority-source-gap'] === 36, 'VAT planning pack should retain 36 explicit authority-source gaps');
  assert(statuses['unverified-no-vat-claim'] === 3, 'VAT planning pack should keep 3 no-VAT claims unverified and rate-free');
  assert(!Object.values(pack.countries || {}).some((country) => country.status !== 'authority-bound-planning-preset' && Object.prototype.hasOwnProperty.call(country, 'standardRate')), 'VAT source gaps must not receive legacy rates');
}

function main() {
  const ecommerceTools = parseEcommerceTools();
  assert(ecommerceTools.length >= 54, `Expected at least 54 VAT/business tax registry tools, found ${ecommerceTools.length}.`);

  verifyHub();
  verifyWorkflowRoutes();
  verifyCalculator();

  assertIncludes('assets/js/lib/vat-business-tax-report-sync.js', 'afro_vat_business_tax_reports_v1', 'VAT report local store');
  assertIncludes('assets/js/lib/vat-business-tax-report-sync.js', 'vat-business-tax-report', 'VAT report workspace item type');
  assertIncludes('assets/js/lib/vat-business-tax-report-sync.js', 'afro-pdf-gate-passed', 'PDF gate completion listener');
  assertIncludes('assets/js/lib/vat-business-tax-report-sync.js', 'afro-pdf-generated', 'PDF generated listener');
  assertIncludes('assets/js/lib/vat-business-tax-report-sync.js', 'Metadata only', 'metadata-only privacy copy');
  assertIncludes('assets/js/lib/vat-business-tax-report-sync.js', 'planTier', 'report plan-tier tagging');

  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'afro_vat_business_tax_plan_v1', 'VAT planner local store');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'afro_vat_business_tax_filing_packs_v1', 'VAT filing pack local store');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'afro_vat_business_tax_readiness_v1', 'VAT readiness local store');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'afro_vat_business_tax_audit_packets_v1', 'VAT audit local store');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'planRules', 'VAT plan gate rules');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'checkPlanGate', 'VAT free/pro gate checks');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'vatbiz-plan-gates', 'VAT visible plan gate meter');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'vatbiz-upgrade-overlay', 'VAT upgrade modal');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'Route profile', 'VAT user-facing route profile');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'vat-business-tax-filing-pack', 'VAT filing pack workspace item type');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'createFilingPack', 'VAT filing pack save API');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'getWorkflowProfile', 'VAT workflow profile API');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'Upgrade to Pro', 'VAT pro CTA');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'Continue free', 'VAT free escape hatch');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'vat-business-tax-readiness', 'VAT readiness workspace item type');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'vat-business-tax-audit-packet', 'VAT audit workspace item type');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'guardPromise', 'gated metadata packet export');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'Open items', 'VAT open-items UI');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'Document & PDF', 'inter-category document route');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'Salary & PAYE', 'inter-category salary route');
  assertIncludes('assets/js/lib/vat-business-tax-workflow.js', 'AfroPayroll workspace', 'inter-category payroll route');

  assertIncludes('assets/css/vat-business-tax-workflow.css', '.vatbiz-flow-lab', 'VAT workflow lab styles');
  assertIncludes('assets/css/vat-business-tax-workflow.css', '.vatbiz-flow-checklist', 'VAT checklist styles');
  assertIncludes('assets/css/vat-business-tax-workflow.css', '.vatbiz-flow-exceptions', 'VAT exception styles');
  assertIncludes('assets/css/vat-business-tax-workflow.css', '.vatbiz-flow-profile', 'VAT smart workflow profile styles');
  assertIncludes('assets/css/vat-business-tax-workflow.css', '.vatbiz-plan-gates', 'VAT plan gate styles');
  assertIncludes('assets/css/vat-business-tax-workflow.css', '.vatbiz-upgrade-overlay', 'VAT upgrade overlay styles');

  assertIncludes('dashboard/index.html', 'afro_vat_business_tax_reports_v1', 'VAT report dashboard source');
  assertIncludes('dashboard/index.html', 'afro_vat_business_tax_filing_packs_v1', 'VAT filing pack dashboard source');
  assertIncludes('dashboard/index.html', 'afro_vat_business_tax_readiness_v1', 'VAT readiness dashboard source');
  assertIncludes('dashboard/index.html', 'afro_vat_business_tax_audit_packets_v1', 'VAT audit dashboard source');
  assertIncludes('dashboard/index.html', 'vat-business-tax-report', 'VAT report workspace item type');
  assertIncludes('dashboard/index.html', 'vat-business-tax-filing-pack', 'VAT filing pack workspace item type');
  assertIncludes('dashboard/index.html', 'vat-business-tax-audit-packet', 'VAT audit workspace item type');
  assertIncludes('dashboard/index.html', 'ws-vat-business-tax', 'VAT dashboard tab');
  assertIncludes('dashboard/index.html', 'VAT Workspace', 'VAT dashboard label');

  assertIncludes('docs/VAT-BUSINESS-TAX-WORKFLOW.md', 'afro_vat_business_tax_reports_v1', 'VAT report workflow docs');
  assertIncludes('docs/VAT-BUSINESS-TAX-WORKFLOW.md', 'vat-business-tax-filing-pack', 'VAT filing pack workflow docs');
  assertIncludes('docs/VAT-BUSINESS-TAX-WORKFLOW.md', 'Advanced', 'advanced workflow feature docs');
  assertIncludes('docs/VAT-BUSINESS-TAX-WORKFLOW.md', 'Continue', 'workflow continuation docs');
  assertIncludes('docs/VAT-BUSINESS-TAX-WORKFLOW.md', 'https://gra.gov.gh/domestic-tax/tax-types/vat/', 'GRA source URL docs');
  assertIncludes('docs/VAT-BUSINESS-TAX-WORKFLOW.md', 'https://www.kra.go.ke/individual/filing-paying/types-of-taxes/value-added-tax', 'KRA source URL docs');
  assertIncludes('docs/VAT-BUSINESS-TAX-WORKFLOW.md', 'https://www.sars.gov.za/types-of-tax/value-added-tax/', 'SARS source URL docs');

  const pdfTemplate = read('assets/js/lib/pdf-template.js');
  const hasExplicitPdfCategory = pdfTemplate.includes('config && config.category')
    || /if\(([$\w]+)&&\1\.category\)return \1\.category/.test(pdfTemplate);
  assert(hasExplicitPdfCategory, 'assets/js/lib/pdf-template.js is missing explicit PDF category support');
  assert(pdfTemplate.includes('vat-business-tax'), 'assets/js/lib/pdf-template.js is missing VAT PDF category resolver');

  if (failures.length) {
    console.error('VAT & Business Tax workflow verification failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log(`VAT & Business Tax workflow verified (${ecommerceTools.length} registry tools, report sync, public hub boundary, dashboard workspace).`);
}

main();
