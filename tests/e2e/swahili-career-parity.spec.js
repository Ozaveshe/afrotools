'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');

const APPS = [
  {
    id: 'career-growth',
    route: '/sw/zana/ukuaji-wa-kazi/',
    form: '[data-career-form]',
    expected: 'Mkurugenzi / VP baada ya miaka 10',
    invalid: { field: 'salary', value: '-1', message: 'mshahara wa mwezi' },
    stale: { field: 'experience', value: '5' },
    txt: 'mpango-career-growth-sw.txt',
    json: 'mpango-career-growth-sw.json',
  },
  {
    id: 'career-switch',
    route: '/sw/zana/kubadili-kazi/',
    form: '[data-career-form]',
    expected: 'KES 815,000',
    invalid: { field: 'currentSalary', value: '0', message: 'mshahara wa sasa' },
    stale: { field: 'trainingMonths', value: '7' },
    txt: 'mpango-career-switch-sw.txt',
    json: 'mpango-career-switch-sw.json',
  },
  {
    id: 'retirement-readiness',
    route: '/sw/zana/utayari-wa-kustaafu/',
    form: '[data-career-form]',
    expected: '66% — B — Ufunikaji wa kati',
    invalid: { field: 'age', value: '60', message: 'lazima uzidi' },
    stale: { field: 'expenses', value: '85000' },
    txt: 'mpango-retirement-readiness-sw.txt',
    json: 'mpango-retirement-readiness-sw.json',
  },
  {
    id: 'salary-negotiation',
    route: '/sw/zana/majadiliano-ya-mshahara/',
    form: '[data-career-form]',
    expected: 'KES 180,000',
    invalid: { field: 'benchmark', value: '0', message: 'kiwango cha kati' },
    stale: { field: 'offerSalary', value: '170000' },
    txt: 'mpango-salary-negotiation-sw.txt',
    json: 'mpango-salary-negotiation-sw.json',
  },
];

function observe(page) {
  const consoleErrors = [];
  const externalRequests = [];
  const resourceErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) externalRequests.push(request.url());
  });
  page.on('response', (response) => {
    if (response.status() >= 400) resourceErrors.push(`${response.status()} ${response.url()}`);
  });
  return { consoleErrors, externalRequests, resourceErrors };
}

async function assertReflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  const offenders = await page.evaluate(() => (
    [...document.querySelectorAll('*')]
      .filter((element) => {
        if (element.closest('.sc-table-wrap')) return false;
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > document.documentElement.clientWidth + 1;
      })
      .map((element) => ({ tag: element.tagName, id: element.id, className: String(element.className || '') }))
  ));
  expect(offenders).toEqual([]);
}

function parseColor(value) {
  const match = value.match(/\d+(?:\.\d+)?/g);
  if (!match) return [0, 0, 0];
  const channels = match.slice(0, 3).map(Number);
  return value.startsWith('color(srgb') ? channels.map((channel) => channel * 255) : channels;
}

function luminance(rgb) {
  const values = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

function contrast(foreground, background) {
  const a = luminance(parseColor(foreground));
  const b = luminance(parseColor(background));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const THEME_VARIANTS = [
  { name: 'light', attribute: 'light', scheme: 'light' },
  { name: 'dark', attribute: 'dark', scheme: 'dark' },
  { name: 'system-light', attribute: 'system', scheme: 'light' },
  { name: 'system-dark', attribute: 'system', scheme: 'dark' },
];

async function applyTheme(page, variant) {
  await page.emulateMedia({ colorScheme: variant.scheme });
  await page.evaluate((attribute) => { document.documentElement.dataset.theme = attribute; }, variant.attribute);
}

async function collectCareerContrast(page) {
  return page.evaluate(() => {
    const transparent = (value) => value === 'transparent' || /rgba?\([^)]*,\s*0(?:\.0+)?\s*\)$/.test(value);
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const outsideBackground = (element) => {
      let current = element.parentElement;
      while (current) {
        const value = getComputedStyle(current).backgroundColor;
        if (!transparent(value)) return value;
        current = current.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    };
    const ownBackground = (element) => {
      const value = getComputedStyle(element).backgroundColor;
      return transparent(value) ? outsideBackground(element) : value;
    };
    const name = (element, index) => `${element.tagName.toLowerCase()}#${element.id || element.getAttribute('name') || ''}.${String(element.className || '').trim().replace(/\s+/g, '.')}[${index}]`;
    const text = [];
    [...document.querySelectorAll('.sc-topbar *, .sc-hero *, .sc-main *, .sc-footer *')]
      .filter(visible)
      .filter((element) => [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()))
      .forEach((element, index) => {
        const style = getComputedStyle(element);
        text.push({ name: name(element, index), foreground: style.color, background: ownBackground(element) });
      });
    [...document.querySelectorAll('.sc-field input, .sc-field select')].filter(visible).forEach((element, index) => {
      const style = getComputedStyle(element);
      text.push({ name: `control-text:${name(element, index)}`, foreground: style.color, background: ownBackground(element) });
    });

    const boundary = [];
    const boundarySelector = '.sc-field input, .sc-field select, .sc-link, .sc-button, .sc-file-label, .sc-badge, .sc-card, .sc-metric, .sc-source-list a';
    [...document.querySelectorAll(boundarySelector)].filter(visible).forEach((element, index) => {
      const style = getComputedStyle(element);
      boundary.push({ name: name(element, index), foreground: style.borderTopColor, background: outsideBackground(element) });
    });

    const focus = [];
    const focusSelector = '.sc-field input, .sc-field select, .sc-link, .sc-button, .sc-file-label, .sc-source-list a';
    [...document.querySelectorAll(focusSelector)].filter(visible).forEach((element, index) => {
      if (element.matches('.sc-file-label')) {
        const input = document.getElementById(element.htmlFor);
        if (input) input.focus({ preventScroll: true });
      } else {
        element.focus({ preventScroll: true });
      }
      const style = getComputedStyle(element);
      focus.push({ name: name(element, index), foreground: style.outlineColor, background: outsideBackground(element), width: parseFloat(style.outlineWidth) || 0 });
    });
    return {
      text,
      boundary,
      focus,
      primaryActions: document.querySelectorAll('.sc-button-primary').length,
      secondaryActions: document.querySelectorAll('.sc-button:not(.sc-button-primary), .sc-link, .sc-file-label').length,
    };
  });
}

for (const app of APPS) {
  for (const width of [320, 375]) {
    for (const theme of ['light', 'dark']) {
      test(`${app.id} reflows at ${width}px, 200% and ${theme} with clean resources`, async ({ browser }) => {
        const context = await browser.newContext({ viewport: { width, height: 812 } });
        const page = await context.newPage();
        const runtime = observe(page);
        const response = await page.goto(app.route, { waitUntil: 'networkidle' });
        expect(response.status()).toBe(200);
        await expect(page.locator('afro-navbar')).toHaveCount(1);
        await expect(page.locator('afro-footer')).toHaveCount(1);
        await page.waitForTimeout(15000);
        await page.evaluate((selectedTheme) => { document.documentElement.dataset.theme = selectedTheme; }, theme);
        await expect(page.locator(app.form)).toBeVisible();
        const colors = await page.locator('.sc-card').first().evaluate((element) => {
          const style = getComputedStyle(element);
          return { foreground: style.color, background: style.backgroundColor };
        });
        expect(contrast(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);
        await assertReflow(page);
        expect(runtime.consoleErrors).toEqual([]);
        expect(runtime.externalRequests).toEqual([]);
        expect(runtime.resourceErrors).toEqual([]);
        await context.close();
      });
    }
  }

  test(`${app.id} clears stale output, rejects invalid input, parses exports and reopens imported and saved plans`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 900, height: 900 },
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    const page = await context.newPage();
    const runtime = observe(page);
    await page.goto(app.route, { waitUntil: 'networkidle' });

    await page.locator('.sc-button-primary').click();
    await expect(page.locator('[data-result-headline]')).toHaveText(app.expected);
    if (app.id === 'career-growth') {
      await expect(page.locator('.sc-result-sections h3')).toHaveText(['Vichocheo vya ukuaji', 'Hatua zinazopendekezwa']);
      await expect(page.locator('.sc-result-sections')).toContainText('Nyongeza ya kupandishwa ngazi');
      await expect(page.locator('.sc-result-sections ol li')).toHaveCount(2);
    }
    if (app.id === 'retirement-readiness') {
      await expect(page.locator('[data-result-metrics]')).toContainText('Mchango wa ziada unaohitajika');
      await expect(page.locator('[data-result-metrics]')).toContainText('KES 18K/mwezi');
    }
    if (app.id === 'salary-negotiation') {
      await expect(page.locator('[data-result-notes]')).toContainText('Ikiwa mshahara wa msingi hauwezi kubadilika');
      await expect(page.locator('[data-result-notes]')).toContainText('bonasi ya utendaji');
    }

    const copiedPromise = page.waitForFunction(() => navigator.clipboard.readText().then((text) => text.includes('afrotools.sw-career-plan.v1')));
    await page.locator('[data-career-action="copy"]').click();
    await copiedPromise;
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(app.id);

    const txtPromise = page.waitForEvent('download');
    await page.locator('[data-career-action="txt"]').click();
    const txtDownload = await txtPromise;
    expect(txtDownload.suggestedFilename()).toBe(app.txt);
    const txt = fs.readFileSync(await txtDownload.path(), 'utf8');
    expect(txt).toContain(`mpango wa ${app.id}`);
    expect(txt).toContain('schema: afrotools.sw-career-plan.v1');
    if (app.id === 'career-growth') expect(txt).toContain('Hatua zinazopendekezwa');
    if (app.id === 'retirement-readiness') expect(txt).toContain('Mchango wa ziada unaohitajika: KES 18K/mwezi');
    if (app.id === 'salary-negotiation') expect(txt).toContain('Ikiwa mshahara wa msingi hauwezi kubadilika');

    const jsonPromise = page.waitForEvent('download');
    await page.locator('[data-career-action="json"]').click();
    const jsonDownload = await jsonPromise;
    expect(jsonDownload.suggestedFilename()).toBe(app.json);
    const jsonText = fs.readFileSync(await jsonDownload.path(), 'utf8');
    const parsed = JSON.parse(jsonText);
    expect(parsed.schema).toBe('afrotools.sw-career-plan.v1');
    expect(parsed.app).toBe(app.id);
    expect(parsed.locale).toBe('sw');
    if (app.id === 'career-growth') {
      expect(parsed.output.growthDrivers).toHaveLength(3);
      expect(parsed.output.recommendedNextSteps).toHaveLength(2);
    }
    if (app.id === 'retirement-readiness') expect(parsed.output.extraContribution).toBeCloseTo(18120.179559550987, 6);
    if (app.id === 'salary-negotiation') expect(parsed.output.script).toContain('tathmini ya utendaji baada ya miezi 6');

    await page.locator(`[name="${app.stale.field}"]`).fill(app.stale.value);
    await expect(page.locator('[data-career-results]')).toBeHidden();
    await page.locator('[data-career-import]').setInputFiles({
      name: app.json,
      mimeType: 'application/json',
      buffer: Buffer.from(jsonText),
    });
    await expect(page.locator('[data-result-headline]')).toHaveText(app.expected);
    await expect(page.locator('[data-career-status]')).toContainText('JSON imefunguliwa');

    await page.locator('[data-career-action="save"]').click();
    await expect(page.locator('[data-career-status]')).toContainText('umehifadhiwa');
    await page.locator(`[name="${app.stale.field}"]`).fill(app.stale.value);
    await expect(page.locator('[data-career-results]')).toBeHidden();
    await page.locator('[data-career-action="open"]').click();
    await expect(page.locator('[data-result-headline]')).toHaveText(app.expected);
    await expect(page.locator('[data-career-status]')).toContainText('umefunguliwa');

    await page.locator(`[name="${app.invalid.field}"]`).fill(app.invalid.value);
    await page.locator('.sc-button-primary').click();
    await expect(page.locator('[data-career-error]')).toContainText(app.invalid.message);
    await expect(page.locator('[data-career-results]')).toBeHidden();

    await page.locator('[data-career-action="delete"]').click();
    await expect(page.locator('[data-career-status]')).toContainText('umefutwa');
    await page.waitForTimeout(15000);
    expect(runtime.consoleErrors).toEqual([]);
    expect(runtime.externalRequests).toEqual([]);
    expect(runtime.resourceErrors).toEqual([]);
    await context.close();
  });
}

test('all Career routes meet computed text, component-boundary and focus contrast in explicit and system themes', async ({ browser }) => {
  test.setTimeout(120000);
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const minima = { text: Infinity, boundary: Infinity, focus: Infinity, focusWidth: Infinity };
  for (const app of APPS) {
    for (const variant of THEME_VARIANTS) {
      await page.goto(app.route, { waitUntil: 'networkidle' });
      await applyTheme(page, variant);
      const audits = [await collectCareerContrast(page)];
      await page.locator('.sc-button-primary').click();
      audits.push(await collectCareerContrast(page));
      for (const audit of audits) {
        expect(audit.primaryActions, `${app.id}/${variant.name} primary actions`).toBeGreaterThan(0);
        expect(audit.secondaryActions, `${app.id}/${variant.name} secondary actions`).toBeGreaterThan(0);
        for (const sample of audit.text) {
          const ratio = contrast(sample.foreground, sample.background);
          minima.text = Math.min(minima.text, ratio);
          expect(ratio, `${app.id}/${variant.name} text ${sample.name} ${sample.foreground} on ${sample.background}`).toBeGreaterThanOrEqual(4.5);
        }
        for (const sample of audit.boundary) {
          const ratio = contrast(sample.foreground, sample.background);
          minima.boundary = Math.min(minima.boundary, ratio);
          expect(ratio, `${app.id}/${variant.name} boundary ${sample.name} ${sample.foreground} on ${sample.background}`).toBeGreaterThanOrEqual(3);
        }
        for (const sample of audit.focus) {
          const ratio = contrast(sample.foreground, sample.background);
          minima.focus = Math.min(minima.focus, ratio);
          minima.focusWidth = Math.min(minima.focusWidth, sample.width);
          expect(sample.width, `${app.id}/${variant.name} focus width ${sample.name}`).toBeGreaterThanOrEqual(2);
          expect(ratio, `${app.id}/${variant.name} focus ${sample.name}`).toBeGreaterThanOrEqual(3);
        }
      }
    }
  }
  console.log(`SW_CAREER_CONTRAST_MINIMA ${JSON.stringify({ text: Number(minima.text.toFixed(2)), boundary: Number(minima.boundary.toFixed(2)), focus: Number(minima.focus.toFixed(2)), focusWidth: minima.focusWidth })}`);
  await context.close();
});

test('all Career apps expose labels, keyboard focus, canonical, OG, artwork, reciprocal hreflang, and local-only boundaries', async ({ page }) => {
  for (const app of APPS) {
    await page.goto(app.route, { waitUntil: 'networkidle' });
    const unlabeled = await page.evaluate(() => (
      [...document.querySelectorAll('input:not([type="hidden"]), select, button')]
        .filter((control) => {
          if (control.matches('button')) return !control.textContent.trim() && !control.getAttribute('aria-label');
          return !control.labels || control.labels.length === 0;
        })
        .map((control) => control.id || control.name || control.tagName)
    ));
    expect(unlabeled).toEqual([]);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.matches('.sc-skip'))).toBe(true);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${app.route}`);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('.sc-artwork img')).toBeVisible();
    await expect(page.locator('afro-navbar')).toHaveCount(1);
    await expect(page.locator('afro-footer')).toHaveCount(1);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThanOrEqual(2);
    await expect(page.locator('[data-career-status][role="status"]')).toHaveCount(1);
    expect(await page.locator('iframe').count()).toBe(0);
  }
});
