'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const REFERENCES = [
  'assets/css/tokens.css',
  'assets/css/global.css',
  'assets/css/design-system.css',
  'assets/css/navbar.css',
  'blog/assets/css/blog-typography.css',
  'assets/js/lazy-fonts.js',
  'assets/js/components/navbar.js'
];

function buildUiTypography() {
  const source = fs.readFileSync(path.join(ROOT, 'assets/fonts/typography.css'), 'utf8').replace(/\r\n?/g, '\n');
  const hash = crypto.createHash('md5').update(source).digest('hex').slice(0, 8);
  const href = `/assets/fonts/typography.css?v=${hash}`;
  let changed = 0;
  for (const relative of REFERENCES) {
    const file = path.join(ROOT, relative);
    const current = fs.readFileSync(file, 'utf8');
    const next = current.replace(/\/assets\/fonts\/typography\.css(?:\?v=[a-f0-9]{8})?/g, href);
    if (next !== current) {
      writeFileSyncWithRetry(file, next, 'utf8');
      changed++;
    }
  }
  console.log(`  TYPE   canonical stylesheet v=${hash}, ${changed} shared references updated`);
}

if (require.main === module) buildUiTypography();
module.exports = { buildUiTypography };
