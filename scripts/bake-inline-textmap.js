#!/usr/bin/env node
/**
 * Bake runtime textMap translations into static HTML.
 *
 * Some localized pages (e.g. sw/zana developer/PDF tools) embed a runtime
 * translation shim: `const textMap = new Map([["EN","SW"],...])` plus a
 * TreeWalker that swaps text nodes client-side. Search engines and no-JS
 * visitors only ever see the English source text, so this script applies the
 * page's own map to its static markup with the same semantics as the shim:
 *   - text segments between tags whose trimmed content exactly equals a key
 *     (script/style/noscript/title blocks excluded)
 *   - placeholder / aria-label / title / value attributes with exact match
 * The shim is left in place so runtime-generated strings keep translating.
 *
 * An external repair map can be supplied instead of the page's inline shim
 * map. The file is JSON: { "<repo-relative page path>": { "EN": "SW", ... },
 * "*": { ...applied to every listed page... } }.
 *
 * Usage:
 *   node scripts/bake-inline-textmap.js sw            # bake all pages under sw/
 *   node scripts/bake-inline-textmap.js sw --dry-run  # report only
 *   node scripts/bake-inline-textmap.js --map lang/sw-visible-copy-repairs.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DRY = process.argv.includes('--dry-run');
const mapIdx = process.argv.indexOf('--map');
const mapFile = mapIdx !== -1 ? process.argv[mapIdx + 1] : null;
const targetDir = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;

if (!targetDir && !mapFile) {
  console.error('Usage: node scripts/bake-inline-textmap.js <dir> [--dry-run] | --map <file> [--dry-run]');
  process.exit(1);
}

const pages = [];
if (targetDir) {
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) pages.push(p);
    }
  })(path.join(ROOT, targetDir));
}

let repairMap = null; // Map<absPath, Map<en, sw>>
if (mapFile) {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, mapFile), 'utf8'));
  const globals = Object.entries(raw['*'] || {});
  repairMap = new Map();
  for (const [rel, entries] of Object.entries(raw)) {
    if (rel === '*') continue;
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      console.warn(`[skip] missing page: ${rel}`);
      continue;
    }
    repairMap.set(abs, new Map([...globals, ...Object.entries(entries)]));
    if (!pages.includes(abs)) pages.push(abs);
  }
}

function extractTextMap(html) {
  const m = html.match(/const textMap = new Map\((\[[\s\S]*?\])\);/);
  if (!m) return null;
  try {
    const pairs = JSON.parse(m[1]);
    return new Map(pairs);
  } catch {
    return null;
  }
}

// Segment HTML into tags / text, tracking raw-text elements we must not touch.
function bakeMarkup(html, map) {
  let out = '';
  let i = 0;
  let replaced = 0;
  const rawTextUntil = (tag) => new RegExp(`</${tag}\\s*>`, 'ig');

  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      out += bakeTextSegment(html.slice(i));
      break;
    }
    // text segment before the tag
    if (lt > i) out += bakeTextSegment(html.slice(i, lt));

    // comment
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt);
      const stop = end === -1 ? html.length : end + 3;
      out += html.slice(lt, stop);
      i = stop;
      continue;
    }

    const gt = html.indexOf('>', lt);
    if (gt === -1) {
      out += html.slice(lt);
      break;
    }
    let tag = html.slice(lt, gt + 1);
    const nameMatch = tag.match(/^<\s*([a-zA-Z0-9-]+)/);
    const tagName = nameMatch ? nameMatch[1].toLowerCase() : '';

    // bake translatable attributes on the tag itself
    tag = tag.replace(
      /\b(placeholder|aria-label|title|value|alt)="([^"]*)"/g,
      (whole, attr, val) => {
        const key = val.trim();
        if (map.has(key) && map.get(key) !== key) {
          replaced++;
          return `${attr}="${map.get(key)}"`;
        }
        return whole;
      }
    );
    out += tag;
    i = gt + 1;

    // skip raw-text element bodies untouched
    if (['script', 'style', 'noscript', 'title', 'textarea'].includes(tagName) && !tag.endsWith('/>')) {
      const re = rawTextUntil(tagName);
      re.lastIndex = i;
      const m = re.exec(html);
      const stop = m ? m.index + m[0].length : html.length;
      out += html.slice(i, stop);
      i = stop;
    }
  }

  function bakeTextSegment(seg) {
    const trimmed = seg.trim();
    if (!trimmed) return seg;
    if (map.has(trimmed) && map.get(trimmed) !== trimmed) {
      replaced++;
      return seg.replace(trimmed, map.get(trimmed));
    }
    return seg;
  }

  return { html: out, replaced };
}

let touched = 0;
let totalReplacements = 0;
for (const p of pages) {
  const html = fs.readFileSync(p, 'utf8');
  const map = repairMap ? repairMap.get(p) : extractTextMap(html);
  if (!map) continue;
  const { html: baked, replaced } = bakeMarkup(html, map);
  if (replaced > 0) {
    touched++;
    totalReplacements += replaced;
    console.log(`${replaced}\t${path.relative(ROOT, p)}`);
    if (!DRY) fs.writeFileSync(p, baked, 'utf8');
  }
}
console.log(`\n${DRY ? '[dry-run] ' : ''}${touched} pages, ${totalReplacements} replacements baked.`);
