#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const sourcePath = path.join(ROOT, 'tools/meme-generator/index.html');
const outputPath = path.join(ROOT, 'sw/zana/kitengeneza-meme/index.html');

const copy = new Map([
  ['African Meme Generator - Local Caption Packs | AfroTools', 'Kitengeneza Meme za Kiafrika | AfroTools'],
  ['Image &amp; Design / Local Banter', 'Picha na Design / Utani wa Kienyeji'],
  ['Make African memes with your own screenshots, local caption packs, and starter scenes.', 'Tengeneza meme za Kiafrika kwa screenshot zako, vifurushi vya maneno na mandhari za kuanzia.'],
  ['This version is honest about what it is: an upload-first meme tool with African-flavoured caption starters and simple built-in scenes. It is useful today, and it leaves room for a deeper local graphics pack later.', 'Hii ni zana ya meme inayotanguliza picha yako, yenye sentensi za kuanzia za Kiafrika na mandhari rahisi zilizojengwa ndani. Hariri maneno ili yalingane na hadhira yako.'],
  ['Upload-first', 'Anza na picha yako'], ['Starter scenes', 'Mandhari za kuanzia'], ['No watermark', 'Bila watermark'],
  ['1. Choose your base image', '1. Chagua picha ya msingi'], ['Upload a reaction photo or screenshot, or start from a simple local scene when you just need a fast placeholder.', 'Pakia picha ya mwitikio au screenshot, au anza na mandhari rahisi unapohitaji kiolezo cha haraka.'],
  ['Upload your image', 'Pakia picha yako'], ['Choose an image or drag it here', 'Chagua picha au iburute hapa'], ['Best with reaction selfies, screenshots, group chat moments, or real photos.', 'Inafaa kwa selfie za mwitikio, screenshot, matukio ya group chat au picha halisi.'], ['No custom image selected yet.', 'Bado hujachagua picha yako.'],
  ['2. Pick a caption pack', '2. Chagua kifurushi cha maneno'], ['Use these as quick starts, then edit the text so it feels like your voice, your friend group, or your audience.', 'Tumia hizi kuanza haraka, kisha hariri maneno yasikike kama sauti yako, marafiki zako au hadhira yako.'],
  ['3. Edit the meme text and style', '3. Hariri maandishi na mtindo wa meme'], ['Keep it short and readable. The classic style suits screenshots; the softer styles work better on the starter scenes.', 'Weka maandishi mafupi na yanayosomeka. Mtindo wa kawaida unafaa screenshot; mitindo laini inafaa mandhari za kuanzia.'],
  ['Top text', 'Maandishi ya juu'], ['Bottom text', 'Maandishi ya chini'], ['Text style', 'Mtindo wa maandishi'], ['Classic meme', 'Meme ya kawaida'], ['Warm poster', 'Poster laini'], ['Bold caption', 'Maneno mazito'], ['Text size', 'Ukubwa wa maandishi'], ['Smaller', 'Ndogo'],
  ['4. Preview and download', '4. Kagua na upakue'], ['The preview updates live. Download a PNG when the text feels right.', 'Muonekano hubadilika papo hapo. Pakua PNG maandishi yakikaa sawa.'], ['Download PNG', 'Pakua PNG'], ['Reset Text', 'Rudisha maandishi'],
  ['Starter scenes are built in. For the strongest memes, use your own screenshots and reaction photos.', 'Mandhari za kuanzia zimejengwa ndani. Kwa meme bora zaidi, tumia screenshot au picha yako ya mwitikio.'],
  ['NEPA mood', 'Hali ya stima'], ['Starter scenes are simple AfroTools backdrops, not a full reaction-image library. They are here so you can move fast when you do not have a photo ready.', 'Mandhari za kuanzia ni picha rahisi za AfroTools, si maktaba kamili ya picha za mwitikio. Zinakusaidia kuanza haraka usipokuwa na picha.'],
  ['How to make it feel local', 'Jinsi ya kuifanya ihisi ya kwenu'], ['The best results usually come from your own screenshots, your own facial reactions, and language your audience already uses. Keep captions short, rhythmical, and specific enough to feel like a shared joke.', 'Matokeo bora hutoka kwenye screenshot zako, mwitikio wako na lugha inayotumiwa na hadhira yako. Weka maneno mafupi, yenye mdundo na yanayoeleweka kwa watu unaolenga.'],
  ['Use the starter scenes when you need speed, not when you need a rich visual punchline.', 'Tumia mandhari za kuanzia unapohitaji kasi, si unapohitaji picha maalumu ya kichekesho.'], ['Swap in your own images for family chat jokes, football banter, church humour, or campus memes.', 'Tumia picha zako kwa utani wa familia, mpira, kanisa au chuo.'], ['Local slang works best when it is legible and not overloaded in both text boxes at once.', 'Misimu ya kwenu hufanya kazi vizuri ikiwa inasomeka na maandishi hayajajaa juu na chini kwa pamoja.'],
  ['Meme export check', 'Ukaguzi wa meme'], ['Check readability, rights, and audience context', 'Kagua usomaji, haki za picha na mazingira ya hadhira'], ['Build a meme from a starter scene or your own image, preview the text at full canvas size, then download a local PNG when the joke is readable.', 'Tengeneza meme kwa mandhari ya kuanzia au picha yako, kagua maandishi kwenye canvas kamili, kisha pakua PNG inayosomeka.'], ['Reviewed 2026', 'Imekaguliwa 2026'], ['Local image workflow. Uploaded screenshots or photos stay on this device.', 'Mtiririko wa picha wa ndani. Screenshot na picha unazopakia hubaki kwenye kifaa hiki.'],
  ['What to check', 'Mambo ya kukagua'], ['Methodology: selected scene or uploaded image, caption pack, edited top and bottom text, and text style render to a local PNG canvas.', 'Mbinu: mandhari au picha iliyopakiwa, kifurushi cha maneno, maandishi ya juu na chini na mtindo huchorwa kwenye canvas ya PNG ndani ya kivinjari.'], ['Check spelling, contrast, cropping, text length, and whether the joke works for the intended group before sharing.', 'Kagua tahajia, utofauti, ukataji wa picha, urefu wa maandishi na kama utani unafaa kundi lengwa kabla ya kushiriki.'], ['Use your own screenshot or reaction photo when specificity matters more than a starter scene.', 'Tumia screenshot au picha yako ya mwitikio unapohitaji meme mahususi.'],
  ['Limitations', 'Mipaka'], ['Not a copyright, defamation, moderation, platform policy, or brand safety review tool.', 'Si zana ya kukagua hakimiliki, kashfa, usimamizi wa maudhui, kanuni za jukwaa au usalama wa brand.'], ['Avoid using private chats, faces, or copyrighted media without permission.', 'Usitumie mazungumzo binafsi, sura za watu au maudhui yenye hakimiliki bila ruhusa.'], ['Privacy note: uploaded files stay in the browser session and are not uploaded to AfroTools.', 'Faragha: faili unazopakia hubaki kwenye kipindi cha kivinjari na hazipakwi kwenye AfroTools.'], ['Review download controls', 'Kagua vidhibiti vya kupakua'], ['Source/freshness note: meme context, platform rules, and image rights depend on where the content will be shared; verify before publishing publicly.', 'Chanzo na upya: mazingira ya meme, kanuni za jukwaa na haki za picha hutegemea mahali pa kushiriki; hakikisha kabla ya kuchapisha hadharani.'],
  ['Related tools', 'Zana zinazohusiana'], ['Image Compressor Studio', 'Studio ya Kubana Picha'], ['AI Flyer &amp; Poster Studio', 'Studio ya Flyer na Poster'], ['Background Remover Studio', 'Studio ya Kuondoa Mandharinyuma'], ['Image Resizer Studio', 'Studio ya Kubadilisha Ukubwa'], ['Passport Photo Studio', 'Studio ya Picha ya Pasipoti'], ['QR Code Generator', 'Kitengeneza QR Code'],
  ['Related image workflows', 'Mtiririko mingine ya picha'], ['Image Filters', 'Vichujio vya Picha'], ['Social Card', 'Kadi ya Mitandao'], ['Thumbnail Maker', 'Kitengeneza Thumbnail'], ['View all image tools', 'Tazama zana zote za picha']
]);

function meta(html, selector, value) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`(<meta\\s+${escaped}\\s+content=")[^"]*(")`, 'i'), `$1${value}$2`);
}
function build() {
  let html = fs.readFileSync(sourcePath, 'utf8');
  html = html.replace('lang="en"', 'lang="sw"');
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>Kitengeneza Meme za Kiafrika | AfroTools</title>');
  html = meta(html, 'name="description"', 'Tengeneza meme kwa picha yako au mandhari za kuanzia, hariri maandishi na upakue PNG ya 1200×900 bila watermark. Picha hubaki ndani ya kivinjari.');
  html = meta(html, 'name="keywords"', 'kitengeneza meme, meme za Kiswahili, meme za Kiafrika, meme PNG');
  html = meta(html, 'property="og:title"', 'Kitengeneza Meme za Kiafrika | AfroTools');
  html = meta(html, 'property="og:description"', 'Tengeneza meme ya PNG kwa picha yako na maneno ya Kiswahili ndani ya kivinjari.');
  html = meta(html, 'property="og:url"', 'https://afrotools.com/sw/zana/kitengeneza-meme/');
  html = meta(html, 'name="twitter:title"', 'Kitengeneza Meme za Kiafrika | AfroTools');
  html = meta(html, 'name="twitter:description"', 'Tengeneza na upakue meme ya PNG bila kupakia picha.');
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
  html = html.replace(/<link rel="canonical"[^>]*>[\s\S]*?<link rel="alternate" hreflang="x-default"[^>]*>/,
    '<link rel="canonical" href="https://afrotools.com/sw/zana/kitengeneza-meme/">\n<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/meme-generator/">\n<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/generateur-memes/">\n<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/kitengeneza-meme/">\n<link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/meme-generator/">');
  html = html.replace(/>[^<]+</g, segment => {
    const raw = segment.slice(1, -1); const key = raw.replace(/\s+/g, ' ').trim();
    return copy.has(key) ? `>${raw.replace(key, copy.get(key))}<` : segment;
  });
  for (const [from, to] of copy) { html = html.replaceAll(`aria-label="${from}"`, `aria-label="${to}"`); }
  html = html.replace('aria-label="Choose or drop an image for the meme"', 'aria-label="Chagua au dondosha picha ya meme"');
  html = html.replace('aria-label="Choose an image for the meme"', 'aria-label="Chagua picha ya meme"');
  html = html.replace('aria-label="Live meme preview"', 'aria-label="Muonekano wa meme unaobadilika papo hapo"');
  html = html.replace('<main class="workspace">', '<!-- Source owner: scripts/build-sw-meme-generator.js; deterministic canvas owner copied from tools/meme-generator/index.html -->\n<main class="workspace">');
  html = html.replace('<share-result-button tool-name="Meme Generator" tool-slug="meme-generator"></share-result-button>', '<share-result-button tool-name="Kitengeneza Meme" tool-slug="meme-generator"></share-result-button>');
  html = html.replace(/<afro-related-tools category="image-design" current="meme-generator"[\s\S]*?<\/afro-related-tools>/, '<afro-related-tools category="image-design" current="meme-generator" data-ssr="1"><nav class="seo-links related-tools-ssr" aria-label="Zana zinazohusiana"><h2 class="seo-links-title">Zana zinazohusiana</h2><ul class="seo-links-list"><li><a href="/sw/zana/kubana-picha/">Bana picha</a></li><li><a href="/sw/zana/kukata-picha/">Kata picha</a></li><li><a href="/sw/zana/kadi-ya-mitandao/">Tengeneza kadi ya mitandao</a></li><li><a href="/sw/zana/kitengeneza-thumbnail/">Tengeneza thumbnail</a></li></ul></nav></afro-related-tools>');
  html = html.replace('</script>\n<script src="/assets/js/lib/image-design-workflow.js', '</script>\n<script src="/assets/js/lib/meme-generator-studio-sw.js" defer></script>\n<script src="/assets/js/lib/image-design-workflow.js');
  const schema = { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Kitengeneza Meme za Kiafrika', description: 'Tengeneza meme kwa picha yako au mandhari za kuanzia na upakue PNG ndani ya kivinjari.', url: 'https://afrotools.com/sw/zana/kitengeneza-meme/', inLanguage: 'sw', applicationCategory: 'MultimediaApplication', operatingSystem: 'Web', browserRequirements: 'JavaScript, Canvas na FileReader', image: 'https://afrotools.com/assets/img/tools/meme-generator.webp', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, author: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' } };
  html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema)}</script>\n</head>`);
  return html;
}
const output = build();
if (process.argv.includes('--check')) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== output) { console.error('Swahili meme route is stale.'); process.exit(1); }
  console.log('Swahili meme route matches the deterministic English canvas contract.');
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true }); fs.writeFileSync(outputPath, output); console.log('Built native Swahili meme studio.');
}
