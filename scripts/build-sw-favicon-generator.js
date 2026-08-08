#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const sourcePath = path.join(ROOT, 'tools/favicon-generator/index.html');
const outputPath = path.join(ROOT, 'sw/zana/kizalishaji-favicon/index.html');

const pairs = [
  ['AfroTools / Tools', 'AfroTools / Zana'], ['Favicon <em>Generator</em>', 'Kitengeneza <em>Favicon</em>'],
  ['Create favicon sets from images, text, or emoji. Generate multiple sizes (16x16, 32x32, 48x48, 64x64) and download as ZIP.', 'Tengeneza seti ya favicon kutoka picha, maandishi au emoji kwa saizi 16x16, 32x32, 48x48 na 64x64, kisha pakua ZIP yenye PNG, ICO na manifest.'],
  ['Client-side', 'Ndani ya kivinjari'], ['Multi-size', 'Saizi nyingi'], ['Fast', 'Haraka'], ['Favicon Mode', 'Njia ya favicon'], ['Image', 'Picha'], ['Text/Emoji', 'Maandishi/Emoji'],
  ['Upload Image', 'Pakia picha'], ['Choose an image or drag it here', 'Chagua picha au iburute hapa'], ['PNG, JPG, WebP (Square recommended)', 'PNG, JPG au WebP (mraba unapendekezwa)'],
  ['Choose a PNG, JPG, or WebP image.', 'Chagua faili ya picha ya PNG, JPG au WebP.'], ['Text or Emoji', 'Maandishi au emoji'], ['Background Color', 'Rangi ya mandharinyuma'], ['Text Color', 'Rangi ya maandishi'],
  ['Generate Favicons', 'Tengeneza favicon'], ['Reset', 'Rudisha'], ['Sizes', 'Saizi'], ['Download ZIP', 'Pakua ZIP'], ['Favicon Generator', 'Kitengeneza Favicon'],
  ['Generate favicons in all common sizes.', 'Tengeneza favicon kwa saizi nne za kawaida.'], ['Multiple sizes', 'Saizi nyingi'], ['Image or text', 'Picha au maandishi'], ['Custom colors', 'Rangi unazochagua'], ['ZIP download', 'Pakua ZIP'],
  ['Related tools', 'Zana zinazohusiana'], ['Favicon Generator: How It Works', 'Jinsi Kitengeneza Favicon Kinavyofanya Kazi'], ['Frequently Asked Questions', 'Maswali yanayoulizwa mara kwa mara'],
  ['The AfroTools Favicon Generator creates website icons from images, text, or emoji in seconds. Upload an existing logo or image, type a letter or word, or pick an emoji to create a complete favicon set in all standard sizes - 16x16, 32x32, 48x48, and 64x64 pixels as PNG files, plus the traditional ICO format. Download everything as a single ZIP file ready to drop into your website. The text mode lets you choose a background colour, font, and letter to create a clean typographic favicon even if you do not have a logo yet. The emoji mode is perfect for quick project favicons or personal sites. For the image mode, the tool automatically resizes and crops your upload to each required dimension while maintaining clarity at small sizes. Favicons are critical for browser tab recognition, bookmark displays, and mobile home screen icons. Without one, your site looks unfinished and loses brand recognition. This tool is designed for web developers, bloggers, small business owners, and anyone launching a website who needs a professional favicon without opening Photoshop or paying a designer.', 'Kitengeneza Favicon cha AfroTools hutengeneza icon za tovuti kutoka picha, maandishi au emoji ndani ya kivinjari. Hutoa PNG za 16x16, 32x32, 48x48 na 64x64, ICO inayofunga saizi zote nne, na site.webmanifest ndani ya ZIP moja. Njia ya maandishi hukuruhusu kuchagua herufi au emoji pamoja na rangi; njia ya picha hupunguza picha hadi kila saizi. Kagua hasa 16x16 ili kuhakikisha alama bado inasomeka, na thibitisha haki za logo kabla ya kuitumia.'],
  ['Favicon export check', 'Ukaguzi wa favicon'], ['Generate the full icon set, then test it on real tabs and devices', 'Tengeneza seti kamili ya icon, kisha ijaribu kwenye tab na vifaa halisi'],
  ['Turn a logo, lettermark, or simple mark into browser icons, touch icons, preview states, and downloadable assets for site launches.', 'Geuza logo, herufi au alama rahisi kuwa icon za kivinjari, muonekano wa ukubwa tofauti na faili tayari kwa tovuti.'],
  ['Local canvas export', 'Utoaji wa canvas ya ndani'], ['Source artwork stays in the browser while icons are generated.', 'Picha chanzo hubaki ndani ya kivinjari wakati icon zinatengenezwa.'],
  ['Primary task', 'Kazi kuu'], ['Upload or create the source mark and choose background settings.', 'Pakia au tengeneza alama chanzo na uchague rangi za mandharinyuma.'], ['Preview square, rounded, and small-tab appearances.', 'Kagua muonekano wa mraba na saizi ndogo ya tab.'], ['Download the icon package and copy the HTML tags or manifest references.', 'Pakua kifurushi cha icon chenye PNG, ICO na manifest.'],
  ['Result and export', 'Matokeo na utoaji'], ['Favicon and app icon exports in common sizes.', 'PNG za favicon katika saizi nne za kawaida.'], ['Preview of light, dark, and browser tab contexts.', 'Kagua usomaji kwenye mandharinyuma mepesi na meusi.'], ['Copyable implementation snippet.', 'Manifest na ICO zimo ndani ya ZIP.'],
  ['Before you use it', 'Kabla ya kutumia'], ['Use a simple high-contrast mark at 16x16 and 32x32.', 'Tumia alama rahisi yenye utofauti mzuri kwenye 16x16 na 32x32.'], ['Verify transparency and maskable icon safe areas.', 'Kagua uwazi na nafasi salama ya icon.'], ['Check brand rights before using third-party logos.', 'Thibitisha haki za brand kabla ya kutumia logo ya mtu mwingine.'],
  ['Assumptions and freshness', 'Mipaka na upya'], ['Design helper only. Browser and platform icon requirements can change; test generated assets in your target app or CMS.', 'Ni msaada wa design tu. Masharti ya icon yanaweza kubadilika; jaribu faili kwenye app, kivinjari au CMS unayolenga.'],
  ['Report tool issue', 'Ripoti tatizo la zana'], ['Planning utility only. It is not an official provider, legal, tax, security, filing, compliance, or live-data service. Keep sensitive content local unless you intentionally export or share it.', 'Ni zana ya kupanga tu, si huduma rasmi. Picha hubaki ndani ya kivinjari isipokuwa unapopakua au kushiriki kwa makusudi.'],
  ['What sizes are included in the favicon set?', 'Seti ya favicon ina saizi gani?'], ['The download includes PNG files at 16x16, 32x32, 48x48, and 64x64 pixels, plus an ICO file that bundles all sizes together. This covers all major browser and platform requirements.', 'ZIP ina PNG za 16x16, 32x32, 48x48 na 64x64, faili moja ya ICO yenye saizi zote, na site.webmanifest yenye rejea sahihi za icon.'],
  ['What is the difference between PNG and ICO formats?', 'Tofauti kati ya PNG na ICO ni nini?'], ['PNG favicons are used by modern browsers and support transparency. ICO is the legacy format that bundles multiple sizes into a single file and is required for older browsers and certain platforms like Windows.', 'PNG hutumiwa na vivinjari vya kisasa na inaweza kuwa na uwazi. ICO huweka saizi nyingi kwenye faili moja kwa mifumo ya zamani na baadhi ya matumizi ya Windows.'],
  ['Can I create a favicon from text without a logo?', 'Ninaweza kutengeneza favicon kwa maandishi bila logo?'], ['Yes. Switch to text mode, enter a letter or short text, choose your background and text colours, and the tool generates a clean typographic favicon ready for download.', 'Ndiyo. Chagua njia ya maandishi, andika herufi, maandishi mafupi au emoji, kisha chagua rangi za mandharinyuma na maandishi.'],
  ['How do I add the favicon to my website?', 'Ninawekaje favicon kwenye tovuti?'], ['Place the generated favicon files in your website\'s root directory, then add a link tag in your HTML head: &lt;link rel="icon" type="image/png" href="/favicon-32x32.png"&gt;. The ICO file can be referenced with &lt;link rel="icon" href="/favicon.ico"&gt;.', 'Weka faili zilizotengenezwa kwenye folda ya tovuti, kisha rejea favicon-32x32.png au favicon.ico kwenye sehemu ya head. Site.webmanifest inaorodhesha PNG zote nne.'],
  ['Does the tool support transparent backgrounds?', 'Zana inahifadhi mandharinyuma yenye uwazi?'], ['Yes. If you upload a PNG image with a transparent background, the transparency is preserved in the generated favicon files. This works in image mode for both PNG and ICO outputs.', 'Ndiyo. PNG yenye uwazi huhifadhi uwazi huo kwenye PNG na picha za PNG zilizofungwa ndani ya ICO.'],
  ['Related Image Tools', 'Zana nyingine za picha'], ['Logo Maker', 'Kitengeneza Logo'], ['Color Picker', 'Kichagua Rangi'], ['Image Resizer', 'Kibadilisha Ukubwa wa Picha'], ['View All Image Tools', 'Tazama zana zote za picha']
];

function meta(html, selector, value) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`(<meta\\s+${escaped}\\s+content=")[^"]*(")`, 'i'), `$1${value}$2`);
}
function build() {
  let html = fs.readFileSync(sourcePath, 'utf8');
  html = html.replace('lang="en"', 'lang="sw"');
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>Kitengeneza Favicon: PNG, ICO na Manifest | AfroTools</title>');
  html = meta(html, 'name="description"', 'Tengeneza favicon za PNG katika saizi nne, ICO yenye saizi zote na site.webmanifest ndani ya ZIP. Picha hubaki ndani ya kivinjari.');
  html = meta(html, 'property="og:title"', 'Kitengeneza Favicon | AfroTools');
  html = meta(html, 'property="og:description"', 'Tengeneza seti ya favicon ya PNG, ICO na manifest ndani ya kivinjari.');
  html = meta(html, 'property="og:url"', 'https://afrotools.com/sw/zana/kizalishaji-favicon/');
  html = meta(html, 'name="twitter:title"', 'Kitengeneza Favicon | AfroTools');
  html = meta(html, 'name="twitter:description"', 'Tengeneza favicon za PNG, ICO na manifest bila kupakia picha.');
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
  html = html.replace(/<link rel="canonical"[^>]*>\s*<link rel="alternate" hreflang="en"[^>]*>\s*<link rel="alternate" hreflang="fr"[^>]*>\s*(?:<link rel="alternate" hreflang="sw"[^>]*>\s*)?<link rel="alternate" hreflang="x-default"[^>]*>/,
    '<link rel="canonical" href="https://afrotools.com/sw/zana/kizalishaji-favicon/">\n<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/favicon-generator/">\n<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/generateur-favicon/">\n<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/kizalishaji-favicon/">\n<link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/favicon-generator/">');
  const ordered = [...pairs].sort((a, b) => b[0].length - a[0].length);
  html = html.replace(/>[^<]+</g, segment => ordered.reduce((value, pair) => value.split(pair[0]).join(pair[1]), segment));
  html = html.replace('<a href="/">AfroTools</a> / <span>Tools</span>', '<a href="/sw/">AfroTools</a> / <span>Zana</span>');
  html = html.replace('<h1>Favicon <em>Generator</em></h1>', '<h1>Kitengeneza <em>Favicon</em></h1>');
  ordered.forEach(([from, to]) => { html = html.replaceAll(`aria-label="${from}"`, `aria-label="${to}"`); html = html.replaceAll(`placeholder="${from}"`, `placeholder="${to}"`); });
  html = html.replace('aria-label="Choose an image for the favicon"', 'aria-label="Chagua picha ya favicon"');
  html = html.replace('<div class="tool-main" id="main-content" role="main">', '<!-- Source owner: scripts/build-sw-favicon-generator.js; engine: assets/js/lib/favicon-generator-studio.js -->\n<div class="tool-main" id="main-content" role="main">');
  html = html.replace(/<afro-related-tools category="image-design" current="favicon-generator"[\s\S]*?<\/afro-related-tools>/, '<afro-related-tools category="image-design" current="favicon-generator" data-ssr="1"><nav class="seo-links related-tools-ssr" aria-label="Zana zinazohusiana"><h2 class="seo-links-title">Zana zinazohusiana</h2><ul class="seo-links-list"><li><a href="/sw/zana/kubana-picha/">Bana picha</a></li><li><a href="/sw/zana/kubadilisha-ukubwa-wa-picha/">Badilisha ukubwa wa picha</a></li><li><a href="/sw/zana/kukata-picha/">Kata picha</a></li><li><a href="/sw/zana/kitengeneza-thumbnail/">Tengeneza thumbnail</a></li></ul></nav></afro-related-tools>');
  const schema = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Kitengeneza Favicon', description: 'Tengeneza favicon za PNG, ICO na site.webmanifest ndani ya kivinjari.', url: 'https://afrotools.com/sw/zana/kizalishaji-favicon/', inLanguage: 'sw', applicationCategory: 'DesignApplication', operatingSystem: 'Web', browserRequirements: 'JavaScript, Canvas na FileReader', image: 'https://afrotools.com/assets/img/tools/favicon-generator.webp', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, author: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' } };
  html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema)}</script>\n</head>`);
  return html;
}
const output = build();
if (process.argv.includes('--check')) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== output) { console.error('Swahili favicon route is stale.'); process.exit(1); }
  console.log('Swahili favicon route matches the English studio contract.');
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output);
  console.log('Built native Swahili favicon studio.');
}
