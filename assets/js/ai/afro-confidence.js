/*
 * Afro 1.0 — routing confidence calibration.
 *
 * WHY THIS EXISTS
 *
 * The deterministic router returns a confidence that is effectively a constant:
 * a July 2026 probe of 32 realistic prompts found only three distinct values
 * (0.9, 0.74, 0.2), and 0.9 — the highest — was what the WRONG answers got.
 * "tax" routed to inheritance-tax at 0.9. "convert 5000 dolars to naria" routed
 * to image-format-convert at 0.9. Confidence was inversely correlated with
 * correctness, which is worse than no signal at all.
 *
 * The information needed to do better was already there and being discarded:
 * `rankToolCandidates` returns a scored list, and the router asked it for
 * `limit: 1`. Behind those single answers were four-way ties:
 *
 *   "tax"                          -> 70.5, 70.5, 70.5, 70.5  (coin flip)
 *   "convert 5000 dolars to naria" -> 55.5, 55.5, 55.5        (coin flip)
 *   "stamp duty ... naira ... Lagos" -> ke-stamp-duty 132.5 vs stamp-duty 118.5
 *
 * This module turns that discarded ranking into an honest signal. It does not
 * choose tools; it grades a choice that has already been made, and says when
 * the honest answer is "I am not sure — did you mean one of these?".
 *
 * It follows the same principle the rest of the codebase applies to data: a
 * missing rate is never rendered as zero, so a guess must never be rendered as
 * certainty.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AfroConfidence = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* ── Country signals ──────────────────────────────────────────────────────
   * Tools are country-scoped by an id prefix (ke-stamp-duty, za-transfer-duty,
   * ng-paye...). A query naming Nigeria must never be answered by a Kenyan
   * tool, but score alone allows exactly that because the token "kenya" inside
   * an id also matches as a topic term. These maps let us detect the conflict.
   */
  var COUNTRY_SIGNALS = {
    NG: { names: ["nigeria", "nigerian", "naija"], currency: ["naira", "ngn", "kobo", "₦"], cities: ["lagos", "abuja", "kano", "ibadan", "port harcourt", "benin city"] },
    KE: { names: ["kenya", "kenyan"], currency: ["shilling", "kes", "ksh"], cities: ["nairobi", "mombasa", "kisumu", "nakuru"] },
    GH: { names: ["ghana", "ghanaian"], currency: ["cedi", "ghs", "pesewa"], cities: ["accra", "kumasi", "tamale", "takoradi"] },
    ZA: { names: ["south africa", "south african"], currency: ["rand", "zar"], cities: ["johannesburg", "cape town", "durban", "pretoria", "joburg"] },
    TZ: { names: ["tanzania", "tanzanian"], currency: ["tzs"], cities: ["dar es salaam", "dodoma", "arusha"] },
    UG: { names: ["uganda", "ugandan"], currency: ["ugx"], cities: ["kampala", "entebbe"] },
    EG: { names: ["egypt", "egyptian"], currency: ["egp"], cities: ["cairo", "alexandria", "giza"] },
    RW: { names: ["rwanda", "rwandan"], currency: ["rwf"], cities: ["kigali"] },
    ZW: { names: ["zimbabwe", "zimbabwean"], currency: ["zwl"], cities: ["harare", "bulawayo"] },
    ZM: { names: ["zambia", "zambian"], currency: ["kwacha", "zmw"], cities: ["lusaka", "ndola"] },
    MA: { names: ["morocco", "moroccan"], currency: ["dirham", "mad"], cities: ["casablanca", "rabat", "marrakech"] },
    SN: { names: ["senegal", "senegalese"], currency: ["cfa", "xof"], cities: ["dakar"] },
    CM: { names: ["cameroon", "cameroonian"], currency: ["xaf"], cities: ["douala", "yaounde"] },
    ET: { names: ["ethiopia", "ethiopian"], currency: ["birr", "etb"], cities: ["addis ababa"] },
    BW: { names: ["botswana"], currency: ["pula", "bwp"], cities: ["gaborone"] },
    NA: { names: ["namibia", "namibian"], currency: ["nad"], cities: ["windhoek"] }
  };

  // Words that carry no topical meaning; they should not count toward coverage.
  var STOPWORDS = {
    a: 1, an: 1, and: 1, are: 1, as: 1, at: 1, be: 1, but: 1, by: 1, can: 1, do: 1, does: 1,
    for: 1, from: 1, get: 1, help: 1, how: 1, i: 1, if: 1, in: 1, is: 1, it: 1, me: 1, much: 1,
    my: 1, need: 1, of: 1, on: 1, or: 1, should: 1, that: 1, the: 1, then: 1, this: 1, to: 1,
    want: 1, was: 1, what: 1, when: 1, where: 1, which: 1, will: 1, with: 1, would: 1, you: 1,
    your: 1, calculate: 1, estimate: 1, please: 1, abeg: 1, wan: 1, go: 1, fit: 1, make: 1
  };

  function lower(value) {
    return String(value == null ? "" : value).toLowerCase();
  }

  function meaningfulTokens(query) {
    return lower(query)
      .replace(/[^a-z0-9₦$€£\s-]/g, " ")
      .split(/\s+/)
      .filter(function (token) {
        return token && token.length > 1 && !STOPWORDS[token] && !/^\d+$/.test(token);
      });
  }

  /**
   * Which country, if any, does the query name?
   * Returns null when the query is country-neutral — the common case, and one
   * where a country-scoped tool is not automatically wrong.
   */
  function detectQueryCountry(query) {
    var text = lower(query);
    var hits = [];
    Object.keys(COUNTRY_SIGNALS).forEach(function (code) {
      var signals = COUNTRY_SIGNALS[code];
      var matched = ["names", "currency", "cities"].some(function (group) {
        return (signals[group] || []).some(function (term) {
          return text.indexOf(term) !== -1;
        });
      });
      if (matched) hits.push(code);
    });
    // Two countries named (a comparison or a corridor) is not a conflict.
    return hits.length === 1 ? hits[0] : null;
  }

  /** The country a tool is scoped to, from its id prefix. Null = generic. */
  function detectToolCountry(toolId) {
    var match = /^([a-z]{2})-/.exec(lower(toolId));
    if (!match) return null;
    var code = match[1].toUpperCase();
    return COUNTRY_SIGNALS[code] ? code : null;
  }

  function candidateId(candidate) {
    if (!candidate) return "";
    if (candidate.tool && candidate.tool.id) return candidate.tool.id;
    return candidate.toolId || candidate.id || "";
  }

  function candidateScore(candidate) {
    if (!candidate) return 0;
    var score = candidate.score != null ? candidate.score : candidate.retrievalScore;
    return typeof score === "number" && isFinite(score) ? score : 0;
  }

  /* ── Signals ────────────────────────────────────────────────────────────── */

  /**
   * Separation between the winner and the runner-up, 0..1.
   *
   * This is the signal that was missing. A four-way tie on "tax" and a decisive
   * win on "calculate PAYE for Kenya" produced the same 0.9 before.
   */
  function marginSignal(candidates) {
    if (!candidates.length) return { margin: 0, tiedWith: 0 };
    var top = candidateScore(candidates[0]);
    if (top <= 0) return { margin: 0, tiedWith: 0 };
    var tiedWith = 0;
    for (var i = 1; i < candidates.length; i++) {
      if (Math.abs(candidateScore(candidates[i]) - top) < 0.001) tiedWith++;
      else break;
    }
    var second = candidates.length > 1 ? candidateScore(candidates[1]) : 0;
    return { margin: Math.max(0, (top - second) / top), tiedWith: tiedWith };
  }

  /**
   * Is the winner topically central to the query, or did one stray token carry it?
   *
   * Measured as PRECISION (what share of the tool's own identifying terms the
   * user actually said), not recall (what share of the query the tool matched).
   *
   * Recall alone is the wrong metric twice over. It punishes verbose but clear
   * queries — "calculate PAYE take home pay for an employee earning 50000 in
   * Kenya" matches ke-paye on just "paye" and "kenya", 2 of 7 tokens, yet it is
   * unambiguously right. And it fails to catch the opposite case: "build a CV
   * for an electrical engineer role in Ghana" routed to `electrical-load` on a
   * single spurious token, and scored a *wide* margin because nothing else came
   * close. Precision catches it — the query never says "load".
   *
   * Country terms are excluded from the query side: they are filters on which
   * variant of a tool to use, not evidence of what the user wants to do.
   */
  function coverageSignal(query, candidate, idf) {
    var queryText = " " + lower(query).replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ") + " ";

    /* A tool has several names for itself: its id, its title, and its authored
     * userIntents. Scoring only the id fails two ways — an abbreviation the user
     * never types ("boq-gen" for "bill of quantities"), and a curated intent that
     * matches the user exactly ("write cv") but does not appear in the id.
     * Take the best fit across all of them. */
    var identities = identityStrings(candidate);
    var best = 0;
    for (var i = 0; i < identities.length; i++) {
      var fit = precisionAgainst(queryText, identities[i], idf);
      if (fit > best) best = fit;
    }
    return best;
  }

  function identityStrings(candidate) {
    var out = [];
    var id = lower(candidateId(candidate));
    if (id) out.push(id.replace(/[-_]/g, " "));
    var tool = candidate && candidate.tool;
    if (tool) {
      if (tool.title) out.push(lower(tool.title));
      (tool.userIntents || []).forEach(function (intent) {
        if (intent) out.push(lower(intent));
      });
    }
    return out;
  }

  /* ── Term informativeness (IDF) ───────────────────────────────────────────
   *
   * Afro-Bench's residual failures were almost all one defect: the retriever
   * weights every token equally, so a common word inside a tool id wins on
   * merit it has not earned.
   *
   *   "take home pay ... in Kenya"        -> home-workout      (matched "home")
   *   "how much lobola should I budget"   -> construction-budget (matched "budget")
   *   "healthy weight for my height"      -> shipping-weight   (matched "weight")
   *   "send money from the UK to Nigeria" -> money-market      (matched "money")
   *
   * "lobola" names three tools in the catalogue; "budget" names dozens. The
   * first identifies an intent, the second identifies nothing. Weighting each
   * matched term by how rare it is across the manifest is the standard fix and
   * it is the difference between matching words and matching meaning.
   *
   * Built once per manifest and cached — this runs in the browser on every
   * keystrokeless submit, so it must not rescan 1,252 tools each time.
   */
  var idfCache = null;
  var idfCacheKey = null;

  function buildIdf(manifest) {
    var tools = Array.isArray(manifest) ? manifest : (manifest && manifest.tools) || [];
    var docFreq = {};
    tools.forEach(function (tool) {
      var seen = {};
      identityStrings({ tool: tool }).forEach(function (identity) {
        identity.split(/\s+/).forEach(function (term) {
          if (!term || term.length < 2 || STOPWORDS[term]) return;
          if (seen[term]) return;
          seen[term] = 1;
          docFreq[term] = (docFreq[term] || 0) + 1;
        });
      });
    });
    return { docFreq: docFreq, total: Math.max(1, tools.length) };
  }

  function getIdf(manifest) {
    if (!manifest) return null;
    var key = Array.isArray(manifest) ? manifest.length : (manifest.tools || []).length;
    if (idfCache && idfCacheKey === key) return idfCache;
    idfCache = buildIdf(manifest);
    idfCacheKey = key;
    return idfCache;
  }

  /** Rarity weight for a term: ~1 for common words, up to ~4 for distinctive ones. */
  function termWeight(term, idf) {
    if (!idf) return 1;
    var df = idf.docFreq[term] || 1;
    // log(total/df) normalised so a term in 1 tool weighs ~4x one in ~100 tools.
    var raw = Math.log(idf.total / df);
    return Math.max(0.25, Math.min(4, raw / 2));
  }

  function precisionAgainst(queryText, identity, idf) {
    var parts = identity.split(/\s+/);
    // Strip only a LEADING country code. Filtering every two-letter token
    // silently deleted meaningful ones — "cv-builder" became just "builder",
    // so "write cv" scored zero precision against the CV builder.
    if (parts.length > 1 && /^[a-z]{2}$/.test(parts[0]) && COUNTRY_SIGNALS[parts[0].toUpperCase()]) {
      parts = parts.slice(1);
    }
    var terms = parts.filter(function (term) {
      return term && term.length > 1 && !STOPWORDS[term];
    });
    if (!terms.length) return 0;

    // Weighted, not counted: matching a tool's distinctive term is worth far
    // more than matching a word it shares with a hundred other tools.
    var matchedWeight = 0;
    var totalWeight = 0;
    terms.forEach(function (term) {
      var weight = termWeight(term, idf);
      totalWeight += weight;
      var hit = queryText.indexOf(" " + term + " ") !== -1 ||
        (term.length > 4 && queryText.indexOf(" " + term.slice(0, term.length - 2)) !== -1);
      if (hit) matchedWeight += weight;
    });

    return totalWeight ? matchedWeight / totalWeight : 0;
  }

  /**
   * A one- or two-word query cannot be answered confidently no matter how
   * cleanly it matches. "tax" matched four tools perfectly and meant nothing.
   */
  function specificitySignal(query) {
    var tokens = meaningfulTokens(query);
    if (tokens.length <= 1) return 0.15;
    if (tokens.length === 2) return 0.5;
    if (tokens.length === 3) return 0.8;
    return 1;
  }

  /* ── Calibration ────────────────────────────────────────────────────────── */

  var BANDS = { CONFIDENT: "confident", LIKELY: "likely", UNSURE: "unsure" };

  /**
   * Grade a routing decision.
   *
   * Returns the calibrated confidence, a band the UI can act on, the
   * alternatives worth offering, and the signals behind the number so the
   * decision is auditable rather than a magic constant.
   */
  function calibrate(query, candidates, options) {
    var opts = options || {};
    var list = (candidates || []).filter(Boolean);
    if (!list.length) {
      return {
        confidence: 0,
        band: BANDS.UNSURE,
        uncertain: true,
        reason: "no_candidates",
        alternatives: [],
        signals: { margin: 0, coverage: 0, specificity: 0, tiedWith: 0, countryConflict: false }
      };
    }

    var top = list[0];
    var margin = marginSignal(list);
    var coverage = coverageSignal(query, top, getIdf(opts.manifest));
    var specificity = specificitySignal(query);

    var queryCountry = detectQueryCountry(query);
    var toolCountry = detectToolCountry(candidateId(top));
    var countryConflict = !!(queryCountry && toolCountry && queryCountry !== toolCountry);

    // Weighted blend. Margin dominates because a tie is the clearest possible
    // evidence that the winner was arbitrary.
    var confidence = (margin.margin * 0.3) + (coverage * 0.45) + (specificity * 0.25);

    // A country conflict is disqualifying, not a deduction: answering a Nigeria
    // question with a Kenyan tool is wrong regardless of how well it scored.
    if (countryConflict) confidence = Math.min(confidence, 0.25);
    // Exact ties mean the ordering carried no information at all.
    if (margin.tiedWith >= 1) confidence = Math.min(confidence, 0.35);
    if (margin.tiedWith >= 3) confidence = Math.min(confidence, 0.2);
    // A confident-looking margin means nothing if the query never mentions what
    // the tool actually does ("electrical engineer CV" -> electrical-load).
    if (coverage < 0.34) confidence = Math.min(confidence, 0.4);

    confidence = Math.max(0, Math.min(1, Number(confidence.toFixed(3))));

    /* Thresholds are empirical, not taste. A sweep over Afro-Bench put the
     * useful operating point at 0.60: it catches 73% of the router's wrong
     * answers while leaving 81% precision on the ones it still asserts. Raising
     * it to 0.70 buys 92% precision but flags half the CORRECT answers too,
     * which reads as a product that does not trust itself. */
    var band = confidence >= 0.60 ? BANDS.CONFIDENT : confidence >= 0.45 ? BANDS.LIKELY : BANDS.UNSURE;

    var reason = countryConflict ? "country_conflict"
      : margin.tiedWith >= 1 ? "tied_candidates"
        : specificity <= 0.5 ? "query_too_short"
          : coverage < 0.34 ? "low_term_coverage"
            : "clear_match";

    return {
      confidence: confidence,
      band: band,
      // Anything short of CONFIDENT should surface alternatives. "likely" still
      // shows its answer — it just stops pretending there was no second option.
      uncertain: band !== BANDS.CONFIDENT,
      reason: reason,
      queryCountry: queryCountry,
      toolCountry: toolCountry,
      alternatives: buildAlternatives(list, opts.maxAlternatives || 3),
      signals: {
        margin: Number(margin.margin.toFixed(3)),
        coverage: Number(coverage.toFixed(3)),
        specificity: specificity,
        tiedWith: margin.tiedWith,
        countryConflict: countryConflict
      }
    };
  }

  function buildAlternatives(list, max) {
    return list.slice(1, 1 + max).map(function (candidate) {
      return {
        toolId: candidateId(candidate),
        score: candidateScore(candidate),
        label: (candidate.tool && (candidate.tool.name || candidate.tool.label)) || candidateId(candidate),
        route: (candidate.tool && candidate.tool.route) || null
      };
    }).filter(function (alternative) { return alternative.toolId; });
  }

  /**
   * Re-rank so a country-scoped tool cannot answer a different country's
   * question. Prefers a same-country variant when one exists, otherwise the
   * generic (unprefixed) tool, otherwise leaves the order alone and lets the
   * confidence score carry the warning.
   */
  function resolveCountryConflict(query, candidates) {
    var list = (candidates || []).filter(Boolean);
    if (list.length < 2) return list;
    var queryCountry = detectQueryCountry(query);
    if (!queryCountry) return list;
    var topCountry = detectToolCountry(candidateId(list[0]));
    if (!topCountry || topCountry === queryCountry) return list;

    var sameCountry = null;
    var generic = null;
    for (var i = 1; i < list.length; i++) {
      var country = detectToolCountry(candidateId(list[i]));
      if (country === queryCountry && !sameCountry) sameCountry = list[i];
      if (!country && !generic) generic = list[i];
    }
    var promoted = sameCountry || generic;
    if (!promoted) return list;
    return [promoted].concat(list.filter(function (candidate) { return candidate !== promoted; }));
  }

  /* ── Re-ranking ─────────────────────────────────────────────────────────── */

  /**
   * Re-order retrieved candidates by topical fit.
   *
   * Afro-Bench showed the retrieval is not the problem: the right tool is in the
   * top 5 for 79% of answerable prompts, but is chosen first only 45% of the
   * time. The gap is the ranking function, which rewards raw lexical overlap and
   * so lets "bill of quantities" land on `bill-split` while `boq-gen` sits at #3.
   *
   * The fix reuses the precision signal already computed for confidence: how
   * much of the TOOL's own identity the user actually said. `bill-split` only
   * earns "bill"; `boq-gen` earns "boq" via the phrase. Retrieval score is kept
   * as a secondary term so a strong lexical match is not thrown away, and a
   * country match is a real bonus rather than an accident of the tool id.
   */
  function rerank(query, candidates, options) {
    var opts = options || {};
    var list = (candidates || []).filter(Boolean);
    if (list.length < 2) return list;

    var queryCountry = detectQueryCountry(query);
    var topScore = candidateScore(list[0]) || 1;
    var idf = getIdf(opts.manifest);

    var scored = list.map(function (candidate, index) {
      var precision = coverageSignal(query, candidate, idf);
      var retrieval = candidateScore(candidate) / topScore;
      var toolCountry = detectToolCountry(candidateId(candidate));

      var fit = (precision * 0.6) + (retrieval * 0.4);

      if (queryCountry && toolCountry === queryCountry) fit += 0.15;
      // A tool scoped to a different country cannot be the best answer.
      if (queryCountry && toolCountry && toolCountry !== queryCountry) fit -= 0.5;
      // Ties in fit keep the retriever's original order.
      return { candidate: candidate, fit: fit, index: index };
    });

    scored.sort(function (left, right) {
      if (Math.abs(right.fit - left.fit) > 0.001) return right.fit - left.fit;
      return left.index - right.index;
    });

    if (opts.debug) {
      return scored.map(function (entry) {
        return { toolId: candidateId(entry.candidate), fit: Number(entry.fit.toFixed(3)) };
      });
    }
    return scored.map(function (entry) { return entry.candidate; });
  }

  return {
    VERSION: "afro-1.0",
    BANDS: BANDS,
    calibrate: calibrate,
    rerank: rerank,
    resolveCountryConflict: resolveCountryConflict,
    detectQueryCountry: detectQueryCountry,
    detectToolCountry: detectToolCountry,
    coverageSignal: coverageSignal,
    meaningfulTokens: meaningfulTokens
  };
});
