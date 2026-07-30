"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

const OWNERS = Object.freeze({
  "creator-carousel": {
    frSlug: "createur-de-carrousel",
    swSlug: "carousel-ya-mitandao",
    art: "creator-carousel",
    en: {
      name: "CarouselStudio",
      title: "Local Social Carousel Maker",
      description: "Turn a headline and two to eight authored points into a local 1080 × 1350 carousel, then export the slide PNGs, JSON, or text.",
      boundary: "The workspace lays out only the words you provide. It does not research, fact-check, publish, or send content to AI.",
      cta: "Build a carousel",
      fields: [
        field("headline", "Headline", "text", "Five lessons from my first year", true),
        field("audience", "Audience", "text", "Independent African creators", true),
        field("points", "Slide points", "textarea", "Start with one clear promise\nShow one example\nEnd with one useful action", true, { rows: 5 }),
        field("callToAction", "Closing action", "text", "Save this carousel"),
        field("handle", "Creator handle or sign-off", "text", "@yourname"),
        field("background", "Background colour", "color", "#111827"),
        field("accent", "Accent colour", "color", "#f59e0b"),
      ],
    },
    fr: {
      name: "CarouselStudio",
      title: "Créateur local de carrousels sociaux",
      description: "Transformez un titre et deux à huit idées rédigées par vous en carrousel 1080 × 1350, puis exportez les PNG, le JSON ou le texte.",
      boundary: "L’espace met en page uniquement vos mots. Il ne recherche ni ne vérifie les faits, ne publie rien et n’envoie aucun contenu à une IA.",
      cta: "Créer un carrousel",
      fields: [
        field("headline", "Titre principal", "text", "Cinq leçons de ma première année", true),
        field("audience", "Public visé", "text", "Créateurs indépendants en Afrique", true),
        field("points", "Idées des diapositives", "textarea", "Commencez par une promesse claire\nMontrez un exemple\nTerminez par une action utile", true, { rows: 5 }),
        field("callToAction", "Action finale", "text", "Enregistrez ce carrousel"),
        field("handle", "Signature ou identifiant", "text", "@votrenom"),
        field("background", "Couleur de fond", "color", "#111827"),
        field("accent", "Couleur d’accent", "color", "#f59e0b"),
      ],
    },
  },
  "creator-club": {
    frSlug: "club-des-createurs",
    swSlug: "klabu-ya-watayarishi",
    art: "creator-club",
    en: {
      name: "CreatorClub",
      title: "Membership Revenue Planner",
      description: "Model a creator membership with member count, monthly price, platform fees, operating costs, break-even members, and portable exports.",
      boundary: "This is a local planning calculator, not a hosted community, payment processor, member database, chat, or subscription service.",
      cta: "Plan a membership",
      fields: [
        field("clubName", "Club name", "text", "Studio Circle", true),
        field("members", "Paying members", "number", "100", true, { min: 1, step: 1 }),
        field("monthlyPrice", "Monthly price", "number", "10", true, { min: 0, step: 0.01 }),
        field("feePct", "Platform fee (%)", "number", "5", true, { min: 0, max: 100, step: 0.01 }),
        field("monthlyCosts", "Monthly operating costs", "number", "150", true, { min: 0, step: 0.01 }),
      ],
    },
    fr: {
      name: "CreatorClub",
      title: "Planificateur de revenus d’un club",
      description: "Modélisez un abonnement avec membres, prix mensuel, commission, coûts, seuil de rentabilité et exports portables.",
      boundary: "Il s’agit d’un calculateur local, pas d’une communauté hébergée, d’un système de paiement, d’un fichier membres, d’une messagerie ou d’un service d’abonnement.",
      cta: "Planifier un club",
      fields: [
        field("clubName", "Nom du club", "text", "Cercle Studio", true),
        field("members", "Membres payants", "number", "100", true, { min: 1, step: 1 }),
        field("monthlyPrice", "Prix mensuel", "number", "10", true, { min: 0, step: 0.01 }),
        field("feePct", "Commission de plateforme (%)", "number", "5", true, { min: 0, max: 100, step: 0.01 }),
        field("monthlyCosts", "Coûts mensuels", "number", "150", true, { min: 0, step: 0.01 }),
      ],
    },
  },
  "creator-course": {
    frSlug: "cours-pour-createurs",
    swSlug: "kozi-ya-watayarishi",
    art: "creator-course",
    en: {
      name: "CreatorCourse",
      title: "Local Course Revenue Planner",
      description: "Structure two to twelve authored modules and model a course sales scenario without uploading lessons, hosting students, or processing payments.",
      boundary: "The workspace produces a local outline and estimate. It does not host, publish, sell, teach, grade, or generate course material.",
      cta: "Plan a course",
      fields: [
        field("courseTitle", "Course title", "text", "Mobile video fundamentals", true),
        field("audience", "Learner audience", "text", "First-time creators", true),
        field("modules", "Module topics", "textarea", "Plan a clear story\nRecord clean mobile audio\nEdit a short sequence", true, { rows: 5 }),
        field("price", "Price per student", "number", "25", true, { min: 0, step: 0.01 }),
        field("students", "Expected students", "number", "40", true, { min: 1, step: 1 }),
        field("feePct", "Platform fee (%)", "number", "5", true, { min: 0, max: 100, step: 0.01 }),
        field("costs", "Production and delivery costs", "number", "250", true, { min: 0, step: 0.01 }),
      ],
    },
    fr: {
      name: "CreatorCourse",
      title: "Plan local de cours et de revenus",
      description: "Structurez deux à douze modules rédigés par vous et modélisez des ventes sans téléverser les leçons, héberger des élèves ou traiter des paiements.",
      boundary: "L’espace produit un plan local et une estimation. Il n’héberge, ne publie, ne vend, n’enseigne, ne note et ne génère aucun cours.",
      cta: "Planifier un cours",
      fields: [
        field("courseTitle", "Titre du cours", "text", "Fondamentaux de la vidéo mobile", true),
        field("audience", "Public apprenant", "text", "Créateurs débutants", true),
        field("modules", "Sujets des modules", "textarea", "Préparer une histoire claire\nEnregistrer un son mobile propre\nMonter une courte séquence", true, { rows: 5 }),
        field("price", "Prix par élève", "number", "25", true, { min: 0, step: 0.01 }),
        field("students", "Nombre prévu d’élèves", "number", "40", true, { min: 1, step: 1 }),
        field("feePct", "Commission de plateforme (%)", "number", "5", true, { min: 0, max: 100, step: 0.01 }),
        field("costs", "Coûts de production et de livraison", "number", "250", true, { min: 0, step: 0.01 }),
      ],
    },
  },
  "creator-page": {
    frSlug: "page-createur",
    swSlug: "ukurasa-wa-mtayarishi",
    art: "creator-page",
    en: {
      name: "CreatorPage",
      title: "Portable Link Page Builder",
      description: "Build a local creator profile with a bio and validated HTTP(S) links, then export JSON, text, or a standalone HTML page.",
      boundary: "AfroTools does not host, publish, track, sell from, or collect emails through this portable page draft.",
      cta: "Build a portable page",
      fields: [
        field("displayName", "Display name", "text", "Amina Studio", true),
        field("bio", "Short bio", "textarea", "Documentary filmmaker sharing practical mobile production notes.", true, { rows: 4 }),
        field("links", "Links", "textarea", "Portfolio | https://example.com\nYouTube | https://youtube.com", true, { rows: 5, help: "One per line: Label | https://example.com" }),
        field("accent", "Accent colour", "color", "#2563eb"),
      ],
    },
    fr: {
      name: "CreatorPage",
      title: "Créateur de page de liens portable",
      description: "Créez localement un profil avec bio et liens HTTP(S) validés, puis exportez le JSON, le texte ou une page HTML autonome.",
      boundary: "AfroTools n’héberge ni ne publie cette page, ne suit pas ses visites, n’y vend rien et n’y collecte aucune adresse e-mail.",
      cta: "Créer une page portable",
      fields: [
        field("displayName", "Nom affiché", "text", "Studio Amina", true),
        field("bio", "Courte biographie", "textarea", "Réalisatrice documentaire partageant des conseils pratiques de production mobile.", true, { rows: 4 }),
        field("links", "Liens", "textarea", "Portfolio | https://example.com\nYouTube | https://youtube.com", true, { rows: 5, help: "Une ligne par lien : Libellé | https://example.com" }),
        field("accent", "Couleur d’accent", "color", "#2563eb"),
      ],
    },
  },
  "creator-research": {
    frSlug: "recherche-de-contenu-pour-createur",
    swSlug: "utafiti-wa-mtayarishi",
    art: "creator-research",
    en: {
      name: "CreatorResearch",
      title: "Source-led Content Research Planner",
      description: "Turn authored questions and original HTTP(S) source links into a portable verification plan without uploading a brief or asking AI to invent research.",
      boundary: "The planner does not fetch, read, rank, summarize, or verify any source. You remain responsible for opening and checking every claim.",
      cta: "Build a research plan",
      fields: [
        field("topic", "Topic", "text", "Independent music distribution in West Africa", true),
        field("audience", "Audience", "text", "Emerging musicians", true),
        field("questions", "Research questions", "textarea", "Which costs are fixed?\nWhich terms vary by platform?\nWhat evidence is current?", true, { rows: 5 }),
        field("sources", "Original sources", "textarea", "Publisher documentation | https://example.com/docs\nRegulator notice | https://example.org/notice", true, { rows: 5, help: "One per line: Source name | https://example.com" }),
      ],
    },
    fr: {
      name: "CreatorResearch",
      title: "Planificateur de recherche guidé par les sources",
      description: "Transformez vos questions et liens HTTP(S) originaux en plan de vérification portable, sans téléverser le brief ni demander à une IA d’inventer la recherche.",
      boundary: "Le planificateur ne récupère, ne lit, ne classe, ne résume et ne vérifie aucune source. Vous devez ouvrir et contrôler chaque affirmation.",
      cta: "Créer un plan de recherche",
      fields: [
        field("topic", "Sujet", "text", "Distribution musicale indépendante en Afrique de l’Ouest", true),
        field("audience", "Public", "text", "Musiciens émergents", true),
        field("questions", "Questions de recherche", "textarea", "Quels coûts sont fixes ?\nQuelles conditions varient selon la plateforme ?\nQuelles preuves sont à jour ?", true, { rows: 5 }),
        field("sources", "Sources originales", "textarea", "Documentation éditeur | https://example.com/docs\nAvis du régulateur | https://example.org/avis", true, { rows: 5, help: "Une ligne par source : Nom | https://example.com" }),
      ],
    },
  },
  "creator-thumb": {
    frSlug: "miniature-pour-createur",
    swSlug: "thumbnail-ya-mtayarishi",
    art: "creator-thumb",
    en: {
      name: "ThumbnailForge",
      title: "Local Social Thumbnail Composer",
      description: "Compose a local thumbnail at exact YouTube, Instagram, LinkedIn, or X dimensions and export a reopened PNG, JSON, or text brief.",
      boundary: "This is a deterministic canvas composer. It does not remove backgrounds, generate images, predict clicks, or publish to a platform.",
      cta: "Compose a thumbnail",
      fields: [
        field("headline", "Headline", "text", "Build better mobile videos", true),
        field("kicker", "Short kicker", "text", "Creator guide"),
        select("format", "Output format", "youtube", [
          ["youtube", "YouTube — 1280 × 720"],
          ["instagram", "Instagram — 1080 × 1080"],
          ["linkedin", "LinkedIn — 1200 × 627"],
          ["x", "X — 1600 × 900"],
        ]),
        field("background", "Background colour", "color", "#111827"),
        field("accent", "Accent colour", "color", "#f59e0b"),
        field("textColour", "Text colour", "color", "#ffffff"),
      ],
    },
    fr: {
      name: "ThumbnailForge",
      title: "Compositeur local de miniatures sociales",
      description: "Composez une miniature aux dimensions exactes de YouTube, Instagram, LinkedIn ou X, puis exportez un PNG rouvert, le JSON ou le brief texte.",
      boundary: "Il s’agit d’un compositeur Canvas déterministe. Il ne détoure, ne génère et ne publie aucune image, et ne prédit aucun clic.",
      cta: "Composer une miniature",
      fields: [
        field("headline", "Titre principal", "text", "Créer de meilleures vidéos mobiles", true),
        field("kicker", "Courte accroche", "text", "Guide créateur"),
        select("format", "Format de sortie", "youtube", [
          ["youtube", "YouTube — 1280 × 720"],
          ["instagram", "Instagram — 1080 × 1080"],
          ["linkedin", "LinkedIn — 1200 × 627"],
          ["x", "X — 1600 × 900"],
        ]),
        field("background", "Couleur de fond", "color", "#111827"),
        field("accent", "Couleur d’accent", "color", "#f59e0b"),
        field("textColour", "Couleur du texte", "color", "#ffffff"),
      ],
    },
  },
});

function field(name, label, type, value, required = false, extra = {}) {
  return { name, label, type, value, required, ...extra };
}

function select(name, label, value, options) {
  return { name, label, type: "select", value, required: true, options: options.map(([optionValue, optionLabel]) => ({ value: optionValue, label: optionLabel })) };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function json(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function urls(owner, locale, app) {
  const meta = OWNERS[owner];
  const suffix = app ? "/app" : "/";
  return {
    canonical: locale === "fr"
      ? `https://afrotools.com/fr/tools/${meta.frSlug}${suffix}`
      : `https://afrotools.com/tools/${owner}${suffix}`,
    en: `https://afrotools.com/tools/${owner}${suffix}`,
    fr: `https://afrotools.com/fr/tools/${meta.frSlug}${suffix}`,
  };
}

function head(owner, locale, app) {
  const meta = OWNERS[owner];
  const copy = meta[locale];
  const route = urls(owner, locale, app);
  const title = `${copy.name} — ${copy.title} | AfroTools`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${copy.name} — ${copy.title}`,
    description: copy.description,
    url: route.canonical,
    inLanguage: locale,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    image: `https://afrotools.com/assets/img/tools/${meta.art}.webp`,
  };
  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(copy.description)}">
  <meta name="robots" content="${app ? "noindex, follow" : "index, follow"}">
  <meta name="geo.region" content="002">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(copy.description)}">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/${meta.art}.webp">
  <meta property="og:url" content="${route.canonical}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${locale === "fr" ? "fr_FR" : "en_US"}">
  <link rel="canonical" href="${route.canonical}">
  <link rel="alternate" hreflang="en" href="${route.en}">
  <link rel="alternate" hreflang="fr" href="${route.fr}">
${app ? "" : `  <link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/${meta.swSlug}/">`}
  <link rel="alternate" hreflang="x-default" href="${route.en}">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc">
  <link rel="stylesheet" href="/assets/css/creator-final-wave-native.css">
  <script type="application/ld+json">${json(schema)}</script>
  <script>(function(){try{var t=localStorage.getItem('aft_theme');var d=matchMedia('(prefers-color-scheme:dark)').matches;var a=t==='dark'||t==='light'?t:(d?'dark':'light');document.documentElement.setAttribute('data-theme',a);document.documentElement.setAttribute('data-theme-choice',t==='dark'||t==='light'?t:'auto');document.documentElement.style.colorScheme=a;}catch(_){}})();</script>`;
}

function launcher(owner, locale) {
  const meta = OWNERS[owner];
  const copy = meta[locale];
  const appPath = locale === "fr" ? `/fr/tools/${meta.frSlug}/app` : `/tools/${owner}/app`;
  const otherPath = locale === "fr" ? `/tools/${owner}/` : `/fr/tools/${meta.frSlug}/`;
  return `<!doctype html>
<html lang="${locale}">
<head>
  ${head(owner, locale, false)}
</head>
<body class="cf-page">
  <afro-navbar></afro-navbar>
  <main class="cf-shell">
    <section class="cf-hero">
      <div>
        <p class="cf-eyebrow">${locale === "fr" ? "Économie créative · Local d’abord" : "Creative economy · Local first"}</p>
        <h1>${escapeHtml(copy.title)}</h1>
        <p>${escapeHtml(copy.description)}</p>
        <div class="cf-actions">
          <a class="cf-btn cf-btn-primary" href="${appPath}">${escapeHtml(copy.cta)}</a>
          <a class="cf-btn cf-btn-secondary" href="${otherPath}">${locale === "fr" ? "English version" : "Version française"}</a>
        </div>
      </div>
      <img class="cf-art" src="/assets/img/tools/${meta.art}.webp" alt="${escapeHtml(copy.name)}" width="600" height="400">
    </section>
    <section class="cf-card" style="margin-top:20px">
      <h2>${locale === "fr" ? "Limite du produit" : "Product boundary"}</h2>
      <p class="cf-boundary">${escapeHtml(copy.boundary)}</p>
      <p class="cf-boundary">${locale === "fr"
        ? "Les saisies et les exports restent dans ce navigateur. Aucun champ n’est envoyé à AfroTools, Supabase, un service d’IA ou une plateforme sociale."
        : "Inputs and exports stay in this browser. No field is sent to AfroTools, Supabase, an AI service, or a social platform."}</p>
    </section>
  </main>
  <afro-footer></afro-footer>
  <script src="/assets/js/components/navbar.min.js?v=65f906d7" defer></script>
  <script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script>
</body>
</html>
`;
}

function app(owner, locale) {
  const meta = OWNERS[owner];
  const copy = meta[locale];
  const back = locale === "fr" ? `/fr/tools/${meta.frSlug}/` : `/tools/${owner}/`;
  const config = {
    owner,
    locale,
    title: copy.title,
    fields: copy.fields,
    labels: locale === "fr" ? {
      owner: "Outil", headline: "Titre", audience: "Public", slides: "Diapositives",
      modules: "Modules", links: "Liens", sources: "Sources", verificationChecklist: "Vérifications",
      boundary: "Limite", grossMonthly: "Revenu brut mensuel", platformFees: "Commissions",
      netMonthly: "Revenu net mensuel", annualNet: "Revenu net annuel", breakEvenMembers: "Membres au seuil",
      grossRevenue: "Revenu brut", netRevenue: "Revenu net", dimensions: "Dimensions",
    } : {
      owner: "Tool", headline: "Headline", audience: "Audience", slides: "Slides",
      modules: "Modules", links: "Links", sources: "Sources", verificationChecklist: "Verification",
      boundary: "Boundary", grossMonthly: "Gross monthly", platformFees: "Platform fees",
      netMonthly: "Net monthly", annualNet: "Annual net", breakEvenMembers: "Break-even members",
      grossRevenue: "Gross revenue", netRevenue: "Net revenue", dimensions: "Dimensions",
    },
    exportLabels: locale === "fr"
      ? { json: "Télécharger JSON", text: "Télécharger TXT", csv: "Télécharger CSV", html: "Télécharger HTML", png: "Télécharger PNG", zip: "Télécharger les PNG (ZIP)" }
      : { json: "Download JSON", text: "Download TXT", csv: "Download CSV", html: "Download HTML", png: "Download PNG", zip: "Download PNGs (ZIP)" },
    messages: locale === "fr"
      ? { ready: "Résultat local prêt.", error: "Vérifiez les champs.", zipUnavailable: "Bibliothèque ZIP indisponible." }
      : { ready: "Local result ready.", error: "Check the fields.", zipUnavailable: "ZIP library unavailable." },
  };
  return `<!doctype html>
<html lang="${locale}">
<head>
  ${head(owner, locale, true)}
${owner === "creator-carousel" ? '  <script src="/assets/vendor/jszip/jszip.min.js" defer></script>' : ""}
  <script src="/engines/creator-final-wave-engine.js" defer></script>
  <script src="/assets/js/pages/creative/creator-final-wave-controller.js" defer></script>
</head>
<body class="cf-page">
  <main class="cf-shell">
    <a class="cf-btn cf-btn-secondary" href="${back}">← ${locale === "fr" ? "Retour" : "Back"}</a>
    <section class="cf-grid">
      <form class="cf-card" id="creatorFinalForm">
        <p class="cf-eyebrow">${escapeHtml(copy.name)}</p>
        <h1>${escapeHtml(copy.title)}</h1>
        <p class="cf-boundary">${escapeHtml(copy.boundary)}</p>
        <div class="cf-fields" id="creatorFinalFields"></div>
        <button class="cf-btn cf-btn-primary" type="submit">${escapeHtml(copy.cta)}</button>
        <p class="cf-status" id="creatorFinalStatus" role="status" aria-live="polite" tabindex="-1"></p>
      </form>
      <section class="cf-card cf-output" id="creatorFinalOutput" tabindex="-1" hidden>
        <h2>${locale === "fr" ? "Résultat local" : "Local result"}</h2>
        <div id="creatorFinalResult"></div>
        <div class="cf-preview" id="creatorFinalPreview"></div>
        <div class="cf-export-actions" id="creatorFinalExports"></div>
      </section>
    </section>
  </main>
  <script type="application/json" id="creator-final-config">${json(config)}</script>
</body>
</html>
`;
}

function write(relativePath, content) {
  const target = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
  process.stdout.write(`WROTE ${relativePath}\n`);
}

const owner = process.argv[2];
if (!OWNERS[owner]) {
  process.stderr.write(`Usage: node scripts/build-fr-creative-final-wave.js <${Object.keys(OWNERS).join("|")}>\n`);
  process.exit(1);
}

const meta = OWNERS[owner];
write(`tools/${owner}/index.html`, launcher(owner, "en"));
write(`tools/${owner}/app.html`, app(owner, "en"));
write(`fr/tools/${meta.frSlug}/index.html`, launcher(owner, "fr"));
write(`fr/tools/${meta.frSlug}/app.html`, app(owner, "fr"));
