#!/usr/bin/env node
'use strict';

/**
 * Repair hreflang blocks that were copied verbatim between country pages.
 *
 * agriculture/crop-yield/burundi.html declares:
 *
 *   <link rel="alternate" hreflang="en"        href=".../crop-yield/algeria">
 *   <link rel="alternate" hreflang="fr"     href=".../fr/.../crop-yield/algeria">
 *   <link rel="alternate" hreflang="x-default" href=".../crop-yield/algeria">
 *
 * It is telling Google that the English version of the Burundi page is the
 * Algeria page, and it never names itself. Every country page in these families
 * carries the same block, cloned from whichever page was written first, so the
 * cluster has no reciprocity and points at the wrong country.
 *
 * The repair is deliberately conservative. An alternate is dropped only when it
 * is demonstrably wrong:
 *
 *   1. it resolves to no file in this repository, or
 *   2. it sits in the same directory as the page it claims to translate while
 *      naming a different country — the copied-block signature.
 *
 * A differing slug on its own proves nothing: localised tools legitimately have
 * translated slugs (/tools/route-fares vs /fr/tools/tarifs-itineraire), and an
 * earlier draft of this rule would have deleted 6,381 valid alternates on that
 * basis. Everything else is left exactly as found.
 *
 * The page's own canonical is always added as the self-reference Google
 * requires, and x-default is pointed at the surviving English alternate, or at
 * self when there is none.
 *
 * Usage: node scripts/repair-hreflang-clusters.js [--write]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const SITE = 'https://afrotools.com';

const LOCALE_PREFIXES = ['fr', 'sw', 'ha', 'yo'];

// Only per-country tool families, where one page's hreflang block was cloned
// across every country. Hub and top-level routes are owned by
// scripts/build-route-contract.js, which asserts their clusters directly; this
// script must not rewrite those from the filesystem.
const IN_SCOPE = /^(fr\/|sw\/|ha\/|yo\/)?agriculture\//;

// The family hub itself (agriculture/index.html and its locale twins) is one of
// the routes build-route-contract.js asserts, so leave it to that generator.
const HUB = /^(fr\/|sw\/|ha\/|yo\/)?agriculture\/index\.html$/;

function inScope(relPath) {
  const p = relPath.replace(/\\/g, '/');
  return IN_SCOPE.test(p) && !HUB.test(p);
}

function walk(dir, acc = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const entry of entries) {
    if (/^(\.git|node_modules|tests|audit-results|supabase)$/.test(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

/** Repo file backing a site URL, or null. */
function fileForUrl(url) {
  let p;
  try { p = new URL(url, SITE).pathname; } catch { return null; }
  p = p.replace(/^\//, '').replace(/\/$/, '');
  if (!p) p = 'index';
  for (const cand of [p + '.html', path.join(p, 'index.html')]) {
    const full = path.join(ROOT, cand);
    try { if (fs.statSync(full).isFile()) return full; } catch { /* keep looking */ }
  }
  return null;
}

/** Language of a URL, from its locale path prefix. */
function langOfUrl(url) {
  let p;
  try { p = new URL(url, SITE).pathname; } catch { return 'en'; }
  const first = p.replace(/^\//, '').split('/')[0];
  return LOCALE_PREFIXES.includes(first) ? first : 'en';
}

/** Last meaningful path segment, used as the country slug. */
function slugOfUrl(url) {
  let p;
  try { p = new URL(url, SITE).pathname; } catch { return null; }
  const parts = p.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
  const last = parts[parts.length - 1] || '';
  return last.replace(/\.html$/, '') || null;
}

/** Directory portion of a URL path, used to detect a same-family sibling. */
function dirOfUrl(url) {
  let p;
  try { p = new URL(url, SITE).pathname; } catch { return null; }
  const parts = p.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
  parts.pop();
  return parts.join('/');
}

/** Strip a leading locale segment so /fr/agriculture/x and /agriculture/x compare equal. */
function stripLocale(dir) {
  if (!dir) return dir;
  const parts = dir.split('/');
  if (LOCALE_PREFIXES.includes(parts[0])) parts.shift();
  return parts.join('/');
}

/**
 * True when `href` claims to be this page's translation but actually names a
 * different country in the same family.
 *
 * The test that makes this safe is the last one: the alternate's slug must
 * exist as a *sibling file of this page*. /agriculture/crop-yield/burundi
 * pointing at .../crop-yield/algeria fails it, because algeria.html sits right
 * next to burundi.html — the block was copied. /tools/route-fares pointing at
 * /fr/tools/tarifs-itineraire passes, because there is no
 * tools/tarifs-itineraire sibling: that is a translated slug, not a wrong
 * country, and must be left alone.
 */
function namesASiblingCountry(href, canon, ownSlug) {
  if (stripLocale(dirOfUrl(href)) !== stripLocale(dirOfUrl(canon))) return false;
  const slug = slugOfUrl(href);
  if (!slug || slug === ownSlug) return false;
  const ownDir = dirOfUrl(canon);
  return Boolean(fileForUrl('/' + ownDir + '/' + slug));
}

/**
 * If `href` names a different country than `ownSlug`, return the same URL with
 * this page's country substituted — but only when that file actually exists.
 *
 * This is what turns a wrong claim into a right one instead of just deleting
 * it: /agriculture/crop-yield/burundi listing .../fr/.../crop-yield/algeria
 * becomes .../fr/.../crop-yield/burundi, which exists, and the two pages then
 * point at each other. Where no such sibling exists (a Hausa page with a
 * country-specific slug, say) this returns null and the caller falls through to
 * the drop rules, so nothing is invented.
 */
function correctedSibling(href, ownSlug) {
  const slug = slugOfUrl(href);
  if (!slug || slug === ownSlug) return null;
  let url;
  try { url = new URL(href, SITE); } catch { return null; }
  const trailing = url.pathname.endsWith('/');
  const parts = url.pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
  const last = parts[parts.length - 1];
  // Only substitute a whole final segment, never part of a translated slug.
  if (last.replace(/\.html$/, '') !== slug) return null;
  parts[parts.length - 1] = last.endsWith('.html') ? ownSlug + '.html' : ownSlug;
  const next = SITE + '/' + parts.join('/') + (trailing ? '/' : '');
  if (next.replace(/\/$/, '') === href.replace(/\/$/, '')) return null;
  return fileForUrl(next) ? next : null;
}

function main() {
  const files = walk(ROOT);
  let changed = 0;
  let droppedTotal = 0;
  let selfAdded = 0;
  let repairedTotal = 0;

  for (const file of files) {
    if (!inScope(path.relative(ROOT, file))) continue;
    const original = fs.readFileSync(file, 'utf8');
    if (/name=["']robots["'][^>]*noindex/i.test(original)) continue;

    const links = [...original.matchAll(/[ \t]*<link[^>]+rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>\n?/gi)];
    if (!links.length) continue;

    const canonMatch = original.match(/rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    if (!canonMatch) continue;
    const canon = canonMatch[1];
    const ownSlug = slugOfUrl(canon);
    const ownLang = langOfUrl(canon);
    if (!ownSlug) continue;

    const kept = new Map();
    let dropped = 0;
    let repaired = 0;
    for (const m of links) {
      const lang = m[1];
      const href = m[2];
      if (lang === 'x-default') continue;
      if (href.replace(/\/$/, '') === canon.replace(/\/$/, '')) { kept.set(lang, canon); continue; }
      if (!fileForUrl(href)) { dropped += 1; continue; }
      // Drop only a demonstrably wrong target: one sitting in the *same*
      // directory as a page it claims to be the translation of, but naming a
      // different country. That is the copied-block bug and nothing else.
      // Localised tools legitimately have translated slugs
      // (/tools/route-fares vs /fr/tools/tarifs-itineraire), so a differing
      // slug on its own proves nothing and must not be touched.
      // Prefer repairing over dropping: if substituting this page's own country
      // slug into the target yields a file that exists, the copied block simply
      // named the wrong country and the right sibling is right there.
      const corrected = correctedSibling(href, ownSlug);
      if (corrected) { repaired += 1; kept.set(lang, corrected); continue; }
      if (namesASiblingCountry(href, canon, ownSlug)) { dropped += 1; continue; }
      kept.set(lang, href);
    }

    const hadSelf = kept.get(ownLang) && kept.get(ownLang).replace(/\/$/, '') === canon.replace(/\/$/, '');
    kept.set(ownLang, canon);
    if (!dropped && !repaired && hadSelf) continue;
    if (!hadSelf) selfAdded += 1;
    droppedTotal += dropped;
    repairedTotal += repaired;

    const order = ['en', 'fr', 'sw', 'ha', 'yo'].filter((l) => kept.has(l));
    for (const l of kept.keys()) if (!order.includes(l)) order.push(l);
    const lines = order.map((l) => `<link rel="alternate" hreflang="${l}" href="${kept.get(l)}">`);
    lines.push(`<link rel="alternate" hreflang="x-default" href="${kept.get('en') || canon}">`);

    // Replace the old block in place: keep the first link's position, drop the rest.
    let out = original;
    const first = links[0];
    const indent = (first[0].match(/^[ \t]*/) || [''])[0];
    for (let i = links.length - 1; i >= 0; i -= 1) {
      const m = links[i];
      const start = m.index;
      const end = start + m[0].length;
      out = out.slice(0, start) + (i === 0 ? lines.map((l) => indent + l).join('\n') + '\n' : '') + out.slice(end);
    }
    if (out === original) continue;
    changed += 1;
    if (WRITE) fs.writeFileSync(file, out, 'utf8');
  }

  console.log(`${WRITE ? 'Repaired' : 'Would repair'} hreflang on ${changed} page(s).`);
  console.log(`  self-references added : ${selfAdded}`);
  console.log(`  wrong-country alternates repointed : ${repairedTotal}`);
  console.log(`  unresolvable alternates dropped   : ${droppedTotal}`);
  if (!WRITE && changed) console.log('Dry run. Pass --write to apply.');
}

main();
