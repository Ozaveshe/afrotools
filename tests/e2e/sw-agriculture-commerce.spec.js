const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');
const { prepareText } = require('../../assets/js/lib/agriculture-report-pdf');

test.setTimeout(180000);

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  expect(quoted, 'CSV quoted fields are complete').toBe(false);
  return rows;
}

function watch(page) {
  const errors = [], writes = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', r => { if (!['GET', 'HEAD'].includes(r.method())) writes.push(r.method() + ' ' + r.url()); });
  return () => { expect(errors).toEqual([]); expect(writes).toEqual([]); };
}

async function download(page, format) {
  const pending = page.waitForEvent('download');
  await page.locator(`[data-export=${format}]`).click();
  return fs.readFileSync(await (await pending).path());
}

async function verifyCsv(page) {
  const rows = parseCsv((await download(page, 'csv')).toString('utf8'));
  expect(rows[0]).toEqual(['maelezo']);
  expect(rows.every(row => row.length === 1)).toBe(true);
  const visible = await page.locator('[data-readable-result] > p').allTextContents();
  expect(rows.slice(1).map(row => row[0])).toEqual(visible);
  expect(rows.length).toBeGreaterThan(10);
}

const workflows = [
  { id: 'cooperative-calculator', slug: 'kikokotoo-cha-ushirika', field: '#agri-coop-revenue', value: '110000' },
  { id: 'warehouse-receipt', slug: 'stakabadhi-ghalani', field: '#agri-wrs-quantityTonnes', value: '11' },
  { id: 'coffee-calculator', slug: 'kikokotoo-kahawa', field: '#agri-coffee-farmHa', value: '2' },
];

for (const workflow of workflows) {
  test(`${workflow.id}: Enter and direct submit preserve immediate CSV through unchanged blur`, async ({ page }) => {
    const check = watch(page);
    await page.goto(`/sw/zana/${workflow.slug}/`);
    const initial = await page.locator(workflow.field).inputValue();
    if (workflow.id === 'cooperative-calculator') {
      await expect(page.locator('#agri-coop-currency')).toHaveValue('KES');
      await expect(page.locator('#agri-coop-memberProducePayment')).toHaveValue('');
      await expect(page.locator('#agri-coop-producePaymentsIncluded')).not.toBeChecked();
      await expect(page.locator('#agri-coop-dividend')).toHaveValue('20');
    }
    for (const submit of ['Enter', 'requestSubmit']) {
      await page.locator(workflow.field).fill(workflow.value);
      if (submit === 'Enter') await page.locator(workflow.field).press('Enter');
      else await page.locator('[data-agri-form]').evaluate(form => form.requestSubmit());
      await expect(page.locator('[data-result]')).toBeVisible();
      const before = await page.evaluate(() => window.__SW_AGRI_TEST__.getLatest());
      await verifyCsv(page);
      await page.locator(workflow.field).dispatchEvent('change');
      await page.locator(workflow.field).dispatchEvent('blur');
      expect(await page.evaluate(() => window.__SW_AGRI_TEST__.getLatest())).toEqual(before);
      await expect(page.locator('[data-result]')).toBeVisible();
      await verifyCsv(page);
      const exported = JSON.parse((await download(page, 'json')).toString('utf8'));
      expect(exported.result).toEqual(before);
      if (workflow.id === 'cooperative-calculator') {
        expect(exported.input.currency).toBe('KES');
        expect(exported.result.surplus).toBe(40000);
        expect(exported.result.memberDividend).toBe(160);
        expect(exported.result.comparison).toBeNull();
      }
    }
    // A silent value change must not allow an export of the previous result.
    const files = [];
    page.on('download', file => files.push(file.suggestedFilename()));
    await page.locator(workflow.field).evaluate(field => { field.value = String(Number(field.value) + 1); });
    await page.locator('[data-export=csv]').click();
    await expect(page.locator('[data-result]')).toBeHidden();
    expect(await page.evaluate(() => window.__SW_AGRI_TEST__.getLatest())).toBeNull();
    expect(files).toEqual([]);
    await page.locator('[data-agri-form] [type=reset]').click();
    await expect(page.locator(workflow.field)).toHaveValue(initial);
    check();
  });
}

test('Coffee: four modes download readable reports and reopen inputs instead of forged results', async ({ page }) => {
  const check = watch(page);
  await page.goto('/sw/zana/kikokotoo-kahawa/');
  for (const mode of ['lookup', 'yield', 'quality', 'processing']) {
    await page.locator('#agri-coffee-mode').selectOption(mode);
    await page.locator('[data-agri-form] [type=submit]').click();
    await expect(page.locator('[data-result]')).toBeVisible();
    const record = JSON.parse((await download(page, 'json')).toString('utf8'));
    expect(record.input.mode).toBe(mode);
    const txt = (await download(page, 'txt')).toString('utf8');
    await verifyCsv(page);
    const pdf = await pdfParse(await download(page, 'pdf'));
    expect(pdf.numpages).toBeGreaterThan(0);
    expect(pdf.text.replace(/^\s*\d+\s*\/\s*\d+\s*$/gm, '').replace(/\s/g, '')).toContain(prepareText(txt).replace(/\s/g, ''));
    record.result = { forged: 999999 };
    if (mode === 'quality') record.input.annualGreenKg = 321;
    if (mode === 'processing') record.input.cherryKg = 6000;
    await page.locator('[data-import]').setInputFiles({ name: 'synthetic-coffee.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(record)) });
    await expect(page.locator('[data-status]')).toContainText('imefunguliwa');
    const reopened = JSON.parse((await download(page, 'json')).toString('utf8'));
    expect(reopened.input).toEqual(record.input);
    expect(reopened.result).not.toHaveProperty('forged');
    expect(reopened.result.mode).toBe(mode);
    if (mode === 'quality') expect(reopened.result.calculation.estimatedGreenKg).toBe(321);
    if (mode === 'processing') {
      expect(reopened.result.calculation.parchmentDryingCostUSD).toBe(120);
      expect(reopened.result.calculation.totalCostUSD).toBe(1692);
    }
  }
  check();
});

test('Coffee: all eight countries couple valid selections across all four modes', async ({ page }) => {
  const check = watch(page);
  await page.goto('/sw/zana/kikokotoo-kahawa/');
  for (const country of ['ET', 'KE', 'TZ', 'UG', 'RW', 'BI', 'CI', 'CM']) {
    await page.locator('#agri-coffee-countryCode').selectOption(country);
    for (const mode of ['lookup', 'yield', 'quality', 'processing']) {
      await page.locator('#agri-coffee-mode').selectOption(mode);
      await page.locator('[data-agri-form] [type=submit]').click();
      await expect(page.locator('[data-result]')).toBeVisible();
      const latest = await page.evaluate(() => window.__SW_AGRI_TEST__.getLatest());
      expect(latest.mode).toBe(mode);
      expect(latest.input.countryCode).toBe(country);
      if (mode === 'yield' || mode === 'processing') expect(await page.evaluate(() => window.COFFEE_DATA.gradingSystems[document.querySelector('#agri-coffee-countryCode').value].species.includes(document.querySelector('#agri-coffee-species').value))).toBe(true);
    }
  }
  check();
});

test('Cooperative, Warehouse and Coffee: English and French forms reflow with accessible controls', async ({ page }, testInfo) => {
  const rows = [];
  for (const theme of ['light', 'dark']) for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    for (const locale of ['en', 'fr']) for (const id of ['cooperative-calculator', 'warehouse-receipt', 'coffee-calculator']) {
      await page.goto(`${locale === 'fr' ? '/fr' : ''}/agriculture/${id}/`);
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const violations = await page.evaluate(async () => (await window.axe.run('main', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(row => ({ id: row.id, nodes: row.nodes.map(node => node.target) })));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      rows.push({ locale, id, width, theme, violations });
    }
  }
  await page.setViewportSize({ width: 640, height: 900 });
  for (const locale of ['en', 'fr']) for (const id of ['cooperative-calculator', 'warehouse-receipt', 'coffee-calculator']) {
    await page.goto(`${locale === 'fr' ? '/fr' : ''}/agriculture/${id}/`);
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${locale}/${id}: 200% zoom`).toBe(true);
  }
  expect(rows).toHaveLength(24);
  await testInfo.attach('commerce-en-fr-accessibility.json', { body: Buffer.from(JSON.stringify(rows, null, 2)), contentType: 'application/json' });
  expect(rows.filter(row => row.violations.length), 'All 24 English/French accessibility profiles').toEqual([]);
});
