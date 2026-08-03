'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');

const SURFACES = [
  { id: 'hub', route: '/sw/diaspora/', locator: '.fd-hub-grid' },
  { id: 'immigration', route: '/sw/zana/kikokotoo-pointi-za-uhamiaji/', locator: '#fd-immigration-form' },
  { id: 'visa', route: '/sw/zana/kifuatiliaji-ombi-la-visa/', locator: '#fd-visa-form' },
];

function observeRuntime(page) {
  const errors = [];
  const externalRequests = [];
  const resourceErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') externalRequests.push(request.url());
  });
  page.on('response', (response) => {
    if (response.status() >= 400) resourceErrors.push(`${response.status()} ${response.url()}`);
  });
  return { errors, externalRequests, resourceErrors };
}

async function assertRealPrintPdf(page, buttonSelector, statusSelector, expectedText) {
  await page.evaluate(() => {
    window.__swDiasporaBeforePrint = 0;
    window.addEventListener('beforeprint', () => { window.__swDiasporaBeforePrint += 1; });
  });
  await page.locator(buttonSelector).click();
  await expect(page.locator(statusSelector)).toContainText('Hifadhi kama PDF');
  await expect.poll(() => page.evaluate(() => window.__swDiasporaBeforePrint)).toBeGreaterThan(0);
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  expect(pdfBuffer.length).toBeGreaterThan(5000);
  const reopened = await pdfParse(pdfBuffer);
  for (const text of expectedText) expect(reopened.text).toContain(text);
}

async function assertReflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  const offenders = await page.evaluate(() => (
    [...document.querySelectorAll('*')]
      .filter((element) => {
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

async function collectDiasporaContrast(page) {
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
    [...document.querySelectorAll('.fd-topbar *, .fd-hero *, .fd-main *, .fd-footer *')]
      .filter(visible)
      .filter((element) => [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()))
      .forEach((element, index) => {
        const style = getComputedStyle(element);
        text.push({ name: name(element, index), foreground: style.color, background: ownBackground(element) });
      });
    [...document.querySelectorAll('.fd-field input, .fd-field select')].filter(visible).forEach((element, index) => {
      const style = getComputedStyle(element);
      text.push({ name: `control-text:${name(element, index)}`, foreground: style.color, background: ownBackground(element) });
    });

    const boundary = [];
    const boundarySelector = '.fd-field input, .fd-field select, .fd-locale-link, .fd-theme-button, .fd-file-button, .fd-button, .fd-tab, .fd-badge, .fd-card, .fd-fieldset, .fd-doc-item, .fd-source-list a, #fd-visa-source-link';
    [...document.querySelectorAll(boundarySelector)].filter(visible).forEach((element, index) => {
      const style = getComputedStyle(element);
      boundary.push({ name: name(element, index), foreground: style.borderTopColor, background: outsideBackground(element) });
    });

    const focus = [];
    const focusSelector = '.fd-field input, .fd-field select, .fd-locale-link, .fd-theme-button, .fd-file-button, .fd-button, .fd-tab, .fd-source-list a, #fd-visa-source-link';
    [...document.querySelectorAll(focusSelector)].filter(visible).forEach((element, index) => {
      if (element.matches('.fd-file-button')) {
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
      primaryActions: document.querySelectorAll('.fd-button-primary').length,
      secondaryActions: document.querySelectorAll('.fd-button:not(.fd-button-primary), .fd-locale-link, .fd-theme-button, .fd-file-button, .fd-tab').length,
    };
  });
}

async function showResultState(page, appId) {
  if (appId === 'immigration') {
    await page.selectOption('#fd-ca-age', '110');
    await page.selectOption('#fd-ca-education', '135');
    await page.selectOption('#fd-ca-clb', '9');
    await page.selectOption('#fd-ca-canada-experience', '53');
    await page.selectOption('#fd-ca-foreign-experience', '3');
    await page.selectOption('#fd-ca-sibling', '15');
    await page.selectOption('#fd-ca-study', '30');
  } else {
    await page.selectOption('#fd-visa-destination', 'UK');
    await page.selectOption('#fd-visa-type', 'work');
    await page.fill('#fd-visa-submitted', '2026-07-01');
    await page.fill('#fd-visa-minimum', '2');
    await page.fill('#fd-visa-maximum', '4');
    await page.selectOption('#fd-visa-unit', 'weeks');
  }
  await page.locator(appId === 'immigration' ? '#fd-immigration-form button[type="submit"]' : '#fd-visa-form button[type="submit"]').click();
}

for (const surface of SURFACES) {
  for (const width of [320, 375]) {
    for (const theme of ['light', 'dark']) {
      test(`${surface.id} reflows at ${width}px, 200% and ${theme} without network or runtime errors`, async ({ browser }) => {
        const context = await browser.newContext({ viewport: { width, height: 812 } });
        const page = await context.newPage();
        const runtime = observeRuntime(page);
        const response = await page.goto(surface.route, { waitUntil: 'networkidle' });
        expect(response.status()).toBe(200);
        await page.evaluate((selectedTheme) => { document.documentElement.dataset.theme = selectedTheme; }, theme);
        await expect(page.locator(surface.locator)).toBeVisible();
        await expect(page.locator('afro-navbar')).toBeVisible();
        await expect(page.locator('afro-footer')).toBeAttached();
        await expect.poll(() => page.locator('afro-navbar').evaluate((element) => Boolean(element.shadowRoot || element.children.length))).toBe(true);
        await page.waitForTimeout(1200);
        await assertReflow(page);
        expect(runtime.errors).toEqual([]);
        expect(runtime.externalRequests).toEqual([]);
        expect(runtime.resourceErrors).toEqual([]);
        await context.close();
      });
    }
  }
}

test('immigration app preserves formula oracle, keyboard tabs, invalid and stale clearing, and reproducible JSON reopen', async ({ page, browser }) => {
  const runtime = observeRuntime(page);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/sw/zana/kikokotoo-pointi-za-uhamiaji/', { waitUntil: 'networkidle' });

  await page.locator('#fd-tab-ca').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#fd-tab-au')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#fd-tab-uk')).toHaveAttribute('aria-selected', 'true');
  await page.locator('#fd-immigration-form button[type="submit"]').click();
  await expect(page.locator('#fd-immigration-error')).toContainText('mshahara');
  await expect(page.locator('#fd-immigration-results')).toBeHidden();

  await page.locator('#fd-tab-ca').click();
  await page.selectOption('#fd-ca-age', '110');
  await page.selectOption('#fd-ca-education', '135');
  await page.selectOption('#fd-ca-clb', '9');
  await page.selectOption('#fd-ca-canada-experience', '53');
  await page.selectOption('#fd-ca-foreign-experience', '3');
  await page.selectOption('#fd-ca-sibling', '15');
  await page.selectOption('#fd-ca-study', '30');
  await page.locator('#fd-immigration-form button[type="submit"]').click();
  await expect(page.locator('#fd-result-score')).toHaveText('567 pointi');

  await page.locator('#fd-immigration-copy').click();
  await expect(page.locator('#fd-immigration-status')).toContainText('umenakiliwa');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Matokeo: 567 pointi');

  const txtPromise = page.waitForEvent('download');
  await page.locator('#fd-immigration-txt').click();
  const txt = await txtPromise;
  expect(txt.suggestedFilename()).toBe('ukaguzi-pointi-uhamiaji.txt');
  expect(fs.readFileSync(await txt.path(), 'utf8')).toContain('Matokeo: 567 pointi');

  const jsonPromise = page.waitForEvent('download');
  await page.locator('#fd-immigration-json').click();
  const json = await jsonPromise;
  expect(json.suggestedFilename()).toBe('ukaguzi-pointi-uhamiaji.json');
  const jsonPath = await json.path();
  const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  expect(parsed.locale).toBe('sw');
  expect(parsed.app).toBe('immigration-points');
  expect(parsed.sourceVersion).toBe('english-owner-blob-829a2b52c4d1-reviewed-2026-07-31');
  expect(parsed.input.activeRoute).toBe('CA');
  expect(parsed.input.fields['fd-ca-age'].value).toBe('110');
  expect(parsed.result.score).toBe(567);

  await assertRealPrintPdf(page, '#fd-immigration-print', '#fd-immigration-status', ['567 pointi', 'Maelezo ya hesabu']);

  await page.selectOption('#fd-ca-age', '105');
  await expect(page.locator('#fd-immigration-results')).toBeHidden();
  await expect(page.locator('#fd-immigration-status')).toContainText('kokotoa tena');

  const reopenContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const reopenPage = await reopenContext.newPage();
  const reopenRuntime = observeRuntime(reopenPage);
  await reopenPage.goto(new URL('/sw/zana/kikokotoo-pointi-za-uhamiaji/', page.url()).href, { waitUntil: 'networkidle' });
  await reopenPage.locator('#fd-immigration-import').setInputFiles(jsonPath);
  await expect(reopenPage.locator('#fd-immigration-status')).toContainText('kukokotolewa upya');
  await expect(reopenPage.locator('#fd-tab-ca')).toHaveAttribute('aria-selected', 'true');
  await expect(reopenPage.locator('#fd-ca-age')).toHaveValue('110');
  await expect(reopenPage.locator('#fd-ca-education')).toHaveValue('135');
  await expect(reopenPage.locator('#fd-result-score')).toHaveText('567 pointi');
  await reopenPage.locator('#fd-immigration-import').focus();
  await expect(reopenPage.locator('label[for="fd-immigration-import"]')).toHaveCSS('outline-style', 'solid');
  const invalidImmigration = Buffer.from(JSON.stringify({ schemaVersion: 1, app: 'immigration-points', locale: 'sw', sourceVersion: 'wrong', input: parsed.input }));
  await reopenPage.locator('#fd-immigration-import').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: invalidImmigration });
  await expect(reopenPage.locator('#fd-immigration-results')).toBeHidden();
  await expect(reopenPage.locator('#fd-immigration-status')).toContainText('si export halali');
  expect(reopenRuntime.errors).toEqual([]);
  expect(reopenRuntime.externalRequests).toEqual([]);
  expect(reopenRuntime.resourceErrors).toEqual([]);
  await reopenContext.close();
  expect(runtime.errors).toEqual([]);
  expect(runtime.externalRequests).toEqual([]);
  expect(runtime.resourceErrors).toEqual([]);
});

test('visa app validates, clears stale results, saves only explicitly, parses exports and reopens JSON', async ({ page, browser }) => {
  const runtime = observeRuntime(page);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/sw/zana/kifuatiliaji-ombi-la-visa/', { waitUntil: 'networkidle' });

  await page.locator('#fd-visa-form button[type="submit"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#fd-visa-error')).toContainText('mamlaka');
  const destinationSources = {
    UK: /gov\.uk/,
    CA: /canada\.ca/,
    AU: /immi\.homeaffairs\.gov\.au/,
    US: /travel\.state\.gov/,
    AE: /icp\.gov\.ae/,
    SC: /home-affairs\.ec\.europa\.eu/,
  };
  for (const [destination, source] of Object.entries(destinationSources)) {
    await page.selectOption('#fd-visa-destination', destination);
    await expect(page.locator('#fd-visa-source-link')).toHaveAttribute('href', source);
  }
  await page.selectOption('#fd-visa-destination', 'UK');
  await expect(page.locator('#fd-visa-source-link')).toHaveAttribute('href', 'https://www.gov.uk/guidance/visa-processing-times-applications-outside-the-uk');
  await expect(page.locator('.fd-source-callout')).toContainText('31 Julai 2026');
  expect(await page.locator('#fd-visa-source-link').evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);

  await page.selectOption('#fd-visa-type', 'work');
  await page.fill('#fd-visa-submitted', '2026-07-01');
  await page.fill('#fd-visa-minimum', '4');
  await page.fill('#fd-visa-maximum', '2');
  await page.locator('#fd-visa-form button[type="submit"]').click();
  await expect(page.locator('#fd-visa-error')).toContainText('juu');
  await page.fill('#fd-visa-minimum', '2');
  await page.fill('#fd-visa-maximum', '4');
  await page.selectOption('#fd-visa-unit', 'weeks');
  await page.locator('#fd-visa-form button[type="submit"]').click();
  await expect(page.locator('#fd-visa-results')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('afro_sw_visa_timeline_v1'))).toBeNull();

  await page.fill('#fd-visa-maximum', '5');
  await expect(page.locator('#fd-visa-results')).toBeHidden();
  await expect(page.locator('#fd-visa-status')).toContainText('tena');
  await page.fill('#fd-visa-maximum', '4');
  await page.locator('#fd-visa-form button[type="submit"]').click();

  const originalResult = {
    elapsed: await page.locator('#fd-visa-elapsed').textContent(),
    status: await page.locator('#fd-visa-result-status').textContent(),
    timeline: await page.locator('#fd-visa-timeline').textContent(),
  };
  await page.locator('#fd-visa-save').click();
  expect(await page.evaluate(() => localStorage.getItem('afro_sw_visa_timeline_v1'))).not.toBeNull();

  await page.locator('#fd-visa-copy').click();
  await expect(page.locator('#fd-visa-status')).toContainText('umenakiliwa');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Mamlaka: UK');

  const jsonPromise = page.waitForEvent('download');
  await page.locator('#fd-visa-json').click();
  const jsonDownload = await jsonPromise;
  expect(jsonDownload.suggestedFilename()).toBe('kalenda-ombi-visa.json');
  const jsonPath = await jsonDownload.path();
  const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  expect(parsed.locale).toBe('sw');
  expect(parsed.state.destination).toBe('UK');
  expect(parsed.result.minimumCalendarDays).toBe(14);

  const txtPromise = page.waitForEvent('download');
  await page.locator('#fd-visa-txt').click();
  const txtDownload = await txtPromise;
  expect(txtDownload.suggestedFilename()).toBe('kalenda-ombi-visa.txt');
  expect(fs.readFileSync(await txtDownload.path(), 'utf8')).toContain('Mamlaka: UK');

  await assertRealPrintPdf(page, '#fd-visa-print', '#fd-visa-status', ['Dirisha la kupanga', 'Ukaguzi unaofuata']);

  await page.locator('#fd-visa-delete').click();
  expect(await page.evaluate(() => localStorage.getItem('afro_sw_visa_timeline_v1'))).toBeNull();
  await page.selectOption('#fd-visa-destination', 'UK');
  await page.selectOption('#fd-visa-type', 'work');
  await page.fill('#fd-visa-submitted', '2026-07-01');
  await page.fill('#fd-visa-minimum', '2');
  await page.fill('#fd-visa-maximum', '4');
  await page.selectOption('#fd-visa-unit', 'weeks');
  await page.locator('#fd-visa-form button[type="submit"]').click();
  await expect(page.locator('#fd-visa-results')).toBeVisible();

  const invalidVisaPayload = JSON.parse(JSON.stringify(parsed));
  invalidVisaPayload.state.submitted = '2026-02-31';
  await page.locator('#fd-visa-import').setInputFiles({
    name: 'impossible-date.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(invalidVisaPayload)),
  });
  await expect(page.locator('#fd-visa-results')).toBeHidden();
  await expect(page.locator('#fd-visa-status')).toContainText('tarehe halisi');

  const reopenContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const reopenPage = await reopenContext.newPage();
  const reopenRuntime = observeRuntime(reopenPage);
  await reopenPage.goto(new URL('/sw/zana/kifuatiliaji-ombi-la-visa/', page.url()).href, { waitUntil: 'networkidle' });
  expect(await reopenPage.evaluate(() => localStorage.getItem('afro_sw_visa_timeline_v1'))).toBeNull();
  await reopenPage.locator('#fd-visa-import').setInputFiles(jsonPath);
  await expect(reopenPage.locator('#fd-visa-status')).toContainText('imefunguliwa tena');
  await expect(reopenPage.locator('#fd-visa-destination')).toHaveValue('UK');
  await expect(reopenPage.locator('#fd-visa-type')).toHaveValue('work');
  await expect(reopenPage.locator('#fd-visa-submitted')).toHaveValue('2026-07-01');
  await expect(reopenPage.locator('#fd-visa-minimum')).toHaveValue('2');
  await expect(reopenPage.locator('#fd-visa-maximum')).toHaveValue('4');
  await expect(reopenPage.locator('#fd-visa-unit')).toHaveValue('weeks');
  await expect(reopenPage.locator('#fd-visa-results')).toBeVisible();
  await expect(reopenPage.locator('#fd-visa-elapsed')).toHaveText(originalResult.elapsed);
  await expect(reopenPage.locator('#fd-visa-result-status')).toHaveText(originalResult.status);
  await expect(reopenPage.locator('#fd-visa-timeline')).toHaveText(originalResult.timeline);
  await reopenPage.locator('#fd-visa-import').focus();
  await expect(reopenPage.locator('label[for="fd-visa-import"]')).toHaveCSS('outline-style', 'solid');
  expect(reopenRuntime.errors).toEqual([]);
  expect(reopenRuntime.externalRequests).toEqual([]);
  expect(reopenRuntime.resourceErrors).toEqual([]);
  await reopenContext.close();

  expect(runtime.errors).toEqual([]);
  expect(runtime.externalRequests).toEqual([]);
  expect(runtime.resourceErrors).toEqual([]);
});

test('both apps meet computed text, control/action boundary, and focus contrast in explicit and system themes', async ({ browser }) => {
  test.setTimeout(120000);
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const minima = { text: Infinity, boundary: Infinity, focus: Infinity, focusWidth: Infinity };
  for (const app of SURFACES.filter((entry) => entry.id !== 'hub')) {
    for (const variant of THEME_VARIANTS) {
      await page.goto(app.route, { waitUntil: 'networkidle' });
      await applyTheme(page, variant);
      const audits = [await collectDiasporaContrast(page)];
      await showResultState(page, app.id);
      audits.push(await collectDiasporaContrast(page));
      for (const audit of audits) {
        expect(audit.primaryActions, `${app.id}/${variant.name} primary actions`).toBeGreaterThan(0);
        expect(audit.secondaryActions, `${app.id}/${variant.name} secondary actions`).toBeGreaterThan(0);
        for (const sample of audit.text) {
          const ratio = contrast(sample.foreground, sample.background);
          minima.text = Math.min(minima.text, ratio);
          expect(ratio, `${app.id}/${variant.name} text ${sample.name} ${sample.foreground}/${sample.background}`).toBeGreaterThanOrEqual(4.5);
        }
        for (const sample of audit.boundary) {
          const ratio = contrast(sample.foreground, sample.background);
          minima.boundary = Math.min(minima.boundary, ratio);
          expect(ratio, `${app.id}/${variant.name} boundary ${sample.name} ${sample.foreground}/${sample.background}`).toBeGreaterThanOrEqual(3);
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
  console.log(`SW_DIASPORA_CONTRAST_MINIMA ${JSON.stringify({ text: Number(minima.text.toFixed(2)), boundary: Number(minima.boundary.toFixed(2)), focus: Number(minima.focus.toFixed(2)), focusWidth: minima.focusWidth })}`);
  await context.close();
});

test('both apps expose labels, live regions, canonical, OG, artwork and reciprocal hreflang', async ({ page }) => {
  for (const app of SURFACES.filter((entry) => entry.id !== 'hub')) {
    await page.goto(app.route);
    const unlabeled = await page.locator(`${app.locator} input:not([type="checkbox"]), ${app.locator} select`).evaluateAll((elements) => (
      elements.filter((element) => {
        const labels = element.labels ? [...element.labels] : [];
        return labels.length === 0 && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby');
      }).map((element) => element.id)
    ));
    expect(unlabeled).toEqual([]);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThanOrEqual(2);
    await expect(page.locator('[role="status"]')).toHaveCount(1);
  }
});
