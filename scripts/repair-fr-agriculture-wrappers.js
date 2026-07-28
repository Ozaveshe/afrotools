#!/usr/bin/env node
'use strict';

/**
 * Give the French agriculture locale wrappers a real, indexable heading.
 *
 * These pages self-canonicalise, carry full French metadata (title,
 * description, WebApplication + BreadcrumbList JSON-LD) and hreflang, but
 * their entire <body> is a navbar, an <iframe> pointing at the English tool,
 * and a footer. A crawler sees a page with no heading and no text: 616 thin
 * URLs asserting they are the canonical French version of a tool.
 *
 * This does not translate the tool — the iframe still serves the English
 * calculator, and pretending otherwise would be worse. What it does is stop
 * the page lying about being empty: it promotes the French title and
 * description the page already publishes in <head> into visible content, adds
 * the <h1> every page needs for SEO and for screen-reader landmark order, and
 * links out to the English tool the frame embeds so the relationship is
 * explicit rather than hidden inside an iframe.
 *
 * Usage: node scripts/repair-fr-agriculture-wrappers.js [--write]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FR_AGRI = path.join(ROOT, 'fr', 'agriculture');
const WRITE = process.argv.includes('--write');

const IFRAME_RE = /<iframe src="(\/[^"]*)" style="width:100%;min-height:100vh;border:none"[^>]*><\/iframe>/;

function walk(dir, acc = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

function meta(html, attr, name) {
  const re = new RegExp(`<meta\\s+${attr}="${name}"\\s+content="([^"]*)"`, 'i');
  const m = html.match(re);
  return m ? m[1] : null;
}

function decode(value) {
  return value
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, '’')
    .replace(/&amp;/g, '&');
}

function headingFor(html) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!title) return null;
  // "Transformation du manioc &mdash; Ghana | AfroTools" -> drop the site suffix.
  return decode(title[1]).replace(/\s*\|\s*AfroTools\s*$/i, '').trim() || null;
}

function repair(html) {
  if (/<h1[\s>]/i.test(html)) return null;
  const frame = html.match(IFRAME_RE);
  if (!frame) return null;
  const heading = headingFor(html);
  if (!heading) return null;
  const description = decode(meta(html, 'name', 'description') || '');
  const target = frame[1];

  const intro = [
    '<header class="fr-wrapper-intro">',
    `<h1>${escapeHtml(heading)}</h1>`,
    description ? `<p>${escapeHtml(description)}</p>` : '',
    `<p><a href="${target}" rel="alternate" hreflang="en">Ouvrir le calculateur (version anglaise)</a></p>`,
    '</header>'
  ].filter(Boolean).join('\n');

  return html.replace(frame[0], `${intro}\n${frame[0]}`);
}

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function main() {
  const files = walk(FR_AGRI);
  let changed = 0;
  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    const next = repair(original);
    if (!next || next === original) continue;
    changed += 1;
    if (WRITE) fs.writeFileSync(file, next, 'utf8');
  }
  console.log(`Scanned ${files.length} French agriculture pages.`);
  console.log(`${WRITE ? 'Added' : 'Would add'} a visible <h1> and lede to ${changed} iframe wrapper(s).`);
  if (!WRITE && changed) console.log('Dry run. Pass --write to apply.');
}

main();
