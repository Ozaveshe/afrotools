(function initSwUniquelyAfrican(root) {
  "use strict";
  var contractNode = document.getElementById("uaContract");
  var form = document.querySelector("[data-ua-form]");
  var engine = root.AfroToolsUniquelyAfricanEngine;
  if (!contractNode || !form || !engine) return;

  var contract = JSON.parse(contractNode.textContent);
  var lastPayload = null;
  var delegateState = {};

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[character];
    });
  }

  function collectInput() {
    var input = {};
    contract.fields.forEach(function (field) {
      var node = document.querySelector('[data-ua-field="' + field.key + '"]');
      if (!node) return;
      input[field.key] = field.type === "number" ? Number(node.value) : node.value;
    });
    return input;
  }

  function formatValue(key, value, input) {
    if (typeof value === "boolean") return value ? "Ndiyo" : "Hapana";
    if (value == null) return "—";
    if (typeof value !== "number") return String(value);
    var digits = /Pct$|weightedSeverity|scaleFactor|Kwh|Litres|Months/i.test(key) ? 2 : Math.abs(value) < 10 ? 2 : 0;
    var formatted = value.toLocaleString("sw-TZ", { maximumFractionDigits: digits, minimumFractionDigits: digits });
    if (/Pct$|weightedSeverity/i.test(key)) return formatted + "%";
    if (/(?:cost|fee|value|profit|revenue|price|total|gap|secured|remittance|material|quote|expenses|difference|spread)$/i.test(key)) {
      return (input.currency || "") + " " + formatted;
    }
    return formatted;
  }

  function clearInvalid() {
    form.querySelectorAll('[aria-invalid="true"]').forEach(function (node) { node.removeAttribute("aria-invalid"); });
  }

  function renderMetrics(result, input) {
    var target = document.querySelector("[data-ua-metrics]");
    if (contract.id === "afrokitchen") target.classList.add("ua-metrics");
    target.innerHTML = Object.keys(contract.metrics).filter(function (key) {
      return Object.prototype.hasOwnProperty.call(result.values, key);
    }).map(function (key) {
      return '<article class="ua-metric"><span>' + escapeHtml(contract.metrics[key]) + '</span><strong>' + escapeHtml(formatValue(key, result.values[key], input)) + "</strong></article>";
    }).join("");
  }

  function renderRows(result) {
    var table = document.querySelector("[data-ua-table]");
    if (!result.rows || !result.rows.length) { table.innerHTML = ""; table.hidden = true; return; }
    if (contract.id === "afrokitchen") {
      table.hidden = false;
      table.innerHTML = "<thead><tr><th scope=\"col\">Kiungo</th><th scope=\"col\">Kiasi kilichorekebishwa</th><th scope=\"col\">Kipimo</th></tr></thead><tbody>" + result.rows.map(function (row) {
        var amount = Number.isFinite(row.scaledAmount) ? row.scaledAmount.toLocaleString("sw-TZ", { maximumFractionDigits: 2 }) : "Kulingana na ladha";
        return "<tr><td>" + escapeHtml(row.name) + "</td><td>" + escapeHtml(amount) + "</td><td>" + escapeHtml(row.unit) + "</td></tr>";
      }).join("") + "</tbody>";
      return;
    }
    var keys = Object.keys(result.rows[0]).slice(0, 6);
    table.hidden = false;
    table.innerHTML = "<thead><tr>" + keys.map(function (key) { return "<th>" + escapeHtml(key) + "</th>"; }).join("") + "</tr></thead><tbody>" + result.rows.slice(0, 50).map(function (row) {
      return "<tr>" + keys.map(function (key) { return "<td>" + escapeHtml(row[key] == null ? "—" : row[key]) + "</td>"; }).join("") + "</tr>";
    }).join("") + "</tbody>";
  }

  function invalidMessage(result) {
    var field = contract.fields.find(function (item) { return item.key === result.field; });
    var label = field ? field.label : "Taarifa";
    var messages = {
      positive_required: label + " lazima iwe kubwa kuliko sifuri.",
      distinct_supported_cities_required: "Chagua miji miwili tofauti iliyopo kwenye orodha.",
      distinct_supported_countries_required: "Chagua nchi mbili tofauti zilizopo kwenye orodha.",
      ingredient_required: "Chagua mapishi yenye viungo vinavyopatikana.",
      records_required: "Rekodi za kusoma hazipatikani sasa. Jaribu tena au tumia zana nyingine ya ndani.",
      numeric_prices_required: "Hakuna bei za namba zinazoweza kulinganishwa.",
      days_out_of_range: "Siku lazima ziwe kati ya 0 na 366."
    };
    return messages[result.code] || "Kagua taarifa ulizoingiza kisha jaribu tena.";
  }

  function payloadText(payload) {
    var lines = [contract.title, "Imeundwa ndani ya kivinjari", ""];
    Object.keys(contract.metrics).forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(payload.result.values, key)) lines.push(contract.metrics[key] + ": " + formatValue(key, payload.result.values[key], payload.input));
    });
    if (contract.id === "afrokitchen") {
      var recipes = root.AfroKitchenEngine && root.AfroKitchenEngine.SEED_RECIPES || [];
      var recipe = recipes.find(function (item) { return item.slug === payload.input.recipe; });
      lines.push("", "Mapishi: " + (recipe ? recipe.name : payload.input.recipe), "Viungo vilivyorekebishwa");
      payload.result.rows.forEach(function (row) {
        var amount = Number.isFinite(row.scaledAmount) ? row.scaledAmount.toLocaleString("sw-TZ", { maximumFractionDigits: 2 }) : "Kulingana na ladha";
        lines.push(row.name + ": " + amount + (row.unit ? " " + row.unit : ""));
      });
    }
    lines.push("", "Chanzo: " + contract.source, "Upya wa taarifa: " + contract.freshness, "Mipaka: " + contract.limitations);
    return lines.join("\n");
  }

  function download(name, type, content) {
    var blob = content instanceof Blob ? content : new Blob([content], { type:type });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function copyText(text, button) {
    var done = function () { button.textContent = "Imenakiliwa"; setTimeout(function () { button.textContent = "Nakili"; }, 1200); };
    var fallback = function () {
      var area = document.createElement("textarea"); area.value = text; area.style.position = "fixed"; area.style.left = "-9999px"; document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove(); done();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback);
    else fallback();
  }

  function renderExports(payload) {
    var target = document.querySelector("[data-ua-exports]");
    var labels = { copy:"Nakili", json:"Pakua JSON", txt:"Pakua TXT", pdf:"Pakua PDF", print:"Chapisha" };
    target.innerHTML = contract.outputs.map(function (kind) { return '<button type="button" data-ua-export="' + kind + '">' + labels[kind] + "</button>"; }).join("");
    target.querySelectorAll("[data-ua-export]").forEach(function (button) {
      button.addEventListener("click", async function () {
        var kind = button.getAttribute("data-ua-export");
        var basename = "afrotools-" + contract.id + "-sw";
        var text = payloadText(payload);
        if (kind === "copy") copyText(text, button);
        else if (kind === "json") download(basename + ".json", "application/json", JSON.stringify(payload, null, 2) + "\n");
        else if (kind === "txt") download(basename + ".txt", "text/plain;charset=utf-8", text + "\n");
        else if (kind === "print") root.print();
        else if (kind === "pdf") {
          var pdf = root.AfroTools && root.AfroTools.SwahiliLocalPdf;
          if (!pdf) throw new Error("Maktaba ya PDF ya ndani haipatikani.");
          var bytes = await pdf.create(contract.title, text.split("\n").filter(Boolean));
          download(basename + ".pdf", "application/pdf", new Blob([bytes], { type:"application/pdf" }));
        }
      });
    });
  }

  function countryCode(country) { return country.slug || country.code || country.iso2 || country.id; }

  function prepareAtlas(input) {
    var atlas = root.AfroAtlas;
    if (!atlas || typeof atlas.getAllCountries !== "function") return { error:{ status:"invalid", field:"countryA", code:"records_required" } };
    input.countries = atlas.getAllCountries().map(function (country) { return { id:countryCode(country), name:country.name, gdp:country.gdp, population:country.population, resources:country.resources }; });
    return { input:input };
  }

  function preparePoints(input) {
    var points = root.AfroPointsEngine;
    if (!points || typeof points.getSubmissionPoints !== "function") return { error:{ status:"invalid", field:"category", code:"records_required" } };
    input.pointsPerRecord = points.getSubmissionPoints(input.category);
    var node = document.querySelector('[data-ua-field="pointsPerRecord"]'); if (node) node.value = input.pointsPerRecord;
    return { input:input };
  }

  function prepareKitchen(input) {
    var kitchen = root.AfroKitchenEngine;
    if (!kitchen || !Array.isArray(kitchen.SEED_RECIPES)) return { error:{ status:"invalid", field:"recipe", code:"records_required" } };
    var recipe = kitchen.SEED_RECIPES.find(function (item) { return item.slug === input.recipe; });
    if (!recipe) return { error:{ status:"invalid", field:"recipe", code:"ingredient_required" } };
    delegateState.recipe = recipe; input.originalServings = recipe.default_servings;
    input.ingredients = (recipe.ingredients || []).map(function (ingredient) { return { name:ingredient.name, amount:ingredient.amount, unit:ingredient.unit }; });
    var node = document.querySelector('[data-ua-field="originalServings"]'); if (node) node.value = recipe.default_servings;
    return { input:input };
  }

  function syncKitchenRecipe() {
    if (contract.id !== "afrokitchen") return;
    var original = form.querySelector('[data-ua-field="originalServings"]');
    var selected = form.querySelector('[data-ua-field="recipe"]');
    var recipes = root.AfroKitchenEngine && root.AfroKitchenEngine.SEED_RECIPES || [];
    var recipe = recipes.find(function (item) { return selected && item.slug === selected.value; });
    if (original) {
      original.readOnly = true;
      original.value = recipe ? recipe.default_servings : "";
    }
  }

  function clearKitchenOutput() {
    if (contract.id !== "afrokitchen") return;
    lastPayload = null;
    ["[data-ua-metrics]", "[data-ua-table]", "[data-ua-exports]"].forEach(function (selector) {
      var node = document.querySelector(selector);
      if (node) node.innerHTML = "";
    });
    clearInvalid();
  }

  function invalidateKitchenResult() {
    if (contract.id !== "afrokitchen") return;
    clearKitchenOutput();
    var section = document.querySelector("[data-ua-result]");
    var status = document.querySelector("[data-ua-status]");
    status.className = "";
    status.removeAttribute("tabindex");
    status.textContent = section.hidden ? "" : "Mapishi au sehemu zimebadilika. Kokotoa tena kupata viungo na faili zilizosasishwa.";
  }

  function revealKitchenControl(node) {
    if (contract.id !== "afrokitchen" || !node) return;
    node.focus({ preventScroll: true });
    node.scrollIntoView({ block: "center", behavior: "instant" });
  }

  async function prepareConflict(input) {
    var conflict = root.AfroConflict;
    if (!conflict || typeof conflict.getConflicts !== "function") return { error:{ status:"invalid", field:"records", code:"records_required" } };
    try { var response = await conflict.getConflicts({}); input.records = Array.isArray(response) ? response : response && (response.conflicts || response.rows) || []; return { input:input }; }
    catch (error) { return { error:{ status:"invalid", field:"records", code:"records_required" } }; }
  }

  async function preparePrices(input) {
    var prices = root.AfroPricesEngine;
    if (!prices || typeof prices.searchProducts !== "function") return { error:{ status:"invalid", field:"records", code:"records_required" } };
    try {
      var response = await prices.searchProducts(input.query, input.country || "NG");
      var rows = [];
      ((response && response.results) || []).forEach(function (product) {
        (product.listings || product.prices || []).forEach(function (listing) {
          rows.push({ country:listing.country || product.country || response.country && response.country.name || input.country, city:listing.city || listing.platform_name || listing.store_name || "", currency:listing.currency_code || listing.currency || "", unit:listing.unit || "kipimo", price:listing.price, observed_at:listing.observed_at || listing.updated_at || listing.lastVerified, source:listing.source_url || listing.platform_name || listing.source });
        });
      });
      input.records = rows; return { input:input };
    } catch (error) { return { error:{ status:"invalid", field:"records", code:"records_required" } }; }
  }

  async function calculate(input) {
    var prepared = { input:input };
    if (contract.id === "afroatlas") prepared = prepareAtlas(input);
    else if (contract.id === "afropoints") prepared = preparePoints(input);
    else if (contract.id === "afrokitchen") prepared = prepareKitchen(input);
    else if (contract.id === "africa-conflict") prepared = await prepareConflict(input);
    else if (contract.id === "afroprices") prepared = await preparePrices(input);
    return prepared.error || engine.calculate(contract.id, prepared.input);
  }

  function populateSelect(key, items, valueKey, labelKey) {
    var select = document.querySelector('[data-ua-field="' + key + '"]'); if (!select) return;
    select.innerHTML = items.map(function (item) { var value = typeof valueKey === "function" ? valueKey(item) : item[valueKey]; var label = typeof labelKey === "function" ? labelKey(item) : item[labelKey]; return '<option value="' + escapeHtml(value) + '">' + escapeHtml(label) + "</option>"; }).join("");
  }

  function initializeDelegates() {
    if (contract.id === "afroatlas" && root.AfroAtlas) { var countries = root.AfroAtlas.getAllCountries(); populateSelect("countryA", countries, countryCode, "name"); populateSelect("countryB", countries, countryCode, "name"); document.querySelector('[data-ua-field="countryA"]').value = "nigeria"; document.querySelector('[data-ua-field="countryB"]').value = "ghana"; }
    else if (contract.id === "afropoints" && root.AfroPointsEngine) { populateSelect("category", root.AfroPointsEngine.CATEGORIES, "id", "label"); var category = document.querySelector('[data-ua-field="category"]'); if (category) category.value = "staple_price"; }
    else if (contract.id === "afrokitchen" && root.AfroKitchenEngine) { populateSelect("recipe", root.AfroKitchenEngine.SEED_RECIPES, "slug", function (recipe) { return recipe.name + " — " + recipe.country_name; }); var recipe = document.querySelector('[data-ua-field="recipe"]'); if (recipe) recipe.value = "nigerian-jollof-rice"; }
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault(); clearInvalid();
    var submit = form.querySelector('button[type="submit"]'); submit.disabled = true;
    var input = collectInput(); var result = await calculate(input); submit.disabled = false;
    var section = document.querySelector("[data-ua-result]"); var status = document.querySelector("[data-ua-status]");
    if (!result || result.status !== "ok") {
      status.textContent = invalidMessage(result || {}); status.className = "ua-error";
      document.querySelector("[data-ua-metrics]").innerHTML = ""; document.querySelector("[data-ua-table]").innerHTML = ""; document.querySelector("[data-ua-exports]").innerHTML = "";
      var invalid = result && result.field && document.querySelector('[data-ua-field="' + result.field + '"]');
      if (contract.id === "afrokitchen") {
        section.hidden = false;
        lastPayload = null;
        if (invalid) invalid.setAttribute("aria-invalid", "true");
        else status.setAttribute("tabindex", "-1");
        revealKitchenControl(invalid || status);
        return;
      }
      if (invalid) { invalid.setAttribute("aria-invalid", "true"); invalid.focus(); }
      else { status.setAttribute("tabindex", "-1"); status.focus(); }
      section.hidden = false; lastPayload = null; return;
    }
    status.textContent = "Hesabu imekamilika kwenye kivinjari hiki."; status.className = "ua-ready";
    renderMetrics(result, input); renderRows(result); lastPayload = { schemaVersion:1, toolId:contract.id, locale:"sw", input:input, result:result, source:contract.source, freshness:contract.freshness, limitations:contract.limitations };
    renderExports(lastPayload); section.hidden = false; section.focus();
  });

  form.querySelector("[data-ua-reset]").addEventListener("click", function () {
    form.reset(); clearInvalid(); lastPayload = null; var section = document.querySelector("[data-ua-result]"); section.hidden = true; var status = document.querySelector("[data-ua-status]"); status.textContent = ""; status.removeAttribute("tabindex");
    if (contract.id === "afrokitchen") {
      clearKitchenOutput();
      syncKitchenRecipe();
      revealKitchenControl(form.querySelector("[data-ua-field]"));
    }
  });

  initializeDelegates();
  if (contract.id === "afrokitchen") {
    syncKitchenRecipe();
    var original = form.querySelector('[data-ua-field="originalServings"]');
    original.addEventListener("focus", function () {
      root.requestAnimationFrame(function () {
        if (document.activeElement !== original) return;
        var bounds = original.getBoundingClientRect();
        var host = document.querySelector("afro-navbar");
        var nav = host && host.shadowRoot && host.shadowRoot.querySelector("nav") || host;
        var headerBottom = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
        if (bounds.top < headerBottom || bounds.bottom > root.innerHeight) revealKitchenControl(original);
      });
    });
    form.querySelector('[data-ua-field="recipe"]').addEventListener("change", function () {
      syncKitchenRecipe();
      invalidateKitchenResult();
    });
    form.querySelector('[data-ua-field="targetServings"]').addEventListener("input", invalidateKitchenResult);
  }
}(window));
