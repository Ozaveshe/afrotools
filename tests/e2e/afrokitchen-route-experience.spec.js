const { test, expect } = require('@playwright/test');

async function clickSettledControl(page, control) {
  await expect(control).toBeVisible();
  await expect(control).toBeEnabled();
  await control.scrollIntoViewIfNeeded();
  const viewport = page.viewportSize();
  await page.mouse.move(viewport.width - 2, viewport.height / 2);
  let previous = '', settled = 0;
  await expect.poll(async () => {
    const state = await control.evaluate(node => {
      const rect = node.getBoundingClientRect();
      const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
      let hit = document.elementFromPoint(x, y);
      while (hit && hit.shadowRoot) {
        const child = hit.shadowRoot.elementFromPoint(x, y);
        if (!child || child === hit) break;
        hit = child;
      }
      return { bounds: [scrollY, rect.top, rect.left, rect.width, rect.height].map(value => value.toFixed(1)), visible: rect.top >= 0 && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth, hit: hit === node || node.contains(hit) };
    });
    const position = JSON.stringify(state.bounds);
    settled = state.visible && state.hit && position === previous ? settled + 1 : 0;
    previous = position;
    return settled >= 4;
  }, { intervals: [100] }).toBe(true);
  await control.evaluate(node => {
    node.setAttribute('data-ak-test-click', 'pending');
    node.addEventListener('click', event => node.setAttribute('data-ak-test-click', event.isTrusted ? 'trusted' : 'untrusted'), { once: true });
  });
  const bounds = await control.boundingBox();
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect(control).toHaveAttribute('data-ak-test-click', 'trusted');
}

async function keepRequestsLocal(page, baseURL) {
  const allowedOrigin = new URL(baseURL).origin;
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    return url.origin === allowedOrigin && ['GET', 'HEAD'].includes(request.method()) ? route.continue() : route.abort();
  });
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test('recipe pages put cooking first and preserve serving controls on a phone', async ({ page, baseURL }) => {
  await keepRequestsLocal(page, baseURL);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools/afrokitchen/recipes/jollof-rice-ng/');
  await expect(page.getByRole('heading', { name: 'Jollof Rice', exact: true, level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start cooking' })).toBeVisible();
  const positions = await page.evaluate(() => ({
    cook: document.querySelector('#recipe-ingredients').offsetTop,
    context: document.querySelector('.ak-static-summary-shell').offsetTop,
    hero: document.querySelector('.ak-hero').getBoundingClientRect().height
  }));
  expect(positions.cook).toBeLessThan(positions.context);
  expect(positions.hero).toBeLessThan(850);
  await clickSettledControl(page, page.getByRole('link', { name: 'Start cooking' }));
  await expect(page).toHaveURL(/#recipe-ingredients$/);
  await expect(page.locator('#ak-static-servings')).toHaveText('6');
  await clickSettledControl(page, page.getByRole('button', { name: 'Increase servings' }));
  await expect(page.locator('#ak-static-servings')).toHaveText('7');
  await expect(page.locator('#ak-static-ingredients')).toContainText('ingredients checked');
  await expectNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 320, height: 720 });
  await expectNoHorizontalOverflow(page);
  const servingTargets = await page.locator('.ak-servings-btn').evaluateAll(buttons =>
    buttons.map(button => button.getBoundingClientRect().width));
  servingTargets.forEach(width => expect(width).toBeGreaterThanOrEqual(44));
});

test('country and collection hubs reach their recipes before editorial panels', async ({ page, baseURL }) => {
  await keepRequestsLocal(page, baseURL);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [route, link, archive] of [
    ['/tools/afrokitchen/countries/nigeria/', 'See Nigeria recipes', '#country-recipes'],
    ['/tools/afrokitchen/collections/quick-and-easy/', 'See recipes', '#collection-recipes']
  ]) {
    await page.goto(route);
    await expect(page.getByRole('link', { name: link, exact: true })).toBeVisible();
    await clickSettledControl(page, page.locator('.ak-hero-more summary'));
    await expect(page.locator('.ak-hero-more')).toHaveAttribute('open', '');
    await clickSettledControl(page, page.getByRole('link', { name: link, exact: true }));
    await expect(page).toHaveURL(new RegExp(`${archive}$`));
    await expect(page.locator(`${archive} .ak-static-recipe-card`).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
  const order = await page.evaluate(() => ({
    archive: document.querySelector('#collection-recipes').offsetTop,
    extras: document.querySelector('.ak-collection-best-panel').offsetTop
  }));
  expect(order.archive).toBeLessThan(order.extras);
});

test('submission form stays accessible and dark recipe panels remain readable', async ({ page, baseURL }) => {
  await keepRequestsLocal(page, baseURL);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools/afrokitchen/submit');
  await expect(page.getByRole('link', { name: 'Start your recipe' })).toBeVisible();
  await clickSettledControl(page, page.getByRole('link', { name: 'Start your recipe' }));
  await expect(page).toHaveURL(/#submit-form$/);
  await expect(page.getByLabel('Recipe Name *')).toBeVisible();
  expect(await page.locator('#submit-form').evaluate(form => form.checkValidity())).toBe(false);
  await expectNoHorizontalOverflow(page);

  await page.goto('/tools/afrokitchen/recipes/jollof-rice-ng/');
  await clickSettledControl(page, page.getByRole('button', { name: 'Open menu' }));
  await clickSettledControl(page, page.getByRole('button', { name: 'Switch to dark mode' }));
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const colors = await page.evaluate(() => {
    const computed = selector => getComputedStyle(document.querySelector(selector));
    return {
      stepBackground: computed('.ak-step').backgroundColor,
      stepText: computed('.ak-step-text').color,
      timerBackground: computed('.ak-static-timer-chip').backgroundColor,
      heroAction: computed('.ak-hero-actions .ak-btn-primary').color
    };
  });
  expect(colors.stepBackground).not.toBe('rgb(255, 253, 250)');
  expect(colors.stepText).not.toBe(colors.stepBackground);
  expect(colors.timerBackground).not.toBe('rgb(248, 239, 226)');
  expect(colors.heroAction).toBe('rgb(255, 255, 255)');
  await expectNoHorizontalOverflow(page);
});
