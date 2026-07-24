const { test, expect } = require('@playwright/test');

const cases = [
  { path: '/comoros/km-paye', lang: 'en', button: 'Calculate estimate', title: 'Comoros Employment Income Tax Calculator', canonical: 'https://afrotools.com/comoros/km-paye' },
  { path: '/fr/comores/calculateur-salaire-net/', lang: 'fr', button: "Calculer l'estimation", title: "Calculateur d'impôt sur le revenu aux Comores", canonical: 'https://afrotools.com/fr/comores/calculateur-salaire-net/' },
  { path: '/sw/comoros/kikokotoo-kodi-mshahara/', lang: 'sw', button: 'Kokotoa kadirio', title: 'Kikokotoo cha Kodi ya Mapato ya Ajira Comoros', canonical: 'https://afrotools.com/sw/comoros/kikokotoo-kodi-mshahara/' }
];

function numeric(locator) { return locator.evaluate(node => Number(node.textContent.replace(/[^0-9.-]/g, ''))); }

for (const item of cases) test(`Comoros ${item.lang} CGI reference app is private and mobile-safe`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  const errors = [];
  const writes = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() !== 'GET') writes.push(`${request.method()} ${request.url()}`); });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    window.__sharedPayload = null;
    Object.defineProperty(navigator, 'share', { configurable: true, value: async payload => { window.__sharedPayload = payload; } });
  });
  await page.goto(item.path);
  await expect(page.locator('html')).toHaveAttribute('lang', item.lang);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', item.canonical);
  await page.locator('#grossSalary').fill('1000000');
  await page.locator('#employeeContributionRate').fill('3');
  await page.getByRole('button', { name: item.button }).click();
  expect(await numeric(page.locator('#grossResult'))).toBe(1000000);
  expect(await numeric(page.locator('#employeeContribution'))).toBe(360000);
  expect(await numeric(page.locator('#professionalExpense'))).toBe(3492000);
  expect(await numeric(page.locator('#taxableAnnual'))).toBe(8148000);
  expect(await numeric(page.locator('#incomeTaxAnnual'))).toBe(1986900);
  expect(await numeric(page.locator('#incomeTaxMonthly'))).toBe(165575);
  expect(await numeric(page.locator('#netAnnual'))).toBe(9653100);
  expect(await numeric(page.locator('#netMonthly'))).toBe(804425);
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
  expect(pdf.name).toMatch(/comoros|comores|komoro/i);
  await page.locator('#shareBtn').click();
  expect(await page.evaluate(() => window.__sharedPayload)).toEqual({ title: item.title, url: item.canonical });
  const source = await page.locator('html').evaluate(node => node.outerHTML);
  expect(source).not.toContain('pdf-leads');
  expect(source).not.toContain('/.netlify/functions/ai-advisor');
  expect(source).not.toMatch(/2025\/26|2\.5% employee|9\.5% employer|12\.5% employer|optional AI assist/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  if (item.lang === 'en') await page.screenshot({ path: 'test-results/comoros-paye-en-375-dark.png', fullPage: true });
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test('Comoros widget matches the shared CGI engine at 320px', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 720 });
  const errors = [];
  const writes = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() !== 'GET') writes.push(`${request.method()} ${request.url()}`); });
  await page.goto('/widgets/iframe/financial-comoros-paye.html?theme=dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('#awKmGross').fill('300000');
  await page.locator('#awKmContribution').fill('0');
  await page.locator('#awKmCalc').click();
  await expect(page.locator('.aw-result-main')).toHaveText('KMF 271,042');
  await expect(page.getByText('-KMF 347,500')).toBeVisible();
  await expect(page.getByText('KMF 3,252,500')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});
