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

var results = {
  missingOgImage: [],
  missingTwitterTitle: [],
  missingTwitterDesc: [],
  missingCanonical: [],
  badTitle: [],
  shortDesc: [],
  missingDesc: []
};

files.forEach(function(f) {
  var html = fs.readFileSync(f, 'utf8');
  var rel = f.replace(cwd + path.sep, '').split(path.sep).join('/');

  var hasOgTitle = html.includes('og:title');
  var hasOgImage = html.includes('og:image');
  var hasTwitterTitle = html.includes('twitter:title');
  var hasTwitterDesc = html.includes('twitter:description');
  var hasCanonical = html.includes('rel="canonical"') || html.includes("rel='canonical'");
  var hasDesc = html.includes('name="description"') || html.includes("name='description'");

  var titleMatch = html.match(/<title>([^<]+)<\/title>/);
  var descMatch = html.match(/name=["']description["']\s+content=["']([^"']{1,300})["']/);

  if (hasOgTitle && !hasOgImage) results.missingOgImage.push(rel);
  if (hasOgTitle && !hasTwitterTitle) results.missingTwitterTitle.push(rel);
  if (hasOgTitle && !hasTwitterDesc) results.missingTwitterDesc.push(rel);
  if (hasOgTitle && !hasCanonical) results.missingCanonical.push(rel);
  if (!hasDesc) results.missingDesc.push(rel);

  if (titleMatch) {
    var t = titleMatch[1].trim();
    if (t === 'AfroTools' || t.length < 15) results.badTitle.push(rel + ' [' + t + ']');
  }

  if (descMatch && descMatch[1].length < 60) results.shortDesc.push(rel + ' [len=' + descMatch[1].length + ': ' + descMatch[1].substring(0,80) + ']');
});

Object.keys(results).forEach(function(k) {
  console.log('\n=== ' + k + ' (' + results[k].length + ') ===');
  results[k].slice(0, 20).forEach(function(r) { console.log('  ' + r); });
  if (results[k].length > 20) console.log('  ...and ' + (results[k].length - 20) + ' more');
});

console.log('\n\nTotal pages scanned: ' + files.length);
