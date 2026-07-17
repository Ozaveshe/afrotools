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

async function minifyToFixedPoint(code, options, maxPasses = 3) {
  let current = code;
  for (let pass = 0; pass < maxPasses; pass++) {
    const result = await minify(current, options);
    if (!result.code || result.code === current) return current;
    current = result.code;
  }
  return current;
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

  // ── PASS 2: Minify ALL remaining JS files in-place ──────────────
  // These are per-page scripts (engines, libs, etc.) that are loaded directly.
  // We minify them in-place so they're served minified without needing .min.js pairs.
  if (ONLY) {
    console.log(`  ONLY  ${ONLY}: ${jsTotal.count} JS pair(s), ${cssTotal.count} CSS pair(s)`);
    return;
  }

  const pairedSrcs = new Set(JS_PAIRS.map(p => path.resolve(ROOT, p[0])));
  const pairedMins = new Set(JS_PAIRS.map(p => path.resolve(ROOT, p[1])));
  const generatedCanonicalProjections = new Set([
    path.resolve(ROOT, 'assets/js/data/registry-counts.js'),
    path.resolve(ROOT, 'assets/js/data/african-countries.js'),
    path.resolve(ROOT, 'assets/js/data/locale-manifest.js'),
    path.resolve(ROOT, 'assets/js/data/ui-translations.js'),
    path.resolve(ROOT, 'assets/js/lib/localization.js'),
    path.resolve(ROOT, 'assets/js/lib/localize-shared-ui.js'),
    path.resolve(ROOT, 'assets/js/lib/formatters.js'),
    path.resolve(ROOT, 'assets/js/lib/export-tools.js'),
    path.resolve(ROOT, 'assets/js/lib/locale-route-resolver.js'),
    path.resolve(ROOT, 'assets/js/i18n-detect.js'),
  ]);

  function walkDir(dir) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        results.push(...walkDir(fullPath));
      } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.min.js')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  // Find all non-min JS files across the entire project
  const SKIP_DIRS = [
    'node_modules',
    '.git',
    'scripts',
    'netlify',
    'vendor',
    '.claude',
    '.codex',
    '.jamb',
    '.jamb-tools',
    '.netlify',
    '.playwright',
    '.playwright-cli',
    '.tmp-validation',
    'dist',
    'output',
    'reports',
    'tests',
    'test-results',
  ];
  function walkAll(dir) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    const aiSourceDir = path.join(ROOT, 'assets', 'js', 'ai');
    if (path.resolve(dir) === aiSourceDir) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.includes(entry.name)) continue;
        results.push(...walkAll(fullPath));
      } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.min.js') && entry.name !== 'service-worker.js') {
        results.push(fullPath);
      }
    }
    return results;
  }
  const allJsFiles = walkAll(ROOT)
    .filter(f => !pairedSrcs.has(f) && !pairedMins.has(f) && !generatedCanonicalProjections.has(path.resolve(f)));

  let inplaceTotal = { before: 0, after: 0, count: 0 };
  for (const filePath of allJsFiles) {
    const code = fs.readFileSync(filePath, 'utf8');
    const srcSize = Buffer.byteLength(code);
    if (srcSize < 100) continue; // skip tiny files

    try {
      const finalCode = await minifyToFixedPoint(code, {
        compress: { dead_code: true, passes: 1 },
        mangle: { reserved: ['AFRO_TOOLS', 'AFRO_CATEGORIES', 'onRegistryReady', 'AfroAuth', 'AfroData', 'externalLink', 'recordWidgetIntent'] },
        output: { comments: /^!/ },
      });
      if (finalCode && isValidJavaScript(finalCode, filePath)) {
        writeFileIfChanged(filePath, finalCode, 'utf8');
        const minSize = Buffer.byteLength(finalCode);
        inplaceTotal.before += srcSize;
        inplaceTotal.after += minSize;
        inplaceTotal.count++;
      }
    } catch (err) {
      // Skip files that fail to minify (may have syntax issues)
      console.log(`  SKIP  ${path.relative(ROOT, filePath)}: ${err.message.slice(0, 60)}`);
    }
  }

  // ── PASS 3: Minify ALL remaining CSS files in-place ──────────────
  const pairedCssSrcs = new Set(CSS_PAIRS.map(p => path.resolve(ROOT, p[0])));
  const pairedCssMins = new Set(CSS_PAIRS.map(p => path.resolve(ROOT, p[1])));
  const allCssFiles = [];
  function walkCss(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.includes(entry.name)) continue;
        walkCss(fullPath);
      } else if (entry.name.endsWith('.css') && !entry.name.endsWith('.min.css')) {
        if (!pairedCssSrcs.has(fullPath) && !pairedCssMins.has(fullPath)) {
          allCssFiles.push(fullPath);
        }
      }
    }
  }
  walkCss(ROOT);

  let inplaceCssTotal = { before: 0, after: 0, count: 0 };
  for (const filePath of allCssFiles) {
    const code = fs.readFileSync(filePath, 'utf8');
    const srcSize = Buffer.byteLength(code);
    if (srcSize < 100) continue;
    const minified = minifyCSS(code);
    writeFileIfChanged(filePath, minified, 'utf8');
    const minSize = Buffer.byteLength(minified);
    inplaceCssTotal.before += srcSize;
    inplaceCssTotal.after += minSize;
    inplaceCssTotal.count++;
  }

  if (inplaceCssTotal.count > 0) {
    const cssPct = ((1 - inplaceCssTotal.after / inplaceCssTotal.before) * 100).toFixed(1);
    console.log(`\n  INLINE ${inplaceCssTotal.count} CSS files minified in-place`);
    console.log(`         ${fmtKB(inplaceCssTotal.before)} -> ${fmtKB(inplaceCssTotal.after)} (${cssPct}% smaller)`);
  }

  if (inplaceTotal.count > 0) {
    const inPct = ((1 - inplaceTotal.after / inplaceTotal.before) * 100).toFixed(1);
    console.log(`\n  INLINE ${inplaceTotal.count} JS files minified in-place`);
    console.log(`         ${fmtKB(inplaceTotal.before)} -> ${fmtKB(inplaceTotal.after)} (${inPct}% smaller)`);
  }

  // Summary
  const totalBefore = jsTotal.before + cssTotal.before + inplaceTotal.before + inplaceCssTotal.before;
  const totalAfter = jsTotal.after + cssTotal.after + inplaceTotal.after + inplaceCssTotal.after;
  const totalPct = totalBefore ? ((1 - totalAfter / totalBefore) * 100).toFixed(1) : 0;
  console.log(`\n  TOTAL ${jsTotal.count + inplaceTotal.count} JS + ${cssTotal.count + inplaceCssTotal.count} CSS files`);
  console.log(`        ${fmtKB(totalBefore)} -> ${fmtKB(totalAfter)} (${totalPct}% smaller, saved ${fmtKB(totalBefore - totalAfter)})`);
  if (errorCount) {
    throw new Error(`${errorCount} asset${errorCount === 1 ? '' : 's'} failed to minify`);
  }
}

function fmtKB(bytes) {
  return (bytes / 1024).toFixed(1) + 'KB';
}

run().catch(err => { console.error(err); process.exit(1); });
