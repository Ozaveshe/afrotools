const { test, expect } = require('@playwright/test');
test.use({ viewport: { width: 390, height: 900 } });

test('freeform tutor keeps text local on cancel and sends only disclosed conversation after consent', async ({ page }) => {
  const sent = []; const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await page.route('**/.netlify/functions/ai-advisor', route => {
    sent.push(route.request().postDataJSON());
    return route.fulfill({ json: { reply: 'Synthetic learning guidance. Check the reasoning.' } });
  });
  await page.goto('/jamb/tutor/');
  const input = page.getByRole('textbox', { name: 'Your study question' });
  await input.fill('Explain multiplication using a simple example.');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(input).toHaveValue('Explain multiplication using a simple example.');
  expect(sent).toHaveLength(0);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.locator('#msg-list')).toContainText('Synthetic learning guidance.');
  expect(sent).toHaveLength(1);
  expect(sent[0].tool).toMatch(/^jamb-study-tutor-/);
  expect(sent[0].aiConsent).toBe('accepted');
  expect(sent[0].messages).toEqual([{ role: 'user', content: 'Explain multiplication using a simple example.' }]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('Hausa entry reports review state without the old bank-size claim', async ({ page }) => {
  await page.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await page.goto('/ha/jamb/');
  await expect(page.locator('#ha-subj-grid')).toContainText('Ana dubawa');
  await expect(page.locator('main')).not.toContainText('16,000+');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
