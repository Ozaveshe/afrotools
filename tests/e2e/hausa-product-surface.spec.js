const { test, expect } = require('@playwright/test');

test.describe('Hausa product surface and country identity', () => {
  test('Hausa navigation keeps language and country as separate dimensions', async ({ page }) => {
    await page.goto('/ha/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ha');
    await page.waitForFunction(() => customElements.get('afro-navbar') && document.querySelector('afro-navbar')?.shadowRoot);

    const state = await page.evaluate(() => {
      const nav = document.querySelector('afro-navbar').shadowRoot;
      const selector = nav.querySelector('afro-country-selector');
      const root = selector && selector.shadowRoot;
      return {
        selectorLabel: root && root.querySelector('.cs-label')?.textContent.trim(),
        selected: root && root.querySelector('.cs-selected')?.textContent.trim(),
        searchPlaceholder: root && root.querySelector('.cs-search')?.getAttribute('placeholder'),
        signInHref: nav.querySelector('.btn-login')?.getAttribute('href'),
        countriesHref: [...nav.querySelectorAll('a')].find((link) => link.getAttribute('href') === '/ha/kasashe/')?.getAttribute('href') || null
      };
    });
    expect(state.selectorLabel).toBe('Canja ƙasa');
    expect(state.selected).toBe('Canja ƙasa');
    expect(state.selected).not.toContain('Nigeria');
    expect(state.searchPlaceholder).toBe('Nemi ƙasa...');
    expect(state.signInHref).toContain('/ha/shiga/');
    expect(state.countriesHref).toBe('/ha/kasashe/');

    await page.evaluate(() => document.querySelector('afro-navbar').shadowRoot.querySelector('afro-country-selector').shadowRoot.querySelector('.cs-trigger').click());
    const optionState = await page.evaluate(() => {
      const root = document.querySelector('afro-navbar').shadowRoot.querySelector('afro-country-selector').shadowRoot;
      return {
        nigeria: root.querySelector('[data-code="NG"] .cs-option-name')?.textContent.trim(),
        westAfrica: [...root.querySelectorAll('.cs-group-title')].some((node) => node.textContent.trim() === 'Yammacin Afirka'),
        count: root.querySelectorAll('.cs-option').length
      };
    });
    expect(optionState.nigeria).toBe('Najeriya');
    expect(optionState.westAfrica).toBe(true);
    expect(optionState.count).toBe(54);
  });

  test('account and legal bridges announce English before navigation', async ({ page }) => {
    await page.goto('/ha/shiga/?destination=%2Fauth%2F%3Fmode%3Dlogin&return_to=%2Fha%2F');
    await expect(page.locator('h1')).toHaveText('Shiga asusu');
    await expect(page.getByText('Shafin da za a buɗe yana Turanci.')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('link[rel="alternate"]')).toHaveCount(0);
    const href = await page.locator('#haBridgeContinue').getAttribute('href');
    expect(href).toContain('/auth/');
    expect(href).toContain('locale=ha');
    expect(href).toContain('return_to=%2Fha%2F');

    await page.goto('/ha/sirri/');
    await expect(page.getByText('Shafin da za a buɗe yana Turanci.')).toBeVisible();
    await expect(page.locator('link[rel="alternate"]')).toHaveCount(0);
  });

  test('Hausa tool links use a bridge and retain return intent', async ({ page }) => {
    await page.goto('/ha/najeriya/harajin-albashi/');
    const dashboardLink = page.locator('a[href^="/ha/allon-aiki/"]').first();
    expect(await page.locator('a[href^="/ha/allon-aiki/"]').count()).toBeGreaterThan(0);
    const href = await dashboardLink.getAttribute('href');
    expect(href).toContain('destination=');
    expect(href).toContain('return_to=');
  });

  test('mobile navigation exposes localized controls and explicit bridges', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ha/');
    await page.waitForFunction(() => customElements.get('afro-navbar') && document.querySelector('afro-navbar')?.shadowRoot);

    const state = await page.evaluate(() => {
      const nav = document.querySelector('afro-navbar').shadowRoot;
      const burger = nav.querySelector('.burger');
      burger.click();
      const drawer = nav.querySelector('.mob');
      return {
        menuLabel: burger.getAttribute('aria-label'),
        expanded: burger.getAttribute('aria-expanded'),
        drawerOpen: drawer.classList.contains('open'),
        signInHref: drawer.querySelector('.mob-login')?.getAttribute('href'),
        proHref: drawer.querySelector('.mob-pro-link')?.getAttribute('href'),
        countryLabel: drawer.querySelector('afro-country-selector')?.getAttribute('label')
      };
    });

    expect(state).toMatchObject({
      menuLabel: 'Bude menu',
      expanded: 'true',
      drawerOpen: true,
      countryLabel: 'Fara da ƙasa'
    });
    expect(state.signInHref).toContain('/ha/shiga/');
    expect(state.proHref).toContain('/ha/farashi/');
  });

  test('CAR crop yield identity is correct before and after hydration', async ({ page }) => {
    await page.goto('/agriculture/crop-yield/central-african-republic');
    await expect(page.locator('h1')).toContainText('Central African Republic Crop Yield Estimator');
    await expect(page.locator('.breadcrumb [aria-current="page"]')).toHaveText('Central African Republic');
    await expect(page.locator('meta[name="afrotools-country-id"]')).toHaveAttribute('content', 'CF');
    await expect(page.locator('meta[name="afrotools-formula-jurisdiction"]')).toHaveAttribute('content', 'CF');
    await expect(page.locator('meta[name="afrotools-currency"]')).toHaveAttribute('content', 'XAF');
    await expect(page.locator('#countryInfo')).toContainText("Central African Republic's GDP");
    await expect(page.locator('#countryInfo')).not.toContainText("Nigeria's GDP");
  });

  test('bridge and CAR identity remain useful without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/ha/allon-aiki/');
    await expect(page.locator('h1')).toHaveText('Allon aikin asusu');
    await expect(page.getByText('Shafin da za a buɗe yana Turanci.')).toBeVisible();
    await expect(page.locator('#haBridgeContinue')).toHaveAttribute('href', /locale=ha/);

    await page.goto('/agriculture/crop-yield/central-african-republic');
    await expect(page.locator('h1')).toContainText('Central African Republic Crop Yield Estimator');
    await expect(page.locator('.breadcrumb [aria-current="page"]')).toHaveText('Central African Republic');
    await context.close();
  });
});
