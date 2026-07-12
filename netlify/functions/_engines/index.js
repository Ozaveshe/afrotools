// Engine Registry — maps ISO country codes to PAYE calculation engines
const engines = {};
const formulasByCountry = {};

try {
  // Keep this a static require so Netlify's function bundler includes the
  // registry in the deployed artifact instead of relying on the repo layout.
  const registry = require('../../../data/calculation-quality/formula-registry.json');
  for (const formula of registry.formulas || []) {
    if (formula.formulaFamily !== 'paye-server' || formula.jurisdictions.length !== 1) continue;
    formulasByCountry[formula.jurisdictions[0]] = formula;
  }
} catch (error) {
  console.error('[engines] Formula registry unavailable: ' + error.message);
}

const engineFiles = [
  'ng-paye', 'ke-paye', 'za-paye', 'gh-paye', 'eg-paye', 'tz-paye',
  'rw-paye', 'ug-paye', 'et-paye', 'ma-paye', 'dz-paye', 'tn-paye',
  'cm-paye', 'sn-paye', 'ci-paye', 'ao-paye', 'cd-paye', 'zm-paye',
  'zw-paye', 'bw-paye', 'na-paye', 'mz-paye', 'mw-paye', 'mu-paye',
  'mg-paye', 'dj-paye', 'sc-paye', 'sz-paye', 'ls-paye', 'cv-paye',
  'lr-paye', 'sl-paye', 'gm-paye', 'mr-paye', 'bj-paye', 'bf-paye',
  'ml-paye', 'ne-paye', 'tg-paye', 'gn-paye', 'td-paye', 'ga-paye',
  'cg-paye', 'gq-paye', 'cf-paye', 'st-paye', 'sd-paye', 'ss-paye',
  'bi-paye', 'km-paye', 'so-paye', 'er-paye', 'ly-paye'
];

for (const file of engineFiles) {
  try {
    const engine = require(`./${file}`);
    const formula = formulasByCountry[engine.country] || null;
    if (formula) {
      const calculate = engine.calculate.bind(engine);
      engine.formulaMetadata = {
        formulaId: formula.id,
        formulaVersion: formula.formulaVersion,
        effectiveFrom: formula.effectiveFrom,
        effectiveTo: formula.effectiveTo,
        effectiveDateStatus: formula.effectiveDateStatus,
        sourceReferences: formula.sources
      };
      engine.calculate = function calculateWithTrace(params) {
        const result = calculate(params);
        result.meta = Object.assign({}, result.meta || {}, engine.formulaMetadata);
        return result;
      };
    }
    engines[engine.country] = engine;
  } catch (err) {
    console.error(`[engines] Failed to load ${file}: ${err.message}`);
  }
}

module.exports = {
  get(code) { return engines[(code || '').toUpperCase()] || null; },
  getFormula(code) {
    const engine = engines[(code || '').toUpperCase()] || null;
    return engine && engine.formulaMetadata ? engine.formulaMetadata : null;
  },
  resolve(code, effectiveOn) {
    const upper = String(code || '').toUpperCase();
    const engine = engines[upper] || null;
    if (!engine) return { ok: false, error: 'UNSUPPORTED_JURISDICTION', jurisdiction: upper, effectiveOn: effectiveOn || null };
    const formula = engine.formulaMetadata;
    if (!formula) return { ok: false, error: 'FORMULA_METADATA_UNAVAILABLE', jurisdiction: upper, effectiveOn: effectiveOn || null };
    if (effectiveOn) {
      const supported = formula.effectiveDateStatus === 'not-applicable' || (
        formula.effectiveDateStatus === 'declared' &&
        effectiveOn >= formula.effectiveFrom &&
        (!formula.effectiveTo || effectiveOn <= formula.effectiveTo)
      );
      if (!supported) return { ok: false, error: 'UNSUPPORTED_DATE', jurisdiction: upper, effectiveOn };
    }
    return { ok: true, engine, formula };
  },
  listCountries() {
    return Object.values(engines).map(e => ({
      code: e.country, name: e.countryName, currency: e.currency,
      regimes: e.regimes, lastUpdated: e.lastUpdated,
      formulaId: e.formulaMetadata ? e.formulaMetadata.formulaId : null,
      formulaVersion: e.formulaMetadata ? e.formulaMetadata.formulaVersion : null
    }));
  },
  listCountryCodes() { return Object.keys(engines).sort(); },
  count() { return Object.keys(engines).length; }
};
