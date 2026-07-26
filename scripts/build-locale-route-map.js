#!/usr/bin/env node
/**
 * Build the locale route map consumed by the `route-fallback` edge function.
 *
 * Why this exists
 * ---------------
 * Old language-switcher builds emitted "prefix-swapped" URLs: they took the
 * current path and swapped only the leading /fr|/sw|/ha|/yo segment, which
 * produces paths that never existed — /ha/zana/kikokotoo-vat/ (Hausa prefix on
 * a Swahili path), /tools/generateur-boq/ (English prefix on a French slug),
 * /mauritius/kikokotoo-vat/ (no prefix on a Swahili slug). Search Console had
 * 2,194 of these as "Not found (404)" on 2026-07-26.
 *
 * `_redirects` cannot express "try this path body under every locale prefix",
 * so the hand-written catch-alls (`/ha/* /:splat`) blindly stripped the prefix
 * and 301'd straight into another 404. This map lets the edge function resolve
 * a path body to the locale that actually owns it, and verify the target
 * returns 200 before redirecting.
 *
 * Output: netlify/edge-functions/locale-route-map.js
 *
 *   export default { "<normalized path body>": "<prefix flags>" }
 *   export const ALIASES = { "<normalized path body>": "<canonical route>" }
 *
 * Prefix flags are a comma-free string of entries, one per locale that owns the
 * body: a locale letter (e=root/English, f=fr, s=sw, h=ha, y=yo) optionally
 * followed by "/" when the canonical route is a directory (trailing slash).
 * "e/f/s" means /body/, /fr/body/ and /sw/body all exist.
 *
 * ALIASES covers country pages that publish a tax calculator under the country
 * code rather than the localized slug. 22 French country dirs publish
 * `calculateur-salaire-net`/`calculateur-tva`; the other 41/43 publish only
 * `xx-paye`/`xx-vat` and are self-consistent (canonical and hreflang both point
 * at the country-code route). The localized slug is still a URL Google learned
 * from the old prefix-swapped switcher, so it has to resolve. Keyed by path
 * body, so /fr/rwanda/…, /ha/rwanda/… and the bare /rwanda/… all resolve.
 *
 * Usage:
 *   node scripts/build-locale-route-map.js          # write
 *   node scripts/build-locale-route-map.js --check  # fail if stale
 */
const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const OUT_PATH = path.join(ROOT, 'netlify', 'edge-functions', 'locale-route-map.js');

// Must mirror BLOCKED_ROOT_DIRS in scripts/build-dist.js — a route that is not
// copied into dist/ must never become a redirect target.
const BLOCKED_ROOT_DIRS = new Set([
  '.agents', '.claude', '.codex', '.git', '.github', '.jamb', '.jamb-tools',
  '.playwright', '.playwright-cli', '.tmp-validation', 'admin',
  'afrotools-sentinel', 'artifacts', 'audit-results', 'dist', 'docs', 'lang',
  'netlify', 'node_modules', 'ops', 'output', 'prompts', 'reports', 'scripts',
  'supabase', 'test-results', 'tests'
]);

const LOCALE_LETTER = { fr: 'f', sw: 's', ha: 'h', yo: 'y' };
const LOCALES = Object.keys(LOCALE_LETTER);

// Paths that must never be relocated across locales: they are not content
// pages and a cross-locale guess would be meaningless.
const EXCLUDED_TOP = new Set(['assets', 'api', 'og-image', '404']);

// Localized country-page slugs and the country-code page they stand in for.
// Only populated where a locale actually uses both forms: French is the only
// one with a gap (22 dirs carry the slug, the rest carry only xx-paye/xx-vat).
// Swahili already publishes its slug for every country dir, and Hausa/Yoruba
// do not use country-level tax slugs at all — so neither needs an alias.
const SLUG_FAMILIES = {
  fr: [
    ['calculateur-salaire-net', 'paye'],
    ['calculateur-tva', 'vat']
  ]
};

/** Collect every deployable HTML route as a path with no trailing slash. */
function collectRoutes() {
  const routes = [];
  const walk = (dir, rel) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (rel === '' && BLOCKED_ROOT_DIRS.has(entry.name)) continue;
        if (entry.name === 'node_modules' || entry.name === 'assets') continue;
        walk(abs, `${rel}/${entry.name}`);
        continue;
      }
      if (entry.name === 'index.html') {
        if (rel) routes.push({ route: `${rel}/`, dir: true });
      } else if (entry.name.endsWith('.html')) {
        routes.push({ route: `${rel}/${entry.name.slice(0, -5)}`, dir: false });
      }
    }
  };
  walk(ROOT, '');
  return routes;
}

/** Normalize a request path or route into a comparable map key. */
function normalizeBody(value) {
  let body = String(value || '').toLowerCase();
  body = body.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  body = body.replace(/\/+$/, '');
  return body || '/';
}

function build() {
  const map = new Map();
  let skipped = 0;

  for (const { route, dir } of collectRoutes()) {
    const segments = route.split('/').filter(Boolean);
    if (!segments.length) continue;

    const isLocale = LOCALES.includes(segments[0]);
    const prefix = isLocale ? segments[0] : 'en';
    const bodySegments = isLocale ? segments.slice(1) : segments;
    if (!bodySegments.length) continue; // locale home pages: nothing to relocate
    if (EXCLUDED_TOP.has(bodySegments[0])) {
      skipped += 1;
      continue;
    }

    const key = normalizeBody(`/${bodySegments.join('/')}`);
    if (key === '/') continue;

    const letter = prefix === 'en' ? 'e' : LOCALE_LETTER[prefix];
    const entry = letter + (dir ? '/' : '');
    const existing = map.get(key) || [];
    // A directory route wins over a same-locale .html route: /x/ is canonical.
    const sameLocale = existing.findIndex((item) => item[0] === letter);
    if (sameLocale === -1) existing.push(entry);
    else if (dir) existing[sameLocale] = entry;
    map.set(key, existing);
  }

  const sorted = [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const payload = {};
  for (const [key, entries] of sorted) payload[key] = entries.join('');

  return { payload, count: sorted.length, skipped, aliases: buildAliases(payload) };
}

/**
 * Map a localized country slug that a given country does not publish onto the
 * country-code page it stands in for (/rwanda/calculateur-salaire-net ->
 * /fr/rwanda/rw-paye). Skips any body the route map already covers, so a real
 * page is never aliased away.
 */
function buildAliases(routeBodies) {
  const aliases = {};
  for (const [locale, families] of Object.entries(SLUG_FAMILIES)) {
    let countryDirs;
    try {
      countryDirs = fs.readdirSync(path.join(ROOT, locale), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    } catch {
      continue;
    }
    for (const country of countryDirs) {
      const files = fs.readdirSync(path.join(ROOT, locale, country));
      for (const [slug, code] of families) {
        if (files.includes(`${slug}.html`) || files.includes(slug)) continue;
        const key = normalizeBody(`/${country}/${slug}`);
        if (routeBodies[key]) continue; // some locale really publishes it
        const match = files.find((name) => new RegExp(`^[a-z]{2}-${code}(\\.html)?$`).test(name));
        if (!match) continue;
        const isDirectory = !match.endsWith('.html');
        aliases[key] = `/${locale}/${country}/${match.replace(/\.html$/, '')}${isDirectory ? '/' : ''}`;
      }
    }
  }
  return Object.fromEntries(Object.entries(aliases).sort((a, b) => (a[0] < b[0] ? -1 : 1)));
}

function render({ payload, count, aliases }) {
  return `// GENERATED FILE — do not edit by hand.
// Source: scripts/build-locale-route-map.js (npm run locale:route-map)
// Routes: ${count}  Aliases: ${Object.keys(aliases).length}
//
// Maps a normalized path body (no locale prefix, no trailing slash, no .html)
// to the locale prefixes that actually publish it. Letters: e=root/English,
// f=/fr, s=/sw, h=/ha, y=/yo. A trailing "/" after a letter means that
// locale's canonical route is a directory and keeps its trailing slash.
export default ${JSON.stringify(payload)};

// Localized country slugs that resolve to a country-code page instead, for
// countries that publish only the country-code form. Values are canonical
// routes, already prefixed.
export const ALIASES = ${JSON.stringify(aliases)};
`;
}

function main() {
  const check = process.argv.includes('--check');
  const result = build();

  // Guard against a walk failure silently emptying the map and disabling the
  // whole locale fallback.
  if (result.count < 5000) {
    console.error(`build-locale-route-map: only ${result.count} routes collected — refusing to write a truncated map.`);
    process.exit(1);
  }

  const next = render(result);
  const current = fs.existsSync(OUT_PATH) ? fs.readFileSync(OUT_PATH, 'utf8') : '';

  if (check) {
    if (current !== next) {
      console.error('build-locale-route-map: netlify/edge-functions/locale-route-map.js is stale. Run `npm run locale:route-map`.');
      process.exit(1);
    }
    console.log(`build-locale-route-map: up to date (${result.count} routes).`);
    return;
  }

  if (current === next) {
    console.log(`build-locale-route-map: unchanged (${result.count} routes).`);
    return;
  }

  writeFileSyncWithRetry(OUT_PATH, next, 'utf8');
  console.log(`build-locale-route-map: wrote ${result.count} routes (${(next.length / 1024).toFixed(0)} KB).`);
}

main();
