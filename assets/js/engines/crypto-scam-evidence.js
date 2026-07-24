(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.cryptoScamEvidence = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var LIMITS = Object.freeze({
    incidentLabel: 80,
    platform: 80,
    contactReference: 120,
    evidenceLines: 20,
    timelineLines: 30,
    line: 240,
    lossEntries: 20,
    lossLabel: 80,
    lossAmount: 1000000000000000
  });

  function clean(value, maximum) {
    return String(value || "").trim().slice(0, maximum);
  }

  function lines(value, maximumLines) {
    return String(value || "").split(/\r?\n/).map(function (line) {
      return clean(line, LIMITS.line);
    }).filter(Boolean).slice(0, maximumLines);
  }

  function date(value) {
    var text = clean(value, 10);
    if (!text) return "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error("Incident date must use YYYY-MM-DD.");
    var parsed = new Date(text + "T00:00:00Z");
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) {
      throw new Error("Incident date is not valid.");
    }
    if (text > new Date().toISOString().slice(0, 10)) throw new Error("Incident date cannot be in the future.");
    return text;
  }

  function currency(value) {
    var code = clean(value, 3).toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) throw new Error("Display currency must be a three-letter code.");
    return code;
  }

  function normalizeLosses(entries) {
    if (!Array.isArray(entries)) return [];
    return entries.slice(0, LIMITS.lossEntries).map(function (entry) {
      var label = clean(entry && entry.label, LIMITS.lossLabel);
      var raw = entry && entry.amount;
      if (!label && (raw === "" || raw === null || raw === undefined)) return null;
      var amount = Number(raw);
      if (!Number.isFinite(amount) || amount < 0 || amount > LIMITS.lossAmount) {
        throw new Error("Every loss amount must be a bounded non-negative number.");
      }
      return Object.freeze({ label: label || "Loss entry", amount: amount });
    }).filter(Boolean);
  }

  function summarize(input) {
    input = input || {};
    var redFlags = Array.isArray(input.redFlags)
      ? Array.from(new Set(input.redFlags.map(function (item) { return clean(item, 60); }).filter(Boolean))).slice(0, 20)
      : [];
    var evidence = lines(input.evidenceNotes, LIMITS.evidenceLines);
    var timeline = lines(input.timelineNotes, LIMITS.timelineLines);
    var losses = normalizeLosses(input.losses);
    var totalLoss = losses.reduce(function (sum, entry) {
      var next = sum + entry.amount;
      if (!Number.isFinite(next) || next > Number.MAX_SAFE_INTEGER) throw new Error("Loss total exceeds the safe arithmetic range.");
      return next;
    }, 0);
    var record = Object.freeze({
      incidentLabel: clean(input.incidentLabel, LIMITS.incidentLabel),
      incidentDate: date(input.incidentDate),
      platform: clean(input.platform, LIMITS.platform),
      contactReference: clean(input.contactReference, LIMITS.contactReference),
      currency: currency(input.currency),
      redFlags: Object.freeze(redFlags),
      evidenceItems: Object.freeze(evidence),
      timelineItems: Object.freeze(timeline),
      losses: Object.freeze(losses),
      totalLoss: totalLoss
    });
    var sections = [
      Boolean(record.incidentLabel),
      Boolean(record.incidentDate),
      Boolean(record.platform || record.contactReference),
      record.redFlags.length > 0,
      record.evidenceItems.length > 0,
      record.timelineItems.length > 0
    ];
    var completedSections = sections.filter(Boolean).length;
    return Object.freeze({
      record: record,
      completedSections: completedSections,
      totalSections: sections.length,
      redFlagCount: record.redFlags.length,
      evidenceCount: record.evidenceItems.length,
      timelineCount: record.timelineItems.length,
      lossCount: record.losses.length,
      status: completedSections >= 5 ? "organized" : completedSections >= 3 ? "developing" : "started",
      boundary: "This organizer does not determine whether a person, wallet, platform or transaction is safe, fraudulent or verified."
    });
  }

  return Object.freeze({ LIMITS: LIMITS, summarize: summarize });
});
