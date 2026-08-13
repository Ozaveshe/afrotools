#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { localizedGeneratorEquivalent } = require("./lib/localized-generator-equivalence");

const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");
const changed = [];
const stale = [];

const ROUTES = [
  ["/african/","/fr/african/","/sw/afrika/","Explorer les besoins africains","Vinjari mahitaji ya Afrika","Un point de départ par pays, secteur et décision.","Sehemu ya kuanza kwa nchi, sekta na uamuzi."],
  ["/business-enquiry/","/fr/demande-entreprise/","/sw/ombi-la-biashara/","Demande d’entreprise","Ombi la biashara","Préparer une demande commerciale précise et responsable.","Andaa ombi la biashara lenye uwazi na uwajibikaji."],
  ["/business/","/fr/entreprises/","/sw/biashara/","Solutions pour les entreprises","Suluhisho za biashara","Trouver des workflows de préparation, calcul et conformité.","Pata workflows za maandalizi, hesabu na compliance."],
  ["/custom-calculators/","/fr/calculateurs-sur-mesure/","/sw/vikokotoo-maalum/","Calculateurs sur mesure","Vikokotoo maalum","Définir un calcul vérifiable avant de demander sa construction.","Eleza hesabu inayoweza kuthibitishwa kabla ya kuomba ijengwe."],
  ["/developers/","/fr/developers/","/sw/developers/","Ressources pour développeurs","Rasilimali za developers","Découvrir API, widgets, contrats de données et limites.","Gundua API, widgets, mikataba ya data na mipaka."],
  ["/diaspora/","/fr/diaspora/","/sw/diaspora/","Outils pour la diaspora africaine","Zana za diaspora ya Afrika","Préparer les décisions entre deux pays sans confondre taux et juridictions.","Andaa maamuzi ya nchi mbili bila kuchanganya viwango na mamlaka."],
  ["/for-accountants/","/fr/pour-comptables/","/sw/kwa-wahasibu/","AfroTools pour les comptables","AfroTools kwa wahasibu","Organiser les preuves, hypothèses et exports d’un dossier client.","Panga ushahidi, dhana na exports za kazi ya mteja."],
  ["/for-fintechs/","/fr/pour-fintechs/","/sw/kwa-fintech/","AfroTools pour les fintechs","AfroTools kwa fintech","Évaluer une intégration sans transformer une source en promesse commerciale.","Kagua integration bila kubadilisha chanzo kuwa ahadi ya biashara."],
  ["/for-hr-payroll/","/fr/pour-rh-paie/","/sw/kwa-hr-na-payroll/","AfroTools pour les RH et la paie","AfroTools kwa HR na payroll","Séparer calcul, politique interne et obligation officielle.","Tenganisha hesabu, sera ya ndani na wajibu rasmi."],
  ["/for-schools/","/fr/pour-ecoles/","/sw/kwa-shule/","AfroTools pour les écoles","AfroTools kwa shule","Préparer budgets, documents et décisions éducatives sans données réelles d’élèves.","Andaa bajeti, hati na maamuzi ya elimu bila data halisi ya wanafunzi."],
  ["/manufacturing/","/fr/industrie/","/sw/uzalishaji/","Outils pour l’industrie","Zana za uzalishaji","Structurer coûts, capacité, énergie, qualité et logistique.","Panga gharama, uwezo, nishati, ubora na logistics."],
  ["/media-kit/","/fr/kit-media/","/sw/media-kit/","Kit média AfroTools","Media kit ya AfroTools","Comprendre l’audience, les formats et les règles de partenariat.","Elewa hadhira, formats na kanuni za ushirikiano."],
  ["/security/","/fr/securite/","/sw/usalama/","Sécurité AfroTools","Usalama wa AfroTools","Comprendre les limites, le signalement et la protection des données.","Elewa mipaka, kuripoti na ulinzi wa data."],
  ["/sponsored-tools/","/fr/outils-sponsorises/","/sw/zana-zilizodhaminiwa/","Outils sponsorisés","Zana zilizodhaminiwa","Identifier les partenariats sans influencer calculs ni classements.","Tambua ushirikiano bila kuathiri hesabu wala nafasi."],
  ["/start/","/fr/commencer/","/sw/anza/","Commencer avec AfroTools","Anza kutumia AfroTools","Choisir un pays, une tâche et un niveau de preuve.","Chagua nchi, kazi na kiwango cha ushahidi."],
  ["/tools/","/fr/all-tools/","/sw/zana-zote/","Tous les outils AfroTools","Zana zote za AfroTools","Rechercher le bon workflow dans le catalogue localisé.","Tafuta workflow sahihi kwenye katalogi iliyotafsiriwa."],
  ["/uniquely-african/","/fr/uniquely-african/","/sw/kipekee-afrika/","Outils ancrés dans les réalités africaines","Zana za hali halisi za Afrika","Explorer les workflows culturels et pratiques sans généraliser un continent.","Vinjari workflows za utamaduni na vitendo bila kujumlisha bara zima."],
  ["/widgets/","/fr/widgets/","/sw/widgets/","Widgets AfroTools","Widgets za AfroTools","Intégrer un workflow avec provenance, limites et repli visibles.","Weka workflow yenye provenance, mipaka na fallback inayoonekana."],
];

// These English routes are redirect-only aliases, not indexable locale equivalents.
// Keep the localized pages reciprocal without advertising the alias to crawlers.
const NON_INDEXABLE_EN_ROUTES = new Set(["/business/"]);

const CONTACT_FORM_ROUTES = new Set(["/business-enquiry/","/custom-calculators/","/media-kit/"]);

function esc(value){return String(value).replace(/[&<>"']/g,(ch)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function fileFor(route){return path.join(ROOT,route==="/"?"index.html":`${route.replace(/^\//,"")}index.html`);}
function addAlternate(html,lang,route){const tag=`<link rel="alternate" hreflang="${lang}" href="https://afrotools.com${route}">`;return html.includes(tag)?html:html.replace("</head>",`${tag}</head>`);}
function removeAlternate(html,lang,route){const tag=`<link rel="alternate" hreflang="${lang}" href="https://afrotools.com${route}">`;return html.replaceAll(`${tag}\r\n`,"").replaceAll(`${tag}\n`,"").replaceAll(tag,"");}
function schema(title,description,route,lang){return JSON.stringify({"@context":"https://schema.org","@type":"CollectionPage",name:title,description,url:`https://afrotools.com${route}`,inLanguage:lang});}
function localizeSwText(value){return String(value).replaceAll('workflows','mipangilio ya kazi').replaceAll('workflow','mtiririko wa kazi').replaceAll('compliance','uzingatiaji').replaceAll('developers','wasanidi programu');}
function faqSchema(fr){return JSON.stringify({"@context":"https://schema.org","@type":"FAQPage",mainEntity:[{"@type":"Question",name:fr?"Cette page garantit-elle une fonction disponible ?":"Ukurasa huu unahakikisha kipengele kinapatikana?",acceptedAnswer:{"@type":"Answer",text:fr?"Non. Cette page organise la découverte. La page finale du produit indique ses contrôles, ses sources, sa confidentialité, ses exports, son état et ses limites.":"Hapana. Ukurasa huu unapanga ugunduzi. Ukurasa wa mwisho wa bidhaa hueleza vidhibiti, vyanzo, faragha, exports, hali na mipaka."}},{"@type":"Question",name:fr?"Comment signaler une information obsolète ?":"Niripoti vipi taarifa ya zamani?",acceptedAnswer:{"@type":"Answer",text:fr?"Envoyez la route, le pays, la date, la source et un exemple reproductible via la page de contact, sans données personnelles réelles.":"Tuma route, nchi, tarehe, chanzo na mfano unaoweza kurudiwa kupitia ukurasa wa mawasiliano, bila data binafsi halisi."}}]});}

function standard(locale,row){
  const fr=locale==="fr", route=fr?row[1]:row[2], title=fr?row[3]:row[4], summary=fr?row[5]:localizeSwText(row[6]);
  const tools=fr?"/fr/all-tools/":"/sw/zana-zote/", countries=fr?"/fr/countries/":"/sw/nchi/", categories=fr?"/fr/categories/":"/sw/makundi/", contact=fr?"/fr/contact/":"/sw/wasiliana/", privacy=fr?"/fr/privacy/":"/sw/faragha/", blog=fr?"/fr/blog/":"/sw/blogu/";
  const form=CONTACT_FORM_ROUTES.has(row[0])?`<h2>${fr?"Présenter le besoin":"Eleza hitaji"}</h2><form class="localized-discovery__form" name="${locale}-${row[0].replace(/\W/g,"-")}" method="POST" data-netlify="true" netlify-honeypot="bot-field"><input type="hidden" name="form-name" value="${locale}-${row[0].replace(/\W/g,"-")}"><p hidden><label>Bot<input name="bot-field"></label></p><label>${fr?"Organisation":"Shirika"}<input name="organisation" required></label><label>${fr?"Pays et public concernés":"Nchi na hadhira"}<input name="market" required></label><label>${fr?"Décision ou workflow attendu":"Uamuzi au workflow"}<textarea name="workflow" rows="5" required></textarea></label><label>${fr?"Source, méthode ou exemple":"Chanzo, mbinu au mfano"}<textarea name="evidence" rows="4"></textarea></label><label>${fr?"Adresse e-mail":"Barua pepe"}<input name="email" type="email" autocomplete="email" required></label><button class="btn btn-primary" type="submit">${fr?"Envoyer pour revue":"Tuma kwa ukaguzi"}</button><p>${fr?"L’envoi ouvre une revue et ne garantit ni prix, ni délai, ni réalisation.":"Kutuma huanzisha ukaguzi na hakuhakikishi bei, muda wala utekelezaji."}</p></form>`:`<form class="localized-discovery__form" action="${tools}" method="get" role="search"><label>${fr?"Rechercher une tâche ou un outil":"Tafuta kazi au zana"}<input name="q" type="search" autocomplete="off" placeholder="${fr?"Ex. budget, conformité, PDF":"Mfano: bajeti, compliance, PDF"}"></label><label>${fr?"Pays ou marché":"Nchi au soko"}<input name="country"></label><button class="btn btn-primary" type="submit">${fr?"Rechercher":"Tafuta"}</button></form>`;
  return `<section class="localized-discovery" data-localized-discovery-standard="${locale}" aria-labelledby="${locale}-${row[0].replace(/\W/g,"-")}-title"><div class="localized-discovery__wrap"><p class="localized-discovery__eyebrow">${fr?"Découverte responsable":"Ugunduzi wenye uwajibikaji"}</p><h2 id="${locale}-${row[0].replace(/\W/g,"-")}-title">${esc(title)}</h2><p>${esc(summary)} ${fr?"Cette page aide à choisir une route et à comprendre la preuve nécessaire; elle ne promet pas qu’une fonction, une donnée ou une intégration est disponible dans chaque pays.":"Ukurasa huu husaidia kuchagua route na kuelewa ushahidi unaohitajika; hauahidi kuwa kipengele, data au integration inapatikana katika kila nchi."}</p><p>${fr?"Commencez par un exemple sans données personnelles, puis vérifiez que le workflow final correspond au pays, à la période et au format de sortie attendus. Comparez toujours la date de révision, la provenance et les limites visibles avant d’utiliser un résultat dans une décision réelle. Si une route est indisponible, utilisez le catalogue ou le contact pour trouver une alternative explicite plutôt que de déduire une équivalence.":"Anza kwa mfano usio na data binafsi, kisha hakikisha workflow ya mwisho inalingana na nchi, kipindi na aina ya output inayotakiwa. Linganisha tarehe ya ukaguzi, asili ya chanzo na mipaka inayoonekana kabla ya kutumia matokeo katika uamuzi halisi. Ikiwa route haipatikani, tumia katalogi au mawasiliano kupata mbadala ulio wazi badala ya kudhani kuwa bidhaa mbili ni sawa."}</p>${form}<div class="localized-discovery__grid"><article><h3>${fr?"1. Nommer la décision":"1. Taja uamuzi"}</h3><p>${fr?"Décrivez le résultat attendu, la personne qui l’utilisera et ce qui doit pouvoir être modifié. Un annuaire, un calculateur, un document et une intégration ne répondent pas au même besoin.":"Eleza matokeo yanayotakiwa, atakayetumia na kile kinachopaswa kubadilishwa. Directory, calculator, hati na integration hazijibu hitaji moja."}</p></article><article><h3>${fr?"2. Choisir le contexte":"2. Chagua muktadha"}</h3><p>${fr?"Séparez langue, pays, devise, période, secteur et autorité. Une interface française ou swahili ne change pas la juridiction d’un calcul ou la disponibilité d’un service.":"Tenganisha lugha, nchi, sarafu, kipindi, sekta na mamlaka. Kiolesura cha Kiswahili hakibadilishi jurisdiction ya hesabu au upatikanaji wa huduma."}</p></article><article><h3>${fr?"3. Vérifier la preuve":"3. Kagua ushahidi"}</h3><p>${fr?"Pour les règles, prix, délais, taux ou disponibilités variables, ouvrez la source, contrôlez la date et refusez un résultat actuel lorsque la preuve est expirée ou incomplète.":"Kwa kanuni, bei, muda, viwango au upatikanaji unaobadilika, fungua chanzo, kagua tarehe na kataa matokeo ya sasa ikiwa ushahidi umekwisha muda au haujakamilika."}</p></article><article><h3>${fr?"4. Protéger les données":"4. Linda data"}</h3><p>${fr?"N’envoyez ni mot de passe, ni identifiant, ni dossier client, médical ou financier dans une demande de découverte. Un workflow sensible doit rester local ou demander un consentement explicite avant tout transfert.":"Usitume password, utambulisho, rekodi ya mteja, afya au fedha kwenye ombi la ugunduzi. Workflow nyeti lazima ibaki kifaani au iombe idhini wazi kabla ya kutuma."}</p></article><article><h3>${fr?"5. Confirmer la sortie":"5. Thibitisha output"}</h3><p>${fr?"Vérifiez que les actions annoncées existent réellement: copie, impression, fichier ou transfert. Un bouton, une fiche ou une page de découverte ne prouve pas à lui seul qu’un export est disponible.":"Hakikisha actions zilizotangazwa zipo kweli: copy, print, faili au uhamisho. Button, card au ukurasa wa ugunduzi peke yake hauthibitishi kuwa export inapatikana."}</p></article></div><h2>${fr?"Avant de continuer":"Kabla ya kuendelea"}</h2><details><summary>${fr?"Cette page garantit-elle une fonction disponible ?":"Ukurasa huu unahakikisha kipengele kinapatikana?"}</summary><p>${fr?"Non. Elle organise la découverte. La page finale du produit indique ses contrôles, ses sources, sa confidentialité, ses exports, son état et ses limites.":"Hapana. Unapanga ugunduzi. Ukurasa wa mwisho wa bidhaa hueleza controls, vyanzo, faragha, exports, hali na mipaka."}</p></details><details><summary>${fr?"Comment signaler une information obsolète ?":"Niripoti vipi taarifa ya zamani?"}</summary><p>${fr?"Envoyez la route, le pays, la date, la source et un exemple reproductible via le contact. Ne joignez pas de données personnelles réelles.":"Tuma route, nchi, tarehe, chanzo na mfano unaoweza kurudiwa kupitia mawasiliano. Usiambatishe data binafsi halisi."}</p></details><h2>${fr?"Explorer AfroTools":"Vinjari AfroTools"}</h2><nav class="localized-discovery__links" aria-label="${fr?"Routes de découverte":"Routes za ugunduzi"}"><a href="${tools}">${fr?"Tous les outils":"Zana zote"}</a><a href="${countries}">${fr?"Pays":"Nchi"}</a><a href="${categories}">${fr?"Catégories":"Makundi"}</a><a href="${blog}">${fr?"Guides":"Miongozo"}</a><a href="${privacy}">${fr?"Confidentialité":"Faragha"}</a><a href="${contact}">${fr?"Contact":"Wasiliana"}</a><a href="${fr?"/fr/about/":"/sw/kuhusu/"}">${fr?"À propos":"Kuhusu"}</a><a href="${fr?"/fr/faq/":"/sw/maswali-ya-mara-kwa-mara/"}">FAQ</a><a href="${fr?"/fr/terms/":"/sw/masharti/"}">${fr?"Conditions":"Masharti"}</a><a href="${fr?"/fr/editorial-policy/":"/sw/sera-ya-uhariri/"}">${fr?"Politique éditoriale":"Sera ya uhariri"}</a></nav></div></section>`;
}
function safeStandard(locale,row){
  let output = standard(locale,row)
    .replace('Directory, calculator, hati na integration', 'Orodha, kikokotoo, hati na muunganisho')
    .replace('/fr/terms/','/fr/terms-of-use/')
    .replace('/fr/editorial-policy/','/fr/contact/')
    .replace('/sw/sera-ya-uhariri/','/sw/wasiliana/');
  if (locale === 'sw') output = output
    .replaceAll('Uamuzi au workflow', 'Uamuzi au mtiririko wa kazi')
    .replaceAll('workflow ya mwisho', 'mtiririko wa kazi wa mwisho')
    .replaceAll('Workflow nyeti', 'Mtiririko wa kazi wenye data nyeti')
    .replaceAll('route na kuelewa', 'njia na kuelewa')
    .replaceAll('Ikiwa route haipatikani', 'Ikiwa njia haipatikani')
    .replaceAll('Tuma route, nchi', 'Tuma njia, nchi')
    .replaceAll('integration inapatikana', 'muunganisho unapatikana')
    .replaceAll('jurisdiction ya hesabu', 'mamlaka ya kisheria ya hesabu')
    .replaceAll('password, utambulisho', 'nenosiri, utambulisho')
    .replaceAll('5. Thibitisha output', '5. Thibitisha matokeo')
    .replaceAll('aina ya output', 'aina ya matokeo')
    .replaceAll('actions zilizotangazwa', 'vitendo vilivyotangazwa')
    .replaceAll('copy, print', 'nakili, chapisha')
    .replaceAll('Button, card', 'Kitufe, kadi')
    .replaceAll('export inapatikana', 'faili la kupakua linapatikana')
    .replaceAll('controls, vyanzo, faragha, exports', 'vidhibiti, vyanzo, faragha na faili zinazopakuliwa')
    .replaceAll('Routes za ugunduzi', 'Njia za ugunduzi');
  return output;
}
function contentId(locale, row){
  const slug = row[0].replace(/^\//, '').replace(/\/$/, '') || 'home';
  return `localized-discovery:${locale}:${slug}`;
}
function decorateDiscovery(html, locale, row){
  let output = html.includes('name="afrotools-source-owner"') ? html : html.replace('<head>', '<head><meta name="afrotools-source-owner" content="scripts/build-localized-discovery-pages.js">');
  if (!output.includes('name="afrotools-content-id"')) output = output.replace('<head>', `<head><meta name="afrotools-content-id" content="${contentId(locale,row)}">`);
  if (locale === 'sw' && !output.includes('/assets/js/lib/sw-accessibility.js')) {
    output = output.replace('</body>', '<script src="/assets/js/lib/sw-accessibility.js" defer></script></body>');
  }
  return output;
}

function shell(locale,row){const fr=locale==="fr",route=fr?row[1]:row[2],title=fr?row[3]:row[4],summary=fr?row[5]:row[6],root=fr?"/fr/":"/sw/",hasIndexableEnglish=!NON_INDEXABLE_EN_ROUTES.has(row[0]),englishAlternate=hasIndexableEnglish?`<link rel="alternate" hreflang="en" href="https://afrotools.com${row[0]}">`:"",xDefaultAlternate=hasIndexableEnglish?`<link rel="alternate" hreflang="x-default" href="https://afrotools.com${row[0]}">`:"";return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | AfroTools</title><meta name="description" content="${esc(summary)}"><meta property="og:title" content="${esc(title)} | AfroTools"><meta property="og:description" content="${esc(summary)}"><meta property="og:type" content="website"><meta property="og:url" content="https://afrotools.com${route}"><meta property="og:image" content="https://afrotools.com/assets/img/og-default.png"><link rel="canonical" href="https://afrotools.com${route}">${englishAlternate}<link rel="alternate" hreflang="fr" href="https://afrotools.com${row[1]}"><link rel="alternate" hreflang="sw" href="https://afrotools.com${row[2]}">${xDefaultAlternate}<link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/localized-discovery-standard.css"><script type="application/ld+json">${schema(title,summary,route,locale)}</script><script type="application/ld+json">${faqSchema(fr)}</script><script src="/assets/js/components/navbar.js" defer></script><script src="/assets/js/components/footer.js" defer></script></head><body class="top-level-page-ui-refresh"><afro-navbar></afro-navbar><main><header class="localized-discovery__hero"><div class="localized-discovery__wrap"><nav><a href="${root}">${fr?"Accueil":"Mwanzo"}</a></nav><h1>${esc(title)}</h1><p>${esc(summary)}</p></div></header>${safeStandard(locale,row)}</main><afro-footer></afro-footer></body></html>\n`;}
function enhance(html,locale,row){const fr=locale==="fr",hasIndexableEnglish=!NON_INDEXABLE_EN_ROUTES.has(row[0]);let out=html.replace(/<section class="localized-discovery"[\s\S]*?<\/section>/i,"");if(hasIndexableEnglish)out=addAlternate(out,"en",row[0]);else{out=removeAlternate(out,"en",row[0]);out=removeAlternate(out,"x-default",row[0]);}for(const [lang,route] of [["fr",row[1]],["sw",row[2]]])out=addAlternate(out,lang,route);if(!out.includes("localized-discovery-standard.css"))out=out.replace("</head>",'<link rel="stylesheet" href="/assets/css/localized-discovery-standard.css"></head>');if(!/@type["']?\s*:\s*["']FAQPage/i.test(out))out=out.replace("</head>",`<script type="application/ld+json">${faqSchema(fr)}</script></head>`);return /<afro-footer\b/i.test(out)?out.replace(/<afro-footer\b/i,`${safeStandard(locale,row)}<afro-footer`):out.replace("</body>",`${safeStandard(locale,row)}</body>`);}
function write(file,content,required=[],forbidden=[]){const current=fs.existsSync(file)?fs.readFileSync(file,"utf8"):"";if(localizedGeneratorEquivalent(current,content)&&required.every(value=>current.includes(value))&&forbidden.every(value=>!current.includes(value)))return;if(!WRITE){stale.push(path.relative(ROOT,file));return;}fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content,"utf8");changed.push(path.relative(ROOT,file));}

for(const row of ROUTES){
  for(const locale of ["fr","sw"]){
    const localizedRow=locale==="sw"?[row[0],row[1],row[2],row[3],localizeSwText(row[4]),row[5],localizeSwText(row[6])]:row;
    const route=locale==="fr"?row[1]:row[2],file=fileFor(route),current=fs.existsSync(file)?fs.readFileSync(file,"utf8"):"";
    let content=current?enhance(current,locale,localizedRow):shell(locale,localizedRow);
    if(locale==="sw") content=content.replaceAll(row[4],localizedRow[4]).replaceAll(row[6],localizedRow[6]);
    const forbidden=NON_INDEXABLE_EN_ROUTES.has(row[0])?[`hreflang="en" href="https://afrotools.com${row[0]}"`,`hreflang="x-default" href="https://afrotools.com${row[0]}"`]:[];
    write(file,decorateDiscovery(content,locale,localizedRow),[`hreflang="sw"`,`href="https://afrotools.com${row[2]}"`,'name="afrotools-source-owner"',`name="afrotools-content-id" content="${contentId(locale,localizedRow)}"`],forbidden);
  }
  const enFile=fileFor(row[0]);let en=fs.readFileSync(enFile,"utf8");
  if(NON_INDEXABLE_EN_ROUTES.has(row[0])){
    en=removeAlternate(removeAlternate(en,"fr",row[1]),"sw",row[2]);
    write(enFile,en,[],[`hreflang="fr" href="https://afrotools.com${row[1]}"`,`hreflang="sw" href="https://afrotools.com${row[2]}"`]);
  }else{
    en=addAlternate(addAlternate(en,"fr",row[1]),"sw",row[2]);
    write(enFile,en,[`hreflang="sw"`,`href="https://afrotools.com${row[2]}"`]);
  }
}
if(stale.length){console.error(`Localized discovery pages stale (${stale.length}):\n${stale.join("\n")}`);process.exit(1);}console.log(`${WRITE?"Built":"Checked"} localized discovery pages; ${changed.length} file(s) updated.`);

module.exports={ROUTES,NON_INDEXABLE_EN_ROUTES};
