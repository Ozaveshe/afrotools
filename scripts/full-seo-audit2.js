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

var missingDesc = [];

files.forEach(function(f) {
  var html = fs.readFileSync(f, 'utf8');
  var rel = f.replace(cwd + path.sep, '').split(path.sep).join('/');

  var isRedirect = html.includes('http-equiv="refresh"') || html.toLowerCase().includes('redirecting to');
  var hasDesc = html.includes('name="description"') || html.includes("name='description'");

  if (!hasDesc && !isRedirect) {
    var titleMatch = html.match(/<title>([^<]+)<\/title>/);
    var title = titleMatch ? titleMatch[1].trim() : '(no title)';
    missingDesc.push(rel + '  [' + title + ']');
  }
});

console.log('Non-redirect pages missing meta description (' + missingDesc.length + '):');
missingDesc.forEach(function(r) { console.log('  ' + r); });

console.log('\nTotal pages scanned: ' + files.length);
