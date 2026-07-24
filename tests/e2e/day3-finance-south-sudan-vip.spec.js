const { test, expect } = require('@playwright/test');

const cases = [
  { path: '/south-sudan/ss-paye', lang: 'en', button: 'Calculate estimate', title: 'South Sudan PAYE Calculator', canonical: 'https://afrotools.com/south-sudan/ss-paye' },
  { path: '/fr/south-sudan/ss-paye', lang: 'fr', button: "Calculer l'estimation", title: 'Calculateur PAYE du Soudan du Sud', canonical: 'https://afrotools.com/fr/south-sudan/ss-paye' },
  { path: '/sw/south-sudan/kikokotoo-kodi-mshahara/', lang: 'sw', button: 'Kokotoa makadirio', title: 'Kikokotoo cha Kodi ya Ajira Sudan Kusini', canonical: 'https://afrotools.com/sw/south-sudan/kikokotoo-kodi-mshahara/' }
];

function numeric(locator) { return locator.evaluate(node => Number(node.textContent.replace(/[^0-9.-]/g, ''))); }

for (const item of cases) test(`South Sudan ${item.lang} statutory-reference app is private and mobile-safe`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  const errors = [];
  const writes = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (request.method() !== 'GET') writes.push(`${request.method()} ${request.url()}`); });
  await page.addInitScript(() => {
    window.__sharedPayload = null;
    Object.defineProperty(navigator, 'share', { configurable: true, value: async payload => { window.__sharedPayload = payload; } });
  });
  await page.goto(item.path);
  await expect(page.locator('html')).toHaveAttribute('lang', item.lang);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', item.canonical);
  await page.locator('#grossSalary').fill('100000');
  await page.getByRole('button', { name: item.button }).click();
  expect(await numeric(page.locator('#employeeNsif'))).toBe(8000);
  expect(await numeric(page.locator('#taxableIncome'))).toBe(92000);
  expect(await numeric(page.locator('#pit'))).toBe(8050);
  expect(await numeric(page.locator('#surtax'))).toBe(2415);
  expect(await numeric(page.locator('#totalTax'))).toBe(10465);
  expect(await numeric(page.locator('#netMonthly'))).toBe(81535);
  expect(await numeric(page.locator('#employerNsif'))).toBe(17000);
  expect(await numeric(page.locator('#employerCost'))).toBe(117000);
  const pdf = await page.evaluate(async () => {
    const done = new Promise(resolve => window.addEventListener('afro-pdf-generated', async event => {
      const bytes = new Uint8Array(await event.detail.blob.arrayBuffer());
      resolve({ name: event.detail.fileName, size: bytes.length, header: String.fromCharCode(...bytes.slice(0, 5)) });
    }, { once: true }));
    document.querySelector('#pdfBtn').click();
    return done;
  });
  expect(pdf.header).toBe('%PDF-');
  expect(pdf.size).toBeGreaterThan(1000);
  expect(pdf.name).toMatch(/south-sudan|soudan|sudan-kusini/i);
  await page.locator('#shareBtn').click();
  expect(await page.evaluate(() => window.__sharedPayload)).toEqual({ title: item.title, url: item.canonical });
  const source = await page.locator('html').evaluate(node => node.outerHTML);
  expect(source).not.toContain('pdf-leads');
  expect(source).not.toContain('/.netlify/functions/ai-advisor');
  expect(source).not.toContain('financialministry.gov.sd');
  expect(source).not.toMatch(/2025\/26|flat 30%|Secondary Employment|optional AI assist/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test('South Sudan widget matches the shared engine at 320px', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 720 });
  const errors = [];
  const writes = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (request.method() !== 'GET') writes.push(`${request.method()} ${request.url()}`); });
  await page.goto('/widgets/iframe/financial-south-sudan-paye.html?theme=dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('#awSsGross').fill('100000');
  await page.locator('#awSsCalc').click();
  await expect(page.locator('.aw-result-main')).toHaveText('SSP 81,535');
  await expect(page.getByText('-SSP 10,465')).toBeVisible();
  await expect(page.getByText('SSP 117,000')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});
