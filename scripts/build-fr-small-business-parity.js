"use strict";

const fs = require("fs");
const path = require("path");
const { routes } = require("./lib/fr-small-business-parity-config");

const ROOT = path.resolve(__dirname, "..");
const BASELINE = "8ce5cac175e42201968b1f7540752d6acf92d4ca";

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slash(route) {
  return route.endsWith("/") ? route : `${route}/`;
}

function fieldHtml(field) {
  const id = `sme-${field.name}`;
  const common = `id="${id}" name="${escapeHtml(field.name)}"`;
  let control = "";
  if (field.type === "select") {
    control = `<select ${common} class="form-select">${field.options.map((option) => `<option value="${escapeHtml(option.value)}"${String(option.value) === String(field.value) ? " selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}</select>`;
  } else if (field.type === "textarea") {
    control = `<textarea ${common} class="form-input" rows="4">${escapeHtml(field.value)}</textarea>`;
  } else {
    const bounds = `${field.min != null ? ` min="${field.min}"` : ""}${field.max != null ? ` max="${field.max}"` : ""}${field.step ? ` step="${field.step}"` : ""}`;
    control = `<input ${common} class="form-input" type="${field.type}" value="${escapeHtml(field.value)}"${bounds}>`;
  }
  return `<div class="form-field"><label class="form-label" for="${id}">${escapeHtml(field.label)}</label>${control}</div>`;
}

function schema(route) {
  const frenchUrl = `https://afrotools.com/fr/tools/${route.slug}/`;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: route.title,
    description: route.description,
    url: frenchUrl,
    inLanguage: "fr",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    isBasedOn: `https://afrotools.com/tools/${route.id}/`
  });
}

function inheritedAlternates(englishFile) {
  if (!fs.existsSync(englishFile)) return "";
  const html = fs.readFileSync(englishFile, "utf8");
  return [...html.matchAll(/<link\s+rel=["']alternate["']\s+hreflang=["']([^"']+)["']\s+href=["']([^"']+)["'][^>]*>/gi)]
    .filter((match) => !["fr", "en", "x-default"].includes(match[1].toLowerCase()))
    .map((match) => `  <link rel="alternate" hreflang="${escapeHtml(match[1])}" href="${escapeHtml(match[2])}">`)
    .join("\n");
}

function page(route) {
  const frenchPath = `/fr/tools/${route.slug}/`;
  const englishPath = `/tools/${route.id}/`;
  const inherited = inheritedAlternates(path.join(ROOT, "tools", route.id, "index.html"));
  const config = JSON.stringify({ id: route.id, export: route.export, title: route.title });
  return `<!doctype html>
<html lang="fr" data-theme-choice="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(route.title)} — AfroTools</title>
  <meta name="description" content="${escapeHtml(route.description)}">
  <link rel="canonical" href="https://afrotools.com${frenchPath}">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com${frenchPath}">
  <link rel="alternate" hreflang="en" href="https://afrotools.com${englishPath}">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com${englishPath}">
${inherited}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(route.title)} — AfroTools">
  <meta property="og:description" content="${escapeHtml(route.description)}">
  <meta property="og:url" content="https://afrotools.com${frenchPath}">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/${route.id}.webp">
  <meta property="og:locale" content="fr_FR">
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <script type="application/ld+json">${schema(route)}</script>
  <style>
    :root{color-scheme:light dark}
    body{margin:0;background:var(--color-bg,#f5f7fb);color:var(--color-text,#0f172a);font-family:var(--font-sans,"DM Sans",system-ui,sans-serif)}
    .sme-shell{max-width:1120px;margin:0 auto;padding:clamp(1rem,3vw,2.5rem)}
    .sme-hero{padding:clamp(1.5rem,4vw,3.5rem);border-radius:var(--radius-xl,24px);background:var(--color-surface,#fff);border:1px solid var(--color-border,#dbe3ef)}
    .sme-kicker{font-size:.78rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--color-primary,#1769d2)}
    h1{font-size:clamp(2rem,5vw,3.6rem);line-height:1.02;margin:.7rem 0 1rem;max-width:18ch}
    .sme-lead{font-size:clamp(1rem,2vw,1.2rem);line-height:1.65;max-width:70ch;color:var(--color-text-muted,#526079)}
    .sme-layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(17rem,.7fr);gap:1.5rem;margin-top:1.5rem;align-items:start}
    .sme-card{background:var(--color-surface,#fff);border:1px solid var(--color-border,#dbe3ef);border-radius:var(--radius-xl,24px);padding:clamp(1rem,3vw,2rem);box-shadow:var(--shadow-sm,0 8px 24px rgba(15,23,42,.06))}
    .sme-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
    .form-field{min-width:0}.form-label{display:block;font-weight:700;margin-bottom:.4rem}.form-input,.form-select{width:100%;min-height:48px;box-sizing:border-box}
    textarea.form-input{min-height:7rem;resize:vertical}
    .sme-actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1.25rem}.sme-actions .btn{min-height:48px}
    .sme-status{min-height:1.5rem;margin:.85rem 0 0;color:var(--color-text-muted,#526079)}
    .sme-status[data-state="error"]{color:var(--color-danger,#b42318)}
    .sme-results[hidden]{display:none}.sme-results{margin-top:1.5rem}
    .sme-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem}
    .sme-metric{padding:1rem;border:1px solid var(--color-border,#dbe3ef);border-radius:var(--radius-lg,16px);background:var(--color-bg-subtle,#f8fafc)}
    .sme-metric dt{font-size:.8rem;color:var(--color-text-muted,#526079);overflow-wrap:anywhere}.sme-metric dd{margin:.35rem 0 0;font-weight:800;font-size:1.1rem;overflow-wrap:anywhere}
    .sme-boundary{margin-top:1rem;padding:1rem;border-left:4px solid var(--color-primary,#1769d2);background:var(--color-bg-subtle,#f8fafc);line-height:1.55}
    .sme-aside h2{font-size:1.2rem}.sme-aside ul{padding-left:1.2rem;line-height:1.65}.sme-aside a{color:var(--color-primary,#1769d2)}
    :focus-visible{outline:3px solid var(--color-focus,#2563eb);outline-offset:3px}
    @media(max-width:800px){.sme-layout{grid-template-columns:1fr}.sme-grid{grid-template-columns:1fr}}
    @media(max-width:375px){.sme-shell{padding:.75rem}.sme-card,.sme-hero{padding:1rem;border-radius:16px}.sme-metrics{grid-template-columns:1fr}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
    @media print{afro-navbar,afro-footer,.sme-actions,.sme-aside{display:none!important}.sme-layout{display:block}.sme-card,.sme-hero{box-shadow:none}}
  </style>
  <script src="/assets/js/components/navbar.min.js" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
  <script src="/assets/js/lib/dark-mode.js" defer></script>
  <script src="/assets/js/engines/small-business-parity.js" defer></script>
  <script src="/assets/js/pages/fr-small-business-parity.js" defer></script>
</head>
<body data-parity-root="fr-small-business-sme-parity" data-sme-tool="${escapeHtml(route.id)}">
  <afro-navbar></afro-navbar>
  <main class="sme-shell">
    <nav aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> · <a href="/fr/small-business/">Petites entreprises et PME</a> · <span aria-current="page">${escapeHtml(route.title)}</span></nav>
    <header class="sme-hero">
      <div class="sme-kicker">PME · calcul local</div>
      <h1>${escapeHtml(route.title)}</h1>
      <p class="sme-lead">${escapeHtml(route.description)}</p>
    </header>
    <div class="sme-layout">
      <section class="sme-card" aria-labelledby="sme-form-title">
        <h2 id="sme-form-title">Vos données de travail</h2>
        <p>Les valeurs restent dans ce navigateur. Aucun compte, envoi ou calcul réseau n’est requis.</p>
        <form data-sme-form novalidate>
          <div class="sme-grid">${route.fields.map(fieldHtml).join("")}</div>
          <div class="sme-actions">
            <button class="btn btn-primary" type="submit">Calculer</button>
            <button class="btn btn-secondary" type="button" data-sme-copy disabled>Copier le résultat</button>
            <button class="btn btn-secondary" type="button" data-sme-export disabled>Télécharger ${route.export.toUpperCase()}</button>
${route.id === "freelance-contract" ? '            <button class="btn btn-ghost" type="button" data-sme-print disabled>Imprimer / PDF</button>' : ""}
          </div>
          <p class="sme-status" data-sme-status role="status" aria-live="polite">Saisissez ou vérifiez les valeurs, puis lancez le calcul.</p>
        </form>
        <section class="sme-results" data-sme-results hidden tabindex="-1">
          <h2>Résultat</h2>
          <dl class="sme-metrics" data-sme-metrics></dl>
          <pre data-sme-document hidden style="white-space:pre-wrap;overflow-wrap:anywhere"></pre>
          <p class="sme-boundary" data-sme-boundary></p>
        </section>
      </section>
      <aside class="sme-card sme-aside">
        <h2>Avant de décider</h2>
        <ul>
          <li>Utilisez des devis, relevés ou exports datés.</li>
          <li>Conservez le même périmètre lorsque vous comparez deux scénarios.</li>
          <li>Confirmez les règles fiscales, douanières, juridiques ou réglementaires auprès de la source compétente.</li>
        </ul>
        <p><a href="/ai/?tool=${encodeURIComponent(route.id)}&lang=fr">Demander une explication à AfroTools AI</a>. L’ouverture de l’assistant est volontaire; les valeurs de ce formulaire ne sont pas envoyées.</p>
        <p><a href="${englishPath}" hreflang="en">Voir la version anglaise</a></p>
      </aside>
    </div>
  </main>
  <afro-footer></afro-footer>
  <script id="sme-parity-config" type="application/json">${config.replace(/</g, "\\u003c")}</script>
</body>
</html>
`;
}

function hub() {
  const cards = routes.map((route) => `<li><a href="/fr/tools/${route.slug}/"><strong>${escapeHtml(route.title)}</strong><span>${escapeHtml(route.description)}</span></a></li>`).join("");
  const collection = routes.map((route, index) => ({ "@type": "ListItem", position: index + 1, url: `https://afrotools.com/fr/tools/${route.slug}/`, name: route.title }));
  return `<!doctype html>
<html lang="fr" data-theme-choice="auto">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Outils gratuits pour petites entreprises et PME — AfroTools</title>
  <meta name="description" content="28 applications gratuites en français pour trésorerie, coûts, prix, contrats, production et pilotage des PME africaines.">
  <link rel="canonical" href="https://afrotools.com/fr/small-business/">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/small-business/">
  <link rel="alternate" hreflang="en" href="https://afrotools.com/small-business/">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com/small-business/">
  <meta property="og:title" content="Outils gratuits pour petites entreprises et PME — AfroTools">
  <meta property="og:description" content="28 applications françaises natives pour piloter une PME.">
  <meta property="og:url" content="https://afrotools.com/fr/small-business/">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/startup-runway.webp">
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: "Outils PME AfroTools", url: "https://afrotools.com/fr/small-business/", inLanguage: "fr", mainEntity: { "@type": "ItemList", numberOfItems: 28, itemListElement: collection } })}</script>
  <style>
    body{margin:0;background:var(--color-bg,#f5f7fb);color:var(--color-text,#0f172a);font-family:var(--font-sans,"DM Sans",system-ui,sans-serif)}
    main{max-width:1180px;margin:auto;padding:clamp(1rem,4vw,3rem)}header{padding:clamp(1.5rem,5vw,4rem) 0}h1{font-size:clamp(2.2rem,6vw,4.4rem);line-height:1;margin:.5rem 0;max-width:16ch}
    .lead{max-width:68ch;font-size:1.12rem;line-height:1.7;color:var(--color-text-muted,#526079)}.count{font-weight:800;color:var(--color-primary,#1769d2)}
    ul{list-style:none;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}li a{height:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:.55rem;padding:1.2rem;border:1px solid var(--color-border,#dbe3ef);border-radius:18px;background:var(--color-surface,#fff);color:inherit;text-decoration:none}
    li a:hover{border-color:var(--color-primary,#1769d2)}li span{color:var(--color-text-muted,#526079);line-height:1.5;font-size:.92rem}:focus-visible{outline:3px solid #2563eb;outline-offset:3px}
    @media(max-width:850px){ul{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){ul{grid-template-columns:1fr}}
  </style>
  <script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script><script src="/assets/js/lib/dark-mode.js" defer></script>
</head>
<body data-parity-root="fr-small-business-sme-parity"><afro-navbar></afro-navbar><main><nav aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> · <span aria-current="page">Petites entreprises et PME</span></nav><header><div class="count">28 applications gratuites · calcul local</div><h1>Outils PME qui vont jusqu’au résultat</h1><p class="lead">Trésorerie, coûts, devis, production, contrats et mesure opérationnelle. Chaque application ci-dessous fonctionne en français, garde les données dans le navigateur et explique ses limites.</p></header><ul>${cards}</ul></main><afro-footer></afro-footer></body></html>`;
}

function ensureReciprocal(route) {
  const file = path.join(ROOT, "tools", route.id, "index.html");
  if (!fs.existsSync(file)) throw new Error(`English owner missing: ${file}`);
  let html = fs.readFileSync(file, "utf8");
  const href = `https://afrotools.com/fr/tools/${route.slug}/`;
  if (html.includes(`hreflang="fr" href="${href}"`)) return;
  const tag = `\n<link rel="alternate" hreflang="fr" href="${href}">`;
  const canonical = html.match(/<link rel="canonical"[^>]*>/i);
  if (!canonical) throw new Error(`Canonical missing: ${file}`);
  html = html.replace(canonical[0], `${canonical[0]}${tag}`);
  fs.writeFileSync(file, html, "utf8");
}

function ensureHubReciprocal() {
  const file = path.join(ROOT, "small-business", "index.html");
  let html = fs.readFileSync(file, "utf8");
  const href = "https://afrotools.com/fr/small-business/";
  if (html.includes(`hreflang="fr" href="${href}"`)) return;
  const canonical = html.match(/<link rel="canonical"[^>]*>/i);
  if (!canonical) throw new Error(`Canonical missing: ${file}`);
  html = html.replace(canonical[0], `${canonical[0]}\n<link rel="alternate" hreflang="fr" href="${href}">`);
  fs.writeFileSync(file, html, "utf8");
}

function build() {
  const accepted = process.argv.includes("--accept");
  if (routes.length !== 28 || new Set(routes.map((route) => route.id)).size !== 28 || new Set(routes.map((route) => route.slug)).size !== 28) {
    throw new Error("SME parity denominator must remain exactly 28 unique routes.");
  }
  routes.forEach((route) => {
    const dir = path.join(ROOT, "fr", "tools", route.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), page(route), "utf8");
    ensureReciprocal(route);
  });
  ensureHubReciprocal();
  fs.mkdirSync(path.join(ROOT, "fr", "small-business"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "fr", "small-business", "index.html"), hub(), "utf8");
  const manifest = {
    schemaVersion: 1,
    baseline: BASELINE,
    category: "Small Business & SME",
    categoryKey: "small-business",
    denominator: 28,
    acceptance: "fail-closed",
    routes: routes.map((route) => ({
      id: route.id,
      english: slash(`/tools/${route.id}`),
      french: slash(`/fr/tools/${route.slug}`),
      owner: "AfroTools.smallBusinessParity",
      export: route.export,
      artwork: `assets/img/tools/${route.id}.webp`,
      state: accepted ? "accepted" : "pending-browser-and-oracle-proof"
    }))
  };
  const manifestDir = path.join(ROOT, "data", "localization");
  fs.mkdirSync(manifestDir, { recursive: true });
  fs.writeFileSync(path.join(manifestDir, "fr-small-business-parity.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Built ${routes.length} native French SME owners plus /fr/small-business/ (${accepted ? "accepted" : "pending proof"}).`);
}

build();
