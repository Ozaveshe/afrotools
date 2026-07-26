const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__spoken = [];
    window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => [{ lang: 'am-ET', name: 'Fixture Amharic' }],
        cancel: () => {},
        speak: (utterance) => window.__spoken.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice.name })
      }
    });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text) => { window.__copied = text; } } });
  });
  await page.goto('/tools/amharic-translator/');
});

test('searches English, Ethiopic and romanisation while exposing category state', async ({ page }) => {
  const search = page.getByLabel('Search English, Amharic or romanisation');
  await search.fill('ሰላም');
  await expect(page.locator('.phrase')).toHaveCount(1);
  await search.fill('Selam');
  await expect(page.locator('.phrase')).toHaveCount(1);
  await search.fill('');
  const basics = page.getByRole('button', { name: 'Basics', exact: true });
  await basics.click();
  await expect(basics).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'All', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.phrase')).toHaveCount(11);
});

test('uses Ethiopic text with am-ET only when an Amharic device voice exists', async ({ page }) => {
  await page.getByLabel('Search English, Amharic or romanisation').fill('Hello');
  await page.getByRole('button', { name: 'Try device Amharic voice for Hello' }).click();
  expect(await page.evaluate(() => window.__spoken)).toEqual([{ text: 'ሰላም', lang: 'am-ET', voice: 'Fixture Amharic' }]);
  await expect(page.getByText('Playing device voice for Hello.')).toBeVisible();
});

test('explains unavailable Amharic speech instead of playing a fallback voice', async ({ page }) => {
  await page.evaluate(() => { window.speechSynthesis.getVoices = () => [{ lang: 'en-US', name: 'English only' }]; });
  await page.getByLabel('Search English, Amharic or romanisation').fill('Hello');
  await page.getByRole('button', { name: 'Try device Amharic voice for Hello' }).click();
  expect(await page.evaluate(() => window.__spoken)).toEqual([]);
  await expect(page.getByText('No Amharic voice is installed. Use the Ethiopic text with a fluent speaker.')).toBeVisible();
});

test('quiz marks the stored correct row and announces feedback', async ({ page }) => {
  const prompt = await page.locator('.quiz-q').textContent();
  const correct = await page.evaluate((question) => {
    const english = question.replace('How do you say: "', '').replace('"?', '');
    return window.PHRASES.find((row) => row.en === english).lang;
  }, prompt);
  const options = page.locator('.quiz-opt');
  const count = await options.count();
  let wrong;
  for (let index = 0; index < count; index += 1) {
    const option = options.nth(index);
    if ((await option.textContent()) !== correct) { wrong = option; break; }
  }
  await wrong.click();
  await expect(page.locator('.quiz-opt.correct')).toHaveText(correct);
  await expect(page.getByRole('status').filter({ hasText: 'Not quite.' })).toContainText(correct);
  await expect(options.first()).toBeDisabled();
});
