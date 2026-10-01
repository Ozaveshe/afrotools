const { test, expect } = require('@playwright/test');
const registry = require('../../data/source-registry.json');

const locales = [
  { locale: 'en', route: '/burkina-faso/bf-vat', reviewed: 'Reviewed source', stale: 'Stale', confidence: 'Reviewed', caution: 'Confirm current rates, exemptions', warning: 'Verify before making a high-stakes decision.' },
  { locale: 'fr', route: '/fr/burkina-faso/calculateur-tva', reviewed: 'Source révisée', stale: 'Ancien', confidence: 'Révisé', caution: 'Confirmez les taux actuels, exemptions', warning: 'Vérifiez avant de prendre une décision importante.' },
  { locale: 'sw', route: '/sw/burkina-faso/kikokotoo-vat/', reviewed: 'Chanzo kilichokaguliwa', stale: 'Ya zamani', confidence: 'Imekaguliwa', caution: 'Thibitisha viwango vya sasa, misamaha', warning: 'Hakiki kabla ya kufanya uamuzi wenye athari kubwa.' }
];

for (const copy of locales) {
  for (const scheme of ['light', 'dark']) {
    test(`${copy.locale} source panel keeps stale evidence visible at 320px in ${scheme}`, async ({ page }) => {
      const failures = [];
      page.on('pageerror', error => failures.push(error.message));
      const source = { ...registry.sources.find(s => s.id === 'vat-bf-source'), lastCheckedAt: '2020-01-01', lastReviewedAt: '2020-01-01' };
      await page.route('**/data/source-registry.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ sources: [source] }) }));
      await page.setViewportSize({ width: 320, height: 800 });
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      await page.goto(copy.route);
      const panel = page.locator('[data-source-meta-id="vat-bf-source"]').first();
      await expect(panel.locator('a.source-confidence-badge--warn')).toHaveText(copy.reviewed);
      await expect(panel.locator('.source-confidence-badge--freshness-stale')).toHaveText(copy.stale);
      await expect(panel.locator('.source-confidence-badge--confidence')).toHaveText(copy.confidence);
      await expect(panel.locator('.source-confidence-notice')).toContainText(copy.caution);
      await expect(panel.locator('.source-confidence-warning')).toContainText(copy.warning);
      await expect(panel.locator('a')).toHaveAttribute('href', source.sourceUrl);
      expect((await panel.locator('a').boundingBox()).height).toBeGreaterThanOrEqual(44);
      await panel.locator('a').focus();
      expect(await panel.locator('a').evaluate(el => el.matches(':focus'))).toBe(true);
      if (copy.locale !== 'en') {
        await expect(panel.locator('.source-confidence-notice')).toHaveAttribute('data-source-copy-state', 'translated');
        await expect(panel.locator('.source-confidence-notice span[lang]')).toHaveAttribute('lang', copy.locale);
        await expect(panel.locator('.source-confidence-notice')).not.toContainText(source.displayDisclaimer);
      }
      expect(await panel.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      expect(failures).toEqual([]);
    });
  }
}

test('a changed source note is preserved and language-labelled in the native panel', async ({ page }) => {
  const source = { ...registry.sources.find(s => s.id === 'vat-bf-source'), displayDisclaimer: 'New condition: approval document 9876 must be verified before filing.' };
  await page.route('**/data/source-registry.json', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ sources: [source] }) }));
  await page.goto('/fr/burkina-faso/calculateur-tva');
  const notice = page.locator('[data-source-meta-id="vat-bf-source"] .source-confidence-notice');
  await expect(notice).toHaveAttribute('data-source-copy-state', 'untranslated');
  await expect(notice).toContainText('Note de source en anglais');
  await expect(notice.locator('[lang="en"]')).toHaveText(source.displayDisclaimer);
});
