const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');
const fixture = require('../fixtures/fr-mining-parity.json');
const SYNTHETIC_EVIDENCE = Object.freeze({
  sourceName: 'MINING-SRC-42',
  sourceDate: '2026-07-15',
  sourceConfidence: 'moyenne'
});

const cases = [
  {
    id: 'diamond-valuation',
    englishAction: /Estimate value/i,
    englishOutput: '#o-retail',
    englishExpected: 'retail',
    frenchOutputs: ['retail', 'wholesale', 'insurance', 'resale'],
    primaryField: 'base'
  },
  {
    id: 'oil-well-production',
    englishAction: /Estimate production/i,
    englishOutput: '#o-q',
    englishExpected: 'q',
    frenchOutputs: ['q', 'annual', 'net'],
    primaryField: 'price'
  },
  {
    id: 'oil-gas-revenue',
    englishAction: /Calculate split/i,
    englishOutput: '#o-govpct',
    englishExpected: 'governmentPct',
    frenchOutputs: ['contractorNet', 'governmentTake', 'governmentPct'],
    primaryField: 'gross',
    invalidate: async (page) => {
      await page.locator('#vol').fill('');
      await page.locator('#gross').fill('');
    }
  },
  {
    id: 'mining-license-fee',
    englishAction: /Calculate licence cost/i,
    englishOutput: '#o-total',
    englishExpected: 'total',
    frenchOutputs: ['oneOffTotal', 'annualComputed', 'total'],
    primaryField: 'annual'
  },
  {
    id: 'mining-royalty',
    englishAction: /Calculate royalty/i,
    englishOutput: '#mr-out-net',
    englishExpected: 'net',
    frenchOutputs: ['royalty', 'rate', 'net'],
    primaryField: 'rate'
  },
  {
    id: 'artisanal-mining-income',
    englishAction: /Calculate income/i,
    englishOutput: '#o-net',
    englishExpected: 'netPerMiner',
    frenchOutputs: ['netPerMiner', 'annualPerMiner', 'gap'],
    primaryField: 'formal'
  }
];

function numericText(value) {
  const normalized = String(value)
    .replace(/[\u00a0\u202f]/g, '')
    .replace(/,/g, '')
    .replace(/[^\d.+-]/g, '');
  return Number.parseFloat(normalized);
}

function expectClose(actual, expected, label, relativeTolerance = 0.002) {
  const tolerance = Math.max(0.02, Math.abs(expected) * relativeTolerance);
  expect(Math.abs(actual - expected), label).toBeLessThanOrEqual(tolerance);
}

async function keepRunLocal(page, writes, consoleErrors) {
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
  });
  await page.route(/^https?:\/\//, async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') await route.continue();
    else await route.abort();
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname === '127.0.0.1' && request.method() !== 'GET') {
      writes.push(`${request.method()} ${url.pathname}`);
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && !/Failed to load resource: net::ERR_FAILED/.test(message.text())) {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
}

async function fillInputs(page, app, french) {
  const inputs = app.inputs;
  if (app.englishRoute.includes('mining-license-fee') || app.englishRoute.includes('mining-royalty')) {
    const countrySelector = french ? '#country' : app.englishRoute.includes('mining-royalty') ? '#mr-country' : '#country';
    await page.locator(countrySelector).selectOption(inputs.country);
    const typeSelector = french
      ? (app.englishRoute.includes('mining-royalty') ? '#mineral' : '#licence')
      : (app.englishRoute.includes('mining-royalty') ? '#mr-mineral' : '#licence');
    await page.locator(typeSelector).selectOption(
      app.englishRoute.includes('mining-royalty') ? inputs.mineral : inputs.licence
    );
  }

  for (const [name, value] of Object.entries(inputs)) {
    if (value === null || ['country', 'licence', 'mineral'].includes(name)) continue;
    const selector = !french && app.englishRoute.includes('mining-royalty')
      ? `#mr-${name}`
      : `#${name}`;
    const control = page.locator(selector);
    if (await control.count()) {
      const tagName = await control.evaluate((node) => node.tagName);
      if (tagName === 'SELECT') {
        const optionValue = await control.locator('option').evaluateAll((options, target) => {
          const numericMatch = options.find((option) => Number(option.value) === Number(target));
          return numericMatch ? numericMatch.value : String(target);
        }, value);
        await control.selectOption(optionValue);
      }
      else await control.fill(String(value));
    }
  }
}

async function assertNamedControls(page, route) {
  const accessibility = await page.evaluate(() => {
    const controls = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea, button')];
    const unnamed = controls.filter((control) => !(
      (control.labels && control.labels.length) ||
      control.getAttribute('aria-label') ||
      control.getAttribute('aria-labelledby') ||
      control.textContent.trim() ||
      control.title
    ));
    return {
      unnamed: unnamed.map((control) => control.id || control.outerHTML.slice(0, 80)),
      undersized: controls
        .filter((control) => control.offsetParent !== null)
        .filter((control) => {
          const box = control.getBoundingClientRect();
          return box.width < 44 || box.height < 44;
        })
        .map((control) => control.id || control.textContent.trim())
    };
  });
  expect(accessibility.unnamed, `${route}: unnamed controls`).toEqual([]);
  expect(accessibility.undersized, `${route}: controls below 44px`).toEqual([]);
}

async function assertThemeAndReflow(page, route) {
  const theme = async (name) => page.evaluate((themeName) => {
    document.documentElement.dataset.theme = themeName;
    const card = document.querySelector('.fr-mining-card, .fr-mining-hub-card');
    const style = getComputedStyle(card);
    const accent = getComputedStyle(document.body).getPropertyValue('--fr-mining-accent').trim();
    return `${style.backgroundColor}|${style.color}|${accent}`;
  }, name);
  const light = await theme('light');
  const dark = await theme('dark');
  expect(dark, `${route}: explicit dark palette`).not.toBe(light);

  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  const automatic = await page.evaluate(() => {
    delete document.documentElement.dataset.theme;
    document.documentElement.dataset.themeChoice = 'auto';
    return getComputedStyle(document.body).getPropertyValue('--fr-mining-accent').trim();
  });
  expect(automatic, `${route}: automatic dark palette`).toBe('#fdba74');

  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 820 });
    const reflow = await page.evaluate((targetWidth) => {
      document.documentElement.style.fontSize = '200%';
      return {
        overflow: document.documentElement.scrollWidth - targetWidth,
        clippedControls: [...document.querySelectorAll('input, select, button, a[href]')]
          .filter((node) => node.offsetParent !== null)
          .filter((node) => {
            const box = node.getBoundingClientRect();
            return box.left < -2 || box.right > window.innerWidth + 2;
          }).length,
        overflowers: [...document.querySelectorAll('body *')]
          .filter((node) => node.offsetParent !== null)
          .map((node) => ({ node, box: node.getBoundingClientRect() }))
          .filter(({ box }) => box.right > window.innerWidth + 2)
          .slice(0, 8)
          .map(({ node, box }) => `${node.tagName.toLowerCase()}#${node.id}.${node.className || ''}:${Math.round(box.right)}`)
      };
    }, width);
    expect(reflow.overflow, `${route}: ${width}px at 200% text; ${reflow.overflowers.join(', ')}`).toBeLessThanOrEqual(2);
    expect(reflow.clippedControls, `${route}: clipped controls at ${width}px`).toBe(0);
  }
}

async function assertEvidenceFailsClosed(page, submit, evidence) {
  await submit.press('Enter');
  await expect(page.getByLabel('Nom de la source ou du document')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Nom de la source ou du document')).toBeFocused();
  await expect(page.locator('#result')).toBeHidden();
  await expect(page.getByRole('button', { name: /Télécharger le rapport PDF/i })).toBeDisabled();

  await page.getByLabel('Nom de la source ou du document').fill(evidence.sourceName);
  await submit.click();
  await expect(page.getByLabel('Date de vérification')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Date de vérification')).toBeFocused();
  await expect(page.locator('#result')).toBeHidden();

  const tomorrow = await page.evaluate(() => {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    const local = new Date(next.getTime() - next.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  });
  await page.getByLabel('Date de vérification').fill(tomorrow);
  await submit.click();
  await expect(page.getByLabel('Date de vérification')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#error')).toContainText(/ne peut pas être dans le futur/i);
  await expect(page.locator('#result')).toBeHidden();

  await page.getByLabel('Date de vérification').fill(evidence.sourceDate);
  await submit.click();
  await expect(page.getByLabel('Confiance déclarée')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Confiance déclarée')).toBeFocused();
  await expect(page.locator('#result')).toBeHidden();

  await page.getByLabel('Confiance déclarée').selectOption(evidence.sourceConfidence);
}

async function assertResultLabelContrast(page, route) {
  for (const theme of ['light', 'dark']) {
    const results = await page.evaluate((themeName) => {
      document.documentElement.dataset.theme = themeName;
      function channel(value) {
        value /= 255;
        return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
      }
      function luminance(rgb) {
        const values = rgb.match(/[\d.]+/g).slice(0, 3).map(Number);
        return 0.2126 * channel(values[0]) + 0.7152 * channel(values[1]) + 0.0722 * channel(values[2]);
      }
      return [...document.querySelectorAll('.fr-mining-stat span')].map((label) => {
        const foreground = getComputedStyle(label).color;
        const background = getComputedStyle(label.closest('.fr-mining-stat')).backgroundColor;
        const lighter = Math.max(luminance(foreground), luminance(background));
        const darker = Math.min(luminance(foreground), luminance(background));
        return {
          text: label.textContent.trim(),
          foreground,
          background,
          ratio: (lighter + 0.05) / (darker + 0.05)
        };
      });
    }, theme);
    expect(results.length, `${route}: every visible result label in ${theme}`).toBeGreaterThanOrEqual(3);
    for (const result of results) {
      expect(
        result.ratio,
        `${route}: ${theme} contrast for "${result.text}" (${result.foreground} on ${result.background})`
      ).toBeGreaterThanOrEqual(4.75);
    }
  }
}

async function downloadAndParsePdf(page, evidence) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: /Télécharger le rapport PDF/i }).click();
  const download = await pending;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  expect(buffer.length).toBeGreaterThan(1_000);
  const parsed = await pdfParse(buffer);
  expect(parsed.text).toContain('AfroTools');
  expect(parsed.text).toMatch(/planification locale/i);
  expect(parsed.text).toMatch(/Sources, fraicheur et confiance/i);
  expect(parsed.text).toContain('MINING-SRC-42');
  expect(parsed.text).toContain(evidence.sourceDate);
  expect(parsed.text).toContain(evidence.sourceConfidence);
  if (evidence.longSource) {
    expect(parsed.numpages).toBeGreaterThan(1);
    expect(parsed.text).toContain('FIN-SOURCE-77');
  }
}

for (const definition of cases) {
  const app = fixture.apps[definition.id];

  test(`${definition.id}: English oracle and native French app agree, export and reflow`, async ({ page }) => {
    test.setTimeout(120_000);
    const writes = [];
    const consoleErrors = [];
    await keepRunLocal(page, writes, consoleErrors);

    await page.goto(app.englishRoute, { waitUntil: 'domcontentloaded' });
    await fillInputs(page, app, false);
    await page.getByRole('button', { name: definition.englishAction }).click();
    const englishResult = page.locator(definition.englishOutput);
    await expect(englishResult).toBeVisible();
    const englishActual = numericText(await englishResult.innerText());
    expectClose(englishActual, app.expected[definition.englishExpected], `${definition.id}: English display oracle`, 0.006);

    await page.goto(app.frenchRoute, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${app.frenchRoute}`);
    await fillInputs(page, app, true);
    const storageBefore = await page.evaluate(() => ({
      local: Object.keys(localStorage).sort(),
      session: Object.keys(sessionStorage).sort()
    }));

    const evidence = {
      ...SYNTHETIC_EVIDENCE,
      sourceName: definition.id === 'diamond-valuation'
        ? `MINING-SRC-42 ${'SOURCE-LONGUE '.repeat(320)} FIN-SOURCE-77`
        : SYNTHETIC_EVIDENCE.sourceName,
      longSource: definition.id === 'diamond-valuation'
    };
    const submit = page.getByRole('button', { name: /Calculer l.estimation/i });
    await submit.focus();
    await expect(submit).toBeFocused();
    await assertEvidenceFailsClosed(page, submit, evidence);
    await submit.press('Enter');
    await expect(page.locator('#result')).toBeVisible();
    await expect(page.locator('#result')).toBeFocused();

    for (const key of definition.frenchOutputs) {
      const output = page.locator(`[data-output="${key}"]`);
      const actual = Number(await output.getAttribute('data-raw'));
      expectClose(actual, app.expected[key], `${definition.id}: French ${key}`, 1e-9);
    }
    const resultText = await page.locator('#result').innerText();
    expect(resultText).not.toMatch(/\b(?:NaN|Infinity|undefined)\b/);
    await expect(page.locator('#source-summary')).toContainText('MINING-SRC-42');
    await expect(page.locator('#source-summary')).toContainText(evidence.sourceDate);
    await expect(page.locator('#source-summary')).toContainText(evidence.sourceConfidence);
    if (evidence.longSource) await expect(page.locator('#source-summary')).toContainText('FIN-SOURCE-77');
    await expect(page.locator('#source-summary')).toContainText(/aucune saisie n.est envoyée ni enregistrée/i);

    await downloadAndParsePdf(page, evidence);
    await assertResultLabelContrast(page, app.frenchRoute);
    await assertNamedControls(page, app.frenchRoute);
    await assertThemeAndReflow(page, app.frenchRoute);

    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    if (definition.invalidate) await definition.invalidate(page);
    else await page.locator(`#${definition.primaryField}`).fill('');
    await submit.click();
    const invalidField = page.locator(`#${definition.primaryField}`);
    await expect(invalidField).toHaveAttribute('aria-invalid', 'true');
    await expect(invalidField).toBeFocused();
    await expect(page.locator('#error')).toBeVisible();
    await expect(page.locator('#result')).toBeHidden();

    const storageAfter = await page.evaluate(() => ({
      local: Object.keys(localStorage).sort(),
      session: Object.keys(sessionStorage).sort()
    }));
    expect(storageAfter, `${definition.id}: local-first storage boundary`).toEqual(storageBefore);
    expect(writes, `${definition.id}: no browser writes`).toEqual([]);
    expect(consoleErrors, `${definition.id}: console errors`).toEqual([]);
  });
}

test('French Mining hub exposes exactly six independently illustrated, crawlable apps', async ({ page }) => {
  const writes = [];
  const consoleErrors = [];
  await keepRunLocal(page, writes, consoleErrors);
  await page.goto('/fr/mining/', { waitUntil: 'domcontentloaded' });

  const expectedRoutes = cases.map(({ id }) => fixture.apps[id].frenchRoute).sort();
  const routes = await page.locator('.fr-mining-hub-card a').evaluateAll((links) => (
    links.map((link) => new URL(link.href).pathname).sort()
  ));
  expect(routes).toEqual(expectedRoutes);
  await expect(page.locator('.fr-mining-hub-card')).toHaveCount(6);

  const schema = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => (
    scripts.map((script) => JSON.parse(script.textContent)).find((entry) => entry['@type'] === 'CollectionPage')
  ));
  expect(schema.inLanguage).toBe('fr');
  expect(schema.mainEntity.numberOfItems).toBe(6);
  expect(schema.mainEntity.itemListElement).toHaveLength(6);

  const artwork = await page.locator('.fr-mining-hub-card img').evaluateAll((images) => images.map((image) => ({
    src: new URL(image.src).pathname,
    complete: image.complete,
    width: image.naturalWidth,
    height: image.naturalHeight
  })));
  expect(new Set(artwork.map((image) => image.src)).size).toBe(6);
  for (const image of artwork) {
    expect(image.complete).toBe(true);
    expect(image.width).toBe(1200);
    expect(image.height).toBe(1200);
  }

  await assertThemeAndReflow(page, '/fr/mining/');
  expect(writes).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
