"use strict";

const SITE = "https://afrotools.com";
const COPY = {
  fr: {
    lang: "fr",
    locale: "fr_FR",
    route: "/fr/tools/tarifs-itineraire/",
    title: "Planificateur de budget de trajet en Afrique | AfroTools",
    description:
      "Planifiez un budget de transport à partir d'un tarif vérifié localement, avec correspondances, jours de trajet et marge de sécurité.",
    home: "Accueil",
    section: "Finances personnelles",
    sectionRoute: "/fr/finance/",
    crumb: "Budget de trajet",
    kicker: "Planification locale et confidentielle",
    h1: "Planifiez le coût d'un trajet avant de partir.",
    lead: "Commencez par un tarif confirmé localement. Ajoutez les correspondances, les jours de trajet et une marge—sans envoyer votre itinéraire ni votre budget.",
    badges: [
      "Sans inscription",
      "Toute devise",
      "Calcul privé",
      "Impression ou PDF",
    ],
    planner: "Planificateur de budget",
    intro:
      "L'outil ne devine pas le tarif. Confirmez le prix actuel auprès de l'opérateur, de la gare, du guichet ou de l'application de transport.",
    labels: [
      "Nom du trajet (facultatif)",
      "Devise",
      "Tarif confirmé par trajet",
      "Correspondances ou suppléments par trajet",
      "Trajets payants par jour",
      "Jours de déplacement",
      "Marge de sécurité (%)",
      "Ancien tarif (facultatif)",
    ],
    hints: [
      "Utilisé uniquement dans le résumé local.",
      "Code à trois lettres, par exemple XOF, XAF, KES ou EUR.",
      "",
      "Bagages, correspondances ou frais fixes.",
      "Un aller-retour direct correspond généralement à deux trajets.",
      "",
      "Marge facultative pour les variations de prix.",
      "Sert uniquement à calculer l'évolution.",
    ],
    placeholder: "ex. Centre-ville vers la gare",
    calculate: "Calculer le budget",
    result: "Budget pour la période",
    metrics: [
      "Coût de base",
      "Marge de sécurité",
      "Trajets payants",
      "Moyenne par jour",
      "Évolution de l'ancien tarif",
    ],
    buttons: [
      "Copier le résumé",
      "Télécharger le texte",
      "Imprimer / enregistrer en PDF",
    ],
    checks: "Avant d'utiliser le résultat",
    checkItems: [
      "Confirmez le tarif le jour du trajet.",
      "Vérifiez les suppléments de pointe, de bagages ou de paiement.",
      "Comptez chaque correspondance payante.",
      "Gardez le transport d'urgence hors du budget normal.",
    ],
    method: "Méthode",
    methodText:
      "(Tarif + suppléments) × trajets payants par jour × jours de déplacement, puis ajout de la marge choisie. L'ancien tarif sert uniquement à la comparaison.",
    warning:
      "Estimation de planification—pas un tarif officiel, un devis d'opérateur ou une garantie de voyage.",
    privacy: "Confidentialité et sources",
    privacyText:
      "Tous les champs et calculs restent dans ce navigateur. Cette version n'envoie aucune donnée. Les observations communautaires ne sont pas des tarifs officiels; confirmez toujours le prix localement.",
    faqTitle: "Questions sur le budget de trajet",
    faqs: [
      [
        "Est-ce un tarif officiel ?",
        "Non. Le calcul utilise le tarif que vous saisissez après vérification locale.",
      ],
      [
        "Qu'est-ce qu'un trajet payant ?",
        "Chaque montée payée séparément compte comme un trajet.",
      ],
      [
        "Puis-je créer un PDF ?",
        "Oui. Calculez, choisissez l'impression, puis la destination PDF de votre navigateur.",
      ],
    ],
    status: {
      updated: "Budget mis à jour. Les données restent sur cet appareil.",
      invalid: "Vérifiez les valeurs saisies.",
      copied: "Résumé copié.",
      copyBlocked: "Copie bloquée. Sélectionnez le texte du résultat.",
      downloaded: "Résumé texte téléchargé.",
      total: "Budget total",
      noCompare: "Non comparé",
      estimate:
        "Estimation seulement. Confirmez le tarif actuel avant le trajet.",
    },
  },
  sw: {
    lang: "sw",
    locale: "sw_TZ",
    route: "/sw/zana/nauli-za-ruti/",
    title: "Mpangaji wa bajeti ya nauli za ruti Afrika | AfroTools",
    description:
      "Panga bajeti ya usafiri kwa nauli uliyothibitisha, safari zinazolipiwa, siku za kusafiri na akiba ya mabadiliko.",
    home: "Mwanzo",
    section: "Zana zote",
    sectionRoute: "/sw/zana-zote/",
    crumb: "Bajeti ya nauli",
    kicker: "Mpango wa ndani na wa faragha",
    h1: "Panga gharama ya ruti kabla ya kusafiri.",
    lead: "Anza na nauli uliyothibitisha mahali ulipo. Ongeza safari za kuunganisha, siku na akiba—bila kutuma ruti au bajeti yako.",
    badges: [
      "Hakuna usajili",
      "Sarafu yoyote",
      "Hesabu ya faragha",
      "Chapisha au PDF",
    ],
    planner: "Mpangaji wa bajeti ya ruti",
    intro:
      "Zana haibashiri nauli. Thibitisha bei ya sasa kwa operator, stendi, ofisi ya tiketi au programu ya usafiri.",
    labels: [
      "Jina la ruti (si lazima)",
      "Sarafu",
      "Nauli iliyothibitishwa kwa safari",
      "Ada za kuunganisha au nyongeza",
      "Safari zinazolipiwa kwa siku",
      "Siku za kusafiri",
      "Akiba ya mabadiliko (%)",
      "Nauli ya awali (si lazima)",
    ],
    hints: [
      "Hutumika tu katika muhtasari wako wa ndani.",
      "Tumia msimbo wa herufi tatu kama KES, TZS, UGX au XOF.",
      "",
      "Mizigo, feeder au ada nyingine.",
      "Kwenda na kurudi moja kwa moja kwa kawaida ni safari mbili.",
      "",
      "Akiba ya hiari kwa mabadiliko ya bei.",
      "Hutumika tu kuonyesha mabadiliko.",
    ],
    placeholder: "mf. CBD hadi Westlands",
    calculate: "Kokotoa bajeti",
    result: "Bajeti ya kipindi",
    metrics: [
      "Gharama ya msingi",
      "Akiba ya mabadiliko",
      "Safari zilizolipiwa",
      "Wastani kwa siku",
      "Mabadiliko kutoka nauli ya awali",
    ],
    buttons: ["Nakili muhtasari", "Pakua maandishi", "Chapisha / hifadhi PDF"],
    checks: "Kabla ya kutegemea matokeo",
    checkItems: [
      "Thibitisha nauli siku ya safari.",
      "Uliza kuhusu peak, mizigo au ada ya malipo.",
      "Hesabu kila safari ya kuunganisha inayolipiwa.",
      "Tenga usafiri wa dharura na bajeti ya kawaida.",
    ],
    method: "Mbinu",
    methodText:
      "(Nauli + nyongeza) × safari zinazolipiwa kwa siku × siku za kusafiri, kisha ongeza asilimia ya akiba uliyochagua. Nauli ya awali ni ya kulinganisha tu.",
    warning:
      "Makadirio ya kupanga—si nauli rasmi, nukuu ya operator au dhamana ya safari.",
    privacy: "Faragha na vyanzo",
    privacyText:
      "Sehemu na hesabu zote hubaki kwenye kivinjari hiki. Toleo hili halitumi data. Ripoti za jamii si nauli rasmi; thibitisha bei mahali ulipo.",
    faqTitle: "Maswali kuhusu bajeti ya ruti",
    faqs: [
      [
        "Je, hii ni nauli rasmi?",
        "Hapana. Hesabu hutumia nauli uliyoweka baada ya kuithibitisha mahali ulipo.",
      ],
      [
        "Safari inayolipiwa ni nini?",
        "Kila kupanda chombo kunakolipiwa kivyake ni safari moja.",
      ],
      [
        "Ninaweza kutengeneza PDF?",
        "Ndiyo. Kokotoa, chagua kuchapisha, kisha chagua PDF kwenye kivinjari chako.",
      ],
    ],
    status: {
      updated: "Bajeti imesasishwa. Data inabaki kwenye kifaa hiki.",
      invalid: "Kagua thamani ulizoingiza.",
      copied: "Muhtasari umenakiliwa.",
      copyBlocked: "Kunakili kumezuiwa. Chagua maandishi ya matokeo.",
      downloaded: "Muhtasari wa maandishi umepakuliwa.",
      total: "Jumla ya bajeti",
      noCompare: "Haijalinganishwa",
      estimate: "Makadirio tu. Thibitisha nauli ya sasa kabla ya kusafiri.",
    },
  },
};
function e(v) {
  return String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function field(id, label, input, hint) {
  return `<div class="rf-field"><label for="${id}">${e(label)}</label>${input}${hint ? `<small>${e(hint)}</small>` : ""}</div>`;
}
function render(locale) {
  const c = COPY[locale];
  if (!c) throw new Error(`Unsupported route-fares locale: ${locale}`);
  const en = `${SITE}/tools/route-fares/`,
    fr = `${SITE}${COPY.fr.route}`,
    sw = `${SITE}${COPY.sw.route}`,
    url = `${SITE}${c.route}`;
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: c.h1,
        url: url,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Any",
        inLanguage: c.lang,
        isAccessibleForFree: true,
        description: c.description,
        isBasedOn: en,
      },
      {
        "@type": "FAQPage",
        inLanguage: c.lang,
        mainEntity: c.faqs.map((x) => ({
          "@type": "Question",
          name: x[0],
          acceptedAnswer: { "@type": "Answer", text: x[1] },
        })),
      },
    ],
  });
  const ids = [
    "rfRoute",
    "rfCurrency",
    "rfFare",
    "rfExtra",
    "rfRides",
    "rfDays",
    "rfBuffer",
    "rfPrevious",
  ];
  const inputs = [
    `<input class="rf-input" id="rfRoute" name="route" autocomplete="off" placeholder="${e(c.placeholder)}">`,
    `<input class="rf-input" id="rfCurrency" name="currency" value="KES" maxlength="3" pattern="[A-Za-z]{3}" autocomplete="off">`,
    `<input class="rf-input" id="rfFare" name="fare" type="number" min="0.01" step="0.01" value="100" inputmode="decimal" required>`,
    `<input class="rf-input" id="rfExtra" name="extraPerRide" type="number" min="0" step="0.01" value="0" inputmode="decimal">`,
    `<input class="rf-input" id="rfRides" name="ridesPerDay" type="number" min="1" max="20" step="1" value="2" inputmode="numeric" required>`,
    `<input class="rf-input" id="rfDays" name="days" type="number" min="1" max="366" step="1" value="22" inputmode="numeric" required>`,
    `<input class="rf-input" id="rfBuffer" name="bufferPercent" type="number" min="0" max="100" step="0.1" value="10" inputmode="decimal">`,
    `<input class="rf-input" id="rfPrevious" name="previousFare" type="number" min="0.01" step="0.01" inputmode="decimal">`,
  ];
  return `<!doctype html>\n<!-- Generated by scripts/generate-fr-tool-gap-pages.js or scripts/generate-route-fares-locales.js. -->\n<html lang="${c.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="afrotools-source-owner" content="scripts/lib/route-fares-locale-page.js"><meta name="afrotools-content-id" content="route-fares-locale:${c.lang}"><title>${e(c.title)}</title><meta name="description" content="${e(c.description)}"><link rel="canonical" href="${url}"><link rel="alternate" hreflang="en" href="${en}"><link rel="alternate" hreflang="fr" href="${fr}"><link rel="alternate" hreflang="sw" href="${sw}"><link rel="alternate" hreflang="x-default" href="${en}"><meta property="og:type" content="website"><meta property="og:locale" content="${c.locale}"><meta property="og:title" content="${e(c.title)}"><meta property="og:description" content="${e(c.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/assets/img/tools/route-fares.webp"><link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/route-fares-vip.css"><script type="application/ld+json">${schema.replace(/</g, "\\u003c")}</script><script src="/assets/js/lib/source-confidence.js" defer></script></head><body class="rf-page"><a class="rf-skip" href="#planner">${e(c.calculate)}</a><afro-navbar></afro-navbar><header class="rf-hero"><div class="rf-wrap"><nav class="rf-crumb"><a href="/${c.lang}/">${e(c.home)}</a> / <a href="${c.sectionRoute}">${e(c.section)}</a> / ${e(c.crumb)}</nav><div class="rf-kicker">${e(c.kicker)}</div><h1>${e(c.h1)}</h1><p>${e(c.lead)}</p><div class="rf-badges">${c.badges.map((x) => `<span class="rf-badge">${e(x)}</span>`).join("")}</div></div></header><main class="rf-main rf-wrap"><div class="rf-stack"><section class="rf-card" id="planner"><h2>${e(c.planner)}</h2><p>${e(c.intro)}</p><form id="rfPlanner" novalidate><div class="rf-fields">${ids.map((id, i) => field(id, c.labels[i], inputs[i], c.hints[i])).join("")}</div><div class="rf-actions"><button class="rf-button" type="submit">${e(c.calculate)}</button></div><p id="rfStatus" class="rf-status" role="status" aria-live="polite"></p></form><section class="rf-result" id="rfResult" hidden><h3>${e(c.result)}</h3><div class="rf-total" id="rfTotal"></div><div class="rf-result-grid">${["rfBase", "rfBuffer", "rfRides", "rfDaily", "rfChange"].map((id, i) => `<div class="rf-metric"><strong id="${id}"></strong><span>${e(c.metrics[i])}</span></div>`).join("")}</div><div class="rf-actions">${["rfCopy", "rfDownload", "rfPrint"].map((id, i) => `<button class="rf-button secondary" id="${id}" type="button">${e(c.buttons[i])}</button>`).join("")}</div></section></section><section class="rf-card rf-faq"><h2>${e(c.faqTitle)}</h2>${c.faqs.map((x) => `<details><summary>${e(x[0])}</summary><p>${e(x[1])}</p></details>`).join("")}</section></div><aside class="rf-stack"><section class="rf-card"><h2>${e(c.checks)}</h2><ul class="rf-list">${c.checkItems.map((x) => `<li>${e(x)}</li>`).join("")}</ul></section><section class="rf-card"><h2>${e(c.method)}</h2><p><strong>${e(c.methodText)}</strong></p><div class="rf-note">${e(c.warning)}</div></section><section class="rf-card"><h2>${e(c.privacy)}</h2><p>${e(c.privacyText)}</p></section><div class="afro-source-meta" data-source-meta-id="route-fares-user-input-method" data-source-meta-compact="true"></div></aside></main><afro-footer></afro-footer><script type="application/json" id="rfLocaleCopy">${JSON.stringify(c.status).replace(/</g, "\\u003c")}</script><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script><script src="/assets/js/engines/route-fares.js"></script><script src="/assets/js/pages/route-fares-locales-vip.js" defer></script></body></html>`;
}
function renderWithAccessibility(locale) {
  const html = render(locale);
  return locale === "sw"
    ? html.replace(
        "</body>",
        '\n  <script src="/assets/js/lib/sw-accessibility.js" defer></script>\n</body>',
      )
    : html;
}
module.exports = { render: renderWithAccessibility };
