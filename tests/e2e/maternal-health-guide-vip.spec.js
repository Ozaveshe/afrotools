const { expect, test } = require('@playwright/test');

const SCENARIOS = [
  { name: 'desktop light', width: 1280, height: 900, theme: 'light', fontSize: '100%' },
  { name: '320px dark', width: 320, height: 844, theme: 'dark', fontSize: '100%' },
  { name: '375px dark at 200% text', width: 375, height: 844, theme: 'dark', fontSize: '200%' },
];

test.describe('maternal health conversation guide VIP', () => {
  for (const scenario of SCENARIOS) {
    test(`${scenario.name} is local, bounded and usable`, async ({ page }) => {
      const errors = [];
      const requestsAfterInput = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize({ width: scenario.width, height: scenario.height });
      await page.emulateMedia({ colorScheme: scenario.theme, reducedMotion: 'reduce' });
      await page.addInitScript((theme) => {
        localStorage.setItem('aft_theme', theme);
        window.print = function () { window.__maternalPrintCalled = true; };
      }, scenario.theme);

      const response = await page.goto('/tools/maternal-mortality/', {
        waitUntil: 'domcontentloaded'
      });
      expect(response && response.status()).toBe(200);
      await page.evaluate(({ theme, fontSize }) => {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.fontSize = fontSize;
      }, scenario);

      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.getByRole('heading', {
        name: 'Seek immediate local emergency maternity care'
      })).toBeVisible();
      await expect(page.getByRole('heading', {
        name: 'Prepare a conversation guide'
      })).toBeVisible();

      page.on('request', (request) => {
        requestsAfterInput.push({
          method: request.method(),
          url: request.url(),
          body: request.postData() || ''
        });
      });

      await page.locator('#mm-country').selectOption('GH');
      await page.locator('#mm-week').fill('34');
      await page.getByLabel(
        'High blood pressure or pre-eclampsia diagnosed by a professional'
      ).check();
      await page.getByLabel(
        'Long or unreliable journey to emergency maternity care'
      ).check();
      await page.getByRole('button', { name: 'Create conversation guide' }).click();

      const result = page.locator('#maternal-guide-result');
      await expect(result).toBeVisible();
      await expect(result).toContainText(
        'Contact your maternity team promptly to discuss the selected factors.'
      );
      await expect(result).toContainText(
        'This guide does not calculate maternal mortality'
      );
      await expect(result).toContainText('Country context: Ghana');
      await expect(result).not.toContainText(/low risk|high risk|score|probability/i);
      await expect(page.locator('#maternal-guide-status')).toContainText(
        'No input was saved or sent'
      );

      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Download local TXT guide' }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('maternal-health-conversation-guide.txt');
      const stream = await download.createReadStream();
      let exportText = '';
      for await (const chunk of stream) exportText += chunk.toString();
      expect(exportText).toMatch(/high blood pressure or pre-eclampsia/i);
      expect(exportText).toContain('Emergency warning signs override this guide');
      expect(exportText).not.toMatch(/low risk|high risk|score:|probability/i);

      await page.getByRole('button', { name: 'Print or save local PDF' }).click();
      expect(await page.evaluate(() => window.__maternalPrintCalled)).toBe(true);

      const audit = await page.evaluate(() => {
        const visible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none'
            && style.visibility !== 'hidden'
            && rect.width > 0
            && rect.height > 0;
        };
        const hasName = (element) => {
          if ((element.textContent || '').trim() || element.getAttribute('aria-label')) return true;
          return Boolean(
            element.labels
            && Array.from(element.labels).some((label) => label.textContent.trim())
          );
        };
        const controls = Array.from(document.querySelectorAll(
          'main button, main input, main select, main textarea'
        )).filter(visible);
        const emergency = document.querySelector('.emergency-panel').getBoundingClientRect();
        const form = document.querySelector('#maternal-guide-form').getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          unnamed: controls
            .filter((control) => !hasName(control))
            .map((control) => `${control.tagName}#${control.id || '(none)'}`),
          emergencyBeforeForm: emergency.top < form.top,
        };
      });

      expect(audit.overflow).toBeLessThanOrEqual(1);
      expect(audit.unnamed).toEqual([]);
      expect(audit.emergencyBeforeForm).toBe(true);
      expect(
        requestsAfterInput.some((request) =>
          /hypertension|pre-eclampsia|distance-to-care|conversation-factor/i.test(
            request.url + request.body
          )
        )
      ).toBe(false);
      expect(errors).toEqual([]);
    });
  }
});
