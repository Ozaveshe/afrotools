'use strict';

const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');
const fs = require('node:fs');

const routes = [
  ['/sw/liberia/kikokotoo-kodi-mshahara', 'lr-paye'],
  ['/sw/mauritania/kikokotoo-kodi-mshahara', 'mr-paye'],
  ['/sw/zana/microfinance-riba-tambarare-dhidi-ya-salio', 'microfinance-calc'],
  ['/sw/zana/uwezo-wa-mkopo-wa-nyumba', 'mortgage-affordability'],
  ['/sw/zana/kikokotoo-mkopo-wa-nyumba', 'mortgage-calculator'],
  ['/sw/zana/kizalishaji-payslip', 'payslip-generator'],
  ['/sw/zana/faida-ya-uwekezaji-wa-nyumba', 'property-roi'],
  ['/sw/zana/gharama-za-uhamisho-wa-mali', 'property-transfer-cost'],
  ['/sw/zana/kukodi-dhidi-ya-kununua', 'rent-vs-buy'],
  ['/sw/zana/mpango-wa-kustaafu-mapema', 'retirement-planner'],
  ['/sw/zana/nauli-za-ruti', 'route-fares'],
  ['/sw/zana/kilinganisha-mishahara', 'salary-compare'],
  ['/sw/somalia/kikokotoo-kodi-mshahara', 'so-paye'],
  ['/sw/south-sudan/kikokotoo-kodi-mshahara', 'ss-paye'],
  ['/sw/sao-tome/kikokotoo-kodi-mshahara', 'st-paye'],
  ['/sw/zana/bajeti-ya-gharama-za-wafanyakazi', 'staff-cost'],
  ['/sw/zana/thamani-ya-startup', 'startup-valuation'],
  ['/sw/zana/mpango-wa-malipo-ya-mkopo-wa-mwanafunzi', 'student-loan'],
  ['/sw/togo/kikokotoo-kodi-mshahara', 'tg-paye'],
];

test('staff-cost preserves the user-evidenced engine and local export boundary', async ({ page }) => {
  const writes = [];
  page.on('request', (request) => { if (request.method() !== 'GET' && request.postData()) writes.push(request.postData()); });
  await page.addInitScript(() => {
    window.__copiedText = '';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__copiedText = value; } } });
  });
  await page.goto('/sw/zana/bajeti-ya-gharama-za-wafanyakazi/', { waitUntil: 'domcontentloaded' });
  await page.locator('#scp-currency').fill('KES');
  await page.locator('#scp-headcount').fill('5');
  await page.locator('#scp-horizon').fill('12');
  await page.locator('#scp-salary').fill('500000');
  await page.locator('#scp-obligations').fill('60000');
  await page.locator('#scp-benefits').fill('40000');
  await page.locator('#scp-recurring').fill('25000');
  await page.locator('#scp-recruitment').fill('100000');
  await page.locator('#scp-equipment').fill('350000');
  await page.locator('#scp-annual-extras').fill('500000');
  await page.locator('#scp-contingency').fill('5');
  await page.locator('#scp-source-label').fill('=Ratiba ya majaribio');
  await page.locator('#scp-source-date').fill('2026-07-22');
  await page.locator('#scp-status-confirm').check();
  await page.locator('#scp-source-confirm').check();
  await page.getByRole('button', { name: 'Tengeneza bajeti' }).click();
  await expect(page.locator('#scp-total')).toContainText('44,362,500');
  await expect(page.locator('#scp-metrics')).toContainText('3,696,875');
  await expect(page.locator('#scp-metrics')).toContainText('47.88%');
  await expect(page.locator('#scp-evidence')).toContainText('=Ratiba ya majaribio');

  await page.locator('#scp-copy').click();
  expect(await page.evaluate(() => window.__copiedText)).toContain('Muhtasari wa gharama za wafanyakazi');
  const csvEvent = page.waitForEvent('download');
  await page.locator('#scp-csv').click();
  const csv = fs.readFileSync(await (await csvEvent).path(), 'utf8');
  expect(csv).toContain('"Idadi ya wafanyakazi","5"');
  expect(csv).toContain("\"Chanzo cha ushahidi\",\"'=Ratiba ya majaribio\"");

  const pdfBytes = await page.evaluate(async () => {
    const generated = new Promise((resolve) => window.addEventListener('afro-pdf-generated', async (event) => resolve([...new Uint8Array(await event.detail.blob.arrayBuffer())]), { once: true }));
    document.getElementById('scp-pdf').click();
    return generated;
  });
  const pdf = await pdfParse(Buffer.from(pdfBytes));
  expect(pdf.text).toContain('Muhtasari wa Gharama za Wafanyakazi');
  expect(pdf.text).toContain('44,362,500');

  await page.locator('#scp-source-date').fill('2025-01-01');
  await page.getByRole('button', { name: 'Tengeneza bajeti' }).click();
  await expect(page.locator('#scp-total')).toHaveText('Hakuna bajeti');
  await expect(page.locator('#scp-status')).toContainText('zaidi ya mwaka mmoja');
  await page.getByRole('button', { name: 'Futa data' }).click();
  await expect(page.locator('#scp-currency')).toHaveValue('');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /staff|salary|payroll|employee/i.test(key)))).toEqual([]);
  expect(writes).toEqual([]);
});

test('student-loan preserves the shared engine and all local export contracts', async ({ page }) => {
  const writes = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && request.postData()) writes.push({ url: request.url(), body: request.postData() });
  });
  await page.addInitScript(() => {
    window.__copiedText = '';
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value) => { window.__copiedText = value; } },
    });
  });
  await page.goto('/sw/zana/mpango-wa-malipo-ya-mkopo-wa-mwanafunzi/', { waitUntil: 'domcontentloaded' });
  await page.locator('#sl-currency').fill('KES');
  await page.locator('#sl-balance').fill('10000');
  await page.locator('#sl-financed-fees').fill('500');
  await page.locator('#sl-rate').fill('0');
  await page.locator('#sl-months').fill('10');
  await page.locator('#sl-grace').fill('2');
  await page.locator('#sl-grace-accrual').check();
  await page.locator('#sl-monthly-fee').fill('10');
  await page.locator('#sl-extra').fill('0');
  await page.locator('#sl-income').fill('5000');
  await page.locator('#sl-debts').fill('500');
  await page.locator('#sl-source').fill('Taarifa ya majaribio');
  await page.locator('#sl-date').fill('2026-07-22');
  await page.getByRole('button', { name: 'Kokotoa mpango wa malipo' }).click();

  await expect(page.locator('#sl-start')).toContainText('10,500');
  await expect(page.locator('#sl-payment')).toContainText('1,050');
  await expect(page.locator('#sl-cash-payment')).toContainText('1,060');
  await expect(page.locator('#sl-interest')).toContainText('0');
  await expect(page.locator('#sl-fees')).toContainText('600');
  await expect(page.locator('#sl-total')).toContainText('10,600');
  await expect(page.locator('#sl-timeline')).toHaveText('12 miezi');
  await expect(page.locator('#sl-debt-load')).toHaveText('31.2%');
  await expect(page.locator('#sl-cash-after')).toContainText('3,440');
  await expect(page.locator('#sl-schedule tr')).toHaveCount(12);

  await page.locator('#sl-copy').click();
  expect(await page.evaluate(() => window.__copiedText)).toContain('Mpango wa malipo ya mkopo wa mwanafunzi');

  const csvEvent = page.waitForEvent('download');
  await page.locator('#sl-csv').click();
  const csv = fs.readFileSync(await (await csvEvent).path(), 'utf8');
  expect(csv.split('\n')).toHaveLength(13);
  expect(csv).toContain('"month","phase","payment","fee","interest","principal","balance"');
  expect(csv).not.toMatch(/(?:^|,)"[=+@-]/m);

  const jsonEvent = page.waitForEvent('download');
  await page.locator('#sl-json').click();
  const payload = JSON.parse(fs.readFileSync(await (await jsonEvent).path(), 'utf8'));
  expect(payload.schemaVersion).toBe(1);
  expect(payload.plan).toMatchObject({ currency: 'KES', balanceAtRepaymentStart: 10500, scheduledPayment: 1050, totalPaid: 10600 });

  const pdfBytes = await page.evaluate(async () => {
    const generated = new Promise((resolve) => window.addEventListener('afro-pdf-generated', async (event) => {
      resolve([...new Uint8Array(await event.detail.blob.arrayBuffer())]);
    }, { once: true }));
    document.getElementById('sl-pdf').click();
    return generated;
  });
  const parsed = await pdfParse(Buffer.from(pdfBytes));
  expect(parsed.text).toContain('Mpango wa malipo ya mkopo wa mwanafunzi');
  expect(parsed.text).toContain('10,600');

  await page.locator('#sl-date').fill('2025-01-01');
  await page.getByRole('button', { name: 'Kokotoa mpango wa malipo' }).click();
  await expect(page.locator('#sl-error')).toContainText('siku 365');
  await expect(page.locator('#sl-results')).toBeHidden();
  await page.locator('#sl-reset').click();
  await expect(page.locator('#sl-currency')).toHaveValue('');
  expect(writes).toEqual([]);
});

test('lr-paye uses the reviewed engine and creates a private parser-readable PDF', async ({ page }) => {
  const writes = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && request.postData()) writes.push({ url: request.url(), body: request.postData() });
  });
  await page.addInitScript(() => {
    window.__sharedPayload = null;
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (payload) => { window.__sharedPayload = payload; } });
  });
  await page.goto('/sw/liberia/kikokotoo-kodi-mshahara', { waitUntil: 'domcontentloaded' });
  await page.locator('#salaryInput').fill('500000');
  await page.getByRole('button', { name: 'Kokotoa Kodi' }).click();
  await expect(page.locator('#r-tax')).toContainText('116,375');
  await expect(page.locator('#r-nasscorp')).toContainText('20,000');
  await expect(page.locator('#r-net')).toContainText('363,625');
  await page.locator('#tog-nasscorp').click();
  await expect(page.locator('#r-tax')).toContainText('116,375');
  await expect(page.locator('#r-nasscorp')).toContainText('0');
  await expect(page.locator('#r-net')).toContainText('383,625');
  await page.locator('#tog-nasscorp').click();

  const pdfBytes = await page.evaluate(async () => {
    const generated = new Promise((resolve) => window.addEventListener('afro-pdf-generated', async (event) => {
      resolve([...new Uint8Array(await event.detail.blob.arrayBuffer())]);
    }, { once: true }));
    document.getElementById('pdfBtn').click();
    return generated;
  });
  const parsed = await pdfParse(Buffer.from(pdfBytes));
  expect(parsed.text).toContain('Makadirio ya Kodi ya Mshahara Liberia');
  expect(parsed.text).toContain('116,375');
  expect(parsed.text).toContain('363,625');

  await page.locator('#shareBtn').click();
  expect(await page.evaluate(() => window.__sharedPayload)).toEqual({
    title: 'Kikokotoo cha Kodi ya Mshahara Liberia',
    url: 'https://afrotools.com/sw/liberia/kikokotoo-kodi-mshahara/',
  });
  await page.locator('#resetBtn').click();
  await expect(page.locator('#salaryInput')).toHaveValue('');
  await expect(page.locator('#calcStatus')).toContainText('Imefutwa');
  await page.getByRole('button', { name: 'Kokotoa Kodi' }).click();
  await expect(page.locator('#calcStatus')).toContainText('zaidi ya sifuri');
  expect(writes).toEqual([]);
  const source = await page.locator('html').evaluate((node) => node.outerHTML);
  expect(source).not.toMatch(/ai-advisor|openPdfModal|afrotools-language-fallback|data-explicit-language-fallback|\?gross=/);
});

test('mr-paye uses the reviewed engine and creates a private parser-readable PDF', async ({ page }) => {
  const writes = [];
  await page.addInitScript(() => {
    window.__sharedPayload = null;
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (payload) => { window.__sharedPayload = payload; } });
  });
  page.on('request', (request) => {
    if (request.method() !== 'GET' && request.postData()) writes.push({ url: request.url(), body: request.postData() });
  });
  await page.goto('/sw/mauritania/kikokotoo-kodi-mshahara', { waitUntil: 'domcontentloaded' });
  await page.locator('#salaryInput').fill('30000');
  await page.getByRole('button', { name: 'Kokotoa Kodi' }).click();
  await expect(page.locator('#r-tax')).toContainText('5,490');
  await expect(page.locator('#r-cnss')).toContainText('150');
  await expect(page.locator('#r-net')).toContainText('24,360');
  await page.locator('#tog-cnss').click();
  await expect(page.locator('#r-tax')).toContainText('5,550');
  await expect(page.locator('#r-cnss')).toContainText('0');
  await expect(page.locator('#r-net')).toContainText('24,450');
  await page.locator('#tog-cnss').click();

  const pdfBytes = await page.evaluate(async () => {
    const generated = new Promise((resolve) => window.addEventListener('afro-pdf-generated', async (event) => {
      resolve([...new Uint8Array(await event.detail.blob.arrayBuffer())]);
    }, { once: true }));
    document.querySelector('.result-actions .action-btn').click();
    return generated;
  });
  const parsed = await pdfParse(Buffer.from(pdfBytes));
  expect(parsed.text).toContain('Makadirio ya ITS Mauritania');
  expect(parsed.text).toContain('5,490');
  expect(parsed.text).toContain('24,360');

  await page.getByRole('button', { name: 'Shiriki' }).click();
  expect(await page.evaluate(() => window.__sharedPayload)).toEqual({
    title: 'Kikokotoo cha Kodi Mauritania',
    text: 'Kikokotoo cha ITS na CNSS cha AfroTools.',
    url: 'https://afrotools.com/sw/mauritania/kikokotoo-kodi-mshahara/',
  });
  await page.locator('#resetBtn').click();
  await expect(page.locator('#salaryInput')).toHaveValue('');
  await expect(page.locator('#calcStatus')).toContainText('Imefutwa');
  await page.getByRole('button', { name: 'Kokotoa Kodi' }).click();
  await expect(page.locator('#calcStatus')).toContainText('zaidi ya sifuri');
  expect(writes).toEqual([]);
  const source = await page.locator('html').evaluate((node) => node.outerHTML);
  expect(source).not.toMatch(/ai-advisor|pdf-leads|data-explicit-language-fallback|\?gross=/);
});

for (const [route, id] of routes) {
  test(`${id} has native Swahili mobile, metadata, privacy and interaction boundaries`, async ({ page }) => {
    const errors = [];
    const sensitiveWrites = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && !/favicon/i.test(message.text())) errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      const body = request.postData();
      if (request.method() !== 'GET' && body) sensitiveWrites.push({ url: request.url(), body });
    });

    await page.setViewportSize({ width: 320, height: 820 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto(route, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('h1')).toBeVisible();
    const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${escapedRoute}/?$`));
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', new RegExp(`${escapedRoute}/?$`));
    await expect(page.locator('link[hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('link[hreflang="sw"]')).toHaveCount(1);
    await expect(page.locator('link[hreflang="x-default"]')).toHaveCount(1);
    expect(await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.some((node) => /"inLanguage"\s*:\s*"sw"/.test(node.textContent || '')))).toBe(true);
    expect(await page.locator('iframe').count()).toBe(0);

    const controls = page.locator('input:not([type="hidden"]), select, textarea, button');
    const unnamed = await controls.evaluateAll((nodes) => nodes.filter((node) => {
      const style = getComputedStyle(node);
      if (node.disabled || node.hidden || node.getAttribute('aria-hidden') === 'true' || style.display === 'none' || style.visibility === 'hidden' || node.getClientRects().length === 0) return false;
      const label = node.labels && node.labels.length;
      return !label && !node.getAttribute('aria-label') && !node.getAttribute('aria-labelledby') && !String(node.textContent || '').trim() && !node.getAttribute('title');
    }).map((node) => node.id || node.outerHTML.slice(0, 80)));
    expect(unnamed).toEqual([]);

    const firstFocusable = page.locator('a[href]:visible, button:visible, input:visible, select:visible, textarea:visible').first();
    await firstFocusable.focus();
    const focus = await page.evaluate(() => {
      const node = document.activeElement;
      const style = node ? getComputedStyle(node) : null;
      return { tag: node && node.tagName, outline: style && style.outlineStyle, width: style && style.outlineWidth };
    });
    expect(focus.tag).not.toBe('BODY');
    expect(focus.outline === 'none' && focus.width === '0px').toBe(false);

    const normalReflow = await page.evaluate(() => ({
      delta: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      containers: [...document.querySelectorAll('body *')]
        .filter((node) => node.scrollWidth > node.clientWidth + 1)
        .sort((left, right) => (right.scrollWidth - right.clientWidth) - (left.scrollWidth - left.clientWidth))
        .slice(0, 5).map((node) => ({ tag: node.tagName, id: node.id, className: String(node.className || ''), client: node.clientWidth, scroll: node.scrollWidth })),
    }));
    expect(normalReflow.delta, JSON.stringify(normalReflow.containers)).toBeLessThanOrEqual(1);
    await page.addStyleTag({ content: 'html{font-size:200%!important}' });
    const reflow = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      const offenders = [...document.querySelectorAll('body *')].filter((node) => {
        const box = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return style.display !== 'none' && node.getClientRects().length && box.right > viewport + 4;
      }).sort((left, right) => right.getBoundingClientRect().right - left.getBoundingClientRect().right)
        .slice(0, 5).map((node) => ({ tag: node.tagName, id: node.id, className: String(node.className || ''), right: Math.round(node.getBoundingClientRect().right) }));
      return {
        delta: document.documentElement.scrollWidth - viewport,
        offenders,
        metrics: {
          viewport,
          htmlScroll: document.documentElement.scrollWidth,
          bodyClient: document.body.clientWidth,
          bodyScroll: document.body.scrollWidth,
          bodyRight: Math.round(document.body.getBoundingClientRect().right),
          htmlMinWidth: getComputedStyle(document.documentElement).minWidth,
          bodyMinWidth: getComputedStyle(document.body).minWidth,
        },
        scrollContainers: [...document.querySelectorAll('body *')]
          .filter((node) => node.scrollWidth > node.clientWidth + 4)
          .sort((left, right) => (right.scrollWidth - right.clientWidth) - (left.scrollWidth - left.clientWidth))
          .slice(0, 5).map((node) => ({ tag: node.tagName, id: node.id, className: String(node.className || ''), client: node.clientWidth, scroll: node.scrollWidth, overflow: getComputedStyle(node).overflowX })),
      };
    });
    expect(reflow.delta, JSON.stringify({ offenders: reflow.offenders, metrics: reflow.metrics, scrollContainers: reflow.scrollContainers })).toBeLessThanOrEqual(4);

    const reset = page.locator('button[type="reset"]:visible, [id*="reset"]:visible, [id*="clear"]:visible').first();
    if (await reset.count()) {
      await reset.focus();
      await expect(reset).toBeFocused();
    }

    await page.setViewportSize({ width: 375, height: 820 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

    expect(sensitiveWrites).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('accepted routes expose only local advertised result actions', async ({ page }) => {
  for (const [route, id] of routes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const actions = await page.locator('button, a[download]').evaluateAll((nodes) => nodes
      .filter((node) => /PDF|CSV|JSON|TXT|Pakua|Nakili|Shiriki|Chapisha/i.test(node.textContent || node.getAttribute('aria-label') || ''))
      .map((node) => ({
        label: String(node.textContent || node.getAttribute('aria-label') || '').trim(),
        href: node.getAttribute('href') || '',
      })));
    for (const action of actions) {
      expect(action.href, `${id}: ${action.label}`).not.toMatch(/^https?:\/\//i);
    }
  }
});
