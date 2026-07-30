#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { normalizeBuildManagedHtml } = require('./lib/shared-asset-references');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'localization', 'fr-religious-cultural-parity.json');
const EXPECTED_COUNT = 22;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function routeToFile(route) {
  const clean = String(route).replace(/^\/+|\/+$/g, '');
  return path.join(ROOT, clean, 'index.html');
}

function collectExistingAlternates(englishRoute) {
  const filePath = routeToFile(englishRoute);
  if (!fs.existsSync(filePath)) return [];
  const html = fs.readFileSync(filePath, 'utf8');
  const alternates = [];
  const pattern = /<link\b[^>]*\bhreflang=["']([^"']+)["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const language = match[1].toLowerCase();
    if (['en', 'fr', 'x-default'].includes(language)) continue;
    alternates.push({ language, href: match[2] });
  }
  return alternates;
}

function renderAdditionalAlternates(englishRoute) {
  return collectExistingAlternates(englishRoute)
    .map((alternate) => `  <link rel="alternate" hreflang="${escapeHtml(alternate.language)}" href="${escapeHtml(alternate.href)}">`)
    .join('\n');
}

function renderOptions(options) {
  return options.map((option) => {
    const item = typeof option === 'string' ? { value: option, label: option } : option;
    return `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`;
  }).join('');
}

function renderField(field) {
  const attributes = [
    `id="fr-rc-${escapeHtml(field.id)}"`,
    `name="${escapeHtml(field.id)}"`,
    field.type !== 'textarea' && field.type !== 'select' ? `type="${escapeHtml(field.type)}"` : '',
    typeof field.min !== 'undefined' ? `min="${escapeHtml(field.min)}"` : '',
    typeof field.max !== 'undefined' ? `max="${escapeHtml(field.max)}"` : '',
    typeof field.step !== 'undefined' ? `step="${escapeHtml(field.step)}"` : '',
    field.type === 'number' ? 'inputmode="decimal"' : '',
    'required'
  ].filter(Boolean).join(' ');
  const label = `<label for="fr-rc-${escapeHtml(field.id)}">${escapeHtml(field.label)}</label>`;
  let control;
  if (field.type === 'select') {
    control = `<select ${attributes}>${renderOptions(field.options)}</select>`;
  } else if (field.type === 'textarea') {
    control = `<textarea ${attributes}>${escapeHtml(field.value)}</textarea>`;
  } else {
    control = `<input ${attributes} value="${escapeHtml(field.value)}">`;
  }
  return `<div class="fr-rc-field">${label}${control}</div>`;
}

function renderSchema(tool, manifest) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.title,
    description: tool.description,
    url: `https://afrotools.com${tool.route}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    inLanguage: 'fr',
    isAccessibleForFree: true,
    image: `https://afrotools.com${tool.artwork}`,
    dateModified: manifest.reviewedOn,
    audience: {
      '@type': 'Audience',
      geographicArea: 'Africa'
    },
    featureList: [
      'Calcul déterministe dans le navigateur',
      'Validation explicite des entrées',
      'Export JSON local et réouvrable',
      'Aucune transmission des saisies'
    ],
    potentialAction: {
      '@type': 'UseAction',
      target: `https://afrotools.com${tool.route}`
    }
  };
}

function renderBreadcrumbSchema(tool, manifest) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://afrotools.com/fr/' },
      { '@type': 'ListItem', position: 2, name: 'Religion et culture', item: `https://afrotools.com${manifest.hub.route}` },
      { '@type': 'ListItem', position: 3, name: tool.title, item: `https://afrotools.com${tool.route}` }
    ]
  };
}

function renderFaqSchema(tool) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Le résultat constitue-t-il un avis religieux, culturel ou officiel ?',
        acceptedAnswer: { '@type': 'Answer', text: tool.boundary }
      },
      {
        '@type': 'Question',
        name: 'D’où viennent les valeurs du résultat ?',
        acceptedAnswer: { '@type': 'Answer', text: tool.source }
      },
      {
        '@type': 'Question',
        name: 'Les saisies quittent-elles le navigateur ?',
        acceptedAnswer: { '@type': 'Answer', text: 'Non. Le calcul et le fichier sont produits localement sans requête IA ni envoi des saisies.' }
      }
    ]
  };
}

function renderWorkflowLinks(tool) {
  if (tool.sourceId !== 'lobola-calculator') return '';
  return `
      <nav class="fr-rc-actions" aria-label="Continuer la préparation familiale">
        <a class="fr-rc-button" href="/fr/tools/checklist-negociation-dot/">Préparer la négociation</a>
        <a class="fr-rc-button" href="/fr/tools/liste-cadeaux-dot/">Organiser les cadeaux</a>
      </nav>`;
}

function renderLobolaPageMarker(tool) {
  if (tool.sourceId === 'lobola-negotiation-checklist') return ' data-lobola-fr-checklist';
  if (tool.sourceId === 'lobola-gift-list') return ' data-lobola-fr-gifts';
  return '';
}

function renderSavedPlanAction(tool) {
  if (!['lobola-negotiation-checklist', 'lobola-gift-list'].includes(tool.sourceId)) return '';
  return `
          <button class="fr-rc-button" id="fr-rc-use-saved-plan" type="button" data-action="useSavedPlan" data-storage-key="afrotools_lobola_plan_v1">Utiliser le dernier plan sauvegardé</button>`;
}

function renderToolPage(tool, manifest) {
  const schema = renderSchema(tool, manifest);
  const breadcrumbSchema = renderBreadcrumbSchema(tool, manifest);
  const faqSchema = renderFaqSchema(tool);
  const config = Object.assign({}, tool, {
    locale: manifest.locale,
    reviewedOn: manifest.reviewedOn,
    aiContract: manifest.aiContract
  });
  return `<!doctype html>
<html lang="fr" data-theme-choice="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(tool.title)} | AfroTools</title>
  <meta name="description" content="${escapeHtml(tool.description)}">
  <meta name="robots" content="index, follow">
  <meta name="afrotools-content-id" content="fr-religious-cultural:${escapeHtml(tool.sourceId)}">
  <meta name="afrotools-ai-mode" content="deterministic-local">
  <meta name="afrotools-ai-network-consent" content="required-before-send">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="AfroTools">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${escapeHtml(tool.title)}">
  <meta property="og:description" content="${escapeHtml(tool.description)}">
  <meta property="og:url" content="https://afrotools.com${escapeHtml(tool.route)}">
  <meta property="og:image" content="https://afrotools.com${escapeHtml(tool.artwork)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(tool.title)}">
  <meta name="twitter:description" content="${escapeHtml(tool.description)}">
  <meta name="twitter:image" content="https://afrotools.com${escapeHtml(tool.artwork)}">
  <link rel="canonical" href="https://afrotools.com${escapeHtml(tool.route)}">
  <link rel="alternate" hreflang="en" href="https://afrotools.com${escapeHtml(tool.englishRoute)}">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com${escapeHtml(tool.route)}">
${renderAdditionalAlternates(tool.englishRoute)}
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com${escapeHtml(tool.englishRoute)}">
  <link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <link rel="stylesheet" href="/assets/css/fr-religious-cultural-parity.css">
  <script type="application/ld+json">${jsonForHtml(schema)}</script>
  <script type="application/ld+json">${jsonForHtml(breadcrumbSchema)}</script>
  <script type="application/ld+json">${jsonForHtml(faqSchema)}</script>
</head>
<body class="fr-rc-page" data-tool="${escapeHtml(tool.sourceId)}" data-ai-mode="deterministic-local"${renderLobolaPageMarker(tool)}>
  <a class="fr-rc-skip" href="#fr-rc-main">Aller au calcul</a>
  <afro-navbar active="religious-cultural"></afro-navbar>
  <header class="fr-rc-hero">
    <div class="fr-rc-wrap">
      <p class="fr-rc-kicker"><a href="${escapeHtml(manifest.hub.route)}">Religion et culture</a> · outil ${manifest.tools.indexOf(tool) + 1} sur ${manifest.tools.length}</p>
      <h1>${escapeHtml(tool.title)}</h1>
      <p class="fr-rc-lede">${escapeHtml(tool.description)}</p>
      <ul class="fr-rc-trust" aria-label="Garanties du produit">
        <li>Calcul local</li>
        <li>Aucun compte</li>
        <li>Aucune requête IA</li>
        <li>Export JSON réouvrable</li>
      </ul>
    </div>
  </header>
  <main class="fr-rc-wrap fr-rc-layout" id="fr-rc-main">
    <section class="fr-rc-card" aria-labelledby="fr-rc-form-title">
      <h2 id="fr-rc-form-title">Préparer le résultat</h2>
      <p>Les valeurs d’exemple sont modifiables. Le résultat précédent est effacé dès qu’une saisie change.</p>
      <form id="fr-rc-form" novalidate>
        <div class="fr-rc-fields">${tool.fields.map(renderField).join('')}</div>
        <div class="fr-rc-actions">
          <button class="fr-rc-button fr-rc-button-primary" id="fr-rc-calculate" type="button">Calculer localement</button>
          <button class="fr-rc-button" id="fr-rc-reset" type="reset">Réinitialiser l’exemple</button>
        </div>
      </form>
      <p class="fr-rc-status" id="fr-rc-status" role="status" aria-live="polite"></p>
      <div class="fr-rc-results" id="fr-rc-output" aria-live="polite" hidden></div>
      <div class="fr-rc-actions">
        <button class="fr-rc-button" id="fr-rc-copy" type="button">Copier le résumé</button>
        <button class="fr-rc-button" id="fr-rc-download" type="button">Télécharger JSON</button>
        <button class="fr-rc-button" id="fr-rc-print" type="button">Imprimer</button>
${renderSavedPlanAction(tool)}
      </div>
${renderWorkflowLinks(tool)}
    </section>
    <aside class="fr-rc-meta" aria-label="Méthode, source et limites">
      <section class="fr-rc-card fr-rc-boundary">
        <h2>Limite d’autorité</h2>
        <p>${escapeHtml(tool.boundary)}</p>
      </section>
      <section class="fr-rc-card">
        <h2>Source et fraîcheur</h2>
        <p>${escapeHtml(tool.source)}</p>
        <p><strong>Révision du modèle:</strong> ${escapeHtml(manifest.reviewedOn)}</p>
      </section>
      <section class="fr-rc-card">
        <h2>Niveau de confiance</h2>
        <p>${escapeHtml(tool.confidence)}</p>
      </section>
      <section class="fr-rc-card">
        <h2>Vie privée et assistance</h2>
        <p>Les saisies, le calcul et le fichier restent dans ce navigateur. Aucun texte n’est envoyé à une IA ou à un serveur. Toute future assistance réseau devra demander un consentement explicite et conserver ce calcul local comme solution de repli.</p>
      </section>
    </aside>
  </main>
  <afro-footer></afro-footer>
  <script id="fr-rc-config" type="application/json">${jsonForHtml(config)}</script>
  <script src="/assets/js/lib/dark-mode.js" defer></script>
  <script src="/assets/js/components/navbar.js" defer></script>
  <script src="/assets/js/components/footer.js" defer></script>
  <script src="/assets/js/engines/religious-cultural-parity.js"></script>
  <script src="/assets/js/pages/fr-religious-cultural-parity.js" defer></script>
</body>
</html>
`;
}

function renderHub(manifest) {
  const itemList = manifest.tools.map((tool, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: tool.title,
    url: `https://afrotools.com${tool.route}`
  }));
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: manifest.hub.title,
    description: manifest.hub.description,
    url: `https://afrotools.com${manifest.hub.route}`,
    inLanguage: 'fr',
    dateModified: manifest.reviewedOn,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: manifest.tools.length,
      itemListElement: itemList
    }
  };
  const cards = manifest.tools.map((tool, index) => `<a class="fr-rc-tool-link" href="${escapeHtml(tool.route)}">
  <img src="${escapeHtml(tool.artwork)}" alt="" width="640" height="360" loading="${index < 3 ? 'eager' : 'lazy'}">
  <span class="fr-rc-tool-copy"><h2>${escapeHtml(tool.title)}</h2><p>${escapeHtml(tool.description)}</p></span>
</a>`).join('');
  return `<!doctype html>
<html lang="fr" data-theme-choice="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(manifest.hub.title)} — 22 outils locaux | AfroTools</title>
  <meta name="description" content="${escapeHtml(manifest.hub.description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="afrotools-content-id" content="fr-category:religious-cultural">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="AfroTools">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${escapeHtml(manifest.hub.title)}">
  <meta property="og:description" content="${escapeHtml(manifest.hub.description)}">
  <meta property="og:url" content="https://afrotools.com${escapeHtml(manifest.hub.route)}">
  <meta property="og:image" content="https://afrotools.com${escapeHtml(manifest.hub.artwork)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://afrotools.com${escapeHtml(manifest.hub.route)}">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com${escapeHtml(manifest.hub.route)}">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com${escapeHtml(manifest.hub.route)}">
  <link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <link rel="stylesheet" href="/assets/css/fr-religious-cultural-parity.css">
  <script type="application/ld+json">${jsonForHtml(schema)}</script>
</head>
<body class="fr-rc-page">
  <a class="fr-rc-skip" href="#fr-rc-tools">Aller aux 22 outils</a>
  <afro-navbar active="religious-cultural"></afro-navbar>
  <main class="fr-rc-wrap">
    <header class="fr-rc-hub-hero">
      <p class="fr-rc-kicker">Surface française native</p>
      <h1>${escapeHtml(manifest.hub.title)}</h1>
      <p class="fr-rc-lede">${escapeHtml(manifest.hub.description)}</p>
      <ul class="fr-rc-trust" aria-label="Contrat de la catégorie"><li>22 outils sur 22</li><li>Calculs locaux</li><li>Sources et limites visibles</li><li>Aucune passerelle anglaise</li></ul>
    </header>
    <section aria-labelledby="fr-rc-tools-title">
      <h2 id="fr-rc-tools-title">Les 22 outils canoniques</h2>
      <div class="fr-rc-tool-grid" id="fr-rc-tools">${cards}</div>
    </section>
  </main>
  <afro-footer></afro-footer>
  <script src="/assets/js/lib/dark-mode.js" defer></script>
  <script src="/assets/js/components/navbar.js" defer></script>
  <script src="/assets/js/components/footer.js" defer></script>
</body>
</html>
`;
}

function validateManifest(manifest) {
  const issues = [];
  if (manifest.locale !== 'fr') issues.push('locale must be fr');
  if (manifest.category !== 'religious-cultural') issues.push('category must be religious-cultural');
  if (!Array.isArray(manifest.tools) || manifest.tools.length !== EXPECTED_COUNT) issues.push(`tools must contain exactly ${EXPECTED_COUNT} rows`);
  const sourceIds = new Set();
  const routes = new Set();
  (manifest.tools || []).forEach((tool, index) => {
    ['sourceId', 'englishRoute', 'route', 'title', 'description', 'engine', 'artwork', 'source', 'boundary', 'confidence', 'fixture'].forEach((field) => {
      if (!tool[field]) issues.push(`tools[${index}].${field} is required`);
    });
    if (!tool.route.startsWith('/fr/')) issues.push(`${tool.sourceId || index} route must start with /fr/`);
    if (sourceIds.has(tool.sourceId)) issues.push(`duplicate sourceId ${tool.sourceId}`);
    if (routes.has(tool.route)) issues.push(`duplicate route ${tool.route}`);
    sourceIds.add(tool.sourceId);
    routes.add(tool.route);
    if (!Array.isArray(tool.fields) || !tool.fields.length) issues.push(`${tool.sourceId} requires fields`);
    if (!fs.existsSync(path.join(ROOT, tool.artwork.replace(/^\//, '')))) issues.push(`${tool.sourceId} artwork is missing: ${tool.artwork}`);
  });
  if (issues.length) throw new Error(`French Religious & Cultural manifest invalid:\n- ${issues.join('\n- ')}`);
}

function ensureReciprocalHreflang(route, frenchRoute, check, changedFiles) {
  const filePath = routeToFile(route);
  if (!fs.existsSync(filePath)) throw new Error(`English counterpart missing: ${route}`);
  const current = fs.readFileSync(filePath, 'utf8');
  const expected = `<link rel="alternate" hreflang="fr" href="https://afrotools.com${frenchRoute}">`;
  const existingPattern = /<link\b[^>]*\bhreflang=["']fr["'][^>]*>/i;
  if (existingPattern.test(current) && current.match(existingPattern)[0].includes(`https://afrotools.com${frenchRoute}`)) return;
  if (check) throw new Error(`Reciprocal French hreflang missing or stale in ${path.relative(ROOT, filePath)}`);
  const next = existingPattern.test(current)
    ? current.replace(existingPattern, expected)
    : current.replace(/<\/head>/i, `  ${expected}\n</head>`);
  fs.writeFileSync(filePath, next, 'utf8');
  changedFiles.push(path.relative(ROOT, filePath));
}

function sourceOwnedMarkers(content) {
  const patterns = [
    /<meta name="afrotools-content-id"[^>]*>/,
    /<meta name="afrotools-ai-mode"[^>]*>/,
    /<link rel="canonical"[^>]*>/,
    /<script id="fr-rc-config" type="application\/json">[\s\S]*?<\/script>/,
    /data-tool="[^"]+"/,
    /data-lobola-fr-(?:checklist|gifts)/,
    /data-action="useSavedPlan"/
  ];
  return patterns.map((pattern) => content.match(pattern)?.[0]).filter(Boolean);
}

function formFieldNames(content) {
  const form = content.match(/<form\b[^>]*id="fr-rc-form"[\s\S]*?<\/form>/i)?.[0] || '';
  return [...form.matchAll(/\bname="([^"]+)"/g)].map((match) => match[1]).sort();
}

function verifySourceOwnedOutput(filePath, current, expected) {
  const relativePath = path.relative(ROOT, filePath);
  for (const marker of sourceOwnedMarkers(expected)) {
    if (!current.includes(marker)) {
      throw new Error(`Generated French Religious & Cultural page is stale at source-owned marker in ${relativePath}: ${marker.slice(0, 120)}`);
    }
  }
  if (JSON.stringify(formFieldNames(current)) !== JSON.stringify(formFieldNames(expected))) {
    throw new Error(`Generated French Religious & Cultural page has stale source-owned fields: ${relativePath}`);
  }
  const expectedToolLinks = [...expected.matchAll(/href="(\/fr\/tools\/[^"]+\/)"/g)].map((match) => match[1]);
  for (const href of expectedToolLinks) {
    if (!current.includes(`href="${href}"`)) {
      throw new Error(`Generated French Religious & Cultural page is missing source-owned route ${href}: ${relativePath}`);
    }
  }
}

function emit(filePath, content, check, changedFiles) {
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  if (normalizeBuildManagedHtml(current) === normalizeBuildManagedHtml(content)) return;
  if (check) {
    verifySourceOwnedOutput(filePath, current, content);
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  changedFiles.push(path.relative(ROOT, filePath));
}

function build(options = {}) {
  const manifest = readJson(MANIFEST_PATH);
  validateManifest(manifest);
  const check = Boolean(options.check);
  const changedFiles = [];
  manifest.tools.forEach((tool) => {
    emit(routeToFile(tool.route), renderToolPage(tool, manifest), check, changedFiles);
    ensureReciprocalHreflang(tool.englishRoute, tool.route, check, changedFiles);
  });
  emit(routeToFile(manifest.hub.route), renderHub(manifest), check, changedFiles);
  return {
    schemaVersion: manifest.schemaVersion,
    locale: manifest.locale,
    category: manifest.category,
    canonicalApps: manifest.tools.length,
    hub: manifest.hub.route,
    changedFiles
  };
}

function main() {
  try {
    const result = build({ check: process.argv.includes('--check') });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { build, validateManifest, renderToolPage, renderHub };
