var CooEngine = function() {
  "use strict";
  function e(e) {
    return COO_TEMPLATES.templates[e] || null;
  }
  function t(e) {
    return COO_TEMPLATES.fieldLabels[e] || e.replace(/_/g, " ");
  }
  return {
    getTemplate: e,
    getAllTemplates: function() {
      return Object.keys(COO_TEMPLATES.templates).map(function(e) {
        var t = COO_TEMPLATES.templates[e];
        return {
          id: e,
          name: t.name,
          description: t.description,
          color: t.color,
          preferential: t.preferential,
          applicableFor: t.applicableFor
        };
      });
    },
    getApplicableTemplates: function(t, i) {
      var r = [ "standard" ], a = COO_TEMPLATES.templates;
      return a.afcfta && r.push("afcfta"), t && i && (a.ecowas && a.ecowas.memberStates && -1 !== a.ecowas.memberStates.indexOf(t) && -1 !== a.ecowas.memberStates.indexOf(i) && r.push("ecowas"),
      a.eac && a.eac.memberStates && -1 !== a.eac.memberStates.indexOf(t) && -1 !== a.eac.memberStates.indexOf(i) && r.push("eac"),
      a.sadc && a.sadc.memberStates && -1 !== a.sadc.memberStates.indexOf(t) && -1 !== a.sadc.memberStates.indexOf(i) && r.push("sadc"),
      a.comesa && a.comesa.memberStates && -1 !== a.comesa.memberStates.indexOf(t) && -1 !== a.comesa.memberStates.indexOf(i) && r.push("comesa")),
      r.map(function(t) {
        return e(t);
      }).filter(Boolean);
    },
    checkOriginCriteria: function(e) {
      var t = [], i = COO_TEMPLATES.templates.afcfta;
      if (!i) {
        return t;
      }
      if (e.hasWhollyObtained && t.push({
        criteria: "WO",
        qualifies: !0,
        label: i.originCriteria.WO.name,
        desc: i.originCriteria.WO.description
      }), e.hasCTH && t.push({
        criteria: "CTH",
        qualifies: !0,
        label: i.originCriteria.CTH.name,
        desc: i.originCriteria.CTH.description
      }), e.exWorksPrice && e.nonOriginatingMaterialsCost) {
        var r = (e.exWorksPrice - e.nonOriginatingMaterialsCost) / e.exWorksPrice * 100;
        t.push({
          criteria: "VA",
          qualifies: r >= 40,
          label: i.originCriteria.VA.name,
          desc: "Calculated value added: " + r.toFixed(1) + "% (minimum 40% required)",
          percentage: r.toFixed(1)
        });
      }
      return "SP" === e.processType && t.push({
        criteria: "SP",
        qualifies: !0,
        label: i.originCriteria.SP.name,
        desc: i.originCriteria.SP.description
      }), t;
    },
    generateFormData: function(i, r) {
      var a = e(i);
      if (!a) {
        return null;
      }
      var s = {
        templateId: i,
        templateName: a.name,
        fields: {},
        generatedAt: (new Date).toLocaleDateString("en-GB")
      };
      if (a.fields.forEach(function(e) {
        s.fields[e] = {
          label: t(e),
          value: r[e] || "",
          required: !0
        };
      }), "afcfta" === i && r.exporter_country) {
        var n = a.issuingAuthorities[r.exporter_country];
        s.issuingAuthority = n || a.issuingAuthority;
      } else {
        s.issuingAuthority = a.issuingAuthority;
      }
      return s;
    },
    getObservations: function(e, t, i) {
      var r = [], a = COO_TEMPLATES.templates[e];
      if (!a) {
        return r;
      }
      if ("afcfta" === e && (r.push({
        type: "info",
        text: "AfCFTA COO enables preferential tariff rates across 54 African countries. Category A products get up to 90% tariff reduction by 2030."
      }), t)) {
        var s = a.issuingAuthorities[t];
        s && r.push({
          type: "tip",
          text: "In " + t + ", AfCFTA Certificates of Origin are issued by: " + s
        });
      }
      return "ecowas" === e && r.push({
        type: "tip",
        text: "ECOWAS COO requires ETLS (Trade Liberalisation Scheme) approval for the manufacturer. Apply for ETLS approval before your first shipment."
      }), r.push({
        type: "tip",
        text: "The COO must be presented to destination customs BEFORE import duties are calculated to claim preferential rates. A post-arrival application may be refused."
      }), r;
    },
    getFieldLabel: t
  };
}();

"undefined" != typeof module && (module.exports = {
  CooEngine: CooEngine
});
