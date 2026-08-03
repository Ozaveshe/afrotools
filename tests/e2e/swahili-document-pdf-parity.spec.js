const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { PDFDocument, StandardFonts } = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');
const { apps: exportApps } = require('../../scripts/build-swahili-document-pdf-parity.js');
const config = {
  apps: [
    {
      id: 'document-pdf',
      swahiliRoute: '/sw/hati-na-pdf/',
      sensitive: false,
      requiresConsent: false
    },
    ...exportApps.map((row) => ({
      id: row.id,
      swahiliRoute: row.swahiliRoute,
      sensitive: row.sensitive === true,
      requiresConsent: row.requiresConsent === true
    }))
  ]
};
const requestedIds = new Set(
  String(process.env.SW_DOCUMENT_PDF_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
);
const selectedApps = requestedIds.size
  ? config.apps.filter((app) => requestedIds.has(app.id))
  : config.apps;
const selectedIds = new Set(selectedApps.map((app) => app.id));
const unknownIds = Array.from(requestedIds).filter((id) => !config.apps.some((app) => app.id === id));
if (unknownIds.length) throw new Error(`Unknown SW_DOCUMENT_PDF_IDS: ${unknownIds.join(', ')}`);

test.describe.configure({ mode: 'default' });
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

const receipts = new Map();
const stateChecks = new Map();
const stateCheckApps = new Set([
  'pdf-merge-split', 'pdf-compress', 'pdf-ocr', 'pdf-chat',
  'pdf-compare', 'meeting-minutes', 'receipt-generator', 'business-plan'
]);
const visibleLanguageIds = new Set([
  'pdf-workspace', 'pdf-merge-split', 'pdf-image-convert', 'pdf-watermark',
  'pdf-password', 'pdf-page-numbers', 'pdf-ocr', 'pdf-form-filler',
  'pdf-redact', 'pdf-header-footer', 'pdf-convert', 'pdf-reorder',
  'pdf-translate', 'pdf-compare', 'pdf-to-audio', 'pdf-bates',
  'html-to-pdf', 'pdf-find-replace', 'pdf-repair', 'pdf-workflow',
  'cv-builder', 'invoice-generator', 'cover-letter', 'freelance-invoice'
]);

async function staleFixture(label, pages = 2) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  for (let index = 0; index < pages; index += 1) {
    const page = document.addPage([420, 594]);
    page.drawText(`${label} page ${index + 1}`, { x: 42, y: 520, size: 16, font });
  }
  return Buffer.from(await document.save({ useObjectStreams: false }));
}

test.beforeAll(() => {
  expect(config.apps).toHaveLength(32);
  expect(config.apps.filter((app) => app.id !== 'document-pdf' && !app.sensitive)).toHaveLength(24);
  expect(config.apps.filter((app) => app.sensitive)).toHaveLength(7);
});

test.afterAll(() => {
  if (requestedIds.size) return;
  const rows = config.apps.map((app) => {
    const receipt = receipts.get(app.id);
    const requiredStateChecks = stateCheckApps.has(app.id);
    const accepted = Boolean(receipt) && (!requiredStateChecks || stateChecks.has(app.id));
    return {
      id: app.id,
      route: app.swahiliRoute,
      accepted,
      checked: receipt?.checked || [],
      downloadContract: app.id === 'document-pdf'
        ? 'none'
        : app.sensitive ? 'sensitive-guest' : 'free-account',
      stateChecks: stateChecks.get(app.id) || [],
      noExternalRequests: receipt?.noExternalRequests === true
    };
  });
  const output = {
    schemaVersion: 2,
    locale: 'sw',
    category: 'document-pdf',
    denominator: rows.length,
    accepted: rows.filter((row) => row.accepted).length,
    generatedAt: new Date().toISOString(),
    rows
  };
  fs.writeFileSync(
    path.join(__dirname, '../../reports/swahili-document-pdf-browser-receipts.json'),
    `${JSON.stringify(output, null, 2)}\n`
  );
});

for (const app of selectedApps) {
  test(`${app.id}: native Swahili route, reflow, themes, focus, SEO and clean runtime`, async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];
    const failedSameOrigin = [];
    const externalRequests = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => {
      const url = new URL(request.url());
      if (['127.0.0.1', 'localhost'].includes(url.hostname)) {
        if (request.failure()?.errorText === 'net::ERR_ABORTED' && url.pathname === '/assets/fonts/typography.css') return;
        failedSameOrigin.push(`${request.method()} ${url.pathname}: ${request.failure()?.errorText || 'failed'}`);
      }
    });
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname) && !url.hostname.endsWith('afrotools.com')) {
        if (request.method() === 'GET' && /^(?:fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) return;
        externalRequests.push(`${request.method()} ${url.hostname}${url.pathname}`);
      }
    });

    await page.addInitScript(() => {
      localStorage.setItem('afrotools_cookie_consent', 'declined');
      localStorage.setItem('theme', 'light');
      localStorage.removeItem('afro_auth_v2');
      localStorage.removeItem('afro_session_v3');
      localStorage.removeItem('afro_profile_cache');
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto(app.swahiliRoute, { waitUntil: app.id === 'cv-builder' ? 'commit' : 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    if (app.id === 'cv-builder') {
      await page.waitForFunction(() => document.documentElement.dataset.swDocumentPdfLocalized === 'true');
    }

    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${app.swahiliRoute}`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', new RegExp(`/assets/img/tools/${app.id}\\.webp$`));
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'sw_TZ');
    await expect(page.locator('iframe[src^="/tools/"], iframe[src*="afrotools.com/tools/"]')).toHaveCount(0);
    await expect(page.locator('email-gate-modal')).toHaveCount(
      app.id === 'document-pdf' || app.sensitive ? 0 : 1
    );
    if (app.id === 'html-to-pdf') {
      await expect(page.locator('#htmlPreview')).toHaveAttribute('sandbox', 'allow-same-origin');
      expect(await page.locator('#htmlPreview').getAttribute('sandbox')).not.toContain('allow-scripts');
    }
    expect(await page.evaluate(() => ({
      auth: localStorage.getItem('afro_auth_v2'),
      session: localStorage.getItem('afro_session_v3'),
      profile: localStorage.getItem('afro_profile_cache')
    }))).toEqual({ auth: null, session: null, profile: null });

    if (visibleLanguageIds.has(app.id)) {
      const workflow = await page.locator('main').count() ? page.locator('main').first() : page.locator('body');
      const visibleWorkflowCopy = (await workflow.innerText())
        .replace(/\{[a-z][a-z0-9_-]*\}/gi, '');
      const englishResidue = /\b(?:the|and|with|before|after|your|this|from|into|does|what|how|can|every|should|receipt|meeting|business|plan|review|download|upload|customer|payment|seller|buyer|draft|ready|details|items|total|year|profit|revenue|costs|assumptions|generated|prepared|source|limitations|check|works|best|select|use|files|text|page|document)\b/i;
      expect(visibleWorkflowCopy, `${app.id}: no English visible runtime residue`).not.toMatch(englishResidue);
      const accessibleWorkflowCopy = (await workflow.locator('[aria-label], [placeholder], [title]').evaluateAll((elements) =>
        elements.flatMap((element) => ['aria-label', 'placeholder', 'title'].map((attribute) => element.getAttribute(attribute)).filter(Boolean)).join('\n')
      )).replace(/\{[a-z][a-z0-9_-]*\}/gi, '')
        .split('\n').filter((line) => !/[{}]/.test(line)).join('\n');
      expect(accessibleWorkflowCopy, `${app.id}: no English accessible-name residue`).not.toMatch(englishResidue);
      expect(visibleWorkflowCopy, `${app.id}: visible workflow has Swahili controls`).toMatch(/Pakia|Pakua|Hifadhi|Linganisha|Tengeneza|Fungua|Chagua|PDF|Hati|Ankara|Barua|Nenosiri/);
    }

    const overflow375 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow375, '375px overflow').toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 320, height: 700 });
    await page.waitForTimeout(120);
    const mobileGeometry = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      offenders: Array.from(document.querySelectorAll('body *')).map((element) => {
        const box = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          id: element.id,
          className: String(element.className || '').slice(0, 80),
          left: box.left,
          right: box.right,
          width: box.width,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth
        };
      }).filter((item) =>
        item.right > document.documentElement.clientWidth + 1
        || item.left < -1
        || item.scrollWidth > item.clientWidth + 1
      ).slice(0, 8)
    }));
    expect(mobileGeometry.overflow, `320px overflow: ${JSON.stringify(mobileGeometry.offenders)}`).toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 640, height: 700 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await page.waitForTimeout(120);
    const zoomGeometry = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      offenders: Array.from(document.querySelectorAll('body *')).map((element) => {
        const box = element.getBoundingClientRect();
        return { tag: element.tagName, id: element.id, className: String(element.className || '').slice(0, 80), left: box.left, right: box.right, width: box.width };
      }).filter((item) => item.right > document.documentElement.clientWidth + 2 || item.left < -2).slice(0, 8)
    }));
    expect(zoomGeometry.overflow, `200% text reflow overflow: ${JSON.stringify(zoomGeometry.offenders)}`).toBeLessThanOrEqual(2);
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });

    let meaningfulFocus = null;
    for (let index = 0; index < 120; index += 1) {
      await page.keyboard.press('Tab');
      meaningfulFocus = await page.evaluate(() => {
        const active = document.activeElement;
        if (!active || /^(?:BODY|HTML)$/.test(active.tagName)) return null;
        const style = getComputedStyle(active);
        const visible = parseFloat(style.outlineWidth) >= 2 || style.boxShadow !== 'none';
        const inWorkflow = Boolean(active.closest('main,[role="main"],.workspace,.tool-shell,.tool-app,.app-shell'))
          || !active.closest('header,nav,footer,afro-navbar,afro-footer');
        return { tag: active.tagName, id: active.id, visible, inWorkflow };
      });
      if (meaningfulFocus && meaningfulFocus.inWorkflow) break;
    }
    expect(meaningfulFocus, 'keyboard reached a focusable control').not.toBeNull();
    expect(meaningfulFocus.inWorkflow, 'keyboard reached the main workflow').toBe(true);
    expect(meaningfulFocus.visible, 'focus indicator is visibly rendered').toBe(true);

    const contrast = async () => page.evaluate(() => {
      function rgba(value) {
        const match = value.match(/[\d.]+/g) || [];
        return match.slice(0, 3).map(Number);
      }
      function luminance(rgb) {
        const values = rgb.map((value) => {
          const channel = value / 255;
          return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
      }
      function opaqueBackground(element) {
        let current = element;
        while (current) {
          const color = getComputedStyle(current).backgroundColor;
          if (!/rgba?\([^)]*,\s*0(?:\.0+)?\)$/.test(color) && color !== 'transparent') return color;
          current = current.parentElement;
        }
        return 'rgb(255,255,255)';
      }
      const target = document.body;
      const foreground = luminance(rgba(getComputedStyle(target).color));
      const background = luminance(rgba(opaqueBackground(target)));
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    });
    expect(await contrast(), 'light-mode text contrast').toBeGreaterThanOrEqual(4.5);
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
      document.body.classList.add('dark-mode');
    });
    expect(await contrast(), 'dark-mode text contrast').toBeGreaterThanOrEqual(4.5);

    const visibleDialogs = page.locator('[role="dialog"]:visible, dialog[open]');
    for (let index = 0; index < await visibleDialogs.count(); index += 1) {
      const dialog = visibleDialogs.nth(index);
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      const label = await dialog.getAttribute('aria-label');
      const labelledBy = await dialog.getAttribute('aria-labelledby');
      expect(Boolean(label || labelledBy), 'visible modal has an accessible name').toBe(true);
      expect(await dialog.evaluate((node) => node.contains(document.activeElement)), 'modal owns focus').toBe(true);
    }

    if (app.requiresConsent) {
      await expect(page.getByText(/ridhaa|consent|kutuma|tuma|send/i).first()).toHaveCount(1);
    }

    expect(pageErrors, 'page errors').toEqual([]);
    expect(consoleErrors, 'console errors').toEqual([]);
    expect(failedSameOrigin, 'same-origin failures').toEqual([]);
    expect(externalRequests, 'unexpected external requests').toEqual([]);

    receipts.set(app.id, {
      accepted: true,
      checked: ['375px','320px','200%-reflow','light-contrast','dark-contrast','keyboard-tab-order','visible-focus','modal-semantics','auth-storage-absent','download-contract','canonical','og-locale','artwork','console','same-origin-network'],
      noExternalRequests: true,
      sensitiveNoExternalRequests: app.sensitive || app.requiresConsent ? true : null
    });
  });
}

for (const app of selectedApps.filter((row) => ['pdf-merge-split', 'pdf-compress'].includes(row.id))) {
  test(`${app.id}: invalid input, boundary setting and real stale output fail closed`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('afro_auth_v2');
      localStorage.removeItem('afro_session_v3');
      localStorage.removeItem('afro_profile_cache');
    });
    await page.goto(app.swahiliRoute, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('email-gate-modal')).toHaveCount(1);

    const first = await staleFixture('SW STALE A', 2);
    const second = await staleFixture('SW STALE B', 1);
    if (app.id === 'pdf-merge-split') {
      const input = page.locator('#mergeFileInput');
      const run = page.locator('#mergeBtn');
      const download = page.locator('#actionRow .act-download');
      await expect(run, 'empty merge input remains invalid').toBeDisabled();
      await input.setInputFiles([
        { name: 'stale-a.pdf', mimeType: 'application/pdf', buffer: first },
        { name: 'stale-b.pdf', mimeType: 'application/pdf', buffer: second }
      ]);
      await expect(page.locator('#mergeSummary')).toContainText(/3 (?:pages|kurasa)/i);
      await expect(run).toBeEnabled();
      await run.press('Enter');
      await expect(download).toBeVisible({ timeout: 30_000 });
      await expect(download).toBeEnabled();
      await expect(page.locator('html')).toHaveAttribute('data-sw-document-result', 'fresh', { timeout: 30_000 });
      await input.setInputFiles([
        { name: 'replacement-a.pdf', mimeType: 'application/pdf', buffer: first },
        { name: 'replacement-b.pdf', mimeType: 'application/pdf', buffer: second }
      ]);
      await expect(page.locator('html')).toHaveAttribute('data-sw-document-result', 'stale');
      await expect(download).toBeDisabled();
      await expect(download).toHaveAttribute('aria-disabled', 'true');
    } else {
      const input = page.locator('#pdfFileInput');
      const run = page.locator('#compressBtn');
      const download = page.locator('#downloadBtn');
      const quality = page.locator('#qualitySlider');
      await expect(run, 'empty compression input remains invalid').toBeDisabled();
      await page.locator('[data-preset="custom"]').click();
      await expect(quality).toBeVisible();
      const minimum = await quality.getAttribute('min');
      const maximum = await quality.getAttribute('max');
      expect(minimum, 'minimum quality boundary is declared').toBeTruthy();
      expect(maximum, 'maximum quality boundary is declared').toBeTruthy();
      await quality.fill(maximum);
      await expect(quality).toHaveValue(maximum);
      await input.setInputFiles({ name: 'stale-compress.pdf', mimeType: 'application/pdf', buffer: first });
      await expect(run).toBeEnabled();
      await run.click();
      await expect(download).toBeVisible({ timeout: 30_000 });
      await expect(download).toBeEnabled();
      await expect(page.locator('html')).toHaveAttribute('data-sw-document-result', 'fresh', { timeout: 30_000 });
      await quality.fill(minimum);
      await expect(quality).toHaveValue(minimum);
      await expect(page.locator('html')).toHaveAttribute('data-sw-document-result', 'stale');
      if (await download.count()) {
        await expect(download).toBeDisabled();
        await expect(download).toHaveAttribute('aria-disabled', 'true');
      } else {
        await expect(download).toHaveCount(0);
      }
    }
    await expect(page.getByText(/Taarifa zimebadilika/)).toBeVisible();
    stateChecks.set(app.id, ['invalid-input', 'declared-boundary', 'real-result-stale-disabled']);
  });
}

for (const app of selectedApps.filter((row) => [
  'pdf-ocr', 'pdf-chat', 'pdf-compare', 'meeting-minutes', 'receipt-generator', 'business-plan'
].includes(row.id))) {
  test(`${app.id}: invalid and boundary states fail closed`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('afro_auth_v2');
      localStorage.removeItem('afro_session_v3');
      localStorage.removeItem('afro_profile_cache');
    });
    await page.goto(app.swahiliRoute, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('email-gate-modal')).toHaveCount(app.sensitive ? 0 : 1);

    const required = page.locator('main input[required], main textarea[required]').first();
    let invalidProved = false;
    if (await required.count()) {
      await required.fill('');
      expect(await required.evaluate((node) => node.validity.valid), 'empty required input is invalid').toBe(false);
      invalidProved = true;
    } else {
      const file = page.locator('main input[type="file"]').first();
      if (await file.count()) {
        expect(await file.evaluate((node) => node.files.length)).toBe(0);
        invalidProved = true;
      }
    }
    expect(invalidProved, `${app.id}: an invalid state was asserted`).toBe(true);

    const bounded = page.locator('main input[type="number"][min], main input[type="number"][max]').first();
    const checks = ['invalid-input'];
    if (await bounded.count()) {
      const min = await bounded.getAttribute('min');
      const max = await bounded.getAttribute('max');
      const bad = min !== null ? String(Number(min) - 1) : String(Number(max) + 1);
      await bounded.fill(bad);
      expect(await bounded.evaluate((node) => node.validity.valid), 'out-of-bound number is invalid').toBe(false);
      checks.push('declared-number-boundary');
    }

    const oversized = {
      'pdf-ocr': { selector: '#fileInput', megabytes: 51, error: /Faili ni kubwa sana.*MB 50/, blocked: '#extractBtn' },
      'pdf-chat': { selector: '#fileInput', megabytes: 21, error: /Faili ni kubwa sana.*MB 20/ },
      'pdf-compare': { selector: '#fileOriginal', megabytes: 26, error: /Chagua PDF hadi MB 25/, blocked: '#compareBtn' }
    }[app.id];
    if (oversized) {
      await page.locator(oversized.selector).evaluate((input, megabytes) => {
        const transfer = new DataTransfer();
        transfer.items.add(new File(
          [new Uint8Array(megabytes * 1024 * 1024)],
          'boundary.pdf',
          { type: 'application/pdf' }
        ));
        input.files = transfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, oversized.megabytes);
      await expect(page.getByText(oversized.error).first()).toBeVisible();
      if (oversized.blocked) await expect(page.locator(oversized.blocked)).toBeDisabled();
      checks.push('oversized-file-boundary');
    }
    stateChecks.set(app.id, checks);
  });
}
