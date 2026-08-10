#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { localizedGeneratorEquivalent } = require('./lib/localized-generator-equivalence');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const ENGLISH_APP = 'engineering/afrodraft/app.html';
const FRENCH_APP = 'fr/ingenierie/afrodraft/app.html';
const SW_APP = 'sw/zana/afrodraft-cad/app.html';
const SW_LANDING = 'sw/zana/afrodraft-cad/index.html';
let changed = 0;

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function write(relativePath, content) {
  const target = path.join(ROOT, relativePath);
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (current === content || (relativePath === SW_APP && localizedGeneratorEquivalent(current, content))) return;
  changed += 1;
  if (!WRITE) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function replaceAlternate(html, hreflang, route) {
  const tag = `<link rel="alternate" hreflang="${hreflang}" href="https://afrotools.com${route}">`;
  const pattern = new RegExp(`<link rel="alternate" hreflang="${hreflang}" href="[^"]*">`, 'i');
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace(/(<link rel="alternate" hreflang="x-default"[^>]*>)/i, `${tag}\n$1`);
}

function addSwReciprocal(relativePath) {
  write(relativePath, replaceAlternate(read(relativePath), 'sw', '/sw/zana/afrodraft-cad/app'));
}

function buildSwApp() {
  let html = read(ENGLISH_APP);
  html = html
    .replace(/<html([^>]*)\blang="en"/, '<html$1lang="sw"')
    .replace(/<title>[\s\S]*?<\/title>/, '<title>AfroDraft CAD v7.0 — Uchoraji wa 2D | AfroTools</title>')
    .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="Chora, pima, hariri na uhifadhi michoro ya CAD ya 2D ndani ya kivinjari. Hamisha ADRAFT, DXF, SVG, PNG na PDF bila kutuma mradi wako mtandaoni.">')
    .replace(/<meta property="og:locale" content="[^"]*">/, '<meta property="og:locale" content="sw_KE">')
    .replace(/<meta property="og:locale:alternate" content="[^"]*">/, '<meta property="og:locale:alternate" content="en_US">')
    .replace(/<meta name="twitter:title" content="[^"]*">/, '<meta name="twitter:title" content="AfroDraft CAD v7.0 — Uchoraji wa 2D | AfroTools">')
    .replace(/<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="Studio kamili ya CAD ya 2D inayofanya kazi ndani ya kivinjari chako.">')
    .replace(/<meta name="twitter:image" content="[^"]*">/, '<meta name="twitter:image" content="https://afrotools.com/assets/img/tools/afrodraft.webp">')
    .replace(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="https://afrotools.com/sw/zana/afrodraft-cad/app">')
    .replace(/href="assets\//g, 'href="/engineering/afrodraft/assets/')
    .replace(/src="app\.js[^\"]*"/, 'src="/engineering/afrodraft/app.js"')
    .replace(/src="src\/ui\/WorkspaceShell\.js[^\"]*"/, 'src="/engineering/afrodraft/src/ui/WorkspaceShell.js"')
    .replace(/src="src\/ui\/TemplateLauncher\.js[^\"]*"/, 'src="/engineering/afrodraft/src/ui/TemplateLauncher.js"')
    .replace(/src="src\/features\/v7-features\.js[^\"]*"/, 'src="/engineering/afrodraft/src/features/v7-features.js"')
    .replace(/<h1([^>]*)>[\s\S]*?<\/h1>/, '<h1$1>AfroDraft CAD — Uchoraji wa kitaalamu wa 2D kwa Afrika</h1>')
    .replace('Starting CAD engine...', 'Inaanzisha injini ya CAD...')
    .replace('title="New Drawing (Ctrl+N)"', 'title="Mchoro mpya (Ctrl+N)"')
    .replace('title="Zoom In (+)"', 'title="Kuza (+)"')
    .replace('title="Zoom Out (-)"', 'title="Punguza (-)"')
    .replace('title="Zoom Extents (Z+E)"', 'title="Onyesha mchoro wote (Z+E)"')
    .replace('<span class="panel-title">Properties</span>', '<span class="panel-title">Sifa</span>')
    .replace('title="Collapse Panel"', 'title="Kunja paneli"')
    .replace('<span id="cmd-prompt">Command:</span>', '<span id="cmd-prompt">Amri:</span>')
    .replace('aria-label="Type a command"', 'aria-label="Andika amri"')
    .replace('placeholder="Type a command..."', 'placeholder="Andika amri..."')
    .replace('aria-label="Type a command name"', 'aria-label="Andika jina la amri"')
    .replace('placeholder="Type a command name..."', 'placeholder="Andika jina la amri..."');

  html = html.replace(/\s*<link rel="canonical"[^>]*>[\s\S]*?<link rel="alternate" hreflang="x-default"[^>]*>/, `
<link rel="canonical" href="https://afrotools.com/sw/zana/afrodraft-cad/app">
<link rel="alternate" hreflang="en" href="https://afrotools.com/engineering/afrodraft/app">
<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/ingenierie/afrodraft/app">
<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/afrodraft-cad/app">
<link rel="alternate" hreflang="x-default" href="https://afrotools.com/engineering/afrodraft/app">`);

  const metadata = `<meta name="afrotools-content-id" content="sw-engineering:afrodraft-workspace">
<meta name="afrotools-source-owner" content="scripts/build-sw-afrodraft-final.js">
<meta name="afrotools-source-route" content="/engineering/afrodraft/app">
<meta name="afrotools-ai-tool-id" content="afrodraft">
<meta property="og:image" content="https://afrotools.com/assets/img/tools/afrodraft.webp">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"AfroDraft CAD v7.0 — Uchoraji wa 2D","description":"Chora, pima, hariri na uhamishe michoro ya CAD ya 2D ndani ya kivinjari.","url":"https://afrotools.com/sw/zana/afrodraft-cad/app","inLanguage":"sw","applicationCategory":"DesignApplication","operatingSystem":"Kivinjari cha kisasa","isAccessibleForFree":true,"image":"https://afrotools.com/assets/img/tools/afrodraft.webp","featureList":["Mchoro kamili wa CAD wa 2D","Tabaka, vitalu, vipimo na violezo","ADRAFT, DXF, SVG, PNG na PDF","Hifadhi ya ndani na urejeshaji wa kiotomatiki"]}</script>`;
  html = html.replace('</head>', `${metadata}\n</head>`);
  html = html.replace(
    '<script type="module" src="/engineering/afrodraft/app.js"></script>',
    '<script src="/assets/js/pages/sw-afrodraft-i18n.js"></script>\n  <script type="module" src="/engineering/afrodraft/app.js"></script>'
  );
  return html;
}

function updateLanding() {
  const current = read(SW_LANDING);
  const next = current
    .replace(/href="\/engineering\/afrodraft\/app(?:\.html)?"/g, 'href="/sw/zana/afrodraft-cad/app"')
    .replace('Fungua AfroDraft programu', 'Fungua studio ya AfroDraft');
  write(SW_LANDING, next);
}

write(SW_APP, buildSwApp());
addSwReciprocal(ENGLISH_APP);
addSwReciprocal(FRENCH_APP);
updateLanding();

if (!WRITE && changed) {
  console.error(`Swahili AfroDraft owner is stale: ${changed} file(s) differ. Run node scripts/build-sw-afrodraft-final.js --write`);
  process.exitCode = 1;
} else {
  console.log(`Swahili AfroDraft owner ${WRITE ? 'wrote' : 'verified'} ${changed} change(s).`);
}
