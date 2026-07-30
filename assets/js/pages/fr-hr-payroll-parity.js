(function () {
  "use strict";

  var configNode = document.getElementById("fr-hr-payroll-config");
  var form = document.getElementById("fr-hr-payroll-form");
  var resultPanel = document.getElementById("fr-hr-payroll-result");
  var resultBody = document.getElementById("fr-hr-payroll-result-body");
  var workflowNode = document.getElementById("fr-hr-payroll-workflow");
  var errorBox = document.getElementById("fr-hr-payroll-errors");
  var status = document.getElementById("fr-hr-payroll-status");
  var exportButtons = Array.prototype.slice.call(document.querySelectorAll("[data-export]"));
  var importInput = document.getElementById("fr-hr-payroll-import");
  var state = { result: null };
  var config;

  if (!configNode || !form || !window.AfroTools || !window.AfroTools.frHrPayroll) return;

  try {
    config = JSON.parse(configNode.textContent);
  } catch (_) {
    return;
  }

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  function invalidate() {
    state.result = null;
    resultPanel.hidden = true;
    errorBox.hidden = true;
    exportButtons.forEach(function (button) { button.disabled = true; });
    setStatus("Les données modifiées n'ont pas encore été recalculées.", false);
  }

  function readInput() {
    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = String(value).trim(); });
    if (config.id === "maternity-leave") {
      var country = form.elements.namedItem("country");
      var compareCountry = form.elements.namedItem("compareCountry");
      data.countryLabel = country && country.selectedOptions[0] ? country.selectedOptions[0].textContent.trim() : "";
      data.compareCountryLabel = compareCountry && compareCountry.selectedOptions[0] ? compareCountry.selectedOptions[0].textContent.trim() : "";
    }
    return data;
  }

  function money(value) {
    var currency = String(state.result.input.currency || "").trim();
    return currency + " " + Number(value).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function display(row) {
    if (row[2] === "percent") return Number(row[1]).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " %";
    if (row[2] === "years") return Number(row[1]).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " an(s)";
    if (row[2] === "score") return Math.round(Number(row[1])) + "/100";
    if (row[2] === "text") return String(row[1]);
    return money(row[1]);
  }

  function appendHeading(parent, text) {
    var heading = document.createElement("h3");
    heading.textContent = text;
    parent.appendChild(heading);
  }

  function renderWorkflow(workflow) {
    workflowNode.textContent = "";
    workflowNode.hidden = !workflow;
    if (!workflow) return;
    if (workflow.details && workflow.details.length) {
      appendHeading(workflowNode, "Contexte du workflow");
      var details = document.createElement("dl");
      details.className = "fr-hr-workflow-details";
      workflow.details.forEach(function (item) {
        var term = document.createElement("dt");
        var description = document.createElement("dd");
        term.textContent = item[0];
        description.textContent = String(item[1]);
        details.appendChild(term);
        details.appendChild(description);
      });
      workflowNode.appendChild(details);
    }
    if (workflow.scenarios && workflow.scenarios.length) {
      appendHeading(workflowNode, "Scénarios");
      var table = document.createElement("table");
      var body = document.createElement("tbody");
      workflow.scenarios.forEach(function (item) {
        var row = document.createElement("tr");
        var label = document.createElement("th");
        var value = document.createElement("td");
        label.scope = "row";
        label.textContent = item[0];
        value.textContent = item[2] === "money" ? money(item[1]) : String(item[1]);
        row.appendChild(label);
        row.appendChild(value);
        body.appendChild(row);
      });
      table.appendChild(body);
      workflowNode.appendChild(table);
    }
    if (workflow.checklist && workflow.checklist.length) {
      appendHeading(workflowNode, "Points à vérifier");
      var list = document.createElement("ul");
      workflow.checklist.forEach(function (item) {
        var listItem = document.createElement("li");
        listItem.textContent = item;
        list.appendChild(listItem);
      });
      workflowNode.appendChild(list);
    }
  }

  function renderResult(result) {
    resultBody.textContent = "";
    result.rows.forEach(function (row) {
      var tr = document.createElement("tr");
      var label = document.createElement("th");
      var value = document.createElement("td");
      label.scope = "row";
      label.textContent = row[0];
      value.textContent = display(row);
      tr.appendChild(label);
      tr.appendChild(value);
      resultBody.appendChild(tr);
    });
    renderWorkflow(result.workflow);
    document.getElementById("fr-hr-payroll-source-used").textContent =
      result.evidence.sourceLabel + " — " + result.evidence.sourceDate + " — " + result.evidence.jurisdiction;
    document.getElementById("fr-hr-payroll-freshness").textContent =
      result.evidence.label + " (" + result.evidence.ageDays + " jour(s))";
    document.getElementById("fr-hr-payroll-confidence").textContent = result.evidence.confidence;
    resultPanel.hidden = false;
    errorBox.hidden = true;
    exportButtons.forEach(function (button) { button.disabled = false; });
    setStatus("Estimation recalculée. Les exports correspondent au résultat affiché.", false);
    resultPanel.focus();
  }

  function calculate(event) {
    if (event) event.preventDefault();
    var result = window.AfroTools.frHrPayroll.calculate(config.id, readInput());
    if (!result.valid) {
      state.result = null;
      resultPanel.hidden = true;
      exportButtons.forEach(function (button) { button.disabled = true; });
      errorBox.hidden = false;
      errorBox.innerHTML = "<strong>Corrigez les champs suivants :</strong><ul>" +
        result.errors.map(function (error) {
          var li = document.createElement("li");
          li.textContent = error;
          return li.outerHTML;
        }).join("") + "</ul>";
      errorBox.focus();
      setStatus("Le calcul n'a pas été effectué.", true);
      return;
    }
    state.result = result;
    renderResult(result);
  }

  function reportObject() {
    return {
      schemaVersion: 1,
      locale: "fr",
      toolId: config.id,
      route: config.route,
      savedAt: new Date().toISOString(),
      input: state.result.input,
      result: state.result.values,
      rows: state.result.rows,
      workflow: state.result.workflow,
      evidence: state.result.evidence,
      disclaimer: "Estimation de planification, sans valeur de conseil juridique, fiscal ou social."
    };
  }

  function reportText() {
    var report = reportObject();
    var lines = [
      config.title,
      "",
      report.rows.map(function (row) {
        if (row[2] === "percent") return row[0] + " : " + Number(row[1]).toFixed(2) + " %";
        if (row[2] === "years") return row[0] + " : " + Number(row[1]).toFixed(2) + " an(s)";
        if (row[2] === "score") return row[0] + " : " + Math.round(Number(row[1])) + "/100";
        if (row[2] === "text") return row[0] + " : " + row[1];
        return row[0] + " : " + report.input.currency + " " + Number(row[1]).toFixed(2);
      }).join("\n"),
      ""
    ];
    if (report.workflow) {
      if (report.workflow.details && report.workflow.details.length) {
        lines.push("Contexte du workflow");
        report.workflow.details.forEach(function (item) { lines.push(item[0] + " : " + item[1]); });
        lines.push("");
      }
      if (report.workflow.scenarios && report.workflow.scenarios.length) {
        lines.push("Scénarios");
        report.workflow.scenarios.forEach(function (item) {
          lines.push(item[0] + " : " + (item[2] === "money" ? report.input.currency + " " + Number(item[1]).toFixed(2) : item[1]));
        });
        lines.push("");
      }
      if (report.workflow.checklist && report.workflow.checklist.length) {
        lines.push("Points à vérifier");
        report.workflow.checklist.forEach(function (item) { lines.push("- " + item); });
        lines.push("");
      }
    }
    lines.push(
      "Juridiction : " + report.evidence.jurisdiction,
      "Source saisie : " + report.evidence.sourceLabel,
      "Date de source : " + report.evidence.sourceDate,
      "Fraîcheur : " + report.evidence.label + " (" + report.evidence.ageDays + " jour(s))",
      "Confiance : " + report.evidence.confidence,
      "",
      report.disclaimer
    );
    return lines.join("\n");
  }

  function slug() {
    return "afrotools-" + config.id + "-fr-" + new Date().toISOString().slice(0, 10);
  }

  function download(name, type, content) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  function safePdfText(text) {
    return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘]/g, "'").replace(/[—–−]/g, "-").replace(/[^\x20-\x7e\n]/g, " ");
  }

  function exportPdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      setStatus("La bibliothèque PDF locale n'est pas disponible. Réessayez après le chargement de la page.", true);
      return;
    }
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    var lines = doc.splitTextToSize(safePdfText(reportText()), 500);
    var y = 54;
    doc.setProperties({ title: safePdfText(config.title), subject: "Estimation RH locale AfroTools", creator: "AfroTools" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    lines.forEach(function (line) {
      if (y > 790) { doc.addPage(); y = 54; }
      doc.text(line, 48, y);
      y += 14;
    });
    doc.save(slug() + ".pdf");
    setStatus("PDF téléchargé depuis le navigateur.", false);
  }

  function exportCurrent(type) {
    if (!state.result) return;
    if (type === "txt") download(slug() + ".txt", "text/plain;charset=utf-8", reportText());
    if (type === "json") download(slug() + ".json", "application/json;charset=utf-8", JSON.stringify(reportObject(), null, 2));
    if (type === "pdf") exportPdf();
    if (type === "copy") {
      var text = reportText();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          setStatus("Résumé copié.", false);
        }).catch(function () {
          setStatus("Copie automatique indisponible. Utilisez les exports TXT ou JSON.", true);
        });
      } else {
        setStatus("Copie automatique indisponible. Utilisez les exports TXT ou JSON.", true);
      }
    }
  }

  function importJson(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var saved = JSON.parse(String(reader.result || "{}"));
        if (saved.schemaVersion !== 1 || saved.toolId !== config.id || !saved.input) throw new Error("invalid");
        Object.keys(saved.input).forEach(function (name) {
          var field = form.elements.namedItem(name);
          if (field) field.value = String(saved.input[name]);
        });
        calculate();
        setStatus("Fichier JSON rouvert et recalculé localement.", false);
      } catch (_) {
        setStatus("Ce fichier JSON n'est pas un enregistrement valide pour cet outil.", true);
      }
    };
    reader.onerror = function () { setStatus("Impossible de lire le fichier local.", true); };
    reader.readAsText(file);
  }

  form.addEventListener("submit", calculate);
  form.addEventListener("input", invalidate);
  form.addEventListener("change", invalidate);
  exportButtons.forEach(function (button) {
    button.addEventListener("click", function () { exportCurrent(button.getAttribute("data-export")); });
  });
  document.getElementById("fr-hr-payroll-open").addEventListener("click", function () { importInput.click(); });
  importInput.addEventListener("change", function () {
    importJson(importInput.files && importInput.files[0]);
    importInput.value = "";
  });
  document.getElementById("fr-hr-payroll-reset").addEventListener("click", function () {
    form.reset();
    invalidate();
    setStatus("Formulaire réinitialisé. Aucune donnée n'a été conservée.", false);
  });
})();
