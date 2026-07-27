/*
 * Afro 1.0 — the learning loop.
 *
 * THE CONSTRAINT THAT SHAPES THIS
 *
 * The drift-intake pipeline states its privacy contract explicitly:
 * syntheticPromptsOnly, rawPromptRequired: false, rawPromptIncluded: false.
 * Raw user prompts are deliberately never captured. That is a good decision on
 * a site where people type salaries, client names and immigration plans, and it
 * is not one to quietly loosen because a flywheel would be easier with text.
 *
 * So this learns from ACTIONS, NOT TEXT.
 *
 * THE INSIGHT
 *
 * Calibration created the labelling opportunity. When the router is unsure it
 * now says so and offers alternatives — and the moment a user picks one, they
 * have labelled that routing decision for us, through an ordinary product
 * interaction rather than surveillance. What gets recorded is structural:
 *
 *   "candidates [a, b, c] were shown; the user chose b" — tool ids, no prose.
 *
 * Repeated across users that is a precise, text-free statement that the ranking
 * is wrong for a bucket, and it points a human straight at the lexicon entry
 * worth writing. The uncertainty feature and the learning loop are the same
 * mechanism, which is why calibration had to come first.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * It does not store the query, a hash of the query, or any substring of it.
 * A hash is still the prompt — it is reversible by dictionary attack over a
 * catalogue this small, and it would break the contract in spirit while
 * appearing to honour it.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AfroLearn = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STORAGE_KEY = "afro_learn_signals_v1";
  var MAX_SIGNALS = 300;

  function safeStorage() {
    try {
      if (typeof localStorage === "undefined") return null;
      return localStorage;
    } catch (err) {
      return null;
    }
  }

  function readSignals() {
    var store = safeStorage();
    if (!store) return [];
    try {
      var parsed = JSON.parse(store.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function writeSignals(signals) {
    var store = safeStorage();
    if (!store) return false;
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(signals.slice(-MAX_SIGNALS)));
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Record that a user corrected the router.
   *
   * @param {object} event
   * @param {string[]} event.shown     tool ids offered, in the order shown
   * @param {string}   event.chosen    tool id the user actually picked
   * @param {number}   event.confidence what the router claimed at the time
   * @param {string}   event.reason    why it was unsure (tied_candidates etc.)
   *
   * Returns the stored signal, or null when nothing worth learning happened.
   */
  function recordCorrection(event) {
    var shown = (event && event.shown) || [];
    var chosen = event && event.chosen;
    if (!chosen || !shown.length) return null;

    var rank = shown.indexOf(chosen);
    // The user picked what we already had first: the ranking was right, and
    // there is nothing to learn beyond a confirmation.
    var confirmed = rank === 0;

    var signal = {
      v: 1,
      rankChosen: rank,
      shown: shown.slice(0, 5),
      chosen: chosen,
      confirmed: confirmed,
      confidence: typeof event.confidence === "number" ? Number(event.confidence.toFixed(2)) : null,
      reason: event.reason || null
    };

    var signals = readSignals();
    signals.push(signal);
    writeSignals(signals);
    return signal;
  }

  /**
   * Aggregate local signals into a text-free report.
   *
   * This is the payload that would be sent onward. It contains tool ids and
   * counts and nothing a person wrote, so it satisfies the drift pipeline's
   * rawPromptIncluded: false contract by construction rather than by filtering.
   */
  function buildReport(signals) {
    var list = signals || readSignals();
    var pairs = {};
    var totals = { corrections: 0, confirmations: 0 };

    list.forEach(function (signal) {
      if (signal.confirmed) {
        totals.confirmations++;
        return;
      }
      totals.corrections++;
      // The pair that matters: what we offered first vs what was actually wanted.
      var from = signal.shown[0];
      var key = from + "->" + signal.chosen;
      pairs[key] = pairs[key] || {
        proposedTool: from,
        correctTool: signal.chosen,
        count: 0,
        avgRankChosen: 0,
        reasons: {}
      };
      var entry = pairs[key];
      entry.avgRankChosen = ((entry.avgRankChosen * entry.count) + signal.rankChosen) / (entry.count + 1);
      entry.count++;
      if (signal.reason) entry.reasons[signal.reason] = (entry.reasons[signal.reason] || 0) + 1;
    });

    var ranked = Object.keys(pairs).map(function (key) {
      var entry = pairs[key];
      entry.avgRankChosen = Number(entry.avgRankChosen.toFixed(2));
      return entry;
    }).sort(function (left, right) { return right.count - left.count; });

    return {
      schemaVersion: 1,
      containsRawPrompts: false,
      totals: totals,
      // Highest-count mis-rankings first: this is the queue of lexicon entries
      // worth a human writing, ordered by how many users each one would help.
      lexiconCandidates: ranked
    };
  }

  function clear() {
    var store = safeStorage();
    if (!store) return;
    try { store.removeItem(STORAGE_KEY); } catch (err) { /* nothing to do */ }
  }

  return {
    VERSION: "afro-1.0",
    STORAGE_KEY: STORAGE_KEY,
    recordCorrection: recordCorrection,
    buildReport: buildReport,
    readSignals: readSignals,
    clear: clear
  };
});
