const { test, expect } = require('@playwright/test');

for (const variant of [{ width: 320, theme: 'light' }, { width: 390, theme: 'dark' }]) {
  test.describe(`${variant.width}px ${variant.theme}`, () => {
    test.use({ viewport: { width: variant.width, height: 844 }, colorScheme: variant.theme });
    test('close resumes cooking, finish starts again, and both preserve the checklist', async ({ page, baseURL }, testInfo) => {
      const errors = [], writes = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.method()); });
      await page.addInitScript(theme => {
        localStorage.setItem('afrotools_cookie_consent', 'declined');
        localStorage.setItem('aft_theme', theme);
      }, variant.theme);
      const allowedOrigin = new URL(baseURL).origin;
      await page.route('**/*', route => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin === allowedOrigin && ['GET', 'HEAD'].includes(request.method())) return route.continue();
        return route.fulfill({ status: 200, contentType: request.resourceType() === 'stylesheet' ? 'text/css' : request.resourceType() === 'script' ? 'application/javascript' : 'text/plain', body: '' });
      });
      await page.goto('/tools/afrokitchen/recipes/jollof-rice-ng/');
      const open = page.locator('[data-ak-cook-mode]'), dialog = page.getByRole('dialog', { name: 'Jollof Rice' });
      const progress = page.locator('[data-ak-cook-progress]');
      await open.click();
      await expect(progress).toHaveText('Step 1 of 6');
      const ingredients = dialog.locator('.ak-cook-ingredients');
      await ingredients.locator(':scope > summary').click();
      await dialog.locator('#ak-static-ingredients input').first().check();
      await ingredients.locator(':scope > summary').click();
      await dialog.locator('[data-ak-cook-next]').click();
      await expect(progress).toHaveText('Step 2 of 6');
      await dialog.locator('[data-ak-cook-close]').click();
      await expect(dialog).toBeHidden();
      await expect(open).toBeFocused();
      await open.click();
      await expect(progress).toHaveText('Step 2 of 6');
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(open).toBeFocused();
      await open.click();
      await expect(progress).toHaveText('Step 2 of 6');
      for (let step = 3; step <= 6; step++) {
        await dialog.locator('[data-ak-cook-next]').click();
        await expect(progress).toHaveText(`Step ${step} of 6`);
      }
      await dialog.getByRole('button', { name: 'Finish cooking', exact: true }).click();
      await expect(dialog).toBeHidden();
      await expect(open).toBeFocused();
      await expect(page.locator('#recipe-ingredients #ak-static-ingredients input').first()).toBeChecked();
      await open.click();
      await expect(progress).toHaveText('Step 1 of 6');
      await expect(dialog.locator('#ak-static-ingredients input').first()).toBeChecked();
      await expect(dialog.locator('[data-ak-cook-prev]')).toBeDisabled();
      expect(await dialog.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
      await page.screenshot({ path: testInfo.outputPath('restart-cook-mode.png') });
      await page.keyboard.press('Escape');
      await expect(open).toBeFocused();
      await page.reload();
      await expect(page.locator('#ak-static-ingredients input').first()).toBeChecked();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
      expect(writes).toEqual([]);
    });
  });
}
