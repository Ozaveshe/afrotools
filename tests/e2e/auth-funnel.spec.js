const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
  });
});

test('homepage Sign Up Free opens the canonical auth route', async ({ page, request }) => {
  const response = await request.get('/auth/');
  expect(response.status()).toBeLessThan(400);

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const signup = page.locator('.signup-bar-btn').first();
  await expect(signup).toHaveAttribute('href', /\/auth\/\?mode=signup/);
  await signup.click();
  await expect(page).toHaveURL(/\/auth\/\?mode=signup/);
  await expect(page.getByRole('heading', { name: /afrotools account access/i })).toBeVisible();
  await expect(page.locator('#signupForm')).toBeVisible();
});

test('dashboard signed-out state shows only the auth gate', async ({ request }) => {
  const response = await request.get('/dashboard/');
  expect(response.status()).toBeLessThan(400);

  const body = await response.text();
  expect(body).toContain('Sign in to your dashboard');
  expect(body).toContain('href="/auth/?mode=login&amp;next=/dashboard/"');
  expect(body).toMatch(/id="dashboardSection"[^>]*hidden/);
  expect(body).not.toContain('onclick="AfroAuth.openModal()"');
});

test('Pro checkout CTA routes signed-out users to auth signup', async ({ page }) => {
  await page.goto('/pro/', { waitUntil: 'domcontentloaded' });
  const checkout = page.locator('#btn-monthly');
  await expect(checkout).toHaveAttribute('href', /\/auth\/\?mode=signup.*intent=pro-checkout/);
  await checkout.click();
  await expect(page).toHaveURL(/\/auth\/\?mode=signup.*intent=pro-checkout/);
});

test('API key CTAs open auth signup with API-key capture visible', async ({ page }) => {
  await page.goto('/developers/', { waitUntil: 'domcontentloaded' });
  const signup = page.getByRole('link', { name: /sign up for free/i }).first();
  await expect(signup).toHaveAttribute('href', /\/auth\/\?mode=signup.*intent=api-key/);
  await signup.click();
  await expect(page).toHaveURL(/\/auth\/\?mode=signup.*intent=api-key/);
  await expect(page.getByRole('heading', { name: /get an api key/i })).toBeVisible();
  await expect(page.locator('#apiKeyPanel')).toBeVisible();
});

test('Save to My Tools fallback prompts auth instead of dashboard dead-end', async ({ page }) => {
  await page.goto('/nigeria/ng-salary-tax.html', { waitUntil: 'domcontentloaded' });
  const saveButton = page.getByRole('button', { name: /sign in to save|save to my tools/i }).first();
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  await expect(async () => {
    const modalVisible = await page.locator('#afroAuthModal.open').isVisible().catch(() => false);
    const redirected = /\/auth\/\?mode=login.*next=%2Fdashboard%2F/.test(page.url());
    expect(modalVisible || redirected).toBeTruthy();
  }).toPass();
});
