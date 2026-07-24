const { test, expect } = require('@playwright/test');

const routes = [
  { path: '/mauritania/mr-paye', amount: /MRU\s*306,360/ },
  { path: '/fr/mauritanie/calculateur-salaire-net/', amount: /306[\s\u00a0]360\s*(UM|MRU)/ },
];

for (const route of routes) {
  test(`${route.path} is private, responsive and formula-correct`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const consoleErrors = [];
    const nonGetRequests = [];
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('request', request => {
      if (request.method() !== 'GET') nonGetRequests.push(`${request.method()} ${request.url()}`);
    });

    await page.goto(route.path);
    const input = page.locator('#grossSalary');
    await expect(input).toHaveValue('');
    await input.fill('500000');
    await page.locator('.calc-btn').click();
    await expect(page.locator('#resAmount')).toHaveText(route.amount);
    await expect(page.locator('#resultsCard')).toHaveClass(/on/);

    await input.fill('0');
    await page.locator('.calc-btn').click();
    await expect(page.locator('#resultsCard')).not.toHaveClass(/on/);

    await input.fill('500000');
    await page.locator('.calc-btn').click();
    const generatedPdf = await page.evaluate(async () => {
      const result = new Promise(resolve => {
        window.addEventListener('afro-pdf-generated', async event => {
          const bytes = new Uint8Array(await event.detail.blob.arrayBuffer());
          resolve({
            fileName: event.detail.fileName,
            size: bytes.length,
            header: String.fromCharCode(...bytes.slice(0, 5))
          });
        }, { once: true });
      });
      document.querySelector('.act-pdf').click();
      return result;
    });
    expect(generatedPdf.fileName).toMatch(/mauritan/i);
    expect(generatedPdf.header).toBe('%PDF-');
    expect(generatedPdf.size).toBeGreaterThan(1000);

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    expect(nonGetRequests).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

for (const route of routes) {
  test(`${route.path} has readable dark presentation`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route.path);
    await page.locator('#grossSalary').fill('500000');
    await page.locator('.calc-btn').click();
    await expect(page.locator('#resAmount')).toHaveText(route.amount);
    const colors = await page.locator('#resAmount').evaluate(node => ({
      foreground: getComputedStyle(node).color,
      background: getComputedStyle(document.body).backgroundColor
    }));
    expect(colors.foreground).not.toBe(colors.background);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
}

test('Mauritania PAYE disclosures work from the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/mauritania/mr-paye');
  const disclosure = page.locator('.bands-card .card-head').first();
  await disclosure.focus();
  await page.keyboard.press('Enter');
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
});

test('Mauritania PAYE exposes the reviewed privacy and source contract', async ({ page }) => {
  await page.goto('/mauritania/mr-paye');
  const source = await page.locator('html').evaluate(() => document.documentElement.outerHTML);
  expect(source).not.toContain('pdf-leads');
  expect(source).not.toContain('/.netlify/functions/ai-advisor');
  expect(source).not.toContain('auto-email-gate');
  expect(source).not.toContain('FAQPage');
  expect(source).not.toContain('Public Sector (CNSS)');
  await expect(page.getByText(/special 20% maximum/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /CGI 2023/i }).first()).toBeVisible();
});
