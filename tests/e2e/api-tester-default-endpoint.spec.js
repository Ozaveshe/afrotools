const { test, expect } = require('@playwright/test');
const { handler: statusHandler } = require('../../netlify/functions/api-status');

const routes = [
  { path: '/tools/api-tester/', language: 'en', send: 'Send', urlLabel: 'Request URL', statusLabel: 'Status', passStatus: 'PASS Status is 200', passContains: 'PASS Response contains "', passPath: 'PASS JSON path exists: $.status' },
  { path: '/fr/tools/testeur-api/', language: 'fr', send: 'Envoyer', urlLabel: 'URL de la requête', statusLabel: 'Statut', passStatus: 'RÉUSSI Le statut est 200', passContains: 'RÉUSSI La réponse contient "', passPath: 'RÉUSSI Le chemin JSON existe : $.status' }
];

for (const routeCase of routes) for (const width of [1365, 390, 320]) {
  test('default API sample matches the actual status handler: ' + routeCase.language + ' ' + width + 'px', async ({ page, baseURL }) => {
    const requested = [];
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 844 });
    await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin && ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) ? route.continue() : route.abort());

    // Execute the repository's public status handler so a hardcoded fixture
    // cannot hide drift between the first sample and the real API contract.
    const statusResponse = await statusHandler({ httpMethod: 'GET', headers: { origin: baseURL } }, {});
    expect(statusResponse.statusCode).toBe(200);
    const statusPayload = JSON.parse(statusResponse.body);
    await page.route('**/api/status', async route => {
      requested.push(new URL(route.request().url()).pathname);
      await route.fulfill({ status: statusResponse.statusCode, headers: statusResponse.headers, body: statusResponse.body });
    });

    await page.goto(routeCase.path, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', routeCase.language);
    if (routeCase.language === 'fr') {
      const schemaLanguages = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes
        .map(node => JSON.parse(node.textContent))
        .filter(schema => schema['@type'] === 'SoftwareApplication')
        .map(schema => schema.inLanguage));
      expect(schemaLanguages.length).toBeGreaterThan(0);
      expect(schemaLanguages.every(language => language === 'fr')).toBe(true);
      await expect(page.locator('.crumb a').nth(0)).toHaveAttribute('href', '/fr/');
      await expect(page.locator('.crumb a').nth(1)).toHaveAttribute('href', '/fr/developer-tools/');
    }
    const expectedStatusUrl = new URL('/api/status', page.url()).href;
    await expect(page.getByRole('textbox', { name: routeCase.urlLabel, exact: true })).toHaveValue(expectedStatusUrl);
    expect(await page.locator('#url').evaluate(input => input.validity.valid)).toBe(true);
    await expect(page.locator('#test-contains')).toHaveValue(statusPayload.status);
    await expect(page.locator('#test-jsonpath')).toHaveValue('$.status');

    const send = page.getByRole('button', { name: routeCase.send, exact: true });
    await send.focus();
    await send.press('Enter');

    await expect(page.locator('#response-meta')).toContainText(routeCase.statusLabel + ' 200');
    await expect(page.locator('#response-body')).toContainText('"status": "' + statusPayload.status + '"');
    await expect(page.locator('#test-results')).toContainText(routeCase.passStatus);
    await expect(page.locator('#test-results')).toContainText(routeCase.passContains + statusPayload.status + '"');
    await expect(page.locator('#test-results')).toContainText(routeCase.passPath);
    expect(requested).toEqual(['/api/status']);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
  });
}
