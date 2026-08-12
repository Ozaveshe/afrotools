#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { localizedGeneratorEquivalent } = require('./lib/localized-generator-equivalence');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');

function esc(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function alternates(english, french, swahili, hausa) {
  return `<link rel="alternate" hreflang="en" href="https://afrotools.com${english}"><link rel="alternate" hreflang="fr" href="https://afrotools.com${french}"><link rel="alternate" hreflang="sw" href="https://afrotools.com${swahili}"><link rel="alternate" hreflang="ha" href="https://afrotools.com${hausa}"><link rel="alternate" hreflang="x-default" href="https://afrotools.com${english}">`;
}

function shell({ title, description, canonical, english, french, swahili, schema, eyebrow, lead, body }) {
  return `<!doctype html><html lang="ha"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="afrotools-source-owner" content="scripts/build-hausa-institutional-pages.js"><meta name="afrotools-content-id" content="ha-institutional:${canonical.replace(/\W+/g, '-')}"><meta name="content-language" content="ha"><title>${esc(title)} | AfroTools</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index, follow"><meta property="og:type" content="website"><meta property="og:locale" content="ha_NG"><meta property="og:site_name" content="AfroTools"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="https://afrotools.com${canonical}"><meta property="og:image" content="https://afrotools.com/assets/img/og/og-home-v2.webp"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://afrotools.com/assets/img/og/og-home-v2.webp"><link rel="canonical" href="https://afrotools.com${canonical}">${alternates(english, french, swahili, canonical)}<link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/localized-institutional.css"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script><script src="/assets/js/components/navbar.js" defer></script><script src="/assets/js/components/footer.js" defer></script></head><body><a class="skip-link" href="#main">Tsallake zuwa babban abun ciki</a><afro-navbar></afro-navbar><main id="main" class="li-page"><header class="li-hero"><div class="li-wrap"><nav aria-label="Hanyar shafi"><a href="/ha/">Gida</a> <span aria-hidden="true">›</span> ${esc(title)}</nav><p class="li-eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p class="li-lead">${esc(lead)}</p></div></header>${body}</main><afro-footer></afro-footer><script src="/assets/js/lazy-analytics.js" defer></script></body></html>\n`;
}

function card(title, text) { return `<article class="li-card"><h2>${esc(title)}</h2><p>${esc(text)}</p></article>`; }

function aboutPage() {
  const title = 'Game da AfroTools';
  const description = 'Koyi manufar AfroTools, yadda muke gina kayan aikin Afirka, yadda muke kula da tushe, sirri, harsuna da iyakokin sakamako.';
  const sections = [
    ['Dalilin da ya sa AfroTools yake akwai', 'Bukatun Afirka ba su tsaya ga fassara shafi kawai ba. Tsarin haraji, kuɗi, dokokin kasuwanci, takardun gwamnati, hanyoyin biyan kuɗi da ƙarfin intanet sun bambanta. Saboda haka muna fara kowane aiki da ƙasa, kuɗi, lokaci da hukuma da suka shafi shawarar.'],
    ['Yadda ake gina kayan aiki', 'Idan akwai lissafi ko ƙa’ida, muna raba injin lissafi da shafin da mai amfani yake gani domin a iya gwadawa ba tare da dogaro da maballin shafi ba. Muna bayyana abubuwan da aka shigar, zato, sakamako da abin da bai shiga lissafin ba.'],
    ['Tushe da sabuntawa', 'Samun hanyar tushe ba ya tabbatar da cewa wani ƙima ko doka har yanzu tana aiki. Bayanan da ke sauyawa suna buƙatar ranar dubawa, hukumar da ta wallafa su da iyakar amincewa. Idan bayanin ya tsufa, kayan aiki ya kamata ya dakata ko ya bayyana shi a matsayin tarihin da ba na yanzu ba.'],
    ['Hausa da sauran harsuna', 'Harshe da ƙasa abubuwa ne daban. Hausa tana sarrafa rubutun shafi; zaɓin ƙasa yana sarrafa doka, kuɗi da tushen da ya dace. Shafin Turanci na wucin gadi dole ya nuna cewa gada ce, kuma ba ya ƙidaya a matsayin cikakken shafin Hausa.'],
    ['Sirri da aiki a na’ura', 'Muna fifita lissafi da sarrafa fayil a cikin burauza idan aikin ya ba da damar haka. Aika bayanai zuwa fom, asusu, biyan kuɗi ko AI dole ya zama zaɓi mai bayyani. Kada a aika kalmar sirri, lambar shaida, cikakken CV, bayanin lafiya ko bayanin kuɗi mai muhimmanci ba tare da bukata da izini ba.'],
    ['AI ba ya maye gurbin injin lissafi', 'AfroTools AI na iya taimakawa wajen nemo kayan aiki, fayyace tambaya ko bayyana sakamako. Bai kamata ya ƙirƙiro ƙimar haraji, doka ko tushen da babu shi ba. Idan akwai injin da aka gwada, shi ne tushen lissafi.'],
    ['Samun dama da ƙananan na’urori', 'Muna duba shafuka da madannai, wayar salula, girman rubutu kashi 200 da haɗin intanet mai rauni. Lakabi, yanayin focus, saƙon kuskure da hana zamewar shafi a kwance duk suna cikin ingancin samfur.'],
    ['Abin da ba mu yi alkawari ba', 'Sakamakon AfroTools shiri ne ko kiyasi, ba takardar hukuma, tayin farashi na dole, ko shawarar doka, lafiya ko kuɗi ba. Tabbatar da muhimmin mataki wajen hukumar, ƙwararre ko mai ba da sabis da ya dace.'],
    ['Yadda za ka taimaka', 'Ka iya turo hanyar shafi, sunan kayan aiki, ƙasar da abin ya shafa, abin da ka shigar da abin da ka gani. Idan kana da tushe na hukuma, haɗa adireshinsa da ranar dubawa. Kada ka turo ainihin bayanan mutum domin nuna kuskure.']
  ];
  const principles = [
    ['Aiki kafin ado', 'Kowane shafi ya taimaka wajen lissafi, tabbatarwa, shirya takarda, kwatantawa ko fitar da sakamako.'],
    ['Mahalli kafin zato', 'Ƙasa, kuɗi, lokaci da tushen suna bayyana kafin amfani da ƙima mai sauyawa.'],
    ['Sirri kafin sauƙi', 'Aikin cikin na’ura shi ne tsohon zaɓi; aika bayanai yana buƙatar bayani da izini.'],
    ['Sakamako mai ɗaukuwa', 'Inda ya dace, mai amfani zai iya kwafi, bugawa ko fitar da fayil sannan ya sake buɗe shi.']
  ];
  const body = `<section class="li-section"><div class="li-wrap"><div class="li-grid">${principles.map(([h,p]) => card(h,p)).join('')}</div></div></section><section class="li-section li-muted"><div class="li-wrap li-prose">${sections.map(([h,p]) => `<section><h2>${esc(h)}</h2><p>${esc(p)}</p></section>`).join('')}<div class="li-actions"><a class="btn btn-primary" href="/ha/kayan-aiki/">Duba kayan aikin Hausa</a><a class="btn btn-secondary" href="/ha/tuntube-mu/">Tuntuɓi ƙungiyar</a><a class="btn btn-secondary" href="/ha/labarai/">Duba jagorori</a><a class="btn btn-secondary" href="/ha/kasashe/">Zaɓi ƙasa</a><a class="btn btn-secondary" href="/ha/sirri/">Karanta sirri</a><a class="btn btn-secondary" href="/ha/sharuddan-amfani/">Karanta sharuɗɗa</a><a class="btn btn-secondary" href="/ha/albashi-da-haraji/">Albashi da haraji</a></div></div></section>`;
  return shell({ title, description, canonical:'/ha/game-da-mu/', english:'/about/', french:'/fr/about/', swahili:'/sw/kuhusu/', schema:{'@context':'https://schema.org','@type':'AboutPage',name:title,url:'https://afrotools.com/ha/game-da-mu/',inLanguage:'ha'}, eyebrow:'Manufarmu', lead:'Muna gina kayan aikin da ke taimaka wa mutane su yanke shawara cikin yanayin Afirka, tare da tushe, sirri da iyakokin da ake iya gani.', body });
}

function contactPage() {
  const title = 'Tuntuɓi AfroTools';
  const description = 'Rahoto kuskure, ba da shawarar kayan aiki, gyara Hausa ko bayyana haɗin gwiwa ga ƙungiyar AfroTools.';
  const form = `<form class="li-form" name="contact-ha" method="POST" data-netlify="true" netlify-honeypot="bot-field"><input type="hidden" name="form-name" value="contact-ha"><p class="li-honeypot"><label>Bar wannan babu komai <input name="bot-field" tabindex="-1" autocomplete="off"></label></p><div class="li-form-grid"><label>Suna<input name="name" autocomplete="name" required></label><label>Adireshin imel<input name="email" type="email" autocomplete="email" required></label><label>Dalilin tuntuɓa<select name="reason" required><option value="">Zaɓi dalili</option><option>Kuskuren lissafi ko rubutu</option><option>Sabon kayan aiki</option><option>Gyaran Hausa</option><option>Haɗin gwiwa ko talla</option><option>Asusu ko Pro</option><option>Wata tambaya</option></select></label><label>Kayan aiki ko hanyar shafi<input name="tool" autocomplete="off"></label><label>Ƙasa ko kasuwa<input name="country" autocomplete="country-name"></label><label class="li-wide">Saƙo<textarea name="message" rows="7" required></textarea></label></div><p class="li-note">Fom ɗin yana aika filayen da kake gani domin mu amsa. Kada ka saka kalmar sirri, lambar shaida, bayanin lafiya, cikakken CV ko bayanin kuɗi mai muhimmanci. Karanta <a href="/ha/sirri/">bayanin sirri</a>.</p><button class="btn btn-primary" type="submit">Aika saƙo</button></form>`;
  const cards = [
    ['Rahoto kuskure yadda za a iya maimaita shi', 'Ka turo hanyar shafi, ƙasa, abin da ka shigar, abin da ka zata da abin da ka samu. Yi amfani da bayanan gwaji maimakon ainihin bayanan mutum.'],
    ['Ba da shawarar kayan aiki', 'Bayyana shawarar da mutum yake ƙoƙarin yanke wa, ƙasar da ta shafa, abubuwan da ake buƙatar shigarwa da irin sakamakon da zai taimaka.'],
    ['Gyaran Hausa', 'Ka nuna hanyar shafi, rubutun yanzu, gyaran da kake ba da shawara da bambancin yare idan yana da muhimmanci.'],
    ['Haɗin gwiwa da talla', 'Duk haɗin gwiwa ko tallafi dole ya kasance da alama. Ba ya canja fomula, tushen bayanai, matsayi ko cancantar da kayan aiki ya nuna.'],
    ['Wasu hanyoyin tuntuɓa', 'Don batun sirri, ka rubuta zuwa privacy@afrotools.com. Don sauran tambayoyi, hello@afrotools.com yana nan. Wannan fom ba hanyar gaggawa ba ce.']
  ];
  const body = `<section class="li-section"><div class="li-wrap li-two"><div><h2>Aika buƙata</h2><p>Zaɓi dalili mafi dacewa domin saƙon ya isa wurin da ya dace. Za mu yi amfani da bayanin ne kawai don amsa wannan buƙata da gudanar da aikin da ka zaɓa.</p><p>Idan kana sanar da kuskure, ka ambaci sunan kayan aiki, ƙasar da ka zaɓa, abin da ka shigar ba tare da bayanan sirri ba, da sakamakon da ka yi tsammani. Wannan yana taimaka mana mu maimaita matsalar, mu binciki tushen bayanai, sannan mu ba ka amsa mai amfani.</p><p>Ba za mu iya tabbatar da lokacin amsa ba, kuma saƙon fom ba ya ƙirƙirar asusu, biyan kuɗi ko buƙatar hukuma. Idan batun yana da wa’adi na doka, lafiya ko kuɗi, tuntuɓi hukumar ko ƙwararren da ya dace kai tsaye.</p>${form}</div><aside>${cards.map(([h,p]) => card(h,p)).join('')}</aside></div><nav class="li-actions" aria-label="Wasu shafukan taimako"><a class="btn btn-secondary" href="/ha/game-da-mu/">Game da mu</a><a class="btn btn-secondary" href="/ha/kayan-aiki/">Duk kayan aiki</a><a class="btn btn-secondary" href="/ha/sirri/">Sirri</a><a class="btn btn-secondary" href="/ha/sharuddan-amfani/">Sharuɗɗan amfani</a></nav></div></section>`;
  return shell({ title, description, canonical:'/ha/tuntube-mu/', english:'/contact/', french:'/fr/contact/', swahili:'/sw/wasiliana/', schema:{'@context':'https://schema.org','@type':'ContactPage',name:title,url:'https://afrotools.com/ha/tuntube-mu/',inLanguage:'ha'}, eyebrow:'Hanya mai bayyani don kowace buƙata', lead:'Yi amfani da wannan shafi domin kuskure, shawarar kayan aiki, gyaran harshe, asusu ko haɗin gwiwa—ba tare da turo bayanan sirri da ba a buƙata ba.', body });
}

function withNativeFooterLabels(html) {
  const patch = `<script>(function(){function patch(){var host=document.querySelector('afro-footer');var root=host&&host.shadowRoot;if(!root)return;root.querySelectorAll('a').forEach(function(link){var href=link.getAttribute('href');var label=href==='/ha/game-da-mu/'?'Game da mu':href==='/ha/tuntube-mu/'?'Tuntuɓe mu':'';if(label&&link.textContent!==label)link.textContent=label;});}customElements.whenDefined('afro-footer').then(function(){var host=document.querySelector('afro-footer');if(host&&host.shadowRoot)new MutationObserver(patch).observe(host.shadowRoot,{childList:true,subtree:true});patch();requestAnimationFrame(patch);});})();</script>`;
  return html.replace('<script src="/assets/js/lazy-analytics.js"', `${patch}<script src="/assets/js/lazy-analytics.js"`);
}

const outputs = new Map([
  ['ha/game-da-mu/index.html', withNativeFooterLabels(aboutPage())],
  ['ha/tuntube-mu/index.html', withNativeFooterLabels(contactPage())]
]);

let changed = 0;
for (const [relative, expected] of outputs) {
  const absolute = path.join(ROOT, relative);
  const current = fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : '';
  if (localizedGeneratorEquivalent(current, expected)) continue;
  changed += 1;
  if (WRITE) {
    fs.mkdirSync(path.dirname(absolute), { recursive:true });
    fs.writeFileSync(absolute, expected, 'utf8');
  } else console.error(`out of date: ${relative}`);
}
console.log(`${WRITE ? 'Built' : 'Checked'} Hausa institutional pages; ${changed} file(s) ${WRITE ? 'updated' : 'out of date'}.`);
if (changed && !WRITE) process.exitCode = 1;
