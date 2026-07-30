const { test, expect } = require('@playwright/test');
const ai = require('../../assets/js/ai/french-route-map.generated.js');
async function sentinel(page) {
  const response = await page.request.get('/tests/fixtures/fr-agriculture-worktree-7e83-sentinel.txt');
  expect(response.ok()).toBe(true);
  const text = await response.text();
  expect(text).toContain('worktree=7e83');
  expect(text).toContain('root=C:\\Users\\Oza\\.codex\\worktrees\\7e83\\afrotools');
}
function failures(page) {
  const result = [];
  page.on('console', message => { if (message.type() === 'error') result.push(message.text()); });
  page.on('pageerror', error => result.push(error.message));
  page.on('requestfailed', request => { if (new URL(request.url()).hostname === '127.0.0.1') result.push(request.url()); });
  return result;
}
async function buffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}
const input = {
  coopType: 'agri', method: 'hybrid', revenue: 24000000, expenses: 17750000,
  members: 340, myProduce: 2750, totalProduce: 190000, myShares: 92000,
  totalShares: 6800000, marketPrice: 310, saccoRate: 0, hybridPatronagePct: 35,
  allocations: { reserve: 30, education: 5, dividend: 45, social: 5, retained: 15 },
};
test('English Cooperative calculator delegates to the shared engine without behavior drift', async ({ page }) => {
  await sentinel(page);
  const errors = failures(page);
  await page.goto('/agriculture/cooperative-calculator/');
  await page.evaluate(value => {
    setMethod('hybrid', [...document.querySelectorAll('.method-card')].find(card => card.getAttribute('onclick').includes("'hybrid'")));
    const ids = { 'inp-revenue': value.revenue, 'inp-expenses': value.expenses, 'inp-members': value.members, 'inp-my-produce': value.myProduce, 'inp-total-produce': value.totalProduce, 'inp-my-shares': value.myShares, 'inp-total-shares': value.totalShares, 'inp-market-price': value.marketPrice, 'inp-sacco-rate': value.saccoRate, 'hybrid-range': value.hybridPatronagePct, 'alloc-reserve': value.allocations.reserve, 'alloc-edu': value.allocations.education, 'alloc-dividend': value.allocations.dividend, 'alloc-social': value.allocations.social, 'alloc-retained': value.allocations.retained };
    Object.entries(ids).forEach(([id, number]) => { document.getElementById(id).value = String(number); });
    calcDividend();
  }, input);
  const result = await page.evaluate(value => ({
    latest: window.COOPERATIVE_LAST_RESULT,
    expected: window.AfroTools.CooperativeEngine.calculate(value),
  }), input);
  expect(result.latest).toEqual(result.expected);
  expect(errors).toEqual([]);
});
test('French Cooperative physical route acceptance', async ({ page, context }) => {
  await sentinel(page);
  const errors = failures(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/fr/agriculture/cooperative-calculator/');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://afrotools.com/fr/agriculture/cooperative-calculator/');
  await expect(page.locator('link[rel=alternate][hreflang=en]')).toHaveAttribute('href', 'https://afrotools.com/agriculture/cooperative-calculator/');
  expect((await page.locator('script[type="application/ld+json"]').first().evaluate(element => JSON.parse(element.textContent))).inLanguage).toBe('fr');
  expect(ai.routes['/agriculture/cooperative-calculator/']).toBe('/fr/agriculture/cooperative-calculator/');
  const fields = { coopType: input.coopType, method: input.method, revenue: input.revenue, expenses: input.expenses, members: input.members, myProduce: input.myProduce, totalProduce: input.totalProduce, myShares: input.myShares, totalShares: input.totalShares, marketPrice: input.marketPrice, saccoRate: input.saccoRate, hybridPatronagePct: input.hybridPatronagePct, reserve: input.allocations.reserve, education: input.allocations.education, dividend: input.allocations.dividend, social: input.allocations.social, retained: input.allocations.retained };
  await page.selectOption('#coopType', fields.coopType);
  await page.selectOption('#method', fields.method);
  for (const [id, value] of Object.entries(fields)) if (!['coopType', 'method'].includes(id)) await page.fill(`#${id}`, String(value));
  const button = page.getByRole('button', { name: 'Calculer ma part' });
  await button.focus();
  await page.keyboard.press('Enter');
  const result = await page.evaluate(value => ({
    latest: window.__FR_AGRI_TEST__.latest,
    expected: window.__FR_AGRI_TEST__.engine.calculate(value),
    report: window.__FR_AGRI_TEST__.reportObject(),
  }), input);
  expect(result.latest).toEqual(result.expected);
  expect(result.report.sources.donneesEnDirect).toBe(false);
  for (const item of [{ name: 'Exporter en TXT', ext: '.txt' }, { name: 'Exporter en CSV', ext: '.csv' }, { name: 'Exporter en JSON', ext: '.json' }, { name: 'Exporter en PDF', ext: '.pdf' }]) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: item.name }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toContain(item.ext);
    expect((await buffer(download)).length).toBeGreaterThan(3);
  }
  await page.getByRole('button', { name: 'Enregistrer dans ce navigateur' }).click();
  await page.getByRole('button', { name: 'Copier' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Répartition coopérative');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.getByRole('button', { name: 'Thème sombre' }).click();
  for (const width of [320, 375, 640]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  await expect(page.locator('#empty')).toBeVisible();
  expect(errors).toEqual([]);
});
