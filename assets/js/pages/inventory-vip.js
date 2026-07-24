(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.inventoryPlanner;
  var config = window.INVENTORY_VIP_CONFIG || {}, t = config.t || {};
  if (!engine) return;
  var STORAGE_KEY = "afrotools_inventory_v2", state = { items: [], displayUnit: config.defaultUnit || "USD", editingId: null, opener: null };
  function id(value) { return document.getElementById(value); }
  function status(message, tone) { var node = id("invStatus"); node.textContent = message || ""; node.dataset.tone = tone || "neutral"; }
  function safeJson(key) { try { var value = JSON.parse(localStorage.getItem(key) || "null"); return Array.isArray(value) ? value : []; } catch (error) { return []; } }
  function load() {
    try {
      var current = localStorage.getItem(STORAGE_KEY);
      if (current) {
        var parsed = engine.parseBackupText(current);
        if (parsed.ok) { state.items = parsed.items; state.displayUnit = parsed.displayUnit; return; }
        status(t.corrupt || "Saved inventory could not be read. No data was changed.", "error");
      }
    } catch (error) { status(t.storageBlocked || "Browser storage is unavailable. Changes remain in this tab.", "warn"); }
    var migrated = engine.migrateLegacy(safeJson("afro_inventory"), safeJson("sw-sme-inventory-v1"));
    if (migrated.ok && migrated.items.length) {
      state.items = migrated.items;
      status((t.migrated || "Loaded {count} legacy records; {duplicates} exact duplicates were skipped. Your legacy keys were preserved.").replace("{count}", migrated.items.length).replace("{duplicates}", migrated.duplicates), "ready");
    }
  }
  function persist(message) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(engine.backup(state.items, state.displayUnit))); status(message || t.saved, "ready"); }
    catch (error) { status(t.storageBlocked, "warn"); }
  }
  function fmt(value) { return state.displayUnit + " " + Number(value || 0).toLocaleString(config.locale || "en", { maximumFractionDigits: 2 }); }
  function button(label, action, item) {
    var control = document.createElement("button");
    control.type = "button"; control.className = "inv-icon-button"; control.textContent = label;
    control.dataset.action = action; control.dataset.id = item.id;
    control.setAttribute("aria-label", label + " " + item.name);
    return control;
  }
  function cell(row, value, className) { var node = document.createElement("td"); node.textContent = value; if (className) node.className = className; row.appendChild(node); }
  function render() {
    var summary = engine.summarize(state.items), metrics = [
      [t.products, summary.totalProducts], [t.lowStock, summary.lowStock], [t.stockValue, fmt(summary.stockCostValue)],
      [t.potentialSales, fmt(summary.potentialSales)], [t.potentialProfit, fmt(summary.potentialGrossProfit)], [t.reorderUnits, summary.suggestedReorderUnits.toLocaleString(config.locale || "en")]
    ];
    var grid = id("invMetrics"); grid.textContent = "";
    metrics.forEach(function (metric) { var card = document.createElement("div"), label = document.createElement("span"), value = document.createElement("strong"); card.className = "inv-metric"; label.textContent = metric[0]; value.textContent = metric[1]; if (metric[0] === t.potentialProfit && summary.potentialGrossProfit < 0) value.className = "negative"; card.append(label, value); grid.appendChild(card); });
    var query = id("invSearch").value.trim().toLowerCase(), body = id("invBody"); body.textContent = "";
    state.items.filter(function (item) { return !query || [item.name, item.sku, item.category].join(" ").toLowerCase().includes(query); }).forEach(function (item) {
      var result = engine.calculateItem(item), row = document.createElement("tr");
      cell(row, item.name); cell(row, item.sku || "—"); cell(row, item.category || "—"); cell(row, fmt(item.unitCost)); cell(row, fmt(item.sellPrice));
      cell(row, String(item.quantity), result.lowStock ? "low" : "ok"); cell(row, String(item.reorderPoint)); cell(row, item.targetStock == null ? "—" : String(item.targetStock));
      cell(row, fmt(result.costValue)); cell(row, result.suggestedReorder == null ? "—" : String(result.suggestedReorder));
      var actions = document.createElement("td"), wrap = document.createElement("div"); wrap.className = "inv-row-actions";
      wrap.append(button(t.edit, "edit", item), button(t.addOne, "plus", item), button(t.removeOne, "minus", item), button(t.delete, "delete", item)); actions.appendChild(wrap); row.appendChild(actions); body.appendChild(row);
    });
    if (!body.children.length) { var empty = document.createElement("tr"), c = document.createElement("td"); c.colSpan = 11; c.className = "inv-empty"; c.textContent = t.empty; empty.appendChild(c); body.appendChild(empty); }
    id("invUnit").value = state.displayUnit;
  }
  function setForm(item) {
    var fields = { invName: "name", invSku: "sku", invCategory: "category", invCost: "unitCost", invSell: "sellPrice", invQty: "quantity", invReorder: "reorderPoint", invTarget: "targetStock" };
    Object.keys(fields).forEach(function (key) { var value = item && item[fields[key]]; id(key).value = value == null ? "" : value; });
  }
  function openModal(item) {
    state.editingId = item ? item.id : null; state.opener = document.activeElement; setForm(item);
    id("invModalTitle").textContent = item ? t.editProduct : t.addProduct; id("invModalError").textContent = "";
    id("invModal").classList.add("open"); id("invModal").setAttribute("aria-hidden", "false"); document.body.classList.add("modal-open"); id("invName").focus();
  }
  function closeModal() { id("invModal").classList.remove("open"); id("invModal").setAttribute("aria-hidden", "true"); document.body.classList.remove("modal-open"); state.editingId = null; if (state.opener && state.opener.focus) state.opener.focus(); }
  function readForm() {
    return { id: state.editingId || "", name: id("invName").value, sku: id("invSku").value, category: id("invCategory").value, unitCost: id("invCost").value, sellPrice: id("invSell").value, quantity: id("invQty").value, reorderPoint: id("invReorder").value, targetStock: id("invTarget").value };
  }
  function saveForm(event) {
    event.preventDefault(); var parsed = engine.normalizeItem(readForm(), { source: "user", index: Date.now() });
    if (!parsed.ok) { id("invModalError").textContent = parsed.errors.join(" "); return; }
    if (state.editingId) state.items = state.items.map(function (item) { return item.id === state.editingId ? parsed.item : item; });
    else state.items.push(parsed.item);
    persist(t.saved); render(); closeModal();
  }
  function download(name, type, content) { var blob = new Blob([content], { type: type }), url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000); }
  function exportPdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) { status(t.pdfMissing, "error"); return; }
    var summary = engine.summarize(state.items), doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" }), y = 52;
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text(t.pdfTitle, 44, y); y += 25;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    [t.formulaCost, t.formulaSales, t.formulaProfit, t.formulaReorder, t.pdfLimits].forEach(function (line) { doc.text(doc.splitTextToSize(line, 500), 44, y); y += 24; });
    [[t.products, summary.totalProducts], [t.lowStock, summary.lowStock], [t.stockValue, fmt(summary.stockCostValue)], [t.potentialSales, fmt(summary.potentialSales)], [t.potentialProfit, fmt(summary.potentialGrossProfit)]].forEach(function (row) { doc.text(row[0] + ": " + row[1], 44, y); y += 18; });
    y += 8; doc.setFont("helvetica", "bold"); doc.text(t.lowList, 44, y); y += 18; doc.setFont("helvetica", "normal");
    state.items.filter(function (item) { return engine.calculateItem(item).lowStock; }).slice(0, 25).forEach(function (item) { var result = engine.calculateItem(item); doc.text(doc.splitTextToSize(item.name + " | " + item.quantity + " on hand | reorder point " + item.reorderPoint + (result.suggestedReorder == null ? "" : " | suggested reorder " + result.suggestedReorder), 500), 44, y); y += 18; if (y > 760) { doc.addPage(); y = 52; } });
    doc.save("afrotools-inventory-summary.pdf"); status(t.exported, "ready");
  }
  function importFile(file) {
    if (!file) return;
    if (file.size > engine.LIMITS.maxFileBytes) { status(t.fileTooLarge, "error"); return; }
    var reader = new FileReader();
    reader.onload = function () {
      var parsed = engine.parseBackupText(reader.result, file.size);
      if (!parsed.ok) { status(parsed.errors.join(" "), "error"); return; }
      var mode = id("invImportMode").value;
      if (!window.confirm(mode === "merge" ? t.confirmMerge : t.confirmReplace)) { status(t.cancelled); return; }
      if (mode === "merge") { var merged = engine.mergeItems(state.items, parsed.items); state.items = merged.items; status((t.importedMerge || "").replace("{duplicates}", merged.duplicates), "ready"); }
      else { state.items = parsed.items; status(t.importedReplace, "ready"); }
      state.displayUnit = parsed.displayUnit || state.displayUnit; persist(id("invStatus").textContent); render();
    };
    reader.readAsText(file);
  }
  function bind() {
    id("invAdd").addEventListener("click", function () { openModal(null); });
    id("invClose").addEventListener("click", closeModal); id("invCancel").addEventListener("click", closeModal); id("invForm").addEventListener("submit", saveForm);
    id("invModal").addEventListener("click", function (event) { if (event.target === this) closeModal(); });
    id("invModal").addEventListener("keydown", function (event) {
      if (event.key === "Escape") { event.preventDefault(); closeModal(); return; }
      if (event.key === "Tab") { var focusable = Array.from(this.querySelectorAll("button,input,select")).filter(function (node) { return !node.disabled; }), first = focusable[0], last = focusable[focusable.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
    });
    id("invBody").addEventListener("click", function (event) {
      var control = event.target.closest("[data-action]"); if (!control) return;
      var item = state.items.find(function (entry) { return entry.id === control.dataset.id; }); if (!item) return;
      if (control.dataset.action === "edit") openModal(item);
      if (control.dataset.action === "plus" || control.dataset.action === "minus") { item.quantity = Math.max(0, item.quantity + (control.dataset.action === "plus" ? 1 : -1)); persist(t.adjusted); render(); }
      if (control.dataset.action === "delete" && window.confirm(t.confirmDelete.replace("{name}", item.name))) { state.items = state.items.filter(function (entry) { return entry.id !== item.id; }); persist(t.deleted); render(); }
    });
    id("invSearch").addEventListener("input", render);
    id("invUnit").addEventListener("change", function () { state.displayUnit = this.value; persist(t.unitSaved); render(); });
    id("invCsv").addEventListener("click", function () { download("afrotools-inventory.csv", "text/csv;charset=utf-8", engine.toCsv(state.items, state.displayUnit)); status(t.exported, "ready"); });
    id("invJson").addEventListener("click", function () { download("afrotools-inventory-backup.json", "application/json;charset=utf-8", JSON.stringify(engine.backup(state.items, state.displayUnit), null, 2)); status(t.exported, "ready"); });
    id("invPdf").addEventListener("click", exportPdf);
    id("invImportButton").addEventListener("click", function () { id("invImport").click(); }); id("invImport").addEventListener("change", function () { importFile(this.files && this.files[0]); this.value = ""; });
    id("invSample").addEventListener("click", function () { if (!window.confirm(t.confirmSample)) return; var parsed = engine.normalizeItem(config.sample, { source: "sample", index: 0 }); if (parsed.ok) { state.items = [parsed.item]; persist(t.sampleLoaded); render(); } });
    id("invClear").addEventListener("click", function () { if (!window.confirm(t.confirmClear)) return; state.items = []; persist(t.cleared); render(); });
    id("invCopy").addEventListener("click", function () { var s = engine.summarize(state.items), text = [t.pdfTitle, t.products + ": " + s.totalProducts, t.lowStock + ": " + s.lowStock, t.stockValue + ": " + fmt(s.stockCostValue), t.potentialSales + ": " + fmt(s.potentialSales), t.potentialProfit + ": " + fmt(s.potentialGrossProfit), t.pdfLimits].join("\n"); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { status(t.copied, "ready"); }).catch(function () { status(text); }); else status(text); });
  }
  load(); bind(); render();
  window.AfroToolsInventoryApp = { getItems: function () { return state.items.slice(); }, getSummary: function () { return engine.summarize(state.items); } };
})();
