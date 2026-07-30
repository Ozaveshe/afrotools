'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'localization', 'fr-fintech-banking-parity-manifest.json');
const TEMPLATE_ROOT = path.join(ROOT, 'data', 'localization', 'fr-fintech-banking-pages');

function outputPath(route) {
  return path.join(ROOT, route.replace(/^\/+|\/+$/g, ''), 'index.html');
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  let written = 0;
  for (const row of manifest.routes) {
    const template = path.join(TEMPLATE_ROOT, `${row.englishId}.html`);
    if (!fs.existsSync(template)) continue;
    const output = outputPath(row.frenchRoute);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    let html = fs.readFileSync(template, 'utf8');
    if (!/^<!DOCTYPE html>\r?\n<html\b[^>]*\blang="fr"/.test(html)) {
      throw new Error(`${path.relative(ROOT, template)} is not an explicit native French page`);
    }
    if (/<iframe\b|frToolGapLocalizer|fetch\s*\(\s*['"]\/tools\//i.test(html)) {
      throw new Error(`${path.relative(ROOT, template)} contains a bridge or English runtime transplant`);
    }
    html = html.replace(
      /<meta\s+name=["']afrotools-source-owner["']\s+content=["'][^"']+["']\s*>/i,
      '<meta name="afrotools-source-owner" content="scripts/build-french-fintech-banking-pages.js">'
    );
    fs.writeFileSync(output, html.endsWith('\n') ? html : `${html}\n`, 'utf8');
    written += 1;
  }
  console.log(`Built ${written} explicit French Fintech & Banking page template${written === 1 ? '' : 's'}.`);
}

if (require.main === module) main();

module.exports = { main };
