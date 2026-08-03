const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');
const AXE_PATH = require.resolve('axe-core/axe.min.js');

const CASES = [
  {
    id: 'bi-paye',
    country: 'burundi',
    englishRoute: '/burundi/bi-paye.html',
    gross: 500000,
    expected: { tax: 84600, employeeSocial: 18000, net: 397400, employerCost: 529400 },
    fields: { tax: 'monthlyPAYE', employeeSocial: 'social|rssb', net: 'netMonthly', employerCost: 'totalEmployerCostMonthly' },
    aiContext: [/450,000/, /80,000/, /4%/, /6%/, /3%/],
    officialSources: ['https://obr.gov.bi', 'https://inss.gov.bi/calcul-des-cotisations/'],
  },
  {
    id: 'rw-paye',
    country: 'rwanda',
    englishRoute: '/rwanda/rw-paye.html',
    gross: 300000,
    expected: { tax: 48600, employeeSocial: 19157, net: 231343, employerCost: 324900 },
    fields: { tax: 'monthlyPAYE', employeeSocial: 'social|rssb', net: 'netMonthly', employerCost: 'totalEmployerCostMonthly' },
    aiContext: [/6%/, /0\.3%/, /CBHI/, /0\.5%/, /mshahara halisi/i, /hatari ya kazi/i, /2%/, /48,600/, /1,157/, /231,343/],
    officialSources: [
      'https://rra.gov.rw',
      'https://www.rssb.rw/scheme/cbhi-scheme',
      'https://www.rssb.rw/fileadmin/user_upload/Announcement_to_all_employers_.pdf',
      'https://www.rssb.rw/fileadmin/user_upload/Prime_Minister_s_order_CBHI-subsidies_13th_February_2020.pdf',
      'https://www.rssb.rw/scheme/occupational-hazards',
    ],
  },
  {
    id: 'ug-paye',
    country: 'uganda',
    englishRoute: '/uganda/ug-paye.html',
    gross: 2000000,
    officialOracle: true,
    expected: { tax: 472000, employeeSocial: 100000, net: 1328000, employerCost: 2200000 },
    fields: { tax: 'monthlyPAYE', employeeSocial: 'social|nssf', net: 'netMonthly', employerCost: 'totalEmployerCostMonthly' },
    aiContext: [/haipunguzi PAYE/, /LST ya mwaka iliyotathminiwa/, /Mshahara ghafi/, /1,900,000/, /472,000/],
    officialSources: [
      'https://ura.go.ug/en/domestic-taxes/paye-rates/',
      'https://ura.go.ug/en/taxes-on-employment-income/',
      'https://kcca.go.ug/uDocs/Local_Service_Tax_FAQs.pdf',
      'https://www.nssfug.org/about-us/membership/',
    ],
  },
];

async function pickResult(page, fields) {
  return page.evaluate((fieldMap) => Object.fromEntries(
    Object.entries(fieldMap).map(([label, candidates]) => {
      const field = candidates.split('|').find((candidate) => Number.isFinite(window.RESULT?.[candidate]));
      return [label, field ? window.RESULT[field] : null];
    }),
  ), fields);
}

async function assertNoHorizontalOverflow(page, label) {
  const proof = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const offenders = [...document.body.querySelectorAll('*')]
      .filter((element) => {
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        if (element.matches('.skip-link:not(:focus),.skip-main:not(:focus)')) return false;
        const box = element.getBoundingClientRect();
        return box.width > 0 && (box.left < -1 || box.right > viewport + 1);
      })
      .map((element) => {
        const box = element.getBoundingClientRect();
        return `${element.tagName.toLowerCase()}#${element.id || ''}.${String(element.className || '').replace(/\s+/g, '.')}:${box.left.toFixed(1)}..${box.right.toFixed(1)}`;
      });
    const wideContainers = [...document.body.querySelectorAll('*')]
      .filter((element) => element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1)
      .map((element) => `${element.tagName.toLowerCase()}#${element.id || ''}.${String(element.className || '').replace(/\s+/g, '.')}:${element.clientWidth}->${element.scrollWidth}`)
      .slice(0, 30);
    return {
      root: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      body: document.body.scrollWidth - document.body.clientWidth,
      offenders,
      wideContainers,
    };
  });
  expect(proof.root, `${label}: ${JSON.stringify(proof)}`).toBeLessThanOrEqual(1);
  expect(proof.body, `${label}: ${JSON.stringify(proof)}`).toBeLessThanOrEqual(1);
  expect(proof.offenders, `${label}: ${JSON.stringify(proof)}`).toEqual([]);
}

async function assertSequentialInputKeyboard(page, label) {
  const inputCard = page.locator('#grossSalary').locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " card ")][1]');
  const controls = inputCard.locator(':is(input:not([type="hidden"]),button,[tabindex="0"]):visible:not([disabled])');
  const count = await controls.count();
  expect(count, `${label} keyboard controls`).toBeGreaterThanOrEqual(6);
  await controls.first().focus();
  for (let index = 0; index < count - 1; index += 1) {
    await expect(controls.nth(index), `${label} focus ${index}`).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(controls.nth(index + 1), `${label} focus ${index + 1}`).toBeFocused();
  }
}

async function assertAxe(page, label) {
  await page.addScriptTag({ path: AXE_PATH });
  const results = await page.evaluate(async () => window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  }));
  const violations = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.slice(0, 5).map((node) => node.target),
  }));
  expect(violations, `${label} axe violations`).toEqual([]);
}

async function measureComputedContrast(page) {
  return page.evaluate(() => {
    const parseColor = (value) => {
      const parts = value.match(/[\d.]+/g);
      if (!parts) return null;
      const [red, green, blue, alpha = 1] = parts.map(Number);
      return { red, green, blue, alpha };
    };
    const composite = (foreground, background) => ({
      red: foreground.red * foreground.alpha + background.red * (1 - foreground.alpha),
      green: foreground.green * foreground.alpha + background.green * (1 - foreground.alpha),
      blue: foreground.blue * foreground.alpha + background.blue * (1 - foreground.alpha),
      alpha: 1,
    });
    const effectiveBackground = (element) => {
      const chain = [];
      for (let current = element; current; current = current.parentElement) chain.unshift(current);
      return chain.reduce((background, current) => {
        const color = parseColor(getComputedStyle(current).backgroundColor);
        return color && color.alpha > 0 ? composite(color, background) : background;
      }, { red: 255, green: 255, blue: 255, alpha: 1 });
    };
    const luminance = ({ red, green, blue }) => {
      const values = [red, green, blue].map((channel) => {
        const value = channel / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
    };
    const ratio = (first, second) => {
      const firstLuminance = luminance(first);
      const secondLuminance = luminance(second);
      return (Math.max(firstLuminance, secondLuminance) + 0.05)
        / (Math.min(firstLuminance, secondLuminance) + 0.05);
    };
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const describe = (element) => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.className ? `.${String(element.className).trim().replace(/\s+/g, '.')}` : ''}`;
    const collectText = (selector) => [...document.querySelectorAll(selector)]
      .filter(visible)
      .map((element) => {
        const style = getComputedStyle(element);
        const foreground = parseColor(style.color);
        const background = effectiveBackground(element);
        return { element: describe(element), text: element.textContent.trim().slice(0, 80), ratio: ratio(foreground, background), foreground, background };
      });
    const collectBoundaries = (selector) => [...document.querySelectorAll(selector)]
      .filter(visible)
      .map((element) => {
        const style = getComputedStyle(element);
        const sides = ['Top', 'Right', 'Bottom', 'Left'];
        const side = sides.find((name) => style[`border${name}Style`] !== 'none' && parseFloat(style[`border${name}Width`]) >= 1);
        if (!side) return null;
        const boundary = parseColor(style[`border${side}Color`]);
        const adjacent = effectiveBackground(element.parentElement || element);
        return { element: describe(element), ratio: ratio(boundary, adjacent), boundary, adjacent };
      })
      .filter(Boolean);

    const fullSurfaceText = [...document.body.querySelectorAll('*')]
      .filter(visible)
      .filter((element) => !/^(SCRIPT|STYLE|NOSCRIPT|SVG|PATH|CANVAS|OPTION)$/.test(element.tagName))
      .filter((element) => [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()))
      .map((element) => {
        const style = getComputedStyle(element);
        const foreground = parseColor(style.color);
        const background = effectiveBackground(element);
        return { element: describe(element), text: element.textContent.trim().slice(0, 80), ratio: ratio(foreground, background), foreground, background };
      });
    const text = fullSurfaceText.concat(collectText('input,select,textarea'));
    const boundaries = collectBoundaries([
      '.tool-hero .badge', '.card-head', '.sec-btn', '.per-btn', '.chart-tab', '.preset-btn',
      '.tog', '.f-wrap', '.f-input', '.chat-in', '.chat-send', '.act-btn', '.tool-info-card', '.tool-info-header',
      '.tool-info-footer', '.tool-feat', '.tool-info-action',
      'input', 'select', 'textarea', 'button', '[role="button"]', '[role="switch"]',
      '.faq-item', '.ng-guide-card', '.ai-response', '.chat-area', '.res-row', '.rate-bar', '.amendment-bar',
    ].join(','));
    return {
      textMin: Math.min(...text.map((entry) => entry.ratio)),
      boundaryMin: Math.min(...boundaries.map((entry) => entry.ratio)),
      textFailures: text.filter((entry) => entry.ratio < 4.5),
      boundaryFailures: boundaries.filter((entry) => entry.ratio < 3),
    };
  });
}

async function assertComputedContrast(page, label) {
  const proof = await measureComputedContrast(page);
  expect(
    proof.textFailures.slice(0, 40),
    `${label} text minimum ${proof.textMin.toFixed(2)}:1; failures=${proof.textFailures.length}`,
  ).toEqual([]);
  expect(
    proof.boundaryFailures.slice(0, 40),
    `${label} boundary minimum ${proof.boundaryMin.toFixed(2)}:1; failures=${proof.boundaryFailures.length}`,
  ).toEqual([]);

  const focusRatios = [];
  for (const selector of ['#grossSalary', '.calc-btn', '.sec-btn:not(.on)', '.preset-btn', '[data-tog]', '.bands-card .card-head', '.act-pdf', '.act-share', '.tool-info-action']) {
    const control = page.locator(selector).first();
    if (!await control.isVisible()) continue;
    await control.focus();
    const focus = await control.evaluate((element) => {
      const parseColor = (value) => {
        const parts = value.match(/[\d.]+/g);
        const [red, green, blue] = parts.map(Number);
        return { red, green, blue };
      };
      const luminance = ({ red, green, blue }) => [red, green, blue]
        .map((channel) => {
          const value = channel / 255;
          return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        })
        .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
      const style = getComputedStyle(element);
      const parent = getComputedStyle(element.parentElement || element);
      const first = luminance(parseColor(style.outlineColor));
      const shadow = style.boxShadow === 'none' ? null : parseColor(style.boxShadow);
      const second = luminance(parseColor(parent.backgroundColor === 'rgba(0, 0, 0, 0)' ? getComputedStyle(document.body).backgroundColor : parent.backgroundColor));
      const outlineRatio = (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
      const shadowLuminance = shadow ? luminance(shadow) : null;
      const shadowRatio = shadowLuminance === null ? 0 : (Math.max(shadowLuminance, second) + 0.05) / (Math.min(shadowLuminance, second) + 0.05);
      return {
        ratio: Math.max(outlineRatio, shadowRatio),
        style: style.outlineStyle,
        width: parseFloat(style.outlineWidth),
        outlineColor: style.outlineColor,
        parentBackground: parent.backgroundColor,
        theme: document.documentElement.getAttribute('data-theme'),
        inResultActions: Boolean(element.closest('#resultsCard .sw-paye-action-row')),
        opacityChain: (() => {
          const values = [];
          for (let current = element; current; current = current.parentElement) {
            const opacity = getComputedStyle(current).opacity;
            if (opacity !== '1') values.push(`${current.tagName.toLowerCase()}${current.id ? `#${current.id}` : ''}:${opacity}`);
          }
          return values;
        })(),
      };
    });
    expect(focus.style, `${label} ${selector} focus style`).toBe('solid');
    expect(focus.width, `${label} ${selector} focus width`).toBeGreaterThanOrEqual(2);
    expect(focus.ratio, `${label} ${selector} focus contrast ${JSON.stringify(focus)}`).toBeGreaterThanOrEqual(3);
    focusRatios.push(focus.ratio);
  }
  return { ...proof, focusMin: Math.min(...focusRatios) };
}

for (const payeCase of CASES) {
  test(`${payeCase.id} matches its independent oracle and fails closed`, async ({ page, context }) => {
    const errors = [];
    const failedLocalResources = [];
    const mutations = [];
    const aiPayloads = [];
    const popups = [];
    let acceptNextConfirm = false;

    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('requestfailed', (request) => {
      if (/^http:\/\/127\.0\.0\.1:\d+\//.test(request.url())) {
        failedLocalResources.push(`${request.url()} ${request.failure()?.errorText || ''}`.trim());
      }
    });
    page.on('request', (request) => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        mutations.push(`${request.method()} ${request.url()}`);
      }
    });
    page.on('popup', (popup) => popups.push(popup));
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'confirm' && acceptNextConfirm) {
        acceptNextConfirm = false;
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
    await page.route('**/.netlify/functions/ai-advisor', async (route) => {
      aiPayloads.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reply: 'Uchambuzi wa Kiswahili wa majaribio.' }),
      });
    });
    await context.addInitScript(() => {
      const NativeBlob = window.Blob;
      window.Blob = class AfroProofBlob extends NativeBlob {
        constructor(parts, options) {
          super(parts, options);
          window.__afroLastBlobText = (parts || []).map((part) => String(part)).join('');
        }
      };
      window.print = () => {
        window.__afroPrintCalled = true;
      };
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (payload) => { window.__afroSharePayload = payload; },
      });
    });

    await page.setViewportSize({ width: 320, height: 760 });
    await page.goto(payeCase.englishRoute, { waitUntil: 'load' });
    let englishOracle = payeCase.expected;
    if (!payeCase.officialOracle) {
      await page.locator('#grossSalary').fill(String(payeCase.gross));
      await page.locator('button.calc-btn[onclick*="calculate"]').first().click();
      englishOracle = await pickResult(page, payeCase.fields);
      expect(englishOracle).toEqual(payeCase.expected);
    }
    await expect(page.locator(`link[rel="alternate"][hreflang="sw"]`)).toHaveAttribute(
      'href',
      `https://afrotools.com/sw/${payeCase.country}/kikokotoo-kodi-mshahara/`,
    );

    await page.goto(`/sw/${payeCase.country}/kikokotoo-kodi-mshahara/`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://afrotools.com/sw/${payeCase.country}/kikokotoo-kodi-mshahara/`,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      'href',
      `https://afrotools.com${payeCase.englishRoute.replace(/\.html$/, '')}`,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      `https://afrotools.com/assets/img/tools/${payeCase.id}.webp`,
    );
    await expect(page.locator('.act-share-image')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText(/Share as Image|Generating\.\.\./i);
    for (const sourceUrl of payeCase.officialSources) {
      expect(await page.locator(`a[href="${sourceUrl}"]`).count()).toBeGreaterThanOrEqual(1);
    }
    await expect(page.locator('#pdfEmail, form[name="pdf-leads"]')).toHaveCount(0);
    const skipLink = page.locator('.sw-paye-skip-link');
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
    await skipLink.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();

    const gross = page.locator('#grossSalary');
    const calculate = page.locator('button.calc-btn[onclick*="calculate"]').first();
    const pdfAction = page.locator('button[onclick="generatePdf()"][data-no-gate="true"]').first();
    await expect(gross).toHaveAccessibleName(/.+/);
    await expect(calculate).toBeVisible();
    await expect(pdfAction).toHaveCount(1);
    const status = page.locator('#aiStatus');
    await expect(status).toHaveAttribute('role', 'status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).toHaveAttribute('aria-atomic', 'true');
    const firstToggle = page.locator('[data-tog]').first();
    await expect(firstToggle).toHaveAttribute('role', 'switch');
    await expect(firstToggle).toHaveAttribute('tabindex', '0');
    const initialToggleState = await firstToggle.getAttribute('aria-checked');
    expect(['true', 'false']).toContain(initialToggleState);
    await firstToggle.focus();
    await expect(firstToggle).toBeFocused();
    await firstToggle.press('Enter');
    await expect(firstToggle).toHaveAttribute('aria-checked', initialToggleState === 'true' ? 'false' : 'true');
    await firstToggle.press('Space');
    await expect(firstToggle).toHaveAttribute('aria-checked', initialToggleState);
    const firstBandToggle = page.locator('.bands-card .card-head').first();
    await expect(firstBandToggle).toHaveAttribute('aria-expanded', 'false');
    await firstBandToggle.focus();
    await firstBandToggle.press('Enter');
    await expect(firstBandToggle).toHaveAttribute('aria-expanded', 'true');
    await firstBandToggle.press('Space');
    await expect(firstBandToggle).toHaveAttribute('aria-expanded', 'false');
    const sectorButtons = page.locator('.sec-btn');
    if (await sectorButtons.count() > 1) {
      await expect(sectorButtons.first()).toHaveAttribute('aria-pressed', /true|false/);
      await expect(sectorButtons.nth(1)).toHaveAttribute('aria-pressed', /true|false/);
      await sectorButtons.nth(1).focus();
      await sectorButtons.nth(1).press('Enter');
      await expect(sectorButtons.nth(1)).toHaveAttribute('aria-pressed', 'true');
      await expect(sectorButtons.first()).toHaveAttribute('aria-pressed', 'false');
      await sectorButtons.first().click();
    }
    await assertSequentialInputKeyboard(page, payeCase.id);

    await gross.fill('0');
    await calculate.click();
    expect(await page.evaluate(() => window.RESULT === null)).toBe(true);
    await expect(status).toContainText('mshahara halali');
    const invalidAnnouncement = await status.textContent();
    await page.evaluate(() => generatePdf());
    expect(popups).toHaveLength(0);

    await gross.fill(String(payeCase.gross));
    if (payeCase.id === 'ug-paye') {
      const lstToggle = page.locator('[data-tog="lst"]');
      await expect(lstToggle).toHaveAttribute('aria-checked', 'false');
      await lstToggle.focus();
      await lstToggle.press('Space');
      await expect(lstToggle).toHaveAttribute('aria-checked', 'true');
    }
    await calculate.focus();
    await expect(calculate).toBeFocused();
    await calculate.press('Enter');
    await expect(page.locator('#resultsCard')).toHaveClass(/on/);
    const swahiliResult = await pickResult(page, payeCase.fields);
    expect(swahiliResult).toEqual(englishOracle);
    expect(swahiliResult).toEqual(payeCase.expected);
    await expect(status).toContainText('PAYE');
    expect(await status.textContent()).not.toBe(invalidAnnouncement);
    await expect(pdfAction).toBeVisible();

    const shareAction = page.locator('.act-share').first();
    await expect(shareAction).toBeVisible();
    await shareAction.click();
    const sharePayload = await page.evaluate(() => window.__afroSharePayload);
    expect(sharePayload.url).toBe(`https://afrotools.com/sw/${payeCase.country}/kikokotoo-kodi-mshahara`);
    expect(sharePayload.text).toContain(payeCase.expected.net.toLocaleString());

    if (payeCase.id === 'ug-paye') {
      const officialProof = await page.evaluate(() => ({
        lst: window.RESULT.lstAnnual,
        taxable: window.RESULT.taxableIncome,
        resident: [235000, 335000, 410000, 10000000, 10000001].map((income) => calcMonthlyPAYE(income, false).tax),
        nonresident: [335000, 410000, 10000000, 10000001].map((income) => calcMonthlyPAYE(income, true).tax),
      }));
      expect(officialProof).toEqual({
        lst: 100000,
        taxable: 1900000,
        resident: [0, 10000, 25000, 2902000, 2902000.4],
        nonresident: [33500, 48500, 2925500, 2925500.4],
      });
      await gross.fill('420000');
      await calculate.click();
      expect(await page.evaluate(() => ({
        lst: window.RESULT?.lstAnnual,
        lstAssessmentBase: window.RESULT?.lstAssessmentGross,
        taxable: window.RESULT?.taxableIncome,
        paye: window.RESULT?.monthlyPAYE,
        nssf: window.RESULT?.nssf,
        net: window.RESULT?.netMonthly,
      }))).toEqual({ lst: 30000, lstAssessmentBase: 420000, taxable: 390000, paye: 21000, nssf: 21000, net: 348000 });
      await gross.fill(String(payeCase.gross));
      await calculate.click();
    }
    if (payeCase.id === 'rw-paye') {
      const boundaries = [
        { gross: 60000, paye: 0, pension: 3600, maternity: 180, cbhi: 280, net: 55940 },
        { gross: 100000, paye: 3400, pension: 6000, maternity: 300, cbhi: 449, net: 89851 },
        { gross: 200000, paye: 21600, pension: 12000, maternity: 600, cbhi: 825, net: 164975 },
        { gross: 300000, paye: 48600, pension: 18000, maternity: 900, cbhi: 1157, net: 231343 },
      ];
      for (const fixture of boundaries) {
        await gross.fill(String(fixture.gross));
        await calculate.click();
        const result = await page.evaluate(() => ({
          gross: window.RESULT?.gross,
          paye: window.RESULT?.monthlyPAYE,
          pension: window.RESULT?.rssb,
          maternity: window.RESULT?.employeeMaternity,
          cbhi: window.RESULT?.employeeCbhi,
          net: window.RESULT?.netMonthly,
          fixedPoint: Math.round((window.RESULT?.netMonthly || 0) * 0.005),
        }));
        expect(result).toEqual({ ...fixture, fixedPoint: fixture.cbhi });
      }
      await gross.fill(String(payeCase.gross));
      await calculate.click();
    }

    const unnamedControls = await page.locator(
      '#inputCard input:not([type="hidden"]), #inputCard select, #inputCard textarea, #inputCard button',
    ).evaluateAll((controls) => controls.filter((control) => {
      if (control.hidden || control.disabled) return false;
      const text = (control.textContent || '').trim();
      const aria = control.getAttribute('aria-label') || control.getAttribute('aria-labelledby');
      const label = control.id ? document.querySelector(`label[for="${CSS.escape(control.id)}"]`) : null;
      return !text && !aria && !label && !control.getAttribute('title');
    }).map((control) => `${control.tagName.toLowerCase()}#${control.id || ''}`));
    expect(unnamedControls).toEqual([]);
    await assertAxe(page, `${payeCase.id} valid result`);
    await assertNoHorizontalOverflow(page, '320px');

    const popupPromise = page.waitForEvent('popup');
    await pdfAction.click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    const artifact = await page.evaluate(() => {
      const html = window.__afroLastBlobText || '';
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      return {
        length: html.length,
        lang: parsed.documentElement.lang,
        title: parsed.title,
        text: (parsed.body.textContent || '').replace(/\s+/g, ' ').trim(),
        sections: ((parsed.body.textContent || '').match(/Sehemu(?: ya)? \d/g) || []).length,
      };
    });
    expect(artifact.length).toBeGreaterThan(1200);
    expect(artifact.lang).toBe('sw');
    expect(artifact.title).toMatch(/PAYE|Kodi/);
    expect(artifact.text).toMatch(/Makadirio|Si ushauri/);
    for (const sourceUrl of payeCase.officialSources) expect(artifact.text).toContain(sourceUrl);
    if (payeCase.id === 'ug-paye') {
      expect(artifact.text).toMatch(/URA.*2 Agosti 2026/);
      expect(artifact.text).toMatch(/LST ya mwaka iliyotathminiwa/);
      expect(artifact.text).toMatch(/Mshahara ghafi kwa jedwali la LST/);
    }
    if (payeCase.id === 'rw-paye') {
      expect(artifact.text).toMatch(/CBHI.*0\.5%.*mshahara halisi/i);
      expect(artifact.text).toMatch(/1,157/);
      expect(artifact.text).toMatch(/231,343/);
    }
    expect(artifact.sections).toBeGreaterThanOrEqual(3);
    const pdfBuffer = await popup.pdf({ format: 'A4', printBackground: true });
    expect(pdfBuffer.subarray(0, 5).toString()).toBe('%PDF-');
    const reopenedPdf = await pdfParse(pdfBuffer);
    expect(reopenedPdf.text).toMatch(/Mshahara|PAYE|Kodi/);
    expect(reopenedPdf.text).toMatch(/Makadirio|Si ushauri/);
    for (const sourceUrl of payeCase.officialSources) {
      expect(reopenedPdf.text.replace(/\s+/g, '')).toContain(sourceUrl.replace(/\s+/g, ''));
    }
    if (payeCase.id === 'rw-paye') {
      expect(reopenedPdf.text).toMatch(/CBHI\s+0\.5% ya mshahara halisi wa mfanyakazi/i);
      expect(reopenedPdf.text).toMatch(/1,157/);
      expect(reopenedPdf.text).toMatch(/231,343/);
    }
    await expect.poll(() => popup.evaluate(() => Boolean(window.__afroPrintCalled))).toBe(true);
    await popup.close();

    await gross.fill('0');
    expect(await page.evaluate(() => window.RESULT === null)).toBe(true);
    await expect(page.locator('#resultsCard')).not.toHaveClass(/on/);
    await expect(status).toContainText('Mshahara umebadilika');
    await page.evaluate(() => generatePdf());
    expect(popups).toHaveLength(1);
    await page.evaluate(() => shareResult());
    expect(await page.evaluate(() => window.__afroSharePayload)).toEqual(sharePayload);
    await expect(page.locator('#aiBtn')).toBeDisabled();

    await gross.fill(String(payeCase.gross));
    await calculate.click();
    const aiAction = page.locator('#aiBtn');
    await expect(aiAction).toBeEnabled();
    await aiAction.click();
    expect(aiPayloads).toHaveLength(0);
    acceptNextConfirm = true;
    await aiAction.click();
    await expect.poll(() => aiPayloads.length).toBe(1);
    const aiPayload = JSON.stringify(aiPayloads[0]);
    expect(aiPayload).toContain('Kiswahili');
    for (const oracle of payeCase.aiContext) expect(aiPayload).toMatch(oracle);
    await expect(page.locator('#aiResp')).toContainText('Uchambuzi wa Kiswahili');

    const contrastModes = [
      { label: 'explicit-light', theme: 'light', system: 'dark' },
      { label: 'explicit-dark', theme: 'dark', system: 'light' },
      { label: 'system-light', theme: null, system: 'light' },
      { label: 'system-dark', theme: null, system: 'dark' },
    ];
    for (const mode of contrastModes) {
      await page.setViewportSize({ width: 320, height: 760 });
      await page.emulateMedia({ colorScheme: mode.system });
      await page.evaluate((theme) => {
        if (theme) localStorage.setItem('aft_theme', theme);
        else localStorage.removeItem('aft_theme');
      }, mode.theme);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', mode.theme || mode.system);
      await expect(page.locator('html')).toHaveAttribute('data-theme-choice', mode.theme || 'auto');
      await page.locator('#grossSalary').fill(String(payeCase.gross));
      if (payeCase.id === 'ug-paye') await page.locator('[data-tog="lst"]').click();
      await page.locator('button.calc-btn[onclick*="calculate"]').first().click();
      await expect(page.locator('#resultsCard')).toHaveClass(/on/);
      const contrast = await assertComputedContrast(page, `${payeCase.id} ${mode.label}`);
      console.log(`[contrast] ${payeCase.id} ${mode.label}: text=${contrast.textMin.toFixed(2)} boundary=${contrast.boundaryMin.toFixed(2)} focus=${contrast.focusMin.toFixed(2)}`);
      if (mode.label === 'explicit-light') {
        await page.setViewportSize({ width: 1024, height: 760 });
        const themeToggle = page.locator('afro-navbar #themeToggle');
        await expect(themeToggle).toBeVisible();
        await themeToggle.click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await expect(page.locator('html')).toHaveAttribute('data-theme-choice', 'dark');
      }
    }
    await page.emulateMedia({ colorScheme: 'light' });
    await page.evaluate(() => localStorage.setItem('aft_theme', 'light'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#grossSalary').fill(String(payeCase.gross));
    if (payeCase.id === 'ug-paye') await page.locator('[data-tog="lst"]').click();
    await page.locator('button.calc-btn[onclick*="calculate"]').first().click();
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 760 });
      await page.reload({ waitUntil: 'domcontentloaded' });
      const baseRootFont = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize));
      await page.addStyleTag({ content: 'html{font-size:200%!important}' });
      const doubledRootFont = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize));
      expect(doubledRootFont, `${payeCase.id} ${width}px doubled root font`).toBeCloseTo(baseRootFont * 2, 5);
      await page.locator('#grossSalary').fill(String(payeCase.gross));
      if (payeCase.id === 'ug-paye') await page.locator('[data-tog="lst"]').click();
      await page.locator('button.calc-btn[onclick*="calculate"]').first().click();
      await expect(page.locator('#resultsCard')).toHaveClass(/on/);
      await assertNoHorizontalOverflow(page, `${width}px at true 200% root text`);
    }

    const delayedPage = await context.newPage();
    const delayedErrors = [];
    const delayedExternalRequests = [];
    const delayedStart = Date.now();
    let releaseExternal;
    const externalGate = new Promise((resolve) => { releaseExternal = resolve; });
    delayedPage.on('pageerror', (error) => delayedErrors.push(error.message));
    delayedPage.on('console', (message) => { if (message.type() === 'error') delayedErrors.push(message.text()); });
    delayedPage.on('request', (request) => {
      if (/^https:\/\//.test(request.url())) delayedExternalRequests.push({ url: request.url(), elapsedMs: Date.now() - delayedStart });
    });
    await delayedPage.route(/https:\/\/(fonts\.(?:googleapis|gstatic)\.com|cdnjs\.cloudflare\.com)\//, async (route) => {
      await externalGate;
      const script = route.request().url().includes('cdnjs.cloudflare.com');
      await route.fulfill({ status: 200, contentType: script ? 'application/javascript' : 'text/css', body: '' });
    });
    const navigation = delayedPage.goto(`/sw/${payeCase.country}/kikokotoo-kodi-mshahara/`, { waitUntil: 'commit' });
    await navigation;
    await delayedPage.locator('#grossSalary').waitFor({ state: 'visible' });
    await delayedPage.locator('#grossSalary').fill(String(payeCase.gross));
    if (payeCase.id === 'ug-paye') await delayedPage.locator('[data-tog="lst"]').click();
    await delayedPage.locator('button.calc-btn[onclick*="calculate"]').first().click();
    await expect(delayedPage.locator('#resultsCard')).toHaveClass(/on/);
    expect(await pickResult(delayedPage, payeCase.fields)).toEqual(payeCase.expected);
    await delayedPage.waitForTimeout(16500);
    expect(delayedExternalRequests.some((entry) => /cdn\.jsdelivr\.net|supabase\.co/.test(entry.url))).toBe(false);
    expect(delayedExternalRequests.filter((entry) => entry.elapsedMs >= 10000)).toEqual([]);
    await expect(delayedPage.locator('.chart-section')).toBeHidden();
    releaseExternal();
    await delayedPage.close();
    expect(delayedErrors).toEqual([]);

    expect(mutations).toHaveLength(1);
    expect(mutations[0]).toMatch(/^POST http:\/\/127\.0\.0\.1:\d+\/\.netlify\/functions\/ai-advisor$/);
    expect(failedLocalResources).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('Uganda English and Swahili share current-law results', async ({ page }) => {
  await page.route(/https:\/\/(fonts\.(?:googleapis|gstatic)\.com|cdnjs\.cloudflare\.com)\//, async (route) => {
    const script = route.request().url().includes('cdnjs.cloudflare.com');
    await route.fulfill({ status: 200, contentType: script ? 'application/javascript' : 'text/css', body: '' });
  });
  const routes = [
    '/uganda/ug-paye.html',
    '/sw/uganda/kikokotoo-kodi-mshahara/',
  ];
  for (const route of routes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.locator('#grossSalary').fill('2000000');
    await page.locator('[data-tog="lst"]').click();
    await page.locator('button.calc-btn[onclick*="calculate"]').first().click();
    expect(await page.evaluate(() => ({
      taxable: window.RESULT?.taxableIncome,
      paye: window.RESULT?.monthlyPAYE,
      nssf: window.RESULT?.nssf,
      net: window.RESULT?.netMonthly,
    })), `${route} resident`).toEqual({ taxable: 1900000, paye: 472000, nssf: 100000, net: 1328000 });
    await page.locator('[data-tog="nonres"]').click();
    expect(await page.evaluate(() => window.RESULT)).toBeNull();
    await page.locator('button.calc-btn[onclick*="calculate"]').first().click();
    expect(await page.evaluate(() => window.RESULT?.monthlyPAYE), `${route} non-resident`).toBe(495500);
    await page.locator('#grossSalary').fill('0');
    expect(await page.evaluate(() => window.RESULT)).toBeNull();
    await expect(page.locator('#resultsCard')).not.toHaveClass(/on/);
  }
});

test('Uganda English owner remains local-first after 16 seconds and degrades without Chart.js', async ({ context }) => {
  const routes = ['/uganda/ug-paye.html'];
  const startedAt = Date.now();
  const pages = await Promise.all(routes.map(async (route) => {
    const page = await context.newPage();
    const errors = [];
    const externalRequests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', (request) => {
      if (/^https:\/\//.test(request.url())) externalRequests.push({ url: request.url(), elapsedMs: Date.now() - startedAt });
    });
    await page.route(/https:\/\//, async (requestRoute) => {
      const script = requestRoute.request().resourceType() === 'script';
      await requestRoute.fulfill({ status: 200, contentType: script ? 'application/javascript' : 'text/css', body: '' });
    });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.locator('#grossSalary').fill('420000');
    await page.locator('[data-tog="lst"]').click();
    await page.locator('button.calc-btn[onclick*="calculate"]').first().click();
    expect(await page.evaluate(() => ({
      lst: window.RESULT?.lstAnnual,
      paye: window.RESULT?.monthlyPAYE,
      net: window.RESULT?.netMonthly,
    })), route).toEqual({ lst: 30000, paye: 21000, net: 348000 });
    await expect(page.locator('.chart-section')).toBeHidden();
    return { page, errors, externalRequests, route };
  }));
  await Promise.all(pages.map(({ page }) => page.waitForTimeout(16500)));
  for (const proof of pages) {
    expect(proof.externalRequests.some((entry) => /cdn\.jsdelivr\.net|supabase\.co/.test(entry.url)), proof.route).toBe(false);
    expect(proof.externalRequests.filter((entry) => entry.elapsedMs >= 10000), proof.route).toEqual([]);
    expect(proof.errors, proof.route).toEqual([]);
    await proof.page.close();
  }
});

test('exact-three browser lane remains exact', () => {
  expect(CASES.map((entry) => entry.id)).toEqual(['bi-paye', 'rw-paye', 'ug-paye']);
});
