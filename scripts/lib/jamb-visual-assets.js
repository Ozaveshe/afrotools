'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const IMAGE_PATH = /^\/assets\/img\/jamb\/([a-f0-9]{64})\.svg$/;

function visualAssetHash(image) {
  return typeof image === 'string' ? image.match(IMAGE_PATH)?.[1] || null : null;
}

// This checks the exact source-reviewed bytes, not the mathematical meaning of a
// diagram. Editorial evidence and browser rendering checks remain separate.
function assertVisualAssetFiles(root, questions, ledger) {
  let count = 0;
  for (const question of questions) {
    if (!question.image) continue;
    const hash = visualAssetHash(question.image);
    if (!hash) throw new Error('Unsupported reviewed figure path: ' + question.id);
    const assetReview = ledger.questions?.[question.id]?.asset_review;
    if (assetReview?.content_sha256 !== hash) throw new Error('Figure review does not match its asset: ' + question.id);
    const sourceRoot = fs.realpathSync(root);
    const directory = fs.realpathSync(path.join(sourceRoot, 'assets/img/jamb'));
    if (path.relative(sourceRoot, directory) !== path.join('assets', 'img', 'jamb')) throw new Error('Figure directory resolves outside its source location');
    const file = fs.realpathSync(path.join(root, question.image.slice(1)));
    if (path.dirname(file) !== directory) throw new Error('Figure resolves outside its source directory: ' + question.id);
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size < 1 || stat.size > 65536) throw new Error('Invalid reviewed figure size: ' + question.id);
    const bytes = fs.readFileSync(file);
    if (crypto.createHash('sha256').update(bytes).digest('hex') !== hash) throw new Error('Reviewed figure bytes changed: ' + question.id);
    count++;
  }
  return count;
}

module.exports = { visualAssetHash, assertVisualAssetFiles };
