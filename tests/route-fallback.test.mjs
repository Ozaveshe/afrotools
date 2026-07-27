// Regression test for the `route-fallback` edge function.
//
// The function is the only thing standing between a cross-locale phantom URL
// and a 404, and it runs on every request. Two things must hold:
//   1. It never redirects a real published route away from itself.
//   2. It resolves prefix-swapped phantom paths to the locale that owns them.
//
// Run: node tests/route-fallback.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EDGE_DIR = path.join(ROOT, 'netlify', 'edge-functions');
const ROUTE_MAP_PATH = path.join(EDGE_DIR, '_shared', 'locale-route-map.js');

// Must mirror BLOCKED_ROOT_DIRS in scripts/build-locale-route-map.js.
const BLOCKED_ROOT_DIRS = new Set([
  '.agents', '.claude', '.codex', '.git', '.github', '.jamb', '.jamb-tools',
  '.playwright', '.playwright-cli', '.tmp-validation', 'admin',
  'afrotools-sentinel', 'artifacts', 'audit-results', 'dist', 'docs', 'lang',
  'netlify', 'node_modules', 'ops', 'output', 'prompts', 'reports', 'scripts',
  'supabase', 'test-results', 'tests'
]);

function collectServedRoutes() {
  const served = new Set();
  const walk = (dir, rel) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      if (entry.isDirectory()) {
        if (rel === '' && BLOCKED_ROOT_DIRS.has(entry.name)) continue;
        if (entry.name === 'node_modules' || entry.name === 'assets') continue;
        walk(path.join(dir, entry.name), `${rel}/${entry.name}`);
      } else if (entry.name === 'index.html') {
        served.add(`${rel}/`);
      } else if (entry.name.endsWith('.html')) {
        served.add(`${rel}/${entry.name}`);
        served.add(`${rel}/${entry.name.slice(0, -5)}`);
      }
    }
  };
  walk(ROOT, '');
  return served;
}

const served = collectServedRoutes();

/** Stand-in for Netlify's origin: exact match, or Pretty URLs serving foo.html for /foo. */
function originStatus(pathname) {
  if (served.has(pathname)) return 200;
  if (!pathname.endsWith('/') && served.has(`${pathname}.html`)) return 200;
  return 404;
}

// Netlify runs edge functions on Deno, which treats a bare .js file as ESM.
// Node does not, so load the module by inlining its one import (the generated
// route map) and evaluating the result as a data: URL. This also asserts the
// generated map still has the shape the function expects.
async function loadRouteFallback() {
  assert.equal(
    fs.existsSync(path.join(EDGE_DIR, 'locale-route-map.js')),
    false,
    'generated route-map data must stay outside top-level Edge Function discovery'
  );
  const mapSource = fs.readFileSync(ROUTE_MAP_PATH, 'utf8');
  const marker = 'export default ';
  const start = mapSource.indexOf(marker);
  assert.ok(start !== -1, 'locale-route-map.js must have a default export');
  const end = mapSource.indexOf('\n', start);
  const map = JSON.parse(mapSource.slice(start + marker.length, end).trim().replace(/;$/, ''));
  assert.ok(Object.keys(map).length > 5000, 'locale-route-map.js looks truncated');

  const aliasMatch = mapSource.match(/export const ALIASES = (\{.*\});/);
  assert.ok(aliasMatch, 'locale-route-map.js must export ALIASES');
  const aliases = JSON.parse(aliasMatch[1]);

  const fnSource = fs.readFileSync(path.join(EDGE_DIR, 'route-fallback.js'), 'utf8');
  const inlined = fnSource.replace(
    /^import LOCALE_ROUTES.*$/m,
    `const LOCALE_ROUTES = ${JSON.stringify(map)};\nconst ALIASES = ${JSON.stringify(aliases)};`
  );
  assert.notEqual(inlined, fnSource, 'route-fallback.js must import the generated route map');
  const module = await import(`data:text/javascript,${encodeURIComponent(inlined)}`);
  return module.default;
}

const routeFallback = await loadRouteFallback();

async function request(pathname) {
  const context = {
    next: async (req) => new Response(null, {
      status: originStatus(req ? new URL(req.url).pathname : pathname)
    })
  };
  const response = await routeFallback(new Request(`https://afrotools.com${pathname}`), context);
  return { status: response.status, location: response.headers.get('Location') };
}

let failures = 0;
function check(label, actual, expected) {
  try {
    assert.deepEqual(actual, expected);
  } catch {
    failures += 1;
    console.error(`FAIL ${label}\n  expected ${JSON.stringify(expected)}\n  actual   ${JSON.stringify(actual)}`);
  }
}

// ── 1. Real routes are never redirected away ────────────────────────────────
let redirectedRealRoutes = 0;
for (const route of served) {
  if (route.endsWith('.html')) continue; // canonical form is the extensionless/dir route
  const { status, location } = await request(route);
  if (status !== 200 && status !== 404) {
    if (redirectedRealRoutes < 10) console.error(`FAIL real route redirected: ${route} -> ${location}`);
    redirectedRealRoutes += 1;
  }
}
check('no real route is redirected away', redirectedRealRoutes, 0);

// ── 2. Phantom cross-locale paths resolve to the owning locale ──────────────
// Each case is a shape that Search Console reported as "Not found (404)".
const cases = [
  // Hausa prefix on a Swahili path.
  ['/ha/zana/kikokotoo-lobola-na-mahari/', '/sw/zana/kikokotoo-lobola-na-mahari/'],
  // Yoruba prefix on a Swahili path.
  ['/yo/zana/kifuatiliaji-mvua/', '/sw/zana/kifuatiliaji-mvua/'],
  // No prefix on a Swahili path.
  ['/mauritius/kikokotoo-vat/', '/sw/mauritius/kikokotoo-vat/'],
  // English namespace on a French slug.
  ['/tools/generateur-boq/', '/fr/tools/generateur-boq/'],
  // Hausa prefix on a French path.
  ['/ha/tools/suivi-carburant/guinea-bissau/', '/fr/tools/suivi-carburant/guinea-bissau/'],
  // No prefix on a Hausa path.
  ['/kayan-aiki/sickle-cell/', '/ha/kayan-aiki/sickle-cell/'],
  // Locale prefix on an English-only page falls back to English.
  ['/ha/benin/bj-paye', '/benin/bj-paye'],
  // .html request resolves to the canonical extensionless route in the right locale.
  ['/mali/calculateur-tva.html', '/fr/mali/calculateur-tva'],
  ['/yo/maroc/calculateur-salaire-net.html', '/fr/maroc/calculateur-salaire-net'],
  // Trailing-slash enforcement still works.
  ['/tools/vat-calculator', '/tools/vat-calculator/'],
  // A French country slug the country does not publish resolves to its
  // country-code page, from any prefix and from none.
  ['/fr/rwanda/calculateur-salaire-net', '/fr/rwanda/rw-paye'],
  ['/rwanda/calculateur-salaire-net', '/fr/rwanda/rw-paye'],
  ['/ha/rwanda/calculateur-tva', '/fr/rwanda/rw-vat']
];

for (const [from, to] of cases) {
  const { status, location } = await request(from);
  check(`${from} -> ${to}`, { status, location }, { status: 301, location: `https://afrotools.com${to}` });
}

// ── 3. Explicit static redirects win over cross-locale recovery ────────────
// Explicit static redirects must win over cross-locale recovery. Netlify
// evaluates the Edge Function before `_redirects`; the first context.next()
// call represents that static alias, while a request argument would mean the
// locale map tried to steal the route first.
for (const [from, explicitTarget] of [
  ['/fr/tools/remittance-v2', '/fr/tools/transfert-v2/'],
  ['/sw/tools/vat-calculator', '/sw/zana/kikokotoo-vat/']
]) {
  let calls = 0;
  const response = await routeFallback(
    new Request(`https://afrotools.com${from}`),
    {
      next: async (req) => {
        calls += 1;
        if (req) return new Response(null, { status: 200 });
        return new Response(null, {
          status: 301,
          headers: { Location: `https://afrotools.com${explicitTarget}` }
        });
      }
    }
  );
  check(
    `${from} preserves its explicit static redirect`,
    {
      status: response.status,
      location: response.headers.get('Location'),
      calls
    },
    {
      status: 301,
      location: `https://afrotools.com${explicitTarget}`,
      calls: 1
    }
  );
}

// ── 4. Paths with no target still 404 — never a redirect into another 404 ───
for (const dead of ['/nonexistent-page/', '/fr/nonexistent-page/', '/bin/sh']) {
  const { status } = await request(dead);
  check(`${dead} stays 404`, status, 404);
}

// ── 5. Assets and API routes are passed straight through ────────────────────
for (const passthrough of ['/assets/js/app.js', '/api/forex', '/.netlify/functions/ai-advisor']) {
  const { status } = await request(passthrough);
  check(`${passthrough} passes through`, status, 404); // origin's answer, unmodified
}

if (failures) {
  console.error(`\nroute-fallback: ${failures} check(s) failed.`);
  process.exit(1);
}
console.log(`route-fallback: all checks passed (${served.size} routes verified non-redirecting).`);
