const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "data/cars/price-intelligence.json"), "utf8"));
const forex = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, "data/forex/latest.json"), "utf8"));
  } catch (err) {
    return { rates: {} };
  }
})();
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
  generatedRoutes.push({ routePath, sitemap: meta.noindex !== true });
}

function canonical(routePath) {
  return "https://afrotools.com/" + routePath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "") + "/";
}

function fxRate(country) {
  if (!country || !country.currency_code) return null;
  if (country.currency_code === "USD") return 1;
  const rate = forex && forex.rates ? forex.rates[country.currency_code] : null;
  return typeof rate === "number" && rate > 0 ? rate : null;
}

function formatMoney(amount, currency) {
  const rounded = amount >= 10000 ? Math.round(amount / 100) * 100 : Math.round(amount);
  return `${currency} ${rounded.toLocaleString("en-US")}`;
}

function priceBandCells(vehicle, country) {
  const [low, , high] = vehicle.price;
  const usd = `$${low.toLocaleString("en-US")}–$${high.toLocaleString("en-US")}`;
  const rate = fxRate(country);
  if (!rate || country.currency_code === "USD") return { local: usd, usd };
  const local = `${formatMoney(low * rate, country.currency_symbol || country.currency_code)} – ${formatMoney(high * rate, country.currency_symbol || country.currency_code)}`;
  return { local, usd };
}

function vehicleRow(vehicle, country, linkPrefix) {
  const cells = priceBandCells(vehicle, country);
  const name = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const label = linkPrefix
    ? `<a href="${linkPrefix}/${vehicle.makeSlug}/${vehicle.modelSlug}/${vehicle.year}/">${escapeHtml(name)}</a>`
    : escapeHtml(name);
  return `<tr><td>${label}</td><td>${escapeHtml(vehicle.body || "")}</td><td>${escapeHtml(cells.local)}</td><td>${escapeHtml(cells.usd)}</td></tr>`;
}

function vehicleTableHTML(vehicles, country, linkPrefix, caption) {
  if (!vehicles.length) return "";
  const rows = vehicles.map((vehicle) => vehicleRow(vehicle, country, linkPrefix)).join("\n");
  const fxNote = fxRate(country) && country.currency_code !== "USD"
    ? ` Local amounts use the AfroTools reference FX snapshot and update live inside the directory.`
    : "";
  return `<section class="cars-panel cars-static-summary">
<h2>${escapeHtml(caption)}</h2>
<table>
<thead><tr><th>Vehicle</th><th>Body</th><th>Source price band (${escapeHtml(country ? country.currency_code : "USD")})</th><th>USD reference</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
<p class="cars-static-note">Source-market price bands are planning estimates from the AfroTools car dataset (updated ${escapeHtml(latestVehicleUpdate(vehicles))}). Use the interactive directory above for landed-cost, duty, and import-vs-local recommendations.${fxNote}</p>
</section>`;
}

function latestVehicleUpdate(vehicles) {
  return vehicles.reduce((latest, vehicle) => (vehicle.lastUpdated > latest ? vehicle.lastUpdated : latest), "") || "recently";
}

function countryEditorialHTML(country) {
  const content = data.countryContent && data.countryContent[country.code];
  if (!content) return "";
  const parts = [];
  if (content.intro) parts.push(`<p>${escapeHtml(content.intro)}</p>`);
  if (content.hiddenCosts) parts.push(`<p><strong>Hidden costs to budget for:</strong> ${escapeHtml(content.hiddenCosts)}</p>`);
  if (content.riskCopy) parts.push(`<p><strong>Age and compliance risk:</strong> ${escapeHtml(content.riskCopy)}</p>`);
  if (!parts.length) return "";
  return `<section class="cars-panel cars-static-summary">
<h2>Buying or importing a car in ${escapeHtml(country.name)}</h2>
${parts.join("\n")}
</section>`;
}

function vehicleDetailHTML(vehicle, country) {
  const cells = priceBandCells(vehicle, country);
  const specs = [
    ["Trim", vehicle.trim],
    ["Engine", Array.isArray(vehicle.cc) ? vehicle.cc.map((cc) => `${cc} cc`).join(" / ") : vehicle.cc],
    ["Fuel", Array.isArray(vehicle.fuel) ? vehicle.fuel.join(", ") : vehicle.fuel],
    ["Transmission", Array.isArray(vehicle.transmissions) ? vehicle.transmissions.join(", ") : vehicle.transmissions],
    ["Typical mileage", vehicle.mileage],
    ["Typical condition", vehicle.condition],
    ["Common source markets", Array.isArray(vehicle.sources) ? vehicle.sources.join(", ") : vehicle.sources],
    [`Source price band (${country.currency_code})`, cells.local],
    ["USD reference band", cells.usd],
    ["Data confidence", vehicle.confidence],
    ["Last updated", vehicle.lastUpdated]
  ].filter(([, value]) => value);
  const rows = specs.map(([label, value]) => `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(String(value))}</td></tr>`).join("\n");
  return `<section class="cars-panel cars-static-summary">
<h2>${escapeHtml(`${vehicle.year} ${vehicle.make} ${vehicle.model}`)} — ${escapeHtml(country.name)} planning snapshot</h2>
<table>
<tbody>
${rows}
</tbody>
</table>
<p class="cars-static-note">These are dataset planning estimates, not dealer quotes. Run the interactive estimate above for landed cost with current duty rules, shipping, and FX for ${escapeHtml(country.name)}.</p>
</section>`;
}

function staticContentHTML(meta) {
  if (!meta.pageType) return "";
  const country = meta.countryObj;
  if (meta.pageType === "country") {
    return countryEditorialHTML(country) + vehicleTableHTML(data.vehicles, country, `/cars/${country.slug}`, `Popular imports tracked for ${country.name}`);
  }
  if (meta.pageType === "make") {
    const vehicles = data.vehicles.filter((vehicle) => vehicle.makeSlug === meta.makeSlug);
    return vehicleTableHTML(vehicles, country, `/cars/${country.slug}`, `${meta.make} price bands in ${country.name}`);
  }
  if (meta.pageType === "model") {
    const vehicles = data.vehicles.filter((vehicle) => vehicle.makeSlug === meta.makeSlug && vehicle.modelSlug === meta.modelSlug);
    return vehicleTableHTML(vehicles, country, `/cars/${country.slug}`, `${meta.make} ${meta.model} year variants in ${country.name}`);
  }
  if (meta.pageType === "vehicle" || meta.pageType === "import-vs-local") {
    return vehicleDetailHTML(meta.vehicleObj, country);
  }
  return "";
}

function schema(meta, routePath) {
  const crumbs = [
    { "@type": "ListItem", position: 1, name: "AfroTools", item: "https://afrotools.com/" },
    { "@type": "ListItem", position: 2, name: "Cars", item: "https://afrotools.com/cars/" }
  ];
  if (meta.country) crumbs.push({ "@type": "ListItem", position: 3, name: meta.country, item: `https://afrotools.com/cars/${slug(meta.country)}/` });
  if (meta.make) crumbs.push({ "@type": "ListItem", position: crumbs.length + 1, name: meta.make, item: canonical(routePath) });
  const blocks = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "AfroTools Car Price Intelligence",
      url: canonical(meta.canonicalRoute || routePath),
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      description: meta.description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@type": "Organization", name: "AfroTools", url: "https://afrotools.com" }
    },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs }
  ];
  if (meta.includeFaq) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: data.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer }
      }))
    });
  }
  const listVehicles = meta.listVehicles || [];
  if (listVehicles.length > 1) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: meta.title,
      itemListElement: listVehicles.slice(0, 12).map((vehicle, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      }))
    });
  }
  return JSON.stringify(blocks, null, 2).replace(/</g, "\\u003c");
}

function html(routePath, meta) {
  const canonicalUrl = canonical(meta.canonicalRoute || routePath);
  return `<!DOCTYPE html>
<html lang="en" data-chat-bundle="/assets/js/components/chat-panel.min.js">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}">
  <link rel="canonical" href="${canonicalUrl}">
  <meta name="robots" content="${meta.noindex ? "noindex, follow" : "index, follow"}">
  <meta name="tool-id" content="car-price-intelligence">
  <meta property="og:title" content="${escapeHtml(meta.title)}">
  <meta property="og:description" content="${escapeHtml(meta.description)}">
  <meta property="og:url" content="${canonicalUrl}">
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
  <main class="cars-shell"><noscript><section class="cars-panel"><h1>${escapeHtml(meta.title)}</h1><p>${escapeHtml(meta.description)}</p></section></noscript><div id="carsApp"></div>${staticContentHTML(meta)}</main>
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
    .filter((entry) => entry.sitemap)
    .map((entry) => entry.routePath)
    .sort()
    .map((routePath) => `  <url><loc>${canonical(routePath)}</loc><lastmod>2026-05-03</lastmod><changefreq>weekly</changefreq><priority>${routePath === "cars" ? "0.9" : "0.7"}</priority></url>`)
    .join("\n");
  fs.writeFileSync(path.join(root, "sitemap-cars.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, "utf8");
}

writePage("cars", {
  title: "African Car Price Directory | Import vs Local Landed Cost | AfroTools",
  description: "Compare imported cars across 20 African markets with local-currency price bands, landed-cost estimates, asking ranges, finance fit, and import-risk context.",
  includeFaq: true,
  listVehicles: data.vehicles
});
writePage("cars/compare", {
  title: "Compare Car Source Markets | Japan, UAE, UK, South Africa | AfroTools",
  description: "Compare source-market price, shipping assumptions, landed cost, local dealer ranges, financing outlook, and risk layers for African car imports."
});

Object.values(data.countries).filter((country) => country.directory_enabled !== false).forEach((country) => {
  writePage(`cars/${country.slug}`, {
    title: `${country.name} Car Import Price Directory | AfroTools`,
    description: `Search car landed-cost and local asking-price ranges in ${country.currency_code || "local currency"} for ${country.name}, including source-market comparisons, financing outlook, and import-vs-local recommendations.`,
    country: country.name,
    countryObj: country,
    pageType: "country",
    includeFaq: true,
    listVehicles: data.vehicles
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
      countryObj: country,
      make: makeName,
      makeSlug,
      pageType: "make",
      listVehicles: data.vehicles.filter((vehicle) => vehicle.makeSlug === makeSlug)
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
      countryObj: country,
      make: vehicle.make,
      makeSlug: vehicle.makeSlug,
      modelSlug: vehicle.modelSlug,
      model: vehicle.model,
      pageType: "model",
      listVehicles: data.vehicles.filter((v) => v.makeSlug === vehicle.makeSlug && v.modelSlug === vehicle.modelSlug)
    });
  });

  data.vehicles.forEach((vehicle) => {
    writePage(`cars/${country.slug}/${vehicle.makeSlug}/${vehicle.modelSlug}/${vehicle.year}`, {
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model} Price in ${country.name} | Import vs Local | AfroTools`,
      description: `Estimate ${vehicle.year} ${vehicle.make} ${vehicle.model} source price, landed cost, local asking range, financing outlook, compliance risk, liquidity, and import-vs-local recommendation for ${country.name}.`,
      country: country.name,
      countryObj: country,
      make: vehicle.make,
      pageType: "vehicle",
      vehicleObj: vehicle
    });
    // Same vehicle data with different framing — keep for users/app deep links,
    // but canonicalize to the vehicle page and keep out of sitemaps/index.
    writePage(`cars/import-vs-local/${country.slug}/${vehicle.makeSlug}/${vehicle.modelSlug}/${vehicle.year}`, {
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model}: Import vs Local in ${country.name} | AfroTools`,
      description: `Compare importing a ${vehicle.year} ${vehicle.make} ${vehicle.model} versus buying locally in ${country.name}, with source-market, landed-cost, financing, and risk layers.`,
      country: country.name,
      countryObj: country,
      make: vehicle.make,
      pageType: "import-vs-local",
      vehicleObj: vehicle,
      noindex: true,
      canonicalRoute: `cars/${country.slug}/${vehicle.makeSlug}/${vehicle.modelSlug}/${vehicle.year}`
    });
  });
});

writeSitemap();
console.log("Generated car price directory pages");
