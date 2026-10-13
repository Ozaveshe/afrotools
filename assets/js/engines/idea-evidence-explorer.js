(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.IdeaEvidenceExplorer = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var VERSION = "idea-evidence-explorer-2026-07-23";
  var SCHEMA_VERSION = 1;
  var MAX_AMOUNT = 1000000000000000;
  var DEFAULT_TIMEOUT_MS = 8000;
  var API_URL = "/.netlify/functions/idea-evidence";
  var SECTORS = ["transportation","agriculture","food","technology","retail","fintech","construction","health","education","energy","fashion","tourism","media","manufacturing","services","mining","beauty","logistics","waste","telecom"];
  var RISK = ["low","medium","high"];

  function text(value, max) {
    return String(value == null ? "" : value)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/<[^>]*>/g, "")
      .trim()
      .slice(0, max || 2000);
  }
  function finite(value) {
    var number = typeof value === "number" ? value : Number(value);
    return Number.isFinite(number) && number >= 0 && number <= MAX_AMOUNT ? number : null;
  }
  function date(value) {
    var clean = text(value, 40);
    if (!clean || Number.isNaN(Date.parse(clean))) return "";
    return new Date(clean).toISOString();
  }
  function url(value) {
    var clean = text(value, 800);
    if (!clean) return "";
    try {
      var parsed = new URL(clean);
      return /^https?:$/.test(parsed.protocol) ? parsed.href : "";
    } catch (_) {
      return "";
    }
  }
  function pair(a, b) {
    var first = finite(a);
    var second = finite(b);
    var firstMissing = a == null || a === "";
    var secondMissing = b == null || b === "";
    if (first == null && second == null) return { min:null, max:null };
    if (first == null && !firstMissing) return { min:null, max:second };
    if (second == null && !secondMissing) return { min:first, max:null };
    if (first == null) first = second;
    if (second == null) second = first;
    return first <= second ? { min:first, max:second } : { min:second, max:first };
  }
  function normalizeRow(row) {
    if (!row || typeof row !== "object") return null;
    var id = text(row.id, 128);
    var name = text(row.name, 160);
    var country = text(row.country_code, 20).toUpperCase();
    var sector = text(row.sector, 40).toLowerCase();
    if (!id || !name || !/^[A-Z]{2}$/.test(country) || SECTORS.indexOf(sector) < 0) return null;
    var cost = pair(row.startup_cost_min, row.startup_cost_max);
    var revenue = pair(row.monthly_revenue_min, row.monthly_revenue_max);
    var breakeven = pair(row.breakeven_months_min, row.breakeven_months_max);
    var confidence = text(row.confidence || row.source_confidence, 30).toLowerCase();
    if (!/^(low|medium|high)$/.test(confidence)) confidence = "";
    return {
      id:id,
      recordOrigin:row.record_origin === "generated_example" || row.source === "seed" ? "generated_example" : "unknown",
      name:name,
      countryCode:country,
      countryName:text(row.country_name, 100),
      sector:sector,
      risk:RISK.indexOf(text(row.risk, 20).toLowerCase()) >= 0 ? text(row.risk, 20).toLowerCase() : "unknown",
      currency:/^[A-Z]{3}$/.test(text(row.currency, 3).toUpperCase()) ? text(row.currency, 3).toUpperCase() : "",
      description:text(row.description, 2500),
      whyAfrica:text(row.why_africa, 2500),
      revenueModel:text(row.revenue_model, 1200),
      risks:Array.isArray(row.risks) ? row.risks.map(function (item) { return text(item, 500); }).filter(Boolean).slice(0, 12) : [],
      bestCities:Array.isArray(row.best_cities) ? row.best_cities.map(function (item) { return text(item, 100); }).filter(Boolean).slice(0, 20) : [],
      startupCost:cost,
      monthlyRevenue:revenue,
      breakevenMonths:breakeven,
      source:{
        name:text(row.source_name || (row.source === "seed" ? "" : row.source), 200),
        url:url(row.source_url),
        asOf:date(row.source_as_of || row.data_as_of),
        confidence:confidence
      },
      updatedAt:date(row.updated_at || row.created_at)
    };
  }
  function normalizeRows(rows) {
    if (!Array.isArray(rows)) return [];
    var seen = Object.create(null);
    return rows.map(normalizeRow).filter(function (row) {
      if (!row || seen[row.id]) return false;
      seen[row.id] = true;
      return true;
    });
  }
  function encode(value) { return encodeURIComponent(String(value)); }
  function buildUrl(params) {
    params = params || {};
    var query = ["select=*"];
    if (/^[A-Z]{2}$/.test(params.country || "")) query.push("country=" + encode(params.country));
    if (SECTORS.indexOf(params.sector) >= 0) query.push("sector=" + encode(params.sector));
    if (RISK.indexOf(params.risk) >= 0) query.push("risk=" + encode(params.risk));
    var budget = finite(params.maxBudget);
    if (budget != null && budget > 0) query.push("maxBudget=" + encode(budget));
    var search = text(params.search, 100);
    if (search) query.push("search=" + encode(search));
    query.push("sort=" + encode(["breakeven","cost","revenue","newest"].indexOf(params.sort) >= 0 ? params.sort : "breakeven"));
    query.push("page=" + encode(Math.max(1, Number(params.page) || 1)));
    return API_URL + "?" + query.join("&");
  }
  function classify(error) {
    if (error && error.name === "AbortError") return "aborted";
    if (error && error.code === "timeout") return "timeout";
    if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
    return "error";
  }
  async function search(params, options) {
    options = options || {};
    var fetcher = options.fetcher || (typeof fetch === "function" ? fetch.bind(globalThis) : null);
    if (!fetcher) return { ok:false, state:"error", rows:[], total:0 };
    var timeoutMs = Math.max(100, Math.min(Number(options.timeoutMs) || DEFAULT_TIMEOUT_MS, 30000));
    var ownController = typeof AbortController !== "undefined" ? new AbortController() : null;
    var external = options.signal;
    var timer;
    if (ownController && external) {
      if (external.aborted) ownController.abort();
      else external.addEventListener("abort", function () { ownController.abort(); }, { once:true });
    }
    var signal = ownController ? ownController.signal : external;
    var timedOut = false;
    if (ownController) timer = setTimeout(function () { timedOut = true; ownController.abort(); }, timeoutMs);
    try {
      var response = await fetcher(buildUrl(params), {
        method:"GET",
        headers:{ Accept:"application/json" },
        signal:signal
      });
      if (!response || !response.ok) return { ok:false, state:"error", status:response ? response.status : 0, rows:[], total:0 };
      var payload = await response.json();
      if (!payload || !Array.isArray(payload.rows)) return { ok:false, state:"error", rows:[], total:null };
      var rows = normalizeRows(payload.rows);
      var total = Number.isFinite(payload.reportedTotal) ? payload.reportedTotal : null;
      return { ok:true, state:rows.length ? "ready" : "empty", rows:rows, total:total, version:VERSION };
    } catch (error) {
      return { ok:false, state:timedOut ? "timeout" : classify(error), rows:[], total:0 };
    } finally {
      clearTimeout(timer);
    }
  }
  // Country reference evidence never changes the source or estimates of an idea record.
  function registrationReferences(payload, country, asOf) {
    var hosts = { KE:["brs.go.ke"], NG:["news.cac.gov.ng"] };
    var currencies = { KE:"KES", NG:"NGN" };
    function day(value) {
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
      var parsed = new Date(value + "T00:00:00Z");
      return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? parsed.getTime() : null;
    }
    var today = day(asOf || new Date().toISOString().slice(0, 10));
    if (!payload || payload.schemaVersion !== 1 || payload.scope !== "country_registration_reference_only" ||
        !Array.isArray(payload.estimateFieldsVerified) || payload.estimateFieldsVerified.length ||
        !Array.isArray(payload.claims) || payload.claims.length > 100 || today === null || !hosts[country]) return [];
    var seen = Object.create(null);
    return payload.claims.filter(function (claim) {
      if (!claim || claim.countryCode !== country || claim.claimType !== "registration_fee" || claim.entityType !== "business_name" ||
          claim.status !== "source_checked" || !/^[a-z0-9-]{3,100}$/.test(claim.id || "") || seen[claim.id] ||
          typeof claim.amount !== "number" || finite(claim.amount) === null || claim.currency !== currencies[country] ||
          !Number.isInteger(claim.reviewCadenceDays) || claim.reviewCadenceDays < 1 || claim.reviewCadenceDays > 30 ||
          !claim.sourceName || !claim.sourceLocator || !Array.isArray(claim.exclusions) || !claim.exclusions.length ||
          !claim.label || ["en","fr","sw"].some(function (lang) { return !text(claim.label[lang], 160); })) return false;
      var observed = day(claim.observedAt), reviewed = day(claim.reviewedAt);
      if (observed === null || reviewed === null || observed > reviewed || reviewed > today ||
          (claim.sourceDocumentDate !== null && (day(claim.sourceDocumentDate) === null || day(claim.sourceDocumentDate) > observed)) ||
          (claim.effectiveFrom !== null && (day(claim.effectiveFrom) === null || day(claim.effectiveFrom) > today))) return false;
      try {
        var source = new URL(claim.sourceUrl);
        if (source.protocol !== "https:" || source.username || source.password || source.port || hosts[country].indexOf(source.hostname) < 0) return false;
      } catch (_) { return false; }
      seen[claim.id] = true;
      return true;
    }).map(function (claim) {
      var fresh = today - day(claim.reviewedAt) <= claim.reviewCadenceDays * 86400000;
      return { id:claim.id, countryCode:country, label:{en:text(claim.label.en,160),fr:text(claim.label.fr,160),sw:text(claim.label.sw,160)},
        state:fresh ? "source_checked" : "expired", amount:fresh ? claim.amount : null, currency:claim.currency,
        sourceName:text(claim.sourceName,200), sourceUrl:claim.sourceUrl, sourceLocator:text(claim.sourceLocator,250),
        observedAt:claim.observedAt, reviewedAt:claim.reviewedAt, sourceDocumentDate:claim.sourceDocumentDate,
        effectiveFrom:claim.effectiveFrom };
    });
  }
  function normalizedToRaw(row) {
    if (!row || !row.countryCode) return row;
    return {
      record_origin:row.recordOrigin,
      id:row.id, name:row.name, country_code:row.countryCode, country_name:row.countryName, sector:row.sector,
      risk:row.risk, currency:row.currency, description:row.description, why_africa:row.whyAfrica, revenue_model:row.revenueModel,
      risks:row.risks, best_cities:row.bestCities, startup_cost_min:row.startupCost && row.startupCost.min,
      startup_cost_max:row.startupCost && row.startupCost.max, monthly_revenue_min:row.monthlyRevenue && row.monthlyRevenue.min,
      monthly_revenue_max:row.monthlyRevenue && row.monthlyRevenue.max, breakeven_months_min:row.breakevenMonths && row.breakevenMonths.min,
      breakeven_months_max:row.breakevenMonths && row.breakevenMonths.max, source_name:row.source && row.source.name,
      source_url:row.source && row.source.url, source_as_of:row.source && row.source.asOf,
      source_confidence:row.source && row.source.confidence, updated_at:row.updatedAt
    };
  }
  function shortlistEnvelope(rows, locale) {
    return {
      schemaVersion:SCHEMA_VERSION,
      tool:"idea-board",
      locale:["en","fr","sw"].indexOf(locale) >= 0 ? locale : "en",
      savedAt:new Date().toISOString(),
      items:normalizeRows((rows || []).map(normalizedToRaw)).slice(0, 6)
    };
  }
  function validateEnvelope(value) {
    if (!value || value.schemaVersion !== SCHEMA_VERSION || value.tool !== "idea-board" || !Array.isArray(value.items)) return null;
    var rows = normalizeRows(value.items.map(normalizedToRaw));
    return rows.length === value.items.length && rows.length <= 6 ? shortlistEnvelope(rows, value.locale) : null;
  }
  return {
    VERSION:VERSION,
    SCHEMA_VERSION:SCHEMA_VERSION,
    MAX_AMOUNT:MAX_AMOUNT,
    SECTORS:SECTORS.slice(),
    cleanText:text,
    normalizeRow:normalizeRow,
    normalizeRows:normalizeRows,
    buildUrl:buildUrl,
    search:search,
    shortlistEnvelope:shortlistEnvelope,
    registrationReferences:registrationReferences,
    validateEnvelope:validateEnvelope
  };
});
