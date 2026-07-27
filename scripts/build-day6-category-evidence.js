#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const reportDir = path.join(root, 'reports');
const registrySource = fs.readFileSync(path.join(root, 'assets/js/components/tool-registry.js'), 'utf8');
const sandbox = { document: undefined, window: {} };
vm.createContext(sandbox);
vm.runInContext(registrySource, sandbox);

function routeFile(route) {
  const clean = route.replace(/^\/+|\/+$/g, '');
  return route.endsWith('/') ? path.join(root, clean, 'index.html') : path.join(root, `${clean}.html`);
}

function familyFor(row) {
  if (row.category !== 'agriculture') return row.id;
  const match = row.href.match(/^\/agriculture\/([^/]+)/);
  return match ? match[1] : row.id;
}

function htmlValue(html, expression) {
  const match = html.match(expression);
  return match ? match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
}

function imageReceipt(id) {
  const base = path.join(root, 'assets/img/tools', id);
  const found = ['.webp', '.png', '.jpg', '.jpeg', '.svg'].map((extension) => `${base}${extension}`)
    .find((candidate) => fs.existsSync(candidate));
  return found ? path.relative(root, found).replace(/\\/g, '/') : '';
}

const rows = sandbox.AFRO_TOOLS
  .filter((row) => ['agriculture', 'transport', 'trade'].includes(row.category))
  .filter((row) => row.status === 'live' || row.status === 'new')
  .filter((row) => !/^\/(?:fr|sw|ha|yo)\//.test(row.href))
  .map((row) => {
    const file = routeFile(row.href);
    const html = fs.readFileSync(file, 'utf8');
    const image = imageReceipt(row.id);
    return {
      category: row.category,
      family: familyFor(row),
      id: row.id,
      status: row.status,
      phase: row.phase,
      route: row.href,
      file: path.relative(root, file).replace(/\\/g, '/'),
      title: htmlValue(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
      description: htmlValue(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i),
      canonical: htmlValue(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i),
      schemaBlocks: (html.match(/<script[^>]+type=["']application\/ld\+json["']/gi) || []).length,
      controls: (html.match(/<(?:button|input|select|textarea)\b/gi) || []).length,
      canonicalImage: image || null,
      canonicalImagePresent: Boolean(image)
    };
  });

const counts = rows.reduce((result, row) => {
  result[row.category] = (result[row.category] || 0) + 1;
  return result;
}, {});
const families = rows.reduce((result, row) => {
  const key = `${row.category}:${row.family}`;
  result[key] = (result[key] || 0) + 1;
  return result;
}, {});
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceRevision: require('child_process').execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  sourceContract: 'English registry rows in Agriculture, Transport or Trade with status live/new; locale-prefixed /fr, /sw, /ha and /yo routes excluded.',
  counts,
  families,
  routes: rows
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'day6-agriculture-transport-trade-route-inventory.json'),
  `${JSON.stringify(report, null, 2)}\n`);

const missing = rows.filter((row) => !row.canonicalImagePresent);
const missingByCategory = missing.reduce((result, row) => {
  result[row.category] = (result[row.category] || 0) + 1;
  return result;
}, {});
const imageLines = [
  '# Day 6 missing artwork',
  '',
  'This list is intentionally separate from functional acceptance. A missing dedicated tool image does not substitute for, block, or grant route acceptance.',
  '',
  `Generated from the English live/new registry inventory: ${rows.length} routes.`,
  '',
  ...Object.entries(missingByCategory).map(([category, count]) => `- ${category}: ${count} missing canonical tool images`),
  '',
  '## Missing canonical images',
  '',
  ...missing.map((row) => `- \`${row.route}\` — expected a registry-id image for \`${row.id}\``),
  ''
];
fs.writeFileSync(path.join(reportDir, 'day6-agriculture-transport-trade-image-needs.md'), imageLines.join('\n'));
console.log(JSON.stringify({ counts, routes: rows.length, missingImages: missing.length, missingByCategory }, null, 2));
