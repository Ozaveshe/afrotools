(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.swHrPayrollSix = api;
  }
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var DAY_MS = 86400000;

  function number(value) {
    if (value === "" || value === null || typeof value === "undefined") return NaN;
    return Number(value);
  }

  function nonNegative(value, label, errors, optional) {
    if (optional && (value === "" || value === null || typeof value === "undefined")) return 0;
    var parsed = number(value);
    if (!Number.isFinite(parsed) || parsed < 0) errors.push(label + " lazima iwe namba isiyopungua sifuri.");
    return parsed;
  }

  function positive(value, label, errors) {
    var parsed = number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) errors.push(label + " lazima iwe kubwa kuliko sifuri.");
    return parsed;
  }

  function integer(value, label, min, max, errors) {
    var parsed = number(value);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
      errors.push(label + " lazima iwe namba kamili kati ya " + min + " na " + max + ".");
    }
    return parsed;
  }

  function choice(value, label, allowed, errors) {
    var parsed = String(value || "");
    if (!allowed.includes(parsed)) errors.push("Chagua " + label + ".");
    return parsed;
  }

  function evidence(input, errors) {
    var jurisdiction = String(input.jurisdiction || "").trim();
    var currency = String(input.currency || "").trim();
    var sourceLabel = String(input.sourceLabel || "").trim();
    var sourceDate = String(input.sourceDate || "").trim();
    if (!jurisdiction) errors.push("Andika nchi au mamlaka inayotumika.");
    if (!currency) errors.push("Andika msimbo au alama ya sarafu.");
    if (!sourceLabel) errors.push("Andika chanzo rasmi au cha kitaalamu ulichokagua.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sourceDate)) {
      errors.push("Andika tarehe halali ya chanzo.");
    } else {
      var parsed = new Date(sourceDate + "T00:00:00Z");
      var today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      if (parsed.getTime() > today.getTime()) errors.push("Tarehe ya chanzo haiwezi kuwa ya baadaye.");
    }
    return { jurisdiction: jurisdiction, currency: currency, sourceLabel: sourceLabel, sourceDate: sourceDate };
  }

  function freshness(sourceDate, now) {
    var date = new Date(String(sourceDate || "") + "T00:00:00Z");
    var reference = now ? new Date(now) : new Date();
    reference.setUTCHours(0, 0, 0, 0);
    var ageDays = Math.max(0, Math.floor((reference.getTime() - date.getTime()) / DAY_MS));
    if (ageDays <= 30) return { ageDays: ageDays, state: "fresh", label: "Chanzo cha karibuni", confidence: "Wastani — chanzo kina tarehe lakini AfroTools haijakithibitisha." };
    if (ageDays <= 90) return { ageDays: ageDays, state: "review", label: "Chanzo kinahitaji kukaguliwa", confidence: "Mdogo — hakikisha kanuni kabla ya kufanya uamuzi." };
    return { ageDays: ageDays, state: "stale", label: "Chanzo kimepitwa na wakati", confidence: "Chini — tafuta chanzo kipya zaidi." };
  }

  function finish(toolId, input, errors, ev, values, rows, workflow) {
    if (errors.length) return { valid: false, toolId: toolId, errors: errors };
    return { valid: true, toolId: toolId, input: Object.assign({}, input), evidence: Object.assign({}, ev, freshness(ev.sourceDate)), values: values, rows: rows, workflow: workflow || null };
  }

  function contractor(input) {
    var errors = [], ev = evidence(input, errors);
    var employeeBase = positive(input.employeeBase, "Mshahara wa msingi wa mwezi", errors);
    var employeeAddons = nonNegative(input.employeeAddons, "Michango na marupurupu ya mwajiri", errors, true);
    var employeeOther = nonNegative(input.employeeOther, "Gharama nyingine za mfanyakazi", errors, true);
    var contractorQuote = positive(input.contractorQuote, "Ada ya mwezi ya mkandarasi", errors);
    var contractorOther = nonNegative(input.contractorOther, "Gharama nyingine za mkandarasi", errors, true);
    var employeeMonthly = employeeBase + employeeAddons + employeeOther;
    var contractorMonthly = contractorQuote + contractorOther;
    return finish("contractor-vs-employee", input, errors, ev, {
      employeeMonthly: employeeMonthly, contractorMonthly: contractorMonthly,
      employeeAnnual: employeeMonthly * 12, contractorAnnual: contractorMonthly * 12,
      difference: contractorMonthly - employeeMonthly
    }, [
      ["Gharama ya mfanyakazi kwa mwezi", employeeMonthly],
      ["Gharama ya mkandarasi kwa mwezi", contractorMonthly],
      ["Gharama ya mfanyakazi kwa mwaka", employeeMonthly * 12],
      ["Gharama ya mkandarasi kwa mwaka", contractorMonthly * 12],
      ["Tofauti ya mwezi (mkandarasi − mfanyakazi)", contractorMonthly - employeeMonthly]
    ]);
  }

  function domestic(input) {
    var errors = [], ev = evidence(input, errors);
    var country = choice(input.country, "nchi ya mpango wa ajira", ["nigeria", "kenya", "south-africa", "ghana", "egypt", "ethiopia", "tanzania", "uganda", "rwanda", "cote-divoire", "cameroon", "senegal", "morocco", "tunisia", "angola"], errors);
    var role = choice(input.role, "aina ya kazi", ["live-out-housekeeper", "live-in-helper", "nanny", "elder-care", "cook", "gardener"], errors);
    var basePay = positive(input.basePay, "Malipo yaliyokubaliwa", errors);
    var hoursPerWeek = positive(input.hoursPerWeek, "Saa za kazi kwa wiki", errors);
    if (hoursPerWeek > 84) errors.push("Saa za kazi kwa wiki haziwezi kuzidi 84.");
    var daysPerWeek = positive(input.daysPerWeek, "Siku za kazi kwa wiki", errors);
    if (daysPerWeek > 7) errors.push("Siku za kazi kwa wiki haziwezi kuzidi 7.");
    var payPeriod = choice(input.payPeriod, "kipindi cha malipo", ["hourly", "daily", "weekly", "monthly"], errors);
    var legalFloor = nonNegative(input.legalFloor, "Kiwango cha chini ulichothibitisha", errors, true);
    var floorPeriod = choice(input.floorPeriod, "kipindi cha kiwango cha chini", ["hourly", "daily", "weekly", "monthly"], errors);
    function monthlyEquivalent(amount, period) {
      if (period === "hourly") return amount * hoursPerWeek * (52 / 12);
      if (period === "daily") return amount * daysPerWeek * (52 / 12);
      if (period === "weekly") return amount * (52 / 12);
      return amount;
    }
    var baseMonthly = monthlyEquivalent(basePay, payPeriod);
    var floorMonthly = monthlyEquivalent(legalFloor, floorPeriod);
    var overtimeHours = nonNegative(input.overtimeHours, "Saa za ziada kwa mwezi", errors, true);
    if (overtimeHours > 160) errors.push("Saa za ziada kwa mwezi haziwezi kuzidi 160.");
    var overtimeMultiplier = number(input.overtimeMultiplier || 1);
    if (overtimeHours > 0 && (!Number.isFinite(overtimeMultiplier) || overtimeMultiplier < 1 || overtimeMultiplier > 3)) errors.push("Kizidishi cha muda wa ziada lazima kiwe kati ya 1 na 3.");
    var allowances = nonNegative(input.allowances, "Posho za fedha", errors, true);
    var inKind = nonNegative(input.inKind, "Marupurupu yasiyo ya fedha", errors, true);
    var employerPct = nonNegative(input.employerPct, "Asilimia ya mchango wa mwajiri", errors, true);
    if (employerPct > 40) errors.push("Asilimia ya mchango wa mwajiri haiwezi kuzidi 40%.");
    var leavePct = nonNegative(input.leavePct, "Asilimia ya akiba ya likizo", errors, true);
    if (leavePct > 30) errors.push("Asilimia ya akiba ya likizo haiwezi kuzidi 30%.");
    var adminCost = nonNegative(input.adminCost, "Gharama za usimamizi kwa mwezi", errors, true);
    var annualBonus = nonNegative(input.annualBonus, "Bonasi ya mwaka", errors, true);
    var setupCost = nonNegative(input.setupCost, "Gharama za kuanza", errors, true);
    var retentionBuffer = nonNegative(input.retentionBuffer, "Akiba ya kubakiza mfanyakazi", errors, true);
    if (retentionBuffer > 50) errors.push("Akiba ya kubakiza mfanyakazi haiwezi kuzidi 50%.");
    var contractStatus = choice(input.contractStatus, "hali ya mkataba wa maandishi", ["no", "draft", "yes"], errors);
    var payRecord = choice(input.payRecord, "hali ya rekodi ya malipo", ["no", "partial", "yes"], errors);
    var restDays = choice(input.restDays, "hali ya mapumziko", ["no", "partial", "yes"], errors);
    var regularMonthlyHours = hoursPerWeek * (52 / 12);
    var effectiveHourly = baseMonthly / regularMonthlyHours;
    var overtimePay = overtimeHours * effectiveHourly * Math.max(1, overtimeMultiplier || 1);
    var contributionBase = baseMonthly + overtimePay + allowances;
    var employerContribution = contributionBase * (employerPct / 100);
    var leaveReserve = contributionBase * (leavePct / 100);
    var monthlyCost = baseMonthly + overtimePay + allowances + inKind + employerContribution + leaveReserve + adminCost + annualBonus / 12 + setupCost / 12;
    var floorGap = baseMonthly - floorMonthly;
    var readiness = 30 + (floorGap >= 0 ? 22 : 0) + (contractStatus === "yes" ? 14 : contractStatus === "draft" ? 7 : 0) + (payRecord === "yes" ? 12 : payRecord === "partial" ? 5 : 0) + (restDays === "yes" ? 10 : restDays === "partial" ? 4 : 0) + (input.sourceDate ? 8 : 0) + (hoursPerWeek <= 52 ? 4 : 0);
    readiness = Math.max(0, Math.min(100, Math.round(readiness)));
    var checklist = [floorGap < 0 ? "Ongeza malipo ya msingi au kagua saa kabla ya kutegemea mpango huu." : "Hifadhi nakala ya chanzo cha kiwango cha chini kilichotumika."];
    if (contractStatus !== "yes") checklist.push("Andaa au kagua mkataba wa maandishi unaoeleza kazi, saa, likizo, mapumziko, siku ya malipo na notisi.");
    if (payRecord !== "yes") checklist.push("Weka payslip au risiti ya malipo ya kila mwezi.");
    if (restDays !== "yes") checklist.push("Andika siku za mapumziko, sikukuu na idhini ya muda wa ziada.");
    if (hoursPerWeek > 52) checklist.push("Thibitisha iwapo saa za wiki zinazidi kikomo cha eneo lako.");
    checklist.push("Thibitisha usajili, hifadhi ya jamii, pensheni, kodi na bima zinazoweza kuhitajika.");
    var countryLabels = { nigeria: "Nigeria", kenya: "Kenya", "south-africa": "Afrika Kusini", ghana: "Ghana", egypt: "Misri", ethiopia: "Ethiopia", tanzania: "Tanzania", uganda: "Uganda", rwanda: "Rwanda", "cote-divoire": "Côte d’Ivoire", cameroon: "Kameruni", senegal: "Senegali", morocco: "Moroko", tunisia: "Tunisia", angola: "Angola" };
    var roleLabels = { "live-out-housekeeper": "Mfanyakazi wa usafi asiyeishi nyumbani", "live-in-helper": "Msaidizi anayeishi nyumbani", nanny: "Mlezi wa watoto", "elder-care": "Mlezi wa mzee", cook: "Mpishi", gardener: "Mtunza bustani" };
    return finish("domestic-worker", input, errors, ev, {
      baseMonthly: baseMonthly, floorMonthly: floorMonthly, effectiveHourly: effectiveHourly, overtimePay: overtimePay,
      employerContribution: employerContribution, leaveReserve: leaveReserve,
      monthlyCost: monthlyCost, annualCost: monthlyCost * 12, floorGap: floorGap,
      readiness: readiness, retentionMonthly: monthlyCost * (1 + retentionBuffer / 100)
    }, [
      ["Malipo sawa ya mwezi", baseMonthly], ["Kiwango cha chini sawa cha mwezi", floorMonthly],
      ["Malipo halisi kwa saa", effectiveHourly],
      ["Malipo ya muda wa ziada", overtimePay], ["Michango ya mwajiri", employerContribution],
      ["Akiba ya likizo", leaveReserve], ["Gharama ya mwajiri kwa mwezi", monthlyCost],
      ["Gharama ya mwajiri kwa mwaka", monthlyCost * 12], ["Tofauti na kiwango cha chini", floorGap],
      ["Alama ya maandalizi", readiness, "score"]
    ], { details: [["Nchi", countryLabels[country]], ["Kazi", roleLabels[role]], ["Mkataba wa maandishi", contractStatus], ["Payslip au risiti", payRecord], ["Mapumziko na sikukuu", restDays], ["Maelezo", String(input.notes || "").trim() || "Hakuna"]], scenarios: [["Mpango uliowekwa", monthlyCost, "money"], ["Mpango wenye akiba ya kubakiza mfanyakazi", monthlyCost * (1 + retentionBuffer / 100), "money"]], checklist: checklist.slice(0, 6) });
  }

  function employee(input) {
    var errors = [], ev = evidence(input, errors);
    var salary = positive(input.salary, "Mshahara wa mwezi", errors);
    var obligations = nonNegative(input.obligations, "Wajibu wa mwajiri", errors, true);
    var benefits = nonNegative(input.benefits, "Marupurupu", errors, true);
    var allowances = nonNegative(input.allowances, "Posho", errors, true);
    var other = nonNegative(input.other, "Gharama nyingine za kawaida", errors, true);
    var oneOff = nonNegative(input.oneOff, "Gharama za mara moja", errors, true);
    var allocationMonths = integer(input.allocationMonths, "Miezi ya kugawa gharama", 1, 60, errors);
    var recurring = salary + obligations + benefits + allowances + other;
    var planningMonthly = recurring + oneOff / allocationMonths;
    return finish("employee-cost", input, errors, ev, { recurring: recurring, planningMonthly: planningMonthly, firstYear: recurring * 12 + oneOff, loadPct: ((planningMonthly - salary) / salary) * 100 }, [["Gharama ya kawaida kwa mwezi", recurring], ["Gharama iliyopangwa kwa mwezi", planningMonthly], ["Gharama ya mwaka wa kwanza", recurring * 12 + oneOff], ["Ongezeko juu ya mshahara", ((planningMonthly - salary) / salary) * 100, "percent"]]);
  }

  function gratuity(input) {
    var errors = [], ev = evidence(input, errors);
    var monthlyPay = positive(input.monthlyPay, "Malipo rejea ya mwezi", errors);
    var years = integer(input.years, "Miaka ya huduma", 0, 80, errors);
    var months = integer(input.months, "Miezi ya ziada ya huduma", 0, 11, errors);
    var daysPerYear = positive(input.daysPerYear, "Siku za malipo kwa kila mwaka", errors);
    var divisor = positive(input.divisor, "Kigawanyo cha mwezi", errors);
    var additions = nonNegative(input.additions, "Nyongeza", errors, true);
    var deductions = nonNegative(input.deductions, "Makato", errors, true);
    var serviceYears = years + months / 12, dailyPay = monthlyPay / divisor;
    var core = dailyPay * daysPerYear * serviceYears, gross = core + additions;
    if (serviceYears <= 0) errors.push("Jumla ya muda wa huduma lazima izidi sifuri.");
    if (deductions > gross) errors.push("Makato hayawezi kuzidi jumla kabla ya makato.");
    return finish("gratuity-calculator", input, errors, ev, { serviceYears: serviceYears, dailyPay: dailyPay, core: core, gross: gross, net: gross - deductions }, [["Muda wa huduma uliokokotolewa", serviceYears, "years"], ["Malipo ya siku", dailyPay], ["Kiinua mgongo cha msingi", core], ["Jumla kabla ya makato", gross], ["Makadirio baada ya makato", gross - deductions]]);
  }

  function maternity(input) {
    var errors = [], ev = evidence(input, errors);
    var pattern = /^\/tools\/maternity-leave\/[a-z0-9-]+\/$/;
    if (!pattern.test(String(input.country || ""))) errors.push("Chagua nchi ya likizo.");
    if (!pattern.test(String(input.compareCountry || ""))) errors.push("Chagua nchi ya kulinganisha.");
    var leaveType = choice(input.leaveType, "aina ya likizo", ["maternity", "paternity", "both"], errors);
    var monthlySalary = positive(input.monthlySalary, "Mshahara wa mwezi", errors);
    var startDate = String(input.startDate || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) errors.push("Andika tarehe halali ya kuanza.");
    var officialDays = integer(input.officialDays, "Siku za rejea", 1, 365, errors);
    var requestedDays = integer(input.requestedDays, "Siku zilizoombwa", 1, 365, errors);
    var companyDays = integer(input.companyDays, "Siku za sera ya mwajiri", 0, 365, errors);
    var officialRate = nonNegative(input.officialRate, "Asilimia ya malipo ya rejea", errors);
    var companyRate = nonNegative(input.companyRate, "Asilimia ya malipo ya mwajiri", errors);
    if (officialRate > 100 || companyRate > 100) errors.push("Asilimia za malipo haziwezi kuzidi 100%.");
    var daily = monthlySalary / 30.4375;
    function endDate(days) { var date = new Date(startDate + "T00:00:00Z"); if (!Number.isFinite(date.getTime())) return ""; date.setUTCDate(date.getUTCDate() + Math.max(0, days - 1)); return date.toISOString().slice(0, 10); }
    var labels = { maternity: "Likizo ya uzazi ya aliyejifungua", paternity: "Likizo ya baba au mwenza", both: "Linganisha zote mbili" };
    return finish("maternity-leave", input, errors, ev, { dailyPay: daily, officialValue: daily * officialDays * officialRate / 100, requestedValue: daily * requestedDays * officialRate / 100, companyValue: daily * companyDays * companyRate / 100, officialEnd: endDate(officialDays), requestedEnd: endDate(requestedDays), companyEnd: companyDays ? endDate(companyDays) : "" }, [["Thamani kwa rejea uliyoingiza", daily * officialDays * officialRate / 100], ["Thamani kwa muda ulioombwa", daily * requestedDays * officialRate / 100], ["Thamani kwa sera ya mwajiri", daily * companyDays * companyRate / 100], ["Mwisho wa muda ulioombwa", endDate(requestedDays), "text"]], { details: [["Nchi", input.countryLabel || input.country], ["Aina ya likizo", labels[leaveType]], ["Nchi ya kulinganisha", input.compareCountryLabel || input.compareCountry], ["Muda ulioombwa", startDate + " hadi " + endDate(requestedDays)], ["Maelezo ya HR", String(input.leaveNotes || "").trim() || "Hakuna"]], scenarios: [["Rejea iliyothibitishwa", daily * officialDays * officialRate / 100, "money"], ["Ombi la mfanyakazi", daily * requestedDays * officialRate / 100, "money"], ["Sera ya mwajiri", daily * companyDays * companyRate / 100, "money"]], checklist: ["Thibitisha ustahiki, mlipaji na vikomo vinavyotumika.", "Thibitisha taratibu za hifadhi ya jamii, kodi na sera ya mwajiri.", "Tumia ulinganisho wa nchi kama muktadha tu, si kanuni inayotumika."] });
  }

  function retrenchment(input) {
    var errors = [], ev = evidence(input, errors);
    var monthlyPay = positive(input.monthlyPay, "Malipo rejea ya mwezi", errors);
    var years = integer(input.years, "Miaka ya huduma", 0, 80, errors);
    var months = integer(input.months, "Miezi ya ziada ya huduma", 0, 11, errors);
    var weeksPerYear = nonNegative(input.weeksPerYear, "Wiki za malipo kwa kila mwaka", errors);
    var noticeMonths = nonNegative(input.noticeMonths, "Miezi ya notisi", errors, true);
    var leaveDays = nonNegative(input.leaveDays, "Siku za likizo ambazo hazikutumika", errors, true);
    var divisor = positive(input.divisor, "Kigawanyo cha likizo", errors);
    var other = nonNegative(input.other, "Kiasi kingine", errors, true);
    var deductions = nonNegative(input.deductions, "Makato", errors, true);
    var serviceYears = years + months / 12;
    if (serviceYears <= 0) errors.push("Jumla ya muda wa huduma lazima izidi sifuri.");
    var weeklyPay = monthlyPay * 12 / 52;
    var severance = weeklyPay * weeksPerYear * serviceYears;
    var notice = monthlyPay * noticeMonths;
    var leave = monthlyPay / divisor * leaveDays;
    var gross = severance + notice + leave + other;
    if (deductions > gross) errors.push("Makato hayawezi kuzidi jumla kabla ya makato.");
    return finish("retrenchment-calculator", input, errors, ev, { serviceYears: serviceYears, weeklyPay: weeklyPay, severance: severance, notice: notice, leave: leave, gross: gross, net: gross - deductions }, [["Malipo ya muda wa huduma", severance], ["Malipo ya notisi", notice], ["Likizo ambayo haikutumika", leave], ["Jumla kabla ya makato", gross], ["Makadirio baada ya makato", gross - deductions]]);
  }

  var calculators = { "contractor-vs-employee": contractor, "domestic-worker": domestic, "employee-cost": employee, "gratuity-calculator": gratuity, "maternity-leave": maternity, "retrenchment-calculator": retrenchment };
  return { calculate: function (toolId, input) { return calculators[toolId] ? calculators[toolId](input || {}) : { valid: false, toolId: toolId, errors: ["Zana haijatambuliwa."] }; }, freshness: freshness, toolIds: Object.keys(calculators) };
});
