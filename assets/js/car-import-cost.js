(function () {
  "use strict";

  var Engine = window.AfroCarImportCost;
  var state = {
    data: null,
    lastResult: null,
    aiMessages: []
  };

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function money(amount, currency) {
    return Engine.formatMoney(amount, currency || "USD");
  }

  function getDefaultCountry() {
    return (document.body && document.body.getAttribute("data-default-country")) || "NG";
  }

  function track(event, params) {
    params = params || {};
    params.tool_name = "car-import-cost";
    if (window.AfroTools && window.AfroTools.analytics && window.AfroTools.analytics.track) {
      window.AfroTools.analytics.track(event, params);
    } else if (typeof window.gtag === "function") {
      window.gtag("event", event, params);
    }
  }

  function fetchJson(url) {
    return fetch(url, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error("Could not load " + url);
      return res.json();
    });
  }

  function loadData() {
    return fetchJson("/data/trade/car-import-cost-core.json").then(function (core) {
      var packUrls = Object.keys(core.countryPackFiles || {}).map(function (code) {
        return fetchJson(core.countryPackFiles[code]);
      });
      var fxPromise = fetchJson(core.fx && core.fx.fallbackUrl || "/data/forex/latest.json").catch(function () {
        return { rates: {} };
      });
      return Promise.all(packUrls.concat([fxPromise])).then(function (items) {
        var fx = items.pop();
        var packs = items;
        var override = loadAdminOverride();
        if (override && override.countryRulePacks) {
          packs = packs.map(function (pack) {
            return override.countryRulePacks[pack.countryCode] || pack;
          });
        }
        return Engine.mergeData(core, packs, fx && fx.rates || {});
      });
    });
  }

  function loadAdminOverride() {
    try {
      return JSON.parse(localStorage.getItem("carImportCostRulePacksOverride") || "null");
    } catch (error) {
      return null;
    }
  }

  function option(value, label, selected) {
    var el = document.createElement("option");
    el.value = value;
    el.textContent = label;
    if (selected) el.selected = true;
    return el;
  }

  function fillStaticOptions() {
    var country = qs("#carImportCountry");
    if (country && !country.options.length) {
      [
        ["NG", "NG - Nigeria (NGN)"],
        ["KE", "KE - Kenya (KES)"],
        ["GH", "GH - Ghana (GHS)"],
        ["UG", "UG - Uganda (UGX)"],
        ["ZM", "ZM - Zambia (ZMW)"],
        ["TZ", "TZ - Tanzania (TZS)"]
      ].forEach(function (row) {
        country.appendChild(option(row[0], row[1], row[0] === getDefaultCountry()));
      });
    }

    var source = qs("#carImportSourceMarket");
    if (source && state.data && !source.options.length) {
      Object.keys(state.data.sourceMarkets || {}).forEach(function (id) {
        source.appendChild(option(id, state.data.sourceMarkets[id].label, id === "japan"));
      });
    }
  }

  function updateCountryDependentOptions() {
    var countryCode = qs("#carImportCountry").value;
    var pack = state.data.countryRulePacks[countryCode];
    var portSelect = qs("#carImportPort");
    var citySelect = qs("#carImportDestinationCity");
    if (!pack) return;

    if (portSelect) {
      portSelect.innerHTML = "";
      (pack.ports || []).forEach(function (port, index) {
        portSelect.appendChild(option(port.code, port.label, index === 0));
      });
    }
    if (citySelect) {
      citySelect.innerHTML = "";
      (pack.cities || []).forEach(function (city, index) {
        citySelect.appendChild(option(city.id, city.label, index === 0));
      });
    }
    renderCountryCopy(pack);
    track("car_import_country_selected", { country: countryCode });
  }

  function renderCountryCopy(pack) {
    qsa("[data-country-name]").forEach(function (el) { el.textContent = pack.countryName; });
    var intro = qs("#carImportCountryIntro");
    if (intro) intro.textContent = pack.copy && pack.copy.intro || "";
    var hidden = qs("#carImportHiddenCosts");
    if (hidden) hidden.textContent = pack.copy && pack.copy.hiddenCosts || "";
    var source = qs("#carImportSourceBlock");
    if (source) {
      source.innerHTML = (pack.sourceNotes || []).map(function (note) {
        return "<li><a href=\"" + escapeHtml(note.url) + "\" rel=\"nofollow noopener\" target=\"_blank\">" + escapeHtml(note.name) + "</a><span>" + escapeHtml(note.lastVerified) + " - " + escapeHtml(note.confidence) + "</span><small>" + escapeHtml(note.note) + "</small></li>";
      }).join("");
    }
    renderFaq(pack);
  }

  function renderFaq(pack) {
    var faq = qs("#carImportFaqList");
    if (!faq) return;
    faq.innerHTML = (pack.faqs || []).map(function (item) {
      return "<details><summary>" + escapeHtml(item.question) + "</summary><p>" + escapeHtml(item.answer) + "</p></details>";
    }).join("");
  }

  function readNumber(id) {
    return Number(qs(id) && qs(id).value || 0);
  }

  function readValue(id) {
    return qs(id) ? qs(id).value : "";
  }

  function collectInput() {
    return {
      countryCode: readValue("#carImportCountry") || getDefaultCountry(),
      sourceMarket: readValue("#carImportSourceMarket") || "japan",
      inputMode: readValue("#carImportInputMode") || "purchase",
      outputMode: readValue("#carImportOutputMode") || "practical",
      make: readValue("#carImportMake"),
      model: readValue("#carImportModel"),
      trim: readValue("#carImportTrim"),
      year: readNumber("#carImportYear"),
      firstRegistrationMonth: readNumber("#carImportFirstRegistrationMonth"),
      fuelType: readValue("#carImportFuelType"),
      engineCc: readNumber("#carImportEngineCc"),
      transmission: readValue("#carImportTransmission"),
      bodyType: readValue("#carImportBodyType"),
      vehicleClass: readValue("#carImportBodyType"),
      driveSide: readValue("#carImportDriveSide"),
      condition: readValue("#carImportCondition"),
      mileage: readNumber("#carImportMileage"),
      purchasePriceUsd: readNumber("#carImportPurchasePrice"),
      fobUsd: readNumber("#carImportFob"),
      cifUsd: readNumber("#carImportCif"),
      freightUsd: readNumber("#carImportFreight"),
      insuranceUsd: readNumber("#carImportInsurance"),
      customsValueUsd: readNumber("#carImportCustomsValue"),
      portCode: readValue("#carImportPort"),
      destinationCity: readValue("#carImportDestinationCity"),
      delayDays: readNumber("#carImportDelayDays"),
      storageDays: readNumber("#carImportStorageDays"),
      clearingMode: readValue("#carImportClearingMode"),
      downPaymentPct: readNumber("#carImportDownPayment") / 100 || 0.25,
      financeAprPct: readNumber("#carImportApr") / 100 || 0.24,
      financeMonths: readNumber("#carImportFinanceMonths") || 36,
      localDealerPriceUsd: readNumber("#carImportLocalDealerPrice"),
      extraAgencyChargesUsd: readNumber("#carImportExtraAgencyCharges")
    };
  }

  function calculateAndRender() {
    if (!state.data) return;
    var input = collectInput();
    var result = Engine.calculate(input, state.data);
    state.lastResult = result;
    renderResult(result);
    persistFormState(input);
    updateShareUrl(input);
    updateSaveButton(result);
    track("car_import_quote_calculated", {
      country: input.countryCode,
      source_market: input.sourceMarket,
      vehicle_class: input.vehicleClass,
      output_mode: input.outputMode
    });
    if (result.warnings.some(function (warning) { return warning.code === "stale-rule-pack"; })) {
      track("car_import_rule_pack_stale_warning_shown", { country: input.countryCode });
    }
  }

  function persistFormState(input) {
    try {
      localStorage.setItem("carImportCostLastInput", JSON.stringify(input));
    } catch (error) {
      return;
    }
  }

  function loadFormState() {
    var params = new URLSearchParams(location.search);
    var saved = null;
    try {
      saved = JSON.parse(localStorage.getItem("carImportCostLastInput") || "null");
    } catch (error) {
      saved = null;
    }
    var input = saved || {};
    if (params.has("country")) input.countryCode = params.get("country");
    if (params.has("source")) input.sourceMarket = params.get("source");
    if (params.has("make")) input.make = params.get("make");
    if (params.has("model")) input.model = params.get("model");
    if (params.has("year")) input.year = params.get("year");
    if (params.has("price")) input.purchasePriceUsd = params.get("price");
    if (Object.keys(input).length) applyInput(input);
  }

  function defaultInputForCountry(countryCode) {
    var defaults = {
      NG: { make: "Toyota", model: "Corolla", year: 2018, engineCc: 1800, destinationCity: "lagos", driveSide: "right" },
      KE: { make: "Toyota", model: "Axio", year: 2019, engineCc: 1500, destinationCity: "nairobi", driveSide: "right", bodyType: "sedan" },
      GH: { make: "Honda", model: "CR-V", year: 2016, engineCc: 2400, destinationCity: "accra", driveSide: "left", bodyType: "suv" },
      UG: { make: "Mazda", model: "Demio", year: 2017, engineCc: 1300, destinationCity: "kampala", driveSide: "right", bodyType: "hatchback" },
      ZM: { make: "Toyota", model: "Hilux", year: 2015, engineCc: 2500, destinationCity: "lusaka", driveSide: "right", bodyType: "pickup" },
      TZ: { make: "Toyota", model: "Noah", year: 2014, engineCc: 2000, destinationCity: "dar-es-salaam", driveSide: "right", bodyType: "mpv" }
    };
    var base = defaults[countryCode] || defaults.NG;
    var input = {
      countryCode: countryCode,
      sourceMarket: "japan",
      inputMode: "make-model-year",
      outputMode: "practical",
      firstRegistrationMonth: 1,
      fuelType: "petrol",
      bodyType: "sedan",
      transmission: "automatic",
      condition: "used",
      mileage: 65000,
      downPaymentPct: 0.25,
      financeAprPct: 0.24,
      financeMonths: 36
    };
    Object.keys(base).forEach(function (key) { input[key] = base[key]; });
    return input;
  }

  function applyInput(input) {
    var map = {
      "#carImportCountry": input.countryCode,
      "#carImportSourceMarket": input.sourceMarket,
      "#carImportInputMode": input.inputMode,
      "#carImportOutputMode": input.outputMode,
      "#carImportMake": input.make,
      "#carImportModel": input.model,
      "#carImportTrim": input.trim,
      "#carImportYear": input.year,
      "#carImportFirstRegistrationMonth": input.firstRegistrationMonth,
      "#carImportFuelType": input.fuelType,
      "#carImportEngineCc": input.engineCc,
      "#carImportTransmission": input.transmission,
      "#carImportBodyType": input.bodyType || input.vehicleClass,
      "#carImportDriveSide": input.driveSide,
      "#carImportCondition": input.condition,
      "#carImportMileage": input.mileage,
      "#carImportPurchasePrice": input.purchasePriceUsd,
      "#carImportFob": input.fobUsd,
      "#carImportCif": input.cifUsd,
      "#carImportFreight": input.freightUsd,
      "#carImportInsurance": input.insuranceUsd,
      "#carImportCustomsValue": input.customsValueUsd,
      "#carImportDelayDays": input.delayDays,
      "#carImportStorageDays": input.storageDays,
      "#carImportClearingMode": input.clearingMode,
      "#carImportDownPayment": input.downPaymentPct ? input.downPaymentPct * 100 : "",
      "#carImportApr": input.financeAprPct ? input.financeAprPct * 100 : "",
      "#carImportFinanceMonths": input.financeMonths,
      "#carImportLocalDealerPrice": input.localDealerPriceUsd,
      "#carImportExtraAgencyCharges": input.extraAgencyChargesUsd
    };
    Object.keys(map).forEach(function (selector) {
      var el = qs(selector);
      if (el && map[selector] != null && map[selector] !== "") el.value = map[selector];
    });
    if (state.data && input.countryCode) updateCountryDependentOptions();
    if (qs("#carImportDestinationCity") && input.destinationCity) qs("#carImportDestinationCity").value = input.destinationCity;
    if (qs("#carImportPort") && input.portCode) qs("#carImportPort").value = input.portCode;
  }

  function updateShareUrl(input) {
    var params = new URLSearchParams();
    params.set("country", input.countryCode);
    params.set("source", input.sourceMarket);
    if (input.make) params.set("make", input.make);
    if (input.model) params.set("model", input.model);
    if (input.year) params.set("year", input.year);
    if (input.purchasePriceUsd) params.set("price", Math.round(input.purchasePriceUsd));
    var url = location.pathname + "?" + params.toString();
    history.replaceState(null, "", url);
  }

  function updateSaveButton(result) {
    var save = qs("#carImportCloudSave");
    if (save && typeof save.setData === "function") {
      save.setData({
        inputs: result.input,
        outputs: { totals: result.totals, rulePack: result.rulePack, warnings: result.warnings }
      });
    }
  }

  function renderResult(result) {
    var currency = result.country.currency;
    qs("#carImportResults").hidden = false;
    qs("#carImportTotal").textContent = money(result.totals.onRoadUsd, "USD");
    qs("#carImportTotalLocal").textContent = money(result.totals.onRoadLocal, currency);
    qs("#carImportSummaryLine").textContent = result.country.name + " estimate using " + result.rulePack.status + " and " + result.valueBasis.valuationStatus + " customs value.";
    qs("#carImportRulePackLine").textContent = "Rule pack effective " + result.rulePack.effectiveFrom + (result.rulePack.effectiveTo ? " to " + result.rulePack.effectiveTo : "") + ". FX: 1 USD = " + result.fx.usdToLocal + " " + currency + ".";

    qs("#carImportBadgeStack").innerHTML = result.badges.map(function (badge) {
      return "<span class=\"car-import-badge\">" + escapeHtml(badge.label) + "</span>";
    }).join("");
    renderWarnings(result);
    renderMetrics(result);
    renderTables(result);
    renderWaterfall(result);
    renderScenarios(result);
    renderCompare(result);
    renderDocuments(result);
    renderSourcesAndDisclaimer(result);
  }

  function renderWarnings(result) {
    var el = qs("#carImportWarnings");
    el.innerHTML = result.warnings.map(function (warning) {
      return "<div class=\"car-import-warning " + escapeHtml(warning.severity) + "\"><strong>" + escapeHtml(warning.severity.toUpperCase()) + ":</strong> " + escapeHtml(warning.message) + "</div>";
    }).join("");
  }

  function renderMetrics(result) {
    var metrics = [
      ["Customs value", result.totals.cifUsd, "USD"],
      ["Official charges", result.totals.officialTaxesUsd + result.totals.officialFeesUsd, "USD"],
      ["Practical extras", result.totals.practicalCostsUsd + result.totals.inlandDeliveryUsd, "USD"],
      ["Registration", result.totals.registrationUsd, "USD"],
      ["Monthly finance", result.finance.monthlyPaymentUsd, "USD"],
      ["Resale band", result.resale.suggestedLowUsd, "USD"]
    ];
    qs("#carImportMetrics").innerHTML = metrics.map(function (metric) {
      var suffix = metric[0] === "Resale band" ? " - " + money(result.resale.suggestedHighUsd, "USD") : "";
      return "<div class=\"car-import-metric\"><span>" + escapeHtml(metric[0]) + "</span><strong>" + money(metric[1], metric[2]) + suffix + "</strong></div>";
    }).join("");
  }

  function renderRows(items, currency) {
    if (!items || !items.length) return "<tr><td colspan=\"4\">No charges in this block for the active inputs.</td></tr>";
    return items.map(function (item) {
      var rate = item.rate != null ? Math.round(item.rate * 10000) / 100 + "%" : "";
      var note = item.tierLabel || item.notes || "";
      return "<tr><td>" + escapeHtml(item.label) + (note ? "<br><small>" + escapeHtml(note) + "</small>" : "") + "</td><td>" + escapeHtml(rate) + "</td><td>" + money(item.amountUsd, "USD") + "</td><td>" + money(item.amountLocal || item.amountUsd * state.lastResult.fx.usdToLocal, currency) + "</td></tr>";
    }).join("");
  }

  function renderTables(result) {
    var currency = result.country.currency;
    qs("#carImportBasisTable").innerHTML = renderRows(result.breakdowns.customsValueBasis.map(function (item) {
      return Object.assign({ group: "basis", official: false, amountLocal: item.amountUsd * result.fx.usdToLocal }, item);
    }), currency);
    qs("#carImportOfficialTable").innerHTML = renderRows(result.breakdowns.officialTaxes.concat(result.breakdowns.officialFees), currency);
    qs("#carImportPracticalTable").innerHTML = renderRows(result.breakdowns.practicalCosts.concat(result.breakdowns.inlandDelivery), currency);
    qs("#carImportRegistrationTable").innerHTML = renderRows(result.breakdowns.registration, currency);
    qs("#carImportSensitivityTable").innerHTML = result.sensitivity.exchangeRate.map(function (row) {
      return "<tr><td>" + escapeHtml(row.label) + "</td><td>" + row.fxRate + "</td><td colspan=\"2\">" + money(row.totalLocal, currency) + "</td></tr>";
    }).join("") + result.sensitivity.delayDays.map(function (row) {
      return "<tr><td>" + row.days + " delay days</td><td>" + money(row.extraUsd, "USD") + "</td><td colspan=\"2\">" + money(row.onRoadUsd, "USD") + "</td></tr>";
    }).join("");
  }

  function renderWaterfall(result) {
    var rows = [
      ["Vehicle + freight + insurance", result.totals.cifUsd],
      ["Official taxes", result.totals.officialTaxesUsd],
      ["Official fees", result.totals.officialFeesUsd],
      ["Practical port costs", result.totals.practicalCostsUsd],
      ["Inland delivery", result.totals.inlandDeliveryUsd],
      ["Registration", result.totals.registrationUsd]
    ];
    var max = Math.max.apply(null, rows.map(function (row) { return row[1]; })) || 1;
    qs("#carImportWaterfall").innerHTML = rows.map(function (row) {
      var width = Math.max(4, Math.round(row[1] / max * 100));
      return "<div class=\"car-import-bar\"><span>" + escapeHtml(row[0]) + "</span><span class=\"car-import-bar-track\"><span class=\"car-import-bar-fill\" style=\"--bar-width:" + width + "%\"></span></span><strong>" + money(row[1], "USD") + "</strong></div>";
    }).join("");
  }

  function renderScenarios(result) {
    qs("#carImportScenarioTable").innerHTML = result.scenarios.map(function (row) {
      return "<tr><td>" + escapeHtml(row.label) + "<br><small>" + escapeHtml(row.assumption) + "</small></td><td colspan=\"3\">" + money(row.totalUsd, "USD") + "</td></tr>";
    }).join("");
    qs("#carImportFinanceBlock").innerHTML = "Finance estimate: " + money(result.finance.monthlyPaymentUsd, "USD") + " per month for " + result.finance.months + " months after " + money(result.finance.downPaymentUsd, "USD") + " down. Suggested resale band: " + money(result.resale.suggestedLowUsd, "USD") + " to " + money(result.resale.suggestedHighUsd, "USD") + ". Local comparator: " + result.localComparator.cheaperOption + " by " + money(Math.abs(result.localComparator.importSavingsUsd), "USD") + ".";
  }

  function renderCompare(result) {
    qs("#carImportCompareTable").innerHTML = (result.sourceMarketCompare || []).map(function (row) {
      return "<tr><td>" + escapeHtml(row.label) + "</td><td>" + money(row.freightUsd, "USD") + "</td><td>" + money(row.totalLandedUsd, "USD") + "</td><td>" + money(row.onRoadUsd, "USD") + "</td></tr>";
    }).join("");
  }

  function renderDocuments(result) {
    qs("#carImportDocuments").innerHTML = result.documents.map(function (doc) {
      return "<li>" + escapeHtml(doc) + "</li>";
    }).join("");
  }

  function renderSourcesAndDisclaimer(result) {
    qs("#carImportResultSources").innerHTML = result.sourceMetadata.map(function (source) {
      return "<li><a href=\"" + escapeHtml(source.url) + "\" target=\"_blank\" rel=\"nofollow noopener\">" + escapeHtml(source.name) + "</a><span>" + escapeHtml(source.lastVerified) + " - " + escapeHtml(source.confidence) + "</span></li>";
    }).join("");
    qs("#carImportResultDisclaimer").innerHTML = result.disclaimers.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
  }

  function switchTab(button) {
    qsa(".car-import-tab").forEach(function (tab) {
      tab.setAttribute("aria-selected", tab === button ? "true" : "false");
    });
    qsa(".car-import-tab-panel").forEach(function (panel) {
      panel.classList.toggle("active", panel.id === button.getAttribute("aria-controls"));
    });
  }

  function exportCsv() {
    if (!state.lastResult) calculateAndRender();
    var result = state.lastResult;
    var rows = [["section", "label", "amount_usd"]];
    ["officialTaxes", "officialFees", "practicalCosts", "inlandDelivery", "registration"].forEach(function (section) {
      result.breakdowns[section].forEach(function (item) {
        rows.push([section, item.label, item.amountUsd]);
      });
    });
    rows.push(["total", "on-road", result.totals.onRoadUsd]);
    if (window.AfroExport && window.AfroExport.csv) {
      window.AfroExport.csv("afrotools-car-import-cost.csv", rows);
    } else {
      var csv = rows.map(function (row) {
        return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(",");
      }).join("\n");
      var blob = new Blob([csv], { type: "text/csv" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "afrotools-car-import-cost.csv";
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }

  function exportPdf() {
    if (!state.lastResult) calculateAndRender();
    var result = state.lastResult;
    track("car_import_export_pdf", { country: result.country.code });
    if (window.AfroTools && window.AfroTools.pdf && window.AfroTools.pdf.generate) {
      window.AfroTools.pdf.generate({
        title: "African Car Landed Cost Report",
        subtitle: result.country.name + " - " + result.input.make + " " + result.input.model + " " + result.input.year,
        heroStats: [
          { label: "On-road estimate", value: money(result.totals.onRoadUsd, "USD") },
          { label: "Local currency", value: money(result.totals.onRoadLocal, result.country.currency) },
          { label: "Rule pack", value: result.rulePack.effectiveFrom }
        ],
        sections: [
          { heading: "Vehicle and customs basis", rows: result.breakdowns.customsValueBasis.map(function (item) { return [item.label, money(item.amountUsd, "USD")]; }) },
          { heading: "Official charges", rows: result.breakdowns.officialTaxes.concat(result.breakdowns.officialFees).map(function (item) { return [item.label, money(item.amountUsd, "USD")]; }) },
          { heading: "Practical and registration costs", rows: result.breakdowns.practicalCosts.concat(result.breakdowns.inlandDelivery, result.breakdowns.registration).map(function (item) { return [item.label, money(item.amountUsd, "USD")]; }) }
        ],
        disclaimer: result.disclaimers.join(" "),
        source: result.sourceMetadata.map(function (source) { return source.name + " (" + source.lastVerified + ")"; }).join("; ")
      });
    } else {
      window.print();
    }
  }

  function shareQuote() {
    if (!state.lastResult) calculateAndRender();
    var title = "AfroTools car import estimate";
    var text = "On-road estimate: " + money(state.lastResult.totals.onRoadUsd, "USD") + " for " + state.lastResult.country.name + ".";
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: location.href }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href);
    }
    track("car_import_share_quote", { country: state.lastResult.country.code });
  }

  function saveLocalQuote() {
    if (!state.lastResult) calculateAndRender();
    var quotes = [];
    try { quotes = JSON.parse(localStorage.getItem("carImportCostQuotes") || "[]"); } catch (error) { quotes = []; }
    quotes.unshift({ id: "quote-" + Date.now(), result: state.lastResult });
    localStorage.setItem("carImportCostQuotes", JSON.stringify(quotes.slice(0, 20)));
    track("car_import_save_quote", { country: state.lastResult.country.code, save_type: "local" });
    var button = qs("#carImportSaveLocal");
    if (button) button.textContent = "Saved locally";
  }

  function askAi() {
    if (!state.lastResult) calculateAndRender();
    var input = qs("#carImportAiQuestion");
    var log = qs("#carImportAiLog");
    var question = input && input.value.trim();
    if (!question) return;
    track("car_import_ai_advisor_opened", { country: state.lastResult.country.code });
    appendAiMessage("user", question);
    input.value = "";
    var messages = state.aiMessages.concat([{ role: "user", content: question }]);
    fetch("/.netlify/functions/ai-advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "car-import-cost",
        context: JSON.stringify({
          country: state.lastResult.country,
          input: state.lastResult.input,
          totals: state.lastResult.totals,
          warnings: state.lastResult.warnings,
          rulePack: state.lastResult.rulePack,
          sourceMetadata: state.lastResult.sourceMetadata,
          documents: state.lastResult.documents
        }),
        messages: messages
      })
    }).then(function (res) {
      if (!res.ok) throw new Error("AI unavailable");
      return res.json();
    }).then(function (data) {
      appendAiMessage("assistant", data.answer || data.message || "I could not find a reliable answer from the structured calculation context.");
    }).catch(function () {
      appendAiMessage("assistant", "Based on the calculation context, keep a buffer for FX movement, storage, clearing agent differences, and final customs valuation. I cannot provide an official ruling; verify the rule pack sources and a licensed local agent before paying.");
    }).finally(function () {
      if (log) log.scrollTop = log.scrollHeight;
    });
  }

  function appendAiMessage(role, text) {
    state.aiMessages.push({ role: role, content: text });
    var log = qs("#carImportAiLog");
    if (!log) return;
    var div = document.createElement("div");
    div.className = "car-import-ai-message " + role;
    div.textContent = (role === "user" ? "You: " : "Advisor: ") + text;
    log.appendChild(div);
  }

  function bindEvents() {
    qs("#carImportForm").addEventListener("submit", function (event) {
      event.preventDefault();
      calculateAndRender();
    });
    qs("#carImportCountry").addEventListener("change", updateCountryDependentOptions);
    qs("#carImportSourceMarket").addEventListener("change", function () {
      track("car_import_source_market_selected", { source_market: qs("#carImportSourceMarket").value });
    });
    qsa(".car-import-tab").forEach(function (tab) {
      tab.addEventListener("click", function () { switchTab(tab); });
    });
    qs("#carImportPdf").addEventListener("click", exportPdf);
    qs("#carImportCsv").addEventListener("click", exportCsv);
    qs("#carImportPrint").addEventListener("click", function () { window.print(); });
    qs("#carImportShare").addEventListener("click", shareQuote);
    qs("#carImportSaveLocal").addEventListener("click", saveLocalQuote);
    qs("#carImportAskAi").addEventListener("click", askAi);
    qs("#carImportCompareMode").addEventListener("click", function () {
      switchTab(qs("[aria-controls='carImportTabCompare']"));
      track("car_import_compare_mode_used", { country: qs("#carImportCountry").value });
    });
    qsa("[data-partner-zone]").forEach(function (link) {
      link.addEventListener("click", function () {
        track("car_import_outbound_partner_click", { zone: link.getAttribute("data-partner-zone") });
      });
    });
  }

  function mountShell() {
    var mount = qs("#carImportApp");
    if (!mount || qs("#carImportForm")) return;
    mount.innerHTML = ""
      + "<div class=\"car-import-layout\">"
      + "<form class=\"car-import-panel\" id=\"carImportForm\">"
      + "<h2>Build your landed-cost quote</h2>"
      + "<p class=\"car-import-help\">Start with the car details you know. The engine can work from purchase price, FOB, CIF, or make/model/year valuation seeds.</p>"
      + "<div class=\"car-import-form-grid\">"
      + field("Import country", "select", "carImportCountry", "full")
      + field("Source market", "select", "carImportSourceMarket", "")
      + selectField("Input mode", "carImportInputMode", [["purchase", "I know the purchase price"], ["fob", "I know FOB"], ["cif", "I know CIF"], ["make-model-year", "I only know make/model/year"], ["compare", "I want to compare source markets"]])
      + selectField("Output mode", "carImportOutputMode", [["practical", "Official + practical port costs"], ["official", "Official mode"], ["stress", "Stress test"]])
      + textField("Make", "carImportMake", "Toyota")
      + textField("Model", "carImportModel", "Corolla")
      + textField("Trim optional", "carImportTrim", "GLi")
      + numberField("Year", "carImportYear", "2018")
      + selectField("First registration month", "carImportFirstRegistrationMonth", [["1", "January"], ["2", "February"], ["3", "March"], ["4", "April"], ["5", "May"], ["6", "June"], ["7", "July"], ["8", "August"], ["9", "September"], ["10", "October"], ["11", "November"], ["12", "December"]])
      + selectField("Fuel type", "carImportFuelType", [["petrol", "Petrol"], ["diesel", "Diesel"], ["hybrid", "Hybrid"], ["phev", "PHEV"], ["ev", "EV"]])
      + numberField("Engine cc", "carImportEngineCc", "1800")
      + selectField("Body type", "carImportBodyType", [["sedan", "Sedan"], ["hatchback", "Hatchback"], ["suv", "SUV"], ["mpv", "MPV / Van"], ["pickup", "Pickup"], ["truck", "Truck"], ["motorcycle", "Motorcycle"]])
      + selectField("Drive side", "carImportDriveSide", [["right", "Right-hand drive"], ["left", "Left-hand drive"]])
      + selectField("Transmission", "carImportTransmission", [["automatic", "Automatic"], ["manual", "Manual"]])
      + selectField("Condition", "carImportCondition", [["used", "Used"], ["new", "New"]])
      + numberField("Mileage", "carImportMileage", "65000")
      + moneyField("Purchase price USD", "carImportPurchasePrice", "8200")
      + moneyField("FOB USD", "carImportFob", "")
      + moneyField("CIF USD", "carImportCif", "")
      + "<details class=\"car-import-advanced\"><summary>Advanced costs and finance</summary><div class=\"car-import-form-grid\">"
      + moneyField("Freight USD", "carImportFreight", "")
      + moneyField("Insurance USD", "carImportInsurance", "")
      + moneyField("Official customs value USD", "carImportCustomsValue", "")
      + field("Port", "select", "carImportPort", "")
      + field("Destination city", "select", "carImportDestinationCity", "")
      + numberField("Delay days", "carImportDelayDays", "0")
      + numberField("Storage days", "carImportStorageDays", "0")
      + selectField("Clearing mode", "carImportClearingMode", [["agent", "Agent estimate"], ["diy", "DIY estimate"]])
      + numberField("Down payment %", "carImportDownPayment", "25")
      + numberField("APR %", "carImportApr", "24")
      + numberField("Finance months", "carImportFinanceMonths", "36")
      + moneyField("Local dealer price USD", "carImportLocalDealerPrice", "")
      + moneyField("Extra agency charges USD", "carImportExtraAgencyCharges", "")
      + "</div></details>"
      + "</div><div class=\"car-import-actions\"><button class=\"car-import-button\" type=\"submit\">Calculate landed cost</button><button class=\"car-import-button secondary\" type=\"button\" id=\"carImportCompareMode\">Compare source markets</button></div>"
      + "</form>"
      + "<section class=\"car-import-result-panel\" id=\"carImportResults\" hidden>"
      + "<div class=\"car-import-result-head\"><div><div class=\"car-import-total-label\">Estimated on-road cost</div><div class=\"car-import-total\" id=\"carImportTotal\">USD 0</div><div class=\"car-import-total-sub\"><span id=\"carImportTotalLocal\"></span><br><span id=\"carImportSummaryLine\"></span><br><span id=\"carImportRulePackLine\"></span></div></div><div class=\"car-import-badges\" id=\"carImportBadgeStack\"></div></div>"
      + "<div class=\"car-import-tablist\"><div class=\"car-import-tabs\" role=\"tablist\">"
      + tab("Summary", "carImportTabSummary", true)
      + tab("Official Charges", "carImportTabOfficial", false)
      + tab("Practical Costs", "carImportTabPractical", false)
      + tab("Registration", "carImportTabRegistration", false)
      + tab("Scenarios", "carImportTabScenarios", false)
      + tab("Compare", "carImportTabCompare", false)
      + tab("Documents", "carImportTabDocuments", false)
      + tab("FAQ", "carImportTabFaq", false)
      + "</div></div>"
      + panel("carImportTabSummary", true, "<div id=\"carImportWarnings\" class=\"car-import-warning-stack\"></div><div class=\"car-import-metrics\" id=\"carImportMetrics\"></div><div class=\"car-import-waterfall\" id=\"carImportWaterfall\"></div><h2>Customs value basis</h2>" + table("carImportBasisTable"))
      + panel("carImportTabOfficial", false, "<h2>Official charges</h2>" + table("carImportOfficialTable"))
      + panel("carImportTabPractical", false, "<h2>Third-party, port, and delivery costs</h2>" + table("carImportPracticalTable"))
      + panel("carImportTabRegistration", false, "<h2>Registration and plates</h2>" + table("carImportRegistrationTable"))
      + panel("carImportTabScenarios", false, "<h2>Scenarios and sensitivity</h2>" + table("carImportScenarioTable") + "<h2>Exchange-rate and delay sensitivity</h2>" + table("carImportSensitivityTable") + "<p class=\"car-import-help\" id=\"carImportFinanceBlock\"></p>")
      + panel("carImportTabCompare", false, "<h2>Source market comparison</h2>" + table("carImportCompareTable", ["Source", "Freight", "Landed", "On-road"]))
      + panel("carImportTabDocuments", false, "<h2>Document checklist</h2><ul class=\"car-import-checklist\" id=\"carImportDocuments\"></ul><h2>Sources used</h2><ul id=\"carImportResultSources\"></ul><h2>Trust notes</h2><ul id=\"carImportResultDisclaimer\"></ul>")
      + panel("carImportTabFaq", false, "<div class=\"car-import-ai\"><h2>Ask the AfroTools car import advisor</h2><div class=\"car-import-ai-log\" id=\"carImportAiLog\"></div><textarea id=\"carImportAiQuestion\" placeholder=\"Ask why this country is expensive, what hidden costs to expect, or whether to import or buy locally.\"></textarea><button class=\"car-import-button\" id=\"carImportAskAi\" type=\"button\">Ask AI with this quote</button></div><h2>Country FAQ</h2><div class=\"car-import-faq\" id=\"carImportFaqList\"></div>")
      + "<div class=\"car-import-tab-actions\"><div class=\"car-import-actions\"><button type=\"button\" class=\"car-import-button\" id=\"carImportPdf\">Export PDF</button><button type=\"button\" class=\"car-import-button secondary\" id=\"carImportCsv\">Export CSV</button><button type=\"button\" class=\"car-import-button secondary\" id=\"carImportPrint\">Print</button><button type=\"button\" class=\"car-import-button secondary\" id=\"carImportShare\">Share quote</button><button type=\"button\" class=\"car-import-button tertiary\" id=\"carImportSaveLocal\">Save locally</button><save-result-button id=\"carImportCloudSave\" tool-slug=\"car-import-cost\" tool-name=\"African Car Landed Cost Calculator\"></save-result-button></div></div>"
      + "</section></div>";
  }

  function field(label, type, id, extraClass) {
    return "<label class=\"car-import-field " + escapeHtml(extraClass || "") + "\" for=\"" + id + "\"><span>" + escapeHtml(label) + "</span><" + type + " id=\"" + id + "\" name=\"" + id + "\"></" + type + "></label>";
  }

  function textField(label, id, placeholder) {
    return "<label class=\"car-import-field\" for=\"" + id + "\"><span>" + escapeHtml(label) + "</span><input id=\"" + id + "\" name=\"" + id + "\" type=\"text\" placeholder=\"" + escapeHtml(placeholder || "") + "\"></label>";
  }

  function numberField(label, id, placeholder) {
    return "<label class=\"car-import-field\" for=\"" + id + "\"><span>" + escapeHtml(label) + "</span><input id=\"" + id + "\" name=\"" + id + "\" type=\"number\" inputmode=\"decimal\" placeholder=\"" + escapeHtml(placeholder || "") + "\"></label>";
  }

  function moneyField(label, id, placeholder) {
    return numberField(label, id, placeholder);
  }

  function selectField(label, id, rows) {
    return "<label class=\"car-import-field\" for=\"" + id + "\"><span>" + escapeHtml(label) + "</span><select id=\"" + id + "\" name=\"" + id + "\">" + rows.map(function (row) {
      return "<option value=\"" + escapeHtml(row[0]) + "\">" + escapeHtml(row[1]) + "</option>";
    }).join("") + "</select></label>";
  }

  function tab(label, panelId, selected) {
    return "<button class=\"car-import-tab\" type=\"button\" role=\"tab\" aria-selected=\"" + (selected ? "true" : "false") + "\" aria-controls=\"" + panelId + "\">" + escapeHtml(label) + "</button>";
  }

  function panel(id, active, html) {
    return "<div id=\"" + id + "\" class=\"car-import-tab-panel " + (active ? "active" : "") + "\" role=\"tabpanel\">" + html + "</div>";
  }

  function table(id, headers) {
    headers = headers || ["Item", "Rate", "USD", "Local"];
    return "<table class=\"car-import-table\"><thead><tr>" + headers.map(function (header) {
      return "<th>" + escapeHtml(header) + "</th>";
    }).join("") + "</tr></thead><tbody id=\"" + id + "\"></tbody></table>";
  }

  function init() {
    if (!Engine) return;
    mountShell();
    if (!qs("#carImportForm")) return;
    loadData().then(function (data) {
      state.data = data;
      fillStaticOptions();
      qs("#carImportCountry").value = getDefaultCountry();
      updateCountryDependentOptions();
      applyInput(defaultInputForCountry(getDefaultCountry()));
      loadFormState();
      calculateAndRender();
      bindEvents();
    }).catch(function (error) {
      var results = qs("#carImportResults");
      if (results) {
        results.hidden = false;
        results.innerHTML = "<div class=\"car-import-empty\">The car import calculator data could not load. Refresh the page or try again shortly.</div>";
      }
      track("car_import_data_load_error", { message: error.message });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
