/* AfroTools PDF Workflow Builder */
(function () {
  "use strict";

  var PRESET_KEY = "afrotools_pdf_workflow_recipe_v2";
  var state = {
    inputFile: null,
    inputBytes: null,
    pipeline: [],
    resultBytes: null,
    resultPassword: "",
    report: null,
    dragIdx: -1
  };

  var els = {};
  var ids = [
    "pdfFileInput", "uploadLabel", "fileInfo", "fileName", "fileMeta", "clearFile",
    "pipelineCard", "pipelineStrip", "addStepBtn", "stepCount", "paletteOverlay",
    "paletteClose", "paletteGrid", "configOverlay", "configTitle", "configBody",
    "configClose", "configCancel", "configSave", "runSection", "runBtn",
    "progressSection", "progressFill", "progressLabel", "resultCard", "resultIcon",
    "resultMsg", "resultSize", "downloadBtn", "downloadReportBtn", "workflowReport",
    "quickPresetBtn", "savePresetBtn", "loadPresetBtn", "exportPresetBtn",
    "importPresetBtn", "importPresetInput", "validateBtn", "clearPipelineBtn"
  ];

  var configStepId = null;

  var OP_DEFS = {
    repair: { icon: "R", name: "Repair", defaultConfig: { mode: "compatibility" } },
    optimize: { icon: "O", name: "Optimize", defaultConfig: { mode: "compatibility" } },
    compress: { icon: "C", name: "Compress", defaultConfig: { preset: "web" } },
    watermark: { icon: "W", name: "Watermark", defaultConfig: { text: "DRAFT", color: "#64748b", opacity: 30, fontSize: 54, position: "diagonal" } },
    password: { icon: "P", name: "Password", defaultConfig: { userPassword: "", ownerPassword: "", keyLength: 256 } },
    pageNumbers: { icon: "#", name: "Page Numbers", defaultConfig: { format: "ofn", position: "bottom-center", fontSize: 11, startNum: 1 } },
    keepPages: { icon: "K", name: "Keep Pages", defaultConfig: { ranges: "1-" } },
    flatten: { icon: "F", name: "Flatten", defaultConfig: { scale: "1.25" } },
    rotate: { icon: "T", name: "Rotate All", defaultConfig: { angle: 90 } },
    merge: { icon: "M", name: "Merge", defaultConfig: { additionalFiles: [], fileNames: [] } }
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function cacheElements() {
    ids.forEach(function (id) {
      els[id] = byId(id);
    });
  }

  function cloneBytes(bytes) {
    if (!bytes) return null;
    if (bytes instanceof Uint8Array) return new Uint8Array(bytes);
    if (bytes instanceof ArrayBuffer) return new Uint8Array(bytes.slice(0));
    return new Uint8Array(bytes);
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function formatSize(bytes) {
    if (!Number.isFinite(bytes)) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function safeName(name) {
    return String(name || "document").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim() || "document";
  }

  function escapeHtml(value) {
    var div = document.createElement("div");
    div.textContent = String(value == null ? "" : value);
    return div.innerHTML;
  }

  function escAttr(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }

  function isPdf(file) {
    return !!(file && ((file.type && file.type === "application/pdf") || /\.pdf$/i.test(file.name || "")));
  }

  function setProgress(percent, label) {
    if (els.progressSection) els.progressSection.classList.add("on");
    if (els.progressFill) els.progressFill.style.width = Math.max(0, Math.min(100, percent)) + "%";
    if (els.progressLabel && label) els.progressLabel.textContent = label;
  }

  function hideProgressLater() {
    setTimeout(function () {
      if (els.progressSection) els.progressSection.classList.remove("on");
    }, 900);
  }

  async function pageCount(bytes, password) {
    var pdfjs = await window.PdfUtils.ensurePdfJs();
    var doc = await pdfjs.getDocument({ data: cloneBytes(bytes), password: password || undefined }).promise;
    return doc.numPages || 0;
  }

  function cleanConfigForRecipe(config) {
    var copy = {};
    Object.keys(config || {}).forEach(function (key) {
      if (key === "additionalFiles") return;
      copy[key] = config[key];
    });
    if (Array.isArray(copy.fileNames)) copy.fileNames = [];
    return copy;
  }

  function recipeObject() {
    return {
      version: 2,
      tool: "pdf-workflow",
      steps: state.pipeline.map(function (step) {
        return {
          type: step.type,
          config: cleanConfigForRecipe(step.config)
        };
      })
    };
  }

  function loadRecipe(recipe) {
    if (!recipe || !Array.isArray(recipe.steps)) throw new Error("This file is not a PDF workflow recipe.");
    state.pipeline = recipe.steps.filter(function (step) {
      return OP_DEFS[step.type];
    }).map(function (step) {
      var config = Object.assign({}, OP_DEFS[step.type].defaultConfig, step.config || {});
      if (step.type === "merge") {
        config.additionalFiles = [];
        config.fileNames = [];
      }
      return { id: uid(), type: step.type, config: config };
    });
    renderPipeline();
    updateRunButton();
  }

  function addReviewPreset() {
    state.pipeline = [
      { id: uid(), type: "repair", config: { mode: "compatibility" } },
      { id: uid(), type: "pageNumbers", config: { format: "ofn", position: "bottom-center", fontSize: 11, startNum: 1 } },
      { id: uid(), type: "watermark", config: { text: "REVIEW COPY", color: "#64748b", opacity: 18, fontSize: 48, position: "diagonal" } },
      { id: uid(), type: "optimize", config: { mode: "compatibility" } }
    ];
    renderPipeline();
    updateRunButton();
  }

  function showResult(ok, message, detail) {
    if (els.resultCard) els.resultCard.classList.add("on");
    if (els.resultIcon) els.resultIcon.textContent = ok ? "OK" : "!";
    if (els.resultMsg) els.resultMsg.textContent = message;
    if (els.resultSize) els.resultSize.textContent = detail || "";
    if (els.downloadBtn) els.downloadBtn.style.display = ok && state.resultBytes ? "inline-flex" : "none";
    if (els.downloadReportBtn) els.downloadReportBtn.style.display = state.report ? "inline-flex" : "none";
    renderReportBox();
  }

  function renderReportBox() {
    if (!els.workflowReport || !state.report) return;
    els.workflowReport.style.display = "block";
    var lines = [];
    lines.push("Workflow report");
    lines.push("Input: " + state.report.inputName);
    lines.push("Original: " + formatSize(state.report.originalSize));
    state.report.steps.forEach(function (step, index) {
      lines.push((index + 1) + ". " + step.name + " | " + step.status + " | " + formatSize(step.beforeBytes) + " -> " + formatSize(step.afterBytes || step.beforeBytes) + (step.note ? " | " + step.note : ""));
    });
    if (state.report.finalPages) lines.push("Final pages: " + state.report.finalPages);
    if (state.report.passwordApplied) lines.push("Encrypted: yes");
    els.workflowReport.textContent = lines.join("\n");
  }

  function renderPipeline() {
    if (!els.pipelineStrip) return;
    els.pipelineStrip.textContent = "";
    if (!state.pipeline.length) {
      var empty = document.createElement("div");
      empty.className = "pipeline-empty";
      empty.textContent = "Click + Add Step to start building your pipeline";
      els.pipelineStrip.appendChild(empty);
    }

    state.pipeline.forEach(function (step, index) {
      if (index > 0) {
        var arrow = document.createElement("div");
        arrow.className = "pipeline-arrow";
        arrow.textContent = "->";
        els.pipelineStrip.appendChild(arrow);
      }
      var def = OP_DEFS[step.type];
      var card = document.createElement("div");
      card.className = "pipeline-step";
      card.draggable = true;
      card.dataset.idx = String(index);
      card.innerHTML =
        '<div class="ps-icon">' + escapeHtml(def.icon) + '</div>' +
        '<div class="ps-name">' + escapeHtml(def.name) + '</div>' +
        '<div class="ps-sub">' + escapeHtml(subLabel(step)) + '</div>' +
        '<div class="ps-actions">' +
        '<button class="ps-config" type="button" title="Configure">...</button>' +
        '<button class="ps-remove" type="button" title="Remove">&times;</button>' +
        '</div>';
      card.querySelector(".ps-config").addEventListener("click", function (event) {
        event.stopPropagation();
        openConfig(step.id);
      });
      card.querySelector(".ps-remove").addEventListener("click", function (event) {
        event.stopPropagation();
        state.pipeline = state.pipeline.filter(function (item) { return item.id !== step.id; });
        renderPipeline();
        updateRunButton();
      });
      card.addEventListener("dragstart", function (event) {
        state.dragIdx = index;
        card.classList.add("dragging");
        event.dataTransfer.effectAllowed = "move";
      });
      card.addEventListener("dragend", function () {
        state.dragIdx = -1;
        card.classList.remove("dragging");
      });
      card.addEventListener("dragover", function (event) {
        event.preventDefault();
        card.classList.add("drag-over");
      });
      card.addEventListener("dragleave", function () {
        card.classList.remove("drag-over");
      });
      card.addEventListener("drop", function (event) {
        event.preventDefault();
        card.classList.remove("drag-over");
        var toIdx = parseInt(card.dataset.idx, 10);
        if (state.dragIdx >= 0 && state.dragIdx !== toIdx) {
          var moved = state.pipeline.splice(state.dragIdx, 1)[0];
          state.pipeline.splice(toIdx, 0, moved);
          renderPipeline();
        }
      });
      els.pipelineStrip.appendChild(card);
    });

    var add = document.createElement("button");
    add.className = "pipeline-add";
    add.type = "button";
    add.textContent = "+ Add Step";
    add.addEventListener("click", openPalette);
    els.pipelineStrip.appendChild(add);
    if (els.stepCount) els.stepCount.textContent = state.pipeline.length + " step" + (state.pipeline.length === 1 ? "" : "s");
  }

  function subLabel(step) {
    var c = step.config || {};
    if (step.type === "watermark") return c.text || "DRAFT";
    if (step.type === "password") return c.userPassword ? "AES-" + (c.keyLength || 256) : "needs password";
    if (step.type === "pageNumbers") return c.format || "numeric";
    if (step.type === "rotate") return String(c.angle || 90) + " deg";
    if (step.type === "merge") return (c.fileNames || []).length + " extra file" + ((c.fileNames || []).length === 1 ? "" : "s");
    if (step.type === "compress") return c.preset || "web";
    if (step.type === "keepPages") return c.ranges || "1-";
    if (step.type === "flatten") return (c.scale || "1.25") + "x";
    if (step.type === "optimize" || step.type === "repair") return c.mode || "compatibility";
    return "";
  }

  function updateRunButton() {
    var canRun = !!(state.inputBytes && state.pipeline.length);
    if (els.runBtn) {
      els.runBtn.disabled = !canRun;
      els.runBtn.textContent = "Run " + (state.pipeline.length ? state.pipeline.length + "-Step " : "") + "Pipeline";
    }
    if (els.pipelineCard) els.pipelineCard.style.display = state.inputBytes ? "block" : "none";
    if (els.runSection) els.runSection.style.display = state.inputBytes ? "block" : "none";
  }

  function openPalette() {
    if (els.paletteOverlay) els.paletteOverlay.classList.add("on");
  }

  function closePalette() {
    if (els.paletteOverlay) els.paletteOverlay.classList.remove("on");
  }

  function addStep(type) {
    var def = OP_DEFS[type];
    if (!def) return;
    state.pipeline.push({ id: uid(), type: type, config: JSON.parse(JSON.stringify(def.defaultConfig)) });
    closePalette();
    renderPipeline();
    updateRunButton();
    openConfig(state.pipeline[state.pipeline.length - 1].id);
  }

  function openConfig(stepId) {
    var step = state.pipeline.find(function (item) { return item.id === stepId; });
    if (!step) return;
    configStepId = stepId;
    if (els.configTitle) els.configTitle.textContent = "Configure " + OP_DEFS[step.type].name;
    if (!els.configBody) return;
    if (step.type === "repair") buildRepairConfig(step);
    if (step.type === "optimize") buildOptimizeConfig(step);
    if (step.type === "compress") buildCompressConfig(step);
    if (step.type === "watermark") buildWatermarkConfig(step);
    if (step.type === "password") buildPasswordConfig(step);
    if (step.type === "pageNumbers") buildPageNumbersConfig(step);
    if (step.type === "keepPages") buildKeepPagesConfig(step);
    if (step.type === "flatten") buildFlattenConfig(step);
    if (step.type === "rotate") buildRotateConfig(step);
    if (step.type === "merge") buildMergeConfig(step);
    if (els.configOverlay) els.configOverlay.classList.add("on");
  }

  function closeConfig() {
    if (els.configOverlay) els.configOverlay.classList.remove("on");
    configStepId = null;
  }

  function field(label, body) {
    return '<div class="cfg-field"><span class="cfg-label">' + escapeHtml(label) + "</span>" + body + "</div>";
  }

  function buildRepairConfig(step) {
    var c = step.config;
    els.configBody.innerHTML = field("Mode", '<select class="cfg-select" id="cfgRepairMode"><option value="compatibility"' + (c.mode === "compatibility" ? " selected" : "") + '>Compatibility rebuild</option><option value="linearize"' + (c.mode === "linearize" ? " selected" : "") + ">Fast web view</option></select>");
  }

  function buildOptimizeConfig(step) {
    var c = step.config;
    els.configBody.innerHTML = field("Mode", '<select class="cfg-select" id="cfgOptimizeMode"><option value="compatibility"' + (c.mode === "compatibility" ? " selected" : "") + '>Compatibility cleanup</option><option value="linearize"' + (c.mode === "linearize" ? " selected" : "") + ">Linearized output</option></select>");
  }

  function buildCompressConfig(step) {
    var c = step.config;
    var options = ["screen", "web", "ebook", "print"].map(function (value) {
      return '<option value="' + value + '"' + (c.preset === value ? " selected" : "") + ">" + value + "</option>";
    }).join("");
    els.configBody.innerHTML = field("Quality preset", '<select class="cfg-select" id="cfgCompressPreset">' + options + "</select>") +
      '<div class="preset-desc">Compression rasterizes pages. Choose Optimize if you need selectable text preserved.</div>';
  }

  function buildWatermarkConfig(step) {
    var c = step.config;
    els.configBody.innerHTML =
      field("Text", '<input class="cfg-input" id="cfgWmText" value="' + escAttr(c.text || "") + '">') +
      field("Color", '<input type="color" id="cfgWmColor" value="' + escAttr(c.color || "#64748b") + '">') +
      field("Opacity", '<input class="cfg-input" type="number" min="5" max="100" id="cfgWmOpacity" value="' + escAttr(c.opacity || 30) + '">') +
      field("Font size", '<input class="cfg-input" type="number" min="12" max="140" id="cfgWmFontSize" value="' + escAttr(c.fontSize || 54) + '">') +
      field("Position", '<select class="cfg-select" id="cfgWmPosition"><option value="diagonal"' + (c.position === "diagonal" ? " selected" : "") + '>Diagonal</option><option value="center"' + (c.position === "center" ? " selected" : "") + '>Center</option><option value="top"' + (c.position === "top" ? " selected" : "") + '>Top</option><option value="bottom"' + (c.position === "bottom" ? " selected" : "") + ">Bottom</option></select>");
  }

  function buildPasswordConfig(step) {
    var c = step.config;
    els.configBody.innerHTML =
      field("Open password", '<input class="cfg-input" type="password" autocomplete="new-password" id="cfgPwUser" value="' + escAttr(c.userPassword || "") + '" placeholder="Required">') +
      field("Owner password", '<input class="cfg-input" type="password" autocomplete="new-password" id="cfgPwOwner" value="' + escAttr(c.ownerPassword || "") + '" placeholder="Optional">') +
      field("Encryption", '<select class="cfg-select" id="cfgPwKey"><option value="256"' + ((c.keyLength || 256) === 256 ? " selected" : "") + '>AES-256</option><option value="128"' + (c.keyLength === 128 ? " selected" : "") + ">AES-128</option></select>");
  }

  function buildPageNumbersConfig(step) {
    var c = step.config;
    els.configBody.innerHTML =
      field("Format", '<select class="cfg-select" id="cfgPnFormat"><option value="numeric"' + (c.format === "numeric" ? " selected" : "") + '>1, 2, 3</option><option value="ofn"' + (c.format === "ofn" ? " selected" : "") + '>1 of N</option><option value="roman"' + (c.format === "roman" ? " selected" : "") + ">i, ii, iii</option></select>") +
      field("Position", '<select class="cfg-select" id="cfgPnPosition"><option value="bottom-center"' + (c.position === "bottom-center" ? " selected" : "") + '>Bottom center</option><option value="bottom-right"' + (c.position === "bottom-right" ? " selected" : "") + '>Bottom right</option><option value="bottom-left"' + (c.position === "bottom-left" ? " selected" : "") + '>Bottom left</option><option value="top-center"' + (c.position === "top-center" ? " selected" : "") + ">Top center</option></select>") +
      field("Font size", '<input class="cfg-input" type="number" min="8" max="28" id="cfgPnFontSize" value="' + escAttr(c.fontSize || 11) + '">') +
      field("Start number", '<input class="cfg-input" type="number" min="1" id="cfgPnStart" value="' + escAttr(c.startNum || 1) + '">');
  }

  function buildKeepPagesConfig(step) {
    els.configBody.innerHTML = field("Page ranges", '<input class="cfg-input" id="cfgKeepRanges" value="' + escAttr(step.config.ranges || "1-") + '" placeholder="1-3,5,8-">') +
      '<div class="preset-desc">Use commas and ranges. Open-ended ranges like 3- keep through the final page.</div>';
  }

  function buildFlattenConfig(step) {
    var c = step.config;
    els.configBody.innerHTML = field("Render quality", '<select class="cfg-select" id="cfgFlattenScale"><option value="1"' + (c.scale === "1" ? " selected" : "") + '>Small file</option><option value="1.25"' + (c.scale === "1.25" ? " selected" : "") + '>Balanced</option><option value="1.6"' + (c.scale === "1.6" ? " selected" : "") + ">High</option></select>");
  }

  function buildRotateConfig(step) {
    var c = step.config;
    els.configBody.innerHTML = field("Angle", '<select class="cfg-select" id="cfgRotateAngle"><option value="90"' + (c.angle === 90 ? " selected" : "") + '>90 degrees clockwise</option><option value="180"' + (c.angle === 180 ? " selected" : "") + '>180 degrees</option><option value="270"' + (c.angle === 270 ? " selected" : "") + ">90 degrees counter-clockwise</option></select>");
  }

  function buildMergeConfig(step) {
    var c = step.config;
    els.configBody.innerHTML =
      field("Additional PDFs", '<div class="file-input-wrapper"><input type="file" id="cfgMergeInput" accept=".pdf,application/pdf" multiple><label class="file-input-label" for="cfgMergeInput" id="cfgMergeLabel" style="padding:16px;">Drop PDFs here or browse</label></div><div class="merge-files" id="cfgMergeList"></div>');
    var input = byId("cfgMergeInput");
    var list = byId("cfgMergeList");
    renderMergeList(c, list);
    input.addEventListener("change", function () {
      addMergeFiles(Array.prototype.slice.call(input.files || []), c, list);
    });
  }

  function addMergeFiles(files, config, listEl) {
    Promise.all(files.filter(isPdf).map(function (file) {
      return file.arrayBuffer().then(function (buffer) {
        config.additionalFiles.push(new Uint8Array(buffer));
        config.fileNames.push(file.name);
      });
    })).then(function () {
      renderMergeList(config, listEl);
      renderPipeline();
    });
  }

  function renderMergeList(config, listEl) {
    if (!listEl) return;
    listEl.textContent = "";
    if (!config.fileNames.length) {
      listEl.innerHTML = '<div style="font-size:0.78rem;color:#9ca3af;margin-top:8px;">No additional files added yet.</div>';
      return;
    }
    config.fileNames.forEach(function (name, index) {
      var row = document.createElement("div");
      row.className = "merge-file-item";
      row.innerHTML = '<span class="mf-name">' + escapeHtml(name) + '</span><span class="mf-size">' + formatSize(config.additionalFiles[index].length) + '</span><button class="mf-remove" type="button" data-idx="' + index + '">&times;</button>';
      row.querySelector("button").addEventListener("click", function () {
        config.additionalFiles.splice(index, 1);
        config.fileNames.splice(index, 1);
        renderMergeList(config, listEl);
        renderPipeline();
      });
      listEl.appendChild(row);
    });
  }

  function saveConfigValues(step) {
    var c = step.config;
    if (step.type === "repair") c.mode = byId("cfgRepairMode").value;
    if (step.type === "optimize") c.mode = byId("cfgOptimizeMode").value;
    if (step.type === "compress") c.preset = byId("cfgCompressPreset").value;
    if (step.type === "watermark") {
      c.text = byId("cfgWmText").value || "DRAFT";
      c.color = byId("cfgWmColor").value || "#64748b";
      c.opacity = parseInt(byId("cfgWmOpacity").value, 10) || 30;
      c.fontSize = parseInt(byId("cfgWmFontSize").value, 10) || 54;
      c.position = byId("cfgWmPosition").value;
    }
    if (step.type === "password") {
      c.userPassword = byId("cfgPwUser").value;
      c.ownerPassword = byId("cfgPwOwner").value;
      c.keyLength = parseInt(byId("cfgPwKey").value, 10) || 256;
    }
    if (step.type === "pageNumbers") {
      c.format = byId("cfgPnFormat").value;
      c.position = byId("cfgPnPosition").value;
      c.fontSize = parseInt(byId("cfgPnFontSize").value, 10) || 11;
      c.startNum = parseInt(byId("cfgPnStart").value, 10) || 1;
    }
    if (step.type === "keepPages") c.ranges = byId("cfgKeepRanges").value || "1-";
    if (step.type === "flatten") c.scale = byId("cfgFlattenScale").value || "1.25";
    if (step.type === "rotate") c.angle = parseInt(byId("cfgRotateAngle").value, 10) || 90;
  }

  function parseRanges(raw, total) {
    var pages = new Set();
    String(raw || "").split(",").forEach(function (part) {
      var chunk = part.trim();
      if (!chunk) return;
      var match = chunk.match(/^(\d+)(?:\s*-\s*(\d*)?)?$/);
      if (!match) throw new Error("Invalid page range: " + chunk);
      var start = parseInt(match[1], 10);
      var end = match[2] === "" ? total : match[2] ? parseInt(match[2], 10) : start;
      if (start > end) { var tmp = start; start = end; end = tmp; }
      if (start < 1 || end > total) throw new Error("Page range outside document: " + chunk);
      for (var page = start; page <= end; page += 1) pages.add(page - 1);
    });
    if (!pages.size) throw new Error("No pages selected.");
    return Array.from(pages).sort(function (a, b) { return a - b; });
  }

  function hexToRgb(hex) {
    var value = /^#[0-9a-f]{6}$/i.test(hex || "") ? hex : "#000000";
    return {
      r: parseInt(value.slice(1, 3), 16) / 255,
      g: parseInt(value.slice(3, 5), 16) / 255,
      b: parseInt(value.slice(5, 7), 16) / 255
    };
  }

  async function qpdfApi(logs) {
    if (!window.QPDF) throw new Error("qpdf engine did not load.");
    window.QPDF.path = "/assets/vendor/qpdf/";
    return new Promise(function (resolve, reject) {
      var timeout = setTimeout(function () { reject(new Error("qpdf engine timed out.")); }, 20000);
      window.QPDF({
        keepAlive: true,
        logger: function (line) { if (line && logs) logs.push(line); },
        ready: function (api) { clearTimeout(timeout); resolve(api); }
      });
    });
  }

  function qpdfSave(api, name, bytes) {
    return new Promise(function (resolve, reject) {
      api.save(name, cloneBytes(bytes), function (err) { err ? reject(err) : resolve(); });
    });
  }

  function qpdfExecute(api, args) {
    return new Promise(function (resolve, reject) {
      api.execute(args, function (err) { err ? reject(err) : resolve(); });
    });
  }

  function qpdfLoad(api, name) {
    return new Promise(function (resolve, reject) {
      api.load(name, function (err, data) { err ? reject(err) : resolve(cloneBytes(data)); });
    });
  }

  async function qpdfTransform(bytes, args, logs) {
    var api = await qpdfApi(logs);
    try {
      await qpdfSave(api, "input.pdf", bytes);
      await qpdfExecute(api, args.concat(["input.pdf", "output.pdf"]));
      return await qpdfLoad(api, "output.pdf");
    } finally {
      if (api && api.terminate) api.terminate();
    }
  }

  async function qpdfEncrypt(bytes, config, logs) {
    var user = config.userPassword || "";
    if (!user) throw new Error("Password step needs an open password.");
    var owner = config.ownerPassword || user + "-owner";
    var keyLength = String(config.keyLength || 256);
    var api = await qpdfApi(logs);
    try {
      await qpdfSave(api, "input.pdf", bytes);
      await qpdfExecute(api, ["--encrypt", user, owner, keyLength, "--", "input.pdf", "output.pdf"]);
      return await qpdfLoad(api, "output.pdf");
    } finally {
      if (api && api.terminate) api.terminate();
    }
  }

  async function canvasToBytes(canvas, type, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) return reject(new Error("Could not render page."));
        blob.arrayBuffer().then(function (buffer) { resolve(new Uint8Array(buffer)); }).catch(reject);
      }, type, quality);
    });
  }

  async function rasterize(bytes, scale, imageType, quality) {
    var pdfjs = await window.PdfUtils.ensurePdfJs();
    var srcDoc = await pdfjs.getDocument({ data: cloneBytes(bytes) }).promise;
    var out = await window.PDFLib.PDFDocument.create();
    for (var i = 1; i <= srcDoc.numPages; i += 1) {
      var page = await srcDoc.getPage(i);
      var viewport = page.getViewport({ scale: scale });
      var canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport }).promise;
      var imageBytes = await canvasToBytes(canvas, imageType, quality);
      var image = imageType === "image/png" ? await out.embedPng(imageBytes) : await out.embedJpg(imageBytes);
      var original = page.getViewport({ scale: 1 });
      var outPage = out.addPage([original.width, original.height]);
      outPage.drawImage(image, { x: 0, y: 0, width: original.width, height: original.height });
    }
    out.setProducer("AfroTools PDF Workflow");
    return cloneBytes(await out.save({ useObjectStreams: false }));
  }

  var operations = {
    repair: async function (bytes, config, context) {
      var mode = config.mode === "linearize" ? ["--warning-exit-0", "--linearize"] : ["--warning-exit-0", "--object-streams=disable"];
      return qpdfTransform(bytes, mode, context.logs);
    },
    optimize: async function (bytes, config, context) {
      var mode = config.mode === "linearize" ? ["--warning-exit-0", "--linearize"] : ["--warning-exit-0", "--object-streams=disable"];
      return qpdfTransform(bytes, mode, context.logs);
    },
    compress: async function (bytes, config) {
      var preset = config.preset || "web";
      var quality = preset === "screen" ? 0.42 : preset === "web" ? 0.58 : preset === "ebook" ? 0.72 : 0.86;
      var scale = preset === "screen" ? 1 : preset === "web" ? 1.2 : preset === "ebook" ? 1.45 : 1.8;
      return rasterize(bytes, scale, "image/jpeg", quality);
    },
    watermark: async function (bytes, config) {
      var doc = await window.PDFLib.PDFDocument.load(cloneBytes(bytes), { ignoreEncryption: false });
      var font = await doc.embedFont(window.PDFLib.StandardFonts.Helvetica);
      var rgb = hexToRgb(config.color);
      var text = config.text || "DRAFT";
      var size = parseInt(config.fontSize, 10) || 54;
      var opacity = (parseInt(config.opacity, 10) || 30) / 100;
      doc.getPages().forEach(function (page) {
        var pageSize = page.getSize();
        var width = font.widthOfTextAtSize(text, size);
        var x = (pageSize.width - width) / 2;
        var y = pageSize.height / 2;
        var rotate = 0;
        if (config.position === "diagonal") { x = pageSize.width * 0.14; y = pageSize.height * 0.34; rotate = -45; }
        if (config.position === "top") y = pageSize.height - 58;
        if (config.position === "bottom") y = 36;
        page.drawText(text, { x: x, y: y, size: size, font: font, color: window.PDFLib.rgb(rgb.r, rgb.g, rgb.b), opacity: opacity, rotate: window.PDFLib.degrees(rotate) });
      });
      return cloneBytes(await doc.save({ useObjectStreams: false }));
    },
    password: async function (bytes, config, context) {
      context.password = config.userPassword || "";
      return qpdfEncrypt(bytes, config, context.logs);
    },
    pageNumbers: async function (bytes, config) {
      var doc = await window.PDFLib.PDFDocument.load(cloneBytes(bytes), { ignoreEncryption: false });
      var font = await doc.embedFont(window.PDFLib.StandardFonts.Helvetica);
      var pages = doc.getPages();
      pages.forEach(function (page, index) {
        var n = (config.startNum || 1) + index;
        var label = config.format === "ofn" ? n + " of " + ((config.startNum || 1) + pages.length - 1) : config.format === "roman" ? toRoman(n) : String(n);
        var size = parseInt(config.fontSize, 10) || 11;
        var pageSize = page.getSize();
        var textWidth = font.widthOfTextAtSize(label, size);
        var pos = config.position || "bottom-center";
        var y = pos.indexOf("top") === 0 ? pageSize.height - 30 : 20;
        var x = pos.indexOf("left") > -1 ? 30 : pos.indexOf("right") > -1 ? pageSize.width - 30 - textWidth : (pageSize.width - textWidth) / 2;
        page.drawText(label, { x: x, y: y, size: size, font: font, color: window.PDFLib.rgb(0, 0, 0) });
      });
      return cloneBytes(await doc.save({ useObjectStreams: false }));
    },
    keepPages: async function (bytes, config) {
      var src = await window.PDFLib.PDFDocument.load(cloneBytes(bytes), { ignoreEncryption: false });
      var out = await window.PDFLib.PDFDocument.create();
      var indices = parseRanges(config.ranges || "1-", src.getPageCount());
      var copied = await out.copyPages(src, indices);
      copied.forEach(function (page) { out.addPage(page); });
      return cloneBytes(await out.save({ useObjectStreams: false }));
    },
    flatten: async function (bytes, config) {
      return rasterize(bytes, parseFloat(config.scale) || 1.25, "image/png", 1);
    },
    rotate: async function (bytes, config) {
      var doc = await window.PDFLib.PDFDocument.load(cloneBytes(bytes), { ignoreEncryption: false });
      doc.getPages().forEach(function (page) {
        var current = page.getRotation().angle || 0;
        page.setRotation(window.PDFLib.degrees(current + (parseInt(config.angle, 10) || 90)));
      });
      return cloneBytes(await doc.save({ useObjectStreams: false }));
    },
    merge: async function (bytes, config) {
      var doc = await window.PDFLib.PDFDocument.load(cloneBytes(bytes), { ignoreEncryption: false });
      for (var i = 0; i < (config.additionalFiles || []).length; i += 1) {
        var src = await window.PDFLib.PDFDocument.load(cloneBytes(config.additionalFiles[i]), { ignoreEncryption: false });
        var copied = await doc.copyPages(src, src.getPageIndices());
        copied.forEach(function (page) { doc.addPage(page); });
      }
      return cloneBytes(await doc.save({ useObjectStreams: false }));
    }
  };

  function toRoman(num) {
    var vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    var syms = ["m", "cm", "d", "cd", "c", "xc", "l", "xl", "x", "ix", "v", "iv", "i"];
    var out = "";
    vals.forEach(function (value, index) {
      while (num >= value) { out += syms[index]; num -= value; }
    });
    return out;
  }

  async function runPipeline() {
    if (!state.inputBytes || !state.pipeline.length) return;
    var validation = validateWorkflow(false);
    if (!validation.ok) {
      showResult(false, "Workflow needs attention", validation.messages.join(" "));
      return;
    }

    els.runBtn.disabled = true;
    if (els.resultCard) els.resultCard.classList.remove("on");
    state.resultBytes = null;
    state.resultPassword = "";
    state.report = {
      inputName: state.inputFile ? state.inputFile.name : "document.pdf",
      originalSize: state.inputBytes.length,
      createdAt: new Date().toISOString(),
      steps: [],
      finalPages: 0,
      passwordApplied: false
    };
    var context = { password: "", logs: [] };
    var bytes = cloneBytes(state.inputBytes);

    try {
      for (var i = 0; i < state.pipeline.length; i += 1) {
        var step = state.pipeline[i];
        var before = bytes.length;
        setProgress(Math.round((i / state.pipeline.length) * 100), "Step " + (i + 1) + "/" + state.pipeline.length + ": " + OP_DEFS[step.type].name + "...");
        var started = performance.now();
        bytes = cloneBytes(await operations[step.type](bytes, step.config, context));
        state.report.steps.push({
          type: step.type,
          name: OP_DEFS[step.type].name,
          status: "ok",
          beforeBytes: before,
          afterBytes: bytes.length,
          durationMs: Math.round(performance.now() - started),
          note: step.type === "password" ? "AES-" + (step.config.keyLength || 256) : subLabel(step)
        });
      }
      setProgress(100, "Validating output...");
      state.resultBytes = bytes;
      state.resultPassword = context.password || "";
      state.report.passwordApplied = !!context.password;
      try {
        state.report.finalPages = await pageCount(bytes, context.password);
      } catch (err) {
        state.report.finalPages = 0;
        state.report.validationWarning = err.message;
      }
      showResult(true, "Pipeline complete", "Output: " + formatSize(bytes.length) + " (Original: " + formatSize(state.inputBytes.length) + ")");
    } catch (err) {
      state.report.steps.push({ type: "error", name: "Error", status: "failed", beforeBytes: bytes.length, afterBytes: bytes.length, note: err.message });
      showResult(false, "Pipeline failed", err.message);
    } finally {
      hideProgressLater();
      els.runBtn.disabled = false;
      updateRunButton();
    }
  }

  function validateWorkflow(showMessage) {
    var messages = [];
    if (!state.inputBytes) messages.push("Upload a PDF first.");
    if (!state.pipeline.length) messages.push("Add at least one step.");
    state.pipeline.forEach(function (step, index) {
      if (step.type === "password" && !(step.config.userPassword || "").trim()) messages.push("Step " + (index + 1) + " needs an open password.");
      if (step.type === "merge" && !(step.config.additionalFiles || []).length) messages.push("Step " + (index + 1) + " has no merge files.");
      if (step.type === "keepPages" && !(step.config.ranges || "").trim()) messages.push("Step " + (index + 1) + " needs page ranges.");
      if (step.type === "password" && index !== state.pipeline.length - 1) messages.push("Password should be the final step because later steps cannot edit encrypted output.");
    });
    var ok = messages.length === 0;
    if (showMessage) showResult(ok, ok ? "Workflow looks ready" : "Workflow needs attention", ok ? state.pipeline.length + " steps are valid." : messages.join(" "));
    return { ok: ok, messages: messages };
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  function gated(fn) {
    var gate = document.querySelector("email-gate-modal");
    if (gate && typeof gate.show === "function") gate.show(fn);
    else fn();
  }

  function downloadPdf() {
    if (!state.resultBytes) return;
    var base = state.inputFile ? safeName(state.inputFile.name.replace(/\.pdf$/i, "")) : "document";
    downloadBlob(new Blob([state.resultBytes], { type: "application/pdf" }), base + "-workflow.pdf");
  }

  function downloadReport() {
    if (!state.report) return;
    downloadBlob(new Blob([JSON.stringify(state.report, null, 2)], { type: "application/json" }), "pdf-workflow-report.json");
  }

  function exportRecipe() {
    downloadBlob(new Blob([JSON.stringify(recipeObject(), null, 2)], { type: "application/json" }), "pdf-workflow-recipe.json");
  }

  async function handleFile(file) {
    if (!isPdf(file)) return;
    state.inputFile = file;
    state.inputBytes = new Uint8Array(await file.arrayBuffer());
    state.resultBytes = null;
    state.report = null;
    if (els.fileInfo) els.fileInfo.style.display = "block";
    if (els.fileName) els.fileName.textContent = file.name;
    if (els.fileMeta) els.fileMeta.textContent = formatSize(file.size);
    if (els.resultCard) els.resultCard.classList.remove("on");
    updateRunButton();
  }

  function clearFile() {
    state.inputFile = null;
    state.inputBytes = null;
    state.resultBytes = null;
    state.report = null;
    if (els.pdfFileInput) els.pdfFileInput.value = "";
    if (els.fileInfo) els.fileInfo.style.display = "none";
    if (els.resultCard) els.resultCard.classList.remove("on");
    updateRunButton();
  }

  function bindEvents() {
    if (els.pdfFileInput) els.pdfFileInput.addEventListener("change", function () { handleFile(els.pdfFileInput.files && els.pdfFileInput.files[0]); });
    if (els.uploadLabel) {
      els.uploadLabel.addEventListener("dragover", function (event) { event.preventDefault(); els.uploadLabel.classList.add("dragover"); });
      els.uploadLabel.addEventListener("dragleave", function () { els.uploadLabel.classList.remove("dragover"); });
      els.uploadLabel.addEventListener("drop", function (event) {
        event.preventDefault();
        els.uploadLabel.classList.remove("dragover");
        handleFile(event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]);
      });
    }
    if (els.clearFile) els.clearFile.addEventListener("click", clearFile);
    if (els.addStepBtn) els.addStepBtn.addEventListener("click", openPalette);
    if (els.paletteClose) els.paletteClose.addEventListener("click", closePalette);
    if (els.paletteOverlay) els.paletteOverlay.addEventListener("click", function (event) { if (event.target === els.paletteOverlay) closePalette(); });
    if (els.paletteGrid) {
      els.paletteGrid.querySelectorAll(".pal-op").forEach(function (op) {
        op.addEventListener("click", function () { addStep(op.dataset.op); });
      });
    }
    if (els.configClose) els.configClose.addEventListener("click", closeConfig);
    if (els.configCancel) els.configCancel.addEventListener("click", closeConfig);
    if (els.configOverlay) els.configOverlay.addEventListener("click", function (event) { if (event.target === els.configOverlay) closeConfig(); });
    if (els.configSave) {
      els.configSave.addEventListener("click", function () {
        var step = state.pipeline.find(function (item) { return item.id === configStepId; });
        if (step) saveConfigValues(step);
        renderPipeline();
        updateRunButton();
        closeConfig();
      });
    }
    if (els.runBtn) els.runBtn.addEventListener("click", runPipeline);
    if (els.validateBtn) els.validateBtn.addEventListener("click", function () { validateWorkflow(true); });
    if (els.clearPipelineBtn) els.clearPipelineBtn.addEventListener("click", function () { state.pipeline = []; renderPipeline(); updateRunButton(); });
    if (els.quickPresetBtn) els.quickPresetBtn.addEventListener("click", addReviewPreset);
    if (els.savePresetBtn) els.savePresetBtn.addEventListener("click", function () { localStorage.setItem(PRESET_KEY, JSON.stringify(recipeObject())); showResult(true, "Recipe saved", "Saved in this browser."); });
    if (els.loadPresetBtn) els.loadPresetBtn.addEventListener("click", function () { var saved = localStorage.getItem(PRESET_KEY); if (!saved) return showResult(false, "No saved recipe", "Save a recipe first."); loadRecipe(JSON.parse(saved)); showResult(true, "Recipe loaded", state.pipeline.length + " steps loaded."); });
    if (els.exportPresetBtn) els.exportPresetBtn.addEventListener("click", exportRecipe);
    if (els.importPresetBtn) els.importPresetBtn.addEventListener("click", function () { if (els.importPresetInput) els.importPresetInput.click(); });
    if (els.importPresetInput) {
      els.importPresetInput.addEventListener("change", function () {
        var file = els.importPresetInput.files && els.importPresetInput.files[0];
        if (!file) return;
        file.text().then(function (text) { loadRecipe(JSON.parse(text)); showResult(true, "Recipe imported", state.pipeline.length + " steps loaded."); }).catch(function (err) { showResult(false, "Import failed", err.message); });
      });
    }
    if (els.downloadBtn) els.downloadBtn.addEventListener("click", function () { gated(downloadPdf); });
    if (els.downloadReportBtn) els.downloadReportBtn.addEventListener("click", downloadReport);
    document.querySelectorAll(".faq-q").forEach(function (q) { q.addEventListener("click", function () { q.parentElement.classList.toggle("open"); }); });
  }

  function init() {
    cacheElements();
    bindEvents();
    renderPipeline();
    updateRunButton();
    if (!window.PDFLib || !window.PdfUtils || !window.QPDF) {
      showResult(false, "PDF workflow libraries did not load", "Refresh the page and try again.");
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
