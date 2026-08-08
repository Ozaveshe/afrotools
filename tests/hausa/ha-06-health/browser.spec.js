const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');

const today = new Date().toISOString().slice(0, 10);

const apps = [
  {
    id: 'hospital-cost', route: '/ha/kayan-aiki/kudin-asibiti/', heading: 'Kasafin takardar farashin asibiti',
    raw: 'Synthetic-Hospital-Quote-HA06', expected: ['NGN 99,000.00', 'NGN 115,000.00'],
    fill: async page => {
      await page.locator('#facility-reference').fill('Synthetic-Hospital-Quote-HA06');
      await page.locator('#quote-date').fill(today);
      await page.locator('#consultation').fill('5000'); await page.locator('#facility-fee').fill('15000');
      await page.locator('#procedure').fill('80000'); await page.locator('#tests').fill('10000'); await page.locator('#medicines').fill('5000');
      await page.locator('#insurance-contribution').fill('25000'); await page.locator('#buffer-percent').fill('10');
    }
  },
  {
    id: 'sickle-cell', route: '/ha/kayan-aiki/sickle-cell/', heading: 'Ilimin gadon sikila', raw: 'AS-AC-SYNTHETIC', expected: ['AS x AC', '25%'],
    fill: async page => { await page.locator('#lab-confirmed').check(); await page.locator('#result-one').selectOption('AS'); await page.locator('#result-two').selectOption('AC'); }
  },
  {
    id: 'genotype-checker', route: '/ha/kayan-aiki/duba-genotype/', heading: 'Duba rubutun sakamakon haemoglobin', raw: 'HbAS-SYNTHETIC', expected: ['Alamar A / S', 'HPLC'],
    fill: async page => { await page.locator('#reported-result').fill('HbAS'); await page.locator('#test-method').selectOption('hplc'); await page.locator('#test-date').fill(today); await page.locator('#confirmation-status').selectOption('final'); }
  },
  {
    id: 'childbirth-cost', route: '/ha/kayan-aiki/kudin-haihuwa/', heading: 'Kasafin haihuwa daga farashin da ka samu', raw: 'CHILDBIRTH-SYNTHETIC-HA06', expected: ['NGN 160,000.00', 'NGN 130,000.00'],
    fill: async page => {
      await page.locator('#quote-date').fill(today); await page.locator('#source-type').selectOption('written-provider');
      await page.locator('#plannedCare').fill('100000'); await page.locator('#professionalFees').fill('25000'); await page.locator('#medicinesSupplies').fill('10000');
      await page.locator('#testsCare').fill('5000'); await page.locator('#transportStay').fill('5000'); await page.locator('#contingency').fill('15000'); await page.locator('#confirmed-contribution').fill('30000');
    }
  },
  {
    id: 'drug-price-compare', route: '/ha/kayan-aiki/kwatanta-farashin-magani/', heading: 'Kwatanta farashi biyu na magani daya', raw: 'SyntheticMed-HA06', expected: ['NGN 3,700.00', 'NGN 2,700.00', 'NGN 1,000.00'],
    fill: async page => {
      await page.locator('#medicine').fill('SyntheticMed-HA06'); await page.locator('#strength').fill('500 mg'); await page.locator('#dosage-form').fill('kwaya'); await page.locator('#required-units').fill('21');
      await page.locator('#quote-date').fill(today); await page.locator('#a-provider').fill('Synthetic Quote A'); await page.locator('#a-pack-size').fill('10'); await page.locator('#a-pack-price').fill('1200'); await page.locator('#a-fee').fill('100');
      await page.locator('#b-provider').fill('Synthetic Quote B'); await page.locator('#b-pack-size').fill('7'); await page.locator('#b-pack-price').fill('900');
    }
  },
  {
    id: 'african-meal-plan', route: '/ha/kayan-aiki/tsarin-abincin-afirka/', heading: 'Tsarin hidimar abinci da kasafi', raw: 'Synthetic-Meal-HA06', expected: ['NGN 46,200.00', '84 hidimar'],
    invalid: async page => { await page.locator('#daily-budget').fill('-1'); },
    fill: async page => { await page.locator('#days').fill('7'); await page.locator('#people').fill('4'); await page.locator('#meals-per-day').fill('3'); await page.locator('#daily-budget').fill('1500'); await page.locator('#buffer-percent').fill('10'); await page.locator('#price-date').fill(today); await page.locator('#notes').fill('Synthetic-Meal-HA06'); }
  }
];

function observe(page) {
  const receipts = { requests: [], errors: [] };
  page.on('request', request => receipts.requests.push({ url: request.url(), method: request.method(), body: request.postData() || '' }));
  page.on('console', message => { if (message.type() === 'error') receipts.errors.push(`console: ${message.text()}`); });
  page.on('pageerror', error => receipts.errors.push(`pageerror: ${error.message}`));
  page.on('requestfailed', request => receipts.errors.push(`requestfailed: ${request.url()} ${request.failure() && request.failure().errorText}`));
  return receipts;
}

async function readDownload(download) {
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  return fs.readFileSync(downloadPath);
}

for (const app of apps) {
  test(`${app.id}: valid, invalid, reset, exports and privacy`, async ({ page }) => {
    const receipts = observe(page);
    await page.goto(app.route, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(app.heading);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ha');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${app.route}`);
    expect(await page.evaluate(() => ({ app: window.HausaHealthParity.app, privacy: window.HausaHealthParity.privacyContract }))).toEqual(expect.objectContaining({ privacy: 'local-only-no-storage-no-input-network' }));

    if (app.invalid) await app.invalid(page);
    await page.locator('main form[id$="-form"] button[type="submit"]').click();
    await expect(page.locator('#form-error')).toBeVisible();
    await expect(page.locator('#form-error')).toBeFocused();
    await expect(page.locator('#app-result')).toBeHidden();

    await app.fill(page);
    await page.locator('main form[id$="-form"] button[type="submit"]').click();
    await expect(page.locator('#app-result')).toBeVisible();
    await expect(page.locator('#app-result [tabindex="-1"]').first()).toBeFocused();
    for (const value of app.expected) await expect(page.locator('#app-result')).toContainText(value);

    const txtPromise = page.waitForEvent('download');
    await page.locator('#download-txt').click();
    const txtDownload = await txtPromise;
    const txt = (await readDownload(txtDownload)).toString('utf8');
    expect(txtDownload.suggestedFilename()).toMatch(/\.txt$/);
    expect(txt).toContain('AFROTOOLS');
    expect(txt).toMatch(/IYAKA|Iyakar|Lissafin|Wannan/);
    expect(txt).toMatch(/SIRRI/);

    const pdfPromise = page.waitForEvent('download');
    await page.locator('#download-pdf').click();
    const pdfDownload = await pdfPromise;
    const pdf = await readDownload(pdfDownload);
    expect(pdfDownload.suggestedFilename()).toMatch(/\.pdf$/);
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    const parsed = (await pdfParse(pdf)).text;
    expect(parsed).toContain('AFROTOOLS');
    expect(parsed.length).toBeGreaterThan(150);

    const browserState = await page.evaluate(() => ({ local: Object.entries(localStorage), session: Object.entries(sessionStorage), query: location.search, hash: location.hash }));
    expect(browserState.query).toBe('');
    expect(browserState.hash).toBe('');
    expect(JSON.stringify(browserState)).not.toContain(app.raw);
    const serializedRequests = JSON.stringify(receipts.requests);
    expect(serializedRequests).not.toContain(app.raw);
    expect(receipts.requests.filter(request => request.method !== 'GET')).toEqual([]);
    expect(receipts.errors).toEqual([]);

    await page.locator('#reset-app').click();
    await expect(page.locator('#app-result')).toBeHidden();
    await expect(page.locator('main form[id$="-form"] input, main form[id$="-form"] select').first()).toBeFocused();
  });

  test(`${app.id}: keyboard, labels, dark modes, 320/375 and 200 percent reflow`, async ({ page }) => {
    const receipts = observe(page);
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto(app.route, { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    await expect(page.locator('.ha-skip')).toBeFocused();
    const accessibility = await page.evaluate(() => {
      const controls = Array.from(document.querySelectorAll('main input, main select, main textarea'));
      return {
        unlabeled: controls.filter(control => !control.labels || !control.labels.length).map(control => control.id),
        smallTargets: Array.from(document.querySelectorAll('main button')).filter(button => button.getClientRects().length && button.getBoundingClientRect().height < 44).map(button => button.id || button.textContent.trim()),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        background: getComputedStyle(document.body).backgroundColor
      };
    });
    expect(accessibility.unlabeled).toEqual([]);
    expect(accessibility.smallTargets).toEqual([]);
    expect(accessibility.overflow).toBe(false);
    expect(accessibility.background).not.toBe('rgb(255, 255, 255)');

    await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(accessibility.background);
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(accessibility.background);

    await page.setViewportSize({ width: 375, height: 812 });
    await app.fill(page);
    await page.locator('main form[id$="-form"] button[type="submit"]').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.setViewportSize({ width: 640, height: 900 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(receipts.errors).toEqual([]);
  });
}
