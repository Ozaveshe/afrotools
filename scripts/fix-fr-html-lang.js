#!/usr/bin/env node
/**
 * fix-fr-html-lang.js — Fixes <html lang="en"> on French pages to <html lang="fr">.
 *
 * Also fixes missing x-default hreflang tags on French pages.
 *
 * Usage:
 *   node scripts/fix-fr-html-lang.js             (audit only)
 *   node scripts/fix-fr-html-lang.js --fix        (apply fixes)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FIX = process.argv.includes('--fix');
const BASE_URL = 'https://afrotools.com';

function walkHtml(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (['node_modules', '.git'].includes(entry.name)) continue;
      results.push(...walkHtml(path.join(dir, entry.name)));
    } else if (entry.name.endsWith('.html')) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function fileToUrl(filePath) {
  let rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (rel.endsWith('/index.html')) rel = rel.slice(0, -'index.html'.length);
  else if (rel === 'index.html') rel = '';
  else if (rel.endsWith('.html')) rel = rel.slice(0, -'.html'.length) + '/';
  return BASE_URL + '/' + rel;
}

const frDir = path.join(ROOT, 'fr');
const files = walkHtml(frDir);
let langFixed = 0;
let xDefaultFixed = 0;

for (const filePath of files) {
  let html = fs.readFileSync(filePath, 'utf-8');
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  let modified = false;

  // Fix 1: <html lang="en"> → <html lang="fr">
  if (/<html[^>]*\slang=["']en["']/i.test(html)) {
    if (FIX) {
      html = html.replace(/(<html[^>]*\slang=["'])en(["'])/i, '$1fr$2');
      modified = true;
    }
    langFixed++;
  }

  // Fix 2: Missing x-default hreflang
  const hasHreflang = /<link[^>]*hreflang/i.test(html);
  const hasXDefault = /<link[^>]*hreflang=["']x-default["']/i.test(html);
  if (hasHreflang && !hasXDefault) {
    // Derive English URL from French path
    const frUrl = fileToUrl(filePath);
    const enUrl = frUrl.replace(BASE_URL + '/fr/', BASE_URL + '/');
    if (FIX) {
      // Insert x-default after last hreflang tag
      const lastHreflang = html.match(/.*<link[^>]*hreflang[^>]*>/is);
      if (lastHreflang) {
        const insertPoint = html.lastIndexOf('<link rel="alternate" hreflang=');
        const lineEnd = html.indexOf('>', insertPoint) + 1;
        html = html.slice(0, lineEnd) + '\n<link rel="alternate" hreflang="x-default" href="' + enUrl + '" />' + html.slice(lineEnd);
        modified = true;
      }
    }
    xDefaultFixed++;
  }

  // Fix 3: Missing self-reference hreflang (fr)
  const hasFrHreflang = /<link[^>]*hreflang=["']fr["']/i.test(html);
  if (hasHreflang && !hasFrHreflang) {
    const selfUrl = fileToUrl(filePath);
    if (FIX) {
      const insertPoint = html.lastIndexOf('<link rel="alternate" hreflang=');
      if (insertPoint > -1) {
        const lineEnd = html.indexOf('>', insertPoint) + 1;
        html = html.slice(0, lineEnd) + '\n<link rel="alternate" hreflang="fr" href="' + selfUrl + '" />' + html.slice(lineEnd);
        modified = true;
      }
    }
  }

  if (FIX && modified) {
    fs.writeFileSync(filePath, html, 'utf-8');
  }
}

console.log('\n🔍 French Pages html lang Fix');
console.log('═'.repeat(60));
console.log(`📄 ${files.length} French pages scanned`);
console.log(`${FIX ? '🔧' : '⚠️ '} ${langFixed} pages ${FIX ? 'had' : 'have'} lang="en" → lang="fr" ${FIX ? '(fixed)' : '(needs fix)'}`);
console.log(`${FIX ? '🔧' : '⚠️ '} ${xDefaultFixed} pages ${FIX ? 'had' : 'have'} missing x-default ${FIX ? '(fixed)' : '(needs fix)'}`);
if (!FIX && (langFixed > 0 || xDefaultFixed > 0)) console.log('\nRun with --fix to apply.');
console.log('');
