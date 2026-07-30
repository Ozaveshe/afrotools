const { registerFamilyAcceptance } = require('./support/fr-agriculture-family-acceptance');

registerFamilyAcceptance({
  family: 'farm-loans',
  expectedCountries: 15,
  calculateLabel: 'Vérifier mon éligibilité',
  invalidLabel: 'Âge',
  invalidValue: '0',
  invalidMessage: 'au moins 16 ans',
  csvHeader: 'programme_id',
  storageKey: 'afrotools:fr-agriculture:farm-loans',
  copyText: 'éligibilité aux prêts agricoles',
  assertRuntime(runtime, code, expect) {
    expect(runtime.result.countryCode).toBe(code);
    expect(runtime.result.totalPrograms).toBeGreaterThan(0);
    expect(runtime.report.resultat).toHaveLength(runtime.result.totalPrograms);
    expect(runtime.report.sources.donneesEnDirect).toBe(false);
    expect(runtime.pageConfig.countryCode).toBe(code);
  },
});
