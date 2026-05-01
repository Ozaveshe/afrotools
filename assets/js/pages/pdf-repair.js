/* AfroTools PDF Repair */
(function () {
  "use strict";

  var state = {
    files: [],
    reports: [],
    outputs: [],
    activeRun: false
  };

  var els = {};
  var ids = [
    "pdfFileInput", "dropLabel", "fileInfo", "fileName", "fileSize", "queueList",
    "repairMode", "rasterScale", "openPassword", "reportFormat", "repairBtn",
    "clearBtn", "progressBar", "progressFill", "progressText", "resultCard",
    "statusBadge", "reportRows", "errorList", "errorListInner", "actionRow",
    "downloadBtn", "downloadZipBtn", "downloadReportBtn"
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function cacheElements() {
    ids.forEach(function (id) {
      els[id] = byId(id);
    });
  }

  function formatSize(bytes) {
    if (!Number.isFinite(bytes)) return "";
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  }

  function safeName(name) {
    return String(name || "document.pdf").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim() || "document.pdf";
  }

  function baseName(name) {
    return safeName(String(name || "document.pdf").replace(/\.pdf$/i, "")) || "document";
  }

  function cloneBytes(bytes) {
    if (!bytes) return null;
    if (bytes instanceof Uint8Array) return new Uint8Array(bytes);
    if (bytes instanceof ArrayBuffer) return new Uint8Array(bytes.slice(0));
    return new Uint8Array(bytes);
  }

  function isPdf(file) {
    return !!(file && ((file.type && file.type === "application/pdf") || /\.pdf$/i.test(file.name || "")));
  }

  function escapeHtml(value) {
    var div = document.createElement("div");
    div.textContent = String(value == null ? "" : value);
    return div.innerHTML;
  }

  function setProgress(percent, text) {
    if (els.progressBar) els.progressBar.classList.add("on");
    if (els.progressText) {
      els.progressText.classList.add("on");
      if (text) els.progressText.textContent = text;
    }
    if (els.progressFill) els.progressFill.style.width = Math.max(0, Math.min(100, percent)) + "%";
  }

  function hideProgress() {
    if (els.progressBar) els.progressBar.classList.remove("on");
    if (els.progressText) els.progressText.classList.remove("on");
    if (els.progressFill) els.progressFill.style.width = "0%";
  }

  function updateControls() {
    var hasFiles = state.files.length > 0;
    if (els.repairBtn) els.repairBtn.disabled = !hasFiles || state.activeRun;
    if (els.clearBtn) els.clearBtn.disabled = !hasFiles || state.activeRun;
  }

  function statusLabel(status) {
    if (status === "success") return "Repaired";
    if (status === "partial") return "Partial";
    if (status === "failed") return "Failed";
    if (status === "working") return "Working";
    return "Queued";
  }

  function renderQueue() {
    if (!els.queueList) return;
    els.queueList.textContent = "";

    if (!state.files.length) {
      if (els.fileInfo) els.fileInfo.classList.remove("on");
      updateControls();
      return;
    }

    if (els.fileInfo) els.fileInfo.classList.add("on");
    if (els.fileName) els.fileName.textContent = state.files.length + " PDF" + (state.files.length === 1 ? "" : "s") + " selected";
    if (els.fileSize) {
      var total = state.files.reduce(function (sum, item) { return sum + item.file.size; }, 0);
      els.fileSize.textContent = formatSize(total);
    }

    state.files.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "queue-row";
      var left = document.createElement("div");
      var name = document.createElement("div");
      name.className = "queue-name";
      name.textContent = item.file.name;
      var meta = document.createElement("div");
      meta.className = "queue-meta";
      meta.textContent = formatSize(item.file.size) + (item.report && item.report.pages ? " | " + item.report.pages + " pages" : "");
      left.appendChild(name);
      left.appendChild(meta);
      var badge = document.createElement("span");
      badge.className = "queue-state";
      badge.textContent = statusLabel(item.status);
      row.appendChild(left);
      row.appendChild(badge);
      els.queueList.appendChild(row);
    });
    updateControls();
  }

  function clearAll() {
    state.files = [];
    state.reports = [];
    state.outputs = [];
    if (els.pdfFileInput) els.pdfFileInput.value = "";
    if (els.resultCard) els.resultCard.classList.remove("on");
    if (els.actionRow) els.actionRow.style.display = "none";
    if (els.downloadZipBtn) els.downloadZipBtn.style.display = "none";
    hideProgress();
    renderQueue();
  }

  function addFiles(fileList) {
    var incoming = Array.prototype.slice.call(fileList || []).filter(isPdf);
    if (!incoming.length) return;
    incoming.forEach(function (file) {
      state.files.push({
        id: Date.now() + "-" + Math.random().toString(16).slice(2),
        file: file,
        status: "queued",
        report: null,
        output: null
      });
    });
    state.reports = [];
    state.outputs = [];
    if (els.resultCard) els.resultCard.classList.remove("on");
    if (els.actionRow) els.actionRow.style.display = "none";
    renderQueue();
  }

  function markerBytes(text) {
    var out = [];
    for (var i = 0; i < text.length; i += 1) out.push(text.charCodeAt(i) & 255);
    return out;
  }

  function indexOfBytes(bytes, marker, fromIndex) {
    var start = Math.max(0, fromIndex || 0);
    for (var i = start; i <= bytes.length - marker.length; i += 1) {
      var ok = true;
      for (var j = 0; j < marker.length; j += 1) {
        if (bytes[i + j] !== marker[j]) {
          ok = false;
          break;
        }
      }
      if (ok) return i;
    }
    return -1;
  }

  function lastIndexOfBytes(bytes, marker) {
    for (var i = bytes.length - marker.length; i >= 0; i -= 1) {
      var ok = true;
      for (var j = 0; j < marker.length; j += 1) {
        if (bytes[i + j] !== marker[j]) {
          ok = false;
          break;
        }
      }
      if (ok) return i;
    }
    return -1;
  }

  function bytesToText(bytes, maxBytes) {
    var limit = Math.min(bytes.length, maxBytes || 900000);
    var chunks = [];
    for (var i = 0; i < limit; i += 16384) {
      var slice = bytes.subarray(i, Math.min(i + 16384, limit));
      chunks.push(String.fromCharCode.apply(null, Array.prototype.slice.call(slice)));
    }
    return chunks.join("");
  }

  function analyzeBytes(bytes) {
    var pdfMarker = markerBytes("%PDF-");
    var eofMarker = markerBytes("%%EOF");
    var startXrefMarker = markerBytes("startxref");
    var xrefMarker = markerBytes("xref");
    var trailerMarker = markerBytes("trailer");
    var headerOffset = indexOfBytes(bytes, pdfMarker, 0);
    var eofOffset = lastIndexOfBytes(bytes, eofMarker);
    var startXrefOffset = lastIndexOfBytes(bytes, startXrefMarker);
    var xrefOffset = lastIndexOfBytes(bytes, xrefMarker);
    var trailerOffset = lastIndexOfBytes(bytes, trailerMarker);
    var sample = bytesToText(bytes, 1200000);
    var issues = [];
    var hints = [];
    var objectMatches = sample.match(/\b\d+\s+\d+\s+obj\b/g) || [];
    var version = "unknown";
    var headerText = headerOffset >= 0 ? bytesToText(bytes.subarray(headerOffset, Math.min(headerOffset + 16, bytes.length)), 16) : "";
    var versionMatch = headerText.match(/%PDF-(\d\.\d)/);
    if (versionMatch) version = versionMatch[1];

    if (headerOffset < 0) issues.push("No %PDF header was found.");
    else if (headerOffset > 0) issues.push("PDF header starts after " + headerOffset + " extra byte" + (headerOffset === 1 ? "" : "s") + ".");
    else hints.push("Header starts at byte 0.");

    if (eofOffset < 0) issues.push("EOF marker is missing.");
    else {
      hints.push("EOF marker found.");
      if (bytes.length - eofOffset > 2048) issues.push("Large trailing data exists after EOF.");
    }

    if (startXrefOffset < 0) issues.push("startxref marker is missing.");
    if (xrefOffset < 0) issues.push("xref table marker was not found.");
    if (trailerOffset < 0) issues.push("trailer marker was not found.");
    if (/\/Encrypt\b/.test(sample)) issues.push("File appears encrypted. Enter its open password if repair fails.");
    if (/\/Linearized\b/.test(sample)) hints.push("Linearized PDF detected.");
    if (bytes.length < 256) issues.push("File is unusually small for a PDF.");

    return {
      version: version,
      headerOffset: headerOffset,
      eofOffset: eofOffset,
      startXrefOffset: startXrefOffset,
      xrefOffset: xrefOffset,
      trailerOffset: trailerOffset,
      objectCountHint: objectMatches.length,
      encryptedHint: /\/Encrypt\b/.test(sample),
      linearizedHint: /\/Linearized\b/.test(sample),
      issues: issues,
      hints: hints
    };
  }

  async function validatePdf(bytes, password) {
    var pages = 0;
    var textItems = 0;
    try {
      var pdfjs = await window.PdfUtils.ensurePdfJs();
      var loading = pdfjs.getDocument({ data: cloneBytes(bytes), password: password || undefined });
      var doc = await loading.promise;
      pages = doc.numPages || 0;
      if (pages > 0) {
        var firstPage = await doc.getPage(1);
        var content = await firstPage.getTextContent().catch(function () { return null; });
        textItems = content && content.items ? content.items.length : 0;
      }
    } catch (err) {
      throw new Error("Validation failed: " + (err && err.message ? err.message : "output cannot be opened"));
    }
    if (!pages) throw new Error("Validation failed: output has no pages.");
    return { pages: pages, textItems: textItems };
  }

  async function qpdfApi(logs) {
    if (!window.QPDF) throw new Error("qpdf repair engine did not load.");
    window.QPDF.path = "/assets/vendor/qpdf/";
    return new Promise(function (resolve, reject) {
      var timeout = setTimeout(function () {
        reject(new Error("qpdf engine timed out while starting."));
      }, 20000);
      window.QPDF({
        keepAlive: true,
        logger: function (line) {
          if (line) logs.push(line);
        },
        ready: function (api) {
          clearTimeout(timeout);
          resolve(api);
        }
      });
    });
  }

  function qpdfSave(api, name, bytes) {
    return new Promise(function (resolve, reject) {
      api.save(name, cloneBytes(bytes), function (err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  function qpdfExecute(api, args) {
    return new Promise(function (resolve, reject) {
      api.execute(args, function (err) {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  function qpdfLoad(api, name) {
    return new Promise(function (resolve, reject) {
      api.load(name, function (err, data) {
        if (err) reject(err);
        else resolve(cloneBytes(data));
      });
    });
  }

  async function repairWithQpdf(bytes, password, logs) {
    var api = await qpdfApi(logs);
    try {
      await qpdfSave(api, "input.pdf", bytes);
      var args = ["--warning-exit-0", "--object-streams=disable"];
      if (password) args.push("--password=" + password, "--decrypt");
      args.push("input.pdf", "output.pdf");
      await qpdfExecute(api, args);
      var output = await qpdfLoad(api, "output.pdf");
      return { bytes: output, method: "qpdf structural rebuild" };
    } finally {
      if (api && api.terminate) api.terminate();
    }
  }

  async function normalizeWithPdfLib(bytes, password) {
    if (!window.PDFLib) throw new Error("pdf-lib did not load.");
    if (password) throw new Error("pdf-lib normalization cannot open password-protected PDFs in this browser.");
    var lib = window.PDFLib;
    var pdf = await lib.PDFDocument.load(cloneBytes(bytes), {
      ignoreEncryption: false,
      parseSpeed: lib.ParseSpeeds ? lib.ParseSpeeds.Fastest : undefined,
      updateMetadata: false
    });
    var pageCount = pdf.getPageCount();
    if (!pageCount) throw new Error("No recoverable pages were found.");
    pdf.setProducer("AfroTools PDF Repair");
    pdf.setModificationDate(new Date());
    var saved = await pdf.save({ useObjectStreams: false, addDefaultPage: false });
    return { bytes: cloneBytes(saved), method: "pdf-lib compatibility normalization" };
  }

  function canvasToPngBytes(canvas) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) {
          reject(new Error("Could not render page image."));
          return;
        }
        blob.arrayBuffer().then(function (buffer) {
          resolve(new Uint8Array(buffer));
        }).catch(reject);
      }, "image/png");
    });
  }

  async function rasterSalvage(bytes, password, scale) {
    if (!window.PDFLib || !window.PdfUtils) throw new Error("PDF salvage libraries did not load.");
    var pdfjs = await window.PdfUtils.ensurePdfJs();
    var source = await pdfjs.getDocument({ data: cloneBytes(bytes), password: password || undefined }).promise;
    if (!source.numPages) throw new Error("No renderable pages were found.");
    var output = await window.PDFLib.PDFDocument.create();
    var renderScale = Math.max(0.75, Math.min(2, parseFloat(scale) || 1.25));

    for (var pageNum = 1; pageNum <= source.numPages; pageNum += 1) {
      setProgress(55 + Math.round((pageNum / source.numPages) * 30), "Salvaging page " + pageNum + " of " + source.numPages + "...");
      var page = await source.getPage(pageNum);
      var viewport = page.getViewport({ scale: renderScale });
      var canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport }).promise;
      var pngBytes = await canvasToPngBytes(canvas);
      var png = await output.embedPng(pngBytes);
      var outPage = output.addPage([viewport.width, viewport.height]);
      outPage.drawImage(png, { x: 0, y: 0, width: viewport.width, height: viewport.height });
    }

    output.setProducer("AfroTools PDF Repair raster salvage");
    output.setModificationDate(new Date());
    var saved = await output.save({ useObjectStreams: false });
    return { bytes: cloneBytes(saved), method: "raster page salvage", rasterized: true };
  }

  async function tryStrategy(mode, bytes, password, logs) {
    if (mode === "qpdf") return repairWithQpdf(bytes, password, logs);
    if (mode === "normalize") return normalizeWithPdfLib(bytes, password);
    if (mode === "raster") return rasterSalvage(bytes, password, els.rasterScale && els.rasterScale.value);

    var failures = [];
    try {
      return await repairWithQpdf(bytes, password, logs);
    } catch (err1) {
      failures.push("qpdf rebuild: " + (err1 && err1.message ? err1.message : err1));
    }
    try {
      return await normalizeWithPdfLib(bytes, password);
    } catch (err2) {
      failures.push("pdf-lib normalization: " + (err2 && err2.message ? err2.message : err2));
    }
    try {
      var salvaged = await rasterSalvage(bytes, password, els.rasterScale && els.rasterScale.value);
      salvaged.warnings = failures;
      return salvaged;
    } catch (err3) {
      failures.push("raster salvage: " + (err3 && err3.message ? err3.message : err3));
      var finalError = new Error("All repair strategies failed.");
      finalError.failures = failures;
      throw finalError;
    }
  }

  async function repairOne(item, index, total) {
    var file = item.file;
    var password = els.openPassword && els.openPassword.value ? els.openPassword.value : "";
    var mode = els.repairMode && els.repairMode.value || "auto";
    var logs = [];
    var started = new Date().toISOString();
    item.status = "working";
    renderQueue();
    setProgress(Math.round((index / total) * 100), "Reading " + file.name + "...");

    var report = {
      file: file.name,
      originalSize: file.size,
      startedAt: started,
      finishedAt: null,
      status: "failed",
      method: "",
      pages: 0,
      repairedSize: 0,
      diagnostics: null,
      warnings: [],
      errors: [],
      qpdfLog: []
    };

    try {
      var bytes = new Uint8Array(await file.arrayBuffer());
      report.diagnostics = analyzeBytes(bytes);
      report.warnings = report.warnings.concat(report.diagnostics.issues || []);
      setProgress(Math.round((index / total) * 100) + 8, "Repairing " + file.name + "...");
      var result = await tryStrategy(mode, bytes, password, logs);
      report.method = result.method;
      report.qpdfLog = logs.slice(-12);
      if (result.warnings) report.warnings = report.warnings.concat(result.warnings);
      setProgress(Math.round((index / total) * 100) + 18, "Validating repaired PDF...");
      var validation = await validatePdf(result.bytes, "");
      report.pages = validation.pages;
      report.repairedSize = result.bytes.length;
      report.status = report.warnings.length || result.rasterized ? "partial" : "success";
      item.output = {
        name: baseName(file.name) + "_repaired.pdf",
        bytes: result.bytes,
        method: result.method
      };
      item.status = report.status;
    } catch (err) {
      report.status = "failed";
      item.status = "failed";
      if (err && err.failures) report.errors = report.errors.concat(err.failures);
      else report.errors.push(err && err.message ? err.message : "Repair failed.");
      report.qpdfLog = logs.slice(-12);
    } finally {
      report.finishedAt = new Date().toISOString();
      item.report = report;
      renderQueue();
    }
    return report;
  }

  async function repairAll() {
    if (!state.files.length || state.activeRun) return;
    state.activeRun = true;
    state.reports = [];
    state.outputs = [];
    if (els.resultCard) els.resultCard.classList.remove("on");
    if (els.actionRow) els.actionRow.style.display = "none";
    updateControls();

    try {
      for (var i = 0; i < state.files.length; i += 1) {
        var report = await repairOne(state.files[i], i, state.files.length);
        state.reports.push(report);
        if (state.files[i].output) state.outputs.push(state.files[i].output);
      }
      setProgress(100, "Done");
      setTimeout(hideProgress, 450);
      renderReport();
    } finally {
      state.activeRun = false;
      updateControls();
    }
  }

  function renderReport() {
    var repaired = state.reports.filter(function (r) { return r.status === "success" || r.status === "partial"; }).length;
    var failed = state.reports.filter(function (r) { return r.status === "failed"; }).length;
    var partial = state.reports.filter(function (r) { return r.status === "partial"; }).length;
    var overall = failed && !repaired ? "failed" : partial || failed ? "partial" : "success";
    if (els.resultCard) els.resultCard.classList.add("on");
    if (els.statusBadge) {
      els.statusBadge.textContent = overall === "success" ? "Repaired" : overall === "partial" ? "Mixed" : "Failed";
      els.statusBadge.className = "status-badge " + (overall === "success" ? "status-success" : overall === "partial" ? "status-partial" : "status-failed");
    }

    if (els.reportRows) {
      var pages = state.reports.reduce(function (sum, report) { return sum + (report.pages || 0); }, 0);
      var html = [
        '<div class="summary-grid">',
        '<div class="summary-stat"><strong>' + repaired + '</strong><span>Recovered</span></div>',
        '<div class="summary-stat"><strong>' + failed + '</strong><span>Failed</span></div>',
        '<div class="summary-stat"><strong>' + pages + '</strong><span>Pages</span></div>',
        '</div>'
      ];
      state.reports.forEach(function (report) {
        html.push(buildRow(report.file, statusLabel(report.status)));
        if (report.method) html.push(buildRow("Method", report.method));
        if (report.pages) html.push(buildRow("Pages recovered", report.pages));
        if (report.repairedSize) html.push(buildRow("Repaired size", formatSize(report.repairedSize)));
      });
      els.reportRows.innerHTML = html.join("");
    }

    var messages = [];
    state.reports.forEach(function (report) {
      report.warnings.forEach(function (warning) { messages.push(report.file + ": " + warning); });
      report.errors.forEach(function (error) { messages.push(report.file + ": " + error); });
    });

    if (els.errorList && els.errorListInner) {
      if (messages.length) {
        els.errorList.style.display = "block";
        els.errorListInner.innerHTML = messages.map(function (message) {
          return '<div style="padding:4px 0;border-bottom:1px solid #f3f4f6;">' + escapeHtml(message) + "</div>";
        }).join("");
      } else {
        els.errorList.style.display = "none";
        els.errorListInner.textContent = "";
      }
    }

    var logLines = [];
    state.reports.forEach(function (report) {
      if (report.qpdfLog && report.qpdfLog.length) {
        logLines.push(report.file);
        logLines = logLines.concat(report.qpdfLog.slice(-6));
      }
    });
    if (els.errorListInner && logLines.length && messages.length) {
      els.errorListInner.insertAdjacentHTML("beforeend", '<div class="repair-log">' + escapeHtml(logLines.join("\n")) + "</div>");
    }

    if (els.actionRow) els.actionRow.style.display = state.outputs.length ? "grid" : "none";
    if (els.downloadBtn) els.downloadBtn.style.display = state.outputs.length === 1 ? "flex" : "none";
    if (els.downloadZipBtn) els.downloadZipBtn.style.display = state.outputs.length > 1 ? "flex" : "none";
    if (els.downloadReportBtn) els.downloadReportBtn.style.display = state.reports.length ? "flex" : "none";
  }

  function buildRow(label, value) {
    return '<div class="report-row"><span class="report-label">' + escapeHtml(label) + '</span><span class="report-value">' + escapeHtml(value) + "</span></div>";
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  function gatedDownload(fn) {
    var gate = document.querySelector("email-gate-modal");
    if (gate && typeof gate.show === "function") gate.show(fn);
    else fn();
  }

  function downloadSingle() {
    if (!state.outputs.length) return;
    var output = state.outputs[0];
    downloadBlob(new Blob([output.bytes], { type: "application/pdf" }), output.name);
  }

  async function downloadZip() {
    if (!state.outputs.length || !window.JSZip) return;
    var zip = new window.JSZip();
    state.outputs.forEach(function (output) {
      zip.file(output.name, output.bytes);
    });
    zip.file("pdf-repair-report." + (els.reportFormat && els.reportFormat.value === "csv" ? "csv" : "json"), buildReportText());
    var blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "afrotools-pdf-repair.zip");
  }

  function csvCell(value) {
    var text = String(value == null ? "" : value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function buildReportText() {
    var format = els.reportFormat && els.reportFormat.value || "json";
    if (format === "csv") {
      var lines = ["file,status,method,original_size,repaired_size,pages,issues,errors,finished_at"];
      state.reports.forEach(function (report) {
        lines.push([
          csvCell(report.file),
          report.status,
          csvCell(report.method),
          report.originalSize,
          report.repairedSize,
          report.pages,
          csvCell(report.warnings.join(" | ")),
          csvCell(report.errors.join(" | ")),
          report.finishedAt
        ].join(","));
      });
      return lines.join("\r\n");
    }
    return JSON.stringify({
      tool: "AfroTools PDF Repair",
      createdAt: new Date().toISOString(),
      reports: state.reports
    }, null, 2);
  }

  function downloadReport() {
    if (!state.reports.length) return;
    var format = els.reportFormat && els.reportFormat.value || "json";
    var type = format === "csv" ? "text/csv;charset=utf-8" : "application/json";
    downloadBlob(new Blob([buildReportText()], { type: type }), "pdf-repair-report." + format);
  }

  function bindEvents() {
    if (els.pdfFileInput) {
      els.pdfFileInput.addEventListener("change", function () {
        addFiles(els.pdfFileInput.files);
      });
    }
    if (els.dropLabel) {
      els.dropLabel.addEventListener("dragover", function (event) {
        event.preventDefault();
        els.dropLabel.classList.add("dragover");
      });
      els.dropLabel.addEventListener("dragleave", function () {
        els.dropLabel.classList.remove("dragover");
      });
      els.dropLabel.addEventListener("drop", function (event) {
        event.preventDefault();
        els.dropLabel.classList.remove("dragover");
        addFiles(event.dataTransfer && event.dataTransfer.files);
      });
    }
    if (els.repairBtn) els.repairBtn.addEventListener("click", repairAll);
    if (els.clearBtn) els.clearBtn.addEventListener("click", clearAll);
    if (els.downloadBtn) els.downloadBtn.addEventListener("click", function () { gatedDownload(downloadSingle); });
    if (els.downloadZipBtn) els.downloadZipBtn.addEventListener("click", function () { gatedDownload(downloadZip); });
    if (els.downloadReportBtn) els.downloadReportBtn.addEventListener("click", downloadReport);

    document.querySelectorAll(".faq-q").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var answer = btn.nextElementSibling;
        var isOpen = btn.classList.contains("open");
        document.querySelectorAll(".faq-q").forEach(function (item) { item.classList.remove("open"); });
        document.querySelectorAll(".faq-a").forEach(function (item) { item.classList.remove("open"); });
        if (!isOpen && answer) {
          btn.classList.add("open");
          answer.classList.add("open");
        }
      });
    });
  }

  function init() {
    cacheElements();
    bindEvents();
    if (els.actionRow) els.actionRow.style.display = "none";
    renderQueue();
    if (!window.PDFLib || !window.PdfUtils || !window.QPDF) {
      if (els.resultCard) els.resultCard.classList.add("on");
      if (els.statusBadge) {
        els.statusBadge.textContent = "Engine missing";
        els.statusBadge.className = "status-badge status-failed";
      }
      if (els.reportRows) els.reportRows.innerHTML = buildRow("Error", "PDF repair libraries did not load. Refresh the page and try again.");
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
