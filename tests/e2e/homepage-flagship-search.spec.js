const { test, expect } = require('@playwright/test');

test('English suggestions keep each flagship once and exact app names open the app', async ({ page }) => {
  await page.route('**/*', route => {
    const host = new URL(route.request().url()).hostname;
    return ['127.0.0.1', 'localhost'].includes(host) ? route.continue() : route.abort();
  });
  for (const app of ['AfroStream', 'AfroKitchen', 'AfroAtlas']) {
    await page.goto('/');
    await page.locator('#hero-search-input').fill(app);
    await expect(page.locator('#search-dropdown .sd-item').first()).toHaveAttribute('href', '/tools/' + app.toLowerCase() + '/');
    const links = await page.locator('#search-dropdown .sd-item').evaluateAll(items => items.map(item => item.getAttribute('data-href')));
    expect(new Set(links).size).toBe(links.length);
    expect(links.every(href => !/^\/(fr|sw|yo|ha)\//.test(href))).toBe(true);
    await page.locator('#hero-search-btn').click();
    await expect(page).toHaveURL(new RegExp('/tools/' + app.toLowerCase() + '/?$'));
  }
});

test('French suggestions stay in French without hiding distinct related workflows', async ({ page }) => {
  await page.goto('/?locale=fr');
  await page.locator('#hero-search-input').fill('AfroStream');
  await expect(page.locator('#search-dropdown .sd-item').first()).toBeVisible();
  const links = await page.locator('#search-dropdown .sd-item').evaluateAll(items => items.map(item => item.getAttribute('data-href')));
  expect(links.every(href => href.startsWith('/fr/'))).toBe(true);
  expect(new Set(links).size).toBe(links.length);
});


for (const locale of ['en', 'fr']) {
  test(locale + ' homepage suggestions keep keyboard selection current and stay dismissed', async ({ page }) => {
    await page.route('**/*', route => {
      const host = new URL(route.request().url()).hostname;
      return ['127.0.0.1', 'localhost'].includes(host) ? route.continue() : route.abort();
    });
    await page.goto(locale === 'fr' ? '/?locale=fr' : '/');
    const input = page.locator('#hero-search-input');
    const dropdown = page.locator('#search-dropdown');
    await input.fill('AfroStream');
    await expect(dropdown.locator('.sd-item').first()).toBeVisible();
    await input.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', 'sd-option-0');
    await input.fill('AfroKitchen');
    expect(await input.getAttribute('aria-activedescendant')).toBeNull();
    await expect(dropdown.locator('.sd-item').first()).toBeVisible();
    await expect(dropdown.locator('#sd-see-all')).toHaveAttribute('role', 'option');
    const entries = dropdown.locator('.sd-item, #sd-see-all');
    for (let index = 0; index < await entries.count(); index++) await input.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', 'sd-see-all');
    await expect(dropdown.locator('#sd-see-all')).toHaveAttribute('aria-selected', 'true');
    await input.press('Tab');
    await expect(page.locator('#hero-search-btn')).toBeFocused();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(await input.getAttribute('aria-activedescendant')).toBeNull();

    // Dismiss before the real 100ms input debounce can finish, then observe
    // longer than that delay. No synthetic selection state is installed.
    await input.focus();
    await input.fill('Afro');
    await input.press('Escape');
    await page.waitForTimeout(180);
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(dropdown.locator('.sd-item')).toHaveCount(0);
    await input.fill('AfroStream');
    await expect(dropdown.locator('.sd-item').first()).toBeVisible();
    await page.locator('h1').first().click();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });
}


test('first homepage search recovers when the real catalogue arrives after debounce', async ({ page }) => {
  let releaseRegistry;
  let markRequested;
  const registryGate = new Promise(resolve => { releaseRegistry = resolve; });
  const registryRequested = new Promise(resolve => { markRequested = resolve; });
  await page.route('**/*', route => {
    const host = new URL(route.request().url()).hostname;
    return ['127.0.0.1', 'localhost'].includes(host) ? route.continue() : route.abort();
  });
  await page.route('**/assets/js/components/tool-registry.min.js*', async route => {
    const host = new URL(route.request().url()).hostname;
    if (!['127.0.0.1', 'localhost'].includes(host)) return route.abort();
    markRequested();
    await registryGate;
    return route.continue();
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const input = page.locator('#hero-search-input');
    await input.fill('AfroKitchen');
    await registryRequested;
    await page.waitForTimeout(180);
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    releaseRegistry();
    await expect(page.locator('#search-dropdown .sd-item').first()).toHaveAttribute('href', '/tools/afrokitchen/');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
  } finally {
    releaseRegistry();
  }
});
