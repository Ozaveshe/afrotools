/* AfroTools — HS Lookup Engine /engines/hs-lookup-engine.js
   IIFE module. Depends on HS_DATABASE and COUNTRY_DUTY_RATES being loaded first.
*/
var HsLookupEngine = (function() {
  'use strict';

  /* ── 1. SEARCH ── */
  function searchByProduct(query) {
    if (!query || query.trim().length < 2) return [];
    var q = query.trim().toLowerCase();
    var results = [];
    var idx = HS_DATABASE.searchIndex;
    for (var i = 0; i < idx.length; i++) {
      var item = idx[i];
      var score = 0;
      // Exact code match
      if (item.code.replace('.','').toLowerCase() === q.replace('.','')) { score = 100; }
      // Code starts with query
      else if (item.code.toLowerCase().startsWith(q)) { score = 90; }
      // Description exact word match
      else if (item.searchText.includes(' ' + q + ' ') || item.searchText.startsWith(q)) { score = 80; }
      // Substring in description
      else if (item.description.toLowerCase().includes(q)) { score = 70; }
      // Substring in keywords
      else if (item.keywords.toLowerCase().includes(q)) { score = 60; }
      // Partial word match
      else {
        var words = q.split(/\s+/);
        var matched = words.filter(function(w) { return item.searchText.includes(w); });
        if (matched.length === words.length) score = 50;
        else if (matched.length > 0) score = 30 * (matched.length / words.length);
      }
      if (score > 0) {
        results.push({ score: score, item: item });
      }
    }
    results.sort(function(a, b) { return b.score - a.score; });
    return results.slice(0, 20).map(function(r) { return r.item; });
  }

  /* ── 2. LOOKUP BY CODE ── */
  function lookupByCode(hsCode) {
    var clean = hsCode.replace(/\s/g, '');
    // Try subheading match first (e.g. 8517.12)
    for (var i = 0; i < HS_DATABASE.searchIndex.length; i++) {
      var item = HS_DATABASE.searchIndex[i];
      if (item.code.replace('.','') === clean.replace('.','')) return item;
    }
    // Try heading match (4-digit, e.g. 8517)
    if (clean.length === 4) {
      for (var c = 0; c < HS_DATABASE.chapters.length; c++) {
        var ch = HS_DATABASE.chapters[c];
        for (var h = 0; h < (ch.headings || []).length; h++) {
          if (ch.headings[h].code === clean) {
            return { code: ch.headings[h].code, description: ch.headings[h].description,
              chapter: ch.chapter, chapterTitle: ch.title };
          }
        }
      }
    }
    // Chapter match (2-digit)
    if (clean.length <= 2) {
      var chp = clean.padStart(2,'0');
      if (HS_DATABASE.chapterMap[chp]) {
        var ch2 = HS_DATABASE.chapterMap[chp];
        return { code: chp, description: ch2.title, chapter: chp, chapterTitle: ch2.title };
      }
    }
    return null;
  }

  /* ── 3. GET DUTY RATES FOR A CODE + COUNTRY ── */
  function getDutyRates(hsCode, countryCode) {
    var country = COUNTRY_DUTY_RATES[countryCode];
    if (!country) return null;
    var item = lookupByCode(hsCode);
    if (!item) return null;
    var chapter = item.chapter || (hsCode.substring(0,2));
    var chStr = chapter.toString().padStart(2,'0');
    var rate = country.dutyRates && country.dutyRates[chStr];
    return {
      country: country.name,
      flag: country.flag,
      authority: country.authority,
      currency: country.currency,
      vatRate: country.vatRate,
      dutyRange: rate ? rate.range : 'N/A',
      dutyTypical: rate ? rate.typical : null,
      notes: rate ? rate.notes : null,
      levies: country.additionalLevies || [],
      tradeBloc: country.tradeBloc
    };
  }

  /* ── 4. COMPARE RATES ACROSS COUNTRIES ── */
  function compareRates(hsCode, countryCodes) {
    var results = [];
    countryCodes.forEach(function(cc) {
      var r = getDutyRates(hsCode, cc);
      if (r) results.push(r);
    });
    results.sort(function(a,b) { return (a.dutyTypical||999) - (b.dutyTypical||999); });
    return results;
  }

  /* ── 5. CHAPTER TREE ── */
  function getChapterTree(chapterNum) {
    var ch = HS_DATABASE.chapterMap[chapterNum.padStart(2,'0')];
    return ch || null;
  }

  /* ── 6. ALL CHAPTERS LIST ── */
  function getAllChapters() {
    return HS_DATABASE.chapters.map(function(c) {
      return { chapter: c.chapter, title: c.title, section: c.section, sectionTitle: c.sectionTitle };
    });
  }

  /* ── 7. AI OBSERVATIONS ── */
  function getObservations(hsCode, primaryCountry) {
    var item = lookupByCode(hsCode);
    if (!item) return [];
    var obs = [];
    var ch = item.chapter ? item.chapter.padStart(2,'0') : hsCode.substring(0,2);
    var allRates = compareRates(hsCode, Object.keys(COUNTRY_DUTY_RATES));

    // Observation 1: cheapest country
    if (allRates.length > 0 && allRates[0].dutyTypical !== null) {
      var cheapest = allRates[0];
      if (primaryCountry && cheapest.country !== COUNTRY_DUTY_RATES[primaryCountry]?.name) {
        obs.push({ type:'tip', text: 'Lowest duty on this product: ' + cheapest.dutyTypical + '% in ' + cheapest.flag + ' ' + cheapest.country + '. Consider routing via trade bloc arrangements.' });
      }
    }

    // Observation 2: AfCFTA
    obs.push({ type:'info', text: 'AfCFTA preferential rates are being phased in across 54 countries. Check your country\'s tariff offer schedule for possible reduced rates.' });

    // Observation 3: specific chapter flags
    var flags = {
      '27': 'Petroleum products may attract additional fuel levies not reflected in customs duty rates.',
      '87': 'Vehicle imports often attract excise duty and age restrictions on top of customs duty.',
      '61': 'Secondhand clothing (mitumba/okrika) may be subject to flat-rate or per-kg duty in some countries.',
      '62': 'Woven apparel typically attracts the highest duty bands (40–45% in South Africa).',
      '30': 'Essential medicines are often duty-free or attract 0% under bilateral health agreements.',
      '85': 'Solar panels (HS 8541.49) are duty-free in Kenya and Rwanda under green energy policies.',
      '31': 'Fertilisers are typically duty-free across Africa to support food security.',
      '10': 'Rice (1006.30) attracts high protection in East Africa — up to 75% in Kenya and Tanzania.'
    };
    if (flags[ch]) obs.push({ type:'warn', text: flags[ch] });

    return obs;
  }

  /* ── PUBLIC API ── */
  return {
    searchByProduct: searchByProduct,
    lookupByCode: lookupByCode,
    getDutyRates: getDutyRates,
    compareRates: compareRates,
    getChapterTree: getChapterTree,
    getAllChapters: getAllChapters,
    getObservations: getObservations
  };
})();
