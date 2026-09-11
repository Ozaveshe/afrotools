#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { extractCanonicalTags } = require('./lib/route-contract');
const { readMeta } = require('./lib/content-integrity');
const { writeFileSyncWithRetry, renameSyncWithRetry, unlinkSyncWithRetry } = require('./lib/safe-write');
const ROOT = path.resolve(__dirname, '..');

function sitemap(root = ROOT) {
  const routes = [];
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name === 'index.html') {
        const html = fs.readFileSync(file, 'utf8');
        const robots = readMeta(html, 'robots');
        if (/\bnoindex\b/i.test(robots)) continue;
        const route = 'https://afrotools.com/' + path.relative(root, dir).replace(/\\/g, '/') + '/';
        const canonicals = extractCanonicalTags(html);
        if (canonicals.length !== 1 || canonicals[0] !== route) throw new Error('JAMB sitemap canonical mismatch: ' + route);
        routes.push(route);
      }
    }
  }
  visit(path.join(root, 'jamb'));
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + routes.sort().map(route => '  <url><loc>' + route.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</loc></url>').join('\n') + '\n</urlset>\n';
}
function build(root = ROOT, check = false) {
  const text = sitemap(root); const file = path.join(root, 'jamb/sitemap.xml');
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === text) return { changed: false };
  if (check) throw new Error('JAMB sitemap is missing or stale; run npm run jamb:sitemap');
  const temporary = file + '.review-tmp-' + process.pid;
  try { writeFileSyncWithRetry(temporary, text, 'utf8'); renameSyncWithRetry(temporary, file); }
  finally { unlinkSyncWithRetry(temporary); }
  return { changed: true };
}
if (require.main === module) console.log(JSON.stringify(build(ROOT, process.argv.includes('--check'))));
module.exports = { sitemap, build };
