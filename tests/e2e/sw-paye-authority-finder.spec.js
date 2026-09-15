const { test, expect } = require('@playwright/test');
const dataset = require('../../data/salary-tax/authority-router.json');
const map = require('../../assets/js/ai/swahili-route-map.generated.js');
const route = '/sw/zana/tafuta-mamlaka-ya-paye/';
for (const theme of ['light', 'dark']) {
  test(`Swahili result states pass serious accessibility and contrast checks in ${theme}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('#authority-form button')).toBeEnabled();
    await page.evaluate(theme => document.documentElement.setAttribute('data-theme', theme), theme);
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    await page.locator('#authority-query').fill('MRA');
    await page.locator('#authority-form button').click();
    for (const state of ['ambiguous', 'resolved']) {
      if (state === 'resolved') await page.locator('[data-authority-id="mra-malawi"]').click();
      const violations = await page.evaluate(async () => {
        const result = await window.axe.run(document.querySelector('#main-content'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
        return result.violations.filter(item => ['serious', 'critical'].includes(item.impact)).map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }));
      });
      expect(violations, `${theme} ${state}`).toEqual([]);
    }
  });
}
test('successful Swahili submit emits only metadata and never transmits the raw query', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push({ url: request.url(), method: request.method(), body: request.postData() }));
  await page.goto(route);
  await expect(page.locator('#authority-form button')).toBeEnabled();
  await page.evaluate(() => {
    window.__authorityEvents = [];
    window.AfroTools.analytics = { track: (name, payload) => window.__authorityEvents.push({ name, payload }) };
  });
  const query = 'MRA synthetic-private-9274';
  await page.locator('#authority-query').fill(query);
  await page.locator('#authority-form button').click();
  await expect(page.locator('#authority-status')).toContainText('nchi zaidi ya moja');
  await page.locator('[data-authority-id="mra-malawi"]').click();
  await expect(page.locator('#authority-status')).toContainText('Malawi');
  const state = await page.evaluate(() => ({ events: window.__authorityEvents, local: JSON.stringify(localStorage), session: JSON.stringify(sessionStorage), url: location.href }));
  expect(state.events.map(event => event.name)).toEqual(['paye_authority_ambiguous', 'paye_authority_resolved']);
  expect(state.events[0].payload).toEqual({ tool_id: 'paye-authority-finder', match_count: 2 });
  expect(JSON.stringify(state)).not.toContain(query);
  expect(JSON.stringify(state)).not.toContain('synthetic-private-9274');
  expect(JSON.stringify(requests)).not.toContain('synthetic-private-9274');
});
test('Swahili authority matching preserves exact countries, currencies and calculator handoffs', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route);
  await expect(page.getByRole('button', { name: 'Tafuta kikokotoo', exact: true })).toBeEnabled();
  for (const acronym of ['MRA', 'LRA']) {
    await page.locator('#authority-query').fill(acronym);
    await page.locator('#authority-form button').click();
    await expect(page.locator('#authority-status')).toContainText('nchi zaidi ya moja');
    await expect(page.locator('[data-authority-id]')).toHaveCount(2);
  }
  for (const item of dataset.authorities) {
    await page.locator('#authority-query').fill('');
    await page.locator('#authority-country').selectOption(item.country_code);
    await expect(page.locator('#authority-results')).toContainText(item.currency);
    await expect(page.locator('[data-open-calculator]')).toHaveAttribute('href', map.routes[item.calculator_url + '/']);
    await expect(page.getByRole('link', { name: 'Fungua tovuti rasmi ya mamlaka' })).toHaveAttribute('href', item.official_source_url);
  }
  await page.locator('#authority-country').selectOption('');
  await page.locator('#authority-query').fill('unsupported synthetic fixture');
  await page.locator('#authority-form button').click();
  await expect(page.locator('#authority-status')).toContainText('Hakuna mamlaka inayolingana');
  await expect(page.locator('[data-open-calculator]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
for (const width of [320, 375]) for (const theme of ['light', 'dark']) {
  test(`Swahili finder ${width}px ${theme} keyboard and doubled-font reflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    await page.evaluate(theme => {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.fontSize = '200%';
    }, theme);
    await page.locator('#authority-query').fill('MRA');
    await page.locator('#authority-query').press('Enter');
    await expect(page.locator('[data-authority-id="mra-malawi"]')).toBeVisible();
    await page.locator('[data-authority-id="mra-malawi"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#authority-status')).toContainText('Malawi');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
    await expect(page.locator('#authority-query')).toHaveAccessibleName('Kifupisho au jina la mamlaka');
  });
}
test('dataset failure retains localized static handoffs and makes no query transmission', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push({ url: request.url(), method: request.method(), body: request.postData() }));
  await page.route('**/data/salary-tax/authority-router.json', route => route.fulfill({ status: 503, body: '' }));
  await page.goto(route);
  await expect(page.locator('#authority-status')).toContainText('Data ya mamlaka haipatikani');
  await expect(page.locator('#authority-form button')).toBeDisabled();
  await expect(page.locator('.authority-list a')).toHaveCount(7);
  await page.locator('#authority-query').fill('private synthetic phrase');
  expect(JSON.stringify(requests)).not.toContain('private synthetic phrase');
});
test('English finder retains its existing matching result', async ({ page }) => {
  await page.goto('/tools/paye-authority-finder/');
  await expect(page.locator('#authority-country option')).toHaveCount(8);
  await page.locator('#authority-query').fill('MRA');
  await page.locator('#authority-form button').click();
  await expect(page.locator('#authority-status')).toContainText('more than one country');
  await page.locator('[data-authority-id="mra-malawi"]').click();
  await expect(page.locator('[data-open-calculator]')).toHaveAttribute('href', '/malawi/mw-paye');
});
