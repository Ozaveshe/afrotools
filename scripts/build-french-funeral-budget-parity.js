#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'fr', 'tools', 'cout-funerailles', 'index.html');
const WRITE = process.argv.includes('--write');

const ROUTES = {
  en: '/tools/burial-cost/',
  fr: '/fr/tools/cout-funerailles/',
  sw: '/sw/zana/gharama-za-mazishi/'
};

const TITLE = 'Estimateur coût funérailles Afrique | AfroTools';
const DESCRIPTION = "Préparez un budget de funérailles avec cercueil, mortuaire, repas, transport, formalités, soutien familial, marge d’urgence et export TXT.";
const OG_DESCRIPTION = 'Calculez un budget indicatif de funérailles avec postes de dépense, financement disponible et prochaines actions.';
const IMAGE = 'https://afrotools.com/assets/img/tools/burial-cost.webp';

function page() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Estimateur coût funérailles Afrique',
    url: `https://afrotools.com${ROUTES.fr}`,
    description: 'Planificateur familial fondé uniquement sur les montants saisis, avec marge, financement disponible et exports locaux.',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    inLanguage: 'fr',
    image: IMAGE,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' }
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'fr',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Ce budget de funérailles est-il une facture officielle ?',
        acceptedAnswer: { '@type': 'Answer', text: "Non. Il s’agit d’un plan familial basé uniquement sur les montants saisis. Confirmez chaque service et formalité auprès des prestataires et autorités concernés." }
      },
      {
        '@type': 'Question',
        name: 'Le calcul utilise-t-il des prix moyens par pays ou religion ?',
        acceptedAnswer: { '@type': 'Answer', text: 'Non. Aucun tarif de pays, de religion, de prestataire ou d’assurance n’est intégré. Le calcul additionne uniquement vos montants.' }
      },
      {
        '@type': 'Question',
        name: 'Pourquoi ajouter une marge d’urgence ?',
        acceptedAnswer: { '@type': 'Answer', text: 'La marge permet de réserver une part du sous-total pour les dépenses confirmées tardivement. Le pourcentage reste entièrement choisi par la famille.' }
      }
    ]
  };
  const fields = [
    ['care', 'Soins et préparation'],
    ['venue', 'Lieu et équipements'],
    ['food', 'Repas et rafraîchissements'],
    ['transport', 'Transport'],
    ['documents', 'Documents et communication'],
    ['other', 'Autre coût confirmé']
  ].map(([id, label]) => `<label class="rm-field" for="fb-${id}"><span data-item-label="${id}">${label}</span><input id="fb-${id}" type="number" min="0" step="any" value="0" required></label>`).join('');

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="afrotools-source-owner" content="scripts/build-french-funeral-budget-parity.js">
  <title>${TITLE}</title>
  <meta name="description" content="${DESCRIPTION}">
  <link rel="canonical" href="https://afrotools.com${ROUTES.fr}">
  <link rel="alternate" hreflang="en" href="https://afrotools.com${ROUTES.en}">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com${ROUTES.fr}">
  <link rel="alternate" hreflang="sw" href="https://afrotools.com${ROUTES.sw}">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com${ROUTES.en}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${TITLE}">
  <meta property="og:description" content="${OG_DESCRIPTION}">
  <meta property="og:url" content="https://afrotools.com${ROUTES.fr}">
  <meta property="og:image" content="${IMAGE}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${TITLE}">
  <meta name="twitter:description" content="Préparez un budget respectueux et clair pour les principaux coûts de funérailles.">
  <meta name="twitter:image" content="${IMAGE}">
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <link rel="stylesheet" href="/assets/css/remittance-quote-comparator.css">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <script type="application/ld+json">${JSON.stringify(faq)}</script>
</head>
<body>
  <afro-navbar></afro-navbar>
  <header class="rm-hero">
    <div class="rm-wrap">
      <nav class="rm-crumb" aria-label="Fil d’Ariane"><a href="/fr/uniquely-african/">Outils africains</a></nav>
      <h1>Planificateur de budget funéraire familial</h1>
      <p>Planifiez avec les coûts confirmés par votre famille, sans supposer de prix moyen, d’obligation religieuse ou de règle communautaire.</p>
      <div class="rm-badges"><span>Privé dans votre navigateur</span><span>Coûts saisis par la famille</span><span>JSON et TXT</span></div>
    </div>
  </header>
  <main class="rm-main" data-funeral-budget-fr>
    <div class="rm-wrap">
      <div class="rm-grid">
        <section class="rm-card" aria-labelledby="fb-input-title">
          <h2 id="fb-input-title">Saisissez les coûts confirmés</h2>
          <p class="rm-privacy">N’indiquez aucun nom, numéro de téléphone, renseignement sur la personne décédée, compte ou numéro de police. Rien n’est envoyé ni sauvegardé automatiquement.</p>
          <form id="fb-form" novalidate>
            <div class="rm-fields">
              <label class="rm-field" for="fb-currency"><span>Devise</span><input id="fb-currency" maxlength="8" value="XOF" required></label>
              ${fields}
              <label class="rm-field" for="fb-buffer"><span>Marge d’urgence (%)</span><input id="fb-buffer" type="number" min="0" max="100" step="any" value="10" required></label>
              <label class="rm-field" for="fb-fund"><span>Fonds familial disponible</span><input id="fb-fund" type="number" min="0" step="any" value="0" required></label>
              <label class="rm-field" for="fb-benefit"><span>Prestation ou assurance confirmée</span><input id="fb-benefit" type="number" min="0" step="any" value="0" required></label>
              <label class="rm-field" for="fb-contributors"><span>Foyers ou contributeurs</span><input id="fb-contributors" type="number" min="1" step="1" value="1" required></label>
              <label class="rm-field" for="fb-days"><span>Jours de préparation</span><input id="fb-days" type="number" min="1" step="1" value="7" required></label>
            </div>
            <p id="fb-error" class="rm-error" role="alert" aria-live="assertive"></p>
            <div class="rm-actions">
              <button class="rm-btn" type="submit">Calculer le plan</button>
              <button class="rm-btn rm-btn-secondary" type="reset">Réinitialiser</button>
              <button class="rm-btn rm-btn-secondary" id="fb-copy" type="button">Copier</button>
              <button class="rm-btn rm-btn-secondary" id="fb-json" type="button">Télécharger JSON</button>
              <button class="rm-btn rm-btn-secondary" id="fb-txt" type="button">Télécharger TXT</button>
              <label class="rm-btn rm-btn-secondary" for="fb-import">Rouvrir JSON<input id="fb-import" type="file" accept="application/json,.json" hidden></label>
            </div>
            <p id="fb-status" class="rm-status" role="status" aria-live="polite"></p>
          </form>
        </section>
        <section class="rm-card rm-results" aria-labelledby="fb-results-title">
          <h2 id="fb-results-title">Résultats</h2>
          <div class="rm-primary"><span>Total du plan</span><strong id="fb-primary-value">—</strong></div>
          <div id="fb-result-list" class="rm-result-list"></div>
          <p class="rm-warning">Respectez les décisions de la famille, de la foi et de la communauté. Confirmez directement chaque service, prestation et échéance : l’outil ne choisit aucune cérémonie.</p>
        </section>
      </div>
      <section class="rm-content" aria-label="Méthode et limites">
        <article><h2>Limite des sources</h2><p>Aucun prix de pays, de religion, de prestataire ou d’assurance n’est intégré. Le calcul utilise uniquement les montants que vous saisissez.</p></article>
        <article><h2>Formule</h2><p>Total = coûts saisis + marge. Besoin restant = total − fonds disponible − prestation confirmée, sans descendre sous zéro.</p></article>
      </section>
    </div>
  </main>
  <afro-footer></afro-footer>
  <script src="/assets/js/components/navbar.js" defer></script>
  <script src="/assets/js/components/footer.js" defer></script>
  <script src="/assets/js/engines/funeral-budget-engine.js"></script>
  <script src="/assets/js/pages/fr-funeral-budget-parity.js"></script>
</body>
</html>
`;
}

function build() {
  const expected = page();
  const current = fs.existsSync(TARGET) ? fs.readFileSync(TARGET, 'utf8') : '';
  const changed = current === expected ? [] : ['fr/tools/cout-funerailles/index.html'];
  if (WRITE && changed.length) writeFileSyncWithRetry(TARGET, expected, 'utf8');
  console.log(JSON.stringify({ mode: WRITE ? 'write' : 'check', routes: 1, changed }, null, 2));
  if (!WRITE && changed.length) process.exitCode = 1;
  return changed;
}

if (require.main === module) build();
module.exports = { ROUTES, TARGET, page, build };
