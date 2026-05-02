const { test, expect } = require('@playwright/test');

test('homepage Sign Up Free opens the canonical auth route', async ({ page, request }) => {
  const authResponse = await request.get('/auth/');
  expect(authResponse.status()).toBeLessThan(400);

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
  const html = await response.text();

  expect(html).toContain('Sign in to your dashboard');
  expect(html).toContain('href="/auth/?mode=login&amp;next=/dashboard/"');
  expect(html).toMatch(/id="dashboardSection"[^>]*hidden/);
  expect(html).not.toContain('onclick="AfroAuth.openModal()"');
});

test('Pro trial CTA routes signed-out users to auth signup', async ({ page }) => {
  await page.goto('/pro/', { waitUntil: 'domcontentloaded' });

  const trial = page.locator('#btn-monthly');
  await expect(trial).toHaveAttribute('href', /\/auth\/\?mode=signup.*intent=pro-trial/);

  await trial.click();
  await expect(page).toHaveURL(/\/auth\/\?mode=signup.*intent=pro-trial/);
});

test('API key CTAs open auth signup with API-key capture visible', async ({ page }) => {
  await page.goto('/developers/', { waitUntil: 'domcontentloaded' });

  const keyCta = page.getByRole('link', { name: /sign up for free/i }).first();
  await expect(keyCta).toHaveAttribute('href', /\/auth\/\?mode=signup.*intent=api-key/);

  await keyCta.click();
  await expect(page).toHaveURL(/\/auth\/\?mode=signup.*intent=api-key/);
  await expect(page.getByRole('heading', { name: /get an api key/i })).toBeVisible();
  await expect(page.locator('#apiKeyPanel')).toBeVisible();
});

test('Save to My Tools fallback prompts auth instead of dashboard dead-end', async ({ page }) => {
  await page.goto('/nigeria/ng-salary-tax.html', { waitUntil: 'domcontentloaded' });

  const save = page.getByRole('button', { name: /sign in to save|save to my tools/i }).first();
  await expect(save).toBeVisible();
  await save.click();

  await expect(async () => {
    const modalVisible = await page.locator('#afroAuthModal.open').isVisible().catch(() => false);
    const authUrl = /\/auth\/\?mode=login.*next=%2Fdashboard%2F/.test(page.url());
    expect(modalVisible || authUrl).toBeTruthy();
  }).toPass();
});
