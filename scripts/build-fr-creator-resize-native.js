const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const LOCALES = {
  en: {
    lang: 'en',
    canonical: 'https://afrotools.com/tools/creator-resize/app',
    alternate: 'https://afrotools.com/fr/tools/redimensionnement-pour-createur/app',
    launcher: '/tools/creator-resize/',
    title: 'ResizeKit — Private Social Image Resizer | AfroTools',
    description: 'Resize one local PNG, JPEG, or WebP into 12 social-media dimensions, review each crop, and export PNG files or a ZIP.',
    back: 'ResizeKit',
    fillMode: 'Fill mode',
    fillOptions: [
      ['blur', 'Blur fill'],
      ['solid', 'Sampled colour'],
      ['gradient', 'Sampled gradient'],
      ['extend', 'Edge stretch'],
      ['crop', 'Crop only']
    ],
    downloadAll: 'Download all (ZIP)',
    dropTitle: 'Drop your image here',
    dropSub: 'or choose a file · PNG, JPEG, WebP · maximum 10MB',
    fileLabel: 'Choose a local image',
    quickSizes: 'Quick sizes',
    presets: [
      ['all', 'All social'],
      ['instagram', 'Instagram only'],
      ['youtube', 'YouTube only'],
      ['x', 'X only'],
      ['custom', 'Custom selection']
    ],
    originalAlt: 'Original image selected for local resizing',
    focalInitial: 'Focal point: centre',
    reset: 'Reset focal point',
    newImage: 'New image',
    sizes: 'Sizes',
    sizeInitial: '12 sizes',
    fills: [
      ['blur', 'Blur'],
      ['solid', 'Colour'],
      ['gradient', 'Gradient'],
      ['extend', 'Stretch'],
      ['crop', 'Crop']
    ],
    ready: '12 sizes ready',
    chooseSizes: 'Sizes',
    modalClose: 'Close preview',
    modalDownload: 'Download PNG',
    privacy: 'Your image is decoded, resized, and packaged only in this browser. The workspace does not upload the file, send pixels to AI, or store the image on AfroTools servers.'
  },
  fr: {
    lang: 'fr',
    canonical: 'https://afrotools.com/fr/tools/redimensionnement-pour-createur/app',
    alternate: 'https://afrotools.com/tools/creator-resize/app',
    launcher: '/fr/tools/redimensionnement-pour-createur/',
    title: 'ResizeKit — Redimensionneur privé d’images sociales | AfroTools',
    description: 'Redimensionnez localement une image PNG, JPEG ou WebP en 12 formats sociaux, vérifiez chaque cadrage et exportez les PNG ou un ZIP.',
    back: 'ResizeKit',
    fillMode: 'Mode de remplissage',
    fillOptions: [
      ['blur', 'Fond flouté'],
      ['solid', 'Couleur échantillonnée'],
      ['gradient', 'Dégradé échantillonné'],
      ['extend', 'Étirement des bords'],
      ['crop', 'Recadrage seul']
    ],
    downloadAll: 'Tout télécharger (ZIP)',
    dropTitle: 'Déposez votre image ici',
    dropSub: 'ou choisissez un fichier · PNG, JPEG, WebP · 10 Mo maximum',
    fileLabel: 'Choisir une image locale',
    quickSizes: 'Formats rapides',
    presets: [
      ['all', 'Tous les réseaux'],
      ['instagram', 'Instagram seulement'],
      ['youtube', 'YouTube seulement'],
      ['x', 'X seulement'],
      ['custom', 'Sélection personnalisée']
    ],
    originalAlt: 'Image originale sélectionnée pour le redimensionnement local',
    focalInitial: 'Point focal : centre',
    reset: 'Recentrer le point focal',
    newImage: 'Nouvelle image',
    sizes: 'Formats',
    sizeInitial: '12 formats',
    fills: [
      ['blur', 'Flou'],
      ['solid', 'Couleur'],
      ['gradient', 'Dégradé'],
      ['extend', 'Étirement'],
      ['crop', 'Recadrage']
    ],
    ready: '12 formats prêts',
    chooseSizes: 'Formats',
    modalClose: 'Fermer l’aperçu',
    modalDownload: 'Télécharger le PNG',
    privacy: 'Votre image est décodée, redimensionnée et placée dans le ZIP uniquement dans ce navigateur. Cet espace n’envoie pas le fichier à AfroTools ou à une IA et ne stocke pas ses pixels sur un serveur.'
  }
};

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function options(items) {
  return items.map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join('');
}

function buttons(items, className, dataName) {
  return items.map(([value, label], index) => `<button type="button" class="${className}${index === 0 ? ' active' : ''}" data-${dataName}="${esc(value)}" aria-pressed="${index === 0 ? 'true' : 'false'}">${esc(label)}</button>`).join('');
}

function workspace(locale) {
  const c = LOCALES[locale];
  const enUrl = locale === 'en' ? c.canonical : c.alternate;
  const frUrl = locale === 'fr' ? c.canonical : c.alternate;
  return `<!DOCTYPE html>
<html lang="${c.lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(c.title)}</title>
  <meta name="description" content="${esc(c.description)}">
  <meta name="robots" content="noindex, follow">
  <meta property="og:title" content="${esc(c.title)}">
  <meta property="og:description" content="${esc(c.description)}">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/creator-resize.webp">
  <meta property="og:url" content="${c.canonical}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${locale === 'fr' ? 'fr_FR' : 'en_US'}">
  <link rel="canonical" href="${c.canonical}">
  <link rel="alternate" hreflang="en" href="${enUrl}">
  <link rel="alternate" hreflang="fr" href="${frUrl}">
  <link rel="alternate" hreflang="x-default" href="${enUrl}">
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=f987f2a8">
  <link rel="stylesheet" href="/tools/creator-resize/style.css?v=d148ead3">
  <link rel="stylesheet" href="/assets/css/creator-resize-parity.css">
  <script>(function(){try{var t=localStorage.getItem('aft_theme');var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var a=(t==='dark'||t==='light')?t:(d?'dark':'light');document.documentElement.setAttribute('data-theme',a);document.documentElement.setAttribute('data-theme-choice',(t==='dark'||t==='light')?t:'auto');document.documentElement.style.colorScheme=a;}catch(_){}})();</script>
  <script src="/assets/vendor/jszip/jszip.min.js" defer></script>
  <script src="/engines/creator-resize-engine.js" defer></script>
</head>
<body>
  <main class="crz-app" id="crzApp">
    <header class="crz-app-header">
      <a href="${c.launcher}" class="crz-app-logo"><span aria-hidden="true">✂</span> ${esc(c.back)}</a>
      <div class="crz-header-actions">
        <label class="crz-sr-only" for="crzFillSelect">${esc(c.fillMode)}</label>
        <select id="crzFillSelect" class="crz-btn crz-btn-secondary crz-btn-sm" title="${esc(c.fillMode)}" aria-label="${esc(c.fillMode)}">${options(c.fillOptions)}</select>
        <button type="button" id="crzDownloadAll" class="crz-btn crz-btn-primary crz-btn-sm" disabled>↓ ${esc(c.downloadAll)}</button>
      </div>
    </header>

    <section class="crz-upload-state" id="crzUploadState" aria-labelledby="crzDropTitle">
      <div class="crz-upload-card">
        <div class="crz-drop-zone" id="crzDropZone" role="button" tabindex="0" aria-describedby="crzDropHelp">
          <div class="crz-drop-icon" aria-hidden="true">📷</div>
          <div class="crz-drop-title" id="crzDropTitle">${esc(c.dropTitle)}</div>
          <div class="crz-drop-sub" id="crzDropHelp">${esc(c.dropSub)}</div>
          <input type="file" id="crzFileInput" accept="image/png,image/jpeg,image/webp" aria-label="${esc(c.fileLabel)}" hidden>
        </div>
        <p class="crz-privacy">${esc(c.privacy)}</p>
      </div>
    </section>

    <section class="crz-editor" id="crzEditor" style="display:none" aria-label="${esc(c.sizes)}">
      <div class="crz-editor-left">
        <div class="crz-original-wrap" id="crzOriginalWrap">
          <img id="crzOriginalImg" class="crz-original-img" alt="${esc(c.originalAlt)}">
          <div class="crz-focal-marker" id="crzFocalMarker" aria-hidden="true"><div class="crz-focal-ring"></div></div>
        </div>
        <div class="crz-focal-info">
          <span id="crzFocalLabel" aria-live="polite">${esc(c.focalInitial)}</span>
          <button type="button" id="crzFocalReset">${esc(c.reset)}</button>
          <button type="button" id="crzNewImage">${esc(c.newImage)}</button>
        </div>
      </div>
      <aside class="crz-sidebar">
        <div class="crz-sidebar-header">
          <div class="crz-sidebar-title">${esc(c.sizes)}</div>
          <div class="crz-sidebar-count" id="crzSizeCount" aria-live="polite">${esc(c.sizeInitial)}</div>
        </div>
        <div class="crz-presets" aria-label="${esc(c.quickSizes)}">
          <div class="crz-preset-label">${esc(c.quickSizes)}</div>
          ${buttons(c.presets, 'crz-preset-btn', 'preset')}
        </div>
        <div class="crz-fill-bar" aria-label="${esc(c.fillMode)}">
          ${buttons(c.fills, 'crz-fill-btn', 'fill')}
        </div>
        <div class="crz-size-grid" id="crzSizeGrid"></div>
      </aside>
    </section>

    <div class="crz-bottom-bar" id="crzBottomBar" style="display:none">
      <div class="crz-bottom-info" id="crzBottomInfo" aria-live="polite">${esc(c.ready)}</div>
      <div class="crz-bottom-actions">
        <button type="button" class="crz-btn crz-btn-primary crz-btn-sm" id="crzDownloadAllBottom">↓ ${esc(c.downloadAll)}</button>
      </div>
    </div>

    <div class="crz-modal-backdrop" id="crzModal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="crzModalLabel">
      <div class="crz-modal-content">
        <button type="button" class="crz-modal-close" id="crzModalClose" aria-label="${esc(c.modalClose)}">×</button>
        <canvas id="crzModalCanvas"></canvas>
        <div class="crz-modal-info">
          <div><div class="crz-modal-label" id="crzModalLabel"></div><div class="crz-modal-dims" id="crzModalDims"></div></div>
          <button type="button" class="crz-btn crz-btn-primary crz-btn-sm" id="crzModalDownload">↓ ${esc(c.modalDownload)}</button>
        </div>
      </div>
    </div>

    <div class="crz-toast" id="crzToast" role="status" aria-live="polite"></div>
  </main>
</body>
</html>
`;
}

function frenchLauncher() {
  const title = 'Redimensionner une image pour les réseaux sociaux | AfroTools';
  const description = 'Transformez localement une image en 12 formats pour Instagram, YouTube, X, LinkedIn, Facebook, Pinterest et WhatsApp, puis exportez les PNG ou un ZIP.';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ResizeKit — Redimensionneur d’images sociales',
    description,
    url: 'https://afrotools.com/fr/tools/redimensionnement-pour-createur/',
    inLanguage: 'fr',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    browserRequirements: 'JavaScript et Canvas HTML5',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    image: 'https://afrotools.com/assets/img/tools/creator-resize.webp',
    author: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' }
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'AfroTools', item: 'https://afrotools.com/fr/' },
      { '@type': 'ListItem', position: 2, name: 'Outils créatifs', item: 'https://afrotools.com/fr/creative/' },
      { '@type': 'ListItem', position: 3, name: 'Redimensionnement pour créateur', item: 'https://afrotools.com/fr/tools/redimensionnement-pour-createur/' }
    ]
  };
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/creator-resize.webp">
  <meta property="og:url" content="https://afrotools.com/fr/tools/redimensionnement-pour-createur/">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <link rel="canonical" href="https://afrotools.com/fr/tools/redimensionnement-pour-createur/">
  <link rel="alternate" hreflang="en" href="https://afrotools.com/tools/creator-resize/">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/redimensionnement-pour-createur/">
  <link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/resize-ya-mtayarishi/">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/creator-resize/">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc">
  <link rel="stylesheet" href="/assets/css/creator-resize-parity.css">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
  <script>(function(){try{var t=localStorage.getItem('aft_theme');var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var a=(t==='dark'||t==='light')?t:(d?'dark':'light');document.documentElement.setAttribute('data-theme',a);document.documentElement.style.colorScheme=a;}catch(_){}})();</script>
</head>
<body class="crz-native-launcher">
  <afro-navbar></afro-navbar>
  <main class="crz-launch-shell">
    <section class="crz-launch-hero">
      <div>
        <p class="crz-launch-eyebrow">Studio créatif · Traitement local</p>
        <h1>Une image, douze formats sociaux</h1>
        <p class="crz-launch-lead">Choisissez un PNG, JPEG ou WebP, placez manuellement le point focal, comparez cinq traitements de cadrage et téléchargez chaque PNG ou l’ensemble dans un ZIP.</p>
        <div class="crz-launch-actions">
          <a class="crz-launch-primary" href="/fr/tools/redimensionnement-pour-createur/app">Redimensionner mon image</a>
          <a class="crz-launch-secondary" href="/tools/creator-resize/">English version</a>
        </div>
      </div>
      <img class="crz-launch-art" src="/assets/img/tools/creator-resize.webp" alt="Aperçu de ResizeKit pour les formats des réseaux sociaux" width="600" height="400">
    </section>

    <div class="crz-launch-grid">
      <section class="crz-launch-card">
        <h2>12 dimensions vérifiables</h2>
        <p>Instagram carré, portrait et story ; publication et bannière X ; miniature et bannière YouTube ; LinkedIn, Facebook, Pinterest et statut WhatsApp.</p>
      </section>
      <section class="crz-launch-card">
        <h2>Cadrage sous votre contrôle</h2>
        <p>Le point focal est manuel : cliquez sur le visage, le produit ou le texte à préserver. Aucun modèle d’IA ne choisit le cadrage à votre place.</p>
      </section>
      <section class="crz-launch-card">
        <h2>Exports locaux</h2>
        <p>Prévisualisez les formats, téléchargez un PNG individuel ou créez un ZIP. Vérifiez toujours les exigences actuelles de la plateforme avant publication.</p>
      </section>
    </div>

    <section class="crz-launch-card" style="margin-top:18px">
      <h2>Modes de remplissage</h2>
      <ul>
        <li>Fond flouté, couleur ou dégradé échantillonné depuis l’image.</li>
        <li>Étirement des bords pour remplir le cadre.</li>
        <li>Recadrage seul autour du point focal manuel.</li>
        <li>Préréglages par plateforme ou sélection personnalisée.</li>
      </ul>
    </section>

    <p class="crz-launch-privacy"><strong>Confidentialité :</strong> l’espace de travail décode et transforme l’image dans votre navigateur. Le fichier et ses pixels ne sont envoyés ni à AfroTools, ni à une IA, ni à un serveur. Le ZIP utilise une bibliothèque servie localement par AfroTools.</p>
  </main>
  <afro-footer></afro-footer>
  <script src="/assets/js/components/navbar.min.js?v=65f906d7" defer></script>
  <script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script>
</body>
</html>
`;
}

function write(relativePath, content) {
  const target = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
  process.stdout.write(`WROTE ${relativePath}\n`);
}

write('tools/creator-resize/app.html', workspace('en'));
write('fr/tools/redimensionnement-pour-createur/app.html', workspace('fr'));
write('fr/tools/redimensionnement-pour-createur/index.html', frenchLauncher());
