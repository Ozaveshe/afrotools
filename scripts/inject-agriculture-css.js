#!/usr/bin/env node
/**
 * Inject /assets/css/agriculture.css into all agriculture HTML files.
 * Adds the <link> right after the last existing stylesheet <link> in <head>.
 * Idempotent — skips files that already have the link.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'agriculture');
const LINK_TAG = '<link rel="stylesheet" href="/assets/css/agriculture.css">';

let updated = 0;
let skipped = 0;
let errors = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith('.html')) {
      processFile(full);
    }
  }
}

function processFile(filepath) {
  try {
    let html = fs.readFileSync(filepath, 'utf8');

    // Skip if already injected
    if (html.includes('agriculture.css')) {
      skipped++;
      return;
    }

    // Strategy: insert after the last <link rel="stylesheet" ...> in <head>
    // Find the position of global.min.css link (all pages have it)
    const globalCssPattern = /<link\s+rel="stylesheet"\s+href="\/assets\/css\/global\.min\.css"\s*\/?>/;
    const match = html.match(globalCssPattern);

    if (match) {
      const insertPos = match.index + match[0].length;
      html = html.slice(0, insertPos) + '\n' + LINK_TAG + html.slice(insertPos);
    } else {
      // Fallback: insert before </head>
      html = html.replace('</head>', LINK_TAG + '\n</head>');
    }

    fs.writeFileSync(filepath, html, 'utf8');
    updated++;
  } catch (e) {
    console.error('ERROR:', filepath, e.message);
    errors++;
  }
}

walk(ROOT);
console.log(`Done. Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
