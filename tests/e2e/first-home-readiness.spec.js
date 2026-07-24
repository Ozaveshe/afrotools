const { test, expect } = require('@playwright/test');

async function installStorageProbe(page) {
  await page.addInitScript(() => {
    window.__fhStorageMutations = [];
    const original = {
      setItem: Storage.prototype.setItem,
      removeItem: Storage.prototype.removeItem,
      clear: Storage.prototype.clear
    };
    Storage.prototype.setItem = function (key, value) {
      window.__fhStorageMutations.push({ operation: 'setItem', key: String(key), value: String(value) });
      return original.setItem.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key) {
      window.__fhStorageMutations.push({ operation: 'removeItem', key: String(key) });
      return original.removeItem.call(this, key);
    };
    Storage.prototype.clear = function () {
      window.__fhStorageMutations.push({ operation: 'clear' });
      return original.clear.call(this);
    };
  });
}

async function dismissConsent(page) {
  const accept = page.getByRole('button', { name: /^(Accept|Accepter|Kubali)/i }).first();
  try {
    await accept.waitFor({ state: 'visible', timeout: 2500 });
    await accept.click();
    await expect(accept).toBeHidden();
  } catch (error) {
    if (await accept.isVisible().catch(() => false)) throw error;
  }
  await page.evaluate(() => { window.__fhStorageMutations = []; });
}

async function openTool(page, route, width, colorScheme, manualTheme) {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ colorScheme });
  await installStorageProbe(page);
  await page.route((url) =>
    /^(www\.googletagmanager\.com|www\.google-analytics\.com|analytics\.google\.com|stats\.g\.doubleclick\.net)$/.test(url.hostname) ||
    (url.hostname === 'www.google.com' && url.pathname.startsWith('/measurement/')),
  (route) => route.fulfill({ status: 204, body: '' }));
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.goto(route, { waitUntil: 'networkidle' });
  await dismissConsent(page);
  if (manualTheme) {
    await page.evaluate((theme) => { document.documentElement.dataset.theme = theme; }, manualTheme);
  }
  const nonGet = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') nonGet.push(request.method() + ' ' + request.url());
  });
  return { consoleErrors, nonGet };
}

async function expectNoOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

async function downloadText(page) {
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#fh-download').click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function expectPrivateRuntime(page, proof) {
  const mutations = await page.evaluate(() => window.__fhStorageMutations);
  const toolMutations = mutations.filter((mutation) => mutation.key !== '_gcl_ls');
  expect(toolMutations).toEqual([]);
  expect(mutations.some((mutation) =>
    /first-home|readiness/i.test(mutation.key || '') ||
    /2000000|300000|500000|800000|150000/.test(mutation.value || '')
  )).toBe(false);
  expect(proof.nonGet).toEqual([]);
  expect(proof.consoleErrors).toEqual([]);
}

test('EN 320 dark: bounded math, handoffs, local TXT and print PDF', async ({ page }, testInfo) => {
  const proof = await openTool(page, '/tools/first-home-buyer/', 320, 'dark');

  await page.locator('#fh-form button[type="submit"]').click();
  await expect(page.locator('#fh-result')).toHaveClass(/on/);
  await expect(page.locator('#fh-result-title')).toHaveText('14 months at your current pace');
  await expect(page.locator('#fh-goal')).toContainText('2,800,000');
  await expect(page.locator('#fh-saved')).toContainText('800,000');
  await expect(page.locator('#fh-gap')).toContainText('2,000,000');

  const handoffs = await page.locator('#specialists .fh-link-card').evaluateAll((links) =>
    links.map((link) => new URL(link.href).pathname)
  );
  expect(handoffs).toEqual([
    '/tools/mortgage-affordability/',
    '/tools/home-loan-eligibility/',
    '/tools/property-transfer-cost/',
    '/tools/rent-vs-buy/',
    '/tools/property-roi/'
  ]);
  await expect(page.locator('afro-related-tools')).toHaveCount(1);

  const text = await downloadText(page);
  expect(text).toContain('Cash goal: NGN');
  expect(text).toContain('2,800,000');
  expect(text).toContain('14 months at your current pace');
  expect(text).toContain('not a loan approval');

  await page.locator('#deposit').fill('1000000000001');
  await page.locator('#fh-form button[type="submit"]').click();
  await expect(page.locator('#fh-result')).not.toHaveClass(/on/);
  await expect(page.locator('#fh-error')).toHaveClass(/on/);
  await expect(page.locator('#fh-error')).toContainText('1,000,000,000,000');

  await page.locator('#deposit').fill('1000000000000');
  await page.locator('#upfront').fill('1');
  await page.locator('#fh-form button[type="submit"]').click();
  await expect(page.locator('#fh-result')).not.toHaveClass(/on/);
  await expect(page.locator('#fh-error')).toHaveClass(/on/);

  await page.locator('#deposit').fill('2000000');
  await page.locator('#upfront').fill('300000');
  await page.locator('#fh-form button[type="submit"]').click();
  await expect(page.locator('#fh-result')).toHaveClass(/on/);
  await expectNoOverflow(page);

  await page.screenshot({ path: testInfo.outputPath('first-home-en-320-dark-result.png'), fullPage: true });
  await page.emulateMedia({ media: 'print', colorScheme: 'dark' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(50_000);
  await expectPrivateRuntime(page, proof);
});

test('FR 375 light: zero pace, localized checklist and local TXT', async ({ page }, testInfo) => {
  const proof = await openTool(page, '/fr/tools/premier-achat-immobilier/', 375, 'light');

  await page.locator('#monthly').fill('0');
  await page.locator('#fh-form button[type="submit"]').click();
  await expect(page.locator('#fh-result-title')).toHaveText('Ajoutez un versement mensuel pour estimer un délai.');

  await page.locator('[data-fh-check]').first().check();
  await expect(page.locator('#fh-check-status')).toHaveText('1 vérifications sur 8 terminées');

  const text = await downloadText(page);
  expect(text).toContain('Objectif de trésorerie:');
  expect(text).toContain('Ajoutez un versement mensuel pour estimer un délai.');
  expect(text).toContain('1 vérifications sur 8 terminées');

  await page.locator('#deposit').fill('-1');
  await page.locator('#fh-form button[type="submit"]').click();
  await expect(page.locator('#fh-result')).not.toHaveClass(/on/);
  await expect(page.locator('#fh-error')).toHaveClass(/on/);
  await expectNoOverflow(page);

  await page.locator('#deposit').fill('2000000');
  await page.locator('#fh-form button[type="submit"]').click();
  await expect(page.locator('#fh-result')).toHaveClass(/on/);
  await expect(page.locator('afro-related-tools')).toHaveCount(0);
  const handoffs = await page.locator('#specialists .fh-link-card').evaluateAll((links) =>
    links.map((link) => new URL(link.href).pathname)
  );
  expect(handoffs).toEqual([
    '/fr/tools/capacite-emprunt/',
    '/fr/tools/eligibilite-pret-immobilier/',
    '/fr/tools/frais-transfert-propriete/',
    '/fr/tools/louer-vs-acheter/',
    '/fr/tools/roi-immobilier/'
  ]);
  await page.screenshot({ path: testInfo.outputPath('first-home-fr-375-light-result.png'), fullPage: true });
  await expectPrivateRuntime(page, proof);
});

test('SW 768 manual dark: funded and long-timeline boundaries remain safe', async ({ page }, testInfo) => {
  const proof = await openTool(page, '/sw/zana/mnunuzi-wa-kwanza-wa-nyumba/', 768, 'light', 'dark');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(9, 17, 31)');

  await page.locator('#saved').fill('3000000');
  await page.locator('#fh-form button[type="submit"]').click();
  await expect(page.locator('#fh-result-title')).toHaveText('Lengo lako la fedha limetimia');

  await page.locator('#deposit').fill('1000000000000');
  await page.locator('#upfront').fill('0');
  await page.locator('#reserve').fill('0');
  await page.locator('#saved').fill('0');
  await page.locator('#monthly').fill('0.01');
  await page.locator('#fh-form button[type="submit"]').click();
  await expect(page.locator('#fh-result')).toHaveClass(/on/);
  await expect(page.locator('#fh-result-title')).toHaveText('Muda umezidi kipindi cha mpango cha miaka 100. Ongeza mchango au badili lengo.');

  await page.locator('[data-fh-check]').nth(0).check();
  await page.locator('[data-fh-check]').nth(1).check();
  await expect(page.locator('#fh-check-status')).toHaveText('Ukaguzi 2 kati ya 8 umekamilika');
  await expectNoOverflow(page);

  const hrefs = await page.locator('#specialists .fh-link-card').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(hrefs).toHaveLength(5);
  expect(hrefs).toContain('/sw/zana/uwezo-wa-mkopo-wa-nyumba/');
  expect(hrefs).toContain('/sw/zana/ustahiki-wa-mkopo-wa-nyumba/');
  expect(hrefs).toContain('/sw/zana/faida-ya-uwekezaji-wa-nyumba/');
  await expect(page.locator('afro-related-tools')).toHaveCount(0);

  await page.screenshot({ path: testInfo.outputPath('first-home-sw-768-manual-dark-result.png'), fullPage: true });
  await expectPrivateRuntime(page, proof);
});
