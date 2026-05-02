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

function parseRegistryTools() {
  const registry = read('assets/js/components/tool-registry.js');
  const tools = [];
  registry.split(/\r?\n/).forEach((line, index) => {
    if (!line.includes("category: 'document-pdf'")) return;
    if (!line.includes("href: '/tools/")) return;
    const id = /id: '([^']+)'/.exec(line)?.[1];
    const href = /href: '([^']+)'/.exec(line)?.[1];
    const slug = /\/tools\/([^/]+)\//.exec(href || '')?.[1];
    if (!id || !href || !slug) {
      failures.push(`Could not parse document-pdf registry entry on tool-registry.js:${index + 1}`);
      return;
    }
    tools.push({ id, href, slug });
  });
  return tools;
}

function verifyToolReportSync(tools) {
  tools.forEach((tool) => {
    ['index.html', 'app.html'].forEach((name) => {
      const relPath = `tools/${tool.slug}/${name}`;
      if (!exists(relPath)) return;
      const html = read(relPath);
      if (!html.includes('pdf-download-gate.js')) return;
      const count = (html.match(/document-pdf-report-sync\.js/g) || []).length;
      assert(count === 1, `${relPath} should load document-pdf-report-sync.js exactly once, found ${count}.`);
    });
  });
}

function verifyWorkflowRoutes() {
  const workflow = read('assets/js/lib/document-pdf-workflow.js');
  const routes = new Set();
  for (const match of workflow.matchAll(/\b(?:href|primaryHref):\s*"([^"]+)"/g)) {
    if (match[1] && match[1].startsWith('/')) routes.add(match[1]);
  }
  routes.forEach((route) => {
    assert(routeExists(route), `document PDF workflow route is missing locally: ${route}`);
  });
}

function verifyHub() {
  const hub = read('document-pdf/index.html');
  assert(hub.includes('data-document-pdf-workflow-app'), 'document-pdf/index.html is missing workflow planner mount');
  assert(/\/assets\/css\/document-pdf-workflow\.css\?v=/.test(hub), 'document-pdf/index.html is missing document PDF workflow stylesheet');
  assert(/\/assets\/js\/lib\/workspace-sync\.js\?v=/.test(hub), 'document-pdf/index.html is missing workspace-sync.js');
  assert(/\/assets\/js\/lib\/document-pdf-report-sync\.js\?v=/.test(hub), 'document-pdf/index.html is missing report sync script');
  assert(/\/assets\/js\/lib\/document-pdf-workflow\.js\?v=/.test(hub), 'document-pdf/index.html is missing workflow script');
}

function main() {
  const tools = parseRegistryTools();
  assert(tools.length === 31, `Document-pdf registry /tools/ count should be 31, found ${tools.length}.`);

  verifyToolReportSync(tools);
  verifyHub();
  verifyWorkflowRoutes();

  assertIncludes('assets/js/lib/document-pdf-report-sync.js', 'afro_document_pdf_reports_v1', 'document PDF report local store');
  assertIncludes('assets/js/lib/document-pdf-report-sync.js', 'document-pdf-report', 'document PDF report workspace item type');
  assertIncludes('assets/js/lib/document-pdf-report-sync.js', 'afro-pdf-gate-passed', 'PDF gate completion listener');
  assertIncludes('assets/js/lib/document-pdf-report-sync.js', 'afro-pdf-generated', 'PDF generated listener');
  assertIncludes('assets/js/lib/document-pdf-report-sync.js', 'Metadata only', 'metadata-only privacy copy');
  assertIncludes('assets/js/lib/document-pdf-report-sync.js', 'planTier', 'report plan-tier tagging');

  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'afro_document_pdf_handoff_briefs_v1', 'document PDF handoff local store');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'afro_document_pdf_recipes_v1', 'document PDF recipe local store');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'afro_document_pdf_readiness_v1', 'document PDF readiness local store');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'afro_document_pdf_audit_packets_v1', 'document PDF audit local store');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'planRules', 'document PDF plan gate rules');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'checkPlanGate', 'document PDF free/pro gate checks');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'docpdf-plan-gates', 'document PDF visible plan gate meter');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'docpdf-upgrade-overlay', 'document PDF upgrade modal');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'docpdf-flow-profile', 'document PDF smart workflow profile');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'document-pdf-recipe', 'document PDF recipe workspace item type');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'createWorkflowRecipe', 'document PDF recipe save API');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'getWorkflowProfile', 'document PDF workflow profile API');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'Upgrade to Pro', 'document PDF pro CTA');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'Continue free', 'document PDF free escape hatch');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'document-pdf-handoff', 'document PDF handoff workspace item type');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'document-pdf-readiness', 'document PDF readiness workspace item type');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'document-pdf-audit-packet', 'document PDF audit workspace item type');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'guardPromise', 'gated metadata packet export');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'Exception queue', 'document PDF exception queue UI');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'Salary & PAYE', 'inter-category salary handoff');
  assertIncludes('assets/js/lib/document-pdf-workflow.js', 'AfroPayroll workspace', 'inter-category payroll handoff');

  assertIncludes('assets/css/document-pdf-workflow.css', '.docpdf-flow-lab', 'document PDF workflow lab styles');
  assertIncludes('assets/css/document-pdf-workflow.css', '.docpdf-flow-checklist', 'document PDF checklist styles');
  assertIncludes('assets/css/document-pdf-workflow.css', '.docpdf-flow-exceptions', 'document PDF exception styles');
  assertIncludes('assets/css/document-pdf-workflow.css', '.docpdf-flow-profile', 'document PDF smart workflow profile styles');
  assertIncludes('assets/css/document-pdf-workflow.css', '.docpdf-plan-gates', 'document PDF plan gate styles');
  assertIncludes('assets/css/document-pdf-workflow.css', '.docpdf-upgrade-overlay', 'document PDF upgrade overlay styles');

  assertIncludes('dashboard/index.html', 'afro_document_pdf_reports_v1', 'document PDF report dashboard source');
  assertIncludes('dashboard/index.html', 'afro_document_pdf_handoff_briefs_v1', 'document PDF handoff dashboard source');
  assertIncludes('dashboard/index.html', 'afro_document_pdf_recipes_v1', 'document PDF recipe dashboard source');
  assertIncludes('dashboard/index.html', 'afro_document_pdf_readiness_v1', 'document PDF readiness dashboard source');
  assertIncludes('dashboard/index.html', 'afro_document_pdf_audit_packets_v1', 'document PDF audit dashboard source');
  assertIncludes('dashboard/index.html', 'document-pdf-report', 'document PDF report workspace item type');
  assertIncludes('dashboard/index.html', 'document-pdf-handoff', 'document PDF handoff workspace item type');
  assertIncludes('dashboard/index.html', 'document-pdf-recipe', 'document PDF recipe workspace item type');
  assertIncludes('dashboard/index.html', 'document-pdf-audit-packet', 'document PDF audit workspace item type');
  assertIncludes('dashboard/index.html', 'ws-document-pdf', 'document PDF dashboard tab');
  assertIncludes('dashboard/index.html', 'PDF Workspace', 'document PDF dashboard label');

  assertIncludes('docs/PDF-CATEGORY-WORKFLOW.md', 'afro_document_pdf_reports_v1', 'document PDF report workflow docs');
  assertIncludes('docs/PDF-CATEGORY-WORKFLOW.md', 'document-pdf-handoff', 'document PDF handoff workflow docs');
  assertIncludes('docs/PDF-CATEGORY-WORKFLOW.md', 'document-pdf-recipe', 'document PDF recipe workflow docs');
  assertIncludes('docs/PDF-CATEGORY-WORKFLOW.md', 'Advanced Workflow Features', 'advanced workflow feature docs');
  assertIncludes('docs/PDF-CATEGORY-WORKFLOW.md', 'Smart workflow profile', 'smart workflow profile docs');
  assertIncludes('docs/PDF-CATEGORY-WORKFLOW.md', 'Competitor-Informed Gates', 'competitor-informed gate docs');
  assertIncludes('docs/PDF-CATEGORY-WORKFLOW.md', 'Adobe Acrobat pricing', 'Adobe source URL docs');
  assertIncludes('docs/PDF-CATEGORY-WORKFLOW.md', 'iLovePDF pricing', 'iLovePDF source URL docs');
  assertIncludes('docs/PDF-CATEGORY-WORKFLOW.md', 'Smallpdf pricing', 'Smallpdf source URL docs');
  assertIncludes('docs/PDF-CATEGORY-WORKFLOW.md', 'Continue free', 'free-plan escape hatch docs');
  assertIncludes('docs/PDF-CATEGORY-WORKFLOW.md', 'Category Banner Prompt', 'document PDF banner prompt docs');

  if (failures.length) {
    console.error('Document & PDF workflow verification failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log(`Document & PDF workflow verified (${tools.length} registry tools, report sync, hub planner, dashboard workspace).`);
}

main();
