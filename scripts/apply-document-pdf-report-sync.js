#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const registryPath = path.join(root, 'assets/js/components/tool-registry.js');
const loader = '<script src="/assets/js/lib/document-pdf-report-sync.js?v=20260502" defer></script>';

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, text) {
  fs.writeFileSync(file, text);
}

function parseRegistryTools() {
  const registry = read(registryPath);
  const tools = [];
  registry.split(/\r?\n/).forEach((line) => {
    if (!line.includes("category: 'document-pdf'")) return;
    if (!line.includes("href: '/tools/")) return;
    const href = /href: '([^']+)'/.exec(line)?.[1];
    const slug = /\/tools\/([^/]+)\//.exec(href || '')?.[1];
    if (slug) tools.push(slug);
  });
  return Array.from(new Set(tools));
}

function applyToFile(file) {
  if (!fs.existsSync(file)) return false;
  let html = read(file);
  if (!html.includes('pdf-download-gate.js')) return false;
  if (html.includes('/assets/js/lib/document-pdf-report-sync.js')) return false;
  const pattern = /(<script\s+src=["']\/assets\/js\/lib\/pdf-download-gate\.js[^"']*["'][^>]*><\/script>)/i;
  if (!pattern.test(html)) {
    throw new Error(`Could not find pdf-download-gate script tag in ${path.relative(root, file)}`);
  }
  html = html.replace(pattern, `$1\n${loader}`);
  write(file, html);
  return true;
}

function main() {
  const slugs = parseRegistryTools();
  let changed = 0;
  slugs.forEach((slug) => {
    ['index.html', 'app.html'].forEach((name) => {
      const file = path.join(root, 'tools', slug, name);
      if (applyToFile(file)) changed += 1;
    });
  });
  console.log(`Document PDF report sync loader applied to ${changed} page(s).`);
}

main();
