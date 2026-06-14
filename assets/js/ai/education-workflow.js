/**
 * AfroTools AI education workflow planner.
 *
 * Deterministic first: turns a scholarship/study-abroad prompt into a
 * structured plan without requiring a model provider. Browser builds expose
 * window.AfroToolsAIEducationWorkflow; tests/server tooling use CommonJS.
 */
(function initEducationWorkflow(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AfroToolsAIEducationWorkflow = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createEducationWorkflow() {
  "use strict";

  var ORIGIN_COUNTRIES = {
    nigeria: "Nigeria",
    nigerian: "Nigeria",
    ghana: "Ghana",
    ghanaian: "Ghana",
    cameroon: "Cameroon",
    cameroonian: "Cameroon",
    kenya: "Kenya",
    kenyan: "Kenya",
    "south africa": "South Africa",
    "south african": "South Africa",
    uganda: "Uganda",
    tanzania: "Tanzania",
    rwanda: "Rwanda",
    zambia: "Zambia",
    senegal: "Senegal",
  };

  var DESTINATION_COUNTRIES = {
    canada: "Canada",
    uk: "United Kingdom",
    "united kingdom": "United Kingdom",
    britain: "United Kingdom",
    england: "United Kingdom",
    germany: "Germany",
    australia: "Australia",
    us: "United States",
    usa: "United States",
    "united states": "United States",
    france: "France",
    ireland: "Ireland",
    netherlands: "Netherlands",
  };

  var DESTINATION_COSTS_USD = {
    Canada: 30000,
    "United Kingdom": 32000,
    Germany: 14000,
    Australia: 36000,
    "United States": 42000,
    France: 18000,
    Ireland: 30000,
    Netherlands: 25000,
  };

  var TOOL_CARDS = [
    {
      id: "study-abroad-cost",
      title: "Study Abroad Cost Planner",
      route: "/tools/study-abroad-cost/",
      reason: "Estimate tuition, living-cost pressure, FX assumptions, and funding gaps.",
    },
    {
      id: "scholarship-finder",
      title: "Scholarship Finder",
      route: "/tools/scholarship-finder/",
      reason: "Build a source-aware shortlist and verify eligibility/deadlines on provider pages.",
    },
    {
      id: "gpa-calculator",
      title: "GPA Calculator",
      route: "/tools/gpa-calculator/",
      reason: "Convert or check grades before filtering scholarship opportunities.",
    },
    {
      id: "ielts-calculator",
      title: "IELTS Pathway Checker",
      route: "/tools/ielts-calculator/",
      reason: "Check English-test readiness and target band gaps for admission.",
    },
    {
      id: "education-hub",
      title: "Education Hub",
      route: "/tools/education-hub/",
      reason: "Track profile, scholarships, documents, deadlines, and next actions together.",
    },
  ];

  function text(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalize(value) {
    return text(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function firstAlias(textValue, map) {
    var keys = Object.keys(map).sort(function byLength(a, b) {
      return b.length - a.length;
    });
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var pattern = new RegExp("(^|\\b)" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\b|$)", "i");
      if (pattern.test(textValue)) return map[key];
    }
    return "";
  }

  function parseMoney(query) {
    var raw = String(query || "");
    var symbol = raw.match(/(\$|₦|£|€)\s?([0-9][0-9,]*(?:\.\d+)?)(?:\s?(k|m))?/i);
    var word = raw.match(/\b([0-9][0-9,]*(?:\.\d+)?)(?:\s?(k|m))?\s?(usd|dollars|cad|gbp|pounds|eur|euros|ngn|naira|kes|ksh|ghs|zar|xaf|xof)\b/i);
    var match = symbol || word;
    if (!match) return { amount: null, currency: "" };
    var amountIndex = symbol ? 2 : 1;
    var suffixIndex = symbol ? 3 : 2;
    var currencyIndex = symbol ? 1 : 3;
    var amount = Number(String(match[amountIndex]).replace(/,/g, ""));
    if (!Number.isFinite(amount)) return { amount: null, currency: "" };
    var suffix = String(match[suffixIndex] || "").toLowerCase();
    if (suffix === "k") amount *= 1000;
    if (suffix === "m") amount *= 1000000;
    return { amount: amount, currency: normalizeCurrency(match[currencyIndex]) };
  }

  function normalizeCurrency(value) {
    var clean = String(value || "").toUpperCase().replace(/[^A-Z$₦£€]/g, "");
    var aliases = {
      "$": "USD",
      USD: "USD",
      DOLLARS: "USD",
      CAD: "CAD",
      "£": "GBP",
      GBP: "GBP",
      POUNDS: "GBP",
      "€": "EUR",
      EUR: "EUR",
      EUROS: "EUR",
      "₦": "NGN",
      NGN: "NGN",
      NAIRA: "NGN",
      KES: "KES",
      KSH: "KES",
      GHS: "GHS",
      ZAR: "ZAR",
      XAF: "XAF",
      XOF: "XOF",
    };
    return aliases[clean] || (clean.length === 3 ? clean : "");
  }

  function normalizeStudyLevel(value) {
    var clean = normalize(value);
    if (!clean) return "";
    if (/phd|doctor/.test(clean)) return "phd";
    if (/master|msc|mba/.test(clean)) return "masters";
    if (/undergrad|bachelor|bsc|ba\b/.test(clean)) return "undergraduate";
    if (/diploma|certificate/.test(clean)) return "diploma";
    return clean;
  }

  function normalizeField(value) {
    var clean = normalize(value);
    if (!clean) return "";
    if (/\b(engineer|engineering|stem|computer|software|data|science|technology|tech)\b/.test(clean)) return "STEM / engineering";
    if (/\b(business|finance|accounting|economics|management|mba)\b/.test(clean)) return "business";
    if (/\b(health|medicine|medical|nursing|public health|pharmacy)\b/.test(clean)) return "health";
    if (/\b(law|legal|policy|governance)\b/.test(clean)) return "law / policy";
    if (/\b(agric|agriculture|climate|environment|sustainability)\b/.test(clean)) return "agriculture / climate";
    if (/\b(art|arts|media|humanities|social)\b/.test(clean)) return "arts / social sciences";
    return text(value);
  }

  function inferField(query) {
    var clean = normalize(query);
    return normalizeField(clean);
  }

  function parseGrade(query) {
    var raw = String(query || "");
    var gpa = raw.match(/\b(?:gpa|cgpa)\s*(?:of|is|:)?\s*([0-5](?:\.\d+)?)\b/i) || raw.match(/\b([0-5](?:\.\d+)?)\s*\/\s*5(?:\.0)?\b/i);
    if (gpa) return Number(gpa[1]);
    var band = raw.match(/\b(first class|second class upper|2:1|upper second|distinction|credit|merit)\b/i);
    return band ? band[1].toLowerCase() : "";
  }

  function parseIelts(query) {
    var match = String(query || "").match(/\b(?:ielts|english)\s*(?:band|score)?\s*(?:of|is|:)?\s*([4-9](?:\.\d)?)\b/i);
    return match ? Number(match[1]) : null;
  }

  function parseTimeline(query) {
    var raw = String(query || "");
    var intake = raw.match(/\b(?:jan|january|may|sep|sept|september|fall|spring|summer|winter)\s*(?:intake)?\s*(20[2-3]\d)?\b/i);
    var year = raw.match(/\b(20[2-3]\d)\b/);
    if (intake) return text(intake[0]);
    if (year) return year[1];
    return "";
  }

  function normalizeInputs(query, inputs) {
    var raw = String(query || "");
    var clean = normalize(raw);
    var source = inputs || {};
    var money = parseMoney(raw);
    var origin = text(source.originCountry || source.homeCountry || source.nationality || source.country) || firstAlias(clean, ORIGIN_COUNTRIES);
    var target = text(source.targetCountry || source.destinationCountry || source.destination) || firstAlias(clean, DESTINATION_COUNTRIES);
    var levelMatch = raw.match(/\b(undergraduate|bachelor'?s?|masters?|master'?s?|phd|doctorate|diploma|mba)\b/i);
    var studyLevel = normalizeStudyLevel(source.studyLevel || source.level || (levelMatch && levelMatch[1]));
    var budget = source.budgetAmount || source.availableBudget || source.budget || money.amount;
    var budgetAmount = budget === "" || budget === undefined || budget === null ? null : Number(budget);
    if (!Number.isFinite(budgetAmount)) budgetAmount = null;
    return {
      originCountry: origin,
      targetCountry: target,
      budgetAmount: budgetAmount,
      currency: normalizeCurrency(source.currency || source.budgetCurrency) || money.currency || "USD",
      studyLevel: studyLevel,
      field: normalizeField(source.field || source.course || source.discipline) || inferField(raw),
      gpa: source.gpa || source.GPA || parseGrade(raw),
      ieltsScore: source.ieltsScore || source.ielts || parseIelts(raw),
      intakeTimeline: text(source.intakeTimeline || source.intake || source.timeline) || parseTimeline(raw),
    };
  }

  function missingInputs(inputs) {
    return ["originCountry", "targetCountry", "budgetAmount", "studyLevel", "field", "gpa", "intakeTimeline"].filter(function isMissing(key) {
      return inputs[key] === undefined || inputs[key] === null || inputs[key] === "";
    });
  }

  function estimateCost(inputs) {
    var annualCost = DESTINATION_COSTS_USD[inputs.targetCountry] || 24000;
    var budget = inputs.budgetAmount;
    var gap = budget === null ? null : Math.max(0, annualCost - budget);
    var ratio = budget === null ? 0 : budget / annualCost;
    var status = "Budget not assessed yet";
    if (budget !== null && ratio >= 0.85) status = "Near target for a first-year plan";
    else if (budget !== null && ratio >= 0.45) status = "Partial funding gap";
    else if (budget !== null) status = "Scholarship-heavy plan needed";
    return {
      estimatedAnnualCost: annualCost,
      currency: "USD",
      budgetAmount: budget,
      gapAmount: gap,
      status: status,
    };
  }

  function destinationFit(inputs, cost) {
    var notes = [];
    var label = "Needs more details";
    if (inputs.targetCountry) {
      label = inputs.targetCountry + " fit: planning estimate";
      notes.push("Check admission requirements, visa proof-of-funds rules, and program deadlines for " + inputs.targetCountry + ".");
    }
    if (cost.budgetAmount !== null && cost.gapAmount > 0) {
      notes.push("Budget covers part of a typical first-year estimate; prioritize funded awards, tuition waivers, and lower-cost cities/programs.");
    } else if (cost.budgetAmount !== null) {
      notes.push("Budget is closer to first-year planning estimates, but visa and proof-of-funds rules may still require more evidence.");
    }
    if (!inputs.ieltsScore) notes.push("English-test requirements vary by school and program; check IELTS/TOEFL waiver policies before paying for tests.");
    return { label: label, notes: notes };
  }

  function checklist(inputs, cost) {
    var target = inputs.targetCountry || "target country";
    var level = inputs.studyLevel || "study level";
    var field = inputs.field || "field";
    return [
      "Confirm " + level + " admission requirements for " + field + " programs in " + target + ".",
      "Use Study Abroad Cost Planner to compare tuition, living costs, FX assumptions, and the estimated funding gap.",
      "Use Scholarship Finder with your country, level, field, destination, GPA, and budget to build a shortlist.",
      "Prepare transcripts, passport, CV/resume, recommendation letters, personal statement, and proof-of-funds documents.",
      "Check IELTS/English requirements and calculate score gaps before booking a test.",
      "Track scholarship and admissions deadlines at least 9-12 months before the intended intake.",
      cost.gapAmount > 0 ? "Prioritize fully funded awards and assistantships because the current budget leaves an estimated funding gap." : "Still verify proof-of-funds and deposit deadlines even when the budget looks close.",
    ];
  }

  function scholarshipPrefillInputs(inputs) {
    return {
      country: inputs.originCountry,
      studyLevel: inputs.studyLevel,
      field: inputs.field,
      targetCountry: inputs.targetCountry,
      gpa: typeof inputs.gpa === "number" ? inputs.gpa : "",
      budget: inputs.budgetAmount,
      currency: inputs.currency,
    };
  }

  function sourceWarnings(inputs) {
    return [
      "Scholarship eligibility and deadlines change by cycle. Verify each opportunity on the official provider page before applying.",
      "Study-abroad costs, visa proof-of-funds, and exchange-rate assumptions are planning estimates, not immigration or financial advice.",
      inputs.targetCountry ? "Confirm current visa/admissions requirements for " + inputs.targetCountry + " with official government and institution sources." : "Add a destination country to see a more specific source warning.",
    ];
  }

  function goalSummary(inputs) {
    var origin = inputs.originCountry || "your country";
    var target = inputs.targetCountry || "a target country";
    var budget = inputs.budgetAmount === null ? "an unspecified budget" : formatMoney(inputs.budgetAmount, inputs.currency);
    var level = inputs.studyLevel || "a program";
    return "Study " + level + " in " + target + " from " + origin + " with " + budget + ".";
  }

  function formatMoney(amount, currency) {
    if (amount === null || amount === undefined || amount === "") return "not provided";
    return String(currency || "USD") + " " + Number(amount).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  function buildEducationPlan(input, options) {
    var opts = options || {};
    var query = opts.query || "";
    var inputs = normalizeInputs(query, input || {});
    var cost = estimateCost(inputs);
    var missing = missingInputs(inputs);
    return {
      workflowType: "education_planner",
      source: opts.source || "deterministic",
      consentToModel: opts.consentToModel === true,
      originalQuery: query,
      inputs: inputs,
      missingInputs: missing,
      goalSummary: goalSummary(inputs),
      destinationFit: destinationFit(inputs, cost),
      costGap: cost,
      matchingTools: TOOL_CARDS.slice(),
      checklist: checklist(inputs, cost),
      scholarshipPrefillInputs: scholarshipPrefillInputs(inputs),
      scholarshipLaunchUrl: "/tools/scholarship-finder/?source=ask&prefill=1",
      studyAbroadLaunchUrl: "/tools/study-abroad-cost/?source=ask&prefill=1",
      sourceWarnings: sourceWarnings(inputs),
      aiBrief: opts.consentToModel === true
        ? "AI brief can be generated only after explicit consent and a configured provider. Deterministic checklist remains available without AI."
        : "",
    };
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value).replace(/[&<>"']/g, function replace(ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function renderEducationPanel(plan) {
    if (!plan) return "";
    var tools = plan.matchingTools.map(function renderTool(tool) {
      return '<a class="ai-education-tool" href="' + escapeHtml(tool.route) + '">' +
        '<strong>' + escapeHtml(tool.title) + '</strong><span>' + escapeHtml(tool.reason) + '</span></a>';
    }).join("");
    var checklistHtml = plan.checklist.map(function renderItem(item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
    var warnings = plan.sourceWarnings.map(function renderWarning(item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
    var missing = plan.missingInputs.length
      ? plan.missingInputs.map(function renderMissing(item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("")
      : "<li>No critical education inputs missing.</li>";
    return '<section class="ai-education-plan" data-education-plan>' +
      '<div class="ai-education-head"><div><h4>Education plan</h4><p>' + escapeHtml(plan.goalSummary) + '</p></div><span>' + escapeHtml(plan.costGap.status) + '</span></div>' +
      '<div class="ai-education-grid">' +
      '<div><strong>Destination fit</strong><p>' + escapeHtml(plan.destinationFit.label) + '</p><ul>' + plan.destinationFit.notes.map(function (note) { return "<li>" + escapeHtml(note) + "</li>"; }).join("") + '</ul></div>' +
      '<div><strong>Cost gap</strong><p>Estimated annual cost: ' + escapeHtml(formatMoney(plan.costGap.estimatedAnnualCost, plan.costGap.currency)) + '</p><p>Estimated gap: ' + escapeHtml(plan.costGap.gapAmount === null ? "Add budget" : formatMoney(plan.costGap.gapAmount, plan.costGap.currency)) + '</p></div>' +
      '<div><strong>Missing profile inputs</strong><ul>' + missing + '</ul></div>' +
      '</div>' +
      '<div class="ai-education-section"><strong>Practical checklist</strong><ol>' + checklistHtml + '</ol></div>' +
      '<div class="ai-education-section"><strong>Matching AfroTools</strong><div class="ai-education-tools">' + tools + '</div></div>' +
      '<div class="ai-education-section ai-education-warning"><strong>Source and freshness</strong><ul>' + warnings + '</ul></div>' +
      '<div class="ai-education-actions">' +
      '<a class="ai-small-button primary" data-education-scholarship-link href="' + escapeHtml(plan.scholarshipLaunchUrl) + '">Open Scholarship Finder with profile</a>' +
      '<a class="ai-small-button secondary" href="' + escapeHtml(plan.studyAbroadLaunchUrl) + '">Open Study Abroad Cost Planner</a>' +
      '<button class="ai-small-button" type="button" data-education-ai-brief>Use AI to improve study plan brief</button>' +
      '</div>' +
      '<p class="ai-model-status" data-education-brief-status>' + escapeHtml(plan.aiBrief) + '</p>' +
      '</section>';
  }

  return {
    DESTINATION_COSTS_USD: DESTINATION_COSTS_USD,
    TOOL_CARDS: TOOL_CARDS,
    normalizeInputs: normalizeInputs,
    buildEducationPlan: buildEducationPlan,
    renderEducationPanel: renderEducationPanel,
    formatMoney: formatMoney,
  };
});
