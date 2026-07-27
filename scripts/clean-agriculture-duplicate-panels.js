#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const registrySource = fs.readFileSync(path.join(root, 'assets/js/components/tool-registry.js'), 'utf8');
const sandbox = { document: undefined, window: {} };
vm.createContext(sandbox);
vm.runInContext(registrySource, sandbox);

function routeFile(route) {
  const clean = String(route).replace(/^\/+|\/+$/g, '');
  return route.endsWith('/') ? path.join(root, clean, 'index.html') : path.join(root, `${clean}.html`);
}

const files = Array.from(new Set(
  sandbox.AFRO_TOOLS
    .filter((row) => row.category === 'agriculture' && ['live', 'new'].includes(row.status))
    .filter((row) => !/^\/(?:fr|sw|ha|yo)\//.test(row.href))
    .map((row) => routeFile(row.href))
    .concat(path.join(root, 'tools', 'planting-calendar', 'index.html'))
)).filter((file) => fs.existsSync(file));

function cleanFaqSchema(html) {
  return html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    (block, source) => {
      let schema;
      try {
        schema = JSON.parse(source);
      } catch {
        return block;
      }
      if (!schema || schema['@type'] !== 'FAQPage' || !Array.isArray(schema.mainEntity)) return block;
      const answers = schema.mainEntity.map((entry) => String(entry.acceptedAnswer && entry.acceptedAnswer.text || ''));
      if (answers.some((answer) => /educational planning workflow/i.test(answer))) return '';
      const filtered = schema.mainEntity.filter((entry) => {
        const answer = String(entry.acceptedAnswer && entry.acceptedAnswer.text || '');
        return !/Enter your farm figures and local prices|as accurate as the values you enter|built for all 54 African countries/i.test(answer);
      });
      if (filtered.length === schema.mainEntity.length) return block;
      if (!filtered.length) return '';
      schema.mainEntity = filtered;
      return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
    });
}

function clean(html) {
  const genericPanel = /<section class="df-upgrade"[\s\S]*?<\/section>/i.exec(html);
  if (!genericPanel || !genericPanel[0].includes('Quantity or area')) return html;

  let next = html.replace(genericPanel[0], '');
  next = next.replace(/\s*<section class="df-faq"[\s\S]*?<\/section>/i, '');
  next = cleanFaqSchema(next);
  if (!next.includes('data-df-form=')) {
    next = next.replace(/\s*<link rel="stylesheet" href="\/assets\/css\/english-df-app-upgrades\.css[^"]*">\s*/i, '\n');
    next = next.replace(/\s*<script src="\/assets\/js\/pages\/english-df-app-upgrades\.js[^"]*" defer><\/script>\s*/i, '\n');
  }
  return next.replace(/\n{3,}/g, '\n\n');
}

let changed = 0;
let stale = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  const after = clean(before);
  if (before === after) continue;
  changed += 1;
  if (process.argv.includes('--check')) {
    stale += 1;
  } else {
    fs.writeFileSync(file, after);
  }
}

if (process.argv.includes('--check')) {
  if (stale) {
    console.error(`${stale} Agriculture routes still contain a duplicated generic planning panel.`);
    process.exit(1);
  }
  console.log(`Agriculture duplicate-panel check passed across ${files.length} registry routes.`);
  process.exit(0);
}

console.log(`Removed misleading duplicate planning panels from ${changed} Agriculture routes.`);
