(function () {
  "use strict";

  const body = document.body;
  const configNode = document.getElementById("education-parity-config");
  const form = document.querySelector("[data-education-form]");
  const resultPanel = document.querySelector("[data-education-result]");
  const metricsNode = document.querySelector("[data-education-metrics]");
  const statusNode = document.querySelector("[data-education-status]");
  if (!configNode || !form || !resultPanel || !metricsNode || !statusNode) return;

  const config = JSON.parse(configNode.textContent);
  let current = null;

  function pathValue(object, path) {
    return String(path).split(".").reduce((value, key) => value == null ? undefined : value[key], object);
  }

  function engine(path) {
    const value = pathValue(window, path);
    if (!value) throw new Error("Injini ya hesabu haipatikani.");
    return value;
  }

  function values() {
    const data = {};
    new FormData(form).forEach((value, key) => { data[key] = value; });
    return data;
  }

  function numeric(input, keys) {
    const output = Object.assign({}, input);
    keys.forEach((key) => { output[key] = input[key] === "" ? "" : Number(input[key]); });
    return output;
  }

  const runners = {
    matric(input, api) {
      const names = ["English First Additional Language", "Afrikaans Home Language", "Mathematics", "Physical Sciences", "Life Sciences", "Accounting", "Life Orientation"];
      const values = [input.learning, input.home, input.mathematics, input.science, input.lifeScience, input.accounting, input.orientation];
      const result = api.calculate({
        homeLanguage: names[1], learningLanguage: names[0],
        results: names.map((subject, index) => ({ subject, percentage: Number(values[index]) }))
      });
      if (result.ok) result.countedCount = result.counted.length;
      return result;
    },
    "exam-countdown"(input, api) {
      const state = api.dateState(input.examDate, new Date("2026-07-29T12:00:00Z"));
      const phase = api.planningPhase(state.days, state.kind);
      return { ok: state.kind !== "invalid", days: state.days, kind: state.kind, phase: phase.label, name: input.name, meaning: input.meaning };
    },
    flashcards(input, api) {
      const cards = api.parseCards(input.deck);
      const order = api.buildReviewOrder(cards);
      return { ok: cards.length > 0, cardCount: cards.length, reviewCount: order.length, firstPrompt: cards[0] && (cards[0].front || cards[0].question) };
    },
    citation(input, api) {
      return api.generate(input);
    },
    periodic(input, api) {
      const matches = api.filter(window.PERIODIC_ELEMENTS || [], { query: input.query });
      if (!matches.length) return { ok: false };
      const element = matches[0];
      return {
        ok: true,
        count: matches.length,
        symbol: element.s,
        atomicNumber: element.z,
        atomicWeight: api.atomicWeight(element).value,
        group: element.g
      };
    },
    algebra(input, api) {
      const result = input.mode === "quadratic" ? api.solveQuadratic(input.expression) : input.mode === "inequality" ? api.solveInequality(input.expression) : api.solveLinear(input.expression);
      if (result.roots) result.rootsText = result.roots.join(", ");
      result.expression = input.expression;
      return result;
    },
    binary(input, api) {
      const result = api.convert(input.value, Number(input.fromBase), [2, 10, 16]);
      if (result.ok) {
        const output = (base) => result.outputs.find((item) => item.base === base);
        result.binary = output(2).value;
        result.decimal = output(10).value;
        result.hex = output(16).value;
      }
      return result;
    },
    statistics(input, api) {
      const parsed = api.parseInput(input.values);
      if (!parsed.values.length || parsed.invalidTokens.length) return { ok: false };
      return Object.assign({ ok: true }, api.analyse(parsed.values));
    },
    fraction(input, api) {
      return api.calculate({
        left: { whole: "", numerator: input.leftNumerator, denominator: input.leftDenominator },
        operation: input.operation,
        right: { whole: "", numerator: input.rightNumerator, denominator: input.rightDenominator }
      });
    },
    roman(input, api) {
      const result = api.convert(input.value);
      if (result.ok) result.explanation = result.equation;
      return result;
    },
    scientific(input, api) {
      const result = api.evaluate(input.expression, { angleMode: input.angleMode });
      if (result.ok) result.formatted = api.format(result.value);
      return result;
    },
    "school-fees"(input, api) {
      return api.calculate(numeric(input, ["tuition", "extras", "monthlySupport", "rhythm"]));
    },
    "study-planner"(input, api) {
      const result = api.validatePlan(numeric(input, ["subjectCount", "hoursPerDay", "daysPerWeek", "sessionLength"]));
      if (result.ok) {
        result.allocation = api.allocateSessions(Array.from({ length: Number(input.subjectCount) }, () => ({ weight: 1 })), result.totalSessions).join(" · ");
      }
      return result;
    },
    ielts(input, api) {
      const scores = numeric(input, ["listening", "reading", "writing", "speaking"]);
      const result = api.calculateOverall(scores);
      const comparison = api.compare(result.overall, Number(input.target));
      result.targetStatus = comparison.status;
      return result;
    },
    "teacher-salary"(input, api) {
      return api.validate(numeric(input, ["baseMonthly", "allowancesMonthly", "deductionsMonthly", "weeklyHours", "workingWeeks"]));
    },
    waec(input, api) {
      const rows = [
        ["English Language", input.english],
        ["Mathematics", input.mathematics],
        ["Physics", input.physics],
        ["Chemistry", input.chemistry],
        ["Biology", input.biology]
      ].map(([name, grade]) => ({ name, grade }));
      return api.calculateNigeria(rows);
    },
    jamb(input, api) {
      return api.calculate(numeric(input, ["utme", "postUtme", "utmeWeight", "postUtmeWeight", "benchmark"]));
    },
    gpa(input, api) {
      const template = api.getTemplate(input.scale);
      const result = api.calculateSemester([
        { name: "Somo la 1", credits: Number(input.credits1), value: Number(input.points1) },
        { name: "Somo la 2", credits: Number(input.credits2), value: Number(input.points2) }
      ], template);
      result.average = result.gpa == null ? result.average : result.gpa;
      return result;
    },
    word(input, api) {
      const stats = api.analyse(input.text, {});
      const limits = api.evaluateLimits(stats, input);
      return Object.assign({}, stats, { limitState: limits.state });
    },
    percentage(input, api) {
      const result = input.mode === "percentageOf"
        ? api.percentageOf(input.a, input.b)
        : input.mode === "change"
          ? api.percentageChange(input.a, input.b)
          : api.percentOf(input.a, input.b);
      result.modeSwahili = input.mode === "percentageOf" ? "Sehemu ya jumla" : input.mode === "change" ? "Mabadiliko" : "Asilimia ya thamani";
      result.firstValue = Number(input.a);
      result.secondValue = Number(input.b);
      return result;
    },
    helb(input, api) {
      return api.calculate(numeric(input, ["balance", "annualRate", "monthlyPayment", "extraPayment"]));
    },
    "university-ranking"(input, api) {
      const result = api.compare([
        { name: input.aName, tuition: input.aTuition, living: 0, other: 0, url: input.aUrl, accreditation: "not-checked" },
        { name: input.bName, tuition: input.bTuition, living: 0, other: 0, url: input.bUrl, accreditation: "not-checked" }
      ], "2026-07-29");
      if (result.valid && result.candidates.length) {
        result.firstName = result.candidates[0].name;
        result.firstCost = result.candidates[0].firstYearCost;
      }
      return result;
    },
    degree(input, api) {
      const result = api.build({ destination: input.destination, purpose: input.purpose, qualification: input.qualification, institutionStatus: input.institutionStatus, documents: [] });
      if (result.valid) result.gapCount = result.gaps.length;
      return result;
    },
    "study-abroad"(input, api) {
      return api.calculate(numeric(Object.assign({
        upfrontTuition: 0, otherUpfront: 0, refundableDeposit: 0
      }, input), ["months", "tuitionAnnual", "tuitionYears", "accommodationMonthly", "livingMonthly", "insuranceAnnual", "governmentFees", "setupCosts", "confirmedAid", "availableFunds", "upfrontTuition", "otherUpfront", "refundableDeposit"]));
    },
    "student-loan"(input, api) {
      const data = numeric(input, ["principal", "annualRate", "months", "extraPayment"]);
      return Object.assign({}, api.calculate(data), api.compare(data));
    },
    nysc(input, api) {
      return api.calculate(numeric(Object.assign({
        ppaMonthly: 0, ppaMonths: 0, otherMonthly: 0, otherMonths: 0, oneTimeIncome: 0, dataMonthly: 0, otherCostMonthly: 0
      }, input), ["planMonths", "federalMonthly", "federalMonths", "stateMonthly", "stateMonths", "housingMonthly", "foodMonthly", "transportMonthly", "oneTimeCosts", "ppaMonthly", "ppaMonths", "otherMonthly", "otherMonths", "oneTimeIncome", "dataMonthly", "otherCostMonthly"]));
    },
    kcse(input, api) {
      const others = ["other1", "other2", "other3", "other4", "other5"].map((key, index) => ({ subject: `Somo ${index + 1}`, grade: input[key] }));
      const result = api.calculate({ mathematics: input.mathematics, english: input.english, kiswahili: input.kiswahili, others });
      if (result.ok) result.countedCount = result.counted.length;
      return result;
    },
    "ghana-service"(input, api) {
      return api.calculate(numeric(Object.assign({
        agencyMonthly: 0, agencyMonths: 0, otherMonthly: 0, otherMonths: 0, oneTimeSupport: 0, dataMonthly: 0, otherCostMonthly: 0
      }, input), ["planMonths", "allowanceMonthly", "allowanceMonths", "receivedToDate", "dueMonths", "housingMonthly", "foodMonthly", "transportMonthly", "oneTimeCosts", "agencyMonthly", "agencyMonths", "otherMonthly", "otherMonths", "oneTimeSupport", "dataMonthly", "otherCostMonthly"]));
    },
    admission(input, api) {
      return api.plan(input);
    },
    "student-budget"(input, api) {
      return api.calculate({
        periodMonths: Number(input.periodMonths), monthlyIncome: Number(input.monthlyIncome), periodFunding: Number(input.periodFunding),
        monthlyExpenses: { housing: Number(input.housing), food: Number(input.food), transport: Number(input.transport) },
        periodExpenses: { fees: Number(input.fees) }
      });
    },
    bootcamp(input, api) {
      return api.calculate(numeric(Object.assign({
        aEquipment: 0, aMonthlyAccess: 0, bEquipment: 0, bMonthlyAccess: 0
      }, input), ["aDuration", "aWeeklyHours", "aProviderCost", "aFees", "aForegone", "bDuration", "bWeeklyHours", "bProviderCost", "bFees", "bForegone", "incomeLift", "aEquipment", "aMonthlyAccess", "bEquipment", "bMonthlyAccess"]));
    },
    boarding(input, api) {
      return api.calculate(numeric(Object.assign({ mealsTerm: 0, extrasTerm: 0, tripCost: 0, annual: 0, dayAnnual: 0 }, input), ["years", "terms", "months", "trips", "tuitionTerm", "boardingTerm", "monthly", "startup", "inflation", "contingency", "mealsTerm", "extrasTerm", "tripCost", "annual", "dayAnnual"]));
    },
    cert(input, api) {
      return api.calculate(numeric(input, ["directCost", "otherCost", "studyHours", "hourValue", "annualUplift", "studyMonths", "delayMonths", "horizonYears"]));
    },
    classroom(input, api) {
      return api.calculate(numeric(Object.assign({ fixedArea: 0, administrativeMax: 0 }, input), ["roomLength", "roomWidth", "frontDepth", "rearDepth", "sideClearance", "aisleWidth", "aisleCount", "deskWidth", "rowPitch", "seatsPerUnit", "areaPerLearner", "actualLearners", "fixedArea", "administrativeMax"]));
    },
    "course-load"(input, api) {
      return api.calculate({
        required: input.required, earned: input.earned, min: input.min, max: input.max,
        courses: [{ name: input.course1, credits: input.credits1 }, { name: input.course2, credits: input.credits2 }],
        contact: input.contact, study: input.study, work: input.work, commute: 0, sleepNight: input.sleepNight, personal: 0
      });
    },
    "edu-savings"(input, api) {
      return api.calculate(numeric(input, ["todayCost", "months", "inflationRate", "currentSavings", "monthlyContribution", "annualGrowthRate"]));
    },
    "exam-timetable"(input, api) {
      return api.calculate({
        startDate: input.startDate, sessionsPerDay: Number(input.sessionsPerDay), studyDays: [1, 2, 3, 4, 5],
        subjects: [
          { name: input.subject1, examDate: input.examDate1, targetSessions: Number(input.target1), priority: 3 },
          { name: input.subject2, examDate: input.examDate2, targetSessions: Number(input.target2), priority: 2 }
        ]
      });
    },
    interview(input, api) {
      const result = api.compile({
        role: input.role, employer: input.employer, format: input.format,
        evidence: [{ requirement: input.requirement, proof: input.proof }],
        questions: [input.question], stories: []
      });
      result.evidenceCount = result.evidence.length;
      result.questionCount = result.questions.length;
      return result;
    },
    plagiarism(input, api) {
      const result = api.analyze(input.text, { phraseSize: Number(input.phraseSize), minimumCount: Number(input.minimumCount) });
      if (result.ok) result.repeatedPhraseCount = result.repeatedPhrases.length;
      return result;
    },
    async scholarship(input, api) {
      const feed = window.AfroScholarshipFeed;
      if (!feed || typeof feed.load !== "function") return { ok: false };
      const fallback = {
        scholarships: typeof feed.getFallbackScholarships === "function" ? feed.getFallbackScholarships() : [],
        meta: { mode: "fallback", label: "Orodha iliyochaguliwa ya akiba", isDegraded: true }
      };
      const loaded = await Promise.race([
        feed.load(),
        new Promise((resolve) => window.setTimeout(() => resolve(fallback), 1500))
      ]);
      const scholarships = loaded && Array.isArray(loaded.scholarships) ? loaded.scholarships : [];
      const matches = api.match(scholarships, {
        gpa_value: input.gpaValue,
        gpa_scale: input.gpaScale,
        ielts_overall: input.ielts,
        target_study_level: input.level,
        target_fields: input.field === "any" ? [] : [input.field],
        target_countries: input.destination === "global" ? [] : [input.destination]
      });
      if (!matches.length) return { ok: false };
      const top = matches[0];
      const categoryLabels = { "Strong Match": "Inalingana sana", "Good Match": "Inalingana vizuri", Possible: "Inawezekana", Unlikely: "Hailingani sana" };
      return {
        ok: true,
        total: scholarships.length,
        topName: top.scholarship.name || top.scholarship.title,
        topPercent: top.percent,
        topCategory: top.category,
        topCategorySwahili: categoryLabels[top.category] || top.category,
        officialUrl: top.scholarship.application_url || top.scholarship.info_url || top.scholarship.source_url,
        feedMode: loaded.meta && loaded.meta.mode,
        feedLabel: loaded.meta && loaded.meta.label,
        feedCheckedAt: loaded.meta && (loaded.meta.lastCheckedAt || loaded.meta.cachedAt)
      };
    },
    tutoring(input, api) {
      return api.calculate(numeric(input, ["targetIncome", "monthlyCosts", "sessionsPerWeek", "weeksPerMonth", "lessonMinutes", "groupSize", "prepMinutes", "adminMinutes", "travelMinutes", "sessionCost", "taxReserve", "riskReserve", "packageSessions", "packageDiscount", "proposedPrice"]));
    }
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.swEducationParity = {
    runOwner(recipe, input, globalPath) {
      if (!runners[recipe]) throw new Error("Mapishi ya programu hayapatikani.");
      return runners[recipe](Object.assign({}, input), engine(globalPath));
    },
    currentResult() {
      return current ? JSON.parse(safeJson(current)) : null;
    }
  };

  function valid(result) {
    if (!result) return false;
    if (result.ok === false || result.valid === false || result.complete === false) return false;
    if (result.error || (Array.isArray(result.errors) && result.errors.length)) return false;
    return true;
  }

  function display(value) {
    if (value === true) return "Ndiyo";
    if (value === false) return "Hapana";
    if (value === null || value === undefined || value === "") return "Haipatikani";
    if (typeof value === "number") return new Intl.NumberFormat("sw-KE", { maximumFractionDigits: 2 }).format(value);
    if (Array.isArray(value)) return value.length ? value.map(display).join(" · ") : "0";
    if (/^-?\d+\.\d+%?$/.test(String(value))) return String(value).replace(".", ",");
    const translations = {
      "Bachelor's minimum": "Kiwango cha chini cha shahada",
      "Timed practice": "Mazoezi yenye muda",
      upcoming: "Inakuja",
      met: "Imetimizwa",
      one: "Suluhisho moja",
      decimal: "Desimali",
      DEG: "Digrii",
      stretch: "Bajeti imebanwa",
      "within-half-band": "Ndani ya alama 0.5",
      "admission or further study": "Kujiunga au kuendelea na masomo",
      "The receiving education institution, with SAQA evaluation where required": "Taasisi inayopokea, pamoja na tathmini ya SAQA inapohitajika",
      "Area per learner": "Eneo kwa mwanafunzi",
      below: "Chini ya kiwango",
      "APA 7 draft. The engine preserves the capitalisation you enter; apply APA sentence case and source-specific exceptions before submitting.": "Rasimu ya APA 7. Injini huhifadhi herufi ulizoingiza; hakiki kanuni za APA na masharti ya chanzo kabla ya kuwasilisha."
    };
    const raw = String(value);
    if (/^JAMB et /.test(raw)) return "JAMB na taasisi unayolenga";
    if (/^KUCCPS et /.test(raw)) return "KUCCPS na taasisi unayolenga";
    if (/ZIMCHE/.test(raw)) return "Chuo unacholenga na ZIMCHE";
    if (/GTEC/.test(raw)) return "Taasisi unayolenga na GTEC";
    if (/NBT/.test(raw)) return "Chuo unacholenga na NBT inapohitajika";
    return translations[raw] || raw;
  }

  function render(result) {
    metricsNode.replaceChildren();
    config.metrics.forEach(([path, label]) => {
      const card = document.createElement("div");
      card.className = "metric";
      const name = document.createElement("span");
      name.textContent = label;
      const value = document.createElement("strong");
      value.textContent = display(pathValue(result, path));
      card.append(name, value);
      metricsNode.appendChild(card);
    });
    resultPanel.classList.add("show");
    statusNode.className = "status";
    statusNode.textContent = "Hali imekokotolewa ndani ya kivinjari. Hakiki makadirio na chanzo rasmi kabla ya kuchukua hatua.";
  }

  async function run() {
    const input = values();
    try {
      const emptyRequired = Array.from(form.querySelectorAll("[required]")).some((field) => String(field.value || "").trim() === "");
      if (emptyRequired) throw new Error("required");
      const output = await runners[config.recipe](input, engine(config.global));
      if (!valid(output)) throw new Error("invalid");
      current = { schemaVersion: 1, locale: "sw", toolId: config.id, title: config.title, checkedAt: new Date().toISOString(), inputs: input, result: output, boundary: "Kwa mipango ya ndani ya kivinjari pekee; si uamuzi rasmi." };
      render(output);
    } catch (_) {
      current = null;
      resultPanel.classList.remove("show");
      statusNode.className = "status error";
      statusNode.textContent = "Hakiki sehemu, mipaka na tarehe ulizoingiza. Hakuna matokeo yaliyokubaliwa.";
    }
  }

  function textReport() {
    const lines = [current.title, "", "Matokeo ya ndani ya kivinjari"];
    config.metrics.forEach(([path, label]) => lines.push(`${label}: ${display(pathValue(current.result, path))}`));
    lines.push("", current.boundary);
    return lines.join("\n");
  }

  function csvReport() {
    const quote = (value) => `"${String(value).replace(/"/g, '""')}"`;
    return ["Sehemu,Thamani"].concat(config.metrics.map(([path, label]) => `${quote(label)},${quote(display(pathValue(current.result, path)))}`)).join("\n");
  }

  function download(content, type, extension) {
    const link = document.createElement("a");
    const url = URL.createObjectURL(new Blob([content], { type }));
    link.href = url;
    link.download = `${config.id}-sw.${extension}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function safeJson(value) {
    return JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2);
  }

  async function pdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/assets/vendor/jspdf/jspdf.umd.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    const doc = new window.jspdf.jsPDF();
    const lines = doc.splitTextToSize(textReport(), 175);
    doc.text(lines, 18, 20);
    doc.save(`${config.id}-sw.pdf`);
  }

  form.addEventListener("submit", (event) => { event.preventDefault(); void run(); });
  form.addEventListener("reset", () => {
    setTimeout(() => {
      current = null;
      resultPanel.classList.remove("show");
      statusNode.textContent = "";
    }, 0);
  });
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!current) return;
      const action = button.dataset.action;
      try {
        if (action === "copy") await navigator.clipboard.writeText(textReport());
        if (action === "json") download(`${safeJson(current)}\n`, "application/json", "json");
        if (action === "csv") download(`${csvReport()}\n`, "text/csv;charset=utf-8", "csv");
        if (action === "txt") download(`${textReport()}\n`, "text/plain;charset=utf-8", "txt");
        if (action === "pdf") await pdf();
        if (action === "save") localStorage.setItem(`afrotools:sw-education:${config.id}`, safeJson(current));
        if (action === "print") window.print();
        statusNode.textContent = action === "save" ? "Matokeo yamehifadhiwa kwenye kifaa hiki pekee." : "Hatua imekamilika ndani ya kivinjari.";
      } catch (_) {
        statusNode.className = "status error";
        statusNode.textContent = "Hatua hii ya ndani haipatikani kwenye kivinjari hiki.";
      }
    });
  });
  body.dataset.educationParityReady = "true";
})();
