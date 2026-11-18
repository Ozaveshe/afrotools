var HsLookupEngine = function() {
  "use strict";
  function e(e) {
    for (var t = e.replace(/\s/g, ""), r = 0; r < HS_DATABASE.searchIndex.length; r++) {
      var a = HS_DATABASE.searchIndex[r];
      if (a.code.replace(".", "") === t.replace(".", "")) {
        return a;
      }
    }
    if (4 === t.length) {
      for (var n = 0; n < HS_DATABASE.chapters.length; n++) {
        for (var i = HS_DATABASE.chapters[n], c = 0; c < (i.headings || []).length; c++) {
          if (i.headings[c].code === t) {
            return {
              code: i.headings[c].code,
              description: i.headings[c].description,
              chapter: i.chapter,
              chapterTitle: i.title
            };
          }
        }
      }
    }
    if (t.length <= 2) {
      var s = t.padStart(2, "0");
      if (HS_DATABASE.chapterMap[s]) {
        var o = HS_DATABASE.chapterMap[s];
        return {
          code: s,
          description: o.title,
          chapter: s,
          chapterTitle: o.title
        };
      }
    }
    return null;
  }
  function t(t, r) {
    var a = COUNTRY_DUTY_RATES[r];
    if (!a) {
      return null;
    }
    var n = e(t);
    if (!n) {
      return null;
    }
    var i = (n.chapter || t.substring(0, 2)).toString().padStart(2, "0"), c = a.dutyRates && a.dutyRates[i];
    return {
      country: a.name,
      flag: a.flag,
      authority: a.authority,
      currency: a.currency,
      vatRate: a.vatRate,
      dutyRange: c ? c.range : "N/A",
      dutyTypical: c ? c.typical : null,
      notes: c ? c.notes : null,
      levies: a.additionalLevies || [],
      tradeBloc: a.tradeBloc
    };
  }
  function r(e, r) {
    var a = [];
    return r.forEach(function(r) {
      var n = t(e, r);
      n && a.push(n);
    }), a.sort(function(e, t) {
      return (e.dutyTypical ?? Infinity) - (t.dutyTypical ?? Infinity);
    }), a;
  }
  return {
    searchByProduct: function(e) {
      if (!e || e.trim().length < 2) {
        return [];
      }
      for (var t = e.trim().toLowerCase(), r = [], a = HS_DATABASE.searchIndex, n = 0; n < a.length; n++) {
        var i = a[n], c = 0;
        if (i.code.replace(".", "").toLowerCase() === t.replace(".", "")) {
          c = 100;
        } else if (i.code.toLowerCase().startsWith(t)) {
          c = 90;
        } else if (i.searchText.includes(" " + t + " ") || i.searchText.startsWith(t)) {
          c = 80;
        } else if (i.description.toLowerCase().includes(t)) {
          c = 70;
        } else if (i.keywords.toLowerCase().includes(t)) {
          c = 60;
        } else {
          var s = t.split(/\s+/), o = s.filter(function(e) {
            return i.searchText.includes(e);
          });
          o.length === s.length ? c = 50 : o.length > 0 && (c = o.length / s.length * 30);
        }
        c > 0 && r.push({
          score: c,
          item: i
        });
      }
      return r.sort(function(e, t) {
        return t.score - e.score;
      }), r.slice(0, 20).map(function(e) {
        return e.item;
      });
    },
    lookupByCode: e,
    getDutyRates: t,
    compareRates: r,
    getChapterTree: function(e) {
      return HS_DATABASE.chapterMap[e.padStart(2, "0")] || null;
    },
    getAllChapters: function() {
      return HS_DATABASE.chapters.map(function(e) {
        return {
          chapter: e.chapter,
          title: e.title,
          section: e.section,
          sectionTitle: e.sectionTitle
        };
      });
    },
    getObservations: function(t, a) {
      var n = e(t);
      if (!n) {
        return [];
      }
      return [{
        type: "info",
        text: "The table groups goods by HS chapter " + n.chapter + ". Confirm the national tariff line, origin, effective date and any additional charges with the importing customs authority."
      }];
    }
  };
}();
