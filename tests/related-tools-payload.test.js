#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const component = fs.readFileSync(path.join(root, 'assets/js/components/related-tools.js'), 'utf8');
const prune = fs.readFileSync(path.join(root, 'scripts/prune-unused-registry.js'), 'utf8');

assert.match(component, /IntersectionObserver/, 'related tools dataset should be viewport-lazy');
assert.match(component, /related-tools-data\.min\.js/, 'component should retain a deferred dataset source');
assert.doesNotMatch(prune, /const RELATED_DATA_SCRIPT\s*=/, 'prune step must not inject the eager dataset');

const eager = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['node_modules', 'dist'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html') && /<script\b[^>]*src=["'][^"']*related-tools-data(?:\.min)?\.js/i.test(fs.readFileSync(full, 'utf8'))) {
      eager.push(path.relative(root, full));
    }
  }
}
walk(root);
assert.deepStrictEqual(eager, [], `eager related-tools dataset references remain:\n${eager.slice(0, 10).join('\n')}`);
console.log('related tools payload: PASS (zero eager dataset references)');
