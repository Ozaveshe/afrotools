"use strict";

// The budgets start at zero so each family supplies its own assumptions.
const presets = {
  botswana: ["Botswana", "bw", "BWP", "bogadi"],
  eswatini: ["Eswatini", "sz", "SZL", "lobola"],
  lesotho: ["Lesotho", "ls", "LSL", "bohali"],
  zambia: ["Zambie", "zm", "ZMW", "lobola"],
};

function render(page) {
  const [country, code, currency, term] = presets[page.enSlug.split("/")[1]];
  const title = `Calculateur de lobola — ${country}`;
  const description = `Préparez votre budget familial en ${currency} à partir des montants discutés pour le bétail, les espèces, les cadeaux et la cérémonie.`;
  const canonical = `https://afrotools.com/fr/tools/${page.frSlug}/`;
  const english = `https://afrotools.com/tools/${page.enSlug}/`;
  return `<!doctype html>
<html lang="fr" data-chat-bundle="/assets/js/bundles/chat.9ca610bf.min.js">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="afrotools-content-id" content="fr-tool-gap:${page.frSlug}"><meta name="afrotools-source-owner" content="scripts/generate-fr-tool-gap-pages.js">
  <title>${title} | AfroTools</title><meta name="description" content="${description}">
  <meta property="og:title" content="${title}"><meta property="og:description" content="${description}">
  <meta property="og:locale" content="fr_FR"><meta property="og:url" content="${canonical}"><meta property="og:type" content="website">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/lobola-calculator.webp"><meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="en" href="${english}">
  <link rel="alternate" hreflang="fr" href="${canonical}">
  <link rel="alternate" hreflang="x-default" href="${english}">
  <link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/lobola-cluster.css">
  <script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"WebApplication",name:title,url:canonical,inLanguage:"fr",description,applicationCategory:"FinanceApplication",operatingSystem:"Web"})}</script>
  <script src="/assets/js/analytics-bootstrap.js" async></script>
</head>
<body class="lobola-cluster-page">
  <afro-navbar theme="dark" active="religious-cultural"></afro-navbar>
  <header class="lc-hero"><div class="lc-wrap">
    <nav class="lc-breadcrumb" aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> / <a href="/fr/all-tools/">Outils</a> / ${country}</nav>
    <h1>${title}</h1><p>${description}</p>
  </div></header>
  <main class="lc-main"><section class="lc-tool lobola-native" id="tool-mount" aria-labelledby="budget-heading">
    <h2 id="budget-heading">Votre budget de ${term} en ${currency}</h2>
    <p>Multipliez le nombre de têtes par la valeur convenue par tête. Ajoutez uniquement les espèces, cadeaux et frais qui restent à couvrir. Si une somme remplace du bétail, comptez-la une seule fois.</p>
    <div data-lobola-quick-planner data-locale="fr" data-lobola-country-code="${code}" data-lobola-country-name="${country}" data-currency="${currency}"></div>
    <noscript><p>Activez JavaScript pour calculer le total. Sur papier, additionnez la valeur du bétail, les espèces, les cadeaux et les frais de rencontre.</p></noscript>
  </section></main>
  <afro-footer></afro-footer>
  <script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
  <script src="/assets/js/pages/lobola-country-quick-planner.js" defer></script>
  <script src="/assets/js/lazy-analytics.js" defer></script>
</body>
</html>
`;
}

module.exports = { render };
