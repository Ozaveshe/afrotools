(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AfroAtlasResearch = factory();
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var purposes = {
    overview: { label: 'Country overview', questions: ['Which indicator years are recent enough for my question?', 'What explains the difference between total GDP and GDP per person?', 'Which national statistics should I check next?'] },
    market: { label: 'Market research', questions: ['Which cities and customer groups fit the product?', 'What are current local prices, licences and distribution costs?', 'How do power and connectivity conditions differ by location?'] },
    trade: { label: 'Trade research', questions: ['Which specific goods, partners and years appear in current trade statistics?', 'What tariffs, logistics costs and customs rules apply?', 'Do national accounts totals match the scope of the goods-only source I am using?'] },
    diaspora: { label: 'Diaspora planning', questions: ['What are current city-level housing and household costs?', 'What residence, banking and property rules apply to me?', 'Which local services and support networks do I need?'] },
    study: { label: 'Study notes', questions: ['What does each indicator measure, and what does it leave out?', 'Do comparisons use the same observation year?', 'Which additional source would test my explanation?'] }
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '').toLowerCase().trim();
  }

  function format(key, value, compact) {
    if (value == null || !Number.isFinite(value)) return 'N/A';
    if (['growth', 'electricity', 'internet'].indexOf(key) !== -1) return value.toLocaleString('en-US', { maximumFractionDigits: 1 }) + '%';
    if (key === 'lifeExp') return value.toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' years';
    var currency = key !== 'population';
    var options = { maximumFractionDigits: key === 'gdpPC' ? 0 : 1 };
    if (compact && key !== 'gdpPC') { options.notation = 'compact'; options.maximumFractionDigits = 1; }
    return (currency ? '$' : '') + value.toLocaleString('en-US', options);
  }

  function create(snapshot, atlas, identities) {
    var identityByCode = {};
    (identities || []).forEach(function (country) { identityByCode[country.id] = country; });
    var countries = {};
    [atlas.COUNTRIES, atlas.WORLD_REF].forEach(function (registry) {
      Object.keys(registry || {}).forEach(function (code) {
        var raw = registry[code];
        var identity = identityByCode[code];
        countries[code] = { code: code, name: raw.name, slug: raw.slug || '', capital: raw.capital || '',
          currency: raw.currency || '', region: identity ? identity.region : 'World reference',
          resources: raw.resources || [], exports: raw.exports || [], imports: raw.imports || [],
          tools: raw.tools || [], african: !!atlas.COUNTRIES[code], indicators: snapshot.countries[code] || {} };
      });
    });

    function point(code, key, year) {
      var record = countries[code] && countries[code].indicators[key];
      if (!record) return null;
      var selected = year == null ? record.year : Number(year);
      var value = record.series[selected];
      return Number.isFinite(value) ? { value: value, year: selected, source_url: record.source_url } : null;
    }

    function comparison(a, b, key, mode) {
      var left = point(a, key);
      var right = point(b, key);
      if (mode !== 'latest' && left && right) {
        var first = countries[a].indicators[key].series;
        var second = countries[b].indicators[key].series;
        var years = Object.keys(first).filter(function (year) { return Number.isFinite(second[year]); }).map(Number).sort(function (x, y) { return y - x; });
        if (!years.length) return { a: left, b: right, comparable: false, note: 'No shared observation year' };
        left = point(a, key, years[0]); right = point(b, key, years[0]);
      }
      var comparable = !!(left && right && left.year === right.year);
      return { a: left, b: right, comparable: comparable,
        note: !left || !right ? 'Missing observation' : comparable ? 'Same year: ' + left.year : 'Different years; compare with care' };
    }

    function resolve(query, africanOnly) {
      var q = normalize(query);
      var aliases = { 'cabo verde': 'CV', 'ivory coast': 'CI', 'cote d ivoire': 'CI', 'drc': 'CD', 'democratic republic of the congo': 'CD', 'central african republic': 'CF', 'sao tome and principe': 'ST' };
      if (aliases[q]) return aliases[q];
      return Object.keys(countries).find(function (code) {
        var country = countries[code];
        return (!africanOnly || country.african) && [normalize(code), normalize(country.name), normalize(country.slug).replace(/-/g, ' ')].indexOf(q) !== -1;
      }) || '';
    }

    function compareQuery(query) {
      var parts = String(query || '').split(/\s+v(?:s\.?|\.)?\s+/i);
      if (parts.length !== 2) return null;
      var a = resolve(parts[0]); var b = resolve(parts[1]);
      return a && b && a !== b ? { a: a, b: b } : null;
    }

    function discover(filters) {
      var options = filters || {};
      var q = normalize(options.query);
      var pair = compareQuery(options.query);
      var result = Object.values(countries).filter(function (country) {
        if (!country.african) return false;
        if (pair) return country.code === pair.a || country.code === pair.b;
        if (options.region && options.region !== 'all' && country.region !== options.region) return false;
        if (options.resource && !country.resources.some(function (item) { return item.type === options.resource; })) return false;
        if (!q) return true;
        var terms = [country.code, country.name, country.slug.replace(/-/g, ' '), country.capital];
        country.resources.forEach(function (item) { terms.push(atlas.RESOURCE_TYPES[item.type] && atlas.RESOURCE_TYPES[item.type].label || item.type); });
        if (resolve(q, true) === country.code) return true;
        return normalize(terms.join(' ')).indexOf(q) !== -1;
      });
      var metric = snapshot.definitions[options.sort] ? options.sort : null;
      result.sort(function (a, b) {
        if (!metric) return a.name.localeCompare(b.name);
        var pa = point(a.code, metric, options.year);
        var pb = point(b.code, metric, options.year);
        if (!pa && !pb) return a.name.localeCompare(b.name);
        if (!pa) return 1; if (!pb) return -1;
        return pb.value - pa.value || a.name.localeCompare(b.name);
      });
      return result;
    }

    function shortlist(value) {
      return (Array.isArray(value) ? value : []).filter(function (code, index, array) {
        return typeof code === 'string' && countries[code] && countries[code].african && array.indexOf(code) === index;
      }).slice(0, 4);
    }

    function brief(code, purpose) {
      var country = countries[code];
      if (!country) return '';
      var lens = purposes[purpose] || purposes.overview;
      var lines = [country.name + ' research brief', 'Purpose: ' + lens.label, 'Profile: https://afrotools.com/tools/afroatlas/country/' + country.slug + '/',
        'Snapshot retrieved: ' + snapshot.retrieved_at, 'Source: World Bank World Development Indicators', ''];
      Object.keys(snapshot.definitions).forEach(function (key) {
        var p = point(code, key);
        var definition = snapshot.definitions[key];
        lines.push(definition.label + ': ' + (p ? format(key, p.value, true) + ' (' + p.year + '; ' + definition.unit + ')\n' + p.source_url : 'N/A: no observation in ' + snapshot.first_year + '–' + snapshot.last_year));
      });
      lines.push('', 'Questions to investigate:');
      lens.questions.forEach(function (question) { lines.push('- ' + question); });
      lines.push('', 'Reading limits: nominal US-dollar GDP is not a measure of household income or purchasing power. Observation years vary; missing values are not zero. Resource and product lists are undated reference material, not current production rankings. National averages do not describe city conditions.', 'Methodology: https://afrotools.com/tools/afroatlas/sources/');
      return lines.join('\n');
    }

    function csv(codes, year) {
      var rows = [['country_code', 'country', 'indicator', 'value', 'unit', 'observation_year', 'source_url', 'retrieved_at']];
      (codes || []).forEach(function (code) {
        if (!countries[code]) return;
        Object.keys(snapshot.definitions).forEach(function (key) {
          var p = point(code, key, year); var definition = snapshot.definitions[key];
          rows.push([code, countries[code].name, definition.label, p ? p.value : '', definition.unit, p ? p.year : '',
            'https://data.worldbank.org/indicator/' + definition.indicator + '?locations=' + code, snapshot.retrieved_at]);
        });
      });
      return rows.map(function (row) {
        return row.map(function (cell) {
          if (typeof cell === 'number') return String(cell);
          var text = String(cell == null ? '' : cell);
          if (/^[=+\-@]/.test(text)) text = "'" + text;
          return '"' + text.replace(/"/g, '""') + '"';
        }).join(',');
      }).join('\r\n');
    }

    return { snapshot: snapshot, countries: countries, point: point, comparison: comparison, discover: discover,
      resolve: resolve, compareQuery: compareQuery, shortlist: shortlist, brief: brief, csv: csv };
  }

  return { create: create, escapeHtml: escapeHtml, normalize: normalize, format: format, purposes: purposes };
}));
