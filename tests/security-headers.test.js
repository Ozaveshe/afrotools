#!/usr/bin/env node
/**
 * Security-headers regression test.
 *
 * Locks in the framing policy so a future edit to the global CSP can't silently
 * re-block the embeddable widget iframes (or accidentally weaken clickjacking
 * protection on normal pages).
 *
 * Guarantees:
 *   1. Global `/*` sends X-Frame-Options: SAMEORIGIN.
 *   2. Global `/*` CSP has NO `frame-ancestors` directive — otherwise, if Netlify
 *      merges duplicate CSP headers, it would intersect with the widget `*` and
 *      re-block cross-origin embedding.
 *   3. The public widget-embed paths relax framing: CSP `frame-ancestors *` and
 *      X-Frame-Options: ALLOWALL.
 *   4. Each widget CSP stays in sync with the global CSP (only `frame-ancestors`
 *      differs), so the widget pages keep the same script-src/connect-src/etc.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HEADERS_FILE = path.join(ROOT, '_headers');
const WIDGET_PATHS = ['/widgets/iframe/*', '/fr/widgets/iframe/*'];

const failures = [];
function assert(condition, message) {
  if (!condition) failures.push(message);
}

/** Parse a Netlify `_headers` file into { pathPattern: { headerNameLower: value } }. */
function parseHeaders(text) {
  const blocks = {};
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (/^\s/.test(raw)) {
      // Indented → a header line under the current path.
      const idx = raw.indexOf(':');
      if (idx > -1 && current) {
        const name = raw.slice(0, idx).trim().toLowerCase();
        blocks[current][name] = raw.slice(idx + 1).trim();
      }
    } else {
      // Column 0, non-comment → a path pattern.
      current = trimmed;
      blocks[current] = blocks[current] || {};
    }
  }
  return blocks;
}

/** Remove any frame-ancestors directive and normalise whitespace for comparison. */
function stripFrameAncestors(csp) {
  return String(csp || '')
    .replace(/frame-ancestors[^;]*;?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

assert(fs.existsSync(HEADERS_FILE), '_headers file is missing');
const blocks = fs.existsSync(HEADERS_FILE) ? parseHeaders(fs.readFileSync(HEADERS_FILE, 'utf8')) : {};

const globalBlock = blocks['/*'] || {};
const globalCsp = globalBlock['content-security-policy'] || '';

// 1. Global clickjacking protection.
assert(
  (globalBlock['x-frame-options'] || '').toUpperCase() === 'SAMEORIGIN',
  'Global /* must set X-Frame-Options: SAMEORIGIN'
);
assert(!!globalCsp, 'Global /* must define a Content-Security-Policy');

// 2. Global CSP must not pin frame-ancestors (would re-block widgets on header merge).
assert(
  !/frame-ancestors/i.test(globalCsp),
  'Global /* CSP must NOT contain a frame-ancestors directive (it would intersect with the widget frame-ancestors * and re-block cross-origin embedding). Control normal-page framing via X-Frame-Options only.'
);

// 3 + 4. Each widget-embed path relaxes framing and stays in sync with the global CSP.
for (const p of WIDGET_PATHS) {
  const block = blocks[p];
  assert(!!block, `_headers is missing a rule for ${p}`);
  if (!block) continue;

  const csp = block['content-security-policy'] || '';
  assert(!!csp, `${p} must define a Content-Security-Policy`);
  assert(
    /frame-ancestors\s+\*/i.test(csp),
    `${p} CSP must contain "frame-ancestors *" so publishers can embed the widget`
  );
  assert(
    (block['x-frame-options'] || '').toUpperCase() === 'ALLOWALL',
    `${p} must override X-Frame-Options to ALLOWALL`
  );
  assert(
    stripFrameAncestors(csp) === stripFrameAncestors(globalCsp),
    `${p} CSP has drifted from the global /* CSP. Apart from frame-ancestors they must match exactly — re-copy the global CSP and change only frame-ancestors to *.`
  );
}

if (failures.length) {
  console.error('security-headers.test.js FAILED:');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`security-headers.test.js passed (${WIDGET_PATHS.length} widget-embed paths verified in sync with global CSP).`);
