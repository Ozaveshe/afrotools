#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { normalizeReleaseOwnedHtml } = require('./lib/release-owned-html-normalizer');
const ROOT = path.resolve(__dirname, '..');
const sourcePath = path.join(ROOT, 'tools/logo-maker/index.html');
const outputPath = path.join(ROOT, 'sw/zana/kitengeneza-logo/index.html');

const copy = new Map([
  ['Logo Maker for African Brands', 'Kitengeneza Logo kwa Brand za Kiafrika'],
  ['Create text-based logos with custom fonts, icons, colors, and layouts. Download as SVG and PNG instantly.', 'Tengeneza logo ya maandishi kwa fonti, alama, rangi na mpangilio unaochagua. Pakua SVG na PNG papo hapo.'],
  ['6 Fonts', 'Fonti 6'], ['Icons', 'Alama'], ['SVG & PNG', 'SVG na PNG'],
  ['Need a full brand system, not just a quick logo?', 'Unahitaji mfumo kamili wa brand, si logo ya haraka tu?'],
  ['Use this page for fast logo drafts and exports. For reusable colors, fonts, brand rules, and a saved identity kit, switch to CreatorBrand.', 'Tumia ukurasa huu kuandaa rasimu na faili za logo haraka. Kwa rangi, fonti, kanuni za brand na kitambulisho kinachoweza kuhifadhiwa, tumia CreatorBrand.'],
  ['Open CreatorBrand', 'Fungua CreatorBrand'], ['Logo Settings', 'Mipangilio ya logo'],
  ['African Starter Kits', 'Violezo vya kuanzia vya Kiafrika'], ['Fashion', 'Mitindo'], ['Food', 'Chakula'], ['Agri', 'Kilimo'], ['Education', 'Elimu'], ['Logistics', 'Usafirishaji'],
  ['Logo Text', 'Maandishi ya logo'], ['Your Business', 'Biashara yako'], ['Font', 'Fonti'], ['Text Color', 'Rangi ya maandishi'], ['Background Color', 'Rangi ya mandharinyuma'], ['Layout', 'Mpangilio'], ['Text Only', 'Maandishi pekee'], ['Icon + Text (Left)', 'Alama na maandishi kushoto'], ['Icon + Text (Top)', 'Alama juu ya maandishi'], ['Icon', 'Alama'], ['No icon', 'Bila alama'], ['Creative', 'Ubunifu'], ['Agri / Nature', 'Kilimo / Mazingira'], ['Modern mark', 'Alama ya kisasa'], ['Core mark', 'Alama kuu'], ['Movement', 'Mwendo'],
  ['Preview', 'Muonekano'], ['Tips', 'Vidokezo'], ['Real-time preview', 'Muonekano wa papo hapo'], ['Custom fonts', 'Fonti unazochagua'], ['Download SVG/PNG', 'Pakua SVG/PNG'], ['Professional quality', 'Ubora wa kutumia kama rasimu'],
  ['Related tools', 'Zana zinazohusiana']
]);

function meta(html, selector, value) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`(<meta\\s+${escaped}\\s+content=")[^"]*(")`, 'i'), `$1${value}$2`);
}
function build() {
  let html = fs.readFileSync(sourcePath, 'utf8');
  html = html.replace('lang="en"', 'lang="sw"');
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>Kitengeneza Logo kwa Brand za Kiafrika | AfroTools</title>');
  html = meta(html, 'name="description"', 'Tengeneza logo kwa violezo sita, fonti sita, alama, rangi na mipangilio mitatu. Kagua na upakue SVG au PNG ndani ya kivinjari.');
  html = meta(html, 'property="og:title"', 'Kitengeneza Logo | AfroTools');
  html = meta(html, 'property="og:description"', 'Tengeneza logo ya maandishi na upakue SVG au PNG ndani ya kivinjari.');
  html = meta(html, 'property="og:url"', 'https://afrotools.com/sw/zana/kitengeneza-logo/');
  html = meta(html, 'name="twitter:title"', 'Kitengeneza Logo | AfroTools');
  html = meta(html, 'name="twitter:description"', 'Tengeneza logo kwa fonti, alama, rangi na mpangilio unaochagua.');
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
  html = html.replace(/<link rel="canonical"[^>]*>[\s\S]*?<link rel="alternate" hreflang="x-default"[^>]*>/,
    '<link rel="canonical" href="https://afrotools.com/sw/zana/kitengeneza-logo/">\n<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/logo-maker/">\n<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/createur-logo/">\n<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/kitengeneza-logo/">\n<link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/logo-maker/">');
  html = html.replace(/>[^<]+</g, segment => {
    const raw = segment.slice(1, -1); const key = raw.replace(/\s+/g, ' ').trim();
    return copy.has(key) ? `>${raw.replace(key, copy.get(key))}<` : segment;
  });
  html = html.replace('<h1>Logo <em>Maker</em> for African Brands</h1>', '<h1>Kitengeneza <em>Logo</em> kwa Brand za Kiafrika</h1>');
  for (const [from, to] of [
    ['Skip to tool', 'Ruka hadi kwenye zana'], ['AFROTOOLS / TOOLS', 'AFROTOOLS / ZANA'],
    ['Energy / Fintech', 'Nishati / Fintech'], ['Real-time preview', 'Muonekano wa papo hapo'],
    ['Custom fonts', 'Fonti unazochagua'], ['Download SVG/PNG', 'Pakua SVG/PNG'],
    ['Professional quality', 'Ubora wa kutumia kama rasimu']
  ]) html = html.replaceAll(from, to);
  html = html.replace(/<div class="result-actions"[\s\S]*?<\/div>\s*<\/div>/, '</div>');
  for (const [from, to] of copy) html = html.replaceAll(`aria-label="${from}"`, `aria-label="${to}"`);
  html = html.replace('<div class="tool-main" id="main-content" role="main">', '<!-- Source owner: scripts/build-sw-logo-maker.js; exact deterministic logo runtime copied from tools/logo-maker/index.html -->\n<div class="tool-main" id="main-content" role="main">');
  html = html.replace('<share-result-button\n    tool-name="Logo Maker"', '<share-result-button\n    tool-name="Kitengeneza Logo"');
  html = html.replace(/<afro-related-tools category="image-design" current="logo-maker"[\s\S]*?<\/afro-related-tools>/, '<afro-related-tools category="image-design" current="logo-maker" data-ssr="1"><nav class="seo-links related-tools-ssr" aria-label="Zana zinazohusiana"><h2 class="seo-links-title">Zana zinazohusiana</h2><ul class="seo-links-list"><li><a href="/sw/zana/kizalishaji-favicon/">Tengeneza favicon</a></li><li><a href="/sw/zana/kadi-ya-mitandao/">Tengeneza kadi ya mitandao</a></li><li><a href="/sw/zana/kitengeneza-thumbnail/">Tengeneza thumbnail</a></li><li><a href="/sw/zana/paleti-ya-rangi/">Chagua paleti ya rangi</a></li></ul></nav></afro-related-tools>');
  html = html.replace(/<section style="max-width:900px;[\s\S]*?<afro-footer><\/afro-footer>/, `<section class="sw-logo-guide" style="max-width:900px;margin:32px auto;padding:0 20px 40px;line-height:1.7">
  <h2>Jinsi ya kuandaa rasimu ya logo</h2>
  <p>Chagua kiolezo, andika jina la brand, kisha jaribu fonti, alama, rangi na mpangilio. Muonekano hubadilika papo hapo. Pakua SVG kwa kazi inayohitaji kubadilishwa ukubwa, au PNG ya pikseli 400 kwa 300 kwa matumizi ya haraka mtandaoni.</p>
  <h3>Kagua kabla ya kutumia</h3>
  <ul><li>Hakikisha jina na alama havikiuki trademark au haki za mtu mwingine.</li><li>Kagua usomaji kwenye avatar, invoice, favicon na bango.</li><li>Hii ni zana ya rasimu, si ukaguzi wa trademark, leseni au mkakati wa brand.</li><li>Maandishi na faili za logo hubaki ndani ya kivinjari.</li></ul>
  <details><summary>Ni faili gani ninazoweza kupakua?</summary><p>SVG inayoweza kubadilishwa ukubwa bila kupoteza ubora na PNG ya pikseli 400 kwa 300.</p></details>
  <details><summary>Je, ninaweza kutumia logo kibiashara?</summary><p>Unaweza kutumia faili unazotengeneza, lakini lazima uhakiki trademark, haki za alama na kanuni za soko kabla ya matumizi ya kibiashara.</p></details>
</section>
<afro-footer></afro-footer>`);
  const dark = `<style data-sw-logo-theme>
html[data-theme="dark"] .card,html[data-theme="dark"] .preview-card{background:#111827;border-color:#334155}html[data-theme="dark"] .card-head{background:#172033;border-color:#334155}html[data-theme="dark"] .card-title,html[data-theme="dark"] .f-label-text,html[data-theme="dark"] .sw-logo-guide h2,html[data-theme="dark"] .sw-logo-guide h3,html[data-theme="dark"] .sw-logo-guide summary{color:#f8fafc}html[data-theme="dark"] .f-input{background:#0f172a;color:#f8fafc;border-color:#475569}html[data-theme="dark"] .color-label,html[data-theme="dark"] .sw-logo-guide,html[data-theme="dark"] .sw-logo-guide p,html[data-theme="dark"] .sw-logo-guide li{color:#cbd5e1}@media(max-width:420px){.tool-hero-inner,.upgrade-note,.tool-main-inner{padding-left:14px;padding-right:14px}.card-body{padding:16px}.action-row .act-btn{min-width:0;flex:1}}
</style>`;
  html = html.replace('</head>', `${dark}\n<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Kitengeneza Logo', description: 'Tengeneza logo ya maandishi kwa fonti, alama, rangi na mipangilio, kisha upakue SVG au PNG ndani ya kivinjari.', url: 'https://afrotools.com/sw/zana/kitengeneza-logo/', inLanguage: 'sw', applicationCategory: 'DesignApplication', operatingSystem: 'Web', browserRequirements: 'JavaScript, SVG na Canvas', image: 'https://afrotools.com/assets/img/tools/logo-maker.webp', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, author: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' } })}</script>\n</head>`);
  html = html.replace('<script src="/assets/js/lib/image-design-workflow.js', '<script src="/assets/js/lib/logo-maker-sw.js" defer></script>\n<script src="/assets/js/lib/image-design-workflow.js');
  return html;
}
const output = build();
if (process.argv.includes('--check')) {
  if (!fs.existsSync(outputPath) || normalizeReleaseOwnedHtml(fs.readFileSync(outputPath, 'utf8')) !== normalizeReleaseOwnedHtml(output)) { console.error('Swahili logo route is stale.'); process.exit(1); }
  console.log('Swahili logo route matches the deterministic English SVG/PNG contract.');
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true }); fs.writeFileSync(outputPath, output); console.log('Built native Swahili logo maker.');
}
