const { test, expect } = require('@playwright/test');
const manifest = require('../../data/localization/sw-civil-site-works-parity-manifest.json');

const routes = {
  'site-clearance': {
    englishButton: 'Calculate Clearing Cost',
    englishResult: '#sc-total',
    swButton: 'Kadiria gharama ya eneo',
    keys: ['vegetationCost', 'treeCost', 'topsoilVolume', 'topsoilCost', 'demolitionCost', 'wasteVolume', 'wasteCost', 'total', 'costPerM2', 'days'],
    copied: { text: { Nchi:'Tanzania',Eneo:'1200 m²',Uoto:'Uoto wa wastani',Muda:'7 siku' }, numbers:{Jumla:28110000,'Kwa m²':23425} },
    invalid: async (page) => page.locator('#area').fill('0'),
    boundary: async (page) => {
      await page.locator('#country').selectOption('KE'); await page.locator('#area').fill('50'); await page.locator('#trees').fill('0');
      await page.locator('#terrain').selectOption('flat'); await page.locator('#vegetation').selectOption('light'); await page.locator('#removeTopsoil').selectOption('no');
      await page.locator('#demolition').selectOption('none'); await page.locator('#waste').selectOption('haul');
      return { total: 12500, costPerM2: 250, days: 1 };
    }
  },
  'road-construction-cost': {
    englishButton: 'Estimate Road Cost',
    englishResult: '#rc-grand',
    swButton: 'Kadiria gharama ya barabara',
    keys: ['baseCostPerKm', 'roadCost', 'drainageCost', 'lightingCost', 'total'],
    copied: { text: { Nchi:'Tanzania',Urefu:'2.5 km',Upana:'7.3 m',Uso:'Lami / bitumen' }, numbers:{'Kwa km':587125000,Jumla:1873875000} },
    invalid: async (page) => page.locator('#length').fill('0'),
    boundary: async (page) => {
      await page.locator('#country').selectOption('KE'); await page.locator('#length').fill('0.1'); await page.locator('#width').selectOption('3.5');
      await page.locator('#surface').selectOption('gravel'); await page.locator('#terrain').selectOption('flat'); await page.locator('#location').selectOption('rural');
      await page.locator('#includeDrainage').selectOption('no'); await page.locator('#includeLighting').selectOption('no');
      return { baseCostPerKm: 2029999.9999999998, roadCost: 203000, total: 203000 };
    }
  }
};

function close(actual, expected, label, tolerance = 1e-12) {
  expect(Math.abs(actual - expected), label).toBeLessThanOrEqual(Math.max(1e-8, Math.abs(expected) * tolerance));
}

function parseCopiedReport(text) {
  const values = {};
  for (const line of String(text).split(/\r?\n/)) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

function currencyNumber(value) {
  const matches = String(value).match(/[\d,.]+/g);
  return matches ? Number(matches[matches.length - 1].replace(/,/g, '')) : NaN;
}

function assertCopiedReport(text, expected, label) {
  const parsed = parseCopiedReport(text);
  for (const [key, value] of Object.entries(expected.text)) expect(parsed[key], `${label} ${key}`).toBe(value);
  for (const [key, value] of Object.entries(expected.numbers)) close(currencyNumber(parsed[key]), value, `${label} ${key}`);
  expect(text, `${label} finite`).not.toMatch(/NaN|Infinity|undefined/);
  return parsed;
}

async function downloadBuffer(page, name) {
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name }).click();
  const download = await waiting;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function fillInputs(page, inputs, english, id) {
  const map = english && id === 'site-clearance'
    ? { country: 'sc-country', area: 'sc-area', trees: 'sc-trees', terrain: 'sc-terrain', vegetation: 'sc-veg', removeTopsoil: 'sc-topsoil', demolition: 'sc-demo', waste: 'sc-waste' }
    : english && id === 'road-construction-cost'
      ? { country: 'rc-country', length: 'rc-length', width: 'rc-width', surface: 'rc-surface', terrain: 'rc-terrain', location: 'rc-location', includeDrainage: 'rc-drainage', includeLighting: 'rc-lighting' }
      : Object.fromEntries(Object.keys(inputs).map((key) => [key, key]));
  for (const [key, raw] of Object.entries(inputs)) {
    const control = page.locator('#' + map[key]);
    const tag = await control.evaluate((node) => node.tagName);
    let value = raw;
    if (typeof raw === 'boolean') value = raw ? 'yes' : 'no';
    if (tag === 'SELECT') await control.selectOption(String(value)); else await control.fill(String(value));
  }
}

async function exactEngineReport(page, app) {
  return page.evaluate(({ globalName, inputs }) => window.AfroTools[globalName].calculate(inputs), { globalName: app.engineGlobal, inputs: app.oracle.inputs });
}

async function assertControlContrast(page, route) {
  const modes = [
    { name: 'light', theme: 'light', scheme: 'light' },
    { name: 'dark', theme: 'dark', scheme: 'dark' },
    { name: 'system-light', theme: null, scheme: 'light' },
    { name: 'system-dark', theme: null, scheme: 'dark' }
  ];
  const measurements = {};
  for (const mode of modes) {
    await page.emulateMedia({ colorScheme: mode.scheme, reducedMotion: 'reduce' });
    await page.evaluate((theme) => {
      if (theme) { document.documentElement.dataset.theme = theme; delete document.documentElement.dataset.themeChoice; }
      else { delete document.documentElement.dataset.theme; document.documentElement.dataset.themeChoice = 'auto'; }
    }, mode.theme);
    const selectors = await page.locator('.sw-civil-field input, .sw-civil-field select, .sw-civil-field textarea').evaluateAll((nodes) => nodes.filter((node) => node.offsetParent !== null).map((node) => '#' + CSS.escape(node.id)));
    let boundaryMin = Infinity; let textMin = Infinity; let focusMin = Infinity;
    for (const selector of selectors) {
      const control = page.locator(selector);
      const normal = await control.evaluate((node) => {
        function rgb(value) { const values = value.match(/[\d.]+/g); if (!values || values.length < 3) throw new Error('color ' + value); return values.slice(0, 3).map(Number); }
        function channel(value) { value /= 255; return value <= .04045 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4); }
        function luminance(value) { const parts = rgb(value); return .2126 * channel(parts[0]) + .7152 * channel(parts[1]) + .0722 * channel(parts[2]); }
        function ratio(left, right) { const a = luminance(left); const b = luminance(right); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); }
        const style = getComputedStyle(node); const card = getComputedStyle(node.closest('.sw-civil-card'));
        return { boundary: Math.min(ratio(style.borderTopColor, style.backgroundColor), ratio(style.borderTopColor, card.backgroundColor)), text: ratio(style.color, style.backgroundColor), colors: { border: style.borderTopColor, text: style.color, background: style.backgroundColor, surface: card.backgroundColor } };
      });
      expect(normal.boundary, `${route} ${mode.name} ${selector} boundary ${JSON.stringify(normal.colors)}`).toBeGreaterThanOrEqual(3);
      expect(normal.text, `${route} ${mode.name} ${selector} text ${JSON.stringify(normal.colors)}`).toBeGreaterThanOrEqual(4.5);
      await control.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
      const focused = await control.evaluate((node) => {
        function rgb(value) { return value.match(/[\d.]+/g).slice(0, 3).map(Number); }
        function channel(value) { value /= 255; return value <= .04045 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4); }
        function luminance(value) { const parts = rgb(value); return .2126 * channel(parts[0]) + .7152 * channel(parts[1]) + .0722 * channel(parts[2]); }
        function ratio(left, right) { const a = luminance(left); const b = luminance(right); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); }
        const style = getComputedStyle(node); const card = getComputedStyle(node.closest('.sw-civil-card'));
        return { visible: node.matches(':focus-visible'), width: parseFloat(style.outlineWidth) || 0, contrast: Math.min(ratio(style.outlineColor, style.backgroundColor), ratio(style.outlineColor, card.backgroundColor)), colors: { outline: style.outlineColor, background: style.backgroundColor, surface: card.backgroundColor } };
      });
      expect(focused.visible, `${route} ${mode.name} ${selector} keyboard focus`).toBe(true);
      expect(focused.width, `${route} ${mode.name} ${selector} focus width`).toBeGreaterThanOrEqual(2);
      expect(focused.contrast, `${route} ${mode.name} ${selector} focus ${JSON.stringify(focused.colors)}`).toBeGreaterThanOrEqual(3);
      boundaryMin = Math.min(boundaryMin, normal.boundary); textMin = Math.min(textMin, normal.text); focusMin = Math.min(focusMin, focused.contrast);
    }
    measurements[mode.name] = { controls: selectors.length, boundaryMin: Number(boundaryMin.toFixed(3)), textMin: Number(textMin.toFixed(3)), focusMin: Number(focusMin.toFixed(3)) };
  }
  console.log(`SW_CIVIL_CONTROL_CONTRAST ${route} ${JSON.stringify(measurements)}`);
  return measurements;
}

async function assertA11yAndReflow(page, route) {
  const access = await page.evaluate(() => {
    const controls = [...document.querySelectorAll('.sw-civil-shell input:not([type=file]), .sw-civil-shell select, .sw-civil-shell button, .sw-civil-shell a[href], .sw-civil-shell label[for="import-json"]')].filter((node) => node.offsetParent !== null);
    return {
      unnamed: controls.filter((node) => !((node.labels && node.labels.length) || node.getAttribute('aria-label') || node.getAttribute('aria-labelledby') || node.textContent.trim())).map((node) => node.id),
      small: controls.filter((node) => !node.matches('input[type=checkbox]')).filter((node) => { const box = node.getBoundingClientRect(); return box.width < 44 || box.height < 44; }).map((node) => node.id || node.textContent.trim())
    };
  });
  expect(access.unnamed, `${route} accessible names`).toEqual([]);
  expect(access.small, `${route} tap targets`).toEqual([]);
  const themes = [];
  for (const theme of ['light', 'dark']) themes.push(await page.evaluate((value) => { document.documentElement.dataset.theme = value; const card = getComputedStyle(document.querySelector('.sw-civil-card')); return card.backgroundColor + '|' + card.color; }, theme));
  expect(themes[0], `${route} distinct themes`).not.toBe(themes[1]);
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 850 });
    const layout = await page.evaluate((viewportWidth) => {
      document.documentElement.style.fontSize = '200%';
      const nodes = [...document.querySelectorAll('.sw-civil-shell input, .sw-civil-shell select, .sw-civil-shell button, .sw-civil-shell a[href], .sw-civil-shell label')].filter((node) => node.offsetParent !== null);
      return { overflow: document.documentElement.scrollWidth - viewportWidth, clipped: nodes.filter((node) => { const box = node.getBoundingClientRect(); return box.left < -2 || box.right > innerWidth + 2; }).map((node) => node.id || node.textContent.trim()) };
    }, width);
    expect(layout.overflow, `${route} ${width}px at 200%`).toBeLessThanOrEqual(2);
    expect(layout.clipped, `${route} ${width}px clipped`).toEqual([]);
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; document.documentElement.dataset.theme = 'light'; delete document.documentElement.dataset.themeChoice; });
  await page.setViewportSize({ width: 1280, height: 900 });
}

async function assertPageTextContrast(page, route) {
  const modes = [
    { name: 'light', theme: 'light', scheme: 'light' }, { name: 'dark', theme: 'dark', scheme: 'dark' },
    { name: 'system-light', theme: null, scheme: 'light' }, { name: 'system-dark', theme: null, scheme: 'dark' }
  ];
  const measurements = {};
  for (const mode of modes) {
    await page.emulateMedia({ colorScheme: mode.scheme, reducedMotion: 'reduce' });
    await page.evaluate((theme) => { if (theme) { document.documentElement.dataset.theme = theme; delete document.documentElement.dataset.themeChoice; } else { delete document.documentElement.dataset.theme; document.documentElement.dataset.themeChoice = 'auto'; } }, mode.theme);
    const report = await page.evaluate(() => {
      function rgb(value) { const parts = value.match(/[\d.]+/g); if (!parts || parts.length < 3) return null; return parts.slice(0, 3).map(Number); }
      function channel(value) { value /= 255; return value <= .04045 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4); }
      function luminance(value) { const parts = Array.isArray(value) ? value : rgb(value); return parts ? .2126 * channel(parts[0]) + .7152 * channel(parts[1]) + .0722 * channel(parts[2]) : null; }
      function ratio(left, right) { const a = luminance(left); const b = luminance(right); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); }
      function backgrounds(node) {
        if (node.closest('.sw-civil-hero')) return [[19, 78, 74], [15, 118, 110]];
        let current = node;
        while (current) {
          const color = getComputedStyle(current).backgroundColor; const parsed = rgb(color);
          if (parsed && !/^rgba\([^)]*,\s*0(?:\.0+)?\)$/.test(color) && !(parsed[0] === 0 && parsed[1] === 0 && parsed[2] === 0 && color.includes(', 0)'))) return [parsed];
          current = current.parentElement;
        }
        return [[255, 255, 255]];
      }
      const candidates = [...document.querySelectorAll('.sw-civil-shell *')].filter((node) => {
        if (node.offsetParent === null || node.matches('script,style,[hidden],[aria-hidden=true],button:disabled,[aria-disabled=true]')) return false;
        return [...node.childNodes].some((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
      });
      const measured = [];
      for (const node of candidates) {
        const style = getComputedStyle(node); const size = parseFloat(style.fontSize); const weight = parseInt(style.fontWeight, 10) || 400;
        if (size >= 24 || (size >= 18.66 && weight >= 700)) continue;
        const foreground = rgb(style.color); if (!foreground) continue;
        const value = Math.min(...backgrounds(node).map((background) => ratio(foreground, background)));
        measured.push({ value, tag: node.tagName, cls: node.className || '', text: node.textContent.trim().replace(/\s+/g, ' ').slice(0, 70), color: style.color, background: backgrounds(node) });
      }
      measured.sort((a, b) => a.value - b.value);
      return { count: measured.length, min: measured[0] ? measured[0].value : Infinity, worst: measured.slice(0, 5) };
    });
    expect(report.count, `${route} ${mode.name} measured text`).toBeGreaterThan(10);
    expect(report.min, `${route} ${mode.name} normal text ${JSON.stringify(report.worst)}`).toBeGreaterThanOrEqual(4.5);
    measurements[mode.name] = { count: report.count, min: Number(report.min.toFixed(3)) };
  }
  console.log(`SW_CIVIL_TEXT_CONTRAST ${route} ${JSON.stringify(measurements)}`);
  return measurements;
}

for (const app of manifest.apps) {
  const config = routes[app.id];
  test(`${app.id}: exact engine/UI/export/privacy/contrast parity`, async ({ page, context }) => {
    const writes = []; const faults = []; const consoleErrors = [];
    await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    await page.route(/^https?:\/\//, async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1') await route.continue(); else await route.abort();
    });
    page.on('request', (request) => { const url = new URL(request.url()); if (url.hostname === '127.0.0.1' && request.method() !== 'GET') writes.push(`${request.method()} ${url.pathname}`); });
    page.on('response', (response) => { const url = new URL(response.url()); if (url.hostname === '127.0.0.1' && response.status() >= 400) faults.push(`${response.status()} ${url.pathname}`); });
    page.on('requestfailed', (request) => { const url = new URL(request.url()); if (url.hostname === '127.0.0.1') faults.push(`FAILED ${url.pathname}`); });
    page.on('console', (message) => { if (message.type() === 'error' && !/ERR_FAILED/.test(message.text())) consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await page.goto(app.englishRoute, { waitUntil: 'domcontentloaded' });
    await fillInputs(page, app.oracle.inputs, true, app.id);
    const englishExact = await exactEngineReport(page, app);
    for (const key of config.keys) close(englishExact[key], app.oracle.expected[key], `${app.id} English engine ${key}`);
    await page.getByRole('button', { name: config.englishButton }).click();
    await expect(page.locator(config.englishResult)).not.toHaveText('—');

    faults.length = 0; consoleErrors.length = 0;
    await page.goto(app.swRoute, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('body')).toHaveAttribute('data-civil-tool', app.id);
    const artwork = await page.locator('.sw-civil-art').evaluate((image) => ({ complete: image.complete, width: image.naturalWidth, height: image.naturalHeight }));
    expect(artwork.complete, `${app.id} artwork complete`).toBe(true); expect(artwork.width, `${app.id} artwork width`).toBe(app.imageWidth); expect(artwork.height, `${app.id} artwork height`).toBe(app.imageHeight); expect(artwork.width).toBeGreaterThanOrEqual(480);
    const declaredArtwork = await page.locator('.sw-civil-art').evaluate((image) => ({ width: Number(image.getAttribute('width')), height: Number(image.getAttribute('height')) }));
    expect(declaredArtwork).toEqual({ width: artwork.width, height: artwork.height });
    await fillInputs(page, app.oracle.inputs, false, app.id);
    const button = page.getByRole('button', { name: config.swButton });
    await button.press('Enter'); await expect(page.locator('#civil-result')).toBeVisible(); await expect(page.locator('#civil-result')).toBeFocused();
    const swExact = await exactEngineReport(page, app);
    for (const key of config.keys) close(swExact[key], app.oracle.expected[key], `${app.id} Sw engine ${key}`);
    for (const [key, expected] of Object.entries(app.oracle.expected)) {
      if (key === 'comparison' || !await page.locator(`[data-output="${key}"]`).count()) continue;
      close(Number(await page.locator(`[data-output="${key}"]`).getAttribute('data-raw')), expected, `${app.id} rendered ${key}`);
    }
    await expect(page.locator('#civil-result')).not.toContainText(/NaN|Infinity|undefined/);
    await expect(page.getByText('Viwango tuli vya kupanga; hakuna bei hai au dai rasmi.')).toBeVisible();
    await expect(page.getByText(/Mabadiliko ya mwisho ya injini katika hazina: 2026-07-30/)).toBeVisible();

    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4423' });
    await page.getByRole('button', { name: 'Nakili matokeo' }).click();
    await expect(page.locator('#civil-status')).toContainText('yamenakiliwa');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    const parsedCopy = assertCopiedReport(copied, config.copied, `${app.id} clipboard`);
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { value:undefined, configurable:true });
      window.__civilFallbackCopied = '';
      document.execCommand = function (command) {
        if (command !== 'copy') return false;
        var area = document.querySelector('textarea[aria-hidden="true"]');
        window.__civilFallbackCopied = area ? area.value : '';
        return true;
      };
    });
    await page.getByRole('button', { name: 'Nakili matokeo' }).click();
    const fallbackCopied = await page.evaluate(() => window.__civilFallbackCopied);
    expect(assertCopiedReport(fallbackCopied, config.copied, `${app.id} fallback clipboard`)).toEqual(parsedCopy);

    const jsonBuffer = await downloadBuffer(page, 'Pakua JSON');
    const exported = JSON.parse(jsonBuffer.toString('utf8'));
    expect(exported.toolId).toBe(app.id); expect(exported.planningOnly).toBe(true); expect(exported.source.rateState).toBe('static-planning-assumptions'); expect(exported.inputs).toEqual(app.oracle.inputs);
    for (const key of config.keys) close(exported.result[key], app.oracle.expected[key], `${app.id} JSON ${key}`);
    const txt = (await downloadBuffer(page, 'Pakua TXT')).toString('utf8');
    expect(txt).toContain('AfroTools — Makadirio ya kupanga'); expect(txt).toContain('dahana tuli za kupanga'.replace('dahana', 'dhana')); expect(txt).toContain('Faragha: faili hii imetengenezwa ndani ya kivinjari.'); expect(txt).not.toMatch(/NaN|Infinity|undefined/);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#import-json').setInputFiles({ name: 'makadirio.json', mimeType: 'application/json', buffer: jsonBuffer });
    await expect(page.locator('#civil-result')).toBeVisible(); await expect(page.locator('#civil-status')).toContainText('yamekokotolewa upya');
    for (const key of config.keys) {
      const node = page.locator(`[data-output="${key}"]`); if (await node.count()) close(Number(await node.getAttribute('data-raw')), app.oracle.expected[key], `${app.id} reopened ${key}`);
    }

    await expect(page.locator('#ai-link')).toHaveAttribute('aria-disabled', 'true'); await expect(page.locator('#ai-link')).toHaveAttribute('href', `/sw/ai/?tool=${app.id}`);
    await page.locator('#ai-consent').check(); await expect(page.locator('#ai-link')).toHaveAttribute('aria-disabled', 'false'); await expect(page.locator('#ai-link')).toHaveAttribute('tabindex', '0');
    await assertControlContrast(page, app.swRoute);
    await assertPageTextContrast(page, app.swRoute);
    await assertA11yAndReflow(page, app.swRoute);

    const boundaryExpected = await config.boundary(page); await button.click(); await expect(page.locator('#civil-result')).toBeVisible();
    for (const [key, expected] of Object.entries(boundaryExpected)) close(Number(await page.locator(`[data-output="${key}"]`).getAttribute('data-raw')), expected, `${app.id} boundary ${key}`);
    await page.getByRole('button', { name: 'Nakili matokeo' }).click();
    const boundaryCopied = parseCopiedReport(await page.evaluate(() => navigator.clipboard.readText()));
    close(currencyNumber(boundaryCopied.Jumla), boundaryExpected.total, `${app.id} boundary copy is current`);
    await config.invalid(page); await expect(page.locator('#civil-result')).toBeHidden(); await expect(page.locator('[data-civil-export="copy"]')).toBeDisabled(); await expect(page.locator('[data-civil-export="json"]')).toBeDisabled(); await expect(page.locator('[data-civil-export="txt"]')).toBeDisabled();
    await button.click(); await expect(page.locator('#civil-result')).toBeHidden(); await expect(page.locator('#civil-error')).toBeVisible();

    expect(writes, `${app.id} network writes`).toEqual([]); expect(faults, `${app.id} local resource faults`).toEqual([]); expect(consoleErrors, `${app.id} console/page errors`).toEqual([]);
    const stored = await page.evaluate(() => Object.keys(localStorage).filter((key) => key !== 'afrotools_cookie_consent' && !key.startsWith('afrotools_theme')));
    expect(stored, `${app.id} unexpected local storage`).toEqual([]);
  });
}
