(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.PayeAuthorityRouterEngine = api; }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function normalize(value) { return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function validateDataset(payload) {
    var errors = []; var ids = Object.create(null);
    if (!payload || Number(payload.schema_version) !== 1) errors.push('schema_version must be 1.');
    if (!payload || !Array.isArray(payload.authorities) || !payload.authorities.length) errors.push('authorities must be non-empty.');
    (payload && payload.authorities || []).forEach(function (item, index) {
      var prefix = 'authorities[' + index + ']';
      ['id','acronym','authority_name','country_code','country_name','currency','tax_year','calculator_name','calculator_url','official_source_url','confidence'].forEach(function (field) { if (!item[field]) errors.push(prefix + '.' + field + ' is required.'); });
      if (ids[item.id]) errors.push('Duplicate authority id: ' + item.id + '.');
      ids[item.id] = true;
      if (item.calculator_url && !/^\/[a-z0-9/-]+$/.test(item.calculator_url)) errors.push(prefix + '.calculator_url must be an internal canonical path.');
    });
    return { valid: errors.length === 0, errors: errors };
  }
  function matchAuthorities(authorities, query) {
    var needle = normalize(query);
    if (!needle) return [];
    return (authorities || []).filter(function (item) {
      var values = [item.acronym, item.authority_name, item.country_name].concat(item.aliases || []).map(normalize);
      return values.some(function (value) { return value === needle || value.indexOf(needle) !== -1 || needle.indexOf(value) !== -1; });
    });
  }
  function resolve(authorities, input) {
    var queryMatches = matchAuthorities(authorities, input && input.query);
    var countryCode = String(input && input.countryCode || '').toUpperCase();
    var candidates = countryCode ? (authorities || []).filter(function (item) { return item.country_code === countryCode; }) : queryMatches;
    if (countryCode && input && input.query) candidates = candidates.filter(function (item) { return queryMatches.some(function (match) { return match.id === item.id; }); });
    if (!candidates.length) return { status: 'unsupported', matches: [] };
    if (candidates.length > 1) return { status: 'ambiguous', matches: candidates };
    return { status: 'resolved', match: candidates[0], matches: candidates };
  }
  return { normalize: normalize, validateDataset: validateDataset, matchAuthorities: matchAuthorities, resolve: resolve };
}));
