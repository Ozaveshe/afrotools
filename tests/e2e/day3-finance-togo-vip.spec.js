const { test, expect } = require('@playwright/test');

const cases = [
  { path: '/togo/tg-paye', lang: 'en', button: 'Calculate take-home', shareTitle: 'Togo PAYE Calculator', canonical: 'https://afrotools.com/togo/tg-paye' },
  { path: '/fr/togo/calculateur-salaire-net', lang: 'fr', button: 'Calculer le salaire net', shareTitle: 'Calculateur Salaire Net Togo', canonical: 'https://afrotools.com/fr/togo/calculateur-salaire-net' },
  { path: '/sw/togo/kikokotoo-kodi-mshahara/', lang: 'sw', button: 'Kokotoa mshahara halisi', shareTitle: 'Kikokotoo cha Mshahara Togo', canonical: 'https://afrotools.com/sw/togo/kikokotoo-kodi-mshahara/' }
];

for (const item of cases) {
  test(`Togo ${item.lang} app is correct, private, dark and mobile-safe`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    const consoleErrors = [];
    const nonGetRequests = [];
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('request', request => { if (request.method() !== 'GET') nonGetRequests.push(`${request.method()} ${request.url()}`); });
    await page.addInitScript(() => {
      window.__sharedPayload = null;
      Object.defineProperty(navigator, 'share', { configurable: true, value: async payload => { window.__sharedPayload = payload; } });
    });
    await page.goto(item.path);

    await expect(page.locator('html')).toHaveAttribute('lang', item.lang);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', item.canonical);
    await expect(page.locator('#grossSalary')).toHaveValue('');
    await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);
    await page.locator('#grossSalary').fill('500000');
    await page.locator('#dependents').fill('2');
    await page.getByRole('button', { name: item.button }).click();

    expect(await page.locator('#netMonthly').evaluate(node => node.textContent.replace(/\D/g, ''))).toBe('467192');
    expect(await page.locator('#employeeCnss').evaluate(node => node.textContent.replace(/\D/g, ''))).toBe('20000');
    expect(await page.locator('#payeMonthly').evaluate(node => node.textContent.replace(/\D/g, ''))).toBe('12808');
    expect(await page.locator('#taxableIncome').evaluate(node => node.textContent.replace(/\D/g, ''))).toBe('3907000');
    expect(await page.locator('#employerCnss').evaluate(node => node.textContent.replace(/\D/g, ''))).toBe('87500');
    expect(await page.locator('#employerCost').evaluate(node => node.textContent.replace(/\D/g, ''))).toBe('587500');

    const generatedPdf = await page.evaluate(async () => {
      const result = new Promise(resolve => window.addEventListener('afro-pdf-generated', async event => {
        const bytes = new Uint8Array(await event.detail.blob.arrayBuffer());
        resolve({ fileName: event.detail.fileName, size: bytes.length, header: String.fromCharCode(...bytes.slice(0, 5)) });
      }, { once: true }));
      document.querySelector('#pdfBtn').click();
      return result;
    });
    expect(generatedPdf.fileName).toMatch(/togo/);
    expect(generatedPdf.header).toBe('%PDF-');
    expect(generatedPdf.size).toBeGreaterThan(1000);

    await page.locator('#shareBtn').click();
    expect(await page.evaluate(() => window.__sharedPayload)).toEqual({ title: item.shareTitle, url: item.canonical });
    const source = await page.locator('html').evaluate(node => node.outerHTML);
    expect(source).not.toMatch(/Ãƒ.|Ã¢â‚¬|Ã‚/);
    expect(source).not.toContain('pdf-leads');
    expect(source).not.toContain('gross_salary');
    expect(source).not.toContain('/.netlify/functions/ai-advisor');
    expect(source).not.toContain('CNPS 2.5%');
    expect(source).not.toContain('0%–25%');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    expect(nonGetRequests).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

test('Togo widget matches the shared engine at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  const consoleErrors = [];
  const nonGetRequests = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('request', request => { if (request.method() !== 'GET') nonGetRequests.push(`${request.method()} ${request.url()}`); });
  await page.goto('/widgets/iframe/financial-togo-paye.html?theme=dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('#awTgGross').fill('500000');
  await page.locator('#awTgDependents').fill('2');
  await page.locator('#awTgCalc').click();
  await expect(page.locator('.aw-result-main')).toHaveText('XOF 467,192');
  await expect(page.getByText('−XOF 20,000')).toBeVisible();
  await expect(page.getByText('−XOF 12,808')).toBeVisible();
  await expect(page.getByText('XOF 87,500')).toBeVisible();
  await expect(page.getByText('XOF 587,500')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(nonGetRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
