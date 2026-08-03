'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const pdfParse = require('pdf-parse');
const { test, expect } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '../..');
const manifest = require('../../data/localization/sw-agriculture-parity-manifest.json');
const ROWS = manifest.rows.filter(row => row.family === 'seed-rate');
const COUNTRY_ROWS = ROWS.filter(row => row.country);
const HUB = ROWS.find(row => !row.country);
const evidence = new Map();
const CONTRAST_MODES = ['light', 'dark', 'system-light', 'system-dark'];

function loadScript(sandbox, relative) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, relative), 'utf8'), sandbox, { filename: relative });
}

function oracleFor(row) {
  const code = row.country.code;
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  loadScript(sandbox, `data/agriculture/${code.toLowerCase()}-agri-data.js`);
  loadScript(sandbox, 'data/agriculture/seed-data.js');
  loadScript(sandbox, 'engines/src/seed-rate-engine.js');
  loadScript(sandbox, 'data/agriculture/seed-data-extension.js');
  const runtime = sandbox.window.AfroTools;
  const crop = runtime.countryData.crops.find(candidate => runtime.seedData[candidate.id]);
  const seed = runtime.seedData[crop.id];
  const override = seed.countryOverrides && seed.countryOverrides[code] || {};
  const spacing = override.spacing || seed.defaultSpacing || {};
  const input = {
    cropId: crop.id,
    farmSizeHa: runtime.countryData.agriStats.avgFarmSizeHa || 1,
    seedQuality: 'improved', fieldConditions: 'average', intercrop: 'sole',
    plantingMethod: override.method || seed.plantingMethod && seed.plantingMethod[0] || 'drilling',
    rowSpacing_cm: spacing.row_cm || 100,
    plantSpacing_cm: spacing.plant_cm === 'continuous' ? 10 : spacing.plant_cm || 100,
    seedsPerHole: override.seedsPerHole || seed.seedsPerHole || 1
  };
  return { input, result: JSON.parse(JSON.stringify(runtime.SeedRateEngine.calculate(input, runtime.seedData, code, runtime.countryData))) };
}

function watchRuntime(page) {
  const errors = [];
  const writes = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(`console:${message.text()}`); });
  page.on('pageerror', error => errors.push(`pageerror:${error.message}`));
  page.on('requestfailed', request => errors.push(`requestfailed:${request.url()} ${request.failure() && request.failure().errorText}`));
  page.on('response', response => { if (response.status() >= 400) errors.push(`http:${response.status()} ${response.url()}`); });
  page.on('request', request => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
  });
  return { errors, writes };
}

async function downloadBuffer(page, action) {
  const pending = page.waitForEvent('download');
  await page.locator(`[data-result-action="${action}"]`).click();
  const download = await pending;
  return { filename: download.suggestedFilename(), buffer: fs.readFileSync(await download.path()) };
}

async function noOverflow(page, label) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), label).toBe(true);
}

async function theme(page, value) {
  await page.waitForLoadState('load');
  await page.evaluate(selected => {
    document.documentElement.dataset.theme = selected;
    localStorage.setItem('afrotools-theme', selected);
    document.getElementById('themeToggle').setAttribute('aria-pressed', selected === 'dark' ? 'true' : 'false');
  }, value);
  const expected = value === 'dark' ? 'rgb(13, 22, 36)' : 'rgb(245, 248, 252)';
  await expect(page.locator('html')).toHaveAttribute('data-theme', value);
  await expect.poll(() => page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).toBe(expected);
}

async function applyContrastMode(page, mode) {
  const colorScheme = mode.endsWith('dark') ? 'dark' : 'light';
  const rootTheme = mode.startsWith('system-') ? 'system' : mode;
  await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
  await page.evaluate(({ selectedTheme, selectedScheme }) => {
    document.documentElement.dataset.theme = selectedTheme;
    document.documentElement.style.colorScheme = selectedScheme;
  }, { selectedTheme: rootTheme, selectedScheme: colorScheme });
  const expected = colorScheme === 'dark' ? 'rgb(13, 22, 36)' : 'rgb(245, 248, 252)';
  await expect.poll(() => page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).toBe(expected);
}

async function inspectRenderedContrast(page, mode) {
  await applyContrastMode(page, mode);
  await page.keyboard.press('Tab');
  return page.evaluate(selectedMode => {
    function channels(value) {
      const css4 = value.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/i);
      if (css4) return [Number(css4[1]) * 255, Number(css4[2]) * 255, Number(css4[3]) * 255, css4[4] == null ? 1 : Number(css4[4])];
      const match = value.match(/[\d.]+/g);
      return match ? [Number(match[0]), Number(match[1]), Number(match[2]), match[3] == null ? 1 : Number(match[3])] : [0, 0, 0, 0];
    }
    function luminance(color) {
      return color.slice(0, 3).map(value => {
        const channel = value / 255;
        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    }
    function ratio(first, second) {
      const left = luminance(first);
      const right = luminance(second);
      return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
    }
    function backgroundFor(element) {
      for (let current = element; current; current = current.parentElement) {
        const background = channels(getComputedStyle(current).backgroundColor);
        if (background[3] > 0.99) return background;
      }
      return selectedMode.endsWith('dark') ? [13, 22, 36, 1] : [245, 248, 252, 1];
    }
    function visible(element) {
      const style = getComputedStyle(element);
      const rectangle = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rectangle.width > 0 && rectangle.height > 0;
    }
    function labelFor(element) {
      return element.id || element.getAttribute('data-result-action') || element.textContent.trim().slice(0, 80) || element.tagName.toLowerCase();
    }

    const failures = [];
    const controls = [...document.querySelectorAll('button:not(:disabled),input:not(:disabled):not([type="hidden"]),select:not(:disabled)')].filter(visible);
    const focusables = [...document.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled):not([type="hidden"]),select:not(:disabled)')].filter(visible);
    const boundaryRatios = [];
    const textRatios = [];
    const focusRatios = [];

    for (const element of controls) {
      const style = getComputedStyle(element);
      const outside = backgroundFor(element.parentElement);
      const inside = backgroundFor(element);
      const border = channels(style.borderTopColor);
      const boundary = Math.max(ratio(border, outside), ratio(inside, outside));
      const text = ratio(channels(style.color), inside);
      boundaryRatios.push(boundary);
      textRatios.push(text);
      if (boundary + 0.001 < 3) failures.push({ kind: 'boundary', control: labelFor(element), ratio: Number(boundary.toFixed(3)) });
      if (text + 0.001 < 4.5) failures.push({ kind: 'text', control: labelFor(element), ratio: Number(text.toFixed(3)) });
    }

    for (const element of focusables) {
      element.focus();
      const style = getComputedStyle(element);
      const outside = backgroundFor(element.parentElement);
      const outline = channels(style.outlineColor);
      const focus = ratio(outline, outside);
      const rendered = style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) >= 2;
      focusRatios.push(rendered ? focus : 0);
      if (!rendered || focus + 0.001 < 3) failures.push({ kind: 'focus', control: labelFor(element), ratio: Number((rendered ? focus : 0).toFixed(3)) });
    }
    document.activeElement && document.activeElement.blur();
    return {
      mode: selectedMode,
      controls: controls.length,
      focusables: focusables.length,
      minimumBoundary: Number(Math.min(...boundaryRatios).toFixed(3)),
      minimumText: Number(Math.min(...textRatios).toFixed(3)),
      minimumFocus: Number(Math.min(...focusRatios).toFixed(3)),
      failures
    };
  }, mode);
}

async function proveRenderedContrast(page, label) {
  const modes = [];
  for (const mode of CONTRAST_MODES) {
    const proof = await inspectRenderedContrast(page, mode);
    expect(proof.failures, `${label} ${mode} rendered contrast`).toEqual([]);
    expect(proof.minimumBoundary, `${label} ${mode} control boundary`).toBeGreaterThanOrEqual(3);
    expect(proof.minimumText, `${label} ${mode} control text`).toBeGreaterThanOrEqual(4.5);
    expect(proof.minimumFocus, `${label} ${mode} focus indicator`).toBeGreaterThanOrEqual(3);
    modes.push(proof);
  }
  await applyContrastMode(page, 'light');
  return {
    modes: CONTRAST_MODES,
    minimumBoundary: Math.min(...modes.map(item => item.minimumBoundary)),
    minimumText: Math.min(...modes.map(item => item.minimumText)),
    minimumFocus: Math.min(...modes.map(item => item.minimumFocus)),
    scenarios: modes
  };
}

async function downloadAndParsePdf(page) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const download = await downloadBuffer(page, 'pdf');
    expect(download.buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
    try {
      return { download, parsed: await pdfParse(download.buffer) };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

test.afterAll(() => {
  const output = path.join(ROOT, 'reports/sw-agriculture-acceptance/seed-rate-browser.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const rows = ROWS.map(row => evidence.get(row.swahili.routeKey) || {
    id: row.english.id, route: row.swahili.routeKey,
    countryCode: row.country && row.country.code || null,
    state: 'blocked', reason: 'No completed Chromium route receipt.'
  });
  const passed = rows.filter(row => row.state === 'passed');
  const contrastRows = passed.map(row => row.contrast).filter(Boolean);
  fs.writeFileSync(output, `${JSON.stringify({
    schemaVersion: 2, family: 'seed-rate', browser: 'chromium', expectedRows: 55,
    acceptedRows: rows.filter(row => row.state === 'passed').length,
    blockedIds: rows.filter(row => row.state !== 'passed').map(row => row.id),
    contrast: {
      modes: CONTRAST_MODES,
      provedRows: contrastRows.length,
      minimumBoundary: contrastRows.length ? Math.min(...contrastRows.map(item => item.minimumBoundary)) : 0,
      minimumText: contrastRows.length ? Math.min(...contrastRows.map(item => item.minimumText)) : 0,
      minimumFocus: contrastRows.length ? Math.min(...contrastRows.map(item => item.minimumFocus)) : 0
    },
    failClosed: true, rows
  }, null, 2)}\n`, 'utf8');
});

test('Seed Rate hub proves all 54 routes, both mobile widths and 200% reflow', async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(HUB.swahili.routeKey, { waitUntil: 'load' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('.country-list a')).toHaveCount(54);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${HUB.swahili.routeKey}`);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://afrotools.com${HUB.english.route}`);
  await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute('href', `https://afrotools.com${HUB.swahili.routeKey}`);
  await expect(page.locator('.hero-art')).toHaveAttribute('src', `/${HUB.artwork.file}`);
  await expect(page.getByText(/Hakuna ingizo linalotumwa kwa seva au AI/)).toBeVisible();
  await expect(page.getByText(/kiungo cha Msaidizi ni cha hiari/)).toBeVisible();
  await page.getByRole('link', { name: 'Msaidizi' }).focus();
  await expect(page.getByRole('link', { name: 'Msaidizi' })).toBeFocused();
  const contrast = await proveRenderedContrast(page, 'hub');
  await theme(page, 'light');
  await noOverflow(page, 'hub 375px light');
  await theme(page, 'dark');
  await page.setViewportSize({ width: 320, height: 900 });
  await noOverflow(page, 'hub 320px dark');
  await theme(page, 'light');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await noOverflow(page, 'hub 320px 200%');
  await expect(page.locator('a[href^="/"]:not([href^="/sw/"])')).toHaveCount(0);
  expect(runtime.writes).toEqual([]);
  expect(runtime.errors).toEqual([]);
  evidence.set(HUB.swahili.routeKey, {
    id: HUB.english.id, route: HUB.swahili.routeKey, countryCode: null, state: 'passed',
    countryLinks: 54, viewports: [320, 375], textReflowPercent: 200,
    themes: ['light', 'dark'], metadata: true, artwork: true,
    contrast,
    aiRoute: '/sw/ai/', aiConsentBoundary: true, consoleResourcesClean: true
  });
});

for (const row of COUNTRY_ROWS) {
  test(`${row.english.id}: deterministic oracle, fail-closed states and reopened exports`, async ({ page, context }) => {
    const code = row.country.code;
    const oracle = oracleFor(row);
    const runtime = watchRuntime(page);
    await page.addInitScript(() => { Object.defineProperty(navigator, 'share', { configurable: true, value: undefined }); });
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(row.swahili.routeKey, { waitUntil: 'load' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('meta[name="afrotools-country-id"]')).toHaveAttribute('content', code);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${row.swahili.routeKey}`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://afrotools.com${row.english.route}`);
    await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute('href', `https://afrotools.com${row.swahili.routeKey}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://afrotools.com${row.swahili.routeKey}`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `https://afrotools.com/${row.artwork.file}`);
    await expect(page.locator('.hero-art')).toHaveAttribute('src', `/${row.artwork.file}`);
    const schema = await page.locator('script[type="application/ld+json"]').first().evaluate(node => JSON.parse(node.textContent));
    expect(schema.inLanguage).toBe('sw');
    expect(schema.spatialCoverage.identifier).toBe(code);
    await expect(page.getByText(/Hakuna ingizo linalotumwa kwa seva/)).toBeVisible();
    await expect(page.getByText(/kikokotoo hiki hakitumi AI/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Msaidizi wa AfroTools' })).toHaveAttribute('href', '/sw/ai/');

    const controls = page.locator('input:not([type="hidden"]), select');
    for (let index = 0; index < await controls.count(); index += 1) {
      const id = await controls.nth(index).getAttribute('id');
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    }
    await theme(page, 'light');
    await noOverflow(page, `${code} 375px light`);
    const submit = page.getByRole('button', { name: 'Kokotoa kiasi' });
    await submit.focus();
    await expect(submit).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#resultPanel')).toBeVisible();
    const proof = await page.evaluate(() => ({
      latest: window.__SW_AGRI_TEST__.latest,
      report: window.__SW_AGRI_TEST__.reportObject(),
      data: { countryCode: window.__SW_AGRI_TEST__.data.countryCode, currency: window.__SW_AGRI_TEST__.data.currency }
    }));
    expect(proof.data.countryCode).toBe(code);
    expect(proof.latest.input).toEqual(oracle.input);
    expect(proof.latest.result).toEqual(oracle.result);
    expect(proof.report.language).toBe('sw');
    expect(proof.report.country.code).toBe(code);
    expect(proof.report.sources.live).toBe(false);
    expect(proof.report.confidence).toBe('planning-estimate');
    expect(proof.report.privacy).toEqual({ localOnly: true, sentToServer: false, sentToAI: false });
    expect(proof.report.ai).toEqual({ route: '/sw/ai/', optional: true, modelConsentHandledOnSeparatePage: true });

    const contrast = await proveRenderedContrast(page, code);

    const json = await downloadBuffer(page, 'json');
    const reopenedJson = JSON.parse(json.buffer.toString('utf8'));
    expect(json.filename).toMatch(new RegExp(`${code.toLowerCase()}.*\\.json$`));
    expect(reopenedJson.country.code).toBe(code);
    expect(reopenedJson.result).toEqual(oracle.result);
    const txt = await downloadBuffer(page, 'txt');
    expect(txt.buffer.toString('utf8')).toContain('makadirio ya kiwango cha mbegu');
    expect(txt.buffer.toString('utf8')).toContain('Faragha: hesabu ya ndani');
    const csv = await downloadBuffer(page, 'csv');
    expect(csv.buffer.toString('utf8')).toContain('kiasi_jumla');
    expect(csv.buffer.toString('utf8')).toContain(code);
    const pdf = await downloadAndParsePdf(page);
    expect(pdf.parsed.text).toContain('makadirio ya kiwango cha mbegu');
    expect(pdf.parsed.text).toContain('Faragha: hesabu ya ndani');
    await page.locator('[data-result-action="save"]').click();
    const saved = JSON.parse(await page.evaluate(key => localStorage.getItem(key), `afrotools:sw-agriculture:seed-rate:${code}`));
    expect(saved.country.code).toBe(code);
    expect(saved.result).toEqual(oracle.result);
    await page.locator('[data-result-action="copy"]').click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('kiwango cha mbegu');
    await page.locator('[data-result-action="share"]').click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(row.swahili.routeKey);

    await page.locator('#farmSize').fill('2');
    await expect(page.locator('#resultPanel')).toBeHidden();
    await expect(page.locator('[data-result-action]:not(:disabled)')).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText('kokotoa tena');
    await submit.click();
    await expect(page.locator('#resultPanel')).toBeVisible();
    await page.locator('#rowSpacing').fill('0');
    await submit.click();
    await expect(page.getByRole('alert')).toContainText('angalau sentimita 1');
    await expect(page.locator('#rowSpacing')).toBeFocused();
    await expect(page.locator('#resultPanel')).toBeHidden();
    await expect(page.locator('[data-result-action]:not(:disabled)')).toHaveCount(0);
    await page.locator('#rowSpacing').fill('60');
    await page.locator('#farmSize').fill('0');
    await submit.click();
    await expect(page.getByRole('alert')).toContainText('angalau hekta 0.1');
    await expect(page.locator('#farmSize')).toBeFocused();
    await expect(page.locator('#resultPanel')).toBeHidden();

    await theme(page, 'dark');
    await page.setViewportSize({ width: 320, height: 900 });
    await noOverflow(page, `${code} 320px dark`);
    await theme(page, 'light');
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await noOverflow(page, `${code} 320px 200%`);
    expect(await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    })).toEqual([]);
    await expect(page.locator('a[href^="/"]:not([href^="/sw/"])')).toHaveCount(0);
    expect(runtime.writes).toEqual([]);
    expect(runtime.errors).toEqual([]);
    evidence.set(row.swahili.routeKey, {
      id: row.english.id, route: row.swahili.routeKey, countryCode: code, state: 'passed',
      deterministicOracle: 'engines/src/seed-rate-engine.js', invalidStates: ['farmSize', 'rowSpacing'],
      staleResultCleared: true, exportGateFailClosed: true,
      exportsParsed: ['json', 'txt', 'csv', 'pdf'], localSaveReopened: true,
      copyShare: true, viewports: [320, 375], textReflowPercent: 200,
      themes: ['light', 'dark'], metadata: true, artwork: true,
      contrast,
      aiRoute: '/sw/ai/', aiConsentBoundary: true, consoleResourcesClean: true, networkWrites: 0
    });
  });
}
