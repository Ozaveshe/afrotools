const fs = require("fs");
const path = require("path");
const { addHelperScript, addSourceHook } = require("./apply-source-confidence-hooks");

const root = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "data/cars/price-intelligence.json"), "utf8"));
const marketObservations = JSON.parse(fs.readFileSync(path.join(root, "data/cars/market-observations.json"), "utf8")).observations;
const contentRevisionDate = "2026-09-27";
function parseCsvRows(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index], next = text[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const header = rows.shift() || [];
  return rows.map((cells) => Object.fromEntries(header.map((key, index) => [key, cells[index] || ""])));
}
const catalogOptions = [
  ...parseCsvRows(fs.readFileSync(path.join(root, "data/cars/master-vehicle-catalog.csv"), "utf8")),
  ...parseCsvRows(fs.readFileSync(path.join(root, "data/cars/import-duty-vehicle-estimates.csv"), "utf8"))
]
  .filter((row) => row.vehicle_id && row.make && row.model && /^\d{4}$/.test(row.year))
  .sort((left, right) => left.make.localeCompare(right.make) || left.model.localeCompare(right.model) || Number(right.year) - Number(left.year));
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
  let output = html(routePath, meta);
  if (routePath === "cars") {
    const relativePath = "cars/index.html";
    const hook = addSourceHook(output, "ledger-tool-car-price-intelligence", relativePath);
    if (hook.action === "conflict") throw new Error(hook.message);
    const helper = addHelperScript(hook.html, relativePath);
    if (helper.action === "conflict") throw new Error(helper.message);
    output = helper.html;
  }
  fs.writeFileSync(file, output, "utf8");
  generatedRoutes.push({ routePath, sitemap: meta.noindex !== true, lastmod: meta.lastmod || contentRevisionDate });
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

function marketObservation(country, vehicle) {
  return marketObservations.find((entry) => entry.countryCode === country.code && entry.vehicleId === vehicle.id) || null;
}

function countryMarketHTML(country) {
  const observations = data.vehicles
    .map((vehicle) => ({ vehicle, observation: marketObservation(country, vehicle) }))
    .filter((entry) => entry.observation);
  if (!observations.length) return "";
  const rows = observations.map(({ vehicle, observation }) =>
    `<li><a href="/cars/${country.slug}/${vehicle.makeSlug}/${vehicle.modelSlug}/${vehicle.year}/">${escapeHtml(`${vehicle.year} ${vehicle.make} ${vehicle.model}`)}</a> — ${escapeHtml(formatMoney(observation.median, observation.currency))} median asking price from ${observation.sampleSize} ${escapeHtml(observation.condition)} listings in ${escapeHtml(observation.market)} (reviewed ${escapeHtml(observation.reviewedAt)}).</li>`
  ).join("\n");
  return `<section class="cars-panel cars-static-summary"><h2>Dated local asking-price snapshots</h2><ul>${rows}</ul><p class="cars-static-note">These are small asking-price samples, not completed sale prices or live dealer quotes. Open a vehicle for the source, method, and import-cost comparison.</p></section>`;
}

function marketEvidenceHTML(country, vehicle) {
  const observation = marketObservation(country, vehicle);
  if (!observation) return "";
  const name = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const calculatorUrl = country.import_enabled
    ? `/tools/car-import-cost/${country.slug}/?country=${encodeURIComponent(country.code)}&make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model.split("/")[0].trim())}&year=${vehicle.year}`
    : "";
  const corroboration = (observation.corroboratingSources || []).map((source) => `<li><a href="${escapeHtml(source.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.sourceName)}</a>: ${escapeHtml(formatMoney(source.median, source.currency))} median asking price across ${source.sampleSize} comparable listings (reviewed ${escapeHtml(source.reviewedAt)}). ${escapeHtml(source.method)}</li>`).join("\n");
  return `<section class="cars-panel cars-static-summary cars-market-evidence">
<h2>${escapeHtml(name)} asking prices in ${escapeHtml(observation.market)}</h2>
<p>In a sample of ${observation.sampleSize} ${escapeHtml(observation.condition)} asking prices reviewed ${escapeHtml(observation.reviewedAt)}, the median was <strong>${escapeHtml(formatMoney(observation.median, observation.currency))}</strong>. The middle half ran from ${escapeHtml(formatMoney(observation.lowerQuartile, observation.currency))} to ${escapeHtml(formatMoney(observation.upperQuartile, observation.currency))}.</p>
<p><strong>Method:</strong> ${escapeHtml(observation.method)}</p>
<p><strong>Limits:</strong> ${escapeHtml(observation.limitations)}</p>
${corroboration ? `<h3>Other market check</h3><ul>${corroboration}</ul>` : ""}
<p>Compare this local asking snapshot with an import quote that includes the purchase price, freight, customs valuation and duty, port and clearing costs, delays, and registration. The source-price budget elsewhere on this page is an older planning estimate; enter a current source quote before deciding.</p>
<div class="cars-evidence-links"><a href="${escapeHtml(observation.sourceUrl)}" target="_blank" rel="noopener noreferrer">Check ${escapeHtml(observation.sourceName)}</a>${calculatorUrl ? `<a href="${escapeHtml(calculatorUrl)}">Estimate import cost for this car</a>` : ""}</div>
</section>`;
}

function vehicleImageHTML(vehicle) {
  const binding = (data.mediaLibrary && data.mediaLibrary.bindings || []).find((entry) => entry.vehicleId === vehicle.id && entry.isPrimary && entry.status === "approved");
  const asset = binding && (data.mediaLibrary.assets || []).find((entry) => entry.id === binding.assetId && entry.sourceType === "licensed");
  return asset ? `<figure class="cars-static-image"><img src="${escapeHtml(asset.imageUrl)}" alt="${escapeHtml(asset.alt || `${vehicle.year} ${vehicle.make} ${vehicle.model}`)}" loading="lazy" width="640" height="400"><figcaption>Illustrative model image; the marketplace sample refers to different cars.</figcaption></figure>` : "";
}

function catalogOptionsHTML() {
  return catalogOptions.map((row) => `<option value="${escapeHtml(`${row.year} ${row.make} ${row.model}`)}" data-make="${escapeHtml(row.make)}" data-model="${escapeHtml(row.model)}" data-year="${escapeHtml(row.year)}" data-body="${escapeHtml(row.body_type)}"></option>`).join("\n");
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
<thead><tr><th>Vehicle</th><th>Body</th><th>Illustrative source budget (${escapeHtml(country ? country.currency_code : "USD")})</th><th>USD source budget</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
<p class="cars-static-note">These are source-market planning estimates from the AfroTools car dataset (last vehicle price update ${escapeHtml(latestVehicleUpdate(vehicles))}), converted with the ${escapeHtml(String(forex.timestamp || "undated").slice(0, 10))} FX snapshot. They are not local asking prices. Use a current source quote and the import-cost calculator before comparing with local asking prices.${fxNote}</p>
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
    [`Illustrative source budget (${country.currency_code})`, cells.local],
    ["USD source budget", cells.usd],
    ["Data confidence", vehicle.confidence],
    ["Last updated", vehicle.lastUpdated]
  ].filter(([, value]) => value);
  const rows = specs.map(([label, value]) => `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(String(value))}</td></tr>`).join("\n");
  return `<section class="cars-panel cars-static-summary">
<h2>${escapeHtml(`${vehicle.year} ${vehicle.make} ${vehicle.model}`)} — ${escapeHtml(country.name)} planning snapshot</h2>
${marketObservation(country, vehicle) ? vehicleImageHTML(vehicle) : ""}
<table>
<tbody>
${rows}
</tbody>
</table>
<p class="cars-static-note">The source budget above is an older dataset estimate, not a local asking price or dealer quote. Local-currency conversion uses the ${escapeHtml(String(forex.timestamp || "undated").slice(0, 10))} FX snapshot. Enter a current source quote for a useful landed-cost estimate in ${escapeHtml(country.name)}.</p>
</section>`;
}

function rootObservationLinksHTML() {
  return marketObservations
    .filter((entry) => entry.countryCode === "NG")
    .map((entry) => {
      const vehicle = data.vehicles.find((item) => item.id === entry.vehicleId);
      if (!vehicle) return "";
      const route = `/cars/nigeria/${vehicle.makeSlug}/${vehicle.modelSlug}/${vehicle.year}/`;
      return `<li><a href="${route}">${escapeHtml(`${vehicle.year} ${vehicle.make} ${vehicle.model}`)} asking-price evidence</a></li>`;
    })
    .join("");
}

function staticContentHTML(meta) {
  if (meta.pageType === "root") {
    const options = catalogOptionsHTML();
    const observationLinks = rootObservationLinksHTML();
    return `<section class="cars-panel cars-static-summary"><h2>Start with the price evidence, then estimate the import</h2><p>This directory has ${data.vehicles.length} vehicles with older source-market planning budgets. Dated local asking-price snapshots are available for selected cars; the remaining local market prices still need research. Browse a country or open a sourced snapshot, then enter a current seller quote in the car import calculator.</p><ul><li><a href="/cars/nigeria/">Browse Nigeria car prices and market snapshots</a></li>${observationLinks}</ul></section>
<section class="cars-panel cars-static-summary" aria-labelledby="cars-expanded-title"><h2 id="cars-expanded-title">Find a car for an import quote</h2><p>Search ${catalogOptions.length} catalog make, model, and year options. Most do not have a current local asking-price sample. The calculator will ask for your actual seller price and show country-specific costs for six supported destinations.</p><form id="carsCatalogForm" class="cars-catalog-form"><label for="carsCatalogVehicle">Make, model, and year</label><input id="carsCatalogVehicle" list="carsCatalogOptions" autocomplete="off" required placeholder="2018 Toyota Corolla"><datalist id="carsCatalogOptions">${options}</datalist><label for="carsCatalogCountry">Import destination</label><select id="carsCatalogCountry"><option value="NG|nigeria">Nigeria</option><option value="KE|kenya">Kenya</option><option value="GH|ghana">Ghana</option><option value="UG|uganda">Uganda</option><option value="ZM|zambia">Zambia</option><option value="TZ|tanzania">Tanzania</option></select><button class="cars-button" type="submit">Estimate import cost</button><p id="carsCatalogStatus" role="status" aria-live="polite"></p></form><p>For general goods, use the <a href="/tools/import-duty/">import duty calculator</a>. For a car, the <a href="/tools/car-import-cost/">vehicle import calculator</a> keeps its purchase price editable.</p></section>`;
  }
  if (!meta.pageType) return "";
  const country = meta.countryObj;
  if (meta.pageType === "country") {
    return countryEditorialHTML(country) + countryMarketHTML(country) + vehicleTableHTML(data.vehicles, country, `/cars/${country.slug}`, `Illustrative source-market budgets for ${country.name}`);
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
    return vehicleDetailHTML(meta.vehicleObj, country) + marketEvidenceHTML(country, meta.vehicleObj);
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
${routePath === "cars" ? '<link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/bei-na-akili-ya-gari/">' : ''}
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
${routePath === "cars" ? '<script src="/assets/js/pages/car-catalog-search.js" defer></script>' : ''}
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
    .sort((a, b) => a.routePath.localeCompare(b.routePath))
    .map((entry) => `  <url><loc>${canonical(entry.routePath)}</loc><lastmod>${entry.lastmod}</lastmod><changefreq>weekly</changefreq><priority>${entry.routePath === "cars" ? "0.9" : "0.7"}</priority></url>`)
    .join("\n");
  fs.writeFileSync(path.join(root, "sitemap-cars.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, "utf8");
}

if (process.argv.includes("--catalog-only")) {
  const file = path.join(root, "cars/index.html");
  const current = fs.readFileSync(file, "utf8");
  if (!/Search \d+ catalog make, model, and year options/.test(current) || !/<datalist id="carsCatalogOptions">[\s\S]*?<\/datalist>/.test(current)) {
    throw new Error("Car catalog form not found on generated root page");
  }
  const updated = current
    .replace("Find more cars for an import quote", "Find a car for an import quote")
    .replace(/Search \d+ catalog make, model, and year options/, `Search ${catalogOptions.length} catalog make, model, and year options`)
    .replace(/<datalist id="carsCatalogOptions">[\s\S]*?<\/datalist>/, `<datalist id="carsCatalogOptions">${catalogOptionsHTML()}</datalist>`);
  fs.writeFileSync(file, updated, "utf8");
  console.log(`Updated ${catalogOptions.length} car catalog options in the generated root page`);
  process.exit(0);
}

writePage("cars", {
  title: "African Car Price Directory | AfroTools",
  description: "Compare indicative source-market car budgets and import costs across 20 African markets, with dated local asking-price observations where available.",
  includeFaq: true,
  listVehicles: data.vehicles,
  pageType: "root"
});
writePage("cars/compare", {
  title: "Compare Car Source Markets | Japan, UAE, UK, South Africa | AfroTools",
  description: "Compare source-market price, shipping assumptions, landed cost, local dealer ranges, financing outlook, and risk layers for African car imports.",
  noindex: true
});

Object.values(data.countries).filter((country) => country.directory_enabled !== false).forEach((country) => {
  const hasLocalEvidence = marketObservations.some((item) => item.countryCode === country.code);
  writePage(`cars/${country.slug}`, {
    title: hasLocalEvidence ? `Car Prices — ${country.name} | AfroTools` : `Car Import Budget Guide — ${country.name} | AfroTools`,
    description: `Browse illustrative source-market car budgets in ${country.currency_code || "local currency"} for ${country.name}, with dated local asking-price samples where available and a car import-cost handoff.`,
    country: country.name,
    countryObj: country,
    pageType: "country",
    noindex: !hasLocalEvidence,
    includeFaq: true,
    listVehicles: data.vehicles
  });

  const makes = new Map();
  data.vehicles.forEach((vehicle) => {
    if (!makes.has(vehicle.makeSlug)) makes.set(vehicle.makeSlug, vehicle.make);
  });
  makes.forEach((makeName, makeSlug) => {
    writePage(`cars/${country.slug}/${makeSlug}`, {
      title: `${makeName} Car Prices — ${country.name} | AfroTools`,
      description: `Browse ${makeName} model and year estimates in ${country.name}: source price range, landed-cost range, local asking range, financing outlook, and import-vs-local recommendation.`,
      country: country.name,
      countryObj: country,
      make: makeName,
      makeSlug,
      pageType: "make",
      noindex: true,
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
      title: `${vehicle.make} ${vehicle.model} Prices — ${country.name} | AfroTools`,
      description: `Compare ${vehicle.make} ${vehicle.model} year variants in ${country.name} with source-market price, landed-cost, local asking, financing, and risk ranges.`,
      country: country.name,
      countryObj: country,
      make: vehicle.make,
      makeSlug: vehicle.makeSlug,
      modelSlug: vehicle.modelSlug,
      model: vehicle.model,
      pageType: "model",
      noindex: true,
      listVehicles: data.vehicles.filter((v) => v.makeSlug === vehicle.makeSlug && v.modelSlug === vehicle.modelSlug)
    });
  });

  data.vehicles.forEach((vehicle) => {
    writePage(`cars/${country.slug}/${vehicle.makeSlug}/${vehicle.modelSlug}/${vehicle.year}`, {
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model} Price — ${country.name} | AfroTools`,
      description: marketObservation(country, vehicle)
        ? `Compare a dated local asking-price sample with an editable import-cost estimate for ${vehicle.year} ${vehicle.make} ${vehicle.model} in ${country.name}.`
        : `Explore illustrative source-price and import-cost assumptions for ${vehicle.year} ${vehicle.make} ${vehicle.model} in ${country.name}.`,
      country: country.name,
      countryObj: country,
      make: vehicle.make,
      pageType: "vehicle",
      vehicleObj: vehicle,
      noindex: !marketObservation(country, vehicle),
      lastmod: marketObservation(country, vehicle)?.reviewedAt || contentRevisionDate
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
