const { registerFamilyAcceptance } = require('./support/fr-agriculture-family-acceptance');

registerFamilyAcceptance({
  family: 'input-prices',
  expectedCountries: 15,
  calculateLabel: 'Comparer les prix',
  invalidLabel: 'Surface de l’exploitation (ha)',
  invalidMessage: 'supérieure à zéro',
  csvHeader: 'sous_total_engrais',
  storageKey: 'afrotools:fr-agriculture:input-prices',
  copyText: 'prix des intrants agricoles',
  assertRuntime(runtime, code, expect) {
    expect(runtime.result.countryCode).toBe(code);
    expect(runtime.result.budget.total).toBeGreaterThan(0);
    expect(runtime.report.resultat.budget.total).toBe(runtime.result.budget.total);
    expect(runtime.report.sources.donneesEnDirect).toBe(false);
    expect(runtime.pageConfig.countryCode).toBe(code);
  },
});
