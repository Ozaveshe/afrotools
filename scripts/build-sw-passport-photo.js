#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const englishPath = path.join(ROOT, 'tools/passport-photo/index.html');
const swahiliPath = path.join(ROOT, 'sw/zana/picha-ya-pasipoti/index.html');
const english = fs.readFileSync(englishPath, 'utf8');
let swahili = fs.readFileSync(swahiliPath, 'utf8');

const workspace = english.match(/<main class="pp-studio" id="main-content">[\s\S]*?<\/main>/);
if (!workspace) throw new Error('English passport-photo workspace contract was not found.');

const translations = new Map([
  ['Passport photo editor', 'Kihariri cha picha ya pasipoti'],
  ['Passport photo guidance', 'Mwongozo wa picha ya pasipoti'],
  ['1. Load a photo', '1. Pakia picha'],
  ['Start with a plain, front-facing image', 'Anza na picha ya mbele yenye mandharinyuma yasiyo na michoro'],
  ['The studio frames and sizes photos. It does not retouch faces or remove backgrounds, because some authorities reject altered passport photos.', 'Studio huweka fremu na saizi ya picha. Haibadilishi uso wala kuondoa mandharinyuma, kwa sababu baadhi ya mamlaka hukataa picha za pasipoti zilizohaririwa.'],
  ['Loading editor...', 'Inapakia kihariri...'],
  ['Choose or drop a passport photo source image', 'Chagua au dondosha picha chanzo ya pasipoti'],
  ['Choose a photo', 'Chagua picha'],
  ['Drag a file here, paste from clipboard, or click to browse.', 'Buruta faili hapa, bandika kutoka clipboard, au bofya uchague.'],
  ['Local only', 'Ndani ya kifaa tu'],
  ['PpInput', 'Faili ya picha'],
  ['2. Choose requirement', '2. Chagua mahitaji'],
  ['African countries and popular destination presets', 'Mipangilio ya nchi za Afrika na maeneo maarufu'],
  ['Each preset shows the output size, head guide, background guidance, source confidence, and submission notes.', 'Kila mpangilio huonyesha saizi ya matokeo, mwongozo wa kichwa, mandharinyuma, kiwango cha uhakika wa chanzo na maelezo ya kuwasilisha.'],
  ['Requirement groups', 'Makundi ya mahitaji'],
  ['All', 'Zote'],
  ['African passports', 'Pasipoti za Afrika'],
  ['African visa and ID', 'Visa na ID za Afrika'],
  ['Popular destinations', 'Maeneo maarufu'],
  ['Common sizes', 'Saizi za kawaida'],
  ['Search presets', 'Tafuta mipangilio'],
  ['Requirement', 'Mahitaji'],
  ['Background fill', 'Rangi ya mandharinyuma'],
  ['PpBackground', 'Rangi ya mandharinyuma'],
  ['This fills the canvas behind the crop. Start with a real plain background for official use.', 'Hii hujaza canvas nyuma ya sehemu iliyokatwa. Kwa matumizi rasmi, anza na mandharinyuma halisi yasiyo na michoro.'],
  ['Guide overlay', 'Mwongozo juu ya picha'],
  ['PpShowGuides', 'Onyesha miongozo ya kichwa'],
  ['Show crown and chin guides in the preview.', 'Onyesha miongozo ya utosi na kidevu kwenye muonekano.'],
  ['3. Align face', '3. Pangilia uso'],
  ['Zoom, move, and rotate without stretching the portrait', 'Kuza, sogeza na zungusha bila kuvuta picha'],
  ['Use the blue guide to place the crown and chin. Exports never include the guide overlay.', 'Tumia mwongozo wa bluu kuweka utosi na kidevu. Faili zinazotolewa hazijumuishi miongozo hiyo.'],
  ['Zoom', 'Kuza'],
  ['Move left/right', 'Sogeza kushoto/kulia'],
  ['Move up/down', 'Sogeza juu/chini'],
  ['Straighten', 'Nyoosha'],
  ['PpZoom', 'Kuza picha'],
  ['PpOffsetX', 'Sogeza picha kushoto au kulia'],
  ['PpOffsetY', 'Sogeza picha juu au chini'],
  ['PpRotation', 'Zungusha picha'],
  ['Upload a front-facing photo to start framing.', 'Pakia picha ya mbele ili kuanza kuweka fremu.'],
  ['4. Export', '4. Toa faili'],
  ['Download a single photo or a print-ready sheet', 'Pakua picha moja au karatasi iliyo tayari kuchapishwa'],
  ['The 4 x 6 inch sheet is useful for pharmacy and photo-lab prints. A4 is useful when you want many cut copies on one page.', 'Karatasi ya inchi 4 x 6 inafaa kwa uchapishaji wa duka la picha. A4 inafaa unapohitaji nakala nyingi za kukata kwenye ukurasa mmoja.'],
  ['Layout', 'Mpangilio'],
  ['4 x 6 inch print sheet', 'Karatasi ya kuchapisha ya inchi 4 x 6'],
  ['Single digital photo', 'Picha moja ya kidijitali'],
  ['A4 print sheet', 'Karatasi ya kuchapisha ya A4'],
  ['Format', 'Format'],
  ['Quality', 'Ubora'],
  ['PpQuality', 'Ubora wa faili'],
  ['Render export', 'Andaa faili'],
  ['Download', 'Pakua'],
  ['Copy requirement brief', 'Nakili muhtasari wa mahitaji'],
  ['Reset crop', 'Rudisha upunguzaji'],
  ['Requirement details', 'Maelezo ya mahitaji'],
  ['Use this as preparation help, then confirm with the current issuing authority before submitting.', 'Tumia kama msaada wa maandalizi, kisha thibitisha na mamlaka inayotoa hati kabla ya kuwasilisha.'],
  ['Size', 'Saizi'],
  ['Head guide', 'Mwongozo wa kichwa'],
  ['Background', 'Mandharinyuma'],
  ['Copies', 'Nakala'],
  ['Confidence', 'Kiwango cha uhakika'],
  ['Output', 'Matokeo'],
  ['Current file', 'Faili ya sasa'],
  ['The export canvas is rendered at 300 DPI for the selected layout.', 'Canvas ya faili huandaliwa kwa 300 DPI kulingana na mpangilio uliochaguliwa.'],
  ['Source', 'Chanzo'],
  ['Canvas', 'Canvas'],
  ['File size', 'Ukubwa wa faili'],
  ['Checklist', 'Orodha ya ukaguzi'],
  ['Manual acceptance checks', 'Ukaguzi wa kukubalika unaofanywa na mtu'],
  ['The browser cannot verify identity-photo compliance. Use this before printing or uploading.', 'Kivinjari hakiwezi kuthibitisha kufuata masharti ya picha ya utambulisho. Tumia ukaguzi huu kabla ya kuchapisha au kupakia.'],
  ['0 of 7 checks complete', 'Ukaguzi 0 kati ya 7 umekamilika'],
  ['Photo is recent and still looks like the applicant.', 'Picha ni ya karibuni na bado inafanana na mwombaji.'],
  ['Lighting is even with no shadows, glare, or red-eye.', 'Mwanga ni sawa bila vivuli, mng\'ao au macho mekundu.'],
  ['Background is plain, uniform, and matches the selected requirement.', 'Mandharinyuma hayana michoro, yanafanana kote na yanatimiza mahitaji yaliyochaguliwa.'],
  ['Face is square to the camera, not tilted, with both face edges visible.', 'Uso umeelekea kamera moja kwa moja, haujainama na kingo zote mbili zinaonekana.'],
  ['Expression is neutral with mouth closed where required.', 'Mwonekano wa uso ni wa kawaida na mdomo umefungwa pale inapohitajika.'],
  ['Glasses, hats, head coverings, hair, and accessories follow the requirement.', 'Miwani, kofia, kifuniko cha kichwa, nywele na mapambo vinafuata mahitaji.'],
  ['Latest official authority guidance was checked before submission.', 'Mwongozo rasmi wa hivi karibuni umehakikiwa kabla ya kuwasilisha.'],
  ['Saved state', 'Hali iliyohifadhiwa'],
  ['Recent exports', 'Faili za karibuni'],
  ['Recent export recipes are stored locally on this device.', 'Mipangilio ya faili za karibuni huhifadhiwa ndani ya kifaa hiki.']
]);

let studio = workspace[0];
studio = studio.replace(/>[^<]+</g, segment => {
  let localized = segment;
  for (const [from, to] of [...translations].sort((a, b) => b[0].length - a[0].length)) localized = localized.split(from).join(to);
  return localized;
});
for (const [from, to] of translations) {
  studio = studio.replaceAll(`aria-label="${from}"`, `aria-label="${to}"`);
  studio = studio.replaceAll(`placeholder="${from}"`, `placeholder="${to}"`);
}
studio = studio.replace('tool-name="Passport Photo Studio"', 'tool-name="Studio ya Picha ya Pasipoti"');
studio = `<!-- Source owner: scripts/build-sw-passport-photo.js; engine: assets/js/lib/passport-photo-studio.js -->\n${studio}`;

const existingStudio = /<!-- Source owner: scripts\/build-sw-passport-photo\.js; engine: assets\/js\/lib\/passport-photo-studio\.js -->\s*<main class="pp-studio" id="main-content">[\s\S]*?<\/main>/;
const oldMain = /<main class="main">[\s\S]*?<\/main>/;
if (existingStudio.test(swahili)) swahili = swahili.replace(existingStudio, studio);
else if (oldMain.test(swahili)) swahili = swahili.replace(oldMain, studio);
else throw new Error('Swahili passport-photo shell boundary was not found.');

if (!swahili.includes('/assets/css/passport-photo-studio.css')) {
  swahili = swahili.replace(
    '<link rel="stylesheet" href="/assets/css/top-level-page-ui-refresh.css?v=9ab47fa3">',
    '<link rel="stylesheet" href="/assets/css/top-level-page-ui-refresh.css?v=9ab47fa3">\n<link rel="stylesheet" href="/assets/css/passport-photo-studio.css?v=396820f5">'
  );
}

swahili = swahili.replace(
  '<script>let img=null;document.getElementById(\'file\')',
  '<script type="application/x-afrotools-retired-passport-photo">let img=null;document.getElementById(\'file\')'
);
if (!swahili.includes('/assets/js/lib/passport-photo-studio.js')) {
  swahili = swahili.replace(
    '<script src="/assets/js/lazy-analytics.js?v=d378a891" defer></script>',
    '<script src="/assets/js/lib/passport-photo-studio.js?v=2b49056e" defer></script>\n<script src="/assets/js/lib/passport-photo-studio-sw.js" defer></script>\n<script src="/assets/js/lazy-analytics.js?v=d378a891" defer></script>'
  );
}

fs.writeFileSync(swahiliPath, swahili);
console.log('Built native Swahili passport-photo studio from the English DOM contract.');
