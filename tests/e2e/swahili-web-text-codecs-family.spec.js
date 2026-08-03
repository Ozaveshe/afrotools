'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');

const FAMILY = [
  {
    id: 'url-encoder',
    sw: '/sw/zana/kusimba-url/',
    en: '/tools/url-encoder/',
    canonical: 'https://afrotools.com/sw/zana/kusimba-url/',
    artwork: '/assets/img/tools/url-encoder.webp'
  },
  {
    id: 'html-entities',
    sw: '/sw/zana/alama-za-html/',
    en: '/tools/html-entities/',
    canonical: 'https://afrotools.com/sw/zana/alama-za-html/',
    artwork: '/assets/img/tools/html-entities.webp'
  }
];

function webpDimensions(buffer) {
  expect(buffer.toString('ascii', 0, 4)).toBe('RIFF');
  expect(buffer.toString('ascii', 8, 12)).toBe('WEBP');
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (type === 'VP8X') return { width: 1 + buffer.readUIntLE(data + 4, 3), height: 1 + buffer.readUIntLE(data + 7, 3) };
    if (type === 'VP8 ') return { width: buffer.readUInt16LE(data + 6) & 0x3fff, height: buffer.readUInt16LE(data + 8) & 0x3fff };
    if (type === 'VP8L') {
      const bits = buffer.readUInt32LE(data + 1);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
    }
    offset = data + size + (size % 2);
  }
  throw new Error('WebP dimensions not found');
}

async function openPrivate(page, context, route, viewport = { width: 375, height: 900 }, scheme = 'light') {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize(viewport);
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
  const telemetry = { console: [], page: [], writes: [], sameOriginFaults: [], ai: [], sensitive: [] };
  page.on('console', (message) => { if (message.type() === 'error') telemetry.console.push(message.text()); });
  page.on('pageerror', (error) => telemetry.page.push(error.message));
  page.on('request', (request) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) telemetry.writes.push(`${request.method()} ${request.url()}`);
    if (/ai-advisor|netlify\/functions\/(?:ask|chat)|openai/i.test(request.url())) telemetry.ai.push(request.url());
    const requestMaterial = `${request.url()} ${request.postData() || ''} ${JSON.stringify(request.headers())}`;
    if (requestMaterial.includes('SW_CODEC_PRIVATE_SENTINEL')) telemetry.sensitive.push(`${request.method()} ${request.url()}`);
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith('http://127.0.0.1:')) telemetry.sameOriginFaults.push(request.url());
  });
  page.on('response', (response) => {
    if (response.url().startsWith('http://127.0.0.1:') && response.status() >= 400) telemetry.sameOriginFaults.push(`${response.status()} ${response.url()}`);
  });
  const response = await page.goto(route, { waitUntil: 'load' });
  expect(response && response.status()).toBe(200);
  await page.evaluate((theme) => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.setItem('aft_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme-choice', theme);
    document.documentElement.style.colorScheme = theme;
  }, scheme);
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
  return telemetry;
}

function expectClean(telemetry) {
  expect(telemetry.writes).toEqual([]);
  expect(telemetry.ai).toEqual([]);
  expect(telemetry.sameOriginFaults).toEqual([]);
  expect(telemetry.console).toEqual([]);
  expect(telemetry.page).toEqual([]);
  expect(telemetry.sensitive).toEqual([]);
}

async function renderedAccessibility(page, appSelector) {
  await page.keyboard.press('Tab');
  return page.evaluate(async (selector) => {
    const parseColor = (value) => {
      if (!value || value === 'transparent') return [0, 0, 0, 0];
      const rgb = value.match(/^rgba?\(([^)]+)\)$/i);
      if (rgb) {
        const parts = rgb[1].replace(/\//g, ' ').split(/[ ,]+/).filter(Boolean).map(Number);
        return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
      }
      const srgb = value.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/i);
      if (srgb) return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255, srgb[4] === undefined ? 1 : Number(srgb[4])];
      throw new Error(`Unsupported computed color: ${value}`);
    };
    const composite = (foreground, background) => {
      const alpha = foreground[3] + background[3] * (1 - foreground[3]);
      if (!alpha) return [0, 0, 0, 0];
      return [
        (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
        (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
        (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
        alpha
      ];
    };
    const luminance = (color) => [0, 1, 2]
      .map((index) => {
        const channel = color[index] / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      })
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const contrast = (left, right) => {
      const first = luminance(left);
      const second = luminance(right);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };
    const gradientColors = (value) => [...String(value || '').matchAll(/(?:rgba?\([^)]+\)|color\(srgb[^)]+\))/gi)]
      .map((match) => parseColor(match[0]));
    const backgrounds = (element) => {
      const chain = [];
      for (let node = element; node; node = node.parentElement) chain.unshift(node);
      let colors = [[255, 255, 255, 1]];
      for (const node of chain) {
        const style = getComputedStyle(node);
        const solid = parseColor(style.backgroundColor);
        colors = colors.map((background) => composite(solid, background));
        const stops = gradientColors(style.backgroundImage);
        if (stops.length) colors = stops.flatMap((stop) => colors.map((background) => composite(stop, background)));
      }
      return colors;
    };
    const visible = (element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && box.width > 0 && box.height > 0;
    };
    const describe = (element) => {
      const text = (element.innerText || element.value || element.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 100);
      return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''} :: ${text}`;
    };
    const roots = [...document.querySelectorAll(selector)];
    const insideApp = (element) => roots.some((root) => root === element || root.contains(element));
    const textFailures = [];
    const seenText = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.replace(/\s+/g, ' ').trim();
      const element = node.parentElement;
      if (!text || !element || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(element.tagName) || !visible(element)) continue;
      const backdrop = backgrounds(element);
      const foreground = parseColor(getComputedStyle(element).color);
      const ratio = Math.min(...backdrop.map((background) => contrast(composite(foreground, background), background)));
      const key = `${describe(element)}|${text.slice(0, 100)}`;
      if (ratio < 4.5 && !seenText.has(key)) {
        seenText.add(key);
        textFailures.push({ element: describe(element), text: text.slice(0, 100), ratio: Number(ratio.toFixed(2)) });
      }
    }
    const controls = [...document.querySelectorAll('button,input,textarea,select')].filter((element) => insideApp(element) && visible(element));
    const boundaryFailures = controls.flatMap((element) => {
      const style = getComputedStyle(element);
      const outside = backgrounds(element.parentElement);
      const inside = backgrounds(element);
      const fillRatio = Math.min(...inside.flatMap((fill) => outside.map((background) => contrast(fill, background))));
      const border = parseColor(style.borderTopColor);
      const borderRatio = style.borderTopStyle === 'none' || Number.parseFloat(style.borderTopWidth) === 0
        ? 1
        : Math.min(...outside.map((background) => contrast(composite(border, background), background)));
      const ratio = Math.max(fillRatio, borderRatio);
      return ratio < 3 ? [{ element: describe(element), ratio: Number(ratio.toFixed(2)) }] : [];
    });
    const focusables = [...document.querySelectorAll('a[href],button,input,textarea,select,summary,[tabindex]:not([tabindex="-1"])')]
      .filter((element) => insideApp(element) && visible(element) && !element.disabled);
    const focusFailures = [];
    for (const element of focusables) {
      element.focus();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const style = getComputedStyle(element);
      const outside = backgrounds(element.parentElement);
      const outline = parseColor(style.outlineColor);
      const ratio = Math.min(...outside.map((background) => contrast(composite(outline, background), background)));
      if (!element.matches(':focus-visible') || style.outlineStyle === 'none' || Number.parseFloat(style.outlineWidth) < 2 || ratio < 3) {
        focusFailures.push({
          element: describe(element),
          focusVisible: element.matches(':focus-visible'),
          outline: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
          ratio: Number(ratio.toFixed(2))
        });
      }
    }
    return { textFailures, boundaryFailures, focusFailures };
  }, appSelector);
}

async function urlOutputs(page, route) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.locator('#urlInput').fill('https://example.co.ke/a%20b?q=Dar+es+Salaam&q=caf%C3%A9&utm_source=mail&token=sekret#frag');
  await page.locator('#componentInput').fill('Dar es Salaam + café/東京');
  return page.evaluate(() => ({
    rebuilt: document.getElementById('rebuiltUrl').textContent,
    clean: document.getElementById('cleanUrl').textContent,
    query: document.getElementById('queryString').textContent,
    encodeUri: document.getElementById('encodeUriOut').textContent,
    component: document.getElementById('encodeComponentOut').textContent,
    rfc: document.getElementById('rfcOut').textContent,
    form: document.getElementById('formOut').textContent,
    decode: document.getElementById('decodeOut').textContent
  }));
}

test('URL owner matches English engine, clears invalid state and reopens local outputs', async ({ page, context }) => {
  const english = await urlOutputs(page, '/tools/url-encoder/');
  expect(english).toEqual({
    rebuilt: 'https://example.co.ke/a%20b?q=Dar+es+Salaam&q=caf%C3%A9&utm_source=mail&token=sekret#frag',
    clean: 'https://example.co.ke/a%20b?q=Dar+es+Salaam&q=caf%C3%A9&token=sekret#frag',
    query: 'q=Dar+es+Salaam&q=caf%C3%A9&utm_source=mail&token=sekret',
    encodeUri: 'Dar%20es%20Salaam%20+%20caf%C3%A9/%E6%9D%B1%E4%BA%AC',
    component: 'Dar%20es%20Salaam%20%2B%20caf%C3%A9%2F%E6%9D%B1%E4%BA%AC',
    rfc: 'Dar%20es%20Salaam%20%2B%20caf%C3%A9%2F%E6%9D%B1%E4%BA%AC',
    form: 'Dar+es+Salaam+%2B+caf%C3%A9%2F%E6%9D%B1%E4%BA%AC',
    decode: 'Dar es Salaam   café/東京'
  });
  const telemetry = await openPrivate(page, context, '/sw/zana/kusimba-url/');
  await page.locator('#urlInput').fill('https://example.co.ke/a%20b?q=Dar+es+Salaam&q=caf%C3%A9&utm_source=mail&token=sekret#frag');
  await page.locator('#componentInput').fill('Dar es Salaam + café/東京');
  const swahili = await page.evaluate(() => ({
    rebuilt: document.getElementById('rebuiltUrl').textContent,
    clean: document.getElementById('cleanUrl').textContent,
    query: document.getElementById('queryString').textContent,
    encodeUri: document.getElementById('encodeUriOut').textContent,
    component: document.getElementById('encodeComponentOut').textContent,
    rfc: document.getElementById('rfcOut').textContent,
    form: document.getElementById('formOut').textContent,
    decode: document.getElementById('decodeOut').textContent
  }));
  expect(swahili).toEqual(english);
  expect(swahili.clean).not.toContain('utm_source');
  expect(swahili.clean).toContain('token=sekret');
  expect(swahili.query.match(/q=/g)).toHaveLength(2);
  await page.locator('#componentInput').fill('SW_CODEC_PRIVATE_SENTINEL');
  await page.waitForTimeout(100);

  await page.locator('#componentInput').fill('%E0%A4%A');
  await expect(page.locator('#decodeOut')).toContainText('Hitilafu');
  await page.locator('#urlInput').fill('http://[::1');
  await expect(page.locator('#statusLine')).toContainText('URL si sahihi');
  for (const id of ['rebuiltUrl', 'cleanUrl', 'queryString', 'snippetOutput', 'breakdown', 'diffOutput']) await expect(page.locator(`#${id}`)).toBeEmpty();
  await page.locator('#urlInput').fill('https://afrotools.com/sw/?q=salama');
  await expect(page.locator('#statusLine')).toContainText('Imechambuliwa');
  await expect(page.locator('#rebuiltUrl')).toContainText('https://afrotools.com/sw/?q=salama');

  await page.locator('#copyCleanUrl').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await page.locator('#cleanUrl').textContent());
  await page.locator('#saveHistory').click();
  await page.locator('#sendApiTester').click();
  const stored = await page.evaluate(() => ({
    history: JSON.parse(localStorage.getItem('afrotools.urlWorkbench.history.v1')),
    api: JSON.parse(localStorage.getItem('afrotools.apiTester.saved.v1'))
  }));
  await page.reload({ waitUntil: 'domcontentloaded' });
  const reopened = await page.evaluate(() => ({
    history: JSON.parse(localStorage.getItem('afrotools.urlWorkbench.history.v1')),
    api: JSON.parse(localStorage.getItem('afrotools.apiTester.saved.v1'))
  }));
  expect(reopened).toEqual(stored);
  expect(reopened.history[0].url).toBe('https://afrotools.com/sw/?q=salama');
  expect(reopened.api[0]).toEqual(expect.objectContaining({ method: 'GET', url: 'https://afrotools.com/sw/?q=salama', body: '' }));
  await expect(page.locator('#historyList')).toContainText('https://afrotools.com/sw/?q=salama');
  expectClean(telemetry);
});

test('HTML owner matches all English modes, warns safely and reopens both TXT exports', async ({ page, context }) => {
  const fixture = '<p title="A&B">© — café</p>';
  await page.goto('/tools/html-entities/', { waitUntil: 'domcontentloaded' });
  const english = {};
  for (const style of ['named', 'decimal', 'hex']) {
    await page.selectOption('#encodeStyle', style);
    await page.locator('#input').fill(fixture);
    english[style] = await page.locator('#output').inputValue();
  }
  expect(english).toEqual({
    named: '&lt;p title=&quot;A&amp;B&quot;&gt;&copy; &mdash; café&lt;/p&gt;',
    decimal: '&#60;p title=&#34;A&#38;B&#34;&#62;&#169; &#8212; caf&#233;&#60;/p&#62;',
    hex: '&#x3C;p title=&#x22;A&#x26;B&#x22;&#x3E;&#xA9; &#x2014; caf&#xE9;&#x3C;/p&#x3E;'
  });

  const telemetry = await openPrivate(page, context, '/sw/zana/alama-za-html/');
  for (const style of ['named', 'decimal', 'hex']) {
    await page.selectOption('#encodeStyle', style);
    await page.locator('#input').fill(fixture);
    expect(await page.locator('#output').inputValue()).toBe(english[style]);
  }
  await page.locator('#input').fill('SW_CODEC_PRIVATE_SENTINEL');
  await page.waitForTimeout(100);
  await page.selectOption('#encodeStyle', 'named');
  await page.locator('#input').fill(fixture);
  const encoded = await page.locator('#output').inputValue();
  const [encodedDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Pakua .txt' }).click()]);
  expect(encodedDownload.suggestedFilename()).toBe('matokeo-html-entities.txt');
  expect(fs.readFileSync(await encodedDownload.path(), 'utf8')).toBe(encoded);

  await page.getByRole('tab', { name: 'Fumbua' }).click();
  const dangerous = '&lt;script&gt;window.__codecXss=1&lt;/script&gt;&copy;';
  await page.locator('#input').fill(dangerous);
  const decoded = '<script>window.__codecXss=1</script>©';
  await expect(page.locator('#output')).toHaveValue(decoded);
  await expect(page.locator('#diagnostics')).toContainText('markup au script');
  await expect(page.locator('#previewText')).toHaveText(decoded);
  expect(await page.evaluate(() => window.__codecXss)).toBeUndefined();
  await expect(page.locator('#previewText script')).toHaveCount(0);
  await page.getByRole('button', { name: 'Nakili matokeo' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(decoded);
  const [decodedDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Pakua .txt' }).click()]);
  expect(decodedDownload.suggestedFilename()).toBe('matokeo-html-yaliyodecode.txt');
  expect(fs.readFileSync(await decodedDownload.path(), 'utf8')).toBe(decoded);

  await page.getByRole('button', { name: 'Futa', exact: true }).click();
  await expect(page.locator('#input')).toHaveValue('');
  await expect(page.locator('#output')).toHaveValue('');
  await expect(page.locator('#diagnostics')).toBeEmpty();
  await expect(page.locator('#previewText')).toBeEmpty();
  expectClean(telemetry);
});

for (const owner of FAMILY) {
  test(`${owner.id} has computed contrast, 320/375/200% reflow, deterministic themes, keyboard names and no faults`, async ({ page, context }) => {
    const themeColors = {};
    const appSelector = owner.id === 'url-encoder' ? '.hero,main,.faq' : '.tool-hero,[role="main"]';
    for (const view of [
      { width: 320, height: 800, scheme: 'light', zoom: false },
      { width: 375, height: 900, scheme: 'dark', zoom: true }
    ]) {
      const telemetry = await openPrivate(page, context, owner.sw, { width: view.width, height: view.height }, view.scheme);
      if (view.zoom) await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      await page.waitForTimeout(1100);
      const geometry = await page.evaluate(() => {
        const visible = [...document.querySelectorAll('button,input,textarea,select,a')].filter((node) => {
          const style = getComputedStyle(node);
          const box = node.getBoundingClientRect();
          return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0;
        });
        const named = visible.filter((node) => /^(BUTTON|INPUT|TEXTAREA|SELECT)$/.test(node.tagName)).every((node) => {
          const labels = node.labels ? [...node.labels].map((label) => label.textContent).join('') : '';
          return Boolean((node.getAttribute('aria-label') || labels || node.textContent || '').trim());
        });
        const targets = visible.filter((node) => node.matches('button,input,select')).every((node) => node.getBoundingClientRect().height >= 44);
        const outside = visible.filter((node) => { const box = node.getBoundingClientRect(); return box.left < -1 || box.right > innerWidth + 1; }).map((node) => ({ tag: node.tagName, id: node.id, className: node.className, text: (node.textContent || '').trim().slice(0, 40), left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right, width: getComputedStyle(node).width, parent: { className: node.parentElement.className, left: node.parentElement.getBoundingClientRect().left, right: node.parentElement.getBoundingClientRect().right, width: getComputedStyle(node.parentElement).width } }));
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          inside: outside.length === 0,
          outside,
          named,
          targets
        };
      });
      expect(geometry, JSON.stringify(geometry.outside)).toEqual({ overflow: 0, inside: true, outside: [], named: true, targets: true });
      const visibleCopy = await page.locator('body').innerText();
      if (owner.id === 'url-encoder') {
        expect(visibleCopy).not.toMatch(/Tool capabilities|Add as q Parameter|Components and Query Surgery|Edit path and query|Add Parameter|Sort Parameters|Remove Tracking Parameters|Signals that usually|Reference Sources|When should I use|No saved URLs|Invalid URL|No URL to parse|Saved locally for API Tester|Reserved characters, unreserved characters|URL workbench|URL diagnostics/i);
        await expect(page.locator('[aria-label="URL workbench"], [aria-label="URL diagnostics"]')).toHaveCount(0);
        await expect(page.locator('.crumb a[href="/sw/zana-za-developer/"]')).toHaveCount(1);
      } else {
        expect(visibleCopy).not.toMatch(/HTML Entity Tool|Live Preview|Copy Output|Download Output|Named and numeric entities|Does this tool send|Encode and decode HTML entities|Share as Image|Share Result|Share your result|Copy link|Download image/i);
        await expect(page.locator('.act-share-image')).toHaveCount(0);
      }
      const accessibility = await renderedAccessibility(page, appSelector);
      expect(accessibility.textFailures, JSON.stringify(accessibility.textFailures, null, 2)).toEqual([]);
      expect(accessibility.boundaryFailures, JSON.stringify(accessibility.boundaryFailures, null, 2)).toEqual([]);
      expect(accessibility.focusFailures, JSON.stringify(accessibility.focusFailures, null, 2)).toEqual([]);
      const surface = owner.id === 'url-encoder' ? page.locator('.panel').first() : page.locator('.card').first();
      themeColors[view.scheme] = await surface.evaluate((element) => getComputedStyle(element).backgroundColor);
      expectClean(telemetry);
      await page.removeAllListeners();
    }
    expect(themeColors.dark).not.toBe(themeColors.light);
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('meta[name="afrotools:locale-fallback"]')).toHaveCount(0);
    await expect(page.locator('.sw-fallback-notice, .sw-dev-runtime-localizer')).toHaveCount(0);
  });
}

for (const owner of FAMILY) {
  test(`${owner.id} has canonical, reciprocal hreflang, Swahili schema and 800x450 WebP artwork`, async ({ page, request }) => {
    await page.goto(owner.sw, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', owner.canonical);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `https://afrotools.com${owner.en}`);
    await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute('href', owner.canonical);
    const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((value) => JSON.parse(value));
    expect(schemas).toEqual(expect.arrayContaining([expect.objectContaining({ '@type': 'WebApplication', inLanguage: 'sw' })]));
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `https://afrotools.com${owner.artwork}`);
    const imageResponse = await request.get(owner.artwork);
    expect(imageResponse.status()).toBe(200);
    const image = Buffer.from(await imageResponse.body());
    expect(webpDimensions(image)).toEqual({ width: 800, height: 450 });

    await page.goto(owner.en, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute('href', owner.canonical);
  });
}
