const { test, expect } = require('@playwright/test');

test('AI Advisor requests require explicit consent before network send', async ({ page }) => {
  await page.goto('/nigeria/ng-salary-tax.html');

  let networkHits = 0;
  let consentHeader = '';
  await page.route('**/.netlify/functions/ai-advisor', async route => {
    networkHits += 1;
    consentHeader = route.request().headers()['x-afrotools-ai-consent'] || '';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reply: 'ok', text: 'ok' })
    });
  });

  await page.evaluate(() => window.AfroTools && window.AfroTools.AIConsent && window.AfroTools.AIConsent.reset());
  page.once('dialog', dialog => dialog.dismiss());
  const cancelled = await page.evaluate(async () => {
    const res = await fetch('/.netlify/functions/ai-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'ng-paye', message: 'Explain this result' })
    });
    return { status: res.status, body: await res.json() };
  });

  expect(cancelled.status).toBe(428);
  expect(cancelled.body.error).toBe('ai_consent_required');
  expect(networkHits).toBe(0);

  page.once('dialog', dialog => dialog.accept());
  const accepted = await page.evaluate(async () => {
    const res = await fetch('/.netlify/functions/ai-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'ng-paye', message: 'Explain this result' })
    });
    return { status: res.status, body: await res.json() };
  });

  expect(accepted.status).toBe(200);
  expect(accepted.body.reply).toBe('ok');
  expect(networkHits).toBe(1);
  expect(consentHeader).toBe('accepted');
});
