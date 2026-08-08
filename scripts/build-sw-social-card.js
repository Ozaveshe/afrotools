#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const englishPath = path.join(ROOT, 'tools/social-card/index.html');
const swahiliPath = path.join(ROOT, 'sw/zana/kadi-ya-mitandao/index.html');
const english = fs.readFileSync(englishPath, 'utf8');
let swahili = fs.readFileSync(swahiliPath, 'utf8');
const workspace = english.match(/<section class="social-workspace" aria-label="Social card editor">[\s\S]*?<\/section>\s*\n\s*<section class="social-guide-section"/);
if (!workspace) throw new Error('English social-card workspace contract was not found.');
let studio = workspace[0].replace(/\s*<section class="social-guide-section"$/, '');

const translations = new Map([
  ['Social card editor', 'Kihariri cha kadi ya mitandao'], ['1. Pick the job', '1. Chagua kazi'], ['Campaign starter', 'Mwanzo wa kampeni'],
  ['Load a practical layout for a launch, event, quote, hiring post, market update, or founder note.', 'Chagua mpangilio wa uzinduzi, hafla, nukuu, tangazo la ajira, taarifa ya soko au ujumbe wa mwanzilishi.'],
  ['Loading studio...', 'Inapakia studio...'], ['Campaign templates', 'Violezo vya kampeni'], ['2. Size and layout', '2. Saizi na mpangilio'], ['Platform canvas', 'Canvas ya jukwaa'], ['Platform sizes', 'Saizi za majukwaa'],
  ['Layout', 'Mpangilio'], ['Bold left', 'Nzito kushoto'], ['Centered', 'Katikati'], ['Split feature', 'Sehemu mbili'], ['Quote card', 'Kadi ya nukuu'], ['Lower third', 'Sehemu ya chini'], ['Badge focus', 'Beji mbele'],
  ['Background', 'Mandharinyuma'], ['Gradient', 'Mchanganyiko wa rangi'], ['Solid', 'Rangi moja'], ['Pattern', 'Muundo'], ['Uploaded image', 'Picha iliyopakiwa'],
  ['3. Message', '3. Ujumbe'], ['Copy that fits', 'Maandishi yanayotoshea'], ['Eyebrow', 'Kichwa kidogo'], ['Headline', 'Kichwa kikuu'], ['Supporting copy', 'Maelezo ya kusaidia'], ['Brand / footer', 'Brand / sehemu ya chini'],
  ['4. Brand look', '4. Mwonekano wa brand'], ['Palette and assets', 'Rangi na mali'], ['Load brand', 'Pakia brand'], ['Color palettes', 'Paleti za rangi'], ['Primary', 'Rangi kuu'], ['Accent', 'Rangi ya msisitizo'], ['Text', 'Maandishi'],
  ['Background image', 'Picha ya mandharinyuma'], ['Choose image', 'Chagua picha'], ['Logo or mark', 'Logo au alama'], ['Choose logo', 'Chagua logo'], ['Text scale', 'Ukubwa wa maandishi'], ['Safe padding', 'Nafasi salama'], ['Image overlay', 'Tabaka juu ya picha'], ['Image blur', 'Ukungu wa picha'],
  ['Preview and export', 'Muonekano na utoaji'], ['Live canvas', 'Canvas ya moja kwa moja'], ['Safe zones', 'Maeneo salama'], ['Rendered social card preview', 'Muonekano wa kadi iliyotengenezwa'], ['Design checks', 'Ukaguzi wa design'], ['Size', 'Saizi'], ['Contrast', 'Utofauti'], ['Fit', 'Kutoshea'], ['Checking', 'Inakagua'],
  ['5. Export', '5. Toa'], ['Download and handoff', 'Pakua na kabidhi'], ['Format', 'Format'], ['Filename suffix', 'Kiambishi cha jina'], ['JPEG/WebP quality', 'Ubora wa JPEG/WebP'],
  ['Download current', 'Pakua ya sasa'], ['Export platform set', 'Toa seti ya majukwaa'], ['Copy OG snippet', 'Nakili snippet ya OG'], ['Copy handoff brief', 'Nakili maelezo ya kukabidhi'], ['Copy design link', 'Nakili link ya design'], ['Save brand kit', 'Hifadhi brand kit'], ['Reset', 'Rudisha'], ['Social Card Studio', 'Studio ya Kadi za Mitandao'],
  ['Readiness', 'Utayari'], ['Posting checklist', 'Orodha ya ukaguzi kabla ya kuchapisha'], ['Recent exports', 'Matokeo ya karibuni'], ['Local history', 'Historia ya ndani']
]);
studio = studio.replace(/>[^<]+</g, segment => { let localized = segment; for (const [from, to] of translations) localized = localized.split(from).join(to); return localized; });
for (const [from, to] of translations) studio = studio.replaceAll(`aria-label="${from}"`, `aria-label="${to}"`);
studio = `<!-- Source owner: scripts/build-sw-social-card.js; engine: assets/js/lib/social-card-studio.js -->\n<main class="social-studio" id="main-content">\n${studio}\n</main>`;

const oldMain = /<main class="wrap">[\s\S]*?<\/main>/;
const existingStudio = /<!-- Source owner: scripts\/build-sw-social-card\.js; engine: assets\/js\/lib\/social-card-studio\.js -->\s*<main class="social-studio" id="main-content">[\s\S]*?<\/main>/;
if (existingStudio.test(swahili)) swahili = swahili.replace(existingStudio, studio);
else if (oldMain.test(swahili)) swahili = swahili.replace(oldMain, studio);
else throw new Error('Swahili social-card shell boundary was not found.');
if (!swahili.includes('/assets/css/social-card-studio.css')) swahili = swahili.replace('<link rel="stylesheet" href="/assets/css/design-system.min.css?v=1e4c3b11">', '<link rel="stylesheet" href="/assets/css/design-system.min.css?v=1e4c3b11">\n  <link rel="stylesheet" href="/assets/css/social-card-studio.css?v=a03e0489">\n  <link rel="stylesheet" href="/assets/css/social-card-studio-fixes.css">');
if (!swahili.includes('/assets/css/social-card-studio-fixes.css')) swahili = swahili.replace('<link rel="stylesheet" href="/assets/css/social-card-studio.css?v=a03e0489">', '<link rel="stylesheet" href="/assets/css/social-card-studio.css?v=a03e0489">\n  <link rel="stylesheet" href="/assets/css/social-card-studio-fixes.css">');
swahili = swahili.replace('<script src="/assets/js/components/share-button.js?v=f8342961"></script>\n  <script>', '<script src="/assets/js/components/share-button.js?v=f8342961"></script>\n  <script type="application/x-afrotools-retired-social-card">');
if (!swahili.includes('/assets/js/lib/social-card-studio.js')) swahili = swahili.replace('<script src="/assets/js/lazy-analytics.js?v=d378a891" defer></script>', '<script src="/assets/js/lib/social-card-studio.js?v=de86a6da" defer></script>\n<script src="/assets/js/lib/social-card-studio-sw.js" defer></script>\n<script src="/assets/js/lazy-analytics.js?v=d378a891" defer></script>');
fs.writeFileSync(swahiliPath, swahili);
console.log('Built native Swahili social-card studio from the English DOM contract.');
