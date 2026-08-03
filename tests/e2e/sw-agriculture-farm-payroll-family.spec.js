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
const oracles = require('../../reports/sw-agriculture-farm-payroll-oracles.json');
const { alternateEntries } = require('../../scripts/lib/fr-agriculture-hreflang');

const PORT = Number(process.env.SW_FARM_PAYROLL_PORT || 4395);
const ROWS = manifest.rows.filter(row => row.family === 'farm-payroll');
const ORACLE_BY_ID = new Map(oracles.rows.map(row => [row.englishId, row]));
const SENTINEL = [
  'worktree=sw-farm-payroll-resume-20260803',
  'root=C:\\Users\\Oza\\.codex\\worktrees\\sw-farm-payroll-resume-20260803\\afrotools',
  'branch=codex/sw-farm-payroll-resume-20260803',
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
function parseCsv(text) {
  const source = String(text).replace(/^\ufeff/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') { row.push(cell); cell = ''; }
    else if (character === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += character;
  }
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
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
    const input = document.getElementById('grossPay');
    const inputStyle = getComputedStyle(input);
    const button = document.querySelector('#payrollForm button[type="submit"]');
    const buttonStyle = getComputedStyle(button);
    input.focus();
    const focused = getComputedStyle(input);
    return {
      bodyText: body.color, bodyBackground: body.backgroundColor,
      inputText: inputStyle.color, inputBackground: inputStyle.backgroundColor,
      inputBorder: inputStyle.borderTopColor,
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
    return {
      bodyText: body.color, bodyBackground: body.backgroundColor,
      cardBorder: cardStyle.borderTopColor, cardBackground: cardStyle.backgroundColor,
      linkText: linkStyle.color,
      linkBackground: linkStyle.backgroundColor === 'rgba(0, 0, 0, 0)' ? cardStyle.backgroundColor : linkStyle.backgroundColor,
      focusOutline: linkStyle.outlineColor,
    };
  });
  expect(contrast(values.bodyText, values.bodyBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(values.linkText, values.linkBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(values.cardBorder, values.cardBackground)).toBeGreaterThanOrEqual(3);
  expect(contrast(values.focusOutline, values.linkBackground)).toBeGreaterThanOrEqual(3);
}
async function assertKeyboardFocus(page) {
  const failures = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('#payrollForm input, #payrollForm select, #payrollForm button, #resultPanel button')]
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
  for (const alternate of alternateEntries(row)) {
    await expect(page.locator(`link[rel="alternate"][hreflang="${alternate.hreflang}"]`)).toHaveAttribute('href', `https://afrotools.com${alternate.route}`);
  }
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://afrotools.com${row.swahili.routeKey}`);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `https://afrotools.com/${row.artwork.file}`);
  const schema = await page.locator('script[type="application/ld+json"]').first().evaluate(node => JSON.parse(node.textContent));
  expect(schema.inLanguage).toBe('sw');
  const image = page.locator('.hero-art');
  await expect(image).toBeVisible();
  expect(await image.evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const sentinel = await page.evaluate(async () => (await fetch('/tests/fixtures/sw-farm-payroll-worktree-sentinel.txt')).text());
  expect(sentinel.trim()).toBe(SENTINEL);
  await page.locator('.skip-link').focus();
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#contenu')).toBeFocused();
  await expect(page.locator('a[href^="/"]:not([href^="/sw/"])')).toHaveCount(0);
  expect(failures).toEqual({ consoleErrors: [], pageErrors: [], resourceFailures: [], responses: [], writes: [], external: [] });
}
async function fillValid(page, oracle, mode = 'permanent') {
  const expected = mode === 'casual' ? oracle.validOracles.casual : mode === 'piece_rate' ? oracle.validOracles.pieceRate : oracle.validOracles.permanent;
  const input = expected.input;
  await page.locator('#workerType').selectOption(mode);
  await page.locator('#numWorkers').fill(String(input.numWorkers));
  if (mode !== 'piece_rate') await page.locator('#grossPay').fill(String(input.grossPay));
  if (mode === 'casual') await page.locator('#daysWorked').fill(String(input.daysWorked));
  if (mode === 'piece_rate') {
    await page.locator('#ratePerUnit').fill(String(input.ratePerUnit));
    await page.locator('#unitsCompleted').fill(String(input.unitsCompleted));
  }
  await page.locator('#overtimeHours').fill(String(input.overtimeHours || 0));
  await page.locator('#inKindHousing').fill(String(input.inKindHousing || 0));
  await page.locator('#inKindFood').fill(String(input.inKindFood || 0));
  return expected;
}
function projection(result) {
  return {
    currency: result.currency,
    workerType: result.workerType,
    numWorkers: result.numWorkers,
    baseGross: result.baseGross,
    overtimePay: result.overtimePay,
    inKindValue: result.inKindValue,
    grossForDeductions: result.grossForDeductions,
    totalDeductions: result.totalDeductions,
    netPay: result.netPay,
    totalEmployerCost: result.totalEmployerCost,
    farmMonthlyCost: result.farmMonthlyCost,
    farmAnnualCost: result.farmAnnualCost,
    mwCheck: result.mwCheck,
    likelyTaxable: result.likelyTaxable,
    laborLaw: result.laborLaw,
  };
}

for (const row of ROWS) {
  test(`${row.english.id} full route local proof`, async ({ page, context }) => {
    const failures = watchFailures(page);
    await page.addInitScript(() => {
      localStorage.removeItem('afrotools-theme');
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async payload => { window.__farmPayrollSharePayload = payload; },
      });
    });
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 900 });
    const response = await page.goto(row.swahili.routeKey);
    expect(response.status()).toBe(200);

    if (!row.country) {
      await expect(page.locator('.country-list a')).toHaveCount(54);
      await expect(page.getByText(/picha tuli ya utafiti wa 2024/i)).toBeVisible();
      await expect(page.getByRole('link', { name: 'Rasilimali za kazi ya kilimo za ILO' })).toHaveAttribute('href', 'https://www.ilo.org/industries-and-sectors/agriculture-plantations-other-rural-sectors');
      await expect(page.getByRole('link', { name: 'hifadhidata ya ILO NATLEX' })).toHaveAttribute('href', 'https://natlex.ilo.org/');
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
    await expect(page.locator('meta[name="afrotools-source-jurisdiction"]')).toHaveAttribute('content', row.country.code);
    await expect(page.locator('meta[name="afrotools-formula-jurisdiction"]')).toHaveAttribute('content', row.country.code);
    await expect(page.getByText(/hakuna ingizo la mishahara linalotumwa kwa seva/i)).toBeVisible();
    await expect(page.getByText(/picha tuli ya utafiti wa 2024/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Hifadhidata ya ILO NATLEX' })).toHaveAttribute('href', 'https://natlex.ilo.org/');
    await expect(page.getByText(new RegExp(row.english.id))).toBeVisible();
    const controls = page.locator('#payrollForm input, #payrollForm select');
    for (let index = 0; index < await controls.count(); index += 1) {
      const id = await controls.nth(index).getAttribute('id');
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    }
    await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
    const expected = await fillValid(page, oracle);
    const calculate = page.getByRole('button', { name: 'Kokotoa mishahara' });
    await calculate.focus();
    await expect(calculate).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#resultPanel')).toBeVisible();
    await expect(page.locator('#resultPanel')).toBeFocused();
    const runtime = await page.evaluate(() => ({
      result: window.__SW_AGRI_TEST__.latest.result,
      report: window.__SW_AGRI_TEST__.reportObject(),
      config: window.__SW_AGRI_PAGE__,
    }));
    expect(runtime.config.aiRouteId).toBe(row.english.id);
    expect(runtime.report.nchi.code).toBe(row.country.code);
    expect(runtime.report.chanzo.dataMojaKwaMoja).toBe(false);
    expect(projection(runtime.result)).toEqual(projection(expected.expected));
    expect(runtime.report.matokeo.gharamaShambaKwaMwezi).toBe(expected.expected.farmMonthlyCost);
    await expect(page.locator('#farmMonthly')).not.toHaveText('?');

    const exportCases = [
      {
        name: 'Pakua JSON', extension: '.json', verify: buffer => {
          const parsed = JSON.parse(buffer.toString('utf8'));
          expect(parsed.nchi.code).toBe(row.country.code);
          expect(parsed.matokeo.gharamaShambaKwaMwezi).toBe(expected.expected.farmMonthlyCost);
          expect(parsed.chanzo.dataMojaKwaMoja).toBe(false);
        },
      },
      {
        name: 'Pakua TXT', extension: '.txt', verify: buffer => {
          const text = buffer.toString('utf8').replace(/^\ufeff/, '');
          expect(text).toContain('Mishahara ya wafanyakazi wa shamba');
          expect(text).toContain(`(${row.country.code})`);
          expect(text).toContain('Chanzo: Hifadhidata ya ILO NATLEX');
          expect(text).not.toMatch(/&amp;|Calculate payroll|Data sources:/i);
        },
      },
      {
        name: 'Pakua CSV', extension: '.csv', verify: buffer => {
          const parsed = parseCsv(buffer.toString('utf8'));
          expect(parsed).toHaveLength(2);
          expect(parsed[0]).toContain('gharama_shamba_mwezi');
          expect(parsed[1][parsed[0].indexOf('code_nchi')]).toBe(row.country.code);
          expect(Number(parsed[1][parsed[0].indexOf('gharama_shamba_mwezi')])).toBe(expected.expected.farmMonthlyCost);
          expect(parsed[1][parsed[0].indexOf('data_moja_kwa_moja')]).toBe('hapana');
        },
      },
      {
        name: 'Pakua PDF', extension: '.pdf', verify: async buffer => {
          expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
          const parsed = await pdfParse(buffer);
          expect(parsed.text).toContain('Mishahara ya wafanyakazi wa shamba');
          expect(parsed.text).toContain(`(${row.country.code})`);
          expect(parsed.text).toContain('Chanzo: Hifadhidata ya ILO NATLEX');
        },
      },
    ];
    for (const item of exportCases) {
      const pending = page.waitForEvent('download');
      await page.getByRole('button', { name: item.name }).click();
      const download = await pending;
      expect(download.suggestedFilename().toLowerCase()).toContain(row.country.code.toLowerCase());
      expect(download.suggestedFilename().toLowerCase().endsWith(item.extension)).toBe(true);
      await item.verify(await downloadBuffer(download));
    }
    await page.getByRole('button', { name: 'Hifadhi kwenye kivinjari' }).click();
    const saved = await page.evaluate(code => localStorage.getItem(`afrotools:sw-agriculture:farm-payroll:${code}`), row.country.code);
    expect(JSON.parse(saved).nchi.code).toBe(row.country.code);
    expect(JSON.parse(saved).matokeo.gharamaShambaKwaMwezi).toBe(expected.expected.farmMonthlyCost);
    await page.getByRole('button', { name: 'Nakili' }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('Mishahara ya wafanyakazi wa shamba');
    expect(copied).toContain(`(${row.country.code})`);
    await page.getByRole('button', { name: 'Shiriki' }).click();
    const share = await page.evaluate(() => window.__farmPayrollSharePayload);
    expect(share.url).toBe(`http://127.0.0.1:${PORT}${row.swahili.routeKey}`);
    expect(share.text).toContain('Mishahara ya wafanyakazi wa shamba');
    expect(share.text).toContain('Chanzo: Hifadhidata ya ILO NATLEX');

    const invalidCases = [
      { mode: 'permanent', selector: '#numWorkers', value: '0', message: 'kati ya 1 na 100,000' },
      { mode: 'permanent', selector: '#numWorkers', value: '100001', message: 'kati ya 1 na 100,000' },
      { mode: 'permanent', selector: '#grossPay', value: '0', message: 'mshahara wa mwezi unaozidi sifuri' },
      { mode: 'casual', selector: '#daysWorked', value: '0', message: 'siku kamili kati ya 1 na 31' },
      { mode: 'casual', selector: '#daysWorked', value: '32', message: 'siku kamili kati ya 1 na 31' },
      { mode: 'piece_rate', selector: '#ratePerUnit', value: '0', message: 'malipo kwa kazi yanayozidi sifuri' },
      { mode: 'piece_rate', selector: '#unitsCompleted', value: '0', message: 'kazi kati ya 1 na 1,000,000' },
      { mode: 'permanent', selector: '#overtimeHours', value: '-1', message: 'saa za ziada kati ya 0 na 744' },
      { mode: 'permanent', selector: '#overtimeHours', value: '745', message: 'saa za ziada kati ya 0 na 744' },
      { mode: 'permanent', selector: '#inKindHousing', value: '-1', message: 'nyumba haiwezi kuwa chini ya sifuri' },
      { mode: 'permanent', selector: '#inKindFood', value: '-1', message: 'chakula haiwezi kuwa chini ya sifuri' },
    ];
    for (const boundary of invalidCases) {
      await fillValid(page, oracle, boundary.mode);
      await calculate.click();
      await expect(page.locator('#resultPanel')).toBeVisible();
      await page.locator(boundary.selector).fill(boundary.value);
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
    await page.getByRole('button', { name: 'Weka upya' }).click();
    await expect(page.locator('#resultPanel')).toBeHidden();
    await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
    await expect(page.locator('#workerType')).toBeFocused();
    await fillValid(page, oracle);
    await calculate.click();
    await assertKeyboardFocus(page);
    await assertSequentialKeyboard(page);
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
    await assertDoubledRootReflow(page, ['#payrollForm button[type="submit"]', '#resultPanel', '[data-result-action="json"]']);
    expect(await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    })).toEqual([]);
    await assertRouteShell(page, row, failures);
  });
}
