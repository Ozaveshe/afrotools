const { test, expect } = require('@playwright/test');

const cases = [
  { path: '/benin/bj-paye', lang: 'en', button: 'Calculate take-home', shareTitle: 'Benin Salary Calculator', canonical: 'https://afrotools.com/benin/bj-paye' },
  { path: '/fr/benin/calculateur-salaire-net/', lang: 'fr', button: 'Calculer le salaire net', shareTitle: 'Calculateur salaire net Bénin', canonical: 'https://afrotools.com/fr/benin/calculateur-salaire-net/' },
  { path: '/sw/benin/kikokotoo-kodi-mshahara/', lang: 'sw', button: 'Kokotoa malipo halisi', shareTitle: 'Kikokotoo cha mshahara Benin', canonical: 'https://afrotools.com/sw/benin/kikokotoo-kodi-mshahara/' }
];

for (const item of cases) {
  test(`Benin ${item.lang} app is correct, private, dark and mobile-safe`, async ({ page }) => {
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
    await page.locator('#grossSalary').fill('500000');
    await page.locator('#payMonth').selectOption('standard');
    await page.locator('#riskRate').selectOption('1');
    await page.getByRole('button', { name: item.button }).click();
    const digits = async selector => page.locator(selector).evaluate(node => node.textContent.replace(/\D/g, ''));
    expect(await digits('#netMonthly')).toBe('410500');
    expect(await digits('#employeeCnss')).toBe('18000');
    expect(await digits('#baseIts')).toBe('71500');
    expect(await digits('#ortbLevy')).toBe('0');
    expect(await digits('#employerCnss')).toBe('82000');
    expect(await digits('#employerCost')).toBe('582000');
    await page.locator('#payMonth').selectOption('june');
    await page.getByRole('button', { name: item.button }).click();
    expect(await digits('#ortbLevy')).toBe('3000');
    expect(await digits('#netMonthly')).toBe('407500');
    const pdf = await page.evaluate(async () => {
      const result = new Promise(resolve => window.addEventListener('afro-pdf-generated', async event => {
        const bytes = new Uint8Array(await event.detail.blob.arrayBuffer());
        resolve({ fileName: event.detail.fileName, size: bytes.length, header: String.fromCharCode(...bytes.slice(0, 5)) });
      }, { once: true }));
      document.querySelector('#pdfBtn').click(); return result;
    });
    expect(pdf.fileName).toMatch(/benin/); expect(pdf.header).toBe('%PDF-'); expect(pdf.size).toBeGreaterThan(1000);
    await page.locator('#shareBtn').click();
    expect(await page.evaluate(() => window.__sharedPayload)).toEqual({ title: item.shareTitle, url: item.canonical });
    const source = await page.locator('html').evaluate(node => node.outerHTML);
    expect(source).not.toContain('pdf-leads'); expect(source).not.toContain('gross_salary'); expect(source).not.toContain('/.netlify/functions/ai-advisor');
    expect(source).not.toMatch(/CNPS 2\.5%|0%–25%|0%–35%/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    expect(nonGetRequests).toEqual([]); expect(consoleErrors).toEqual([]);
  });
}

test('Benin widget matches the shared engine at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  const consoleErrors=[]; const nonGetRequests=[];
  page.on('console', m => { if(m.type()==='error') consoleErrors.push(m.text()); });
  page.on('request', r => { if(r.method()!=='GET') nonGetRequests.push(`${r.method()} ${r.url()}`); });
  await page.goto('/widgets/iframe/financial-benin-paye.html?theme=dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.locator('#awBjGross').fill('500000'); await page.locator('#awBjMonth').selectOption('standard'); await page.locator('#awBjCalc').click();
  await expect(page.locator('.aw-result-main')).toHaveText('XOF 410,500');
  await expect(page.getByText('-XOF 18,000')).toBeVisible(); await expect(page.getByText('-XOF 71,500')).toBeVisible(); await expect(page.getByText('XOF 582,000')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(nonGetRequests).toEqual([]); expect(consoleErrors).toEqual([]);
});
