const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdf = require('pdf-parse');
test.use({ trace: 'off', video: 'off', screenshot: 'off' });
const locales = [
  ['en', '/tools/business-plan-builder/', 'Value', 'Formulas', 'monthly revenue - monthly variable costs'],
  ['fr', '/fr/tools/generateur-business-plan/', 'Valeur', 'Formules', 'revenu mensuel - coûts variables mensuels'],
  ['sw', '/sw/zana/mjenzi-mpango-wa-biashara/', 'Thamani', 'Kanuni za hesabu', 'mapato ya mwezi - gharama zinazobadilika za mwezi']
];
for (const [locale, route, valueLabel, formulaHeading, formula] of locales) {
  test(`${locale} exports localized financial labels and calculation explanations`, async ({ page }, info) => {
    await page.goto(route);
    await page.locator('[name=name]').fill('=Synthetic Foods');
    for (const name of ['monthlyRevenue', 'monthlyVariableCosts', 'monthlyFixedCosts', 'startupNeed', 'workingCapitalNeed', 'confirmedFunding']) {
      await page.locator(`[name=${name}]`).fill('100');
    }
    await page.locator('.bpd-build').click();
    const contents = {};
    for (const kind of ['csv', 'pdf', 'json']) {
      const pending = page.waitForEvent('download');
      await page.locator(`[data-action=${kind}]`).click();
      const download = await pending;
      const output = info.outputPath(`synthetic-plan.${kind}`);
      await download.saveAs(output);
      const bytes = fs.readFileSync(output);
      contents[kind] = kind === 'pdf' ? (await pdf(bytes)).text : bytes.toString('utf8');
    }
    // JSON identifiers and existing calculation descriptions remain portable.
    const payload = JSON.parse(contents.json);
    expect(payload.formulas.grossContribution).toBe('monthly revenue - monthly variable costs');
    expect(payload.financialOutputs.operatingProfit).toBe(-100);
    expect(contents.csv).toContain("'=Synthetic Foods");
    expect(contents.csv.split('\n')[0]).toContain(valueLabel);
    expect(contents.pdf).toContain(formulaHeading);
    expect(contents.pdf).toContain(formula);
    if (locale !== 'en') {
      expect(contents.csv).not.toContain('"Operating profit"');
      expect(contents.pdf).not.toContain('monthly fixed costs / contribution ratio');
    }
  });
}
