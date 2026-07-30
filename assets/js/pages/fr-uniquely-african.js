(function initFrenchUniquelyAfrican(root, document) {
  "use strict";

  if (!document) return;
  var contractNode = document.getElementById("uaContract");
  var form = document.querySelector("[data-ua-form]");
  var engine = root.AfroToolsUniquelyAfricanEngine;
  if (!contractNode || !form || !engine) return;

  var contract = JSON.parse(contractNode.textContent);
  var lastPayload = null;
  var delegateState = {};

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }

  function collectInput() {
    var input = {};
    form.querySelectorAll("[data-ua-field]").forEach(function (field) {
      input[field.getAttribute("data-ua-field")] = field.type === "number" ? number(field.value) : field.value;
    });
    return input;
  }

  function metricValue(key, value, input) {
    if (typeof value === "boolean") return value ? "Oui" : "Non";
    if (typeof value === "string") return value;
    if (!Number.isFinite(value)) return "—";
    var currencyKeys = /(?:cost|fee|value|profit|revenue|price|total|gap|secured|remittance|material|quote|expenses|difference|spread)$/i;
    var percentKeys = /Pct$|weightedSeverity|scaleFactor/i;
    var digits = percentKeys.test(key) ? 2 : Math.abs(value) < 10 ? 2 : 0;
    var formatted = value.toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    if (percentKeys.test(key)) return `${formatted}${/Pct$/.test(key) ? " %" : ""}`;
    if (currencyKeys.test(key) && input.currency) return `${formatted} ${input.currency}`;
    return formatted;
  }

  function renderMetrics(result, input) {
    var target = document.querySelector("[data-ua-metrics]");
    if (!target) return;
    target.className = "ua-metrics";
    target.innerHTML = Object.keys(result.values).filter(function (key) {
      return Object.prototype.hasOwnProperty.call(contract.metrics, key);
    }).map(function (key) {
      return `<article><span>${escapeHtml(contract.metrics[key])}</span><strong>${escapeHtml(metricValue(key, result.values[key], input))}</strong></article>`;
    }).join("");
  }

  function table(target, headers, rows) {
    if (!target) return;
    target.innerHTML = `<thead><tr>${headers.map(function (header) { return `<th scope="col">${escapeHtml(header)}</th>`; }).join("")}</tr></thead><tbody>${rows.map(function (row) {
      return `<tr>${row.map(function (cell) { return `<td>${escapeHtml(cell)}</td>`; }).join("")}</tr>`;
    }).join("")}</tbody>`;
  }

  function renderFeeRows() {}

  function renderAjoRows(result, input) {
    var target = document.querySelector("[data-ua-table]");
    table(target, ["Tour", "Bénéficiaire", "Cagnotte"], result.rows.map(function (row) {
      return [row.round, `Membre ${row.recipient}`, metricValue("pool", row.pool, input)];
    }));
  }

  function renderEnergy(result) {
    var target = document.querySelector("[data-ua-chart]");
    if (!target) return;
    var daily = result.values.dailyKwh || 0;
    var monthly = result.values.monthlyKwh || 0;
    target.innerHTML = `<div><span>Jour</span><i style="--ua-bar:${Math.max(4, Math.min(100, daily / Math.max(monthly, 1) * 100))}%"></i></div><div><span>Période</span><i style="--ua-bar:100%"></i></div>`;
  }

  function renderFuelRows() {}

  function renderHawalaRows(result, input) {
    var names = { bank: "Virement bancaire", mobile: "Mobile money", fintech: "Fintech", cash: "Retrait d’espèces", crypto: "Crypto-actif", hawala: "Hawala / agent" };
    table(document.querySelector("[data-ua-table]"), ["Canal", "Frais", "Marge FX", "Coût total", "Valeur nette"], result.rows.map(function (row) {
      return [names[row.channel] || row.channel, `${row.feePct.toFixed(2)} %`, `${row.fxPct.toFixed(2)} %`, metricValue("totalCost", row.totalCost, input), metricValue("recipientValue", row.recipientValue, input)];
    }));
  }

  function renderStapleRows() {}
  function renderWholesaleRows() {}

  function renderLandRows(result) {
    var labels = { sqm: "m²", sqft: "pieds²", sqyd: "yards²", acre: "acre", hectare: "hectare", plot: "plot NG indicatif", halfplot: "demi-plot NG", gplot: "plot GH indicatif", keighth: "1/8 acre KE", morgen: "morgen ZA", kacre: "acre KE" };
    table(document.querySelector("[data-ua-table]"), ["Unité", "Valeur"], result.rows.map(function (row) {
      return [labels[row.unit] || row.unit, Number(row.value).toLocaleString("fr-FR", { maximumFractionDigits: 4 })];
    }));
  }

  function renderFxRows() {}

  function renderCityRows(result) {
    var target = document.querySelector("[data-ua-table]");
    if (!target) return;
    target.innerHTML = result.rows.map(function (row) {
      return `<article><h3>${escapeHtml(row.city)}</h3><strong>${escapeHtml(row.totalUsd.toLocaleString("fr-FR", { maximumFractionDigits: 0 }))} USD / mois</strong><span>${escapeHtml(row.localTotal.toLocaleString("fr-FR", { maximumFractionDigits: 0 }))} ${escapeHtml(row.currency)}</span></article>`;
    }).join("");
  }

  function renderAtlasRows(result) {
    var target = document.querySelector("[data-ua-table]");
    if (!target) return;
    target.innerHTML = result.rows.map(function (row) {
      return `<article><h3>${escapeHtml(row.name)}</h3><dl><div><dt>Population</dt><dd>${escapeHtml(metricValue("population", row.population, {}))}</dd></div><div><dt>PIB</dt><dd>${escapeHtml(metricValue("gdpUsd", row.gdpUsd, { currency: "USD" }))}</dd></div><div><dt>PIB par habitant</dt><dd>${escapeHtml(metricValue("gdpPerCapitaUsd", row.gdpPerCapitaUsd, { currency: "USD" }))}</dd></div></dl><p><strong>Ressources:</strong> ${escapeHtml(row.resources.join(", ") || "Non renseignées")}</p></article>`;
    }).join("");
  }

  function renderPointsRows() {}

  function renderKitchenRows(result) {
    var recipe = delegateState.recipe;
    var context = document.querySelector("[data-ua-context]");
    if (context && recipe) {
      context.innerHTML = `<strong>${escapeHtml(recipe.name)}</strong><span>${escapeHtml(recipe.name_local || "")}</span><span>${escapeHtml(recipe.country_name || "")} · ${escapeHtml(recipe.region || "")}</span>`;
    }
    table(document.querySelector("[data-ua-table]"), ["Ingrédient", "Quantité adaptée", "Unité"], result.rows.map(function (row) {
      return [row.name, Number.isFinite(row.scaledAmount) ? row.scaledAmount.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) : "Selon goût", row.unit];
    }));
  }

  function renderConflictRows(result) {
    var target = document.querySelector("[data-ua-table]");
    if (!target) return;
    if (!result.rows.length) {
      target.innerHTML = '<p class="ua-empty">Aucun dossier ne correspond à ce filtre. Le résultat reste vide; aucun dossier n’est inventé.</p>';
      return;
    }
    target.innerHTML = result.rows.map(function (row) {
      return `<article><h3>${escapeHtml(row.name || row.slug || "Dossier")}</h3><p>${escapeHtml(row.country || "Pays non renseigné")} · ${escapeHtml(row.status || "Statut non renseigné")}</p><span>${escapeHtml(row.updatedAt || "Date non renseignée")}</span></article>`;
    }).join("");
  }

  function renderDiasporaRows(result) {
    var target = document.querySelector("[data-ua-checklist]");
    if (!target) return;
    var reached = result.values.thresholdReached;
    target.innerHTML = [
      reached ? "Le seuil saisi est atteint; vérifiez si la règle l’utilise réellement." : `Il reste ${result.values.daysToThreshold} jour(s) avant le seuil saisi.`,
      "Confirmez la définition des jours de présence, les années fractionnées et les exceptions.",
      "Vérifiez domicile, foyer, centre des intérêts et convention fiscale applicable.",
      "Documentez la source officielle, sa date et les transferts prévus avant toute déclaration."
    ].map(function (item) { return `<li>${escapeHtml(item)}</li>`; }).join("");
  }

  function renderNollywoodRows(result) {
    var target = document.querySelector("[data-ua-chart]");
    if (!target) return;
    var total = result.values.total || 1;
    var secured = result.values.secured || 0;
    var gap = result.values.fundingGap || 0;
    target.innerHTML = `<div><span>Financé</span><i style="--ua-bar:${Math.max(0, Math.min(100, secured / total * 100))}%"></i></div><div><span>À financer</span><i style="--ua-bar:${Math.max(0, Math.min(100, gap / total * 100))}%"></i></div>`;
  }

  function renderOkadaRows(result) {
    var target = document.querySelector("[data-ua-chart]");
    if (!target) return;
    var gross = Math.max(1, result.values.monthlyGross || 1);
    var profit = Math.max(0, result.values.monthlyProfit || 0);
    var expenses = Math.max(0, result.values.expenses || 0);
    target.innerHTML = `<div class="ua-profit" style="--ua-share:${profit / gross * 100}%">Bénéfice ${Math.max(0, profit / gross * 100).toFixed(1)} %</div><div class="ua-cost" style="--ua-share:${expenses / gross * 100}%">Charges ${Math.max(0, expenses / gross * 100).toFixed(1)} %</div>`;
  }

  function renderPricesRows(result, input) {
    table(document.querySelector("[data-ua-table]"), ["Pays", "Ville / marché", "Prix unitaire", "Total", "Date"], result.rows.map(function (row) {
      return [row.country, row.city, `${row.unitPrice.toLocaleString("fr-FR")} ${row.currency}`, `${row.total.toLocaleString("fr-FR")} ${row.currency}`, row.observedAt || "Non renseignée"];
    }));
  }

  function renderTextileRows() {}
  function renderFabricRows() {}

  var routeRenderers = {
    "fintech-fee-watch": renderFeeRows,
    "ajo-chama": renderAjoRows,
    "electricity-estimator": renderEnergy,
    "fuel-cost": renderFuelRows,
    "hawala-tracker": renderHawalaRows,
    "staple-basket": renderStapleRows,
    "wholesale-retail-spread": renderWholesaleRows,
    "land-size": renderLandRows,
    "informal-fx-watch": renderFxRows,
    "cost-of-living": renderCityRows,
    afroatlas: renderAtlasRows,
    afropoints: renderPointsRows,
    afrokitchen: renderKitchenRows,
    "africa-conflict": renderConflictRows,
    "diaspora-guide": renderDiasporaRows,
    "nollywood-pitch": renderNollywoodRows,
    "okada-income": renderOkadaRows,
    afroprices: renderPricesRows,
    "ankara-kente-cost": renderTextileRows,
    "fabric-cost": renderFabricRows
  };

  function invalidMessage(result) {
    var field = contract.fields.find(function (item) { return item.key === result.field; });
    var label = field ? field.label : "Les données";
    var messages = {
      positive_required: `${label} doit être supérieur à zéro.`,
      distinct_supported_cities_required: "Choisissez deux villes différentes et disponibles.",
      distinct_supported_countries_required: "Choisissez deux pays différents et disponibles.",
      days_out_of_range: "Le nombre de jours doit rester entre 0 et 366.",
      ingredient_required: "La recette ne contient aucun ingrédient exploitable.",
      records_required: "Aucune donnée structurée n’est disponible. Le calcul reste fermé.",
      numeric_prices_required: "Aucun prix numérique comparable n’est disponible.",
      at_least_one_record_required: "Ajoutez au moins un dossier avant de calculer.",
      unknown_tool: "Le propriétaire de calcul de cette route est inconnu."
    };
    return messages[result.code] || `${label} n’est pas valide.`;
  }

  function exportPayload(input, result) {
    return {
      schemaVersion: 1,
      toolId: contract.id,
      locale: "fr",
      route: contract.frenchRoute,
      generatedAt: new Date().toISOString(),
      localOnly: true,
      input: input,
      result: result,
      source: contract.source,
      freshness: contract.freshness,
      confidence: contract.confidence,
      limitations: contract.limitations,
      culturalScope: contract.culturalScope
    };
  }

  function payloadText(payload) {
    var lines = [
      contract.title,
      `Route: ${contract.frenchRoute}`,
      "",
      "Résultats"
    ];
    Object.keys(payload.result.values).forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(contract.metrics, key)) {
        lines.push(`${contract.metrics[key]}: ${metricValue(key, payload.result.values[key], payload.input)}`);
      }
    });
    lines.push("", `Source: ${contract.source}`, `Fraîcheur: ${contract.freshness}`, `Confiance: ${contract.confidence}`, `Limites: ${contract.limitations}`);
    return lines.join("\n");
  }

  function download(name, type, content) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    root.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function ascii(value) {
    return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E\n]/g, "?");
  }

  var jsPdfPromise = null;
  function ensureJsPdf() {
    if (root.jspdf && root.jspdf.jsPDF) return Promise.resolve(root.jspdf.jsPDF);
    if (jsPdfPromise) return jsPdfPromise;
    jsPdfPromise = new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-fr-ua-jspdf]');
      var script = existing || document.createElement("script");
      function ready() {
        if (root.jspdf && root.jspdf.jsPDF) resolve(root.jspdf.jsPDF);
        else reject(new Error("jspdf_unavailable"));
      }
      script.addEventListener("load", ready, { once: true });
      script.addEventListener("error", reject, { once: true });
      if (!existing) {
        script.src = "/assets/vendor/jspdf/jspdf.umd.min.js";
        script.setAttribute("data-fr-ua-jspdf", "");
        document.head.appendChild(script);
      }
    });
    return jsPdfPromise;
  }

  function pdfBlob(text) {
    return ensureJsPdf().then(function (JsPdf) {
      var pdf = new JsPdf({ unit: "pt", format: "a4", compress: false });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      var lines = pdf.splitTextToSize(ascii(text), 495);
      var y = 50;
      lines.forEach(function (line) {
        if (y > 790) {
          pdf.addPage();
          y = 50;
        }
        pdf.text(line || " ", 50, y);
        y += 14;
      });
      return pdf.output("blob");
    });
  }

  function renderExports(payload) {
    var target = document.querySelector("[data-ua-exports]");
    if (!target) return;
    var labels = { copy: "Copier", json: "Exporter JSON", txt: "Exporter TXT", pdf: "Exporter PDF", print: "Imprimer" };
    target.innerHTML = contract.outputs.map(function (kind) {
      return `<button type="button" data-ua-export="${escapeHtml(kind)}">${escapeHtml(labels[kind] || kind.toUpperCase())}</button>`;
    }).join("");
    target.querySelectorAll("[data-ua-export]").forEach(function (button) {
      button.addEventListener("click", function () {
        var kind = button.getAttribute("data-ua-export");
        var basename = `afrotools-${contract.id}-fr`;
        if (kind === "copy") {
          var text = payloadText(payload);
          function fallbackCopy() {
            var textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.setAttribute("readonly", "");
            textarea.style.position = "fixed";
            textarea.style.left = "-9999px";
            document.body.appendChild(textarea);
            textarea.select();
            try {
              if (!document.execCommand("copy")) throw new Error("copy_not_supported");
              button.textContent = "Copié";
            } catch (error) {
              button.textContent = "Copie impossible";
            } finally {
              document.body.removeChild(textarea);
            }
          }
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
              button.textContent = "Copié";
            }).catch(fallbackCopy);
          } else {
            fallbackCopy();
          }
        } else if (kind === "json") {
          download(`${basename}.json`, "application/json;charset=utf-8", JSON.stringify(payload, null, 2));
        } else if (kind === "txt") {
          download(`${basename}.txt`, "text/plain;charset=utf-8", payloadText(payload));
        } else if (kind === "pdf") {
          pdfBlob(payloadText(payload)).then(function (blob) {
            download(`${basename}.pdf`, "application/pdf", blob);
          }).catch(function () {
            button.textContent = "Export PDF impossible";
          });
        } else if (kind === "print") {
          root.print();
        }
      });
    });
  }

  function setResult(result, input) {
    var section = document.querySelector("[data-ua-result]");
    var status = document.querySelector("[data-ua-status]");
    if (!section || !status) return;
    section.hidden = false;
    if (result.status !== "ok") {
      lastPayload = null;
      root.AfroToolsFrenchUniquelyAfricanResult = null;
      status.className = "ua-error";
      status.textContent = invalidMessage(result);
      var metricTarget = document.querySelector("[data-ua-metrics]");
      if (metricTarget) metricTarget.innerHTML = "";
      var exportTarget = document.querySelector("[data-ua-exports]");
      if (exportTarget) exportTarget.innerHTML = "";
      section.focus();
      return;
    }
    status.className = "ua-success";
    status.textContent = "Résultat calculé dans ce navigateur. Modifiez une entrée pour comparer un autre scénario.";
    renderMetrics(result, input);
    var renderer = routeRenderers[contract.id];
    if (renderer) renderer(result, input);
    lastPayload = exportPayload(input, result);
    root.AfroToolsFrenchUniquelyAfricanResult = { input: input, result: result };
    renderExports(lastPayload);
    section.focus();
  }

  function countryCode(country) {
    return country.slug || country.code || country.iso2 || country.id;
  }

  function prepareAtlas(input) {
    var atlas = root.AfroAtlas;
    if (!atlas || typeof atlas.getAllCountries !== "function") return { error: { status: "invalid", field: "countryA", code: "records_required" } };
    input.countries = atlas.getAllCountries().map(function (country) {
      return {
        id: countryCode(country),
        name: country.name,
        gdp: country.gdp,
        population: country.population,
        resources: country.resources
      };
    });
    return { input: input };
  }

  function preparePoints(input) {
    var points = root.AfroPointsEngine;
    if (!points) return { error: { status: "invalid", field: "category", code: "records_required" } };
    input.pointsPerRecord = points.getSubmissionPoints(input.category);
    var field = document.querySelector('[data-ua-field="pointsPerRecord"]');
    if (field) field.value = input.pointsPerRecord;
    return { input: input };
  }

  function prepareKitchen(input) {
    var kitchen = root.AfroKitchenEngine;
    if (!kitchen) return { error: { status: "invalid", field: "recipe", code: "records_required" } };
    var recipe = kitchen.SEED_RECIPES.find(function (item) { return item.slug === input.recipe; });
    if (!recipe) return { error: { status: "invalid", field: "recipe", code: "ingredient_required" } };
    delegateState.recipe = recipe;
    input.originalServings = recipe.default_servings;
    input.ingredients = (recipe.ingredients || []).map(function (ingredient) {
      return { name: ingredient.name, amount: ingredient.amount, unit: ingredient.unit };
    });
    var original = document.querySelector('[data-ua-field="originalServings"]');
    if (original) original.value = recipe.default_servings;
    return { input: input };
  }

  async function prepareConflict(input) {
    var conflict = root.AfroConflict;
    if (!conflict || typeof conflict.getConflicts !== "function") return { error: { status: "invalid", field: "records", code: "records_required" } };
    try {
      var response = await conflict.getConflicts({});
      input.records = Array.isArray(response) ? response : response && (response.conflicts || response.rows) || [];
      return { input: input };
    } catch (error) {
      return { error: { status: "invalid", field: "records", code: "records_required" } };
    }
  }

  async function preparePrices(input) {
    var prices = root.AfroPricesEngine;
    if (!prices || typeof prices.searchProducts !== "function") return { error: { status: "invalid", field: "records", code: "records_required" } };
    try {
      var response = await prices.searchProducts(input.query, input.country || "NG");
      var products = response && response.results || [];
      var rows = [];
      products.forEach(function (product) {
        (product.listings || product.prices || []).forEach(function (listing) {
          rows.push({
            country: response.country && response.country.name || input.country,
            city: listing.city || listing.platform_name || listing.store_name || listing.source || "",
            currency: listing.currency_code || listing.currency || response.country && response.country.currency && response.country.currency.code || "",
            unit: listing.unit || "unité",
            price: listing.price,
            observed_at: listing.observed_at || listing.updated_at || listing.lastVerified || listing.submittedAt,
            source: listing.source_url || listing.platform_name || listing.source
          });
        });
      });
      input.records = rows;
      return { input: input };
    } catch (error) {
      return { error: { status: "invalid", field: "records", code: "records_required" } };
    }
  }

  async function calculate(input) {
    var prepared = { input: input };
    if (contract.id === "afroatlas") prepared = prepareAtlas(input);
    else if (contract.id === "afropoints") prepared = preparePoints(input);
    else if (contract.id === "afrokitchen") prepared = prepareKitchen(input);
    else if (contract.id === "africa-conflict") prepared = await prepareConflict(input);
    else if (contract.id === "afroprices") prepared = await preparePrices(input);
    if (prepared.error) return prepared.error;
    return engine.calculate(contract.id, prepared.input);
  }

  function populateSelect(fieldKey, items, valueKey, labelKey) {
    var select = document.querySelector(`[data-ua-field="${fieldKey}"]`);
    if (!select) return;
    var selected = select.value;
    select.innerHTML = items.map(function (item) {
      var value = typeof valueKey === "function" ? valueKey(item) : item[valueKey];
      var label = typeof labelKey === "function" ? labelKey(item) : item[labelKey];
      return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
    }).join("");
    if (items.some(function (item) { return String(typeof valueKey === "function" ? valueKey(item) : item[valueKey]) === selected; })) select.value = selected;
  }

  function initializeDelegates() {
    if (contract.id === "afroatlas" && root.AfroAtlas) {
      var countries = root.AfroAtlas.getAllCountries();
      populateSelect("countryA", countries, countryCode, "name");
      populateSelect("countryB", countries, countryCode, "name");
      document.querySelector('[data-ua-field="countryA"]').value = "nigeria";
      document.querySelector('[data-ua-field="countryB"]').value = "ghana";
    } else if (contract.id === "afropoints" && root.AfroPointsEngine) {
      populateSelect("category", root.AfroPointsEngine.CATEGORIES, "id", "label");
      var category = document.querySelector('[data-ua-field="category"]');
      if (category) category.value = "staple_price";
    } else if (contract.id === "afrokitchen" && root.AfroKitchenEngine) {
      populateSelect("recipe", root.AfroKitchenEngine.SEED_RECIPES, "slug", function (recipe) {
        return `${recipe.name} — ${recipe.country_name}`;
      });
      var recipeSelect = document.querySelector('[data-ua-field="recipe"]');
      if (recipeSelect) recipeSelect.value = "nigerian-jollof-rice";
    }
  }

  async function loadFeed() {
    if (!contract.endpoint) return;
    var status = document.querySelector("[data-ua-feed-status]");
    var target = document.querySelector("[data-ua-feed]");
    try {
      var response = await fetch(`${contract.endpoint}?limit=6`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      var data = await response.json();
      var rows = data[contract.responseKey] || data.rows || [];
      if (!Array.isArray(rows) || !rows.length) {
        status.textContent = "Aucune observation vérifiée n’est disponible pour ce filtre. Aucun prix ni taux n’est inventé.";
        target.innerHTML = '<p class="ua-empty">État vide vérifié.</p>';
        return;
      }
      status.textContent = `${rows.length} observation(s) reçue(s). Vérifiez date, unité et preuve avant usage.`;
      target.innerHTML = rows.slice(0, 6).map(function (row) {
        var label = row.provider || row.product_name || row.asset || row.base_currency || row.market_name || "Observation";
        var place = row.city || row.country_code || row.target_currency || "";
        var date = row.observed_at || row.updated_at || "Date non renseignée";
        return `<article><strong>${escapeHtml(label)}</strong><span>${escapeHtml(place)}</span><small>${escapeHtml(date)}</small></article>`;
      }).join("");
    } catch (error) {
      status.textContent = "Données distantes indisponibles. Le calcul local reste utilisable avec vos propres observations.";
      target.innerHTML = '<p class="ua-empty">Mode local — aucune donnée distante affichée.</p>';
    }
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    var input = collectInput();
    var submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "Calcul en cours…";
    try {
      var result = await calculate(input);
      setResult(result, input);
    } finally {
      submit.disabled = false;
      submit.textContent = contract.action;
    }
  });

  var reset = form.querySelector("[data-ua-reset]");
  if (reset) reset.addEventListener("click", function () {
    form.reset();
    lastPayload = null;
    var section = document.querySelector("[data-ua-result]");
    if (section) section.hidden = true;
    var status = document.querySelector("[data-ua-status]");
    if (status) status.textContent = "";
    initializeDelegates();
    form.querySelector("[data-ua-field]").focus();
  });

  initializeDelegates();
  loadFeed();
})(window, document);
