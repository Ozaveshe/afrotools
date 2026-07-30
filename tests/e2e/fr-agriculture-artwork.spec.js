'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '../..');
const manifest = require('../../data/localization/fr-agriculture-parity-manifest.json');
const {
  expectedArtworkAlt,
} = require('../support/fr-agriculture-artwork-alt-contract');
const {
  isResultCapable,
  resultActionContract,
} = require('../support/fr-agriculture-result-state-contract');

function hasMeaningfulArtworkAlt(value) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (normalized.length < 12 || /\b(?:pour|de|du|des|la|le|les|l['’])[\s:;,.!?–—-]*$/i.test(normalized)) {
    return false;
  }
  return normalized
    .replace(/^illustration\b/i, '')
    .replace(/[\s:;,.!?–—-]+/g, ' ')
    .trim()
    .split(' ')
    .filter((word) => word.length > 1).length >= 2;
}

function publicPath(value, baseUrl) {
  return value ? new URL(value, baseUrl).pathname : '';
}

function writeJson(relativePath, payload) {
  if (!relativePath) return;
  const destination = path.resolve(ROOT, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function keepBrowserLocal(page) {
  const configuredOrigin = new URL(
    process.env.FR_AGRI_PROOF_ORIGIN
      || process.env.PLAYWRIGHT_BASE_URL
      || 'http://127.0.0.1:4173',
  ).origin;
  const audit = {
    origin: configuredOrigin,
    allowedLocalRequests: [],
    offOriginRequests: [],
    loadedLocalScripts: [],
    pageErrors: [],
    consoleErrors: [],
  };
  await page.addInitScript(() => {
    window.__FR_AGRI_STORAGE_AUDIT__ = [];
    ['setItem', 'removeItem', 'clear'].forEach((method) => {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function auditedStorageMutation(...args) {
        const storage = this === window.localStorage ? 'localStorage' : 'sessionStorage';
        window.__FR_AGRI_STORAGE_AUDIT__.push({
          storage,
          method,
          key: method === 'clear' ? '*' : String(args[0]),
          oldValue: method === 'clear' ? null : this.getItem(String(args[0])),
          newValue: method === 'setItem' ? String(args[1]) : null,
        });
        return original.apply(this, args);
      };
    });
  });
  page.on('pageerror', (error) => audit.pageErrors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      audit.consoleErrors.push(message.text());
    }
  });
  page.on('response', (response) => {
    const request = response.request();
    const url = new URL(request.url());
    if (
      url.origin === configuredOrigin
      && request.resourceType() === 'script'
      && response.status() === 200
    ) {
      audit.loadedLocalScripts.push(url.pathname);
    }
  });
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const details = {
      method: request.method(),
      resourceType: request.resourceType(),
      url: request.url(),
      origin: url.origin,
      path: url.pathname,
      query: url.search,
      hash: url.hash,
      body: request.postData() || '',
      headers: await request.allHeaders(),
    };
    if (url.origin === configuredOrigin) {
      audit.allowedLocalRequests.push(details);
      await route.continue();
      return;
    }
    audit.offOriginRequests.push(details);
    await route.abort('blockedbyclient');
  });
  return audit;
}

async function inspectPrivacyState(page) {
  return page.evaluate(() => {
    const storageMutations = Array.isArray(window.__FR_AGRI_STORAGE_AUDIT__)
      ? window.__FR_AGRI_STORAGE_AUDIT__.map((row) => ({ ...row }))
      : [];
    const localStorageKeys = [];
    const sessionStorageKeys = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      localStorageKeys.push(window.localStorage.key(index));
    }
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      sessionStorageKeys.push(window.sessionStorage.key(index));
    }
    const analyticsCommands = Array.isArray(window.dataLayer)
      ? window.dataLayer.map((entry) => Array.from(entry))
      : [];
    return {
      storageMutations,
      localStorageKeys: localStorageKeys.sort(),
      sessionStorageKeys: sessionStorageKeys.sort(),
      analyticsCommands,
      analyticsConfigured: Boolean(window.__afroAnalyticsConfigured),
      googleTagPresent: Boolean(document.querySelector('script[src*="googletagmanager.com"]')),
      consent: window.localStorage.getItem('afrotools_cookie_consent'),
    };
  });
}

function expectStrictPrivacy(row, privacy, offOriginRequests) {
  const forbiddenStorageKeys = new Set([
    '_afro_search_sid',
    '_afro_ref_tracked',
    'afro_pro_cache',
    'afro_pro_status_cache',
    'aft_theme',
  ]);
  const forbiddenMutations = privacy.storageMutations.filter((mutation) => (
    forbiddenStorageKeys.has(mutation.key)
  ));
  expect(offOriginRequests, `${row.route} off-origin requests`).toEqual([]);
  expect(forbiddenMutations, `${row.route} passive storage mutations`).toEqual([]);
  expect(privacy.analyticsCommands, `${row.route} analytics commands before consent`).toEqual([]);
  expect(privacy.analyticsConfigured, `${row.route} analytics configured before consent`).toBe(false);
  expect(privacy.googleTagPresent, `${row.route} Google tag before consent`).toBe(false);
}

function privacySummary(rows) {
  const forbiddenStorageKeys = new Set([
    '_afro_search_sid',
    '_afro_ref_tracked',
    'afro_pro_cache',
    'afro_pro_status_cache',
    'aft_theme',
  ]);
  return {
    offOriginRequests: rows.reduce((sum, row) => sum + row.offOriginRequests.length, 0),
    forbiddenStorageMutations: rows.reduce((sum, row) => (
      sum + row.privacy.storageMutations.filter((mutation) => (
        forbiddenStorageKeys.has(mutation.key)
      )).length
    ), 0),
    analyticsCommandsBeforeConsent: rows.reduce(
      (sum, row) => sum + row.privacy.analyticsCommands.length,
      0,
    ),
    analyticsConfiguredBeforeConsent: rows.filter(
      (row) => row.privacy.analyticsConfigured,
    ).length,
    googleTagsBeforeConsent: rows.filter((row) => row.privacy.googleTagPresent).length,
    pageErrors: rows.reduce((sum, row) => sum + row.pageErrors.length, 0),
    consoleErrors: rows.reduce((sum, row) => sum + row.consoleErrors.length, 0),
  };
}

async function inspectVisibleDescendantClipping(page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const diagnostics = [];
    const textDiagnostics = [];
    let visibleDescendantCount = 0;
    let directTextNodeCount = 0;
    let directTextFragmentCount = 0;

    function descriptor(element) {
      if (!element) return '';
      const tag = element.tagName ? element.tagName.toLowerCase() : '';
      const id = element.id ? `#${element.id}` : '';
      const classes = element.classList && element.classList.length
        ? `.${Array.from(element.classList).slice(0, 3).join('.')}`
        : '';
      return `${tag}${id}${classes}`;
    }

    function composedParent(element) {
      if (!element) return null;
      if (element.parentElement) return element.parentElement;
      const root = element.getRootNode();
      return root && root.host ? root.host : null;
    }

    function excludedTextNode(node) {
      let element = node.parentElement;
      while (element) {
        if (element.hidden || element.inert) return true;
        if (element.tagName === 'DETAILS' && !element.open) {
          let branch = node.parentElement;
          while (branch && composedParent(branch) !== element) branch = composedParent(branch);
          if (!branch || branch.tagName !== 'SUMMARY') return true;
        }
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility !== 'visible') return true;
        if (Number.parseFloat(style.opacity) === 0 && style.pointerEvents === 'none') return true;
        element = composedParent(element);
      }
      return false;
    }

    function clippingAncestor(node, rect) {
      let element = node.parentElement;
      while (element) {
        const style = getComputedStyle(element);
        if (/(?:hidden|clip|auto|scroll)/.test(style.overflowX)) {
          const ancestorRect = element.getBoundingClientRect();
          if (rect.left < ancestorRect.left - 1 || rect.right > ancestorRect.right + 1) {
            return {
              element: descriptor(element),
              overflowX: style.overflowX,
              left: ancestorRect.left,
              right: ancestorRect.right,
            };
          }
        }
        element = composedParent(element);
      }
      return null;
    }

    function excludedElement(element) {
      let current = element;
      while (current) {
        if (current.hidden || current.inert) return true;
        if (current.tagName === 'DETAILS' && !current.open) {
          let branch = element;
          while (branch && composedParent(branch) !== current) branch = composedParent(branch);
          if (!branch || branch.tagName !== 'SUMMARY') return true;
        }
        const style = getComputedStyle(current);
        if (style.display === 'none' || style.visibility !== 'visible') return true;
        if (Number.parseFloat(style.opacity) === 0 && style.pointerEvents === 'none') return true;
        current = composedParent(current);
      }
      return false;
    }

    function inspectElementRoot(root, rootLabel) {
      for (const element of root.querySelectorAll('*')) {
        if (!(element instanceof HTMLElement) && !(element instanceof SVGElement)) continue;
        if (excludedElement(element)) continue;
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        visibleDescendantCount += 1;
        const viewportClipped = rect.left < -1 || rect.right > viewportWidth + 1;
        if (viewportClipped) {
          diagnostics.push({
            root: rootLabel,
            tag: element.tagName.toLowerCase(),
            id: element.id || '',
            classes: Array.from(element.classList || []).slice(0, 4),
            text: String(element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
            left: rect.left,
            right: rect.right,
            width: rect.width,
            viewportWidth,
            viewportClipped,
          });
        }
        if (element.shadowRoot) {
          inspectElementRoot(element.shadowRoot, `${rootLabel} > ${descriptor(element)}::shadow`);
        }
      }
    }

    function inspectTextRoot(root, rootLabel) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = String(node.nodeValue || '').replace(/\s+/g, ' ').trim();
        if (!text || excludedTextNode(node)) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rects = Array.from(range.getClientRects()).filter(rect => (
          rect.width > 0 && rect.height > 0
        ));
        if (!rects.length) continue;
        directTextNodeCount += 1;
        directTextFragmentCount += rects.length;
        rects.forEach((rect, fragmentIndex) => {
          const ancestor = clippingAncestor(node, rect);
          const viewportClipped = rect.left < -1 || rect.right > viewportWidth + 1;
          if (!viewportClipped && !ancestor) return;
          textDiagnostics.push({
            root: rootLabel,
            parent: descriptor(node.parentElement),
            text: text.slice(0, 160),
            fragmentIndex,
            left: rect.left,
            right: rect.right,
            width: rect.width,
            viewportWidth,
            viewportClipped,
            clippingAncestor: ancestor,
          });
        });
      }

      for (const element of root.querySelectorAll('*')) {
        if (element.shadowRoot) {
          inspectTextRoot(element.shadowRoot, `${rootLabel} > ${descriptor(element)}::shadow`);
        }
      }
    }

    inspectElementRoot(document.body, 'document.body');
    inspectTextRoot(document.body, 'document.body');

    return {
      visibleDescendantCount,
      clippedRectangleCount: diagnostics.length,
      clippedRectangles: diagnostics,
      directTextNodeCount,
      directTextFragmentCount,
      clippedTextFragmentCount: textDiagnostics.length,
      clippedTextFragments: textDiagnostics,
    };
  });
}

async function prepareResultAction(page, contract) {
  const scope = contract.form ? page.locator(contract.form) : page.locator('body');
  for (const step of contract.prepare || []) {
    const control = scope.getByLabel(step.label, { exact: true });
    await expect(control, `prepare ${step.label}`).toBeVisible();
    await expect(control, `enable ${step.label}`).toBeEnabled();
    if (step.type === 'select-index') {
      await control.selectOption({ index: step.index });
    } else if (step.type === 'fill') {
      await control.fill(step.value);
    } else {
      throw new Error(`Unknown French Agriculture result preparation: ${step.type}`);
    }
  }
}

async function performResultAction(page, row, contract) {
  await page.evaluate((actionContract) => {
    window.__FR_AGRI_RESULT_ACTION_OBSERVED__ = 0;
    window.__FR_AGRI_TEST__.latest = null;
    const target = actionContract.form
      ? document.querySelector(actionContract.form)
      : document.querySelector(actionContract.selector);
    if (!target) throw new Error(`Missing action target for ${actionContract.result}`);
    target.addEventListener(
      actionContract.form ? 'submit' : 'change',
      () => { window.__FR_AGRI_RESULT_ACTION_OBSERVED__ += 1; },
      { once: true },
    );
  }, contract);

  await prepareResultAction(page, contract);
  if (contract.action === 'select-index') {
    const control = page.locator(contract.selector);
    await expect(control, `${row.route} ${contract.label}`).toBeVisible();
    await expect(control, `${row.route} ${contract.label}`).toBeEnabled();
    await control.selectOption({ index: contract.index });
  } else {
    const form = page.locator(contract.form);
    await expect(form, `${row.route} action form`).toBeVisible();
    await form.getByRole('button', {
      name: contract.submitName,
      exact: true,
    }).click();
  }

  const result = page.locator(contract.result);
  await expect(result, `${row.route} populated result visibility`).toBeVisible();
  await expect.poll(
    async () => String(await result.innerText()).replace(/\s+/g, ' ').trim().length,
    { message: `${row.route} populated result text` },
  ).toBeGreaterThan(2);
  await expect.poll(
    () => page.evaluate(() => window.__FR_AGRI_RESULT_ACTION_OBSERVED__),
    { message: `${row.route} deterministic action event` },
  ).toBe(1);
  await expect.poll(
    () => page.evaluate(() => Boolean(window.__FR_AGRI_TEST__?.latest)),
    { message: `${row.route} actual runtime result` },
  ).toBe(true);

  return result.evaluate((element) => ({
    selector: `#${element.id}`,
    text: String(element.textContent || '').replace(/\s+/g, ' ').trim(),
    width: element.getBoundingClientRect().width,
    height: element.getBoundingClientRect().height,
  }));
}

async function inspectResultStateRoute(page, row, scenario, networkAudit) {
  await page.setViewportSize({ width: scenario.viewportWidth, height: 900 });
  const requestStart = networkAudit.allowedLocalRequests.length;
  const offOriginStart = networkAudit.offOriginRequests.length;
  const scriptStart = networkAudit.loadedLocalScripts.length;
  const pageErrorStart = networkAudit.pageErrors.length;
  const consoleErrorStart = networkAudit.consoleErrors.length;
  const documentResponse = await page.goto(row.route, { waitUntil: 'domcontentloaded' });
  expect(documentResponse, `${row.route} did not return a document response`).not.toBeNull();
  expect(documentResponse.status(), `${row.route} document status`).toBe(200);

  await page.waitForFunction(() => (
    Boolean(window.__FR_AGRI_TEST__)
    && Object.prototype.hasOwnProperty.call(window.__FR_AGRI_TEST__, 'latest')
  ));
  const baselineRootFontSize = await page.evaluate(() => (
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  ));
  expect(baselineRootFontSize, `${row.route} exact baseline root font size`).toBe(16);
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  const computedRootFontSize = await page.evaluate(() => (
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  ));
  expect(computedRootFontSize, `${row.route} exact scaled root font size`).toBe(32);

  const contract = resultActionContract(row.manifestRow);
  const actionRequestStart = networkAudit.allowedLocalRequests.length;
  const result = await performResultAction(page, row, contract);
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));

  const artwork = page.locator('img.hero-art');
  await expect(artwork, `${row.route} result-state artwork`).toBeVisible();
  const artworkState = await artwork.evaluate((image) => ({
    alt: image.getAttribute('alt') || '',
    complete: image.complete,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
  }));
  expect(artworkState.alt, `${row.route} result-state artwork alt`).toBe(row.expectedAlt);
  expect(artworkState.complete, `${row.route} result-state artwork completion`).toBe(true);
  expect(artworkState.naturalWidth, `${row.route} result-state artwork width`).toBeGreaterThan(0);
  expect(artworkState.naturalHeight, `${row.route} result-state artwork height`).toBeGreaterThan(0);

  const clipping = await inspectVisibleDescendantClipping(page);
  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    visualViewportWidth: window.visualViewport ? window.visualViewport.width : window.innerWidth,
  }));
  const localActionRequests = networkAudit.allowedLocalRequests.slice(actionRequestStart);
  const localActionWrites = localActionRequests.filter((request) => (
    !['GET', 'HEAD'].includes(request.method)
  ));
  const pageErrors = networkAudit.pageErrors.slice(pageErrorStart);
  const consoleErrors = networkAudit.consoleErrors.slice(consoleErrorStart);
  const privacy = await inspectPrivacyState(page);
  const offOriginRequests = networkAudit.offOriginRequests.slice(offOriginStart);
  expectStrictPrivacy(row, privacy, offOriginRequests);
  expect(localActionWrites, `${row.route} local action network writes`).toEqual([]);
  expect(pageErrors, `${row.route} page errors`).toEqual([]);
  expect(consoleErrors, `${row.route} console errors`).toEqual([]);
  expect(layout.clientWidth, `${row.route} fixed layout viewport`).toBe(scenario.viewportWidth);
  expect(layout.visualViewportWidth, `${row.route} fixed visual viewport`).toBeCloseTo(
    scenario.viewportWidth,
    0,
  );
  expect(layout.scrollWidth, `${row.route} result-state document reflow`).toBeLessThanOrEqual(
    layout.clientWidth + 1,
  );
  return {
    manifestIndex: row.manifestIndex,
    resultIndex: row.resultIndex,
    id: row.id,
    family: row.family,
    route: row.route,
    ownership: row.family === 'singleton' ? 'singleton' : 'family-country',
    action: {
      form: contract.form || null,
      submitName: contract.submitName || null,
      action: contract.action || 'submit',
      prepare: contract.prepare || [],
      eventObserved: 1,
    },
    resultSelector: contract.result,
    resultTextLength: result.text.length,
    resultTextSample: result.text.slice(0, 240),
    resultWidth: result.width,
    resultHeight: result.height,
    runtimeResultPopulated: true,
    viewportWidth: scenario.viewportWidth,
    effectiveViewportWidth: layout.clientWidth,
    visualViewportWidth: layout.visualViewportWidth,
    requestedTextScalePercent: 200,
    baselineRootFontSize,
    computedRootFontSize,
    appliedTextScale: computedRootFontSize / baselineRootFontSize,
    pageScrollWidth: layout.scrollWidth,
    loadedLocalScripts: Array.from(new Set(networkAudit.loadedLocalScripts.slice(scriptStart))),
    localRequests: networkAudit.allowedLocalRequests.length - requestStart,
    localActionRequests: localActionRequests.length,
    localActionWrites: localActionWrites.length,
    offOriginRequests,
    privacy,
    pageErrors,
    consoleErrors,
    visibleDescendantCount: clipping.visibleDescendantCount,
    clippedRectangleCount: clipping.clippedRectangleCount,
    clippedRectangles: clipping.clippedRectangles,
    directTextNodeCount: clipping.directTextNodeCount,
    directTextFragmentCount: clipping.directTextFragmentCount,
    clippedTextFragmentCount: clipping.clippedTextFragmentCount,
    clippedTextFragments: clipping.clippedTextFragments,
    artworkPreserved: true,
    artworkAlt: artworkState.alt,
  };
}

async function inspectRealRouteArtwork(page, row, scenario, networkAudit) {
  await page.setViewportSize({ width: scenario.viewportWidth, height: 900 });
  const offOriginStart = networkAudit.offOriginRequests.length;
  const pageErrorStart = networkAudit.pageErrors.length;
  const consoleErrorStart = networkAudit.consoleErrors.length;
  const documentResponse = await page.goto(row.route, { waitUntil: 'domcontentloaded' });
  expect(documentResponse, `${row.route} did not return a document response`).not.toBeNull();
  expect(documentResponse.status(), `${row.route} document status`).toBe(200);

  const baselineRootFontSize = await page.evaluate(() => (
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  ));
  if (scenario.textScalePercent !== 100) {
    await page.addStyleTag({
      content: `html { font-size: ${scenario.textScalePercent}% !important; }`,
    });
  }

  const artwork = page.locator('img.hero-art');
  await expect(artwork, `${row.route} real hero artwork count`).toHaveCount(1);
  await expect(artwork, `${row.route} real hero artwork visibility`).toBeVisible();

  const result = await artwork.evaluate(async (image, scenarioVerifyResourceStatus) => {
    if (!image.complete || image.naturalWidth <= 0) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('hero artwork load timeout')), 10000);
        image.addEventListener('load', () => {
          clearTimeout(timer);
          resolve();
        }, { once: true });
        image.addEventListener('error', () => {
          clearTimeout(timer);
          reject(new Error('hero artwork resource error'));
        }, { once: true });
      });
    }

    const resourceResponse = scenarioVerifyResourceStatus
      ? await fetch(image.currentSrc || image.src, {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      : null;
    const style = getComputedStyle(image);
    const rect = image.getBoundingClientRect();
    const root = document.documentElement;
    const rootFontSize = Number.parseFloat(getComputedStyle(root).fontSize);
    return {
      srcAttribute: image.getAttribute('src') || '',
      currentSrc: image.currentSrc || image.src,
      alt: image.getAttribute('alt') || '',
      hidden: image.hidden || image.getAttribute('aria-hidden') === 'true',
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      resourceStatus: resourceResponse ? resourceResponse.status : 200,
      resourceOk: resourceResponse ? resourceResponse.ok : true,
      computedDisplay: style.display,
      computedVisibility: style.visibility,
      computedOpacity: Number.parseFloat(style.opacity),
      renderedWidth: rect.width,
      renderedHeight: rect.height,
      renderedLeft: rect.left,
      renderedRight: rect.right,
      pageClientWidth: root.clientWidth,
      pageScrollWidth: root.scrollWidth,
      rootFontSize,
      visualViewportWidth: window.visualViewport ? window.visualViewport.width : window.innerWidth,
    };
  }, scenario.verifyResourceStatus !== false);

  const metadata = await page.evaluate(() => ({
    og: document.querySelector('meta[property="og:image"]')?.content || '',
    twitter: document.querySelector('meta[name="twitter:image"]')?.content || '',
  }));

  const expectedAsset = `/${row.asset.replace(/^\/+/, '')}`;
  const baseUrl = new URL(page.url()).origin;
  const appliedTextScale = result.rootFontSize / baselineRootFontSize;
  const clipping = scenario.inspectVisibleDescendantClipping
    ? await inspectVisibleDescendantClipping(page)
    : {
      visibleDescendantCount: 0,
      clippedRectangleCount: 0,
      clippedRectangles: [],
      directTextNodeCount: 0,
      directTextFragmentCount: 0,
      clippedTextFragmentCount: 0,
      clippedTextFragments: [],
    };

  expect(publicPath(result.srcAttribute, baseUrl), `${row.route} hero src`).toBe(expectedAsset);
  expect(publicPath(result.currentSrc, baseUrl), `${row.route} loaded hero resource`).toBe(expectedAsset);
  expect(publicPath(metadata.og, baseUrl), `${row.route} Open Graph image`).toBe(expectedAsset);
  expect(publicPath(metadata.twitter, baseUrl), `${row.route} Twitter image`).toBe(expectedAsset);
  expect(hasMeaningfulArtworkAlt(result.alt), `${row.route} semantic French alt`).toBe(true);
  expect(result.alt, `${row.route} exact family-semantic alt`).toBe(row.expectedAlt);
  expect(result.hidden, `${row.route} hero must not be hidden`).toBe(false);
  expect(result.complete, `${row.route} hero resource completion`).toBe(true);
  expect(result.resourceOk, `${row.route} hero resource status ${result.resourceStatus}`).toBe(true);
  expect(result.resourceStatus, `${row.route} hero resource status`).toBe(200);
  expect(result.naturalWidth, `${row.route} natural width`).toBeGreaterThan(0);
  expect(result.naturalHeight, `${row.route} natural height`).toBeGreaterThan(0);
  expect(result.computedDisplay, `${row.route} computed display`).not.toBe('none');
  expect(result.computedVisibility, `${row.route} computed visibility`).toBe('visible');
  expect(result.computedOpacity, `${row.route} computed opacity`).toBeGreaterThan(0);
  expect(result.renderedWidth, `${row.route} rendered width`).toBeGreaterThan(0);
  expect(result.renderedHeight, `${row.route} rendered height`).toBeGreaterThan(0);
  expect(result.renderedLeft, `${row.route} left edge`).toBeGreaterThanOrEqual(-1);
  expect(result.renderedRight, `${row.route} right edge`).toBeLessThanOrEqual(result.pageClientWidth + 1);
  if (!scenario.deferPageReflowAssertion) {
    expect(result.pageScrollWidth, `${row.route} horizontal reflow`).toBeLessThanOrEqual(result.pageClientWidth + 1);
  }
  expect(result.pageClientWidth, `${row.route} effective layout viewport`).toBe(scenario.viewportWidth);
  expect(result.visualViewportWidth, `${row.route} effective visual viewport`).toBeCloseTo(scenario.viewportWidth, 0);

  if (scenario.textScalePercent === 200) {
    expect(appliedTextScale, `${row.route} applied 200% text scale`).toBeGreaterThanOrEqual(1.95);
    expect(appliedTextScale, `${row.route} applied 200% text scale`).toBeLessThanOrEqual(2.05);
  } else {
    expect(appliedTextScale, `${row.route} baseline text scale`).toBeCloseTo(1, 2);
  }
  if (scenario.exactBaselineRootFontSize) {
    expect(baselineRootFontSize, `${row.route} exact baseline root font size`).toBe(
      scenario.exactBaselineRootFontSize,
    );
  }
  if (scenario.exactScaledRootFontSize) {
    expect(result.rootFontSize, `${row.route} exact scaled root font size`).toBe(
      scenario.exactScaledRootFontSize,
    );
  }
  if (scenario.inspectVisibleDescendantClipping) {
    expect(
      clipping.clippedRectangles,
      `${row.route} clipped visible descendants`,
    ).toHaveLength(0);
    expect(
      clipping.clippedTextFragments,
      `${row.route} clipped direct text fragments`,
    ).toHaveLength(0);
  }
  const privacy = await inspectPrivacyState(page);
  const offOriginRequests = networkAudit.offOriginRequests.slice(offOriginStart);
  const pageErrors = networkAudit.pageErrors.slice(pageErrorStart);
  const consoleErrors = networkAudit.consoleErrors.slice(consoleErrorStart);
  expectStrictPrivacy(row, privacy, offOriginRequests);
  expect(pageErrors, `${row.route} page errors`).toEqual([]);
  expect(consoleErrors, `${row.route} console errors`).toEqual([]);

  return {
    manifestIndex: row.manifestIndex,
    id: row.id,
    route: row.route,
    scenario: scenario.label,
    viewportWidth: scenario.viewportWidth,
    effectiveViewportWidth: result.pageClientWidth,
    visualViewportWidth: result.visualViewportWidth,
    requestedTextScalePercent: scenario.textScalePercent,
    baselineRootFontSize,
    computedRootFontSize: result.rootFontSize,
    appliedTextScale,
    asset: expectedAsset,
    hero: publicPath(result.currentSrc, baseUrl),
    og: publicPath(metadata.og, baseUrl),
    twitter: publicPath(metadata.twitter, baseUrl),
    heroAlt: result.alt,
    expectedHeroAlt: row.expectedAlt,
    heroHidden: result.hidden,
    heroResourceStatus: result.resourceStatus,
    heroResourceLoaded: result.complete && result.naturalWidth > 0 && result.naturalHeight > 0,
    computedDisplay: result.computedDisplay,
    computedVisibility: result.computedVisibility,
    computedOpacity: result.computedOpacity,
    naturalWidth: result.naturalWidth,
    naturalHeight: result.naturalHeight,
    renderedWidth: result.renderedWidth,
    renderedHeight: result.renderedHeight,
    pageClientWidth: result.pageClientWidth,
    pageScrollWidth: result.pageScrollWidth,
    visibleDescendantCount: clipping.visibleDescendantCount,
    clippedRectangleCount: clipping.clippedRectangleCount,
    clippedRectangles: clipping.clippedRectangles,
    directTextNodeCount: clipping.directTextNodeCount,
    directTextFragmentCount: clipping.directTextFragmentCount,
    clippedTextFragmentCount: clipping.clippedTextFragmentCount,
    clippedTextFragments: clipping.clippedTextFragments,
    offOriginRequests,
    privacy,
    pageErrors,
    consoleErrors,
  };
}

const payload = manifest.rows.map((row, manifestIndex) => ({
  manifestIndex,
  manifestRow: row,
  id: row.english.id,
  family: row.family,
  country: row.country || null,
  route: row.french.route,
  routeKey: row.french.routeKey,
  imageId: row.artwork.imageId,
  asset: row.artwork.file.replace(/\\/g, '/'),
  expectedAlt: expectedArtworkAlt(row),
}));
const resultPayload = payload
  .filter((row) => isResultCapable(row.manifestRow))
  .map((row, resultIndex) => ({ ...row, resultIndex }));

test('all 447 French Agriculture routes render their actual accessible artwork', async ({ page }) => {
  test.setTimeout(900000);
  const networkAudit = await keepBrowserLocal(page);

  const scenario = {
    label: '320px-route-real',
    viewportWidth: 320,
    textScalePercent: 100,
    verifyResourceStatus: true,
  };
  const rows = [];
  for (const row of payload) {
    rows.push(await inspectRealRouteArtwork(page, row, scenario, networkAudit));
  }

  writeJson(process.env.FR_AGRI_ARTWORK_PROOF_OUTPUT, {
    schemaVersion: 2,
    programme: 'fr-agriculture-artwork-closeout',
    evidenceStatus: 'route-real-no-clones-no-forced-image-styles',
    checkedAt: new Date().toISOString(),
    baseUrl: new URL(page.url()).origin,
    ownedServerPid: Number(process.env.FR_AGRI_ARTWORK_SERVER_PID || 0),
    proofMethod: {
      navigation: 'Each manifest route was opened as the top-level document.',
      artwork: 'The route-owned img.hero-art was measured in place with its authored computed styles.',
      resource: 'The displayed currentSrc was fetched same-origin and required HTTP 200 plus natural dimensions.',
      browserNetwork: 'All same-origin application scripts were allowed to execute; any attempted off-origin request fails the proof and its complete request envelope is recorded.',
      prohibitedMethods: ['DOMParser route substitution', 'cloned artwork', 'forced image display', 'forced image dimensions'],
    },
    summary: {
      routes: rows.length,
      routeStatus200: rows.length,
      ogResolved: rows.filter((row) => row.og === row.asset).length,
      twitterResolved: rows.filter((row) => row.twitter === row.asset).length,
      visiblePageArtworkResolved: rows.filter((row) => row.hero === row.asset).length,
      visiblePageArtworkAccessible: rows.filter((row) => (
        hasMeaningfulArtworkAlt(row.heroAlt)
        && row.heroAlt === row.expectedHeroAlt
        && !row.heroHidden
      )).length,
      visiblePageArtworkResourcesLoaded: rows.filter((row) => row.heroResourceLoaded).length,
      visiblePageArtworkRendered: rows.filter((row) => (
        row.computedDisplay !== 'none'
        && row.computedVisibility === 'visible'
        && row.computedOpacity > 0
        && row.renderedWidth > 0
        && row.renderedHeight > 0
      )).length,
      horizontalReflowPassed: rows.filter((row) => row.pageScrollWidth <= row.pageClientWidth + 1).length,
      ...privacySummary(rows),
      failures: 0,
    },
    rows,
  });

  expect(rows).toHaveLength(447);
});

test('all 447 French Agriculture routes preserve artwork at 200% text and 375px', async ({ page }) => {
  test.setTimeout(900000);
  const networkAudit = await keepBrowserLocal(page);

  const scenario = {
    label: '375px-200-percent-text',
    viewportWidth: 375,
    textScalePercent: 200,
    deferPageReflowAssertion: true,
    verifyResourceStatus: false,
  };
  const rows = [];
  for (const row of payload) {
    rows.push(await inspectRealRouteArtwork(page, row, scenario, networkAudit));
  }

  const reflowFailures = rows.filter((row) => row.pageScrollWidth > row.pageClientWidth + 1);
  writeJson(process.env.FR_AGRI_ARTWORK_RESPONSIVE_OUTPUT, {
    schemaVersion: 2,
    programme: 'fr-agriculture-artwork-reflow',
    checkedAt: new Date().toISOString(),
    baseUrl: new URL(page.url()).origin,
    ownedServerPid: Number(process.env.FR_AGRI_ARTWORK_SERVER_PID || 0),
    proofMethod: {
      viewport: 'Real 375 CSS pixel layout and visual viewport.',
      textScale: 'Repository-standard html { font-size: 200% !important } browser emulation.',
      scaleAssertion: 'Computed root font size must be 1.95x to 2.05x the route baseline.',
      artwork: 'Route-owned img.hero-art measured in place; no image styles were injected or changed.',
      browserNetwork: 'All same-origin application scripts were allowed to execute; any attempted off-origin request fails the proof and its complete request envelope is recorded.',
    },
    summary: {
      routes: rows.length,
      scenarios: 1,
      assertions: rows.length,
      requestedTextScalePercent: 200,
      effectiveViewportWidth: 375,
      minimumAppliedTextScale: Math.min(...rows.map((row) => row.appliedTextScale)),
      maximumAppliedTextScale: Math.max(...rows.map((row) => row.appliedTextScale)),
      horizontalReflowPassed: rows.filter((row) => row.pageScrollWidth <= row.pageClientWidth + 1).length,
      visibleArtworkPassed: rows.filter((row) => (
        row.heroResourceLoaded
        && row.computedDisplay !== 'none'
        && row.computedVisibility === 'visible'
        && row.computedOpacity > 0
        && row.renderedWidth > 0
        && row.renderedHeight > 0
      )).length,
      ...privacySummary(rows),
      failures: reflowFailures.length,
    },
    rows,
  });

  expect(rows).toHaveLength(447);
  expect(reflowFailures, JSON.stringify(reflowFailures, null, 2)).toHaveLength(0);
});

test('French Agriculture route shard reflows at 320px with exact 16 to 32 root text scaling', async ({ page }) => {
  test.setTimeout(900000);
  const networkAudit = await keepBrowserLocal(page);

  const shardCount = Number(process.env.FR_AGRI_ARTWORK_SHARD_COUNT || 1);
  const shardIndex = Number(process.env.FR_AGRI_ARTWORK_SHARD_INDEX || 0);
  expect(Number.isInteger(shardCount) && shardCount > 0, 'valid shard count').toBe(true);
  expect(Number.isInteger(shardIndex) && shardIndex >= 0 && shardIndex < shardCount, 'valid shard index').toBe(true);
  const shardStart = Math.floor(payload.length * shardIndex / shardCount);
  const shardEnd = Math.floor(payload.length * (shardIndex + 1) / shardCount);
  const shardPayload = payload.slice(shardStart, shardEnd);
  const scenario = {
    label: '320px-exact-200-percent-root-text',
    viewportWidth: 320,
    textScalePercent: 200,
    exactBaselineRootFontSize: 16,
    exactScaledRootFontSize: 32,
    inspectVisibleDescendantClipping: true,
    deferPageReflowAssertion: true,
    verifyResourceStatus: false,
  };
  const rows = [];
  for (const row of shardPayload) {
    rows.push(await inspectRealRouteArtwork(page, row, scenario, networkAudit));
  }

  const reflowFailures = rows.filter((row) => (
    row.pageScrollWidth > row.pageClientWidth + 1
    || row.clippedRectangleCount > 0
    || row.clippedTextFragmentCount > 0
  ));
  writeJson(process.env.FR_AGRI_ARTWORK_320_REFLOW_OUTPUT, {
    schemaVersion: 1,
    programme: 'fr-agriculture-artwork-320-exact-reflow',
    checkedAt: new Date().toISOString(),
    baseUrl: new URL(page.url()).origin,
    ownedServerPid: Number(process.env.FR_AGRI_ARTWORK_SERVER_PID || 0),
    shard: {
      index: shardIndex,
      ordinal: shardIndex + 1,
      count: shardCount,
      startManifestIndex: shardStart,
      endManifestIndexExclusive: shardEnd,
    },
    proofMethod: {
      viewport: 'Real fixed 320 CSS pixel layout and visual viewport.',
      textScale: 'html { font-size: 200% !important } applied after an exact 16px baseline.',
      scaleAssertion: 'Every route must compute the root font size from exactly 16px to exactly 32px.',
      clipping: 'Every visible body descendant and each direct non-whitespace text-node Range fragment is measured unconditionally across light DOM and every open shadow root; clipping ancestors are recorded and failures do not depend on document scrollWidth.',
      artwork: 'Route-owned img.hero-art measured in place; no image styles were injected or changed.',
      browserNetwork: 'All same-origin application scripts were allowed to execute; any attempted off-origin request fails the proof and its complete request envelope is recorded.',
    },
    summary: {
      routes: rows.length,
      manifestRoutes: payload.length,
      scenarios: 1,
      assertions: rows.length,
      requestedTextScalePercent: 200,
      effectiveViewportWidth: 320,
      exactBaselineRootFontSize: 16,
      exactScaledRootFontSize: 32,
      exactRootScalePassed: rows.filter((row) => (
        row.baselineRootFontSize === 16
        && row.computedRootFontSize === 32
        && row.appliedTextScale === 2
      )).length,
      horizontalReflowPassed: rows.filter((row) => (
        row.pageScrollWidth <= row.pageClientWidth + 1
      )).length,
      visibleDescendantClippingPassed: rows.filter((row) => (
        row.visibleDescendantCount > 0
        && row.clippedRectangleCount === 0
      )).length,
      directTextFragmentClippingPassed: rows.filter((row) => (
        row.directTextNodeCount > 0
        && row.directTextFragmentCount > 0
        && row.clippedTextFragmentCount === 0
      )).length,
      visibleArtworkPassed: rows.filter((row) => (
        row.heroResourceLoaded
        && row.computedDisplay !== 'none'
        && row.computedVisibility === 'visible'
        && row.computedOpacity > 0
        && row.renderedWidth > 0
        && row.renderedHeight > 0
      )).length,
      ...privacySummary(rows),
      failures: reflowFailures.length,
    },
    rows,
  });

  expect(rows).toHaveLength(shardEnd - shardStart);
  expect(reflowFailures, JSON.stringify(reflowFailures, null, 2)).toHaveLength(0);
});

test('French Agriculture result-capable route shard renders populated result states at fixed 320px and exact 16 to 32 root text scaling', async ({ page }) => {
  test.setTimeout(900000);
  const networkAudit = await keepBrowserLocal(page);

  expect(resultPayload).toHaveLength(435);
  expect(resultPayload.filter((row) => row.family === 'singleton')).toHaveLength(21);
  expect(resultPayload.filter((row) => row.family !== 'singleton')).toHaveLength(414);
  const notApplicableHubs = payload.filter((row) => !isResultCapable(row.manifestRow));
  expect(notApplicableHubs).toHaveLength(12);

  const shardCount = Number(process.env.FR_AGRI_RESULT_SHARD_COUNT || 1);
  const shardIndex = Number(process.env.FR_AGRI_RESULT_SHARD_INDEX || 0);
  expect(Number.isInteger(shardCount) && shardCount > 0, 'valid result shard count').toBe(true);
  expect(
    Number.isInteger(shardIndex) && shardIndex >= 0 && shardIndex < shardCount,
    'valid result shard index',
  ).toBe(true);
  const shardStart = Math.floor(resultPayload.length * shardIndex / shardCount);
  const shardEnd = Math.floor(resultPayload.length * (shardIndex + 1) / shardCount);
  const shardPayload = resultPayload.slice(shardStart, shardEnd);
  const scenario = {
    label: '320px-exact-200-percent-populated-result-state',
    viewportWidth: 320,
  };
  const rows = [];

  function receipt(failure) {
    return {
      schemaVersion: 1,
      programme: 'fr-agriculture-populated-result-state-320-exact-reflow',
      checkedAt: new Date().toISOString(),
      baseUrl: new URL(page.url()).origin,
      ownedServerPid: Number(process.env.FR_AGRI_ARTWORK_SERVER_PID || 0),
      status: failure ? 'failed' : 'passed',
      shard: {
        index: shardIndex,
        ordinal: shardIndex + 1,
        count: shardCount,
        startResultIndex: shardStart,
        endResultIndexExclusive: shardEnd,
      },
      scope: {
        manifestRoutes: payload.length,
        resultCapableRoutes: resultPayload.length,
        familyCountryRoutes: resultPayload.filter((row) => row.family !== 'singleton').length,
        singletonRoutes: resultPayload.filter((row) => row.family === 'singleton').length,
        familyHubsNotApplicable: notApplicableHubs.length,
      },
      notApplicableFamilyHubs: notApplicableHubs.map((row) => ({
        manifestIndex: row.manifestIndex,
        family: row.family,
        route: row.route,
        reason: 'Family discovery hub has no calculation result state.',
      })),
      proofMethod: {
        viewport: 'Real fixed 320 CSS pixel layout and visual viewport.',
        textScale: 'Computed root font size asserted exactly 16px before and 32px after html { font-size: 200% !important }.',
        runtime: 'Every route loaded all same-origin application scripts and exposed its real runtime test contract before interaction.',
        actions: 'A reviewed family or singleton contract prepared required valid inputs and activated the authored form control or selector change.',
        result: 'The authored result surface became visible, contained rendered text, and the real application runtime published a fresh result after the observed action event.',
        privacy: 'Same-origin scripts ran normally; any attempted off-origin request, forbidden passive storage mutation, pre-consent analytics command, or result-action network write fails the proof. Full request envelopes and local/session storage mutations are recorded.',
        clipping: 'Every visible element rectangle and every direct non-whitespace text-node Range fragment was inspected recursively through light DOM and every open shadow root without a document-overflow early return.',
        artwork: 'The route-owned hero remained loaded, visible, and family-semantically labelled after result rendering.',
      },
      summary: {
        routes: rows.length,
        expectedShardRoutes: shardEnd - shardStart,
        exactRootScalePassed: rows.filter((row) => (
          row.baselineRootFontSize === 16
          && row.computedRootFontSize === 32
          && row.appliedTextScale === 2
        )).length,
        deterministicActionsPassed: rows.filter((row) => row.action.eventObserved === 1).length,
        runtimeResultsPopulated: rows.filter((row) => row.runtimeResultPopulated).length,
        horizontalReflowPassed: rows.filter((row) => (
          row.pageScrollWidth <= row.effectiveViewportWidth + 1
        )).length,
        visibleDescendantClippingPassed: rows.filter((row) => (
          row.visibleDescendantCount > 0 && row.clippedRectangleCount === 0
        )).length,
        directTextFragmentClippingPassed: rows.filter((row) => (
          row.directTextNodeCount > 0
          && row.directTextFragmentCount > 0
          && row.clippedTextFragmentCount === 0
        )).length,
        artworkPreserved: rows.filter((row) => row.artworkPreserved).length,
        localActionNetworkWrites: rows.reduce((sum, row) => sum + row.localActionWrites, 0),
        offOriginRequests: rows.reduce(
          (sum, row) => sum + row.offOriginRequests.length,
          0,
        ),
        forbiddenStorageMutations: privacySummary(rows).forbiddenStorageMutations,
        analyticsCommandsBeforeConsent: privacySummary(rows).analyticsCommandsBeforeConsent,
        analyticsConfiguredBeforeConsent: privacySummary(rows).analyticsConfiguredBeforeConsent,
        googleTagsBeforeConsent: privacySummary(rows).googleTagsBeforeConsent,
        pageErrors: privacySummary(rows).pageErrors,
        consoleErrors: privacySummary(rows).consoleErrors,
        directTextNodes: rows.reduce((sum, row) => sum + row.directTextNodeCount, 0),
        directTextFragments: rows.reduce((sum, row) => sum + row.directTextFragmentCount, 0),
        clippedTextFragments: rows.reduce((sum, row) => sum + row.clippedTextFragmentCount, 0),
        failures: failure ? 1 : 0,
      },
      failure: failure || null,
      rows,
    };
  }

  for (const row of shardPayload) {
    try {
      const result = await inspectResultStateRoute(page, row, scenario, networkAudit);
      rows.push(result);
      expect(
        result.clippedRectangles,
        `${row.route} result-state clipped visible descendants`,
      ).toHaveLength(0);
      expect(
        result.clippedTextFragments,
        `${row.route} result-state clipped direct text fragments`,
      ).toHaveLength(0);
    } catch (error) {
      writeJson(process.env.FR_AGRI_RESULT_REFLOW_OUTPUT, receipt({
        manifestIndex: row.manifestIndex,
        resultIndex: row.resultIndex,
        id: row.id,
        family: row.family,
        route: row.route,
        message: String(error && error.stack ? error.stack : error),
      }));
      throw error;
    }
  }

  writeJson(process.env.FR_AGRI_RESULT_REFLOW_OUTPUT, receipt(null));
  expect(rows).toHaveLength(shardEnd - shardStart);
});
