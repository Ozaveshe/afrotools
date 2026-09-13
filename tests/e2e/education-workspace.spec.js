const { test, expect } = require('@playwright/test');

const routes = ['education-hub', 'study-planner', 'flashcard-maker', 'ssce-practice', 'scholarship-finder', 'university-admission'];
for (const width of [320, 390, 768, 1280]) {
  for (const route of routes) {
    test(`${route} shares the education layout at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/tools/${route}/`);
      const nav = page.getByRole('navigation', { name: 'Education workspace', exact: true });
      await expect(nav.locator('a')).toHaveCount(6);
      await expect(nav.locator('[aria-current="page"]')).toHaveAttribute('href', `/tools/${route}/`);
      const title = page.locator('h1');
      await expect(title).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const dimensions = await title.evaluate(el => {
        const r = el.getBoundingClientRect(), style = getComputedStyle(el);
        return { x:r.x, right:r.right, font:style.fontFamily, fontSize:parseFloat(style.fontSize) };
      });
      expect(dimensions.x).toBeGreaterThanOrEqual(12);
      expect(dimensions.right).toBeLessThanOrEqual(width - 10);
      expect(dimensions.font).toContain('DM Sans');
      expect(dimensions.fontSize).toBeLessThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      for (const link of await nav.locator('a').all()) {
        expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
      }
      await page.screenshot({ path:testInfo.outputPath(`${route}-${width}.png`) });
    });
  }
}

test('deep links reveal optional planning without hiding the primary study journey', async ({ page }) => {
  await page.goto('/tools/education-hub/');
  await expect(page.locator('#planning-details')).not.toHaveAttribute('open');
  await expect(page.locator('#daily-study')).toBeVisible();
  await page.getByRole('link', { name:'Planning details', exact:true }).click();
  await expect(page.locator('#planning-details')).toHaveAttribute('open');
  await expect(page.locator('#edInstitution')).toBeVisible();
  await expect(page.locator('#checklistCount')).toHaveText('0/9');
  await expect(page.locator('#checklistList .is-complete')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#planning-details')).toHaveAttribute('open');
  await expect(page.locator('#edInstitution')).toBeVisible();
});

test('manual planning saves survive reload and storage failures preserve input', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tools/education-hub/#profile-editor');
  await page.locator('#manualUniversityName').fill('Synthetic school');
  await page.getByRole('button', { name:'Save university', exact:true }).click();
  await expect(page.locator('#universityList')).toContainText('Synthetic school');
  await page.locator('#destinationCustom').fill('Synthetic destination');
  await page.getByRole('button', { name:'Save destination', exact:true }).click();
  await expect(page.locator('#destinationList')).toContainText('Synthetic destination');
  await page.locator('#deadlineTitle').fill('Synthetic application');
  await page.locator('#deadlineDate').fill('2027-01-15');
  await page.getByRole('button', { name:'Track deadline', exact:true }).click();
  await page.reload();
  await expect(page.locator('#deadlineList')).toContainText('Synthetic application');
  await expect(page.locator('#universityList')).toContainText('Synthetic school');
  await expect(page.locator('#destinationList')).toContainText('Synthetic destination');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'afroedu-cockpit-state') throw new DOMException('Synthetic quota', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await page.locator('#manualUniversityName').fill('Unsaved school');
  await page.getByRole('button', { name:'Save university', exact:true }).click();
  await expect(page.locator('#planningSaveStatus')).toContainText('Could not finish saving');
  await expect(page.locator('#manualUniversityName')).toHaveValue('Unsaved school');
  await expect(page.locator('#universityList')).not.toContainText('Unsaved school');
  expect(errors).toEqual([]);
});

for (const route of routes) {
  test(`${route} reflows with enlarged text and dark theme`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width:390, height:900 });
    await page.emulateMedia({ colorScheme:'dark', reducedMotion:'reduce' });
    await page.goto(`/tools/${route}/`);
    await page.addStyleTag({content:'html{font-size:200%!important}'});
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator('h1')).toBeVisible();
    await page.screenshot({path:testInfo.outputPath(`${route}-dark-text200.png`)});
  });
}

test('practice controls align and the optional assistant does not float over the exercise', async ({ page }) => {
  await page.goto('/tools/ssce-practice/');
  const select = await page.locator('#practice-topic').boundingBox();
  const button = await page.locator('#practice-start').boundingBox();
  expect(Math.abs(select.y + select.height - button.y - button.height)).toBeLessThanOrEqual(2);
  await page.getByRole('button', { name:'Start practice', exact:true }).click();
  await page.getByRole('radio').first().check();
  await page.setViewportSize({ width:390, height:844 });
  await page.mouse.wheel(0, 600);
  const assistant = page.locator('afro-site-assistant');
  await page.locator('afro-footer').scrollIntoViewIfNeeded();
  await expect(assistant).toBeAttached();
  expect(await assistant.evaluate(el => getComputedStyle(el).position)).toBe('relative');
  await assistant.locator('#fab').click();
  const panel = assistant.locator('#panel');
  await expect(panel).toHaveClass(/open/);
  await expect.poll(async () => {
    const rect = await panel.boundingBox();
    return rect.x >= 0 && rect.x + rect.width <= 391;
  }).toBe(true);
  await assistant.locator('#close').click();
  await expect(panel).not.toHaveClass(/open/);
});
