const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
test.use({ trace: 'off', video: 'off', screenshot: 'off' });
for (const route of ['/tools/job-offer-evaluator/', '/fr/tools/evaluateur-offre-emploi/', '/sw/zana/tathmini-ya-ofa-ya-kazi/']) {
  test(`${route} protects CSV text while preserving numeric negatives and JSON labels`, async ({ page }) => {
    await page.goto(route);
    const offers = page.locator('[data-offer]');
    await offers.nth(0).locator('[name=monthlyCosts]').fill('100');
    for (const [unit, first, second] of [
      ['=1+1', '+SUM(1,1)', '-1+1'],
      ['@SUM(1)', '\t=1+1', '  +1+1']
    ]) {
      await page.locator('[name=currency]').fill(unit);
      await offers.nth(0).locator('[name=label]').fill(first);
      await offers.nth(1).locator('[name=label]').fill(second);
      await page.locator('#joe-calc').click();
      await expect(page.locator('#joe-results')).toHaveClass(/on/);
      let pending = page.waitForEvent('download');
      await page.locator('#joe-csv').click();
      const csv = fs.readFileSync(await (await pending).path(), 'utf8');
      for (const text of [unit, first, second]) expect(csv).toContain('"\'' + text.replace(/"/g, '""') + '"');
      expect(csv).toContain(',-1200,');
      pending = page.waitForEvent('download');
      await page.locator('#joe-json').click();
      const json = JSON.parse(fs.readFileSync(await (await pending).path(), 'utf8'));
      expect(json.result.offers[0].label).toBe(first);
      expect(json.result.offers[1].label).toBe(second);
      expect(json.result.offers[0].annualValue).toBe(-1200);
    }
  });
}

test('the shared French exporter still serves unrelated workflows', async ({ page }) => {
  await page.goto('/tools/job-offer-evaluator/');
  await page.setContent('<main><h1>Calcul synthétique</h1><label>Montant<input value="100"></label><label>Référence<input id="reference" value="Exemple"></label><output id="result" aria-label="Résultat">En attente</output></main><script type="application/json" id="afrotools-fr-finance-export-contract">{"englishId":"synthetic-unrelated-workflow","englishRoute":"/synthetic/","formats":["json","csv"]}</script>');
  await page.addScriptTag({ url: '/assets/js/pages/french-finance-export-contract.js' });
  await page.locator('#result').evaluate(node => { node.textContent = '-500'; });
  await expect(page.locator('[data-fr-finance-export-format=json]')).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.locator('[data-fr-finance-export-format=json]').click();
  const data = JSON.parse(fs.readFileSync(await (await pending).path(), 'utf8'));
  expect(JSON.stringify(data)).toContain('500');
  expect(JSON.stringify(data)).toContain('100');
  for (const reference of ['=1+1', '+SUM(1,1)', '-1+1', '@SUM(1)']) {
    await page.locator('#reference').fill(reference);
    const csvPending = page.waitForEvent('download');
    await page.locator('[data-fr-finance-export-format=csv]').click();
    const csv = fs.readFileSync(await (await csvPending).path(), 'utf8');
    expect(csv).toContain('"\'' + reference + '"');
    expect(csv).toContain('"-500"');
  }
});
