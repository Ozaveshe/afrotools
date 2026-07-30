"use strict";

const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const {
  VISIBLE_LANGUAGE_TRANSFORMS,
  localizeVisibleLanguage,
} = require("./lib/french-visible-language");

const ROOT = path.resolve(__dirname, "..");
const OWNERS = Object.freeze([
  ["african-palette", "palette-couleurs-africaines"],
  ["book-publishing-cost", "cout-publication-livre"],
  ["engagement-rate", "taux-engagement"],
  ["linkedin-optimizer", "optimiseur-linkedin"],
  ["music-royalty-splitter", "partage-redevances-musicales"],
  ["personal-brand-audit", "audit-marque-personnelle"],
  ["photography-pricing", "prix-seance-photo"],
  ["podcast-monetization", "monetisation-podcast"],
  ["self-publishing-royalty", "calculateur-de-droits-d-autoedition"],
  ["social-media-calendar", "calendrier-medias-sociaux"],
  ["wedding-photo-package", "forfait-photo-mariage"],
]);

const MISSING_META = Object.freeze({
  "social-media-calendar": {
    slug: "calendrier-medias-sociaux",
    title: "Calendrier éditorial réseaux sociaux Afrique | AfroTools",
    name: "Calendrier éditorial pour réseaux sociaux",
    description:
      "Créez un calendrier éditorial mensuel en français avec thèmes, fréquence, horaires africains et modèles de légendes.",
  },
  "wedding-photo-package": {
    slug: "forfait-photo-mariage",
    title: "Créateur de forfait photo mariage Afrique | AfroTools",
    name: "Créateur de forfait photo de mariage",
    description:
      "Composez un forfait photo de mariage en français avec durée, expérience, options, acompte et comparaison de prix locale.",
  },
});

const COMMON_TERMS = Object.freeze([
  ["Planning estimate only", "Estimation de planification uniquement"],
  ["Book Details", "Détails du livre"],
  ["Book Type", "Type de livre"],
  ["Word Count", "Nombre de mots"],
  ["Publishing Route", "Mode de publication"],
  ["Retail Price", "Prix de vente"],
  ["Monthly Sales Estimate", "Ventes mensuelles estimées"],
  ["Publishing Costs", "Coûts de publication"],
  ["Developmental Editing", "Révision structurelle"],
  ["Copy Editing", "Révision éditoriale"],
  ["Proofreading", "Relecture"],
  ["Cover Design", "Conception de couverture"],
  ["Interior Layout", "Mise en page intérieure"],
  ["Print Quantity", "Quantité imprimée"],
  ["Print Cost per Copy", "Coût d'impression par exemplaire"],
  ["Calculate Publishing Costs", "Calculer les coûts de publication"],
  ["Total Publishing Budget", "Budget total de publication"],
  ["Break-Even Sales", "Ventes au seuil de rentabilité"],
  ["Royalty Comparison", "Comparaison des redevances"],
  ["Platform", "Plateforme"],
  ["Royalty Rate", "Taux de redevance"],
  ["Per Copy", "Par exemplaire"],
  ["3-Year Earnings Projection", "Projection des revenus sur 3 ans"],
  ["Year", "Année"],
  ["Copies Sold", "Exemplaires vendus"],
  ["Gross Revenue", "Revenu brut"],
  ["Publishing Cost", "Coût de publication"],
  ["Net Earnings", "Revenu net"],
  ["Recommended Price", "Prix recommandé"],
  ["Market range", "Fourchette du marché"],
  ["Effective Hourly Rate", "Taux horaire effectif"],
  ["Base Price", "Prix de base"],
  ["Before adjustments", "Avant ajustements"],
  ["Size Factor", "Facteur de format"],
  ["Rights Premium", "Majoration des droits"],
  ["Suggested Price", "Prix suggéré"],
  ["Platform Fee", "Commission de plateforme"],
  ["You Earn", "Votre revenu"],
  ["Session Details", "Détails de la séance"],
  ["Experience Level", "Niveau d'expérience"],
  ["Equipment Level", "Niveau d'équipement"],
  ["Shoot Hours", "Heures de prise de vue"],
  ["Editing Hours", "Heures de retouche"],
  ["Studio Rent", "Location du studio"],
  ["Work Days", "Jours travaillés"],
  ["Equipment Value", "Valeur du matériel"],
  ["Prints / Album", "Tirages ou album"],
  ["Calculate Session Price", "Calculer le prix de la séance"],
  ["Session Price", "Prix de la séance"],
  ["Annual Income", "Revenu annuel"],
  ["Daily Overhead", "Frais généraux journaliers"],
  ["Session Hours", "Heures par séance"],
  ["Hourly Rate", "Taux horaire"],
  ["Profit Margin", "Marge bénéficiaire"],
  ["Podcast Details", "Détails du podcast"],
  ["Monthly Downloads", "Téléchargements mensuels"],
  ["Episodes per Month", "Épisodes par mois"],
  ["Audience Location", "Localisation de l'audience"],
  ["Podcast Niche", "Thématique du podcast"],
  ["Paying Supporters", "Soutiens payants"],
  ["Support per Patron", "Contribution par soutien"],
  ["Calculate Podcast Revenue", "Calculer les revenus du podcast"],
  ["Monthly Revenue Potential", "Revenu mensuel potentiel"],
  ["Annual Revenue", "Revenu annuel"],
  ["Ad Revenue", "Revenus publicitaires"],
  ["Sponsorships", "Parrainages"],
  ["Downloads/Episode", "Téléchargements par épisode"],
  ["Revenue Stream", "Source de revenus"],
  ["Monthly", "Mensuel"],
  ["Annual", "Annuel"],
  ["Status", "Statut"],
  ["Monetization Unlocks", "Paliers de monétisation"],
  ["Book Price", "Prix du livre"],
  ["Book Format", "Format du livre"],
  ["Page Count", "Nombre de pages"],
  ["Compare Platform Royalties", "Comparer les redevances"],
  ["Best Monthly Royalty", "Meilleure redevance mensuelle"],
  ["Best", "Meilleur choix"],
  ["Sweet Spot Analysis", "Analyse du prix optimal"],
  ["Song Details", "Détails du morceau"],
  ["Song Title", "Titre du morceau"],
  ["Total Royalties", "Redevances totales"],
  ["Royalty Period", "Période des redevances"],
  ["Collaborators", "Collaborateurs"],
  ["Add Collaborator", "Ajouter un collaborateur"],
  ["Calculate Royalty Splits", "Calculer le partage des redevances"],
  ["Name", "Nom"],
  ["Role", "Rôle"],
  ["Split", "Part"],
  ["Remove", "Supprimer"],
  ["Profile Details", "Détails du profil"],
  ["Calculate Brand Score", "Calculer le score de marque"],
  ["Profile Score", "Score du profil"],
  ["Calculate Engagement Rate", "Calculer le taux d'engagement"],
  ["Optimise My Profile", "Optimiser mon profil"],
  ["Generate", "Générer"],
  ["Requires", "Nécessite"],
  ["Not yet unlocked", "Pas encore débloqué"],
  ["Unlocked", "Débloqué"],
  ["Social Media Content Calendar Generator", "Générateur de calendrier éditorial"],
  ["Social Media Calendar", "Calendrier éditorial"],
  ["Generate 30-Day Content Calendar", "Générer le calendrier de 30 jours"],
  ["Content Niche", "Secteur de contenu"],
  ["Primary Platform", "Plateforme principale"],
  ["Posting Frequency", "Fréquence de publication"],
  ["Timezone", "Fuseau horaire"],
  ["Start Month", "Mois de départ"],
  ["Total Posts", "Nombre total de publications"],
  ["Caption Templates", "Modèles de légendes"],
  ["Wedding Photography Package Builder", "Créateur de forfait photo de mariage"],
  ["Wedding Photo Package", "Forfait photo de mariage"],
  ["Build Package Quote", "Créer le devis du forfait"],
  ["Coverage Hours", "Heures de couverture"],
  ["Photographer Experience", "Expérience du photographe"],
  ["Package Add-Ons", "Options du forfait"],
  ["Total Package", "Total du forfait"],
  ["Deposit", "Acompte"],
  ["Contract Checklist", "Liste de contrôle du contrat"],
]);

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SIMPLE_VISIBLE_LANGUAGE_TRANSFORMS = Object.freeze([
  ...COMMON_TERMS
    .slice()
    .sort((left, right) => right[0].length - left[0].length)
    .map(([source, target]) => [new RegExp(escapePattern(source), "g"), target]),
  ...VISIBLE_LANGUAGE_TRANSFORMS,
]);

const NATIVE_REFLOW_CSS =
  ".fr-tool-shell h1{overflow-wrap:anywhere}" +
  "#tool-mount .en-tool-layout,#tool-mount .en-tool-layout-wide,#tool-mount .en-card,#tool-mount .en-results{min-width:0;max-width:100%}" +
  "#tool-mount .en-results-hero,#tool-mount .en-results-hero-inner,#tool-mount .en-results-hero-grid,#tool-mount .en-card-title{min-width:0;max-width:100%;overflow-wrap:anywhere}" +
  "#tool-mount [style*=\"margin-left:auto\"]{min-width:0;overflow-wrap:anywhere}" +
  "#tool-mount #monetization>div{flex-wrap:wrap;gap:8px}" +
  "#tool-mount td,#tool-mount th{overflow-wrap:anywhere}" +
  "@media(max-width:480px){afro-site-assistant span{max-width:calc(100vw - 32px)!important;overflow-wrap:anywhere}}";

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readFoundation(relativePath) {
  try {
    return childProcess.execFileSync(
      "git",
      [
        "show",
        `8ce5cac175e42201968b1f7540752d6acf92d4ca:${relativePath.replace(/\\/g, "/")}`,
      ],
      {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
        stdio: ["ignore", "pipe", "ignore"],
      }
    );
  } catch {
    return null;
  }
}

function write(relativePath, value) {
  fs.mkdirSync(path.dirname(path.join(ROOT, relativePath)), {
    recursive: true,
  });
  fs.writeFileSync(path.join(ROOT, relativePath), value);
}

function ensureRouteRealProofAssets(html) {
  let next = html;
  if (!next.includes("/assets/css/fr-creative-route-real-proof.css")) {
    next = next.replace(
      "</head>",
      '  <link rel="stylesheet" href="/assets/css/fr-creative-route-real-proof.css">\n</head>'
    );
  }
  if (!next.includes("/assets/js/pages/creative/fr-creative-route-real-reflow.js")) {
    next = next.replace(
      "</body>",
      '  <script src="/assets/js/pages/creative/fr-creative-route-real-reflow.js" defer></script>\n</body>'
    );
  }
  return next;
}

function extractLayout(html, id) {
  const regularStart = html.indexOf('<div class="en-tool-layout">');
  const wideStart = html.indexOf('<div class="en-tool-layout-wide">');
  const start =
    regularStart < 0
      ? wideStart
      : wideStart < 0
        ? regularStart
        : Math.min(regularStart, wideStart);
  const end = html.indexOf('<section class="df-upgrade"', start);
  if (start < 0 || end < 0) {
    throw new Error(`${id}: English tool layout boundary not found`);
  }
  return html.slice(start, end).trim();
}

function missingShell(id, meta) {
  const canonical = `https://afrotools.com/fr/tools/${meta.slug}/`;
  const english = `https://afrotools.com/tools/${id}/`;
  const terms = JSON.stringify(COMMON_TERMS);
  return `<!DOCTYPE html>
<!-- Native French Creative Economy owner. -->
<html data-chat-bundle="/assets/js/bundles/chat.88bd45ff.min.js" lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="afrotools-content-id" content="fr-creative:${id}">
  <meta name="afrotools-source-owner" content="scripts/build-fr-creative-simple-native.js">
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${meta.title}">
  <meta property="og:description" content="${meta.description}">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/${id}.webp">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${meta.title}">
  <meta name="twitter:description" content="${meta.description}">
  <meta name="twitter:image" content="https://afrotools.com/assets/img/tools/${id}.webp">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="en" href="${english}">
  <link rel="alternate" hreflang="fr" href="${canonical}">
  <link rel="alternate" hreflang="x-default" href="${english}">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc">
  <style>
    .fr-tool-shell{max-width:1120px;margin:0 auto;padding:92px 20px 58px}
    .breadcrumb{font-size:.92rem;color:#64748b;margin-bottom:18px}.breadcrumb a{color:#2563eb;text-decoration:none}
    .eyebrow{font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;margin-bottom:10px}
    h1{font-size:clamp(2rem,5vw,3.35rem);line-height:1.06;margin:0 0 16px;color:#0f172a}
    .lead{max-width:790px;color:#475569;font-size:1.08rem;line-height:1.7;margin:0 0 24px}
    .route-note{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 24px}.route-note span{border:1px solid #dbe4ef;border-radius:999px;padding:7px 11px;background:#f8fafc;color:#334155;font-size:.86rem}
    #tool-mount{background:#fff;border:1px solid #dbe4ef;border-radius:8px;padding:18px;box-shadow:0 10px 28px rgba(15,23,42,.08);overflow:hidden}
    .support-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:26px}.support-grid section{border:1px solid #dbe4ef;border-radius:8px;padding:18px;background:#fff}.support-grid h2{font-size:1rem;margin:0 0 8px;color:#111827}.support-grid p{margin:0;color:#475569;line-height:1.55;font-size:.94rem}
    @media (max-width:760px){.fr-tool-shell{padding-top:76px}.support-grid{grid-template-columns:1fr}#tool-mount{padding:12px}}
  </style>
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: meta.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "fr",
    url: canonical,
    description: meta.description,
    isBasedOn: english,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    provider: {
      "@type": "Organization",
      name: "AfroTools",
      url: "https://afrotools.com",
    },
    image: `https://afrotools.com/assets/img/tools/${id}.webp`,
  })}</script>
</head>
<body>
  <div id="navbar"></div>
  <main class="fr-tool-shell">
    <nav class="breadcrumb"><a href="/fr/">Accueil</a> &gt; <a href="/fr/all-tools/">Outils</a> &gt; ${meta.name}</nav>
    <p class="eyebrow">Économie créative</p>
    <h1>${meta.name}</h1>
    <p class="lead">${meta.description}</p>
    <div class="route-note"><span>Interface en français</span><span>Calcul local dans votre navigateur</span><span>Estimation à vérifier localement</span></div>
    <div id="tool-mount" class="source-launch"></div>
    <div class="support-grid" data-tool-verification-panel>
      <section><h2>Confidentialité</h2><p>Vos saisies et calculs restent dans ce navigateur. Aucun compte ni envoi à un serveur n'est requis.</p></section>
      <section><h2>Méthode</h2><p>L'outil applique les mêmes règles déterministes que la version anglaise et expose ses hypothèses dans le résultat.</p></section>
      <section><h2>À vérifier</h2><p>Comparez le résultat avec les tarifs, contrats et exigences professionnelles de votre pays avant de l'utiliser.</p></section>
    </div>
  </main>
  <div id="footer"></div>
  <script src="/assets/js/components/navbar.min.js?v=65f906d7"></script>
  <script src="/assets/js/components/footer.min.js?v=fb81e3cd"></script>
  <script>
(function () {
  var terms = ${terms};
  terms.sort(function (a, b) { return b[0].length - a[0].length; });
  function swapText(value) {
    if (!value) return value;
    var next = value;
    terms.forEach(function (pair) { next = next.split(pair[0]).join(pair[1]); });
    return next;
  }
  function localize(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var parent = node.parentElement;
        if (parent && /^(script|style|code|pre)$/i.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var next = swapText(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    });
    root.querySelectorAll('[placeholder],[aria-label],[title],[alt],input[type="button"],input[type="submit"],button').forEach(function (el) {
      ['placeholder', 'aria-label', 'title', 'alt', 'value'].forEach(function (attr) {
        if (el.hasAttribute && el.hasAttribute(attr)) {
          var current = el.getAttribute(attr);
          var next = swapText(current);
          if (next !== current) el.setAttribute(attr, next);
        }
      });
    });
  }
  function watch(root) {
    localize(root);
    new MutationObserver(function () { localize(root); }).observe(root, { childList: true, subtree: true, characterData: true });
  }
  window.frToolGapLocalizer = { localize: localize, watch: watch };
})();
  </script>
  <script src="/assets/js/lazy-analytics.js?v=630f8a7d" defer></script>
</body>
</html>`;
}

function extendTerms(html) {
  let nextHtml = html.replace(/var terms = (\[\[[\s\S]*?\]\]);/, (whole, literal) => {
    const existing = JSON.parse(literal);
    const seen = new Set(existing.map((pair) => pair[0]));
    const terms = existing.concat(
      COMMON_TERMS.filter((pair) => !seen.has(pair[0]))
    );
    return `var terms = ${JSON.stringify(terms)};`;
  });
  if (!nextHtml.includes("terms.sort(function (a, b)")) {
    nextHtml = nextHtml.replace(
      /(var terms = \[\[[\s\S]*?\]\];)/,
      '$1\n  terms.sort(function (a, b) { return b[0].length - a[0].length; });'
    );
  }
  const helper = [
    "  function replaceTerm(value, source, target) {",
    "    var escaped = source.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');",
    "    if (/^[A-Za-z0-9]/.test(source) && /[A-Za-z0-9]$/.test(source)) {",
    "      return value.replace(new RegExp('\\\\b' + escaped + '\\\\b', 'g'), target);",
    "    }",
    "    return value.split(source).join(target);",
    "  }",
    "  function swapText(value) {",
  ].join("\n");
  if (nextHtml.includes("function replaceTerm(value, source, target)")) {
    nextHtml = nextHtml.replace(
      /  function replaceTerm\(value, source, target\) \{[\s\S]*?  function swapText\(value\) \{/,
      () => helper
    );
  } else {
    nextHtml = nextHtml.replace(
      "  function swapText(value) {",
      () => helper
    );
  }
  nextHtml = nextHtml.replace(
    "      next = next.split(pair[0]).join(pair[1]);",
    "      next = replaceTerm(next, pair[0], pair[1]);"
  );
  return nextHtml;
}

for (const [id, frSlug] of OWNERS) {
  const en = read(`tools/${id}/index.html`);
  const frFile = `fr/tools/${frSlug}/index.html`;
  let fr = readFoundation(frFile);
  if (!fr) {
    fr = missingShell(id, MISSING_META[id]);
  }
  const layout = localizeVisibleLanguage(
    extractLayout(en, id),
    SIMPLE_VISIBLE_LANGUAGE_TRANSFORMS
  );
  const mount = `<section id="tool-mount" data-fr-creative-native="${id}">\n${layout}\n</section>`;

  fr = fr
    .replace(
      "<!-- Generated by scripts/generate-fr-tool-gap-pages.js. Edit source data there. -->",
      `<!-- Native French Creative Economy owner. Shared controller: assets/js/pages/creative/${id}-controller.js. -->`
    )
    .replace(
      '<meta name="afrotools-source-owner" content="scripts/generate-fr-tool-gap-pages.js">',
      '<meta name="afrotools-source-owner" content="scripts/build-fr-creative-simple-native.js">'
    )
    .replace(
      /<div id="tool-mount" class="source-launch">[\s\S]*?<\/div>/,
      mount
    );

  if (!fr.includes("/assets/css/energy.css")) {
    fr = fr.replace(
      /(<link rel="stylesheet" href="\/assets\/css\/global\.min\.css[^>]*>)/,
      '$1\n  <link rel="stylesheet" href="/assets/css/energy.css?v=93e1c4c7">'
    );
  }
  if (!fr.includes(NATIVE_REFLOW_CSS)) {
    fr = fr.replace("</style>", `    ${NATIVE_REFLOW_CSS}\n  </style>`);
  }
  const controller = `/assets/js/pages/creative/${id}-controller.js`;
  const engine = `/engines/${id}-engine.js`;
  if (
    fs.existsSync(path.join(ROOT, "engines", `${id}-engine.js`)) &&
    !fr.includes(engine)
  ) {
    fr = fr.replace(
      `<script src="${controller}"></script>`,
      `<script src="${engine}"></script>\n<script src="${controller}"></script>`
    );
  }
  const resultTools = "/assets/js/pages/creative/creative-result-tools.js";
  const resultActions = "/assets/js/pages/creative/creative-result-actions.js";
  if (!fr.includes(resultTools)) {
    fr = fr.replace(
      `<script src="${controller}"></script>`,
      `<script src="${resultTools}"></script>\n<script src="${controller}"></script>`
    );
  }
  if (!fr.includes(resultActions)) {
    fr = fr.replace(
      `<script src="${controller}"></script>`,
      `<script src="${resultActions}"></script>\n<script src="${controller}"></script>`
    );
  }
  if (!fr.includes(controller)) {
    fr = fr.replace(
      /(\s*<script src="\/assets\/js\/lazy-analytics\.js[^>]*><\/script>)/,
      `\n<script src="${controller}"></script>$1`
    );
  }
  if (!fr.includes(resultTools)) {
    fr = fr.replace(
      `<script src="${controller}"></script>`,
      `<script src="${resultTools}"></script>\n<script src="${controller}"></script>`
    );
  }
  if (!fr.includes(resultActions)) {
    fr = fr.replace(
      `<script src="${controller}"></script>`,
      `<script src="${resultActions}"></script>\n<script src="${controller}"></script>`
    );
  }
  if (
    fs.existsSync(path.join(ROOT, "engines", `${id}-engine.js`)) &&
    !fr.includes(engine)
  ) {
    fr = fr.replace(
      `<script src="${controller}"></script>`,
      `<script src="${engine}"></script>\n<script src="${controller}"></script>`
    );
  }
  if (!fr.includes("frToolGapLocalizer.watch")) {
    fr = fr.replace(
      /(\s*<script src="\/assets\/js\/lazy-analytics\.js[^>]*><\/script>)/,
      '\n<script>if(window.frToolGapLocalizer){window.frToolGapLocalizer.watch(document.getElementById("tool-mount"));}</script>$1'
    );
  }
  fr = extendTerms(fr);
  if (
    id === "social-media-calendar" &&
    !fr.includes('hreflang="sw"')
  ) {
    fr = fr.replace(
      '<link rel="alternate" hreflang="x-default"',
      '<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/kalenda-ya-mitandao-ya-kijamii/">\n  <link rel="alternate" hreflang="x-default"'
    );
  }
  fr = ensureRouteRealProofAssets(fr);
  write(frFile, fr);
  console.log(id);
}
