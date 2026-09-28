'use strict';

const api = require('../../assets/js/lib/afroatlas-research');
const esc = api.escapeHtml;
const base = '/tools/afroatlas/';

function flag(code, name, className) {
  return '<span class="aa-twemoji-flag ' + (className || '') + '" role="img" aria-label="' + esc(name) + ' flag">'
    + '<span class="aa-flag-code" aria-hidden="true">' + code + '</span>'
    + '<img src="/assets/img/flags/afroatlas/' + code.toLowerCase() + '.svg" alt="" aria-hidden="true" width="40" height="30" loading="lazy" decoding="async"></span>';
}

function metric(model, code, key, className) {
  const point = model.point(code, key);
  const definition = model.snapshot.definitions[key];
  return '<div class="' + (className || '') + '"><dt>' + esc(definition.label) + '</dt><dd>'
    + (point ? esc(api.format(key, point.value, true)) : 'N/A') + '<small>'
    + (point ? '<a href="' + point.source_url + '">World Bank WDI, ' + point.year + '</a>' : 'World Bank WDI: no 2016–2025 observation')
    + '</small></dd></div>';
}

function countryContent(model, code, faq, resourceTypes) {
  const country = model.countries[code];
  const name = esc(country.name);
  const gdp = model.point(code, 'gdp');
  const population = model.point(code, 'population');
  const peers = model.discover({ region: country.region, sort: 'population' }).filter(row => row.code !== code).slice(0, 3);
  const firstPeer = peers[0] || model.countries[code === 'NG' ? 'KE' : 'NG'];
  const sourceSummary = ['gdp', 'population', 'gdpPC'].map(key => {
    const point = model.point(code, key);
    const label = key === 'population' ? 'population' : key === 'gdpPC' ? 'GDP/person' : 'GDP';
    return point ? '<a href="' + point.source_url + '">' + label + ' ' + point.year + '</a>' : label + ' unavailable (2016–2025)';
  }).join(' · ');
  const core = Object.keys(model.snapshot.definitions).map(key => metric(model, code, key)).join('');
  const summary = (gdp ? country.name + "'s latest GDP observation is " + api.format('gdp', gdp.value, true) + ' (' + gdp.year + '). ' : country.name + ' has no GDP observation in this snapshot. ')
    + (population ? 'Its population observation is ' + api.format('population', population.value, true) + ' (' + population.year + '). ' : '')
    + 'Read the dated indicators below, compare a second country, or take a cited brief into your research.';
  const years = Array.from({ length: model.snapshot.last_year - model.snapshot.first_year + 1 }, (_, i) => model.snapshot.last_year - i);
  const history = years.map(year => '<tr><th scope="row">' + year + '</th>' + ['gdp', 'population', 'growth'].map(key => {
    const point = model.point(code, key, year);
    return '<td>' + (point ? esc(api.format(key, point.value, true)) : 'N/A') + '</td>';
  }).join('') + '</tr>').join('');
  const resources = [...new Set(country.resources.map(row => resourceTypes[row.type] ? resourceTypes[row.type].label : row.type))];
  const products = (rows) => rows.length ? '<ul>' + rows.slice(0, 5).map(row => '<li>' + esc(row.p) + '</li>').join('') + '</ul>' : '<p>No product reference rows.</p>';
  const tools = (country.tools || []).map(tool => '<li><a href="' + esc(tool.p) + '">' + esc(tool.n) + '</a></li>').join('');
  const peerLinks = peers.map(peer => '<li><a href="' + base + 'country/' + peer.slug + '/">' + esc(peer.name) + ' economy profile</a> · <a href="' + base + 'compare?a=' + code + '&amp;b=' + peer.code + '">Compare ' + name + ' with ' + esc(peer.name) + '</a></li>').join('');
  return '<section class="aa-country-hero"><div class="aa-wrap">'
    + '<div class="aa-hero-flag">' + flag(code, country.name) + '</div><p class="aa-eyebrow">' + esc(country.region) + ' country profile</p>'
    + '<h1>' + name + ' economy and natural resources</h1><p class="aa-hero-meta">Capital: ' + esc(country.capital || 'Not recorded')
    + ' · Currency: ' + esc(country.currency.name || country.currency || 'Not recorded') + '</p><p class="aa-profile-intro">' + esc(summary) + '</p>'
    + '<dl class="aa-stats-row aa-core-snapshot">' + ['gdp', 'population', 'gdpPC'].map(key => metric(model, code, key)).join('') + '</dl>'
    + '<p class="aa-hero-meta">World Bank WDI: ' + sourceSummary + '. Values may be revised.</p>'
    + '<div class="aa-actions"><a class="btn btn-primary" href="' + base + 'compare?a=' + code + '&amp;b=' + firstPeer.code + '">Compare ' + name + ' with ' + esc(firstPeer.name) + '</a>'
    + '<a class="btn btn-secondary" href="' + base + '?country=' + code + '#brief-builder">Build a brief for ' + name + '</a>'
    + '<button class="btn btn-secondary" type="button" data-aa-shortlist="' + code + '" hidden>Shortlist ' + name + '</button>'
    + '<button class="btn btn-secondary" type="button" data-aa-csv="' + code + '" hidden>Download country CSV</button></div>'
    + '<p id="aa-country-status" role="status" aria-live="polite"></p>'
    + '<nav class="aa-jump-links" aria-label="Country profile sections"><a href="#economy">Economy</a><a href="#history">Ten-year view</a><a href="#resources">Resources and trade</a><a href="#next">Next steps</a></nav>'
    + '</div></section>'
    + '<section class="aa-section" id="economy"><div class="aa-wrap"><h2 class="aa-section-title">Dated economy snapshot</h2><dl class="aa-core-snapshot">' + core + '</dl>'
    + '<p class="aa-data-note">World Bank World Development Indicators. The latest available year can differ by measure. Retrieved ' + model.snapshot.retrieved_at.slice(0, 10)
    + '. <a href="' + base + 'sources/">Sources, units and comparison method</a>.</p>'
    + '<h3>Read the numbers in context</h3><p>Total GDP describes economic scale. GDP per person is average output per resident, not a salary or a cost-of-living measure. Both use current US dollars; exchange rates and national accounts revisions can change them.</p>'
    + '<p>Real GDP growth measures annual output change after price changes. Electricity access and internet use describe national coverage, not service reliability, speed or affordability in a particular city. Life expectancy is an average at birth.</p>'
    + '<p>Exports and imports include goods and services. Their totals should not be mixed with an undated goods-only product breakdown.</p></div></section>'
    + '<section class="aa-section" id="history"><div class="aa-wrap"><h2 class="aa-section-title">' + name + ': a ten-year economy view</h2>'
    + '<p>Annual WDI observations from 2016–2025. N/A means no observation in the retrieved series.</p><div class="aa-table-wrap" tabindex="0" role="region" aria-label="' + name + ' annual economy table">'
    + '<table class="aa-data-table"><caption>GDP in current US dollars, population and annual real GDP growth</caption><thead><tr><th scope="col">Year</th><th scope="col">GDP</th><th scope="col">Population</th><th scope="col">Real growth</th></tr></thead><tbody>' + history + '</tbody></table></div>'
    + '<p class="aa-data-note">Sources: ' + ['gdp', 'population', 'growth'].map(key => '<a href="https://data.worldbank.org/indicator/' + model.snapshot.definitions[key].indicator + '?locations=' + code + '">' + model.snapshot.definitions[key].label + '</a>').join(' · ') + '.</p></div></section>'
    + '<section class="aa-section" id="resources"><div class="aa-wrap"><h2 class="aa-section-title">Resources and trade in ' + name + '</h2>'
    + '<p class="aa-data-note">Undated reference lists. These entries are research starting points, not verified production amounts or current rankings.</p>'
    + '<h3>Natural resource references</h3><p>' + esc(resources.join(' · ') || 'No resource rows in this reference dataset.') + '</p>'
    + '<div class="aa-reference-columns"><div><h3>Export product references</h3>' + products(country.exports) + '</div><div><h3>Import product references</h3>' + products(country.imports) + '</div></div>'
    + '<p>Check product, partner and year coverage in <a href="https://comtradeplus.un.org/">UN Comtrade</a> or <a href="https://wits.worldbank.org/">World Integrated Trade Solution</a>. For mineral production, consult <a href="https://www.usgs.gov/centers/national-minerals-information-center/international-minerals-statistics-and-information">USGS country statistics</a>. These portals are verification paths; their data have not been merged into the reference lists.</p></div></section>'
    + '<section class="aa-section" id="next"><div class="aa-wrap"><h2 class="aa-section-title">Continue your ' + name + ' research</h2>'
    + '<form id="aa-country-compare" class="aa-inline-form" action="' + base + 'compare" method="get"><input type="hidden" name="a" value="' + code + '"><label class="form-field" for="aa-cmp-select"><span class="form-label">Compare ' + name + ' with</span><select class="form-select" id="aa-cmp-select" name="b">'
    + model.discover({ sort: 'name' }).filter(row => row.code !== code).map(row => '<option value="' + row.code + '"' + (row.code === firstPeer.code ? ' selected' : '') + '>' + esc(row.name) + '</option>').join('')
    + '</select></label><button class="btn btn-primary" id="aa-cmp-btn" type="submit">Compare countries</button></form>'
    + '<h3>Related country profiles</h3><ul>' + peerLinks + '</ul><h3>Tools for your next question</h3><ul>' + tools
    + '<li><a href="/tools/diaspora-guide/?country=' + code + '">Diaspora planning guide</a></li><li><a href="/tools/cost-of-living/?country=' + code + '">Cost-of-living research</a></li><li><a href="' + base + 'rankings">African economy rankings</a></li></ul></div></section>'
    + '<section class="aa-section"><div class="aa-wrap"><h2 class="aa-section-title">Questions about ' + name + '</h2>'
    + faq.map(row => '<details class="aa-question"><summary>' + esc(row.question) + '</summary><p>' + esc(row.answer) + '</p></details>').join('') + '</div></section>';
}

function cards(model, resourceTypes) {
  return model.discover({ sort: 'gdp' }).map(country => {
    const point = model.point(country.code, 'gdp');
    const resources = [...new Set(country.resources.map(row => resourceTypes[row.type] ? resourceTypes[row.type].label : row.type))].slice(0, 3).join(' · ');
    return '<article class="aa-card" data-aa-country="' + country.code + '"><a class="aa-country-link" href="' + base + 'country/' + country.slug + '/"><div class="aa-card-top">'
      + flag(country.code, country.name, 'aa-card-flag') + '<div class="aa-card-info"><h3 class="aa-card-name">' + esc(country.name) + '</h3><span class="aa-card-region">' + esc(country.region) + '</span></div></div>'
      + '<p class="aa-card-stat">GDP <strong>' + (point ? esc(api.format('gdp', point.value, true)) + ' <small>(' + point.year + ')</small>' : 'N/A') + '</strong></p>'
      + '<p class="aa-card-res">' + esc(resources || 'Resource references limited') + '</p><span class="aa-open-label">Open country profile →</span></a>'
      + '<button class="btn btn-ghost aa-shortlist-button" type="button" data-aa-shortlist="' + country.code + '" hidden>Shortlist ' + esc(country.name) + '</button></article>';
  }).join('\n');
}

function rankings(model, key, year) {
  const countries = model.discover({ sort: key, year }).filter(country => model.point(country.code, key, year));
  return '<div class="aa-table-wrap" tabindex="0" role="region" aria-label="African country ranking table"><table class="aa-data-table"><caption>' + esc(model.snapshot.definitions[key].label) + ' by African country (' + (year || 'latest available observations') + ')</caption>'
    + '<thead><tr><th scope="col">Rank</th><th scope="col">Country</th><th scope="col">Value</th><th scope="col">Year and source</th></tr></thead><tbody>'
    + countries.map((country, index) => { const point = model.point(country.code, key, year); return '<tr><td>' + (index + 1) + '</td><th scope="row"><a href="' + base + 'country/' + country.slug + '/">' + esc(country.name) + '</a></th><td>' + esc(api.format(key, point.value, true)) + '</td><td><a href="' + point.source_url + '">' + point.year + ' · WDI</a></td></tr>'; }).join('')
    + '</tbody></table></div><p class="aa-data-note">' + countries.length + '/54 countries have an observation for this view. Countries with missing data are excluded, not ranked as zero.</p>';
}

module.exports = { flag, metric, countryContent, cards, rankings };
