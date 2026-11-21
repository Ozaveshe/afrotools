'use strict';

const fs = require('node:fs');
const path = require('node:path');

const currencies = {
  'south-africa': 'ZAR', angola: 'AOA', cameroon: 'XAF', 'cote-divoire': 'XOF',
  egypt: 'EGP', ethiopia: 'ETB', ghana: 'GHS', kenya: 'KES', morocco: 'MAD',
  nigeria: 'NGN', uganda: 'UGX', rwanda: 'RWF', senegal: 'XOF', tanzania: 'TZS', tunisia: 'TND',
};

function render(page) {
  const countrySlug = page.enSlug.slice('outage-cost/'.length);
  const currency = currencies[countrySlug];
  if (!currency) throw new Error('Devise manquante pour ' + countrySlug);
  const country = page.name.split(' — ').pop();
  const title = 'Coût d’une coupure de courant — ' + country;
  const description = 'Estimez les ventes perdues, les salaires improductifs et les frais de secours en ' + currency + ' pour une coupure et pour un mois.';
  const canonical = 'https://afrotools.com/fr/tools/' + page.frSlug + '/';
  const english = fs.readFileSync(path.join('tools', page.enSlug, 'index.html'), 'utf8');
  const alternates = english.match(/<link rel="alternate" hreflang="[^"]+" href="https:\/\/afrotools\.com\/[^"]+">/g) || [];
  const schema = { '@context': 'https://schema.org', '@type': 'WebApplication', name: title,
    url: canonical, inLanguage: 'fr', description, applicationCategory: 'BusinessApplication', operatingSystem: 'Web' };
  const fields = [
    ['hours', 'Durée de la coupure (heures)', 'required', ''],
    ['revenue', 'Ventes définitivement perdues par heure', 'required', ''],
    ['staff', 'Personnel payé et inactif par heure', '', ''],
    ['backup', 'Fonctionnement du secours par heure', '', ''],
    ['stock', 'Pertes de stock pour cette coupure', '', ''],
    ['frequency', 'Coupures similaires par mois', '', '1'],
  ];
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | AfroTools</title><meta name="description" content="${description}">
  <meta name="afrotools-source-owner" content="scripts/generate-fr-tool-gap-pages.js">
  <meta name="afrotools-content-id" content="fr-tool-gap:${page.frSlug}">
  <link rel="canonical" href="${canonical}">
  ${alternates.join('\n  ')}
  <meta property="og:title" content="${title}"><meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}"><meta property="og:type" content="website">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/outage-cost.webp">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="https://afrotools.com/assets/img/tools/outage-cost.webp">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <script src="/assets/js/analytics-bootstrap.js" async></script>
  <link rel="stylesheet" href="/assets/css/global.min.css">
  <style>
    .outage-main{max-width:48rem;margin:auto;padding:6rem 1rem 4rem;line-height:1.6;overflow-wrap:anywhere}
    .outage-main h1{line-height:1.15}.outage-main a{text-decoration:underline}
    .outage-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));gap:1rem}
    .outage-fields label{display:grid;align-content:end;gap:.35rem;font-weight:600}
    .outage-fields input,.outage-main button{font:inherit;min-height:44px;padding:.4rem .65rem;border:1px solid currentColor;border-radius:.4rem}
    .outage-main button{margin:1rem 0;cursor:pointer}.outage-main dl div{display:flex;justify-content:space-between;gap:1rem;border-bottom:1px solid var(--color-border,#aaa);padding:.4rem 0}
    .outage-main dd{margin:0;font-weight:700}.outage-main :focus-visible{outline:3px solid currentColor;outline-offset:3px}
  </style>
</head>
<body>
  <div id="navbar"></div>
  <main class="outage-main">
    <nav aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> › <a href="/fr/all-tools/">Outils</a> › ${country}</nav>
    <h1>${title}</h1>
    <p>Saisissez les montants en ${currency}. Comptez les ventes que vous ne récupérerez pas après la reprise et le temps de travail que vous ne pouvez pas réaffecter. Laissez un coût facultatif vide pour compter zéro.</p>
    <form id="outage-country" data-currency="${currency}">
      <div class="outage-fields">${fields.map(([name, label, required, value]) =>
        `<label>${label}<input name="${name}" type="number" min="${name === 'hours' ? '0.01' : '0'}" step="any" inputmode="decimal" value="${value}" ${required}></label>`).join('\n        ')}</div>
      <button type="submit">Calculer le coût</button>
    </form>
    <p id="calculation-status" role="status"></p>
    <section id="outage-result" hidden><h2>Coût estimé</h2>
      <dl>${Object.entries({lostRevenue:'Ventes perdues',staffCost:'Personnel inactif',backupCost:'Secours électrique',spoilageCost:'Stock perdu',totalCost:'Total par coupure',monthlyExposure:'Total mensuel estimé'}).map(([key,label])=>`<div><dt>${label}</dt><dd data-output="${key}"></dd></div>`).join('\n        ')}</dl>
      <p>Les postes horaires sont multipliés par la durée de la coupure. Le stock perdu est ajouté une seule fois. Le total mensuel correspond au coût par coupure multiplié par la fréquence indiquée.</p>
    </section>
    <noscript>Activez JavaScript pour calculer automatiquement. Multipliez la durée par la somme des trois coûts horaires, puis ajoutez les pertes de stock par coupure.</noscript>
    <p><a href="/fr/tools/cout-coupure-entreprise/">Évaluer aussi la couverture du secours et le coût de la reprise</a></p>
  </main>
  <div id="footer"></div>
  <script src="/assets/js/components/navbar.js" defer></script><script src="/assets/js/components/footer.js" defer></script>
  <script src="/assets/js/engines/outage-incident.js"></script>
  <script src="/assets/js/pages/fr-outage-country.js"></script>
</body></html>
`;
}
module.exports = { render };
