"use strict";

const countries = require("../../data/registry/countries.json");

function render(page) {
  const slug = page.enSlug.split("/")[1];
  const country = countries.find(entry => entry.routeSlug === slug);
  if (!country) throw new Error("Unknown generator fuel country: " + slug);
  const name = country.displayNames.fr;
  const currency = country.currency;
  const title = `Coût du carburant d’un groupe électrogène — ${name}`;
  const french = `https://afrotools.com/fr/tools/${page.frSlug}/`;
  const english = `https://afrotools.com/tools/${page.enSlug}/`;
  const description = `Estimez la consommation en litres et le budget quotidien et mensuel en ${currency} à partir de la charge de votre groupe et de votre prix à la pompe.`;
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="afrotools-content-id" content="fr-tool-gap:${page.frSlug}"><meta name="afrotools-source-owner" content="scripts/generate-fr-tool-gap-pages.js">
  <title>${title} | AfroTools</title><meta name="description" content="${description}">
  <meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${french}">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/generator-fuel.webp"><meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${french}"><link rel="alternate" hreflang="en" href="${english}"><link rel="alternate" hreflang="fr" href="${french}"><link rel="alternate" hreflang="x-default" href="${english}">
  <link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/energy.css">
  <script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"WebApplication",name:title,url:french,inLanguage:"fr",description,applicationCategory:"UtilitiesApplication",operatingSystem:"Web"})}</script>
  <script src="/assets/js/analytics-bootstrap.js" async></script>
</head>
<body>
  <afro-navbar active="energy"></afro-navbar>
  <header class="en-tool-hero"><div class="container"><nav class="breadcrumb" aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> › <a href="/fr/energy/">Énergie</a> › ${name}</nav>
    <h1>${title}</h1><p class="en-tool-hero-sub">${description}</p>
  </div></header>
  <main class="en-main">
    <form class="en-card" id="fuel-form" data-iso="${country.isoCode}" data-currency="${currency}">
      <div class="en-card-body"><div class="en-form-grid">
        <div class="en-field"><label class="en-label" for="size">Puissance nominale (kVA)</label><input class="en-input" name="size" id="size" type="number" min="0.01" step="any" value="5" required></div>
        <div class="en-field"><label class="en-label" for="load">Charge moyenne (%)</label><input class="en-input" name="load" id="load" type="number" min="0.01" max="100" step="any" value="100" required></div>
        <div class="en-field"><label class="en-label" for="hours">Heures de marche par jour</label><input class="en-input" name="hours" id="hours" type="number" min="0.01" max="24" step="any" value="6" required></div>
        <div class="en-field"><label class="en-label" for="days">Jours de marche par mois</label><input class="en-input" name="days" id="days" type="number" min="1" max="31" step="1" value="30" required></div>
        <div class="en-field"><label class="en-label" for="fuel">Carburant</label><select class="en-select" name="fuel" id="fuel"><option value="diesel">Gazole</option><option value="petrol">Essence</option></select></div>
        <div class="en-field"><label class="en-label" for="price">Votre prix par litre (${currency}/L)</label><input class="en-input" name="price" id="price" type="number" min="0.000001" step="any" inputmode="decimal" aria-describedby="price-help" required></div>
      </div><p id="price-help">Utilisez le prix du carburant choisi qui figure sur votre ticket ou sur un devis local.</p>
      <button class="en-btn" type="submit">Calculer le budget</button><noscript>Activez JavaScript pour lancer le calcul.</noscript></div>
    </form>
    <p id="fuel-status" role="status"></p>
    <section class="en-card" id="fuel-result" aria-labelledby="result-title" hidden>
      <div class="en-card-body"><h2 id="result-title" tabindex="-1">Votre budget de carburant</h2>
      <table class="en-results-table"><tbody>
        <tr><th scope="row">Consommation horaire</th><td data-value="hourly"></td></tr>
        <tr><th scope="row">Consommation quotidienne</th><td data-value="litres"></td></tr>
        <tr><th scope="row">Énergie produite par jour</th><td data-value="energy"></td></tr>
        <tr><th scope="row">Coût par jour de marche</th><td data-value="daily"></td></tr>
        <tr><th scope="row">Coût mensuel</th><td data-value="monthly"></td></tr>
      </tbody></table><p id="fuel-basis"></p><button class="en-btn" type="button" id="fuel-download">Télécharger le calcul (CSV)</button></div>
    </section>
    <section class="en-seo"><h2>Comment lire l’estimation</h2><p>Le modèle utilise un facteur de puissance de 0,8 et une consommation indicative de 0,28 L/kWh. La consommation réelle dépend du groupe et de sa charge. Le budget couvre le carburant pour les jours de marche saisis.</p></section>
  </main>
  <afro-footer></afro-footer><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
  <script src="/data/energy/country-energy-index.js" defer></script><script src="/engines/generator-fuel-engine.js" defer></script><script src="/assets/js/pages/fr-generator-fuel-country.js" defer></script>
  <script src="/assets/js/lazy-analytics.js" defer></script>
</body></html>
`;
}

module.exports = { render };
