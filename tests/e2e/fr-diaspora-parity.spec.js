'use strict';

const { test, expect } = require('@playwright/test');

const APPS = [
  {
    id: 'immigration',
    route: '/fr/tools/calculateur-de-points-d-immigration/',
    form: '#fd-immigration-form',
  },
  {
    id: 'visa',
    route: '/fr/tools/suivi-de-demande-de-visa/',
    form: '#fd-visa-form',
  },
];

function observeRuntime(page) {
  const errors = [];
  const externalRequests = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') externalRequests.push(request.url());
  });
  return { errors, externalRequests };
}

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ));
  expect(overflow).toBeLessThanOrEqual(1);
}

async function assertNoZoomOffenders(page) {
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  const offenders = await page.evaluate(() => (
    [...document.querySelectorAll('*')]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > document.documentElement.clientWidth + 1;
      })
      .map((element) => ({
        tag: element.tagName,
        id: element.id,
        className: String(element.className || ''),
      }))
  ));
  expect(offenders).toEqual([]);
}

for (const app of APPS) {
  for (const width of [320, 375]) {
    for (const theme of ['light', 'dark']) {
      test(`${app.id} reflows at ${width}px, 200% and ${theme} without network or runtime errors`, async ({ browser }) => {
        const context = await browser.newContext({ viewport: { width, height: 812 } });
        const page = await context.newPage();
        const runtime = observeRuntime(page);
        const response = await page.goto(app.route, { waitUntil: 'networkidle' });
        expect(response.status()).toBe(200);
        await page.evaluate((selectedTheme) => {
          document.documentElement.dataset.theme = selectedTheme;
        }, theme);
        await expect(page.locator(app.form)).toBeVisible();
        await assertNoHorizontalOverflow(page);
        await assertNoZoomOffenders(page);
        expect(runtime.errors).toEqual([]);
        expect(runtime.externalRequests).toEqual([]);
        await context.close();
      });
    }
  }
}

test('immigration app preserves formulas, keyboard tabs, invalid state and real exports', async ({ page }) => {
  const runtime = observeRuntime(page);
  await page.goto('/fr/tools/calculateur-de-points-d-immigration/', { waitUntil: 'networkidle' });

  await page.locator('#fd-tab-ca').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#fd-tab-au')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#fd-tab-uk')).toHaveAttribute('aria-selected', 'true');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('#fd-immigration-error')).toContainText('salaire');

  await page.locator('#fd-tab-ca').click();
  await page.selectOption('#fd-ca-age', '110');
  await page.selectOption('#fd-ca-education', '135');
  await page.selectOption('#fd-ca-clb', '9');
  await page.selectOption('#fd-ca-canada-experience', '53');
  await page.selectOption('#fd-ca-foreign-experience', '3');
  await page.selectOption('#fd-ca-sibling', '15');
  await page.selectOption('#fd-ca-study', '30');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('#fd-result-score')).toHaveText('567 points');

  for (const [selector, filename] of [
    ['#fd-immigration-json', 'verification-points-immigration.json'],
    ['#fd-immigration-txt', 'verification-points-immigration.txt'],
  ]) {
    const downloadPromise = page.waitForEvent('download');
    await page.locator(selector).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(filename);
  }

  let printCalled = false;
  await page.exposeFunction('recordFrenchDiasporaPrint', () => {
    printCalled = true;
  });
  await page.evaluate(() => {
    window.print = () => window.recordFrenchDiasporaPrint();
  });
  await page.locator('#fd-immigration-print').click();
  expect(printCalled).toBe(true);
  expect(runtime.errors).toEqual([]);
  expect(runtime.externalRequests).toEqual([]);
});

test('visa app validates jurisdiction, keeps storage explicit, exports and reopens JSON', async ({ page, browser }) => {
  const runtime = observeRuntime(page);
  await page.goto('/fr/tools/suivi-de-demande-de-visa/', { waitUntil: 'networkidle' });

  await page.locator('button[type="submit"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#fd-visa-error')).toContainText('juridiction');
  await page.selectOption('#fd-visa-destination', 'UK');
  await expect(page.locator('#fd-visa-source-link')).toHaveAttribute('href', /gov\.uk/);
  await expect(page.locator('#fd-visa-source-link')).toHaveCSS('display', 'grid');
  expect(await page.locator('#fd-visa-source-link').evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);

  await page.selectOption('#fd-visa-type', 'work');
  await page.fill('#fd-visa-submitted', '2026-07-01');
  await page.fill('#fd-visa-minimum', '4');
  await page.fill('#fd-visa-maximum', '2');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('#fd-visa-error')).toContainText('maximum');
  await page.fill('#fd-visa-minimum', '2');
  await page.fill('#fd-visa-maximum', '4');
  await page.selectOption('#fd-visa-unit', 'weeks');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('#fd-visa-results')).toBeVisible();
  const originalResult = {
    elapsed: await page.locator('#fd-visa-elapsed').textContent(),
    status: await page.locator('#fd-visa-result-status').textContent(),
    timeline: await page.locator('#fd-visa-timeline').textContent(),
  };
  await expect(page.locator('#fd-visa-status')).toContainText('rien n’est enregistré automatiquement');
  expect(await page.evaluate(() => localStorage.getItem('afro_fr_visa_timeline_v1'))).toBeNull();

  await page.locator('#fd-visa-save').click();
  expect(await page.evaluate(() => localStorage.getItem('afro_fr_visa_timeline_v1'))).not.toBeNull();

  const jsonDownloadPromise = page.waitForEvent('download');
  await page.locator('#fd-visa-json').click();
  const jsonDownload = await jsonDownloadPromise;
  expect(jsonDownload.suggestedFilename()).toBe('calendrier-demande-visa.json');
  const jsonPath = await jsonDownload.path();

  const textDownloadPromise = page.waitForEvent('download');
  await page.locator('#fd-visa-txt').click();
  const textDownload = await textDownloadPromise;
  expect(textDownload.suggestedFilename()).toBe('calendrier-demande-visa.txt');

  const reopenContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const reopenPage = await reopenContext.newPage();
  const reopenRuntime = observeRuntime(reopenPage);
  await reopenPage.goto(new URL('/fr/tools/suivi-de-demande-de-visa/', page.url()).href, { waitUntil: 'networkidle' });
  expect(await reopenPage.evaluate(() => localStorage.getItem('afro_fr_visa_timeline_v1'))).toBeNull();
  await reopenPage.locator('#fd-visa-import').setInputFiles(jsonPath);
  await expect(reopenPage.locator('#fd-visa-status')).toContainText('rouvert localement');
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
  await reopenContext.close();

  await page.locator('#fd-visa-delete').click();
  expect(await page.evaluate(() => localStorage.getItem('afro_fr_visa_timeline_v1'))).toBeNull();
  expect(runtime.errors).toEqual([]);
  expect(runtime.externalRequests).toEqual([]);
});

test('both apps expose labels, status regions, canonicals, reciprocal hreflang, OG and schema', async ({ page }) => {
  for (const app of APPS) {
    await page.goto(app.route);
    const unlabeled = await page.locator(`${app.form} input:not([type="checkbox"]), ${app.form} select`).evaluateAll((elements) => (
      elements.filter((element) => {
        const labels = element.labels ? [...element.labels] : [];
        return labels.length === 0 && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby');
      }).map((element) => element.id)
    ));
    expect(unlabeled).toEqual([]);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="fr"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(1);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThanOrEqual(2);
    await expect(page.locator('[role="status"]')).toHaveCount(1);
  }
});

test('French Diaspora hub exposes exactly two cards and reflows at 320/375 in both themes', async ({ browser }) => {
  for (const width of [320, 375]) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 812 } });
      const page = await context.newPage();
      const runtime = observeRuntime(page);
      const response = await page.goto('/fr/diaspora/', { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
      await page.evaluate((selectedTheme) => {
        document.documentElement.dataset.theme = selectedTheme;
      }, theme);
      await expect(page.locator('.fd-tool-card')).toHaveCount(2);
      await assertNoHorizontalOverflow(page);
      await assertNoZoomOffenders(page);
      expect(runtime.errors).toEqual([]);
      expect(runtime.externalRequests).toEqual([]);
      await context.close();
    }
  }
});
