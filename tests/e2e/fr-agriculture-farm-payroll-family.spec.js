const { registerFamilyAcceptance } = require('./support/fr-agriculture-family-acceptance');

registerFamilyAcceptance({
  family: 'farm-payroll',
  expectedCountries: 54,
  calculateLabel: 'Calculer la paie',
  invalidLabel: 'Nombre de travailleurs',
  invalidValue: '0',
  invalidMessage: 'au moins un travailleur',
  csvHeader: 'brut_soumis',
  storageKey: 'afrotools:fr-agriculture:farm-payroll',
  copyText: 'paie agricole',
  assertRuntime(runtime, code, expect) {
    expect(runtime.result.currency).toBe(runtime.report.resultat.devise);
    expect(runtime.result.farmMonthlyCost).toBeGreaterThan(0);
    expect(runtime.report.resultat.coutMensuelExploitation).toBe(runtime.result.farmMonthlyCost);
    expect(runtime.report.sources.donneesEnDirect).toBe(false);
    expect(runtime.pageConfig.countryCode).toBe(code);
  },
});
