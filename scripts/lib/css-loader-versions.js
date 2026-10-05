'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { assetContentVersion } = require('./asset-content-version');
const { writeFileSyncWithRetry } = require('./safe-write');

const LOADERS = [
  ['assets/js/lib/dark-mode.js', 'assets/css/theme-dark.min.css'],
  ['assets/js/pages/government-focus.js', 'assets/css/government-focus.css']
];

function buildStylesheetLoaderVersions(root = path.resolve(__dirname, '../..')) {
  const drafts = LOADERS.map(([loader, asset]) => {
    const version = assetContentVersion(root, asset);
    const source = fs.readFileSync(path.join(root, loader), 'utf8');
    const escaped = ('/' + asset).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped + '\\?v=[a-f0-9]{8}', 'g');
    const references = source.match(pattern) || [];
    if (references.length !== 1) throw new Error('Expected one versioned CSS reference in ' + loader);
    return { loader, asset, source, next: source.replace(pattern, '/' + asset + '?v=' + version), version };
  });
  let changed = 0;
  for (const draft of drafts) {
    if (draft.next === draft.source) continue;
    writeFileSyncWithRetry(path.join(root, draft.loader), draft.next, 'utf8');
    changed++;
  }
  console.log(`  CSSLOAD ${changed} loader version(s) updated`);
  return { changed, versions: drafts.map(({ loader, asset, version }) => ({ loader, asset, version })) };
}

module.exports = { buildStylesheetLoaderVersions };
