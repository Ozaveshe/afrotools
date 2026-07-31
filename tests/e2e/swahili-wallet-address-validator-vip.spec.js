const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const SW_ROUTE = '/sw/crypto/address-validator/';
const FULL_TRON_ADDRESS = 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL';

async function preparePrivatePage(page, context, viewport) {
  await page.setViewportSize(viewport);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
  });
  const consoleErrors = [];
  const pageErrors = [];
  const dataRequests = [];
  const failedRequests = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => {
    if (['xhr', 'fetch', 'websocket'].includes(request.resourceType())) {
      dataRequests.push(request.url());
    }
  });
  page.on('requestfailed', (request) => failedRequests.push(request.url()));
  await page.goto(SW_ROUTE, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  return { consoleErrors, pageErrors, dataRequests, failedRequests };
}

async function submit(page, network, address) {
  await page.selectOption('#walletNetwork', network);
  await page.fill('#walletAddress', address);
  await page.locator('#walletValidatorForm').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#walletResult')).toBeFocused();
}

async function geometry(page) {
  return page.evaluate(() => {
    const controls = [...document.querySelectorAll(
      '#walletValidatorForm select,#walletValidatorForm textarea,#walletValidatorForm button,#walletCopy'
    )];
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      controlsInside: controls.every((node) => {
        const box = node.getBoundingClientRect();
        return box.left >= 0 && box.right <= innerWidth;
      }),
      targetsAtLeast44: controls.every((node) => node.getBoundingClientRect().height >= 44)
    };
  });
}

test('real shared engine returns native Swahili valid, invalid and boundary results for every network', async ({ page, context }) => {
  const telemetry = await preparePrivatePage(page, context, { width: 375, height: 900 });
  const cases = [
    ['bitcoin', '1BoatSLRHtKNngkdXEeobR76b53LETtpyT', 'Sahihi', 'Umefaulu', 'Baiti 25 zilizosimbuliwa'],
    ['evm', '0xde709f2102306220921060314715629080e2fb77', 'Sahihi', 'Haipo', 'Anwani ya heksadesimali ya baiti 20'],
    ['solana', '11111111111111111111111111111111', 'Sahihi', 'Haitumiki', 'Baiti 32 zilizosimbuliwa'],
    ['tron', FULL_TRON_ADDRESS, 'Sahihi', 'Umefaulu', 'Kiambishi awali 0x41'],
    ['bitcoin', 'bc1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4', 'Si sahihi', 'Umeshindwa', 'hairuhusu kuchanganya herufi kubwa na ndogo'],
    ['evm', '0x1234', 'Si sahihi', 'Umeshindwa', 'herufi 40 kamili za heksadesimali'],
    ['solana', '1111111111111111111111111111111', 'Si sahihi', 'Haitumiki', 'baiti 32 kamili'],
    ['tron', 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeM', 'Si sahihi', 'Umeshindwa', 'haulingani']
  ];
  for (const [network, address, badge, checksum, detail] of cases) {
    await submit(page, network, address);
    await expect(page.locator('.wallet-badge')).toHaveText(badge);
    await expect(page.locator('#walletResult')).toContainText(checksum);
    await expect(page.locator('#walletResult')).toContainText(detail);
    await expect(page.locator('#walletResult')).not.toContainText(
      /\b(?:Valid|Invalid|Unverified|Passed|Failed|Not evaluated|Not applicable|Not present|decoded bytes|public key|does not|must contain|Confirm the)\b/
    );
    if (badge === 'Si sahihi') {
      await expect(page.locator('#walletCopy')).toBeDisabled();
      await expect(page.locator('#walletResult')).not.toContainText('Muundo ni sahihi kwa ukaguzi uliofanywa');
    }
  }

  await submit(page, 'evm', '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
  await expect(page.locator('.wallet-badge')).toHaveText('Haijathibitishwa');
  await expect(page.locator('#walletResult')).toContainText('Checksum ya EIP-55');
  await expect(page.locator('#walletResult')).toContainText('Usichukulie matokeo haya kuwa yamethibitishwa');

  await submit(page, 'evm', '0x0000000000000000000000000000000000000000');
  await expect(page.locator('#walletResult')).toContainText('anwani ya sifuri');

  await page.fill('#walletAddress', '');
  await page.locator('#walletValidatorForm').evaluate((form) => form.requestSubmit());
  await expect(page.locator('#walletAddress')).toBeFocused();
  await expect(page.locator('.wallet-badge')).toHaveCount(0);
  await expect(page.locator('#walletResult')).toHaveText('Hakuna matokeo ya sasa. Fanya ukaguzi tena.');
  await expect(page.locator('#walletStatus')).toHaveText(
    'Sahihisha sehemu inayohitajika kabla ya kufanya ukaguzi.'
  );
  await expect(page.locator('#walletCopy')).toBeDisabled();

  expect(telemetry.dataRequests).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.pageErrors).toEqual([]);
});

test('the only advertised export is copied, parsed, reopened and redacted without persistence or network', async ({ page, context }) => {
  const telemetry = await preparePrivatePage(page, context, { width: 375, height: 900 });
  const storageBefore = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
    url: location.href
  }));

  await submit(page, 'tron', FULL_TRON_ADDRESS);
  await page.click('#walletCopy');
  await expect(page.locator('#walletStatus')).toHaveText('Risiti iliyofichwa imenakiliwa.');
  const receipt = await page.evaluate(() => navigator.clipboard.readText());
  const reopened = receipt.split('\n').map((line) => line.trim());
  expect(reopened).toHaveLength(7);
  expect(reopened[0]).toBe('Risiti ya ndani ya muundo wa anwani ya pochi');
  expect(reopened[1]).toBe('Mtandao: TRON');
  expect(reopened[2]).toBe('Anwani: TNPeea...1NYqeL');
  expect(reopened[3]).toBe('Hali: Muundo ni sahihi kwa ukaguzi uliofanywa');
  expect(reopened[4]).toBe('Checksum: Umefaulu');
  expect(reopened[5]).toBe('Mbinu: Base58Check yenye SHA-256 mara mbili');
  expect(reopened[6]).toBe('AfroTools: https://afrotools.com/sw/crypto/address-validator/');
  expect(receipt).not.toContain(FULL_TRON_ADDRESS);

  const storageAfter = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
    url: location.href
  }));
  expect(storageAfter).toEqual(storageBefore);
  expect(JSON.stringify(storageAfter)).not.toContain(FULL_TRON_ADDRESS);
  expect(page.url()).not.toContain(FULL_TRON_ADDRESS);
  expect(telemetry.dataRequests).toEqual([]);
  expect(telemetry.failedRequests).toEqual([]);
  expect(telemetry.consoleErrors).toEqual([]);
  expect(telemetry.pageErrors).toEqual([]);

  const invalidAddress = `${FULL_TRON_ADDRESS.slice(0, -1)}M`;
  await page.fill('#walletAddress', invalidAddress);
  await expect(page.locator('.wallet-badge')).toHaveCount(0);
  await expect(page.locator('#walletResult')).toHaveText('Hakuna matokeo ya sasa. Fanya ukaguzi tena.');
  await expect(page.locator('#walletCopy')).toBeDisabled();
  await expect(page.locator('#walletStatus')).toHaveText(
    'Ingizo limebadilika. Matokeo ya awali yameondolewa.'
  );

  await page.locator('#walletValidatorForm').evaluate((form) => form.requestSubmit());
  await expect(page.locator('.wallet-badge')).toHaveText('Si sahihi');
  await expect(page.locator('#walletCopy')).toBeDisabled();
  await expect(page.locator('#walletResult')).not.toContainText(
    'Muundo ni sahihi kwa ukaguzi uliofanywa'
  );
  await page.evaluate(() => navigator.clipboard.writeText('sentinel'));
  await page.locator('#walletCopy').evaluate((button) => button.click());
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('sentinel');
  await expect(page.locator('[data-share], [data-export], #walletShare, #walletExport')).toHaveCount(0);
});

for (const viewport of [
  { name: '320px light', width: 320, height: 800, scheme: 'light' },
  { name: '375px dark', width: 375, height: 900, scheme: 'dark' }
]) {
  test(`${viewport.name} reflows with usable controls and native runtime copy`, async ({ page, context }) => {
    await page.emulateMedia({ colorScheme: viewport.scheme, reducedMotion: 'reduce' });
    const telemetry = await preparePrivatePage(page, context, viewport);
    await submit(page, 'tron', FULL_TRON_ADDRESS);
    expect(await geometry(page)).toEqual({
      overflow: 0,
      controlsInside: true,
      targetsAtLeast44: true
    });
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(
      /Private, local validation|Choose the intended network|Check an address|Validation receipt|Checks performed|What this cannot prove|Related tools|Copy redacted receipt/i
    );
    expect(telemetry.consoleErrors).toEqual([]);
    expect(telemetry.pageErrors).toEqual([]);
  });
}

test('200 percent text reflow, manual themes and keyboard order remain usable', async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await preparePrivatePage(page, context, { width: 375, height: 900 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(await geometry(page)).toEqual({
    overflow: 0,
    controlsInside: true,
    targetsAtLeast44: true
  });

  await page.locator('#walletNetwork').focus();
  await page.selectOption('#walletNetwork', 'tron');
  await page.keyboard.press('Tab');
  await expect(page.locator('#walletAddress')).toBeFocused();
  await page.fill('#walletAddress', FULL_TRON_ADDRESS);
  await page.keyboard.press('Tab');
  await expect(page.locator('.wallet-submit')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#walletResult')).toBeFocused();
  await expect(page.locator('.wallet-badge')).toHaveText('Sahihi');

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  const themeToggle = page.locator('.theme-toggle');
  await expect(themeToggle).toBeVisible();
  await expect(themeToggle).toHaveAttribute('aria-label', /Badili kwenda (?:giza|mwanga)/);
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const dark = await page.locator('.wallet-card').first().evaluate((node) => getComputedStyle(node).backgroundColor);
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const light = await page.locator('.wallet-card').first().evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(dark).not.toBe(light);

  await expect(page.locator('label[for="walletNetwork"]')).toBeVisible();
  await expect(page.locator('label[for="walletAddress"]')).toBeVisible();
  await expect(page.locator('#walletStatus')).toHaveAttribute('role', 'status');
  await expect(page.locator('#walletStatus')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('iframe')).toHaveCount(0);
});

test('SEO, reciprocal hreflang and artwork identify the physical Swahili owner', async ({ page }) => {
  await page.goto(SW_ROUTE, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://afrotools.com/sw/crypto/address-validator/'
  );
  for (const [locale, href] of [
    ['en', 'https://afrotools.com/crypto/address-validator/'],
    ['fr', 'https://afrotools.com/fr/crypto/address-validator/'],
    ['sw', 'https://afrotools.com/sw/crypto/address-validator/'],
    ['x-default', 'https://afrotools.com/crypto/address-validator/']
  ]) {
    await expect(page.locator(`link[rel="alternate"][hreflang="${locale}"]`)).toHaveAttribute('href', href);
  }
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    'https://afrotools.com/sw/crypto/address-validator/'
  );
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(schemas.map((value) => JSON.parse(value))).toEqual(expect.arrayContaining([
    expect.objectContaining({ '@type': 'WebApplication', inLanguage: 'sw' }),
    expect.objectContaining({ '@type': 'FAQPage' })
  ]));
  const artwork = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(artwork).toBe('https://afrotools.com/assets/img/tools/crypto-address.webp');
  expect(fs.existsSync(path.join(ROOT, 'assets/img/tools/crypto-address.webp'))).toBe(true);
});

test('Swahili crypto hub and all-tools search discover the native app', async ({ page }) => {
  await page.goto('/sw/mshahara-na-kodi/crypto/', { waitUntil: 'domcontentloaded' });
  await page.fill('#hub-search', 'anwani');
  const hubLink = page.locator('a[href="/sw/crypto/address-validator/"]').first();
  await expect(hubLink).toBeVisible();
  await expect(hubLink).not.toContainText('Kiingereza');

  await page.goto('/sw/zana-zote/?q=anwani%20ya%20pochi', { waitUntil: 'domcontentloaded' });
  const searchLink = page.locator('#search-results-grid a[href="/sw/crypto/address-validator/"]').first();
  await expect(searchLink).toBeVisible();
  await expect(searchLink).toContainText('Kihakiki cha Muundo wa Anwani ya Pochi');
});
