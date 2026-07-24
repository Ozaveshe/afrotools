const { test, expect } = require('@playwright/test');

const cases = [
  { path: '/djibouti/dj-paye', lang: 'en', button: 'Calculate take-home', title: 'Djibouti Salary Calculator', canonical: 'https://afrotools.com/djibouti/dj-paye' },
  { path: '/fr/djibouti/calculateur-salaire-net/', lang: 'fr', button: 'Calculer le salaire net', title: 'Calculateur de salaire net à Djibouti', canonical: 'https://afrotools.com/fr/djibouti/calculateur-salaire-net/' },
  { path: '/sw/djibouti/kikokotoo-kodi-mshahara/', lang: 'sw', button: 'Kokotoa mshahara halisi', title: 'Kikokotoo cha Mshahara Jibuti', canonical: 'https://afrotools.com/sw/djibouti/kikokotoo-kodi-mshahara/' }
];

function numeric(locator) {
  return locator.evaluate(node => Number(node.textContent.replace(/[^0-9-]/g, '')));
}

for (const item of cases) test(`Djibouti ${item.lang} app is current, private, dark and mobile-safe`, async ({ page }) => {
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
  await page.locator('#grossSalary').fill('200000');
  await page.getByRole('button', { name: item.button }).click();
  expect(await numeric(page.locator('#employeeCnss'))).toBe(12000);
  expect(await numeric(page.locator('#taxableIncome'))).toBe(188000);
  expect(await numeric(page.locator('#roundedTaxableIncome'))).toBe(185000);
  expect(await numeric(page.locator('#itsMonthly'))).toBe(25700);
  expect(await numeric(page.locator('#netMonthly'))).toBe(162300);
  expect(await numeric(page.locator('#employerCnss'))).toBe(31400);
  expect(await numeric(page.locator('#employerCost'))).toBe(231400);
  await page.locator('#grossSalary').fill('10000');
  await page.locator('#employmentType').selectOption('domestic');
  await page.getByRole('button', { name: item.button }).click();
  expect(await numeric(page.locator('#contributionBase'))).toBe(15850);
  expect(await numeric(page.locator('#itsMonthly'))).toBe(0);
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
  expect(pdf.name).toMatch(/djibouti|jibuti/i);
  await page.locator('#shareBtn').click();
  expect(await page.evaluate(() => window.__sharedPayload)).toEqual({ title: item.title, url: item.canonical });
  const source = await page.locator('html').evaluate(node => node.outerHTML);
  expect(source).not.toContain('pdf-leads');
  expect(source).not.toContain('/.netlify/functions/ai-advisor');
  expect(source).not.toMatch(/Social Security \(4%\)|mabanda ya kodi 6|optional AI|By Claude/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test('Djibouti widget matches the shared engine at 320px', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 720 });
  const errors = [];
  const writes = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (request.method() !== 'GET') writes.push(`${request.method()} ${request.url()}`); });
  await page.goto('/widgets/iframe/financial-djibouti-paye.html?theme=dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('#awDjGross').fill('200000');
  await page.locator('#awDjCalc').click();
  await expect(page.locator('.aw-result-main')).toHaveText('DJF 162,300');
  await expect(page.getByText('-DJF 25,700')).toBeVisible();
  await expect(page.getByText('DJF 231,400')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});
