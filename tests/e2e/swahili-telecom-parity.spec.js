const { test, expect, chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const swahiliTelecom = require('../../assets/js/lib/sw-telecom-localization');

const HUB_ROUTE = '/sw/mawasiliano-na-mtandao/';
const TV_ROUTE = '/sw/zana/kilinganisha-tv-na-streaming/';
const REFLOW_WIDTHS = [320, 375];
const ROOT_FONT_SIZES = [16, 32];
const contrastMinima = { text: Infinity, boundary: Infinity, focus: Infinity };
const telecomDataSource = fs.readFileSync(
  path.join(__dirname, '..', '..', 'data', 'telecom', 'country-telecom-index.js'),
  'utf8'
).split(';void 0')[0];
const ARCHIVED_TELECOM_DATA = new Function(`${telecomDataSource}; return TELECOM_DATA;`)();
const SWAHILI_COUNTRY_NAMES = {
  CI: 'Cote d Ivoire', EG: 'Misri', ET: 'Ethiopia', GH: 'Ghana', KE: 'Kenya',
  MA: 'Morocco', NG: 'Nigeria', RW: 'Rwanda', SN: 'Senegal', TZ: 'Tanzania',
  UG: 'Uganda', ZA: 'Afrika Kusini'
};

const apps = [
  ['Kilinganisha Vifurushi vya Data', '/sw/zana/kilinganisha-vifurushi-vya-data/', 'telecom-data-plan'],
  ['Saraka Salama ya Misimbo ya USSD', '/sw/zana/saraka-ya-misimbo-ussd/', 'telecom-ussd'],
  ['Kikokotoo cha Roaming au SIM ya Ndani', '/sw/zana/kikokotoo-gharama-za-roaming/', 'telecom-roaming'],
  ['Kilinganisha Starlink na ISP za Ndani', '/sw/zana/starlink-dhidi-ya-isp-za-ndani/', 'telecom-starlink'],
  ['Kilinganisha TV na Streaming', '/sw/zana/kilinganisha-tv-na-streaming/', 'telecom-tv'],
  ['Kikokotoo cha Matumizi ya Data', '/sw/zana/kikokotoo-matumizi-ya-data/', 'telecom-data-usage'],
  ['Makadirio ya Thamani ya Vocha ya Simu', '/sw/zana/thamani-ya-vocha-ya-simu/', 'telecom-airtime'],
  ['Mwongozo wa Kuhamisha Namba', '/sw/zana/mwongozo-kuhamisha-namba/', 'telecom-portability'],
  ['Ukaguzi wa Masharti ya Usajili wa SIM', '/sw/zana/ukaguzi-usajili-wa-sim/', 'telecom-sim-reg'],
  ['Kilinganisha Intaneti ya Waya na Isiyo na Waya', '/sw/zana/kilinganisha-intaneti/', 'telecom-internet'],
  ['Chagua kati ya Fiber, LTE na 5G', '/sw/zana/fiber-dhidi-ya-lte-na-5g/', 'telecom-fiber-lte-5g'],
  ['Kikokotoo cha Intaneti ya Biashara', '/sw/zana/kikokotoo-intaneti-ya-biashara/', 'telecom-business-internet'],
  ['Kikokotoo cha Bei ya SMS Nyingi', '/sw/zana/kikokotoo-bei-ya-sms-nyingi/', 'telecom-bulk-sms'],
  ['Kilinganisha WhatsApp Business na SMS', '/sw/zana/whatsapp-business-dhidi-ya-sms/', 'telecom-whatsapp-vs-sms']
];

const controlContracts = {
  'telecom-roaming': {
    days: { type: 'number', value: '7', min: '1', max: '90', step: '1' },
    minutesPerDay: { type: 'number', value: '15', min: '0', max: '300', step: '1' },
    smsPerDay: { type: 'number', value: '5', min: '0', max: '200', step: '1' },
    dataMBPerDay: { type: 'number', value: '200', min: '0', max: '5000', step: '1' }
  },
  'telecom-tv': {
    maxPrice: { type: 'range', value: '100000', min: '0', max: '100000', step: '100' }
  },
  'telecom-data-usage': {
    browsing: { type: 'range', value: '1', min: '0', max: '8', step: '0.5' },
    social: { type: 'range', value: '2', min: '0', max: '8', step: '0.5' },
    youtube: { type: 'range', value: '1', min: '0', max: '6', step: '0.5' },
    music: { type: 'range', value: '0.5', min: '0', max: '8', step: '0.5' },
    videocall: { type: 'range', value: '0.5', min: '0', max: '4', step: '0.5' },
    email: { type: 'range', value: '20', min: '0', max: '100', step: '5' },
    downloads: { type: 'range', value: '1', min: '0', max: '20', step: '0.5' }
  },
  'telecom-airtime': {
    amount: { type: 'number', value: '', min: '1', max: null, step: '1' }
  },
  'telecom-business-internet': {
    employees: { type: 'number', value: '10', min: '1', max: '10000', step: '1' }
  },
  'telecom-bulk-sms': {
    volume: { type: 'range', value: '10000', min: '1000', max: '1000000', step: '1000' }
  },
  'telecom-whatsapp-vs-sms': {
    volume: { type: 'number', value: '10000', min: '100', max: '10000000', step: '1' },
    marketing: { type: 'range', value: '40', min: '0', max: '100', step: '5' },
    utility: { type: 'range', value: '35', min: '0', max: '100', step: '5' },
    service: { type: 'range', value: '25', min: '0', max: '100', step: '5' }
  }
};

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function guardLocalNetwork(page, allowedOrigin, sink) {
  page.on('request', (request) => {
    const url = new URL(request.url());
    const isReviewedStaticAsset = url.origin === 'https://cdn.jsdelivr.net'
      && /^\/gh\/twitter\/twemoji@14\.0\.2\/assets\/svg\/[a-f0-9-]+\.svg$/i.test(url.pathname);
    if ((!isReviewedStaticAsset && url.origin !== allowedOrigin) || /\/(?:api|\.netlify\/functions)\//.test(url.pathname)) {
      sink.push(request.url());
    }
  });
}

async function setFixedReflowViewport(page, width, rootFontSize) {
  await page.setViewportSize({ width, height: 720 });
  await page.evaluate((size) => {
    document.documentElement.style.fontSize = `${size}px`;
  }, rootFontSize);
  await expect.poll(() => page.evaluate(() => ({
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    rootFont: getComputedStyle(document.documentElement).fontSize
  }))).toEqual({
    innerWidth: width,
    clientWidth: width,
    rootFont: `${rootFontSize}px`
  });
}

async function reflowReport(page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const tolerance = 0.75;
    const violations = [];

    function compactText(value) {
      return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function isRendered(element) {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
      if (Number(style.opacity) === 0 && style.pointerEvents === 'none') return false;
      if (element.closest('[inert]')) return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    function elementName(element) {
      const id = element.id ? `#${element.id}` : '';
      const classes = element.classList && element.classList.length
        ? `.${Array.from(element.classList).slice(0, 3).join('.')}`
        : '';
      return `${element.tagName.toLowerCase()}${id}${classes}`;
    }

    function record(kind, path, rect, text) {
      violations.push({
        kind,
        path,
        text: text ? compactText(text).slice(0, 100) : undefined,
        left: Number(rect.left.toFixed(2)),
        right: Number(rect.right.toFixed(2)),
        width: Number(rect.width.toFixed(2))
      });
    }

    function scan(root, rootPath) {
      for (const element of root.querySelectorAll('*')) {
        if (!isRendered(element)) continue;
        const path = `${rootPath} ${elementName(element)}`;
        const rect = element.getBoundingClientRect();
        if (rect.left < -tolerance || rect.right > viewportWidth + tolerance) {
          record('element', path, rect);
        }

        for (const node of element.childNodes) {
          if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const textRect of range.getClientRects()) {
            if (!textRect.width) continue;
            if (textRect.left < -tolerance || textRect.right > viewportWidth + tolerance) {
              record('text-range', path, textRect, node.textContent);
            }
          }
        }

        if (element.shadowRoot) scan(element.shadowRoot, `${path}::shadow`);
      }
    }

    scan(document, 'document');
    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      rootFont: getComputedStyle(document.documentElement).fontSize,
      violations
    };
  });
}

async function expectExactReflow(page, label, width, rootFontSize) {
  await setFixedReflowViewport(page, width, rootFontSize);
  const report = await reflowReport(page);
  expect(report.rootFont, `${label}: computed root font`).toBe(`${rootFontSize}px`);
  expect(report.viewportWidth, `${label}: fixed viewport`).toBe(width);
  expect(report.documentWidth, `${label}: document width`).toBe(width);
  expect(report.violations, `${label}: visible light/open-shadow elements and direct text ranges`).toEqual([]);
}

async function expectStateReflow(page, label) {
  for (const width of REFLOW_WIDTHS) {
    for (const rootFontSize of ROOT_FONT_SIZES) {
      await expectExactReflow(page, `${label} ${width}px/root-${rootFontSize}px`, width, rootFontSize);
    }
  }
}

async function textContrast(page, selector) {
  return page.locator(selector).evaluate((element) => {
    function parseColor(value) {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (match) {
        const parts = match[1].split(/[ ,/]+/).filter(Boolean).map(Number);
        return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
      }
      const srgb = value.match(/color\(srgb\s+([^)]+)\)/);
      if (srgb) {
        const parts = srgb[1].split(/[ /]+/).filter(Boolean).map(Number);
        return [parts[0] * 255, parts[1] * 255, parts[2] * 255, parts.length > 3 ? parts[3] : 1];
      }
      throw new Error(`Unsupported color: ${value}`);
    }

    function composite(foreground, background) {
      const alpha = foreground[3] + background[3] * (1 - foreground[3]);
      if (!alpha) return [0, 0, 0, 0];
      return [
        (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
        (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
        (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
        alpha
      ];
    }

    function parentAcrossShadow(node) {
      if (node.parentElement) return node.parentElement;
      const root = node.getRootNode();
      return root instanceof ShadowRoot ? root.host : null;
    }

    const chain = [];
    let current = element;
    while (current) {
      chain.push(current);
      current = parentAcrossShadow(current);
    }
    let background = [255, 255, 255, 1];
    for (const ancestor of chain.reverse()) {
      background = composite(parseColor(getComputedStyle(ancestor).backgroundColor), background);
    }
    const foreground = composite(parseColor(getComputedStyle(element).color), background);

    function luminance(color) {
      const linear = color.slice(0, 3).map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    }

    const foregroundLuminance = luminance(foreground);
    const backgroundLuminance = luminance(background);
    return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
      / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
  });
}

async function expectComputedControlContrast(page, route) {
  const modes = [
    ['light', 'light'],
    ['dark', 'dark'],
    ['system', 'light'],
    ['system', 'dark']
  ];
  for (const [theme, scheme] of modes) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    await page.evaluate((nextTheme) => {
      document.documentElement.style.fontSize = '16px';
      document.documentElement.setAttribute('data-theme', nextTheme);
    }, theme);
    const selectors = [
      ['#telecom-form input:not([type="hidden"]):not([type="file"])'],
      ['#telecom-form select'],
      ['#telecom-form button[type="submit"]'],
      ['#telecom-reset'],
      ['.tel-file-label', '#telecom-import']
    ];
    for (const [selector, focusSelector = selector] of selectors) {
      const locator = page.locator(selector).first();
      if (!await locator.count() || !await locator.isVisible()) continue;
      await page.locator(focusSelector).first().focus();
      const ratios = await locator.evaluate((element) => {
        const parse = (value) => {
          const match = String(value || '').match(/rgba?\(([^)]+)\)/);
          if (!match) throw new Error(`Unsupported color: ${value}`);
          const parts = match[1].split(/[ ,/]+/).filter(Boolean).map(Number);
          return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
        };
        const blend = (foreground, background) => {
          const alpha = foreground[3] + background[3] * (1 - foreground[3]);
          return [
            (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
            (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
            (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
            alpha
          ];
        };
        const luminance = (color) => color.slice(0, 3).map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
        const contrast = (left, right) => {
          const first = luminance(left);
          const second = luminance(right);
          return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
        };
        const backgroundFor = (node) => {
          const layers = [];
          for (let current = node; current; current = current.parentElement) {
            const color = parse(getComputedStyle(current).backgroundColor);
            if (color[3] > 0) layers.push(color);
          }
          let result = [255, 255, 255, 1];
          for (const layer of layers.reverse()) result = blend(layer, result);
          return result;
        };
        const style = getComputedStyle(element);
        const ownBackground = backgroundFor(element);
        const adjacentBackground = backgroundFor(element.parentElement || document.body);
        return {
          text: contrast(blend(parse(style.color), ownBackground), ownBackground),
          boundary: contrast(blend(parse(style.borderTopColor), adjacentBackground), adjacentBackground),
          focus: contrast(blend(parse(style.outlineColor), adjacentBackground), adjacentBackground),
          outlineStyle: style.outlineStyle,
          outlineWidth: parseFloat(style.outlineWidth)
        };
      });
      contrastMinima.text = Math.min(contrastMinima.text, ratios.text);
      contrastMinima.boundary = Math.min(contrastMinima.boundary, ratios.boundary);
      contrastMinima.focus = Math.min(contrastMinima.focus, ratios.focus);
      expect(ratios.text, `${route} ${theme}-${scheme} ${selector} text`).toBeGreaterThanOrEqual(4.5);
      expect(ratios.boundary, `${route} ${theme}-${scheme} ${selector} boundary`).toBeGreaterThanOrEqual(3);
      expect(ratios.outlineStyle, `${route} ${theme}-${scheme} ${selector} focus style`).not.toBe('none');
      expect(ratios.outlineWidth, `${route} ${theme}-${scheme} ${selector} focus width`).toBeGreaterThanOrEqual(2);
      expect(ratios.focus, `${route} ${theme}-${scheme} ${selector} focus contrast`).toBeGreaterThanOrEqual(3);
    }
  }
}

async function selectScenario(page, toolId) {
  const form = page.locator('#telecom-form');
  await form.getByLabel(toolId === 'telecom-roaming' ? 'Nchi ya kuanzia' : 'Nchi').selectOption('NG');
  if (toolId === 'telecom-roaming') await form.getByLabel('Nchi unayoenda').selectOption('KE');
  if (toolId === 'telecom-airtime') {
    await form.locator('[name="amount"]').fill('5000');
    const operator = form.getByLabel('Mtoa huduma');
    const values = await operator.locator('option').evaluateAll((options) => options.map((option) => option.value).filter(Boolean));
    await operator.selectOption(values[0]);
  }
}

async function expectInputContract(page, name, expected) {
  const input = page.locator(`#telecom-form [name="${name}"]`);
  await expect(input).toHaveAttribute('type', expected.type);
  for (const attribute of ['min', 'max', 'step']) {
    if (expected[attribute] == null) {
      await expect(input).not.toHaveAttribute(attribute);
    } else {
      await expect(input).toHaveAttribute(attribute, expected[attribute]);
    }
  }
  await expect(input).toHaveValue(expected.value);
}

async function formValueSnapshot(page) {
  return page.locator('#telecom-form').evaluate((form) => Object.fromEntries(
    Array.from(form.elements)
      .filter((field) => field.name && !['button', 'file', 'reset', 'submit'].includes(field.type))
      .map((field) => [field.name, field.value])
  ));
}

async function expectExactControlContracts(page, toolId) {
  for (const [name, expected] of Object.entries(controlContracts[toolId] || {})) {
    await expectInputContract(page, name, expected);
  }
  if (toolId === 'telecom-business-internet') {
    const speed = page.locator('#telecom-form [name="minimumSpeed"]');
    await expect(speed).toHaveValue('50');
    expect(await speed.locator('option').evaluateAll((options) => options.map((option) => option.value))).toEqual(['10', '25', '50', '100', '200']);
    await expect(page.locator('#telecom-form [name="usage"]')).toHaveValue('moderate');
  }
  if (toolId === 'telecom-data-plan') {
    const validity = page.locator('#telecom-form [name="validity"]');
    await expect(validity).toHaveValue('all');
    expect(await validity.locator('option').evaluateAll((options) => options.map((option) => option.value))).toEqual(['all', '1', '7', '30']);
  }
  if (toolId === 'telecom-tv') {
    const sort = page.locator('#telecom-form [name="sort"]');
    await expect(sort).toHaveValue('price-desc');
    expect(await sort.locator('option').evaluateAll((options) => options.map((option) => option.value))).toEqual([
      'price-asc',
      'price-desc',
      'channels-desc',
      'value'
    ]);
  }
  if (toolId === 'telecom-airtime') {
    await expect(page.locator('#telecom-form [name="lowRate"], #telecom-form [name="highRate"]')).toHaveCount(0);
  }
  if (toolId === 'telecom-whatsapp-vs-sms') {
    await page.locator('[name="marketing"]').evaluate((input) => {
      input.value = '50';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('[name="marketing"]')).toHaveValue('50');
    await expect(page.locator('[name="utility"]')).toHaveValue('30');
    await expect(page.locator('[name="service"]')).toHaveValue('20');
  }
}

async function expectNativeCountryOptions(page, toolId) {
  const groups = await page.locator('#telecom-form [data-country-select]').evaluateAll((selects) => selects.map((select) => ({
    name: select.name,
    options: Array.from(select.options)
      .filter((option) => option.value)
      .map((option) => ({ code: option.value, label: option.textContent.trim() }))
  })));
  const seen = new Set();
  for (const group of groups) {
    expect(group.options.length, `${toolId}:${group.name} must be populated`).toBeGreaterThan(0);
    for (const option of group.options) {
      seen.add(option.code);
      const expectedName = SWAHILI_COUNTRY_NAMES[option.code];
      expect(expectedName, `${toolId}:${group.name}:${option.code} must have an owned Swahili label`).toBeTruthy();
      expect(option.label, `${toolId}:${group.name}:${option.code} native country label`)
        .toBe(`${expectedName} · ${option.label.split(' · ').at(-1)}`);
    }
  }
  expect(seen.size, `${toolId}: populated selectors must retain country choices`).toBeGreaterThan(0);
}

function expectNativeResultText(toolId, resultText) {
  const forbiddenByTool = {
    'telecom-data-plan': /\b(?:Daily|Weekly|Monthly|Unlimited|days?|hrs?)\b/,
    'telecom-data-usage': /\b(?:Daily|Weekly|Monthly|Unlimited|days?|hrs?)\b/,
    'telecom-portability': /\b(?:Processing|Visit new operator|Send PORT|Submit porting request|Not yet)\b/i,
    'telecom-sim-reg': /\b(?:National ID|linkage|enforcement|Line deactivation|SIM deactivation|Regulation introduced)\b/i,
    'telecom-internet': /\b(?:Fiber|Mobile Data|Unlimited)\b|\dMbps\b/i,
    'telecom-fiber-lte-5g': /\b(?:Fiber|Mobile Data|Unlimited)\b|\dMbps\b/i,
    'telecom-starlink': /\b(?:Fiber|Mobile Data|Unlimited)\b|\dMbps\b/i,
    'telecom-business-internet': /\b(?:Fiber|Mobile Data|Unlimited)\b|\dMbps\b/i,
    'telecom-tv': /\b(?:devices|Sports \+ entertainment|Streaming only|Family|Lite)\b/i
  };
  if (forbiddenByTool[toolId]) {
    expect(resultText, `${toolId}: dataset-derived output must be natively rendered in Swahili`)
      .not.toMatch(forbiddenByTool[toolId]);
  }
}

async function expectAccessibilityBasics(page, toolId) {
  const report = await page.evaluate(() => {
    const controls = Array.from(document.querySelectorAll('button, input, select')).filter((control) => {
      const style = getComputedStyle(control);
      const rect = control.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && rect.width > 1
        && rect.height > 1;
    });
    return {
      unnamed: controls.filter((control) => {
        if (control.matches('button')) return !String(control.textContent || control.getAttribute('aria-label') || '').trim();
        return !(control.labels && control.labels.length) && !control.getAttribute('aria-label');
      }).map((control) => control.id || control.name || control.tagName),
      keyboardBlocked: controls.filter((control) => control.tabIndex < 0).map((control) => control.id || control.name || control.tagName),
      undersized: controls.filter((control) => control.getBoundingClientRect().height < 44)
        .map((control) => control.id || control.name || control.tagName),
      resultLive: document.getElementById('telecom-results')?.getAttribute('aria-live'),
      errorRole: document.getElementById('telecom-errors')?.getAttribute('role'),
      exportLive: document.getElementById('telecom-export-status')?.getAttribute('aria-live')
    };
  });
  expect(report.unnamed, `${toolId}: visible controls need accessible names`).toEqual([]);
  expect(report.keyboardBlocked, `${toolId}: visible controls need keyboard access`).toEqual([]);
  expect(report.undersized, `${toolId}: visible controls need 44px targets`).toEqual([]);
  expect(report.resultLive).toBe('polite');
  expect(report.errorRole).toBe('alert');
  expect(report.exportLive).toBe('polite');
}

async function storageSnapshot(page) {
  return page.evaluate(async () => ({
    local: Object.keys(localStorage).sort().map((key) => [key, localStorage.getItem(key)]),
    session: Object.keys(sessionStorage).sort().map((key) => [key, sessionStorage.getItem(key)]),
    databases: indexedDB.databases
      ? (await indexedDB.databases()).map((database) => database.name).filter(Boolean).sort()
      : []
  }));
}

test('Swahili Telecom hub: 14 rendered artworks and exact fixed-320/375 root-16/32 reflow', async ({ page }) => {
  await page.goto(HUB_ROUTE);
  await expect(page.getByRole('heading', { level: 1, name: 'Panga bila kuchanganya kumbukumbu na ofa ya sasa' })).toBeVisible();
  await expect(page.locator('.tel-hub-card')).toHaveCount(14);
  await expect(page.locator('.tel-hub-card img')).toHaveCount(14);
  expect(await page.locator('.tel-hub-card img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0))).toBe(true);

  await expectStateReflow(page, 'hub initial');

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  expect(await textContrast(page, '.tel-source-alert p')).toBeGreaterThanOrEqual(4.5);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  expect(await textContrast(page, '.tel-source-alert p')).toBeGreaterThanOrEqual(4.5);
});

test('telecom-tv: all-country headline and TXT tier names stay in the shared Swahili runtime', async ({ page, baseURL }) => {
  const consoleErrors = [];
  const pageErrors = [];
  const unexpectedNetwork = [];
  const allowedOrigin = new URL(baseURL).origin;
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  guardLocalNetwork(page, allowedOrigin, unexpectedNetwork);

  await page.goto(TV_ROUTE);
  await expect(page.locator('#telecom-form [name="country"]')).toBeVisible();
  const storageBefore = await storageSnapshot(page);
  const countryCodes = Object.keys(ARCHIVED_TELECOM_DATA.countries).sort();
  expect(countryCodes).toEqual(Object.keys(SWAHILI_COUNTRY_NAMES).sort());

  for (const countryCode of countryCodes) {
    const country = ARCHIVED_TELECOM_DATA.countries[countryCode];
    await page.locator('#telecom-form [name="country"]').selectOption(countryCode);
    await page.getByRole('button', { name: 'Kokotoa kwa snapshot' }).click();
    await expect(page.locator('.sw-telecom-result-body')).not.toBeEmpty();
    const resultText = normalizeText(await page.locator('.sw-telecom-result-body').innerText());
    expectNativeResultText('telecom-tv', resultText);

    const packages = (country.tvProviders || []).flatMap((provider) => (
      (provider.packages || []).map((item) => ({ ...item, provider: provider.name }))
    ));
    if (!packages.length) {
      await expect(page.locator('.sw-telecom-result-body')).toContainText('Hakuna kifurushi cha TV kilichohifadhiwa');
      continue;
    }
    const selectedMaximum = Number(await page.locator('#telecom-form [name="maxPrice"]').inputValue());
    const displayedPackages = packages.filter((item) => Number(item.price) <= selectedMaximum);

    const displayedTierNames = await page.locator('td[data-label="Kifurushi kilichohifadhiwa"]')
      .evaluateAll((cells) => cells.map((cell) => cell.textContent.trim()));
    expect(displayedTierNames, `${countryCode}: every table tier must use the shared Swahili renderer`)
      .toEqual(expect.arrayContaining(displayedPackages.map((item) => swahiliTelecom.tvName(item.name))));

    const best = displayedPackages
      .filter((item) => Number(item.channels) > 0)
      .map((item) => ({ ...item, pricePerChannel: Number(item.price) / Number(item.channels) }))
      .sort((left, right) => left.pricePerChannel - right.pricePerChannel)[0];
    const expectedBest = `${best.provider} · ${swahiliTelecom.tvName(best.name)}`;
    const bestMetric = page.locator('.sw-telecom-metric')
      .filter({ hasText: 'Gharama ya chini kwa chaneli kwenye snapshot' });
    await expect(bestMetric.locator('strong')).toHaveText(expectedBest);
    if (swahiliTelecom.tvName(best.name) !== best.name) {
      expect(resultText, `${countryCode}: raw best-value tier must not leak into the headline`)
        .not.toContain(`${best.provider} · ${best.name}`);
    }

    const txtDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Pakua TXT' }).click();
    const txtDownload = await txtDownloadPromise;
    const txt = fs.readFileSync(await txtDownload.path(), 'utf8');
    expect(txt, `${countryCode}: TXT must serialize the localized headline`).toContain(expectedBest);
    if (swahiliTelecom.tvName(best.name) !== best.name) {
      expect(txt, `${countryCode}: TXT must not serialize the raw tier name`)
        .not.toContain(`${best.provider} · ${best.name}`);
    }

    if (['KE', 'ZA'].includes(countryCode)) {
      expect(expectedBest).toBe('DStv · Access');
      await expectStateReflow(page, `telecom-tv ${countryCode} localized result`);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '16px';
        document.documentElement.setAttribute('data-theme', 'light');
      });
      expect(await textContrast(page, '.sw-telecom-source p')).toBeGreaterThanOrEqual(4.5);
      expect(await textContrast(page, '.sw-telecom-metric strong')).toBeGreaterThanOrEqual(4.5);
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      expect(await textContrast(page, '.sw-telecom-source p')).toBeGreaterThanOrEqual(4.5);
      expect(await textContrast(page, '.sw-telecom-metric strong')).toBeGreaterThanOrEqual(4.5);
    }
  }

  expect(await storageSnapshot(page), 'TV all-country sweep must not write browser storage').toEqual(storageBefore);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(unexpectedNetwork).toEqual([]);
});

test('all 14 apps and hub stay local-only beyond delayed auth bootstrap on a production-like hostname', async ({ baseURL }) => {
  test.setTimeout(120000);
  const port = new URL(baseURL).port;
  const productionHost = 'telecom.africa-tools.test';
  const productionOrigin = `http://${productionHost}:${port}`;
  const routes = [HUB_ROUTE, ...apps.map((entry) => entry[1])];
  const productionBrowser = await chromium.launch({
    headless: true,
    args: [
      `--host-resolver-rules=MAP ${productionHost} 127.0.0.1`,
      '--no-proxy-server'
    ]
  });
  const context = await productionBrowser.newContext({ serviceWorkers: 'block' });
  await context.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
  });

  const audits = await Promise.all(routes.map(async (route) => {
    const page = await context.newPage();
    const forbidden = [];
    const unexpected = [];
    const runtimeErrors = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      const isReviewedStaticAsset = url.origin === 'https://cdn.jsdelivr.net'
        && /^\/gh\/twitter\/twemoji@14\.0\.2\/assets\/svg\/[a-f0-9-]+\.svg$/i.test(url.pathname);
      const isApi = /^\/(?:api|\.netlify\/functions)(?:\/|$)/i.test(url.pathname);
      const isSupabase = /(?:^|\.)supabase\.co$/i.test(url.hostname)
        || /\/assets\/js\/supabase(?:\.min)?\.js$/i.test(url.pathname);
      const isAi = /(?:openai|anthropic|gemini)/i.test(url.hostname)
        || /\/(?:ai|ask|assistant)(?:\/|-|$)/i.test(url.pathname);
      const isAuthBootstrap = /\/assets\/js\/(?:afro-auth|auth-cookie-upgrade|auth-oauth-guard)(?:\.js)?/i.test(url.pathname);
      if (isApi || isSupabase || isAi || isAuthBootstrap) forbidden.push(request.url());
      if (url.origin !== productionOrigin && !isReviewedStaticAsset) unexpected.push(request.url());
    });
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(message.text());
    });
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    const response = await page.goto(`${productionOrigin}${route}`, { waitUntil: 'domcontentloaded' });
    expect(response && response.status(), `${route}: production-host response`).toBe(200);
    await expect(page.locator('meta[name="afrotools-network-policy"]')).toHaveAttribute('content', 'local-only');
    await expect(page.locator('meta[name="afrotools-network-policy"]')).toHaveAttribute('data-source-owner', 'scripts/build-swahili-telecom-parity.js');
    await expect(page.locator('afro-navbar')).toBeVisible();
    return { route, page, forbidden, unexpected, runtimeErrors };
  }));

  await new Promise((resolve) => setTimeout(resolve, 17000));
  for (const audit of audits) {
    expect(audit.forbidden, `${audit.route}: no /api, Supabase, AI, or auth-bootstrap request after 17 seconds`).toEqual([]);
    expect(audit.unexpected, `${audit.route}: no unexpected external request after 17 seconds`).toEqual([]);
    expect(audit.runtimeErrors, `${audit.route}: no runtime error after 17 seconds`).toEqual([]);
    expect(await audit.page.evaluate(() => Boolean(window.AfroAuthSessionBridge)), `${audit.route}: cookie bridge must stay absent`).toBe(false);
  }

  const controlPage = await context.newPage();
  const controlSessionRequests = [];
  controlPage.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/api/auth/session') controlSessionRequests.push(request.url());
  });
  const controlResponse = await controlPage.goto(`${productionOrigin}/`, { waitUntil: 'domcontentloaded' });
  expect(controlResponse && controlResponse.status()).toBe(200);
  await expect(controlPage.locator('meta[name="afrotools-network-policy"]')).toHaveCount(0);
  await controlPage.waitForTimeout(17000);
  expect(controlSessionRequests.length, 'normal control page must initialize the cookie-session auth bridge').toBeGreaterThan(0);
  expect(await controlPage.evaluate(() => Boolean(window.AfroAuthSessionBridge))).toBe(true);

  await context.close();
  await productionBrowser.close();
});

for (const [title, route, toolId] of apps) {
  test(`${toolId}: strict reflow, contrast, fresh-context exports and local privacy`, async ({ browser, page, baseURL }) => {
    const consoleErrors = [];
    const pageErrors = [];
    const unexpectedNetwork = [];
    const allowedOrigin = new URL(baseURL).origin;
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    guardLocalNetwork(page, allowedOrigin, unexpectedNetwork);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    const artwork = page.locator('.tel-app-artwork img');
    await expect(artwork).toBeVisible();
    await expect(artwork).toHaveAttribute('alt', `Mchoro wa zana ${title}`);
    expect(await artwork.evaluate((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)).toBe(true);
    await expect(page.locator('[data-source-state="stale"][data-source-confidence="low"]')).toBeVisible();
    await expect(page.getByText('Hakuna sehemu inayotumwa, hakuna AI inayoitwa', { exact: false })).toBeVisible();
    const defaultFormValues = await formValueSnapshot(page);
    await expectExactControlContracts(page, toolId);
    await expectNativeCountryOptions(page, toolId);
    await expectAccessibilityBasics(page, toolId);

    await expectStateReflow(page, `${toolId} initial`);

    await page.evaluate(() => {
      document.documentElement.style.fontSize = '16px';
    });
    await selectScenario(page, toolId);
    const submit = page.getByRole('button', { name: 'Kokotoa kwa snapshot' });
    await submit.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('afro-navbar')).toHaveCount(1);
    await expect(page.locator('afro-site-assistant')).toHaveCount(1);
    await expect(page.locator('afro-navbar .btn-login')).toHaveAttribute('href', /\/sw\/auth\/\?mode=login/);
    await expect(page.locator('afro-navbar .sw-country-link')).toHaveAttribute('href', '/sw/nchi/');
    await expect(page.locator('#telecom-results .sw-telecom-source')).toBeVisible();
    await expect(page.locator('#telecom-results .sw-telecom-result-body')).not.toBeEmpty();
    await expect(page.locator('#telecom-errors')).toBeEmpty();

    const resultText = normalizeText(await page.locator('.sw-telecom-result-body').innerText());
    expect(resultText).not.toMatch(/\b(?:NaN|Infinity|undefined)\b/);
    expectNativeResultText(toolId, resultText);
    await expectStateReflow(page, `${toolId} result`);
    await expectComputedControlContrast(page, route);

    await page.evaluate(() => {
      document.documentElement.style.fontSize = '16px';
      document.documentElement.setAttribute('data-theme', 'light');
    });
    expect(await textContrast(page, '.sw-telecom-source p')).toBeGreaterThanOrEqual(4.5);
    const lightBackground = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    expect(await textContrast(page, '.sw-telecom-source p')).toBeGreaterThanOrEqual(4.5);
    const darkBackground = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(darkBackground).not.toBe(lightBackground);

    const jsonDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Pakua JSON' }).click();
    const jsonDownload = await jsonDownloadPromise;
    const jsonBuffer = fs.readFileSync(await jsonDownload.path());
    const payload = JSON.parse(jsonBuffer.toString('utf8'));
    expect(payload.toolId).toBe(toolId);
    expect(payload.locale).toBe('sw');
    expect(payload.datasetReviewedAt).toBe('2026-03-01');
    expect(payload.result.source.freshness).toBe('stale');
    if (toolId === 'telecom-tv') {
      const prices = payload.result.packages.map((row) => row.price);
      expect(prices, 'telecom-tv: default result order must be price descending')
        .toEqual([...prices].sort((left, right) => right - left));
      expect(payload.inputs.sort).toBe('price-desc');
    }
    if (toolId === 'telecom-business-internet') {
      expect(payload.inputs.usage).toBe('moderate');
      expect(payload.inputs.minimumSpeed).toBe('50');
    }
    if (toolId === 'telecom-airtime') {
      expect(payload.inputs.amount).toBe('5000');
      expect(payload.inputs).not.toHaveProperty('lowRate');
      expect(payload.inputs).not.toHaveProperty('highRate');
      expect(payload.result.lowRate).toBe(0.7);
      expect(payload.result.highRate).toBe(0.85);
    }

    const txtDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Pakua TXT' }).click();
    const txtDownload = await txtDownloadPromise;
    const originalTxt = fs.readFileSync(await txtDownload.path(), 'utf8');
    expect(originalTxt).toContain(title);
    expect(originalTxt).toContain(`Njia: ${route}`);
    expect(originalTxt).toContain('Snapshot: 2026-03-01');

    const staleTrigger = page.locator('#telecom-form input[type="number"], #telecom-form input[type="range"], #telecom-form select:not([data-country-select])').first();
    if (await staleTrigger.count()) {
      await staleTrigger.evaluate((control) => {
        if (control.tagName === 'SELECT') {
          const next = Array.from(control.options).find((option) => option.value !== control.value);
          if (next) control.value = next.value;
        } else {
          const current = Number(control.value || 0);
          const step = Number(control.step || 1);
          control.value = String(current + (Number.isFinite(step) && step > 0 ? step : 1));
        }
        control.dispatchEvent(new Event('input', { bubbles: true }));
        control.dispatchEvent(new Event('change', { bubbles: true }));
      });
    } else {
      await page.locator('#telecom-form [data-country-select][name="country"]').selectOption('KE');
    }
    await expect(page.locator('.sw-telecom-result-body')).toHaveCount(0);
    await expect(page.locator('#telecom-results .tel-empty')).toBeVisible();
    for (const id of ['telecom-copy', 'telecom-download-txt', 'telecom-download-json']) {
      await expect(page.locator(`#${id}`)).toBeHidden();
      await expect(page.locator(`#${id}`)).toBeDisabled();
    }
    await selectScenario(page, toolId);
    await submit.click();
    await expect(page.locator('.sw-telecom-result-body')).not.toBeEmpty();

    let resetDownloads = 0;
    page.on('download', () => {
      resetDownloads += 1;
    });
    const reset = page.getByRole('button', { name: 'Anza upya' });
    await expect(reset).toBeVisible();
    await reset.click();
    await expect(page.locator('#telecom-export-status')).toHaveText('Hali imeanzishwa upya.');
    await expect(page.locator('.sw-telecom-result-body')).toHaveCount(0);
    await expect(page.locator('#telecom-results .tel-empty')).toBeVisible();
    await expect(page.locator('#telecom-errors')).toBeEmpty();
    await expect(page.locator('#telecom-form [data-country-select][name="country"]')).toHaveValue('');
    expect(await formValueSnapshot(page), `${toolId}: visible reset must restore every form default`).toEqual(defaultFormValues);
    for (const [name, expected] of Object.entries(controlContracts[toolId] || {})) {
      await expectInputContract(page, name, expected);
    }
    if (toolId === 'telecom-business-internet') {
      await expect(page.locator('#telecom-form [name="minimumSpeed"]')).toHaveValue('50');
      await expect(page.locator('#telecom-form [name="usage"]')).toHaveValue('moderate');
    }
    for (const id of ['telecom-copy', 'telecom-download-txt', 'telecom-download-json']) {
      await expect(page.locator(`#${id}`)).toBeHidden();
      await expect(page.locator(`#${id}`)).toBeDisabled();
    }
    await expect(page.locator('button[id*="save" i], button[data-save]')).toHaveCount(0);
    await expectStateReflow(page, `${toolId} visible-reset`);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '16px';
    });
    await page.evaluate(() => {
      for (const id of ['telecom-copy', 'telecom-download-txt', 'telecom-download-json']) {
        const button = document.getElementById(id);
        button.hidden = false;
        button.disabled = false;
        button.click();
      }
    });
    await page.waitForTimeout(100);
    expect(resetDownloads, `${toolId}: reset must revoke copy/JSON/TXT state`).toBe(0);
    await expect(page.locator('#telecom-errors')).toContainText('matokeo kwanza.');

    await selectScenario(page, toolId);
    await submit.click();
    await expect(page.locator('#telecom-results .sw-telecom-result-body')).not.toBeEmpty();

    let invalidationDownloads = 0;
    page.on('download', () => {
      invalidationDownloads += 1;
    });
    await page.locator('#telecom-form [data-country-select][name="country"]').selectOption('');
    await submit.click();
    await expect(page.locator('.sw-telecom-result-body')).toHaveCount(0);
    await expect(page.locator('#telecom-results .tel-empty')).toBeVisible();
    await expect(page.locator('#telecom-errors')).toContainText('Sahihisha sehemu zinazohitajika');
    for (const id of ['telecom-download-json', 'telecom-download-txt']) {
      await expect(page.locator(`#${id}`)).toBeHidden();
      await expect(page.locator(`#${id}`)).toBeDisabled();
    }
    await page.evaluate(() => {
      for (const id of ['telecom-download-json', 'telecom-download-txt']) {
        const button = document.getElementById(id);
        button.hidden = false;
        button.disabled = false;
        button.click();
      }
    });
    await expect(page.locator('#telecom-errors')).toContainText('matokeo kwanza.');
    await page.waitForTimeout(100);
    expect(invalidationDownloads, `${toolId}: invalid required country must revoke JSON/TXT export state`).toBe(0);

    await selectScenario(page, toolId);
    await submit.click();
    await expect(page.locator('#telecom-results .sw-telecom-result-body')).not.toBeEmpty();
    await page.getByLabel('Fungua JSON tena').setInputFiles({
      name: 'wrong-tool.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, toolId: 'telecom-not-this-tool', inputs: {} }))
    });
    await expect(page.locator('#telecom-export-status')).toContainText('Faili imekataliwa');
    await expect(page.locator('.sw-telecom-result-body')).toHaveCount(0);
    await expect(page.locator('#telecom-results .tel-empty')).toBeVisible();
    for (const id of ['telecom-copy', 'telecom-download-txt', 'telecom-download-json']) {
      await expect(page.locator(`#${id}`)).toBeHidden();
      await expect(page.locator(`#${id}`)).toBeDisabled();
    }

    const freshContext = await browser.newContext({
      viewport: { width: 320, height: 720 },
      colorScheme: 'light',
      serviceWorkers: 'block',
      acceptDownloads: true
    });
    const freshPage = await freshContext.newPage();
    const freshConsoleErrors = [];
    const freshPageErrors = [];
    freshPage.on('console', (message) => {
      if (message.type() === 'error') freshConsoleErrors.push(message.text());
    });
    freshPage.on('pageerror', (error) => freshPageErrors.push(error.message));
    guardLocalNetwork(freshPage, allowedOrigin, unexpectedNetwork);
    await freshPage.goto(new URL(route, baseURL).href);
    await expect(freshPage.locator('.sw-telecom-result-body')).toHaveCount(0);
    await freshPage.getByLabel('Fungua JSON tena').setInputFiles({
      name: `${toolId}.json`,
      mimeType: 'application/json',
      buffer: jsonBuffer
    });
    await expect(freshPage.locator('#telecom-export-status')).toContainText('Hali imefunguliwa tena na kukokotolewa ndani.');
    expect(normalizeText(await freshPage.locator('.sw-telecom-result-body').innerText())).toBe(resultText);
    await expectStateReflow(freshPage, `${toolId} genuine-fresh-context-reopened-result`);
    await expect(freshPage.locator('afro-navbar')).toHaveCount(1);
    await expect(freshPage.locator('afro-navbar .btn-login')).toHaveAttribute('href', /\/sw\/auth\/\?mode=login/);
    await expect(freshPage.locator('afro-navbar .sw-country-link')).toHaveAttribute('href', '/sw/nchi/');

    await freshPage.evaluate(() => {
      document.documentElement.style.fontSize = '16px';
    });
    const reopenedTxtDownloadPromise = freshPage.waitForEvent('download');
    await freshPage.getByRole('button', { name: 'Pakua TXT' }).click();
    const reopenedTxtDownload = await reopenedTxtDownloadPromise;
    const reopenedTxt = fs.readFileSync(await reopenedTxtDownload.path(), 'utf8');
    expect(normalizeText(reopenedTxt)).toBe(normalizeText(originalTxt));
    expect(freshPageErrors).toEqual([]);
    expect(freshConsoleErrors).toEqual([]);
    await freshContext.close();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(unexpectedNetwork).toEqual([]);
  });
}

test.afterAll(() => {
  console.log(`Swahili Telecom computed minima: text=${contrastMinima.text.toFixed(2)} boundary=${contrastMinima.boundary.toFixed(2)} focus=${contrastMinima.focus.toFixed(2)}`);
});
