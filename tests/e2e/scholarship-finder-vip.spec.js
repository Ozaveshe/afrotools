const { test, expect } = require('@playwright/test');

const route = '/tools/scholarship-finder/';
test.use({ serviceWorkers: 'block' });

test('fallback mode is honest, searchable, filterable and private', async ({ page }) => {
  const errors = [];
  const writes = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (request.method() !== 'GET') writes.push({
      url: request.url(),
      body: request.postData() || ''
    });
  });

  await page.goto(route);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.sch-card')).toHaveCount(10);
  await expect(page.locator('#feedStatus')).toContainText('Curated fallback');
  await expect(page.locator('.sch-vip-source-boundary')).toHaveCount(10);
  await expect(page.locator('.sch-fit-chip').first()).toHaveText('Not assessed');
  await expect(page.locator('#eligibilityCountry')).toBeDisabled();
  await expect(page.locator('#eligibilityCountryNote')).toContainText('not consistently structured');
  await expect(page.locator('#quickBand')).toBeDisabled();
  await expect(page.locator('#quickBandNote')).toContainText('not used for ranking');

  await page.locator('#search').fill('Chevening');
  await expect(page.locator('.sch-card')).toHaveCount(1);
  await expect(page.locator('.sch-card h3')).toHaveText('Chevening Scholarship');
  await page.locator('#search').fill('');

  await page.locator('#destination').selectOption('uk');
  await expect(page.locator('.sch-card')).toHaveCount(5);
  await expect(page.locator('.sch-fit-chip').first()).toContainText('relevance');

  await page.locator('.sch-card [data-sch-save]').first().click();
  await expect(page.locator('#shortlistNote')).toContainText('1 saved');
  const stored = await page.evaluate(() => localStorage.getItem('afro-scholarship-product-saved-v1'));
  expect(stored).toBeTruthy();
  expect(writes.every(item => !/Chevening|Rhodes|Gates Cambridge/i.test(item.body))).toBeTruthy();
  expect(errors).toEqual([]);
});

test('application pack exports without printing the whole product', async ({ page }) => {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  await page.locator('.sch-card [data-sch-save]').first().click();
  await expect(page.locator('#schPrintPack')).toBeEnabled();

  let printed = 0;
  await page.evaluate(() => {
    window.print = () => {
      window.__vipPrintCalls = (window.__vipPrintCalls || 0) + 1;
    };
  });
  await page.locator('#schPrintPack').click();
  printed = await page.evaluate(() => window.__vipPrintCalls || 0);
  expect(printed).toBe(1);
});

for (const width of [320, 360]) {
  test(`mobile ${width}px has no horizontal page overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 860 });
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.locator('.sch-card').first()).toBeVisible();
  });
}

test('dark mode and 200 percent text remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 750, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools-theme', 'dark');
  });
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.fontSize = '200%';
  });
  const background = await page.locator('.sch-card').first().evaluate(node => getComputedStyle(node).backgroundColor);
  const trustBackground = await page.locator('.sch-deadline-trust-row').first().evaluate(node => getComputedStyle(node).backgroundColor);
  expect(background).not.toBe('rgb(255, 255, 255)');
  expect(trustBackground).not.toBe('rgb(248, 250, 252)');
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test('interactive controls have accessible names and self-hosted type wins', async ({ page }) => {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  const unnamed = await page.locator('.tool-main button, .tool-main input, .tool-main select, .tool-main a[href], .scholarship-product-hero button, .scholarship-product-hero input, .scholarship-product-hero a[href]').evaluateAll(nodes =>
    nodes.filter(node => {
      if (node.hidden || node.type === 'hidden' || node.getAttribute('aria-hidden') === 'true' || !node.getClientRects().length) return false;
      const labels = node.labels ? Array.from(node.labels).map(label => label.textContent.trim()).join('') : '';
      return !(node.getAttribute('aria-label') || node.getAttribute('aria-labelledby') || labels || node.textContent.trim() || node.getAttribute('title'));
    }).length
  );
  expect(unnamed).toBe(0);
  const family = await page.locator('body').evaluate(node => getComputedStyle(node).fontFamily);
  expect(family).toContain('DM Sans');
});
