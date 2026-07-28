#!/usr/bin/env node
'use strict';

/**
 * Report engine artifacts that no page loads.
 *
 * There are two engine directories — `engines/` and `assets/js/engines/` — and
 * pages reference them by absolute path, by relative path, and occasionally via
 * a dynamic `import()`. A grep for `src="/engines/` gets all three wrong: it
 * misses `tools/eac-cet/index.html`, which loads `../../engines/eac-cet-engine.js`,
 * and it never looks at the second directory at all. This resolves every script
 * reference on every page to a repo-relative path before comparing.
 *
 * It also cross-references data/calculation-quality/formula-registry.json,
 * because an unused engine that still carries a protected formula entry is the
 * expensive half of the problem: it inflates the coverage count and spends a
 * written change record every time it is touched.
 *
 * See docs/UNUSED-ENGINE-ARTIFACTS-2026-07.md for the findings this was written
 * to make reproducible.
 *
 * Usage: node scripts/audit-unused-engines.js [--json]
 * Exit code is always 0 — this reports, it does not gate.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JSON_OUT = process.argv.includes('--json');
const ENGINE_DIRS = ['engines', 'assets/js/engines'];
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'audit-results']);

function walkHtml(dir, acc = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, acc);
    else if (entry.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

/** Resolve a script reference found in `pageRel` to a repo-relative path. */
function resolveRef(pageRel, ref) {
  const clean = ref.split('?')[0].split('#')[0];
  if (!clean || /^(https?:)?\/\//.test(clean)) return null;
  const rel = clean.startsWith('/')
    ? clean.replace(/^\/+/, '')
    : path.normalize(path.join(path.dirname(pageRel), clean));
  return rel.replace(/\\/g, '/');
}

function collectLoaded() {
  const loaded = new Set();
  const pages = walkHtml(ROOT);
  for (const file of pages) {
    const pageRel = path.relative(ROOT, file).replace(/\\/g, '/');
    const html = fs.readFileSync(file, 'utf8');
    for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) {
      const rel = resolveRef(pageRel, m[1]);
      if (rel) loaded.add(rel);
    }
    // Dynamic loads: import('/engines/x.js'), fetch('…/engines/x.js')
    for (const m of html.matchAll(/(?:import|fetch)\(\s*["']([^"']*engines\/[^"']+)["']/gi)) {
      const rel = resolveRef(pageRel, m[1]);
      if (rel) loaded.add(rel);
    }
  }
  return { loaded, pageCount: pages.length };
}

/** engineSrc values in the AI vertical configs are a real runtime load path. */
function collectConfiguredEngineSrc() {
  const found = new Set();
  const roots = ['assets/js', 'data'];
  const stack = roots.map((r) => path.join(ROOT, r));
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { stack.push(full); continue; }
      if (!/\.(js|json)$/.test(entry.name)) continue;
      const text = fs.readFileSync(full, 'utf8');
      for (const m of text.matchAll(/engineSrc["'\s:]+["']([^"']+)["']/g)) {
        const rel = m[1].replace(/^\/+/, '').split('?')[0];
        found.add(rel);
      }
    }
  }
  return found;
}

function loadProtectedFormulas() {
  const file = path.join(ROOT, 'data', 'calculation-quality', 'formula-registry.json');
  try {
    const reg = JSON.parse(fs.readFileSync(file, 'utf8'));
    const byPath = new Map();
    for (const formula of reg.formulas || []) {
      const artifact = formula.artifactPath || (formula.parameters && formula.parameters.artifactPath);
      if (artifact) byPath.set(artifact.replace(/\\/g, '/'), formula);
    }
    return byPath;
  } catch { return new Map(); }
}


/**
 * Engines a test or a generator loads directly. "No page loads it" and "nothing
 * uses it" are different claims, and conflating them is how you delete a file
 * that pins the Kenya AHL figures. tests/payroll-backend.test.js loads
 * payslip-engine and staff-cost-engine by path; tests/run.js drives eg-paye and
 * tz-paye; scripts/gen-visa.js reads visa-checker-engine.
 */
function collectNonPageConsumers() {
  const consumers = new Map();
  const stack = [path.join(ROOT, 'tests'), path.join(ROOT, 'scripts')];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { stack.push(full); continue; }
      if (!/\.(js|mjs)$/.test(entry.name)) continue;
      const rel = path.relative(ROOT, full).replace(/\\/g, '/');
      if (rel === 'scripts/audit-unused-engines.js') continue;
      const text = fs.readFileSync(full, 'utf8');
      for (const m of text.matchAll(/(?:engines\/[A-Za-z0-9._-]+\.js)|(?:["']([a-z0-9-]+\.js)["'])/g)) {
        const hit = m[0].replace(/["']/g, '');
        if (!hit.endsWith('.js')) continue;
        for (const dir2 of ENGINE_DIRS) {
          const candidate = hit.includes('/') ? hit : `${dir2}/${hit}`;
          if (fs.existsSync(path.join(ROOT, candidate))) {
            if (!consumers.has(candidate)) consumers.set(candidate, new Set());
            consumers.get(candidate).add(rel);
          }
        }
      }
    }
  }
  return consumers;
}

function main() {
  const { loaded, pageCount } = collectLoaded();
  for (const src of collectConfiguredEngineSrc()) loaded.add(src);
  const protectedByPath = loadProtectedFormulas();
  const nonPage = collectNonPageConsumers();

  const report = { pageCount, directories: {}, unused: [], protectedUnused: [], bytes: 0 };

  for (const dir of ENGINE_DIRS) {
    let names;
    try { names = fs.readdirSync(path.join(ROOT, dir)).filter((n) => n.endsWith('.js')); } catch { names = []; }
    const unused = names.filter((n) => !loaded.has(`${dir}/${n}`)).sort();
    report.directories[dir] = { total: names.length, unused: unused.length };
    for (const name of unused) {
      const rel = `${dir}/${name}`;
      const size = fs.statSync(path.join(ROOT, rel)).size;
      report.bytes += size;
      const formula = protectedByPath.get(rel);
      const consumers = [...(nonPage.get(rel) || [])].sort();
      report.unused.push({ path: rel, bytes: size, formulaId: formula ? formula.id : null, riskLevel: formula ? formula.riskLevel : null, consumers });
      if (formula) report.protectedUnused.push({ path: rel, id: formula.id, riskLevel: formula.riskLevel });
    }
  }

  if (JSON_OUT) { console.log(JSON.stringify(report, null, 2)); return; }

  console.log(`Scanned ${report.pageCount} HTML pages.`);
  for (const [dir, counts] of Object.entries(report.directories)) {
    console.log(`  ${dir}: ${counts.total} artifact(s), ${counts.unused} loaded by no page`);
  }
  const orphans = report.unused.filter((e) => !e.consumers.length);
  const testOnly = report.unused.filter((e) => e.consumers.length);

  console.log(`\nLoaded by no page: ${report.unused.length} file(s), ${(report.bytes / 1024).toFixed(1)} KB`);

  console.log(`\n  Test- or generator-backed (${testOnly.length}) — NOT dead code:`);
  for (const entry of testOnly) {
    const tag = entry.formulaId ? ` [formula: ${entry.riskLevel}]` : '';
    console.log(`    ${entry.path.padEnd(44)} ${String(entry.bytes).padStart(6)} B${tag}`);
    console.log(`      used by: ${entry.consumers.join(', ')}`);
  }

  console.log(`\n  No consumer anywhere (${orphans.length}) — safe to remove:`);
  if (!orphans.length) console.log('    none');
  for (const entry of orphans) {
    const tag = entry.formulaId ? ` [formula: ${entry.riskLevel}]` : '';
    console.log(`    ${entry.path.padEnd(44)} ${String(entry.bytes).padStart(6)} B${tag}`);
  }

  const orphanProtected = orphans.filter((e) => e.formulaId).length;
  if (orphanProtected) {
    console.log(`\n${orphanProtected} orphan(s) carry a protected formula-registry entry, which`);
    console.log('inflates the registry coverage count and costs a written change record');
    console.log('on every edit, for code no user can reach.');
  }
}

main();
