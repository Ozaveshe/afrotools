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


// Theme changes must keep enabled text readable immediately and on every frame.
// This appends to the existing native gate; the original 27 cases remain intact.
const immediateThemeInputs = [
  { route: '/ai/', selector: '#aiCommandInput', kind: 'AI' },
  { route: '/tools/employee-cost/', selector: '#employee-cost-currency', kind: 'Payroll' },
  { route: '/tools/cv-builder/', selector: 'input[placeholder="First Name"]', kind: 'CV' },
  { route: '/tools/solar-roi/nigeria/', selector: '#monthlyBill', kind: 'Solar' }
];

async function assertImmediateEnabledContrast(page, selector, theme) {
  const result = await page.evaluate(async ({ selector, theme }) => {
    const element = document.querySelector(selector);
    if (!element || element.disabled || element.getAttribute('aria-disabled') === 'true' || !element.getClientRects().length) throw new Error('Expected visible enabled control');
    if (!window.AfroTools?.darkMode?.set) throw new Error('Native theme setter unavailable');
    const rgba = value => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) throw new Error(`Unsupported computed color: ${value}`);
      const values = match[1].split(/[,\s/]+/).filter(Boolean).map(Number);
      if (values.slice(0, 3).some(value => !Number.isFinite(value))) throw new Error('Invalid computed color');
      return [values[0], values[1], values[2], values[3] ?? 1];
    };
    const luminance = value => value.map(component => {
      const scaled = component / 255;
      return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
    }).reduce((total, component, index) => total + component * [0.2126, 0.7152, 0.0722][index], 0);
    const sample = phase => {
      const style = getComputedStyle(element);
      const layers = [];
      let ancestor = element;
      while (ancestor) {
        const ancestorStyle = getComputedStyle(ancestor);
        if (ancestorStyle.backgroundImage !== 'none' || Number(ancestorStyle.opacity) !== 1) throw new Error('Selected control requires flat opaque compositing proof');
        const background = rgba(ancestorStyle.backgroundColor);
        layers.push(background);
        if (background[3] === 1) break;
        ancestor = ancestor.parentElement;
      }
      let composite = [255, 255, 255];
      for (const layer of layers.reverse()) composite = layer.slice(0, 3).map((component, index) => component * layer[3] + composite[index] * (1 - layer[3]));
      const foreground = rgba(style.color);
      const compositeForeground = foreground.slice(0, 3).map((component, index) => component * foreground[3] + composite[index] * (1 - foreground[3]));
      const first = luminance(compositeForeground);
      const second = luminance(composite);
      return { phase, theme: document.documentElement.dataset.theme, ratio: (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05), color: style.color, background: style.backgroundColor, composite, activeProperties: element.getAnimations().map(animation => animation.transitionProperty || animation.animationName || 'unknown') };
    };
    const samples = [sample('before theme change')];
    window.AfroTools.darkMode.set(theme);
    samples.push(sample('immediately after native token change'));
    const started = performance.now();
    do {
      await new Promise(requestAnimationFrame);
      samples.push(sample('every animation frame'));
    } while (performance.now() - started < 350);
    samples.push(sample('end of fixed observation window'));
    return { samples, enabled: !element.disabled && element.getAttribute('aria-disabled') !== 'true' };
  }, { selector, theme });
  expect(result.enabled).toBe(true);
  expect(result.samples.length).toBeGreaterThan(2);
  for (const sample of result.samples) expect(sample.ratio, JSON.stringify(sample)).toBeGreaterThanOrEqual(4.5);
  expect(result.samples.at(-1).theme).toBe(theme);
}

for (const width of [1365, 390, 320]) {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    for (const surface of immediateThemeInputs) {
      test(`${surface.kind} enabled input readable on every native theme frame ${width} ${reducedMotion}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: 'light', reducedMotion });
        await page.addInitScript(() => localStorage.setItem('aft_theme', 'light'));
        await page.goto(surface.route);
        if (surface.kind === 'CV') await page.getByRole('button', { name: 'Build My CV', exact: true }).first().click();
        const input = page.locator(surface.selector);
        await expect(input).toBeVisible();
        await expect(input).toBeEnabled();
        await input.fill(surface.kind === 'Payroll' ? 'NGN' : surface.kind === 'Solar' ? '10000' : surface.kind === 'CV' ? 'Audit' : 'Find a Nigeria VAT calculator');
        await input.focus();
        await expect(input).toBeFocused();
        for (const theme of ['dark', 'light']) await assertImmediateEnabledContrast(page, surface.selector, theme);
        await page.keyboard.press('Tab');
        expect(await input.evaluate(element => document.activeElement !== element)).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      });
    }

    test(`No-AI continuation enabled text and keyboard destination readable ${width} ${reducedMotion}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: 'light', reducedMotion });
      await page.addInitScript(() => localStorage.setItem('aft_theme', 'light'));
      await page.goto('/ai/');
      await page.locator('#aiCommandInput').fill('Find a Nigeria VAT calculator');
      await page.getByRole('button', { name: 'Find the right AfroTools tool', exact: true }).click();
      const link = page.locator('#aiContinueWithoutModel');
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', '/search/');
      await expect(link).toHaveAccessibleName('Continue browsing AfroTools without AI help');
      for (const interaction of ['normal', 'hover', 'keyboard-focus']) {
        await page.mouse.move(0, 0);
        await page.evaluate(() => document.activeElement?.blur());
        if (interaction === 'hover') await link.hover();
        if (interaction === 'keyboard-focus') {
          await link.focus();
          await page.keyboard.press('Tab');
          await page.keyboard.press('Shift+Tab');
          await expect(link).toBeFocused();
          const focus = await link.evaluate(element => ({ visible: element.matches(':focus-visible'), style: getComputedStyle(element).outlineStyle, width: parseFloat(getComputedStyle(element).outlineWidth) }));
          expect(focus.visible).toBe(true);
          expect(focus.style).not.toBe('none');
          expect(focus.width).toBeGreaterThanOrEqual(2);
        }
        for (const theme of ['dark', 'light']) await assertImmediateEnabledContrast(page, '#aiContinueWithoutModel', theme);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/search\/$/);
    });
  }
}
