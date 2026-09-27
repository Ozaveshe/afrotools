/**
 * build-afroatlas.js
 * Generates 54 country profile pages from AfroAtlas engine data + template.
 * Usage: node scripts/build-afroatlas.js
 */

var fs = require('fs');
var path = require('path');

// ── Load engine ──────────────────────────────────────────────────────
var enginePath = path.join(__dirname, '..', 'engines', 'afroatlas-engine.js');
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

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Build a lookup from country name/slug → country code (e.g. "NG")
 */
var codeBySlug = {};
var codes = Object.keys(COUNTRIES);
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
  var regions = AfroAtlas.getRegions();
  var keys = Object.keys(regions);
  for (var i = 0; i < keys.length; i++) {
    if (regions[keys[i]].codes.indexOf(code) !== -1) return regions[keys[i]].name;
  }
  return 'Africa';
}

function countryFaq(country) {
  var resourceNames = (country.resources || []).map(function(item) {
    var type = AfroAtlas.RESOURCE_TYPES[item.type];
    return type ? type.label : item.type;
  });
  var exportNames = (country.exports || []).slice(0, 5).map(function(item) { return item.p; });
  return [
    {
      question: 'What are ' + country.name + "'s main natural resources?",
      answer: resourceNames.length
        ? country.name + "'s main natural resources include " + resourceNames.join(', ') + '.'
        : 'Limited natural resource data is currently available for ' + country.name + '.'
    },
    {
      question: 'Which exports appear in the ' + country.name + ' profile?',
      answer: exportNames.length
        ? country.name + "'s export profile includes " + exportNames.join(', ') + '.'
        : 'Export data for ' + country.name + ' is currently limited.'
    }
  ];
}

function generateCountryStaticContent(country, code) {
  var core = coreSnapshot.countries[code] || {};
  var coreLabels = [
    { key: 'gdp', label: 'GDP', format: function(value) { return '$' + (value / 1e9).toFixed(1) + 'B'; } },
    { key: 'population', label: 'Population', format: function(value) { return (value / 1e6).toFixed(1) + 'M'; } },
    { key: 'gdpPC', label: 'GDP per person', format: function(value) { return '$' + Math.round(value).toLocaleString('en-US'); } }
  ];
  var coreHtml = coreLabels.map(function(item) {
    var point = core[item.key];
    return '<div><dt>' + escapeHtml(item.label) + '</dt><dd>' + (point ? escapeHtml(item.format(point.value)) : 'N/A') +
      '<small>' + (point ? '<a href="' + escapeHtml(point.source_url) + '">World Bank WDI, ' + point.year + '</a>' : 'World Bank WDI: no 2016–2025 observation') + '</small></dd></div>';
  }).join('');
  var resourceNames = (country.resources || []).slice(0, 5).map(function(resource) {
    var type = AfroAtlas.RESOURCE_TYPES[resource.type];
    return type ? type.label : resource.type;
  });
  var exportNames = (country.exports || []).slice(0, 3).map(function(item) { return item.p; });
  var region = regionName(code);
  var otherCode = Object.keys(COUNTRIES).filter(function(candidate) {
    return candidate !== code && regionName(candidate) === region;
  })[0] || (code === 'NG' ? 'KE' : 'NG');
  var otherCountry = COUNTRIES[otherCode];
  var countryName = escapeHtml(country.name);
  var comparison = '/tools/afroatlas/compare?a=' + encodeURIComponent(code) + '&amp;b=' + otherCode;
  var resources = resourceNames.length
    ? '<p>AfroAtlas lists ' + escapeHtml(resourceNames.join(', ')) + ' among the resources in its ' + countryName + ' reference profile.</p>'
    : '<p>Resource coverage for ' + countryName + ' is limited in this dataset.</p>';
  var exports = exportNames.length
    ? '<p>The trade profile highlights ' + escapeHtml(exportNames.join(', ')) + '. Open the interactive profile for the full export view.</p>'
    : '<p>Open the interactive profile to review the available trade indicators.</p>';
  var faqHtml = countryFaq(country).map(function(item) {
    return '<h3>' + escapeHtml(item.question) + '</h3><p>' + escapeHtml(item.answer) + '</p>';
  }).join('');
  return '<section class="aa-country-hero"><div class="aa-wrap">' +
    '<p class="aa-eyebrow">' + escapeHtml(region) + ' country profile</p>' +
    '<h1>' + countryName + ' economy and natural resources</h1>' +
    '<p>Explore the resource, trade, and economic indicators recorded for ' + countryName + ' in AfroAtlas.</p>' +
    '</div></section>' +
    '<section class="aa-section"><div class="aa-wrap">' +
    '<h2 class="aa-section-title">Dated economy snapshot</h2>' +
    '<dl class="aa-core-snapshot">' + coreHtml + '</dl>' +
    '<p>World Bank World Development Indicators. The latest available year can differ by measure; values may be revised.</p>' +
    '<h2 class="aa-section-title">Resources and trade in ' + countryName + '</h2>' +
    resources + exports +
    '<p>Resource and trade figures in this reference profile still lack verified source dates. Check current primary sources before making financial or policy decisions.</p>' +
    '<p><a class="aa-btn" href="' + comparison + '">Compare ' + countryName + ' with ' + escapeHtml(otherCountry.name) + '</a></p>' +
    '<h2 class="aa-section-title">Questions about ' + countryName + '</h2>' + faqHtml +
    '</div></section>';
}

function updateLandingCountryGrid() {
  var landingPath = path.join(__dirname, '..', 'tools', 'afroatlas', 'index.html');
  var html = fs.readFileSync(landingPath, 'utf8');
  var marker = /<!-- aa-static-country-grid:start -->[\s\S]*?<!-- aa-static-country-grid:end -->/;
  if (!marker.test(html)) throw new Error('AfroAtlas landing country grid markers are missing');
  var cards = countries.slice().sort(function(a, b) { return a.name.localeCompare(b.name); }).map(function(country) {
    var code = findCode(country);
    return '        <a class="aa-card" href="/tools/afroatlas/country/' + escapeHtml(country.slug) + '/">' +
      '<div class="aa-card-top"><div class="aa-card-info"><h3 class="aa-card-name">' + escapeHtml(country.name) +
      '</h3><span class="aa-card-region">' + escapeHtml(regionName(code)) +
      '</span></div></div><span>Open country profile &rarr;</span></a>';
  }).join('\n');
  var updated = html.replace(marker, '<!-- aa-static-country-grid:start -->\n' + cards + '\n        <!-- aa-static-country-grid:end -->');
  if (updated !== html) fs.writeFileSync(landingPath, updated, 'utf8');
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
      .replace(/\{\{BREADCRUMB_SCHEMA\}\}/g, generateBreadcrumbSchema(country))
      .replace(/\{\{FAQ_SCHEMA\}\}/g, generateFAQSchema(country));

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
