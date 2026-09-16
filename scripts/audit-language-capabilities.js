'use strict';
// Discovery only: static control differences are review signals, never parity verdicts.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('@playwright/test');
const root = path.resolve(__dirname, '..');

function parseControls(records) {
  return records.map(record => {
    const document = new DOMParser().parseFromString(record.html, 'text/html');
    const scope = document.querySelector('main') || document.body;
    const controls = Array.from(scope.querySelectorAll('input, select, textarea, button, a[download]'))
      .filter(element => !element.closest('nav, footer, header, template'))
      .map(element => ({
        tag: element.tagName.toLowerCase(), id: element.id,
        type: element.getAttribute('type') || '', name: element.getAttribute('name') || '',
        handler: element.getAttribute('onclick') || '',
        label: (element.getAttribute('aria-label') || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160)
      }));
    return { file: record.file, controls, scripts: Array.from(document.querySelectorAll('script[src]')).map(element => element.getAttribute('src')) };
  });
}

async function main() {
  const outputArg = process.argv.find(value => value.startsWith('--output='));
  if (!outputArg) throw new Error('Provide --output=<evidence-json-path>; this audit never writes product files.');
  const output = path.resolve(outputArg.slice('--output='.length));
  const relativeOutput = path.relative(root, output).replace(/\\/g, '/');
  if (!relativeOutput.startsWith('../') && !path.isAbsolute(relativeOutput) && !/^(?:reports|artifacts|audit-results)\//.test(relativeOutput)) {
    throw new Error('Evidence inside the repository must go under reports/, artifacts/ or audit-results/.');
  }
  const french = require('./build-french-free-app-parity-inventory').buildReport();
  const swahili = require('./build-swahili-free-app-parity-inventory').buildReport();
  const swById = new Map(swahili.rows.map(row => [row.englishId, row]));
  const idsArg = process.argv.find(value => value.startsWith('--ids='));
  const requested = idsArg ? new Set(idsArg.slice(6).split(',')) : null;
  const rows = french.rows.filter(row => !requested || requested.has(row.englishId));
  if (requested && rows.length !== requested.size) throw new Error('One or more requested IDs are not in the current free-app inventory.');
  function englishFile(route) {
    const rel = route.replace(/^\//, '').replace(/\/$/, '');
    return [rel + '/index.html', rel + '.html', rel].find(file => fs.existsSync(path.join(root, file)) && fs.statSync(path.join(root, file)).isFile()) || null;
  }
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ offline: true, serviceWorkers: 'block' });
    await context.route('**/*', route => route.abort());
    const page = await context.newPage();
    const results = [];
    for (const row of rows) {
      const sw = swById.get(row.englishId);
      const files = { en: englishFile(row.englishRoute), fr: row.primaryFrenchFile, sw: sw && sw.primarySwahiliFile };
      const records = Object.entries(files).filter(([, file]) => file).map(([locale, file]) => ({locale, file, html: fs.readFileSync(path.join(root, file), 'utf8')}));
      const parsed = await page.evaluate(parseControls, records);
      const locales = {};
      records.forEach((record, index) => {
        locales[record.locale] = { ...parsed[index], sha256: crypto.createHash('sha256').update(record.html).digest('hex') };
      });
      const englishIds = new Set((locales.en?.controls || []).map(control => control.id).filter(Boolean));
      const differences = {};
      for (const locale of ['fr', 'sw']) {
        const ids = new Set((locales[locale]?.controls || []).map(control => control.id).filter(Boolean));
        differences[locale] = { englishControlIdsNotInStaticLocale: [...englishIds].filter(id => !ids.has(id)), localeControlIdsNotInStaticEnglish: [...ids].filter(id => !englishIds.has(id)) };
      }
      results.push({englishId: row.englishId, category: row.categoryKey, locales, differences, verdict: 'requires-workflow-review'});
    }
    const report = { schemaVersion: 1, scope: 'Static EN/FR/SW control and script discovery; scripts were not executed.', limitations: ['Different control IDs can implement equivalent features.', 'Runtime-generated controls are not represented.', 'No correctness, design, export or functional pass is inferred.'], appCount: results.length, rows: results };
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
    console.log(`Recorded static capability evidence for ${results.length} apps; no parity verdicts assigned.`);
  } finally { await browser.close(); }
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { parseControls };
