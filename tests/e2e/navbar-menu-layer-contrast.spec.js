const { test, expect } = require('@playwright/test');

function contrastRatio(foreground, background) {
  const luminance = (color) => {
    const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number);
    const linear = channels.map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

for (const width of [320, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`mobile menu keeps Sign in readable and above overlays at ${width}px in ${theme} mode`, async ({ page }) => {
      await page.setViewportSize({ width, height: 740 });
      await page.addInitScript(selectedTheme => {
        localStorage.setItem('aft_theme', selectedTheme);
        localStorage.setItem('afrobot_theme', selectedTheme);
        localStorage.setItem('afrotools_cookie_consent', 'declined');
        localStorage.removeItem('afrobot_position');
        localStorage.removeItem('afro_pwa_dismissed');
      }, theme);
      await page.goto('/');
      await page.evaluate(() => window.dispatchEvent(new Event('pointerdown')));

      const navbar = page.locator('afro-navbar');
      const burger = navbar.locator('.burger');
      const menu = navbar.locator('.mob');
      const login = navbar.locator('.mob-login');
      await expect(burger).toBeVisible();
      await expect(page.locator('afro-site-assistant').locator('#fab')).toBeVisible();

      await burger.click();
      await expect(navbar).toHaveClass(/menu-open/);
      await expect(menu).toBeVisible();
      await expect(burger).toHaveAttribute('aria-expanded', 'true');

      // A search shortens the drawer so the footer and floating assistant share
      // the same viewport area, which reproduced the original blocked target.
      await navbar.locator('.mob-search-input').fill('market days');
      await expect(login).toBeInViewport();
      const layout = await navbar.evaluate(host => {
        const root = host.shadowRoot;
        const menu = root.querySelector('.mob');
        const login = root.querySelector('.mob-login');
        const rect = login.getBoundingClientRect();
        const x = rect.right - 24;
        const y = rect.bottom - 12;
        return {
          loginHeight: rect.height,
          foreground: getComputedStyle(login).color,
          background: getComputedStyle(menu).backgroundColor,
          hostZ: Number(getComputedStyle(host).zIndex),
          assistantZ: Number(getComputedStyle(document.querySelector('afro-site-assistant')).zIndex),
          hit: document.elementFromPoint(x, y)?.tagName,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      expect(layout.loginHeight).toBeGreaterThanOrEqual(44);
      expect(contrastRatio(layout.foreground, layout.background)).toBeGreaterThanOrEqual(4.5);
      expect(layout.hostZ).toBeGreaterThan(layout.assistantZ);
      expect(layout.hit).toBe('AFRO-NAVBAR');
      expect(layout.overflow).toBeLessThanOrEqual(1);

      await page.evaluate(() => {
        const prompt = new Event('beforeinstallprompt', { cancelable: true });
        prompt.prompt = () => Promise.resolve();
        prompt.userChoice = Promise.resolve({ outcome: 'dismissed' });
        window.dispatchEvent(prompt);
      });
      const banner = page.locator('#afro-pwa-banner');
      await expect(banner).toBeVisible({ timeout: 6000 });
      const bannerLayer = await page.evaluate(() => ({
        navbar: Number(getComputedStyle(document.querySelector('afro-navbar')).zIndex),
        banner: Number(getComputedStyle(document.querySelector('#afro-pwa-banner')).zIndex),
      }));
      expect(bannerLayer.navbar).toBeGreaterThan(bannerLayer.banner);

      await navbar.locator('#mobThemeToggle').focus();
      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
      await expect(navbar).not.toHaveClass(/menu-open/);
      await expect(burger).toHaveAttribute('aria-expanded', 'false');
      await expect(burger).toBeFocused();

      await burger.click();
      await expect(menu).toBeVisible();
      await burger.click();
      await expect(menu).toBeHidden();
      await expect(navbar).not.toHaveClass(/menu-open/);
    });
  }
}
