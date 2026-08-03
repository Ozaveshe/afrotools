(function () {
  "use strict";

  var configNode = document.getElementById("sw-hr-config");
  var form = document.getElementById("sw-hr-form");
  var resultPanel = document.getElementById("sw-hr-result");
  var resultBody = document.getElementById("sw-hr-result-body");
  var workflowNode = document.getElementById("sw-hr-workflow");
  var errorBox = document.getElementById("sw-hr-errors");
  var status = document.getElementById("sw-hr-status");
  var importInput = document.getElementById("sw-hr-import");
  var exportButtons = Array.prototype.slice.call(document.querySelectorAll("[data-sw-export]"));
  var state = { result: null };
  var config;

  if (!configNode || !form || !window.AfroTools || !window.AfroTools.swHrPayrollSix) return;
  try { config = JSON.parse(configNode.textContent); } catch (_) { return; }

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  function invalidate() {
    state.result = null;
    resultPanel.hidden = true;
    errorBox.hidden = true;
    exportButtons.forEach(function (button) { button.disabled = true; });
    setStatus("Umebadili taarifa. Kokotoa tena kabla ya kutumia matokeo au faili zake.", false);
  }

  function readInput() {
    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = String(value).trim(); });
    if (config.id === "maternity-leave") {
      ["country", "compareCountry"].forEach(function (name) {
        var field = form.elements.namedItem(name);
        data[name + "Label"] = field && field.selectedOptions[0] ? field.selectedOptions[0].textContent.trim() : "";
      });
    }
    return data;
  }

  function money(value) {
    return String(state.result.input.currency || "").trim() + " " + Number(value).toLocaleString("sw-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function display(row) {
    if (row[2] === "percent") return Number(row[1]).toLocaleString("sw-KE", { maximumFractionDigits: 2 }) + "%";
    if (row[2] === "years") return Number(row[1]).toLocaleString("sw-KE", { maximumFractionDigits: 2 }) + " mwaka";
    if (row[2] === "score") return Math.round(Number(row[1])) + "/100";
    if (row[2] === "text") return String(row[1]);
    return money(row[1]);
  }

  function heading(parent, text) {
    var node = document.createElement("h3");
    node.textContent = text;
    parent.appendChild(node);
  }

  function renderWorkflow(workflow) {
    workflowNode.textContent = "";
    workflowNode.hidden = !workflow;
    if (!workflow) return;
    if (workflow.details && workflow.details.length) {
      heading(workflowNode, "Muktadha wa mpango");
      var details = document.createElement("dl");
      details.className = "sw-hr-workflow-details";
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
      heading(workflowNode, "Hali za kulinganisha");
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
      heading(workflowNode, "Mambo ya kuthibitisha");
      var list = document.createElement("ul");
      workflow.checklist.forEach(function (item) {
        var li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      });
      workflowNode.appendChild(list);
    }
  }

  function renderResult(result) {
    resultBody.textContent = "";
    result.rows.forEach(function (item) {
      var row = document.createElement("tr");
      var label = document.createElement("th");
      var value = document.createElement("td");
      label.scope = "row";
      label.textContent = item[0];
      value.textContent = display(item);
      row.appendChild(label);
      row.appendChild(value);
      resultBody.appendChild(row);
    });
    renderWorkflow(result.workflow);
    document.getElementById("sw-hr-source-used").textContent = result.evidence.sourceLabel + " — " + result.evidence.sourceDate + " — " + result.evidence.jurisdiction;
    document.getElementById("sw-hr-freshness").textContent = result.evidence.label + " (siku " + result.evidence.ageDays + ")";
    document.getElementById("sw-hr-confidence").textContent = result.evidence.confidence;
    resultPanel.hidden = false;
    errorBox.hidden = true;
    exportButtons.forEach(function (button) { button.disabled = false; });
    setStatus("Makadirio yamekokotolewa. Faili zote sasa zinalingana na matokeo yanayoonekana.", false);
    resultPanel.focus();
  }

  function calculate(event) {
    if (event) event.preventDefault();
    var result = window.AfroTools.swHrPayrollSix.calculate(config.id, readInput());
    if (!result.valid) {
      state.result = null;
      resultPanel.hidden = true;
      exportButtons.forEach(function (button) { button.disabled = true; });
      errorBox.textContent = "";
      var strong = document.createElement("strong");
      strong.textContent = "Sahihisha sehemu hizi:";
      var list = document.createElement("ul");
      result.errors.forEach(function (message) { var li = document.createElement("li"); li.textContent = message; list.appendChild(li); });
      errorBox.appendChild(strong);
      errorBox.appendChild(list);
      errorBox.hidden = false;
      errorBox.focus();
      setStatus("Hatujakokotoa kwa sababu kuna taarifa batili.", true);
      return;
    }
    state.result = result;
    renderResult(result);
  }

  function reportObject() {
    return { schemaVersion: 1, locale: "sw", toolId: config.id, route: config.route, savedAt: new Date().toISOString(), input: state.result.input, result: state.result.values, rows: state.result.rows, workflow: state.result.workflow, evidence: state.result.evidence, disclaimer: "Haya ni makadirio ya kupanga, si ushauri wa kisheria, kodi au ajira." };
  }

  function reportText() {
    var report = reportObject();
    var lines = [config.title, ""];
    report.rows.forEach(function (row) {
      if (row[2] === "percent") lines.push(row[0] + ": " + Number(row[1]).toFixed(2) + "%");
      else if (row[2] === "years") lines.push(row[0] + ": " + Number(row[1]).toFixed(2) + " mwaka");
      else if (row[2] === "score") lines.push(row[0] + ": " + Math.round(Number(row[1])) + "/100");
      else if (row[2] === "text") lines.push(row[0] + ": " + row[1]);
      else lines.push(row[0] + ": " + report.input.currency + " " + Number(row[1]).toFixed(2));
    });
    if (report.workflow) {
      [["Muktadha wa mpango", report.workflow.details], ["Hali za kulinganisha", report.workflow.scenarios], ["Mambo ya kuthibitisha", report.workflow.checklist]].forEach(function (section) {
        if (!section[1] || !section[1].length) return;
        lines.push("", section[0]);
        section[1].forEach(function (item) {
          if (!Array.isArray(item)) lines.push("- " + item);
          else lines.push(item[0] + ": " + (item[2] === "money" ? report.input.currency + " " + Number(item[1]).toFixed(2) : item[1]));
        });
      });
    }
    lines.push("", "Mamlaka: " + report.evidence.jurisdiction, "Chanzo: " + report.evidence.sourceLabel, "Tarehe ya chanzo: " + report.evidence.sourceDate, "Upya wa chanzo: " + report.evidence.label + " (siku " + report.evidence.ageDays + ")", "Uhakika: " + report.evidence.confidence, "", report.disclaimer);
    return lines.join("\n");
  }

  function slug() { return "afrotools-" + config.id + "-sw-" + new Date().toISOString().slice(0, 10); }

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
    return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘]/g, "'").replace(/[—–−]/g, "-").replace(/[^\x20-\x7e\n]/g, " ");
  }

  function exportPdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) { setStatus("Maktaba ya PDF ya ndani haijapatikana. Jaribu tena baada ya ukurasa kumaliza kupakia.", true); return; }
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    var lines = doc.splitTextToSize(safePdfText(reportText()), 500);
    var y = 54;
    doc.setProperties({ title: safePdfText(config.title), subject: "Makadirio ya HR ya AfroTools", creator: "AfroTools" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    lines.forEach(function (line) { if (y > 790) { doc.addPage(); y = 54; } doc.text(line, 48, y); y += 14; });
    doc.save(slug() + ".pdf");
    setStatus("PDF imepakuliwa moja kwa moja kutoka kwenye kivinjari.", false);
  }

  function exportCurrent(type) {
    if (!state.result) return;
    if (type === "txt") download(slug() + ".txt", "text/plain;charset=utf-8", reportText());
    if (type === "json") download(slug() + ".json", "application/json;charset=utf-8", JSON.stringify(reportObject(), null, 2));
    if (type === "pdf") exportPdf();
    if (type === "copy") {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(reportText()).then(function () { setStatus("Muhtasari umenakiliwa.", false); }).catch(function () { setStatus("Kunakili moja kwa moja hakujafaulu. Tumia TXT au JSON.", true); });
      else setStatus("Kunakili moja kwa moja hakupatikani. Tumia TXT au JSON.", true);
    }
  }

  function importJson(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var saved = JSON.parse(String(reader.result || "{}"));
        if (saved.schemaVersion !== 1 || saved.locale !== "sw" || saved.toolId !== config.id || !saved.input) throw new Error("invalid");
        Object.keys(saved.input).forEach(function (name) { var field = form.elements.namedItem(name); if (field) field.value = String(saved.input[name]); });
        calculate();
        setStatus("JSON imefunguliwa tena na kukokotolewa ndani ya kivinjari.", false);
      } catch (_) { setStatus("JSON hii si rekodi halali ya zana hii.", true); }
    };
    reader.onerror = function () { setStatus("Imeshindikana kusoma faili la ndani.", true); };
    reader.readAsText(file);
  }

  form.addEventListener("submit", calculate);
  form.addEventListener("input", invalidate);
  form.addEventListener("change", invalidate);
  exportButtons.forEach(function (button) { button.addEventListener("click", function () { exportCurrent(button.getAttribute("data-sw-export")); }); });
  document.getElementById("sw-hr-open").addEventListener("click", function () { importInput.click(); });
  importInput.addEventListener("change", function () { importJson(importInput.files && importInput.files[0]); importInput.value = ""; });
  document.getElementById("sw-hr-reset").addEventListener("click", function () { form.reset(); invalidate(); setStatus("Fomu imewekwa upya. Hakuna taarifa iliyohifadhiwa.", false); });
})();
