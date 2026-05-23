!function () {
  "use strict";

  var catalogRows = [];
  var marketCoverage = null;
  var catalogSources = [
    { url: "/data/cars/master-vehicle-catalog.csv", tier: "priced" },
    { url: "/data/cars/import-duty-vehicle-estimates.csv", tier: "estimated" },
    { url: "/data/cars/catalog-expansion-wave-1.csv", tier: "research_pending" },
    { url: "/data/cars/catalog-expansion-wave-2-ev-luxury.csv", tier: "research_pending" },
    { url: "/data/cars/catalog-expansion-wave-3-premium-ev.csv", tier: "research_pending" }
  ];
  var fallbackCountries = [
    { code: "NG", name: "Nigeria", slug: "nigeria", rulePackStatus: "full" },
    { code: "KE", name: "Kenya", slug: "kenya", rulePackStatus: "full" },
    { code: "GH", name: "Ghana", slug: "ghana", rulePackStatus: "full" },
    { code: "UG", name: "Uganda", slug: "uganda", rulePackStatus: "full" },
    { code: "TZ", name: "Tanzania", slug: "tanzania", rulePackStatus: "full" },
    { code: "ZM", name: "Zambia", slug: "zambia", rulePackStatus: "full" },
    { code: "ZA", name: "South Africa", slug: "south-africa", rulePackStatus: "directory" },
    { code: "EG", name: "Egypt", slug: "egypt", rulePackStatus: "directory" },
    { code: "MA", name: "Morocco", slug: "morocco", rulePackStatus: "directory" },
    { code: "CI", name: "Cote d'Ivoire", slug: "cote-divoire", rulePackStatus: "directory" }
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function numberValue(value) {
    var number = parseFloat(String(value == null ? "" : value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(number) ? number : 0;
  }

  function option(value, label, selected) {
    return '<option value="' + escapeHtml(value) + '"' + (selected ? " selected" : "") + ">" + escapeHtml(label) + "</option>";
  }

  function unique(values) {
    return values.filter(function (value, index) {
      return value && values.indexOf(value) === index;
    });
  }

  function slug(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function countries() {
    return marketCoverage && Array.isArray(marketCoverage.destinationCountries)
      ? marketCoverage.destinationCountries
      : fallbackCountries;
  }

  function selectedCountry() {
    var select = byId("carCountry");
    if (!select) return fallbackCountries[0];
    var optionNode = select.options[select.selectedIndex];
    var code = optionNode && optionNode.getAttribute("data-code");
    return countries().find(function (country) {
      return country.code === code;
    }) || fallbackCountries[0];
  }

  function setValue(id, value, preserveExisting) {
    var field = byId(id);
    if (!field || value == null || value === "") return;
    if (!preserveExisting && field.value) return;
    field.value = String(value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function vehicleType(row) {
    var body = String(row.body_type || "").toLowerCase();
    if (body === "suv") return "suv";
    if (body === "pickup") return "pickup";
    if (body === "truck") return "truck";
    if (body === "motorcycle") return "motorcycle";
    if (body === "mpv" || body === "van") return "bus";
    if (body === "sedan" || body === "hatchback" || body === "wagon" || body === "coupe") return "sedan";
    return "other";
  }

  function priceState(row) {
    var condition = byId("carCondition") ? byId("carCondition").value : "used";
    if (condition === "new") {
      return {
        amount: 0,
        label: "Dealer quote needed",
        range: "New-price data is not in the catalog yet",
        note: "Enter a current dealer invoice or seller quote. AfroTools will not reuse used-car estimates as new-car prices."
      };
    }
    if (row.priceMedian) {
      return {
        amount: Math.round(row.priceMedian),
        label: "$" + Math.round(row.priceMedian).toLocaleString(),
        range: row.priceMin && row.priceMax
          ? "$" + Math.round(row.priceMin).toLocaleString() + " - $" + Math.round(row.priceMax).toLocaleString()
          : "Catalog range unavailable",
        note: row.dataTier === "priced"
          ? "Used-market catalog values are planning estimates, not customs assessed values."
          : row.confidence === "online_market_sample" || row.confidence === "single_online_market_sample" || row.confidence === "market_sample_estimate"
            ? "This is refreshed from stored or online marketplace samples. It is still an asking-price estimate, not a customs assessed value."
            : "This is a comparable-market planning estimate. Override it with your seller quote when available."
      };
    }
    return {
      amount: 0,
      label: "Quote needed",
      range: "Price research pending",
      note: "This vehicle is in the expansion catalog, but no planning price band is available yet."
    };
  }

  function sourceMarket(row) {
    var sourceMarkets = String(row.source_markets || "").split("|");
    if (sourceMarkets.indexOf("japan") !== -1) return "japan";
    if (sourceMarkets.indexOf("uae") !== -1) return "uae";
    if (sourceMarkets.indexOf("uk") !== -1) return "uk";
    if (sourceMarkets.indexOf("south-africa") !== -1) return "south-africa";
    if (sourceMarkets.indexOf("local-dealer") !== -1) return "local-dealer";
    return sourceMarkets[0] || "japan";
  }

  function originLabel(row) {
    var sourceMarkets = String(row.source_markets || "").split("|");
    if (sourceMarkets.indexOf("japan") !== -1) return "Japan";
    if (sourceMarkets.indexOf("uae") !== -1) return "UAE";
    if (sourceMarkets.indexOf("uk") !== -1) return "UK";
    if (sourceMarkets.indexOf("south-africa") !== -1) return "South Africa";
    return sourceMarkets[0] ? sourceMarkets[0].replace(/-/g, " ") : "";
  }

  function workspaceHref(row, price) {
    var country = selectedCountry();
    var params = new URLSearchParams();
    params.set("country", country.code);
    params.set("source", sourceMarket(row));
    params.set("make", row.make);
    params.set("model", row.model);
    params.set("year", row.year);
    params.set("condition", byId("carCondition") ? byId("carCondition").value : "used");
    params.set("sourceApp", "import-duty");
    if (price.amount > 0) params.set("price", String(price.amount));
    if (byId("carShipping") && numberValue(byId("carShipping").value) > 0) params.set("freight", String(numberValue(byId("carShipping").value)));
    if (byId("carInsurance") && numberValue(byId("carInsurance").value) > 0) params.set("insurance", String(numberValue(byId("carInsurance").value)));
    if (row.engineMin || row.engineMax) params.set("engineCc", String(Math.round((row.engineMin + row.engineMax) / 2)));
    if (row.body_type) params.set("bodyType", vehicleType(row));
    return (["NG", "KE", "GH", "UG", "TZ", "ZM"].indexOf(country.code) !== -1 ? "/tools/car-import-cost/" + country.slug + "/" : "/tools/car-import-cost/") + "?" + params.toString();
  }

  function renderPreview(row) {
    var preview = byId("carCatalogPreview");
    if (!preview || !row) return;
    var country = selectedCountry();
    var price = priceState(row);
    var engine = row.engineMin && row.engineMax ? Math.round((row.engineMin + row.engineMax) / 2).toLocaleString() + "cc" : "Engine size varies";
    var label = row.dataTier === "priced"
      ? "Catalog estimate"
      : row.confidence === "online_market_sample"
        ? "Online market sample"
        : row.confidence === "single_online_market_sample"
          ? "Single online sample"
          : row.confidence === "market_sample_estimate"
            ? "Stored market sample"
            : row.dataTier === "estimated"
              ? "Comparable estimate"
              : "Research pending";
    var carPage = row.dataTier === "priced"
      ? "/cars/" + encodeURIComponent(country.slug) + "/" + encodeURIComponent(row.make_slug) + "/" + encodeURIComponent(row.model_slug) + "/" + encodeURIComponent(row.year) + "/"
      : "";
    var carPageAction = carPage ? '<a href="' + escapeHtml(carPage) + '">View car page</a>' : '<span class="car-catalog-muted">Car page pending</span>';
    var rulePackNote = country.rulePackStatus === "full"
      ? country.name + " has a full car-import rule pack in the deeper workspace."
      : country.name + " is available as directory coverage; use manual overrides until a full rule pack is sourced.";

    preview.classList.remove("image-missing");
    preview.innerHTML = [
      '<img src="' + escapeHtml(row.image) + '" alt="' + escapeHtml(row.year + " " + row.make + " " + row.model) + '" loading="lazy" onerror="this.closest(\'.car-catalog-preview\').classList.add(\'image-missing\')">',
      '<div class="car-catalog-preview-copy">',
      '<div class="car-catalog-topline"><span class="pathway-tag">' + escapeHtml(label) + "</span><span>" + escapeHtml(country.code) + "</span></div>",
      "<h3>" + escapeHtml(row.year + " " + row.make + " " + row.model) + "</h3>",
      "<p><strong>" + escapeHtml(price.label) + "</strong> planning purchase value. Range: " + escapeHtml(price.range) + ". " + escapeHtml(engine) + " modeled from catalog data where available.</p>",
      '<p class="form-helper">' + escapeHtml(price.note) + " Override purchase price, assessed value, rates, shipping, insurance, and clearing quotes when you have better information.</p>",
      '<p class="form-helper">' + escapeHtml(rulePackNote) + "</p>",
      '<div class="car-catalog-actions"><a href="' + escapeHtml(workspaceHref(row, price)) + '">Open full car workspace</a>' + carPageAction + "</div>",
      "</div>"
    ].join("");
  }

  function applyVehicle(row, forcePrice) {
    if (!row) return;
    var price = priceState(row);
    setValue("carVehicleType", vehicleType(row), true);
    if (price.amount > 0) {
      setValue("carPurchasePrice", price.amount, forcePrice);
    } else if (forcePrice && byId("carPurchasePrice")) {
      byId("carPurchasePrice").value = "";
      byId("carPurchasePrice").dispatchEvent(new Event("input", { bubbles: true }));
    }
    setValue("carOrigin", originLabel(row), false);
    setValue("carEngineSize", row.engineMin && row.engineMax ? Math.round((row.engineMin + row.engineMax) / 2) + "cc" : "", true);
    setValue("carShipping", "1500", false);
    setValue("carInsurance", "250", false);
    renderPreview(row);
    if (window.__importDutyEvents) {
      window.__importDutyEvents.push({
        name: "import_vehicle_catalog_selected",
        params: {
          vehicle_id: row.vehicle_id,
          make: row.make,
          model: row.model,
          year: row.year,
          data_tier: row.dataTier,
          country: selectedCountry().code
        }
      });
    }
    if (typeof window.calculateCarImport === "function" && numberValue(byId("carPurchasePrice") && byId("carPurchasePrice").value) > 0) {
      window.calculateCarImport();
    }
  }

  function rowsForMake(make) {
    return catalogRows.filter(function (row) {
      return row.make === make;
    });
  }

  function rowsForModel(make, model) {
    return catalogRows.filter(function (row) {
      return row.make === make && row.model === model;
    });
  }

  function tierRank(row) {
    return row.dataTier === "priced" ? 0 : row.dataTier === "estimated" ? 1 : 2;
  }

  function updateModels(make, preferred) {
    var select = byId("carModel");
    if (!select) return "";
    var models = unique(rowsForMake(make).map(function (row) { return row.model; }));
    var selected = models.indexOf(preferred) !== -1 ? preferred : models[0] || "";
    select.innerHTML = models.map(function (model) { return option(model, model, model === selected); }).join("");
    return selected;
  }

  function updateYears(make, model, preferred) {
    var select = byId("carYear");
    if (!select) return null;
    var rows = rowsForModel(make, model).sort(function (a, b) {
      return tierRank(a) - tierRank(b) || b.yearNumber - a.yearNumber;
    });
    var selected = rows.find(function (row) { return String(row.year) === String(preferred); }) || rows[0] || null;
    select.innerHTML = rows.map(function (row) {
      var suffix = row.dataTier === "priced" ? "" : row.dataTier === "estimated" ? " - estimate" : " - research pending";
      return option(row.year, row.year + suffix, selected && row.vehicle_id === selected.vehicle_id);
    }).join("");
    return selected;
  }

  function selectedVehicle() {
    var make = byId("carMake") && byId("carMake").value;
    var model = byId("carModel") && byId("carModel").value;
    var year = byId("carYear") && byId("carYear").value;
    return catalogRows.find(function (row) {
      return row.make === make && row.model === model && String(row.year) === String(year);
    });
  }

  function refreshSelectedVehicle(forcePrice) {
    applyVehicle(selectedVehicle(), forcePrice);
  }

  function updateCountryNote() {
    var note = byId("carCountryCoverageNote");
    if (!note) return;
    var country = selectedCountry();
    note.textContent = country.rulePackStatus === "full"
      ? "Full rule-pack coverage is available in the car import workspace."
      : "Directory coverage only for now. Use manual overrides for duty, taxes, port and clearing costs.";
  }

  function populateCountries() {
    var select = byId("carCountry");
    if (!select) return;
    select.innerHTML = countries().map(function (country, index) {
      var status = country.rulePackStatus === "full" ? "full car rule pack" : "directory estimate";
      return '<option value="' + escapeHtml(country.name) + '" data-code="' + escapeHtml(country.code) + '"' + (index === 0 ? " selected" : "") + ">" + escapeHtml(country.name + " - " + status) + "</option>";
    }).join("");
    if (!byId("carCountryCoverageNote")) {
      var note = document.createElement("span");
      note.id = "carCountryCoverageNote";
      note.className = "form-helper";
      select.parentNode.appendChild(note);
    }
    updateCountryNote();
  }

  function initializeControls() {
    var makeSelect = byId("carMake");
    var modelSelect = byId("carModel");
    var yearSelect = byId("carYear");
    if (!makeSelect || !modelSelect || !yearSelect || !catalogRows.length) return;

    var defaultVehicle = catalogRows.find(function (row) {
      return row.vehicle_id === "toyota-corolla-2018";
    }) || catalogRows[0];

    populateCountries();
    var makes = unique(catalogRows.map(function (row) { return row.make; }));
    makeSelect.innerHTML = makes.map(function (make) { return option(make, make, make === defaultVehicle.make); }).join("");
    var model = updateModels(defaultVehicle.make, defaultVehicle.model);
    applyVehicle(updateYears(defaultVehicle.make, model, defaultVehicle.year), true);

    makeSelect.addEventListener("change", function () {
      var nextModel = updateModels(makeSelect.value, "");
      updateYears(makeSelect.value, nextModel, "");
      refreshSelectedVehicle(true);
    });
    modelSelect.addEventListener("change", function () {
      updateYears(makeSelect.value, modelSelect.value, "");
      refreshSelectedVehicle(true);
    });
    yearSelect.addEventListener("change", function () {
      refreshSelectedVehicle(true);
    });
    if (byId("carCondition")) {
      byId("carCondition").addEventListener("change", function () {
        refreshSelectedVehicle(true);
      });
    }
    if (byId("carCountry")) {
      byId("carCountry").addEventListener("change", function () {
        updateCountryNote();
        refreshSelectedVehicle(false);
      });
    }
    if (byId("carPurchasePrice")) {
      byId("carPurchasePrice").addEventListener("input", function () {
        byId("carPurchasePrice").dataset.userOverride = "true";
      });
    }
  }

  function parseCsv(text) {
    var rows = [];
    var row = [];
    var cell = "";
    var inQuotes = false;
    for (var index = 0; index < text.length; index += 1) {
      var char = text[index];
      var next = text[index + 1];
      if (char === '"' && inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") index += 1;
        row.push(cell);
        if (row.some(function (value) { return value !== ""; })) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }
    if (cell || row.length) {
      row.push(cell);
      rows.push(row);
    }
    if (!rows.length) return [];
    var headers = rows.shift().map(function (header) { return header.trim(); });
    return rows.map(function (line) {
      var record = {};
      headers.forEach(function (header, headerIndex) {
        record[header] = line[headerIndex] || "";
      });
      return record;
    });
  }

  function loadCsv(source) {
    return fetch(source.url, { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("Could not load " + source.url);
        return response.text();
      })
      .then(function (text) {
        return parseCsv(text)
          .filter(function (row) { return row.vehicle_id && row.make && row.model && row.year; })
          .map(function (row) {
            var yearNumber = parseInt(row.year, 10);
            var makeSlug = row.make_slug || slug(row.make);
            var modelSlug = row.model_slug || slug(row.model);
            return {
              vehicle_id: row.vehicle_id,
              make: row.make,
              make_slug: makeSlug,
              model: row.model,
              model_slug: modelSlug,
              year: row.year,
              yearNumber: Number.isFinite(yearNumber) ? yearNumber : 0,
              body_type: row.body_type || "",
              fuel_types: row.fuel_types || "",
              transmissions: row.transmissions || "",
              source_markets: row.source_markets || "",
              candidate_priority: row.candidate_priority || row.launch_priority || "",
              tags: row.tags || "",
              catalog_status: row.catalog_status || (source.tier === "research_pending" ? "planned" : "active"),
              dataTier: source.tier,
              priceMedian: numberValue(row.price_median_usd),
              priceMin: numberValue(row.price_min_usd),
              priceMax: numberValue(row.price_max_usd),
              engineMin: numberValue(row.engine_cc_min),
              engineMax: numberValue(row.engine_cc_max),
              confidence: row.confidence || (source.tier === "priced" ? "medium" : "market_estimate"),
              last_updated: row.last_updated || "",
              image: "/assets/img/cars/" + makeSlug + "/" + modelSlug + "/" + row.year + "/" + row.vehicle_id + "-hero.webp"
            };
          });
      })
      .catch(function () {
        return [];
      });
  }

  function loadCatalog() {
    Promise.all([
      fetch("/data/cars/import-duty-car-market-coverage.json", { cache: "no-cache" })
        .then(function (response) {
          if (!response.ok) throw new Error("Could not load market coverage");
          return response.json();
        })
        .then(function (coverage) {
          marketCoverage = coverage;
        })
        .catch(function () {
          marketCoverage = { destinationCountries: fallbackCountries };
        }),
      Promise.all(catalogSources.map(loadCsv)).then(function (groups) {
        var seen = {};
        catalogRows = [];
        groups.forEach(function (group) {
          group.forEach(function (row) {
            if (!seen[row.vehicle_id] && String(row.catalog_status || "").toLowerCase() !== "retired") {
              seen[row.vehicle_id] = true;
              catalogRows.push(row);
            }
          });
        });
        catalogRows.sort(function (a, b) {
          return tierRank(a) - tierRank(b) || a.make.localeCompare(b.make) || a.model.localeCompare(b.model) || b.yearNumber - a.yearNumber;
        });
      })
    ])
      .then(initializeControls)
      .catch(function (error) {
        var preview = byId("carCatalogPreview");
        if (preview) {
          preview.innerHTML = '<div class="car-catalog-preview-copy"><span class="pathway-tag">Catalog unavailable</span><h3>Enter vehicle details manually</h3><p>Vehicle catalog options could not load. You can still enter purchase price, shipping, insurance, and assessed value manually.</p></div>';
        }
        if (window.__importDutyEvents) {
          window.__importDutyEvents.push({ name: "import_vehicle_catalog_load_error", params: { message: error.message } });
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadCatalog);
  } else {
    loadCatalog();
  }
}();
