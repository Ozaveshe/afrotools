(function (root) {
  "use strict";

  var STORAGE_KEY = "afro_sars_efiling_preparation_v1";
  var TASK_IDS = ["domain", "device", "records", "evidence", "payment", "support"];
  var fallback = {
    title: "Private preparation checklist",
    intro: "Track non-sensitive preparation steps in this browser. Do not enter a tax number, credentials, amounts, bank details or tax-record content.",
    tasks: {
      domain: "I will type or verify the official SARS domain myself.",
      device: "I will use a private device and a trusted network.",
      records: "I have gathered my records without uploading them here.",
      evidence: "I will compare SARS data with my own evidence.",
      payment: "I will verify any payment reference inside my SARS account.",
      support: "I will use an official SARS support route if anything is unclear."
    },
    progress: "{done} of {total} preparation checks complete",
    reset: "Reset checklist",
    json: "Download JSON",
    text: "Download TXT",
    pdf: "Download PDF",
    ready: "Preparation checklist ready.",
    saved: "Checklist saved on this device.",
    resetDone: "Checklist reset.",
    exported: "{format} preparation record downloaded.",
    exportError: "The preparation record could not be created.",
    reportTitle: "SARS eFiling preparation record",
    reviewed: "Official SARS routes reviewed 9 August 2026",
    disclaimer: "Independent preparation record only. This is not a return, assessment, filing, payment instruction or SARS confirmation.",
    complete: "Complete",
    incomplete: "Not complete"
  };

  var locale = Object.assign({}, fallback, root.AfroToolsSarsGuideLocale || {});
  locale.tasks = Object.assign({}, fallback.tasks, (root.AfroToolsSarsGuideLocale || {}).tasks || {});
  var recoveryMessages = {"en": {"unsaved": "Changes are available for this session only. Download JSON or TXT. Reset the checklist explicitly before saving over unreadable storage.", "loadError": "Saved checklist could not be read. It has been preserved; new choices remain in this session until you explicitly reset.", "resetError": "The saved checklist could not be reset. Your current choices are unchanged.", "portal": "Official portal"}, "sw": {"unsaved": "Mabadiliko yanapatikana katika kipindi hiki pekee. Pakua JSON au TXT. Futa orodha kwa hiari kabla ya kubadilisha hifadhi isiyosomeka.", "loadError": "Orodha iliyohifadhiwa haikuweza kusomwa. Imehifadhiwa bila kubadilishwa; chaguo mpya zitabaki katika kipindi hiki hadi uifute kwa hiari.", "resetError": "Orodha iliyohifadhiwa haikuweza kufutwa. Chaguo zako za sasa hazijabadilika.", "portal": "Tovuti rasmi"}};
  var recovery = recoveryMessages[document.documentElement.lang] || recoveryMessages.en;
  var protectedStorage = false;
  var state = { version: 1, tasks: {} };
  var elements = {};

  function interpolate(message, values) {
    return Object.keys(values || {}).reduce(function (result, key) {
      return result.replaceAll("{" + key + "}", String(values[key]));
    }, String(message || ""));
  }

  function cleanState(candidate) {
    var clean = { version: 1, tasks: {} };
    if (!candidate || candidate.version !== 1 || !candidate.tasks || typeof candidate.tasks !== "object") return clean;
    TASK_IDS.forEach(function (id) { clean.tasks[id] = candidate.tasks[id] === true; });
    return clean;
  }

  function loadState() {
    try {
      var raw=localStorage.getItem(STORAGE_KEY);
      if(!raw){state=cleanState(null);return;}
      var candidate=JSON.parse(raw);
      if(!candidate||candidate.version!==1||!candidate.tasks||typeof candidate.tasks!=="object"||Array.isArray(candidate.tasks)||TASK_IDS.some(function(id){return id in candidate.tasks&&typeof candidate.tasks[id]!=="boolean";}))throw new Error("invalid");
      state=cleanState(candidate);
    } catch (error) {
      protectedStorage=true;
      state=cleanState(null);
    }
  }

  function saveState(candidate, replace) {
    if(protectedStorage&&!replace)return false;
    try {localStorage.setItem(STORAGE_KEY,JSON.stringify(cleanState(candidate)));protectedStorage=false;return true;}
    catch(ignore){protectedStorage=true;return false;}
  }

  function resetState() {
    var next=cleanState(null);
    if(!saveState(next,true)){setStatus(recovery.resetError);return false;}
    state=next;render();setStatus(locale.resetDone);return true;
  }

  function setStatus(message) {
    if (elements.status) elements.status.textContent = message;
  }

  function render() {
    var done = TASK_IDS.filter(function (id) { return state.tasks[id] === true; }).length;
    TASK_IDS.forEach(function (id) {
      var button = document.querySelector('[data-sars-task="' + id + '"]');
      if (!button) return;
      var checked = state.tasks[id] === true;
      button.setAttribute("aria-checked", String(checked));
      button.classList.toggle("is-complete", checked);
      var marker = button.querySelector(".se-task-marker");
      if (marker) marker.textContent = checked ? "✓" : "";
    });
    if (elements.progress) elements.progress.textContent = interpolate(locale.progress, { done: done, total: TASK_IDS.length });
    if (elements.meter) elements.meter.style.width = Math.round(done / TASK_IDS.length * 100) + "%";
  }

  function reportData() {
    return {
      schema: "afrotools.sars-efiling-preparation.v1",
      reviewedOn: "2026-08-09",
      officialPortal: "https://secure.sarsefiling.co.za/",
      sourcePages: [
        "https://www.sars.gov.za/individuals/how-do-i-register-for-tax/register-for-efiling/",
        "https://www.sars.gov.za/types-of-tax/personal-income-tax/filing-season/",
        "https://www.sars.gov.za/types-of-tax/personal-income-tax/filing-season/how-does-auto-assessment-work/"
      ],
      tasks: TASK_IDS.map(function (id) { return { id: id, label: locale.tasks[id], complete: state.tasks[id] === true }; }),
      disclaimer: locale.disclaimer
    };
  }

  function reportText() {
    var report = reportData();
    return [
      locale.reportTitle,
      locale.reviewed,
      "",
      ...report.tasks.map(function (task) { return (task.complete ? "[x] " : "[ ] ") + task.label; }),
      "",
      locale.disclaimer,
      "",
      recovery.portal + ": " + report.officialPortal
    ].join("\n");
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  async function exportPdf() {
    if (!root.PDFLib || !root.PDFLib.PDFDocument) throw new Error("PDFLib unavailable");
    var documentPdf = await root.PDFLib.PDFDocument.create();
    documentPdf.setTitle(locale.reportTitle);
    documentPdf.setSubject(locale.disclaimer);
    documentPdf.setCreator("AfroTools local SARS eFiling preparation guide");
    var page = documentPdf.addPage([595, 842]);
    var font = await documentPdf.embedFont(root.PDFLib.StandardFonts.Helvetica);
    var bold = await documentPdf.embedFont(root.PDFLib.StandardFonts.HelveticaBold);
    var y = 790;
    page.drawText(locale.reportTitle, { x: 48, y: y, size: 17, font: bold });
    y -= 28;
    page.drawText(locale.reviewed, { x: 48, y: y, size: 9, font: font });
    y -= 30;
    reportData().tasks.forEach(function (task) {
      var prefix = task.complete ? "[x] " : "[ ] ";
      var text = (prefix + task.label).replace(/[^\x20-\x7E]/g, "-");
      var lines = [];
      var words = text.split(/\s+/);
      var line = "";
      words.forEach(function (word) {
        var next = line ? line + " " + word : word;
        if (font.widthOfTextAtSize(next, 10) > 490 && line) { lines.push(line); line = word; } else line = next;
      });
      if (line) lines.push(line);
      lines.forEach(function (part) { page.drawText(part, { x: 48, y: y, size: 10, font: font }); y -= 15; });
      y -= 8;
    });
    y -= 8;
    var disclaimer = locale.disclaimer.replace(/[^\x20-\x7E]/g, "-");
    var disclaimerLine = "";
    disclaimer.split(/\s+/).forEach(function (word) {
      var next = disclaimerLine ? disclaimerLine + " " + word : word;
      if (font.widthOfTextAtSize(next, 8) > 490 && disclaimerLine) {
        page.drawText(disclaimerLine, { x: 48, y: y, size: 8, font: font });
        y -= 13; disclaimerLine = word;
      } else disclaimerLine = next;
    });
    if (disclaimerLine) page.drawText(disclaimerLine, { x: 48, y: y, size: 8, font: font });
    var bytes = await documentPdf.save({ useObjectStreams: false });
    download(new Blob([bytes], { type: "application/pdf" }), "sars-efiling-preparation.pdf");
  }

  async function handleExport(format) {
    try {
      if (format === "json") download(new Blob([JSON.stringify(reportData(), null, 2)], { type: "application/json" }), "sars-efiling-preparation.json");
      if (format === "txt") download(new Blob([reportText()], { type: "text/plain;charset=utf-8" }), "sars-efiling-preparation.txt");
      if (format === "pdf") await exportPdf();
      setStatus(interpolate(locale.exported, { format: format.toUpperCase() }));
    } catch (error) {
      setStatus(locale.exportError);
    }
  }

  function buildWorkspace(host) {
    host.innerHTML = '<div class="se-head"><h2>' + locale.title + '</h2><p>' + locale.intro + '</p></div>' +
      '<div class="se-body"><div class="se-task-list">' + TASK_IDS.map(function (id) {
        return '<button type="button" class="se-task" role="checkbox" aria-checked="false" data-sars-task="' + id + '"><span class="se-task-marker" aria-hidden="true"></span><span>' + locale.tasks[id] + '</span></button>';
      }).join("") + '</div><div class="se-progress" aria-hidden="true"><i id="sarsProgressMeter"></i></div><p id="sarsProgress"></p>' +
      '<div class="se-workflow-actions"><button type="button" data-sars-export="json">' + locale.json + '</button><button type="button" data-sars-export="txt">' + locale.text + '</button><button type="button" data-sars-export="pdf">' + locale.pdf + '</button><button type="button" class="se-reset" id="sarsReset">' + locale.reset + '</button></div>' +
      '<p class="se-workflow-status" id="sarsWorkflowStatus" role="status" aria-live="polite">' + locale.ready + '</p></div>';
    elements.progress = document.getElementById("sarsProgress");
    elements.meter = document.getElementById("sarsProgressMeter");
    elements.status = document.getElementById("sarsWorkflowStatus");
    host.addEventListener("click", function (event) {
      var task = event.target.closest("[data-sars-task]");
      if (task) {
        var id = task.getAttribute("data-sars-task");
        state.tasks[id] = !state.tasks[id];
        var saved=saveState(state,false);
        render();
        setStatus(saved?locale.saved:recovery.unsaved);
        return;
      }
      var exportButton = event.target.closest("[data-sars-export]");
      if (exportButton) handleExport(exportButton.getAttribute("data-sars-export"));
    });
    document.getElementById("sarsReset").addEventListener("click", function () {
      if(resetState()){var first=host.querySelector("[data-sars-task]");if(first)first.focus();}
    });
  }

  function init() {
    var host = document.getElementById("sarsPreparationWorkspace");
    if (!host) return;
    loadState();
    buildWorkspace(host);
    render();
    if(protectedStorage)setStatus(recovery.loadError);
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.sarsEfilingGuide = {
      getState: function () { return cleanState(state); },
      reset: resetState,
      reportData: reportData
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(window);
