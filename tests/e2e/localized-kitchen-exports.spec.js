const fs = require('fs');
const { test, expect } = require('@playwright/test');

const locales = {
  fr: { route: '/fr/tools/afrocuisine/', language: 'fr-FR', stale: /Recalculez/, unavailable: /Aucune donnée structurée/, land: '/fr/tools/taille-terrain/' },
  sw: { route: '/sw/zana/jikoni/', language: 'sw-TZ', stale: /Kokotoa tena/, unavailable: /Rekodi za kusoma hazipatikani/, land: '/sw/zana/ukubwa-wa-ardhi/' },
};

async function openLocal(page, baseURL, route, width, theme, blockedRecipeEngine = false) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 850 });
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.addInitScript(selectedTheme => {
    localStorage.setItem('aft_theme', selectedTheme);
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    window.__kitchenCopiedText = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async text => { window.__kitchenCopiedText.push(text); } },
    });
  }, theme);
  await page.route('**/*', request => {
    const url = new URL(request.request().url());
    return url.origin === new URL(baseURL).origin && !(blockedRecipeEngine && url.pathname === '/engines/afrokitchen-engine.js')
      ? request.continue() : request.abort();
  });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await expect(page.locator('afro-navbar')).toBeVisible();
  return errors;
}

async function visibleFocus(locator) {
  await expect(locator).toBeFocused();
  await expect(locator).toBeVisible();
  await expect.poll(() => locator.evaluate(node => {
    const r = node.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    const host = document.querySelector('afro-navbar');
    const navbar = host && (host.shadowRoot && host.shadowRoot.querySelector('nav') || host);
    const header = navbar && navbar.getBoundingClientRect();
    return Boolean(header) && r.left >= 0 && r.top >= Math.max(0, header.bottom) && r.right <= innerWidth && r.bottom <= innerHeight && (hit === node || node.contains(hit));
  })).toBe(true);
  return locator.evaluate(node => {
    const r = node.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    const host = document.querySelector('afro-navbar');
    const navbar = host.shadowRoot && host.shadowRoot.querySelector('nav') || host;
    return { id: node.id, top: r.top, bottom: r.bottom, width: r.width, navbarBottom: navbar.getBoundingClientRect().bottom, hit: hit && hit.id, focused: document.activeElement === node };
  });
}

async function noOverflow(page) {
  expect(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth))).toBe(0);
}

async function downloadText(page, kind) {
  const pending = page.waitForEvent('download');
  await page.locator(`[data-ua-export="${kind}"]`).click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  return fs.readFileSync(await download.path(), 'utf8');
}

async function recipeExports(page, locale, fixture) {
  const target = fixture.target || fixture.base * 2;
  const factor = target / fixture.base;
  const json = JSON.parse(await downloadText(page, 'json'));
  expect(json.toolId).toBe('afrokitchen');
  expect(json.locale).toBe(locale);
  expect(Object.keys(json.input).sort()).toEqual(['ingredients', 'originalServings', 'recipe', 'targetServings']);
  expect(json.input.recipe).toBe(fixture.slug);
  expect(json.input.originalServings).toBe(fixture.base);
  expect(json.input.targetServings).toBe(target);
  expect(json.result.status).toBe('ok');
  expect(json.result.values).toEqual({ scaleFactor: factor, ingredientCount: fixture.count, targetServings: target });
  expect(json.result.rows).toHaveLength(fixture.count);
  expect(json.result.rows[0]).toMatchObject({ name: fixture.firstIngredient, scaledAmount: fixture.firstAmount, unit: 'cups' });
  const txt = await downloadText(page, 'txt');
  const copiedBefore = await page.evaluate(() => window.__kitchenCopiedText.length);
  await page.locator('[data-ua-export="copy"]').click();
  await expect.poll(() => page.evaluate(() => window.__kitchenCopiedText.length)).toBe(copiedBefore + 1);
  const copied = await page.evaluate(() => window.__kitchenCopiedText.at(-1));
  expect(copied.trim()).toBe(txt.trim());
  const contract = await page.locator('#uaContract').evaluate(node => JSON.parse(node.textContent));
  for (const text of [txt, copied]) {
    expect(text).toContain(fixture.name);
    expect(text).toContain(`${contract.metrics.targetServings}: ${target}`);
    expect(text).toContain(contract.source);
    expect(text).toContain(contract.freshness);
    expect(text).toContain(contract.limitations);
    // Repeated names such as salt/onion must retain every separate quantity.
    const ingredientLines = text.split('\n').filter(line => json.result.rows.some(row => line.startsWith(row.name + ': ')));
    expect(ingredientLines).toEqual(json.result.rows.map(row => {
      const amount = Number.isFinite(row.scaledAmount) ? row.scaledAmount.toLocaleString(locales[locale].language, { maximumFractionDigits: 2 })
        : locale === 'fr' ? 'Selon goût' : 'Kulingana na ladha';
      return `${row.name}: ${amount}${row.unit ? ' ' + row.unit : ''}`;
    }));
  }
  return { json, txt, copied };
}

const jollof = { slug: 'nigerian-jollof-rice', name: 'Nigerian Jollof Rice', base: 6, count: 15, firstIngredient: 'long-grain parboiled rice', firstAmount: 6 };
const ugali = { slug: 'ugali-sukuma-wiki', name: 'Ugali na Sukuma Wiki', base: 4, count: 9, firstIngredient: 'white maize flour (unga)', firstAmount: 4 };

for (const [locale, settings] of Object.entries(locales)) {
  for (const width of [320, 390]) for (const theme of ['light', 'dark']) {
    test(`localized Kitchen ${locale} exports and visible recovery at ${width}px ${theme}`, async ({ page, baseURL }, testInfo) => {
      const errors = await openLocal(page, baseURL, settings.route, width, theme);
      const recipe = page.locator('#ua-recipe');
      const target = page.locator('#ua-targetServings');
      const original = page.locator('#ua-originalServings');
      const submit = page.locator('.ua-primary');
      const status = page.locator('[data-ua-status]');
      const rows = page.locator('[data-ua-table] tbody tr');
      const exports = page.locator('[data-ua-export]');
      const evidence = { locale, width, theme, browser: testInfo.project.name };
      await expect(recipe.locator('option')).toHaveCount(8);
      await expect(original).toHaveAttribute('readonly', '');
      await expect(original).not.toBeDisabled();
      await expect(original).toHaveValue('6');
      await expect(page.locator('label[for="ua-originalServings"]')).toBeVisible();
      await target.focus();
      await page.keyboard.press('Tab');
      evidence.readOnlyFocus = await visibleFocus(original);
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('7');
      await expect(original).toHaveValue('6');
      await page.keyboard.press('Tab');
      await visibleFocus(submit);
      await page.keyboard.press('Enter');
      await expect(rows).toHaveCount(15);
      if (locale === 'sw') {
        await expect(page.locator('[data-ua-metrics]')).toHaveClass('ua-metrics');
        expect(await page.locator('[data-ua-table] th').allTextContents()).toEqual(['Kiungo', 'Kiasi kilichorekebishwa', 'Kipimo']);
        await expect(rows.first()).toContainText('long-grain parboiled rice');
        await expect(rows.first().locator('td').nth(1)).toHaveText('6');
      }
      evidence.firstExports = await recipeExports(page, locale, jollof);
      await noOverflow(page);
      await page.screenshot({ path: testInfo.outputPath('complete-recipe-export.png'), fullPage: true });

      await recipe.selectOption(ugali.slug);
      await expect(original).toHaveValue('4');
      await expect(original).toHaveAttribute('readonly', '');
      await expect(rows).toHaveCount(0);
      await expect(exports).toHaveCount(0);
      await expect(page.locator('[data-ua-metrics]')).toBeEmpty();
      if (locale === 'fr') await expect(page.locator('[data-ua-context]')).toBeEmpty();
      await expect(status).toContainText(settings.stale);
      await target.fill('8');
      await page.keyboard.press('Tab');
      await visibleFocus(original);
      await page.keyboard.press('Tab');
      await visibleFocus(submit);
      await page.keyboard.press('Enter');
      await expect(rows).toHaveCount(9);
      evidence.changedRecipeExports = await recipeExports(page, locale, ugali);

      await target.fill('3');
      await submit.click();
      evidence.fractionalExports = await recipeExports(page, locale, { ...ugali, target: 3, firstAmount: 1.5 });
      expect(evidence.fractionalExports.json.result.rows.find(row => row.name === 'salt').scaledAmount).toBe(0.375);
      expect(evidence.fractionalExports.txt).toContain(locale === 'fr' ? 'salt: 0,38 teaspoon' : 'salt: 0.38 teaspoon');
      expect(evidence.fractionalExports.txt).not.toMatch(/salt: 0[.,]375/);
      expect(evidence.fractionalExports.txt).not.toMatch(/\d+[.,]\d{3,}/);

      await target.fill('10');
      await expect(rows).toHaveCount(0);
      await expect(exports).toHaveCount(0);
      await expect(status).toContainText(settings.stale);
      await submit.click();
      await expect(rows).toHaveCount(9);
      evidence.invalidFocus = [];
      for (const invalidValue of ['0', '']) {
        await target.fill(invalidValue);
        await submit.click();
        await expect(target).toHaveAttribute('aria-invalid', 'true');
        evidence.invalidFocus.push(await visibleFocus(target));
        await expect(status).toHaveClass('ua-error');
        await expect(rows).toHaveCount(0);
        await expect(exports).toHaveCount(0);
        await expect(page.locator('[data-ua-metrics]')).toBeEmpty();
        if (locale === 'fr') await expect(page.locator('[data-ua-context]')).toBeEmpty();
        await noOverflow(page);
      }
      await page.screenshot({ path: testInfo.outputPath('invalid-visible-focus.png') });
      await page.locator('[data-ua-reset]').click();
      evidence.resetFocus = await visibleFocus(recipe);
      await expect(page.locator('[data-ua-result]')).toBeHidden();
      await expect(recipe).toHaveValue(jollof.slug);
      await expect(target).toHaveValue('12');
      await expect(original).toHaveValue('6');
      await expect(original).toHaveAttribute('readonly', '');
      await expect(page.locator('[aria-invalid="true"]')).toHaveCount(0);
      await expect(rows).toHaveCount(0);
      await submit.click();
      await expect(rows).toHaveCount(15);
      await expect(exports).toHaveCount(3);
      await noOverflow(page);
      expect(errors).toEqual([]);
      fs.writeFileSync(testInfo.outputPath('verified-recipe-and-focus.json'), JSON.stringify(evidence, null, 2));
    });
  }

  test(`localized Kitchen ${locale} blocked recipe engine stays honest`, async ({ page, baseURL }, testInfo) => {
    const errors = await openLocal(page, baseURL, settings.route, 390, 'dark', true);
    await expect(page.locator('#ua-recipe option')).toHaveCount(0);
    await expect(page.locator('#ua-originalServings')).toHaveAttribute('readonly', '');
    await expect(page.locator('#ua-originalServings')).toHaveValue('');
    await page.locator('.ua-primary').click();
    await expect(page.locator('[data-ua-status]')).toContainText(settings.unavailable);
    await expect(page.locator('[data-ua-table] tbody tr')).toHaveCount(0);
    await expect(page.locator('[data-ua-export]')).toHaveCount(0);
    await visibleFocus(page.locator('#ua-recipe'));
    await noOverflow(page);
    await page.screenshot({ path: testInfo.outputPath('recipe-engine-unavailable.png') });
    expect(errors).toEqual([]);
  });

  test(`shared ${locale} runtime preserves non-Kitchen land conversion and exports`, async ({ page, baseURL }) => {
    const errors = await openLocal(page, baseURL, settings.land, 320, 'dark');
    const area = page.locator('[data-ua-field="area"]');
    await expect(area).not.toHaveAttribute('readonly', '');
    await page.locator('[data-ua-field="mode"]').selectOption('area');
    await page.locator('[data-ua-field="unit"]').selectOption('sqm');
    await area.fill('100');
    await page.locator('.ua-primary').click();
    const payload = JSON.parse(await downloadText(page, 'json'));
    expect(payload.toolId).toBe('land-size');
    expect(payload.result.status).toBe('ok');
    expect(payload.result.values.sqm).toBe(100);
    await page.locator('[data-ua-export="copy"]').click();
    await expect.poll(() => page.evaluate(() => window.__kitchenCopiedText.length)).toBe(1);
    const txt = await page.evaluate(() => window.__kitchenCopiedText[0]);
    const contract = await page.locator('#uaContract').evaluate(node => JSON.parse(node.textContent));
    expect(txt).toContain(contract.title);
    expect(txt).toContain(contract.metrics.sqm);
    expect(txt).toContain(contract.source);
    expect(txt).toContain(contract.limitations);
    expect(txt).not.toContain('Ingrédients redimensionnés');
    expect(txt).not.toContain('Viungo vilivyorekebishwa');
    await area.fill('200');
    await expect(page.locator('[data-ua-export]')).not.toHaveCount(0);
    await expect(page.locator('[data-ua-status]')).not.toContainText(settings.stale);
    await page.locator('.ua-primary').click();
    expect(JSON.parse(await downloadText(page, 'json')).result.values.sqm).toBe(200);
    expect(errors).toEqual([]);
  });
}
