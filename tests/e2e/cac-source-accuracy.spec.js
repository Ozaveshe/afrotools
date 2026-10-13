const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const ledger = require('../../data/cac-checker/source-evidence.json');

async function open(page, options = {}) {
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.route('**/*', route => {
    const host = new URL(route.request().url()).hostname;
    return host === '127.0.0.1' || host === 'localhost' ? route.continue() : route.abort();
  });
  await page.route('**/data/cac-checker/source-evidence.json', route => route.fulfill(options.failSources
    ? {status: 503, body: 'unavailable'}
    : {contentType: 'application/json', body: JSON.stringify(ledger)}));
  await page.goto('/tools/cac-checker/');
}

for (const width of [320, 375, 768]) test('local preflight preserves unverified authority and mobile layout at ' + width, async ({page}) => {
  const errors = [], sent = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width, height: 900});
  await open(page);
  page.on('request', request => sent.push(request.url() + (request.postData() || '')));
  await page.getByLabel('Proposed business name', {exact: true}).fill('Synthetic Cedar Limited');
  await page.locator('#regType').selectOption('ltd');
  await page.getByRole('button', {name: 'Prepare naming preflight'}).click();
  await expect(page.getByText('Official availability not checked', {exact: true})).toBeVisible();
  await expect(page.getByText('Name Likely Available', {exact: true})).toHaveCount(0);
  await expect(page.getByText('Source references loaded.', {exact: false})).toBeVisible();
  await expect(page.locator('#resultArea a').first()).toHaveAttribute('href', 'https://icrp.cac.gov.ng/public-search/');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Download preparation JSON'}).click();
  const download = await pending;
  const result = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
  expect(result).toMatchObject({country: 'NG', availability: 'not_checked', reservation: 'not_confirmed', currentFeeTotal: null, currentFees: 'not_verified', registrationDuty: 'not_assessed', VATStatus: 'not_assessed', foreignCapital: 'not_verified', processingTime: 'not_verified'});
  expect(result.sourceEvidence.country).toBe('NG');
  expect(sent.some(value => /Synthetic|Cedar/.test(value))).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
  const table = page.locator('.cost-table');
  await table.focus();
  await expect(table).toBeFocused();
});

test('source failure preserves a local draft, renders text safely and invalidates stale exports', async ({page}) => {
  await open(page, {failSources: true});
  await page.locator('#bizName').fill('Synthetic <img src=x onerror=alert(1)> café');
  await page.getByRole('button', {name: 'Prepare naming preflight'}).click();
  await expect(page.getByText('Source metadata unavailable.', {exact: false})).toBeVisible();
  await expect(page.locator('#resultArea img, #resultArea script')).toHaveCount(0);
  await expect(page.getByRole('button', {name: 'Download preparation TXT'})).toBeEnabled();
  await page.locator('#bizName').fill('Synthetic Next Draft');
  await expect(page.getByText('Inputs changed. Run the local preflight again.', {exact: true})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Download preparation JSON'})).toHaveCount(0);
});

test('long name validation preserves the field and incomplete sources fail safely', async ({page}) => {
  await open(page);
  const name = 'Synthetic ' + 'x'.repeat(290);
  await page.locator('#bizName').fill(name);
  await page.getByRole('button', {name: 'Prepare naming preflight'}).click();
  await expect(page.locator('#bizName')).toHaveValue(name);
  await expect(page.locator('#bizName')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('alert')).toContainText('300 characters');
  await expect(page.getByRole('button', {name: 'Download preparation JSON'})).toHaveCount(0);
  await page.route('**/data/cac-checker/source-evidence.json', route => route.fulfill({contentType: 'application/json', body: JSON.stringify({...ledger, sources: []})}));
  await page.locator('#bizName').fill('Synthetic Short Draft');
  await page.getByRole('button', {name: 'Prepare naming preflight'}).click();
  await expect(page.getByText('Source metadata unavailable.', {exact: false})).toBeVisible();
  await expect(page.getByText('Source references loaded.', {exact: false})).toHaveCount(0);
});

test('existing legal workflow saves, reloads, copies and prints locally with consent kept optional', async ({page}) => {
  await page.addInitScript(() => {
    window.__testCopies = [];
    window.__testPrints = 0;
    Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText: async text => {window.__testCopies.push(text);}}});
    window.print = () => {window.__testPrints += 1;};
  });
  let subscriptionRequests = 0;
  await open(page);
  await page.route('**/api/capture-lead', route => {
    subscriptionRequests += 1;
    return route.fulfill({contentType: 'application/json', body: JSON.stringify({ok: true, stored: true})});
  });
  const matter = page.locator('[data-workflow-field="matter"]');
  await matter.fill('Synthetic CAC preparation');
  await page.locator('[data-workflow-field="country"]').fill('Nigeria');
  await page.locator('[data-workflow-field="note"]').fill('Synthetic local checklist only');
  await page.locator('[data-workflow-build]').click();
  await expect(page.locator('[data-workflow-output]')).toHaveValue(/Synthetic CAC preparation/);
  await page.locator('[data-workflow-save]').click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('afrotools-legal-workflow:cac-checker') || '{}').matter)).toBe('Synthetic CAC preparation');
  await matter.fill('Synthetic changed matter');
  await page.locator('[data-workflow-load]').click();
  await expect(matter).toHaveValue('Synthetic CAC preparation');
  await page.reload();
  await expect(matter).toHaveValue('Synthetic CAC preparation');
  await page.locator('[data-workflow-copy]').click();
  await expect.poll(() => page.evaluate(() => window.__testCopies.join('\n'))).toContain('Synthetic CAC preparation');
  await page.locator('[data-workflow-print]').click();
  expect(await page.evaluate(() => window.__testPrints)).toBe(1);
  await expect(page.locator('[data-workflow-optin]')).not.toBeChecked();
  await page.locator('[data-workflow-email]').fill('synthetic@example.invalid');
  await page.locator('[data-workflow-pdf-gate]').click();
  await expect(page.locator('[data-workflow-gate-status]')).toContainText('Select the updates checkbox');
  expect(subscriptionRequests).toBe(0);
  await page.locator('[data-workflow-optin]').check();
  await page.locator('[data-workflow-pdf-gate]').click();
  await expect(page.locator('[data-workflow-gate-status]')).toContainText('Updates subscription received');
  expect(subscriptionRequests).toBe(1);
  await page.locator('#bizName').fill('Synthetic Cedar');
  await page.getByRole('button', {name: 'Prepare naming preflight'}).click();
  await page.getByRole('button', {name: 'Copy preparation note'}).click();
  await expect.poll(() => page.evaluate(() => window.__testCopies.join('\n'))).toContain('Official availability: not checked');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Download preparation TXT'}).click();
  const download = await pending;
  const text = fs.readFileSync(await download.path(), 'utf8');
  expect(text).toContain('Official availability: not checked');
  expect(text).toContain('Current payable fee: not verified');
});
