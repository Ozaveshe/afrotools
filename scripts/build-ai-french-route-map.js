#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry, renameSyncWithRetry } = require('./lib/safe-write');
const { buildFrenchAiRouteMap } = require('./lib/french-ai-route-map');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT, 'assets', 'js', 'ai', 'french-route-map.generated.js');

function render(result) {
  const payload = {
    schemaVersion: 1,
    locale: 'fr',
    source: result.report.source,
    report: result.report,
    routes: result.routes,
  };
  return `(function initFrenchRouteMap(root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AfroToolsAIFrenchRouteMap = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function createFrenchRouteMap() {
  "use strict";
  return Object.freeze(${JSON.stringify(payload)});
});
`;
}

function atomicWrite(filePath, content) {
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  writeFileSyncWithRetry(temporary, content, 'utf8');
  try {
    renameSyncWithRetry(temporary, filePath);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function generate(options = {}) {
  const result = buildFrenchAiRouteMap(options);
  if (!result.routes['/search/']) throw new Error('French AI route map requires an indexable /search/ equivalent.');
  if (result.report.mappedRoutes < 100) {
    throw new Error(`French AI route map is unexpectedly small (${result.report.mappedRoutes} routes).`);
  }

  const content = render(result);
  const current = fs.existsSync(OUTPUT_PATH) ? fs.readFileSync(OUTPUT_PATH, 'utf8') : '';
  if (options.check) {
    if (current !== content) throw new Error('French AI route map is stale. Run npm run ai:french-routes:build.');
  } else if (current !== content) {
    atomicWrite(OUTPUT_PATH, content);
  }

  console.log(JSON.stringify(result.report, null, 2));
  if (result.ambiguousRoutes.length) {
    const examples = result.ambiguousRoutes.slice(0, 5).map((item) => item.englishRoute);
    console.warn(`Omitted ${result.ambiguousRoutes.length} ambiguous French equivalence(s): ${examples.join(', ')}`);
  }
  return Object.assign({ content, changed: current !== content }, result);
}

function main() {
  try {
    generate({ check: process.argv.includes('--check') });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { generate, render };
