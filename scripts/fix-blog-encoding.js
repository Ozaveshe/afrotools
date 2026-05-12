const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'blog');

const REPLACEMENTS = [
  ['-', '&mdash;'],
  ['-', '&ndash;'],
  [''', '&rsquo;'],
  ['"', '&ldquo;'],
  ['â€\x9d', '&rdquo;'],
  ['â€¦', '&hellip;'],
  ['£', '&pound;'],
  ['-', '&euro;'],
  ['-', '&#8358;'],
  ['Ã‰', '&Eacute;'],
  ['e', '&eacute;'],
  ['e', '&egrave;'],
  ['e', '&ecirc;'],
  ['e', '&euml;'],
  ['Ã€', '&Agrave;'],
  ['Ã ', '&Agrave;'],
  ['a', '&agrave;'],
  ['a', '&acirc;'],
  ['Ã‡', '&Ccedil;'],
  ['c', '&ccedil;'],
  ['ÃŽ', '&Icirc;'],
  ['Ã®', '&icirc;'],
  ['Ã-', '&Iuml;'],
  ['i', '&iuml;'],
  ['Ã”', '&Ocirc;'],
  ['o', '&ocirc;'],
  ['Ã™', '&Ugrave;'],
  ['Ã¹', '&ugrave;'],
  ['Ã›', '&Ucirc;'],
  ['u', '&ucirc;'],
  ['Â', '']
];

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
    let next = original;

    for (const [from, to] of REPLACEMENTS) {
      if (!next.includes(from)) continue;
      const occurrences = next.split(from).length - 1;
      next = next.split(from).join(to);
      replacementsApplied += occurrences;
    }

    if (next !== original) {
      fs.writeFileSync(filePath, next);
      changedFiles += 1;
    }
  }

  console.log(`Updated ${changedFiles} files.`);
  console.log(`Applied ${replacementsApplied} encoding replacements.`);
}

main();
