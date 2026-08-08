#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const englishPath = path.join(ROOT, 'tools/thumbnail-maker/index.html');
const swahiliPath = path.join(ROOT, 'sw/zana/kitengeneza-thumbnail/index.html');

const translations = new Map([
  ['Skip to thumbnail editor', 'Ruka hadi kihariri cha thumbnail'],
  ['Image &amp; Design / Creator Thumbnails', 'Picha na Design / Thumbnail za Watayarishi'],
  ['Make thumbnails that still read on a phone.', 'Tengeneza thumbnail zinazosomwa vizuri hata kwenye simu.'],
  ['Design YouTube thumbnails on the current recommended 16:9 canvas, keep a lightweight 1280 x 720 option for mobile uploads, check the runtime corner, test small-screen readability, save your brand kit, and export polished PNG, JPEG, or WebP files without uploading your images.', 'Tengeneza thumbnail za YouTube kwenye canvas ya 16:9 inayopendekezwa sasa, tumia chaguo jepesi la 1280 x 720 kwa upakiaji wa simu, kagua kona ya muda wa video, jaribu usomaji kwenye skrini ndogo, hifadhi seti ya brand, kisha toa PNG, JPEG au WebP bila kupakia picha zako.'],
  ['Tool highlights', 'Sifa kuu za zana'], ['Tier Gold', 'Kiwango cha Gold'], ['3840 x 2160 ready', 'Tayari kwa 3840 x 2160'], ['Hook checker', 'Ukaguzi wa hook'], ['No upload', 'Hakuna upakiaji'],
  ['YouTube thumbnail editor', 'Kihariri cha thumbnail za YouTube'], ['1. Start with the video job', '1. Anza na lengo la video'], ['Creator templates', 'Violezo vya watayarishi'],
  ['Pick a thumbnail pattern built around a real YouTube job: reaction, explainer, review, sports, music, food, education, news, podcast, or list.', 'Chagua muundo wa thumbnail kwa kazi halisi ya YouTube: mwitikio, maelezo, tathmini, michezo, muziki, chakula, elimu, habari, podcast au orodha.'],
  ['Loading studio...', 'Inapakia studio...'], ['Thumbnail templates', 'Violezo vya thumbnail'], ['2. Hook and message', '2. Hook na ujumbe'], ['Write for the feed', 'Andika kwa ajili ya feed'], ['Hook ideas', 'Mawazo ya hook'],
  ['Video title or idea', 'Kichwa au wazo la video'], ['Main thumbnail text', 'Maandishi makuu ya thumbnail'], ['Small support line', 'Mstari mfupi wa kusaidia'], ['Badge', 'Beji'], ['Channel mark', 'Alama ya channel'], ['Generated hook ideas', 'Mawazo ya hook yaliyotengenezwa'],
  ['ThumbVideoIdea', 'Wazo la video'], ['ThumbSubline', 'Mstari wa kusaidia'], ['ThumbBadge', 'Beji ya thumbnail'], ['ThumbChannel', 'Alama ya channel'],
  ['3. Composition', '3. Mpangilio'], ['Canvas and layout', 'Canvas na mpangilio'], ['Export size', 'Saizi ya faili'],
  ['YouTube recommended - 3840 x 2160', 'YouTube inayopendekezwa - 3840 x 2160'], ['YouTube compact - 1280 x 720', 'YouTube ndogo - 1280 x 720'], ['Full HD draft - 1920 x 1080', 'Rasimu ya Full HD - 1920 x 1080'], ['Shorts cover draft - 1080 x 1920', 'Rasimu ya jalada la Shorts - 1080 x 1920'], ['Square promo - 1080 x 1080', 'Promo ya mraba - 1080 x 1080'],
  ['Layout', 'Mpangilio'], ['Text left, subject right', 'Maandishi kushoto, mhusika kulia'], ['Subject left, text right', 'Mhusika kushoto, maandishi kulia'], ['Center punch', 'Msisitizo katikati'], ['Split comparison', 'Ulinganisho uliogawanywa'], ['Headline bar', 'Mkanda wa kichwa'], ['List stack', 'Orodha iliyopangwa'], ['Podcast card', 'Kadi ya podcast'],
  ['Text style', 'Mtindo wa maandishi'], ['Editorial serif', 'Serif ya uhariri'], ['Mono block', 'Bloku ya mono'], ['Background style', 'Mtindo wa mandharinyuma'], ['Gradient', 'Mchanganyiko wa rangi'], ['Solid', 'Rangi moja'], ['Burst', 'Miale'], ['Pattern', 'Muundo'], ['Uploaded image', 'Picha iliyopakiwa'],
  ['4. Brand and assets', '4. Brand na mali'], ['Photo, logo, colors', 'Picha, logo na rangi'], ['Load brand', 'Pakia brand'], ['Color palettes', 'Paleti za rangi'], ['Primary', 'Rangi kuu'], ['Accent', 'Rangi ya msisitizo'], ['Text', 'Maandishi'],
  ['Background or still frame', 'Mandharinyuma au fremu ya video'], ['Choose image', 'Chagua picha'], ['Subject photo', 'Picha ya mhusika'], ['Choose subject', 'Chagua mhusika'], ['Logo or avatar', 'Logo au avatar'], ['Choose logo', 'Chagua logo'],
  ['Text scale', 'Ukubwa wa maandishi'], ['Subject zoom', 'Ukuzaji wa mhusika'], ['Subject shift', 'Uhamishaji wa mhusika'], ['Vignette', 'Kivuli cha kingo'],
  ['ThumbPrimary', 'Rangi kuu'], ['ThumbAccent', 'Rangi ya msisitizo'], ['ThumbTextColor', 'Rangi ya maandishi'], ['ThumbTextScale', 'Ukubwa wa maandishi'], ['ThumbSubjectZoom', 'Ukuzaji wa mhusika'], ['ThumbSubjectShift', 'Uhamishaji wa mhusika'], ['ThumbVignette', 'Kivuli cha kingo'], ['ThumbGuides', 'Onyesha maeneo salama'],
  ['Preview and export', 'Muonekano na utoaji'], ['Live canvas', 'Canvas ya moja kwa moja'], ['YouTube thumbnail', 'Thumbnail ya YouTube'], ['Safe zones', 'Maeneo salama'], ['Rendered YouTube thumbnail preview', 'Muonekano wa thumbnail ya YouTube iliyotengenezwa'], ['Thumbnail checks', 'Ukaguzi wa thumbnail'], ['Size', 'Saizi'], ['Hook', 'Hook'], ['Readiness', 'Utayari'], ['Checking', 'Inakagua'],
  ['5. Export', '5. Toa faili'], ['Upload-ready file', 'Faili iliyo tayari kupakiwa'], ['Format', 'Format'], ['Filename suffix', 'Kiambishi cha jina la faili'], ['JPEG/WebP quality', 'Ubora wa JPEG/WebP'],
  ['Download thumbnail', 'Pakua thumbnail'], ['Export A/B variants', 'Toa matoleo ya A/B'], ['Copy upload brief', 'Nakili muhtasari wa upakiaji'], ['Copy checklist', 'Nakili orodha ya ukaguzi'], ['Copy design link', 'Nakili link ya design'], ['Save brand kit', 'Hifadhi seti ya brand'], ['Reset', 'Rudisha'],
  ['ThumbSuffix', 'Kiambishi cha jina la faili'], ['ThumbQuality', 'Ubora wa JPEG au WebP'],
  ['Thumbnail checklist', 'Orodha ya ukaguzi wa thumbnail'], ['Recent exports', 'Faili za karibuni'], ['Local history', 'Historia ya ndani'],
  ['Workflow', 'Mtiririko wa kazi'], ['How to make stronger thumbnails', 'Jinsi ya kutengeneza thumbnail bora zaidi'],
  ['Use the 16:9 YouTube canvas when preparing a custom upload. Keep the strongest face, object, or contrast shape away from the lower-right runtime corner, keep the main text short, and test the small preview before exporting. The readiness panel checks those basics while you design.', 'Tumia canvas ya YouTube ya 16:9 unapoandaa thumbnail maalumu. Weka uso, kitu au umbo lenye utofauti mbali na kona ya muda wa video iliyo chini kulia, fupisha maandishi makuu, na jaribu muonekano mdogo kabla ya kutoa faili. Paneli ya utayari hukagua mambo hayo unapobuni.'],
  ['For new videos', 'Kwa video mpya'], ['Start from the video idea, generate hook variants, pick the clearest promise, then export one main thumbnail and A/B variants for testing.', 'Anza na wazo la video, tengeneza matoleo ya hook, chagua ahadi iliyo wazi zaidi, kisha toa thumbnail kuu na matoleo ya A/B kwa majaribio.'],
  ['For recurring channels', 'Kwa channel zinazorudia'], ['Save your brand kit so colors, channel mark, logo, and layout stay consistent from episode to episode.', 'Hifadhi seti ya brand ili rangi, alama ya channel, logo na mpangilio vibaki sawa kutoka kipindi kimoja hadi kingine.'],
  ['For mobile feeds', 'Kwa feed za simu'], ['Use the safe-zone overlay, avoid tiny supporting text, and keep the headline to a few high-contrast words.', 'Tumia mwongozo wa maeneo salama, epuka maandishi madogo sana, na fupisha kichwa kwa maneno machache yenye utofauti mzuri.'],
  ['YouTube Thumbnail Studio FAQ', 'Maswali kuhusu Studio ya Thumbnail za YouTube'], ['What size does YouTube recommend?', 'YouTube inapendekeza saizi gani?'],
  ['YouTube currently recommends using a large 16:9 thumbnail, with 3840 x 2160 listed in Help as the recommended size and 640 pixels as the minimum width. The studio defaults to 3840 x 2160 and keeps 1280 x 720 as a smaller creator export.', 'Kwa sasa YouTube inapendekeza thumbnail kubwa ya 16:9; ukurasa wake wa Msaada unaorodhesha 3840 x 2160 kama saizi inayopendekezwa na pikseli 640 kama upana wa chini. Studio huanza na 3840 x 2160 na pia ina 1280 x 720 kama faili ndogo ya mtayarishi.'],
  ['Which export should I use for file size limits?', 'Nitumie format gani nikikabiliwa na kikomo cha ukubwa wa faili?'], ['Use PNG for sharp graphics when the file stays within your upload limit. Use JPEG or WebP, lower the quality slider, or switch to the 1280 x 720 compact export when you need a smaller file, especially for mobile uploads.', 'Tumia PNG kwa michoro mikali ikiwa faili halizidi kikomo cha upakiaji. Tumia JPEG au WebP, punguza kiwango cha ubora, au chagua 1280 x 720 unapohitaji faili ndogo, hasa kwa upakiaji wa simu.'],
  ['Are my images uploaded anywhere?', 'Picha zangu zinapakiwa mahali popote?'], ['No. Backgrounds, subject photos, logos, rendering, checks, and downloads run locally in your browser.', 'Hapana. Mandharinyuma, picha za wahusika, logo, uundaji, ukaguzi na upakuaji vyote vinafanyika ndani ya kivinjari chako.'],
  ['Can I create A/B test variants?', 'Ninaweza kutengeneza matoleo ya majaribio ya A/B?'], ['Yes. Use Hook ideas to create alternate headline angles, then Export A/B variants to download several versions with the same brand and layout.', 'Ndiyo. Tumia Mawazo ya hook kuunda vichwa tofauti, kisha Toa matoleo ya A/B kupakua matoleo kadhaa yenye brand na mpangilio uleule.'],
  ['Why show the runtime corner?', 'Kwa nini kuonyesha kona ya muda wa video?'], ['YouTube overlays video duration near the lower-right corner in many views. The safe-zone guide helps you keep important text and faces away from that area.', 'YouTube huonyesha muda wa video karibu na kona ya chini kulia katika mionekano mingi. Mwongozo wa maeneo salama husaidia kuweka maandishi muhimu na nyuso mbali na eneo hilo.'],
  ['Thumbnail export check', 'Ukaguzi wa utoaji wa thumbnail'], ['Check hook clarity, safe zones, and export size', 'Kagua uwazi wa hook, maeneo salama na saizi ya faili'],
  ['Design against the 16:9 canvas, preview the small-feed version, then export a primary thumbnail or A/B variants from the local renderer.', 'Buni kwenye canvas ya 16:9, kagua muonekano wa feed ndogo, kisha toa thumbnail kuu au matoleo ya A/B kutoka kwenye kitengeneza cha ndani.'],
  ['Reviewed 2026', 'Imekaguliwa 2026'], ['Creator planning workflow. Verify platform guidance before upload if requirements change.', 'Mtiririko wa kupanga kwa mtayarishi. Thibitisha mwongozo wa jukwaa kabla ya kupakia ikiwa mahitaji yamebadilika.'],
  ['What to check', 'Mambo ya kukagua'], ['Methodology: headline, template, brand kit, uploaded images, and safe-zone controls render to a local 16:9 canvas.', 'Mbinu: kichwa, kiolezo, seti ya brand, picha zilizochaguliwa na vidhibiti vya maeneo salama hutengenezwa kwenye canvas ya ndani ya 16:9.'],
  ['Check the lower-right runtime corner, mobile readability, face or product focus, contrast, channel consistency, and file-size target.', 'Kagua kona ya muda wa video iliyo chini kulia, usomaji wa simu, umakini wa uso au bidhaa, utofauti, uthabiti wa channel na lengo la ukubwa wa faili.'],
  ['Use hook variants and the upload brief to compare multiple exports without losing your local brand kit.', 'Tumia matoleo ya hook na muhtasari wa upakiaji kulinganisha faili nyingi bila kupoteza seti ya brand ya ndani.'],
  ['Limitations', 'Mipaka'], ['Not an official YouTube tool, copyright checker, monetization review, or guaranteed click-through predictor.', 'Si zana rasmi ya YouTube, kikagua hakimiliki, ukaguzi wa mapato wala utabiri wa uhakika wa mibofyo.'],
  ['Confirm image rights, platform policies, and channel brand rules before publishing.', 'Thibitisha haki za picha, sera za jukwaa na kanuni za brand ya channel kabla ya kuchapisha.'],
  ['Privacy note: uploaded photos and logos are processed in the browser; no thumbnail source files are uploaded to AfroTools.', 'Faragha: picha na logo ulizochagua huchakatwa kwenye kivinjari; hakuna faili chanzo la thumbnail linalopakiwa AfroTools.'],
  ['Review download controls', 'Kagua vidhibiti vya upakuaji'], ['Source/freshness note: YouTube UI overlays, Help guidance, policy rules, and upload limits can change; confirm current platform guidance before publishing.', 'Chanzo na upya: vifuniko vya UI ya YouTube, mwongozo wa Msaada, sera na vikomo vya upakiaji vinaweza kubadilika; thibitisha mwongozo wa sasa wa jukwaa kabla ya kuchapisha.']
]);

const schemas = [
  {
    '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Studio ya Thumbnail za YouTube',
    description: 'Tengeneza thumbnail za YouTube ndani ya kivinjari kwa 3840x2160 au 1280x720, violezo, picha, seti za brand, maeneo salama, matoleo ya hook, ukaguzi na upakuaji wa PNG, JPEG au WebP.',
    url: 'https://afrotools.com/sw/zana/kitengeneza-thumbnail/', inLanguage: 'sw', applicationCategory: 'MultimediaApplication', operatingSystem: 'Web',
    browserRequirements: 'Inahitaji JavaScript, Canvas na uwezo wa kivinjari kufungua picha', image: 'https://afrotools.com/assets/img/tools/thumbnail-maker.webp',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, author: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' }
  },
  {
    '@context': 'https://schema.org', '@type': 'WebPage', name: 'Studio ya Thumbnail za YouTube', url: 'https://afrotools.com/sw/zana/kitengeneza-thumbnail/',
    description: 'Tengeneza thumbnail za YouTube zilizo tayari kupakiwa kwa violezo, saizi salama, mipangilio ya brand, matoleo ya hook na upakuaji wa ndani.', inLanguage: 'sw',
    isPartOf: { '@type': 'WebSite', name: 'AfroTools', url: 'https://afrotools.com/' }, image: 'https://afrotools.com/assets/img/tools/thumbnail-maker.webp'
  },
  {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'AfroTools', item: 'https://afrotools.com/sw/' },
      { '@type': 'ListItem', position: 2, name: 'Zana', item: 'https://afrotools.com/sw/zana-zote/' },
      { '@type': 'ListItem', position: 3, name: 'Studio ya Thumbnail za YouTube', item: 'https://afrotools.com/sw/zana/kitengeneza-thumbnail/' }
    ]
  },
  {
    '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [
      { '@type': 'Question', name: 'YouTube inapendekeza saizi gani?', acceptedAnswer: { '@type': 'Answer', text: 'Kwa sasa YouTube inapendekeza thumbnail kubwa ya 16:9; ukurasa wake wa Msaada unaorodhesha 3840 x 2160 kama saizi inayopendekezwa na pikseli 640 kama upana wa chini. Studio huanza na 3840 x 2160 na pia ina 1280 x 720 kama faili ndogo ya mtayarishi.' } },
      { '@type': 'Question', name: 'Nitumie format gani nikikabiliwa na kikomo cha ukubwa wa faili?', acceptedAnswer: { '@type': 'Answer', text: 'Tumia PNG kwa michoro mikali ikiwa faili halizidi kikomo cha upakiaji. Tumia JPEG au WebP, punguza kiwango cha ubora, au chagua 1280 x 720 unapohitaji faili ndogo, hasa kwa upakiaji wa simu.' } },
      { '@type': 'Question', name: 'Picha zangu zinapakiwa mahali popote?', acceptedAnswer: { '@type': 'Answer', text: 'Hapana. Mandharinyuma, picha za wahusika, logo, uundaji, ukaguzi na upakuaji vyote vinafanyika ndani ya kivinjari chako.' } },
      { '@type': 'Question', name: 'Ninaweza kutengeneza matoleo ya majaribio ya A/B?', acceptedAnswer: { '@type': 'Answer', text: 'Ndiyo. Tumia Mawazo ya hook kuunda vichwa tofauti, kisha Toa matoleo ya A/B kupakua matoleo kadhaa yenye brand na mpangilio uleule.' } },
      { '@type': 'Question', name: 'Kwa nini kuonyesha kona ya muda wa video?', acceptedAnswer: { '@type': 'Answer', text: 'YouTube huonyesha muda wa video karibu na kona ya chini kulia katika mionekano mingi. Mwongozo wa maeneo salama husaidia kuweka maandishi muhimu na nyuso mbali na eneo hilo.' } }
    ]
  }
];

function replaceMeta(html, selector, value) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`(<meta\\s+${escaped}\\s+content=")[^"]*(")`, 'i'), `$1${value}$2`);
}

function build() {
  let html = fs.readFileSync(englishPath, 'utf8');
  html = html.replace('lang="en"', 'lang="sw"');
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>Kitengeneza Thumbnail za YouTube: Michoro ya 16:9 | AfroTools</title>');
  html = replaceMeta(html, 'name="description"', 'Tengeneza thumbnail za YouTube ndani ya kivinjari kwa 3840x2160 au 1280x720. Tumia violezo, maeneo salama, matoleo ya hook na utoaji wa PNG, JPEG au WebP.');
  html = replaceMeta(html, 'name="keywords"', 'kitengeneza thumbnail za YouTube, thumbnail 3840x2160, thumbnail 1280x720, studio ya watayarishi, AfroTools');
  html = replaceMeta(html, 'property="og:title"', 'Studio ya Thumbnail za YouTube | AfroTools');
  html = replaceMeta(html, 'property="og:description"', 'Buni thumbnail za YouTube zenye saizi kamili kwa canvas ya ndani, violezo, maeneo salama, ukaguzi wa hook na faili tayari kupakiwa.');
  html = replaceMeta(html, 'property="og:url"', 'https://afrotools.com/sw/zana/kitengeneza-thumbnail/');
  html = replaceMeta(html, 'property="og:locale"', 'sw_TZ');
  html = replaceMeta(html, 'name="twitter:title"', 'Studio ya Thumbnail za YouTube | AfroTools');
  html = replaceMeta(html, 'name="twitter:description"', 'Tengeneza thumbnail za YouTube kwa seti ya brand, ukaguzi wa upakiaji, matoleo ya hook na faili za 16:9.');
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
  html = html.replace(/<link rel="canonical"[^>]*>\s*<link rel="alternate" hreflang="en"[^>]*>\s*<link rel="alternate" hreflang="fr"[^>]*>\s*(?:<link rel="alternate" hreflang="sw"[^>]*>\s*)?<link rel="alternate" hreflang="x-default"[^>]*>/,
    '<link rel="canonical" href="https://afrotools.com/sw/zana/kitengeneza-thumbnail/">\n<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/thumbnail-maker/">\n<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/createur-miniatures/">\n<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/kitengeneza-thumbnail/">\n<link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/thumbnail-maker/">');

  html = html.replace(/>[^<]+</g, segment => {
    let localized = segment;
    for (const [from, to] of [...translations].sort((a, b) => b[0].length - a[0].length)) localized = localized.split(from).join(to);
    return localized;
  });
  for (const [from, to] of translations) {
    html = html.replaceAll(`aria-label="${from}"`, `aria-label="${to}"`);
    html = html.replaceAll(`placeholder="${from}"`, `placeholder="${to}"`);
  }
  html = html.replace('<main class="thumb-studio" id="main-content">', '<!-- Source owner: scripts/build-sw-thumbnail-maker.js; engine: assets/js/lib/thumbnail-maker-studio.js -->\n<main class="thumb-studio" id="main-content">');
  html = html.replace(/<afro-related-tools category="image-design" current="thumbnail-maker"[\s\S]*?<\/afro-related-tools>/,
    '<afro-related-tools category="image-design" current="thumbnail-maker" data-ssr="1">\n<!-- RELATED_TOOLS_SSR_START -->\n<nav class="seo-links related-tools-ssr" data-related-tools-ssr aria-label="Zana zinazohusiana">\n<h2 class="seo-links-title">Zana zinazohusiana</h2>\n<ul class="seo-links-list"><li><a href="/sw/zana/kubana-picha/">Bana picha</a></li><li><a href="/sw/zana/kubadilisha-ukubwa-wa-picha/">Badilisha ukubwa wa picha</a></li><li><a href="/sw/zana/kukata-picha/">Kata picha</a></li><li><a href="/sw/zana/picha-ya-pasipoti/">Picha ya pasipoti</a></li><li><a href="/sw/zana/kadi-ya-mitandao/">Kadi ya mitandao</a></li><li><a href="/sw/zana/kitengeneza-qr/">Kitengeneza QR</a></li></ul>\n</nav>\n<!-- RELATED_TOOLS_SSR_END -->\n</afro-related-tools>');
  html = html.replaceAll('tool-name="YouTube Thumbnail Studio"', 'tool-name="Studio ya Thumbnail za YouTube"');
  html = html.replace('save-note="Design locally, check mobile readability and asset rights, then download PNG, JPEG, WebP, or A/B variant exports."', 'save-note="Buni ndani ya kivinjari, kagua usomaji wa simu na haki za picha, kisha pakua PNG, JPEG, WebP au matoleo ya A/B."');
  html = html.replace('<script src="/assets/js/lib/thumbnail-maker-studio.js?v=6f0b6a39" defer></script>', '<script src="/assets/js/lib/thumbnail-maker-studio.js?v=6f0b6a39" defer></script>\n<script src="/assets/js/lib/thumbnail-maker-studio-sw.js" defer></script>');
  html = html.replace('<link rel="stylesheet" href="/assets/css/top-level-page-ui-refresh.css?v=9ab47fa3">', '<link rel="stylesheet" href="/assets/css/top-level-page-ui-refresh.css?v=9ab47fa3">\n<link rel="stylesheet" href="/assets/css/sw-zana-mobile.css?v=adecdf8a">');
  html = html.replace('</head>', `${schemas.map(value => `<script type="application/ld+json">${JSON.stringify(value)}</script>`).join('\n')}\n</head>`);
  html = html.replace('</body>', '<script src="/assets/js/lib/sw-accessibility.js?v=c732ef57" defer></script>\n</body>');
  return html;
}

const output = build();
if (process.argv.includes('--check')) {
  if (!fs.existsSync(swahiliPath) || fs.readFileSync(swahiliPath, 'utf8') !== output) {
    console.error('Swahili thumbnail-maker route is stale. Run node scripts/build-sw-thumbnail-maker.js.');
    process.exit(1);
  }
  console.log('Swahili thumbnail-maker route matches the English studio DOM contract.');
} else {
  fs.mkdirSync(path.dirname(swahiliPath), { recursive: true });
  fs.writeFileSync(swahiliPath, output);
  console.log('Built native Swahili thumbnail-maker studio from the English DOM contract.');
}
