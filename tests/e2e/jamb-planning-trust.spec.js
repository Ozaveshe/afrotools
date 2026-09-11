const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ context, page }) => {
  await context.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.setViewportSize({ width: 320, height: 844 });
});

async function planner(page) {
  await page.goto('/jamb/study-plan/');
  const today = await page.evaluate(() => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); });
  await page.locator('#exam-date').fill(today);
  await page.locator('#hours-per-day').selectOption('1');
  await page.locator('#weak-topics').fill('Synthetic algebra topic');
  return today;
}
async function noOverflow(page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}

test('standard study plan stays local and respects the daily time budget', async ({ page }) => {
  let calls = 0;
  await page.route('**/.netlify/functions/ai-advisor', route => { calls++; return route.abort(); });
  await planner(page);
  await page.locator('#generate-btn').click();
  await expect(page.locator('#plan-origin')).toContainText('No planning inputs were sent');
  await expect(page.locator('.day-card')).toHaveCount(1);
  expect(await page.locator('.task-time').allTextContents()).toEqual(['20 min','30 min','10 min']);
  await noOverflow(page);
  await page.locator('#restart-btn').click();
  await expect(page.locator('#generate-btn')).toBeVisible();
  expect(calls).toBe(0);
});

test('declining optional AI sends nothing and keeps local planning available', async ({ page }) => {
  let calls = 0;
  await page.route('**/.netlify/functions/ai-advisor', route => { calls++; return route.abort(); });
  const today = await planner(page);
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain(today);
    expect(dialog.message()).toContain('Start date: '+today);
    expect(dialog.message()).toContain('Synthetic algebra topic');
    expect(dialog.message()).toContain('Hours per day: 1');
    expect(dialog.message()).toContain('Preparation level: intermediate');
    expect(dialog.message()).toContain('english, mathematics, physics, biology');
    await dialog.dismiss();
  });
  await page.locator('#ai-plan-btn').click();
  await expect(page.locator('#plan-status')).toContainText('Nothing was sent');
  await page.locator('#generate-btn').click();
  await expect(page.locator('#plan-origin')).toContainText('Built on this device');
  expect(calls).toBe(0);
});

for (const mode of ['valid','markup','over-budget','invalid-schema']) test('optional AI '+mode+' uses explicit consent and safe results', async ({ page }) => {
  const today = await planner(page);
  let request;
  await page.route('**/.netlify/functions/ai-advisor', route => {
    request = route.request().postDataJSON();
    let plan = { summary:'Synthetic optional suggestion', days:[{ day:1, date:today, focus:'Mathematics', tasks:[{time:'30 min',task:'Read checked notes and use /tools/study-planner/'}] }] };
    if (mode === 'markup') plan.days[0].tasks[0].task = '<img src=x onerror="window.injected=true">';
    if (mode === 'over-budget') plan.days[0].tasks[0].time = '90 min';
    if (mode === 'invalid-schema') plan = { summary:'Missing days' };
    return route.fulfill({ json:{reply:JSON.stringify(plan)} });
  });
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#ai-plan-btn').click();
  await expect(page.locator('#plan-origin')).toContainText(mode === 'valid' ? 'Optional AI suggestion' : 'A local plan is shown instead');
  expect(request.tool).toBe('jamb-study-plan');
  expect(request.aiConsent).toBe('accepted');
  expect(request.study_plan).toEqual({days:1,hours_per_day:1,start_date:today});
  expect(request.message).toContain('days starting on '+today);
  expect(request.message).toContain('Synthetic algebra topic');
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  await expect(page.locator('#plan-days img')).toHaveCount(0);
  if (mode === 'valid') await expect(page.locator('#plan-days a')).toHaveAttribute('href','/tools/study-planner/');
  await noOverflow(page);
});

test('plan rendering escapes every model-controlled text surface', async ({ page }) => {
  await planner(page);
  await page.evaluate(() => showPlan({ summary:'<img src=x onerror="window.injected=true">', days:[{ day:'<b>1</b>', date:'2026-09-10', focus:'<svg onload="window.injected=true">', tasks:[{ time:'<b>30 min</b>', task:'<img src=x onerror="window.injected=true"> /jamb/cbt/' }] }] },1,1));
  await expect(page.locator('#plan-header img,#plan-days img,#plan-days svg,#plan-days b')).toHaveCount(0);
  await expect(page.locator('#plan-days a')).toHaveAttribute('href','/jamb/cbt/');
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
});

test('cram checklist remains usable without an invented official countdown', async ({ page }) => {
  await page.goto('/jamb/cram/');
  await expect(page.locator('#status-banner')).toContainText('not an official exam countdown');
  const first = page.getByRole('checkbox').first();
  await first.click();
  await expect(first).toHaveAttribute('aria-checked','true');
  await page.reload();
  await expect(page.getByRole('checkbox').first()).toHaveAttribute('aria-checked','true');
  await noOverflow(page);
});

test('university reference filters preserve comparisons without qualification claims', async ({ page }) => {
  await page.goto('/jamb/universities/');
  await expect(page.locator('.uni-card').first()).toBeVisible();
  await page.locator('#score-input').fill('400');
  await page.locator('#type-filter').selectOption('private');
  await expect(page.locator('.uni-card').first()).toContainText('private');
  await expect(page.locator('.uni-status').first()).toHaveText('At/above reference');
  await expect(page.locator('#score-summary')).toContainText('does not mean you qualify');
  await expect(page.locator('.uni-cutoff').first()).toContainText('Unverified reference');
  await page.locator('#score-input').fill('1');
  await expect(page.locator('.uni-status').first()).toHaveText('Below reference');
  await noOverflow(page);
});
