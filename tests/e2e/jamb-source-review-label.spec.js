const { test, expect } = require('@playwright/test');
const { renderYear } = require('../../scripts/build-jamb-reviewed-pages');
const batch = require('../../ops/jamb/review-candidates/english/english-2020-001.json');

for (const width of [320, 390, 1440]) test(`English source-review explanation is optional at ${width}px`, async ({page}) => {
  // Candidate rendering fixture: verifies UI, not publication or word meaning.
  const review = { status:'accepted', reviewer:'Codex (AI)', reviewer_type:'ai', reviewed_at:'2026-09-12', evidence:'Candidate rendering fixture only' };
  const ledger = { sources:{[batch.source_id]:batch.source}, questions:Object.fromEntries(batch.records.map(r=>[r.id,{source_id:batch.source_id,content_sha256:r.content_sha256,question_review:review,answer_review:review,explanation_review:review}])) };
  const rendered = renderYear('english','2020',batch.records.map(r=>r.candidate),ledger,['2020']);
  const errors=[];page.on('pageerror', e=>errors.push(e.message));
  await page.context().addInitScript(()=>localStorage.setItem('afrotools_cookie_consent','declined'));
  await page.setViewportSize({width,height:900});
  await page.route('**/jamb/english/2020/',r=>r.fulfill({contentType:'text/html',body:rendered.html}));
  await page.goto('/jamb/english/2020/');
  await expect(page.locator('[data-reviewed-question]')).toHaveCount(8);
  await expect(page.locator('[data-reviewed-question] details[open]')).toHaveCount(0);
  const card = page.locator('[data-reviewed-question]').first();
  const label = card.getByText('AI-reviewed · source checked',{exact:true});
  await expect(label).toBeHidden();
  await card.locator('summary').focus();await card.locator('summary').press('Enter');
  await expect(label).toBeVisible();
  await expect(card.getByText(batch.records[0].candidate.explanation,{exact:true})).toBeVisible();
  await expect(page.locator('[data-reviewed-question]')).not.toContainText(['calculation checked']);
  expect(await page.locator('main').innerText()).not.toMatch(/Source note:|malformed|repair history|original key/i);
  await card.locator('summary').press('Enter');await expect(label).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
  expect(errors).toEqual([]);
});
