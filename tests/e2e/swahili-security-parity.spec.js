'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');

const APPS = [
  { id: 'cctv-cost', route: '/sw/zana/gharama-za-cctv/', expected: 'KES 79,000', type: 'standard', stale: { field: 'cameras', value: '9' }, invalid: { field: 'cameras', value: '0', message: 'kamera kati ya 1 na 64' } },
  { id: 'cybersecurity-assessment', route: '/sw/zana/tathmini-ya-usalama-wa-kidijitali/', expected: '45/100 - daraja D', type: 'standard', stale: { checkbox: 'firewall' }, invalid: { field: 'country', value: '', message: 'Chagua nchi' } },
  { id: 'data-breach-cost', route: '/sw/zana/gharama-ya-uvujaji-wa-data/', expected: '$1,920,000', type: 'standard', stale: { field: 'records', value: '10001' }, invalid: { field: 'records', value: '0', message: 'records kati ya 1' } },
  { id: 'fire-safety-checklist', route: '/sw/zana/ukaguzi-wa-usalama-wa-moto/', expected: '61/100 - Utayari wa sehemu', type: 'standard', stale: { field: 'area', value: '501' }, invalid: { field: 'area', value: '9', message: 'eneo kati ya 10' } },
  { id: 'home-security-cost', route: '/sw/zana/gharama-za-usalama-wa-nyumbani/', expected: 'KES 95,000', type: 'standard', stale: { field: 'riskLevel', value: 'high', select: true }, invalid: { field: 'country', value: '', message: 'thamani halali' } },
  { id: 'password-strength', route: '/sw/zana/nguvu-ya-nenosiri/', expected: '80/100 - Imara sana', type: 'password' },
  { id: 'phishing-quiz', route: '/sw/zana/jaribio-la-kutambua-hadaa/', expected: '10/10 - Matokeo thabiti', type: 'quiz' },
];

function observe(page) {
  const consoleErrors = [];
  const externalRequests = [];
  const resourceErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) externalRequests.push(request.url());
  });
  page.on('response', (response) => { if (response.status() >= 400) resourceErrors.push(`${response.status()} ${response.url()}`); });
  return { consoleErrors, externalRequests, resourceErrors };
}

async function assertReflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  const offenders = await page.evaluate(() => [...document.querySelectorAll('*')]
    .filter((element) => {
      if (element.closest('.ss-table-wrap')) return false;
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > document.documentElement.clientWidth + 1;
    })
    .map((element) => ({ tag: element.tagName, id: element.id, className: String(element.className || '') })));
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

async function collectInteractiveContrast(page) {
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
      return getComputedStyle(document.documentElement).backgroundColor;
    };
    const ownBackground = (element) => {
      const value = getComputedStyle(element).backgroundColor;
      return transparent(value) ? outsideBackground(element) : value;
    };
    const name = (element, index) => `${element.tagName.toLowerCase()}#${element.id || element.getAttribute('name') || ''}.${String(element.className || '').trim().replace(/\s+/g, '.')}[${index}]`;
    const text = [];
    const textElements = [...document.querySelectorAll('.ss-header *, .ss-main *, .ss-footer *')]
      .filter(visible)
      .filter((element) => [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()));
    textElements.forEach((element, index) => {
      const style = getComputedStyle(element);
      text.push({ name: name(element, index), foreground: style.color, background: ownBackground(element) });
    });
    [...document.querySelectorAll('.ss-input, .ss-select')].filter(visible).forEach((element, index) => {
      const style = getComputedStyle(element);
      text.push({ name: `control-text:${name(element, index)}`, foreground: style.color, background: ownBackground(element) });
    });

    const boundary = [];
    const boundarySelector = '.ss-input, .ss-select, .ss-button, .ss-file-label, .ss-theme, .ss-option, .ss-check, .ss-check-group, .ss-check input[type="checkbox"]';
    [...document.querySelectorAll(boundarySelector)].filter(visible).forEach((element, index) => {
      const style = getComputedStyle(element);
      boundary.push({ name: name(element, index), foreground: style.borderTopColor, background: outsideBackground(element) });
      if (element.matches('input[type="checkbox"]')) {
        const previous = element.checked;
        element.checked = true;
        const checkedStyle = getComputedStyle(element);
        boundary.push({ name: `checked:${name(element, index)}`, foreground: checkedStyle.backgroundColor, background: outsideBackground(element) });
        element.checked = previous;
      }
    });

    const focus = [];
    const focusSelector = '.ss-input, .ss-select, .ss-button, .ss-file-label, .ss-theme, .ss-option, .ss-check input[type="checkbox"]';
    [...document.querySelectorAll(focusSelector)].filter(visible).forEach((element, index) => {
      let measured = element;
      if (element.matches('.ss-file-label')) {
        const input = document.getElementById(element.htmlFor);
        if (input) input.focus({ preventScroll: true });
      } else {
        element.focus({ preventScroll: true });
      }
      const style = getComputedStyle(measured);
      focus.push({ name: name(element, index), foreground: style.outlineColor, background: outsideBackground(measured), width: parseFloat(style.outlineWidth) || 0 });
    });
    return {
      text,
      boundary,
      focus,
      actions: {
        primary: document.querySelectorAll('.ss-button:not(.ss-button-secondary), .ss-option').length,
        secondary: document.querySelectorAll('.ss-button-secondary, .ss-file-label, .ss-theme').length,
        checkboxes: document.querySelectorAll('.ss-check input[type="checkbox"]').length,
      },
    };
  });
}

for (const app of APPS) {
  for (const width of [320, 375]) {
    for (const theme of ['light', 'dark']) {
      test(`${app.id} reflows at ${width}px, 200% and ${theme} with clean local resources`, async ({ browser }) => {
        const context = await browser.newContext({ viewport: { width, height: 812 } });
        const page = await context.newPage();
        const runtime = observe(page);
        const response = await page.goto(app.route, { waitUntil: 'networkidle' });
        expect(response.status()).toBe(200);
        await page.evaluate((selectedTheme) => { document.documentElement.dataset.theme = selectedTheme; }, theme);
        await expect(page.locator('[data-sw-security-app]')).toBeVisible();
        const colors = await page.locator('.ss-card').first().evaluate((element) => {
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
}

test('all seven routes meet computed text, component-boundary and focus contrast in explicit and system themes', async ({ browser }) => {
  test.setTimeout(180000);
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const minima = { text: Infinity, boundary: Infinity, focus: Infinity, focusWidth: Infinity };
  for (const app of APPS) {
    for (const variant of THEME_VARIANTS) {
      await page.goto(app.route, { waitUntil: 'networkidle' });
      await applyTheme(page, variant);
      const audits = [await collectInteractiveContrast(page)];
      if (app.type === 'standard') {
        await page.locator('button[type="submit"]').click();
        audits.push(await collectInteractiveContrast(page));
      } else if (app.type === 'password') {
        await page.locator('#password').fill('CorrectHorseBatteryStaple!9');
        audits.push(await collectInteractiveContrast(page));
      } else {
        await page.locator('[data-quiz-begin]').click();
        audits.push(await collectInteractiveContrast(page));
        await page.locator('.ss-option').first().evaluate((button) => button.click());
        audits.push(await collectInteractiveContrast(page));
      }
      for (const audit of audits) {
        expect(audit.actions.secondary, `${app.id}/${variant.name} must expose a secondary action`).toBeGreaterThan(0);
        for (const sample of audit.text) {
          const ratio = contrast(sample.foreground, sample.background);
          minima.text = Math.min(minima.text, ratio);
          expect(ratio, `${app.id}/${variant.name} text ${sample.name}`).toBeGreaterThanOrEqual(4.5);
        }
        for (const sample of audit.boundary) {
          const ratio = contrast(sample.foreground, sample.background);
          minima.boundary = Math.min(minima.boundary, ratio);
          expect(ratio, `${app.id}/${variant.name} boundary ${sample.name}`).toBeGreaterThanOrEqual(3);
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
  console.log(`SW_SECURITY_CONTRAST_MINIMA ${JSON.stringify({ text: Number(minima.text.toFixed(2)), boundary: Number(minima.boundary.toFixed(2)), focus: Number(minima.focus.toFixed(2)), focusWidth: minima.focusWidth })}`);
  await context.close();
});

async function exportAndReopen(page, app) {
  const copied = page.waitForFunction(() => navigator.clipboard.readText().then((text) => text.includes('afrotools.sw-security-plan.v1')));
  await page.locator('[data-security-action="copy"]').click();
  await copied;
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(app.id);

  const txtPromise = page.waitForEvent('download');
  await page.locator('[data-security-action="txt"]').click();
  const txtDownload = await txtPromise;
  expect(txtDownload.suggestedFilename()).toBe(`matokeo-${app.id}-sw.txt`);
  const txt = fs.readFileSync(await txtDownload.path(), 'utf8');
  expect(txt).toContain('schema: afrotools.sw-security-plan.v1');
  expect(txt).toContain(app.id);

  const jsonPromise = page.waitForEvent('download');
  await page.locator('[data-security-action="json"]').click();
  const jsonDownload = await jsonPromise;
  expect(jsonDownload.suggestedFilename()).toBe(`matokeo-${app.id}-sw.json`);
  const jsonText = fs.readFileSync(await jsonDownload.path(), 'utf8');
  const parsed = JSON.parse(jsonText);
  expect(parsed).toMatchObject({ schema: 'afrotools.sw-security-plan.v1', locale: 'sw', app: app.id, reviewed: '2026-08-02' });

  await page.locator('[data-security-action="save"]').click();
  await expect(page.locator('[data-security-status]')).toContainText('yamehifadhiwa');
  return jsonText;
}

for (const app of APPS.filter((entry) => entry.type === 'standard')) {
  test(`${app.id} clears stale/invalid results and parses every advertised export/open path`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 900, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    const runtime = observe(page);
    await page.goto(app.route, { waitUntil: 'networkidle' });
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[data-result-headline]')).toHaveText(app.expected);
    const jsonText = await exportAndReopen(page, app);

    if (app.stale.checkbox) await page.locator(`[name="checks"][value="${app.stale.checkbox}"]`).uncheck();
    else if (app.stale.select) await page.locator(`[name="${app.stale.field}"]`).selectOption(app.stale.value);
    else await page.locator(`[name="${app.stale.field}"]`).fill(app.stale.value);
    await expect(page.locator('[data-security-results]')).toBeHidden();
    await expect(page.locator('[data-security-status]')).toContainText('matokeo ya zamani yamefutwa');

    await page.locator('[data-security-import]').setInputFiles({ name: `matokeo-${app.id}-sw.json`, mimeType: 'application/json', buffer: Buffer.from(jsonText) });
    await expect(page.locator('[data-result-headline]')).toHaveText(app.expected);
    await expect(page.locator('[data-security-status]')).toContainText('JSON imefunguliwa');

    if (app.stale.checkbox) await page.locator(`[name="checks"][value="${app.stale.checkbox}"]`).uncheck();
    else if (app.stale.select) await page.locator(`[name="${app.stale.field}"]`).selectOption(app.stale.value);
    else await page.locator(`[name="${app.stale.field}"]`).fill(app.stale.value);
    await page.locator('[data-security-action="open"]').click();
    await expect(page.locator('[data-result-headline]')).toHaveText(app.expected);
    await expect(page.locator('[data-security-status]')).toContainText('imefunguliwa');

    await page.evaluate(({ field, value }) => {
      const control = document.querySelector(`[name="${field}"]`);
      control.value = value;
      control.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }, app.invalid);
    await expect(page.locator('[data-security-error]')).toContainText(app.invalid.message);
    await expect(page.locator('[data-security-results]')).toBeHidden();
    await page.locator('[data-security-action="delete"]').click();
    await expect(page.locator('[data-security-status]')).toContainText('imefutwa');
    expect(runtime.consoleErrors).toEqual([]);
    expect(runtime.externalRequests).toEqual([]);
    expect(runtime.resourceErrors).toEqual([]);
    await context.close();
  });
}

test('password stays ephemeral while input, clearing, toggle, keyboard and local-only behavior work', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const runtime = observe(page);
  await page.goto('/sw/zana/nguvu-ya-nenosiri/', { waitUntil: 'networkidle' });
  const secret = 'CorrectHorseBatteryStaple!9';
  await page.locator('#password').fill(secret);
  await expect(page.locator('[data-result-headline]')).toHaveText('80/100 - Imara sana');
  await page.locator('[data-password-toggle]').press('Enter');
  await expect(page.locator('#password')).toHaveAttribute('type', 'text');
  expect(await page.evaluate((value) => Object.values(localStorage).some((stored) => stored.includes(value)), secret)).toBe(false);
  expect(page.url()).not.toContain(encodeURIComponent(secret));
  await expect(page.locator('[data-security-action]')).toHaveCount(0);
  await page.locator('#password').fill('');
  await expect(page.locator('[data-security-results]')).toBeHidden();
  await expect(page.locator('[data-security-status]')).toContainText('Weka mfano');
  expect(runtime.consoleErrors).toEqual([]);
  expect(runtime.externalRequests).toEqual([]);
  expect(runtime.resourceErrors).toEqual([]);
  await context.close();
});

test('phishing quiz parses all exports, clears stale result, and reopens imported/saved answers', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const runtime = observe(page);
  await page.goto('/sw/zana/jaribio-la-kutambua-hadaa/', { waitUntil: 'networkidle' });
  await page.locator('[data-quiz-begin]').click();
  for (let index = 0; index < 10; index += 1) {
    const scenario = await page.locator('.ss-scenario').innerText();
    const answer = await page.evaluate((text) => {
      const question = window.AfroTools.SwSecurityParity.QUESTIONS.find((item) => text.includes(item.type));
      return question.answer;
    }, scenario);
    await page.locator(`[data-quiz-answer="${answer}"]`).click();
    await page.locator('[data-quiz-next]').click();
  }
  await expect(page.locator('[data-result-headline]')).toHaveText('10/10 - Matokeo thabiti');
  const jsonText = await exportAndReopen(page, APPS.find((entry) => entry.id === 'phishing-quiz'));
  await page.locator('[data-quiz-restart]').click();
  await expect(page.locator('[data-security-results]')).toBeHidden();
  await page.locator('[data-security-import]').setInputFiles({ name: 'matokeo-phishing-quiz-sw.json', mimeType: 'application/json', buffer: Buffer.from(jsonText) });
  await expect(page.locator('[data-result-headline]')).toHaveText('10/10 - Matokeo thabiti');
  await page.locator('[data-quiz-restart]').click();
  await page.locator('[data-security-action="open"]').click();
  await expect(page.locator('[data-result-headline]')).toHaveText('10/10 - Matokeo thabiti');
  expect(runtime.consoleErrors).toEqual([]);
  expect(runtime.externalRequests).toEqual([]);
  expect(runtime.resourceErrors).toEqual([]);
  await context.close();
});

test('all Security apps expose labels, skip focus, status, canonical, artwork and complete language metadata', async ({ page }) => {
  for (const app of APPS) {
    await page.goto(app.route, { waitUntil: 'networkidle' });
    const unlabeled = await page.evaluate(() => [...document.querySelectorAll('input:not([type="hidden"]), select, button')]
      .filter((control) => control.matches('button') ? !control.textContent.trim() && !control.getAttribute('aria-label') : !control.labels || control.labels.length === 0)
      .map((control) => control.id || control.name || control.tagName));
    expect(unlabeled).toEqual([]);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement.matches('.ss-skip'))).toBe(true);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${app.route}`);
    for (const code of ['en', 'fr', 'sw', 'x-default']) await expect(page.locator(`link[rel="alternate"][hreflang="${code}"]`)).toHaveCount(1);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://afrotools.com${app.route}`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/assets\/img\/tools\/[^/]+\.webp$/);
    await expect(page.locator('.ss-artwork img')).toBeVisible();
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThanOrEqual(2);
    await expect(page.locator('[data-security-status][role="status"]')).toHaveCount(1);
    await page.locator('[data-security-theme]').press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('iframe')).toHaveCount(0);
  }
});
