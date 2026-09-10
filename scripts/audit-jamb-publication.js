#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildPublications, validatePublication } = require('./lib/jamb-publication');
const { questionFingerprint: digest } = require('./lib/jamb-content-trust');
const ROOT = path.resolve(__dirname, '..');

function audit(target = path.join(ROOT, 'dist'), root = ROOT) {
  const read = (base, name) => JSON.parse(fs.readFileSync(path.join(base, name), 'utf8'));
  const expected = buildPublications(read(root, 'ops/jamb/source-pool.json'), read(root, 'ops/jamb/source-flashcards.json'), read(root, 'data/jamb/review-ledger.json'));
  for (const [name, payload] of Object.entries(expected.files)) {
    const actual = read(target, 'data/jamb/' + name);
    validatePublication(actual, expected.revision);
    if (digest(actual) !== digest(payload)) throw new Error('Published JAMB data differs from reviewed source: ' + name);
  }
  const allowed = new Set([...Object.keys(expected.files), 'universities.json']);
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (!allowed.has(path.relative(path.join(target, 'data/jamb'), file).replace(/\\/g, '/'))) {
        throw new Error('Unapproved JAMB file in public artifact: ' + entry.name);
      }
    }
  }
  walk(path.join(target, 'data/jamb'));
  if (fs.existsSync(path.join(target, 'ops/jamb'))) throw new Error('Private JAMB source present in public artifact');
  return { files: Object.keys(expected.files).length, reviewed: expected.audit.eligible, review_revision: expected.revision };
}
if (require.main === module) console.log(JSON.stringify(audit(), null, 2));
module.exports = { audit };
