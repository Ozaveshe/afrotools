const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const presentation = require('../../assets/js/lib/french-mortgage-property-presentation');

const worktreeRoot = path.resolve(__dirname, '..', '..');
const manifest = JSON.parse(fs.readFileSync(
  path.join(worktreeRoot, 'data', 'registry', 'french-mortgage-property.json'),
  'utf8'
));
const evidencePath = process.env.MP66_BROWSER_EVIDENCE || path.join(
  worktreeRoot,
  'artifacts',
  'french-mortgage-property',
  'browser-evidence.json'
);
const forbiddenWorkflowControl = /inscrire|signup|register|export|télécharger|download|imprimer|print|copier|copy|partager|share|ouvrir|open|suivant|next/i;

function fieldValues(row) {
  return Object.fromEntries(row.fields.map((field) => [
    field.name,
    field.type === 'checkbox' ? field.fixtureValue === 'true' : field.fixtureValue
  ]));
}

function resultLines(row, resultFields) {
  const input = presentation.presentInputs(row.englishId, row.fields, fieldValues(row));
  const lines = [`Outil : ${row.name}`, `Route : ${row.frenchRoute}`];
  Object.keys(input).forEach((key) => lines.push(`Entrée ${key} : ${input[key]}`));
  Object.keys(resultFields).forEach((key) => lines.push(`Résultat ${key} : ${resultFields[key]}`));
  lines.push(
    `Résumé : ${row.exportContract.fixture.expectedSummary}`,
    `Vérifié le : ${row.sourceCheckedAt}`,
    'Estimation de planification; vérification officielle ou professionnelle requise.'
  );
  return lines;
}

function pdfAscii(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\n]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function safeFixtureNeedles(row) {
  return row.fields
    .map((field) => String(field.fixtureValue))
    .filter((value) => value.length >= 6 && !/^(true|false)$/i.test(value));
}

function sensitiveKeys(value, pathPrefix = '') {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const keyPath = pathPrefix ? `${pathPrefix}.${key}` : key;
    const own = /^(password|token|email|account|cookie|secret|authorization)$/i.test(key) ? [keyPath] : [];
    return own.concat(sensitiveKeys(child, keyPath));
  });
}

async function readDownload(download) {
  const failure = await download.failure();
  expect(failure).toBeNull();
  const stream = await download.createReadStream();
  expect(stream).toBeTruthy();
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function contrastReceipt(locator) {
  return locator.evaluate((node) => {
    const parse = (value) => {
      const match = String(value).match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
      if (!match) throw new Error(`Unsupported computed colour: ${value}`);
      return match.slice(1, 4).map(Number);
    };
    const luminance = (rgb) => rgb
      .map((channel) => channel / 255)
      .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
      .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const style = getComputedStyle(node);
    const foreground = style.color;
    const background = style.backgroundColor;
    const foregroundLuminance = luminance(parse(foreground));
    const backgroundLuminance = luminance(parse(background));
    return {
      foreground,
      background,
      ratio: (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
        (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
    };
  });
}

async function primaryActionStateContrasts(page, control, label) {
  await control.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const states = { normal: await contrastReceipt(control) };
  await control.hover();
  states.hover = await contrastReceipt(control);
  await page.mouse.move(0, 0);
  await control.focus();
  states.focus = await contrastReceipt(control);
  const box = await control.boundingBox();
  expect(box, `${label}: primary action geometry`).toBeTruthy();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  states.active = await contrastReceipt(control);
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await control.evaluate((node) => { node.disabled = true; });
  states.disabled = await contrastReceipt(control);
  await control.evaluate((node) => { node.disabled = false; });
  for (const [state, proof] of Object.entries(states)) {
    expect(proof.ratio, `${label}:${state} contrast ${JSON.stringify(proof)}`).toBeGreaterThanOrEqual(4.5);
  }
  return states;
}

async function linkActionStateContrasts(page, control, label) {
  await control.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const states = { normal: await contrastReceipt(control) };
  await control.hover();
  states.hover = await contrastReceipt(control);
  await page.mouse.move(0, 0);
  await control.focus();
  states.focus = await contrastReceipt(control);
  const box = await control.boundingBox();
  expect(box, `${label}: primary link geometry`).toBeTruthy();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  states.active = await contrastReceipt(control);
  await page.mouse.move(0, 0);
  await page.mouse.up();
  for (const [state, proof] of Object.entries(states)) {
    expect(proof.ratio, `${label}:${state} contrast ${JSON.stringify(proof)}`).toBeGreaterThanOrEqual(4.5);
  }
  return states;
}

async function proveTextReflow(page, row, state) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.waitForFunction(() => {
    const assistant = document.querySelector('afro-site-assistant');
    return Boolean(
      document.querySelector('afro-navbar')?.shadowRoot &&
      document.querySelector('afro-footer')?.shadowRoot &&
      (!assistant || assistant.shadowRoot)
    );
  }, null, { timeout: 10_000 });
  const reflow = await page.evaluate(() => {
    const root = document.documentElement;
    const baselinePx = Number.parseFloat(getComputedStyle(root).fontSize);
    const resizeStyle = document.createElement('style');
    resizeStyle.dataset.mp66TextResize = '200';
    resizeStyle.textContent = `html { font-size: ${baselinePx * 2}px !important; }`;
    document.head.appendChild(resizeStyle);
    const resizedPx = Number.parseFloat(getComputedStyle(root).fontSize);
    const viewportWidth = root.clientWidth;
    const diagnostics = [];
    const allOverflowDiagnostics = [];
    let openShadowRootCount = 0;
    const inspectRoot = (scanRoot, shadowHost) => {
      const nodes = [...scanRoot.querySelectorAll('*')];
      for (const node of nodes) {
        if (!(node instanceof HTMLElement) && !(node instanceof SVGElement)) continue;
        const rects = [...node.getClientRects()];
        if (rects.length && !rects.every((rect) => rect.width <= 0 || rect.height <= 0)) {
          for (const rect of rects) {
            if (rect.width <= 0 || rect.height <= 0) continue;
            if (rect.left < -1 || rect.right > viewportWidth + 1) {
              const diagnostic = {
                kind: 'element-rectangle',
                tag: node.tagName.toLowerCase(),
                id: node.id || '',
                className: typeof node.className === 'string' ? node.className.slice(0, 120) : '',
                left: Number(rect.left.toFixed(2)),
                right: Number(rect.right.toFixed(2)),
                width: Number(rect.width.toFixed(2)),
                viewportWidth,
                shadowHost: shadowHost
                  ? `${shadowHost.tagName.toLowerCase()}#${shadowHost.id || ''}.${String(shadowHost.className || '').slice(0, 80)}`
                  : null
              };
              allOverflowDiagnostics.push(diagnostic);
              diagnostics.push(diagnostic);
              break;
            }
          }
          for (const textNode of [...node.childNodes].filter((child) => (
            child.nodeType === Node.TEXT_NODE && child.textContent.trim()
          ))) {
            const range = document.createRange();
            range.selectNodeContents(textNode);
            for (const rect of range.getClientRects()) {
              if (rect.width <= 0 || rect.height <= 0) continue;
              if (rect.left < -1 || rect.right > viewportWidth + 1) {
                const diagnostic = {
                  kind: 'text-fragment',
                  tag: node.tagName.toLowerCase(),
                  id: node.id || '',
                  className: typeof node.className === 'string' ? node.className.slice(0, 120) : '',
                  text: textNode.textContent.trim().replace(/\s+/g, ' ').slice(0, 160),
                  left: Number(rect.left.toFixed(2)),
                  right: Number(rect.right.toFixed(2)),
                  width: Number(rect.width.toFixed(2)),
                  viewportWidth,
                  shadowHost: shadowHost
                    ? `${shadowHost.tagName.toLowerCase()}#${shadowHost.id || ''}.${String(shadowHost.className || '').slice(0, 80)}`
                    : null
                };
                allOverflowDiagnostics.push(diagnostic);
                diagnostics.push(diagnostic);
                break;
              }
            }
          }
        }
        if (node.shadowRoot) {
          openShadowRootCount += 1;
          inspectRoot(node.shadowRoot, node);
        }
      }
    };
    inspectRoot(document, null);
    const documentOverflow = root.scrollWidth - root.clientWidth;
    resizeStyle.remove();
    return {
      baselinePx,
      resizedPx,
      scale: resizedPx / baselinePx,
      viewportWidth,
      documentOverflow,
      diagnostics,
      allOverflowDiagnostics,
      diagnosticCount: diagnostics.length,
      openShadowRootCount
    };
  });
  expect(reflow.baselinePx, `${row.englishId}:${state}: exact baseline root size`).toBeCloseTo(16, 5);
  expect(reflow.resizedPx, `${row.englishId}:${state}: exact doubled root size`).toBeCloseTo(32, 5);
  expect(reflow.scale, `${row.englishId}:${state}: exact computed text resize scale ${JSON.stringify(reflow)}`).toBeCloseTo(2, 5);
  expect(reflow.diagnostics, `${row.englishId}:${state}: clipped visible descendants ${JSON.stringify(reflow.diagnostics)}`).toEqual([]);
  expect(
    reflow.documentOverflow,
    `${row.englishId}:${state}: 200% document overflow ${JSON.stringify(reflow.allOverflowDiagnostics)}`
  ).toBeLessThanOrEqual(1);
  expect(reflow.openShadowRootCount, `${row.englishId}:${state}: open shadow roots inspected`).toBeGreaterThanOrEqual(3);
  return {
    baselinePx: reflow.baselinePx,
    resizedPx: reflow.resizedPx,
    scale: reflow.scale,
    documentOverflow: reflow.documentOverflow,
    visibleDescendantDiagnostics: reflow.diagnosticCount,
    openShadowRootCount: reflow.openShadowRootCount,
    directTextFragmentsInspected: true
  };
}

async function proveHub(browser) {
  const baseURL = process.env.MP66_BASE_URL;
  expect(baseURL, 'hub: portable test origin').toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  const routeURL = new URL('/fr/mortgage-property/', baseURL).href;
  const context = await browser.newContext({
    colorScheme: 'light',
    reducedMotion: 'reduce',
    viewport: { width: 375, height: 900 }
  });
  await context.addInitScript(() => {
    window.__mp66AnalyticsEvents = [];
    window.dataLayer = window.dataLayer || [];
    const dataLayerPush = window.dataLayer.push.bind(window.dataLayer);
    window.dataLayer.push = (...items) => {
      window.__mp66AnalyticsEvents.push(...items);
      return dataLayerPush(...items);
    };
  });
  const page = await context.newPage();
  const consoleMessages = [];
  const consoleErrors = [];
  const pageErrors = [];
  const requestRecordPromises = [];
  page.on('console', (message) => {
    consoleMessages.push({ type: message.type(), text: message.text() });
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const requestHandler = (request) => {
    requestRecordPromises.push((async () => {
      const fullURL = request.url();
      const parsed = new URL(fullURL);
      return {
        method: request.method(),
        url: fullURL,
        query: parsed.search,
        hash: parsed.hash,
        body: request.postData() || '',
        headers: await request.allHeaders()
      };
    })());
  };
  page.on('request', requestHandler);

  try {
    const response = await page.goto(routeURL, { waitUntil: 'domcontentloaded' });
    console.log('[mp66 hub] navigation ready');
    expect(response && response.ok()).toBeTruthy();
    expect(page.url()).toBe(routeURL);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('h1')).toContainText('Crédit immobilier');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://afrotools.com/fr/mortgage-property/'
    );
    for (const locale of ['en', 'fr', 'sw', 'x-default']) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${locale}"]`)).toHaveCount(1);
    }

    const cards = page.locator('.mp-hub-card');
    await expect(cards).toHaveCount(66);
    const expectedRoutes = manifest.rows.map((row) => `${row.frenchRoute}/`);
    const renderedRoutes = await cards.locator('h2 a').evaluateAll((links) => (
      links.map((link) => new URL(link.href).pathname)
    ));
    expect(renderedRoutes).toEqual(expectedRoutes);
    console.log('[mp66 hub] 66 route cards bound');
    const hubText = await page.locator('main').innerText();
    expect(hubText).not.toMatch(/Outil fran\?ais d\?j\?|sans autorit|aucune autorit/i);

    const images = cards.locator('img');
    await expect(images).toHaveCount(66);
    await images.evaluateAll((nodes) => {
      for (const node of nodes) node.loading = 'eager';
    });
    await expect.poll(
      () => images.evaluateAll((nodes) => nodes.filter((node) => (
        node.complete && node.naturalWidth > 0 && node.naturalHeight > 0
      )).length),
      { message: 'all 66 hub artworks loaded' }
    ).toBe(66);
    const artwork = await images.evaluateAll((nodes) => (
      nodes.map((node) => ({
        currentSrc: node.currentSrc,
        naturalWidth: node.naturalWidth,
        naturalHeight: node.naturalHeight,
        renderedWidth: node.clientWidth,
        renderedHeight: node.clientHeight,
        alt: node.alt
      }))
    ));
    expect(artwork.every((image) => (
      image.currentSrc &&
      image.naturalWidth > 0 &&
      image.naturalHeight > 0 &&
      image.renderedWidth > 0 &&
      image.renderedHeight > 0 &&
      image.alt === ''
    ))).toBeTruthy();
    console.log('[mp66 hub] 66 artworks rendered');

    await page.setViewportSize({ width: 1024, height: 900 });
    console.log('[mp66 hub] desktop theme viewport ready');
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.waitForFunction(
      () => window.AfroTools && window.AfroTools.darkMode,
      null,
      { timeout: 10_000 }
    );
    console.log('[mp66 hub] dark mode runtime ready');
    await page.evaluate(() => window.AfroTools.darkMode.set('light'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    console.log('[mp66 hub] light baseline settled');
    const themeToggle = page.locator('afro-navbar').locator('#themeToggle');
    await expect(themeToggle).toBeVisible();
    console.log('[mp66 hub] manual theme control visible');
    await themeToggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    console.log('[mp66 hub] manual dark settled');
    const primaryLink = cards.first().locator('h2 a');
    const manualDarkPrimaryContrast = await linkActionStateContrasts(
      page,
      primaryLink,
      'hub:manual-dark'
    );
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.evaluate(() => window.AfroTools.darkMode.set('auto'));
    await expect(page.locator('html')).toHaveAttribute('data-theme-choice', 'auto');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const systemDarkPrimaryContrast = await linkActionStateContrasts(
      page,
      primaryLink,
      'hub:system-dark'
    );
    console.log('[mp66 hub] manual and system dark contrast accepted');
    const textResize200 = await proveTextReflow(page, { englishId: 'hub' }, 'initial');
    console.log('[mp66 hub] 200 percent reflow accepted');

    const location = await page.evaluate(() => ({
      href: window.location.href,
      search: window.location.search,
      hash: window.location.hash
    }));
    const firstContextStorage = await page.evaluate(() => ({
      localStorage: Object.fromEntries(Object.entries(localStorage)),
      sessionStorage: Object.fromEntries(Object.entries(sessionStorage))
    }));
    const analytics = await page.evaluate(() => ({
      captured: window.__mp66AnalyticsEvents || [],
      dataLayer: window.dataLayer || []
    }));
    page.off('request', requestHandler);
    const network = await Promise.all(requestRecordPromises);
    const secondContext = await browser.newContext({ viewport: { width: 375, height: 900 } });
    const secondPage = await secondContext.newPage();
    await secondPage.goto(routeURL, { waitUntil: 'domcontentloaded' });
    const secondContextStorage = await secondPage.evaluate(() => ({
      localStorage: Object.fromEntries(Object.entries(localStorage)),
      sessionStorage: Object.fromEntries(Object.entries(sessionStorage))
    }));
    await secondContext.close();
    console.log('[mp66 hub] isolated second context accepted');
    expect(location).toEqual({ href: routeURL, search: '', hash: '' });
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(sensitiveKeys(firstContextStorage)).toEqual([]);
    expect(sensitiveKeys(secondContextStorage)).toEqual([]);

    return {
      route: '/fr/mortgage-property/',
      exactNavigation: routeURL,
      cardCount: 66,
      routes: renderedRoutes,
      artwork,
      responsive: { width375: true, textResize200 },
      theme: { manualDarkPrimaryContrast, systemDarkPrimaryContrast },
      privacy: {
        exactOrigin: baseURL,
        exactNavigation: routeURL,
        network,
        location,
        storage: {
          firstContext: firstContextStorage,
          secondContext: secondContextStorage,
          separateBrowserContexts: true
        },
        console: consoleMessages,
        analytics
      },
      runtime: { consoleMessages, consoleErrors, pageErrors },
      status: 'accepted'
    };
  } finally {
    await context.close();
  }
}

async function proveRow(browser, row) {
  const baseURL = process.env.MP66_BASE_URL;
  expect(baseURL, `${row.englishId}: portable test origin`).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  const routeURL = new URL(`${row.frenchRoute}/`, baseURL).href;
  const context = await browser.newContext({
    acceptDownloads: true,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    viewport: { width: 375, height: 900 }
  });
  await context.addInitScript(() => {
    window.__mp66Clipboard = '';
    window.__mp66AnalyticsEvents = [];
    window.dataLayer = window.dataLayer || [];
    const dataLayerPush = window.dataLayer.push.bind(window.dataLayer);
    window.dataLayer.push = (...items) => {
      window.__mp66AnalyticsEvents.push(...items);
      return dataLayerPush(...items);
    };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => {
          window.__mp66Clipboard = String(value);
        }
      }
    });
    try {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    } catch (_) {}
  });
  const page = await context.newPage();
  const consoleMessages = [];
  const consoleErrors = [];
  const pageErrors = [];
  const requestRecordPromises = [];
  page.on('console', (message) => {
    consoleMessages.push({ type: message.type(), text: message.text() });
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const requestHandler = (request) => {
    requestRecordPromises.push((async () => {
      const fullURL = request.url();
      const parsed = new URL(fullURL);
      return {
        method: request.method(),
        url: fullURL,
        query: parsed.search,
        hash: parsed.hash,
        body: request.postData() || '',
        headers: await request.allHeaders()
      };
    })());
  };
  page.on('request', requestHandler);

  const receipt = {
    rowNumber: row.rowNumber,
    englishId: row.englishId,
    englishRoute: row.englishRoute,
    frenchRoute: `${row.frenchRoute}/`,
    workflowKind: row.workflowKind,
    engineMode: row.engineMode,
    sharedEngine: row.sharedEngine,
    fixture: fieldValues(row),
    expectedResults: row.exportContract.fixture.expectedResults,
    status: 'blocked',
    proofs: {}
  };

  try {
    const response = await page.goto(routeURL, { waitUntil: 'domcontentloaded' });
    expect(response && response.ok()).toBeTruthy();
    expect(page.url()).toBe(routeURL);
    const app = page.locator('[data-fr-mortgage-property-app]');
    await expect(app).toHaveAttribute('data-workflow-ready', 'true');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('h1')).toHaveText(row.name);
    const artwork = app.locator('[data-route-artwork]');
    await expect(artwork).toBeVisible();
    await expect(artwork).toHaveAttribute('src', row.imageUrl);
    await expect(artwork).toHaveAttribute('alt', row.artworkAlt);
    await expect(artwork).toHaveAttribute('data-artwork-state', 'loaded');
    const artworkProof = await artwork.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        currentSrc: node.currentSrc,
        complete: node.complete,
        naturalWidth: node.naturalWidth,
        naturalHeight: node.naturalHeight,
        renderedWidth: node.clientWidth,
        renderedHeight: node.clientHeight,
        naturalAspect: node.naturalWidth / node.naturalHeight,
        renderedAspect: node.clientWidth / node.clientHeight,
        display: style.display,
        visibility: style.visibility,
        opacity: Number(style.opacity)
      };
    });
    expect(artworkProof.currentSrc).toContain(row.imageUrl);
    expect(artworkProof.complete).toBeTruthy();
    expect(artworkProof.naturalWidth).toBeGreaterThan(0);
    expect(artworkProof.naturalHeight).toBeGreaterThan(0);
    expect(artworkProof.renderedWidth).toBeGreaterThan(0);
    expect(artworkProof.renderedHeight).toBeGreaterThan(0);
    expect(artworkProof.renderedAspect).toBeCloseTo(artworkProof.naturalAspect, 2);
    expect(artworkProof.visibility).toBe('visible');
    expect(artworkProof.opacity).toBeGreaterThan(0);
    receipt.proofs.artwork = artworkProof;

    const sourceLink = app.locator('[data-source-url]');
    await expect(sourceLink).toBeVisible();
    await expect(sourceLink).toHaveAttribute('href', row.source.url);
    await expect(sourceLink).toHaveText(row.source.title);
    await expect(app.locator('[data-source-support]')).toHaveText(row.source.support);
    await expect(app.locator('[data-source-checked-at]')).toHaveText(row.source.checkedAt);
    await expect(app.locator('[data-source-freshness]')).toHaveText(row.source.freshness);
    await expect(app.locator('[data-source-assumptions]')).toHaveText(row.source.assumptions);
    await expect(app.locator('[data-source-confidence-calculation]')).toHaveText(row.source.confidence.calculation);
    await expect(app.locator('[data-source-confidence-applicability]')).toHaveText(row.source.confidence.applicability);
    receipt.proofs.source = {
      url: row.source.url,
      role: row.source.role,
      support: row.source.support,
      checkedAt: row.source.checkedAt,
      freshness: row.source.freshness,
      assumptions: row.source.assumptions,
      confidence: row.source.confidence
    };

    const canonical = `https://afrotools.com${row.frenchRoute}/`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'fr_FR');
    await expect(page.locator(`link[rel="alternate"][hreflang="en"]`)).toHaveAttribute(
      'href',
      `https://afrotools.com${row.englishRoute}/`
    );
    await expect(page.locator(`link[rel="alternate"][hreflang="fr"]`)).toHaveAttribute('href', canonical);
    const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => (
      nodes.flatMap((node) => {
        const parsed = JSON.parse(node.textContent);
        return Array.isArray(parsed) ? parsed : [parsed];
      })
    ));
    expect(schemas.some((schema) => schema['@type'] === 'WebApplication' && schema.inLanguage === 'fr')).toBeTruthy();
    receipt.proofs.seo = { canonical, inLanguage: 'fr', reciprocalHreflang: true };

    const workflowControl = app.locator('form [data-workflow-control]');
    await expect(workflowControl).toHaveText(row.workflowControl);
    expect(row.workflowControl).not.toMatch(forbiddenWorkflowControl);
    expect(await workflowControl.evaluate((node) => node.form === node.closest('form'))).toBeTruthy();
    const result = app.locator('[data-result]');
    const before = {
      hidden: await result.getAttribute('hidden'),
      text: await result.textContent(),
      html: await result.innerHTML()
    };
    expect(before.hidden).not.toBeNull();
    expect(before.text.trim()).toBe('');
    const initialReflow = await proveTextReflow(page, row, 'initial');
    await page.setViewportSize({ width: 375, height: 900 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });

    for (const field of row.fields) {
      const control = app.locator(`[name="${field.name}"]`);
      if (field.type === 'checkbox') {
        await control.setChecked(field.fixtureValue === 'true');
      } else if (field.type === 'select') {
        await control.selectOption(field.fixtureValue);
        await expect(control.locator('option:checked')).toHaveText(
          presentation.label(row.englishId, field.name, field.fixtureValue, field.fixtureValue)
        );
      } else {
        await control.fill(field.fixtureValue);
      }
      const label = app.locator(`label[for="mp-field-${field.name}"]`);
      await expect(label).toContainText(field.label);
    }

    await workflowControl.click();
    await expect(result).toBeVisible();
    await expect.poll(
      () => result.locator('[data-result-summary]').evaluate((node) => node.innerText),
      { timeout: 10_000 }
    ).toBe(
      row.exportContract.fixture.expectedSummary
    );
    const after = {
      hidden: await result.getAttribute('hidden'),
      text: await result.textContent(),
      html: await result.innerHTML()
    };
    expect(after.hidden).toBeNull();
    expect(after.html).not.toBe(before.html);
    expect(after.text).not.toBe(before.text);
    expect(after.text).not.toContain(row.name + row.description);
    const resultFields = {};
    for (const expected of row.exportContract.fixture.expectedResults) {
      const field = result.locator(expected.selector);
      await expect(field).toHaveText(String(expected.value));
      resultFields[expected.label] = expected.value;
    }
    expect(Object.keys(resultFields).length).toBeGreaterThanOrEqual(row.sharedEngine === 'property-assumption' ? 2 : 3);
    receipt.proofs.resultMutation = {
      workflowControl: row.workflowControl,
      controlOwnedByForm: true,
      before,
      after,
      resultFields
    };
    const resultReflow = await proveTextReflow(page, row, 'result');
    await page.setViewportSize({ width: 375, height: 900 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });

    const expectedText = resultLines(row, resultFields).join('\n');
    await app.locator('[data-action="copy"]').click();
    await expect.poll(() => page.evaluate(() => window.__mp66Clipboard)).toBe(expectedText);
    receipt.proofs.copy = { parser: 'exact clipboard string', bytes: Buffer.byteLength(expectedText), local: true };

    await page.evaluate(() => { window.__mp66Clipboard = ''; });
    await app.locator('[data-action="share"]').click();
    await expect.poll(() => page.evaluate(() => window.__mp66Clipboard)).toBe(expectedText);
    receipt.proofs.share = { oracle: 'navigator.share absent; exact local clipboard fallback', local: true };

    const txtDownloadEvent = page.waitForEvent('download');
    await app.locator('[data-action="txt"]').click();
    const txtBytes = await readDownload(await txtDownloadEvent);
    expect([...txtBytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const txt = txtBytes.toString('utf8').replace(/^\uFEFF/, '');
    expect(txt).toContain(`Outil : ${row.name}`);
    expect(txt).toContain(`Résumé : ${row.exportContract.fixture.expectedSummary}`);
    const presentedFixture = presentation.presentInputs(row.englishId, row.fields, fieldValues(row));
    expect(txt).toContain(`Entrée ${row.fields[0].name} : ${presentedFixture[row.fields[0].name]}`);
    expect(txt).toContain(`Résultat ${row.exportContract.fixture.expectedResults[0].label} : ${row.exportContract.fixture.expectedResults[0].value}`);
    receipt.proofs.txt = { parser: 'UTF-8+BOM decode', bytes: txtBytes.length, frenchLabels: true, fixtureAndResult: true };

    const jsonDownloadEvent = page.waitForEvent('download');
    await app.locator('[data-action="json"]').click();
    const jsonBytes = await readDownload(await jsonDownloadEvent);
    const exportedJson = JSON.parse(jsonBytes.toString('utf8'));
    expect(Object.keys(exportedJson).sort()).toEqual([
      'entrees',
      'identifiantAnglais',
      'limite',
      'outil',
      'resultat',
      'resume',
      'routeFrancaise',
      'schemaVersion',
      'verifieLe'
    ]);
    expect(exportedJson.identifiantAnglais).toBe(row.englishId);
    expect(exportedJson.entrees).toEqual(presentedFixture);
    expect(Object.keys(exportedJson.resultat).sort()).toEqual(
      row.exportContract.fixture.expectedResults.map((expected) => expected.label).sort()
    );
    for (const expected of row.exportContract.fixture.expectedResults) {
      expect(String(exportedJson.resultat[expected.label])).toBe(String(expected.value));
    }
    expect(exportedJson.resume).toBe(row.exportContract.fixture.expectedSummary);
    const unintendedSensitiveKeys = sensitiveKeys(exportedJson);
    expect(unintendedSensitiveKeys).toEqual([]);
    receipt.proofs.json = {
      parser: 'JSON.parse + exact schema',
      bytes: jsonBytes.length,
      fixtureAndResult: true,
      sensitiveKeys: unintendedSensitiveKeys
    };

    const pdfDownloadEvent = page.waitForEvent('download');
    await app.locator('[data-action="pdf"]').click();
    const pdfBytes = await readDownload(await pdfDownloadEvent);
    const pdf = pdfBytes.toString('latin1');
    expect(pdfBytes.length).toBeGreaterThan(500);
    expect(pdf.startsWith('%PDF-')).toBeTruthy();
    expect(pdf.trimEnd().endsWith('%%EOF')).toBeTruthy();
    expect(pdf).toContain('stream\nBT');
    expect(pdf).toContain(pdfAscii(row.name));
    expect(pdf).toContain(pdfAscii(`Entree ${row.fields[0].name} : ${presentedFixture[row.fields[0].name]}`));
    expect(pdf).toContain(pdfAscii(`Resultat ${row.exportContract.fixture.expectedResults[0].label} : ${row.exportContract.fixture.expectedResults[0].value}`));
    receipt.proofs.pdf = {
      parser: 'signature + EOF + reopened PDF content stream',
      bytes: pdfBytes.length,
      pages: 1,
      fixtureAndResult: true,
      gate: 'none'
    };

    let printCalled = false;
    await page.exposeFunction('__mp66PrintCalled', () => { printCalled = true; });
    await page.evaluate(() => {
      window.print = () => window.__mp66PrintCalled();
    });
    const printDom = await result.evaluate((node) => node.innerText);
    await app.locator('[data-action="print"]').click();
    await expect.poll(() => printCalled).toBeTruthy();
    expect(printDom).toContain(row.exportContract.fixture.expectedSummary);
    expect(printDom).toContain(String(row.exportContract.fixture.expectedResults[0].value));
    receipt.proofs.print = { oracle: 'window.print intercepted; French result DOM asserted', downloadedPdf: false };

    const preSaveStorage = await page.evaluate(() => ({
      local: Object.fromEntries(Object.entries(localStorage)),
      session: Object.fromEntries(Object.entries(sessionStorage))
    }));
    await app.locator('[data-action="save"]').click();
    await expect(app.locator('[data-status]')).toContainText('enregistré uniquement');
    await app.locator('[data-action="reset"]').click();
    await expect(result).toBeHidden();
    await app.locator('[data-action="load"]').click();
    await expect(result).toBeVisible();
    await expect.poll(
      () => result.locator('[data-result-summary]').evaluate((node) => node.innerText),
      { timeout: 10_000 }
    ).toBe(
      row.exportContract.fixture.expectedSummary
    );
    for (const expected of row.exportContract.fixture.expectedResults) {
      await expect(result.locator(expected.selector)).toHaveText(String(expected.value));
    }
    const firstContextStorage = await page.evaluate(() => ({
      local: Object.fromEntries(Object.entries(localStorage)),
      session: Object.fromEntries(Object.entries(sessionStorage))
    }));
    const savedStorageKeys = Object.keys(firstContextStorage.local).filter((key) => (
      firstContextStorage.local[key] !== preSaveStorage.local[key]
    ));
    expect(savedStorageKeys, `${row.englishId}: save did not create route-local state`).not.toEqual([]);
    const privacyContext = await browser.newContext({
      colorScheme: 'light',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
      viewport: { width: 375, height: 900 }
    });
    const privacyPage = await privacyContext.newPage();
    const privacyResponse = await privacyPage.goto(routeURL, { waitUntil: 'domcontentloaded' });
    expect(privacyResponse && privacyResponse.ok()).toBeTruthy();
    const secondContextStorage = await privacyPage.evaluate(() => ({
      local: Object.fromEntries(Object.entries(localStorage)),
      session: Object.fromEntries(Object.entries(sessionStorage))
    }));
    for (const key of savedStorageKeys) {
      expect(secondContextStorage.local, `${row.englishId}: local storage crossed BrowserContexts`).not.toHaveProperty(key);
    }
    await privacyContext.close();
    receipt.proofs.localState = {
      save: true,
      reset: true,
      load: true,
      privacy: 'origin-local storage isolated in a separate BrowserContext',
      preSaveStorage,
      firstContextStorage,
      secondContextStorage,
      savedStorageKeys,
      separateBrowserContexts: true
    };

    if (row.englishId === 'cac-cost') {
      const boundaries = [
        { field: 'shareCapital', value: '0' },
        { field: 'directors', value: '0' }
      ];
      for (const boundary of boundaries) {
        for (const field of row.fields) {
          const control = app.locator(`[name="${field.name}"]`);
          if (field.type === 'checkbox') await control.setChecked(field.fixtureValue === 'true');
          else if (field.type === 'select') await control.selectOption(field.fixtureValue);
          else await control.fill(field.fixtureValue);
        }
        await app.locator(`[name="${boundary.field}"]`).fill(boundary.value);
        await workflowControl.click();
        await expect(result.locator('[data-result-summary]')).toHaveCount(0);
        await expect(app.locator('[data-export-bar]')).toBeHidden();
        await expect(app.locator('[data-status]')).toContainText(/champs obligatoires|Aucun résultat/);
      }
      receipt.proofs.cacZeroBoundary = {
        shareCapitalZero: 'failed-closed',
        directorsZero: 'failed-closed',
        exportsHidden: true
      };
    }

    await app.locator('[data-action="reset"]').click();
    const invalidField = row.fields.find((field) => (
      ['property-assumption', 'mortgage-property-english-owner'].includes(row.sharedEngine)
        ? ['number', 'select'].includes(field.type)
        : field.type !== 'checkbox'
    ));
    if (invalidField) {
      const invalidControl = app.locator(`[name="${invalidField.name}"]`);
      if (invalidField.type === 'select') {
        await invalidControl.evaluate((control) => {
          control.value = '';
          control.dispatchEvent(new Event('change', { bubbles: true }));
        });
      } else {
        await invalidControl.fill('');
      }
    } else {
      for (const field of row.fields) {
        await app.locator(`[name="${field.name}"]`).setChecked(false);
      }
    }
    await workflowControl.click();
    if (!invalidField && ['ndpa-checker', 'popia-checker'].includes(row.englishId)) {
      await expect(result).toBeVisible();
      receipt.proofs.invalid = {
        field: 'none-required-by-English-owner',
        failClosed: 'not-applicable',
        zeroSelectionIsValidScore: true
      };
    } else {
      await expect(result.locator('[data-result-summary]')).toHaveCount(0);
      await expect(app.locator('[data-export-bar]')).toBeHidden();
      await expect(app.locator('[data-status]')).toContainText(/champs obligatoires|Aucun résultat/);
      receipt.proofs.invalid = {
        field: invalidField ? invalidField.name : 'empty-checkbox-selection',
        failClosed: true,
        frenchError: true,
        exportsHidden: true
      };
    }

    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${row.englishId}: ${width}px overflow`).toBeLessThanOrEqual(1);
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 320, height: 900 });
    const reflow = await page.evaluate(() => {
      const root = document.documentElement;
      const baselinePx = Number.parseFloat(getComputedStyle(root).fontSize);
      const resizeStyle = document.createElement('style');
      resizeStyle.dataset.mp66TextResize = '200';
      resizeStyle.textContent = `html { font-size: ${baselinePx * 2}px !important; }`;
      document.head.appendChild(resizeStyle);
      const resizedPx = Number.parseFloat(getComputedStyle(root).fontSize);
      const viewportWidth = root.clientWidth;
      const diagnostics = [];
      const allOverflowDiagnostics = [];
      const inspectRoot = (scanRoot, shadowHost) => {
        const nodes = [...scanRoot.querySelectorAll('*')];
        for (const node of nodes) {
          if (!(node instanceof HTMLElement) && !(node instanceof SVGElement)) continue;
          const rects = [...node.getClientRects()];
          if (!rects.length || rects.every((rect) => rect.width <= 0 || rect.height <= 0)) continue;
          for (const rect of rects) {
            if (rect.width <= 0 || rect.height <= 0) continue;
            if (rect.left < -1 || rect.right > viewportWidth + 1) {
              const diagnostic = {
                tag: node.tagName.toLowerCase(),
                id: node.id || '',
                className: typeof node.className === 'string' ? node.className.slice(0, 120) : '',
                left: Number(rect.left.toFixed(2)),
                right: Number(rect.right.toFixed(2)),
                width: Number(rect.width.toFixed(2)),
                viewportWidth,
                shadowHost: shadowHost
                  ? `${shadowHost.tagName.toLowerCase()}#${shadowHost.id || ''}.${String(shadowHost.className || '').slice(0, 80)}`
                  : null
              };
              allOverflowDiagnostics.push(diagnostic);
              diagnostics.push(diagnostic);
              break;
            }
          }
          for (const textNode of [...node.childNodes].filter((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim())) {
            const range = document.createRange();
            range.selectNodeContents(textNode);
            for (const rect of range.getClientRects()) {
              if (rect.width <= 0 || rect.height <= 0) continue;
              if (rect.left < -1 || rect.right > viewportWidth + 1) {
                const diagnostic = {
                  kind: 'text-fragment',
                  tag: node.tagName.toLowerCase(),
                  id: node.id || '',
                  className: typeof node.className === 'string' ? node.className.slice(0, 120) : '',
                  text: textNode.textContent.trim().replace(/\s+/g, ' ').slice(0, 160),
                  left: Number(rect.left.toFixed(2)),
                  right: Number(rect.right.toFixed(2)),
                  width: Number(rect.width.toFixed(2)),
                  viewportWidth,
                  shadowHost: shadowHost
                    ? `${shadowHost.tagName.toLowerCase()}#${shadowHost.id || ''}.${String(shadowHost.className || '').slice(0, 80)}`
                    : null
                };
                allOverflowDiagnostics.push(diagnostic);
                diagnostics.push(diagnostic);
                break;
              }
            }
          }
          if (node.shadowRoot) inspectRoot(node.shadowRoot, node);
        }
      };
      inspectRoot(document, null);
      const documentOverflow = root.scrollWidth - root.clientWidth;
      resizeStyle.remove();
      return {
        baselinePx,
        resizedPx,
        scale: resizedPx / baselinePx,
        viewportWidth,
        documentOverflow,
        diagnostics,
        allOverflowDiagnostics,
        diagnosticCount: diagnostics.length
      };
    });
    expect(reflow.scale, `${row.englishId}: exact computed text resize scale ${JSON.stringify(reflow)}`).toBeCloseTo(2, 5);
    expect(reflow.resizedPx, `${row.englishId}: exact computed doubled root size`).toBeCloseTo(reflow.baselinePx * 2, 5);
    expect(reflow.diagnostics, `${row.englishId}: clipped visible descendants ${JSON.stringify(reflow.diagnostics)}`).toEqual([]);
    expect(
      reflow.documentOverflow,
      `${row.englishId}: 200% document overflow ${JSON.stringify(reflow.allOverflowDiagnostics)}`
    ).toBeLessThanOrEqual(1);
    receipt.proofs.responsive = {
      width375: true,
      width320: true,
      textResize200: {
        initial: initialReflow,
        result: resultReflow,
        invalid: {
          baselinePx: reflow.baselinePx,
          resizedPx: reflow.resizedPx,
          scale: reflow.scale,
          documentOverflow: reflow.documentOverflow,
          visibleDescendantDiagnostics: reflow.diagnosticCount,
          openShadowRootsInspected: true
        }
      }
    };

    await page.setViewportSize({ width: 1024, height: 900 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.waitForFunction(
      () => window.AfroTools && window.AfroTools.darkMode,
      null,
      { timeout: 10_000 }
    );
    await page.evaluate(() => window.AfroTools.darkMode.set('light'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    const lightBg = await page.locator('body').evaluate((node) => getComputedStyle(node).backgroundColor);
    const manualThemeToggle = page.locator('afro-navbar').locator('#themeToggle');
    await expect(manualThemeToggle).toBeVisible();
    await manualThemeToggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect.poll(() => page.locator('body').evaluate((node) => getComputedStyle(node).backgroundColor))
      .not.toBe(lightBg);
    const manualDarkBg = await page.locator('body').evaluate((node) => getComputedStyle(node).backgroundColor);
    const manualDarkPrimaryContrast = await primaryActionStateContrasts(
      page,
      workflowControl,
      `${row.englishId}:manual-dark`
    );
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.evaluate(() => window.AfroTools.darkMode.set('auto'));
    await expect(page.locator('html')).toHaveAttribute('data-theme-choice', 'auto');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect.poll(
      () => page.locator('body').evaluate((node) => getComputedStyle(node).backgroundColor),
      { timeout: 10_000 }
    )
      .toBe(manualDarkBg);
    const systemDarkBg = await page.locator('body').evaluate((node) => getComputedStyle(node).backgroundColor);
    const systemDarkPrimaryContrast = await primaryActionStateContrasts(
      page,
      workflowControl,
      `${row.englishId}:system-dark`
    );
    receipt.proofs.theme = {
      light: lightBg,
      manualControl: '#themeToggle',
      manualDark: manualDarkBg,
      manualDarkPrimaryContrast,
      systemChoice: 'auto',
      systemDark: systemDarkBg,
      systemDarkPrimaryContrast,
      minimumPrimaryContrast: 4.5
    };

    await app.locator('input, select').first().focus();
    await expect(app.locator('input, select').first()).toBeFocused();
    expect(await app.locator('input, select').count()).toBe(await app.locator('label').count());
    await workflowControl.focus();
    await expect(workflowControl).toBeFocused();
    receipt.proofs.accessibility = {
      realLabels: row.fields.length,
      keyboardFocus: true,
      resultLiveRegion: await result.getAttribute('aria-live'),
      statusLiveRegion: await app.locator('[data-status]').getAttribute('aria-live')
    };

    await page.waitForTimeout(50);
    page.off('request', requestHandler);
    const network = await Promise.all(requestRecordPromises);
    for (const request of network) {
      expect(Object.keys(request).sort()).toEqual(['body', 'hash', 'headers', 'method', 'query', 'url']);
      expect(request.method).toMatch(/^[A-Z]+$/);
      expect(request.url).toMatch(/^[a-z]+:/i);
      expect(request.headers && typeof request.headers).toBe('object');
    }
    const location = await page.evaluate(() => ({
      href: window.location.href,
      search: window.location.search,
      hash: window.location.hash
    }));
    expect(location.search).toBe('');
    expect(location.hash).toBe('');
    const analytics = await page.evaluate(() => ({
      captured: window.__mp66AnalyticsEvents || [],
      dataLayer: Array.isArray(window.dataLayer) ? window.dataLayer : []
    }));
    const fixtureLeaks = [];
    const inspectedSurfaces = {
      network,
      location,
      console: consoleMessages,
      analytics
    };
    const inspectedText = JSON.stringify(inspectedSurfaces);
    for (const needle of safeFixtureNeedles(row)) {
      if (inspectedText.includes(needle)) fixtureLeaks.push({ needle });
    }
    expect(fixtureLeaks).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(sensitiveKeys(firstContextStorage).filter((key) => !/result|input|fixture/i.test(key))).toEqual([]);
    receipt.proofs.privacy = {
      fixtureNetworkLeaks: fixtureLeaks,
      accountGate: false,
      emailGate: false,
      aiSend: false,
      exactOrigin: baseURL,
      exactNavigation: routeURL,
      network,
      location,
      storage: {
        firstContext: firstContextStorage,
        secondContext: secondContextStorage,
        separateBrowserContexts: true
      },
      console: consoleMessages,
      analytics
    };
    receipt.proofs.runtime = { consoleMessages, consoleErrors, pageErrors };
    receipt.status = 'accepted';
  } catch (error) {
    receipt.blocker = error && error.stack ? error.stack : String(error);
  } finally {
    try {
      await context.close();
    } catch (error) {
      if (!/Target page, context or browser has been closed/i.test(String(error && error.message || error))) {
        throw error;
      }
    }
  }
  return receipt;
}

test('all 66 French Mortgage & Property apps pass physical route and export proof', async ({ browser }) => {
  expect(manifest.count).toBe(66);
  expect(manifest.rows).toHaveLength(66);
  expect(manifest).not.toHaveProperty('worktreeRoot');
  expect(manifest).not.toHaveProperty('worktreePort');
  expect(manifest).not.toHaveProperty('worktreeSentinel');
  const hub = await proveHub(browser);

  const selectedIds = process.env.MP66_ROUTE
    ? new Set(process.env.MP66_ROUTE.split(',').map((value) => value.trim()).filter(Boolean))
    : null;
  const selectedRows = selectedIds
    ? manifest.rows.filter((row) => selectedIds.has(row.englishId))
    : manifest.rows;
  expect(selectedRows.length).toBe(selectedIds ? selectedIds.size : 66);
  const rows = [];
  for (const row of selectedRows) {
    console.log(`[mp66 route] ${row.rowNumber}/66 ${row.englishId} started`);
    const proof = await proveRow(browser, row);
    rows.push(proof);
    console.log(`[mp66 route] ${row.rowNumber}/66 ${row.englishId} ${proof.status}`);
  }
  const accepted = rows.filter((row) => row.status === 'accepted').length;
  const blockers = rows.filter((row) => row.status !== 'accepted');
  const evidence = {
    schemaVersion: 1,
    category: 'Mortgage & Property',
    portableOrigin: process.env.MP66_BASE_URL,
    denominator: selectedRows.length,
    accepted,
    blocked: blockers.length,
    acceptanceOracle: 'same-fixture explicit result-region mutation, parsed local exports, exact dark contrast, unclipped 200% reflow and full-surface local privacy; static title and CTA evidence forbidden',
    generatedAt: new Date().toISOString(),
    hub,
    rows
  };
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  expect(blockers, blockers.map((row) => `${row.englishId}: ${row.blocker}`).join('\n\n')).toEqual([]);
  expect(accepted).toBe(selectedRows.length);
});
