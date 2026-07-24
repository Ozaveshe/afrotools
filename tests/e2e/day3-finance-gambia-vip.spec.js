const { test, expect } = require('@playwright/test');

test('Gambia PAYE is formula-correct, private and responsive', async ({ page }) => {
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
  await page.goto('/gambia/gm-paye');

  await expect(page.locator('#grossSalary')).toHaveValue('');
  await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);
  await page.locator('#grossSalary').fill('50000');
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#netMonthly')).toHaveText('GMD 36,166.67');
  await expect(page.locator('#payeMonthly')).toHaveText('GMD 11,333.33');
  await expect(page.locator('#employeePension')).toHaveText('GMD 2,500.00');
  await expect(page.locator('#employerPension')).toHaveText('GMD 5,000.00');
  await expect(page.locator('#iicfResult')).toHaveText('GMD 15.00');
  await expect(page.locator('#employerCost')).toHaveText('GMD 55,015.00');
  await expect(page.locator('#resultsCard')).toHaveClass(/\bon\b/);

  await page.locator('#scheme').selectOption('FPS');
  await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#netMonthly')).toHaveText('GMD 38,666.67');
  await expect(page.locator('#employeePension')).toHaveText('GMD 0.00');
  await expect(page.locator('#employerPension')).toHaveText('GMD 7,500.00');
  await expect(page.locator('#employerCost')).toHaveText('GMD 57,515.00');

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
    document.querySelector('#pdfBtn').click();
    return result;
  });
  expect(generatedPdf.fileName).toMatch(/gambia-paye/);
  expect(generatedPdf.header).toBe('%PDF-');
  expect(generatedPdf.size).toBeGreaterThan(1000);

  await page.locator('#shareBtn').click();
  const sharedPayload = await page.evaluate(() => window.__sharedPayload);
  expect(sharedPayload).toEqual({
    title: 'Gambia PAYE Calculator',
    url: 'https://afrotools.com/gambia/gm-paye'
  });
  expect(JSON.stringify(sharedPayload)).not.toContain('50000');

  await page.locator('#grossSalary').fill('0');
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  expect(nonGetRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('Gambia PAYE has a readable dark presentation and reviewed source contract', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/gambia/gm-paye');
  await page.locator('#grossSalary').fill('50000');
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#netMonthly')).toHaveText('GMD 36,166.67');

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
  await expect(page.getByRole('link', { name: 'GRA PAYE calculator' })).toBeVisible();
  await expect(page.getByText(/effective from January 2018/i)).toBeVisible();
});

test('French Gambia PAYE is localized, formula-correct, private and responsive', async ({ page }) => {
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
  await page.goto('/fr/gambia/gm-paye');

  const normalized = async selector => (await page.locator(selector).textContent()).replace(/[\s\u202f\u00a0]+/g, ' ').trim();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('heading', { name: 'Calculateur PAYE en Gambie' })).toBeVisible();
  await expect(page.locator('#grossSalary')).toHaveValue('');
  await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);

  await page.locator('#grossSalary').fill('50000');
  await page.locator('#calculateBtn').click();
  expect(await normalized('#netMonthly')).toBe('GMD 36 166,67');
  expect(await normalized('#payeMonthly')).toBe('GMD 11 333,33');
  expect(await normalized('#employeePension')).toBe('GMD 2 500,00');
  expect(await normalized('#employerPension')).toBe('GMD 5 000,00');
  expect(await normalized('#iicfResult')).toBe('GMD 15,00');
  expect(await normalized('#employerCost')).toBe('GMD 55 015,00');
  await expect(page.locator('#resultsCard')).toHaveClass(/\bon\b/);

  await page.locator('#scheme').selectOption('FPS');
  await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);
  await page.locator('#calculateBtn').click();
  expect(await normalized('#netMonthly')).toBe('GMD 38 666,67');
  expect(await normalized('#employeePension')).toBe('GMD 0,00');
  expect(await normalized('#employerPension')).toBe('GMD 7 500,00');
  expect(await normalized('#employerCost')).toBe('GMD 57 515,00');

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
  expect(generatedPdf.fileName).toMatch(/paye-gambie/);
  expect(generatedPdf.header).toBe('%PDF-');
  expect(generatedPdf.size).toBeGreaterThan(1000);

  await page.locator('#shareBtn').click();
  expect(await page.evaluate(() => window.__sharedPayload)).toEqual({ title: 'Calculateur PAYE Gambie', url: 'https://afrotools.com/fr/gambia/gm-paye' });
  await page.locator('#grossSalary').fill('0');
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);

  const presentation = await page.locator('#status').evaluate(node => ({
    foreground: getComputedStyle(node).color,
    background: getComputedStyle(document.body).backgroundColor,
    width: document.documentElement.scrollWidth,
    source: document.documentElement.outerHTML
  }));
  expect(presentation.foreground).not.toBe(presentation.background);
  expect(presentation.width).toBeLessThanOrEqual(375);
  expect(presentation.source).not.toContain('/.netlify/functions/ai-advisor');
  expect(presentation.source).not.toContain('pdf-leads');
  expect(presentation.source).not.toMatch(/\bfetch\s*\(/);
  await expect(page.getByRole('link', { name: 'Calculateur PAYE de la GRA' })).toBeVisible();
  await expect(page.getByText(/applicables depuis janvier 2018/i)).toBeVisible();
  expect(nonGetRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('Swahili Gambia PAYE is localized, formula-correct, private and responsive', async ({ page }) => {
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
  await page.goto('/sw/gambia/kikokotoo-kodi-mshahara/');

  const normalized = async selector => (await page.locator(selector).textContent()).replace(/[\s\u202f\u00a0]+/g, ' ').trim();
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.getByRole('heading', { name: 'Kikokotoo cha PAYE Gambia' })).toBeVisible();
  await expect(page.locator('#grossSalary')).toHaveValue('');
  await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);

  await page.locator('#grossSalary').fill('50000');
  await page.locator('#calculateBtn').click();
  expect(await normalized('#netMonthly')).toBe('GMD 36,166.67');
  expect(await normalized('#payeMonthly')).toBe('GMD 11,333.33');
  expect(await normalized('#employeePension')).toBe('GMD 2,500.00');
  expect(await normalized('#employerPension')).toBe('GMD 5,000.00');
  expect(await normalized('#iicfResult')).toBe('GMD 15.00');
  expect(await normalized('#employerCost')).toBe('GMD 55,015.00');
  await expect(page.locator('#resultsCard')).toHaveClass(/\bon\b/);

  await page.locator('#scheme').selectOption('FPS');
  await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);
  await page.locator('#calculateBtn').click();
  expect(await normalized('#netMonthly')).toBe('GMD 38,666.67');
  expect(await normalized('#employeePension')).toBe('GMD 0.00');
  expect(await normalized('#employerPension')).toBe('GMD 7,500.00');
  expect(await normalized('#employerCost')).toBe('GMD 57,515.00');

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
  expect(generatedPdf.fileName).toMatch(/paye-gambia-sw/);
  expect(generatedPdf.header).toBe('%PDF-');
  expect(generatedPdf.size).toBeGreaterThan(1000);

  await page.locator('#shareBtn').click();
  const sharedPayload = await page.evaluate(() => window.__sharedPayload);
  expect(sharedPayload).toEqual({ title: 'Kikokotoo cha PAYE Gambia', url: 'https://afrotools.com/sw/gambia/kikokotoo-kodi-mshahara/' });
  expect(JSON.stringify(sharedPayload)).not.toContain('50000');

  await page.locator('#grossSalary').fill('0');
  await page.locator('#calculateBtn').click();
  await expect(page.locator('#resultsCard')).not.toHaveClass(/\bon\b/);

  const presentation = await page.locator('#status').evaluate(node => ({
    foreground: getComputedStyle(node).color,
    background: getComputedStyle(document.body).backgroundColor,
    width: document.documentElement.scrollWidth,
    source: document.documentElement.outerHTML
  }));
  expect(presentation.foreground).not.toBe(presentation.background);
  expect(presentation.width).toBeLessThanOrEqual(375);
  expect(presentation.source).not.toContain('/.netlify/functions/ai-advisor');
  expect(presentation.source).not.toContain('pdf-leads');
  expect(presentation.source).not.toMatch(/\bfetch\s*\(/);
  await expect(page.getByRole('link', { name: 'Kikokotoo cha PAYE cha GRA' })).toBeVisible();
  await expect(page.getByText(/tangu Januari 2018/i)).toBeVisible();
  expect(nonGetRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
