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

test('practice controls align and the optional assistant does not float over the exercise', async ({ page, baseURL }, testInfo) => {
  const observation = { pageErrors: [], consoleErrors: [], writes: [], aiRequests: [], geometry: [] };
  page.on('pageerror', error => observation.pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') observation.consoleErrors.push(message.text()); });
  page.on('request', request => {
    const url = new URL(request.url());
    if (request.method() !== 'GET') observation.writes.push({ method: request.method(), origin: url.origin });
    if (/\/api\/ai|\/\.netlify\/functions\/.*(?:ai|chat)|openai|anthropic/i.test(request.url())) observation.aiRequests.push({ method: request.method(), origin: url.origin });
  });
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() !== 'GET' || url.origin !== new URL(baseURL).origin || /\/api\/|\/\.netlify\/functions\//.test(url.pathname)) return route.abort();
    return route.continue();
  });
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.setViewportSize({ width:1280, height:900 });
  await page.emulateMedia({ reducedMotion:'reduce' });
  const hit = async locator => {
    await locator.scrollIntoViewIfNeeded();
    expect(await locator.evaluate(el => {
      const r = el.getBoundingClientRect(), root = el.getRootNode();
      const target = root.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return target === el || el.contains(target);
    })).toBe(true);
  };
  try {
    await page.goto('/tools/ssce-practice/');
    await expect(page.locator('#practice-topic')).toBeVisible();
    await expect(page.locator('#practice-start')).toBeEnabled();
    const select = await page.locator('#practice-topic').boundingBox();
    const button = await page.locator('#practice-start').boundingBox();
    expect(Math.abs(select.y + select.height - button.y - button.height)).toBeLessThanOrEqual(2);
    await page.getByRole('button', { name:'Start practice', exact:true }).click();
    const session = page.locator('#practice-session'), answer = session.getByRole('radio').first();
    await expect(session.locator('h2')).toHaveText('Question 1 of 24');
    await answer.check();
    await page.setViewportSize({ width:390, height:844 });
    const assistant = page.locator('afro-site-assistant');
    await page.locator('afro-footer').scrollIntoViewIfNeeded();
    const launcher = assistant.locator('#fab'), panel = assistant.locator('#panel');
    await expect(launcher).toBeVisible();
    await expect(panel).toHaveJSProperty('open', false);
    await expect(panel).toHaveAttribute('inert', '');
    const placement = await assistant.evaluate(el => {
      const rect = node => { const r = node.getBoundingClientRect(); return { top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height }; };
      return { host:rect(el), heading:rect(document.querySelector('h1')), setup:rect(document.querySelector('.practice-setup')), exercise:rect(document.querySelector('#practice-session')), viewport:innerWidth };
    });
    observation.geometry.push({ state:'closed at footer', ...placement });
    expect(placement.host.height).toBeGreaterThanOrEqual(44);
    expect(placement.host.left).toBeGreaterThanOrEqual(0);
    expect(placement.host.right).toBeLessThanOrEqual(placement.viewport);
    expect(placement.host.top).toBeGreaterThanOrEqual(placement.heading.bottom);
    expect(placement.host.bottom).toBeLessThanOrEqual(placement.setup.top);
    expect(placement.host.bottom).toBeLessThanOrEqual(placement.exercise.top);
    await launcher.scrollIntoViewIfNeeded();
    const before = { top:(await launcher.boundingBox()).y, scroll:await page.evaluate(() => scrollY) };
    await page.mouse.wheel(0, 300);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before.scroll);
    const after = { top:(await launcher.boundingBox()).y, scroll:await page.evaluate(() => scrollY) };
    observation.geometry.push({ state:'closed scroll', before, after });
    expect(Math.abs(after.top - before.top + after.scroll - before.scroll)).toBeLessThanOrEqual(2);
    await hit(answer);
    await answer.click();
    await expect(answer).toBeChecked();
    await hit(launcher);
    await launcher.focus();
    await expect(launcher).toBeFocused();
    await launcher.press('Enter');
    await expect(panel).toHaveClass(/open/);
    await expect(panel).toHaveJSProperty('open', true);
    expect(await panel.evaluate(el => el.matches(':modal'))).toBe(true);
    await expect(assistant.locator('#inp')).toBeFocused();
    await expect.poll(async () => {
      const rect = await panel.boundingBox(), viewport = page.viewportSize();
      return rect && rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= viewport.width + 1 && rect.y + rect.height <= viewport.height + 1;
    }).toBe(true);
    await page.keyboard.press('Escape');
    await expect(panel).toHaveJSProperty('open', false);
    await expect(panel).toHaveAttribute('inert', '');
    await expect(launcher).toBeFocused();
    await launcher.click();
    await expect(panel).toHaveJSProperty('open', true);
    await hit(assistant.locator('#close'));
    await assistant.locator('#close').click();
    await expect(panel).not.toHaveClass(/open/);
    await expect(panel).toHaveJSProperty('open', false);
    await expect(launcher).toBeFocused();
    await expect(answer).toBeChecked();
    const check = session.getByRole('button', { name:'Check answer', exact:true });
    await hit(check);
    await check.click();
    await expect(page.locator('#practice-status')).toHaveText('Answer checked.');
    await expect(session.locator('.practice-feedback')).toBeVisible();
    await session.getByText('Show explanation', { exact:true }).click();
    await expect(session.locator('.practice-explanation')).toHaveAttribute('open', '');
    const next = session.getByRole('button', { name:'Next question', exact:true });
    await hit(next);
    await next.click();
    await expect(session.locator('h2')).toHaveText('Question 2 of 24');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  } finally {
    await testInfo.attach('education assistant flow and native controls', { body:Buffer.from(JSON.stringify(observation,null,2)), contentType:'application/json' });
  }
  expect(observation.pageErrors).toEqual([]);
  expect(observation.consoleErrors).toEqual([]);
  expect(observation.writes).toEqual([]);
  expect(observation.aiRequests).toEqual([]);
});
