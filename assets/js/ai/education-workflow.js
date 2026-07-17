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

  var DESTINATION_PROFILES = {
    Canada: {
      admissions: "Competitive admissions and proof-of-funds pressure; scholarships are often program-specific.",
      scholarshipFocus: "Prioritize university entrance awards, graduate assistantships, province-specific awards, and Mastercard-style African student programs.",
    },
    "United Kingdom": {
      admissions: "Strong one-year master's route, but tuition deposits and visa timing can move quickly.",
      scholarshipFocus: "Check Chevening, Commonwealth, university Africa awards, department bursaries, and early-deadline fee waivers.",
    },
    Germany: {
      admissions: "Lower tuition can help, but blocked-account, language, and document-certification rules matter.",
      scholarshipFocus: "Look for DAAD, Erasmus, university research assistantships, and English-taught public university routes.",
    },
    Australia: {
      admissions: "High total cost and visa proof pressure; scholarships often need strong academics and early applications.",
      scholarshipFocus: "Target Australia Awards, Destination Australia, university international scholarships, and research stipends.",
    },
    "United States": {
      admissions: "Large funding range; assistantships and school choice drive affordability.",
      scholarshipFocus: "Prioritize funded graduate assistantships, need-aware universities, department awards, and application-fee waivers.",
    },
    France: {
      admissions: "Cost can be lower than Anglophone routes, but language and visa evidence can shape fit.",
      scholarshipFocus: "Check Eiffel, Campus France, institutional waivers, and francophone Africa mobility programs.",
    },
    Ireland: {
      admissions: "English-taught route with high living-cost pressure in major cities.",
      scholarshipFocus: "Check Government of Ireland, university international awards, and field-specific tuition discounts.",
    },
    Netherlands: {
      admissions: "Good English-taught options, but housing and proof-of-funds pressure are common risks.",
      scholarshipFocus: "Check NL Scholarship, university excellence awards, and early faculty deadlines.",
    },
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

  function parseGradeInfo(query) {
    var value = parseGrade(query);
    if (typeof value === "number") return { gpa: value, gradeBand: gpaBand(value) };
    return { gpa: null, gradeBand: value || "" };
  }

  function gpaBand(value) {
    var score = Number(value);
    if (!Number.isFinite(score)) return "";
    if (score >= 4.5) return "very strong";
    if (score >= 3.5) return "strong";
    if (score >= 3) return "competitive";
    if (score >= 2.5) return "borderline";
    return "needs strengthening";
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
    var gradeInfo = parseGradeInfo(raw);
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
      gpa: source.gpa || source.GPA || gradeInfo.gpa,
      gradeBand: text(source.gradeBand || source.grade || gradeInfo.gradeBand),
      ieltsScore: source.ieltsScore || source.ielts || parseIelts(raw),
      intakeTimeline: text(source.intakeTimeline || source.intake || source.timeline) || parseTimeline(raw),
    };
  }

  function missingInputs(inputs) {
    return ["originCountry", "targetCountry", "budgetAmount", "studyLevel", "field", "academicRecord", "intakeTimeline"].filter(function isMissing(key) {
      if (key === "academicRecord") return !inputs.gpa && !inputs.gradeBand;
      return inputs[key] === undefined || inputs[key] === null || inputs[key] === "";
    });
  }

  function estimateCost(inputs) {
    var annualCost = DESTINATION_COSTS_USD[inputs.targetCountry] || 24000;
    var budget = inputs.budgetAmount;
    var budgetUsd = inputs.currency === "USD" ? budget : null;
    var gap = budgetUsd === null ? null : Math.max(0, annualCost - budgetUsd);
    var ratio = budgetUsd === null ? 0 : budgetUsd / annualCost;
    var status = "Budget not assessed yet";
    if (budget !== null && budgetUsd === null) status = "Currency conversion needed";
    else if (budget !== null && ratio >= 0.85) status = "Near target for a first-year plan";
    else if (budget !== null && ratio >= 0.45) status = "Partial funding gap";
    else if (budget !== null) status = "Scholarship-heavy plan needed";
    return {
      estimatedAnnualCost: annualCost,
      currency: "USD",
      budgetAmount: budget,
      budgetCurrency: inputs.currency,
      budgetUsd: budgetUsd,
      gapAmount: gap,
      upfrontEstimate: Math.round(annualCost * 0.55),
      status: status,
    };
  }

  function destinationFit(inputs, cost) {
    var notes = [];
    var label = "Needs more details";
    var profile = DESTINATION_PROFILES[inputs.targetCountry] || null;
    if (inputs.targetCountry) {
      label = inputs.targetCountry + " fit: planning estimate";
      notes.push(profile ? profile.admissions : "Check admission requirements, visa proof-of-funds rules, and program deadlines for " + inputs.targetCountry + ".");
    }
    if (cost.budgetAmount !== null && cost.gapAmount > 0) {
      notes.push("Budget covers part of a typical first-year estimate; prioritize funded awards, tuition waivers, and lower-cost cities/programs.");
    } else if (cost.budgetAmount !== null && cost.gapAmount === 0) {
      notes.push("Budget is closer to first-year planning estimates, but visa and proof-of-funds rules may still require more evidence.");
    } else if (cost.budgetAmount !== null) {
      notes.push("Budget was captured in " + inputs.currency + "; use the cost tool to compare it against USD or local-currency destination estimates.");
    }
    if (!inputs.ieltsScore) notes.push("English-test requirements vary by school and program; check IELTS/TOEFL waiver policies before paying for tests.");
    if (inputs.gpa || inputs.gradeBand) notes.push("Academic profile: " + (inputs.gpa ? "GPA " + inputs.gpa + " (" + gpaBand(inputs.gpa) + ")" : inputs.gradeBand) + ".");
    return { label: label, notes: notes };
  }

  function scholarshipStrategy(inputs, cost) {
    var profile = DESTINATION_PROFILES[inputs.targetCountry] || {};
    var points = [
      profile.scholarshipFocus || "Prioritize official provider pages, university awards, government programs, foundations, and field-specific grants.",
      inputs.field ? "Filter scholarships by " + inputs.field + " first, then widen to general international student awards." : "Add a field of study to improve scholarship matching.",
      inputs.studyLevel ? "Use " + inputs.studyLevel + " level filters because award rules often differ by degree type." : "Add study level before trusting eligibility matches.",
    ];
    if (cost.gapAmount !== null && cost.gapAmount > 0) {
      points.push("Funding gap estimate: " + formatMoney(cost.gapAmount, "USD") + ". Prioritize full tuition, living stipend, and assistantship options.");
    }
    if (inputs.gpa || inputs.gradeBand) {
      points.push("Use GPA/grade band to separate strong-fit awards from stretch applications.");
    }
    return {
      headline: inputs.targetCountry ? "Scholarship strategy for " + inputs.targetCountry : "Scholarship strategy",
      points: points,
    };
  }

  function documentChecklist(inputs) {
    var documents = [
      "International passport with enough validity for admission and visa timelines.",
      "Academic transcripts and certificate copies.",
      "CV/resume focused on education, leadership, projects, and awards.",
      "Personal statement or statement of purpose draft.",
      "Recommendation-letter request list with deadlines.",
      "Proof-of-funds evidence or sponsor documents for visa planning.",
    ];
    if (inputs.ieltsScore) documents.push("IELTS/English score report and school-specific minimum-band check.");
    else documents.push("IELTS/TOEFL/English waiver evidence or test-booking plan.");
    if (inputs.field) documents.push("Portfolio, research proposal, writing sample, or project evidence if required for " + inputs.field + ".");
    return documents;
  }

  function deadlinePlan(inputs) {
    var intake = inputs.intakeTimeline || "target intake";
    return [
      "12-15 months before " + intake + ": shortlist programs, confirm entry requirements, and identify scholarship windows.",
      "9-12 months before " + intake + ": prepare transcripts, referees, English tests, and scholarship essays.",
      "6-9 months before " + intake + ": submit priority scholarship and admission applications.",
      "3-6 months before " + intake + ": prepare visa documents, proof-of-funds evidence, housing research, and travel budget.",
      "Final 8 weeks: confirm offer conditions, deposits, medical/insurance requirements, and arrival checklist.",
    ];
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
      cost.gapAmount === null ? "Convert the budget into the destination cost currency before relying on the funding gap." : (cost.gapAmount > 0 ? "Prioritize fully funded awards and assistantships because the current budget leaves an estimated funding gap." : "Still verify proof-of-funds and deposit deadlines even when the budget looks close."),
    ];
  }

  function scholarshipPrefillInputs(inputs) {
    return {
      country: inputs.originCountry,
      studyLevel: inputs.studyLevel,
      field: inputs.field,
      targetCountry: inputs.targetCountry,
      gpa: typeof inputs.gpa === "number" ? inputs.gpa : "",
      gradeBand: inputs.gradeBand,
      budget: inputs.budgetAmount,
      currency: inputs.currency,
    };
  }

  function studyAbroadPrefillInputs(inputs) {
    return {
      country: inputs.originCountry,
      originCountry: inputs.originCountry,
      targetCountry: inputs.targetCountry,
      studyLevel: inputs.studyLevel,
      field: inputs.field,
      gpa: inputs.gpa,
      gradeBand: inputs.gradeBand,
      ieltsScore: inputs.ieltsScore,
      budget: inputs.budgetAmount,
      budgetAmount: inputs.budgetAmount,
      currency: inputs.currency,
      intakeTimeline: inputs.intakeTimeline,
    };
  }

  function sourceWarnings(inputs) {
    return [
      "Scholarship feed source: scholarship-provider-feed. Eligibility and deadlines change by cycle. Verify each opportunity on the official provider page before applying.",
      "Cost and visa source: study-abroad-cost-planning-estimates. Study-abroad costs, visa proof-of-funds, and exchange-rate assumptions are planning estimates, not immigration or financial advice.",
      inputs.targetCountry ? "Confirm current visa/admissions requirements for " + inputs.targetCountry + " with official government and institution sources." : "Add a destination country to see a more specific source warning.",
    ];
  }

  function sourceConfidence(inputs) {
    return [
      {
        sourceId: "scholarship-provider-feed",
        label: "Scholarship provider feed",
        freshnessStatus: "acceptable",
        confidence: "reviewed",
        note: "Use as a shortlist starter; verify deadline and eligibility on provider pages.",
      },
      {
        sourceId: "study-abroad-cost-planning-estimates",
        label: "Study abroad cost and visa planning estimates",
        freshnessStatus: "unknown",
        confidence: "estimated",
        note: inputs.targetCountry ? "Confirm " + inputs.targetCountry + " visa and proof-of-funds requirements with official sources." : "Add destination for a sharper visa/cost warning.",
      },
    ];
  }

  function nextSteps(inputs, cost) {
    return [
      inputs.targetCountry ? "Open Study Abroad Cost Planner for " + inputs.targetCountry + " and compare at least one lower-cost backup destination." : "Choose a destination country before comparing costs.",
      "Open Scholarship Finder with this profile and save a shortlist of 5-10 realistic awards.",
      inputs.gpa || inputs.gradeBand ? "Run GPA/grade checks against each scholarship's minimum academic requirement." : "Add GPA or grade band before applying to grade-sensitive awards.",
      inputs.ieltsScore ? "Check whether IELTS " + inputs.ieltsScore + " meets each program and visa threshold." : "Use IELTS Pathway Checker or confirm English-test waivers.",
      cost.gapAmount !== null && cost.gapAmount > 0 ? "Build a funding stack for the estimated gap: scholarships, assistantships, family proof, savings, and lower-cost route choices." : "Verify proof-of-funds, deposit timing, and official fee pages before paying.",
    ];
  }

  function studyPlanBriefText(plan) {
    return [
      plan.goalSummary,
      "Destination fit: " + plan.destinationFit.label,
      "Cost signal: " + plan.costGap.status + "; estimated annual cost " + formatMoney(plan.costGap.estimatedAnnualCost, plan.costGap.currency) + ".",
      "Scholarship focus: " + plan.scholarshipStrategy.points.slice(0, 2).join(" "),
      "Immediate next step: " + plan.nextSteps[0],
      "Source note: scholarship and cost data are planning inputs; verify provider, university, and government pages before applying.",
    ].join("\n");
  }

  function buildStudyPlanBriefPrompt(plan) {
    var safe = plan || {};
    return [
      "Create a concise study plan brief for an AfroTools user.",
      "Do not invent scholarships, fees, visa rules, deadlines, guarantees, or official claims.",
      "Use only these structured planning details:",
      "Goal: " + (safe.goalSummary || ""),
      "Inputs: " + JSON.stringify(safe.inputs || {}),
      "Cost: " + JSON.stringify(safe.costGap || {}),
      "Scholarship strategy: " + JSON.stringify(safe.scholarshipStrategy || {}),
      "Documents: " + JSON.stringify((safe.documentChecklist || []).slice(0, 8)),
      "Deadlines: " + JSON.stringify((safe.deadlinePlan || []).slice(0, 5)),
      "Next steps: " + JSON.stringify((safe.nextSteps || []).slice(0, 5)),
      "End with a reminder to verify scholarship, university, and visa details from official sources.",
    ].join("\n");
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
    var plan = {
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
      scholarshipStrategy: scholarshipStrategy(inputs, cost),
      documentChecklist: documentChecklist(inputs),
      deadlinePlan: deadlinePlan(inputs),
      checklist: checklist(inputs, cost),
      nextSteps: nextSteps(inputs, cost),
      scholarshipPrefillInputs: scholarshipPrefillInputs(inputs),
      studyAbroadPrefillInputs: studyAbroadPrefillInputs(inputs),
      scholarshipLaunchUrl: "/tools/scholarship-finder/?source=ask&prefill=1",
      studyAbroadLaunchUrl: "/tools/study-abroad-cost/?source=ask&prefill=1",
      sourceWarnings: sourceWarnings(inputs),
      sourceConfidence: sourceConfidence(inputs),
      deterministicBrief: "",
      studyPlanBriefPrompt: "",
      aiBrief: opts.consentToModel === true
        ? "AI brief can be generated only after explicit consent and a configured provider. Deterministic checklist remains available without AI."
        : "",
    };
    plan.deterministicBrief = studyPlanBriefText(plan);
    plan.studyPlanBriefPrompt = buildStudyPlanBriefPrompt(plan);
    return plan;
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
    var sourceRows = plan.sourceConfidence.map(function renderSource(item) {
      return "<li><strong>" + escapeHtml(item.label) + ":</strong> " + escapeHtml(item.confidence) + " / " + escapeHtml(item.freshnessStatus) + ". " + escapeHtml(item.note) + "</li>";
    }).join("");
    var docs = plan.documentChecklist.map(function renderDoc(item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
    var deadlines = plan.deadlinePlan.map(function renderDeadline(item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
    var next = plan.nextSteps.map(function renderNext(item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
    var scholarship = plan.scholarshipStrategy.points.map(function renderPoint(item) {
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
      '<div class="ai-education-section"><strong>Scholarship strategy</strong><p>' + escapeHtml(plan.scholarshipStrategy.headline) + '</p><ul>' + scholarship + '</ul></div>' +
      '<div class="ai-education-grid">' +
      '<div class="ai-education-section"><strong>Documents</strong><ul>' + docs + '</ul></div>' +
      '<div class="ai-education-section"><strong>Deadlines</strong><ol>' + deadlines + '</ol></div>' +
      '<div class="ai-education-section"><strong>Next steps</strong><ol>' + next + '</ol></div>' +
      '</div>' +
      '<div class="ai-education-section"><strong>Practical checklist</strong><ol>' + checklistHtml + '</ol></div>' +
      '<div class="ai-education-section"><strong>Matching AfroTools</strong><div class="ai-education-tools">' + tools + '</div></div>' +
      '<div class="ai-education-section ai-education-warning"><strong>Source and freshness</strong><ul>' + warnings + sourceRows + '</ul></div>' +
      '<div class="ai-education-actions">' +
      '<a class="ai-small-button primary" data-education-scholarship-link href="' + escapeHtml(plan.scholarshipLaunchUrl) + '">Open Scholarship Finder with profile</a>' +
      '<a class="ai-small-button secondary" data-education-study-link href="' + escapeHtml(plan.studyAbroadLaunchUrl) + '">Open Study Abroad Cost Planner</a>' +
      '<button class="ai-small-button" type="button" data-education-ai-brief>Generate AI study plan brief</button>' +
      '</div>' +
      '<div class="ai-education-section"><strong>Study plan brief</strong><p data-education-ai-output>' + escapeHtml(plan.deterministicBrief) + '</p></div>' +
      '<p class="ai-model-status" data-education-brief-status>' + escapeHtml(plan.aiBrief) + '</p>' +
      '</section>';
  }

  return {
    DESTINATION_COSTS_USD: DESTINATION_COSTS_USD,
    TOOL_CARDS: TOOL_CARDS,
    normalizeInputs: normalizeInputs,
    getMissingInputs: missingInputs,
    buildEducationPlan: buildEducationPlan,
    buildStudyPlanBriefPrompt: buildStudyPlanBriefPrompt,
    renderEducationPanel: renderEducationPanel,
    formatMoney: formatMoney,
  };
});
