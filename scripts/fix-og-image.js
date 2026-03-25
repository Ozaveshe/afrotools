'use strict';
var fs = require('fs');
var path = require('path');

var root = process.cwd();
var DEFAULT_OG_IMAGE = 'https://afrotools.com/assets/img/og-default.png';

function findHtmlFiles(dir, depth) {
  if (depth > 3) return [];
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
var fixed = 0;

files.forEach(function(f) {
  var html = fs.readFileSync(f, 'utf8');
  if (!html.includes('og:title')) return;
  if (html.includes('og:image')) return;

  // Insert og:image after og:description or og:url or og:type or og:title
  var newHtml = html;
  var tag = '<meta property="og:image" content="' + DEFAULT_OG_IMAGE + '">';

  if (html.includes('og:description')) {
    newHtml = html.replace(
      /(<meta property="og:description"[^>]*>)/,
      '$1\n' + tag
    );
  } else if (html.includes('og:url')) {
    newHtml = html.replace(
      /(<meta property="og:url"[^>]*>)/,
      '$1\n' + tag
    );
  } else {
    newHtml = html.replace(
      /(<meta property="og:title"[^>]*>)/,
      '$1\n' + tag
    );
  }

  if (newHtml !== html) {
    fs.writeFileSync(f, newHtml, 'utf8');
    fixed++;
    console.log('Fixed: ' + f.replace(root + path.sep, '').split(path.sep).join('/'));
  }
});

console.log('\nAdded og:image to ' + fixed + ' pages.');
