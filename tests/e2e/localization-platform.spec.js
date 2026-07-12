const { test, expect } = require('@playwright/test');

test.describe('manifest-driven localization platform', () => {
  test('language selector lists launched locales, marks partial coverage, and preserves a genuine equivalent', async ({ page }) => {
    await page.goto('/tools/');
    await page.waitForFunction(() => window.AfroToolsLocaleManifest && window.AfroTools && window.AfroTools.i18n);

    const navbar = page.locator('afro-navbar');
    await navbar.locator('#langBtn').click();
    const options = navbar.locator('.lang-opt');
    await expect(options).toHaveCount(5);
    expect((await options.allTextContents()).join(' ')).not.toContain('Igbo');
    await expect(navbar.locator('.lang-opt .lang-opt-partial')).toHaveCount(2);

    const french = navbar.locator('.lang-opt[data-locale-target="fr"]');
    await expect(french).toHaveAttribute('href', '/fr/all-tools/');
    await expect(french).toHaveAttribute('data-locale-relationship', 'equivalent');
  });

  test('an unavailable translation warns accessibly before English fallback navigation', async ({ page }) => {
    await page.goto('/afrowork/');
    await page.waitForFunction(() => window.AfroToolsLocaleManifest && window.AfroTools && window.AfroTools.i18n);
    const navbar = page.locator('afro-navbar');
    await navbar.locator('#langBtn').click();
    const french = navbar.locator('.lang-opt[data-locale-target="fr"]');
    await expect(french).toHaveAttribute('data-locale-relationship', 'english-fallback');
    await french.click();

    const dialog = navbar.locator('#languageFallbackDialog');
    await expect(dialog).toHaveJSProperty('open', true);
    await expect(navbar.locator('#languageFallbackCancel')).toBeFocused();
    await expect(page).toHaveURL(/\/afrowork\/$/);

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveJSProperty('open', false);
    await expect(navbar.locator('#langBtn')).toBeFocused();
  });

  test('known Hausa fallback shell exposes its explicit English destination', async ({ page }) => {
    await page.goto('/ha/jamb/cbt/');
    await expect(page.locator('meta[name="afrotools-locale-coverage"]')).toHaveAttribute('content', 'english-fallback');
    await expect(page.locator('meta[name="afrotools-locale-fallback"]')).toHaveAttribute('content', '/jamb/cbt/');
    await page.waitForFunction(() => window.AfroToolsLocaleManifest && window.AfroTools && window.AfroTools.i18n);

    const navbar = page.locator('afro-navbar');
    await navbar.locator('#langBtn').click();
    const english = navbar.locator('.lang-opt[data-locale-target="en"]');
    await expect(english).toHaveAttribute('href', '/jamb/cbt/');
    await expect(english).toHaveAttribute('data-locale-relationship', 'english-fallback');
    await english.click();
    await expect(navbar.locator('#languageFallbackDialog')).toHaveJSProperty('open', true);
    await expect(navbar.locator('#languageFallbackConfirm')).toContainText('Turanci');
  });

  test('shared account, validation, consent, loading, clipboard, and export boundaries use the selected locale', async ({ page }) => {
    await page.goto('/fr/');
    await page.waitForFunction(() => window.AfroToolsLocaleManifest && window.AfroTools && window.AfroTools.i18n && window.AfroTools.localizeSharedUi);
    await page.evaluate(() => {
      const fixture = document.createElement('section');
      fixture.id = 'localizationStateFixture';
      fixture.innerHTML = `
        <div id="afro-cookie-consent"><p>English cookie copy</p><button id="afro-cc-accept">Accept</button><a id="afro-cc-learn">Privacy</a><button id="afro-cc-close" aria-label="Dismiss"></button></div>
        <button class="am-tab" data-tab="login">Sign in</button>
        <button class="am-tab" data-tab="signup">Create account</button>
        <label class="am-label">Email address</label>
        <button id="amSubmit" disabled>Please wait...</button>
        <p class="am-error">Please fill in all required fields.</p>
        <button data-ai-consent-accept>Allow AI</button>
        <button data-ai-consent-decline>Continue without AI</button>`;
      document.body.appendChild(fixture);
      window.AfroTools.localizeSharedUi();
    });

    const fixture = page.locator('#localizationStateFixture');
    await expect(fixture.locator('.am-tab[data-tab="login"]')).toHaveText('Se connecter');
    await expect(fixture.locator('.am-tab[data-tab="signup"]')).toHaveText('Créer un compte');
    await expect(fixture.locator('.am-label')).toHaveText('Adresse e-mail');
    await expect(fixture.locator('#amSubmit')).toHaveText('Chargement…');
    await expect(fixture.locator('.am-error')).toHaveText('Ce champ est obligatoire.');
    await expect(fixture.locator('[data-ai-consent-accept]')).toHaveText('Autoriser');
    await expect(fixture.locator('[data-ai-consent-decline]')).toHaveText('Pas maintenant');

    const roundTrip = await page.evaluate(async () => {
      let copied = '';
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText(value) { copied = value; return Promise.resolve(); } } });
      const source = 'Yoru\u0300ba\u0301, Français, ₦1,000, 🌍';
      const normalized = window.AfroToolsLocalization.normalizeDisplay(source);
      await navigator.clipboard.writeText(normalized);
      const csv = window.AfroToolsLocalization.toUnicodeCsv([[source]]);
      return { normalized, copied, csv };
    });
    expect(roundTrip.copied).toBe(roundTrip.normalized.normalize('NFC'));
    expect(roundTrip.csv).toBe(roundTrip.csv.normalize('NFC'));
    expect(roundTrip.csv.charCodeAt(0)).toBe(0xFEFF);

    await page.addScriptTag({ url: '/assets/js/result-card.js' });
    const imageRoundTrip = await page.evaluate(async () => {
      const title = 'KÃ­rii\u0301ro Ã¬wÃ© owÃ³';
      const value = 'â‚¦1,000 â€” ðŸŒ';
      const subtitle = 'FranÃ§\u0327ais Ã ti Yoru\u0300ba\u0301';
      const details = 'Ã‰tat prÃªt | ÃŒpÃ­nláº¹';
      let rasterText = '';
      window.html2canvas = async (node) => {
        rasterText = node.textContent;
        return { toBlob(callback) { callback(new Blob(['png'], { type: 'image/png' })); } };
      };
      const blob = await window.AfroTools.resultCard.generate({ title, value, subtitle, details });
      return {
        blobType: blob && blob.type,
        rasterText,
        expected: [title, value, subtitle, ...details.split(' | ')].map((value) => value.normalize('NFC'))
      };
    });
    expect(imageRoundTrip.blobType).toBe('image/png');
    expect(imageRoundTrip.rasterText).toBe(imageRoundTrip.rasterText.normalize('NFC'));
    for (const expected of imageRoundTrip.expected) expect(imageRoundTrip.rasterText).toContain(expected);
  });
});

test('fallback HTML remains honest without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/ha/jamb/cbt/');
  await expect(page.locator('html')).toHaveAttribute('lang', /^ha/);
  await expect(page.locator('meta[name="afrotools-locale-coverage"]')).toHaveAttribute('content', 'english-fallback');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('link[rel="alternate"][hreflang="ha"]')).toHaveCount(0);
  await expect(page.locator('body')).not.toBeEmpty();
  await context.close();
});
