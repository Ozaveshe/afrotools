#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  ROOT,
  labelForeignLanguageBlocks,
  loadCatalogValues
} = require('./lib/content-integrity');

const MANIFEST = path.join(ROOT, 'data/localization/explicit-language-fallbacks.json');
const WRITE = process.argv.includes('--write');
const CHECK = process.argv.includes('--check') || !WRITE;

function globRegex(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '::DOUBLE::')
    .replace(/\*/g, '[^/]*')
    .replace(/::DOUBLE::/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function walk(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'dist', 'node_modules', 'reports', 'test-results'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, output);
    else if (entry.isFile() && entry.name.endsWith('.html')) output.push(file);
  }
  return output;
}

function insertMeta(html, name, content) {
  const re = new RegExp(`<meta\\s+name=["']${name}["'][^>]*>`, 'i');
  const tag = `<meta name="${name}" content="${String(content).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">`;
  return re.test(html) ? html.replace(re, tag) : html.replace(/<\/head>/i, `${tag}\n</head>`);
}

function insertNotice(html, entry) {
  if (/data-language-fallback-notice\b/i.test(html)) return html;
  const notice = `<aside data-language-fallback-notice="${entry.id}" lang="${entry.locale}" role="note" style="max-width:1120px;margin:16px auto;padding:14px 18px;border:1px solid #d9a441;border-left-width:4px;border-radius:10px;background:#fff8e6;color:#4b3a16;line-height:1.55">${entry.notice}</aside>`;
  if (/<afro-navbar\b[^>]*><\/afro-navbar>/i.test(html)) return html.replace(/<afro-navbar\b[^>]*><\/afro-navbar>/i, (match) => `${match}\n${notice}`);
  return html.replace(/<body\b[^>]*>/i, (match) => `${match}\n${notice}`);
}

function validateManifest(manifest) {
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.entries)) throw new Error('Explicit fallback manifest must use schemaVersion 1 and an entries array.');
  const ids = new Set();
  for (const entry of manifest.entries) {
    if (!entry.id || ids.has(entry.id)) throw new Error(`Missing or duplicate fallback id: ${entry.id || '(missing)'}`);
    ids.add(entry.id);
    if (!entry.locale || !entry.fallbackLanguage || !entry.notice || !entry.owner || !Array.isArray(entry.paths) || !entry.paths.length) throw new Error(`${entry.id} is incomplete.`);
  }
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  validateManifest(manifest);
  const entries = manifest.entries.map((entry) => ({ ...entry, matchers: entry.paths.map(globRegex) }));
  const stale = [];
  let affectedPages = 0;
  let labelledBlocks = 0;

  for (const absolute of walk(ROOT)) {
    const rel = path.relative(ROOT, absolute).replace(/\\/g, '/');
    const entry = entries.find((candidate) => candidate.matchers.some((matcher) => matcher.test(rel)));
    if (!entry) continue;
    const before = fs.readFileSync(absolute, 'utf8');
    const labelled = labelForeignLanguageBlocks(before, entry.locale, entry.fallbackLanguage, loadCatalogValues(entry.locale));
    const alreadyManaged = /name=["']afrotools-language-fallback["']/i.test(before);
    if (!labelled.count && !alreadyManaged) continue;
    let after = labelled.html;
    after = insertMeta(after, 'afrotools-language-fallback', entry.fallbackLanguage);
    after = insertMeta(after, 'afrotools-language-fallback-owner', `${entry.id}: ${entry.owner}`);
    after = insertNotice(after, entry);
    if (after === before) continue;
    affectedPages += 1;
    labelledBlocks += labelled.count;
    if (WRITE) fs.writeFileSync(absolute, after.normalize('NFC'), 'utf8');
    else stale.push(rel);
  }

  if (CHECK && stale.length) {
    console.error(`Explicit language fallbacks are stale in ${stale.length} page(s):\n${stale.slice(0, 50).join('\n')}`);
    process.exit(1);
  }
  console.log(`${WRITE ? 'Applied' : 'Checked'} explicit language fallbacks: ${affectedPages} page(s), ${labelledBlocks} newly labelled block(s).`);
}

if (require.main === module) main();

module.exports = { globRegex, validateManifest };
