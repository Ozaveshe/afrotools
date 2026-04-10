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

function normalizePathname(value) {
  if (!value) return null;
  var stripped = value.replace(/\/index\.html$/i, '/').replace(/\/$/, '');
  return stripped || '/';
}

function fileToPathname(filePath) {
  var rel = filePath.replace(root + path.sep, '').split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'/index.html'.length) + '/';
  return '/' + rel.replace(/\.html$/i, '');
}

function getCanonicalPath(html) {
  var canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (!canonicalMatch) return null;

  try {
    return normalizePathname(new URL(canonicalMatch[1]).pathname);
  } catch(e) {
    return normalizePathname(canonicalMatch[1]);
  }
}

function isRedirectLike(html, filePath) {
  var canonicalPath = getCanonicalPath(html);
  var currentPath = normalizePathname(fileToPathname(filePath));
  return (
    /<meta[^>]+http-equiv=["']refresh["']/i.test(html) ||
    /window\.location\.(replace|href)|location\.replace\(/i.test(html) ||
    Boolean(canonicalPath && canonicalPath !== currentPath)
  );
}

var files = findHtmlFiles(root, 0);
var noCanonical = [], noDesc = [], shortDesc = [], noOgImage = [], longTitle = [], shortTitle = [], skippedRedirects = [];

files.forEach(function(f) {
  var html = fs.readFileSync(f, 'utf8');
  var rel = f.replace(root + path.sep, '').split(path.sep).join('/');
  if (!html.includes('og:title')) return; // skip non-real pages
  if (isRedirectLike(html, f)) {
    skippedRedirects.push(rel);
    return;
  }
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

console.log('\nSkipped redirect/canonical alias pages (' + skippedRedirects.length + '):');
skippedRedirects.slice(0, 10).forEach(function(r) { console.log('  ' + r); });
