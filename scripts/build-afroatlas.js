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

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Build a lookup from country name/slug → country code (e.g. "NG")
 */
var codeBySlug = {};
var codes = Object.keys(COUNTRIES);
for (var i = 0; i < codes.length; i++) {
  var entry = COUNTRIES[codes[i]];
  codeBySlug[entry.slug] = codes[i];
}

function findCode(country) {
  return codeBySlug[country.slug] || '';
}

/**
 * Format GDP as a human-readable string.
 *   >= 1 trillion  → "1.81 trillion"
 *   >= 1 billion   → "363 billion"
 *   >= 1 million   → "640 million"
 *   otherwise      → raw number
 */
function fmtGDP(n) {
  if (n == null) return 'N/A';
  if (n >= 1e12) return (n / 1e12).toFixed(2).replace(/\.?0+$/, '') + ' trillion';
  if (n >= 1e9)  return (n / 1e9).toFixed(1).replace(/\.0$/, '') + ' billion';
  if (n >= 1e6)  return (n / 1e6).toFixed(1).replace(/\.0$/, '') + ' million';
  return String(n);
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
  var gdpStr = fmtGDP(country.gdp);
  var topExports = '';
  if (country.exports && country.exports.length > 0) {
    var names = [];
    var limit = Math.min(country.exports.length, 3);
    for (var i = 0; i < limit; i++) {
      names.push(country.exports[i].p);
    }
    topExports = names.join(', ');
  }

  var desc = "Explore " + country.name + "'s natural resources, GDP ($" + gdpStr + "), top exports";
  if (topExports) {
    desc += " including " + topExports;
  }
  desc += ", trade data, and economic indicators.";
  if (country.tagline) {
    desc += ' ' + country.tagline + '.';
  }
  return desc;
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

/**
 * Generate FAQPage JSON-LD schema with 3 questions.
 */
function generateFAQSchema(country) {
  // Q1 — Natural resources
  var resourceAnswer = '';
  if (country.resources && country.resources.length > 0) {
    var resList = [];
    for (var i = 0; i < country.resources.length; i++) {
      var r = country.resources[i];
      var label = (AfroAtlas.RESOURCE_TYPES[r.type] && AfroAtlas.RESOURCE_TYPES[r.type].label) || r.type;
      var entry = label;
      if (r.prod) entry += ' (' + r.prod + ')';
      resList.push(entry);
    }
    resourceAnswer = country.name + "'s key natural resources include: " + resList.join(', ') + '.';
  } else {
    resourceAnswer = 'Data on ' + country.name + "'s natural resources is currently limited.";
  }

  // Q2 — GDP
  var gdpAnswer = '';
  if (country.gdp != null) {
    gdpAnswer = country.name + " has a nominal GDP of $" + fmtGDP(country.gdp);
    if (country.gdpPC != null) {
      gdpAnswer += ' (GDP per capita: $' + country.gdpPC.toLocaleString('en-US') + ')';
    }
    if (country.gdpGrowth != null) {
      gdpAnswer += ' with a growth rate of ' + country.gdpGrowth + '%.';
    } else {
      gdpAnswer += '.';
    }
  } else {
    gdpAnswer = 'GDP data for ' + country.name + ' is not currently available.';
  }

  // Q3 — Top exports
  var exportAnswer = '';
  if (country.exports && country.exports.length > 0) {
    var expList = [];
    var limit = Math.min(country.exports.length, 5);
    for (var j = 0; j < limit; j++) {
      var ex = country.exports[j];
      expList.push(ex.p + ' ($' + fmtGDP(ex.v) + ')');
    }
    exportAnswer = country.name + "'s top exports are: " + expList.join(', ') + '.';
    if (country.totalExports != null) {
      exportAnswer += ' Total exports: $' + fmtGDP(country.totalExports) + '.';
    }
  } else {
    exportAnswer = 'Export data for ' + country.name + ' is currently limited.';
  }

  var schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What are " + country.name + "'s main natural resources?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": resourceAnswer
        }
      },
      {
        "@type": "Question",
        "name": "What is " + country.name + "'s GDP?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": gdpAnswer
        }
      },
      {
        "@type": "Question",
        "name": "What are " + country.name + "'s top exports?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": exportAnswer
        }
      }
    ]
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

    // Create directory
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Replace placeholders
    var html = template
      .replace(/\{\{COUNTRY_NAME\}\}/g, country.name)
      .replace(/\{\{SLUG\}\}/g, slug)
      .replace(/\{\{COUNTRY_CODE\}\}/g, code)
      .replace(/\{\{META_DESCRIPTION\}\}/g, generateMetaDescription(country))
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
