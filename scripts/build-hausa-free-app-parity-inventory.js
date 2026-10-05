'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const REQUIRED_GATES = ['workflow', 'calculations', 'language', 'dynamicStates', 'exports', 'privacy', 'accessibility', 'discovery', 'mobile', 'production'];
const normalize = route => String(route || '').replace(/^https?:\/\/[^/]+/, '').split(/[?#]/)[0].replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
const read = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));

function routeFile(route) {
  const relative = normalize(route).replace(/^\//, '');
  return [relative + '.html', relative + '/index.html'].find(file => fs.existsSync(path.join(ROOT, file))) || null;
}

function fingerprint(files, root = ROOT) {
  const hash = crypto.createHash('sha256');
  for (const file of [...new Set(files)].sort()) {
    const absolute = path.resolve(root, file);
    if (!absolute.startsWith(path.resolve(root) + path.sep) || !fs.existsSync(absolute)) return null;
    hash.update(file.replace(/\\/g, '/') + '\0');
    hash.update(fs.readFileSync(absolute));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function workflowFiles(file) {
  if (!file) return [];
  const files = new Set([file]);
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  // Include directly loaded runtime/style dependencies, their readable owners,
  // and both language catalogs. Dynamic dependencies must be declared in evidence.
  for (const tag of html.match(/<(?:script|link)\b[^>]*>/gi) || []) {
    const value = tag.match(/\b(?:src|href)=["']([^"']+)["']/i)?.[1];
    if (!value) continue;
    const url = new URL(value, 'https://afrotools.com/' + file);
    if (url.origin !== 'https://afrotools.com' || !/\.(?:js|css)$/.test(url.pathname)) continue;
    const relative = url.pathname.replace(/^\//, '');
    for (const candidate of [relative, relative.replace(/\.min\.(js|css)$/, '.$1'), relative.replace(/\/([^/]+)$/, '/src/$1')]) {
      if (fs.existsSync(path.join(ROOT, candidate))) files.add(candidate);
    }
  }
  return [...files];
}

function verification(entry, currentFingerprint, minimumFiles = []) {
  if (!entry) return { status: 'not-reviewed', accepted: false };
  if (entry.status !== 'accepted') return { status: entry.status, accepted: false };
  const evidence = entry.evidence;
  if (!evidence || !currentFingerprint || evidence.sourceFingerprint !== currentFingerprint) return { status: 'needs-revalidation', accepted: false };
  if (!minimumFiles.every(file => evidence.sourceFiles?.includes(file))) return { status: 'incomplete-evidence', accepted: false };
  if (!/^[a-f0-9]{40}$/.test(evidence.testedRevision || '') || !evidence.reviewedAt || !evidence.editor || !evidence.independentReviewer) return { status: 'incomplete-evidence', accepted: false };
  if (!REQUIRED_GATES.every(gate => evidence.gates?.[gate]?.status === 'passed' && evidence.gates[gate].receipt)) return { status: 'incomplete-evidence', accepted: false };
  if (!/^[a-f0-9]{40}$/.test(evidence.productionRevision || '')) return { status: 'incomplete-evidence', accepted: false };
  return { status: 'accepted', accepted: true };
}

function buildReport() {
  const directory = read('data/tool-directory.json');
  const english = directory.filter(row => normalize(row.url) !== '/pro');
  if (new Set(english.map(row => row.id)).size !== english.length) throw new Error('Duplicate English IDs');
  const coverage = read('data/registry/locale-page-coverage.json').records.filter(row => row.locale === 'ha');
  const entries = read('data/audits/hausa-free-app-acceptance.json').entries;
  const byId = new Map(entries.map(row => [row.englishId, row]));
  if (byId.size !== entries.length) throw new Error('Duplicate Hausa acceptance IDs');
  for (const entry of entries) if (!english.some(row => row.id === entry.englishId)) throw new Error('Unknown acceptance ID: ' + entry.englishId);
  const rows = english.map(row => {
    const candidates = coverage.filter(candidate => normalize(candidate.equivalentRoute || candidate.fallbackRoute) === normalize(row.url))
      .map(candidate => ({ route: candidate.route, coverageState: candidate.state, sourceOwner: candidate.sourceOwner, file: routeFile(candidate.route) }))
      .sort((a, b) => a.route.localeCompare(b.route));
    const entry = byId.get(row.id);
    const primary = candidates.find(candidate => entry && normalize(candidate.route) === normalize(entry.hausaRoute)) || candidates[0] || null;
    if (entry && !candidates.some(candidate => normalize(candidate.route) === normalize(entry.hausaRoute))) throw new Error('Acceptance route not mapped: ' + row.id);
    const pageFiles = [routeFile(row.url), primary?.file].filter(Boolean);
    const minimumFiles = primary?.file
      ? [...new Set(pageFiles.flatMap(workflowFiles).concat(['lang/en.json', 'lang/ha.json']))].sort()
      : pageFiles;
    const sourceFiles = [...new Set([...minimumFiles, ...(entry?.evidence?.sourceFiles || [])])].sort();
    const sourceFingerprint = primary && primary.file ? fingerprint(sourceFiles) : null;
    const current = verification(entry, sourceFingerprint, minimumFiles);
    if (current.accepted && (!primary || primary.coverageState === 'english-fallback')) {
      current.accepted = false;
      current.status = 'ineligible-route';
    }
    return {
      englishId: row.id, englishName: row.name, englishRoute: row.url, categoryKey: row.category_key,
      primaryHausaRoute: primary?.route || null, primaryHausaFile: primary?.file || null,
      state: !primary ? 'unmapped' : !primary.file ? 'missing-file' : entry?.status === 'partial-workflow' ? 'partial-workflow' : primary.coverageState === 'english-fallback' ? 'english-fallback' : primary.coverageState === 'localized-shell' ? 'localized-shell-candidate' : 'native-candidate',
      verification: current.status, accepted: Boolean(primary?.file && current.accepted),
      unresolved: entry?.unresolved || [], sourceFiles, sourceFingerprint, candidates
    };
  });
  const totals = { englishFreeApps: rows.length, excludedPaidRows: directory.length - rows.length, mapped: rows.filter(row => row.primaryHausaRoute).length, accepted: rows.filter(row => row.accepted).length };
  for (const row of rows) totals[row.state] = (totals[row.state] || 0) + 1;
  return { schemaVersion: 1, scope: {
    denominator: 'data/tool-directory.json excluding /pro',
    mapping: 'data/registry/locale-page-coverage.json equivalentRoute/fallbackRoute',
    acceptance: 'data/audits/hausa-free-app-acceptance.json',
    caveat: 'Unmapped means unresolved in the authoritative mapping, not proof that no implementation exists. Fingerprints of candidate files are baseline measurements, not test or native-editor evidence. Accepted evidence must declare all workflow, engine, generator, lexicon, export and shared dependencies; a static script name alone is not execution proof.',
    requiredGates: REQUIRED_GATES
  }, totals, rows };
}

function markdown(report) {
  return '# Hausa Free-App Parity Inventory\n\nGenerated by `node scripts/build-hausa-free-app-parity-inventory.js --write`.\n\n' +
    `English apps: **${report.totals.englishFreeApps}**. Mapped: **${report.totals.mapped}**. Fully accepted: **${report.totals.accepted}**.\n\n` +
    report.scope.caveat + '\n\n| English ID | Hausa route | State | Verification |\n|---|---|---|---|\n' +
    report.rows.map(row => `| ${row.englishId} | ${row.primaryHausaRoute || 'Unmapped'} | ${row.state} | ${row.verification} |`).join('\n') + '\n';
}

function run(write) {
  const report = buildReport();
  for (const [file, content] of [
    ['reports/hausa-free-app-parity-inventory.json', JSON.stringify(report, null, 2) + '\n'],
    ['reports/hausa-free-app-parity-inventory.md', markdown(report)]
  ]) {
    if (write) fs.writeFileSync(path.join(ROOT, file), content);
    else if (!fs.existsSync(path.join(ROOT, file)) || fs.readFileSync(path.join(ROOT, file), 'utf8') !== content) throw new Error(file + ' is stale. Run the builder with --write.');
  }
  console.log(JSON.stringify(report.totals));
}

if (require.main === module) run(process.argv.includes('--write'));
module.exports = { buildReport, verification, fingerprint, REQUIRED_GATES };
