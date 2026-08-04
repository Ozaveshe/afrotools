const { test, expect } = require('@playwright/test');

const route = '/sw/zana/viwango-vya-cbk/';

async function prepare(page, width, scheme) {
  const errors = [];
  const calculationRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', request => {
    if (/api\/forex|fx\/rates|fawaz|er-api|exchangerate|coingecko/i.test(request.url())) {
      calculationRequests.push(request.url());
    }
  });
  await page.addInitScript(() => {
    try { localStorage.setItem('afrotools_cookie_consent', 'declined'); } catch (_) {}
  });
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
  await page.setViewportSize({ width, height: 812 });
  await page.goto(route, { waitUntil: 'networkidle' });
  return { errors, calculationRequests };
}

for (const scenario of [
  { width: 320, scheme: 'light' },
  { width: 375, scheme: 'dark' }
]) {
  test(`native CBK workflow is local and usable at ${scenario.width}px ${scenario.scheme}`, async ({ page }) => {
    const observed = await prepare(page, scenario.width, scenario.scheme);
    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/viwango-vya-cbk/');
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/cbk-rates/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://afrotools.com/assets/img/tools/cbk-rates.webp');
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent());
    expect(schema.inLanguage).toBe('sw');

    const controls = page.locator('[data-cbk-manual] input,[data-cbk-manual] select,[data-cbk-manual] button');
    expect(await controls.count()).toBe(6);
    expect(await controls.evaluateAll(nodes => nodes.filter(node => node.tagName !== 'BUTTON' && !node.labels?.length && !node.getAttribute('aria-label')).length)).toBe(0);
    await expect(page.getByRole('button', { name: 'Kokotoa kivinjarini' })).toBeVisible();

    const before = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
    await page.locator('[name="amount"]').fill('250');
    await page.locator('[name="currency"]').fill('JPY');
    await page.locator('[name="rate"]').fill('85');
    await page.locator('[name="units"]').selectOption('100');
    await page.locator('[name="sourceDate"]').fill('2026-07-21');
    await page.getByRole('button', { name: 'Kokotoa kivinjarini' }).press('Enter');
    await expect(page.locator('[data-result]')).toBeVisible();
    await expect(page.locator('[data-summary]')).toContainText('212.50');
    await expect(page.locator('[data-rate-line]')).toContainText('JPY');
    await expect(page.locator('[data-formula]')).toContainText('250.00');
    await expect(page.locator('[data-source-date]')).toHaveText('2026-07-21');
    expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual(before);

    await page.locator('.fx-official').focus();
    expect(parseFloat(await page.locator('.fx-official').evaluate(node => getComputedStyle(node).outlineWidth))).toBeGreaterThanOrEqual(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    expect(observed.calculationRequests).toEqual([]);
    expect(observed.errors).toEqual([]);
  });
}

test('native CBK validation is explicit and 200 percent text reflows', async ({ page }) => {
  const observed = await prepare(page, 320, 'light');
  await page.getByRole('button', { name: 'Kokotoa kivinjarini' }).click();
  await expect(page.locator('[data-error]')).toHaveText('Ingiza kiasi kikubwa kuliko sifuri.');
  await expect(page.locator('[name="amount"]')).toBeFocused();

  await page.locator('[name="amount"]').fill('100');
  await page.locator('[name="currency"]').fill('USD');
  await page.locator('[name="rate"]').fill('130');
  await page.locator('[name="sourceDate"]').fill('2999-01-01');
  await page.getByRole('button', { name: 'Kokotoa kivinjarini' }).click();
  await expect(page.locator('[data-error]')).toHaveText('Tarehe ya chanzo haiwezi kuwa ya baadaye.');
  await expect(page.locator('[name="sourceDate"]')).toBeFocused();

  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.locator('main').evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(0);
  expect(await page.locator('main *').evaluateAll(nodes => nodes.filter(node => {
    if (!node.getClientRects().length) return false;
    const rect = node.getBoundingClientRect();
    return rect.left < -1 || rect.right > innerWidth + 1;
  }).map(node => node.tagName))).toEqual([]);
  expect(observed.calculationRequests).toEqual([]);
  expect(observed.errors).toEqual([]);
});
