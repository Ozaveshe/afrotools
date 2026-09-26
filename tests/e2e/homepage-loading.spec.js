const { test, expect } = require('@playwright/test');

for (const width of [320, 390]) {
  test(`homepage signup prompt stays readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const prompt = page.locator('#signup-bar');
    await expect(prompt).toBeVisible();
    await expect(prompt.getByRole('link', { name: 'Sign up free' })).toBeVisible();
    const layout = await prompt.evaluate(bar => {
      const text = bar.querySelector('span');
      const link = bar.querySelector('a');
      return {
        textFits: text.scrollWidth <= text.clientWidth + 1,
        noOverlap: text.getBoundingClientRect().right <= link.getBoundingClientRect().left
      };
    });
    expect(layout.textFits).toBe(true);
    expect(layout.noOverlap).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('homepage content renders while the navbar script is still downloading', async ({ page, baseURL }) => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(baseURL).origin) return route.abort();
    if (url.pathname.endsWith('/navbar.min.js')) await pending;
    return route.continue();
  });
  try {
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.locator('#home-hero-title')).toBeVisible();
    await expect(page.locator('#hero-search-input')).toBeVisible();
  } finally {
    release();
  }
  await expect(page.locator('afro-navbar .logo-name')).toBeVisible();
});

for (const width of [390, 1280]) {
  test(`homepage reserves navbar space before its styles arrive at ${width}px`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: 844 });
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== new URL(baseURL).origin) return route.abort();
      if (/\/navbar(?:\.min|-language-switcher)?\.css$/.test(url.pathname)) await pending;
      return route.continue();
    });
    const navbar = page.locator('afro-navbar');
    const height = width <= 480 ? 62 : 64;
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(navbar.locator('nav')).toBeAttached();
      expect(await navbar.evaluate(el => el.getBoundingClientRect().height)).toBe(height);
      expect(await page.locator('#home-hero-title').evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(844);
    } finally {
      release();
    }
    await expect(navbar).toHaveAttribute('data-styles-ready', '');
    expect(await navbar.evaluate(el => el.getBoundingClientRect().height)).toBe(height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (width <= 480) {
      await navbar.locator('.burger').click();
      await expect(navbar.locator('.mob.open')).toBeVisible();
      await expect(navbar.locator('.burger')).toHaveAttribute('aria-expanded', 'true');
    } else {
      await navbar.locator('#langBtn').click();
      await expect(navbar.locator('#langDrop')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(navbar.locator('#langDrop')).toBeHidden();
    }
  });
}
