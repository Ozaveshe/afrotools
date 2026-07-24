#!/usr/bin/env node
/**
 * AfroTools Minification Script
 * Minifies JS (via terser) and CSS (regex-based) source files into .min.* counterparts.
 * Run: node scripts/minify.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { minify } = require('terser');
const { buildNavbarData } = require('./build-navbar-data');
const { getEngineTerserOptions } = require('./lib/engine-build');
const {
  writeFileSyncWithRetry: writeTempFileSyncWithRetry,
  renameSyncWithRetry,
  unlinkSyncWithRetry,
} = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const onlyArg = process.argv.find(arg => arg.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.slice('--only='.length) : null;

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
  ['assets/css/theme-dark.css',    'assets/css/theme-dark.min.css'],
  ['assets/css/dashboard.css',     'assets/css/dashboard.min.css'],
  ['assets/css/tool-landing.css',  'assets/css/tool-landing.min.css'],
  ['assets/css/animations.css',    'assets/css/animations.min.css'],
];

const ENGINE_SOURCE_DIR = path.join(ROOT, 'engines', 'src');
if (fs.existsSync(ENGINE_SOURCE_DIR)) {
  for (const entry of fs.readdirSync(ENGINE_SOURCE_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    JS_PAIRS.push([
      path.posix.join('engines/src', entry.name),
      path.posix.join('engines', entry.name),
    ]);
  }
}

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

function isValidJavaScript(code, filename) {
  try {
    new vm.Script(code, { filename });
    return true;
  } catch {
    return false;
  }
}

function writeFileSyncWithRetry(filePath, data, encoding) {
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    writeTempFileSyncWithRetry(tempPath, data, encoding);
    try {
      fs.renameSync(tempPath, filePath);
    } catch (error) {
      // Windows/OneDrive can reject replacement renames even when the target
      // can be removed safely. The complete output already exists beside it,
      // so remove only the intended generated target and finish the rename.
      if (process.platform === 'win32' && error && error.code === 'EPERM' && fs.existsSync(filePath)) {
        unlinkSyncWithRetry(filePath);
      }
      renameSyncWithRetry(tempPath, filePath);
    }
  } finally {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {}
  }
}

function writeFileIfChanged(filePath, data, encoding) {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, encoding) === data) return false;
  writeFileSyncWithRetry(filePath, data, encoding);
  return true;
}

async function run() {
  buildNavbarData();
  let errorCount = 0;
  let jsTotal = { before: 0, after: 0, count: 0 };
  let cssTotal = { before: 0, after: 0, count: 0 };

  // Minify JS
  for (const [srcRel, minRel] of JS_PAIRS) {
    if (ONLY && !srcRel.includes(ONLY)) continue;
    const srcPath = path.join(ROOT, srcRel);
    const minPath = path.join(ROOT, minRel);

    if (!fs.existsSync(srcPath)) {
      console.log(`  SKIP  ${srcRel} (source not found)`);
      continue;
    }

    const code = fs.readFileSync(srcPath, 'utf8');
    const srcSize = Buffer.byteLength(code);

    try {
      const result = await minify(code, getEngineTerserOptions());

      let finalCode = result.code || code;
      let fallbackLabel = '';
      if (!isValidJavaScript(finalCode, minRel)) {
        finalCode = code;
        fallbackLabel = ' (fallback: invalid minified output)';
      }

      writeFileIfChanged(minPath, finalCode, 'utf8');
      const minSize = Buffer.byteLength(finalCode);
      const pct = ((1 - minSize / srcSize) * 100).toFixed(1);
      console.log(`  JS    ${srcRel}: ${fmtKB(srcSize)} -> ${fmtKB(minSize)} (${pct}% smaller)${fallbackLabel}`);
      jsTotal.before += srcSize;
      jsTotal.after += minSize;
      jsTotal.count++;
    } catch (err) {
      console.error(`  ERR   ${srcRel}: ${err.message}`);
      errorCount += 1;
    }
  }

  // Minify CSS
  for (const [srcRel, minRel] of CSS_PAIRS) {
    if (ONLY && !srcRel.includes(ONLY)) continue;
    const srcPath = path.join(ROOT, srcRel);
    const minPath = path.join(ROOT, minRel);

    if (!fs.existsSync(srcPath)) {
      console.log(`  SKIP  ${srcRel} (source not found)`);
      continue;
    }

    const code = fs.readFileSync(srcPath, 'utf8');
    const srcSize = Buffer.byteLength(code);
    const minified = minifyCSS(code);
    writeFileIfChanged(minPath, minified, 'utf8');
    const minSize = Buffer.byteLength(minified);
    const pct = ((1 - minSize / srcSize) * 100).toFixed(1);
    console.log(`  CSS   ${srcRel}: ${fmtKB(srcSize)} -> ${fmtKB(minSize)} (${pct}% smaller)`);
    cssTotal.before += srcSize;
    cssTotal.after += minSize;
    cssTotal.count++;
  }

  // Unpaired source assets are intentionally left unchanged.
  // Unpaired public assets are optimized only after copying into dist.
  // build:assets must never rewrite readable source files in place.
  if (ONLY) {
    console.log(`  ONLY  ${ONLY}: ${jsTotal.count} JS pair(s), ${cssTotal.count} CSS pair(s)`);
    return;
  }

  // Summary
  const totalBefore = jsTotal.before + cssTotal.before;
  const totalAfter = jsTotal.after + cssTotal.after;
  const totalPct = totalBefore ? ((1 - totalAfter / totalBefore) * 100).toFixed(1) : 0;
  console.log(`\n  TOTAL ${jsTotal.count} JS + ${cssTotal.count} CSS paired outputs`);
  console.log(`        ${fmtKB(totalBefore)} -> ${fmtKB(totalAfter)} (${totalPct}% smaller, saved ${fmtKB(totalBefore - totalAfter)})`);
  if (errorCount) {
    throw new Error(`${errorCount} asset${errorCount === 1 ? '' : 's'} failed to minify`);
  }
}

function fmtKB(bytes) {
  return (bytes / 1024).toFixed(1) + 'KB';
}

run().catch(err => { console.error(err); process.exit(1); });
