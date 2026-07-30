#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const localizer = require('../assets/js/lib/fr-document-pdf-localizer.js');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'data', 'localization', 'fr-document-pdf-parity.json');
const LEXICON_PATH = path.join(ROOT, 'data', 'localization', 'fr-document-pdf-lexicon.json');
const ARTWORK_PATH = path.join(ROOT, 'data', 'localization', 'fr-document-pdf-artwork.json');
const DIRECTORY_PATH = path.join(ROOT, 'data', 'tool-directory.json');
const WRITE = process.argv.includes('--write');
const CHECK = process.argv.includes('--check');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function translateHtmlValue(value, routeExact) {
  const source = String(value == null ? '' : value);
  const leading = (source.match(/^\s*/) || [''])[0];
  const trailing = (source.match(/\s*$/) || [''])[0];
  const normalized = decodeHtmlEntities(source).replace(/\s+/g, ' ').trim();
  if (!normalized) return source;
  return `${leading}${localizer.translate(normalized, routeExact)}${trailing}`;
}

function routeVariants(route) {
  const normalized = `/${String(route).replace(/^\/+|\/+$/g, '')}`;
  return [normalized, `${normalized}/`];
}

function replaceMeta(html, selector, value) {
  const escaped = escapeHtml(value);
  const patterns = selector === 'title'
    ? [/<title>[\s\S]*?<\/title>/i]
    : [
        new RegExp(`<meta\\s+name=["']${selector}["'][^>]*>`, 'i'),
        new RegExp(`<meta\\s+property=["']${selector}["'][^>]*>`, 'i')
      ];
  const replacement = selector === 'title'
    ? `<title>${escaped}</title>`
    : selector.startsWith('og:')
      ? `<meta property="${selector}" content="${escaped}">`
      : `<meta name="${selector}" content="${escaped}">`;
  for (const pattern of patterns) {
    if (pattern.test(html)) return html.replace(pattern, replacement);
  }
  return html.replace('</head>', `${replacement}\n</head>`);
}

function replaceLink(html, rel, href) {
  const pattern = new RegExp(`<link\\s+rel=["']${rel}["'][^>]*>`, 'i');
  const replacement = `<link rel="${rel}" href="${escapeHtml(href)}">`;
  return pattern.test(html)
    ? html.replace(pattern, replacement)
    : html.replace('</head>', `${replacement}\n</head>`);
}

function translateMarkup(markup, routeExact) {
  const protectedSegments = [];
  const tokenized = markup.replace(
    /<(script|style|code|pre)\b[\s\S]*?<\/\1>/gi,
    (segment) => {
      const token = `__AFROTOOLS_PROTECTED_${protectedSegments.length}__`;
      protectedSegments.push(segment);
      return token;
    }
  );
  const translated = tokenized
    .replace(/>([^<]+)</g, (match, text) => `>${translateHtmlValue(text, routeExact)}<`)
    .replace(/\b(placeholder|title|aria-label|aria-description)=("([^"]*)"|'([^']*)')/gi,
      (match, name, quoted, doubleValue, singleValue) => {
        const quote = quoted[0];
        const value = doubleValue == null ? singleValue : doubleValue;
        return `${name}=${quote}${translateHtmlValue(value, routeExact)}${quote}`;
      });
  return translated.replace(/__AFROTOOLS_PROTECTED_(\d+)__/g, (_, index) => protectedSegments[Number(index)]);
}

function localizeRouteOwnedRuntimeLiterals(html, app) {
  const literals = {
    'pdf-workspace': [
      ['aria-label="Delete page ', 'aria-label="Supprimer la page ']
    ]
  };
  return (literals[app.id] || []).reduce(
    (output, [source, localized]) => output.replaceAll(source, localized),
    html
  );
}

function recursivelyLocalizeSchema(value, app, canonicalUrl, allRoutes, frenchApps, routeExact, artworkUrl) {
  if (Array.isArray(value)) return value.map((item) => recursivelyLocalizeSchema(item, app, canonicalUrl, allRoutes, frenchApps, routeExact, artworkUrl));
  if (!value || typeof value !== 'object') {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (allRoutes && allRoutes[trimmed]) return allRoutes[trimmed];
    if (/^https:\/\/afrotools\.com\//i.test(trimmed)) {
      try {
        const parsed = new URL(trimmed);
        const mapped = allRoutes && (allRoutes[parsed.pathname] || allRoutes[parsed.pathname.replace(/\/$/, '')]);
        if (mapped) {
          parsed.pathname = mapped;
          return parsed.toString();
        }
      } catch {
        // Keep malformed source values unchanged and let the text localizer handle them.
      }
    }
    return localizer.translate(value, routeExact);
  }
  const output = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === 'inLanguage') output[key] = 'fr';
    else if (key === 'url' && typeof entry === 'string' && routeVariants(app.englishRoute).some((route) => {
      try {
        return new URL(entry, 'https://afrotools.com').pathname === route;
      } catch {
        return entry === route;
      }
    })) {
      output[key] = canonicalUrl;
    } else if ((key === 'image' || key === 'thumbnailUrl') && artworkUrl) {
      output[key] = artworkUrl;
    } else output[key] = recursivelyLocalizeSchema(entry, app, canonicalUrl, allRoutes, frenchApps, routeExact, artworkUrl);
  }
  if (output['@type'] === 'ListItem') {
    const target = output.url || output.item;
    if (typeof target === 'string') {
      try {
        const path = new URL(target, 'https://afrotools.com').pathname;
        const owner = frenchApps && (frenchApps[path] || frenchApps[path.replace(/\/$/, '')]);
        if (owner) output.name = owner.name;
      } catch {
        // Preserve the localized source name when a schema URL is malformed.
      }
    }
  }
  if (output['@context'] === 'https://schema.org' && !output.inLanguage) output.inLanguage = 'fr';
  return output;
}

function localizeSchemas(html, app, canonicalUrl, allRoutes, apps, routeExact, artworkUrl) {
  const frenchApps = Object.fromEntries((apps || []).flatMap((entry) => (
    routeVariants(entry.frenchRoute).map((route) => [route, entry])
  )));
  return html.replace(
    /<script\b([^>]*type=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi,
    (match, attrs, body) => {
      try {
        const parsed = JSON.parse(body);
        const localized = recursivelyLocalizeSchema(parsed, app, canonicalUrl, allRoutes, frenchApps, routeExact, artworkUrl);
        if (localized && typeof localized === 'object') {
          if (['WebApplication', 'WebPage', 'CollectionPage'].includes(localized['@type'])) {
            localized.name = app.name;
            localized.description = app.description;
            localized.url = canonicalUrl;
            localized.inLanguage = 'fr';
          }
        }
        return `<script${attrs}>${JSON.stringify(localized).replace(/</g, '\\u003c')}</script>`;
      } catch {
        return match
          .replace(/"inLanguage"\s*:\s*"[^"]*"/g, '"inLanguage":"fr"')
          .replaceAll(`https://afrotools.com${app.englishRoute}`, canonicalUrl);
      }
    }
  );
}

function removeOldAlternates(html) {
  return html.replace(/^[ \t]*<link\s+rel=["']alternate["'][^>]*>[ \t]*(?:\r?\n|$)/gim, '');
}

function placeRouteLinksLast(html) {
  const pattern = /^[ \t]*<link\s+rel=["'](?:canonical|alternate)["'][^>]*>[ \t]*(?:\r?\n|$)/gim;
  const links = [...html.matchAll(pattern)].map((match) => match[0].trim());
  if (!links.length) return html;
  const withoutLinks = html.replace(pattern, '');
  return withoutLinks.replace('</head>', `${links.join('\n')}\n</head>`);
}

function routeMap(config) {
  const output = {};
  for (const app of config.apps) {
    for (const variant of routeVariants(app.englishRoute)) output[variant] = app.frenchRoute;
    if (app.englishWorkspaceFile && app.frenchWorkspaceRoute) {
      const englishApp = `${app.englishRoute.replace(/\/$/, '')}/app`;
      output[englishApp] = app.frenchWorkspaceRoute;
      output[`${englishApp}/`] = app.frenchWorkspaceRoute;
      output[`${englishApp}.html`] = app.frenchWorkspaceRoute;
    }
  }
  return output;
}

function addRuntime(html, app, allRoutes, routeExact) {
  const context = JSON.stringify({
    id: app.id,
    locale: 'fr',
    englishOwner: app.englishFile,
    localFirstDownloads: true,
    observeDynamic: app.dynamicLocalization !== false,
    refreshOnInteraction: app.interactionLocalization === true,
    routeMap: allRoutes,
    exact: routeExact
  }).replace(/</g, '\\u003c');
  const injection = [
    '<link rel="stylesheet" href="/assets/css/fr-document-pdf-parity.css">',
    `<script>window.__AFROTOOLS_FR_DOCUMENT_PDF__=${context};</script>`,
    '<script src="/assets/js/lib/fr-document-pdf-localizer.js" defer></script>',
    '<script src="/assets/js/pages/fr-document-pdf-export-localization.js" defer></script>'
  ].join('\n');
  if (html.includes('/assets/js/lib/fr-document-pdf-localizer.js')) return html;
  return html.replace('</head>', `${injection}\n</head>`);
}

function rewriteLocalizedCvRuntime(html, app) {
  if (app.id !== 'cv-builder') return html;
  return html.replace(
    /\/tools\/cv-builder\/js\/([^"'?]+\.js)/g,
    (source, filename) => (
      fs.existsSync(path.join(ROOT, 'fr', 'tools', 'generateur-cv', 'js', filename))
        ? `/fr/tools/generateur-cv/js/${filename}`
        : source
    )
  );
}

function rewriteLocalizedPageRuntime(html, app) {
  const owners = {
    'html-to-pdf': {
      source: '/assets/js/pages/html-to-pdf.js',
      output: '/fr/tools/html-en-pdf/js/html-to-pdf.js',
      file: 'fr/tools/html-en-pdf/js/html-to-pdf.js'
    },
    'freelance-invoice': {
      source: '/assets/js/pages/freelance-invoice.js',
      output: '/fr/tools/facture-freelance/js/freelance-invoice.js',
      file: 'fr/tools/facture-freelance/js/freelance-invoice.js'
    },
    'cover-letter': {
      source: '/assets/js/pages/cover-letter-ai-assist.js',
      output: '/fr/tools/generateur-lettre-motivation/js/cover-letter-ai-assist.js',
      file: 'fr/tools/generateur-lettre-motivation/js/cover-letter-ai-assist.js'
    }
  };
  const owner = owners[app.id];
  if (!owner || !fs.existsSync(path.join(ROOT, owner.file))) return html;
  return html.replace(owner.source, owner.output);
}

function addProof(html, app) {
  if (html.includes('class="fr-parity-proof"')) return html;
  const consent = app.requiresConsent
    ? 'Toute fonction réseau ou IA exige un consentement explicite après affichage du contenu à envoyer. Une solution locale reste disponible.'
    : 'Le traitement principal reste local dans ce navigateur. Aucun fichier source n’est envoyé par ce flux.';
  const sensitive = app.sensitive
    ? 'Les données saisies peuvent être sensibles. Elles ne doivent pas être placées dans les URL, les journaux, les analyses ou un service réseau sans consentement.'
    : 'Conservez le fichier original et rouvrez chaque export dans une autre application avant de le partager ou de le déposer.';
  const exportLabels = { print: 'IMPRESSION' };
  const exports = app.exports.map((format) => exportLabels[format] || format.toUpperCase()).join(', ');
  const proof = `
<section class="fr-parity-proof" aria-labelledby="fr-parity-${escapeHtml(app.id)}">
  <div class="fr-parity-proof__inner">
    <div>
      <span class="fr-parity-proof__badge">Traitement local et privé</span>
      <h2 id="fr-parity-${escapeHtml(app.id)}">Vérifier le résultat avant de le partager</h2>
      <p>${escapeHtml(consent)}</p>
      <p>${escapeHtml(sensitive)}</p>
    </div>
    <div>
      <h3>Contrat de sortie</h3>
      <ul>
        <li>Formats prévus : ${escapeHtml(exports || 'aucun fichier')}</li>
        <li>Source fonctionnelle : <a href="${escapeHtml(app.englishRoute)}" hreflang="en">outil anglais accepté</a></li>
        <li>Revue de parité : 28 juillet 2026</li>
      </ul>
    </div>
  </div>
</section>`;
  return html.replace(/<afro-footer\b/i, `${proof}\n<afro-footer`);
}

function replaceDocumentRoutes(html, allRoutes) {
  let output = html;
  const entries = Object.entries(allRoutes).sort((a, b) => b[0].length - a[0].length);
  for (const [english, french] of entries) {
    const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    output = output.replace(new RegExp(`(["'(=])${escaped}(?=["')?#\\s<])`, 'g'), `$1${french}`);
  }
  return output;
}

function absolutizeRelativeAssets(html, englishRoute) {
  const assetTags = '(?:script|link|img|source|video|audio)';
  return html.replace(
    new RegExp(`(<${assetTags}\\b[^>]*?\\s(?:src|href)=)(["'])(?![a-z]+:|//|/|#)([^"']+)(\\2)`, 'gi'),
    (match, prefix, quote, asset) => {
      try {
        const resolved = new URL(asset, `https://afrotools.com${englishRoute}`).pathname;
        return `${prefix}${quote}${resolved}${quote}`;
      } catch {
        return match;
      }
    }
  );
}

function replaceHead(html, app, route, options) {
  const canonicalUrl = `https://afrotools.com${route}`;
  let output = html
    .replace(/<html\b([^>]*)\blang=["'][^"']*["']([^>]*)>/i, '<html$1lang="fr"$2>')
    .replace(/<html(?![^>]*\blang=)([^>]*)>/i, '<html lang="fr"$1>')
    .replace(/<meta\s+name=["']content-language["'][^>]*>/i, '<meta name="content-language" content="fr">')
    .replace(/<meta\s+property=["']og:locale["'][^>]*>/i, '<meta property="og:locale" content="fr_FR">');
  output = replaceMeta(output, 'title', options.workspace ? `${app.name} — espace de travail | AfroTools` : app.title);
  output = replaceMeta(output, 'description', app.description);
  output = replaceMeta(output, 'content-language', 'fr');
  output = replaceMeta(output, 'og:title', app.name);
  output = replaceMeta(output, 'og:description', app.description);
  output = replaceMeta(output, 'og:url', canonicalUrl);
  output = replaceLink(output, 'canonical', canonicalUrl);
  const verifiedSiblingAlternates = [...output.matchAll(
    /<link\s+rel=["']alternate["'][^>]*\bhreflang=["']([^"']+)["'][^>]*>/gi
  )]
    .filter((match) => !/^(?:en|fr|x-default)$/i.test(match[1]))
    .map((match) => match[0]);
  output = removeOldAlternates(output);
  const alternates = options.workspace
    ? ''
    : [
        `<link rel="alternate" hreflang="en" href="https://afrotools.com${app.englishRoute}">`,
        `<link rel="alternate" hreflang="fr" href="${canonicalUrl}">`,
        ...verifiedSiblingAlternates,
        `<link rel="alternate" hreflang="x-default" href="https://afrotools.com${app.englishRoute}">`
      ].join('\n');
  if (options.workspace) output = replaceMeta(output, 'robots', 'noindex, follow');
  return output.replace('</head>', `${alternates}\n</head>`);
}

function transform(source, app, config, lexicon, artwork, options = {}) {
  const route = options.workspace ? app.frenchWorkspaceRoute : app.frenchRoute;
  const canonicalUrl = `https://afrotools.com${route}`;
  const allRoutes = routeMap(config);
  const routeExact = lexicon.routes[app.id] || {};
  const artworkRow = artwork.rows.find((row) => row.id === app.id);
  const artworkUrl = artworkRow ? `https://afrotools.com${artworkRow.asset}` : '';
  let html = absolutizeRelativeAssets(source, options.workspace
    ? `${app.englishRoute.replace(/\/$/, '')}/`
    : app.englishRoute);
  // Inline lazy loaders keep relative asset URLs inside JavaScript strings, which
  // HTML URL normalization cannot see. Localized routes are one directory deeper,
  // so make vendor runtime assets root-relative at the locale build owner.
  html = html.replace(/(["'])(?:\.\.\/)+assets\/vendor\//g, '$1/assets/vendor/');
  html = replaceHead(html, app, route, options);
  if (artworkUrl) {
    html = replaceMeta(html, 'og:image', artworkUrl);
    html = replaceMeta(html, 'og:image:alt', app.name);
    html = replaceMeta(html, 'twitter:image', artworkUrl);
  }
  html = replaceDocumentRoutes(html, allRoutes);
  html = localizeSchemas(html, app, canonicalUrl, allRoutes, config.apps, routeExact, artworkUrl);
  html = translateMarkup(html, routeExact);
  html = localizeRouteOwnedRuntimeLiterals(html, app);
  html = html.replace(/<body\b([^>]*)>/i, (match, attrs) => {
    if (/class=["'][^"']*fr-document-pdf-native/.test(match)) return match;
    if (/class=["']/.test(match)) return match.replace(/class=(["'])/, 'class=$1fr-document-pdf-native ');
    return `<body class="fr-document-pdf-native"${attrs}>`;
  });
  if (!options.workspace) {
    html = html.replace(/<h1\b([^>]*)>[\s\S]*?<\/h1>/i, `<h1$1>${escapeHtml(app.name)}</h1>`);
    html = html.replace(
      /(<h1\b[^>]*>[\s\S]*?<\/h1>\s*<p\b[^>]*>)[\s\S]*?(<\/p>)/i,
      `$1${escapeHtml(app.description)}$2`
    );
    html = addProof(html, app);
  }
  html = rewriteLocalizedCvRuntime(html, app);
  html = rewriteLocalizedPageRuntime(html, app);
  html = addRuntime(html, app, allRoutes, routeExact);
  html = placeRouteLinksLast(html);
  return html.replace(/\r?\n/g, '\n');
}

function normalizeExisting(source, app, config, lexicon, artwork) {
  const allRoutes = routeMap(config);
  const canonicalUrl = `https://afrotools.com${app.frenchRoute}`;
  const routeExact = lexicon.routes[app.id] || {};
  const artworkRow = artwork.rows.find((row) => row.id === app.id);
  const artworkUrl = artworkRow ? `https://afrotools.com${artworkRow.asset}` : '';
  let html = localizeSchemas(source, app, canonicalUrl, allRoutes, config.apps, routeExact, artworkUrl);
  if (artworkUrl) {
    html = replaceMeta(html, 'og:image', artworkUrl);
    html = replaceMeta(html, 'og:image:alt', app.name);
    html = replaceMeta(html, 'twitter:image', artworkUrl);
  }
  if (app.id === 'document-pdf') {
    html = html.replace(
      /<a\s+href=["']\/document-pdf\/["']>Ouvrir l['’]outil complet<\/a>/i,
      '<a href="/fr/tools/espace-pdf/">Ouvrir l’espace PDF</a>'
    );
  }
  if (!/<meta\s+name=["']content-language["']/i.test(html)) {
    html = html.replace('</head>', '<meta name="content-language" content="fr">\n</head>');
  }
  html = html.replace(/<body\b([^>]*)>/i, (match, attrs) => {
    if (/class=["'][^"']*fr-document-pdf-native/.test(match)) return match;
    if (/class=["']/.test(match)) return match.replace(/class=(["'])/, 'class=$1fr-document-pdf-native ');
    return `<body class="fr-document-pdf-native"${attrs}>`;
  });
  html = rewriteLocalizedCvRuntime(html, app);
  html = rewriteLocalizedPageRuntime(html, app);
  html = addRuntime(html, app, allRoutes, routeExact);
  return html.replace(/\r?\n/g, '\n');
}

function ensureDirectory(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function writeOrCheck(relativeFile, output, changed) {
  const file = path.join(ROOT, relativeFile);
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\r?\n/g, '\n') : null;
  if (current === output) return;
  changed.push(relativeFile);
  if (WRITE) {
    ensureDirectory(file);
    fs.writeFileSync(file, output, 'utf8');
  }
}

function validateConfig(config) {
  const directoryRows = readJson(DIRECTORY_PATH).filter((row) => row.category_key === 'document-pdf');
  const freeRows = directoryRows.filter((row) => row.url !== '/pro/');
  if (config.apps.length !== 32 || freeRows.length !== 32) {
    throw new Error(`Document/PDF denominator mismatch: config=${config.apps.length}, directory=${freeRows.length}`);
  }
  const expected = new Set(freeRows.map((row) => row.id));
  const actual = new Set(config.apps.map((app) => app.id));
  const missing = [...expected].filter((id) => !actual.has(id));
  const extra = [...actual].filter((id) => !expected.has(id));
  if (missing.length || extra.length || actual.size !== config.apps.length) {
    throw new Error(`Config ids do not reconcile. Missing: ${missing.join(', ') || 'none'}; extra/duplicate: ${extra.join(', ') || 'none'}`);
  }
}

function main() {
  const config = readJson(CONFIG_PATH);
  const lexicon = readJson(LEXICON_PATH);
  const artwork = readJson(ARTWORK_PATH);
  validateConfig(config);
  const changed = [];
  for (const app of config.apps) {
    const englishFile = path.join(ROOT, app.englishFile);
    if (!fs.existsSync(englishFile)) throw new Error(`Missing English owner: ${app.englishFile}`);
    if (!app.preserveExisting) {
      const source = fs.readFileSync(englishFile, 'utf8');
      writeOrCheck(app.frenchFile, transform(source, app, config, lexicon, artwork), changed);
    } else {
      const existingSource = fs.readFileSync(path.join(ROOT, app.frenchFile), 'utf8');
      writeOrCheck(app.frenchFile, normalizeExisting(existingSource, app, config, lexicon, artwork), changed);
    }
    if (app.englishWorkspaceFile && app.frenchWorkspaceFile) {
      const workspaceSource = fs.readFileSync(path.join(ROOT, app.englishWorkspaceFile), 'utf8');
      writeOrCheck(app.frenchWorkspaceFile, transform(workspaceSource, app, config, lexicon, artwork, { workspace: true }), changed);
    }
  }
  if (CHECK && changed.length) {
    console.error(`French Document/PDF parity output is stale (${changed.length} file(s)):\n${changed.join('\n')}`);
    process.exitCode = 1;
    return;
  }
  console.log(`${WRITE ? 'Built' : 'Checked'} French Document/PDF parity: 32 rows, ${changed.length} ${WRITE ? 'updated' : 'stale'} file(s).`);
}

main();
