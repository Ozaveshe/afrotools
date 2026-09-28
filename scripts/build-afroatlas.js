/**
 * build-afroatlas.js
 * Generates 54 country profile pages from AfroAtlas engine data + template.
 * Usage: node scripts/build-afroatlas.js
 */

var fs = require('fs');
var path = require('path');

// ── Load engine ──────────────────────────────────────────────────────
var enginePath = path.join(__dirname, '..', 'engines', 'src', 'afroatlas-engine.js');
var engineCode = fs.readFileSync(enginePath, 'utf8');
eval(engineCode);

// ── Load template ────────────────────────────────────────────────────
var templatePath = path.join(__dirname, '..', 'tools', 'afroatlas', '_country-template.html');
var template = fs.readFileSync(templatePath, 'utf8');

// ── Get all countries ────────────────────────────────────────────────
var countries = AfroAtlas.getAllCountries();
var COUNTRIES = AfroAtlas.COUNTRIES;
var outputDir = path.join(__dirname, '..', 'tools', 'afroatlas', 'country');
var breadcrumbTemplatePattern = /<script type="application\/ld\+json" data-schema-template="breadcrumb">[\s\S]*?<\/script>/g;
var faqTemplatePattern = /<script type="application\/ld\+json" data-schema-template="faq">[\s\S]*?<\/script>/g;
var datasetTemplatePattern = /<script type="application\/ld\+json" data-schema-template="dataset">[\s\S]*?<\/script>/g;

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Build a lookup from country name/slug → country code (e.g. "NG")
 */
var codeBySlug = {};
var codes = Object.keys(COUNTRIES);
var researchSnapshot = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'afroatlas', 'research-indicators.json'), 'utf8'));
require('./refresh-afroatlas-research-data').validate(researchSnapshot);
var identities = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'registry', 'countries.json'), 'utf8'));
var researchApi = require('../assets/js/lib/afroatlas-research');
var research = researchApi.create(researchSnapshot, AfroAtlas, identities);
var researchPayload = { snapshot: researchSnapshot, identities: identities.map(function(country) { return { id: country.id, region: country.region }; }) };
fs.writeFileSync(path.join(__dirname, '..', 'tools', 'afroatlas', 'research-data.js'),
  'window.AfroAtlasResearchData=' + JSON.stringify(researchPayload).replace(/</g, '\\u003c') + ';\n', 'utf8');
var coreSnapshotPath = path.join(__dirname, '..', 'data', 'afroatlas', 'world-bank-core-indicators.json');
var coreSnapshot = JSON.parse(fs.readFileSync(coreSnapshotPath, 'utf8'));
require('./refresh-afroatlas-world-bank').validSnapshot(coreSnapshot, codes.slice().sort());
var coreOverlayPath = path.join(__dirname, '..', 'tools', 'afroatlas', 'world-bank-core-indicators.js');
var corePayload = JSON.stringify({ retrieved_at: coreSnapshot.retrieved_at, countries: coreSnapshot.countries }).replace(/</g, '\\u003c');
fs.writeFileSync(coreOverlayPath,
  '(function(root){"use strict";var data=' + corePayload + ';root.AfroAtlasCoreIndicators=data;' +
  'if(!root.AfroAtlas||!root.AfroAtlas.COUNTRIES)return;' +
  'Object.keys(data.countries).forEach(function(code){var country=root.AfroAtlas.COUNTRIES[code],row=data.countries[code];if(!country)return;' +
  'country.gdp=row.gdp?row.gdp.value:null;country.population=row.population?row.population.value:null;' +
  'country.gdpPC=row.gdpPC?row.gdpPC.value:null;country.gdpHist=row.gdp_history||{};' +
  'country.coreSources={gdp:row.gdp||null,population:row.population||null,gdpPC:row.gdpPC||null};});' +
  '})(typeof window!=="undefined"?window:globalThis);\n', 'utf8');
for (var i = 0; i < codes.length; i++) {
  var entry = COUNTRIES[codes[i]];
  codeBySlug[entry.slug] = codes[i];
}

function findCode(country) {
  return codeBySlug[country.slug] || '';
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function regionName(code) {
  if (research.countries[code]) return research.countries[code].region;
  var regions = AfroAtlas.getRegions();
  var keys = Object.keys(regions);
  for (var i = 0; i < keys.length; i++) {
    if (regions[keys[i]].codes.indexOf(code) !== -1) return regions[keys[i]].name;
  }
  return 'Africa';
}

function countryFaq(country) {
  var code = findCode(country);
  var gdp = research.point(code, 'gdp');
  var population = research.point(code, 'population');
  var gdpPC = research.point(code, 'gdpPC');
  var resourceNames = (country.resources || []).map(function(item) {
    var type = AfroAtlas.RESOURCE_TYPES[item.type];
    return type ? type.label : item.type;
  });
  var exportNames = (country.exports || []).slice(0, 5).map(function(item) { return item.p; });
  return [
    {
      question: 'What is the latest GDP figure for ' + country.name + '?',
      answer: gdp ? 'The World Bank WDI observation is ' + researchApi.format('gdp', gdp.value) + ' for ' + gdp.year + ', in current US dollars. It measures total economic output, not household income or purchasing power.' : 'No World Bank WDI GDP observation is available for ' + country.name + ' in the 2016–2025 snapshot. Missing data is not zero.'
    },
    {
      question: 'What are ' + country.name + "'s population and GDP per person?",
      answer: (population ? 'Population is ' + researchApi.format('population', population.value) + ' (' + population.year + '). ' : 'Population is unavailable. ')
        + (gdpPC ? 'GDP per person is ' + researchApi.format('gdpPC', gdpPC.value) + ' (' + gdpPC.year + ') in current US dollars. It is an average output measure, not a salary.' : 'GDP per person is unavailable in this snapshot.')
    },
    {
      question: 'What are ' + country.name + "'s main natural resources?",
      answer: resourceNames.length
        ? 'The undated AfroAtlas reference list includes ' + resourceNames.join(', ') + '. These entries do not establish current production amounts or rankings; check primary resource statistics.'
        : 'Limited natural resource data is currently available for ' + country.name + '.'
    },
    {
      question: 'Which exports appear in the ' + country.name + ' profile?',
      answer: exportNames.length
        ? 'The undated product reference list includes ' + exportNames.join(', ') + '. Goods-only trade sources can differ from the WDI totals, which include goods and services.'
        : 'Export data for ' + country.name + ' is currently limited.'
    },
    { question: 'How can I compare ' + country.name + ' fairly with another country?',
      answer: 'Use the latest shared observation year for each indicator. AfroAtlas compares matched years by default, shows missing observations as N/A, and offers a latest-observation view that labels differences in years.' },
    { question: 'How do I cite or download this country data?',
      answer: 'Each indicator links to the World Bank source and shows its observation year. Download the CSV or create a research brief to retain indicator names, units, dates and source URLs. The snapshot was retrieved on ' + researchSnapshot.retrieved_at.slice(0, 10) + '.' }
  ];
}

function generateCountryStaticContent(country, code) {
  return require('./lib/afroatlas-research-pages').countryContent(research, code, countryFaq(country), AfroAtlas.RESOURCE_TYPES);
}

function updateLandingCountryGrid() {
  var landingPath = path.join(__dirname, '..', 'tools', 'afroatlas', 'index.html');
  var html = fs.readFileSync(landingPath, 'utf8');
  var marker = /<!-- aa-static-country-grid:start -->[\s\S]*?<!-- aa-static-country-grid:end -->/;
  if (!marker.test(html)) throw new Error('AfroAtlas landing country grid markers are missing');
  var cards = require('./lib/afroatlas-research-pages').cards(research, AfroAtlas.RESOURCE_TYPES);
  var updated = html.replace(marker, '<!-- aa-static-country-grid:start -->\n' + cards + '\n        <!-- aa-static-country-grid:end -->');
  if (updated !== html) fs.writeFileSync(landingPath, updated, 'utf8');
}

function generateDatasetSchema(country, code) {
  var url = 'https://afrotools.com/tools/afroatlas/country/' + country.slug + '/';
  var schema = {
    '@context': 'https://schema.org', '@type': 'Dataset', '@id': url + '#wdi-dataset',
    name: country.name + ' economy indicators, 2016–2025',
    description: 'A dated World Bank WDI snapshot for ' + country.name + ', with missing observations retained as unavailable. Resource reference lists are not part of this dataset.',
    url: url, creator: { '@type': 'Organization', name: 'World Bank', url: 'https://www.worldbank.org/' },
    publisher: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' },
    dateModified: researchSnapshot.retrieved_at.slice(0, 10), temporalCoverage: '2016/2025',
    spatialCoverage: { '@type': 'Place', name: country.name },
    isBasedOn: 'https://databank.worldbank.org/source/world-development-indicators',
    variableMeasured: Object.keys(researchSnapshot.definitions).filter(function(key) { return research.point(code, key); }).map(function(key) {
      return { '@type': 'PropertyValue', name: researchSnapshot.definitions[key].label, unitText: researchSnapshot.definitions[key].unit };
    })
  };
  return JSON.stringify(schema).replace(/</g, '\\u003c');
}

function updateResearchRankings() {
  var file = path.join(__dirname, '..', 'tools', 'afroatlas', 'rankings.html');
  var html = fs.readFileSync(file, 'utf8');
  var marker = /<!-- aa-static-rankings:start -->[\s\S]*?<!-- aa-static-rankings:end -->/;
  if (!marker.test(html)) throw new Error('Research rankings markers missing');
  html = html.replace(marker, '<!-- aa-static-rankings:start -->' + require('./lib/afroatlas-research-pages').rankings(research, 'gdp', null) + '<!-- aa-static-rankings:end -->');
  fs.writeFileSync(file, html);
}

function updateSourcesPage() {
  var file = path.join(__dirname, '..', 'tools', 'afroatlas', 'sources', 'index.html');
  var html = fs.readFileSync(file, 'utf8');
  var marker = /<!-- aa-sources-data:start -->[\s\S]*?<!-- aa-sources-data:end -->/;
  if (!marker.test(html)) throw new Error('Sources page markers missing');
  var rows = Object.keys(researchSnapshot.definitions).map(function(key) {
    var definition = researchSnapshot.definitions[key];
    var coverage = codes.filter(function(code) { return research.point(code, key); }).length;
    return '<tr><th scope="row"><a href="https://data.worldbank.org/indicator/' + definition.indicator + '">' + escapeHtml(definition.label) + '</a></th><td>' + escapeHtml(definition.unit) + '</td><td>' + definition.indicator + '</td><td>' + coverage + '/54</td></tr>';
  }).join('');
  var content = '<p>Snapshot retrieved on <time datetime="' + researchSnapshot.retrieved_at + '">' + researchSnapshot.retrieved_at.slice(0, 10) + '</time>. The observation window is 2016–2025. Each indicator keeps its latest available observation and the annual series.</p>' +
    '<div class="aa-table-wrap" tabindex="0" role="region" aria-label="Indicator definitions and country coverage"><table class="aa-data-table"><caption>World Bank WDI measures and African country coverage</caption><thead><tr><th scope="col">Indicator</th><th scope="col">Unit</th><th scope="col">WDI code</th><th scope="col">Available countries</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  fs.writeFileSync(file, html.replace(marker, '<!-- aa-sources-data:start -->' + content + '<!-- aa-sources-data:end -->'));
}

/**
 * Escape a string for safe embedding inside a JSON value.
 */
function jsonEscape(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Generate meta description from country data.
 */
function generateMetaDescription(country) {
  var prefix = "Explore " + country.name + "'s economy, natural resources and exports";
  var suffix = '. Compare country profiles and review trade indicators in AfroAtlas.';
  var names = (country.exports || []).slice(0, 2).map(function(item) { return item.p; });
  var detail = names.length ? ' such as ' + names.join(', ') : '';
  var description = prefix + detail + suffix;
  if (escapeHtml(description).length > 180 && names.length) description = prefix + ' such as ' + names[0] + suffix;
  if (escapeHtml(description).length > 180) description = prefix + suffix;
  return escapeHtml(description);
}

/**
 * Generate BreadcrumbList JSON-LD schema.
 */
function generateBreadcrumbSchema(country) {
  var schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type":"ListItem","position":1,"name":"AfroTools","item":"https://afrotools.com/"},
      {"@type":"ListItem","position":2,"name":"Tools","item":"https://afrotools.com/tools/"},
      {"@type":"ListItem","position":3,"name":"AfroAtlas","item":"https://afrotools.com/tools/afroatlas/"},
      {"@type":"ListItem","position":4,"name":country.name,"item":"https://afrotools.com/tools/afroatlas/country/" + country.slug + "/"}
    ]
  };
  return JSON.stringify(schema);
}

/** Generate only answers that are also visible in the static country profile. */
function generateFAQSchema(country) {
  var faq = countryFaq(country);
  var schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map(function(item) {
      return { "@type": "Question", "name": item.question,
        "acceptedAnswer": { "@type": "Answer", "text": item.answer } };
    })
  };

  return JSON.stringify(schema);
}

// ── Generate pages ───────────────────────────────────────────────────
console.log('AfroAtlas Build: generating country pages...');
console.log('  Template: ' + templatePath);
console.log('  Output:   ' + outputDir);
console.log('  Countries found: ' + countries.length);
console.log('');

var generated = 0;
var errors = [];

countries.forEach(function(country) {
  try {
    var code = findCode(country);
    var slug = country.slug;
    var dir = path.join(outputDir, slug);
    var routeUrl = 'https://afrotools.com/tools/afroatlas/country/' + slug + '/';
    var countryOgPath = path.join(__dirname, '..', 'assets', 'img', 'og', 'countries', 'country-' + slug + '.webp');

    // Create directory
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Replace placeholders
    var html = template
      .replace(/\{\{COUNTRY_NAME\}\}/g, escapeHtml(country.name))
      .replace(/\{\{SLUG\}\}/g, slug)
      .replace(/\{\{COUNTRY_CODE\}\}/g, code)
      .replace(/\{\{META_DESCRIPTION\}\}/g, generateMetaDescription(country))
      .replace(/\{\{COUNTRY_STATIC_CONTENT\}\}/g, generateCountryStaticContent(country, code))
      .replace('<meta name="robots" content="noindex, follow">', '<meta name="robots" content="index, follow">')
      .replace('<meta property="og:url" content="https://afrotools.com/tools/afroatlas/_country-template">', '<meta property="og:url" content="' + routeUrl + '">')
      .replace(
        '<link rel="canonical" href="https://afrotools.com/tools/afroatlas/_country-template">',
        '<link rel="canonical" href="' + routeUrl + '">\n' +
          '<link rel="alternate" hreflang="en" href="' + routeUrl + '">\n' +
          '<link rel="alternate" hreflang="x-default" href="' + routeUrl + '">'
      )
      .replace(breadcrumbTemplatePattern, '<script type="application/ld+json">' + generateBreadcrumbSchema(country) + '</script>')
      .replace(faqTemplatePattern, '<script type="application/ld+json">' + generateFAQSchema(country) + '</script>')
      .replace(datasetTemplatePattern, '<script type="application/ld+json">' + generateDatasetSchema(country, code) + '</script>')
      .replace(/\{\{BREADCRUMB_SCHEMA\}\}/g, generateBreadcrumbSchema(country))
      .replace(/\{\{FAQ_SCHEMA\}\}/g, generateFAQSchema(country));

    if (fs.existsSync(countryOgPath)) {
      var countryOgUrl = 'https://afrotools.com/assets/img/og/countries/country-' + slug + '.webp';
      html = html
        .replace('<meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">', '<meta property="og:image" content="' + countryOgUrl + '">')
        .replace('<meta name="twitter:image" content="https://afrotools.com/assets/img/og-default.png">', '<meta name="twitter:image" content="' + countryOgUrl + '">');
    }

    fs.writeFileSync(path.join(dir, 'index.html'), html);
    generated++;
    console.log('  \u2713 ' + country.name + ' (' + code + ') \u2192 country/' + slug + '/index.html');
  } catch (err) {
    errors.push({ country: country.name, error: err.message });
    console.error('  \u2717 ' + country.name + ' \u2014 ERROR: ' + err.message);
  }
});

// ── Summary ──────────────────────────────────────────────────────────
console.log('');
console.log('Done! Generated ' + generated + ' / ' + countries.length + ' country pages.');

if (errors.length > 0) {
  console.error('\nErrors (' + errors.length + '):');
  errors.forEach(function(e) {
    console.error('  - ' + e.country + ': ' + e.error);
  });
  process.exit(1);
}

if (generated !== 54) {
  console.warn('\nWarning: expected 54 countries but generated ' + generated + '.');
}

updateLandingCountryGrid();
updateResearchRankings();
updateSourcesPage();
