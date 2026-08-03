const { pathToFileURL } = require('node:url');

let pdfParse;
try { pdfParse = require('pdf-parse'); } catch {
  pdfParse = async buffer => {
    const pdfjs = await import(pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href);
    const document = await pdfjs.getDocument({ data: new Uint8Array(buffer), disableWorker: true }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber), content = await page.getTextContent();
      pages.push(content.items.map(item => item.str).join(' '));
    }
    return { text: pages.join('\n') };
  };
}
let playwrightTest;
try { playwrightTest = require('@playwright/test'); } catch { playwrightTest = require('playwright/test'); }
const { test, expect } = playwrightTest;
const manifest = require('../../data/localization/sw-agriculture-parity-manifest.json');
const oracles = require('../../reports/sw-agriculture-input-prices-oracles.json');
const { alternateEntries } = require('../../scripts/lib/fr-agriculture-hreflang');

const ROWS = manifest.rows.filter(row => row.family === 'input-prices');
const ORACLE_BY_ID = new Map(oracles.rows.map(row => [row.englishId, row]));
const PORT = Number(process.env.SW_INPUT_PRICES_PORT || 4397);
const SENTINEL = [
  'worktree=sw-input-prices-resume-20260803',
  'root=C:\\Users\\Oza\\.codex\\worktrees\\sw-input-prices-resume-20260803\\afrotools',
  'branch=codex/sw-input-prices-resume-20260803',
  'base=0f6990118d9ac8b9dcde446a6ede10a017b9a2db'
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
async function downloadBuffer(download) { const stream = await download.createReadStream(), chunks = []; for await (const chunk of stream) chunks.push(chunk); return Buffer.concat(chunks); }
function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false; const input = text.replace(/^\ufeff/, '');
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted && char === '"' && input[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (!quoted && char === ',') { row.push(cell); cell = ''; }
    else if (!quoted && (char === '\n' || char === '\r')) { if (char === '\r' && input[index + 1] === '\n') index += 1; row.push(cell); if (row.some(value => value !== '')) rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); } return rows;
}
function rgb(value) { const match = String(value).match(/[\d.]+/g); return match ? match.slice(0, 3).map(Number) : [0, 0, 0]; }
function luminance(color) { const channels = rgb(color).map(value => { const n = value / 255; return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4; }); return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]; }
function contrast(first, second) { const values = [luminance(first), luminance(second)].sort((a, b) => b - a); return (values[0] + 0.05) / (values[1] + 0.05); }
async function computedAppContrast(page) {
  const values = await page.evaluate(() => {
    const body = getComputedStyle(document.body), input = document.getElementById('farmSize'), inputStyle = getComputedStyle(input);
    const button = document.querySelector('#inputPricesForm button[type="submit"]'), buttonStyle = getComputedStyle(button); input.focus(); const focused = getComputedStyle(input);
    return { bodyText: body.color, bodyBackground: body.backgroundColor, inputText: inputStyle.color, inputBackground: inputStyle.backgroundColor, inputBorder: inputStyle.borderTopColor, buttonText: buttonStyle.color, buttonBackground: buttonStyle.backgroundColor, focusOutline: focused.outlineColor };
  });
  expect(contrast(values.bodyText, values.bodyBackground)).toBeGreaterThanOrEqual(4.5); expect(contrast(values.inputText, values.inputBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(values.buttonText, values.buttonBackground)).toBeGreaterThanOrEqual(4.5); expect(contrast(values.inputBorder, values.inputBackground)).toBeGreaterThanOrEqual(3); expect(contrast(values.focusOutline, values.inputBackground)).toBeGreaterThanOrEqual(3);
}
async function computedHubContrast(page) {
  const values = await page.evaluate(() => { const body = getComputedStyle(document.body), card = document.querySelector('.card'), cardStyle = getComputedStyle(card); const link = document.querySelector('.country-list a'); link.focus(); const linkStyle = getComputedStyle(link); return { bodyText: body.color, bodyBackground: body.backgroundColor, cardBorder: cardStyle.borderTopColor, cardBackground: cardStyle.backgroundColor, linkText: linkStyle.color, linkBackground: linkStyle.backgroundColor === 'rgba(0, 0, 0, 0)' ? cardStyle.backgroundColor : linkStyle.backgroundColor, focusOutline: linkStyle.outlineColor }; });
  expect(contrast(values.bodyText, values.bodyBackground)).toBeGreaterThanOrEqual(4.5); expect(contrast(values.linkText, values.linkBackground)).toBeGreaterThanOrEqual(4.5); expect(contrast(values.cardBorder, values.cardBackground)).toBeGreaterThanOrEqual(3); expect(contrast(values.focusOutline, values.linkBackground)).toBeGreaterThanOrEqual(3);
}
async function assertKeyboardFocus(page) {
  expect(await page.evaluate(() => { const nodes = [...document.querySelectorAll('#inputPricesForm input, #inputPricesForm select, #inputPricesForm button, #resultPanel button')].filter(node => !node.disabled && node.offsetParent !== null), failed = []; nodes.forEach(node => { node.focus(); const style = getComputedStyle(node), visible = (parseFloat(style.outlineWidth) >= 2 && style.outlineStyle !== 'none') || style.boxShadow !== 'none'; if (document.activeElement !== node || !visible || node.tabIndex < 0) failed.push(node.id || node.textContent.trim()); }); return failed; })).toEqual([]);
}
async function assertSequentialKeyboard(page) {
  const expected = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]')]
      .filter(node => node.offsetParent !== null && node.tabIndex >= 0 && !(node.matches('input[type="radio"]') && !node.checked));
    nodes.forEach((node, index) => { node.dataset.keyboardSequence = String(index); });
    document.body.setAttribute('tabindex', '-1');
    document.body.focus();
    return nodes.map((node, index) => String(index));
  });
  const visited = [];
  const badFocus = [];
  for (let index = 0; index < expected.length + 3 && visited.length < expected.length; index += 1) {
    await page.keyboard.press('Tab');
    const current = await page.evaluate(() => {
      const node = document.activeElement;
      if (!node || node.dataset.keyboardSequence === undefined) return null;
      const style = getComputedStyle(node);
      const visible = (parseFloat(style.outlineWidth) >= 2 && style.outlineStyle !== 'none') || style.boxShadow !== 'none';
      return { sequence: node.dataset.keyboardSequence, visible, label: node.id || node.textContent.trim() };
    });
    if (current) {
      visited.push(current.sequence);
      if (!current.visible) badFocus.push(current.label);
    }
  }
  expect(visited).toEqual(expected);
  expect(badFocus).toEqual([]);
}
async function assertDoubledRootReflow(page, usabilitySelectors) {
  const baseline = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  expect(baseline).toBeGreaterThan(0);
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 900 });
    const metrics = await page.evaluate(({ baselineFont, selectors }) => {
      document.getElementById('reflowTextResize')?.remove();
      const resizeStyle = document.createElement('style');
      resizeStyle.id = 'reflowTextResize';
      resizeStyle.textContent = `html:root[lang="sw"][data-theme] { font-size: ${baselineFont * 2}px !important; transition: none !important; }`;
      document.head.appendChild(resizeStyle);
      const offenders = [...document.body.querySelectorAll('*')].filter(node => {
        if (node.offsetParent === null) return false;
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        const outsideViewport = rect.left < -1 || rect.right > window.innerWidth + 1;
        const visibleInternalOverflow = node.scrollWidth > node.clientWidth + 1 && style.overflowX === 'visible';
        return outsideViewport || visibleInternalOverflow;
      }).map(node => ({
        tag: node.tagName,
        id: node.id,
        className: typeof node.className === 'string' ? node.className : '',
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        left: node.getBoundingClientRect().left,
        right: node.getBoundingClientRect().right,
      }));
      const unusable = selectors.filter(selector => {
        const node = document.querySelector(selector);
        if (!node || node.offsetParent === null) return true;
        const rect = node.getBoundingClientRect();
        return rect.width < 24 || rect.height < 24 || rect.left < -1 || rect.right > window.innerWidth + 1;
      });
      return {
        computedRootFont: parseFloat(getComputedStyle(document.documentElement).fontSize),
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        offenders,
        unusable,
      };
    }, { baselineFont: baseline, selectors: usabilitySelectors });
    expect(metrics.computedRootFont, JSON.stringify(metrics)).toBeCloseTo(baseline * 2, 1);
    expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.documentClientWidth);
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.bodyClientWidth);
    expect(metrics.offenders).toEqual([]);
    expect(metrics.unusable).toEqual([]);
  }
  await page.evaluate(() => { document.getElementById('reflowTextResize')?.remove(); });
  await page.setViewportSize({ width: 375, height: 900 });
}
async function assertRouteShell(page, row, failures) {
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw'); await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${row.swahili.routeKey}`);
  for (const { hreflang, route } of alternateEntries(row)) await expect(page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`)).toHaveAttribute('href', `https://afrotools.com${route}`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://afrotools.com${row.swahili.routeKey}`);
  const schema = await page.locator('script[type="application/ld+json"]').first().evaluate(node => JSON.parse(node.textContent)); expect(schema.inLanguage).toBe('sw');
  const image = page.locator('.hero-art'); await expect(image).toBeVisible(); expect(await image.evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const sentinel = await page.evaluate(async () => (await fetch('/tests/fixtures/sw-input-prices-worktree-sentinel.txt')).text()); expect(sentinel.trim()).toBe(SENTINEL);
  await page.locator('.skip-link').focus(); await expect(page.locator('.skip-link')).toBeFocused(); await page.keyboard.press('Enter'); await expect(page.locator('main#contenu')).toBeFocused();
  await expect(page.locator('a[href^="/"]:not([href^="/sw/"])')).toHaveCount(0); expect(failures).toEqual({ consoleErrors: [], pageErrors: [], resourceFailures: [], responses: [], writes: [], external: [] });
}
async function fillValid(page, oracle) {
  const input = oracle.validOracle.input; await page.locator('#inputType').selectOption(input.inputType); await page.locator('#cropSel').selectOption(input.crop);
  await page.locator('#farmSize').fill(String(input.farmSize)); await page.locator('#priceType').selectOption(input.priceMode);
}
function engineSummary(result) {
  return { visibility: result.visibility, fertilizer: result.fertilizers.cheapest && { brand: result.fertilizers.cheapest.brand, selectedPrice: result.fertilizers.cheapest.selectedPrice, perKg: result.fertilizers.cheapest.perKg, bagsPerHa: result.fertilizers.cheapest.bagsPerHa }, seed: result.seeds.cheapest && { brand: result.seeds.cheapest.brand, quantity: result.seeds.cheapest.quantity, total: result.seeds.cheapest.total }, chemical: result.agrochemicals.cheapest && { brand: result.agrochemicals.cheapest.brand, total: result.agrochemicals.cheapest.total }, usedFallback: result.seeds.usedFallback, budget: { fertilizerSubtotal: result.budget.fertilizerSubtotal, seedSubtotal: result.budget.seedSubtotal, agrochemicalSubtotal: result.budget.agrochemicalSubtotal, total: result.budget.total, premium: result.budget.premium, savings: result.budget.savings } };
}

for (const row of ROWS) {
  test(`${row.english.id} full route local proof`, async ({ page }) => {
    const failures = watchFailures(page);
    await page.addInitScript(() => { localStorage.removeItem('afrotools-theme'); Object.defineProperty(navigator, 'share', { configurable: true, value: async payload => { window.__inputPricesSharePayload = payload; } }); });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' }); await page.setViewportSize({ width: 375, height: 900 }); await page.goto(row.swahili.routeKey);
    if (!row.country) {
      await expect(page.locator('.country-list a')).toHaveCount(15); await expect(page.getByRole('link', { name: 'Rasilimali za mbolea za FAO' })).toHaveAttribute('href', /fao\.org/);
      await expect(page.getByText(/robo ya kwanza ya 2026/)).toBeVisible(); await expect(page.getByText('Kiwango cha uhakika', { exact: true })).toBeVisible(); await expect(page.getByText(new RegExp(row.english.id))).toBeVisible();
      expect(await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(13, 22, 36)'); await computedHubContrast(page);
      await page.emulateMedia({ colorScheme: 'light' }); await expect.poll(() => page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(245, 248, 252)'); await computedHubContrast(page);
      await page.getByRole('button', { name: 'Mandhari meusi' }).click(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark'); await page.getByRole('button', { name: 'Mandhari mepesi' }).click(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await assertDoubledRootReflow(page, ['#themeToggle', '.country-list a']);
      await assertSequentialKeyboard(page);
      await assertRouteShell(page, row, failures); return;
    }
    const oracle = ORACLE_BY_ID.get(row.english.id); expect(oracle).toBeTruthy(); await expect(page.getByRole('heading', { level: 1 })).toContainText(oracle.countryName);
    await expect(page.locator('meta[name="afrotools-country-id"]')).toHaveAttribute('content', row.country.code); await expect(page.getByText(/hakuna ingizo linalotumwa kwa seva/i)).toBeVisible(); await expect(page.getByText(/si data ya moja kwa moja/)).toBeVisible();
    await expect(page.getByText(oracle.source, { exact: true })).toBeVisible(); await expect(page.getByText(new RegExp(row.english.id))).toBeVisible();
    const controls = page.locator('#inputPricesForm input, #inputPricesForm select'); for (let index = 0; index < await controls.count(); index += 1) { const id = await controls.nth(index).getAttribute('id'); await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1); }
    await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0); await fillValid(page, oracle);
    const calculate = page.getByRole('button', { name: 'Linganisha bei' }); await calculate.focus(); await expect(calculate).toBeFocused(); await page.keyboard.press('Enter');
    await expect(page.locator('#resultPanel')).toBeVisible(); await expect(page.locator('#resultPanel')).toBeFocused();
    const runtime = await page.evaluate(() => ({ result: window.__SW_AGRI_TEST__.latest.result, report: window.__SW_AGRI_TEST__.reportObject(), config: window.__SW_AGRI_PAGE__ }));
    expect(runtime.config.aiRouteId).toBe(row.english.id); expect(runtime.report.nchi.code).toBe(row.country.code); expect(runtime.report.chanzo.lebo).toBe(oracle.source); expect(engineSummary(runtime.result)).toEqual(oracle.validOracle.expected);
    const exports = [
      { name: 'Pakua JSON', extension: '.json', verify: buffer => { const parsed = JSON.parse(buffer.toString('utf8')); expect(parsed.nchi.code).toBe(row.country.code); expect(parsed.matokeo.bajeti.total).toBe(oracle.validOracle.expected.budget.total); expect(parsed.chanzo.lebo).toBe(oracle.source); expect(JSON.stringify(parsed)).not.toMatch(/\b(?:Data sources|Price|Supplier|Certified|Imported)\b/); } },
      { name: 'Pakua TXT', extension: '.txt', verify: buffer => { const text = buffer.toString('utf8').replace(/^\ufeff/, ''); expect(text).toContain('bei za pembejeo za kilimo'); expect(text).toContain('Vyanzo vilivyotajwa: ' + oracle.source); } },
      { name: 'Pakua CSV', extension: '.csv', verify: buffer => { const parsed = parseCsv(buffer.toString('utf8')); expect(parsed).toHaveLength(2); const record = Object.fromEntries(parsed[0].map((key, index) => [key, parsed[1][index]])); expect(record.code_nchi).toBe(row.country.code); expect(Number(record.jumla)).toBe(oracle.validOracle.expected.budget.total); expect(record.sarafu).toBe(oracle.currency); } },
      { name: 'Pakua PDF', extension: '.pdf', verify: async buffer => { expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF'); const parsed = await pdfParse(buffer); expect(parsed.text).toContain('bei za pembejeo za kilimo'); expect(parsed.text).toContain('Vyanzo vilivyotajwa'); expect(parsed.text).toContain('Kiwango cha uhakika'); } }
    ];
    for (const item of exports) { const pending = page.waitForEvent('download'); await page.getByRole('button', { name: item.name }).click(); const download = await pending; expect(download.suggestedFilename().toLowerCase()).toContain(row.country.code.toLowerCase()); expect(download.suggestedFilename().toLowerCase().endsWith(item.extension)).toBe(true); await item.verify(await downloadBuffer(download)); }
    await page.getByRole('button', { name: 'Hifadhi kwenye kivinjari' }).click(); const saved = await page.evaluate(code => localStorage.getItem(`afrotools:sw-agriculture:input-prices:${code}`), row.country.code); expect(JSON.parse(saved).nchi.code).toBe(row.country.code);
    await page.getByRole('button', { name: 'Shiriki' }).click(); const share = await page.evaluate(() => window.__inputPricesSharePayload); expect(share.url).toBe(`http://127.0.0.1:${PORT}${row.swahili.routeKey}`); expect(share.text).toContain('bei za pembejeo za kilimo');
    for (const [type, proof] of Object.entries(oracle.categoryOracles)) { await page.locator('#inputType').selectOption(type); await page.locator('#cropSel').selectOption(proof.input.crop); await page.locator('#farmSize').fill(String(proof.input.farmSize)); await page.locator('#priceType').selectOption(proof.input.priceMode); await calculate.click(); const summary = await page.evaluate(() => window.__SW_AGRI_TEST__.latest.result); expect(engineSummary(summary)).toEqual(proof.expected); }
    const invalidCases = [
      { selector: '#farmSize', value: '0', message: 'unaozidi 0' }, { selector: '#farmSize', value: '-1', message: 'unaozidi 0' }, { selector: '#farmSize', value: '', message: 'unaozidi 0' }, { selector: '#farmSize', value: '100001', message: 'hekta 100,000' },
      { selector: '#inputType', invalidSelect: true, message: 'kundi halali' }, { selector: '#priceType', invalidSelect: true, message: 'aina halali ya bei' }, { selector: '#cropSel', invalidSelect: true, message: 'zao linalopatikana' }
    ];
    for (const boundary of invalidCases) {
      await fillValid(page, oracle); await calculate.click(); await expect(page.locator('#resultPanel')).toBeVisible();
      if (boundary.invalidSelect) await page.locator(boundary.selector).evaluate(node => { const option = document.createElement('option'); option.value = '__invalid__'; option.textContent = 'batili'; node.appendChild(option); node.value = '__invalid__'; node.dispatchEvent(new Event('change', { bubbles: true })); }); else await page.locator(boundary.selector).fill(boundary.value);
      await expect(page.locator('#resultPanel')).toBeHidden(); await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0); expect(await page.evaluate(() => window.__SW_AGRI_TEST__.latest)).toBeNull();
      await calculate.click(); await expect(page.getByRole('alert')).toContainText(boundary.message); await expect(page.locator(boundary.selector)).toBeFocused(); await expect(page.locator('#resultPanel')).toBeHidden();
    }
    await fillValid(page, oracle); await calculate.click(); await assertKeyboardFocus(page);
    const visibleText = await page.locator('body').innerText(); expect(visibleText).not.toMatch(/\b(?:Product|Supplier|Bag size|Price\/bag|Per kg|Seeds|Fertilizer|Chemicals|Total \(cheapest\)|Data sources|Freshness|Confidence|Privacy|Export|Reset|Certified|Imported)\b/i);
    await page.emulateMedia({ colorScheme: 'dark' }); await expect(page.locator('html')).toHaveAttribute('data-theme', 'system'); await expect.poll(() => page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(13, 22, 36)'); await computedAppContrast(page);
    await page.emulateMedia({ colorScheme: 'light' }); await expect.poll(() => page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(245, 248, 252)'); await computedAppContrast(page);
    await page.getByRole('button', { name: 'Mandhari meusi' }).click(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark'); await page.getByRole('button', { name: 'Mandhari mepesi' }).click(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await assertDoubledRootReflow(page, ['#inputPricesForm button[type="submit"]', '#resultPanel', '[data-result-action="json"]']);
    await assertSequentialKeyboard(page);
    expect(await page.evaluate(() => { const ids = [...document.querySelectorAll('[id]')].map(element => element.id); return ids.filter((id, index) => ids.indexOf(id) !== index); })).toEqual([]); await assertRouteShell(page, row, failures);
  });
}
