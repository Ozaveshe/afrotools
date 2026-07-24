const { test, expect } = require('@playwright/test');

const pages = [
  { locale: 'en', route: '/tools/route-fares/', submit: 'Calculate route budget' },
  { locale: 'fr', route: '/fr/tools/tarifs-itineraire/', submit: 'Calculer le budget' },
  { locale: 'sw', route: '/sw/zana/nauli-za-ruti/', submit: 'Kokotoa bajeti' },
];

for (const item of pages) {
  test(`${item.locale} keeps formula, privacy and exports in parity`, async ({ page }) => {
    await page.route('**/api/transport-fares?**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"fares":[]}' }));
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(item.route);
    await expect(page.locator('html')).toHaveAttribute('lang', item.locale);
    await expect(page.locator('#rfTotal')).toHaveText(/4[,.\s]840|4\s840/);
    await page.fill('#rfRoute', 'private-route-marker');
    await page.fill('#rfFare', '150');
    await page.fill('#rfPrevious', '120');
    await page.getByRole('button', { name: item.submit }).click();
    await expect(page.locator('#rfChange')).toHaveText('+25.0%');
    expect(requests.join('\n')).not.toContain('private-route-marker');
    await page.evaluate(() => { window.__printCalled = false; window.print = () => { window.__printCalled = true; }; });
    await page.locator('#rfPrint').click();
    expect(await page.evaluate(() => window.__printCalled)).toBe(true);
    const download = page.waitForEvent('download');
    await page.locator('#rfDownload').click();
    expect((await download).suggestedFilename()).toBe('route-fare-budget.txt');
    expect(errors).toEqual([]);
  });

  test(`${item.locale} fits mobile dark at 200 percent`, async ({ page }) => {
    await page.route('**/api/transport-fares?**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"fares":[]}' }));
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 750, height: 900 });
    await page.goto(item.route);
    await page.evaluate(() => { document.body.style.zoom = '2'; });
    const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(size.scroll).toBeLessThanOrEqual(size.client + 1);
    await expect(page.getByRole('button', { name: item.submit })).toBeVisible();
    await page.screenshot({ path: `test-results/route-fares-${item.locale}-mobile-dark-200.png`, fullPage: true });
  });
}
