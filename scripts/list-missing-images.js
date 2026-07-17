#!/usr/bin/env node
/**
 * List tools missing .webp images in /assets/img/tools/
 * Outputs MISSING-TOOL-IMAGES.md
 */
const fs = require('fs');
const path = require('path');

const registryPath = path.join(__dirname, '..', 'assets', 'js', 'components', 'tool-registry.js');
const registryCode = fs.readFileSync(registryPath, 'utf8');

const sandbox = { document: { readyState: 'complete', getElementById: () => null, createElement: () => ({ textContent: '' }), head: { appendChild: () => {} }, addEventListener: () => {}, dispatchEvent: () => {}, querySelector: () => null } };
function FakeEvent() {}
const fn = new Function('document', 'CustomEvent', registryCode + '\nreturn { AFRO_TOOLS, AFRO_CATEGORIES };');
const { AFRO_TOOLS } = fn(sandbox.document, FakeEvent);

const imgDir = path.join(__dirname, '..', 'assets', 'img', 'tools');
const iconDir = path.join(__dirname, '..', 'assets', 'img', 'tool-icons');

const have = new Set();
if (fs.existsSync(imgDir)) {
  fs.readdirSync(imgDir).forEach(f => {
    if (f.endsWith('.webp')) have.add(f.replace('.webp', ''));
  });
}

const havePng = new Set();
if (fs.existsSync(iconDir)) {
  fs.readdirSync(iconDir).forEach(f => {
    if (f.endsWith('.png')) havePng.add(f.replace('.png', ''));
  });
}

const live = AFRO_TOOLS.filter(t => t.status === 'live');
const missing = live.filter(t => !have.has(t.id));

// Group by category
const byCat = {};
missing.forEach(t => {
  if (!byCat[t.category]) byCat[t.category] = [];
  byCat[t.category].push(t);
});

let md = '# Missing Tool Images (.webp)\n\n';
md += `Total live tools: ${live.length}\n`;
md += `Have .webp: ${live.length - missing.length}\n`;
md += `Missing .webp: ${missing.length}\n\n`;

const cats = Object.keys(byCat).sort();
cats.forEach(cat => {
  md += `## ${cat} (${byCat[cat].length})\n\n`;
  byCat[cat].forEach(t => {
    const hasFallback = havePng.has(t.id) ? ' ✅ has .png fallback' : ' ❌ no fallback';
    md += `- \`${t.id}\` — ${t.name}${hasFallback}\n`;
  });
  md += '\n';
});

const outPath = path.join(__dirname, '..', 'MISSING-TOOL-IMAGES.md');
fs.writeFileSync(outPath, md, 'utf8');
console.log('Written to MISSING-TOOL-IMAGES.md');
console.log(`${missing.length} tools missing .webp out of ${live.length} live tools`);
