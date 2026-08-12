const { test, expect } = require('@playwright/test');

for (const route of ['/ha/game-da-mu/', '/ha/tuntube-mu/']) {
  test(`${route} is native, mobile-safe and keyboard usable`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize({ width:375, height:844 });
    await page.goto(route, { waitUntil:'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'ha');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('afro-navbar')).toBeVisible();
    await expect(page.locator('afro-footer')).toBeVisible();
    await expect.poll(() => page.locator('afro-footer').evaluate((footer) => {
      const links = Array.from(footer.shadowRoot?.querySelectorAll('a') || []);
      return links.filter((link) => ['/ha/game-da-mu/', '/ha/tuntube-mu/'].includes(link.getAttribute('href'))).map((link) => link.textContent.trim());
    })).toEqual(['Game da mu', 'Tuntuɓe mu', 'Tuntuɓe mu']);
    await expect(page.locator('main')).not.toContainText(/gadar harshe|shafin da za a buɗe yana Turanci/i);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('Hausa Contact exposes a labelled, privacy-bounded form', async ({ page }) => {
  await page.setViewportSize({ width:780, height:900 });
  await page.goto('/ha/tuntube-mu/', { waitUntil:'networkidle' });
  const form = page.locator('main form[name="contact-ha"]');
  await expect(form).toBeVisible();
  const unlabeled = await form.locator('input:not([type=hidden]),select,textarea').evaluateAll((controls) => controls.filter((control) => !control.labels || !control.labels.length).length);
  expect(unlabeled).toBe(0);
  await form.locator('[name=name]').fill('Mutumin Gwaji');
  await form.locator('[name=email]').fill('gwaji@example.com');
  await form.locator('[name=reason]').selectOption({ index:1 });
  await form.locator('[name=message]').fill('Wannan saƙon gwaji ne kawai.');
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
