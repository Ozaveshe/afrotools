"use strict";

const countries = require("../../data/registry/countries.json");

const guidance = {
  ghana: ["Ghana Revenue Authority (GRA)", "https://gra.gov.gh/customs/vehicle-importation/", "Recherchez le véhicule dans ICUMS avec son numéro de châssis, sa marque, son modèle et son année. Reportez les droits indiqués pour ce véhicule."],
  kenya: ["Kenya Revenue Authority (KRA)", "https://www.kra.go.ke/news-center/press-release/2224-clarification-on-implementation-of-revised-current-retail-selling-price-crsp-list-for-used-motor-vehicles", "Pour un véhicule d’occasion, la KRA décrit une valorisation fondée sur le prix de vente de référence (CRSP) et la dépréciation. Le prix payé au vendeur peut donc différer de la valeur retenue par la douane."],
  nigeria: ["Nigeria Trade Information Portal", "https://tip.nsw.gov.ng/trade-tools/duty-calculator", "Vérifiez le code tarifaire du véhicule. Le portail demande le prix, la devise, le fret et l’assurance pour estimer les droits et prélèvements."],
  uganda: ["Uganda Revenue Authority (URA)", "https://ura.go.ug/en/tax-calculators/", "Le simulateur de l’URA demande notamment le type de véhicule, sa valeur CIF, la cylindrée et l’année. Vérifiez la valeur du modèle dans le guide automobile de l’URA pour la période concernée."],
  tanzania: ["Tanzania Revenue Authority (TRA)", "https://umvvs.tra.go.tz/UMVVS_CUSTOMER_USER_GUIDE.pdf", "Le système UMVVS présente séparément la valeur CIF et les droits, taxes et frais pour le véhicule sélectionné. Reportez uniquement les charges douanières dans la case correspondante."],
  zambia: ["Zambia Revenue Authority (ZRA)", "https://www.zra.org.zm/applied-rates-of-duties-and-taxes-imposed-in-connection-with-importation-exportation/", "Pour un véhicule d’occasion, demandez le montant applicable dans le barème des droits spécifiques de la ZRA. Vérifiez sa période de validité et les frais déjà compris dans le devis."]
};

function render(page) {
  const slug = page.enSlug.split("/")[1];
  const country = countries.find(item => item.routeSlug === slug);
  const [authority, source, note] = guidance[slug];
  const currency = country.currency;
  const title = `Budget d’importation d’un véhicule — ${country.displayNames.fr}`;
  const description = `Convertissez votre achat, votre fret et votre assurance en ${currency}, puis ajoutez les droits et frais figurant sur vos devis.`;
  const canonical = `https://afrotools.com/fr/tools/${page.frSlug}/`;
  const english = `https://afrotools.com/tools/${page.enSlug}/`;
  function field(name, label, required) {
    return `<div class="en-field"><label class="en-label" for="${name}">${label}</label><input class="en-input" id="${name}" name="${name}" type="number" step="any" min="0" inputmode="decimal"${required ? " required" : ""}></div>`;
  }
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="afrotools-content-id" content="fr-tool-gap:${page.frSlug}"><meta name="afrotools-source-owner" content="scripts/generate-fr-tool-gap-pages.js">
<title>${title} | AfroTools</title><meta name="description" content="${description}">
<meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://afrotools.com/assets/img/tools/vehicle-import-duty.webp"><meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="fr" href="${canonical}"><link rel="alternate" hreflang="en" href="${english}"><link rel="alternate" hreflang="x-default" href="${english}">
<link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/energy.css">
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"WebApplication",name:title,url:canonical,inLanguage:"fr",description,applicationCategory:"FinanceApplication",operatingSystem:"Web"})}</script>
<script src="/assets/js/analytics-bootstrap.js" async></script></head><body><afro-navbar active="transport"></afro-navbar>
<header class="en-tool-hero"><div class="container"><nav class="breadcrumb" aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> › <a href="/fr/all-tools/">Outils</a> › ${country.displayNames.fr}</nav><h1>${title}</h1><p>${description}</p></div></header>
<main class="en-main"><section class="en-card"><div class="en-card-body"><h2>Vérifier le montant de douane</h2><p>${note}</p><p><a href="${source}">${authority}</a>${slug === "uganda" ? ' · <a href="https://ura.go.ug/en/motor-vehicle-value-guide-3/">Guide de valorisation du 1ᵉʳ novembre 2026</a>' : ""}</p></div></section>
<form class="en-card" id="import-budget" data-currency="${currency}"><div class="en-card-body"><h2>Achat et transport international</h2>
<p>Utilisez les montants de la facture. Si le prix comprend déjà le fret ou l’assurance, saisissez zéro pour le poste inclus.</p><div class="en-form-grid">
${field("purchase","Prix d’achat (USD)",true)}${field("freight","Fret international (USD)",true)}${field("insurance","Assurance transport (USD)",true)}${field("fx",`Taux de votre devis pour 1 USD (${currency})`,true)}
</div><h2>Frais à destination</h2><p>Laissez vide un montant encore inconnu. Indiquez zéro uniquement si le poste est gratuit ou déjà compris ailleurs. Le budget reste partiel tant que des montants manquent.</p>
<div class="en-form-grid">${field("customs",`Droits et taxes selon votre décompte (${currency})`,false)}${field("handling",`Port, transit et livraison intérieure (${currency})`,false)}${field("registration",`Immatriculation et mise en circulation (${currency})`,false)}</div>
<button class="en-btn" type="submit">Calculer mon budget</button></div></form>
<p id="import-status" role="status"></p><section class="en-card" id="import-result" hidden><div class="en-card-body"><h2 tabindex="-1"></h2><p id="import-base"></p><p id="import-fees"></p><p><strong id="import-total"></strong></p><p id="import-missing"></p></div></section>
<p>Les droits proviennent de votre décompte. Ce budget ne vérifie pas l’admissibilité du véhicule et ne détermine pas sa valeur en douane.</p>
<p><a href="/fr/tools/cout-importation-voiture/">Ouvrir le simulateur français pour explorer les hypothèses du modèle</a></p></main><afro-footer></afro-footer>
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script><script src="/assets/js/pages/fr-vehicle-import-budget.js" defer></script><script src="/assets/js/lazy-analytics.js" defer></script></body></html>
`;
}

module.exports = { render };
