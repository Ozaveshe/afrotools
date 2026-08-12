"use strict";

const fs = require("fs");
const path = require("path");
const { SPORTS } = require("./lib/fr-sports-contracts.js");
const { enhanceCategory } = require("./lib/localized-category-standard.js");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://afrotools.com";
const LOCALE_COVERAGE = require("../data/registry/locale-page-coverage.json");
const SOURCE_MANIFEST = require("../data/sports/source-assumption-manifest.json");

function validateSourceManifest() {
  const expectedIds = SPORTS.map((page) => page.id).sort();
  const actualIds = Object.keys(SOURCE_MANIFEST.tools || {}).sort();
  if (
    SOURCE_MANIFEST.schemaVersion !== 1
    || SOURCE_MANIFEST.live !== false
    || JSON.stringify(actualIds) !== JSON.stringify(expectedIds)
  ) {
    throw new Error("French Sports source manifest must cover the exact 15-app denominator and declare live=false.");
  }
  SPORTS.forEach((page) => {
    const entry = SOURCE_MANIFEST.tools[page.id];
    const complete = (
      entry
      && entry.reviewedAt
      && entry.asOf
      && entry.cadence
      && entry.state
      && entry.live === false
      && entry.sourceMode
      && entry.confidence
      && entry.confidence.grade
      && entry.confidence.label
      && entry.confidence.rationale
      && Array.isArray(entry.assumptions)
      && entry.assumptions.length
      && Array.isArray(entry.mutableBaselines)
      && Array.isArray(entry.sources)
      && (entry.sources.length || entry.sourceRationale)
    );
    if (!complete) throw new Error(`Incomplete French Sports source contract: ${page.id}`);
    if (entry.frenchRoute !== `/fr/tools/${page.frSlug}/`) {
      throw new Error(`French Sports source route drift: ${page.id}`);
    }
  });
}

validateSourceManifest();

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function artworkFor(id) {
  const relative = `/assets/img/tools/${id}.webp`;
  return fs.existsSync(path.join(ROOT, relative.slice(1))) ? `${SITE}${relative}` : `${SITE}/assets/img/og-default.png`;
}

function localeAlternatesFor(id) {
  const englishRoute = `/tools/${id}/`;
  return (LOCALE_COVERAGE.records || [])
    .filter((record) => (
      record.equivalentRoute === englishRoute
      && !["en", "fr"].includes(record.locale)
      && record.indexableEligible
      && record.route
    ))
    .map((record) => ({ locale: record.locale, route: record.route }))
    .sort((left, right) => left.locale.localeCompare(right.locale));
}

function pageSchema(page) {
  const frUrl = `${SITE}/fr/tools/${page.frSlug}/`;
  const enUrl = `${SITE}/tools/${page.id}/`;
  const sourceContract = SOURCE_MANIFEST.tools[page.id];
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: page.title,
      description: page.description,
      url: frUrl,
      inLanguage: "fr",
      applicationCategory: "SportsApplication",
      operatingSystem: "Web",
      isBasedOn: enUrl,
      dateModified: sourceContract.reviewedAt,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      provider: { "@type": "Organization", name: "AfroTools", url: `${SITE}/` }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE}/fr/` },
        { "@type": "ListItem", position: 2, name: "Sports et divertissement", item: `${SITE}/fr/sports/` },
        { "@type": "ListItem", position: 3, name: page.title, item: frUrl }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: "fr",
      mainEntity: [
        {
          "@type": "Question",
          name: `Les résultats de ${page.title} sont-ils en direct ?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: "Non. Le calcul utilise uniquement les valeurs saisies et les hypothèses visibles. Les prix, règles, scores, participants, blessures et disponibilités externes ne sont pas actualisés automatiquement."
          }
        },
        {
          "@type": "Question",
          name: "Les saisies sont-elles envoyées à AfroTools AI ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Non. AfroTools AI peut proposer cette route, mais le calcul, la copie, l’impression et le fichier JSON restent dans le navigateur sans transmission des saisies."
          }
        }
      ]
    }
  ];
}

function renderPage(page) {
  const frUrl = `${SITE}/fr/tools/${page.frSlug}/`;
  const enUrl = `${SITE}/tools/${page.id}/`;
  const image = artworkFor(page.id);
  const otherAlternates = localeAlternatesFor(page.id)
    .map((item) => `  <link rel="alternate" hreflang="${escapeHtml(item.locale)}" href="${SITE}${escapeHtml(item.route)}">`)
    .join("\n");
  const contract = {
    id: page.id,
    frSlug: page.frSlug,
    title: page.title,
    eyebrow: page.eyebrow,
    resultLabel: page.resultLabel,
    resultSummary: page.resultSummary,
    insights: page.insights,
    safety: page.safety,
    sourceConfidence: SOURCE_MANIFEST.tools[page.id]
  };
  return `<!DOCTYPE html>
<!-- Generated by scripts/build-fr-sports-parity.js. -->
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="afrotools-content-id" content="fr-sports-parity:${escapeHtml(page.id)}">
  <meta name="afrotools-source-owner" content="scripts/build-fr-sports-parity.js">
  <meta name="afrotools-ai-mode" content="route-only-local-calculation">
  <title>${escapeHtml(page.seoTitle)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <link rel="canonical" href="${frUrl}">
  <link rel="alternate" hreflang="fr" href="${frUrl}">
  <link rel="alternate" hreflang="en" href="${enUrl}">
  <link rel="alternate" hreflang="x-default" href="${enUrl}">
${otherAlternates}
  <meta property="og:title" content="${escapeHtml(page.title)} | AfroTools">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${frUrl}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${image}">
  <meta name="robots" content="index, follow">
  <script type="application/ld+json">${safeJson(pageSchema(page))}</script>
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=6977389f">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=c94dde91">
  <link rel="stylesheet" href="/assets/css/sports-tools.css">
  <link rel="stylesheet" href="/assets/css/fr-sports-parity.css">
  <script src="/assets/js/components/navbar.min.js?v=65f906d7" defer></script>
  <script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script>
</head>
<body data-fr-sports-tool="${escapeHtml(page.id)}">
  <afro-navbar theme="dark" active="sports"></afro-navbar>
  <header class="fr-sports-hero">
    <div class="fr-sports-wrap">
      <nav class="fr-sports-breadcrumb" aria-label="Fil d’Ariane">
        <a href="/fr/">Accueil</a><span aria-hidden="true">/</span>
        <a href="/fr/sports/">Sports et divertissement</a><span aria-hidden="true">/</span>
        <span aria-current="page">${escapeHtml(page.title)}</span>
      </nav>
      <h1>${escapeHtml(page.title)}</h1>
      <p>${escapeHtml(page.intro)}</p>
      <div class="fr-sports-pills" aria-label="Caractéristiques">
        <span>Calcul local</span><span>Résultat utile sans compte</span><span>Export JSON et impression</span><span>Aucune donnée en direct inventée</span>
      </div>
    </div>
  </header>
  <main class="fr-sports-main">
    <div class="fr-sports-wrap">
      <section class="fr-sports-intro" aria-label="Contrat de l’application">
        <article class="fr-sports-card">
          <h2>Calcul identique à l’application anglaise</h2>
          <p>Cette interface appelle directement le même moteur déterministe que <a href="/tools/${escapeHtml(page.id)}/" lang="en">l’application anglaise</a>. Les formules, valeurs par défaut et sources du moteur ne sont pas dupliquées.</p>
        </article>
        <article class="fr-sports-card">
          <h2>Confidentialité et IA</h2>
          <p>Les saisies, résultats et fichiers restent dans ce navigateur. AfroTools AI peut orienter vers cette page, mais ne reçoit aucune saisie sans un autre consentement explicite.</p>
        </article>
      </section>
      <div id="fr-sports-tool-root" class="sports-tool-root"></div>
      <noscript>
        <section class="fr-sports-card">
          <h2>JavaScript est nécessaire pour recalculer</h2>
          <p>Le contrat reste visible : utilisez uniquement des valeurs vérifiées, ne considérez jamais le résultat comme un score, un prix, une blessure, une disponibilité, une admission ou une décision officielle en direct.</p>
        </section>
      </noscript>
    </div>
  </main>
  <afro-footer></afro-footer>
  <script>window.AFRO_FR_SPORTS_CONTRACTS=Object.assign(window.AFRO_FR_SPORTS_CONTRACTS||{},${safeJson({ [page.id]: contract })});</script>
  <script src="/assets/js/sports-toolkit.js?v=377be865"></script>
  <script src="/assets/js/pages/fr-sports-parity.js"></script>
</body>
</html>
`;
}

function renderHub() {
  const cards = SPORTS.map((page) => `
      <a href="/fr/tools/${escapeHtml(page.frSlug)}/" data-source-id="${escapeHtml(page.id)}">
        <strong>${escapeHtml(page.title)}</strong>
        <span>${escapeHtml(page.description)}</span>
      </a>`).join("");
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    inLanguage: "fr",
    numberOfItems: SPORTS.length,
    itemListElement: SPORTS.map((page, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: page.title,
      url: `${SITE}/fr/tools/${page.frSlug}/`
    }))
  };
  const html = `<!DOCTYPE html>
<!-- Generated by scripts/build-fr-sports-parity.js. -->
<html lang="fr">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="afrotools-content-id" content="fr-sports-hub">
  <meta name="afrotools-source-owner" content="scripts/build-fr-sports-parity.js">
  <title>Sports et divertissement : 15 applications en français | AfroTools</title>
  <meta name="description" content="Accédez à 15 applications françaises pour scénarios sportifs, billetterie, événements, carrières, créations et budgets, sans données en direct inventées.">
  <link rel="canonical" href="${SITE}/fr/sports/">
  <link rel="alternate" hreflang="fr" href="${SITE}/fr/sports/">
  <link rel="alternate" hreflang="en" href="${SITE}/sports/">
  <link rel="alternate" hreflang="x-default" href="${SITE}/sports/">
  <meta property="og:title" content="Sports et divertissement en français | AfroTools">
  <meta property="og:description" content="15 applications locales de planification, avec limites claires et exports utiles.">
  <meta property="og:image" content="${SITE}/assets/img/og-default.png">
  <meta property="og:url" content="${SITE}/fr/sports/"><meta property="og:type" content="website"><meta property="og:locale" content="fr_FR">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${SITE}/assets/img/og-default.png">
  <script type="application/ld+json">${safeJson(itemList)}</script>
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=6977389f"><link rel="stylesheet" href="/assets/css/global.min.css?v=c94dde91"><link rel="stylesheet" href="/assets/css/fr-sports-parity.css">
  <script src="/assets/js/components/navbar.min.js?v=65f906d7" defer></script><script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script>
</head>
<body>
  <afro-navbar theme="dark" active="sports"></afro-navbar>
  <main class="fr-sports-hub">
    <header class="fr-sports-hub-header"><p><a href="/fr/">Accueil</a> / Sports et divertissement</p><h1>15 applications Sports et divertissement</h1><p>Des scénarios utiles pour comprendre les cotes, préparer un tournoi, organiser un événement, chiffrer une activité ou structurer une carrière — sans score, prix, participant, blessure ou résultat en direct inventé.</p></header>
    <aside class="fr-sports-hub-boundary"><strong>Limite commune :</strong> toutes les applications utilisent vos saisies et des hypothèses visibles. Les outils liés aux paris sont réservés aux adultes, ne promettent aucun gain et rappellent de ne jamais emprunter ni poursuivre une perte. Les réserves liées à l’indisponibilité d’un athlète sont financières, jamais médicales.</aside>
    <section class="fr-sports-grid" aria-label="Applications Sports et divertissement">${cards}
    </section>
  </main>
  <afro-footer></afro-footer>
</body>
</html>
`;
  return enhanceCategory(html, "fr");
}

function withAlternate(html, hreflang, href) {
  const pattern = new RegExp(`<link\\s+rel=["']alternate["']\\s+hreflang=["']${hreflang}["'][^>]*>`, "i");
  const tag = `<link rel="alternate" hreflang="${hreflang}" href="${href}">`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  const canonical = /(<link\s+rel=["']canonical["'][^>]*>)/i;
  return html.replace(canonical, `$1\n${tag}`);
}

function expectedFiles() {
  const files = new Map();
  SPORTS.forEach((page) => {
    files.set(path.join(ROOT, "fr", "tools", page.frSlug, "index.html"), renderPage(page));
    const englishFile = path.join(ROOT, "tools", page.id, "index.html");
    let english = fs.readFileSync(englishFile, "utf8");
    english = withAlternate(english, "fr", `${SITE}/fr/tools/${page.frSlug}/`);
    english = withAlternate(english, "en", `${SITE}/tools/${page.id}/`);
    english = withAlternate(english, "x-default", `${SITE}/tools/${page.id}/`);
    localeAlternatesFor(page.id).forEach((item) => {
      english = withAlternate(english, item.locale, `${SITE}${item.route}`);
    });
    files.set(englishFile, english);
  });
  files.set(path.join(ROOT, "fr", "sports", "index.html"), renderHub());
  const englishHubFile = path.join(ROOT, "sports", "index.html");
  let englishHub = fs.readFileSync(englishHubFile, "utf8");
  englishHub = withAlternate(englishHub, "fr", `${SITE}/fr/sports/`);
  englishHub = withAlternate(englishHub, "en", `${SITE}/sports/`);
  englishHub = withAlternate(englishHub, "x-default", `${SITE}/sports/`);
  files.set(englishHubFile, englishHub);
  return files;
}

function run() {
  const write = process.argv.includes("--write");
  const check = process.argv.includes("--check") || !write;
  const drift = [];
  for (const [file, expected] of expectedFiles()) {
    const actual = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    if (actual === expected) continue;
    drift.push(path.relative(ROOT, file).replace(/\\/g, "/"));
    if (write) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, expected, "utf8");
    }
  }
  if (check && drift.length) {
    console.error(`French Sports parity drift (${drift.length}):\n${drift.join("\n")}`);
    process.exitCode = 1;
    return;
  }
  console.log(`${write ? "Built" : "Verified"} French Sports parity: ${SPORTS.length}/15 apps plus hub and reciprocal hreflang.`);
}

if (require.main === module) run();

module.exports = { renderPage, renderHub, expectedFiles, validateSourceManifest };
