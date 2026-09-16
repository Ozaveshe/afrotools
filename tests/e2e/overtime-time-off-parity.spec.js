const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const routes = {en: '/tools/overtime-calc/', fr: '/fr/tools/calculateur-heures-supplementaires/', sw: '/sw/zana/kikokotoo-muda-wa-ziada/'};
for (const [locale, route] of Object.entries(routes)) test(`${locale} overtime compares one nine-hour day without a false cash advantage`, async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto(route);
  await page.locator('#country').selectOption('ZA');
  await page.locator(locale === 'fr' ? '#salary' : '#monthly-salary').fill('19485');
  await page.locator(locale === 'fr' ? '#hours' : '#ot-hours').fill('6');
  if (locale === 'fr') {
    await page.locator('button[type=submit]').click();
    const rows = page.locator('[data-result-rows]');
    await expect(rows).toContainText('9 heures');
    await expect(rows).toContainText('1 jour');
    await expect(rows).toContainText('coefficient de 1,5×');
    const downloadEvent = page.waitForEvent('download');
    await page.locator('[data-txt]').click();
    const download = await downloadEvent;
    const text = fs.readFileSync(await download.path(), 'utf8');
    expect(text).toContain('Repos équivalent');
    expect(text).toContain('9 heures');
    expect(text).toContain('restent à confirmer');
  } else {
    await page.locator('#tog-toil').click();
    await page.locator('[onclick="calculate()"]').click();
    await expect(page.locator('#toil-block')).toBeVisible();
    expect(parseFloat(await page.locator('#toil-hours').innerText())).toBe(9);
    expect(parseFloat(await page.locator('#toil-days').innerText())).toBe(1);
    await expect(page.locator('#toil-verdict')).toContainText(locale === 'en' ? 'same cash value' : 'thamani sawa ya fedha');
    await expect(page.locator('#toil-verdict')).not.toContainText('0%');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
