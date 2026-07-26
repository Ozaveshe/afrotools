const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__spoken = [];
    window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => [{ lang: 'zu-ZA', name: 'Fixture isiZulu' }],
        cancel: () => {},
        speak: (utterance) => window.__spoken.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice.name })
      }
    });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text) => { window.__copied = text; } } });
  });
  await page.goto('/tools/zulu-translator/');
});

test('searches English, isiZulu and pronunciation cues with category state', async ({ page }) => {
  const search = page.getByLabel('Search English, isiZulu or pronunciation cue');
  await search.fill('Sanibonani');
  await expect(page.locator('.phrase')).toHaveCount(1);
  await search.fill('sah-nee-boh-NAH-nee');
  await expect(page.locator('.phrase')).toHaveCount(1);
  await search.fill('');
  const greetings = page.getByRole('button', { name: 'Greetings', exact: true });
  await greetings.click();
  await expect(greetings).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'All', exact: true })).toHaveAttribute('aria-pressed', 'false');
});

test('copies the exact visible phrase and uses a reported isiZulu voice', async ({ page }) => {
  await page.getByLabel('Search English, isiZulu or pronunciation cue').fill('Hello');
  await page.getByRole('button', { name: 'Copy isiZulu phrase: Sawubona' }).click();
  expect(await page.evaluate(() => window.__copied)).toBe('Sawubona');
  await page.getByRole('button', { name: 'Try installed isiZulu device voice for: Sawubona' }).click();
  expect(await page.evaluate(() => window.__spoken)).toEqual([{ text: 'Sawubona', lang: 'zu-ZA', voice: 'Fixture isiZulu' }]);
});

test('does not substitute an unrelated speech voice', async ({ page }) => {
  await page.evaluate(() => { window.speechSynthesis.getVoices = () => [{ lang: 'en-US', name: 'English only' }]; });
  await page.getByLabel('Search English, isiZulu or pronunciation cue').fill('Hello');
  await page.getByRole('button', { name: 'Try installed isiZulu device voice for: Sawubona' }).click();
  expect(await page.evaluate(() => window.__spoken)).toEqual([]);
  await expect(page.getByText('No installed isiZulu voice found; no fallback voice was used.')).toBeVisible();
});

test('all interactive controls have names and the quiz announces the stored answer', async ({ page }) => {
  const unnamed = await page.locator('button').evaluateAll((buttons) => buttons.filter((button) => !button.innerText.trim() && !button.getAttribute('aria-label')).length);
  expect(unnamed).toBe(0);
  const correct = await page.evaluate(() => window.quizCorrectLang);
  const options = page.locator('.quiz-opt');
  const count = await options.count();
  let wrong;
  for (let index = 0; index < count; index += 1) {
    const option = options.nth(index);
    if ((await option.textContent()) !== correct) { wrong = option; break; }
  }
  await wrong.click();
  await expect(page.locator('.quiz-opt.correct')).toHaveText(correct);
  await expect(page.locator('#quizFeedback')).toContainText(correct);
  await expect(options.first()).toBeDisabled();
});
