(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.ExportDocsDirectoryEngine = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function cloneCountry(country) {
    return {
      code: String(country.code || ''),
      name: String(country.name || ''),
      slug: String(country.slug || ''),
      region: String(country.region || ''),
      flag: String(country.flag || ''),
      topCrops: Array.isArray(country.topCrops) ? country.topCrops.slice() : [],
    };
  }

  function normalize(value) {
    return String(value == null ? '' : value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function buildDirectory(countries, regionLabels, regionOrder) {
    if (!Array.isArray(countries)) return { ok: false, status: 'invalid-countries', rows: [], groups: [] };
    var labels = regionLabels && typeof regionLabels === 'object' ? regionLabels : {};
    var order = Array.isArray(regionOrder) ? regionOrder.slice() : Object.keys(labels);
    var rows = countries.map(cloneCountry);
    var codes = new Set();
    var slugs = new Set();
    for (var index = 0; index < rows.length; index += 1) {
      var row = rows[index];
      if (!row.code || !row.name || !row.slug || !row.region || !labels[row.region]) {
        return { ok: false, status: 'invalid-country', invalidIndex: index, rows: [], groups: [] };
      }
      if (codes.has(row.code) || slugs.has(row.slug)) {
        return { ok: false, status: 'duplicate-country', invalidIndex: index, rows: [], groups: [] };
      }
      codes.add(row.code);
      slugs.add(row.slug);
    }
    var unknownRegions = rows.map(function (row) { return row.region; }).filter(function (region) {
      return order.indexOf(region) === -1;
    });
    if (unknownRegions.length) return { ok: false, status: 'unknown-region', rows: [], groups: [] };
    var groups = order.map(function (key) {
      var groupRows = rows.filter(function (row) { return row.region === key; });
      return {
        key: key,
        name: String(labels[key].name || key),
        declaredCount: Number(labels[key].count),
        count: groupRows.length,
        rows: groupRows,
      };
    }).filter(function (group) { return group.count > 0; });
    return { ok: true, status: 'ready', count: rows.length, rows: rows, groups: groups };
  }

  function search(directory, query) {
    if (!directory || !directory.ok) return { ok: false, status: 'invalid-directory', count: 0, rows: [] };
    var needle = normalize(query);
    var rows = needle ? directory.rows.filter(function (row) {
      return normalize([row.code, row.name, row.slug, row.region].concat(row.topCrops).join(' ')).includes(needle);
    }) : directory.rows.slice();
    return { ok: true, status: rows.length ? 'matches' : 'empty', query: String(query || ''), count: rows.length, rows: rows };
  }

  function select(directory, code) {
    if (!directory || !directory.ok) return { ok: false, status: 'invalid-directory', country: null };
    var country = directory.rows.find(function (row) { return row.code === code; }) || null;
    return country
      ? { ok: true, status: 'selected', country: cloneCountry(country) }
      : { ok: false, status: 'unknown-country', country: null };
  }

  return Object.freeze({
    buildDirectory: buildDirectory,
    search: search,
    select: select,
  });
}));
