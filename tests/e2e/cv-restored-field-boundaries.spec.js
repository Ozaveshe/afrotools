const { test, expect } = require('@playwright/test');

test.use({ trace: 'off', screenshot: 'off', video: 'off', serviceWorkers: 'block' });
test.describe.configure({ timeout: 90000 });
const routes = { en: '/tools/cv-builder/', fr: '/fr/tools/generateur-cv/', sw: '/sw/zana/mjenzi-cv/' };
const authored = `Ɗanladi " data-cv-injected="true" data-other="O'Neil & <Saved>`;

for (const [locale, url] of Object.entries(routes)) {
  test(locale + ' restored CV target and tracker fields keep quotes inert and literal', async ({ page, baseURL }) => {
    const origin = new URL(baseURL).origin;
    await page.route('**/*', route => new URL(route.request().url()).origin === origin && route.request().method() === 'GET'
      ? route.continue() : route.fulfill({ status: 204, body: '' }));
    await page.addInitScript(value => {
      localStorage.setItem('afro_cv_copilot_target', JSON.stringify({ role: value, company: value, jd: 'Synthetic requirements', industry: '' }));
      localStorage.setItem('afro_cv_job_pipeline', JSON.stringify([{ id: 'synthetic-quoted-lead', role: value, jobTitle: value,
        company: value, country: 'NG', cityRemote: value, jobLink: value, source: value,
        salaryRange: value, status: 'saved', notes: value }]));
    }, authored);
    await page.goto(url);
    await page.waitForFunction(() => window.CVApplicationPack && window.CVJobTracker);
    await page.locator('[data-cv-entry="start"]').click();
    // Compare as booleans so failures never dump restored private-content fields.
    expect(await page.locator('[data-pack-role]').inputValue() === authored).toBe(true);
    expect(await page.locator('[data-pack-company]').inputValue() === authored).toBe(true);
    await expect(page.locator('[data-cv-injected]')).toHaveCount(0);
    await page.locator('[data-card-edit]').click();
    for (const field of ['jobTitle', 'company', 'cityRemote', 'jobLink', 'source', 'salaryRange']) {
      expect(await page.locator(`[data-job-field="${field}"]`).inputValue() === authored).toBe(true);
    }
    await expect(page.locator('[data-cv-injected]')).toHaveCount(0);
    // A malformed URL cannot be submitted as a URL. Clear only that synthetic
    // field after proving its literal rendering, then exercise normal saving.
    await page.locator('[data-job-field="jobLink"]').fill('');
    await page.locator('[data-tracker-form] button[type="submit"]').click();
    expect(await page.evaluate(value => {
      const lead = JSON.parse(localStorage.getItem('afro_cv_job_pipeline'))[0];
      return lead.jobTitle === value && lead.company === value && lead.notes === value;
    }, authored)).toBe(true);
    await expect(page.locator('[data-cv-injected]')).toHaveCount(0);
  });
}
