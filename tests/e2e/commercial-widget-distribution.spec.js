const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async (text) => { window.copiedWidgetCode = text; } }
    });
  });
  // Keep proof local: no analytics, external fonts, or live lead submission.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1[:/])/, route => route.abort());
});

for (const width of [1280, 390]) {
  test('widget gallery keeps keyboard focus in preview and returns it on close at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/widgets/demo/');
    await page.locator('#widget-search').fill('Percentage Calculator');
    const preview = page.locator('[data-preview="percentage-calculator"]');
    await preview.focus();
    await page.keyboard.press('Enter');
    const close = page.locator('#modal-close');
    await expect(close).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('#modal-preview .aw-input').first()).toBeVisible();
    const last = page.locator('[data-copy-target="modal-iframe-code"]');
    await last.focus();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(last).toBeFocused();
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => window.copiedWidgetCode)).toContain('/widgets/iframe/financial-percentage-calculator.html');
    await page.keyboard.press('Escape');
    await expect(page.locator('#widget-modal')).toBeHidden();
    await expect(preview).toBeFocused();
    await preview.press('Enter');
    await close.click();
    await expect(preview).toBeFocused();
    await preview.press('Enter');
    await page.locator('#widget-modal').click({ position: { x: 2, y: 2 } });
    await expect(preview).toBeFocused();
    expect(errors).toEqual([]);
  });
}

test('preview fallback copy selects inside the dialog and restores keyboard focus', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.clipboard.writeText = async () => { throw new Error('Clipboard unavailable'); };
    document.execCommand = () => {
      window.fallbackCopyProof = {
        text: document.activeElement.value,
        insideDialog: Boolean(document.activeElement.closest('dialog[open]'))
      };
      return true;
    };
  });
  await page.goto('/widgets/demo/');
  await page.locator('#widget-search').fill('Percentage Calculator');
  await page.locator('[data-preview="percentage-calculator"]').click();
  const copy = page.locator('[data-copy-target="modal-script-code"]');
  await copy.click();
  await expect.poll(() => page.evaluate(() => window.fallbackCopyProof)).toEqual({
    text: '<div data-afrotools="percentage-calculator"></div>\n<script src="https://afrotools.com/widgets/embed.js" async></script>',
    insideDialog: true
  });
  await expect(copy).toBeFocused();
});

test('Widget Pro handoff preserves chosen widget and campaign attribution on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/widgets/?utm_source=synthetic&utm_medium=partner&utm_campaign=widget-proof&utm_content=paid');
  await page.locator('#widget-pro-choice').selectOption('percentage-calculator');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#widget-pro-request').click();
  await expect(page.locator('[name="requested_offer"]')).toHaveValue('widget_pro');
  await expect(page.locator('[name="relevant_tool"]')).toHaveValue('percentage-calculator');
  await expect(page.locator('[name="source_path"]')).toHaveValue('widgets');
  await expect(page.locator('[name="source_route"]')).toHaveValue('/widgets/');
  await expect(page.locator('[name="cta_type"]')).toHaveValue('widget-pro-request');
  for (const [field, value] of Object.entries({ utm_source: 'synthetic', utm_medium: 'partner', utm_campaign: 'widget-proof', utm_content: 'paid' })) {
    await expect(page.locator('[name="' + field + '"]')).toHaveValue(value);
  }
});

test('iframe calculator works locally and keeps its free backlink attribution', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/widgets/iframe/financial-percentage-calculator.html');
  const inputs = page.locator('#widget-root input');
  await inputs.nth(0).fill('25');
  await inputs.nth(1).fill('200');
  await page.getByRole('button', { name: 'Calculate', exact: true }).click();
  await expect(page.locator('#widget-root .aw-result-main').first()).toContainText('50');
  const backlink = new URL(await page.getByRole('link', { name: 'Powered by AfroTools' }).getAttribute('href'));
  expect(backlink.pathname).toBe('/tools/percentage-calc/');
  expect(backlink.searchParams.get('utm_source')).toBe('widget');
  expect(backlink.searchParams.get('utm_medium')).toBe('embed');
  expect(backlink.searchParams.get('utm_campaign')).toBe('percentage-calculator');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('legacy embed page points buyers to the gallery', async ({ page }) => {
  await page.goto('/embed/');
  await expect(page).toHaveURL(/\/widgets\/demo\/$/);
  await expect(page.locator('#widget-search')).toBeVisible();
});
