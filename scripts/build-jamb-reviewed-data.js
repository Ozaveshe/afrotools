#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildPublications, validatePublication } = require('./lib/jamb-publication');
const { assertVisualAssetFiles } = require('./lib/jamb-visual-assets');
const { writeFileSyncWithRetry, renameSyncWithRetry, unlinkSyncWithRetry } = require('./lib/safe-write');
const ROOT = path.resolve(__dirname, '..');

function build(root = ROOT, check = false) {
  const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
  const ledger = read('data/jamb/review-ledger.json');
  const result = buildPublications(read('ops/jamb/source-pool.json'), read('ops/jamb/source-flashcards.json'), ledger);
  assertVisualAssetFiles(root, result.files['pools/practice-pool.json'].questions, ledger);
  // Validate the complete set before replacing any output. CI --check detects a
  // partially interrupted generation; clients reject mixed publication revisions.
  for (const payload of Object.values(result.files)) validatePublication(payload, result.revision);
  for (const [relative, payload] of Object.entries(result.files)) {
    const target = path.join(root, 'data/jamb', relative);
    const text = JSON.stringify(payload, null, 2) + '\n';
    if (check) {
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== text) throw new Error('Missing/stale reviewed publication: ' + relative);
    } else if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== text) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const temporary = target + '.review-tmp-' + process.pid;
      try {
        writeFileSyncWithRetry(temporary, text, 'utf8');
        validatePublication(JSON.parse(fs.readFileSync(temporary, 'utf8')), result.revision);
        renameSyncWithRetry(temporary, target);
      } finally { unlinkSyncWithRetry(temporary); }
    }
  }
  return { review_revision: result.revision, eligible: result.audit.eligible, quarantined: result.audit.quarantined,
    flashcards: result.files['flashcard-decks.json'].decks.reduce((n, deck) => n + deck.cards.length, 0), files: Object.keys(result.files).length };
}
if (require.main === module) console.log(JSON.stringify(build(ROOT, process.argv.includes('--check')), null, 2));
module.exports = { build };
