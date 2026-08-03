const { test, expect } = require('@playwright/test');
const manifest = require('../../data/localization/sw-agriculture-parity-manifest.json');
const frenchManifest = require('../../data/localization/fr-agriculture-parity-manifest.json');

const rows = manifest.rows.filter((row) => row.family === 'irrigation');
const countries = rows.filter((row) => row.country);
const hub = rows.find((row) => !row.country);
const frenchById = new Map(frenchManifest.rows.map((row) => [row.english.id, row.french.route]));
const expectedOrigin = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${process.env.PORT || 4173}`;

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
    path: await download.path(),
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
  const rows = [];
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
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(value);
      value = '';
    } else if (character === '\n') {
      row.push(value.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }
  if (value || row.length) {
    row.push(value.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
}

async function assertNoHorizontalOverflow(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(await page.evaluate(() => (
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  ))).toBe(true);
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
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
    'href',
    `https://afrotools.com${hub.english.route}`
  );
  await expect(page.locator('link[hreflang="sw"]')).toHaveAttribute(
    'href',
    `https://afrotools.com${hub.swahili.route}`
  );
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute(
    'href',
    `https://afrotools.com${frenchById.get(hub.english.id)}`
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    `https://afrotools.com${hub.swahili.route}`
  );
  await expect(page.locator('.hero-art')).toHaveAttribute('src', `/${hub.artwork.file}`);
  expect(await page.locator('.hero-art').evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
  const schema = await page.locator('script[type="application/ld+json"]').first()
    .evaluate((node) => JSON.parse(node.textContent));
  expect(schema.inLanguage).toBe('sw');
  await expect(page.locator('[data-ai-routing="irrigation-calculator"]')).toHaveAttribute(
    'data-ai-consent',
    'required-before-model-send'
  );
  await expect(page.locator('[data-action]')).toHaveCount(0);

  const lightBackground = await page.locator('body')
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const darkBackground = await page.locator('body')
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(darkBackground).not.toBe(lightBackground);
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
    await expect(page.locator('.skip-link')).toHaveAttribute('href', '#contenu');
    await page.locator('.skip-link').focus();
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#contenu')).toBeFocused();
    await expect(page.locator('body')).not.toContainText(/\bexports\b/i);
    expect(await page.locator('meta[name="description"]').getAttribute('content'))
      .not.toMatch(/\brejea ya(?: nchi ya)? [A-Z]{2}\b/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://afrotools.com${row.swahili.route}`
    );
    await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
      'href',
      `https://afrotools.com${row.english.route}`
    );
    await expect(page.locator('link[hreflang="sw"]')).toHaveAttribute(
      'href',
      `https://afrotools.com${row.swahili.route}`
    );
    await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute(
      'href',
      `https://afrotools.com${frenchById.get(row.english.id)}`
    );
    if (code === 'NG') {
      await expect(page.locator('link[hreflang="ha"]')).toHaveAttribute(
        'href',
        'https://afrotools.com/ha/noma/ban-ruwa-najeriya/'
      );
    } else {
      await expect(page.locator('link[hreflang="ha"]')).toHaveCount(0);
    }
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      `https://afrotools.com${row.swahili.route}`
    );
    await expect(page.locator('.hero-art')).toHaveAttribute('src', `/${row.artwork.file}`);
    expect(await page.locator('.hero-art').evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
    const schema = await page.locator('script[type="application/ld+json"]').first()
      .evaluate((node) => JSON.parse(node.textContent));
    expect(schema.inLanguage).toBe('sw');
    expect(schema.spatialCoverage.identifier).toBe(code);
    await expect(page.locator('[data-ai-routing="irrigation-calculator"]')).toHaveAttribute(
      'data-ai-consent',
      'required-before-model-send'
    );

    const controls = page.locator('input:not([type="hidden"]),select');
    for (let index = 0; index < await controls.count(); index += 1) {
      const controlId = await controls.nth(index).getAttribute('id');
      await expect(page.locator(`label[for="${controlId}"]`)).toHaveCount(1);
    }
    const keyboardOrder = ['#crop', '#region', '#farmSize', '#method', '#month', '#stage'];
    await page.locator(keyboardOrder[0]).focus();
    for (let index = 0; index < keyboardOrder.length; index += 1) {
      await expect(page.locator(keyboardOrder[index])).toBeFocused();
      if (index < keyboardOrder.length - 1) await page.keyboard.press('Tab');
    }
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Hesabu mahitaji ya maji' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Weka upya' })).toBeFocused();

    const lightBackground = await page.locator('body')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.locator('#themeToggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const darkBackground = await page.locator('body')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(darkBackground).not.toBe(lightBackground);

    const submit = page.getByRole('button', { name: 'Hesabu mahitaji ya maji' });
    await expect(page.locator('[data-result-action]')).toHaveCount(7);
    await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
    await submit.focus();
    await expect(submit).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#resultPanel')).toBeVisible();
    await expect(page.locator('#resultPanel')).toBeFocused();
    await expect(page.locator('[data-result-action]:enabled')).toHaveCount(7);
    for (const action of ['copy', 'share', 'save', 'pdf', 'csv', 'json', 'txt']) {
      await page.keyboard.press('Tab');
      await expect(page.locator(`[data-action="${action}"]`)).toBeFocused();
    }
    const proof = await page.evaluate(() => ({
      code: window.__SW_AGRI_TEST__.data.countryCode,
      currency: window.__SW_AGRI_TEST__.data.currency,
      result: window.__SW_AGRI_TEST__.latest.result,
      report: window.__SW_AGRI_TEST__.reportObject(),
      engineCalculate: typeof window.__SW_AGRI_TEST__.engine.calculate,
    }));
    expect(proof.code).toBe(code);
    expect(proof.engineCalculate).toBe('function');
    expect(proof.result.error).toBe(false);
    expect(proof.result.mode).toBe('season');
    expect(proof.report.lugha).toBe('sw');
    expect(proof.report.nchi.code).toBe(code);
    expect(proof.report.nchi.sarafu).toBe(proof.currency);
    expect(proof.report.vyanzo.dataMojaKwaMoja).toBe(false);
    expect(proof.report.vyanzo.engine).toBe('engines/src/irrigation-engine.js#calculate');

    const json = await downloadBuffer(page, 'json');
    expect(json.filename).toBe(`afrotools-umwagiliaji-${code.toLowerCase()}.json`);
    const reopenedJson = JSON.parse(json.buffer.toString('utf8'));
    expect(reopenedJson.nchi.code).toBe(code);
    expect(reopenedJson.matokeo.majiJumlaM3).toBe(proof.result.totalWater_m3);

    const text = await downloadBuffer(page, 'txt');
    expect(text.filename).toBe(`afrotools-umwagiliaji-${code.toLowerCase()}.txt`);
    const reopenedText = text.buffer.toString('utf8');
    expect(reopenedText).toContain('makadirio ya umwagiliaji');
    expect(reopenedText).toContain('Faragha: hesabu ya ndani');

    const csv = await downloadBuffer(page, 'csv');
    expect(csv.filename).toBe(`afrotools-umwagiliaji-${code.toLowerCase()}.csv`);
    const reopenedCsv = parseCsv(csv.buffer.toString('utf8'));
    expect(reopenedCsv).toHaveLength(2);
    expect(reopenedCsv[0]).toContain('maji_jumla_m3');
    expect(reopenedCsv[1][1]).toBe(code);
    expect(reopenedCsv[1][10]).toBe(proof.currency);

    const pdf = await downloadBuffer(page, 'pdf');
    expect(pdf.filename).toBe(`afrotools-umwagiliaji-${code.toLowerCase()}.pdf`);
    expect(pdf.buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
    const reopenedPdf = await parsePdfFresh(pdf.buffer);
    expect(reopenedPdf.numpages).toBeGreaterThan(0);
    expect(reopenedPdf.text).toMatch(/makadirio ya umwagiliaji/i);
    expect(reopenedPdf.text).toMatch(/Faragha: hesabu ya ndani/i);

    await page.locator('[data-action="save"]').click();
    const saved = await page.evaluate((countryCode) => (
      localStorage.getItem(`afrotools:sw-agriculture:irrigation:${countryCode}`)
    ), code);
    expect(JSON.parse(saved).nchi.code).toBe(code);
    await page.locator('[data-action="copy"]').click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain('makadirio ya umwagiliaji');
    await page.locator('[data-action="share"]').focus();
    await expect(page.locator('[data-action="share"]')).toBeFocused();
    await page.keyboard.press('Enter');
    const shared = await page.evaluate(() => window.__SHARE_PAYLOAD__);
    expect(shared.title).toContain('umwagiliaji');
    expect(shared.text).toContain('makadirio ya umwagiliaji');
    expect(shared.url).toBe(`${expectedOrigin}${row.swahili.route}`);
    expect(shared.url).not.toContain('?');

    await page.getByLabel('Ukubwa wa shamba (hekta)').fill('2.5');
    await expect(page.locator('#resultPanel')).toBeHidden();
    await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
    expect(await page.evaluate(() => window.__SW_AGRI_TEST__.latest)).toBeNull();
    const downloadsBeforeStaleAttempt = runtime.downloads.length;
    await page.locator('[data-action="json"]').evaluate((button) => button.click());
    await page.waitForTimeout(50);
    expect(runtime.downloads).toHaveLength(downloadsBeforeStaleAttempt);

    await page.getByLabel('Kipindi cha hesabu').selectOption('7');
    await page.getByLabel('Hatua ya ukuaji — kwa hesabu ya mwezi').selectOption('flowering');
    await submit.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#resultPanel')).toBeFocused();
    expect(await page.evaluate(() => window.__SW_AGRI_TEST__.latest.result.mode)).toBe('single');
    const methodBoundary = await page.evaluate(() => {
      const testApi = window.__SW_AGRI_TEST__;
      const base = { ...testApi.latest.input, month: 7, growthStage: 'flowering' };
      return ['flood', 'furrow', 'bucket', 'sprinkler', 'drip'].map((irrigationMethod) => {
        const result = testApi.engine.calculate(
          { ...base, irrigationMethod },
          testApi.data,
          window.AfroTools.cropDatabase.crops
        );
        return {
          irrigationMethod,
          efficiencyPercent: result.efficiencyPercent,
          monthVolume_m3: result.monthVolume_m3,
        };
      });
    });
    expect(methodBoundary.map((item) => item.efficiencyPercent)).toEqual([40, 55, 60, 75, 90]);
    expect(methodBoundary.map((item) => item.monthVolume_m3)).toEqual(
      [...methodBoundary].map((item) => item.monthVolume_m3).sort((a, b) => b - a)
    );

    await assertNoHorizontalOverflow(page, 320);
    await expect(page.locator('#detailCards')).toBeVisible();
    await assertNoHorizontalOverflow(page, 375);

    await page.getByLabel('Ukubwa wa shamba (hekta)').fill('0');
    await page.getByRole('button', { name: 'Hesabu mahitaji ya maji' }).click();
    await expect(page.getByRole('alert')).toContainText('angalau hekta 0.1');
    await expect(page.getByLabel('Ukubwa wa shamba (hekta)')).toBeFocused();
    await expect(page.locator('#resultPanel')).toBeHidden();
    await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
    expect(await page.evaluate(() => window.__SW_AGRI_TEST__.latest)).toBeNull();

    expect(runtime.failures).toEqual([]);
    expect(runtime.networkWrites).toEqual([]);
    expect(runtime.externalRequests).toEqual([]);
  });
}
