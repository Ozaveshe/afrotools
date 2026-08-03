const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');
const receipt = require('../../reports/sw-ecommerce-acceptance/pricing-foundations.json');

const ROUTES = [
  '/sw/zana/kikokotoo-margin-ya-faida/',
  '/sw/zana/kikokotoo-markup/',
  '/sw/zana/kikokotoo-discount/'
];

const CONTRAST_TARGETS = {
  '/sw/zana/kikokotoo-margin-ya-faida/': '#pmForm input, #pmForm button',
  '/sw/zana/kikokotoo-markup/': '#mcForm input, #mcForm textarea, #mcForm button',
  '/sw/zana/kikokotoo-discount/': '#discountPlannerRoot input, #discountPlannerRoot button'
};

const THEME_VARIANTS = [
  { name: 'light', scheme: 'light', stored: 'light', expected: 'light' },
  { name: 'dark', scheme: 'light', stored: 'dark', expected: 'dark' },
  { name: 'system-light', scheme: 'light', stored: null, expected: 'light' },
  { name: 'system-dark', scheme: 'dark', stored: null, expected: 'dark' }
];

async function prepare(page) {
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText(text) { window.__afrotoolsCopied = text; return Promise.resolve(); } }
    });
  });
}

function diagnostics(page) {
  const errors = [];
  const writes = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', error => errors.push(`page: ${error.message}`));
  page.on('requestfailed', request => {
    if (new URL(request.url()).origin === 'http://127.0.0.1:4173') errors.push(`request: ${request.url()}`);
  });
  page.on('response', response => {
    if (new URL(response.url()).origin === 'http://127.0.0.1:4173' && response.status() >= 400) errors.push(`response ${response.status()}: ${response.url()}`);
  });
  page.on('request', request => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
  });
  return { errors, writes };
}

async function assertNoOverflow(page) {
  const offenders = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return [...document.querySelectorAll('body *')].map(node => {
      const rect = node.getBoundingClientRect();
      return { node: `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}`, left: rect.left, right: rect.right };
    }).filter(item => !item.node.includes('skip-link') && item.left > -1000 && (item.left < -1 || item.right > width + 1)).slice(0, 20);
  });
  expect(offenders).toEqual([]);
}

async function exposeAllAppControls(page, route) {
  if (route.includes('margin-ya-faida')) {
    await page.locator('#pmRevenue').fill('150');
    await page.locator('#pmCogs').fill('100');
    await page.locator('#pmForm button[type=submit]').click();
    return;
  }
  if (route.includes('markup')) {
    await page.locator('#mcCost').fill('100');
    await page.locator('#mcPercentage').fill('50');
    await page.locator('#mcForm button[type=submit]').click();
    await page.locator('#mcFile').setInputFiles({ name: 'contrast.csv', mimeType: 'text/csv', buffer: Buffer.from('Product Name,Cost\nMkate,50') });
    await page.locator('#mcBatchMarkup').fill('20');
    await page.locator('#mcBatchProcess').click();
    return;
  }
  await page.locator('#unitPrice').fill('100');
  await page.locator('#addDiscount').click();
  await page.locator('#dcpForm button[type=submit]').click();
}

async function readAppContrast(page, selector) {
  return page.evaluate(async targetSelector => {
    function parseColor(value) {
      const text = String(value || '').trim().toLowerCase();
      if (text === 'transparent') return [0, 0, 0, 0];
      let match = text.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/);
      if (match) return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] == null ? 1 : Number(match[4])];
      match = text.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/);
      if (match) return [Number(match[1]) * 255, Number(match[2]) * 255, Number(match[3]) * 255, match[4] == null ? 1 : Number(match[4])];
      return null;
    }
    function blend(foreground, background) {
      const alpha = foreground[3] + background[3] * (1 - foreground[3]);
      if (!alpha) return [0, 0, 0, 0];
      return [0, 1, 2].map(index => ((foreground[index] * foreground[3]) + (background[index] * background[3] * (1 - foreground[3]))) / alpha).concat(alpha);
    }
    function luminance(color) {
      const channels = color.slice(0, 3).map(channel => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }
    function ratio(first, second) {
      const left = luminance(first);
      const right = luminance(second);
      return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
    }
    function backgroundFor(element) {
      const layers = [];
      for (let current = element; current; current = current.parentElement) {
        const color = parseColor(getComputedStyle(current).backgroundColor);
        if (color && color[3] > 0) layers.push(color);
      }
      let background = [255, 255, 255, 1];
      for (const layer of layers.reverse()) background = blend(layer, background);
      return background;
    }
    function label(element) {
      return element.id ? `#${element.id}` : `${element.tagName.toLowerCase()}.${[...element.classList].join('.')}`;
    }
    const visible = [...document.querySelectorAll(targetSelector)].filter(element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return !element.hidden && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    });
    const samples = [];
    for (const element of visible) {
      const style = getComputedStyle(element);
      const ownBackground = backgroundFor(element);
      const adjacentBackground = backgroundFor(element.parentElement || document.body);
      const foreground = parseColor(style.color);
      const border = parseColor(style.borderTopColor);
      const text = foreground ? ratio(blend(foreground, ownBackground), ownBackground) : 0;
      const borderContrast = border ? ratio(blend(border, adjacentBackground), adjacentBackground) : 0;
      const fillContrast = ratio(ownBackground, adjacentBackground);
      let focus = null;
      if (!element.disabled) {
        element.focus();
        await new Promise(resolve => requestAnimationFrame(resolve));
        const focused = getComputedStyle(element);
        const outline = parseColor(focused.outlineColor);
        focus = outline && focused.outlineStyle !== 'none' && Number.parseFloat(focused.outlineWidth) >= 2
          ? ratio(blend(outline, adjacentBackground), adjacentBackground)
          : 0;
      }
      samples.push({
        element: label(element),
        text: Number(text.toFixed(2)),
        boundary: Number(Math.max(borderContrast, fillContrast).toFixed(2)),
        focus: focus == null ? null : Number(focus.toFixed(2))
      });
    }
    return samples;
  }, selector);
}

test('app-owned controls meet computed text, boundary and focus contrast in every theme variant', async ({ page }) => {
  await prepare(page);
  const minima = {};
  for (const route of ROUTES) {
    minima[route] = { text: Infinity, boundary: Infinity, focus: Infinity };
    for (const variant of THEME_VARIANTS) {
      await page.emulateMedia({ colorScheme: variant.scheme, reducedMotion: 'reduce' });
      await page.goto(route);
      await page.evaluate(stored => {
        if (stored) localStorage.setItem('aft_theme', stored);
        else localStorage.removeItem('aft_theme');
      }, variant.stored);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', variant.expected);
      await exposeAllAppControls(page, route);
      const samples = await readAppContrast(page, CONTRAST_TARGETS[route]);
      expect(samples.length, `${route} ${variant.name} control samples`).toBeGreaterThan(0);
      for (const sample of samples) {
        expect(sample.text, `${route} ${variant.name} ${sample.element} text`).toBeGreaterThanOrEqual(4.5);
        expect(sample.boundary, `${route} ${variant.name} ${sample.element} boundary`).toBeGreaterThanOrEqual(3);
        if (sample.focus != null) expect(sample.focus, `${route} ${variant.name} ${sample.element} focus`).toBeGreaterThanOrEqual(3);
        minima[route].text = Math.min(minima[route].text, sample.text);
        minima[route].boundary = Math.min(minima[route].boundary, sample.boundary);
        if (sample.focus != null) minima[route].focus = Math.min(minima[route].focus, sample.focus);
      }
    }
  }
  const receiptMinima = receipt.proof.computedContrastMinima;
  expect(minima['/sw/zana/kikokotoo-margin-ya-faida/']).toEqual({
    text: receiptMinima['profit-margin'].text,
    boundary: receiptMinima['profit-margin'].controlBoundary,
    focus: receiptMinima['profit-margin'].focusIndicator
  });
  expect(minima['/sw/zana/kikokotoo-markup/']).toEqual({
    text: receiptMinima['markup-calc'].text,
    boundary: receiptMinima['markup-calc'].controlBoundary,
    focus: receiptMinima['markup-calc'].focusIndicator
  });
  expect(minima['/sw/zana/kikokotoo-discount/']).toEqual({
    text: receiptMinima['discount-calc'].text,
    boundary: receiptMinima['discount-calc'].controlBoundary,
    focus: receiptMinima['discount-calc'].focusIndicator
  });
  console.log(`SW_ECOMMERCE_PRICING_CONTRAST=${JSON.stringify(minima)}`);
});

test('all three Swahili pricing apps reflow at 320/375, 200%, and light/dark themes', async ({ page }) => {
  await prepare(page);
  const observed = diagnostics(page);
  for (const route of ROUTES) {
    for (const item of [
      { width: 320, scheme: 'dark', scale: true },
      { width: 375, scheme: 'light', scale: false }
    ]) {
      await page.setViewportSize({ width: item.width, height: 900 });
      await page.emulateMedia({ colorScheme: item.scheme, reducedMotion: 'reduce' });
      await page.goto(route);
      if (item.scale) await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      else await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); });
      await assertNoOverflow(page);
      const unlabeled = await page.locator('input, textarea, select').evaluateAll(nodes => nodes.filter(node => node.type !== 'hidden' && node.offsetParent !== null && (!node.labels || !node.labels.length) && !node.getAttribute('aria-label')).map(node => ({ id: node.id, type: node.type, name: node.name })));
      expect(unlabeled).toEqual([]);
      await expect(page.locator('[role="status"][aria-live]').first()).toBeAttached();
      const productInput = route.includes('margin-ya-faida')
        ? page.locator('#pmUnit')
        : route.includes('markup')
          ? page.locator('#mcUnit')
          : page.locator('#currencyLabel');
      await productInput.focus();
      await expect(productInput).toBeFocused();
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement !== document.body && document.activeElement.matches('input, button, textarea, select, a'))).toBe(true);
    }
  }
  expect(observed.errors).toEqual([]);
  expect(observed.writes).toEqual([]);
});

test('Swahili profit margin clears stale output and reopens PDF and CSV exports', async ({ page }) => {
  await prepare(page);
  const observed = diagnostics(page);
  await page.goto(ROUTES[0]);
  await page.locator('#pmUnit').fill('KES');
  await page.locator('#pmRevenue').fill('150');
  await page.locator('#pmCogs').fill('100');
  await page.locator('#pmRevenue').press('Enter');
  await expect(page.locator('#pmMargin')).toHaveText('33.33%');

  let pending = page.waitForEvent('download');
  await page.locator('#pmPdf').click();
  let download = await pending;
  const parsed = await pdfParse(fs.readFileSync(await download.path()));
  expect(parsed.text).toContain('Kikokotoo cha margin ya faida');
  expect(parsed.text).toContain('Margin ghafi: 33.33%');
  expect(parsed.text).toMatch(/Hakuna\s+kiwango\s+cha\s+kodi/);

  pending = page.waitForEvent('download');
  await page.locator('#pmCsv').click();
  download = await pending;
  const csv = fs.readFileSync(await download.path(), 'utf8');
  expect(csv).toContain('"Mapato","150"');
  expect(csv).toContain('"Margin ghafi","33.33%"');

  await page.locator('#pmRevenue').fill('');
  await expect(page.locator('#pmResult')).not.toHaveClass(/on/);
  await expect(page.locator('#pmProfit')).toHaveText('');
  expect(observed.errors).toEqual([]);
  expect(observed.writes).toEqual([]);
});

test('Swahili markup clears result, comparison and batch output and reopens every CSV/PDF', async ({ page }) => {
  await prepare(page);
  const observed = diagnostics(page);
  await page.goto(ROUTES[1]);
  await page.locator('#mcUnit').fill('KES');
  await page.locator('#mcCost').fill('100');
  await page.locator('#mcPercentage').fill('50');
  await page.locator('#mcPercentage').press('Enter');
  await expect(page.locator('#mcSelling')).toContainText('150');

  let pending = page.waitForEvent('download');
  await page.locator('#mcPdf').click();
  let download = await pending;
  const parsed = await pdfParse(fs.readFileSync(await download.path()));
  expect(parsed.text).toContain('Kikokotoo cha markup na bei ya kuuza');
  expect(parsed.text).toContain('Bei ya kuuza: 150');
  expect(parsed.text).toMatch(/Hakuna\s+ubadilishaji,\s+kodi/);

  pending = page.waitForEvent('download');
  await page.locator('#mcCsv').click();
  download = await pending;
  expect(fs.readFileSync(await download.path(), 'utf8')).toContain('"Bei ya kuuza","150"');

  await page.locator('#mcCompare').fill('10, 50');
  await page.locator('#mcCompareButton').click();
  await expect(page.locator('#mcCompareTable tbody tr')).toHaveCount(2);
  await page.locator('#mcCost').fill('110');
  await expect(page.locator('#mcCompareTable')).toBeHidden();

  await page.locator('#mcFile').setInputFiles({ name: 'bidhaa.csv', mimeType: 'text/csv', buffer: Buffer.from('Product Name,Cost\n"=2+2",100\nMkate,50') });
  await page.locator('#mcBatchMarkup').fill('20');
  await page.locator('#mcBatchProcess').click();
  await expect(page.locator('#mcBatchTable tbody tr')).toHaveCount(2);
  pending = page.waitForEvent('download');
  await page.locator('#mcBatchDownload').click();
  download = await pending;
  const batch = fs.readFileSync(await download.path(), 'utf8');
  expect(batch).toContain('"Jina la bidhaa","Gharama","Bei ya kuuza","Faida","Markup","Margin"');
  expect(batch).toContain('"\'=2+2"');
  await page.locator('#mcBatchMarkup').fill('25');
  await expect(page.locator('#mcBatchTable')).toBeHidden();
  await expect(page.locator('#mcBatchDownload')).toBeHidden();

  await page.locator('#mcCost').fill('');
  await expect(page.locator('#mcResult')).not.toHaveClass(/on/);
  expect(observed.errors).toEqual([]);
  expect(observed.writes).toEqual([]);
});

test('Swahili discount clears stale output and reopens copy, print, CSV, JSON and PDF', async ({ page }) => {
  await prepare(page);
  const observed = diagnostics(page);
  await page.goto(ROUTES[2]);
  await page.locator('#currencyLabel').fill('KES');
  await page.locator('#unitPrice').fill('100');
  await page.locator('#quantity').fill('2');
  await page.locator('[data-discount]').fill('20');
  await page.locator('#addDiscount').click();
  await page.locator('[data-discount]').nth(1).fill('10');
  await page.locator('#taxPct').fill('15');
  await page.locator('#taxPct').press('Enter');
  await expect(page.locator('#dcpResult')).toBeVisible();

  await page.evaluate(() => {
    window.__afrotoolsPrinted = false;
    window.print = () => { window.__afrotoolsPrinted = true; };
  });
  await page.locator('[data-export="copy"]').click();
  await expect(page.locator('#dcpStatus')).toContainText('Muhtasari umenakiliwa');
  expect(await page.evaluate(() => window.__afrotoolsCopied)).toContain('Akiba kabla ya kodi');
  await page.locator('[data-export="print"]').click();
  expect(await page.evaluate(() => window.__afrotoolsPrinted)).toBe(true);

  let pending = page.waitForEvent('download');
  await page.locator('[data-export="csv"]').click();
  let download = await pending;
  const csv = fs.readFileSync(await download.path(), 'utf8');
  expect(csv).toContain('"discount_1_pct","20"');
  expect(csv).toContain('"savings","56');

  pending = page.waitForEvent('download');
  await page.locator('[data-export="json"]').click();
  download = await pending;
  const json = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
  expect(json.tool).toBe('discount-calc');
  expect(json.result.outputs.savings).toBeCloseTo(56);
  expect(json.scopeNote).toContain('Hakuna kiwango cha kodi');

  pending = page.waitForEvent('download');
  await page.locator('[data-export="pdf"]').click();
  download = await pending;
  const parsed = await pdfParse(fs.readFileSync(await download.path()));
  expect(parsed.text).toContain('Mpango wa punguzo');
  expect(parsed.text).toContain('Akiba kabla ya kodi');
  expect(parsed.text).toMatch(/Hakuna\s+kiwango\s+cha\s+kodi/);

  await page.locator('#taxPct').fill('101');
  await expect(page.locator('[data-export]:disabled')).toHaveCount(5);
  await expect(page.locator('#dcpResult')).not.toBeVisible();
  expect(observed.errors).toEqual([]);
  expect(observed.writes).toEqual([]);
});
