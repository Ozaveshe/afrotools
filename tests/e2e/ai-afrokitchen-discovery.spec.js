const { test, expect } = require('@playwright/test');
const noMatchDecision = require('../../assets/js/ai/intent-router.js').routeDeterministically('purple moon bicycle');

for (const width of [320, 1366]) {
  for (const routerStatus of [200, 503]) {
  test(`homepage recipe query reaches the cookbook at ${width}px with router ${routerStatus}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    const routerRequests = [];
    const providerCalls = [];
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (/\/(?:api|\.netlify\/functions)\/.*(?:ai|router)/.test(url.pathname)) {
        if (url.pathname.endsWith('/ai-route-intent')) routerRequests.push(route.request().postDataJSON());
        else providerCalls.push(url.pathname);
        return route.fulfill({ status: routerStatus, contentType: 'application/json', body: JSON.stringify({ ok: routerStatus === 200, source: 'deterministic', decision: noMatchDecision }) });
      }
      if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.fulfill({ body: '' });
      return route.continue();
    });
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Describe what you would like to do', exact: true }).fill('jollof rice recipe');
    await page.getByRole('button', { name: 'Find my tool', exact: true }).click();
    await expect(page).toHaveURL(/\/ai\/\?source=homepage_input/);
    await expect(page.locator('#aiCommandInput')).toHaveValue('jollof rice recipe');
    const card = page.locator('#aiResultCards [data-workflow-card]').first();
    await expect(card).toContainText(/AfroKitchen/i);
    await expect(card.locator('[data-open-tool]')).toHaveAttribute('href', /^\/tools\/afrokitchen\/\?/);
    await expect(page.locator('#aiNoMatchState')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    expect(providerCalls).toEqual([]);
    expect(routerRequests.length).toBeGreaterThan(0);
    expect(routerRequests.every(request => request.consentToModel === false)).toBe(true);
    await card.locator('[data-open-tool]').click();
    await expect(page).toHaveURL(/\/tools\/afrokitchen\//);
    expect(page.url()).not.toContain('jollof');
    await expect(page.locator('#recipes-grid .ak-recipe-card')).toHaveCount(12);
  });
  }
}

for (const theme of ['light', 'dark']) {
  test(`recipe result metadata has readable ${theme} contrast`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.addInitScript(theme => {
      localStorage.setItem('aft_theme', theme);
      localStorage.setItem('afrotools_cookie_consent', 'declined');
    }, theme);
    await page.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.fulfill({ body: '' }));
    await page.goto('/tools/afrokitchen/');
    await expect(page.locator('#recipes-grid .ak-recipe-card')).toHaveCount(12);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const failures = await page.evaluate(async () => (await axe.run({ include: ['#recipes-grid'] }, { runOnly: ['color-contrast'] })).violations);
    expect(failures.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
  });
}
