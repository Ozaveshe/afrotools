// Route fallback: cross-locale phantom-path recovery + trailing-slash enforcement.
//
// 1. Locale relocation. Old language-switcher builds emitted prefix-swapped
//    URLs — they replaced only the leading /fr|/sw|/ha|/yo segment and left the
//    rest of the path alone, producing paths that never existed:
//      /ha/zana/kikokotoo-vat/   Hausa prefix, Swahili path
//      /tools/generateur-boq/    English prefix, French slug
//      /mauritius/kikokotoo-vat/ no prefix, Swahili slug
//    `_redirects` cannot express "try this path body under every locale
//    prefix", so the old catch-alls (`/ha/*  /:splat`) stripped the prefix and
//    301'd into a second 404. LOCALE_ROUTES records which locales actually
//    publish each path body, so we can send the request to the one that does —
//    and we verify the target returns 200 before issuing the redirect, so a
//    stale map can never produce a redirect chain or a loop.
//
// 2. Trailing slash on directory paths, unchanged from the original
//    trailing-slash function: only redirect when the origin would 404 and the
//    trailing-slash form actually resolves.
import LOCALE_ROUTES, { ALIASES } from './_shared/locale-route-map.js';

// Locale path prefix -> map letter. 'e' is the unprefixed (English) root.
const LOCALE_LETTERS = { fr: 'f', sw: 's', ha: 'h', yo: 'y' };
const LETTER_PREFIXES = { e: '', f: '/fr', s: '/sw', h: '/ha', y: '/yo' };
// Preference when the requested locale does not publish the body: English
// first (the site's documented fallback), then the launched locales.
const PREFERENCE = ['e', 'f', 's', 'h', 'y'];

const ASSET_EXTENSION = /\.(?:js|mjs|css|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|eot|map|json|xml|txt|pdf|mp4|webm|mp3|zip|csv|wasm)$/i;

function isSkippablePath(path) {
  return (
    path.startsWith('/.netlify/') ||
    path.startsWith('/api/') ||
    path.startsWith('/assets/') ||
    ASSET_EXTENSION.test(path)
  );
}

/** Normalize a path into a LOCALE_ROUTES key: lowercase, no /index.html, no .html, no trailing slash. */
function normalizeBody(value) {
  const body = String(value || '')
    .toLowerCase()
    .replace(/\/index\.html$/, '/')
    .replace(/\.html$/, '')
    .replace(/\/+$/, '');
  return body || '/';
}

/** Decode a map value ("e/f/s") into [{ letter, directory }]. */
function decodeOwners(value) {
  const owners = [];
  for (let i = 0; i < value.length; i += 1) {
    const letter = value[i];
    const directory = value[i + 1] === '/';
    if (directory) i += 1;
    owners.push({ letter, directory });
  }
  return owners;
}

/**
 * Resolve a request path to the route that actually serves it.
 * Returns null when the requested path is itself a known route (the origin
 * should serve it) or when nothing publishes the body.
 */
function resolveLocaleRoute(path) {
  const segments = path.split('/').filter(Boolean);
  if (!segments.length) return null;

  const requestedLocale = Object.prototype.hasOwnProperty.call(LOCALE_LETTERS, segments[0])
    ? segments[0]
    : null;
  const bodySegments = requestedLocale ? segments.slice(1) : segments;
  if (!bodySegments.length) return null; // a locale home page, nothing to relocate

  const key = normalizeBody(`/${bodySegments.join('/')}`);
  const encoded = LOCALE_ROUTES[key];

  if (encoded) {
    const owners = decodeOwners(encoded);
    const requestedLetter = requestedLocale ? LOCALE_LETTERS[requestedLocale] : 'e';
    // The requested locale publishes this body — let the origin serve it.
    if (owners.some((owner) => owner.letter === requestedLetter)) return null;

    for (const letter of PREFERENCE) {
      const owner = owners.find((candidate) => candidate.letter === letter);
      if (owner) return `${LETTER_PREFIXES[letter]}${key}${owner.directory ? '/' : ''}`;
    }
    return null;
  }

  // No locale publishes this body under any prefix. It may still be a localized
  // country slug standing in for a country-code page — /rwanda/calculateur-salaire-net
  // is Rwanda's French PAYE page under the name 22 other French country dirs use.
  return ALIASES[key] || null;
}

function permanentRedirect(url) {
  return new Response(null, { status: 301, headers: { Location: url.toString() } });
}

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  if (isSkippablePath(path)) return context.next();

  // Give real files, rewrites, and explicit `_redirects` rules first refusal.
  // Edge Functions run before Netlify's static redirect layer. Relocating from
  // the generated locale map before calling `context.next()` can otherwise
  // steal deliberate aliases such as:
  //   /fr/tools/remittance-v2 -> /fr/tools/transfert-v2/
  // Locale recovery is only a fallback for an origin-level 404.
  const originResponse = await context.next();
  if (originResponse.status !== 404) return originResponse;

  // ── 1. Cross-locale relocation ──────────────────────────────────────────
  const relocated = resolveLocaleRoute(path);
  if (relocated && normalizeBody(relocated) !== normalizeBody(path)) {
    const target = new URL(url);
    target.pathname = relocated;
    // Only redirect to a target that actually serves content. This is what
    // keeps a stale map from producing a 301 into a 404 (or a loop).
    const probe = await context.next(new Request(target.toString(), request));
    if (probe.status === 200) return permanentRedirect(target);
  }

  // ── 2. Trailing slash on directory paths ────────────────────────────────
  if (path.endsWith('/') || path.includes('.')) return originResponse;

  // Only redirect when the trailing-slash form resolves to real content —
  // prevents loops where /foo/ also 404s and redirects back.
  const trailingUrl = new URL(url);
  trailingUrl.pathname = `${path}/`;
  const trailingResponse = await context.next(new Request(trailingUrl.toString(), request));
  if (trailingResponse.ok) return permanentRedirect(trailingUrl);

  return originResponse;
};
