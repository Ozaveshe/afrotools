'use strict';

const fs = require('node:fs');
const path = require('node:path');
const countries = require('../../data/registry/countries.json');

function render(page) {
  const slug = page.enSlug.slice('domestic-worker/'.length);
  const country = countries.find(row => row.routeSlug === slug);
  if (!country) throw new Error('Pays non reconnu : ' + slug);
  const name = country.displayNames.fr;
  const title = 'Salaire et budget d’emploi à domicile — ' + name;
  const url = 'https://afrotools.com/fr/tools/' + page.frSlug + '/';
  const description = 'Convertissez la rémunération convenue en budget mensuel et annuel en ' + country.currency + ', avec les heures supplémentaires et les frais employeur que vous indiquez.';
  const baseHtml = fs.readFileSync(path.join('tools', page.enSlug, 'index.html'), 'utf8');
  const alternates = baseHtml.match(/<link rel="alternate" hreflang="[^"]+" href="https:\/\/afrotools\.com\/[^"]+">/g) || [];
  const schema = { '@context': 'https://schema.org', '@type': 'WebApplication', name: title,
    url, description, inLanguage: 'fr', operatingSystem: 'Web', applicationCategory: 'BusinessApplication' };
  function field(key, label, attributes) {
    return `<label class="fr-hr-field">${label}<input name="${key}" type="number" min="0" step="any" inputmode="decimal" ${attributes || ''}></label>`;
  }
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | AfroTools</title><meta name="description" content="${description}">
  <meta name="afrotools-content-id" content="fr-tool-gap:${page.frSlug}">
  <meta name="afrotools-source-owner" content="scripts/generate-fr-tool-gap-pages.js">
  <link rel="canonical" href="${url}">
  ${alternates.join('\n  ')}
  <meta property="og:type" content="website"><meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}"><meta property="og:description" content="${description}">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/domestic-worker.webp">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="https://afrotools.com/assets/img/tools/domestic-worker.webp">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <script src="/assets/js/analytics-bootstrap.js" async></script>
  <link rel="stylesheet" href="/assets/css/design-system.min.css"><link rel="stylesheet" href="/assets/css/fr-hr-payroll-parity.css">
  <style>.fr-hr-shell{overflow-wrap:anywhere}.fr-hr-shell [hidden]{display:none!important}.fr-hr-card details{margin:1rem 0}.fr-hr-card summary{cursor:pointer;padding:.7rem 0}.fr-hr-card dl div{display:flex;justify-content:space-between;gap:1rem;padding:.4rem 0}.fr-hr-card dd{margin:0;font-weight:700}</style>
</head>
<body>
  <afro-navbar></afro-navbar>
  <main class="fr-hr-shell">
    <nav class="fr-hr-breadcrumb" aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> › <a href="/fr/hr-payroll/">RH et paie</a> › ${name}</nav>
    <h1>${title}</h1>
    <p>Saisissez le salaire convenu en ${country.currency} et les horaires prévus. Les suppléments et les charges du budget dépendent des montants que vous indiquez. Pour contrôler un minimum légal, il vous faudra un barème applicable et daté.</p>
    <section class="fr-hr-card" aria-labelledby="accord"><h2 id="accord">Conditions convenues</h2>
      <form id="domestic-budget" data-country="${country.routeSlug}" data-currency="${country.currency}">
        <div class="fr-hr-grid">
          ${field('basePay', 'Rémunération convenue (' + country.currency + ')', 'required')}
          <label class="fr-hr-field">Période de rémunération<select name="period"><option value="monthly">Par mois</option><option value="weekly">Par semaine</option><option value="daily">Par jour</option><option value="hourly">Par heure</option></select></label>
          ${field('hours', 'Heures ordinaires par semaine', 'required max="84"')}
          <label class="fr-hr-field" id="days-field" hidden>Jours travaillés par semaine<input type="number" name="days" min="0.01" max="7" step="any" inputmode="decimal" disabled></label>
        </div>
        <details><summary>Heures supplémentaires, indemnités et charges</summary><div class="fr-hr-grid">
          ${field('overtime', 'Heures supplémentaires dans le mois', 'max="160"')}
          ${field('multiplier', 'Coefficient de paiement des heures supplémentaires', 'max="3"')}
          ${field('allowances', 'Indemnités en espèces par mois')}
          ${field('contribution', 'Taux employeur à budgéter (%)', 'max="40"')}
          ${field('other', 'Autres frais mensuels à la charge de l’employeur')}
        </div><p>Le taux saisi s’applique ici au salaire de base, aux heures supplémentaires et aux indemnités. Si votre assiette diffère, saisissez la cotisation en montant dans les autres frais et laissez le taux vide.</p></details>
        <button type="submit" class="btn btn-primary">Calculer mon budget</button>
      </form><p role="status" id="budget-status"></p>
    </section>
    <section class="fr-hr-card" id="budget-result" hidden><h2>Budget estimé</h2>
      <dl>${Object.entries({baseMonthly:'Salaire de base mensuel',overtimePay:'Heures supplémentaires',allowances:'Indemnités',employerContribution:'Cotisation estimée',other:'Autres frais',monthlyCost:'Budget employeur mensuel',annualCost:'Budget annuel sur 12 mois'}).map(([key,label])=>`<div><dt>${label}</dt><dd data-budget="${key}"></dd></div>`).join('\n        ')}</dl>
      <p>La conversion utilise 52 semaines réparties sur 12 mois. Les heures supplémentaires sont valorisées au salaire horaire de base multiplié par le coefficient saisi.</p>
    </section>
    <p><a href="/fr/tools/salaire-employe-maison/#pays-${country.routeSlug}">Comparer le salaire à un plancher documenté et préparer le dossier d’emploi</a></p>
    <noscript>Activez JavaScript pour calculer ce budget sur votre appareil.</noscript>
  </main>
  <afro-footer></afro-footer><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
  <script src="/assets/js/engines/fr-hr-payroll-parity.js"></script><script src="/assets/js/pages/fr-domestic-country.js"></script>
</body></html>
`;
}
module.exports = { render };
