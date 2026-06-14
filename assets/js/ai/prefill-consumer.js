/**
 * Applies Ask AfroTools AI prefill payloads on destination tool pages.
 *
 * This stays deliberately conservative: only fields with stable selectors are
 * filled, and sensitive values remain in sessionStorage rather than URLs.
 */
(function initPrefillConsumer(root) {
  "use strict";

  var CONFIGS = [
    config("cv-builder", ["/tools/cv-builder/"], {}, applyCvBuilderPrefill),
    config("scholarship-finder", ["/tools/scholarship-finder/"], {
      studyLevel: ["quickLevel", "profileLevel", "level"],
      field: ["quickField", "profileField", "field"],
      targetCountry: ["quickDest", "profileDest", "destination"],
      gpa: ["profileGPA"],
    }, null, { allowHiddenFields: true, setAllSelectors: true }),
    config("import-duty", ["/tools/import-duty/"], {
      destinationCountry: ["goodsCountry", "carCountry"],
      productCategory: ["goodsCategory"],
      itemCategory: ["goodsItemName"],
      currency: ["goodsCurrency", "carCurrency"],
      year: ["carYear", "carImportYear"],
      make: ["carMake", "carImportMake"],
      model: ["carModel", "carImportModel"],
      vehicleType: ["carVehicleType"],
      engineCc: ["carEngineSize", "carImportEngineCc"],
      shippingCost: ["goodsShipping", "carShipping", "carImportFreight"],
      insuranceCost: ["goodsInsurance", "carInsurance"],
      originCountry: ["goodsOrigin", "carOrigin"],
      port: ["goodsPort", "carPort"],
      fxRate: ["goodsFxRate", "carFxRate"],
      purchasePrice: ["goodsValue", "carPurchasePrice"],
      itemValue: ["goodsValue", "carPurchasePrice"],
    }, activateImportMode, { quietFields: true, afterApply: resetImportResult }),
    config("solar-roi", ["/tools/solar-roi/"], {
      monthlyBill: ["monthlyBill"],
      monthlyGeneratorSpend: ["generatorSpend"],
      generatorSpend: ["generatorSpend"],
      outageHours: ["outageHours"],
      backupHours: ["outageHours"],
      loadSizeKw: ["systemKW"],
      systemKW: ["systemKW"],
      fuelPrice: ["fuelPrice"],
      installCostPerKw: ["installCostPerKw"],
      budgetAmount: ["solarBudget"],
    }, null, { quietFields: true }),
    config("fuel-tracker", ["/tools/fuel-tracker/"], {
      country: ["calc-country"],
      fuelType: ["calc-fuel-type"],
      generatorHoursPerDay: ["calc-hours"],
      generatorSizeKva: ["calc-gen-size"],
    }),
    config("invoice-generator", ["/tools/invoice-generator/"], {
      clientName: ["clientName"],
      clientCompany: ["clientCompany"],
      currency: ["currency"],
      amount: [".li-price"],
      taxRate: ["taxRate", ".li-tax"],
      lineItemDescription: [".li-desc"],
    }),
    config("vat-calc-pan-african", ["/tools/vat-calculator/"], {}, applyVatPrefill),
    config("paye-calculator", ["/tools/paye-calculator/", "/kenya/ke-paye", "/ghana/gh-paye", "/nigeria/ng-salary-tax", "/south-africa/za-paye"], {}, applyPayePrefill),
    config("pdf-workspace", ["/tools/pdf-workspace/"], {}, focusPdfWorkflow),
  ];

  function config(toolId, paths, fields, beforeApply, options) {
    return Object.assign({ toolId: toolId, paths: paths, fields: fields, beforeApply: beforeApply }, options || {});
  }

  function normalizePath(pathname) {
    return String(pathname || "/").replace(/\/index\.html$/, "/");
  }

  function params() {
    try {
      return new URLSearchParams(root.location.search || "");
    } catch (err) {
      return new URLSearchParams("");
    }
  }

  function findConfig(payload) {
    var path = normalizePath(root.location.pathname || "");
    for (var i = 0; i < CONFIGS.length; i += 1) {
      var candidate = CONFIGS[i];
      if (candidate.toolId === payload.toolId) return candidate;
      for (var j = 0; j < candidate.paths.length; j += 1) {
        if (path === candidate.paths[j] || path.indexOf(candidate.paths[j]) === 0) return candidate;
      }
    }
    return null;
  }

  function isEmpty(value) {
    return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
  }

  function findElement(selector) {
    if (!selector) return null;
    if (selector.charAt(0) === "." || selector.charAt(0) === "#" || selector.indexOf("[") === 0) {
      return document.querySelector(selector);
    }
    return document.getElementById(selector);
  }

  function isHiddenField(field) {
    return !field || Boolean(field.closest("[hidden]"));
  }

  function setSelect(select, value) {
    var raw = String(value || "");
    var lower = raw.toLowerCase();
    var options = Array.prototype.slice.call(select.options || []);
    var exact = options.find(function(option) {
      return String(option.value || "").toLowerCase() === lower || String(option.textContent || "").toLowerCase() === lower;
    });
    var partial = exact || options.find(function(option) {
      var optionValue = String(option.value || "").toLowerCase();
      var optionText = String(option.textContent || "").toLowerCase();
      return optionValue.indexOf(lower) !== -1 || optionText.indexOf(lower) !== -1 || lower.indexOf(optionValue) !== -1;
    });
    if (!partial) return false;
    select.value = partial.value;
    return true;
  }

  function setField(selector, value, options) {
    if (isEmpty(value)) return false;
    var opts = options || {};
    var field = findElement(selector);
    if (!field) return false;
    if (!opts.allowHidden && isHiddenField(field)) return false;
    var didSet = false;
    if (field.tagName === "SELECT") {
      didSet = setSelect(field, value);
    } else if ("value" in field) {
      field.value = Array.isArray(value) ? value.join(", ") : String(value);
      didSet = true;
    }
    if (didSet && !opts.quiet) {
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return didSet;
  }

  function countryCode(value) {
    var raw = String(value || "").trim();
    var clean = raw.toLowerCase();
    if (!clean) return "";
    if (/^[a-z]{2,4}$/i.test(raw)) return raw.toUpperCase();
    var aliases = {
      nigeria: "NG",
      ghana: "GH",
      kenya: "KE",
      "south africa": "ZA",
      cameroon: "CM",
      egypt: "EG",
      ethiopia: "ET",
      tanzania: "TZ",
      rwanda: "RW",
      uganda: "UG",
      senegal: "SN",
      morocco: "MA",
      tunisia: "TN",
      algeria: "DZ",
      angola: "AO",
      zambia: "ZM",
      zimbabwe: "ZW",
      namibia: "NA",
      international: "INTL",
    };
    if (aliases[clean]) return aliases[clean];
    var norms = root.COUNTRY_NORMS || {};
    var keys = Object.keys(norms);
    for (var i = 0; i < keys.length; i += 1) {
      var name = String(norms[keys[i]] && norms[keys[i]].n || "").toLowerCase();
      if (name === clean) return keys[i];
    }
    return "";
  }

  function formatNumber(value) {
    var num = Number(value);
    if (!Number.isFinite(num)) return "";
    return String(Math.round(num));
  }

  function applyCvBuilderPrefill(payload) {
    var inputs = payload.normalizedInputs || {};
    var app = root.CVApp;
    if (!app || typeof app.getState !== "function") return [];
    var state = app.getState() || {};
    var data = state.data || {};
    var applied = [];
    var code = countryCode(inputs.country);

    if (inputs.starterId && root.CVStarterPaths && typeof root.CVStarterPaths.applyStarter === "function") {
      try {
        root.CVStarterPaths.applyStarter(inputs.starterId, { silent: true, noScroll: true });
        state = app.getState() || state;
        data = state.data || data;
        applied.push("starterId");
      } catch (err) {}
    }

    if (code) {
      if (typeof app.setTopState === "function") app.setTopState("country", code);
      else state.country = code;
      setField(".cv-country-sel", code);
      applied.push("country");
    }

    if (inputs.templateId) {
      if (typeof app.setTopState === "function") app.setTopState("template", String(inputs.templateId));
      else state.template = String(inputs.templateId);
      setField(".cv-workspace-template-select", inputs.templateId);
      applied.push("templateId");
    }

    if (inputs.targetRole && !data.title) {
      data.title = String(inputs.targetRole);
      applied.push("targetRole");
    }

    if (inputs.country && !data.loc) {
      data.loc = String(inputs.country);
      applied.push("country");
    }

    if (Array.isArray(inputs.skills) && inputs.skills.length && data.skills && !data.skills.h) {
      data.skills.h = inputs.skills.join(", ");
      applied.push("skills");
    }

    if (inputs.languagePreference && data.langs && Array.isArray(data.langs) && !data.langs.some(function (item) { return item && item.l; })) {
      data.langs[0] = Object.assign({}, data.langs[0] || {}, { l: String(inputs.languagePreference), lv: data.langs[0] && data.langs[0].lv || "Professional" });
      applied.push("languagePreference");
    }

    if (inputs.starterProfile && inputs.starterProfile.generatedWithConsent === true && inputs.starterProfile.summary && !data.summary) {
      data.summary = String(inputs.starterProfile.summary).slice(0, 420);
      applied.push("starterProfile");
    }

    if (typeof app.renderAll === "function") app.renderAll();
    else {
      if (typeof app.renderEditor === "function") app.renderEditor();
      if (typeof app.renderPreview === "function") app.renderPreview();
    }
    markCvAgentSession(inputs, applied);
    return applied;
  }

  function trackCvAgentEvent(eventName, params) {
    var safe = Object.assign({ source: "ask", tool_id: "cv-builder" }, params || {});
    try {
      if (root.CVAnalytics && typeof root.CVAnalytics.track === "function") {
        root.CVAnalytics.track(eventName, safe);
      } else if (root.AfroTools && root.AfroTools.analytics && typeof root.AfroTools.analytics.track === "function") {
        root.AfroTools.analytics.track(eventName, safe);
      }
    } catch (err) {}
  }

  function markCvAgentSession(inputs, applied) {
    if (!inputs || (!inputs.targetRole && !inputs.templateId && !inputs.starterId)) return;
    try {
      root.sessionStorage.setItem("afrotools.cvAgentActive", JSON.stringify({
        source: "ask",
        templateId: inputs.templateId || "",
        starterId: inputs.starterId || "",
        country: inputs.country || "",
        createdAt: Date.now()
      }));
    } catch (err) {}
    trackCvAgentEvent("cv_agent_start", {
      country_code: countryCode(inputs.country),
      template_id: inputs.templateId || "",
      action: "prefill_received",
      section_count: Array.isArray(applied) ? applied.length : 0
    });
    if (inputs.templateId) {
      trackCvAgentEvent("cv_agent_template_suggestion", {
        country_code: countryCode(inputs.country),
        template_id: inputs.templateId,
        source: "ask_prefill"
      });
    }
  }

  function activateImportMode(payload) {
    var inputs = payload.normalizedInputs || {};
    if (inputs.mode !== "car") return;
    var tab = document.querySelector('[data-mode-tab="car"]');
    if (tab && typeof tab.click === "function") tab.click();
  }

  function focusPdfWorkflow(payload) {
    var inputs = payload.normalizedInputs || {};
    var action = String(inputs.pdfAction || "");
    var modeByAction = {
      merge: "organize",
      split: "organize",
      organize: "organize",
      convert: "export",
      compress: "export",
      sign: "sign",
      protect: "protect",
      watermark: "edit",
    };
    var mode = modeByAction[action] || "";
    if (!mode) return;
    var fastStart = document.querySelector('[data-pdf-focus-mode="' + mode + '"]');
    if (fastStart && typeof fastStart.click === "function") fastStart.click();
    var modeButton = document.querySelector('[data-mode="' + mode + '"], [data-mobile-mode="' + mode + '"]');
    if (modeButton && typeof modeButton.click === "function") modeButton.click();
  }

  function resetImportResult() {
    var shell = document.getElementById("resultShell");
    if (!shell) return [];
    shell.innerHTML = '<div class="result-empty"><div><strong>Review landed-cost estimate</strong><p>Enter values and calculate to see CIF, duty/tax estimates, clearing costs, confidence labels, save/share actions and next steps.</p><p class="muted">Import costs can change. AfroTools provides planning estimates only. Always confirm final customs duty, taxes, levies, port charges, exchange rates, and clearing costs with official authorities or licensed professionals before making financial decisions.</p></div></div>';
    return [];
  }

  function applyVatPrefill(payload) {
    var inputs = payload.normalizedInputs || {};
    var applied = [];
    var code = inputs.countryCode || countryCode(inputs.country);
    var amount = inputs.invoiceAmount || inputs.amount;
    var treatment = String(inputs.vatTreatment || "standard").toLowerCase().replace(/\s+/g, "-");
    if (code && setField("countrySelect", code, { quiet: true })) applied.push("country");
    if (amount !== undefined && amount !== null && setField("amountInput", amount, { quiet: true })) applied.push("amount");
    if (code && setField("invoiceCountry", code, { quiet: true })) applied.push("invoiceCountry");
    if (amount !== undefined && amount !== null && setField(".vat-line-amount", amount, { quiet: true })) applied.push("invoiceAmount");
    if (inputs.lineItemDescription && setField(".vat-line-desc", inputs.lineItemDescription, { quiet: true })) applied.push("lineItemDescription");
    if (treatment && setField(".vat-line-type", treatment, { quiet: true })) applied.push("vatTreatment");
    if (code && setField("whCountry", code, { quiet: true })) applied.push("withholdingCountry");
    if (amount !== undefined && amount !== null && setField("whAmount", amount, { quiet: true })) applied.push("withholdingAmount");
    return applied;
  }

  function applyPayePrefill(payload) {
    var inputs = payload.normalizedInputs || {};
    var applied = [];
    var path = normalizePath(root.location.pathname || "");
    var gross = Number(inputs.grossPay);
    if (!Number.isFinite(gross)) return applied;
    var period = String(inputs.payPeriod || "monthly").toLowerCase();
    var monthly = Number(inputs.grossPayMonthly);
    var annual = Number(inputs.grossPayAnnual);
    if (!Number.isFinite(monthly)) monthly = period === "annual" ? gross / 12 : gross;
    if (!Number.isFinite(annual)) annual = period === "annual" ? gross : gross * 12;
    var valueForPage = path.indexOf("/kenya/ke-paye") === 0 ? monthly : annual;
    var inputId = path.indexOf("/nigeria/ng-salary-tax") === 0 ? "grossSalary" : "salaryInput";
    if (setField(inputId, formatNumber(valueForPage), { quiet: true })) applied.push("grossPay");
    var slider = document.getElementById("salarySlider");
    if (slider) {
      var min = Number(slider.min || 0);
      var max = Number(slider.max || valueForPage);
      var clamped = Math.max(min || 0, Math.min(max || valueForPage, valueForPage));
      slider.value = formatNumber(clamped);
      applied.push("salarySlider");
    }
    var sliderVal = document.getElementById("sliderVal");
    if (sliderVal) sliderVal.textContent = formatNumber(valueForPage);
    return applied;
  }

  function applyPayload(config, payload) {
    var inputs = payload.normalizedInputs || {};
    var applied = [];
    if (typeof config.beforeApply === "function") {
      var customApplied = config.beforeApply(payload);
      if (Array.isArray(customApplied)) applied = mergeApplied(applied, customApplied);
    }
    Object.keys(config.fields || {}).forEach(function(fieldName) {
      var value = inputs[fieldName];
      var selectors = config.fields[fieldName] || [];
      for (var i = 0; i < selectors.length; i += 1) {
        if (setField(selectors[i], value, { allowHidden: Boolean(config.allowHiddenFields), quiet: Boolean(config.quietFields) })) {
          applied.push(fieldName);
          if (!config.setAllSelectors) break;
        }
      }
    });
    if (typeof config.afterApply === "function") {
      var afterApplied = config.afterApply(payload, applied);
      if (Array.isArray(afterApplied)) applied = mergeApplied(applied, afterApplied);
    }
    return applied;
  }

  function noticeText(payload, applied) {
    var missing = Array.isArray(payload.missingInputs) ? payload.missingInputs : [];
    var lines = [];
    if (applied.length) lines.push("Applied prefill fields: " + applied.join(", ") + ".");
    if (!applied.length) lines.push("Prefill details are ready for this workflow.");
    if (missing.length) lines.push("Missing: " + missing.join(", ") + ".");
    if (payload.userFacingSummary) lines.push(payload.userFacingSummary);
    lines.push(payload.privacyNote || "Prefill data is stored briefly in this browser session and not in the URL.");
    return lines.join(" ");
  }

  function showNotice(payload, applied) {
    var main = document.querySelector("main") || document.body;
    if (!main) return;
    var existing = document.getElementById("afrotools-ai-prefill-notice");
    if (existing) {
      var existingText = existing.querySelector("span");
      if (existingText) existingText.textContent = noticeText(payload, applied);
      return;
    }
    var box = document.createElement("section");
    box.id = "afrotools-ai-prefill-notice";
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    box.style.cssText = "max-width:1120px;margin:14px auto;padding:12px 14px;border:1px solid #bfdbfe;border-radius:12px;background:#f8fbff;color:#334155;font:14px/1.5 system-ui,sans-serif";
    box.innerHTML = "<strong style=\"display:block;color:#0f172a;margin-bottom:2px\">Started from AfroTools AI</strong><span></span>";
    box.querySelector("span").textContent = noticeText(payload, applied);
    main.insertBefore(box, main.firstChild);
  }

  function mergeApplied(current, next) {
    var seen = {};
    var merged = [];
    current.concat(next).forEach(function(item) {
      if (!item || seen[item]) return;
      seen[item] = true;
      merged.push(item);
    });
    return merged;
  }

  function scheduleRetry(config, payload, applied) {
    [300, 1000, 2500, 4500, 6500].forEach(function(delay) {
      root.setTimeout(function() {
        applied = mergeApplied(applied, applyPayload(config, payload));
        showNotice(payload, applied);
      }, delay);
    });
  }

  function consume() {
    if (params().get("prefill") !== "1") return;
    var adapters = root.AfroToolsAIPrefillAdapters;
    if (!adapters || typeof adapters.readLaunchPayload !== "function") return;
    var payload = adapters.readLaunchPayload();
    if (!payload) return;
    var config = findConfig(payload);
    if (!config) {
      showNotice(payload, []);
      return;
    }
    var applied = applyPayload(config, payload);
    showNotice(payload, applied);
    scheduleRetry(config, payload, applied);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", consume, { once: true });
  } else {
    consume();
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
