const { test, expect } = require('@playwright/test');

const climateRoutes = [
  '/tools/drought-risk/', '/tools/water-scarcity/', '/tools/rainfall-tracker/',
  '/tools/carbon-credit/', '/tools/flood-risk/', '/tools/air-quality/',
  '/tools/deforestation/', '/tools/waste-management/', '/tools/recycling-revenue/',
  '/tools/charcoal-vs-clean/', '/tools/ewaste-value/', '/tools/tree-planting-roi/',
  '/tools/sustainability-scorecard/'
];

const engineeringFlows = [
  ['/engineering/afrodraft/', null, /Open AfroDraft|Launch AfroDraft|Start drawing/i],
  ['/engineering/floor-planner/', null, /Start planning|Open planner|Create floor plan/i],
  ['/tools/solar-calculator/', /Calculate/i, /5 panels/i],
  ['/tools/floor-plan/', null, /91\s*m/i],
  ['/tools/boq-builder/', null, /Open BOQ Builder|Launch BOQ|Start building/i],
  ['/tools/structural-calc/', /Calculate Beam/i, /225\s*[×x]\s*475|497\s*mm/i],
  ['/tools/electrical-load/', /Calculate Load/i, /6\.2\s*kW|18\.8\s*A/i],
  ['/tools/concrete-mix/', /Calculate Materials/i, /cement|aggregate/i],
  ['/tools/paint-calculator/', /Calculate Paint Needed/i, /litres|liters/i],
  ['/tools/tiles-calc/', /Calculate/i, /96|12 boxes/i],
  ['/tools/water-tank/', /Calculate/i, /3,?000\s*L|750\s*L/i],
  ['/tools/roof-calculator/', /Calculate/i, /163\.1\s*m|39 sheets/i],
  ['/tools/borehole-cost/', /Estimate/i, /1,?732,?000|60\s*m/i],
  ['/tools/rebar-calculator/', /Calculate/i, /290\s*kg|60 bars/i],
  ['/tools/generator-sizing/', /Calculate/i, /2\.5\s*kVA|0\.9\s*kW/i],
  ['/tools/boq-generator/', /Generate Bill/i, /13,?622,?239|8,?845,?610/i],
  ['/tools/home-renovation-cost/', /Estimate/i, /renovation|total/i],
  ['/tools/septic-tank/', /Calculate/i, /2\.0\s*m|367,?600/i],
  ['/tools/fence-cost/', /Calculate/i, /2,?720,?000/i],
  ['/tools/swimming-pool-cost/', /Estimate Pool Cost/i, /48,?000\s*L|6,?584,?000/i],
  ['/tools/architectural-fee/', /Calculate/i, /2,?295,?000|6\.4%/i],
  ['/tools/site-clearing/', /Calculate/i, /2,?011,?500/i],
  ['/tools/road-construction-cost/', /Estimate Road Cost/i, /74\.25\s*M|61\.88\s*M/i],
  ['/tools/scaffolding-calc/', /Calculate/i, /540\s*m|6,?018,?000/i],
  ['/tools/window-door-sizing/', /Calculate/i, /MEETS 5% TARGET|BELOW 5% TARGET/i],
  ['/tools/plumbing-material/', /Calculate/i, /353,?400|203,?400/i]
];

const miningFlows = [
  ['/tools/commodity-tracker/', /Create trade brief/i, '.df-result', {}],
  ['/tools/diamond-valuation/', /Estimate value/i, '#result.on', { '#carat': '1', '#base': '12000' }],
  ['/tools/oil-well-production/', /Estimate production/i, '#result.on', { '#price': '75' }],
  ['/tools/oil-gas-revenue/', /Calculate split/i, '#result.on', { '#vol': '1000000', '#price': '75' }],
  ['/tools/mining-license-fee/', /Calculate licence cost/i, '#result.on', { '#area': '100', '#oneOff': '1000' }],
  ['/tools/mining-royalty/', /Calculate royalty/i, '#mr-result.on', { '#mr-gross': '1000000', '#mr-rate': '5' }],
  ['/tools/artisanal-mining-income/', /Calculate income/i, '#result.on', { '#qty': '60', '#formal': '55' }]
];

async function assertRouteShell(page, route) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${route}`);
  expect((await page.title()).trim().length).toBeGreaterThan(15);
  expect((await page.locator('meta[name="description"]').getAttribute('content') || '').length).toBeGreaterThan(40);
  const accessibility = await page.evaluate(() => {
    const controls = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea, button')];
    const unnamed = controls.filter((control) => !(
      (control.labels && control.labels.length) ||
      control.getAttribute('aria-label') ||
      control.getAttribute('aria-labelledby') ||
      control.textContent.trim() ||
      control.title
    ));
    const focusable = [...document.querySelectorAll('a[href], button, input, select, textarea')]
      .find((control) => control.offsetParent !== null && !control.disabled);
    if (focusable) focusable.focus();
    return { unnamed: unnamed.length, focusReached: !focusable || document.activeElement === focusable };
  });
  expect(accessibility.unnamed, `${route} has unnamed form controls`).toBe(0);
  expect(accessibility.focusReached, `${route} cannot receive keyboard focus`).toBe(true);
}

async function keepRunLocal(page) {
  await page.route(/^https?:\/\//, async (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if (hostname === '127.0.0.1') await route.continue();
    else await route.abort();
  });
}

async function assertReflow(page, route) {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
    document.documentElement.dataset.theme = 'dark';
  });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `${route} overflows at 320px and 200% text`).toBeLessThanOrEqual(2);
  await expect(page.locator('h1').first()).toBeVisible();
}

test.describe('Day 8 category hubs', () => {
  for (const hub of ['/engineering/', '/climate/', '/mining/']) {
    test(`${hub} supports mobile, zoom reflow and category-safe copy`, async ({ page }) => {
      await keepRunLocal(page);
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      await assertRouteShell(page, hub);
      await assertReflow(page, hub);
      const text = await page.locator('body').innerText();
      expect(text).not.toMatch(/Africa holds 30%|NEMSA standards|every tool uses real African materials/i);
    });
  }
});

test('all 13 Climate apps run, reject invalid state, reset, and export a local PDF', async ({ page }) => {
  test.setTimeout(300_000);
  await keepRunLocal(page);
  const writes = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && new URL(request.url()).hostname === '127.0.0.1') {
      writes.push(`${request.method()} ${request.url()}`);
    }
  });

  for (const route of climateRoutes) {
    await assertRouteShell(page, route);
    const form = page.locator('#climateForm');
    await expect(form).toBeVisible();
    await form.evaluate((node) => node.requestSubmit());
    await expect(page.locator('#cl-results')).toHaveClass(/on/);
    const result = await page.locator('#cl-results').innerText();
    expect(result).not.toMatch(/\b(?:NaN|Infinity|undefined)\b/);
    expect(result.trim().length).toBeGreaterThan(30);

    const download = page.waitForEvent('download');
    await page.locator('#downloadClimatePdf').click();
    const file = await download;
    const stream = await file.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const pdf = Buffer.concat(chunks);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(1_000);

    const numeric = form.locator('input[type="number"]').first();
    await numeric.fill('');
    await expect(page.locator('#cl-results')).toHaveClass(/is-stale/);
    await form.evaluate((node) => node.requestSubmit());
    await expect(numeric).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#cl-results')).not.toHaveClass(/on/);

    await page.locator('#resetClimateScenario').click();
    await expect(page.locator('#cl-results')).not.toHaveClass(/on/);
    await expect(page.locator('#cl-form-status')).toContainText(/reset/i);
    await assertReflow(page, route);
  }

  expect(writes).toEqual([]);
});

test('all 26 Engineering canonical routes execute their deterministic primary workflow', async ({ page }) => {
  test.setTimeout(180_000);
  await keepRunLocal(page);
  const writes = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && new URL(request.url()).hostname === '127.0.0.1') {
      writes.push(`${request.method()} ${request.url()}`);
    }
  });

  for (const [route, action, expected] of engineeringFlows) {
    await assertRouteShell(page, route);
    if (action) {
      const button = page.getByRole('button', { name: action }).first();
      await expect(button, `${route} primary workflow button`).toBeVisible();
      await button.click();
      await expect(page.locator('body')).toContainText(expected);
    } else {
      await expect(page.locator('body')).toContainText(expected);
    }
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/[₦$€£]\s*NaN|\bInfinity\b/);

    const buildPack = page.getByRole('button', { name: 'Build Pack', exact: true });
    if (await buildPack.count()) {
      await buildPack.click();
      await expect(page.locator('.eng-output')).toHaveClass(/is-on/);
      const storage = await page.evaluate(() => localStorage.getItem('afro_engineering_packs'));
      expect(storage).toBeNull();
    }
    await assertReflow(page, route);
  }

  expect(writes).toEqual([]);
});

test('all seven Mining hub routes execute without non-finite or network-written results', async ({ page }) => {
  test.setTimeout(90_000);
  await keepRunLocal(page);
  const writes = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && new URL(request.url()).hostname === '127.0.0.1') {
      writes.push(`${request.method()} ${request.url()}`);
    }
  });

  for (const [route, action, resultSelector, inputs] of miningFlows) {
    await assertRouteShell(page, route);
    for (const [selector, value] of Object.entries(inputs)) {
      const input = page.locator(selector);
      if (await input.isVisible()) await input.fill(value);
    }
    const button = page.getByRole('button', { name: action }).first();
    await expect(button).toBeVisible();
    await button.click();
    const result = page.locator(resultSelector);
    await expect(result).toBeVisible();
    expect((await result.innerText()).trim().length).toBeGreaterThan(20);
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/[₦$€£]\s*NaN|\bInfinity\b|\bundefined\b/);
    await assertReflow(page, route);
  }

  expect(writes).toEqual([]);
});
