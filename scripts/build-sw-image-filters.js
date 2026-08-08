#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const englishPath = path.join(ROOT, 'tools/image-filters/index.html');
const swahiliPath = path.join(ROOT, 'sw/zana/filters-za-picha/index.html');
const english = fs.readFileSync(englishPath, 'utf8');
let swahili = fs.readFileSync(swahiliPath, 'utf8');
const match = english.match(/<main class="filters-studio" id="main-content">[\s\S]*?<\/main>/);
if (!match) throw new Error('English image-filters studio owner was not found.');

const translations = new Map([
  ['Photo filter editor', 'Kihariri cha vichujio vya picha'], ['1. Load images', '1. Pakia picha'],
  ['Drop, paste, or choose a batch', 'Dondosha, bandika au chagua kundi'],
  ['JPG, PNG, WebP, SVG, GIF, AVIF, HEIC, and other browser-supported images can be edited without uploading them.', 'Hariri JPG, PNG, WebP, SVG, GIF, AVIF, HEIC na picha nyingine zinazoungwa mkono bila kuzipakia mtandaoni.'],
  ['Loading editor...', 'Inapakia kihariri...'], ['Choose or drop images', 'Chagua au dondosha picha'],
  ['Choose photos', 'Chagua picha'], ['Drag files here, paste from clipboard, or click to browse.', 'Dondosha faili hapa, bandika kutoka clipboard au bofya kuchagua.'],
  ['Local only', 'Ndani tu'], ['Batch friendly', 'Inakubali kundi'], ['Choose photos to filter', 'Chagua picha za kuchuja'],
  ['2. Pick a useful look', '2. Chagua mwonekano'], ['Presets for real editing jobs', 'Presets za kazi halisi za uhariri'],
  ['Start with a look for the destination, then use the sliders when the photo needs more care.', 'Anza na mwonekano wa matumizi yako, kisha tumia vidhibiti kwa marekebisho zaidi.'],
  ['Photo filter presets', 'Presets za vichujio'], ['Clean photo', 'Picha safi'], ['Balanced reset', 'Mwanzo uliosawazika'],
  ['Warm market', 'Soko lenye joto'], ['Retail and outdoor', 'Rejareja na nje'], ['Cool dusk', 'Jioni tulivu'], ['Event atmosphere', 'Mandhari ya hafla'],
  ['Vintage print', 'Chapisho la zamani'], ['Editorial texture', 'Muundo wa uhariri'], ['Mono newsprint', 'Gazeti nyeusi na nyeupe'], ['Black and white', 'Nyeusi na nyeupe'],
  ['Soft portrait', 'Picha laini ya mtu'], ['Profile photos', 'Picha za profaili'], ['Product clarity', 'Uwazi wa bidhaa'], ['Listings and menus', 'Orodha na menyu'],
  ['Food pop', 'Chakula angavu'], ['Meals and hospitality', 'Chakula na ukarimu'], ['Document scan', 'Scan ya hati'], ['Receipts and notes', 'Risiti na noti'],
  ['3. Fine tune', '3. Rekebisha kwa kina'], ['Adjust color, clarity, texture, and edge focus', 'Rekebisha rangi, uwazi, muundo na kingo'],
  ['The recipe saves locally as you work, so repeated image batches can start from the last settings.', 'Mapishi huhifadhiwa kwenye kifaa hiki ili kundi lijalo lianze na mipangilio ya mwisho.'],
  ['Brightness', 'Mwangaza'], ['Contrast', 'Utofauti'], ['Saturation', 'Ukolezi'], ['Warmth', 'Joto la rangi'], ['Hue', 'Mgeuko wa rangi'], ['Grayscale', 'Kijivu'], ['Blur', 'Ukungu'], ['Sharpen', 'Ongeza ukali'], ['Grain', 'Chembechembe'],
  ['Recipe control', 'Udhibiti wa mapishi'], ['Reset to clean', 'Rudisha kuwa safi'], ['Reset only changes the filter recipe. Uploaded files remain in the queue.', 'Kurejesha hubadilisha mapishi pekee; faili hubaki kwenye foleni.'],
  ['4. Compare and export', '4. Linganisha na utoe'], ['Check before and after, then export the exact delivery pack', 'Kagua kabla na baada, kisha toa kifurushi sahihi'],
  ['Use JPG for portals and marketplaces, PNG for crisp or transparent assets, and WebP for modern web delivery.', 'Tumia JPG kwa portal na marketplace, PNG kwa uwazi au kingo kali, na WebP kwa tovuti za kisasa.'],
  ['Upload an image to compare the original and edited result.', 'Pakia picha ili kulinganisha chanzo na matokeo.'], ['Original', 'Chanzo'], ['Edited', 'Iliyohaririwa'], ['Before and after comparison', 'Ulinganisho wa kabla na baada'],
  ['Format', 'Format'], ['Quality', 'Ubora'], ['JPG background', 'Mandharinyuma ya JPG'], ['Max width', 'Upana wa juu'], ['Max height', 'Urefu wa juu'], ['No limit', 'Hakuna kikomo'], ['File suffix', 'Kiambishi cha faili'],
  ['Export current', 'Toa ya sasa'], ['Download current', 'Pakua ya sasa'], ['Build batch zip', 'Tengeneza ZIP ya kundi'], ['Download zip', 'Pakua ZIP'], ['Copy recipe', 'Nakili mapishi'],
  ['Photo Filter Studio', 'Studio ya Vichujio vya Picha'], ['Filter guidance', 'Mwongozo wa vichujio'], ['Summary', 'Muhtasari'], ['Current output', 'Matokeo ya sasa'], ['Run one export before packaging the full batch.', 'Toa faili moja kabla ya kufungasha kundi zima.'],
  ['Source', 'Chanzo'], ['Output size', 'Ukubwa wa matokeo'], ['Recipe', 'Mapishi'], ['Last export', 'Tokeo la mwisho'], ['Browser support', 'Uwezo wa kivinjari'],
  ['Filter and encoder checks', 'Ukaguzi wa vichujio na encoder'], ['The studio tests local Canvas support before enabling export formats.', 'Studio hukagua Canvas ya ndani kabla ya kuruhusu format za matokeo.'],
  ['Current recipe', 'Mapishi ya sasa'], ['Sharper, brighter output for listings, catalogs, and shop images.', 'Matokeo makali na angavu kwa orodha, katalogi na picha za duka.'],
  ['Saved state', 'Hali iliyohifadhiwa'], ['Recent filter history', 'Historia ya vichujio'], ['Recent exports and recipes are stored locally on this device.', 'Matokeo na mapishi ya karibuni huhifadhiwa kwenye kifaa hiki tu.']
]);

let studio = match[0];
studio = studio.replace(/>[^<]+</g, segment => {
  let localized = segment;
  for (const [from, to] of translations) localized = localized.split(from).join(to);
  return localized;
});
for (const [from, to] of translations) {
  studio = studio.replaceAll(`aria-label="${from}"`, `aria-label="${to}"`);
  studio = studio.replaceAll(`placeholder="${from}"`, `placeholder="${to}"`);
}
studio = `<!-- Source owner: scripts/build-sw-image-filters.js; engine: assets/js/lib/image-filters-studio.js -->\n${studio}`;

const toolPattern = /<main class="wrap">\s*(<section class="hero">[\s\S]*?<\/section>)\s*<section class="grid">[\s\S]*?<\/section>/;
if (/<main class="filters-studio" id="main-content">/.test(swahili)) {
  swahili = swahili.replace(/<!-- Source owner: scripts\/build-sw-image-filters\.js; engine: assets\/js\/lib\/image-filters-studio\.js -->\s*<main class="filters-studio" id="main-content">[\s\S]*?<\/main>/, studio);
} else {
  if (!toolPattern.test(swahili)) throw new Error('Swahili image-filters shell boundary was not found.');
  swahili = swahili.replace(toolPattern, (_, hero) => `<div class="wrap">${hero}</div>\n${studio}\n<div class="wrap">`);
  swahili = swahili.replace(/<\/main>\s*<afro-footer>/, '</div>\n<afro-footer>');
}
swahili = swahili.replaceAll('https://afrotools.com/assets/img/og-default.png', 'https://afrotools.com/assets/img/tools/image-filters.webp');
if (!swahili.includes('/assets/css/image-filters-studio.css')) swahili = swahili.replace('<link rel="stylesheet" href="/assets/css/design-system.min.css?v=1e4c3b11">', '<link rel="stylesheet" href="/assets/css/design-system.min.css?v=1e4c3b11">\n  <link rel="stylesheet" href="/assets/css/image-filters-studio.css?v=98a90869">');
swahili = swahili.replace('<script src="/assets/js/components/newsletter-cta.min.js?v=6a0f4316"></script>\n  <script>', '<script src="/assets/js/components/newsletter-cta.min.js?v=6a0f4316"></script>\n  <script type="application/x-afrotools-retired-filter">');
if (!swahili.includes('/assets/js/lib/image-filters-studio.js')) swahili = swahili.replace('<script src="/assets/js/lazy-analytics.js?v=d378a891" defer></script>', '<script src="/assets/vendor/jszip/jszip.min.js"></script>\n<script src="/assets/js/lib/image-filters-studio.js?v=f9b2148a" defer></script>\n<script src="/assets/js/lib/image-filters-studio-sw.js" defer></script>\n<script src="/assets/js/lazy-analytics.js?v=d378a891" defer></script>');

fs.writeFileSync(swahiliPath, swahili);
console.log('Built native Swahili image-filters studio from the English DOM contract.');
