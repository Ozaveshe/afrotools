(function () {
  "use strict";

  var Price = window.AfroCarPriceIntelligence;
  var ImportEngine = window.AfroCarImportCost;
  var state = { priceData: null, importData: null, route: null, filters: {}, aiMessages: [] };

  function qs(selector, root) { return (root || document).querySelector(selector); }
  function qsa(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function money(value, currency) { return Price.formatMoney(value, currency || "USD"); }
  function titleCase(value) {
    return String(value || "").split("-").map(function (part) {
      return part ? part.charAt(0).toUpperCase() + part.slice(1) : "";
    }).join(" ");
  }
  function unique(values) {
    return values.filter(function (value, index) { return values.indexOf(value) === index; });
  }
  function fetchJson(url) {
    return fetch(url, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error("Could not load " + url);
      return res.json();
    });
  }
  function track(event, params) {
    params = params || {};
    params.tool_name = "car-price-intelligence";
    if (window.AfroTools && window.AfroTools.analytics && window.AfroTools.analytics.track) window.AfroTools.analytics.track(event, params);
    else if (typeof window.gtag === "function") window.gtag("event", event, params);
  }

  function loadPriceData() {
    return fetchJson("/data/cars/price-intelligence.json").then(function (data) {
      try {
        var override = JSON.parse(localStorage.getItem("carPriceIntelligenceOverride") || "null");
        if (override && override.schemaVersion) return override;
      } catch (error) {
        return data;
      }
      return data;
    });
  }
  function loadImportData() {
    return fetchJson("/data/trade/car-import-cost-core.json").then(function (core) {
      var urls = Object.keys(core.countryPackFiles || {}).map(function (code) { return fetchJson(core.countryPackFiles[code]); });
      var fx = fetchJson(core.fx && core.fx.fallbackUrl || "/data/forex/latest.json").catch(function () { return { rates: {} }; });
      return Promise.all(urls.concat([fx])).then(function (items) {
        var fxData = items.pop();
        return ImportEngine.mergeData(core, items, fxData && fxData.rates || {});
      });
    });
  }
  function init() {
    var app = qs("#carsApp");
    if (!app || !Price || !ImportEngine) return;
    state.route = Price.parseCarsPath(location.pathname);
    Promise.all([loadPriceData(), loadImportData()]).then(function (items) {
      state.priceData = items[0];
      state.importData = items[1];
      render();
    }).catch(function (error) {
      app.innerHTML = "<section class=\"cars-panel\"><h1>Car data could not load</h1><p>" + esc(error.message) + "</p></section>";
    });
  }
  function render() {
    if (state.route.type === "detail" || state.route.type === "import-vs-local") return renderDetail(state.route);
    if (state.route.type === "compare") return renderCompare();
    return renderDirectory(state.route);
  }

  function getCountry(value) { return Price.getCountry(state.priceData, value || "nigeria"); }
  function routeFilters(route) {
    var filters = Object.assign({}, state.filters);
    if (route.country) filters.country = route.country;
    if (route.make) filters.make = route.make;
    if (route.model) filters.model = route.model;
    if (route.year) filters.year = route.year;
    filters.country = filters.country || "nigeria";
    return filters;
  }
  function countrySlug(code) { return Price.getCountry(state.priceData, code).slug; }

  function renderDirectory(route) {
    var app = qs("#carsApp");
    var filters = routeFilters(route);
    var country = getCountry(filters.country);
    var list = Price.filterVehicles(state.priceData, filters);
    var content = state.priceData.countryContent[country.code] || {};
    app.innerHTML =
      "<section class=\"cars-hero-band\">" +
        "<nav class=\"cars-breadcrumb\" aria-label=\"Breadcrumb\"><a href=\"/\">AfroTools</a><span>&rsaquo;</span><a href=\"/transport/\">Transport</a><span>&rsaquo;</span><a href=\"/cars/\">Cars</a><span>&rsaquo;</span><span>" + esc(country.name) + "</span></nav>" +
        "<div class=\"cars-hero-grid\"><div><span class=\"cars-kicker\">Car directory + landed price intelligence</span><h1>" + esc(directoryTitle(route, country)) + "</h1><p>" + esc(content.intro || "Compare source price, landed cost, and local asking ranges for popular imported cars across Africa.") + "</p></div>" +
        "<aside class=\"cars-trust-strip\"><img class=\"cars-hero-image\" src=\"/assets/img/tools/car-loan.webp\" alt=\"Car on a road\"><strong>Three price layers</strong><span>Source market range</span><span>Landed-cost range</span><span>Local asking range</span></aside></div>" +
      "</section>" +
      renderFilters(filters, list) +
      renderCountryOverview(country, list) +
      "<section class=\"cars-panel\"><div class=\"cars-section-head\"><h2>" + esc(route.type === "model" ? "Year variants" : route.type === "make" ? "Models and years" : "Popular imported cars") + "</h2><span>" + list.length + " seed variants</span></div><div class=\"cars-card-grid\">" + list.slice(0, 24).map(function (vehicle) { return renderVehicleCard(vehicle, country.code); }).join("") + "</div></section>" +
      renderSourceBlock(country.code) + renderFaqAndRelated();
    bindDirectory();
    track("car_directory_view", { country: country.code, route_type: route.type || "directory" });
  }

  function directoryTitle(route, country) {
    if (route.type === "make") return country.name + " " + titleCase(route.make) + " import prices";
    if (route.type === "model") return country.name + " " + titleCase(route.make) + " " + titleCase(route.model) + " landed prices";
    if (route.type === "country") return country.name + " car import price directory";
    return "African car import price directory";
  }

  function renderFilters(filters, list) {
    var countries = Object.keys(state.priceData.countries).map(function (code) { var c = state.priceData.countries[code]; return [c.slug, c.name]; });
    var makes = unique(state.priceData.vehicles.map(function (v) { return v.makeSlug + "|" + v.make; })).map(function (item) { var p = item.split("|"); return [p[0], p[1]]; });
    var bodies = unique(state.priceData.vehicles.map(function (v) { return v.body; })).map(function (body) { return [body, titleCase(body)]; });
    return "<section class=\"cars-panel cars-filter-panel\"><div class=\"cars-section-head\"><h2>Search and filter</h2><span>" + list.length + " results</span></div><form id=\"carsFilterForm\" class=\"cars-filter-grid\">" +
      field("Search", "<input name=\"q\" value=\"" + esc(filters.q || "") + "\" placeholder=\"Toyota Axio, Hilux, G-Wagon\">") +
      field("Country", select("country", countries, filters.country)) +
      field("Make", select("make", [["", "All makes"]].concat(makes), filters.make || "")) +
      field("Body type", select("body", [["", "All body types"]].concat(bodies), filters.body || "")) +
      field("Fuel", select("fuel", [["", "All fuel"], ["petrol", "Petrol"], ["diesel", "Diesel"], ["hybrid", "Hybrid"], ["ev", "EV"]], filters.fuel || "")) +
      field("Source market", select("sourceMarket", [["", "Any source"], ["japan", "Japan"], ["uae", "UAE"], ["uk", "UK"], ["south-africa", "South Africa"]], filters.sourceMarket || "")) +
      field("Recommendation", select("recommendation", [["", "Any"], ["import-likely-cheaper", "Import likely cheaper"], ["import-better-spec", "Import for better spec"], ["borderline", "Borderline"], ["buy-local", "Buy local likely better"], ["too-risky", "Too risky"]], filters.recommendation || "")) +
      field("Eligibility", select("eligibility", [["", "Any"], ["eligible", "Eligible"], ["risky", "Risky"], ["ineligible", "Ineligible"]], filters.eligibility || "")) +
      "<div class=\"cars-filter-actions\"><button class=\"cars-button\" type=\"submit\">Apply filters</button><button class=\"cars-button secondary\" type=\"button\" id=\"carsClearFilters\">Clear</button></div></form></section>";
  }
  function field(label, control) { return "<label class=\"cars-field\"><span>" + esc(label) + "</span>" + control + "</label>"; }
  function select(name, options, value) {
    return "<select name=\"" + esc(name) + "\">" + options.map(function (o) {
      return "<option value=\"" + esc(o[0]) + "\"" + (String(o[0]) === String(value) ? " selected" : "") + ">" + esc(o[1]) + "</option>";
    }).join("") + "</select>";
  }

  function renderCountryOverview(country, list) {
    var content = state.priceData.countryContent[country.code] || {};
    var risky = list.filter(function (vehicle) { return vehicle._context && vehicle._context.eligibilityStatus !== "eligible"; }).slice(0, 3);
    var cheap = list.slice().sort(function (a, b) { return a._context.landed.normal - b._context.landed.normal; }).slice(0, 3);
    var recent = list.slice().sort(function (a, b) { return String(b.lastUpdated || "").localeCompare(String(a.lastUpdated || "")); }).slice(0, 3);
    var opportunities = list.filter(function (vehicle) {
      var status = vehicle._context.recommendation.status;
      return status === "import-likely-cheaper" || status === "import-better-spec";
    }).slice(0, 3);
    return "<section class=\"cars-insight-grid\">" +
      miniList("Cheapest to import", cheap, country.code) +
      miniList("Best import-vs-local opportunities", opportunities.length ? opportunities : cheap, country.code) +
      miniList("Risky due to rules or age", risky.length ? risky : list.slice(0, 3), country.code) +
      miniList("Recently updated vehicles", recent, country.code) +
      "<article class=\"cars-insight\"><h2>What users miss</h2><p>" + esc(content.hiddenCosts || "Freight, FX, storage, and local registration can shift the final on-road number.") + "</p><p>" + esc(content.riskCopy || "") + "</p></article>" +
    "</section>";
  }

  function miniList(title, list, code) {
    return "<article class=\"cars-insight\"><h2>" + esc(title) + "</h2><ul>" + list.map(function (vehicle) {
      return "<li><a href=\"/cars/" + countrySlug(code) + "/" + vehicle.makeSlug + "/" + vehicle.modelSlug + "/" + vehicle.year + "/\">" + esc(vehicle.make + " " + vehicle.model + " " + vehicle.year) + "</a><span>" + money(vehicle._context.landed.normal) + "</span></li>";
    }).join("") + "</ul></article>";
  }

  function renderVehicleCard(vehicle, code) {
    var ctx = vehicle._context || Price.buildVehicleContext(state.priceData, state.importData, { countryCode: code, vehicle: vehicle });
    var href = "/cars/" + countrySlug(code) + "/" + vehicle.makeSlug + "/" + vehicle.modelSlug + "/" + vehicle.year + "/";
    return "<article class=\"cars-card\">" +
      "<div class=\"cars-card-top\"><span class=\"cars-badge " + esc(ctx.eligibilityStatus) + "\">" + esc(ctx.eligibilityStatus) + "</span><span class=\"cars-badge confidence\">" + esc(ctx.landed.confidence) + " confidence</span></div>" +
      "<h3><a href=\"" + href + "\">" + esc(vehicle.make + " " + vehicle.model + " " + vehicle.year) + "</a></h3>" +
      "<p>" + esc(vehicle.body + " - " + vehicle.trim + " - " + vehicle.fuel.join(", ")) + "</p>" +
      "<dl class=\"cars-price-mini\"><div><dt>Source</dt><dd>" + money(ctx.sourcePrice.median) + "</dd></div><div><dt>Landed</dt><dd>" + money(ctx.landed.normal) + "</dd></div><div><dt>Local</dt><dd>" + money(ctx.localPrice.median) + "</dd></div></dl>" +
      "<strong class=\"cars-reco " + esc(ctx.recommendation.status) + "\">" + esc(ctx.recommendation.label) + "</strong>" +
      "<div class=\"cars-card-actions\"><a href=\"" + href + "\">Open page</a><a href=\"" + ctx.calculatorUrl + "\" data-prefill-link>Run calculator</a></div>" +
    "</article>";
  }

  function renderDetail(route) {
    var app = qs("#carsApp");
    var ctx = Price.buildVehicleContext(state.priceData, state.importData, route);
    if (!ctx) {
      app.innerHTML = "<section class=\"cars-panel\"><h1>Car not found</h1><p>The seed pack does not have this make, model, and year yet.</p><a class=\"cars-button\" href=\"/cars/\">Browse cars</a></section>";
      return;
    }
    var v = ctx.vehicle;
    var c = ctx.country;
    app.innerHTML =
      "<section class=\"cars-detail\" id=\"carsReport\">" +
        "<nav class=\"cars-breadcrumb\" aria-label=\"Breadcrumb\"><a href=\"/\">AfroTools</a><span>&rsaquo;</span><a href=\"/cars/\">Cars</a><span>&rsaquo;</span><a href=\"/cars/" + c.slug + "/\">" + esc(c.name) + "</a><span>&rsaquo;</span><span>" + esc(v.make + " " + v.model + " " + v.year) + "</span></nav>" +
        renderSnapshot(ctx) + renderThreeLayers(ctx) + renderRecommendation(ctx) + renderTabs(ctx) + renderCalculatorCta(ctx) + renderAiBlock() + renderRelatedVehicles(ctx) + renderSourceBlock(c.code) + renderFaqAndRelated() +
      "</section>";
    bindDetail(ctx);
    track(route.type === "import-vs-local" ? "car_import_vs_local_view" : "car_detail_view", { country: c.code, make: v.makeSlug, model: v.modelSlug, year: v.year, recommendation: ctx.recommendation.status });
    if (ctx.freshness.pricePackStale) track("car_stale_price_warning_shown", { country: c.code, vehicle: v.id });
  }

  function renderSnapshot(ctx) {
    var v = ctx.vehicle;
    return "<header class=\"cars-snapshot\"><div><span class=\"cars-kicker\">Landed car price snapshot</span><h1>" + esc(v.year + " " + v.make + " " + v.model) + " in " + esc(ctx.country.name) + "</h1><p>" + esc(v.trim + " - " + v.body + " - " + v.fuel.join(" / ") + " - " + v.mileage) + "</p></div><aside><img class=\"cars-hero-image\" src=\"/assets/img/tools/car-loan.webp\" alt=\"Car on a road\"><span class=\"cars-badge " + esc(ctx.eligibilityStatus) + "\">" + esc(ctx.eligibilityStatus) + "</span><span class=\"cars-badge confidence\">" + esc(ctx.landed.confidence) + " confidence</span><span class=\"cars-badge\">" + esc(ctx.freshness.source) + "</span><span class=\"cars-badge\">Official rules loaded</span><span class=\"cars-badge\">Estimated price pack</span></aside></header>";
  }

  function renderThreeLayers(ctx) {
    return "<section class=\"cars-layer-grid\" aria-label=\"Three price layers\">" +
      priceLayer("Source market price", ctx.sourcePrice, "Typical " + sourceLabel(ctx.sourceMarket) + " range before freight, insurance, and taxes.") +
      priceLayer("Estimated landed cost", { min: ctx.landed.best, median: ctx.landed.normal, max: ctx.landed.painful, confidence: ctx.landed.confidence, sourceType: "landed-cost-engine" }, "Best, normal, and painful case from the landed-cost engine.") +
      priceLayer("Local asking price", ctx.localPrice, "Typical asking range for similar landed/local vehicles.") +
    "</section>";
  }

  function priceLayer(title, item, note) {
    return "<article class=\"cars-price-layer\"><span>" + esc(title) + "</span><strong>" + money(item.median) + "</strong><div><small>Low " + money(item.min) + "</small><small>High " + money(item.max) + "</small></div><p>" + esc(note) + "</p><em>" + esc(item.confidence || "low") + " confidence - " + esc(item.sourceType || "estimate") + "</em></article>";
  }

  function renderRecommendation(ctx) {
    var r = ctx.recommendation;
    return "<section class=\"cars-recommendation " + esc(r.status) + "\"><div><span>Recommendation</span><h2>" + esc(r.label) + "</h2><p>" + esc(r.explanation) + "</p></div><div class=\"cars-buffer\"><strong>Buffer guide</strong><span>Keep 8-18% above the normal case when FX, storage, or valuation uncertainty is high.</span></div></section>";
  }

  function renderTabs(ctx) {
    var result = ctx.landed.normalResult;
    return "<section class=\"cars-panel cars-tabs\"><div class=\"cars-tab-list\" role=\"tablist\">" +
      ["Summary", "Official Charges", "Practical Costs", "Registration", "Compare", "FAQ"].map(function (label, index) {
        return "<button type=\"button\" class=\"cars-tab" + (index === 0 ? " active" : "") + "\" data-cars-tab=\"" + index + "\">" + label + "</button>";
      }).join("") + "</div>" +
      tabPanel(0, true, renderCostSummary(result, ctx)) +
      tabPanel(1, false, itemList(result.breakdowns.officialTaxes.concat(result.breakdowns.officialFees))) +
      tabPanel(2, false, itemList(result.breakdowns.practicalCosts.concat(result.breakdowns.inlandDelivery))) +
      tabPanel(3, false, itemList(result.breakdowns.registration)) +
      tabPanel(4, false, renderSourceComparison(ctx)) +
      tabPanel(5, false, renderFaqs()) +
    "</section>";
  }
  function tabPanel(index, active, html) { return "<div class=\"cars-tab-panel" + (active ? " active" : "") + "\" data-cars-panel=\"" + index + "\">" + html + "</div>"; }
  function renderCostSummary(result, ctx) {
    var totals = result.totals;
    return "<div class=\"cars-cost-grid\">" +
      summaryItem("Vehicle value", totals.vehicleBaseUsd) +
      summaryItem("Freight", totals.freightUsd) +
      summaryItem("Insurance", totals.marineInsuranceUsd) +
      summaryItem("Customs basis", totals.cifUsd) +
      summaryItem("Official taxes", totals.officialTaxesUsd) +
      summaryItem("Official fees", totals.officialFeesUsd) +
      summaryItem("Practical/port fees", totals.practicalCostsUsd) +
      summaryItem("Registration", totals.registrationUsd) +
      summaryItem("Inland delivery", totals.inlandDeliveryUsd) +
      summaryItem("Total landed estimate", totals.totalLandedUsd) +
      summaryItem("Estimated on-road cost", totals.onRoadUsd) +
      "<article><span>Rule pack</span><strong>" + esc(result.rulePack.confidence || "estimate") + "</strong><small>" + esc(ctx.freshness.source) + "</small></article></div>" + warningList(ctx.landed.warnings);
  }
  function summaryItem(label, value) { return "<article><span>" + esc(label) + "</span><strong>" + money(value) + "</strong></article>"; }
  function itemList(items) {
    if (!items || !items.length) return "<p>No line items in this section for the selected rule pack.</p>";
    return "<ul class=\"cars-line-items\">" + items.map(function (item) {
      return "<li><span>" + esc(item.label) + "</span><strong>" + money(item.amountUsd) + "</strong><em>" + esc(item.official ? "official" : "estimate") + "</em></li>";
    }).join("") + "</ul>";
  }
  function warningList(warnings) {
    if (!warnings || !warnings.length) return "<p class=\"cars-safe-note\">No eligibility warnings from the current rule-pack assumptions.</p>";
    return "<div class=\"cars-warning-list\">" + warnings.map(function (warning) {
      return "<p><strong>" + esc(warning.code) + "</strong> " + esc(warning.message) + "</p>";
    }).join("") + "</div>";
  }
  function renderSourceComparison(ctx) {
    return "<div class=\"cars-compare-grid\">" + ctx.sourceComparison.map(function (item) {
      return "<article><span>" + esc(item.label) + "</span><strong>" + money(item.landed.normal) + "</strong><small>" + esc(item.transitDays) + " transit days - " + esc(item.confidence) + " confidence</small><p>Source " + money(item.price.median) + " | Best " + money(item.landed.best) + " | Painful " + money(item.landed.painful) + "</p></article>";
    }).join("") + "</div>";
  }
  function renderCalculatorCta(ctx) {
    return "<section class=\"cars-cta-bar\"><div><h2>Run the full landed-cost calculator</h2><p>Use this car page as a starting point, then edit exact trim, first-registration month, customs value, storage, and agent costs.</p></div><div class=\"cars-actions\"><a class=\"cars-button\" href=\"" + ctx.calculatorUrl + "\" id=\"carsRunCalculator\">Run full calculator</a><a class=\"cars-button secondary\" href=\"/cars/import-vs-local/" + ctx.country.slug + "/" + ctx.vehicle.makeSlug + "/" + ctx.vehicle.modelSlug + "/" + ctx.vehicle.year + "/\">Import vs local</a><button class=\"cars-button secondary\" type=\"button\" id=\"carsSharePage\">Share page</button><button class=\"cars-button tertiary\" type=\"button\" id=\"carsSaveWatchlist\">Save watchlist</button><button class=\"cars-button tertiary\" type=\"button\" id=\"carsExportCsv\">Export CSV</button><button class=\"cars-button tertiary\" type=\"button\" id=\"carsExportPdf\">Export PDF</button><save-result-button id=\"carsCloudSave\" tool-slug=\"car-price-intelligence\" tool-name=\"Car Price Intelligence\"></save-result-button></div></section>";
  }
  function renderAiBlock() {
    return "<section class=\"cars-panel cars-ai\"><div class=\"cars-section-head\"><h2>Ask AI about this car</h2><span>Structured context only</span></div><div class=\"cars-ai-prompts\"><button type=\"button\" data-ai-question=\"Should I import this car or buy local?\">Import or buy local?</button><button type=\"button\" data-ai-question=\"Which source market looks best for this car?\">Best source market?</button><button type=\"button\" data-ai-question=\"What hidden costs should I budget for?\">Hidden costs?</button></div><div id=\"carsAiLog\" class=\"cars-ai-log\"></div><label class=\"cars-field\"><span>Question</span><textarea id=\"carsAiQuestion\" placeholder=\"Ask about risk, hidden costs, source markets, or buffer.\"></textarea></label><button class=\"cars-button\" id=\"carsAskAi\" type=\"button\">Ask AI with this car context</button></section>";
  }
  function renderRelatedVehicles(ctx) {
    var related = Price.filterVehicles(state.priceData, { country: ctx.country.slug, make: ctx.vehicle.makeSlug }).filter(function (v) { return v.id !== ctx.vehicle.id; }).slice(0, 4);
    return "<section class=\"cars-panel\"><div class=\"cars-section-head\"><h2>Related vehicles</h2><a href=\"/cars/" + ctx.country.slug + "/" + ctx.vehicle.makeSlug + "/\">View " + esc(ctx.vehicle.make) + "</a></div><div class=\"cars-card-grid\">" + related.map(function (vehicle) { return renderVehicleCard(vehicle, ctx.country.code); }).join("") + "</div></section>";
  }
  function renderSourceBlock(code) {
    var sources = (state.priceData.sourceMetadata || []).slice(0, 8);
    var content = state.priceData.countryContent[code] || {};
    return "<section class=\"cars-panel cars-source-block\"><div class=\"cars-section-head\"><h2>Source verification and assumptions</h2><span>" + esc(state.priceData.estimatePolicy) + "</span></div><p>" + esc(content.riskCopy || "") + "</p><ul>" + sources.map(function (source) {
      return "<li><a href=\"" + esc(source.url) + "\" rel=\"nofollow noopener\" target=\"_blank\">" + esc(source.name) + "</a><span>" + esc(source.sourceType) + " - " + esc(source.confidence) + " - verified " + esc(source.lastVerified) + "</span></li>";
    }).join("") + "</ul></section>";
  }
  function renderFaqAndRelated() {
    return "<section class=\"cars-content-grid\"><article class=\"cars-panel\"><h2>FAQ</h2>" + renderFaqs() + "</article><article class=\"cars-panel\"><h2>Related AfroTools</h2><ul class=\"cars-related-tools\">" + state.priceData.relatedTools.map(function (tool) {
      return "<li><a href=\"" + esc(tool.url) + "\">" + esc(tool.label) + "</a></li>";
    }).join("") + "</ul></article></section>";
  }
  function renderFaqs() {
    return "<div class=\"cars-faq\">" + (state.priceData.faqs || []).map(function (item) {
      return "<details><summary>" + esc(item.question) + "</summary><p>" + esc(item.answer) + "</p></details>";
    }).join("") + "</div>";
  }

  function renderCompare() {
    var app = qs("#carsApp");
    var params = new URLSearchParams(location.search);
    var selected = Price.findVehicle(state.priceData, { make: params.get("make") || "toyota", model: params.get("model") || "axio", year: params.get("year") || 2018 }) || state.priceData.vehicles[0];
    var country = getCountry(params.get("country") || "kenya");
    var ctx = Price.buildVehicleContext(state.priceData, state.importData, { countryCode: country.code, vehicle: selected });
    app.innerHTML = "<section class=\"cars-hero-band\"><nav class=\"cars-breadcrumb\"><a href=\"/\">AfroTools</a><span>&rsaquo;</span><a href=\"/cars/\">Cars</a><span>&rsaquo;</span><span>Compare</span></nav><h1>Compare car source markets</h1><p>Compare Japan, UAE, UK, South Africa, and local dealer assumptions using the same landed-cost engine.</p></section><section class=\"cars-panel\"><div class=\"cars-section-head\"><h2>" + esc(selected.year + " " + selected.make + " " + selected.model + " into " + country.name) + "</h2><a href=\"/cars/" + country.slug + "/" + selected.makeSlug + "/" + selected.modelSlug + "/" + selected.year + "/\">Open car page</a></div>" + renderSourceComparison(ctx) + "</section>" + renderFaqAndRelated();
    track("car_price_compare_used", { country: country.code, vehicle: selected.id });
  }

  function bindDirectory() {
    var form = qs("#carsFilterForm");
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = new FormData(form);
        state.filters = {};
        data.forEach(function (value, key) { if (value) state.filters[key] = value; });
        track("car_directory_search", { country: getCountry(state.filters.country || "nigeria").code, q: state.filters.q || "" });
        renderDirectory(state.route);
      });
    }
    var clear = qs("#carsClearFilters");
    if (clear) clear.addEventListener("click", function () { state.filters = {}; renderDirectory(state.route); });
    qsa("[data-prefill-link]").forEach(function (link) {
      link.addEventListener("click", function () { track("car_calculator_prefill_click", { href: link.href }); });
    });
  }

  function bindDetail(ctx) {
    qsa(".cars-tab").forEach(function (button) {
      button.addEventListener("click", function () {
        qsa(".cars-tab").forEach(function (b) { b.classList.remove("active"); });
        qsa(".cars-tab-panel").forEach(function (p) { p.classList.remove("active"); });
        button.classList.add("active");
        var panel = qs("[data-cars-panel=\"" + button.getAttribute("data-cars-tab") + "\"]");
        if (panel) panel.classList.add("active");
      });
    });
    var share = qs("#carsSharePage");
    if (share) share.addEventListener("click", function () { sharePage(ctx); });
    var watch = qs("#carsSaveWatchlist");
    if (watch) watch.addEventListener("click", function () { saveWatchlist(ctx); });
    var csv = qs("#carsExportCsv");
    if (csv) csv.addEventListener("click", function () { exportCsv(ctx); });
    var pdf = qs("#carsExportPdf");
    if (pdf) pdf.addEventListener("click", function () { exportPdf(ctx); });
    var calc = qs("#carsRunCalculator");
    if (calc) calc.addEventListener("click", function () { track("car_calculator_prefill_click", { country: ctx.country.code, vehicle: ctx.vehicle.id }); });
    var ask = qs("#carsAskAi");
    if (ask) ask.addEventListener("click", function () { askAi(ctx); });
    qsa("[data-ai-question]").forEach(function (button) {
      button.addEventListener("click", function () {
        var input = qs("#carsAiQuestion");
        if (input) input.value = button.getAttribute("data-ai-question");
        askAi(ctx);
      });
    });
    var save = qs("#carsCloudSave");
    if (save && typeof save.setData === "function") {
      save.setData({ inputs: ctx.aiContext, outputs: { recommendation: ctx.recommendation, landed: ctx.landed, localPrice: ctx.localPrice } });
    }
  }

  function sharePage(ctx) {
    track("car_share_click", { country: ctx.country.code, vehicle: ctx.vehicle.id });
    if (window.AfroTools && window.AfroTools.shareState && window.AfroTools.shareState.share) {
      window.AfroTools.shareState.share({ title: document.title, text: ctx.recommendation.label, toolId: "car-price-intelligence" });
      return;
    }
    if (navigator.share) navigator.share({ title: document.title, url: location.href });
    else navigator.clipboard && navigator.clipboard.writeText(location.href);
  }
  function saveWatchlist(ctx) {
    var watchlist = [];
    try { watchlist = JSON.parse(localStorage.getItem("carPriceWatchlist") || "[]"); } catch (error) { watchlist = []; }
    watchlist.unshift({ id: ctx.country.code + "-" + ctx.vehicle.id + "-" + Date.now(), country_code: ctx.country.code, make: ctx.vehicle.make, model: ctx.vehicle.model, year: ctx.vehicle.year, trim: ctx.vehicle.trim, target_max_landed_cost: ctx.landed.normal, target_max_local_ask: ctx.localPrice.median, active: true });
    localStorage.setItem("carPriceWatchlist", JSON.stringify(watchlist.slice(0, 40)));
    var button = qs("#carsSaveWatchlist");
    if (button) button.textContent = "Saved to watchlist";
    track("car_watchlist_save", { country: ctx.country.code, vehicle: ctx.vehicle.id });
  }
  function exportCsv(ctx) {
    var rows = [{ vehicle: ctx.vehicle.year + " " + ctx.vehicle.make + " " + ctx.vehicle.model, country: ctx.country.name, source_market: sourceLabel(ctx.sourceMarket), source_median_usd: ctx.sourcePrice.median, landed_normal_usd: ctx.landed.normal, local_median_usd: ctx.localPrice.median, recommendation: ctx.recommendation.label, confidence: ctx.landed.confidence }];
    track("car_export_csv", { country: ctx.country.code, vehicle: ctx.vehicle.id });
    if (window.AfroExport && window.AfroExport.csv) window.AfroExport.csv(rows, "afrotools-car-price-report.csv");
  }
  function exportPdf(ctx) {
    track("car_export_pdf", { country: ctx.country.code, vehicle: ctx.vehicle.id });
    if (window.AfroExport && window.AfroExport.pdf) window.AfroExport.pdf("carsReport", "AfroTools Car Price Report");
    else window.print();
  }
  function askAi(ctx) {
    var input = qs("#carsAiQuestion");
    var question = input && input.value.trim();
    if (!question) return;
    appendAi("user", question);
    input.value = "";
    track("car_ai_advisor_opened", { country: ctx.country.code, vehicle: ctx.vehicle.id });
    fetch("/.netlify/functions/ai-advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "car-price-intelligence", context: JSON.stringify(ctx.aiContext), messages: state.aiMessages.concat([{ role: "user", content: question }]) })
    }).then(function (res) {
      if (!res.ok) throw new Error("AI unavailable");
      return res.json();
    }).then(function (data) {
      appendAi("assistant", data.reply || data.text || data.answer || "I could not produce a grounded answer from the structured context.");
    }).catch(function () {
      appendAi("assistant", "From the structured estimate, focus on the landed-vs-local gap, compliance warnings, stale data labels, FX sensitivity, and port delay buffer before paying for the vehicle.");
    });
  }
  function appendAi(role, text) {
    state.aiMessages.push({ role: role, content: text });
    var log = qs("#carsAiLog");
    if (!log) return;
    var div = document.createElement("div");
    div.className = "cars-ai-message " + role;
    div.textContent = (role === "user" ? "You: " : "Advisor: ") + text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }
  function sourceLabel(id) {
    var market = state.priceData && state.priceData.sourceMarkets && state.priceData.sourceMarkets[id];
    return market && market.label || titleCase(id);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
