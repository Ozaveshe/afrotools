(function initFrenchUniquelyAfrican(root, document) {
  "use strict";

  if (!document) return;
  var contractNode = document.getElementById("uaContract");
  var form = document.querySelector("[data-ua-form]");
  var engine = root.AfroToolsUniquelyAfricanEngine;
  if (!contractNode || !form || !engine) return;

  var contract = JSON.parse(contractNode.textContent);
  var lastPayload = null;
  var kitchenCopyRevision = 0;
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
    var method = kitchenMethod(recipe);
    if (context && method) {
      context.innerHTML = `<strong>${escapeHtml(method.title)}</strong><span>${escapeHtml(method.localName || "")}</span><span>${escapeHtml(method.country)} · ${escapeHtml(method.region)}</span>`;
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
    if (contract.id === "afrokitchen") {
      var recipes = root.AfroKitchenEngine && root.AfroKitchenEngine.SEED_RECIPES || [];
      var recipe = recipes.find(function (item) { return item.slug === payload.input.recipe; });
      lines.push("", `Recette: ${payload.method ? payload.method.title : payload.input.recipe}`, "Ingrédients redimensionnés");
      payload.result.rows.forEach(function (row) {
        var amount = Number.isFinite(row.scaledAmount) ? row.scaledAmount.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) : "Selon goût";
        lines.push(`${row.name}: ${amount}${row.unit ? " " + row.unit : ""}`);
      });
      if (payload.method) {
        lines.push("", "Préparation — " + payload.method.title, methodContext(payload.method));
        payload.method.steps.forEach(function (step, index) { lines.push((index + 1) + ". " + step); });
        lines.push("Nom dans le catalogue anglais: " + recipe.name, "https://afrotools.com" + payload.method.source);
      }
    }
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

  function copyKitchenPayload(payload, button) {
    if (contract.id !== "afrokitchen" || payload !== lastPayload || !button.isConnected) return;
    var attempt = ++kitchenCopyRevision;
    var text = payloadText(payload);
    function activeFocus() {
      var node = document.activeElement;
      while (node && node.shadowRoot && node.shadowRoot.activeElement) node = node.shadowRoot.activeElement;
      return node;
    }
    var focusAtRequest = activeFocus();
    function current() {
      return attempt === kitchenCopyRevision && payload === lastPayload && button.isConnected;
    }
    function feedback(copied) {
      if (!current()) return;
      button.textContent = copied ? "Copié" : "Copie impossible";
      var status = document.querySelector("[data-ua-status]");
      if (status) status.textContent = copied ? "Recette copiée." : "La copie a échoué. Utilisez Exporter TXT pour enregistrer la recette complète.";
    }
    function fallback() {
      if (!current()) return;
      var restoreFocus = activeFocus();
      if (!restoreFocus || restoreFocus === focusAtRequest || restoreFocus === document.body || restoreFocus === document.documentElement) restoreFocus = button;
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      var copied = false;
      try {
        document.body.appendChild(textarea);
        textarea.focus({ preventScroll: true });
        textarea.select();
        copied = document.execCommand("copy") === true;
      } catch (error) {
        copied = false;
      } finally {
        textarea.remove();
        if (current() && restoreFocus.isConnected) revealKitchenControl(restoreFocus);
      }
      feedback(copied);
    }
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        Promise.resolve(navigator.clipboard.writeText(text)).then(function () { feedback(true); }, fallback);
      } else fallback();
    } catch (error) {
      fallback();
    }
  }

  function renderExports(payload) {
    var target = document.querySelector("[data-ua-exports]");
    if (!target) return;
    var labels = { copy: "Copier", json: "Exporter JSON", txt: "Exporter TXT", pdf: "Exporter PDF", print: "Imprimer" };
    target.innerHTML = contract.outputs.map(function (kind) {
      return `<button type="button" data-ua-export="${escapeHtml(kind)}">${escapeHtml(labels[kind] || kind.toUpperCase())}</button>`;
    }).join("");
    if (contract.id === "afrokitchen" && delegateState.recipe && delegateState.recipe.method_url) {
      var method = document.createElement("a");
      method.href = delegateState.recipe.method_url;
      method.hreflang = "en";
      method.target = "_blank";
      method.rel = "noopener";
      method.textContent = "Étapes de cuisson en anglais (nouvel onglet)";
      target.prepend(method);
    }
    target.querySelectorAll("[data-ua-export]").forEach(function (button) {
      button.addEventListener("click", function () {
        var kind = button.getAttribute("data-ua-export");
        var basename = `afrotools-${contract.id}-fr`;
        if (kind === "copy") {
          if (contract.id === "afrokitchen") {
            copyKitchenPayload(payload, button);
            return;
          }
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
      if (contract.id === "afrokitchen") {
        clearKitchenOutput();
        var invalid = result.field && form.querySelector(`[data-ua-field="${result.field}"]`);
        if (invalid) invalid.setAttribute("aria-invalid", "true");
        else status.setAttribute("tabindex", "-1");
        revealKitchenControl(invalid || status);
        return;
      }
      section.focus();
      return;
    }
    status.className = "ua-success";
    status.textContent = "Résultat calculé dans ce navigateur. Modifiez une entrée pour comparer un autre scénario.";
    renderMetrics(result, input);
    var renderer = routeRenderers[contract.id];
    if (renderer) renderer(result, input);
    lastPayload = exportPayload(input, result);
    if (contract.id === "afrokitchen") lastPayload.method = kitchenMethod(delegateState.recipe);
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

  var ingredientNames = {
    "long-grain parboiled rice": "riz long grain étuvé",
    "fresh Roma tomatoes": "tomates Roma fraîches",
    "red bell peppers (tatashe)": "poivrons rouges (tatashe)",
    "scotch bonnet peppers (ata rodo)": "piments Scotch Bonnet (ata rodo)",
    "onion": "oignon",
    "tomato paste": "concentré de tomates",
    "vegetable oil or groundnut oil": "huile végétale ou huile d’arachide",
    "bay leaves": "feuilles de laurier",
    "dried thyme": "thym séché",
    "curry powder": "poudre de curry",
    "seasoning cubes (Maggi/Knorr)": "cubes de bouillon (Maggi/Knorr)",
    "salt": "sel",
    "chicken stock or water": "bouillon de poulet ou eau",
    "butter": "beurre",
    "white maize flour (unga)": "farine de maïs blanc (unga)",
    "water": "eau",
    "sukuma wiki (collard greens)": "sukuma wiki (chou-feuille)",
    "vegetable oil or cooking fat": "huile végétale ou matière grasse de cuisson",
    "tomatoes": "tomates",
    "Royco seasoning": "assaisonnement Royco",
    "chicken": "poulet",
    "red onions": "oignons rouges",
    "berbere spice blend": "mélange d’épices berbéré",
    "niter kibbeh (Ethiopian spiced butter)": "niter kibbeh (beurre éthiopien aux épices)",
    "garlic": "ail",
    "fresh ginger": "gingembre frais",
    "hard-boiled eggs": "œufs durs",
    "water or chicken stock": "eau ou bouillon de poulet",
    "lemon juice": "jus de citron",
    "black pepper": "poivre noir",
    "minced beef or lamb": "viande hachée de bœuf ou d’agneau",
    "onions": "oignons",
    "turmeric": "curcuma",
    "white bread": "pain blanc",
    "apricot jam": "confiture d’abricots",
    "vinegar": "vinaigre",
    "raisins or sultanas": "raisins secs ou sultanines",
    "eggs": "œufs",
    "milk": "lait",
    "whole white fish (thiof/grouper)": "poisson blanc entier (thiof/mérou)",
    "parsley": "persil",
    "scotch bonnet pepper": "piment Scotch Bonnet",
    "vegetable oil": "huile végétale",
    "dried fish (gédj)": "poisson séché (gédj)",
    "tamarind ball": "boule de tamarin",
    "cassava": "manioc",
    "carrots": "carottes",
    "cabbage": "chou",
    "eggplant": "aubergines",
    "broken rice (riz brisé)": "riz brisé",
    "Egyptian rice": "riz égyptien",
    "brown lentils": "lentilles brunes",
    "elbow macaroni": "macaronis coudés",
    "chickpeas (canned)": "pois chiches en conserve",
    "crushed tomatoes": "tomates concassées",
    "white vinegar": "vinaigre blanc",
    "cumin": "cumin",
    "chili flakes": "flocons de piment",
    "vegetable oil for frying": "huile végétale pour la friture",
    "preserved lemons": "citrons confits",
    "green olives": "olives vertes",
    "ground ginger": "gingembre moulu",
    "saffron threads": "filaments de safran",
    "olive oil": "huile d’olive",
    "fresh coriander": "coriandre fraîche",
    "rice": "riz",
    "black-eyed peas or red beans": "niébé ou haricots rouges",
    "dried sorghum leaf stalks (waakye leaves)": "tiges séchées de feuilles de sorgho (feuilles de waakye)",
    "baking soda": "bicarbonate de soude"
  };
  var ingredientUnits = {
    "cup": ["tasse", "tasses"],
    "cups": ["tasse", "tasses"],
    "piece": ["pièce", "pièces"],
    "pieces": ["pièce", "pièces"],
    "large": "gros calibre",
    "medium": "calibre moyen",
    "teaspoon": "c. à café",
    "tablespoon": "c. à soupe",
    "tablespoons": "c. à soupe",
    "large bunch": ["grosse botte", "grosses bottes"],
    "bunch": ["botte", "bottes"],
    "cubes": ["cube", "cubes"],
    "whole": ["entier", "entiers"],
    "cloves": ["gousse", "gousses"],
    "slices": ["tranche", "tranches"]
  };

  function kitchenUnit(unit, amount) {
    var label = ingredientUnits[unit];
    if (!label) return unit;
    if (!Array.isArray(label)) return label;
    return label[Math.abs(amount) <= 1 ? 0 : 1];
  }

  function prepareKitchen(input) {
    var kitchen = root.AfroKitchenEngine;
    if (!kitchen) return { error: { status: "invalid", field: "recipe", code: "records_required" } };
    var recipe = kitchen.SEED_RECIPES.find(function (item) { return item.slug === input.recipe; });
    if (!recipe) return { error: { status: "invalid", field: "recipe", code: "ingredient_required" } };
    delegateState.recipe = recipe;
    input.originalServings = recipe.default_servings;
    input.ingredients = (recipe.ingredients || []).map(function (ingredient) {
      var name = ingredientNames[ingredient.name] || ingredient.name;
      if (recipe.slug === "ugali-sukuma-wiki" && ingredient.name === "salt") {
        var components = { "For ugali": "pour l’ugali", "For sukuma wiki": "pour le sukuma wiki" };
        if (components[ingredient.group_name]) name += " (" + components[ingredient.group_name] + ")";
      }
      return {
        name: name,
        amount: ingredient.amount,
        unit: kitchenUnit(ingredient.unit, ingredient.amount)
      };
    });
    var original = document.querySelector('[data-ua-field="originalServings"]');
    if (original) original.value = recipe.default_servings;
    return { input: input };
  }

  var kitchenMethods = {
    "nigerian-jollof-rice": {
      "title": "Riz jollof nigérian",
      "country": "Nigéria",
      "region": "Afrique de l’Ouest",
      "steps": [
        "Mixez les tomates fraîches, les poivrons rouges, le piment et l’oignon grossièrement haché pour obtenir une purée lisse.",
        "Faites revenir l’oignon émincé dans l’huile pendant environ 3 minutes. Ajoutez le concentré de tomate et remuez pendant 2 à 3 minutes.",
        "Versez la purée et ajoutez le laurier, le thym, le curry et les cubes de bouillon. Portez à ébullition, puis laissez réduire à feu moyen pendant 20 à 30 minutes, jusqu’à ce que l’huile remonte à la surface.",
        "Incorporez le riz étuvé rincé, le bouillon chaud ou l’eau et le sel. À la reprise de l’ébullition, couvrez hermétiquement et faites cuire à feu très doux pendant 30 minutes sans soulever le couvercle.",
        "Goûtez le riz. S’il est encore ferme, ajoutez un peu d’eau et prolongez la cuisson à couvert de 5 minutes. Retirez le laurier, ajoutez le beurre si vous le souhaitez et égrainez à la fourchette."
      ]
    },
    "ugali-sukuma-wiki": {
      "title": "Ugali au sukuma wiki",
      "country": "Kenya",
      "region": "Afrique de l’Est",
      "steps": [
        "Portez l’eau et le sel de l’ugali à ébullition. Versez environ un quart de la farine de maïs en remuant avec une cuillère en bois. Faites cuire 2 minutes, puis incorporez progressivement le reste de la farine.",
        "Pressez la pâte contre les parois de la casserole avec la cuillère. Couvrez et faites cuire 5 minutes à feu doux. Travaillez-la de nouveau, puis couvrez encore 3 à 5 minutes, jusqu’à ce qu’elle se détache des parois.",
        "Dans une autre poêle, faites revenir l’oignon dans l’huile pendant 3 minutes. Ajoutez les tomates en dés et laissez-les fondre 2 à 3 minutes.",
        "Ajoutez le sukuma wiki émincé, le sel destiné aux légumes et le Royco si vous en utilisez. Faites sauter 3 à 5 minutes pour attendrir les feuilles. Servez-les à côté de l’ugali."
      ]
    },
    "ethiopian-doro-wat": {
      "title": "Doro wat au poulet et aux œufs",
      "country": "Éthiopie",
      "region": "Afrique de l’Est",
      "steps": [
        "Faites cuire les oignons rouges finement hachés dans une cocotte sans matière grasse. Remuez souvent pendant environ 20 minutes, jusqu’à ce qu’ils brunissent et réduisent de moitié.",
        "Faites fondre le niter kibbeh dans les oignons. Ajoutez l’ail et le gingembre, cuisez 2 minutes, puis incorporez le berbéré et le concentré de tomate. Remuez 5 minutes.",
        "Enrobez le poulet de cette pâte, ajoutez l’eau ou le bouillon puis couvrez. Laissez mijoter 35 à 40 minutes, jusqu’à ce que le poulet soit cuit à cœur et la sauce épaisse.",
        "Entaillez légèrement les œufs durs écalés et déposez-les dans la sauce. Ajoutez le citron, ajustez le sel et le poivre, puis laissez mijoter 10 minutes à découvert. Servez avec de l’injera."
      ]
    },
    "south-african-bobotie": {
      "title": "Bobotie à la viande hachée",
      "country": "Afrique du Sud",
      "region": "Afrique australe",
      "steps": [
        "Préchauffez le four à 180 °C. Faites tremper puis essorez le pain. Faites revenir les oignons dans le beurre pendant 5 minutes, puis ajoutez le curry et le curcuma pour 1 minute.",
        "Ajoutez la viande hachée et faites-la bien dorer. Incorporez le pain, la confiture d’abricot, le vinaigre, les raisins secs et le sel.",
        "Tassez le mélange dans un plat graissé et plantez-y les feuilles de laurier. Battez les œufs avec le lait et un peu de sel, puis versez sur la viande.",
        "Enfournez 35 à 40 minutes, jusqu’à ce que la garniture soit prise et dorée. Laissez reposer 5 minutes avant de servir."
      ]
    },
    "senegalese-thieboudienne": {
      "title": "Thiéboudienne au poisson",
      "country": "Sénégal",
      "region": "Afrique de l’Ouest",
      "steps": [
        "Hachez le persil avec l’ail et le piment. Entaillez le poisson et glissez la farce dans les entailles. Salez, puis faites dorer le poisson dans l’huile environ 4 minutes par face. Réservez.",
        "Dans la même huile, faites blondir les oignons. Ajoutez le concentré de tomate et cuisez 5 minutes. Ajoutez le poisson séché, le tamarin et suffisamment d’eau pour couvrir les légumes.",
        "À ébullition, ajoutez d’abord le manioc et les carottes, puis l’aubergine et le chou. Retirez les légumes à mesure qu’ils deviennent tendres.",
        "Versez le riz brisé dans la sauce, qui doit le recouvrir d’environ 1 cm. Posez le poisson dessus, couvrez et faites cuire à feu doux jusqu’à absorption de la sauce et cuisson complète du riz et du poisson.",
        "Dressez le riz sur un plat et répartissez le poisson et les légumes par-dessus. Arrosez avec la sauce restante."
      ]
    },
    "egyptian-koshari": {
      "title": "Koshari au riz, aux lentilles et aux pâtes",
      "country": "Égypte",
      "region": "Afrique du Nord",
      "steps": [
        "Faites cuire les lentilles brunes 15 minutes dans l’eau bouillante. Ajoutez le riz et de l’eau fraîche en quantité suffisante, puis poursuivez la cuisson jusqu’à ce que les deux soient tendres.",
        "Dans une autre casserole, faites cuire les macaronis al dente. Égouttez-les et mélangez-les avec un filet d’huile.",
        "Faites dorer l’ail dans un peu d’huile. Ajoutez les tomates concassées, le vinaigre, le cumin et le piment. Laissez mijoter 15 minutes pour épaissir la sauce.",
        "Faites frire les oignons émincés jusqu’à ce qu’ils soient dorés et croustillants. Servez le riz et les lentilles, puis les macaronis et les pois chiches cuits. Nappez de sauce et terminez par les oignons."
      ]
    },
    "moroccan-chicken-tagine": {
      "title": "Tajine de poulet aux citrons confits",
      "country": "Maroc",
      "region": "Afrique du Nord",
      "steps": [
        "Mélangez le poulet avec l’oignon râpé, le gingembre, le curcuma, le safran, le poivre, l’huile d’olive et la moitié de la coriandre. Laissez mariner au réfrigérateur au moins 30 minutes.",
        "Mettez le poulet et sa marinade dans un tajine ou une cocotte. Ajoutez l’eau, couvrez et laissez frémir à feu doux 45 minutes. Retournez les morceaux à mi-cuisson.",
        "Ajoutez les écorces de citron confit et les olives vertes. Faites cuire encore 10 minutes à découvert, jusqu’à ce que la sauce réduise légèrement et que le poulet soit cuit à cœur.",
        "Parsemez du reste de coriandre et servez avec du pain ou de la semoule de couscous."
      ]
    },
    "ghanaian-waakye": {
      "title": "Waakye au riz et aux haricots",
      "country": "Ghana",
      "region": "Afrique de l’Ouest",
      "steps": [
        "Faites tremper les haricots à œil noir ou les haricots rouges toute une nuit. Égouttez, couvrez d’eau fraîche et ajoutez les tiges de sorgho et le bicarbonate.",
        "Portez à ébullition et faites cuire environ 25 minutes, jusqu’à ce que les haricots commencent à s’attendrir. Ajoutez le riz lavé et le sel. L’eau doit dépasser le riz d’environ 2,5 cm.",
        "Couvrez et cuisez à feu moyen. Quand l’eau est presque absorbée, baissez le feu et laissez cuire à la vapeur 10 minutes sous couvercle. Vérifiez que les haricots sont bien tendres.",
        "Retirez les tiges de sorgho. Servez avec les accompagnements de votre choix, par exemple du shito, des œufs durs ou du poisson frit."
      ]
    }
  };

  function kitchenMethod(recipe) {
    var entry = recipe && kitchenMethods[recipe.slug];
    if (!entry) return null;
    return {
      title: entry.title, localName: recipe.name_local, country: entry.country, region: entry.region,
      baseServings: recipe.default_servings, prepMinutes: recipe.prep_time_minutes,
      cookMinutes: recipe.cook_time_minutes, steps: entry.steps, source: recipe.method_url
    };
  }

  function methodContext(method) {
    return 'Portions de la recette de base: ' + method.baseServings + ' · Préparation: ' + method.prepMinutes + ' min · Cuisson: ' + method.cookMinutes + ' min';
  }

  function displayKitchenMethod(recipe) {
    var method = kitchenMethod(recipe);
    var panel = document.getElementById('kitchen-method');
    if (!method) { if (panel) panel.remove(); return; }
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'kitchen-method';
      panel.className = 'ua-card';
      panel.setAttribute('aria-labelledby', 'kitchen-method-title');
      form.after(panel);
    }
    panel.innerHTML = '<h2 id="kitchen-method-title">Préparation — ' + escapeHtml(method.title) + '</h2><p>' +
      escapeHtml(methodContext(method)) + '</p><ol>' + method.steps.map(function (step) {
        return '<li>' + escapeHtml(step) + '</li>';
      }).join('') + '</ol><p>Ce calculateur propose huit recettes en français. Les durées sont indicatives. Si vous changez le nombre de portions, vérifiez la cuisson.</p><p><a href="/tools/afrokitchen/" hreflang="en">Parcourir le catalogue complet (en anglais)</a></p>';
  }

  function syncKitchenRecipe() {
    if (contract.id !== "afrokitchen") return;
    var original = form.querySelector('[data-ua-field="originalServings"]');
    var selected = form.querySelector('[data-ua-field="recipe"]');
    var recipes = root.AfroKitchenEngine && root.AfroKitchenEngine.SEED_RECIPES || [];
    var recipe = recipes.find(function (item) { return selected && item.slug === selected.value; });
    displayKitchenMethod(recipe);
    var photo = form.querySelector("[data-ua-recipe-photo]");
    if (recipe && recipe.image_url) {
      if (!photo) {
        photo = document.createElement("img");
        photo.setAttribute("data-ua-recipe-photo", "");
        photo.width = 320;
        photo.style.cssText = "display:block;max-width:100%;height:auto;margin-top:0.75rem";
        selected.closest(".ua-fields").after(photo);
      }
      photo.alt = "Plat préparé : " + recipe.name_local;
      photo.src = recipe.image_url;
    } else if (photo) {
      photo.remove();
    }
    if (original) {
      original.readOnly = true;
      original.value = recipe ? recipe.default_servings : "";
    }
  }

  function clearKitchenOutput() {
    if (contract.id !== "afrokitchen") return;
    kitchenCopyRevision += 1;
    lastPayload = null;
    root.AfroToolsFrenchUniquelyAfricanResult = null;
    ["[data-ua-metrics]", "[data-ua-table]", "[data-ua-context]", "[data-ua-exports]"].forEach(function (selector) {
      var node = document.querySelector(selector);
      if (node) node.innerHTML = "";
    });
    form.querySelectorAll('[aria-invalid="true"]').forEach(function (node) { node.removeAttribute("aria-invalid"); });
  }

  function invalidateKitchenResult() {
    if (contract.id !== "afrokitchen") return;
    clearKitchenOutput();
    var section = document.querySelector("[data-ua-result]");
    var status = document.querySelector("[data-ua-status]");
    status.className = "";
    status.removeAttribute("tabindex");
    status.textContent = section.hidden ? "" : "La recette ou les portions ont changé. Recalculez pour obtenir les quantités et les exports à jour.";
  }

  function revealKitchenControl(node) {
    if (contract.id !== "afrokitchen" || !node) return;
    node.focus({ preventScroll: true });
    node.scrollIntoView({ block: "center", behavior: "instant" });
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
    var result = engine.calculate(contract.id, prepared.input);
    if (contract.id === "afrokitchen" && result.status === "ok") {
      result.rows.forEach(function (row, index) {
        row.unit = kitchenUnit(delegateState.recipe.ingredients[index].unit, row.scaledAmount);
      });
    }
    return result;
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
        var method = kitchenMethod(recipe);
        return method ? method.title + " — " + method.country : recipe.name_local;
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
    if (contract.id === "afrokitchen") clearKitchenOutput();
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
    if (contract.id === "afrokitchen") {
      clearKitchenOutput();
      syncKitchenRecipe();
      status.removeAttribute("tabindex");
      revealKitchenControl(form.querySelector("[data-ua-field]"));
      return;
    }
    form.querySelector("[data-ua-field]").focus();
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
  loadFeed();
})(window, document);
