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
      return new Intl.NumberFormat("sw-KE", {
        style: "currency",
        currency: currency || "KES",
        maximumFractionDigits: 2
      }).format(amount);
    } catch (_) {
      return Number(amount).toFixed(2) + " " + (currency || "");
    }
  }

  function decimal(amount, digits) {
    return new Intl.NumberFormat("sw-KE", {
      maximumFractionDigits: digits === undefined ? 2 : digits
    }).format(amount);
  }

  function report(name, text, metricList, rowList, extras) {
    return {
      title: name,
      summary: text,
      metrics: metricList || [],
      rows: rowList || [],
      extras: extras || {},
      generatedAt: new Date().toISOString()
    };
  }

  function pomodoro() {
    var plan = engine.pomodoro({
      focusMinutes: number("focusMinutes"),
      shortBreakMinutes: number("shortBreakMinutes"),
      longBreakMinutes: number("longBreakMinutes"),
      sessions: number("sessions")
    });
    if (timerId) clearInterval(timerId);
    var remaining = plan.focusSeconds;
    timerId = setInterval(function () {
      remaining -= 1;
      var live = root.querySelector("[data-live-timer]");
      if (live) live.textContent = Math.floor(remaining / 60) + ":" + String(remaining % 60).padStart(2, "0");
      if (remaining <= 0) {
        clearInterval(timerId);
        timerId = null;
        status.textContent = "Kipindi kimekamilika.";
      }
    }, 1000);
    return report("Mzunguko wa Pomodoro", "Kipindi cha kwanza kimeanza kwenye kifaa hiki.", [
      ["Kipima muda", Math.floor(remaining / 60) + ":" + String(remaining % 60).padStart(2, "0"), "timer"],
      ["Vipindi", String(plan.sessions)],
      ["Mzunguko mzima", decimal(plan.cycleSeconds / 60, 0) + " dakika"],
      ["Mapumziko marefu", decimal(plan.longBreakSeconds / 60, 0) + " dakika"]
    ], [
      ["Muda wa kuzingatia", decimal(plan.focusSeconds / 60, 0) + " dakika"],
      ["Mapumziko mafupi", decimal(plan.shortBreakSeconds / 60, 0) + " dakika"]
    ]);
  }

  function unitConverter() {
    var group = value("group");
    if (group !== "temperature" && number("value") < 0) {
      throw new Error("Weka thamani ya sifuri au zaidi kwa kipimo hiki.");
    }
    var output = group === "temperature"
      ? engine.convertTemperature({ value: number("value"), from: value("from"), to: value("to") })
      : engine.convertUnit({ group: group, value: number("value"), from: value("from"), to: value("to") });
    return report("Ubadilishaji wa vipimo", "Injini ya pamoja imebadilisha thamani kwa kanuni iliyowekwa.", [
      ["Thamani ya mwanzo", decimal(number("value"), 6) + " " + value("from")],
      ["Matokeo", decimal(output, 8) + " " + value("to")]
    ], [
      ["Aina", group],
      ["Kizidishi kilichotumika", number("value") !== 0 ? decimal(output / number("value"), 10) : "Hakipatikani"]
    ]);
  }

  function budget() {
    var output = engine.budget({
      income: [number("incomeMain"), number("incomeOther")],
      categories: [
        { name: "Nyumba", kind: "needs", items: [number("housing")] },
        { name: "Chakula", kind: "needs", items: [number("food")] },
        { name: "Usafiri", kind: "needs", items: [number("transport")] },
        { name: "Msaada wa familia", kind: "needs", items: [number("family")] },
        { name: "Matakwa", kind: "wants", items: [number("wants")] },
        { name: "Akiba iliyopangwa", kind: "savings", items: [number("savings")] }
      ]
    });
    if (output.income <= 0) throw new Error("Weka angalau chanzo kimoja cha mapato kilicho juu ya sifuri.");
    var currency = value("currency");
    return report("Bajeti ya mwezi", output.balance >= 0
      ? "Bajeti ina salio baada ya matumizi yaliyowekwa."
      : "Matumizi yamezidi mapato uliyoingiza.", [
      ["Mapato", money(output.income, currency)],
      ["Matumizi", money(output.expenses, currency)],
      ["Salio", money(output.balance, currency)],
      ["Asilimia ya salio", decimal(output.savingsRate, 1) + "%"]
    ], output.categories.map(function (category) {
      return [category.name, money(category.total, currency)];
    }).concat([
      ["Mahitaji / mapato", decimal(output.needsRate, 1) + "%"],
      ["Matakwa / mapato", decimal(output.wantsRate, 1) + "%"],
      ["Mgao wa akiba wa makadirio", decimal(output.savingsAllocationRate, 1) + "%"]
    ]));
  }

  function countdown() {
    if (!value("eventDate")) throw new Error("Chagua tarehe ya tukio.");
    var output = engine.countdown({
      from: new Date().toISOString(),
      to: value("eventDate") + "T" + (value("eventTime") || "00:00") + ":00"
    });
    return report("Muda hadi " + (value("eventName") || "tukio"), output.complete
      ? "Tarehe hii imefika au imepita."
      : "Muda umehesabiwa kutoka kwenye saa ya kifaa hiki.", [
      ["Siku", String(output.days)],
      ["Saa", String(output.hours)],
      ["Dakika", String(output.minutes)],
      ["Sekunde", String(output.seconds)]
    ], [["Tarehe na saa ya eneo", value("eventDate") + " " + value("eventTime")]]);
  }

  function timeZone() {
    var output = engine.timeZone({
      localDateTime: value("localDateTime"),
      fromZone: value("fromZone"),
      toZone: value("toZone"),
      locale: "sw"
    });
    return report("Ubadilishaji wa saa za maeneo", "Wakati uleule umeonyeshwa katika maeneo mawili ya IANA.", [
      ["Mwanzo", output.from],
      ["Mwisho", output.to]
    ], [
      ["Wakati wa UTC", output.iso],
      ["Eneo la mwanzo", value("fromZone")],
      ["Eneo la mwisho", value("toZone")]
    ]);
  }

  function publicHoliday() {
    var output = engine.holidayEntry({
      country: value("country"),
      name: value("name"),
      date: value("date"),
      note: value("note"),
      confirmed: checked("confirmed"),
      locale: "sw"
    });
    return report("Tukio la kalenda lililothibitishwa", "Tukio hili limetengenezwa kutokana na tarehe uliyothibitisha.", [
      ["Nchi", output.country],
      ["Mamlaka iliyounganishwa", output.authority],
      ["Tarehe", value("date")],
      ["Jina", value("name")]
    ], [
      ["Chanzo rasmi", output.sourceUrl],
      ["Kikomo", "Ni tukio moja uliloingiza, si kalenda kamili ya taifa."]
    ], { ics: output.ics });
  }

  function workingDays() {
    var holidays = value("holidays").split(/\s+/).filter(Boolean);
    var output = engine.workingDays({ start: value("start"), end: value("end"), holidays: holidays });
    return report("Siku za kazi", "Kipindi kinajumuisha tarehe ya kuanza na ya mwisho.", [
      ["Siku za kazi", String(output.workDays)],
      ["Siku za kalenda", String(output.calendarDays)],
      ["Siku za wikendi", String(output.weekendDays)],
      ["Likizo ulizoingiza", String(output.holidayDays)]
    ], holidays.map(function (date) { return ["Tarehe uliyoondoa", date]; }));
  }

  function age() {
    var output = engine.age({ birthDate: value("birthDate"), atDate: value("atDate") });
    return report("Umri kamili", "Tofauti ya kalenda kati ya tarehe mbili ulizoingiza.", [
      ["Miaka", String(output.years)],
      ["Miezi", String(output.months)],
      ["Siku", String(output.days)],
      ["Siku hadi siku ya kuzaliwa", String(output.daysUntilBirthday)]
    ], [
      ["Jumla ya miezi kamili", decimal(output.totalMonths, 0)],
      ["Jumla ya wiki kamili", decimal(output.totalWeeks, 0)],
      ["Jumla ya siku", decimal(output.totalDays, 0)]
    ]);
  }

  function grade() {
    var scale = number("scale", 5);
    var coursePoints = [number("points1"), number("points2")];
    if (coursePoints.some(function (points) { return points < 0 || points > scale; })) {
      throw new Error("Pointi lazima zibaki ndani ya kiwango ulichochagua.");
    }
    var output = engine.grade({
      courses: [
        { name: value("course1"), credits: number("credits1"), points: coursePoints[0] },
        { name: value("course2"), credits: number("credits2"), points: coursePoints[1] }
      ],
      previousGpa: number("previousGpa"),
      previousCredits: number("previousCredits"),
      targetGpa: number("targetGpa"),
      futureCredits: number("futureCredits")
    });
    return report("Ufuatiliaji wa alama", "GPA na CGPA zimepimwa kwa uzito wa krediti.", [
      ["GPA", decimal(output.gpa, 2) + " / " + scale],
      ["CGPA", decimal(output.cgpa, 2) + " / " + scale],
      ["Krediti", String(output.credits)],
      ["Pointi za ubora", decimal(output.qualityPoints, 2)]
    ], output.courses.map(function (course) {
      return [course.name, course.credits + " krediti × " + decimal(course.points, 2) + " = " + decimal(course.qualityPoints, 2)];
    }).concat(output.requiredFutureGpa === null ? [] : [
      ["GPA inayohitajika baadaye", decimal(output.requiredFutureGpa, 2)]
    ]));
  }

  function randomPicker() {
    var items = value("items").split(/\r?\n/).map(function (item) { return item.trim(); }).filter(Boolean);
    var randomValues = new Uint32Array(Math.max(items.length, 1));
    window.crypto.getRandomValues(randomValues);
    var normalized = Array.from(randomValues, function (item) { return item / 4294967296; });
    if (value("mode") === "teams") {
      var grouped = engine.teams({ items: items, teamCount: number("teamCount", 2), randomValues: normalized });
      return report("Timu za nasibu", "Orodha imegawanywa ndani ya kivinjari kwa namba za nasibu za kifaa.", [
        ["Vipengele", String(items.length)],
        ["Timu", String(grouped.length)]
      ], grouped.map(function (team, index) { return ["Timu " + (index + 1), team.join(", ")]; }));
    }
    var picked = engine.pick({ items: items, random: normalized[0] });
    return report("Chaguo la nasibu", "Kipengele kimoja kimechaguliwa ndani ya kivinjari.", [
      ["Matokeo", picked.value],
      ["Nafasi ya ndani", String(picked.index + 1)],
      ["Idadi ya chaguo", String(items.length)]
    ]);
  }

  function meeting() {
    var output = engine.meetingCost({
      attendees: number("attendees"),
      annualSalary: number("annualSalary"),
      durationMinutes: number("durationMinutes"),
      overhead: number("overhead"),
      annualFrequency: number("annualFrequency"),
      workHoursPerYear: number("workHoursPerYear")
    });
    if (number("attendees") <= 0 || number("durationMinutes") <= 0) {
      throw new Error("Weka angalau mshiriki mmoja na muda ulio juu ya sifuri.");
    }
    var currency = value("currency");
    return report("Gharama ya mkutano", "Makadirio yametumia mshahara, gharama za ziada na marudio uliyoingiza.", [
      ["Gharama ya mkutano", money(output.meetingCost, currency)],
      ["Gharama kwa dakika", money(output.perMinute, currency)],
      ["Gharama ya mwaka", money(output.annualCost, currency)],
      ["Saa za watu", decimal(output.personHours, 1)]
    ], [
      ["Gharama ya saa kwa mtu", money(output.hourlyRate, currency)],
      ["Gharama ya saa kwa kikundi", money(output.totalHourlyRate, currency)]
    ]);
  }

  function tip() {
    var output = engine.tip({
      bill: number("bill"),
      tipRate: number("tipRate"),
      taxRate: number("taxRate"),
      people: number("people", 1),
      roundTo: number("roundTo")
    });
    if (output.bill <= 0) throw new Error("Weka bili iliyo juu ya sifuri.");
    var currency = value("currency");
    return report("Mgawanyo wa bili", "Bakshishi imehesabiwa juu ya kiasi cha bili kabla ya kodi.", [
      ["Bili pamoja na kodi", money(output.billWithTax, currency)],
      ["Bakshishi", money(output.tip, currency)],
      ["Jumla", money(output.total, currency)],
      ["Kila mtu", money(output.perPerson, currency)]
    ], [
      ["Bakshishi kwa mtu", money(output.tipPerPerson, currency)],
      ["Kiasi kilichoongezwa kwa kuzungusha", money(output.roundingExtra, currency)]
    ]);
  }

  var handlers = {
    "pomodoro": pomodoro,
    "unit-converter": unitConverter,
    "budget-planner": budget,
    "countdown-timer": countdown,
    "time-zone": timeZone,
    "public-holidays": publicHoliday,
    "working-days": workingDays,
    "age-calculator": age,
    "grade-tracker": grade,
    "random-picker": randomPicker,
    "meeting-cost": meeting,
    "tip-calculator": tip
  };

  function syncUnitChoices() {
    if (tool !== "unit-converter") return;
    var groups = {
      length: ["m", "km", "cm", "ft"],
      mass: ["kg", "g", "lb"],
      area: ["sqm", "hectare", "acre", "plot_ng", "morgen_za"],
      temperature: ["C", "F", "K"],
      data: ["byte", "kb", "mb", "gb"]
    };
    var from = form.elements.from;
    var to = form.elements.to;
    var labels = {};
    Array.from(from.options).concat(Array.from(to.options)).forEach(function (option) {
      labels[option.value] = option.textContent;
    });
    function replace(select, values, preferred) {
      select.replaceChildren();
      values.forEach(function (unit) {
        var option = document.createElement("option");
        option.value = unit;
        option.textContent = labels[unit] || unit;
        select.appendChild(option);
      });
      select.value = values.includes(preferred) ? preferred : values[0];
    }
    function refresh() {
      var values = groups[value("group")] || groups.length;
      var previousFrom = from.value;
      var previousTo = to.value;
      replace(from, values, previousFrom);
      replace(to, values, previousTo === from.value ? values[1] || values[0] : previousTo);
    }
    form.elements.group.addEventListener("change", refresh);
    refresh();
  }

  function render(data) {
    lastReport = data;
    title.textContent = data.title;
    summary.textContent = data.summary;
    metrics.replaceChildren();
    data.metrics.forEach(function (item) {
      var card = document.createElement("div");
      var label = document.createElement("span");
      var output = document.createElement("strong");
      card.className = "sw-business-metric";
      label.textContent = item[0];
      output.textContent = item[1];
      if (item[2] === "timer") output.dataset.liveTimer = "";
      card.append(label, output);
      metrics.appendChild(card);
    });
    rows.replaceChildren();
    data.rows.forEach(function (item) {
      var tr = document.createElement("tr");
      var th = document.createElement("td");
      var td = document.createElement("td");
      th.textContent = item[0];
      td.textContent = item[1];
      tr.append(th, td);
      rows.appendChild(tr);
    });
    result.hidden = false;
    status.dataset.state = "success";
    status.textContent = "Matokeo yametengenezwa kwenye kifaa hiki.";
    result.focus();
  }

  function payload() {
    var inputs = {};
    Array.from(form.elements).forEach(function (field) {
      if (!field.name) return;
      inputs[field.name] = field.type === "checkbox" ? field.checked : field.value;
    });
    return { tool: tool, locale: "sw", inputs: inputs, report: lastReport };
  }

  function textReport() {
    var lines = ["AfroTools", lastReport.title, lastReport.summary, ""];
    lastReport.metrics.forEach(function (item) { lines.push(item[0] + ": " + item[1]); });
    lastReport.rows.forEach(function (item) { lines.push(item[0] + ": " + item[1]); });
    lines.push("", "Imetengenezwa kwenye kivinjari. Thibitisha vigezo kabla ya uamuzi muhimu.");
    return lines.join("\n");
  }

  function download(blob, extension) {
    var link = document.createElement("a");
    var url = URL.createObjectURL(blob);
    link.href = url;
    link.download = "afrotools-" + tool + "." + extension;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status.textContent = "Faili ya " + extension.toUpperCase() + " imetengenezwa kwenye kifaa hiki.";
  }

  function exportFile(format) {
    if (!lastReport) throw new Error("Kokotoa matokeo kwanza.");
    if (format === "json") {
      download(new Blob([JSON.stringify(payload(), null, 2)], { type: "application/json" }), "json");
    } else if (format === "txt") {
      download(new Blob([textReport()], { type: "text/plain" }), "txt");
    } else if (format === "csv") {
      var data = [["Sehemu", "Kipengele", "Thamani"]];
      lastReport.metrics.forEach(function (item) { data.push(["Kipimo", item[0], item[1]]); });
      lastReport.rows.forEach(function (item) { data.push(["Maelezo", item[0], item[1]]); });
      var csv = data.map(function (row) {
        return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(",");
      }).join("\r\n");
      download(new Blob(["\ufeff" + csv], { type: "text/csv" }), "csv");
    } else if (format === "ics") {
      if (!lastReport.extras.ics) throw new Error("Tukio la kalenda halijapatikana.");
      download(new Blob([lastReport.extras.ics], { type: "text/calendar" }), "ics");
    } else if (format === "pdf") {
      var Pdf = window.jspdf && window.jspdf.jsPDF;
      if (!Pdf) throw new Error("Moduli ya PDF ya ndani haipatikani.");
      var pdf = new Pdf();
      var lines = pdf.splitTextToSize(textReport(), 180);
      var y = 18;
      lines.forEach(function (line) {
        if (y > 280) {
          pdf.addPage();
          y = 15;
        }
        pdf.text(line, 15, y);
        y += 5;
      });
      pdf.save("afrotools-" + tool + ".pdf");
      status.textContent = "PDF imetengenezwa kwenye kifaa hiki.";
    }
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        if (!document.execCommand("copy")) throw new Error("copy-failed");
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        textarea.remove();
      }
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    status.dataset.state = "working";
    status.textContent = "Inakokotoa…";
    try {
      var requiredMissing = Array.from(form.querySelectorAll("[required]")).some(function (field) {
        return field.type === "checkbox" ? !field.checked : !String(field.value || "").trim();
      });
      if (requiredMissing) throw new Error("Kamilisha sehemu zote zinazohitajika.");
      render(handlers[tool]());
    } catch (error) {
      result.hidden = true;
      lastReport = null;
      status.dataset.state = "error";
      status.textContent = error.message || "Kagua vigezo ulivyoingiza.";
    }
  });

  form.addEventListener("input", function () {
    if (!lastReport) return;
    result.hidden = true;
    lastReport = null;
    status.removeAttribute("data-state");
    status.textContent = "Vigezo vimebadilika. Kokotoa tena ili kupata matokeo mapya.";
  });

  root.addEventListener("click", function (event) {
    var exportButton = event.target.closest("[data-export]");
    var action = event.target.closest("[data-action]");
    try {
      if (exportButton) {
        exportFile(exportButton.dataset.export);
      } else if (action && action.dataset.action === "copy") {
        if (!lastReport) throw new Error("Kokotoa matokeo kwanza.");
        copyText(textReport()).then(function () {
          status.textContent = "Matokeo yamenakiliwa.";
        }).catch(function () {
          status.dataset.state = "error";
          status.textContent = "Kunakili hakukufaulu. Tumia faili ya TXT badala yake.";
        });
      } else if (action && action.dataset.action === "save") {
        if (!lastReport) throw new Error("Kokotoa matokeo kwanza.");
        localStorage.setItem("afrotools-sw-business-" + tool, JSON.stringify(payload()));
        status.textContent = "Matokeo yamehifadhiwa kwenye kifaa hiki.";
      } else if (action && action.dataset.action === "print") {
        if (!lastReport) throw new Error("Kokotoa matokeo kwanza.");
        window.print();
        status.textContent = "Dirisha la kuchapisha limefunguliwa.";
      }
    } catch (error) {
      status.dataset.state = "error";
      status.textContent = error.message || "Kitendo hiki hakipatikani.";
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
  syncUnitChoices();

  window.addEventListener("pagehide", function () {
    if (timerId) clearInterval(timerId);
  });
})();
