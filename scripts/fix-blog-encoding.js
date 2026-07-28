const fs = require('fs');
const path = require('path');

const { buildPairs, assertSafePairs, applyPairs } = require('./lib/mojibake');

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'blog');

// Keyed by the character the blog HTML *should* contain. The mojibake form
// actually present in the files is derived in ./lib/mojibake, so this table
// cannot decay into ASCII search keys the way its hard-coded predecessor did.
const REPLACEMENTS = assertSafePairs(buildPairs({
  '—': '&mdash;',
  '–': '&ndash;',
  '’': '&rsquo;',
  '‘': '&lsquo;',
  '“': '&ldquo;',
  '”': '&rdquo;',
  '…': '&hellip;',
  '£': '&pound;',
  '€': '&euro;',
  '₦': '&#8358;',
  'É': '&Eacute;',
  'é': '&eacute;',
  'è': '&egrave;',
  'ê': '&ecirc;',
  'ë': '&euml;',
  'À': '&Agrave;',
  'à': '&agrave;',
  'â': '&acirc;',
  'Ç': '&Ccedil;',
  'ç': '&ccedil;',
  'Î': '&Icirc;',
  'î': '&icirc;',
  'Ï': '&Iuml;',
  'ï': '&iuml;',
  'Ô': '&Ocirc;',
  'ô': '&ocirc;',
  'Ù': '&Ugrave;',
  'ù': '&ugrave;',
  'Û': '&Ucirc;',
  'û': '&ucirc;',
  ' ': '&nbsp;'
}), 'fix-blog-encoding');

const WRITE = process.argv.includes('--write');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'assets') return [];
      return walk(fullPath);
    }
    return entry.name === 'index.html' ? [fullPath] : [];
  });
}

function main() {
  const files = walk(BLOG_DIR);
  let changedFiles = 0;
  let replacementsApplied = 0;

  for (const filePath of files) {
    const original = fs.readFileSync(filePath, 'utf8');
    const [next, occurrences] = applyPairs(original, REPLACEMENTS);
    replacementsApplied += occurrences;

    if (next !== original) {
      if (WRITE) fs.writeFileSync(filePath, next);
      changedFiles += 1;
    }
  }

  console.log(`${WRITE ? 'Updated' : 'Would update'} ${changedFiles} files.`);
  console.log(`${WRITE ? 'Applied' : 'Found'} ${replacementsApplied} encoding replacements.`);
  if (!WRITE && changedFiles) console.log('Dry run. Pass --write to apply.');
}

main();
