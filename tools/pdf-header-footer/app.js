!function () {
  "use strict";

  var ZIP_NAME = "header_footer_pdfs.zip";
  var state = {
    files: [],
    results: [],
    download: null,
    previewBytes: null,
    previewDoc: null,
    previewPage: 1,
    previewToken: 0,
    busy: false,
    activeField: null
  };
  var els = {};
  var FONT_MAP = {
    Helvetica: "Helvetica",
    HelveticaBold: "HelveticaBold",
    TimesRoman: "TimesRoman",
    TimesRomanBold: "TimesRomanBold",
    Courier: "Courier",
    CourierBold: "CourierBold"
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(el, value) {
    if (el) el.textContent = value || "";
  }

  function pdfLib() {
    if (!window.PDFLib || !window.PDFLib.PDFDocument) throw new Error("PDF library failed to load. Please refresh the page.");
    return window.PDFLib;
  }

  function pdfJs() {
    if (!window.pdfjsLib) throw new Error("PDF preview renderer failed to load. Please refresh the page.");
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/assets/vendor/pdfjs/pdf.worker.min.js";
    return window.pdfjsLib;
  }

  function isPdf(file) {
    return !!file && (file.type === "application/pdf" || /\.pdf$/i.test(file.name || ""));
  }

  function fileKey(file) {
    return [file.name, file.size, file.lastModified].join(":");
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

  function cleanBaseName(name, fallback) {
    return String(name || fallback || "document")
      .replace(/\.pdf$/i, "")
      .replace(/[^a-z0-9._-]+/gi, "_")
      .replace(/^_+|_+$/g, "") || fallback || "document";
  }

  function clamp(value, min, max, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) number = fallback;
    number = Math.max(min, number);
    if (max != null) number = Math.min(max, number);
    return number;
  }

  function normalizeColor(value, fallback) {
    var color = /^#[0-9a-f]{6}$/i.test(value || "") ? value : fallback || "#111827";
    return color.toUpperCase();
  }

  function hexToRgb01(hex) {
    var color = normalizeColor(hex, "#111827");
    return {
      r: parseInt(color.slice(1, 3), 16) / 255,
      g: parseInt(color.slice(3, 5), 16) / 255,
      b: parseInt(color.slice(5, 7), 16) / 255,
      hex: color
    };
  }

  function mmToPt(mm) {
    return Number(mm || 0) * 72 / 25.4;
  }

  function selectedTextFields() {
    return ["hLeft", "hCenter", "hRight", "fLeft", "fCenter", "fRight"].map(function (id) {
      return els[id];
    });
  }

  function hasAnyText(settings) {
    return Object.keys(settings.zones).some(function (key) {
      return !!settings.zones[key];
    });
  }

  function getSettings() {
    var textColor = normalizeColor(els.textColorHex.value || els.textColor.value, "#111827");
    var lineColor = normalizeColor(els.lineColorHex.value || els.lineColor.value, "#CBD5E1");
    return {
      zones: {
        hLeft: els.hLeft.value.trim(),
        hCenter: els.hCenter.value.trim(),
        hRight: els.hRight.value.trim(),
        fLeft: els.fLeft.value.trim(),
        fCenter: els.fCenter.value.trim(),
        fRight: els.fRight.value.trim()
      },
      fontName: FONT_MAP[els.fontSelect.value] || "Helvetica",
      fontSize: clamp(els.fontSize.value, 6, 48, 10),
      opacity: clamp(els.opacity.value, 5, 100, 100) / 100,
      textColor: textColor,
      lineColor: lineColor,
      dateFormat: els.dateFormat.value,
      margins: {
        top: mmToPt(clamp(els.marginTop.value, 1, 80, 14)),
        bottom: mmToPt(clamp(els.marginBottom.value, 1, 80, 14)),
        left: mmToPt(clamp(els.marginLeft.value, 1, 80, 15)),
        right: mmToPt(clamp(els.marginRight.value, 1, 80, 15))
      },
      headerLine: els.headerLine.checked,
      footerLine: els.footerLine.checked,
      shrinkToFit: els.shrinkToFit.checked,
      continueBates: els.continueBates.checked,
      pageRange: els.pageRange.value.trim(),
      pageFilter: els.pageFilter.value,
      startNumber: clamp(els.startNumber.value, -99999, 999999, 1),
      batesPrefix: String(els.batesPrefix.value || "").slice(0, 20),
      batesStart: clamp(els.batesStart.value, 0, 999999999, 1),
      batesDigits: clamp(els.batesDigits.value, 1, 12, 4)
    };
  }

  function formatDate(date, style) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (style === "dmy") return d + "/" + m + "/" + y;
    if (style === "mdy") return m + "/" + d + "/" + y;
    if (style === "long") return Number(d) + " " + months[date.getMonth()] + " " + y;
    return y + "-" + m + "-" + d;
  }

  function formatBates(settings, number) {
    return settings.batesPrefix + String(number).padStart(settings.batesDigits, "0");
  }

  function resolveTemplate(template, context, settings) {
    var fileTitle = cleanBaseName(context.filename, "document");
    return String(template || "")
      .replace(/\{page\}/gi, String(context.displayPage))
      .replace(/\{pages\}/gi, String(context.totalPages))
      .replace(/\{total\}/gi, String(context.totalPages))
      .replace(/\{date\}/gi, formatDate(context.date, settings.dateFormat))
      .replace(/\{filename\}/gi, context.filename)
      .replace(/\{title\}/gi, fileTitle)
      .replace(/\{bates\}/gi, formatBates(settings, context.batesNumber));
  }

  function parsePageRange(input, totalPages) {
    var value = String(input || "").trim();
    if (!value || /^all$/i.test(value)) {
      return Array.from({ length: totalPages }, function (_, index) { return index + 1; });
    }

    var seen = {};
    var pages = [];
    value.split(",").forEach(function (part) {
      var piece = part.trim();
      if (!piece) return;
      var range = piece.match(/^(\d+)\s*-\s*(\d+)$/);
      if (range) {
        var start = Number(range[1]);
        var end = Number(range[2]);
        if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > totalPages) {
          throw new Error('Page range "' + piece + '" is outside this PDF.');
        }
        for (var i = start; i <= end; i++) {
          if (!seen[i]) {
            seen[i] = true;
            pages.push(i);
          }
        }
      } else {
        var page = Number(piece);
        if (!Number.isInteger(page) || page < 1 || page > totalPages) throw new Error('Page "' + piece + '" is outside this PDF.');
        if (!seen[page]) {
          seen[page] = true;
          pages.push(page);
        }
      }
    });

    if (!pages.length) throw new Error("Enter a page range such as 1-3, 5 or leave it blank.");
    return pages;
  }

  function selectedPageSet(input, totalPages, filter) {
    var pages = parsePageRange(input, totalPages).filter(function (page) {
      if (filter === "odd") return page % 2 === 1;
      if (filter === "even") return page % 2 === 0;
      return true;
    });
    if (!pages.length) throw new Error("The selected page range and filter did not match any pages.");
    var map = {};
    pages.forEach(function (page) { map[page] = true; });
    return { pages: pages, map: map };
  }

  function updateFiles() {
    els.fileList.innerHTML = "";
    els.fileSummary.classList.toggle("on", state.files.length > 0);
    els.clearFilesBtn.style.display = state.files.length ? "inline-flex" : "none";

    if (!state.files.length) {
      setText(els.fileSummaryText, "No PDFs selected");
      setText(els.fileSummaryMeta, "");
    } else {
      var total = state.files.reduce(function (sum, item) { return sum + item.file.size; }, 0);
      setText(els.fileSummaryText, state.files.length + " PDF" + (state.files.length === 1 ? "" : "s") + " selected");
      setText(els.fileSummaryMeta, formatBytes(total) + " total");
      state.files.forEach(function (item, index) {
        var row = document.createElement("div");
        row.className = "file-row";
        var info = document.createElement("div");
        info.className = "file-info";
        var name = document.createElement("div");
        name.className = "file-name";
        name.textContent = item.file.name;
        var meta = document.createElement("div");
        meta.className = "file-meta";
        meta.textContent = formatBytes(item.file.size);
        info.appendChild(name);
        info.appendChild(meta);
        var remove = document.createElement("button");
        remove.type = "button";
        remove.className = "mini-btn";
        remove.textContent = "Remove";
        remove.addEventListener("click", function () {
          if (state.busy) return;
          state.files.splice(index, 1);
          resetResult("");
          updateFiles();
          loadPreviewFromFirstFile();
        });
        row.appendChild(info);
        row.appendChild(remove);
        els.fileList.appendChild(row);
      });
    }

    els.exportMode.textContent = state.files.length > 1 ? "ZIP" : "PDF";
    updateControls();
  }

  function updateControls() {
    var hasFiles = state.files.length > 0;
    var hasPreview = !!state.previewDoc;
    var canApply = hasFiles && hasAnyText(getSettings());
    els.applyBtn.disabled = state.busy || !canApply;
    els.prevPageBtn.disabled = state.busy || !hasPreview || state.previewPage <= 1;
    els.nextPageBtn.disabled = state.busy || !hasPreview || state.previewPage >= (state.previewDoc ? state.previewDoc.numPages : 0);
    els.pageInput.disabled = state.busy || !hasPreview;
    els.zoomSelect.disabled = state.busy || !hasPreview;
    setText(els.pageTotal, "of " + (hasPreview ? state.previewDoc.numPages : 0));
    els.pageInput.value = hasPreview ? state.previewPage : 1;
    setText(els.previewStatus, hasPreview ? "Page " + state.previewPage + " of " + state.previewDoc.numPages : "No PDF loaded");
  }

  function setBusy(value, label) {
    state.busy = value;
    els.applyBtn.textContent = value ? (label || "Working...") : "Apply Headers and Footers";
    document.querySelectorAll("button,input,select").forEach(function (el) {
      if (el.id === "downloadBtn") return;
      if (el.type === "file") return;
      el.disabled = value;
    });
    updateControls();
  }

  function resetResult(note) {
    state.results = [];
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
    els.progressFill.style.width = Math.max(0, Math.min(100, percent || 0)) + "%";
  }

  function addFiles(files) {
    if (state.busy) return;
    var seen = {};
    var skipped = 0;
    state.files.forEach(function (item) { seen[fileKey(item.file)] = true; });
    Array.from(files || []).forEach(function (file) {
      if (!isPdf(file)) {
        skipped++;
        return;
      }
      var key = fileKey(file);
      if (!seen[key]) {
        seen[key] = true;
        state.files.push({ file: file });
      }
    });
    resetResult(skipped ? "Skipped " + skipped + " non-PDF file" + (skipped === 1 ? "." : "s.") : "");
    updateFiles();
    loadPreviewFromFirstFile();
  }

  function clearFiles() {
    if (state.busy) return;
    state.files = [];
    state.previewBytes = null;
    state.previewDoc = null;
    state.previewPage = 1;
    els.fileInput.value = "";
    els.previewEmpty.style.display = "flex";
    els.previewWrap.classList.remove("on");
    var ctx = els.previewCanvas.getContext("2d");
    ctx.clearRect(0, 0, els.previewCanvas.width, els.previewCanvas.height);
    resetResult("");
    updateFiles();
  }

  async function loadPreviewFromFirstFile() {
    if (!state.files.length) {
      clearFiles();
      return;
    }
    try {
      var bytes = new Uint8Array(await state.files[0].file.arrayBuffer());
      state.previewBytes = bytes;
      state.previewDoc = await pdfJs().getDocument({ data: bytes.slice(0), useWorkerFetch: false }).promise;
      state.previewPage = 1;
      await renderPreview();
    } catch (error) {
      state.previewDoc = null;
      els.previewEmpty.style.display = "flex";
      els.previewWrap.classList.remove("on");
      showResult("Could not preview PDF", error && error.message ? error.message : "The first PDF could not be previewed.");
    }
    updateControls();
  }

  function getPreviewScale(page) {
    var viewport = page.getViewport({ scale: 1 });
    var shellWidth = Math.max(300, els.previewShell.clientWidth - 50);
    var shellHeight = Math.max(360, window.innerHeight - 280);
    if (els.zoomSelect.value !== "fit") return Number(els.zoomSelect.value) || 1;
    return Math.min(1.45, Math.max(0.35, Math.min(shellWidth / viewport.width, shellHeight / viewport.height)));
  }

  async function renderPreview() {
    if (!state.previewDoc) return;
    var token = ++state.previewToken;
    var page = await state.previewDoc.getPage(state.previewPage);
    if (token !== state.previewToken) return;
    var scale = getPreviewScale(page);
    var viewport = page.getViewport({ scale: scale });
    var ratio = window.devicePixelRatio || 1;
    var width = Math.floor(viewport.width);
    var height = Math.floor(viewport.height);
    els.previewCanvas.width = Math.max(1, Math.floor(width * ratio));
    els.previewCanvas.height = Math.max(1, Math.floor(height * ratio));
    els.previewCanvas.style.width = width + "px";
    els.previewCanvas.style.height = height + "px";
    els.previewWrap.style.width = width + "px";
    els.previewWrap.style.height = height + "px";
    els.previewWrap.classList.add("on");
    els.previewEmpty.style.display = "none";
    var ctx = els.previewCanvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    await page.render({ canvasContext: ctx, viewport: viewport, background: "white" }).promise;
    if (token !== state.previewToken) return;
    drawPreviewMarks(ctx, viewport, scale);
    updateControls();
  }

  function pageIsSelectedForPreview(settings, totalPages) {
    try {
      var selected = selectedPageSet(settings.pageRange, totalPages, settings.pageFilter);
      return !!selected.map[state.previewPage];
    } catch (error) {
      return false;
    }
  }

  function drawCanvasText(ctx, text, slot, y, width, margins, fontSize, settings) {
    if (!text) return;
    var x;
    var maxWidth = Math.max(24, (width - margins.left - margins.right) / 3 - 10);
    ctx.save();
    ctx.globalAlpha = settings.opacity;
    ctx.fillStyle = settings.textColor;
    ctx.font = fontSize + "px DM Sans, Arial, sans-serif";
    ctx.textBaseline = "alphabetic";
    if (slot === "left") {
      ctx.textAlign = "left";
      x = margins.left;
    } else if (slot === "right") {
      ctx.textAlign = "right";
      x = width - margins.right;
    } else {
      ctx.textAlign = "center";
      x = width / 2;
      maxWidth = Math.max(24, width - margins.left - margins.right);
    }
    ctx.fillText(text, x, y, maxWidth);
    ctx.restore();
  }

  function drawPreviewMarks(ctx, viewport, scale) {
    var settings = getSettings();
    if (!hasAnyText(settings) || !pageIsSelectedForPreview(settings, state.previewDoc.numPages)) return;
    var file = state.files[0] && state.files[0].file;
    var filename = file ? file.name : "document.pdf";
    var actual = state.previewPage;
    var displayPage = settings.startNumber + actual - 1;
    var batesNumber = settings.batesStart + actual - 1;
    var context = {
      filename: filename,
      totalPages: state.previewDoc.numPages,
      displayPage: displayPage,
      batesNumber: batesNumber,
      date: new Date()
    };
    var width = viewport.width;
    var height = viewport.height;
    var margins = {
      top: settings.margins.top * scale,
      bottom: settings.margins.bottom * scale,
      left: settings.margins.left * scale,
      right: settings.margins.right * scale
    };
    var fontSize = settings.fontSize * scale;
    var headerY = Math.max(fontSize + 2, margins.top);
    var footerY = Math.max(fontSize + 2, height - margins.bottom);
    if (settings.headerLine) {
      ctx.save();
      ctx.globalAlpha = settings.opacity;
      ctx.strokeStyle = settings.lineColor;
      ctx.beginPath();
      ctx.moveTo(margins.left, headerY + fontSize * 0.55);
      ctx.lineTo(width - margins.right, headerY + fontSize * 0.55);
      ctx.stroke();
      ctx.restore();
    }
    if (settings.footerLine) {
      ctx.save();
      ctx.globalAlpha = settings.opacity;
      ctx.strokeStyle = settings.lineColor;
      ctx.beginPath();
      ctx.moveTo(margins.left, footerY - fontSize * 1.2);
      ctx.lineTo(width - margins.right, footerY - fontSize * 1.2);
      ctx.stroke();
      ctx.restore();
    }
    drawCanvasText(ctx, resolveTemplate(settings.zones.hLeft, context, settings), "left", headerY, width, margins, fontSize, settings);
    drawCanvasText(ctx, resolveTemplate(settings.zones.hCenter, context, settings), "center", headerY, width, margins, fontSize, settings);
    drawCanvasText(ctx, resolveTemplate(settings.zones.hRight, context, settings), "right", headerY, width, margins, fontSize, settings);
    drawCanvasText(ctx, resolveTemplate(settings.zones.fLeft, context, settings), "left", footerY, width, margins, fontSize, settings);
    drawCanvasText(ctx, resolveTemplate(settings.zones.fCenter, context, settings), "center", footerY, width, margins, fontSize, settings);
    drawCanvasText(ctx, resolveTemplate(settings.zones.fRight, context, settings), "right", footerY, width, margins, fontSize, settings);
  }

  function measureFontSize(font, text, baseSize, available, shrink) {
    var size = baseSize;
    if (shrink && text && font.widthOfTextAtSize(text, size) > available) {
      while (size > 6 && font.widthOfTextAtSize(text, size) > available) size -= 0.5;
    }
    return size;
  }

  function drawPdfText(page, font, text, zone, area, settings, lib) {
    if (!text) return;
    var available = Math.max(24, area.available);
    var size = measureFontSize(font, text, settings.fontSize, available, settings.shrinkToFit);
    var textWidth = font.widthOfTextAtSize(text, size);
    var x;
    if (zone === "left") x = area.left;
    else if (zone === "right") x = area.right - textWidth;
    else x = area.center - textWidth / 2;
    x = Math.max(area.left, Math.min(x, area.right - textWidth));
    page.drawText(text, {
      x: x,
      y: area.y,
      size: size,
      font: font,
      color: lib.rgb(hexToRgb01(settings.textColor).r, hexToRgb01(settings.textColor).g, hexToRgb01(settings.textColor).b),
      opacity: settings.opacity
    });
  }

  function drawPdfLine(page, y, pageWidth, settings, lib) {
    var color = hexToRgb01(settings.lineColor);
    page.drawLine({
      start: { x: settings.margins.left, y: y },
      end: { x: pageWidth - settings.margins.right, y: y },
      thickness: 0.5,
      color: lib.rgb(color.r, color.g, color.b),
      opacity: settings.opacity
    });
  }

  async function processOne(item, settings, batesBase, progressStart, progressSpan) {
    var lib = pdfLib();
    var pdf = await lib.PDFDocument.load(await item.file.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false });
    var pages = pdf.getPages();
    var totalPages = pages.length;
    var selected = selectedPageSet(settings.pageRange, totalPages, settings.pageFilter);
    var font = await pdf.embedFont(lib.StandardFonts[settings.fontName] || lib.StandardFonts.Helvetica);
    var filename = item.file.name;
    var batesCursor = settings.continueBates ? batesBase : settings.batesStart;
    var applied = 0;

    pages.forEach(function (page, index) {
      var actualPage = index + 1;
      if (!selected.map[actualPage]) return;
      var size = page.getSize();
      var displayPage = settings.startNumber + actualPage - 1;
      var context = {
        filename: filename,
        totalPages: totalPages,
        displayPage: displayPage,
        batesNumber: batesCursor,
        date: new Date()
      };
      var left = settings.margins.left;
      var right = size.width - settings.margins.right;
      var sectionWidth = Math.max(24, (right - left) / 3 - 8);
      var headerArea = {
        left: left,
        right: right,
        center: size.width / 2,
        y: size.height - settings.margins.top,
        available: sectionWidth
      };
      var footerArea = {
        left: left,
        right: right,
        center: size.width / 2,
        y: settings.margins.bottom,
        available: sectionWidth
      };

      if (settings.headerLine) drawPdfLine(page, headerArea.y - settings.fontSize * 0.45, size.width, settings, lib);
      if (settings.footerLine) drawPdfLine(page, footerArea.y + settings.fontSize * 1.25, size.width, settings, lib);
      drawPdfText(page, font, resolveTemplate(settings.zones.hLeft, context, settings), "left", headerArea, settings, lib);
      drawPdfText(page, font, resolveTemplate(settings.zones.hCenter, context, settings), "center", Object.assign({}, headerArea, { available: right - left }), settings, lib);
      drawPdfText(page, font, resolveTemplate(settings.zones.hRight, context, settings), "right", headerArea, settings, lib);
      drawPdfText(page, font, resolveTemplate(settings.zones.fLeft, context, settings), "left", footerArea, settings, lib);
      drawPdfText(page, font, resolveTemplate(settings.zones.fCenter, context, settings), "center", Object.assign({}, footerArea, { available: right - left }), settings, lib);
      drawPdfText(page, font, resolveTemplate(settings.zones.fRight, context, settings), "right", footerArea, settings, lib);
      batesCursor++;
      applied++;
    });

    var bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
    showProgress(progressStart + progressSpan, "Processed " + item.file.name, applied + " page" + (applied === 1 ? "" : "s") + " stamped.");
    return {
      name: cleanBaseName(item.file.name, "document") + "_header_footer.pdf",
      bytes: bytes,
      originalSize: item.file.size,
      outputSize: bytes.length,
      pageCount: totalPages,
      stampedPages: applied,
      nextBates: batesCursor
    };
  }

  async function applyHeadersFooters() {
    if (!state.files.length || state.busy) return;
    var settings = getSettings();
    if (!hasAnyText(settings)) {
      showResult("Add header or footer text", "Enter text in at least one of the six zones.");
      return;
    }

    setBusy(true, "Applying...");
    state.results = [];
    state.download = null;
    els.downloadRow.classList.remove("on");
    showProgress(0, "Preparing PDFs", "Applying headers and footers locally in your browser.");
    var batesCursor = settings.batesStart;

    try {
      for (var i = 0; i < state.files.length; i++) {
        showProgress(i / state.files.length * 100, "Processing " + state.files[i].file.name, "Adding text marks to selected pages.");
        var result = await processOne(state.files[i], settings, batesCursor, i / state.files.length * 100, 100 / state.files.length);
        if (settings.continueBates) batesCursor = result.nextBates;
        state.results.push(result);
      }

      if (state.results.length === 1) {
        state.download = {
          blob: new Blob([state.results[0].bytes], { type: "application/pdf" }),
          filename: state.results[0].name
        };
        setText(els.downloadBtn, "Download PDF");
        state.previewBytes = state.results[0].bytes.slice();
        state.previewDoc = await pdfJs().getDocument({ data: new Uint8Array(state.previewBytes) }).promise;
        state.previewPage = Math.min(state.previewPage, state.previewDoc.numPages);
        renderPreview();
      } else {
        state.download = {
          blob: buildZip(state.results.map(function (result) {
            return { name: result.name, data: result.bytes };
          })),
          filename: ZIP_NAME
        };
        setText(els.downloadBtn, "Download ZIP");
      }

      var stamped = state.results.reduce(function (sum, result) { return sum + result.stampedPages; }, 0);
      showProgress(100, "Done", "Stamped " + stamped + " page" + (stamped === 1 ? "" : "s") + " across " + state.results.length + " PDF" + (state.results.length === 1 ? "" : "s") + ".");
      els.downloadRow.classList.add("on");
    } catch (error) {
      showResult("Could not apply headers and footers", error && error.message ? error.message : "PDF processing failed.");
      els.downloadRow.classList.remove("on");
    } finally {
      setBusy(false);
      updateControls();
    }
  }

  function crc32(bytes) {
    var table = crc32.table;
    if (!table) {
      table = crc32.table = new Uint32Array(256);
      for (var i = 0; i < 256; i++) {
        var c = i;
        for (var j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[i] = c >>> 0;
      }
    }
    var crc = 0 ^ -1;
    for (var k = 0; k < bytes.length; k++) crc = (crc >>> 8) ^ table[(crc ^ bytes[k]) & 0xff];
    return (crc ^ -1) >>> 0;
  }

  function buildZip(files) {
    var encoder = new TextEncoder();
    var parts = [];
    var central = [];
    var offset = 0;
    files.forEach(function (file) {
      var nameBytes = encoder.encode(file.name);
      var data = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
      var crc = crc32(data);
      var local = new Uint8Array(30 + nameBytes.length);
      var lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, data.length, true);
      lv.setUint32(22, data.length, true);
      lv.setUint16(26, nameBytes.length, true);
      local.set(nameBytes, 30);

      var cd = new Uint8Array(46 + nameBytes.length);
      var cv = new DataView(cd.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint32(38, 32, true);
      cv.setUint32(42, offset, true);
      cd.set(nameBytes, 46);

      parts.push(local, data);
      central.push(cd);
      offset += local.length + data.length;
    });
    var centralStart = offset;
    var centralSize = 0;
    central.forEach(function (part) {
      parts.push(part);
      centralSize += part.length;
    });
    var end = new Uint8Array(22);
    var ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, centralStart, true);
    parts.push(end);
    return new Blob(parts, { type: "application/zip" });
  }

  function downloadResult() {
    if (!state.download) return;
    var runDownload = function () {
      var url = URL.createObjectURL(state.download.blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = state.download.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    };
    var gate = document.querySelector("email-gate-modal");
    if (gate && typeof gate.show === "function") gate.show(runDownload);
    else runDownload();
  }

  function insertToken(token) {
    var target = state.activeField || els.fCenter;
    var start = target.selectionStart == null ? target.value.length : target.selectionStart;
    var end = target.selectionEnd == null ? target.value.length : target.selectionEnd;
    target.value = target.value.slice(0, start) + token + target.value.slice(end);
    target.focus();
    target.selectionStart = target.selectionEnd = start + token.length;
    updateControls();
    schedulePreview();
  }

  function applyTemplate(name) {
    if (name === "pageNumbers") {
      els.hLeft.value = "";
      els.hCenter.value = "";
      els.hRight.value = "";
      els.fLeft.value = "";
      els.fCenter.value = "Page {page} of {pages}";
      els.fRight.value = "";
    } else if (name === "confidential") {
      els.hLeft.value = "{filename}";
      els.hCenter.value = "CONFIDENTIAL";
      els.hRight.value = "{date}";
      els.fLeft.value = "";
      els.fCenter.value = "Page {page} of {pages}";
      els.fRight.value = "{title}";
      els.headerLine.checked = true;
      els.footerLine.checked = true;
    } else if (name === "filenameDate") {
      els.hLeft.value = "{filename}";
      els.hCenter.value = "";
      els.hRight.value = "{date}";
      els.fLeft.value = "";
      els.fCenter.value = "Page {page} of {pages}";
      els.fRight.value = "";
    } else if (name === "bates") {
      els.hLeft.value = "";
      els.hCenter.value = "";
      els.hRight.value = "";
      els.fLeft.value = "{bates}";
      els.fCenter.value = "Page {page} of {pages}";
      els.fRight.value = "{date}";
    }
    updateControls();
    schedulePreview();
  }

  function schedulePreview() {
    window.clearTimeout(schedulePreview.timer);
    schedulePreview.timer = window.setTimeout(function () {
      if (state.previewDoc) renderPreview();
    }, 120);
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
      addFiles(event.dataTransfer.files);
    });
    els.fileInput.addEventListener("change", function (event) {
      addFiles(event.target.files);
      event.target.value = "";
    });
  }

  function goToPage(pageNumber) {
    if (!state.previewDoc || state.busy) return;
    var target = clamp(pageNumber, 1, state.previewDoc.numPages, 1);
    if (target === state.previewPage) {
      els.pageInput.value = target;
      return;
    }
    state.previewPage = target;
    renderPreview().catch(function (error) {
      showResult("Preview failed", error && error.message ? error.message : "Could not render this page.");
    });
  }

  function syncColorInputs(source, text, color, fallback) {
    var value = normalizeColor(source.value, fallback);
    source.value = value;
    text.value = value;
    color.value = value;
    schedulePreview();
  }

  function bindControls() {
    els.clearFilesBtn.addEventListener("click", clearFiles);
    els.prevPageBtn.addEventListener("click", function () { goToPage(state.previewPage - 1); });
    els.nextPageBtn.addEventListener("click", function () { goToPage(state.previewPage + 1); });
    els.pageInput.addEventListener("change", function () { goToPage(els.pageInput.value); });
    els.zoomSelect.addEventListener("change", renderPreview);
    els.applyBtn.addEventListener("click", applyHeadersFooters);
    els.downloadBtn.addEventListener("click", downloadResult);
    document.querySelectorAll("[data-token]").forEach(function (button) {
      button.addEventListener("click", function () { insertToken(button.dataset.token); });
    });
    document.querySelectorAll("[data-template]").forEach(function (button) {
      button.addEventListener("click", function () { applyTemplate(button.dataset.template); });
    });
    selectedTextFields().forEach(function (field) {
      field.addEventListener("focus", function () { state.activeField = field; });
      field.addEventListener("input", function () {
        resetResult("");
        updateControls();
        schedulePreview();
      });
    });
    [
      els.fontSelect, els.fontSize, els.opacity, els.marginTop, els.marginBottom,
      els.marginLeft, els.marginRight, els.dateFormat, els.headerLine, els.footerLine,
      els.shrinkToFit, els.continueBates, els.pageRange, els.pageFilter,
      els.startNumber, els.batesPrefix, els.batesStart, els.batesDigits
    ].forEach(function (input) {
      input.addEventListener("input", function () {
        resetResult("");
        updateControls();
        schedulePreview();
      });
      input.addEventListener("change", function () {
        resetResult("");
        updateControls();
        schedulePreview();
      });
    });
    els.textColor.addEventListener("input", function () { syncColorInputs(els.textColor, els.textColorHex, els.textColor, "#111827"); });
    els.textColorHex.addEventListener("input", function () { syncColorInputs(els.textColorHex, els.textColorHex, els.textColor, "#111827"); });
    els.lineColor.addEventListener("input", function () { syncColorInputs(els.lineColor, els.lineColorHex, els.lineColor, "#CBD5E1"); });
    els.lineColorHex.addEventListener("input", function () { syncColorInputs(els.lineColorHex, els.lineColorHex, els.lineColor, "#CBD5E1"); });
    window.addEventListener("resize", function () {
      window.clearTimeout(bindControls.resizeTimer);
      bindControls.resizeTimer = window.setTimeout(function () {
        if (state.previewDoc && els.zoomSelect.value === "fit") renderPreview();
      }, 150);
    });
  }

  function init() {
    els.dropZone = byId("dropZone");
    els.fileInput = byId("fileInput");
    els.fileSummary = byId("fileSummary");
    els.fileSummaryText = byId("fileSummaryText");
    els.fileSummaryMeta = byId("fileSummaryMeta");
    els.fileList = byId("fileList");
    els.clearFilesBtn = byId("clearFilesBtn");
    els.hLeft = byId("hLeft");
    els.hCenter = byId("hCenter");
    els.hRight = byId("hRight");
    els.fLeft = byId("fLeft");
    els.fCenter = byId("fCenter");
    els.fRight = byId("fRight");
    els.fontSelect = byId("fontSelect");
    els.fontSize = byId("fontSize");
    els.opacity = byId("opacity");
    els.textColor = byId("textColor");
    els.textColorHex = byId("textColorHex");
    els.lineColor = byId("lineColor");
    els.lineColorHex = byId("lineColorHex");
    els.dateFormat = byId("dateFormat");
    els.marginTop = byId("marginTop");
    els.marginBottom = byId("marginBottom");
    els.marginLeft = byId("marginLeft");
    els.marginRight = byId("marginRight");
    els.headerLine = byId("headerLine");
    els.footerLine = byId("footerLine");
    els.shrinkToFit = byId("shrinkToFit");
    els.continueBates = byId("continueBates");
    els.pageRange = byId("pageRange");
    els.pageFilter = byId("pageFilter");
    els.startNumber = byId("startNumber");
    els.batesPrefix = byId("batesPrefix");
    els.batesStart = byId("batesStart");
    els.batesDigits = byId("batesDigits");
    els.previewShell = byId("previewShell");
    els.previewEmpty = byId("previewEmpty");
    els.previewWrap = byId("previewWrap");
    els.previewCanvas = byId("previewCanvas");
    els.previewStatus = byId("previewStatus");
    els.prevPageBtn = byId("prevPageBtn");
    els.nextPageBtn = byId("nextPageBtn");
    els.pageInput = byId("pageInput");
    els.pageTotal = byId("pageTotal");
    els.zoomSelect = byId("zoomSelect");
    els.applyBtn = byId("applyBtn");
    els.exportMode = byId("exportMode");
    els.resultCard = byId("resultCard");
    els.resultTitle = byId("resultTitle");
    els.resultNote = byId("resultNote");
    els.progressBar = byId("progressBar");
    els.progressFill = byId("progressFill");
    els.downloadRow = byId("downloadRow");
    els.downloadBtn = byId("downloadBtn");
    state.activeField = els.fCenter;

    try {
      pdfJs();
      pdfLib();
      bindDropZone();
      bindControls();
      updateFiles();
    } catch (error) {
      showResult("PDF tools unavailable", error && error.message ? error.message : "Required PDF libraries could not load.");
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}();
