#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { writeFileSyncWithRetry, renameSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const BASE_REF = process.env.GENERIC_APP_BASE_REF || '515a224a202f7775eb7ffa044816289fbbc54ab1';
const OUTPUT = path.join(ROOT, 'data', 'audits', 'generic-app-quality-200.json');
const CHECK = process.argv.includes('--check');
const TARGET = 200;

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

function baseFile(relative) {
  return git(['show', `${BASE_REF}:${relative}`]);
}

function sectionWithClass(html, className) {
  const pattern = new RegExp(
    `<section\\b[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>[\\s\\S]*?<\\/section>`,
    'i'
  );
  return (html.match(pattern) || [])[0] || '';
}

function genericWorkspace(html) {
  const rail = sectionWithClass(html, 'df-upgrade');
  const faq = sectionWithClass(html, 'df-faq');
  return Boolean(rail) && /It is as accurate as the values you enter|completely free, works on any phone|Not sure how to get the most from the .*?Enter .*? and it returns|takes .*? and shows the working, not just a single number/i.test(`${rail}\n${faq}`);
}

function workflowEvidence(html) {
  return {
    controls: (html.match(/<(?:input|select|textarea|button|form)\b/gi) || []).length,
    runtimeMounts: (html.match(/<(?:div|section)\b[^>]*(?:id=["'][^"']*(?:app|root|calculator)[^"']*["']|data-(?:tool|calculator)-root)[^>]*>/gi) || []).length,
    appScripts: (html.match(/<script\b[^>]*src=["'][^"']*(?:engine|calculator|toolkit|workflow|app)[^"']*["']/gi) || []).length,
  };
}

function englishRows() {
  const changed = git(['diff', '--name-only', BASE_REF, '--', 'tools/**/*.html'])
    .split(/\r?\n/).filter(Boolean).sort();
  const rows = [];
  for (const file of changed) {
    const currentPath = path.join(ROOT, file);
    if (!fs.existsSync(currentPath)) continue;
    const before = baseFile(file);
    const after = fs.readFileSync(currentPath, 'utf8');
    if (!genericWorkspace(before) || genericWorkspace(after)) continue;
    const evidence = workflowEvidence(after);
    const accepted = evidence.controls > 0 || evidence.runtimeMounts > 0 || evidence.appScripts > 0
      || fs.existsSync(path.join(path.dirname(currentPath), 'app.html'));
    rows.push({
      route: `/${file.replace(/\\/g, '/').replace(/index\.html$/, '')}`,
      file: file.replace(/\\/g, '/'),
      locale: 'en',
      repair: 'removed-score-oriented-duplicate-workspace',
      accepted,
      evidence,
    });
  }
  return rows;
}

function frenchRows() {
  const registry = fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8');
  const rows = [];
  for (const family of ['tarifs-electricite', 'compteur-prepaye']) {
    const root = path.join(ROOT, 'fr', 'tools', family);
    for (const entry of fs.readdirSync(root, { withFileTypes: true }).filter((item) => item.isDirectory())) {
      const file = path.join(root, entry.name, 'index.html');
      const html = fs.readFileSync(file, 'utf8');
      const id = `${family}-${entry.name}-fr`;
      const expectedCanonical = `https://afrotools.com/fr/tools/${family}/`;
      const accepted = /<meta name="robots" content="noindex,follow">/.test(html)
        && html.includes(`<link rel="canonical" href="${expectedCanonical}">`)
        && !registry.includes(`id: '${id}'`);
      rows.push({
        route: `/fr/tools/${family}/${entry.name}/`,
        file: path.relative(ROOT, file).replace(/\\/g, '/'),
        locale: 'fr',
        repair: 'removed-retired-noindex-bridge-from-live-app-catalog',
        accepted,
        evidence: { registryAbsent: !registry.includes(`id: '${id}'`), canonical: expectedCanonical },
      });
    }
  }
  return rows.sort((a, b) => a.route.localeCompare(b.route));
}

function swahiliRows() {
  const file = 'sw/zana/html-kwenda-pdf/index.html';
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const broken = /data\.content\+['"]<script src=["']\/assets\/js\/lib\/sw-accessibility\.js/i.test(html);
  const runtimeAtDocumentEnd = /<script src="\/assets\/js\/lib\/sw-accessibility\.js(?:\?v=[a-f0-9]+)?" defer><\/script><\/body>/i.test(html);
  return [{
    route: '/sw/zana/html-kwenda-pdf/',
    file,
    locale: 'sw',
    repair: 'fixed-generated-inline-script-parse-failure',
    accepted: !broken && runtimeAtDocumentEnd,
    evidence: { brokenInlineInjectionAbsent: !broken, runtimeAtDocumentEnd },
  }];
}

function build() {
  const rows = [...englishRows(), ...frenchRows(), ...swahiliRows()];
  const accepted = rows.filter((row) => row.accepted).length;
  return {
    schemaVersion: 1,
    baseline: BASE_REF,
    target: TARGET,
    denominator: rows.length,
    accepted,
    status: accepted === rows.length && accepted >= TARGET ? 'accepted' : 'blocked',
    counts: {
      en: rows.filter((row) => row.locale === 'en').length,
      fr: rows.filter((row) => row.locale === 'fr').length,
      sw: rows.filter((row) => row.locale === 'sw').length,
    },
    interpretation: {
      functionalAppRepairs: rows.filter((row) => row.repair === 'removed-score-oriented-duplicate-workspace').length + rows.filter((row) => row.locale === 'sw').length,
      catalogTruthRepairs: rows.filter((row) => row.locale === 'fr').length,
      note: 'Retired French compatibility bridges are catalog-truth repairs, not newly built calculators.',
    },
    rows,
  };
}

const output = `${JSON.stringify(build(), null, 2)}\n`;
if (CHECK) {
  const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : '';
  if (current !== output) {
    console.error('Generic app quality ledger is stale. Run node scripts/build-generic-app-quality-200-ledger.js.');
    process.exitCode = 1;
  } else {
    console.log('Generic app quality ledger is current.');
  }
} else {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  const temporary = `${OUTPUT}.tmp-generic-app-quality`;
  writeFileSyncWithRetry(temporary, output, 'utf8');
  renameSyncWithRetry(temporary, OUTPUT);
  const data = JSON.parse(output);
  console.log(`Generic app quality ledger: ${data.accepted}/${data.denominator} accepted (target ${data.target}).`);
  console.log(`Locale counts: EN ${data.counts.en}, FR ${data.counts.fr}, SW ${data.counts.sw}.`);
}
