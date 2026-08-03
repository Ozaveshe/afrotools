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
const oracles = require('../../reports/sw-agriculture-farm-loans-oracles.json');
const { alternateEntries } = require('../../scripts/lib/fr-agriculture-hreflang');

const ROWS = manifest.rows.filter(row => row.family === 'farm-loans');
const ORACLE_BY_ID = new Map(oracles.rows.map(row => [row.englishId, row]));
const PORT = Number(process.env.SW_FARM_LOANS_PORT || 4398);
const SERVER_ROOT = `http://127.0.0.1:${PORT}`;
const CORRECTED_PROGRAM_NAMES = {
  ZA: 'CASP / DALRRD agricultural support',
  GH: 'Planting for Food and Jobs Phase II input-credit channel',
  EG: 'MSMEDA financing and support channels',
  RW: 'National Agriculture Insurance Scheme (NAIS)',
  CI: 'FAFCI women’s microcredit support',
  TN: 'APIA agricultural investment incentives',
};
const SENTINEL = [
  'worktree=sw-farm-loans-resume-20260803',
  'root=C:\\Users\\Oza\\.codex\\worktrees\\sw-farm-loans-resume-20260803\\afrotools',
  'branch=codex/sw-farm-loans-resume-20260803',
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
    if (/^https?:/i.test(request.url()) && !request.url().startsWith(`${SERVER_ROOT}/`)) state.external.push(request.url());
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
    else if (character === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else cell += character;
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
    const input = document.getElementById('amount');
    const inputStyle = getComputedStyle(input);
    const button = document.querySelector('#loanForm button[type="submit"]');
    const buttonStyle = getComputedStyle(button);
    input.focus();
    const focused = getComputedStyle(input);
    return {
      bodyText: body.color,
      bodyBackground: body.backgroundColor,
      inputText: inputStyle.color,
      inputBackground: inputStyle.backgroundColor,
      inputBorder: inputStyle.borderTopColor,
      buttonText: buttonStyle.color,
      buttonBackground: buttonStyle.backgroundColor,
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
      bodyText: body.color,
      bodyBackground: body.backgroundColor,
      cardBorder: cardStyle.borderTopColor,
      cardBackground: cardStyle.backgroundColor,
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
    const nodes = [...document.querySelectorAll('#loanForm input, #loanForm select, #loanForm button, #resultPanel button')]
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
    const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]';
    const nodes = [...document.querySelectorAll(selector)].filter(node => {
      if (node.offsetParent === null || node.tabIndex < 0) return false;
      if (node.matches('input[type="radio"]') && !node.checked) return false;
      return true;
    });
    nodes.forEach((node, index) => node.dataset.keyboardSequence = String(index));
    document.body.setAttribute('tabindex', '-1');
    document.body.focus();
    return nodes.map((node, index) => String(index));
  });
  const visited = [];
  for (let index = 0; index < expected.length + 3 && visited.length < expected.length; index += 1) {
    await page.keyboard.press('Tab');
    const current = await page.evaluate(() => document.activeElement && document.activeElement.dataset.keyboardSequence);
    if (current !== undefined) visited.push(current);
  }
  expect(visited).toEqual(expected);
}
async function assertTwoHundredPercentReflow(page) {
  const baselineRootFont = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize));
  expect(baselineRootFont).toBeGreaterThan(0);
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(
      doubled => {
        const root = document.documentElement;
        root.style.setProperty('transition', 'none', 'important');
        root.style.setProperty('font-size', `${doubled}px`, 'important');
      },
      baselineRootFont * 2
    );
    await expect.poll(
      () => page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize)),
      { timeout: 1000 }
    ).toBeGreaterThanOrEqual(baselineRootFont * 1.95);
    const metrics = await page.evaluate(() => {
      const visible = [...document.querySelectorAll('#resultPanel:not([hidden]), .loan-program-card, .farm-loans-app input, .farm-loans-app select, .farm-loans-app button')]
        .filter(node => node.getClientRects().length > 0)
        .map(node => {
          const rect = node.getBoundingClientRect();
          return { left: rect.left, right: rect.right, width: rect.width, scrollWidth: node.scrollWidth };
        });
      return {
        innerWidth: window.innerWidth,
        rootFont: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
        inlineRootFont: document.documentElement.style.getPropertyValue('font-size'),
        inlineRootPriority: document.documentElement.style.getPropertyPriority('font-size'),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        visible,
      };
    });
    expect(metrics.innerWidth).toBe(width);
    expect(metrics.rootFont).toBeGreaterThanOrEqual(baselineRootFont * 1.95);
    expect(metrics.rootFont).toBeLessThanOrEqual(baselineRootFont * 2.05);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    for (const item of metrics.visible) {
      expect(item.left).toBeGreaterThanOrEqual(-1);
      expect(item.right).toBeLessThanOrEqual(width + 1);
      expect(item.scrollWidth).toBeLessThanOrEqual(Math.ceil(item.width) + 1);
    }
    await page.evaluate(() => {
      document.documentElement.style.removeProperty('font-size');
      document.documentElement.style.removeProperty('transition');
    });
  }
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
  const sentinel = await page.evaluate(async () => (await fetch('/tests/fixtures/sw-farm-loans-worktree-sentinel.txt')).text());
  expect(sentinel.trim()).toBe(SENTINEL);
  await page.locator('.skip-link').focus();
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#contenu')).toBeFocused();
  await expect(page.locator('a[href^="/"]:not([href^="/sw/"])')).toHaveCount(0);
  expect(failures).toEqual({ consoleErrors: [], pageErrors: [], resourceFailures: [], responses: [], writes: [], external: [] });
}
async function fillValid(page, oracle) {
  const profile = oracle.validOracle.profile;
  await page.locator('#age').fill(String(profile.age));
  await page.locator('#farmSize').fill(String(profile.farmSize_ha));
  await page.locator('#amount').fill(String(profile.requestedAmount));
  await page.locator('#tenor').selectOption(String(profile.tenorMonths));
  await page.locator(profile.isCoop ? '#coopYes' : '#coopNo').check();
  await page.locator(profile.hasBankAccount ? '#bankYes' : '#bankNo').check();
  await page.locator(profile.hasCollateral ? '#collateralYes' : '#collateralNo').check();
  await page.locator(profile.hasRequiredTraining ? '#trainingYes' : '#trainingNo').check();
}
function runtimeProjection(results) {
  return results.map(result => ({
    id: result.program.id,
    eligible: result.eligible,
    rate: result.rate,
    blockers: result.blockers,
    warnings: result.warnings,
    repayment: result.repayment,
    rateAssumption: result.rateAssumption,
  }));
}

for (const row of ROWS) {
  test(`${row.english.id} full route local proof`, async ({ page, context }) => {
    const failures = watchFailures(page);
    await page.addInitScript(() => {
      localStorage.removeItem('afrotools-theme');
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async payload => { window.__farmLoanSharePayload = payload; },
      });
    });
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 900 });
    const response = await page.goto(row.swahili.routeKey);
    expect(response.status()).toBe(200);

    if (!row.country) {
      await expect(page.locator('.country-list a')).toHaveCount(15);
      await expect(page.getByText(/ukaguzi wa hazina ulifanywa 2 Agosti 2026/)).toBeVisible();
      await expect(page.getByRole('link', { name: 'IFAD - fedha za vijijini' })).toHaveAttribute('href', 'https://www.ifad.org/en/rural-finance');
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
      await page.setViewportSize({ width: 320, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await assertTwoHundredPercentReflow(page);
      await assertRouteShell(page, row, failures);
      return;
    }

    const oracle = ORACLE_BY_ID.get(row.english.id);
    expect(oracle).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(oracle.countryName);
    await expect(page.locator('meta[name="afrotools-country-id"]')).toHaveAttribute('content', row.country.code);
    await expect(page.locator('meta[name="afrotools-source-jurisdiction"]')).toHaveAttribute('content', row.country.code);
    await expect(page.locator('meta[name="afrotools-formula-jurisdiction"]')).toHaveAttribute('content', row.country.code);
    await expect(page.getByText(/hakuna ingizo linalotumwa kwa seva/i)).toBeVisible();
    await expect(page.getByText(/ukaguzi wa hazina ulifanywa 2 Agosti 2026/i)).toBeVisible();
    await expect(page.getByText(oracle.sourceNames, { exact: false })).toBeVisible();
    await expect(page.getByText(new RegExp(row.english.id))).toBeVisible();
    const controls = page.locator('#loanForm input, #loanForm select');
    for (let index = 0; index < await controls.count(); index += 1) {
      const id = await controls.nth(index).getAttribute('id');
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    }
    await expect(page.locator('#amount')).toHaveAttribute('min', String(oracle.amountContract.min));
    await expect(page.locator('#amount')).toHaveAttribute('step', String(oracle.amountContract.step));
    await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
    await fillValid(page, oracle);
    const calculate = page.getByRole('button', { name: 'Linganisha programu' });
    await calculate.focus();
    await expect(calculate).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#resultPanel')).toBeVisible();
    await expect(page.locator('#resultPanel')).toBeFocused();
    const runtime = await page.evaluate(() => ({
      results: window.__SW_AGRI_TEST__.latest.results,
      report: window.__SW_AGRI_TEST__.reportObject(),
      config: window.__SW_AGRI_PAGE__,
    }));
    expect(runtime.config.aiRouteId).toBe(row.english.id);
    expect(runtime.report.nchi.code).toBe(row.country.code);
    expect(runtime.report.chanzo.marejeoYaNchi).toBe(oracle.sourceNames);
    expect(runtime.report.chanzo.ushahidiWaRekodi).toBe('data/agriculture/agri-loans-evidence.js');
    expect(runtime.report.chanzo.dataMojaKwaMoja).toBe(false);
    expect(runtimeProjection(runtime.results)).toEqual(oracle.validOracle.expected);
    await expect(page.locator('.program-source a')).toHaveCount(oracle.validOracle.expected.length);
    if (CORRECTED_PROGRAM_NAMES[row.country.code]) {
      await expect(page.getByRole('heading', { name: CORRECTED_PROGRAM_NAMES[row.country.code] })).toBeVisible();
    }
    if (row.country.code === 'NG') {
      const abpCard = page.locator('.loan-program-card').filter({ has: page.getByRole('heading', { name: 'Anchor Borrowers Programme (ABP)' }) });
      await expect(abpCard.getByText('Kulingana na programu', { exact: true })).toBeVisible();
    }
    for (const result of runtime.report.matokeo) {
      expect(result.rekodi.kiungoRasmi).toMatch(/^https:\/\//);
      expect(result.rekodi.chanzoRasmi).toBeTruthy();
      expect(result.rekodi.tareheYaUkaguzi).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.rekodi.tareheYaRekodiAuUanzo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    const ranged = runtime.results.find(result => result.rateAssumption && result.rateAssumption.method === 'midpoint-of-published-range');
    if (ranged) await expect(page.getByText(/Dhana ya marejesho: katikati ya wigo wa riba/).first()).toBeVisible();

    const exports = [
      {
        name: 'Pakua JSON', extension: '.json', verify: buffer => {
          const parsed = JSON.parse(buffer.toString('utf8'));
          expect(parsed.nchi.code).toBe(row.country.code);
          expect(parsed.matokeo).toHaveLength(oracle.validOracle.expected.length);
          expect(parsed.matokeo[0].programuId).toBe(oracle.validOracle.expected[0].id);
          expect(parsed.chanzo.marejeoYaNchi).toBe(oracle.sourceNames);
          expect(parsed.matokeo.every(result => /^https:\/\//.test(result.rekodi.kiungoRasmi))).toBe(true);
        },
      },
      {
        name: 'Pakua TXT', extension: '.txt', verify: buffer => {
          const text = buffer.toString('utf8');
          expect(text).toContain('Mikopo ya shamba');
          expect(text).toContain(`Chanzo: ${oracle.sourceNames}`);
          expect(text).toContain('Marejeo ya programu:');
          expect(text).toContain('https://');
          expect(text).not.toContain('&amp;');
        },
      },
      {
        name: 'Pakua CSV', extension: '.csv', verify: buffer => {
          const parsed = parseCsv(buffer.toString('utf8'));
          expect(parsed[0]).toContain('marejeo_ya_nchi');
          expect(parsed[0]).toContain('kiungo_rasmi');
          expect(parsed[0]).toContain('mbinu_ya_kiwango');
          expect(parsed).toHaveLength(oracle.validOracle.expected.length + 1);
          const sourceIndex = parsed[0].indexOf('marejeo_ya_nchi');
          const countryIndex = parsed[0].indexOf('code_nchi');
          expect(parsed[1][countryIndex]).toBe(row.country.code);
          expect(parsed[1][sourceIndex]).toBe(oracle.sourceNames);
        },
      },
      {
        name: 'Pakua PDF', extension: '.pdf', verify: async buffer => {
          expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
          const parsed = await pdfParse(buffer);
          expect(parsed.text).toContain('Mikopo ya shamba');
          expect(parsed.text).toContain(`(${row.country.code})`);
          expect(parsed.text).toContain('Chanzo:');
        },
      },
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
    const saved = await page.evaluate(code => localStorage.getItem(`afrotools:sw-agriculture:farm-loans:${code}`), row.country.code);
    expect(JSON.parse(saved).nchi.code).toBe(row.country.code);
    expect(JSON.parse(saved).chanzo.marejeoYaNchi).toBe(oracle.sourceNames);
    await page.getByRole('button', { name: 'Shiriki' }).click();
    const share = await page.evaluate(() => window.__farmLoanSharePayload);
    expect(share.url).toBe(`${SERVER_ROOT}${row.swahili.routeKey}`);
    expect(share.text).toContain('Mikopo ya shamba');
    expect(share.text).toContain(`Chanzo: ${oracle.sourceNames}`);
    expect(share.text).toContain('Marejeo ya programu:');

    const tenorBoundary = await page.evaluate(code => {
      const programs = window.__SW_AGRI_TEST__.data[code].programs;
      const program = programs.find(item => item.tenor_months && item.tenor_months.min > 6)
        || programs.find(item => item.tenor_months && item.tenor_months.max > 0 && item.tenor_months.max < 60);
      if (!program) return null;
      return { id: program.id, value: program.tenor_months.min > 6 ? 6 : 60, kind: program.tenor_months.min > 6 ? 'Minimum tenor:' : 'Maximum tenor:' };
    }, row.country.code);
    expect(tenorBoundary).toBeTruthy();
    await fillValid(page, oracle);
    await page.locator('#tenor').selectOption(String(tenorBoundary.value));
    await calculate.click();
    const tenorResult = await page.evaluate(id => window.__SW_AGRI_TEST__.latest.results.find(result => result.program.id === id), tenorBoundary.id);
    expect(tenorResult.blockers.some(blocker => blocker.startsWith(tenorBoundary.kind))).toBe(true);

    if (row.country.code === 'NG') {
      await fillValid(page, oracle);
      await page.locator('#trainingNo').check();
      await calculate.click();
      const blockedTraining = await page.evaluate(() => window.__SW_AGRI_TEST__.latest.results.find(result => result.program.id === 'agsmeis'));
      expect(blockedTraining.eligible).toBe(false);
      expect(blockedTraining.blockers).toContain('Mandatory entrepreneurship training required before application');
      await page.locator('#trainingYes').check();
      await calculate.click();
      const clearedTraining = await page.evaluate(() => window.__SW_AGRI_TEST__.latest.results.find(result => result.program.id === 'agsmeis'));
      expect(clearedTraining.blockers).not.toContain('Mandatory entrepreneurship training required before application');
    }

    const invalidCases = [
      { selector: '#age', value: '15', message: 'miaka 16 na 80' },
      { selector: '#age', value: '81', message: 'miaka 16 na 80' },
      { selector: '#farmSize', value: '0', message: 'ha 0.1 na 10,000' },
      { selector: '#farmSize', value: '10001', message: 'ha 0.1 na 10,000' },
      { selector: '#amount', value: String(oracle.amountContract.min - 1), message: 'kisichopungua' },
      { selector: '#tenor', invalidSelect: true, message: 'muda halali' },
    ];
    for (const boundary of invalidCases) {
      await fillValid(page, oracle);
      await calculate.click();
      await expect(page.locator('#resultPanel')).toBeVisible();
      if (boundary.invalidSelect) {
        await page.evaluate(() => {
          const select = document.getElementById('tenor');
          const option = document.createElement('option');
          option.value = '999';
          option.textContent = '999';
          select.appendChild(option);
          select.value = '999';
          select.dispatchEvent(new Event('input', { bubbles: true }));
        });
      } else {
        await page.locator(boundary.selector).fill(boundary.value);
      }
      await expect(page.locator('#resultPanel')).toBeHidden();
      await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
      expect(await page.evaluate(() => window.__SW_AGRI_TEST__.latest)).toBeNull();
      await calculate.click();
      await expect(page.getByRole('alert')).toContainText(boundary.message);
      await expect(page.locator(boundary.selector)).toBeFocused();
      await expect(page.locator('#resultPanel')).toBeHidden();
      await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
    }

    await fillValid(page, oracle);
    await calculate.click();
    await page.getByRole('button', { name: 'Weka upya' }).click();
    await expect(page.locator('#resultPanel')).toBeHidden();
    await expect(page.locator('[data-result-action]:enabled')).toHaveCount(0);
    await expect(page.locator('#age')).toBeFocused();
    await expect(page.locator('#amount')).toHaveValue(String(oracle.amountContract.default));
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
    await page.setViewportSize({ width: 320, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.setViewportSize({ width: 375, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await assertTwoHundredPercentReflow(page);
    expect(await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    })).toEqual([]);
    await assertRouteShell(page, row, failures);
  });
}
