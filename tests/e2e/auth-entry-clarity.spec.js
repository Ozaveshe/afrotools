const { test, expect } = require('@playwright/test');

async function protectPublicAudit(page, testInfo, countryMode) {
  const origin = new URL(testInfo.project.use.baseURL).origin;
  let releaseCountry;
  const countryReady = new Promise(resolve => { releaseCountry = resolve; });
  const mutations = [];
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) {
      mutations.push({ path: url.pathname, method: request.method() });
      return route.abort();
    }
    if (url.pathname === '/assets/js/components/country-selector.js') {
      if (countryMode === 'unavailable') return route.abort();
      if (countryMode === 'delayed') await countryReady;
    }
    if (countryMode && url.pathname === '/assets/js/afro-auth.js') {
      return route.fulfill({ contentType: 'application/javascript', body: `window.AfroAuth = {
        onReady: callback => setTimeout(callback, 0),
        isLoggedIn: () => false,
        getUser: () => null,
        getSessionToken: () => null,
        signup: async (email, name, password, country) => {
          window.__testSignupCountry = country;
          return { ok: false, error: 'Synthetic signup withheld' };
        }
      };` });
    }
    if (url.href.includes('@supabase/supabase-js')) {
      return route.fulfill({ contentType: 'application/javascript', body: `window.supabase = { createClient: () => ({ auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
      } }) };` });
    }
    if (url.origin === origin || url.href.startsWith('https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/')) return route.continue();
    return route.abort();
  });
  await page.addInitScript(() => {
    localStorage.setItem('aft_theme', 'light');
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    window.AFROTOOLS_TEST_DISABLE_ANALYTICS = true;
  });
  return { releaseCountry, mutations };
}

async function expectSignupCountry(page, country) {
  // Exercise the real form controller with synthetic inputs and an in-page provider fixture.
  // The fixture records only the country and deliberately creates no account.
  await page.locator('#signupName').fill('Synthetic Cook');
  await page.locator('#signupEmail').fill('cook@afrotools.test');
  await page.locator('#signupPassword').fill('synthetic-fixture-123');
  await page.locator('#signupForm').getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.locator('#authStatus')).toHaveText('Synthetic signup withheld');
  expect(await page.evaluate(() => window.__testSignupCountry)).toBe(country);
}

test('late country registration replaces the fallback without a duplicate keyboard stop', async ({ page }, testInfo) => {
  const guard = await protectPublicAudit(page, testInfo, 'delayed');
  await page.goto('/auth/?mode=signup&next=/dashboard/', { waitUntil: 'commit' });
  await expect(page.locator('#signupName')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Country', exact: true })).toBeVisible();
  // Let the inline controller's original zero-delay check run before the deferred module arrives.
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
  await page.locator('#signupCountry').focus();
  guard.releaseCountry();
  const country = page.locator('#signupCountrySelector');
  await expect(country.getByRole('button', { name: 'Country for your tools', exact: true })).toBeVisible();
  await expect(page.locator('#signupCountryFallback')).toBeHidden();
  await expect(page.locator('#signupForm').getByRole('combobox')).toHaveCount(0);
  await expect(country.getByRole('button', { name: 'Country for your tools', exact: true })).toBeFocused();
  await page.locator('#signupName').focus();
  await page.keyboard.press('Tab');
  await expect(country.getByRole('button', { name: 'Country for your tools', exact: true })).toBeFocused();
  await page.keyboard.press('Space');
  await country.getByRole('searchbox', { name: 'Search countries', exact: true }).fill('Ghana');
  await country.getByRole('option', { name: /Ghana/ }).press('Enter');
  await expect(page.locator('#signupCountry')).toHaveValue('Ghana');
  await expect(country.getByRole('button', { name: 'Country for your tools', exact: true })).toBeFocused();
  expect(await page.locator('#signupForm').evaluate(form => new FormData(form).get('country'))).toBe('Ghana');
  await expectSignupCountry(page, 'Ghana');
  expect(guard.mutations).toEqual([]);
});

for (const choice of ['Ghana', 'Outside Africa']) {
  test(`late country registration preserves the earlier ${choice} choice`, async ({ page }, testInfo) => {
    const guard = await protectPublicAudit(page, testInfo, 'delayed');
    await page.goto('/auth/?mode=signup&next=/dashboard/', { waitUntil: 'commit' });
    const fallback = page.getByRole('combobox', { name: 'Country', exact: true });
    await expect(fallback).toBeVisible();
    await fallback.selectOption({ label: choice });
    guard.releaseCountry();
    await expect.poll(() => page.evaluate(() => !!customElements.get('afro-country-selector'))).toBe(true);
    await expect(fallback).toBeVisible();
    await expect(page.locator('#signupCountrySelector')).toBeHidden();
    await expect(fallback).toHaveValue(choice);
    await page.locator('#signupName').focus();
    await page.keyboard.press('Tab');
    await expect(fallback).toBeFocused();
    expect(await page.locator('#signupForm').evaluate(form => new FormData(form).get('country'))).toBe(choice);
    await expectSignupCountry(page, choice);
    expect(guard.mutations).toEqual([]);
  });
}

test('native country selection remains usable when the country module is unavailable', async ({ page }, testInfo) => {
  const guard = await protectPublicAudit(page, testInfo, 'unavailable');
  await page.goto('/auth/?mode=signup&next=/dashboard/');
  const fallback = page.getByRole('combobox', { name: 'Country', exact: true });
  await expect(fallback).toBeVisible();
  await page.locator('#signupName').focus();
  await page.keyboard.press('Tab');
  await expect(fallback).toBeFocused();
  await fallback.selectOption({ label: 'Ghana' });
  expect(await page.locator('#signupForm').evaluate(form => new FormData(form).get('country'))).toBe('Ghana');
  await expectSignupCountry(page, 'Ghana');
  await expect(page.locator('#signupCountrySelector').getByRole('button')).toHaveCount(0);
  expect(guard.mutations).toEqual([]);
});

async function expectReadableSelection(page) {
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(animation =>
    animation.playState === 'running' && Number.isFinite(animation.effect.getComputedTiming().endTime) &&
    (animation.effect.target?.checkVisibility?.({ contentVisibilityAuto: true, visibilityProperty: true }) ?? true)
  ).length)).toBe(0);
  const styles = await page.locator('.auth-tabs').evaluate(nav => {
    const active = getComputedStyle(nav.querySelector('[aria-current="page"]'));
    const inactive = getComputedStyle(nav.querySelector(':not([aria-current]).auth-tab'));
    const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const luminance = value => rgb(value).map(n => {
      const channel = n / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
    const contrast = (a, b) => {
      const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    return {
      activeBorder: active.borderBottomColor,
      inactiveBorder: inactive.borderBottomColor,
      indicatorContrast: contrast(active.borderBottomColor, active.backgroundColor),
      textContrast: contrast(active.color, active.backgroundColor)
    };
  });
  expect(styles.activeBorder).not.toBe(styles.inactiveBorder);
  expect(styles.indicatorContrast).toBeGreaterThanOrEqual(3);
  expect(styles.textContrast).toBeGreaterThanOrEqual(4.5);
}

for (const width of [320, 390, 1280]) {
  for (const systemTheme of ['light', 'dark']) {
    test(`account modes keep visible selection, history and accessibility at ${width}px on ${systemTheme} devices`, async ({ page }, testInfo) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ colorScheme: systemTheme, reducedMotion: 'reduce' });
      const guard = await protectPublicAudit(page, testInfo);
      const next = '/pro/apps/payroll/?view=runs';
      await page.goto('/auth/?mode=login&next=' + encodeURIComponent(next));
      await expect(page.locator('#signupCountrySelector .cs-trigger')).toBeAttached();
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      for (const theme of ['light', 'dark', 'light']) {
        if (await page.locator('html').getAttribute('data-theme') !== theme) {
          if (width < 768) await page.getByRole('button', { name: 'Open menu', exact: true }).click();
          await page.getByRole('button', { name: `Switch to ${theme} mode`, exact: true }).press('Space');
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
          if (width < 768) {
            await page.keyboard.press('Escape');
            await expect(page.getByRole('dialog', { name: 'Navigation menu', exact: true })).toBeHidden();
            await expect(page.locator('afro-navbar .mob')).toBeHidden();
          }
        }
        for (const mode of ['login', 'signup', 'reset']) {
          await page.locator(`[data-mode-link="${mode}"]`).press('Enter');
          await expect(page.locator(`[data-mode-panel="${mode}"]`)).toBeVisible();
          await expect(page.locator('[data-mode-link][aria-current="page"]')).toHaveCount(1);
          await expect(page.locator(`[data-mode-link="${mode}"]`)).toHaveAttribute('aria-current', 'page');
          await expect(page.locator(`[data-mode-panel="${mode}"] input:not([type="hidden"])`).first()).toBeFocused();
          expect(new URL(page.url()).searchParams.get('next')).toBe(next);
          await expectReadableSelection(page);
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const audit = await page.evaluate(async () => {
            const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
            return {
              violations: result.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })),
              incomplete: result.incomplete.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })),
              width: innerWidth, documentWidth: document.documentElement.scrollWidth
            };
          });
          await testInfo.attach(`${theme}-${mode}-accessibility`, { body: JSON.stringify(audit, null, 2), contentType: 'application/json' });
          expect(audit.violations).toEqual([]);
          expect(audit.documentWidth).toBeLessThanOrEqual(audit.width + 1);
        }
        await page.goBack();
        await expect(page.locator('#signupForm')).toBeVisible();
        await expectReadableSelection(page);
        await page.goForward();
        await expect(page.locator('#resetForm')).toBeVisible();
        await expectReadableSelection(page);
      }
      expect(guard.mutations).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}
