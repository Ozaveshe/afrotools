const { test, expect } = require('@playwright/test');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { assertProcessIdentity, assertResponseIdentity } = require('../support/swahili-vat-proof-identity');

const fixturePath = path.resolve(__dirname, '../fixtures/swahili-pan-african-vat-parity.json');
const fixtureBytes = fs.readFileSync(fixturePath);
const fixture = JSON.parse(fixtureBytes);
const fixtureSha256 = crypto.createHash('sha256').update(fixtureBytes).digest('hex');
const expectedFixtureSha256 = '174d623f9be8bf685a5a481bfa0900a6a5cdc1ff50790e0777085bc028bead9b';
const expectedRootIdentity = 'sw-ecommerce-parity-20260803';
const pdfParserPath = path.resolve(__dirname, '../support/parse-pdf-file.py');
const hausaBaselineRelatedArtwork404s = [
  '/assets/img/tools/cv-builder-ha.svg',
  '/assets/img/tools/cv-builder-ha.webp',
  '/assets/img/tools/farm-profit-nigeria-ha.svg',
  '/assets/img/tools/farm-profit-nigeria-ha.webp',
  '/assets/img/tools/jamb-aggregate-ha.svg',
  '/assets/img/tools/jamb-aggregate-ha.webp',
  '/assets/img/tools/ng-paye-ha.svg',
  '/assets/img/tools/ng-paye-ha.webp',
  '/assets/img/tools/pdf-workspace-ha.svg',
  '/assets/img/tools/pdf-workspace-ha.webp'
];

test.describe.configure({ mode: 'serial' });

function observe(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const requests = [];
  const downloads = [];
  const httpErrors = [];
  const requestFailures = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => requests.push({
    method: request.method(),
    url: request.url(),
    body: request.postData() || ''
  }));
  page.on('response', (response) => {
    if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url() });
  });
  page.on('requestfailed', (request) => requestFailures.push({ url: request.url(), failure: request.failure() }));
  page.on('download', (download) => downloads.push(download.suggestedFilename()));
  return { consoleErrors, pageErrors, requests, downloads, httpErrors, requestFailures };
}

async function openRoute(page, route) {
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (payload) => { window.__sharedVatPayload = payload; }
    });
  });
  const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
  assertResponseIdentity(response);
  await expect(page.locator('#country option')).toHaveCount(55);
}

async function assertPresetOracles(page) {
  for (const preset of fixture.presets) {
    const previousRate = await page.locator('#rate').inputValue();
    await page.locator('#country').selectOption(preset.code);
    await expect(page.locator('#rate'), `${preset.code} selection must not silently change the rate`).toHaveValue(previousRate);
    await expect(page.locator('#usePreset'), `${preset.code} preset button`).toBeVisible();
    await page.locator('#usePreset').click();
    await expect(page.locator('#rate'), `${preset.code} exact preset rate`).toHaveValue(String(preset.rate));
    await page.locator('#amount').fill('1000');
    await page.locator('#calculateSingle').click();
    await expect(page.locator('#singleNet'), `${preset.code} net`).toHaveText('1,000.00');
    await expect(page.locator('#singleVat'), `${preset.code} VAT`).toHaveText(preset.vat);
    await expect(page.locator('#singleTotal'), `${preset.code} total`).toHaveText(preset.total);
    await expect(page.locator('#singleSource'), `${preset.code} source date`).toContainText(preset.reviewedOn);
    await expect(page.locator('#singleSource a'), `${preset.code} authority link`).toHaveAttribute('href', preset.source);
  }
}

async function assertGapOracles(page, locale) {
  for (const gap of fixture.gaps) {
    const previousRate = await page.locator('#rate').inputValue();
    await page.locator('#country').selectOption(gap.code);
    await expect(page.locator('#rate'), `${gap.code} gap selection must not silently change the rate`).toHaveValue(previousRate);
    await expect(page.locator('#presetStatus'), `${gap.code} gap state`).toHaveAttribute('data-state', 'gap');
    await expect(page.locator('#presetTitle'), `${gap.code} localized gap copy`).toContainText(gap.title[locale]);
    await expect(page.locator('#usePreset'), `${gap.code} must not expose a preset button`).toBeHidden();
  }
}

async function parseDownloadedPdf(page, button) {
  const downloadPromise = page.waitForEvent('download');
  await page.locator(button).click();
  const download = await downloadPromise;
  const downloadedPath = await download.path();
  const bytes = fs.readFileSync(downloadedPath);
  const parsed = JSON.parse(execFileSync(process.env.AFROTOOLS_PYTHON || 'python', [pdfParserPath, downloadedPath], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  }));
  return {
    bytes,
    text: parsed.text,
    compactText: parsed.text.replace(/\s+/g, ''),
    name: download.suggestedFilename()
  };
}

function contrastRatio(foreground, background) {
  function rgb(value) {
    return (String(value).match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  }
  function channel(value) {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  }
  const fg = rgb(foreground);
  const bg = rgb(background);
  const first = 0.2126 * channel(fg[0]) + 0.7152 * channel(fg[1]) + 0.0722 * channel(fg[2]);
  const second = 0.2126 * channel(bg[0]) + 0.7152 * channel(bg[1]) + 0.0722 * channel(bg[2]);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

test.beforeAll(() => {
  expect(fixture.rootIdentity).toBe(expectedRootIdentity);
  expect(fixtureSha256).toBe(expectedFixtureSha256);
  expect(process.env.AFROTOOLS_SW_VAT_ROOT_IDENTITY).toBe(expectedRootIdentity);
  assertProcessIdentity({
    rootIdentity: expectedRootIdentity,
    fixturePath,
    fixtureSha256: expectedFixtureSha256,
    fixtureEnv: 'AFROTOOLS_SW_VAT_PAN_FIXTURE_SHA256'
  });
});

test('locks reciprocal locale, SEO, schema and artwork contracts to the isolated root', async () => {
  const pages = {
    en: path.resolve('tools/vat-calculator/index.html'),
    sw: path.resolve('sw/zana/kikokotoo-vat/index.html'),
    fr: path.resolve('fr/tools/calculateur-tva/index.html'),
    ha: path.resolve('ha/kayan-aiki/kalkuletan-vat/index.html')
  };
  for (const [locale, file] of Object.entries(pages)) {
    const html = fs.readFileSync(file, 'utf8');
    for (const [hreflang, href] of Object.entries(fixture.hreflang)) {
      expect(html, `${locale} reciprocal ${hreflang}`).toContain(`hreflang="${hreflang}" href="${href}"`);
    }
  }
  const swHtml = fs.readFileSync(pages.sw, 'utf8');
  const enHtml = fs.readFileSync(pages.en, 'utf8');
  const frHtml = fs.readFileSync(pages.fr, 'utf8');
  const haHtml = fs.readFileSync(pages.ha, 'utf8');
  for (const [locale, html] of Object.entries({ en: enHtml, sw: swHtml, fr: frHtml, ha: haHtml })) {
    expect(html, `${locale} must omit remote dependency loaders`).not.toMatch(/cdn\.jsdelivr\.net/i);
    expect(html, `${locale} keeps the local auth client`).toContain('/assets/js/supabase.min.js');
    expect(html, `${locale} keeps local PDF support`).toContain('/assets/vendor/jspdf/jspdf.umd.min.js');
    expect(html, `${locale} must not spoof the shared navbar auth-loaded state`).not.toContain('window._afroAuthLoaded = true;');
    expect(html, `${locale} keeps the shared deferred navbar owner`).toContain('/assets/js/components/navbar.min.js');
  }
  for (const [locale, html] of Object.entries({ en: enHtml, sw: swHtml })) {
    expect(html, `${locale} scoped owner must omit the unrelated core bundle`).not.toContain('/assets/js/bundles/core.');
  }
  expect(enHtml).toContain('/assets/js/pages/pan-african-vat-vip.js');
  expect(frHtml).toContain('/assets/js/pages/pan-african-vat-vip.js');
  expect(frHtml).toContain('presetSource');
  expect(haHtml).toContain('presetSource');
  expect(swHtml).toContain('<link rel="canonical" href="https://afrotools.com/sw/zana/kikokotoo-vat/">');
  expect(swHtml).toContain('<meta property="og:url" content="https://afrotools.com/sw/zana/kikokotoo-vat/">');
  expect(swHtml).toContain('<meta property="og:image" content="https://afrotools.com/assets/img/tools/vat-calc-pan-african.webp">');
  expect(swHtml).toMatch(/"inLanguage"\s*:\s*"sw"/);
  expect(swHtml).not.toContain('RESULT');
  const artwork = path.resolve(fixture.artwork.replace(/^\//, ''));
  expect(fs.existsSync(artwork)).toBe(true);
  expect(fs.statSync(artwork).size).toBeGreaterThan(1000);
});

for (const route of [
  { locale: 'en', path: fixture.routes.en, lang: 'en' },
  { locale: 'sw', path: fixture.routes.sw, lang: 'sw' }
]) {
  test(`${route.locale} uses six exact authority presets and keeps AO fail closed`, async ({ page }) => {
    const observed = observe(page);
    await openRoute(page, route.path);
    await expect(page.locator('html')).toHaveAttribute('lang', route.lang);
    await assertGapOracles(page, route.locale);
    await assertPresetOracles(page);

    await page.locator('#modeExtract').click();
    await page.locator('#amount').fill('1192.50');
    await page.locator('#calculateSingle').click();
    await expect(page.locator('#singleNet')).toHaveText('1,000.00');
    await expect(page.locator('#singleVat')).toHaveText('192.50');
    await expect(page.locator('#singleTotal')).toHaveText('1,192.50');

    await page.locator('#shareCalculator').click();
    const share = await page.evaluate(() => window.__sharedVatPayload);
    expect(share.url).toMatch(new RegExp(route.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
    expect(JSON.stringify(share)).not.toMatch(/1192|1000|192\.50/);

    // The shared navbar historically scheduled auth after 12 seconds. Cross that boundary before auditing traffic.
    await page.waitForTimeout(13000);

    expect(observed.requests.every((request) => ['GET', 'HEAD', 'OPTIONS'].includes(request.method))).toBe(true);
    expect(observed.requests.every((request) => new URL(request.url).origin === new URL(page.url()).origin)).toBe(true);
    expect(observed.requests.some((request) => /cdn\.jsdelivr\.net/i.test(request.url))).toBe(false);
    expect(observed.requests.some((request) => /1192|1000|192\.50|Ushauri/i.test(decodeURIComponent(request.url + request.body)))).toBe(false);
    expect(page.url()).not.toMatch(/[?&](amount|rate|budget|search)=/i);
    expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /vat|amount|invoice|description/i.test(key)))).toEqual([]);
    expect(observed.consoleErrors).toEqual([]);
    expect(observed.pageErrors).toEqual([]);
  });
}

for (const localeCase of [
  {
    locale: 'en', route: fixture.routes.en, lang: 'en',
    sourceLead: 'Benin planning preset (18%), authority source:',
    sourceReview: 'Source reviewed 2026-08-02.',
    gapTitle: 'Angola needs a custom rate',
    gapCopy: 'No authority-bound preset is available. Enter the rate from your authority notice.'
  },
  {
    locale: 'fr', route: fixture.routes.fr, lang: 'fr',
    sourceLead: "Taux de planification Bénin (18 %), source de l'administration :",
    sourceReview: 'Source vérifiée le 2026-08-02.',
    gapTitle: 'Angola nécessite un taux personnalisé',
    gapCopy: "Aucun taux lié à une administration n'est disponible. Saisissez le taux figurant sur votre avis officiel."
  },
  {
    locale: 'ha', route: fixture.routes.ha, lang: 'ha',
    sourceLead: 'Kimar tsarin Benin (18%), tushen hukuma:',
    sourceReview: 'An duba tushen a 2026-08-02.',
    gapTitle: 'Angola na bukatar kima daga gare ka',
    gapCopy: 'Babu kimar tsari mai hanyar hukuma. Shigar da kima daga sanarwar hukumar.'
  }
]) {
  test(`shared controller renders native ${localeCase.locale} Benin source and Angola gap text`, async ({ page }) => {
    const observed = observe(page);
    await openRoute(page, localeCase.route);
    await expect(page.locator('html')).toHaveAttribute('lang', localeCase.lang);
    await page.locator('#country').selectOption('BJ');
    await expect(page.locator('#rate'), 'country selection must not silently populate a rate').toHaveValue('');
    await page.locator('#usePreset').click();
    await expect(page.locator('#rate')).toHaveValue('18');
    await page.locator('#amount').fill('1000');
    await page.locator('#calculateSingle').click();
    await expect(page.locator('#singleVat')).toContainText(/180/);
    await expect(page.locator('#singleSource')).toContainText(localeCase.sourceLead);
    await expect(page.locator('#singleSource')).toContainText(localeCase.sourceReview);
    await expect(page.locator('#singleSource a')).toHaveAttribute('href', fixture.presets.find((preset) => preset.code === 'BJ').source);
    const sourceText = await page.locator('#singleSource').innerText();
    expect(sourceText).not.toMatch(/presetSourceLead|presetSourceReview|\{country\}|\{rate\}|\{date\}/);
    if (localeCase.locale !== 'en') {
      expect(sourceText).not.toMatch(/planning preset|authority source|Source reviewed/i);
    }

    await page.locator('#amount').fill('1001');
    await expect(page.locator('#singleResult')).toBeHidden();
    await page.locator('#country').selectOption('AO');
    await expect(page.locator('#rate'), 'Angola gap must preserve the user-visible rate').toHaveValue('18');
    await expect(page.locator('#presetStatus')).toHaveAttribute('data-state', 'gap');
    await expect(page.locator('#presetTitle')).toHaveText(localeCase.gapTitle);
    await expect(page.locator('#presetCopy')).toHaveText(localeCase.gapCopy);
    await expect(page.locator('#usePreset')).toBeHidden();
    if (localeCase.locale !== 'en') {
      expect(await page.locator('#presetStatus').innerText()).not.toMatch(/needs a custom rate|No authority-bound preset|Enter the rate from your authority notice/i);
    }

    expect(observed.requests.every((request) => new URL(request.url).origin === new URL(page.url()).origin)).toBe(true);
    expect(observed.requests.some((request) => /cdn\.jsdelivr\.net/i.test(request.url))).toBe(false);
    const httpErrors = observed.httpErrors
      .map(({ status, url }) => ({ status, path: new URL(url).pathname }))
      .sort((first, second) => first.path.localeCompare(second.path));
    if (localeCase.locale === 'ha') {
      expect(httpErrors, 'Hausa must expose only the coordinator-baseline related-card artwork gaps').toEqual(
        hausaBaselineRelatedArtwork404s.map((assetPath) => ({ status: 404, path: assetPath }))
      );
    } else {
      expect(httpErrors, `${localeCase.locale} HTTP errors`).toEqual([]);
    }
    expect(observed.requestFailures, `${localeCase.locale} request failures`).toEqual([]);
    if (localeCase.locale === 'ha') {
      expect(observed.consoleErrors, 'Hausa console must contain only the ten baseline artwork 404 messages').toEqual(
        Array(hausaBaselineRelatedArtwork404s.length).fill(
          'Failed to load resource: the server responded with a status of 404 (Not Found)'
        )
      );
    } else {
      expect(observed.consoleErrors).toEqual([]);
    }
    expect(observed.pageErrors).toEqual([]);
  });
}

test('Swahili clears invalid and changed state across all four workflows', async ({ page }) => {
  const observed = observe(page);
  await openRoute(page, fixture.routes.sw);

  await page.locator('#country').selectOption('TD');
  await page.locator('#usePreset').click();
  await page.locator('#amount').fill('1000');
  await page.locator('#calculateSingle').click();
  await expect(page.locator('#singleResult')).toBeVisible();
  await page.locator('#amount').fill('1001');
  await expect(page.locator('#singleResult')).toBeHidden();
  await page.evaluate(() => document.getElementById('singlePdf').click());
  await expect(page.locator('#singleStatus')).toContainText('Kokotoa matokeo kabla ya kupakua');
  await page.locator('#rate').fill('100.01');
  await page.locator('#calculateSingle').click();
  await expect(page.locator('#rate')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#rate')).toBeFocused();
  await expect(page.locator('#singleResult')).toBeHidden();

  await page.locator('#tab-invoice').click();
  const line = page.locator('.vat-line').first();
  await line.locator('.line-desc').fill('Ushauri wa majaribio 72841');
  await line.locator('.line-amount').fill('1000');
  await line.locator('.line-rate').fill('14');
  await page.locator('#calculateInvoice').click();
  await expect(page.locator('#invoiceResult')).toBeVisible();
  await line.locator('.line-amount').fill('');
  await expect(page.locator('#invoiceResult')).toBeHidden();
  await page.evaluate(() => document.getElementById('invoicePdf').click());
  await expect(page.locator('#invoiceStatus')).toContainText('Kokotoa ankara kabla ya kupakua');
  await page.locator('#calculateInvoice').click();
  await expect(line.locator('.line-amount')).toHaveAttribute('aria-invalid', 'true');
  await expect(line.locator('.line-amount')).toBeFocused();

  await page.locator('#tab-withholding').click();
  await page.locator('#withholdingAmount').fill('1000');
  await page.locator('#withholdingVatRate').fill('20');
  await page.locator('#withholdingPercent').fill('25');
  await page.locator('#calculateWithholding').click();
  await expect(page.locator('#withholdingResult')).toBeVisible();
  await page.locator('#withholdingPercent').fill('101');
  await expect(page.locator('#withholdingResult')).toBeHidden();
  await page.locator('#calculateWithholding').click();
  await expect(page.locator('#withholdingPercent')).toHaveAttribute('aria-invalid', 'true');

  await page.locator('#tab-compare').click();
  await page.locator('#compareAmount').fill('1000');
  await page.locator('#scenarioRate1').fill('7.5');
  await page.locator('#scenarioRate2').fill('15');
  await page.locator('#scenarioRate3').fill('20');
  await page.locator('#calculateCompare').click();
  await expect(page.locator('#compareResult')).toBeVisible();
  await page.locator('#scenarioRate3').fill('-1');
  await expect(page.locator('#compareResult')).toBeHidden();
  await page.locator('#calculateCompare').click();
  await expect(page.locator('#scenarioRate3')).toHaveAttribute('aria-invalid', 'true');

  expect(observed.downloads).toEqual([]);
  expect(observed.requests.some((request) => /72841/.test(decodeURIComponent(request.url + request.body)))).toBe(false);
  expect(observed.consoleErrors).toEqual([]);
  expect(observed.pageErrors).toEqual([]);
});

for (const pdfCase of [
  {
    locale: 'en', route: fixture.routes.en,
    singleName: 'afrotools-vat-planning-calculation.pdf', singleTitle: 'VAT Planning Calculation',
    invoiceName: 'afrotools-vat-invoice-planning-summary.pdf', invoiceTitle: 'VAT Invoice Planning Summary',
    description: 'Consulting 72841', exempt: 'Exempt goods', provenance: 'supplied by the user'
  },
  {
    locale: 'sw', route: fixture.routes.sw,
    singleName: 'afrotools-hesabu-ya-vat.pdf', singleTitle: 'Hesabu ya Mipango ya VAT',
    invoiceName: 'afrotools-mpango-wa-ankara-vat.pdf', invoiceTitle: 'Muhtasari wa Mpango wa Ankara ya VAT',
    description: 'Ushauri 72841', exempt: 'Bidhaa yenye msamaha', provenance: 'imewekwa na mtumiaji'
  }
]) {
  test(`${pdfCase.locale} independently downloads, reopens and parses single and invoice PDFs`, async ({ page }) => {
    const observed = observe(page);
    await openRoute(page, pdfCase.route);
    await page.locator('#country').selectOption('TD');
    await page.locator('#usePreset').click();
    await page.locator('#amount').fill('1000');
    await page.locator('#calculateSingle').click();
    const single = await parseDownloadedPdf(page, '#singlePdf');
    expect(single.bytes.subarray(0, 5).toString()).toBe('%PDF-');
    expect(single.bytes.length).toBeGreaterThan(1000);
    expect(single.name).toBe(pdfCase.singleName);
    expect(single.text).toContain(pdfCase.singleTitle);
    expect(single.text).toContain('19.25%');
    expect(single.text).toContain('1,000.00');
    expect(single.text).toContain('192.50');
    expect(single.text).toContain('1,192.50');
    expect(single.compactText).toContain(fixture.presets.find((preset) => preset.code === 'TD').source);
    expect(single.text).toContain('2026-07-22');

    await page.locator('#tab-invoice').click();
    const first = page.locator('.vat-line').first();
    await first.locator('.line-desc').fill(pdfCase.description);
    await first.locator('.line-amount').fill('1000');
    await first.locator('.line-rate').fill('14');
    await page.locator('#addInvoiceLine').click();
    const second = page.locator('.vat-line').nth(1);
    await second.locator('.line-desc').fill(pdfCase.exempt);
    await second.locator('.line-amount').fill('500');
    await second.locator('.line-treatment').selectOption('exempt');
    await page.locator('#calculateInvoice').click();
    await expect(page.locator('#invoiceSubtotal')).toHaveText('1,500.00');
    await expect(page.locator('#invoiceVat')).toHaveText('140.00');
    await expect(page.locator('#invoiceTotal')).toHaveText('1,640.00');
    const invoice = await parseDownloadedPdf(page, '#invoicePdf');
    expect(invoice.bytes.subarray(0, 5).toString()).toBe('%PDF-');
    expect(invoice.bytes.length).toBeGreaterThan(1000);
    expect(invoice.name).toBe(pdfCase.invoiceName);
    expect(invoice.text).toContain(pdfCase.invoiceTitle);
    expect(invoice.text).toContain(pdfCase.description);
    expect(invoice.text).toContain('1,500.00');
    expect(invoice.text).toContain('140.00');
    expect(invoice.text).toContain('1,640.00');
    expect(invoice.text).toContain(pdfCase.provenance);

    expect(observed.requests.some((request) => /72841|1000|1640/.test(decodeURIComponent(request.url + request.body)))).toBe(false);
    expect(observed.requests.every((request) => ['GET', 'HEAD', 'OPTIONS'].includes(request.method))).toBe(true);
    expect(observed.requests.every((request) => new URL(request.url).origin === new URL(page.url()).origin)).toBe(true);
    expect(observed.requests.some((request) => /cdn\.jsdelivr\.net/i.test(request.url))).toBe(false);
    expect(observed.consoleErrors).toEqual([]);
    expect(observed.pageErrors).toEqual([]);
  });
}

test('Swahili remains keyboard-operable, named, contrasted and reflow-safe', async ({ page }) => {
  const observed = observe(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await openRoute(page, fixture.routes.sw);

  const unlabeled = await page.locator('input, select, button').evaluateAll((elements) => elements.filter((element) => {
    if (element.type === 'hidden' || element.getClientRects().length === 0) return false;
    return !element.getAttribute('aria-label') &&
      !element.getAttribute('aria-labelledby') &&
      !element.textContent.trim() &&
      !document.querySelector(`label[for="${element.id}"]`);
  }).map((element) => element.id || element.outerHTML.slice(0, 80)));
  expect(unlabeled).toEqual([]);

  await page.locator('#tab-single').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-invoice')).toBeFocused();
  await expect(page.locator('#tab-invoice')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(page.locator('#tab-compare')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.locator('#tab-single')).toBeFocused();

  await page.locator('#country').selectOption('AO');
  await page.locator('#rate').fill('18');
  await page.locator('#amount').fill('1000');
  await page.locator('#calculateSingle').click();

  async function assertFocusContrast(label) {
      for (const selector of ['#tab-single', '#country', '#modeAdd', '#amount', '#calculateSingle', '#singlePdf']) {
        const locator = page.locator(selector);
        await page.keyboard.press('Tab');
        await locator.focus();
      const focusStyle = await locator.evaluate((node) => {
        function backgroundFor(element) {
          let current = element;
          while (current) {
            const color = getComputedStyle(current).backgroundColor;
            if (color !== 'transparent' && !/rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/.test(color)) return color;
            current = current.parentElement;
          }
          return 'rgb(255, 255, 255)';
        }
        const style = getComputedStyle(node);
        return {
          visible: node.matches(':focus-visible'),
          width: parseFloat(style.outlineWidth),
          style: style.outlineStyle,
          color: style.outlineColor,
          adjacent: backgroundFor(node.parentElement)
        };
      });
      expect(focusStyle.visible, `${label} ${selector} focus-visible`).toBe(true);
      expect(focusStyle.style, `${label} ${selector} outline`).not.toBe('none');
      expect(focusStyle.width, `${label} ${selector} outline width`).toBeGreaterThanOrEqual(2);
      expect(contrastRatio(focusStyle.color, focusStyle.adjacent), `${label} ${selector} focus contrast`).toBeGreaterThanOrEqual(3);
    }
  }

  async function surfaceColors() {
    return page.evaluate(() => {
      function backgroundFor(node) {
        let current = node;
        while (current) {
          const color = getComputedStyle(current).backgroundColor;
          if (color !== 'transparent' && !/rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/.test(color)) return color;
          current = current.parentElement;
        }
        return 'rgb(255, 255, 255)';
      }
      const samples = Array.from(document.querySelectorAll('.vat-panel h2,.vat-result h3,.vat-side-card h2,.vat-field label,.vat-method p'))
        .filter((node) => node.getClientRects().length && node.textContent.trim())
        .map((node) => {
          const style = getComputedStyle(node);
          return { text: node.textContent.trim().slice(0, 60), color: style.color, background: backgroundFor(node) };
        });
      const controls = Array.from(document.querySelectorAll('.vat-input,.vat-select,.vat-mode button,.vat-btn'))
        .filter((node) => node.getClientRects().length && !node.disabled)
        .map((node) => {
          const style = getComputedStyle(node);
          return {
            id: node.id || node.className,
            color: style.color,
            background: backgroundFor(node),
            border: style.borderTopColor,
            adjacent: backgroundFor(node.parentElement)
          };
        });
      return {
        samples,
        controls,
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
      };
    });
  }
  function assertSurfaceContrast(colors) {
    expect(colors.samples.length).toBeGreaterThanOrEqual(5);
    expect(colors.samples.every((sample) => contrastRatio(sample.color, sample.background) >= 4.5), JSON.stringify(colors.samples)).toBe(true);
    expect(colors.controls.length).toBeGreaterThanOrEqual(4);
    expect(colors.controls.every((control) => contrastRatio(control.color, control.background) >= 4.5), JSON.stringify(colors.controls)).toBe(true);
    expect(colors.controls.every((control) => Math.max(contrastRatio(control.border, control.adjacent), contrastRatio(control.background, control.adjacent)) >= 3), JSON.stringify(colors.controls)).toBe(true);
  }
  async function assertNoPageOverflow(label) {
    const report = await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        overflow: Array.from(document.querySelectorAll('body *')).filter((node) => {
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return style.display !== 'none' && style.position !== 'fixed' &&
            (rect.left < -1 || rect.right > document.documentElement.clientWidth + 1);
        }).slice(0, 12).map((node) => {
          const rect = node.getBoundingClientRect();
          return { tag: node.tagName, id: node.id, className: String(node.className || ''), left: rect.left, right: rect.right };
        })
      });
    }))));
    expect(report.scrollWidth, `${label} ${JSON.stringify(report)}`).toBeLessThanOrEqual(report.clientWidth + 1);
  }

  const lightColors = await surfaceColors();
  assertSurfaceContrast(lightColors);
  await assertFocusContrast('light');
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.locator('html').evaluate((node) => node.setAttribute('data-theme', 'dark'));
  const darkColors = await surfaceColors();
  assertSurfaceContrast(darkColors);
  await assertFocusContrast('dark');
  expect(darkColors.reducedMotion).toBe(true);
  await assertNoPageOverflow('375px dark');

  await page.setViewportSize({ width: 320, height: 760 });
  await assertNoPageOverflow('320px dark');
  await page.locator('html').evaluate((node) => {
    node.removeAttribute('data-theme');
    node.style.zoom = '2';
  });
  await assertNoPageOverflow('320px at 200%');

  expect(observed.consoleErrors).toEqual([]);
  expect(observed.pageErrors).toEqual([]);
});
