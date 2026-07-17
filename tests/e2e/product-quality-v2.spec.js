const { test, expect } = require('@playwright/test');

async function stubNoisyExternals(page) {
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: '' }));
  await page.route('https://www.google-analytics.com/**', route => route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: '' }));
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/**', route => {
    route.fulfill({
      contentType: 'application/javascript; charset=utf-8',
      body: 'window.supabase={createClient:function(){return{auth:{getSession:function(){return Promise.resolve({data:{session:null}})},onAuthStateChange:function(){return{data:{subscription:{unsubscribe:function(){}}}}}}}}};',
    });
  });
}

function captureErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/favicon|manifest|Failed to load resource|ERR_FAILED|CORS policy|api\/forex|api\/rates/i.test(text)) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(8);
}

test.beforeEach(async ({ page }) => {
  await stubNoisyExternals(page);
});

test('homepage renders, mobile navigation opens, and dark mode applies', async ({ page }) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('afro-navbar')).toBeVisible();
  await page.locator('afro-navbar').locator('.burger').click();
  await expect(page.locator('afro-navbar').locator('.mob.open')).toBeVisible();

  await page.evaluate(() => window.AfroTools && window.AfroTools.darkMode && window.AfroTools.darkMode.set('dark'));
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const bodyBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bodyBackground).not.toBe('rgb(255, 255, 255)');
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('VAT calculator handles empty and normal calculation states', async ({ page }) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools/vat-calculator/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#amountInput')).toBeVisible();
  await page.locator('#countrySelect').selectOption('NG');
  await page.locator('#calcBtn').click();
  await page.locator('#amountInput').fill('10000');
  await page.locator('#calcBtn').click();
  await expect(page.locator('#resultsArea')).toBeVisible();
  await expect(page.locator('#breakVat')).toContainText(/\d/);
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('English and Swahili unit converters calculate length values', async ({ page }) => {
  for (const route of ['/tools/unit-converter/', '/sw/zana/kubadilisha-vipimo/']) {
    const errors = captureErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#lenFrom')).toBeVisible();
    await page.locator('#lenFrom').fill('1000');
    await page.locator('#lenToU').selectOption('1000');
    await page.locator('#lenFrom').dispatchEvent('input');
    await expect.poll(() => page.locator('#lenTo').inputValue()).toMatch(/^1(\.0+)?$/);
    await assertNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  }
});

test('Nigeria salary calculator produces a visible take-home result', async ({ page }) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/nigeria/ng-salary-tax.html', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#grossSalary')).toBeVisible();
  await page.locator('#grossSalary').fill('3600000');
  await page.locator('#calcBtn').click();
  await expect(page.locator('#resultsCard')).toBeVisible();
  await expect(page.locator('#resAmount')).toContainText(/\d/);
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('representative finance, property, business, and health tools calculate results', async ({ page }) => {
  const flows = [
    {
      route: '/tools/mortgage-calculator/',
      fill: async () => {
        await page.locator('#homePrice').fill('50000000');
        await page.locator('#deposit').fill('10000000');
        await page.locator('#rate').fill('18');
        await page.locator('#term').fill('15');
        await page.getByRole('button', { name: /calculate mortgage/i }).click();
        await expect(page.locator('#results')).toBeVisible();
      },
    },
    {
      route: '/tools/car-loan/',
      fill: async () => {
        await page.locator('#price').fill('15000000');
        await page.locator('#deposit').fill('3000000');
        await page.locator('#rate').fill('22');
        await page.getByRole('button', { name: /calculate car loan/i }).click();
        await expect(page.locator('#results')).toBeVisible();
      },
    },
    {
      route: '/agriculture/farm-budget/',
      fill: async () => {
        await page.locator('#country-sel').selectOption('NG');
        await page.getByRole('button', { name: /plan my budget/i }).click();
        await expect(page.locator('#results')).toBeVisible();
      },
    },
    {
      route: '/health/bmi-calculator/',
      fill: async () => {
        await page.locator('#weight-kg').fill('70');
        await page.locator('#height-cm').fill('170');
        await page.locator('#calc-btn').click();
        await expect(page.locator('#result')).toBeVisible();
      },
    },
  ];

  for (const flow of flows) {
    const errors = captureErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(flow.route, { waitUntil: 'domcontentloaded' });
    await flow.fill();
    await assertNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  }
});

test('category, search, policy, and 404 pages render without mobile overflow', async ({ page }) => {
  for (const route of ['/salary-tax/', '/search/', '/privacy/', '/404.html']) {
    const errors = captureErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  }
});
