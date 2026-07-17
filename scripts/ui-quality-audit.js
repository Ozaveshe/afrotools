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

var issues = {
  imgMissingAlt: [],
  imgEmptyAlt: [],
  brokenInternalLinks: [],
  missingLangAttr: [],
  inputMissingLabel: [],
  emptyButtons: [],
  iframeNoTitle: [],
  duplicateH1: [],
  missingH1: []
};

files.forEach(function(f) {
  var html = fs.readFileSync(f, 'utf8');
  var rel = f.replace(cwd + path.sep, '').split(path.sep).join('/');

  // Skip redirect pages
  if (html.includes('http-equiv="refresh"') || html.toLowerCase().includes('redirecting to')) return;
  // Skip very small pages
  if (html.length < 500) return;

  // lang attribute on <html>
  if (!html.match(/<html[^>]+lang=/i)) issues.missingLangAttr.push(rel);

  // Images missing alt
  var imgTags = html.match(/<img[^>]+>/gi) || [];
  var missingAlts = imgTags.filter(function(t) { return !t.includes('alt='); });
  if (missingAlts.length > 0) issues.imgMissingAlt.push(rel + ' (' + missingAlts.length + ' imgs)');

  // iframe without title
  var iframeTags = html.match(/<iframe[^>]+>/gi) || [];
  var noTitleIframes = iframeTags.filter(function(t) { return !t.includes('title='); });
  if (noTitleIframes.length > 0) issues.iframeNoTitle.push(rel + ' (' + noTitleIframes.length + ')');

  // H1 count
  var h1matches = html.match(/<h1[\s>]/gi) || [];
  if (h1matches.length === 0) issues.missingH1.push(rel);
  if (h1matches.length > 1) issues.duplicateH1.push(rel + ' (' + h1matches.length + ' h1s)');

  // Empty buttons
  var buttonTags = html.match(/<button[^>]*>(\s*)<\/button>/gi) || [];
  if (buttonTags.length > 0) issues.emptyButtons.push(rel + ' (' + buttonTags.length + ')');
});

Object.keys(issues).forEach(function(k) {
  if (issues[k].length === 0) return;
  console.log('\n=== ' + k + ' (' + issues[k].length + ') ===');
  issues[k].slice(0, 15).forEach(function(r) { console.log('  ' + r); });
  if (issues[k].length > 15) console.log('  ...and ' + (issues[k].length - 15) + ' more');
});

console.log('\nTotal pages audited: ' + files.length);
