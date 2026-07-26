#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'artifacts', 'day5-language-release-audit');
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4187';
const REVIEWED_ON = '2026-07-26';

const CLASSIFICATION = Object.freeze({
  'swahili-translator': 'local-phrasebook-first-with-explicit-cloud-consent',
  'yoruba-translator': 'local-phrasebook-first-with-explicit-cloud-consent',
  'hausa-translator': 'local-phrasebook-first-with-explicit-cloud-consent',
  'igbo-translator': 'local-phrasebook-first-with-explicit-cloud-consent',
  'amharic-translator': 'local-phrasebook-first-with-explicit-cloud-consent',
  'zulu-translator': 'local-phrasebook-first-with-explicit-cloud-consent',
  'pidgin-translator': 'local-phrasebook-first-with-explicit-cloud-consent',
  'french-african': 'local-phrasebook-first-with-explicit-cloud-consent',
  'arabic-calc': 'deterministic-local-only',
  transliterate: 'deterministic-local-only',
  'african-name-meaning': 'provenance-lookup'
});

const INPUT_CONFIG = Object.freeze({
  'swahili-translator': { input: '#translateInput', button: '#translateBtn', output: '#translateOutput' },
  'yoruba-translator': { input: '#translateInput', button: '#translateBtn', output: '#translateOutput' },
  'hausa-translator': { input: '#translateInput', button: '#translateBtn', output: '#translateOutput' },
  'igbo-translator': { input: '#translateInput', button: '#translateBtn', output: '#translateOutput' },
  'amharic-translator': { input: '#translateInput', button: '#translateBtn', output: '#translateOutput' },
  'zulu-translator': { input: '#translateInput', button: '#translateBtn', output: '#translateOutput' },
  'french-african': { input: '#translateInput', button: '#translateBtn', output: '#translateOutput' },
  'pidgin-translator': {
    input: '#srcText',
    button: '#translateBtn',
    output: '#tgtOutput',
    prepare: async function (page) {
      await page.evaluate(function () {
        if (typeof window.switchTab === 'function') window.switchTab('translate');
      });
    }
  },
  'arabic-calc': { input: '#numInput', raw: '20260726', output: '#result' },
  transliterate: { input: '#input', raw: 'amani', output: '#output' },
  'african-name-meaning': { input: '#searchInput', raw: 'Amani', output: '#results' }
});

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function deriveEnglishLanguageRoutes(registrySource) {
  return registrySource.split(/\r?\n/)
    .filter(function (line) {
      return line.includes("category: 'language'") && !/\blang:\s*'/.test(line);
    })
    .map(function (line) {
      const id = line.match(/\{\s*id:\s*'([^']+)'/);
      const name = line.match(/\bname:\s*'([^']+)'/);
      const href = line.match(/\bhref:\s*'([^']+)'/);
      const status = line.match(/\bstatus:\s*'([^']+)'/);
      if (!id || !name || !href || !status) throw new Error('Unable to parse language registry row: ' + line);
      return {
        id: id[1],
        name: name[1],
        route: href[1],
        status: status[1],
        classification: CLASSIFICATION[id[1]] || 'unclassified'
      };
    });
}

function routeFile(route) {
  const clean = route.replace(/^\/|\/$/g, '');
  const directoryIndex = path.join(ROOT, clean, 'index.html');
  if (fs.existsSync(directoryIndex)) return directoryIndex;
  const flat = path.join(ROOT, clean + '.html');
  return fs.existsSync(flat) ? flat : directoryIndex;
}

function metaContent(source, name) {
  const pattern = new RegExp('<meta\\s+name=["\\\']' + name + '["\\\'][^>]*content=["\\\']([^"\\\']*)', 'i');
  const reverse = new RegExp('<meta\\s+content=["\\\']([^"\\\']*)["\\\'][^>]*name=["\\\']' + name + '["\\\']', 'i');
  const match = source.match(pattern) || source.match(reverse);
  return match ? match[1].trim() : '';
}

function canonicalHref(source) {
  const pattern = /<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)/i;
  const reverse = /<link\s+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i;
  const match = source.match(pattern) || source.match(reverse);
  return match ? match[1].trim() : '';
}

function pageTitle(source) {
  const match = source.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/\s+/g, ' ').trim() : '';
}

function staticRouteAudit(route) {
  const file = routeFile(route.route);
  const exists = fs.existsSync(file);
  const source = exists ? fs.readFileSync(file, 'utf8') : '';
  const title = pageTitle(source);
  const description = metaContent(source, 'description');
  const canonical = canonicalHref(source);
  const expectedCanonical = 'https://afrotools.com' + route.route;
  const hasGoogleFontReference = /fonts\.(?:googleapis|gstatic)\.com/i.test(source);
  const routeClientFile = path.join(ROOT, 'tools', route.id, 'translator-vip.js');
  const routeClientSource = fs.existsSync(routeClientFile) ? fs.readFileSync(routeClientFile, 'utf8') : '';
  const classificationChecks = [];

  if (route.classification === 'local-phrasebook-first-with-explicit-cloud-consent') {
    classificationChecks.push({
      id: 'consent-helper-present',
      pass: source.includes('/assets/js/lib/external-translation-consent.js')
    });
    classificationChecks.push({
      id: 'cloud-client-or-route-consent-wiring',
      pass: source.includes('/assets/js/lib/live-translate.js') ||
        /ExternalTranslationConsent|consent\.requireConsent/.test(source + '\n' + routeClientSource)
    });
  } else {
    classificationChecks.push({
      id: 'no-shared-cloud-translation-client',
      pass: !source.includes('/assets/js/lib/live-translate.js') &&
        !source.includes('/assets/js/lib/external-translation-consent.js') &&
        !/['"]\/api\/translate/.test(source)
    });
  }
  if (route.classification === 'provenance-lookup') {
    classificationChecks.push({
      id: 'lookup-provenance-language',
      pass: /\bmeaning\b/i.test(source) && /\b(origin|language|culture)\b/i.test(source)
    });
  }

  return {
    file: path.relative(ROOT, file).replace(/\\/g, '/'),
    exists,
    title: { value: title, pass: title.length >= 20 && title.length <= 65, length: title.length },
    description: {
      value: description,
      pass: description.length >= 70 && description.length <= 170,
      length: description.length
    },
    canonical: { value: canonical, expected: expectedCanonical, pass: canonical === expectedCanonical },
    localTypography: { pass: !hasGoogleFontReference, googleFontReference: hasGoogleFontReference },
    classificationChecks
  };
}

function acceptedSurfaceAudit(routes) {
  const hub = readText('language/index.html');
  const consent = readText('assets/js/lib/external-translation-consent.js');
  const liveTranslate = readText('assets/js/lib/live-translate.js');
  const cardIds = Array.from(hub.matchAll(/data-tool-id="([^"]+)"/g)).map(function (match) { return match[1]; });
  const hrefs = Array.from(hub.matchAll(/<article class="lh-card"[\s\S]*?<a href="([^"]+)"/g))
    .map(function (match) { return match[1]; });
  const routeIds = routes.map(function (route) { return route.id; });
  const routeHrefs = routes.map(function (route) { return route.route; });
  const checks = [
    {
      id: 'hub-static-inventory-ids',
      pass: cardIds.length === routes.length &&
        routeIds.every(function (id) { return cardIds.includes(id); })
    },
    {
      id: 'hub-static-inventory-routes',
      pass: hrefs.length === routes.length &&
        routeHrefs.every(function (href) { return hrefs.includes(href); })
    },
    {
      id: 'hub-one-main',
      pass: (hub.match(/<main\b/g) || []).length === 1 && (hub.match(/<\/main>/g) || []).length === 1
    },
    {
      id: 'hub-no-google-font-reference',
      pass: !/fonts\.(?:googleapis|gstatic)\.com/i.test(hub)
    },
    {
      id: 'hub-consent-and-fail-closed-copy',
      pass: /Local phrasebook first/i.test(hub) &&
        /explicit opt-in for that page session/i.test(hub) &&
        /Fail-closed/i.test(hub)
    },
    {
      id: 'foundation-session-only-state',
      pass: /var state = Object\.create\(null\)/.test(consent) &&
        !/localStorage\.setItem|sessionStorage\.setItem|indexedDB/i.test(consent)
    },
    {
      id: 'foundation-no-persistent-raw-text',
      pass: /memoryCache = new Map\(\)/.test(liveTranslate) &&
        !/localStorage|sessionStorage|indexedDB/i.test(liveTranslate) &&
        /cache:\s*['"]no-store['"]/.test(liveTranslate)
    },
    {
      id: 'foundation-explicit-consent-gate',
      pass: /requireConsent/.test(consent) &&
        /CONSENT_HEADER/.test(consent) &&
        /hasConsent/.test(consent)
    }
  ];
  return { checks, pass: checks.every(function (check) { return check.pass; }) };
}

async function isServerReady(baseUrl) {
  try {
    const response = await fetch(baseUrl + '/language/');
    return response.ok;
  } catch (_) {
    return false;
  }
}

async function startServerIfNeeded(baseUrl) {
  if (await isServerReady(baseUrl)) return { process: null, reused: true };
  const parsed = new URL(baseUrl);
  const child = spawn(process.execPath, ['tests/support/static-server.js'], {
    cwd: ROOT,
    env: Object.assign({}, process.env, { PORT: parsed.port || '4187' }),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  let stderr = '';
  child.stderr.on('data', function (chunk) { stderr += chunk.toString(); });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await isServerReady(baseUrl)) return { process: child, reused: false };
    if (child.exitCode !== null) throw new Error('Static server exited early: ' + stderr);
    await new Promise(function (resolve) { setTimeout(resolve, 100); });
  }
  child.kill();
  throw new Error('Static server did not become ready at ' + baseUrl);
}

function storageSnapshotScript(tokens) {
  function values(storage) {
    const result = [];
    try {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        result.push({ key: key, value: storage.getItem(key) });
      }
    } catch (error) {
      result.push({ key: '__storage_error__', value: String(error && error.message || error) });
    }
    return result;
  }
  const local = values(localStorage);
  const session = values(sessionStorage);
  const combined = JSON.stringify({ local: local, session: session });
  return {
    local: local,
    session: session,
    url: location.href,
    leaks: tokens.filter(function (token) {
      return token && (
        combined.includes(token) ||
        location.href.includes(token) ||
        location.href.includes(encodeURIComponent(token))
      );
    })
  };
}

function bodyDarkMetricsScript() {
  function rgba(value) {
    const numbers = String(value).match(/[\d.]+/g);
    return numbers ? numbers.slice(0, 3).map(Number) : [255, 255, 255];
  }
  function channel(value) {
    const part = value / 255;
    return part <= 0.04045 ? part / 12.92 : Math.pow((part + 0.055) / 1.055, 2.4);
  }
  function luminance(rgb) {
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  }
  const body = getComputedStyle(document.body);
  const html = getComputedStyle(document.documentElement);
  let background = rgba(body.backgroundColor);
  if (String(body.backgroundColor).includes('0, 0, 0, 0')) background = rgba(html.backgroundColor);
  const foreground = rgba(body.color);
  const backgroundLuminance = luminance(background);
  const foregroundLuminance = luminance(foreground);
  const contrast = (Math.max(backgroundLuminance, foregroundLuminance) + 0.05) /
    (Math.min(backgroundLuminance, foregroundLuminance) + 0.05);
  return {
    background: background,
    foreground: foreground,
    backgroundLuminance: Number(backgroundLuminance.toFixed(3)),
    contrast: Number(contrast.toFixed(2))
  };
}

async function settle(page) {
  await page.evaluate(function () {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () { requestAnimationFrame(resolve); });
    });
  });
}

async function auditPrivacy(page, route, traffic) {
  const config = INPUT_CONFIG[route.id];
  if (!config) return { pass: false, reason: 'missing-input-config' };
  if (config.prepare) await config.prepare(page);
  const input = page.locator(config.input).first();
  await input.waitFor({ state: 'visible', timeout: 2000 }).catch(function () {});
  if (!await input.count() || !await input.isVisible()) {
    return { pass: false, reason: 'primary-input-not-visible', selector: config.input };
  }
  const raw = config.raw || 'AT_PRIVATE_' + route.id.replace(/-/g, '_') + '_20260726';
  const outputToken = 'AT_OUTPUT_' + route.id.replace(/-/g, '_') + '_20260726';
  await input.fill(raw);
  await input.press('Enter').catch(function () {});
  await settle(page);

  const preConsentRequests = traffic.translationRequests.length;
  let explicitConsentWorked = null;
  let outputSeen = null;

  if (route.classification === 'local-phrasebook-first-with-explicit-cloud-consent') {
    const consent = page.locator('[data-external-translation-accept]').first();
    const button = page.locator(config.button).first();
    if (!await consent.count() || !await consent.isVisible()) {
      return {
        pass: false,
        reason: 'explicit-consent-control-missing',
        preConsentTranslationRequests: preConsentRequests
      };
    }
    await consent.check();
    if (!await button.count()) {
      return {
        pass: false,
        reason: 'cloud-translation-button-missing',
        preConsentTranslationRequests: preConsentRequests
      };
    }
    await button.click();
    await page.waitForFunction(function (expected) {
      const node = document.querySelector(expected.selector);
      return Boolean(node && String(node.textContent || '').includes(expected.token));
    }, {
      selector: config.output,
      token: outputToken
    }, { timeout: 5000 }).catch(function () {});
    explicitConsentWorked = traffic.translationRequests.length === preConsentRequests + 1;
    outputSeen = await page.locator(config.output).first().textContent()
      .then(function (text) { return String(text || '').includes(outputToken); })
      .catch(function () { return false; });
  }

  const tokens = [raw, outputToken];
  const storage = await page.evaluate(storageSnapshotScript, tokens);
  const analyticsText = JSON.stringify(traffic.analyticsRequests);
  const analyticsLeaks = tokens.filter(function (token) {
    return analyticsText.includes(token) || analyticsText.includes(encodeURIComponent(token));
  });
  const noUnexpectedTranslationRequest = route.classification === 'local-phrasebook-first-with-explicit-cloud-consent'
    ? preConsentRequests === 0
    : traffic.translationRequests.length === 0;
  const pass = noUnexpectedTranslationRequest &&
    storage.leaks.length === 0 &&
    analyticsLeaks.length === 0 &&
    (explicitConsentWorked === null || explicitConsentWorked === true) &&
    (outputSeen === null || outputSeen === true);

  return {
    pass,
    rawFixture: raw,
    preConsentTranslationRequests: preConsentRequests,
    totalTranslationRequests: traffic.translationRequests.length,
    explicitConsentWorked,
    syntheticOutputSeen: outputSeen,
    storageOrUrlLeaks: storage.leaks,
    analyticsLeaks
  };
}

async function browserRouteAudit(browser, route, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 320, height: 812 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    serviceWorkers: 'block'
  });
  const page = await context.newPage();
  const traffic = {
    googleFontRequests: [],
    translationRequests: [],
    analyticsRequests: [],
    local404s: [],
    requestFailures: [],
    consoleErrors: [],
    pageErrors: []
  };
  const analyticsPattern = /google-analytics|googletagmanager|clarity|\/analytics(?:[/?]|$)|\/api\/(?:track|events?)/i;
  const baseOrigin = new URL(baseUrl).origin;
  await context.route('**/*', async function (handledRoute) {
    const request = handledRoute.request();
    const url = request.url();
    if (/^https?:/i.test(url) && new URL(url).origin !== baseOrigin) {
      const resourceType = request.resourceType();
      const contentTypes = {
        stylesheet: 'text/css',
        script: 'application/javascript',
        image: 'image/svg+xml',
        font: 'font/woff2'
      };
      await handledRoute.fulfill({
        status: 200,
        contentType: contentTypes[resourceType] || 'text/plain',
        body: resourceType === 'image'
          ? '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'
          : ''
      });
      return;
    }
    await handledRoute.continue();
  });

  page.on('console', function (message) {
    if (message.type() === 'error') traffic.consoleErrors.push(message.text());
  });
  page.on('pageerror', function (error) { traffic.pageErrors.push(error.message); });
  page.on('requestfailed', function (request) {
    const failure = request.failure();
    traffic.requestFailures.push({ url: request.url(), error: failure && failure.errorText || 'unknown' });
  });
  page.on('request', function (request) {
    const url = request.url();
    if (/fonts\.(?:googleapis|gstatic)\.com/i.test(url)) traffic.googleFontRequests.push(url);
    if (analyticsPattern.test(url)) {
      traffic.analyticsRequests.push({ url: url, body: request.postData() || '' });
    }
  });
  page.on('response', function (response) {
    const url = response.url();
    if (response.status() === 404 && url.startsWith(baseOrigin)) traffic.local404s.push(url);
  });
  await page.route('**/api/translate', async function (handledRoute) {
    const request = handledRoute.request();
    traffic.translationRequests.push({
      url: request.url(),
      headers: request.headers(),
      body: request.postData() || ''
    });
    const routeId = route.id.replace(/-/g, '_');
    await handledRoute.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      body: JSON.stringify({
        translatedText: 'AT_OUTPUT_' + routeId + '_20260726',
        provider: 'audit-provider',
        characters: 32,
        unchanged: false,
        fallbackUsed: false
      })
    });
  });

  let response = null;
  let navigationError = '';
  try {
    response = await page.goto(baseUrl + route.route, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (error) {
    navigationError = error.message;
  }
  await settle(page).catch(function () {});

  const documentAudit = await page.evaluate(function () {
    function visible(element) {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }
    function accessibleName(element) {
      const aria = element.getAttribute('aria-label');
      if (aria && aria.trim()) return aria.trim();
      const labelledBy = element.getAttribute('aria-labelledby');
      if (labelledBy) {
        const value = labelledBy.split(/\s+/).map(function (id) {
          const node = document.getElementById(id);
          return node ? node.textContent.trim() : '';
        }).join(' ').trim();
        if (value) return value;
      }
      if (element.labels && element.labels.length) {
        const value = Array.from(element.labels).map(function (label) { return label.textContent.trim(); }).join(' ').trim();
        if (value) return value;
      }
      if (element.tagName === 'BUTTON' || element.tagName === 'A') {
        const value = element.textContent.trim();
        if (value) return value;
      }
      return (element.getAttribute('title') || element.getAttribute('placeholder') || '').trim();
    }
    const main = document.querySelector('main');
    const controls = main ? Array.from(main.querySelectorAll('input:not([type="hidden"]),textarea,select,button'))
      .filter(visible)
      .map(function (element) {
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id || '',
          name: accessibleName(element)
        };
      }) : [];
    return {
      title: document.title,
      mainCount: document.querySelectorAll('main').length,
      h1Count: document.querySelectorAll('h1').length,
      bodyTextLength: document.body.innerText.trim().length,
      controls: controls,
      unnamedControls: controls.filter(function (control) { return !control.name; }),
      overflow: {
        document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        body: document.body.scrollWidth - document.body.clientWidth
      }
    };
  }).catch(function () {
    return {
      title: '',
      mainCount: 0,
      h1Count: 0,
      bodyTextLength: 0,
      controls: [],
      unnamedControls: [],
      overflow: { document: 9999, body: 9999 }
    };
  });

  await page.evaluate(function () { document.documentElement.setAttribute('data-theme', 'dark'); }).catch(function () {});
  await settle(page).catch(function () {});
  const dark = await page.evaluate(bodyDarkMetricsScript).catch(function () {
    return { background: [], foreground: [], backgroundLuminance: 1, contrast: 0 };
  });
  const privacy = navigationError ? { pass: false, reason: 'navigation-failed' } : await auditPrivacy(page, route, traffic)
    .catch(function (error) { return { pass: false, reason: error.message }; });

  const result = {
    httpRender: {
      status: response ? response.status() : null,
      navigationError,
      pass: Boolean(response && response.ok() && !navigationError && documentAudit.h1Count >= 1 && documentAudit.bodyTextLength >= 100)
    },
    mainLandmark: { count: documentAudit.mainCount, pass: documentAudit.mainCount === 1 },
    namedPrimaryControls: {
      count: documentAudit.controls.length,
      unnamed: documentAudit.unnamedControls,
      pass: documentAudit.controls.length > 0 && documentAudit.unnamedControls.length === 0
    },
    mobile320Reflow: {
      documentOverflow: documentAudit.overflow.document,
      bodyOverflow: documentAudit.overflow.body,
      pass: documentAudit.overflow.document <= 1 && documentAudit.overflow.body <= 1
    },
    darkModeSurface: {
      metrics: dark,
      pass: dark.backgroundLuminance <= 0.25 && dark.contrast >= 4.5
    },
    noGoogleFontRequest: {
      requests: traffic.googleFontRequests,
      pass: traffic.googleFontRequests.length === 0
    },
    runtimeErrors: {
      consoleErrors: traffic.consoleErrors,
      pageErrors: traffic.pageErrors,
      local404s: traffic.local404s,
      requestFailures: traffic.requestFailures.filter(function (failure) {
        return failure.url.startsWith(baseOrigin);
      }),
      pass: traffic.consoleErrors.length === 0 &&
        traffic.pageErrors.length === 0 &&
        traffic.local404s.length === 0 &&
        traffic.requestFailures.filter(function (failure) { return failure.url.startsWith(baseOrigin); }).length === 0
    },
    privacy: privacy
  };
  await context.close();
  return result;
}

function checkListForRoute(route) {
  const checks = [
    ['static-file', route.static.exists],
    ['title', route.static.title.pass],
    ['description', route.static.description.pass],
    ['canonical', route.static.canonical.pass],
    ['static-local-typography', route.static.localTypography.pass]
  ];
  route.static.classificationChecks.forEach(function (check) {
    checks.push([check.id, check.pass]);
  });
  if (route.browser) {
    checks.push(
      ['http-render', route.browser.httpRender.pass],
      ['main-landmark', route.browser.mainLandmark.pass],
      ['named-primary-controls', route.browser.namedPrimaryControls.pass],
      ['mobile-320-reflow', route.browser.mobile320Reflow.pass],
      ['dark-mode-surface', route.browser.darkModeSurface.pass],
      ['no-google-font-request', route.browser.noGoogleFontRequest.pass],
      ['runtime-errors', route.browser.runtimeErrors.pass],
      ['privacy', route.browser.privacy.pass]
    );
  }
  return checks;
}

function markdownReport(report) {
  const lines = [
    '# Day 5 Language Release Integration Audit',
    '',
    '- Reviewed: `' + report.reviewedOn + '`',
    '- Registry scope: **' + report.summary.routes + ' English Language routes**',
    '- Accepted hub/foundation: **' + (report.summary.acceptedSurfacesGreen ? 'green' : 'regression detected') + '**',
    '- Accepted apps with integration regressions: **' + report.summary.appsWithBaselineFailures + '**',
    '- Purpose: integration regression evidence after separate app-level acceptance.',
    '',
    '## Evidence boundary',
    '',
    'All 11 apps, the `/language/` inventory and the shared translation-consent foundation have separate VIP receipts. Any failure in this matrix is therefore a release regression.',
    '',
    '## Accepted hub and foundation',
    '',
    '| Check | Result |',
    '| --- | --- |'
  ];
  report.acceptedSurfaces.checks.forEach(function (check) {
    lines.push('| `' + check.id + '` | ' + (check.pass ? 'PASS' : 'FAIL — regression') + ' |');
  });
  lines.push('', '## Route matrix', '');
  lines.push('| Route | Classification | HTTP | Main | Metadata | Local fonts | Named controls | 320px | Dark | Runtime | Privacy | Status |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  report.routes.forEach(function (route) {
    const metadata = route.static.title.pass && route.static.description.pass && route.static.canonical.pass;
    const status = route.baselineFailures.length ? 'REGRESSION' : 'PASS';
    lines.push([
      '| `' + route.route + '`',
      route.classification,
      route.browser.httpRender.pass ? 'PASS' : 'FAIL',
      route.browser.mainLandmark.pass ? 'PASS' : 'FAIL',
      metadata ? 'PASS' : 'FAIL',
      route.static.localTypography.pass && route.browser.noGoogleFontRequest.pass ? 'PASS' : 'FAIL',
      route.browser.namedPrimaryControls.pass ? 'PASS' : 'FAIL',
      route.browser.mobile320Reflow.pass ? 'PASS' : 'FAIL',
      route.browser.darkModeSurface.pass ? 'PASS' : 'FAIL',
      route.browser.runtimeErrors.pass ? 'PASS' : 'FAIL',
      route.browser.privacy.pass ? 'PASS' : 'FAIL',
      status + ' |'
    ].join(' | '));
  });
  lines.push('', '## App integration regressions', '');
  const failed = report.routes.filter(function (route) { return route.baselineFailures.length; });
  if (!failed.length) {
    lines.push('None.');
  } else {
    failed.forEach(function (route) {
      lines.push('- `' + route.route + '`: ' + route.baselineFailures.map(function (failure) {
        return '`' + failure + '`';
      }).join(', '));
    });
  }
  lines.push('', '## Accepted-surface regressions', '');
  if (!report.regressions.length) {
    lines.push('None.');
  } else {
    report.regressions.forEach(function (regression) { lines.push('- `' + regression + '`'); });
  }
  lines.push(
    '',
    '## Limitations',
    '',
    '- This is Chromium integration coverage at 320px plus static source inspection; it is not a linguistic accuracy review.',
    '- Linguistic certification remains outside this harness; draft phrasebooks keep their visible unreviewed status.',
    '- Cloud translation is exercised only with a synthetic intercepted response after explicit consent. No real translation provider receives the fixture.',
    '- Source datasets, dialect coverage and translation quality require separate per-app evidence.',
    ''
  );
  return lines.join('\n');
}

async function run() {
  const registrySource = readText('assets/js/components/tool-registry.js');
  const routes = deriveEnglishLanguageRoutes(registrySource);
  if (routes.length !== 11) throw new Error('Expected 11 English Language routes; found ' + routes.length);
  const unclassified = routes.filter(function (route) { return route.classification === 'unclassified'; });
  if (unclassified.length) throw new Error('Unclassified Language routes: ' + unclassified.map(function (route) { return route.id; }).join(', '));

  const acceptedSurfaces = acceptedSurfaceAudit(routes);
  const server = await startServerIfNeeded(BASE_URL);
  const browser = await chromium.launch({ headless: true });
  const auditedRoutes = [];
  try {
    for (const route of routes) {
      console.log('Auditing ' + route.route + ' (' + route.classification + ')');
      const staticAudit = staticRouteAudit(route);
      const browserAudit = await browserRouteAudit(browser, route, BASE_URL);
      const audited = Object.assign({}, route, { static: staticAudit, browser: browserAudit });
      const failures = checkListForRoute(audited)
        .filter(function (entry) { return !entry[1]; })
        .map(function (entry) { return entry[0]; });
      audited.baselineFailures = failures;
      auditedRoutes.push(audited);
    }
  } finally {
    await browser.close();
    if (server.process) server.process.kill();
  }

  const regressions = acceptedSurfaces.checks
    .filter(function (check) { return !check.pass; })
    .map(function (check) { return check.id; });
  const report = {
    schemaVersion: 1,
    reviewedOn: REVIEWED_ON,
    baseUrl: BASE_URL,
    scopeSource: 'assets/js/components/tool-registry.js',
    evidenceBoundary: {
      accepted: ['/language/', 'assets/js/lib/external-translation-consent.js', 'assets/js/lib/live-translate.js'],
      unreviewedAppsAreBaseline: false,
      replacesIndividualAcceptance: false
    },
    acceptedSurfaces,
    regressions,
    routes: auditedRoutes,
    summary: {
      routes: auditedRoutes.length,
      classifications: auditedRoutes.reduce(function (counts, route) {
        counts[route.classification] = (counts[route.classification] || 0) + 1;
        return counts;
      }, {}),
      acceptedSurfacesGreen: regressions.length === 0,
      appsPassingIntegrationMatrix: auditedRoutes.filter(function (route) { return route.baselineFailures.length === 0; }).length,
      appsWithBaselineFailures: auditedRoutes.filter(function (route) { return route.baselineFailures.length > 0; }).length
    }
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(REPORT_DIR, 'report.md'), markdownReport(report) + '\n');
  console.log('Day 5 Language release audit written to ' + path.relative(ROOT, REPORT_DIR));
  console.log(JSON.stringify(report.summary, null, 2));
  if (regressions.length) process.exitCode = 2;
}

if (require.main === module) {
  run().catch(function (error) {
    console.error(error && error.stack || error);
    process.exitCode = 1;
  });
}

module.exports = {
  CLASSIFICATION,
  INPUT_CONFIG,
  deriveEnglishLanguageRoutes,
  staticRouteAudit,
  acceptedSurfaceAudit,
  checkListForRoute,
  markdownReport,
  run
};
