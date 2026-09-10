const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  // These are signed-out local persistence tests, not provider/auth evidence.
  await page.route('**/api/scholarships**', route => route.fulfill({
    status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Synthetic feed outage' })
  }));
});

test('background refresh preserves unsaved values and invalid-to-valid recovery', async ({ page }) => {
  await page.goto('/tools/education-hub/', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Education level').selectOption('undergraduate');
  await page.locator('#edGpaValue').fill('999');
  await page.locator('#edGpaScale').selectOption('4.0');
  await page.evaluate(() => window.dispatchEvent(new Event('afroedu:scholarship-feed-updated')));
  await expect(page.locator('#edGpaValue')).toHaveValue('999');
  await page.getByRole('button', { name: 'Save my profile', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('afroedu-profile-cache'))).toBeNull();
  await page.locator('#edGpaValue').fill('3.5');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('#edGpaValue')).toHaveValue('3.5');
  await page.getByRole('button', { name: 'Save my profile', exact: true }).click();
  await expect(page.locator('#profileSaveHint')).toContainText('Saved on this device');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#edGpaValue')).toHaveValue('3.5');
  await expect(page.locator('#edGpaScale')).toHaveValue('4.0');
  await expect(page.getByLabel('Education level')).toHaveValue('undergraduate');
});

test('storage failure preserves edits and never reports a successful save', async ({ page }) => {
  await page.goto('/tools/education-hub/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    window.restoreSyntheticStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (key, value) {
      if (key === 'afroedu-profile-cache') throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.getByLabel('Education level').selectOption('undergraduate');
  await page.getByRole('button', { name: 'Save my profile', exact: true }).click();
  await expect(page.locator('#profileSaveHint')).toContainText('Could not save on this device');
  await page.evaluate(() => window.dispatchEvent(new Event('afroedu:profile-updated')));
  await expect(page.getByLabel('Education level')).toHaveValue('undergraduate');
  await expect(page.locator('#profileSaveHint')).toContainText('Could not save on this device');
  expect(await page.evaluate(() => localStorage.getItem('afroedu-profile-cache'))).toBeNull();
  await page.evaluate(() => window.restoreSyntheticStorage());
  await page.getByRole('button', { name: 'Save my profile', exact: true }).click();
  await expect(page.locator('#profileSaveHint')).toContainText('Saved on this device');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Education level')).toHaveValue('undergraduate');
});

test('clearing saved fields is explicit, atomic and recoverable', async ({ page }) => {
  await page.goto('/tools/education-hub/', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Institution').fill('Synthetic study institution');
  await page.locator('#edGpaValue').fill('3.5');
  await page.locator('#edGpaScale').selectOption('4.0');
  await page.locator('#edCountries').fill('Canada');
  await page.getByRole('button', { name: 'Save my profile', exact: true }).click();
  const original = await page.evaluate(() => localStorage.getItem('afroedu-profile-cache'));
  await page.getByLabel('Institution').fill('');
  await page.locator('#edGpaValue').fill('');
  await page.locator('#edGpaScale').selectOption('');
  await page.locator('#edCountries').fill(', ,');
  await page.getByLabel('Education level').selectOption('undergraduate');
  await page.getByRole('button', { name: 'Save my profile', exact: true }).click();
  await expect(page.locator('#profileSaveHint')).toContainText('Saved fields were not removed: Institution, GPA, GPA scale, Target countries.');
  await expect(page.locator('#profileSaveHint')).toContainText('No changes were saved');
  expect(await page.evaluate(() => localStorage.getItem('afroedu-profile-cache'))).toBe(original);
  await page.evaluate(() => window.dispatchEvent(new Event('afroedu:profile-updated')));
  await expect(page.getByLabel('Institution')).toHaveValue('');
  await expect(page.locator('#edGpaValue')).toHaveValue('');
  await expect(page.locator('#edCountries')).toHaveValue(', ,');
  await expect(page.getByLabel('Education level')).toHaveValue('undergraduate');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Institution')).toHaveValue('Synthetic study institution');
  await expect(page.locator('#edGpaValue')).toHaveValue('3.5');
  await expect(page.locator('#edCountries')).toHaveValue('Canada');
  await expect(page.getByLabel('Education level')).toHaveValue('');
  // Try again, restore the fields, then save the independent change.
  await page.getByLabel('Institution').fill('');
  await page.getByRole('button', { name: 'Save my profile', exact: true }).click();
  await expect(page.locator('#profileSaveHint')).toContainText('Institution');
  await page.getByLabel('Institution').fill('Synthetic study institution');
  await page.getByLabel('Education level').selectOption('undergraduate');
  await page.getByRole('button', { name: 'Save my profile', exact: true }).click();
  await expect(page.locator('#profileSaveHint')).toContainText('Saved on this device');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Education level')).toHaveValue('undergraduate');
  await expect(page.locator('#edGpaValue')).toHaveValue('3.5');
});

for (const navigationMode of [
  { name: 'desktop normal motion', width: 1280, motion: 'no-preference' },
  { name: 'desktop reduced motion', width: 1280, motion: 'reduce' },
  { name: 'mobile normal motion', width: 390, motion: 'no-preference' },
  { name: 'mobile reduced motion', width: 390, motion: 'reduce' }
]) {
test(`first visit reaches a useful saved timetable without a profile (${navigationMode.name})`, async ({ page }) => {
  await page.setViewportSize({ width: navigationMode.width, height: 900 });
  await page.emulateMedia({ reducedMotion: navigationMode.motion });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tools/education-hub/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#startStudyPlan')).toHaveAccessibleName('Start a study plan');
  await page.locator('#startStudyPlan').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/tools\/study-planner\/$/);
  await expect.poll(() => page.evaluate(() => window.AFROTOOLS_STUDY_PLANNER_VIP)).toBe(true);
  await page.locator('#hoursPerDay').fill('1');
  await page.locator('#daysPerWeek').selectOption('5');
  await page.locator('#sessionLength').selectOption('1');
  await page.getByRole('button', { name: 'Save on this device', exact: true }).click();
  await page.getByRole('button', { name: /Generate Timetable/ }).click();
  await expect(page.locator('#timetable input[type="checkbox"]')).toHaveCount(5);
  await page.locator('#timetable input[type="checkbox"]').first().check();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#hoursPerDay')).toHaveValue('1');
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#startStudyPlan')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('afroedu-profile-cache'))).toBeNull();
  expect(errors).toEqual([]);
});
}

test('offline edits save locally, reconnect and reload restore without sending profile fields', async ({ page, context }) => {
  const profileWrites = [];
  page.on('request', request => {
    if (request.method() !== 'GET' && /\/api\/profile/.test(request.url())) profileWrites.push(request.url());
  });
  await page.goto('/tools/education-hub/', { waitUntil: 'domcontentloaded' });
  await context.setOffline(true);
  await expect(page.locator('#hubConnectionStatus')).toContainText('Offline.');
  await page.getByLabel('Education level').selectOption('undergraduate');
  await page.locator('#edIeltsOverall').fill('7');
  await page.getByRole('button', { name: 'Save my profile', exact: true }).click();
  await expect(page.locator('#profileSaveHint')).toContainText('Saved on this device');
  await expect(page.locator('#profileSaveHint')).toContainText('Cloud sync is not confirmed');
  await context.setOffline(false);
  await expect(page.locator('#hubConnectionStatus')).toContainText('Connection available');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#edIeltsOverall')).toHaveValue('7');
  await expect(page.locator('#heroScholarshipMode')).not.toHaveText(/Live feed/i);
  expect(profileWrites).toEqual([]);
});

for (const width of [320, 390]) {
  test(`profile keyboard flow, labels and 200 percent reflow at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/tools/education-hub/', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: testInfo.outputPath(`hub-${width}.png`) });
    const fields = ['edLevel', 'edInstitution', 'edGradDate', 'edStudyLevel', 'edGpaValue', 'edGpaScale', 'edIeltsOverall', 'edJambScore', 'edCountries', 'edFields'];
    await page.locator('#edLevel').focus();
    for (let index = 0; index < fields.length; index++) {
      const field = page.locator('#' + fields[index]);
      await expect(field).toBeFocused();
      await expect(field).toHaveAccessibleName(/\S/);
      await expect(field).toBeVisible();
      const box = await field.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
      // Chromium's month field has internal keyboard segments.
      if (fields[index] === 'edGradDate') await page.locator('#edStudyLevel').focus();
      else await page.keyboard.press('Tab');
    }
    await expect(page.locator('#saveProfileBtn')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#profileSaveHint')).toHaveAttribute('role', 'status');
    await page.addStyleTag({ content: 'html{font-size:200%!important}' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.locator('#saveProfileBtn').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`profile-${width}-text200.png`) });
    // CSS zoom models 200% layout scaling at the equivalent physical width;
    // it does not claim a native browser toolbar or assistive-technology audit.
    await page.setViewportSize({ width: width * 2, height: 900 });
    await page.addStyleTag({ content: 'html{font-size:100%!important;zoom:2}' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator('#saveProfileBtn')).toBeVisible();
  });
}

test('existing guided tool links resolve locally', async ({ page, request }) => {
  await page.goto('/tools/education-hub/', { waitUntil: 'domcontentloaded' });
  const links = await page.locator('#startStudyPlan, #nextActionList a, #checklistList a').evaluateAll(nodes =>
    [...new Set(nodes.map(node => node.getAttribute('href')).filter(href => href.startsWith('/')))]);
  expect(links).toContain('/tools/study-planner/');
  for (const href of links) expect((await request.get(href)).status(), href).toBe(200);
});
