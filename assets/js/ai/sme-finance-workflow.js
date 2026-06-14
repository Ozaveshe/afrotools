/**
 * AfroTools AI SME finance assistant workflow.
 *
 * Calculator-first and compliance-safe: extracts payroll, PAYE, VAT, invoice,
 * TIN, registration, and cashflow signals, then routes into existing AfroTools
 * tools with cautious planning language. No model/provider calls happen here.
 */
(function initSmeFinanceWorkflow(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.AfroToolsAISmeFinanceWorkflow = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createSmeFinanceWorkflow() {
  "use strict";

  var COUNTRY_META = {
    nigeria: { country: "Nigeria", code: "NG", currency: "NGN", symbol: "NGN", payeRoute: "/nigeria/ng-salary-tax", vatRoute: "/nigeria/ng-vat", vatRate: 7.5, authority: "FIRS / state revenue service" },
    lagos: { country: "Nigeria", code: "NG", currency: "NGN", symbol: "NGN", payeRoute: "/nigeria/ng-salary-tax", vatRoute: "/nigeria/ng-vat", vatRate: 7.5, authority: "FIRS / state revenue service", city: "Lagos" },
    kenya: { country: "Kenya", code: "KE", currency: "KES", symbol: "KES", payeRoute: "/kenya/ke-paye", vatRoute: "/kenya/ke-vat", vatRate: 16, authority: "KRA" },
    nairobi: { country: "Kenya", code: "KE", currency: "KES", symbol: "KES", payeRoute: "/kenya/ke-paye", vatRoute: "/kenya/ke-vat", vatRate: 16, authority: "KRA", city: "Nairobi" },
    ghana: { country: "Ghana", code: "GH", currency: "GHS", symbol: "GHS", payeRoute: "/ghana/gh-paye", vatRoute: "/ghana/gh-vat", vatRate: 20, authority: "GRA" },
    accra: { country: "Ghana", code: "GH", currency: "GHS", symbol: "GHS", payeRoute: "/ghana/gh-paye", vatRoute: "/ghana/gh-vat", vatRate: 20, authority: "GRA", city: "Accra" },
    "south africa": { country: "South Africa", code: "ZA", currency: "ZAR", symbol: "ZAR", payeRoute: "/south-africa/za-paye", vatRoute: "/south-africa/za-vat", vatRate: 15, authority: "SARS" },
    johannesburg: { country: "South Africa", code: "ZA", currency: "ZAR", symbol: "ZAR", payeRoute: "/south-africa/za-paye", vatRoute: "/south-africa/za-vat", vatRate: 15, authority: "SARS", city: "Johannesburg" },
  };

  var CURRENCY_BY_COUNTRY = { NG: "NGN", KE: "KES", GH: "GHS", ZA: "ZAR" };

  function text(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalize(value) {
    return text(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function toNumber(value) {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    var match = String(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    var parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function positiveNumber(value) {
    var parsed = toNumber(value);
    return parsed !== null && parsed >= 0 ? parsed : null;
  }

  function normalizeCurrency(value) {
    var clean = String(value || "").toUpperCase().replace(/[^A-Z$]/g, "");
    var aliases = {
      "$": "USD",
      USD: "USD",
      DOLLARS: "USD",
      DOLLAR: "USD",
      NAIRA: "NGN",
      NGN: "NGN",
      KES: "KES",
      KSH: "KES",
      GHS: "GHS",
      CEDI: "GHS",
      CEDIS: "GHS",
      ZAR: "ZAR",
      RAND: "ZAR",
      R: "ZAR",
    };
    return aliases[clean] || (clean.length === 3 ? clean : "");
  }

  function moneyFromMatch(match) {
    if (!match) return { amount: null, currency: "" };
    var amount = Number(String(match.amount || "").replace(/,/g, ""));
    if (!Number.isFinite(amount)) return { amount: null, currency: "" };
    var suffix = normalize(match.suffix || "");
    if (suffix === "k") amount *= 1000;
    if (suffix === "m") amount *= 1000000;
    return { amount: amount, currency: normalizeCurrency(match.currency || "") };
  }

  function parseMoney(raw) {
    var value = String(raw || "");
    var symbol = value.match(/(?<currency>\$|USD|NGN|KES|KSH|GHS|ZAR)\s?(?<amount>[0-9][0-9,]*(?:\.\d+)?)(?<suffix>\s?[km]\b)?/i);
    var word = value.match(/\b(?<amount>[0-9][0-9,]*(?:\.\d+)?)(?<suffix>\s?[km]\b)?\s?(?<currency>usd|dollars|ngn|naira|kes|ksh|ghs|cedis?|zar|rand)\b/i);
    return moneyFromMatch(symbol && symbol.groups || word && word.groups);
  }

  function parseLabeledMoney(raw, labels) {
    var labelPattern = labels.join("|");
    var after = new RegExp("\\b(?:" + labelPattern + ")\\s*(?:is|of|for|:)?\\s*(\\$|USD|NGN|KES|KSH|GHS|ZAR)?\\s?([0-9][0-9,]*(?:\\.\\d+)?)(\\s?[km]\\b)?", "i");
    var before = new RegExp("(\\$|USD|NGN|KES|KSH|GHS|ZAR)?\\s?([0-9][0-9,]*(?:\\.\\d+)?)(\\s?[km]\\b)?\\s*(?:" + labelPattern + ")\\b", "i");
    var match = String(raw || "").match(after);
    if (match) return moneyFromMatch({ currency: match[1] || "", amount: match[2], suffix: match[3] || "" });
    match = String(raw || "").match(before);
    if (match) return moneyFromMatch({ currency: match[1] || "", amount: match[2], suffix: match[3] || "" });
    return { amount: null, currency: "" };
  }

  function firstAlias(clean, map) {
    var keys = Object.keys(map).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      if (clean.indexOf(key) !== -1) return map[key];
    }
    return null;
  }

  function detectCountry(raw, source) {
    var direct = text(source.country || source.destinationCountry || source.market || "");
    var clean = normalize(raw + " " + direct);
    var found = firstAlias(clean, COUNTRY_META);
    if (direct && !found) {
      var directClean = normalize(direct);
      Object.keys(COUNTRY_META).some(function (key) {
        if (normalize(COUNTRY_META[key].country) === directClean || COUNTRY_META[key].code.toLowerCase() === directClean) {
          found = COUNTRY_META[key];
          return true;
        }
        return false;
      });
    }
    return found || {};
  }

  function detectWorkflow(raw, source) {
    var requested = normalize(source.workflowKind || source.businessTask || source.task || "");
    var clean = normalize(raw + " " + requested);
    if (/\b(tin|tax identification|registration|register business|business registration|cac|cipc|kra pin)\b/.test(clean)) return "registration";
    if (/\b(cashflow|cash flow|runway|working capital)\b/.test(clean)) return "cashflow";
    if (/\b(invoice|receipt|bill client|quote|proforma)\b/.test(clean)) return "invoice";
    if (/\b(vat|value added tax|sales tax|withholding vat)\b/.test(clean)) return "vat";
    if (/\b(payroll|paye|salary tax|net pay|gross salary|employees?|staff|workers?)\b/.test(clean)) return "payroll";
    return requested || "business";
  }

  function detectPeriod(raw, source) {
    var clean = normalize(source.payPeriod || source.period || raw);
    if (/\b(annual|yearly|per year|year)\b/.test(clean)) return "annual";
    if (/\b(weekly|per week|week)\b/.test(clean)) return "weekly";
    if (/\b(daily|per day|day)\b/.test(clean)) return "daily";
    return "monthly";
  }

  function normalizeInputs(query, inputs) {
    var raw = String(query || "");
    var source = inputs || {};
    var country = detectCountry(raw, source);
    var workflowKind = detectWorkflow(raw, source);
    var genericMoney = parseMoney(raw);
    var salaryMoney = parseLabeledMoney(raw, ["gross salary", "salary", "gross pay", "payroll", "wage", "wages"]);
    var invoiceMoney = parseLabeledMoney(raw, ["invoice amount", "invoice", "receipt", "bill", "amount", "total"]);
    var employees = raw.match(/\b([1-9][0-9]?)\s+(?:employees|staff|workers|people)\b/i);
    var vatTreatment = raw.match(/\b(standard|zero-rated|zero rated|exempt|withholding|inclusive|exclusive)\b/i);
    var businessType = raw.match(/\b(shop|retail|consulting|agency|restaurant|school|clinic|startup|company|freelancer|sole proprietor|limited company)\b/i);
    var lineItem = raw.match(/\b(?:for|selling|service|services?|goods?)\s+([a-z][a-z0-9 &/-]{2,50})(?:\s+(?:in|to|worth|amount|invoice|vat|for)\b|[?.!,]|$)/i);
    var amount = positiveNumber(source.invoiceAmount || source.amount || source.total);
    var grossPay = positiveNumber(source.grossPay || source.salary || source.income || source.grossSalary);
    var employeeCount = positiveNumber(source.employeeCount || source.numberOfEmployees || source.employees || source.staffCount);
    if (employeeCount === null && employees) employeeCount = Number(employees[1]);
    if (grossPay === null && salaryMoney.amount !== null && salaryMoney.amount >= 100) grossPay = salaryMoney.amount;
    if (amount === null && invoiceMoney.amount !== null) amount = invoiceMoney.amount;
    if (workflowKind === "payroll" && grossPay === null && genericMoney.amount !== null) grossPay = genericMoney.amount;
    if ((workflowKind === "invoice" || workflowKind === "vat") && amount === null && genericMoney.amount !== null) amount = genericMoney.amount;
    var currency = normalizeCurrency(source.currency || salaryMoney.currency || invoiceMoney.currency || genericMoney.currency || country.currency || "");
    return {
      workflowKind: workflowKind,
      country: country.country || text(source.country || ""),
      countryCode: country.code || text(source.countryCode || ""),
      city: country.city || text(source.city || ""),
      currency: currency || CURRENCY_BY_COUNTRY[country.code] || "",
      numberOfEmployees: employeeCount,
      employeeCount: employeeCount,
      grossPay: grossPay,
      salaryBand: text(source.salaryBand || source.salaryBands || ""),
      payPeriod: detectPeriod(raw, source),
      deductionsBenefits: text(source.deductionsBenefits || source.benefits || source.deductions || ""),
      invoiceAmount: amount,
      amount: amount,
      vatTreatment: normalize(source.vatTreatment || source.taxTreatment || (vatTreatment && vatTreatment[1]) || ""),
      businessType: normalize(source.businessType || (businessType && businessType[1]) || ""),
      lineItemDescription: text(source.lineItemDescription || source.description || source.service || (lineItem && lineItem[1]) || ""),
      vatRate: positiveNumber(source.vatRate) !== null ? positiveNumber(source.vatRate) : (country.vatRate !== undefined ? country.vatRate : null),
      authority: country.authority || "relevant revenue authority",
      payeRoute: country.payeRoute || "/tools/paye-calculator/",
      vatRoute: country.vatRoute || "/tools/vat-calculator/",
    };
  }

  function hasValue(value) {
    return !(value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0));
  }

  function getMissingInputs(inputs) {
    var missing = [];
    if (!hasValue(inputs.country)) missing.push("country");
    if (inputs.workflowKind === "payroll") {
      if (!hasValue(inputs.numberOfEmployees)) missing.push("numberOfEmployees");
      if (!hasValue(inputs.grossPay) && !hasValue(inputs.salaryBand)) missing.push("grossPay");
      if (!hasValue(inputs.payPeriod)) missing.push("payPeriod");
    }
    if (inputs.workflowKind === "vat") {
      if (!hasValue(inputs.invoiceAmount)) missing.push("invoiceAmount");
      if (!hasValue(inputs.vatTreatment)) missing.push("vatTreatment");
    }
    if (inputs.workflowKind === "invoice") {
      if (!hasValue(inputs.invoiceAmount)) missing.push("invoiceAmount");
      if (!hasValue(inputs.currency)) missing.push("currency");
      if (!hasValue(inputs.vatTreatment)) missing.push("vatTreatment");
    }
    if (inputs.workflowKind === "registration" && !hasValue(inputs.businessType)) missing.push("businessType");
    return missing.slice(0, 5);
  }

  function periodMultiplier(period) {
    if (period === "annual") return 1;
    if (period === "weekly") return 52;
    if (period === "daily") return 260;
    return 12;
  }

  function formatMoney(value, currency) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return "Add amount";
    return (currency || "") + " " + Math.round(Number(value)).toLocaleString("en-US");
  }

  function buildChecklist(inputs) {
    if (inputs.workflowKind === "payroll") {
      return [
        "Confirm gross salaries, allowances, taxable benefits, and pay period.",
        "Check statutory deductions and employer contributions in the country PAYE tool.",
        "Review filing/remittance deadlines with the revenue authority or accountant.",
        "Keep payslip and payment evidence before closing payroll.",
      ];
    }
    if (inputs.workflowKind === "vat" || inputs.workflowKind === "invoice") {
      return [
        "Confirm whether the supply is standard-rated, zero-rated, exempt, or withholding-sensitive.",
        "Verify invoice numbering, buyer details, tax ID, and local invoicing requirements.",
        "Keep the invoice as a business record; AfroTools does not file VAT returns.",
        "Ask an accountant before applying unusual exemptions or reverse-charge treatment.",
      ];
    }
    if (inputs.workflowKind === "registration") {
      return [
        "Confirm business name, legal structure, directors/owners, address, and activity.",
        "Prepare identity documents, TIN/PIN, tax registration, and sector permits where needed.",
        "Use official portals or qualified professionals for actual filing.",
      ];
    }
    return [
      "Enter recent revenue, cost, tax, and payment assumptions.",
      "Export a planning copy for review.",
      "Verify high-stakes compliance decisions with official sources or a qualified professional.",
    ];
  }

  function routeForKind(inputs) {
    if (inputs.workflowKind === "payroll") return inputs.payeRoute || "/tools/paye-calculator/";
    if (inputs.workflowKind === "vat") return "/tools/vat-calculator/";
    if (inputs.workflowKind === "invoice") return "/tools/invoice-generator/";
    if (inputs.workflowKind === "registration") return "/tools/business-registration/";
    if (inputs.workflowKind === "cashflow") return "/tools/cash-flow-forecast/";
    return "/vat-business-tax/";
  }

  function buildFinancePlan(inputs, options) {
    var normalized = normalizeInputs(options && options.query || "", inputs || {});
    var employeeCount = normalized.numberOfEmployees || 1;
    var grossTotalPerPeriod = normalized.grossPay !== null ? normalized.grossPay * employeeCount : null;
    var annualGrossExposure = grossTotalPerPeriod !== null ? grossTotalPerPeriod * periodMultiplier(normalized.payPeriod) : null;
    var vatAmount = normalized.invoiceAmount !== null && normalized.vatRate !== null ? normalized.invoiceAmount * normalized.vatRate / 100 : null;
    var invoiceTotal = vatAmount !== null ? normalized.invoiceAmount + vatAmount : normalized.invoiceAmount;
    var selectedRoute = routeForKind(normalized);
    var recommendedTool = normalized.workflowKind === "payroll" ? "PAYE / Payroll calculator"
      : normalized.workflowKind === "vat" ? "VAT Calculator"
      : normalized.workflowKind === "invoice" ? "Invoice Generator"
      : normalized.workflowKind === "registration" ? "Business Registration / TIN checklist"
      : normalized.workflowKind === "cashflow" ? "Cash Flow Forecast"
      : "Business and tax tools";
    var warning = "Planning estimate only. This is not tax, accounting, legal, payroll, or compliance advice. Verify with " + (normalized.authority || "the relevant authority") + " or a qualified accountant before filing, paying, or issuing compliance documents.";
    var briefLines = [
      "AFROTOOLS SME FINANCE ASSISTANT BRIEF",
      "",
      "Goal: " + goalSummary(normalized),
      "Recommended workflow: " + recommendedTool,
      "Country: " + (normalized.country || "Country needed"),
      "",
      "Key planning figures",
      "Employees: " + (normalized.numberOfEmployees || "Add employee count"),
      "Gross payroll per " + (normalized.payPeriod || "period") + ": " + formatMoney(grossTotalPerPeriod, normalized.currency),
      "Annual gross payroll exposure: " + formatMoney(annualGrossExposure, normalized.currency),
      "Invoice amount before VAT: " + formatMoney(normalized.invoiceAmount, normalized.currency),
      "VAT estimate: " + formatMoney(vatAmount, normalized.currency),
      "Invoice total: " + formatMoney(invoiceTotal, normalized.currency),
      "",
      "Checklist",
      buildChecklist(normalized).map(function (item, index) { return (index + 1) + ". " + item; }).join("\n"),
      "",
      warning,
    ];
    return {
      kind: "sme_finance_assistant",
      inputs: normalized,
      missingInputs: getMissingInputs(normalized),
      goalSummary: goalSummary(normalized),
      recommendedTool: recommendedTool,
      selectedRoute: selectedRoute,
      metrics: [
        { label: "Employees", value: normalized.numberOfEmployees || "Add count" },
        { label: "Gross payroll", value: formatMoney(grossTotalPerPeriod, normalized.currency) },
        { label: "VAT estimate", value: formatMoney(vatAmount, normalized.currency) },
        { label: "Invoice total", value: formatMoney(invoiceTotal, normalized.currency) },
      ],
      checklist: buildChecklist(normalized),
      sourceConfidence: [
        "PAYE and VAT outputs are planning estimates until reviewed against the relevant revenue authority.",
        "Invoice values and salary inputs are user-entered and not independently verified.",
        "Partner or sponsor placements do not alter formulas, rates, eligibility, or recommendations.",
      ],
      sponsorNote: "Partner/accounting placements, where shown, must be clearly labeled. AfroTools calculations remain independent and lead handoff requires opt-in.",
      warning: warning,
      payrollPrefillInputs: {
        country: normalized.country,
        countryCode: normalized.countryCode,
        grossPay: normalized.grossPay,
        payPeriod: normalized.payPeriod,
        employeeCount: normalized.numberOfEmployees,
        numberOfEmployees: normalized.numberOfEmployees,
        currency: normalized.currency,
        deductionsBenefits: normalized.deductionsBenefits,
      },
      vatPrefillInputs: {
        country: normalized.country,
        countryCode: normalized.countryCode,
        amount: normalized.invoiceAmount,
        invoiceAmount: normalized.invoiceAmount,
        currency: normalized.currency,
        vatRate: normalized.vatRate,
        vatTreatment: normalized.vatTreatment || "standard",
        lineItemDescription: normalized.lineItemDescription,
        workflowKind: normalized.workflowKind,
      },
      invoicePrefillInputs: {
        country: normalized.country,
        countryCode: normalized.countryCode,
        amount: normalized.invoiceAmount,
        invoiceAmount: normalized.invoiceAmount,
        currency: normalized.currency,
        taxRate: normalized.vatRate,
        vatRate: normalized.vatRate,
        vatTreatment: normalized.vatTreatment || "standard",
        lineItemDescription: normalized.lineItemDescription || "Service or product",
      },
      registrationRoute: "/tools/business-registration/",
      tinRoute: "/tools/tin-guide/",
      cashflowRoute: "/tools/cash-flow-forecast/",
      decisionBriefText: briefLines.join("\n"),
    };
  }

  function goalSummary(inputs) {
    var country = inputs.country ? " in " + inputs.country : "";
    if (inputs.workflowKind === "payroll") return "Prepare payroll/PAYE planning for " + (inputs.numberOfEmployees || "your") + " employee(s)" + country + ".";
    if (inputs.workflowKind === "vat") return "Check VAT treatment and invoice totals" + country + ".";
    if (inputs.workflowKind === "invoice") return "Create a VAT-aware invoice draft" + country + ".";
    if (inputs.workflowKind === "registration") return "Prepare a business registration and TIN checklist" + country + ".";
    if (inputs.workflowKind === "cashflow") return "Open a cashflow planning workflow" + country + ".";
    return "Route a business finance task into AfroTools" + country + ".";
  }

  function listHtml(items) {
    return "<ul>" + (items || []).map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") + "</ul>";
  }

  function renderFinancePanel(plan) {
    if (!plan) return "";
    var metrics = plan.metrics.map(function (metric) {
      return "<div><span>" + escapeHtml(metric.label) + "</span><strong>" + escapeHtml(metric.value) + "</strong></div>";
    }).join("");
    return '<section class="ai-finance-plan" data-sme-finance>' +
      '<div class="ai-finance-head"><div><span class="ai-panel-eyebrow">SME finance assistant</span><h4>' + escapeHtml(plan.recommendedTool) + '</h4><p>' + escapeHtml(plan.goalSummary) + '</p></div><span class="ai-chip">' + escapeHtml(plan.inputs.country || "Country needed") + '</span></div>' +
      '<div class="ai-finance-metrics">' + metrics + '</div>' +
      '<div class="ai-finance-grid">' +
      '<div><strong>Checklist</strong>' + listHtml(plan.checklist) + '</div>' +
      '<div><strong>Source and confidence</strong>' + listHtml(plan.sourceConfidence) + '<p>' + escapeHtml(plan.warning) + '</p></div>' +
      '<div><strong>Partner surface</strong><p>' + escapeHtml(plan.sponsorNote) + '</p></div>' +
      '<div><strong>Useful next tools</strong><ul>' +
      '<li><a href="/tools/payslip-generator/">Payslip Generator</a></li>' +
      '<li><a href="/tools/staff-cost/">Employee Cost Calculator</a></li>' +
      '<li><a href="/tools/business-registration/">Business Registration Checklist</a></li>' +
      '<li><a href="/tools/cash-flow-forecast/">Cash Flow Forecast</a></li>' +
      '</ul></div>' +
      '</div>' +
      '<div class="ai-finance-actions">' +
      '<a class="ai-small-button primary" href="' + escapeHtml(plan.selectedRoute) + '" data-sme-primary-link>Open recommended tool</a>' +
      '<a class="ai-small-button" href="/tools/vat-calculator/" data-sme-vat-link>Open VAT calculator</a>' +
      '<a class="ai-small-button" href="/tools/invoice-generator/" data-sme-invoice-link>Open invoice generator</a>' +
      '<a class="ai-small-button secondary" href="/tools/business-registration/" data-sme-registration-link>Business/TIN checklist</a>' +
      '<button class="ai-small-button secondary" type="button" data-sme-brief-download>Download finance brief</button>' +
      '<button class="ai-small-button secondary" type="button" data-sme-brief-copy>Copy brief</button>' +
      '<button class="ai-small-button secondary" type="button" data-sme-ai-brief>Use AI to improve brief</button>' +
      '<span class="ai-panel-status" data-sme-brief-status></span>' +
      '</div>' +
      '</section>';
  }

  return {
    normalizeInputs: normalizeInputs,
    getMissingInputs: getMissingInputs,
    buildFinancePlan: buildFinancePlan,
    renderFinancePanel: renderFinancePanel,
    formatMoney: formatMoney,
  };
});
