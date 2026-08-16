"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const COVERAGE = path.join(ROOT, "data/registry/locale-page-coverage.json");
const COUNTRIES = path.join(ROOT, "data/registry/countries.json");
const MARKER = "data-localized-country-standard";

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function titleFromRoute(route) {
  return route.split("/").filter(Boolean).pop().split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function countryRows() {
  const records = JSON.parse(fs.readFileSync(COVERAGE, "utf8")).records;
  const countries = JSON.parse(fs.readFileSync(COUNTRIES, "utf8"));
  const normalizeRoute = (value) => {
    const route = String(value || "").replace(/\/+$/, "");
    return route ? `${route}/` : "";
  };
  const byRoute = new Map(records.map((record) => [normalizeRoute(record.route), record]));
  return countries
    .filter((country) => country.publicationStatus === "published")
    .map((country) => ({
      englishRoute: normalizeRoute(country.route),
      fr: byRoute.get(normalizeRoute(country.localeCoverage?.fr?.route)),
      sw: byRoute.get(normalizeRoute(country.localeCoverage?.sw?.route))
    }))
    .filter((row) => row.englishRoute && row.fr && row.sw);
}

function addSchema(html, locale, route, country) {
  if (/"@type"\s*:\s*"FAQPage"/i.test(html)) return html;
  const questions = locale === "fr" ? [
    [`Les outils de cette page sont-ils tous officiels pour ${country} ?`, `Non. Chaque workflow indique sa source, sa date, ses hypothèses et le contrôle restant. Une page pays aide à trouver un outil; elle ne transforme pas une estimation en décision officielle.`],
    [`La langue française change-t-elle la juridiction ?`, `Non. La langue change la présentation. Le pays, l’autorité, la devise, la période et le statut de la source déterminent le contexte du workflow.`],
    [`Que faire si une donnée est périmée ?`, `N’utilisez pas une valeur expirée comme taux ou règle actuelle. Ouvrez la source liée, obtenez un devis ou une confirmation récente et remplacez les hypothèses lorsque le workflow le permet.`]
  ] : [
    [`Je, zana zote kwenye ukurasa huu ni rasmi kwa ${country}?`, `Hapana. Kila workflow hueleza chanzo, tarehe, dhana na uthibitishaji unaobaki. Country hub husaidia kupata zana; haifanyi makadirio kuwa uamuzi rasmi.`],
    [`Je, lugha ya Kiswahili inabadilisha mamlaka?`, `Hapana. Lugha hubadilisha uwasilishaji. Nchi, mamlaka, sarafu, kipindi na hali ya chanzo huamua muktadha wa workflow.`],
    [`Nifanye nini ikiwa data imepitwa na wakati?`, `Usitumie rekodi iliyokwisha muda kama kiwango au kanuni ya sasa. Fungua chanzo, pata bei au uthibitisho mpya na badilisha dhana ikiwa workflow inaruhusu.`]
  ];
  const schema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: questions.map(([q,a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return html.replace("</head>", `<script type="application/ld+json">${JSON.stringify(schema)}</script></head>`);
}

function block(locale, route, country) {
  const fr = locale === "fr";
  const tools = fr ? "/fr/all-tools/" : "/sw/zana-zote/";
  const countries = fr ? "/fr/countries/" : "/sw/nchi/";
  const contact = fr ? "/fr/contact/" : "/sw/wasiliana/";
  const privacy = fr ? "/fr/privacy/" : "/sw/faragha/";
  const categoryLinks = fr
    ? [["Salaire et fiscalité","/fr/salary-tax/"],["TVA et entreprise","/fr/vat-business-tax/"],["Documents et PDF","/fr/document-pdf/"],["Éducation","/fr/education/"],["Transport","/fr/transport/"],["Santé","/fr/health/"],["Commerce","/fr/trade/"],["Énergie","/fr/energy/"]]
    : [["Mshahara na kodi","/sw/mshahara-na-kodi/"],["VAT na kodi","/sw/vat-na-kodi/"],["Hati na PDF","/sw/hati-na-pdf/"],["Elimu","/sw/elimu/"],["Usafiri","/sw/usafiri-na-magari/"],["Afya","/sw/afya/"],["Biashara ya nje","/sw/biashara-ya-nje/"],["Nishati","/sw/nishati-na-huduma/"]];
  return `<section class="localized-country-standard" ${MARKER}="${locale}" aria-labelledby="${locale}CountryStandardTitle"><div class="localized-country-standard__wrap"><p class="localized-country-standard__eyebrow">${fr ? "Choisir avec une preuve" : "Chagua kwa ushahidi"}</p><h2 id="${locale}CountryStandardTitle">${fr ? `Utiliser les outils pour ${country} sans confondre langue et juridiction.` : `Tumia zana za ${country} bila kuchanganya lugha na mamlaka.`}</h2><p>${fr ? `Cette page rassemble les workflows associés à ${country}. La présence d’un lien ne prouve pas qu’un taux, une règle, une disponibilité ou un prix est actuel. Commencez par la décision à prendre, puis vérifiez le pays, la période, la devise, l’autorité et le statut de la source sur la page de l’outil.` : `Ukurasa huu unakusanya workflows zinazohusishwa na ${country}. Kuwepo kwa link hakuthibitishi kuwa kiwango, kanuni, upatikanaji au bei ni ya sasa. Anza na uamuzi unaotaka kufanya, kisha kagua nchi, kipindi, sarafu, mamlaka na hali ya chanzo kwenye ukurasa wa zana.`}</p><form action="${tools}" method="get" role="search" class="localized-country-standard__form"><input type="hidden" name="country" value="${esc(route.split('/').filter(Boolean).pop())}"><label>${fr ? "Rechercher un outil ou une tâche" : "Tafuta zana au kazi"}<input name="q" type="search" autocomplete="off" placeholder="${fr ? "Ex. salaire net, TVA, document" : "Mfano: mshahara neti, VAT, hati"}"></label><button class="btn btn-primary" type="submit">${fr ? "Rechercher" : "Tafuta"}</button></form><div class="localized-country-standard__grid"><article><h3>${fr ? "1. Définir le résultat" : "1. Taja matokeo"}</h3><p>${fr ? "Distinguez calcul, guide, comparaison, document et annuaire. Deux pages proches peuvent utiliser des entrées et des preuves différentes." : "Tenganisha hesabu, mwongozo, ulinganisho, hati na directory. Kurasa zinazofanana zinaweza kutumia ingizo na ushahidi tofauti."}</p></article><article><h3>${fr ? "2. Vérifier la source" : "2. Kagua chanzo"}</h3><p>${fr ? "Ouvrez le lien de l’autorité ou de la méthode, lisez la date de revue et refusez une valeur expirée présentée comme actuelle." : "Fungua link ya mamlaka au mbinu, soma tarehe ya ukaguzi na usikubali rekodi iliyokwisha muda kama ya sasa."}</p></article><article><h3>${fr ? "3. Remplacer les hypothèses" : "3. Badilisha dhana"}</h3><p>${fr ? "Utilisez vos montants, devis, dates et conditions lorsque le workflow les demande. Testez plusieurs scénarios avant un paiement ou une signature." : "Tumia kiasi, bei, tarehe na masharti yako workflow inapoviomba. Jaribu scenarios kadhaa kabla ya kulipa au kusaini."}</p></article><article><h3>${fr ? "4. Conserver la preuve" : "4. Hifadhi ushahidi"}</h3><p>${fr ? "Téléchargez ou imprimez uniquement les formats annoncés. Gardez les entrées, la date et la source, puis confirmez auprès du professionnel compétent." : "Pakua au chapisha aina za faili zilizoelezwa tu. Hifadhi ingizo, tarehe na chanzo, kisha thibitisha kwa mtaalamu husika."}</p></article></div><h2>${fr ? `Questions fréquentes sur les outils de ${country}` : `Maswali kuhusu zana za ${country}`}</h2><details><summary>${fr ? "Ces résultats sont-ils officiels ?" : "Je, matokeo ni rasmi?"}</summary><p>${fr ? "Non, sauf si la page décrit explicitement une intégration officielle vérifiée. Un calcul ou une checklist reste une aide à la préparation." : "Hapana, isipokuwa ukurasa ueleze integration rasmi iliyothibitishwa. Hesabu au checklist ni msaada wa maandalizi."}</p></details><details><summary>${fr ? "Puis-je utiliser un outil d’un autre pays ?" : "Naweza kutumia zana ya nchi nyingine?"}</summary><p>${fr ? "Seulement comme scénario lorsque la page le permet. Ne transférez pas une règle fiscale, un barème, un permis ou une échéance d’une juridiction à une autre." : "Kama scenario tu ikiwa ukurasa unaruhusu. Usihamishe kanuni ya kodi, jedwali, permit au deadline kutoka mamlaka moja kwenda nyingine."}</p></details><details><summary>${fr ? "Où signaler une erreur ?" : "Niripoti wapi hitilafu?"}</summary><p>${fr ? `Utilisez la page de contact avec le pays, la période, la source et un exemple reproductible. N’envoyez pas de données personnelles réelles.` : `Tumia ukurasa wa mawasiliano ukitaja nchi, kipindi, chanzo na mfano unaoweza kurudiwa. Usitume data binafsi halisi.`}</p></details><h2>${fr ? "Explorer les workflows liés" : "Vinjari workflows zinazohusiana"}</h2><nav class="localized-country-standard__links" aria-label="${fr ? "Catégories liées" : "Makundi yanayohusiana"}">${categoryLinks.map(([label,href]) => `<a href="${href}">${label}</a>`).join("")}<a href="${countries}">${fr ? "Tous les pays" : "Nchi zote"}</a><a href="${tools}">${fr ? "Tous les outils" : "Zana zote"}</a><a href="${privacy}">${fr ? "Confidentialité" : "Faragha"}</a><a href="${contact}">${fr ? "Signaler une erreur" : "Ripoti hitilafu"}</a></nav></div></section>`;
}

function enhanceCountry(html, locale, route) {
  if (!html || html.includes(MARKER)) return html;
  const country = titleFromRoute(route);
  let output = addSchema(html, locale, route, country);
  if (!output.includes("/assets/css/localized-country-standard.css")) output = output.replace("</head>", `<link rel="stylesheet" href="/assets/css/localized-country-standard.css"></head>`);
  const content = block(locale, route, country);
  if (/<afro-footer\b/i.test(output)) return output.replace(/<afro-footer\b/i, `${content}<afro-footer`);
  return output.replace("</body>", `${content}</body>`);
}

module.exports = { MARKER, countryRows, enhanceCountry };
