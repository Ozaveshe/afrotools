const { test, expect } = require('@playwright/test');

async function stubNoisyThirdParties(page) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'www.googletagmanager.com' || url.hostname === 'www.google-analytics.com') {
      await route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: '' });
      return;
    }
    if (typeof route.fallback === 'function') await route.fallback();
    else await route.continue();
  });
}

async function waitForCountrySelector(page) {
  await page.waitForFunction(() => Boolean(window.customElements && customElements.get('afro-country-selector')));
}

async function selectCountry(page, selector, search, option) {
  const element = page.locator(selector).first();
  await expect(element).toBeVisible();
  await element.locator('.cs-trigger').click();
  await element.locator('.cs-search').fill(search);
  await element.locator('.cs-option', { hasText: option }).first().click();
}

test('selecting Nigeria updates homepage country actions', async ({ page }) => {
  await stubNoisyThirdParties(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForCountrySelector(page);
  await selectCountry(page, '#homeCountrySelector', 'Nigeria', 'Nigeria');
  await expect(page.locator('[data-country-home-href]').first()).toHaveAttribute('href', '/nigeria/');
  await expect(page.locator('[data-country-tools-href]').first()).toHaveAttribute('href', '/tools/?country=NG');
});

test('selecting Kenya updates homepage actions and persists after refresh', async ({ page }) => {
  await stubNoisyThirdParties(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForCountrySelector(page);
  await selectCountry(page, '#homeCountrySelector', 'Kenya', 'Kenya');
  await expect(page.locator('[data-country-home-href]').first()).toHaveAttribute('href', '/kenya/');
  await expect(page.locator('[data-country-tools-href]').first()).toHaveAttribute('href', '/tools/?country=KE');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForCountrySelector(page);
  await expect(page.locator('#homeCountrySelector').locator('.cs-trigger')).toContainText('Kenya');
});

test('tools page applies selected country to discovery filters', async ({ page }) => {
  await stubNoisyThirdParties(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForCountrySelector(page);
  await selectCountry(page, '#homeCountrySelector', 'Kenya', 'Kenya');
  await page.goto('/tools/', { waitUntil: 'domcontentloaded' });
  await waitForCountrySelector(page);
  await expect(page.locator('#country-filter')).toHaveValue('KE');
  await expect(page.locator('#tools-country-context')).toContainText('Kenya');
  await expect(page.locator('#tools-country-context')).toContainText('KES');
});

test('/start/ redirects country goal to the selected country hub', async ({ page }) => {
  await stubNoisyThirdParties(page);
  await page.goto('/start/', { waitUntil: 'domcontentloaded' });
  await waitForCountrySelector(page);
  await selectCountry(page, '#startCountrySelector', 'Kenya', 'Kenya');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/\/kenya\/$/);
});

test('signed-in country selection saves profile country fields', async ({ page }) => {
  let profilePayload = null;
  await page.addInitScript(() => {
    window.AfroAuth = {
      isLoggedIn: () => true,
      getSessionToken: () => 'valid-browser-token'
    };
  });
  await page.route('**/assets/js/afro-auth.js*', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript; charset=utf-8',
      body: `window.AfroAuth = {
        isLoggedIn: function() { return true; },
        getSessionToken: function() { return 'valid-browser-token'; }
      };`
    });
  });
  await page.route('**/api/profile', async (route) => {
    if (route.request().method() === 'POST') {
      profilePayload = route.request().postDataJSON();
      await route.fulfill({
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ ok: true, profile: profilePayload })
      });
      return;
    }
    await route.fulfill({
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({ profile: null })
    });
  });
  await stubNoisyThirdParties(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForCountrySelector(page);
  await selectCountry(page, '#homeCountrySelector', 'Kenya', 'Kenya');
  await expect.poll(() => profilePayload && profilePayload.country_code).toBe('KE');
  expect(profilePayload).toMatchObject({
    country: 'Kenya',
    country_code: 'KE',
    currency: 'KES',
    onboarding_completed: true
  });
});
