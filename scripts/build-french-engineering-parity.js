#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { dedupeRepeatedParagraphs } = require('./lib/content-integrity');
const { normalizeBuildManagedHtml } = require('./lib/shared-asset-references');
const {
  OWNER_COPY,
  nativeGuide,
  sanitizeResidualEnglishHtml,
  structuredData,
  translateJavaScriptPresentation,
  translateVisibleHtml
} = require('./lib/french-engineering-copy');

const ROOT = path.resolve(__dirname, '..');
const write = process.argv.includes('--write');
const manifestFile = path.join(ROOT, 'reports/fr-engineering-construction-parity-manifest.json');
const rows = JSON.parse(fs.readFileSync(manifestFile, 'utf8')).routes;
const idArgument = process.argv.find((argument) => argument.startsWith('--ids='));
const requestedIds = idArgument
  ? new Set(idArgument.slice('--ids='.length).split(',').map((id) => id.trim()).filter(Boolean))
  : null;
const selectedRows = requestedIds ? rows.filter((row) => requestedIds.has(row.id)) : rows;
if (requestedIds && selectedRows.length !== requestedIds.size) {
  const found = new Set(selectedRows.map((row) => row.id));
  const missingIds = [...requestedIds].filter((id) => !found.has(id));
  throw new Error(`Unknown French Engineering owner id(s): ${missingIds.join(', ')}`);
}
const missing = {
  afrodraft: '/fr/ingenierie/afrodraft/',
  'afroplan-floor-planner': '/fr/ingenierie/planificateur-etage/',
  'scaffolding-calc': '/fr/tools/calculateur-echafaudage/',
  'window-door-sizing': '/fr/tools/dimensionnement-fenetres-portes/',
  'plumbing-material': '/fr/tools/materiaux-plomberie/'
};
const engineMigrated = new Set([
  'scaffolding-calc',
  'window-door-sizing',
  'plumbing-material',
  'septic-tank',
  'site-clearance',
  'road-construction-cost'
]);

let changed = 0;

function normalizeGeneratedHtml(html) {
  const normalized = normalizeBuildManagedHtml(html)
    .replace(/\s*<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>\s*/gi, '\n')
    .replace(/\s*<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, '\n')
    .replace(/\s*<meta\b[^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>\s*/gi, '\n')
    .replace(/((?:src|href)=["'][^"'?]+)\?v=[a-f0-9]+(["'])/gi, '$1$2')
    .replace(/(href=["'][^"']+)\/app\.html(["'])/gi, '$1/app$2')
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

function structuralHtmlSignature(html) {
  return normalizeGeneratedHtml(html)
    .replace(
      /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
      (full, attributes, body) => (
        /\bsrc=/.test(attributes)
          ? `<script${attributes}></script>`
          : `<script${attributes}>${body.replace(/\s+/g, " ").trim()}</script>`
      )
    )
    .replace(/>([^<]+)</g, '><')
    .replace(/\s+/g, ' ')
    .trim();
}

function sourceEquivalent(relativePath, current, expected) {
  const isHtml = /\.html?$/i.test(relativePath);
  const metaContent = (html, property) => html.match(
    new RegExp(`<meta\\b(?=[^>]*\\bproperty=["']${property}["'])[^>]*\\bcontent=["']([^"']+)["'][^>]*>`, 'i')
  )?.[1] || '';
  const equivalent = isHtml
    ? (
      normalizeGeneratedHtml(current) === normalizeGeneratedHtml(expected)
      || structuralHtmlSignature(current) === structuralHtmlSignature(expected)
    ) && metaContent(current, 'og:url') === metaContent(expected, 'og:url')
    : current === expected;
  return equivalent;
}

function fileFor(route) {
  return path.join(ROOT, route.replace(/^\/|\/$/g, ''), 'index.html');
}

function writeOwnedFile(rel, content) {
  const target = path.join(ROOT, rel);
  if (
    fs.existsSync(target)
    && sourceEquivalent(rel, fs.readFileSync(target, 'utf8'), content)
  ) return;
  changed += 1;
  if (!write) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function ensureAlternateTag(rel, hreflang, route) {
  const target = path.join(ROOT, rel);
  const current = fs.readFileSync(target, 'utf8');
  const tag = `<link rel="alternate" hreflang="${hreflang}" href="https://afrotools.com${route}">`;
  const existing = new RegExp(
    `<link rel="alternate" hreflang="${hreflang}" href="[^"]*">`,
    'i'
  );
  const next = existing.test(current)
    ? current.replace(existing, tag)
    : current.replace(
      /(<link rel="alternate" hreflang="x-default" href="[^"]*">)/i,
      `${tag}\n$1`
    );
  if (next === current && !current.includes(tag)) {
    throw new Error(`Could not add ${hreflang} alternate to ${rel}`);
  }
  writeOwnedFile(rel, next);
}

function writeSwahiliReciprocals() {
  ensureAlternateTag(
    'sw/zana/afrodraft-cad/index.html',
    'fr',
    '/fr/ingenierie/afrodraft/'
  );
  ensureAlternateTag(
    'sw/zana/mpangaji-ramani-ya-sakafu/index.html',
    'fr',
    '/fr/ingenierie/planificateur-etage/'
  );
  ensureAlternateTag(
    'sw/ujenzi-na-uhandisi/index.html',
    'fr',
    '/fr/ingenierie/'
  );
}

function normalizedToolkitRoute(route) {
  return String(route || '')
    .replace(/\/index\.html$/i, '/')
    .replace(/\/app\.html$/i, '/app');
}

function extractEnglishToolkitConfigs() {
  const sourceFile = path.join(ROOT, 'assets/js/engineering-toolkit.js');
  const marker = 'window.AfroEngineering=window.AfroEngineering||{},';
  const source = fs.readFileSync(sourceFile, 'utf8');
  if (!source.includes(marker)) {
    throw new Error('Engineering toolkit config marker was not found');
  }
  const instrumented = source.replace(
    marker,
    'globalThis.__AFRO_ENGINEERING_CONFIGS=o,window.AfroEngineering=window.AfroEngineering||{},'
  );
  const sandbox = {
    console,
    document: {
      readyState: 'loading',
      addEventListener: function () {}
    },
    window: {
      location: { pathname: '/__french-engineering-config-build__' }
    }
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(instrumented, sandbox, {
    filename: 'assets/js/engineering-toolkit.js'
  });
  return sandbox.__AFRO_ENGINEERING_CONFIGS || {};
}

function repeatedFrenchItems(items, count) {
  const source = items.filter(Boolean);
  return Array.from({ length: count }, function (_entry, index) {
    return source[index % source.length];
  });
}

function frenchToolkitConfig(row, frenchRoute, base) {
  const copy = OWNER_COPY[row.id];
  const checks = [
    copy.method,
    copy.caveat,
    'Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.',
    'Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs.',
    'Conservez une version datée de chaque hypothèse avant toute commande ou exécution.'
  ];
  const risks = [
    copy.caveat,
    'Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.',
    'Les prix, normes et conditions de chantier varient selon le pays et la localité.',
    'Faites valider les décisions d’exécution par un professionnel compétent.'
  ];
  const procurement = [
    'Dimensions et quantités vérifiées',
    'Hypothèses et exclusions datées',
    'Prix et disponibilité confirmés localement',
    'Marge de perte ou de sécurité justifiée',
    'Plans, relevés et devis de référence',
    'Validation professionnelle requise avant exécution'
  ];
  const sequence = [
    'Renseigner les données du projet',
    'Lancer le calcul ou préparer le plan',
    'Contrôler les hypothèses et les alertes',
    'Comparer les résultats aux sources locales',
    'Enregistrer ou exporter le dossier de décision'
  ];
  const modes = [
    'Planification initiale',
    'Revue de l’estimation',
    'Dossier de chantier',
    'Contrôle technique'
  ];
  const companions = (base.companions || []).map(function (companion, index) {
    const target = rows.find(function (candidate) {
      return normalizedToolkitRoute(candidate.english) ===
        normalizedToolkitRoute(companion.href);
    });
    return {
      label: target ? OWNER_COPY[target.id].name : `Outil associé ${index + 1}`,
      href: target ? (target.french || missing[target.id]) : companion.href
    };
  });
  return {
    id: row.id,
    source: row.english,
    route: frenchRoute,
    kind: base.kind || '',
    floating: Boolean(base.floating),
    afrodraft: Boolean(base.afrodraft),
    name: `${copy.name} — dossier de revue`,
    kicker: 'Revue technique',
    description: copy.purpose,
    modes: repeatedFrenchItems(modes, (base.modes || []).length),
    modeValues: base.modes || [],
    presets: (base.presets || []).map(function (preset, index) {
      return {
        label: `Scénario ${index + 1} — ${copy.name}`,
        values: preset.values || {},
        note: preset.note ? copy.method : '',
        autoRun: Boolean(preset.autoRun)
      };
    }),
    checks: repeatedFrenchItems(checks, (base.checks || []).length),
    risks: repeatedFrenchItems(risks, (base.risks || []).length),
    procurement: repeatedFrenchItems(
      procurement,
      (base.procurement || []).length
    ),
    sequence: repeatedFrenchItems(sequence, (base.sequence || []).length),
    companions,
    thresholds: (base.thresholds || []).map(function (threshold) {
      return {
        id: threshold.id,
        min: threshold.min,
        max: threshold.max,
        message: copy.caveat
      };
    }),
    benchmark: base.benchmark
      ? 'Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables.'
      : ''
  };
}

function writeFrenchToolkitConfigs() {
  const englishConfigs = extractEnglishToolkitConfigs();
  const configs = {};
  for (const row of rows) {
    const frenchRoute = row.french || missing[row.id];
    const englishKey = normalizedToolkitRoute(row.english);
    const base = englishConfigs[englishKey];
    if (!base) {
      throw new Error(`Missing Engineering toolkit config for ${row.english}`);
    }
    configs[frenchRoute] = frenchToolkitConfig(row, frenchRoute, base);
  }
  const serialized = JSON.stringify(configs, null, 2).replace(/</g, '\\u003c');
  writeOwnedFile(
    'assets/js/pages/fr-engineering-toolkit-config.js',
    `(function () {\n  'use strict';\n  window.AfroFrenchEngineeringToolkitConfigs = ${serialized};\n}());\n`
  );
}

function oldPairs(file) {
  // The 21 inherited French pages were explicitly rejected as translation
  // sources. Native copy comes only from the reviewed owner dictionary below;
  // arbitrary string arrays inside legacy HTML must never become rewrite rules.
  void file;
  return [];
}

function safePairs(pairs) {
  return pairs.filter(([from, to]) => (
    typeof from === 'string' &&
    typeof to === 'string' &&
    from.length > 0 &&
    from.length <= 180 &&
    to.length > 0 &&
    to.length <= 240 &&
    !/[{};]/.test(from) &&
    !/(?:querySelector|classList|innerHTML|textContent)/.test(from) &&
    !/^[.#[]/.test(from) &&
    /[A-Za-z]/.test(from) &&
    /[A-Za-zÀ-ÿ]/.test(to)
  ));
}

function nativeFrenchBusinessCta(row) {
  const copy = OWNER_COPY[row.id];
  return `<section class="fr-engineering-business-cta" aria-labelledby="${row.id}-business-title">
  <h2 id="${row.id}-business-title">Besoin d’un accompagnement professionnel ?</h2>
  <p>Enregistrez d’abord votre estimation ${copy.name}, puis comparez des devis détaillés auprès de professionnels qualifiés.</p>
  <p><strong>La sélection d’un prestataire reste indépendante du calcul.</strong> Aucun renseignement de projet n’est transmis sans votre action explicite.</p>
</section>`;
}

function nativeFrenchRelatedTools(row) {
  const currentIndex = rows.findIndex((candidate) => candidate.id === row.id);
  const related = [];
  for (let offset = 1; related.length < 3 && offset < rows.length; offset += 1) {
    related.push(rows[(currentIndex + offset) % rows.length]);
  }
  const links = related.map((candidate) => (
    `<li><a href="${candidate.french}">${OWNER_COPY[candidate.id].name}</a></li>`
  )).join('\n      ');
  return `<nav class="fr-engineering-related-tools" aria-labelledby="${row.id}-related-title">
  <h2 id="${row.id}-related-title">Outils d’ingénierie associés</h2>
  <ul>
      ${links}
  </ul>
</nav>`;
}

function replaceEnglishOnlyComponents(html, row) {
  return html
    .replace(
      /<afro-business-cta\b[^>]*>[\s\S]*?<\/afro-business-cta>/gi,
      nativeFrenchBusinessCta(row)
    )
    .replace(
      /<afro-related-tools\b[^>]*>[\s\S]*?<\/afro-related-tools>/gi,
      nativeFrenchRelatedTools(row)
    );
}

function extractControllers(row, html) {
  if (engineMigrated.has(row.id)) return html;
  let index = 0;
  return html.replace(
    /<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)([^>]*)>([\s\S]*?)<\/script>/gi,
    (full, attrs, code) => {
      if (!code.trim()) return full;
      index += 1;
      const rel = `assets/js/pages/engineering-parity/${row.id}-${index}.js`;
      writeOwnedFile(rel, `${code.trim()}\n`);
      return `<script${attrs || ''} src="/${rel}"></script>`;
    }
  );
}

function localizeOwnerRuntimeCode(code, row) {
  let localized = code;
  if (row.id === 'boq-gen') {
    localized = localized
      .replace(/,,,,Labour,/g, ',,,,Main-d’œuvre,')
      .replace(/,,,,Subtotal,/g, ',,,,Sous-total,')
      .replace(/,,,,Contingency,/g, ',,,,Imprévus,');
  }
  if (row.id === 'afroplan-floor-planner') {
    localized = localized.replace(
      /"Outil : "\+([A-Za-z_$][\w$]*)\.charAt\(0\)\.toUpperCase\(\)\+\1\.slice\(1\)/g,
      '"Outil : "+({select:"Sélection",wall:"Mur",door:"Porte",window:"Fenêtre",furniture:"Mobilier",measure:"Mesure",label:"Étiquette",erase:"Effacer"}[$1]||$1)'
    );
  }
  if (row.id === 'window-door-sizing') {
    localized = localized.replace(
      /row\.material\.replace\(\/_\/g,\s*['"] ['"]\)/g,
      '({panel_timber:"panneau de bois",timber:"bois",steel:"acier",aluminium:"aluminium",upvc:"PVC-U"}[row.material]||row.material.replace(/_/g," "))'
    );
  }
  if (row.id === 'plumbing-material') {
    localized = localized.replace(
      /\bunit:row\.unit\b/g,
      "unit:row.unit==='days'?'jours':row.unit"
    );
  }
  return localized;
}

function localizedController(rel, pairs, row) {
  const source = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const localized = localizeOwnerRuntimeCode(
    translateJavaScriptPresentation(source, pairs, row),
    row
  );
  const targetRel = rel.replace(
    'assets/js/pages/engineering-parity/',
    'assets/js/pages/engineering-parity/fr/'
  );
  writeOwnedFile(targetRel, localized);
  return targetRel;
}

function localizeControllerReferences(html, pairs, row) {
  return html.replace(
    /\/(assets\/js\/pages\/engineering-parity\/(?!fr\/)[^"'?]+\.js)/g,
    (whole, rel) => `/${localizedController(rel, pairs, row)}`
  );
}

function localizeInlineControllers(html, pairs, row) {
  return html.replace(
    /<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)([^>]*)>([\s\S]*?)<\/script>/gi,
    (full, attrs, code) => {
      if (!code.trim()) return full;
      return `<script${attrs || ''}>${localizeOwnerRuntimeCode(
        translateJavaScriptPresentation(code, pairs, row),
        row
      )}</script>`;
    }
  );
}

function localizeModule(sourceRel, targetRel, row, pairs = []) {
  const source = fs.readFileSync(path.join(ROOT, sourceRel), 'utf8');
  writeOwnedFile(
    targetRel,
    localizeOwnerRuntimeCode(translateJavaScriptPresentation(source, pairs, row), row)
  );
}

function englishHreflang(row, html, frenchRoute) {
  const englishUrl = `https://afrotools.com${row.english}`;
  const frenchUrl = `https://afrotools.com${frenchRoute}`;
  const siblings = [...html.matchAll(/<link rel="alternate" hreflang="(?!en|fr|x-default)([^"]+)" href="([^"]+)">/gi)]
    .map((match) => `<link rel="alternate" hreflang="${match[1]}" href="${match[2]}">`);
  const cleaned = html.replace(/\s*<link rel="alternate" hreflang="[^"]+" href="[^"]*">/gi, '');
  return cleaned.replace(
    '</head>',
    `<link rel="alternate" hreflang="en" href="${englishUrl}">\n` +
    `<link rel="alternate" hreflang="fr" href="${frenchUrl}">\n` +
    `${siblings.length ? `${siblings.join('\n')}\n` : ''}` +
    `<link rel="alternate" hreflang="x-default" href="${englishUrl}">\n</head>`
  );
}

function applyFrenchMetadata(row, html, frenchRoute) {
  const copy = OWNER_COPY[row.id];
  const englishUrl = `https://afrotools.com${row.english}`;
  const frenchUrl = `https://afrotools.com${frenchRoute}`;
  const artwork = (row.artwork || [])[0];
  const artworkUrl = artwork
    ? `https://afrotools.com/assets/img/tools/${artwork}`
    : 'https://afrotools.com/assets/img/og/og-home-v2.webp';
  const description = `${copy.purpose} Calcul local, hypothèses visibles et résultats exportables pour les projets africains.`;
  const siblings = [...html.matchAll(/<link rel="alternate" hreflang="(?!en|fr|x-default)([^"]+)" href="([^"]+)">/gi)]
    .map((match) => `<link rel="alternate" hreflang="${match[1]}" href="${match[2]}">`);

  html = html.replace(/<html([^>]*)\blang="[^"]*"([^>]*)>/i, '<html$1lang="fr"$2>');
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${copy.name} | AfroTools</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*">/i,
    `<meta name="description" content="${description}">`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*">/i,
    `<meta property="og:title" content="${copy.name} | AfroTools">`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*">/i,
    `<meta property="og:description" content="${copy.purpose}">`
  );
  html = html.replace(
    /<meta\b(?=[^>]*\bproperty="og:url")[^>]*>/i,
    `<meta property="og:url" content="${frenchUrl}">`
  );
  html = html.replace(
    /<meta property="og:image" content="[^"]*">/i,
    `<meta property="og:image" content="${artworkUrl}">`
  );
  html = html.replace(
    /<meta property="og:locale" content="[^"]*">/i,
    '<meta property="og:locale" content="fr_FR">'
  );
  html = html.replace(
    /<meta property="og:locale:alternate" content="[^"]*">/i,
    '<meta property="og:locale:alternate" content="en_US">'
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*">/i,
    `<meta name="twitter:title" content="${copy.name} | AfroTools">`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*">/i,
    `<meta name="twitter:description" content="${copy.purpose}">`
  );
  html = html.replace(/\s*<link rel="canonical" href="[^"]*">/i, '');
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');
  html = html.replace(/\s*<link rel="alternate" hreflang="[^"]+" href="[^"]*">/gi, '');
  return html.replace(
    '</head>',
    `<meta name="afrotools-content-id" content="${row.contentId || `fr-engineering:${row.id}`}">\n` +
    '<meta name="afrotools-source-owner" content="scripts/build-french-engineering-parity.js">\n' +
    `<meta name="afrotools-source-route" content="${row.english}">\n` +
    `<meta name="afrotools-ai-tool-id" content="${row.id}">\n` +
    '<link rel="stylesheet" href="/assets/css/fr-engineering-parity.css">\n' +
    `<script type="application/ld+json">${structuredData(row, frenchRoute)}</script>\n` +
    `<link rel="canonical" href="${frenchUrl}">\n` +
    `<link rel="alternate" hreflang="en" href="${englishUrl}">\n` +
    `<link rel="alternate" hreflang="fr" href="${frenchUrl}">\n` +
    `${siblings.length ? `${siblings.join('\n')}\n` : ''}` +
    `<link rel="alternate" hreflang="x-default" href="${englishUrl}">\n` +
    '</head>'
  );
}

function frenchHtml(row, html, frenchRoute, rawPairs) {
  const pairs = safePairs(rawPairs);
  html = localizeControllerReferences(html, pairs, row);
  html = localizeInlineControllers(html, pairs, row);
  html = translateVisibleHtml(html, pairs);
  html = sanitizeResidualEnglishHtml(html, row);
  html = replaceEnglishOnlyComponents(html, row);
  html = html.replace(
    /\/assets\/js\/pages\/english-df-app-upgrades\.js(?:\?[^"]*)?/g,
    '/assets/js/pages/fr-engineering-df-app-upgrades.js'
  );
  html = html.replace(
    /<script src="\/assets\/js\/engineering-toolkit\.js(?:\?[^"]*)?" defer><\/script>/g,
    '<script src="/assets/js/pages/fr-engineering-toolkit-config.js" defer></script>\n' +
    '<script src="/assets/js/pages/fr-engineering-toolkit.js" defer></script>'
  );
  html = html.replace(
    /\/assets\/js\/pages\/engineering-tool-focus\.js(?:\?[^"]*)?/g,
    '/assets/js/pages/fr-engineering-tool-focus.js'
  );
  html = applyFrenchMetadata(row, html, frenchRoute);
  if (row.id === 'afrodraft') {
    html = html
      .replace(/href="app\.html/g, 'href="/fr/ingenierie/afrodraft/app.html')
      .replace(/href="assets\//g, 'href="/engineering/afrodraft/assets/')
      .replace(/src="assets\//g, 'src="/engineering/afrodraft/assets/');
  }
  const payload = JSON.stringify({
    id: row.id,
    name: OWNER_COPY[row.id].name,
    source: row.english,
    privacy: 'local-first',
    aiConsent: 'explicit'
  }).replace(/</g, '\\u003c');
  html = html.replace(
    '</body>',
    `${nativeGuide(row, frenchRoute)}\n` +
    '<script src="/assets/js/pages/fr-engineering-reflow.js"></script>\n' +
    `<script>window.AfroToolsFrenchEngineering=${payload};</script>\n` +
    '</body>'
  );
  return dedupeRepeatedParagraphs(html).html.replace(/^[ \t]+$/gm, '');
}

function writeAfrodraftWorkspace() {
  const englishFile = path.join(ROOT, 'engineering/afrodraft/app.html');
  const frenchFile = path.join(ROOT, 'fr/ingenierie/afrodraft/app.html');
  const englishRoute = '/engineering/afrodraft/app';
  const frenchRoute = '/fr/ingenierie/afrodraft/app';
  const row = {
    id: 'afrodraft',
    english: englishRoute,
    contentId: 'fr-engineering:afrodraft-workspace',
    artwork: ['afrodraft.webp']
  };
  const current = fs.readFileSync(englishFile, 'utf8');
  const nextEnglish = englishHreflang(row, current, frenchRoute);

  localizeModule(
    'engineering/afrodraft/app.js',
    'engineering/afrodraft/app.fr.js',
    row
  );
  localizeModule(
    'engineering/afrodraft/src/ui/WorkspaceShell.js',
    'engineering/afrodraft/src/ui/WorkspaceShell.fr.js',
    row
  );
  localizeModule(
    'engineering/afrodraft/src/ui/TemplateLauncher.js',
    'engineering/afrodraft/src/ui/TemplateLauncher.fr.js',
    row
  );
  localizeModule(
    'engineering/afrodraft/src/features/v7-features.js',
    'engineering/afrodraft/src/features/v7-features.fr.js',
    row
  );

  let french = sanitizeResidualEnglishHtml(translateVisibleHtml(nextEnglish), row);
  french = replaceEnglishOnlyComponents(french, row);
  french = applyFrenchMetadata(row, french, frenchRoute)
    .replace(/href="assets\//g, 'href="/engineering/afrodraft/assets/')
    .replace(/src="app\.js[^"]*/g, 'src="/engineering/afrodraft/app.fr.js')
    .replace(
      /src="src\/ui\/WorkspaceShell\.js[^"]*/g,
      'src="/engineering/afrodraft/src/ui/WorkspaceShell.fr.js'
    )
    .replace(
      /src="src\/ui\/TemplateLauncher\.js[^"]*/g,
      'src="/engineering/afrodraft/src/ui/TemplateLauncher.fr.js'
    )
    .replace(
      /src="src\/features\/v7-features\.js[^"]*/g,
      'src="/engineering/afrodraft/src/features/v7-features.fr.js'
    );
  french = french.replace(
    '</body>',
    `${nativeGuide(row, frenchRoute)}\n` +
    '<script>window.AfroToolsFrenchEngineering={"id":"afrodraft-workspace","name":"AfroDraft CAO 2D","source":"/engineering/afrodraft/app","privacy":"local-first","aiConsent":"explicit"};</script>\n' +
    '</body>'
  );
  french = dedupeRepeatedParagraphs(french).html.replace(/^[ \t]+$/gm, '');

  if (!sourceEquivalent('engineering/afrodraft/app.html', current, nextEnglish)) {
    changed += 1;
    if (write) fs.writeFileSync(englishFile, nextEnglish);
  }
  if (
    !fs.existsSync(frenchFile)
    || !sourceEquivalent('fr/ingenierie/afrodraft/app.html', fs.readFileSync(frenchFile, 'utf8'), french)
  ) {
    changed += 1;
    if (write) {
      fs.mkdirSync(path.dirname(frenchFile), { recursive: true });
      fs.writeFileSync(frenchFile, french);
    }
  }
}

function localizeFloorPlannerModules(html, row) {
  return html.replace(
    /src="\/engineering\/floor-planner\/js\/([^"?]+)\.js(?:\?[^"]*)?"/g,
    (whole, base) => {
      const sourceRel = `engineering/floor-planner/js/${base}.js`;
      const targetRel = `engineering/floor-planner/js/${base}.fr.js`;
      localizeModule(sourceRel, targetRel, row);
      return `src="/${targetRel}"`;
    }
  );
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function writeFrenchHub() {
  const englishRel = 'engineering/index.html';
  const englishFile = path.join(ROOT, englishRel);
  const currentEnglish = fs.readFileSync(englishFile, 'utf8');
  const hubRow = { english: '/engineering/' };
  const nextEnglish = englishHreflang(hubRow, currentEnglish, '/fr/ingenierie/');
  if (!sourceEquivalent(englishRel, currentEnglish, nextEnglish)) {
    changed += 1;
    if (write) fs.writeFileSync(englishFile, nextEnglish);
  }

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Outils d’ingénierie et de construction AfroTools',
    numberOfItems: rows.length,
    itemListElement: rows.map((row, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: OWNER_COPY[row.id].name,
      url: `https://afrotools.com${row.french || missing[row.id]}`
    }))
  };
  const cards = rows.map((row) => {
    const route = row.french || missing[row.id];
    const copy = OWNER_COPY[row.id];
    return `<a class="fr-engineering-hub-card" href="${route}" data-owner="${row.id}">
      <img src="/assets/img/tools/${row.artwork[0]}" alt="" width="320" height="180" loading="lazy">
      <span class="fr-engineering-hub-card__body">
        <strong>${escapeHtml(copy.name)}</strong>
        <span>${escapeHtml(copy.purpose)}</span>
        <small>Ouvrir le parcours</small>
      </span>
    </a>`;
  }).join('\n');
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ingénierie et construction : 26 outils | AfroTools</title>
<meta name="description" content="Accédez à 26 outils français natifs pour la CAO, les plans, devis, structures, matériaux, énergie, eau et coûts de chantier en Afrique.">
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<link rel="canonical" href="https://afrotools.com/fr/ingenierie/">
<link rel="alternate" hreflang="en" href="https://afrotools.com/engineering/">
<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/ingenierie/">
<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/ujenzi-na-uhandisi/">
<link rel="alternate" hreflang="x-default" href="https://afrotools.com/engineering/">
<meta property="og:type" content="website">
<meta property="og:title" content="Ingénierie et construction : 26 outils | AfroTools">
<meta property="og:description" content="Calculs et parcours locaux pour préparer un projet de construction africain.">
<meta property="og:url" content="https://afrotools.com/fr/ingenierie/">
<meta property="og:image" content="https://afrotools.com/assets/img/tools/afrodraft.webp">
<meta name="twitter:card" content="summary_large_image">
<meta name="afrotools-content-id" content="fr-engineering-hub">
<meta name="afrotools-source-owner" content="scripts/build-french-engineering-parity.js">
<meta name="afrotools-ai-category-id" content="engineering">
<script type="application/ld+json">${JSON.stringify(itemList).replace(/</g, '\\u003c')}</script>
<link rel="stylesheet" href="/assets/css/design-system.min.css">
<link rel="stylesheet" href="/assets/css/fr-engineering-parity.css">
<style>
body{margin:0;background:var(--color-bg,#f8fafc);color:var(--color-text,#0f172a);font-family:system-ui,sans-serif}
.fr-engineering-hub{max-width:1120px;margin:auto;padding:32px 20px 64px}
.fr-engineering-hub__hero{max-width:760px;margin-bottom:28px}
.fr-engineering-hub__hero h1{font-size:clamp(2rem,6vw,3.6rem);line-height:1.05;margin:.25em 0}
.fr-engineering-hub__hero p{font-size:1.05rem;line-height:1.7}
.fr-engineering-hub__trust{border-left:4px solid #ea580c;padding:12px 16px;background:var(--color-surface,#fff);margin:22px 0}
.fr-engineering-hub__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:16px}
.fr-engineering-hub-card{display:flex;flex-direction:column;min-width:0;color:inherit;text-decoration:none;border:1px solid var(--color-border,#cbd5e1);border-radius:14px;overflow:hidden;background:var(--color-surface,#fff)}
.fr-engineering-hub-card:focus-visible{outline:3px solid #2563eb;outline-offset:3px}
.fr-engineering-hub-card img{width:100%;height:150px;object-fit:cover;background:#e2e8f0}
.fr-engineering-hub-card__body{display:grid;gap:8px;padding:16px}
.fr-engineering-hub-card__body span{line-height:1.5}
.fr-engineering-hub-card__body small{color:#c2410c;font-weight:700}
@media(max-width:375px){.fr-engineering-hub{padding-inline:14px}.fr-engineering-hub__grid{grid-template-columns:1fr}}
@media(prefers-color-scheme:dark){body{background:#07111f;color:#e2e8f0}.fr-engineering-hub-card,.fr-engineering-hub__trust{background:#0f1c2e;border-color:#334155}}
</style>
<script src="/assets/js/components/navbar.min.js" defer></script>
<script src="/assets/js/components/footer.min.js" defer></script>
<script src="/assets/js/pages/fr-engineering-reflow.js" defer></script>
</head>
<body>
<afro-navbar></afro-navbar>
<main class="fr-engineering-hub">
  <header class="fr-engineering-hub__hero">
    <p><a href="/fr/">Accueil en français</a> / Ingénierie</p>
    <h1>Ingénierie et construction</h1>
    <p>Vingt-six parcours français natifs pour dessiner, dimensionner, estimer et exporter les décisions utiles d’un projet, du plan initial au chantier.</p>
    <div class="fr-engineering-hub__trust" role="note"><strong>Calcul local et privé.</strong> Les calculateurs déterministes et les exports fonctionnent dans votre navigateur. Toute assistance d’IA reste facultative et exige un consentement explicite.</div>
  </header>
  <section aria-labelledby="fr-engineering-tools-title">
    <h2 id="fr-engineering-tools-title">Les 26 outils</h2>
    <div class="fr-engineering-hub__grid">${cards}</div>
  </section>
</main>
<afro-footer></afro-footer>
</body>
</html>
`;
  writeOwnedFile('fr/ingenierie/index.html', html);
}

const controllerDir = path.join(ROOT, 'assets/js/pages/engineering-parity');
if (!requestedIds && write && fs.existsSync(controllerDir)) {
  for (const name of fs.readdirSync(controllerDir)) {
    const target = path.join(controllerDir, name);
    if (!fs.statSync(target).isFile()) continue;
    const text = fs.readFileSync(target, 'utf8');
    if (text.endsWith('\\n')) fs.writeFileSync(target, `${text.slice(0, -2)}\n`);
  }
}

if (!requestedIds) writeFrenchToolkitConfigs();

for (const row of selectedRows) {
  const englishFile = fileFor(row.english);
  const oldFrenchFile = row.french ? fileFor(row.french) : null;
  const frenchRoute = row.french || missing[row.id];
  const currentEnglish = fs.readFileSync(englishFile, 'utf8');
  const nextEnglish = englishHreflang(
    row,
    extractControllers(row, currentEnglish),
    frenchRoute
  );
  let french = frenchHtml(row, nextEnglish, frenchRoute, oldPairs(oldFrenchFile));
  if (row.id === 'afroplan-floor-planner') french = localizeFloorPlannerModules(french, row);
  const frenchFile = fileFor(frenchRoute);

  if (!sourceEquivalent(row.english.replace(/^\/|\/$/g, '') + '/index.html', currentEnglish, nextEnglish)) {
    changed += 1;
    if (write) fs.writeFileSync(englishFile, nextEnglish);
  }
  if (
    !fs.existsSync(frenchFile)
    || !sourceEquivalent(frenchRoute.replace(/^\/|\/$/g, '') + '/index.html', fs.readFileSync(frenchFile, 'utf8'), french)
  ) {
    changed += 1;
    if (write) {
      fs.mkdirSync(path.dirname(frenchFile), { recursive: true });
      fs.writeFileSync(frenchFile, french);
    }
  }
}

if (!requestedIds) {
  writeFrenchHub();
  writeSwahiliReciprocals();
  writeAfrodraftWorkspace();
}

console.log(`${write ? 'Wrote' : 'Would change'} ${changed} scoped Engineering owner files (${selectedRows.length} owner(s)).`);
if (!write && changed) process.exitCode = 1;
