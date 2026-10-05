'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { minifyCss, shouldOptimizeCss } = require('../build-dist');

// CSS cache keys follow the same paired-file and size boundary as build-dist.
// JS retains its existing readable-source version contract.
function assetContentForDeployment(source, relative) {
  return shouldOptimizeCss(relative) && Buffer.byteLength(source) >= 100
    ? minifyCss(source)
    : source;
}

function assetContentVersion(root, relative) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  return crypto.createHash('md5')
    .update(assetContentForDeployment(source, relative).replace(/\r\n?/g, '\n'))
    .digest('hex').slice(0, 8);
}

function rewriteRelativeStylesheet(html, root, asset) {
  const pattern = /(<link rel="stylesheet" href=")style\.css\?v=[a-f0-9]{8}(">)/g;
  if ((html.match(pattern) || []).length !== 1) {
    throw new Error('Expected one versioned relative stylesheet for ' + asset);
  }
  return html.replace(pattern, (_, prefix, suffix) =>
    prefix + '/' + asset + '?v=' + assetContentVersion(root, asset) + suffix);
}

module.exports = { assetContentForDeployment, assetContentVersion, rewriteRelativeStylesheet };
