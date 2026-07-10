#!/usr/bin/env node
"use strict";

/**
 * repair-fr-solar-country-pages.js
 *
 * Translates the 54 fr/tools/roi-solaire/<country>/ pages, which shipped with
 * an English template body under a French shell. Applies:
 *   1. sentence-level replacements (exact + regex with number/currency captures)
 *   2. an EN -> FR country-name map with correct locative prepositions
 *   3. JSON-LD url corrections (/tools/solar-roi/x -> /fr/tools/roi-solaire/x)
 *
 * Scope: text nodes + JSON-LD only. Plain <script> blocks are never touched —
 * the calculator engine matches countryName strings for logic.
 *
 * Usage: node scripts/repair-fr-solar-country-pages.js [--fix]
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "fr", "tools", "roi-solaire");
const APPLY = process.argv.includes("--fix");

// [english, french, locative("in X")] — longest english names first at build time.
const COUNTRIES = [
  ["Central African Republic", "République centrafricaine", "en République centrafricaine"],
  ["São Tomé &amp; Príncipe", "São Tomé-et-Príncipe", "à São Tomé-et-Príncipe"],
  ["São Tomé & Príncipe", "São Tomé-et-Príncipe", "à São Tomé-et-Príncipe"],
  ["Equatorial Guinea", "Guinée équatoriale", "en Guinée équatoriale"],
  ["Republic of Congo", "République du Congo", "en République du Congo"],
  ["Guinea-Bissau", "Guinée-Bissau", "en Guinée-Bissau"],
  ["South Africa", "Afrique du Sud", "en Afrique du Sud"],
  ["South Sudan", "Soudan du Sud", "au Soudan du Sud"],
  ["Burkina Faso", "Burkina Faso", "au Burkina Faso"],
  ["Sierra Leone", "Sierra Leone", "en Sierra Leone"],
  ["Cape Verde", "Cap-Vert", "au Cap-Vert"],
  ["São Tomé-et-Príncipe and Principe", "São Tomé-et-Príncipe", "à São Tomé-et-Príncipe"],
  ["Sao Tome and Principe", "São Tomé-et-Príncipe", "à São Tomé-et-Príncipe"],
  ["Sao Tome", "São Tomé-et-Príncipe", "à São Tomé-et-Príncipe"],
  ["Gabon", "Gabon", "au Gabon"],
  ["DR Congo", "RD Congo", "en RD Congo"],
  ["Mauritania", "Mauritanie", "en Mauritanie"],
  ["Madagascar", "Madagascar", "à Madagascar"],
  ["Mozambique", "Mozambique", "au Mozambique"],
  ["Seychelles", "Seychelles", "aux Seychelles"],
  ["Mauritius", "Maurice", "à Maurice"],
  ["Botswana", "Botswana", "au Botswana"],
  ["Cameroon", "Cameroun", "au Cameroun"],
  ["Djibouti", "Djibouti", "à Djibouti"],
  ["Eswatini", "Eswatini", "en Eswatini"],
  ["Ethiopia", "Éthiopie", "en Éthiopie"],
  ["Tanzania", "Tanzanie", "en Tanzanie"],
  ["Zimbabwe", "Zimbabwe", "au Zimbabwe"],
  ["Algeria", "Algérie", "en Algérie"],
  ["Burundi", "Burundi", "au Burundi"],
  ["Comoros", "Comores", "aux Comores"],
  ["Eritrea", "Érythrée", "en Érythrée"],
  ["Lesotho", "Lesotho", "au Lesotho"],
  ["Liberia", "Liberia", "au Liberia"],
  ["Morocco", "Maroc", "au Maroc"],
  ["Namibia", "Namibie", "en Namibie"],
  ["Nigeria", "Nigeria", "au Nigeria"],
  ["Senegal", "Sénégal", "au Sénégal"],
  ["Somalia", "Somalie", "en Somalie"],
  ["Tunisia", "Tunisie", "en Tunisie"],
  ["Angola", "Angola", "en Angola"],
  ["Gambia", "Gambie", "en Gambie"],
  ["Guinea", "Guinée", "en Guinée"],
  ["Malawi", "Malawi", "au Malawi"],
  ["Rwanda", "Rwanda", "au Rwanda"],
  ["Uganda", "Ouganda", "en Ouganda"],
  ["Zambia", "Zambie", "en Zambie"],
  ["Benin", "Bénin", "au Bénin"],
  ["Egypt", "Égypte", "en Égypte"],
  ["Ghana", "Ghana", "au Ghana"],
  ["Kenya", "Kenya", "au Kenya"],
  ["Libya", "Libye", "en Libye"],
  ["Niger", "Niger", "au Niger"],
  ["Sudan", "Soudan", "au Soudan"],
  ["Chad", "Tchad", "au Tchad"],
  ["Mali", "Mali", "au Mali"],
  ["Togo", "Togo", "au Togo"],
  // Already-French names that still need a locative when preceded by "in "
  ["Sénégal", "Sénégal", "au Sénégal"],
  ["Cote d'Ivoire", "Côte d'Ivoire", "en Côte d'Ivoire"],
  ["Cote d’Ivoire", "Côte d’Ivoire", "en Côte d’Ivoire"],
  ["Côte d'Ivoire", "Côte d'Ivoire", "en Côte d'Ivoire"],
];

const CN = "[A-Za-zÀ-ÿ'’&;. -]+?"; // country-name capture (post-map, may be French)

function frName(token) {
  const t = token.trim();
  for (const [en, fr] of COUNTRIES) if (en === t || fr === t) return fr;
  return t;
}
function locName(token) {
  const t = token.trim();
  for (const [en, fr, loc] of COUNTRIES) if (en === t || fr === t) return loc;
  return `— ${t}`;
}
const CONFIDENCE = { High: "élevée", Medium: "moyenne", Low: "faible", "Very high": "très élevée" };
const confFr = (c) => CONFIDENCE[c.trim()] || c;

// Regex sentence replacements. Sources match the CURRENT mutated file content
// (accent-repair already converted words like décision/récent/médical inside
// the English sentences). Applied before the bare country-name map.
const REGEX_RULES = [
  // — title / JSON-LD name
  [new RegExp(`(${CN}) Calculateur ROI solaire — retour, batterie et économies générateur`, "g"),
    (m, c) => `Calculateur ROI solaire ${frName(c)} — retour, batterie et économies générateur`],
  // — WebApplication JSON-LD description + url
  [new RegExp(`Use the (${CN}) Calculateur ROI solaire in ([A-Z]{2,4}) to estimate payback from monthly bill, generator fuel savings, battery backup, system cost, and cash or financing assumptions\\.`, "g"),
    (m, c, cur) => `Utilisez le calculateur ROI solaire ${frName(c)} en ${cur} pour estimer le retour sur investissement à partir de la facture mensuelle, des économies de carburant générateur, de la batterie de secours, du coût du système et des hypothèses de financement.`],
  [/"url":"https:\/\/afrotools\.com\/tools\/solar-roi\/([a-z-]+)\/"/g,
    '"url":"https://afrotools.com/fr/tools/roi-solaire/$1/"'],
  [/"name":"Calculateur ROI solaire for Africa","item":"https:\/\/afrotools\.com\/tools\/solar-roi\/"/g,
    '"name":"Calculateur ROI solaire pour l\'Afrique","item":"https://afrotools.com/fr/tools/roi-solaire/"'],
  [/\{"@type":"ListItem","position":4,"name":"([^"]+)","item":"https:\/\/afrotools\.com\/tools\/solar-roi\/([a-z-]+)\/"\}/g,
    (m, c, slug) => `{"@type":"ListItem","position":4,"name":"${frName(c)}","item":"https://afrotools.com/fr/tools/roi-solaire/${slug}/"}`],
  // — hero
  [new RegExp(`Estimate solar payback in (${CN})(?=[<.,"]|$)`, "g"), (m, c) => `Estimez le retour solaire ${locName(c)}`],
  [new RegExp(`Compare grid bill relief, generator fuel savings, outage backup, battery choice, and quote-readiness using (${CN}) planning assumptions\\. Replace the defaults with your bill, fuel receipts, and installer quote before you buy\\.`, "g"),
    (m, c) => `Comparez l'allègement de la facture réseau, les économies de carburant générateur, le secours en cas de coupure, le choix de batterie et la préparation au devis avec les hypothèses de planification ${frName(c)}. Remplacez les valeurs par défaut par votre facture, vos reçus de carburant et le devis de l'installateur avant d'acheter.`],
  [/Solar planning in ([A-Z]{2,4})/g, "Planification solaire en $1"],
  [new RegExp(`(${CN}) default assumptions`, "g"), (m, c) => `Hypothèses par défaut — ${frName(c)}`],
  [/Last reviewed: /g, "Dernière révision : "],
  [/Confidence: (High|Medium|Low|Very high)/g, (m, c) => `Confiance : ${confFr(c)}`],
  [/Currency: /g, "Devise : "],
  // — country switcher
  [new RegExp(`This country page uses the same Solar ROI calculation engine as the main Africa calculator, preloaded with (${CN}) currency, tariff, fuel, solar yield, install cost, and battery assumptions\\.`, "g"),
    (m, c) => `Cette page pays utilise le même moteur de calcul ROI solaire que le calculateur Afrique principal, préchargé avec la devise, le tarif, le carburant, le rendement solaire, le coût d'installation et les hypothèses de batterie ${frName(c)}.`],
  [new RegExp(`🇩🇿|🇦🇴`, "g"), (m) => m], // no-op guard (flags untouched)
  [new RegExp(`(${CN}) selected - ([A-Z]{2,4})`, "g"), (m, c, cur) => `${frName(c)} sélectionné - ${cur}`],
  // — form
  [/Use your latest bill or prepaid spend in ([A-Z]{2,4})\./g, "Utilisez votre dernière facture ou dépense prépayée en $1."],
  // — status line (contains the earlier "for à sharper" corruption)
  [new RegExp(`Results update from the (${CN}) defaults\\. Add your bill and generator spend for à? ?sharper estimate\\.`, "g"),
    (m, c) => `Les résultats se mettent à jour à partir des valeurs par défaut ${frName(c)}. Ajoutez votre facture et vos dépenses générateur pour une estimation plus précise.`],
  // — sections with country
  [new RegExp(`Solar payback in (${CN}) starts with grid bills, generator fuel, and outages\\. This page preloads ([A-Z]{2,4}) defaults: ([\\d.,]+) [A-Z]{2,4}\\/kWh electricity, ([\\d.,]+) [A-Z]{2,4}\\/litre fuel, [A-Z]{2,4} ([\\d.,]+)\\/kW install cost, [A-Z]{2,4} ([\\d.,]+) battery-cost band, and ([\\d.,]+) peak sun hours\\/day\\. Treat the output as a planning estimate, not a quote\\.`, "g"),
    (m, c, cur, t, f, ic, bb, sh) => `Le retour solaire ${locName(c)} commence par les factures d'électricité, le carburant générateur et les coupures. Cette page précharge les valeurs ${cur} : électricité ${t} ${cur}/kWh, carburant ${f} ${cur}/litre, coût d'installation ${cur} ${ic}/kW, budget batterie ${cur} ${bb}, et ${sh} heures de soleil de pointe/jour. Considérez le résultat comme une estimation de planification, pas un devis.`],
  [new RegExp(`Solar payback in (${CN})(?=[<.,"]|$)`, "g"), (m, c) => `Retour solaire ${locName(c)}`],
  [new RegExp(`Before asking for a final price in (${CN}), collect a récent bill or prepaid history, one fuel receipt if a generator is used, essential appliances, and real outage hours\\. The calculator starts at ([A-Z]{2,4}) ([\\d.,]+) grid bill and [A-Z]{2,4} ([\\d.,]+) generator spend\\. Ask the installer to verify pumps, freezers, AC units, médical fridges, and other surge loads\\.`, "g"),
    (m, c, cur, b, g) => `Avant de demander un prix final ${locName(c)}, rassemblez une facture récente ou l'historique prépayé, un reçu de carburant si un générateur est utilisé, les appareils essentiels et les heures réelles de coupure. Le calculateur démarre à ${cur} ${b} de facture réseau et ${cur} ${g} de dépenses générateur. Demandez à l'installateur de vérifier pompes, congélateurs, climatiseurs, réfrigérateurs médicaux et autres charges à fort appel.`],
  [new RegExp(`At the (${CN}) default of ([\\d.,]+) ([A-Z]{2,4})\\/kWh, every solar kWh used on site offsets that tariff\\. Higher tariffs can improve payback; subsidized, fixed-charge heavy, or low daytime-use bills can stretch it\\.`, "g"),
    (m, c, t, cur) => `Au tarif par défaut ${frName(c)} de ${t} ${cur}/kWh, chaque kWh solaire consommé sur place compense ce tarif. Des tarifs plus élevés peuvent améliorer le retour ; des factures subventionnées, à forte part fixe ou à faible usage diurne peuvent l'allonger.`],
  [/Schools, clinics, landlords, and SMEs should check whether commercial tariffs differ from residential tariffs\./g,
    "Écoles, cliniques, bailleurs et PME doivent vérifier si les tarifs commerciaux diffèrent des tarifs résidentiels."],
  [new RegExp(`Generator fuel can change ROI because backup power often costs more per useful kWh than grid energy\\. This page uses ([\\d.,]+) ([A-Z]{2,4})\\/litre as the (${CN}) fuel default and converts monthly generator spend into avoided litres and run-hours\\.`, "g"),
    (m, f, cur, c) => `Le carburant générateur peut changer le ROI car l'énergie de secours coûte souvent plus cher par kWh utile que le réseau. Cette page utilise ${f} ${cur}/litre comme valeur carburant par défaut ${frName(c)} et convertit la dépense mensuelle générateur en litres et heures de fonctionnement évités.`],
  [/If generator spend is high but payback still looks weak, test a battery-first essential-load quote\./g,
    "Si la dépense générateur est élevée mais que le retour reste faible, testez un devis batterie d'abord sur charges essentielles."],
  [new RegExp(`Battery backup is not the same as total daily energy\\. Size it around appliances that must run during an outage: lights, fan, router, phones, POS terminal, fridge, freezer, médical fridge, pump controls, or a small workstation\\. This page uses ([A-Z]{2,4}) ([\\d.,]+) as the (${CN}) essential-load battery-cost band\\.`, "g"),
    (m, cur, bb, c) => `La batterie de secours n'est pas l'énergie quotidienne totale. Dimensionnez-la autour des appareils qui doivent fonctionner pendant une coupure : lampes, ventilateur, routeur, téléphones, terminal de paiement, réfrigérateur, congélateur, frigo médical, commandes de pompe ou petit poste de travail. Cette page utilise ${cur} ${bb} comme budget batterie charges essentielles ${frName(c)}.`],
  [/Essential-load battery band derived from the 3 kW system-cost seed\. Replace with quoted usable-kWh battery pricing\./g,
    "Budget batterie charges essentielles dérivé du coût de référence du système 3 kW. Remplacez par un prix batterie en kWh utiles issu d'un devis."],
  [/Ask for usable kWh, depth of discharge, chemistry, warranty, inverter compatibility, and replacement assumptions\./g,
    "Demandez les kWh utiles, la profondeur de décharge, la chimie, la garantie, la compatibilité onduleur et les hypothèses de remplacement."],
  [new RegExp(`These examples use (${CN}) planning defaults, not promises\\. Pick the closest bill, generator spend, and outage pattern, then edit calculator values\\.`, "g"),
    (m, c) => `Ces exemples utilisent les valeurs de planification ${frName(c)}, pas des promesses. Choisissez la facture, la dépense générateur et le schéma de coupure les plus proches, puis modifiez les valeurs du calculateur.`],
  [new RegExp(`The (${CN}) solar yield default is ([\\d.,]+) peak sun hours\\/day and performance ratio is ([\\d.,]+)\\.`, "g"),
    (m, c, sh, pr) => `Le rendement solaire par défaut ${frName(c)} est de ${sh} heures de soleil de pointe/jour et le ratio de performance est de ${pr}.`],
  [new RegExp(`Use the same (${CN}) assumptions to compare common solar sizes\\. The highlighted row follows the selected system size above; edit inputs to update the table\\.`, "g"),
    (m, c) => `Utilisez les mêmes hypothèses ${frName(c)} pour comparer les tailles solaires courantes. La ligne en surbrillance suit la taille de système sélectionnée ci-dessus ; modifiez les entrées pour mettre à jour le tableau.`],
  [new RegExp(`Estimate generator fuel cost in (${CN})(?=[<.,"]|$)`, "g"), (m, c) => `Estimez le coût du carburant générateur ${locName(c)}`],
  [new RegExp(`Estimate monthly fuel spend in (${CN}) before comparing solar\\.`, "g"), (m, c) => `Estimez la dépense mensuelle de carburant ${locName(c)} avant de comparer le solaire.`],
  [new RegExp(`Fuel tracker for (${CN})(?=[<.,"]|$)`, "g"), (m, c) => `Suivi carburant — ${frName(c)}`],
  [new RegExp(`(${CN}) country hub`, "g"), (m, c) => `Hub pays ${frName(c)}`],
  [new RegExp(`Pulled from the current (${CN}) source table\\.`, "g"), (m, c) => `Tiré du tableau de sources ${frName(c)} actuel.`],
  // — FAQ (JSON-LD + visible)
  [new RegExp(`How do I calculate solar payback in (${CN})\\?`, "g"), (m, c) => `Comment calculer le retour solaire ${locName(c)} ?`],
  [new RegExp(`Use your ([A-Z]{2,4}) monthly bill, generator spend, outage hours, system size, battery choice, and finance terms\\. This page starts with ([\\d.,]+) [A-Z]{2,4}\\/kWh, ([\\d.,]+) [A-Z]{2,4}\\/litre, [A-Z]{2,4} ([\\d.,]+)\\/kW, and ([\\d.,]+) peak sun hours\\/day\\. Replace each value with local data\\.`, "g"),
    (m, cur, t, f, ic, sh) => `Utilisez votre facture mensuelle en ${cur}, la dépense générateur, les heures de coupure, la taille du système, le choix de batterie et les conditions de financement. Cette page démarre avec ${t} ${cur}/kWh, ${f} ${cur}/litre, ${cur} ${ic}/kW et ${sh} heures de soleil de pointe/jour. Remplacez chaque valeur par des données locales.`],
  [new RegExp(`Should I include generator fuel in (${CN})\\?`, "g"), (m, c) => `Faut-il inclure le carburant générateur ${locName(c)} ?`],
  [new RegExp(`Yes, if you run a petrol or diesel generator\\. Add monthly fuel spend in ([A-Z]{2,4}) or edit the ([\\d.,]+) [A-Z]{2,4}\\/litre assumption\\. Generator savings can turn weak payback into a strong case for homes, shops, clinics, schools, churches, landlords, and SMEs\\.`, "g"),
    (m, cur, f) => `Oui, si vous utilisez un générateur essence ou diesel. Ajoutez la dépense mensuelle de carburant en ${cur} ou modifiez l'hypothèse de ${f} ${cur}/litre. Les économies générateur peuvent transformer un retour faible en dossier solide pour maisons, boutiques, cliniques, écoles, églises, bailleurs et PME.`],
  [new RegExp(`Do I need a battery in (${CN})\\?`, "g"), (m, c) => `Faut-il une batterie ${locName(c)} ?`],
  [new RegExp(`Not always\\. A battery is mainly for backup and night-time essential loads, not cheaper solar by default\\. If outages affect stock, safety, médical refrigeration, trading hours, or night power, compare no-battery solar with an essential-load battery using the ([A-Z]{2,4}) ([\\d.,]+) planning band\\.`, "g"),
    (m, cur, bb) => `Pas toujours. Une batterie sert surtout au secours et aux charges essentielles de nuit, pas à rendre le solaire moins cher par défaut. Si les coupures affectent le stock, la sécurité, la réfrigération médicale, les heures d'ouverture ou l'alimentation nocturne, comparez le solaire sans batterie avec une batterie charges essentielles sur la base du budget ${cur} ${bb}.`],
  [new RegExp(`What size solar system do I need in (${CN})\\?`, "g"), (m, c) => `Quelle taille de système solaire faut-il ${locName(c)} ?`],
  [/Start with daily kWh, peak load, outage hours, and appliances that must run during à? ?power cut\. A small home may start around 1-2 kW, a family home around 3-5 kW, and a shop or clinic should check load, surge, refrigeration, and trading hours before choosing a size\./g,
    "Partez des kWh quotidiens, de la charge de pointe, des heures de coupure et des appareils qui doivent fonctionner pendant une coupure. Une petite maison peut commencer autour de 1-2 kW, une maison familiale autour de 3-5 kW ; une boutique ou une clinique doit vérifier charge, appels de courant, réfrigération et heures d'ouverture avant de choisir une taille."],
  [new RegExp(`Why is my payback différent from installer quotes in (${CN})\\?`, "g"), (m, c) => `Pourquoi mon retour diffère-t-il des devis d'installateurs ${locName(c)} ?`],
  [new RegExp(`Quotes in ([A-Z]{2,4}) change with panel wattage, inverter brand, battery chemistry, usable capacity, protection devices, mounting, wiring distance, roof work, labour, warranty, maintenance, and finance charges\\. Treat [A-Z]{2,4} ([\\d.,]+)\\/kW install cost and the [A-Z]{2,4} ([\\d.,]+) battery band as planning defaults, not a price list\\.`, "g"),
    (m, cur, ic, bb) => `Les devis en ${cur} varient selon la puissance des panneaux, la marque d'onduleur, la chimie de batterie, la capacité utile, les protections, la fixation, la distance de câblage, les travaux de toiture, la main-d'œuvre, la garantie, la maintenance et les frais de financement. Considérez ${cur} ${ic}/kW d'installation et le budget batterie ${cur} ${bb} comme des valeurs de planification, pas une grille tarifaire.`],
  [new RegExp(`What assumptions can I edit for (${CN})\\?`, "g"), (m, c) => `Quelles hypothèses puis-je modifier pour ${frName(c)} ?`],
  [/You can edit tariff, fuel price, solar yield, performance ratio, system size, install cost, battery cost, maintenance, deposit, interest, finance term, outage hours, and backup level\. Use local bills, fuel receipts, and installer quotes when available\./g,
    "Vous pouvez modifier tarif, prix du carburant, rendement solaire, ratio de performance, taille du système, coût d'installation, coût batterie, maintenance, apport, intérêt, durée de financement, heures de coupure et niveau de secours. Utilisez factures locales, reçus de carburant et devis d'installateurs quand ils sont disponibles."],
  [new RegExp(`Is this a replacement for PVWatts or installer design in (${CN})\\?`, "g"), (m, c) => `Est-ce un remplacement de PVWatts ou du dimensionnement installateur ${locName(c)} ?`],
  [/No\. Use this for early planning and quote comparison\. PVWatts, PVGIS, Global Solar Atlas, and installer design tools can model location, roof angle, shading, inverter limits, cable runs, and production more precisely\./g,
    "Non. Utilisez cette page pour la planification initiale et la comparaison de devis. PVWatts, PVGIS, Global Solar Atlas et les outils de dimensionnement installateur modélisent plus précisément l'emplacement, l'inclinaison du toit, l'ombrage, les limites d'onduleur, les longueurs de câble et la production."],
  [new RegExp(`How accurate is the (${CN}) solar estimate\\?`, "g"), (m, c) => `Quelle est la précision de l'estimation solaire ${frName(c)} ?`],
  [new RegExp(`It is a planning estimate, not a quote\\. The (${CN}) dataset was last reviewed on ([^"<]+?) and confidence is (High|Medium|Low|Very high)\\. Accuracy improves with récent ([A-Z]{2,4}) bills, real fuel receipts, a load profile, local solar-yield data, current equipment quotes, and provider finance terms\\.`, "g"),
    (m, c, d, conf, cur) => `C'est une estimation de planification, pas un devis. Le jeu de données ${frName(c)} a été révisé le ${d} et la confiance est ${confFr(conf)}. La précision s'améliore avec des factures ${cur} récentes, de vrais reçus de carburant, un profil de charge, des données locales de rendement solaire, des devis d'équipement actuels et les conditions de financement du fournisseur.`],
];

// Exact string replacements (country-independent), longest first.
const FIXED = [
  ["This page is preloaded with the selected country currency and assumptions. Rechercher or choose another country to open its calculator.",
    "Cette page est préchargée avec la devise et les hypothèses du pays sélectionné. Recherchez ou choisissez un autre pays pour ouvrir son calculateur."],
  ["Text equivalent for result charts: the cards below summarize monthly cost relief, payback timing, 10-year savings, backup coverage, generator fuel avoided, and affordability risk.",
    "Équivalent texte des graphiques : les cartes ci-dessous résument l'allègement mensuel, le délai de retour, les économies sur 10 ans, la couverture de secours, le carburant générateur évité et le risque d'accessibilité."],
  ["Optional actions only. No account is required, and nothing is sent unless you choose to copy, email, download, or save it in this browser.",
    "Actions optionnelles uniquement. Aucun compte n'est requis et rien n'est envoyé sauf si vous choisissez de copier, envoyer par e-mail, télécharger ou enregistrer dans ce navigateur."],
  ["Runs in your browser. No account is required. Inputs are planning estimates unless you choose to share or export them.",
    "Fonctionne dans votre navigateur. Aucun compte requis. Les entrées restent des estimations de planification sauf si vous choisissez de les partager ou exporter."],
  ["Use this short estimate when asking an installer to quote the same assumptions. It includes the selected system size, grid bill, generator spend, outage hours, and battery level. Keep personal details out unless you choose to add them yourself.",
    "Utilisez cette estimation courte pour demander à un installateur un devis sur les mêmes hypothèses. Elle inclut la taille de système sélectionnée, la facture réseau, la dépense générateur, les heures de coupure et le niveau de batterie. N'ajoutez pas de données personnelles sauf si vous le décidez."],
  ["Export a practical quote-checking packet with inputs, assumptions, results, payback timeline, battery backup, generator savings, roof planning, source freshness, and installer questions.",
    "Exportez un dossier pratique de vérification de devis avec entrées, hypothèses, résultats, calendrier de retour, batterie de secours, économies générateur, planification toiture, fraîcheur des sources et questions installateur."],
  ["Use these only when they answer the next question in your solar décision. For background reading, start with the",
    "Utilisez ces liens seulement s'ils répondent à la prochaine question de votre décision solaire. Pour le contexte, commencez par le"],
  ["Use this for tariff, fuel price, install cost, battery cost, solar-yield, or source corrections. The draft is saved in this browser with a timestamp and opened as an email you can review before sending.",
    "Utilisez ce formulaire pour corriger tarif, prix carburant, coût d'installation, coût batterie, rendement solaire ou sources. Le brouillon est enregistré dans ce navigateur avec un horodatage et ouvert comme e-mail que vous pouvez relire avant envoi."],
  ["Use the battery warranty/spec sheet. Higher DoD gives more usable energy but may affect warranty.",
    "Utilisez la fiche technique/garantie de la batterie. Une profondeur de décharge plus élevée donne plus d'énergie utile mais peut affecter la garantie."],
  ["Add context such as city, tariff band, date checked, or whether this is a quote, bill, or receipt.",
    "Ajoutez du contexte : ville, tranche tarifaire, date de vérification, ou s'il s'agit d'un devis, d'une facture ou d'un reçu."],
  ["Use a regulator, utility, fuel source, supplier page, or credible public source when available.",
    "Utilisez un régulateur, un fournisseur d'électricité, une source carburant, une page fournisseur ou une source publique crédible si disponible."],
  ["Size backup, inverter capacity, and usable battery around essential loads.",
    "Dimensionnez secours, capacité onduleur et batterie utile autour des charges essentielles."],
  ["Confirm battery chemistry, usable kWh, depth of discharge, and warranty.",
    "Confirmez chimie de batterie, kWh utiles, profondeur de décharge et garantie."],
  ["Confirm installation price includes mounting, wiring, labour, and permits.",
    "Confirmez que le prix d'installation inclut fixation, câblage, main-d'œuvre et permis."],
  ["Confirm real energy consumption from bill or load profile.",
    "Confirmez la consommation réelle à partir de la facture ou du profil de charge."],
  ["Compare ownership cost, fuel exposure, maintenance, and backup trade-offs.",
    "Comparez coût de possession, exposition au carburant, maintenance et compromis de secours."],
  ["Check how long an inverter or battery can carry selected loads.",
    "Vérifiez combien de temps un onduleur ou une batterie peut porter les charges sélectionnées."],
  ["Use for shops, clinics, schools, churches, landlords, and SMEs weighing cashflow.",
    "Utile pour boutiques, cliniques, écoles, églises, bailleurs et PME qui évaluent le cashflow."],
  ["This note stays on this page unless you copy, print, or share it yourself.",
    "Cette note reste sur cette page sauf si vous la copiez, l'imprimez ou la partagez vous-même."],
  ["Choose the assumption or source that needs review.", "Choisissez l'hypothèse ou la source à revoir."],
  ["Example: 75 NGN/kWh, 820 NGN/litre, or updated installer quote range.",
    "Exemple : 75 NGN/kWh, 820 NGN/litre, ou fourchette de devis installateur actualisée."],
  ["Switch country, edit advanced assumptions, and compare scénarios.",
    "Changez de pays, modifiez les hypothèses avancées et comparez les scénarios."],
  ["Use this before paying a deposit or comparing installer quotes.",
    "Utilisez ceci avant de verser un acompte ou de comparer des devis."],
  ["Installer should verify roof, load, inverter and battery sizing.",
    "L'installateur doit vérifier toiture, charge, onduleur et dimensionnement batterie."],
  ["Backup is for essential loads, not the whole daily energy use.",
    "Le secours couvre les charges essentielles, pas toute l'énergie quotidienne."],
  ["Use advanced assumptions to edit deposit, interest, and term.",
    "Utilisez les hypothèses avancées pour modifier apport, intérêt et durée."],
  ["Planning allowance for heat, dust, wiring and inverter losses.",
    "Marge de planification pour chaleur, poussière, câblage et pertes onduleur."],
  ["Average power gap you want solar or battery to cover.",
    "Déficit moyen que le solaire ou la batterie doit couvrir."],
  ["Include petrol or diesel used for backup power.",
    "Incluez l'essence ou le diesel utilisés pour le secours."],
  ["Typical modern panels are roughly 250 W to 750 W.",
    "Les panneaux modernes typiques font environ 250 W à 750 W."],
  ["Country-level peak sun hours per day.", "Heures de soleil de pointe par jour au niveau pays."],
  ["Planning band for essential-load battery capacity.", "Budget indicatif pour la capacité batterie charges essentielles."],
  ["Replace with a récent receipt where possible.", "Remplacez par un reçu récent si possible."],
  ["Replace with written quote pricing.", "Remplacez par le prix d'un devis écrit."],
  ["Use lender terms, not advert headline terms.", "Utilisez les conditions du prêteur, pas celles des publicités."],
  ["O&amp;M allowance used in cashflow.", "Provision d'exploitation-maintenance utilisée dans le cashflow."],
  ["Used only when finance is enabled.", "Utilisé seulement quand le financement est activé."],
  ["Total repayment affects affordability risk.", "Le remboursement total affecte le risque d'accessibilité."],
  ["System size comparison updates after the calculator runs.",
    "La comparaison des tailles se met à jour après l'exécution du calculateur."],
  ["Enter assumptions to compare system sizes.", "Saisissez des hypothèses pour comparer les tailles de système."],
  ["Typical inputs to check before buying", "Entrées typiques à vérifier avant d'acheter"],
  ["How electricity bills affect payback", "Comment les factures d'électricité affectent le retour"],
  ["How generator fuel changes ROI", "Comment le carburant générateur change le ROI"],
  ["Battery backup planning", "Planification de la batterie de secours"],
  ["Example scénarios: small home, family home, shop/business",
    "Exemples de scénarios : petite maison, maison familiale, boutique/entreprise"],
  ["Assumptions and source freshness", "Hypothèses et fraîcheur des sources"],
  ["Plan the whole backup-power décision", "Planifiez toute la décision d'énergie de secours"],
  ["Solar décision snapshot", "Synthèse de la décision solaire"],
  ["Compare system sizes", "Comparer les tailles de système"],
  ["Compare nearby countries", "Comparer les pays voisins"],
  ["Compare another country assumption set.", "Comparez le jeu d'hypothèses d'un autre pays."],
  ["Compare installer quotes", "Comparer les devis d'installateurs"],
  ["Send this estimate to an installer", "Envoyer cette estimation à un installateur"],
  ["Save this estimate", "Enregistrer cette estimation"],
  ["Installer quote checklist", "Check-list de devis installateur"],
  ["Request quote checklist", "Check-list de demande de devis"],
  ["Next quote steps", "Prochaines étapes de devis"],
  ["Download/share estimate", "Télécharger/partager l'estimation"],
  ["Copy/share estimate", "Copier/partager l'estimation"],
  ["Print estimate", "Imprimer l'estimation"],
  ["Printable solar estimate report", "Rapport d'estimation solaire imprimable"],
  ["Copy WhatsApp summary", "Copier le résumé WhatsApp"],
  ["Download TXT report", "Télécharger le rapport TXT"],
  ["Print / PDF", "Imprimer / PDF"],
  ["Copy installer checklist", "Copier la check-list installateur"],
  ["Copy checklist", "Copier la check-list"],
  ["Download checklist", "Télécharger la check-list"],
  ["Confirm roof condition and shading.", "Confirmez l'état de la toiture et l'ombrage."],
  ["Confirm panel wattage and warranty.", "Confirmez la puissance des panneaux et la garantie."],
  ["Confirm inverter type and surge capacity.", "Confirmez le type d'onduleur et la capacité de pointe."],
  ["Confirm protection devices, earthing, and isolators.", "Confirmez protections, mise à la terre et sectionneurs."],
  ["Confirm maintenance and after-sales support.", "Confirmez maintenance et support après-vente."],
  ["Confirm financing total repayment.", "Confirmez le remboursement total du financement."],
  ["Confirm payback assumptions.", "Confirmez les hypothèses de retour."],
  ["Mensuel grid bill", "Facture réseau mensuelle"],
  ["Mensuel generator spend", "Dépense générateur mensuelle"],
  ["Outage hours per day", "Heures de coupure par jour"],
  ["Solar system size", "Taille du système solaire"],
  ["1 kW essentials", "1 kW essentiels"],
  ["2 kW small home", "2 kW petite maison"],
  ["3 kW family home", "3 kW maison familiale"],
  ["5 kW home or shop", "5 kW maison ou boutique"],
  ["10 kW SME, clinic, school, church", "10 kW PME, clinique, école, église"],
  ["20 kW larger site", "20 kW site plus grand"],
  ["Battery backup level", "Niveau de batterie de secours"],
  ["No battery", "Sans batterie"],
  ["Starter backup", "Secours de démarrage"],
  ["Essential loads", "Charges essentielles"],
  ["Extended backup", "Secours étendu"],
  ["Finance option", "Option de financement"],
  ["Cash purchase", "Achat comptant"],
  ["Include finance payment", "Inclure le paiement financé"],
  ["Advanced assumptions", "Hypothèses avancées"],
  ["Tariff per kWh", "Tarif par kWh"],
  ["Fuel price per litre", "Prix du carburant par litre"],
  ["Performance ratio", "Ratio de performance"],
  ["Panel wattage", "Puissance des panneaux"],
  ["Battery depth of discharge", "Profondeur de décharge batterie"],
  ["Install cost per kW", "Coût d'installation par kW"],
  ["Battery cost band", "Budget batterie"],
  ["Annuel maintenance percent", "Pourcentage de maintenance annuel"],
  ["Finance deposit percent", "Pourcentage d'apport"],
  ["Annuel finance interest", "Intérêt annuel du financement"],
  ["Finance term in months", "Durée du financement en mois"],
  ["Recommended system size", "Taille de système recommandée"],
  ["Selected system size.", "Taille de système sélectionnée."],
  ["Changes with load and backup target.", "Varie selon la charge et l'objectif de secours."],
  ["Estimated system cost", "Coût estimé du système"],
  ["Estimated installed system cost.", "Coût estimé du système installé."],
  ["Changes with quote, battery, inverter and protection scope.", "Varie selon devis, batterie, onduleur et protections."],
  ["Mensuel savings", "Économies mensuelles"],
  ["Mensuel relief after maintenance allowance.", "Allègement mensuel après provision de maintenance."],
  ["Changes with tariff, self-use and fuel spend.", "Varie selon tarif, autoconsommation et dépense carburant."],
  ["Payback period", "Délai de retour"],
  ["Simple payback under these assumptions.", "Retour simple sous ces hypothèses."],
  ["Changes with system cost and actual savings.", "Varie selon le coût du système et les économies réelles."],
  ["10-year net savings", "Économies nettes sur 10 ans"],
  ["10-year project net savings.", "Économies nettes du projet sur 10 ans."],
  ["Changes with escalation, degradation and replacements.", "Varie selon inflation tarifaire, dégradation et remplacements."],
  ["Backup coverage", "Couverture de secours"],
  ["Battery coverage estimate.", "Estimation de couverture batterie."],
  ["Changes with essential load, DoD and battery choice.", "Varie selon charges essentielles, profondeur de décharge et batterie."],
  ["Generator fuel avoided.", "Carburant générateur évité."],
  ["Generator fuel avoided", "Carburant générateur évité"],
  ["Changes with generator use and outage pattern.", "Varie selon l'usage du générateur et les coupures."],
  ["Affordability risk", "Risque d'accessibilité"],
  ["Quote and finance pressure check.", "Contrôle de pression devis et financement."],
  ["Changes with loan terms and verified installer quote.", "Varie selon les conditions de prêt et le devis vérifié."],
  ["Ouvrir full Africa calculator", "Ouvrir le calculateur Afrique complet"],
  ["Ouvrir selected country", "Ouvrir le pays sélectionné"],
  ["Ouvrir local tools, country context, and related planning pages.", "Ouvrir les outils locaux, le contexte pays et les pages de planification liées."],
  ["Ouvrir Global Solar Atlas", "Ouvrir Global Solar Atlas"],
  ["Calculer / view results", "Calculer / voir les résultats"],
  ["Skip to solar calculator", "Aller au calculateur solaire"],
  ["Learn more", "En savoir plus"],
  ["Bill and generator input", "Facture et dépense générateur"],
  ["Estimated monthly saving", "Économie mensuelle estimée"],
  ["Payback range", "Fourchette de retour"],
  ["Load this scénario", "Charger ce scénario"],
  ["Small home", "Petite maison"],
  ["Family home", "Maison familiale"],
  ["Shop / small business", "Boutique / petite entreprise"],
  ["1.5 kW plan", "Plan 1,5 kW"],
  ["3 kW plan", "Plan 3 kW"],
  ["5 kW plan", "Plan 5 kW"],
  ["Starter backup is usually enough if night load is kept small. Load: lights, fan, TV, router, phones, and a disciplined fridge plan.",
    "Un secours de démarrage suffit souvent si la charge de nuit reste faible. Charges : lampes, ventilateur, TV, routeur, téléphones et un frigo géré avec discipline."],
  ["Essential-load battery sizing is the safer planning default. Load: fridge, lights, fans, TV, router, laptops, and daytime appliances.",
    "Le dimensionnement batterie sur charges essentielles est le choix de planification le plus sûr. Charges : frigo, lampes, ventilateurs, TV, routeur, ordinateurs et appareils de jour."],
  ["Extended backup may be justified when lost trading hours cost more than the battery. Load: POS, lights, fans, router, refrigeration, and trading-hour reliability.",
    "Un secours étendu peut se justifier quand les heures d'ouverture perdues coûtent plus cher que la batterie. Charges : terminal de paiement, lampes, ventilateurs, routeur, réfrigération et fiabilité des heures d'ouverture."],
  ["This is a planning estimate, not a quote. Tariff, fuel price, battery price, install scope, performance ratio, and solar yield can move the result.",
    "C'est une estimation de planification, pas un devis. Tarif, prix carburant, prix batterie, périmètre d'installation, ratio de performance et rendement solaire peuvent faire bouger le résultat."],
  ["Dataset freshness", "Fraîcheur du jeu de données"],
  ["Solar source path", "Chemin de la source solaire"],
  ["Static country default, PVGIS/Global Solar Atlas-ready", "Valeur pays statique, compatible PVGIS/Global Solar Atlas"],
  ["Show source table", "Afficher le tableau des sources"],
  ["Electricity tariff", "Tarif d'électricité"],
  ["Fuel price", "Prix du carburant"],
  ["Suggest updated tariff", "Suggérer un tarif actualisé"],
  ["Suggest updated fuel price", "Suggérer un prix carburant actualisé"],
  ["Suggest install cost correction", "Suggérer une correction du coût d'installation"],
  ["Suggest source link", "Suggérer un lien source"],
  ["Suggest a data update", "Suggérer une mise à jour des données"],
  ["Suggest an update", "Suggérer une mise à jour"],
  ["Field to update", "Champ à mettre à jour"],
  ["Source link", "Lien source"],
  ["Current value", "Valeur actuelle"],
  ["Suggested value", "Valeur suggérée"],
  ["Source URL", "URL de la source"],
  ["User note", "Note utilisateur"],
  ["Save and open email draft", "Enregistrer et ouvrir le brouillon d'e-mail"],
  ["Copy update details", "Copier les détails de mise à jour"],
  ["User note for this estimate", "Note utilisateur pour cette estimation"],
  ["System size", "Taille du système"],
  ["Estimated cost", "Coût estimé"],
  ["Mensuel génération", "Production mensuelle"],
  ["Panel count", "Nombre de panneaux"],
  ["Roof area", "Surface de toiture"],
  ["Battery fit", "Adéquation batterie"],
  ["Best for", "Idéal pour"],
  ["Generator Fuel Cost Calculator", "Calculateur de coût carburant générateur"],
  ["Electricity Bill Estimator", "Estimateur de facture d'électricité"],
  ["Check consumption and monthly bill assumptions.", "Vérifiez consommation et hypothèses de facture mensuelle."],
  ["Battery &amp; Inverter Sizing", "Dimensionnement batterie &amp; onduleur"],
  ["Battery Backup Duration", "Durée de secours batterie"],
  ["Solar Sizing Calculator", "Calculateur de dimensionnement solaire"],
  ["Cross-check panels, roof area, and load sizing.", "Recoupez panneaux, surface de toiture et dimensionnement de charge."],
  ["Solar vs Generator", "Solaire vs générateur"],
  ["Business ROI tools", "Outils ROI entreprise"],
  ["Review fuel-price context when generator spend is material.", "Consultez le contexte prix carburant quand la dépense générateur est significative."],
  ["generator vs solar guide", "guide générateur vs solaire"],
  ["AfroTools fuel planning seed from country market context", "Valeur carburant de planification AfroTools issue du contexte de marché pays"],
  ["AfroTools installer-market planning assumption", "Hypothèse de planification AfroTools du marché installateurs"],
  ["AfroTools battery band planning assumption", "Hypothèse de budget batterie AfroTools"],
  ["Global Solar Atlas / AfroTools country solar planning seed", "Global Solar Atlas / valeur solaire pays AfroTools"],
  ["AfroTools PV performance planning assumption", "Hypothèse de performance PV AfroTools"],
  ["AfroTools generic avoided-emissions planning assumption", "Hypothèse générique AfroTools d'émissions évitées"],
  ["AfroTools tariff planning seed", "valeur tarifaire de planification AfroTools"],
  ["CO2 factor", "Facteur CO2"],
  ["Subsidized.", "Subventionné."],
  ["Tariff", "Tarif"],
  ["Install", "Installation"],
  ["Solar yield", "Rendement solaire"],
  ["Pays selectionne", "Pays sélectionné"],
  ["Sponsored", "Sponsorisé"],
  ["Years", "Années"],
  ["Value", "Valeur"],
  ["Default", "Défaut"],
  ["Freshness", "Fraîcheur"],
  ["Source", "Source"],
  ["Update", "Mise à jour"],
  ["Solar ROI", "ROI solaire"],
];

// Sort FIXED longest-first so substrings don't pre-empt full sentences.
FIXED.sort((a, b) => b[0].length - a[0].length);

// Bare country-name pass (after sentences): visible text + JSON-LD only.
const COUNTRY_RULES = COUNTRIES
  .filter(([en, fr]) => en !== fr)
  .map(([en, fr]) => ({
    re: new RegExp(`(?<![A-Za-zÀ-ÿ-])${en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-zÀ-ÿ-])`, "g"),
    to: fr,
  }));

function translateSegment(text) {
  let out = text;
  for (const [re, to] of REGEX_RULES) {
    re.lastIndex = 0;
    out = out.replace(re, to);
  }
  for (const [from, to] of FIXED) out = out.split(from).join(to);
  for (const { re, to } of COUNTRY_RULES) {
    re.lastIndex = 0;
    out = out.replace(re, to);
  }
  return out;
}

function processHtml(html) {
  const parts = html.split(/(<[^>]*>)/);
  let out = "";
  let inPlainScript = false;
  let inStyle = false;
  let inJsonLd = false;

  for (const part of parts) {
    if (part.startsWith("<")) {
      const m = part.match(/^<\s*(\/)?\s*([a-zA-Z0-9-]+)/);
      const closing = Boolean(m && m[1]);
      const name = m ? m[2].toLowerCase() : "";
      if (name === "script") {
        if (closing) { inPlainScript = false; inJsonLd = false; }
        else if (/application\/ld\+json/i.test(part)) inJsonLd = true;
        else inPlainScript = true;
        out += part;
        continue;
      }
      if (name === "style") { inStyle = !closing; out += part; continue; }
      // translate visible attributes on meta/title-adjacent tags
      if (!inPlainScript && !inStyle && /^<\s*meta\b/i.test(part) && /(name|property)=["'](description|og:title|og:description|twitter:title|twitter:description)["']/i.test(part)) {
        out += part.replace(/content=("([^"]*)")/i, (mm, _q, val) => `content="${translateSegment(val)}"`);
        continue;
      }
      if (!inPlainScript && !inStyle) {
        out += part.replace(/(aria-label|alt|placeholder|title)=("([^"]*)")/gi, (mm, attr, _q, val) => `${attr}="${translateSegment(val)}"`);
        continue;
      }
      out += part;
      continue;
    }
    if (inPlainScript || inStyle) { out += part; continue; }
    out += translateSegment(part); // text nodes + JSON-LD content
  }
  return out;
}

function main() {
  const dirs = fs.readdirSync(DIR, { withFileTypes: true }).filter((e) => e.isDirectory());
  let changed = 0;
  for (const d of dirs) {
    const file = path.join(DIR, d.name, "index.html");
    if (!fs.existsSync(file)) continue;
    const before = fs.readFileSync(file, "utf8");
    const after = processHtml(before);
    if (after !== before) {
      changed += 1;
      if (APPLY) fs.writeFileSync(file, after, "utf8");
    }
  }
  console.log(JSON.stringify({ mode: APPLY ? "fix" : "dry-run", countryPages: dirs.length, changed }, null, 2));
}

main();
