(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.inventoryPlanner = api;
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  var LIMITS = Object.freeze({ maxFileBytes: 1048576, maxRecords: 500, maxName: 120, maxSku: 80, maxCategory: 80, maxUnit: 12 });

  function cleanText(value, max) {
    return String(value == null ? "" : value).normalize("NFC").trim().replace(/\s+/g, " ").slice(0, max);
  }
  function number(value, field, optional) {
    if (optional && (value == null || String(value).trim() === "")) return { ok: true, value: null };
    if (typeof value === "string" && !/^(?:\d+\.?\d*|\.\d+)$/.test(value.trim())) return { ok: false, error: field + " must be a finite non-negative number." };
    var parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? { ok: true, value: parsed } : { ok: false, error: field + " must be a finite non-negative number." };
  }
  function hash(text) {
    var value = 2166136261, i;
    for (i = 0; i < text.length; i += 1) { value ^= text.charCodeAt(i); value = Math.imul(value, 16777619); }
    return (value >>> 0).toString(36);
  }
  function fingerprint(item) {
    return [item.name.toLowerCase(), item.sku.toLowerCase(), item.category.toLowerCase(), item.unitCost, item.sellPrice, item.quantity, item.reorderPoint, item.targetStock == null ? "" : item.targetStock].join("\u001f");
  }
  function stableId(source, index, item) { return "inv-" + cleanText(source, 24).toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + hash(index + "|" + fingerprint(item)); }
  function normalizeItem(raw, options) {
    raw = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    options = options || {};
    var name = cleanText(raw.name, LIMITS.maxName);
    var sku = cleanText(raw.sku, LIMITS.maxSku);
    var category = cleanText(raw.category, LIMITS.maxCategory);
    var unitCost = number(raw.unitCost != null ? raw.unitCost : raw.cost, "Unit cost");
    var sellPrice = number(raw.sellPrice != null ? raw.sellPrice : raw.sell, "Selling price");
    var quantity = number(raw.quantity != null ? raw.quantity : (raw.stock != null ? raw.stock : raw.qty), "Quantity");
    var reorderPoint = number(raw.reorderPoint != null ? raw.reorderPoint : (raw.minStock != null ? raw.minStock : raw.low), "Reorder point");
    var targetStock = number(raw.targetStock, "Target stock", true);
    var errors = [];
    if (!name) errors.push("Product name is required.");
    [unitCost, sellPrice, quantity, reorderPoint, targetStock].forEach(function (entry) { if (!entry.ok) errors.push(entry.error); });
    if (errors.length) return { ok: false, errors: errors };
    var item = {
      id: cleanText(raw.id, 100).replace(/[^a-zA-Z0-9_-]/g, ""),
      name: name, sku: sku, category: category, unitCost: unitCost.value, sellPrice: sellPrice.value,
      quantity: quantity.value, reorderPoint: reorderPoint.value, targetStock: targetStock.value
    };
    if (!item.id) item.id = stableId(options.source || "item", options.index || 0, item);
    return { ok: true, item: item, errors: [] };
  }
  function calculateItem(item) {
    var costValue = item.unitCost * item.quantity;
    var potentialSales = item.sellPrice * item.quantity;
    return {
      costValue: costValue,
      potentialSales: potentialSales,
      potentialGrossProfit: potentialSales - costValue,
      lowStock: item.quantity <= item.reorderPoint,
      suggestedReorder: item.targetStock == null ? null : Math.max(item.targetStock - item.quantity, 0)
    };
  }
  function summarize(items) {
    return (items || []).reduce(function (result, item) {
      var row = calculateItem(item);
      result.totalProducts += 1;
      result.lowStock += row.lowStock ? 1 : 0;
      result.stockCostValue += row.costValue;
      result.potentialSales += row.potentialSales;
      result.potentialGrossProfit += row.potentialGrossProfit;
      if (row.suggestedReorder != null) result.suggestedReorderUnits += row.suggestedReorder;
      return result;
    }, { totalProducts: 0, lowStock: 0, stockCostValue: 0, potentialSales: 0, potentialGrossProfit: 0, suggestedReorderUnits: 0 });
  }
  function normalizeList(rows, source) {
    if (!Array.isArray(rows)) return { ok: false, errors: ["Items must be an array."], items: [] };
    if (rows.length > LIMITS.maxRecords) return { ok: false, errors: ["Inventory exceeds the " + LIMITS.maxRecords + " record limit."], items: [] };
    var items = [], errors = [];
    rows.forEach(function (row, index) {
      if (!row || typeof row !== "object" || Array.isArray(row)) { errors.push("Record " + (index + 1) + ": item must be an object."); return; }
      if (String(row.name == null ? "" : row.name).length > LIMITS.maxName || String(row.sku == null ? "" : row.sku).length > LIMITS.maxSku || String(row.category == null ? "" : row.category).length > LIMITS.maxCategory) {
        errors.push("Record " + (index + 1) + ": text exceeds the allowed field length."); return;
      }
      var parsed = normalizeItem(row, { source: source, index: index });
      if (parsed.ok) items.push(parsed.item); else errors.push("Record " + (index + 1) + ": " + parsed.errors.join(" "));
    });
    return { ok: !errors.length, errors: errors, items: errors.length ? [] : items };
  }
  function dedupeExact(items) {
    var seen = Object.create(null), ids = Object.create(null), output = [], duplicates = 0;
    (items || []).forEach(function (item, index) {
      var key = fingerprint(item);
      if (seen[key]) { duplicates += 1; return; }
      seen[key] = true;
      if (ids[item.id]) item = Object.assign({}, item, { id: stableId("collision", index, item) });
      ids[item.id] = true; output.push(item);
    });
    return { items: output, duplicates: duplicates };
  }
  function migrateLegacy(enRows, swRows) {
    var en = normalizeList(Array.isArray(enRows) ? enRows : [], "legacy-en");
    var sw = normalizeList(Array.isArray(swRows) ? swRows : [], "legacy-sw");
    var errors = en.errors.concat(sw.errors);
    if (errors.length) return { ok: false, errors: errors, items: [], duplicates: 0 };
    var result = dedupeExact(en.items.concat(sw.items));
    return { ok: true, errors: [], items: result.items, duplicates: result.duplicates, loaded: en.items.length + sw.items.length };
  }
  function parseBackupObject(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload) || payload.schemaVersion !== 2 || payload.tool !== "inventory" || !Array.isArray(payload.items)) {
      return { ok: false, errors: ["Use a version 2 AfroTools inventory JSON backup."], items: [] };
    }
    var unit = cleanText(payload.displayUnit || "", LIMITS.maxUnit);
    var parsed = normalizeList(payload.items, "import");
    if (!parsed.ok) return parsed;
    var deduped = dedupeExact(parsed.items);
    return { ok: true, errors: [], items: deduped.items, duplicates: deduped.duplicates, displayUnit: unit || "USD" };
  }
  function parseBackupText(text, byteLength) {
    if ((byteLength || String(text).length) > LIMITS.maxFileBytes) return { ok: false, errors: ["Backup exceeds the 1 MB file limit."], items: [] };
    try { return parseBackupObject(JSON.parse(String(text))); } catch (error) { return { ok: false, errors: ["Backup is not valid JSON."], items: [] }; }
  }
  function mergeItems(existing, incoming) {
    var result = dedupeExact((existing || []).concat(incoming || []));
    return { items: result.items, duplicates: result.duplicates };
  }
  function backup(items, displayUnit) { return { schemaVersion: 2, tool: "inventory", exportedAt: new Date().toISOString(), displayUnit: cleanText(displayUnit, LIMITS.maxUnit) || "USD", items: items.slice() }; }
  function csvCell(value) {
    var text = String(value == null ? "" : value);
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function toCsv(items, displayUnit) {
    var headers = ["Product", "SKU", "Category", "Display unit", "Unit cost", "Selling price", "Quantity on hand", "Reorder point", "Target stock", "Stock cost value", "Potential sales", "Potential gross profit", "Low stock", "Suggested reorder units"];
    var lines = [headers.map(csvCell).join(",")];
    items.forEach(function (item) {
      var result = calculateItem(item);
      lines.push([item.name, item.sku, item.category, displayUnit, item.unitCost, item.sellPrice, item.quantity, item.reorderPoint, item.targetStock == null ? "" : item.targetStock, result.costValue, result.potentialSales, result.potentialGrossProfit, result.lowStock ? "yes" : "no", result.suggestedReorder == null ? "" : result.suggestedReorder].map(csvCell).join(","));
    });
    return "\uFEFF" + lines.join("\r\n");
  }
  return { LIMITS: LIMITS, normalizeItem: normalizeItem, calculateItem: calculateItem, summarize: summarize, migrateLegacy: migrateLegacy, parseBackupObject: parseBackupObject, parseBackupText: parseBackupText, mergeItems: mergeItems, backup: backup, toCsv: toCsv, fingerprint: fingerprint };
});
