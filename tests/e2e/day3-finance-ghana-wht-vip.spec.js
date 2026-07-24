const { test, expect } = require('@playwright/test');

const cases = [
  { path: '/tools/gh-wht/', lang: 'en', button: 'Calculate WHT reference', title: 'Ghana Withholding Tax Calculator', canonical: 'https://afrotools.com/tools/gh-wht/' },
  { path: '/fr/tools/gh-wht/', lang: 'fr', button: 'Calculer la référence WHT', title: 'Calculateur de retenue à la source au Ghana', canonical: 'https://afrotools.com/fr/tools/gh-wht/' }
];

for (const item of cases) test(`Ghana WHT ${item.lang} app classifies privately and exports locally`, async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  const errors = [];
  const writes = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() !== 'GET') writes.push(`${request.method()} ${request.url()}`); });
  await page.addInitScript(() => {
    window.__sharedPayload = null;
    Object.defineProperty(navigator, 'share', { configurable: true, value: async payload => { window.__sharedPayload = payload; } });
  });
  await page.goto(item.path);
  await expect(page.locator('html')).toHaveAttribute('lang', item.lang);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', item.canonical);

  await page.locator('#grossAmount').fill('50000');
  await page.getByRole('button', { name: item.button }).click();
  await expect(page.locator('#withheldResult')).toContainText('4');
  await expect(page.locator('#grossResult')).toContainText('50');
  await expect(page.locator('#netResult')).toContainText('46');
  await expect(page.locator('#appliedRateResult')).toContainText('8');
  await expect(page.locator('#remittanceResult')).not.toHaveText('—');

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
  expect(pdf.name).toMatch(/ghana/i);

  await page.locator('#shareBtn').click();
  expect(await page.evaluate(() => window.__sharedPayload)).toEqual({ title: item.title, url: item.canonical });
  await page.screenshot({ path: `test-results/ghana-wht-${item.lang}-375-dark.png`, fullPage: true });

  await page.locator('#grossAmount').fill('-1');
  await page.getByRole('button', { name: item.button }).click();
  await expect(page.locator('#resultsCard')).not.toHaveClass(/on/);
  await expect(page.locator('#status')).toHaveClass(/error/);

  const source = await page.locator('html').evaluate(node => node.outerHTML);
  expect(source).not.toMatch(/localStorage|sessionStorage|fetch\(|XMLHttpRequest|\.netlify\/functions|AI advisor|email/i);
  expect(source).toContain('https://gra.gov.gh/portfolio/withholding-tax/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test('Ghana WHT threshold, classification and treaty safeguards match the shared engine', async ({ page }) => {
  await page.goto('/tools/gh-wht/');
  await page.locator('#category').selectOption('goods');
  await page.locator('#grossAmount').fill('500');
  await page.locator('#yearToDateBefore').fill('1000');
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#resultStatus')).toContainText('Below');
  await expect(page.locator('#withheldResult')).toContainText('0.00');

  await page.locator('#residence').selectOption('non-resident');
  await page.locator('#category').selectOption('royalties');
  await page.locator('#grossAmount').fill('50000');
  await page.locator('#useApprovedTreatyRate').check();
  await page.locator('#approvedTreatyRate').fill('10');
  await page.locator('#beneficialOwner').check();
  await page.locator('#graApproval').check();
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#domesticRateResult')).toContainText('15');
  await expect(page.locator('#appliedRateResult')).toContainText('10');
  await expect(page.locator('#withheldResult')).toContainText('5,000.00');

  await page.locator('#hasGhanaPe').check();
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#resultStatus')).toContainText('Needs GRA');
  await expect(page.locator('#withheldResult')).toContainText('Needs GRA');
});

test('legacy French Ghana WHT alias is noindex and resolves to the canonical app', async ({ page }) => {
  await page.goto('/fr/tools/gh-retenue-source/');
  await expect(page).toHaveURL(/\/fr\/tools\/gh-wht\/$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/gh-wht/');
});
