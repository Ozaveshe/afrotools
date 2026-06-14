"use strict";
(function (window, document) {
  var NOTE = "Use this for job portals that prefer simple readable documents.";

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function lines(value) {
    return String(value || "")
      .split(/\n+/)
      .map(function (line) {
        return clean(line.replace(/^\s*(?:[-*]|\u2022|\d+\.)\s*/, ""));
      })
      .filter(Boolean);
  }

  function join(values, separator) {
    return values.map(clean).filter(Boolean).join(separator || " | ");
  }

  function state() {
    try {
      return window.CVApp && window.CVApp.getState ? window.CVApp.getState() : {};
    } catch (error) {
      return {};
    }
  }

  function data() {
    return state().data || {};
  }

  function dateRange(item) {
    return join([item.s || item.start || item.y1 || item.from, item.cur ? "Present" : item.e || item.end || item.y2 || item.to], " to ");
  }

  function addSection(output, heading, body) {
    var text = Array.isArray(body) ? body.filter(Boolean).join("\n\n") : clean(body);
    if (!text) return;
    output.push("");
    output.push(heading);
    output.push(text);
  }

  function buildAtsPlainText() {
    var cv = data();
    var output = [];
    output.push(join([cv.fn, cv.ln], " ") || cv.name || "Firstname Lastname");
    output.push(clean(cv.title || "Target role"));
    output.push(join([cv.email, join([cv.phoneCode, cv.phone], " "), cv.altPhone, cv.loc || cv.location, cv.linkedin || cv.li, cv.github, cv.web || cv.portfolio]));
    output.push("Note: " + NOTE);
    addSection(output, "Summary", cv.summary);
    addSection(output, "Experience", (cv.exps || cv.experience || []).map(function (job) {
      if (!clean(join([job.t, job.title, job.c, job.company, job.d, job.desc], " "))) return "";
      return [
        join([job.t || job.title || "Role", job.c || job.company || job.org, job.l || job.loc || job.location], " - "),
        dateRange(job),
        lines(job.d || job.desc || job.description).map(function (line) { return "- " + line; }).join("\n")
      ].filter(Boolean).join("\n");
    }));
    addSection(output, "Education", (cv.edus || cv.education || []).map(function (edu) {
      if (!clean(join([edu.deg, edu.degree, edu.sch, edu.school], " "))) return "";
      return [join([edu.deg || edu.degree || "Qualification", edu.sch || edu.school || edu.c, edu.loc || edu.location], " - "), dateRange(edu), clean(edu.g || edu.grade || edu.d)].filter(Boolean).join("\n");
    }));
    addSection(output, "Skills", [
      cv.skills && cv.skills.h ? "Technical: " + clean(cv.skills.h) : "",
      cv.skills && cv.skills.s ? "Workplace: " + clean(cv.skills.s) : "",
      cv.skills && cv.skills.t ? "Tools: " + clean(cv.skills.t) : ""
    ]);
    addSection(output, "Projects", (cv.projs || cv.projects || []).map(function (project) {
      if (!clean(join([project.n, project.name, project.d, project.desc], " "))) return "";
      return [project.n || project.name || "Project", project.tech ? "Tools: " + clean(project.tech) : "", clean(project.d || project.desc || project.description)].filter(Boolean).join("\n");
    }));
    addSection(output, "Certifications", (cv.certs || cv.certifications || []).map(function (cert) {
      return join([cert.n || cert.name || "Certification", cert.i || cert.issuer, cert.y || cert.year], " - ");
    }));
    addSection(output, "Languages", (cv.langs || cv.languages || []).map(function (language) {
      return typeof language === "string" ? clean(language) : join([language.l || language.name, language.lv || language.level], " - ");
    }));
    if (cv.showRefs || (cv.refs || cv.references || []).length) {
      addSection(output, "References", (cv.refs || cv.references || []).map(function (ref) {
        return typeof ref === "string" ? clean(ref) : [join([ref.n || ref.name || "Reference", ref.t || ref.title, ref.org], " - "), join([ref.e || ref.email, ref.p || ref.phone, ref.rel], " | ")].filter(Boolean).join("\n");
      }));
    } else {
      addSection(output, "References", "Available on request.");
    }
    return output.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  function filename(ext, label) {
    if (window.CVExportUpgrade && window.CVExportUpgrade.filename) return window.CVExportUpgrade.filename(ext, label);
    return "AfroTools-CV-" + (label || "ATS") + "." + ext;
  }

  function download(blob, name) {
    if (window.CVExportUpgrade && window.CVExportUpgrade.downloadBlob) return window.CVExportUpgrade.downloadBlob(blob, name);
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.dataset.noPdfGate = "true";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
  }

  function status(message) {
    if (window.CVExportUpgrade && window.CVExportUpgrade.status) window.CVExportUpgrade.status(message);
    if (window.CVApp && window.CVApp.showToast) window.CVApp.showToast(message);
  }

  function track(event, payload) {
    if (window.CVExportUpgrade && window.CVExportUpgrade.track) window.CVExportUpgrade.track(event, payload || {});
    else if (window.CVAnalytics && window.CVAnalytics.track) window.CVAnalytics.track(event, payload || {});
  }

  function exportTxt() {
    download(new Blob([buildAtsPlainText()], { type: "text/plain;charset=utf-8" }), filename("txt", "ATS"));
    status("ATS Plain TXT downloaded");
    track("cv_export_ats_plain", { format: "txt", template: state().template || "" });
  }

  function exportPdf() {
    var atsText = buildAtsPlainText();
    if (window.CVExportAtsPlainPdf && window.CVExportAtsPlainPdf.exportAtsPdf) return window.CVExportAtsPlainPdf.exportAtsPdf(atsText);
    if (window.CVExportPdfQuality && window.CVExportPdfQuality.exportAtsPdf) return window.CVExportPdfQuality.exportAtsPdf(atsText);
    status("ATS Plain PDF is unavailable. Download TXT instead.");
    return false;
  }

  function openModal() {
    var overlay = document.querySelector(".cv-export-modal-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "cv-export-modal-overlay";
      overlay.innerHTML = [
        '<div class="cv-export-modal" role="dialog" aria-modal="true" aria-label="ATS Plain Version">',
        '<div class="cv-export-modal-head">',
        "<div><h3>ATS Plain Version</h3><p>One column, standard headings, selectable text, no tables, photos, icons, or decorative layout.</p></div>",
        '<button type="button" data-export-close>Close</button>',
        "</div>",
        '<textarea data-export-ats-text spellcheck="true"></textarea>',
        '<div class="cv-export-modal-actions">',
        '<button type="button" data-export-copy-ats>Copy</button>',
        '<button type="button" data-export-download-ats>Download TXT</button>',
        '<button type="button" data-export-download-ats-pdf>Download ATS Plain PDF</button>',
        "</div>",
        "</div>"
      ].join("");
      document.body.appendChild(overlay);
      overlay.addEventListener("click", function (event) {
        if (event.target === overlay || event.target.closest("[data-export-close]")) overlay.classList.remove("open");
        if (event.target.closest("[data-export-copy-ats]")) {
          var value = overlay.querySelector("[data-export-ats-text]").value;
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(function () { status("ATS plain text copied"); });
        }
        if (event.target.closest("[data-export-download-ats]")) exportTxt();
        if (event.target.closest("[data-export-download-ats-pdf]")) exportPdf();
      });
    }
    overlay.querySelector("[data-export-ats-text]").value = buildAtsPlainText();
    overlay.classList.add("open");
  }

  function templateWarning() {
    var current = state();
    var cv = current.data || {};
    var meta = window.CVTemplateRegistry && window.CVTemplateRegistry.get ? window.CVTemplateRegistry.get(current.template || "") : null;
    var creative = meta && (meta.atsFriendly === false || meta.atsSafety === "Creative" || /creative|portfolio/i.test(meta.category || ""));
    var photo = cv.showPhoto || cv.photo || (meta && meta.photoSupport);
    return creative || photo ? "Creative or photo templates can parse poorly on job portals. Use ATS Plain PDF/TXT for portal uploads." : "";
  }

  function patchScoreWarning() {
    if (!window.CVAdvanced || window.CVAdvanced.__atsPlainWarningReady || !window.CVAdvanced.runATSSimulator) return;
    var original = window.CVAdvanced.runATSSimulator;
    window.CVAdvanced.runATSSimulator = function () {
      var result = original.apply(this, arguments);
      setTimeout(function () {
        var warning = templateWarning();
        var modal = document.querySelector("#cv-adv-ats, .cv-adv-modal, .cv-adv-overlay");
        if (warning && modal && !modal.querySelector("[data-ats-template-warning]")) {
          var block = document.createElement("div");
          block.setAttribute("data-ats-template-warning", "true");
          block.style.cssText = "margin:10px 0;padding:10px 12px;border:1px solid #fed7aa;border-radius:8px;background:#fff7ed;color:#9a3412;font-size:12px;line-height:1.45";
          block.textContent = warning;
          var target = modal.querySelector(".cv-adv-section") || modal.firstElementChild || modal;
          target.parentNode.insertBefore(block, target);
        }
      }, 40);
      return result;
    };
    window.CVAdvanced.__atsPlainWarningReady = true;
  }

  function patchExportUpgrade() {
    if (!window.CVExportUpgrade || window.CVExportUpgrade.__atsPlainModeReady) return;
    var original = window.CVExportUpgrade.handleExport;
    window.CVExportUpgrade.buildAtsPlainText = buildAtsPlainText;
    window.CVExportUpgrade.openAtsModal = openModal;
    window.CVExportUpgrade.exportText = exportTxt;
    window.CVExportUpgrade.exportAtsPdf = exportPdf;
    window.CVExportUpgrade.handleExport = function (mode) {
      if (mode === "ats") return openModal();
      if (mode === "ats-pdf") return exportPdf();
      if (mode === "text") return exportTxt();
      return original ? original.apply(this, arguments) : undefined;
    };
    window.CVExportUpgrade.__atsPlainModeReady = true;
  }

  function enhancePanel() {
    document.querySelectorAll(".cv-export-options").forEach(function (panel) {
      if (!panel.querySelector("[data-ats-plain-note]")) {
        var note = document.createElement("p");
        note.setAttribute("data-ats-plain-note", "true");
        note.style.cssText = "margin:8px 0 0;color:var(--color-text-muted);font-size:12px;line-height:1.4";
        note.textContent = NOTE;
        var actions = panel.querySelector(".cv-export-actions");
        if (actions) actions.parentNode.insertBefore(note, actions.nextSibling);
      }
    });
  }

  function boot() {
    patchExportUpgrade();
    patchScoreWarning();
    enhancePanel();
    setTimeout(boot, 800);
  }

  window.CVAtsPlainMode = { note: NOTE, buildText: buildAtsPlainText, exportPdf: exportPdf, exportTxt: exportTxt, templateWarning: templateWarning };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window, document);
