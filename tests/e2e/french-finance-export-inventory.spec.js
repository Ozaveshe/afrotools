const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '../..');
const manifest = require('../../data/registry/french-finance-tax-market-data.json');
const PART_DIR = path.join(ROOT, 'test-results', 'french-finance-export-inventory-parts');
const CHUNK_SIZE = 6;
const RUN_ID = process.env.FRENCH_FINANCE_EXPORT_INVENTORY_RUN_ID || new Date().toISOString();
const REQUESTED_PARTS = new Set(
  String(process.env.FRENCH_FINANCE_EXPORT_INVENTORY_PARTS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite)
);

function syntheticValue(input) {
  const name = `${input.name || ''} ${input.id || ''} ${input.label || ''}`.toLowerCase();
  if (input.type === 'email' || input.type === 'file' || input.type === 'password') return null;
  if (input.type === 'date') return '2026-07-01';
  if (input.type === 'month') return '2026-07';
  if (input.type === 'text' || input.type === 'search' || input.type === 'url' || input.type === 'tel') {
    if (/address|contract|wallet/.test(name)) return '0x000000000000000000000000000000000000dEaD';
    if (/name|nom|title|titre/.test(name)) return 'Cas synthétique';
    return null;
  }
  if (input.type !== 'number' && input.inputMode !== 'decimal' && input.inputMode !== 'numeric') return null;
  let value = /rate|taux|percent|pourcent/.test(name) ? 5
    : /year|ann[ée]e|term|dur[ée]e|period|mois/.test(name) ? 10
      : /age/.test(name) ? 35
        : /price|cost|salary|salaire|gross|brut|amount|montant|income|revenu|capital|loan|pr[êe]t|value|valeur/.test(name) ? 12345
          : 100;
  if (Number.isFinite(input.min)) value = Math.max(value, input.min);
  if (Number.isFinite(input.max)) value = Math.min(value, input.max);
  return String(value);
}

async function inspectSurface(page, route) {
  const requestsWithFixture = [];
  const onRequest = (request) => {
    requestsWithFixture.push({
      url: request.url(),
      postData: request.postData() || ''
    });
  };
  page.on('request', onRequest);
  await page.addInitScript(() => {
    if (typeof window.Chart !== 'function') {
      window.Chart = function ChartStub() {
        return {
          destroy() {},
          resize() {},
          update() {}
        };
      };
    }
  });
  await page.route('**/*', async (intercepted) => {
    const url = new URL(intercepted.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') await intercepted.continue();
    else await intercepted.abort();
  });
  const response = await page.goto(route, { waitUntil: 'load', timeout: 15000 });
  await expect(page.locator('h1').first()).toBeAttached();
  const inputMeta = await page.locator('input,select,textarea').evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const label = element.labels && element.labels[0] ? element.labels[0].textContent.trim() : '';
    return {
      tag: element.tagName.toLowerCase(),
      type: (element.getAttribute('type') || element.tagName).toLowerCase(),
      id: element.id,
      name: element.getAttribute('name') || '',
      label,
      inputMode: element.getAttribute('inputmode') || '',
      min: element.min === '' ? null : Number(element.min),
      max: element.max === '' ? null : Number(element.max),
      visible: style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0,
      disabled: element.disabled
    };
  }));
  const fixtures = [];
  const controls = page.locator('input,select,textarea');
  for (let index = 0; index < inputMeta.length; index += 1) {
    const meta = inputMeta[index];
    if (!meta.visible || meta.disabled) continue;
    const locator = controls.nth(index);
    if (meta.tag === 'select') {
      const options = await locator.locator('option:not([disabled])').evaluateAll((items) => items.map((item) => item.value).filter(Boolean));
      if (options.length) {
        await locator.selectOption(options[0]).catch(() => {});
        fixtures.push({ selector: meta.id ? `#${meta.id}` : `${meta.tag}[name="${meta.name}"]`, label: meta.label, value: options[0] });
      }
      continue;
    }
    const value = syntheticValue(meta);
    if (value === null) continue;
    await locator.fill(value).catch(() => {});
    fixtures.push({ selector: meta.id ? `#${meta.id}` : `${meta.tag}[name="${meta.name}"]`, label: meta.label, value });
  }
  const bodyBefore = await page.locator('body').innerText();
  const calculateButtons = page.getByRole('button', {
    name: /calculer|calculate|estimer|estimate|comparer|compare|projeter|project|v[ée]rifier|check|analyser|analyze|voir le r[ée]sultat|show result/i
  });
  const count = await calculateButtons.count();
  for (let index = 0; index < count; index += 1) {
    const button = calculateButtons.nth(index);
    if (await button.isVisible().catch(() => false) && await button.isEnabled().catch(() => false)) {
      await button.click().catch(() => {});
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      break;
    }
  }
  const actions = await page.locator('button,a,input[type="button"],input[type="submit"]').evaluateAll((elements) => {
    const actionPattern = /\b(pdf|csv|json|txt|texte|text|ics|calendrier|calendar|png|jpe?g|svg|imprimer|impression|print|copier|copy|t[ée]l[ée]charger|download)\b/i;
    function formatFor(signal) {
      if (/\b(?:imprimer|impression|print)\b/i.test(signal)) return 'print';
      if (/\b(?:copier|copy)\b/i.test(signal)) return 'copy';
      if (/\bpdf\b/i.test(signal)) return 'pdf';
      if (/\bcsv\b/i.test(signal)) return 'csv';
      if (/\bjson\b/i.test(signal)) return 'json';
      if (/\b(?:txt|texte|text)\b/i.test(signal)) return 'txt';
      if (/\b(?:ics|calendrier|calendar)\b/i.test(signal)) return 'ics';
      if (/\bpng\b/i.test(signal)) return 'png';
      if (/\bjpe?g\b/i.test(signal)) return 'jpeg';
      if (/\bsvg\b/i.test(signal)) return 'svg';
      if (/\b(?:t[ée]l[ée]charger|download)\b/i.test(signal)) return 'download';
      return null;
    }
    return elements.map((element, index) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const label = (element.getAttribute('aria-label') || element.getAttribute('title') || element.value || element.textContent || '')
        .replace(/\s+/g, ' ').trim();
      if (/^(?:import|importer)\b/i.test(label)) return null;
      if (element.closest('nav,footer,afro-navbar,afro-footer,afro-related-tools,[data-chat],[class*="chat"]')) return null;
      if (element.tagName === 'A') {
        const actionBound = element.hasAttribute('download')
          || element.hasAttribute('onclick')
          || [...element.attributes].some((attribute) => /^data-(?:export|download|copy|print|pdf|csv|json|txt|image)/i.test(attribute.name));
        if (!actionBound) return null;
      }
      const signal = [
        label,
        element.id,
        element.className,
        element.getAttribute('onclick') || '',
        element.getAttribute('download') || '',
        [...element.attributes].filter((attribute) => attribute.name.startsWith('data-')).map((attribute) => attribute.name).join(' ')
      ].join(' ');
      if (!actionPattern.test(signal)) return null;
      const format = formatFor(signal);
      const visible = style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
      const selector = element.id
        ? `#${element.id}`
        : [...element.attributes].find((attribute) => attribute.name.startsWith('data-') && attribute.name.includes(format || 'export'))?.name
          ? `[${[...element.attributes].find((attribute) => attribute.name.startsWith('data-') && attribute.name.includes(format || 'export')).name}]`
          : `runtime-index:${index}`;
      return {
        tag: element.tagName.toLowerCase(),
        format,
        selector,
        label,
        visible,
        disabled: Boolean(element.disabled)
      };
    }).filter(Boolean);
  });
  const bodyAfter = await page.locator('body').innerText();
  const fixtureValues = fixtures.map((fixture) => fixture.value).filter((value) => String(value).length >= 2);
  const leaked = requestsWithFixture.filter((request) => fixtureValues.some((value) => (
    request.url.includes(encodeURIComponent(value)) || request.url.includes(value) || request.postData.includes(value)
  )));
  page.off('request', onRequest);
  await page.unroute('**/*');
  return {
    route,
    httpStatus: response ? response.status() : null,
    fixtures,
    bodyChanged: bodyBefore !== bodyAfter,
    resultExcerpt: bodyAfter.slice(0, 1000),
    actions,
    visibleActions: actions.filter((action) => action.visible && !action.disabled),
    fixtureNetworkLeaks: leaked
  };
}

fs.mkdirSync(PART_DIR, { recursive: true });
expect(manifest.count).toBe(132);

for (let start = 0; start < manifest.rows.length; start += CHUNK_SIZE) {
  const part = Math.floor(start / CHUNK_SIZE) + 1;
  if (REQUESTED_PARTS.size > 0 && !REQUESTED_PARTS.has(part)) continue;
  const scopedRows = manifest.rows.slice(start, start + CHUNK_SIZE);
  test(`French finance export inventory ${part}: rows ${start + 1}-${start + scopedRows.length}`, async ({ browser }) => {
    test.setTimeout(300000);
    const rows = [];
    for (const item of scopedRows) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
      const page = await context.newPage();
      const english = await inspectSurface(page, item.englishRoute);
      await context.close();
      const frenchContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
      const frenchPage = await frenchContext.newPage();
      const french = await inspectSurface(frenchPage, item.frenchRoute);
      await frenchContext.close();
      rows.push({ englishRoute: item.englishRoute, frenchRoute: item.frenchRoute, english, french });
    }
    fs.writeFileSync(
      path.join(PART_DIR, `part-${part}.json`),
      `${JSON.stringify({ schemaVersion: 1, runId: RUN_ID, part, start, rows }, null, 2)}\n`
    );
  });
}
