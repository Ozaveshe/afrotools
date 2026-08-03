#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/localization/sw-climate-parity-manifest.json'), 'utf8'));
const copy = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/localization/sw-climate-copy.json'), 'utf8'));
const toolCopy = new Map(copy.tools.map(([id, slug, title, description]) => [id, { id, slug, title, description }]));

const ranges = {
  rainfallAnomaly: [-100, 100], area: [0.01, 1000000], cropValue: [0, 1000000000],
  people: [1, 1000000], dailyDemand: [1, 100000], supplyDays: [0, 7], storage: [0, 1000000000],
  reusePct: [0, 90], month: [1, 12], receivedRain: [0, 10000], expectedRain: [0, 10000],
  projectSize: [1, 100000000], years: [1, 40], price: [0, 100000], bufferPct: [0, 40],
  validationCost: [0, 1000000000], propertyValue: [0, 1000000000000], exposureHours: [0, 24],
  pm25: [0, 500.4], hectares: [0.01, 100000000], kgDay: [0, 100000000],
  organicPct: [0, 100], recyclingPct: [0, 95], pickups: [0, 10000],
  plastic: [0, 100000000], aluminum: [0, 100000000], steel: [0, 100000000],
  paper: [0, 100000000], glass: [0, 100000000], organic: [0, 100000000],
  contaminationPct: [0, 60], transportCost: [0, 1000000000], charcoalKgWeek: [0.1, 100000],
  stoveCost: [0, 1000000000], quantity: [1, 100000000], trees: [1, 1000000000],
  survivalPct: [10, 100], investment: [0, 1000000000000], maintenancePerTree: [0, 1000000],
  carbonPrice: [0, 100000], renewablePct: [0, 100], generatorPct: [0, 100],
  waterReusePct: [0, 100], localSourcingPct: [0, 100]
};

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function translate(value, context) {
  if (!Object.prototype.hasOwnProperty.call(copy.text, value)) {
    throw new Error(`Missing Swahili ${context} translation: ${value}`);
  }
  return copy.text[value];
}

function climateConfig(source) {
  const match = source.match(/window\.AfroClimateToolConfig=(\{[\s\S]*?\});<\/script>/);
  if (!match) throw new Error('English climate owner config missing');
  return JSON.parse(match[1]);
}

function controlFor(form, id) {
  const select = form.match(new RegExp(`<select([^>]*id="${id}"[^>]*)>([\\s\\S]*?)</select>`));
  if (select) {
    let attributes = select[1];
    if (!/\brequired\b/.test(attributes)) attributes += ' required';
    const options = select[2].replace(/(<option\b[^>]*>)([^<]*)(<\/option>)/g, (_, before, label, after) => {
      const clean = label.trim();
      return before + escapeHtml(translate(clean, 'option')) + after;
    });
    return `<select${attributes}>${options}</select>`;
  }
  const input = form.match(new RegExp(`<input([^>]*id="${id}"[^>]*)>`));
  if (!input) throw new Error(`Control not found: ${id}`);
  let attributes = input[1].replace(/\s(?:min|max)="[^"]*"/g, '');
  if (ranges[id]) attributes += ` min="${ranges[id][0]}" max="${ranges[id][1]}"`;
  if (!/\brequired\b/.test(attributes)) attributes += ' required';
  return `<input${attributes}>`;
}

function fieldsFor(source) {
  const formMatch = source.match(/<form[^>]*id="climateForm"[\s\S]*?<\/form>/);
  if (!formMatch) throw new Error('English climate form missing');
  const fields = [];
  for (const label of formMatch[0].matchAll(/<label[^>]*for="([^"]+)"[^>]*>([\s\S]*?)<\/label>/g)) {
    const id = label[1];
    const english = label[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    fields.push(`<div class="sw-climate-field"><label for="${id}">${escapeHtml(translate(english, 'label'))}</label>${controlFor(formMatch[0], id)}</div>`);
  }
  return fields.join('');
}

function alternates(source, swahiliRoute) {
  const links = [...source.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)]
    .filter(([, language]) => language !== 'sw')
    .map(([, language, href]) => `<link rel="alternate" hreflang="${language}" href="${href}">`);
  const xDefault = links.findIndex((link) => link.includes('hreflang="x-default"'));
  const self = `<link rel="alternate" hreflang="sw" href="https://afrotools.com${swahiliRoute}">`;
  if (xDefault === -1) links.push(self);
  else links.splice(xDefault, 0, self);
  return links.join('\n');
}

function page(row) {
  const text = toolCopy.get(row.toolId);
  if (!text) throw new Error(`Missing tool copy: ${row.toolId}`);
  if (`/sw/zana/${text.slug}/` !== row.swahili) throw new Error(`Slug mismatch: ${row.toolId}`);
  const englishFile = path.join(ROOT, row.english.replace(/^\//, ''), 'index.html');
  const english = fs.readFileSync(englishFile, 'utf8');
  const owner = climateConfig(english);
  if (!Array.isArray(owner.sources) || owner.sources.length !== 3) throw new Error(`${row.toolId}: expected three owner sources`);
  const canonical = `https://afrotools.com${row.swahili}`;
  const sources = owner.sources.map((source) => `<li><a href="${escapeHtml(source.href)}" target="_blank" rel="noopener">${escapeHtml(source.label)}</a><small>Rejea ya mbinu; ukurasa huu hauchukui data ya moja kwa moja kutoka chanzo hiki.</small></li>`).join('');
  const schema = {
    '@context': 'https://schema.org', '@type': 'WebApplication', name: text.title, url: canonical,
    applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', inLanguage: 'sw',
    isAccessibleForFree: true, isBasedOn: `https://afrotools.com${row.english}`, description: text.description
  };
  return `<!doctype html><html lang="sw"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(text.title)} Afrika | AfroTools</title><meta name="description" content="${escapeHtml(text.description)}">
<link rel="canonical" href="${canonical}">
${alternates(english, row.swahili)}
<meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(text.title)}">
<meta property="og:description" content="${escapeHtml(text.description)}"><meta property="og:url" content="${canonical}">
<meta property="og:image" content="https://afrotools.com${row.artwork}">
<link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/sw-climate-tools.css">
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
<script src="/assets/js/climate-tools.js" defer></script><script src="/assets/js/pages/sw-climate-tools.js" defer></script>
<script type="application/ld+json">${JSON.stringify(schema)}</script></head><body><afro-navbar lang="sw"></afro-navbar>
<main class="sw-climate-main" data-sw-climate-tool="${row.toolId}">
<section class="sw-climate-hero"><p class="eyebrow">Hali ya hewa na mazingira · modeli ya kwenye kifaa</p><h1>${escapeHtml(text.title)}</h1><p>${escapeHtml(text.description)}</p></section>
<div class="sw-climate-layout"><section class="sw-climate-card"><h2>Jenga makadirio</h2><p>Tumia vipimo vya eneo lako vinapopatikana. Mifano ya nchi ni sehemu ya kuanzia tu.</p>
<form id="swClimateForm" class="sw-climate-form" novalidate>${fieldsFor(english)}<div class="sw-climate-wide"><button class="sw-climate-btn" type="submit">Kokotoa makadirio</button><p class="sw-climate-status" data-status role="status" aria-live="polite"></p></div></form>
<section class="sw-climate-results" data-results hidden aria-live="polite"><div class="sw-climate-result-head"><div><h2 data-result-label>Matokeo</h2><div class="sw-climate-result-value" data-result-value></div></div><span class="sw-climate-pill" data-result-level></span></div><p data-result-note></p><div class="sw-climate-metrics" data-metrics></div><h2>Mpango wa hatua</h2><ol class="sw-climate-plan" data-plan></ol>
<div class="sw-climate-actions"><button type="button" class="sw-climate-btn secondary" data-copy>Nakili muhtasari</button><button type="button" class="sw-climate-btn secondary" data-save>Hifadhi kwenye kifaa</button><button type="button" class="sw-climate-btn secondary" data-json>Pakua JSON</button><button type="button" class="sw-climate-btn secondary" data-import>Fungua JSON</button><input class="sw-climate-file" type="file" accept="application/json,.json" data-import-file aria-label="Chagua faili ya JSON ya makadirio"><button type="button" class="sw-climate-btn secondary" data-pdf>Pakua PDF</button></div></section>
</section><aside class="sw-climate-card"><h2>Uhakika na tarehe ya modeli</h2><p class="sw-climate-confidence"><strong>Makadirio ya kupanga yenye uhakika mdogo.</strong> Modeli ilikaguliwa 28 Aprili 2026. Mifano ya nchi si vipimo vya sasa vya hali ya hewa wala ushauri rasmi. Hakiki kwa data mpya ya eneo lako.</p>
<h2>Faragha</h2><p class="sw-climate-privacy">Hesabu, kunakili, JSON, PDF na hifadhi hufanyika kwenye kifaa hiki. Thamani unazoingiza hazitumwi kwa AI, analytics au kuwekwa kwenye anwani ya ukurasa.</p>
<h2>Vyanzo vya mbinu</h2><ul class="sw-climate-sources">${sources}</ul><p>Kwa uamuzi wenye athari kubwa, thibitisha na mamlaka ya hali ya hewa au mazingira, mhandisi, mtoa bima au mtaalamu anayefaa.</p></aside></div>
</main><afro-footer></afro-footer><script src="/assets/js/lazy-analytics.js" defer></script><script src="/assets/js/lib/sw-accessibility.js" defer></script></body></html>`;
}

function hubPage(rows) {
  const canonical = 'https://afrotools.com/sw/hali-ya-hewa-na-mazingira/';
  const cards = rows.map((row) => {
    const text = toolCopy.get(row.toolId);
    return `<a class="sw-climate-hub-link" href="${row.swahili}"><strong>${escapeHtml(text.title)}</strong><span>${escapeHtml(text.description)}</span></a>`;
  }).join('');
  const schema = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Zana za hali ya hewa na mazingira Afrika',
    url: canonical, inLanguage: 'sw', isPartOf: { '@type': 'WebSite', name: 'AfroTools', url: 'https://afrotools.com/' },
    mainEntity: { '@type': 'ItemList', numberOfItems: rows.length, itemListElement: rows.map((row, index) => ({
      '@type': 'ListItem', position: index + 1, name: toolCopy.get(row.toolId).title, url: `https://afrotools.com${row.swahili}`
    })) }
  };
  return `<!doctype html><html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zana 13 za Hali ya Hewa na Mazingira Afrika | AfroTools</title><meta name="description" content="Programu 13 za Kiswahili za ukame, maji, mvua, carbon, mafuriko, hewa, taka, miti na uendelevu zenye vyanzo na mipaka iliyo wazi.">
<link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="en" href="https://afrotools.com/climate/"><link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/climat-environnement/"><link rel="alternate" hreflang="sw" href="${canonical}"><link rel="alternate" hreflang="x-default" href="https://afrotools.com/climate/">
<meta property="og:type" content="website"><meta property="og:title" content="Zana za hali ya hewa na mazingira Afrika"><meta property="og:description" content="Programu 13 za Kiswahili zenye vyanzo, tarehe ya modeli, uhakika na faili za matokeo."><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">
<link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/sw-climate-tools.css"><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script><script type="application/ld+json">${JSON.stringify(schema)}</script></head>
<body><afro-navbar lang="sw"></afro-navbar><main class="sw-climate-main"><section class="sw-climate-hero"><p class="eyebrow">Programu 13 za Kiswahili</p><h1>Hali ya hewa na mazingira</h1><p>Jenga makadirio, elewa mipaka yake na uhifadhi ripoti kwenye kifaa. Mifano ya nchi ina uhakika mdogo na si vipimo vya moja kwa moja.</p></section><section class="sw-climate-card"><h2>Chagua programu</h2><p>Kila programu hutumia modeli ileile ya kikokotoo chake cha Kiingereza, lakini kiolesura, matokeo, hatua na faili ni za Kiswahili.</p><div class="sw-climate-hub-grid">${cards}</div></section></main><afro-footer></afro-footer><script src="/assets/js/lazy-analytics.js" defer></script><script src="/assets/js/lib/sw-accessibility.js" defer></script></body></html>`;
}

if (manifest.routes.length !== 13 || toolCopy.size !== 13) throw new Error('Climate parity denominator must stay exactly 13');
for (const row of manifest.routes) {
  const target = path.join(ROOT, row.swahili.replace(/^\//, ''), 'index.html');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, page(row), 'utf8');
}
const hubTarget = path.join(ROOT, manifest.hub.swahili.replace(/^\//, ''), 'index.html');
fs.mkdirSync(path.dirname(hubTarget), { recursive: true });
fs.writeFileSync(hubTarget, hubPage(manifest.routes), 'utf8');
console.log('Built 13 source-owned Swahili Climate apps and one hub.');
