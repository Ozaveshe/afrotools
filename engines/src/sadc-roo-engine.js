var SadcRooEngine = function() {
  "use strict";
  var e = [ {
    code: "ZA",
    name: "South Africa",
    sacuMember: !0,
    flag: "🇿🇦"
  }, {
    code: "BW",
    name: "Botswana",
    sacuMember: !0,
    flag: "🇧🇼"
  }, {
    code: "LS",
    name: "Lesotho",
    sacuMember: !0,
    flag: "🇱🇸"
  }, {
    code: "NA",
    name: "Namibia",
    sacuMember: !0,
    flag: "🇳🇦"
  }, {
    code: "SZ",
    name: "Eswatini",
    sacuMember: !0,
    flag: "🇸🇿"
  }, {
    code: "MZ",
    name: "Mozambique",
    sacuMember: !1,
    flag: "🇲🇿"
  }, {
    code: "ZM",
    name: "Zambia",
    sacuMember: !1,
    flag: "🇿🇲"
  }, {
    code: "ZW",
    name: "Zimbabwe",
    sacuMember: !1,
    flag: "🇿🇼"
  }, {
    code: "MW",
    name: "Malawi",
    sacuMember: !1,
    flag: "🇲🇼"
  }, {
    code: "TZ",
    name: "Tanzania",
    sacuMember: !1,
    flag: "🇹🇿"
  }, {
    code: "AO",
    name: "Angola",
    sacuMember: !1,
    flag: "🇦🇴"
  }, {
    code: "CD",
    name: "DR Congo",
    sacuMember: !1,
    flag: "🇨🇩"
  }, {
    code: "MG",
    name: "Madagascar",
    sacuMember: !1,
    flag: "🇲🇬"
  }, {
    code: "MU",
    name: "Mauritius",
    sacuMember: !1,
    flag: "🇲🇺"
  }, {
    code: "SC",
    name: "Seychelles",
    sacuMember: !1,
    flag: "🇸🇨"
  }, {
    code: "KM",
    name: "Comoros",
    sacuMember: !1,
    flag: "🇰🇲"
  } ], i = {
    description: "Products qualify for SADC preferential treatment if:",
    criteria: [ {
      label: "Wholly Obtained (WO)",
      detail: "Minerals, agriculture, fish and products manufactured entirely from SADC materials."
    }, {
      label: "Value Added (VA) Rule",
      detail: "Maximum 65% of ex-works price from non-SADC materials (i.e., minimum 35% SADC value added)."
    }, {
      label: "Change of Tariff Heading (CTH)",
      detail: "Materials from outside SADC change to a different 4-digit HS heading after processing."
    }, {
      label: "Sufficient Transformation",
      detail: "Processing must be beyond simple operations (mixing, packing, labelling, assembly without change of heading)."
    } ]
  }, a = [ {
    id: "animals",
    hsRange: "01–05",
    hsMin: 1,
    hsMax: 5,
    rule: "WO",
    ruleLabel: "Wholly Obtained",
    description: "Live animals & animal products"
  }, {
    id: "vegetal",
    hsRange: "06–14",
    hsMin: 6,
    hsMax: 14,
    rule: "WO",
    ruleLabel: "Wholly Obtained",
    description: "Vegetable products"
  }, {
    id: "fats",
    hsRange: "15",
    hsMin: 15,
    hsMax: 15,
    rule: "CTH or VA35",
    ruleLabel: "CTH or 35% Value Added",
    description: "Animal/vegetable fats and oils"
  }, {
    id: "food",
    hsRange: "16–24",
    hsMin: 16,
    hsMax: 24,
    rule: "CTH_VA65",
    ruleLabel: "CTH + max 65% non-originating inputs",
    description: "Prepared foods, beverages, tobacco"
  }, {
    id: "minerals",
    hsRange: "25–27",
    hsMin: 25,
    hsMax: 27,
    rule: "WO or CTH",
    ruleLabel: "Wholly Obtained or CTH",
    description: "Mineral products, fuels"
  }, {
    id: "chemicals",
    hsRange: "28–38",
    hsMin: 28,
    hsMax: 38,
    rule: "CTH",
    ruleLabel: "Change of Tariff Heading (4-digit)",
    description: "Chemicals and allied products"
  }, {
    id: "plastics",
    hsRange: "39–40",
    hsMin: 39,
    hsMax: 40,
    rule: "CTH_VA65",
    ruleLabel: "CTH + max 65% non-originating inputs",
    description: "Plastics and rubber"
  }, {
    id: "textiles",
    hsRange: "50–63",
    hsMin: 50,
    hsMax: 63,
    rule: "FABRIC_FWD",
    ruleLabel: "Fabric Forward (weaving + finishing in SADC)",
    description: "Textiles and clothing — STRICT rules"
  }, {
    id: "metals",
    hsRange: "72–83",
    hsMin: 72,
    hsMax: 83,
    rule: "CTH or VA35",
    ruleLabel: "CTH or 35% Value Added",
    description: "Base metals and articles"
  }, {
    id: "machinery",
    hsRange: "84–85",
    hsMin: 84,
    hsMax: 85,
    rule: "CTH_VA60",
    ruleLabel: "CTH or max 60% non-originating inputs",
    description: "Machinery and electrical equipment"
  }, {
    id: "vehicles",
    hsRange: "87",
    hsMin: 87,
    hsMax: 87,
    rule: "VA60_ASSEMBLY",
    ruleLabel: "Max 60% non-originating + assembly requirements",
    description: "Vehicles — very specific rules apply"
  } ], r = [ {
    doc: "SADC Certificate of Origin (EUR.1 format)",
    required: !0,
    note: "Issued by authorised body in exporting country"
  }, {
    doc: "Invoice with origin declaration",
    required: !0,
    note: "Must state country of origin and HS code"
  }, {
    doc: "Proof of manufacturing process",
    required: !0,
    note: "Process description, BOM, factory audit if requested"
  }, {
    doc: "Material cost breakdown (VA calculation)",
    required: !0,
    note: "Shows split of SADC vs non-SADC material costs"
  }, {
    doc: "Supplier declarations for non-SADC inputs",
    required: !1,
    note: "Needed if questioned at customs or for VA verification"
  } ];
  function t(e) {
    var i = parseInt(e);
    return a.find(function(e) {
      return i >= e.hsMin && i <= e.hsMax;
    }) || null;
  }
  return {
    checkOrigin: function(i) {
      var a = parseInt(i.hsChapter) || 0, r = (i.exportCountry || "").toUpperCase(), n = (i.importCountry || "").toUpperCase(), o = parseFloat(i.exWorksPrice) || 0, s = parseFloat(i.nonSadcCost) || 0, l = !0 === i.hasFabricFwd, u = !0 === i.hasCTH, c = !0 === i.whollyObtained, d = e.find(function(e) {
        return e.code === r;
      }), m = e.find(function(e) {
        return e.code === n;
      }), f = !!d, h = !!m, p = t(a), g = {
        hsChapter: a,
        exportCountry: r,
        importCountry: n,
        rule: p,
        isMember: f,
        isDestMember: h,
        checks: [],
        eligible: !1
      };
      if (!f) {
        return g.checks.push({
          label: "Exporting country",
          pass: !1,
          detail: r + " is not a SADC member state — no preferential access."
        }), g.eligible = !1, g;
      }
      if (g.checks.push({
        label: "Exporting country",
        pass: !0,
        detail: (d.flag || "") + " " + d.name + " is a SADC member state ✅"
      }), !h) {
        return g.checks.push({
          label: "Importing country",
          pass: !1,
          detail: n + " is not a SADC member — SADC preferential rate does not apply."
        }), g.eligible = !1, g;
      }
      if (g.checks.push({
        label: "Importing country",
        pass: !0,
        detail: (m.flag || "") + " " + m.name + " is a SADC member state ✅"
      }), !p) {
        return g.checks.push({
          label: "HS Chapter rule",
          pass: !1,
          detail: "Chapter " + a + " not found. Check your HS code."
        }), g.eligible = !1, g;
      }
      g.checks.push({
        label: "Applicable rule",
        pass: !0,
        detail: "HS " + p.hsRange + ": " + p.ruleLabel
      });
      var A = o > 0 ? s / o * 100 : 0, C = 100 - A;
      g.nonSadcPct = A.toFixed(1), g.sadcVA = C.toFixed(1);
      var b = !1, M = "";
      return "WO" === p.rule ? (b = c, M = c ? "✅ Wholly obtained in SADC — qualifies." : "❌ Must be wholly obtained. No non-SADC materials permitted for this HS range.") : "CTH" === p.rule || "WO or CTH" === p.rule ? M = (b = c || u) ? "✅ CTH or wholly obtained satisfied." : "❌ Non-SADC materials must change tariff heading (4-digit) after processing in SADC." : "CTH or VA35" === p.rule ? M = (b = u || C >= 35 || c) ? "✅ CTH or 35% VA satisfied (SADC VA: " + C.toFixed(1) + "%)." : "❌ Need CTH or at least 35% SADC value added (currently " + C.toFixed(1) + "%)." : "CTH_VA65" === p.rule ? M = (b = u && A <= 65) ? "✅ CTH + VA requirement met (non-SADC: " + A.toFixed(1) + "% ≤ 65%)." : "❌ Need CTH AND non-SADC inputs ≤ 65% (currently " + A.toFixed(1) + "%)." : "CTH_VA60" === p.rule || "VA60_ASSEMBLY" === p.rule ? (M = (b = A <= 60 && (u || "VA60_ASSEMBLY" === p.rule)) ? "✅ VA requirement met (non-SADC: " + A.toFixed(1) + "% ≤ 60%)." : "❌ Non-SADC inputs must not exceed 60% of ex-works price (currently " + A.toFixed(1) + "%).",
      "VA60_ASSEMBLY" === p.rule && (M += " Note: Vehicle-specific assembly requirements also apply.")) : "FABRIC_FWD" === p.rule && (b = l,
      M = l ? "✅ Fabric forward requirement met — weaving and finishing done in SADC." : "❌ Textiles require fabric-forward processing: yarn must be woven AND finished in SADC. Imported fabric does not qualify."),
      g.checks.push({
        label: "Origin rule check",
        pass: b,
        detail: M
      }), g.eligible = b, g.certificate = b ? {
        form: "SADC Certificate of Origin (EUR.1 format)",
        issuingAuthority: {
          ZA: "International Trade Administration Commission (ITAC)",
          BW: "Botswana Unified Revenue Service (BURS)",
          MZ: "Instituto de Promoção de Exportações (IPEX)",
          ZM: "Zambia Revenue Authority (ZRA)",
          ZW: "Zimbabwe Revenue Authority (ZIMRA)",
          TZ: "Tanzania Revenue Authority (TRA)",
          MU: "Mauritius Revenue Authority",
          MW: "Malawi Revenue Authority (MRA)"
        }[r] || "National Customs / Trade Authority",
        validity: "10 months from date of issue",
        copies: "4 copies (original + 3)",
        notes: "Apply BEFORE shipment. Certificate must accompany goods. Retrospective certificates only in exceptional circumstances."
      } : null, g.observations = function(e, i) {
        var a = [];
        return i.eligible ? (a.push("✅ This product qualifies for SADC preferential tariff rates. Present the SADC Certificate of Origin (EUR.1) at destination customs."),
        a.push("💡 Cumulation: Under SADC full cumulation, materials and processing from ANY SADC member state count as originating — you can split production across SADC countries.")) : a.push("❌ This product does not currently meet SADC rules of origin. Consider: (a) sourcing more inputs from SADC, or (b) increasing value-added processing within SADC."),
        e && "textiles" === e.id && a.push('👗 Textiles note: The "fabric forward" rule is strict. Even if you sew in SADC, if the fabric was imported from outside SADC, it may not qualify. Key exception: Lesotho, Eswatini, and Mauritius have benefited from AGOA cumulation for textiles.'),
        e && "vehicles" === e.id && a.push("🚗 Vehicles: South Africa's automotive sector benefits from the SADC FTA but specific assembly content requirements apply per vehicle type. Consult ITAC for product-specific advice."),
        a.push("📋 SADC-COMESA-EAC Tripartite FTA: Some diagonal cumulation provisions allow combining production across SADC, COMESA and EAC member states — expanding origin options further."),
        a;
      }(p, g), g;
    },
    getProductRule: t,
    getMemberStates: function() {
      return e;
    },
    getGeneralRule: function() {
      return i;
    },
    getProductRules: function() {
      return a;
    },
    getDocumentation: function() {
      return r;
    }
  };
}();
