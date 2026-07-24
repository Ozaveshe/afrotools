const fs = require('fs');
const pdfParse = require('pdf-parse');
const { test, expect } = require('@playwright/test');

function channel(value) { value /= 255; return value <= .03928 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4); }
function contrast(a, b) {
  const parse = value => (value.match(/\d+/g) || []).slice(0, 3).map(Number);
  const x = parse(a), y = parse(b);
  const lx = .2126 * channel(x[0]) + .7152 * channel(x[1]) + .0722 * channel(x[2]);
  const ly = .2126 * channel(y[0]) + .7152 * channel(y[1]) + .0722 * channel(y[2]);
  return (Math.max(lx, ly) + .05) / (Math.min(lx, ly) + .05);
}

const routes = [
  { path: '/tools/property-roi/', lang: 'en', heading: 'purchase to exit' },
  { path: '/fr/tools/roi-immobilier/', lang: 'fr', heading: 'achat à la sortie' },
  { path: '/sw/zana/faida-ya-uwekezaji-wa-nyumba/', lang: 'sw', heading: 'ununuzi hadi mauzo' }
];

for (const [index, route] of routes.entries()) {
  test(`${route.lang} property ROI is exact, private and responsive`, async ({ page }) => {
    const errors = [];
    const writes = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() !== 'GET') writes.push(request.postData() || ''); });
    await page.setViewportSize({ width: [320, 375, 768][index], height: 840 });
    await page.emulateMedia({ colorScheme: index === 1 ? 'light' : 'dark', reducedMotion: 'reduce' });
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', route.lang);
    await expect(page.locator('h1')).toContainText(route.heading);
    if (route.lang === 'en') {
      const skip = page.locator('.pr-skip');
      const idle = await skip.evaluate(node => {
        const box = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return { opacity: style.opacity, visibility: style.visibility, bottom: box.bottom };
      });
      expect(idle.opacity).toBe('0');
      expect(idle.visibility).toBe('visible');
      expect(idle.bottom).toBeLessThanOrEqual(0);
      await page.keyboard.press('Tab');
      await expect(skip).toBeFocused();
      await expect.poll(() => skip.evaluate(node => getComputedStyle(node).opacity)).toBe('1');
      const focused = await skip.boundingBox();
      const firstInput = await page.locator('#pr-purchase').boundingBox();
      const results = await page.locator('#pr-results').boundingBox();
      expect(focused.y).toBeGreaterThanOrEqual(0);
      expect(focused.x).toBeGreaterThanOrEqual(0);
      expect(focused.y + focused.height).toBeLessThanOrEqual(80);
      expect(focused.y + focused.height).toBeLessThanOrEqual(firstInput.y);
      expect(focused.y + focused.height).toBeLessThanOrEqual(results.y);
      await page.keyboard.press('Tab');
      await expect(skip).not.toBeFocused();
      await expect.poll(() => skip.evaluate(node => getComputedStyle(node).opacity)).toBe('0');
      expect((await skip.evaluate(node => node.getBoundingClientRect().bottom))).toBeLessThanOrEqual(0);
    }
    await page.fill('#pr-purchase', '10000000');
    await page.fill('#pr-buying-costs', '500000');
    await page.fill('#pr-improvements', '300000');
    await page.fill('#pr-years', '5');
    await page.fill('#pr-rent', '3000000');
    await page.fill('#pr-vacancy', '250000');
    await page.fill('#pr-operating', '900000');
    await page.fill('#pr-financing', '0');
    await page.fill('#pr-sale', '13500000');
    await page.fill('#pr-selling-costs', '675000');
    await page.fill('#pr-tax', '0');
    await page.click('#pr-form button[type="submit"]');
    await expect(page.locator('#pr-total-roi')).toContainText(/35[,.]88/);
    await expect(page.locator('#pr-average-roi')).toContainText(/7[,.]18/);
    await expect(page.locator('#pr-gross-yield')).toContainText(/6[,.]00/);
    await expect(page.locator('#pr-net-yield')).toContainText(/3[,.]43/);
    await expect(page.locator('#pr-profit')).toContainText(/3.?875.?000/);
    expect(await page.locator('.pr-field input').evaluateAll(inputs => inputs.every(input => input.labels && input.labels.length))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)).toBe(false);
    const colors = await page.locator('.pr-card').first().evaluate(node => {
      const style = getComputedStyle(node); return { fg: style.color, bg: style.backgroundColor };
    });
    expect(contrast(colors.fg, colors.bg)).toBeGreaterThanOrEqual(4.5);
    expect(writes.join('\n')).not.toContain('10000000');
    expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /property|roi/i.test(key)))).toEqual([]);
    expect(await page.locator('body').innerText()).not.toMatch(/Lagos|Nairobi|Johannesburg|Accra|AI advisor|Get AI/i);
    if (route.lang === 'en') {
      await page.addStyleTag({ content: 'afro-navbar{display:none!important}.pr-skip{display:none!important}' });
      await page.screenshot({ path: 'artifacts/property-roi-vip-320-dark.png', fullPage: true });
    }
    expect(errors).toEqual([]);
  });
}

test('property ROI exports local JSON and PDF with definitions', async ({ page }) => {
  await page.goto('/tools/property-roi/', { waitUntil: 'domcontentloaded' });
  const jsonPromise = page.waitForEvent('download');
  await page.click('#pr-json');
  const json = JSON.parse(fs.readFileSync(await (await jsonPromise).path(), 'utf8'));
  expect(json.tool).toBe('property-roi');
  expect(json.results.totalProfit).toBe(3875000);
  expect(json.definitions.simpleAverageAnnualRoi).toContain('not CAGR or IRR');
  const pdfPromise = page.waitForEvent('download');
  await page.click('#pr-pdf');
  const pdf = await pdfParse(fs.readFileSync(await (await pdfPromise).path()));
  expect(pdf.text).toContain('Property Investment Analysis');
  expect(pdf.text).toMatch(/Total property ROI/i);
  expect(pdf.text).toMatch(/Property basis/i);
  expect(pdf.text).toContain('METHOD BOUNDARY');
  expect(pdf.text).not.toContain('LEGAL BASIS');
});
