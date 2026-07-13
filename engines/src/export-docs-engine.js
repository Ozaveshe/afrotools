var ExportDocsEngine = function() {
  "use strict";
  return {
    getDocList: function(t, e, r) {
      var i = {
        universal: [],
        countrySpecific: [],
        destinationSpecific: [],
        prohibited: [],
        tips: [],
        countryInfo: null
      };
      i.universal = EXPORT_DOCS.universal.map(function(t) {
        return Object.assign({}, t, {
          checked: !1,
          source: "universal"
        });
      });
      var o = EXPORT_DOCS.countries[t];
      o && (i.countryInfo = {
        name: o.name,
        flag: o.flag,
        exportAuthority: o.exportAuthority,
        customsAuthority: o.customsAuthority,
        currency: o.currency
      }, i.countrySpecific = o.requiredDocs.map(function(t) {
        return Object.assign({}, t, {
          checked: !1,
          source: "country"
        });
      }), i.prohibited = o.prohibitedExports || [], i.tips = o.tips || []);
      var n = EXPORT_DOCS.destinationRequirements[r];
      n && (i.destinationSpecific = n.requirements.map(function(t, e) {
        return {
          id: "dest_" + e,
          name: t,
          description: "",
          mandatory: "if_applicable",
          checked: !1,
          source: "destination"
        };
      }));
      var a = i.universal.concat(i.countrySpecific).concat(i.destinationSpecific);
      return i.totalDocs = a.length, i.mandatoryCount = a.filter(function(t) {
        return !0 === t.mandatory;
      }).length, i.productCategory = e ? EXPORT_DOCS.productCategories.find(function(t) {
        return t.id === e;
      }) : null, i;
    },
    getAllCountries: function() {
      return Object.keys(EXPORT_DOCS.countries).map(function(t) {
        var e = EXPORT_DOCS.countries[t];
        return {
          code: t,
          name: e.name,
          flag: e.flag
        };
      });
    },
    getDestinations: function() {
      return Object.keys(EXPORT_DOCS.destinationRequirements).map(function(t) {
        return {
          code: t,
          name: EXPORT_DOCS.destinationRequirements[t].name
        };
      });
    },
    getProductCategories: function() {
      return EXPORT_DOCS.productCategories;
    },
    getObservations: function(t, e, r) {
      var i = [], o = EXPORT_DOCS.countries[t];
      return o ? ("AFRICA_AFCFTA" !== r && "EAC" !== r && "ECOWAS" !== r && "SADC" !== r && "COMESA" !== r || i.push({
        type: "info",
        text: "For intra-African trade, obtain an AfCFTA Certificate of Origin from " + (o.exportAuthority || "your national export authority") + " to claim preferential tariff rates and avoid paying MFN duties."
      }), "EU" === r && i.push({
        type: "tip",
        text: "Check if your country has an Economic Partnership Agreement (EPA) with the EU. If so, use EUR.1 or REX self-certification to access GSP+/ACP preferential duty rates and avoid standard EU tariffs."
      }), "US" === r && i.push({
        type: "tip",
        text: "Check AGOA eligibility for your country and product — African Growth and Opportunity Act (AGOA) provides duty-free access to the US for 6,500+ product lines from eligible African countries."
      }), "cocoa" === e && "CI" === t && i.push({
        type: "warn",
        text: "All cocoa exports from Côte d'Ivoire MUST be licensed through Conseil Café-Cacao. No export without their authorization."
      }), "cocoa" === e && "GH" === t && i.push({
        type: "warn",
        text: "All Ghanaian cocoa exports require COCOBOD authorization. Ghana is the world's 2nd largest cocoa producer — COCOBOD controls all exports."
      }), "coffee_tea" === e && "ET" === t && i.push({
        type: "warn",
        text: "Ethiopian coffee MUST be graded and certified through the Ethiopia Commodity Exchange (ECX) before export. This is mandatory, not optional."
      }), i.push({
        type: "tip",
        text: "Start document preparation 3–4 weeks before your shipment date. Phytosanitary and health certificates have limited validity windows — time them carefully."
      }), i) : i;
    }
  };
}();

"undefined" != typeof module && (module.exports = {
  ExportDocsEngine: ExportDocsEngine
});
