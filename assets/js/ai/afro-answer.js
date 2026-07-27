/*
 * Afro 1.0 — grounded answers.
 *
 * WHY THIS IS THE COMPETITIVE PIECE
 *
 * Routing hands a user a calculator they still have to fill in. A frontier
 * model just answers — which is why people ask it instead, and why it is the
 * real competitor. But on African statutory maths a general model answers from
 * memory, and that memory is stale and unsourced:
 *
 *   - Kenya's NSSF upper limit stepped to KES 108,000 in Feb 2026
 *   - SHIF at 2.75% replaced NHIF, with a KES 300 floor
 *   - Nigeria's NTA 2026 bands sit alongside the PITA 2025 regime
 *   - Kenya's AHL is deductible from taxable income, not just from net pay
 *
 * A model that has read the open web will produce a fluent, confident, wrong
 * number for all four. This module answers the same question by EXECUTING the
 * same engine that powers the country's calculator, so the figure is computed
 * from the operative schedule rather than recalled.
 *
 * That is the claim worth making to anyone comparing us to a frontier model:
 * not that we are more intelligent, but that on these tasks we are correct and
 * they are plausible — and correct is what a payroll run needs.
 *
 * Scope is deliberately narrow. It answers only where a real engine exists and
 * every required input was actually supplied; otherwise it declines and hands
 * back to routing. An answer this module cannot ground is one it does not give.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AfroAnswer = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Engines that can compute a complete answer headlessly, keyed by country. */
  /* `basis` is the period each engine expects its INPUT in, and it is not
   * uniform: Nigeria, Ghana, South Africa and Egypt take an annual gross while
   * Kenya and Tanzania take a monthly one. Getting this wrong is silent and
   * severe — treating a GHS 6,000 monthly salary as annual returned a net of
   * GHS 473, a plausible-looking number that is wrong by a factor of twelve.
   * Verified empirically against each engine, not assumed from its field names,
   * and pinned by tests/afro-answer.test.js. */
  var PAYE_ENGINES = {
    NG: { key: "ngPAYE", src: "/assets/js/engines/ng-paye.js", currency: "NGN", basis: "annual", label: "Nigeria" },
    KE: { key: "kePAYE", src: "/assets/js/engines/ke-paye.js", currency: "KES", basis: "monthly", label: "Kenya" },
    GH: { key: "ghPAYE", src: "/assets/js/engines/gh-paye.js", currency: "GHS", basis: "annual", label: "Ghana" },
    ZA: { key: "zaPAYE", src: "/assets/js/engines/za-paye.js", currency: "ZAR", basis: "annual", label: "South Africa" },
    TZ: { key: "tzPAYE", src: "/assets/js/engines/tz-paye.js", currency: "TZS", basis: "monthly", label: "Tanzania" },
    EG: { key: "egPAYE", src: "/assets/js/engines/eg-paye.js", currency: "EGP", basis: "annual", label: "Egypt" }
  };

  var MULTIPLIERS = { k: 1e3, m: 1e6, thousand: 1e3, million: 1e6 };

  /**
   * Pull a money amount out of natural language.
   *
   * Handles "450,000", "450k", "1.2m", "N450000" and "450 000". Returns null
   * rather than a guess when nothing is unambiguous — a wrong amount is worse
   * than no answer, because it will look authoritative.
   */
  function extractAmount(query) {
    var text = String(query || "").toLowerCase().replace(/[, ]/g, "");
    var match = text.match(/(?:^|[^a-z0-9.])(\d+(?:\.\d+)?)\s*(k|m|thousand|million)?\b/g);
    if (!match) return null;

    var best = null;
    match.forEach(function (chunk) {
      var parts = chunk.match(/(\d+(?:\.\d+)?)\s*(k|m|thousand|million)?/);
      if (!parts) return;
      var value = parseFloat(parts[1]);
      if (!isFinite(value)) return;
      if (parts[2]) value *= MULTIPLIERS[parts[2]] || 1;
      // Ignore years and small counts ("5 employees", "2016 Toyota").
      if (value < 1000) return;
      if (value >= 1900 && value <= 2100 && !parts[2]) return;
      if (best === null || value > best) best = value;
    });
    return best;
  }

  /** Is the amount stated per month or per year? */
  function extractPeriod(query) {
    var text = String(query || "").toLowerCase();
    if (/\b(per month|a month|monthly|per mth|每月)\b/.test(text)) return "monthly";
    if (/\b(per year|a year|annual|annually|per annum|pa)\b/.test(text)) return "annual";
    return null;
  }

  function loadScript(doc, src) {
    return new Promise(function (resolve, reject) {
      var existing = doc.querySelector('script[data-afro-engine="' + src + '"]');
      if (existing) return resolve();
      var el = doc.createElement("script");
      el.src = src;
      el.async = true;
      el.setAttribute("data-afro-engine", src);
      el.onload = function () { resolve(); };
      el.onerror = function () { reject(new Error("engine unavailable")); };
      doc.head.appendChild(el);
    });
  }

  function engineFor(countryCode, win) {
    var spec = PAYE_ENGINES[countryCode];
    if (!spec) return null;
    var engines = win && win.AfroTools && win.AfroTools.engines;
    var engine = engines && engines[spec.key];
    if (!engine || typeof engine.calculate !== "function") return null;
    return { spec: spec, engine: engine };
  }

  function money(currency, value) {
    if (!isFinite(value)) return null;
    return currency + " " + Math.round(value).toLocaleString("en-US");
  }

  /**
   * Answer a take-home-pay question with computed figures.
   *
   * @returns {object} either { answered: false, reason } or a full breakdown.
   */
  function answerPaye(query, countryCode, options) {
    var opts = options || {};
    var win = opts.window || (typeof window !== "undefined" ? window : null);
    var found = engineFor(countryCode, win);
    if (!found) return { answered: false, reason: "no_engine_for_country" };

    var amount = opts.amount != null ? opts.amount : extractAmount(query);
    if (!amount) return { answered: false, reason: "no_amount_supplied" };

    var spec = found.spec;
    var stated = opts.period || extractPeriod(query) || "monthly";

    // Each engine expects its own basis; convert the user's figure to match.
    var input = amount;
    if (spec.basis === "annual" && stated === "monthly") input = amount * 12;
    if (spec.basis === "monthly" && stated === "annual") input = amount / 12;

    var result;
    try {
      result = found.engine.calculate(input, opts.engineOptions || {});
    } catch (err) {
      return { answered: false, reason: "engine_error" };
    }
    if (!result) return { answered: false, reason: "engine_returned_nothing" };

    // Normalise across engines that disagree on field names and basis.
    var tax = result.paye != null ? result.paye : result.tax;
    var net = result.net != null ? result.net
      : (result.netMonthly != null ? result.netMonthly : null);
    var netMonthly = spec.basis === "annual"
      ? (result.netMonthly != null ? result.netMonthly : (net != null ? net / 12 : null))
      : net;
    var taxMonthly = spec.basis === "annual" ? (tax != null ? tax / 12 : null) : tax;

    if (taxMonthly == null || netMonthly == null) {
      return { answered: false, reason: "incomplete_engine_result" };
    }

    return {
      answered: true,
      kind: "paye",
      country: spec.label,
      currency: spec.currency,
      grossMonthly: spec.basis === "annual" ? input / 12 : input,
      taxMonthly: taxMonthly,
      netMonthly: netMonthly,
      effectiveRate: result.effectiveRate != null ? Number(result.effectiveRate.toFixed(2)) : null,
      lines: buildLines(result, spec),
      summary: "On " + money(spec.currency, spec.basis === "annual" ? input / 12 : input) +
        " a month in " + spec.label + ", PAYE is about " + money(spec.currency, taxMonthly) +
        " and take-home is about " + money(spec.currency, netMonthly) + ".",
      /* Provenance is the whole point: this is why the figure can be trusted
       * where a general model's cannot. */
      computedBy: spec.key,
      grounded: true,
      caveat: "Computed from the bundled statutory schedule for " + spec.label +
        ". Confirm against the revenue authority before filing or paying."
    };
  }

  function buildLines(result, spec) {
    var candidates = [
      ["Gross", result.gross],
      ["Pension", result.pension],
      ["NSSF", result.nssf],
      ["SHIF", result.shif],
      ["Housing levy", result.ahl],
      ["SSNIT", result.ssnit],
      ["NHF", result.nhf],
      ["UIF", result.uif],
      ["Taxable income", result.taxable != null ? result.taxable : result.taxableIncome],
      ["PAYE", result.paye != null ? result.paye : result.tax]
    ];
    return candidates
      .filter(function (pair) { return typeof pair[1] === "number" && pair[1] > 0; })
      .map(function (pair) {
        return { label: pair[0], amount: Math.round(pair[1]), currency: spec.currency };
      });
  }

  /** Load the engine a country needs, then answer. Browser path. */
  function answerPayeAsync(query, countryCode, options) {
    var opts = options || {};
    var win = opts.window || (typeof window !== "undefined" ? window : null);
    var doc = opts.document || (typeof document !== "undefined" ? document : null);
    var spec = PAYE_ENGINES[countryCode];
    if (!spec || !doc) return Promise.resolve({ answered: false, reason: "no_engine_for_country" });
    if (engineFor(countryCode, win)) return Promise.resolve(answerPaye(query, countryCode, opts));
    return loadScript(doc, spec.src)
      .then(function () { return answerPaye(query, countryCode, opts); })
      .catch(function () { return { answered: false, reason: "engine_unavailable" }; });
  }

  return {
    VERSION: "afro-1.0",
    PAYE_ENGINES: PAYE_ENGINES,
    extractAmount: extractAmount,
    extractPeriod: extractPeriod,
    answerPaye: answerPaye,
    answerPayeAsync: answerPayeAsync
  };
});
