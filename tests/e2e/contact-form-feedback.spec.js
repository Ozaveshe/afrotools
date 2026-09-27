const { test, expect } = require('@playwright/test');

test('contact form preserves a failed message and confirms only an accepted submission', async ({ page }) => {
  let submissions = 0;
  const bodies = [];
  await page.route('**/', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    submissions += 1;
    bodies.push(new URLSearchParams(route.request().postData()));
    await route.fulfill({ status: submissions === 1 ? 503 : 200, body: '' });
  });

  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/contact/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const form = page.locator('#contactForm');
  await form.getByLabel('Your Name').fill('Example Tester');
  await form.getByLabel('Email Address', { exact: true }).fill('tester@example.invalid');
  await form.getByLabel('What is this about?').selectOption('error');
  await form.getByLabel('Your Message').fill('A synthetic calculator report for form QA.');

  const send = page.getByRole('button', { name: /Send Message/ });
  await send.click();
  await expect(page.locator('#contactStatus')).toContainText('could not be sent');
  await expect(form.getByLabel('Your Message')).toHaveValue('A synthetic calculator report for form QA.');
  await expect(send).toBeEnabled();
  await expect(page.locator('#successMsg')).toBeHidden();

  await send.click();
  await expect(page.locator('#successMsg')).toBeVisible();
  await expect(page.locator('#contactStatus')).toBeEmpty();
  expect(new URL(page.url()).pathname).toBe('/contact/');
  expect(submissions).toBe(2);
  for (const body of bodies) {
    expect(body.get('form-name')).toBe('contact');
    expect(body.get('bot-field')).toBe('');
    expect(body.get('name')).toBe('Example Tester');
    expect(body.get('email')).toBe('tester@example.invalid');
    expect(body.get('subject')).toBe('error');
    expect(body.get('message')).toBe('A synthetic calculator report for form QA.');
  }
});
