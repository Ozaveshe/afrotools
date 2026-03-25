var fs = require('fs');
var path = require('path');

function findHtmlFiles(dir, depth) {
  if (depth > 3) return [];
  var items;
  try { items = fs.readdirSync(dir, {withFileTypes:true}); } catch(e) { return []; }
  var files = [];
  for (var i=0; i<items.length; i++) {
    var item = items[i];
    if (item.name.startsWith('.') || item.name === 'node_modules') continue;
    var full = path.join(dir, item.name);
    if (item.isDirectory()) files = files.concat(findHtmlFiles(full, depth+1));
    else if (item.name === 'index.html') files.push(full);
  }
  return files;
}

var cwd = process.cwd();
var files = findHtmlFiles(cwd, 0);

var oldCopyright = [];
var country2024 = [];
var noSchemaAtAll = [];

files.forEach(function(f) {
  var html = fs.readFileSync(f, 'utf8');
  var rel = f.replace(cwd + path.sep, '').split(path.sep).join('/');
  if (html.includes('http-equiv="refresh"') || html.toLowerCase().includes('redirecting to')) return;
  if (html.length < 500) return;

  // Old copyright year
  if (html.match(/©\s*202[0-4]\b/) || html.match(/copyright\s+202[0-4]\b/i)) {
    var yearMatch = html.match(/©\s*(202[0-4])/);
    if (yearMatch) oldCopyright.push(rel + ' [' + yearMatch[1] + ']');
  }

  // 2024 in title/meta (outdated year in content)
  if (html.match(/<title>[^<]*2024[^<]*<\/title>/)) {
    country2024.push('TITLE-2024: ' + rel);
  }

  // No schema at all
  if (!html.includes('application/ld+json') && html.includes('og:title')) {
    noSchemaAtAll.push(rel);
  }
});

console.log('Old copyright years (' + oldCopyright.length + '):');
oldCopyright.slice(0,20).forEach(function(r) { console.log('  ' + r); });
if (oldCopyright.length > 20) console.log('  ...and ' + (oldCopyright.length-20) + ' more');

console.log('\n2024 in page title (' + country2024.length + '):');
country2024.slice(0,20).forEach(function(r) { console.log('  ' + r); });

console.log('\nPages with OG tags but NO JSON-LD schema (' + noSchemaAtAll.length + '):');
noSchemaAtAll.slice(0,30).forEach(function(r) { console.log('  ' + r); });
if (noSchemaAtAll.length > 30) console.log('  ...and ' + (noSchemaAtAll.length-30) + ' more');

console.log('\nTotal: ' + files.length);
