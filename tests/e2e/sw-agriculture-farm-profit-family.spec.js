const { test, expect } = require('@playwright/test');
const manifest = require('../../data/localization/sw-agriculture-parity-manifest.json');
const frenchManifest = require('../../data/localization/fr-agriculture-parity-manifest.json');
const { alternateEntries } = require('../../scripts/lib/fr-agriculture-hreflang');

const rows = manifest.rows.filter((row) => row.family === 'farm-profit');
const countries = rows.filter((row) => row.country);
const hub = rows.find((row) => !row.country);
const frenchById = new Map(frenchManifest.rows.map((row) => [row.english.id, row.french]));
const expectedOrigin = process.env.PLAYWRIGHT_BASE_URL
  || `http://127.0.0.1:${process.env.PORT || 4173}`;

test.describe.configure({ mode: 'serial' });

function watchRuntime(page) {
  const failures = [];
  const networkWrites = [];
  const externalRequests = [];
  const downloads = [];
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console:${message.text()}`);
  });
  page.on('pageerror', (error) => failures.push(`pageerror:${error.message}`));
  page.on('requestfailed', (request) => failures.push(`request:${request.url()}`));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`http:${response.status()} ${response.url()}`);
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      networkWrites.push(`${request.method()} ${request.url()}`);
    }
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
      externalRequests.push(request.url());
    }
  });
  page.on('download', (download) => downloads.push(download.suggestedFilename()));
  return { failures, networkWrites, externalRequests, downloads };
}

async function assertServerRoot(page) {
  const response = await page.request.get('/tests/fixtures/sw-irrigation-worktree-sentinel.txt');
  expect(response.ok()).toBe(true);
  const text = await response.text();
  expect(text).toContain('worktree=sw-agriculture-irrigation-farm-profit-respin-20260731');
  expect(text).toContain(
    'root=C:\\Users\\Oza\\.codex\\worktrees\\sw-agriculture-irrigation-farm-profit-respin-20260731\\afrotools'
  );
  expect(text).toContain('branch=codex/sw-agriculture-irrigation-farm-profit-respin-20260731');
  expect(new URL(page.url()).origin).toBe(expectedOrigin);
}

async function downloadBuffer(page, action) {
  const pending = page.waitForEvent('download');
  await page.locator(`[data-action="${action}"]`).click();
  const download = await pending;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return {
    filename: download.suggestedFilename(),
    buffer: Buffer.concat(chunks),
  };
}

function clearPdfParserCache() {
  Object.keys(require.cache)
    .filter((file) => file.includes('pdf-parse'))
    .forEach((file) => { delete require.cache[file]; });
}

async function parsePdfFresh(buffer) {
  clearPdfParserCache();
  const parse = require('pdf-parse');
  try {
    return await parse(Buffer.from(buffer));
  } finally {
    clearPdfParserCache();
  }
}

function parseCsv(text) {
  const rowsOut = [];
  let row = [];
  let value = '';
  let quoted = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else value += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(value);
      value = '';
    } else if (character === '\n') {
      row.push(value.replace(/\r$/, ''));
      rowsOut.push(row);
      row = [];
      value = '';
    } else value += character;
  }
  if (value || row.length) {
    row.push(value.replace(/\r$/, ''));
    rowsOut.push(row);
  }
  return rowsOut;
}

async function assertNoHorizontalOverflow(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => (
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  ))).toBe(true);
}

async function assertInvalid(page, submit, label, value, message, restore) {
  const field = page.getByLabel(label);
  await field.fill(value);
  await submit.click();
  await expect(page.getByRole('alert')).toContainText(message);
  await expect(field).toBeFocused();
  await expect(page.locator('#resultPanel')).toBeHidden();
  await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
  expect(await page.evaluate(() => window.__SW_AGRI_TEST__.latest)).toBeNull();
  await field.fill(restore);
}

test(`${hub.english.id} full route local proof`, async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(hub.swahili.route, { waitUntil: 'networkidle' });
  await assertServerRoot(page);

  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('.skip-link')).toHaveAttribute('href', '#contenu');
  await page.locator('.skip-link').focus();
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#contenu')).toBeFocused();
  await expect(page.locator('.country-list a')).toHaveCount(54);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `https://afrotools.com${hub.swahili.route}`
  );
  for (const { hreflang, route } of alternateEntries({
    ...hub,
    french: frenchById.get(hub.english.id),
  })) {
    await expect(page.locator(`link[hreflang="${hreflang}"]`)).toHaveAttribute(
      'href',
      `https://afrotools.com${route}`
    );
  }
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    `https://afrotools.com${hub.swahili.route}`
  );
  const schema = await page.locator('script[type="application/ld+json"]').first()
    .evaluate((node) => JSON.parse(node.textContent));
  expect(schema.inLanguage).toBe('sw');
  await expect(page.locator('[data-ai-routing="farm-profit-calculator"]')).toHaveAttribute(
    'data-ai-consent',
    'required-before-model-send'
  );
  await expect(page.locator('[data-action]')).toHaveCount(0);
  await expect(page.locator('.hero-art')).toHaveAttribute('src', `/${hub.artwork.file}`);
  expect(await page.locator('.hero-art').evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);

  const lightBackground = await page.locator('body')
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor))
    .not.toBe(lightBackground);
  await assertNoHorizontalOverflow(page, 320);
  await assertNoHorizontalOverflow(page, 375);
  expect(runtime.failures).toEqual([]);
  expect(runtime.networkWrites).toEqual([]);
  expect(runtime.externalRequests).toEqual([]);
});

for (const row of countries) {
  test(`${row.english.id} full route local proof`, async ({ page, context }) => {
    const code = row.country.code;
    const runtime = watchRuntime(page);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (payload) => { window.__SHARE_PAYLOAD__ = payload; },
      });
    });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(row.swahili.route, { waitUntil: 'networkidle' });
    await assertServerRoot(page);

    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(await page.locator('meta[name="description"]').getAttribute('content'))
      .not.toMatch(/\brejea ya(?: nchi ya)? [A-Z]{2}\b/);
    await expect(page.locator('.skip-link')).toHaveAttribute('href', '#contenu');
    await page.locator('.skip-link').focus();
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#contenu')).toBeFocused();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://afrotools.com${row.swahili.route}`
    );
    for (const { hreflang, route } of alternateEntries({
      ...row,
      french: frenchById.get(row.english.id),
    })) {
      await expect(page.locator(`link[hreflang="${hreflang}"]`)).toHaveAttribute(
        'href',
        `https://afrotools.com${route}`
      );
    }
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      `https://afrotools.com${row.swahili.route}`
    );
    const schema = await page.locator('script[type="application/ld+json"]').first()
      .evaluate((node) => JSON.parse(node.textContent));
    expect(schema.inLanguage).toBe('sw');
    expect(schema.spatialCoverage.identifier).toBe(code);
    await expect(page.locator('[data-ai-routing="farm-profit-calculator"]')).toHaveAttribute(
      'data-ai-consent',
      'required-before-model-send'
    );
    await expect(page.locator('.hero-art')).toHaveAttribute('src', `/${row.artwork.file}`);
    expect(await page.locator('.hero-art').evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator('body')).not.toContainText(
      /Calculate Farm Profit|Reset|Data Sources|Share result|Export to/i
    );

    const controls = page.locator('#profitForm input,#profitForm select');
    for (let index = 0; index < await controls.count(); index += 1) {
      const controlId = await controls.nth(index).getAttribute('id');
      await expect(page.locator(`label[for="${controlId}"]`)).toHaveCount(1);
    }
    const keyboardOrder = [
      '#crop', '#sellingMethod', '#landType', '#mechanization', '#middleman',
      '#farmSize', '#yieldPerHa', '#marketPrice', '#exportPrice', '#lossPct',
      '#seedCost', '#fertilizerCost', '#herbicideCost', '#pesticideCost',
      '#fungicideCost', '#laborDays', '#laborWage', '#familyLabor', '#landRent',
      '#tractorCost', '#irrigationCost', '#distance', '#transportRate',
      '#marketFees', '#middlemanPct', '#storageMonths', '#storageRate',
      '#loanAmount', '#loanInterest', '#insurancePct',
    ];
    await page.locator(keyboardOrder[0]).focus();
    for (let index = 0; index < keyboardOrder.length; index += 1) {
      await expect(page.locator(keyboardOrder[index])).toBeFocused();
      if (index < keyboardOrder.length - 1) await page.keyboard.press('Tab');
    }
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Hesabu faida au hasara' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Weka upya' })).toBeFocused();

    const lightBackground = await page.locator('body')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.locator('#themeToggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor))
      .not.toBe(lightBackground);

    const submit = page.getByRole('button', { name: 'Hesabu faida au hasara' });
    await expect(page.locator('[data-result-action]')).toHaveCount(7);
    await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
    await submit.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#resultPanel')).toBeVisible();
    await expect(page.locator('#resultPanel')).toBeFocused();
    await expect(page.locator('[data-result-action]:enabled')).toHaveCount(7);
    const proof = await page.evaluate(() => ({
      code: window.__SW_AGRI_TEST__.data.countryCode,
      currency: window.__SW_AGRI_TEST__.data.currency,
      result: window.__SW_AGRI_TEST__.latest.result,
      report: window.__SW_AGRI_TEST__.reportObject(),
      boundaries: ['local', 'export', 'process'].map((sellingMethod) => {
        const api = window.__SW_AGRI_TEST__;
        const input = {
          ...api.latest.input,
          sellingMethod,
          exportPricePerTonne: api.latest.input.marketPricePerTonne * 1.2,
        };
        const result = api.engine.calculate(input, api.data, api.costs);
        return {
          sellingMethod,
          effectivePrice: result.effectivePrice,
          netProfit: result.netProfit,
        };
      }),
    }));
    expect(proof.code).toBe(code);
    expect(proof.result.currency).toBe(proof.currency);
    expect(Number.isFinite(proof.result.netProfit)).toBe(true);
    expect(Number.isFinite(proof.result.totalCost)).toBe(true);
    expect(proof.report.lugha).toBe('sw');
    expect(proof.report.nchi.code).toBe(code);
    expect(proof.report.matokeo.sarafu).toBe(proof.currency);
    expect(proof.report.vyanzo.dataYaMojaKwaMoja).toBe(false);
    expect(proof.boundaries.map((item) => item.sellingMethod))
      .toEqual(['local', 'export', 'process']);
    expect(proof.boundaries.every((item) => Number.isFinite(item.netProfit))).toBe(true);

    const json = await downloadBuffer(page, 'json');
    expect(json.filename).toBe(`afrotools-faida-shamba-${code.toLowerCase()}.json`);
    const reopenedJson = JSON.parse(json.buffer.toString('utf8'));
    expect(reopenedJson.nchi.code).toBe(code);
    expect(reopenedJson.matokeo.faidaHalisi).toBe(proof.result.netProfit);

    const text = await downloadBuffer(page, 'txt');
    expect(text.filename).toBe(`afrotools-faida-shamba-${code.toLowerCase()}.txt`);
    const reopenedText = text.buffer.toString('utf8');
    expect(reopenedText).toContain('makadirio ya faida ya shamba');
    expect(reopenedText).toContain('Faragha: hesabu ya ndani');
    expect(reopenedText).not.toContain('&amp;amp;');

    const csv = await downloadBuffer(page, 'csv');
    expect(csv.filename).toBe(`afrotools-faida-shamba-${code.toLowerCase()}.csv`);
    const reopenedCsv = parseCsv(csv.buffer.toString('utf8'));
    expect(reopenedCsv).toHaveLength(2);
    expect(reopenedCsv[0]).toContain('faida_halisi');
    expect(reopenedCsv[1][1]).toBe(code);
    expect(reopenedCsv[1][8]).toBe(proof.currency);

    const pdf = await downloadBuffer(page, 'pdf');
    expect(pdf.filename).toBe(`afrotools-faida-shamba-${code.toLowerCase()}.pdf`);
    expect(pdf.buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
    const reopenedPdf = await parsePdfFresh(pdf.buffer);
    expect(reopenedPdf.numpages).toBeGreaterThan(0);
    expect(reopenedPdf.text).toMatch(/makadirio ya faida ya shamba/i);
    expect(reopenedPdf.text).toMatch(/Faragha: hesabu ya ndani/i);

    await page.locator('[data-action="save"]').click();
    const saved = await page.evaluate((countryCode) => (
      localStorage.getItem(`afrotools:sw-agriculture:farm-profit:${countryCode}`)
    ), code);
    expect(JSON.parse(saved).nchi.code).toBe(code);
    await page.locator('[data-action="copy"]').click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain('makadirio ya faida ya shamba');
    await page.locator('[data-action="share"]').focus();
    await page.keyboard.press('Enter');
    const shared = await page.evaluate(() => window.__SHARE_PAYLOAD__);
    expect(shared.title).toContain('faida ya shamba');
    expect(shared.text).toContain('makadirio ya faida ya shamba');
    expect(shared.url).toBe(`${expectedOrigin}${row.swahili.route}`);
    expect(shared.url).not.toContain('?');

    await assertNoHorizontalOverflow(page, 320);
    await expect(page.locator('#costCards')).toBeVisible();
    await assertNoHorizontalOverflow(page, 375);

    await page.getByLabel('Ukubwa wa shamba (hekta)').fill('2.5');
    await expect(page.locator('#resultPanel')).toBeHidden();
    await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
    expect(await page.evaluate(() => window.__SW_AGRI_TEST__.latest)).toBeNull();
    const downloadsBeforeStaleAttempt = runtime.downloads.length;
    await page.locator('[data-action="json"]').evaluate((button) => button.click());
    await page.waitForTimeout(50);
    expect(runtime.downloads).toHaveLength(downloadsBeforeStaleAttempt);

    await assertInvalid(page, submit, 'Ukubwa wa shamba (hekta)', '0', 'angalau hekta 0.1', '1');
    await assertInvalid(page, submit, 'Mavuno yanayotarajiwa (tani kwa hekta)', '0', 'zaidi ya sifuri', '1');
    await assertInvalid(page, submit, 'Bei ya soko kwa tani', '0', 'zaidi ya sifuri', '1');
    await assertInvalid(page, submit, 'Hasara baada ya mavuno (%)', '101', 'kati ya 0 na 100', '15');
    await assertInvalid(page, submit, 'Sehemu ya kazi ya familia (%)', '101', 'kati ya 0 na 100', '50');
    await page.getByLabel('Njia ya kuuza').selectOption('export');
    await page.getByLabel('Bei ya eksporti kwa tani — si lazima').fill('');
    await submit.click();
    await expect(page.getByRole('alert')).toContainText('bei halali ya eksporti');
    await expect(page.getByLabel('Bei ya eksporti kwa tani — si lazima')).toBeFocused();
    await expect(page.locator('#resultPanel')).toBeHidden();
    await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);

    expect(runtime.failures).toEqual([]);
    expect(runtime.networkWrites).toEqual([]);
    expect(runtime.externalRequests).toEqual([]);
  });
}
