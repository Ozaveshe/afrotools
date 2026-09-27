const { test, expect } = require('@playwright/test');

for (const width of [320, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`PWA banner controls and AI assistant remain clickable at ${width}px in ${theme} mode`, async ({ page }) => {
      await page.setViewportSize({ width, height: 740 });
      await page.addInitScript(selectedTheme => {
        localStorage.setItem('aft_theme', selectedTheme);
        localStorage.setItem('afrobot_theme', selectedTheme);
        localStorage.setItem('afrotools_cookie_consent', 'declined');
        localStorage.removeItem('afrobot_position');
        localStorage.removeItem('afro_pwa_dismissed');
      }, theme);
      await page.goto('/');
      await page.waitForFunction(() => performance.getEntriesByType('resource').some(entry => entry.name.endsWith('/assets/js/pwa-install.js')));
      await page.evaluate(() => window.dispatchEvent(new Event('pointerdown')));
      const fab = page.locator('afro-site-assistant').locator('#fab');
      await expect(fab).toBeVisible();

      await page.evaluate(() => {
        const prompt = new Event('beforeinstallprompt', { cancelable: true });
        prompt.prompt = () => Promise.resolve();
        prompt.userChoice = Promise.resolve({ outcome: 'dismissed' });
        window.dispatchEvent(prompt);
      });

      const banner = page.locator('#afro-pwa-banner');
      const dismiss = page.locator('#afro-pwa-close');
      await expect(banner).toBeVisible();
      await expect.poll(() => page.evaluate(() => {
        const banner = document.getElementById('afro-pwa-banner');
        const assistant = document.querySelector('afro-site-assistant');
        const bannerRect = banner.getBoundingClientRect();
        const assistantRect = assistant.getBoundingClientRect();
        const controls = ['afro-pwa-install', 'afro-pwa-close'];
        return assistantRect.bottom <= bannerRect.top - 8 && controls.every(id => {
          const button = document.getElementById(id);
          const rect = button.getBoundingClientRect();
          return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === button;
        });
      })).toBe(true);

      await fab.click();
      const panel = page.locator('afro-site-assistant').locator('#panel');
      await expect(panel).toHaveClass(/open/);
      await expect.poll(async () => {
        const rect = await panel.boundingBox();
        return rect.y >= 0 && rect.x >= 0 && rect.x + rect.width <= width;
      }).toBe(true);
      await page.locator('afro-site-assistant').locator('#close').click();

      await dismiss.click();
      await expect(banner).toHaveCount(0);
      await fab.click();
      await expect(panel).toHaveClass(/open/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
}

test('PWA clearance also applies when the assistant loads after the banner', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
    localStorage.removeItem('afro_pwa_dismissed');
  });
  await page.goto('/');
  await page.waitForFunction(() => performance.getEntriesByType('resource').some(entry => entry.name.endsWith('/assets/js/pwa-install.js')));
  await page.evaluate(() => {
    const prompt = new Event('beforeinstallprompt', { cancelable: true });
    prompt.prompt = () => { window.__pwaPromptCalled = true; };
    prompt.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(prompt);
  });
  await expect(page.locator('#afro-pwa-banner')).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('pointerdown')));
  const fab = page.locator('afro-site-assistant').locator('#fab');
  await expect(fab).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const assistant = document.querySelector('afro-site-assistant').getBoundingClientRect();
    const banner = document.getElementById('afro-pwa-banner').getBoundingClientRect();
    return assistant.bottom <= banner.top - 8;
  })).toBe(true);
  await page.setViewportSize({ width: 320, height: 740 });
  await expect.poll(() => page.evaluate(() => {
    const assistant = document.querySelector('afro-site-assistant').getBoundingClientRect();
    const banner = document.getElementById('afro-pwa-banner').getBoundingClientRect();
    return assistant.bottom <= banner.top - 8;
  })).toBe(true);
  await fab.click();
  const panel = page.locator('afro-site-assistant').locator('#panel');
  await expect(panel).toHaveClass(/open/);
  await expect.poll(async () => (await panel.boundingBox()).y >= 0).toBe(true);
  await page.locator('#afro-pwa-install').click();
  await expect(page.locator('#afro-pwa-banner')).toHaveCount(0);
  expect(await page.evaluate(() => window.__pwaPromptCalled)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--afro-pwa-banner-clearance'))).toBe('');
});
