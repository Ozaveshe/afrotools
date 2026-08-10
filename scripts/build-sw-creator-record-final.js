"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { localizedGeneratorEquivalent } = require("./lib/localized-generator-equivalence");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "tools", "creator-record", "app.html");
const TARGET = path.join(ROOT, "sw", "zana", "kirekodi-skrini", "index.html");
const OWNER = "scripts/build-sw-creator-record-final.js";

function replaceOnce(html, from, to) {
  const first = html.indexOf(from);
  if (first < 0) throw new Error(`CreatorRecord source drift: missing ${JSON.stringify(from)}`);
  if (html.indexOf(from, first + from.length) >= 0) throw new Error(`CreatorRecord source drift: duplicate ${JSON.stringify(from)}`);
  return html.slice(0, first) + to + html.slice(first + from.length);
}

function replaceOncePattern(html, pattern, to, label) {
  const matches = html.match(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`)) || [];
  if (matches.length !== 1) throw new Error(`CreatorRecord source drift: expected one ${label}, found ${matches.length}`);
  return html.replace(pattern, to);
}

function build() {
  let html = fs.readFileSync(SOURCE, "utf8");

  html = replaceOnce(html, 'lang="en"', 'lang="sw"');
  html = replaceOnce(html, "<title>CreatorRecord Workspace | AfroTools</title>", "<title>Kirekodi Skrini na Sauti — CreatorRecord | AfroTools</title>");
  html = replaceOnce(html, '  <meta name="robots" content="noindex, follow">\n', "");
  html = replaceOnce(html, '<link rel="stylesheet" href="style.css?v=d52841e8">', '<link rel="stylesheet" href="/tools/creator-record/style.css?v=d52841e8">');
  html = replaceOnce(html, '<meta property="og:url" content="https://afrotools.com/tools/creator-record/app">', `<meta name="description" content="Rekodi skrini, dirisha, kamera au sauti moja kwa moja kwenye kivinjari; simamisha, hakiki, hifadhi historia na pakua WebM bila kupakia rekodi kwenye seva.">
<meta name="afrotools-sw-native-owner" content="creator-record">
<meta name="afrotools-sw-source-owner" content="${OWNER}">
<meta property="og:type" content="website">
<meta property="og:title" content="Kirekodi Skrini na Sauti — CreatorRecord | AfroTools">
<meta property="og:description" content="Rekodi na uhakiki skrini, kamera au sauti ndani ya kivinjari chako, kisha pakua WebM.">
<meta property="og:image" content="https://afrotools.com/assets/img/tools/creator-record.webp">
<meta property="og:url" content="https://afrotools.com/sw/zana/kirekodi-skrini/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Kirekodi Skrini na Sauti — CreatorRecord | AfroTools">
<meta name="twitter:description" content="Rekodi skrini, kamera au sauti ndani ya kivinjari na upakue WebM.">
<meta name="twitter:image" content="https://afrotools.com/assets/img/tools/creator-record.webp">`);
  html = replaceOnce(html, '<link rel="canonical" href="https://afrotools.com/tools/creator-record/app">', `<link rel="canonical" href="https://afrotools.com/sw/zana/kirekodi-skrini/">
<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/creator-record/">
<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/enregistrement-pour-createur/">
<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/kirekodi-skrini/">
<link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/creator-record/">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"Kirekodi Skrini na Sauti — CreatorRecord","url":"https://afrotools.com/sw/zana/kirekodi-skrini/","inLanguage":"sw","applicationCategory":"MultimediaApplication","operatingSystem":"Web","image":"https://afrotools.com/assets/img/tools/creator-record.webp","description":"Rekodi skrini, kamera au sauti ndani ya kivinjari na upakue faili la WebM."}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","inLanguage":"sw","mainEntity":[{"@type":"Question","name":"Ni vivinjari gani vinaweza kurekodi skrini?","acceptedAnswer":{"@type":"Answer","text":"Chrome, Edge na Brave zina ulinganifu mpana. Firefox na Safari zinaweza kutofautiana katika kunasa sauti ya kifaa au skrini."}},{"@type":"Question","name":"Rekodi inapakuliwa katika format gani?","acceptedAnswer":{"@type":"Answer","text":"CreatorRecord hupakua WebM kwa codec inayoungwa mkono na kivinjari chako, kwa kawaida VP9, VP8 au Opus."}},{"@type":"Question","name":"Je, rekodi inapakiwa kwenye seva?","acceptedAnswer":{"@type":"Answer","text":"Hapana. Rekodi, onyesho na historia hubaki ndani ya kivinjari chako hadi uipakue au uifute."}},{"@type":"Question","name":"Je, kuna kikomo cha muda wa rekodi?","acceptedAnswer":{"@type":"Answer","text":"Hakuna kikomo kigumu kwenye programu, lakini muda hutegemea kumbukumbu na nafasi ya kifaa. Rekodi fupi ni salama zaidi kwa uthabiti."}}]}</script>`);

  const replacements = [
    ['href="index.html"', 'href="/sw/zana/kirekodi-skrini/"'],
    ['title="History"', 'title="Historia ya rekodi"'],
    ["Screen Only", "Skrini pekee"],
    ["Record your screen, tab, or window", "Rekodi skrini, kichupo au dirisha"],
    ["Webcam Only", "Kamera pekee"],
    ["Record from your camera", "Rekodi kwa kamera yako"],
    ["Screen + Webcam", "Skrini na kamera"],
    ["PiP webcam overlay on screen", "Kamera ndogo juu ya skrini"],
    ["Audio Only", "Sauti pekee"],
    ["Record mic and system audio", "Rekodi maikrofoni na sauti ya kifaa"],
    ['title="Pause/Resume (P)"', 'title="Sitisha au endelea (P)"'],
    ['title="Record (R)"', 'title="Anza kurekodi (R)"'],
    ['title="Stop (S)"', 'title="Maliza kurekodi (S)"'],
    ["&#127908; Audio", "&#127908; Sauti"],
    ["System audio", "Sauti ya kifaa"],
    ["Toggle system audio", "Washa au zima sauti ya kifaa"],
    ["Microphone", "Maikrofoni"],
    ["Toggle microphone", "Washa au zima maikrofoni"],
    ["Noise suppression", "Punguza kelele"],
    ["Toggle noise reduction", "Washa au zima upunguzaji wa kelele"],
    ["&#128247; Webcam", "&#128247; Kamera"],
    [">Camera</label>", ">Kamera</label>"],
    ["Loading cameras...", "Inatafuta kamera..."],
    [">Mirror</span>", ">Geuza picha</span>"],
    ["Toggle mirror preview", "Washa au zima ugeuzaji wa picha"],
    [">Shape</label>", ">Umbo</label>"],
    ['title="Circle"', 'title="Duara"'],
    ['title="Rounded Rectangle"', 'title="Mstatili wenye pembe laini"'],
    ['title="Rectangle"', 'title="Mstatili"'],
    [">PiP Position</label>", ">Mahali pa kamera ndogo</label>"],
    ['title="Top Left"', 'title="Juu kushoto"'],
    ['title="Top Right"', 'title="Juu kulia"'],
    ['title="Bottom Left"', 'title="Chini kushoto"'],
    ['title="Bottom Right"', 'title="Chini kulia"'],
    ["&#9881;&#65039; Options", "&#9881;&#65039; Chaguo"],
    ["3-2-1 countdown", "Hesabu ya 3-2-1"],
    ["Toggle countdown", "Washa au zima hesabu ya kuanza"],
    ["Preview appears here", "Onyesho la rekodi litaonekana hapa"],
    ["Pick a mode and hit record", "Chagua aina kisha anza kurekodi"],
    ['title="Pen (red)"', 'title="Kalamu nyekundu"'],
    ['title="Highlighter (yellow)"', 'title="Kiangazia cha njano"'],
    ['title="Arrow"', 'title="Mshale"'],
    ['title="Text"', 'title="Maandishi"'],
    ['title="Eraser"', 'title="Kifutio"'],
    ['title="Clear All"', 'title="Futa michoro yote"'],
    ["&#9986;&#65039; Trim", "&#9986;&#65039; Eneo la kuhakiki"],
    ['aria-label="TrimStart"', 'aria-label="Mwanzo wa eneo la kuhakiki"'],
    ['aria-label="TrimEnd"', 'aria-label="Mwisho wa eneo la kuhakiki"'],
    ["&#11015;&#65039; Download WebM", "&#11015;&#65039; Pakua WebM"],
    ['aria-label="Quality Select"', 'aria-label="Chagua ubora wa onyesho"'],
    ["&#128197; Recent Recordings", "&#128197; Rekodi za hivi karibuni"],
    ["No recordings yet", "Bado hakuna rekodi"],
    ["Record &nbsp;", "Anza &nbsp;"],
    ["Pause &nbsp;", "Sitisha &nbsp;"],
    ["Stop &nbsp;", "Maliza &nbsp;"],
    ["Cancel", "Ghairi"],
  ];
  for (const [from, to] of replacements) html = replaceOnce(html, from, to);

  html = html
    .replace(/<div class="crd-mode-card([^"]*)" data-mode=/g, '<div class="crd-mode-card$1" role="button" tabindex="0" data-mode=')
    .replace(/<div class="crd-pip-pos([^"]*)" data-pos=/g, '<div class="crd-pip-pos$1" role="button" tabindex="0" data-pos=')
    .replace('<div class="crd-toast" id="toast"></div>', '<div class="crd-toast" id="toast" role="status" aria-live="polite"></div>');

  html = html
    .replace(/^<script src="\/assets\/js\/analytics-bootstrap[^\n]+\n/m, "")
    .replace(/^\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n/m, "")
    .replace(/^\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\n/m, "")
    .replace(/^\s*<link href="https:\/\/fonts\.googleapis\.com\/css2[^\n]+\n/m, "")
    .replace(/^\s*<script src="\/assets\/js\/supabase-auth[^\n]+\n/m, "")
    .replace(/^\s*<script src="\/assets\/js\/lib\/creator-profile[^\n]+\n/m, "")
    .replace(/^\s*<script src="\/assets\/js\/pages\/day9-creative-expanded-safety[^\n]+\n/m, "")
    .replace(/^\s*<script src="\/assets\/js\/lazy-analytics[^\n]+\n/m, "");

  html = replaceOncePattern(html, /  <script src="\/assets\/js\/pages\/creative\/creator-record-app-controller\.js(?:\?v=[^"]+)?"><\/script>/, `  <section class="crd-sw-privacy" aria-labelledby="crdPrivacyTitle">
    <h2 id="crdPrivacyTitle">Faragha na ruhusa</h2>
    <p>Rekodi na historia yake hubaki kwenye kivinjari chako. Hakikisha una ruhusa kabla ya kurekodi watu, mikutano, darasa au skrini yenye taarifa nyeti. Upakuaji ni WebM; uwezo wa kamera, maikrofoni na sauti ya kifaa hutegemea kivinjari na kifaa.</p>
  </section>
  <section class="crd-sw-privacy" aria-labelledby="crdHelpTitle">
    <h2 id="crdHelpTitle">Maswali kuhusu kurekodi</h2>
    <details><summary>Ni vivinjari gani vinaweza kurekodi skrini?</summary><p>Chrome, Edge na Brave zina ulinganifu mpana. Firefox na Safari zinaweza kutofautiana katika kunasa sauti ya kifaa au skrini.</p></details>
    <details><summary>Rekodi inapakuliwa katika format gani?</summary><p>CreatorRecord hupakua WebM kwa codec inayoungwa mkono na kivinjari chako, kwa kawaida VP9, VP8 au Opus.</p></details>
    <details><summary>Je, rekodi inapakiwa kwenye seva?</summary><p>Hapana. Rekodi, onyesho na historia hubaki ndani ya kivinjari chako hadi uipakue au uifute.</p></details>
    <details><summary>Je, kuna kikomo cha muda wa rekodi?</summary><p>Hakuna kikomo kigumu kwenye programu, lakini muda hutegemea kumbukumbu na nafasi ya kifaa. Rekodi fupi ni salama zaidi kwa uthabiti.</p></details>
  </section>
  <script>window.AfroToolsCreatorRecordLocale=${JSON.stringify({ filenamePrefix: "Rekodi", dateLocale: "sw", strings: {
    noCameras: "Hakuna kamera iliyopatikana", camera: "Kamera", mediaUnsupported: "Kivinjari hiki hakiwezi kurekodi media", screenUnsupported: "Kivinjari hiki hakiwezi kunasa skrini", recorderUnsupported: "MediaRecorder haipatikani; tumia Chrome au Edge", enterText: "Andika maandishi:", getReady: "Jiandae...", noTracks: "Hakuna chanzo cha media kinachopatikana", permissionDenied: "Ruhusa imekataliwa; ruhusu kamera, maikrofoni au skrini", errorPrefix: "Hitilafu:", cancelled: "Rekodi imeghairiwa", failed: "Rekodi imeshindwa; hakuna data iliyonaswa", complete: "Rekodi imekamilika", downloading: "Inapakua...", noRecordings: "Bado hakuna rekodi", preview: "Hakiki", download: "Pakua", delete: "Futa", deleted: "Rekodi imefutwa"
  }})};</script>
  <script src="/assets/js/pages/creative/creator-record-app-controller.js"></script>`, "CreatorRecord controller script");

  html = replaceOnce(html, "</head>", `<style>
    .crd-sw-privacy{max-width:1180px;margin:0 auto 40px;padding:18px 22px;border:1px solid rgba(148,163,184,.35);border-radius:12px;background:rgba(15,23,42,.55);color:#e2e8f0}
    .crd-sw-privacy h2{margin:0 0 8px;font-size:1rem}.crd-sw-privacy p{margin:0;line-height:1.6;color:#cbd5e1}.crd-sw-privacy details{padding:10px 0;border-top:1px solid rgba(148,163,184,.25)}.crd-sw-privacy summary{cursor:pointer;font-weight:700}.crd-sw-privacy details p{padding-top:8px}
    .crd-mode-card:focus-visible,.crd-pip-pos:focus-visible,.crd-toggle:focus-visible,.crd-anno-btn:focus-visible,.crd-btn-icon:focus-visible,.crd-record-btn:focus-visible,.crd-ctrl-btn:focus-visible,.crd-export-btn:focus-visible{outline:3px solid #f8fafc;outline-offset:3px}
    @media(max-width:640px){.crd-sw-privacy{margin:0 12px 28px;padding:16px}}
  </style>
</head>`);

  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  const current = fs.existsSync(TARGET) ? fs.readFileSync(TARGET, "utf8") : "";
  if (localizedGeneratorEquivalent(current, html)) {
    console.log(`Kept release-normalized ${path.relative(ROOT, TARGET)}; maintained owner output is current.`);
    return;
  }
  fs.writeFileSync(TARGET, html);
  console.log(`Built ${path.relative(ROOT, TARGET)} from maintained CreatorRecord workspace.`);
}

build();
