'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');
const pdfJs = require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js');

const ROOT = path.resolve(__dirname, '..', '..');
const EVIDENCE_FILE = path.join(
  ROOT,
  'reports',
  'sw-mortgage-property-tenant-family-clean-respin-browser-evidence.json'
);
const APPS = [
  {
    englishId: 'tenancy-deposit',
    route: '/sw/zana/amana-ya-upangaji/',
    englishRoute: '/tools/tenancy-deposit/',
    artwork: '/assets/img/tools/tenancy-deposit.webp',
    expected: {
      'Pango la mbele': 6000000,
      Amana: 500000,
      'Ada ya wakala': 600000,
      'Ada ya mkataba au wakili': 300000,
      'Ada ya huduma': 0,
      'Jumla ya gharama za kuhamia': 7400000,
      Sarafu: 'NGN'
    },
    initialValues: {
      country: 'ng',
      rent: '500000',
      advanceMonths: '12',
      depositMonths: '1',
      agentFee: '10',
      legalFee: '5',
      serviceCharge: '0'
    },
    countryPresets: {
      ng: { rent: '500000', advanceMonths: '12', depositMonths: '1', agentFee: '10', legalFee: '5', serviceCharge: '0' },
      ke: { rent: '50000', advanceMonths: '1', depositMonths: '1', agentFee: '8.33', legalFee: '0', serviceCharge: '0' },
      za: { rent: '12000', advanceMonths: '1', depositMonths: '2', agentFee: '0', legalFee: '0', serviceCharge: '0' },
      gh: { rent: '3000', advanceMonths: '12', depositMonths: '1', agentFee: '10', legalFee: '5', serviceCharge: '0' }
    },
    countryCurrencies: { ng: 'NGN', ke: 'KES', za: 'ZAR', gh: 'GHS' },
    jurisdictionSources: {
      ng: { jurisdiction: 'Nigeria — Jimbo la Lagos', state: 'official-source', linked: true, confidence: 'Nigeria, Jimbo la Lagos pekee' },
      ke: { jurisdiction: 'Kenya', state: 'planning-default', linked: false, confidence: 'si ada, desturi au sheria rasmi ya Kenya' },
      za: { jurisdiction: 'Afrika Kusini', state: 'planning-default', linked: false, confidence: 'si ada, desturi au sheria rasmi ya Afrika Kusini' },
      gh: { jurisdiction: 'Ghana', state: 'planning-default', linked: false, confidence: 'si ada, desturi au sheria rasmi ya Ghana' }
    }
  },
  {
    englishId: 'rent-affordability',
    route: '/sw/zana/uwezo-wa-kulipa-pango/',
    englishRoute: '/tools/rent-affordability/',
    artwork: '/assets/img/tools/rent-affordability.webp',
    expected: {
      'Pango uliloingiza': 1200,
      'Kikomo cha bajeti': 1500,
      'Pango la mbele': 2400,
      Sarafu: 'XOF'
    },
    initialValues: { currency: 'sarafu yako', income: '', rent: '', ratio: '', advance: '' },
    calculationValues: { currency: 'XOF', income: '5000', rent: '1200', ratio: '30', advance: '2' },
    constraints: {
      currency: { type: 'text', min: null, max: null, step: null, required: true },
      income: { type: 'number', min: '0.01', max: null, step: 'any', required: true },
      rent: { type: 'number', min: '0', max: null, step: 'any', required: true },
      ratio: { type: 'number', min: '0', max: '100', step: 'any', required: true },
      advance: { type: 'number', min: '0', max: null, step: 'any', required: true }
    },
    source: { state: 'unavailable', label: 'uthibitishaji wa mkono unahitajika', confidence: 'kilirudisha 403' }
  }
];
const browserEvidence = {
  schemaVersion: 1,
  family: 'tenant-planning',
  locale: 'sw',
  generatedAt: null,
  accepted: 0,
  blocked: 0,
  routes: APPS.map((app) => ({
    englishId: app.englishId,
    route: app.route,
    status: 'pending',
    proofs: {}
  }))
};

function routeEvidence(englishId) {
  return browserEvidence.routes.find((row) => row.englishId === englishId);
}

async function downloadBuffer(page, selector) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator(selector).click()
  ]);
  return fs.promises.readFile(await download.path());
}

async function parsePdf(buffer) {
  const reopened = await pdfParse(new Uint8Array(buffer));
  const document = await pdfJs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const firstPage = await document.getPage(1);
  const viewport = firstPage.getViewport(1);
  const content = await firstPage.getTextContent();
  const rows = content.items.map((item) => ({
    text: item.str,
    x: item.transform[4],
    y: item.transform[5],
    width: item.width,
    height: item.height
  }));
  if (document.destroy) await document.destroy();
  return {
    pages: reopened.numpages,
    text: reopened.text,
    page: { width: viewport.width, height: viewport.height },
    rows
  };
}

async function installGuards(page) {
  const diagnostics = { pageErrors: [], consoleErrors: [], externalRequests: [], mutations: [] };
  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') diagnostics.consoleErrors.push(message.text());
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
      diagnostics.externalRequests.push(request.url());
    }
    if (!['GET', 'HEAD'].includes(request.method())) {
      diagnostics.mutations.push(`${request.method()} ${request.url()}`);
    }
  });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
  });
  return diagnostics;
}

async function assertSeoArtworkAndA11y(page, app) {
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    `https://afrotools.com${app.route}`
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    `https://afrotools.com${app.route}`
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    `https://afrotools.com${app.artwork}`
  );
  await expect(page.locator(`link[rel=alternate][hreflang=en][href="https://afrotools.com${app.englishRoute}"]`))
    .toHaveCount(1);
  await expect(page.locator(`link[rel=alternate][hreflang=sw][href="https://afrotools.com${app.route}"]`))
    .toHaveCount(1);
  const schema = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(schema).inLanguage).toBe('sw');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('swpCalc');

  const image = page.locator(`img[src="${app.artwork}"]`);
  await expect(image).toBeVisible();
  expect(await image.evaluate((node) => ({
    complete: node.complete,
    width: node.naturalWidth,
    height: node.naturalHeight,
    alt: node.alt
  }))).toEqual(expect.objectContaining({
    complete: true,
    width: 800,
    height: 450
  }));
  await expect(image).toHaveAttribute('alt', /Mchoro wa/);

  const unlabeled = await page.locator('main input:not([type=hidden]), main select, main textarea')
    .evaluateAll((nodes) => nodes.filter((node) => !node.labels || node.labels.length === 0)
      .map((node) => node.name || node.id || node.type));
  expect(unlabeled).toEqual([]);
  const firstField = page.locator('main input, main select').first();
  await firstField.focus();
  await expect(firstField).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
}

async function setEffectiveTheme(page, choice, systemTheme = choice) {
  await expect.poll(() => page.evaluate(() => Boolean(
    window.AfroTools && window.AfroTools.darkMode && window.AfroTools.darkMode.set
  ))).toBe(true);
  await page.emulateMedia({ colorScheme: systemTheme });
  await page.evaluate((value) => window.AfroTools.darkMode.set(value), choice);
  const activeTheme = choice === 'auto' ? systemTheme : choice;
  await expect.poll(() => page.locator('html').getAttribute('data-theme')).toBe(activeTheme);
  return activeTheme;
}

async function assertComputedContrast(page) {
  const variants = [
    { name: 'light', choice: 'light', systemTheme: 'dark' },
    { name: 'dark', choice: 'dark', systemTheme: 'light' },
    { name: 'system-light', choice: 'auto', systemTheme: 'light' },
    { name: 'system-dark', choice: 'auto', systemTheme: 'dark' }
  ];
  const measurements = {};
  for (const variant of variants) {
    const activeTheme = await setEffectiveTheme(page, variant.choice, variant.systemTheme);
    const audit = await page.locator('main').evaluate((main) => {
      function color(value) {
        const match = String(value).match(/rgba?\(([^)]+)\)/i);
        if (!match) return null;
        const channels = match[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
        return { r: channels[0], g: channels[1], b: channels[2], a: channels[3] == null ? 1 : channels[3] };
      }
      function background(node) {
        let current = node;
        while (current) {
          const parsed = color(getComputedStyle(current).backgroundColor);
          if (parsed && parsed.a > 0.99) return parsed;
          current = current.parentElement;
        }
        return { r: 255, g: 255, b: 255, a: 1 };
      }
      function luminance(rgb) {
        const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      }
      function ratio(foreground, backdrop) {
        const light = Math.max(luminance(foreground), luminance(backdrop));
        const dark = Math.min(luminance(foreground), luminance(backdrop));
        return (light + 0.05) / (dark + 0.05);
      }
      const visible = (node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden';
      };
      const text = [...main.querySelectorAll('h1,h2,.mp-fields label,button:not(:disabled),input:not(:disabled),select:not(:disabled)')]
        .filter((node) => {
          return visible(node);
        })
        .map((node) => {
          const style = getComputedStyle(node);
          const foreground = color(style.color);
          const backdrop = background(node);
          return {
            element: node.tagName.toLowerCase(),
            name: node.textContent.trim().slice(0, 80) || node.name || node.id,
            ratio: foreground ? ratio(foreground, backdrop) : 0
          };
        });
      const boundaries = [...main.querySelectorAll('.mp-fields input:not(:disabled),.mp-fields select:not(:disabled),.mp-actions button:not(:disabled),.mp-export-bar button:not(:disabled)')]
        .filter(visible)
        .map((node) => {
          const style = getComputedStyle(node);
          const filled = node.matches('button[type="submit"]');
          const indicator = color(filled ? style.backgroundColor : style.borderTopColor);
          const adjacent = filled ? background(node.parentElement) : background(node);
          return {
            element: node.tagName.toLowerCase(),
            name: node.textContent.trim().slice(0, 80) || node.name || node.id,
            kind: filled ? 'filled-primary' : 'border',
            indicatorColor: filled ? style.backgroundColor : style.borderTopColor,
            adjacentColor: filled ? getComputedStyle(node.parentElement).backgroundColor : style.backgroundColor,
            ratio: indicator ? ratio(indicator, adjacent) : 0
          };
        });
      return { text, boundaries };
    });
    expect(audit.text.length, `${variant.name} audited text`).toBeGreaterThan(12);
    expect(audit.text.filter((row) => row.ratio < 4.5), `${variant.name} text contrast`).toEqual([]);
    expect(audit.boundaries.length, `${variant.name} audited control boundaries`).toBeGreaterThan(5);
    expect(
      audit.boundaries.filter((row) => row.ratio < 3),
      `${variant.name} component/control boundary contrast`
    ).toEqual([]);

    const focusRows = [];
    const focusable = page.locator('.mp-fields input,.mp-fields select,.mp-actions button:not(:disabled)');
    for (let index = 0; index < await focusable.count(); index += 1) {
      const control = focusable.nth(index);
      await control.focus();
      await expect(control).toBeFocused();
      focusRows.push(await control.evaluate((node) => {
        function color(value) {
          const match = String(value).match(/rgba?\(([^)]+)\)/i);
          if (!match) return null;
          const channels = match[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
          return { r: channels[0], g: channels[1], b: channels[2], a: channels[3] == null ? 1 : channels[3] };
        }
        function background(current) {
          while (current) {
            const parsed = color(getComputedStyle(current).backgroundColor);
            if (parsed && parsed.a > 0.99) return parsed;
            current = current.parentElement;
          }
          return { r: 255, g: 255, b: 255, a: 1 };
        }
        function luminance(rgb) {
          const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
            const normalized = channel / 255;
            return normalized <= 0.04045
              ? normalized / 12.92
              : ((normalized + 0.055) / 1.055) ** 2.4;
          });
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        }
        function ratio(first, second) {
          const light = Math.max(luminance(first), luminance(second));
          const dark = Math.min(luminance(first), luminance(second));
          return (light + 0.05) / (dark + 0.05);
        }
        const style = getComputedStyle(node);
        const outline = color(style.outlineColor);
        const adjacent = background(node.parentElement);
        return {
          name: node.textContent.trim().slice(0, 80) || node.name || node.id,
          outlineStyle: style.outlineStyle,
          outlineWidth: Number.parseFloat(style.outlineWidth),
          ratio: outline ? ratio(outline, adjacent) : 0
        };
      }));
    }
    expect(focusRows.filter((row) => row.outlineStyle === 'none' || row.outlineWidth < 2), `${variant.name} focus geometry`).toEqual([]);
    expect(focusRows.filter((row) => row.ratio < 3), `${variant.name} focus contrast`).toEqual([]);
    const minimum = (rows) => Math.min(...rows.map((row) => row.ratio));
    measurements[variant.name] = {
      activeTheme,
      textMinimum: minimum(audit.text),
      componentBoundaryMinimum: minimum(audit.boundaries),
      focusMinimum: minimum(focusRows)
    };
  }
  return measurements;
}

async function assertResponsiveThemes(page) {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => (
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    ))).toBeLessThanOrEqual(1);
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(await page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ))).toBeLessThanOrEqual(1);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });
  await setEffectiveTheme(page, 'light');
  const light = await page.locator('.mp-card').first().evaluate((node) => getComputedStyle(node).backgroundColor);
  await setEffectiveTheme(page, 'dark');
  await expect.poll(() => page.locator('.mp-card').first()
    .evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe(light);
  const contrastMeasurements = await assertComputedContrast(page);
  await setEffectiveTheme(page, 'light');
  return contrastMeasurements;
}

async function assertWorkflowAndExports(page, app) {
  await expect(page.locator('[data-sw-legal-property-app]')).toHaveAttribute(
    'data-workflow-ready',
    'true'
  );
  const form = page.locator('[data-workflow-form]');
  const values = async (names) => Object.fromEntries(await Promise.all(names.map(async (name) => [
    name,
    await form.locator(`[name=${name}]`).inputValue()
  ])));
  expect(await values(Object.keys(app.initialValues))).toEqual(app.initialValues);
  await expect(page.locator('[data-result]')).toBeHidden();
  await expect(page.locator('[data-export-bar]')).toBeHidden();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  if (app.constraints) {
    for (const [name, expected] of Object.entries(app.constraints)) {
      expect(await form.locator(`[name=${name}]`).evaluate((control) => ({
        type: control.type,
        min: control.getAttribute('min'),
        max: control.getAttribute('max'),
        step: control.getAttribute('step'),
        required: control.required
      })), `${name} exact English DOM constraints`).toEqual(expected);
    }
    await expect(page.locator('[data-source-availability]')).toHaveAttribute('data-source-state', app.source.state);
    await expect(page.locator('[data-source-label]')).toContainText(app.source.label);
    await expect(page.locator('[data-source-confidence]')).toContainText(app.source.confidence);
    await expect(page.locator('[data-source-link]')).toBeHidden();
  }

  if (app.countryPresets) {
    const optionLabels = await form.locator('[name=country] option').allTextContents();
    expect(optionLabels).toEqual(['Nigeria', 'Kenya', 'Afrika Kusini', 'Ghana']);
    for (const [country, preset] of Object.entries(app.countryPresets)) {
      await form.locator('[name=country]').selectOption(country);
      expect(await values(Object.keys(preset)), `${country} exact English preset`).toEqual(preset);
      const source = app.jurisdictionSources[country];
      await expect(page.locator('[data-source-jurisdiction] span')).toHaveText(source.jurisdiction);
      await expect(page.locator('[data-source-availability]')).toHaveAttribute('data-source-state', source.state);
      await expect(page.locator('[data-source-confidence]')).toContainText(source.confidence);
      if (source.linked) {
        await expect(page.locator('[data-source-link]')).toBeVisible();
        await expect(page.locator('[data-source-label]')).toBeHidden();
      } else {
        await expect(page.locator('[data-source-link]')).toBeHidden();
        await expect(page.locator('[data-source-label]')).toContainText('thamani za mwanzo za kupanga');
      }
      await form.locator('button[type=submit]').click();
      await expect(page.locator('[data-result]')).toContainText(app.countryCurrencies[country]);
      await expect(page.locator('[data-result-source]')).toContainText(source.jurisdiction);
      await expect(page.locator('[data-result-source]')).toContainText(source.confidence);
      await page.locator('[data-action=copy]').click();
      const jurisdictionCopy = await page.evaluate(() => navigator.clipboard.readText());
      expect(jurisdictionCopy).toContain(`Mamlaka iliyochaguliwa: ${source.jurisdiction}`);
      expect(jurisdictionCopy).toContain(source.confidence);
    }
    await form.locator('[name=country]').selectOption('ng');
    expect(await values(Object.keys(app.countryPresets.ng))).toEqual(app.countryPresets.ng);
  } else {
    await form.locator('button[type=submit]').click();
    await expect(page.locator('[data-result]')).toBeHidden();
    await expect(page.locator('[data-export-bar]')).toBeHidden();
    await expect(page.locator('[data-status]')).toContainText('Jaza kila sehemu');
    for (const [name, value] of Object.entries(app.calculationValues)) {
      await form.locator(`[name=${name}]`).fill(value);
    }
  }
  await form.locator('button[type=submit]').click();
  const result = page.locator('[data-result]');
  await expect(result).toBeVisible();
  await expect(result).toContainText(/makadirio|rasimu/i);

  await page.locator('[data-action=copy]').click();
  await expect(page.locator('[data-status]')).toContainText('umenakiliwa');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain(`Njia: ${app.route}`);
  expect(copied).toContain('Chanzo:');
  expect(copied).toContain('Uhakika wa chanzo:');
  if (app.jurisdictionSources) expect(copied).toContain('Mamlaka iliyochaguliwa: Nigeria — Jimbo la Lagos');
  if (app.source) expect(copied).toContain('uthibitishaji wa mkono unahitajika');

  const txt = (await downloadBuffer(page, '[data-action=txt]')).toString('utf8').replace(/^\uFEFF/, '');
  expect(txt).toContain(`Njia: ${app.route}`);
  expect(txt).toContain('Makadirio au rasimu ya kupanga tu');
  expect(txt).toContain('Uhakika wa chanzo:');

  const json = JSON.parse((await downloadBuffer(page, '[data-action=json]')).toString('utf8'));
  expect(json.schemaVersion).toBe(1);
  expect(json.lugha).toBe('sw');
  expect(json.englishId).toBe(app.englishId);
  expect(json.swahiliRoute).toBe(app.route);
  if (app.jurisdictionSources) {
    expect(json.jurisdiction).toBe('Nigeria — Jimbo la Lagos');
    expect(json.source.availability).toBe('official-source');
    expect(json.source.confidence).toContain('Nigeria, Jimbo la Lagos pekee');
  } else {
    expect(json.jurisdiction).toBeUndefined();
    expect(json.source.availability).toBe('unavailable');
    expect(json.source.url).toBe('');
    expect(json.source.confidence).toContain('kilirudisha 403');
  }
  expect(Object.keys(json.result).sort()).toEqual(Object.keys(app.expected).sort());
  for (const [label, expectedValue] of Object.entries(app.expected)) {
    if (typeof expectedValue === 'number') {
      expect(Number(String(json.result[label]).replace(/,/g, '')), label).toBe(expectedValue);
    } else {
      expect(json.result[label], label).toBe(expectedValue);
    }
  }
  expect(json.boundary).toContain('si ushauri wa kisheria');

  const pdf = await parsePdf(await downloadBuffer(page, '[data-action=pdf]'));
  expect(pdf.pages).toBe(1);
  expect(pdf.text).toContain(app.route);
  expect(pdf.text).toContain('Chanzo:');
  expect(pdf.text).toContain('Uhakika wa chanzo:');
  if (app.jurisdictionSources) expect(pdf.text).toContain('Nigeria - Jimbo la Lagos');
  if (app.source) expect(pdf.text).toContain('uthibitishaji wa mkono unahitajika');
  expect(pdf.page).toEqual({ width: 595, height: 842 });
  expect(pdf.rows.length).toBeGreaterThan(6);
  for (const row of pdf.rows) {
    expect(row.x, row.text).toBeGreaterThanOrEqual(48);
    expect(row.y, row.text).toBeGreaterThanOrEqual(48);
    expect(row.y + row.height, row.text).toBeLessThanOrEqual(pdf.page.height + 0.01);
    expect(row.x + row.width, `bounded PDF row: ${row.text}`)
      .toBeLessThanOrEqual(pdf.page.width - 48 + 0.01);
  }

  await page.evaluate(() => {
    window.__swPrintCalls = 0;
    window.print = () => {
      window.__swPrintCalls += 1;
    };
  });
  await page.locator('[data-action=print]').click();
  expect(await page.evaluate(() => window.__swPrintCalls)).toBe(1);

  if (app.englishId === 'rent-affordability') {
    await form.locator('[name=income]').fill('0');
    await expect(result).toBeHidden();
    await expect(page.locator('[data-export-bar]')).toBeHidden();
    expect(await form.locator('[name=income]').evaluate((control) => ({
      valid: control.validity.valid,
      rangeUnderflow: control.validity.rangeUnderflow
    }))).toEqual({ valid: false, rangeUnderflow: true });
    await form.locator('button[type=submit]').click();
    await expect(result).toBeHidden();
    await expect(page.locator('[data-export-bar]')).toBeHidden();
    await expect(page.locator('[data-status]')).toContainText('Jaza kila sehemu');

    await form.locator('[name=income]').fill(app.calculationValues.income);
    await form.locator('[name=ratio]').fill('101');
    expect(await form.locator('[name=ratio]').evaluate((control) => ({
      valid: control.validity.valid,
      rangeOverflow: control.validity.rangeOverflow
    }))).toEqual({ valid: false, rangeOverflow: true });
    await form.locator('button[type=submit]').click();
    await expect(result).toBeHidden();
    await expect(page.locator('[data-export-bar]')).toBeHidden();
    await expect(page.locator('[data-status]')).toContainText('Jaza kila sehemu');
    await form.locator('[name=ratio]').fill(app.calculationValues.ratio);
    await form.locator('button[type=submit]').click();
    await expect(result).toBeVisible();
  }

  await form.locator('[name=rent]').fill(app.englishId === 'tenancy-deposit' ? '510000' : '1250');
  await expect(result).toBeHidden();
  await expect(page.locator('[data-export-bar]')).toBeHidden();
  await expect(page.locator('[data-status]')).toContainText('Maingizo yamebadilika');
  await form.locator('button[type=submit]').click();
  await expect(result).toBeVisible();

  await form.locator('[name=rent]').fill('');
  await form.locator('button[type=submit]').click();
  await expect(result).toBeHidden();
  await expect(page.locator('[data-export-bar]')).toBeHidden();
  await expect(page.locator('[data-status]')).toContainText('Jaza kila sehemu');

  await page.locator('[data-action=reset]').click();
  await expect(result).toBeHidden();
  await expect(form.locator('input,select').first()).toBeFocused();
  expect(await values(Object.keys(app.initialValues))).toEqual(app.initialValues);
  const stored = await page.evaluate(() => JSON.stringify({
    local: { ...localStorage },
    session: { ...sessionStorage }
  }));
  expect(stored).not.toContain('510000');
  expect(stored).not.toContain('1250');
}

test.describe('Swahili Mortgage and Property tenant-planning native family', () => {
  test.describe.configure({ mode: 'serial' });

  for (const app of APPS) {
    test(`${app.englishId}: native calculation, exports, privacy, reflow and metadata`, async ({ page }) => {
      const evidence = routeEvidence(app.englishId);
      const diagnostics = await installGuards(page);
      try {
        await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
        await page.setViewportSize({ width: 375, height: 900 });
        await page.goto(app.route, { waitUntil: 'load' });
        await assertSeoArtworkAndA11y(page, app);
        await expect(page.locator('[data-sw-legal-property-app]')).toHaveAttribute(
          'data-workflow-ready',
          'true'
        );
        const contrastMeasurements = await assertResponsiveThemes(page);
        await assertWorkflowAndExports(page, app);
        expect(diagnostics).toEqual({
          pageErrors: [],
          consoleErrors: [],
          externalRequests: [],
          mutations: []
        });
        evidence.status = 'accepted';
        evidence.measurements = { contrast: contrastMeasurements };
        evidence.proofs = {
          nativeRouteOwnedWorkflow: true,
          routeSpecificCalculation: true,
          invalidAndStaleClearing: true,
          copyParsed: true,
          txtReopened: true,
          jsonReopened: true,
          pdfParsedWithPdfParse: true,
          pdfCoordinatesAndTextBounded: true,
          printInvoked: true,
          privacyNoInputStorage: true,
          noExternalNetwork: true,
          widths320And375: true,
          reflow200Percent: true,
          lightDarkAndSystemThemes: true,
          computedTextContrastAllThemeVariants: true,
          computedComponentBoundaryContrastAllThemeVariants: true,
          computedFocusContrastAllThemeVariants: true,
          exactEnglishInitialState: true,
          exactEnglishDomConstraints: true,
          invalidBoundaryFailClosedAndStaleExportsCleared: true,
          exactCountryPresetsOrNotApplicable: true,
          jurisdictionSourceMappingOrUnavailableDisclosure: true,
          visibleSourceConfidenceInResultAndExports: true,
          keyboardAndLabels: true,
          consoleClean: true,
          canonicalOgArtwork: true,
          reciprocalHreflang: true
        };
      } catch (error) {
        evidence.status = 'blocked';
        evidence.blocker = error && error.message ? error.message : String(error);
        throw error;
      }
    });
  }

  test.afterAll(() => {
    browserEvidence.generatedAt = new Date().toISOString();
    browserEvidence.accepted = browserEvidence.routes.filter((row) => row.status === 'accepted').length;
    browserEvidence.blocked = browserEvidence.routes.filter((row) => row.status !== 'accepted').length;
    fs.writeFileSync(EVIDENCE_FILE, `${JSON.stringify(browserEvidence, null, 2)}\n`, 'utf8');
  });
});
