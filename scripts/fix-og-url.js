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
var fixed = 0;

files.forEach(function(f) {
  var html = fs.readFileSync(f, 'utf8');
  if (html.includes('http-equiv="refresh"') || html.toLowerCase().includes('redirecting to')) return;
  if (!html.includes('og:title')) return;
  if (html.includes('og:url')) return; // already has it

  // Get URL from canonical
  var canonMatch = html.match(/rel=["']canonical["']\s+href=["']([^"']+)["']/);
  if (!canonMatch) canonMatch = html.match(/href=["']([^"']+)["']\s+rel=["']canonical["']/);
  if (!canonMatch) {
    console.log('SKIP (no canonical): ' + f.replace(cwd + path.sep, ''));
    return;
  }
  var url = canonMatch[1];

  // Insert og:url after og:title
  var newHtml = html.replace(
    /(<meta\s+property=["']og:title["'][^>]+>)/,
    '$1\n<meta property="og:url" content="' + url + '">'
  );

  if (newHtml !== html) {
    fs.writeFileSync(f, newHtml);
    fixed++;
    console.log('FIXED: ' + f.replace(cwd + path.sep, '').split(path.sep).join('/'));
  }
});

console.log('\nFixed ' + fixed + ' files.');
