const { test, expect } = require('@playwright/test');

const routes = [
  { path: '/liberia/lr-paye', amount: 'LRD 42,458' },
  { path: '/fr/liberia/lr-paye', amount: 'LRD 42,458' },
];

for (const route of routes) {
  test(`${route.path} is private, responsive and formula-correct`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const consoleErrors = [];
    const leakedRequests = [];
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('request', request => {
      if (request.method() !== 'GET') leakedRequests.push(`${request.method()} ${request.url()}`);
    });

    await page.goto(route.path);
    const input = page.locator('#grossSalary');
    await expect(input).toHaveValue('');
    await input.fill('50000');
    await page.locator('.calc-btn').click();
    await expect(page.locator('#resAmount')).toHaveText(route.amount);
    await expect(page.locator('#resultsCard')).toHaveClass(/on/);

    const toggle = page.locator('[data-tog="nssf"]');
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');

    await input.fill('0');
    await page.locator('.calc-btn').click();
    await expect(page.locator('#resultsCard')).not.toHaveClass(/on/);

    await input.fill('50000');
    await page.locator('.calc-btn').click();
    const pdfPayload = await page.evaluate(async () => {
      let payload = null;
      const original = window.AfroTools.pdf;
      window.AfroTools.pdf = { generate: async value => { payload = value; } };
      document.querySelector('.act-pdf').click();
      await new Promise(resolve => setTimeout(resolve, 0));
      window.AfroTools.pdf = original;
      return payload;
    });
    expect(pdfPayload).toBeTruthy();
    expect(pdfPayload.skipGate).toBe(true);
    expect(JSON.stringify(pdfPayload)).toContain('42,458');

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
    expect(generatedPdf.fileName).toMatch(/afrotools.*liberia.*\.pdf/i);
    expect(generatedPdf.header).toBe('%PDF-');
    expect(generatedPdf.size).toBeGreaterThan(1000);

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    expect(leakedRequests).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

test('Liberia PAYE retains readable dark presentation', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/liberia/lr-paye');
  await page.locator('#grossSalary').fill('50000');
  await page.locator('.calc-btn').click();
  await expect(page.locator('#resAmount')).toHaveText('LRD 42,458');
  const colors = await page.locator('#resAmount').evaluate(node => ({
    foreground: getComputedStyle(node).color,
    background: getComputedStyle(document.body).backgroundColor
  }));
  expect(colors.foreground).not.toBe(colors.background);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test('Liberia PAYE server and page expose the reviewed privacy/source contract', async ({ page }) => {
  await page.goto('/liberia/lr-paye');
  const source = await page.locator('html').evaluate(() => document.documentElement.outerHTML);
  expect(source).not.toContain('pdf-leads');
  expect(source).not.toContain('gross_salary');
  expect(source).not.toContain('FAQPage');
  expect(source).not.toContain('/.netlify/functions/ai-advisor');
  expect(source).not.toContain('auto-email-gate');
  expect(source).not.toContain('Includes AI Advisor');
  await expect(page.getByText(/Last verified: 21 July 2026/i).first()).toBeVisible();
});
