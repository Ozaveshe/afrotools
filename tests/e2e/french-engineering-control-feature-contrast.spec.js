const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const rows = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'reports/fr-engineering-construction-parity-manifest.json'),
  'utf8'
)).routes;

async function orderedOwnerSignature(page) {
  return page.evaluate(() => {
    const excluded = [
      'afro-navbar',
      'afro-footer',
      'afro-site-assistant',
      'afro-related-tools',
      'afro-business-cta',
      '.fr-engineering-native-guide'
    ].join(',');
    return Array.from(
      document.querySelectorAll('input,select,textarea,button')
    ).filter((control) => (
      control.type !== 'hidden' &&
      !control.closest(excluded)
    )).map((control) => ({
      tag: control.tagName.toLowerCase(),
      type: (control.type || '').toLowerCase(),
      name: control.name || '',
      min: control.min || '',
      max: control.max || '',
      step: control.step || '',
      optionCount: control.tagName === 'SELECT' ? control.options.length : 0,
      engineeringField: control.dataset.engField || '',
      engineeringAction: control.dataset.engAction || '',
      presetIndex: control.dataset.preset === undefined
        ? ''
        : control.dataset.preset
    }));
  });
}

async function fullSurfaceContrastFailures(page, theme) {
  await page.emulateMedia({
    colorScheme: theme === 'light' ? 'light' : 'dark',
    reducedMotion: 'reduce'
  });
  await page.waitForFunction(() => (
    window.AfroTools &&
    window.AfroTools.darkMode &&
    typeof window.AfroTools.darkMode.set === 'function' &&
    document.documentElement.dataset.frEngineeringThemeReady &&
    document.documentElement.dataset.frEngineeringThemeReady !== 'pending'
  ));
  const transition = await page.evaluate((selectedTheme) => {
    const root = document.documentElement;
    const previousGeneration = Number(
      root.dataset.frEngineeringThemeGeneration || 0
    );
    const themeChoice = selectedTheme === 'system' ? 'auto' : selectedTheme;
    const expectedTheme = window.AfroTools.darkMode.set(themeChoice);
    return { previousGeneration, expectedTheme, themeChoice };
  }, theme);
  await page.waitForFunction(({ previousGeneration, expectedTheme, themeChoice }) => {
    const root = document.documentElement;
    return Number(root.dataset.frEngineeringThemeGeneration || 0) >
        previousGeneration &&
      root.dataset.frEngineeringThemeReady === expectedTheme &&
      root.dataset.theme === expectedTheme &&
      root.dataset.themeChoice === themeChoice &&
      window.AfroTools.darkMode.get() === themeChoice;
  }, transition);
  await page.evaluate(() => new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  ));

  return page.evaluate(() => {
    const sharedScaffolding = [
      'afro-navbar',
      'afro-footer',
      'afro-site-assistant',
      '#cookie-consent',
      '.cookie-consent'
    ].join(',');
    const composedParent = (element) => {
      if (element.parentElement) return element.parentElement;
      const root = element.getRootNode();
      return root instanceof ShadowRoot ? root.host : null;
    };
    const belongsToSharedScaffolding = (element) => {
      for (
        let current = element;
        current;
        current = composedParent(current)
      ) {
        if (current.matches?.(sharedScaffolding)) return true;
      }
      return false;
    };
    const parse = (value) => {
      const match = String(value).match(
        /rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\)/i
      );
      return match
        ? [
            Number(match[1]),
            Number(match[2]),
            Number(match[3]),
            match[4] === undefined ? 1 : Number(match[4])
          ]
        : null;
    };
    const blend = (foreground, background) => {
      const alpha = foreground[3];
      return [
        foreground[0] * alpha + background[0] * (1 - alpha),
        foreground[1] * alpha + background[1] * (1 - alpha),
        foreground[2] * alpha + background[2] * (1 - alpha),
        1
      ];
    };
    const luminance = (color) => {
      const channels = color.slice(0, 3).map((value) => {
        const channel = value / 255;
        return channel <= 0.04045
          ? channel / 12.92
          : Math.pow((channel + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * channels[0] +
        0.7152 * channels[1] +
        0.0722 * channels[2];
    };
    const contrast = (first, second) => {
      const a = luminance(first);
      const b = luminance(second);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
    const pathFor = (element) => {
      const id = element.id ? `#${element.id}` : '';
      const classes = element.classList.length
        ? `.${Array.from(element.classList).slice(0, 3).join('.')}`
        : '';
      return `${element.tagName.toLowerCase()}${id}${classes}`;
    };
    const composedBackground = (element) => {
      const lineage = [];
      for (let current = element; current; current = current.parentElement) {
        lineage.unshift(current);
      }
      let result = [255, 255, 255, 1];
      for (const current of lineage) {
        const style = getComputedStyle(current);
        if (style.backgroundImage !== 'none') return null;
        const layer = parse(style.backgroundColor);
        if (layer && layer[3] > 0) result = blend(layer, result);
      }
      return result;
    };
    const failures = [];
    const inspect = (root) => {
      root.querySelectorAll('*').forEach((element) => {
        if (belongsToSharedScaffolding(element)) return;
        if (element.shadowRoot) inspect(element.shadowRoot);
        const directText = Array.from(element.childNodes)
          .filter((node) => (
            node.nodeType === Node.TEXT_NODE &&
            /\S/.test(node.data || '')
          ))
          .map((node) => node.data.replace(/\s+/g, ' ').trim())
          .join(' ');
        if (!directText) return;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (
          rect.width <= 0 ||
          rect.height <= 0 ||
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          Number.parseFloat(style.opacity || '1') < 0.99
        ) return;
        const foreground = parse(
          element instanceof SVGTextElement ? style.fill : style.color
        );
        const background = composedBackground(element);
        if (!foreground || !background) return;
        const effectiveForeground = blend(foreground, background);
        const ratio = contrast(effectiveForeground, background);
        const fontSize = Number.parseFloat(style.fontSize);
        const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
        const large = fontSize >= 24 ||
          (fontSize >= 18.66 && fontWeight >= 700);
        const required = large ? 3 : 4.5;
        if (ratio + 0.02 < required) {
          failures.push({
            path: pathFor(element),
            text: directText.slice(0, 100),
            foreground: style.color,
            background: background.slice(0, 3).map(Math.round),
            ratio: Number(ratio.toFixed(2)),
            required
          });
        }
      });
    };
    inspect(document.body);
    return failures.slice(0, 8);
  });
}

test('all 26 French Engineering owners preserve ordered English controls and features', async ({ page }) => {
  test.setTimeout(420_000);
  await page.route(/^https?:\/\//, async (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if (hostname === '127.0.0.1') await route.continue();
    else await route.fulfill({ status: 204, body: '' });
  });
  for (const row of rows) {
    await page.goto(row.english, { waitUntil: 'domcontentloaded' });
    const english = await orderedOwnerSignature(page);
    await page.goto(row.french, { waitUntil: 'domcontentloaded' });
    const french = await orderedOwnerSignature(page);
    expect(french, `${row.id} ordered control and feature signature`)
      .toEqual(english);
  }
});

test('all 26 French Engineering owners meet full-surface light, dark and system contrast', async ({ page }) => {
  test.setTimeout(900_000);
  const failures = [];
  const requestedTheme = process.env.FR_ENGINEERING_CONTRAST_THEME;
  const requestedOwner = process.env.FR_ENGINEERING_CONTRAST_OWNER;
  const requestedOwners = requestedOwner
    ? new Set(requestedOwner.split(',').map((value) => value.trim()))
    : null;
  const testedRows = requestedOwner
    ? rows.filter((row) => requestedOwners.has(row.id))
    : rows;
  const themes = requestedTheme
    ? [requestedTheme]
    : ['light', 'dark', 'system'];
  await page.route(/^https?:\/\//, async (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if (hostname === '127.0.0.1') await route.continue();
    else await route.fulfill({ status: 204, body: '' });
  });
  for (const row of testedRows) {
    await page.goto(row.french, { waitUntil: 'domcontentloaded' });
    for (const theme of themes) {
      const findings = await fullSurfaceContrastFailures(page, theme);
      findings.forEach((finding) => failures.push(
        `${row.id}/${theme}: ${finding.path} "${finding.text}" ` +
        `${finding.foreground} on rgb(${finding.background.join(', ')}) ` +
        `${finding.ratio}:1 < ${finding.required}:1`
      ));
    }
  }
  expect(failures, 'French Engineering full-surface contrast failures')
    .toEqual([]);
});
