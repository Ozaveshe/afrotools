"use strict";

const MARKER_START = "<!-- LOCALIZED-CATEGORY-STANDARD:START -->";
const MARKER_END = "<!-- LOCALIZED-CATEGORY-STANDARD:END -->";

const ROUTES = {
  fr: ["agriculture", "climat-environnement", "creative", "crypto", "lifestyle", "developer-tools", "document-pdf", "ecommerce", "education", "energy", "ingenierie", "fintech", "gouvernement", "health", "hr-payroll", "image-design", "insurance", "language", "legal", "mining", "mortgage-property", "personal-finance", "salary-tax", "small-business", "sports", "telecom", "trade", "transport", "travel", "vat-business-tax"].map((slug) => `fr/${slug}/index.html`),
  sw: ["kilimo", "kazi-na-ajira", "hali-ya-hewa-na-mazingira", "ubunifu-na-watayarishi", "data-na-tija", "zana-za-developer", "hati-na-pdf", "elimu", "nishati-na-huduma", "ujenzi-na-uhandisi", "fintech", "serikali-na-nyaraka", "afya", "picha-na-design", "bima", "lugha-na-tafsiri", "biashara-na-uzingatiaji", "nyumba-na-ardhi", "dini-na-utamaduni", "mshahara-na-kodi", "biashara-ndogo", "michezo", "mawasiliano-na-mtandao", "biashara-ya-nje", "usafiri-na-magari", "usafiri-utalii", "vat-na-kodi"].map((slug) => `sw/${slug}/index.html`)
};

function visible(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/&amp;/gi, "&").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
}

function titleFrom(html, locale) {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return visible(h1 && h1[1]) || (locale === "fr" ? "cette catégorie" : "kundi hili");
}

function strip(html) {
  const start = html.indexOf(MARKER_START);
  const end = html.indexOf(MARKER_END);
  if (start < 0 || end < start) return html;
  const before = html.slice(0, start).replace(/\s+$/, '');
  const after = html.slice(end + MARKER_END.length).replace(/^\s+/, '');
  return `${before}${after}`;
}

function block(locale, title) {
  const fr = locale === "fr";
  const route = fr ? "/fr/all-tools/" : "/sw/zana-zote/";
  const links = fr
    ? [["/fr/", "Accueil"], ["/fr/all-tools/", "Toutes les applications"], ["/fr/categories/", "Catégories"], ["/fr/countries/", "Pays"], ["/fr/blog/", "Guides"], ["/fr/salary-tax/", "Salaire et fiscalité"], ["/fr/document-pdf/", "Documents et PDF"], ["/fr/agriculture/", "Agriculture"], ["/fr/energy/", "Énergie"], ["/fr/trade/", "Commerce"], ["/fr/transport/", "Transport"], ["/fr/contact/", "Contact"], ["/fr/about/", "À propos"], ["/fr/privacy/", "Confidentialité"]]
    : [["/sw/", "Mwanzo"], ["/sw/zana-zote/", "Zana zote"], ["/sw/nchi/", "Nchi"], ["/sw/blogu/", "Miongozo"], ["/sw/mshahara-na-kodi/", "Mshahara na kodi"], ["/sw/hati-na-pdf/", "Hati na PDF"], ["/sw/kilimo/", "Kilimo"], ["/sw/nishati-na-huduma/", "Nishati"], ["/sw/biashara-ya-nje/", "Biashara ya nje"], ["/sw/usafiri-na-magari/", "Usafiri"], ["/sw/wasiliana/", "Mawasiliano"], ["/sw/kuhusu/", "Kuhusu"], ["/sw/faragha/", "Faragha"], ["/sw/maswali-ya-mara-kwa-mara/", "Maswali"]];
  const faq = fr
    ? [["Comment choisir le bon outil ?", "Commencez par le pays, la décision et le format de sortie. Comparez ensuite les entrées et les limites affichées par chaque workflow."], ["Les résultats sont-ils officiels ?", "Non. Ils servent à préparer et vérifier une décision. Une autorité, un professionnel ou un fournisseur confirme l’étape finale."], ["Comment reconnaître une donnée ancienne ?", "Contrôlez la date, la source et la limite de fraîcheur. Si elles manquent, remplacez la valeur par une hypothèse actuelle ou demandez une confirmation."], ["Mes données restent-elles privées ?", "Consultez la notice du workflow. Les traitements locaux restent dans le navigateur; tout envoi réseau ou usage d’IA doit être séparé et explicite."], ["Que faut-il conserver ?", "Gardez les entrées, hypothèses, sources, dates et fichiers exportés afin qu’une autre personne puisse reproduire le résultat."]]
    : [["Nichaguaje zana sahihi?", "Anza na nchi, uamuzi na aina ya faili unayotaka. Kisha linganisha ingizo na mipaka ya kila workflow."], ["Matokeo ni rasmi?", "Hapana. Yanasaidia kupanga na kukagua. Mamlaka, mtaalamu au mtoa huduma huthibitisha hatua ya mwisho."], ["Nitajuaje data ni ya zamani?", "Kagua tarehe, chanzo na mpaka wa freshness. Vikikosekana, tumia dhana ya sasa au pata uthibitisho."], ["Data yangu ni ya faragha?", "Soma maelezo ya workflow. Kazi ya ndani hubaki kwenye kivinjari; kutuma mtandaoni au kutumia AI lazima kuwe hatua tofauti ya wazi."], ["Nihifadhi ushahidi gani?", "Hifadhi ingizo, dhana, chanzo, tarehe na faili ili mtu mwingine aweze kurudia matokeo."]];
  const schema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([name, answer]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text: answer } })) };
  return `${MARKER_START}<section class="localized-category-standard" aria-labelledby="localizedCategoryStandardTitle"><div class="localized-category-standard__wrap"><p class="localized-category-standard__eyebrow">${fr ? "Méthode AfroTools" : "Mbinu ya AfroTools"}</p><h2 id="localizedCategoryStandardTitle">${fr ? `Bien utiliser ${title}` : `Tumia ${title} kwa ushahidi`}</h2><p>${fr ? `Cette page réunit les workflows publiés pour ${title}. Le nombre de cartes ne suffit pas à choisir : le pays, la période, la source, la confidentialité et le format de sortie déterminent si un outil convient à votre décision.` : `Ukurasa huu unakusanya workflow zilizochapishwa kwa ${title}. Idadi ya kadi haitoshi kuchagua: nchi, kipindi, chanzo, faragha na aina ya faili huamua kama zana inafaa kwa uamuzi wako.`}</p><div class="localized-category-standard__grid"><article><h3>${fr ? "1. Définir la décision" : "1. Taja uamuzi"}</h3><p>${fr ? "Écrivez le résultat attendu, la personne qui le recevra et l’échéance. Choisissez ensuite un workflow dont les entrées correspondent réellement à cette tâche." : "Andika matokeo unayotaka, anayeyapokea na tarehe ya mwisho. Chagua workflow yenye ingizo linalolingana na kazi hiyo."}</p></article><article><h3>${fr ? "2. Choisir le contexte" : "2. Chagua muktadha"}</h3><p>${fr ? "Le pays, la devise ou la langue ne prouvent pas à eux seuls la juridiction. Vérifiez l’autorité, la période et le type d’utilisateur indiqués." : "Nchi, sarafu au lugha pekee hazithibitishi mamlaka. Kagua mamlaka, kipindi na aina ya mtumiaji iliyoonyeshwa."}</p></article><article><h3>${fr ? "3. Contrôler la source" : "3. Kagua chanzo"}</h3><p>${fr ? "Ouvrez les références datées lorsque le résultat dépend d’un taux, d’un prix, d’une règle ou d’une disponibilité qui peut changer." : "Fungua marejeo yenye tarehe wakati matokeo yanategemea kiwango, bei, sheria au upatikanaji unaoweza kubadilika."}</p></article><article><h3>${fr ? "4. Tester les hypothèses" : "4. Jaribu dhana"}</h3><p>${fr ? "Remplacez les valeurs indicatives par vos données, un devis actuel ou une source officielle. Comparez au moins un scénario bas, central et haut." : "Badilisha thamani za mfano kwa data yako, nukuu ya sasa au chanzo rasmi. Linganisha hali ya chini, ya kawaida na ya juu."}</p></article><article><h3>${fr ? "5. Rouvrir la sortie" : "5. Fungua faili tena"}</h3><p>${fr ? "Un export n’est utile que s’il s’ouvre, conserve les entrées et peut être relu. Comparez le PDF, JSON, CSV, image ou texte avec l’écran." : "Faili ni muhimu ikiwa inafunguka, inahifadhi ingizo na inaweza kukaguliwa. Linganisha PDF, JSON, CSV, picha au maandishi na skrini."}</p></article><article><h3>${fr ? "6. Faire confirmer l’action" : "6. Thibitisha hatua"}</h3><p>${fr ? "Avant un dépôt, un paiement, un contrat, un soin ou un achat important, demandez la confirmation de l’autorité ou du professionnel compétent." : "Kabla ya filing, malipo, mkataba, huduma ya afya au ununuzi mkubwa, pata uthibitisho wa mamlaka au mtaalamu."}</p></article></div><form class="localized-category-standard__search" action="${route}" method="get"><label for="localizedCategorySearch">${fr ? "Rechercher un workflow dans le catalogue français" : "Tafuta workflow kwenye orodha ya Kiswahili"}</label><div><input id="localizedCategorySearch" name="q" type="search" placeholder="${fr ? "Décrivez la tâche, le pays ou le fichier" : "Eleza kazi, nchi au faili"}"><button class="btn btn-primary" type="submit">${fr ? "Rechercher" : "Tafuta"}</button></div></form><h2>${fr ? "Questions avant de commencer" : "Maswali kabla ya kuanza"}</h2><div class="localized-category-standard__faq">${faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div><h2>${fr ? "Continuer la découverte" : "Endelea kutafuta"}</h2><nav class="localized-category-standard__links" aria-label="${fr ? "Liens de découverte" : "Viungo vya kutafuta"}">${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}</nav><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script></div></section>${MARKER_END}`;
}

function enhanceCategory(html, locale) {
  let output = strip(html);
  if (!/localized-category-standard\.css/.test(output)) output = output.replace(/<\/head>/i, '<link rel="stylesheet" href="/assets/css/localized-category-standard.css"></head>');
  const content = block(locale, titleFrom(output, locale));
  const mainAt = output.toLowerCase().lastIndexOf("</main>");
  if (mainAt >= 0) {
    const before = output.slice(0, mainAt).replace(/\s+$/, '');
    const after = output.slice(mainAt).replace(/^\s+/, '');
    return `${before}\n${content}\n${after}`;
  }
  return output.replace(/\s*<\/body>/i, `\n${content}\n</body>`);
}

module.exports = { enhanceCategory, ROUTES };
