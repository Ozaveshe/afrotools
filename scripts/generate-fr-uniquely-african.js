#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  writeFileSyncWithRetry,
} = require("./lib/safe-write");
const {
  PRESENTATION_FACTORIES,
  getPresentation,
} = require("./lib/fr-uniquely-african-presentations");
const {
  MANIFEST_PATH,
  normalizeRoute,
  routeFile,
} = require("./validate-fr-uniquely-african");

const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");
const CHECK = process.argv.includes("--check");
const HUB_PATH = path.join(ROOT, "fr", "uniquely-african", "index.html");
const NATIVE_TITLES = Object.freeze({
  "japa-calculator": "Calculateur de budget Japa",
  "mobile-money-fees": "Comparateur de frais Mobile Money",
  "burial-cost": "Estimateur de frais funéraires",
  "naira-to-words": "Naira en lettres",
  "amount-words-ke": "Shillings kényans en lettres",
  "amount-words-gh": "Cedis ghanéens en lettres",
  "susu-tracker": "Suivi Susu, Esusu et Chama",
  "whatsapp-link": "Générateur de lien WhatsApp",
  "remittance-compare": "Comparateur de transferts vers l’Afrique",
  "remittance-v2": "Comparateur de transferts détaillé",
  "brideprice-advisor": "Conseiller de préparation de la dot",
  "ajo-interest": "Calculateur d’intérêt et de rotation tontine",
  "market-days": "Calendrier des jours de marché Igbo",
  "ajo-chama-calc": "Calculateur Ajo, Chama, Tontine et Stokvel",
});
const NATIVE_CONTEXTS = Object.freeze({
  "japa-calculator": "Préparez un projet de mobilité depuis un pays africain sans confondre origine, destination, voie de visa, devise et coût d’installation.",
  "mobile-money-fees": "Comparez les frais par pays, opérateur, tranche de montant et type d’opération Mobile Money.",
  "burial-cost": "Préparez un budget funéraire respectueux des choix de pays, de foi, de communauté, de transport et de rassemblement.",
  "naira-to-words": "Écrivez les montants en nairas et kobos pour la préparation de chèques et de documents nigérians.",
  "amount-words-ke": "Écrivez les montants en shillings kényans et cents selon les conventions documentaires du Kenya.",
  "amount-words-gh": "Écrivez les montants en cedis et pesewas selon les conventions documentaires du Ghana.",
  "susu-tracker": "Suivez une rotation Susu, Esusu, Chama ou Tontine en conservant le terme du groupe, l’ordre et les échéances.",
  "whatsapp-link": "Créez localement un lien WhatsApp avec l’indicatif international correct et sans envoyer le numéro à AfroTools.",
  "remittance-compare": "Comparez des corridors de transfert diaspora vers l’Afrique avec devise, frais, marge de change et fraîcheur visibles.",
  "remittance-v2": "Préparez une comparaison détaillée de transferts avec montant reçu, frais, change, délai et limites de chaque fournisseur.",
  "brideprice-advisor": "Préparez une discussion de dot avec respect, consentement, coutumes choisies et limites financières explicites.",
  "ajo-interest": "Comparez la valeur temporelle d’une rotation Ajo ou Tontine sans réduire l’entraide à un simple produit de crédit.",
  "market-days": "Calculez les cycles Eke, Orie, Afo et Nkwo en conservant leur ordre et leur contexte de calendrier igbo.",
  "ajo-chama-calc": "Générez un calendrier Ajo, Chama, Tontine ou Stokvel avec cotisations, ordre de versement et devise du groupe.",
});

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function absoluteUrl(route) {
  return `https://afrotools.com${normalizeRoute(route)}`;
}

function fieldHtml(field) {
  const id = `ua-${field.key}`;
  const common = [
    `id="${id}"`,
    `name="${escapeHtml(field.key)}"`,
    `data-ua-field="${escapeHtml(field.key)}"`,
  ];
  let control;
  if (field.type === "select") {
    const options = (field.options || []).map((item) => (
      `<option value="${escapeHtml(item.value)}"${String(item.value) === String(field.value) ? " selected" : ""}>${escapeHtml(item.label)}</option>`
    )).join("");
    control = `<select ${common.join(" ")}>${options}</select>`;
  } else {
    if (field.min != null) common.push(`min="${escapeHtml(field.min)}"`);
    if (field.max != null) common.push(`max="${escapeHtml(field.max)}"`);
    if (field.step != null) common.push(`step="${escapeHtml(field.step)}"`);
    common.push(`value="${escapeHtml(field.value)}"`);
    control = `<input type="${field.type === "number" ? "number" : "text"}" ${common.join(" ")}>`;
  }
  const help = field.help ? `<small id="${id}-help">${escapeHtml(field.help)}</small>` : "";
  return `<label for="${id}"><span>${escapeHtml(field.label)}</span>${control}${help}</label>`;
}

function formHtml(presentation, grouping = []) {
  const groups = grouping.length ? grouping : [{ title: "", keys: presentation.fields.map((field) => field.key) }];
  const byKey = Object.fromEntries(presentation.fields.map((field) => [field.key, field]));
  return groups.map((group) => {
    const fields = group.keys.map((key) => byKey[key]).filter(Boolean).map(fieldHtml).join("");
    return `<fieldset class="ua-fieldset">${group.title ? `<legend>${escapeHtml(group.title)}</legend>` : ""}<div class="ua-fields">${fields}</div></fieldset>`;
  }).join("");
}

function actionHtml(presentation) {
  return `<div class="ua-actions"><button class="ua-primary" type="submit">${escapeHtml(presentation.action)}</button><button type="button" data-ua-reset>Réinitialiser</button></div>`;
}

function resultHtml(title, bodyClass, extra = "") {
  return `<section class="ua-result ${bodyClass}" data-ua-result hidden tabindex="-1" aria-labelledby="ua-result-title"><header><p class="ua-kicker">Résultat local</p><h2 id="ua-result-title">${escapeHtml(title)}</h2></header><div data-ua-status role="status" aria-live="polite"></div><div data-ua-metrics></div><div data-ua-detail>${extra}</div><div class="ua-export-actions" data-ua-exports></div></section>`;
}

function renderFintech(presentation) {
  return `<div class="ua-layout ua-fee-watch"><section class="ua-feed-panel"><h2>État des observations de frais</h2><p data-ua-feed-status>Les observations datées seront chargées séparément du calcul.</p><div data-ua-feed></div></section><form data-ua-form novalidate><h2>Simulation d’une opération</h2>${formHtml(presentation)}${actionHtml(presentation)}</form>${resultHtml("Coût effectif de l’opération", "ua-result-fees", '<div data-ua-table></div>')}</div>`;
}

function renderAjoTracker(presentation) {
  return `<div class="ua-layout ua-rotation"><form data-ua-form novalidate><h2>Règles de votre rotation</h2>${formHtml(presentation, [{ title: "Identité du groupe", keys: ["groupTerm", "currency"] }, { title: "Cotisations et tours", keys: ["members", "contribution", "rounds"] }, { title: "Retards", keys: ["missedPayments", "latePenalty"] }])}${actionHtml(presentation)}</form>${resultHtml("Calendrier et exposition du groupe", "ua-result-rotation", '<div class="ua-table-wrap"><table data-ua-table></table></div>')}</div>`;
}

function renderElectricity(presentation) {
  return `<div class="ua-layout ua-energy"><form data-ua-form novalidate><h2>Appareil et durée d’usage</h2>${formHtml(presentation, [{ title: "Appareil", keys: ["appliance", "watts", "hoursPerDay", "quantity"] }, { title: "Facturation", keys: ["tariff", "currency", "days"] }])}${actionHtml(presentation)}</form>${resultHtml("Consommation et coût", "ua-result-energy", '<div class="ua-energy-bars" data-ua-chart></div>')}</div>`;
}

function renderFuel(presentation) {
  return `<div class="ua-layout ua-fuel"><form data-ua-form novalidate><h2>Trajet ou groupe électrogène</h2>${formHtml(presentation, [{ title: "Choix du mode", keys: ["mode"] }, { title: "Trajet routier", keys: ["distance", "distanceUnit", "efficiency", "efficiencyUnit", "condition", "roundTrip", "reservePct", "passengers"] }, { title: "Groupe électrogène", keys: ["kva", "hours", "fuelType", "burnRate", "days"] }, { title: "Prix local", keys: ["price", "currency"] }])}${actionHtml(presentation)}</form>${resultHtml("Carburant nécessaire et coût", "ua-result-fuel")}</div>`;
}

function renderHawala(presentation) {
  return `<div class="ua-layout ua-corridor"><form data-ua-form novalidate><h2>Corridor et montant</h2>${formHtml(presentation)}${actionHtml(presentation)}</form>${resultHtml("Canaux classés par coût", "ua-result-corridor", '<div class="ua-table-wrap"><table data-ua-table></table></div>')}</div>`;
}

function renderStaple(presentation) {
  return `<div class="ua-layout ua-basket"><section class="ua-feed-panel"><h2>Observations du panier</h2><p data-ua-feed-status>Chargement des prix récents avec état de fraîcheur explicite.</p><div data-ua-feed></div></section><form data-ua-form novalidate><h2>Budget du foyer</h2>${formHtml(presentation, [{ title: "Observation locale", keys: ["market", "currency", "weeklyCost", "observedAt"] }, { title: "Foyer et période", keys: ["householdSize", "weeks", "changePct"] }])}${actionHtml(presentation)}</form>${resultHtml("Projection du panier", "ua-result-basket")}</div>`;
}

function renderWholesale(presentation) {
  return `<div class="ua-layout ua-wholesale"><section class="ua-feed-panel"><h2>Spreads observés</h2><p data-ua-feed-status>Les observations conservent produit, unité, marché et date.</p><div data-ua-feed></div></section><form data-ua-form novalidate><h2>Votre opération de négoce</h2>${formHtml(presentation, [{ title: "Produit comparable", keys: ["product", "unit", "currency", "observedAt"] }, { title: "Achat et vente", keys: ["wholesale", "retail", "quantity"] }])}${actionHtml(presentation)}</form>${resultHtml("Marge de l’opération", "ua-result-wholesale")}</div>`;
}

function renderLand(presentation) {
  return `<div class="ua-layout ua-land"><form data-ua-form novalidate><h2>Mesure de la parcelle</h2>${formHtml(presentation, [{ title: "Saisie", keys: ["mode", "area", "unit", "length", "width", "dimensionUnit"] }, { title: "Valeur facultative", keys: ["pricePerSqm", "currency"] }])}${actionHtml(presentation)}</form>${resultHtml("Conversions de la parcelle", "ua-result-land", '<div class="ua-table-wrap"><table data-ua-table></table></div>')}</div>`;
}

function renderFx(presentation) {
  return `<div class="ua-layout ua-fx"><section class="ua-feed-panel"><h2>Observations datées</h2><p data-ua-feed-status>Aucun taux n’est présenté comme officiel ou temps réel sans preuve.</p><div data-ua-feed></div></section><form data-ua-form novalidate><h2>Écart entre deux taux</h2>${formHtml(presentation)}${actionHtml(presentation)}</form>${resultHtml("Spread et différence", "ua-result-fx")}</div>`;
}

function renderCostOfLiving(presentation) {
  return `<div class="ua-layout ua-city-compare"><form data-ua-form novalidate><h2>Profil du foyer</h2>${formHtml(presentation)}${actionHtml(presentation)}</form>${resultHtml("Comparaison mensuelle", "ua-result-cities", '<div class="ua-compare-columns" data-ua-table></div>')}</div>`;
}

function renderAtlas(presentation) {
  return `<div class="ua-layout ua-atlas"><form data-ua-form novalidate><h2>Deux pays du jeu AfroAtlas</h2>${formHtml(presentation)}${actionHtml(presentation)}</form>${resultHtml("Profil économique et ressources", "ua-result-atlas", '<div class="ua-compare-columns" data-ua-table></div>')}</div>`;
}

function renderPoints(presentation) {
  return `<div class="ua-layout ua-points"><form data-ua-form novalidate><h2>Lot de contributions</h2>${formHtml(presentation)}${actionHtml(presentation)}</form>${resultHtml("Estimation des points", "ua-result-points", '<p class="ua-warning">Les points ne sont pas une promesse de paiement. La modération et les limites du compte s’appliquent.</p>')}</div>`;
}

function renderKitchen(presentation) {
  return `<div class="ua-layout ua-kitchen"><form data-ua-form novalidate><h2>Recette et portions</h2>${formHtml(presentation)}${actionHtml(presentation)}</form>${resultHtml("Ingrédients redimensionnés", "ua-result-recipe", '<div class="ua-recipe-meta" data-ua-context></div><div class="ua-table-wrap"><table data-ua-table></table></div>')}</div>`;
}

function renderConflict(presentation) {
  return `<div class="ua-layout ua-conflict"><section class="ua-safety-note" role="note"><strong>Information, pas alerte de sécurité.</strong><span>Vérifiez la date et les sources avant toute décision de déplacement.</span></section><form data-ua-form novalidate><h2>Filtrer les dossiers disponibles</h2>${formHtml(presentation)}${actionHtml(presentation)}</form>${resultHtml("Dossiers correspondant au filtre", "ua-result-conflict", '<div class="ua-conflict-list" data-ua-table></div>')}</div>`;
}

function renderDiaspora(presentation) {
  return `<div class="ua-layout ua-diaspora"><form data-ua-form novalidate><h2>Faits à préparer</h2>${formHtml(presentation, [{ title: "Pays", keys: ["origin", "destination"] }, { title: "Présence et seuil", keys: ["daysPresent", "residencyThreshold"] }, { title: "Transferts", keys: ["annualRemittance", "currency"] }])}${actionHtml(presentation)}</form>${resultHtml("Questions de résidence à vérifier", "ua-result-diaspora", '<ol class="ua-checklist" data-ua-checklist></ol>')}</div>`;
}

function renderNollywood(presentation) {
  return `<div class="ua-layout ua-film-budget"><form data-ua-form novalidate><h2>Top sheet du projet</h2>${formHtml(presentation, [{ title: "Projet", keys: ["project", "currency"] }, { title: "Postes principaux", keys: ["preProduction", "production", "postProduction", "distribution"] }, { title: "Risque et financement", keys: ["contingencyPct", "shootDays", "fundedPct"] }])}${actionHtml(presentation)}</form>${resultHtml("Budget, coût par jour et financement", "ua-result-film", '<div class="ua-budget-bars" data-ua-chart></div>')}</div>`;
}

function renderOkada(presentation) {
  return `<div class="ua-layout ua-rider"><form data-ua-form novalidate><h2>Journée et marché du conducteur</h2>${formHtml(presentation, [{ title: "Recettes", keys: ["country", "trips", "fare", "daysPerWeek", "slowDays"] }, { title: "Charges", keys: ["fuel", "ownerPay", "maintenance", "insurance", "phone", "commissionPct", "loan", "parking"] }, { title: "Plan d’épargne", keys: ["savePct", "bikeGoal", "reserveGoal"] }])}${actionHtml(presentation)}</form>${resultHtml("Revenu, charges et bénéfice", "ua-result-rider", '<div class="ua-profit-bar" data-ua-chart></div>')}</div>`;
}

function renderPrices(presentation) {
  return `<div class="ua-layout ua-prices"><form data-ua-form novalidate><h2>Recherche dans AfroPrices</h2>${formHtml(presentation)}${actionHtml(presentation)}</form>${resultHtml("Prix comparables", "ua-result-prices", '<div class="ua-table-wrap"><table data-ua-table></table></div>')}</div>`;
}

function renderAnkara(presentation) {
  return `<div class="ua-layout ua-textile-quote"><form data-ua-form novalidate><h2>Tissu et commande</h2>${formHtml(presentation, [{ title: "Tissu et change", keys: ["fabricType", "currency", "fxRate", "pricePerYard", "yards"] }, { title: "Production", keys: ["units", "labourPerPiece", "packagingPerPiece", "shippingOrder", "marginPct"] }])}${actionHtml(presentation)}</form>${resultHtml("Devis de production", "ua-result-textile")}</div>`;
}

function renderFabric(presentation) {
  return `<div class="ua-layout ua-garment-quote"><form data-ua-form novalidate><h2>Vêtement et matières</h2>${formHtml(presentation, [{ title: "Vêtement", keys: ["garment", "currency", "fxRate"] }, { title: "Tissu", keys: ["pricePerYard", "yards", "wastePct"] }, { title: "Confection", keys: ["notions", "labour", "marginPct"] }])}${actionHtml(presentation)}</form>${resultHtml("Prix de confection", "ua-result-garment")}</div>`;
}

const PAGE_RENDERERS = Object.freeze({
  "fintech-fee-watch": renderFintech,
  "ajo-chama": renderAjoTracker,
  "electricity-estimator": renderElectricity,
  "fuel-cost": renderFuel,
  "hawala-tracker": renderHawala,
  "staple-basket": renderStaple,
  "wholesale-retail-spread": renderWholesale,
  "land-size": renderLand,
  "informal-fx-watch": renderFx,
  "cost-of-living": renderCostOfLiving,
  afroatlas: renderAtlas,
  afropoints: renderPoints,
  afrokitchen: renderKitchen,
  "africa-conflict": renderConflict,
  "diaspora-guide": renderDiaspora,
  "nollywood-pitch": renderNollywood,
  "okada-income": renderOkada,
  afroprices: renderPrices,
  "ankara-kente-cost": renderAnkara,
  "fabric-cost": renderFabric,
});

function delegateScript(toolId) {
  const scripts = {
    afroatlas: "/engines/afroatlas-engine.js",
    afropoints: "/engines/afropoints-engine.js",
    afrokitchen: "/engines/afrokitchen-engine.js",
    "africa-conflict": "/engines/africa-conflict-engine.js",
    afroprices: "/engines/afroprices-engine.js",
  };
  return scripts[toolId] ? `<script src="${scripts[toolId]}"></script>` : "";
}

function pageHtml(row, presentation) {
  const enUrl = absoluteUrl(row.english.route);
  const frUrl = absoluteUrl(row.french.route);
  const title = `${presentation.title} | AfroTools`;
  const image = `https://afrotools.com/${row.artwork.path}`;
  const renderer = PAGE_RENDERERS[row.english.id];
  if (!renderer) throw new Error(`Missing route-specific renderer for ${row.english.id}`);
  const app = renderer(presentation);
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: presentation.title,
    description: presentation.description,
    url: frUrl,
    inLanguage: "fr",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web",
    isBasedOn: enUrl,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    provider: { "@type": "Organization", name: "AfroTools", url: "https://afrotools.com/" },
    image,
  };
  const contract = {
    ...presentation,
    englishRoute: normalizeRoute(row.english.route),
    frenchRoute: normalizeRoute(row.french.route),
    culturalScope: presentation.culturalContext || presentation.description,
    countryCodes: row.countryCodes,
  };
  return `<!doctype html>
<html lang="fr" data-theme="system">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="content-language" content="fr">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(presentation.description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${frUrl}">
${alternateLinksMarkup(row)}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="AfroTools">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(presentation.description)}">
  <meta property="og:url" content="${frUrl}">
  <meta property="og:image" content="${image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(presentation.description)}">
  <meta name="twitter:image" content="${image}">
  <link rel="icon" href="/assets/img/logo-mark.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/tokens.min.css">
  <link rel="stylesheet" href="/assets/css/global.min.css">
  <link rel="stylesheet" href="/assets/css/fr-uniquely-african.css">
  <script type="application/ld+json">${jsonForHtml(schema)}</script>
  <script src="/assets/js/components/navbar.min.js" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
</head>
<body data-fr-ua-app="${escapeHtml(row.english.id)}">
  <a class="ua-skip" href="#ua-main">Aller au calculateur</a>
  <afro-navbar></afro-navbar>
  <main id="ua-main" class="ua-page">
    <nav class="ua-breadcrumb" aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a><span aria-hidden="true">›</span><a href="/fr/uniquely-african/">Outils typiquement africains</a><span aria-hidden="true">›</span><span>${escapeHtml(presentation.title)}</span></nav>
    <header class="ua-hero">
      <div>
        <p class="ua-eyebrow">${escapeHtml(presentation.eyebrow)}</p>
        <h1>${escapeHtml(presentation.title)}</h1>
        <p class="ua-lead">${escapeHtml(presentation.description)}</p>
      </div>
      <img data-fr-ua-artwork src="/${escapeHtml(row.artwork.path)}" width="320" height="180" alt="" loading="eager">
    </header>
    <section class="ua-context" aria-label="Contexte culturel"><strong>Contexte conservé</strong><p>${escapeHtml(presentation.culturalContext || presentation.description)}</p></section>
    ${app}
    <section class="ua-proof-grid" aria-label="Sources, fraîcheur et limites">
      <article><h2>Source et propriétaire</h2><p>${escapeHtml(presentation.source)}</p></article>
      <article><h2>Fraîcheur</h2><p>${escapeHtml(presentation.freshness)}</p></article>
      <article><h2>Confiance</h2><p>${escapeHtml(presentation.confidence)}</p></article>
      <article><h2>Limites</h2><p>${escapeHtml(presentation.limitations)}</p></article>
    </section>
    <section class="ua-privacy"><h2>Confidentialité locale</h2><p>Le calcul et les exports sont produits dans votre navigateur. Les champs saisis ne sont pas envoyés. Les éventuels chargements de données sont en lecture seule et leur état réseau est affiché. Aucun appel IA n’est lancé depuis cette page.</p></section>
    <nav class="ua-next" aria-label="Actions complémentaires"><a href="/fr/ai/?tool=${encodeURIComponent(row.english.id)}&route=${encodeURIComponent(normalizeRoute(row.french.route))}">Préparer ce workflow dans AfroTools AI</a><a href="/fr/uniquely-african/">Voir les 34 outils typiquement africains</a></nav>
  </main>
  <afro-footer></afro-footer>
  <script id="uaContract" type="application/json">${jsonForHtml(contract)}</script>
  <script src="/engines/uniquely-african-engine.js"></script>
${delegateScript(row.english.id) ? `  ${delegateScript(row.english.id)}\n` : ""}
  <script src="/assets/js/pages/fr-uniquely-african.js"></script>
</body>
</html>
`;
}

function upsertAttribute(html, tagName, attribute, value) {
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>`, "i");
  const match = html.match(pattern);
  if (!match) throw new Error(`Missing <${tagName}>`);
  let attrs = match[1];
  const attrPattern = new RegExp(`\\s${attribute}=(["']).*?\\1`, "i");
  if (attrPattern.test(attrs)) attrs = attrs.replace(attrPattern, ` ${attribute}="${value}"`);
  else attrs += ` ${attribute}="${value}"`;
  return html.replace(pattern, `<${tagName}${attrs}>`);
}

function upsertLink(html, rel, href, hreflang) {
  const langPart = hreflang ? `\\s+hreflang=["']${hreflang}["']` : "";
  const pattern = new RegExp(`<link\\b(?=[^>]*\\brel=["']${rel}["'])${langPart ? `(?=[^>]*${langPart})` : ""}[^>]*>`, "i");
  const link = `<link rel="${rel}"${hreflang ? ` hreflang="${hreflang}"` : ""} href="${href}">`;
  if (pattern.test(html)) return html.replace(pattern, link);
  return html.replace(/<\/head>/i, `  ${link}\n</head>`);
}

function alternateLinks(source) {
  const links = new Map();
  const tags = String(source || "").match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const rel = tag.match(/\brel=["']([^"']+)["']/i);
    const lang = tag.match(/\bhreflang=["']([^"']+)["']/i);
    const href = tag.match(/\bhref=["']([^"']+)["']/i);
    if (!rel || !lang || !href || rel[1].toLowerCase() !== "alternate") continue;
    links.set(lang[1].toLowerCase(), href[1]);
  }
  return links;
}

function rowAlternateLinks(row) {
  const englishSource = fs.readFileSync(routeFile(row.english.route), "utf8");
  const links = alternateLinks(englishSource);
  links.set("en", absoluteUrl(row.english.route));
  links.set("fr", absoluteUrl(row.french.route));
  links.set("x-default", absoluteUrl(row.english.route));
  const preferred = ["en", "fr"];
  const other = Array.from(links.keys())
    .filter((lang) => !preferred.includes(lang) && lang !== "x-default")
    .sort();
  return preferred.concat(other, ["x-default"]).map((lang) => [lang, links.get(lang)]);
}

function alternateLinksMarkup(row) {
  return rowAlternateLinks(row)
    .map(([lang, href]) => `  <link rel="alternate" hreflang="${lang}" href="${href}">`)
    .join("\n");
}

function upsertMetaProperty(html, property, content) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\bproperty=["']${property}["'])[^>]*>`, "i");
  const meta = `<meta property="${property}" content="${content}">`;
  if (pattern.test(html)) return html.replace(pattern, meta);
  return html.replace(/<\/head>/i, `  ${meta}\n</head>`);
}

function upsertMetaName(html, name, content) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\bname=["']${name}["'])[^>]*>`, "i");
  const meta = `<meta name="${name}" content="${content}">`;
  if (pattern.test(html)) return html.replace(pattern, meta);
  return html.replace(/<\/head>/i, `  ${meta}\n</head>`);
}

function hardenExistingFrench(row, source) {
  let html = source.replace(/<script\b[^>]*\bdata-fr-utility-localizer\b[^>]*>[\s\S]*?<\/script>\s*/gi, "");
  html = upsertAttribute(html, "body", "data-fr-ua-app", row.english.id);
  html = upsertAttribute(html, "html", "lang", "fr");
  html = upsertLink(html, "canonical", absoluteUrl(row.french.route));
  html = upsertLink(html, "alternate", absoluteUrl(row.english.route), "en");
  html = upsertLink(html, "alternate", absoluteUrl(row.french.route), "fr");
  html = upsertLink(html, "alternate", absoluteUrl(row.english.route), "x-default");
  for (const [lang, href] of rowAlternateLinks(row)) {
    html = upsertLink(html, "alternate", href, lang);
  }
  html = upsertMetaProperty(html, "og:url", absoluteUrl(row.french.route));
  const artworkUrl = `https://afrotools.com/${row.artwork.path}`;
  html = upsertMetaProperty(html, "og:image", artworkUrl);
  html = upsertMetaName(html, "twitter:image", artworkUrl);
  if (!html.includes("data-fr-ua-artwork")) {
    const artwork = `<figure class="ua-native-artwork"><img data-fr-ua-artwork src="/${escapeHtml(row.artwork.path)}" width="320" height="180" alt="" loading="eager"></figure>`;
    if (/<\/h1>/i.test(html)) html = html.replace(/<\/h1>/i, `</h1>${artwork}`);
    else html = html.replace(/<main\b[^>]*>/i, (main) => `${main}${artwork}`);
  }
  if (!/"inLanguage"\s*:\s*"fr"/i.test(html)) {
    const schema = { "@context": "https://schema.org", "@type": "WebApplication", inLanguage: "fr", url: absoluteUrl(row.french.route), isBasedOn: absoluteUrl(row.english.route) };
    html = html.replace(/<\/head>/i, `  <script type="application/ld+json">${jsonForHtml(schema)}</script>\n</head>`);
  }
  if (!html.includes("/assets/js/pages/fr-uniquely-african-native-guards.js")) {
    html = html.replace(/<\/body>/i, '  <script src="/assets/js/pages/fr-uniquely-african-native-guards.js"></script>\n</body>');
  }
  if (!html.includes("/assets/js/pages/fr-uniquely-african-native-exports.js")) {
    html = html.replace(/<\/body>/i, '  <script src="/assets/js/pages/fr-uniquely-african-native-exports.js"></script>\n</body>');
  }
  const aiHref = `/fr/ai/?tool=${encodeURIComponent(row.english.id)}&route=${encodeURIComponent(row.french.route)}`;
  if (!html.includes(aiHref)) {
    html = html.replace(
      /<\/body>/i,
      `  <aside class="ua-native-ai-route" aria-label="Continuer avec AfroTools AI"><a href="${aiHref}">Préparer ce workflow dans AfroTools AI</a></aside>\n</body>`
    );
  }
  return html;
}

function reciprocalEnglish(row, source) {
  return upsertLink(source, "alternate", absoluteUrl(row.french.route), "fr");
}

function reciprocalLocaleOwners(row, changes) {
  for (const [lang, href] of rowAlternateLinks(row)) {
    if (["en", "fr", "x-default"].includes(lang)) continue;
    let targetUrl;
    try {
      targetUrl = new URL(href);
    } catch (error) {
      throw new Error(`${row.english.id}: invalid ${lang} hreflang URL ${href}`);
    }
    if (targetUrl.hostname !== "afrotools.com") continue;
    const targetFile = routeFile(targetUrl.pathname);
    if (!fs.existsSync(targetFile)) {
      throw new Error(`${row.english.id}: missing ${lang} reciprocal owner ${targetUrl.pathname}`);
    }
    writeOrCheck(
      targetFile,
      upsertLink(fs.readFileSync(targetFile, "utf8"), "alternate", absoluteUrl(row.french.route), "fr"),
      changes
    );
  }
}

function hubHtml(manifest) {
  const cards = manifest.rows.map((row) => {
    const presentation = getPresentation(row.english.id);
    const registryName = presentation ? presentation.title : NATIVE_TITLES[row.english.id];
    const context = presentation ? presentation.culturalContext || presentation.description : NATIVE_CONTEXTS[row.english.id];
    if (!registryName) throw new Error(`Missing hub title for ${row.english.id}`);
    if (!context) throw new Error(`Missing French hub context for ${row.english.id}`);
    return `<article class="ua-hub-card"><img src="/${escapeHtml(row.artwork.path)}" width="240" height="135" alt="" loading="lazy"><div><p>${escapeHtml(context)}</p><h2><a href="${normalizeRoute(row.french.route)}">${escapeHtml(registryName)}</a></h2><span>${escapeHtml(row.countryCodes.join(", "))}</span></div></article>`;
  }).join("\n");
  return `<!doctype html>
<html lang="fr" data-theme="system">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>34 outils typiquement africains en français | AfroTools</title>
  <meta name="description" content="Les 34 applications gratuites typiquement africaines d’AfroTools: calculs, cultures, marchés, diaspora, tissus, recettes et données, avec propriétaires français natifs.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://afrotools.com/fr/uniquely-african/">
  <link rel="alternate" hreflang="en" href="https://afrotools.com/uniquely-african/">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/uniquely-african/">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com/uniquely-african/">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="AfroTools">
  <meta property="og:title" content="34 outils typiquement africains en français">
  <meta property="og:description" content="Des outils africains natifs en français, sans iframe ni passage par une interface anglaise.">
  <meta property="og:url" content="https://afrotools.com/fr/uniquely-african/">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/afroatlas.webp">
  <link rel="stylesheet" href="/assets/css/tokens.min.css">
  <link rel="stylesheet" href="/assets/css/global.min.css">
  <link rel="stylesheet" href="/assets/css/fr-uniquely-african.css">
  <script type="application/ld+json">${jsonForHtml({ "@context": "https://schema.org", "@type": "CollectionPage", name: "34 outils typiquement africains en français", url: "https://afrotools.com/fr/uniquely-african/", inLanguage: "fr", numberOfItems: 34 })}</script>
  <script src="/assets/js/components/navbar.min.js" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
</head>
<body data-fr-ua-hub>
  <a class="ua-skip" href="#ua-hub">Aller aux outils</a>
  <afro-navbar></afro-navbar>
  <main id="ua-hub" class="ua-page ua-hub">
    <nav class="ua-breadcrumb" aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a><span aria-hidden="true">›</span><span>Outils typiquement africains</span></nav>
    <header class="ua-hub-hero"><p class="ua-eyebrow">Uniquement africain</p><h1>34 outils africains, entièrement en français</h1><p>Chaque carte correspond à une application physique du programme. Les noms locaux, pays, monnaies, unités, sources et limites restent visibles; aucune carte ne renvoie vers une interface anglaise.</p></header>
    <div class="ua-hub-count"><strong>34 / 34</strong><span>routes sémantiques réconciliées</span></div>
    <section class="ua-hub-grid" aria-label="Catalogue des 34 applications">${cards}</section>
  </main>
  <afro-footer></afro-footer>
</body>
</html>
`;
}

function writeOrCheck(file, content, changes) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (current === content) return;
  changes.push(path.relative(ROOT, file).replace(/\\/g, "/"));
  if (WRITE) writeFileSyncWithRetry(file, content, "utf8");
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  if (manifest.denominator !== 34 || manifest.rows.length !== 34) throw new Error("Manifest denominator must be exactly 34");
  const ids = manifest.rows.map((row) => row.english.id);
  if (new Set(ids).size !== 34) throw new Error("Manifest English ids must be unique");
  const frenchRoutes = manifest.rows.map((row) => normalizeRoute(row.french.route));
  if (new Set(frenchRoutes).size !== 34) throw new Error("Manifest French routes must be unique");
  const contractIds = Object.keys(PRESENTATION_FACTORIES);
  if (contractIds.length !== 20) throw new Error(`Expected 20 maintained route-specific presentations, found ${contractIds.length}`);
  for (const id of contractIds) {
    if (!ids.includes(id)) throw new Error(`Presentation route is outside manifest: ${id}`);
  }

  const changes = [];
  for (const row of manifest.rows) {
    const frFile = routeFile(row.french.route);
    const enFile = routeFile(row.english.route);
    if (!fs.existsSync(enFile)) throw new Error(`Missing English owner ${row.english.file}`);
    const presentation = getPresentation(row.english.id);
    if (presentation) {
      writeOrCheck(frFile, pageHtml(row, presentation), changes);
    } else {
      if (!fs.existsSync(frFile)) throw new Error(`Missing hand-authored French owner ${row.french.file}`);
      writeOrCheck(frFile, hardenExistingFrench(row, fs.readFileSync(frFile, "utf8")), changes);
    }
    writeOrCheck(enFile, reciprocalEnglish(row, fs.readFileSync(enFile, "utf8")), changes);
    reciprocalLocaleOwners(row, changes);
  }
  writeOrCheck(HUB_PATH, hubHtml(manifest), changes);

  if (!WRITE && !CHECK) {
    console.log(JSON.stringify({ mode: "plan", changedFiles: changes.length, files: changes }, null, 2));
    return;
  }
  console.log(JSON.stringify({ mode: WRITE ? "write" : "check", changedFiles: changes.length, files: changes }, null, 2));
  if (CHECK && changes.length) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = {
  PAGE_RENDERERS,
  hardenExistingFrench,
  hubHtml,
  pageHtml,
  reciprocalEnglish,
  rowAlternateLinks,
};
