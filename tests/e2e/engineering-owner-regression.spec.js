const { test, expect } = require('@playwright/test');
const fixtures = require('../fixtures/engineering-construction-owner-parity.json');

test('all 26 extracted English owners preserve their frozen deterministic output fixtures', async ({ page }) => {
  test.setTimeout(420_000);
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.route(/^https?:\/\//, async (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if (hostname === '127.0.0.1') await route.continue();
    else await route.abort();
  });

  for (const fixture of fixtures) {
    runtimeErrors.length = 0;
    await page.goto(fixture.english, { waitUntil: 'domcontentloaded' });
    if (fixture.englishAction) {
      const action = page.getByRole('button', {
        name: new RegExp(fixture.englishAction, 'i')
      }).first();
      await expect(action, `${fixture.english} primary action`).toBeVisible();
      await action.click();
    }
    await expect(page.locator('body'), `${fixture.english} frozen output`).toContainText(
      new RegExp(fixture.englishExpected, 'i')
    );
    expect(await page.locator('body').innerText()).not.toMatch(/\b(?:NaN|Infinity|undefined)\b/);
    expect(runtimeErrors, `${fixture.english} runtime errors`).toEqual([]);
  }
});
