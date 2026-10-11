const { test, expect } = require('@playwright/test');

const routes = ['/', '/fr/', '/sw/', '/ha/', '/yo/'];

for (const width of [320, 375, 390, 430]) {
  test(`mobile navbar keeps the wordmark visible and menu right-aligned at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const navbar = page.locator('afro-navbar');
    await expect(navbar).toBeVisible();
    await expect(navbar.locator('.logo-mark')).toBeVisible();
    await expect(navbar.locator('.logo-name')).toBeVisible();
    await expect(navbar.locator('.logo-name')).toContainText('AFROTOOLS');
    await expect(navbar.locator('.burger')).toBeVisible();

    const layout = await navbar.evaluate((host) => {
      const root = host.shadowRoot;
      const burger = root.querySelector('.burger').getBoundingClientRect();
      const inner = root.querySelector('.inner').getBoundingClientRect();
      const right = root.querySelector('.right').getBoundingClientRect();
      const logo = root.querySelector('.logo').getBoundingClientRect();
      return {
        burgerWidth: burger.width,
        rightWidth: right.width,
        rightGap: Math.round(inner.right - burger.right),
        overlap: logo.right > burger.left,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    expect(layout.burgerWidth).toBeGreaterThanOrEqual(44);
    expect(layout.rightWidth).toBe(44);
    expect(layout.rightGap).toBeLessThanOrEqual(1);
    expect(layout.overlap).toBe(false);
    expect(layout.overflow).toBeLessThanOrEqual(1);

    await navbar.locator('.burger').click();
    await expect(navbar.locator('.mob.open')).toBeVisible();
    await expect(navbar.locator('.burger')).toHaveAttribute('aria-expanded', 'true');
  });
}

test('localized mobile headers preserve the same brand and menu contract', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  for (const route of routes) {
    await page.goto(route);
    const navbar = page.locator('afro-navbar');
    await expect(navbar.locator('.logo-mark')).toBeVisible();
    await expect(navbar.locator('.logo-name')).toBeVisible();
    const rightGap = await navbar.evaluate((host) => {
      const root = host.shadowRoot;
      const burger = root.querySelector('.burger').getBoundingClientRect();
      const inner = root.querySelector('.inner').getBoundingClientRect();
      return Math.round(inner.right - burger.right);
    });
    expect(rightGap).toBeLessThanOrEqual(1);
  }
});

test('mobile menu returns focus to its trigger on Escape and still closes by trigger', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const navbar = page.locator('afro-navbar');
  const burger = navbar.locator('.burger');
  const menu = navbar.locator('.mob');
  const theme = navbar.locator('#mobThemeToggle');

  await burger.focus();
  await burger.press('Enter');
  await expect(menu).toBeVisible();
  await expect(burger).toHaveAttribute('aria-expanded', 'true');
  await theme.focus();
  await expect(theme).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(menu).toHaveAttribute('aria-hidden', 'true');
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await expect(burger).toBeFocused();

  await burger.click();
  await expect(menu).toBeVisible();
  await burger.click();
  await expect(menu).toBeHidden();
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
});

for (const route of ['/', '/ha/', '/yo/']) {
  test(`mobile dialog contains keyboard focus and releases it on close: ${route}`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 740 });
      await page.goto(route);
      const navbar = page.locator('afro-navbar');
      const burger = navbar.locator('.burger');
      const close = navbar.locator('#mobClose');
      const last = navbar.locator('.mob-login');
      await burger.focus();
      await burger.press('Enter');
      await expect(close).toBeFocused();
      await expect(close).toHaveAccessibleName(({ '/': 'Close menu', '/ha/': 'Rufe jerin zaɓi', '/yo/': 'Pa àkójọ aṣàyàn' })[route]);
      await close.press('Shift+Tab');
      await expect(last).toBeFocused();
      await last.press('Tab');
      await expect(close).toBeFocused();
      await close.press('Tab');
      await expect(navbar.locator('.mob-search-input')).toBeFocused();

      const country = navbar.locator('.mob afro-country-selector');
      await country.locator('.cs-trigger').focus();
      await country.locator('.cs-trigger').press('Enter');
      await expect(country.locator('.cs-search')).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(country.locator('.cs-panel')).toBeHidden();
      await expect(navbar.locator('.mob')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(burger).toBeFocused();
      await expect(navbar.locator('.mob')).toBeHidden();

      await burger.press('Enter');
      await expect(close).toBeFocused();
      await close.press('Space');
      await expect(burger).toBeFocused();
      await expect(navbar.locator('.mob')).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    await burgerForResize(page);
  });
}

async function burgerForResize(page) {
  const navbar = page.locator('afro-navbar');
  await navbar.locator('.burger').click();
  await expect(navbar.locator('#mobClose')).toBeFocused();
  await page.setViewportSize({ width: 1200, height: 900 });
  await expect(navbar.locator('.mob')).toBeHidden();
  await expect(navbar.locator('.logo')).toBeFocused();
  expect(await page.evaluate(() => document.body.style.position)).not.toBe('fixed');
}
