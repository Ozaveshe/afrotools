const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch {
  pdfParse = async (buffer) => {
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
const oracles = require('../../reports/sw-agriculture-livestock-feed-oracles.json');

const ROWS = manifest.rows.filter(row => row.family === 'livestock-feed');
const ORACLE_BY_ID = new Map(oracles.rows.map(row => [row.englishId, row]));
const PORT = Number(process.env.SW_LIVESTOCK_FEED_PORT || 4393);
const SENTINEL = [
  'worktree=sw-parity-resume-20260803',
  'root=C:\\Users\\Oza\\.codex\\worktrees\\sw-parity-resume-20260803',
  'branch=codex/sw-parity-resume-20260803',
  'base=0f6990118d9ac8b9dcde446a6ede10a017b9a2db',
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
    const input = document.getElementById('weight');
    const inputStyle = getComputedStyle(input);
    const button = document.querySelector('#feedForm button[type="submit"]');
    const buttonStyle = getComputedStyle(button);
    input.focus();
    const focused = getComputedStyle(input);
    return {
      bodyText: body.color, bodyBackground: body.backgroundColor,
      inputText: inputStyle.color, inputBackground: inputStyle.backgroundColor, inputBorder: inputStyle.borderTopColor,
      buttonText: buttonStyle.color, buttonBackground: buttonStyle.backgroundColor,
      focusOutline: focused.outlineColor,
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
    return { bodyText: body.color, bodyBackground: body.backgroundColor, cardBorder: cardStyle.borderTopColor, cardBackground: cardStyle.backgroundColor, linkText: linkStyle.color, linkBackground: linkStyle.backgroundColor === 'rgba(0, 0, 0, 0)' ? cardStyle.backgroundColor : linkStyle.backgroundColor, focusOutline: linkStyle.outlineColor };
  });
  expect(contrast(values.bodyText, values.bodyBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(values.linkText, values.linkBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(values.cardBorder, values.cardBackground)).toBeGreaterThanOrEqual(3);
  expect(contrast(values.focusOutline, values.linkBackground)).toBeGreaterThanOrEqual(3);
}
async function assertKeyboardFocus(page) {
  const failures = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('#feedForm input, #feedForm select, #feedForm button, #resultPanel button')]
      .filter(node => !node.disabled && node.offsetParent !== null);
    const failed = [];
    nodes.forEach(node => {
      node.focus();
      const style = getComputedStyle(node);
      const visibleIndicator = (parseFloat(style.outlineWidth) >= 2 && style.outlineStyle !== 'none') || style.boxShadow !== 'none';
      if (document.activeElement !== node || !visibleIndicator || node.tabIndex < 0) failed.push(node.id || node.textContent.trim());
    });
    return failed;
  });
  expect(failures).toEqual([]);
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
  const sentinel = await page.evaluate(async () => (await fetch('/tests/fixtures/sw-livestock-feed-worktree-sentinel.txt')).text());
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
  await page.locator('#animal').selectOption(input.animalType);
  await page.locator('#animalClass').selectOption(input.animalClass);
  await page.locator('#weight').fill(String(input.bodyWeight));
  await page.locator('#number').fill(String(input.numAnimals));
  await page.locator('#budget').fill(String(input.maxBudget));
  await page.evaluate(selected => {
    document.querySelectorAll('.ingredient').forEach(node => { node.checked = selected.includes(node.value); });
    document.querySelector('.ingredient').dispatchEvent(new Event('input', { bubbles: true }));
  }, input.selectedFeeds);
}

for (const row of ROWS) {
  test(`${row.english.id} full route local proof`, async ({ page, context }) => {
    const failures = watchFailures(page);
    await page.addInitScript(() => {
      localStorage.removeItem('afrotools-theme');
      Object.defineProperty(navigator, 'share', { configurable: true, value: async payload => { window.__feedSharePayload = payload; } });
    });
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(row.swahili.routeKey);

    if (!row.country) {
      await expect(page.locator('.country-list a')).toHaveCount(15);
      await expect(page.getByText(/bei tuli zilizopitiwa kwa rejea za 2024-2025/)).toBeVisible();
      await expect(page.getByRole('link', { name: 'FAO - uzalishaji na malisho ya mifugo' })).toHaveAttribute('href', 'https://www.fao.org/animal-production/en');
      await expect(page.getByText('Kiwango cha uhakika', { exact: true })).toBeVisible();
      await expect(page.getByText(new RegExp(row.english.id))).toBeVisible();
      expect(await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(13, 22, 36)');
      await computedHubContrast(page);
      await page.emulateMedia({ colorScheme: 'light' });
      await expect.poll(() => page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(245, 248, 252)');
      await computedHubContrast(page);
      await page.getByRole('button', { name: 'Mandhari meusi' }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await page.getByRole('button', { name: 'Mandhari mepesi' }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await assertDoubledRootReflow(page, ['#themeToggle', '.country-list a']);
      await assertSequentialKeyboard(page);
      await assertRouteShell(page, row, failures);
      return;
    }

    const oracle = ORACLE_BY_ID.get(row.english.id);
    expect(oracle).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(oracle.countryName);
    await expect(page.locator('meta[name="afrotools-country-id"]')).toHaveAttribute('content', row.country.code);
    await expect(page.getByText(/hakuna ingizo linalotumwa kwa seva/i)).toBeVisible();
    await expect(page.getByText(/si data ya moja kwa moja/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'FAO - uzalishaji na malisho ya mifugo' })).toHaveAttribute('href', 'https://www.fao.org/animal-production/en');
    await expect(page.getByText(new RegExp(row.english.id))).toBeVisible();
    const controls = page.locator('#feedForm input, #feedForm select');
    for (let index = 0; index < await controls.count(); index += 1) {
      const id = await controls.nth(index).getAttribute('id');
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    }
    await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
    await fillValid(page, oracle);
    const calculate = page.getByRole('button', { name: 'Panga mgao' });
    await calculate.focus();
    await expect(calculate).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#resultPanel')).toBeVisible();
    await expect(page.locator('#resultPanel')).toBeFocused();
    const runtime = await page.evaluate(() => ({ result: window.__SW_AGRI_TEST__.latest.result, report: window.__SW_AGRI_TEST__.reportObject(), config: window.__SW_AGRI_PAGE__ }));
    expect(runtime.config.aiRouteId).toBe(row.english.id);
    expect(runtime.report.nchi.code).toBe(row.country.code);
    expect({ dmi: runtime.result.dmi, req: runtime.result.req, prov: runtime.result.prov, balance: runtime.result.balance, ration: runtime.result.ration.map(item => ({ id: item.id, freshKg: item.freshKg, dmKg: item.dmKg, cp_g: item.cp_g, tdn_g: item.tdn_g, cost: item.cost })), costs: runtime.result.costs, currency: runtime.result.currency }).toEqual(oracle.validOracle.expected);

    const exports = [
      { name: 'Pakua JSON', extension: '.json', verify: buffer => { const parsed = JSON.parse(buffer.toString('utf8')); expect(parsed.nchi.code).toBe(row.country.code); expect(parsed.matokeo.gharama.dailyPerAnimal).toBe(oracle.validOracle.expected.costs.dailyPerAnimal); } },
      { name: 'Pakua TXT', extension: '.txt', verify: buffer => { const text = buffer.toString('utf8'); expect(text).toContain('Chakula cha mifugo'); expect(text).toContain('Chanzo: Masafa ya mahitaji yaliyorekebishwa kutoka marejeo ya NRC'); } },
      { name: 'Pakua CSV', extension: '.csv', verify: buffer => { const text = buffer.toString('utf8'); expect(text).toContain('protini_inayohitajika_g'); expect(text).toContain(`,${row.country.code},`); } },
      { name: 'Pakua PDF', extension: '.pdf', verify: async buffer => { expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF'); const parsed = await pdfParse(buffer); expect(parsed.text).toContain('Chakula cha mifugo'); expect(parsed.text).toContain('Chanzo: Masafa ya mahitaji yaliyorekebishwa kutoka marejeo ya NRC'); } },
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
    const saved = await page.evaluate(code => localStorage.getItem(`afrotools:sw-agriculture:livestock-feed:${code}`), row.country.code);
    expect(JSON.parse(saved).nchi.code).toBe(row.country.code);
    await page.getByRole('button', { name: 'Shiriki' }).click();
    const share = await page.evaluate(() => window.__feedSharePayload);
    expect(share.url).toBe(`http://127.0.0.1:${PORT}${row.swahili.routeKey}`);
    expect(share.text).toContain('Chakula cha mifugo');

    const invalidCases = [
      { selector: '#weight', value: '0', message: 'kg 1 na 2,000' },
      { selector: '#weight', value: '2001', message: 'kg 1 na 2,000' },
      { selector: '#number', value: '0', message: 'kati ya 1 na 10,000' },
      { selector: '#number', value: '10001', message: 'kati ya 1 na 10,000' },
      { selector: '#budget', value: '-1', message: 'chini ya sifuri' },
      { selector: '.ingredient', noFeeds: true, message: 'angalau kiambato kimoja' },
    ];
    for (const boundary of invalidCases) {
      await fillValid(page, oracle);
      await calculate.click();
      await expect(page.locator('#resultPanel')).toBeVisible();
      if (boundary.noFeeds) {
        await page.evaluate(() => { document.querySelectorAll('.ingredient').forEach(node => { node.checked = false; }); document.querySelector('.ingredient').dispatchEvent(new Event('input', { bubbles: true })); });
      } else {
        await page.locator(boundary.selector).fill(boundary.value);
      }
      await expect(page.locator('#resultPanel')).toBeHidden();
      await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
      expect(await page.evaluate(() => window.__SW_AGRI_TEST__.latest)).toBeNull();
      await calculate.click();
      await expect(page.getByRole('alert')).toContainText(boundary.message);
      await expect(page.locator(boundary.selector).first()).toBeFocused();
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
    await assertDoubledRootReflow(page, ['#feedForm button[type="submit"]', '#resultPanel', '[data-result-action="json"]']);
    await assertSequentialKeyboard(page);
    expect(await page.evaluate(() => { const ids = [...document.querySelectorAll('[id]')].map(element => element.id); return ids.filter((id, index) => ids.indexOf(id) !== index); })).toEqual([]);
    await assertRouteShell(page, row, failures);
  });
}
