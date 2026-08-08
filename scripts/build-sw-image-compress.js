#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const englishPath = path.join(ROOT, 'tools/image-compress/index.html');
const swahiliPath = path.join(ROOT, 'sw/zana/kubana-picha/index.html');
const english = fs.readFileSync(englishPath, 'utf8');
let swahili = fs.readFileSync(swahiliPath, 'utf8');

const heroMatch = english.match(/<div class="tool-hero">[\s\S]*?<\/div>\s*(?=<div class="tool-main")/);
const workspaceMatch = english.match(/<div class="tool-main" id="main-content" role="main">[\s\S]*?<\/div>\s*(?=<section style="max-width:900px)/);
if (!heroMatch || !workspaceMatch) throw new Error('English image-compress studio contract was not found.');

const translations = new Map([
  ['AfroTools', 'AfroTools'],
  ['Tools', 'Zana'],
  ['Image Compressor Studio', 'Studio ya Kubana Picha'],
  ['Image ', 'Studio ya '],
  ['Compressor Studio', 'Kubana Picha'],
  ['Batch compress, resize, compare, and prepare clean exports for WhatsApp, portals, storefronts, and fast websites without uploading private images.', 'Bana, badili saizi na linganisha picha nyingi, kisha andaa faili safi kwa WhatsApp, portal, maduka ya mtandaoni na tovuti bila kupakia picha zako.'],
  ['Tier Gold', 'Studio kamili'],
  ['Client-side', 'Ndani ya kivinjari'],
  ['Batch ready', 'Faili nyingi'],
  ['No upload', 'Hakuna upakiaji'],
  ['Local batch intake', 'Kupokea faili ndani ya kifaa'],
  ['Drop, paste, or choose images.', 'Dondosha, bandika au chagua picha.'],
  ['Add several files, tune the export recipe once, then compress the whole queue.', 'Ongeza faili kadhaa, weka mpangilio wa matokeo mara moja, kisha bana foleni yote.'],
  ['Ready', 'Tayari'],
  ['Upload image files', 'Pakia faili za picha'],
  ['Add images to the queue', 'Ongeza picha kwenye foleni'],
  ['JPG, PNG, WebP, AVIF where your browser can decode it. Up to 50MB each.', 'JPG, PNG, WebP na AVIF ikiwa kivinjari chako kinaweza kuifungua. Hadi MB 50 kwa kila faili.'],
  ['Paste with Ctrl V', 'Bandika kwa Ctrl V'],
  ['or drag files here', 'au buruta faili hapa'],
  ['Paste with Ctrl V\nor drag files here', 'Bandika kwa Ctrl V\nau buruta faili hapa'],
  ['FileInput', 'Faili za picha'],
  ['Export recipes', 'Mipangilio ya matokeo'],
  ['Choose the job before compression.', 'Chagua matumizi kabla ya kubana.'],
  ['WhatsApp Share keeps images light for chats and community updates on limited data.', 'Kushiriki WhatsApp huweka picha nyepesi kwa gumzo na taarifa za jamii kwenye data ndogo.'],
  ['Export recipe presets', 'Mipangilio ya matumizi ya faili'],
  ['WhatsApp Share', 'Kushiriki WhatsApp'],
  ['JPEG, smaller file, safe dimensions', 'JPEG, faili ndogo, vipimo salama'],
  ['Portal Upload', 'Kupakia kwenye portal'],
  ['Target under 500 KB when possible', 'Lenga chini ya KB 500 inapowezekana'],
  ['Marketplace', 'Soko la mtandaoni'],
  ['Clear product photos, 1600px max', 'Picha wazi za bidhaa, hadi px 1600'],
  ['Fast Website', 'Tovuti nyepesi'],
  ['WebP, responsive-ready export', 'WebP tayari kwa skrini tofauti'],
  ['Gold controls', 'Vidhibiti vya hali ya juu'],
  ['Compression, resize, and naming.', 'Kubana, kubadili saizi na kutaja faili.'],
  ['Tune quality, target a max file size, resize without upscaling, fill transparency for JPEG, and keep filenames readable.', 'Rekebisha ubora, lenga ukubwa wa juu wa faili, badili saizi bila kuipanua, jaza uwazi kwa JPEG na weka majina ya faili yanayoeleweka.'],
  ['Quality', 'Ubora'],
  ['Higher quality keeps more detail. Target-size mode may lower this automatically.', 'Ubora wa juu huhifadhi maelezo zaidi. Hali ya kulenga ukubwa inaweza kuupunguza kiotomatiki.'],
  ['Output format', 'Format ya matokeo'],
  ['Auto smallest supported', 'Chagua faili ndogo zaidi inayotumika'],
  ['Target KB', 'KB lengwa'],
  ['Optional', 'Si lazima'],
  ['Example: 500 for upload portals.', 'Mfano: 500 kwa portal za kupakia.'],
  ['Max width', 'Upana wa juu'],
  ['Keep original', 'Baki na saizi asili'],
  ['Max height', 'Urefu wa juu'],
  ['Filename suffix', 'Kiambishi cha jina la faili'],
  ['JPEG background', 'Mandharinyuma ya JPEG'],
  ['Workflow options', 'Chaguo za mchakato'],
  ['NoUpscale', 'Usipanue picha'],
  ['Do not upscale', 'Usipanue picha'],
  ['AutoRun', 'Bana tena kiotomatiki mipangilio ikibadilika'],
  ['Auto recompress on setting changes', 'Bana tena kiotomatiki mipangilio ikibadilika'],
  ['StripMeta', 'Ondoa metadata binafsi kwenye faili'],
  ['Strip private metadata on export', 'Ondoa metadata binafsi kwenye faili'],
  ['Canvas exports remove EXIF/GPS metadata by default. Originals remain untouched.', 'Faili za Canvas huondoa metadata ya EXIF/GPS kwa kawaida. Picha asili hazibadilishwi.'],
  ['Compress queue', 'Bana foleni'],
  ['Download all', 'Pakua zote'],
  ['Clear queue', 'Futa foleni'],
  ['Batch queue', 'Foleni ya faili nyingi'],
  ['Files and savings.', 'Faili na nafasi iliyookolewa.'],
  ['Select any processed file to inspect the before and after preview.', 'Chagua faili iliyokamilika ili kukagua picha ya kabla na baada.'],
  ['Files', 'Faili'],
  ['Original', 'Asili'],
  ['Output', 'Matokeo'],
  ['Saved', 'Iliyookolewa'],
  ['No images yet. Add files above to start.', 'Bado hakuna picha. Ongeza faili hapo juu kuanza.'],
  ['Before and after', 'Kabla na baada'],
  ['Inspect one export.', 'Kagua faili moja.'],
  ['Move the compare handle after compression to check detail, text, and edges.', 'Sogeza kishikio cha kulinganisha baada ya kubana ili kukagua maelezo, maandishi na kingo.'],
  ['Compressed previews appear here.', 'Muonekano wa faili zilizobanwa utaonekana hapa.'],
  ['Original preview', 'Muonekano wa picha asili'],
  ['Compressed preview', 'Muonekano wa picha iliyobanwa'],
  ['Compressed', 'Iliyobanwa'],
  ['Before and after comparison', 'Ulinganisho wa kabla na baada'],
  ['Dimensions', 'Vipimo'],
  ['Export', 'Faili'],
  ['Why this is safe', 'Kwa nini ni salama'],
  ['Local-first processing.', 'Uchakataji ndani ya kifaa.'],
  ['The browser decodes your image into memory, re-encodes the export, and never sends the file to AfroTools servers.', 'Kivinjari hufungua picha kwenye kumbukumbu, huunda faili mpya na kamwe hakitumi faili hiyo kwenye seva za AfroTools.'],
  ['Batch compression with per-file status and downloads.', 'Kubana faili nyingi kwa hali na upakuaji wa kila faili.'],
  ['Target-size search for portal limits and application forms.', 'Kutafuta ukubwa lengwa kwa mipaka ya portal na fomu za maombi.'],
  ['Resize fit mode that preserves aspect ratio and prevents accidental upscaling.', 'Kubadili saizi huku uwiano ukihifadhiwa na kuzuia upanuzi usiotarajiwa.'],
  ['JPEG background fill for transparent images that must become JPG.', 'Kujaza mandharinyuma ya JPEG kwa picha zenye uwazi zinazohitaji kuwa JPG.'],
  ['Last-used settings and recent run summaries saved only on this device.', 'Mipangilio ya mwisho na muhtasari wa kazi za karibuni huhifadhiwa kwenye kifaa hiki tu.'],
  ['Recent runs', 'Kazi za karibuni'],
  ['Local history.', 'Historia ya ndani ya kifaa.'],
  ['Metadata only. No source images are stored.', 'Metadata tu. Hakuna picha chanzo inayohifadhiwa.']
]);

function localize(fragment) {
  let localized = fragment.replace(/>[^<]+</g, (segment) => {
    let result = segment;
    for (const [from, to] of [...translations].sort((a, b) => b[0].length - a[0].length)) result = result.split(from).join(to);
    return result;
  });
  for (const [from, to] of translations) {
    localized = localized.replaceAll(`aria-label="${from}"`, `aria-label="${to}"`);
    localized = localized.replaceAll(`placeholder="${from}"`, `placeholder="${to}"`);
    localized = localized.replaceAll(`alt="${from}"`, `alt="${to}"`);
  }
  return localized.replaceAll('AfroZana', 'AfroTools');
}

let hero = localize(heroMatch[0]);
let workspace = localize(workspaceMatch[0]);
workspace = workspace.replace('<div class="tool-main" id="main-content" role="main">', '<main class="tool-main" id="main-content">');
workspace = workspace.replace(/<\/div>\s*$/, '</main>');

const supportHtml = `<section class="section panel"><h2>Angalia pia</h2><div class="link-list"><a href="/sw/ubunifu-na-watayarishi/">Ubunifu na watayarishi</a>
  <a href="/sw/zana/picha-ya-pasipoti/">Picha ya pasipoti</a>
  <a href="/sw/zana/kadi-ya-mitandao/">Kadi ya mitandao</a>
  <a href="/sw/zana/kubadilisha-format-ya-picha/">Kubadili format ya picha</a>
  <a href="/sw/zana/kubadilisha-ukubwa-wa-picha/">Kubadili saizi ya picha</a>
  <a href="/sw/zana/kukata-picha/">Kukata picha</a>
  <a href="/sw/ubunifu-na-watayarishi/">Zana zote za ubunifu</a></div></section>
<section class="section panel" data-tool-verification-panel>
  <h2>Mtindo wa kazi</h2>
  <div class="output-list">
    <div><h3>Faragha ya faili</h3><p>Picha hufunguliwa, hubanwa na kutolewa ndani ya kivinjari. Faili haipakwi kwenye seva za AfroTools.</p></div>
    <div><h3>Ubora wa matokeo</h3><p>Kagua vipimo, format, ukubwa wa faili na muonekano wa kabla na baada. KB lengwa ni lengo linalotegemea picha na uwezo wa kivinjari, si dhamana.</p></div>
    <div><h3>Hatua inayofuata</h3><p>Pakua kila faili au foleni yote, kisha fungua faili zilizopakuliwa na uhakikishe zinakubalika kwenye portal au jukwaa lengwa.</p></div>
  </div>
  <p class="note"><strong>Chanzo na mipaka:</strong> Matokeo yanatokana na faili na vidhibiti ulivyoweka. Mahitaji ya ukubwa na format ya portal yanaweza kubadilika; thibitisha masharti ya sasa kabla ya kupakia.</p>
</section>
<section class="section note"><strong>Angalizo:</strong> Picha asili haibadilishwi. Canvas huunda nakala mpya na huondoa metadata ya EXIF/GPS kwa kawaida, lakini kagua faili iliyopakuliwa kabla ya kuitumia.</section>
<section class="section panel"><h2>Maswali ya haraka</h2><h3>Je, picha zangu zinapakiwa?</h3><p>Hapana. Engine hii hutumia Image, Canvas, Blob na object URL ndani ya kivinjari; haina njia ya kutuma faili kwa mtandao.</p><h3>Je, KB lengwa huhakikishwa?</h3><p>Hapana. Engine hutafuta ubora wa juu chini ya lengo kwa JPEG au WebP inapowezekana, vinginevyo huchagua jaribio dogo zaidi. PNG ni lossless na haibadilishi ubora kwa lengo hilo.</p></section>`;
const generated = `<!-- Source owner: scripts/build-sw-image-compress.js; engine: assets/js/lib/image-compress-studio.js -->\n${hero}\n${workspace}\n<div class="wrap sw-image-compress-support">${supportHtml}</div>\n<!-- End source owner: scripts/build-sw-image-compress.js -->`;
const existing = /<!-- Source owner: scripts\/build-sw-image-compress\.js; engine: assets\/js\/lib\/image-compress-studio\.js -->[\s\S]*?<!-- End source owner: scripts\/build-sw-image-compress\.js -->/;
const oldMain = /<main class="wrap">[\s\S]*?<\/main>/;
if (existing.test(swahili)) swahili = swahili.replace(existing, generated);
else if (oldMain.test(swahili)) swahili = swahili.replace(oldMain, generated);
else throw new Error('Swahili image-compress shell boundary was not found.');

swahili = swahili.replaceAll('https://afrotools.com/assets/img/og-default.png', 'https://afrotools.com/assets/img/tools/image-compress.webp');
if (!swahili.includes('/assets/css/image-compress-studio.css')) {
  swahili = swahili.replace(
    '<link rel="stylesheet" href="/assets/css/top-level-page-ui-refresh.css?v=9ab47fa3">',
    '<link rel="stylesheet" href="/assets/css/top-level-page-ui-refresh.css?v=9ab47fa3">\n<link rel="stylesheet" href="/assets/css/image-compress-studio.css">'
  );
}
swahili = swahili.replace(/\s*<script(?: type="application\/x-afrotools-retired-image-compress")?>\r?\nconst q=id=>document\.getElementById\(id\);[\s\S]*?<\/script>\s*/, '\n');
if (!swahili.includes('/assets/js/lib/image-compress-studio.js')) {
  swahili = swahili.replace(
    '<script src="/assets/js/lazy-analytics.js?v=d378a891" defer></script>',
    '<script src="/assets/js/lib/image-compress-studio.js" defer></script>\n<script src="/assets/js/lib/image-compress-studio-sw.js" defer></script>\n<script src="/assets/js/lazy-analytics.js?v=d378a891" defer></script>'
  );
}

fs.writeFileSync(swahiliPath, swahili);
console.log('Built native Swahili image-compress studio from the English DOM contract.');
