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

const reviewedIndex = require('../../data/jamb/pools/index.json');
const { publication, revision } = require('../support/jamb-reviewed-fixtures');

async function localOnly(page) {
  await page.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
}

test('Hausa entry shows each current reviewed subject count without the old bank-size claim', async ({ page }) => {
  await localOnly(page);
  await page.goto('/ha/jamb/');
  const expected = Object.values(reviewedIndex.stats.by_subject).map(stats => stats.total ? String(stats.total) : 'Ana dubawa');
  const counts = page.locator('#ha-subj-grid .ha-jamb-subject > strong');
  await expect(counts).toHaveCount(expected.length);
  await expect.poll(async () => (await counts.allTextContents()).map(text => text === 'Ana dubawa' ? text : text.replace(/[^0-9]/g, ''))).toEqual(expected);
  await expect(page.locator('main')).not.toContainText('16,000+');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Hausa entry explicitly marks a zero-reviewed subject while retaining available counts', async ({ page }) => {
  await localOnly(page);
  const index = publication({ schema_version: 1, review_revision: revision, stats: { by_subject: { mathematics: { total: 0 }, english: { total: 3 } } } });
  await page.route('**/data/jamb/pools/index.json', route => route.fulfill({ json: index }));
  await page.goto('/ha/jamb/');
  await expect(page.locator('#ha-subj-grid .ha-jamb-subject > strong')).toHaveText(['Ana dubawa', '3']);
  await expect(page.locator('#ha-subj-grid a').first()).toHaveAttribute('href', '/ha/jamb/lissafi/');
});

test('Hausa entry does not display counts from a corrupted reviewed index', async ({ page }) => {
  await localOnly(page);
  const index = publication({ schema_version: 1, review_revision: revision, stats: { by_subject: { mathematics: { total: 3 } } } });
  index.stats.by_subject.mathematics.total = 999999;
  await page.route('**/data/jamb/pools/index.json', route => route.fulfill({ json: index }));
  await page.goto('/ha/jamb/');
  await expect(page.locator('#ha-subj-grid')).toContainText('Jerin darussa bai loda ba');
  await expect(page.locator('#ha-subj-grid')).not.toContainText('999');
});
