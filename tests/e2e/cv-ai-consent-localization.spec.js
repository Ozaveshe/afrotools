'use strict';
const { test, expect } = require('@playwright/test');
test.use({ viewport: { width: 390, height: 844 }, trace: 'off', screenshot: 'off', video: 'off', serviceWorkers: 'block' });

for (const [locale, route, title] of [
  ['en', '/tools/cv-builder/', 'Optional AI help for your CV'],
  ['fr', '/fr/tools/generateur-cv/', 'Aide facultative par IA pour votre CV'],
  ['sw', '/sw/zana/mjenzi-cv/', 'Msaada wa AI kwa CV yako (hiari)']
]) test(`${locale}: actual CV assistant requires native content consent for every action`, async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  let sends = 0, correctHeaders = false, exactContent = false, dialogs = 0;
  const fixture = 'Synthetic Ɗ É CV content for a consent test';
  await page.route('**/*', async intercepted => {
    const request = intercepted.request();
    if (new URL(request.url()).origin !== origin) return intercepted.fulfill({ status: 204 });
    if (new URL(request.url()).pathname === '/.netlify/functions/ai-advisor') {
      sends++;
      correctHeaders = request.headers()['x-afrotools-ai-content-consent'] === 'accepted';
      const payload = request.postDataJSON();
      exactContent = payload.tool === 'cv-builder' && payload.messages.some(message => message.content.includes(fixture));
      return intercepted.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        response: JSON.stringify(['Synthetic option one', 'Synthetic option two', 'Synthetic option three']) }) });
    }
    return request.method() === 'GET' ? intercepted.continue() : intercepted.fulfill({ status: 204 });
  });
  await page.addInitScript(() => localStorage.setItem('afrotools_ai_advisor_consent', 'accepted'));
  await page.goto(route);
  await page.waitForFunction(() => window.CVImproveAssistant && window.AfroTools?.AIConsent);
  await page.evaluate(() => CVImproveAssistant.open({ mode: 'summary', path: 'summary', tone: 'stronger' }));
  await page.locator('#cv-improve-input').fill(fixture);
  let permit = false;
  page.on('dialog', async dialog => {
    dialogs++;
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message().startsWith(title)).toBe(true);
    await (permit ? dialog.accept() : dialog.dismiss());
  });
  const ai = page.locator('[data-ai-options]');
  await ai.click();
  await expect.poll(() => dialogs).toBe(1);
  await expect(page.locator('[data-option-edit]')).toHaveCount(3);
  expect(sends).toBe(0);
  permit = true;
  await ai.click();
  await expect.poll(() => sends).toBe(1);
  await expect(page.locator('[data-option-edit="0"]')).toHaveValue('Synthetic option one');
  expect(correctHeaders && exactContent).toBe(true);
  permit = false;
  await ai.click();
  await expect.poll(() => dialogs).toBe(3);
  expect(sends).toBe(1);
  expect(await page.evaluate(value => {
    const events = sessionStorage.getItem('afrotools_ai_consent_events') || '';
    return !events.includes(value) && !location.href.includes(value);
  }, fixture)).toBe(true);
});
