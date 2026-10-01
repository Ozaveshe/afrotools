const { test, expect } = require('@playwright/test');
const { renderYear } = require('../../scripts/build-jamb-reviewed-pages');
const { questionFingerprint } = require('../../scripts/lib/jamb-content-trust');

function syntheticYearPage() {
  const sourceHash = 'a'.repeat(64);
  const source = { source_file: 'synthetic fixture', content_sha256: sourceHash,
    source_url: 'https://example.com/collection', publisher: 'Example', year_basis: 'publisher-collection', collection_year: 2024,
    reuse_authorization: { status: 'authorized-by-owner', basis: 'owner-directed-public-source',
      scope: 'AfroTools past-question practice', material_sha256: sourceHash,
      authorized_by: 'test', authorized_at: '2026-09-26', instruction_ref: 'synthetic fixture' } };
  const review = { status: 'accepted', reviewer: 'synthetic fixture', reviewed_at: '2026-09-26', evidence: 'synthetic fixture only' };
  const questions = ['one', 'two'].map((suffix) => ({
    id: 'synthetic-reviewed-' + suffix, subject: 'english', year: 2024, num: null,
    question: 'Which word means clear? Synthetic example ' + suffix,
    options: { A: 'Opaque', B: 'Plain', C: 'Hidden', D: 'Blurred' }, answer: 'B',
    format: 4, has_diagram: false, explanation: 'Plain can mean clear.',
    source_provenance: { publisher: 'Example', url: 'https://example.com/collection', year_basis: 'publisher-collection' }
  }));
  const ledger = { sources: { fixture: source }, questions: {} };
  questions.forEach((question) => {
    ledger.questions[question.id] = { content_sha256: questionFingerprint(question), source_id: 'fixture',
      question_review: review, answer_review: review, explanation_review: review };
  });
  const rendered = renderYear('english', 2024, questions, ledger);
  if (rendered.approvedIds.length !== 2) throw new Error('Synthetic JAMB browser fixture was not approved');
  return rendered.html;
}

async function cohortEvents(page) {
  return page.evaluate(() => (window.dataLayer || [])
    .map((command) => Array.from(command))
    .filter(([action, name]) => action === 'event' && /^education_practice_(?:cohort_started|returned)$/.test(name))
    .map(([, name, params]) => ({ name, params })));
}

for (const consent of ['accepted', 'declined']) {
  test(`synthetic JAMB 2024 answer reveal at 390px respects ${consent} analytics consent`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(status => {
      localStorage.setItem('afrotools_cookie_consent', status);
    }, consent);
    const html = syntheticYearPage();
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/jamb/english/2024/' && ['127.0.0.1', 'localhost'].includes(url.hostname)) {
        return route.fulfill({ contentType: 'text/html', body: html });
      }
      if (['127.0.0.1', 'localhost'].includes(url.hostname)) return route.continue();
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    });
    await page.goto('/jamb/english/2024/', { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.AfroTools?.analytics?.trackEducationPractice === 'function' && typeof window.gtag === 'function');
    const answer = page.locator('.qcard details').first();
    await expect(answer).toBeVisible();
    expect(await cohortEvents(page)).toEqual([]);
    await answer.locator('summary').click();
    await expect(answer).toHaveJSProperty('open', true);
    const events = await cohortEvents(page);
    if (consent === 'accepted') {
      expect(events).toEqual([{ name: 'education_practice_cohort_started', params: {
        cohort_day_utc: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        cohort_exam: 'jamb', cohort_subject: 'english', action: 'start'
      } }]);
    } else {
      expect(events).toEqual([]);
      expect(await page.evaluate(() => localStorage.getItem('afrotools_education_practice_cohort_v1'))).toBeNull();
    }
    await answer.locator('summary').click();
    await expect(answer).toHaveJSProperty('open', false);
    await page.locator('.qcard details').nth(1).locator('summary').click();
    expect(await cohortEvents(page)).toEqual(events);
    const width = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
    expect(width.page).toBeLessThanOrEqual(width.viewport + 1);
    expect(errors).toEqual([]);
  });
}
