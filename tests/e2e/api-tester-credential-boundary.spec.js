const { test, expect } = require('@playwright/test');

const PAGE = '/tools/api-tester/';

async function configureBearer(page, endpoint, sentinel) {
  await page.locator('#url').fill(endpoint);
  await page.locator('.tab[data-tab="auth"]').click();
  await page.locator('#auth-type').selectOption('bearer');
  await page.locator('#auth-token').fill(sentinel);
}

test('credential sentinel reaches only the explicitly confirmed endpoint and is cleared', async ({ page }) => {
  const sentinel = `AT_SECRET_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const endpoint = 'https://confirmed-target.invalid/v1/check';
  const observed = [];
  const consoleMessages = [];

  page.on('console', message => consoleMessages.push(message.text()));
  page.on('request', request => {
    observed.push({
      url: request.url(),
      headers: request.headers(),
      body: request.postData() || ''
    });
  });
  await page.route('https://confirmed-target.invalid/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true })
    });
  });
  page.on('dialog', async dialog => {
    expect(dialog.message()).toContain('https://confirmed-target.invalid:443/v1/check');
    expect(dialog.message()).toContain('Authorization');
    expect(dialog.message()).not.toContain(sentinel);
    await dialog.accept();
  });

  await page.goto(PAGE);
  await configureBearer(page, endpoint, sentinel);
  await page.locator('#send-request').click();
  await expect(page.locator('#response-body')).toContainText('"ok": true');

  const targetRequests = observed.filter(entry => entry.url.startsWith(endpoint));
  expect(targetRequests).toHaveLength(1);
  expect(targetRequests[0].headers.authorization).toBe(`Bearer ${sentinel}`);
  for (const entry of observed.filter(entry => !entry.url.startsWith(endpoint))) {
    expect(JSON.stringify(entry)).not.toContain(sentinel);
  }
  const storage = await page.evaluate(() => JSON.stringify({
    local: { ...localStorage },
    session: { ...sessionStorage }
  }));
  expect(storage).not.toContain(sentinel);
  expect(page.url()).not.toContain(sentinel);
  expect(consoleMessages.join('\n')).not.toContain(sentinel);
  await expect(page.locator('#auth-token')).toHaveValue('');
});

test('cancelled credential confirmation sends nothing and clears the secret', async ({ page }) => {
  const sentinel = `AT_CANCEL_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  let targetRequests = 0;
  await page.route('https://cancelled-target.invalid/**', async route => {
    targetRequests += 1;
    await route.abort();
  });
  page.on('dialog', dialog => dialog.dismiss());

  await page.goto(PAGE);
  await configureBearer(page, 'https://cancelled-target.invalid/private', sentinel);
  await page.locator('#send-request').click();
  await expect(page.locator('#auth-token')).toHaveValue('');
  expect(targetRequests).toBe(0);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain(sentinel);
});

test('credentialed redirects do not follow to a different origin', async ({ page }) => {
  const sentinel = `AT_REDIRECT_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  let redirectedRequests = 0;
  await page.route('https://redirect-source.invalid/**', route => route.fulfill({
    status: 302,
    headers: { location: 'https://redirect-destination.invalid/receive' }
  }));
  await page.route('https://redirect-destination.invalid/**', async route => {
    redirectedRequests += 1;
    await route.abort();
  });
  page.on('dialog', dialog => dialog.accept());

  await page.goto(PAGE);
  await configureBearer(page, 'https://redirect-source.invalid/start', sentinel);
  await page.locator('#send-request').click();
  await expect(page.locator('#response-body')).toContainText('Redirect blocked');
  expect(redirectedRequests).toBe(0);
  await expect(page.locator('#auth-token')).toHaveValue('');
});

for (const blockedTarget of [
  'https://afrotools.com/api/receive',
  'https://metrics.invalid/analytics/collect',
  'https://telemetry.metrics.invalid/v1/receive'
]) {
  test(`credentials are blocked before network send to ${blockedTarget}`, async ({ page }) => {
    const sentinel = `AT_BLOCK_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    let targetRequests = 0;
    await page.route(`${new URL(blockedTarget).origin}/**`, async route => {
      targetRequests += 1;
      await route.abort();
    });

    await page.goto(PAGE);
    await configureBearer(page, blockedTarget, sentinel);
    await page.locator('#send-request').click();
    expect(targetRequests).toBe(0);
    await expect(page.locator('#auth-token')).toHaveValue('');
  });
}

test('private-network credential send has an extra explicit warning', async ({ page }) => {
  const sentinel = `AT_LOCAL_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  let confirmation = '';
  await page.route('http://127.0.0.1:9099/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '{"ok":true}'
  }));
  page.on('dialog', async dialog => {
    confirmation = dialog.message();
    await dialog.dismiss();
  });

  await page.goto(PAGE);
  await configureBearer(page, 'http://127.0.0.1:9099/private', sentinel);
  await page.locator('#send-request').click();
  expect(confirmation).toContain('localhost or private-network target');
  expect(confirmation).not.toContain(sentinel);
});

test('native French owner uses the same credential boundary without an iframe', async ({ page }) => {
  const sentinel = `AT_FR_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  let authorization = '';
  await page.route('https://fr-confirmed.invalid/**', async route => {
    authorization = route.request().headers().authorization || '';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"ok":true}'
    });
  });
  page.on('dialog', async dialog => {
    expect(dialog.message()).toContain('https://fr-confirmed.invalid:443/v1/test');
    expect(dialog.message()).not.toContain(sentinel);
    await dialog.accept();
  });

  await page.goto('/fr/tools/testeur-api/');
  await expect(page.locator('h1')).toContainText('API Testeur');
  await expect(page.locator('iframe')).toHaveCount(0);
  await configureBearer(page, 'https://fr-confirmed.invalid/v1/test', sentinel);
  await page.locator('#send-request').click();
  await expect(page.locator('#response-body')).toContainText('"ok": true');
  expect(authorization).toBe(`Bearer ${sentinel}`);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain(sentinel);
  await expect(page.locator('#auth-token')).toHaveValue('');
});
