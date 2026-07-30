(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.frHrPayroll = api;
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
    if (!Number.isFinite(parsed) || parsed < 0) errors.push(label + " doit être un nombre positif ou nul.");
    return parsed;
  }

  function positive(value, label, errors) {
    var parsed = number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) errors.push(label + " doit être supérieur à zéro.");
    return parsed;
  }

  function integer(value, label, min, max, errors) {
    var parsed = number(value);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
      errors.push(label + " doit être un entier entre " + min + " et " + max + ".");
    }
    return parsed;
  }

  function choice(value, label, allowed, errors) {
    var parsed = String(value || "");
    if (!allowed.includes(parsed)) errors.push("Choisissez " + label + ".");
    return parsed;
  }

  function evidence(input, errors) {
    var jurisdiction = String(input.jurisdiction || "").trim();
    var currency = String(input.currency || "").trim();
    var sourceLabel = String(input.sourceLabel || "").trim();
    var sourceDate = String(input.sourceDate || "").trim();
    if (!jurisdiction) errors.push("Indiquez le pays ou la juridiction applicable.");
    if (!currency) errors.push("Indiquez le code ou symbole monétaire.");
    if (!sourceLabel) errors.push("Indiquez la source officielle ou professionnelle consultée.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sourceDate)) {
      errors.push("Indiquez une date de source valide.");
    } else {
      var parsed = new Date(sourceDate + "T00:00:00Z");
      var today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      if (parsed.getTime() > today.getTime()) errors.push("La date de source ne peut pas être future.");
    }
    return { jurisdiction: jurisdiction, currency: currency, sourceLabel: sourceLabel, sourceDate: sourceDate };
  }

  function freshness(sourceDate, now) {
    var date = new Date(String(sourceDate || "") + "T00:00:00Z");
    var reference = now ? new Date(now) : new Date();
    reference.setUTCHours(0, 0, 0, 0);
    var ageDays = Math.max(0, Math.floor((reference.getTime() - date.getTime()) / DAY_MS));
    if (ageDays <= 30) {
      return { ageDays: ageDays, state: "recente", label: "Source récente", confidence: "Moyenne — source datée, non vérifiée par AfroTools." };
    }
    if (ageDays <= 90) {
      return { ageDays: ageDays, state: "a_revoir", label: "Source à revoir", confidence: "Limitée — contrôlez la règle avant toute décision." };
    }
    return { ageDays: ageDays, state: "ancienne", label: "Source ancienne", confidence: "Faible — recherchez une source plus récente." };
  }

  function finish(toolId, input, errors, evidenceData, values, rows, workflow) {
    if (errors.length) return { valid: false, toolId: toolId, errors: errors };
    return {
      valid: true,
      toolId: toolId,
      input: Object.assign({}, input),
      evidence: Object.assign({}, evidenceData, freshness(evidenceData.sourceDate)),
      values: values,
      rows: rows,
      workflow: workflow || null
    };
  }

  function contractor(input) {
    var errors = [], ev = evidence(input, errors);
    var employeeBase = positive(input.employeeBase, "Le salaire mensuel de base", errors);
    var employeeAddons = nonNegative(input.employeeAddons, "Les cotisations et avantages employeur", errors, true);
    var employeeOther = nonNegative(input.employeeOther, "Les autres coûts salariés", errors, true);
    var contractorQuote = positive(input.contractorQuote, "Le montant mensuel du prestataire", errors);
    var contractorOther = nonNegative(input.contractorOther, "Les autres coûts du prestataire", errors, true);
    var employeeMonthly = employeeBase + employeeAddons + employeeOther;
    var contractorMonthly = contractorQuote + contractorOther;
    return finish("contractor-vs-employee", input, errors, ev, {
      employeeMonthly: employeeMonthly,
      contractorMonthly: contractorMonthly,
      employeeAnnual: employeeMonthly * 12,
      contractorAnnual: contractorMonthly * 12,
      difference: contractorMonthly - employeeMonthly
    }, [
      ["Coût salarié mensuel", employeeMonthly],
      ["Coût prestataire mensuel", contractorMonthly],
      ["Coût salarié annuel", employeeMonthly * 12],
      ["Coût prestataire annuel", contractorMonthly * 12],
      ["Écart mensuel (prestataire − salarié)", contractorMonthly - employeeMonthly]
    ]);
  }

  function domestic(input) {
    var errors = [], ev = evidence(input, errors);
    var country = choice(input.country, "un pays du plan d'emploi", [
      "nigeria", "kenya", "south-africa", "ghana", "egypt", "ethiopia", "tanzania", "uganda",
      "rwanda", "cote-divoire", "cameroon", "senegal", "morocco", "tunisia", "angola"
    ], errors);
    var role = choice(input.role, "un rôle", [
      "live-out-housekeeper", "live-in-helper", "nanny", "elder-care", "cook", "gardener"
    ], errors);
    var basePay = positive(input.basePay, "La rémunération convenue", errors);
    var hoursPerWeek = positive(input.hoursPerWeek, "Les heures par semaine", errors);
    if (hoursPerWeek > 84) errors.push("Les heures par semaine ne peuvent pas dépasser 84.");
    var daysPerWeek = positive(input.daysPerWeek, "Les jours par semaine", errors);
    if (daysPerWeek > 7) errors.push("Les jours par semaine ne peuvent pas dépasser 7.");
    var payPeriod = choice(input.payPeriod, "une périodicité de rémunération", ["hourly", "daily", "weekly", "monthly"], errors);
    var legalFloor = nonNegative(input.legalFloor, "Le plancher de rémunération vérifié", errors, true);
    var floorPeriod = choice(input.floorPeriod, "une périodicité du plancher", ["hourly", "daily", "weekly", "monthly"], errors);
    function monthlyEquivalent(amount, period) {
      if (period === "hourly") return amount * hoursPerWeek * (52 / 12);
      if (period === "daily") return amount * daysPerWeek * (52 / 12);
      if (period === "weekly") return amount * (52 / 12);
      return amount;
    }
    var baseMonthly = monthlyEquivalent(basePay, payPeriod);
    var floorMonthly = monthlyEquivalent(legalFloor, floorPeriod);
    var overtimeHours = nonNegative(input.overtimeHours, "Les heures supplémentaires mensuelles", errors, true);
    if (overtimeHours > 160) errors.push("Les heures supplémentaires mensuelles ne peuvent pas dépasser 160.");
    var overtimeMultiplier = number(input.overtimeMultiplier || 1);
    if (overtimeHours > 0 && (!Number.isFinite(overtimeMultiplier) || overtimeMultiplier < 1 || overtimeMultiplier > 3)) {
      errors.push("Le coefficient d'heures supplémentaires doit être compris entre 1 et 3.");
    }
    var allowances = nonNegative(input.allowances, "Les indemnités en espèces", errors, true);
    var inKind = nonNegative(input.inKind, "Les avantages en nature", errors, true);
    var employerPct = nonNegative(input.employerPct, "Le taux de cotisation employeur", errors, true);
    if (employerPct > 40) errors.push("Le taux de cotisation employeur ne peut pas dépasser 40 %.");
    var leavePct = nonNegative(input.leavePct, "Le taux de provision congés", errors, true);
    if (leavePct > 30) errors.push("Le taux de provision congés ne peut pas dépasser 30 %.");
    var adminCost = nonNegative(input.adminCost, "Les coûts administratifs mensuels", errors, true);
    var annualBonus = nonNegative(input.annualBonus, "La prime annuelle", errors, true);
    var setupCost = nonNegative(input.setupCost, "Les coûts initiaux", errors, true);
    var retentionBuffer = nonNegative(input.retentionBuffer, "La marge de fidélisation", errors, true);
    if (retentionBuffer > 50) errors.push("La marge de fidélisation ne peut pas dépasser 50 %.");
    var contractStatus = choice(input.contractStatus, "l'état du contrat écrit", ["no", "draft", "yes"], errors);
    var payRecord = choice(input.payRecord, "l'état du processus de paiement", ["no", "partial", "yes"], errors);
    var restDays = choice(input.restDays, "l'état du plan de repos", ["no", "partial", "yes"], errors);
    var notes = String(input.notes || "").trim();
    var regularMonthlyHours = hoursPerWeek * (52 / 12);
    var effectiveHourly = baseMonthly / regularMonthlyHours;
    var overtimePay = overtimeHours * effectiveHourly * Math.max(1, overtimeMultiplier || 1);
    var contributionBase = baseMonthly + overtimePay + allowances;
    var employerContribution = contributionBase * (employerPct / 100);
    var leaveReserve = contributionBase * (leavePct / 100);
    var monthlyCost = baseMonthly + overtimePay + allowances + inKind + employerContribution + leaveReserve + adminCost + annualBonus / 12 + setupCost / 12;
    var floorGap = baseMonthly - floorMonthly;
    var readiness = 30;
    if (floorGap >= 0) readiness += 22;
    if (contractStatus === "yes") readiness += 14;
    if (payRecord === "yes") readiness += 12;
    if (restDays === "yes") readiness += 10;
    if (input.sourceDate) readiness += 8;
    if (hoursPerWeek <= 52) readiness += 4;
    if (contractStatus === "draft") readiness += 7;
    if (payRecord === "partial") readiness += 5;
    if (restDays === "partial") readiness += 4;
    readiness = Math.max(0, Math.min(100, Math.round(readiness)));
    var checklist = [];
    checklist.push(floorGap < 0
      ? "Augmenter la rémunération de base en espèces ou revoir les heures avant de s'appuyer sur ce plan."
      : "Conserver une copie de la source du plancher utilisée pour ce calcul.");
    if (contractStatus !== "yes") checklist.push("Préparer ou vérifier un contrat écrit couvrant tâches, horaires, congés, repos, date de paie et préavis.");
    if (payRecord !== "yes") checklist.push("Mettre en place un bulletin mensuel ou un reçu de paiement signé.");
    if (restDays !== "yes") checklist.push("Documenter les jours de repos, les jours fériés et l'autorisation des heures supplémentaires.");
    if (hoursPerWeek > 52) checklist.push("Vérifier si les heures hebdomadaires dépassent une limite locale ou exigent un autre dispositif.");
    checklist.push("Confirmer les obligations éventuelles d'enregistrement, de protection sociale, de retraite, d'impôt ou d'assurance.");
    var countryLabels = {
      nigeria: "Nigeria", kenya: "Kenya", "south-africa": "Afrique du Sud", ghana: "Ghana", egypt: "Égypte",
      ethiopia: "Éthiopie", tanzania: "Tanzanie", uganda: "Ouganda", rwanda: "Rwanda",
      "cote-divoire": "Côte d'Ivoire", cameroon: "Cameroun", senegal: "Sénégal", morocco: "Maroc",
      tunisia: "Tunisie", angola: "Angola"
    };
    var roleLabels = {
      "live-out-housekeeper": "Aide ménagère non logée", "live-in-helper": "Employé·e de maison logé·e",
      nanny: "Garde d'enfants", "elder-care": "Aide à une personne âgée", cook: "Cuisinier·ère",
      gardener: "Jardinier·ère"
    };
    return finish("domestic-worker", input, errors, ev, {
      baseMonthly: baseMonthly,
      floorMonthly: floorMonthly,
      overtimePay: overtimePay,
      employerContribution: employerContribution,
      leaveReserve: leaveReserve,
      monthlyCost: monthlyCost,
      annualCost: monthlyCost * 12,
      floorGap: floorGap,
      readiness: readiness,
      retentionMonthly: monthlyCost * (1 + retentionBuffer / 100)
    }, [
      ["Rémunération mensuelle équivalente", baseMonthly],
      ["Plancher mensuel équivalent saisi", floorMonthly],
      ["Heures supplémentaires", overtimePay],
      ["Cotisations employeur", employerContribution],
      ["Provision congés", leaveReserve],
      ["Coût employeur mensuel", monthlyCost],
      ["Coût employeur annuel", monthlyCost * 12],
      ["Écart au plancher saisi", floorGap],
      ["Score de préparation", readiness, "score"]
    ], {
      details: [
        ["Pays", countryLabels[country]],
        ["Rôle", roleLabels[role]],
        ["Contrat écrit", contractStatus],
        ["Bulletin ou reçu", payRecord],
        ["Repos et jours fériés", restDays],
        ["Notes", notes || "Aucune"]
      ],
      scenarios: [
        ["Plan saisi", monthlyCost, "money"],
        ["Plan avec marge de fidélisation", monthlyCost * (1 + retentionBuffer / 100), "money"]
      ],
      checklist: checklist.slice(0, 6)
    });
  }

  function employee(input) {
    var errors = [], ev = evidence(input, errors);
    var salary = positive(input.salary, "Le salaire mensuel", errors);
    var obligations = nonNegative(input.obligations, "Les obligations employeur", errors, true);
    var benefits = nonNegative(input.benefits, "Les avantages", errors, true);
    var allowances = nonNegative(input.allowances, "Les indemnités", errors, true);
    var other = nonNegative(input.other, "Les autres coûts récurrents", errors, true);
    var oneOff = nonNegative(input.oneOff, "Les coûts ponctuels", errors, true);
    var allocationMonths = integer(input.allocationMonths, "La période d'étalement", 1, 60, errors);
    var recurring = salary + obligations + benefits + allowances + other;
    var planningMonthly = recurring + oneOff / allocationMonths;
    return finish("employee-cost", input, errors, ev, {
      recurring: recurring,
      planningMonthly: planningMonthly,
      firstYear: recurring * 12 + oneOff,
      loadPct: ((planningMonthly - salary) / salary) * 100
    }, [
      ["Coût mensuel récurrent", recurring],
      ["Coût mensuel planifié", planningMonthly],
      ["Coût de première année", recurring * 12 + oneOff],
      ["Charge au-dessus du salaire", ((planningMonthly - salary) / salary) * 100, "percent"]
    ]);
  }

  function gratuity(input) {
    var errors = [], ev = evidence(input, errors);
    var monthlyPay = positive(input.monthlyPay, "La rémunération mensuelle", errors);
    var years = integer(input.years, "Les années de service", 0, 80, errors);
    var months = integer(input.months, "Les mois de service", 0, 11, errors);
    var daysPerYear = positive(input.daysPerYear, "Les jours de salaire par année", errors);
    var divisor = positive(input.divisor, "Le diviseur mensuel", errors);
    var additions = nonNegative(input.additions, "Les compléments", errors, true);
    var deductions = nonNegative(input.deductions, "Les déductions", errors, true);
    var serviceYears = years + months / 12;
    if (serviceYears <= 0) errors.push("L'ancienneté totale doit être supérieure à zéro.");
    var dailyPay = monthlyPay / divisor;
    var core = dailyPay * daysPerYear * serviceYears;
    var gross = core + additions;
    if (deductions > gross) errors.push("Les déductions ne peuvent pas dépasser le montant brut.");
    return finish("gratuity-calculator", input, errors, ev, {
      serviceYears: serviceYears, dailyPay: dailyPay, core: core, gross: gross, net: gross - deductions
    }, [
      ["Ancienneté calculée", serviceYears, "years"],
      ["Indemnité de base", core],
      ["Montant brut", gross],
      ["Montant net estimé", gross - deductions]
    ]);
  }

  function maternity(input) {
    var errors = [], ev = evidence(input, errors);
    var country = String(input.country || "").trim();
    var compareCountry = String(input.compareCountry || "").trim();
    var countryValuePattern = /^\/tools\/maternity-leave\/[a-z0-9-]+\/$/;
    if (!countryValuePattern.test(country)) errors.push("Choisissez le pays du congé.");
    if (!countryValuePattern.test(compareCountry)) errors.push("Choisissez le pays de comparaison.");
    var countryLabel = String(input.countryLabel || country).trim();
    var compareCountryLabel = String(input.compareCountryLabel || compareCountry).trim();
    var leaveType = choice(input.leaveType, "un type de congé", ["maternity", "paternity", "both"], errors);
    var leaveNotes = String(input.leaveNotes || "").trim();
    var monthlySalary = positive(input.monthlySalary, "Le salaire mensuel", errors);
    var startDate = String(input.startDate || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) errors.push("Indiquez une date de début valide.");
    var officialDays = integer(input.officialDays, "La durée de référence", 1, 365, errors);
    var requestedDays = integer(input.requestedDays, "La durée demandée", 1, 365, errors);
    var companyDays = integer(input.companyDays, "La durée employeur", 0, 365, errors);
    var officialRate = nonNegative(input.officialRate, "Le taux de remplacement de référence", errors);
    var companyRate = nonNegative(input.companyRate, "Le taux employeur", errors);
    if (officialRate > 100 || companyRate > 100) errors.push("Les taux de remplacement ne peuvent pas dépasser 100 %.");
    var daily = monthlySalary / 30.4375;
    function endDate(days) {
      var date = new Date(startDate + "T00:00:00Z");
      if (!Number.isFinite(date.getTime())) return "";
      date.setUTCDate(date.getUTCDate() + Math.max(0, days - 1));
      return date.toISOString().slice(0, 10);
    }
    var leaveTypeLabels = {
      maternity: "Maternité ou parent ayant accouché",
      paternity: "Paternité ou congé du partenaire",
      both: "Comparer les deux"
    };
    return finish("maternity-leave", input, errors, ev, {
      dailyPay: daily,
      officialValue: daily * officialDays * officialRate / 100,
      requestedValue: daily * requestedDays * officialRate / 100,
      companyValue: daily * companyDays * companyRate / 100,
      officialEnd: endDate(officialDays),
      requestedEnd: endDate(requestedDays),
      companyEnd: companyDays ? endDate(companyDays) : ""
    }, [
      ["Valeur selon la référence saisie", daily * officialDays * officialRate / 100],
      ["Valeur pour la durée demandée", daily * requestedDays * officialRate / 100],
      ["Valeur selon la politique employeur", daily * companyDays * companyRate / 100],
      ["Fin de la durée demandée", endDate(requestedDays), "text"]
    ], {
      details: [
        ["Pays", countryLabel],
        ["Type de congé", leaveTypeLabels[leaveType]],
        ["Pays de comparaison", compareCountryLabel],
        ["Période demandée", startDate + " au " + endDate(requestedDays)],
        ["Hypothèses et notes RH", leaveNotes || "Aucune"]
      ],
      scenarios: [
        ["Référence vérifiée", daily * officialDays * officialRate / 100, "money"],
        ["Demande de la personne salariée", daily * requestedDays * officialRate / 100, "money"],
        ["Politique employeur", daily * companyDays * companyRate / 100, "money"]
      ],
      checklist: [
        "Vérifier l'éligibilité, la personne qui paie et les plafonds applicables.",
        "Confirmer les démarches d'assurance sociale, la fiscalité et la politique employeur.",
        "Comparer les pays uniquement comme contexte, jamais comme règle applicable."
      ]
    });
  }

  function retrenchment(input) {
    var errors = [], ev = evidence(input, errors);
    var monthlyPay = positive(input.monthlyPay, "La rémunération mensuelle", errors);
    var years = integer(input.years, "Les années de service", 0, 80, errors);
    var months = integer(input.months, "Les mois de service", 0, 11, errors);
    var weeksPerYear = nonNegative(input.weeksPerYear, "Les semaines par année de service", errors);
    var noticeMonths = nonNegative(input.noticeMonths, "Les mois de préavis", errors, true);
    var leaveDays = nonNegative(input.leaveDays, "Les jours de congé non pris", errors, true);
    var divisor = positive(input.divisor, "Le diviseur de congé", errors);
    var other = nonNegative(input.other, "Les autres montants", errors, true);
    var deductions = nonNegative(input.deductions, "Les déductions", errors, true);
    var serviceYears = years + months / 12;
    if (serviceYears <= 0) errors.push("L'ancienneté totale doit être supérieure à zéro.");
    var weeklyPay = monthlyPay * 12 / 52;
    var severance = weeklyPay * weeksPerYear * serviceYears;
    var notice = monthlyPay * noticeMonths;
    var leave = monthlyPay / divisor * leaveDays;
    var gross = severance + notice + leave + other;
    if (deductions > gross) errors.push("Les déductions ne peuvent pas dépasser le montant brut.");
    return finish("retrenchment-calculator", input, errors, ev, {
      serviceYears: serviceYears, weeklyPay: weeklyPay, severance: severance, notice: notice, leave: leave,
      gross: gross, net: gross - deductions
    }, [
      ["Indemnité d'ancienneté", severance],
      ["Indemnité de préavis", notice],
      ["Congés non pris", leave],
      ["Montant brut", gross],
      ["Montant net estimé", gross - deductions]
    ]);
  }

  var calculators = {
    "contractor-vs-employee": contractor,
    "domestic-worker": domestic,
    "employee-cost": employee,
    "gratuity-calculator": gratuity,
    "maternity-leave": maternity,
    "retrenchment-calculator": retrenchment
  };

  return {
    calculate: function (toolId, input) {
      return calculators[toolId] ? calculators[toolId](input || {}) : { valid: false, toolId: toolId, errors: ["Outil inconnu."] };
    },
    freshness: freshness,
    toolIds: Object.keys(calculators)
  };
});
