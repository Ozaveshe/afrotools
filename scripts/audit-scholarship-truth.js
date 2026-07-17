const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCHOLARSHIP_TRUTH_SURFACES = [
  'tools/scholarship-finder/index.html',
  'fr/tools/recherche-bourses/index.html',
  'tools/index.html',
  'llms-full.txt',
  'assets/js/components/tool-registry.js',
  'assets/js/components/tool-registry.min.js',
  'assets/js/components/related-tools-data.js',
  'assets/js/components/related-tools-data.min.js',
  'netlify/functions/ai-advisor.js'
];

const FORBIDDEN_PATTERNS = [
  { label: '120+ Scholarships', pattern: /120\+\s*Scholarships?/i },
  { label: '120+ bourses', pattern: /120\+\s*bourses?/i },
  { label: '120+ opportunites', pattern: /120\+\s*opportunit/i },
  { label: 'plus de 120 bourses', pattern: /plus\s+de\s+120\s+bourses?/i },
  { label: 'plus de 120 opportunites', pattern: /plus\s+de\s+120\s+opportunit/i },
  { label: 'over 120 scholarships', pattern: /over\s+120\s+Scholarships?/i },
  { label: 'more than 120 scholarships', pattern: /more\s+than\s+120\s+Scholarships?/i }
];

const REQUIRED_COPY = [
  {
    file: 'tools/scholarship-finder/index.html',
    label: 'English badge default',
    pattern: /Checking Scholarships/
  },
  {
    file: 'fr/tools/recherche-bourses/index.html',
    label: 'French badge default',
    pattern: /Flux vérifié/
  }
];

function lineNumberFor(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function auditForbiddenClaims() {
  const failures = [];

  SCHOLARSHIP_TRUTH_SURFACES.forEach(function (relativePath) {
    const absolutePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(absolutePath)) {
      failures.push(relativePath + ': file missing');
      return;
    }

    const content = fs.readFileSync(absolutePath, 'utf8');
    FORBIDDEN_PATTERNS.forEach(function (entry) {
      const match = entry.pattern.exec(content);
      if (match) {
        failures.push(
          relativePath + ':' + lineNumberFor(content, match.index) +
          ': forbidden static scholarship claim "' + entry.label + '"'
        );
      }
    });
  });

  return failures;
}

function auditRequiredCopy() {
  const failures = [];

  REQUIRED_COPY.forEach(function (entry) {
    const absolutePath = path.join(ROOT, entry.file);
    if (!fs.existsSync(absolutePath)) {
      failures.push(entry.file + ': file missing');
      return;
    }

    const content = fs.readFileSync(absolutePath, 'utf8');
    if (!entry.pattern.test(content)) {
      failures.push(entry.file + ': missing required ' + entry.label);
    }
  });

  return failures;
}

const failures = auditForbiddenClaims().concat(auditRequiredCopy());

if (failures.length) {
  console.error('Scholarship truth audit failed:');
  failures.forEach(function (failure) {
    console.error('- ' + failure);
  });
  process.exit(1);
}

console.log('Scholarship truth audit passed: no inflated static scholarship-count claims in checked public surfaces.');
