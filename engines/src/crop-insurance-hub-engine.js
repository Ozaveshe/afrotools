(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.CropInsuranceHubEngine = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function calculate(values) {
    var premium = values.farmValue * values.premiumRate / 100;
    var retained = values.farmValue * values.excess / 100;
    return {
      ok: true,
      status: 'calculated',
      input: {
        currency: values.currency,
        farmValue: values.farmValue,
        premiumRate: values.premiumRate,
        excess: values.excess,
      },
      premium: premium,
      retainedExcess: retained,
    };
  }

  function money(currency, amount, locale) {
    return currency + ' ' + amount.toLocaleString(locale, { maximumFractionDigits: 2 });
  }

  function formatEnglish(result) {
    return 'Estimate: premium ' + money(result.input.currency, result.premium)
      + '; policyholder excess at the entered rate ' + money(result.input.currency, result.retainedExcess)
      + '. Confirm covered perils, trigger, insured value, exclusions, waiting period and claim evidence with the insurer.';
  }

  function buildCountryDirectory(data, covered, metadata, regionOrder, regionLabels) {
    if (!data || !data.countries || !Array.isArray(covered)) return { ok: false, status: 'invalid-data', rows: [], groups: [] };
    var rows = [];
    var seen = new Set();
    for (var index = 0; index < covered.length; index += 1) {
      var code = covered[index];
      var country = data.countries[code];
      var meta = metadata && metadata[code];
      if (!country || !meta || seen.has(code)) return { ok: false, status: seen.has(code) ? 'duplicate-country' : 'unknown-country', invalidCode: code, rows: [], groups: [] };
      seen.add(code);
      rows.push({
        code: code,
        name: country.name,
        currency: country.currency,
        symbol: country.symbol,
        flag: meta.flag,
        slug: meta.slug,
        region: meta.region,
        cropCount: Array.isArray(country.crops) ? country.crops.length : 0,
        livestockCount: Array.isArray(country.livestock) ? country.livestock.length : 0,
        programCount: Array.isArray(country.programs) ? country.programs.length : 0,
      });
    }
    var groups = regionOrder.map(function (key) {
      var groupRows = rows.filter(function (row) { return row.region === key; });
      return { key: key, name: regionLabels[key], count: groupRows.length, rows: groupRows };
    }).filter(function (group) { return group.count > 0; });
    var displayRows = groups.reduce(function (all, group) { return all.concat(group.rows); }, []);
    return { ok: true, status: 'ready', count: displayRows.length, rows: displayRows, groups: groups };
  }

  function selectCountry(directory, code) {
    if (!directory || !directory.ok) return { ok: false, status: 'invalid-directory', country: null };
    var country = directory.rows.find(function (row) { return row.code === code; }) || null;
    return country ? { ok: true, status: 'selected', country: Object.assign({}, country) } : { ok: false, status: 'unknown-country', country: null };
  }

  return Object.freeze({
    calculate: calculate,
    money: money,
    formatEnglish: formatEnglish,
    buildCountryDirectory: buildCountryDirectory,
    selectCountry: selectCountry,
  });
}));
