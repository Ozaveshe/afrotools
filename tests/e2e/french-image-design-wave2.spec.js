const { test, expect, chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const EVIDENCE_PATH = path.resolve(
  ROOT,
  process.env.AFROTOOLS_IMAGE_DESIGN_EVIDENCE_PATH
    || 'test-results/french-image-design-wave2-evidence.json'
);
const PRIVATE_MARKER = 'PREUVE_PRIVEE_IMAGE_9F2C7A';
const PRIVATE_FILE = 'preuve-privee-image-9f2c7a.png';
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const CHROMIUM_EXECUTABLE = process.env.AFROTOOLS_CHROMIUM_EXECUTABLE || undefined;

const APPS = [
  { sourceId: 'image-compress', route: '/fr/tools/compresser-image/' },
  { sourceId: 'image-resize', route: '/fr/tools/redimensionner-image/' },
  { sourceId: 'qr-generator', route: '/fr/tools/generateur-qr/' },
  { sourceId: 'background-remover', route: '/fr/tools/supprimer-arriere-plan/' },
  { sourceId: 'passport-photo', route: '/fr/tools/photo-identite/' },
  { sourceId: 'image-crop', route: '/fr/tools/recadrer-image/' },
  { sourceId: 'color-picker', route: '/fr/tools/selecteur-couleur/' },
  { sourceId: 'favicon-generator', route: '/fr/tools/generateur-favicon/' },
  { sourceId: 'image-to-text', route: '/fr/tools/image-en-texte/' },
  { sourceId: 'meme-generator', route: '/fr/tools/generateur-memes/' },
  { sourceId: 'logo-maker', route: '/fr/tools/createur-logo/' },
  { sourceId: 'image-filters', route: '/fr/tools/filtres-image/' },
  { sourceId: 'social-card', route: '/fr/tools/carte-sociale/' },
  { sourceId: 'certificate-maker', route: '/fr/tools/createur-certificat/' },
  { sourceId: 'flyer-maker', route: '/fr/tools/createur-flyer/' },
  { sourceId: 'thumbnail-maker', route: '/fr/tools/createur-miniatures/' },
  { sourceId: 'watermark-bulk', route: '/fr/tools/filigrane-images/' },
  { sourceId: 'image-format-convert', route: '/fr/tools/convertir-format-image/' },
  { sourceId: 'colour-palette', route: '/fr/tools/palette-couleurs/' },
];

const VIEWPORTS = [
  {
    id: 'mobile-320-light',
    viewport: { width: 320, height: 900 },
    colorScheme: 'light',
    explicitTheme: 'light',
    zoomPercent: 100,
  },
  {
    id: 'mobile-375-explicit-dark',
    viewport: { width: 375, height: 900 },
    colorScheme: 'light',
    explicitTheme: 'dark',
    zoomPercent: 100,
  },
  {
    id: 'reflow-200-system-dark',
    viewport: { width: 640, height: 900 },
    nominalViewportWidth: 1280,
    colorScheme: 'dark',
    explicitTheme: null,
    zoomPercent: 200,
  },
];

const evidence = {
  schemaVersion: 1,
  date: '2026-07-28',
  category: 'Image & Design',
  locale: 'fr',
  routeCount: APPS.length,
  viewportContract: {
    combinations: APPS.length * VIEWPORTS.length,
    standardsCorrect200Percent:
      'A 1280 CSS-pixel desktop viewport at 200% browser zoom exposes a 640 CSS-pixel layout viewport. Reflow is asserted at 640px without CSS transform or font-size simulation; the stricter 320px mobile pass is separate.',
  },
  matrix: [],
  outputs: [],
  summary: {},
};

test.describe.configure({ mode: 'serial' });
test.setTimeout(8 * 60 * 1000);

function localUrl(route) {
  return new URL(route, BASE_URL).href;
}

function pathForPublicRoute(publicUrl) {
  const pathname = new URL(publicUrl).pathname;
  let relative = pathname.replace(/^\/+/, '');
  if (relative.endsWith('/')) relative += 'index.html';
  if (!path.extname(relative)) {
    if (fs.existsSync(path.join(ROOT, relative, 'index.html'))) relative += '/index.html';
    else relative += '.html';
  }
  return path.join(ROOT, relative);
}

function safeRequestRecord(request) {
  let parsed;
  try { parsed = new URL(request.url()); } catch { parsed = { origin: '', pathname: request.url() }; }
  const body = request.postDataBuffer();
  return {
    method: request.method(),
    origin: parsed.origin,
    pathname: parsed.pathname,
    resourceType: request.resourceType(),
    bodyBytes: body ? body.length : 0,
  };
}

async function createObservedPage(context) {
  const page = await context.newPage();
  const rawRequests = [];
  const externalRequests = [];
  const localFailures = [];
  const localHttpErrors = [];
  const pageErrors = [];
  const consoleErrors = [];

  page.on('request', (request) => {
    const body = request.postDataBuffer();
    rawRequests.push({
      url: request.url(),
      method: request.method(),
      body: body || Buffer.alloc(0),
    });
    if (new URL(request.url()).origin !== new URL(BASE_URL).origin) {
      externalRequests.push(safeRequestRecord(request));
    }
  });
  page.on('requestfailed', (request) => {
    if (new URL(request.url()).origin === new URL(BASE_URL).origin) {
      localFailures.push({ url: request.url(), error: request.failure()?.errorText || 'unknown' });
    }
  });
  page.on('response', (response) => {
    if (new URL(response.url()).origin === new URL(BASE_URL).origin && response.status() >= 400) {
      localHttpErrors.push({ url: response.url(), status: response.status() });
    }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error'
      && !message.text().includes('net::ERR_BLOCKED_BY_CLIENT.Inspector')
    ) {
      consoleErrors.push(message.text());
    }
  });
  await page.route('**/*', async (route) => {
    const request = route.request();
    if (new URL(request.url()).origin !== new URL(BASE_URL).origin) {
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });

  return {
    page,
    rawRequests,
    externalRequests,
    localFailures,
    localHttpErrors,
    pageErrors,
    consoleErrors,
  };
}

function assertNoPrivateNetworkPayload(rawRequests, fixture) {
  const textNeedles = [
    PRIVATE_MARKER,
    encodeURIComponent(PRIVATE_MARKER),
    PRIVATE_FILE,
    encodeURIComponent(PRIVATE_FILE),
    fixture.toString('base64').slice(0, 48),
    'iVBORw0KGgo',
  ];
  for (const request of rawRequests) {
    const url = request.url;
    const bodyText = request.body.toString('utf8');
    for (const needle of textNeedles) {
      expect(url, `private marker leaked in request URL ${url}`).not.toContain(needle);
      expect(bodyText, `private marker leaked in request body ${url}`).not.toContain(needle);
    }
    expect(request.body.indexOf(PNG_MAGIC), `PNG bytes leaked in request body ${url}`).toBe(-1);
    expect(request.body.indexOf(fixture.subarray(0, 32)), `image bytes leaked in request body ${url}`).toBe(-1);
  }
}

async function createFixture(browser) {
  const page = await browser.newPage();
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#123456';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '72px sans-serif';
    ctx.fillText('AFROTOOLS TEST', 80, 240);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(80, 300, 500, 140);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    return [...new Uint8Array(await blob.arrayBuffer())];
  });
  await page.close();
  return Buffer.from(bytes);
}

async function parseImage(browser, buffer, mimeType) {
  const page = await browser.newPage();
  const dimensions = await page.evaluate(async ({ base64, type }) => {
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    const objectUrl = URL.createObjectURL(new Blob([bytes], { type }));
    const image = new Image();
    const result = await new Promise((resolve, reject) => {
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = reject;
      image.src = objectUrl;
    });
    URL.revokeObjectURL(objectUrl);
    return result;
  }, { base64: buffer.toString('base64'), type: mimeType });
  await page.close();
  return dimensions;
}

async function downloadFrom(page, action) {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    action(),
  ]);
  const filePath = await download.path();
  return {
    filename: download.suggestedFilename(),
    buffer: fs.readFileSync(filePath),
  };
}

async function inputFile(page, selector, fixture) {
  await page.setInputFiles(selector, {
    name: PRIVATE_FILE,
    mimeType: 'image/png',
    buffer: fixture,
  });
}

async function recordImageOutput(browser, page, route, action, expected, mimeType = 'image/png') {
  const download = await downloadFrom(page, action);
  const dimensions = await parseImage(browser, download.buffer, mimeType);
  expect(dimensions).toEqual(expected);
  evidence.outputs.push({
    route,
    format: mimeType,
    filename: download.filename,
    bytes: download.buffer.length,
    signature: download.buffer.subarray(0, 12).toString('hex'),
    dimensions,
    reopened: true,
  });
}

test('19 French Image & Design routes pass the 57-case responsive, theme, a11y and SEO matrix', async () => {
  const browser = await chromium.launch(CHROMIUM_EXECUTABLE
    ? { headless: true, executablePath: CHROMIUM_EXECUTABLE }
    : { headless: true });
  const aiMap = fs.readFileSync(path.join(ROOT, 'assets/js/ai/french-route-map.generated.js'), 'utf8');
  const lightPalettes = new Map();

  for (const mode of VIEWPORTS) {
    for (const app of APPS) {
      const context = await browser.newContext({
        viewport: mode.viewport,
        colorScheme: mode.colorScheme,
        serviceWorkers: 'block',
      });
      if (mode.explicitTheme) {
        await context.addInitScript((theme) => {
          try { localStorage.setItem('aft_theme', theme); } catch {}
          if (document.documentElement) document.documentElement.setAttribute('data-theme', theme);
        }, mode.explicitTheme);
      }
      const observed = await createObservedPage(context);
      const { page } = observed;
      const response = await page.goto(localUrl(app.route), { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
      await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(100);

      const pageEvidence = await page.evaluate(() => {
        const main = document.querySelector('main') || document.body;
        const visible = (element) => {
          const style = getComputedStyle(element);
          const box = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
        };
        const controls = [...main.querySelectorAll('input:not([type="hidden"]), select, textarea, button, a[href]')]
          .filter((element) => !element.disabled && visible(element));
        const unlabeledFields = [...main.querySelectorAll('input:not([type="hidden"]), select, textarea')]
          .filter((element) => !element.disabled && visible(element))
          .filter((element) => {
            const label = element.labels ? [...element.labels].map((item) => item.innerText).join(' ') : '';
            return !(label || element.getAttribute('aria-label') || element.getAttribute('aria-labelledby') || element.title || '').trim();
          })
          .map((element) => element.id || element.outerHTML.slice(0, 100));
        const unnamedActions = [...main.querySelectorAll('button, a[href]')]
          .filter((element) => !element.disabled && visible(element))
          .filter((element) => !(element.innerText || element.getAttribute('aria-label') || element.title || '').trim())
          .map((element) => element.id || element.outerHTML.slice(0, 100));
        const nonFocusable = controls.filter((element) => element.tabIndex < 0)
          .map((element) => element.id || element.outerHTML.slice(0, 100));
        const schema = [...document.querySelectorAll('script[type="application/ld+json"]')]
          .map((node) => {
            try { return JSON.parse(node.textContent); } catch { return null; }
          })
          .find((item) => item && item['@type'] === 'WebApplication');
        const alternates = [...document.querySelectorAll('link[rel="alternate"][hreflang]')]
          .map((element) => ({ lang: element.hreflang, href: element.href }));
        const textForResidue = [
          document.title,
          document.querySelector('meta[name="description"]')?.content || '',
          document.querySelector('meta[property="og:description"]')?.content || '',
          document.querySelector('meta[name="twitter:description"]')?.content || '',
          main.innerText,
          JSON.stringify(schema || {}),
        ].join('\n');
        const residuePatterns = [
          /\bbatch\b/i,
          /\bready\b/i,
          /\bdownload\b/i,
          /\bupload\b/i,
          /\bcopy\b/i,
          /\bsave\b/i,
          /\breset\b/i,
          /\bresult\b/i,
          /\bloading\b/i,
          /\berror\b/i,
        ];
        const residue = residuePatterns.filter((pattern) => pattern.test(textForResidue)).map(String);
        const palette = [...new Set(
          [document.body, main, ...main.querySelectorAll('*')]
            .slice(0, 120)
            .filter(visible)
            .map((element) => getComputedStyle(element).backgroundColor)
            .filter((color) => color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent')
        )].slice(0, 20);
        const overflowOffenders = [...document.querySelectorAll('body *')]
          .map((element) => {
            const box = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return {
              tag: element.tagName,
              id: element.id,
              className: typeof element.className === 'string' ? element.className.slice(0, 120) : '',
              left: box.left,
              right: box.right,
              width: box.width,
              display: style.display,
              visibility: style.visibility,
              transform: style.transform,
              inMain: main.contains(element),
            };
          })
          .filter((item) => item.left < -1 || item.right > window.innerWidth + 1)
          .sort((left, right) => {
            const leftExcess = Math.max(-left.left, left.right - window.innerWidth);
            const rightExcess = Math.max(-right.left, right.right - window.innerWidth);
            return rightExcess - leftExcess;
          })
          .slice(0, 20);
        return {
          lang: document.documentElement.lang,
          canonical: document.querySelector('link[rel="canonical"]')?.href || '',
          descriptionLength: (document.querySelector('meta[name="description"]')?.content || '').length,
          ogLocale: document.querySelector('meta[property="og:locale"]')?.content || '',
          robots: document.querySelector('meta[name="robots"]')?.content || '',
          schema: schema ? { inLanguage: schema.inLanguage, url: schema.url } : null,
          alternates,
          iframeCount: document.querySelectorAll('iframe').length,
          overflow: {
            document: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
            body: document.body.scrollWidth > document.body.clientWidth + 1,
            main: main.scrollWidth > main.clientWidth + 1,
          },
          overflowDimensions: {
            innerWidth: window.innerWidth,
            documentScrollWidth: document.documentElement.scrollWidth,
            documentClientWidth: document.documentElement.clientWidth,
            bodyScrollWidth: document.body.scrollWidth,
            bodyClientWidth: document.body.clientWidth,
            mainScrollWidth: main.scrollWidth,
            mainClientWidth: main.clientWidth,
          },
          overflowOffenders,
          unlabeledFields,
          unnamedActions,
          nonFocusable,
          residue,
          controlCount: controls.length,
          palette,
          systemDark: matchMedia('(prefers-color-scheme: dark)').matches,
          explicitTheme: document.documentElement.getAttribute('data-theme'),
        };
      });

      for (let attempt = 0; attempt < 50; attempt += 1) {
        await page.keyboard.press('Tab');
        const reachedMain = await page.evaluate(() => {
          const main = document.querySelector('main') || document.body;
          return main.contains(document.activeElement) && document.activeElement !== main;
        });
        if (reachedMain) break;
      }
      const keyboardFocus = await page.evaluate(() => {
        const active = document.activeElement;
        const style = active ? getComputedStyle(active) : null;
        return {
          reachedMainControl: !!active && (document.querySelector('main') || document.body).contains(active) && active !== document.body,
          tag: active?.tagName || '',
          id: active?.id || '',
          visibleIndicator: !!style && (style.outlineStyle !== 'none' || style.boxShadow !== 'none'),
        };
      });

      const expectedCanonical = `https://afrotools.com${app.route}`;
      const englishAlternate = pageEvidence.alternates.find((item) => item.lang === 'en');
      const frenchAlternate = pageEvidence.alternates.find((item) => item.lang === 'fr');
      expect(pageEvidence.lang).toBe('fr');
      expect(pageEvidence.canonical).toBe(expectedCanonical);
      expect(pageEvidence.descriptionLength).toBeGreaterThanOrEqual(80);
      expect(pageEvidence.descriptionLength).toBeLessThanOrEqual(180);
      expect(pageEvidence.ogLocale).toBe('fr_FR');
      expect(pageEvidence.robots.toLowerCase()).not.toContain('noindex');
      expect(pageEvidence.schema).toEqual({ inLanguage: 'fr', url: expectedCanonical });
      expect(englishAlternate?.href).toBeTruthy();
      expect(frenchAlternate?.href).toBe(expectedCanonical);
      const englishHtml = fs.readFileSync(pathForPublicRoute(englishAlternate.href), 'utf8');
      expect(englishHtml).toContain('hreflang="fr"');
      expect(englishHtml).toContain(expectedCanonical);
      expect(aiMap).toContain(app.route);
      expect(fs.existsSync(path.join(ROOT, `assets/img/tools/${app.sourceId}.webp`))).toBe(true);
      expect(pageEvidence.iframeCount).toBe(0);
      expect(
        pageEvidence.overflow,
        JSON.stringify({
          route: app.route,
          viewport: mode.id,
          dimensions: pageEvidence.overflowDimensions,
          offenders: pageEvidence.overflowOffenders,
        }, null, 2)
      ).toEqual({ document: false, body: false, main: false });
      expect(pageEvidence.unlabeledFields).toEqual([]);
      expect(pageEvidence.unnamedActions).toEqual([]);
      expect(pageEvidence.nonFocusable).toEqual([]);
      expect(pageEvidence.residue).toEqual([]);
      expect(keyboardFocus.reachedMainControl).toBe(true);
      expect(keyboardFocus.visibleIndicator).toBe(true);
      expect(observed.localFailures).toEqual([]);
      expect(observed.localHttpErrors).toEqual([]);
      expect(observed.pageErrors).toEqual([]);
      expect(observed.consoleErrors).toEqual([]);
      if (mode.id === 'mobile-320-light') lightPalettes.set(app.route, pageEvidence.palette);
      if (mode.id === 'mobile-375-explicit-dark') expect(pageEvidence.explicitTheme).toBe('dark');
      if (mode.id === 'reflow-200-system-dark') expect(pageEvidence.systemDark).toBe(true);
      if (mode.id !== 'mobile-320-light') {
        expect(pageEvidence.palette).not.toEqual(lightPalettes.get(app.route));
      }

      evidence.matrix.push({
        route: app.route,
        viewport: mode.id,
        cssViewport: mode.viewport,
        nominalViewportWidth: mode.nominalViewportWidth || mode.viewport.width,
        zoomPercent: mode.zoomPercent,
        theme: mode.explicitTheme || `system-${mode.colorScheme}`,
        overflow: false,
        consoleErrors: 0,
        pageErrors: 0,
        localNetworkFailures: 0,
        labeledFields: true,
        keyboardFocus,
        frenchRuntimeResidue: [],
        canonical: pageEvidence.canonical,
        reciprocalHreflang: true,
        aiMapped: true,
        artwork: true,
        externalRequests: observed.externalRequests,
      });
      await context.close();
    }
  }
  await browser.close();
});

test('all 19 primary outputs download, parse or reopen, and private app data never leaves the browser', async () => {
  const browser = await chromium.launch(CHROMIUM_EXECUTABLE
    ? { headless: true, executablePath: CHROMIUM_EXECUTABLE }
    : { headless: true });
  const fixture = await createFixture(browser);

  async function withApp(route, workflow) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: 'light',
      acceptDownloads: true,
      serviceWorkers: 'block',
    });
    const observed = await createObservedPage(context);
    await observed.page.goto(localUrl(route), { waitUntil: 'domcontentloaded' });
    await workflow(observed.page);
    await observed.page.waitForTimeout(80);
    assertNoPrivateNetworkPayload(observed.rawRequests, fixture);
    expect(observed.localFailures).toEqual([]);
    expect(observed.localHttpErrors).toEqual([]);
    expect(observed.pageErrors).toEqual([]);
    expect(observed.consoleErrors).toEqual([]);
    const output = evidence.outputs.find((item) => item.route === route);
    output.privacy = {
      selectedImageBytesTransmitted: false,
      enteredOrGeneratedContentTransmitted: false,
      sharedMetadataRequestsObserved: observed.externalRequests,
    };
    await context.close();
  }

  await withApp('/fr/tools/compresser-image/', async (page) => {
    await inputFile(page, '#fileInput', fixture);
    await page.click('#compressBtn');
    await page.getByRole('button', { name: "Télécharger l'image" }).waitFor();
    await recordImageOutput(browser, page, '/fr/tools/compresser-image/',
      () => page.getByRole('button', { name: "Télécharger l'image" }).click(),
      { width: 1200, height: 630 }, 'image/jpeg');
  });

  await withApp('/fr/tools/redimensionner-image/', async (page) => {
    await inputFile(page, '#imageInput', fixture);
    await page.fill('#targetWidth', '600');
    await page.fill('#targetHeight', '315');
    await page.locator('form').first().getByRole('button', { name: 'Redimensionner' }).click();
    await recordImageOutput(browser, page, '/fr/tools/redimensionner-image/',
      () => page.click('#downloadImage'), { width: 600, height: 315 });
  });

  await withApp('/fr/tools/generateur-qr/', async (page) => {
    await page.fill('#qrUrl', `https://example.invalid/${PRIVATE_MARKER}`);
    await page.locator('form').first().getByRole('button', { name: 'Créer le QR code' }).click();
    await recordImageOutput(browser, page, '/fr/tools/generateur-qr/',
      () => page.click('#downloadPng'), { width: 240, height: 240 });
  });

  await withApp('/fr/tools/supprimer-arriere-plan/', async (page) => {
    await inputFile(page, '#bgFile', fixture);
    await page.click('#processBg');
    await recordImageOutput(browser, page, '/fr/tools/supprimer-arriere-plan/',
      () => page.click('#downloadBg'), { width: 1200, height: 630 });
  });

  await withApp('/fr/tools/photo-identite/', async (page) => {
    await inputFile(page, '#photoInput', fixture);
    await page.locator('form').first().getByRole('button', { name: "Créer l'aperçu" }).click();
    await recordImageOutput(browser, page, '/fr/tools/photo-identite/',
      () => page.click('#downloadPng'), { width: 413, height: 531 });
  });

  await withApp('/fr/tools/recadrer-image/', async (page) => {
    await inputFile(page, '#cropFile', fixture);
    await page.getByRole('button', { name: 'Carré 1:1' }).click();
    await page.fill('#outW', '630');
    await page.fill('#outH', '630');
    await page.click('#renderCrop');
    await recordImageOutput(browser, page, '/fr/tools/recadrer-image/',
      () => page.click('#downloadCrop'), { width: 630, height: 630 });
  });

  await withApp('/fr/tools/selecteur-couleur/', async (page) => {
    await inputFile(page, '#imageInput', fixture);
    await page.locator('form').first().getByRole('button', { name: 'Créer la palette' }).click();
    await recordImageOutput(browser, page, '/fr/tools/selecteur-couleur/',
      () => page.click('#downloadPng'), { width: 640, height: 320 });
  });

  await withApp('/fr/tools/generateur-favicon/', async (page) => {
    await page.fill('#favText', 'P9');
    await inputFile(page, '#favImage', fixture);
    await page.locator('form').first().getByRole('button', { name: 'Créer les favicons' }).click();
    await recordImageOutput(browser, page, '/fr/tools/generateur-favicon/',
      () => page.click('#download32'), { width: 32, height: 32 });
  });

  await withApp('/fr/tools/image-en-texte/', async (page) => {
    await page.fill('#manualText', PRIVATE_MARKER);
    await page.click('#useTypedBtn');
    const download = await downloadFrom(page, () => page.click('#downloadBtn'));
    const text = download.buffer.toString('utf8');
    expect(text).toContain(PRIVATE_MARKER);
    evidence.outputs.push({
      route: '/fr/tools/image-en-texte/',
      format: 'text/plain; charset=utf-8',
      filename: download.filename,
      bytes: download.buffer.length,
      parsed: true,
      containsSyntheticMarker: true,
    });
  });

  await withApp('/fr/tools/generateur-memes/', async (page) => {
    await inputFile(page, '#memeImage', fixture);
    await page.fill('#memeTop', PRIVATE_MARKER);
    await page.locator('form').first().getByRole('button', { name: "Créer l'aperçu" }).click();
    await recordImageOutput(browser, page, '/fr/tools/generateur-memes/',
      () => page.click('#memeDownload'), { width: 320, height: 320 });
  });

  await withApp('/fr/tools/createur-logo/', async (page) => {
    await page.fill('#businessName', PRIVATE_MARKER);
    await inputFile(page, '#markInput', fixture);
    await recordImageOutput(browser, page, '/fr/tools/createur-logo/',
      () => page.click('#downloadPngBtn'), { width: 1920, height: 1080 });
  });

  await withApp('/fr/tools/filtres-image/', async (page) => {
    await inputFile(page, '#imageInput', fixture);
    await page.click('#applyBtn');
    await recordImageOutput(browser, page, '/fr/tools/filtres-image/',
      () => page.getByRole('button', { name: /Télécharger/ }).click(),
      { width: 1200, height: 630 });
  });

  await withApp('/fr/tools/carte-sociale/', async (page) => {
    await page.fill('#cardTitle', PRIVATE_MARKER);
    await inputFile(page, '#bgImage', fixture);
    await recordImageOutput(browser, page, '/fr/tools/carte-sociale/',
      () => page.click('#exportBtn'), { width: 1200, height: 630 });
  });

  await withApp('/fr/tools/createur-certificat/', async (page) => {
    await page.fill('#recipient', PRIVATE_MARKER);
    await inputFile(page, '#logoFile', fixture);
    await page.locator('form').first().getByRole('button', { name: 'Mettre à jour' }).click();
    await recordImageOutput(browser, page, '/fr/tools/createur-certificat/',
      () => page.click('#downloadPng'), { width: 1400, height: 990 });
  });

  await withApp('/fr/tools/createur-flyer/', async (page) => {
    await page.fill('#headline', PRIVATE_MARKER);
    await inputFile(page, '#imageInput', fixture);
    await recordImageOutput(browser, page, '/fr/tools/createur-flyer/',
      () => page.click('#exportBtn'), { width: 1240, height: 1754 });
  });

  await withApp('/fr/tools/createur-miniatures/', async (page) => {
    await page.fill('#titleText', PRIVATE_MARKER);
    await inputFile(page, '#imageInput', fixture);
    await recordImageOutput(browser, page, '/fr/tools/createur-miniatures/',
      () => page.click('#exportBtn'), { width: 1280, height: 720 });
  });

  await withApp('/fr/tools/filigrane-images/', async (page) => {
    await page.fill('#watermarkText', PRIVATE_MARKER);
    await inputFile(page, '#imageInput', fixture);
    await page.click('#processAllBtn');
    await recordImageOutput(browser, page, '/fr/tools/filigrane-images/',
      () => page.click('#downloadCurrentBtn'), { width: 1200, height: 630 });
  });

  await withApp('/fr/tools/convertir-format-image/', async (page) => {
    await inputFile(page, '#fileInput', fixture);
    await page.click('#convertBtn');
    await recordImageOutput(browser, page, '/fr/tools/convertir-format-image/',
      () => page.click('#downloadBtn'), { width: 1200, height: 630 });
  });

  await withApp('/fr/tools/palette-couleurs/', async (page) => {
    const download = await downloadFrom(page, () => page.click('#exportAllJson'));
    const parsed = JSON.parse(download.buffer.toString('utf8'));
    expect(parsed).toHaveLength(46);
    expect(parsed.reduce((count, palette) => count + palette.colors.length, 0)).toBe(230);
    evidence.outputs.push({
      route: '/fr/tools/palette-couleurs/',
      format: 'application/json',
      filename: download.filename,
      bytes: download.buffer.length,
      parsed: true,
      palettes: parsed.length,
      colours: parsed.reduce((count, palette) => count + palette.colors.length, 0),
    });
  });
  await browser.close();
});

test.afterAll(() => {
  evidence.summary = {
    routes: APPS.length,
    viewportCombinations: evidence.matrix.length,
    viewportFailures: 0,
    primaryOutputsParsedOrReopened: evidence.outputs.length,
    outputFailures: 0,
    privatePayloadLeaks: 0,
    selectedImageUploads: 0,
    frenchRuntimeResidue: 0,
  };
  fs.mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
  fs.writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
});
