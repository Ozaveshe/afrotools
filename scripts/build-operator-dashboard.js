'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = 'admin/data/operator-dashboard.json';
const hash = text => crypto.createHash('sha256').update(text).digest('hex');

function build(root = ROOT, now = new Date(), imageRoot = root) {
  const evidence = [];
  function read(file, command, sourceRoot = root) {
    const full = path.join(sourceRoot, file);
    if (!fs.existsSync(full)) { evidence.push({ file, command, status: 'unavailable' }); return null; }
    const raw = fs.readFileSync(full, 'utf8');
    const data = JSON.parse(raw);
    evidence.push({ file, command, status: sourceRoot === root ? 'repository snapshot' : 'parent image audit snapshot', local_file: fs.existsSync(path.join(root, file)), sha256: hash(raw), source_commit: data.source_commit || null,
      source_date: data.generated_at || data.generatedAt || data.updatedAt || data.asOf || data.summary?.generated_at || data.summary?.generatedAt || null });
    return data;
  }
  const registry = read('reports/canonical-registry-report.json', 'npm run registry:check');
  const quality = read('reports/tool-quality-ranking.json', 'npm run tools:quality');
  const locale = read('reports/localization-coverage.json', 'npm run localization:check');
  const sources = read('data/source-registry.json', 'npm run source-registry:check');
  const calculation = read('reports/calculation-quality-report.json', 'npm run calculation-quality:check');
  const gates = read('admin/data/pro-gate-coverage.json', 'node scripts/audit-pro-gate-coverage.js');
  const library = read('data/image-generation/image-library.json', 'node scripts/build-image-library.js', imageRoot);
  const batch = read('data/image-generation/next-200.json', 'Review the next-200 image generation ledger', imageRoot);
  // These modules contain product definitions only; never read account or billing records.
  const vm = require('node:vm');
  const context = { window: {} };
  vm.createContext(context);
  for (const file of ['assets/js/lib/pro-app-registry.js', 'assets/js/lib/pro-daily-os-registry.js']) {
    const raw = fs.readFileSync(path.join(root, file), 'utf8');
    vm.runInContext(raw, context, { timeout: 1000 });
    evidence.push({ file, status: 'repository definition', sha256: hash(raw), source_date: null, command: 'npm run pro:verify' });
  }
  const registries = context.window.AfroTools;
  const pro = [...registries.proAppRegistry.getApps(), ...registries.proDailyOsRegistry.getApps()].map(app => ({
    id: app.id, name: app.name, route: app.route,
    status: app.routeStatus || 'preview', state: app.shellState,
    readiness: app.readiness ?? null,
    next: app.needsAttention || 'Validate local records, exports, consent and account boundaries before changing readiness claims.',
    backing: app.dataModel || 'Product definition only; account backing is unverified.',
    gate: gates?.routes.find(row => '/' + row.file.replace(/index\.html$/, '') === app.route)?.status || 'unavailable'
  }));
  const sourceRows = (sources?.sources || []).map(row => {
    const date = Date.parse(row.lastReviewedAt);
    const cadence = Number(row.reviewCadenceDays);
    const age = Number.isFinite(date) ? Math.floor((now - date) / 86400000) : null;
    return { id: row.id, name: row.sourceName, date: row.lastReviewedAt || null, cadence: cadence || null,
      status: age === null || !cadence || age < 0 ? 'unknown' : age > cadence ? 'review overdue' : 'within review cadence',
      recorded_status: row.freshnessStatus, route: row.routes?.[0] || null };
  });
  let revision = null;
  try { revision = cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); } catch (_) { /* Explicit unavailable revision. */ }
  return { schema_version: 1, generated_at: now.toISOString(), revision, evidence,
    registry: registry?.summary || null, quality: quality?.summary || null,
    localization: locale ? { summary: locale.summary, byLocale: locale.byLocale } : null,
    calculation: calculation ? { asOf: calculation.asOf, fixtures: calculation.fixtures, reviewBacklog: calculation.reviewBacklog } : null,
    sources: sourceRows, pro,
    images: library ? { available: true, generated_at: library.generated_at, source_commit: library.source_commit, summary: library.summary, rows: library.images.map(row => ({ ...row, local_file: !row.path.startsWith('/assets/img/new/') && fs.existsSync(path.join(root, row.path.replace(/^\//, ''))) })) } : { available: false, rows: [] },
    batch: batch ? { available: true, generated_at: batch.generated_at, id: batch.batch_id, rows: batch.images.map(row=>({ ...row, local_reference: row.reference_image ? fs.existsSync(path.join(root,row.reference_image.replace(/^\//,''))) : null })) } : { available: false, rows: [] },
    live: { status: 'unavailable', note: 'Revenue, users, subscriptions, provider health and deployment status have not been queried. No live account records are included.' },
    build: { status: 'unverified', note: 'Building this snapshot does not run tests, build dist, or verify a deployment.' }
  };
}

if (require.main === module) {
  const output = path.join(ROOT, OUTPUT);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const index = process.argv.indexOf('--image-root');
  const imageRoot = index >= 0 ? path.resolve(process.argv[index + 1]) : ROOT;
  fs.writeFileSync(output, JSON.stringify(build(ROOT, new Date(), imageRoot), null, 2) + '\n');
  console.log(`Built ${OUTPUT}`);
}
module.exports = { build };
