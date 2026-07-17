!function(e) {
  "use strict";
  var i = [ {
    id: "f1",
    pts: 8,
    label: "Incident within 3 months of policy start",
    category: "Timing"
  }, {
    id: "f2",
    pts: 5,
    label: "Weekend/holiday/unusual-hours incident",
    category: "Timing"
  }, {
    id: "f3",
    pts: 9,
    label: "Recent financial hardship",
    category: "Timing"
  }, {
    id: "f4",
    pts: 3,
    label: "Delayed reporting 48+ hours",
    category: "Timing"
  }, {
    id: "f5",
    pts: 6,
    label: "Claim >75% of policy limit",
    category: "Value"
  }, {
    id: "f6",
    pts: 10,
    label: "Claim-to-premium ratio >10:1",
    category: "Value"
  }, {
    id: "f7",
    pts: 9,
    label: "Suspicious/altered documents",
    category: "Value"
  }, {
    id: "f8",
    pts: 8,
    label: "2+ prior claims in 3 years",
    category: "History"
  }, {
    id: "f9",
    pts: 4,
    label: "Unusual claims process knowledge",
    category: "History"
  }, {
    id: "f10",
    pts: 7,
    label: "Resists independent assessment",
    category: "History"
  }, {
    id: "f11",
    pts: 6,
    label: "No independent witnesses",
    category: "Evidence"
  }, {
    id: "f12",
    pts: 5,
    label: "No CCTV in monitored area",
    category: "Evidence"
  }, {
    id: "f13",
    pts: 7,
    label: "Police report same day as claim",
    category: "Evidence"
  }, {
    id: "f14",
    pts: 10,
    label: "Third party known to claimant (staged accident)",
    category: "Evidence"
  } ], a = {
    NG: {
      channels: [ "NAICOM (National Insurance Commission): 07002432666 / complaint@naicom.gov.ng", "EFCC (Economic & Financial Crimes Commission): efccnigeria.org / 0800-CALL-EFCC", "Nigerian Insurers Association Fraud Desk: frauddesk@nigerianinsurers.com", "Nigeria Police Force (online complaints): policecomplaint.npf.gov.ng" ]
    },
    KE: {
      channels: [ "IRA Kenya (Insurance Regulatory Authority): 0800 724 444 (toll-free)", "Directorate of Criminal Investigations (DCI): dci.go.ke", "Kenya Insurers Fraud Desk: +254 20 2730598", "Kenya Revenue Authority (tax fraud): itax.kra.go.ke" ]
    },
    ZA: {
      channels: [ "FSCA (Financial Sector Conduct Authority): 0800 110 443 (toll-free)", "South African Insurance Crime Bureau (SAICB): 0860 101 333 / tipoffs@saicb.co.za", "SAPS (South African Police Service): 10111", "Ombud for Short-Term Insurance: 0860 726 890" ]
    },
    GH: {
      channels: [ "NIC Ghana (National Insurance Commission): 0302 663 677", "Ghana Police Service: 191", "Economic & Organised Crime Office (EOCO): +233 302 769 855", "Insurance fraud hotline: +233 302 238 866" ]
    },
    EG: {
      channels: [ "Egyptian Financial Regulatory Authority (FRA): 16900", "Insurance Federation of Egypt: +20 2 27602504", "Egypt Financial Intelligence Unit: +20 2 25750600", "Police financial crimes unit: 122" ]
    }
  };
  function n(e) {
    return {
      id: e.id,
      pts: e.pts,
      label: e.label,
      category: e.category
    };
  }
  function o(e) {
    return e < 35 ? {
      level: "Low Risk",
      badge: "Low",
      color: "#16a34a",
      className: "risk-low",
      recommendation: "Claim appears low risk. Proceed with the standard verification process."
    } : e < 65 ? {
      level: "Medium Risk - Investigate",
      badge: "Medium",
      color: "#d97706",
      className: "risk-medium",
      recommendation: "Elevated risk indicators are present. Request additional documentation, independent assessment, and prior-claim cross-checks before a decision."
    } : {
      level: "High Risk - Refer to SIU",
      badge: "High",
      color: "#dc2626",
      className: "risk-high",
      recommendation: "Multiple high-weight red flags are present. Refer to a Special Investigations Unit or qualified investigator before payment or accusation."
    };
  }
  e.AfroTools = e.AfroTools || {}, e.AfroTools.InsuranceFraudEngine = {
    flags: i.map(n),
    reporting: a,
    calculate: function(e) {
      var r = Object.assign({}, e.answers || {}), t = Number(e.premiumPaid) || 0, s = Number(e.claimAmount) || 0, c = e.country || "NG", l = t > 0 ? s / t : 0;
      l > 10 && (r.f6 = "yes");
      var d = i.reduce(function(e, i) {
        return e + i.pts;
      }, 0), u = 0, m = [], g = [];
      i.forEach(function(e) {
        var i = r[e.id] || "unk";
        "yes" === i ? (u += e.pts, m.push(n(e))) : "unk" === i && (u += Math.round(.3 * e.pts),
        g.push(n(e)));
      });
      var p = Math.round(u / d * 100), f = o(p);
      return {
        country: c,
        claimType: e.claimType || "",
        claimAmount: s,
        premiumPaid: t,
        claimRatio: l,
        score: u,
        maxScore: d,
        pct: p,
        level: f.level,
        badge: f.badge,
        levelColor: f.color,
        levelClass: f.className,
        recommendation: f.recommendation,
        triggered: m,
        warnings: g,
        reportingChannels: (a[c] || a.NG).channels.slice(),
        answers: r
      };
    },
    riskFromPct: o
  };
}(window);
