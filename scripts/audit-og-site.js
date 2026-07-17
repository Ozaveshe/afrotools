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

var missingSiteName = [];
var missingOgLocale = [];
var missingOgUrl = [];

files.forEach(function(f) {
  var html = fs.readFileSync(f, 'utf8');
  var rel = f.replace(cwd + path.sep, '').split(path.sep).join('/');
  if (html.includes('http-equiv="refresh"') || html.toLowerCase().includes('redirecting to')) return;
  if (html.length < 500) return;
  if (!html.includes('og:title')) return; // only pages with OG

  if (!html.includes('og:site_name')) missingSiteName.push(rel);
  if (!html.includes('og:locale')) missingOgLocale.push(rel);
  if (!html.includes('og:url')) missingOgUrl.push(rel);
});

console.log('Missing og:site_name (' + missingSiteName.length + '):');
missingSiteName.slice(0,20).forEach(function(r){console.log('  '+r);});
if (missingSiteName.length > 20) console.log('  ...and '+(missingSiteName.length-20)+' more');

console.log('\nMissing og:locale (' + missingOgLocale.length + '):');
missingOgLocale.slice(0,20).forEach(function(r){console.log('  '+r);});
if (missingOgLocale.length > 20) console.log('  ...and '+(missingOgLocale.length-20)+' more');

console.log('\nMissing og:url (' + missingOgUrl.length + '):');
missingOgUrl.slice(0,20).forEach(function(r){console.log('  '+r);});
if (missingOgUrl.length > 20) console.log('  ...and '+(missingOgUrl.length-20)+' more');

console.log('\nTotal: ' + files.length);
