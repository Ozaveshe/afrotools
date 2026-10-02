const { test, expect } = require('@playwright/test');
const fs = require('fs');
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const surfaces = [
  { route: '/', selectors: ['.home-quick-start__heading p', '.mk-lbl', '.mk-val.neg', '.ad-tb-btn'], shadow: [['afro-navbar', '.logo-name b'], ['#homeCountrySelector', '.cs-flag-fallback']] },
  { route: '/nigeria/', selectors: ['.country-intelligence__score > span', '.country-intelligence__freshness-item dt', '.country-intelligence__legend > span', '.country-intelligence__link-freshness'], shadow: [['afro-navbar', '.logo-name b']] },
  { route: '/ghana/', selectors: ['.country-intelligence__link-freshness'], shadow: [['afro-navbar', '.logo-name b']] },
  { route: '/sw/zana/hatari-ya-ukame/', selectors: ['.sw-climate-hero h1'], shadow: [['afro-navbar', '.logo-name b']] }
];

test.beforeEach(async ({ context, baseURL }) => {
  await context.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await context.route('**/*', request => {
    const allowed = new URL(request.request().url()).origin === new URL(baseURL).origin;
    return allowed && ['GET', 'HEAD', 'OPTIONS'].includes(request.request().method()) ? request.continue() : request.abort();
  });
});

for (const width of [1365, 390, 320]) {
  for (const theme of ['light', 'dark']) {
    for (const surface of surfaces) {
      test(`${surface.route} readable shared labels ${width} ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: theme });
        await page.addInitScript(value => localStorage.setItem('aft_theme', value), theme);
        await page.goto(surface.route);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        for (const selector of surface.selectors) {
          // The decorative workflow previews are intentionally hidden below 768px.
          // Keep their markup present; their readability is exercised on desktop.
          if (surface.route === '/' && width < 768 && ['.mk-lbl', '.mk-val.neg', '.ad-tb-btn'].includes(selector)) {
            await expect(page.locator(selector).first()).toBeAttached();
          } else await expect(page.locator(selector).first()).toBeVisible();
        }
        for (const [host, selector] of surface.shadow) await expect(page.locator(host).locator(selector).first()).toBeVisible();
        await page.addScriptTag({ content: axe });
        const result = await page.evaluate(async ({ selectors, shadow }) => {
          const elements = selectors.flatMap(selector => [...document.querySelectorAll(selector)]);
          for (const [host, selector] of shadow) elements.push(...document.querySelector(host).shadowRoot.querySelectorAll(selector));
          const audit = await axe.run({ include: elements }, { runOnly: { type: 'rule', values: ['color-contrast'] } });
          return { testedNodes: elements.length, violations: audit.violations.map(row => ({ id: row.id, nodes: row.nodes.map(node => ({ target: node.target, message: node.failureSummary })) })) };
        }, surface);
        expect(result.testedNodes).toBeGreaterThan(0);
        expect(result.violations).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      });
    }
  }

  test(`Payroll guest prompt stays keyboard reachable while workspace is locked ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/pro/apps/payroll/');
    await expect(page.locator('html')).toHaveAttribute('data-pro-gate', 'locked');
    const table = page.getByRole('region', { name: 'Recent payroll runs table' });
    expect(await table.evaluate(element => !!element.closest('[inert]'))).toBe(true);
    const prompt = page.locator('#afro-pro-lock');
    await expect(prompt).toBeVisible();
    expect(await prompt.evaluate(element => !!element.closest('[inert]'))).toBe(false);
    const signIn = prompt.getByRole('link', { name: 'Sign in', exact: true });
    await signIn.focus();
    await expect(signIn).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(prompt.getByRole('link', { name: 'View Pro', exact: true })).toBeFocused();
    await expect(signIn).toHaveAttribute('href', /\/auth\/\?mode=login&intent=pro&next=/);
    await expect(prompt.getByRole('link', { name: 'View Pro', exact: true })).toHaveAttribute('href', /\/pro\/\?next=/);
    await page.addScriptTag({ content: axe });
    const violations = await page.evaluate(async () => {
      const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
      return result.violations.map(row => ({ id: row.id, targets: row.nodes.map(node => node.target) }));
    });
    expect(violations).toEqual([]);
  });
}
