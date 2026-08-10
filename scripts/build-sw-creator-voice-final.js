"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { localizedGeneratorEquivalent } = require("./lib/localized-generator-equivalence");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "tools", "creator-voice", "app.html");
const TARGET = path.join(ROOT, "sw", "zana", "rekodi-na-hariri-sauti", "index.html");
const OWNER = "scripts/build-sw-creator-voice-final.js";

function replaceOnce(html, from, to) {
  const first = html.indexOf(from);
  if (first < 0) throw new Error(`CreatorVoice source drift: missing ${JSON.stringify(from)}`);
  if (html.indexOf(from, first + from.length) >= 0) throw new Error(`CreatorVoice source drift: duplicate ${JSON.stringify(from)}`);
  return html.slice(0, first) + to + html.slice(first + from.length);
}

function replaceOncePattern(html, pattern, to, label) {
  const matches = html.match(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`)) || [];
  if (matches.length !== 1) throw new Error(`CreatorVoice source drift: expected one ${label}, found ${matches.length}`);
  return html.replace(pattern, to);
}

function build() {
  let html = fs.readFileSync(SOURCE, "utf8");
  html = replaceOnce(html, 'lang="en"', 'lang="sw"');
  html = replaceOnce(html, "<title>CreatorVoice Studio | AfroTools</title>", "<title>Rekodi na Hariri Sauti — CreatorVoice | AfroTools</title>");
  html = replaceOnce(html, '  <meta name="robots" content="noindex, follow">\n', "");
  html = replaceOnce(html, '<link rel="stylesheet" href="style.css?v=fe5e4b7b">', '<link rel="stylesheet" href="/tools/creator-voice/style.css?v=fe5e4b7b">');
  html = replaceOnce(html, '<meta property="og:url" content="https://afrotools.com/tools/creator-voice/app">', `<meta name="description" content="Rekodi, hariri na changanya sauti ndani ya kivinjari; hifadhi mradi na pakua WAV, OGG au WebM bila kupakia sauti kwenye seva.">
<meta name="afrotools-sw-native-owner" content="creator-voice">
<meta name="afrotools-sw-source-owner" content="${OWNER}">
<meta property="og:type" content="website">
<meta property="og:title" content="Rekodi na Hariri Sauti — CreatorVoice | AfroTools">
<meta property="og:description" content="Studio ya sauti ya ndani ya kivinjari yenye kurekodi, kuhariri, kuchanganya na kupakua.">
<meta property="og:image" content="https://afrotools.com/assets/img/tools/creator-voice.webp">
<meta property="og:url" content="https://afrotools.com/sw/zana/rekodi-na-hariri-sauti/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Rekodi na Hariri Sauti — CreatorVoice | AfroTools">
<meta name="twitter:description" content="Rekodi na hariri sauti ndani ya kivinjari chako.">
<meta name="twitter:image" content="https://afrotools.com/assets/img/tools/creator-voice.webp">`);
  html = replaceOnce(html, '<link rel="canonical" href="https://afrotools.com/tools/creator-voice/app">', `<link rel="canonical" href="https://afrotools.com/sw/zana/rekodi-na-hariri-sauti/">
<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/creator-voice/">
<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/voix-de-marque-du-createur/">
<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/rekodi-na-hariri-sauti/">
<link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/creator-voice/">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"Rekodi na Hariri Sauti — CreatorVoice","url":"https://afrotools.com/sw/zana/rekodi-na-hariri-sauti/","inLanguage":"sw","applicationCategory":"MultimediaApplication","operatingSystem":"Web","image":"https://afrotools.com/assets/img/tools/creator-voice.webp","description":"Rekodi, hariri, changanya na pakua sauti ndani ya kivinjari."}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","inLanguage":"sw","mainEntity":[{"@type":"Question","name":"Je, sauti inapakiwa kwenye seva?","acceptedAnswer":{"@type":"Answer","text":"Hapana. Rekodi, uhariri na miradi hubaki ndani ya kivinjari chako."}},{"@type":"Question","name":"Ni format gani za upakuaji zinapatikana?","acceptedAnswer":{"@type":"Answer","text":"WAV hupatikana kila mara. WebM au OGG hutegemea codec ya MediaRecorder inayoungwa mkono na kivinjari. MP3 inahitaji encoder ya ndani ambayo haijajumuishwa kwenye ukurasa huu."}},{"@type":"Question","name":"Naweza kufungua mradi tena?","acceptedAnswer":{"@type":"Answer","text":"Ndiyo. Kitufe cha Hifadhi huweka mradi katika IndexedDB ya kivinjari hiki; unaweza kuufungua au kuufuta kwenye paneli ya Miradi."}}]}</script>`);

  const replacements = [
    ['<a href="index.html" class="cvo-app-logo">', '<a href="/sw/zana/rekodi-na-hariri-sauti/" class="cvo-app-logo">'],
    ['aria-label="ProjectName"', 'aria-label="Jina la mradi"'],
    ['value="Untitled Project"', 'value="Mradi usio na jina"'],
    ['title="Projects"', 'title="Miradi" aria-label="Fungua miradi iliyohifadhiwa"'],
    ['&#128190; Save', '&#128190; Hifadhi'],
    ['>Record</button>', '>Rekodi</button>'], ['>Edit</button>', '>Hariri</button>'], ['>Library</button>', '>Maktaba</button>'],
    ['aria-label="Mic Select"', 'aria-label="Chagua maikrofoni"'], ['Loading microphones...', 'Inatafuta maikrofoni...'],
    ['id="recordBtn">', 'id="recordBtn" aria-label="Anza kurekodi">'],
    ['&#9646;&#9646; Pause', '&#9646;&#9646; Sitisha'], ['&#9632; Stop', '&#9632; Maliza'],
    ['Click the record button or press', 'Bofya kitufe cha kurekodi au bonyeza'], ['to start recording', 'ili kuanza kurekodi'],
    ['<div class="cvo-upload-area" id="uploadArea">', '<div class="cvo-upload-area" id="uploadArea" role="button" tabindex="0" aria-label="Pakia faili la sauti">'],
    ['aria-label="FileInput"', 'aria-label="Chagua faili la sauti"'],
    ['Drag & drop audio here or <strong>click to browse</strong>', 'Buruta sauti hapa au <strong>bofya kuchagua faili</strong>'],
    ['MP3, WAV, OGG, M4A supported', 'MP3, WAV, OGG na M4A zinakubaliwa kwa kuhariri'],
    ['&#9986; Trim', '&#9986; Baki na uteuzi'], ['&#128465; Cut', '&#128465; Kata'], ['&#8967; Split', '&#8967; Weka mgawanyo'],
    ['&#8599; Fade In', '&#8599; Ongeza taratibu'], ['&#8600; Fade Out', '&#8600; Punguza taratibu'], ['&#128200; Normalize', '&#128200; Sawazisha'],
    ['&#128263; Noise Reduce', '&#128263; Punguza kelele'], ['&#128260; Reverse', '&#128260; Geuza'], ['&#9723; Insert Silence', '&#9723; Ingiza ukimya'],
    ['&#127748; Reverb', '&#127748; Mwangwi'], ['&#128296; Compressor', '&#128296; Banaji'], ['&#127925; Pitch Shift', '&#127925; Badili toni'],
    ['>Speed\n', '>Kasi\n'], ['&#8630; Undo', '&#8630; Tendua'], ['&#8631; Redo', '&#8631; Rudia'],
    ['&#127924; Multi-Track Mixer', '&#127924; Kichanganya njia nyingi'],
    ['Track 1', 'Njia 1'], ['Track 2', 'Njia 2'], ['Track 3', 'Njia 3'], ['>Voice<', '>Sauti kuu<'], ['>Music<', '>Muziki<'],
    ['title="Mute"', 'title="Nyamazisha"'], ['title="Solo"', 'title="Sikiliza njia hii pekee"'], ['title="Volume"', 'title="Sauti"'], ['title="Pan"', 'title="Mwelekeo wa sauti"'],
    ['Main recording', 'Rekodi kuu'], ['+ Upload Music', '+ Pakia muziki'], ['+ Upload SFX', '+ Pakia athari'],
    ['&#128229; Export Audio', '&#128229; Pakua sauti'], ['>Format</label>', '>Format</label>'],
    ['WAV (Lossless)', 'WAV (bila kupunguza ubora)'], ['MP3 (Compressed)', 'MP3 (inahitaji encoder ya ndani; haipatikani)'],
    ['<option value="mp3">', '<option value="mp3" disabled>'], ['OGG Vorbis', 'OGG (ikiwa kivinjari kinaunga mkono)'], ['WebM</option>', 'WebM (Opus)</option>'],
    ['<label class="cvo-form-label">Quality</label>', '<label class="cvo-form-label" for="exportQuality">Ubora</label>'],
    ['High (320kbps)', 'Juu (320kbps)'], ['Medium (192kbps)', 'Wastani (192kbps)'], ['Low (128kbps)', 'Chini (128kbps)'],
    ['<label class="cvo-form-label">Title</label>', '<label class="cvo-form-label" for="exportTitle">Kichwa</label>'],
    ['aria-label="Episode title"', 'aria-label="Kichwa cha kipindi"'], ['placeholder="Episode title..."', 'placeholder="Kichwa cha kipindi..."'],
    ['<label class="cvo-form-label">Artist</label>', '<label class="cvo-form-label" for="exportArtist">Mtayarishi</label>'],
    ['aria-label="Your name"', 'aria-label="Jina la mtayarishi"'], ['placeholder="Your name..."', 'placeholder="Jina lako..."'],
    ['Export &amp; Download', 'Tayarisha na pakua'], ['&#127925; Sound Library', '&#127925; Maktaba ya sauti'],
    ['Click to preview. Use the', 'Bofya kusikiliza mfano. Tumia kitufe cha'], ['button to add to a track.', 'kuongeza kwenye njia.'],
    ['&#128193; Saved Projects', '&#128193; Miradi iliyohifadhiwa'],
    ['<span class="cvo-bnav-icon">&#127897;</span>Record', '<span class="cvo-bnav-icon">&#127897;</span>Rekodi'],
    ['<span class="cvo-bnav-icon">&#9997;</span>Captions', '<span class="cvo-bnav-icon">&#9997;</span>Manukuu'],
    ['<span class="cvo-bnav-icon">&#8505;&#65039;</span>About', '<span class="cvo-bnav-icon">&#8505;&#65039;</span>Kuhusu'],
  ];
  for (const [from, to] of replacements) {
    if (!html.includes(from)) throw new Error(`CreatorVoice source drift: missing ${JSON.stringify(from)}`);
    html = html.split(from).join(to);
  }

  html = html
    .replace(/^<script src="\/assets\/js\/analytics-bootstrap[^\n]+\n/m, "")
    .replace(/^\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n/m, "")
    .replace(/^\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\n/m, "")
    .replace(/^\s*<link href="https:\/\/fonts\.googleapis\.com\/css2[^\n]+\n/m, "")
    .replace(/^\s*<script src="\/assets\/js\/supabase-auth[^\n]+\n/m, "")
    .replace(/^\s*<script src="\/assets\/js\/lib\/creator-profile[^\n]+\n/m, "")
    .replace(/^\s*<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/lamejs[^\n]+\n/m, "")
    .replace(/^\s*<script src="\/assets\/js\/pages\/day9-creative-expanded-safety[^\n]+\n/m, "")
    .replace(/^\s*<script src="\/assets\/js\/lazy-analytics[^\n]+\n/m, "")
    .replace('<a href="app.html" class="active">', '<a href="/sw/zana/rekodi-na-hariri-sauti/" class="active">')
    .replace('<a href="/tools/creator-captions/app">', '<a href="/sw/zana/caption-za-maudhui/app">')
    .replace('<a href="index.html"><span class="cvo-bnav-icon">', '<a href="/sw/zana/rekodi-na-hariri-sauti/"><span class="cvo-bnav-icon">')
    .replaceAll('data-action="mute" title="Nyamazisha"', 'data-action="mute" title="Nyamazisha" aria-pressed="false"')
    .replaceAll('data-action="solo" title="Sikiliza njia hii pekee"', 'data-action="solo" title="Sikiliza njia hii pekee" aria-pressed="false"')
    .replace('<div class="cvo-toast" id="toast"></div>', '<div class="cvo-toast" id="toast" role="status" aria-live="polite"></div>');

  html = replaceOncePattern(html, /<script src="\/assets\/js\/pages\/creative\/creator-voice-app-controller\.js(?:\?v=[^"]+)?"><\/script>/, `<section class="cvo-sw-info" aria-labelledby="cvoPrivacyTitle"><h2 id="cvoPrivacyTitle">Faragha, ruhusa na mipaka</h2><p>Sauti, uhariri na miradi hubaki kwenye kivinjari hiki. Hakikisha una ruhusa ya kurekodi sauti za watu wengine. Uwezo wa codec hutegemea kivinjari; WAV ndiyo chaguo la uhakika, na OGG au WebM hutolewa tu kivinjari kinapoyaunga mkono.</p></section>
<section class="cvo-sw-info" aria-labelledby="cvoHelpTitle"><h2 id="cvoHelpTitle">Maswali kuhusu studio</h2><details><summary>Je, sauti inapakiwa kwenye seva?</summary><p>Hapana. Hakuna rekodi ghafi, faili lililopakiwa au mradi unaotumwa kwenye mtandao.</p></details><details><summary>Naweza kufungua mradi tena?</summary><p>Ndiyo. Hifadhi mradi kisha ufungue paneli ya Miradi kwenye kivinjari hiki.</p></details><details><summary>Kwa nini OGG inaweza kupakuliwa kama WAV?</summary><p>Ikiwa kivinjari hakina codec ya OGG, programu inaeleza hali hiyo na hutumia WAV badala yake.</p></details></section>
<script>window.AfroToolsCreatorVoiceLocale=${JSON.stringify({ filenamePrefix: "sauti", dateLocale: "sw", strings: {
    micUnsupported:"Ufikiaji wa maikrofoni hautumiki",noMicrophones:"Hakuna maikrofoni iliyopatikana",microphone:"Maikrofoni",recordingReady:"Rekodi iko tayari kuhaririwa",decodeError:"Sauti ya rekodi haikuweza kufunguliwa",micDenied:"Ruhusa ya maikrofoni imekataliwa:",pause:"Sitisha",resume:"Endelea",audioLoaded:"Sauti imepakiwa:",decodeFileError:"Faili la sauti halikuweza kufunguliwa",track:"Njia",loaded:"imepakiwa",decodeGenericError:"Faili halikuweza kufunguliwa",selection:"Uteuzi:",trimmed:"Uteuzi umebaki",cutSelection:"Uteuzi umekatwa",splitPoint:"Sehemu ya kugawa imewekwa saa",fadeInApplied:"Ongezeko la taratibu limetumika",fadeOutApplied:"Upunguzaji wa taratibu umetumika",alreadyNormalized:"Sauti tayari imesawazishwa",normalizedGain:"Sauti imesawazishwa; ongezeko:",noiseApplied:"Upunguzaji wa kelele umetumika",reversed:"Sauti imegeuzwa",silenceInserted:"Sekunde 1 ya ukimya imeingizwa saa",reverbApplied:"Mwangwi umetumika",eqApplied:"EQ ya sauti imetumika",compressorApplied:"Banaji limetumika",pitchApplied:"Toni imepandishwa hatua mbili",nothingUndo:"Hakuna cha kutendua",undo:"Imetenduliwa",nothingRedo:"Hakuna cha kurudia",redo:"Imerudiwa",placeholderPreview:"(sauti ya mfano)",noAudioExport:"Hakuna sauti ya kupakua",preparingExport:"Inatayarisha faili...",wavExported:"WAV imepakuliwa",mp3Loading:"Encoder ya MP3 haipatikani kwenye ukurasa huu",mp3Exported:"MP3 imepakuliwa",formatFallback:"Format hii haitumiki kwenye kivinjari hiki; inapakua WAV badala yake",compressedExported:"Sauti iliyobanwa imepakuliwa",dbError:"Hifadhi ya miradi haikufunguka",nothingSave:"Hakuna sauti ya kuhifadhi",untitled:"Mradi usio na jina",projectSaved:"Mradi umehifadhiwa:",noProjects:"Hakuna miradi iliyohifadhiwa",recordThenSave:"Rekodi au pakia sauti, kisha bofya Hifadhi.",projectNotFound:"Mradi haujapatikana",loadedLabel:"Umefunguliwa:",projectDeleted:"Mradi umefutwa",click:"Bofya",whoosh:"Whoosh",pop:"Pop",ding:"Ding",applause:"Makofi",cameraShutter:"Mlizo wa kamera",notification:"Arifa",success:"Imefaulu",error:"Hitilafu",transition:"Mpito",swoosh:"Swoosh",clickSoft:"Bofyo laini",bell:"Kengele",coin:"Sarafu",magic:"Uchawi",drumRoll:"Ngoma",crowdCheer:"Shangwe",nature:"Mazingira",rain:"Mvua",fire:"Moto",typing:"Kuandika"
  }})};</script>
<script src="/assets/js/pages/creative/creator-voice-app-controller.js"></script>`, "CreatorVoice controller script");

  html = replaceOnce(html, "</head>", `<style>
  .cvo-sw-info{max-width:1100px;margin:24px auto;padding:18px 22px;border:1px solid rgba(148,163,184,.35);border-radius:12px;background:#111827;color:#e5e7eb}.cvo-sw-info h2{font-size:1rem;margin:0 0 8px}.cvo-sw-info p{line-height:1.6}.cvo-sw-info details{padding:10px 0;border-top:1px solid rgba(148,163,184,.25)}.cvo-sw-info summary{cursor:pointer;font-weight:700}.cvo-app :focus-visible,.cvo-sw-info :focus-visible{outline:3px solid #f8fafc;outline-offset:3px}@media(max-width:640px){.cvo-sw-info{margin:18px 12px;padding:16px}.cvo-app-header{gap:8px}.cvo-project-input{max-width:38vw}}
</style>
</head>`);

  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  const current = fs.existsSync(TARGET) ? fs.readFileSync(TARGET, "utf8") : "";
  if (localizedGeneratorEquivalent(current, html)) {
    console.log(`Kept release-normalized ${path.relative(ROOT, TARGET)}; maintained owner output is current.`);
    return;
  }
  fs.writeFileSync(TARGET, html);
  console.log(`Built ${path.relative(ROOT, TARGET)} from maintained CreatorVoice workspace.`);
}

build();
