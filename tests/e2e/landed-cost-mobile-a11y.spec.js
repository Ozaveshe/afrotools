const { test, expect } = require('@playwright/test');

async function expectCoreAxeClean(page) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async function () {
    const result = await axe.run(document.querySelector('.t-main > .container'), {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag22aa'] }
    });
    return result.violations.map(function (violation) {
      return {
        id: violation.id,
        targets: violation.nodes.map(function (node) { return node.target.join(' '); })
      };
    });
  });
  expect(violations).toEqual([]);
}

for (const colorScheme of ['light', 'dark']) {
  test(`landed-cost mobile tabs and result workflows are accessible in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/landed-cost/', { waitUntil: 'domcontentloaded' });

    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(4);
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tabCalc')).toBeVisible();
    await expect(page.locator('#tabCompare')).toBeHidden();
    expect(await tabs.evaluateAll(function (nodes) {
      return nodes.every(function (node) { return node.getBoundingClientRect().height >= 44; });
    })).toBe(true);

    await tabs.nth(0).focus();
    await tabs.nth(0).press('ArrowRight');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tabCompare')).toBeVisible();
    await tabs.nth(1).press('Home');
    await expect(tabs.nth(0)).toBeFocused();
    await expect(page.locator('#tabCalc')).toBeVisible();
    await expectCoreAxeClean(page);

    await page.getByRole('button', { name: /Calculate Landed Cost/ }).click();
    await expect(page.locator('#calcResults')).toBeVisible();
    await expectCoreAxeClean(page);

    await tabs.nth(1).click();
    await page.locator('#cmpAFX').fill('1660');
    await page.locator('#cmpBFX').fill('1660');
    await page.getByRole('button', { name: 'Compare Scenarios' }).last().click();
    await expect(page.locator('#cmpResults')).toBeVisible();
    await expectCoreAxeClean(page);

    await tabs.nth(2).click();
    await page.locator('#sellPriceLocal').fill('40000000');
    await page.getByRole('button', { name: 'Calculate P&L' }).click();
    await expect(page.locator('#pnlResult')).toBeVisible();
    await expectCoreAxeClean(page);

    await tabs.nth(3).click();
    await expect(page.locator('#chatMessages')).toHaveAttribute('tabindex', '0');
    await expectCoreAxeClean(page);

    const overflow = await page.evaluate(function () {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
