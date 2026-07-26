const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

const route = '/tools/university-ranking/';

async function fillCandidate(page, index, values) {
  const card = page.locator('.uv-candidate').nth(index);
  for (const [field, value] of Object.entries(values)) {
    await card.locator(`[data-field="${field}"]`).fill(String(value));
  }
}

test.describe('University comparison VIP', () => {
  test('compares user evidence without publishing an editorial ranking', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_UNIVERSITY_VIP === true);
    await fillCandidate(page, 0, {
      name: 'University A — Engineering',
      country: 'Kenya',
      url: 'https://example.edu/programme-a',
      tuition: 1000,
      living: 2000,
      other: 500,
      deadline: '2027-01-31',
      notes: 'Fee period checked'
    });
    await page.locator('.uv-candidate').nth(0).locator('[data-field="accreditation"]').selectOption('confirmed');
    await fillCandidate(page, 1, {
      name: 'University B — Engineering',
      country: 'Ghana',
      url: 'https://example.edu/programme-b',
      tuition: 1500,
      living: 2200,
      other: 600,
      deadline: '2027-02-28',
      notes: 'International deadline checked'
    });
    await page.locator('.uv-candidate').nth(1).locator('[data-field="accreditation"]').selectOption('unclear');
    await page.getByRole('button', { name: 'Compare shortlist' }).click();
    await expect(page.locator('#comparisonBody')).toContainText('University A');
    await expect(page.locator('#comparisonBody')).toContainText('Lowest complete entered cost');
    await expect(page.locator('#comparisonBody')).toContainText('Unclear — follow up');
    await expect(page.locator('body')).not.toContainText('Top-tier research reputation');
    expect(errors).toEqual([]);
  });

  test('does not compare incomplete cost totals as though they were equivalent', async ({ page }) => {
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_UNIVERSITY_VIP === true);
    await fillCandidate(page, 0, { name: 'Complete A', tuition: 100, living: 200, other: 0 });
    await fillCandidate(page, 1, { name: 'Incomplete B', tuition: 50 });
    await page.getByRole('button', { name: 'Compare shortlist' }).click();
    await expect(page.locator('#comparisonNotes')).toContainText('Fewer than two candidates');
    await expect(page.locator('#comparisonBody tr').nth(1)).toContainText('Not fully entered');
    await expect(page.locator('#comparisonBody tr').nth(1)).not.toContainText('Lowest complete entered cost');
  });

  test('blocks unsafe URLs and invalid money with an accessible error', async ({ page }) => {
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_UNIVERSITY_VIP === true);
    await fillCandidate(page, 0, { name: 'Unsafe URL', url: 'javascript:alert(1)' });
    await fillCandidate(page, 1, { name: 'Other candidate' });
    await page.getByRole('button', { name: 'Compare shortlist' }).click();
    await expect(page.locator('#comparisonError')).toContainText('complete http or https');
    await expect(page.locator('#comparisonResults')).toBeHidden();
  });

  test('exports an auditable summary, creates PDF output and sends no entries', async ({ page }) => {
    const writes = [];
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        writes.push(`${request.url()} ${request.postData() || ''}`);
      }
    });
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_UNIVERSITY_VIP === true);
    const privateName = 'Private Candidate 9472139';
    await fillCandidate(page, 0, { name: privateName, tuition: 100, living: 200, other: 0 });
    await fillCandidate(page, 1, { name: 'Second Candidate', tuition: 200, living: 300, other: 0 });
    await page.getByRole('button', { name: 'Compare shortlist' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download TXT' }).click();
    const download = await downloadPromise;
    const text = fs.readFileSync(await download.path(), 'utf8');
    expect(text).toContain(privateName);
    expect(text).toContain('AfroTools did not fetch exchange rates');
    expect(text).toContain('does not rank quality');
    await page.evaluate(() => {
      window.__universityPrintCalled = false;
      window.print = () => { window.__universityPrintCalled = true; };
    });
    await page.getByRole('button', { name: 'Print / save PDF' }).click();
    await expect.poll(() => page.evaluate(() => window.__universityPrintCalled)).toBe(true);
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(20000);
    expect(writes.every(payload => !decodeURIComponent(payload).includes(privateName))).toBe(true);
  });

  for (const width of [320, 360]) {
    test(`reflows without page overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 });
      await page.goto(route, { waitUntil: 'commit' });
      await page.waitForFunction(() => window.AFROTOOLS_UNIVERSITY_VIP === true);
      await fillCandidate(page, 0, { name: 'University A', tuition: 100, living: 200, other: 0 });
      await fillCandidate(page, 1, { name: 'University B', tuition: 200, living: 300, other: 0 });
      await page.getByRole('button', { name: 'Compare shortlist' }).click();
      const metrics = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth
      }));
      expect(metrics.scroll).toBeLessThanOrEqual(metrics.client + 1);
    });
  }

  test('remains readable in dark mode at 375px and 200% text', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_UNIVERSITY_VIP === true);
    await page.waitForFunction(() => window.AfroTools && window.AfroTools.darkMode);
    await page.evaluate(() => {
      window.AfroTools.darkMode.set('dark');
      document.documentElement.style.fontSize = '200%';
    });
    const state = await page.evaluate(() => {
      const card = document.querySelector('.uv-candidate');
      return {
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
        bg: getComputedStyle(card).backgroundColor,
        fg: getComputedStyle(card.querySelector('h3')).color
      };
    });
    expect(state.scroll).toBeLessThanOrEqual(state.client + 1);
    expect(state.bg).not.toBe(state.fg);
  });

  test('all worksheet controls have accessible names', async ({ page }) => {
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => window.AFROTOOLS_UNIVERSITY_VIP === true);
    const unnamed = await page.evaluate(() => Array.from(
      document.querySelectorAll('main input, main button, main select, main textarea')
    ).filter(element => {
      const label = element.id && document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      return !label && !element.getAttribute('aria-label') && !element.textContent.trim();
    }).map(element => element.outerHTML.slice(0, 100)));
    expect(unnamed).toEqual([]);
  });
});
