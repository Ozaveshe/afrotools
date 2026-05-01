/* AfroTools PDF Find & Replace */
(function () {
  "use strict";

  var state = {
    file: null,
    originalBytes: null,
    activeBytes: null,
    modifiedBytes: null,
    pdfDoc: null,
    pageCount: 0,
    currentPage: 1,
    textData: null,
    matches: [],
    activeMatchIdx: -1,
    appliedRows: []
  };

  var renderScale = 1.5;
  var els = {};
  var ids = [
    "uploadZone", "fileInput", "frCard", "findInput", "replaceInput", "caseSensitive",
    "wholeWord", "regexMode", "fitToBox", "pageScope", "pageRanges", "textColor",
    "backgroundColor", "fontSizeMode", "customFontSize", "paddingPt", "backgroundOpacity",
    "backgroundOpacityValue", "findBtn", "findSpinner", "replaceActions",
    "replaceSelectedBtn", "replaceAllBtn", "undoBtn", "downloadBtn", "downloadReportBtn",
    "prevMatchBtn", "nextMatchBtn", "previewCard", "pdfCanvas", "canvasWrap",
    "prevPage", "nextPage", "pageLabel", "pageInfo", "matchCard", "matchCount",
    "matchList", "statusMsg", "replacementSummary"
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function cacheElements() {
    ids.forEach(function (id) {
      els[id] = byId(id);
    });
  }

  function hasRuntime() {
    return !!(window.PdfUtils && window.PDFLib);
  }

  function showStatus(message, type) {
    if (!els.statusMsg) return;
    els.statusMsg.textContent = message;
    els.statusMsg.className = "status-msg " + (type || "success");
  }

  function hideStatus() {
    if (els.statusMsg) els.statusMsg.className = "status-msg";
  }

  function isPdfFile(file) {
    return !!(file && ((file.type && file.type === "application/pdf") || /\.pdf$/i.test(file.name || "")));
  }

  function formatSize(bytes) {
    if (!Number.isFinite(bytes)) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function cloneBytes(bytes) {
    if (!bytes) return null;
    if (bytes instanceof Uint8Array) return new Uint8Array(bytes);
    if (bytes instanceof ArrayBuffer) return new Uint8Array(bytes.slice(0));
    return new Uint8Array(bytes);
  }

  function safeBaseName(name) {
    return String(name || "document")
      .replace(/\.pdf$/i, "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim() || "document";
  }

  function escapeHtml(value) {
    var div = document.createElement("div");
    div.textContent = String(value == null ? "" : value);
    return div.innerHTML;
  }

  function hexToRgb(hex) {
    var value = /^#[0-9a-f]{6}$/i.test(hex || "") ? hex : "#000000";
    return {
      r: parseInt(value.slice(1, 3), 16) / 255,
      g: parseInt(value.slice(3, 5), 16) / 255,
      b: parseInt(value.slice(5, 7), 16) / 255
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function numberInput(el, fallback, min, max) {
    var parsed = parseFloat(el && el.value);
    if (!Number.isFinite(parsed)) parsed = fallback;
    if (Number.isFinite(min)) parsed = Math.max(min, parsed);
    if (Number.isFinite(max)) parsed = Math.min(max, parsed);
    return parsed;
  }

  function isWordChar(char) {
    if (!char) return false;
    try {
      return /[\p{L}\p{N}_]/u.test(char);
    } catch (err) {
      return /[A-Za-z0-9_]/.test(char);
    }
  }

  function hasWordBoundary(text, index, length) {
    var before = index > 0 ? text[index - 1] : "";
    var after = index + length < text.length ? text[index + length] : "";
    return !isWordChar(before) && !isWordChar(after);
  }

  function parsePageRanges(raw, totalPages) {
    var pages = new Set();
    var warnings = [];
    var value = String(raw || "").trim();
    if (!value) throw new Error("Enter a page range, for example 1-3, 5.");

    value.split(",").forEach(function (part) {
      var chunk = part.trim();
      if (!chunk) return;
      var match = chunk.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!match) {
        warnings.push("Ignored invalid range " + chunk + ".");
        return;
      }

      var start = parseInt(match[1], 10);
      var end = match[2] ? parseInt(match[2], 10) : start;
      if (start > end) {
        var swap = start;
        start = end;
        end = swap;
      }
      if (start < 1 || end > totalPages) {
        throw new Error("Page range " + chunk + " is outside this " + totalPages + "-page PDF.");
      }
      for (var page = start; page <= end; page += 1) pages.add(page);
    });

    if (!pages.size) throw new Error("No valid pages were selected.");
    return { pages: pages, warnings: warnings };
  }

  function selectedPageSet() {
    if (!state.pageCount) return new Set();
    if (!els.pageScope || els.pageScope.value !== "custom") {
      var all = new Set();
      for (var page = 1; page <= state.pageCount; page += 1) all.add(page);
      return all;
    }
    return parsePageRanges(els.pageRanges && els.pageRanges.value, state.pageCount).pages;
  }

  function pageScopeLabel() {
    if (!els.pageScope || els.pageScope.value !== "custom") return "all pages";
    return "pages " + (els.pageRanges && els.pageRanges.value ? els.pageRanges.value.trim() : "");
  }

  function styleConfig() {
    return {
      textColor: hexToRgb(els.textColor && els.textColor.value),
      backgroundColor: hexToRgb(els.backgroundColor && els.backgroundColor.value || "#ffffff"),
      fontSizeMode: els.fontSizeMode && els.fontSizeMode.value === "custom" ? "custom" : "auto",
      customFontSize: numberInput(els.customFontSize, 10, 6, 72),
      padding: numberInput(els.paddingPt, 2, 0, 18),
      opacity: numberInput(els.backgroundOpacity, 100, 0, 100) / 100,
      fitToBox: !!(els.fitToBox && els.fitToBox.checked)
    };
  }

  function resetUploadZone() {
    if (!els.uploadZone) return;
    els.uploadZone.classList.remove("has-file");
    els.uploadZone.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><p>Drop a PDF here or click to browse</p><span class="hint">Supports any PDF file</span>';
  }

  function renderFileInfo(file) {
    if (!els.uploadZone) return;
    els.uploadZone.classList.add("has-file");
    els.uploadZone.textContent = "";

    var row = document.createElement("div");
    row.className = "file-info";
    var icon = document.createElement("div");
    icon.className = "icon";
    icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--afro-green)" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';

    var textWrap = document.createElement("div");
    var name = document.createElement("div");
    name.className = "name";
    name.textContent = file.name;
    var meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = formatSize(file.size);
    textWrap.appendChild(name);
    textWrap.appendChild(meta);

    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-btn";
    remove.textContent = "Remove";
    remove.addEventListener("click", function (event) {
      event.stopPropagation();
      resetAll();
    });

    row.appendChild(icon);
    row.appendChild(textWrap);
    row.appendChild(remove);
    els.uploadZone.appendChild(row);
  }

  function updateControls() {
    var hasQuery = !!(els.findInput && els.findInput.value.trim());
    var hasMatches = state.matches.length > 0;
    if (els.findBtn) els.findBtn.disabled = !state.pdfDoc || !hasQuery;
    if (els.replaceSelectedBtn) els.replaceSelectedBtn.disabled = !hasMatches || state.activeMatchIdx < 0;
    if (els.replaceAllBtn) els.replaceAllBtn.disabled = !hasMatches;
    if (els.prevMatchBtn) els.prevMatchBtn.disabled = !hasMatches || state.matches.length < 2;
    if (els.nextMatchBtn) els.nextMatchBtn.disabled = !hasMatches || state.matches.length < 2;
    if (els.pageRanges) els.pageRanges.disabled = !(els.pageScope && els.pageScope.value === "custom");
    if (els.customFontSize) els.customFontSize.disabled = !(els.fontSizeMode && els.fontSizeMode.value === "custom");
    if (els.backgroundOpacityValue && els.backgroundOpacity) els.backgroundOpacityValue.textContent = els.backgroundOpacity.value + "%";
  }

  function setSummary(html) {
    if (!els.replacementSummary) return;
    els.replacementSummary.innerHTML = html;
    els.replacementSummary.classList.add("on");
  }

  function clearSummary() {
    if (!els.replacementSummary) return;
    els.replacementSummary.textContent = "Upload a PDF and run a search to see replacement details.";
    els.replacementSummary.classList.remove("on");
  }

  async function handleFile(file) {
    if (!isPdfFile(file)) {
      showStatus("Choose a PDF file to continue.", "error");
      return;
    }
    if (!hasRuntime()) {
      showStatus("PDF tools did not load. Refresh the page and try again.", "error");
      return;
    }

    hideStatus();
    state.file = file;
    state.matches = [];
    state.activeMatchIdx = -1;
    state.appliedRows = [];
    state.modifiedBytes = null;
    renderFileInfo(file);
    clearHighlights();
    clearSummary();

    try {
      var result = await window.PdfUtils.loadPdf(file);
      state.originalBytes = cloneBytes(result.arrayBuffer);
      state.activeBytes = cloneBytes(result.arrayBuffer);
      state.pdfDoc = result.pdfDoc;
      state.pageCount = result.pageCount;
      state.currentPage = 1;
      state.textData = await window.PdfUtils.extractText(state.pdfDoc);

      if (els.frCard) els.frCard.style.display = "block";
      if (els.previewCard) els.previewCard.style.display = "block";
      if (els.matchCard) els.matchCard.style.display = "block";
      if (els.replaceActions) els.replaceActions.style.display = "none";
      if (els.downloadBtn) els.downloadBtn.style.display = "none";
      if (els.downloadReportBtn) els.downloadReportBtn.style.display = "none";
      if (els.undoBtn) els.undoBtn.style.display = "none";
      if (els.matchCount) els.matchCount.textContent = "0 matches";
      if (els.matchList) els.matchList.innerHTML = '<div class="no-matches">Run a search to see matches here</div>';

      await renderPage(1);
      showStatus("PDF loaded. Enter text to find.", "success");
      updateControls();
    } catch (err) {
      resetAll();
      showStatus("Failed to load PDF: " + (err && err.message ? err.message : "Unknown PDF error"), "error");
    }
  }

  function resetAll() {
    state.file = null;
    state.originalBytes = null;
    state.activeBytes = null;
    state.modifiedBytes = null;
    state.pdfDoc = null;
    state.pageCount = 0;
    state.currentPage = 1;
    state.textData = null;
    state.matches = [];
    state.activeMatchIdx = -1;
    state.appliedRows = [];

    resetUploadZone();
    if (els.frCard) els.frCard.style.display = "none";
    if (els.previewCard) els.previewCard.style.display = "none";
    if (els.matchCard) els.matchCard.style.display = "none";
    if (els.replaceActions) els.replaceActions.style.display = "none";
    if (els.downloadBtn) els.downloadBtn.style.display = "none";
    if (els.downloadReportBtn) els.downloadReportBtn.style.display = "none";
    if (els.undoBtn) els.undoBtn.style.display = "none";
    if (els.findInput) els.findInput.value = "";
    if (els.replaceInput) els.replaceInput.value = "";
    if (els.fileInput) els.fileInput.value = "";
    if (els.pdfCanvas) {
      els.pdfCanvas.width = 0;
      els.pdfCanvas.height = 0;
    }
    hideStatus();
    clearHighlights();
    clearSummary();
    updateControls();
  }

  async function reloadPdfFromBytes(bytes) {
    var pdfjs = window.PdfUtils.getPdfJs() || await window.PdfUtils.ensurePdfJs();
    var pdfDoc = await pdfjs.getDocument({ data: cloneBytes(bytes) }).promise;
    state.pdfDoc = pdfDoc;
    state.pageCount = pdfDoc.numPages;
    state.textData = await window.PdfUtils.extractText(pdfDoc);
  }

  async function renderPage(pageNumber) {
    if (!state.pdfDoc || !els.pdfCanvas) return;
    var target = clamp(pageNumber, 1, state.pageCount || 1);
    var page = await state.pdfDoc.getPage(target);
    var viewport = page.getViewport({ scale: renderScale });
    els.pdfCanvas.width = viewport.width;
    els.pdfCanvas.height = viewport.height;
    await page.render({ canvasContext: els.pdfCanvas.getContext("2d"), viewport: viewport }).promise;
    state.currentPage = target;
    updatePageNav();
    drawHighlights();
  }

  function updatePageNav() {
    if (els.pageLabel) els.pageLabel.textContent = "Page " + state.currentPage + " of " + (state.pageCount || 1);
    if (els.pageInfo) els.pageInfo.textContent = (state.pageCount || 0) + " page" + (state.pageCount === 1 ? "" : "s");
    if (els.prevPage) els.prevPage.disabled = state.currentPage <= 1;
    if (els.nextPage) els.nextPage.disabled = state.currentPage >= state.pageCount;
  }

  function buildMatchForItem(item, pageNum, itemIdx, startIdx, length, matchedText) {
    var sourceText = item.str || "";
    var charRatio = sourceText.length ? item.width / sourceText.length : 0;
    var width = Math.max(charRatio * Math.max(length, 1), Math.min(item.width || 16, 120), 8);
    return {
      page: pageNum,
      text: sourceText,
      matchedText: matchedText,
      x: (item.x || 0) + startIdx * charRatio,
      y: item.y || 0,
      width: width,
      height: Math.max(item.height || 10, 8),
      itemIndex: itemIdx,
      charIndex: startIdx,
      charLength: length
    };
  }

  function findInItem(item, pageNum, itemIdx, query, isCaseSensitive, isWholeWord, isRegex) {
    var found = [];
    var text = item.str || "";
    if (!text) return found;

    if (isRegex) {
      var flags = isCaseSensitive ? "g" : "gi";
      var regex = new RegExp(query, flags);
      var match;
      while ((match = regex.exec(text)) !== null) {
        var matched = match[0] || "";
        var length = matched.length;
        if (!length) {
          regex.lastIndex += 1;
          continue;
        }
        if (!isWholeWord || hasWordBoundary(text, match.index, length)) {
          found.push(buildMatchForItem(item, pageNum, itemIdx, match.index, length, matched));
        }
      }
      return found;
    }

    var needle = isCaseSensitive ? query : query.toLowerCase();
    var haystack = isCaseSensitive ? text : text.toLowerCase();
    var cursor = 0;
    while (cursor <= haystack.length) {
      var index = haystack.indexOf(needle, cursor);
      if (index === -1) break;
      if (!isWholeWord || hasWordBoundary(text, index, needle.length)) {
        found.push(buildMatchForItem(item, pageNum, itemIdx, index, needle.length, text.substr(index, needle.length)));
      }
      cursor = index + Math.max(needle.length, 1);
    }
    return found;
  }

  async function performFind() {
    var query = els.findInput && els.findInput.value.trim();
    if (!query || !state.textData) return;

    hideStatus();
    state.matches = [];
    state.activeMatchIdx = -1;
    state.appliedRows = [];
    if (els.findBtn) els.findBtn.disabled = true;
    if (els.findSpinner) els.findSpinner.style.display = "inline-block";
    if (els.downloadBtn) els.downloadBtn.style.display = "none";
    if (els.downloadReportBtn) els.downloadReportBtn.style.display = "none";
    if (els.undoBtn) els.undoBtn.style.display = state.modifiedBytes ? "flex" : "none";

    try {
      var pages = selectedPageSet();
      var isCaseSensitive = !!(els.caseSensitive && els.caseSensitive.checked);
      var isWholeWord = !!(els.wholeWord && els.wholeWord.checked);
      var isRegex = !!(els.regexMode && els.regexMode.checked);

      if (isRegex) {
        new RegExp(query, isCaseSensitive ? "g" : "gi");
      }

      state.textData.forEach(function (pageData) {
        if (!pages.has(pageData.page)) return;
        pageData.items.forEach(function (item, itemIdx) {
          state.matches = state.matches.concat(findInItem(item, pageData.page, itemIdx, query, isCaseSensitive, isWholeWord, isRegex));
        });
      });

      if (els.matchCount) {
        els.matchCount.textContent = state.matches.length + " match" + (state.matches.length === 1 ? "" : "es");
      }
      if (state.matches.length) {
        state.activeMatchIdx = 0;
        if (els.replaceActions) els.replaceActions.style.display = "block";
        renderMatchList();
        await renderPage(state.matches[0].page);
        showStatus(state.matches.length + " match" + (state.matches.length === 1 ? "" : "es") + " found on " + pageScopeLabel() + ".", "success");
        setSummary(buildFindSummary());
      } else {
        if (els.replaceActions) els.replaceActions.style.display = "none";
        renderMatchList();
        clearHighlights();
        setSummary("No matches found on " + escapeHtml(pageScopeLabel()) + ".");
        showStatus("No matches found for " + query + ".", "error");
      }
    } catch (err) {
      state.matches = [];
      state.activeMatchIdx = -1;
      renderMatchList();
      clearHighlights();
      showStatus(err && err.message ? err.message : "Search failed.", "error");
    } finally {
      if (els.findSpinner) els.findSpinner.style.display = "none";
      updateControls();
    }
  }

  function buildFindSummary() {
    var pages = new Set(state.matches.map(function (match) { return match.page; }));
    return [
      "<strong>Ready to replace.</strong> Review the match list before editing.",
      '<div class="summary-grid">',
      '<div class="summary-stat"><strong>' + state.matches.length + '</strong><span>Matches</span></div>',
      '<div class="summary-stat"><strong>' + pages.size + '</strong><span>Pages hit</span></div>',
      '<div class="summary-stat"><strong>' + escapeHtml(pageScopeLabel()) + '</strong><span>Scope</span></div>',
      "</div>"
    ].join("");
  }

  function clearHighlights() {
    if (!els.canvasWrap) return;
    Array.prototype.forEach.call(els.canvasWrap.querySelectorAll(".highlight-overlay"), function (node) {
      node.remove();
    });
  }

  function drawHighlights() {
    clearHighlights();
    if (!state.pdfDoc || !els.canvasWrap || !els.pdfCanvas) return;
    var pageMatches = state.matches.filter(function (match) {
      return match.page === state.currentPage;
    });
    if (!pageMatches.length) return;

    state.pdfDoc.getPage(state.currentPage).then(function (page) {
      var viewport = page.getViewport({ scale: renderScale });
      var canvasRect = els.pdfCanvas.getBoundingClientRect();
      var wrapRect = els.canvasWrap.getBoundingClientRect();
      var offsetX = canvasRect.left - wrapRect.left;
      var offsetY = canvasRect.top - wrapRect.top;
      var scaleX = canvasRect.width / viewport.width;
      var scaleY = canvasRect.height / viewport.height;

      pageMatches.forEach(function (match) {
        var topLeft = viewport.convertToViewportPoint(match.x, match.y + match.height);
        var bottomRight = viewport.convertToViewportPoint(match.x + match.width, match.y - 2);
        var highlight = document.createElement("div");
        var globalIdx = state.matches.indexOf(match);
        highlight.className = "highlight-overlay" + (globalIdx === state.activeMatchIdx ? " active" : "");
        highlight.style.left = (Math.min(topLeft[0], bottomRight[0]) * scaleX + offsetX) + "px";
        highlight.style.top = (Math.min(topLeft[1], bottomRight[1]) * scaleY + offsetY) + "px";
        highlight.style.width = Math.max(Math.abs(bottomRight[0] - topLeft[0]) * scaleX, 12) + "px";
        highlight.style.height = Math.max(Math.abs(bottomRight[1] - topLeft[1]) * scaleY, 10) + "px";
        els.canvasWrap.appendChild(highlight);
      });
    }).catch(function () {});
  }

  function contextHtml(match) {
    var text = match.text || "";
    var start = match.charIndex || 0;
    var length = match.charLength || (match.matchedText || "").length;
    var before = text.substring(Math.max(0, start - 26), start);
    var hit = text.substring(start, start + length);
    var after = text.substring(start + length, start + length + 26);
    if (start > 26) before = "..." + before;
    if (start + length + 26 < text.length) after += "...";
    return escapeHtml(before) + "<mark>" + escapeHtml(hit) + "</mark>" + escapeHtml(after);
  }

  function renderMatchList() {
    if (!els.matchList) return;
    els.matchList.textContent = "";
    if (!state.matches.length) {
      var empty = document.createElement("div");
      empty.className = "no-matches";
      empty.textContent = "No matches found";
      els.matchList.appendChild(empty);
      if (els.matchCount) els.matchCount.textContent = "0 matches";
      updateControls();
      return;
    }

    state.matches.forEach(function (match, index) {
      var item = document.createElement("div");
      item.className = "match-item" + (index === state.activeMatchIdx ? " active" : "");
      item.dataset.idx = String(index);
      item.innerHTML = '<div class="page-label">Page ' + match.page + '</div><div class="context">' + contextHtml(match) + '</div><div class="meta-line">Match ' + (index + 1) + " of " + state.matches.length + "</div>";
      item.addEventListener("click", function () {
        activateMatch(index);
      });
      els.matchList.appendChild(item);
    });
    if (els.matchCount) {
      els.matchCount.textContent = state.matches.length + " match" + (state.matches.length === 1 ? "" : "es");
    }
    updateControls();
  }

  async function activateMatch(index) {
    if (!state.matches.length) return;
    state.activeMatchIdx = clamp(index, 0, state.matches.length - 1);
    renderMatchList();
    var match = state.matches[state.activeMatchIdx];
    if (state.currentPage !== match.page) {
      await renderPage(match.page);
    } else {
      drawHighlights();
    }
    var node = els.matchList && els.matchList.querySelector('.match-item[data-idx="' + state.activeMatchIdx + '"]');
    if (node && node.scrollIntoView) node.scrollIntoView({ block: "nearest" });
    updateControls();
  }

  function replacementFontSize(font, text, match, cfg) {
    var size = cfg.fontSizeMode === "custom" ? cfg.customFontSize : Math.max(6, Math.min(18, match.height * 0.86));
    if (cfg.fitToBox && text) {
      var maxWidth = Math.max(8, match.width - 2);
      while (size > 5.5 && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.5;
    }
    return size;
  }

  function drawReplacement(page, font, match, replaceText, cfg) {
    var lib = window.PDFLib;
    var pad = cfg.padding;
    var fontSize = replacementFontSize(font, replaceText, match, cfg);
    var rectHeight = Math.max(match.height + pad * 2, fontSize + pad * 2);
    var rectWidth = Math.max(match.width + pad * 2, 10);
    var coverX = Math.max(0, match.x - pad);
    var coverY = Math.max(0, match.y - pad);
    page.drawRectangle({
      x: coverX,
      y: coverY,
      width: rectWidth,
      height: rectHeight,
      color: lib.rgb(cfg.backgroundColor.r, cfg.backgroundColor.g, cfg.backgroundColor.b),
      opacity: cfg.opacity
    });
    if (replaceText) {
      page.drawText(replaceText, {
        x: match.x,
        y: match.y + Math.max(0, (match.height - fontSize) * 0.18),
        size: fontSize,
        font: font,
        color: lib.rgb(cfg.textColor.r, cfg.textColor.g, cfg.textColor.b)
      });
    }
    return { fontSize: fontSize, width: rectWidth, height: rectHeight };
  }

  async function applyReplacements(mode) {
    if (!state.originalBytes || !state.matches.length) return;
    var chosen = mode === "selected" ? [state.matches[state.activeMatchIdx]] : state.matches.slice();
    chosen = chosen.filter(Boolean);
    if (!chosen.length) return;

    var replaceText = els.replaceInput ? els.replaceInput.value : "";
    var cfg = styleConfig();
    var button = mode === "selected" ? els.replaceSelectedBtn : els.replaceAllBtn;
    if (button) button.disabled = true;

    try {
      var lib = window.PDFLib;
      var pdf = await lib.PDFDocument.load(cloneBytes(state.originalBytes), { ignoreEncryption: false });
      var font = await pdf.embedFont(lib.StandardFonts.Helvetica);
      var pages = pdf.getPages();
      var rows = [];

      chosen.forEach(function (match, idx) {
        var page = pages[match.page - 1];
        if (!page) return;
        var drawInfo = drawReplacement(page, font, match, replaceText, cfg);
        rows.push({
          order: idx + 1,
          page: match.page,
          matchedText: match.matchedText,
          replacement: replaceText,
          x: match.x.toFixed(2),
          y: match.y.toFixed(2),
          width: match.width.toFixed(2),
          height: match.height.toFixed(2),
          fontSize: drawInfo.fontSize.toFixed(1),
          mode: mode
        });
      });

      pdf.setProducer("AfroTools PDF Find & Replace");
      pdf.setModificationDate(new Date());
      var modified = await pdf.save();
      state.modifiedBytes = cloneBytes(modified);
      state.activeBytes = cloneBytes(modified);
      state.appliedRows = rows;
      state.matches = [];
      state.activeMatchIdx = -1;

      await reloadPdfFromBytes(state.activeBytes);
      await renderPage(Math.min(state.currentPage, state.pageCount || 1));
      renderMatchList();
      if (els.replaceActions) els.replaceActions.style.display = "block";
      if (els.downloadBtn) els.downloadBtn.style.display = "flex";
      if (els.downloadReportBtn) els.downloadReportBtn.style.display = "flex";
      if (els.undoBtn) els.undoBtn.style.display = "flex";
      if (els.matchCount) els.matchCount.textContent = "0 matches";
      setSummary(buildReplacementSummary(rows, mode));
      showStatus("Replacement complete. Download the PDF or export the CSV audit.", "success");
    } catch (err) {
      showStatus("Replace failed: " + (err && err.message ? err.message : "Unable to edit this PDF."), "error");
    } finally {
      updateControls();
    }
  }

  function buildReplacementSummary(rows, mode) {
    var pages = new Set(rows.map(function (row) { return row.page; }));
    return [
      "<strong>Replacement complete.</strong> " + (mode === "selected" ? "Applied the selected match." : "Applied every scoped match."),
      '<div class="summary-grid">',
      '<div class="summary-stat"><strong>' + rows.length + '</strong><span>Replacements</span></div>',
      '<div class="summary-stat"><strong>' + pages.size + '</strong><span>Pages edited</span></div>',
      '<div class="summary-stat"><strong>CSV</strong><span>Audit ready</span></div>',
      "</div>"
    ].join("");
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 5000);
  }

  function doDownloadPdf() {
    if (!state.activeBytes) return;
    var name = safeBaseName(state.file && state.file.name) + "-find-replace.pdf";
    downloadBlob(new Blob([state.activeBytes], { type: "application/pdf" }), name);
  }

  function csvCell(value) {
    var text = String(value == null ? "" : value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function buildReportCsv() {
    var lines = [
      "file,find,replace,page,matched_text,x,y,width,height,font_size,mode,scope,created_at"
    ];
    var findText = els.findInput && els.findInput.value.trim();
    var replaceText = els.replaceInput && els.replaceInput.value;
    var created = new Date().toISOString();
    state.appliedRows.forEach(function (row) {
      lines.push([
        csvCell(state.file && state.file.name),
        csvCell(findText),
        csvCell(replaceText),
        row.page,
        csvCell(row.matchedText),
        row.x,
        row.y,
        row.width,
        row.height,
        row.fontSize,
        row.mode,
        csvCell(pageScopeLabel()),
        created
      ].join(","));
    });
    return lines.join("\r\n");
  }

  function downloadReport() {
    if (!state.appliedRows.length) return;
    var name = safeBaseName(state.file && state.file.name) + "-find-replace-audit.csv";
    downloadBlob(new Blob([buildReportCsv()], { type: "text/csv;charset=utf-8" }), name);
  }

  async function undoOutput() {
    if (!state.originalBytes) return;
    state.modifiedBytes = null;
    state.activeBytes = cloneBytes(state.originalBytes);
    state.appliedRows = [];
    state.matches = [];
    state.activeMatchIdx = -1;
    await reloadPdfFromBytes(state.activeBytes);
    await renderPage(Math.min(state.currentPage, state.pageCount || 1));
    renderMatchList();
    if (els.downloadBtn) els.downloadBtn.style.display = "none";
    if (els.downloadReportBtn) els.downloadReportBtn.style.display = "none";
    if (els.undoBtn) els.undoBtn.style.display = "none";
    if (els.replaceActions) els.replaceActions.style.display = "none";
    clearSummary();
    showStatus("Output reset to the original PDF. Run Find Matches again to replace.", "success");
    updateControls();
  }

  function bindEvents() {
    if (els.uploadZone) {
      els.uploadZone.addEventListener("click", function (event) {
        if (event.target && event.target.closest && event.target.closest("button")) return;
        if (els.fileInput) els.fileInput.click();
      });
      els.uploadZone.addEventListener("dragover", function (event) {
        event.preventDefault();
        els.uploadZone.classList.add("dragover");
      });
      els.uploadZone.addEventListener("dragleave", function () {
        els.uploadZone.classList.remove("dragover");
      });
      els.uploadZone.addEventListener("drop", function (event) {
        event.preventDefault();
        els.uploadZone.classList.remove("dragover");
        handleFile(event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]);
      });
    }

    if (els.fileInput) {
      els.fileInput.addEventListener("change", function () {
        handleFile(els.fileInput.files && els.fileInput.files[0]);
      });
    }

    if (els.findInput) {
      els.findInput.addEventListener("input", updateControls);
      els.findInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && els.findInput.value.trim()) performFind();
      });
    }

    ["caseSensitive", "wholeWord", "regexMode", "pageScope", "pageRanges", "fontSizeMode", "customFontSize", "backgroundOpacity", "fitToBox"].forEach(function (id) {
      if (els[id]) els[id].addEventListener(id === "pageRanges" || id === "customFontSize" || id === "backgroundOpacity" ? "input" : "change", updateControls);
    });

    if (els.findBtn) els.findBtn.addEventListener("click", performFind);
    if (els.replaceSelectedBtn) els.replaceSelectedBtn.addEventListener("click", function () { applyReplacements("selected"); });
    if (els.replaceAllBtn) els.replaceAllBtn.addEventListener("click", function () { applyReplacements("all"); });
    if (els.undoBtn) els.undoBtn.addEventListener("click", undoOutput);
    if (els.downloadBtn) {
      els.downloadBtn.addEventListener("click", function () {
        var gate = document.querySelector("email-gate-modal");
        if (gate && typeof gate.show === "function") gate.show(doDownloadPdf);
        else doDownloadPdf();
      });
    }
    if (els.downloadReportBtn) els.downloadReportBtn.addEventListener("click", downloadReport);
    if (els.prevMatchBtn) els.prevMatchBtn.addEventListener("click", function () { activateMatch(state.activeMatchIdx - 1); });
    if (els.nextMatchBtn) els.nextMatchBtn.addEventListener("click", function () { activateMatch(state.activeMatchIdx + 1); });
    if (els.prevPage) els.prevPage.addEventListener("click", function () { renderPage(state.currentPage - 1); });
    if (els.nextPage) els.nextPage.addEventListener("click", function () { renderPage(state.currentPage + 1); });
    window.addEventListener("resize", drawHighlights);
  }

  function init() {
    cacheElements();
    bindEvents();
    resetUploadZone();
    updateControls();
    if (!hasRuntime()) {
      showStatus("PDF libraries are unavailable. Refresh the page and try again.", "error");
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
