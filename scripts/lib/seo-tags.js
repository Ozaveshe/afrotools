'use strict';

// Canonical / og:url tag upserts, extracted from scripts/seo-daily-fix.js so the
// idempotence contract below can be tested directly.
//
// THE CONTRACT: rewrite a tag only when the URL actually changes.
//
// These run unattended against main every day. An earlier version rewrote the
// matched tag unconditionally, which normalised `<meta ... />` into `<meta ... >`
// even when the URL was already correct. That is a no-op for SEO but changes the
// file byte-for-byte -- and the site build re-emits the self-closing form, so bot
// and build overwrote each other on every cycle. The result was ~700 files
// permanently reported "out of date" by CI, and a content-digest break on
// tools/itax-guide/index.html (route-itax-guide) that reached main on 2026-07-25
// behind a `[skip ci]` commit.

const CANONICAL_PATTERN =
  /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["'][^"']+["'])[^>]*>/i;

const OG_URL_PATTERN =
  /<meta\b(?=[^>]*\bproperty=["']og:url["'])(?=[^>]*\bcontent=["'][^"']*["'])[^>]*>/i;

function attributeValue(tag, attribute) {
  const match = tag.match(new RegExp('\\b' + attribute + '=["\']([^"\']*)["\']', 'i'));
  return match ? match[1] : undefined;
}

function upsert(content, url, pattern, attribute, line) {
  const existing = content.match(pattern);
  if (existing) {
    if (attributeValue(existing[0], attribute) === url) return content;
    return content.replace(pattern, line);
  }
  return content.replace(/<\/head>/i, line + '\n</head>');
}

function upsertCanonical(content, url) {
  return upsert(content, url, CANONICAL_PATTERN, 'href', '<link rel="canonical" href="' + url + '">');
}

function upsertOgUrl(content, url) {
  return upsert(content, url, OG_URL_PATTERN, 'content', '<meta property="og:url" content="' + url + '">');
}

// Rewrite site-URL string literals inside a JSON-LD block WITHOUT reserialising it.
//
// The obvious implementation -- JSON.parse, walk, JSON.stringify -- is semantically
// correct and formatting-destructive: JSON.stringify() with no indent argument
// collapses a pretty-printed block onto a single line. The site build pretty-prints
// its JSON-LD, so every collapsed block diverges from the build output permanently,
// and the two rewrite each other forever. On 2026-07-25 that removed 47,016 lines
// across 766 files in one unattended run -- FAQPage Question/acceptedAnswer blocks,
// BreadcrumbList ListItems -- and left main failing its own "generated outputs are
// committed" gate.
//
// Operating on the raw text keeps every byte of whitespace and only touches the URL
// literals that actually change. `normalizeUrl` is injected so this stays pure.
function rewriteJsonLdUrlLiterals(jsonText, normalizeUrl) {
  let changed = false;

  const text = jsonText.replace(/"(?:[^"\\]|\\.)*"/g, function (literal, offset, whole) {
    // Only values, never keys. A literal followed by `:` is an object key --
    // rewriting one would rename a schema.org property (e.g. "urlTemplate")
    // rather than fix a URL.
    if (/^\s*:/.test(whole.slice(offset + literal.length))) return literal;

    let value;
    try {
      value = JSON.parse(literal);
    } catch (error) {
      return literal;
    }
    if (typeof value !== 'string') return literal;
    // Preserved from the original walker: a search-action template is not a page URL.
    if (value.indexOf('{search_term_string}') !== -1) return literal;

    const normalized = normalizeUrl(value);
    if (normalized === value) return literal;

    changed = true;
    return JSON.stringify(normalized);
  });

  return { text: text, changed: changed };
}

module.exports = {
  upsertCanonical,
  upsertOgUrl,
  rewriteJsonLdUrlLiterals,
  CANONICAL_PATTERN,
  OG_URL_PATTERN,
};
