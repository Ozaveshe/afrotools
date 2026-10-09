const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');
const authorityData = require('../../data/salary-tax/authority-router.json');

async function localOnly(page, baseURL) {
  const errors = [], sensitiveRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if ((request.url() + (request.postData() || '')).includes('SYNTHETIC_FINANCE_PRIVATE')) sensitiveRequests.push(request.url());
  });
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
  return { errors, sensitiveRequests };
}
async function download(page, selector) {
  const pending = page.waitForEvent('download');
  await page.locator(selector).click();
  const file = await pending;
  return { name: file.suggestedFilename(), bytes: fs.readFileSync(await file.path()) };
}
async function clipboard(page, mode) {
  await page.addInitScript(mode => {
    window.__financeCopyText = null;
    if (mode === 'missing') return Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText(value) {
      window.__financeCopyText = value;
      if (mode === 'throw') throw new Error('synthetic clipboard failure');
      if (mode === 'reject') return Promise.reject(new Error('synthetic denied clipboard'));
      return new Promise((resolve, reject) => { window.__finishFinanceCopy = mode === 'late-reject' ? () => reject(new Error('synthetic late denial')) : resolve; });
    } } });
  }, mode);
}

for (const locale of [
  { lang: 'en', route: '/tools/paye-authority-finder/', form: '#authority-form', query: '#authority-query', retry: '#authority-retry', status: '#authority-status' },
  { lang: 'sw', route: '/sw/zana/tafuta-mamlaka-ya-paye/', form: '#authority-form', query: '#authority-query', retry: '#authority-retry', status: '#authority-status' },
  { lang: 'fr', route: '/fr/tools/trouver-administration-paye/', form: '[data-authority-form]', query: '#fr-authority-query', retry: '[data-authority-retry]', status: '[data-authority-status]' }
]) for (const fault of ['503', 'invalid-json', 'timeout', 'timeout-late']) {
  test(`${locale.lang} PAYE ${fault}: real deadline and retry preserve the private query`, async ({ page, baseURL }) => {
    const observed = await localOnly(page, baseURL);
    let requests = 0, releaseLate;
    if (fault === 'timeout-late') await page.addInitScript(() => { window.AbortController = undefined; });
    await page.route('**/data/salary-tax/authority-router.json', async route => {
      requests++;
      if (requests > 1) return route.fulfill({ json: authorityData });
      if (fault === '503') return route.fulfill({ status: 503, body: 'unavailable' });
      if (fault === 'invalid-json') return route.fulfill({ contentType: 'application/json', body: '{invalid' });
      await new Promise(resolve => { releaseLate = resolve; });
      const staleData = JSON.parse(JSON.stringify(authorityData));
      staleData.authorities.forEach(authority => { authority.country_name = 'SYNTHETIC_STALE_AUTHORITY'; });
      await route.fulfill({ json: staleData }).catch(() => {});
    });
    const start = Date.now();
    await page.goto(locale.route);
    const query = page.locator(locale.query), submit = page.locator(locale.form).locator('button[type="submit"]');
    await query.fill('SYNTHETIC_FINANCE_PRIVATE');
    if (fault.startsWith('timeout')) {
      await expect(submit).toBeDisabled();
      await expect(page.locator(locale.retry)).toBeVisible({ timeout: 15000 });
      expect(Date.now() - start).toBeGreaterThanOrEqual(11500);
    } else await expect(page.locator(locale.retry)).toBeVisible();
    await expect(query).toHaveValue('SYNTHETIC_FINANCE_PRIVATE');
    await page.locator(locale.retry).focus();
    await page.keyboard.press('Enter');
    await expect(submit).toBeEnabled();
    await expect(query).toBeFocused();
    expect(requests).toBe(2);
    if (fault === 'timeout-late') {
      const before = await page.locator(locale.status).textContent();
      const completed = page.waitForResponse(response => response.url().includes('/data/salary-tax/authority-router.json'));
      releaseLate();
      await (await completed).finished();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await expect(page.locator(locale.status)).toHaveText(before);
      expect(await page.locator(locale.form).textContent()).not.toContain('SYNTHETIC_STALE_AUTHORITY');
    } else if (releaseLate) releaseLate();
    await expect(query).toHaveValue('SYNTHETIC_FINANCE_PRIVATE');
    await expect(page.locator(locale.retry)).toBeHidden();
    expect(observed.errors).toEqual([]);
    expect(observed.sensitiveRequests).toEqual([]);
    expect(await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage) + location.href)).not.toContain('SYNTHETIC_FINANCE_PRIVATE');
  });
}

const paystackRoutes = [
  ['en', '/tools/paystack-calculator/'], ['fr', '/fr/tools/calculateur-paystack/'], ['ha', '/ha/kayan-aiki/kalkuletan-paystack/'],
  ['sw', '/sw/zana/mpangaji-ada-za-paystack/']
];
async function paystackCalculate(page, amount = '10000') {
  await page.locator('[name="amount"]').fill(amount);
  await page.locator('[data-form] button[type="submit"]').click();
  await expect(page.locator('[data-results]')).toBeVisible();
}
for (const [lang, route] of paystackRoutes) for (const mode of ['missing', 'throw', 'reject', 'late-success', 'late-reject']) {
  test(`${lang} Paystack ${mode}: clipboard recovery belongs to the current result`, async ({ page, baseURL }) => {
    const observed = await localOnly(page, baseURL); await clipboard(page, mode);
    await page.goto(route); await paystackCalculate(page);
    if (mode.startsWith('late')) {
      const downloads = []; page.on('download', file => downloads.push(file.suggestedFilename()));
      await page.locator('[data-action="copy"]').click();
      await page.waitForFunction(() => typeof window.__finishFinanceCopy === 'function');
      await paystackCalculate(page, '20000');
      const status = await page.locator('[data-status]').textContent();
      await page.evaluate(async () => { window.__finishFinanceCopy(); await new Promise(resolve => setTimeout(resolve, 0)); });
      await expect(page.locator('[data-status]')).toHaveText(status);
      expect(downloads).toEqual([]);
    } else {
      const file = await download(page, '[data-action="copy"]');
      expect(file.name).toBe('paystack-fee-plan.txt');
      expect(file.bytes.length).toBeGreaterThan(100);
      if (mode !== 'missing') expect(file.bytes.toString('utf8')).toBe(await page.evaluate(() => window.__financeCopyText));
      await expect(page.locator('[data-results]')).toBeVisible();
    }
    expect(observed.errors).toEqual([]);
  });
}
for (const [lang, route] of paystackRoutes) for (const country of ['NG', 'GH', 'KE', 'ZA']) {
  test(`${lang} ${country}: actual Paystack PDF has readable current currency and page bounds`, async ({ page, baseURL }) => {
    const observed = await localOnly(page, baseURL); await page.goto(route);
    await page.locator('[name="country"]').selectOption(country); await paystackCalculate(page);
    const report = await page.locator('[data-report]').innerText(), bounds = [];
    const file = await download(page, '[data-action="pdf"]');
    expect(file.name).toBe('paystack-fee-plan.pdf');
    const parsed = await pdfParse(file.bytes, { pagerender: async pdfPage => {
      const viewport = pdfPage.getViewport(1), content = await pdfPage.getTextContent();
      for (const item of content.items) if (item.str.trim()) bounds.push({ x: item.transform[4], y: item.transform[5], width: item.width, pageWidth: viewport.width, pageHeight: viewport.height });
      return content.items.map(item => item.str).join(' ');
    } });
    const normalize = value => value.replace(/\s+/g, ' ').trim();
    for (const line of report.split('\n').map(normalize).filter(Boolean)) expect(normalize(parsed.text)).toContain(line);
    expect(bounds.length).toBeGreaterThan(10);
    expect(bounds.every(item => item.x >= 0 && item.y >= 0 && item.x + item.width <= item.pageWidth + 1 && item.y <= item.pageHeight)).toBe(true);
    expect(observed.errors).toEqual([]);
  });
}

for (const [lang, route] of paystackRoutes) for (const fault of ['503', 'invalid-font', 'timeout']) {
  test(`${lang} Paystack PDF ${fault}: real failure stays local and a fresh font retry recovers`, async ({ page, baseURL }) => {
    const observed = await localOnly(page, baseURL);
    let requests = 0, releaseLate;
    await page.route('**/assets/fonts/noto-sans/NotoSans-Regular.ttf', async intercepted => {
      requests++;
      if (requests > 1) return intercepted.continue();
      if (fault === '503') return intercepted.fulfill({ status: 503, body: 'unavailable' });
      if (fault === 'invalid-font') return intercepted.fulfill({ contentType: 'font/ttf', body: Buffer.from('invalid synthetic font') });
      await new Promise(resolve => { releaseLate = resolve; });
      await intercepted.fulfill({ status: 503, body: 'late unavailable' }).catch(() => {});
    });
    const downloads = []; page.on('download', file => downloads.push(file.suggestedFilename()));
    await page.goto(route); await paystackCalculate(page);
    const report = await page.locator('[data-report]').innerText(), start = Date.now();
    await page.locator('[data-action="pdf"]').evaluate(button => { button.click(); button.click(); });
    await expect(page.locator('[data-status]')).toHaveClass(/is-error/, { timeout: 15000 });
    if (fault === 'timeout') expect(Date.now() - start).toBeGreaterThanOrEqual(11500);
    await expect(page.locator('[data-action="pdf"]')).toBeEnabled();
    expect(requests).toBe(1); expect(downloads).toEqual([]);
    await expect(page.locator('[data-report]')).toHaveText(report);
    if (releaseLate) releaseLate();
    const file = await download(page, '[data-action="pdf"]');
    expect(requests).toBe(2); expect(file.name).toBe('paystack-fee-plan.pdf');
    const parsed = await pdfParse(file.bytes);
    expect(parsed.text.replace(/\s+/g, ' ')).toContain(report.split('\n')[0]);
    expect(downloads).toHaveLength(1); expect(observed.errors).toEqual([]);
  });
}

for (const [lang, route] of paystackRoutes) {
  test(`${lang} Paystack delayed PDF font cannot export or overwrite a newer result`, async ({ page, baseURL }) => {
    const observed = await localOnly(page, baseURL);
    let releaseFont, requests = 0;
    await page.route('**/assets/fonts/noto-sans/NotoSans-Regular.ttf', async intercepted => {
      requests++;
      await new Promise(resolve => { releaseFont = resolve; });
      await intercepted.continue();
    });
    const downloads = []; page.on('download', file => downloads.push(file.suggestedFilename()));
    await page.goto(route); await paystackCalculate(page);
    await page.locator('[data-action="pdf"]').click();
    await expect.poll(() => requests).toBe(1);
    await paystackCalculate(page, '20000');
    const status = await page.locator('[data-status]').textContent();
    releaseFont();
    await expect(page.locator('[data-action="pdf"]')).toBeEnabled();
    await expect(page.locator('[data-status]')).toHaveText(status); expect(downloads).toEqual([]);
    const file = await download(page, '[data-action="pdf"]');
    expect(requests).toBe(1); expect(file.name).toBe('paystack-fee-plan.pdf');
    expect(downloads).toHaveLength(1); expect(observed.errors).toEqual([]);
  });
}

for (const [lang, route] of [['en', '/tools/mortgage-affordability/'], ['sw', '/sw/zana/uwezo-wa-mkopo-wa-nyumba/']]) for (const mode of ['missing', 'throw', 'reject', 'late-success', 'late-reject']) {
  test(`${lang} Mortgage ${mode}: fallback uses the current boundary`, async ({ page, baseURL }) => {
    const observed = await localOnly(page, baseURL); await clipboard(page, mode); await page.goto(route);
    await page.locator('#mb-budget').fill('3000'); await page.locator('#mb-costs').fill('500'); await page.locator('#mb-cushion').fill('500');
    await page.locator('#mb-confirm').check(); await page.locator('#mb-form button[type="submit"]').click();
    await expect(page.locator('#mb-boundary')).toContainText('2,000');
    if (mode.startsWith('late')) {
      const downloads = []; page.on('download', file => downloads.push(file.suggestedFilename()));
      await page.locator('#mb-copy').click(); await page.waitForFunction(() => typeof window.__finishFinanceCopy === 'function');
      await page.locator('#mb-budget').fill('4000'); await page.locator('#mb-form button[type="submit"]').click();
      const status = await page.locator('#mb-live').textContent();
      await page.evaluate(async () => { window.__finishFinanceCopy(); await new Promise(resolve => setTimeout(resolve, 0)); });
      await expect(page.locator('#mb-live')).toHaveText(status); expect(downloads).toEqual([]);
    } else {
      const file = await download(page, '#mb-copy'); expect(file.name).toMatch(/\.txt$/); expect(file.bytes.toString('utf8')).toContain('2,000');
      if (mode !== 'missing') expect(file.bytes.toString('utf8')).toBe(await page.evaluate(() => window.__financeCopyText));
    }
    expect(observed.errors).toEqual([]);
  });
}

for (const [lang, route] of [['en', '/tools/home-loan-eligibility/'], ['sw', '/sw/zana/ustahiki-wa-mkopo-wa-nyumba/']]) {
  test(`${lang} Home Loan TXT recalculates changed labels and evidence states`, async ({ page, baseURL }) => {
    const observed = await localOnly(page, baseURL); await page.goto(route);
    await page.locator('#hl-lender').fill('SYNTHETIC_FINANCE_PRIVATE_OLD');
    await page.locator('[data-hl-status]').first().selectOption('ready');
    await page.locator('#hl-form button[type="submit"]').click();
    await expect(page.locator('#hl-ready')).toHaveText('1');
    await page.locator('#hl-lender').fill('SYNTHETIC_FINANCE_PRIVATE_NEW');
    await page.locator('[data-hl-status]').nth(1).selectOption('ready');
    await expect(page.locator('#hl-result')).not.toHaveClass(/on/);
    await expect(page.locator('#hl-download')).toBeHidden();
    await page.locator('#hl-form button[type="submit"]').click();
    const file = await download(page, '#hl-download');
    expect(file.bytes.toString('utf8')).toContain('SYNTHETIC_FINANCE_PRIVATE_NEW');
    expect(file.bytes.toString('utf8')).not.toContain('SYNTHETIC_FINANCE_PRIVATE_OLD');
    await expect(page.locator('#hl-ready')).toHaveText('2');
    expect(observed.sensitiveRequests).toEqual([]); expect(observed.errors).toEqual([]);
  });
}

test('French Home Loan exports all five current counts and rejects a stale summary', async ({ page, baseURL }) => {
  const observed = await localOnly(page, baseURL);
  await page.addInitScript(() => {
    window.__financePrintCalls = 0;
    window.__financeCopied = '';
    window.print = () => { window.__financePrintCalls++; };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__financeCopied = text; } } });
  });
  await page.goto('/fr/tools/eligibilite-pret-immobilier/');
  const declared = await page.locator('#afrotools-fr-finance-export-contract').textContent();
  expect(JSON.parse(declared).formats.slice().sort()).toEqual(['copy', 'print', 'txt']);
  await page.locator('#hl-lender').fill('SYNTHETIC_FINANCE_PRIVATE');
  for (const [index, status] of ['ready', 'gathering', 'update', 'not-requested'].entries()) await page.locator('[data-hl-status]').nth(index).selectOption(status);
  await page.locator('#hl-form button[type="submit"]').click();
  const expectedCounts = { 'Prêts': '1', 'En collecte': '1', 'À mettre à jour': '1', 'Non commencés': '6', 'Non demandés': '1' };
  const assertCounts = text => { for (const [label, value] of Object.entries(expectedCounts)) expect(text).toMatch(new RegExp(label + '\\s*:?\\s*' + value + '\\b')); };
  const file = await download(page, '[data-fr-finance-export-format="txt"]');
  const txt = file.bytes.toString('utf8');
  expect(txt).toContain('SYNTHETIC_FINANCE_PRIVATE'); assertCounts(txt);
  await page.locator('[data-fr-finance-export-format="copy"]').click();
  await expect(page.locator('.fr-finance-export-status')).toContainText('copié');
  const copied = await page.evaluate(() => window.__financeCopied);
  expect(copied.trim()).toBe(txt.trim()); assertCounts(copied);
  await page.locator('[data-fr-finance-export-format="print"]').click();
  expect(await page.evaluate(() => window.__financePrintCalls)).toBe(1);
  const printCounts = await page.locator('#fr-finance-print-contract [data-print-results]').evaluate(list => Object.fromEntries([...list.querySelectorAll('dt')].map(term => [term.textContent, term.nextElementSibling.textContent])));
  expect(printCounts).toMatchObject(expectedCounts);
  await page.emulateMedia({ media: 'print' });
  const pdf = await pdfParse(await page.pdf({ format: 'A4', printBackground: true }));
  expect(pdf.text).toContain('SYNTHETIC_FINANCE_PRIVATE'); assertCounts(pdf.text);
  await page.emulateMedia({ media: 'screen' });
  await page.locator('[data-hl-status]').nth(4).selectOption('ready');
  await expect(page.locator('#hl-result')).not.toHaveClass(/on/);
  const unexpected = []; page.on('download', file => unexpected.push(file.suggestedFilename()));
  await page.locator('[data-fr-finance-export-format="txt"]').click();
  await expect(page.locator('.fr-finance-export-status')).toContainText(/Actualisez|Actualiser/i);
  expect(unexpected).toEqual([]);
  await page.locator('#hl-form button[type="submit"]').click();
  const current = (await download(page, '[data-fr-finance-export-format="txt"]')).bytes.toString('utf8');
  expectedCounts['Prêts'] = '2'; expectedCounts['Non commencés'] = '5'; assertCounts(current);
  expect(observed.sensitiveRequests).toEqual([]); expect(observed.errors).toEqual([]);
});

for (const outcome of ['late-success', 'late-reject']) for (const action of ['edit', 'recalculate', 'txt']) {
  test(`French export ${outcome} after ${action} cannot replace current feedback`, async ({ page, baseURL }) => {
    const observed = await localOnly(page, baseURL); await clipboard(page, outcome);
    await page.goto('/fr/tools/eligibilite-pret-immobilier/');
    await page.locator('#hl-lender').fill('SYNTHETIC_FINANCE_PRIVATE');
    await page.locator('[data-hl-status]').first().selectOption('ready');
    await page.locator('#hl-form button[type="submit"]').click();
    await page.locator('[data-fr-finance-export-format="copy"]').click();
    await page.waitForFunction(() => typeof window.__finishFinanceCopy === 'function');
    if (action === 'txt') await download(page, '[data-fr-finance-export-format="txt"]');
    else {
      await page.locator('[data-hl-status]').nth(1).selectOption('ready');
      if (action === 'recalculate') await page.locator('#hl-form button[type="submit"]').click();
    }
    const status = await page.locator('.fr-finance-export-status').textContent();
    await page.evaluate(async () => { window.__finishFinanceCopy(); await new Promise(resolve => setTimeout(resolve, 0)); });
    await expect(page.locator('.fr-finance-export-status')).toHaveText(status);
    expect(observed.sensitiveRequests).toEqual([]); expect(observed.errors).toEqual([]);
  });
}
