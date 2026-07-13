var EcowasLevyEngine = function() {
  "use strict";
  var e = [ {
    band: 0,
    rate: 0,
    label: "Band 0 — Essential Goods",
    description: "Essential social goods",
    examples: "Essential medicines, medical equipment, textbooks, agricultural inputs (seeds, fertilisers)"
  }, {
    band: 1,
    rate: 5,
    label: "Band 1 — Raw Materials",
    description: "Raw materials, capital goods, equipment",
    examples: "Raw materials, industrial machinery, spare parts, IT equipment"
  }, {
    band: 2,
    rate: 10,
    label: "Band 2 — Intermediate",
    description: "Intermediate goods",
    examples: "Semi-processed inputs, construction materials (cement, iron rods), chemicals"
  }, {
    band: 3,
    rate: 20,
    label: "Band 3 — Consumer Goods",
    description: "Consumer goods",
    examples: "Finished consumer products, electronics, clothing, furniture, vehicles"
  }, {
    band: 4,
    rate: 35,
    label: "Band 4 — Special Dev.",
    description: "Specific goods for economic development",
    examples: "Frozen poultry, rice, sugar, tomato paste, vegetable oils"
  } ], a = {
    NG: {
      name: "Nigeria",
      flag: "🇳🇬",
      extras: [ {
        name: "CISS",
        rate: 1,
        base: "fob",
        description: "Comprehensive Import Supervision Scheme"
      }, {
        name: "ETLS",
        rate: .5,
        base: "cif",
        description: "ECOWAS Trade Liberalisation Scheme levy"
      }, {
        name: "Surcharge",
        rate: 7,
        base: "duty",
        description: "7% surcharge on customs duty"
      }, {
        name: "VAT",
        rate: 7.5,
        base: "cif_duty_levy",
        description: "Value Added Tax"
      } ],
      specialRates: {
        1006: {
          rate: 50,
          notes: "Rice — supplementary protection above CET Band 4"
        },
        8703: {
          rate: 35,
          notes: "Vehicles — additional NAC levy applies"
        },
        2523: {
          rate: 45,
          notes: "Cement — import ban or prohibitive tariff"
        }
      }
    },
    GH: {
      name: "Ghana",
      flag: "🇬🇭",
      extras: [ {
        name: "NHIL",
        rate: 2.5,
        base: "cif_duty",
        description: "National Health Insurance Levy"
      }, {
        name: "GETFund",
        rate: 2.5,
        base: "cif_duty",
        description: "Ghana Education Trust Fund Levy"
      }, {
        name: "AU Levy",
        rate: .2,
        base: "cif",
        description: "African Union levy"
      }, {
        name: "Processing",
        rate: 2,
        base: "cif",
        description: "Examination / processing fee"
      }, {
        name: "VAT",
        rate: 15,
        base: "cif_duty_levy",
        description: "Value Added Tax"
      } ],
      specialRates: {}
    },
    CI: {
      name: "Côte d'Ivoire",
      flag: "🇨🇮",
      extras: [ {
        name: "PCS",
        rate: .75,
        base: "cif",
        description: "Port & Customs Stamp"
      }, {
        name: "Redevance Statistique",
        rate: 1,
        base: "cif",
        description: "Statistical fee"
      }, {
        name: "TVA",
        rate: 18,
        base: "cif_duty_levy",
        description: "Value Added Tax (TVA)"
      } ],
      specialRates: {}
    },
    SN: {
      name: "Senegal",
      flag: "🇸🇳",
      extras: [ {
        name: "Redevance Statistique",
        rate: 1,
        base: "cif",
        description: "Statistical fee"
      }, {
        name: "TVA",
        rate: 18,
        base: "cif_duty_levy",
        description: "Value Added Tax (TVA)"
      }, {
        name: "COSEC",
        rate: .2,
        base: "cif",
        description: "Conseil Sénégalais des Chargeurs"
      } ],
      specialRates: {}
    }
  }, t = [ "BJ", "BF", "CV", "CI", "GM", "GH", "GN", "GW", "LR", "ML", "NE", "NG", "SN", "SL", "TG" ], i = {
    BJ: "Benin",
    BF: "Burkina Faso",
    CV: "Cabo Verde",
    CI: "Côte d'Ivoire",
    GM: "The Gambia",
    GH: "Ghana",
    GN: "Guinea",
    GW: "Guinea-Bissau",
    LR: "Liberia",
    ML: "Mali",
    NE: "Niger",
    NG: "Nigeria",
    SN: "Senegal",
    SL: "Sierra Leone",
    TG: "Togo"
  };
  return {
    calculate: function(t) {
      var i = parseFloat(t.cifValue) || 0, s = parseFloat(t.fobValue) || .95 * i, r = parseInt(t.cetBand), n = t.countryCode || "NG", o = (t.hsCode || "").replace(/\./g, "").substring(0, 4), c = !0 === t.isEtls;
      (isNaN(r) || r < 0 || r > 4) && (r = 3);
      var l = {
        cifValue: i,
        fobValue: s,
        cetBand: r,
        countryCode: n,
        breakdown: []
      }, d = a[n], u = null;
      o && d && d.specialRates && d.specialRates[o] && (u = d.specialRates[o]);
      var p = c ? 0 : u ? u.rate : e[r].rate, m = i * (p / 100);
      l.breakdown.push({
        label: c ? "CET Duty (ETLS — WAIVED)" : "CET Duty (Band " + r + " — " + p + "%)",
        amount: m,
        rate: p,
        base: "CIF",
        highlight: !0
      }), u && (l.specialRateNote = u.notes);
      var f = .005 * i;
      l.breakdown.push({
        label: "ECOWAS Community Levy (0.5%)",
        amount: f,
        rate: .5,
        base: "CIF"
      });
      var b = .01 * i;
      l.breakdown.push({
        label: "Statistical Fee (1.0%)",
        amount: b,
        rate: 1,
        base: "CIF"
      });
      var h = m + f + b;
      l.subTotal = h;
      var C, g = 0;
      return d && d.extras.forEach(function(e) {
        var a = 0;
        "fob" === e.base ? a = s : "cif" === e.base ? a = i : "duty" === e.base ? a = m : "cif_duty" === e.base ? a = i + m : "cif_duty_levy" === e.base && (a = i + h);
        var t = a * (e.rate / 100);
        g += t, l.breakdown.push({
          label: e.name + " (" + e.rate + "%) — " + e.description,
          amount: t,
          rate: e.rate,
          base: e.base.toUpperCase().replace(/_/g, "+")
        });
      }), l.countryExtras = g, l.totalCharges = h + g, l.totalLandedCost = i + l.totalCharges,
      l.effectiveRate = (C = l.totalCharges / i * 100, Number(C).toFixed(2)), l.isEtls = c,
      l.observations = function(e, a, t) {
        var i = [];
        return t && i.push("🌍 ETLS exemption applied — this product from an ECOWAS member state circulates duty-free. Ensure your ECOWAS Certificate of Origin is presented at customs."),
        4 === e && i.push('⚠️ Band 4 goods (35%) are "sensitive products" — items like rice, poultry, and sugar that compete with local production. Some countries impose additional protection.'),
        0 === e && i.push("💊 Band 0 (0%) covers essential social goods. Verify your HS code classification — wrong classification can result in re-assessment at higher duty."),
        "NG" === a && (i.push("🇳🇬 Nigeria: Beyond CET, check for import prohibition list. Some goods require NAFDAC, SON, or other pre-clearance approvals before shipment."),
        i.push("💰 Nigeria's effective tax burden on imports is among the highest in ECOWAS when CISS + Surcharge + VAT are combined.")),
        "GH" === a && i.push("🇬🇭 Ghana: NHIL and GETFund levies (2.5% each) significantly increase cost on consumer goods beyond the headline CET rate."),
        "CI" !== a && "SN" !== a || i.push("🇫🇷 CFA zone countries (CI, SN): TVA rate is 18% — higher than Nigeria's 7.5% VAT. Factor this into landed cost calculations."),
        i.push("📦 All calculations are indicative. Actual duties may vary based on precise HS code classification and customs officer discretion. Always confirm with a licensed customs broker."),
        i;
      }(r, n, c), l;
    },
    checkEtls: function(e) {
      var a = e.originCountry || "", i = t.includes(a.toUpperCase()), s = (parseFloat(e.localValuePct) || 0) >= 30, r = !0 === e.hasCOO, n = !0 === e.hasCTH, o = i && (r || n) && s;
      return {
        eligible: o,
        isMember: i,
        meetsVA: s,
        hasCOO: r,
        hasCTH: n,
        notes: o ? "✅ Product qualifies for ETLS — zero CET duty applies. Levies (CL, Statistical Fee) still apply." : "❌ Product does not qualify for ETLS. Standard CET duty applies. Check: ECOWAS membership, COO certificate, and 30% local value added.",
        requirements: [ i ? "✅ Origin country is ECOWAS member" : "❌ Origin country is not an ECOWAS member", r ? "✅ ECOWAS Certificate of Origin held" : "❌ Certificate of Origin required", s ? "✅ Local value added ≥ 30%" : "❌ Local value added < 30% (minimum required)" ]
      };
    },
    getTariffBands: function() {
      return e;
    },
    getMemberStates: function() {
      return t.map(function(e) {
        return {
          code: e,
          name: i[e]
        };
      });
    },
    getCountrySupplements: function(e) {
      return a[e] || null;
    },
    getSupportedCountries: function() {
      return Object.keys(a).map(function(e) {
        return {
          code: e,
          name: a[e].name,
          flag: a[e].flag
        };
      });
    }
  };
}();
