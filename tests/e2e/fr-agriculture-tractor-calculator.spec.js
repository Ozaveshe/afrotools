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
  const values = [];
  page.on('console', message => {
    if (message.type() === 'error') values.push(message.text());
  });
  page.on('pageerror', error => values.push(error.message));
  page.on('requestfailed', request => {
    if (new URL(request.url()).hostname === '127.0.0.1') values.push(request.url());
  });
  return values;
}
async function buffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const input = {
  countryCode: 'KE',
  equipmentKey: 'tractor_medium',
  price: 4550000,
  farmHa: 42,
  passes: 3,
  years: 10,
  financeType: 'lease',
  rate: 12,
  term: 7,
  downPct: 20,
  doContract: true,
  contractHa: 35,
  contractRate: 5000,
};

test('English Tractor Calculator delegates calculation to shared engine', async ({ page }) => {
  await sentinel(page);
  const errors = failures(page);
  await page.goto('/agriculture/tractor-calculator/');
  await page.selectOption('#sel-country', input.countryCode);
  await page.evaluate(() => onCountryChange());
  await page.selectOption('#sel-equip', input.equipmentKey);
  await page.evaluate(() => onEquipChange());
  await page.fill('#inp-price', String(input.price));
  await page.fill('#inp-farm', String(input.farmHa));
  await page.selectOption('#inp-passes', String(input.passes));
  await page.evaluate(years => setPeriod(years), input.years);
  await page.check('[name=finance][value=lease]');
  await page.fill('#inp-rate', String(input.rate));
  await page.selectOption('#inp-term', String(input.term));
  await page.fill('#inp-down', String(input.downPct));
  await page.check('[name=contract][value=yes]');
  await page.fill('#inp-contract-ha', String(input.contractHa));
  await page.fill('#inp-contract-rate', String(input.contractRate));
  await page.evaluate(() => calculate());
  const result = await page.evaluate(value => ({
    latest: window.TRACTOR_CALCULATOR_LAST_RESULT,
    expected: window.AfroTools.TractorCalculatorEngine.calculate(value, EQUIPMENT_DATA),
  }), input);
  expect(result.latest).toEqual(result.expected);
  expect(errors).toEqual([]);
});

test('French Tractor Calculator physical route acceptance', async ({ page, context }) => {
  await sentinel(page);
  const errors = failures(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/fr/agriculture/tractor-calculator/');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://afrotools.com/fr/agriculture/tractor-calculator/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://afrotools.com/fr/agriculture/tractor-calculator/');
  await expect(page.locator('link[rel=alternate][hreflang=en]')).toHaveAttribute('href', 'https://afrotools.com/agriculture/tractor-calculator/');
  expect((await page.locator('script[type="application/ld+json"]').first().evaluate(element => JSON.parse(element.textContent))).inLanguage).toBe('fr');
  expect(ai.routes['/agriculture/tractor-calculator/']).toBe('/fr/agriculture/tractor-calculator/');
  await page.selectOption('#country', input.countryCode);
  await page.selectOption('#equipment', input.equipmentKey);
  const values = {
    price: input.price, farmHa: input.farmHa, passes: input.passes, years: input.years,
    financeType: input.financeType, rate: input.rate, term: input.term,
    downPct: input.downPct, contractHa: input.contractHa, contractRate: input.contractRate,
  };
  for (const [id, value] of Object.entries(values)) {
    const element = page.locator(`#${id}`);
    if (await element.evaluate(node => node.tagName === 'SELECT')) await element.selectOption(String(value));
    else await element.fill(String(value));
  }
  await page.check('#doContract');
  const calculate = page.getByRole('button', { name: 'Comparer achat, location et financement' });
  await calculate.focus();
  await page.keyboard.press('Enter');
  const result = await page.evaluate(value => ({
    latest: window.__FR_AGRI_TEST__.latest,
    expected: window.__FR_AGRI_TEST__.engine.calculate(value, window.__FR_AGRI_TEST__.data),
    report: window.__FR_AGRI_TEST__.reportObject(),
  }), input);
  expect(result.latest).toEqual(result.expected);
  expect(result.report.sources.donneesEnDirect).toBe(false);
  for (const item of [
    { name: 'Exporter en TXT', extension: '.txt' },
    { name: 'Exporter en CSV', extension: '.csv' },
    { name: 'Exporter en JSON', extension: '.json' },
    { name: 'Exporter en PDF', extension: '.pdf' },
  ]) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: item.name }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toContain(item.extension);
    expect((await buffer(download)).length).toBeGreaterThan(3);
  }
  await page.getByRole('button', { name: 'Enregistrer dans ce navigateur' }).click();
  await page.getByRole('button', { name: 'Copier' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Kenya');
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
