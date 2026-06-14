"use strict";
(function (window, document) {
  function text(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function lines(value) {
    return String(value || "").replace(/\r\n?/g, "\n").trim();
  }

  function state() {
    try {
      return window.CVApp && window.CVApp.getState ? window.CVApp.getState() : {};
    } catch (error) {
      return {};
    }
  }

  function cvData() {
    return state().data || {};
  }

  function safeFilePart(value) {
    return (
      text(value)
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, " and ")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-")
        .slice(0, 90) || "cv"
    );
  }

  function baseName(target) {
    var cv = cvData();
    return safeFilePart([cv.fn || cv.firstName, cv.ln || cv.lastName, (target && target.role) || cv.title || "cv"].filter(Boolean).join("-"));
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

  function crc32(bytes) {
    var table = crc32.table || (crc32.table = Array.from({ length: 256 }, function (_, value) {
      for (var index = 0; index < 8; index += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      return value >>> 0;
    }));
    var crc = -1;
    for (var index = 0; index < bytes.length; index += 1) crc = (crc >>> 8) ^ table[(crc ^ bytes[index]) & 255];
    return (-1 ^ crc) >>> 0;
  }

  function u16(value) {
    return [value & 255, (value >>> 8) & 255];
  }

  function u32(value) {
    return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255];
  }

  async function bytes(value) {
    if (value instanceof Blob) return new Uint8Array(await value.arrayBuffer());
    if (value instanceof Uint8Array) return value;
    return new TextEncoder().encode(String(value || ""));
  }

  async function buildZip(entries) {
    var parts = [];
    var central = [];
    var offset = 0;
    for (var index = 0; index < entries.length; index += 1) {
      var entry = entries[index];
      var name = new TextEncoder().encode(entry.name);
      var data = await bytes(entry.blob || entry.content || "");
      var crc = crc32(data);
      var local = new Uint8Array([].concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0)));
      parts.push(local, name, data);
      central.push({ name: name, crc: crc, size: data.length, offset: offset });
      offset += local.length + name.length + data.length;
    }
    var centralStart = offset;
    central.forEach(function (entry) {
      var header = new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(entry.crc), u32(entry.size), u32(entry.size), u16(entry.name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(entry.offset)));
      parts.push(header, entry.name);
      offset += header.length + entry.name.length;
    });
    var centralSize = offset - centralStart;
    parts.push(new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(centralSize), u32(centralStart), u16(0))));
    return new Blob(parts, { type: "application/zip" });
  }

  async function designedPdfBlob() {
    if (!window.CVExportPdfQuality || !window.CVExportPdfQuality.renderPreviewCanvas || !window.loadPdfLibs) throw new Error("Designed PDF export is unavailable.");
    await window.loadPdfLibs();
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error("PDF library unavailable.");
    var canvas = await window.CVExportPdfQuality.renderPreviewCanvas({});
    var pdf = new window.jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    var pageWidth = pdf.internal.pageSize.getWidth();
    var pageHeight = pdf.internal.pageSize.getHeight();
    var width = pageWidth - 12;
    var height = width * (canvas.height / canvas.width);
    var y = 0;
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.96), "JPEG", 6, 6, width, height, undefined, "FAST");
    while (y + pageHeight - 12 < height) {
      y += pageHeight - 12;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.96), "JPEG", 6, 6 - y, width, height, undefined, "FAST");
    }
    return pdf.output("blob");
  }

  function atsPdfBlob(plainText) {
    if (window.CVExportAtsPlainPdf && window.CVExportAtsPlainPdf.buildPdf) return new Blob([window.CVExportAtsPlainPdf.buildPdf(plainText)], { type: "application/pdf" });
    throw new Error("ATS Plain PDF export is unavailable.");
  }

  function docxBlob() {
    if (!window.CVDocxExport || !window.CVDocxExport.isAvailable || !window.CVDocxExport.isAvailable() || !window.CVDocxExport.buildBlob) throw new Error("DOCX export is unavailable in this browser.");
    return window.CVDocxExport.buildBlob();
  }

  function collectTarget(panel) {
    panel = panel || document.querySelector(".cv-application-pack-panel");
    var saved = {};
    try {
      saved = JSON.parse(localStorage.getItem("afro_cv_copilot_target") || "{}");
    } catch (error) {
      saved = {};
    }
    return {
      role: text((panel && panel.querySelector("[data-pack-role]") || {}).value || saved.role || cvData().title),
      company: text((panel && panel.querySelector("[data-pack-company]") || {}).value || saved.company),
      jd: lines((panel && panel.querySelector("[data-pack-jd]") || {}).value || saved.jd),
      tone: text((panel && panel.querySelector("[data-pack-tone]") || {}).value || saved.tone || "formal")
    };
  }

  function collectPackText(panel, target) {
    var generated = {};
    if (window.CVApplicationPack && window.CVApplicationPack.generatePack) {
      try {
        generated = window.CVApplicationPack.generatePack(cvData(), target || {});
      } catch (error) {
        generated = {};
      }
    }
    panel = panel || document.querySelector(".cv-application-pack-panel");
    if (panel) {
      panel.querySelectorAll("[data-pack-text]").forEach(function (field) {
        generated[field.dataset.packText] = lines(field.value) || generated[field.dataset.packText] || "";
      });
    }
    return generated;
  }

  function backupJson(target, pack) {
    return JSON.stringify({ version: 1, source: "afrotools-cv-builder", exportedAt: new Date().toISOString(), target: target, country: state().country || "", template: state().template || "", data: cvData(), applicationPack: pack }, null, 2);
  }

  async function buildApplicationPack(panel) {
    var target = collectTarget(panel);
    var name = baseName(target);
    var pack = collectPackText(panel, target);
    var atsText = window.CVAtsPlainMode && window.CVAtsPlainMode.buildText ? window.CVAtsPlainMode.buildText() : window.CVExportUpgrade.buildAtsPlainText();
    var entries = [];
    entries.push({ name: name + "-cv.pdf", blob: await designedPdfBlob() });
    entries.push({ name: name + "-ats-plain-cv.pdf", blob: atsPdfBlob(atsText) });
    entries.push({ name: name + "-cv.docx", blob: docxBlob() });
    entries.push({ name: name + "-cv.txt", content: atsText });
    if (lines(pack.coverLetter)) {
      entries.push({ name: name + "-cover-letter.txt", content: pack.coverLetter });
      entries.push({ name: name + "-cover-letter.pdf", blob: atsPdfBlob(pack.coverLetter) });
    }
    entries.push({
      name: name + "-application-email.txt",
      content: lines(pack.emailMessage) || ["Subject: Application for " + (target.role || cvData().title || "the role"), "", "Dear Hiring Team,", "", "Please find attached my CV and application materials for " + (target.role || "the role") + (target.company ? " at " + target.company : "") + ".", "", "Kind regards,", [cvData().fn, cvData().ln].filter(Boolean).join(" ") || "[your name]"].join("\n")
    });
    entries.push({ name: name + "-backup.json", content: backupJson(target, pack) });
    return { blob: await buildZip(entries), filename: name + "-application-pack.zip", entries: entries.map(function (entry) { return entry.name; }) };
  }

  async function downloadApplicationPack(panel) {
    if (!window.Blob || !window.TextEncoder || !window.URL) {
      status("Application Pack ZIP is unavailable in this browser.");
      return false;
    }
    try {
      status("Building application pack...");
      var pack = await buildApplicationPack(panel || document.querySelector(".cv-application-pack-panel"));
      download(pack.blob, pack.filename);
      status("Application Pack downloaded");
      track("cv_application_pack_downloaded", { template: state().template || "", country: state().country || "", files: pack.entries.length });
      return true;
    } catch (error) {
      console.error("Application Pack export failed:", error);
      status(error && error.message ? error.message : "Application Pack export failed.");
      return false;
    }
  }

  function available() {
    return !!(window.Blob && window.URL && window.TextEncoder && window.CVDocxExport && window.CVDocxExport.isAvailable && window.CVDocxExport.isAvailable());
  }

  function enhancePanels() {
    document.querySelectorAll(".cv-application-pack-panel .cv-pack-toolbar").forEach(function (toolbar) {
      if (!toolbar.querySelector("[data-pack-download]")) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "primary";
        button.setAttribute("data-pack-download", "true");
        button.textContent = "Download Application Pack";
        toolbar.insertBefore(button, toolbar.firstChild);
      }
      toolbar.querySelectorAll("[data-pack-download]").forEach(function (button) {
        button.disabled = !available();
        button.title = available() ? "Download a ZIP with CV, ATS, DOCX, letter, email, and backup files" : "DOCX export is unavailable in this browser";
      });
    });
    document.querySelectorAll(".cv-export-actions").forEach(function (actions) {
      if (!actions.querySelector('[data-cv-export="pack"]')) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "cv-export-btn primary";
        button.dataset.cvExport = "pack";
        button.textContent = "Download Application Pack";
        actions.appendChild(button);
      }
      actions.querySelectorAll('[data-cv-export="pack"]').forEach(function (button) {
        button.disabled = !available();
        button.title = available() ? "Download all application files in one ZIP" : "DOCX export is unavailable in this browser";
      });
    });
  }

  function patchExportUpgrade() {
    if (!window.CVExportUpgrade || window.CVExportUpgrade.__applicationPackExportReady) return;
    var original = window.CVExportUpgrade.handleExport;
    window.CVExportUpgrade.handleExport = function (mode) {
      if (mode === "pack") return downloadApplicationPack();
      return original ? original.apply(this, arguments) : undefined;
    };
    window.CVExportUpgrade.__applicationPackExportReady = true;
  }

  function boot() {
    patchExportUpgrade();
    enhancePanels();
    setTimeout(boot, 900);
  }

  document.addEventListener("click", function (event) {
    var packButton = event.target.closest && event.target.closest("[data-pack-download]");
    if (packButton) {
      event.preventDefault();
      downloadApplicationPack(packButton.closest(".cv-application-pack-panel"));
    }
  }, true);

  window.CVApplicationPackExport = { isAvailable: available, buildZip: buildZip, buildApplicationPack: buildApplicationPack, download: downloadApplicationPack, safeFilePart: safeFilePart };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window, document);
