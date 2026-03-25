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
    if (item.isDirectory()) {
      files = files.concat(findHtmlFiles(full, depth + 1));
    } else if (item.name === 'index.html') {
      files.push(full);
    }
  }
  return files;
}

var files = findHtmlFiles(root, 0);
var missingTwitter = [];
var missingBreadcrumb = [];

files.forEach(function(f) {
  var html = fs.readFileSync(f, 'utf8');
  var rel = f.replace(root + path.sep, '').replace(/\\/g, '/');
  if (html.includes('og:title') && !html.includes('twitter:card')) {
    missingTwitter.push(rel);
  }
  if (html.includes('og:title') && !html.includes('BreadcrumbList')) {
    missingBreadcrumb.push(rel);
  }
});

console.log('Missing twitter:card (' + missingTwitter.length + '):');
missingTwitter.forEach(function(f) { console.log('  ' + f); });
console.log('');
console.log('Missing BreadcrumbList (' + missingBreadcrumb.length + '):');
missingBreadcrumb.forEach(function(f) { console.log('  ' + f); });
