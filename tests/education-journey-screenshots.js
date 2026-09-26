'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const out = path.join(__dirname, '..', 'artifacts', 'education-upgrade-2026-09-25');
const before = process.env.EDUCATION_BASELINE_URL || 'http://127.0.0.1:4174';
const after = process.env.EDUCATION_PREVIEW_URL || 'http://127.0.0.1:4175';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
    await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    for (const [label, route] of [
      ['school-fees', '/tools/school-fees/app.html'],
      ['waec-results', '/tools/waec-calculator/'],
      ['study-abroad-budget', '/tools/study-abroad-cost/']
    ]) {
      await page.goto(before + route, { waitUntil: 'domcontentloaded' });
      await page.screenshot({ path: path.join(out, 'before-' + label + '.png') });
      await page.goto(after + route, { waitUntil: 'domcontentloaded' });
      await page.screenshot({ path: path.join(out, 'after-' + label + '.png') });
    }
    await page.route('**/api/school-fees?**', (route) => route.abort());
    await page.goto(after + '/tools/school-fees/app.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#sfManualCurrency').fill('NGN');
    await page.locator('#sfManualPeriod').selectOption('Term');
    await page.locator('#sfName1').fill('Example School A');
    await page.locator('#sfTuition1').fill('120000');
    await page.locator('#sfExtras1').fill('30000');
    await page.locator('#sfName2').fill('Example School B');
    await page.locator('#sfTuition2').fill('110000');
    await page.locator('#sfExtras2').fill('5000');
    await page.getByRole('button', { name: 'Compare quotes' }).click();
    await page.locator('#sfManualResult').waitFor({ state: 'visible' });
    await page.locator('section.md-panel').first().screenshot({ path: path.join(out, 'after-school-fees-manual-result.png') });
    await page.goto(after + '/tools/waec-calculator/', { waitUntil: 'domcontentloaded' });
    await page.locator('#ngExamSelect').selectOption('waec');
    await page.getByRole('button', { name: 'Load sample grades' }).click();
    await page.locator('.wc-action-links').screenshot({ path: path.join(out, 'after-waec-nigeria-next-actions.png') });
    await page.goto(after + '/tools/study-abroad-cost/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Calculate study budget' }).click();
    await page.locator('#costError').screenshot({ path: path.join(out, 'after-study-abroad-incomplete.png') });
    console.log('Captured Education journey screenshots in ' + out);
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
