const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { expect, test } = require('@playwright/test');

const DAY_ONE_TWO_CATEGORIES = [
  'diaspora',
  'career',
  'security',
  'personal-finance',
  'small-business',
  'fintech',
];

function scopedRoutes() {
  const registryPath = path.resolve(__dirname, '../../assets/js/components/tool-registry.js');
  const sandbox = { document: undefined, window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(registryPath, 'utf8'), sandbox);

  const tools = sandbox.AFRO_TOOLS
    .filter((tool) => (tool.lang || 'en') === 'en')
    .filter((tool) => DAY_ONE_TWO_CATEGORIES.includes(tool.category))
    .map((tool) => tool.href);
  const hubs = DAY_ONE_TWO_CATEGORIES.map((category) => `/${category}/`);
  return [...hubs, ...tools];
}

test.describe('Day 1 and Day 2 UI refinement', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
  });

  test('all 83 scoped surfaces remain readable and structurally usable', async ({ page }) => {
    test.setTimeout(150_000);
    const runtimeErrors = [];
    page.on('pageerror', (error) => runtimeErrors.push(error.message));

    for (const route of scopedRoutes()) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response && response.status(), `${route} should return HTTP 200`).toBe(200);
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      await page.waitForTimeout(150);

      const result = await page.evaluate(() => {
        const relatedTitle = document
          .querySelector('afro-related-tools')
          ?.shadowRoot?.querySelector('.title');
        return {
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          hasMain: Boolean(document.querySelector('main,[role="main"]')),
          relatedTitleColor: relatedTitle ? getComputedStyle(relatedTitle).color : null,
        };
      });

      expect(result.overflow, `${route} should not overflow at 390px`).toBeLessThanOrEqual(1);
      expect(result.hasMain, `${route} should expose a main landmark`).toBe(true);
      if (result.relatedTitleColor) {
        expect(result.relatedTitleColor, `${route} related title should be readable in dark mode`)
          .not.toBe('rgb(29, 29, 31)');
      }
    }

    expect(runtimeErrors).toEqual([]);
  });

  test('dense financial rows reflow and destructive actions remain touch-safe', async ({ page }) => {
    const routes = [
      '/tools/startup-runway/',
      '/tools/burn-rate/',
      '/tools/debt-snowball/',
      '/tools/net-worth/',
      '/tools/stock-portfolio/',
      '/tools/loan-consolidation/',
      '/tools/bill-split/',
    ];

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      await page.waitForTimeout(150);

      const actions = await page.locator('.remove-btn,.btn-del,.btn-del-row,.btn-rm')
        .evaluateAll((buttons) => buttons
          .filter((button) => getComputedStyle(button).display !== 'none')
          .map((button) => {
            const box = button.getBoundingClientRect();
            return {
              width: box.width,
              height: box.height,
              name: button.getAttribute('aria-label') || '',
            };
          }));

      expect(actions.length, `${route} should expose row actions`).toBeGreaterThan(0);
      for (const action of actions) {
        expect(action.width, `${route} action width`).toBeGreaterThanOrEqual(44);
        expect(action.height, `${route} action height`).toBeGreaterThanOrEqual(44);
        expect(action.name, `${route} action accessible name`).not.toBe('');
      }
    }
  });

  test('representative calculators still produce results after the UI changes', async ({ page }) => {
    const cases = [
      ['/tools/startup-runway/', 'calculate', '#results-section'],
      ['/tools/debt-snowball/', 'calcDebtPayoff', '#ds-results'],
      ['/tools/net-worth/', 'calcNetWorth', '#nw-results'],
      ['/tools/loan-consolidation/', 'calcConsolidation', '#lc-results'],
      ['/tools/bill-split/', 'calcBillSplit', '#bs-results'],
    ];

    for (const [route, functionName, resultSelector] of cases) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      if (route === '/tools/startup-runway/') {
        await page.locator('#cash-balance').fill('100000');
        await page.locator('#monthly-revenue').fill('10000');
        await page.locator('#cost-lines input[type="number"]').first().fill('20000');
      }
      await page.evaluate((name) => window[name](), functionName);
      await expect(page.locator(resultSelector), `${route} should show a calculation result`)
        .toBeVisible();
    }

    await page.goto('/tools/stock-portfolio/', { waitUntil: 'domcontentloaded' });
    const firstRow = page.locator('.holdings-table tbody tr').first();
    await firstRow.locator('input').nth(0).fill('TEST');
    await firstRow.locator('input').nth(1).fill('10');
    await firstRow.locator('input').nth(2).fill('100');
    await firstRow.locator('input').nth(3).fill('125');
    await page.evaluate(() => window.calcPortfolio());
    await expect(page.locator('#sp-results')).toBeVisible();
  });
});
