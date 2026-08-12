"use strict";

const {
  localizedGeneratorEquivalent,
} = require("./localized-generator-equivalence");
const { buildCanonicalRegistry } = require("./canonical-registry");

const pricingRegistry = buildCanonicalRegistry();
const monthlyKes = pricingRegistry.productPlans.find((plan) => plan.id === "product:monthly_kes").title;
const annualKes = pricingRegistry.productPlans.find((plan) => plan.id === "product:annual_kes").title;

const C = {
  fr: {
    lang: "fr",
    locale: "fr_FR",
    root: "/fr/",
    tools: "/fr/all-tools/",
    countries: "/fr/countries/",
    categories: "/fr/categories/",
    contact: "/fr/contact/",
    privacy: "/fr/privacy/",
    advertise: "/fr/advertise/",
    pricing: "/fr/pricing/",
    search: "/fr/search/",
    suggest: "/fr/suggest-tool/",
    changelog: "/fr/changelog/",
    home: "Accueil",
    browse: "Parcourir les outils",
    countryLabel: "Pays",
    categoryLabel: "Catégorie",
    submit: "Envoyer",
    reset: "Réinitialiser",
  },
  sw: {
    lang: "sw",
    locale: "sw_KE",
    root: "/sw/",
    tools: "/sw/zana-zote/",
    countries: "/sw/nchi/",
    categories: "/sw/makundi/",
    contact: "/sw/wasiliana/",
    privacy: "/sw/faragha/",
    advertise: "/sw/tangaza/",
    pricing: "/sw/bei/",
    search: "/sw/tafuta/",
    suggest: "/sw/pendekeza-zana/",
    changelog: "/sw/mabadiliko/",
    home: "Mwanzo",
    browse: "Vinjari zana",
    countryLabel: "Nchi",
    categoryLabel: "Kundi",
    submit: "Tuma",
    reset: "Futa",
  },
};

const CATEGORY_ROWS = [
  ["agriculture", "Agriculture", "Kilimo"],
  ["career", "Carrière", "Kazi na ajira"],
  ["climate", "Climat et environnement", "Hali ya hewa na mazingira"],
  ["creative", "Créateurs", "Ubunifu na watayarishi"],
  ["crypto", "Crypto", "Crypto"],
  ["data-productivity", "Données et productivité", "Data na tija"],
  ["developer-tools", "Développement", "Zana za developer"],
  ["document-pdf", "Documents et PDF", "Hati na PDF"],
  ["ecommerce", "Commerce électronique", "Biashara mtandaoni"],
  ["education", "Éducation", "Elimu"],
  ["energy", "Énergie", "Nishati na huduma"],
  ["engineering", "Ingénierie", "Ujenzi na uhandisi"],
  ["fintech", "Fintech", "Fintech"],
  ["government", "Gouvernement", "Serikali na nyaraka"],
  ["health", "Santé", "Afya"],
  ["hr-payroll", "RH et paie", "HR na payroll"],
  ["image-design", "Image et design", "Picha na design"],
  ["insurance", "Assurance", "Bima"],
  ["language", "Langues", "Lugha na tafsiri"],
  ["legal", "Juridique", "Sheria"],
  ["mining", "Mines", "Madini"],
  ["mortgage-property", "Immobilier", "Nyumba na ardhi"],
  ["personal-finance", "Finances personnelles", "Fedha binafsi"],
  ["religious-cultural", "Religion et culture", "Dini na utamaduni"],
  ["salary-tax", "Salaire et fiscalité", "Mshahara na kodi"],
  ["small-business", "Petites entreprises", "Biashara ndogo"],
  ["sports", "Sports", "Michezo"],
  ["telecom", "Télécom", "Mawasiliano"],
  ["trade", "Commerce extérieur", "Biashara ya nje"],
  ["transport", "Transport", "Usafiri na magari"],
  ["travel", "Voyage", "Usafiri na utalii"],
  ["vat-business-tax", "TVA et fiscalité", "VAT na kodi"],
];

function esc(value) {
  return String(value).replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
}
function head(c, title, description, canonical, englishRoute, schema) {
  const fr =
    c.lang === "fr"
      ? canonical
      : englishRoute === "/categories/"
        ? "/fr/categories/"
        : `/fr${englishRoute}`;
  const sw =
    c.lang === "sw"
      ? canonical
      : englishRoute === "/categories/"
        ? "/sw/makundi/"
        : {
            "/advertise/": "/sw/tangaza/",
            "/pricing/": "/sw/bei/",
            "/search/": "/sw/tafuta/",
            "/suggest-tool/": "/sw/pendekeza-zana/",
            "/changelog/": "/sw/mabadiliko/",
          }[englishRoute];
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | AfroTools</title><meta name="description" content="${esc(description)}"><meta property="og:title" content="${esc(title)} | AfroTools"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:url" content="https://afrotools.com${canonical}"><meta property="og:image" content="https://afrotools.com/assets/img/og-default.png"><meta property="og:locale" content="${c.locale}"><link rel="canonical" href="https://afrotools.com${canonical}"><link rel="alternate" hreflang="en" href="https://afrotools.com${englishRoute}"><link rel="alternate" hreflang="fr" href="https://afrotools.com${fr}"><link rel="alternate" hreflang="sw" href="https://afrotools.com${sw}"><link rel="alternate" hreflang="x-default" href="https://afrotools.com${englishRoute}"><link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/localized-institutional.css"><script type="application/ld+json">${JSON.stringify(schema)}</script><script src="/assets/js/components/navbar.js" defer></script><script src="/assets/js/components/footer.js" defer></script>`;
}
function shell(
  c,
  title,
  description,
  canonical,
  englishRoute,
  eyebrow,
  lead,
  body,
  schemaType = "WebPage",
) {
  const schema = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: title,
    description,
    url: `https://afrotools.com${canonical}`,
    inLanguage: c.lang,
  };
  return `<!doctype html><html lang="${c.lang}"><head>${head(c, title, description, canonical, englishRoute, schema)}</head><body class="top-level-page-ui-refresh"><a class="skip-link" href="#main">${c.lang === "fr" ? "Aller au contenu" : "Ruka hadi maudhui"}</a><afro-navbar></afro-navbar><main id="main"><header class="li-hero"><div class="li-wrap"><nav aria-label="${c.lang === "fr" ? "Fil d’Ariane" : "Njia ya ukurasa"}"><a href="${c.root}">${c.home}</a></nav><p class="li-eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p>${esc(lead)}</p></div></header>${body}</main><afro-footer></afro-footer></body></html>\n`;
}
function actions(c) {
  return `<div class="li-actions"><a class="btn btn-primary" href="${c.tools}">${c.browse}</a><a class="btn btn-secondary" href="${c.contact}">${c.lang === "fr" ? "Contacter AfroTools" : "Wasiliana na AfroTools"}</a><a class="btn btn-secondary" href="${c.privacy}">${c.lang === "fr" ? "Confidentialité" : "Faragha"}</a></div>`;
}

function advertise(locale) {
  const c = C[locale],
    fr = locale === "fr";
  const title = fr
    ? "Publicité et partenariats sur AfroTools"
    : "Matangazo na ushirikiano kwenye AfroTools";
  const desc = fr
    ? "Proposez un pilote sponsorisé clairement identifié, mesurable et indépendant des calculs AfroTools."
    : "Pendekeza jaribio la udhamini lenye lebo wazi, vipimo vinavyoeleweka na lisiloathiri hesabu za AfroTools.";
  const fields = fr
    ? [
        ["organisation", "Organisation", "text"],
        ["role", "Fonction du contact", "text"],
        ["contact", "Nom du contact", "text"],
        ["email", "Adresse e-mail", "email"],
        ["website", "Site web", "url"],
        ["markets", "Pays ou marchés visés", "text"],
        ["audience", "Public visé", "text"],
        ["pages", "Pages ou catégories souhaitées", "textarea"],
        ["placement", "Format envisagé", "select"],
        ["cta", "Action proposée aux utilisateurs", "text"],
        ["budget", "Fourchette budgétaire", "select"],
        ["timing", "Période souhaitée", "text"],
        ["assets", "Éléments déjà disponibles", "textarea"],
        ["measurement", "Indicateur de réussite", "textarea"],
        ["compliance", "Contraintes de conformité", "textarea"],
        ["notes", "Autres précisions", "textarea"],
      ]
    : [
        ["organisation", "Shirika", "text"],
        ["role", "Wadhifa wa mawasiliano", "text"],
        ["contact", "Jina la mtu wa mawasiliano", "text"],
        ["email", "Barua pepe", "email"],
        ["website", "Tovuti", "url"],
        ["markets", "Nchi au masoko yanayolengwa", "text"],
        ["audience", "Hadhira inayolengwa", "text"],
        ["pages", "Kurasa au makundi unayotaka", "textarea"],
        ["placement", "Aina ya nafasi", "select"],
        ["cta", "Hatua unayotaka mtumiaji achukue", "text"],
        ["budget", "Kiwango cha bajeti", "select"],
        ["timing", "Kipindi unachotaka", "text"],
        ["assets", "Vifaa ulivyo navyo tayari", "textarea"],
        ["measurement", "Kipimo cha mafanikio", "textarea"],
        ["compliance", "Masharti ya compliance", "textarea"],
        ["notes", "Maelezo mengine", "textarea"],
      ];
  const controls = fields
    .map(([name, label, type]) =>
      type === "textarea"
        ? `<label>${label}<textarea name="${name}" rows="4" required></textarea></label>`
        : type === "select"
          ? `<label>${label}<select name="${name}" required><option value="">—</option><option>pilot</option><option>category</option><option>newsletter</option></select></label>`
          : `<label>${label}<input name="${name}" type="${type}" required></label>`,
    )
    .join("");
  const commercialDepth = fr
    ? `<h2>Informations utiles avant l’envoi</h2><p>Précisez si le clic ouvre une page d’information, un formulaire, une demande de devis ou un achat. Indiquez les pays réellement servis, les conditions d’éligibilité et le responsable du traitement des données. Joignez uniquement des créations dont vous détenez les droits. Une campagne approuvée peut encore être suspendue si sa destination, sa disponibilité ou sa promesse change après la revue.</p>`
    : `<h2>Maelezo muhimu kabla ya kutuma</h2><p>Eleza ikiwa link inafungua ukurasa wa taarifa, fomu, ombi la bei au ununuzi. Taja nchi zinazohudumiwa kweli, masharti ya kustahiki na anayewajibika kwa uchakataji wa data. Ambatisha tu picha na maandishi ambayo una haki ya kutumia. Kampeni iliyokubaliwa inaweza kusimamishwa ikiwa mahali link inapoenda, upatikanaji au ahadi inabadilika baada ya ukaguzi.</p><p>AfroTools itakagua pia mwonekano wa simu, lugha ya lebo ya udhamini, uhusiano kati ya tangazo na ukurasa, na kama mtumiaji anaweza kukataa bila kupoteza zana ya msingi. Ripoti za kampeni zitatumia vipimo vya jumla; maudhui binafsi ya hesabu, hati au workspace hayatatumika kama data ya matangazo.</p>`;
  const body = `<section class="li-section"><div class="li-wrap li-prose"><h2>${fr ? "Commencer par le plus petit pilote utile" : "Anza na jaribio dogo lenye manufaa"}</h2><p>${fr ? "Une proposition solide nomme une page, un marché, une action et une période. Un emplacement payé porte un libellé explicite et ne modifie jamais une formule, un classement, une estimation, une source ou une conclusion." : "Pendekezo zuri hutaja ukurasa, soko, hatua na kipindi. Nafasi inayolipiwa hupewa lebo wazi na haibadilishi kanuni, nafasi, makadirio, chanzo au hitimisho."}</p><div class="li-grid"><article><h3>${fr ? "Outil sponsorisé" : "Zana iliyodhaminiwa"}</h3><p>${fr ? "Soutenir un workflow gratuit avec une marque clairement séparée du résultat." : "Kusaidia workflow ya bure huku chapa ikitenganishwa wazi na matokeo."}</p></article><article><h3>${fr ? "Pilote pays ou catégorie" : "Jaribio la nchi au kundi"}</h3><p>${fr ? "Tester une présence limitée sur un besoin, un pays ou une catégorie définie." : "Jaribu uwepo mdogo kwa hitaji, nchi au kundi lililoainishwa."}</p></article><article><h3>${fr ? "Média et newsletter" : "Media na jarida"}</h3><p>${fr ? "Préparer un contenu identifié comme partenaire, avec objectif et mesure convenus." : "Andaa maudhui yenye lebo ya mshirika, lengo na kipimo kilichokubaliwa."}</p></article></div><h2>${fr ? "La confiance reste indépendante" : "Uaminifu unabaki huru"}</h2><p>${fr ? "Le sponsor ne choisit pas la formule, la source, le niveau de confiance ni l’ordre d’une comparaison. Les demandes de devis, contacts et inscriptions exigent une action volontaire. Aucun paiement ne transforme une donnée obsolète en donnée actuelle." : "Mfadhili hachagui kanuni, chanzo, kiwango cha uhakika wala mpangilio wa ulinganisho. Ombi la bei, mawasiliano na usajili huhitaji hatua ya hiari. Malipo hayafanyi data ya zamani kuwa ya sasa."}</p><h2>${fr ? "Ce que nous vérifions avant un accord" : "Tunachokagua kabla ya makubaliano"}</h2><p>${fr ? "Nous vérifions que la marque, la destination du clic, le marché et la promesse peuvent être décrits sans ambiguïté. Le pilote doit fonctionner sur mobile, respecter le consentement, éviter les affirmations officielles non prouvées et fournir un moyen de mesurer le résultat sans collecter le contenu privé saisi dans un outil. Nous pouvons refuser une campagne qui imite une autorité, cache ses conditions, promet un rendement, influence un classement ou place une inscription devant l’export principal d’un workflow local." : "Tunakagua kuwa chapa, mahali link inapoenda, soko na ahadi vinaweza kuelezwa bila utata. Jaribio lazima lifanye kazi kwa simu, liheshimu idhini, liepuke madai rasmi yasiyothibitishwa na lipime matokeo bila kukusanya maudhui binafsi yaliyoingizwa kwenye zana. Tunaweza kukataa kampeni inayoiga mamlaka, kuficha masharti, kuahidi faida, kuathiri nafasi au kuweka usajili mbele ya export kuu ya workflow ya kifaani."}</p><h2>${fr ? "Envoyer un brief commercial" : "Tuma maelezo ya biashara"}</h2><form name="${locale}-advertise" method="POST" data-netlify="true" netlify-honeypot="bot-field" class="li-form"><input type="hidden" name="form-name" value="${locale}-advertise"><p hidden><label>Bot <input name="bot-field"></label></p><div class="li-grid">${controls}</div><fieldset><legend>${fr ? "Principes obligatoires" : "Kanuni za lazima"}</legend><label><input type="checkbox" name="labelled" required> ${fr ? "Le placement sera clairement identifié comme sponsorisé." : "Nafasi itaandikwa wazi kuwa imedhaminiwa."}</label><label><input type="checkbox" name="independent" required> ${fr ? "Le calcul, la source et le classement resteront indépendants." : "Hesabu, chanzo na nafasi zitabaki huru."}</label><label><input type="checkbox" name="privacy" required> ${fr ? "Aucune donnée sensible ne sera demandée sans consentement explicite." : "Hakuna data nyeti itakayoombwa bila idhini wazi."}</label></fieldset><button class="btn btn-primary" type="submit">${c.submit}</button><p class="li-callout">${fr ? "L’envoi ouvre une revue; il ne garantit ni publication ni partenariat." : "Kutuma huanzisha ukaguzi; hakuhakikishi kuchapishwa au ushirikiano."}</p></form>${actions(c)}</div></section>`;
  return shell(
    c,
    title,
    desc,
    c.advertise,
    "/advertise/",
    fr ? "Partenariats responsables" : "Ushirikiano wenye uwajibikaji",
    desc,
    body.replace(
      `<h2>${fr ? "Envoyer un brief commercial" : "Tuma maelezo ya biashara"}</h2>`,
      `${commercialDepth}<h2>${fr ? "Envoyer un brief commercial" : "Tuma maelezo ya biashara"}</h2>`,
    ),
  );
}

function suggest(locale) {
  const c = C[locale],
    fr = locale === "fr";
  const title = fr
    ? "Suggérer un outil à AfroTools"
    : "Pendekeza zana kwa AfroTools";
  const desc = fr
    ? "Demandez un outil, une couverture pays ou une amélioration avec le contexte nécessaire pour une revue responsable."
    : "Omba zana, nchi au uboreshaji ukiweka muktadha unaohitajika kwa ukaguzi unaowajibika.";
  const reviewDepth = fr
    ? `<h2>Après l’envoi</h2><p>La revue compare la demande au catalogue, à la disponibilité des sources, aux risques de confidentialité et aux formats réellement vérifiables. Une réponse peut demander une précision, proposer un outil existant ou enregistrer la demande dans une file de recherche. N’envoyez pas de mot de passe, de numéro d’identité, de dossier médical, de document client ou de données financières privées.</p>`
    : `<h2>Baada ya kutuma</h2><p>Ukaguzi unalinganisha ombi na katalogi, upatikanaji wa vyanzo, hatari za faragha na aina za faili zinazoweza kuthibitishwa. Jibu linaweza kuomba maelezo zaidi, kupendekeza zana iliyopo au kuweka ombi kwenye foleni ya utafiti. Usitume password, namba ya utambulisho, rekodi ya afya, hati ya mteja au data binafsi ya fedha.</p>`;
  const body = `<section class="li-section"><div class="li-wrap li-prose"><h2>${fr ? "Quel problème faut-il résoudre ?" : "Ni tatizo gani linapaswa kutatuliwa?"}</h2><p>${fr ? "Les demandes les plus utiles décrivent la décision, les entrées disponibles, le résultat attendu, le pays et la preuve officielle ou professionnelle à consulter. Une demande populaire n’est pas automatiquement sûre à publier si la donnée est périmée, non autorisée ou impossible à vérifier." : "Maombi yenye manufaa hueleza uamuzi, ingizo lililopo, matokeo yanayotakiwa, nchi na ushahidi rasmi au wa kitaalamu wa kukagua. Ombi maarufu halichapishwi moja kwa moja ikiwa data imepitwa na wakati, hairuhusiwi au haiwezi kuthibitishwa."}</p><h2>${fr ? "Donner assez de contexte pour une vraie décision" : "Toa muktadha wa kutosha kwa uamuzi halisi"}</h2><p>${fr ? "Indiquez ce que la personne connaît au départ, ce qu’elle doit pouvoir modifier, ce que le résultat doit expliquer et quels formats elle doit conserver. Pour une taxe, une prestation, une échéance, un prix ou une règle, ajoutez la page officielle et la date consultée. Pour un document sensible, précisez si le travail peut rester entièrement dans le navigateur. Une suggestion peut mener à une recherche, à un prototype, à une demande de source supplémentaire ou à un refus documenté; l’envoi ne promet ni date ni publication." : "Eleza mtumiaji anachojua mwanzoni, anachopaswa kubadilisha, matokeo yanachopaswa kueleza na aina za faili anazohitaji. Kwa kodi, malipo, deadline, bei au kanuni, ongeza ukurasa rasmi na tarehe uliyokagua. Kwa hati nyeti, eleza kama kazi inaweza kubaki kabisa kwenye kivinjari. Pendekezo linaweza kupelekea utafiti, prototype, ombi la chanzo kingine au kukataliwa kwa sababu iliyoandikwa; kutuma hakuahidi tarehe wala kuchapishwa."}</p><form name="${locale}-suggest-tool" method="POST" data-netlify="true" netlify-honeypot="bot-field" class="li-form"><input type="hidden" name="form-name" value="${locale}-suggest-tool"><p hidden><label>Bot <input name="bot-field"></label></p><label>${fr ? "Nom de l’outil" : "Jina la zana"}<input name="tool-name" required></label><div class="li-grid"><label>${c.categoryLabel}<select name="category" required><option value="">—</option>${CATEGORY_ROWS.map((r) => `<option value="${r[0]}">${fr ? r[1] : r[2]}</option>`).join("")}</select></label><label>${c.countryLabel}<input name="country"></label></div><label>${fr ? "Décrivez le workflow, les entrées et le résultat" : "Eleza workflow, ingizo na matokeo"}<textarea name="description" rows="6" required></textarea></label><label>${fr ? "Source ou autorité à vérifier" : "Chanzo au mamlaka ya kukagua"}<input name="source-url" type="url"></label><label>${fr ? "Qui l’utiliserait ?" : "Nani atatumia?"}<input name="audience" required></label><label>${fr ? "Exemple de résultat attendu" : "Mfano wa matokeo yanayotarajiwa"}<textarea name="example" rows="3"></textarea></label><label>${fr ? "Votre e-mail (facultatif)" : "Barua pepe yako (si unataka)"}<input name="email" type="email" autocomplete="email"></label><fieldset><legend>${fr ? "Priorité" : "Kipaumbele"}</legend><label><input type="radio" name="priority" value="urgent"> ${fr ? "Besoin urgent" : "Nahitaji haraka"}</label><label><input type="radio" name="priority" value="useful" checked> ${fr ? "Utile prochainement" : "Itakuwa na manufaa"}</label><label><input type="radio" name="priority" value="idea"> ${fr ? "Idée à étudier" : "Wazo la kukaguliwa"}</label></fieldset><button class="btn btn-primary" type="submit">${c.submit}</button></form><h2>${fr ? "Comment les demandes sont évaluées" : "Maombi yanakaguliwaje"}</h2><div class="li-grid"><article><h3>${fr ? "Utilité" : "Manufaa"}</h3><p>${fr ? "Le problème doit être concret, fréquent et compréhensible." : "Tatizo linapaswa kuwa halisi, la kawaida na linaloeleweka."}</p></article><article><h3>${fr ? "Preuve" : "Ushahidi"}</h3><p>${fr ? "Les règles, tarifs et calendriers variables exigent une source et une date de revue." : "Kanuni, viwango na ratiba zinazobadilika zinahitaji chanzo na tarehe ya ukaguzi."}</p></article><article><h3>${fr ? "Confidentialité" : "Faragha"}</h3><p>${fr ? "Un workflow sensible doit fonctionner localement ou demander un consentement explicite avant tout envoi." : "Workflow nyeti lazima ifanye kazi kifaani au iombe idhini wazi kabla ya kutuma."}</p></article></div>${actions(c)}</div></section>`;
  return shell(
    c,
    title,
    desc,
    c.suggest,
    "/suggest-tool/",
    fr ? "Construire ce qui manque" : "Jenga kinachokosekana",
    desc,
    body.replace("<form name=", `${reviewDepth}<form name=`),
  );
}

function pricing(locale) {
  const c = C[locale],
    fr = locale === "fr";
  const title = fr
    ? "Tarifs AfroTools : gratuit et Pro"
    : "Bei za AfroTools: Bure na Pro";
  const desc = fr
    ? "Comparez le catalogue public gratuit avec les fonctions Pro réellement disponibles, avant toute souscription."
    : `Linganisha zana za umma za bure na vipengele vya Pro vinavyopatikana kabla ya kulipia. Bei za Kenya zilizoonyeshwa: ${monthlyKes} kwa mwezi au ${annualKes} kwa mwaka. Hatua ya sasa ya malipo ni ya Kiingereza.`;
  const body = `<section class="li-section"><div class="li-wrap li-prose"><p class="li-callout">${fr ? "Les calculateurs publics essentiels restent accessibles sans abonnement payant. Pro ne transforme pas un aperçu, une source périmée ou une fonction annoncée comme indisponible en produit actif." : "Vikokotoo muhimu vya umma vinapatikana bila usajili wa kulipia. Pro haibadilishi preview, chanzo kilichopitwa na wakati au kipengele kisichopatikana kuwa bidhaa hai."}</p><div class="li-grid"><article><p class="li-eyebrow">${fr ? "Gratuit" : "Bure"}</p><h2>$0</h2><p>${fr ? "Accès aux workflows publics, calculs locaux, guides et exports annoncés sur chaque page. Aucun compte ne doit bloquer l’export principal d’un outil local sensible." : "Ufikiaji wa workflows za umma, hesabu za kifaani, miongozo na faili zilizoelezwa kwenye kila ukurasa. Akaunti haipaswi kuzuia export kuu ya zana nyeti ya kifaani."}</p><form action="${c.tools}"><button class="btn btn-primary" type="submit">${c.browse}</button></form></article><article><p class="li-eyebrow">Pro</p><h2>${fr ? "À partir de 5 $/mois" : "Kuanzia $5/mwezi"}</h2><p>${fr ? "La disponibilité dépend du registre Pro actif. Les espaces en aperçu restent signalés comme aperçus; les limites de compte, d’API et de synchronisation sont affichées avant l’achat." : "Upatikanaji hutegemea registry hai ya Pro. Workspaces za preview hubaki na lebo ya preview; mipaka ya akaunti, API na usawazishaji huonyeshwa kabla ya kununua."}</p><a class="btn btn-secondary" href="/pro/">${fr ? "Vérifier les fonctions Pro" : "Kagua vipengele vya Pro"}</a></article></div><h2>${fr ? "Comparer avant de payer" : "Linganisha kabla ya kulipa"}</h2><div class="li-grid"><article><h3>${fr ? "Outils publics" : "Zana za umma"}</h3><p>${fr ? "Chaque page décrit ses entrées, son moteur, ses sources, sa confidentialité et ses formats. Ces fonctions ne deviennent pas plus officielles avec un abonnement." : "Kila ukurasa hueleza ingizo, engine, vyanzo, faragha na aina za faili. Vipengele hivi havifanyiki rasmi zaidi kwa kulipia."}</p></article><article><h3>${fr ? "Compte et synchronisation" : "Akaunti na usawazishaji"}</h3><p>${fr ? "Une fonction de compte peut enregistrer ou synchroniser un espace uniquement lorsqu’elle est réellement activée. Un brouillon local reste sur l’appareil sauf action et consentement explicites." : "Kipengele cha akaunti kinaweza kuhifadhi au kusawazisha workspace tu kikiwa hai. Rasimu ya kifaani hubaki kwenye kifaa isipokuwa mtumiaji achague na akubali kutuma."}</p></article><article><h3>API</h3><p>${fr ? "Les quotas API et accès partenaires sont des contrats séparés. Vérifiez le plan, la limite, l’authentification et la politique de données applicables." : "Viwango vya API na ufikiaji wa washirika ni mikataba tofauti. Kagua mpango, kikomo, uthibitishaji na sera ya data inayotumika."}</p></article></div><h2>${fr ? "Questions avant l’abonnement" : "Maswali kabla ya kulipia"}</h2><details><summary>${fr ? "Puis-je utiliser les outils gratuits sans carte ?" : "Naweza kutumia zana za bure bila kadi?"}</summary><p>${fr ? "Oui pour le cœur du catalogue public. Une fonction qui nécessite un compte ou un paiement doit l’annoncer avant l’action." : "Ndiyo kwa kiini cha katalogi ya umma. Kipengele kinachohitaji akaunti au malipo lazima kieleze kabla ya hatua."}</p></details><details><summary>${fr ? "Un abonnement garantit-il des données actuelles ?" : "Usajili unahakikisha data ni ya sasa?"}</summary><p>${fr ? "Non. La source, la date et l’état de confiance restent propres à chaque workflow." : "Hapana. Chanzo, tarehe na hali ya uhakika hutegemea kila workflow."}</p></details>${actions(c)}</div></section>`;
  return shell(
    c,
    title,
    desc,
    c.pricing,
    "/pricing/",
    fr ? "Choisir avec clarté" : "Chagua kwa uwazi",
    desc,
    body,
  ).replaceAll("workflows", locale === "sw" ? "mipangilio ya kazi" : "workflows")
    .replaceAll("workflow", locale === "sw" ? "mtiririko wa kazi" : "workflow")
    .replaceAll("preview", locale === "sw" ? "jaribio" : "preview");
}

function search(locale) {
  const c = C[locale],
    fr = locale === "fr";
  const title = fr ? "Rechercher dans AfroTools" : "Tafuta ndani ya AfroTools";
  const desc = fr
    ? "Recherchez un outil par tâche, pays et catégorie dans le catalogue français."
    : "Tafuta zana kwa kazi, nchi na kundi ndani ya katalogi ya Kiswahili.";
  const body = `<section class="li-section"><div class="li-wrap li-prose"><form class="li-form" action="${c.tools}" method="get" role="search"><label>${fr ? "Tâche ou outil" : "Kazi au zana"}<input name="q" type="search" required autocomplete="off" placeholder="${fr ? "Ex. salaire net Sénégal, fusion PDF" : "Mfano: mshahara Kenya, unganisha PDF"}"></label><div class="li-grid"><label>${c.categoryLabel}<select name="category"><option value="">${fr ? "Toutes les catégories" : "Makundi yote"}</option>${CATEGORY_ROWS.map((r) => `<option value="${r[0]}">${fr ? r[1] : r[2]}</option>`).join("")}</select></label><label>${c.countryLabel}<input name="country" placeholder="${fr ? "Ex. Kenya" : "Mfano: Kenya"}"></label></div><button class="btn btn-primary" type="submit">${fr ? "Afficher les résultats" : "Onyesha matokeo"}</button></form><h2>${fr ? "Mieux décrire la décision" : "Eleza uamuzi vizuri"}</h2><p>${fr ? "Cherchez le résultat souhaité plutôt qu’un mot vague : calculer un salaire net, préparer un PDF, comparer des coûts saisis ou vérifier une démarche. Ajoutez le pays lorsque la loi, la devise, l’autorité ou la date peut changer le résultat." : "Tafuta matokeo unayotaka badala ya neno pana: kokotoa mshahara neti, andaa PDF, linganisha gharama ulizoingiza au kagua hatua rasmi. Ongeza nchi ikiwa sheria, sarafu, mamlaka au tarehe inaweza kubadilisha matokeo."}</p>${actions(c)}</div></section>`;
  return shell(
    c,
    title,
    desc,
    c.search,
    "/search/",
    fr ? "Trouver le bon workflow" : "Pata workflow sahihi",
    desc,
    body,
    "SearchResultsPage",
  );
}

function categories(locale) {
  const c = C[locale],
    fr = locale === "fr";
  const title = fr
    ? "Toutes les catégories AfroTools"
    : "Makundi yote ya AfroTools";
  const desc = fr
    ? "Explorez les 32 catégories AfroTools avec une recherche locale et des liens vers les catalogues français."
    : "Vinjari makundi 32 ya AfroTools kwa utafutaji wa kifaani na viungo vya katalogi ya Kiswahili.";
  const cards = CATEGORY_ROWS.map(
    ([slug, frName, swName]) =>
      `<article class="li-card" data-category-card data-search="${esc(`${slug} ${fr ? frName : swName}`.toLowerCase())}"><h2>${esc(fr ? frName : swName)}</h2><p>${fr ? "Ouvrir les outils, guides et preuves disponibles dans cette catégorie." : "Fungua zana, miongozo na ushahidi unaopatikana kwenye kundi hili."}</p><a href="${c.tools}?category=${slug}">${fr ? "Voir les outils" : "Ona zana"}</a></article>`,
  ).join("");
  const body = `<section class="li-section"><div class="li-wrap"><form class="li-form" role="search" onsubmit="return false"><label>${fr ? "Filtrer les catégories" : "Chuja makundi"}<input type="search" data-category-search autocomplete="off"></label><button type="button" class="btn btn-secondary" data-category-reset>${c.reset}</button><p data-category-status role="status" aria-live="polite"></p></form><div class="li-grid">${cards}</div>${actions(c)}</div></section><script>(function(){var q=document.querySelector('[data-category-search]'),cards=[].slice.call(document.querySelectorAll('[data-category-card]')),s=document.querySelector('[data-category-status]');function draw(){var v=q.value.trim().toLowerCase(),n=0;cards.forEach(function(card){var show=!v||card.dataset.search.indexOf(v)>=0;card.hidden=!show;if(show)n++;});s.textContent=n+' ${fr ? "catégorie(s) affichée(s)" : "kundi limeonyeshwa"}';}q.addEventListener('input',draw);document.querySelector('[data-category-reset]').addEventListener('click',function(){q.value='';draw();q.focus();});draw();})();</script>`;
  return shell(
    c,
    title,
    desc,
    c.categories,
    "/categories/",
    fr ? "32 domaines de travail" : "Makundi 32 ya kazi",
    desc,
    body,
    "CollectionPage",
  );
}

function changelog(locale) {
  const c = C[locale], fr = locale === "fr";
  const rows = fr ? [
    ["v2.12.0", "18 juin 2026", "SEO et registres", "Les familles de sitemaps publics ont été régénérées, les annuaires issus du registre ont été reconstruits et les anciens alias internes ont été réparés. Les données structurées agricoles ont aussi été alignées sur les URL canoniques sans extension."],
    ["v2.11.0", "3 mai 2026", "Résilience et espaces de compte", "Les requêtes IA ont reçu des limites d’entrée communes, les fonctions internes Supabase sensibles ont été restreintes au service et les routes d’espace de travail ont été préparées. La déconnexion efface désormais les variantes de cookies de session concernées."],
    ["v2.10.0", "10 avril 2026", "Comptage des outils", "Le comptage distingue les entrées du registre, les URL uniques et les variantes pays sans les compter deux fois. Les textes publics ont été synchronisés avec le résultat de l’audit au lieu de conserver d’anciens totaux saisis à la main."],
    ["v2.9.0", "28 mars 2026", "Sécurité et couverture", "La migration progressive vers des cookies HttpOnly a été ajoutée avec repli contrôlé. Les images sociales de catégories et pays ont été étendues, la passerelle de données agricoles a reçu un cache avec état visible, et plusieurs workflows ont été audités."],
    ["v2.8.0", "27 mars 2026", "Registre et langues", "Des pages déjà présentes mais absentes du registre ont rejoint l’annuaire. Le swahili a été déclaré comme langue publique supplémentaire, les nombres affichés ont été corrigés et le registre minifié a été reconstruit depuis sa source lisible."],
    ["v2.7.0", "26 mars 2026", "Hubs swahili", "De nouveaux hubs de catégories en swahili ont été publiés, les anciens slugs ont reçu des redirections ordonnées et les métadonnées de transition ont été complétées. La couverture d’images sociales françaises a également été étendue."],
    ["v2.6.1", "26 mars 2026", "Correctifs PAYE", "Des champs propres à la Tanzanie qui se propageaient vers d’autres profils ont été retirés. Les exports PDF concernés ont été réparés et plusieurs chemins français ont été resynchronisés avec leur propriétaire canonique."],
    ["v2.6.0", "26 mars 2026", "SEO et performance", "Les images Open Graph dynamiques, les règles de préchargement progressif, les schémas HowTo et Organization et les liens d’outils associés ont été renforcés. Le chargement critique et les en-têtes de sécurité ont été revus comme améliorations progressives."],
    ["v2.5.0", "26 mars 2026", "Lancement swahili", "La première surface swahili a ouvert avec une page d’accueil, des hubs pays et des calculateurs PAYE pour l’Afrique de l’Est. Sept utilitaires français et plusieurs calculateurs PAYE francophones ont été ajoutés avec des comparaisons pays à pays."],
    ["v2.4.0", "25 mars 2026", "Suite agriculture", "Des calculateurs d’élevage, d’aquaculture, de transformation du manioc, d’alimentation animale, de récolte et de serre ont été ajoutés. Les hypothèses et données locales doivent toujours être relues sur la page de chaque workflow."],
  ] : [
    ["v2.12.0", "18 Juni 2026", "SEO na registry", "Familia za sitemap za umma zilijengwa upya, directory zinazotegemea registry zikasawazishwa na alias za zamani za link zikarekebishwa. Structured data ya kilimo pia ililinganishwa na njia canonical zisizo na kiendelezi cha .html."],
    ["v2.11.0", "3 Mei 2026", "Uthabiti na workspace", "Maombi ya AI yalipewa mipaka ya kawaida ya ingizo, functions nyeti za Supabase zikazuiwa kwa service role, na routes za workspace ya akaunti zikaandaliwa. Kuondoka kwenye akaunti sasa husafisha aina husika za cookies za session."],
    ["v2.10.0", "10 Aprili 2026", "Hesabu za zana", "Mfumo wa kuhesabu unatenganisha entries za registry, URL za kipekee na variants za nchi bila kuhesabu mara mbili. Maandishi ya umma yalisawazishwa na audit badala ya kuendelea kutumia jumla za zamani zilizoandikwa kwa mkono."],
    ["v2.9.0", "28 Machi 2026", "Usalama na coverage", "Uhamisho wa hatua kwa hatua kwenda HttpOnly cookies uliongezwa pamoja na fallback inayodhibitiwa. Picha za kijamii za makundi na nchi zilipanuliwa, daraja la data ya kilimo likapata cache yenye hali inayoonekana, na workflows kadhaa zikakaguliwa."],
    ["v2.8.0", "27 Machi 2026", "Registry na lugha", "Kurasa zilizokuwepo lakini hazikuwa kwenye registry ziliingizwa kwenye directory. Kiswahili kilitangazwa kama lugha ya umma, hesabu zilizoonekana zikarekebishwa na registry iliyominifywa ikajengwa kutoka source inayosomeka."],
    ["v2.7.0", "26 Machi 2026", "Vitovu vya Kiswahili", "Vitovu vipya vya makundi ya Kiswahili vilichapishwa, slugs za zamani zikapewa redirects zenye mpangilio sahihi na metadata ya transitions ikakamilishwa. Coverage ya picha za kijamii za Kifaransa pia ilipanuliwa."],
    ["v2.6.1", "26 Machi 2026", "Marekebisho ya PAYE", "Fields za Tanzania zilizokuwa zinaingia kwenye profiles za nchi nyingine ziliondolewa. Exports za PDF zilizohusika zikarekebishwa na routes kadhaa za Kifaransa zikasawazishwa na owner wake canonical."],
    ["v2.6.0", "26 Machi 2026", "SEO na performance", "Picha dynamic za Open Graph, progressive preload rules, schema za HowTo na Organization pamoja na related-tool links ziliimarishwa. Critical loading na security headers zilikaguliwa kama maboresho ya hatua kwa hatua."],
    ["v2.5.0", "26 Machi 2026", "Uzinduzi wa Kiswahili", "Surface ya kwanza ya Kiswahili ilifunguliwa ikiwa na homepage, country hubs na vikokotoo vya PAYE vya Afrika Mashariki. Zana saba za Kifaransa na vikokotoo vya nchi zinazozungumza Kifaransa viliongezwa pamoja na ulinganisho wa nchi."],
    ["v2.4.0", "25 Machi 2026", "Suite ya kilimo", "Vikokotoo vya kuku, samaki, usindikaji wa muhogo, chakula cha mifugo, tarehe ya mavuno na greenhouse viliongezwa. Dhana na data za eneo lazima zikaguliwe kwenye ukurasa wa kila workflow kabla ya uamuzi."],
  ];
  const title = fr ? "Journal des mises à jour AfroTools" : "Rekodi ya mabadiliko ya AfroTools";
  const desc = fr ? "Suivez les principales versions AfroTools dans un journal français vérifiable relié à l’archive anglaise." : "Fuata matoleo muhimu ya AfroTools katika rekodi ya Kiswahili inayounganishwa na archive ya Kiingereza.";
  const entries = rows.map(([version,date,topic,text]) => `<article class="li-card" data-change-entry data-search="${esc(`${version} ${date} ${topic} ${text}`.toLowerCase())}"><p class="li-eyebrow">${esc(version)} · ${esc(date)}</p><h2>${esc(topic)}</h2><p>${esc(text)}</p><a href="/changelog/#${version.toLowerCase().replace(/\./g,"-")}">${fr ? "Ouvrir l’entrée anglaise complète" : "Fungua rekodi kamili ya Kiingereza"}</a></article>`).join("");
  const body = `<section class="li-section"><div class="li-wrap li-prose"><p class="li-callout">${fr ? "Ce journal localise les résumés vérifiés; l’archive anglaise conserve le détail technique complet de chaque version." : "Rekodi hii inatafsiri muhtasari uliokaguliwa; archive ya Kiingereza inahifadhi maelezo kamili ya kiufundi ya kila toleo."}</p><form class="li-form" role="search" onsubmit="return false"><label>${fr ? "Filtrer les versions" : "Chuja matoleo"}<input type="search" data-change-search autocomplete="off"></label><button class="btn btn-secondary" type="button" data-change-reset>${c.reset}</button><p data-change-status role="status" aria-live="polite"></p></form><div class="li-grid">${entries}</div><h2>${fr ? "Méthode et limites" : "Mbinu na mipaka"}</h2><p>${fr ? "Les résumés reprennent les versions publiées dans l’archive source. Ils décrivent le travail livré, mais ne remplacent pas les preuves de déploiement, les tests de production ou l’état actuel d’une source externe. Consultez la page du produit et ses dates pour une décision présente." : "Muhtasari unatokana na matoleo yaliyorekodiwa kwenye source archive. Unaeleza kazi iliyotolewa lakini haubadilishi ushahidi wa deployment, tests za production au hali ya sasa ya chanzo cha nje. Kagua ukurasa wa bidhaa na tarehe zake kwa uamuzi wa sasa."}</p>${actions(c)}</div></section><script>(function(){var q=document.querySelector('[data-change-search]'),rows=[].slice.call(document.querySelectorAll('[data-change-entry]')),s=document.querySelector('[data-change-status]');function draw(){var v=q.value.trim().toLowerCase(),n=0;rows.forEach(function(row){var show=!v||row.dataset.search.indexOf(v)>=0;row.hidden=!show;if(show)n++;});s.textContent=n+' ${fr ? "version(s) affichée(s)" : "toleo limeonyeshwa"}';}q.addEventListener('input',draw);document.querySelector('[data-change-reset]').addEventListener('click',function(){q.value='';draw();q.focus();});draw();})();</script>`;
  return shell(c,title,desc,c.changelog,"/changelog/",fr ? "Historique vérifiable" : "Historia inayoweza kukaguliwa",desc,body,"CollectionPage");
}

function renderAll(locale) {
  const pages = {
    advertise: advertise(locale),
    suggest: suggest(locale),
    pricing: pricing(locale),
    search: search(locale),
    categories: categories(locale),
    changelog: changelog(locale),
  };
  if (locale === "sw") {
    for (const key of Object.keys(pages)) pages[key] = pages[key]
      .replaceAll("Workflow", "Mtiririko wa kazi")
      .replaceAll("workflows", "mipangilio ya kazi")
      .replaceAll("workflow", "mtiririko wa kazi")
      .replaceAll("developer", "wasanidi programu")
      .replaceAll("preview", "jaribio");
  }
  return pages;
}

module.exports = { C, renderAll, localizedGeneratorEquivalent };
