#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "data", "localization", "sw-business-roi-parity.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const checkOnly = process.argv.includes("--check");

const currencies = [
  ["KES", "Shilingi ya Kenya"],
  ["TZS", "Shilingi ya Tanzania"],
  ["UGX", "Shilingi ya Uganda"],
  ["RWF", "Faranga ya Rwanda"],
  ["BIF", "Faranga ya Burundi"],
  ["CDF", "Faranga ya Kongo"],
  ["NGN", "Naira"],
  ["GHS", "Cedi"],
  ["ZAR", "Randi"],
  ["XOF", "Faranga CFA (BCEAO)"],
  ["XAF", "Faranga CFA (BEAC)"],
  ["USD", "Dola ya Marekani"],
  ["EUR", "Euro"]
];

function escapeHtml(value) {
  return String(value === undefined || value === null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function routeToFile(route) {
  return path.join(root, route.replace(/^\//, ""), "index.html");
}

function writeIfChanged(file, content) {
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === content) return false;
  if (checkOnly) {
    throw new Error(`Generated Swahili Business & ROI page is stale: ${path.relative(root, file)}`);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  return true;
}

function fieldMarkup(field) {
  const id = `f-${field.name}`;
  const required = field.required ? " required" : "";
  const choices = field.type === "currency" ? currencies : field.choices;
  if (choices) {
    return `<div class="sw-business-field"><label for="${id}">${escapeHtml(field.label)}</label><select id="${id}" name="${escapeHtml(field.name)}"${required}>${choices.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("")}</select></div>`;
  }
  if (field.type === "textarea") {
    return `<div class="sw-business-field"><label for="${id}">${escapeHtml(field.label)}</label><textarea id="${id}" name="${escapeHtml(field.name)}"${required}${field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : ""}>${escapeHtml(field.value || "")}</textarea></div>`;
  }
  if (field.type === "checkbox") {
    return `<label class="sw-business-check" for="${id}"><input id="${id}" name="${escapeHtml(field.name)}" type="checkbox"${required}><span>${escapeHtml(field.label)}</span></label>`;
  }
  return `<div class="sw-business-field"><label for="${id}">${escapeHtml(field.label)}</label><input id="${id}" name="${escapeHtml(field.name)}" type="${escapeHtml(field.type)}"${required}${field.min !== undefined ? ` min="${escapeHtml(field.min)}"` : ""}${field.max !== undefined ? ` max="${escapeHtml(field.max)}"` : ""}${field.step !== undefined ? ` step="${escapeHtml(field.step)}"` : ""}${field.value !== undefined ? ` value="${escapeHtml(field.value)}"` : ""}></div>`;
}

function alternateTags(route) {
  return [
    `<link rel="alternate" hreflang="sw" href="https://afrotools.com${route.swahili}">`,
    `<link rel="alternate" hreflang="en" href="https://afrotools.com${route.english}">`,
    `<link rel="alternate" hreflang="fr" href="https://afrotools.com${route.french}">`,
    `<link rel="alternate" hreflang="x-default" href="https://afrotools.com${route.english}">`
  ].join("\n");
}

function pageHtml(route) {
  const canonical = `https://afrotools.com${route.swahili}`;
  const image = `https://afrotools.com/${route.artwork}`;
  const formats = ["pdf", "csv", "json", "txt"].concat(route.extraFormats || []);
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: route.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "sw",
    isAccessibleForFree: true,
    url: canonical,
    image,
    description: route.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "AfroTools", item: "https://afrotools.com/sw/" },
      { "@type": "ListItem", position: 2, name: "Data na Tija", item: "https://afrotools.com/sw/data-na-tija/" },
      { "@type": "ListItem", position: 3, name: route.name, item: canonical }
    ]
  };
  return `<!doctype html>
<html lang="sw" data-theme="light" data-theme-choice="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(route.title)}</title>
<meta name="description" content="${escapeHtml(route.description)}">
<link rel="canonical" href="${canonical}">
${alternateTags(route)}
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(route.title)}">
<meta property="og:description" content="${escapeHtml(route.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta property="og:locale" content="sw_KE">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(route.title)}">
<meta name="twitter:description" content="${escapeHtml(route.description)}">
<meta name="twitter:image" content="${image}">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/design-system.css">
<link rel="stylesheet" href="/assets/css/sw-business-roi-parity.css">
<script>window.AfroLocalOnly=true;</script>
<script src="/engines/business-roi-engine.js"></script>
<script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
<script src="/assets/js/pages/sw-business-roi-parity.js" defer></script>
<script src="/assets/js/components/navbar.min.js" defer></script>
<script src="/assets/js/components/footer.min.js" defer></script>
<script src="/assets/js/components/related-tools.min.js" defer></script>
</head>
<body class="sw-business-page">
<a class="skip-link" href="#zana">Ruka hadi kwenye zana</a>
<afro-navbar></afro-navbar>
<header class="sw-business-hero">
  <div class="sw-business-wrap">
    <nav class="sw-business-breadcrumbs" aria-label="Njia ya ukurasa"><a href="/sw/">Mwanzo</a><span aria-hidden="true">/</span><a href="/sw/data-na-tija/">Data na Tija</a><span aria-hidden="true">/</span><span>${escapeHtml(route.name)}</span></nav>
    <p class="sw-business-eyebrow">Hufanya kazi kwenye kivinjari</p>
    <h1>${escapeHtml(route.name)}</h1>
    <p>${escapeHtml(route.intro)}</p>
  </div>
</header>
<main id="zana" class="sw-business-wrap sw-business-layout" data-business-app data-tool="${escapeHtml(route.id)}">
  <section class="sw-business-panel" aria-labelledby="vigezo-title">
    <h2 id="vigezo-title">Weka vigezo vyako</h2>
    <form data-business-form novalidate>
      <div class="sw-business-fields">${route.fields.map(fieldMarkup).join("")}</div>
      <button class="sw-business-primary" type="submit">Kokotoa na kuandaa matokeo</button>
      <p class="sw-business-status" data-business-status role="status" aria-live="polite"></p>
    </form>
  </section>
  <section class="sw-business-panel sw-business-result" data-business-result hidden tabindex="-1" aria-labelledby="matokeo-title">
    <h2 id="matokeo-title" data-result-title>Matokeo</h2>
    <p data-result-summary></p>
    <div class="sw-business-metrics" data-result-metrics></div>
    <table class="sw-business-details"><caption class="sr-only">Maelezo ya matokeo</caption><tbody data-result-rows></tbody></table>
    <div class="sw-business-actions" aria-label="Hifadhi au toa matokeo">${formats.map((format) => `<button type="button" data-export="${format}">${format.toUpperCase()}</button>`).join("")}<button type="button" data-action="copy">Nakili</button><button type="button" data-action="save">Hifadhi kwenye kifaa</button><button type="button" data-action="print">Chapisha</button></div>
    <div class="sw-business-boundary"><strong>Faragha:</strong> Matokeo hutengenezwa ndani ya kivinjari. Hakuna akaunti, upakiaji wala kutuma maelezo kwa AI. Thibitisha tarehe, sera, hati au maamuzi rasmi kwenye chanzo kinachohusika.</div>
    <p class="sw-business-source">Msingi wa hesabu: <a class="sw-business-link" href="${route.english}">zana ya Kiingereza inayolingana</a>, injini ya pamoja ya hesabu na vigezo ulivyoingiza.</p>
  </section>
</main>
<afro-related-tools category="data-productivity" current="${escapeHtml(route.id)}"></afro-related-tools>
<afro-footer></afro-footer>
</body>
</html>
`;
}

function hubHtml() {
  const hub = manifest.hub;
  const canonical = `https://afrotools.com${hub.route}`;
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Zana 12 za Data na Tija kwa Kiswahili",
    numberOfItems: manifest.routes.length,
    itemListElement: manifest.routes.map((route, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: route.name,
      url: `https://afrotools.com${route.swahili}`
    }))
  };
  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: hub.name,
    url: canonical,
    description: hub.description,
    inLanguage: "sw",
    mainEntity: itemList
  };
  return `<!doctype html>
<html lang="sw" data-theme="light" data-theme-choice="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(hub.title)}</title>
<meta name="description" content="${escapeHtml(hub.description)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="sw" href="${canonical}">
<link rel="alternate" hreflang="en" href="https://afrotools.com${hub.english}">
<link rel="alternate" hreflang="fr" href="https://afrotools.com${hub.french}">
<link rel="alternate" hreflang="x-default" href="https://afrotools.com${hub.english}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(hub.title)}">
<meta property="og:description" content="${escapeHtml(hub.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="https://afrotools.com/assets/img/og/og-default.png">
<meta property="og:locale" content="sw_KE">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(collection)}</script>
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/design-system.css">
<link rel="stylesheet" href="/assets/css/sw-business-roi-parity.css">
<script>window.AfroLocalOnly=true;</script>
<script src="/assets/js/components/navbar.min.js" defer></script>
<script src="/assets/js/components/footer.min.js" defer></script>
</head>
<body class="sw-business-page">
<a class="skip-link" href="#zana">Ruka hadi kwenye zana</a>
<afro-navbar></afro-navbar>
<header class="sw-business-hero">
  <div class="sw-business-wrap">
    <nav class="sw-business-breadcrumbs" aria-label="Njia ya ukurasa"><a href="/sw/">Mwanzo</a><span aria-hidden="true">/</span><span>Data na Tija</span></nav>
    <p class="sw-business-eyebrow">Zana 12 zilizopangwa kwa kazi halisi</p>
    <h1>Data na Tija</h1>
    <p>Panga muda, badilisha vipimo, tengeneza bajeti, hesabu tarehe na gharama, au fuatilia alama. Kila programu ina kazi moja iliyo wazi na huhifadhi maelezo yako kwenye kivinjari.</p>
    <div class="sw-business-hub-intro"><a class="sw-business-cta" href="/sw/zana/pomodoro/">Anza na Pomodoro</a><a class="sw-business-cta sw-business-cta-secondary" href="/sw/ai/">Uliza AfroTools AI ikuelekeze</a></div>
  </div>
</header>
<main id="zana" class="sw-business-wrap">
  <section class="sw-business-grid" aria-label="Zana za Data na Tija">
    ${manifest.routes.map((route) => `<article class="sw-business-card" data-business-card="${escapeHtml(route.id)}"><img src="/${route.artwork}" alt="" width="640" height="360" loading="lazy"><div class="sw-business-card-body"><h2>${escapeHtml(route.name)}</h2><p>${escapeHtml(route.description)}</p><a href="${route.swahili}">Fungua zana<span class="sr-only">: ${escapeHtml(route.name)}</span></a></div></article>`).join("\n    ")}
  </section>
</main>
<afro-footer></afro-footer>
<script src="/assets/js/lib/sw-accessibility.js" defer></script>
</body>
</html>
`;
}

if (manifest.denominator !== manifest.routes.length) {
  throw new Error(`Manifest denominator ${manifest.denominator} does not match ${manifest.routes.length} routes.`);
}

let changed = 0;
for (const route of manifest.routes) {
  if (writeIfChanged(routeToFile(route.swahili), pageHtml(route))) changed += 1;
}
if (writeIfChanged(routeToFile(manifest.hub.route), hubHtml())) changed += 1;
console.log(`Swahili Business & ROI parity: ${manifest.routes.length} apps + 1 hub; ${checkOnly ? "source ownership current" : `${changed} files changed`}.`);
