const { registerFamilyAcceptance } = require('./support/fr-agriculture-family-acceptance');
registerFamilyAcceptance({
  family: 'livestock-feed', expectedCountries: 15, calculateLabel: 'Formuler la ration',
  invalidLabel: 'Poids vif par animal (kg)', invalidMessage: 'au moins 1 kg',
  csvHeader: 'proteines_requises_g', storageKey: 'afrotools:fr-agriculture:livestock-feed',
  copyText: 'ration animale',
  assertRuntime(runtime, code, expect) {
    expect(runtime.result.currency).toBe(runtime.report.resultat.devise);
    expect(runtime.result.ration.length).toBeGreaterThan(0);
    expect(runtime.pageConfig.countryCode).toBe(code);
  },
});
