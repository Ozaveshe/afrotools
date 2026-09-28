#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const context = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'engines/src/afroatlas-engine.js'), 'utf8'), context);
const codes = Object.keys(context.AfroAtlas.COUNTRIES).concat(Object.keys(context.AfroAtlas.WORLD_REF)).sort();
const version = 'v17.0.3';
const base = 'https://raw.githubusercontent.com/jdecked/twemoji/' + version + '/';
const directory = path.join(root, 'assets/img/flags/afroatlas');

async function read(url) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return await response.text();
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
}

async function run() {
  fs.mkdirSync(directory, { recursive: true });
  const manifest = { provider: 'Twemoji', version, license: 'CC-BY-4.0', source: 'https://github.com/jdecked/twemoji/tree/' + version + '/assets/svg', assets: {} };
  for (let offset = 0; offset < codes.length; offset += 6) {
    await Promise.all(codes.slice(offset, offset + 6).map(async code => {
      const unicode = Array.from(code).map(letter => (127462 + letter.charCodeAt(0) - 65).toString(16)).join('-');
      const svg = await read(base + 'assets/svg/' + unicode + '.svg');
      if (!/<svg\b/.test(svg) || /<script|<foreignObject|\bon\w+=|https?:\/\//i.test(svg.replace(/xmlns="[^"]+"/g, ''))) throw new Error('Unexpected SVG content: ' + code);
      fs.writeFileSync(path.join(directory, code.toLowerCase() + '.svg'), svg);
      manifest.assets[code] = { path: '/assets/img/flags/afroatlas/' + code.toLowerCase() + '.svg', sha256: crypto.createHash('sha256').update(svg).digest('hex') };
    }));
    console.log('Imported flags: ' + Math.min(offset + 6, codes.length) + '/' + codes.length);
  }
  const license = (await read(base + 'LICENSE-GRAPHICS')).replace(/[\t ]+$/gm, '');
  fs.writeFileSync(path.join(directory, 'LICENSE.txt'), license);
  manifest.assets = Object.fromEntries(codes.map(code => [code, manifest.assets[code]]));
  fs.writeFileSync(path.join(root, 'data/afroatlas/flag-assets.json'), JSON.stringify(manifest, null, 2) + '\n');
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
