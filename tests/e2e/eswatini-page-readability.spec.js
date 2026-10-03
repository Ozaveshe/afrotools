const { test, expect } = require('@playwright/test');

async function settleRenderedContent(page) {
  // Visit deferred sections so theme transitions finish before the whole-page
  // audit reads them. Hidden disclosures can retain pending Firefox animations.
  for (const section of await page.locator('section, main, article, aside').all()) {
    if (await section.evaluate(element => getComputedStyle(element).contentVisibility === 'auto')) {
      await section.scrollIntoViewIfNeeded();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    }
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect.poll(() => page.evaluate(() => {
    const roots = [document];
    for (let index = 0; index < roots.length; index++) {
      for (const element of roots[index].querySelectorAll('*')) {
        if (element.shadowRoot) roots.push(element.shadowRoot);
      }
    }
    const animations = new Set(roots.flatMap(root => root.getAnimations()));
    return [...animations].filter(animation =>
      animation.playState === 'running' && Number.isFinite(animation.effect.getComputedTiming().endTime) &&
      (animation.effect.target?.checkVisibility?.({ contentVisibilityAuto: true, visibilityProperty: true }) ?? true)
    ).length;
  })).toBe(0);
}

for (const width of [320, 1280]) {
  test(`Eswatini FAQ label stays above its heading with normal motion at ${width}px`, async ({ page }, testInfo) => {
    const errors = [], writes = [], origin = new URL(testInfo.project.use.baseURL).origin;
    page.on('pageerror', error => errors.push({ name: error.name, message: error.message }));
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
    await page.route('**/*', handler => {
      const request = handler.request(), url = new URL(request.url());
      if (!['GET', 'HEAD'].includes(request.method())) {
        writes.push({ path: url.pathname, method: request.method() });
        return handler.abort();
      }
      return url.origin === origin || url.hostname === 'cdnjs.cloudflare.com'
        ? handler.continue() : handler.fulfill({ status: 204, body: '' });
    });
    await page.addInitScript(() => {
      localStorage.setItem('aft_theme', 'dark');
      localStorage.setItem('afrotools_cookie_consent', 'declined');
    });
    await page.goto('/eswatini/sz-paye');
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const heading = page.getByRole('heading', { name: 'Common PAYE Questions', exact: true });
    for (const theme of ['dark', 'light']) {
      await selectTheme(page, theme, width);
      await heading.scrollIntoViewIfNeeded();
      const geometry = await page.locator('.ng-faq-header').evaluate(header => {
        const label = header.querySelector('.eyebrow'), title = header.querySelector('.ng-faq-title');
        return { labelBottom: label.getBoundingClientRect().bottom, titleTop: title.getBoundingClientRect().top, opacity: getComputedStyle(label).opacity };
      });
      expect(geometry.opacity).toBe('1');
      expect(geometry.labelBottom).toBeLessThanOrEqual(geometry.titleTop);
      await checkPage(page, theme, testInfo);
      await heading.scrollIntoViewIfNeeded();
      const settledGeometry = await page.locator('.ng-faq-header').evaluate(header => ({
        labelBottom: header.querySelector('.eyebrow').getBoundingClientRect().bottom,
        titleTop: header.querySelector('.ng-faq-title').getBoundingClientRect().top,
        opacity: getComputedStyle(header.querySelector('.eyebrow')).opacity
      }));
      expect(settledGeometry.opacity).toBe('1');
      expect(settledGeometry.labelBottom).toBeLessThanOrEqual(settledGeometry.titleTop);
    }
    expect(errors).toEqual([]);
    expect(writes).toEqual([]);
  });
}

async function selectTheme(page, theme, width) {
  if (await page.locator('html').getAttribute('data-theme') === theme) return;
  if (width === 320) await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.getByRole('button', { name: `Switch to ${theme} mode`, exact: true }).click();
  if (width === 320) {
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Navigation menu', exact: true })).not.toBeVisible();
  }
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}

async function checkPage(page, theme, testInfo) {
  await settleRenderedContent(page);
  const audit = await page.evaluate(() => window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
  }));
  await testInfo.attach(`${theme}-accessibility`, {
    body: JSON.stringify(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, failureSummary: n.failureSummary })) })), null, 2),
    contentType: 'application/json'
  });
  expect(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, failureSummary: n.failureSummary })) }))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

for (const systemTheme of ['light', 'dark']) {
  for (const width of [320, 1280]) {
    test(`Eswatini full-page readability at ${width}px on a ${systemTheme} device`, async ({ page }, testInfo) => {
      const errors = [], writes = [];
      page.on('pageerror', error => errors.push({ name: error.name, message: error.message }));
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: systemTheme, reducedMotion: 'reduce' });
      const origin = new URL(testInfo.project.use.baseURL).origin;
      await page.route('**/*', handler => {
        const request = handler.request(), url = new URL(request.url());
        if (!['GET', 'HEAD'].includes(request.method())) {
          writes.push({ path: url.pathname, method: request.method() });
          return handler.abort();
        }
        return url.origin === origin || url.hostname === 'cdnjs.cloudflare.com'
          ? handler.continue() : handler.fulfill({ status: 204, body: '' });
      });
      await page.addInitScript(() => {
        localStorage.setItem('aft_theme', 'dark');
        localStorage.setItem('afrotools_cookie_consent', 'declined');
      });
      await page.goto('/eswatini/sz-paye');
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      for (const theme of ['dark', 'light']) {
        await selectTheme(page, theme, width);
        await checkPage(page, theme, testInfo);
      }
      await selectTheme(page, 'dark', width);
      const pension = page.getByRole('button', { name: /ENPF Pension/ });
      await page.locator('.preset-btn').last().focus();
      await page.keyboard.press('Tab');
      await expect(pension).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(pension).toHaveAttribute('aria-pressed', 'false');
      await checkPage(page, 'dark-pension-off', testInfo);
      await pension.focus();
      await page.keyboard.press('Space');
      await expect(pension).toHaveAttribute('aria-pressed', 'true');
      await selectTheme(page, 'light', width);
      await page.locator('#grossSalary').fill('600000');
      await page.getByRole('button', { name: 'Calculate My Take-Home Pay →', exact: true }).click();
      await expect(page.locator('#resultsCard')).toBeVisible();
      await expect(page.locator('#resAmount')).toContainText('426,971');
      expect(await page.evaluate(() => ({ gross: RESULT.gross, net: RESULT.netAnnual }))).toEqual({ gross: 600000, net: 426971.4 });
      await expect.poll(() => page.evaluate(() => !!window.Chart?.getChart(document.getElementById('mainChart')))).toBe(true);
      for (const theme of ['light', 'dark', 'light']) {
        await selectTheme(page, theme, width);
        await expect(page.locator('#resAmount')).toContainText('426,971');
        await checkPage(page, theme, testInfo);
      }
      await page.getByRole('button', { name: 'Monthly', exact: true }).click();
      await expect(page.locator('.res-hero-label')).toHaveText('Monthly Take-Home Pay');
      await expect(page.locator('#resAmount')).toContainText('35,581');
      await page.getByRole('button', { name: 'Net → Gross', exact: true }).click();
      await page.locator('#grossSalary').fill('426971');
      await page.getByRole('button', { name: 'Find Required Gross Salary →', exact: true }).click();
      await expect(page.locator('#resAmount')).toContainText('50,000');
      expect(await page.evaluate(() => Math.abs(RESULT.gross - 600000))).toBeLessThan(2);
      await page.getByRole('button', { name: 'Gross → Net', exact: true }).click();
      await page.getByRole('button', { name: 'Annual', exact: true }).click();
      await selectTheme(page, 'dark', width);
      const preset = page.getByRole('button', { name: 'E 400k', exact: true });
      await preset.click();
      await expect(preset).toHaveClass(/active/);
      await expect(page.locator('#resAmount')).toContainText('292,971');
      await checkPage(page, 'dark-preset', testInfo);
      for (const name of ['Tax Bands', 'Employer Cost', 'Breakdown']) {
        const tab = page.getByRole('button', { name, exact: true });
        await tab.click();
        await expect(tab).toHaveClass(/on/);
        expect(await tab.evaluate(el => ({ background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }))).toEqual({ background: 'rgb(23, 37, 84)', color: 'rgb(255, 255, 255)' });
        await expect(page.locator('#resAmount')).toContainText('292,971');
        await checkPage(page, `dark-${name}`, testInfo);
      }
      const selectedPaint = await preset.evaluate(el => ({ background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }));
      expect(selectedPaint).toEqual({ background: 'rgb(23, 37, 84)', color: 'rgb(255, 255, 255)' });
      expect(errors).toEqual([]);
      expect(writes).toEqual([]);
    });
  }
}
