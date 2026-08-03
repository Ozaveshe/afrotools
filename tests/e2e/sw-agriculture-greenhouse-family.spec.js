const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch {
  pdfParse = async buffer => {
    const pdfjs = await import(pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href);
    const document = await pdfjs.getDocument({ data: new Uint8Array(buffer), disableWorker: true }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map(item => item.str).join(' '));
    }
    return { text: pages.join('\n') };
  };
}

let playwrightTest;
try { playwrightTest = require('@playwright/test'); } catch { playwrightTest = require('playwright/test'); }
const { test, expect } = playwrightTest;
const manifest = require('../../data/localization/sw-agriculture-parity-manifest.json');
const oracles = require('../../reports/sw-agriculture-greenhouse-oracles.json');

const ROWS = manifest.rows.filter(row => row.family === 'greenhouse');
const ORACLE_BY_ID = new Map(oracles.rows.map(row => [row.englishId, row]));
const PORT = Number(process.env.SW_GREENHOUSE_PORT || 4394);
const SENTINEL = [
  'worktree=sw-agriculture-greenhouse-8354-20260802',
  'root=C:\\Users\\Oza\\.codex\\worktrees\\sw-agriculture-greenhouse-8354-20260802\\afrotools',
  'branch=codex/sw-agriculture-greenhouse-8354-20260802',
  'base=8354e321ff34caf60a33a3393cd0dcddfb00c023'
].join('\n');

function watchFailures(page) {
  const state = { consoleErrors: [], pageErrors: [], resourceFailures: [], responses: [], writes: [], external: [] };
  page.on('console', message => { if (message.type() === 'error') state.consoleErrors.push(message.text()); });
  page.on('pageerror', error => state.pageErrors.push(error.message));
  page.on('requestfailed', request => state.resourceFailures.push(`${request.url()} ${request.failure() && request.failure().errorText}`));
  page.on('response', response => { if (response.status() >= 400) state.responses.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => {
    if (request.method() !== 'GET') state.writes.push(`${request.method()} ${request.url()}`);
    if (/^https?:/i.test(request.url()) && !new RegExp(`^https?://(?:127\\.0\\.0\\.1|localhost):${PORT}/`, 'i').test(request.url())) state.external.push(request.url());
  });
  return state;
}
async function downloadBuffer(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  const input = text.replace(/^\ufeff/, '');
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted && char === '"' && input[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (!quoted && char === ',') { row.push(cell); cell = ''; }
    else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && input[index + 1] === '\n') index += 1;
      row.push(cell); if (row.some(value => value !== '')) rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
function rgb(value) {
  const match = String(value).match(/[\d.]+/g);
  return match ? match.slice(0, 3).map(Number) : [0, 0, 0];
}
function luminance(color) {
  const channels = rgb(color).map(value => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
async function computedAppContrast(page) {
  const values = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const input = document.getElementById('area');
    const inputStyle = getComputedStyle(input);
    const button = document.querySelector('#greenhouseForm button[type="submit"]');
    const buttonStyle = getComputedStyle(button);
    input.focus();
    const focused = getComputedStyle(input);
    return {
      bodyText: body.color, bodyBackground: body.backgroundColor,
      inputText: inputStyle.color, inputBackground: inputStyle.backgroundColor, inputBorder: inputStyle.borderTopColor,
      buttonText: buttonStyle.color, buttonBackground: buttonStyle.backgroundColor, focusOutline: focused.outlineColor
    };
  });
  expect(contrast(values.bodyText, values.bodyBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(values.inputText, values.inputBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(values.buttonText, values.buttonBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(values.inputBorder, values.inputBackground)).toBeGreaterThanOrEqual(3);
  expect(contrast(values.focusOutline, values.inputBackground)).toBeGreaterThanOrEqual(3);
}
async function computedHubContrast(page) {
  const values = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const card = document.querySelector('.card');
    const cardStyle = getComputedStyle(card);
    const link = document.querySelector('.country-list a');
    link.focus();
    const linkStyle = getComputedStyle(link);
    return {
      bodyText: body.color, bodyBackground: body.backgroundColor,
      cardBorder: cardStyle.borderTopColor, cardBackground: cardStyle.backgroundColor,
      linkText: linkStyle.color,
      linkBackground: linkStyle.backgroundColor === 'rgba(0, 0, 0, 0)' ? cardStyle.backgroundColor : linkStyle.backgroundColor,
      focusOutline: linkStyle.outlineColor
    };
  });
  expect(contrast(values.bodyText, values.bodyBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(values.linkText, values.linkBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(values.cardBorder, values.cardBackground)).toBeGreaterThanOrEqual(3);
  expect(contrast(values.focusOutline, values.linkBackground)).toBeGreaterThanOrEqual(3);
}
async function assertKeyboardFocus(page) {
  const failures = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('#greenhouseForm input, #greenhouseForm select, #greenhouseForm button, #resultPanel button')]
      .filter(node => !node.disabled && node.offsetParent !== null);
    const failed = [];
    nodes.forEach(node => {
      node.focus();
      const style = getComputedStyle(node);
      const visible = (parseFloat(style.outlineWidth) >= 2 && style.outlineStyle !== 'none') || style.boxShadow !== 'none';
      if (document.activeElement !== node || !visible || node.tabIndex < 0) failed.push(node.id || node.textContent.trim());
    });
    return failed;
  });
  expect(failures).toEqual([]);
}
async function assertRouteShell(page, row, failures) {
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${row.swahili.routeKey}`);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://afrotools.com${row.english.route}`);
  await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveAttribute('href', `https://afrotools.com${row.french.route}`);
  await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute('href', `https://afrotools.com${row.swahili.routeKey}`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://afrotools.com${row.swahili.routeKey}`);
  const schema = await page.locator('script[type="application/ld+json"]').first().evaluate(node => JSON.parse(node.textContent));
  expect(schema.inLanguage).toBe('sw');
  const image = page.locator('.hero-art');
  await expect(image).toBeVisible();
  expect(await image.evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const sentinel = await page.evaluate(async () => (await fetch('/tests/fixtures/sw-greenhouse-worktree-sentinel.txt')).text());
  expect(sentinel.trim()).toBe(SENTINEL);
  await page.locator('.skip-link').focus();
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#contenu')).toBeFocused();
  await expect(page.locator('a[href^="/"]:not([href^="/sw/"])')).toHaveCount(0);
  expect(failures).toEqual({ consoleErrors: [], pageErrors: [], resourceFailures: [], responses: [], writes: [], external: [] });
}
async function fillValid(page, oracle) {
  const input = oracle.validOracle.input;
  await page.locator('#type').selectOption(input.greenhouseType);
  await page.locator('#area').fill(String(input.area));
  await page.locator('#crop').selectOption(input.crop);
  await page.locator('#cycles').fill(String(input.cyclesPerYear));
  await page.locator('#water').selectOption(input.waterSource);
  await page.locator('#setup').selectOption(input.isNewSetup ? 'new' : 'existing');
}

for (const row of ROWS) {
  test(`${row.english.id} full route local proof`, async ({ page }) => {
    const failures = watchFailures(page);
    await page.addInitScript(() => {
      localStorage.removeItem('afrotools-theme');
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async payload => { window.__greenhouseSharePayload = payload; }
      });
    });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(row.swahili.routeKey);

    if (!row.country) {
      await expect(page.locator('.country-list a')).toHaveCount(15);
      await expect(page.getByText(/ulipitiwa 2026/)).toBeVisible();
      await expect(page.getByRole('link', { name: 'FAOSTAT — bidhaa za mazao na mifugo' })).toHaveAttribute('href', 'https://www.fao.org/faostat/en/#data/QCL');
      await expect(page.getByText('Kiwango cha uhakika', { exact: true })).toBeVisible();
      await expect(page.getByText(new RegExp(row.english.id))).toBeVisible();
      await expect(page.locator('[data-result-action]')).toHaveCount(0);
      expect(await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(13, 22, 36)');
      await computedHubContrast(page);
      await page.emulateMedia({ colorScheme: 'light' });
      await expect.poll(() => page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(245, 248, 252)');
      await computedHubContrast(page);
      await page.getByRole('button', { name: 'Mandhari meusi' }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await page.getByRole('button', { name: 'Mandhari mepesi' }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await page.setViewportSize({ width: 320, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await page.setViewportSize({ width: 640, height: 900 });
      await page.evaluate(() => { document.body.style.zoom = '2'; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await assertRouteShell(page, row, failures);
      return;
    }

    const oracle = ORACLE_BY_ID.get(row.english.id);
    expect(oracle).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(oracle.countryName);
    await expect(page.locator('meta[name="afrotools-country-id"]')).toHaveAttribute('content', row.country.code);
    await expect(page.getByText(/hakuna ingizo linalotumwa kwa seva/i)).toBeVisible();
    await expect(page.getByText(/data ni tuli na si ya moja kwa moja/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'FAOSTAT — bidhaa za mazao na mifugo' })).toHaveAttribute('href', 'https://www.fao.org/faostat/en/#data/QCL');
    await expect(page.getByText(new RegExp(row.english.id))).toBeVisible();
    expect(await page.locator('body').innerText()).toContain(oracle.source.split(',')[0]);
    const controls = page.locator('#greenhouseForm input, #greenhouseForm select');
    for (let index = 0; index < await controls.count(); index += 1) {
      const id = await controls.nth(index).getAttribute('id');
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    }
    await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
    await fillValid(page, oracle);
    const calculate = page.getByRole('button', { name: 'Kokotoa gharama na faida' });
    await calculate.focus();
    await expect(calculate).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#resultPanel')).toBeVisible();
    await expect(page.locator('#resultPanel')).toBeFocused();
    const runtime = await page.evaluate(() => ({ result: window.__SW_AGRI_TEST__.latest.result, report: window.__SW_AGRI_TEST__.reportObject(), config: window.__SW_AGRI_PAGE__ }));
    expect(runtime.config.aiRouteId).toBe(row.english.id);
    expect(runtime.report.nchi.code).toBe(row.country.code);
    expect(runtime.report.chanzo.lebo).toBe(oracle.source);
    expect({
      setup: runtime.result.setup, running: runtime.result.running, revenue: runtime.result.revenue,
      netProfit: runtime.result.netProfit, roi: runtime.result.roi,
      payback: Number.isFinite(runtime.result.payback) ? runtime.result.payback : null,
      breakEvenKg: runtime.result.breakEvenKg, breakEvenPerM2: runtime.result.breakEvenPerM2,
      currency: runtime.result.country.currency, symbol: runtime.result.symbol, openField: runtime.result.openField
    }).toEqual(oracle.validOracle.expected);

    const exports = [
      { name: 'Pakua JSON', extension: '.json', verify: buffer => {
        const parsed = JSON.parse(buffer.toString('utf8'));
        expect(parsed.nchi.code).toBe(row.country.code);
        expect(parsed.matokeo.faidaHalisi).toBe(oracle.validOracle.expected.netProfit);
        expect(parsed.chanzo.lebo).toBe(oracle.source);
      } },
      { name: 'Pakua TXT', extension: '.txt', verify: buffer => {
        const text = buffer.toString('utf8').replace(/^\ufeff/, '');
        expect(text).toContain('Gharama na faida ya greenhouse');
        expect(text).toContain('Vyanzo vilivyotajwa: ' + oracle.source);
      } },
      { name: 'Pakua CSV', extension: '.csv', verify: buffer => {
        const parsed = parseCsv(buffer.toString('utf8'));
        expect(parsed).toHaveLength(2);
        const record = Object.fromEntries(parsed[0].map((key, index) => [key, parsed[1][index]]));
        expect(record.code_nchi).toBe(row.country.code);
        expect(Number(record.faida_halisi)).toBe(oracle.validOracle.expected.netProfit);
        expect(record.sarafu).toBe(oracle.currency);
      } },
      { name: 'Pakua PDF', extension: '.pdf', verify: async buffer => {
        expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
        const parsed = await pdfParse(buffer);
        expect(parsed.text).toContain('Gharama na faida ya greenhouse');
        expect(parsed.text).toContain('Vyanzo vilivyotajwa');
        expect(parsed.text).toContain(oracle.source.split(',')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      } }
    ];
    for (const item of exports) {
      const pending = page.waitForEvent('download');
      await page.getByRole('button', { name: item.name }).click();
      const download = await pending;
      expect(download.suggestedFilename().toLowerCase()).toContain(row.country.code.toLowerCase());
      expect(download.suggestedFilename().toLowerCase().endsWith(item.extension)).toBe(true);
      await item.verify(await downloadBuffer(download));
    }
    await page.getByRole('button', { name: 'Hifadhi kwenye kivinjari' }).click();
    const saved = await page.evaluate(code => localStorage.getItem(`afrotools:sw-agriculture:greenhouse:${code}`), row.country.code);
    expect(JSON.parse(saved).nchi.code).toBe(row.country.code);
    await page.getByRole('button', { name: 'Shiriki' }).click();
    const share = await page.evaluate(() => window.__greenhouseSharePayload);
    expect(share.url).toBe(`http://127.0.0.1:${PORT}${row.swahili.routeKey}`);
    expect(share.text).toContain('Gharama na faida ya greenhouse');

    const invalidCases = [
      { selector: '#area', value: '9', message: 'm² 10 na 1,000,000' },
      { selector: '#area', value: '1000001', message: 'm² 10 na 1,000,000' },
      { selector: '#area', value: '', message: 'm² 10 na 1,000,000' },
      { selector: '#cycles', value: '0', message: 'kati ya 1 na 12' },
      { selector: '#cycles', value: '13', message: 'kati ya 1 na 12' },
      { selector: '#cycles', value: '1.5', message: 'kati ya 1 na 12' },
      { selector: '#crop', invalidSelect: true, message: 'zao linalopatikana' }
    ];
    for (const boundary of invalidCases) {
      await fillValid(page, oracle);
      await calculate.click();
      await expect(page.locator('#resultPanel')).toBeVisible();
      if (boundary.invalidSelect) {
        await page.locator(boundary.selector).evaluate(node => {
          const option = document.createElement('option'); option.value = '__invalid__'; option.textContent = 'batili';
          node.appendChild(option); node.value = '__invalid__'; node.dispatchEvent(new Event('change', { bubbles: true }));
        });
      } else await page.locator(boundary.selector).fill(boundary.value);
      await expect(page.locator('#resultPanel')).toBeHidden();
      await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
      expect(await page.evaluate(() => window.__SW_AGRI_TEST__.latest)).toBeNull();
      await calculate.click();
      await expect(page.getByRole('alert')).toContainText(boundary.message);
      await expect(page.locator(boundary.selector)).toBeFocused();
      await expect(page.locator('#resultPanel')).toBeHidden();
    }

    await fillValid(page, oracle);
    await calculate.click();
    await assertKeyboardFocus(page);
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
    await expect.poll(() => page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(13, 22, 36)');
    await computedAppContrast(page);
    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(() => page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(245, 248, 252)');
    await computedAppContrast(page);
    await page.getByRole('button', { name: 'Mandhari meusi' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: 'Mandhari mepesi' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.setViewportSize({ width: 320, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.setViewportSize({ width: 375, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.setViewportSize({ width: 640, height: 900 });
    await page.evaluate(() => { document.body.style.zoom = '2'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    })).toEqual([]);
    await assertRouteShell(page, row, failures);
  });
}
