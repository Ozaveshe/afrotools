!function () {
  "use strict";

  var state = {
    file: null,
    fileBytes: null,
    pdf: null,
    pageCount: 0,
    currentPage: 1,
    pageSize: null,
    viewportScale: 1,
    boxes: {},
    history: [],
    drawing: null,
    busy: false,
    renderToken: 0,
    download: null
  };

  var els = {};
  var MAX_EXPORT_PIXELS = 18000000;
  var QUALITY = {
    compact: { dpi: 108, jpeg: 0.82 },
    balanced: { dpi: 144, jpeg: 0.9 },
    high: { dpi: 180, jpeg: 0.94 }
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(el, value) {
    if (el) el.textContent = value || "";
  }

  function pdfJs() {
    if (!window.pdfjsLib) throw new Error("PDF preview renderer failed to load. Please refresh the page.");
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/assets/vendor/pdfjs/pdf.worker.min.js";
    return window.pdfjsLib;
  }

  function pdfLib() {
    if (!window.PDFLib || !window.PDFLib.PDFDocument) throw new Error("PDF library failed to load. Please refresh the page.");
    return window.PDFLib;
  }

  function isPdf(file) {
    return !!file && (file.type === "application/pdf" || /\.pdf$/i.test(file.name || ""));
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    var units = ["B", "KB", "MB", "GB"];
    var value = bytes;
    var index = 0;
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index++;
    }
    return (index === 0 ? Math.round(value) : value.toFixed(value >= 10 ? 1 : 2)) + " " + units[index];
  }

  function cleanBaseName(name) {
    return String(name || "document")
      .replace(/\.pdf$/i, "")
      .replace(/[^a-z0-9._-]+/gi, "_")
      .replace(/^_+|_+$/g, "") || "document";
  }

  function boxesFor(pageNumber) {
    var key = String(pageNumber);
    if (!state.boxes[key]) state.boxes[key] = [];
    return state.boxes[key];
  }

  function countBoxes() {
    return Object.keys(state.boxes).reduce(function (sum, key) {
      return sum + state.boxes[key].length;
    }, 0);
  }

  function countPagesWithBoxes() {
    return Object.keys(state.boxes).filter(function (key) {
      return state.boxes[key] && state.boxes[key].length;
    }).length;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeColor(value) {
    var color = /^#[0-9a-f]{6}$/i.test(value || "") ? value : "#000000";
    return color.toUpperCase();
  }

  function colorParts(hex) {
    var safe = normalizeColor(hex);
    return {
      r: parseInt(safe.slice(1, 3), 16),
      g: parseInt(safe.slice(3, 5), 16),
      b: parseInt(safe.slice(5, 7), 16),
      hex: safe
    };
  }

  function luminance(hex) {
    var parts = colorParts(hex);
    return (0.299 * parts.r + 0.587 * parts.g + 0.114 * parts.b) / 255;
  }

  function currentStyle() {
    return {
      color: normalizeColor(els.colorHex.value || els.redactionColor.value),
      label: String(els.redactionLabel.value || "").trim().slice(0, 36)
    };
  }

  function setBusy(value, label) {
    state.busy = value;
    els.exportBtn.disabled = value || !state.pdf || countBoxes() === 0;
    els.exportBtn.textContent = value ? (label || "Working...") : "Export Redacted PDF";
    [
      els.dropZone, els.removeFileBtn, els.prevPageBtn, els.nextPageBtn, els.pageInput,
      els.zoomSelect, els.fullPageBtn, els.undoBtn, els.clearPageBtn, els.clearAllBtn, els.findBtn,
      els.clearSearchBtn
    ].forEach(function (el) {
      if (el) el.disabled = value || (el === els.findBtn && !state.pdf);
    });
    (els.patternButtons || []).forEach(function (button) {
      button.disabled = value || !state.pdf;
    });
    updateControls();
  }

  function resetResult(note) {
    state.download = null;
    els.resultCard.classList.toggle("on", !!note);
    setText(els.resultTitle, note ? "Status" : "");
    setText(els.resultNote, note || "");
    els.progressBar.classList.remove("on");
    els.progressFill.style.width = "0%";
    els.downloadRow.classList.remove("on");
  }

  function showResult(title, note) {
    els.resultCard.classList.add("on");
    setText(els.resultTitle, title);
    setText(els.resultNote, note || "");
  }

  function showProgress(percent, title, note) {
    showResult(title, note || "");
    els.progressBar.classList.add("on");
    els.progressFill.style.width = clamp(percent || 0, 0, 100) + "%";
  }

  function updateStats() {
    var total = countBoxes();
    var pageBoxes = state.pdf ? boxesFor(state.currentPage).length : 0;
    setText(els.boxCount, total + " box" + (total === 1 ? "" : "es"));
    if (!state.pdf) {
      setText(els.pageStatus, "No PDF loaded");
      return;
    }
    setText(
      els.pageStatus,
      pageBoxes + " redaction" + (pageBoxes === 1 ? "" : "s") + " on this page"
    );
  }

  function updateControls() {
    var hasPdf = !!state.pdf;
    var total = countBoxes();
    var pageHasBoxes = hasPdf && boxesFor(state.currentPage).length > 0;
    els.prevPageBtn.disabled = state.busy || !hasPdf || state.currentPage <= 1;
    els.nextPageBtn.disabled = state.busy || !hasPdf || state.currentPage >= state.pageCount;
    els.pageInput.disabled = state.busy || !hasPdf;
    els.zoomSelect.disabled = state.busy || !hasPdf;
    els.fullPageBtn.disabled = state.busy || !hasPdf;
    els.undoBtn.disabled = state.busy || !state.history.length;
    els.clearPageBtn.disabled = state.busy || !pageHasBoxes;
    els.clearAllBtn.disabled = state.busy || !total;
    els.findBtn.disabled = state.busy || !hasPdf;
    (els.patternButtons || []).forEach(function (button) {
      button.disabled = state.busy || !hasPdf;
    });
    els.exportBtn.disabled = state.busy || !hasPdf || !total;
    setText(els.pageTotal, "of " + (hasPdf ? state.pageCount : 0));
    els.pageInput.value = hasPdf ? state.currentPage : 1;
    updateStats();
  }

  function getFitScale(page) {
    var shellWidth = Math.max(320, els.editorShell.clientWidth - 54);
    var shellHeight = Math.max(360, window.innerHeight - 260);
    var viewport = page.getViewport({ scale: 1 });
    return Math.min(1.45, Math.max(0.35, Math.min(shellWidth / viewport.width, shellHeight / viewport.height)));
  }

  function canvasToPdfRect(rect) {
    var scale = state.viewportScale || 1;
    var pageHeight = state.pageSize.height;
    return {
      x: rect.x / scale,
      y: pageHeight - (rect.y + rect.h) / scale,
      w: rect.w / scale,
      h: rect.h / scale,
      color: rect.color,
      label: rect.label
    };
  }

  function pdfToCanvasRect(box, scale, pageHeight) {
    return {
      x: box.x * scale,
      y: (pageHeight - box.y - box.h) * scale,
      w: box.w * scale,
      h: box.h * scale,
      color: box.color,
      label: box.label
    };
  }

  function drawLabel(ctx, rect, label, fillColor) {
    if (!label || rect.w < 24 || rect.h < 12) return;
    var fontSize = clamp(Math.floor(Math.min(rect.h * 0.42, rect.w / Math.max(3, label.length) * 1.35)), 8, 18);
    ctx.save();
    ctx.fillStyle = luminance(fillColor) > 0.55 ? "#111827" : "#ffffff";
    ctx.font = "800 " + fontSize + "px DM Sans, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(8, rect.w - 8));
    ctx.restore();
  }

  function drawOverlay(tempRect) {
    var canvas = els.overlayCanvas;
    var ctx = canvas.getContext("2d");
    var scale = state.viewportScale || 1;
    var pageHeight = state.pageSize ? state.pageSize.height : 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    boxesFor(state.currentPage).forEach(function (box) {
      var rect = pdfToCanvasRect(box, scale, pageHeight);
      ctx.fillStyle = box.color || "#000000";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      drawLabel(ctx, rect, box.label, box.color || "#000000");
    });

    if (tempRect) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(tempRect.x, tempRect.y, tempRect.w, tempRect.h);
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 2;
      ctx.strokeRect(tempRect.x + 1, tempRect.y + 1, Math.max(1, tempRect.w - 2), Math.max(1, tempRect.h - 2));
      ctx.restore();
    }
  }

  async function renderPage() {
    if (!state.pdf) return;
    var token = ++state.renderToken;
    var page = await state.pdf.getPage(state.currentPage);
    if (token !== state.renderToken) return;

    var zoomValue = els.zoomSelect.value;
    var scale = zoomValue === "fit" ? getFitScale(page) : Number(zoomValue) || 1;
    state.viewportScale = scale;

    var viewport = page.getViewport({ scale: scale });
    state.pageSize = { width: viewport.width / scale, height: viewport.height / scale };

    var canvas = els.pdfCanvas;
    var overlay = els.overlayCanvas;
    var ratio = window.devicePixelRatio || 1;
    var width = Math.floor(viewport.width);
    var height = Math.floor(viewport.height);
    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    overlay.width = width;
    overlay.height = height;
    overlay.style.width = width + "px";
    overlay.style.height = height + "px";

    els.canvasWrap.style.width = width + "px";
    els.canvasWrap.style.height = height + "px";
    els.emptyState.style.display = "none";
    els.canvasWrap.classList.add("on");

    var context = canvas.getContext("2d");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    await page.render({ canvasContext: context, viewport: viewport, background: "white" }).promise;
    if (token !== state.renderToken) return;
    drawOverlay();
    updateControls();
  }

  async function loadPdf(file) {
    if (!isPdf(file)) {
      showResult("Unsupported file", "Choose a standard PDF file.");
      return;
    }
    setBusy(true, "Loading PDF...");
    resetResult("Loading PDF...");
    try {
      var bytes = new Uint8Array(await file.arrayBuffer());
      var loadingTask = pdfJs().getDocument({ data: bytes.slice(0), useWorkerFetch: false });
      var pdf = await loadingTask.promise;
      state.file = file;
      state.fileBytes = bytes;
      state.pdf = pdf;
      state.pageCount = pdf.numPages;
      state.currentPage = 1;
      state.boxes = {};
      state.history = [];
      state.download = null;
      setText(els.fileName, file.name);
      setText(els.fileMeta, formatBytes(file.size) + " - " + pdf.numPages + " page" + (pdf.numPages === 1 ? "" : "s"));
      els.fileSummary.classList.add("on");
      els.resultCard.classList.remove("on");
      await renderPage();
      showResult("PDF loaded", "Drag on the preview to redact, or use search to add reviewable boxes.");
    } catch (error) {
      clearPdf(false);
      showResult("Could not open PDF", error && error.message ? error.message : "The PDF could not be read in the browser.");
    } finally {
      setBusy(false);
      updateControls();
    }
  }

  function clearPdf(clearInput) {
    state.file = null;
    state.fileBytes = null;
    state.pdf = null;
    state.pageCount = 0;
    state.currentPage = 1;
    state.pageSize = null;
    state.boxes = {};
    state.history = [];
    state.download = null;
    els.fileSummary.classList.remove("on");
    setText(els.fileName, "No file selected");
    setText(els.fileMeta, "");
    els.emptyState.style.display = "flex";
    els.canvasWrap.classList.remove("on");
    els.pdfCanvas.getContext("2d").clearRect(0, 0, els.pdfCanvas.width, els.pdfCanvas.height);
    els.overlayCanvas.getContext("2d").clearRect(0, 0, els.overlayCanvas.width, els.overlayCanvas.height);
    if (clearInput) els.fileInput.value = "";
    resetResult("");
    updateControls();
  }

  function addBox(pageNumber, box, source) {
    boxesFor(pageNumber).push(box);
    state.history.push({ page: pageNumber, box: box, source: source || "manual" });
    updateControls();
  }

  function undoLast() {
    if (!state.history.length || state.busy) return;
    var item = state.history.pop();
    var boxes = boxesFor(item.page);
    var index = boxes.lastIndexOf(item.box);
    if (index >= 0) boxes.splice(index, 1);
    if (item.page === state.currentPage) drawOverlay();
    updateControls();
  }

  function clearCurrentPage() {
    if (!state.pdf || state.busy) return;
    state.boxes[String(state.currentPage)] = [];
    state.history = state.history.filter(function (item) { return item.page !== state.currentPage; });
    drawOverlay();
    updateControls();
  }

  function clearAll() {
    if (!state.pdf || state.busy) return;
    state.boxes = {};
    state.history = [];
    drawOverlay();
    resetResult("");
    updateControls();
  }

  function pointerPosition(event) {
    var rect = els.overlayCanvas.getBoundingClientRect();
    var scaleX = els.overlayCanvas.width / rect.width;
    var scaleY = els.overlayCanvas.height / rect.height;
    return {
      x: clamp((event.clientX - rect.left) * scaleX, 0, els.overlayCanvas.width),
      y: clamp((event.clientY - rect.top) * scaleY, 0, els.overlayCanvas.height)
    };
  }

  function normalizeCanvasRect(a, b, style) {
    var x = Math.min(a.x, b.x);
    var y = Math.min(a.y, b.y);
    return {
      x: x,
      y: y,
      w: Math.abs(b.x - a.x),
      h: Math.abs(b.y - a.y),
      color: style.color,
      label: style.label
    };
  }

  function onPointerDown(event) {
    if (!state.pdf || state.busy || event.button && event.button !== 0) return;
    event.preventDefault();
    els.overlayCanvas.setPointerCapture(event.pointerId);
    state.drawing = {
      id: event.pointerId,
      start: pointerPosition(event),
      current: pointerPosition(event),
      style: currentStyle()
    };
  }

  function onPointerMove(event) {
    if (!state.drawing || state.drawing.id !== event.pointerId) return;
    event.preventDefault();
    state.drawing.current = pointerPosition(event);
    var rect = normalizeCanvasRect(state.drawing.start, state.drawing.current, state.drawing.style);
    drawOverlay(rect);
  }

  function onPointerUp(event) {
    if (!state.drawing || state.drawing.id !== event.pointerId) return;
    event.preventDefault();
    var rect = normalizeCanvasRect(state.drawing.start, pointerPosition(event), state.drawing.style);
    state.drawing = null;
    if (rect.w >= 8 && rect.h >= 8) {
      addBox(state.currentPage, canvasToPdfRect(rect), "manual");
    }
    drawOverlay();
  }

  function searchTerms() {
    return String(els.searchTerms.value || "")
      .split(/[\n,]+/)
      .map(function (term) { return term.trim(); })
      .filter(Boolean);
  }

  function itemTextMatches(text, terms, mode) {
    var source = String(text || "");
    if (!source) return false;
    var normalized = source.toLowerCase();
    return terms.some(function (term) {
      var needle = term.toLowerCase();
      return mode === "exact" ? normalized.trim() === needle : normalized.indexOf(needle) !== -1;
    });
  }

  function pagesForSelectedScope() {
    return els.searchScope.value === "all"
      ? Array.from({ length: state.pageCount }, function (_, index) { return index + 1; })
      : [state.currentPage];
  }

  function makeTextRunBox(item, viewport, padding, style) {
    var tx = pdfJs().Util.transform(viewport.transform, item.transform);
    var x = tx[4];
    var y = tx[5];
    var height = Math.max(Math.abs(tx[3]), item.height || 10, 8);
    var width = Math.max(item.width || 0, String(item.str || "").length * height * 0.45, 8);
    var pageHeight = viewport.height;
    var box = {
      x: clamp(x - padding, 0, viewport.width),
      y: clamp(pageHeight - y - padding, 0, pageHeight),
      w: clamp(width + padding * 2, 1, viewport.width),
      h: clamp(height + padding * 2, 1, pageHeight),
      color: style.color,
      label: style.label
    };
    if (box.x + box.w > viewport.width) box.w = viewport.width - box.x;
    if (box.y + box.h > pageHeight) box.h = pageHeight - box.y;
    return box;
  }

  async function addSearchMatches() {
    if (!state.pdf || state.busy) return;
    var terms = searchTerms();
    if (!terms.length) {
      showResult("Add search terms", "Enter at least one word, name, number, or phrase to find.");
      return;
    }

    setBusy(true, "Searching...");
    var style = currentStyle();
    var padding = clamp(Number(els.paddingInput.value) || 0, 0, 18);
    var mode = els.matchMode.value;
    var pages = pagesForSelectedScope();
    var added = 0;

    try {
      for (var i = 0; i < pages.length; i++) {
        var pageNumber = pages[i];
        showProgress((i / pages.length) * 100, "Searching page " + pageNumber, "Adding reviewable boxes for visible text matches.");
        var page = await state.pdf.getPage(pageNumber);
        var viewport = page.getViewport({ scale: 1 });
        var textContent = await page.getTextContent();

        textContent.items.forEach(function (item) {
          if (!itemTextMatches(item.str, terms, mode)) return;
          var box = makeTextRunBox(item, viewport, padding, style);
          if (box.w > 0 && box.h > 0) {
            addBox(pageNumber, box, "search");
            added++;
          }
        });
      }

      if (added) {
        showResult("Matches added", "Added " + added + " redaction box" + (added === 1 ? "" : "es") + ". Review the marked pages before export.");
      } else {
        showResult("No matches found", "No visible text runs matched those terms. Try a shorter term or use manual redaction.");
      }
      if (pages.indexOf(state.currentPage) !== -1) drawOverlay();
    } catch (error) {
      showResult("Search failed", error && error.message ? error.message : "Could not search this PDF.");
    } finally {
      setBusy(false);
      updateControls();
    }
  }

  function patternDefinition(id) {
    var map = {
      email: { name: "email addresses", regex: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i },
      phone: { name: "phone numbers", regex: /\+?\d[\d\s().-]{6,}\d/ },
      card: { name: "card-like numbers", regex: /(?:\d[ -]*?){13,19}/ }
    };
    return map[id] || null;
  }

  async function addPatternMatches(patternId) {
    if (!state.pdf || state.busy) return;
    var pattern = patternDefinition(patternId);
    if (!pattern) return;
    setBusy(true, "Searching...");
    var style = currentStyle();
    var padding = clamp(Number(els.paddingInput.value) || 0, 0, 18);
    var pages = pagesForSelectedScope();
    var added = 0;

    try {
      for (var i = 0; i < pages.length; i++) {
        var pageNumber = pages[i];
        showProgress((i / pages.length) * 100, "Finding " + pattern.name, "Adding reviewable boxes for common sensitive-data patterns.");
        var page = await state.pdf.getPage(pageNumber);
        var viewport = page.getViewport({ scale: 1 });
        var textContent = await page.getTextContent();

        textContent.items.forEach(function (item) {
          if (!pattern.regex.test(String(item.str || ""))) return;
          pattern.regex.lastIndex = 0;
          var box = makeTextRunBox(item, viewport, padding, style);
          if (box.w > 0 && box.h > 0) {
            addBox(pageNumber, box, "pattern");
            added++;
          }
        });
      }

      if (added) {
        showResult("Pattern matches added", "Added " + added + " " + pattern.name + " redaction box" + (added === 1 ? "" : "es") + ". Review before export.");
      } else {
        showResult("No pattern matches", "No visible " + pattern.name + " were found in the selected scope.");
      }
      if (pages.indexOf(state.currentPage) !== -1) drawOverlay();
    } catch (error) {
      showResult("Pattern search failed", error && error.message ? error.message : "Could not search this PDF.");
    } finally {
      setBusy(false);
      updateControls();
    }
  }

  async function addFullPageRedaction() {
    if (!state.pdf || state.busy) return;
    setBusy(true, "Marking page...");
    try {
      var page = await state.pdf.getPage(state.currentPage);
      var viewport = page.getViewport({ scale: 1 });
      var style = currentStyle();
      addBox(state.currentPage, {
        x: 0,
        y: 0,
        w: viewport.width,
        h: viewport.height,
        color: style.color,
        label: style.label
      }, "page");
      drawOverlay();
      showResult("Full page marked", "The current page is fully covered. Use undo or clear page if that was not intended.");
    } catch (error) {
      showResult("Could not mark page", error && error.message ? error.message : "Full-page redaction failed.");
    } finally {
      setBusy(false);
      updateControls();
    }
  }

  function qualitySettings() {
    return QUALITY[els.qualitySelect.value] || QUALITY.balanced;
  }

  function pageExportScale(page, settings) {
    var viewport = page.getViewport({ scale: 1 });
    var desired = settings.dpi / 72;
    var pixels = viewport.width * desired * viewport.height * desired;
    if (pixels > MAX_EXPORT_PIXELS) {
      desired = Math.sqrt(MAX_EXPORT_PIXELS / (viewport.width * viewport.height));
    }
    return Math.max(0.8, desired);
  }

  function blobFromCanvas(canvas, type, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) reject(new Error("Could not render page image."));
        else resolve(blob);
      }, type, quality);
    });
  }

  async function blobToUint8(blob) {
    return new Uint8Array(await blob.arrayBuffer());
  }

  async function exportRedacted() {
    if (!state.pdf || state.busy || countBoxes() === 0) return;
    setBusy(true, "Exporting...");
    state.download = null;
    var settings = qualitySettings();
    var lib = pdfLib();
    var out = await lib.PDFDocument.create();

    try {
      for (var pageNumber = 1; pageNumber <= state.pageCount; pageNumber++) {
        showProgress(((pageNumber - 1) / state.pageCount) * 100, "Flattening page " + pageNumber, "Rendering page images and burning in redaction boxes.");
        var page = await state.pdf.getPage(pageNumber);
        var scale = pageExportScale(page, settings);
        var viewport = page.getViewport({ scale: scale });
        var baseViewport = page.getViewport({ scale: 1 });
        var canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        var ctx = canvas.getContext("2d", { alpha: false });
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: viewport, background: "white" }).promise;

        (state.boxes[String(pageNumber)] || []).forEach(function (box) {
          var rect = pdfToCanvasRect(box, scale, baseViewport.height);
          ctx.fillStyle = box.color || "#000000";
          ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
          drawLabel(ctx, rect, box.label, box.color || "#000000");
        });

        var blob = await blobFromCanvas(canvas, "image/jpeg", settings.jpeg);
        var jpg = await out.embedJpg(await blobToUint8(blob));
        var pdfPage = out.addPage([baseViewport.width, baseViewport.height]);
        pdfPage.drawImage(jpg, { x: 0, y: 0, width: baseViewport.width, height: baseViewport.height });
        canvas.width = 1;
        canvas.height = 1;
      }

      var bytes = await out.save({ useObjectStreams: true, addDefaultPage: false });
      state.download = {
        blob: new Blob([bytes], { type: "application/pdf" }),
        filename: cleanBaseName(state.file && state.file.name) + "_redacted.pdf",
        bytes: bytes
      };
      showProgress(100, "Redacted PDF ready", "Flattened " + state.pageCount + " page" + (state.pageCount === 1 ? "" : "s") + " with " + countBoxes() + " redaction box" + (countBoxes() === 1 ? "" : "es") + " across " + countPagesWithBoxes() + " page" + (countPagesWithBoxes() === 1 ? "" : "s") + ".");
      els.downloadRow.classList.add("on");
    } catch (error) {
      showResult("Export failed", error && error.message ? error.message : "Could not export this PDF.");
      els.downloadRow.classList.remove("on");
    } finally {
      setBusy(false);
      updateControls();
    }
  }

  function downloadFile() {
    if (!state.download) return;
    var runDownload = function () {
      var url = URL.createObjectURL(state.download.blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = state.download.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    };
    var gate = document.querySelector("email-gate-modal");
    if (gate && typeof gate.show === "function") gate.show(runDownload);
    else runDownload();
  }

  function bindDropZone() {
    els.dropZone.addEventListener("click", function () {
      if (!state.busy) els.fileInput.click();
    });
    els.dropZone.addEventListener("keydown", function (event) {
      if ((event.key === "Enter" || event.key === " ") && !state.busy) {
        event.preventDefault();
        els.fileInput.click();
      }
    });
    els.dropZone.addEventListener("dragover", function (event) {
      event.preventDefault();
      els.dropZone.classList.add("dragover");
    });
    els.dropZone.addEventListener("dragleave", function () {
      els.dropZone.classList.remove("dragover");
    });
    els.dropZone.addEventListener("drop", function (event) {
      event.preventDefault();
      els.dropZone.classList.remove("dragover");
      if (event.dataTransfer.files && event.dataTransfer.files[0]) loadPdf(event.dataTransfer.files[0]);
    });
    els.fileInput.addEventListener("change", function (event) {
      if (event.target.files && event.target.files[0]) loadPdf(event.target.files[0]);
      event.target.value = "";
    });
  }

  function goToPage(pageNumber) {
    if (!state.pdf || state.busy) return;
    var target = clamp(Math.round(Number(pageNumber) || 1), 1, state.pageCount);
    if (target === state.currentPage) {
      els.pageInput.value = target;
      return;
    }
    state.currentPage = target;
    renderPage().catch(function (error) {
      showResult("Preview failed", error && error.message ? error.message : "Could not render this page.");
    });
  }

  function bindControls() {
    els.prevPageBtn.addEventListener("click", function () { goToPage(state.currentPage - 1); });
    els.nextPageBtn.addEventListener("click", function () { goToPage(state.currentPage + 1); });
    els.pageInput.addEventListener("change", function () { goToPage(els.pageInput.value); });
    els.zoomSelect.addEventListener("change", function () { renderPage(); });
    els.fullPageBtn.addEventListener("click", addFullPageRedaction);
    els.undoBtn.addEventListener("click", undoLast);
    els.clearPageBtn.addEventListener("click", clearCurrentPage);
    els.clearAllBtn.addEventListener("click", clearAll);
    els.removeFileBtn.addEventListener("click", function () { clearPdf(true); });
    els.findBtn.addEventListener("click", addSearchMatches);
    els.clearSearchBtn.addEventListener("click", function () {
      els.searchTerms.value = "";
      showResult("Terms cleared", "Search terms were cleared. Existing redaction boxes remain until you undo or clear them.");
    });
    els.exportBtn.addEventListener("click", exportRedacted);
    els.downloadBtn.addEventListener("click", downloadFile);
    (els.patternButtons || []).forEach(function (button) {
      button.addEventListener("click", function () {
        addPatternMatches(button.dataset.pattern);
      });
    });
    els.redactionColor.addEventListener("input", function () {
      els.colorHex.value = normalizeColor(els.redactionColor.value);
    });
    els.colorHex.addEventListener("input", function () {
      var value = normalizeColor(els.colorHex.value);
      els.colorHex.value = value;
      els.redactionColor.value = value;
    });
    els.overlayCanvas.addEventListener("pointerdown", onPointerDown);
    els.overlayCanvas.addEventListener("pointermove", onPointerMove);
    els.overlayCanvas.addEventListener("pointerup", onPointerUp);
    els.overlayCanvas.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("resize", function () {
      window.clearTimeout(bindControls.resizeTimer);
      bindControls.resizeTimer = window.setTimeout(function () {
        if (state.pdf && els.zoomSelect.value === "fit") renderPage();
      }, 150);
    });
  }

  function init() {
    els.dropZone = byId("dropZone");
    els.fileInput = byId("fileInput");
    els.fileSummary = byId("fileSummary");
    els.fileName = byId("fileName");
    els.fileMeta = byId("fileMeta");
    els.removeFileBtn = byId("removeFileBtn");
    els.prevPageBtn = byId("prevPageBtn");
    els.nextPageBtn = byId("nextPageBtn");
    els.pageInput = byId("pageInput");
    els.pageTotal = byId("pageTotal");
    els.pageStatus = byId("pageStatus");
    els.zoomSelect = byId("zoomSelect");
    els.fullPageBtn = byId("fullPageBtn");
    els.undoBtn = byId("undoBtn");
    els.clearPageBtn = byId("clearPageBtn");
    els.clearAllBtn = byId("clearAllBtn");
    els.editorShell = byId("editorShell");
    els.emptyState = byId("emptyState");
    els.canvasWrap = byId("canvasWrap");
    els.pdfCanvas = byId("pdfCanvas");
    els.overlayCanvas = byId("overlayCanvas");
    els.redactionColor = byId("redactionColor");
    els.colorHex = byId("colorHex");
    els.redactionLabel = byId("redactionLabel");
    els.paddingInput = byId("paddingInput");
    els.boxCount = byId("boxCount");
    els.searchTerms = byId("searchTerms");
    els.searchScope = byId("searchScope");
    els.matchMode = byId("matchMode");
    els.findBtn = byId("findBtn");
    els.clearSearchBtn = byId("clearSearchBtn");
    els.patternButtons = Array.from(document.querySelectorAll("[data-pattern]"));
    els.qualitySelect = byId("qualitySelect");
    els.exportBtn = byId("exportBtn");
    els.resultCard = byId("resultCard");
    els.resultTitle = byId("resultTitle");
    els.resultNote = byId("resultNote");
    els.progressBar = byId("progressBar");
    els.progressFill = byId("progressFill");
    els.downloadRow = byId("downloadRow");
    els.downloadBtn = byId("downloadBtn");

    try {
      pdfJs();
      pdfLib();
      bindDropZone();
      bindControls();
      updateControls();
    } catch (error) {
      showResult("PDF tools unavailable", error && error.message ? error.message : "Required PDF libraries could not load.");
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}();
