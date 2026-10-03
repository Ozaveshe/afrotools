const { test, expect } = require('@playwright/test');

async function protectAudit(page, baseURL, chartMode = 'available') {
  const origin = new URL(baseURL).origin;
  const writes = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) {
      writes.push({ path: url.pathname, method: request.method() });
      return route.abort();
    }
    if (url.href === 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js') {
      return chartMode === 'available' ? route.continue() : route.abort();
    }
    if (url.origin === origin && !/^\/(?:api\/|\.netlify\/functions\/)/.test(url.pathname)) return route.continue();
    return route.fulfill({ status: 204, body: '', contentType: /\.js$/.test(url.pathname) ? 'application/javascript' : 'text/plain' });
  });
  await page.addInitScript(() => {
    localStorage.setItem('aft_theme', 'light');
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    window.AFROTOOLS_TEST_DISABLE_ANALYTICS = true;
    window.__chartPaint = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
      if (this.canvas.id === 'mainChart') {
        window.__chartPaint.push({ text: String(text), color: this.fillStyle });
        if (window.__chartPaint.length > 5000) window.__chartPaint.splice(0, 2500);
      }
      return original.call(this, text, ...args);
    };
  });
  return { writes, errors };
}

async function selectTheme(page, width, theme) {
  if (await page.locator('html').getAttribute('data-theme') === theme) return;
  if (width < 768) await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.getByRole('button', { name: `Switch to ${theme} mode`, exact: true }).press('Space');
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  if (width < 768) {
    await page.keyboard.press('Escape');
    await expect(page.locator('afro-navbar .mob')).toBeHidden();
  }
}

async function chartSnapshot(page) {
  return page.evaluate(() => {
    const chart = window.Chart.getChart(document.getElementById('mainChart'));
    return {
      type: chart.config.type,
      labels: chart.data.labels,
      data: chart.data.datasets.map(dataset => dataset.data),
      result: JSON.stringify(RESULT),
      ledger: document.getElementById('resContent').textContent,
      takeHome: document.getElementById('resAmount').textContent
    };
  });
}

async function expectReadableInputs(page, theme, testInfo) {
  const samples = await page.locator('.tool-main-inner .f-prefix, .tool-main-inner .f-hint, .tool-main-inner .tog:not(.on) .tog-label, .tool-main-inner .tog:not(.on) .tog-rate, #employerStrip, #employerStrip strong').evaluateAll(elements => elements.map(element => {
    const rgb = value => value.match(/[\d.]+/g).map(Number);
    const chain = []; let current = element;
    while (current) { chain.unshift(current); current = current.parentElement; }
    let background = [255, 255, 255];
    for (const node of chain) {
      const color = rgb(getComputedStyle(node).backgroundColor);
      const alpha = color[3] === undefined ? 1 : color[3];
      background = color.slice(0, 3).map((value, index) => value * alpha + background[index] * (1 - alpha));
    }
    const luminance = values => values.slice(0, 3).map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const foreground = rgb(getComputedStyle(element).color);
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return { text: element.textContent, foreground, background, ratio: (values[0] + 0.05) / (values[1] + 0.05) };
  }));
  await testInfo.attach(`${theme}-input-readability`, { body: JSON.stringify(samples, null, 2), contentType: 'application/json' });
  expect(samples.length).toBeGreaterThanOrEqual(3);
  for (const sample of samples) expect(sample.ratio, `${sample.text} in ${theme}`).toBeGreaterThanOrEqual(4.5);
}

async function expectReadableCanvas(page, chartType, theme, testInfo) {
  await expect.poll(() => page.evaluate(chartType => {
    const chart = window.Chart.getChart(document.getElementById('mainChart'));
    return chart && chart.config.type === chartType && !chart.animating;
  }, chartType)).toBe(true);
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(animation =>
    animation.playState === 'running' && Number.isFinite(animation.effect.getComputedTiming().endTime)
  ).length)).toBe(0);
  // Paint the existing real Chart.js canvas without changing its data or options.
  const audit = await page.evaluate(() => {
    window.__chartPaint = [];
    const canvas = document.getElementById('mainChart');
    const chart = window.Chart.getChart(canvas);
    chart.draw();
    const rgb = value => {
      if (value.startsWith('#')) return value.slice(1).match(/.{2}/g).map(channel => parseInt(channel, 16));
      return value.match(/[\d.]+/g).map(Number);
    };
    const chain = []; let node = canvas;
    while (node) { chain.unshift(node); node = node.parentElement; }
    let background = [255, 255, 255];
    for (const element of chain) {
      const color = rgb(getComputedStyle(element).backgroundColor);
      const alpha = color[3] === undefined ? 1 : color[3];
      background = color.slice(0, 3).map((value, index) => value * alpha + background[index] * (1 - alpha));
    }
    const luminance = values => values.slice(0, 3).map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const painted = window.__chartPaint.map(item => {
      const values = [luminance(rgb(item.color)), luminance(background)].sort((a, b) => b - a);
      return { ...item, ratio: (values[0] + 0.05) / (values[1] + 0.05) };
    });
    return { version: window.Chart.version, background, painted, width: innerWidth, documentWidth: document.documentElement.scrollWidth };
  });
  await testInfo.attach(`${theme}-${chartType}-real-canvas`, { body: JSON.stringify(audit, null, 2), contentType: 'application/json' });
  expect(audit.version).toBe('4.4.1');
  expect(audit.painted.length).toBeGreaterThan(0);
  for (const label of audit.painted) expect(label.ratio, `${label.text} on ${theme} canvas`).toBeGreaterThanOrEqual(4.5);
  expect(audit.documentWidth).toBeLessThanOrEqual(audit.width + 1);
  if (chartType === 'doughnut') expect(audit.painted.map(item => item.text)).toEqual(expect.arrayContaining(['Take-Home', 'PAYE Tax', 'NSSF']));
  if (chartType === 'bar') expect(audit.painted.some(item => item.text.startsWith('UGX'))).toBe(true);
}

for (const [width, systemTheme] of [[320, 'light'], [390, 'dark'], [1280, 'light'], [1280, 'dark']]) {
  test(`real Uganda charts follow keyboard themes and preserve results at ${width}px ${systemTheme}`, async ({ page, baseURL }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ colorScheme: systemTheme, reducedMotion: 'reduce' });
    const guard = await protectAudit(page, baseURL);
    await page.goto('/uganda/ug-paye', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('afro-navbar #themeToggle')).toBeAttached();
    await expect.poll(() => page.evaluate(() => window.Chart?.version)).toBe('4.4.1');
    await page.getByRole('button', { name: /Calculate Take-Home Pay/ }).press('Enter');
    await expect(page.locator('#resAmount')).toContainText('1,086,750');
    const baseline = await chartSnapshot(page);
    for (const theme of ['dark', 'light', 'dark']) {
      await selectTheme(page, width, theme);
      await page.getByRole('button', { name: 'Breakdown', exact: true }).press('Enter');
      await expectReadableCanvas(page, 'doughnut', theme, testInfo);
      await expectReadableInputs(page, theme, testInfo);
      expect(await chartSnapshot(page)).toEqual(baseline);
      await page.getByRole('button', { name: 'Tax Bands', exact: true }).press('Enter');
      await expectReadableCanvas(page, 'bar', theme, testInfo);
      const bands = await chartSnapshot(page);
      expect(bands.result).toBe(baseline.result);
      expect(bands.ledger).toBe(baseline.ledger);
      expect(bands.takeHome).toBe(baseline.takeHome);
      expect(bands.data[0].every(value => Number.isFinite(value) && value > 0)).toBe(true);
    }
    // Verify the visible chart is also repainted when the theme changes in place.
    const barBefore = await chartSnapshot(page);
    await selectTheme(page, width, 'light');
    await expectReadableCanvas(page, 'bar', 'light', testInfo);
    expect(await chartSnapshot(page)).toEqual(barBefore);
    expect(guard.writes).toEqual([]);
    expect(guard.errors).toEqual([]);
  });
}

test('Uganda numeric results and PDF action remain available without the optional chart CDN', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  const guard = await protectAudit(page, baseURL, 'unavailable');
  await page.goto('/uganda/ug-paye');
  await page.getByRole('button', { name: /Calculate Take-Home Pay/ }).press('Enter');
  await expect(page.locator('#resAmount')).toContainText('1,086,750');
  await expect(page.locator('.chart-section')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Download PDF', exact: true })).toBeEnabled();
  expect(guard.writes).toEqual([]);
  expect(guard.errors).toEqual([]);
});

test('native print uses readable chart ink and restores the night chart without changing results', async ({ page, baseURL }, testInfo) => {
  const fs = require('node:fs');
  const pdfParse = require('pdf-parse');
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  const guard = await protectAudit(page, baseURL);
  await page.goto('/uganda/ug-paye');
  await expect.poll(() => page.evaluate(() => window.Chart?.version)).toBe('4.4.1');
  await page.getByRole('button', { name: /Calculate Take-Home Pay/ }).press('Enter');
  await selectTheme(page, 1280, 'dark');
  for (const [button, chartType] of [['Breakdown', 'doughnut'], ['Tax Bands', 'bar']]) {
    await page.getByRole('button', { name: button, exact: true }).press('Enter');
    await expectReadableCanvas(page, chartType, 'dark', testInfo);
    const before = await chartSnapshot(page);
    await page.evaluate(() => {
      window.__chartPaint = [];
      window.addEventListener('beforeprint', () => {
        const strip = document.getElementById('employerStrip');
        window.__employerPrint = { background: getComputedStyle(strip).backgroundColor, body: getComputedStyle(strip).color, heading: getComputedStyle(strip.querySelector('strong')).color };
      }, { once: true });
    });
    const file = testInfo.outputPath(`public-example-${chartType}-print.pdf`);
    await page.pdf({ path: file, format: 'A4', printBackground: true });
    const printPaint = await page.evaluate(() => window.__chartPaint.filter(item => item.color === '#475569'));
    expect(printPaint.length).toBeGreaterThan(0);
    if (chartType === 'doughnut') expect(printPaint.map(item => item.text)).toEqual(expect.arrayContaining(['Take-Home', 'PAYE Tax', 'NSSF']));
    if (chartType === 'bar') expect(printPaint.some(item => item.text.startsWith('UGX'))).toBe(true);
    const parsed = await pdfParse(fs.readFileSync(file));
    expect(parsed.numpages).toBeGreaterThan(0);
    expect(parsed.text).toContain('1,086,750');
    expect(parsed.text).toContain('1,650,000');
    const printInk = await page.evaluate(() => window.__employerPrint);
    const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    for (const color of [printInk.body, printInk.heading]) {
      const values = [luminance(color), luminance(printInk.background)].sort((a, b) => b - a);
      expect((values[0] + 0.05) / (values[1] + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
    await testInfo.attach(`${chartType}-employer-native-print-ink`, { body: JSON.stringify(printInk), contentType: 'application/json' });
    await testInfo.attach(`${chartType}-native-print`, { body: JSON.stringify({ pages: parsed.numpages, printPaint }, null, 2), contentType: 'application/json' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expectReadableCanvas(page, chartType, 'dark', testInfo);
    expect(await chartSnapshot(page)).toEqual(before);
  }
  expect(guard.writes).toEqual([]);
  expect(guard.errors).toEqual([]);
});
