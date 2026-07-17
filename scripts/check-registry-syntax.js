// Scan tool-registry.js for single-quoted strings containing unescaped apostrophes
var fs = require('fs');
var content = fs.readFileSync('assets/js/components/tool-registry.js', 'utf8');
var lines = content.split('\n');
var issues = [];

lines.forEach(function(line, i) {
  // Find single-quoted string values that contain apostrophes
  // Pattern: value: 'text with it's apostrophe'
  var re = /:\s*'([^'\\]*)'/g;
  var m;
  while ((m = re.exec(line)) !== null) {
    var val = m[1];
    // An apostrophe inside wouldn't be captured by [^'\\]* so this is fine
    // But check for the overall line having mismatched quotes
  }

  // Simpler approach: check if any single-quoted string breaks
  // Look for: 'word word's word' — apostrophe within single-quoted field
  var badPattern = /'[^']*[a-z]'[a-z][^']*'/g;
  var m2;
  while ((m2 = badPattern.exec(line)) !== null) {
    issues.push('Line ' + (i+1) + ': ' + line.trim().substring(0, 120));
    break;
  }
});

if (issues.length === 0) {
  console.log('No apostrophe issues found!');
} else {
  console.log('Potential apostrophe issues (' + issues.length + '):');
  issues.forEach(function(i) { console.log('  ' + i); });
}

// Also try to parse it as a module
try {
  var fn = new Function(content + '; return AFRO_TOOLS;');
  var tools = fn();
  console.log('\nRegistry parses OK! Total tools: ' + tools.length);
} catch(e) {
  console.log('\nParse ERROR: ' + e.message);
}
