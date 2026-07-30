const { expect, test } = require('@playwright/test');
const pdfParse = require('pdf-parse');

const parity = require('../../data/transport/french-parity.json');

test.describe.configure({ mode: 'serial' });

function readDownload(download, encoding = null) {
  return download.createReadStream().then((stream) => new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => {
      const value = Buffer.concat(chunks);
      resolve(encoding ? value.toString(encoding) : value);
    });
    stream.on('error', reject);
  }));
}

function normalizedPdfText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/₦/g, 'NGN ')
    .replace(/([.,]\d{1,3})\s+(?=\d)/g, '$1')
    .toLocaleLowerCase('fr');
}

async function dismissCookieConsent(page) {
  const close = page.locator('#afro-cc-close');
  if (await close.isVisible().catch(() => false)) await close.click();
}

async function prepareInputs(page, appId) {
  await page.locator('main input,main select,main textarea,[role="main"] input,[role="main"] select,[role="main"] textarea')
    .first().waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});
  await page.evaluate((activeAppId) => {
    const root = document.querySelector('main,[role="main"]') || document.body;
    const visible = (node) => !node.disabled && node.offsetParent !== null;
    const update = (node, value) => {
      node.value = String(value);
      if (activeAppId === 'car-import-cost' || activeAppId === 'car-price-intelligence') {
        node.dispatchEvent(new Event('input', { bubbles: true }));
      }
      node.dispatchEvent(new Event('change', { bubbles: true }));
    };
    root.querySelectorAll('select').forEach((select) => {
      if (!visible(select) || select.value) return;
      const option = Array.from(select.options).find((item) => !item.disabled && item.value);
      if (option) update(select, option.value);
    });
    root.querySelectorAll('input[type="number"]').forEach((input) => {
      if (!visible(input) || (input.value !== '' && input.checkValidity())) return;
      const id = input.id.toLowerCase();
      let value = 10;
      if (/price|cost|value|premium|budget|fare|wage|payment/.test(id)) value = 1000;
      else if (/distance|(^|-)km|mileage/.test(id)) value = 100;
      else if (/weight|load/.test(id)) value = 5;
      else if (/tenor|month/.test(id)) value = 24;
      const min = input.min === '' ? 0 : Number(input.min);
      const max = input.max === '' ? Infinity : Number(input.max);
      value = Math.min(Math.max(value, Number.isFinite(min) ? min + 1 : value), Number.isFinite(max) ? max : value);
      const step = input.step && input.step !== 'any' ? Number(input.step) : NaN;
      if (Number.isFinite(step) && step > 0 && Number.isFinite(min)) {
        value = min + Math.ceil(Math.max(0, value - min) / step) * step;
        value = Number(value.toFixed(10));
      }
      update(input, value);
    });
    root.querySelectorAll('input[type="date"]').forEach((input) => {
      if (visible(input) && !input.value) update(input, '2030-12-31');
    });
    if (activeAppId === 'car-price-intelligence') {
      ['maxBudgetLocal', 'maxMonthlyLocal', 'maxRisk', 'minLiquidity'].forEach((name) => {
        const input = root.querySelector(`[name="${name}"]`);
        if (input && visible(input)) update(input, '');
      });
      ['make', 'body', 'fuel', 'sourceMarket', 'recommendation', 'eligibility'].forEach((name) => {
        const select = root.querySelector(`select[name="${name}"]`);
        if (select && visible(select)) update(select, '');
      });
    }
  }, appId);
}

function primaryAction(page, appId) {
  if (appId === 'car-price-intelligence') return page.locator('main form button[type="submit"],[role="main"] form button[type="submit"]').first();
  if (appId === 'car-import-cost') return page.locator('#carImportForm button[type="submit"]').first();
  if (appId === 'vehicle-tracker-roi') return page.locator('main button[onclick*="calculate"],[role="main"] button[onclick*="calculate"]').first();
  return page.locator('main button.btn-calc,main button[onclick*="calc"],main button[onclick*="checkRegistration"],[role="main"] button.btn-calc,[role="main"] button[onclick*="calc"],[role="main"] button[onclick*="checkRegistration"]').first();
}

async function activateAction(page, action, appId) {
  await action.focus({ timeout: 15000 });
  await expect(action, `${appId} keyboard action focus`).toBeFocused();
  await action.evaluate((button) => button.click());
}

const staleAfterResultApps = new Set([
  'car-import-cost',
  'car-price-intelligence',
  'ride-fare',
  'boda-income',
  'matatu-fare',
  'delivery-cost',
  'car-loan-vs-cash',
  'vehicle-registration',
  'vehicle-depreciation',
  'fleet-fuel',
  'last-mile-delivery',
  'parking-fee',
  'route-cost',
  'toll-calc',
  'truck-load',
  'vehicle-operating-cost',
  'vehicle-tracker-roi'
]);

async function visibleResultLength(page) {
  return page.evaluate(() => {
    const selectors = [
      '.results.on',
      '.result-panel:not([hidden])',
      '[id*="result" i]:not([hidden])',
      '.fr-cars-output',
      '[data-fr-cars-result]',
      '.cars-card-grid',
      '[data-fr-transport-result]',
      'main output'
    ];
    return Array.from(document.querySelectorAll(selectors.join(',')))
      .filter((element) => {
        const style = getComputedStyle(element);
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && !element.closest('[data-fr-transport-stale="true"]');
      })
      .map((element) => element.textContent.trim())
      .join('').length;
  });
}

async function visibleResultSnapshot(page) {
  return page.evaluate(() => {
    const root = document.querySelector('main,[role="main"]') || document.body;
    const selectors = [
      '.results.on',
      '.result-panel:not([hidden])',
      '[id*="result" i]:not([hidden])',
      '.fr-cars-output',
      '[data-fr-cars-result]',
      '.cars-card-grid',
      '[data-fr-transport-result]',
      'main output'
    ];
    return Array.from(root.querySelectorAll(selectors.join(',')))
      .filter((element) => {
        const style = getComputedStyle(element);
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && !element.closest('[data-fr-transport-stale="true"]')
          && element.textContent.trim();
      })
      .map((element) => element.textContent.replace(/\s+/g, ' ').trim())
      .join('\n')
      .slice(0, 900);
  });
}

async function mutateValidInputAfterResult(page, appId) {
  return page.evaluate((activeAppId) => {
    const root = document.querySelector('main,[role="main"]') || document.body;
    const controls = Array.from(root.querySelectorAll('input,select,textarea')).filter((control) => (
      !control.disabled
      && control.offsetParent !== null
      && !control.closest('.fr-transport-proof')
      && !['hidden', 'submit', 'button', 'reset', 'file'].includes(control.type)
    ));
    const dispatch = (control) => {
      control.dispatchEvent(new Event('input', { bubbles: true }));
      control.dispatchEvent(new Event('change', { bubbles: true }));
    };
    for (const control of controls) {
      const before = control.value;
      if (control.tagName === 'SELECT') {
        const alternative = Array.from(control.options).find((option) => (
          !option.disabled && option.value && option.value !== before
        ));
        if (!alternative) continue;
        control.value = alternative.value;
        dispatch(control);
        return { appId: activeAppId, control: control.id || control.name, before, after: control.value };
      }
      if (control.type === 'number') {
        const min = control.min === '' ? -Infinity : Number(control.min);
        const max = control.max === '' ? Infinity : Number(control.max);
        const step = control.step && control.step !== 'any' ? Number(control.step) : 1;
        const current = Number(before);
        const candidates = [current + step, current - step, current + (step * 2)];
        const next = candidates.find((value) => (
          Number.isFinite(value)
          && value >= min
          && value <= max
          && String(value) !== before
        ));
        if (next === undefined) continue;
        control.value = String(next);
        if (!control.checkValidity()) {
          control.value = before;
          continue;
        }
        dispatch(control);
        return { appId: activeAppId, control: control.id || control.name, before, after: control.value };
      }
      if (control.type === 'date') {
        const next = before === '2030-12-31' ? '2030-12-30' : '2030-12-31';
        control.value = next;
        if (!control.checkValidity()) {
          control.value = before;
          continue;
        }
        dispatch(control);
        return { appId: activeAppId, control: control.id || control.name, before, after: control.value };
      }
      if (control.type === 'checkbox' || control.type === 'radio') {
        control.checked = !control.checked;
        dispatch(control);
        return { appId: activeAppId, control: control.id || control.name, before, after: String(control.checked) };
      }
    }
    return null;
  }, appId);
}

function exactCalculatedFragments(value) {
  const matches = String(value || '').match(
    /(?:\b[A-Z]{3}\b|[$€£₦₵])\s*[\d][\d.,]*|[\d][\d.,]*\s*(?:%|km|litres?|jours?|mois|conformes?|à corriger|non vérifiés?)/gu
  ) || [];
  const unique = Array.from(new Set(matches.map((item) => item.replace(/\s+/g, ' ').trim())));
  if (unique.length) return unique.slice(0, 4);
  const fallback = String(value || '').match(/\d+(?:[.,]\d+)?/);
  return fallback ? [fallback[0]] : [];
}

const forbiddenEnglishUi = [
  'Calculate ',
  'Estimated ',
  'Total Cost',
  'Monthly Cost',
  'Annual Cost',
  'Daily Net Income',
  'Profit Margin',
  'Required Documents',
  'Search and filter',
  'Buyer-ready comparisons',
  'Local asking',
  'Import risk',
  'Source market',
  'What to do next',
  'Summary ready',
  'No charges in this block',
  'Tap each item',
  'passed,',
  'failed,',
  'not checked'
];

const forbiddenEnglishPatterns = [
  /(?<!\p{L})(?:Calculate|Estimated|Monthly|Annual|Daily|Vehicle|Insurance|Maintenance|Savings|Recommendation|Required|Current|Valid|Best|Highest|Lowest|Details|Interactive)(?!\p{L})/gu,
  /(?<!\p{L})(?:days?|months?|years?|hours?)(?!\p{L})/gu,
  /(?<!\p{L})(?:the|and|with|from|until|after|before|using|appears|shown|enter|per)(?!\p{L})/giu
];

async function expectFrenchProductUi(page, appId, stage) {
  const visibleMainText = await page.locator('main,[role="main"]').first().innerText();
  const found = forbiddenEnglishUi.filter((phrase) => visibleMainText.includes(phrase));
  for (const pattern of forbiddenEnglishPatterns) {
    for (const match of Array.from(visibleMainText.matchAll(pattern)).slice(0, 12)) {
      const start = Math.max(0, match.index - 35);
      const end = Math.min(visibleMainText.length, match.index + match[0].length + 35);
      found.push(visibleMainText.slice(start, end).replace(/\s+/g, ' ').trim());
    }
  }
  expect(found, `${appId} ${stage} English UI fragments`).toEqual([]);
}

async function visibleViewportViolations(page, viewportWidth) {
  return page.evaluate((width) => {
    const viewportLeft = -1;
    const viewportRight = width + 1;
    const violations = [];
    const describe = (element) => {
      const id = element.id ? `#${CSS.escape(element.id)}` : '';
      const classes = Array.from(element.classList)
        .slice(0, 4)
        .map((name) => `.${CSS.escape(name)}`)
        .join('');
      return `${element.tagName.toLowerCase()}${id}${classes}`;
    };
    const parentElementAcrossShadow = (node) => {
      if (node.parentElement) return node.parentElement;
      const root = node.getRootNode();
      return root instanceof ShadowRoot ? root.host : null;
    };
    const isDemonstrablyClosed = (node) => {
      let element = node.nodeType === Node.ELEMENT_NODE ? node : parentElementAcrossShadow(node);
      while (element) {
        const style = getComputedStyle(element);
        const explicitClosed = (
          element.hidden
          || element.hasAttribute('inert')
          || element.getAttribute('aria-hidden') === 'true'
          || element.getAttribute('data-state') === 'closed'
          || element.getAttribute('data-open') === 'false'
        );
        if (
          explicitClosed
          && Number.parseFloat(style.opacity) === 0
          && style.pointerEvents === 'none'
        ) return true;
        element = parentElementAcrossShadow(element);
      }
      return false;
    };
    const pathFor = (node, segments = []) => {
      if (node instanceof ShadowRoot) {
        return pathFor(node.host, [`${describe(node.host)}::shadow`, ...segments]);
      }
      if (node.nodeType === Node.TEXT_NODE) {
        return pathFor(node.parentNode, [...segments, '#text']);
      }
      if (!(node instanceof Element)) return segments.join(' > ');
      const root = node.getRootNode();
      if (root instanceof ShadowRoot && node.parentNode === root) {
        return pathFor(root, [describe(node), ...segments]);
      }
      if (node === document.body) return ['body', ...segments].join(' > ');
      return pathFor(node.parentElement || root, [describe(node), ...segments]);
    };
    const recordRects = (node, rects, type, text) => {
      Array.from(rects).forEach((rect, rectIndex) => {
        if (rect.width <= 0 || rect.height <= 0) return;
        if (rect.left >= viewportLeft && rect.right <= viewportRight) return;
        const element = node.nodeType === Node.ELEMENT_NODE ? node : parentElementAcrossShadow(node);
        violations.push({
          type,
          selector: pathFor(node),
          rectIndex,
          left: Number(rect.left.toFixed(1)),
          right: Number(rect.right.toFixed(1)),
          width: Number(rect.width.toFixed(1)),
          overflowX: element ? getComputedStyle(element).overflowX : '',
          text: String(text || '').trim().replace(/\s+/g, ' ').slice(0, 120)
        });
      });
    };
    const visit = (node) => {
      if (isDemonstrablyClosed(node)) return;
      if (node.nodeType === Node.TEXT_NODE) {
        if (!/\S/.test(node.data)) return;
        const range = document.createRange();
        range.selectNodeContents(node);
        recordRects(node, range.getClientRects(), 'text', node.data);
        range.detach();
        return;
      }
      if (!(node instanceof Element) && !(node instanceof ShadowRoot)) return;
      if (node instanceof Element) {
        recordRects(node, node.getClientRects(), 'element', node.textContent);
        if (node.shadowRoot) visit(node.shadowRoot);
      }
      Array.from(node.childNodes).forEach(visit);
    };
    visit(document.body);
    return violations;
  }, viewportWidth);
}

async function applyGenuine200PercentTextScale(page, route, stage, viewportWidth) {
  await page.setViewportSize({ width: viewportWidth, height: 900 });
  await page.evaluate(() => {
    document.documentElement.style.setProperty('font-size', '100%', 'important');
  });
  expect(await page.evaluate(() => window.innerWidth), `${route} ${stage} viewport width`).toBe(viewportWidth);
  const baseline = await page.evaluate(
    () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  );
  expect(baseline, `${route} ${stage} baseline root font size`).toBe(16);
  await page.evaluate(() => {
    document.documentElement.style.setProperty('font-size', '200%', 'important');
  });
  await expect.poll(() => page.evaluate(
    () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  ), { message: `${route} ${stage} genuine 200% text scaling` }).toBe(32);
  const scaled = await page.evaluate(
    () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  );
  expect(scaled, `${route} ${stage} exact 2x root font scaling`).toBe(baseline * 2);
}

async function expectStrictReflow(page, route, stage, viewportWidth) {
  await applyGenuine200PercentTextScale(page, route, stage, viewportWidth);
  const violations = await visibleViewportViolations(page, viewportWidth);
  const documentOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(
    documentOverflow,
    `${route} ${stage} document-width overflow at ${viewportWidth}px/200%:\n${JSON.stringify(violations, null, 2)}`
  ).toBeLessThanOrEqual(1);
  expect(
    violations,
    `${route} ${stage} ${viewportWidth}px/200% recursive visible rectangle violations:\n${JSON.stringify(violations, null, 2)}`
  ).toEqual([]);
}

function parseCsvRows(value) {
  return String(value || '').trim().split(/\r?\n/).map((line) => {
    const values = [];
    let current = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"') {
        if (quoted && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (character === ',' && !quoted) {
        values.push(current);
        current = '';
      } else {
        current += character;
      }
    }
    values.push(current);
    return values;
  });
}

async function measureCarImportContrast(page) {
  return page.evaluate(() => {
    const rgb = (value) => (String(value).match(/[\d.]+/g) || []).map(Number);
    const luminance = (value) => {
      const channels = rgb(value).slice(0, 3).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : Math.pow((normalized + 0.055) / 1.055, 2.4);
      });
      return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
    };
    const contrast = (foreground, background) => {
      const foregroundLuminance = luminance(foreground);
      const backgroundLuminance = luminance(background);
      return Number((
        (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
        / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
      ).toFixed(2));
    };
    const solidBackground = (element) => {
      let current = element;
      while (current) {
        const background = getComputedStyle(current).backgroundColor;
        const channels = rgb(background);
        if (channels.length === 3 || channels[3] > 0) return background;
        current = current.parentElement;
      }
      return 'rgb(255, 255, 255)';
    };
    const measureElement = (element) => {
      const style = getComputedStyle(element);
      const background = solidBackground(element);
      return {
        color: style.color,
        background,
        ratio: contrast(style.color, background)
      };
    };
    const measure = (selector) => measureElement(document.querySelector(selector));
    const directTextFailures = Array.from(document.querySelectorAll(
      '#carImportApp .car-import-layout *, #carImportApp .car-import-content-grid *'
    )).filter((element) => {
      const style = getComputedStyle(element);
      const directText = Array.from(element.childNodes).find(
        (node) => node.nodeType === Node.TEXT_NODE && /\S/.test(node.data)
      );
      const range = document.createRange();
      if (directText) range.selectNodeContents(directText);
      const hasVisibleTextRect = directText
        && Array.from(range.getClientRects()).some((rect) => rect.width > 0 && rect.height > 0);
      range.detach();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && hasVisibleTextRect;
    }).map((element) => {
      const style = getComputedStyle(element);
      const background = solidBackground(element);
      return {
        selector: element.id ? `#${element.id}` : `${element.tagName.toLowerCase()}.${element.className}`,
        text: Array.from(element.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.data.trim())
          .filter(Boolean)
          .join(' ')
          .slice(0, 100),
        color: style.color,
        background,
        ratio: contrast(style.color, background)
      };
    }).filter((entry) => entry.ratio < 4.5);

    return {
      theme: document.documentElement.dataset.theme,
      themeChoice: document.documentElement.dataset.themeChoice,
      panelBackground: getComputedStyle(document.querySelector('.car-import-panel')).backgroundColor,
      heading: measure('#carImportForm h2'),
      help: measure('#carImportForm .car-import-help'),
      cta: measure('.car-import-hero-button:not(.secondary)'),
      advancedLabels: Array.from(document.querySelectorAll(
        'details.car-import-advanced .car-import-field > span'
      )).map((element) => ({
        inputId: element.parentElement.htmlFor,
        ...measureElement(element)
      })),
      directTextFailures
    };
  });
}

async function setCarImportTheme(page, theme) {
  await expect(page.locator('body')).toHaveAttribute('data-fr-transport-theme-ready', 'true');
  await expect.poll(
    () => page.evaluate(() => Boolean(
      window.AfroTools
      && window.AfroTools.darkMode
      && typeof window.AfroTools.darkMode.set === 'function'
    )),
    { message: 'Car Import real dark-mode API is ready' }
  ).toBe(true);
  await page.evaluate((choice) => window.AfroTools.darkMode.set(choice), theme);
  await expect.poll(
    () => page.evaluate(() => ({
      theme: document.documentElement.dataset.theme,
      choice: document.documentElement.dataset.themeChoice
    })),
    { message: `Car Import ${theme} theme is active` }
  ).toEqual({
    theme: theme === 'auto' ? 'dark' : theme,
    choice: theme
  });
}

async function captureCarImportPrivacySnapshot(
  page,
  context,
  transport,
  consoleMessages,
  pendingRequestHeaders = []
) {
  await page.waitForTimeout(1250);
  await Promise.all(pendingRequestHeaders);
  const browserState = await page.evaluate(async () => {
    const storageObject = (storage) => Object.fromEntries(
      Array.from({ length: storage.length }, (_, index) => storage.key(index))
        .filter(Boolean)
        .map((key) => [key, storage.getItem(key)])
    );
    const indexedDb = {};
    if (indexedDB.databases) {
      const databases = await indexedDB.databases();
      for (const descriptor of databases) {
        if (!descriptor.name) continue;
        indexedDb[descriptor.name] = await new Promise((resolve) => {
          const request = indexedDB.open(descriptor.name);
          request.onerror = () => resolve({ error: String(request.error || 'open failed') });
          request.onsuccess = () => {
            const database = request.result;
            const storeNames = Array.from(database.objectStoreNames);
            if (!storeNames.length) {
              database.close();
              resolve({});
              return;
            }
            const transaction = database.transaction(storeNames, 'readonly');
            const values = {};
            let pending = storeNames.length;
            storeNames.forEach((storeName) => {
              const all = transaction.objectStore(storeName).getAll();
              all.onerror = () => {
                values[storeName] = { error: String(all.error || 'read failed') };
                pending -= 1;
                if (!pending) {
                  database.close();
                  resolve(values);
                }
              };
              all.onsuccess = () => {
                values[storeName] = all.result;
                pending -= 1;
                if (!pending) {
                  database.close();
                  resolve(values);
                }
              };
            });
          };
        });
      }
    }
    const cacheState = {};
    if ('caches' in window) {
      for (const cacheName of await caches.keys()) {
        const cache = await caches.open(cacheName);
        const entries = [];
        for (const request of await cache.keys()) {
          const response = await cache.match(request);
          entries.push({
            method: request.method,
            url: request.url,
            headers: Object.fromEntries(request.headers.entries()),
            body: response ? await response.clone().text().catch(() => '') : ''
          });
        }
        cacheState[cacheName] = entries;
      }
    }
    return {
      href: location.href,
      search: location.search,
      hash: location.hash,
      localStorage: storageObject(localStorage),
      sessionStorage: storageObject(sessionStorage),
      indexedDb,
      caches: cacheState,
      analytics: {
        capturedGtag: window.__carImportCapturedGtag || [],
        dataLayer: window.dataLayer || [],
        calcState: window.AfroTools && window.AfroTools.analytics
          && typeof window.AfroTools.analytics._getCalcState === 'function'
          ? window.AfroTools.analytics._getCalcState()
          : null
      },
      windowName: window.name,
      analyticsLoaders: Array.from(document.scripts).filter((script) => (
        new URL(script.src || location.href, location.href).pathname === '/assets/js/lib/analytics.js'
      )).length,
      implicitDraft: localStorage.getItem('carImportCostLastInput'),
      savedQuotes: localStorage.getItem('carImportCostQuotes'),
      printCount: window.__carImportPrintCount || 0
    };
  });
  return {
    browserState,
    cookies: await context.cookies(),
    transport: transport.slice(),
    consoleMessages: consoleMessages.slice()
  };
}

function expectCarImportPrivacy(snapshot, stage, sensitiveTokens, options = {}) {
  expect.soft(snapshot.browserState.search, `${stage}: URL query stays empty`).toBe('');
  expect.soft(snapshot.browserState.hash, `${stage}: URL hash stays empty`).toBe('');
  expect.soft(new URL(snapshot.browserState.href).pathname, `${stage}: canonical path stays fixed`)
    .toBe('/fr/tools/cout-importation-voiture/');
  expect.soft(snapshot.browserState.analyticsLoaders, `${stage}: exactly one analytics loader`).toBe(1);
  expect.soft(snapshot.browserState.implicitDraft, `${stage}: implicit full-input draft is absent`).toBeNull();

  const stateForLeakCheck = structuredClone(snapshot);
  if (options.allowExplicitSavedQuote) {
    delete stateForLeakCheck.browserState.localStorage.carImportCostQuotes;
    stateForLeakCheck.browserState.savedQuotes = null;
  }
  const serialized = JSON.stringify(stateForLeakCheck);
  sensitiveTokens.forEach((token) => {
    expect.soft(serialized, `${stage}: ${token} is absent outside explicit local Save`).not.toContain(token);
  });
  const unsafeTransport = snapshot.transport.filter((request) => (
    sensitiveTokens.some((token) => JSON.stringify(request).includes(token))
  ));
  expect.soft(unsafeTransport, `${stage}: no request method/URL/query/body/header leaks`).toEqual([]);
}

async function expectActionControlsState(locator, enabled, message) {
  await expect(locator, `${message}: all five controls render`).toHaveCount(5);
  expect(
    await locator.evaluateAll((controls, expectedEnabled) => controls.every((control) => (
      control.disabled === !expectedEnabled
        && control.getAttribute('aria-disabled') === String(!expectedEnabled)
    )), enabled),
    message
  ).toBe(true);
}

test('French Transport hub is an exact accessible 18-app discovery surface', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  const response = await page.goto('/fr/transport/', { waitUntil: 'domcontentloaded' });
  expect(response && response.status()).toBe(200);
  await expect(page.locator('[data-fr-transport-card]')).toHaveCount(18);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('18 applications Transport');
  await expect.poll(() => page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )).toBeLessThanOrEqual(1);
  await expectStrictReflow(page, '/fr/transport/', 'hub-initial-320', 320);
  await expectStrictReflow(page, '/fr/transport/', 'hub-initial-375', 375);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expectStrictReflow(page, '/fr/transport/', 'hub-reopen-375', 375);
  const first = page.locator('[data-fr-transport-card]').first();
  await first.focus();
  await expect(first).toBeFocused();
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  for (const schema of schemas) expect(() => JSON.parse(schema)).not.toThrow();
});

test('all 18 French Transport applications execute, reject stale invalid input, export and reflow locally', async ({ browser, context, page: initialPage }) => {
  test.setTimeout(18 * 60 * 1000);
  const routePattern = process.env.FR_TRANSPORT_PATTERN
    ? new RegExp(process.env.FR_TRANSPORT_PATTERN)
    : null;
  const apps = parity.apps.filter((app) => !routePattern || routePattern.test(app.englishId));
  expect(apps.length, 'selected French Transport browser workflows').toBeGreaterThan(0);
  const pageErrors = [];
  const consoleErrors = [];
  const stateChangingRequests = [];
  const externalRequests = [];
  const reopenContext = await browser.newContext({
    colorScheme: 'dark',
    reducedMotion: 'reduce'
  });

  await initialPage.close();

  for (const [index, app] of apps.entries()) {
    const page = await context.newPage();
    page.on('pageerror', (error) => pageErrors.push(`${page.url()}: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(`${page.url()}: ${message.text()}`);
    });
    page.on('response', (resourceResponse) => {
      if (resourceResponse.status() === 404) {
        consoleErrors.push(`${page.url()}: 404 ${resourceResponse.url()}`);
      }
    });
    page.on('request', (request) => {
      if (/^(?:POST|PUT|PATCH|DELETE)$/i.test(request.method())) {
        stateChangingRequests.push(`${request.method()} ${request.url()}`);
      }
    });
    await page.route(/^https?:\/\//, (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
      externalRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      const contentType = url.hostname === 'www.googletagmanager.com'
        ? 'application/javascript'
        : 'text/css';
      return route.fulfill({ status: 204, contentType, body: '' });
    });
    console.log(`French Transport browser workflow ${index + 1}/${apps.length}: ${app.englishId}`);
    await page.setViewportSize({ width: 320, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    const expectedArtworkPath = `/assets/img/tools/${app.imageId}.webp`;
    const artworkResponsePromise = page.waitForResponse((artworkResponse) => {
      const artworkUrl = new URL(artworkResponse.url());
      return artworkUrl.pathname === expectedArtworkPath
        && artworkResponse.request().resourceType() === 'image';
    });
    const response = await page.goto(app.frenchRoute, { waitUntil: 'domcontentloaded' });
    const artworkResponse = await artworkResponsePromise;
    console.log(`  ${app.englishId}: route loaded`);
    expect.soft(response && response.status(), `${app.englishId} status`).toBe(200);
    expect.soft(artworkResponse.status(), `${app.englishId} artwork status`).toBe(200);
    await dismissCookieConsent(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(app.name);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${app.frenchRoute}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://afrotools.com${app.frenchRoute}`);
    const expectedArtworkUrl = `https://afrotools.com${expectedArtworkPath}`;
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', expectedArtworkUrl);
    const artwork = page.locator('[data-fr-transport-artwork]');
    await expect(artwork, `${app.englishId} assigned artwork rendered once`).toHaveCount(1);
    await expect(artwork).toHaveAttribute('alt', `Illustration de ${app.name}`);
    const artworkAudit = await artwork.evaluate((image, expectedPath) => {
      const rect = image.getBoundingClientRect();
      const currentPath = new URL(image.currentSrc, window.location.href).pathname;
      const naturalAspect = image.naturalWidth / image.naturalHeight;
      const renderedAspect = rect.width / rect.height;
      return {
        currentPath,
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        renderedWidth: rect.width,
        renderedHeight: rect.height,
        aspectDelta: Math.abs(naturalAspect - renderedAspect),
        expectedPath
      };
    }, expectedArtworkPath);
    expect.soft(artworkAudit.currentPath, `${app.englishId} artwork currentSrc`).toBe(expectedArtworkPath);
    expect.soft(artworkAudit.complete, `${app.englishId} artwork completed`).toBe(true);
    expect.soft(artworkAudit.naturalWidth, `${app.englishId} artwork natural width`).toBeGreaterThan(0);
    expect.soft(artworkAudit.naturalHeight, `${app.englishId} artwork natural height`).toBeGreaterThan(0);
    expect.soft(artworkAudit.renderedWidth, `${app.englishId} artwork rendered width`).toBeGreaterThan(0);
    expect.soft(artworkAudit.renderedHeight, `${app.englishId} artwork rendered height`).toBeGreaterThan(0);
    expect.soft(artworkAudit.aspectDelta, `${app.englishId} artwork aspect preserved`).toBeLessThan(0.02);
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.getByText('Aucun tarif, horaire, trajet, disponibilité', { exact: false })).toBeVisible();
    await expect(page.getByText('Les champs et le résultat restent dans ce navigateur', { exact: false })).toBeVisible();

    const audit = await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme-choice', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      const root = document.querySelector('main,[role="main"]') || document.body;
      const controls = Array.from(root.querySelectorAll('input,select,textarea,button'));
      const enabled = controls.filter((control) => !control.disabled && control.offsetParent !== null);
      const unnamed = enabled.filter((control) => {
        if (control.tagName === 'BUTTON') return !(control.textContent.trim() || control.getAttribute('aria-label'));
        return !(control.getAttribute('aria-label') || control.labels && control.labels.length);
      });
      const schemaErrors = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map((node) => {
          try { JSON.parse(node.textContent); return ''; } catch (error) { return error.message; }
        }).filter(Boolean);
      const rgb = (value) => {
        const match = String(value).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
        return match ? match.slice(1, 4).map(Number) : [0, 0, 0];
      };
      const luminance = (value) => rgb(value)
        .map((channel) => channel / 255)
        .map((channel) => channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4)
        .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
      const txtButton = document.querySelector('[data-fr-transport-download-text]');
      const txtStyle = txtButton ? getComputedStyle(txtButton) : null;
      const txtForeground = txtStyle ? luminance(txtStyle.color) : 0;
      const txtBackground = txtStyle ? luminance(txtStyle.backgroundColor) : 1;
      const txtContrast = (Math.max(txtForeground, txtBackground) + 0.05)
        / (Math.min(txtForeground, txtBackground) + 0.05);
      if (enabled[0]) enabled[0].focus();
      return {
        controls: enabled.length,
        unnamed: unnamed.map((control) => control.id || control.outerHTML.slice(0, 80)),
        invalidDefaults: enabled
          .filter((control) => control.matches('input[type="number"]') && control.value !== '' && !control.checkValidity())
          .map((control) => `${control.id || control.name}: ${control.validationMessage}`),
        focused: !enabled[0] || document.activeElement === enabled[0],
        txtContrast,
        txtColors: txtStyle ? {
          color: txtStyle.color,
          backgroundColor: txtStyle.backgroundColor
        } : null,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        overflowElements: Array.from(document.querySelectorAll('body *'))
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1;
          })
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.classList.length ? `.${Array.from(element.classList).join('.')}` : ''}`,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              scrollWidth: element.scrollWidth,
              clientWidth: element.clientWidth
            };
          })
          .slice(0, 12),
        schemaErrors
      };
    });
    expect.soft(audit.controls, `${app.englishId} has a workflow control`).toBeGreaterThan(0);
    expect.soft(audit.unnamed, `${app.englishId} named controls`).toEqual([]);
    expect.soft(audit.invalidDefaults, `${app.englishId} valid numeric defaults`).toEqual([]);
    expect.soft(audit.focused, `${app.englishId} keyboard focus`).toBe(true);
    expect.soft(
      audit.txtContrast,
      `${app.englishId} dark local-TXT contrast ${JSON.stringify(audit.txtColors)}`
    ).toBeGreaterThanOrEqual(4.5);
    expect.soft(
      audit.overflow,
      `${app.englishId} 320px dark overflow: ${JSON.stringify(audit.overflowElements)}`
    ).toBeLessThanOrEqual(1);
    expect.soft(audit.schemaErrors, `${app.englishId} schema`).toEqual([]);
    const transportSchema = JSON.parse(await page.locator('script[data-fr-transport-schema]').textContent());
    expect.soft(transportSchema.image, `${app.englishId} schema artwork`).toBe(expectedArtworkUrl);
    console.log(`  ${app.englishId}: metadata, a11y and 320px audit ready`);
    await expectFrenchProductUi(page, app.englishId, 'initial');

    if (app.englishId === 'car-price-intelligence') {
      await expect(page.locator('#frCarsEstimator')).toBeVisible();
      await expect(page.locator('#fr-car-market option')).toHaveCount(7);
      await expect(page.locator('#fr-car-model option')).toHaveCount(5);
      await page.locator('#frCarsExample').click();
      await expect(page.locator('#frCarsSummary')).toHaveValue(/Toyota Corolla 2018/);
      await expect(page.locator('#frCarsLanded')).not.toHaveText('-');
      expect(
        await page.evaluate(() => Object.keys(localStorage).filter((key) => key.includes('cars'))),
        'car-price-intelligence keeps the estimate ephemeral unless the user explicitly exports'
      ).toEqual([]);
    }

    await expectStrictReflow(page, app.frenchRoute, 'initial-320', 320);
    await expectStrictReflow(page, app.frenchRoute, 'initial-375', 375);
    await page.evaluate(() => {
      document.documentElement.style.setProperty('font-size', '100%', 'important');
      document.documentElement.setAttribute('data-theme-choice', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    await prepareInputs(page, app.englishId);
    console.log(`  ${app.englishId}: valid fixture prepared`);
    const action = primaryAction(page, app.englishId);
    if (app.englishId === 'roadworthiness') {
      const checklistButton = page.locator('main button.check-item:visible,[role="main"] button.check-item:visible').first();
      await expect(checklistButton).toBeVisible();
      await checklistButton.focus();
      await expect(checklistButton).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(checklistButton).toHaveClass(/pass/);
      await expect(page.locator('#rwScore')).toContainText('1 conformes');
    } else {
      await expect(action, `${app.englishId} primary action`).toBeVisible();
      const firstNumber = page.locator('main input[type="number"]:visible:not([disabled]),[role="main"] input[type="number"]:visible:not([disabled])').first();
      if (await firstNumber.count()) {
        const original = await firstNumber.inputValue();
        await firstNumber.evaluate((node, activeAppId) => {
          node.value = '-1';
          if (activeAppId === 'car-import-cost' || activeAppId === 'car-price-intelligence') {
            node.dispatchEvent(new Event('input', { bubbles: true }));
          }
          node.dispatchEvent(new Event('change', { bubbles: true }));
        }, app.englishId);
        await activateAction(page, action, app.englishId);
        await expect(page.locator('[data-fr-transport-error]')).toContainText('Corrigez les champs invalides');
        const restored = original && Number(original) >= 0 ? original : '10';
        await firstNumber.evaluate((node, { value, activeAppId }) => {
          node.value = value;
          if (activeAppId === 'car-import-cost' || activeAppId === 'car-price-intelligence') {
            node.dispatchEvent(new Event('input', { bubbles: true }));
          }
          node.dispatchEvent(new Event('change', { bubbles: true }));
        }, { value: restored, activeAppId: app.englishId });
        console.log(`  ${app.englishId}: invalid fixture rejected and stale result cleared`);
      }
      await prepareInputs(page, app.englishId);
      await activateAction(page, action, app.englishId);
      console.log(`  ${app.englishId}: primary action executed`);
      await expect.poll(() => visibleResultLength(page), {
        message: `${app.englishId} visible calculation result`
      }).toBeGreaterThan(0);
      await expect(page.locator('[data-fr-transport-error]')).toHaveText('');
      if (app.englishId === 'car-import-cost') {
        await page.locator('[aria-controls="carImportTabFaq"]').click();
        await page.locator('#carImportAiQuestion').fill('Quels coûts dois-je confirmer ?');
        await page.getByRole('button', { name: 'Obtenir un conseil local (sans envoi)' }).click();
        await expect(page.locator('#carImportAiLog')).toContainText('Cette réponse ne quitte pas le navigateur');
      }
    }
    console.log(`  ${app.englishId}: workflow result ready`);
    await expectFrenchProductUi(page, app.englishId, 'rendered-result');
    const renderedResult = await visibleResultSnapshot(page);
    const calculatedFragments = exactCalculatedFragments(renderedResult);
    expect(
      calculatedFragments,
      `${app.englishId} rendered result exposes exact calculated output fragments`
    ).not.toEqual([]);

    await dismissCookieConsent(page);
    const txtPromise = page.waitForEvent('download', { timeout: 15000 });
    const txtButton = page.getByRole('button', { name: 'Télécharger le résumé TXT' });
    await txtButton.focus();
    await expect(txtButton).toBeFocused();
    await page.keyboard.press('Enter');
    const txt = await readDownload(await txtPromise, 'utf8');
    expect.soft(txt, `${app.englishId} TXT reopens with title`).toContain(app.name);
    expect.soft(txt, `${app.englishId} TXT reopens with boundary`).toContain('Limite: estimation de planification');
    for (const fragment of calculatedFragments) {
      expect.soft(
        txt.replace(/\s+/g, ' '),
        `${app.englishId} TXT preserves calculated output ${fragment}`
      ).toContain(fragment.replace(/\s+/g, ' '));
    }
    console.log(`  ${app.englishId}: TXT downloaded and reopened`);

    await dismissCookieConsent(page);
    const pdfPromise = page.waitForEvent('download', { timeout: 20000 });
    const pdfButton = page.getByRole('button', { name: 'Télécharger le PDF local' });
    await pdfButton.focus();
    await expect(pdfButton).toBeFocused();
    await page.keyboard.press('Enter');
    const pdfDownload = await pdfPromise;
    const pdf = await readDownload(pdfDownload);
    expect.soft(pdfDownload.suggestedFilename(), `${app.englishId} PDF filename`).toMatch(/\.pdf$/);
    expect.soft(pdf.subarray(0, 5).toString('ascii'), `${app.englishId} PDF reopens`).toBe('%PDF-');
    expect.soft(pdf.length, `${app.englishId} PDF content`).toBeGreaterThan(1000);
    const parsedPdf = await pdfParse(pdf);
    const parsedPdfText = normalizedPdfText(parsedPdf.text);
    expect.soft(parsedPdfText, `${app.englishId} parsed PDF title`).toContain(normalizedPdfText(app.name));
    expect.soft(parsedPdfText, `${app.englishId} parsed PDF boundary`).toContain('estimation de planification');
    for (const fragment of calculatedFragments) {
      expect.soft(
        parsedPdfText.replace(/\s+/g, ' '),
        `${app.englishId} parsed PDF preserves calculated output ${fragment}`
      ).toContain(normalizedPdfText(fragment).replace(/\s+/g, ' '));
    }
    console.log(`  ${app.englishId}: PDF downloaded, reopened and parsed`);

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme-choice', 'auto');
      document.documentElement.removeAttribute('data-theme');
    });
    await expectStrictReflow(page, app.frenchRoute, 'rendered-result-320', 320);
    await expectStrictReflow(page, app.frenchRoute, 'rendered-result-375', 375);

    if (staleAfterResultApps.has(app.englishId)) {
      const mutation = await mutateValidInputAfterResult(page, app.englishId);
      expect(mutation, `${app.englishId} has a valid post-result input mutation`).not.toBeNull();
      await expect(page.locator('[data-fr-transport-status]')).toContainText(
        'Saisies modifiées : relancez le calcul avant d’exporter.'
      );
      await expect(txtButton, `${app.englishId} stale TXT export disabled`).toBeDisabled();
      await expect(pdfButton, `${app.englishId} stale PDF export disabled`).toBeDisabled();
      expect(await visibleResultLength(page), `${app.englishId} stale result excluded from export payload`).toBe(0);
      await expectStrictReflow(page, app.frenchRoute, 'stale-result-375', 375);
      await prepareInputs(page, app.englishId);
      await activateAction(page, action, app.englishId);
      await expect.poll(() => visibleResultLength(page), {
        message: `${app.englishId} recalculates after a stale valid input change`
      }).toBeGreaterThan(0);
      await expect(txtButton, `${app.englishId} TXT export re-enabled after recalculation`).toBeEnabled();
      await expect(pdfButton, `${app.englishId} PDF export re-enabled after recalculation`).toBeEnabled();
    }

    const reopenedPage = await reopenContext.newPage();
    reopenedPage.on('pageerror', (error) => pageErrors.push(`${app.frenchRoute} reopen: ${error.message}`));
    reopenedPage.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(`${app.frenchRoute} reopen: ${message.text()}`);
    });
    await reopenedPage.route(/^https?:\/\//, (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') return route.continue();
      externalRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      const contentType = url.hostname === 'www.googletagmanager.com'
        ? 'application/javascript'
        : 'text/css';
      return route.fulfill({ status: 204, contentType, body: '' });
    });
    const reopenedResponse = await reopenedPage.goto(app.frenchRoute, { waitUntil: 'domcontentloaded' });
    expect.soft(reopenedResponse && reopenedResponse.status(), `${app.englishId} reopened route status`).toBe(200);
    await dismissCookieConsent(reopenedPage);
    await expectStrictReflow(reopenedPage, app.frenchRoute, 'new-context-reopen-375', 375);
    await reopenedPage.close();
    await page.close();
  }

  await reopenContext.close();
  expect(stateChangingRequests, 'all French workflows stay local').toEqual([]);
  expect(externalRequests.every((request) => (
    /^GET https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|www\.googletagmanager\.com)\//.test(request)
    || /^GET https:\/\/cdn\.jsdelivr\.net\/gh\/twitter\/twemoji@14\.0\.2\/assets\/svg\/[a-z0-9-]+\.svg$/.test(request)
    || request === 'GET https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
  )), `only consent/font/icon infrastructure may make external GET requests:\n${externalRequests.join('\n')}`).toBe(true);
  expect(pageErrors, 'all French workflows avoid runtime exceptions').toEqual([]);
  expect(consoleErrors, 'all French workflows avoid console errors').toEqual([]);
});

test('French Car Import dark theme keeps the full form surface at WCAG AA contrast', async ({ browser }, testInfo) => {
  test.setTimeout(2 * 60 * 1000);
  const route = '/fr/tools/cout-importation-voiture/';
  for (let run = 1; run <= 3; run += 1) {
    const context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      viewport: { width: 320, height: 900 }
    });
    const page = await context.newPage();
    await page.goto(route, { waitUntil: 'networkidle' });
    await dismissCookieConsent(page);
    await page.locator('details.car-import-advanced').evaluate((details) => { details.open = true; });

    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 900 });

      for (const theme of ['light', 'dark', 'auto']) {
        await setCarImportTheme(page, theme);
        const measured = await measureCarImportContrast(page);
        expect(measured.advancedLabels, `run ${run} ${width}px ${theme} has all advanced labels`)
          .toHaveLength(13);
        expect(
          measured.advancedLabels.filter((label) => label.ratio < 4.5),
          `run ${run} ${width}px ${theme} advanced-label failures:\n${JSON.stringify(measured.advancedLabels, null, 2)}`
        ).toEqual([]);
        expect(
          measured.directTextFailures,
          `run ${run} ${width}px ${theme} direct text contrast failures:\n${JSON.stringify(measured.directTextFailures, null, 2)}`
        ).toEqual([]);

        if (theme === 'light') {
          expect(measured.panelBackground, `run ${run} ${width}px light form surface`)
            .toBe('rgb(255, 255, 255)');
          expect(measured.heading, `run ${run} ${width}px light heading is unchanged`).toEqual({
            color: 'rgb(16, 32, 51)',
            background: 'rgb(255, 255, 255)',
            ratio: 16.45
          });
          expect(measured.help.color, `run ${run} ${width}px light help text uses the AA-muted token`)
            .toBe('rgb(100, 116, 139)');
          expect(measured.cta, `run ${run} ${width}px light hero CTA is unchanged`).toEqual({
            color: 'rgb(15, 39, 64)',
            background: 'rgb(255, 255, 255)',
            ratio: 15.17
          });
        } else {
          expect(measured.panelBackground, `run ${run} ${width}px ${theme} form surface is not white`)
            .not.toBe('rgb(255, 255, 255)');
          expect(measured.heading.ratio, `run ${run} ${width}px ${theme} heading contrast`)
            .toBeGreaterThanOrEqual(4.5);
          expect(measured.help.ratio, `run ${run} ${width}px ${theme} help contrast`)
            .toBeGreaterThanOrEqual(4.5);
          expect(measured.cta.ratio, `run ${run} ${width}px ${theme} hero CTA contrast`)
            .toBeGreaterThanOrEqual(4.5);
        }
      }
    }

    await context.close();
  }
});

test('French Car Import manual dark switch advertises readiness only after the quick cards repaint', async ({ browser }, testInfo) => {
  test.setTimeout(2 * 60 * 1000);
  const route = '/fr/tools/cout-importation-voiture/';

  for (const width of [320, 375]) {
    const context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      colorScheme: 'light',
      reducedMotion: 'reduce',
      viewport: { width, height: 900 }
    });
    const page = await context.newPage();
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await dismissCookieConsent(page);
    const body = page.locator('body');
    await expect(body).toHaveAttribute('data-fr-transport-theme-ready', 'true');
    await expect(body).toHaveAttribute('data-fr-transport-active-theme', 'light');
    await expect(page.locator('afro-navbar #mobThemeToggle')).toBeAttached();

    const readyAtThemeChange = await page.evaluate(async () => {
      const observed = new Promise((resolve) => {
        document.addEventListener('afrotools:theme-change', (event) => {
          if (event.detail && event.detail.activeTheme === 'dark') {
            resolve(document.body.getAttribute('data-fr-transport-theme-ready'));
          }
        }, { once: true });
      });
      const navbar = document.querySelector('afro-navbar');
      navbar.shadowRoot.getElementById('mobThemeToggle').click();
      return observed;
    });

    expect(readyAtThemeChange, `${width}px readiness is cleared synchronously during manual dark switch`)
      .toBeNull();
    await expect(body).toHaveAttribute('data-fr-transport-theme-ready', 'true');
    await expect(body).toHaveAttribute('data-fr-transport-active-theme', 'dark');
    await expect(body).toHaveAttribute('data-fr-transport-theme-state', 'ready');

    const measured = await measureCarImportContrast(page);
    expect(
      measured.directTextFailures,
      `${width}px manual-dark direct text contrast failures:\n${JSON.stringify(measured.directTextFailures, null, 2)}`
    ).toEqual([]);
    const quickCardColors = await page.locator('.car-import-quick-card').evaluateAll((cards) => cards.map((card) => {
      const eyebrow = card.querySelector('.car-import-quick-eyebrow');
      const vehicle = card.querySelector('strong');
      const source = card.querySelector('span:not(.car-import-quick-eyebrow)');
      return {
        background: getComputedStyle(card).backgroundColor,
        eyebrow: getComputedStyle(eyebrow).color,
        vehicle: getComputedStyle(vehicle).color,
        source: getComputedStyle(source).color
      };
    }));
    expect(quickCardColors, `${width}px manual-dark quick-card theme tokens`).toEqual(
      Array.from({ length: 6 }, () => ({
        background: 'rgb(23, 38, 61)',
        eyebrow: 'rgb(110, 231, 183)',
        vehicle: 'rgb(238, 245, 255)',
        source: 'rgb(184, 199, 220)'
      }))
    );

    await context.close();
  }
});

test('French Car Import keeps every advertised action local, explicit and reopenable', async ({ browser }, testInfo) => {
  test.setTimeout(6 * 60 * 1000);
  const route = '/fr/tools/cout-importation-voiture/';
  const appName = parity.apps.find((app) => app.englishId === 'car-import-cost').name;
  const baseURL = testInfo.project.use.baseURL;
  const transport = [];
  const pendingRequestHeaders = [];
  const consoleMessages = [];
  const pageErrors = [];
  const sensitiveTokens = [
    'PrivMakeZXQ',
    'PrivModelZXQ',
    'PrivTrimZXQ',
    '98765',
    '65432',
    '76543'
  ];
  const context = await browser.newContext({
    baseURL,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    viewport: { width: 320, height: 900 }
  });
  context.on('request', (request) => {
    const record = {
      method: request.method(),
      url: request.url(),
      postData: request.postData(),
      headers: {}
    };
    transport.push(record);
    const pending = request.allHeaders()
      .then((headers) => { record.headers = headers; })
      .catch((error) => { record.headers = { captureError: error.message }; });
    pendingRequestHeaders.push(pending);
  });
  await context.route(/^https?:\/\//, (intercepted) => {
    const url = new URL(intercepted.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      return intercepted.continue();
    }
    const resourceType = intercepted.request().resourceType();
    const contentType = resourceType === 'script'
      ? 'application/javascript'
      : resourceType === 'stylesheet'
        ? 'text/css'
        : 'text/plain';
    return intercepted.fulfill({ status: 204, contentType, body: '' });
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('afrotools_cookie_consent', 'accepted');
      localStorage.setItem('carImportCostLastInput', JSON.stringify({
        make: 'ImplicitRaceSeed',
        model: 'MustNeverRestore',
        purchasePriceUsd: 112233
      }));
    } catch (error) {
      // The product test still validates the storage-unavailable path.
    }
    window.__carImportCapturedGtag = [];
    window.gtag = (...args) => window.__carImportCapturedGtag.push(args);
    window.__carImportPrintCount = 0;
    window.print = () => { window.__carImportPrintCount += 1; };
    try {
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: undefined
      });
    } catch (error) {
      // Chromium currently exposes no share implementation in this context.
    }
  });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  const page = await context.newPage();
  page.on('console', (message) => {
    consoleMessages.push({
      type: message.type(),
      text: message.text(),
      location: message.location()
    });
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
  expect(response && response.status(), 'Car Import route responds').toBe(200);
  await expect(page.locator('#carImportForm')).toBeVisible();
  await expect(page.locator('#carImportResults')).toBeVisible();
  await expect(page.locator('#carImportCloudSave'), 'unsupported cloud-save action is not advertised').toHaveCount(0);
  await expectActionControlsState(
    page.locator('#carImportPdf,#carImportCsv,#carImportPrint,#carImportShare,#carImportSaveLocal'),
    false,
    'native actions start disabled until an explicit calculation'
  );
  await expect.poll(() => page.evaluate(() => ({
    search: location.search,
    hash: location.hash,
    draft: localStorage.getItem('carImportCostLastInput')
  })), { message: 'async native initialization cannot restore query/hash or implicit draft' }).toEqual({
    search: '',
    hash: '',
    draft: null
  });
  await expectStrictReflow(page, route, 'privacy-initial-320', 320);
  await expectStrictReflow(page, route, 'privacy-initial-375', 375);

  let snapshot = await captureCarImportPrivacySnapshot(
    page,
    context,
    transport,
    consoleMessages,
    pendingRequestHeaders
  );
  expectCarImportPrivacy(snapshot, 'before input', sensitiveTokens);

  await page.locator('details.car-import-advanced').evaluate((details) => { details.open = true; });
  const syntheticValues = {
    '#carImportMake': 'PrivMakeZXQ',
    '#carImportModel': 'PrivModelZXQ',
    '#carImportTrim': 'PrivTrimZXQ',
    '#carImportYear': '2019',
    '#carImportMileage': '65432',
    '#carImportPurchasePrice': '98765',
    '#carImportCustomsValue': '76543',
    '#carImportDownPayment': '37',
    '#carImportApr': '19',
    '#carImportFinanceMonths': '48'
  };
  for (const [selector, value] of Object.entries(syntheticValues)) {
    await page.locator(selector).fill(value);
  }
  await page.locator('#carImportCountry').selectOption('NG');
  await page.locator('#carImportSourceMarket').selectOption('japan');
  await page.locator('#carImportDestinationCity').selectOption({ index: 0 });
  snapshot = await captureCarImportPrivacySnapshot(
    page,
    context,
    transport,
    consoleMessages,
    pendingRequestHeaders
  );
  expectCarImportPrivacy(snapshot, 'after input', sensitiveTokens);
  expect(snapshot.browserState.savedQuotes, 'input alone does not create an explicit saved quote').toBeNull();

  const calculate = page.locator('#carImportForm button[type="submit"]').first();
  await calculate.focus();
  await expect(calculate).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#carImportTotal')).not.toHaveText('USD 0');
  const nativeActions = page.locator(
    '#carImportPdf,#carImportCsv,#carImportPrint,#carImportShare,#carImportSaveLocal'
  );
  await expectActionControlsState(nativeActions, true, 'native actions enable after explicit calculation');
  await expect(page.locator('[data-fr-transport-download-text]')).toBeEnabled();
  await expect(page.locator('[data-fr-transport-download-pdf]')).toBeEnabled();
  await expectStrictReflow(page, route, 'privacy-result-320', 320);
  await expectStrictReflow(page, route, 'privacy-result-375', 375);
  snapshot = await captureCarImportPrivacySnapshot(
    page,
    context,
    transport,
    consoleMessages,
    pendingRequestHeaders
  );
  expectCarImportPrivacy(snapshot, 'after calculation', sensitiveTokens);
  expect(snapshot.browserState.savedQuotes, 'calculation does not implicitly save the quote').toBeNull();

  const csvPromise = page.waitForEvent('download', { timeout: 20000 });
  await page.locator('#carImportCsv').click();
  const csvDownload = await csvPromise;
  const csvText = await readDownload(csvDownload, 'utf8');
  const csvRows = parseCsvRows(csvText);
  expect(csvDownload.suggestedFilename()).toMatch(/\.csv$/);
  expect(csvRows[0]).toEqual(['section', 'label', 'amount_usd']);
  expect(csvRows.some((row) => row[0] === 'total' && row[1] === 'on-road' && Number(row[2]) > 0))
    .toBe(true);
  snapshot = await captureCarImportPrivacySnapshot(
    page,
    context,
    transport,
    consoleMessages,
    pendingRequestHeaders
  );
  expectCarImportPrivacy(snapshot, 'after native CSV', sensitiveTokens);

  const nativePdfPromise = page.waitForEvent('download', { timeout: 20000 });
  await page.locator('#carImportPdf').click();
  const nativePdfDownload = await nativePdfPromise;
  const nativePdf = await readDownload(nativePdfDownload);
  const nativePdfText = normalizedPdfText((await pdfParse(nativePdf)).text);
  expect(nativePdfDownload.suggestedFilename()).toMatch(/\.pdf$/);
  expect(nativePdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  expect(nativePdfText).toContain(normalizedPdfText(appName));
  expect(nativePdfText).toContain('estimation de planification');
  snapshot = await captureCarImportPrivacySnapshot(
    page,
    context,
    transport,
    consoleMessages,
    pendingRequestHeaders
  );
  expectCarImportPrivacy(snapshot, 'after native PDF', sensitiveTokens);

  const textPromise = page.waitForEvent('download', { timeout: 20000 });
  await page.locator('[data-fr-transport-download-text]').click();
  const textDownload = await textPromise;
  const textReport = await readDownload(textDownload, 'utf8');
  expect(textDownload.suggestedFilename()).toMatch(/\.txt$/);
  expect(textReport).toContain(appName);
  expect(textReport).toContain('PrivMakeZXQ');
  expect(textReport).toContain('Limite: estimation de planification');
  snapshot = await captureCarImportPrivacySnapshot(
    page,
    context,
    transport,
    consoleMessages,
    pendingRequestHeaders
  );
  expectCarImportPrivacy(snapshot, 'after local TXT', sensitiveTokens);

  const localPdfPromise = page.waitForEvent('download', { timeout: 20000 });
  await page.locator('[data-fr-transport-download-pdf]').click();
  const localPdfDownload = await localPdfPromise;
  const localPdf = await readDownload(localPdfDownload);
  const localPdfText = normalizedPdfText((await pdfParse(localPdf)).text);
  expect(localPdfDownload.suggestedFilename()).toMatch(/\.pdf$/);
  expect(localPdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  expect(localPdfText).toContain(normalizedPdfText(appName));
  expect(localPdfText).toContain('estimation de planification');
  snapshot = await captureCarImportPrivacySnapshot(
    page,
    context,
    transport,
    consoleMessages,
    pendingRequestHeaders
  );
  expectCarImportPrivacy(snapshot, 'after local PDF', sensitiveTokens);

  await page.locator('#carImportPrint').click();
  snapshot = await captureCarImportPrivacySnapshot(
    page,
    context,
    transport,
    consoleMessages,
    pendingRequestHeaders
  );
  expect(snapshot.browserState.printCount, 'Print invokes the local browser print action').toBe(1);
  expectCarImportPrivacy(snapshot, 'after Print', sensitiveTokens);

  await page.locator('#carImportShare').click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(sharedUrl).toBe(`${baseURL}${route}`);
  snapshot = await captureCarImportPrivacySnapshot(
    page,
    context,
    transport,
    consoleMessages,
    pendingRequestHeaders
  );
  expectCarImportPrivacy(snapshot, 'after Share', sensitiveTokens);

  await page.locator('[aria-controls="carImportTabFaq"]').click();
  await page.locator('#carImportAiQuestion').fill('PrivQuestionZXQ');
  await page.locator('#carImportAskAi').click();
  await expect(page.locator('#carImportAiLog')).toContainText('Cette réponse ne quitte pas le navigateur');
  snapshot = await captureCarImportPrivacySnapshot(
    page,
    context,
    transport,
    consoleMessages,
    pendingRequestHeaders
  );
  expectCarImportPrivacy(snapshot, 'after local advice', [...sensitiveTokens, 'PrivQuestionZXQ']);
  expect(transport.some((request) => request.url.includes('/.netlify/functions/ai-advisor'))).toBe(false);

  await page.locator('#carImportSaveLocal').click();
  snapshot = await captureCarImportPrivacySnapshot(
    page,
    context,
    transport,
    consoleMessages,
    pendingRequestHeaders
  );
  expectCarImportPrivacy(snapshot, 'after explicit Save', sensitiveTokens, {
    allowExplicitSavedQuote: true
  });
  const savedQuotes = JSON.parse(snapshot.browserState.savedQuotes);
  expect(savedQuotes).toHaveLength(1);
  expect(savedQuotes[0].result.input.make).toBe('PrivMakeZXQ');
  expect(savedQuotes[0].result.input.purchasePriceUsd).toBe(98765);
  await expectStrictReflow(page, route, 'privacy-save-320', 320);
  await expectStrictReflow(page, route, 'privacy-save-375', 375);

  await page.locator('#carImportPurchasePrice').fill('98766');
  await expect(page.locator('[data-fr-transport-status]')).toContainText(
    'Saisies modifiées : relancez le calcul avant d’exporter.'
  );
  await expectActionControlsState(nativeActions, false, 'valid mutation disables every native result action');
  await expect(page.locator('[data-fr-transport-download-text]')).toBeDisabled();
  await expect(page.locator('[data-fr-transport-download-pdf]')).toBeDisabled();
  expect(await visibleResultLength(page), 'valid mutation removes stale result from export payload').toBe(0);

  await page.locator('#carImportPurchasePrice').fill('-1');
  await calculate.click();
  await expect(page.locator('[data-fr-transport-error]')).toContainText('Corrigez les champs invalides');
  await expect(page.locator('#carImportResults')).toBeHidden();
  const reset = page.locator('#carImportReset');
  await expect(reset).toBeVisible();
  await expect(reset).toHaveAccessibleName('Réinitialiser');
  await reset.click();
  await expect(page.locator('[data-fr-transport-status]')).toContainText('Estimation réinitialisée');
  await expect(page.locator('[data-fr-transport-error]')).toBeEmpty();
  await expect(page.locator('#carImportResults')).toBeHidden();
  await expect(page.locator('#carImportMake')).toHaveValue('');
  await expect(page.locator('#carImportModel')).toHaveValue('');
  await expect(page.locator('#carImportPurchasePrice')).toHaveValue('');
  await expect(page.locator('#carImportCustomsValue')).toHaveValue('');
  await expect(page.locator('#carImportCountry')).toHaveValue('NG');
  await expect(page.locator('#carImportSourceMarket')).toHaveValue('japan');
  await expectActionControlsState(nativeActions, false, 'reset keeps every stale native result action disabled');
  await expect(page.locator('[data-fr-transport-download-text]')).toBeDisabled();
  await expect(page.locator('[data-fr-transport-download-pdf]')).toBeDisabled();
  expect(await visibleResultLength(page), 'reset removes stale result from every export payload').toBe(0);
  await expectStrictReflow(page, route, 'privacy-invalid-reset-320', 320);
  await expectStrictReflow(page, route, 'privacy-invalid-reset-375', 375);
  snapshot = await captureCarImportPrivacySnapshot(
    page,
    context,
    transport,
    consoleMessages,
    pendingRequestHeaders
  );
  expectCarImportPrivacy(snapshot, 'after invalid to reset', sensitiveTokens, {
    allowExplicitSavedQuote: true
  });
  expect(snapshot.browserState.sessionStorage.carImportCostLastInput).toBeUndefined();
  expect(JSON.parse(snapshot.browserState.savedQuotes), 'reset preserves only the explicit saved quote')
    .toHaveLength(1);

  for (const [selector, value] of Object.entries(syntheticValues)) {
    await page.locator(selector).fill(value);
  }
  await page.locator('#carImportCountry').selectOption('NG');
  await page.locator('#carImportSourceMarket').selectOption('japan');
  await page.locator('#carImportDestinationCity').selectOption({ index: 0 });
  await calculate.click();
  await expect(page.locator('#carImportResults')).toBeVisible();
  await expectActionControlsState(nativeActions, true, 'native actions re-enable after recalculation');

  expect(pageErrors, 'focused Car Import workflow has no page errors').toEqual([]);
  expect(consoleMessages.filter((entry) => entry.type === 'error'), 'focused Car Import has no console errors')
    .toEqual([]);

  const reopenTransport = [];
  const reopenHeaders = [];
  const reopenConsole = [];
  const reopenContext = await browser.newContext({
    baseURL,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    viewport: { width: 320, height: 900 }
  });
  reopenContext.on('request', (request) => {
    const record = {
      method: request.method(),
      url: request.url(),
      postData: request.postData(),
      headers: {}
    };
    reopenTransport.push(record);
    const pending = request.allHeaders()
      .then((headers) => { record.headers = headers; })
      .catch((error) => { record.headers = { captureError: error.message }; });
    reopenHeaders.push(pending);
  });
  await reopenContext.route(/^https?:\/\//, (intercepted) => {
    const url = new URL(intercepted.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      return intercepted.continue();
    }
    return intercepted.fulfill({ status: 204, contentType: 'text/plain', body: '' });
  });
  const reopenedPage = await reopenContext.newPage();
  reopenedPage.on('console', (message) => {
    reopenConsole.push({ type: message.type(), text: message.text(), location: message.location() });
  });
  const reopenedResponse = await reopenedPage.goto(route, { waitUntil: 'domcontentloaded' });
  expect(reopenedResponse && reopenedResponse.status(), 'separate-context reopen responds').toBe(200);
  await expect(reopenedPage.locator('#carImportForm')).toBeVisible();
  await expectStrictReflow(reopenedPage, route, 'privacy-separate-context-reopen-320', 320);
  await expectStrictReflow(reopenedPage, route, 'privacy-separate-context-reopen-375', 375);
  const reopenedSnapshot = await captureCarImportPrivacySnapshot(
    reopenedPage,
    reopenContext,
    reopenTransport,
    reopenConsole,
    reopenHeaders
  );
  expectCarImportPrivacy(reopenedSnapshot, 'genuinely separate context reopen', sensitiveTokens);
  expect(reopenedSnapshot.browserState.savedQuotes, 'explicit save does not cross browser contexts').toBeNull();

  await reopenContext.close();
  await context.close();
});
