#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { localizedGeneratorEquivalent } = require('./lib/localized-generator-equivalence');
const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const CHECK = process.argv.includes('--check');
if (WRITE === CHECK) throw new Error('Use exactly one of --write or --check.');

const SOURCE = {
  url: 'https://www.statssa.gov.za/?page_id=2528',
  label: 'Stats SA — Construction Material Price Indices, sources and methods (2026)',
  role: 'official-south-africa-index-context-only',
  availability: 'available',
  checkedAt: '2026-08-02',
  jurisdiction: 'Mfululizo rasmi wa takwimu za Afrika Kusini pekee; si bei ya mradi, bei ya kipimo, BOQ, nukuu ya mkandarasi au mamlaka ya nchi nyingine.',
  freshness: 'Weka upya kiasi, bei ya kipimo, gharama zisizobadilika na akiba kutoka nukuu za sasa za eneo na tarehe ya mradi wako.',
  confidence: {
    calculation: 'Juu kwa hesabu kutoka maingizo yanayoonekana.',
    applicability: 'Chini kwa bajeti halisi ya mradi; inategemea ubora, tarehe, eneo, vipimo na nukuu ulizoingiza.'
  },
  suppliesUnitPrices: false
};
const fields = [
  { name: 'currency', label: 'Jina la sarafu', type: 'text', sourceDefault: 'your currency', initialValue: 'sarafu yako', required: true },
  { name: 'quantity', label: 'Kiasi au eneo', type: 'number', initialValue: '', min: '0.01', step: 'any', required: true },
  { name: 'unitCost', label: 'Gharama kwa kipimo', type: 'number', initialValue: '', min: '0.01', step: 'any', required: true },
  { name: 'fixed', label: 'Gharama zisizobadilika', type: 'number', initialValue: '', min: '0', step: 'any', required: true },
  { name: 'contingency', label: 'Akiba ya dharura (%)', type: 'number', initialValue: '', min: '0', max: '100', step: 'any', required: true }
];
const APPS = [
  {
    englishId: 'building-materials', englishRoute: '/tools/building-materials/', frenchRoute: '/fr/tools/materiaux-construction/', swahiliRoute: '/sw/zana/gharama-vifaa-vya-ujenzi/',
    name: 'Kikokotoo cha gharama za vifaa vya ujenzi',
    description: 'Kadiria gharama ya vifaa kutoka kiasi, bei ya kipimo, gharama zisizobadilika na akiba ulizoingiza; hakuna bei ya saruji, tofali, chuma au kifaa inayopakiwa.',
    intro: 'Hesabu hii hutumia kiasi, bei ya kipimo, gharama zisizobadilika na akiba yako.',
    artworkWidth: 800, artworkHeight: 450
  },
  {
    englishId: 'construction-budget', englishRoute: '/tools/construction-budget/', frenchRoute: '/fr/tools/budget-construction/', swahiliRoute: '/sw/zana/bajeti-ya-ujenzi-wa-nyumba/',
    name: 'Mpangaji wa bajeti ya ujenzi wa nyumba',
    description: 'Jenga makisio ya bajeti kutoka kiasi, gharama kwa kipimo, gharama zisizobadilika na akiba ulizoingiza; hakuna gharama ya nchi au daraja la ubora linalodhaniwa.',
    intro: 'Hesabu hii hutumia kiasi, gharama kwa kipimo, gharama zisizobadilika na akiba yako.',
    artworkWidth: 800, artworkHeight: 450
  }
].map((app) => ({ ...app, fields, results: [{ key: 'total', label: 'Jumla ya makisio', format: 'money' }], formula: 'jumla = (kiasi × gharamaKwaKipimo + gharamaZisizobadilika) × (1 + akiba ÷ 100)', fixture: { currency: 'KES', quantity: '10', unitCost: '100', fixed: '50', contingency: '10' }, expected: { total: 1155 }, source: SOURCE, sharedEngine: 'property-assumption', exports: ['copy', 'txt', 'json', 'pdf', 'print'], privacy: 'local-only-no-storage-no-ai-no-account' }));

function esc(value) { return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function attr(tag, name) { const match = tag.match(new RegExp(`\\s${name}(?:=["']([^"']*)["'])?(?=\\s|>|/)`, 'i')); return match ? (match[1] ?? true) : null; }
function verifyOwner(app) {
  const source = fs.readFileSync(path.join(ROOT, app.englishRoute.replace(/^\//, ''), 'index.html'), 'utf8');
  for (const field of fields) {
    const tag = source.match(new RegExp(`<input[^>]+name=["']${field.name}["'][^>]*>`, 'i'))?.[0];
    if (!tag) throw new Error(`${app.englishId}:${field.name} missing.`);
    for (const name of ['min', 'max', 'step', 'required']) if (attr(tag, name) !== (field[name] ?? null)) throw new Error(`${app.englishId}:${field.name}:${name} drifted.`);
    if (field.type === 'number' && (attr(tag, 'value') || '') !== '') throw new Error(`${app.englishId}:${field.name} is not blank.`);
  }
}
function input(field) {
  const attrs = [`name="${field.name}"`, `id="sw-pcp-${field.name}"`, `type="${field.type}"`, `value="${esc(field.initialValue)}"`, field.type === 'number' ? 'inputmode="decimal"' : 'autocomplete="off"', field.min != null ? `min="${field.min}"` : '', field.max != null ? `max="${field.max}"` : '', field.step ? `step="${field.step}"` : '', field.required ? 'required' : ''].filter(Boolean).join(' ');
  return `<label for="sw-pcp-${field.name}"><span>${esc(field.label)}</span><input ${attrs}></label>`;
}
function page(app) {
  const canonical = `https://afrotools.com${app.swahiliRoute}`, artwork = `/assets/img/tools/${app.englishId}.webp`;
  const schema = { '@context': 'https://schema.org', '@type': 'WebApplication', name: app.name, description: app.description, url: canonical, inLanguage: 'sw', applicationCategory: 'FinanceApplication', operatingSystem: 'Any', isAccessibleForFree: true, isBasedOn: `https://afrotools.com${app.englishRoute}`, image: `https://afrotools.com${artwork}` };
  return `<!doctype html>\n<!-- Generated by scripts/build-sw-property-construction-planning-parity.js. -->\n<html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="afrotools-content-id" content="sw-property-construction:${esc(app.englishId)}"><meta name="afrotools-source-owner" content="scripts/build-sw-property-construction-planning-parity.js"><title>${esc(app.name)} | AfroTools</title><meta name="description" content="${esc(app.description)}"><link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="en" href="https://afrotools.com${app.englishRoute}"><link rel="alternate" hreflang="fr" href="https://afrotools.com${app.frenchRoute}"><link rel="alternate" hreflang="sw" href="${canonical}"><link rel="alternate" hreflang="x-default" href="https://afrotools.com${app.englishRoute}"><meta property="og:type" content="website"><meta property="og:locale" content="sw_KE"><meta property="og:title" content="${esc(app.name)} | AfroTools"><meta property="og:description" content="${esc(app.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://afrotools.com${artwork}"><script type="application/ld+json">${JSON.stringify(schema)}</script><link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/sw-property-construction-planning.css"><script src="/assets/js/supabase.min.js"></script></head><body class="sw-pcp-page"><a class="pcp-skip" href="#sw-pcp-form">Ruka hadi kwenye kikokotoo</a><afro-navbar active="legal"></afro-navbar><main class="pcp-shell" data-sw-property-construction-app data-english-id="${app.englishId}"><nav class="pcp-breadcrumb" aria-label="Mfuatano"><a href="/sw/">Mwanzo</a> / <a href="/sw/nyumba-na-ardhi/">Nyumba na ardhi</a> / ${esc(app.name)}</nav><header class="pcp-hero"><div><p class="pcp-kicker">Makisio ya ndani ya ujenzi</p><h1>${esc(app.name)}</h1><p>${esc(app.description)}</p><p class="pcp-boundary"><strong>Mpaka:</strong> hakuna bei ya kifaa, BOQ, nukuu, kiwango, sheria au mamlaka ya nchi inayopakiwa. Sehemu za hesabu huanza tupu.</p></div><img src="${artwork}" alt="Mchoro wa ${esc(app.name)}" width="${app.artworkWidth}" height="${app.artworkHeight}"></header><section class="pcp-layout"><article class="pcp-card"><h2>Weka makisio yako</h2><form id="sw-pcp-form" novalidate><div class="pcp-fields">${fields.map(input).join('')}</div><div class="pcp-actions"><button type="submit">Kokotoa kwa maingizo yangu</button><button type="button" data-action="reset">Weka upya</button></div></form><p data-status role="status" aria-live="polite">Kikokotoo kiko tayari. Maingizo yako hayatoki kwenye kivinjari.</p><section class="pcp-result" data-result tabindex="-1" aria-live="polite" hidden></section><div class="pcp-export" data-export-bar hidden><button type="button" data-action="copy">Nakili</button><button type="button" data-action="txt">Pakua TXT</button><button type="button" data-action="json">Pakua JSON</button><button type="button" data-action="pdf">Pakua PDF</button><button type="button" data-action="print">Chapisha</button></div><p><strong>Faragha:</strong> maingizo, hesabu na vipakuliwa vinabaki kwenye kivinjari. Hakuna akaunti, barua pepe, AI au hifadhi ya kivinjari inayohitajika.</p></article><aside class="pcp-card pcp-source" data-source-panel data-source-state="available"><h2>Chanzo, eneo, upya na uhakika</h2><p><strong>Eneo la chanzo:</strong> <span data-source-jurisdiction>${esc(SOURCE.jurisdiction)}</span></p><p><a data-source-link href="${SOURCE.url}" target="_blank" rel="noopener noreferrer">${esc(SOURCE.label)}</a></p><p><strong>Ilipokaguliwa:</strong> <time datetime="2026-08-02">2 Agosti 2026</time></p><p><strong>Upya:</strong> ${esc(SOURCE.freshness)}</p><p data-source-confidence><strong>Uhakika:</strong> ${esc(SOURCE.confidence.calculation)} ${esc(SOURCE.confidence.applicability)}</p><p><strong>Matumizi ya chanzo:</strong> muktadha wa faharasa ya Afrika Kusini pekee. Stats SA haitoi bei ya kipimo, kiasi, BOQ, nukuu, sarafu au matokeo ya zana hii.</p><p><strong>Muhimu:</strong> haya ni makisio ya kupanga, si BOQ rasmi, nukuu, zabuni au ushauri wa kitaalamu.</p></aside></section></main><afro-footer></afro-footer><script id="sw-pcp-contract" type="application/json">${JSON.stringify(app).replace(/</g, '\\u003c')}</script><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script><script src="/assets/js/engines/property-assumption.js"></script><script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script><script src="/assets/js/pages/sw-property-construction-planning.js" defer></script><script src="/assets/js/lib/sw-accessibility.js" defer></script><script src="/assets/js/lazy-analytics.js" defer></script></body></html>\n`;
}

const outputs = { 'data/registry/sw-property-construction-planning.json': `${JSON.stringify({ schemaVersion: 1, owner: 'scripts/build-sw-property-construction-planning-parity.js', count: APPS.length, rows: APPS }, null, 2)}\n` };
for (const app of APPS) { verifyOwner(app); outputs[path.posix.join(app.swahiliRoute.replace(/^\//, ''), 'index.html')] = page(app); }
const hubPath = 'sw/nyumba-na-ardhi/index.html';
const hub = fs.readFileSync(path.join(ROOT, hubPath), 'utf8');
const constructionCard = '<a class="swp-link" href="/sw/zana/bajeti-ya-ujenzi-wa-nyumba/"><strong>Bajeti ya ujenzi wa nyumba</strong><span>Jenga makisio kutoka kiasi, gharama kwa kipimo, gharama zisizobadilika na akiba yako ya dharura.</span></a>';
if (!hub.includes('/sw/zana/bajeti-ya-ujenzi-wa-nyumba/')) {
  const anchor = '<a class="swp-link" href="/sw/zana/gharama-vifaa-vya-ujenzi/">';
  const index = hub.indexOf(anchor), end = hub.indexOf('</a>', index) + 4;
  if (index < 0 || end < 4) throw new Error('Property hub construction insertion point drifted.');
  outputs[hubPath] = hub.slice(0, end) + constructionCard + hub.slice(end);
} else outputs[hubPath] = hub;

let changed = 0;
for (const [relative, content] of Object.entries(outputs)) {
  const file = path.join(ROOT, relative), current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (!localizedGeneratorEquivalent(current, content)) { changed += 1; if (WRITE) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content, 'utf8'); } }
}
console.log(`${WRITE ? 'Built' : 'Checked'} Swahili property construction-planning family: 2/2; ${changed} changed outputs.`);
if (CHECK && changed) process.exitCode = 1;
