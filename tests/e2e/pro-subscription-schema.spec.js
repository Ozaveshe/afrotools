const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 375, height: 812 } });
for (const route of ['/pro/', '/pricing/']) {
  test(`${route} subscription prices agree with rendered billing options`, async ({ page, baseURL }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/*', (request) => {
      const url = new URL(request.request().url());
      return url.origin === new URL(baseURL).origin ? request.continue() : request.abort();
    });
    await page.goto(route);
    const schema = JSON.parse(await page.locator('script[data-registry-schema="pro-subscription"]').textContent());
    expect(schema.mainEntity['@type']).toBe('WebApplication');
    expect(schema.mainEntity.offers.map((offer) => offer.price)).toEqual(['5.00', '30.00']);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${route}`);
    if (route === '/pricing/') {
      await expect(page.locator('#proPrice')).toContainText('$5');
      await page.locator('#billingToggle').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#billingToggle')).toHaveAttribute('aria-checked', 'true');
      await expect(page.locator('#proPrice')).toContainText('$30');
      await expect(page.locator('#proPriceSub')).toContainText('50%');
      await page.keyboard.press('Space');
      await expect(page.locator('#proPrice')).toContainText('$5');
    } else {
      await expect(page.locator('[data-registry-plan="product:annual"][data-registry-field="title"]').first()).toHaveText('$30');
      await expect(page.locator('#btn-monthly')).toBeVisible();
      await expect(page.locator('#btn-annual')).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('the signed-out Pro choice survives comparison, currency selection and the sign-in return', async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  await page.route('**/*', route => {
    const request = route.request();
    return request.method() === 'GET' && new URL(request.url()).origin === origin
      ? route.continue() : route.abort();
  });
  await page.goto('/pricing/');
  await expect(page.locator('.free-cta')).toHaveAttribute('href', '/tools/');
  await expect(page.locator('.compare-cards-mobile')).toBeVisible();
  await expect(page.locator('.compare-table')).toBeHidden();
  await expect(page.locator('.pro-cta')).toHaveAttribute('href', '/pro/#monthly-plan');
  await page.getByRole('switch', { name: 'Annual billing' }).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#proPrice')).toContainText('$30 USD');
  await page.getByRole('link', { name: 'Review annual Pro plan' }).press('Enter');
  await expect(page).toHaveURL(origin + '/pro/#annual-plan');
  await expect(page.locator('#annual-plan')).toBeInViewport();
  await page.locator('#currency-select').selectOption('kes');
  const displayed = await page.locator('#annual-plan .price').innerText();
  await page.locator('#btn-annual').press('Enter');
  await expect(page).toHaveURL(/\/auth\/\?/);
  const signIn = new URL(page.url());
  expect(signIn.searchParams.get('intent')).toBe('pro-checkout');
  const next = new URL(signIn.searchParams.get('next'), origin);
  expect(next.pathname).toBe('/pro/');
  expect(next.hash).toBe('#annual-plan');
  expect(next.searchParams.get('currency')).toBe('kes');
  expect(next.searchParams.get('next')).toBe('/pro/workspace/');
  await page.goto(next.href);
  await expect(page.locator('#currency-select')).toHaveValue('kes');
  await expect(page.locator('#annual-plan .price')).toHaveText(displayed);
});
