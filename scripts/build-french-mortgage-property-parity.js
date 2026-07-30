'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {
  contractFor,
  MISSING_FRENCH_NAMES,
  MISSING_FRENCH_ROUTES,
  PROPERTY_MODES,
  OWNER_CALCULATORS
} = require('./lib/french-mortgage-property-contracts');
const engine = require('../assets/js/engines/french-mortgage-property');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://afrotools.com';
const CHECKED_AT = '2026-07-29';
const OFFICIAL_NOTE_TRANSLATIONS = new Map([
  [
    'Administers stamp duty on instruments executed by companies (State Boards of Internal Revenue handle individuals) and capital gains tax. Read the current Stamp Duties Act schedule and the CGT rate (10%) before changing a figure.',
    'Administre les droits de timbre sur les actes conclus par les sociétés (les services fiscaux des États traitent les particuliers) ainsi que l’impôt sur les plus-values. Consultez le barème actuel du Stamp Duties Act et le taux de l’impôt sur les plus-values avant de modifier un chiffre.'
  ]
]);
const INVENTORY_PATH = path.join(ROOT, 'reports', 'french-free-app-parity-inventory.json');
const MANIFEST_PATH = path.join(ROOT, 'data', 'registry', 'french-mortgage-property.json');
const LOCALE_COVERAGE_PATH = path.join(ROOT, 'data', 'registry', 'locale-page-coverage.json');
const ENGLISH_ORACLES = readJson(path.join(ROOT, 'data', 'fixtures', 'french-mortgage-property-english-oracles.json'));
if (ENGLISH_ORACLES.count !== 46) throw new Error(`Expected 46 independent English oracles, found ${ENGLISH_ORACLES.count}`);
const ENGLISH_LEGAL_ENGINE_ORACLE = {
  getAnnualReturns: () => ({}),
  getBusinessReg: () => ({}),
  getTIN: () => ({}),
  getTrademark: () => ({})
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function normalizeRoute(value) {
  const route = String(value || '').split(/[?#]/)[0].replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');
  return route ? `/${route}` : '/';
}

function routeFile(route) {
  const relative = normalizeRoute(route).replace(/^\//, '');
  for (const candidate of [
    path.join(ROOT, `${relative}.html`),
    path.join(ROOT, relative, 'index.html'),
    path.join(ROOT, relative, 'app.html')
  ]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function relative(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function equivalentAlternates(englishRoute, frenchRoute) {
  const equivalentRoute = `${normalizeRoute(englishRoute)}/`;
  const alternates = [
    { locale: 'en', route: equivalentRoute },
    { locale: 'fr', route: `${normalizeRoute(frenchRoute)}/` }
  ];
  const records = readJson(LOCALE_COVERAGE_PATH).records || [];
  const seenLocales = new Set(alternates.map((entry) => entry.locale));
  records
    .filter((record) => (
      record.indexableEligible &&
      `${normalizeRoute(record.equivalentRoute)}/` === equivalentRoute &&
      !seenLocales.has(record.locale) &&
      !['unavailable', 'deprecated', 'english-fallback'].includes(record.state)
    ))
    .sort((left, right) => left.locale.localeCompare(right.locale))
    .forEach((record) => {
      seenLocales.add(record.locale);
      alternates.push({ locale: record.locale, route: `${normalizeRoute(record.route)}/` });
    });
  return alternates;
}

function alternateLinkHtml(englishRoute, frenchRoute) {
  const links = equivalentAlternates(englishRoute, frenchRoute)
    .map((entry) => `  <link rel="alternate" hreflang="${entry.locale}" href="${SITE}${entry.route}">`);
  links.push(`  <link rel="alternate" hreflang="x-default" href="${SITE}${normalizeRoute(englishRoute)}/">`);
  return links.join('\n');
}

function html(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function stripTags(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function englishSourceLinks(file) {
  const source = fs.readFileSync(file, 'utf8');
  return [...source.matchAll(/<a\b[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({
      url: match[1].replace(/&amp;/g, '&'),
      title: stripTags(match[2])
    }))
    .filter((entry) => entry.url && entry.title);
}

const OWNER_SOURCE_ASSUMPTIONS = {
  'cac-cost': 'Le total utilise la forme CAC, le capital social, le nombre d’administrateurs, le mode de dépôt et les options choisies; le moteur contient des frais CAC, un droit de timbre de 0,75 % et un taux de conversion indicatif.',
  'cipc-cost': 'Le total utilise la forme CIPC, le canal de dépôt et les inscriptions optionnelles; les frais de base et d’agent sont codés dans le moteur partagé.',
  'tenancy-deposit': 'Le coût d’entrée utilise le loyer, les mois d’avance et de dépôt, la commission, les frais juridiques et la charge de service saisis; certaines options appliquent un pourcentage ou un forfait codé.',
  'property-tax': 'La taxe estimée applique au prix saisi le taux codé pour le pays, la ville et l’usage sélectionnés; les barèmes municipaux ou nationaux peuvent avoir changé.',
  'ng-nhf': 'Le scénario NHF applique les seuils, le taux de contribution et les conditions de prêt codés par le propriétaire anglais aux valeurs saisies.',
  'child-support': 'La contribution est un scénario de planification fondé sur les revenus, le nombre d’enfants et les coefficients codés; elle ne reproduit pas une ordonnance.',
  'court-fees': 'Le total applique le niveau de juridiction, la valeur de la demande, les plafonds, coefficients et frais de signification codés pour le pays sélectionné.',
  'divorce-settlement': 'Le scénario applique aux actifs et revenus saisis les coefficients de partage codés pour le pays; il ne prédit ni accord ni jugement.',
  'inheritance-tax': 'Le calcul applique à la succession saisie le taux successoral ou de probate codé pour le pays et les déductions saisies.',
  'legal-aid': 'La pré-évaluation compare les revenus, actifs, personnes à charge et type d’affaire aux seuils d’aide juridique codés pour le pays.'
};

const OWNER_SOURCE_OVERRIDES = {
  'cac-cost': {
    url: 'https://news.cac.gov.ng/wp-content/uploads/2025/06/New-Schedule-of-Fees-29th-May-2025.pdf',
    title: 'Corporate Affairs Commission — nouveau barème officiel des frais 2025',
    role: 'barème officiel CAC',
    support: 'Ce barème officiel est la source d’autorité pour les frais CAC; la parité du moteur ne certifie pas que chaque montant codé reflète encore ce barème.'
  },
  'cipc-cost': {
    url: 'https://www.cipc.co.za/?page_id=3804',
    title: 'CIPC — formulaires et frais des sociétés',
    role: 'barème officiel CIPC',
    support: 'La page CIPC est la source d’autorité pour les frais de dépôt; les frais d’agent et services tiers restent des hypothèses commerciales.'
  },
  'tenancy-deposit': {
    url: 'https://lagosstate.gov.ng/resources/',
    title: 'État de Lagos — ressources officielles et Tenancy Law',
    role: 'répertoire juridique officiel de l’État de Lagos',
    support: 'La loi liée encadre la location à Lagos mais ne valide pas les mois d’avance, commissions ou frais professionnels codés; ces valeurs restent des scénarios à remplacer.'
  },
  'property-tax': {
    url: 'https://lagosstate.gov.ng/resources/',
    title: 'État de Lagos — Land Use Charge Law et ressources foncières',
    role: 'répertoire fiscal et foncier officiel de l’État de Lagos',
    support: 'La ressource officielle définit le cadre local; le tableau multi-pays du moteur doit être contrôlé auprès de chaque autorité locale avant usage.'
  },
  'ng-nhf': {
    url: 'https://www.fmbn.gov.ng/National%20Housing%20Fund/nhf.php',
    title: 'Federal Mortgage Bank of Nigeria — National Housing Fund',
    role: 'administrateur officiel du régime NHF',
    support: 'FMBN est l’autorité pour la contribution et les conditions NHF; les seuils et conditions du moteur doivent être comparés à la publication en vigueur.'
  },
  'child-support': {
    url: 'https://www.nigeriarights.gov.ng/files/childrightact.pdf',
    title: 'National Human Rights Commission — Child’s Rights Act 2003',
    role: 'texte légal officiel publié par la NHRC',
    support: 'L’article 14 lie l’entretien aux moyens des parents et à la Family Court; il ne prescrit pas les coefficients de planification codés dans le moteur.'
  },
  'court-fees': {
    url: 'https://edojudiciary.gov.ng/legislations-and-rules/',
    title: 'Edo State Judiciary — législations et règles de procédure',
    role: 'répertoire officiel d’une juridiction d’État',
    support: 'Les frais dépendent de la juridiction et de ses règles; cette source officielle de règles ne transforme pas le tableau national simplifié du moteur en barème opposable.'
  },
  'divorce-settlement': {
    url: 'https://www.fcthighcourt.gov.ng/the-family-court/case-summaries/',
    title: 'FCT High Court — décisions et ressources de la Family Court',
    role: 'jurisprudence officielle de la FCT High Court',
    support: 'Les décisions illustrent une appréciation judiciaire, pas une formule de partage; les coefficients du moteur sont uniquement des scénarios.'
  },
  'inheritance-tax': {
    url: 'https://lawrecom.lg.gov.ng/2015-laws.html',
    title: 'Lagos State Law Reform Commission — Administration of Estates Law',
    role: 'répertoire officiel des lois de l’État de Lagos',
    support: 'Le répertoire officiel signale le cadre successoral et son statut de révision; il ne valide pas un taux national unique de probate ou de succession.'
  },
  'legal-aid': {
    url: 'https://www.justice.gov.ng/citizens-right/',
    title: 'Federal Ministry of Justice — Citizens’ Rights et accès à la justice',
    role: 'service officiel fédéral d’accès à la justice',
    support: 'La page confirme les voies d’accès à la justice mais ne publie pas les seuils numériques codés; l’éligibilité doit être confirmée auprès du service compétent.'
  }
};

function sourceProfile({ inventoryRow, englishFile, englishRoute, name, contract, sourceLedger, propertyOwner, englishOwnerCalculator }) {
  const official = (sourceLedger.sources || []).find((source) => (
    Array.isArray(source.tools) && source.tools.includes(inventoryRow.englishId)
  ));
  const ownerLinks = englishSourceLinks(englishFile);
  const override = OWNER_SOURCE_OVERRIDES[inventoryRow.englishId];
  const selected = override
    ? override
    : official
    ? { url: official.url, title: official.title, role: official.sourceType }
    : ownerLinks.length
      ? { ...ownerLinks[0], role: 'référence publiée par le propriétaire anglais' }
      : {
          url: `${SITE}${normalizeRoute(englishRoute)}/`,
          title: `Implémentation anglaise propriétaire — ${inventoryRow.englishName}`,
          role: 'implémentation source, sans autorité externe liée'
        };
  if (englishOwnerCalculator && !/^https?:\/\//.test(selected.url)) {
    throw new Error(`${inventoryRow.englishId}: hard-coded owner calculator lacks a source URL`);
  }
  if (propertyOwner && new URL(selected.url).hostname === 'afrotools.com') {
    throw new Error(`${inventoryRow.englishId}: property workflow lacks an external authority, standard or statistical anchor`);
  }
  const fieldLabels = contract.fields.map((field) => field.label).join(', ');
  const assumptions = OWNER_SOURCE_ASSUMPTIONS[inventoryRow.englishId] || (
    propertyOwner
      ? `${name} calcule uniquement à partir des hypothèses visibles suivantes : ${fieldLabels}. Aucun prix, taux ou frais manquant n’est injecté par la route.`
      : contract.workflowKind === 'document'
        ? `${name} produit un projet local à partir des champs ${fieldLabels}; aucune clause n’est réputée adaptée sans relecture dans la juridiction visée.`
        : `${name} filtre ou évalue les faits saisis dans ${fieldLabels}; le résultat reste une préparation et non une décision d’autorité.`
  );
  const freshness = englishOwnerCalculator
    ? `Les frais, taux, seuils ou coefficients codés pour ${name} doivent être revérifiés auprès de la source liée avant paiement, dépôt ou décision; contrôle au plus tard tous les ${sourceLedger.highRiskCadenceDays} jours.`
    : propertyOwner
      ? `Les hypothèses de ${name} doivent être actualisées à chaque utilisation; l’implémentation et ses limites sont revues au plus tard tous les ${sourceLedger.reviewCadenceDays} jours.`
      : `La référence ou le modèle de ${name} doit être revérifié avant chaque démarche; revue éditoriale au plus tard tous les ${sourceLedger.reviewCadenceDays} jours.`;
  const confidence = englishOwnerCalculator
    ? {
        calculation: 'Élevée pour la reproduction déterministe du moteur anglais avec la même fixture.',
        applicability: 'Limitée pour l’actualité des frais, taux, seuils et conséquences dans un cas réel.'
      }
    : propertyOwner
      ? {
          calculation: 'Élevée pour l’arithmétique ou la mutation de checklist à partir des valeurs saisies.',
          applicability: 'Dépend entièrement de l’exactitude et de l’actualité des hypothèses fournies.'
        }
      : {
          calculation: 'Élevée pour la reproduction déterministe du workflow anglais avec les mêmes faits synthétiques.',
          applicability: 'Limitée pour la validité juridique, administrative ou commerciale hors de la fixture.'
        };
  return {
    url: selected.url,
    title: selected.title,
    role: selected.role,
    support: selected.support || (
      official
        ? (OFFICIAL_NOTE_TRANSLATIONS.get(official.notes) || official.notes)
        : ownerLinks.length
          ? 'La page liée est la référence publiée par le propriétaire anglais; elle doit être contrôlée avant de traiter un cas réel.'
          : 'La route anglaise est la seule implémentation liée; aucune autorité externe n’est revendiquée pour ce workflow à valeurs saisies.'
    ),
    checkedAt: CHECKED_AT,
    freshness,
    assumptions,
    confidence,
    hardCodedValues: englishOwnerCalculator,
    boundary: `${name} est lié à « ${selected.title} »; les hypothèses et la confiance ci-dessous définissent exactement la limite de cette route.`
  };
}

function loadRegistry() {
  const source = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.AFRO_TOOLS;
}

function registryFrenchOwner(registry, row, frenchRoute) {
  return registry.find((tool) => (
    tool.lang === 'fr' &&
    (tool.sourceId === row.englishId || normalizeRoute(tool.href) === normalizeRoute(frenchRoute))
  ));
}

function englishExportActions(file) {
  const source = fs.readFileSync(file, 'utf8');
  const actions = [];
  const relevant = /\b(pdf|print|copy|download|export|save as|image)\b/i;
  for (const match of source.matchAll(/<(button|a|input)\b([^>]*)>([\s\S]*?)<\/\1>|<input\b([^>]*)>/gi)) {
    const attributes = match[2] || match[4] || '';
    const label = stripTags(match[3] || (attributes.match(/\bvalue=["']([^"']+)/i) || [])[1] || '');
    if (!relevant.test(`${attributes} ${label}`)) continue;
    let format = 'copy';
    if (/print/i.test(label + attributes)) format = 'print';
    else if (/pdf/i.test(label + attributes)) format = 'pdf';
    else if (/json/i.test(label + attributes)) format = 'json';
    else if (/csv/i.test(label + attributes)) format = 'csv';
    else if (/\b(txt|text)\b/i.test(label + attributes)) format = 'txt';
    else if (/image|png|jpe?g|svg/i.test(label + attributes)) format = 'image';
    const id = (attributes.match(/\bid=["']([^"']+)/i) || [])[1];
    actions.push({
      format,
      selector: id ? `#${id}` : `role=${match[1].toLowerCase()}[name="${label.slice(0, 80)}"]`,
      label: label || `${format} action`,
      evidence: `${relative(file)}:${source.slice(0, match.index).split('\n').length}`
    });
  }
  const unique = new Map();
  actions.forEach((action) => unique.set(`${action.format}:${action.label}`, action));
  return [...unique.values()];
}

function imageFor(imageId) {
  for (const extension of ['webp', 'svg', 'png', 'jpg', 'jpeg']) {
    const file = path.join(ROOT, 'assets', 'img', 'tools', `${imageId}.${extension}`);
    if (fs.existsSync(file)) return `/assets/img/tools/${imageId}.${extension}`;
  }
  return '/assets/img/og-default.png';
}

function fixtureValues(fields) {
  return Object.fromEntries(fields.map((field) => [
    field.name,
    field.type === 'checkbox' ? field.fixtureValue === 'true' : field.fixtureValue
  ]));
}

function englishOracleAnchors(oracle) {
  if (!oracle) return [];
  const output = String(oracle.outputText || '').toLocaleLowerCase('en');
  return [...new Set(Object.values(oracle.inputFixture || {})
    .filter((value) => typeof value === 'string' && value.trim().length >= 4)
    .map((value) => value.trim())
    .filter((value) => output.includes(value.toLocaleLowerCase('en'))))]
    .slice(0, 12);
}

function outputContract(row, frenchRoute, name, frenchFile, contract, englishFile) {
  const fixture = fixtureValues(contract.fields);
  const englishActions = englishExportActions(englishFile);
  const runtimeContract = {
    ...contract,
    englishId: row.englishId,
    name,
    frenchRoute,
    sharedEngine: PROPERTY_MODES[row.englishId]
      ? 'property-assumption'
      : OWNER_CALCULATORS.has(row.englishId)
        ? 'mortgage-property-english-owner'
        : null
  };
  const expected = engine.run(runtimeContract, fixture, { legalEngine: ENGLISH_LEGAL_ENGINE_ORACLE });
  if (!expected.ok) throw new Error(`${row.englishId}: fixture failed: ${expected.code}`);
  const frenchActions = [
    ['copy', 'button[data-action="copy"]', 'Copier le résumé'],
    ['txt', 'button[data-action="txt"]', 'Télécharger TXT'],
    ['json', 'button[data-action="json"]', 'Télécharger JSON'],
    ['pdf', 'button[data-action="pdf"]', 'Télécharger PDF'],
    ['print', 'button[data-action="print"]', 'Imprimer / enregistrer en PDF']
  ].map(([format, selector, label]) => ({ format, selector, label, evidence: `${relative(frenchFile)}:export-bar` }));
  return {
    classification: 'required',
    englishOwner: {
      route: row.englishRoute,
      file: relative(englishFile),
      actions: englishActions,
      evidence: englishActions.length
        ? `Physical English owner exposes ${englishActions.length} export, print, copy or download control(s).`
        : 'Physical English owner exposes no export, print, copy or download control; this contract is still required because the French owner advertises local exports.'
    },
    frenchOwner: {
      route: frenchRoute,
      file: relative(frenchFile),
      actions: frenchActions,
      formats: ['copy', 'txt', 'json', 'pdf', 'print']
    },
    fixture: {
      strategy: contract.workflowKind === 'reference' ? 'synthetic-reference-state' : `synthetic-${contract.workflowKind}`,
      inputs: contract.fields.map((field) => ({
        selector: `[name="${field.name}"]`,
        label: field.label,
        value: field.fixtureValue,
        type: field.type
      })),
      workflowControl: contract.workflowControl,
      workflowControlSelector: '[data-workflow-control]',
      workflowOwnerSelector: '[data-fr-mortgage-property-app]',
      workflowControlOwnedByCalculator: true,
      interactionType: 'click',
      resultSelector: '[data-result]',
      expectedResults: Object.entries(expected.resultFields).map(([label, value]) => ({
        selector: `[data-result-field="${label}"]`,
        label,
        value: String(value)
      })),
      expectedSummary: expected.summary
    },
    oracles: [
      { format: 'copy', parser: 'clipboard exact UTF-8 French summary', status: 'pending' },
      { format: 'txt', parser: 'UTF-8/BOM decode plus fixture input/result assertions', status: 'pending' },
      { format: 'json', parser: 'JSON.parse plus schema, fixture and sensitive-state assertions', status: 'pending' },
      { format: 'pdf', parser: '%PDF signature, EOF, xref and reopened content stream assertions', status: 'pending' },
      { format: 'print', parser: 'window.print interception plus French print DOM fixture assertions', status: 'pending' }
    ],
    privacyGate: {
      localOnly: true,
      accountOrEmailGate: false,
      fixtureValueNetworkLeak: null
    },
    finalStatus: 'pending-browser-proof'
  };
}

function pageHtml(row) {
  const canonical = `${SITE}${normalizeRoute(row.frenchRoute)}/`;
  const alternateLinks = alternateLinkHtml(row.englishRoute, row.frenchRoute);
  const image = row.imageUrl.startsWith('/') ? `${SITE}${row.imageUrl}` : row.imageUrl;
  const schema = JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: row.name,
      description: row.description,
      url: canonical,
      inLanguage: 'fr',
      applicationCategory: row.workflowKind === 'document' ? 'BusinessApplication' : 'FinanceApplication',
      isAccessibleForFree: true,
      image,
      provider: { '@type': 'Organization', name: 'AfroTools', url: `${SITE}/` }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE}/fr/` },
        { '@type': 'ListItem', position: 2, name: 'Crédit immobilier et propriété', item: `${SITE}/fr/mortgage-property/` },
        { '@type': 'ListItem', position: 3, name: row.name, item: canonical }
      ]
    }
  ]).replace(/</g, '\\u003c');
  const legalScripts = row.implementationOwners.includes('/engines/legal-engine.js')
    ? '  <script src="/data/legal/country-legal-index.js" defer></script>\n  <script src="/engines/legal-engine.js" defer></script>\n'
    : '';
  const propertyScript = row.implementationOwners.includes('/assets/js/engines/property-assumption.js')
    ? '  <script src="/assets/js/engines/property-assumption.js" defer></script>\n'
    : '';
  const englishOwnerScript = row.implementationOwners.includes('/assets/js/engines/mortgage-property-english-owner.js')
    ? '  <script src="/assets/js/engines/mortgage-property-english-owner.js" defer></script>\n'
    : '';
  return `<!doctype html>
<!-- Generated by scripts/build-french-mortgage-property-parity.js. -->
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="afrotools-content-id" content="fr-mortgage-property:${html(row.englishId)}">
  <meta name="afrotools-source-owner" content="scripts/build-french-mortgage-property-parity.js">
  <title>${html(row.name)} | AfroTools</title>
  <meta name="description" content="${html(row.description)}">
  <link rel="canonical" href="${canonical}">
${alternateLinks}
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${html(row.name)} | AfroTools">
  <meta property="og:description" content="${html(row.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${image}">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${schema}</script>
  <link rel="stylesheet" href="/assets/css/tokens.min.css">
  <link rel="stylesheet" href="/assets/css/global.min.css">
  <link rel="stylesheet" href="/assets/css/design-system.min.css">
  <link rel="stylesheet" href="/assets/css/french-mortgage-property.css">
  <script src="/assets/js/components/navbar.min.js" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
${legalScripts}${propertyScript}${englishOwnerScript}  <script src="/assets/js/lib/french-mortgage-property-presentation.js" defer></script>
  <script src="/assets/js/engines/french-mortgage-property.js" defer></script>
  <script src="/assets/js/pages/french-mortgage-property-app.js" defer></script>
</head>
<body class="mp-page">
  <afro-navbar theme="dark" active="mortgage-property"></afro-navbar>
  <main class="mp-shell" data-fr-mortgage-property-app data-english-id="${html(row.englishId)}">
    <nav class="mp-breadcrumb" aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> / <a href="/fr/mortgage-property/">Crédit immobilier et propriété</a> / ${html(row.name)}</nav>
    <header class="mp-hero">
      <p class="mp-eyebrow">Workflow français natif · données locales</p>
      <h1>${html(row.name)}</h1>
      <p>${html(row.description)}</p>
      <p><strong>Limite :</strong> estimation ou projet de préparation uniquement. Aucun taux manquant n’est remplacé par zéro et aucune décision officielle n’est déduite.</p>
    </header>
    <figure class="mp-artwork" data-artwork-panel>
      <img src="${html(row.imageUrl)}" alt="${html(row.artworkAlt)}" loading="eager" decoding="async" data-route-artwork data-artwork-state="pending">
      <figcaption>Repère visuel propre à l’application ${html(row.name)}.</figcaption>
    </figure>
    <div class="mp-grid">
      <section class="mp-card" aria-labelledby="workflow-title">
        <h2 id="workflow-title">${row.workflowKind === 'document' ? 'Préparer le projet' : row.workflowKind === 'reference' ? 'Filtrer la référence' : 'Saisir les hypothèses'}</h2>
        <form data-workflow-form novalidate>
          <div class="mp-fields" data-fields><p>Chargement du contrat local…</p></div>
          <div class="mp-actions">
            <button type="submit" data-workflow-control>${html(row.workflowControl)}</button>
            <button type="button" data-action="reset">Réinitialiser</button>
            <button type="button" data-action="save">Enregistrer localement</button>
            <button type="button" data-action="load">Charger</button>
          </div>
          <p class="mp-status" data-status role="status" aria-live="polite">Vérification du contrat de route…</p>
          <section class="mp-result" data-result tabindex="-1" aria-live="polite" aria-atomic="true" hidden></section>
          <div class="mp-export-bar" data-export-bar hidden aria-label="Exporter le résultat">
            <button type="button" data-action="copy">Copier le résumé</button>
            <button type="button" data-action="share">Partager</button>
            <button type="button" data-action="txt">Télécharger TXT</button>
            <button type="button" data-action="json">Télécharger JSON</button>
            <button type="button" data-action="pdf">Télécharger PDF</button>
            <button type="button" data-action="print">Imprimer / enregistrer en PDF</button>
          </div>
        </form>
        <p class="mp-privacy"><strong>Confidentialité :</strong> le calcul, les projets, la sauvegarde et les exports restent dans ce navigateur. Aucun compte, e-mail ou appel IA n’est requis. Aucune donnée saisie n’est envoyée sur le réseau.</p>
      </section>
      <aside class="mp-card mp-source" data-tool-verification-panel>
        <article>
          <h2>Source propre à l’application</h2>
          <p data-source-boundary>${html(row.sourceBoundary)}</p>
          <p><a data-source-url href="${html(row.source.url)}" target="_blank" rel="noopener noreferrer">${html(row.source.title)}</a></p>
          <p><strong>Rôle :</strong> <span data-source-role>${html(row.source.role)}</span></p>
          <p><strong>Portée :</strong> <span data-source-support>${html(row.source.support)}</span></p>
        </article>
        <article>
          <h2>Fraîcheur, hypothèses et confiance</h2>
          <dl>
            <div><dt>Date contrôlée</dt><dd data-source-checked-at>${html(row.source.checkedAt)}</dd></div>
            <div><dt>Fraîcheur</dt><dd data-source-freshness>${html(row.source.freshness)}</dd></div>
            <div><dt>Hypothèses</dt><dd data-source-assumptions>${html(row.source.assumptions)}</dd></div>
            <div><dt>Confiance du calcul</dt><dd data-source-confidence-calculation>${html(row.source.confidence.calculation)}</dd></div>
            <div><dt>Confiance d’application</dt><dd data-source-confidence-applicability>${html(row.source.confidence.applicability)}</dd></div>
          </dl>
        </article>
        <article><h2>Découverte IA</h2><p>La route IA française exacte est <code>${html(normalizeRoute(row.frenchRoute))}/</code>. Cet outil ne transmet aucune saisie à un modèle.</p></article>
      </aside>
    </div>
  </main>
  <afro-footer></afro-footer>
</body>
</html>
`;
}

function hubHtml(rows) {
  const alternateLinks = alternateLinkHtml('/mortgage-property', '/fr/mortgage-property');
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Crédit immobilier, propriété et démarches juridiques — 66 outils français',
    description: 'Les 66 applications gratuites de l’inventaire Mortgage & Property, avec propriétaires français natifs.',
    url: `${SITE}/fr/mortgage-property/`,
    inLanguage: 'fr',
    numberOfItems: 66,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: 66,
      itemListElement: rows.map((row, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: row.name,
        url: `${SITE}${normalizeRoute(row.frenchRoute)}/`
      }))
    }
  }).replace(/</g, '\\u003c');
  const cards = rows.map((row, index) => `<article class="mp-hub-card">
      <img src="${html(row.imageUrl)}" alt="" width="96" height="96" loading="lazy">
      <div><p>${String(index + 1).padStart(2, '0')} · ${html(row.workflowKind)}</p><h2><a href="${html(normalizeRoute(row.frenchRoute))}/">${html(row.name)}</a></h2><span>${html(row.description)}</span></div>
    </article>`).join('\n');
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>66 outils crédit immobilier et propriété en français | AfroTools</title>
  <meta name="description" content="Accédez aux 66 applications gratuites Mortgage & Property avec workflows français natifs, calculs locaux, exports et limites vérifiables.">
  <link rel="canonical" href="${SITE}/fr/mortgage-property/">
${alternateLinks}
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="66 outils crédit immobilier et propriété en français">
  <meta property="og:description" content="L’inventaire exact de 66 applications gratuites, sans iframe ni passerelle anglaise.">
  <meta property="og:url" content="${SITE}/fr/mortgage-property/">
  <meta property="og:image" content="${SITE}/assets/img/tools/mortgage-property.webp">
  <script type="application/ld+json">${schema}</script>
  <link rel="stylesheet" href="/assets/css/tokens.min.css">
  <link rel="stylesheet" href="/assets/css/global.min.css">
  <link rel="stylesheet" href="/assets/css/design-system.min.css">
  <link rel="stylesheet" href="/assets/css/french-mortgage-property.css">
  <script src="/assets/js/components/navbar.min.js" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
  <style>
    .mp-hub-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px}
    .mp-hub-card{display:flex;gap:14px;background:var(--mp-card);border:1px solid var(--mp-border);border-radius:14px;padding:16px}
    .mp-hub-card img{width:64px;height:64px;object-fit:cover;border-radius:12px;background:var(--mp-bg)}
    .mp-hub-card p{margin:0;color:var(--mp-muted);font-size:.75rem;text-transform:uppercase}
    .mp-hub-card h2{font-size:1rem;margin:4px 0}.mp-hub-card h2 a{color:var(--mp-accent-strong)}
    .mp-hub-card span{color:var(--mp-muted);font-size:.85rem;line-height:1.45}
  </style>
</head>
<body class="mp-page">
  <afro-navbar theme="dark" active="mortgage-property"></afro-navbar>
  <main class="mp-shell">
    <nav class="mp-breadcrumb"><a href="/fr/">Accueil</a> / Crédit immobilier et propriété</nav>
    <header class="mp-hero"><p class="mp-eyebrow">66 applications françaises · routes physiques</p><h1>Crédit immobilier, propriété et démarches</h1><p>Chaque carte ouvre un propriétaire français natif. Les calculs, projets et exports restent locaux; les barèmes changeants doivent être saisis ou vérifiés auprès de la source compétente.</p></header>
    <section class="mp-hub-grid" aria-label="66 applications françaises">${cards}</section>
  </main>
  <afro-footer></afro-footer>
</body>
</html>
`;
}

function ensureHreflang(file, locale, route) {
  let source = fs.readFileSync(file, 'utf8');
  const url = `${SITE}${normalizeRoute(route)}/`;
  const tags = [...source.matchAll(/<link\b[^>]*>/gi)]
    .filter((match) => /\brel=["']alternate["']/i.test(match[0]))
    .filter((match) => new RegExp(`\\bhreflang=["']${locale}["']`, 'i').test(match[0]));
  if (
    tags.length === 1 &&
    new RegExp(`\\bhref=["']${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(tags[0][0])
  ) return false;
  for (const tag of tags.reverse()) source = source.replace(tag[0], '');
  const alternate = `  <link rel="alternate" hreflang="${locale}" href="${url}">\n`;
  const canonical = source.match(/<link\s+rel=["']canonical["'][^>]*>\s*/i);
  source = canonical
    ? source.replace(canonical[0], `${canonical[0]}${alternate}`)
    : source.replace(/<\/head>/i, `${alternate}</head>`);
  fs.writeFileSync(file, source, 'utf8');
  return true;
}

function syncEquivalentHreflangs(englishRoute, frenchRoute) {
  const alternates = equivalentAlternates(englishRoute, frenchRoute);
  for (const owner of alternates) {
    const ownerFile = routeFile(owner.route);
    if (!ownerFile) continue;
    for (const alternate of alternates) {
      ensureHreflang(ownerFile, alternate.locale, alternate.route);
    }
    ensureHreflang(ownerFile, 'x-default', englishRoute);
  }
}

function main() {
  const inventory = readJson(INVENTORY_PATH);
  const inventoryRows = inventory.rows.filter((row) => row.category === 'Mortgage & Property');
  if (inventoryRows.length !== 66) throw new Error(`Expected 66 inventory rows, found ${inventoryRows.length}`);
  const stateCounts = Object.fromEntries([...new Set(inventoryRows.map((row) => row.state))]
    .map((state) => [state, inventoryRows.filter((row) => row.state === state).length]));
  const expected = { 'native-candidate': 66 };
  if (JSON.stringify(stateCounts) !== JSON.stringify(expected)) {
    throw new Error(`Coordinator baseline changed: ${JSON.stringify(stateCounts)}`);
  }
  const registry = loadRegistry();
  const sourceLedger = readJson(path.join(ROOT, 'data', 'mortgage-property', 'official-sources.json'));
  const rows = inventoryRows.map((inventoryRow, index) => {
    const frenchRoute = normalizeRoute(inventoryRow.primaryFrenchRoute || MISSING_FRENCH_ROUTES[inventoryRow.englishId]);
    if (!frenchRoute) throw new Error(`${inventoryRow.englishId}: French route missing`);
    const englishFile = routeFile(inventoryRow.englishRoute);
    if (!englishFile) throw new Error(`${inventoryRow.englishId}: English file missing`);
    const frenchFile = path.join(ROOT, frenchRoute.replace(/^\//, ''), 'index.html');
    const owner = registryFrenchOwner(registry, inventoryRow, frenchRoute);
    const name = owner ? owner.name : MISSING_FRENCH_NAMES[inventoryRow.englishId];
    if (!name) throw new Error(`${inventoryRow.englishId}: French name missing`);
    const description = owner && owner.desc
      ? owner.desc
      : `${name} avec workflow local, résultat vérifiable et export sans compte.`;
    const contract = contractFor(inventoryRow.englishId);
    const propertyOwner = Boolean(PROPERTY_MODES[inventoryRow.englishId]);
    const englishOwnerCalculator = OWNER_CALCULATORS.has(inventoryRow.englishId);
    const englishOracle = propertyOwner
      ? null
      : ENGLISH_ORACLES.rows.find((receipt) => receipt.englishId === inventoryRow.englishId);
    if (!propertyOwner && !englishOracle) throw new Error(`${inventoryRow.englishId}: independent English oracle missing`);
    const legalOwner = index >= 35;
    let imageId = owner && owner.imageId || inventoryRow.englishId;
    let imageUrl = imageFor(imageId);
    if (imageUrl === '/assets/img/og-default.png' && imageId !== inventoryRow.englishId) {
      imageId = inventoryRow.englishId;
      imageUrl = imageFor(imageId);
    }
    const source = sourceProfile({
      inventoryRow,
      englishFile,
      englishRoute: inventoryRow.englishRoute,
      name,
      contract,
      sourceLedger,
      propertyOwner,
      englishOwnerCalculator
    });
    const implementationOwners = [
      ...(propertyOwner ? ['/assets/js/engines/property-assumption.js'] : []),
      ...(englishOwnerCalculator ? ['/assets/js/engines/mortgage-property-english-owner.js'] : []),
      ...(legalOwner ? ['/data/legal/country-legal-index.js', '/engines/legal-engine.js'] : []),
      '/assets/js/lib/french-mortgage-property-presentation.js',
      '/assets/js/engines/french-mortgage-property.js',
      '/assets/js/pages/french-mortgage-property-app.js'
    ];
    const row = {
      rowNumber: index + 1,
      englishId: inventoryRow.englishId,
      englishName: inventoryRow.englishName,
      englishRoute: normalizeRoute(inventoryRow.englishRoute),
      englishFile: relative(englishFile),
      frenchRoute,
      frenchFile: relative(frenchFile),
      name,
      description,
      categoryGroup: inventoryRow.categoryKey,
      baselineState: inventoryRow.state,
      workflowKind: contract.workflowKind,
      engineMode: contract.engineMode,
      workflowControl: contract.workflowControl,
      fields: contract.fields,
      sourceBoundary: source.boundary,
      implementationOwners,
      sharedEngine: propertyOwner ? 'property-assumption' : englishOwnerCalculator ? 'mortgage-property-english-owner' : 'english-dom-oracle',
      imageId,
      imageUrl,
      artworkAlt: `Repère visuel de l’outil « ${name} »`,
      artworkExists: imageUrl !== '/assets/img/og-default.png',
      source,
      sourceNote: source.boundary,
      sourceCheckedAt: CHECKED_AT,
      englishOracle: englishOracle ? {
        ownershipKind: englishOracle.ownershipKind,
        sourceSha256BeforeExtraction: englishOracle.sourceSha256BeforeExtraction,
        actionSelector: englishOracle.actionSelector,
        outputSelector: englishOracle.outputSelector,
        inputFixture: englishOracle.inputFixture,
        outputSha256: englishOracle.outputSha256,
        semanticAnchors: englishOracleAnchors(englishOracle),
        outputExcerpt: englishOracle.outputText.slice(0, 320)
      } : null,
      aiFrenchRoute: `${frenchRoute}/`,
      nativeRuntime: true
    };
    row.exportContract = outputContract(inventoryRow, frenchRoute, name, frenchFile, {
      ...contract,
      englishId: inventoryRow.englishId,
      name,
      frenchRoute,
      sharedEngine: propertyOwner ? 'property-assumption' : englishOwnerCalculator ? 'mortgage-property-english-owner' : null
    }, englishFile);
    fs.mkdirSync(path.dirname(frenchFile), { recursive: true });
    fs.writeFileSync(frenchFile, pageHtml(row), 'utf8');
    syncEquivalentHreflangs(inventoryRow.englishRoute, frenchRoute);
    return row;
  });

  const manifestCore = {
    schemaVersion: 1,
    category: 'Mortgage & Property',
    count: 66,
    currentCounts: { nativeRuntime: 66, iframe: 0, bridge: 0, missing: 0 },
    rows
  };
  const previousManifest = fs.existsSync(MANIFEST_PATH) ? readJson(MANIFEST_PATH) : null;
  const previousComparable = previousManifest ? { ...previousManifest } : null;
  if (previousComparable) delete previousComparable.generatedAt;
  const generatedAt = previousComparable &&
    JSON.stringify(previousComparable) === JSON.stringify(manifestCore)
    ? previousManifest.generatedAt
    : new Date().toISOString();
  const manifest = {
    schemaVersion: manifestCore.schemaVersion,
    category: manifestCore.category,
    count: manifestCore.count,
    currentCounts: manifestCore.currentCounts,
    generatedAt,
    rows: manifestCore.rows
  };
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(ROOT, 'fr', 'mortgage-property', 'index.html'), hubHtml(rows), 'utf8');
  syncEquivalentHreflangs('/mortgage-property', '/fr/mortgage-property');

  const aiEval = {
    schemaVersion: 1,
    locale: 'fr',
    category: 'Mortgage & Property',
    count: 66,
    cases: rows.map((row) => ({
      englishId: row.englishId,
      englishRoute: `${row.englishRoute}/`,
      expectedFrenchRoute: row.aiFrenchRoute,
      query: `ouvrir ${row.name}`,
      highStakesNoticeRequired: true
    }))
  };
  fs.writeFileSync(path.join(ROOT, 'data', 'ai', 'french-mortgage-property-route-eval.json'), `${JSON.stringify(aiEval, null, 2)}\n`, 'utf8');

  console.log(`Generated ${rows.length} native French Mortgage & Property owners and the exact hub.`);
  console.log(`Baseline reconciled: ${JSON.stringify(stateCounts)} -> ${JSON.stringify(manifest.currentCounts)}.`);
}

if (require.main === module) main();

module.exports = { main, normalizeRoute };
