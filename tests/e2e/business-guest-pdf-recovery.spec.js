'use strict';

const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const pdfParse = require('pdf-parse');

test.beforeEach(async ({ page, context, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(baseURL).origin && route.request().method() === 'GET' && !/^\/(?:api\/|\.netlify\/)/.test(url.pathname)) return route.continue();
    return route.abort();
  });
});

async function makePlan(page, code, type, industry = 'Retail & E-commerce') {
  await page.locator(`.country-card[data-code="${code}"]`).click();
  await expect(page.locator('#biz-type')).toBeFocused();
  await page.locator('#biz-type').selectOption(type);
  await page.locator('#biz-industry').selectOption(industry);
  await page.locator('#btn-plan').click();
  await expect(page.locator('#btn-pdf')).toBeVisible();
}

async function downloadPlan(page, freeEdition = true) {
  const pending = page.waitForEvent('download');
  await page.locator('#btn-pdf').click();
  const bytes = await fs.readFile(await (await pending).path());
  await expect(page.locator('#business-pdf-status')).toHaveText('PDF downloaded.');
  await expect(page.locator('#btn-pdf')).toBeEnabled();
  const pages = [];
  const parsed = await pdfParse(bytes, { pagerender: async data => {
    const text = await data.getTextContent();
    const content = text.items.map(item => item.str).join('\n');
    pages.push({ content, items: text.items });
    return content;
  } });
  expect(parsed.text).not.toContain('\u0000');
  expect(parsed.text).not.toContain('AFROTOOLS FREE');
  for (const page of pages) {
    if (freeEdition) expect(page.content).toContain('Free edition');
    else expect(page.content).not.toContain('Free edition');
  }
  return { parsed, pages };
}

for (const [code, type, country, symbol] of [
  ['NG', 'Non-Governmental Organization (NGO)', 'Nigeria', '₦'],
  ['KE', 'Private Limited Company', 'Kenya', 'KSh'],
  ['ZA', 'Private Company (Pty) Ltd', 'South Africa', 'R'],
  ['ET', 'Private Limited Company (PLC)', 'Ethiopia', 'ETB']
]) {
  test(`${code} guest action-plan PDF preserves selected fields and readable layout`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/tools/business-planner/');
    await makePlan(page, code, type);
    const { parsed, pages } = await downloadPlan(page);
    for (const field of [country, symbol, type, 'Retail & E-commerce']) expect(parsed.text).toContain(field);
    for (const page of pages) {
      for (const item of page.items.filter(item => item.str.trim())) {
        expect(item.transform[4]).toBeGreaterThanOrEqual(0);
        expect(item.transform[4] + item.width).toBeLessThanOrEqual(596);
      }
    }
    if (code === 'NG') {
      const filingPage = pages.find(page => page.content.includes('FILING DEADLINES'));
      expect(filingPage).toBeTruthy();
      expect(filingPage.content.split('FILING DEADLINES')[1]).toContain('Within 6 months of financial year end');
    }
    if (code === 'KE') {
      const followupPage = pages.find(page => /PHASE 5: FOLLOW-UPS/.test(page.content));
      expect(followupPage).toBeTruthy();
      expect(followupPage.content.split('PHASE 5:')[1]).toContain('Save the registration certificate, tax ID, receipt, and application reference numbers');
    }
    expect(errors).toEqual([]);
  });
}

for (const width of [320, 390, 1280]) {
  test(`country selection supports Enter and Space at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tools/business-planner/');
    for (const [code, key] of [['NG', 'Enter'], ['KE', 'Space']]) {
      const button = page.locator(`.country-card[data-code="${code}"]`);
      await expect(button).toHaveRole('button');
      await button.focus();
      await page.keyboard.press(key);
      await expect(page.locator(`.country-card[data-code="${code}"]`)).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#biz-type')).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

test('free PDF recovers after font failure and retains the generated plan industry', async ({ page }) => {
  await page.goto('/tools/business-planner/');
  await makePlan(page, 'NG', 'Sole Proprietorship (Business Name)');
  await page.locator('#biz-industry').selectOption('Agriculture & Agribusiness');
  await page.route('**/assets/fonts/noto-sans/*.ttf', route => route.abort());
  await page.locator('#btn-pdf').click();
  await expect(page.locator('#business-pdf-status')).toHaveText('PDF could not be created. Try again, or use Print to save the plan.');
  await expect(page.locator('#btn-pdf')).toBeEnabled();
  await page.unroute('**/assets/fonts/noto-sans/*.ttf');
  const { parsed } = await downloadPlan(page);
  expect(parsed.text).toContain('Industry: Retail & E-commerce');
  expect(parsed.text).not.toContain('Industry: Agriculture & Agribusiness');
});

test('font loading has a deadline and a subsequent download can recover', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tools/business-planner/');
  await makePlan(page, 'NG', 'Sole Proprietorship (Business Name)');
  let requests = 0;
  await page.route('**/assets/fonts/noto-sans/*.ttf', () => { requests++; });
  await page.locator('#btn-pdf').click();
  await expect(page.locator('#btn-pdf')).toBeDisabled();
  await expect.poll(() => requests).toBe(2);
  await expect(page.locator('#business-pdf-status')).toHaveText(
    'PDF could not be created. Try again, or use Print to save the plan.', { timeout: 15000 }
  );
  await expect(page.locator('#btn-pdf')).toBeEnabled();
  await page.unroute('**/assets/fonts/noto-sans/*.ttf');
  const { parsed } = await downloadPlan(page);
  expect(parsed.text).toContain('Nigeria');
  expect(errors).toEqual([]);
});

test('an in-flight PDF does not download an obsolete plan or duplicate work', async ({ page }) => {
  const held = [], downloads = [];
  page.on('download', download => downloads.push(download));
  await page.goto('/tools/business-planner/');
  await makePlan(page, 'NG', 'Sole Proprietorship (Business Name)');
  await page.route('**/assets/fonts/noto-sans/*.ttf', route => { held.push(route); });
  await page.locator('#btn-pdf').click();
  await expect(page.locator('#btn-pdf')).toBeDisabled();
  await page.locator('#btn-pdf').evaluate(button => button.click());
  await expect.poll(() => held.length).toBe(2);
  await makePlan(page, 'KE', 'Private Limited Company');
  await Promise.all(held.map(route => route.continue()));
  await expect(page.locator('#business-pdf-status')).toHaveText('The plan changed. Download the updated plan.');
  await expect(page.locator('#btn-pdf')).toBeEnabled();
  expect(downloads).toHaveLength(0);
  const { parsed } = await downloadPlan(page);
  expect(parsed.text).toContain('Kenya');
  expect(parsed.text).not.toContain('Nigeria');
  expect(downloads).toHaveLength(1);
});

async function openSyntheticSavedPlan(page, industry) {
  await makePlan(page, 'ZA', 'Private Company (Pty) Ltd');
  await page.evaluate(industry => {
    const saved = {
      id: 'synthetic-plan', country_code: 'ZA', business_type: 'Private Company (Pty) Ltd',
      industry, description: '', created_at: '2026-01-01T00:00:00Z',
      executive_summary: 'Synthetic saved business summary for export testing.',
      action_plan: window.BusinessPlannerEngine.generateActionPlan({
        countryCode: 'ZA', businessType: 'Private Company (Pty) Ltd', hasEmployees: false
      })
    };
    delete saved.action_plan.industry;
    const query = {
      select() { return query; }, eq() { return query; }, order() { return query; },
      limit: async () => ({ data: [saved], error: null }),
      single: async () => ({ data: saved, error: null })
    };
    window.AfroAuth = {
      isLoggedIn: () => true, getUser: () => ({ id: 'synthetic-user' }),
      getSupabase: () => ({ from: () => query })
    };
    window.AfroProGate.isPro = async () => true;
    window.dispatchEvent(new Event('afro-auth-change'));
  }, industry);
  await page.locator('#btn-my-plans').click();
  await page.locator('.saved-plan-item[data-plan-id="synthetic-plan"] .saved-plan-info').click();
  await expect(page.locator('#btn-pdf')).toBeVisible();
}

for (const industry of ['Agriculture & Agribusiness', null]) {
  test(`legacy saved plan preserves ${industry || 'missing'} industry metadata in its action-plan PDF`, async ({ page }) => {
    await page.goto('/tools/business-planner/');
    await openSyntheticSavedPlan(page, industry);
    await page.locator('#biz-industry').selectOption('Retail & E-commerce');
    const { parsed } = await downloadPlan(page, false);
    expect(parsed.text).toContain('Industry: ' + (industry || 'Not recorded'));
    expect(parsed.text).not.toContain('Industry: Retail & E-commerce');
  });
}

test('the unchanged full-plan PDF callback uses the local jsPDF dependency', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tools/business-planner/');
  await openSyntheticSavedPlan(page, 'Retail & E-commerce');
  const pending = page.waitForEvent('download');
  await page.locator('#btn-pro-pdf').click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('AfroTools-PRO-Business-Plan-South-Africa.pdf');
  const parsed = await pdfParse(await fs.readFile(await download.path()));
  expect(parsed.text).toContain('South Africa');
  expect(parsed.text).toContain('Synthetic saved business summary for export testing.');
  expect(errors).toEqual([]);
});
