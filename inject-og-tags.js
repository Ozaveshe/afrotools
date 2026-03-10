#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// AfroTools — OG Tag Injector
// Run from repo root: node inject-og-tags.js
// Reads AFRO_TOOLS from tool-registry.js, finds each tool's
// HTML file, injects correct OG/Twitter image meta tags.
// ═══════════════════════════════════════════════════════════

const fs   = require('fs');
const path = require('path');

// ── Load the registry (eval the var declaration) ──
const registryPath = path.join(__dirname, 'assets/js/components/tool-registry.js');
const registryCode = fs.readFileSync(registryPath, 'utf8');

// Extract AFRO_TOOLS array via eval in a sandboxed scope
let AFRO_TOOLS;
try {
  const sandbox = {};
  const wrapped = `(function(exports) { ${registryCode} \n exports.AFRO_TOOLS = AFRO_TOOLS; })(exports)`;
  const mod = { exports: sandbox };
  eval(wrapped.replace('exports', 'mod.exports'));
  AFRO_TOOLS = mod.exports.AFRO_TOOLS;
} catch(e) {
  // Fallback: simple regex extraction of id + href fields
  AFRO_TOOLS = [];
  const matches = registryCode.matchAll(/\{\s*id:\s*'([^']+)'[^}]*href:\s*'([^']+)'[^}]*\}/g);
  for (const m of matches) AFRO_TOOLS.push({ id: m[1], href: m[2], name: m[1] });
}

if (!AFRO_TOOLS || !AFRO_TOOLS.length) {
  console.error('❌ Could not load AFRO_TOOLS from registry');
  process.exit(1);
}

console.log(`✓ Loaded ${AFRO_TOOLS.length} tools from registry\n`);

const BASE_URL  = 'https://afrotools.com';
const IMG_BASE  = `${BASE_URL}/assets/img/tools`;
const FALLBACK  = `${BASE_URL}/assets/img/og-home.png`;

let patched = 0, skipped = 0, notFound = 0;

// ── Build OG block for a tool ──
function buildOgBlock(tool) {
  const imgUrl = `${IMG_BASE}/${tool.id}.webp`;
  const title  = tool.name ? `${tool.name} — AfroTools` : 'AfroTools';
  const desc   = tool.desc || 'Free African financial tools. Always accurate. Always free.';
  const url    = `${BASE_URL}${tool.href}`;

  return [
    `  <meta property="og:title" content="${escAttr(title)}">`,
    `  <meta property="og:description" content="${escAttr(desc.slice(0, 160))}">`,
    `  <meta property="og:url" content="${url}">`,
    `  <meta property="og:type" content="website">`,
    `  <meta property="og:image" content="${imgUrl}">`,
    `  <meta property="og:image:width" content="1200">`,
    `  <meta property="og:image:height" content="630">`,
    `  <meta property="og:site_name" content="AfroTools">`,
    `  <meta name="twitter:card" content="summary_large_image">`,
    `  <meta name="twitter:title" content="${escAttr(title)}">`,
    `  <meta name="twitter:description" content="${escAttr(desc.slice(0, 160))}">`,
    `  <meta name="twitter:image" content="${imgUrl}">`,
  ].join('\n');
}

function escAttr(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Resolve href → file path ──
function hrefToFilePath(href) {
  // /nigeria/ng-salary-tax → nigeria/ng-salary-tax/index.html or nigeria/ng-salary-tax.html
  const rel   = href.replace(/^\//, '');
  const opts  = [
    path.join(__dirname, rel, 'index.html'),
    path.join(__dirname, rel + '.html'),
    path.join(__dirname, rel + '/index.html'),
  ];
  for (const p of opts) { if (fs.existsSync(p)) return p; }
  return null;
}

// ── OG block markers ──
const OG_START = '  <!-- OG:START -->';
const OG_END   = '  <!-- OG:END -->';

// ── Inject or replace OG block in HTML string ──
function patchHtml(html, tool) {
  const block = buildOgBlock(tool);
  const wrapped = `${OG_START}\n${block}\n${OG_END}`;

  // If markers exist — replace between them
  if (html.includes(OG_START) && html.includes(OG_END)) {
    const s = html.indexOf(OG_START);
    const e = html.indexOf(OG_END) + OG_END.length;
    return html.slice(0, s) + wrapped + html.slice(e);
  }

  // If existing og:image — replace the whole og cluster
  if (html.includes('<meta property="og:image"')) {
    // Remove existing og: and twitter: meta tags in head
    html = html
      .replace(/\n?\s*<meta property="og:[^"]*"[^>]*>/g, '')
      .replace(/\n?\s*<meta name="twitter:[^"]*"[^>]*>/g, '');
  }

  // Inject after </title> or after last <meta> in head
  const titleEnd = html.indexOf('</title>');
  if (titleEnd !== -1) {
    const insertAt = titleEnd + '</title>'.length;
    return html.slice(0, insertAt) + '\n' + wrapped + html.slice(insertAt);
  }

  // Fallback: inject before </head>
  return html.replace('</head>', wrapped + '\n</head>');
}

// ── Process each tool ──
for (const tool of AFRO_TOOLS) {
  if (!tool.href || tool.href === '#') { skipped++; continue; }

  const filePath = hrefToFilePath(tool.href);
  if (!filePath) {
    console.log(`  ⚪ ${tool.id} — file not found (${tool.href})`);
    notFound++;
    continue;
  }

  const original = fs.readFileSync(filePath, 'utf8');
  const patched_html = patchHtml(original, tool);

  if (patched_html === original) {
    console.log(`  ↔  ${tool.id} — no change needed`);
    skipped++;
  } else {
    fs.writeFileSync(filePath, patched_html, 'utf8');
    console.log(`  ✓  ${tool.id} → ${path.relative(__dirname, filePath)}`);
    patched++;
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✓ Patched:   ${patched} files`);
console.log(`⚪ Skipped:   ${skipped} (no change / no href)`);
console.log(`○ Not found: ${notFound} (page not built yet)`);
console.log(`\nDone. Commit with:`);
console.log(`  git add . && git commit -m "feat: inject OG image tags into all tool pages" && git push`);
