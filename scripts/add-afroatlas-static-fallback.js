#!/usr/bin/env node
'use strict';

/**
 * Give the AfroAtlas country pages a static heading and lede.
 *
 * Each of these pages ships 32 characters of server-rendered text — a
 * breadcrumb — and leaves `#aa-country-page` empty for the engine to fill on
 * load. So the document a crawler, a social-card fetcher, or a reader with
 * JavaScript blocked receives has no `<h1>`, no country name and no prose,
 * even though the `<head>` already carries both.
 *
 * The page script ends with `page.innerHTML = html`, which replaces the
 * container wholesale. Anything placed inside it is therefore a true
 * fallback: crawled when the script does not run, and gone the moment it
 * does, so the rendered page still has exactly one `<h1>`.
 *
 * Content comes from the page's own <title> and meta description. Nothing is
 * invented.
 *
 * Usage: node scripts/add-afroatlas-static-fallback.js [--write]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'tools', 'afroatlas', 'country');
const WRITE = process.argv.includes('--write');

const EMPTY_CONTAINER = /<div class="aa-page" id="aa-country-page">\s*(?:<!--[^>]*-->)?\s*<\/div>/;

function decode(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/&rsquo;/g, '’')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function build(html, slug) {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  if (!titleMatch) return null;

  const heading = decode(titleMatch[1]).replace(/\s*\|\s*AfroAtlas\s*$/i, '').trim();
  const description = descMatch ? decode(descMatch[1]).trim() : '';
  if (!heading) return null;

  return [
    '<div class="aa-page" id="aa-country-page">',
    '  <!-- Static fallback. The page script replaces this container wholesale',
    '       via page.innerHTML, so this is what a crawler or a no-JS reader',
    '       sees and nothing more. Keep it in sync with <head>. -->',
    '  <section class="aa-country-hero">',
    '    <div class="aa-wrap">',
    `      <h1>${escapeHtml(heading)}</h1>`,
    description ? `      <p class="aa-hero-tagline">${escapeHtml(description)}</p>` : '',
    `      <p class="aa-hero-meta"><a href="/tools/afroatlas/">Browse every AfroAtlas country profile</a></p>`,
    '    </div>',
    '  </section>',
    '</div>'
  ].filter(Boolean).join('\n');
}

function main() {
  let entries;
  try { entries = fs.readdirSync(DIR, { withFileTypes: true }); } catch { entries = []; }
  let changed = 0;
  let skipped = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const file = path.join(DIR, entry.name, 'index.html');
    if (!fs.existsSync(file)) continue;
    const original = fs.readFileSync(file, 'utf8');
    if (!EMPTY_CONTAINER.test(original)) { skipped += 1; continue; }
    const block = build(original, entry.name);
    if (!block) { skipped += 1; continue; }
    const next = original.replace(EMPTY_CONTAINER, block);
    if (next === original) { skipped += 1; continue; }
    changed += 1;
    if (WRITE) fs.writeFileSync(file, next, 'utf8');
  }
  console.log(`${WRITE ? 'Added' : 'Would add'} a static fallback to ${changed} AfroAtlas country page(s); ${skipped} already had one or did not match.`);
  if (!WRITE && changed) console.log('Dry run. Pass --write to apply.');
}

main();
