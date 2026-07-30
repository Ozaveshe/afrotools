(function () {
  "use strict";
  var root = document.querySelector("[data-business-app]");
  if (!root || !window.BusinessRoiEngine) return;
  var engine = window.BusinessRoiEngine;
  var tool = root.dataset.tool;
  var form = root.querySelector("[data-business-form]");
  var status = root.querySelector("[data-business-status]");
  var result = root.querySelector("[data-business-result]");
  var title = root.querySelector("[data-result-title]");
  var summary = root.querySelector("[data-result-summary]");
  var metrics = root.querySelector("[data-result-metrics]");
  var rows = root.querySelector("[data-result-rows]");
  var lastReport = null;
  var timerId = null;

  function value(name) {
    var field = form.elements.namedItem(name);
    return field ? String(field.value || "").trim() : "";
  }
  function number(name, fallback) {
    var parsed = Number(value(name).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : (fallback || 0);
  }
  function checked(name) {
    var field = form.elements.namedItem(name);
    return Boolean(field && field.checked);
  }
  function money(amount, currency) {
    try {
      return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency || "EUR", maximumFractionDigits: 2 }).format(amount);
    } catch (_) {
      return Number(amount).toFixed(2) + " " + currency;
    }
  }
  function decimal(amount, digits) {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits === undefined ? 2 : digits }).format(amount);
  }
  function report(name, text, metricList, rowList, extras) {
    return { title: name, summary: text, metrics: metricList || [], rows: rowList || [], extras: extras || {}, generatedAt: new Date().toISOString() };
  }

  function pomodoro() {
    var plan = engine.pomodoro({
      focusMinutes: number("focusMinutes"), shortBreakMinutes: number("shortBreakMinutes"),
      longBreakMinutes: number("longBreakMinutes"), sessions: number("sessions")
    });
    if (timerId) clearInterval(timerId);
    var remaining = plan.focusSeconds;
    timerId = setInterval(function () {
      remaining -= 1;
      var live = root.querySelector('[data-live-timer]');
      if (live) live.textContent = Math.floor(remaining / 60) + ":" + String(remaining % 60).padStart(2, "0");
      if (remaining <= 0) { clearInterval(timerId); timerId = null; status.textContent = "Session terminée."; }
    }, 1000);
    return report("Cycle Pomodoro", "La première session a démarré localement.", [
      ["Minuteur", '<span data-live-timer>' + Math.floor(remaining / 60) + ":" + String(remaining % 60).padStart(2, "0") + "</span>"],
      ["Sessions", String(plan.sessions)], ["Cycle total", decimal(plan.cycleSeconds / 60, 0) + " min"],
      ["Pause longue", decimal(plan.longBreakSeconds / 60, 0) + " min"]
    ], [["Concentration", decimal(plan.focusSeconds / 60, 0) + " min"], ["Pause courte", decimal(plan.shortBreakSeconds / 60, 0) + " min"]]);
  }

  function unitConverter() {
    var group = value("group");
    var output = group === "temperature" ?
      engine.convertTemperature({ value: number("value"), from: value("from"), to: value("to") }) :
      engine.convertUnit({ group: group, value: number("value"), from: value("from"), to: value("to") });
    return report("Conversion", "Conversion déterministe effectuée par le moteur partagé.", [
      ["Valeur source", decimal(number("value"), 6) + " " + value("from")],
      ["Résultat", decimal(output, 8) + " " + value("to")]
    ], [["Famille", group], ["Facteur effectif", number("value") !== 0 ? decimal(output / number("value"), 10) : "Non défini"]]);
  }

  function budget() {
    var output = engine.budget({
      income: [number("incomeMain"), number("incomeOther")],
      categories: [
        { name: "Logement", kind: "needs", items: [number("housing")] },
        { name: "Alimentation", kind: "needs", items: [number("food")] },
        { name: "Transport", kind: "needs", items: [number("transport")] },
        { name: "Soutien familial", kind: "needs", items: [number("family")] },
        { name: "Envies", kind: "wants", items: [number("wants")] },
        { name: "Épargne planifiée", kind: "savings", items: [number("savings")] }
      ]
    });
    if (output.income <= 0) throw new Error("Indiquez au moins un revenu supérieur à zéro.");
    var currency = value("currency");
    return report("Budget mensuel", output.balance >= 0 ? "Le budget laisse un solde positif." : "Les dépenses dépassent les revenus saisis.", [
      ["Revenus", money(output.income, currency)], ["Dépenses", money(output.expenses, currency)],
      ["Solde", money(output.balance, currency)], ["Taux de solde", decimal(output.savingsRate, 1) + "%"]
    ], output.categories.map(function (category) { return [category.name, money(category.total, currency)]; }).concat([
      ["Besoins / revenu", decimal(output.needsRate, 1) + "%"], ["Envies / revenu", decimal(output.wantsRate, 1) + "%"],
      ["Épargne totale indicative", decimal(output.savingsAllocationRate, 1) + "%"]
    ]));
  }

  function countdown() {
    if (!value("eventDate")) throw new Error("Choisissez une date d’événement.");
    var output = engine.countdown({
      from: new Date().toISOString(),
      to: value("eventDate") + "T" + (value("eventTime") || "00:00") + ":00"
    });
    return report("Compte à rebours — " + (value("eventName") || "Événement"), output.complete ? "Cette échéance est passée ou atteinte." : "Décompte calculé depuis l’horloge de cet appareil.", [
      ["Jours", String(output.days)], ["Heures", String(output.hours)],
      ["Minutes", String(output.minutes)], ["Secondes", String(output.seconds)]
    ], [["Échéance locale", value("eventDate") + " " + value("eventTime")]]);
  }

  function timeZone() {
    var output = engine.timeZone({ localDateTime: value("localDateTime"), fromZone: value("fromZone"), toZone: value("toZone") });
    return report("Conversion de fuseau", "La même heure instantanée est affichée dans les deux fuseaux IANA.", [
      ["Source", output.from], ["Destination", output.to]
    ], [["Instant UTC", output.iso], ["Fuseau source", value("fromZone")], ["Fuseau cible", value("toZone")]]);
  }

  function publicHoliday() {
    var output = engine.holidayEntry({ country: value("country"), name: value("name"), date: value("date"), note: value("note"), confirmed: checked("confirmed") });
    return report("Entrée de calendrier confirmée", "Cette entrée est préparée depuis la date que vous avez vérifiée.", [
      ["Pays", output.country], ["Autorité liée", output.authority], ["Date", value("date")], ["Nom", value("name")]
    ], [["Source officielle", output.sourceUrl], ["Limite", "Une entrée utilisateur, pas un calendrier national complet."]], { ics: output.ics });
  }

  function workingDays() {
    var holidays = value("holidays").split(/\s+/).filter(Boolean);
    var output = engine.workingDays({ start: value("start"), end: value("end"), holidays: holidays });
    return report("Jours ouvrables", "La période inclut les deux dates.", [
      ["Jours ouvrables", String(output.workDays)], ["Jours calendaires", String(output.calendarDays)],
      ["Fins de semaine", String(output.weekendDays)], ["Jours fériés saisis", String(output.holidayDays)]
    ], holidays.map(function (date) { return ["Date exclue fournie", date]; }));
  }

  function age() {
    var output = engine.age({ birthDate: value("birthDate"), atDate: value("atDate") });
    return report("Âge exact", "Différence calendaire entre les deux dates saisies.", [
      ["Années", String(output.years)], ["Mois", String(output.months)], ["Jours", String(output.days)],
      ["Prochain anniversaire", output.daysUntilBirthday + " jours"]
    ], [["Mois complets", decimal(output.totalMonths, 0)], ["Semaines complètes", decimal(output.totalWeeks, 0)], ["Jours totaux", decimal(output.totalDays, 0)]]);
  }

  function grade() {
    var scale = number("scale", 5);
    var coursePoints = [number("points1"), number("points2")];
    if (coursePoints.some(function (points) { return points < 0 || points > scale; })) throw new Error("Les points doivent rester dans l’échelle choisie.");
    var output = engine.grade({
      courses: [
        { name: value("course1"), credits: number("credits1"), points: coursePoints[0] },
        { name: value("course2"), credits: number("credits2"), points: coursePoints[1] }
      ],
      previousGpa: number("previousGpa"), previousCredits: number("previousCredits"),
      targetGpa: number("targetGpa"), futureCredits: number("futureCredits")
    });
    return report("Suivi des notes", "GPA et CGPA pondérés par les crédits.", [
      ["GPA", decimal(output.gpa, 2) + " / " + scale], ["CGPA", decimal(output.cgpa, 2) + " / " + scale],
      ["Crédits", String(output.credits)], ["Points qualité", decimal(output.qualityPoints, 2)]
    ], output.courses.map(function (course) {
      return [course.name, course.credits + " crédits × " + decimal(course.points, 2) + " = " + decimal(course.qualityPoints, 2)];
    }).concat(output.requiredFutureGpa === null ? [] : [["GPA futur requis", decimal(output.requiredFutureGpa, 2)]]));
  }

  function randomPicker() {
    var items = value("items").split(/\r?\n/).filter(Boolean);
    var randomValues = new Uint32Array(Math.max(items.length, 1));
    crypto.getRandomValues(randomValues);
    var normalized = Array.from(randomValues, function (item) { return item / 4294967296; });
    if (value("mode") === "teams") {
      var grouped = engine.teams({ items: items, teamCount: number("teamCount", 2), randomValues: normalized });
      return report("Équipes aléatoires", "Répartition effectuée localement avec l’aléa cryptographique du navigateur.", [
        ["Éléments", String(items.length)], ["Équipes", String(grouped.length)]
      ], grouped.map(function (team, index) { return ["Équipe " + (index + 1), team.join(", ")]; }));
    }
    var picked = engine.pick({ items: items, random: normalized[0] });
    return report("Tirage aléatoire", "Un élément a été sélectionné localement.", [
      ["Résultat", picked.value], ["Position interne", String(picked.index + 1)], ["Choix possibles", String(items.length)]
    ]);
  }

  function meeting() {
    var output = engine.meetingCost({
      attendees: number("attendees"), annualSalary: number("annualSalary"),
      durationMinutes: number("durationMinutes"), overhead: number("overhead"),
      annualFrequency: number("annualFrequency"), workHoursPerYear: number("workHoursPerYear")
    });
    if (number("attendees") <= 0 || number("durationMinutes") <= 0) throw new Error("Indiquez au moins un participant et une durée positive.");
    var currency = value("currency");
    return report("Coût de réunion", "Estimation fondée sur le salaire moyen, les charges et la fréquence saisis.", [
      ["Coût de la réunion", money(output.meetingCost, currency)], ["Coût par minute", money(output.perMinute, currency)],
      ["Coût annuel", money(output.annualCost, currency)], ["Heures-personnes", decimal(output.personHours, 1)]
    ], [["Taux horaire chargé par personne", money(output.hourlyRate, currency)], ["Taux horaire du groupe", money(output.totalHourlyRate, currency)]]);
  }

  function tip() {
    var output = engine.tip({
      bill: number("bill"), tipRate: number("tipRate"), taxRate: number("taxRate"),
      people: number("people", 1), roundTo: number("roundTo")
    });
    if (output.bill <= 0) throw new Error("Indiquez une addition supérieure à zéro.");
    var currency = value("currency");
    return report("Partage d’addition", "Le pourboire est calculé sur le montant avant taxe, comme dans l’application anglaise.", [
      ["Addition avec taxe", money(output.billWithTax, currency)], ["Pourboire", money(output.tip, currency)],
      ["Total", money(output.total, currency)], ["Par personne", money(output.perPerson, currency)]
    ], [["Pourboire par personne", money(output.tipPerPerson, currency)], ["Arrondi ajouté", money(output.roundingExtra, currency)]]);
  }

  var handlers = {
    "pomodoro": pomodoro, "unit-converter": unitConverter, "budget-planner": budget,
    "countdown-timer": countdown, "time-zone": timeZone, "public-holidays": publicHoliday,
    "working-days": workingDays, "age-calculator": age, "grade-tracker": grade,
    "random-picker": randomPicker, "meeting-cost": meeting, "tip-calculator": tip
  };

  function render(data) {
    lastReport = data;
    title.textContent = data.title;
    summary.textContent = data.summary;
    metrics.replaceChildren();
    data.metrics.forEach(function (item) {
      var card = document.createElement("div");
      card.className = "metric";
      var label = document.createElement("span");
      var output = document.createElement("strong");
      label.textContent = item[0];
      if (item[1].indexOf && item[1].indexOf("data-live-timer") >= 0) output.innerHTML = item[1];
      else output.textContent = item[1];
      card.append(label, output);
      metrics.appendChild(card);
    });
    rows.replaceChildren();
    data.rows.forEach(function (item) {
      var tr = document.createElement("tr");
      var th = document.createElement("td");
      var td = document.createElement("td");
      th.textContent = item[0]; td.textContent = item[1];
      tr.append(th, td); rows.appendChild(tr);
    });
    result.hidden = false;
    status.dataset.state = "success";
    status.textContent = "Résultat produit localement.";
    result.focus();
  }

  function payload() {
    var inputs = {};
    Array.from(form.elements).forEach(function (field) {
      if (!field.name) return;
      inputs[field.name] = field.type === "checkbox" ? field.checked : field.value;
    });
    return { tool: tool, locale: "fr", inputs: inputs, report: lastReport };
  }

  function textReport() {
    var lines = [lastReport.title, lastReport.summary, ""];
    lastReport.metrics.forEach(function (item) { lines.push(item[0] + " : " + String(item[1]).replace(/<[^>]+>/g, "")); });
    lastReport.rows.forEach(function (item) { lines.push(item[0] + " : " + item[1]); });
    lines.push("", "Produit localement sur AfroTools. Vérifiez les hypothèses avant décision.");
    return lines.join("\n");
  }

  function download(blob, extension) {
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "afrotools-" + tool + "." + extension;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 0);
    status.textContent = "Export " + extension.toUpperCase() + " créé localement.";
  }

  function exportFile(format) {
    if (!lastReport) throw new Error("Calculez d’abord un résultat.");
    if (format === "json") download(new Blob([JSON.stringify(payload(), null, 2)], { type: "application/json" }), "json");
    else if (format === "txt") download(new Blob([textReport()], { type: "text/plain" }), "txt");
    else if (format === "csv") {
      var data = [["Section", "Libellé", "Valeur"]];
      lastReport.metrics.forEach(function (item) { data.push(["Indicateur", item[0], String(item[1]).replace(/<[^>]+>/g, "")]); });
      lastReport.rows.forEach(function (item) { data.push(["Détail", item[0], item[1]]); });
      var csv = data.map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
      download(new Blob(["\ufeff" + csv], { type: "text/csv" }), "csv");
    } else if (format === "ics") {
      download(new Blob([lastReport.extras.ics], { type: "text/calendar" }), "ics");
    } else if (format === "pdf") {
      var Pdf = window.jspdf && window.jspdf.jsPDF;
      if (!Pdf) throw new Error("Le module PDF local n’est pas disponible.");
      var pdf = new Pdf();
      var lines = pdf.splitTextToSize(textReport(), 180);
      var y = 18;
      lines.forEach(function (line) { if (y > 280) { pdf.addPage(); y = 15; } pdf.text(line, 15, y); y += 5; });
      pdf.save("afrotools-" + tool + ".pdf");
      status.textContent = "PDF créé localement.";
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    status.dataset.state = "working";
    status.textContent = "Calcul en cours…";
    try { render(handlers[tool]()); }
    catch (error) {
      result.hidden = true;
      status.dataset.state = "error";
      status.textContent = error.message || "Vérifiez les champs.";
    }
  });
  root.addEventListener("click", function (event) {
    var exportButton = event.target.closest("[data-export]");
    var action = event.target.closest("[data-action]");
    try {
      if (exportButton) exportFile(exportButton.dataset.export);
      else if (action && action.dataset.action === "copy") {
        navigator.clipboard.writeText(textReport()).then(function () { status.textContent = "Résultat copié."; });
      } else if (action && action.dataset.action === "save") {
        localStorage.setItem("afrotools-fr-business-" + tool, JSON.stringify(payload()));
        status.textContent = "Résultat enregistré sur cet appareil.";
      } else if (action && action.dataset.action === "print") {
        window.print();
        status.textContent = "Dialogue d’impression ouvert.";
      }
    } catch (error) {
      status.dataset.state = "error";
      status.textContent = error.message || "Action indisponible.";
    }
  });

  if (tool === "countdown-timer") {
    var tomorrow = new Date(Date.now() + 86400000);
    form.elements.eventDate.value = tomorrow.toISOString().slice(0, 10);
  }
  if (tool === "time-zone") {
    var now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    form.elements.localDateTime.value = now.toISOString().slice(0, 16);
  }
  if (tool === "working-days") {
    form.elements.start.value = "2026-07-27";
    form.elements.end.value = "2026-08-02";
  }
  if (tool === "age-calculator") {
    form.elements.birthDate.value = "2000-02-29";
    form.elements.atDate.value = "2026-07-29";
  }
})();
