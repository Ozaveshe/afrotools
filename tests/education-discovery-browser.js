'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const base = process.env.EDUCATION_PREVIEW_URL || 'http://127.0.0.1:4175';
const baseline = process.env.EDUCATION_BASELINE_URL || '';
const out = path.join(__dirname, '..', 'artifacts', 'education-upgrade-2026-09-25');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await browser.newPage({ viewport: { width: 1365, height: 900 }, deviceScaleFactor: 1 });
    const mobile = await browser.newPage({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 1 });
    for (const page of [desktop, mobile]) {
      await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    }
    if (baseline) {
      await desktop.goto(baseline + '/education/', { waitUntil: 'networkidle' });
      await desktop.screenshot({ path: path.join(out, 'before-hub-desktop.png'), fullPage: true });
      await mobile.goto(baseline + '/education/', { waitUntil: 'networkidle' });
      await mobile.screenshot({ path: path.join(out, 'before-hub-mobile-360.png'), fullPage: true });
    }
    for (const [page, label] of [[desktop, 'desktop'], [mobile, 'mobile-360']]) {
      await page.goto(base + '/education/', { waitUntil: 'networkidle' });
      assert.equal(await page.locator('.edu-task').count(), 5);
      assert.equal(await page.locator('.edu-directory-links a').count(), 43);
      assert.equal(await page.locator('.edu-directory-links a:visible').count(), 43);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, label + ' horizontal overflow');
      await page.screenshot({ path: path.join(out, 'after-hub-' + label + '.png'), fullPage: true });
      await page.locator('#education-search').fill('JAMB aggregate');
      assert.equal(await page.locator('.edu-directory-links a:visible').count(), 1);
      assert.match(await page.locator('.edu-directory-links a:visible').first().getAttribute('href'), /jamb-aggregate/);
      await page.locator('#education-search').fill('citations');
      assert.equal(await page.locator('.edu-directory-links a:visible').count(), 1);
      await page.locator('#education-search').fill('');
      await page.locator('#education-country').selectOption('GH');
      await page.locator('#education-exam').selectOption('wassce');
      assert.equal(await page.locator('.edu-directory-links a:visible').count(), 1);
      assert.match(await page.locator('.edu-directory-links a:visible').first().getAttribute('href'), /waec-calculator/);
      await page.locator('#education-search').focus();
      assert.equal(await page.evaluate(() => document.activeElement.id), 'education-search');
    }
    for (const slug of ['fees', 'loans', 'scholarships', 'study-abroad']) {
      const response = await desktop.goto(base + '/education/' + slug + '/', { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200, slug);
      const raw = await response.text();
      assert.match(raw, /class="edu-tool-card"/, slug + ' initial HTML');
      assert.ok(await desktop.locator('#edu-subhub-tools a').count() >= 4, slug + ' settled DOM');
      assert.equal(await desktop.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, slug + ' overflow');
      await desktop.screenshot({ path: path.join(out, 'after-' + slug + '-desktop.png'), fullPage: true });
    }
    console.log('Education browser discovery checks passed; screenshots: ' + out);
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
