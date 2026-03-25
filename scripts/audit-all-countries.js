var fs = require('fs');
var path = require('path');

var cwd = process.cwd();
// Find all top-level directories that have an index.html with country-ish content
var items = fs.readdirSync(cwd, {withFileTypes:true});
var missing = {breadcrumb:[], twitter:[], schema:[]};

items.forEach(function(item) {
  if (!item.isDirectory()) return;
  if (item.name.startsWith('.') || item.name === 'node_modules' || item.name === 'assets' || item.name === 'scripts' || item.name === 'netlify' || item.name === 'supabase' || item.name === 'fr') return;

  var f = path.join(cwd, item.name, 'index.html');
  if (!fs.existsSync(f)) return;

  var html = fs.readFileSync(f, 'utf8');
  if (html.includes('http-equiv="refresh"') || html.toLowerCase().includes('redirecting to')) return;

  // Check if it looks like a country page (has country-related schema or "country" in og:description, etc.)
  var isCountryPage = html.includes('"country"') || html.includes('country hub') || html.includes('tax calculators') ||
    (html.includes('og:title') && !html.includes('tool-') && html.includes('AfroTools'));

  if (!isCountryPage) return;

  var hasBreadcrumb = html.includes('BreadcrumbList');
  var hasTwitter = html.includes('twitter:title');
  var hasSchema = html.includes('application/ld+json');

  if (!hasBreadcrumb) missing.breadcrumb.push(item.name);
  if (!hasTwitter) missing.twitter.push(item.name);
  if (!hasSchema) missing.schema.push(item.name);
});

console.log('Country pages missing breadcrumb (' + missing.breadcrumb.length + '):');
missing.breadcrumb.forEach(function(n) { console.log('  ' + n); });

console.log('\nCountry pages missing twitter:title (' + missing.twitter.length + '):');
missing.twitter.forEach(function(n) { console.log('  ' + n); });

console.log('\nCountry pages missing schema (' + missing.schema.length + '):');
missing.schema.forEach(function(n) { console.log('  ' + n); });
