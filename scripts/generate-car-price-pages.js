const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "data/cars/price-intelligence.json"), "utf8"));
const generatedRoutes = [];

function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\/.*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writePage(routePath, meta) {
  const file = path.join(root, routePath, "index.html");
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, html(routePath, meta), "utf8");
  generatedRoutes.push(routePath);
}

function canonical(routePath) {
  return "https://afrotools.com/" + routePath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "") + "/";
}

function schema(meta, routePath) {
  const crumbs = [
    { "@type": "ListItem", position: 1, name: "AfroTools", item: "https://afrotools.com/" },
    { "@type": "ListItem", position: 2, name: "Cars", item: "https://afrotools.com/cars/" }
  ];
  if (meta.country) crumbs.push({ "@type": "ListItem", position: 3, name: meta.country, item: `https://afrotools.com/cars/${slug(meta.country)}/` });
  if (meta.make) crumbs.push({ "@type": "ListItem", position: crumbs.length + 1, name: meta.make, item: canonical(routePath) });
  return JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "AfroTools Car Price Intelligence",
      url: canonical(routePath),
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      description: meta.description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@type": "Organization", name: "AfroTools", url: "https://afrotools.com" }
    },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: data.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer }
      }))
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: meta.title,
      itemListElement: data.vehicles.slice(0, 12).map((vehicle, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      }))
    }
  ], null, 2).replace(/</g, "\\u003c");
}

function html(routePath, meta) {
  return `<!DOCTYPE html>
<html lang="en" data-chat-bundle="/assets/js/components/chat-panel.min.js">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}">
  <link rel="canonical" href="${canonical(routePath)}">
  <meta name="robots" content="index, follow">
  <meta name="tool-id" content="car-price-intelligence">
  <meta property="og:title" content="${escapeHtml(meta.title)}">
  <meta property="og:description" content="${escapeHtml(meta.description)}">
  <meta property="og:url" content="${canonical(routePath)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="AfroTools">
  <meta property="og:image" content="https://afrotools.com/assets/img/og/og-cars.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://afrotools.com/assets/img/og/og-cars.webp">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"></noscript>
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <link rel="stylesheet" href="/assets/css/tokens.min.css">
  <link rel="stylesheet" href="/assets/css/global.min.css">
  <link rel="stylesheet" href="/assets/css/cars-directory.css">
  <script type="application/ld+json">${schema(meta, routePath)}</script>
</head>
<body class="cars-page">
  <afro-navbar active="transport"></afro-navbar>
  <main class="cars-shell"><noscript><section class="cars-panel"><h1>${escapeHtml(meta.title)}</h1><p>${escapeHtml(meta.description)}</p></section></noscript><div id="carsApp"></div></main>
  <afro-footer></afro-footer>
  <script src="/assets/js/components/navbar.min.js?v=43e4d9b2" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
  <script src="/assets/js/lib/analytics.js" defer></script>
  <script src="/assets/js/afro-history.js" defer></script>
  <script src="/assets/js/components/save-result-button.js" defer></script>
  <script src="/assets/js/lib/export-tools.js" defer></script>
  <script src="/assets/js/lib/share-state.js" defer></script>
  <script src="/assets/js/lib/car-import-cost-engine.js" defer></script>
  <script src="/assets/js/lib/car-price-intelligence.js" defer></script>
  <script src="/assets/js/cars-directory.js" defer></script>
</body>
</html>
`;
}

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function writeSitemap() {
  const urls = generatedRoutes
    .sort()
    .map((routePath) => `  <url><loc>${canonical(routePath)}</loc><lastmod>2026-05-03</lastmod><changefreq>weekly</changefreq><priority>${routePath === "cars" ? "0.9" : "0.7"}</priority></url>`)
    .join("\n");
  fs.writeFileSync(path.join(root, "sitemap-cars.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, "utf8");
}

writePage("cars", {
  title: "African Car Price Directory | Import vs Local Landed Cost | AfroTools",
  description: "Search popular imported cars across 20 major African markets with live local-currency price bands, source price, landed-cost estimate, local asking range, financing, and risk layers."
});
writePage("cars/compare", {
  title: "Compare Car Source Markets | Japan, UAE, UK, South Africa | AfroTools",
  description: "Compare source-market price, shipping assumptions, landed cost, local dealer ranges, financing outlook, and risk layers for African car imports."
});

Object.values(data.countries).filter((country) => country.directory_enabled !== false).forEach((country) => {
  writePage(`cars/${country.slug}`, {
    title: `${country.name} Car Import Price Directory | AfroTools`,
    description: `Search car landed-cost and local asking-price ranges in ${country.currency_code || "local currency"} for ${country.name}, including source-market comparisons, financing outlook, and import-vs-local recommendations.`,
    country: country.name
  });

  const makes = new Map();
  data.vehicles.forEach((vehicle) => {
    if (!makes.has(vehicle.makeSlug)) makes.set(vehicle.makeSlug, vehicle.make);
  });
  makes.forEach((makeName, makeSlug) => {
    writePage(`cars/${country.slug}/${makeSlug}`, {
      title: `${makeName} Landed Car Prices in ${country.name} | AfroTools`,
      description: `Browse ${makeName} model and year estimates in ${country.name}: source price range, landed-cost range, local asking range, financing outlook, and import-vs-local recommendation.`,
      country: country.name,
      make: makeName
    });
  });

  const models = new Map();
  data.vehicles.forEach((vehicle) => {
    const key = `${vehicle.makeSlug}/${vehicle.modelSlug}`;
    if (!models.has(key)) models.set(key, vehicle);
  });
  models.forEach((vehicle, key) => {
    writePage(`cars/${country.slug}/${key}`, {
      title: `${vehicle.make} ${vehicle.model} Landed Prices in ${country.name} | AfroTools`,
      description: `Compare ${vehicle.make} ${vehicle.model} year variants in ${country.name} with source-market price, landed-cost, local asking, financing, and risk ranges.`,
      country: country.name,
      make: vehicle.make
    });
  });

  data.vehicles.forEach((vehicle) => {
    writePage(`cars/${country.slug}/${vehicle.makeSlug}/${vehicle.modelSlug}/${vehicle.year}`, {
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model} Price in ${country.name} | Import vs Local | AfroTools`,
      description: `Estimate ${vehicle.year} ${vehicle.make} ${vehicle.model} source price, landed cost, local asking range, financing outlook, compliance risk, liquidity, and import-vs-local recommendation for ${country.name}.`,
      country: country.name,
      make: vehicle.make
    });
    writePage(`cars/import-vs-local/${country.slug}/${vehicle.makeSlug}/${vehicle.modelSlug}/${vehicle.year}`, {
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model}: Import vs Local in ${country.name} | AfroTools`,
      description: `Compare importing a ${vehicle.year} ${vehicle.make} ${vehicle.model} versus buying locally in ${country.name}, with source-market, landed-cost, financing, and risk layers.`,
      country: country.name,
      make: vehicle.make
    });
  });
});

writeSitemap();
console.log("Generated car price directory pages");
