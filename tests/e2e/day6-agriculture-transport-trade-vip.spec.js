const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { expect, test } = require('@playwright/test');

function inventory() {
  const registry = fs.readFileSync(path.resolve(__dirname, '../../assets/js/components/tool-registry.js'), 'utf8');
  const sandbox = { document: undefined, window: {} };
  vm.createContext(sandbox);
  vm.runInContext(registry, sandbox);
  const categories = ['agriculture', 'transport', 'trade'];
  return categories.flatMap((category) => sandbox.AFRO_TOOLS
    .filter((tool) => tool.category === category)
    .filter((tool) => tool.status === 'live' || tool.status === 'new')
    .filter((tool) => !/^\/(?:fr|sw|ha|yo)\//.test(tool.href))
    .map((tool) => ({ category, id: tool.id, route: tool.href })));
}

const ROUTES = inventory();
const expected = { agriculture: 447, transport: 18, trade: 22 };
const carsNoscriptFallbackHasH1 = /<noscript>[\s\S]*?<h1\b/i.test(
  fs.readFileSync(path.resolve(__dirname, '../../cars/index.html'), 'utf8')
);

async function readDownload(download) {
  const stream = await download.createReadStream();
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });
}

test('Day 6 hubs expose their reconciled workflows and responsive contracts', async ({ page }) => {
  const hubs = [
    { route: '/agriculture/', count: 447, selector: '[data-agri-stat="total-tools"]' },
    { route: '/transport/', count: 23, selector: '.trp-tool-card' },
    { route: '/trade/', count: 22, selector: '.tool-card' }
  ];
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:4186)/, (route) => route.abort());
  for (const hub of hubs) {
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    const response = await page.goto(hub.route, { waitUntil: 'domcontentloaded' });
    expect(response.status(), `${hub.route} status`).toBe(200);
    await page.locator(hub.selector).first().waitFor({ state: 'visible' });
    const audit = await page.evaluate(({ route, count, selector }) => {
      document.documentElement.setAttribute('data-theme-choice', 'auto');
      document.documentElement.setAttribute('data-theme', 'dark');
      const schemaErrors = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map((node) => {
          try { JSON.parse(node.textContent); return ''; } catch (error) { return error.message; }
        }).filter(Boolean);
      const canonical = document.querySelector('link[rel="canonical"]');
      const focusTarget = document.querySelector('main input,main select,main button,main a[href]');
      focusTarget?.focus();
      const visibleCount = route === '/agriculture/'
        ? Number(document.querySelector(selector).textContent)
        : document.querySelectorAll(selector).length;
      return {
        canonical: canonical ? canonical.href : '',
        count: visibleCount,
        expectedCount: count,
        h1: document.querySelectorAll('h1').length,
        main: document.querySelectorAll('main,[role="main"]').length,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        focused: !focusTarget || document.activeElement === focusTarget,
        schemaErrors
      };
    }, hub);
    expect(audit.canonical, `${hub.route} canonical`).toBe(`https://afrotools.com${hub.route}`);
    expect(audit.count, `${hub.route} reconciled count`).toBe(audit.expectedCount);
    expect(audit.h1, `${hub.route} h1`).toBe(1);
    expect(audit.main, `${hub.route} main`).toBeGreaterThan(0);
    expect(audit.overflow, `${hub.route} 320px overflow`).toBeLessThanOrEqual(1);
    expect(audit.focused, `${hub.route} focusable workflow entry`).toBe(true);
    expect(audit.schemaErrors, `${hub.route} schema`).toEqual([]);

    await page.setViewportSize({ width: 640, height: 760 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      `${hub.route} 200% text reflow`).toBeLessThanOrEqual(1);
  }
});

test('all Day 6 English live/new routes keep route, mobile, theme and metadata contracts', async ({ page }) => {
  test.setTimeout(20 * 60 * 1000);
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:4186)/, (route) => route.abort());
  // Keep this exhaustive route contract fast and deterministic. The two workflow
  // tests below execute the category JavaScript and primary user paths separately.
  await page.route('**/*.js*', (route) => route.abort());
  expect(ROUTES.reduce((counts, row) => {
    counts[row.category] = (counts[row.category] || 0) + 1;
    return counts;
  }, {})).toEqual(expected);

  const contractPattern = process.env.DAY6_ROUTE_PATTERN
    ? new RegExp(process.env.DAY6_ROUTE_PATTERN)
    : null;
  const contractRoutes = ROUTES.filter((item) => !contractPattern || contractPattern.test(item.route));
  for (const [routeIndex, row] of contractRoutes.entries()) {
    if (routeIndex % 50 === 0) {
      console.log(`Day 6 route contract ${routeIndex + 1}/${contractRoutes.length}: ${row.route}`);
    }
    await page.setViewportSize({ width: 320, height: 760 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    const response = await page.goto(row.route, { waitUntil: 'domcontentloaded' });
    expect.soft(response && response.status(), `${row.route} status`).toBe(200);
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme-choice', 'auto');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.fontSize = '100%';
    });
    const audit = await page.evaluate(() => {
      const schemaErrors = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map((node) => {
          try { JSON.parse(node.textContent); return ''; } catch (error) { return error.message; }
        }).filter(Boolean);
      const canonical = document.querySelector('link[rel="canonical"]');
      const description = document.querySelector('meta[name="description"]');
      return {
        canonical: canonical ? canonical.href : '',
        description: description ? description.content.trim() : '',
        h1: document.querySelectorAll('h1').length,
        main: document.querySelectorAll('main,[role="main"]').length,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        wide: Array.from(document.body.querySelectorAll('*')).map((element) => {
          const rect = element.getBoundingClientRect();
          return { tag: element.tagName, id: element.id, className: element.className, right: rect.right, width: rect.width };
        }).filter((item) => item.right > document.documentElement.clientWidth + 1)
          .sort((left, right) => right.right - left.right).slice(0, 5),
        schemaErrors
      };
    });
    expect.soft(audit.canonical, `${row.route} canonical`).toBe(`https://afrotools.com${row.route}`);
    expect.soft(audit.description.length, `${row.route} description`).toBeGreaterThanOrEqual(50);
    expect.soft(audit.description.length, `${row.route} description`).toBeLessThanOrEqual(180);
    const effectiveH1Count = row.route === '/cars/' ? audit.h1 + Number(carsNoscriptFallbackHasH1) : audit.h1;
    expect.soft(effectiveH1Count, `${row.route} h1`).toBe(1);
    expect.soft(audit.main, `${row.route} main`).toBeGreaterThan(0);
    expect.soft(
      audit.overflow,
      `${row.route} 320px overflow ${JSON.stringify(audit.wide)}`
    ).toBeLessThanOrEqual(1);
    expect.soft(audit.schemaErrors, `${row.route} schema`).toEqual([]);

    await page.setViewportSize({ width: 640, height: 760 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const reflow = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      wide: Array.from(document.body.querySelectorAll('*')).map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, id: element.id, className: element.className, right: rect.right, width: rect.width };
      }).filter((item) => item.right > document.documentElement.clientWidth + 1)
        .sort((left, right) => right.right - left.right).slice(0, 5)
    }));
    expect.soft(
      reflow.overflow,
      `${row.route} 200% text reflow ${JSON.stringify(reflow.wide)}`
    ).toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 375, height: 844 });
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme-choice', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.fontSize = '100%';
      return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await page.waitForFunction(() => Math.abs(parseFloat(getComputedStyle(document.documentElement).fontSize) - 16) < 0.1);
    const mobile375 = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      wide: Array.from(document.body.querySelectorAll('*')).map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, id: element.id, className: element.className, right: rect.right, width: rect.width };
      }).filter((item) => item.right > document.documentElement.clientWidth + 1)
        .sort((left, right) => right.right - left.right).slice(0, 5)
    }));
    expect.soft(mobile375.overflow,
      `${row.route} 375px overflow ${JSON.stringify(mobile375.wide)}`).toBeLessThanOrEqual(1);
  }
});

test('repaired Agriculture family entry apps execute independent deterministic fixtures and failure/reset paths', async ({ page }) => {
  test.setTimeout(2 * 60 * 1000);
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:4186)/, (route) => route.abort());
  const fixtures = [
    ['/agriculture/crop-yield/', 'Calculate yield', /6\.16 tonnes/],
    ['/agriculture/fertilizer/', 'Calculate fertilizer', /8 bags.*280,000/],
    ['/agriculture/irrigation/', 'Calculate water', /2,000\.0 m3/],
    ['/agriculture/farm-profit/', 'Calculate profit', /750,000.*33\.3%/],
    ['/agriculture/seed-rate/', 'Calculate seed', /58\.3 kg/],
    ['/agriculture/fish-farming/', 'Calculate fish ROI', /1,020\.0 kg.*644,000/],
    ['/agriculture/greenhouse/', 'Calculate greenhouse cost', /4,838,400/]
  ];
  for (const [route, button, result] of fixtures) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const form = page.locator('[data-day6-agriculture-calculator]');
    const accessibility = await form.evaluate((node) => {
      const controls = Array.from(node.querySelectorAll('input,select,textarea,button'));
      const named = controls.filter((element) => element.matches('button')
        ? Boolean(element.textContent.trim() || element.getAttribute('aria-label'))
        : Boolean(element.getAttribute('aria-label') || element.labels && element.labels.length));
      controls[0]?.focus();
      return {
        controls: controls.length,
        named: named.length,
        keyboardReachable: controls.every((element) => element.tabIndex >= 0),
        focused: document.activeElement === controls[0],
        liveOutput: Boolean(node.querySelector('output[aria-live]'))
      };
    });
    expect(accessibility.named, `${route} named controls`).toBe(accessibility.controls);
    expect(accessibility.keyboardReachable, `${route} keyboard controls`).toBe(true);
    expect(accessibility.focused, `${route} focusable first control`).toBe(true);
    expect(accessibility.liveOutput, `${route} live result status`).toBe(true);
    await form.getByRole('button', { name: button }).click();
    await expect(form.locator('output')).toHaveText(result);
    const firstNumber = form.locator('input[type="number"]').first();
    await firstNumber.fill('');
    await form.getByRole('button', { name: button }).click();
    await expect(form.locator('output')).toContainText('Complete every field');
    await form.getByRole('button', { name: 'Reset' }).click();
    await expect(form.locator('output')).toContainText('No current result');
  }
});

test('every Transport and Trade app exposes and executes an app-owned primary workflow', async ({ page }) => {
  test.setTimeout(6 * 60 * 1000);
  const externalWrites = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4186/')
      && !['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      externalWrites.push({ method: request.method(), url: request.url() });
    }
  });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:4186)/, (route) => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  page.on('dialog', (dialog) => dialog.dismiss());
  const routePattern = process.env.DAY6_ROUTE_PATTERN
    ? new RegExp(process.env.DAY6_ROUTE_PATTERN)
    : null;
  const workflowRoutes = ROUTES.filter((item) => item.category !== 'agriculture')
    .filter((item) => !routePattern || routePattern.test(item.route))
    .sort((left, right) => Number(left.route === '/tools/car-import-cost/')
      - Number(right.route === '/tools/car-import-cost/'));
  for (const row of workflowRoutes) {
    console.log(`Day 6 workflow: ${row.route}`);
    await page.goto(row.route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(250);
    const accessibility = await page.evaluate(() => {
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const app = document.querySelector('main,[role="main"]');
      const controls = Array.from(app.querySelectorAll('input:not([type=hidden]),select,textarea,button'))
        .filter(visible)
        .filter((element) => !element.closest('afro-related-tools,.related-tools-ssr'));
      const named = controls.filter((element) => element.matches('button')
        ? Boolean(element.textContent.trim() || element.getAttribute('aria-label'))
        : Boolean(element.getAttribute('aria-label') || element.labels && element.labels.length));
      const focusTarget = controls.find((element) => !element.disabled && element.tabIndex >= 0);
      focusTarget?.focus();
      return {
        controls: controls.length,
        named: named.length,
        keyboardReachable: controls.filter((element) => !element.disabled).every((element) => element.tabIndex >= 0),
        focused: !focusTarget || document.activeElement === focusTarget
      };
    });
    expect(accessibility.named, `${row.route} named visible controls`).toBe(accessibility.controls);
    expect(accessibility.keyboardReachable, `${row.route} keyboard reachable controls`).toBe(true);
    expect(accessibility.focused, `${row.route} focusable primary control`).toBe(true);
    if (row.route === '/cars/') {
      const routeTarget = await page.locator('main a[href^="/cars/"]').first().getAttribute('href');
      expect(routeTarget, '/cars/ primary comparison route').toBeTruthy();
      const response = await page.request.get(routeTarget);
      expect(response.status(), '/cars/ selected workflow route').toBe(200);
      continue;
    }
    if (row.route === '/tools/car-loan-vs-cash/') {
      await page.locator('#loanVehiclePrice').fill('5000000');
      await page.locator('#loanDownPayment').fill('1000000');
      await page.locator('.btn-calc').click();
      await expect(page.locator('#loanResults')).toHaveClass(/on/);
      await expect(page.locator('#loanStatus')).toContainText('Summary ready');
      continue;
    }
    if (row.route === '/tools/vehicle-depreciation/') {
      await page.locator('#depPrice').fill('15000');
      await page.locator('.btn-calc').click();
      await expect(page.locator('#depResults')).toHaveClass(/on/);
      continue;
    }
    if (row.route === '/tools/fleet-fuel/') {
      await page.locator('#fleetFuelPrice').fill('1.5');
      await page.getByRole('button', { name: 'Calculate Fleet Fuel Budget' }).click();
      await expect(page.locator('#fleetResults')).toHaveClass(/on/);
      await expect(page.locator('#fuelMonthly')).not.toHaveText('0');
      continue;
    }
    if (row.route === '/tools/truck-load/') {
      await page.locator('#truckLoad').fill('7.5');
      await page.locator('#truckDistance').fill('500');
      await page.locator('#truckTripCost').fill('50000');
      await page.getByRole('button', { name: 'Optimize Load' }).click();
      await expect(page.locator('#truckResults')).toHaveClass(/on/);
      continue;
    }
    if (row.route === '/tools/hs-code-lookup/') {
      await page.locator('#searchInput').fill('rice');
      await page.locator('#searchInput').press('Enter');
      await expect(page.locator('#resultHero')).toHaveClass(/on/);
      await expect(page.locator('#rhCode')).not.toHaveText('—');
      continue;
    }
    if (row.route === '/tools/afcfta-tracker/') {
      await page.getByRole('button', { name: /Corridor Checker/ }).click();
      await page.locator('#corrOrigin').selectOption({ index: 1 });
      await page.locator('#corrDest').selectOption({ index: 2 });
      await page.getByRole('button', { name: 'Check Corridor' }).click();
      await expect(page.locator('#corridorResult')).toHaveClass(/on/);
      await expect(page.locator('#corrResultBody')).not.toBeEmpty();
      continue;
    }
    if (row.route === '/tools/incoterms-calculator/') {
      await page.getByRole('button', { name: /Cost Calculator/ }).click();
      await page.getByRole('button', { name: 'Auto-fill' }).click();
      await page.getByRole('button', { name: /Calculate Cost Split/ }).click();
      await expect(page.locator('#sellerTotal')).not.toHaveText('$0');
      await expect(page.locator('#buyerTotal')).not.toHaveText('$0');
      continue;
    }
    if (row.route === '/tools/coo-generator/') {
      await page.locator('.tpl-card').first().click();
      await page.locator('#formFields input,#formFields textarea').evaluateAll((fields) => {
        fields.forEach((field) => {
          field.value = 'Synthetic exporter fixture';
          field.dispatchEvent(new Event('input', { bubbles: true }));
        });
      });
      await page.getByRole('button', { name: /Generate Preview/i }).click();
      await expect(page.locator('#tabPreview')).toHaveClass(/on/);
      await expect(page.locator('#cooPreview')).toContainText('CERTIFICATE');
      continue;
    }
    if (row.route === '/tools/cross-border-data/') {
      await page.locator('[data-workflow-output]').waitFor({ state: 'visible' });
      await page.locator('[data-workflow-field="matter"]').fill('Synthetic transfer review');
      await page.locator('[data-workflow-field="country"]').fill('Kenya');
      await page.locator('[data-workflow-build]').click();
      await expect(page.locator('[data-workflow-output]')).toHaveValue(/Synthetic transfer review/);
      continue;
    }
    if (row.route === '/tools/proforma-invoice/') {
      await page.locator('#sellerName').fill('Synthetic Exporter Ltd');
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Backup JSON' }).click();
      const data = JSON.parse(await readDownload(await downloadPromise));
      expect(data.fields.sellerName).toBe('Synthetic Exporter Ltd');
      await expect(page.locator('#piStatus')).toContainText('JSON backup downloaded');
      continue;
    }
    if (row.route === '/tools/packing-list/') {
      await page.locator('#shipperName').fill('Synthetic Shipper Ltd');
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Backup JSON' }).click();
      const data = JSON.parse(await readDownload(await downloadPromise));
      expect(data.shipper.name).toBe('Synthetic Shipper Ltd');
      await expect(page.locator('#packingStatus')).toContainText('JSON backup downloaded');
      continue;
    }
    if (row.route === '/tools/bol-generator/') {
      await page.locator('#blShipperName').fill('Synthetic Shipper Ltd');
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download .txt' }).click();
      const text = await readDownload(await downloadPromise);
      expect(text).toContain('Synthetic Shipper Ltd');
      await expect(page.locator('#blStatus')).toContainText('Text file downloaded');
      continue;
    }
    if (row.route === '/tools/trade-finance-comparator/') {
      await page.getByRole('button', { name: 'Cost Calculator' }).click();
      await page.locator('#calcInstrument').selectOption('cad');
      await expect(page.locator('#calcResult')).not.toBeEmpty();
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download CSV' }).click();
      const csv = await readDownload(await downloadPromise);
      expect(csv).toContain('instrument');
      expect(csv).toContain('CAD');
      continue;
    }
    const legacyAction = page.locator(
      'main button[onclick]:not([role="tab"]):not([class*="tab"]):visible,' +
      '[role="main"] button[onclick]:not([role="tab"]):not([class*="tab"]):visible'
    )
      .filter({ hasText: /calculate|estimate|generate|compare|check|lookup|track|create|build|run|search|get|show|optimi[sz]e|plan/i })
      .first();
    if (await legacyAction.count()) {
      const before = await page.locator('body').evaluate((body) => ({
        text: body.innerText,
        resultState: Array.from(body.querySelectorAll('.results,[id*="result" i],output,[aria-live]'))
          .map((element) => `${getComputedStyle(element).display}:${element.textContent.trim()}`).join('|')
      }));
      await page.locator('main input[type="number"],[role="main"] input[type="number"]').evaluateAll((fields) => {
        fields.forEach((field) => {
          const min = Number(field.min);
          const max = Number(field.max);
          const current = Number(field.value);
          if (field.value !== '' && Number.isFinite(current) && current > 0) return;
          var value = Number.isFinite(min) && min > 0 ? min + 1 : 10;
          if (Number.isFinite(max) && value > max) value = Math.max(Number.isFinite(min) ? min : 0, max - 1);
          field.value = String(value);
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
      await page.locator(
        'main input[type="text"],main input[type="search"],main textarea,' +
        '[role="main"] input[type="text"],[role="main"] input[type="search"],[role="main"] textarea'
      ).evaluateAll((fields) => {
        fields.forEach((field) => {
          if (field.value !== '') return;
          field.value = 'Synthetic test value';
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
      await legacyAction.click();
      const legacyChanged = await page.locator('body').evaluate((body, previous) => {
        const visibleResult = Array.from(body.querySelectorAll('.results,[id*="result" i],output,[aria-live]'))
          .some((element) => {
            const style = getComputedStyle(element);
            return style.display !== 'none' && style.visibility !== 'hidden' && element.textContent.trim() !== '';
          });
        const resultState = Array.from(body.querySelectorAll('.results,[id*="result" i],output,[aria-live]'))
          .map((element) => `${getComputedStyle(element).display}:${element.textContent.trim()}`).join('|');
        return visibleResult && (body.innerText !== previous.text || resultState !== previous.resultState);
      }, before);
      expect(legacyChanged, `${row.route} legacy primary workflow changes result state`).toBe(true);
      continue;
    }
    if (row.route === '/tools/car-import-cost/') {
      await page.locator('#carImportResults:not([hidden])').waitFor({ state: 'visible', timeout: 15_000 });
      const uiTotalBefore = await page.locator('#carImportTotal').innerText();
      await page.locator('#carImportSourceMarket').selectOption('uae');
      await page.locator('#carImportForm button[type="submit"]').click();
      await expect(page.locator('#carImportTotal')).not.toHaveText(uiTotalBefore);
      const quote = await page.evaluate(async () => {
        const core = await fetch('/data/trade/car-import-cost-core.json').then((response) => response.json());
        const packs = await Promise.all(Object.values(core.countryPackFiles)
          .map((url) => fetch(url).then((response) => response.json())));
        const data = window.AfroCarImportCost.mergeData(core, packs, {
          NGN: 1535.5, KES: 129.45, GHS: 14.89, UGX: 3720, ZMW: 27.5, TZS: 2650
        });
        const result = window.AfroCarImportCost.calculate({
          countryCode: 'NG',
          make: 'Toyota',
          model: 'Corolla',
          year: 2018,
          sourceMarket: 'japan',
          destinationCity: 'lagos',
          driveSide: 'right',
          engineCc: 1800,
          outputMode: 'practical'
        }, data);
        return {
          total: result.totals.onRoadUsd,
          officialCharges: result.totals.officialTaxesUsd + result.totals.officialFeesUsd,
          sourceCount: result.sourceMetadata.length
        };
      });
      expect(quote.total).toBeCloseTo(18209.88, 2);
      expect(quote.officialCharges).toBeGreaterThan(0);
      expect(quote.sourceCount).toBeGreaterThan(0);
      continue;
    }
    await page.waitForTimeout(750);
    const result = await page.evaluate(() => {
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const app = document.querySelector('main,[role="main"]');
      const controls = Array.from(app.querySelectorAll('input:not([type=hidden]),select,textarea,button'))
        .filter(visible)
        .filter((element) => !element.closest('afro-related-tools,.related-tools-ssr'));
      const named = controls.filter((element) => {
        if (element.matches('button')) return Boolean(element.textContent.trim() || element.getAttribute('aria-label'));
        return Boolean(element.getAttribute('aria-label') || element.labels && element.labels.length);
      });
      const mainTextBefore = app.innerText;
      const resultBefore = Array.from(app.querySelectorAll(
        'output,[aria-live],.result,.results,.result-card,.result-panel,[id*="result" i]'
      )).map((element) => `${getComputedStyle(element).display}:${element.textContent.trim()}`).join('|');
      const numberFields = controls.filter((element) =>
        element.matches('input[type="number"]:not([readonly]):not([disabled])'));
      var filledEmptyNumber = false;
      numberFields.forEach((numberField) => {
        if (numberField.value !== '') return;
        const min = Number(numberField.min);
        const max = Number(numberField.max);
        var value = Number.isFinite(min) && min > 0 ? min + 1 : 10;
        if (Number.isFinite(max) && value > max) value = Math.max(Number.isFinite(min) ? min : 0, max - 1);
        numberField.value = String(value);
        numberField.dispatchEvent(new Event('input', { bubbles: true }));
        numberField.dispatchEvent(new Event('change', { bubbles: true }));
        filledEmptyNumber = true;
      });
      if (!filledEmptyNumber && numberFields.length) {
        const numberField = numberFields[0];
        const min = Number(numberField.min);
        const max = Number(numberField.max);
        const current = Number(numberField.value);
        var changedValue = current + Math.max(1, Math.abs(current) * 0.1);
        if (Number.isFinite(max) && changedValue > max) {
          changedValue = Math.max(Number.isFinite(min) ? min : 0, max - 1);
        }
        numberField.value = String(changedValue);
        numberField.dispatchEvent(new Event('input', { bubbles: true }));
        numberField.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const textInput = controls.find((element) => element.matches('input[type="search"],input[type="text"]'));
      if (textInput && !textInput.value) {
        textInput.value = 'test';
        textInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const action = controls.find((element) => element.matches('button,input[type="submit"]')
        && !element.matches('[role="tab"],[class*="tab"]')
        && /calculate|estimate|generate|compare|check|lookup|track|create|build|run|add|search|get|apply|show|optimi[sz]e|plan/i
          .test(`${element.textContent} ${element.value || ''} ${element.getAttribute('aria-label') || ''}`));
      const routeLink = !action && !app.querySelector('form')
        ? app.querySelector('a[href^="/cars/"],a[href^="/tools/"]')
        : null;
      if (action && action.matches('[type="submit"]') && action.closest('form')) {
        action.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      } else if (action) action.click();
      else {
        const form = app.querySelector('form');
        if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
      const resultAfter = Array.from(app.querySelectorAll(
        'output,[aria-live],.result,.results,.result-card,.result-panel,[id*="result" i]'
      )).map((element) => `${getComputedStyle(element).display}:${element.textContent.trim()}`).join('|');
      return {
        controls: controls.length,
        named: named.length,
        unnamed: controls.filter((element) => !named.includes(element)).map((element) => ({
          tag: element.tagName,
          type: element.getAttribute('type') || '',
          id: element.id || '',
          text: element.textContent.trim(),
          placeholder: element.getAttribute('placeholder') || ''
        })),
        action: action
          ? (action.textContent || action.value || action.getAttribute('aria-label')).trim()
          : routeLink ? `Open ${routeLink.textContent.trim()}` : 'form-submit',
        routeTarget: routeLink ? routeLink.getAttribute('href') : '',
        workflowChanged: Boolean(routeLink) || app.innerText !== mainTextBefore || resultAfter !== resultBefore
      };
    });
    console.log(`Day 6 workflow result: ${JSON.stringify(result)}`);
    if (result.routeTarget) {
      const response = await page.request.get(result.routeTarget);
      expect(response.status(), `${row.route} selected workflow route`).toBe(200);
    }
    expect(result.controls, `${row.route} app-owned workflow controls`).toBeGreaterThan(0);
    expect(result.named, `${row.route} accessible workflow controls`).toBe(result.controls);
    expect(result.action, `${row.route} primary workflow action`).not.toBe('');
    expect(result.workflowChanged, `${row.route} primary workflow changes result state`).toBe(true);
  }
  expect(externalWrites, 'synthetic workflows make no external state-changing requests').toEqual([]);
});
