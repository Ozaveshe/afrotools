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
  var lastInputs = null;
  var timerId = null;
  var countdownRuntime = null;

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
    var plan = engine.pomodoro({ focusMinutes: number("focusMinutes"), shortBreakMinutes: number("shortBreakMinutes"), longBreakMinutes: number("longBreakMinutes"), sessions: number("sessions") });
    var runtime = window.AfroTools && window.AfroTools.localizedPomodoro;
    if (!runtime) throw new Error("Le minuteur local n’est pas disponible. Rechargez la page.");
    runtime.mount(root, "fr").configure(plan);
    return report("Cycle Pomodoro", "Cycle prêt. Utilisez les commandes du minuteur pour commencer.", [
      ["Concentration", Math.floor(plan.focusSeconds / 60) + ":" + String(plan.focusSeconds % 60).padStart(2, "0")],
      ["Sessions", String(plan.sessions)],
      ["Cycle total", decimal(plan.cycleSeconds / 60, 0) + " min"],
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

  function countdownReport(state) {
    var output = state.remaining, event = state.event;
    var data = report("Compte à rebours — " + (event.name || "Événement"), output.complete ? "Cette échéance est atteinte." : "Compte à rebours actualisé avec l’horloge de cet appareil.", [
      ["Jours", String(output.days)], ["Heures", String(output.hours)],
      ["Minutes", String(output.minutes)], ["Secondes", String(output.seconds)]
    ], [["Échéance locale", event.date + " " + event.time], ["Fuseau de cet appareil", Intl.DateTimeFormat().resolvedOptions().timeZone], ["Instant du calcul (UTC)", state.generatedAt]]);
    data.generatedAt = state.generatedAt;
    return data;
  }

  function refreshCountdownReport(state) {
    if (tool !== "countdown-timer" || !countdownRuntime || !lastReport) return;
    state = state || countdownRuntime.snapshot();
    if (!state) return;
    var data = countdownReport(state);
    lastReport = data;
    title.textContent = data.title; summary.textContent = data.summary;
    var outputs = metrics.querySelectorAll("strong");
    data.metrics.forEach(function (item, index) { if (outputs[index]) outputs[index].textContent = item[1]; });
    var details = rows.querySelectorAll("tr");
    data.rows.forEach(function (item, index) { if (details[index]) { var cells = details[index].querySelectorAll("td"); if (cells[0]) cells[0].textContent = item[0]; if (cells[1]) cells[1].textContent = item[1]; } });
  }

  function countdown() {
    var runtime = window.AfroTools && window.AfroTools.localizedCountdown;
    if (!runtime) throw new Error("Le compte à rebours local est indisponible. Rechargez la page.");
    countdownRuntime = runtime.mount(root, "fr", { onSnapshot: refreshCountdownReport });
    var state = countdownRuntime.configure({ name: value("eventName") || "Événement", date: value("eventDate"), time: value("eventTime") || "00:00" });
    return countdownReport(state);
  }

  function timeZone() {
    var output, occurrence = value("occurrence") || "reject";
    try {
      output = engine.timeZone({ localDateTime: value("localDateTime"), fromZone: value("fromZone"), toZone: value("toZone"), locale: "fr", occurrence: occurrence });
    } catch (error) {
      var messages = {"invalid-date":"Saisissez une date et une heure valides.","nonexistent-local-time":"Cette heure locale n’existe pas lors du changement d’heure. Choisissez une autre heure.","ambiguous-local-time":"Cette heure locale se produit deux fois. Choisissez la première ou la deuxième occurrence.","invalid-time-occurrence":"Choisissez une option valide pour les heures répétées."};
      throw new Error(messages[error.message] || "La conversion est indisponible. Vérifiez la date et les fuseaux.");
    }
    var occurrenceLabels = {"reject":"Demander de choisir","earlier":"Première occurrence","later":"Deuxième occurrence"};
    return report("Conversion de fuseau", "Le même instant est affiché dans les deux fuseaux IANA.", [
      ["Source", output.from], ["Destination", output.to]
    ], [["Date et heure saisies", value("localDateTime").replace("T", " ")], ["Instant UTC", output.iso], ["Fuseau source", value("fromZone")], ["Fuseau cible", value("toZone")], ["En cas d’heure répétée", occurrenceLabels[occurrence]]]);
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
    var output;
    try { output = engine.age({ birthDate: value("birthDate"), atDate: value("atDate") }); }
    catch (error) { throw new Error(error.message === "invalid-age-range" ? "La date de naissance doit être valide et ne pas dépasser la date de calcul." : "Le calcul de l’âge est indisponible."); }
    return report("Âge exact", "Années et mois complets comptés depuis la date de naissance ; les dates inexistantes sont reportées au mois suivant.", [
      ["Années", String(output.years)], ["Mois", String(output.months)], ["Jours", String(output.days)],
      ["Prochain anniversaire", output.daysUntilBirthday === 0 ? "Aujourd’hui" : output.daysUntilBirthday + " jours"]
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

  function pickerInteger(name, min, max) {
    var raw = value(name), n = Number(raw);
    if (!raw || !Number.isSafeInteger(n) || n < min || n > max) throw new Error("Saisissez un entier valide.");
    return n;
  }
  function pickerIndex(size) {
    var limit = 4294967296 - (4294967296 % size), bytes = new Uint32Array(1);
    do { window.crypto.getRandomValues(bytes); } while (bytes[0] >= limit);
    return bytes[0] % size;
  }
  function syncPickerMode() {
    if (tool !== "random-picker") return;
    var mode = value("mode"), active = {items: mode === "pick" || mode === "teams", pickCount: mode === "pick", teamCount: mode === "teams", numMin: mode === "numbers", numMax: mode === "numbers", numCount: mode === "numbers"};
    Object.keys(active).forEach(function (name) {
      var field = form.elements.namedItem(name); if (!field) return;
      field.disabled = !active[name]; field.required = active[name]; field.hidden = !active[name];
      var label = form.querySelector('label[for="' + field.id + '"]'); if (label) label.hidden = !active[name];
      var wrapper = field.closest('.sw-business-field'); if (wrapper) wrapper.hidden = !active[name];
    });
  }
  function randomPicker() {
    var mode = value("mode"), selected = [];
    if (mode === "coin") return report("Sélection aléatoire", "Tirage produit localement.", [["Résultats", pickerIndex(2) ? "Pile" : "Face"]]);
    if (mode === "numbers") {
      var min = pickerInteger("numMin", Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER), max = pickerInteger("numMax", min, Number.MAX_SAFE_INTEGER);
      var size = max - min + 1, count = pickerInteger("numCount", 1, 100);
      if (!Number.isSafeInteger(size) || size > 4294967296) throw new Error("La plage doit contenir au plus 4 294 967 296 entiers.");
      for (var n = 0; n < count; n += 1) selected.push(String(min + pickerIndex(size)));
      return report("Sélection aléatoire", "Tirage produit localement.", [["Résultats", selected.join(", ")]]);
    }
    var items = value("items").split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (!items.length) throw new Error("Ajoutez au moins un élément.");
    var pool = items.slice();
    if (mode === "teams") {
      if (items.length < 2) throw new Error("Deux éléments sont nécessaires pour les équipes.");
      var teamCount = pickerInteger("teamCount", 2, Math.min(20, items.length));
      for (var i = pool.length - 1; i > 0; i -= 1) { var j = pickerIndex(i + 1), temp = pool[i]; pool[i] = pool[j]; pool[j] = temp; }
      var groups = Array.from({length:teamCount}, function () { return []; });
      pool.forEach(function (item, index) { groups[index % teamCount].push(item); });
      return report("Sélection aléatoire", "Tirage produit localement.", [["Éléments disponibles", String(items.length)]], groups.map(function (group, index) { return ["Équipe" + " " + (index + 1), group.join(", ")]; }));
    }
    if (mode !== "pick") throw new Error("Saisissez un entier valide.");
    var amount = Math.min(pickerInteger("pickCount", 1, 100), pool.length);
    for (var k = 0; k < amount; k += 1) selected.push(pool.splice(pickerIndex(pool.length), 1)[0]);
    return report("Sélection aléatoire", "Tirage produit localement.", [["Résultats", selected.join(", ")], ["Éléments disponibles", String(items.length)]]);
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
    lastInputs = inputValues();
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
    if (tool === "pomodoro") { var timerPanel = root.querySelector('[data-pomodoro-role="panel"]'); if (timerPanel) timerPanel.focus(); }
  }

  function inputValues() {
    var inputs = {};
    Array.from(form.elements).forEach(function (field) {
      if (!field.name) return;
      inputs[field.name] = field.type === "checkbox" ? field.checked : field.value;
    });
    return inputs;
  }
  function requireReport() {
    if (lastReport && JSON.stringify(inputValues()) !== JSON.stringify(lastInputs)) invalidateReport();
    refreshCountdownReport();
    if (!lastReport) throw new Error("Calculez d’abord un résultat.");
  }
  function payload() {
    requireReport();
    return { tool: tool, locale: "fr", inputs: lastInputs, report: lastReport };
  }

  function textReport() {
    requireReport();
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
    requireReport();
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
      var lines = pdf.splitTextToSize(textReport().replace(/[\u00a0\u202f]/g, " "), 180);
      var y = 18;
      lines.forEach(function (line) { if (y > 280) { pdf.addPage(); y = 15; } pdf.text(line, 15, y); y += 5; });
      pdf.save("afrotools-" + tool + ".pdf");
      status.textContent = "PDF créé localement.";
    }
  }

  function invalidateReport(message) {
    lastReport = null;
    lastInputs = null;
    result.hidden = true;
    if (timerId) { clearInterval(timerId); timerId = null; }
    status.removeAttribute("data-state");
    status.textContent = message || "Les paramètres ont changé. Recalculez pour obtenir un nouveau résultat.";
  }
  ["input", "change"].forEach(function (eventName) {
    form.addEventListener(eventName, function () {
      if (lastReport && JSON.stringify(inputValues()) !== JSON.stringify(lastInputs)) invalidateReport();
    });
  });
  form.addEventListener("reset", function () {
    if (lastReport || timerId) invalidateReport();
  });
  form.addEventListener("invalid", function () {
    invalidateReport("Vérifiez les champs avant de recalculer.");
    status.dataset.state = "error";
  }, true);

  form.addEventListener("change", syncPickerMode);
  syncPickerMode();

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    status.dataset.state = "working";
    status.textContent = "Calcul en cours…";
    try { render(handlers[tool]()); }
    catch (error) {
      invalidateReport();
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
        var copiedReport = lastReport;
        navigator.clipboard.writeText(textReport()).then(function () {
          if (lastReport === copiedReport) status.textContent = "Résultat copié.";
        }).catch(function () {
          if (lastReport !== copiedReport) return;
          status.dataset.state = "error";
          status.textContent = "La copie a échoué. Utilisez le fichier TXT.";
        });
      } else if (action && action.dataset.action === "save") {
        localStorage.setItem("afrotools-fr-business-" + tool, JSON.stringify(payload()));
        status.textContent = "Résultat enregistré sur cet appareil.";
      } else if (action && action.dataset.action === "print") {
        requireReport();
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
    form.elements.eventDate.value = String(tomorrow.getFullYear()).padStart(4, "0") + "-" + String(tomorrow.getMonth() + 1).padStart(2, "0") + "-" + String(tomorrow.getDate()).padStart(2, "0");
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
