/*
 * Afro 1.3 — routing confidence, ranking, country scoping and tool vocabulary.
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

  /* ── Full 54-market scoping ───────────────────────────────────────────────
   *
   * COUNTRY_SIGNALS above carries rich detection (currency, cities) for the 16
   * markets that dominate traffic. Tool SCOPING, though, has to cover all 54:
   * carrying only 16 meant so-vat (Somalia) and fish-farming-angola were not
   * recognised as country-scoped at all, so a country-neutral question could
   * still be answered by one arbitrary market's tool.
   *
   * Audited against the live manifest: of every tool whose first two letters
   * match an ISO code, `cv-builder` is the ONLY false positive — CV is Cape
   * Verde, but that tool is the résumé builder. Everything else prefixed
   * (xx-paye, xx-vat, ...) is genuinely country-scoped. */
  var ALL_MARKET_SLUGS = {
    AO: "angola", BF: "burkina-faso", BI: "burundi", BJ: "benin", BW: "botswana",
    CD: "dr-congo", CF: "central-african-republic", CG: "congo", CI: "cote-divoire",
    CM: "cameroon", CV: "cabo-verde", DJ: "djibouti", DZ: "algeria", EG: "egypt",
    ER: "eritrea", ET: "ethiopia", GA: "gabon", GH: "ghana", GM: "gambia",
    GN: "guinea", GQ: "equatorial-guinea", GW: "guinea-bissau", KE: "kenya",
    KM: "comoros", LR: "liberia", LS: "lesotho", LY: "libya", MA: "morocco",
    MG: "madagascar", ML: "mali", MR: "mauritania", MU: "mauritius", MW: "malawi",
    MZ: "mozambique", NA: "namibia", NE: "niger", NG: "nigeria", RW: "rwanda",
    SC: "seychelles", SD: "sudan", SL: "sierra-leone", SN: "senegal", SO: "somalia",
    SS: "south-sudan", ST: "sao-tome-and-principe", SZ: "eswatini", TD: "chad",
    TG: "togo", TN: "tunisia", TZ: "tanzania", UG: "uganda", ZA: "south-africa",
    ZM: "zambia", ZW: "zimbabwe"
  };

  // Ids whose two-letter prefix collides with a country code but are generic.
  var NOT_COUNTRY_SCOPED = { "cv-builder": 1 };

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
  /**
   * The country a tool is scoped to. Null means generic (serves every market).
   *
   * Tools are scoped two different ways and only one was being detected:
   *
   *   prefix   ke-paye, za-transfer-duty, so-vat        135 tools
   *   suffix   input-prices-kenya, fish-farming-nigeria 166 tools
   *
   * Missing the suffix form left 166 of the 301 country-scoped tools — more
   * than half — invisible to every country rule, which is how a query about
   * fish-pond profit landed on fish-farming-nigeria and a Lagos-to-Accra
   * shipping question landed on ng-land-use.
   */
  function detectToolCountry(toolId) {
    var id = lower(toolId);
    if (NOT_COUNTRY_SCOPED[id]) return null;
    var prefix = /^([a-z]{2})-/.exec(id);
    if (prefix && ALL_MARKET_SLUGS[prefix[1].toUpperCase()]) return prefix[1].toUpperCase();
    for (var code in ALL_MARKET_SLUGS) {
      if (!Object.prototype.hasOwnProperty.call(ALL_MARKET_SLUGS, code)) continue;
      var slug = ALL_MARKET_SLUGS[code];
      if (id.length > slug.length + 1 && id.slice(-(slug.length + 1)) === "-" + slug) return code;
    }
    return null;
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
  /**
   * The quantity the candidate ORDER was decided on.
   *
   * After rerank() that is `afroFit`, not the retrieval score. Measuring the
   * margin on the score of a fit-ordered list compares two different scales and
   * silently reports every decisive win as a tie.
   */
  function rankingValue(candidate) {
    if (candidate && typeof candidate.afroFit === "number" && isFinite(candidate.afroFit)) {
      return candidate.afroFit;
    }
    return candidateScore(candidate);
  }

  /**
   * Did retrieval and reranking agree on the winner?
   *
   * When they disagree — the fit winner was NOT the highest-scoring candidate
   * out of the retriever — the answer rests entirely on the lexicon and IDF
   * weighting rather than on the user's words matching the tool. That is
   * exactly where this system is most likely to be confidently wrong, so it is
   * worth a real deduction.
   *
   * This used to happen by accident: marginSignal read the retrieval score off
   * a fit-ordered list, so a rerank upset produced a negative difference that
   * clamped to a margin of 0 and capped confidence. Fixing the scale removed
   * the accident along with the bug, and holdout precision fell 96% -> 88%.
   * The signal was real; only its expression was junk. This states it outright.
   */
  function rerankUpset(candidates) {
    if (!candidates || candidates.length < 2) return false;
    var winner = candidateScore(candidates[0]);
    for (var i = 1; i < candidates.length; i++) {
      if (candidateScore(candidates[i]) > winner + 0.001) return true;
    }
    return false;
  }

  function marginSignal(candidates) {
    if (!candidates.length) return { margin: 0, tiedWith: 0 };
    var top = rankingValue(candidates[0]);
    if (top <= 0) return { margin: 0, tiedWith: 0 };
    var tiedWith = 0;
    for (var i = 1; i < candidates.length; i++) {
      if (Math.abs(rankingValue(candidates[i]) - top) < 0.001) tiedWith++;
      else break;
    }
    var second = candidates.length > 1 ? rankingValue(candidates[1]) : 0;
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

    /* ABSOLUTE matched informativeness, not a ratio.
     *
     * A ratio silently rewards short tool names, because dividing by the tool's
     * own term count means a one-word tool that matches scores a perfect 1.0.
     * Measured on the 52-case holdout that broke more than it fixed:
     *
     *   "remove vat from 45000"  ->  bw-vat (Botswana) beat vat-calc-pan-african
     *                                because after stripping the country prefix
     *                                bw-vat is just ["vat"] and scored 1.0,
     *                                while the pan-African tool scored 0.25 for
     *                                matching the same single word.
     *   "fish pond, e go profit" ->  market-stall-profit beat fish-farming-roi
     *                                on the generic word "profit".
     *
     * Summing the rarity weight of the terms the user actually said — and
     * normalising against a fixed expectation rather than the tool's own length
     * — means a tool is rewarded for how much distinctive evidence the query
     * gives it, never for having a short name.
     */
    var matchedWeight = 0;
    var matchedCount = 0;
    terms.forEach(function (term) {
      var hit = queryText.indexOf(" " + term + " ") !== -1 ||
        (term.length > 4 && queryText.indexOf(" " + term.slice(0, term.length - 2)) !== -1);
      if (hit) { matchedWeight += termWeight(term, idf); matchedCount += 1; }
    });

    /* Blend absolute informativeness with the share of the tool's identity that
     * was matched, because each alone has a known failure mode.
     *
     * Pure ratio rewards short names — bw-vat is just ["vat"] after the country
     * prefix, so matching one word scores a perfect 1.0 against
     * vat-calc-pan-african's 0.25 for the same word.
     *
     * Pure absolute weight rewards rare-but-generic words — "remove vat from
     * 45000 so i know the real price" promoted creator-pricing over
     * vat-calc-pan-african, because "pricing" happens to be rarer across the
     * catalogue than "vat" (which ~54 country VAT tools share) and therefore
     * outscored the word that actually names the domain.
     *
     * Half of each keeps a distinctive match meaningful without letting either
     * a short name or a rare stray word carry a tool on its own. */
    var absolute = Math.min(1, matchedWeight / 3);
    var share = matchedCount / terms.length;
    return (absolute * 0.5) + (share * 0.5);
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

    /* A NEAR-tie is just as uninformative as an exact one, and far more common.
     *
     * Coverage saturates — one distinctive term is enough to reach 1.0 — so a
     * saturated coverage plus a specific query reached 0.70 before margin
     * contributed anything at all. On the 52-case holdout every remaining
     * confident-but-wrong answer had coverage >= 0.89, and three of them were
     * separated from the runner-up by margins of 0.013, 0.017 and 0.024:
     * arithmetic ties, presented as certainty.
     *
     * Margin therefore gates the result rather than merely adding to it. If the
     * top two candidates are within a few percent, the ordering is a coin flip
     * and nothing else the query offers can rescue it. */
    if (margin.margin < 0.15) confidence = Math.min(confidence, 0.45 + margin.margin);
    /* Reranking overturned the retriever: the user's own words did not pick this
     * tool, our vocabulary did. Cap below the assertion threshold. */
    if (rerankUpset(list)) confidence = Math.min(confidence, 0.55);
    /* The lexicon contradicting itself is an ambiguity signal, not a boost. */
    if (opts.lexicon && lexiconEntryHits(query, opts.lexicon) >= 2) {
      confidence = Math.min(confidence, 0.55);
    }
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
      alternatives: buildAlternatives(query, list, opts.maxAlternatives || 3, opts.lexicon),
      signals: {
        margin: Number(margin.margin.toFixed(3)),
        coverage: Number(coverage.toFixed(3)),
        specificity: specificity,
        tiedWith: margin.tiedWith,
        countryConflict: countryConflict
      }
    };
  }

  /** Country words carry no topical information for an alternatives list. */
  function stripCountryWords(query) {
    var text = " " + lower(query) + " ";
    for (var code in ALL_MARKET_SLUGS) {
      if (!Object.prototype.hasOwnProperty.call(ALL_MARKET_SLUGS, code)) continue;
      var slug = ALL_MARKET_SLUGS[code];
      text = text.split(" " + slug + " ").join(" ").split("-" + slug).join("");
    }
    return text.replace(/\s+/g, " ").trim();
  }

  /**
   * Runners-up worth showing, with country-only matches dropped.
   *
   * A tool that shares nothing with the query but the country name is not an
   * alternative, it is noise: "how much to send money from uk to nigeria"
   * offered Nigeria Fertilizer Calculator and Nigeria Greenhouse Cost
   * Estimator, which rank well purely because "nigeria" sits in their ids.
   * Putting those beside a real answer makes an honest "I am not sure" read as
   * incompetence. Coverage is therefore measured against the query with country
   * words removed, so a candidate has to earn its place on the topic.
   */
  function buildAlternatives(query, list, max, lexicon) {
    var topical = stripCountryWords(query);
    var lexHits = lexiconMatches(query, lexicon);
    return list.slice(1).filter(function (candidate) {
      /* A lexicon-named tool is kept even at zero coverage — that is the whole
       * point of the lexicon, and filtering on coverage alone dropped
       * Remittance Comparator, the one alternative actually worth offering. */
      if (lexHits[candidateId(candidate)]) return true;
      return coverageSignal(topical, candidate) > 0;
    }).slice(0, max).map(function (candidate) {
      return {
        toolId: candidateId(candidate),
        score: candidateScore(candidate),
        /* The router manifest calls it `title`; `name`/`label` do not exist on
         * it, so every alternative was rendering as a raw slug
         * ("fertilizer-nigeria") in the one place a user is being asked to
         * choose. Keep the old keys as fallbacks for directory-shaped input. */
        label: (candidate.tool && (candidate.tool.title || candidate.tool.name || candidate.tool.label)) || candidateId(candidate),
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
    var topCountry = detectToolCountry(candidateId(list[0]));

    /* A country-NEUTRAL question must not be answered by a country-scoped tool
     * when a generic equivalent was also retrieved.
     *
     * The old rule only fired when the query named a country, so it never saw
     * the more common failure: "remove vat from 45000" naming no country at all
     * and landing on so-vat (Somalia) ahead of vat-calc-pan-african, or "i want
     * start fish pond" landing on fish-farming-nigeria ahead of
     * fish-farming-roi. Answering a general question with one arbitrary
     * market's tool is wrong for every other market. */
    if (!queryCountry) {
      if (!topCountry) return list;
      for (var g = 1; g < list.length; g++) {
        if (!detectToolCountry(candidateId(list[g]))) {
          var pick = list[g];
          return [pick].concat(list.filter(function (candidate) { return candidate !== pick; }));
        }
      }
      return list;
    }

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
  /**
   * Tools the Afro-Lexicon says this phrasing means, regardless of wording.
   *
   * The manifest describes tools in their own titles, so a user who says
   * "clear my car for tincan" or "wetin go remain" matches nothing — the
   * vocabulary gap, not a ranking gap. The lexicon closes it, and it is the
   * layer that grows from real queries.
   */
  /**
   * Does a lexicon phrase appear in the query?
   *
   * Exact containment is too brittle for how people actually type. The lexicon
   * carries "wetin go remain"; a user writes "how much go remain". Both mean
   * take-home pay. So a multi-word phrase also matches when nearly all of its
   * distinctive words are present — the phrase's meaning survives one word
   * being swapped, which is precisely what colloquial variation does.
   */
  function phraseMatches(text, phrase) {
    var needle = lower(phrase);
    if (text.indexOf(" " + needle + " ") !== -1) return true;
    if (text.indexOf(" " + needle) !== -1) return true;

    var words = needle.split(/\s+/).filter(function (word) {
      return word.length > 1 && !STOPWORDS[word];
    });
    /* Near-miss matching only for phrases with three or more distinctive words.
     *
     * With two, dropping one leaves a single word carrying the whole match, and
     * a lexicon hit INJECTS a candidate in 1.1 — a false positive here does not
     * just misrank, it manufactures a wrong answer and hands it a high score.
     * The safe way to cover a colloquial variant is to add it to the lexicon,
     * not to loosen the matcher until it catches it by accident. */
    if (words.length < 3) return false;

    var present = words.filter(function (word) {
      return text.indexOf(" " + word + " ") !== -1 || text.indexOf(" " + word) !== -1;
    }).length;
    return present >= words.length - 1;
  }

  /* ── Synonym expansion ────────────────────────────────────────────────────
   *
   * The manifest names tools in institutional register while people ask in
   * everyday words. On a 52-case holdout the residual never-retrieved failures
   * were almost all one word standing for another:
   *
   *   "how much to deliver baby"      childbirth-cost is named "childbirth budget"
   *   "what should i plant after maize"  crop-rotation-planner never says "plant"
   *   "what be the interest if i borrow" loan-compare never says "borrow"
   *   "change 200 pounds to cedis"    currency-converter names no currencies
   *
   * Expanding the QUERY rather than rewriting the index keeps this reversible
   * and safe: the original tokens are always preserved and synonyms appended,
   * so expansion can only add reach, never remove a match the retriever would
   * have made on its own.
   */
  var synonymIndex = null;
  var synonymSource = null;

  function buildSynonymIndex(synonyms) {
    var index = {};
    (synonyms && synonyms.groups || []).forEach(function (group) {
      var terms = (group.terms || []).map(lower);
      terms.forEach(function (term) {
        index[term] = (index[term] || []).concat(terms.filter(function (other) { return other !== term; }));
      });
    });
    return index;
  }

  function getSynonymIndex(synonyms) {
    if (!synonyms) return null;
    if (synonymIndex && synonymSource === synonyms) return synonymIndex;
    synonymIndex = buildSynonymIndex(synonyms);
    synonymSource = synonyms;
    return synonymIndex;
  }

  /** Query text plus concept-equivalent terms, for retrieval only. */
  function expandQuery(query, synonyms) {
    var index = getSynonymIndex(synonyms);
    if (!index) return query;
    var text = lower(query);
    var added = {};
    // Multi-word entries first so "value added tax" is seen before "tax".
    Object.keys(index).forEach(function (term) {
      if (term.indexOf(" ") === -1) return;
      if (text.indexOf(term) === -1) return;
      index[term].forEach(function (syn) { added[syn] = true; });
    });
    meaningfulTokens(query).forEach(function (token) {
      (index[token] || []).forEach(function (syn) { added[syn] = true; });
    });
    var extra = Object.keys(added).filter(function (term) { return text.indexOf(term) === -1; });
    return extra.length ? query + " " + extra.join(" ") : query;
  }

  function lexiconMatches(query, lexicon) {
    if (!lexicon || !lexicon.entries) return {};
    var text = " " + lower(query).replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ") + " ";
    var hits = {};
    lexicon.entries.forEach(function (entry) {
      var matched = (entry.phrases || []).some(function (phrase) {
        return phraseMatches(text, phrase);
      });
      if (!matched) return;
      /* Position carries meaning: an entry lists its tools best-first, so the
       * head is the author's answer and the tail is a fallback. Every tool used
       * to receive an identical boost, which meant a four-tool entry injected
       * four equally-weighted candidates and the tie was then broken by
       * retrieval score — the exact signal the lexicon exists to overrule.
       * 21 of 30 entries name more than one tool, so this was the common case,
       * not the corner. Strength decays 1, 1/2, 1/3 … and an entry that names a
       * tool more strongly than another entry did wins. */
      (entry.tools || []).forEach(function (toolId, index) {
        var strength = 1 / (1 + index);
        if (!hits[toolId] || hits[toolId] < strength) hits[toolId] = strength;
      });
    });
    return hits;
  }

  /**
   * How many DIFFERENT lexicon entries claim this query.
   *
   * Two entries pointing at two different tools is the lexicon disagreeing with
   * itself, and that is evidence of an ambiguous question — not of a confident
   * answer. "cheapest way to send money to lagos" hits both the remittance
   * entry ("cheapest way to send money" -> remittance-compare) and the mobile
   * money entry ("send money charges" -> mobile-money-fees). Both got the same
   * +0.6 boost, the boosts cancelled, retrieval broke the tie, and the result
   * was asserted at 0.75 — a genuinely ambiguous question answered with
   * certainty. The question is ambiguous because the query never says whether
   * the money is crossing a border; the honest response is to ask.
   *
   * Tools named together by ONE entry are not ambiguity — that is an author
   * deliberately saying "either of these fits" — so this counts entries, not
   * tools.
   */
  function lexiconEntryHits(query, lexicon) {
    if (!lexicon || !lexicon.entries) return 0;
    var text = " " + lower(query).replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ") + " ";
    var count = 0;
    lexicon.entries.forEach(function (entry) {
      var matched = (entry.phrases || []).some(function (phrase) {
        return phraseMatches(text, phrase);
      });
      if (matched) count++;
    });
    return count;
  }

  /**
   * Add tools the lexicon named but retrieval never surfaced.
   *
   * This is the fix that defines 1.1. In 1.0 the lexicon could only reorder
   * what retrieval already found, so it was powerless exactly when it was most
   * right. Measured on Afro-Bench, the lexicon named the correct tool and
   * retrieval had not returned it at all in cases like:
   *
   *   "what will my take home pay be in Kenya"  retrieved five home-* tools,
   *                                             lexicon knew ke-paye
   *   "convert 5000 dolars to naria"            retrieved pdf/image converters,
   *                                             lexicon knew currency-converter
   *   "how much does M-Pesa charge"             retrieved service-charge,
   *                                             lexicon knew mobile-money-fees
   *
   * A lexicon entry is a human assertion that this phrasing means this tool.
   * That is stronger evidence than lexical overlap, so it earns a place in the
   * candidate set rather than merely a nudge within it.
   */
  function injectLexiconCandidates(candidates, lexHits, manifest) {
    var tools = Array.isArray(manifest) ? manifest : (manifest && manifest.tools) || [];
    if (!tools.length) return candidates;

    var present = {};
    candidates.forEach(function (candidate) { present[candidateId(candidate)] = true; });

    var missing = Object.keys(lexHits).filter(function (toolId) { return !present[toolId]; });
    if (!missing.length) return candidates;

    var topScore = candidates.length ? candidateScore(candidates[0]) : 100;
    var injected = [];
    missing.forEach(function (toolId) {
      for (var i = 0; i < tools.length; i++) {
        if (tools[i].id === toolId) {
          injected.push({
            tool: tools[i],
            // Seeded at parity with the incumbent so it competes on fit in the
            // re-rank rather than winning by fiat.
            score: topScore,
            matchedTerms: [],
            fromLexicon: true
          });
          return;
        }
      }
    });
    return injected.concat(candidates);
  }

  /**
   * The whole pipeline, in the order that matters.
   *
   * Retrieve -> inject what the lexicon knows -> re-rank on fit -> enforce
   * country -> grade. Exposed as one call so callers cannot accidentally skip
   * injection, which was the 1.0 defect.
   */
  /**
   * Retrieve and grade in one call — the entry point production should use.
   *
   * Synonym expansion has to happen BEFORE retrieval, so leaving it to callers
   * meant a caller could silently get the un-expanded behaviour. Measured on
   * the holdout that difference was worth 19 -> 9 prompts whose correct tool
   * never made the candidate list at all.
   *
   * @param {function} rankFn  manifestApi.rankToolCandidates
   */
  function retrieveAndResolve(query, rankFn, options) {
    var opts = options || {};
    var expanded = opts.synonyms ? expandQuery(query, opts.synonyms) : query;
    var ranked = rankFn(expanded, opts.manifest, { limit: opts.limit || 5, minScore: opts.minScore || 1 });
    var candidates = (ranked && ranked.candidates) || [];
    // Grade against the ORIGINAL query: expansion helps us find candidates, but
    // confidence must reflect what the user actually said, not words we added.
    return resolve(query, candidates, opts);
  }

  function resolve(query, candidates, options) {
    var opts = options || {};
    var list = (candidates || []).filter(Boolean);
    var lexHits = lexiconMatches(query, opts.lexicon);

    if (opts.manifest && Object.keys(lexHits).length) {
      list = injectLexiconCandidates(list, lexHits, opts.manifest);
    }
    list = rerank(query, list, opts);
    list = resolveCountryConflict(query, list);

    var graded = calibrate(query, list, opts);
    graded.candidates = list;
    graded.selectedToolId = candidateId(list[0]) || null;
    graded.lexiconUsed = Object.keys(lexHits).length > 0;
    return graded;
  }

  function rerank(query, candidates, options) {
    var opts = options || {};
    var list = (candidates || []).filter(Boolean);
    if (list.length < 2) return list;

    var queryCountry = detectQueryCountry(query);
    var topScore = candidateScore(list[0]) || 1;
    var idf = getIdf(opts.manifest);
    var lexHits = lexiconMatches(query, opts.lexicon);

    var scored = list.map(function (candidate, index) {
      var precision = coverageSignal(query, candidate, idf);
      var retrieval = candidateScore(candidate) / topScore;
      var toolCountry = detectToolCountry(candidateId(candidate));

      var fit = (precision * 0.6) + (retrieval * 0.4);

      // A lexicon hit is strong evidence: a human has said this phrasing means
      // this tool. It outweighs lexical overlap, which is exactly the point.
      // Scaled by how strongly the lexicon named this tool, not merely whether
      // it appeared somewhere in a matched entry.
      if (lexHits[candidateId(candidate)]) fit += 0.6 * lexHits[candidateId(candidate)];

      if (queryCountry && toolCountry === queryCountry) fit += 0.15;
      // A tool scoped to a different country cannot be the best answer.
      if (queryCountry && toolCountry && toolCountry !== queryCountry) fit -= 0.5;
      /* A general question deserves the general tool. Answering "remove vat
       * from 45000" with so-vat picks one arbitrary market for a user who named
       * none, and is wrong for the other 53. */
      if (!queryCountry && toolCountry) fit -= 0.3;

      /* Synonym expansion is allowed to widen the candidate POOL, never to win
       * the ranking on its own. Precision is measured against the user's
       * original words, so a precision of zero means this candidate matched
       * only terms we added on their behalf — "save money for my children
       * university" reaching mobile-money-fees through the money synonyms.
       * Retrieval score alone must not carry it to first place. */
      /* ...but NOT a candidate the lexicon named. The lexicon exists to reach
       * tools whose own words appear nowhere in the query — "tincan" means
       * customs, "wetin go remain" means PAYE, "send money home" means
       * remittance-compare, whose title shares no term with "how much to send
       * money from uk to nigeria". Those injections have precision 0 BY
       * DEFINITION, so this penalty was cancelling the +0.6 boost and quietly
       * defeating the 1.1 injection feature in exactly the cases it exists for.
       * remittance-compare landed below eight Nigerian agriculture tools that
       * matched only the word "nigeria". */
      if (precision === 0 && !lexHits[candidateId(candidate)]) fit -= 0.45;
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
    /* Preserve the value the ordering was actually decided on. marginSignal
     * used to read `.score` — the pre-rerank retrieval score — while the list
     * in front of it had been re-sorted by `fit`. On a decisive rerank win the
     * winner often has the LOWEST retrieval score (ke-paye 100 behind
     * ng-paye 134), so `(top - second)/top` went negative, clamped to 0, and a
     * clear match was capped at 0.45 and flagged unsure. */
    return scored.map(function (entry) {
      if (entry.candidate && typeof entry.candidate === "object") entry.candidate.afroFit = entry.fit;
      return entry.candidate;
    });
  }

  return {
    VERSION: "afro-1.3",
    BANDS: BANDS,
    calibrate: calibrate,
    rerank: rerank,
    resolve: resolve,
    retrieveAndResolve: retrieveAndResolve,
    expandQuery: expandQuery,
    lexiconMatches: lexiconMatches,
    lexiconEntryHits: lexiconEntryHits,
    phraseMatches: phraseMatches,
    injectLexiconCandidates: injectLexiconCandidates,
    resolveCountryConflict: resolveCountryConflict,
    detectQueryCountry: detectQueryCountry,
    detectToolCountry: detectToolCountry,
    coverageSignal: coverageSignal,
    meaningfulTokens: meaningfulTokens
  };
});
