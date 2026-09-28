const { test, expect } = require('@playwright/test');

async function expectReadableText(locator) {
  const contrast = await locator.evaluate(element => {
    const rgba = color => {
      const values = color.match(/[\d.]+/g).map(Number);
      return [values[0], values[1], values[2], values.length > 3 ? values[3] : 1];
    };
    const layers = [];
    for (let node = element; node; node = node.parentElement) {
      const color = rgba(getComputedStyle(node).backgroundColor);
      layers.push(color);
      if (color[3] === 1) break;
    }
    let background = [255, 255, 255];
    layers.reverse().forEach(color => { background = color.slice(0, 3).map((channel, i) => channel * color[3] + background[i] * (1 - color[3])); });
    const luminance = rgb => rgb.map(value => {
      const normalized = value / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
    }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
    const foreground = luminance(rgba(getComputedStyle(element).color).slice(0, 3));
    const surface = luminance(background);
    return (Math.max(foreground, surface) + 0.05) / (Math.min(foreground, surface) + 0.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
}

async function openFixtureWorkspace(page, context, baseURL, theme) {
  await context.addCookies([{ name: 'afrotools_test_session', value: 'valid', url: baseURL }]);
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(baseURL).origin) return route.abort();
    if (url.pathname === '/api/favorites') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({
        data: ['ng-paye', 'ke-paye'].map(tool_id => ({ tool_id, created_at: '2026-09-28T00:00:00Z' }))
      }) });
    }
    if (url.pathname.startsWith('/api/') && url.pathname !== '/api/auth/session') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({
        data: [], profile: { country: 'NG' }, rates: {}, countries: [], alerts: []
      }) });
    }
    return route.continue();
  });
  await page.addInitScript(({ theme }) => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.setItem('aft_theme', theme);
    localStorage.setItem('afro_favs_v2', JSON.stringify(['ng-paye', 'ke-paye']));
    localStorage.setItem('afrotools-saved-ng-salary-tax', JSON.stringify([{
      id: 'workspace-test-estimate', title: 'Planning example',
      createdAt: '2026-09-28T00:00:00Z', updatedAt: '2026-09-28T00:00:00Z',
      data: { version: 2, toolSlug: 'ng-paye', toolName: 'Nigeria PAYE', currency: 'NGN', snapshot: { netMonthly: 400000 } }
    }]));
    localStorage.setItem('afro_fp_list', JSON.stringify([{ id: 'workspace-test-plan', name: 'Example floor plan', rooms: 2, area: 20 }]));
  }, { theme });
  await page.goto('/dashboard/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-dashboard-auth-state', 'signedIn', { timeout: 20000 });
  // Wait for the real account-backed renderer, then exercise its normal refresh.
  await expect(page.locator('.workspace-fav-item')).toHaveCount(2, { timeout: 20000 });
  await page.evaluate(() => window.renderMyWorkspace({ activeTab: 'ws-favs' }));
  await expect(page.locator('.workspace-fav-item')).toHaveCount(2);
}

for (const width of [320, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`workspace tabs preserve saved flows and keyboard access at ${width}px ${theme}`, async ({ page, context, baseURL }, testInfo) => {
      await page.setViewportSize({ width, height: 820 });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await openFixtureWorkspace(page, context, baseURL, theme);
      const workspace = page.locator('#myWorkspaceContent');
      const tabs = workspace.getByRole('tab');
      const tools = workspace.locator('[data-ws="ws-favs"]');
      const calculations = workspace.locator('[data-ws="ws-history"]');
      const plans = workspace.locator('[data-ws="ws-plans"]');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(workspace.getByRole('tablist', { name: 'My workspace' })).toHaveAttribute('aria-orientation', 'horizontal');
      await expect(tabs).toHaveCount(3);
      await expect(tools).toHaveAttribute('tabindex', '0');
      await expect(calculations).toHaveAttribute('tabindex', '-1');
      await expect(plans).toHaveAttribute('tabindex', '-1');
      await expect(workspace.locator('.workspace-overview-title')).toHaveText('4 active workspace items');
      await expectReadableText(workspace.locator('.workspace-fav-title').first());
      await tools.focus();
      await page.keyboard.press('ArrowRight');
      await expect(calculations).toBeFocused();
      await expect(calculations).toHaveAttribute('aria-selected', 'true');
      await expect(tools).toHaveAttribute('aria-selected', 'false');
      await expect(workspace.locator('#ws-history')).toBeVisible();
      await expect(workspace.locator('#ws-favs')).toBeHidden();
      await expect(workspace.locator('#ws-history')).toHaveAttribute('role', 'tabpanel');
      await expect(workspace.locator('#ws-history')).toHaveAttribute('aria-labelledby', await calculations.getAttribute('id'));
      await expect(calculations).toHaveAttribute('aria-controls', 'ws-history');
      await expect(workspace.getByRole('link', { name: 'Open scenario' })).toHaveAttribute('href', /saved_calc=workspace-test-estimate/);
      await expect(workspace.locator('.workspace-scenario-value')).toContainText('400,000');
      await expect(calculations.locator('.ws-tab-count')).toHaveText('1');
      await expectReadableText(workspace.locator('.workspace-scenario-title'));
      await expectReadableText(workspace.locator('.workspace-scenario-value'));
      await expectReadableText(workspace.locator('.workspace-scenario-meta'));
      await expectReadableText(workspace.getByRole('link', { name: 'Open scenario' }));
      await page.keyboard.press('End');
      await expect(plans).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect(tools).toBeFocused();
      await page.keyboard.press('ArrowLeft');
      await expect(plans).toBeFocused();
      await page.keyboard.press('Home');
      await expect(tools).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(tools).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(workspace.locator('#ws-favs')).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(tools).toBeFocused();
      // Clicks and background refreshes must keep the same selection semantics.
      await calculations.click();
      await page.evaluate(() => window.renderMyWorkspace({ activeTab: 'ws-history' }));
      await expect(calculations).toHaveAttribute('aria-selected', 'true');
      await expect(calculations).toHaveAttribute('tabindex', '0');
      await expect(workspace.locator('#ws-history')).toHaveAttribute('aria-labelledby', 'dashboard-tab-ws-history');
      await expect(workspace.locator('#ws-history')).toBeVisible();
      await calculations.focus();
      // Return through keyboard input so :focus-visible is active after the
      // preceding mouse click and refresh, which correctly use pointer focus.
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowLeft');
      await expect(calculations).toBeFocused();
      const focusStyle = await calculations.evaluate(tab => {
        const style = getComputedStyle(tab);
        return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
      });
      expect(focusStyle.width).toBeGreaterThanOrEqual(2);
      expect(focusStyle.style).not.toBe('none');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
      if (process.env.AFROTOOLS_DASHBOARD_SCREENSHOTS === '1') {
        await workspace.screenshot({ path: testInfo.outputPath(`workspace-${width}-${theme}.png`) });
      }
      // An empty lane still needs a place to read its instructions after Tab.
      await page.evaluate(async () => {
        localStorage.setItem('afrotools-saved-ng-salary-tax', '[]');
        await window.renderMyWorkspace({ activeTab: 'ws-history' });
      });
      await expect(workspace.locator('#ws-history')).toContainText('No saved calculations yet');
      await expect(calculations.locator('.ws-tab-count')).toHaveText('0');
      await calculations.focus();
      await page.keyboard.press('Tab');
      await expect(workspace.locator('#ws-history')).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(calculations).toBeFocused();
    });
  }
}
