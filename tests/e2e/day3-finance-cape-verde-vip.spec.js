const { test, expect } = require('@playwright/test');

test('Cape Verde PAYE is formula-correct, private and responsive', async ({ page }) => {
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
  await page.goto('/cape-verde/cv-paye');

  await expect(page.locator('#grossSalary')).toHaveValue('');
  await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);
  await page.locator('#grossSalary').fill('80000');
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#netMonthly')).toHaveText('CVE 67,125');
  await expect(page.locator('#taxMonthly')).toHaveText('CVE 6,075');
  await expect(page.locator('#employeeInps')).toHaveText('CVE 6,800');
  await expect(page.locator('#employerInps')).toHaveText('CVE 12,800');
  await expect(page.locator('#employerCost')).toHaveText('CVE 92,800');

  await page.locator('#regime').selectOption('DOMESTIC');
  await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#netMonthly')).toHaveText('CVE 67,525');
  await expect(page.locator('#employeeInps')).toHaveText('CVE 6,400');
  await expect(page.locator('#employerInps')).toHaveText('CVE 12,000');
  await expect(page.locator('#employerCost')).toHaveText('CVE 92,000');

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
  expect(generatedPdf.fileName).toMatch(/cape-verde-paye/);
  expect(generatedPdf.header).toBe('%PDF-');
  expect(generatedPdf.size).toBeGreaterThan(1000);

  await page.locator('#shareBtn').click();
  expect(await page.evaluate(() => window.__sharedPayload)).toEqual({
    title: 'Cape Verde PAYE Calculator',
    url: 'https://afrotools.com/cape-verde/cv-paye'
  });

  await page.locator('#grossSalary').fill('0');
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  expect(nonGetRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('Cape Verde PAYE has readable dark mode and reviewed sources', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/cape-verde/cv-paye');
  await page.locator('#grossSalary').fill('36607');
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#taxMonthly')).toHaveText('CVE 100');
  const presentation = await page.locator('#netMonthly').evaluate(node => ({
    foreground: getComputedStyle(node).color,
    background: getComputedStyle(document.body).backgroundColor,
    width: document.documentElement.scrollWidth,
    source: document.documentElement.outerHTML
  }));
  expect(presentation.foreground).not.toBe(presentation.background);
  expect(presentation.width).toBeLessThanOrEqual(375);
  expect(presentation.source).not.toContain('pdf-leads');
  expect(presentation.source).not.toContain('/.netlify/functions/ai-advisor');
  expect(presentation.source).not.toContain('auto-email-gate');
  expect(presentation.source).not.toContain('FAQPage');
  await expect(page.getByRole('link', { name: 'DNRE employee withholding guidance' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'INPS contribution obligations' })).toBeVisible();
});

test('French Cape Verde PAYE matches the official engine and privacy contract', async ({ page }) => {
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
  await page.goto('/fr/cape-verde/cv-paye/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/fr/cape-verde/cv-paye/');
  await expect(page.locator('#grossSalary')).toHaveValue('');
  await page.locator('#grossSalary').fill('36607');
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#taxMonthly')).toHaveText('100 CVE');

  await page.locator('#grossSalary').fill('100000');
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#taxMonthly')).toHaveText('10 275 CVE');
  await expect(page.locator('#employeeInps')).toHaveText('8 500 CVE');
  await expect(page.locator('#netMonthly')).toHaveText('81 225 CVE');
  await expect(page.locator('#employerInps')).toHaveText('16 000 CVE');
  await expect(page.locator('#employerCost')).toHaveText('116 000 CVE');

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
  expect(generatedPdf.fileName).toMatch(/cap-vert-irps/);
  expect(generatedPdf.header).toBe('%PDF-');
  expect(generatedPdf.size).toBeGreaterThan(1000);

  await page.locator('#shareBtn').click();
  expect(await page.evaluate(() => window.__sharedPayload)).toEqual({
    title: 'Calculateur IRPS Cap-Vert',
    url: 'https://afrotools.com/fr/cape-verde/cv-paye/'
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  const source = await page.locator('html').evaluate(node => node.outerHTML);
  expect(source).not.toContain('pdf-leads');
  expect(source).not.toContain('/.netlify/functions/ai-advisor');
  expect(source).not.toContain('FAQPage');
  expect(nonGetRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('Swahili Cape Verde PAYE matches the official engine and export contract', async ({ page }) => {
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
  await page.goto('/sw/cape-verde/kikokotoo-kodi-mshahara/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/cape-verde/kikokotoo-kodi-mshahara/');
  await expect(page.locator('#grossSalary')).toHaveValue('');
  await page.locator('#grossSalary').fill('100000');
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#taxMonthly')).toHaveText('CVE 10,275');
  await expect(page.locator('#employeeInps')).toHaveText('CVE 8,500');
  await expect(page.locator('#netMonthly')).toHaveText('CVE 81,225');
  await expect(page.locator('#employerInps')).toHaveText('CVE 16,000');
  await expect(page.locator('#employerCost')).toHaveText('CVE 116,000');

  await page.locator('#regime').selectOption('DOMESTIC');
  await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#employeeInps')).toHaveText('CVE 8,000');
  await expect(page.locator('#netMonthly')).toHaveText('CVE 81,725');
  await expect(page.locator('#employerInps')).toHaveText('CVE 15,000');

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
  expect(generatedPdf.fileName).toMatch(/cabo-verde-irps/);
  expect(generatedPdf.header).toBe('%PDF-');
  expect(generatedPdf.size).toBeGreaterThan(1000);

  await page.locator('#shareBtn').click();
  expect(await page.evaluate(() => window.__sharedPayload)).toEqual({
    title: 'Kikokotoo cha IRPS Cabo Verde',
    url: 'https://afrotools.com/sw/cape-verde/kikokotoo-kodi-mshahara/'
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  const source = await page.locator('html').evaluate(node => node.outerHTML);
  expect(source).not.toContain('/.netlify/functions/ai-advisor');
  expect(source).not.toContain('openPayePdfModal');
  expect(source).not.toContain('FAQPage');
  expect(nonGetRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
