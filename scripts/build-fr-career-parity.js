'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const countries = `
<option value="NG">Nigeria</option><option value="KE">Kenya</option><option value="ZA">Afrique du Sud</option>
<option value="GH">Ghana</option><option value="EG">Égypte</option><option value="ET">Éthiopie</option>
<option value="TZ">Tanzanie</option><option value="UG">Ouganda</option><option value="RW">Rwanda</option>
<option value="CI">Côte d’Ivoire</option><option value="CM">Cameroun</option><option value="SN">Sénégal</option>
<option value="MA">Maroc</option><option value="TN">Tunisie</option><option value="AO">Angola</option>`;
const field = (label, name, type, value, attrs = '') =>
  `<div class="fr-field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${value}" ${attrs}></div>`;
const select = (label, name, options) =>
  `<div class="fr-field"><label for="${name}">${label}</label><select id="${name}" name="${name}">${options}</select></div>`;

const tools = [
  {
    slug: 'croissance-carriere', en: 'career-growth', kind: 'growth',
    title: 'Calculateur de croissance de carrière',
    description: 'Projetez une trajectoire salariale sur dix ans à partir de vos propres hypothèses de pays, secteur, progression et mobilité.',
    image: 'career-growth', exportName: 'plan-croissance-carriere', sw: 'ukuaji-wa-kazi',
    form: select('Pays et devise d’affichage', 'country', countries) +
      select('Secteur', 'industry', '<option value="tech">Technologie</option><option value="finance">Finance</option><option value="healthcare">Santé</option><option value="engineering">Ingénierie</option><option value="marketing">Marketing</option><option value="fmcg">Grande consommation</option><option value="telecom">Télécoms</option><option value="energy">Énergie</option><option value="ngo">ONG</option><option value="govt">Secteur public</option>') +
      select('Niveau actuel', 'level', '<option value="0">Débutant</option><option value="1">Junior</option><option value="2" selected>Intermédiaire</option><option value="3">Senior</option><option value="4">Responsable</option><option value="5">Direction</option>') +
      field('Salaire mensuel actuel (0 = estimation)', 'salary', 'number', '0', 'min="0" max="1000000000000" step="any"') +
      field('Années d’expérience', 'experience', 'number', '5', 'min="0" max="40" step="1"') +
      select('Formation', 'education', '<option value="diploma">Diplôme professionnel</option><option value="degree" selected>Licence</option><option value="masters">Master</option><option value="phd">Doctorat</option>') +
      select('Voie visée', 'path', '<option value="ic">Expertise individuelle</option><option value="management">Management</option><option value="entrepreneur">Entrepreneuriat</option><option value="consultant">Conseil</option>') +
      select('Apprentissage hebdomadaire', 'learning', '<option value="0">0 heure</option><option value="2" selected>2 heures</option><option value="5">5 heures</option><option value="10">10 heures</option>') +
      select('Réseau professionnel', 'network', '<option value="low">Limité</option><option value="medium" selected>Moyen</option><option value="high">Fort</option>') +
      select('Mobilité entre employeurs', 'mobility', '<option value="no">Non</option><option value="sometimes" selected>Parfois</option><option value="yes">Oui, environ tous les 2 ans</option>'),
    boundary: 'Le modèle utilise des multiplicateurs généraux, pas des données salariales en direct. Vérifiez chaque cible auprès d’offres récentes, de recruteurs et de grilles écrites.'
  },
  {
    slug: 'changement-carriere', en: 'career-switch', kind: 'switch',
    title: 'Calculateur d’impact d’un changement de carrière',
    description: 'Mesurez le coût de formation, le revenu abandonné, le délai de retour à l’équilibre et l’écart cumulé sur cinq ans.',
    image: 'career-switch', exportName: 'plan-changement-carriere', sw: 'kubadili-kazi',
    form: select('Devise', 'currency', '<option value="NGN">NGN — naira</option><option value="KES">KES — shilling kényan</option><option value="ZAR">ZAR — rand</option><option value="GHS">GHS — cedi</option><option value="USD">USD</option>') +
      field('Salaire mensuel actuel', 'currentSalary', 'number', '300000', 'min="1" max="1000000000000" step="any"') +
      field('Avantages mensuels actuels', 'currentBenefits', 'number', '30000', 'min="0" max="1000000000000" step="any"') +
      field('Nouveau salaire mensuel attendu', 'newSalary', 'number', '500000', 'min="1" max="1000000000000" step="any"') +
      field('Coût total de reconversion', 'retrainingCost', 'number', '600000', 'min="0" max="1000000000000" step="any"') +
      field('Mois de formation', 'retrainingMonths', 'number', '6', 'min="0" max="48" step="1"') +
      field('Mois de recherche d’emploi', 'searchMonths', 'number', '3', 'min="0" max="18" step="1"') +
      select('Part du revenu conservée pendant la formation', 'partTimeIncome', '<option value="0">0 %</option><option value=".25">25 %</option><option value=".5" selected>50 %</option><option value=".75">75 %</option><option value="1">100 %</option>') +
      field('Croissance annuelle du nouveau salaire (%)', 'growthRate', 'number', '8', 'min="0" max="50" step=".1"') +
      field('Satisfaction actuelle (1 à 10)', 'satisfaction', 'number', '5', 'min="1" max="10" step="1"'),
    boundary: 'Cette projection ne garantit ni emploi, ni salaire, ni délai de recrutement. Confirmez les frais, les résultats des formations et la demande du métier visé.'
  },
  {
    slug: 'preparation-retraite', en: 'retirement-readiness', kind: 'retirement',
    title: 'Score de préparation à la retraite',
    description: 'Comparez une épargne projetée à une cible de dépenses selon trois hypothèses de rendement, avec un écart mensuel indicatif.',
    image: 'retirement-readiness', exportName: 'rapport-preparation-retraite', sw: 'utayari-wa-kustaafu',
    form: select('Pays et devise d’affichage', 'country', countries) +
      field('Âge actuel', 'age', 'number', '35', 'min="18" max="65" step="1"') +
      field('Âge de retraite visé', 'retirementAge', 'number', '60', 'min="40" max="75" step="1"') +
      field('Épargne retraite actuelle', 'savings', 'number', '3000000', 'min="0" max="1000000000000000" step="any"') +
      field('Contribution mensuelle', 'contribution', 'number', '100000', 'min="0" max="1000000000000" step="any"') +
      field('Salaire mensuel (contexte)', 'salary', 'number', '500000', 'min="0" max="1000000000000" step="any"') +
      field('Pension mensuelle vérifiée du prestataire', 'pensionPayout', 'number', '0', 'min="0" max="1000000000000" step="any"') +
      field('Dépenses mensuelles prévues à la retraite', 'expenses', 'number', '350000', 'min="1" max="1000000000000" step="any"'),
    boundary: 'La règle 25× et les rendements de 0 %, 3 % et 5 % sont des scénarios éducatifs. Ils ne remplacent pas les règles, frais, impôts ou conseils réglementés de votre pays.'
  },
  {
    slug: 'negociation-salaire', en: 'salary-negotiation', kind: 'negotiation',
    title: 'Calculateur de négociation salariale',
    description: 'Construisez une fourchette et un script de contre-offre à partir d’un salaire de référence mensuel que vous avez vous-même vérifié.',
    image: 'salary-negotiation', exportName: 'plan-negociation-salariale', sw: 'majadiliano-ya-mshahara',
    form: select('Pays et devise d’affichage', 'country', '<option value="NG">Nigeria</option><option value="KE">Kenya</option><option value="ZA">Afrique du Sud</option><option value="GH">Ghana</option><option value="EG">Égypte</option><option value="ET">Éthiopie</option><option value="RW">Rwanda</option><option value="CI">Côte d’Ivoire</option><option value="SN">Sénégal</option>') +
      field('Années d’expérience', 'experience', 'number', '5', 'min="0" max="40" step="1"') +
      field('Référence mensuelle vérifiée', 'benchmark', 'number', '500000', 'min="1" max="1000000000000" step="any"') +
      field('Salaire mensuel actuel (facultatif)', 'current', 'number', '0', 'min="0" max="1000000000000" step="any"') +
      field('Offre mensuelle reçue (facultatif)', 'offer', 'number', '0', 'min="0" max="1000000000000" step="any"'),
    boundary: 'AfroTools ne fournit pas de données salariales en direct ici. Utilisez une référence actuelle et comparable, puis vérifiez le rôle, le lieu, les avantages et les conditions écrites.'
  }
];

function page(tool) {
  const canonical = `https://afrotools.com/fr/tools/${tool.slug}/`;
  const english = `https://afrotools.com/tools/${tool.en}/`;
  return `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${tool.title} Afrique | AfroTools</title>
<meta name="description" content="${tool.description}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="fr" href="${canonical}">
<link rel="alternate" hreflang="en" href="${english}">
<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/${tool.sw}/">
<link rel="alternate" hreflang="x-default" href="${english}">
<meta property="og:type" content="website"><meta property="og:locale" content="fr_FR">
<meta property="og:title" content="${tool.title}"><meta property="og:description" content="${tool.description}">
<meta property="og:url" content="${canonical}"><meta property="og:image" content="https://afrotools.com/assets/img/tools/${tool.image}.webp">
<link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/fr-career-tools.css">
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
<script src="/assets/js/engines/career-planning.js" defer></script><script src="/assets/js/pages/fr-career-tools.js" defer></script>
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.title,
    url: canonical, applicationCategory: 'BusinessApplication', operatingSystem: 'Any',
    inLanguage: 'fr', isAccessibleForFree: true, isBasedOn: english,
    description: tool.description
  })}</script>
</head><body>
<afro-navbar lang="fr"></afro-navbar>
<main class="fr-career-main" data-fr-career-tool="${tool.kind}" data-export-name="${tool.exportName}">
  <section class="fr-career-hero"><p class="eyebrow">Carrière et développement · calcul local</p><h1>${tool.title}</h1><p>${tool.description}</p></section>
  <div class="fr-career-grid">
    <section class="fr-career-card" aria-labelledby="form-title">
      <h2 id="form-title">Vos hypothèses</h2><p>Les valeurs restent dans votre navigateur. Aucun compte n’est requis.</p>
      <form class="fr-career-form" novalidate>${tool.form}<div class="fr-span"><button class="fr-action" type="submit">Calculer mon scénario</button><p class="fr-status" data-status role="status" aria-live="polite"></p></div></form>
      <section class="fr-results" data-results hidden aria-live="polite"><h2>Votre scénario</h2><div class="fr-metrics" data-metrics></div><pre class="fr-report" data-report></pre>
        <div class="fr-actions"><button type="button" class="fr-action secondary" data-copy>Copier</button><button type="button" class="fr-action secondary" data-download>Télécharger TXT</button><button type="button" class="fr-action secondary" data-save>Enregistrer sur cet appareil</button></div>
      </section>
    </section>
    <aside class="fr-career-card"><h2>Limite de calcul</h2><p class="fr-note">${tool.boundary}</p>
      <h2>Confidentialité</h2><p class="fr-privacy">Calcul, copie, téléchargement et sauvegarde sont locaux. Aucune valeur saisie n’est envoyée à un serveur, à l’IA, à l’analytique ou placée dans l’URL.</p>
      <h2>À vérifier avant d’agir</h2><ul class="fr-source-list"><li>preuves et documents récents ;</li><li>conditions écrites de l’employeur ou du prestataire ;</li><li>frais, impôts et réglementation du pays ;</li><li>hypothèses avec un scénario prudent.</li></ul>
    </aside>
  </div>
</main><afro-footer></afro-footer>
</body></html>`;
}

for (const tool of tools) {
  const target = path.join(ROOT, 'fr', 'tools', tool.slug, 'index.html');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, page(tool), 'utf8');
}
console.log(`Built ${tools.length} native French Career pages.`);
