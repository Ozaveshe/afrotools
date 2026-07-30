'use strict';

const fs = require('fs');
const path = require('path');
const { buildReport } = require('./build-french-free-app-parity-inventory');

const ROOT = path.resolve(__dirname, '..');
const CONTROLLER_DIR = path.join(ROOT, 'assets', 'js', 'pages', 'fintech-shared-controllers');

function eligibleController(script) {
  const attrs = script[1] || '';
  const source = script[2] || '';
  return !/\bsrc\s*=/i.test(attrs)
    && !/application\/ld\+json/i.test(attrs)
    && source.length > 500
    && /\bdocument\.(?:getElementById|querySelector)/.test(source)
    && /\bfunction\b/.test(source);
}

function controllerScripts(html) {
  return Array.from(html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi))
    .filter(eligibleController);
}

function writeController(row, source) {
  const output = path.join(CONTROLLER_DIR, `${row.englishId}.js`);
  const banner = [
    "'use strict';",
    '',
    `// Exact controller extracted from tools/${row.englishId}/index.html.`,
    '// English and French route owners load this same file; keep formula changes shared.',
    ''
  ].join('\n');
  fs.writeFileSync(output, `${banner}${source.trim()}\n`, 'utf8');
  return output;
}

function extractRow(row) {
  const englishFile = path.join(ROOT, 'tools', row.englishId, 'index.html');
  let html = fs.readFileSync(englishFile, 'utf8');
  const publicSource = `/assets/js/pages/fintech-shared-controllers/${row.englishId}.js`;
  const externalTag = `<script src="${publicSource}"></script>`;

  if (html.includes(publicSource)) {
    const existing = path.join(CONTROLLER_DIR, `${row.englishId}.js`);
    if (!fs.existsSync(existing)) {
      throw new Error(`${path.relative(ROOT, englishFile)} references missing ${path.relative(ROOT, existing)}`);
    }
    return { englishId: row.englishId, state: 'already-extracted' };
  }

  const scripts = controllerScripts(html);
  if (scripts.length !== 1) {
    throw new Error(
      `${path.relative(ROOT, englishFile)} expected one inline controller, found ${scripts.length}`
    );
  }

  const script = scripts[0];
  const output = writeController(row, script[2]);
  html = `${html.slice(0, script.index)}${externalTag}${html.slice(script.index + script[0].length)}`;
  fs.writeFileSync(englishFile, html, 'utf8');
  return {
    englishId: row.englishId,
    state: 'extracted',
    controller: path.relative(ROOT, output).replace(/\\/g, '/')
  };
}

function main() {
  const rows = buildReport().rows.filter((row) => row.categoryKey === 'fintech');
  if (rows.length !== 31) {
    throw new Error(`Expected 31 Fintech & Banking rows, found ${rows.length}`);
  }
  fs.mkdirSync(CONTROLLER_DIR, { recursive: true });
  const results = rows.map(extractRow);
  for (const result of results) {
    process.stdout.write(`${result.state}\t${result.englishId}\t${result.controller || ''}\n`);
  }
}

main();
