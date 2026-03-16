// Engine Registry — maps ISO country codes to PAYE calculation engines
const engines = {};

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
    engines[engine.country] = engine;
  } catch (err) {
    console.error(`[engines] Failed to load ${file}: ${err.message}`);
  }
}

module.exports = {
  get(code) { return engines[(code || '').toUpperCase()] || null; },
  listCountries() {
    return Object.values(engines).map(e => ({
      code: e.country, name: e.countryName, currency: e.currency,
      regimes: e.regimes, lastUpdated: e.lastUpdated
    }));
  },
  listCountryCodes() { return Object.keys(engines).sort(); },
  count() { return Object.keys(engines).length; }
};
