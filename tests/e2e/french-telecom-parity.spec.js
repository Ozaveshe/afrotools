const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const frenchTelecom = require('../../assets/js/lib/fr-telecom-localization');

const HUB_ROUTE = '/fr/telecom/';
const TV_ROUTE = '/fr/telecom/comparateur-tv-streaming/';
const REFLOW_WIDTHS = [320, 375];
const ROOT_FONT_SIZES = [16, 32];
const telecomDataSource = fs.readFileSync(
  path.join(__dirname, '..', '..', 'data', 'telecom', 'country-telecom-index.js'),
  'utf8'
).split(';void 0')[0];
const ARCHIVED_TELECOM_DATA = new Function(`${telecomDataSource}; return TELECOM_DATA;`)();
const FRENCH_COUNTRY_NAMES = {
  CI: 'Côte d’Ivoire',
  EG: 'Égypte',
  ET: 'Éthiopie',
  GH: 'Ghana',
  KE: 'Kenya',
  MA: 'Maroc',
  NG: 'Nigéria',
  RW: 'Rwanda',
  SN: 'Sénégal',
  TZ: 'Tanzanie',
  UG: 'Ouganda',
  ZA: 'Afrique du Sud'
};

const apps = [
  ['Comparateur de forfaits data', '/fr/telecom/comparateur-forfaits-data/', 'telecom-data-plan'],
  ['Annuaire prudent des codes USSD', '/fr/telecom/annuaire-codes-ussd/', 'telecom-ussd'],
  ['Calculateur roaming ou SIM locale', '/fr/telecom/calculateur-roaming/', 'telecom-roaming'],
  ['Comparateur Starlink et ISP locaux', '/fr/telecom/comparateur-starlink-isp/', 'telecom-starlink'],
  ['Comparateur TV et streaming', '/fr/telecom/comparateur-tv-streaming/', 'telecom-tv'],
  ['Calculateur de consommation data', '/fr/telecom/calculateur-consommation-data/', 'telecom-data-usage'],
  ['Valeur estimée du crédit téléphonique', '/fr/telecom/valeur-credit-telephonique/', 'telecom-airtime'],
  ['Préparer une portabilité de numéro', '/fr/telecom/portabilite-numero-mobile/', 'telecom-portability'],
  ['Vérifier les exigences d’enregistrement SIM', '/fr/telecom/verification-enregistrement-sim/', 'telecom-sim-reg'],
  ['Comparateur internet fixe et sans fil', '/fr/telecom/comparateur-internet/', 'telecom-internet'],
  ['Choisir entre fibre, LTE et 5G', '/fr/telecom/fibre-lte-5g/', 'telecom-fiber-lte-5g'],
  ['Dimensionner internet pour une entreprise', '/fr/telecom/internet-entreprise/', 'telecom-business-internet'],
  ['Estimer un budget SMS professionnel', '/fr/telecom/prix-sms-pro/', 'telecom-bulk-sms'],
  ['Comparer WhatsApp Business et SMS', '/fr/telecom/whatsapp-vs-sms/', 'telecom-whatsapp-vs-sms']
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

async function selectScenario(page, toolId) {
  const form = page.locator('#telecom-form');
  await form.getByLabel(toolId === 'telecom-roaming' ? 'Pays de départ' : 'Pays').selectOption('NG');
  if (toolId === 'telecom-roaming') await form.getByLabel('Pays de destination').selectOption('KE');
  if (toolId === 'telecom-airtime') {
    await form.locator('[name="amount"]').fill('5000');
    const operator = form.getByLabel('Opérateur');
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
      const expectedName = FRENCH_COUNTRY_NAMES[option.code];
      expect(expectedName, `${toolId}:${group.name}:${option.code} must have an owned French label`).toBeTruthy();
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
    'telecom-tv': /\b(?:devices|Sports \+ entertainment|Streaming only|Family|Access|Lite)\b/i
  };
  if (forbiddenByTool[toolId]) {
    expect(resultText, `${toolId}: dataset-derived output must be natively rendered in French`)
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

test('French Telecom hub: 14 rendered artworks and exact fixed-320/375 root-16/32 reflow', async ({ page }) => {
  await page.goto(HUB_ROUTE);
  await expect(page.getByRole('heading', { level: 1, name: 'Planifier sans confondre archive et offre actuelle' })).toBeVisible();
  await expect(page.locator('.tel-hub-card')).toHaveCount(14);
  await expect(page.locator('.tel-hub-card img')).toHaveCount(14);
  expect(await page.locator('.tel-hub-card img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0))).toBe(true);

  await expectStateReflow(page, 'hub initial');

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  expect(await textContrast(page, '.tel-source-alert p')).toBeGreaterThanOrEqual(4.5);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  expect(await textContrast(page, '.tel-source-alert p')).toBeGreaterThanOrEqual(4.5);
});

test('telecom-tv: all-country headline and TXT tier names stay in the shared French runtime', async ({ page, baseURL }) => {
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
  expect(countryCodes).toEqual(Object.keys(FRENCH_COUNTRY_NAMES).sort());

  for (const countryCode of countryCodes) {
    const country = ARCHIVED_TELECOM_DATA.countries[countryCode];
    await page.locator('#telecom-form [name="country"]').selectOption(countryCode);
    await page.getByRole('button', { name: 'Calculer avec le snapshot' }).click();
    await expect(page.locator('.fr-telecom-result-body')).not.toBeEmpty();
    const resultText = normalizeText(await page.locator('.fr-telecom-result-body').innerText());
    expectNativeResultText('telecom-tv', resultText);

    const packages = (country.tvProviders || []).flatMap((provider) => (
      (provider.packages || []).map((item) => ({ ...item, provider: provider.name }))
    ));
    if (!packages.length) {
      await expect(page.locator('.fr-telecom-result-body')).toContainText('Aucun bouquet TV archivé');
      continue;
    }
    const selectedMaximum = Number(await page.locator('#telecom-form [name="maxPrice"]').inputValue());
    const displayedPackages = packages.filter((item) => Number(item.price) <= selectedMaximum);

    const displayedTierNames = await page.locator('td[data-label="Bouquet archivé"]')
      .evaluateAll((cells) => cells.map((cell) => cell.textContent.trim()));
    expect(displayedTierNames, `${countryCode}: every table tier must use the shared French renderer`)
      .toEqual(expect.arrayContaining(displayedPackages.map((item) => frenchTelecom.tvName(item.name))));

    const best = displayedPackages
      .filter((item) => Number(item.channels) > 0)
      .map((item) => ({ ...item, pricePerChannel: Number(item.price) / Number(item.channels) }))
      .sort((left, right) => left.pricePerChannel - right.pricePerChannel)[0];
    const expectedBest = `${best.provider} · ${frenchTelecom.tvName(best.name)}`;
    const bestMetric = page.locator('.fr-telecom-metric')
      .filter({ hasText: 'Plus faible coût par chaîne du snapshot' });
    await expect(bestMetric.locator('strong')).toHaveText(expectedBest);
    if (frenchTelecom.tvName(best.name) !== best.name) {
      expect(resultText, `${countryCode}: raw best-value tier must not leak into the headline`)
        .not.toContain(`${best.provider} · ${best.name}`);
    }

    const txtDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger TXT' }).click();
    const txtDownload = await txtDownloadPromise;
    const txt = fs.readFileSync(await txtDownload.path(), 'utf8');
    expect(txt, `${countryCode}: TXT must serialize the localized headline`).toContain(expectedBest);
    if (frenchTelecom.tvName(best.name) !== best.name) {
      expect(txt, `${countryCode}: TXT must not serialize the raw tier name`)
        .not.toContain(`${best.provider} · ${best.name}`);
    }

    if (['KE', 'ZA'].includes(countryCode)) {
      expect(expectedBest).toBe('DStv · Accès');
      await expectStateReflow(page, `telecom-tv ${countryCode} localized result`);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '16px';
        document.documentElement.setAttribute('data-theme', 'light');
      });
      expect(await textContrast(page, '.fr-telecom-source p')).toBeGreaterThanOrEqual(4.5);
      expect(await textContrast(page, '.fr-telecom-metric strong')).toBeGreaterThanOrEqual(4.5);
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      expect(await textContrast(page, '.fr-telecom-source p')).toBeGreaterThanOrEqual(4.5);
      expect(await textContrast(page, '.fr-telecom-metric strong')).toBeGreaterThanOrEqual(4.5);
    }
  }

  expect(await storageSnapshot(page), 'TV all-country sweep must not write browser storage').toEqual(storageBefore);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(unexpectedNetwork).toEqual([]);
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
    await expect(artwork).toHaveAttribute('alt', `Illustration de l’outil ${title}`);
    expect(await artwork.evaluate((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)).toBe(true);
    await expect(page.locator('[data-source-state="stale"][data-source-confidence="low"]')).toBeVisible();
    await expect(page.getByText('Aucun champ n’est envoyé, aucune IA n’est appelée')).toBeVisible();
    const defaultFormValues = await formValueSnapshot(page);
    await expectExactControlContracts(page, toolId);
    await expectNativeCountryOptions(page, toolId);
    await expectAccessibilityBasics(page, toolId);

    await expectStateReflow(page, `${toolId} initial`);

    await page.evaluate(() => {
      document.documentElement.style.fontSize = '16px';
    });
    await selectScenario(page, toolId);
    const submit = page.getByRole('button', { name: 'Calculer avec le snapshot' });
    await submit.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('afro-navbar')).toHaveCount(1);
    await expect(page.locator('afro-site-assistant')).toHaveCount(1);
    await expect(page.locator('afro-navbar .btn-login')).toHaveAttribute('href', /\/fr\/auth\/\?mode=login/);
    expect(await page.locator('afro-country-selector').count()).toBeGreaterThan(0);
    await expect(page.locator('#telecom-results .fr-telecom-source')).toBeVisible();
    await expect(page.locator('#telecom-results .fr-telecom-result-body')).not.toBeEmpty();
    await expect(page.locator('#telecom-errors')).toBeEmpty();

    const resultText = normalizeText(await page.locator('.fr-telecom-result-body').innerText());
    expect(resultText).not.toMatch(/\b(?:NaN|Infinity|undefined)\b/);
    expectNativeResultText(toolId, resultText);
    await expectStateReflow(page, `${toolId} result`);

    await page.evaluate(() => {
      document.documentElement.style.fontSize = '16px';
      document.documentElement.setAttribute('data-theme', 'light');
    });
    expect(await textContrast(page, '.fr-telecom-source p')).toBeGreaterThanOrEqual(4.5);
    const lightBackground = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    expect(await textContrast(page, '.fr-telecom-source p')).toBeGreaterThanOrEqual(4.5);
    const darkBackground = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(darkBackground).not.toBe(lightBackground);

    const jsonDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger JSON' }).click();
    const jsonDownload = await jsonDownloadPromise;
    const jsonBuffer = fs.readFileSync(await jsonDownload.path());
    const payload = JSON.parse(jsonBuffer.toString('utf8'));
    expect(payload.toolId).toBe(toolId);
    expect(payload.locale).toBe('fr');
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
    await page.getByRole('button', { name: 'Télécharger TXT' }).click();
    const txtDownload = await txtDownloadPromise;
    const originalTxt = fs.readFileSync(await txtDownload.path(), 'utf8');
    expect(originalTxt).toContain(title);
    expect(originalTxt).toContain(`Route : ${route}`);
    expect(originalTxt).toContain('Snapshot : 2026-03-01');

    let resetDownloads = 0;
    page.on('download', () => {
      resetDownloads += 1;
    });
    const reset = page.getByRole('button', { name: 'Réinitialiser' });
    await expect(reset).toBeVisible();
    await reset.click();
    await expect(page.locator('#telecom-export-status')).toHaveText('Scénario réinitialisé.');
    await expect(page.locator('.fr-telecom-result-body')).toHaveCount(0);
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
    await expect(page.locator('#telecom-errors')).toContainText('d’abord un résultat.');

    await selectScenario(page, toolId);
    await submit.click();
    await expect(page.locator('#telecom-results .fr-telecom-result-body')).not.toBeEmpty();

    let invalidationDownloads = 0;
    page.on('download', () => {
      invalidationDownloads += 1;
    });
    await page.locator('#telecom-form [data-country-select][name="country"]').selectOption('');
    await submit.click();
    await expect(page.locator('.fr-telecom-result-body')).toHaveCount(0);
    await expect(page.locator('#telecom-results .tel-empty')).toBeVisible();
    await expect(page.locator('#telecom-errors')).toContainText('Corrigez les champs obligatoires');
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
    await expect(page.locator('#telecom-errors')).toContainText('d’abord un résultat.');
    await page.waitForTimeout(100);
    expect(invalidationDownloads, `${toolId}: invalid required country must revoke JSON/TXT export state`).toBe(0);

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
    await expect(freshPage.locator('.fr-telecom-result-body')).toHaveCount(0);
    await freshPage.getByLabel('Rouvrir un JSON').setInputFiles({
      name: `${toolId}.json`,
      mimeType: 'application/json',
      buffer: jsonBuffer
    });
    await expect(freshPage.locator('#telecom-export-status')).toContainText('Scénario rouvert et recalculé localement.');
    expect(normalizeText(await freshPage.locator('.fr-telecom-result-body').innerText())).toBe(resultText);
    await expectStateReflow(freshPage, `${toolId} genuine-fresh-context-reopened-result`);
    await expect(freshPage.locator('afro-navbar')).toHaveCount(1);
    await expect(freshPage.locator('afro-navbar .btn-login')).toHaveAttribute('href', /\/fr\/auth\/\?mode=login/);
    expect(await freshPage.locator('afro-country-selector').count()).toBeGreaterThan(0);

    await freshPage.evaluate(() => {
      document.documentElement.style.fontSize = '16px';
    });
    const reopenedTxtDownloadPromise = freshPage.waitForEvent('download');
    await freshPage.getByRole('button', { name: 'Télécharger TXT' }).click();
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
