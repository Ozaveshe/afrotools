const { registerFamilyAcceptance } = require('./support/fr-agriculture-family-acceptance');

registerFamilyAcceptance({
  family: 'greenhouse',
  expectedCountries: 15,
  calculateLabel: 'Calculer le coût et le ROI',
  invalidLabel: 'Surface (m²)',
  invalidMessage: 'au moins 10 m²',
  csvHeader: 'cout_installation',
  storageKey: 'afrotools:fr-agriculture:greenhouse',
  copyText: 'coût et rentabilité d’une serre',
  assertRuntime(runtime, code, expect) {
    expect(runtime.result.country.currency).toBe(runtime.report.resultat.devise);
    expect(runtime.result.revenue.yieldKg).toBeGreaterThan(0);
    expect(runtime.pageConfig.countryCode).toBe(code);
  },
});
