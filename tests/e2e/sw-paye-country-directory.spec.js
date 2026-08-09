const {test, expect} = require('@playwright/test');

test('Swahili PAYE directory resolves all 54 native country owners without collecting salary data', async ({page}) => {
  const errors = [];
  const external = [];
  let privacyArmed = false;
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    const url = request.url();
    if (privacyArmed && /^https?:/.test(url) && !/^http:\/\/(127\.0\.0\.1|localhost):/.test(url)) external.push(url);
  });
  await page.goto('/sw/mshahara-na-kodi/paye/');
  await expect(page.getByRole('heading', {level: 1})).toContainText('PAYE');
  const selector = page.locator('#paye-country');
  await expect(selector.locator('option')).toHaveCount(55);
  privacyArmed = true;
  for (const option of await selector.locator('option:not([value=""])').evaluateAll(options => options.map(option => option.value))) {
    await selector.selectOption(option);
    await expect(page.locator('#paye-country-open')).toBeVisible();
    await expect(page.locator('#paye-country-open')).toHaveAttribute('href', /^\/sw\//);
  }
  await selector.selectOption('KE');
  await expect(page.locator('#paye-country-open')).toHaveAttribute('href', '/sw/kenya/kikokotoo-kodi-mshahara/');
  await expect(page.locator('#paye-country-result')).toContainText('Kiswahili');
  await selector.selectOption('GW');
  await expect(page.locator('#paye-country-open')).toHaveAttribute('href', '/sw/guinea-bissau/kikokotoo-kodi-mshahara/');
  await expect(page.locator('.paye-browse li a')).toHaveCount(54);
  await expect(page.locator('input[type="number"], [data-action="pdf"], [data-action="csv"], [data-action="json"]')).toHaveCount(0);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('PAYE directory locale group is reciprocal and category hubs are not conflated', async ({page}) => {
  const routes = ['/tools/paye-calculator/', '/fr/tools/calculateur-paye/', '/sw/mshahara-na-kodi/paye/'];
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/paye-calculator/');
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/calculateur-paye/');
    await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute('href', 'https://afrotools.com/sw/mshahara-na-kodi/paye/');
  }
  await page.goto('/salary-tax/paye/');
  await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveCount(0);
});

for (const width of [320, 375]) test(`Swahili PAYE directory reflows at ${width}px, 200% text and both themes`, async ({page}) => {
  await page.setViewportSize({width, height: 900});
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({colorScheme, reducedMotion: 'reduce'});
    await page.goto('/sw/mshahara-na-kodi/paye/');
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const dimensions = await page.evaluate(() => ({viewport: innerWidth, scroll: document.documentElement.scrollWidth}));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport + 2);
    const selector = page.locator('#paye-country');
    await selector.focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement !== document.body)).toBeTruthy();
    await expect(page.locator('#paye-country-result')).toHaveAttribute('aria-live', 'polite');
  }
});
