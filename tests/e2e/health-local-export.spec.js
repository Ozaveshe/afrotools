const { test, expect } = require('@playwright/test');

const routes = [
  '/tools/medical-report/',
  '/tools/drug-dosage/',
  '/health/pregnancy-due-date/',
];

function isForbiddenExportRequest(url) {
  return /\/api\/(?:capture-lead|workspace)|supabase|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/i.test(url);
}

async function installPrivacyProbe(page, signedIn) {
  await page.addInitScript(({ signedIn }) => {
    window.__healthAnalytics = [];
    window.__healthUpserts = [];
    window.AfroTools = window.AfroTools || {};
    window.AfroTools.analytics = {
      track(name, payload) {
        window.__healthAnalytics.push({ name, payload });
      },
    };
    window.AfroWorkspace = {
      isSignedIn() {
        return signedIn;
      },
      upsert(payload) {
        window.__healthUpserts.push(payload);
        return Promise.resolve();
      },
    };
  }, { signedIn });
}

for (const route of routes) {
  test(`${route} primary PDF stays local and ungated`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await installPrivacyProbe(page, false);

    const actionRequests = [];
    page.on('request', (request) => {
      if (page.__healthActionStarted) actionRequests.push(request.url());
    });

    await page.goto(route, { waitUntil: 'domcontentloaded' });
    if (route === '/tools/medical-report/') {
      await page.fill('#labInput', 'WBC: 7.2 x10^9/L\nHemoglobin: 13.5 g/dL');
      await page.click('#analyzeBtn');
      await expect(page.locator('#resultsContainer')).toHaveClass(/on/);
    }
    await page.evaluate(() => {
      window.AfroHealthWorkflow.recordSnapshot({
        toolId: document.querySelector('[data-health-action="pdf"]').getAttribute('data-health-tool-id'),
        headline: 'Synthetic visit-prep result',
        fields: [{ label: 'Synthetic measurement', value: 'PRIVATE_BROWSER_HEALTH_SENTINEL' }],
      });
    });

    const pdfButton = page.locator('[data-health-action="pdf"]').first();
    await expect(pdfButton).toBeVisible();
    await pdfButton.focus();
    await expect(pdfButton).toBeFocused();
    page.__healthActionStarted = true;
    const downloadPromise = page.waitForEvent('download');
    await pdfButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^afrotools-health-.+\.pdf$/);
    expect(actionRequests.filter(isForbiddenExportRequest)).toEqual([]);
    expect(actionRequests.filter((url) => /jspdf/i.test(url))).toEqual([
      expect.stringMatching(/\/assets\/vendor\/jspdf\/jspdf\.umd\.min\.js$/),
    ]);
    await expect(page.locator('.health-email-modal, email-gate-modal:visible')).toHaveCount(0);
    expect(await page.evaluate(() => window.__healthUpserts)).toEqual([]);
    const analytics = JSON.stringify(await page.evaluate(() => window.__healthAnalytics));
    expect(analytics).not.toContain('PRIVATE_BROWSER_HEALTH_SENTINEL');
    expect(await page.evaluate(() => localStorage.getItem('afro_health_plans'))).toBeNull();
  });
}

test('/health/ journey PDF is local even while signed in', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await installPrivacyProbe(page, true);
  const actionRequests = [];
  page.on('request', (request) => {
    if (page.__healthActionStarted) actionRequests.push(request.url());
  });

  await page.goto('/health/', { waitUntil: 'domcontentloaded' });
  const pdfButton = page.locator('[data-health-action="pdf-journey"]').first();
  await expect(pdfButton).toBeVisible();
  page.__healthActionStarted = true;
  const downloadPromise = page.waitForEvent('download');
  await pdfButton.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  expect(actionRequests.filter(isForbiddenExportRequest)).toEqual([]);
  expect(await page.evaluate(() => window.__healthUpserts)).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('afro_health_plans'))).toBeNull();
});
