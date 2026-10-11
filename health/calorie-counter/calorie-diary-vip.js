(function () {
  "use strict";
  var storageKey = "afrotools.health.calorieDiary.v2";
  var entries = [];
  var form;
  var isFrench = document.documentElement.lang.toLowerCase().split("-")[0] === "fr";

  function readEntries() {
    try {
      var parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
      entries = Array.isArray(parsed) ? parsed.filter(function (entry) {
        return entry && Number.isFinite(Number(entry.amount)) &&
          Number.isFinite(Number(entry.calories)) && Number(entry.calories) >= 0 &&
          Number(entry.calories) <= 1000000000000;
      }).slice(-200) : [];
    } catch (_error) { entries = []; }
  }

  function saveEntries() {
    try { localStorage.setItem(storageKey, JSON.stringify(entries)); } catch (_error) {}
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function displayNumber(value) {
    return Number(value).toLocaleString(isFrench ? "fr-FR" : undefined, { maximumFractionDigits: 1 });
  }

  function render() {
    var body = document.getElementById("entries-body");
    var total = CalorieDiaryEngine.total(entries);
    document.getElementById("total-calories").textContent = displayNumber(total) + " kcal";
    document.getElementById("entry-count").textContent = entries.length ? entries.length + (entries.length === 1 ? " entry." : " entries.") : "No entries yet.";
    body.innerHTML = entries.map(function (entry, index) {
      return "<tr><td data-no-fr-health-translate data-no-sw-health-translate>" + escapeHtml(entry.foodName) + "</td><td>" + displayNumber(entry.amount) + " " + escapeHtml(entry.unit) + "</td><td" + (entry.sourceNote ? " data-no-fr-health-translate data-no-sw-health-translate" : "") + ">" + escapeHtml(entry.sourceNote || (isFrench ? "Non renseignée" : "Not recorded")) + "</td><td>" + displayNumber(entry.calories) + " kcal</td><td><button class=\"remove-btn\" type=\"button\" data-remove=\"" + index + "\" aria-label=\"Remove " + escapeHtml(entry.foodName) + "\">Remove</button></td></tr>";
    }).join("");
    document.getElementById("empty-state").hidden = entries.length > 0;
    document.getElementById("entries-wrap").hidden = entries.length === 0;
    ["download-txt", "download-pdf", "clear-diary"].forEach(function (id) { document.getElementById(id).disabled = entries.length === 0; });
  }

  function buildReportText() {
    var lines = [isFrench ? "AfroTools — journal quotidien des calories alimentaires" : "AfroTools Daily Food Calorie Diary", (isFrench ? "Créé localement : " : "Created locally: ") + new Date().toISOString().slice(0, 10), ""];
    entries.forEach(function (entry, index) {
      lines.push((index + 1) + ". " + entry.foodName + " — " + displayNumber(entry.amount) + " " + (isFrench && entry.unit === "serving" ? (Number(entry.amount) === 1 ? "portion" : "portions") : entry.unit) + " — " + displayNumber(entry.calories) + " kcal");
      lines.push((isFrench ? "   Source : " : "   Source: ") + (entry.sourceNote || (isFrench ? "Non renseignée" : "Not recorded")));
    });
    lines.push("", (isFrench ? "Total saisi : " : "Total entered: ") + displayNumber(CalorieDiaryEngine.total(entries)) + " kcal");
    lines.push("", isFrench ? "Signification : somme des valeurs caloriques de l’étiquette ou du fournisseur saisies par l’utilisateur. Ce journal privé ne constitue ni un objectif calorique, ni une prescription alimentaire, ni un diagnostic, ni un avis médical." : "Meaning: Sum of user-entered label/provider calorie values. This is a private record, not a calorie target, diet prescription, diagnosis or medical advice.");
    return lines.join("\n");
  }

  function downloadBlob(blob, filename) {
    var anchor = document.createElement("a");
    var url = URL.createObjectURL(blob);
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function downloadTxt() {
    downloadBlob(new Blob([buildReportText()], { type: "text/plain;charset=utf-8" }), "afrotools-daily-calorie-diary.txt");
    document.getElementById("export-status").textContent = "TXT downloaded locally.";
  }

  function downloadPdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      document.getElementById("export-status").textContent = "PDF library is unavailable. Use the TXT export.";
      return;
    }
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4", compress: false });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    var lines = doc.splitTextToSize(buildReportText().replace(/\u202f/g, " "), 500);
    var y = 48;
    lines.forEach(function (line) {
      if (y > 790) { doc.addPage(); y = 48; }
      doc.text(line, 44, y);
      y += 14;
    });
    doc.save("afrotools-daily-calorie-diary.pdf");
    document.getElementById("export-status").textContent = "PDF downloaded locally.";
  }

  function onSubmit(event) {
    event.preventDefault();
    var error = document.getElementById("form-error");
    error.hidden = true;
    try {
      var data = Object.fromEntries(new FormData(form).entries());
      entries.push(CalorieDiaryEngine.calculateEntry(data));
      if (entries.length > 200) entries = entries.slice(-200);
      saveEntries();
      form.reset();
      document.getElementById("reference-amount").value = "100";
      render();
      document.getElementById("food-name").focus();
    } catch (problem) {
      error.textContent = problem.message;
      error.hidden = false;
      error.focus();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    form = document.getElementById("diary-form");
    readEntries();
    render();
    form.addEventListener("submit", onSubmit);
    document.getElementById("entries-body").addEventListener("click", function (event) {
      var button = event.target.closest("[data-remove]");
      if (!button) return;
      entries.splice(Number(button.dataset.remove), 1);
      saveEntries();
      render();
    });
    document.getElementById("clear-diary").addEventListener("click", function () {
      if (!window.confirm("Clear every diary entry stored on this device?")) return;
      entries = [];
      saveEntries();
      render();
      document.getElementById("food-name").focus();
    });
    document.getElementById("download-txt").addEventListener("click", downloadTxt);
    document.getElementById("download-pdf").addEventListener("click", downloadPdf);
  });

  window.CalorieDiaryApp = { buildReportText: buildReportText };
})();
