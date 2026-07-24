const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');

const routes = [
  ['/tools/break-even/', 'Break-even planner'],
  ['/fr/tools/seuil-rentabilite/', 'Planificateur du seuil de rentabilité'],
  ['/sw/zana/kikokotoo-break-even/', 'Mpangaji wa kizingiti cha faida'],
  ['/ha/kayan-aiki/dawo-da-jari/', 'Mai tsara adadin dawo da jari']
];

async function calculate(page) {
  await page.locator('#beFixed').fill('1010');
  await page.locator('#bePrice').fill('35');
  await page.locator('#beVariable').fill('15');
  await page.locator('#bePlanned').fill('40');
  await page.locator('#beTarget').fill('505');
  await page.locator('#beForm button[type="submit"]').click();
}

for (const [route, heading] of routes) {
  test(`${route} is native, responsive and formula-correct`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route);
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveCSS('position', 'fixed');
    expect((await skipLink.boundingBox()).y).toBeLessThan(0);
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();
    expect((await skipLink.boundingBox()).y).toBeGreaterThanOrEqual(0);
    await page.keyboard.press('Enter');
    await expect(page.locator('main[data-break-even-app]')).toBeFocused();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await calculate(page);
    await expect(page.locator('#beExactUnits')).toHaveText(/50[,.]50/);
    await expect(page.locator('#beWholeUnits')).toHaveText('51');
    await expect(page.locator('#beExactRevenue')).toContainText(/1[\s,.\u202f]?767[,.]50/);
    await expect(page.locator('#beWholeRevenue')).toContainText(/1[\s,.\u202f]?785[,.]00/);
    await expect(page.locator('#beProfit')).toContainText(/-210[,.]00/);
    await expect(page.locator('#beSafety')).toContainText(/-10[,.]50/);
    await expect(page.locator('#beTargetUnits')).toHaveText('76');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await expect(page.locator('.bev-card').first()).toHaveCSS('background-color', 'rgb(17, 30, 46)');
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const appZoom = await page.evaluate(() => {
      const main = document.querySelector('main[data-break-even-app]');
      return {
        fits: main.scrollWidth <= main.clientWidth && main.getBoundingClientRect().right <= document.documentElement.clientWidth + 1,
        width: [main.scrollWidth, main.clientWidth],
        offenders: [...main.querySelectorAll('*')].filter(node => node.scrollWidth > node.clientWidth + 1).slice(0, 12).map(node => ({tag:node.tagName,className:String(node.className),text:(node.textContent||'').trim().slice(0,60),scrollWidth:node.scrollWidth,clientWidth:node.clientWidth}))
      };
    });
    expect(appZoom.fits, JSON.stringify(appZoom)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('validation is visible, keyboard calculation works and no calculation network call occurs', async ({ page }) => {
  await page.goto('/tools/break-even/');
  await page.evaluate(() => {
    window.__beFetches = 0;
    const original = window.fetch;
    window.fetch = function () { window.__beFetches += 1; return original.apply(this, arguments); };
  });
  await page.locator('#beFixed').fill('1000');
  await page.locator('#beVariable').fill('20');
  await page.locator('#bePrice').fill('20');
  await page.locator('#bePrice').press('Enter');
  await expect(page.locator('#beError')).not.toBeEmpty();
  await page.locator('#bePrice').fill('30');
  await page.locator('#bePrice').press('Enter');
  await expect(page.locator('#beWholeUnits')).toHaveText('100');
  expect(await page.evaluate(() => window.__beFetches)).toBe(0);
});

test('CSV is formula-safe and PDF contains parser-readable formulas', async ({ page }) => {
  await page.goto('/tools/break-even/');
  await page.locator('#beUnit').fill('=HYPERLINK("bad")');
  await calculate(page);

  const csvDownload = page.waitForEvent('download');
  await page.locator('#beCsv').click();
  const csv = await (await csvDownload).createReadStream();
  let csvText = '';
  for await (const chunk of csv) csvText += chunk.toString('utf8');
  expect(csvText).toContain('"Display unit","\'=HYPERLINK');
  expect(csvText).toContain('"Exact threshold revenue","1767.5"');

  const pdfDownload = page.waitForEvent('download');
  await page.locator('#bePdf').click();
  const pdf = await (await pdfDownload).createReadStream();
  const chunks = [];
  for await (const chunk of pdf) chunks.push(chunk);
  const parsed = await pdfParse(Buffer.concat(chunks));
  expect(parsed.text).toContain('Exact break-even units: 50.5');
  expect(parsed.text).toContain('Exact threshold revenue: 1767.5');
  expect(parsed.text).toContain('Exact units = fixed costs');
});

for (const route of ['/widgets/iframe/financial-break-even', '/widgets/iframe/business-break-even-lite']) {
  test(`${route} uses the shared engine with visible errors`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto(route + '?theme=dark');
    await page.locator('input').nth(0).fill('1010');
    await page.locator('input').nth(1).fill('15');
    await page.locator('input').nth(2).fill('35');
    await page.getByRole('button', { name: 'Calculate' }).click();
    await expect(page.getByText('51 units')).toBeVisible();
    await expect(page.getByText('1,767.50')).toBeVisible();
    await page.locator('input').nth(2).fill('15');
    await page.getByRole('button', { name: 'Calculate' }).click();
    await expect(page.locator('[data-error]')).toBeVisible();
    await expect(page.locator('[data-error]')).toContainText('greater than variable cost');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}
