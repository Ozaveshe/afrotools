const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { test, expect } = require('@playwright/test');
const { apps } = require('../../scripts/build-swahili-document-pdf-parity.js');

const allRoutes = [
  { id: 'document-pdf', swahiliRoute: '/sw/hati-na-pdf/' },
  ...apps.map(({ id, swahiliRoute }) => ({ id, swahiliRoute }))
];
const requestedIds = new Set(String(process.env.SW_DOCUMENT_PDF_IDS || '')
  .split(',').map((value) => value.trim()).filter(Boolean));
const routes = requestedIds.size
  ? allRoutes.filter((route) => requestedIds.has(route.id))
  : allRoutes;
const unknown = [...requestedIds].filter((id) => !allRoutes.some((route) => route.id === id));
if (unknown.length) throw new Error(`Unknown SW_DOCUMENT_PDF_IDS: ${unknown.join(', ')}`);

const RECEIPT = path.join(__dirname, '../../reports/swahili-document-pdf-visual-contract.json');
const thresholds = Object.freeze({
  textContrast: 4.5,
  boundaryContrast: 3,
  focusContrast: 3,
  focusWidth: 2,
  overflow: 2
});
const results = new Map();
const themeModes = ['system-light', 'system-dark', 'explicit-light', 'explicit-dark'];

test.describe.configure({ mode: 'serial' });
test.setTimeout(900000);
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

function failMessage(id, mode, result) {
  return `${id} ${mode} ${JSON.stringify(result.meta)}: ${JSON.stringify(result.failures.slice(0, 12))}`;
}

function sourceDigest() {
  const files = [
    'assets/css/sw-document-pdf-a11y.css',
    'assets/js/pages/sw-document-pdf-dom-stability.js',
    'assets/js/pages/sw-document-pdf-integrity.js',
    'assets/js/pages/sw-document-pdf-lexicon.js',
    'assets/js/pages/sw-document-pdf-localizer.js',
    'data/localization/sw-document-pdf-lexicon.json',
    'scripts/build-swahili-document-pdf-lexicon.js',
    'scripts/build-swahili-document-pdf-parity.js',
    ...allRoutes.map((route) => route.id === 'document-pdf'
      ? 'sw/hati-na-pdf/index.html'
      : apps.find((app) => app.id === route.id).swahiliFile)
  ];
  const hash = crypto.createHash('sha256');
  files.forEach((file) => {
    hash.update(file);
    hash.update('\0');
    hash.update(fs.readFileSync(path.join(__dirname, '../..', file)));
    hash.update('\0');
  });
  return hash.digest('hex');
}

async function applyTheme(page, mode) {
  const dark = mode.endsWith('dark');
  await page.emulateMedia({ colorScheme: dark ? 'dark' : 'light', reducedMotion: 'reduce' });
  await page.evaluate(({ explicit, darkMode }) => {
    const root = document.documentElement;
    root.classList.remove('dark', 'dark-mode');
    document.body.classList.remove('dark', 'dark-mode');
    if (explicit) root.dataset.theme = darkMode ? 'dark' : 'light';
    else root.removeAttribute('data-theme');
  }, { explicit: mode.startsWith('explicit'), darkMode: dark });
  await page.waitForTimeout(400);
}

async function measureVisuals(page) {
  return page.locator('body').evaluate((scope) => {
    const sharedChrome = 'afro-navbar, afro-footer, afro-related-tools, afro-site-assistant, afro-newsletter-cta, afro-business-cta, #afro-cookie-consent';
    function color(value) {
      if (!value || value === 'transparent') return [0, 0, 0, 0];
      const rgb = value.match(/^rgba?\(([^)]+)\)$/i);
      if (rgb) {
        const parts = rgb[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
        return [parts[0], parts[1], parts[2], Number.isFinite(parts[3]) ? parts[3] : 1];
      }
      const srgb = value.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/i);
      if (srgb) return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255, srgb[4] ? Number(srgb[4]) : 1];
      return [0, 0, 0, 1];
    }
    function composite(foreground, background) {
      const alpha = foreground[3] + background[3] * (1 - foreground[3]);
      if (!alpha) return [0, 0, 0, 0];
      return [0, 1, 2].map((index) => (
        (foreground[index] * foreground[3] + background[index] * background[3] * (1 - foreground[3])) / alpha
      )).concat(alpha);
    }
    function background(element) {
      const layers = [];
      let current = element;
      while (current) {
        const layer = color(getComputedStyle(current).backgroundColor);
        layers.push(layer);
        if (layer[3] >= 0.999) break;
        current = current.parentElement;
      }
      let result = [255, 255, 255, 1];
      for (let index = layers.length - 1; index >= 0; index -= 1) result = composite(layers[index], result);
      return result;
    }
    function luminance(rgb) {
      const linear = rgb.slice(0, 3).map((component) => {
        const channel = component / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    }
    function ratio(first, second) {
      const a = luminance(first);
      const b = luminance(second);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }
    function visible(element) {
      if (element.closest('[hidden], [aria-hidden="true"]')) return false;
      const closedDetails = element.closest('details:not([open])');
      if (closedDetails && !element.closest('summary')) return false;
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      const rects = [...element.getClientRects()];
      return rects.some((rect) => rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0);
    }
    function label(element) {
      return `${element.tagName.toLowerCase()}#${element.id || ''}.${String(element.className || '').trim().replace(/\s+/g, '.').slice(0, 80)}`;
    }
    const englishResidue = /\b(?:the|and|with|before|after|your|this|from|into|does|what|how|can|every|should|receipt|meeting|business|plan|review|download|upload|customer|payment|seller|buyer|draft|ready|details|items|total|year|profit|revenue|costs|assumptions|generated|prepared|source|limitations|check|works|best|select|use|files|text|page|document|country|format|advisor|include|show|hide|risky|field|open|tool)\b/i;

    const failures = [];
    let minTextContrast = Infinity;
    let textNodes = 0;
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || parent.closest(sharedChrome) || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|SVG|CANVAS|OPTION)$/.test(parent.tagName) || !visible(parent)) {
          return NodeFilter.FILTER_REJECT;
        }
        const range = document.createRange();
        range.selectNodeContents(node);
        if (![...range.getClientRects()].some((rect) => rect.width > 0 && rect.height > 0)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      const bg = background(parent);
      const fg = composite(color(getComputedStyle(parent).color), bg);
      const value = ratio(fg, bg);
      minTextContrast = Math.min(minTextContrast, value);
      textNodes += 1;
      if (value < 4.5) failures.push({
        kind: 'text',
        ratio: Number(value.toFixed(3)),
        element: label(parent),
        foreground: getComputedStyle(parent).color,
        background: getComputedStyle(parent).backgroundColor,
        inlineStyle: parent.getAttribute('style') || '',
        inlineColorPriority: parent.style.getPropertyPriority('color'),
        resolvedBackground: bg.slice(0, 3).map((component) => Math.round(component)),
        text: node.nodeValue.trim().slice(0, 100)
      });
      if (englishResidue.test(node.nodeValue.replace(/\{[a-z][a-z0-9_-]*\}/gi, ''))) failures.push({
        kind: 'language',
        element: label(parent),
        text: node.nodeValue.trim().slice(0, 160)
      });
    }

    const selector = 'button:not([disabled]),input:not([type="hidden"]):not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],summary,[role="button"],[role="checkbox"],[role="radio"],[role="switch"],[role="tab"],[role="menuitem"],[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';
    const controls = [...new Set([...scope.querySelectorAll(selector)].filter((element) => visible(element) && !element.closest(sharedChrome)))];
    let minBoundaryContrast = Infinity;
    let boundaryControls = 0;
    controls.forEach((element, index) => {
      element.dataset.swVisualControl = String(index);
      const style = getComputedStyle(element);
      ['aria-label', 'placeholder', 'title'].forEach((attribute) => {
        const value = element.getAttribute(attribute) || '';
        const isExecutableSyntaxExample = attribute === 'placeholder'
          && element.matches('textarea#customCss')
          && /@page\s*\{|break-before\s*:|color\s*:/i.test(value);
        if (isExecutableSyntaxExample) return;
        if (englishResidue.test(value.replace(/\{[a-z][a-z0-9_-]*\}/gi, ''))) failures.push({
          kind: 'accessible-language',
          element: label(element),
          attribute,
          text: value.slice(0, 160)
        });
      });
      const inlineTextLink = element.tagName === 'A' && style.display === 'inline' && color(style.backgroundColor)[3] === 0;
      if (inlineTextLink) return;
      const outside = background(element.parentElement || scope);
      const fill = composite(color(style.backgroundColor), outside);
      const candidates = [ratio(fill, outside)];
      ['Top', 'Right', 'Bottom', 'Left'].forEach((side) => {
        if (parseFloat(style[`border${side}Width`]) > 0) candidates.push(ratio(color(style[`border${side}Color`]), outside));
      });
      const value = Math.max(...candidates);
      minBoundaryContrast = Math.min(minBoundaryContrast, value);
      boundaryControls += 1;
      if (value < 3) failures.push({
        kind: 'boundary',
        ratio: Number(value.toFixed(3)),
        element: label(element),
        href: element.getAttribute('href') || '',
        text: (element.textContent || '').trim().slice(0, 80),
        border: style.borderTopColor,
        fill: style.backgroundColor,
        outside: outside.slice(0, 3).map((component) => Math.round(component))
      });
    });

    return {
      meta: {
        lang: document.documentElement.lang,
        theme: document.documentElement.dataset.theme || '',
        scope: scope.tagName,
        textToken: getComputedStyle(document.documentElement).getPropertyValue('--sw-doc-text').trim(),
        borderToken: getComputedStyle(document.documentElement).getPropertyValue('--sw-doc-border').trim(),
        stylesheets: [...document.styleSheets].map((sheet) => sheet.href || 'inline').filter((href) => /sw-document-pdf-a11y|theme-dark|inline/.test(href)).slice(-8)
      },
      failures,
      textNodes,
      controls: controls.length,
      boundaryControls,
      minTextContrast: Number((Number.isFinite(minTextContrast) ? minTextContrast : 21).toFixed(3)),
      minBoundaryContrast: Number((Number.isFinite(minBoundaryContrast) ? minBoundaryContrast : 21).toFixed(3))
    };
  });
}

async function measureKeyboardFocus(page) {
  const expected = await page.locator('body').evaluate((scope) => (
    [...scope.querySelectorAll('[data-sw-visual-control]')]
      .filter((element) => {
        const style = getComputedStyle(element);
        return !element.closest('afro-navbar, afro-footer, afro-related-tools, afro-site-assistant, afro-newsletter-cta, afro-business-cta, #afro-cookie-consent')
          && !element.disabled && element.tabIndex >= 0 && style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
      })
      .map((element) => element.dataset.swVisualControl)
  ));
  const remaining = new Set(expected);
  const failures = [];
  await page.evaluate(() => {
    document.querySelectorAll('afro-navbar, afro-footer, afro-related-tools, afro-site-assistant, afro-newsletter-cta, afro-business-cta, #afro-cookie-consent')
      .forEach((element) => { element.inert = true; element.setAttribute('tabindex', '-1'); });
    const focusable = 'button,input,select,textarea,a[href],summary,[role="button"],[role="checkbox"],[role="radio"],[role="switch"],[role="tab"],[role="menuitem"],[tabindex],[contenteditable="true"]';
    document.querySelectorAll(focusable).forEach((element) => {
      if (element.dataset.swVisualControl === undefined) element.setAttribute('tabindex', '-1');
    });
    if (window.__swVisualFocusListener) document.removeEventListener('focusin', window.__swVisualFocusListener, true);
    window.__swVisualFocusProof = {};
    window.__swVisualFocusListener = (event) => {
      function parse(value) {
        const match = String(value || '').match(/[\d.]+/g) || [];
        return [Number(match[0] || 0), Number(match[1] || 0), Number(match[2] || 0)];
      }
      function lum(rgb) {
        const values = rgb.map((component) => {
          const channel = component / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
      }
      function ratio(a, b) {
        const first = lum(a); const second = lum(b);
        return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
      }
      function bg(element) {
        let current = element;
        while (current) {
          const value = getComputedStyle(current).backgroundColor;
          if (value !== 'transparent' && !/rgba?\([^)]*,\s*0(?:\.0+)?\)$/.test(value)) return parse(value);
          current = current.parentElement;
        }
        return [255, 255, 255];
      }
      const element = event.target;
      if (!(element instanceof HTMLElement) || element.dataset.swVisualControl === undefined) return;
      const style = getComputedStyle(element);
      window.__swVisualFocusProof[element.dataset.swVisualControl] = {
        id: element.dataset.swVisualControl,
        width: parseFloat(style.outlineWidth) || 0,
        contrast: ratio(parse(style.outlineColor), bg(element)),
        label: `${element.tagName.toLowerCase()}#${element.id || ''}`
      };
    };
    document.addEventListener('focusin', window.__swVisualFocusListener, true);
    if (document.activeElement && typeof document.activeElement.blur === 'function') document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  for (let index = 0; index < expected.length + 32 && remaining.size; index += 1) {
    await page.keyboard.press('Tab');
  }
  const proof = await page.evaluate(() => Object.values(window.__swVisualFocusProof || {}));
  let minContrast = Infinity;
  let minWidth = Infinity;
  proof.forEach((focused) => {
    if (!remaining.has(focused.id)) return;
    remaining.delete(focused.id);
    minContrast = Math.min(minContrast, focused.contrast);
    minWidth = Math.min(minWidth, focused.width);
    if (focused.width <= 2 || focused.contrast < 3) failures.push(focused);
  });
  remaining.forEach((id) => failures.push({ id, kind: 'unreached-by-tab' }));
  return {
    failures,
    reached: expected.length - remaining.size,
    expected: expected.length,
    minFocusContrast: Number((Number.isFinite(minContrast) ? minContrast : 21).toFixed(3)),
    minFocusWidth: Number((Number.isFinite(minWidth) ? minWidth : 99).toFixed(3))
  };
}

async function measureReflow(page, width) {
  await page.setViewportSize({ width, height: 900 });
  return page.evaluate(async () => {
    document.documentElement.style.setProperty('font-size', '100%', 'important');
    document.documentElement.style.setProperty('-webkit-text-size-adjust', '100%', 'important');
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const base = parseFloat(getComputedStyle(document.documentElement).fontSize);
    document.documentElement.style.setProperty('font-size', '200%', 'important');
    document.documentElement.style.setProperty('-webkit-text-size-adjust', '200%', 'important');
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const root = document.documentElement;
    const overflow = Math.max(0, root.scrollWidth - root.clientWidth);
    const offenders = [...document.querySelectorAll('body *')].filter((element) => {
      if (element.closest('[hidden], [aria-hidden="true"]')) return false;
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || !element.getClientRects().length) return false;
      const rect = element.getBoundingClientRect();
      return rect.left < -2 || rect.right > root.clientWidth + 2;
    }).slice(0, 12).map((element) => {
      const rect = element.getBoundingClientRect();
      return { tag: element.tagName, id: element.id, className: String(element.className || '').slice(0, 80), left: rect.left, right: rect.right, width: rect.width };
    });
    return {
      baseFontSize: base,
      scaledFontSize: parseFloat(getComputedStyle(root).fontSize),
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      mainScrollWidth: (document.querySelector('main, [role="main"]') || document.body).scrollWidth,
      overflow,
      offenders
    };
  });
}

test.afterAll(() => {
  if (requestedIds.size) return;
  const rows = allRoutes.map((route) => results.get(route.id) || { id: route.id, route: route.swahiliRoute, status: 'blocked', reason: 'missing browser result' });
  const output = {
    schemaVersion: 1,
    locale: 'sw',
    category: 'document-pdf',
    denominator: 32,
    thresholds,
    sourceDigest: sourceDigest(),
    accepted: rows.filter((row) => row.status === 'accepted').length,
    blocked: rows.filter((row) => row.status !== 'accepted').length,
    rows
  };
  fs.writeFileSync(RECEIPT, `${JSON.stringify(output, null, 2)}\n`);
});

for (const route of routes) {
  test(`${route.id}: exhaustive visible contrast, control boundary, keyboard focus and 200% reflow`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('afrotools_cookie_consent', 'declined');
      localStorage.removeItem('afro_auth_v2');
      localStorage.removeItem('afro_session_v3');
      localStorage.removeItem('afro_profile_cache');
    });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(route.swahiliRoute, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(page.locator('link[href="/assets/css/sw-document-pdf-a11y.css"]')).toHaveCount(1);

    const themes = {};
    for (const mode of themeModes) {
      await applyTheme(page, mode);
      const visual = await measureVisuals(page);
      expect(visual.failures, failMessage(route.id, mode, visual)).toEqual([]);
      expect(visual.minTextContrast).toBeGreaterThanOrEqual(thresholds.textContrast);
      expect(visual.minBoundaryContrast).toBeGreaterThanOrEqual(thresholds.boundaryContrast);
      themes[mode] = { ...visual, failures: undefined };
    }

    // Every app-owned control is reached by real Tab input. The lane focus rule
    // is a fixed black/white two-colour indicator loaded last for every theme,
    // so one exhaustive traversal proves the shared indicator without four
    // redundant multi-minute keyboard walks on control-heavy apps such as CV.
    await applyTheme(page, 'system-light');
    const focus = await measureKeyboardFocus(page);
    expect(focus.failures, `${route.id} real-keyboard focus: ${JSON.stringify(focus.failures.slice(0, 12))}`).toEqual([]);
    expect(focus.reached).toBe(focus.expected);
    expect(focus.minFocusContrast).toBeGreaterThanOrEqual(thresholds.focusContrast);
    expect(focus.minFocusWidth).toBeGreaterThan(thresholds.focusWidth);
    themeModes.forEach((mode) => { themes[mode] = { ...themes[mode], ...focus }; });

    await applyTheme(page, 'explicit-light');
    const reflow320 = await measureReflow(page, 320);
    expect(reflow320.scaledFontSize).toBeGreaterThanOrEqual(reflow320.baseFontSize * 1.95);
    expect(reflow320.overflow, `${route.id} 320px/200%: ${JSON.stringify(reflow320)}`).toBeLessThanOrEqual(thresholds.overflow);
    expect(reflow320.offenders, `${route.id} 320px/200% clipped boundaries`).toEqual([]);
    await page.evaluate(() => {
      document.documentElement.style.removeProperty('font-size');
      document.documentElement.style.removeProperty('-webkit-text-size-adjust');
    });
    const reflow375 = await measureReflow(page, 375);
    expect(reflow375.scaledFontSize).toBeGreaterThanOrEqual(reflow375.baseFontSize * 1.95);
    expect(reflow375.overflow, `${route.id} 375px/200%: ${JSON.stringify(reflow375)}`).toBeLessThanOrEqual(thresholds.overflow);
    expect(reflow375.offenders, `${route.id} 375px/200% clipped boundaries`).toEqual([]);

    const minima = {
      textContrast: Math.min(...Object.values(themes).map((entry) => entry.minTextContrast)),
      boundaryContrast: Math.min(...Object.values(themes).map((entry) => entry.minBoundaryContrast)),
      focusContrast: Math.min(...Object.values(themes).map((entry) => entry.minFocusContrast)),
      focusWidth: Math.min(...Object.values(themes).map((entry) => entry.minFocusWidth)),
      maxOverflow: Math.max(reflow320.overflow, reflow375.overflow)
    };
    results.set(route.id, {
      id: route.id,
      route: route.swahiliRoute,
      status: 'accepted',
      minima,
      themes,
      focusContract: { keyboardTraversal: 'real-tab', sharedFixedIndicatorAcrossThemes: true },
      reflow: { width320: reflow320, width375: reflow375 }
    });
  });
}
