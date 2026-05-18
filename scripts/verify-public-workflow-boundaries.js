#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', '.netlify', 'tmp', '.cache', '.claude', '.codex']);
const SKIP_PREFIXES = ['admin/', 'reports/', 'coverage/', 'playwright-report/', 'dashboard/', 'afrowork/', 'pro/'];
const SKIP_FILES = new Set(['mc-7a2f9x.html', 'afrotools-mission-control.html', 'media-kit/index.html']);

const forbidden = [
  /image-design-workflow\.(?:js|css)/i,
  /african-workflow\.(?:js|css)/i,
  /trade-toolkit\.(?:js|css)/i,
  /legal-workflow-copilot\.js/i,
  /document-pdf-workflow\.(?:js|css)/i,
  /category-workflow-lite\.(?:js|css)/i,
  /salary-tax-workflow\.(?:js|css)/i,
  /vat-business-tax-workflow\.(?:js|css)/i,
  /health-workflow\.js/i,
  /workflow-tightening\.css/i,
  /data-african-hub-workflows/i,
  /data-document-pdf-workflow-app/i,
  /data-category-workflow-lite/i,
  /docpdf-public-planner/i,
  /pruneDocPdfWorkspace/i,
  /HEALTH-COMPLETE-PACKAGE/i,
  /HEALTH-HOMEPAGE-PACKAGE/i,
  /health-action-kit/i,
  /health-workflow-builder/i,
  /LEGAL-WORKFLOW-COPILOT/i,
  /LEGAL-COMPETITOR-CHECK/i,
  /LEGAL-ACTION-PACK/i,
  /leg-workflow-copilot/i,
  /legal-action-copy-script/i,
  /Trade Action Desk/i,
  /Operator upgrade/i,
  /Competitor-informed upgrade/i,
  /<strong>Dashboard path<\/strong>|<span[^>]*>Dashboard path<\/span>|Dashboard path<\/h[1-6]>/i,
  /<strong>PDF gate<\/strong>|<span[^>]*>PDF gate<\/span>|PDF gate<\/h[1-6]>/i,
  /email-gated PDF/i,
  /dashboard saves/i,
  /dashboard handoff/i,
  /Saved plan and checklist/i,
  /Saved workflow/i,
  /CHECKLIST COMPLETE/i,
  /Build, save and export this legal workflow/i,
  /Email checklist \+ unlock PDF/i,
];

const publicCopyForbidden = [
  /registry total/i,
  /registry-backed/i,
  /product surfaces?/i,
  /productized/i,
  /ecosystem-only/i,
  /surfaced by bucket/i,
  /section counts below/i,
  /bucketed once/i,
  /source[-\s]monitor/i,
  /freshness desk/i,
  /source changes queued/i,
  /review queue/i,
  /queued builds/i,
  /planned additions/i,
  /tool registry/i,
  /operating layer/i,
  /count logic/i,
  /taxonomy audit/i,
];

const failures = [];
let htmlCount = 0;

function shouldSkip(rel) {
  return SKIP_FILES.has(rel) || SKIP_PREFIXES.some((prefix) => rel.startsWith(prefix));
}

function scanFile(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (shouldSkip(rel)) return;
  htmlCount += 1;
  const html = fs.readFileSync(file, 'utf8');
  const visibleText = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  publicCopyForbidden.forEach((pattern) => {
    if (pattern.test(visibleText)) failures.push(`${rel} visible copy matched ${pattern}`);
  });
}

function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    if (SKIP_DIRS.has(entry.name)) return;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    if (entry.isFile() && entry.name.endsWith('.html')) scanFile(full);
  });
}

walk(ROOT);

if (failures.length) {
  console.error('Public workflow boundary verification failed:');
  failures.slice(0, 50).forEach((failure) => console.error(`- ${failure}`));
  if (failures.length > 50) console.error(`...and ${failures.length - 50} more`);
  process.exit(1);
}

console.log(`Public workflow boundary verified across ${htmlCount} HTML files.`);
