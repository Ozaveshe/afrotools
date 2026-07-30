#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { normalizeBuildManagedHtml } = require('./lib/shared-asset-references');

const ROOT = path.resolve(__dirname, '..');
const write = process.argv.includes('--write');
const check = process.argv.includes('--check');

function normalizeTelecomGeneratorHtml(html) {
  const seoLinks = [];
  let normalized = normalizeBuildManagedHtml(html)
    .replace(
      /\s*<link\b(?=[^>]*\brel=["'](?:canonical|alternate)["'])[^>]*>/gi,
      (tag) => {
        seoLinks.push(tag.replace(/\s+/g, ' ').trim());
        return '';
      }
    )
    .replace(
      /<script\b([^>]*)type=["']application\/ld\+json["']([^>]*)>([\s\S]*?)<\/script>/gi,
      (tag, beforeType, afterType, json) => {
        try {
          const value = JSON.parse(json);
          // The SEO postbuild may derive this from og:image. The generator
          // contract verifies artwork separately, so it is not source drift.
          delete value.image;
          return `<script${beforeType}type="application/ld+json"${afterType}>${JSON.stringify(value)}</script>`;
        } catch {
          return tag;
        }
      }
    )
    // seo:og supplies this when a source page omits a Twitter image. Product
    // artwork is asserted independently by the parity test.
    .replace(/\s*<meta\b[^>]*\bname=["']twitter:image["'][^>]*>/gi, '')
    // The release asset pass versions non-shared data scripts as well as
    // /assets references. Query hashes do not change generator ownership.
    .replace(/((?:src|href)=["'][^"'?]+)\?v=[a-f0-9]+(["'])/gi, '$1$2')
    .replace(/\r\n?/g, '\n')
    .replace(/>\s+</g, '><')
    .trim();

  seoLinks.sort();
  normalized += `<!-- normalized-seo-links:${seoLinks.join('|')} -->`;
  return normalized;
}

const field = (name, label, input, help = '') => `
<div class="tel-field">
  <label for="${name}">${label}</label>
  ${input}
${help ? `  <small>${help}</small>\n` : ''}
</div>`;

const country = (name = 'country', label = 'Pays', requires = '') => field(
  name,
  label,
  `<select id="${name}" name="${name}" data-country-select${requires ? ` data-country-requires="${requires}"` : ''} required><option value="">Choisir un pays…</option></select>`
);

const number = (name, label, value, min = '0', step = '1', help = '', max = '') => field(
  name,
  label,
  `<input id="${name}" name="${name}" type="number" value="${value}" min="${min}"${max ? ` max="${max}"` : ''} step="${step}" inputmode="decimal" required>`,
  help
);

const range = (name, label, value, min, max, step, help = '') => field(
  name,
  label,
  `<input id="${name}" name="${name}" type="range" value="${value}" min="${min}" max="${max}" step="${step}" required>
  <output class="tel-range-value" for="${name}" data-range-output="${name}">${value}</output>`,
  help
);

const select = (name, label, options, help = '') => field(
  name,
  label,
  `<select id="${name}" name="${name}" required>${options.map(([value, text, selected]) => `<option value="${value}"${selected ? ' selected' : ''}>${text}</option>`).join('')}</select>`,
  help
);

const APPS = [
  {
    toolId: 'telecom-data-plan',
    kind: 'dataPlans',
    slug: 'comparateur-forfaits-data',
    english: '/telecom/data-plan-compare/',
    image: 'telecom-data-plan',
    title: 'Comparateur de forfaits data',
    description: 'Comparez les forfaits archivés par prix par Go, validité et opérateur, sans présenter les prix comme actuels.',
    fields: country() + field('operator', 'Opérateur', '<select id="operator" name="operator" required><option value="all">Tous les opérateurs</option></select>')
      + select('validity', 'Validité', [['all', 'Toutes'], ['1', 'Quotidienne'], ['7', 'Hebdomadaire'], ['30', 'Mensuelle']])
      + select('sort', 'Trier par', [['pricePerGB', 'Prix par Go'], ['price', 'Prix total'], ['volumeMB', 'Volume']]),
    method: 'Le moteur convertit le volume en Mo, calcule prix ÷ (Mo ÷ 1 024), puis filtre et trie le snapshot. Le prix final doit être confirmé auprès de l’opérateur.'
  },
  {
    toolId: 'telecom-ussd',
    kind: 'ussdDirectory',
    slug: 'annuaire-codes-ussd',
    english: '/telecom/ussd-directory/',
    image: 'telecom-ussd',
    title: 'Annuaire prudent des codes USSD',
    description: 'Recherchez les codes enregistrés dans le snapshot, puis vérifiez-les avant toute composition.',
    fields: country() + select('category', 'Usage', [['all', 'Tous les usages']])
      + field('query', 'Recherche facultative', '<input id="query" name="query" type="search" autocomplete="off" placeholder="solde, data, opérateur…">', 'Aucun numéro de téléphone n’est demandé.'),
    method: 'La recherche locale parcourt les catégories, opérateurs et codes du snapshot. Les codes sont datés de manière insuffisante et peuvent déclencher une action différente après modification par un opérateur.'
  },
  {
    toolId: 'telecom-roaming',
    kind: 'roaming',
    slug: 'calculateur-roaming',
    english: '/telecom/roaming-cost/',
    image: 'telecom-roaming',
    title: 'Calculateur roaming ou SIM locale',
    description: 'Estimez un scénario d’itinérance à partir du snapshot et gardez les devises séparées sans taux utilisateur.',
    fields: country('country', 'Pays de départ', 'roaming') + country('destination', 'Pays de destination')
      + number('days', 'Durée du voyage (jours)', '7', '1', '1', '', '90')
      + number('minutesPerDay', 'Minutes par jour', '15', '0', '1', '', '300')
      + number('smsPerDay', 'SMS par jour', '5', '0', '1', '', '200')
      + number('dataMBPerDay', 'Données par jour (Mo)', '200', '0', '1', '', '5000')
      + field('exchangeRate', 'Taux destination → devise de départ (facultatif)', '<input id="exchangeRate" name="exchangeRate" type="number" min="0.000001" step="any" inputmode="decimal">', 'Saisissez votre propre taux. AfroTools ne récupère aucun taux en direct.'),
    method: 'Le total roaming est jours × (minutes × tarif minute + SMS × tarif SMS + Mo × tarif Mo). La SIM locale utilise le forfait archivé correspondant ou une estimation prudente. Les devises ne sont comparées que si vous fournissez un taux.'
  },
  {
    toolId: 'telecom-starlink',
    kind: 'starlink',
    slug: 'comparateur-starlink-isp',
    english: '/telecom/starlink-compare/',
    image: 'telecom-starlink',
    title: 'Comparateur Starlink et ISP locaux',
    description: 'Comparez uniquement les coûts archivés et vérifiez la disponibilité exacte à l’adresse sur les sites officiels.',
    fields: country(),
    method: 'Le coût sur trois ans additionne le matériel enregistré et 36 mensualités. Le drapeau de disponibilité Starlink du snapshot est explicitement périmé et ne constitue pas une vérification d’adresse.'
  },
  {
    toolId: 'telecom-tv',
    kind: 'tv',
    slug: 'comparateur-tv-streaming',
    english: '/telecom/tv-compare/',
    image: 'telecom-tv',
    title: 'Comparateur TV et streaming',
    description: 'Comparez les bouquets archivés sans inventer de chaînes, de prix ou de disponibilité actuels.',
    fields: country()
      + range('maxPrice', 'Prix mensuel maximum', '100000', '0', '100000', '100', 'Valeur exprimée dans la devise locale du pays sélectionné.')
      + select('sort', 'Trier par', [
        ['price-asc', 'Prix : croissant'],
        ['price-desc', 'Prix : décroissant', true],
        ['channels-desc', 'Plus grand nombre de chaînes'],
        ['value', 'Meilleur rapport prix/chaîne']
      ]),
    method: 'Le coût par chaîne est prix ÷ nombre de chaînes lorsqu’un décompte existe. Les services de streaming sans décompte ne sont pas classés sur cette mesure.'
  },
  {
    toolId: 'telecom-data-usage',
    kind: 'dataUsage',
    slug: 'calculateur-consommation-data',
    english: '/telecom/data-usage-calc/',
    image: 'telecom-data-usage',
    title: 'Calculateur de consommation data',
    description: 'Transformez vos usages en estimation mensuelle, avec marge de 10 %, puis consultez les forfaits archivés proches.',
    fields: country()
      + range('browsing', 'Navigation (heures/jour)', '1', '0', '8', '0.5')
      + range('social', 'Réseaux sociaux (heures/jour)', '2', '0', '8', '0.5')
      + range('youtube', 'Vidéo (heures/jour)', '1', '0', '6', '0.5')
      + select('youtubeQuality', 'Qualité vidéo', [['low', 'Faible'], ['medium', 'Moyenne'], ['high', 'Haute'], ['hd', 'HD']])
      + range('music', 'Musique (heures/jour)', '0.5', '0', '8', '0.5')
      + range('videocall', 'Appels vidéo (heures/jour)', '0.5', '0', '4', '0.5')
      + range('email', 'E-mails par jour', '20', '0', '100', '5')
      + range('downloads', 'Téléchargements (Go/mois)', '1', '0', '20', '0.5'),
    method: 'Le moteur applique des coefficients fixes par activité, multiplie les usages quotidiens par 30, conserve les téléchargements comme valeur mensuelle, puis ajoute une marge de 10 %.'
  },
  {
    toolId: 'telecom-airtime',
    kind: 'airtime',
    slug: 'valeur-credit-telephonique',
    english: '/telecom/airtime-value/',
    image: 'telecom-airtime',
    title: 'Valeur estimée du crédit téléphonique',
    description: 'Testez votre propre fourchette de conversion au lieu de supposer un rendement actuel.',
    fields: country() + field('operator', 'Opérateur', '<select id="operator" name="operator" required><option value="">Choisir un opérateur…</option></select>')
      + field('amount', 'Montant du crédit', '<input id="amount" name="amount" type="number" min="1" step="1" inputmode="decimal" required placeholder="Ex. 5 000">'),
    method: 'Les bornes sont montant × 70 % et montant × 85 %, comme dans le calculateur anglais. Ces pourcentages sont des hypothèses de planification fixes, pas des taux de marché ni une promesse de conversion.'
  },
  {
    toolId: 'telecom-portability',
    kind: 'portability',
    slug: 'portabilite-numero-mobile',
    english: '/telecom/number-portability/',
    image: 'telecom-portability',
    title: 'Préparer une portabilité de numéro',
    description: 'Consultez la fiche archivée et obtenez une liste de vérification sans affirmer le statut réglementaire actuel.',
    fields: country(),
    method: 'Aucun calcul réglementaire n’est effectué. L’outil présente les champs du snapshot comme des éléments à confirmer auprès du régulateur et du nouvel opérateur.'
  },
  {
    toolId: 'telecom-sim-reg',
    kind: 'simRegistration',
    slug: 'verification-enregistrement-sim',
    english: '/telecom/sim-registration/',
    image: 'telecom-sim-reg',
    title: 'Vérifier les exigences d’enregistrement SIM',
    description: 'Préparez votre vérification officielle sans saisir de numéro, document d’identité ou donnée biométrique.',
    fields: country(),
    method: 'L’outil affiche uniquement une fiche archivée. Ne saisissez et ne téléversez aucune donnée personnelle. Les exigences, échéances, codes et sanctions doivent être confirmés auprès du régulateur ou de l’opérateur.'
  },
  {
    toolId: 'telecom-internet',
    kind: 'internet',
    slug: 'comparateur-internet',
    english: '/telecom/internet-compare/',
    image: 'telecom-internet',
    title: 'Comparateur internet fixe et sans fil',
    description: 'Comparez prix par Mbps et technologies du snapshot, puis vérifiez couverture, débit et frais à l’adresse.',
    fields: country() + select('sort', 'Trier par', [['value', 'Coût par Mbps'], ['price', 'Prix mensuel'], ['speed', 'Débit annoncé']]),
    method: 'Le moteur extrait le débit numérique enregistré, calcule prix mensuel ÷ Mbps, puis trie les offres. Il ne mesure pas la couverture, le débit réel ni la disponibilité actuelle.'
  },
  {
    toolId: 'telecom-fiber-lte-5g',
    kind: 'technology',
    slug: 'fibre-lte-5g',
    english: '/telecom/fiber-lte-5g/',
    image: 'telecom-fiber-lte-5g',
    title: 'Choisir entre fibre, LTE et 5G',
    description: 'Utilisez un modèle transparent de priorités, puis confirmez la couverture exacte et les performances réelles.',
    fields: country()
      + select('priority', 'Priorité', [['speed', 'Débit'], ['cost', 'Coût'], ['reliability', 'Fiabilité']])
      + select('usage', 'Usage principal', [['streaming', 'Streaming'], ['work', 'Travail'], ['basic', 'Usage courant']])
      + select('location', 'Zone', [['urban', 'Urbaine'], ['suburban', 'Périurbaine'], ['rural', 'Rurale']]),
    method: 'Le modèle additionne des points fixes selon priorité, usage et zone. Les débits, latences et fiabilités sont des hypothèses comparatives, pas une mesure réseau actuelle.'
  },
  {
    toolId: 'telecom-business-internet',
    kind: 'businessInternet',
    slug: 'internet-entreprise',
    english: '/telecom/business-internet/',
    image: 'telecom-business-internet',
    title: 'Dimensionner internet pour une entreprise',
    description: 'Estimez bande passante et données mensuelles avant de demander des devis vérifiés aux fournisseurs.',
    fields: country()
      + number('employees', 'Nombre de personnes', '10', '1', '1', '', '10000')
      + select('minimumSpeed', 'Débit minimum souhaité', [
        ['10', '10 Mbps (basique)'],
        ['25', '25 Mbps (petite équipe)'],
        ['50', '50 Mbps (équipe moyenne)', true],
        ['100', '100 Mbps (grande équipe)'],
        ['200', '200+ Mbps (entreprise)']
      ])
      + select('usage', 'Intensité d’usage', [['basic', 'Basique'], ['moderate', 'Modérée', true], ['heavy', 'Intensive']]),
    method: 'La bande passante recommandée est le maximum entre le minimum saisi et effectif × 1, 3 ou 8 Mbps. Les données mensuelles suivent effectif × 30 × multiplicateur × 2 Go.'
  },
  {
    toolId: 'telecom-bulk-sms',
    kind: 'bulkSms',
    slug: 'prix-sms-pro',
    english: '/telecom/bulk-sms-pricing/',
    image: 'telecom-bulk-sms',
    title: 'Estimer un budget SMS professionnel',
    description: 'Appliquez les paliers historiques comme hypothèses, sans les présenter comme remise fournisseur actuelle.',
    fields: country()
      + range('volume', 'SMS par mois', '10000', '1000', '1000000', '1000')
      + select('kind', 'Destination', [['domestic', 'Nationale'], ['international', 'Internationale']]),
    method: 'Le taux international du modèle vaut 1,5 × le taux national. Les paliers de remise sont 0 %, 5 %, 10 %, 15 % et 25 % à partir de 0, 10 000, 50 000, 100 000 et 500 000 messages.'
  },
  {
    toolId: 'telecom-whatsapp-vs-sms',
    kind: 'whatsappVsSms',
    slug: 'whatsapp-vs-sms',
    english: '/telecom/whatsapp-vs-sms/',
    image: 'telecom-whatsapp-vs-sms',
    title: 'Comparer WhatsApp Business et SMS',
    description: 'Comparez les coûts archivés par type de conversation avec le modèle de paliers SMS.',
    fields: country()
      + number('volume', 'Messages par mois', '10000', '100', '1', '', '10000000')
      + range('marketing', 'Part marketing (%)', '40', '0', '100', '5')
      + range('utility', 'Part utilitaire (%)', '35', '0', '100', '5')
      + range('service', 'Part service (%)', '25', '0', '100', '5', 'Les trois parts sont équilibrées automatiquement quand le total dépasse 100 %.'),
    method: 'Le volume est réparti selon les trois pourcentages. Chaque part est multipliée par le coût archivé correspondant; le SMS applique le même palier que le calculateur SMS professionnel.'
  }
];

function alternates(app) {
  const englishHtml = fs.readFileSync(path.join(ROOT, app.english.replace(/^\/|\/$/g, ''), 'index.html'), 'utf8');
  const siblingAlternates = Array.from(englishHtml.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g))
    .filter((match) => !['en', 'fr', 'x-default'].includes(match[1]))
    .map((match) => `<link rel="alternate" hreflang="${match[1]}" href="${match[2]}">`);
  return [
    `<link rel="canonical" href="https://afrotools.com/fr/telecom/${app.slug}/">`,
    `<link rel="alternate" hreflang="en" href="https://afrotools.com${app.english}">`,
    `<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/telecom/${app.slug}/">`,
    ...siblingAlternates,
    `<link rel="alternate" hreflang="x-default" href="https://afrotools.com${app.english}">`
  ].join('\n');
}

function page(app) {
  const route = `/fr/telecom/${app.slug}/`;
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: app.title,
    description: app.description,
    url: `https://afrotools.com${route}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    inLanguage: 'fr',
    isAccessibleForFree: true,
    browserRequirements: 'JavaScript'
  });
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${app.title} pour l’Afrique | AfroTools</title>
  <meta name="description" content="${app.description}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${app.title} | AfroTools">
  <meta property="og:description" content="${app.description}">
  <meta property="og:url" content="https://afrotools.com${route}">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/${app.image}.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${app.title} | AfroTools">
  <meta name="twitter:description" content="${app.description}">
  <meta name="twitter:image" content="https://afrotools.com/assets/img/tools/${app.image}.webp">
  ${alternates(app)}
  <link rel="icon" href="/assets/img/logo-mark.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/tokens.css">
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <link rel="stylesheet" href="/assets/css/global.css">
  <link rel="stylesheet" href="/assets/css/fr-telecom-parity.css">
  <script type="application/ld+json">${schema}</script>
</head>
<body class="fr-telecom-app">
  <a class="tel-skip" href="#outil">Aller à l’outil</a>
  <afro-navbar active="telecom"></afro-navbar>
  <header class="tel-hero">
    <div class="tel-shell tel-hero-grid">
      <div>
        <p class="tel-kicker">Télécom · Calcul local · Français</p>
        <h1>${app.title}</h1>
        <p class="tel-lede">${app.description}</p>
      </div>
      <figure class="tel-app-artwork">
        <img src="/assets/img/tools/${app.image}.webp" alt="Illustration de l’outil ${app.title}" width="640" height="360">
      </figure>
    </div>
  </header>
  <main class="tel-main tel-shell" id="outil">
    <aside class="tel-source-alert" data-source-state="stale" data-source-confidence="low">
      <strong>Snapshot archivé du 1er mars 2026 · périmé · confiance faible</strong>
      <p>Ce jeu dépasse sa cadence de 30 jours. Aucun tarif, code, forfait, débit, couverture, statut réglementaire, disponibilité ou fournisseur n’est présenté comme actuel. Vérifiez toujours l’offre et l’adresse auprès de la source officielle.</p>
    </aside>
    <div class="tel-layout">
      <section class="tel-tool" aria-labelledby="form-title">
        <h2 id="form-title">Votre scénario</h2>
        <form id="telecom-form" novalidate>
          <div class="tel-fields">${app.fields}</div>
          <div class="tel-button-row">
            <button class="tel-button" type="submit">Calculer avec le snapshot</button>
            <button class="tel-button secondary" id="telecom-reset" type="reset">Réinitialiser</button>
          </div>
          <p class="tel-error" id="telecom-errors" role="alert" aria-live="assertive"></p>
        </form>
      </section>
      <div class="tel-aside">
        <section class="tel-results-panel" aria-labelledby="results-title">
          <h2 id="results-title">Résultat de planification</h2>
          <div id="telecom-results" tabindex="-1" aria-live="polite">
            <p class="tel-empty">Renseignez le formulaire pour obtenir un résultat local.</p>
          </div>
        </section>
        <section class="tel-export-panel" aria-labelledby="export-title">
          <h2 id="export-title">Exporter ou rouvrir</h2>
          <p class="tel-empty">Les exports restent sur cet appareil. Le JSON conserve les champs du scénario et peut être rouvert dans ce même outil.</p>
          <div class="tel-button-row">
            <button class="tel-button secondary" id="telecom-copy" type="button" hidden disabled>Copier le résumé</button>
            <button class="tel-button secondary" id="telecom-download-txt" type="button" hidden disabled>Télécharger TXT</button>
            <button class="tel-button secondary" id="telecom-download-json" type="button" hidden disabled>Télécharger JSON</button>
            <label class="tel-file-label" for="telecom-import">Rouvrir un JSON
              <input id="telecom-import" type="file" accept="application/json,.json">
            </label>
          </div>
          <p class="tel-export-status" id="telecom-export-status" role="status" aria-live="polite"></p>
        </section>
      </div>
    </div>
    <section class="tel-method" aria-labelledby="method-title">
      <h2 id="method-title">Méthode, limites et sources</h2>
      <p>${app.method}</p>
      <ul>
        <li>Unités : Mo, Go, Mbps, minutes, jours et devise locale indiquée par le snapshot.</li>
        <li>États invalides ou données absentes : le calcul s’arrête et les lacunes sont affichées explicitement.</li>
        <li>Source : <a href="/data/telecom/official-sources.json">registre des sources Télécom et lacunes connues</a>.</li>
      </ul>
    </section>
    <section class="tel-privacy" aria-labelledby="privacy-title">
      <h2 id="privacy-title">Vie privée et assistance</h2>
      <p>Le calcul, l’export et la réouverture sont effectués dans votre navigateur. Aucun champ n’est envoyé, aucune IA n’est appelée et aucun compte n’est requis. Le routeur local AfroTools peut ouvrir cet outil sans consentement; toute assistance IA facultative sur une autre surface doit demander un consentement explicite et conserver une alternative locale.</p>
    </section>
  </main>
  <afro-footer></afro-footer>
  <script>window.AFROTOOLS_TELECOM_DISABLE_LIVE_DATA = true;</script>
  <script src="/data/telecom/country-telecom-index.js"></script>
  <script src="/assets/js/engines/telecom-planning-engine.js"></script>
  <script src="/assets/js/lib/fr-telecom-localization.js"></script>
  <script id="fr-telecom-config" type="application/json">${JSON.stringify({
    toolId: app.toolId,
    kind: app.kind,
    slug: app.slug,
    title: app.title,
    route
  })}</script>
  <script src="/assets/js/components/navbar.js" defer></script>
  <script src="/assets/js/components/footer.js" defer></script>
  <script src="/assets/js/pages/fr-telecom-app.js" defer></script>
</body>
</html>
`;
}

function hubPage() {
  const cards = APPS.map((app) => `<li>
  <a class="tel-hub-card" href="/fr/telecom/${app.slug}/">
    <img src="/assets/img/tools/${app.image}.webp" alt="" width="640" height="360" loading="lazy">
    <span><strong>${app.title}</strong><small>${app.description}</small></span>
  </a>
</li>`).join('\n');
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '14 outils Télécom en français',
    description: 'Outils de planification Télécom en français fondés sur un snapshot archivé et des calculs locaux.',
    url: 'https://afrotools.com/fr/telecom/',
    inLanguage: 'fr',
    mainEntity: APPS.map((app) => ({
      '@type': 'SoftwareApplication',
      name: app.title,
      url: `https://afrotools.com/fr/telecom/${app.slug}/`
    }))
  });
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>14 outils Télécom en français | AfroTools</title>
  <meta name="description" content="Accédez aux 14 outils Télécom AfroTools en français : calcul local, sources explicites et limites de fraîcheur visibles.">
  <meta property="og:type" content="website">
  <meta property="og:title" content="14 outils Télécom en français | AfroTools">
  <meta property="og:description" content="Planifiez data, roaming, internet, SMS, SIM, USSD et TV avec des hypothèses transparentes.">
  <meta property="og:url" content="https://afrotools.com/fr/telecom/">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/telecom-data-plan.webp">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://afrotools.com/fr/telecom/">
  <link rel="alternate" hreflang="en" href="https://afrotools.com/telecom/">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/telecom/">
  <link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/mawasiliano-na-mtandao/">
  <link rel="alternate" hreflang="ha" href="https://afrotools.com/ha/sadarwa/">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com/telecom/">
  <link rel="icon" href="/assets/img/logo-mark.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/tokens.css">
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <link rel="stylesheet" href="/assets/css/global.css">
  <link rel="stylesheet" href="/assets/css/fr-telecom-parity.css">
  <style>
    .tel-hub-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:1rem;padding:0;list-style:none}
    .tel-hub-card{display:grid;height:100%;border:1px solid var(--tel-border);border-radius:.65rem;background:var(--tel-surface);color:var(--tel-text);text-decoration:none}
    .tel-hub-card img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover}
    .tel-hub-card span{display:grid;gap:.45rem;padding:1rem}
    .tel-hub-card strong{font-size:1.05rem}
    .tel-hub-card small{color:var(--tel-muted);font-size:.92rem;line-height:1.5}
    .tel-hub-card:focus-visible{outline:3px solid var(--tel-accent);outline-offset:3px}
  </style>
  <script type="application/ld+json">${schema}</script>
</head>
<body class="fr-telecom-app">
  <a class="tel-skip" href="#outils">Aller aux outils</a>
  <afro-navbar active="telecom"></afro-navbar>
  <header class="tel-hero">
    <div class="tel-shell">
      <p class="tel-kicker">Télécom &amp; mobile · 14 applications en français</p>
      <h1>Planifier sans confondre archive et offre actuelle</h1>
      <p class="tel-lede">Chaque application calcule localement, affiche ses unités et ses hypothèses, refuse les entrées invalides et permet un export JSON rouvrable.</p>
    </div>
  </header>
  <main class="tel-main tel-shell" id="outils">
    <aside class="tel-source-alert" data-source-state="stale" data-source-confidence="low">
      <strong>Snapshot archivé du 1er mars 2026 · périmé · confiance faible</strong>
      <p>Les sources comportent des lacunes importantes. Vérifiez tarifs, codes, couverture, débits, disponibilité et règles auprès des opérateurs ou régulateurs officiels avant toute décision.</p>
    </aside>
    <section aria-labelledby="apps-title">
      <h2 id="apps-title">Les 14 applications Télécom</h2>
      <ul class="tel-hub-list">${cards}</ul>
    </section>
    <section class="tel-privacy" aria-labelledby="hub-privacy">
      <h2 id="hub-privacy">Contrat local et prudent</h2>
      <p>Le calcul, l’export et la réouverture restent dans le navigateur. Les surfaces Télécom ne demandent aucun identifiant personnel. Le routage local peut ouvrir une application sans consentement; une éventuelle assistance IA reste facultative, consentie et remplaçable par le parcours local.</p>
      <p><a href="/data/telecom/official-sources.json">Consulter le registre des sources et les lacunes</a></p>
    </section>
  </main>
  <afro-footer></afro-footer>
  <script>window.AFROTOOLS_TELECOM_DISABLE_LIVE_DATA = true;</script>
  <script src="/assets/js/components/navbar.js" defer></script>
  <script src="/assets/js/components/footer.js" defer></script>
</body>
</html>
`;
}

const drift = [];
for (const app of APPS) {
  const target = path.join(ROOT, 'fr', 'telecom', app.slug, 'index.html');
  const expected = page(app);
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (normalizeTelecomGeneratorHtml(current) !== normalizeTelecomGeneratorHtml(expected)) {
    drift.push(path.relative(ROOT, target).replace(/\\/g, '/'));
  }
  if (write) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, expected, 'utf8');
  }

  const englishTarget = path.join(ROOT, app.english.replace(/^\/|\/$/g, ''), 'index.html');
  const frenchAlternate = `<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/telecom/${app.slug}/">`;
  const englishCurrent = fs.readFileSync(englishTarget, 'utf8');
  if (!englishCurrent.includes(frenchAlternate)) {
    drift.push(path.relative(ROOT, englishTarget).replace(/\\/g, '/'));
    if (write) {
      const englishMarker = /(<link rel="alternate" hreflang="en"[^>]*>\r?\n)/;
      if (!englishMarker.test(englishCurrent)) {
        throw new Error(`English hreflang marker missing in ${path.relative(ROOT, englishTarget)}`);
      }
      fs.writeFileSync(englishTarget, englishCurrent.replace(englishMarker, `$1${frenchAlternate}\n`), 'utf8');
    }
  }
}
const hubTarget = path.join(ROOT, 'fr', 'telecom', 'index.html');
const expectedHub = hubPage();
const currentHub = fs.existsSync(hubTarget) ? fs.readFileSync(hubTarget, 'utf8') : '';
if (normalizeTelecomGeneratorHtml(currentHub) !== normalizeTelecomGeneratorHtml(expectedHub)) {
  drift.push('fr/telecom/index.html');
}
if (write) fs.writeFileSync(hubTarget, expectedHub, 'utf8');

if (check && drift.length) {
  console.error(`French Telecom parity drift (${drift.length}):\n${drift.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`${write ? 'Wrote' : 'Checked'} ${APPS.length} French Telecom app pages${drift.length ? ` (${drift.length} changed)` : ''}.`);
}

module.exports = { APPS, page, hubPage, normalizeTelecomGeneratorHtml };
