const { test, expect } = require('@playwright/test');

async function installStorageProbe(page) {
  await page.addInitScript(() => {
    window.__hlStorageMutations = [];
    const original = {
      setItem: Storage.prototype.setItem,
      removeItem: Storage.prototype.removeItem,
      clear: Storage.prototype.clear
    };
    Storage.prototype.setItem = function (key, value) {
      window.__hlStorageMutations.push({ operation: 'setItem', key: String(key), value: String(value) });
      return original.setItem.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key) {
      window.__hlStorageMutations.push({ operation: 'removeItem', key: String(key) });
      return original.removeItem.call(this, key);
    };
    Storage.prototype.clear = function () {
      window.__hlStorageMutations.push({ operation: 'clear' });
      return original.clear.call(this);
    };
  });
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
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.goto(route, { waitUntil: 'networkidle' });
  const accept = page.getByRole('button', { name: /^(Accept|Accepter|Kubali)/i }).first();
  try {
    await accept.waitFor({ state: 'visible', timeout: 2500 });
    await accept.click();
    await expect(accept).toBeHidden();
  } catch (error) {
    if (await accept.isVisible().catch(() => false)) throw error;
  }
  await page.evaluate(() => { window.__hlStorageMutations = []; });
  if (manualTheme) await page.evaluate((theme) => { document.documentElement.dataset.theme = theme; }, manualTheme);
  const nonGet = [];
  page.on('request', (request) => { if (request.method() !== 'GET') nonGet.push(request.method() + ' ' + request.url()); });
  return { consoleErrors, nonGet };
}

async function selectStatus(page, index, value) {
  await page.locator('[data-hl-status]').nth(index).selectOption(value);
}

async function downloadText(page) {
  const pending = page.waitForEvent('download');
  await page.locator('#hl-download').click();
  const download = await pending;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function expectPrivate(page, proof) {
  const mutations = await page.evaluate(() => window.__hlStorageMutations);
  expect(mutations.filter((mutation) => mutation.key !== '_gcl_ls')).toEqual([]);
  expect(mutations.some((mutation) =>
    /home-loan|application-file/i.test(mutation.key || '') ||
    /Bank A|Main home file|Banque A|Benki A/.test(mutation.value || '')
  )).toBe(false);
  expect(proof.nonGet).toEqual([]);
  expect(proof.consoleErrors).toEqual([]);
}

async function expectNoOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

async function expectAccessibleControls(page) {
  const unnamed = await page.locator('#main input, #main select, #main button, #main a').evaluateAll((elements) =>
    elements.filter((element) => {
      if (element.matches('input,select')) return !element.labels?.length && !element.getAttribute('aria-label');
      return !((element.textContent || '').trim() || (element.getAttribute('aria-label') || '').trim());
    }).map((element) => element.outerHTML)
  );
  expect(unnamed).toEqual([]);
}

async function captureFullPage(page, path) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const navbar = document.querySelector('afro-navbar');
    if (navbar) navbar.style.setProperty('position', 'static', 'important');
    Array.from(document.body.querySelectorAll('*')).forEach((element) => {
      if (getComputedStyle(element).position === 'fixed') {
        element.style.setProperty('visibility', 'hidden', 'important');
      }
    });
  });
  await page.screenshot({ path, fullPage: true });
}

test('EN 320 system dark: evidence states, bounds, handoffs, TXT and PDF', async ({ page }, testInfo) => {
  const proof = await openTool(page, '/tools/home-loan-eligibility/', 320, 'dark');
  await page.locator('#hl-lender').fill('Bank A');
  await page.locator('#hl-application').fill('Main home file');
  await selectStatus(page, 0, 'ready');
  await selectStatus(page, 1, 'ready');
  await selectStatus(page, 2, 'ready');
  await selectStatus(page, 3, 'gathering');
  await selectStatus(page, 4, 'gathering');
  await selectStatus(page, 5, 'update');
  await selectStatus(page, 6, 'not-requested');
  await page.locator('#hl-form button[type="submit"]').click();

  await expect(page.locator('#hl-result-title')).toHaveText('3 evidence items ready');
  await expect(page.locator('#hl-ready')).toHaveText('3');
  await expect(page.locator('#hl-gathering')).toHaveText('2');
  await expect(page.locator('#hl-update')).toHaveText('1');
  await expect(page.locator('#hl-open')).toHaveText('3');
  expect(await page.locator('input[type="number"], input[type="file"]').count()).toBe(0);

  const handoffs = await page.locator('#specialists .hl-link').evaluateAll((links) => links.map((link) => new URL(link.href).pathname));
  expect(handoffs).toEqual(['/tools/mortgage-affordability/','/tools/mortgage-calculator/','/tools/first-home-buyer/','/tools/loan-compare/','/tools/property-transfer-cost/']);

  const text = await downloadText(page);
  expect(text).toContain('Lender label (optional): Bank A');
  expect(text).toContain('3 evidence items ready');
  expect(text).toContain('Identity evidence: Ready');
  expect(text).toContain('does not measure eligibility or approval chances');

  await page.locator('#hl-lender').evaluate((input) => {
    input.value = 'x'.repeat(81);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#hl-form button[type="submit"]').click();
  await expect(page.locator('#hl-result')).not.toHaveClass(/on/);
  await expect(page.locator('#hl-error')).toHaveClass(/on/);
  await expect(page.locator('#hl-error')).toContainText('80 characters');

  await page.locator('#hl-lender').fill('Bank A');
  await page.locator('#hl-form button[type="submit"]').click();
  await expect(page.locator('#hl-result')).toHaveClass(/on/);
  await expectNoOverflow(page);
  await expectAccessibleControls(page);
  await captureFullPage(page, testInfo.outputPath('home-loan-file-en-320-dark.png'));
  await page.emulateMedia({ media: 'print', colorScheme: 'dark' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(50_000);
  await expectPrivate(page, proof);
});

test('FR 375 light: localized status, TXT and five deliberate handoffs', async ({ page }, testInfo) => {
  const proof = await openTool(page, '/fr/tools/eligibilite-pret-immobilier/', 375, 'light');
  await page.locator('#hl-lender').fill('Banque A');
  await selectStatus(page, 0, 'ready');
  await selectStatus(page, 1, 'gathering');
  await selectStatus(page, 2, 'update');
  await selectStatus(page, 3, 'not-requested');
  await page.locator('#hl-form button[type="submit"]').click();
  await expect(page.locator('#hl-result-title')).toHaveText('1 justificatif prêt');
  await expect(page.locator('#hl-gathering')).toHaveText('1');
  const text = await downloadText(page);
  expect(text).toContain('Libellé de la banque (facultatif): Banque A');
  expect(text).toContain('Justificatif d’identité: Prêt');
  expect(text).toContain('ne mesure ni l’éligibilité ni les chances d’accord');
  const handoffs = await page.locator('#specialists .hl-link').evaluateAll((links) => links.map((link) => new URL(link.href).pathname));
  expect(handoffs).toEqual(['/fr/tools/capacite-emprunt/','/fr/tools/calculateur-hypothecaire/','/fr/tools/premier-achat-immobilier/','/fr/tools/comparateur-prets/','/fr/tools/frais-transfert-propriete/']);
  await expect(page.locator('afro-related-tools')).toHaveCount(0);
  await expectNoOverflow(page);
  await expectAccessibleControls(page);
  await captureFullPage(page, testInfo.outputPath('home-loan-file-fr-375-light.png'));
  await expectPrivate(page, proof);
});

test('SW 768 manual dark: localized administrative summary stays non-advisory', async ({ page }, testInfo) => {
  const proof = await openTool(page, '/sw/zana/ustahiki-wa-mkopo-wa-nyumba/', 768, 'light', 'dark');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(9, 17, 31)');
  await page.locator('#hl-lender').fill('Benki A');
  await selectStatus(page, 0, 'ready');
  await selectStatus(page, 1, 'ready');
  await selectStatus(page, 2, 'gathering');
  await page.locator('#hl-form button[type="submit"]').click();
  await expect(page.locator('#hl-result-title')).toHaveText('Ushahidi 2 uko tayari');
  await expect(page.locator('#hl-ready')).toHaveText('2');
  await expect(page.locator('#hl-result-copy')).toContainText('Haipimi ustahiki wala nafasi ya kuidhinishwa');
  const handoffs = await page.locator('#specialists .hl-link').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(handoffs).toHaveLength(5);
  expect(handoffs).toContain('/sw/zana/uwezo-wa-mkopo-wa-nyumba/');
  expect(handoffs).toContain('/sw/zana/kikokotoo-mkopo-wa-nyumba/');
  expect(handoffs).toContain('/sw/zana/mnunuzi-wa-kwanza-wa-nyumba/');
  expect(handoffs).toContain('/sw/zana/kilinganisha-mikopo/');
  await expect(page.locator('afro-related-tools')).toHaveCount(0);
  await expectNoOverflow(page);
  await expectAccessibleControls(page);
  await captureFullPage(page, testInfo.outputPath('home-loan-file-sw-768-manual-dark.png'));
  await expectPrivate(page, proof);
});
