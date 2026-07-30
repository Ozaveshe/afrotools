'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4261';
const EXPECTED_ROOT = (
  process.env.FRENCH_FINTECH_EXPECTED_ROOT || path.resolve(__dirname, '..')
).replace(/\\/g, '/');
const EXPECTED_PORT = new URL(BASE_URL).port;
const BASE_ORIGIN = new URL(BASE_URL).origin;
const STATIC_ASSET_PATH = /^\/assets\/(?:css|js|fonts|img)\//;
const RELEVANT_EXFIL_HEADER = /^(?:authorization|proxy-authorization|cookie|origin|referer|content-type|content-disposition|x-.+)$/i;
const FINTECH_MANIFEST = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'data', 'localization', 'fr-fintech-banking-parity-manifest.json'),
  'utf8'
));
const APP_ARTWORK = new Map(FINTECH_MANIFEST.routes.map((record) => [record.englishId, record.artwork]));

function captureRequest(request) {
  return {
    url: request.url(),
    method: request.method(),
    postData: request.postData() || '',
    headers: request.headers()
  };
}

function leakOwnersFor(pattern, storageText, requests, consoleMessages) {
  const test = (value) => new RegExp(pattern.source, pattern.flags.replace('g', '')).test(value);
  const owners = [];
  if (test(storageText)) owners.push('localStorage');
  if (test(JSON.stringify(consoleMessages))) owners.push('console');

  for (const entry of requests) {
    const parsed = new URL(entry.url);
    // Only same-origin GET/HEAD files in these four immutable public asset trees
    // are allowlisted. Page routes, data files, functions, and every external
    // request remain subject to full path, payload, and relevant-header checks.
    const allowlistedAsset = parsed.origin === BASE_ORIGIN &&
      /^(?:GET|HEAD)$/.test(entry.method) &&
      STATIC_ASSET_PATH.test(parsed.pathname);
    if (allowlistedAsset) continue;
    const relevantHeaders = Object.fromEntries(Object.entries(entry.headers || {})
      .filter(([name]) => RELEVANT_EXFIL_HEADER.test(name)));
    const requestOwner = `request:${entry.method}:${parsed.origin}${parsed.pathname}`;
    if (test(`${parsed.pathname}${parsed.search}${parsed.hash}`)) {
      owners.push(`${requestOwner}:path`);
    }
    const structuredBody = entry.postData && !/^\s*[\[{]/.test(entry.postData) &&
      entry.postData.includes('=');
    if (structuredBody) {
      for (const [name, value] of new URLSearchParams(entry.postData)) {
        if (test(value)) owners.push(`${requestOwner}:body.${name}`);
      }
    } else if (entry.postData && test(entry.postData)) {
      owners.push(`${requestOwner}:body`);
    }
    for (const [name, value] of Object.entries(relevantHeaders)) {
      if (test(value)) owners.push(`${requestOwner}:header.${name}`);
    }
  }
  return Array.from(new Set(owners));
}

async function verifySentinel(request) {
  const response = await request.get(`${BASE_URL}/artifacts/fr-fintech-banking-lane-sentinel.txt`);
  if (!response.ok()) throw new Error(`sentinel returned ${response.status()}`);
  const body = await response.text();
  if (!body.includes(`worktree=${EXPECTED_ROOT}`) || !body.includes(`port=${EXPECTED_PORT}`)) {
    throw new Error('refusing browser proof: worktree/port sentinel mismatch');
  }
}

function captureTextResizeState() {
  const viewportWidth = document.documentElement.clientWidth;
  const owners = [];

  function parentAcrossShadow(element) {
    if (element.parentElement) return element.parentElement;
    const root = element.getRootNode();
    return root && root.host ? root.host : null;
  }

  function isClosedOrInertUi(element) {
    let current = element;
    while (current) {
      if (current.hasAttribute('inert')) return true;
      const style = getComputedStyle(current);
      const root = current.getRootNode();
      if (root && root.host && root.host.matches('afro-site-assistant') &&
          current.matches('.panel-wrap:not(.open)') &&
          style.opacity === '0' && style.pointerEvents === 'none') {
        return true;
      }
      current = parentAcrossShadow(current);
    }
    return false;
  }

  function selectorFor(element) {
    const own = element.id
      ? `${element.tagName.toLowerCase()}#${element.id}`
      : `${element.tagName.toLowerCase()}${Array.from(element.classList || [])
        .slice(0, 2).map((name) => `.${name}`).join('')}`;
    const root = element.getRootNode();
    if (root && root.host) {
      const host = root.host.id
        ? `${root.host.tagName.toLowerCase()}#${root.host.id}`
        : root.host.tagName.toLowerCase();
      return `${host}::shadow-root ${own}`;
    }
    return own;
  }

  function addOwner(element, reason, overflow, clippedBy) {
    owners.push({
      selector: selectorFor(element),
      reason,
      overflow,
      clippedBy: clippedBy ? selectorFor(clippedBy) : null,
      text: String(element.textContent || element.value || '').replace(/\s+/g, ' ').trim().slice(0, 80)
    });
  }

  function clippingOwnerFor(element, rect) {
    let ancestor = element;
    while (ancestor && ancestor !== document.body) {
      const ancestorStyle = getComputedStyle(ancestor);
      const intrinsicSvgViewport = ancestor.namespaceURI === 'http://www.w3.org/2000/svg' &&
        ancestor.tagName.toLowerCase() === 'svg';
      if (!intrinsicSvgViewport && /^(hidden|clip)$/.test(ancestorStyle.overflowX)) {
        const ancestorRect = ancestor.getBoundingClientRect();
        const clippingOverflow = Math.max(
          0,
          Math.ceil(rect.right - ancestorRect.right),
          Math.ceil(ancestorRect.left - rect.left)
        );
        if (clippingOverflow > 1) {
          return { ancestor, clippingOverflow };
        }
      }
      ancestor = parentAcrossShadow(ancestor);
    }
    return null;
  }

  function inspectTextNode(node, ownerElement) {
    const text = String(node.nodeValue || '').replace(/\s+/g, ' ').trim();
    if (!text || !ownerElement || isClosedOrInertUi(ownerElement)) return;
    const ownerStyle = getComputedStyle(ownerElement);
    if (ownerStyle.display === 'none' || ownerStyle.visibility === 'hidden' ||
        parseFloat(ownerStyle.opacity) === 0) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) {
      if (!rect.width || !rect.height) continue;
      const viewportOverflow = Math.max(
        0,
        Math.ceil(rect.right - viewportWidth),
        Math.ceil(-rect.left)
      );
      const clipping = clippingOwnerFor(ownerElement, rect);
      if (viewportOverflow <= 1 && !clipping) continue;
      owners.push({
        selector: selectorFor(ownerElement),
        reason: 'text-fragment',
        overflow: Math.max(viewportOverflow, clipping ? clipping.clippingOverflow : 0),
        viewportOverflow,
        clippedBy: clipping ? selectorFor(clipping.ancestor) : null,
        clippingOverflow: clipping ? clipping.clippingOverflow : 0,
        text: text.slice(0, 80)
      });
    }
    range.detach();
  }

  function inspect(element) {
    if (isClosedOrInertUi(element)) return;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    if (style.display === 'none' || style.visibility === 'hidden' ||
        parseFloat(style.opacity) === 0 || !rect.width || !rect.height) return;
    const viewportOverflow = Math.max(
      0,
      Math.ceil(rect.right - viewportWidth),
      Math.ceil(-rect.left)
    );
    if (viewportOverflow > 1) {
      addOwner(element, 'viewport', viewportOverflow, null);
    }

    const nativeTextControl = /^(INPUT|SELECT|TEXTAREA)$/.test(element.tagName);
    const visibleText = String(element.textContent || '').replace(/\s+/g, ' ').trim();
    if (!nativeTextControl && !element.children.length && visibleText &&
        /^(hidden|clip)$/.test(style.overflowX) && element.scrollWidth - element.clientWidth > 1) {
      addOwner(element, 'self-clipped', element.scrollWidth - element.clientWidth, element);
    }

    const clipping = clippingOwnerFor(parentAcrossShadow(element), rect);
    if (clipping) {
      addOwner(element, 'ancestor-clipped', clipping.clippingOverflow, clipping.ancestor);
    }
  }

  function walk(container) {
    for (const node of container.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const ownerElement = container.nodeType === Node.DOCUMENT_FRAGMENT_NODE
          ? container.host
          : container;
        inspectTextNode(node, ownerElement);
        continue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      inspect(node);
      walk(node);
      if (node.shadowRoot) walk(node.shadowRoot);
    }
  }

  walk(document.body);
  return {
    rootFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
    bodyFontSize: parseFloat(getComputedStyle(document.body).fontSize),
    overflow: document.documentElement.scrollWidth - viewportWidth,
    owners
  };
}

async function verifyTextResize200(page, id) {
  const previousViewport = page.viewportSize();
  await page.setViewportSize({ width: 320, height: 720 });
  const normal = await page.evaluate(captureTextResizeState);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await page.waitForTimeout(50);
  const resized = await page.evaluate(captureTextResizeState);
  const rootScale = resized.rootFontSize / normal.rootFontSize;
  const bodyScale = resized.bodyFontSize / normal.bodyFontSize;
  const exactFontSizes = normal.rootFontSize === 16 && normal.bodyFontSize === 16 &&
    resized.rootFontSize === 32 && resized.bodyFontSize === 32 &&
    rootScale === 2 && bodyScale === 2;
  if (!exactFontSizes) {
    throw new Error(`${id}: 200% text resize did not double computed text ${JSON.stringify({ normal, resized, rootScale, bodyScale })}`);
  }
  if (normal.overflow > 1 || normal.owners.length) {
    throw new Error(`${id}: baseline text overflow ${JSON.stringify({ normal, resized, rootScale, bodyScale })}`);
  }
  if (resized.overflow > 1 || resized.owners.length) {
    throw new Error(`${id}: 200% text resize overflow ${JSON.stringify({ normal, resized, rootScale, bodyScale })}`);
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });
  if (previousViewport && (previousViewport.width !== 320 || previousViewport.height !== 720)) {
    await page.setViewportSize(previousViewport);
  }
  return { normal, resized, rootScale, bodyScale };
}

async function verifyAppArtwork(page, id, state) {
  const expectedArtwork = APP_ARTWORK.get(id);
  if (!expectedArtwork) throw new Error(`${id}: no manifest artwork owner`);
  const image = page.locator('.fr-fintech-artwork img');
  await image.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForFunction(() => {
    const node = document.querySelector('.fr-fintech-artwork img');
    return Boolean(node && node.complete && node.naturalWidth && node.naturalHeight);
  }, null, { timeout: 15000 });
  await image.scrollIntoViewIfNeeded();
  const proof = await page.evaluate(({ expectedPath, proofState }) => {
    const images = Array.from(document.querySelectorAll('.fr-fintech-artwork img'));
    const node = images[0];
    const figure = node && node.closest('figure');
    const heading = document.querySelector('.tool-hero h1');
    const style = node ? getComputedStyle(node) : null;
    const rect = node ? node.getBoundingClientRect() : null;
    const naturalAspect = node && node.naturalHeight ? node.naturalWidth / node.naturalHeight : 0;
    const renderedAspect = rect && rect.height ? rect.width / rect.height : 0;
    return {
      state: proofState,
      count: images.length,
      expectedPath,
      currentSrc: node ? node.currentSrc : '',
      currentPath: node && node.currentSrc ? new URL(node.currentSrc).pathname : '',
      complete: Boolean(node && node.complete),
      naturalWidth: node ? node.naturalWidth : 0,
      naturalHeight: node ? node.naturalHeight : 0,
      renderedWidth: rect ? rect.width : 0,
      renderedHeight: rect ? rect.height : 0,
      naturalAspect,
      renderedAspect,
      aspectDelta: naturalAspect ? Math.abs(renderedAspect - naturalAspect) / naturalAspect : 1,
      visible: Boolean(node && style.display !== 'none' && style.visibility !== 'hidden' &&
        parseFloat(style.opacity) > 0 && rect.width > 1 && rect.height > 1),
      inViewport: Boolean(rect && rect.bottom > 0 && rect.top < innerHeight &&
        rect.right > 0 && rect.left < innerWidth),
      alt: node ? node.alt.trim() : '',
      heading: heading ? heading.textContent.replace(/\s+/g, ' ').trim() : '',
      provenance: figure ? figure.getAttribute('data-artwork-provenance') : '',
      caption: figure && figure.querySelector('figcaption')
        ? figure.querySelector('figcaption').textContent.replace(/\s+/g, ' ').trim()
        : ''
    };
  }, { expectedPath: `/${expectedArtwork.replace(/^\/+/, '')}`, proofState: state });
  if (proof.count !== 1 || proof.currentPath !== proof.expectedPath || !proof.complete ||
      !proof.naturalWidth || !proof.naturalHeight || !proof.visible || !proof.inViewport ||
      proof.renderedWidth < 40 || proof.renderedHeight < 40 || proof.aspectDelta > 0.02 ||
      !proof.heading || !proof.alt.includes(proof.heading) ||
      proof.alt.length < proof.heading.length + 20 || proof.provenance !== 'AfroTools' ||
      !/Illustration AfroTools/.test(proof.caption)) {
    throw new Error(`${id}: rendered artwork contract ${JSON.stringify(proof)}`);
  }
  return proof;
}

async function captureResultContrast(page) {
  return page.evaluate(() => {
    function parseColor(value) {
      const parts = String(value).match(/[\d.]+/g);
      if (!parts || parts.length < 3) return [0, 0, 0, 0];
      return [
        Number(parts[0]),
        Number(parts[1]),
        Number(parts[2]),
        parts.length > 3 ? Number(parts[3]) : 1
      ];
    }

    function composite(top, bottom) {
      const alpha = top[3] + bottom[3] * (1 - top[3]);
      if (!alpha) return [0, 0, 0, 0];
      return [
        (top[0] * top[3] + bottom[0] * bottom[3] * (1 - top[3])) / alpha,
        (top[1] * top[3] + bottom[1] * bottom[3] * (1 - top[3])) / alpha,
        (top[2] * top[3] + bottom[2] * bottom[3] * (1 - top[3])) / alpha,
        alpha
      ];
    }

    function resolvedBackground(element) {
      let result = [0, 0, 0, 0];
      let current = element;
      while (current) {
        result = composite(result, parseColor(getComputedStyle(current).backgroundColor));
        if (result[3] >= 0.999) break;
        current = current.parentElement;
      }
      return result[3] >= 0.999 ? result : composite(result, [255, 255, 255, 1]);
    }

    function luminance(color) {
      const channels = color.slice(0, 3).map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }

    function contrast(first, second) {
      const firstLum = luminance(first);
      const secondLum = luminance(second);
      return (Math.max(firstLum, secondLum) + 0.05) / (Math.min(firstLum, secondLum) + 0.05);
    }

    function visible(element) {
      if (!element || element.closest('[inert],[aria-hidden="true"]')) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' &&
        parseFloat(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
    }

    function selectorFor(element) {
      if (element.id) return `${element.tagName.toLowerCase()}#${element.id}`;
      const classes = Array.from(element.classList || []).slice(0, 3);
      return `${element.tagName.toLowerCase()}${classes.map((name) => `.${name}`).join('')}`;
    }

    const main = document.querySelector('main');
    const pairs = [];
    if (main) {
      for (const element of main.querySelectorAll('*')) {
        if (!visible(element)) continue;
        const directText = Array.from(element.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.nodeValue.replace(/\s+/g, ' ').trim())
          .filter(Boolean)
          .join(' ');
        if (!directText) continue;
        const style = getComputedStyle(element);
        const background = resolvedBackground(element);
        const foreground = composite(parseColor(style.color), background);
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = parseInt(style.fontWeight, 10) || 400;
        const largeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        const ratio = contrast(foreground, background);
        pairs.push({
          selector: selectorFor(element),
          text: directText.slice(0, 100),
          foreground: style.color,
          background: `rgb(${background.slice(0, 3).map(Math.round).join(', ')})`,
          fontSize,
          fontWeight,
          ratio,
          minimum: largeText ? 3 : 4.5
        });
      }
    }

    const controlSelector = [
      '.fintech-pay-actions button',
      'button.btn-add',
      'button.btn-secondary',
      'button.btn-del',
      'button.btn-del-row',
      'button.etab'
    ].join(',');
    const controls = main ? Array.from(main.querySelectorAll(controlSelector))
      .filter(visible).map((element) => {
        const surface = resolvedBackground(element);
        const panel = resolvedBackground(element.parentElement);
        return {
          selector: selectorFor(element),
          text: element.textContent.replace(/\s+/g, ' ').trim().slice(0, 80),
          surface: `rgb(${surface.slice(0, 3).map(Math.round).join(', ')})`,
          panel: `rgb(${panel.slice(0, 3).map(Math.round).join(', ')})`,
          ratio: contrast(surface, panel),
          minimum: 3
        };
      }) : [];
    const resultRegions = main ? Array.from(main.querySelectorAll(
      '.results.on,.results.active,.results.show,[role="region"][aria-live]'
    )).filter((element) => visible(element) && element.textContent.trim()).map(selectorFor) : [];
    const failures = pairs.filter((pair) => pair.ratio + 0.001 < pair.minimum);
    const controlFailures = controls.filter((control) => control.ratio + 0.001 < control.minimum);
    return {
      resultRegions,
      scannedTextPairs: pairs.length,
      scannedControlSurfaces: controls.length,
      minimumTextRatio: pairs.length ? Math.min(...pairs.map((pair) => pair.ratio)) : 0,
      minimumControlRatio: controls.length ? Math.min(...controls.map((control) => control.ratio)) : null,
      failures,
      controlFailures,
      bodyBackground: getComputedStyle(document.body).backgroundColor
    };
  });
}

async function verifyDarkModeContrast(page, id) {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  const lightBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  const manual = await captureResultContrast(page);
  await page.evaluate(() => { delete document.documentElement.dataset.theme; });
  await page.emulateMedia({ colorScheme: 'dark' });
  const system = await captureResultContrast(page);
  if (manual.bodyBackground === lightBackground || system.bodyBackground === lightBackground ||
      !manual.resultRegions.length || !system.resultRegions.length ||
      manual.failures.length || system.failures.length ||
      manual.controlFailures.length || system.controlFailures.length) {
    throw new Error(`${id}: dark result contrast ${JSON.stringify({ lightBackground, manual, system })}`);
  }
  return {
    lightBackground,
    darkBackground: manual.bodyBackground,
    systemDarkBackground: system.bodyBackground,
    manual,
    system
  };
}

async function verifyHub(browser) {
  const manifest = FINTECH_MANIFEST;
  const context = await browser.newContext({ colorScheme: 'light', viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.goto(`${BASE_URL}/fr/fintech/`, { waitUntil: 'networkidle', timeout: 20000 });
  const proof = await page.evaluate((expectedRoutes) => {
    const links = Array.from(document.querySelectorAll('a.tool')).map((link) => link.getAttribute('href'));
    const images = Array.from(document.querySelectorAll('a.tool img')).map((image) => ({
      src: image.getAttribute('src'),
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    }));
    const schemas = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((node) => JSON.parse(node.textContent));
    const text = document.body.innerText
      .replace(/AfroTools|Fintech|FIRE|SACCO|BNPL|DCA|B2B|QR|POS|mobile money/gi, '');
    return {
      links,
      images,
      missingRoutes: expectedRoutes.filter((route) => !links.includes(route)),
      residualEnglish: text.match(/\b(?:View|Calculator|Calculate|Compare|Download|Privacy|Results|Frequently Asked Questions)\b/gi) || [],
      lang: document.documentElement.lang,
      canonical: document.querySelector('link[rel="canonical"]').href,
      hreflang: Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map((node) => [
        node.getAttribute('hreflang'), node.href
      ]),
      schemas,
      unlabeledLinks: Array.from(document.querySelectorAll('a')).filter((link) => !link.textContent.trim() && !link.getAttribute('aria-label')).length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  }, manifest.routes.map((record) => record.frenchRoute));
  if (proof.links.length !== 31 || new Set(proof.links).size !== 31 || proof.missingRoutes.length) {
    throw new Error(`fintech-hub: route completeness ${JSON.stringify(proof)}`);
  }
  if (proof.images.length !== 31 || proof.images.some((image) => !image.naturalWidth || !image.naturalHeight || /fallback/i.test(image.src))) {
    throw new Error(`fintech-hub: artwork contract ${JSON.stringify(proof.images)}`);
  }
  if (proof.residualEnglish.length || proof.lang !== 'fr' || proof.canonical !== 'https://afrotools.com/fr/fintech/' ||
      proof.unlabeledLinks || proof.overflow > 1 ||
      !proof.schemas.some((entry) => entry.inLanguage === 'fr' && entry.mainEntity && entry.mainEntity.numberOfItems === 31)) {
    throw new Error(`fintech-hub: language/SEO/a11y contract ${JSON.stringify(proof)}`);
  }
  const alternates = Object.fromEntries(proof.hreflang);
  if (alternates.en !== 'https://afrotools.com/fintech/' ||
      alternates.fr !== 'https://afrotools.com/fr/fintech/' ||
      alternates.sw !== 'https://afrotools.com/sw/fintech/' ||
      alternates['x-default'] !== 'https://afrotools.com/fintech/') {
    throw new Error(`fintech-hub: hreflang contract ${JSON.stringify(alternates)}`);
  }
  await page.setViewportSize({ width: 320, height: 720 });
  const overflow320 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const textResize200 = await verifyTextResize200(page, 'fintech-hub');
  const overflow200 = textResize200.resized.overflow;
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  const darkBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.evaluate(() => { delete document.documentElement.dataset.theme; });
  await page.emulateMedia({ colorScheme: 'dark' });
  const systemDarkBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  if (overflow320 > 1 || overflow200 > 1 || darkBackground === 'rgba(0, 0, 0, 0)' ||
      systemDarkBackground === 'rgba(0, 0, 0, 0)' || pageErrors.length || consoleErrors.length) {
    throw new Error(`fintech-hub: browser contract ${JSON.stringify({ overflow320, overflow200, darkBackground, systemDarkBackground, pageErrors, consoleErrors })}`);
  }
  await context.close();
  return {
    route: '/fr/fintech/',
    links: 31,
    uniquePhysicalRoutes: 31,
    genericArtwork: false,
    residualEnglish: [],
    responsive: { width375Overflow: proof.overflow, width320Overflow: overflow320, textResize200 },
    browser: { pageErrors, consoleErrors },
  };
}

async function verifyInvalidStateCleared(page, context, contract) {
  const state = await page.locator(contract.resultSelector).evaluate((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    const visible = style.display !== 'none'
      && style.visibility !== 'hidden'
      && Number(style.opacity) !== 0
      && rect.width > 0
      && rect.height > 0;
    return {
      visible,
      className: node.className,
      textLength: node.innerText.trim().length
    };
  });
  if (state.visible || /\b(?:on|active|show|is-visible)\b/.test(state.className)) {
    throw new Error(`${contract.id}: invalid input left a stale result visible ${JSON.stringify(state)}`);
  }

  const sharedExports = await page.evaluate(() => Array.from(document.querySelectorAll(
    '[data-fr-finpay-copy],[data-fr-finpay-download],[data-fr-finpay-save]'
  )).map((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return {
      action: node.hasAttribute('data-fr-finpay-copy') ? 'copy'
        : node.hasAttribute('data-fr-finpay-download') ? 'download' : 'save',
      visible: style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity) !== 0
        && rect.width > 0
        && rect.height > 0,
      disabled: node.disabled === true
    };
  }));
  const exposedShared = sharedExports.filter((entry) => entry.visible && !entry.disabled);
  if (exposedShared.length) {
    throw new Error(`${contract.id}: invalid input exposed stale shared exports `
      + `${JSON.stringify(exposedShared)}`);
  }

  const localCopySelectors = ['#if-copy', '#mmf-copy'];
  let localCopyActions = 0;
  for (const selector of localCopySelectors) {
    if (!await page.locator(selector).count()) continue;
    localCopyActions += 1;
    await context.grantPermissions(
      ['clipboard-read', 'clipboard-write'],
      { origin: BASE_URL }
    );
    await page.evaluate(() => navigator.clipboard.writeText('AFROTOOLS_INVALID_EXPORT_SENTINEL'));
    await page.locator(selector).click();
    await page.waitForTimeout(50);
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    contract.leakPattern.lastIndex = 0;
    if (contract.leakPattern.test(clipboard)) {
      throw new Error(`${contract.id}: invalid copy action exposed the stale valid result`);
    }
  }

  let blockedDownloads = 0;
  if (await page.locator('#if-csv').count()) {
    const download = page.waitForEvent('download', { timeout: 750 }).catch(() => null);
    await page.locator('#if-csv').click();
    if (await download) {
      throw new Error(`${contract.id}: invalid CSV action exported the stale valid result`);
    }
    blockedDownloads += 1;
  }

  return {
    resultHidden: true,
    staleSharedExportsHidden: true,
    localCopyActions,
    blockedDownloads
  };
}

async function verifyStandardCalculator(browser, contract) {
  const context = await browser.newContext({ colorScheme: 'light', viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const consoleMessages = [];
  const requests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    consoleMessages.push(message.text());
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', (request) => requests.push(captureRequest(request)));
  await page.goto(`${BASE_URL}${contract.route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.locator(contract.readySelector).waitFor();
  if (await page.locator('iframe').count()) throw new Error(`${contract.id}: iframe found`);
  const initialArtwork = await verifyAppArtwork(page, contract.id, 'initial');
  const initialTextResize200 = await verifyTextResize200(page, `${contract.id}:initial`);
  for (const [selector, value] of Object.entries(contract.values)) {
    const locator = page.locator(selector);
    if (await locator.evaluate((node) => node.tagName === 'SELECT')) await locator.selectOption(String(value));
    else await locator.fill(String(value));
  }
  const action = page.getByRole('button', { name: contract.action });
  await action.click();
  const firstResult = await page.locator(contract.resultSelector).innerText();
  await contract.assertValid(page, firstResult);
  const mutationLocator = page.locator(contract.mutation.selector);
  if (await mutationLocator.evaluate((node) => node.tagName === 'SELECT')) {
    await mutationLocator.selectOption(String(contract.mutation.value));
  } else {
    await mutationLocator.fill(String(contract.mutation.value));
  }
  await action.click();
  const changedResult = await page.locator(contract.resultSelector).innerText();
  if (changedResult === firstResult) throw new Error(`${contract.id}: meaningful input did not mutate output`);
  if (contract.invalid.apply) {
    await contract.invalid.apply(page);
  } else {
    const invalidLocator = page.locator(contract.invalid.selector);
    if (await invalidLocator.evaluate((node) => node.tagName === 'SELECT')) {
      await invalidLocator.selectOption(String(contract.invalid.value));
    } else {
      await invalidLocator.fill(String(contract.invalid.value));
    }
  }
  await action.click();
  const invalidLocator = page.locator(contract.errorSelector);
  const invalid = await invalidLocator.textContent();
  if (!contract.invalid.message.test(invalid)) throw new Error(`${contract.id}: invalid state ${invalid}`);
  if (!await invalidLocator.isVisible()) throw new Error(`${contract.id}: invalid message is not visible`);
  const invalidStateProof = await verifyInvalidStateCleared(page, context, contract);
  for (const [selector, value] of Object.entries(contract.values)) {
    const locator = page.locator(selector);
    if (await locator.evaluate((node) => node.tagName === 'SELECT')) await locator.selectOption(String(value));
    else await locator.fill(String(value));
  }
  await action.click();
  const renderedArtwork = await verifyAppArtwork(page, contract.id, 'rendered-result');
  const unlabeledControls = await page.evaluate(() => Array.from(
    document.querySelectorAll('input:not([type="hidden"]),select,textarea')
  ).filter((control) => {
    const label = control.id && document.querySelector(`label[for="${control.id}"]`);
    return !label && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby');
  }).map((control) => control.id || control.name || control.tagName));
  if (unlabeledControls.length) throw new Error(`${contract.id}: unlabeled controls ${unlabeledControls}`);
  await page.locator(contract.focus.from).focus();
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.id);
  if (focused !== contract.focus.to) throw new Error(`${contract.id}: keyboard order reached ${focused}`);
  const englishOracle = await page.evaluate(({ allowlist, sources }) => {
    let text = document.body.innerText;
    for (const allowed of allowlist) text = text.split(allowed).join('');
    return sources.flatMap((source) => text.match(new RegExp(source, 'gi')) || []);
  }, {
    allowlist: contract.allowlist,
    sources: contract.englishPatterns.map((pattern) => pattern.source)
  });
  if (englishOracle.length) throw new Error(`${contract.id}: residual English ${JSON.stringify(englishOracle)}`);
  const storageText = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  const leakOwners = leakOwnersFor(contract.leakPattern, storageText, requests, consoleMessages);
  if (leakOwners.length) {
    throw new Error(`${contract.id}: fixture leaked into ${leakOwners.join(', ')}`);
  }
  if (contract.verifyExports) await contract.verifyExports(page, context);
  const overflow375 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.setViewportSize({ width: 320, height: 720 });
  const overflow320 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const textResize200 = await verifyTextResize200(page, contract.id);
  const overflow200 = textResize200.resized.overflow;
  if ([overflow375, overflow320, overflow200].some((value) => value > 1)) {
    throw new Error(`${contract.id}: reflow overflow ${JSON.stringify({ overflow375, overflow320, overflow200 })}`);
  }
  const themeContrast = await verifyDarkModeContrast(page, contract.id);
  const { lightBackground, darkBackground, systemDarkBackground } = themeContrast;
  const seo = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    canonical: document.querySelector('link[rel="canonical"]').href,
    schema: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((node) => JSON.parse(node.textContent))
  }));
  if (seo.lang !== 'fr' || seo.canonical !== contract.canonical || !seo.schema.some((entry) => entry.inLanguage === 'fr')) {
    throw new Error(`${contract.id}: SEO language contract ${JSON.stringify(seo)}`);
  }
  if (pageErrors.length || consoleErrors.length) {
    throw new Error(`${contract.id}: browser errors ${JSON.stringify({ pageErrors, consoleErrors })}`);
  }
  await context.close();
  return {
    route: contract.route,
    resultMutation: true,
    invalidFailClosed: true,
    invalidStateProof,
    primaryActionUngated: true,
    advertisedExports: contract.advertisedExports || [],
    exportProof: (contract.advertisedExports || []).map((format) => ({
      format,
      generated: true,
      reopened: true,
      parsed: true,
      ungated: true,
    })),
    artwork: { initial: initialArtwork, renderedResult: renderedArtwork },
    contrast: themeContrast,
    privacy: { requestUrlLeak: false, requestBodyLeak: false, consoleLeak: false, storedFinancialDetails: false, screenshotsCaptured: false, testArtifactFixtureLeak: false },
    responsive: { width375Overflow: overflow375, width320Overflow: overflow320, initialTextResize200, textResize200 },
    keyboard: { focusAfter: focused },
    accessibility: { unlabeledControls },
    languageOracle: { residualEnglish: englishOracle },
    lightBackground,
    darkBackground,
    systemDarkBackground,
    browser: { pageErrors, consoleErrors }
  };
}

async function verifyMobileVsBank(browser) {
  const context = await browser.newContext({
    acceptDownloads: true,
    colorScheme: 'light',
    viewport: { width: 375, height: 812 }
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const consoleMessages = [];
  const requests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    consoleMessages.push(message.text());
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', (request) => requests.push(captureRequest(request)));

  await page.goto(`${BASE_URL}/fr/tools/mobile-money-vs-banque/`, {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });
  await page.locator('#mb-amount').waitFor();
  if (await page.locator('iframe').count()) throw new Error('mobile-vs-bank: iframe found');
  const initialArtwork = await verifyAppArtwork(page, 'mobile-vs-bank', 'initial');
  const initialTextResize200 = await verifyTextResize200(page, 'mobile-vs-bank:initial');
  await page.locator('[data-fr-finpay-save]').waitFor({ state: 'attached', timeout: 15000 }).catch(async () => {
    const diagnostic = await page.evaluate(() => ({
      readyState: document.readyState,
      pathname: window.location.pathname,
      resultFound: Boolean(document.querySelector('#mb-results')),
      actionsFound: Boolean(document.querySelector('.fintech-pay-actions')),
      actionsHtml: document.querySelector('.fintech-pay-actions')
        ? document.querySelector('.fintech-pay-actions').outerHTML.slice(0, 1200)
        : '',
      focusScript: Array.from(document.scripts).some((script) => /fr-fintech-payment-focus/.test(script.src))
    }));
    throw new Error(
      `mobile-vs-bank: French result actions did not mount; diagnostic=${JSON.stringify(diagnostic)}; `
      + `pageErrors=${JSON.stringify(pageErrors)}; consoleErrors=${JSON.stringify(consoleErrors)}`
    );
  });

  await page.locator('#mb-amount').fill('10000');
  await page.locator('#mb-mm-fee').fill('50');
  await page.locator('#mb-mm-pct').fill('1');
  await page.locator('#mb-bank-fee').fill('20');
  await page.locator('#mb-bank-pct').fill('2');
  await page.getByRole('button', { name: /Comparer les devis/ }).click();
  const valid = await page.locator('#mb-results').innerText();
  for (const expected of ['Devis mobile money', 'Taux de frais effectif', 'LE MOINS CHER', '150.00', '220.00']) {
    if (!valid.includes(expected)) throw new Error(`mobile-vs-bank: valid result is missing ${expected}`);
  }

  await page.locator('#mb-amount').fill('0');
  await page.getByRole('button', { name: /Comparer les devis/ }).click();
  const invalid = await page.locator('#mb-error').textContent();
  if (!/^Saisissez un montant/.test(invalid)) {
    throw new Error(`mobile-vs-bank: invalid result did not fail closed in French: ${invalid}`);
  }
  const invalidStateProof = await verifyInvalidStateCleared(page, context, {
    id: 'mobile-vs-bank',
    resultSelector: '#mb-results',
    leakPattern: /10000|150\.00|220\.00/
  });

  await page.locator('#mb-amount').fill('10000');
  await page.getByRole('button', { name: /Comparer les devis/ }).click();
  const renderedArtwork = await verifyAppArtwork(page, 'mobile-vs-bank', 'rendered-result');
  await page.getByRole('button', { name: /Enregistrer un rep/ }).click();
  const marker = await page.evaluate(() => localStorage.getItem('afro_fr_fintech_payment_marker_v1'));
  if (!marker || marker.includes('10000') || marker.includes('150.00')) {
    throw new Error('mobile-vs-bank: raw financial fixture leaked into local storage');
  }
  const parsedMarker = JSON.parse(marker);
  if (parsedMarker.storesFinancialDetails !== false) {
    throw new Error('mobile-vs-bank: marker privacy flag is not fail closed');
  }
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE_URL });
  await page.getByRole('button', { name: /Copier le r/ }).click();
  await page.waitForFunction(() => /^Résultat copié/.test(
    document.querySelector('[data-fr-finpay-status]').textContent
  ), null, { timeout: 5000 });
  const copyStatus = await page.locator('[data-fr-finpay-status]').textContent();
  if (!/^Résultat copié/.test(copyStatus)) {
    throw new Error(`mobile-vs-bank: copy action did not confirm in French: ${copyStatus}`);
  }

  await page.locator('#mb-country').focus();
  await page.keyboard.press('Tab');
  const focusedAfterCountry = await page.evaluate(() => document.activeElement && document.activeElement.id);
  if (focusedAfterCountry !== 'mb-amount') {
    throw new Error(`mobile-vs-bank: keyboard order left country for ${focusedAfterCountry || 'nothing'}`);
  }

  const englishOracle = await page.evaluate(() => {
    const reviewedAllowlist = [
      'AfroTools', 'Fintech', 'Mobile money', 'Kenya', 'Nigeria', 'Ghana', 'Rwanda',
      'Malawi', 'Mozambique', 'Botswana', 'TXT', 'KES', 'NGN', 'GHS', 'UGX', 'TZS',
      'ZAR', 'RWF', 'ZMW', 'ETB', 'XAF', 'XOF', 'MWK', 'MZN', 'BWP'
    ];
    let visible = document.body.innerText;
    for (const allowed of reviewedAllowlist) visible = visible.split(allowed).join('');
    const patterns = [
      /\b(?:Calculate|Calculator|Compare current|Enter|Amount to|Bank transfer quote|Flat fee|Effective fee|Cheapest|Same cost)\b/gi,
      /\b(?:Copy result|Download|Save marker|Run the|Result ready|Frequently Asked Questions|Related tools)\b/gi,
      /\b(?:Privacy|current fees|fee values|All Transfer Methods|Before choosing)\b/gi
    ];
    return patterns.flatMap((pattern) => visible.match(pattern) || []);
  });
  if (englishOracle.length) {
    throw new Error(`mobile-vs-bank: residual English ${JSON.stringify(englishOracle)}`);
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  if (overflow > 1) throw new Error(`mobile-vs-bank: 375px overflow is ${overflow}px`);
  await page.setViewportSize({ width: 320, height: 720 });
  const overflow320 = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  if (overflow320 > 1) throw new Error(`mobile-vs-bank: 320px overflow is ${overflow320}px`);

  const textResize200 = await verifyTextResize200(page, 'mobile-vs-bank');
  const overflow200 = textResize200.resized.overflow;
  if (overflow200 > 1) throw new Error(`mobile-vs-bank: 200% reflow overflow is ${overflow200}px`);
  const themeContrast = await verifyDarkModeContrast(page, 'mobile-vs-bank');
  const { lightBackground, darkBackground, systemDarkBackground } = themeContrast;

  const seo = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    canonical: document.querySelector('link[rel="canonical"]').href,
    schema: Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((node) => JSON.parse(node.textContent))
  }));
  if (seo.lang !== 'fr') throw new Error('mobile-vs-bank: html language is not French');
  if (seo.canonical !== 'https://afrotools.com/fr/tools/mobile-money-vs-banque/') {
    throw new Error(`mobile-vs-bank: canonical mismatch ${seo.canonical}`);
  }
  if (!seo.schema.some((entry) => entry.inLanguage === 'fr')) {
    throw new Error('mobile-vs-bank: no French inLanguage schema');
  }
  const mobileLeakOwners = leakOwnersFor(
    /10000|150\.00|Devis(?:%20| )mobile/i,
    await page.evaluate(() => JSON.stringify(Object.entries(localStorage))),
    requests,
    consoleMessages
  );
  if (mobileLeakOwners.length) {
    throw new Error(`mobile-vs-bank: raw financial fixture leaked into ${mobileLeakOwners.join(', ')}`);
  }

  const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
    .catch((error) => error);
  await page.evaluate(() => document.querySelector('[data-fr-finpay-download]').click());
  const download = await downloadPromise;
  if (download instanceof Error) {
    const status = await page.locator('[data-fr-finpay-status]').textContent();
    const resultState = await page.locator('#mb-results').evaluate((node) => ({
      className: node.className,
      textLength: node.innerText.length
    }));
    throw new Error(
      `mobile-vs-bank: TXT download was not emitted; status=${status}; `
      + `result=${JSON.stringify(resultState)}; pageErrors=${JSON.stringify(pageErrors)}`
    );
  }
  const downloadedPath = await download.path();
  const text = fs.readFileSync(downloadedPath, 'utf8');
  if (!text.includes('Devis mobile money') || !text.includes('150.00')) {
    throw new Error('mobile-vs-bank: reopened TXT does not contain the fixture result');
  }

  await context.close();
  return {
    route: '/fr/tools/mobile-money-vs-banque/',
    resultMutation: true,
    invalidFailClosed: true,
    invalidStateProof,
    primaryActionUngated: true,
    advertisedExports: ['TXT'],
    exportProof: [{ format: 'TXT', generated: true, reopened: true, parsed: true, ungated: true }],
    txt: {
      filename: download.suggestedFilename(),
      bytes: Buffer.byteLength(text),
      reopened: true
    },
    artwork: { initial: initialArtwork, renderedResult: renderedArtwork },
    contrast: themeContrast,
    privacy: {
      requestUrlLeak: false,
      requestBodyLeak: false,
      consoleLeak: false,
      storedFinancialDetails: false,
      screenshotsCaptured: false,
      testArtifactFixtureLeak: false
    },
    responsive: {
      width375Overflow: overflow,
      width320Overflow: overflow320,
      initialTextResize200,
      textResize200
    },
    keyboard: {
      focusAfterCountry: focusedAfterCountry
    },
    languageOracle: {
      residualEnglish: englishOracle
    },
    lightBackground,
    darkBackground,
    systemDarkBackground,
    browser: {
      pageErrors,
      consoleErrors
    }
  };
}

async function verifyFixedDeposit(browser) {
  const context = await browser.newContext({
    colorScheme: 'light',
    viewport: { width: 375, height: 812 }
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const consoleMessages = [];
  const requests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    consoleMessages.push(message.text());
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', (request) => requests.push(captureRequest(request)));

  await page.goto(`${BASE_URL}/fr/tools/depot-terme/`, {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });
  await page.locator('#fd-amount').waitFor();
  if (await page.locator('iframe').count()) throw new Error('fixed-deposit: iframe found');
  const initialArtwork = await verifyAppArtwork(page, 'fixed-deposit', 'initial');
  const initialTextResize200 = await verifyTextResize200(page, 'fixed-deposit:initial');

  await page.locator('#fd-amount').fill('100000');
  await page.locator('#fd-rate').fill('12');
  await page.locator('#fd-tax').fill('10');
  await page.locator('#fd-tenor').selectOption('12');
  await page.locator('#fd-compound').selectOption('simple');
  await page.getByRole('button', { name: /Calculer le rendement/ }).click();
  const valid = await page.locator('#fd-results').innerText();
  for (const expected of ['110,800.00', '12,000.00', '1,200.00', '10,800.00', 'Capital', 'Intérêts nets', 'Mois 12']) {
    if (!valid.includes(expected)) throw new Error(`fixed-deposit: valid result is missing ${expected}`);
  }

  await page.locator('#fd-amount').fill('0');
  await page.getByRole('button', { name: /Calculer le rendement/ }).click();
  const invalid = await page.locator('#fd-error').textContent();
  if (!/^Saisissez un capital/.test(invalid)) {
    throw new Error(`fixed-deposit: invalid result did not fail closed in French: ${invalid}`);
  }
  const invalidStateProof = await verifyInvalidStateCleared(page, context, {
    id: 'fixed-deposit',
    resultSelector: '#fd-results',
    leakPattern: /100000|110(?:,|%2C)?800|12(?:,|%2C)?000/
  });
  await page.locator('#fd-amount').fill('100000');
  await page.getByRole('button', { name: /Calculer le rendement/ }).click();
  const renderedArtwork = await verifyAppArtwork(page, 'fixed-deposit', 'rendered-result');

  const labeledControls = await page.evaluate(() => Array.from(
    document.querySelectorAll('input:not([type="hidden"]),select,textarea')
  ).filter((control) => {
    const label = control.id && document.querySelector(`label[for="${control.id}"]`);
    return !label && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby');
  }).map((control) => control.id || control.name || control.tagName));
  if (labeledControls.length) {
    throw new Error(`fixed-deposit: unlabeled controls ${JSON.stringify(labeledControls)}`);
  }

  await page.locator('#fd-country').focus();
  await page.keyboard.press('Tab');
  const focusedAfterCountry = await page.evaluate(() => document.activeElement && document.activeElement.id);
  if (focusedAfterCountry !== 'fd-tenor') {
    throw new Error(`fixed-deposit: keyboard order left country for ${focusedAfterCountry || 'nothing'}`);
  }

  const englishOracle = await page.evaluate(() => {
    const reviewedAllowlist = [
      'AfroTools', 'Fintech', 'Kenya', 'Nigeria', 'Ghana', 'Rwanda', 'Malawi',
      'Mozambique', 'Botswana', 'Zimbabwe', 'Angola', 'USD', 'NGN', 'KES', 'ZAR',
      'GHS', 'EGP', 'TZS', 'UGX', 'ZMW', 'MZN', 'RWF', 'MAD', 'ETB', 'XOF',
      'XAF', 'AOA', 'MWK', 'BWP', 'NAD'
    ];
    let visible = document.body.innerText;
    for (const allowed of reviewedAllowlist) visible = visible.split(allowed).join('');
    const patterns = [
      /\b(?:Fixed Deposit|Calculate|Calculator|Enter|Principal Amount|Annual Interest|Withholding Tax|Interest Type)\b/gi,
      /\b(?:Simple Interest|Compound|Total Maturity Value|Gross Interest|Tax Withheld|Net Interest|Monthly Equivalent)\b/gi,
      /\b(?:Effective Annual Rate|Opening Balance|Closing Balance|Frequently Asked Questions|Related tools)\b/gi
    ];
    return patterns.flatMap((pattern) => visible.match(pattern) || []);
  });
  if (englishOracle.length) {
    throw new Error(`fixed-deposit: residual English ${JSON.stringify(englishOracle)}`);
  }

  const fixedDepositLeakOwners = leakOwnersFor(
    /100000|110(?:,|%2C)?800|12(?:,|%2C)?000/,
    await page.evaluate(() => JSON.stringify(Object.entries(localStorage))),
    requests,
    consoleMessages
  );
  if (fixedDepositLeakOwners.length) {
    throw new Error(`fixed-deposit: raw financial fixture leaked into ${fixedDepositLeakOwners.join(', ')}`);
  }

  const overflow375 = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  if (overflow375 > 1) throw new Error(`fixed-deposit: 375px overflow is ${overflow375}px`);
  await page.setViewportSize({ width: 320, height: 720 });
  const overflow320 = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  if (overflow320 > 1) throw new Error(`fixed-deposit: 320px overflow is ${overflow320}px`);
  const textResize200 = await verifyTextResize200(page, 'fixed-deposit');
  const overflow200 = textResize200.resized.overflow;
  if (overflow200 > 1) throw new Error(`fixed-deposit: 200% reflow overflow is ${overflow200}px`);
  const themeContrast = await verifyDarkModeContrast(page, 'fixed-deposit');
  const { lightBackground, darkBackground, systemDarkBackground } = themeContrast;

  const seo = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    canonical: document.querySelector('link[rel="canonical"]').href,
    schema: Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((node) => JSON.parse(node.textContent))
  }));
  if (seo.lang !== 'fr') throw new Error('fixed-deposit: html language is not French');
  if (seo.canonical !== 'https://afrotools.com/fr/tools/depot-terme/') {
    throw new Error(`fixed-deposit: canonical mismatch ${seo.canonical}`);
  }
  if (!seo.schema.some((entry) => entry.inLanguage === 'fr')) {
    throw new Error('fixed-deposit: no French inLanguage schema');
  }
  if (pageErrors.length || consoleErrors.length) {
    throw new Error(`fixed-deposit: browser errors ${JSON.stringify({ pageErrors, consoleErrors })}`);
  }

  await context.close();
  return {
    route: '/fr/tools/depot-terme/',
    resultMutation: true,
    invalidFailClosed: true,
    invalidStateProof,
    primaryActionUngated: true,
    advertisedExports: [],
    exportProof: [],
    artwork: { initial: initialArtwork, renderedResult: renderedArtwork },
    contrast: themeContrast,
    privacy: { requestUrlLeak: false, requestBodyLeak: false, consoleLeak: false, storedFinancialDetails: false, screenshotsCaptured: false, testArtifactFixtureLeak: false },
    responsive: {
      width375Overflow: overflow375,
      width320Overflow: overflow320,
      initialTextResize200,
      textResize200
    },
    keyboard: { focusAfterCountry: focusedAfterCountry },
    accessibility: { unlabeledControls: labeledControls },
    languageOracle: { residualEnglish: englishOracle },
    lightBackground,
    darkBackground,
    systemDarkBackground,
    browser: { pageErrors, consoleErrors }
  };
}

async function verifyTBill(browser) {
  const context = await browser.newContext({
    colorScheme: 'light',
    viewport: { width: 375, height: 812 }
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const consoleMessages = [];
  const requests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    consoleMessages.push(message.text());
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', (request) => requests.push(captureRequest(request)));
  await page.goto(`${BASE_URL}/fr/tools/rendement-bons-tresor/`, {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });
  await page.locator('#tb-amount').waitFor();
  if (await page.locator('iframe').count()) throw new Error('tbill-calc: iframe found');
  const initialArtwork = await verifyAppArtwork(page, 'tbill-calc', 'initial');
  const initialTextResize200 = await verifyTextResize200(page, 'tbill-calc:initial');

  await page.locator('#tb-amount').fill('100000');
  await page.locator('#tb-rate').fill('12');
  await page.locator('#tb-tax').fill('10');
  await page.locator('#tb-tenor').selectOption('364');
  await page.locator('#tb-ratetype').selectOption('yield');
  await page.getByRole('button', { name: /Calculer le rendement/ }).click();
  const expectedPrice = 100000 / (1 + 0.12 * (364 / 365));
  const actualPrice = Number((await page.locator('#tb-price').textContent()).replace(/[^\d.-]/g, ''));
  if (Math.abs(actualPrice - expectedPrice) > 0.01) {
    throw new Error(`tbill-calc: expected purchase price ${expectedPrice}, received ${actualPrice}`);
  }
  const valid = await page.locator('#tb-results').innerText();
  for (const expected of ['Valeur nominale', 'Prix payé', 'Rendement net', 'Rendement net annualisé']) {
    if (!valid.toLocaleLowerCase('fr').includes(expected.toLocaleLowerCase('fr'))) {
      throw new Error(`tbill-calc: valid result is missing ${expected}; result=${JSON.stringify(valid)}`);
    }
  }
  const firstMaturity = await page.locator('#tb-maturity').textContent();
  await page.locator('#tb-rate').fill('15');
  await page.getByRole('button', { name: /Calculer le rendement/ }).click();
  const changedMaturity = await page.locator('#tb-maturity').textContent();
  if (changedMaturity === firstMaturity) throw new Error('tbill-calc: meaningful input did not mutate output');

  await page.locator('#tb-amount').fill('0');
  await page.getByRole('button', { name: /Calculer le rendement/ }).click();
  const invalid = await page.locator('#tb-error').textContent();
  if (!/^Saisissez une valeur nominale/.test(invalid)) {
    throw new Error(`tbill-calc: invalid result did not fail closed in French: ${invalid}`);
  }
  const invalidStateProof = await verifyInvalidStateCleared(page, context, {
    id: 'tbill-calc',
    resultSelector: '#tb-results',
    leakPattern: /100000|89311/
  });
  await page.locator('#tb-amount').fill('100000');
  await page.locator('#tb-rate').fill('12');
  await page.getByRole('button', { name: /Calculer le rendement/ }).click();
  const renderedArtwork = await verifyAppArtwork(page, 'tbill-calc', 'rendered-result');

  const unlabeledControls = await page.evaluate(() => Array.from(
    document.querySelectorAll('input:not([type="hidden"]),select,textarea')
  ).filter((control) => {
    const label = control.id && document.querySelector(`label[for="${control.id}"]`);
    return !label && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby');
  }).map((control) => control.id || control.name || control.tagName));
  if (unlabeledControls.length) {
    throw new Error(`tbill-calc: unlabeled controls ${JSON.stringify(unlabeledControls)}`);
  }
  await page.locator('#tb-country').focus();
  await page.keyboard.press('Tab');
  const focusedAfterCountry = await page.evaluate(() => document.activeElement && document.activeElement.id);
  if (focusedAfterCountry !== 'tb-tenor') {
    throw new Error(`tbill-calc: keyboard order left country for ${focusedAfterCountry || 'nothing'}`);
  }
  const englishOracle = await page.evaluate(() => {
    const allowlist = [
      'AfroTools', 'Fintech', 'Kenya', 'Nigeria', 'Ghana', 'Rwanda', 'USD', 'NGN',
      'KES', 'ZAR', 'GHS', 'EGP', 'TZS', 'UGX', 'ZMW', 'RWF', 'MAD'
    ];
    let text = document.body.innerText;
    for (const allowed of allowlist) text = text.split(allowed).join('');
    const patterns = [
      /\b(?:Treasury Bill|T-Bill|Calculate|Calculator|Enter|Face Value|You pay|Quoted Rate|Rate Type)\b/gi,
      /\b(?:Investment Yield|Discount Rate|Withholding Tax|Purchase Price|Gross Return|Net Return|Actual Yield)\b/gi,
      /\b(?:Annualised Net Yield|Frequently Asked Questions|Related tools|Estimate only)\b/gi
    ];
    return patterns.flatMap((pattern) => text.match(pattern) || []);
  });
  if (englishOracle.length) throw new Error(`tbill-calc: residual English ${JSON.stringify(englishOracle)}`);
  const tBillLeakOwners = leakOwnersFor(
    /100000|89311/,
    await page.evaluate(() => JSON.stringify(Object.entries(localStorage))),
    requests,
    consoleMessages
  );
  if (tBillLeakOwners.length) {
    throw new Error(`tbill-calc: raw fixture leaked into ${tBillLeakOwners.join(', ')}`);
  }

  const overflow375 = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  await page.setViewportSize({ width: 320, height: 720 });
  const overflow320 = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  const textResize200 = await verifyTextResize200(page, 'tbill-calc');
  const overflow200 = textResize200.resized.overflow;
  if ([overflow375, overflow320, overflow200].some((value) => value > 1)) {
    throw new Error(`tbill-calc: reflow overflow ${JSON.stringify({ overflow375, overflow320, overflow200 })}`);
  }
  const themeContrast = await verifyDarkModeContrast(page, 'tbill-calc');
  const { lightBackground, darkBackground, systemDarkBackground } = themeContrast;
  const seo = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    canonical: document.querySelector('link[rel="canonical"]').href,
    schema: Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((node) => JSON.parse(node.textContent))
  }));
  if (seo.lang !== 'fr'
      || seo.canonical !== 'https://afrotools.com/fr/tools/rendement-bons-tresor/'
      || !seo.schema.some((entry) => entry.inLanguage === 'fr')) {
    throw new Error(`tbill-calc: SEO language contract ${JSON.stringify(seo)}`);
  }
  if (pageErrors.length || consoleErrors.length) {
    throw new Error(`tbill-calc: browser errors ${JSON.stringify({ pageErrors, consoleErrors })}`);
  }
  await context.close();
  return {
    route: '/fr/tools/rendement-bons-tresor/',
    resultMutation: true,
    invalidFailClosed: true,
    invalidStateProof,
    primaryActionUngated: true,
    advertisedExports: [],
    exportProof: [],
    artwork: { initial: initialArtwork, renderedResult: renderedArtwork },
    contrast: themeContrast,
    privacy: { requestUrlLeak: false, requestBodyLeak: false, consoleLeak: false, storedFinancialDetails: false, screenshotsCaptured: false, testArtifactFixtureLeak: false },
    responsive: { width375Overflow: overflow375, width320Overflow: overflow320, initialTextResize200, textResize200 },
    keyboard: { focusAfterCountry: focusedAfterCountry },
    accessibility: { unlabeledControls },
    languageOracle: { residualEnglish: englishOracle },
    lightBackground,
    darkBackground,
    systemDarkBackground,
    browser: { pageErrors, consoleErrors }
  };
}

async function verifyRealReturn(browser) {
  const context = await browser.newContext({ colorScheme: 'light', viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const consoleMessages = [];
  const requests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    consoleMessages.push(message.text());
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', (request) => requests.push(captureRequest(request)));
  await page.goto(`${BASE_URL}/fr/tools/rendement-reel-inflation/`, {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });
  await page.locator('#rr-amount').waitFor();
  if (await page.locator('iframe').count()) throw new Error('real-return: iframe found');
  const initialArtwork = await verifyAppArtwork(page, 'real-return', 'initial');
  const initialTextResize200 = await verifyTextResize200(page, 'real-return:initial');
  await page.locator('#rr-nominal').fill('12');
  await page.locator('#rr-inflation').fill('8');
  await page.locator('#rr-amount').fill('100000');
  await page.locator('#rr-years').selectOption('3');
  await page.getByRole('button', { name: /Calculer le rendement réel/ }).click();
  const expectedRate = ((1.12 / 1.08) - 1) * 100;
  const actualRate = Number((await page.locator('#rr-real').textContent()).replace(/[^\d.-]/g, ''));
  if (Math.abs(actualRate - expectedRate) > 0.01) {
    throw new Error(`real-return: expected ${expectedRate}, received ${actualRate}`);
  }
  const positive = await page.locator('#rr-results').innerText();
  for (const expected of ['Rendement nominal', 'Pouvoir d’achat', 'Votre rendement réel est positif', '3 ans']) {
    if (!positive.toLocaleLowerCase('fr').includes(expected.toLocaleLowerCase('fr'))) {
      throw new Error(`real-return: positive result is missing ${expected}`);
    }
  }
  await page.locator('#rr-nominal').fill('5');
  await page.locator('#rr-inflation').fill('10');
  await page.getByRole('button', { name: /Calculer le rendement réel/ }).click();
  const negative = await page.locator('#rr-verdict').innerText();
  if (!/rendement réel est négatif/.test(negative)) {
    throw new Error(`real-return: negative scenario is not explained in French: ${negative}`);
  }
  await page.locator('#rr-amount').fill('0');
  await page.getByRole('button', { name: /Calculer le rendement réel/ }).click();
  const invalid = await page.locator('#rr-error').textContent();
  if (!/^Saisissez un montant/.test(invalid)) throw new Error(`real-return: invalid state ${invalid}`);
  const invalidStateProof = await verifyInvalidStateCleared(page, context, {
    id: 'real-return',
    resultSelector: '#rr-results',
    leakPattern: /100000|3\.70/
  });
  await page.locator('#rr-amount').fill('100000');
  await page.locator('#rr-nominal').fill('12');
  await page.locator('#rr-inflation').fill('8');
  await page.getByRole('button', { name: /Calculer le rendement réel/ }).click();
  const renderedArtwork = await verifyAppArtwork(page, 'real-return', 'rendered-result');
  const unlabeledControls = await page.evaluate(() => Array.from(
    document.querySelectorAll('input:not([type="hidden"]),select,textarea')
  ).filter((control) => {
    const label = control.id && document.querySelector(`label[for="${control.id}"]`);
    return !label && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby');
  }).map((control) => control.id || control.name || control.tagName));
  if (unlabeledControls.length) throw new Error(`real-return: unlabeled controls ${unlabeledControls}`);
  await page.locator('#rr-country').focus();
  await page.keyboard.press('Tab');
  const focusedAfterCountry = await page.evaluate(() => document.activeElement && document.activeElement.id);
  if (focusedAfterCountry !== 'rr-nominal') throw new Error(`real-return: keyboard order ${focusedAfterCountry}`);
  const englishOracle = await page.evaluate(() => {
    const allowlist = ['AfroTools', 'Fintech', 'Fisher', 'Kenya', 'Nigeria', 'Ghana', 'Rwanda', 'Malawi', 'NGN', 'GHS', 'EGP', 'ZMW', 'ZAR', 'KES', 'TZS', 'UGX', 'RWF', 'ETB', 'MAD', 'XOF', 'AOA', 'MWK'];
    let text = document.body.innerText;
    for (const allowed of allowlist) text = text.split(allowed).join('');
    const patterns = [
      /\b(?:Real Return|Calculate|Calculator|Enter|Nominal Interest Rate|Inflation Rate|Investment Amount|Years)\b/gi,
      /\b(?:Purchasing Power|Simple Approximation|Your real return|negative real return|Frequently Asked Questions|Related tools)\b/gi
    ];
    return patterns.flatMap((pattern) => text.match(pattern) || []);
  });
  if (englishOracle.length) throw new Error(`real-return: residual English ${JSON.stringify(englishOracle)}`);
  const realReturnLeakOwners = leakOwnersFor(
    /100000|3\.70/,
    await page.evaluate(() => JSON.stringify(Object.entries(localStorage))),
    requests,
    consoleMessages
  );
  if (realReturnLeakOwners.length) {
    throw new Error(`real-return: fixture leaked into ${realReturnLeakOwners.join(', ')}`);
  }
  const overflow375 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.setViewportSize({ width: 320, height: 720 });
  const overflow320 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const textResize200 = await verifyTextResize200(page, 'real-return');
  const overflow200 = textResize200.resized.overflow;
  if ([overflow375, overflow320, overflow200].some((value) => value > 1)) {
    throw new Error(`real-return: reflow overflow ${JSON.stringify({ overflow375, overflow320, overflow200 })}`);
  }
  const themeContrast = await verifyDarkModeContrast(page, 'real-return');
  const { lightBackground, darkBackground, systemDarkBackground } = themeContrast;
  const seo = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    canonical: document.querySelector('link[rel="canonical"]').href,
    schema: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((node) => JSON.parse(node.textContent))
  }));
  if (seo.lang !== 'fr'
      || seo.canonical !== 'https://afrotools.com/fr/tools/rendement-reel-inflation/'
      || !seo.schema.some((entry) => entry.inLanguage === 'fr')) {
    throw new Error(`real-return: SEO language contract ${JSON.stringify(seo)}`);
  }
  if (pageErrors.length || consoleErrors.length) {
    throw new Error(`real-return: browser errors ${JSON.stringify({ pageErrors, consoleErrors })}`);
  }
  await context.close();
  return {
    route: '/fr/tools/rendement-reel-inflation/',
    resultMutation: true,
    invalidFailClosed: true,
    invalidStateProof,
    primaryActionUngated: true,
    advertisedExports: [],
    exportProof: [],
    artwork: { initial: initialArtwork, renderedResult: renderedArtwork },
    contrast: themeContrast,
    privacy: { requestUrlLeak: false, requestBodyLeak: false, consoleLeak: false, storedFinancialDetails: false, screenshotsCaptured: false, testArtifactFixtureLeak: false },
    responsive: { width375Overflow: overflow375, width320Overflow: overflow320, initialTextResize200, textResize200 },
    keyboard: { focusAfterCountry: focusedAfterCountry },
    accessibility: { unlabeledControls },
    languageOracle: { residualEnglish: englishOracle },
    lightBackground,
    darkBackground,
    systemDarkBackground,
    browser: { pageErrors, consoleErrors }
  };
}

async function verifyLoanSharkCompare(browser) {
  return verifyStandardCalculator(browser, {
    id: 'loan-shark-compare',
    route: '/fr/tools/pret-usurier-vs-banque/',
    canonical: 'https://afrotools.com/fr/tools/pret-usurier-vs-banque/',
    readySelector: '#ls-amount',
    resultSelector: '#ls-results',
    errorSelector: '#ls-error',
    action: /Comparer les offres saisies/,
    values: {
      '#ls-currency': 'NGN',
      '#ls-amount': '500000',
      '#ls-tenor': '12',
      '#ls-shark-rate': '20',
      '#ls-bank-rate': '24'
    },
    mutation: { selector: '#ls-shark-rate', value: '10' },
    invalid: { selector: '#ls-amount', value: '0', message: /^Saisissez un montant de prêt/ },
    focus: { from: '#ls-currency', to: 'ls-amount' },
    allowlist: ['AfroTools', 'Fintech', 'NGN', 'KES', 'GHS', 'ZAR', 'UGX', 'TZS', 'RWF', 'ZMW', 'XOF', 'XAF', 'USD'],
    englishPatterns: [
      /\b(?:Loan Shark|Loan Amount|Loan Tenor|Monthly Rate|Bank nominal annual rate|Compare entered offers)\b/,
      /\b(?:Difference in Total Repayment|Monthly Flat-Rate Offer|Reducing-Balance Offer|Total interest|Effective annual rate)\b/,
      /\b(?:Frequently Asked Questions|Related tools|The entered offers|more over)\b/
    ],
    leakPattern: /500000|1,700,000/,
    assertValid: async (page, text) => {
      const flatTotal = Number((await page.locator('#ls-shark-total').textContent()).replace(/[^\d.-]/g, ''));
      if (Math.abs(flatTotal - 1700000) > 0.01) {
        throw new Error(`loan-shark-compare: expected flat total 1700000, received ${flatTotal}`);
      }
      for (const expected of ['Mensualité', 'Intérêts totaux', 'Taux annuel effectif', 'Rapport des coûts']) {
        if (!text.toLocaleLowerCase('fr').includes(expected.toLocaleLowerCase('fr'))) {
          throw new Error(`loan-shark-compare: result is missing ${expected}`);
        }
      }
    }
  });
}

async function verifyMicrofinanceLoan(browser) {
  return verifyStandardCalculator(browser, {
    id: 'microfinance-loan',
    route: '/fr/tools/pret-microfinance/',
    canonical: 'https://afrotools.com/fr/tools/pret-microfinance/',
    readySelector: '#mf-amount',
    resultSelector: '#mf-results',
    errorSelector: '#mf-error',
    action: /Calculer l’offre saisie/,
    values: {
      '#mf-currency': 'NGN',
      '#mf-amount': '200000',
      '#mf-rate': '3.5',
      '#mf-rate-type': 'flat',
      '#mf-tenor': '6',
      '#mf-fees': '10000',
      '#mf-bank-rate': '24'
    },
    mutation: { selector: '#mf-rate', value: '5' },
    invalid: { selector: '#mf-amount', value: '0', message: /^Saisissez un prêt/ },
    focus: { from: '#mf-currency', to: 'mf-amount' },
    allowlist: ['AfroTools', 'Fintech', 'NGN', 'KES', 'GHS', 'ZAR', 'UGX', 'TZS', 'RWF', 'ZMW', 'XOF', 'XAF', 'USD'],
    englishPatterns: [
      /\b(?:Microfinance Loan|Loan Amount|Monthly Interest Rate|Interest calculation|Tenor|Upfront fees)\b/,
      /\b(?:Calculate entered offer|Monthly Repayment|Total Repayment|Finance Cost|Effective Annual Rate)\b/,
      /\b(?:Net proceeds|Flat interest|Reducing balance|Frequently Asked Questions|Related tools)\b/
    ],
    leakPattern: /200000|252000/,
    assertValid: async (page, text) => {
      const total = Number((await page.locator('#mf-total').textContent()).replace(/[^\d.-]/g, ''));
      if (Math.abs(total - 242000) > 0.01) {
        throw new Error(`microfinance-loan: expected flat total 242000, received ${total}`);
      }
      for (const expected of ['Intérêts forfaitaires', 'Produit net', 'Taux annuel effectif']) {
        if (!text.toLocaleLowerCase('fr').includes(expected.toLocaleLowerCase('fr'))) {
          throw new Error(`microfinance-loan: result is missing ${expected}`);
        }
      }
    }
  });
}

async function verifyDigitalLending(browser) {
  return verifyStandardCalculator(browser, {
    id: 'digital-lending',
    route: '/fr/tools/taux-credit-digital/',
    canonical: 'https://afrotools.com/fr/tools/taux-credit-digital/',
    readySelector: '#dl-amount',
    resultSelector: '#dl-results',
    errorSelector: '#dl-error',
    action: /Comparer les offres saisies/,
    values: {
      '#dl-amount': '50000',
      '#dl-days': '30',
      '#dl-currency': 'NGN',
      '#dl-name-a': 'Offre A',
      '#dl-total-a': '55000',
      '#dl-name-b': 'Offre B',
      '#dl-total-b': '57500',
      '#dl-name-c': 'Offre C',
      '#dl-total-c': '60000'
    },
    mutation: { selector: '#dl-total-a', value: '65000' },
    invalid: { selector: '#dl-amount', value: '0', message: /^Saisissez un montant/ },
    focus: { from: '#dl-amount', to: 'dl-days' },
    allowlist: ['AfroTools', 'Fintech', 'NGN', 'KES', 'GHS', 'ZAR', 'UGX', 'TZS', 'RWF', 'ZMW', 'XOF', 'XAF', 'USD'],
    englishPatterns: [
      /\b(?:Digital Loan|Digital Lending|Loan Amount|Loan duration|Offer [ABC]|Total repayment)\b/,
      /\b(?:Compare entered offers|Amount Received|Finance Cost|Term Cost|Effective Annual Rate|LOWEST REPAYMENT)\b/,
      /\b(?:Frequently Asked Questions|Related tools|Enter an amount)\b/
    ],
    leakPattern: /50000|55000|57500|60000/,
    assertValid: async (page, text) => {
      const firstRow = await page.locator('#dl-tbody tr').first().innerText();
      if (!firstRow.includes('Offre A') || !firstRow.includes('NGN 5,000.00') || !firstRow.includes('NGN 55,000.00')) {
        throw new Error(`digital-lending: first row fixture mismatch ${firstRow}`);
      }
      if (!text.includes('REMBOURSEMENT LE PLUS BAS')) {
        throw new Error('digital-lending: lowest repayment badge is missing');
      }
    }
  });
}

async function verifySacco(browser) {
  return verifyStandardCalculator(browser, {
    id: 'sacco-calc',
    route: '/fr/tools/calculateur-sacco-cooperative/',
    canonical: 'https://afrotools.com/fr/tools/calculateur-sacco-cooperative/',
    readySelector: '#sc-monthly',
    resultSelector: '#sc-results',
    errorSelector: '#sc-error',
    action: /Calculer le scénario d’épargne/,
    values: {
      '#sc-currency': 'KES',
      '#sc-monthly': '5000',
      '#sc-years': '3',
      '#sc-div': '12',
      '#sc-bank-rate': '4',
      '#sc-loan-mult': '3'
    },
    mutation: { selector: '#sc-monthly', value: '6000' },
    invalid: { selector: '#sc-monthly', value: '0', message: /^Saisissez une cotisation/ },
    focus: { from: '#sc-currency', to: 'sc-monthly' },
    allowlist: ['AfroTools', 'Fintech', 'SACCO', 'NGN', 'KES', 'GHS', 'ZAR', 'UGX', 'TZS', 'RWF', 'ZMW', 'XOF', 'XAF', 'USD'],
    englishPatterns: [
      /\b(?:Credit Union|Savings Calculator|Monthly Contribution|Membership Duration|Annual Dividend Rate)\b/,
      /\b(?:Bank Savings Rate|Loan Multiplier|Calculate savings scenario|Total Contributions|Loan Capacity)\b/,
      /\b(?:month-end contributions|Frequently Asked Questions|Related tools|Scenario only)\b/
    ],
    leakPattern: /5000|180000/,
    assertValid: async (page, text) => {
      const principal = Number((await page.locator('#sc-principal').textContent()).replace(/[^\d.-]/g, ''));
      const balance = Number((await page.locator('#sc-total').textContent()).replace(/[^\d.-]/g, ''));
      const loanCap = Number((await page.locator('#sc-loan-cap').textContent()).replace(/[^\d.-]/g, ''));
      if (Math.abs(principal - 180000) > 0.01 || Math.abs(loanCap - balance * 3) > 0.02) {
        throw new Error(`sacco-calc: fixture mismatch ${JSON.stringify({ principal, balance, loanCap })}`);
      }
      if (!text.includes('36 cotisations versées en fin de mois')) {
        throw new Error('sacco-calc: contribution schedule is missing');
      }
    }
  });
}

async function verifyPaymentGateway(browser) {
  return verifyStandardCalculator(browser, {
    id: 'payment-gateway',
    route: '/fr/tools/comparateur-passerelle-paiement/',
    canonical: 'https://afrotools.com/fr/tools/comparateur-passerelle-paiement/',
    readySelector: '#pg-avg-txn',
    resultSelector: '#pg-results',
    errorSelector: '#pg-error',
    action: /Comparer les passerelles/,
    values: {
      '#pg-currency': 'NGN',
      '#pg-avg-txn': '15000',
      '#pg-monthly-txns': '200',
      '#pg-name-1': 'Passerelle A',
      '#pg-rate-1': '1.5',
      '#pg-flat-1': '100',
      '#pg-cap-1': '2000',
      '#pg-name-2': 'Passerelle B',
      '#pg-rate-2': '1.4',
      '#pg-flat-2': '0',
      '#pg-cap-2': '0',
      '#pg-name-3': 'Passerelle C',
      '#pg-rate-3': '2',
      '#pg-flat-3': '0',
      '#pg-cap-3': '0'
    },
    mutation: { selector: '#pg-rate-2', value: '2.5' },
    invalid: { selector: '#pg-avg-txn', value: '0', message: /^Saisissez une valeur de transaction/ },
    focus: { from: '#pg-currency', to: 'pg-avg-txn' },
    allowlist: ['AfroTools', 'Fintech', 'TXT', 'NGN', 'KES', 'GHS', 'ZAR', 'UGX', 'TZS', 'RWF', 'ZMW', 'XOF', 'XAF', 'USD'],
    englishPatterns: [
      /\b(?:Payment Gateway|Gateway Fee|Average Transaction Value|Monthly Transaction Count|Gateway name)\b/,
      /\b(?:Percentage fee|Flat fee|Fee cap|Compare Gateways|Monthly Volume|Monthly fees)\b/,
      /\b(?:Cheapest Monthly Fee|Most Expensive Fee|Annual Saving|Frequently Asked Questions|Related tools)\b/,
      /\b(?:lowest entered quote|Effective rate|Estimated processing fees|Planning estimate)\b/
    ],
    leakPattern: /15000|3000000|42000|65000|276000/,
    advertisedExports: ['TXT'],
    assertValid: async (page, text) => {
      const monthlyVolume = Number((await page.locator('#pg-monthly-vol').textContent()).replace(/[^\d.-]/g, ''));
      const cheapest = Number((await page.locator('#pg-cheapest-fee').textContent()).replace(/[^\d.-]/g, ''));
      const expensive = Number((await page.locator('#pg-most-exp').textContent()).replace(/[^\d.-]/g, ''));
      const annualSaving = Number((await page.locator('#pg-annual-saving').textContent()).replace(/[^\d.-]/g, ''));
      const winner = await page.locator('#pg-winner-name').textContent();
      if (
        Math.abs(monthlyVolume - 3000000) > 0.01
        || Math.abs(cheapest - 42000) > 0.01
        || Math.abs(expensive - 65000) > 0.01
        || Math.abs(annualSaving - 276000) > 0.01
        || !winner.includes('Passerelle B')
      ) {
        throw new Error(`payment-gateway: fixture mismatch ${JSON.stringify({
          monthlyVolume, cheapest, expensive, annualSaving, winner
        })}`);
      }
      const rows = await page.locator('#pg-table-body tr').allInnerTexts();
      if (rows.length !== 3 || !rows[0].includes('NGN 210.00') || !rows[0].includes('NGN 42,000.00')) {
        throw new Error(`payment-gateway: ranked quote rows mismatch ${JSON.stringify(rows)}`);
      }
      if (!text.includes('devis saisi le moins cher') || !text.includes('Taux effectif')) {
        throw new Error('payment-gateway: French dynamic result labels are missing');
      }
    },
    verifyExports: async (page) => {
      await page.locator('[data-fr-finpay-save]').click();
      const marker = await page.evaluate(() => localStorage.getItem('afro_fr_fintech_payment_marker_v1'));
      if (!marker || /15000|42000|Passerelle B/.test(marker)) {
        throw new Error('payment-gateway: raw financial fixture leaked into local storage');
      }
      const markerValue = JSON.parse(marker);
      if (markerValue.toolId !== 'payment-gateway' || markerValue.storesFinancialDetails !== false) {
        throw new Error(`payment-gateway: save marker contract mismatch ${marker}`);
      }
      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-fr-finpay-download]').click();
      const download = await downloadPromise;
      const downloadPath = await download.path();
      const text = fs.readFileSync(downloadPath, 'utf8');
      if (
        download.suggestedFilename() !== 'payment-gateway-resultat-paiement.txt'
        || !text.includes('Passerelle B')
        || !text.includes('NGN 42,000.00')
        || !text.includes('Taux effectif')
      ) {
        throw new Error(`payment-gateway: reopened TXT contract mismatch ${JSON.stringify({
          filename: download.suggestedFilename(),
          bytes: Buffer.byteLength(text),
          preview: text.slice(0, 240)
        })}`);
      }
    }
  });
}

async function verifyBnpl(browser) {
  return verifyStandardCalculator(browser, {
    id: 'bnpl-calc',
    route: '/fr/tools/cout-bnpl/',
    canonical: 'https://afrotools.com/fr/tools/cout-bnpl/',
    readySelector: '#bnpl-price',
    resultSelector: '#bnpl-results',
    errorSelector: '#bnpl-error',
    action: /Calculer le coût du paiement fractionné/,
    values: {
      '#bnpl-currency': 'NGN',
      '#bnpl-price': '50000',
      '#bnpl-installments': '4',
      '#bnpl-rate': '8.5',
      '#bnpl-first-payment': 'now'
    },
    mutation: { selector: '#bnpl-rate', value: '10' },
    invalid: { selector: '#bnpl-price', value: '0', message: /^Saisissez un prix positif/ },
    focus: { from: '#bnpl-currency', to: 'bnpl-price' },
    allowlist: ['AfroTools', 'Fintech', 'NGN', 'KES', 'GHS', 'ZAR', 'UGX', 'TZS', 'RWF', 'ZMW', 'XOF', 'XAF', 'USD'],
    englishPatterns: [
      /\b(?:BNPL Cost|Item Price|Number of Installments|Total BNPL Fee|First Payment Timing)\b/,
      /\b(?:At checkout|One month after purchase|Calculate BNPL Cost|Per Installment|Total You Pay)\b/,
      /\b(?:Total Fee|Effective APR|Installment|Total payable|Cash price|Frequently Asked Questions|Related tools)\b/,
      /\b(?:Enter a positive item price|This checkout payment|Planning estimate)\b/
    ],
    leakPattern: /50000|54250|13562|4250|95\.05/,
    assertValid: async (page, text) => {
      const extraCost = Number((await page.locator('#bnpl-extra-cost').textContent()).replace(/[^\d.-]/g, ''));
      const installment = Number((await page.locator('#bnpl-installment-amt').textContent()).replace(/[^\d.-]/g, ''));
      const total = Number((await page.locator('#bnpl-total').textContent()).replace(/[^\d.-]/g, ''));
      const apr = Number((await page.locator('#bnpl-apr').textContent()).replace(/[^\d.-]/g, ''));
      const schedule = await page.locator('#bnpl-schedule').innerText();
      if (
        Math.abs(extraCost - 4250) > 0.01
        || Math.abs(installment - 13562.5) > 0.01
        || Math.abs(total - 54250) > 0.01
        || Math.abs(apr - 95.06) > 0.01
        || !schedule.includes('Échéance 1 — Maintenant')
        || !schedule.includes('Échéance 4 — Mois 3')
      ) {
        throw new Error(`bnpl-calc: fixture mismatch ${JSON.stringify({
          extraCost, installment, total, apr, schedule
        })}`);
      }
      if (!text.includes('Total à payer') || !text.includes('Prix au comptant')) {
        throw new Error('bnpl-calc: French dynamic result labels are missing');
      }
    }
  });
}

async function verifyEmergencyFund(browser) {
  return verifyStandardCalculator(browser, {
    id: 'emergency-fund',
    route: '/fr/tools/fonds-urgence/',
    canonical: 'https://afrotools.com/fr/tools/fonds-urgence/',
    readySelector: '#ef-monthly',
    resultSelector: '#ef-results',
    errorSelector: '#ef-error',
    action: /Calculer le fonds d’urgence/,
    values: {
      '#ef-currency': 'NGN',
      '#ef-monthly': '150000',
      '#ef-months': '6',
      '#ef-current': '300000',
      '#ef-monthly-save': '30000',
      '#ef-inflation': '10',
      '#ef-inflation-years': '3'
    },
    mutation: { selector: '#ef-monthly-save', value: '40000' },
    invalid: { selector: '#ef-monthly', value: '0', message: /^Saisissez des dépenses essentielles positives/ },
    focus: { from: '#ef-currency', to: 'ef-monthly' },
    allowlist: ['AfroTools', 'Fintech', 'NGN', 'KES', 'GHS', 'ZAR', 'UGX', 'TZS', 'RWF', 'ZMW', 'XOF', 'XAF', 'USD'],
    englishPatterns: [
      /\b(?:Emergency Fund|Monthly Essential Expenses|Target Coverage|Current Emergency Savings)\b/,
      /\b(?:Monthly Savings Capacity|Planning Inflation Rate|Inflation Planning Horizon|Calculate Emergency Fund)\b/,
      /\b(?:Current Gap|Months to Reach Goal|Monthly Saving for 12-Month Goal|Inflation-Adjusted Target)\b/,
      /\b(?:Progress to Goal|Goal reached|Add monthly saving|Frequently Asked Questions|Related tools)\b/
    ],
    leakPattern: /150000|300000|600000|900000|1197900/,
    assertValid: async (page, text) => {
      const target = Number((await page.locator('#ef-target').textContent()).replace(/[^\d.-]/g, ''));
      const gap = Number((await page.locator('#ef-gap').textContent()).replace(/[^\d.-]/g, ''));
      const monthlyNeed = Number((await page.locator('#ef-monthly-need').textContent()).replace(/[^\d.-]/g, ''));
      const inflationAdjusted = Number((await page.locator('#ef-inflation-adj').textContent()).replace(/[^\d.-]/g, ''));
      const monthsToGoal = await page.locator('#ef-months-to-goal').textContent();
      const progress = await page.locator('#ef-progress-pct').textContent();
      const resultSub = await page.locator('#ef-sub').textContent();
      const inflationLabel = await page.locator('#ef-inflation-label').textContent();
      if (
        Math.abs(target - 900000) > 0.01
        || Math.abs(gap - 600000) > 0.01
        || Math.abs(monthlyNeed - 50000) > 0.01
        || Math.abs(inflationAdjusted - 1197900) > 0.01
        || monthsToGoal.trim() !== '20 mois'
        || progress.trim() !== '33%'
      ) {
        throw new Error(`emergency-fund: fixture mismatch ${JSON.stringify({
          target, gap, monthlyNeed, inflationAdjusted, monthsToGoal, progress
        })}`);
      }
      if (!resultSub.includes('6 mois de dépenses') || inflationLabel.trim() !== 'Objectif corrigé de l’inflation (3 ans)') {
        throw new Error('emergency-fund: French dynamic result labels are missing');
      }
    }
  });
}

async function verifyAssetFinance(browser) {
  return verifyStandardCalculator(browser, {
    id: 'asset-finance',
    route: '/fr/tools/financement-actifs/',
    canonical: 'https://afrotools.com/fr/tools/financement-actifs/',
    readySelector: '#af-price',
    resultSelector: '#af-results',
    errorSelector: '#af-error',
    action: /Calculer le coût du financement/,
    values: {
      '#af-currency': 'NGN',
      '#af-price': '5000000',
      '#af-deposit': '20',
      '#af-rate': '22',
      '#af-tenor': '36',
      '#af-balloon': '10'
    },
    mutation: { selector: '#af-rate', value: '18' },
    invalid: { selector: '#af-price', value: '0', message: /^Saisissez un prix positif/ },
    focus: { from: '#af-currency', to: 'af-price' },
    allowlist: ['AfroTools', 'Fintech', 'NGN', 'KES', 'GHS', 'ZAR', 'UGX', 'TZS', 'RWF', 'ZMW', 'XOF', 'XAF', 'USD'],
    englishPatterns: [
      /\b(?:Asset Finance|Asset Price|Invoice Value|Deposit|Down Payment|Annual Interest Rate)\b/,
      /\b(?:Repayment Period|Balloon Payment|Calculate Finance Cost|Monthly Installment|Amount Financed)\b/,
      /\b(?:Total You Pay|Total Interest|Deposit Required|Effective Annual Rate|Financed|None)\b/,
      /\b(?:Frequently Asked Questions|Related tools|Enter a positive price|Model)\b/
    ],
    leakPattern: /5000000|4000000|142833|6641997|1641997|1000000|500000/,
    assertValid: async (page) => {
      const monthly = Number((await page.locator('#af-monthly').textContent()).replace(/[^\d.-]/g, ''));
      const financed = Number((await page.locator('#af-financed').textContent()).replace(/[^\d.-]/g, ''));
      const total = Number((await page.locator('#af-total-pay').textContent()).replace(/[^\d.-]/g, ''));
      const interest = Number((await page.locator('#af-total-interest').textContent()).replace(/[^\d.-]/g, ''));
      const deposit = Number((await page.locator('#af-deposit-amt').textContent()).replace(/[^\d.-]/g, ''));
      const balloon = Number((await page.locator('#af-balloon-amt').textContent()).replace(/[^\d.-]/g, ''));
      const effectiveRate = Number((await page.locator('#af-effective-rate').textContent()).replace(/[^\d.-]/g, ''));
      const sub = await page.locator('#af-sub').textContent();
      if (
        Math.abs(monthly - 142833.25) > 0.01
        || Math.abs(financed - 4000000) > 0.01
        || Math.abs(total - 6641997.1) > 0.01
        || Math.abs(interest - 1641997.1) > 0.01
        || Math.abs(deposit - 1000000) > 0.01
        || Math.abs(balloon - 500000) > 0.01
        || Math.abs(effectiveRate - 24.36) > 0.01
        || !sub.includes('Montant financé: NGN 4,000,000.00 sur 36 mois')
      ) {
        throw new Error(`asset-finance: fixture mismatch ${JSON.stringify({
          monthly, financed, total, interest, deposit, balloon, effectiveRate, sub
        })}`);
      }
    }
  });
}

async function verifyB2bPayment(browser) {
  return verifyStandardCalculator(browser, {
    id: 'b2b-payment',
    route: '/fr/tools/paiement-b2b-transfrontalier/',
    canonical: 'https://afrotools.com/fr/tools/paiement-b2b-transfrontalier/',
    readySelector: '#b2b-amount',
    resultSelector: '#b2b-results',
    errorSelector: '#b2b-error',
    action: /Comparer les devis transfrontaliers/,
    values: {
      '#b2b-currency': 'USD',
      '#b2b-amount': '731928.47',
      '#b2b-frequency': '4',
      '#b2b-name-1': 'SENSITIVE-7Q9X-A',
      '#b2b-pct-1': '0.5',
      '#b2b-flat-1': '35',
      '#b2b-fx-1': '1.5',
      '#b2b-days-1': '4',
      '#b2b-name-2': 'SENSITIVE-7Q9X-B',
      '#b2b-pct-2': '0.8',
      '#b2b-flat-2': '0',
      '#b2b-fx-2': '0.5',
      '#b2b-days-2': '2',
      '#b2b-name-3': 'SENSITIVE-7Q9X-C',
      '#b2b-pct-3': '1',
      '#b2b-flat-3': '0',
      '#b2b-fx-3': '0.8',
      '#b2b-days-3': '1'
    },
    mutation: { selector: '#b2b-fx-2', value: '1.6' },
    invalid: { selector: '#b2b-amount', value: '0', message: /^Saisissez un montant positif/ },
    focus: { from: '#b2b-currency', to: 'b2b-amount' },
    allowlist: ['AfroTools', 'Fintech', 'B2B', 'TXT', 'USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR', 'XOF', 'XAF'],
    englishPatterns: [
      /\b(?:Cross-Border|Send Currency|Amount Sent|Monthly Payment Frequency|Option name)\b/,
      /\b(?:Transfer fee|Flat fee|FX spread|Settlement days|Compare entered quotes)\b/,
      /\b(?:Per transaction|Effective rate|Settlement|Cheapest Option Fee|Quote A Cost)\b/,
      /\b(?:Monthly Saving|Annual Saving|Total cost|Frequently Asked Questions|Related tools)\b/
    ],
    leakPattern: /731928(?:\.|%2E)47|SENSITIVE(?:-|%2D)7Q9X/i,
    advertisedExports: ['TXT'],
    assertValid: async (page) => {
      const cheapest = Number((await page.locator('#b2b-cheapest-fee').textContent()).replace(/[^\d.-]/g, ''));
      const quoteA = Number((await page.locator('#b2b-swift-fee').textContent()).replace(/[^\d.-]/g, ''));
      const monthlySaving = Number((await page.locator('#b2b-monthly-saving').textContent()).replace(/[^\d.-]/g, ''));
      const annualSaving = Number((await page.locator('#b2b-annual-saving').textContent()).replace(/[^\d.-]/g, ''));
      const winner = await page.locator('#b2b-winner-name').textContent();
      const winnerMetrics = await page.locator('#b2b-winner-metrics').innerText();
      const firstRow = await page.locator('#b2b-table-body tr').first().innerText();
      if (
        Math.abs(cheapest - 9515.07011) > 0.01
        || Math.abs(quoteA - 14673.5694) > 0.01
        || Math.abs(monthlySaving - 20633.99716) > 0.01
        || Math.abs(annualSaving - 247607.96592) > 0.01
        || winner.trim() !== 'SENSITIVE-7Q9X-B'
        || !winnerMetrics.includes('1.30%')
        || !winnerMetrics.includes('2.0 jours')
        || !firstRow.includes('USD 5,855.43')
        || !firstRow.includes('USD 3,659.64')
        || !firstRow.includes('USD 9,515.07')
      ) {
        throw new Error(`b2b-payment: fixture mismatch ${JSON.stringify({
          cheapest, quoteA, monthlySaving, annualSaving, winner, winnerMetrics, firstRow
        })}`);
      }
    },
    verifyExports: async (page) => {
      await page.locator('[data-fr-finpay-save]').click();
      const marker = await page.evaluate(() => localStorage.getItem('afro_fr_fintech_payment_marker_v1'));
      if (!marker || /731928|9515|14673|SENSITIVE-7Q9X/.test(marker)) {
        throw new Error('b2b-payment: raw financial fixture leaked into local storage');
      }
      const markerValue = JSON.parse(marker);
      if (markerValue.toolId !== 'b2b-payment' || markerValue.storesFinancialDetails !== false) {
        throw new Error(`b2b-payment: save marker contract mismatch ${marker}`);
      }
      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-fr-finpay-download]').click();
      const download = await downloadPromise;
      const downloadPath = await download.path();
      const text = fs.readFileSync(downloadPath, 'utf8');
      if (
        download.suggestedFilename() !== 'b2b-payment-resultat-paiement.txt'
        || !text.includes('SENSITIVE-7Q9X-B')
        || !text.includes('USD 9,515.07')
        || !text.includes('Taux effectif')
        || !text.includes('2.0 jours')
      ) {
        throw new Error(`b2b-payment: reopened TXT contract mismatch ${JSON.stringify({
          filename: download.suggestedFilename(),
          bytes: Buffer.byteLength(text),
          preview: text.slice(0, 260)
        })}`);
      }
    }
  });
}

async function verifyBillSplit(browser) {
  const nameSelector = (index) => `#bs-people .person-row:nth-child(${index}) input[type="text"]`;
  return verifyStandardCalculator(browser, {
    id: 'bill-split',
    route: '/fr/tools/partage-addition/',
    canonical: 'https://afrotools.com/fr/tools/partage-addition/',
    readySelector: '#bs-total',
    resultSelector: '#bs-results',
    errorSelector: '#bs-error',
    action: /Calculer le partage/,
    values: {
      '#bs-currency': 'NGN',
      '#bs-total': '100.01',
      '#bs-tip': '10',
      '#bs-method': 'equal',
      [nameSelector(1)]: 'Awa',
      [nameSelector(2)]: 'Binta',
      [nameSelector(3)]: 'Chidi',
      [nameSelector(4)]: 'Dayo'
    },
    mutation: { selector: '#bs-total', value: '120.01' },
    invalid: { selector: '#bs-total', value: '0', message: /^Saisissez une addition supérieure à zéro/ },
    focus: { from: '#bs-currency', to: 'bs-total' },
    allowlist: ['AfroTools', 'Fintech', 'Awa', 'Binta', 'Chidi', 'Dayo', 'NGN', 'KES', 'GHS', 'ZAR', 'UGX', 'TZS', 'RWF', 'ZMW', 'XOF', 'XAF', 'USD'],
    englishPatterns: [
      /\b(?:Bill Split|Total Bill Amount|Tip|Service Charge|Split Method|Equal Split)\b/,
      /\b(?:Custom Percentages|Add Person|Calculate Split|Per Person|Average Share)\b/,
      /\b(?:Subtotal|Tip Amount|Grand Total|People Splitting|Person \d|Remove person)\b/,
      /\b(?:of total|Frequently Asked Questions|Related tools|Enter a bill above zero)\b/
    ],
    leakPattern: /100\.01|110\.01|27\.51|44\.01|Awa|Binta|Chidi|Dayo/,
    assertValid: async (page) => {
      const subtotal = Number((await page.locator('#bs-subtotal').textContent()).replace(/[^\d.-]/g, ''));
      const charge = Number((await page.locator('#bs-tip-amt').textContent()).replace(/[^\d.-]/g, ''));
      const grand = Number((await page.locator('#bs-grand-total').textContent()).replace(/[^\d.-]/g, ''));
      const equalAmounts = await page.locator('#bs-person-cards .person-amt').allTextContents();
      const equalCents = equalAmounts.map((value) => Math.round(Number(value.replace(/[^\d.-]/g, '')) * 100));
      if (
        Math.abs(subtotal - 100.01) > 0.001
        || Math.abs(charge - 10) > 0.001
        || Math.abs(grand - 110.01) > 0.001
        || equalCents.join(',') !== '2751,2750,2750,2750'
        || equalCents.reduce((sum, value) => sum + value, 0) !== 11001
      ) {
        throw new Error(`bill-split: equal allocation fixture mismatch ${JSON.stringify({
          subtotal, charge, grand, equalAmounts, equalCents
        })}`);
      }

      await page.getByRole('button', { name: 'Ajouter une personne' }).click();
      const fifthRow = page.locator('#bs-people .person-row').nth(4);
      if (
        await page.locator('#bs-people .person-row').count() !== 5
        || await fifthRow.locator('input[type="text"]').inputValue() !== 'Personne 5'
        || await fifthRow.locator('input[type="text"]').getAttribute('aria-label') !== 'Personne 5 nom'
        || await fifthRow.locator('.btn-rm').getAttribute('aria-label') !== 'Retirer la personne 5'
      ) {
        throw new Error('bill-split: French add-person runtime contract mismatch');
      }
      await fifthRow.locator('.btn-rm').click();
      if (await page.locator('#bs-people .person-row').count() !== 4) {
        throw new Error('bill-split: remove-person control did not remove the added row');
      }

      await page.locator('#bs-method').selectOption('custom');
      for (const [selector, value] of [
        ['#bs-p0-pct', '10'],
        ['#bs-p1-pct', '20'],
        ['#bs-p2-pct', '30'],
        ['#bs-p3-pct', '40']
      ]) await page.locator(selector).fill(value);
      await page.getByRole('button', { name: /Calculer le partage/ }).click();
      const customAmounts = await page.locator('#bs-person-cards .person-amt').allTextContents();
      const customCents = customAmounts.map((value) => Math.round(Number(value.replace(/[^\d.-]/g, '')) * 100));
      if (
        customCents.join(',') !== '1100,2200,3300,4401'
        || customCents.reduce((sum, value) => sum + value, 0) !== 11001
        || (await page.locator('#bs-primary-label').textContent()).trim() !== 'Part moyenne'
      ) {
        throw new Error(`bill-split: custom allocation fixture mismatch ${JSON.stringify({
          customAmounts, customCents
        })}`);
      }
      await page.locator('#bs-p3-pct').fill('30');
      await page.getByRole('button', { name: /Calculer le partage/ }).click();
      const customInvalid = await page.locator('#bs-error').textContent();
      if (!/^Chaque pourcentage personnalisé/.test(customInvalid)) {
        throw new Error(`bill-split: custom percentages did not fail closed in French: ${customInvalid}`);
      }
      await page.locator('#bs-method').selectOption('equal');
      await page.getByRole('button', { name: /Calculer le partage/ }).click();
    }
  });
}

async function verifyBondYield(browser) {
  return verifyStandardCalculator(browser, {
    id: 'bond-yield',
    route: '/fr/tools/rendement-obligations/',
    canonical: 'https://afrotools.com/fr/tools/rendement-obligations/',
    readySelector: '#by-face',
    resultSelector: '#by-results',
    errorSelector: '#by-error',
    action: /Calculer le rendement obligataire/,
    values: {
      '#by-currency': 'NGN',
      '#by-face': '1000000',
      '#by-coupon': '17',
      '#by-price': '95',
      '#by-years': '5',
      '#by-freq': '2'
    },
    mutation: { selector: '#by-price', value: '90' },
    invalid: { selector: '#by-face', value: '0', message: /^Saisissez une valeur nominale/ },
    focus: { from: '#by-currency', to: 'by-face' },
    allowlist: ['AfroTools', 'Fintech', 'NGN', 'KES', 'GHS', 'ZAR', 'UGX', 'TZS', 'RWF', 'ZMW', 'XOF', 'XAF', 'USD'],
    englishPatterns: [
      /\b(?:Bond Yield|Government Bond|Face Value|Coupon Rate|Market Price|Years to Maturity)\b/,
      /\b(?:Coupon Frequency|Annual|Semi-Annual|Quarterly|Calculate Bond Yield|Current Yield)\b/,
      /\b(?:Annual Coupon Income|Net Cash Gain|of face|periods|Frequently Asked Questions|Related tools)\b/,
      /\b(?:Enter positive face|Exact discounted cash flows|How yield to maturity is solved)\b/
    ],
    leakPattern: /1000000|950000|170000|900000|19\.44|17\.89/,
    assertValid: async (page) => {
      const ytm = Number((await page.locator('#by-ytm').textContent()).replace(/[^\d.-]/g, ''));
      const currentYield = Number((await page.locator('#by-current-yield').textContent()).replace(/[^\d.-]/g, ''));
      const annualCoupon = Number((await page.locator('#by-annual-coupon').textContent()).replace(/[^\d.-]/g, ''));
      const totalReturn = Number((await page.locator('#by-total-return').textContent()).replace(/[^\d.-]/g, ''));
      const marketPrice = Number((await page.locator('#by-market-price').textContent()).replace(/[^\d.-]/g, ''));
      const sub = await page.locator('#by-sub').textContent();
      if (
        Math.abs(ytm - 19.44) > 0.01
        || Math.abs(currentYield - 17.89) > 0.01
        || Math.abs(annualCoupon - 170000) > 0.01
        || Math.abs(totalReturn - 900000) > 0.01
        || Math.abs(marketPrice - 950000) > 0.01
        || sub.trim() !== 'Coupon: 17.00% | Prix: 95.00% de la valeur nominale | 10 périodes'
      ) {
        throw new Error(`bond-yield: fixture mismatch ${JSON.stringify({
          ytm, currentYield, annualCoupon, totalReturn, marketPrice, sub
        })}`);
      }
    }
  });
}

async function verifyCreditScore(browser) {
  return verifyStandardCalculator(browser, {
    id: 'credit-score',
    route: '/fr/tools/score-credit/',
    canonical: 'https://afrotools.com/fr/tools/score-credit/',
    readySelector: '#cs-payment',
    resultSelector: '#cs-results',
    errorSelector: '#cs-error',
    action: /Examiner les facteurs du profil/,
    values: {
      '#cs-payment': '85',
      '#cs-utilization': '65',
      '#cs-age': '60',
      '#cs-mix': '80',
      '#cs-inquiries': '30'
    },
    mutation: { selector: '#cs-age', value: '80' },
    invalid: {
      selector: '#cs-payment',
      value: '101',
      message: /^Choisissez une valeur valide/,
      apply: async (page) => {
        await page.locator('#cs-payment').evaluate((select) => {
          const option = document.createElement('option');
          option.value = '101';
          option.textContent = '101';
          select.appendChild(option);
          select.value = '101';
        });
      }
    },
    focus: { from: '#cs-payment', to: 'cs-utilization' },
    allowlist: ['AfroTools', 'Fintech'],
    englishPatterns: [
      /\b(?:Credit Profile|Payment History|Credit Utilization|Credit History Age|Credit Mix)\b/,
      /\b(?:New Credit Inquiries|Review profile factors|Educational Profile Index|Items to verify)\b/,
      /\b(?:Strong self-check profile|Mixed self-check profile|Factors need review|Strong|Mixed|Review)\b/,
      /\b(?:Frequently Asked Questions|Related tools|No report access|No eligibility prediction)\b/
    ],
    leakPattern: /Awa Credit Fixture|Official Report 991/,
    assertValid: async (page) => {
      const score = Number(await page.locator('#cs-score').textContent());
      const grade = await page.locator('#cs-grade').textContent();
      const factors = await page.locator('#cs-factor-list').innerText();
      const tips = await page.locator('#cs-tips .tip-item').allInnerTexts();
      if (
        score !== 64
        || grade.trim() !== 'Profil d’auto-évaluation mitigé'
        || !factors.includes('Historique de paiement')
        || !factors.includes('Utilisation du crédit')
        || !factors.includes('Ancienneté du crédit')
        || !factors.includes('Diversité des crédits')
        || !factors.includes('Nouvelles demandes')
        || !factors.includes('Solide')
        || !factors.includes('Mitigé')
        || !factors.includes('À vérifier')
        || tips.length !== 3
        || !tips.some((tip) => tip.includes('soldes et plafonds'))
        || !tips.some((tip) => tip.includes('historique court'))
        || !tips.some((tip) => tip.includes('demandes récentes'))
      ) {
        throw new Error(`credit-score: fixture mismatch ${JSON.stringify({
          score, grade, factors, tips
        })}`);
      }
    }
  });
}

async function verifyDca(browser) {
  return verifyStandardCalculator(browser, {
    id: 'dca-calc',
    route: '/fr/tools/dca-investissement/',
    canonical: 'https://afrotools.com/fr/tools/dca-investissement/',
    readySelector: '#dca-monthly',
    resultSelector: '#dca-results',
    errorSelector: '#dca-error',
    action: /Calculer les scénarios d’investissement/,
    values: {
      '#dca-currency': 'NGN',
      '#dca-monthly': '10000',
      '#dca-initial': '50000',
      '#dca-years': '5',
      '#dca-rate': '12'
    },
    mutation: { selector: '#dca-rate', value: '10' },
    invalid: { selector: '#dca-rate', value: '-100', message: /^Saisissez des versements positifs/ },
    focus: { from: '#dca-currency', to: 'dca-monthly' },
    allowlist: ['AfroTools', 'Fintech', 'NGN', 'KES', 'GHS', 'ZAR', 'USD', 'EUR', 'GBP'],
    englishPatterns: [
      /\b(?:Dollar-Cost Averaging|Monthly Investment Amount|Initial Lump Sum|Investment Period)\b/,
      /\b(?:Expected Annual Return|Calculate DCA Returns|Total Invested|Investment Return)\b/,
      /\b(?:Monthly Contributions|Monthly Equivalent Return|Lower scenario|Entered scenario|Higher scenario)\b/,
      /\b(?:Zero-return baseline|Frequently Asked Questions|Related tools|Planning estimate)\b/
    ],
    leakPattern: /10000|50000|650000|891529|241529|782086|1015076/,
    assertValid: async (page) => {
      const value = Number((await page.locator('#dca-value').textContent()).replace(/[^\d.-]/g, ''));
      const invested = Number((await page.locator('#dca-total-invested').textContent()).replace(/[^\d.-]/g, ''));
      const totalReturn = Number((await page.locator('#dca-total-return').textContent()).replace(/[^\d.-]/g, ''));
      const months = Number(await page.locator('#dca-total-units').textContent());
      const monthlyRate = Number((await page.locator('#dca-avg-cost').textContent()).replace(/[^\d.-]/g, ''));
      const scenarios = await Promise.all(['#dca-s1', '#dca-s2', '#dca-s3', '#dca-s4'].map(async (selector) => (
        Number((await page.locator(selector).textContent()).replace(/[^\d.-]/g, ''))
      )));
      const labels = await Promise.all(['#dca-l1', '#dca-l2', '#dca-l3'].map((selector) => page.locator(selector).textContent()));
      if (
        Math.abs(value - 891529.79) > 0.01
        || invested !== 650000
        || Math.abs(totalReturn - 241529.79) > 0.01
        || months !== 60
        || Math.abs(monthlyRate - 0.9489) > 0.0001
        || Math.abs(scenarios[0] - 782086.16) > 0.01
        || Math.abs(scenarios[1] - 891529.79) > 0.01
        || Math.abs(scenarios[2] - 1015076.65) > 0.01
        || scenarios[3] !== 650000
        || labels.join('|') !== 'Scénario inférieur (7.00%)|Scénario saisi (12.00%)|Scénario supérieur (17.00%)'
      ) {
        throw new Error(`dca-calc: fixture mismatch ${JSON.stringify({
          value, invested, totalReturn, months, monthlyRate, scenarios, labels
        })}`);
      }
    }
  });
}

async function verifyDebtSnowball(browser) {
  const input = (row, column) => `#debt-list tr:nth-child(${row}) td:nth-child(${column}) input`;
  return verifyStandardCalculator(browser, {
    id: 'debt-snowball',
    route: '/fr/tools/boule-neige-dettes/',
    canonical: 'https://afrotools.com/fr/tools/boule-neige-dettes/',
    readySelector: '#ds-extra',
    resultSelector: '#ds-results',
    errorSelector: '#ds-error',
    action: /Calculer les plans de remboursement/,
    values: {
      [input(1, 1)]: 'Dette A',
      [input(1, 2)]: '50000',
      [input(1, 3)]: '15000',
      [input(1, 4)]: '24',
      [input(2, 1)]: 'Dette B',
      [input(2, 2)]: '300000',
      [input(2, 3)]: '18000',
      [input(2, 4)]: '18',
      [input(3, 1)]: 'Dette C',
      [input(3, 2)]: '150000',
      [input(3, 3)]: '14000',
      [input(3, 4)]: '14',
      '#ds-currency': 'NGN',
      '#ds-extra': '10000'
    },
    mutation: { selector: '#ds-extra', value: '20000' },
    invalid: { selector: '#ds-extra', value: '-1', message: /^Le paiement mensuel supplémentaire/ },
    focus: { from: '#ds-currency', to: 'ds-extra' },
    allowlist: ['AfroTools', 'Fintech', 'NGN', 'KES', 'GHS', 'ZAR', 'USD', 'EUR', 'GBP'],
    englishPatterns: [
      /\b(?:Debt Snowball|Avalanche Calculator|Debt Name|Monthly Min|Annual Rate|Add Debt)\b/,
      /\b(?:Extra Monthly Payment|Calculate Payoff Plan|Snowball Method|Avalanche Method)\b/,
      /\b(?:Smallest balance first|Highest rate first|Modelled interest|Modelled total paid)\b/,
      /\b(?:Snowball Payoff Order|Not repaid|Frequently Asked Questions|Related tools|Planning estimate)\b/
    ],
    leakPattern: /50000|300000|150000|38546|37312|538546|537312|Dette A|Dette B|Dette C/,
    assertValid: async (page) => {
      const snowballMonths = await page.locator('#ds-snowball-months').textContent();
      const avalancheMonths = await page.locator('#ds-avalanche-months').textContent();
      const snowballInterest = Number((await page.locator('#ds-snowball-interest').textContent()).replace(/[^\d.-]/g, ''));
      const avalancheInterest = Number((await page.locator('#ds-avalanche-interest').textContent()).replace(/[^\d.-]/g, ''));
      const snowballTotal = Number((await page.locator('#ds-snowball-total').textContent()).replace(/[^\d.-]/g, ''));
      const avalancheTotal = Number((await page.locator('#ds-avalanche-total').textContent()).replace(/[^\d.-]/g, ''));
      const order = await page.locator('#ds-order tr').allInnerTexts();
      const recommendation = await page.locator('#ds-recommendation').innerText();
      if (
        snowballMonths.trim() !== '10 mois (0.8 ans)'
        || avalancheMonths.trim() !== '10 mois (0.8 ans)'
        || Math.abs(snowballInterest - 38546.91) > 0.01
        || Math.abs(avalancheInterest - 37312.28) > 0.01
        || Math.abs(snowballTotal - 538546.91) > 0.01
        || Math.abs(avalancheTotal - 537312.28) > 0.01
        || order.length !== 3
        || !order[0].includes('Dette A') || !order[0].includes('3 mois')
        || !order[1].includes('Dette C') || !order[1].includes('6 mois')
        || !order[2].includes('Dette B') || !order[2].includes('10 mois')
        || !recommendation.includes('L’avalanche économise NGN 1,234.64')
      ) {
        throw new Error(`debt-snowball: fixture mismatch ${JSON.stringify({
          snowballMonths, avalancheMonths, snowballInterest, avalancheInterest,
          snowballTotal, avalancheTotal, order, recommendation
        })}`);
      }

      await page.getByRole('button', { name: 'Ajouter une dette' }).click();
      const added = page.locator('#debt-list tr').last();
      if (
        await page.locator('#debt-list tr').count() !== 4
        || await added.locator('input').nth(0).getAttribute('aria-label') !== 'Nom de la dette'
        || await added.locator('input').nth(1).getAttribute('aria-label') !== 'Solde de la dette'
        || await added.locator('button').getAttribute('aria-label') !== 'Retirer la dette'
      ) {
        throw new Error('debt-snowball: French add-debt runtime contract mismatch');
      }
      await page.getByRole('button', { name: /Calculer les plans de remboursement/ }).click();
      const invalidDebt = await page.locator('#ds-error').textContent();
      if (!/^Chaque dette doit avoir un solde/.test(invalidDebt)) {
        throw new Error(`debt-snowball: empty added debt did not fail closed: ${invalidDebt}`);
      }
      await added.locator('button').click();
      await page.getByRole('button', { name: /Calculer les plans de remboursement/ }).click();
    }
  });
}

async function verifyDividendYield(browser) {
  return verifyStandardCalculator(browser, {
    id: 'dividend-yield',
    route: '/fr/tools/rendement-dividendes/',
    canonical: 'https://afrotools.com/fr/tools/rendement-dividendes/',
    readySelector: '#dv-price',
    resultSelector: '#dv-results',
    errorSelector: '#dv-error',
    action: /Calculer le rendement/,
    values: {
      '#dv-currency': 'NGN',
      '#dv-price': '250',
      '#dv-dps': '20',
      '#dv-shares': '1000',
      '#dv-eps': '40',
      '#dv-fd-rate': '10',
      '#dv-inflation': '5',
      '#dv-tax': '10',
      '#dv-growth': '5'
    },
    mutation: { selector: '#dv-price', value: '300' },
    invalid: { selector: '#dv-price', value: '-1', message: /^Saisissez un cours supérieur/ },
    focus: { from: '#dv-currency', to: 'dv-price' },
    allowlist: ['AfroTools', 'Fintech', 'NGN', 'KES', 'GHS', 'ZAR', 'USD', 'EUR'],
    englishPatterns: [
      /\b(?:Dividend Yield|Share Price|Annual Dividend|Number of Shares|Earnings per Share)\b/,
      /\b(?:Comparison Yield|Annual Inflation|Dividend Tax|Dividend Growth|After-Tax Income)\b/,
      /\b(?:Payout Ratio|Real Yield|Cumulative Income|Current Net Dividend Payback|Frequently Asked Questions)\b/
    ],
    leakPattern: /20000|18000|99461|13\.89|250|1000/,
    assertValid: async (page) => {
      const values = await page.evaluate(() => ({
        yield: document.getElementById('dv-yield').textContent,
        annual: document.getElementById('dv-annual-income').textContent,
        net: document.getElementById('dv-net-income').textContent,
        payout: document.getElementById('dv-payout-ratio').textContent,
        pe: document.getElementById('dv-pe-ratio').textContent,
        vs: document.getElementById('dv-vs-fd').textContent,
        real: document.getElementById('dv-real-yield').textContent,
        five: document.getElementById('dv-5yr-income').textContent,
        payback: document.getElementById('dv-payback').textContent,
        verdict: document.getElementById('dv-verdict').textContent
      }));
      if (
        values.yield !== '8.00%'
        || !values.annual.includes('20,000.00')
        || !values.net.includes('18,000.00')
        || values.payout !== '50.00%'
        || values.pe !== '6.25x'
        || values.vs !== '-2.80%'
        || values.real !== '2.10%'
        || !values.five.includes('99,461.36')
        || values.payback !== '13.89 ans'
        || !values.verdict.includes('2.80 points de pourcentage')
      ) {
        throw new Error(`dividend-yield: fixture mismatch ${JSON.stringify(values)}`);
      }
    }
  });
}

async function verifyFire(browser) {
  return verifyStandardCalculator(browser, {
    id: 'fire-calc',
    route: '/fr/tools/calculateur-fire/',
    canonical: 'https://afrotools.com/fr/tools/calculateur-fire/',
    readySelector: '#fire-age',
    resultSelector: '#fire-results',
    errorSelector: '#fire-error',
    action: /Calculer la projection FIRE/,
    values: {
      '#fire-currency': 'NGN', '#fire-age': '30', '#fire-retire-age': '45',
      '#fire-expenses': '200000', '#fire-retire-expenses': '150000',
      '#fire-savings': '500000', '#fire-monthly-save': '80000',
      '#fire-return': '14', '#fire-inflation': '8', '#fire-withdrawal': '4'
    },
    mutation: { selector: '#fire-monthly-save', value: '100000' },
    invalid: { selector: '#fire-retire-age', value: '20', message: /^L’âge cible/ },
    focus: { from: '#fire-currency', to: 'fire-age' },
    allowlist: ['AfroTools', 'Fintech', 'FIRE', 'NGN', 'KES', 'GHS', 'ZAR', 'USD', 'EUR'],
    englishPatterns: [
      /\b(?:Your FIRE Number|Current Age|Target Retirement Age|Current Monthly Expenses)\b/,
      /\b(?:Target Monthly Expenses|Current Savings|Monthly Savings|Expected Annual Return)\b/,
      /\b(?:Withdrawal Rate|Years to FIRE|Target Year|Portfolio at Retirement|Monthly Savings Needed)\b/,
      /\b(?:First-Year Withdrawal Scenarios|Frequently Asked Questions)\b/
    ],
    leakPattern: /142747610|48294505|248947|200000|150000|500000/,
    assertValid: async (page) => {
      const values = await page.evaluate(() => ({
        target: document.getElementById('fire-number').textContent,
        years: document.getElementById('fire-years').textContent,
        portfolio: document.getElementById('fire-portfolio-at-retire').textContent,
        needed: document.getElementById('fire-monthly-needed').textContent,
        rate: document.getElementById('fire-savings-rate').textContent,
        swr4: document.getElementById('fire-swr4').textContent,
        sub: document.getElementById('fire-sub').textContent
      }));
      if (
        !values.target.includes('142,747,610.14')
        || values.years !== '15 ans'
        || !values.portfolio.includes('48,294,505.00')
        || !values.needed.includes('248,947.07')
        || values.rate !== '28.57%'
        || !values.swr4.includes('160,981.68/par mois')
        || !values.sub.includes('Scénario de rendement réel 5.56%')
      ) throw new Error(`fire-calc: fixture mismatch ${JSON.stringify(values)}`);
    }
  });
}

async function verifyInvoiceFactoring(browser) {
  return verifyStandardCalculator(browser, {
    id: 'invoice-factoring',
    route: '/fr/tools/affacturage/',
    canonical: 'https://afrotools.com/fr/tools/affacturage/',
    readySelector: '#if-invoice',
    resultSelector: '#if-results',
    errorSelector: '#if-status',
    action: /Calculer l’affacturage/,
    values: {
      '#if-currency': 'NGN', '#if-invoice': '500000', '#if-advance': '80',
      '#if-fee': '3', '#if-days': '30', '#if-additional': '0', '#if-recourse': 'recourse'
    },
    mutation: { selector: '#if-fee', value: '4' },
    invalid: { selector: '#if-invoice', value: '0', message: /^Saisissez une facture supérieure/ },
    focus: { from: '#if-currency', to: 'if-invoice' },
    allowlist: ['AfroTools', 'Fintech', 'CSV', 'NGN', 'KES', 'GHS', 'ZAR', 'USD', 'EUR'],
    englishPatterns: [
      /\b(?:Invoice Factoring|Invoice Value|Advance Rate|Base Factoring Fee|Expected Days Outstanding)\b/,
      /\b(?:Additional Flat Fees|Recourse Type|Calculate Factoring|Copy Summary|Download CSV)\b/,
      /\b(?:Gross Advance|Reserve Release|Total Received|Annualized Cost Proxy|Decision handoff)\b/,
      /\b(?:Frequently Asked Questions|Planning estimate only|Factoring scenario calculated locally)\b/
    ],
    leakPattern: /500000|400000|15000|85000|485000|56\.50/,
    advertisedExports: ['CSV'],
    assertValid: async (page) => {
      const values = await page.evaluate(() => ({
        advance: document.getElementById('if-cash-today').textContent,
        fee: document.getElementById('if-total-fee').textContent,
        reserve: document.getElementById('if-reserve-release').textContent,
        total: document.getElementById('if-total-received').textContent,
        apr: document.getElementById('if-apr').textContent,
        decision: document.getElementById('if-decision').textContent,
        status: document.getElementById('if-status').textContent
      }));
      if (
        !values.advance.includes('400,000.00') || !values.fee.includes('15,000.00')
        || !values.reserve.includes('85,000.00') || !values.total.includes('485,000.00')
        || values.apr !== '56.50%' || !values.decision.includes('Points de décision')
        || !values.status.startsWith('Scénario d’affacturage calculé localement')
      ) throw new Error(`invoice-factoring: fixture mismatch ${JSON.stringify(values)}`);
    },
    verifyExports: async (page) => {
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Télécharger le CSV' }).click();
      const download = await downloadPromise;
      const downloadPath = await download.path();
      const csv = fs.readFileSync(downloadPath, 'utf8');
      const rows = csv.split(/\r?\n/).map((line) => line.split(',').map((cell) => cell.replace(/^"|"$/g, '').replace(/""/g, '"')));
      const map = Object.fromEntries(rows.slice(1).map((row) => [row[0], row[1]]));
      if (
        download.suggestedFilename() !== 'afrotools-affacturage.csv'
        || rows[0].join(',') !== 'indicateur,valeur'
        || map.valeur_facture !== '500000.00'
        || map.avance_brute !== '400000.00'
        || map.frais_totaux !== '15000.00'
        || map.total_recu !== '485000.00'
        || map.indicateur_cout_annualise_pourcentage !== '56.50'
      ) throw new Error(`invoice-factoring: reopened CSV mismatch ${JSON.stringify({ filename: download.suggestedFilename(), rows })}`);
    }
  });
}

async function verifyLoanConsolidation(browser) {
  const field = (row, name) => `#loans-list .loan-entry:nth-child(${row}) .lc-${name}`;
  return verifyStandardCalculator(browser, {
    id: 'loan-consolidation',
    route: '/fr/tools/consolidation-prets/',
    canonical: 'https://afrotools.com/fr/tools/consolidation-prets/',
    readySelector: '#lc-new-rate',
    resultSelector: '#lc-results',
    errorSelector: '#lc-error',
    action: /Comparer les options/,
    values: {
      [field(1, 'balance')]: '500000', [field(1, 'payment')]: '25000', [field(1, 'rate')]: '28',
      [field(2, 'balance')]: '300000', [field(2, 'payment')]: '18000', [field(2, 'rate')]: '36',
      [field(3, 'balance')]: '200000', [field(3, 'payment')]: '12000', [field(3, 'rate')]: '18',
      '#lc-currency': 'NGN', '#lc-new-rate': '22', '#lc-new-tenor': '24', '#lc-origination': '2'
    },
    mutation: { selector: '#lc-new-rate', value: '18' },
    invalid: { selector: field(1, 'balance'), value: '0', message: /^Chaque prêt actuel/ },
    focus: { from: '#lc-currency', to: 'lc-new-rate' },
    allowlist: ['AfroTools', 'Fintech', 'NGN', 'KES', 'GHS', 'ZAR', 'USD', 'EUR'],
    englishPatterns: [
      /\b(?:Loan Consolidation|Current Loans|Loan \d|Monthly Payment|Annual Rate|Add Loan)\b/,
      /\b(?:Consolidation Loan Terms|Consolidation Tenor|Origination|Compare Options)\b/,
      /\b(?:Modeled comparison|Current Total Monthly|New Monthly Payment|Total Repayment Difference)\b/,
      /\b(?:Term Difference|Total Balance to Consolidate|Frequently Asked Questions|Remove loan)\b/
    ],
    leakPattern: /500000|300000|200000|1000000|25000|18000|12000/,
    assertValid: async (page) => {
      const values = await page.evaluate(() => ({
        totalBalance: document.getElementById('lc-total-balance').textContent,
        currentMonthly: document.getElementById('lc-current-monthly').textContent,
        verdict: document.getElementById('lc-verdict-val').textContent,
        sub: document.getElementById('lc-verdict-sub').textContent
      }));
      if (
        !values.totalBalance.includes('1,000,000.00')
        || !values.currentMonthly.includes('55,000.00')
        || !/Remboursement total modélisé/.test(values.verdict)
        || !values.sub.includes('20,000.00 de frais financés')
      ) throw new Error(`loan-consolidation: fixture mismatch ${JSON.stringify(values)}`);
      await page.getByRole('button', { name: 'Ajouter un prêt' }).click();
      const added = page.locator('#loans-list .loan-entry').last();
      if (
        await page.locator('#loans-list .loan-entry').count() !== 4
        || await added.locator('h4').textContent() !== 'Prêt 4'
        || await added.locator('.lc-balance').getAttribute('aria-label') !== 'Prêt 4 solde'
        || await added.locator('button').getAttribute('aria-label') !== 'Retirer le prêt 4'
      ) throw new Error('loan-consolidation: French add-loan contract mismatch');
      await added.locator('button').click();
    }
  });
}

async function verifyMerchantFees(browser) {
  return verifyStandardCalculator(browser, {
    id: 'merchant-fees',
    route: '/fr/tools/frais-marchand/',
    canonical: 'https://afrotools.com/fr/tools/frais-marchand/',
    readySelector: '#mf-monthly-vol',
    resultSelector: '#mf-results',
    errorSelector: '#mf-error',
    action: /Calculer les frais marchands/,
    values: {
      '#mf-currency': 'NGN', '#mf-monthly-vol': '2000000', '#mf-avg-txn': '8000',
      '#mf-card-pct': '30', '#mf-mm-pct': '40', '#mf-bank-pct': '20', '#mf-cash-pct': '10',
      '#mf-card-rate': '1.5', '#mf-mm-rate': '0.8', '#mf-bank-rate': '0.1', '#mf-cash-rate': '0.5'
    },
    mutation: { selector: '#mf-card-rate', value: '2' },
    invalid: { selector: '#mf-card-pct', value: '40', message: /^La répartition des paiements/ },
    focus: { from: '#mf-currency', to: 'mf-monthly-vol' },
    allowlist: ['AfroTools', 'Fintech', 'TXT', 'Mobile money', 'NGN', 'KES', 'GHS', 'ZAR', 'USD'],
    englishPatterns: [
      /\b(?:Merchant Payment Fees|Monthly Sales Volume|Average Transaction Value|Payment Mix)\b/,
      /\b(?:Card|Bank Transfer|Cash|Entered Fee Rates|Calculate Merchant Fees)\b/,
      /\b(?:Total Monthly Payment Fees|Blended Fee Rate|Net Revenue|Annual Fees Paid)\b/,
      /\b(?:Fee Breakdown by Method|Method|Effective Rate|Frequently Asked Questions)\b/
    ],
    leakPattern: /2000000|16800|1983200|201600|600000|800000/,
    advertisedExports: ['TXT'],
    assertValid: async (page) => {
      const values = await page.evaluate(() => ({
        total: document.getElementById('mf-total-fee').textContent,
        blended: document.getElementById('mf-blended-rate').textContent,
        net: document.getElementById('mf-net-revenue').textContent,
        annual: document.getElementById('mf-annual-fees').textContent,
        txns: document.getElementById('mf-transactions').textContent,
        table: document.getElementById('mf-table').textContent
      }));
      if (
        !values.total.includes('16,800.00') || values.blended !== '0.84%'
        || !values.net.includes('1,983,200.00') || !values.annual.includes('201,600.00')
        || values.txns !== '250' || !values.table.includes('Carte ou terminal de paiement')
        || !values.table.includes('Virement bancaire')
      ) throw new Error(`merchant-fees: fixture mismatch ${JSON.stringify(values)}`);
    },
    verifyExports: async (page) => {
      await page.locator('[data-fr-finpay-save]').click();
      const marker = await page.evaluate(() => localStorage.getItem('afro_fr_fintech_payment_marker_v1'));
      if (!marker || /2000000|16800|Carte/.test(marker)) throw new Error('merchant-fees: raw fixture leaked into local marker');
      const parsed = JSON.parse(marker);
      if (parsed.toolId !== 'merchant-fees' || parsed.storesFinancialDetails !== false) throw new Error(`merchant-fees: marker mismatch ${marker}`);
      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-fr-finpay-download]').click();
      const download = await downloadPromise;
      const file = fs.readFileSync(await download.path(), 'utf8');
      const folded = file.toLocaleLowerCase('fr');
      if (
        download.suggestedFilename() !== 'merchant-fees-resultat-paiement.txt'
        || !folded.includes('frais mensuels totaux') || !file.includes('NGN 16,800.00')
        || !folded.includes('taux de frais pondéré') || !folded.includes('virement bancaire')
      ) throw new Error(`merchant-fees: reopened TXT mismatch ${JSON.stringify({ filename: download.suggestedFilename(), file: file.slice(0, 400) })}`);
    }
  });
}

async function verifyMoneyMarket(browser) {
  return verifyStandardCalculator(browser, {
    id: 'money-market', route: '/fr/tools/comparateur-fonds-monetaires/',
    canonical: 'https://afrotools.com/fr/tools/comparateur-fonds-monetaires/',
    readySelector: '#mmf-amount', resultSelector: '#mmf-results', errorSelector: '#mmf-error',
    action: /Comparer les rendements/,
    values: { '#mmf-currency': 'NGN', '#mmf-amount': '500000', '#mmf-rate': '13', '#mmf-fd-rate': '10', '#mmf-days': '365' },
    mutation: { selector: '#mmf-rate', value: '15' },
    invalid: { selector: '#mmf-amount', value: '0', message: /^Saisissez un montant supérieur/ },
    focus: { from: '#mmf-currency', to: 'mmf-amount' },
    allowlist: ['AfroTools', 'Fintech', 'NGN', 'KES', 'GHS', 'ZAR', 'USD'],
    englishPatterns: [/\b(?:Money Market|Fixed Deposit|Investment Amount|Annual Yield|Investment Period|Compare Returns)\b/, /\b(?:Daily Accrual|7-Day Return|Period Rate|Product|Frequently Asked Questions|Copy comparison brief)\b/],
    leakPattern: /500000|65000|565000|15000|167\.45|1173\.32/,
    assertValid: async (page) => {
      const v = await page.evaluate(() => ({
        total: document.getElementById('mmf-total').textContent,
        daily: document.getElementById('mmf-daily').textContent,
        weekly: document.getElementById('mmf-weekly').textContent,
        diff: document.getElementById('mmf-vs-fd').textContent,
        table: document.getElementById('mmf-compare').textContent
      }));
      if (!v.total.includes('65,000.00') || !v.daily.includes('167.45') || !v.weekly.includes('1,173.32') || !v.diff.includes('15,000.00') || !v.table.includes('Fonds monétaire')) throw new Error(`money-market: fixture mismatch ${JSON.stringify(v)}`);
    }
  });
}

async function verifyNetWorth(browser) {
  const amount = (list, row) => `#${list} .item-row:nth-child(${row}) input[type="number"]`;
  return verifyStandardCalculator(browser, {
    id: 'net-worth', route: '/fr/tools/suivi-valeur-nette/',
    canonical: 'https://afrotools.com/fr/tools/suivi-valeur-nette/',
    readySelector: '#nw-currency', resultSelector: '#nw-results', errorSelector: '#nw-error',
    action: /Calculer la valeur nette/,
    values: {
      '#nw-currency': '₦',
      [amount('assets-list', 1)]: '500000', [amount('assets-list', 2)]: '1200000',
      [amount('assets-list', 3)]: '8000000', [amount('assets-list', 4)]: '2500000',
      [amount('assets-list', 5)]: '3000000',
      [amount('liabilities-list', 1)]: '4000000', [amount('liabilities-list', 2)]: '1200000',
      [amount('liabilities-list', 3)]: '300000', [amount('liabilities-list', 4)]: '100000'
    },
    mutation: { selector: amount('assets-list', 1), value: '800000' },
    invalid: { selector: amount('assets-list', 1), value: '-1', message: /^Chaque montant d’actif/ },
    focus: { from: '#nw-currency', to: 'nw-first-name' },
    allowlist: ['AfroTools', 'Fintech', 'NGN', 'KES', 'GHS', 'ZAR', 'USD', 'EUR'],
    englishPatterns: [/\b(?:Net Worth|Assets|Liabilities|Item name|Remove item|Add Asset|Add Liability)\b/, /\b(?:Total Assets|Total Liabilities|Debt-to-Assets Ratio|Frequently Asked Questions)\b/],
    leakPattern: /500000|1200000|8000000|2500000|3000000|4000000|9600000|15200000|5600000/,
    assertValid: async (page) => {
      const v = await page.evaluate(() => ({
        total: document.getElementById('nw-total').textContent,
        assets: document.getElementById('nw-assets').textContent,
        liabilities: document.getElementById('nw-liabilities').textContent,
        ratio: document.getElementById('nw-dta').textContent,
        ratioText: document.getElementById('nw-dta-text').textContent
      }));
      if (!v.total.includes('9,600,000.00') || !v.assets.includes('15,200,000.00') || !v.liabilities.includes('5,600,000.00') || v.ratio !== '36.8%' || !v.ratioText.includes('Ce ratio est descriptif')) throw new Error(`net-worth: fixture mismatch ${JSON.stringify(v)}`);
      await page.getByRole('button', { name: 'Ajouter un actif' }).click();
      const added = page.locator('#assets-list .item-row').last();
      if (await added.locator('input').nth(0).getAttribute('aria-label') !== 'Nom du poste' || await added.locator('button').getAttribute('aria-label') !== 'Retirer le poste') throw new Error('net-worth: French add-item contract mismatch');
      await added.locator('button').click();
    }
  });
}

async function verifyPosFees(browser) {
  return verifyStandardCalculator(browser, {
    id: 'pos-fees', route: '/fr/tools/frais-pos/', canonical: 'https://afrotools.com/fr/tools/frais-pos/',
    readySelector: '#pos-mdr', resultSelector: '#pos-results', errorSelector: '#pos-error',
    action: /Calculer les frais du terminal/,
    values: { '#pos-currency': 'NGN', '#pos-mdr': '1.5', '#pos-flat': '100', '#pos-cap': '2000', '#pos-monthly-fee': '2500', '#pos-avg-txn': '8000', '#pos-txn-count': '30', '#pos-card-pct': '60', '#pos-days': '22' },
    mutation: { selector: '#pos-mdr', value: '2' },
    invalid: { selector: '#pos-card-pct', value: '0', message: /^Vérifiez les frais et le volume/ },
    focus: { from: '#pos-currency', to: 'pos-mdr' },
    allowlist: ['AfroTools', 'Fintech', 'TXT', 'NGN', 'KES', 'GHS', 'ZAR', 'USD'],
    englishPatterns: [/\b(?:POS Fees|Merchant Discount Rate|Flat Fee|Fee Cap|Monthly Terminal Fee|Average Transaction)\b/, /\b(?:Daily Transactions|Card Payment Share|Operating Days|Calculate POS Fees|Monthly POS Fees|Effective Rate)\b/, /\b(?:Frequently Asked Questions|Run the comparator)\b/],
    leakPattern: /3168000|89620|87120|1075440|144000/,
    advertisedExports: ['TXT'],
    assertValid: async (page) => {
      const v = await page.evaluate(() => ({ total: document.getElementById('pos-total-monthly').textContent, daily: document.getElementById('pos-daily-vol').textContent, monthly: document.getElementById('pos-monthly-vol').textContent, fees: document.getElementById('pos-txn-fees').textContent, rate: document.getElementById('pos-effective-rate').textContent, annual: document.getElementById('pos-annual-cost').textContent }));
      if (!v.total.includes('89,620.00') || !v.daily.includes('144,000.00') || !v.monthly.includes('3,168,000.00') || !v.fees.includes('87,120.00') || v.rate !== '2.83%' || !v.annual.includes('1,075,440.00')) throw new Error(`pos-fees: fixture mismatch ${JSON.stringify(v)}`);
    },
    verifyExports: async (page) => {
      await page.locator('[data-fr-finpay-save]').click();
      const marker = await page.evaluate(() => localStorage.getItem('afro_fr_fintech_payment_marker_v1'));
      if (!marker || /3168000|89620/.test(marker) || JSON.parse(marker).storesFinancialDetails !== false) throw new Error('pos-fees: marker privacy mismatch');
      const promise = page.waitForEvent('download');
      await page.locator('[data-fr-finpay-download]').click();
      const download = await promise; const file = fs.readFileSync(await download.path(), 'utf8'); const folded = file.toLocaleLowerCase('fr');
      if (download.suggestedFilename() !== 'pos-fees-resultat-paiement.txt' || !folded.includes('frais mensuels du terminal') || !file.includes('NGN 89,620.00') || !folded.includes('taux effectif sur le volume')) throw new Error(`pos-fees: TXT mismatch ${file.slice(0, 350)}`);
    }
  });
}

async function verifyPropertyVsStocks(browser) {
  return verifyStandardCalculator(browser, {
    id: 'property-vs-stocks', route: '/fr/tools/immobilier-vs-actions/', canonical: 'https://afrotools.com/fr/tools/immobilier-vs-actions/',
    readySelector: '#pv-price', resultSelector: '#pvs-results', errorSelector: '#pvs-error',
    action: /Comparer les scénarios/,
    values: { '#pvs-currency': 'NGN', '#pv-price': '15000000', '#pv-down': '5', '#pv-rent': '120000', '#pv-appreciation': '8', '#pv-expenses': '2', '#pv-vacancy': '10', '#pv-sale-cost': '5', '#sv-return': '14', '#pv-years': '10' },
    mutation: { selector: '#pv-appreciation', value: '10' },
    invalid: { selector: '#pv-price', value: '0', message: /^Vérifiez les montants et scénarios/ },
    focus: { from: '#pvs-currency', to: 'pv-price' },
    allowlist: ['AfroTools', 'Fintech', 'NGN', 'KES', 'GHS', 'ZAR', 'USD'],
    englishPatterns: [/\b(?:Property vs Stocks|Property Purchase Price|Purchase Costs|Monthly Rent|Annual Appreciation)\b/, /\b(?:Annual Property Expenses|Vacancy Rate|Sale Costs|Stock Starting Capital|Expected Stock Return)\b/, /\b(?:Compare Investments|Property Value|Stock Portfolio Value|Total Rental Income|Frequently Asked Questions|Included)\b/],
    leakPattern: /15000000|40724681|58388735|24974681|42638735|9960000/,
    assertValid: async (page) => {
      const v = await page.evaluate(() => ({ property: document.getElementById('prop-value').textContent, stock: document.getElementById('stock-value').textContent, propertyRoi: document.getElementById('pvs-prop-roi').textContent, stockRoi: document.getElementById('pvs-stock-roi').textContent, income: document.getElementById('pvs-prop-income').textContent, included: document.getElementById('pvs-stock-income').textContent }));
      if (!v.property.includes('40,724,681.21') || !v.stock.includes('58,388,735.70') || v.propertyRoi !== '158.6%' || v.stockRoi !== '270.7%' || !v.income.includes('9,960,000.00') || v.included !== 'Inclus') throw new Error(`property-vs-stocks: fixture mismatch ${JSON.stringify(v)}`);
    }
  });
}

async function verifyQrPayment(browser) {
  return verifyStandardCalculator(browser, {
    id: 'qr-payment', route: '/fr/tools/cout-paiement-qr/', canonical: 'https://afrotools.com/fr/tools/cout-paiement-qr/',
    readySelector: '#qr-avg-txn', resultSelector: '#qr-results', errorSelector: '#qr-error',
    action: /Comparer les coûts de paiement/,
    values: { '#qr-currency': 'NGN', '#qr-avg-txn': '5000', '#qr-daily-txns': '50', '#qr-days': '22', '#qr-rate': '0.5', '#qr-flat': '0', '#qr-pos-rate': '1.5', '#qr-pos-flat': '0', '#qr-mm-rate': '0.8', '#qr-mm-flat': '0', '#qr-cash-cost': '0.5' },
    mutation: { selector: '#qr-rate', value: '1' },
    invalid: { selector: '#qr-avg-txn', value: '0', message: /^Saisissez une valeur et un nombre/ },
    focus: { from: '#qr-currency', to: 'qr-avg-txn' },
    allowlist: ['AfroTools', 'Fintech', 'QR', 'Mobile money', 'NGN', 'KES', 'GHS', 'ZAR', 'USD'],
    englishPatterns: [/\b(?:QR Payment|Average Transaction Value|Daily Transactions|Operating Days|QR Percentage Fee)\b/, /\b(?:Flat Fee|POS|Card|Cash Handling|Compare Payment Methods|Lowest entered cost|Monthly Volume|Per Transaction Fee|Frequently Asked Questions)\b/],
    leakPattern: /5500000|27500|330000|82500|44000/,
    assertValid: async (page) => {
      const number = async (selector) => Number((await page.locator(selector).textContent()).replace(/[^\d.-]/g, ''));
      const v = { volume: await number('#qr-monthly-vol'), monthly: await number('#qr-monthly-fee'), per: await number('#qr-per-txn'), rate: await page.locator('#qr-effective-rate').textContent(), annual: await number('#qr-annual-fee'), compare: await page.locator('#qr-compare').innerText() };
      if (Math.abs(v.volume - 5500000) > 0.01 || Math.abs(v.monthly - 27500) > 0.01 || Math.abs(v.per - 25) > 0.01 || v.rate !== '0.50%' || Math.abs(v.annual - 330000) > 0.01 || !v.compare.includes('Paiement par QR · coût saisi le plus bas')) throw new Error(`qr-payment: fixture mismatch ${JSON.stringify(v)}`);
    }
  });
}

async function verifyStockPortfolio(browser) {
  const input = (row, column) => `#holdings-tbody tr:nth-child(${row}) td:nth-child(${column}) input`;
  return verifyStandardCalculator(browser, {
    id: 'stock-portfolio', route: '/fr/tools/suivi-portefeuille-actions/', canonical: 'https://afrotools.com/fr/tools/suivi-portefeuille-actions/',
    readySelector: '#sp-first-ticker', resultSelector: '#sp-results', errorSelector: '#sp-error',
    action: /Calculer le portefeuille/,
    values: {
      [input(1, 1)]: 'DANGOTE', [input(1, 2)]: '100', [input(1, 3)]: '200', [input(1, 4)]: '250',
      [input(2, 1)]: 'SAFARICOM', [input(2, 2)]: '50', [input(2, 3)]: '20', [input(2, 4)]: '18',
      [input(3, 1)]: 'MTN', [input(3, 2)]: '30', [input(3, 3)]: '100', [input(3, 4)]: '120'
    },
    mutation: { selector: input(1, 4), value: '300' },
    invalid: { selector: input(1, 2), value: '0', message: /^Chaque ligne utilisée/ },
    focus: { from: '#sp-first-ticker', to: 'sp-first-shares' },
    allowlist: ['AfroTools', 'Fintech', 'DANGOTE', 'SAFARICOM', 'MTN', 'NGN', 'KES', 'GHS', 'ZAR', 'USD'],
    englishPatterns: [/\b(?:Stock Portfolio|Holdings|Ticker|Shares|Buy Price|Current Price|Add Holding|Calculate Portfolio)\b/, /\b(?:Total Portfolio Value|Total Cost Basis|Total Gain|Portfolio Return|Delete holding|Frequently Asked Questions)\b/],
    leakPattern: /DANGOTE|SAFARICOM|29500|24000|5500/,
    assertValid: async (page) => {
      const numeric = async (selector) => Number((await page.locator(selector).textContent()).replace(/[^\d.-]/g, ''));
      const v = { value: await numeric('#sp-total-value'), cost: await numeric('#sp-total-cost'), gain: await numeric('#sp-total-gain'), ret: await page.locator('#sp-return-pct').textContent(), rows: await page.locator('#sp-table-body tr').allInnerTexts() };
      if (v.value !== 29500 || v.cost !== 24000 || v.gain !== 5500 || v.ret !== '+22.9%' || v.rows.length !== 3 || !v.rows[0].includes('84.7%')) throw new Error(`stock-portfolio: fixture mismatch ${JSON.stringify(v)}`);
      await page.getByRole('button', { name: 'Ajouter une position' }).click();
      const added = page.locator('#holdings-tbody tr').last();
      if (await added.locator('input').first().getAttribute('aria-label') !== 'Position 4 symbole' || await added.locator('button').getAttribute('aria-label') !== 'Supprimer la position 4') throw new Error('stock-portfolio: French add-row contract mismatch');
      await added.locator('button').click();
    }
  });
}

async function verifyThrift(browser) {
  return verifyStandardCalculator(browser, {
    id: 'thrift-calc', route: '/fr/tools/rendement-tontine-cooperative/', canonical: 'https://afrotools.com/fr/tools/rendement-tontine-cooperative/',
    readySelector: '#tc-type', resultSelector: '#tc-results', errorSelector: '#tc-error',
    action: /Calculer le plan du groupe/,
    values: { '#tc-currency': 'NGN', '#tc-type': 'rotating', '#tc-members': '10', '#tc-monthly': '10000', '#tc-your-pos': '5', '#tc-rate': '0', '#tc-bank-rate': '4' },
    mutation: { selector: '#tc-type', value: 'thrift' },
    invalid: { selector: '#tc-members', value: '1', message: /^Saisissez de 2 à 100 membres/ },
    focus: { from: '#tc-currency', to: 'tc-type' },
    allowlist: ['AfroTools', 'Fintech', 'NGN', 'KES', 'GHS', 'ZAR', 'USD'],
    englishPatterns: [/\b(?:Thrift|Cooperative Returns|Currency|Scheme Type|Rotating Savings|Investment Cooperative)\b/, /\b(?:Number of Members|Monthly Contribution|Your Position|Annual Yield|Bank Alternative|Calculate Returns)\b/, /\b(?:You Receive|Total You Contribute|Months to Your Turn|Bank Alternative Value|Group Pot per Cycle|Frequently Asked Questions)\b/],
    leakPattern: /100000|101486|10000/,
    assertValid: async (page) => {
      const numeric = async (selector) => Number((await page.locator(selector).textContent()).replace(/[^\d.-]/g, ''));
      const v = { lump: await numeric('#tc-lump'), contributed: await numeric('#tc-contributed'), wait: await page.locator('#tc-months-wait').textContent(), bank: await numeric('#tc-bank-equiv'), verdict: await page.locator('#tc-verdict').textContent() };
      if (v.lump !== 100000 || v.contributed !== 100000 || v.wait !== '5 mois' || Math.abs(v.bank - 101486.12) > 0.01 || !v.verdict.includes('Rotation sans frais')) throw new Error(`thrift-calc: fixture mismatch ${JSON.stringify(v)}`);
    }
  });
}

async function verifyTradeCredit(browser) {
  return verifyStandardCalculator(browser, {
    id: 'trade-credit', route: '/fr/tools/credit-commercial/', canonical: 'https://afrotools.com/fr/tools/credit-commercial/',
    readySelector: '#tc-invoice', resultSelector: '#tc-results', errorSelector: '#tc-error',
    action: /Comparer les conditions/,
    values: { '#tc-currency': 'NGN', '#tc-invoice': '1000000', '#tc-net-days': '30', '#tc-discount': '2', '#tc-discount-days': '10', '#tc-borrow-rate': '20', '#tc-monthly-vol': '5000000' },
    mutation: { selector: '#tc-borrow-rate', value: '50' },
    invalid: { selector: '#tc-invoice', value: '0', message: /^Saisissez une facture positive/ },
    focus: { from: '#tc-currency', to: 'tc-invoice' },
    allowlist: ['AfroTools', 'Fintech', 'Net', 'Action', 'NGN', 'KES', 'GHS', 'ZAR', 'USD'],
    englishPatterns: [/\b(?:Trade Credit|Invoice Amount|Net Payment Term|Early Payment Discount|Discount Payment Deadline)\b/, /\b(?:Annual Borrowing Rate|Monthly Eligible Purchase Volume|Calculate Trade Credit|Recommendation)\b/, /\b(?:Discount if Paid Early|Amount Due if Paid Early|Implied APR|Bank Borrowing Cost|Annual Net Advantage|Extra Credit Days|Frequently Asked Questions)\b/, /\b(?:Modeled Lower Cost|Early pay has modeled advantage|Terms|Action)\b/],
    leakPattern: /1000000|20000|980000|10739|555616|9260/,
    assertValid: async (page) => {
      const numeric = async (selector) => Number((await page.locator(selector).textContent()).replace(/[^\d.-]/g, ''));
      const v = {
        discount: await numeric('#tc-discount-amt'), due: await numeric('#tc-credit-cost'),
        apr: await page.locator('#tc-credit-apr').textContent(), borrowing: await numeric('#tc-borrow-cost'),
        annual: await numeric('#tc-annual-saving'), days: await page.locator('#tc-days-free').textContent(),
        verdict: await page.locator('#tc-verdict-main').textContent(), detail: await page.locator('#tc-verdict-box').textContent(),
        table: await page.locator('#tc-table').innerText()
      };
      if (v.discount !== 20000 || v.due !== 980000 || v.apr !== '37.2%' || Math.abs(v.borrowing - 10739.73) > 0.01 || Math.abs(v.annual - 555616.44) > 0.01 || v.days !== '20 jours' || v.verdict !== 'Coût modélisé inférieur : payer tôt' || !v.detail.includes('9,260.27') || !v.table.includes('Avantage modélisé au paiement anticipé')) throw new Error(`trade-credit: fixture mismatch ${JSON.stringify(v)}`);
    }
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true, timeout: 15000 });
  try {
    const context = await browser.newContext();
    await verifySentinel(context.request);
    await context.close();
    const hub = await verifyHub(browser);
    const mobileVsBank = await verifyMobileVsBank(browser);
    const fixedDeposit = await verifyFixedDeposit(browser);
    const tBill = await verifyTBill(browser);
    const realReturn = await verifyRealReturn(browser);
    const loanSharkCompare = await verifyLoanSharkCompare(browser);
    const microfinanceLoan = await verifyMicrofinanceLoan(browser);
    const digitalLending = await verifyDigitalLending(browser);
    const sacco = await verifySacco(browser);
    const paymentGateway = await verifyPaymentGateway(browser);
    const bnpl = await verifyBnpl(browser);
    const emergencyFund = await verifyEmergencyFund(browser);
    const assetFinance = await verifyAssetFinance(browser);
    const b2bPayment = await verifyB2bPayment(browser);
    const billSplit = await verifyBillSplit(browser);
    const bondYield = await verifyBondYield(browser);
    const creditScore = await verifyCreditScore(browser);
    const dca = await verifyDca(browser);
    const debtSnowball = await verifyDebtSnowball(browser);
    const dividendYield = await verifyDividendYield(browser);
    const fire = await verifyFire(browser);
    const invoiceFactoring = await verifyInvoiceFactoring(browser);
    const loanConsolidation = await verifyLoanConsolidation(browser);
    const merchantFees = await verifyMerchantFees(browser);
    const moneyMarket = await verifyMoneyMarket(browser);
    const netWorth = await verifyNetWorth(browser);
    const posFees = await verifyPosFees(browser);
    const propertyVsStocks = await verifyPropertyVsStocks(browser);
    const qrPayment = await verifyQrPayment(browser);
    const stockPortfolio = await verifyStockPortfolio(browser);
    const thrift = await verifyThrift(browser);
    const tradeCredit = await verifyTradeCredit(browser);
    const receipt = {
      sentinel: true,
      hub,
      routes: [
        mobileVsBank,
        fixedDeposit,
        tBill,
        realReturn,
        loanSharkCompare,
        microfinanceLoan,
        digitalLending,
        sacco,
        paymentGateway,
        bnpl,
        emergencyFund,
        assetFinance,
        b2bPayment,
        billSplit,
        bondYield,
        creditScore,
        dca,
        debtSnowball,
        dividendYield,
        fire,
        invoiceFactoring,
        loanConsolidation,
        merchantFees,
        moneyMarket,
        netWorth,
        posFees,
        propertyVsStocks,
        qrPayment,
        stockPortfolio,
        thrift,
        tradeCredit
      ]
    };
    if (process.env.FRENCH_FINTECH_BROWSER_RECEIPT) {
      fs.writeFileSync(process.env.FRENCH_FINTECH_BROWSER_RECEIPT, `${JSON.stringify(receipt, null, 2)}\n`);
    }
    console.log(JSON.stringify(receipt, null, 2));
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  verifyAssetFinance,
  verifyHub,
  verifyB2bPayment,
  verifyBillSplit,
  verifyBondYield,
  verifyCreditScore,
  verifyDca,
  verifyDebtSnowball,
  verifyDividendYield,
  verifyFire,
  verifyInvoiceFactoring,
  verifyLoanConsolidation,
  verifyMerchantFees,
  verifyMoneyMarket,
  verifyNetWorth,
  verifyPosFees,
  verifyPropertyVsStocks,
  verifyQrPayment,
  verifyStockPortfolio,
  verifyThrift,
  verifyTradeCredit,
  verifyBnpl,
  verifyEmergencyFund,
  verifyFixedDeposit,
  verifyDigitalLending,
  verifyLoanSharkCompare,
  verifyMicrofinanceLoan,
  verifyMobileVsBank,
  verifyPaymentGateway,
  verifyRealReturn,
  verifySacco,
  verifySentinel,
  verifyStandardCalculator,
  verifyTBill
};
