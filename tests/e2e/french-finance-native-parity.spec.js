const fs = require('fs');
const pdfParse = require('pdf-parse');
const { test, expect } = require('@playwright/test');

async function blockExternalRequests(page) {
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') await route.continue();
    else await route.abort();
  });
}

function watchPage(page) {
  const errors = [];
  const privateWrites = [];
  page.on('console', message => {
    if (message.type() === 'error' && !/ERR_FAILED|favicon|google|doubleclick|googlesyndication/i.test(message.text())) {
      errors.push(message.text());
    }
  });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (!['GET', 'HEAD'].includes(request.method()) && /127\.0\.0\.1|localhost/.test(request.url())) {
      privateWrites.push({ url: request.url(), body: request.postData() || '' });
    }
  });
  return { errors, privateWrites };
}

async function expectResponsiveAndAccessible(page, rootSelector) {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 820 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${width}px overflow`).toBe(true);
  }
  await page.setViewportSize({ width: 750, height: 900 });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.fontSize = '200%';
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), '200% overflow').toBe(true);
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.fontSize = '';
  });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await expect(page.locator(rootSelector)).toBeVisible();
  expect(await page.locator(`${rootSelector} input, ${rootSelector} select, ${rootSelector} textarea`).evaluateAll(nodes => (
    nodes.every(node => node.labels && node.labels.length > 0)
  ))).toBe(true);
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
}

async function parseDownload(download, kind) {
  const filePath = await download.path();
  expect(filePath).toBeTruthy();
  const buffer = fs.readFileSync(filePath);
  if (kind === 'json') {
    const parsed = JSON.parse(buffer.toString('utf8'));
    expect(parsed).toBeTruthy();
    return;
  }
  if (kind === 'pdf') {
    const parsed = await pdfParse(buffer);
    expect(parsed.text.trim().length).toBeGreaterThan(40);
    return;
  }
  expect(buffer.toString('utf8').replace(/^\uFEFF/, '').trim().length).toBeGreaterThan(20);
}

async function clickAndParse(page, selector, kind) {
  const event = page.waitForEvent('download');
  await page.locator(selector).click();
  await parseDownload(await event, kind);
}

test.describe.configure({ mode: 'serial' });

test('four native French HR workflows calculate, persist locally and reopen every export', async ({ page, context }) => {
  test.setTimeout(180000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await blockExternalRequests(page);
  const watched = watchPage(page);
  const cases = [
    { route: '/fr/tools/calculateur-heures-supplementaires/', mode: 'overtime', result: /Paiement des heures supplémentaires/ },
    { route: '/fr/tools/calculateur-conges-pto/', mode: 'leave', result: /Congé annuel restant/ },
    { route: '/fr/tools/securite-sociale/', mode: 'social', result: /Cotisations salarié/ },
    { route: '/fr/tools/projection-pension/', mode: 'pension', result: /Solde final projeté/ }
  ];
  for (const item of cases) {
    await page.goto(item.route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('[data-checked-date]')).not.toBeEmpty();
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('[data-result]')).toBeVisible();
    await expect(page.locator('[data-result-rows]')).toContainText(item.result);
    await expectResponsiveAndAccessible(page, '[data-frhr-app]');

    await page.locator('[data-copy]').click();
    await expect(page.locator('[data-status]')).toContainText(/copié/i);
    await page.locator('[data-share]').click();
    await expect(page.locator('[data-status]')).toContainText(/partage|copié/i);
    await page.locator('[data-save]').click();
    expect(await page.evaluate(mode => Boolean(localStorage.getItem(`afrotools.frhr.${mode}`)), item.mode)).toBe(true);
    await clickAndParse(page, '[data-csv]', 'csv');
    await clickAndParse(page, '[data-json]', 'json');
    await clickAndParse(page, '[data-txt]', 'txt');
    await clickAndParse(page, '[data-pdf]', 'pdf');
    await page.locator('form button[type="reset"]').click();
    await expect(page.locator('[data-result]')).toBeHidden();
    await page.locator('[data-clear]').click();
    expect(await page.evaluate(mode => localStorage.getItem(`afrotools.frhr.${mode}`), item.mode)).toBeNull();
  }
  expect(watched.privateWrites).toEqual([]);
  expect(watched.errors).toEqual([]);
});

test('Guinea-Bissau and São Tomé French payroll apps match their scoped models and parse all exports', async ({ page, context }) => {
  test.setTimeout(120000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await blockExternalRequests(page);
  const watched = watchPage(page);
  const cases = [
    {
      route: '/fr/guinea-bissau/gw-paye',
      mode: 'gw',
      gross: '500000',
      assertions: [/PAYE mensuel/, /Salaire net mensuel estimé/, /INSS employeur \(14 %\)/]
    },
    {
      route: '/fr/sao-tome/st-paye',
      mode: 'st',
      gross: '10000',
      assertions: [/INSS salarié \(4 %\)/, /IRS/, /Non calculé/, /INSS employeur \(6 %\)/]
    }
  ];
  for (const item of cases) {
    await page.goto(item.route, { waitUntil: 'domcontentloaded' });
    await page.fill('[name="grossMonthly"]', item.gross);
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('[data-result]')).toBeVisible();
    for (const assertion of item.assertions) await expect(page.locator('[data-result-rows]')).toContainText(assertion);
    await expectResponsiveAndAccessible(page, '[data-fr-payroll]');
    await page.locator('[data-copy]').click();
    await expect(page.locator('[data-status]')).toContainText(/copié/i);
    await page.locator('[data-share]').click();
    await page.locator('[data-save]').click();
    expect(await page.evaluate(mode => Boolean(localStorage.getItem(`afrotools.fr.payroll.${mode}`)), item.mode)).toBe(true);
    await clickAndParse(page, '[data-csv]', 'csv');
    await clickAndParse(page, '[data-json]', 'json');
    await clickAndParse(page, '[data-txt]', 'txt');
    await clickAndParse(page, '[data-pdf]', 'pdf');
    await page.locator('form button[type="reset"]').click();
    await expect(page.locator('[data-result]')).toBeHidden();
    await page.locator('[data-clear]').click();
    expect(await page.evaluate(mode => localStorage.getItem(`afrotools.fr.payroll.${mode}`), item.mode)).toBeNull();
  }
  expect(watched.privateWrites).toEqual([]);
  expect(watched.errors).toEqual([]);
});

test('French pension projection preserves the shared fixture and parses CSV/PDF', async ({ page }) => {
  await blockExternalRequests(page);
  const watched = watchPage(page);
  await page.goto('/fr/tools/projection-pension-simple/', { waitUntil: 'domcontentloaded' });
  await page.locator('#scheme-confirmed').check();
  await page.locator('#assumptions-confirmed').check();
  await page.fill('#years', '1');
  await page.fill('#annual-return', '12');
  await page.fill('#annual-fee', '0');
  await page.fill('#inflation', '6');
  await page.fill('#contribution-growth', '0');
  await page.locator('#pension-form button[type="submit"]').click();
  await expect(page.locator('#ending-balance')).toContainText(/2[\s.,\u00a0]*384[\s.,\u00a0]*649/);
  await expect(page.locator('#future-contributions')).toContainText(/1[\s.,\u00a0]*200[\s.,\u00a0]*000/);
  await clickAndParse(page, '#csv-result', 'csv');
  await clickAndParse(page, '#pdf-result', 'pdf');
  await page.locator('#copy-result').click();
  await expectResponsiveAndAccessible(page, '#pension-form');
  expect(watched.privateWrites).toEqual([]);
  expect(watched.errors).toEqual([]);
});

test('French investment projection preserves shared rounding and parses CSV/PDF', async ({ page }) => {
  await blockExternalRequests(page);
  const watched = watchPage(page);
  await page.goto('/fr/tools/rendement-investissement/', { waitUntil: 'domcontentloaded' });
  await page.fill('#ir-initial', '1000');
  await page.fill('#ir-monthly', '100');
  await page.fill('#ir-rate', '12');
  await page.fill('#ir-years', '1');
  await page.selectOption('#ir-compound', '12');
  await page.selectOption('#ir-timing', 'end');
  await page.fill('#ir-inflation', '6');
  await page.locator('#ir-form button[type="submit"]').click();
  await expect(page.locator('#ir-final')).toContainText(/2[\s.,\u00a0]*395/);
  await expect(page.locator('#ir-metrics')).toContainText(/12[,.]68\s*%/);
  await clickAndParse(page, '#ir-csv', 'csv');
  await clickAndParse(page, '#ir-pdf', 'pdf');
  await page.locator('#ir-copy').click();
  await page.locator('#ir-form button[type="reset"]').click();
  await expectResponsiveAndAccessible(page, '#ir-form');
  expect(watched.privateWrites).toEqual([]);
  expect(watched.errors).toEqual([]);
});

test('French rate reference admits only fresh verified rows and parses CSV/PDF', async ({ page }) => {
  await blockExternalRequests(page);
  const watched = watchPage(page);
  await page.goto('/fr/tools/reference-taux-interet/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#snapshot-status')).toContainText(/instantané|vérifié/i);
  await expect(page.locator('#rate-body tr')).toHaveCount(6);
  await expect(page.locator('#verified-count')).toHaveText('6');
  await expect(page.locator('#excluded-count')).toHaveText('9');
  await clickAndParse(page, '#rates-csv', 'csv');
  await clickAndParse(page, '#rates-pdf', 'pdf');
  await expectResponsiveAndAccessible(page, 'main');
  expect(watched.privateWrites).toEqual([]);
  expect(watched.errors).toEqual([]);
});

test('French South Africa CGT preserves the shared result and TXT export', async ({ page }) => {
  await blockExternalRequests(page);
  const watched = watchPage(page);
  await page.goto('/fr/tools/za-plus-value/', { waitUntil: 'domcontentloaded' });
  await page.locator('#za-cgt-scope').check();
  await page.locator('[data-za-cgt-app] form button[type="submit"]').click();
  await expect(page.locator('[data-result]')).toBeVisible();
  await expect(page.locator('[data-result]')).toContainText(/gain|capital|imposable/i);
  await page.locator('[data-copy]').click();
  await clickAndParse(page, '[data-download]', 'txt');
  await expectResponsiveAndAccessible(page, '[data-za-cgt-app]');
  expect(watched.privateWrites).toEqual([]);
  expect(watched.errors).toEqual([]);
});

test('French backup-power app calculates locally and reopens TXT while print/PDF remains local', async ({ page }) => {
  await blockExternalRequests(page);
  const watched = watchPage(page);
  await page.goto('/fr/tools/couts-secours-energie/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#bpGenerator')).toContainText(/114[\s.,\u00a0]*000/);
  await expect(page.locator('#bpBattery')).toContainText(/54[\s.,\u00a0]*470/);
  await expect(page.locator('#bpSolar')).toContainText(/35[\s.,\u00a0]*000/);
  await page.locator('#bpCopy').click();
  await clickAndParse(page, '#bpDownload', 'txt');
  await page.evaluate(() => { window.__printCalled = false; window.print = () => { window.__printCalled = true; }; });
  await page.locator('#bpPrint').click();
  expect(await page.evaluate(() => window.__printCalled)).toBe(true);
  await expectResponsiveAndAccessible(page, '#bpPlanner');
  expect(watched.privateWrites).toEqual([]);
  expect(watched.errors).toEqual([]);
});
