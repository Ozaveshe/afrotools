#!/usr/bin/env node
/**
 * Targeted cleanup for current SITE-AUDIT-REPORT JSON-LD errors.
 *
 * These fixes are intentionally narrow:
 * - remove one stale escape in the French plot converter FAQ JSON-LD
 * - remove an extra brace in four Swahili PAYE WebApplication schemas
 * - strip malformed generated JAMB per-question JSON-LD blocks while keeping
 *   valid page/breadcrumb schema intact
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

function write(relative, html) {
  fs.writeFileSync(path.join(ROOT, relative), html, 'utf8');
}

function patchLiteral(relative, before, after) {
  const html = read(relative);
  if (!html.includes(before)) {
    if (html.includes(after)) return false;
    throw new Error(`${relative}: expected literal not found`);
  }
  write(relative, html.replace(before, after));
  return true;
}

function removeExtraWebApplicationBrace(relative) {
  const html = read(relative);
  const next = html.replace(
    /("dateModified":"[^"]+","datePublished":"2025-01-15")}}(<\/script>)/,
    '$1}$2'
  );
  if (next === html) {
    if (/("dateModified":"[^"]+","datePublished":"2025-01-15")}(<\/script>)/.test(html)) return false;
    throw new Error(`${relative}: expected WebApplication datePublished schema not found`);
  }
  write(relative, next);
  return true;
}

function removeInvalidJsonLdBlocks(relative) {
  const html = read(relative);
  let removed = 0;
  const next = html.replace(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi, (block, json) => {
    try {
      JSON.parse(json);
      return block;
    } catch (error) {
      removed += 1;
      return '';
    }
  });

  if (!removed) {
    throw new Error(`${relative}: no invalid JSON-LD blocks removed`);
  }

  write(relative, next);
  return removed;
}

patchLiteral(
  'fr/tools/convertisseur-parcelle/index.html',
  "plan d\\'arpentage",
  "plan d'arpentage"
);

[
  'sw/burundi/kikokotoo-kodi-mshahara/index.html',
  'sw/rwanda/kikokotoo-kodi-mshahara/index.html',
  'sw/tanzania/kikokotoo-kodi-mshahara/index.html',
  'sw/uganda/kikokotoo-kodi-mshahara/index.html',
].forEach((relative) => {
  removeExtraWebApplicationBrace(relative);
});

const jambRemoved = [
  'jamb/english/2015/index.html',
  'jamb/literature/2013/index.html',
].map((relative) => ({ relative, removed: removeInvalidJsonLdBlocks(relative) }));

console.log('JSON-LD cleanup complete.');
jambRemoved.forEach(({ relative, removed }) => {
  console.log(`  ${relative}: removed ${removed} malformed JSON-LD block(s)`);
});
