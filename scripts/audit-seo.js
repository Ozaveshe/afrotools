'use strict';
var fs = require('fs');
var path = require('path');

var root = process.cwd();

function findHtmlFiles(dir, depth) {
  if (depth > 2) return [];
  var items;
  try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch(e) { return []; }
  var files = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.name.startsWith('.') || item.name === 'node_modules' || item.name === 'assets' || item.name === 'scripts') continue;
    var full = path.join(dir, item.name);
    if (item.isDirectory()) files = files.concat(findHtmlFiles(full, depth + 1));
    else if (item.name === 'index.html') files.push(full);
  }
  return files;
}

var files = findHtmlFiles(root, 0);
var noCanonical = [], noDesc = [], shortDesc = [], noOgImage = [], longTitle = [], shortTitle = [];

files.forEach(function(f) {
  var html = fs.readFileSync(f, 'utf8');
  var rel = f.replace(root + path.sep, '').split(path.sep).join('/');
  if (!html.includes('og:title')) return; // skip non-real pages
  if (!html.includes('rel="canonical"')) noCanonical.push(rel);
  if (!html.includes('<meta name="description"')) noDesc.push(rel);
  if (!html.includes('og:image')) noOgImage.push(rel);
  var descM = html.match(/<meta name="description" content="([^"]+)"/);
  if (descM && descM[1].length < 50) shortDesc.push(rel + ' (' + descM[1].length + ' chars)');
  var titleM = html.match(/<title>([^<]+)<\/title>/);
  if (titleM) {
    if (titleM[1].length > 65) longTitle.push(rel + ' (' + titleM[1].length + ' chars)');
    if (titleM[1].length < 20) shortTitle.push(rel + ' (' + titleM[1].length + ': ' + titleM[1] + ')');
  }
});

console.log('No canonical (' + noCanonical.length + '):');
noCanonical.slice(0, 15).forEach(function(r) { console.log('  ' + r); });

console.log('\nNo meta description (' + noDesc.length + '):');
noDesc.slice(0, 10).forEach(function(r) { console.log('  ' + r); });

console.log('\nNo og:image (' + noOgImage.length + '):');
noOgImage.slice(0, 10).forEach(function(r) { console.log('  ' + r); });

console.log('\nShort description <50 chars (' + shortDesc.length + '):');
shortDesc.slice(0, 10).forEach(function(r) { console.log('  ' + r); });

console.log('\nLong title >65 chars (' + longTitle.length + '):');
longTitle.slice(0, 15).forEach(function(r) { console.log('  ' + r); });

console.log('\nShort title <20 chars (' + shortTitle.length + '):');
shortTitle.forEach(function(r) { console.log('  ' + r); });
