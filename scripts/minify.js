#!/usr/bin/env node
/**
 * AfroTools Minification Script
 * Minifies JS (via terser) and CSS (regex-based) source files into .min.* counterparts.
 * Run: node scripts/minify.js
 */
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const ROOT = path.resolve(__dirname, '..');

// JS files: source -> min (only where a .js source exists)
const JS_PAIRS = [
  ['assets/js/components/navbar.js',         'assets/js/components/navbar.min.js'],
  ['assets/js/components/footer.js',         'assets/js/components/footer.min.js'],
  ['assets/js/components/tool-registry.js',  'assets/js/components/tool-registry.min.js'],
  ['assets/js/components/chat-panel.js',     'assets/js/components/chat-panel.min.js'],
  ['assets/js/components/newsletter-cta.js', 'assets/js/components/newsletter-cta.min.js'],
  ['assets/js/components/related-tools.js',  'assets/js/components/related-tools.min.js'],
  ['assets/js/components/site-assistant.js', 'assets/js/components/site-assistant.min.js'],
  ['assets/js/favorites.js',                'assets/js/favorites.min.js'],
];

// CSS files: source -> min
const CSS_PAIRS = [
  ['assets/css/tokens.css',        'assets/css/tokens.min.css'],
  ['assets/css/global.css',        'assets/css/global.min.css'],
  ['assets/css/calculator.css',    'assets/css/calculator.min.css'],
  ['assets/css/design-system.css', 'assets/css/design-system.min.css'],
  ['assets/css/dashboard.css',     'assets/css/dashboard.min.css'],
  ['assets/css/tool-landing.css',  'assets/css/tool-landing.min.css'],
  ['assets/css/animations.css',    'assets/css/animations.min.css'],
];

function minifyCSS(src) {
  return src
    // Remove comments (but not inside url() or content strings)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    // Remove space around selectors and braces
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    // Remove trailing semicolons before }
    .replace(/;}/g, '}')
    // Remove leading/trailing whitespace
    .trim();
}

async function run() {
  let jsTotal = { before: 0, after: 0, count: 0 };
  let cssTotal = { before: 0, after: 0, count: 0 };

  // Minify JS
  for (const [srcRel, minRel] of JS_PAIRS) {
    const srcPath = path.join(ROOT, srcRel);
    const minPath = path.join(ROOT, minRel);

    if (!fs.existsSync(srcPath)) {
      console.log(`  SKIP  ${srcRel} (source not found)`);
      continue;
    }

    const code = fs.readFileSync(srcPath, 'utf8');
    const srcSize = Buffer.byteLength(code);

    try {
      const result = await minify(code, {
        compress: {
          dead_code: true,
          drop_console: false,  // keep console.log for debugging
          passes: 2,
        },
        mangle: {
          reserved: [
            'AFRO_TOOLS', 'AFRO_CATEGORIES', 'onRegistryReady',
            'SaveState', 'renderSavedItems', 'clearAllFavs',
          ],
        },
        output: {
          comments: /^!/,  // keep banner comments starting with !
        },
      });

      fs.writeFileSync(minPath, result.code, 'utf8');
      const minSize = Buffer.byteLength(result.code);
      const pct = ((1 - minSize / srcSize) * 100).toFixed(1);
      console.log(`  JS    ${srcRel}: ${fmtKB(srcSize)} -> ${fmtKB(minSize)} (${pct}% smaller)`);
      jsTotal.before += srcSize;
      jsTotal.after += minSize;
      jsTotal.count++;
    } catch (err) {
      console.error(`  ERR   ${srcRel}: ${err.message}`);
    }
  }

  // Minify CSS
  for (const [srcRel, minRel] of CSS_PAIRS) {
    const srcPath = path.join(ROOT, srcRel);
    const minPath = path.join(ROOT, minRel);

    if (!fs.existsSync(srcPath)) {
      console.log(`  SKIP  ${srcRel} (source not found)`);
      continue;
    }

    const code = fs.readFileSync(srcPath, 'utf8');
    const srcSize = Buffer.byteLength(code);
    const minified = minifyCSS(code);
    fs.writeFileSync(minPath, minified, 'utf8');
    const minSize = Buffer.byteLength(minified);
    const pct = ((1 - minSize / srcSize) * 100).toFixed(1);
    console.log(`  CSS   ${srcRel}: ${fmtKB(srcSize)} -> ${fmtKB(minSize)} (${pct}% smaller)`);
    cssTotal.before += srcSize;
    cssTotal.after += minSize;
    cssTotal.count++;
  }

  // Summary
  const totalBefore = jsTotal.before + cssTotal.before;
  const totalAfter = jsTotal.after + cssTotal.after;
  const totalPct = totalBefore ? ((1 - totalAfter / totalBefore) * 100).toFixed(1) : 0;
  console.log(`\n  TOTAL ${jsTotal.count} JS + ${cssTotal.count} CSS files`);
  console.log(`        ${fmtKB(totalBefore)} -> ${fmtKB(totalAfter)} (${totalPct}% smaller, saved ${fmtKB(totalBefore - totalAfter)})`);
}

function fmtKB(bytes) {
  return (bytes / 1024).toFixed(1) + 'KB';
}

run().catch(err => { console.error(err); process.exit(1); });
