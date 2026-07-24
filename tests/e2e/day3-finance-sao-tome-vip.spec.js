const { test, expect } = require('@playwright/test');

test('Sao Tome English payroll checker is correct, private and explicit about IRS', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  const consoleErrors = [];
  const nonGetRequests = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', request => {
    if (request.method() !== 'GET') nonGetRequests.push(`${request.method()} ${request.url()}`);
  });
  await page.addInitScript(() => {
    window.__sharedPayload = null;
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async payload => { window.__sharedPayload = payload; }
    });
  });
  await page.goto('/sao-tome/st-paye');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#grossSalary')).toHaveValue('');
  await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);
  await page.locator('#grossSalary').fill('10000');
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#afterInss')).toHaveText('STN 9,600.00');
  await expect(page.locator('#employeeInss')).toHaveText('STN 400.00');
  await expect(page.locator('#employerInss')).toHaveText('STN 600.00');
  await expect(page.locator('#employerCost')).toHaveText('STN 10,600.00');
  await expect(page.getByText('Not calculated', { exact: true })).toBeVisible();
  await expect(page.getByText('Before IRS. This is not final take-home pay.')).toBeVisible();

  const generatedPdf = await page.evaluate(async () => {
    const result = new Promise(resolve => {
      window.addEventListener('afro-pdf-generated', async event => {
        const bytes = new Uint8Array(await event.detail.blob.arrayBuffer());
        resolve({ fileName: event.detail.fileName, size: bytes.length, header: String.fromCharCode(...bytes.slice(0, 5)) });
      }, { once: true });
    });
    document.querySelector('#pdfBtn').click();
    return result;
  });
  expect(generatedPdf.fileName).toMatch(/sao-tome-inss/);
  expect(generatedPdf.header).toBe('%PDF-');
  expect(generatedPdf.size).toBeGreaterThan(1000);

  await page.locator('#shareBtn').click();
  expect(await page.evaluate(() => window.__sharedPayload)).toEqual({
    title: 'Sao Tome Payroll Contributions Checker',
    url: 'https://afrotools.com/sao-tome/st-paye'
  });

  const source = await page.locator('html').evaluate(node => node.outerHTML);
  expect(source).not.toContain('/.netlify/functions/ai-advisor');
  expect(source).not.toContain('pdf-leads');
  expect(source).not.toContain('gross_salary');
  expect(source).not.toContain('FAQPage');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  expect(nonGetRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('Sao Tome French route is a clean noindex evidence handoff', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.goto('/fr/sao-tome/st-paye');

  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/fr/sao-tome/st-paye');
  await expect(page.getByRole('heading', { name: 'Le calcul IRS reste suspendu' })).toBeVisible();
  await expect(page.getByText('INSS salarié : 4 %')).toBeVisible();
  await expect(page.getByText('INSS employeur : 6 %')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ouvrir l’outil INSS en anglais' })).toHaveAttribute('href', '/sao-tome/st-paye');
  const source = await page.locator('html').evaluate(node => node.outerHTML);
  expect(source).not.toMatch(/Ã.|â€|Â/);
  expect(source).not.toContain('/.netlify/functions/ai-advisor');
  expect(source).not.toContain('gross_salary');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  expect(consoleErrors).toEqual([]);
});

test('Sao Tome Swahili checker matches the verified engine and export contract', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const consoleErrors = [];
  const nonGetRequests = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', request => {
    if (request.method() !== 'GET') nonGetRequests.push(`${request.method()} ${request.url()}`);
  });
  await page.addInitScript(() => {
    window.__sharedPayload = null;
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async payload => { window.__sharedPayload = payload; }
    });
  });
  await page.goto('/sw/sao-tome/kikokotoo-kodi-mshahara/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/sao-tome/kikokotoo-kodi-mshahara/');
  await expect(page.locator('#grossSalary')).toHaveValue('');
  await page.locator('#grossSalary').fill('10000');
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#afterInss')).toContainText('9,600.00');
  await expect(page.locator('#employeeInss')).toContainText('400.00');
  await expect(page.locator('#employerInss')).toContainText('600.00');
  await expect(page.locator('#employerCost')).toContainText('10,600.00');
  await expect(page.getByText('Haijakokotolewa', { exact: true })).toBeVisible();

  const generatedPdf = await page.evaluate(async () => {
    const result = new Promise(resolve => {
      window.addEventListener('afro-pdf-generated', async event => {
        const bytes = new Uint8Array(await event.detail.blob.arrayBuffer());
        resolve({ fileName: event.detail.fileName, size: bytes.length, header: String.fromCharCode(...bytes.slice(0, 5)) });
      }, { once: true });
    });
    document.querySelector('#pdfBtn').click();
    return result;
  });
  expect(generatedPdf.fileName).toMatch(/sao-tome-inss-sw/);
  expect(generatedPdf.header).toBe('%PDF-');
  expect(generatedPdf.size).toBeGreaterThan(1000);

  await page.locator('#shareBtn').click();
  expect(await page.evaluate(() => window.__sharedPayload)).toEqual({
    title: 'Kikagua Michango ya Mshahara São Tomé',
    url: 'https://afrotools.com/sw/sao-tome/kikokotoo-kodi-mshahara/'
  });
  const source = await page.locator('html').evaluate(node => node.outerHTML);
  expect(source).not.toContain('/.netlify/functions/ai-advisor');
  expect(source).not.toContain('pdf-leads');
  expect(source).not.toContain('gross_salary');
  expect(source).not.toContain('openPayePdfModal');
  expect(source).not.toContain('FAQPage');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  expect(nonGetRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('Sao Tome widget is responsive and refuses to invent IRS', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const consoleErrors = [];
  const nonGetRequests = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', request => {
    if (request.method() !== 'GET') nonGetRequests.push(`${request.method()} ${request.url()}`);
  });
  await page.goto('/widgets/iframe/financial-sao-tome-paye.html?theme=dark');

  await expect(page.locator('#awStGross')).toHaveValue('');
  await expect(page.locator('#awStResult')).toBeEmpty();
  await expect(page.getByText('IRS is not calculated.')).toBeVisible();
  await page.locator('#awStGross').fill('10000');
  await page.locator('#awStCalc').click();
  await expect(page.locator('.aw-result-main')).toHaveText('STN 9,600.00');
  await expect(page.getByText('STN 400.00')).toBeVisible();
  await expect(page.getByText('STN 600.00')).toBeVisible();
  await expect(page.getByText('STN 10,600.00')).toBeVisible();
  await expect(page.getByText('Not final take-home pay')).toBeVisible();
  await expect(page.getByText('Not calculated', { exact: true })).toBeVisible();
  const source = await page.locator('html').evaluate(node => node.outerHTML);
  expect(source).not.toMatch(/Ã.|â€|Â/);
  expect(source).not.toContain('PAYE Tax');
  expect(source).not.toContain('DGTF 2025');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(nonGetRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
