#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry } = require('./lib/safe-write');
const { normalizeBuildManagedHtml } = require('./lib/shared-asset-references');
const { localizedGeneratorEquivalent } = require('./lib/localized-generator-equivalence');
const { enhanceCategory } = require('./lib/localized-category-standard');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');

const apps = [
  {
    id: 'diamond-valuation',
    slug: 'evaluation-diamant',
    englishRoute: '/tools/diamond-valuation/',
    swRoute: '/sw/zana/thamani-ya-almasi/',
    title: 'Évaluation indicative d’un diamant',
    shortTitle: 'Évaluation de diamant',
    description: 'Estimez une valeur indicative à partir du carat, d’un prix de référence récent et des 4C, puis comparez détail, gros, assurance et revente.',
    image: 'diamond-valuation',
    applicationCategory: 'FinanceApplication',
    formula: 'Valeur ajustée = carat × prix de référence par carat × facteur de taille × facteur de couleur × facteur de pureté. Les scénarios de gros, assurance et revente appliquent ensuite vos pourcentages.',
    fields: `
      ${field('carat', 'Poids en carats', 'number', '1', 'min="0" step="any" inputmode="decimal"')}
      ${field('base', 'Prix de référence par carat (US$)', 'number', '12000', 'min="0" step="any" inputmode="decimal"')}
      ${select('cut', 'Taille', [
        ['1.00', 'Excellente'], ['0.95', 'Très bonne'], ['0.88', 'Bonne'], ['0.78', 'Moyenne'], ['0.68', 'Faible']
      ])}
      ${select('color', 'Couleur', [
        ['1.00', 'D (incolore)'], ['0.97', 'E'], ['0.94', 'F'], ['0.90', 'G'], ['0.85', 'H'],
        ['0.78', 'I'], ['0.70', 'J'], ['0.62', 'K ou inférieur']
      ])}
      ${select('clarity', 'Pureté', [
        ['1.00', 'FL / IF'], ['0.95', 'VVS1'], ['0.92', 'VVS2'], ['0.88', 'VS1'],
        ['0.84', 'VS2'], ['0.75', 'SI1'], ['0.66', 'SI2'], ['0.50', 'I1 ou inférieur']
      ])}
      ${field('pWhole', 'Gros (% de la valeur ajustée)', 'number', '65', 'min="0" max="200" step="any"')}
      ${field('pIns', 'Assurance (% de la valeur ajustée)', 'number', '120', 'min="0" max="300" step="any"')}
      ${field('pResale', 'Revente privée (% de la valeur ajustée)', 'number', '45', 'min="0" max="200" step="any"')}
    `,
    outputs: [
      ['retail', 'Valeur ajustée'], ['wholesale', 'Valeur de gros'],
      ['insurance', 'Remplacement assurance'], ['resale', 'Revente privée']
    ],
    faq: [
      ['Pourquoi saisir un prix par carat ?', 'Les listes professionnelles changent et peuvent être propriétaires. Le calcul reste honnête en utilisant une référence récente que vous fournissez au lieu d’un prix intégré qui deviendrait vite obsolète.'],
      ['Cette estimation remplace-t-elle un certificat ?', 'Non. La forme, la fluorescence, la qualité de taille, le certificat et la liquidité du marché peuvent modifier fortement le prix. Demandez une expertise indépendante avant achat, vente ou assurance.'],
      ['Mes données sont-elles envoyées ?', 'Non. Le calcul et le PDF s’exécutent dans votre navigateur, sans compte, stockage automatique ni envoi réseau de vos valeurs.']
    ]
  },
  {
    id: 'oil-well-production',
    slug: 'production-puits-petrole',
    englishRoute: '/tools/oil-well-production/',
    swRoute: '/sw/zana/uzalishaji-wa-kisima-cha-mafuta/',
    title: 'Planificateur de production d’un puits pétrolier',
    shortTitle: 'Production d’un puits',
    description: 'Modélisez un débit radial de Darcy, une production annuelle et un revenu net indicatif à partir de vos propres paramètres de réservoir et de prix.',
    image: 'oil-well-production',
    applicationCategory: 'BusinessApplication',
    formula: 'Débit q = 0,00708 × k × h × (Pe − Pwf) ÷ [μ × B × (ln(re ÷ rw) + skin)]. La production annuelle applique votre taux de disponibilité; le revenu net retranche redevance et coût par baril.',
    fields: `
      ${field('k', 'Perméabilité k (mD)', 'number', '50', 'min="0" step="any"')}
      ${field('h', 'Épaisseur nette h (ft)', 'number', '30', 'min="0" step="any"')}
      ${field('pe', 'Pression du réservoir Pe (psi)', 'number', '3000', 'min="0" step="any"')}
      ${field('pwf', 'Pression en écoulement Pwf (psi)', 'number', '2000', 'min="0" step="any"')}
      ${field('mu', 'Viscosité du pétrole μ (cp)', 'number', '1.2', 'min="0" step="any"')}
      ${field('bo', 'Facteur de volume B (rb/stb)', 'number', '1.2', 'min="0" step="any"')}
      ${field('re', 'Rayon de drainage re (ft)', 'number', '1000', 'min="0" step="any"')}
      ${field('rw', 'Rayon du puits rw (ft)', 'number', '0.35', 'min="0" step="any"')}
      ${field('skin', 'Facteur de skin s', 'number', '0', 'step="any"')}
      ${field('uptime', 'Disponibilité (%)', 'number', '90', 'min="0" max="100" step="any"')}
      ${field('price', 'Prix du pétrole (US$/bbl)', 'number', '75', 'min="0" step="any"')}
      ${field('opex', 'Coût d’exploitation (US$/bbl)', 'number', '15', 'min="0" step="any"')}
      ${field('roy', 'Taux de redevance (%)', 'number', '10', 'min="0" max="100" step="any"')}
    `,
    outputs: [['q', 'Débit quotidien'], ['annual', 'Production annuelle'], ['net', 'Revenu net indicatif']],
    faq: [
      ['Quel modèle est utilisé ?', 'Le calcul reprend la formule radiale de Darcy en régime permanent et en unités pétrolières. Il sert au dépistage d’un scénario, pas à la simulation dynamique d’un réservoir.'],
      ['Le résultat est-il une prévision de terrain ?', 'Non. Les essais de puits, contraintes de surface, déclin, eau, gaz, skin variable et conditions contractuelles doivent être analysés par un ingénieur pétrolier.'],
      ['Pourquoi le prix doit-il être saisi ?', 'AfroTools ne présente aucun prix du brut comme temps réel. Utilisez un prix daté provenant de votre contrat, d’un indice ou d’un scénario interne et conservez la référence dans le rapport.']
    ]
  },
  {
    id: 'oil-gas-revenue',
    slug: 'partage-revenus-petrole-gaz',
    englishRoute: '/tools/oil-gas-revenue/',
    swRoute: '/sw/zana/mgawanyo-wa-mapato-ya-mafuta-na-gesi/',
    title: 'Partage des revenus pétroliers et gaziers',
    shortTitle: 'Partage pétrole et gaz',
    description: 'Modélisez une cascade PSC avec redevance, cost oil, profit oil, part du contractant, part de l’État et impôt, selon vos propres clauses.',
    image: 'oil-gas-revenue',
    applicationCategory: 'BusinessApplication',
    formula: 'La redevance est retranchée du revenu brut. Le cost oil est le minimum entre coûts récupérables et plafond de récupération. Le profit oil restant est partagé, puis l’impôt est appliqué à la part de profit du contractant.',
    fields: `
      ${field('vol', 'Volume de production (bbl ou Mcf)', 'number', '1000000', 'min="0" step="any"')}
      ${field('price', 'Prix unitaire (US$)', 'number', '75', 'min="0" step="any"')}
      ${field('gross', 'Ou revenu brut direct (US$)', 'number', '', 'min="0" step="any"', 'Laissez vide pour utiliser volume × prix.')}
      ${field('roy', 'Redevance (%)', 'number', '10', 'min="0" max="100" step="any"')}
      ${field('costs', 'Coûts récupérables (US$)', 'number', '10000000', 'min="0" step="any"')}
      ${field('ceiling', 'Plafond de récupération (% après redevance)', 'number', '60', 'min="0" max="100" step="any"')}
      ${field('conshare', 'Part du contractant dans le profit oil (%)', 'number', '40', 'min="0" max="100" step="any"')}
      ${field('tax', 'Impôt sur le profit du contractant (%)', 'number', '30', 'min="0" max="100" step="any"')}
    `,
    outputs: [
      ['contractorNet', 'Net du contractant'], ['governmentTake', 'Part totale de l’État'],
      ['governmentPct', 'Part de l’État dans le revenu']
    ],
    faq: [
      ['Qu’est-ce que le cost oil ?', 'Il s’agit de la part de revenu utilisée pour récupérer les coûts admissibles, dans la limite du plafond contractuel saisi. Le solde non récupéré reste visible dans le calcul.'],
      ['Ces clauses correspondent-elles à un pays précis ?', 'Non. Chaque taux provient de vos propres clauses ou hypothèses. Les PSC varient par pays, bloc, appel d’offres et contrat, et peuvent être confidentiels.'],
      ['Le modèle couvre-t-il toutes les clauses ?', 'Non. Ring-fencing, uplift, tranches, carry, plafonds cumulés et mécanismes fiscaux particuliers ne sont pas modélisés. Utilisez le résultat comme scénario de planification uniquement.']
    ]
  },
  {
    id: 'mining-license-fee',
    slug: 'cout-licence-miniere',
    englishRoute: '/tools/mining-license-fee/',
    swRoute: '/sw/zana/gharama-ya-leseni-ya-madini/',
    title: 'Planificateur du coût d’une licence minière',
    shortTitle: 'Coût de licence minière',
    description: 'Additionnez frais initiaux, frais annuels, superficie et durée avec les mêmes données intégrées que l’outil anglais, sans traiter une valeur manquante comme zéro.',
    image: 'mining-license-fee',
    applicationCategory: 'BusinessApplication',
    dataScript: '/data/mining/mining-fees.js?v=a459b2f7',
    formula: 'Total = frais initiaux + frais annuels calculés × durée. Pour un barème à la superficie, les frais annuels sont multipliés par la superficie; un minimum légal est ensuite appliqué lorsqu’il existe.',
    fields: `
      ${select('country', 'Pays', [])}
      ${select('licence', 'Type de licence', [])}
      <div class="fr-mining-field" id="area-wrap">
        <label for="area">Superficie (<span id="area-unit"></span>)</label>
        <input id="area" name="area" type="number" min="0" step="any" inputmode="decimal" value="2">
      </div>
      ${field('years', 'Durée de détention (années)', 'number', '5', 'min="1" step="1"')}
      ${field('oneOff', 'Frais de demande / initiaux', 'number', '', 'min="0" step="any"')}
      ${field('annual', 'Frais annuels', 'number', '', 'min="0" step="any"')}
    `,
    outputs: [
      ['oneOffTotal', 'Frais initiaux'], ['annualComputed', 'Frais annuels calculés'], ['total', 'Total indicatif']
    ],
    faq: [
      ['Quels pays sont couverts ?', 'Le jeu intégré actuel couvre huit juridictions africaines. La liste et les types de licence proviennent du même fichier de données que l’outil anglais.'],
      ['Une valeur absente vaut-elle zéro ?', 'Non. Lorsqu’un frais n’est pas vérifié dans le jeu de données, le champ reste vide et le calcul exige une valeur saisie par l’utilisateur.'],
      ['Puis-je payer sur la base de ce résultat ?', 'Non. Les barèmes peuvent changer par règlement ou instrument statutaire. Confirmez toujours l’échéancier, la superficie facturable et les frais actuels auprès du cadastre ou du ministère compétent.']
    ]
  },
  {
    id: 'mining-royalty',
    slug: 'redevance-miniere',
    englishRoute: '/tools/mining-royalty/',
    swRoute: '/sw/zana/mrahaba-wa-madini/',
    title: 'Calculateur de redevance minière',
    shortTitle: 'Redevance minière',
    description: 'Estimez la redevance et le produit net dans 18 juridictions à partir de la valeur brute, du minéral et d’un taux intégré ou effectif à reconfirmer.',
    image: 'mining-royalty',
    applicationCategory: 'FinanceApplication',
    dataScript: '/data/mining/mining-royalties.js?v=cc51de93',
    formula: 'Redevance = valeur marchande brute × taux. Produit net = valeur brute − redevance − prélèvement statutaire distinct éventuel. Les barèmes variables exigent un taux effectif saisi par l’utilisateur.',
    fields: `
      ${select('country', 'Juridiction', [])}
      ${select('mineral', 'Minéral', [])}
      ${field('gross', 'Valeur marchande brute', 'number', '1000000', 'min="0.01" step="any" inputmode="decimal"')}
      ${field('rate', 'Taux de redevance (%)', 'number', '', 'min="0" max="100" step="any" inputmode="decimal"', '', 'rate-note')}
    `,
    outputs: [['royalty', 'Redevance due'], ['rate', 'Taux appliqué'], ['net', 'Produit net indicatif']],
    faq: [
      ['Les taux sont-ils actuels ?', 'Les données intégrées affichent une date de révision et une source. Elles restent des valeurs de planification : budget, loi, prix du minéral et statut du projet peuvent modifier le taux effectif.'],
      ['Pourquoi certains taux restent-ils vides ?', 'Lorsqu’une juridiction utilise une formule ou un barème lié au prix ou au profit, aucun taux unique n’est supposé. Saisissez le taux effectif calculé selon la source officielle.'],
      ['Le résultat constitue-t-il un conseil fiscal ?', 'Non. Il s’agit d’une estimation arithmétique. Confirmez la base, le taux, les prélèvements et la déclaration avec l’administration et un conseil qualifié.']
    ]
  },
  {
    id: 'artisanal-mining-income',
    slug: 'revenu-minier-artisanal',
    englishRoute: '/tools/artisanal-mining-income/',
    swRoute: '/sw/zana/mapato-ya-uchimbaji-mdogo/',
    title: 'Planificateur de revenu minier artisanal',
    shortTitle: 'Revenu minier artisanal',
    description: 'Comparez revenu au prix d’un acheteur agréé, revenu informel, charges et partage par mineur à partir de vos propres prix et quantités.',
    image: 'artisanal-mining-income',
    applicationCategory: 'BusinessApplication',
    formula: 'Revenu brut agréé = quantité × prix agréé. Écart informel = revenu agréé − revenu au pourcentage informel. Revenu net par mineur = (revenu agréé − charges) ÷ nombre de mineurs.',
    fields: `
      ${select('mineral', 'Minéral et unité', [
        ['gram|or', 'Or — grammes'], ['carat|diamant', 'Diamant — carats'],
        ['kg|cassitérite', 'Cassitérite — kg'], ['kg|coltan', 'Coltan — kg'], ['kg|cuivre', 'Cuivre — kg']
      ])}
      ${field('qty', 'Production mensuelle (unité choisie)', 'number', '60', 'min="0" step="any"')}
      ${field('formal', 'Prix de l’acheteur agréé par unité', 'number', '55', 'min="0" step="any"')}
      ${field('informalPct', 'Prix informel (% du prix agréé)', 'number', '70', 'min="0" max="100" step="any"')}
      ${field('costs', 'Charges mensuelles', 'number', '300', 'min="0" step="any"')}
      ${field('team', 'Mineurs partageant le revenu', 'number', '3', 'min="1" step="1"')}
    `,
    outputs: [
      ['netPerMiner', 'Net mensuel par mineur'], ['annualPerMiner', 'Net annuel par mineur'], ['gap', 'Écart du circuit informel']
    ],
    faq: [
      ['AfroTools fournit-il un prix du minerai ?', 'Non. Le prix et la quantité sont vos entrées. Utilisez une offre datée d’un acheteur agréé et conservez la référence dans le rapport.'],
      ['Le résultat garantit-il un revenu ?', 'Non. Teneur, récupération, pertes, météo, sécurité, coûts, permis et prix peuvent varier fortement. Le résultat est un scénario, pas une promesse de rendement.'],
      ['L’outil encourage-t-il l’exploitation informelle ?', 'Non. Il met en évidence l’écart de revenu et rappelle de vérifier licences, sécurité, environnement, obligations fiscales et canal d’achat agréé.']
    ]
  }
];

function field(name, label, type, value, attributes, help = '', helpId = '') {
  const describedBy = help || helpId ? ` aria-describedby="${helpId || `${name}-help`}"` : '';
  const helpMarkup = [
    help ? `<p class="fr-mining-help" id="${name}-help">${help}</p>` : '',
    helpId ? `<p class="fr-mining-help" id="${helpId}"></p>` : ''
  ].filter(Boolean).map((line) => `        ${line}`).join('\n');
  return `<div class="fr-mining-field">
        <label for="${name}">${label}</label>
        <input id="${name}" name="${name}" type="${type}" value="${value}" ${attributes}${describedBy}>${helpMarkup ? `\n${helpMarkup}` : ''}
      </div>`;
}

function select(name, label, options, attributes = '') {
  const optionMarkup = options.map(([value, text]) => `          <option value="${value}">${text}</option>`).join('\n');
  return `<div class="fr-mining-field">
        <label for="${name}">${label}</label>
        <select id="${name}" name="${name}"${attributes ? ` ${attributes}` : ''}>${optionMarkup ? `\n${optionMarkup}` : ''}
        </select>
      </div>`;
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function commonHead(app) {
  const canonical = `https://afrotools.com/fr/tools/${app.slug}/`;
  const english = `https://afrotools.com${app.englishRoute}`;
  const swahili = `https://afrotools.com${app.swRoute}`;
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${app.title} | Calcul local gratuit | AfroTools</title>
<meta name="description" content="${app.description}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="fr" href="${canonical}">
<link rel="alternate" hreflang="en" href="${english}">
<link rel="alternate" hreflang="sw" href="${swahili}">
<link rel="alternate" hreflang="x-default" href="${english}">
<meta property="og:title" content="${app.title} | AfroTools">
<meta property="og:description" content="${app.description}">
<meta property="og:image" content="https://afrotools.com/assets/img/tools/${app.image}.webp">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="AfroTools">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://afrotools.com/assets/img/tools/${app.image}.webp">
<link rel="stylesheet" href="/assets/css/tokens.min.css?v=f987f2a8">
<link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc">
<link rel="stylesheet" href="/assets/css/design-system.min.css?v=11fcf8e5">
<link rel="stylesheet" href="/assets/css/fr-mining-parity.css">
<script src="/assets/js/components/navbar.min.js?v=65f906d7" defer></script>
<script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script>
<script type="application/ld+json">${jsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: app.title,
    description: app.description,
    url: canonical,
    inLanguage: 'fr',
    applicationCategory: app.applicationCategory,
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' }
  })}</script>
<script type="application/ld+json">${jsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'AfroTools en français', item: 'https://afrotools.com/fr/' },
      { '@type': 'ListItem', position: 2, name: 'Mines et industries extractives', item: 'https://afrotools.com/fr/mining/' },
      { '@type': 'ListItem', position: 3, name: app.shortTitle, item: canonical }
    ]
  })}</script>
<script type="application/ld+json">${jsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'fr',
    mainEntity: app.faq.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  })}</script>`;
}

function evidenceFields() {
  return `<section class="fr-mining-card" aria-labelledby="evidence-title">
          <h2 id="evidence-title">Preuve du scénario</h2>
          <p>Ces trois champs sont obligatoires. Le calcul et le PDF restent bloqués tant que la source, sa date de vérification et votre niveau de confiance ne sont pas renseignés.</p>
          <div class="fr-mining-grid">
            ${field('sourceName', 'Nom de la source ou du document', 'text', '', 'autocomplete="off" form="mining-form" required', 'Exemple : devis du négociant, modèle PSC ou barème du cadastre.')}
            ${field('sourceDate', 'Date de vérification', 'date', '', 'form="mining-form" required')}
            ${select('sourceConfidence', 'Confiance déclarée', [
              ['', 'Choisir un niveau de confiance'],
              ['élevée', 'Élevée — document primaire récent'],
              ['moyenne', 'Moyenne — source secondaire ou hypothèse'],
              ['faible', 'Faible — valeur à confirmer']
            ], 'form="mining-form" required')}
          </div>
          <div class="fr-mining-privacy">Confidentialité locale : aucune saisie n’est envoyée, enregistrée ou ajoutée à l’URL. Le PDF est créé uniquement dans votre navigateur.</div>
        </section>`;
}

function relatedLinks(current) {
  return apps.filter((app) => app.id !== current.id).map((app) =>
    `<li><a href="/fr/tools/${app.slug}/">${app.shortTitle}</a></li>`
  ).join('');
}

function renderApp(app) {
  const dataScript = app.dataScript ? `<script src="${app.dataScript}"></script>` : '';
  return `<!DOCTYPE html>
<html lang="fr" data-chat-bundle="/assets/js/bundles/chat.88bd45ff.min.js">
<head>
${commonHead(app)}
</head>
<body class="fr-mining-page" data-mining-tool="${app.id}">
<afro-navbar active="mining"></afro-navbar>
<main class="fr-mining-shell">
  <header class="fr-mining-hero">
    <div>
      <p class="fr-mining-eyebrow">Mines et industries extractives · Calcul local</p>
      <h1>${app.title}</h1>
      <p>${app.description}</p>
    </div>
    <img class="fr-mining-art" src="/assets/img/tools/${app.image}.webp" alt="" width="640" height="640">
  </header>

  <div class="fr-mining-layout">
    <div>
      <form id="mining-form" class="fr-mining-card" novalidate>
        <h2>Hypothèses</h2>
        <p>Saisissez des valeurs documentées. Le calcul refuse les données essentielles absentes au lieu de les remplacer par zéro.</p>
        <div class="fr-mining-grid">${app.fields}</div>
        <div class="fr-mining-actions">
          <button class="fr-mining-action primary" type="submit">Calculer l’estimation</button>
          <button class="fr-mining-action" id="reset" type="button">Réinitialiser</button>
          <button class="fr-mining-action" id="pdf" type="button" disabled>Télécharger le rapport PDF</button>
        </div>
        <div class="fr-mining-error" id="error" role="alert" hidden></div>
        <p class="fr-mining-status" id="status" role="status" aria-live="polite">Prêt. Aucune donnée n’a été enregistrée.</p>
      </form>

      <section class="fr-mining-card fr-mining-result" id="result" tabindex="-1" aria-labelledby="result-title" hidden>
        <h2 id="result-title">Résultat de planification</h2>
        <div class="fr-mining-result-grid">
          ${app.outputs.map(([key, label]) => `<div class="fr-mining-stat"><strong data-output="${key}">—</strong><span>${label}</span></div>`).join('')}
        </div>
        <table class="fr-mining-table"><tbody id="breakdown"></tbody></table>
        <div class="fr-mining-source" id="source-summary"></div>
      </section>

      ${evidenceFields()}
    </div>

    <aside>
      <section class="fr-mining-card">
        <h2>Formule et limites</h2>
        <p>${app.formula}</p>
        <p><strong>Limite :</strong> estimation de planification uniquement; ce résultat n’est ni un avis juridique, fiscal, technique ou financier, ni un permis, une cotation ou une garantie.</p>
      </section>
      <section class="fr-mining-card">
        <h2>Autres outils miniers en français</h2>
        <ul class="fr-mining-related">
          <li><a href="/fr/mining/">Voir les six applications minières</a></li>
          ${relatedLinks(app)}
        </ul>
      </section>
    </aside>
  </div>

  <section class="fr-mining-card" aria-labelledby="faq-title">
    <h2 id="faq-title">Questions fréquentes</h2>
    ${app.faq.map(([question, answer]) => `<details><summary>${question}</summary><p>${answer}</p></details>`).join('')}
  </section>
</main>
<afro-footer></afro-footer>
${dataScript}
<script src="/assets/js/engines/fr-mining-parity.js"></script>
<script src="/assets/vendor/jspdf/jspdf.umd.min.js?v=c4b6303c"></script>
<script src="/assets/js/pages/fr-mining-parity.js"></script>
</body>
</html>
`;
}

function renderHub() {
  const canonical = 'https://afrotools.com/fr/mining/';
  const description = 'Six applications minières gratuites en français pour redevances, licences, diamant, puits pétrolier, partage PSC et revenu artisanal, avec calcul local et sources explicites.';
  const items = apps.map((app, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: app.shortTitle,
    url: `https://afrotools.com/fr/tools/${app.slug}/`
  }));
  return `<!DOCTYPE html>
<html lang="fr" data-chat-bundle="/assets/js/bundles/chat.88bd45ff.min.js">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Outils pour les mines et industries extractives en Afrique | AfroTools</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="fr" href="${canonical}">
<link rel="alternate" hreflang="en" href="https://afrotools.com/mining/">
<link rel="alternate" hreflang="x-default" href="https://afrotools.com/mining/">
<meta property="og:title" content="Outils miniers en français | AfroTools">
<meta property="og:description" content="${description}">
<meta property="og:image" content="https://afrotools.com/assets/img/tools/mining-royalty.webp">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/assets/css/tokens.min.css?v=f987f2a8">
<link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc">
<link rel="stylesheet" href="/assets/css/design-system.min.css?v=11fcf8e5">
<link rel="stylesheet" href="/assets/css/fr-mining-parity.css">
<script src="/assets/js/components/navbar.min.js?v=65f906d7" defer></script>
<script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script>
<script type="application/ld+json">${jsonLd({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Outils pour les mines et industries extractives en Afrique',
    description,
    url: canonical,
    inLanguage: 'fr',
    mainEntity: { '@type': 'ItemList', numberOfItems: apps.length, itemListElement: items }
  })}</script>
<script type="application/ld+json">${jsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'AfroTools en français', item: 'https://afrotools.com/fr/' },
      { '@type': 'ListItem', position: 2, name: 'Mines et industries extractives', item: canonical }
    ]
  })}</script>
</head>
<body class="fr-mining-page">
<afro-navbar active="mining"></afro-navbar>
<main class="fr-mining-shell">
  <header class="fr-mining-hero">
    <div>
      <p class="fr-mining-eyebrow">Afrique · Mines et industries extractives</p>
      <h1>Six applications minières, en français</h1>
      <p>Préparez un scénario de redevance, de licence, de valeur du diamant, de production pétrolière, de partage PSC ou de revenu artisanal. Chaque application calcule localement, bloque les données critiques absentes et exporte un PDF vérifiable.</p>
    </div>
    <img class="fr-mining-art" src="/assets/img/tools/mining-royalty.webp" alt="" width="640" height="640">
  </header>

  <section class="fr-mining-card" aria-labelledby="choose-title">
    <h2 id="choose-title">Choisissez le travail à accomplir</h2>
    <p><strong>Réponse courte :</strong> utilisez la redevance ou la licence pour un contrôle réglementaire de planification; les outils diamant, puits, PSC et revenu artisanal utilisent vos propres prix et hypothèses. Aucun résultat ne remplace une autorité, un contrat, une expertise ou un conseil qualifié.</p>
  </section>

  <section class="fr-mining-hub-grid" aria-label="Six applications minières en français">
    ${apps.map((app) => `<article class="fr-mining-hub-card">
      <img src="/assets/img/tools/${app.image}.webp" alt="" width="640" height="360">
      <div>
        <h2>${app.shortTitle}</h2>
        <p>${app.description}</p>
        <a href="/fr/tools/${app.slug}/">Ouvrir l’application</a>
      </div>
    </article>`).join('')}
  </section>

  <section class="fr-mining-card">
    <h2>Sources, fraîcheur et confidentialité</h2>
    <p>Les applications de licence et de redevance réutilisent les mêmes fichiers de données que leurs propriétaires anglais et affichent leur date de révision. Les quatre autres utilisent uniquement les valeurs et références que vous saisissez. Aucun scénario n’est sauvegardé ni envoyé automatiquement.</p>
  </section>
</main>
<afro-footer></afro-footer>
</body>
</html>
`;
}

function writeTarget(relativePath, content) {
  const target = path.join(ROOT, relativePath);
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (CHECK) {
    if (!localizedGeneratorEquivalent(current, content)) {
      throw new Error(`French Mining output is stale: ${relativePath}`);
    }
    return false;
  }
  if (localizedGeneratorEquivalent(current, content)) return false;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  writeFileSyncWithRetry(target, content, 'utf8');
  return true;
}

function main() {
  let changed = 0;
  changed += Number(writeTarget('fr/mining/index.html', enhanceCategory(renderHub(), 'fr')));
  apps.forEach((app) => {
    changed += Number(writeTarget(`fr/tools/${app.slug}/index.html`, renderApp(app)));
  });
  console.log(`${CHECK ? 'Checked' : 'Generated'} French Mining hub + ${apps.length} app routes; changed=${changed}.`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
function normalizeGeneratedHtml(html) {
  const normalized = normalizeBuildManagedHtml(html)
    .replace(/\s*<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>\s*/gi, '\n')
    .replace(/\s*<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, '\n')
    .replace(
      /(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
      (full, opening, payload, closing) => {
        try {
          return `${opening}${JSON.stringify(JSON.parse(payload))}${closing}`;
        } catch {
          return full;
        }
      }
    )
    .replace(/<\/main>\s*<afro-footer>/g, '</main>\n<afro-footer>');
  return normalized.match(/<body\b[\s\S]*<\/body>/i)?.[0] || normalized;
}
