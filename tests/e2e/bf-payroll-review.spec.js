const { test, expect } = require('@playwright/test');
const SAVED_KEY = 'afrotools-saved-bf-paye';
const SAVED_BYTES = JSON.stringify([{ id: 'synthetic-old-payroll', title: 'Synthetic prior salary', data: { grossSalary: '987654', salarySlider: '987654', summary: 'XOF 999,999/month SYNTHETIC OLD NET' }, thumbnail: null, createdAt: 1767225600000, updatedAt: 1767225600000 }]);
async function expectHistoricalDataProtected(page, context) {
  await expect(page.locator('#paye-saved-section, #paye-save-wrapper, .paye-saved-card')).toHaveCount(0);
  expect(await page.locator('body').innerText()).not.toMatch(/SYNTHETIC OLD NET|Synthetic prior salary|Your Saved Calculations/);
  const state = await context.storageState();
  const saved = state.origins.flatMap(origin => origin.localStorage).filter(item => item.name === SAVED_KEY);
  expect(saved).toEqual([{ name: SAVED_KEY, value: SAVED_BYTES }]);
}
const targets = [
  ['en', '/burkina-faso/bf-paye', 'Payroll calculation unavailable'],
  ['fr', '/fr/burkina-faso/calculateur-salaire-net', 'Calcul de paie indisponible'],
  ['sw', '/sw/burkina-faso/kikokotoo-kodi-mshahara/', 'Hesabu ya mshahara haipatikani']
];
for (const [lang, route, heading] of targets) {
  test(lang + ': inputs survive and every payroll output entry point stays unavailable', async ({ page }, testInfo) => {
    const errors = [], downloads = [], popups = [], submissions = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('download', download => downloads.push(download.suggestedFilename()));
    page.on('popup', popup => popups.push(popup.url()));
    await page.route('**/*', async intercepted => {
      if (/google-analytics|googletagmanager|googlesyndication|googleadservices|google\.com\/g\/collect/.test(intercepted.request().url())) return intercepted.abort();
      if (intercepted.request().method() === 'POST') { submissions.push(intercepted.request().url()); return intercepted.abort(); }
      return intercepted.continue();
    });
    await page.addInitScript(({ key, value }) => {
      localStorage.setItem('afrotools_cookie_consent', 'declined');
      localStorage.setItem(key, value);
    }, { key: SAVED_KEY, value: SAVED_BYTES });
    await page.goto(route + '?id=synthetic-old-payroll');
    await expectHistoricalDataProtected(page, page.context());
    await expect(page.locator('#bf-payroll-review h2')).toHaveText(heading);
    await expect(page.locator('#sources-verification')).toHaveAttribute('data-source-freshness', 'stale');
    await expect(page.locator('#sources-verification time')).toHaveAttribute('datetime', '2025-07-01');
    await page.locator('#grossSalary').fill('123456');
    await page.locator('#grossSalary').press('Enter');
    await expect(page.locator('#bf-review-action')).not.toBeEmpty();
    await page.locator('.calc-btn').click();
    await expect(page.locator('#grossSalary')).toHaveValue('123456');
    await page.evaluate(async () => {
      // Even a stale global result cannot reactivate the old exporters.
      window.RESULT = { gross: 12000000, net: 8742900, annualIUTS: 2861100 };
      for (const name of ['calculate','calcNetForGross','generatePdf','downloadPdfSummary','openPdfModal','submitPdf','shareResult','getAI','sendChat','renderChart','setPeriod']) {
        if (typeof window[name] !== 'function') throw new Error('Missing blocked entry point: ' + name);
        const value = await window[name]();
        if (value !== null) throw new Error('Output gate returned a result: ' + name);
      }
    });
    expect(await page.evaluate(() => window.RESULT)).toBeNull();
    await expect(page.locator('#resultsCard, #resAmount, #pdfModal, .action-row, .mode-toggle, .ai-card, .fr-finance-export-contract')).toHaveCount(0);
    expect(await page.locator('body').innerText()).not.toMatch(/0%[–—-]31%|0%[–—-]27,5%|Barème DGI 2026|27,5% au-delà|After IUTS, CNSS|Après IUTS et toutes/);
    await expectHistoricalDataProtected(page, page.context());
    expect(await page.evaluate(() => typeof window.PAYE_SAVE_SLUG)).toBe('undefined');
    expect(await page.evaluate(() => typeof window._grossToNet)).toBe('undefined');
    await page.setViewportSize({ width: 320, height: 780 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(lang + '-review-mobile.png'), fullPage: true });
    expect(errors).toEqual([]); expect(downloads).toEqual([]); expect(popups).toEqual([]); expect(submissions).toEqual([]);
  });
  for (const failure of ['no-javascript', 'runtime-blocked']) {
    test(lang + ': fails closed with ' + failure, async ({ browser, baseURL }) => {
      const context = await browser.newContext({ javaScriptEnabled: failure !== 'no-javascript', serviceWorkers: 'block', storageState: { cookies: [], origins: [{ origin: new URL(baseURL).origin, localStorage: [{ name: SAVED_KEY, value: SAVED_BYTES }] }] } });
      const page = await context.newPage();
      if (failure === 'runtime-blocked') await page.route('**/bf-payroll-review.js*', request => request.abort());
      await page.goto(route + '?id=synthetic-old-payroll');
      await expect(page.locator('#bf-payroll-review h2')).toHaveText(heading);
      await page.locator('#grossSalary').fill('654321');
      await expect(page.locator('#grossSalary')).toHaveValue('654321');
      await expect(page.locator('#resultsCard, #resAmount, #pdfModal, .action-row, .mode-toggle, .ai-card, .fr-finance-export-contract')).toHaveCount(0);
      if (failure === 'runtime-blocked') expect(await page.evaluate(() => typeof window.calcMonthlyPAYE)).toBe('undefined');
      await expectHistoricalDataProtected(page, context);
      await context.close();
    });
  }
}
