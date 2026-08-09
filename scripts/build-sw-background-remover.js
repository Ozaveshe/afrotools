#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENGLISH = path.join(ROOT, 'tools/background-remover/index.html');
const SWAHILI = path.join(ROOT, 'sw/zana/kiondoa-mandharinyuma/index.html');
const CHECK = process.argv.includes('--check');

const source = fs.readFileSync(ENGLISH, 'utf8');
const match = source.match(/<main class="br-studio" id="main-content">[\s\S]*?<\/main>/);
if (!match) throw new Error('English Background Remover workspace contract was not found.');

const translations = new Map([
  ['Background remover editor', 'Kihariri cha kuondoa mandharinyuma'],
  ['Background remover status and history', 'Hali na historia ya kuondoa mandharinyuma'],
  ['1. Source', '1. Picha chanzo'],
  ['Load one image or a small session queue', 'Pakia picha moja au foleni ndogo ya kipindi hiki'],
  ['Use clear edges for best results. Multiple files stay in the browser session so you can apply the same cleanup recipe one by one.', 'Picha yenye kingo zilizo wazi hutoa matokeo bora. Faili nyingi hubaki katika kipindi hiki cha kivinjari ili utumie mpangilio uleule moja baada ya nyingine.'],
  ['Loading editor...', 'Kihariri kinapakiwa...'],
  ['Choose, paste, or drop images for background removal', 'Chagua, bandika au dondosha picha za kuondolewa mandharinyuma'],
  ['Choose images', 'Chagua picha'],
  ['Drag files here, paste from clipboard, or click to browse.', 'Buruta faili hapa, bandika kutoka clipboard, au bofya uchague.'],
  ['Local only', 'Ndani ya kifaa tu'],
  ['BrInput', 'Faili za picha'],
  ['Current image queue', 'Foleni ya picha ya sasa'],
  ['2. Cutout recipe', '2. Mpangilio wa kukata picha'],
  ['Pick the workflow that matches the photo', 'Chagua njia inayolingana na picha'],
  ['Person photos can use the optional in-browser model. Products, logos, signatures, and flat-lay shots usually work better with edge cleanup or color keying.', 'Picha za watu zinaweza kutumia modeli ya hiari ndani ya kivinjari. Bidhaa, nembo, saini na picha za juu mara nyingi hufaa kusafishwa kingo au kuondolewa rangi maalum.'],
  ['Cutout presets', 'Mipangilio ya kukata picha'],
  ['Product', 'Bidhaa'],
  ['Portrait', 'Picha ya mtu'],
  ['Signature', 'Saini'],
  ['Creator asset', 'Nyenzo ya mtayarishi'],
  ['Removal method', 'Njia ya kuondoa'],
  ['Smart edge cleanup', 'Usafishaji mahiri wa kingo'],
  ['Color key cleanup', 'Usafishaji kwa rangi maalum'],
  ['AI person cutout', 'Kukata picha ya mtu kwa AI'],
  ['AI mode downloads a browser model only when selected. Photos are not uploaded.', 'Hali ya AI hupakua modeli ya kivinjari tu inapochaguliwa. Picha hazipakwi kwenye seva.'],
  ['Background sample', 'Sampuli ya mandharinyuma'],
  ['BrSampleColor', 'Rangi ya sampuli ya mandharinyuma'],
  ['Pick from image', 'Chagua kwenye picha'],
  ['Tolerance', 'Uvumilivu wa rangi'],
  ['BrTolerance', 'Uvumilivu wa rangi'],
  ['Edge feather', 'Ulainishaji wa kingo'],
  ['BrFeather', 'Ulainishaji wa kingo'],
  ['Remove background', 'Ondoa mandharinyuma'],
  ['Process queue', 'Chakata foleni'],
  ['Reset mask', 'Rudisha maski'],
  ['Undo refine', 'Tengua uhariri'],
  ['3. Refine', '3. Safisha kingo'],
  ['Erase missed background or restore subject edges', 'Futa mandharinyuma yaliyobaki au rudisha kingo za mhusika'],
  ['Brush edits update the mask immediately. Use restore when hair, fabric, product corners, or signature strokes are removed by mistake.', 'Brashi husasisha maski mara moja. Tumia rudisha ikiwa nywele, kitambaa, pembe za bidhaa au mistari ya saini imefutwa kimakosa.'],
  ['Brush mode', 'Hali ya brashi'],
  ['Erase', 'Futa'],
  ['Restore', 'Rudisha'],
  ['Brush', 'Brashi'],
  ['BrBrushSize', 'Ukubwa wa brashi'],
  ['Original', 'Picha asili'],
  ['No image', 'Hakuna picha'],
  ['Upload an image to preview the source.', 'Pakia picha ili kuona picha chanzo.'],
  ['Cutout preview', 'Muonekano wa picha iliyokatwa'],
  ['Ready', 'Tayari'],
  ['Run a cutout recipe, then refine the mask here.', 'Endesha mpangilio wa kukata, kisha safisha maski hapa.'],
  ['4. Export', '4. Toa faili'],
  ['Choose background, crop, format, and file name', 'Chagua mandharinyuma, upunguzaji, format na jina la faili'],
  ['Transparent PNG and WebP keep alpha. JPG uses the selected solid background so the export does not flatten to black.', 'PNG na WebP zenye uwazi huhifadhi alpha. JPG hutumia mandharinyuma yaliyochaguliwa ili faili isigeuke nyeusi.'],
  ['Background', 'Mandharinyuma'],
  ['Transparent', 'Wazi'],
  ['White', 'Nyeupe'],
  ['Charcoal', 'Mkaa'],
  ['Brand blue', 'Bluu ya chapa'],
  ['Soft grey', 'Kijivu chepesi'],
  ['Custom color', 'Rangi maalum'],
  ['BrCustomBackground', 'Rangi maalum ya mandharinyuma'],
  ['Format', 'Format'],
  ['Quality', 'Ubora'],
  ['BrQuality', 'Ubora wa faili'],
  ['Max width', 'Upana wa juu'],
  ['BrMaxWidth', 'Upana wa juu'],
  ['Use 0 to keep the working size.', 'Tumia 0 kuhifadhi saizi ya kazi.'],
  ['File suffix', 'Kiambishi cha jina la faili'],
  ['BrSuffix', 'Kiambishi cha jina la faili'],
  ['BrCropSubject', 'Punguza kufuata mhusika anayeonekana'],
  ['Crop to visible subject', 'Punguza kufuata mhusika anayeonekana'],
  ['Crop padding', 'Nafasi ya pembeni'],
  ['BrPadding', 'Nafasi ya pembeni'],
  ['Render export', 'Andaa faili'],
  ['Download', 'Pakua'],
  ['Copy handoff brief', 'Nakili muhtasari wa kazi'],
  ['Background Remover Studio', 'Studio ya Kuondoa Mandharinyuma'],
  ['Output', 'Matokeo'],
  ['Cutout summary', 'Muhtasari wa picha iliyokatwa'],
  ['Saved locally for the next session.', 'Mipangilio huhifadhiwa ndani ya kifaa kwa kipindi kijacho.'],
  ['Source', 'Chanzo'],
  ['Mask removed', 'Sehemu iliyoondolewa'],
  ['Export', 'Faili'],
  ['Recipe', 'Mpangilio'],
  ['Checklist', 'Orodha ya ukaguzi'],
  ['Before download', 'Kabla ya kupakua'],
  ['Edges look clean at 100 percent.', 'Kingo zinaonekana safi kwa ukubwa wa asilimia 100.'],
  ['Background matches the destination.', 'Mandharinyuma yanafaa mahali faili itakapotumika.'],
  ['Format supports the needed transparency.', 'Format inahifadhi uwazi unaohitajika.'],
  ['Recent', 'Za karibuni'],
  ['Session history', 'Historia ya kipindi'],
  ['Good fit', 'Zana zinazofaa'],
  ['Move between image tools', 'Endelea na zana nyingine za picha'],
  ['Passport photo studio', 'Studio ya picha ya pasipoti'],
  ['Crop and rotate', 'Punguza na zungusha'],
  ['Resize exports', 'Badilisha saizi ya faili'],
  ['Convert formats', 'Badilisha format']
]);

function localizeWorkspace(html) {
  const protectedAttributes = [];
  let output = html.replace(/\b(?:id|for|aria-controls|aria-describedby|aria-labelledby)="[^"]*"/g, value => {
    const token = `__BR_ATTRIBUTE_${protectedAttributes.length}__`;
    protectedAttributes.push(value);
    return token;
  });
  for (const [from, to] of [...translations].sort((a, b) => b[0].length - a[0].length)) {
    output = output.split(from).join(to);
  }
  protectedAttributes.forEach((value, index) => {
    output = output.replace(`__BR_ATTRIBUTE_${index}__`, value);
  });
  output = output.replace('value="cutout"', 'value="picha"');
  output = output.replace('tool-slug="background-remover"', 'tool-slug="background-remover" lang="sw"');
  return `<!-- Source owner: scripts/build-sw-background-remover.js; shared runtime: assets/js/lib/background-remover-studio.js -->\n${output}`;
}

const workspace = localizeWorkspace(match[0]);
const page = `<!doctype html>
<!-- Generated by scripts/build-sw-background-remover.js. Edit the generator, not this output. -->
<html lang="sw">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="content-language" content="sw">
  <meta name="afrotools-source-owner" content="scripts/build-sw-background-remover.js">
  <meta name="afrotools-content-id" content="sw-image-design:background-remover">
  <title>Ondoa mandharinyuma ya picha mtandaoni | AfroTools</title>
  <meta name="description" content="Ondoa au badilisha mandharinyuma ya picha ndani ya kivinjari, safisha kingo kwa brashi, na pakua PNG, WebP au JPG bila kupakia picha kwenye seva.">
  <meta name="robots" content="index,follow">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="sw_TZ">
  <meta property="og:site_name" content="AfroTools">
  <meta property="og:title" content="Studio ya Kuondoa Mandharinyuma | AfroTools">
  <meta property="og:description" content="Kata picha, safisha kingo na toa faili yenye uwazi au mandharinyuma mapya ndani ya kivinjari.">
  <meta property="og:url" content="https://afrotools.com/sw/zana/kiondoa-mandharinyuma/">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/background-remover.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Studio ya Kuondoa Mandharinyuma | AfroTools">
  <meta name="twitter:description" content="Ondoa mandharinyuma, safisha maski na pakua PNG, WebP au JPG ndani ya kivinjari.">
  <meta name="twitter:image" content="https://afrotools.com/assets/img/tools/background-remover.webp">
  <link rel="canonical" href="https://afrotools.com/sw/zana/kiondoa-mandharinyuma/">
  <link rel="alternate" hreflang="en" href="https://afrotools.com/tools/background-remover/">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/supprimer-arriere-plan/">
  <link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/kiondoa-mandharinyuma/">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/background-remover/">
  <link rel="stylesheet" href="/assets/css/tokens.min.css">
  <link rel="stylesheet" href="/assets/css/global.min.css">
  <link rel="stylesheet" href="/assets/css/design-system.min.css">
  <link rel="stylesheet" href="/assets/css/image-design-workflow.css">
  <link rel="stylesheet" href="/assets/css/background-remover-studio.css">
  <style>
    @media (max-width:740px){.br-hero-inner{grid-template-columns:minmax(0,1fr)}.br-hero-inner>div{min-width:0}.br-hero h1,.br-eyebrow{overflow-wrap:anywhere}}
  </style>
  <script src="/assets/js/components/navbar.min.js" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
  <script src="/assets/js/bundles/core.b707407f.min.js" defer></script>
  <script src="/assets/js/components/share-button.js" defer></script>
  <script src="/assets/js/lib/background-remover-studio-sw.js" defer></script>
  <script src="/assets/js/lib/background-remover-studio.js" defer></script>
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Studio ya Kuondoa Mandharinyuma',
    description: 'Ondoa na badilisha mandharinyuma ya picha ndani ya kivinjari kwa usafishaji wa kingo, brashi na faili za PNG, WebP au JPG.',
    url: 'https://afrotools.com/sw/zana/kiondoa-mandharinyuma/', inLanguage: 'sw', applicationCategory: 'DesignApplication',
    operatingSystem: 'Web', image: 'https://afrotools.com/assets/img/tools/background-remover.webp',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  })}</script>
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'AfroTools Kiswahili', item: 'https://afrotools.com/sw/' },
      { '@type': 'ListItem', position: 2, name: 'Picha na design', item: 'https://afrotools.com/sw/picha-na-design/' },
      { '@type': 'ListItem', position: 3, name: 'Ondoa mandharinyuma', item: 'https://afrotools.com/sw/zana/kiondoa-mandharinyuma/' }
    ]
  })}</script>
</head>
<body>
  <afro-navbar active="tools"></afro-navbar>
  <section class="br-hero"><div class="br-hero-inner">
    <div><p class="br-eyebrow">Picha na design / Studio ya kuondoa mandharinyuma</p><h1>Ondoa mandharinyuma, safisha kingo na utoe faili tayari kutumika.</h1><p>Anza na usafishaji mahiri wa kingo, rangi maalum au modeli ya hiari ya mtu. Malizia kwa brashi ya kufuta au kurudisha, kisha toa picha yenye uwazi au rangi mpya. Picha chanzo hubaki kwenye kifaa hiki.</p></div>
    <div class="br-badges" aria-label="Sifa kuu"><span class="br-badge">Bila kupakia picha</span><span class="br-badge">Brashi ya kusafisha</span><span class="br-badge">PNG, WebP na JPG</span></div>
  </div></section>
  ${workspace}
  <section class="br-seo" aria-label="Mwongozo wa kuondoa mandharinyuma">
    <h2>Kagua kingo kabla ya kutumia picha</h2>
    <p>Usafishaji wa kiotomatiki unaweza kukosea nywele, glasi, vivuli, bidhaa nyeupe au saini nyembamba. Kagua picha kwa ukubwa wa asilimia 100, tumia brashi ya kufuta au kurudisha, na uthibitishe masharti ya picha ya soko, chapa, wasifu au hati kabla ya kuchapisha.</p>
    <div class="br-faq">
      <details><summary>Je, picha inapakiwa kwenye AfroTools?</summary><p>Hapana. Picha huchakatwa kwenye canvas ya kivinjari. Hali ya mtu kwa AI inaweza kupakua faili za modeli, lakini haitumi picha yako kwenye AfroTools.</p></details>
      <details><summary>Nitumie njia ipi?</summary><p>Tumia kingo mahiri kwa bidhaa kwenye mandharinyuma rahisi, rangi maalum kwa nembo au saini, na hali ya mtu kwa picha ya mtu. Kisha safisha makosa kwa brashi.</p></details>
      <details><summary>Ni format ipi huhifadhi uwazi?</summary><p>PNG na WebP zinaweza kuhifadhi uwazi. JPG haina alpha, hivyo itatumia rangi ya mandharinyuma uliyochagua.</p></details>
      <details><summary>Je, foleni huhifadhi picha?</summary><p>Hapana. Picha za foleni hupotea ukifunga ukurasa. Mipangilio na historia nyepesi ya faili huhifadhiwa ndani ya kifaa bila kuhifadhi picha.</p></details>
    </div>
  </section>
  <afro-footer></afro-footer>
  <script src="/assets/js/lib/sw-accessibility.js" defer></script>
  <script src="/assets/js/lazy-analytics.js" defer></script>
</body>
</html>\n`;

if (CHECK) {
  const current = fs.existsSync(SWAHILI) ? fs.readFileSync(SWAHILI, 'utf8') : '';
  if (current !== page) {
    console.error('Swahili Background Remover output is stale.');
    process.exitCode = 1;
  } else console.log('Swahili Background Remover output is current.');
} else {
  fs.mkdirSync(path.dirname(SWAHILI), { recursive: true });
  fs.writeFileSync(SWAHILI, page);
  console.log('Built native Swahili Background Remover from the English workspace contract.');
}
