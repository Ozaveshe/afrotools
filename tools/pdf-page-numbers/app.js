!function () {
  "use strict";

  var ZIP_NAME = "numbered_pdfs.zip";
  var state = {
    files: [],
    results: [],
    download: null,
    busy: false,
    position: "bottom-center",
    previewToken: 0
  };
  var els = {};
  var fonts = {
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

  function renderFiles() {
    els.fileList.innerHTML = "";
    els.fileSummary.classList.toggle("on", state.files.length > 0);
    els.clearFilesBtn.style.display = state.files.length ? "inline-flex" : "none";

    if (!state.files.length) {
      setText(els.fileSummaryText, "No PDFs selected.");
    } else {
      var total = state.files.reduce(function (sum, item) { return sum + item.file.size; }, 0);
      setText(
        els.fileSummaryText,
        state.files.length + " PDF" + (state.files.length === 1 ? "" : "s") + " selected, " + formatBytes(total) + " total."
      );

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
          renderFiles();
          updatePreview();
        });

        row.appendChild(info);
        row.appendChild(remove);
        els.fileList.appendChild(row);
      });
    }

    els.numberBtn.disabled = state.busy || state.files.length === 0;
  }

  function addFiles(files) {
    if (state.busy) return;
    var seen = {};
    var skipped = 0;

    state.files.forEach(function (item) {
      seen[fileKey(item.file)] = true;
    });

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
    renderFiles();
    updatePreview();
  }

  function resetResult(note) {
    state.results = [];
    state.download = null;
    els.resultCard.classList.remove("on");
    els.resultRows.innerHTML = "";
    els.actionRow.classList.remove("on");
    els.progressBar.classList.remove("on");
    els.progressFill.style.width = "0%";
    els.resultNote.classList.toggle("on", !!note);
    setText(els.resultNote, note || "");
    setText(els.resultText, "");
  }

  function setBusy(value) {
    state.busy = value;
    els.numberBtn.disabled = value || state.files.length === 0;
    els.numberBtn.textContent = value ? "Adding Numbers..." : "Add Page Numbers";
    [els.clearFilesBtn].forEach(function (button) {
      if (button) button.disabled = value;
    });
    document.querySelectorAll(".mini-btn,.choice-btn").forEach(function (button) {
      button.disabled = value;
    });
  }

  function showProgress(percent, message) {
    els.progressBar.classList.add("on");
    els.progressFill.style.width = Math.max(0, Math.min(100, percent || 0)) + "%";
    if (message) setText(els.resultText, message);
  }

  function clampNumber(value, min, max, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) number = fallback;
    number = Math.max(min, number);
    if (max != null) number = Math.min(max, number);
    return number;
  }

  function getColor() {
    var raw = String(els.colorText.value || els.colorInput.value || "#111827").trim();
    if (!/^#[0-9a-f]{6}$/i.test(raw)) raw = "#111827";
    raw = raw.toUpperCase();
    els.colorInput.value = raw;
    els.colorText.value = raw;
    setText(els.colorHex, raw);
    return {
      hex: raw,
      r: parseInt(raw.slice(1, 3), 16) / 255,
      g: parseInt(raw.slice(3, 5), 16) / 255,
      b: parseInt(raw.slice(5, 7), 16) / 255
    };
  }

  function toRoman(num) {
    if (num <= 0 || num > 3999) return String(num);
    var map = [
      [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"],
      [100, "c"], [90, "xc"], [50, "l"], [40, "xl"],
      [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]
    ];
    var out = "";
    map.forEach(function (item) {
      while (num >= item[0]) {
        out += item[1];
        num -= item[0];
      }
    });
    return out;
  }

  function toLetters(num, upper) {
    if (num <= 0) return String(num);
    var out = "";
    while (num > 0) {
      num--;
      out = String.fromCharCode(97 + num % 26) + out;
      num = Math.floor(num / 26);
    }
    return upper ? out.toUpperCase() : out;
  }

  function padNumber(value, padLength) {
    var raw = String(value);
    return padLength > 0 && /^-?\d+$/.test(raw) ? raw.padStart(padLength, "0") : raw;
  }

  function selectedPages(pageCount, options) {
    var rangeText = String(options.pageRange || "").trim();
    if (options.startPage > pageCount) throw new Error("Start page is outside this PDF.");
    var startPage = Math.max(1, options.startPage || 1);
    var pages = [];
    var seen = {};

    function add(pageNumber) {
      if (pageNumber < startPage || pageNumber < 1 || pageNumber > pageCount) return;
      if (options.subset === "odd" && pageNumber % 2 === 0) return;
      if (options.subset === "even" && pageNumber % 2 !== 0) return;
      if (!seen[pageNumber]) {
        seen[pageNumber] = true;
        pages.push(pageNumber);
      }
    }

    if (!rangeText || /^all$/i.test(rangeText)) {
      for (var p = startPage; p <= pageCount; p++) add(p);
      if (!pages.length) throw new Error("No pages match the selected start page and odd/even subset.");
      return pages;
    }

    rangeText.split(",").forEach(function (part) {
      var token = part.trim();
      if (!token) return;
      var range = token.match(/^(\d+)\s*-\s*(\d+)$/);
      if (range) {
        var from = Number(range[1]);
        var to = Number(range[2]);
        if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from || to > pageCount) {
          throw new Error('Page range "' + token + '" is outside this PDF.');
        }
        for (var page = from; page <= to; page++) add(page);
      } else {
        var single = Number(token);
        if (!Number.isInteger(single) || single < 1 || single > pageCount) {
          throw new Error('Page "' + token + '" is outside this PDF.');
        }
        add(single);
      }
    });

    if (!pages.length) throw new Error("No pages match the selected range, start page, and odd/even subset.");
    pages.sort(function (a, b) { return a - b; });
    return pages;
  }

  function formatNumber(sequence, total, options) {
    var value = options.startNumber + sequence;
    var formatted;
    if (options.template === "roman-lower") formatted = toRoman(value);
    else if (options.template === "roman-upper") formatted = toRoman(value).toUpperCase();
    else if (options.template === "letters-lower") formatted = toLetters(value, false);
    else if (options.template === "letters-upper") formatted = toLetters(value, true);
    else formatted = padNumber(value, options.padLength);

    if (options.template === "page-number") return "Page " + formatted;
    if (options.template === "page-of-total") return "Page " + formatted + " of " + total;
    if (options.template === "number-of-total") return formatted + " / " + total;
    return options.prefix + formatted + options.suffix;
  }

  function mirroredPosition(position, pageNumber, facingMode) {
    if (!facingMode || pageNumber % 2 === 1) return position;
    if (position.indexOf("left") !== -1) return position.replace("left", "right");
    if (position.indexOf("right") !== -1) return position.replace("right", "left");
    return position;
  }

  function coordinates(position, pageWidth, pageHeight, textWidth, fontSize, options) {
    var x;
    var y;
    if (position.indexOf("left") !== -1) x = options.marginX;
    else if (position.indexOf("right") !== -1) x = pageWidth - options.marginX - textWidth;
    else x = (pageWidth - textWidth) / 2;

    if (position.indexOf("top") !== -1) y = pageHeight - options.marginY - fontSize;
    else if (position.indexOf("bottom") !== -1) y = options.marginY;
    else y = (pageHeight - fontSize) / 2;

    return {
      x: Math.max(0, Math.min(pageWidth - textWidth, x)),
      y: Math.max(0, Math.min(pageHeight - fontSize, y))
    };
  }

  function currentOptions() {
    return {
      template: els.templateSelect.value,
      startNumber: Math.floor(clampNumber(els.startNumber.value, 0, 999999, 1)),
      padLength: Math.floor(clampNumber(els.padLength.value, 0, 8, 0)),
      startPage: Math.floor(clampNumber(els.startPage.value, 1, 999999, 1)),
      pageRange: els.pageRange.value,
      subset: els.subsetSelect.value,
      prefix: els.prefixInput.value || "",
      suffix: els.suffixInput.value || "",
      position: state.position,
      fontName: fonts[els.fontSelect.value] || "Helvetica",
      fontSize: clampNumber(els.fontSize.value, 6, 72, 12),
      opacity: clampNumber(els.opacity.value, 10, 100, 100) / 100,
      marginX: clampNumber(els.marginX.value, 0, 144, 36),
      marginY: clampNumber(els.marginY.value, 0, 144, 28),
      rotation: clampNumber(els.rotation.value, -90, 90, 0),
      color: getColor(),
      facingMode: els.facingMode.checked
    };
  }

  async function numberPdf(item, options, fileIndex, fileCount) {
    var lib = pdfLib();
    var inputBytes = await item.file.arrayBuffer();
    var pdf = await lib.PDFDocument.load(inputBytes, { ignoreEncryption: true, updateMetadata: false });
    var pages = pdf.getPages();
    var targetPages = selectedPages(pages.length, options);
    var pageSet = {};
    targetPages.forEach(function (pageNumber) { pageSet[pageNumber] = true; });
    var font = await pdf.embedFont(lib.StandardFonts[options.fontName] || lib.StandardFonts.Helvetica);
    var total = targetPages.length;
    var drawn = 0;

    pages.forEach(function (page, index) {
      var pdfPageNumber = index + 1;
      if (!pageSet[pdfPageNumber]) return;
      var text = formatNumber(drawn, total, options);
      var size = page.getSize();
      var textWidth = font.widthOfTextAtSize(text, options.fontSize);
      var pos = mirroredPosition(options.position, pdfPageNumber, options.facingMode);
      var point = coordinates(pos, size.width, size.height, textWidth, options.fontSize, options);

      page.drawText(text, {
        x: point.x,
        y: point.y,
        size: options.fontSize,
        font: font,
        color: lib.rgb(options.color.r, options.color.g, options.color.b),
        opacity: options.opacity,
        rotate: lib.degrees(options.rotation)
      });

      drawn++;
      showProgress(8 + (fileIndex + drawn / total) / fileCount * 84, "Numbering " + item.file.name + " (" + drawn + "/" + total + " pages)...");
    });

    if (!drawn) throw new Error("No pages were numbered.");
    var output = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
    return {
      ok: true,
      sourceName: item.file.name,
      name: cleanBaseName(item.file.name, "document") + "_numbered.pdf",
      bytes: output,
      originalSize: item.file.size,
      outputSize: output.length,
      pageCount: pages.length,
      numberedCount: drawn
    };
  }

  function renderResult() {
    els.resultRows.innerHTML = "";
    var ok = state.results.filter(function (item) { return item.ok; });
    var failed = state.results.filter(function (item) { return !item.ok; });

    state.results.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "result-row" + (item.ok ? "" : " error");
      var info = document.createElement("div");
      info.className = "result-info";
      var name = document.createElement("div");
      name.className = "result-name";
      name.textContent = item.ok ? item.name : item.sourceName;
      var meta = document.createElement("div");
      meta.className = "result-meta";
      meta.textContent = item.ok
        ? item.numberedCount + "/" + item.pageCount + " pages numbered - " + formatBytes(item.originalSize) + " -> " + formatBytes(item.outputSize)
        : item.error;
      info.appendChild(name);
      info.appendChild(meta);
      row.appendChild(info);
      els.resultRows.appendChild(row);
    });

    if (ok.length) {
      var pagesNumbered = ok.reduce(function (sum, item) { return sum + item.numberedCount; }, 0);
      setText(els.resultText, "Added page numbers to " + pagesNumbered + " page" + (pagesNumbered === 1 ? "" : "s") + ".");
      setText(
        els.resultNote,
        (failed.length ? failed.length + " file" + (failed.length === 1 ? "" : "s") + " could not be processed. " : "") +
        "Numbering is drawn onto a new PDF copy. Keep your original file if you may need to change the style later."
      );
      els.resultNote.classList.add("on");
      els.actionRow.classList.add("on");
      els.downloadBtn.textContent = state.download && /\.zip$/i.test(state.download.filename) ? "Download ZIP" : "Download PDF";
    } else {
      setText(els.resultText, "No files were numbered.");
      setText(els.resultNote, failed.length ? "Check the page range and try again." : "");
      els.resultNote.classList.toggle("on", failed.length > 0);
      els.actionRow.classList.remove("on");
    }
  }

  async function processFiles() {
    if (state.busy) return;
    if (!state.files.length) {
      els.resultCard.classList.add("on");
      setText(els.resultText, "Choose at least one PDF file.");
      return;
    }

    setBusy(true);
    state.results = [];
    state.download = null;
    els.resultCard.classList.add("on");
    els.resultRows.innerHTML = "";
    els.resultNote.classList.remove("on");
    els.actionRow.classList.remove("on");
    showProgress(3, "Preparing page numbering...");

    try {
      var options = currentOptions();
      for (var i = 0; i < state.files.length; i++) {
        try {
          showProgress(6 + i / state.files.length * 84, "Loading " + state.files[i].file.name + "...");
          state.results.push(await numberPdf(state.files[i], options, i, state.files.length));
        } catch (fileErr) {
          state.results.push({
            ok: false,
            sourceName: state.files[i].file.name,
            error: fileErr && fileErr.message ? fileErr.message : "Could not number this PDF."
          });
        }
      }

      var successes = state.results.filter(function (item) { return item.ok; });
      if (successes.length === 1) {
        state.download = {
          blob: new Blob([successes[0].bytes], { type: "application/pdf" }),
          filename: successes[0].name
        };
      } else if (successes.length > 1) {
        state.download = {
          blob: buildZip(successes.map(function (item) { return { name: item.name, data: item.bytes }; })),
          filename: ZIP_NAME
        };
      }

      showProgress(100, "Done.");
      renderResult();
    } catch (err) {
      setText(els.resultText, "Error: " + (err.message || "Page numbering failed."));
      els.actionRow.classList.remove("on");
      els.resultNote.classList.add("on");
      setText(els.resultNote, "Try a different PDF or a smaller page range.");
    } finally {
      setBusy(false);
      updatePreview();
    }
  }

  function crc32(bytes) {
    var table = crc32.table;
    if (!table) {
      table = crc32.table = new Uint32Array(256);
      for (var i = 0; i < 256; i++) {
        var c = i;
        for (var j = 0; j < 8; j++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
        table[i] = c >>> 0;
      }
    }
    var crc = 4294967295;
    for (var k = 0; k < bytes.length; k++) crc = table[(crc ^ bytes[k]) & 255] ^ crc >>> 8;
    return (4294967295 ^ crc) >>> 0;
  }

  function buildZip(entries) {
    var encoder = new TextEncoder();
    var parts = [];
    var central = [];
    var offset = 0;

    entries.forEach(function (entry) {
      var nameBytes = encoder.encode(entry.name);
      var data = entry.data instanceof Uint8Array ? entry.data : new Uint8Array(entry.data);
      var crc = crc32(data);
      var local = new Uint8Array(30 + nameBytes.length);
      var localView = new DataView(local.buffer);
      localView.setUint32(0, 67324752, true);
      localView.setUint16(4, 20, true);
      localView.setUint32(14, crc, true);
      localView.setUint32(18, data.length, true);
      localView.setUint32(22, data.length, true);
      localView.setUint16(26, nameBytes.length, true);
      local.set(nameBytes, 30);

      var header = new Uint8Array(46 + nameBytes.length);
      var centralView = new DataView(header.buffer);
      centralView.setUint32(0, 33639248, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint32(16, crc, true);
      centralView.setUint32(20, data.length, true);
      centralView.setUint32(24, data.length, true);
      centralView.setUint16(28, nameBytes.length, true);
      centralView.setUint32(38, 32, true);
      centralView.setUint32(42, offset, true);
      header.set(nameBytes, 46);

      parts.push(local, data);
      central.push(header);
      offset += local.length + data.length;
    });

    var centralOffset = offset;
    var centralSize = 0;
    central.forEach(function (part) {
      parts.push(part);
      centralSize += part.length;
    });

    var end = new Uint8Array(22);
    var endView = new DataView(end.buffer);
    endView.setUint32(0, 101010256, true);
    endView.setUint16(8, entries.length, true);
    endView.setUint16(10, entries.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, centralOffset, true);
    parts.push(end);
    return new Blob(parts, { type: "application/zip" });
  }

  function download() {
    if (!state.download) return;

    function run() {
      var url = URL.createObjectURL(state.download.blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = state.download.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    }

    var gate = document.querySelector("email-gate-modal");
    if (gate && typeof gate.show === "function") gate.show(run);
    else run();
  }

  function drawPreviewText(ctx, pageWidth, pageHeight, viewport, pageNumber, sequence, selectedTotal, options) {
    var text = formatNumber(sequence, selectedTotal, options);
    var scale = viewport.scale || 1;
    var fontSize = Math.max(8, options.fontSize * scale);
    ctx.save();
    ctx.font = "800 " + fontSize + "px DM Sans, Arial, sans-serif";
    ctx.fillStyle = options.color.hex;
    ctx.globalAlpha = options.opacity;
    ctx.textBaseline = "alphabetic";

    var textWidth = ctx.measureText(text).width;
    var pos = mirroredPosition(options.position, pageNumber, options.facingMode);
    var pdfPoint = coordinates(pos, pageWidth, pageHeight, textWidth / scale, options.fontSize, options);
    var x = pdfPoint.x * scale;
    var y = (pageHeight - pdfPoint.y - options.fontSize) * scale + fontSize;

    ctx.translate(x + textWidth / 2, y - fontSize / 2);
    ctx.rotate(options.rotation * Math.PI / 180);
    ctx.fillText(text, -textWidth / 2, fontSize / 2);
    ctx.restore();
  }

  function updatePreview() {
    var token = ++state.previewToken;
    window.clearTimeout(updatePreview.timer);
    updatePreview.timer = window.setTimeout(function () {
      renderPreview(token).catch(function (err) {
        setText(els.previewStatus, err.message || "Preview failed.");
      });
    }, 160);
  }

  async function renderPreview(token) {
    var canvas = els.previewCanvas;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!state.files.length) {
      setText(els.previewStatus, "Upload a PDF to preview the first numbered page.");
      return;
    }

    var options = currentOptions();
    var bytes = await state.files[0].file.arrayBuffer();
    if (token !== state.previewToken) return;
    var doc = await pdfJs().getDocument({ data: new Uint8Array(bytes.slice(0)) }).promise;
    var pages = selectedPages(doc.numPages, options);
    var previewPageNumber = pages[0];
    var page = await doc.getPage(previewPageNumber);
    var viewport1 = page.getViewport({ scale: 1 });
    var maxWidth = 340;
    var maxHeight = 500;
    var scale = Math.min(maxWidth / viewport1.width, maxHeight / viewport1.height, 1.35);
    var viewport = page.getViewport({ scale: scale });

    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: viewport, background: "white" }).promise;
    if (token !== state.previewToken) return;
    drawPreviewText(ctx, viewport1.width, viewport1.height, viewport, previewPageNumber, 0, pages.length, options);
    setText(els.previewStatus, "Previewing PDF page " + previewPageNumber + " with " + pages.length + " page" + (pages.length === 1 ? "" : "s") + " selected.");
  }

  function syncLabels() {
    setText(els.fontSizeValue, els.fontSize.value + " pt");
    setText(els.opacityValue, els.opacity.value + "%");
    setText(els.marginXValue, els.marginX.value + " pt");
    setText(els.marginYValue, els.marginY.value + " pt");
    setText(els.rotationValue, els.rotation.value + " deg");
    getColor();
  }

  function wireDropZone() {
    els.dropZone.addEventListener("click", function () {
      if (!state.busy) els.pdfFileInput.click();
    });
    els.dropZone.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        els.pdfFileInput.click();
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
  }

  function bindControlUpdates() {
    [
      els.templateSelect, els.startNumber, els.padLength, els.startPage, els.pageRange,
      els.subsetSelect, els.prefixInput, els.suffixInput, els.fontSelect, els.fontSize,
      els.opacity, els.marginX, els.marginY, els.rotation, els.colorInput, els.colorText,
      els.facingMode
    ].forEach(function (control) {
      control.addEventListener("input", function () {
        if (control === els.colorInput) els.colorText.value = els.colorInput.value.toUpperCase();
        syncLabels();
        resetResult("");
        updatePreview();
      });
      control.addEventListener("change", function () {
        if (control === els.colorText && !/^#[0-9a-f]{6}$/i.test(els.colorText.value)) els.colorText.value = "#111827";
        syncLabels();
        resetResult("");
        updatePreview();
      });
    });
  }

  function init() {
    els.dropZone = byId("dropZone");
    els.pdfFileInput = byId("pdfFileInput");
    els.fileSummary = byId("fileSummary");
    els.fileSummaryText = byId("fileSummaryText");
    els.clearFilesBtn = byId("clearFilesBtn");
    els.fileList = byId("fileList");
    els.templateSelect = byId("templateSelect");
    els.startNumber = byId("startNumber");
    els.padLength = byId("padLength");
    els.startPage = byId("startPage");
    els.pageRange = byId("pageRange");
    els.subsetSelect = byId("subsetSelect");
    els.prefixInput = byId("prefixInput");
    els.suffixInput = byId("suffixInput");
    els.fontSelect = byId("fontSelect");
    els.fontSize = byId("fontSize");
    els.fontSizeValue = byId("fontSizeValue");
    els.opacity = byId("opacity");
    els.opacityValue = byId("opacityValue");
    els.marginX = byId("marginX");
    els.marginXValue = byId("marginXValue");
    els.marginY = byId("marginY");
    els.marginYValue = byId("marginYValue");
    els.rotation = byId("rotation");
    els.rotationValue = byId("rotationValue");
    els.colorInput = byId("colorInput");
    els.colorText = byId("colorText");
    els.colorHex = byId("colorHex");
    els.facingMode = byId("facingMode");
    els.numberBtn = byId("numberBtn");
    els.previewCanvas = byId("previewCanvas");
    els.previewStatus = byId("previewStatus");
    els.resultCard = byId("resultCard");
    els.resultText = byId("resultText");
    els.progressBar = byId("progressBar");
    els.progressFill = byId("progressFill");
    els.resultRows = byId("resultRows");
    els.resultNote = byId("resultNote");
    els.actionRow = byId("actionRow");
    els.downloadBtn = byId("downloadBtn");

    pdfLib();
    pdfJs();
    wireDropZone();
    bindControlUpdates();

    els.pdfFileInput.addEventListener("change", function (event) {
      addFiles(event.target.files);
      event.target.value = "";
    });
    els.clearFilesBtn.addEventListener("click", function () {
      if (state.busy) return;
      state.files = [];
      resetResult("");
      renderFiles();
      updatePreview();
    });
    document.querySelectorAll("[data-position]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (state.busy) return;
        state.position = button.dataset.position;
        document.querySelectorAll("[data-position]").forEach(function (item) {
          item.classList.toggle("on", item === button);
        });
        resetResult("");
        updatePreview();
      });
    });
    els.numberBtn.addEventListener("click", processFiles);
    els.downloadBtn.addEventListener("click", download);

    syncLabels();
    renderFiles();
    updatePreview();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}();
