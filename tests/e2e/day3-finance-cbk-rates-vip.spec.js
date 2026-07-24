const { test, expect } = require('@playwright/test');

const routes = [
  { name: 'en', path: '/tools/cbk-rates/', lang: 'en', width: 320, heading: 'Bring the official rate. See every step of the conversion.', button: 'Calculate locally' },
  { name: 'fr', path: '/fr/tools/taux-de-change-de-la-cbk/', lang: 'fr', width: 360, heading: 'Apportez le taux officiel. Vérifiez chaque étape du calcul.', button: 'Calculer localement' },
  { name: 'sw', path: '/sw/zana/viwango-vya-cbk/', lang: 'sw', width: 375, heading: 'Leta kiwango rasmi. Ona kila hatua ya hesabu.', button: 'Kokotoa kivinjarini' },
];

function channel(value) { value /= 255; return value <= .03928 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4); }
function contrast(rgb1, rgb2) { const parse = value => (value.match(/\d+/g) || []).slice(0, 3).map(Number); const a = parse(rgb1), b = parse(rgb2); const la = .2126 * channel(a[0]) + .7152 * channel(a[1]) + .0722 * channel(a[2]); const lb = .2126 * channel(b[0]) + .7152 * channel(b[1]) + .0722 * channel(b[2]); return (Math.max(la, lb) + .05) / (Math.min(la, lb) + .05); }

for (const route of routes) {
  test(`${route.name} manual CBK converter is local, native and mobile-safe`, async ({ page }) => {
    const errors = [], nonGet = [], dataRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => { if (request.method() !== 'GET') nonGet.push(`${request.method()} ${request.url()}`); if (/api\/forex|fx\/rates|fawaz|er-api|exchangerate/i.test(request.url())) dataRequests.push(request.url()); });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: route.width, height: 812 });
    await page.goto(route.path, { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('lang', route.lang);
    await expect(page.locator('h1')).toHaveText(route.heading);
    await expect(page.locator('link[rel="alternate"]')).toHaveCount(4);
    await expect(page.locator('.fx-official')).toHaveAttribute('href', 'https://www.centralbank.go.ke/rates/forex-exchange-rates/');
    await expect(page.locator('[data-cbk-manual] .fx-alert')).toContainText('KES/USHS');
    const before = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
    await page.locator('[name="amount"]').fill('100');
    await page.locator('[name="currency"]').fill('usd');
    await page.locator('[name="rate"]').fill('130');
    await page.locator('[name="sourceDate"]').fill('2026-07-21');
    await page.getByRole('button', { name: route.button }).press('Enter');
    await expect(page.locator('[data-result]')).toBeVisible();
    await expect(page.locator('[data-summary]')).toContainText('13');
    await expect(page.locator('[data-rate-line]')).toContainText('USD');
    await expect(page.locator('[data-formula]')).toContainText('100');
    await expect(page.locator('[data-source-date]')).toHaveText('2026-07-21');
    expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual(before);
    await page.locator('.fx-official').focus();
    expect(parseFloat(await page.locator('.fx-official').evaluate(node => getComputedStyle(node).outlineWidth))).toBeGreaterThanOrEqual(3);
    const colors = await page.locator('.fx-submit').evaluate(node => { const s = getComputedStyle(node); return { fg: s.color, bg: s.backgroundColor }; });
    expect(contrast(colors.fg, colors.bg)).toBeGreaterThanOrEqual(4.5);
    const rendered = await page.locator('body').innerText();
    expect(rendered).not.toMatch(/\uFFFD|\u00C3.|\u00C2.|\u00E2\u20AC/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    expect(dataRequests).toEqual([]);
    expect(nonGet).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `artifacts/day3-finance-cbk-rates/cbk-manual-${route.name}-${route.width}-dark.png`, fullPage: true });
  });
}

test('100-unit quotation, future-date rejection and missing fields are explicit', async ({ page }) => {
  await page.goto('/tools/cbk-rates/');
  await page.getByRole('button', { name: 'Calculate locally' }).click();
  await expect(page.locator('[data-error]')).toContainText('greater than zero');
  await page.locator('[name="amount"]').fill('250');
  await page.locator('[name="currency"]').fill('JPY');
  await page.locator('[name="rate"]').fill('85');
  await page.locator('[name="units"]').selectOption('100');
  await page.locator('[name="sourceDate"]').fill('2999-01-01');
  await page.getByRole('button', { name: 'Calculate locally' }).click();
  await expect(page.locator('[data-error]')).toContainText('cannot be in the future');
  await page.locator('[name="sourceDate"]').fill('2026-07-21');
  await page.getByRole('button', { name: 'Calculate locally' }).click();
  await expect(page.locator('[data-summary]')).toContainText('212.50');
  await expect(page.locator('[data-formula]')).toContainText('250.00 ÷ 100 × 85.00 = KES 212.50');
});

test('English page reflows with 200% text in light mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/cbk-rates/', { waitUntil: 'networkidle' });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.locator('main').evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(0);
  expect(await page.locator('main *').evaluateAll(nodes => nodes.filter(node => node.getClientRects().length && (node.getBoundingClientRect().left < 0 || node.getBoundingClientRect().right > innerWidth)).map(node => node.tagName))).toEqual([]);
  await expect(page.getByRole('button', { name: 'Calculate locally' })).toBeVisible();
  await page.screenshot({ path: 'artifacts/day3-finance-cbk-rates/cbk-manual-en-320-light-200pct.png', fullPage: true });
});
