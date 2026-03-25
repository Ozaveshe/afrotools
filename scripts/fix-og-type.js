'use strict';
var fs = require('fs');
var path = require('path');

var root = process.cwd();

function findHtmlFiles(dir, depth) {
  if (depth > 3) return [];
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
var fixed = 0;

for (var i = 0; i < files.length; i++) {
  var f = files[i];
  var html = fs.readFileSync(f, 'utf8');

  // Only fix pages that have og:title but not og:type
  if (!html.includes('og:title') || html.includes('og:type')) continue;

  // Insert og:type after og:url if present, otherwise after og:title
  var newHtml;
  if (html.includes('og:url')) {
    newHtml = html.replace(
      /(<meta property="og:url"[^>]*>)/,
      '$1\n<meta property="og:type" content="website">'
    );
  } else {
    newHtml = html.replace(
      /(<meta property="og:title"[^>]*>)/,
      '$1\n<meta property="og:type" content="website">'
    );
  }

  if (newHtml !== html) {
    fs.writeFileSync(f, newHtml, 'utf8');
    fixed++;
  }
}

console.log('Fixed og:type on ' + fixed + ' pages.');
