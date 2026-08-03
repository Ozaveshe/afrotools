const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

const ROOT = path.resolve(__dirname, '../..');
const TODAY = new Date().toISOString().slice(0, 10);

const apps = [
  {
    id: 'savings-goal',
    route: '/sw/zana/lengo-la-akiba/',
    pageRoot: '.sgv-page',
    form: '#sgv-form',
    results: '#sgv-results',
    status: '#sgv-status',
    error: '#sgv-error',
    submit: 'button[type="submit"]',
    actions: ['#sgv-copy', '#sgv-csv', '#sgv-json', '#sgv-pdf'],
    copy: '#sgv-copy',
    csv: '#sgv-csv',
    json: '#sgv-json',
    pdf: '#sgv-pdf',
    values: {
      '#sgv-currency': 'KES',
      '#sgv-goal': '3000',
      '#sgv-current': '1000',
      '#sgv-contribution': '500',
      '#sgv-months': '4',
      '#sgv-rate': '0',
      '#sgv-source': 'Mpango wa sifuri uliokaguliwa',
      '#sgv-date': TODAY
    },
    lastInput: '#sgv-date',
    invalid: ['#sgv-goal', '-1'],
    readyStatus: 'Mpango uko tayari. Hakuna taarifa iliyoondoka kwenye kivinjari.',
    changedStatus: 'Taarifa zimebadilika. Kokotoa tena.',
    invalidError: 'Tumia lengo zaidi ya sifuri na akiba pamoja na mchango usio hasi.',
    resetSelectors: ['#sgv-ending', '#sgv-required'],
    oracles: [
      ['#sgv-ending', /3,000/],
      ['#sgv-contributed', /3,000/],
      ['#sgv-growth', /0(?:\.00)?/],
      ['#sgv-gap', /0(?:\.00)?/],
      ['#sgv-required', /500/],
      ['#sgv-progress-label', '100.0%']
    ],
    csvRows: 3,
    csvOracle: (rows) => expect(rows.at(-1)).toEqual(['4', '3000', '3000']),
    jsonRoot: 'plan',
    jsonOracle: (value) => {
      expect(value.endingBalance).toBe(3000);
      expect(value.requiredMonthlyContribution).toBe(500);
      expect(value.modeledGrowth).toBe(0);
      expect(value.timeline).toEqual([
        expect.objectContaining({ month: 0, balance: 1000 }),
        expect.objectContaining({ month: 4, balance: 3000 })
      ]);
    },
    copyText: 'Mpango wa lengo la akiba',
    copyOracle: /3,000/,
    pdfText: 'Mpango wa lengo la akiba',
    pdfOracle: /3[\s,.]?000/,
    artwork: 'savings-goal.webp',
    hero: {
      title: '.sgv-hero h1',
      text: ['.sgv-kicker', '.sgv-hero h1', '.sgv-lead', '.sgv-badge', '.sgv-langs', '.sgv-langs a']
    }
  },
  {
    id: 'car-loan',
    route: '/sw/zana/mkopo-wa-gari/',
    pageRoot: '.cl-page',
    form: '#cl-form',
    results: '#cl-results',
    status: '#cl-status',
    error: '#cl-error',
    submit: 'button[type="submit"]',
    actions: ['#cl-copy', '#cl-csv', '#cl-json', '#cl-pdf'],
    copy: '#cl-copy',
    csv: '#cl-csv',
    json: '#cl-json',
    pdf: '#cl-pdf',
    values: {
      '#cl-currency': 'KES',
      '#cl-price': '12000',
      '#cl-deposit': '2000',
      '#cl-trade': '0',
      '#cl-fees': '0',
      '#cl-rate': '0',
      '#cl-months': '10',
      '#cl-balloon': '0',
      '#cl-income': '5000',
      '#cl-debts': '500',
      '#cl-insurance': '100',
      '#cl-fuel': '200',
      '#cl-maintenance': '50',
      '#cl-other': '50',
      '#cl-source': 'Ofa ya majaribio iliyokaguliwa',
      '#cl-date': TODAY
    },
    lastInput: '#cl-date',
    invalid: ['#cl-price', '-1'],
    readyStatus: 'Mpango wa mkopo uko tayari. Hakuna taarifa iliyoondoka kwenye kivinjari.',
    changedStatus: 'Taarifa zimebadilika. Kokotoa tena.',
    invalidError: 'Weka kiasi kisicho hasi na bei ya gari zaidi ya sifuri.',
    resetSelectors: ['#cl-principal', '#cl-payment'],
    oracles: [
      ['#cl-principal', /10,000/],
      ['#cl-payment', /1,000/],
      ['#cl-finance', /0(?:\.00)?/],
      ['#cl-operating', /400/],
      ['#cl-monthly-total', /1,400/],
      ['#cl-outlay', /16,000/],
      ['#cl-debt-load', '30.0%'],
      ['#cl-cash-after', /3,100/]
    ],
    csvRows: 11,
    csvOracle: (rows) => expect(rows.at(-1)).toEqual(['10', '1000', '1000', '0', '0']),
    jsonRoot: 'plan',
    jsonOracle: (value) => {
      expect(value.principal).toBe(10000);
      expect(value.monthlyPayment).toBe(1000);
      expect(value.monthlyOperatingCost).toBe(400);
      expect(value.debtLoadPercent).toBe(30);
      expect(value.schedule).toHaveLength(10);
      expect(value.schedule.at(-1).balance).toBe(0);
    },
    copyText: 'Mpango wa gharama ya mkopo wa gari',
    copyOracle: /1,000/,
    pdfText: 'Mpango wa gharama ya mkopo wa gari',
    pdfOracle: /1[\s,.]?000/,
    artwork: 'car-loan.webp',
    hero: {
      title: '.cl-hero h1',
      text: ['.cl-kicker', '.cl-hero h1', '.cl-lead', '.cl-badge', '.cl-langs', '.cl-langs a']
    }
  },
  {
    id: 'bank-charges',
    route: '/sw/zana/ada-za-benki/',
    pageRoot: '.bco-page',
    form: '#bco-form',
    results: '#bco-results',
    status: '#bco-status',
    error: '#bco-error',
    submit: 'button[type="submit"]',
    actions: ['#bco-copy', '#bco-csv', '#bco-json', '#bco-pdf'],
    copy: '#bco-copy',
    csv: '#bco-csv',
    json: '#bco-json',
    pdf: '#bco-pdf',
    values: {
      '#bco-currency': 'KES',
      '#bco-label': 'Ada za Julai',
      '#bco-transfers': '10',
      '#bco-atm-count': '2',
      '#bco-message-count': '10',
      '#bco-international-spend': '10000',
      '#bco-name-a': 'Benki A',
      '#bco-monthly-a': '100',
      '#bco-transfer-a': '10',
      '#bco-atm-a': '20',
      '#bco-message-a': '0',
      '#bco-card-a': '0',
      '#bco-international-a': '2',
      '#bco-other-a': '0',
      '#bco-source-a': 'Jedwali A',
      '#bco-date-a': TODAY,
      '#bco-name-b': 'Benki B',
      '#bco-monthly-b': '50',
      '#bco-transfer-b': '5',
      '#bco-atm-b': '25',
      '#bco-message-b': '0',
      '#bco-card-b': '0',
      '#bco-international-b': '1.5',
      '#bco-other-b': '0',
      '#bco-source-b': 'Jedwali B',
      '#bco-date-b': TODAY
    },
    lastInput: '#bco-date-b',
    invalid: ['#bco-transfer-a', '-1'],
    readyStatus: 'Ulinganisho uko tayari. Hakuna taarifa iliyoondoka kwenye kivinjari.',
    changedStatus: 'Taarifa zimebadilika. Linganisha tena.',
    invalidError: 'Weka ada zisizo hasi na asilimia ya kimataifa kutoka 0% hadi 100%.',
    resetSelectors: ['#bco-a-monthly', '#bco-b-monthly'],
    oracles: [
      ['#bco-a-monthly', /440/],
      ['#bco-b-monthly', /300/],
      ['#bco-difference', /140/],
      ['#bco-a-annual', /5,280/],
      ['#bco-b-annual', /3,600/],
      ['#bco-lower', 'Gharama iliyokokotolewa ya chini: Benki B']
    ],
    csvRows: 9,
    csvOracle: (rows) => expect(rows.at(-1)).toEqual([
      'Jumla ya mwezi iliyokokotolewa', '440', '300'
    ]),
    jsonRoot: 'comparison',
    jsonOracle: (value) => {
      expect(value.offerA.monthlyTotal).toBe(440);
      expect(value.offerA.annualTotal).toBe(5280);
      expect(value.offerB.monthlyTotal).toBe(300);
      expect(value.offerB.annualTotal).toBe(3600);
      expect(value.monthlyDifference).toBe(140);
      expect(value.lowerModeledCost).toBe('B');
    },
    copyText: 'Ulinganisho wa ada za benki',
    copyOracle: /440/,
    pdfText: 'Ulinganisho wa ada za benki',
    pdfOracle: /440/,
    artwork: 'bank-charges.webp',
    hero: {
      title: '.bco-hero h1',
      text: ['.bco-kicker', '.bco-hero h1', '.bco-lead', '.bco-badge', '.bco-langs', '.bco-langs a']
    }
  }
];

async function openPrivate(page, context, app, viewport = { width: 375, height: 900 }) {
  await page.setViewportSize(viewport);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  const telemetry = {
    console: [],
    page: [],
    data: [],
    analytics: [],
    failed: [],
    requests: [],
    downloads: []
  };
  page.on('console', (message) => {
    if (message.type() === 'error') telemetry.console.push(message.text());
  });
  page.on('pageerror', (error) => telemetry.page.push(error.message));
  page.on('requestfailed', (request) => telemetry.failed.push(request.url()));
  page.on('download', (download) => telemetry.downloads.push(download.suggestedFilename()));
  page.on('request', (request) => {
    const entry = { url: request.url(), method: request.method(), body: request.postData() };
    telemetry.requests.push(entry);
    if (['xhr', 'fetch', 'websocket'].includes(request.resourceType())) telemetry.data.push(entry);
    if (/^https:\/\/(?:www\.)?(?:googletagmanager\.com|google-analytics\.com)\//i.test(request.url())) {
      telemetry.analytics.push(entry);
    }
  });
  await page.goto(app.route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('script[src^="/assets/js/lazy-analytics.js?v="]')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => window['ga-disable-G-D859CGF391'])).toBe(true);
  expect(await page.evaluate(() => window.__afroAnalyticsConfigured === true)).toBe(false);
  expect(await page.evaluate(() => (window.dataLayer || []).map((entry) => Array.from(entry)))).toEqual([]);
  expect(telemetry.analytics).toEqual([]);
  return telemetry;
}

async function fillValues(page, app) {
  for (const [selector, value] of Object.entries(app.values)) {
    await page.locator(selector).fill(value);
  }
}

async function fillAndSubmit(page, app) {
  await fillValues(page, app);
  await page.locator(app.form).evaluate((form) => form.requestSubmit());
  await expect(page.locator(app.results)).toBeVisible();
  await expect(page.locator(app.results)).toBeFocused();
}

function parseCsv(text) {
  return text.trim().split(/\r?\n/).map((line) => {
    const values = [];
    let value = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"' && quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === ',' && !quoted) {
        values.push(value);
        value = '';
      } else {
        value += character;
      }
    }
    values.push(value);
    return values;
  });
}

async function downloadedText(page, selector) {
  const downloadPromise = page.waitForEvent('download');
  await page.locator(selector).click();
  const download = await downloadPromise;
  const file = await download.path();
  return { text: fs.readFileSync(file, 'utf8'), suggested: download.suggestedFilename() };
}

async function geometry(page, app) {
  return page.evaluate(({ form, results }) => {
    const controls = [...document.querySelectorAll(`${form} input,${form} button,${results} button`)]
      .filter((node) => node.getClientRects().length > 0);
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      controlsInside: controls.every((node) => {
        const box = node.getBoundingClientRect();
        return box.left >= 0 && box.right <= innerWidth;
      }),
      targetsAtLeast44: controls.every((node) => node.getBoundingClientRect().height >= 44)
    };
  }, { form: app.form, results: app.results });
}

async function assertControlAndFocusContrast(page, app, themeLabel) {
  await page.keyboard.press('Tab');
  const snapshot = await page.evaluate(({ pageRoot }) => {
    const parseColor = (value) => {
      const parts = String(value).match(/[\d.]+/g)?.map(Number) || [];
      return {
        red: parts[0] || 0,
        green: parts[1] || 0,
        blue: parts[2] || 0,
        alpha: parts.length > 3 ? parts[3] : 1
      };
    };
    const blend = (front, back) => ({
      red: (front.red * front.alpha) + (back.red * (1 - front.alpha)),
      green: (front.green * front.alpha) + (back.green * (1 - front.alpha)),
      blue: (front.blue * front.alpha) + (back.blue * (1 - front.alpha)),
      alpha: 1
    });
    const luminance = (color) => {
      const channel = (value) => {
        const normalized = value / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      return (0.2126 * channel(color.red))
        + (0.7152 * channel(color.green))
        + (0.0722 * channel(color.blue));
    };
    const contrast = (foreground, background) => {
      const light = Math.max(luminance(foreground), luminance(background));
      const dark = Math.min(luminance(foreground), luminance(background));
      return (light + 0.05) / (dark + 0.05);
    };
    const effectiveBackground = (node) => {
      const chain = [];
      for (let current = node; current instanceof Element; current = current.parentElement) {
        chain.unshift(current);
      }
      return chain.reduce(
        (background, current) => blend(parseColor(getComputedStyle(current).backgroundColor), background),
        { red: 255, green: 255, blue: 255, alpha: 1 }
      );
    };
    const boundaries = [...document.querySelectorAll(`${pageRoot} input`)]
      .filter((node) => node.getClientRects().length > 0)
      .map((node) => {
      const style = getComputedStyle(node);
      const background = effectiveBackground(node);
      const border = blend(parseColor(style.borderTopColor), background);
      return {
        id: node.id,
        ratio: contrast(border, background),
        border: style.borderTopColor,
        background: style.backgroundColor
      };
    });
    const focuses = [...document.querySelectorAll(
      `${pageRoot} input:not([disabled]),${pageRoot} button:not([disabled]),${pageRoot} a[href]`
    )]
      .filter((node) => node.getClientRects().length > 0)
      .map((node) => {
        node.focus();
        const style = getComputedStyle(node);
        const background = effectiveBackground(node.parentElement);
        const outline = blend(parseColor(style.outlineColor), background);
        return {
          name: node.id || node.textContent.trim().slice(0, 60) || node.tagName,
          ratio: contrast(outline, background),
          style: style.outlineStyle,
          width: Number.parseFloat(style.outlineWidth),
          outline: style.outlineColor
        };
      });
    return { boundaries, focuses };
  }, { pageRoot: app.pageRoot });

  expect(snapshot.boundaries.length, `${app.id} ${themeLabel} must expose visible inputs`).toBeGreaterThan(0);
  for (const boundary of snapshot.boundaries) {
    expect(
      boundary.ratio,
      `${app.id} ${themeLabel} #${boundary.id} boundary: ${boundary.border} on ${boundary.background}`
    ).toBeGreaterThanOrEqual(3);
  }
  for (const focus of snapshot.focuses) {
    expect(focus.style, `${app.id} ${themeLabel} ${focus.name} focus style`).not.toBe('none');
    expect(focus.width, `${app.id} ${themeLabel} ${focus.name} focus width`).toBeGreaterThanOrEqual(2);
    expect(
      focus.ratio,
      `${app.id} ${themeLabel} ${focus.name} focus contrast for ${focus.outline}`
    ).toBeGreaterThanOrEqual(3);
  }
  expect(snapshot.focuses.length, `${app.id} ${themeLabel} must expose keyboard focus targets`).toBeGreaterThan(0);
}

async function assertHeroContrast(page, app, themeLabel) {
  const snapshot = await page.evaluate(({ title, text: selectors }) => {
    const parseColor = (value) => {
      const parts = String(value).match(/[\d.]+/g)?.map(Number) || [];
      return {
        red: parts[0] || 0,
        green: parts[1] || 0,
        blue: parts[2] || 0,
        alpha: parts.length > 3 ? parts[3] : 1
      };
    };
    const blend = (front, back) => ({
      red: (front.red * front.alpha) + (back.red * (1 - front.alpha)),
      green: (front.green * front.alpha) + (back.green * (1 - front.alpha)),
      blue: (front.blue * front.alpha) + (back.blue * (1 - front.alpha)),
      alpha: 1
    });
    const effectiveBackground = (node) => {
      const chain = [];
      for (let current = node; current instanceof Element; current = current.parentElement) {
        chain.unshift(current);
      }
      return chain.reduce(
        (background, current) => blend(parseColor(getComputedStyle(current).backgroundColor), background),
        { red: 255, green: 255, blue: 255, alpha: 1 }
      );
    };
    const luminance = (color) => {
      const channel = (value) => {
        const normalized = value / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      return (0.2126 * channel(color.red))
        + (0.7152 * channel(color.green))
        + (0.0722 * channel(color.blue));
    };
    const contrast = (foreground, background) => {
      const light = Math.max(luminance(foreground), luminance(background));
      const dark = Math.min(luminance(foreground), luminance(background));
      return (light + 0.05) / (dark + 0.05);
    };
    const nodes = [...new Set(selectors.flatMap((selector) => [...document.querySelectorAll(selector)]))];
    const samples = nodes.map((node) => {
      const style = getComputedStyle(node);
      const background = effectiveBackground(node);
      const foreground = blend(parseColor(style.color), background);
      const box = node.getBoundingClientRect();
      return {
        selector: node.matches(title) ? title : node.className,
        text: node.textContent.trim(),
        visible: style.display !== 'none'
          && style.visibility !== 'hidden'
          && Number(style.opacity) > 0
          && box.width > 0
          && box.height > 0,
        ratio: contrast(foreground, background),
        width: box.width,
        height: box.height,
        foreground: style.color,
        background: `rgb(${background.red}, ${background.green}, ${background.blue})`
      };
    });
    const heading = samples.find((sample) => sample.selector === title);
    return { heading, samples };
  }, app.hero);

  expect(snapshot.heading, `${app.id} ${themeLabel} H1 must exist`).toBeTruthy();
  expect(snapshot.heading.text, `${app.id} ${themeLabel} H1 must contain visible text`).not.toBe('');
  expect(snapshot.heading.width, `${app.id} ${themeLabel} H1 width`).toBeGreaterThan(0);
  expect(snapshot.heading.height, `${app.id} ${themeLabel} H1 height`).toBeGreaterThan(0);
  for (const sample of snapshot.samples) {
    expect(sample.text, `${app.id} ${themeLabel} hero text must not be empty`).not.toBe('');
    expect(sample.visible, `${app.id} ${themeLabel} hidden hero text: ${sample.selector}`).toBe(true);
    expect(
      sample.ratio,
      `${app.id} ${themeLabel} ${sample.selector}: ${sample.foreground} on ${sample.background}`
    ).toBeGreaterThanOrEqual(4.5);
  }
}

for (const app of apps) {
  test(`${app.id}: shared engine gives exact valid, boundary and invalid-state oracles`, async ({ page, context }) => {
    const telemetry = await openPrivate(page, context, app);
    await fillAndSubmit(page, app);
    for (const [selector, expected] of app.oracles) {
      await expect(page.locator(selector)).toHaveText(expected);
    }
    await expect(page.locator(app.status)).toHaveText(app.readyStatus);
    expect((await page.locator(`${app.results},${app.status},${app.error}`).allInnerTexts()).join(' '))
      .not.toMatch(/\b(?:Plan ready|Loan plan ready|Comparison ready|Inputs changed|Local export|Calculate a current|Create a current)\b/i);
    for (const selector of app.actions) await expect(page.locator(selector)).toBeEnabled();

    await page.locator(app.invalid[0]).fill(app.invalid[1]);
    await expect(page.locator(app.results)).toBeHidden();
    await expect(page.locator(app.status)).toHaveText(app.changedStatus);
    for (const selector of app.resetSelectors) await expect(page.locator(selector)).toHaveText('--');
    for (const selector of app.actions) await expect(page.locator(selector)).toBeDisabled();
    await page.locator(app.form).evaluate((form) => form.requestSubmit());
    await expect(page.locator(app.results)).toBeHidden();
    await expect(page.locator(app.error)).toHaveText(app.invalidError);
    for (const selector of app.resetSelectors) await expect(page.locator(selector)).toHaveText('--');

    await page.evaluate(() => navigator.clipboard.writeText('sentinel'));
    for (const selector of app.actions) {
      await page.locator(selector).evaluate((button) => button.click());
    }
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('sentinel');
    await expect(page.locator(app.results)).toBeHidden();
    expect(telemetry.downloads).toEqual([]);
    expect(telemetry.data).toEqual([]);
    expect(telemetry.analytics).toEqual([]);
    expect(telemetry.failed).toEqual([]);
    expect(telemetry.console).toEqual([]);
    expect(telemetry.page).toEqual([]);
  });

  test(`${app.id}: copy, CSV, JSON and PDF exports are parsed and reopened locally`, async ({ page, context }) => {
    const telemetry = await openPrivate(page, context, app);
    const storageBefore = await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
      url: location.href
    }));
    await fillAndSubmit(page, app);

    await page.locator(app.copy).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain(app.copyText);
    expect(copied).toMatch(app.copyOracle);
    expect(copied.split('\n').length).toBeGreaterThan(3);

    const csv = await downloadedText(page, app.csv);
    const reopenedCsv = parseCsv(csv.text);
    expect(csv.suggested).toMatch(/\.csv$/);
    expect(reopenedCsv).toHaveLength(app.csvRows);
    expect(reopenedCsv[0].length).toBeGreaterThan(2);
    expect(reopenedCsv.every((row) => row.length === reopenedCsv[0].length)).toBe(true);
    app.csvOracle(reopenedCsv);

    const json = await downloadedText(page, app.json);
    const reopenedJson = JSON.parse(json.text);
    expect(json.suggested).toMatch(/\.json$/);
    expect(reopenedJson.schemaVersion).toBe(1);
    app.jsonOracle(reopenedJson[app.jsonRoot]);

    const pdfPromise = page.waitForEvent('download');
    await page.locator(app.pdf).click();
    const pdfDownload = await pdfPromise;
    expect(pdfDownload.suggestedFilename()).toMatch(/\.pdf$/);
    const parsedPdf = await pdfParse(fs.readFileSync(await pdfDownload.path()));
    const reopenedPdf = parsedPdf.text.replace(/\s+/g, ' ');
    expect(reopenedPdf).toContain(app.pdfText);
    expect(reopenedPdf).toMatch(app.pdfOracle);
    expect(telemetry.downloads).toEqual([
      csv.suggested,
      json.suggested,
      pdfDownload.suggestedFilename()
    ]);

    const storageAfter = await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
      url: location.href
    }));
    expect(storageAfter).toEqual(storageBefore);
    const sensitiveValues = Object.values(app.values).filter((value) => value.length > 8);
    for (const request of telemetry.requests) {
      for (const value of sensitiveValues) {
        expect(request.url).not.toContain(encodeURIComponent(value));
        expect(request.body || '').not.toContain(value);
      }
      expect(request.method).toBe('GET');
    }
    expect(telemetry.data).toEqual([]);
    expect(telemetry.analytics).toEqual([]);
    expect(telemetry.failed).toEqual([]);
    expect(telemetry.console).toEqual([]);
    expect(telemetry.page).toEqual([]);
  });
}

for (const app of apps) {
  for (const viewport of [
    { name: '320px light', width: 320, height: 800, scheme: 'light' },
    { name: '375px dark', width: 375, height: 900, scheme: 'dark' }
  ]) {
    test(`${app.id}: ${viewport.name} reflows without clipping`, async ({ page, context }) => {
      await page.emulateMedia({ colorScheme: viewport.scheme, reducedMotion: 'reduce' });
      const telemetry = await openPrivate(page, context, app, viewport);
      await assertHeroContrast(page, app, `system-${viewport.scheme}`);
      await fillAndSubmit(page, app);
      await assertControlAndFocusContrast(page, app, `system-${viewport.scheme}`);
      expect(await geometry(page, app)).toEqual({
        overflow: 0,
        controlsInside: true,
        targetsAtLeast44: true
      });
      expect(telemetry.console).toEqual([]);
      expect(telemetry.page).toEqual([]);
      expect(telemetry.analytics).toEqual([]);
    });
  }
}

for (const app of apps) {
  test(`${app.id}: 200 percent reflow, themes, labels and keyboard flow remain usable`, async ({ page, context }) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    const telemetry = await openPrivate(page, context, app);
    await assertHeroContrast(page, app, 'system-light');
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await geometry(page, app)).toEqual({
      overflow: 0,
      controlsInside: true,
      targetsAtLeast44: true
    });
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.setViewportSize({ width: 1280, height: 900 });

    const inputs = page.locator(`${app.form} input`);
    const labels = page.locator(`${app.form} label`);
    expect(await labels.count()).toBe(await inputs.count());
    await expect(page.locator(app.status)).toHaveAttribute('role', 'status');
    await expect(page.locator(app.status)).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator(app.error)).toHaveAttribute('role', 'alert');

    await fillValues(page, app);
    await page.locator(app.lastInput).focus();
    const submit = page.locator(`${app.form} ${app.submit}`);
    for (let step = 0; step < 5 && !(await submit.evaluate((node) => node === document.activeElement)); step += 1) {
      await page.keyboard.press('Tab');
    }
    await expect(submit).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator(app.results)).toBeFocused();

    const themeToggle = page.locator('.theme-toggle');
    await expect(themeToggle).toBeVisible();
    await page.waitForFunction(() => window.AfroTools?.darkMode?.set);
    await page.evaluate(() => window.AfroTools.darkMode.set('dark'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme-choice', 'dark');
    await assertHeroContrast(page, app, 'manual-dark');
    await assertControlAndFocusContrast(page, app, 'manual-dark');
    const dark = await page.locator(app.form).evaluate((node) => getComputedStyle(node).backgroundColor);
    await page.evaluate(() => window.AfroTools.darkMode.set('light'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveAttribute('data-theme-choice', 'light');
    await assertHeroContrast(page, app, 'manual-light');
    await assertControlAndFocusContrast(page, app, 'manual-light');
    const light = await page.locator(app.form).evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(dark).not.toBe(light);
    await page.evaluate(() => window.AfroTools.darkMode.set('auto'));
    await expect(page.locator('html')).toHaveAttribute('data-theme-choice', 'auto');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await assertHeroContrast(page, app, 'system-light-restored');
    await assertControlAndFocusContrast(page, app, 'system-light-restored');
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(telemetry.analytics).toEqual([]);
  });
}

test('shared English, French and Hausa consumers retain the contrast-safe owners', async ({ page }) => {
  const consumers = [
    { id: 'savings-goal en', route: '/tools/savings-goal/', pageRoot: '.sgv-page' },
    { id: 'savings-goal fr', route: '/fr/tools/objectif-epargne/', pageRoot: '.sgv-page' },
    { id: 'car-loan en', route: '/tools/car-loan/', pageRoot: '.cl-page' },
    { id: 'car-loan fr', route: '/fr/tools/pret-automobile/', pageRoot: '.cl-page' },
    { id: 'bank-charges en', route: '/tools/bank-charges/', pageRoot: '.bco-page' },
    { id: 'bank-charges fr', route: '/fr/tools/frais-bancaires/', pageRoot: '.bco-page' },
    { id: 'bank-charges ha', route: '/ha/kayan-aiki/cajin-banki/', pageRoot: '.bco-page' }
  ];
  for (const consumer of consumers) {
    for (const scheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      await page.goto(consumer.route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator(consumer.pageRoot)).toBeVisible();
      await assertControlAndFocusContrast(page, consumer, `shared-system-${scheme}`);
    }
  }
});

test('all three routes expose self-owned SEO, reciprocal hreflang, schema and artwork', async ({ page }) => {
  for (const app of apps) {
    await page.goto(app.route, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://afrotools.com${app.route}`
    );
    for (const locale of ['en', 'fr', 'sw', 'x-default']) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${locale}"]`)).toHaveCount(1);
    }
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      `https://afrotools.com${app.route}`
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      `https://afrotools.com/assets/img/tools/${app.artwork}`
    );
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    const schemaNodes = schemas.flatMap((value) => {
      const parsed = JSON.parse(value);
      return parsed['@graph'] || [parsed];
    });
    expect(schemaNodes).toEqual(expect.arrayContaining([
      expect.objectContaining({ '@type': 'WebApplication', inLanguage: 'sw' })
    ]));
    expect(fs.existsSync(path.join(ROOT, `assets/img/tools/${app.artwork}`))).toBe(true);
  }
});
