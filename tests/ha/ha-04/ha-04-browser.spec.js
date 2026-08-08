const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const apps = [
  { id: 'planting-calendar', route: '/ha/noma/kalandar-shuka/', form: '#plantingForm', calculate: 'button[type="submit"]', export: '[data-result-action="json"]', invalid: async p => p.locator('#zone').evaluate(node => { node.value = ''; node.dispatchEvent(new Event('change', { bubbles: true })); }) },
  { id: 'fish-farming-nigeria', route: '/ha/kayan-aiki/ribar-kiwon-kifi/', form: '#fishForm', calculate: 'button[type="submit"]', export: '[data-result-action="json"]', invalid: async p => p.fill('#area', '0') },
  { id: 'cassava-processing-nigeria', route: '/ha/kayan-aiki/sarrafa-rogo/', calculate: 'button[onclick*="calculate"]', export: '[data-ha04-json]', txt: '[data-agri-download]' },
  { id: 'crop-yield-nigeria', route: '/ha/noma/amfanin-gona-najeriya/', calculate: 'button[onclick*="calculate"]', export: '[data-ha04-json]' },
  { id: 'fertilizer-nigeria', route: '/ha/noma/taki-najeriya/', calculate: 'button[onclick*="calculate"]', export: '[data-ha04-json]' },
  { id: 'irrigation-nigeria', route: '/ha/noma/ban-ruwa-najeriya/', calculate: 'button[onclick*="calculate"]', export: '[data-ha04-json]' },
  { id: 'farm-profit-nigeria', route: '/ha/kayan-aiki/ribar-gona/', calculate: 'button[onclick*="calculate"]', export: '[data-ha04-json]', txt: '[data-agri-download]' },
  { id: 'seed-rate-ng', route: '/ha/noma/yawan-iri-najeriya/', calculate: 'button[onclick*="calculate"]', export: '[data-ha04-json]', txt: '[data-agri-download]' },
  { id: 'livestock-feed-nigeria', route: '/ha/kayan-aiki/abincin-dabbobi/', form: '#feedForm', calculate: 'button[type="submit"]', export: '[data-result-action="json"]', invalid: async p => p.fill('#weight', '0') },
  { id: 'commodity-prices', route: '/ha/kayan-aiki/farashin-kayayyakin-gona/', form: '#commodityForm', calculate: 'button[type="submit"]', export: '[data-result-action="json"]', setup: async p => p.selectOption('#commodity', 'maize'), invalid: async p => p.selectOption('#commodity', '') },
  { id: 'drought-risk', route: '/ha/noma/hadarin-fari/', form: '#droughtForm', calculate: 'button[type="submit"]', export: '[data-result-action="json"]', invalid: async p => p.fill('#rainfallAnomaly', '101') }
];

function attachRuntimeAudit(page, rawFixture) {
  const consoleErrors = [];
  const failedRequests = [];
  const privateLeaks = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => consoleErrors.push(error.message));
  page.on('requestfailed', request => failedRequests.push(request.url() + ' :: ' + (request.failure()?.errorText || 'failed')));
  page.on('request', request => {
    const body = request.postData() || '';
    if (decodeURIComponent(request.url()).includes(rawFixture) || body.includes(rawFixture)) privateLeaks.push(request.url());
  });
  return { consoleErrors, failedRequests, privateLeaks };
}

async function validCalculation(page, app) {
  if (app.setup) await app.setup(page);
  await calculateButton(page, app).click();
  await expect(page.locator('#resultsPanel, #resultPanel').first()).toBeVisible();
  await expect(page.locator(app.export)).toBeEnabled();
  await expect(page.locator('#resultsPanel, #resultPanel').first()).toBeFocused();
}

function calculateButton(page, app) {
  return app.form ? page.locator(app.form).locator(app.calculate) : page.locator(app.calculate);
}

for (const app of apps) {
  test(app.id + ': valid, invalid, reset, export, privacy, a11y, SEO and reflow', async ({ page }) => {
    const rawFixture = app.id === 'planting-calendar' ? 'north-arid' : '73.24681';
    const audit = attachRuntimeAudit(page, rawFixture);
    await page.goto(app.route, { waitUntil: 'domcontentloaded' });
    if (app.id === 'planting-calendar') {
      const original = await page.locator('#zone').inputValue();
      await page.selectOption('#zone', rawFixture);
      await page.selectOption('#zone', original);
    } else {
      const privacyField = page.locator('main input[type="number"]:visible').first();
      const original = await privacyField.inputValue();
      await privacyField.fill(rawFixture);
      await privacyField.fill(original);
    }
    await expect(page.locator('html')).toHaveAttribute('lang', 'ha');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com' + app.route);
    await expect(page.locator('meta[name="afrotools-ai-summary"]')).toHaveCount(1);
    await expect(page.locator('meta[name="geo.region"]')).toHaveCount(1);
    const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(schema.some(value => value.includes('"inLanguage"') && value.includes('"ha"'))).toBeTruthy();
    await expect(page.locator('body')).toContainText(/Tushe|Tushen/);
    await expect(page.locator('body')).toContainText(/8 Agusta 2026|1 Maris 2026/);
    await expect(page.locator('body')).toContainText(/tabbaci|Tabbaci/);
    await expect(page.locator('body')).toContainText(/Iyaka|iyaka/);
    const image = page.locator('img[src*="/assets/img/tools/"]').first();
    if (await image.count()) {
      await expect(image).toBeVisible();
      const dimensions = await image.evaluate(node => ({ complete: node.complete, width: node.naturalWidth, height: node.naturalHeight }));
      expect(dimensions.complete).toBeTruthy();
      expect(dimensions.width).toBeGreaterThanOrEqual(600);
      expect(dimensions.height).toBeGreaterThanOrEqual(300);
    } else {
      const artworkUrl = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(artworkUrl).toContain('/assets/img/tools/');
      const artworkResponse = await page.request.get(artworkUrl.replace('https://afrotools.com', 'http://127.0.0.1:43104'));
      expect(artworkResponse.ok()).toBeTruthy();
      expect((await artworkResponse.body()).length).toBeGreaterThan(5000);
    }

    await validCalculation(page, app);
    const visibleCopy = await page.locator('body').innerText();
    expect(visibleCopy).not.toMatch(/\b(Calculate|Download|Reset|Source|Freshness|Methodology|Limitations|English page|Open full tool)\b/i);
    expect(new URL(page.url()).pathname).toBe(app.route);
    const downloadPromise = page.waitForEvent('download');
    await page.locator(app.export).click();
    const download = await downloadPromise;
    const json = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    expect(json.schemaVersion).toBe(1);
    expect(json.language).toBe('ha');
    expect(json.sourceId).toBe(app.id);
    expect(json.provenance.liveData).toBe(false);
    expect(JSON.stringify(json)).not.toContain(rawFixture);

    if (app.txt) {
      const txtDownloadPromise = page.waitForEvent('download');
      await page.locator(app.txt).click();
      const txtDownload = await txtDownloadPromise;
      const txt = fs.readFileSync(await txtDownload.path(), 'utf8');
      expect(txt.length).toBeGreaterThan(80);
      expect(txt).toMatch(/AfroTools|Sakamako|Riba|Iri|Rogo|Gona/i);
    }

    if (app.invalid) {
      await app.invalid(page);
      await calculateButton(page, app).click();
      await expect(page.locator('#formError')).not.toBeEmpty();
      await expect(page.locator(app.export)).toBeDisabled();
    } else {
      const invalid = page.locator('main input[type="number"]').first();
      await invalid.fill('-999999');
      await calculateButton(page, app).click();
      await expect(page.locator('[data-ha04-status]')).toContainText('Gyara filin');
      await expect(invalid).toBeFocused();
    }

    const reset = app.form ? page.locator(app.form + ' button[type="reset"]') : page.locator('[data-ha04-reset]');
    await reset.click();
    await expect(page.locator(app.export)).toBeDisabled();
    await expect(page.locator('#resultsPanel, #resultPanel').first()).toBeHidden();

    await page.locator('body').press('Home');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBeTruthy();
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const axeViolations = await page.evaluate(async () => {
      const result = await window.axe.run(document.querySelector('main'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
      return result.violations.filter(item => item.impact === 'critical' || item.impact === 'serious').map(item => ({ id: item.id, impact: item.impact, targets: item.nodes.map(node => node.target) }));
    });
    expect(axeViolations).toEqual([]);
    await page.evaluate(() => delete document.documentElement.dataset.theme);
    await page.emulateMedia({ colorScheme: 'light' });
    const lightBackground = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor);
    await page.emulateMedia({ colorScheme: 'dark' });
    const systemDarkBackground = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor);
    expect(systemDarkBackground).not.toBe(lightBackground);
    await page.emulateMedia({ colorScheme: 'light' });
    await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
    const darkBackground = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor);
    expect(darkBackground).not.toBe(lightBackground);

    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(2);
    }
    await page.setViewportSize({ width: 640, height: 900 });
    await page.evaluate(() => document.documentElement.style.zoom = '2');
    const zoomOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(zoomOverflow).toBeLessThanOrEqual(2);
    expect(audit.privateLeaks).toEqual([]);
    expect(audit.consoleErrors).toEqual([]);
    expect(audit.failedRequests).toEqual([]);
  });
}

test('Hausa hubs discover every HA-04 route', async ({ page }) => {
  for (const hub of ['/ha/noma/', '/ha/kayan-aiki/']) {
    await page.goto(hub, { waitUntil: 'domcontentloaded' });
    const hrefs = await page.locator('a[href^="/ha/"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
    const expected = apps.filter(app => hub === '/ha/noma/' || app.route.includes('/ha/kayan-aiki/')).map(app => app.route);
    for (const route of expected) expect(hrefs).toContain(route);
  }
});
