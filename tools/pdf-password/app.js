!function () {
  "use strict";

  var state = {
    mode: "protect",
    files: [],
    results: [],
    download: null,
    busy: false
  };
  var els = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(el, value) {
    if (el) el.textContent = value || "";
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

  function processButtons() {
    return [els.processBtn, els.unlockProcessBtn].filter(Boolean);
  }

  function setProcessLabels(working) {
    var label = state.mode === "protect"
      ? (working ? "Protecting..." : "Protect PDF")
      : (working ? "Unlocking..." : "Unlock PDF");
    processButtons().forEach(function (button) {
      button.textContent = label;
    });
  }

  function updateProcessButton() {
    processButtons().forEach(function (button) {
      button.disabled = state.busy || state.files.length === 0;
    });
  }

  function setBusy(value) {
    state.busy = value;
    updateProcessButton();
    setProcessLabels(value);
    [els.modeProtect, els.modeUnlock, els.clearFilesBtn, els.generatePassword].forEach(function (button) {
      if (button) button.disabled = value;
    });
    document.querySelectorAll(".mini-btn,.toggle-password").forEach(function (button) {
      button.disabled = value;
    });
  }

  function showProgress(percent, message) {
    els.progressBar.classList.add("on");
    els.progressFill.style.width = Math.max(0, Math.min(100, percent || 0)) + "%";
    if (message) setText(els.resultText, message);
  }

  function resetResults(note) {
    state.results = [];
    state.download = null;
    els.resultCard.classList.remove("on");
    els.resultRows.innerHTML = "";
    els.resultNote.classList.toggle("on", !!note);
    setText(els.resultNote, note || "");
    els.actionRow.classList.remove("on");
    els.progressBar.classList.remove("on");
    els.progressFill.style.width = "0%";
    setText(els.resultText, "");
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
          resetResults("");
          renderFiles();
        });

        row.appendChild(info);
        row.appendChild(remove);
        els.fileList.appendChild(row);
      });
    }

    updateProcessButton();
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

    resetResults(skipped ? "Skipped " + skipped + " non-PDF file" + (skipped === 1 ? "." : "s.") : "");
    renderFiles();
  }

  function setMode(mode) {
    if (state.busy) return;
    state.mode = mode;
    els.modeProtect.classList.toggle("on", mode === "protect");
    els.modeUnlock.classList.toggle("on", mode === "unlock");
    els.modeProtect.setAttribute("aria-pressed", String(mode === "protect"));
    els.modeUnlock.setAttribute("aria-pressed", String(mode === "unlock"));
    els.protectPanel.classList.toggle("hidden", mode !== "protect");
    els.unlockPanel.classList.toggle("hidden", mode !== "unlock");
    els.fileModeLabel.textContent = mode === "protect" ? "Upload PDFs to protect" : "Upload protected PDFs to unlock";
    els.dropTitle.textContent = mode === "protect" ? "Choose PDFs to password-protect" : "Choose password-protected PDFs";
    els.dropHint.textContent = mode === "protect"
      ? "Single PDF downloads as a PDF. Multiple PDFs download as a ZIP."
      : "Enter the known password and export unencrypted copies.";
    setProcessLabels(false);
    resetResults("");
    updateProcessButton();
  }

  function passwordStrength(password) {
    var value = String(password || "");
    var score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 14) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^a-zA-Z0-9]/.test(value)) score++;
    if (/(.)\1{2,}/.test(value)) score = Math.max(0, score - 1);
    if (/password|123456|qwerty|letmein/i.test(value)) score = 0;
    score = Math.max(0, Math.min(5, score));
    return {
      score: score,
      label: ["Empty", "Very weak", "Weak", "Good", "Strong", "Excellent"][score] || "Empty"
    };
  }

  function syncStrength() {
    var result = passwordStrength(els.openPassword.value);
    els.strength.classList.toggle("on", !!els.openPassword.value);
    els.strengthMeter.dataset.score = String(result.score);
    setText(els.strengthLabel, result.label);
    setText(
      els.strengthHint,
      result.score < 3 && els.openPassword.value.length
        ? "Use a longer password with mixed letters, numbers, and symbols."
        : "Long unique passphrases are safest."
    );
  }

  function randomPassword() {
    var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*-_=+?";
    var bytes = new Uint8Array(22);
    crypto.getRandomValues(bytes);
    var out = "";
    for (var i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
    return out;
  }

  function togglePassword(button) {
    var target = byId(button.getAttribute("data-target"));
    if (!target) return;
    target.type = target.type === "password" ? "text" : "password";
    button.textContent = target.type === "password" ? "Show" : "Hide";
  }

  function validate() {
    if (!state.files.length) throw new Error("Choose at least one PDF file.");

    if (state.mode === "unlock") {
      if (!els.unlockPassword.value) throw new Error("Enter the known PDF password.");
      return;
    }

    var pass = els.openPassword.value || "";
    if (!pass) throw new Error("Enter the password people will use to open the PDF.");
    if (pass.length < 8) throw new Error("Use a password with at least 8 characters.");
    if (pass !== els.confirmPassword.value) throw new Error("Password confirmation does not match.");
    if (els.ownerPassword.value && els.ownerPassword.value === pass) {
      throw new Error("Use a different owner password, or leave it blank so AfroTools can generate one.");
    }
  }

  function getProtectOptions() {
    return {
      userPassword: els.openPassword.value,
      ownerPassword: els.ownerPassword.value,
      allowPrint: els.allowPrint.checked,
      allowCopy: els.allowCopy.checked,
      allowEdit: els.allowEdit.checked,
      allowAnnotate: els.allowAnnotate.checked,
      allowForm: els.allowForm.checked,
      allowAssemble: els.allowAssemble.checked
    };
  }

  function permissionSummary(perms) {
    var denied = [];
    if (!perms.allowPrint) denied.push("printing");
    if (!perms.allowCopy) denied.push("copying");
    if (!perms.allowEdit) denied.push("editing");
    if (!perms.allowAnnotate) denied.push("annotations");
    if (!perms.allowForm) denied.push("form filling");
    if (!perms.allowAssemble) denied.push("page assembly");
    return denied.length ? "Restricted " + denied.join(", ") : "All permissions allowed";
  }

  function renderResult() {
    els.resultRows.innerHTML = "";
    var ok = state.results.filter(function (item) { return item.ok; });
    var failed = state.results.filter(function (item) { return !item.ok; });

    state.results.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "result-row" + (item.ok ? "" : " error");
      var name = document.createElement("div");
      name.className = "result-name";
      name.textContent = item.ok ? item.name : item.sourceName;
      var meta = document.createElement("div");
      meta.className = "result-meta";
      meta.textContent = item.ok ? item.meta : item.error;
      row.appendChild(name);
      row.appendChild(meta);
      els.resultRows.appendChild(row);
    });

    if (ok.length) {
      var original = ok.reduce(function (sum, item) { return sum + item.originalSize; }, 0);
      var output = ok.reduce(function (sum, item) { return sum + item.outputSize; }, 0);
      var note = state.mode === "protect"
        ? "New files use PDF AES-256 encryption. Permission restrictions are honored by compliant PDF viewers, but they are not DRM."
        : "Unlocked files are unencrypted copies created only after the supplied password was accepted.";

      if (failed.length) note += " " + failed.length + " file" + (failed.length === 1 ? "" : "s") + " could not be processed.";
      note += " Total: " + formatBytes(original) + " -> " + formatBytes(output) + ".";

      setText(els.resultText, (state.mode === "protect" ? "Protected " : "Unlocked ") + ok.length + " PDF" + (ok.length === 1 ? "" : "s") + ".");
      els.resultNote.classList.add("on");
      setText(els.resultNote, note);
      els.actionRow.classList.add("on");
      els.downloadBtn.textContent = state.download && /\.zip$/i.test(state.download.filename) ? "Download ZIP" : "Download PDF";
    } else {
      setText(els.resultText, "No files were processed.");
      els.resultNote.classList.toggle("on", !!failed.length);
      setText(els.resultNote, failed.length ? "Check the password and try again. Unlock cannot bypass an unknown open password." : "");
      els.actionRow.classList.remove("on");
    }

    els.resultCard.classList.add("on");
  }

  async function processFiles() {
    if (state.busy) return;

    try {
      validate();
    } catch (err) {
      els.resultCard.classList.add("on");
      els.resultRows.innerHTML = "";
      els.actionRow.classList.remove("on");
      els.progressBar.classList.remove("on");
      setText(els.resultText, err.message || "Check your settings.");
      els.resultNote.classList.remove("on");
      return;
    }

    setBusy(true);
    state.results = [];
    state.download = null;
    els.resultCard.classList.add("on");
    els.resultRows.innerHTML = "";
    els.actionRow.classList.remove("on");
    els.resultNote.classList.remove("on");
    showProgress(4, "Loading PDF security engine...");

    try {
      if (!window.AfroQPDF || !window.AfroQPDF.ensure) throw new Error("PDF security engine failed to load.");
      await window.AfroQPDF.ensure();
      var protectOptions = state.mode === "protect" ? getProtectOptions() : null;

      for (var i = 0; i < state.files.length; i++) {
        var file = state.files[i].file;
        showProgress(
          8 + i / state.files.length * 82,
          (state.mode === "protect" ? "Protecting " : "Unlocking ") + (i + 1) + "/" + state.files.length + ": " + file.name
        );

        try {
          var input = await file.arrayBuffer();
          var output;
          var name;
          var meta;

          if (state.mode === "protect") {
            var secured = await window.AfroQPDF.encrypt(input, protectOptions);
            output = secured.bytes;
            name = cleanBaseName(file.name, "document") + "_protected.pdf";
            meta = permissionSummary(secured.permissions) + " - " + formatBytes(file.size) + " -> " + formatBytes(output.length);
          } else {
            output = await window.AfroQPDF.decrypt(input, els.unlockPassword.value);
            name = cleanBaseName(file.name, "document") + "_unlocked.pdf";
            meta = "Password accepted - " + formatBytes(file.size) + " -> " + formatBytes(output.length);
          }

          state.results.push({
            ok: true,
            sourceName: file.name,
            name: name,
            bytes: output,
            originalSize: file.size,
            outputSize: output.length,
            meta: meta
          });
        } catch (fileErr) {
          state.results.push({
            ok: false,
            sourceName: file.name,
            error: fileErr && fileErr.message ? fileErr.message : "Could not process this PDF."
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
          filename: state.mode === "protect" ? "protected_pdfs.zip" : "unlocked_pdfs.zip"
        };
      }

      showProgress(100, state.mode === "protect" ? "Protection complete." : "Unlock complete.");
      renderResult();
    } catch (err) {
      els.resultCard.classList.add("on");
      setText(els.resultText, "Error: " + (err.message || "PDF password task failed."));
      els.actionRow.classList.remove("on");
      els.resultNote.classList.add("on");
      setText(els.resultNote, "Refresh the page and try again. If the PDF uses unusual security, it may not be supported by the browser engine.");
    } finally {
      setBusy(false);
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

  function init() {
    els.modeProtect = byId("modeProtect");
    els.modeUnlock = byId("modeUnlock");
    els.fileModeLabel = byId("fileModeLabel");
    els.dropZone = byId("dropZone");
    els.dropTitle = byId("dropTitle");
    els.dropHint = byId("dropHint");
    els.pdfFileInput = byId("pdfFileInput");
    els.fileSummary = byId("fileSummary");
    els.fileSummaryText = byId("fileSummaryText");
    els.fileList = byId("fileList");
    els.clearFilesBtn = byId("clearFilesBtn");
    els.protectPanel = byId("protectPanel");
    els.unlockPanel = byId("unlockPanel");
    els.openPassword = byId("openPassword");
    els.confirmPassword = byId("confirmPassword");
    els.ownerPassword = byId("ownerPassword");
    els.unlockPassword = byId("unlockPassword");
    els.generatePassword = byId("generatePassword");
    els.strength = byId("passwordStrength");
    els.strengthMeter = byId("strengthMeter");
    els.strengthLabel = byId("strengthLabel");
    els.strengthHint = byId("strengthHint");
    els.allowPrint = byId("allowPrint");
    els.allowCopy = byId("allowCopy");
    els.allowEdit = byId("allowEdit");
    els.allowAnnotate = byId("allowAnnotate");
    els.allowForm = byId("allowForm");
    els.allowAssemble = byId("allowAssemble");
    els.processBtn = byId("processBtn");
    els.unlockProcessBtn = byId("unlockProcessBtn");
    els.resultCard = byId("resultCard");
    els.resultText = byId("resultText");
    els.resultRows = byId("resultRows");
    els.resultNote = byId("resultNote");
    els.progressBar = byId("progressBar");
    els.progressFill = byId("progressFill");
    els.actionRow = byId("actionRow");
    els.downloadBtn = byId("downloadBtn");

    wireDropZone();
    els.pdfFileInput.addEventListener("change", function (event) {
      addFiles(event.target.files);
      event.target.value = "";
    });
    els.modeProtect.addEventListener("click", function () { setMode("protect"); });
    els.modeUnlock.addEventListener("click", function () { setMode("unlock"); });
    els.clearFilesBtn.addEventListener("click", function () {
      if (state.busy) return;
      state.files = [];
      resetResults("");
      renderFiles();
    });
    els.generatePassword.addEventListener("click", function () {
      var password = randomPassword();
      els.openPassword.value = password;
      els.confirmPassword.value = password;
      syncStrength();
      resetResults("Generated a strong password. Keep a copy because AfroTools cannot recover it later.");
    });

    [els.openPassword, els.confirmPassword, els.ownerPassword, els.unlockPassword].forEach(function (input) {
      input.addEventListener("input", function () {
        if (input === els.openPassword) syncStrength();
        resetResults("");
      });
    });
    document.querySelectorAll(".toggle-password").forEach(function (button) {
      button.addEventListener("click", function () { togglePassword(button); });
    });
    [els.allowPrint, els.allowCopy, els.allowEdit, els.allowAnnotate, els.allowForm, els.allowAssemble].forEach(function (input) {
      input.addEventListener("change", function () { resetResults(""); });
    });
    processButtons().forEach(function (button) {
      button.addEventListener("click", processFiles);
    });
    els.downloadBtn.addEventListener("click", download);

    syncStrength();
    renderFiles();
    setMode("protect");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}();
