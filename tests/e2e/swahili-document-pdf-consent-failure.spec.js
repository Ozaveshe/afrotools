const { test, expect } = require('@playwright/test');
const {
  PDFDocument,
  StandardFonts
} = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');

const PRIVATE_MARKER = 'SW_CONSENT_PRIVATE_2026';
let fixturePdf;

test.describe.configure({ mode: 'serial', timeout: 120_000 });
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test.beforeAll(async () => {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const page = document.addPage([420, 594]);
  page.drawText(`Synthetic document ${PRIVATE_MARKER} page one`, {
    x: 42,
    y: 520,
    size: 14,
    font
  });
  fixturePdf = Buffer.from(await document.save({ useObjectStreams: false }));
});

async function upload(page, selector) {
  await page.locator(selector).setInputFiles({
    name: 'synthetic-consent-proof.pdf',
    mimeType: 'application/pdf',
    buffer: fixturePdf
  });
}

test('PDF chat requires real content consent and falls back locally on failure and offline', async ({ page, context }) => {
  const posts = [];
  let endpointMode = 'success';
  await page.route('**/.netlify/functions/ai-advisor', async (route) => {
    const request = route.request();
    posts.push({
      headers: request.headers(),
      body: JSON.parse(request.postData() || '{}')
    });
    if (endpointMode === 'failure') {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"offline"}' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reply: 'Jibu la AI lenye ridhaa.', remaining: 4 })
    });
  });

  await page.goto('/sw/zana/chat-na-pdf/', { waitUntil: 'domcontentloaded' });
  await upload(page, '#fileInput');
  await expect(page.locator('#chatInput')).toBeVisible();

  await page.locator('#chatInput').fill('Jibu ndani ya kifaa');
  await expect(page.locator('#sendBtn')).toBeEnabled({ timeout: 30_000 });
  await page.locator('#sendBtn').click();
  await expect(page.locator('#chatFooter')).toContainText(/locally|ndani/i);
  expect(posts).toHaveLength(0);

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#aiAssistConsent').check();
  await expect(page.locator('#aiAssistConsent')).toBeChecked();
  await page.locator('#chatInput').fill('Tuma kwa AI kwa ridhaa');
  await page.locator('#sendBtn').click();
  await expect(page.locator('#messages')).toContainText('Jibu la AI lenye ridhaa.');
  expect(posts).toHaveLength(1);
  expect(posts[0].headers['x-afrotools-ai-consent']).toBe('accepted');
  expect(posts[0].headers['x-afrotools-ai-content-consent']).toBe('accepted');
  expect(posts[0].body.tool).toBe('pdf-chat');
  const sentChat = JSON.stringify(posts[0].body);
  expect(sentChat).toContain(PRIVATE_MARKER);
  expect(sentChat).not.toContain('%PDF-');
  expect(sentChat.length).toBeLessThan(30_000);

  endpointMode = 'failure';
  await page.locator('#chatInput').fill('Jaribu wakati huduma imeshindwa');
  await page.locator('#sendBtn').click();
  await expect(page.locator('#chatFooter')).toContainText(/local|ndani|eneo lako/i);
  expect(posts).toHaveLength(2);

  await context.setOffline(true);
  await page.locator('#chatInput').fill('Jaribu nje ya mtandao');
  await page.locator('#sendBtn').click();
  await expect(page.locator('#chatFooter')).toContainText(/local|ndani|eneo lako/i);
  await context.setOffline(false);
});

test('PDF translate blocks silent sends and uses safe local fallback for endpoint failure and offline', async ({ page, context }) => {
  const posts = [];
  let endpointMode = 'success';
  const handler = async (route) => {
    const request = route.request();
    posts.push({
      url: request.url(),
      headers: request.headers(),
      body: JSON.parse(request.postData() || '{}')
    });
    if (endpointMode === 'failure') {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"unavailable"}' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ translatedText: `Tafsiri ${PRIVATE_MARKER}`, provider: 'synthetic-provider' })
    });
  };
  await page.route('**/api/translate', handler);
  await page.route('**/.netlify/functions/ai-advisor', handler);

  await page.goto('/sw/zana/kutafsiri-pdf/', { waitUntil: 'domcontentloaded' });
  await upload(page, '#pdfFile');
  await expect(page.locator('#translateBtn')).toBeEnabled({ timeout: 30_000 });

  await page.locator('#engineMode').selectOption('local');
  await page.locator('#translateBtn').click();
  await expect(page.locator('#resultSection')).toBeVisible({ timeout: 30_000 });
  expect(posts).toHaveLength(0);

  await page.locator('#engineMode').selectOption('api');
  await expect(page.locator('#cloudConsent')).not.toBeChecked();
  await page.locator('#translateBtn').click();
  await expect(page.locator('#errorBanner')).toBeVisible();
  expect(posts).toHaveLength(0);

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#cloudConsent').check();
  await expect(page.locator('#cloudConsent')).toBeChecked();
  await page.locator('#translateBtn').click();
  await expect(page.locator('#translatedPanel')).toContainText(PRIVATE_MARKER, { timeout: 30_000 });
  expect(posts).toHaveLength(1);
  expect(posts[0].headers['x-afrotools-external-translation-consent']).toBe('accepted');
  expect(posts[0].headers['x-afrotools-ai-content-consent']).toBe('accepted');
  const sentTranslation = JSON.stringify(posts[0].body);
  expect(sentTranslation).toContain(PRIVATE_MARKER);
  expect(sentTranslation).not.toContain('%PDF-');
  expect(sentTranslation.length).toBeLessThan(8_000);

  endpointMode = 'failure';
  await page.locator('#translateBtn').click();
  await expect(page.locator('#translatedPanel')).toContainText(/Local draft|rasimu|review/i, { timeout: 30_000 });
  expect(posts.length).toBeGreaterThanOrEqual(2);

  await context.setOffline(true);
  await page.locator('#translateBtn').click();
  await expect(page.locator('#translatedPanel')).toContainText(/Local draft|rasimu|review/i, { timeout: 30_000 });
  await context.setOffline(false);
});
