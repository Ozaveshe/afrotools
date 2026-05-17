#!/usr/bin/env node
"use strict";

/**
 * Generate the curated French widget parent pages.
 *
 * The parent pages are public French explainers for a small set of useful
 * widgets. The iframe pages themselves remain technical noindex utilities.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://afrotools.com";
const WIDGETS = require("../widgets/WIDGET-REGISTRY.js");

const SELECTED_WIDGETS = [
  {
    id: "mobile-money-fees",
    slug: "frais-mobile-money",
    category: "Paiements mobiles",
    title: "Widget frais mobile money",
    description: "Aider les lecteurs a estimer les frais mobile money avant un transfert, un paiement marchand ou une collecte communautaire.",
    fullFrenchPath: "/fr/tools/frais-mobile-money/",
    primaryUse: "Blogs finance, pages d'association, comparateurs de services et guides pratiques pour utilisateurs mobile money.",
    caution: "Verifier la langue visible du widget avant publication et diriger les utilisateurs francophones vers la page complete en francais.",
  },
  {
    id: "remittance-compare",
    slug: "transfert-argent",
    category: "Diaspora et transferts",
    title: "Widget comparaison de transfert d'argent",
    description: "Presenter une comparaison simple des couts de transfert pour les familles, diasporas et petites entreprises.",
    fullFrenchPath: "/fr/tools/transfert-argent/",
    primaryUse: "Guides diaspora, pages de services financiers et contenus d'explication sur les frais de transfert.",
    caution: "Ne pas promettre le meilleur tarif en temps reel si la page d'accueil ou le widget ne confirme pas les donnees disponibles.",
  },
  {
    id: "currency-converter",
    slug: "convertisseur-devises",
    category: "Devises",
    title: "Widget convertisseur de devises africaines",
    description: "Donner un repere de conversion pour les monnaies africaines, les prix, les factures et les budgets transfrontaliers.",
    fullFrenchPath: "/fr/tools/convertisseur-devises/",
    primaryUse: "Pages de prix, guides pays, articles business et tableaux de bord qui doivent afficher un repere de change.",
    caution: "Presenter la conversion comme une estimation et envoyer les utilisateurs vers l'outil complet pour verifier le contexte.",
  },
  {
    id: "vat-calculator",
    slug: "taxe-valeur-ajoutee",
    category: "TVA",
    title: "Widget calculateur de TVA",
    description: "Calculer rapidement un montant hors taxe, toutes taxes comprises ou la TVA incluse dans un prix.",
    fullFrenchPath: "/fr/tools/calculateur-tva/",
    primaryUse: "Pages de facturation, guides fiscaux, supports de formation et outils pour petites entreprises.",
    caution: "Garder les cas pays sensibles sur les pages fiscales completes quand les taux ou regles locales changent.",
  },
  {
    id: "import-duty",
    slug: "droits-douane",
    category: "Importation",
    title: "Widget estimation des droits de douane",
    description: "Aider un importateur a poser une premiere estimation de couts avant de verifier les regles officielles.",
    fullFrenchPath: "/fr/tools/droits-douane/",
    primaryUse: "Guides import, pages e-commerce, contenus logistiques et ressources pour commerçants.",
    caution: "Decrire le resultat comme une estimation et garder les calculs officiels ou pays precis sur les pages dediees.",
  },
  {
    id: "invoice-fee-widget",
    slug: "frais-facture",
    category: "Facturation",
    title: "Widget frais de paiement sur facture",
    description: "Estimer les frais de plateforme ou de paiement avant d'envoyer une facture a un client.",
    fullFrenchPath: "/fr/tools/generateur-factures/",
    primaryUse: "Pages de freelance, guides PME, ressources de facturation et contenus pour prestataires.",
    caution: "Lier la page complete de facture en francais lorsque l'utilisateur doit creer ou partager une facture.",
  },
  {
    id: "crop-yield-estimator",
    slug: "rendement-agricole",
    category: "Agriculture",
    title: "Widget estimation de rendement agricole",
    description: "Estimer un volume de recolte a partir de la surface cultivee et du rendement attendu.",
    fullFrenchPath: "/fr/agriculture/crop-yield/",
    primaryUse: "Pages cooperatives, guides intrants, contenus de vulgarisation agricole et ressources terrain.",
    caution: "Presenter le resultat comme un scenario de planification, pas comme une prediction agronomique garantie.",
  },
  {
    id: "farm-budget-estimator",
    slug: "budget-agricole",
    category: "Agriculture",
    title: "Widget budget d'exploitation agricole",
    description: "Additionner semences, intrants, main-d'oeuvre, transport et autres couts pour preparer un budget de ferme.",
    fullFrenchPath: "/fr/agriculture/farm-budget/",
    primaryUse: "Pages de formation agricole, cooperatives, ONG, institutions de microfinance et guides de planification.",
    caution: "Adapter les montants localement et garder les conseils financiers detailles sur les pages completes.",
  },
];

function widgetById(id) {
  return WIDGETS.find((widget) => widget.id === id);
}

function ensureRouteExists(route) {
  const clean = route.replace(/^\/+|\/+$/g, "");
  const indexPath = path.join(ROOT, clean, "index.html");
  const htmlPath = path.join(ROOT, `${clean}.html`);
  return fs.existsSync(indexPath) || fs.existsSync(htmlPath);
}

function ensureIframeExists(iframePath) {
  const clean = iframePath.replace(/^\/+/, "");
  return fs.existsSync(path.join(ROOT, clean));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pageUrl(route) {
  return `${SITE}${route}`;
}

function iframeCode(widget, item) {
  return `<iframe src="${SITE}${widget.iframePath}" width="100%" height="520" frameborder="0" title="${item.title} - AfroTools" loading="lazy"></iframe>`;
}

function pageTemplate(item, widget) {
  const route = `/fr/widgets/${item.slug}/`;
  const url = pageUrl(route);
  const embedCode = iframeCode(widget, item);
  const description = `${item.description} L'iframe reste une route technique noindex; cette page est le parent francais a partager.`;

  return `<!DOCTYPE html>
<html data-chat-bundle="/assets/js/bundles/chat.e5a3e11c.min.js" lang="fr">
<head>
<meta charset="UTF-8">
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<meta name="view-transition" content="same-origin">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(item.title)} | Widgets AfroTools</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${escapeHtml(item.title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${SITE}/assets/img/og-default.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="AfroTools">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(item.title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${SITE}/assets/img/og-default.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Instrument+Serif:ital@0;1&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Instrument+Serif:ital@0;1&display=swap"></noscript>
<link rel="stylesheet" href="/assets/css/design-system.css?v=ebd59ad2">
<link rel="stylesheet" href="/assets/css/commercial-pages.css?v=9a085d6e">
<style>
.fr-widget-parent-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:24px;align-items:start}
.fr-widget-code{width:100%;min-height:132px;border:1px solid var(--color-border,#e2e8f0);border-radius:8px;padding:14px;background:#0f172a;color:#f8fafc;font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;resize:vertical}
.fr-widget-detail-list{display:grid;gap:12px;margin:0;padding:0;list-style:none}
.fr-widget-detail-list li{border:1px solid var(--color-border,#e2e8f0);border-radius:8px;padding:14px;background:#fff}
.fr-widget-detail-list strong{display:block;margin-bottom:4px}
.fr-widget-note{font-size:.92rem;color:var(--color-text-muted,#64748b)}
.fr-widget-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}
.fr-widget-mini-card{border:1px solid var(--color-border,#e2e8f0);border-radius:8px;padding:16px;background:#fff}
.fr-widget-mini-card strong{display:block;margin-bottom:8px}
@media (max-width: 860px){.fr-widget-parent-grid{grid-template-columns:1fr}}
</style>
<script src="/assets/js/components/navbar.min.js?v=01d16ada" defer></script>
<script src="/assets/js/components/footer.min.js?v=d60a94ba" defer></script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"WebPage","name":"${escapeHtml(item.title)}","url":"${url}","description":"${escapeHtml(description)}","inLanguage":"fr","isPartOf":{"@type":"WebSite","name":"AfroTools","url":"${SITE}/"}}
</script>
<link rel="alternate" hreflang="fr" href="${url}" />
<link rel="alternate" hreflang="x-default" href="${url}" />
</head>
<body>
<afro-navbar></afro-navbar>
<main class="commercial-page">
  <section class="commercial-hero">
    <div class="container commercial-hero__grid">
      <div>
        <p class="commercial-kicker">${escapeHtml(item.category)}</p>
        <h1 class="commercial-title">${escapeHtml(item.title)}</h1>
        <p class="commercial-copy">${escapeHtml(item.description)}</p>
        <div class="commercial-actions">
          <a class="btn btn-primary" href="${item.fullFrenchPath}">Ouvrir l'outil complet</a>
          <a class="btn btn-secondary" href="#code-integration">Copier le code d'integration</a>
          <a class="btn btn-ghost" href="/fr/widgets/">Tous les widgets francais</a>
        </div>
      </div>
      <aside class="commercial-panel" aria-label="Etat du widget">
        <p class="commercial-panel__label">Route parent</p>
        <div class="commercial-metric-list">
          <div class="commercial-metric">
            <strong>Page francaise partageable</strong>
            <span>Cette page explique l'usage, le code et la route complete a ouvrir en francais.</span>
          </div>
          <div class="commercial-metric">
            <strong>Iframe non promue</strong>
            <span>L'iframe reste un utilitaire technique et garde sa canonical vers l'outil complet.</span>
          </div>
        </div>
      </aside>
    </div>
  </section>

  <section class="commercial-section">
    <div class="container fr-widget-parent-grid">
      <div>
        <div class="commercial-section__head">
          <h2>Quand utiliser ce widget</h2>
          <p>${escapeHtml(item.primaryUse)}</p>
        </div>
        <ul class="fr-widget-detail-list">
          <li><strong>Experience principale</strong><span>Envoyez les utilisateurs vers <a href="${item.fullFrenchPath}">la page complete en francais</a> quand ils doivent calculer, comparer ou sauvegarder un resultat.</span></li>
          <li><strong>Integration legere</strong><span>Utilisez le code ci-dessous pour placer un module compact dans un article, une page pays ou un guide business.</span></li>
          <li><strong>Limite a garder visible</strong><span>${escapeHtml(item.caution)}</span></li>
        </ul>
      </div>
      <aside class="commercial-card" id="code-integration">
        <h2>Code d'integration</h2>
        <p class="fr-widget-note">Ce code pointe vers l'iframe technique. Ne liez pas cette iframe comme une page SEO; liez plutot cette page parent ou l'outil complet.</p>
        <textarea class="fr-widget-code" readonly>${escapeHtml(embedCode)}</textarea>
      </aside>
    </div>
  </section>

  <section class="commercial-section commercial-section--surface">
    <div class="container">
      <div class="commercial-section__head">
        <h2>Routes et decision de promotion</h2>
        <p>Cette page parent est la surface francaise a partager. L'iframe reste reservee a l'integration dans une page existante.</p>
      </div>
      <div class="fr-widget-card-grid">
        <article class="fr-widget-mini-card">
          <strong>Page parent</strong>
          <span>${route}</span>
        </article>
        <article class="fr-widget-mini-card">
          <strong>Outil complet</strong>
          <span>${item.fullFrenchPath}</span>
        </article>
        <article class="fr-widget-mini-card">
          <strong>Iframe technique</strong>
          <span>${widget.iframePath}</span>
        </article>
      </div>
    </div>
  </section>
</main>
<afro-footer></afro-footer>
</body>
</html>
`;
}

function hubTemplate(items) {
  const cards = items.map(({ item }) => `        <article class="fr-widget-tool-card">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <a href="/fr/widgets/${item.slug}/">Ouvrir la page parent</a>
        </article>`).join("\n");

  return `<!DOCTYPE html>
<html data-chat-bundle="/assets/js/bundles/chat.e5a3e11c.min.js" lang="fr">
<head>
<meta charset="UTF-8">
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<meta name="view-transition" content="same-origin">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Widgets AfroTools en francais | Pages parent et integrations</title>
<meta name="description" content="Pages parent francaises pour des widgets AfroTools utiles aux sites africains, avec iframes techniques gardees en noindex.">
<link rel="canonical" href="${SITE}/fr/widgets/">
<meta property="og:title" content="Widgets AfroTools en francais">
<meta property="og:description" content="Pages parent francaises pour des widgets AfroTools utiles, sans promouvoir les iframes techniques.">
<meta property="og:image" content="${SITE}/assets/img/og-default.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${SITE}/fr/widgets/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="AfroTools">
<meta property="og:locale" content="fr_FR">
<meta property="og:locale:alternate" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Widgets AfroTools en francais">
<meta name="twitter:description" content="Pages parent francaises pour integrer des calculateurs AfroTools utiles.">
<meta name="twitter:image" content="${SITE}/assets/img/og-default.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Instrument+Serif:ital@0;1&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Instrument+Serif:ital@0;1&display=swap"></noscript>
<link rel="stylesheet" href="/assets/css/design-system.css?v=ebd59ad2">
<link rel="stylesheet" href="/assets/css/commercial-pages.css?v=9a085d6e">
<style>
.fr-widget-note{font-size:.9rem;color:var(--color-text-muted,#64748b);margin-top:12px}
.fr-widget-tool-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.fr-widget-tool-card{border:1px solid var(--color-border,#e2e8f0);border-radius:8px;padding:18px;background:#fff}
.fr-widget-tool-card h3{font-size:1rem;margin:0 0 8px}
.fr-widget-tool-card p{font-size:.9rem;color:var(--color-text-muted,#64748b);margin:0 0 14px}
.fr-widget-tool-card a{font-weight:700}
.fr-widget-status{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.fr-widget-pill{border:1px solid var(--color-border,#e2e8f0);border-radius:999px;padding:8px 12px;font-size:.86rem;background:#fff;color:var(--color-text,#0f172a)}
</style>
<script src="/assets/js/components/navbar.min.js?v=01d16ada" defer></script>
<script src="/assets/js/components/footer.min.js?v=d60a94ba" defer></script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"CollectionPage","name":"Widgets AfroTools en francais","url":"${SITE}/fr/widgets/","description":"Pages parent francaises pour des widgets AfroTools utiles, avec les iframes gardees comme routes techniques noindex.","inLanguage":"fr","isPartOf":{"@type":"WebSite","name":"AfroTools","url":"${SITE}/"}}
</script>
<link rel="alternate" hreflang="en" href="${SITE}/widgets/" />
<link rel="alternate" hreflang="fr" href="${SITE}/fr/widgets/" />
<link rel="alternate" hreflang="x-default" href="${SITE}/widgets/" />
</head>
<body>
<afro-navbar></afro-navbar>
<main class="commercial-page">
  <section class="commercial-hero">
    <div class="container commercial-hero__grid">
      <div>
        <p class="commercial-kicker">Widgets et integrations</p>
        <h1 class="commercial-title">Des pages parent francaises pour integrer les outils AfroTools sans promouvoir les iframes.</h1>
        <p class="commercial-copy">Cette surface met en avant une petite selection de widgets utiles aux sites africains et francophones. Chaque page parent explique l'usage, le code d'integration et la page complete a ouvrir en francais.</p>
        <div class="commercial-actions">
          <a class="btn btn-primary" href="#widgets-francais">Voir les pages parent</a>
          <a class="btn btn-secondary" href="/fr/widgets/demo/">Ouvrir la demo technique</a>
          <a class="btn btn-ghost" href="/fr/tools/">Explorer les outils francais</a>
        </div>
        <div class="fr-widget-status" aria-label="Etat de la surface widgets en francais">
          <span class="fr-widget-pill">${items.length} pages parent francaises</span>
          <span class="fr-widget-pill">Iframes techniques en noindex</span>
          <span class="fr-widget-pill">Aucune promotion d'iframe</span>
        </div>
      </div>
      <aside class="commercial-panel" aria-label="Regle de promotion des widgets francais">
        <p class="commercial-panel__label">Regle francaise</p>
        <div class="commercial-metric-list">
          <div class="commercial-metric">
            <strong>Promouvoir le parent</strong>
            <span>La page parent ou l'outil complet est la destination pour les utilisateurs et les moteurs de recherche.</span>
          </div>
          <div class="commercial-metric">
            <strong>Garder l'iframe discret</strong>
            <span>Les routes d'iframe servent a l'integration et gardent un balisage noindex avec canonical vers la page complete.</span>
          </div>
          <div class="commercial-metric">
            <strong>Ne pas inventer de couverture</strong>
            <span>Un widget anglais ou un simple wrapper ne devient pas une page francaise complete.</span>
          </div>
        </div>
      </aside>
    </div>
  </section>

  <section class="commercial-section" id="widgets-francais">
    <div class="container">
      <div class="commercial-section__head">
        <h2>Pages parent pretes pour une publication francophone</h2>
        <p>Ces pages restent volontairement courtes: elles expliquent le cas d'usage, fournissent le code d'integration et renvoient vers l'outil francais complet.</p>
      </div>
      <div class="fr-widget-tool-list">
${cards}
      </div>
    </div>
  </section>

  <section class="commercial-section commercial-section--surface">
    <div class="container commercial-split">
      <div class="commercial-section__head">
        <h2>Demo technique</h2>
        <p>La galerie technique garde les fonctions de recherche, preview et copie du systeme de widgets. Elle peut contenir des interfaces anglaises, donc elle n'est pas comptee comme couverture francaise complete.</p>
        <p class="fr-widget-note">Pour une page publique en francais, utilisez une page parent francaise ou la page complete de l'outil.</p>
      </div>
      <div class="commercial-card">
        <h3>Ce qui reste hors promotion</h3>
        <ul class="commercial-list">
          <li>Les pages widgets/iframe/ restent des utilitaires d'integration.</li>
          <li>Les widgets sans experience francaise utile ne sont pas presentes comme produits francais.</li>
          <li>Les modeles d'iframe ne doivent pas entrer dans la promotion ou les comptes de completion francaise.</li>
        </ul>
        <div class="commercial-actions">
          <a class="btn btn-primary" href="/fr/widgets/demo/">Ouvrir la demo technique</a>
        </div>
      </div>
    </div>
  </section>
</main>
<afro-footer></afro-footer>
</body>
</html>
`;
}

function main() {
  const resolved = SELECTED_WIDGETS.map((item) => {
    const widget = widgetById(item.id);
    if (!widget) throw new Error(`Missing widget registry entry: ${item.id}`);
    if (!ensureIframeExists(widget.iframePath)) throw new Error(`Missing iframe page for ${item.id}: ${widget.iframePath}`);
    if (!ensureRouteExists(item.fullFrenchPath)) throw new Error(`Missing French full tool route for ${item.id}: ${item.fullFrenchPath}`);
    return { item, widget };
  });

  const frWidgetsDir = path.join(ROOT, "fr", "widgets");
  fs.mkdirSync(frWidgetsDir, { recursive: true });

  fs.writeFileSync(path.join(frWidgetsDir, "index.html"), hubTemplate(resolved), "utf8");

  for (const entry of resolved) {
    const outDir = path.join(frWidgetsDir, entry.item.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), pageTemplate(entry.item, entry.widget), "utf8");
  }

  console.log(JSON.stringify({
    parentPagesGenerated: resolved.length,
    routes: resolved.map(({ item }) => `/fr/widgets/${item.slug}/`),
  }, null, 2));
}

main();
