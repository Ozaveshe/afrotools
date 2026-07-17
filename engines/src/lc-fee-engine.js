var LcFeeEngine = function() {
  "use strict";
  var e = {
    NG: {
      issuanceRate: 1.5,
      confirmationRate: 2,
      marginRequirement: 100,
      notes: "CBN Form M required. 100% cash cover often required by Nigerian banks. LC must be domiciled at CBN-authorised dealer bank. Very high cost.",
      currency: "NGN",
      flag: "🇳🇬"
    },
    KE: {
      issuanceRate: 1.5,
      confirmationRate: 1.5,
      marginRequirement: 10,
      notes: "KRA may require pre-shipment inspection certificate (PVoC). Reasonable margin requirements.",
      currency: "KES",
      flag: "🇰🇪"
    },
    ZA: {
      issuanceRate: 1,
      confirmationRate: 1,
      marginRequirement: 10,
      notes: "SARB regulations apply. Forward cover available for FX risk management. Most sophisticated LC environment in Africa.",
      currency: "ZAR",
      flag: "🇿🇦"
    },
    GH: {
      issuanceRate: 2,
      confirmationRate: 2,
      marginRequirement: 30,
      notes: "Bank of Ghana regulations. Destination inspection often required. Higher issuance rates than East/Southern Africa.",
      currency: "GHS",
      flag: "🇬🇭"
    },
    EG: {
      issuanceRate: 1.5,
      confirmationRate: 1.5,
      marginRequirement: 20,
      notes: "Must be opened at authorised bank. Priority banking available for essential imports. USD scarcity may affect availability.",
      currency: "EGP",
      flag: "🇪🇬"
    },
    TZ: {
      issuanceRate: 1.5,
      confirmationRate: 1.5,
      marginRequirement: 15,
      notes: "BOT regulations. LC processing reasonable in Dar es Salaam. EAC corridors straightforward.",
      currency: "TZS",
      flag: "🇹🇿"
    },
    UG: {
      issuanceRate: 1.5,
      confirmationRate: 1.8,
      marginRequirement: 20,
      notes: "BOU regulations. Landlocked — add transit document costs.",
      currency: "UGX",
      flag: "🇺🇬"
    },
    RW: {
      issuanceRate: 1.2,
      confirmationRate: 1.5,
      marginRequirement: 10,
      notes: "BNR regulations. Rwanda improving LC efficiency. Low margin requirements reflect improving risk environment.",
      currency: "RWF",
      flag: "🇷🇼"
    },
    MA: {
      issuanceRate: 1,
      confirmationRate: 1,
      marginRequirement: 10,
      notes: "BAM regulations. Most efficient North African LC environment. Morocco-EU FTA simplifies many transactions.",
      currency: "MAD",
      flag: "🇲🇦"
    },
    TN: {
      issuanceRate: 1.2,
      confirmationRate: 1.2,
      marginRequirement: 15,
      notes: "BCT regulations. Offshore companies have simplified procedures.",
      currency: "TND",
      flag: "🇹🇳"
    },
    CI: {
      issuanceRate: 1.5,
      confirmationRate: 1.8,
      marginRequirement: 20,
      notes: "BCEAO zone. WAEMU regulations. Regional LC market through BCEAO.",
      currency: "XOF",
      flag: "🇨🇮"
    },
    SN: {
      issuanceRate: 1.5,
      confirmationRate: 1.8,
      marginRequirement: 20,
      notes: "BCEAO zone. Same WAEMU framework as Côte d'Ivoire.",
      currency: "XOF",
      flag: "🇸🇳"
    },
    CM: {
      issuanceRate: 1.5,
      confirmationRate: 2,
      marginRequirement: 25,
      notes: "BEAC zone (Central Africa). Higher margin requirements. Douala banking concentrated.",
      currency: "XAF",
      flag: "🇨🇲"
    },
    ET: {
      issuanceRate: 1.5,
      confirmationRate: 2,
      marginRequirement: 100,
      notes: "NBE regulations. National Bank controls FX tightly. Similar to Nigeria in terms of margin requirements. LC often mandatory for imports >$50,000.",
      currency: "ETB",
      flag: "🇪🇹"
    },
    AO: {
      issuanceRate: 2,
      confirmationRate: 2.5,
      marginRequirement: 30,
      notes: "BNA regulations. Oil-dominated economy. FX access difficult for non-oil sectors.",
      currency: "AOA",
      flag: "🇦🇴"
    }
  }, t = {
    sight: {
      label: "Sight LC",
      description: "Payment on presentation of documents",
      tenorCostRate: 0,
      tenorDays: 0
    },
    usance30: {
      label: "Usance 30 days",
      description: "Payment 30 days after sight",
      tenorCostRate: .5,
      tenorDays: 30
    },
    usance60: {
      label: "Usance 60 days",
      description: "Payment 60 days after sight",
      tenorCostRate: 1,
      tenorDays: 60
    },
    usance90: {
      label: "Usance 90 days",
      description: "Payment 90 days after sight",
      tenorCostRate: 1.5,
      tenorDays: 90
    },
    usance120: {
      label: "Usance 120 days",
      description: "Payment 120 days after sight",
      tenorCostRate: 2,
      tenorDays: 120
    },
    usance180: {
      label: "Usance 180 days",
      description: "Payment 180 days after sight",
      tenorCostRate: 3,
      tenorDays: 180
    },
    standby: {
      label: "Standby LC",
      description: "Standby LC (guarantee)",
      tenorCostRate: 1,
      tenorDays: 90
    },
    revolving: {
      label: "Revolving LC",
      description: "Revolving LC (multiple drawings)",
      tenorCostRate: 2,
      tenorDays: 365
    },
    transferable: {
      label: "Transferable LC",
      description: "Transferable LC (broker trade)",
      tenorCostRate: .5,
      tenorDays: 30
    }
  };
  function n(e) {
    return "$" + Math.round(e).toLocaleString();
  }
  return {
    calculate: function(n) {
      var a = parseFloat(n.lcValue) || 0;
      if (a <= 0) {
        return null;
      }
      var r = e[n.countryCode] || e.KE, i = t[n.lcType] || t.sight, o = Math.max(a * r.issuanceRate / 100, 200), s = n.confirmed ? Math.max(a * r.confirmationRate / 100, 300) : 0, c = Math.max(.5 * a / 100, 100), l = Math.max(.2 * a / 100, 75), u = a * i.tenorCostRate / 100, m = 100 * (parseInt(n.amendments) || 0), f = n.includeMargin ? a * r.marginRequirement / 100 : 0, d = o + s + c + l + 150 + 100 + u + m, g = (d / a * 100).toFixed(2), y = d + f, p = a + d;
      return {
        lcValue: a,
        countryCode: n.countryCode,
        lcType: n.lcType,
        confirmed: n.confirmed,
        lcTypeLabel: i.label,
        lcTypeDesc: i.description,
        tenorDays: i.tenorDays,
        breakdown: [ {
          id: "issuance",
          label: "LC Issuance Fee (" + r.issuanceRate + "%)",
          amount: o,
          basis: "LC Value",
          note: "Min $200"
        }, {
          id: "confirmation",
          label: "Confirmation Fee (" + r.confirmationRate + "%)",
          amount: s,
          basis: "LC Value",
          note: n.confirmed ? "" : "Not applicable (unconfirmed LC)"
        }, {
          id: "negotiation",
          label: "Document Negotiation Fee (0.5%)",
          amount: c,
          basis: "LC Value",
          note: "Min $100"
        }, {
          id: "advising",
          label: "Advising Bank Fee (0.2%)",
          amount: l,
          basis: "LC Value",
          note: "Min $75"
        }, {
          id: "swift",
          label: "SWIFT Message Charges",
          amount: 150,
          basis: "Flat",
          note: "3 SWIFT messages"
        }, {
          id: "courier",
          label: "Document Courier",
          amount: 100,
          basis: "Flat",
          note: "Courier to issuing bank"
        }, {
          id: "tenor",
          label: "Tenor / Usance Cost (" + i.tenorCostRate + "%)",
          amount: u,
          basis: "LC Value",
          note: i.tenorDays ? i.tenorDays + " days" : "N/A for sight LC"
        }, {
          id: "amendments",
          label: "Amendments (" + (parseInt(n.amendments) || 0) + " × $100)",
          amount: m,
          basis: "Flat per amendment",
          note: ""
        } ],
        totalFees: d,
        feePercentage: g,
        marginDeposit: f,
        marginNote: "Deposit (returned when LC settled) — " + r.marginRequirement + "% requirement",
        totalCashRequired: y,
        effectiveCostOfGoods: p,
        countryNotes: r.notes
      };
    },
    comparePaymentMethods: function(e) {
      if (!e) {
        return [];
      }
      var t = e.lcValue;
      return [ {
        method: "lc",
        label: "Letter of Credit",
        sellerProtection: 5,
        buyerProtection: 5,
        cost: e.totalFees,
        costPct: e.feePercentage,
        riskLabel: "Low",
        desc: "Bank guarantee — safest for both parties. Banks verify documents."
      }, {
        method: "cad",
        label: "CAD / D/P (Documents Against Payment)",
        sellerProtection: 3,
        buyerProtection: 3,
        cost: .003 * t,
        costPct: "0.3",
        riskLabel: "Medium",
        desc: "Bank releases documents only against payment. No bank guarantee — just document control."
      }, {
        method: "tt_balance",
        label: "T/T 30% + 70% BL",
        sellerProtection: 4,
        buyerProtection: 2,
        cost: .001 * t,
        costPct: "0.1",
        riskLabel: "Medium",
        desc: "Deposit + balance on B/L copy. Common for trusted suppliers. Some risk."
      }, {
        method: "open_account",
        label: "Open Account",
        sellerProtection: 1,
        buyerProtection: 5,
        cost: 0,
        costPct: "0",
        riskLabel: "High (seller)",
        desc: "Seller ships, buyer pays later. Lowest cost but maximum seller risk. Only for established relationships."
      } ];
    },
    getObservations: function(e) {
      if (!e) {
        return [];
      }
      var a = [];
      return parseFloat(e.feePercentage) > 5 && a.push({
        type: "warn",
        text: "LC fees of " + e.feePercentage + "% are above average for Africa. Consider reducing by: using an unconfirmed LC if supplier is reputable, or negotiating fewer SWIFT messages."
      }), "NG" !== e.countryCode && "ET" !== e.countryCode || a.push({
        type: "warn",
        text: "This country often requires 100% cash margin deposit — tying up " + n(e.marginDeposit) + " until the LC is settled. Factor into your working capital plan."
      }), e.lcType && e.lcType.includes("usance") && a.push({
        type: "info",
        text: "A " + e.lcTypeLabel + " provides " + e.tenorDays + " days payment deferment — useful for cash flow, but the tenor cost adds " + n(t[e.lcType] ? e.lcValue * t[e.lcType].tenorCostRate / 100 : 0) + " to your costs."
      }), !e.confirmed && e.lcValue > 1e5 && a.push({
        type: "tip",
        text: "For LCs over $100,000, consider getting the LC confirmed by a top-tier bank to reduce payment risk, especially if the issuing bank is in a high-risk country."
      }), a.push({
        type: "info",
        text: "A Standby LC is a cheaper alternative for established supplier relationships — costs ~1% vs full LC fees of " + e.feePercentage + "%."
      }), a;
    },
    getAllCountries: function() {
      return Object.keys(e).map(function(t) {
        return {
          code: t,
          name: t,
          flag: e[t].flag,
          marginRequirement: e[t].marginRequirement
        };
      });
    },
    getLcTypes: function() {
      return t;
    },
    getBankCharges: function(t) {
      return e[t] || null;
    }
  };
}();

"undefined" != typeof module && (module.exports = {
  LcFeeEngine: LcFeeEngine
});
