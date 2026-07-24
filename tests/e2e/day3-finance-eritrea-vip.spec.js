const { test, expect } = require('@playwright/test');

const cases = [
  { path: '/eritrea/er-paye', lang: 'en', button: 'Calculate estimate', title: 'Eritrea Employment Income Tax Calculator', canonical: 'https://afrotools.com/eritrea/er-paye' },
  { path: '/fr/eritrea/er-paye', lang: 'fr', button: "Calculer l'estimation", title: "Calculateur d'impôt sur les salaires en Érythrée", canonical: 'https://afrotools.com/fr/eritrea/er-paye' },
  { path: '/sw/eritrea/kikokotoo-kodi-mshahara/', lang: 'sw', button: 'Kokotoa makadirio', title: 'Kikokotoo cha Kodi ya Mapato ya Ajira Eritrea', canonical: 'https://afrotools.com/sw/eritrea/kikokotoo-kodi-mshahara/' }
];

function numeric(locator) { return locator.evaluate(node => Number(node.textContent.replace(/[^0-9.-]/g, ''))); }

for (const item of cases) test(`Eritrea ${item.lang} statutory-reference app is private and mobile-safe`, async ({ page }) => {
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
  await page.locator('#grossSalary').fill('10000');
  await page.getByRole('button', { name: item.button }).click();
  expect(await numeric(page.locator('#incomeTax'))).toBe(2795);
  expect(await numeric(page.locator('#netMonthly'))).toBe(7205);
  expect(await numeric(page.locator('#employeePension'))).toBe(0);
  await page.locator('#employmentType').selectOption('public-sector');
  await expect(page.locator('#pensionField')).toBeVisible();
  await page.locator('#pensionableBasic').fill('8000');
  await page.getByRole('button', { name: item.button }).click();
  expect(await numeric(page.locator('#incomeTax'))).toBe(2795);
  expect(await numeric(page.locator('#employeePension'))).toBe(400);
  expect(await numeric(page.locator('#employerPension'))).toBe(560);
  expect(await numeric(page.locator('#netMonthly'))).toBe(6805);
  expect(await numeric(page.locator('#employerCost'))).toBe(10560);
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
  expect(pdf.name).toMatch(/eritrea|erythree/i);
  await page.locator('#shareBtn').click();
  expect(await page.evaluate(() => window.__sharedPayload)).toEqual({ title: item.title, url: item.canonical });
  const source = await page.locator('html').evaluate(node => node.outerHTML);
  expect(source).not.toContain('pdf-leads');
  expect(source).not.toContain('/.netlify/functions/ai-advisor');
  expect(source).not.toContain('financialministry.gov.sd');
  expect(source).not.toMatch(/3% employee|11% employer|2025\/26 rates|Mabanda ya kodi 7/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test('Eritrea widget matches the shared engine at 320px', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 720 });
  const errors = [];
  const writes = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (request.method() !== 'GET') writes.push(`${request.method()} ${request.url()}`); });
  await page.goto('/widgets/iframe/financial-eritrea-paye.html?theme=dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('#awErGross').fill('10000');
  await page.locator('#awErEmployment').selectOption('public-sector');
  await page.locator('#awErPension').fill('8000');
  await page.locator('#awErCalc').click();
  await expect(page.locator('.aw-result-main')).toHaveText('ERN 6,805');
  await expect(page.getByText('-ERN 2,795')).toBeVisible();
  await expect(page.getByText('ERN 10,560')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});
