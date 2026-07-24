const { test, expect } = require('@playwright/test');
const os = require('node:os');
const path = require('node:path');

async function assertGeometry(page) {
  const geometry = await page.evaluate(() => {
    const controls = [...document.querySelectorAll('#walletValidatorForm select,#walletValidatorForm textarea,#walletValidatorForm button,#walletCopy')];
    const cookie = document.querySelector('#afro-cookie-consent');
    const assistant = document.querySelector('afro-site-assistant');
    const critical = [...document.querySelectorAll('.wallet-badge,.wallet-metrics,.wallet-boundary,#walletCopy')].filter(node => {
      const r = node.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight;
    });
    const hit = (a, b) => {
      const x = a.getBoundingClientRect(), y = b.getBoundingClientRect();
      return x.width > 0 && x.height > 0 && y.width > 0 && y.height > 0 && x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top;
    };
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      controlsInside: controls.every(node => {
        const r = node.getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth;
      }),
      minTargets: controls.every(node => node.getBoundingClientRect().height >= 44),
      cookieHits: cookie ? critical.filter(node => hit(cookie, node)).map(node => node.id || node.className) : [],
      cookieActionsContained: cookie ? [...cookie.querySelectorAll('.afro-cc-actions > *')].every(node => {
        const outer = cookie.getBoundingClientRect(), inner = node.getBoundingClientRect();
        return inner.left >= outer.left && inner.right <= outer.right;
      }) : true,
      assistantSuppressed: cookie && assistant ? assistant.getBoundingClientRect().width === 0 : true
    };
  });
  expect(geometry).toEqual({ overflow: 0, controlsInside: true, minTargets: true, cookieHits: [], cookieActionsContained: true, assistantSuppressed: true });
}

test('English route validates locally, redacts copies and invalidates stale results', async ({ page, context }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const dataRequests = [];
  page.on('request', request => {
    if (['xhr', 'fetch', 'websocket'].includes(request.resourceType())) dataRequests.push(request.url());
  });
  await page.goto('/crypto/address-validator/');
  const storageBefore = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  const fullAddress = 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL';
  await page.selectOption('#walletNetwork', 'tron');
  await page.fill('#walletAddress', fullAddress);
  await page.locator('#walletValidatorForm').evaluate(form => form.requestSubmit());
  await expect(page.locator('#walletResult')).toContainText('Format valid');
  await expect(page.locator('#walletResult')).toContainText('Passed');
  await expect(page.locator('#walletResult')).toBeFocused();
  expect(dataRequests).toEqual([]);
  const storageAfter = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  expect(storageAfter).toEqual(storageBefore);
  expect(JSON.stringify(storageAfter)).not.toContain(fullAddress);
  await assertGeometry(page);
  await page.screenshot({ path: path.join(os.tmpdir(), 'wallet-validator-375-dark.png'), fullPage: true });
  await page.click('#walletCopy');
  const receipt = await page.evaluate(() => navigator.clipboard.readText());
  expect(receipt).not.toContain(fullAddress);
  expect(receipt).toContain('TNPeea...1NYqeL');
  await page.fill('#walletAddress', fullAddress.slice(0, -1) + 'M');
  await expect(page.locator('#walletCopy')).toBeDisabled();
  await expect(page.locator('#walletStatus')).toContainText('changed');
});

test('native French route and EVM mixed-case result fail closed', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/fr/crypto/address-validator/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.selectOption('#walletNetwork', 'evm');
  await page.fill('#walletAddress', '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
  await page.locator('#walletValidatorForm').evaluate(form => form.requestSubmit());
  await expect(page.locator('#walletResult')).toContainText('non vérifiée');
  await expect(page.locator('#walletResult')).toContainText('Non évaluée');
  await expect(page.locator('#walletResult')).toContainText('n’est pas évaluée');
  await expect(page.locator('#walletResult')).not.toContainText(/decoded|does not|requires|Confirm the|validation only/i);
  await expect(page.locator('#walletResult')).not.toContainText(/\bsafe\b|\bsûr\b/i);
  await assertGeometry(page);
  await page.screenshot({ path: path.join(os.tmpdir(), 'wallet-validator-fr-768-light.png'), fullPage: true });
});

test('French diagnostics are native across all four networks and invalid paths', async ({ page }) => {
  await page.goto('/fr/crypto/address-validator/');
  const cases = [
    ['bitcoin', 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', 'Valide', 'programme témoin'],
    ['evm', '0xde709f2102306220921060314715629080e2fb77', 'Valide', 'Adresse hexadécimale de 20 octets'],
    ['solana', '11111111111111111111111111111111', 'Valide', 'Clé publique de 32 octets'],
    ['tron', 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL', 'Valide', '25 octets décodés'],
    ['bitcoin', 'bc1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4', 'Invalide', 'ne doit pas mélanger'],
    ['evm', '0x1234', 'Invalide', '40 caractères hexadécimaux'],
    ['solana', '1111111111111111111111111111111', 'Invalide', 'exactement 32 octets'],
    ['tron', 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeM', 'Invalide', 'ne correspond pas']
  ];
  for (const [network, value, badge, phrase] of cases) {
    await page.selectOption('#walletNetwork', network);
    await page.fill('#walletAddress', value);
    await page.locator('#walletValidatorForm').evaluate(form => form.requestSubmit());
    await expect(page.locator('.wallet-badge')).toHaveText(badge);
    await expect(page.locator('#walletResult')).toContainText(phrase);
    await expect(page.locator('#walletResult')).not.toContainText(/\bInvalid\b|Not established|Passed|Failed|Not evaluated|Not applicable|decoded bytes|public key|hexadecimal address|does not|must contain|Confirm the|validation only|requires Keccak/i);
  }
});

test('320px Bitcoin result remains usable and rejects mixed-case Bech32', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/crypto/address-validator/');
  await page.fill('#walletAddress', 'bc1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4');
  await page.locator('#walletValidatorForm').evaluate(form => form.requestSubmit());
  await expect(page.locator('#walletResult')).toContainText('Invalid format');
  await expect(page.locator('#walletResult')).toContainText('mix letter case');
  await assertGeometry(page);
});

test('manual theme choice overrides the operating-system preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/crypto/address-validator/');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const dark = await page.locator('.wallet-card').first().evaluate(node => getComputedStyle(node).backgroundColor);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const light = await page.locator('.wallet-card').first().evaluate(node => getComputedStyle(node).backgroundColor);
  expect(dark).not.toBe(light);
});
