const { test, expect } = require('@playwright/test');

const route = '/ha/kayan-aiki/kwatanta-kunshin-intanet/';
test.use({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });

async function enterQuotes(page, overrides = {}) {
  const values = {
    needGb: '5', needDays: '10', nameA: 'Kano A', priceA: '900', gbA: '10', daysA: '7',
    nameB: 'Kano B', priceB: '1200', gbB: '6', daysB: '14', ...overrides,
  };
  for (const [name, value] of Object.entries(values)) {
    await page.locator('#planCompare [name="' + name + '"]').fill(value);
  }
  await page.locator('#planCompare [type="submit"]').click();
}

test('compares a single purchase against both needs and exports the exact current report', async ({ page }) => {
  await page.goto(route);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ha');
  await expect(page.locator('#haPlanAPrice')).toHaveCount(1);
  await expect(page.locator('#haPlanAPrice')).toHaveValue('');
  await expect(page.locator('#planDownload')).toBeDisabled();
  await enterQuotes(page);
  const result = page.locator('#planResult');
  await expect(result).toContainText('kunshin', {ignoreCase: true});
  await expect(result).toContainText('kwanakin aiki ba su isa ba');
  await expect(result).toContainText('Kunshi B — Kano B kaɗai ya cika bukatarka');
  await expect(result).toContainText(/GB ɗaya:\s*NGN\s*90\b/);
  await expect(result).toContainText(/GB ɗaya:\s*NGN\s*200\b/);
  const shown = await result.innerText();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('#planCopy').click();
  await expect(page.locator('#planStatus')).toContainText('An kwafi');
  const pasted = await page.evaluate(() => navigator.clipboard.readText());
  expect(pasted.replace(/\r\n/g, '\n')).toBe(shown);
  const [download] = await Promise.all([
    page.waitForEvent('download'), page.locator('#planDownload').click(),
  ]);
  expect(download.suggestedFilename()).toBe('kwatancen-kunshin-intanet-NGN.txt');
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString('utf8')).toBe(shown + '\n');
  await page.locator('#haPlanAGb').fill('0');
  await expect(result).toBeEmpty();
  await expect(page.locator('#planDownload')).toBeDisabled();
  await page.locator('#planCompare [type="submit"]').click();
  await expect(page.locator('#planStatus')).toContainText('GB');
  await expect(page.locator('#planCopy')).toBeDisabled();
});

test('handles equal eligible prices, no eligible plan and a zero-price offer', async ({ page }) => {
  await page.goto(route);
  await enterQuotes(page, {priceA:'1200', daysA:'10'});
  await expect(page.locator('#planResult')).toContainText('farashinsu ɗaya ne');
  await enterQuotes(page, {needGb:'11'});
  await expect(page.locator('#planResult')).toContainText('Babu kunshin');
  await enterQuotes(page, {priceA:'0', daysA:'10'});
  await expect(page.locator('#planResult')).toContainText(/Kano A ya fi araha da NGN\s*1,200/);
});

test('requires quoted prices in the selected currency and supports keyboard recovery', async ({ page }) => {
  await page.setViewportSize({width:320,height:780});
  await page.goto(route);
  await page.locator('[name="currency"]').selectOption('XOF');
  await enterQuotes(page, {priceA:'900.5'});
  await expect(page.locator('#planDownload')).toBeDisabled();
  await expect(page.locator('#planStatus')).toContainText('farashin');
  await page.locator('#haPlanAPrice').fill('901');
  await page.locator('#haPlanAPrice').press('Enter');
  await expect(page.locator('#planResult')).toContainText(/XOF\s*901/);
  const overflow = await page.locator('#planCompare').evaluate(node => node.scrollWidth - node.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
