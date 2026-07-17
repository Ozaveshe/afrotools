!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var e = {
    NG: {
      name: "Nigeria",
      currency: "NGN",
      symbol: "₦",
      flag: "🇳🇬",
      region: "West Africa",
      defaults: {
        basic: 5e5,
        housing: 1e5,
        transport: 5e4
      }
    },
    GH: {
      name: "Ghana",
      currency: "GHS",
      symbol: "GH₵",
      flag: "🇬🇭",
      region: "West Africa",
      defaults: {
        basic: 4e3,
        housing: 800,
        transport: 400
      }
    },
    SN: {
      name: "Senegal",
      currency: "XOF",
      symbol: "FCFA",
      flag: "🇸🇳",
      region: "West Africa",
      defaults: {
        basic: 3e5,
        housing: 6e4,
        transport: 3e4
      }
    },
    CI: {
      name: "Côte d'Ivoire",
      currency: "XOF",
      symbol: "FCFA",
      flag: "🇨🇮",
      region: "West Africa",
      defaults: {
        basic: 3e5,
        housing: 6e4,
        transport: 3e4
      }
    },
    ML: {
      name: "Mali",
      currency: "XOF",
      symbol: "FCFA",
      flag: "🇲🇱",
      region: "West Africa",
      defaults: {
        basic: 15e4,
        housing: 3e4,
        transport: 15e3
      }
    },
    BF: {
      name: "Burkina Faso",
      currency: "XOF",
      symbol: "FCFA",
      flag: "🇧🇫",
      region: "West Africa",
      defaults: {
        basic: 15e4,
        housing: 3e4,
        transport: 15e3
      }
    },
    NE: {
      name: "Niger",
      currency: "XOF",
      symbol: "FCFA",
      flag: "🇳🇪",
      region: "West Africa",
      defaults: {
        basic: 15e4,
        housing: 3e4,
        transport: 15e3
      }
    },
    GN: {
      name: "Guinea",
      currency: "GNF",
      symbol: "GNF",
      flag: "🇬🇳",
      region: "West Africa",
      defaults: {
        basic: 2e6,
        housing: 4e5,
        transport: 2e5
      }
    },
    TG: {
      name: "Togo",
      currency: "XOF",
      symbol: "FCFA",
      flag: "🇹🇬",
      region: "West Africa",
      defaults: {
        basic: 2e5,
        housing: 4e4,
        transport: 2e4
      }
    },
    BJ: {
      name: "Benin",
      currency: "XOF",
      symbol: "FCFA",
      flag: "🇧🇯",
      region: "West Africa",
      defaults: {
        basic: 15e4,
        housing: 3e4,
        transport: 15e3
      }
    },
    SL: {
      name: "Sierra Leone",
      currency: "SLE",
      symbol: "NLe",
      flag: "🇸🇱",
      region: "West Africa",
      defaults: {
        basic: 2e6,
        housing: 4e5,
        transport: 2e5
      }
    },
    LR: {
      name: "Liberia",
      currency: "LRD",
      symbol: "L$",
      flag: "🇱🇷",
      region: "West Africa",
      defaults: {
        basic: 3e4,
        housing: 6e3,
        transport: 3e3
      }
    },
    GM: {
      name: "Gambia",
      currency: "GMD",
      symbol: "D",
      flag: "🇬🇲",
      region: "West Africa",
      defaults: {
        basic: 3e4,
        housing: 6e3,
        transport: 3e3
      }
    },
    GW: {
      name: "Guinea-Bissau",
      currency: "XOF",
      symbol: "FCFA",
      flag: "🇬🇼",
      region: "West Africa",
      defaults: {
        basic: 15e4,
        housing: 3e4,
        transport: 15e3
      }
    },
    CV: {
      name: "Cabo Verde",
      currency: "CVE",
      symbol: "Esc",
      flag: "🇨🇻",
      region: "West Africa",
      defaults: {
        basic: 5e4,
        housing: 1e4,
        transport: 5e3
      }
    },
    MR: {
      name: "Mauritania",
      currency: "MRU",
      symbol: "MRU",
      flag: "🇲🇷",
      region: "West Africa",
      defaults: {
        basic: 5e4,
        housing: 1e4,
        transport: 5e3
      }
    },
    ST: {
      name: "São Tomé & Príncipe",
      currency: "STN",
      symbol: "Db",
      flag: "🇸🇹",
      region: "West Africa",
      defaults: {
        basic: 1e4,
        housing: 2e3,
        transport: 1e3
      }
    },
    KE: {
      name: "Kenya",
      currency: "KES",
      symbol: "KES",
      flag: "🇰🇪",
      region: "East Africa",
      defaults: {
        basic: 8e4,
        housing: 2e4,
        transport: 1e4
      }
    },
    ET: {
      name: "Ethiopia",
      currency: "ETB",
      symbol: "ETB",
      flag: "🇪🇹",
      region: "East Africa",
      defaults: {
        basic: 8e3,
        housing: 2e3,
        transport: 1e3
      }
    },
    UG: {
      name: "Uganda",
      currency: "UGX",
      symbol: "USh",
      flag: "🇺🇬",
      region: "East Africa",
      defaults: {
        basic: 18e5,
        housing: 4e5,
        transport: 2e5
      }
    },
    TZ: {
      name: "Tanzania",
      currency: "TZS",
      symbol: "TSh",
      flag: "🇹🇿",
      region: "East Africa",
      defaults: {
        basic: 12e5,
        housing: 3e5,
        transport: 15e4
      }
    },
    RW: {
      name: "Rwanda",
      currency: "RWF",
      symbol: "RWF",
      flag: "🇷🇼",
      region: "East Africa",
      defaults: {
        basic: 3e5,
        housing: 7e4,
        transport: 35e3
      }
    },
    BI: {
      name: "Burundi",
      currency: "BIF",
      symbol: "FBu",
      flag: "🇧🇮",
      region: "East Africa",
      defaults: {
        basic: 15e5,
        housing: 3e5,
        transport: 15e4
      }
    },
    SO: {
      name: "Somalia",
      currency: "SOS",
      symbol: "SOS",
      flag: "🇸🇴",
      region: "East Africa",
      defaults: {
        basic: 2e6,
        housing: 4e5,
        transport: 2e5
      }
    },
    SS: {
      name: "South Sudan",
      currency: "SSP",
      symbol: "SSP",
      flag: "🇸🇸",
      region: "East Africa",
      defaults: {
        basic: 3e4,
        housing: 6e3,
        transport: 3e3
      }
    },
    ER: {
      name: "Eritrea",
      currency: "ERN",
      symbol: "Nkf",
      flag: "🇪🇷",
      region: "East Africa",
      defaults: {
        basic: 3e3,
        housing: 600,
        transport: 300
      }
    },
    DJ: {
      name: "Djibouti",
      currency: "DJF",
      symbol: "DJF",
      flag: "🇩🇯",
      region: "East Africa",
      defaults: {
        basic: 8e4,
        housing: 16e3,
        transport: 8e3
      }
    },
    KM: {
      name: "Comoros",
      currency: "KMF",
      symbol: "CF",
      flag: "🇰🇲",
      region: "East Africa",
      defaults: {
        basic: 8e4,
        housing: 16e3,
        transport: 8e3
      }
    },
    EG: {
      name: "Egypt",
      currency: "EGP",
      symbol: "EGP",
      flag: "🇪🇬",
      region: "North Africa",
      defaults: {
        basic: 15e3,
        housing: 3e3,
        transport: 1500
      }
    },
    MA: {
      name: "Morocco",
      currency: "MAD",
      symbol: "MAD",
      flag: "🇲🇦",
      region: "North Africa",
      defaults: {
        basic: 8e3,
        housing: 2e3,
        transport: 1e3
      }
    },
    DZ: {
      name: "Algeria",
      currency: "DZD",
      symbol: "DZD",
      flag: "🇩🇿",
      region: "North Africa",
      defaults: {
        basic: 6e4,
        housing: 12e3,
        transport: 6e3
      }
    },
    TN: {
      name: "Tunisia",
      currency: "TND",
      symbol: "TND",
      flag: "🇹🇳",
      region: "North Africa",
      defaults: {
        basic: 2e3,
        housing: 400,
        transport: 200
      }
    },
    LY: {
      name: "Libya",
      currency: "LYD",
      symbol: "LD",
      flag: "🇱🇾",
      region: "North Africa",
      defaults: {
        basic: 3e3,
        housing: 600,
        transport: 300
      }
    },
    SD: {
      name: "Sudan",
      currency: "SDG",
      symbol: "SDG",
      flag: "🇸🇩",
      region: "North Africa",
      defaults: {
        basic: 8e4,
        housing: 16e3,
        transport: 8e3
      }
    },
    ZA: {
      name: "South Africa",
      currency: "ZAR",
      symbol: "R",
      flag: "🇿🇦",
      region: "Southern Africa",
      defaults: {
        basic: 25e3,
        housing: 5e3,
        transport: 2500
      }
    },
    BW: {
      name: "Botswana",
      currency: "BWP",
      symbol: "BWP",
      flag: "🇧🇼",
      region: "Southern Africa",
      defaults: {
        basic: 8e3,
        housing: 2e3,
        transport: 1e3
      }
    },
    NA: {
      name: "Namibia",
      currency: "NAD",
      symbol: "N$",
      flag: "🇳🇦",
      region: "Southern Africa",
      defaults: {
        basic: 2e4,
        housing: 4e3,
        transport: 2e3
      }
    },
    ZM: {
      name: "Zambia",
      currency: "ZMW",
      symbol: "ZMW",
      flag: "🇿🇲",
      region: "Southern Africa",
      defaults: {
        basic: 8e3,
        housing: 2e3,
        transport: 1e3
      }
    },
    ZW: {
      name: "Zimbabwe",
      currency: "ZWG",
      symbol: "ZWG",
      flag: "🇿🇼",
      region: "Southern Africa",
      defaults: {
        basic: 3e3,
        housing: 600,
        transport: 300
      }
    },
    MW: {
      name: "Malawi",
      currency: "MWK",
      symbol: "MWK",
      flag: "🇲🇼",
      region: "Southern Africa",
      defaults: {
        basic: 2e5,
        housing: 4e4,
        transport: 2e4
      }
    },
    MZ: {
      name: "Mozambique",
      currency: "MZN",
      symbol: "MZN",
      flag: "🇲🇿",
      region: "Southern Africa",
      defaults: {
        basic: 3e4,
        housing: 6e3,
        transport: 3e3
      }
    },
    SZ: {
      name: "Eswatini",
      currency: "SZL",
      symbol: "SZL",
      flag: "🇸🇿",
      region: "Southern Africa",
      defaults: {
        basic: 8e3,
        housing: 1600,
        transport: 800
      }
    },
    LS: {
      name: "Lesotho",
      currency: "LSL",
      symbol: "LSL",
      flag: "🇱🇸",
      region: "Southern Africa",
      defaults: {
        basic: 8e3,
        housing: 1600,
        transport: 800
      }
    },
    MU: {
      name: "Mauritius",
      currency: "MUR",
      symbol: "MUR",
      flag: "🇲🇺",
      region: "Southern Africa",
      defaults: {
        basic: 3e4,
        housing: 6e3,
        transport: 3e3
      }
    },
    MG: {
      name: "Madagascar",
      currency: "MGA",
      symbol: "Ar",
      flag: "🇲🇬",
      region: "Southern Africa",
      defaults: {
        basic: 5e5,
        housing: 1e5,
        transport: 5e4
      }
    },
    SC: {
      name: "Seychelles",
      currency: "SCR",
      symbol: "SR",
      flag: "🇸🇨",
      region: "Southern Africa",
      defaults: {
        basic: 15e3,
        housing: 3e3,
        transport: 1500
      }
    },
    CM: {
      name: "Cameroon",
      currency: "XAF",
      symbol: "FCFA",
      flag: "🇨🇲",
      region: "Central Africa",
      defaults: {
        basic: 3e5,
        housing: 6e4,
        transport: 3e4
      }
    },
    CD: {
      name: "DR Congo",
      currency: "CDF",
      symbol: "FC",
      flag: "🇨🇩",
      region: "Central Africa",
      defaults: {
        basic: 1e6,
        housing: 2e5,
        transport: 1e5
      }
    },
    CG: {
      name: "Congo",
      currency: "XAF",
      symbol: "FCFA",
      flag: "🇨🇬",
      region: "Central Africa",
      defaults: {
        basic: 3e5,
        housing: 6e4,
        transport: 3e4
      }
    },
    GA: {
      name: "Gabon",
      currency: "XAF",
      symbol: "FCFA",
      flag: "🇬🇦",
      region: "Central Africa",
      defaults: {
        basic: 5e5,
        housing: 1e5,
        transport: 5e4
      }
    },
    GQ: {
      name: "Equatorial Guinea",
      currency: "XAF",
      symbol: "FCFA",
      flag: "🇬🇶",
      region: "Central Africa",
      defaults: {
        basic: 5e5,
        housing: 1e5,
        transport: 5e4
      }
    },
    CF: {
      name: "Central African Republic",
      currency: "XAF",
      symbol: "FCFA",
      flag: "🇨🇫",
      region: "Central Africa",
      defaults: {
        basic: 2e5,
        housing: 4e4,
        transport: 2e4
      }
    },
    TD: {
      name: "Chad",
      currency: "XAF",
      symbol: "FCFA",
      flag: "🇹🇩",
      region: "Central Africa",
      defaults: {
        basic: 2e5,
        housing: 4e4,
        transport: 2e4
      }
    },
    AO: {
      name: "Angola",
      currency: "AOA",
      symbol: "Kz",
      flag: "🇦🇴",
      region: "Central Africa",
      defaults: {
        basic: 2e5,
        housing: 4e4,
        transport: 2e4
      }
    }
  };
  function n(e, n) {
    for (var a = 0, t = e, o = 0; o < n.length && !(t <= 0); o++) {
      var r = Math.min(t, n[o][0]);
      a += r * n[o][1], t -= r;
    }
    return a;
  }
  var a = {};
  a.NG = {
    calcPAYE: function(e) {
      var a = 12 * e, t = .08 * a, o = 2e5 + .2 * a;
      return n(Math.max(0, a - t - o), [ [ 3e5, .07 ], [ 3e5, .11 ], [ 5e5, .15 ], [ 5e5, .19 ], [ 16e5, .21 ], [ 1 / 0, .24 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.NG.calcPAYE(e),
        type: "tax"
      }, {
        name: "Pension (8%)",
        amount: .08 * e,
        type: "pension"
      }, {
        name: "NHF (2.5%)",
        amount: .025 * e,
        type: "other"
      } ];
    }
  }, a.KE = {
    calcPAYE: function(e) {
      var a = Math.min(.06 * e, 2160), t = Math.max(.0275 * e, 300), o = .015 * e, r = n(Math.max(0, e - a - t - o), [ [ 24e3, .1 ], [ 8333, .25 ], [ 467667, .3 ], [ 3e5, .325 ], [ 1 / 0, .35 ] ]);
      return Math.max(0, r - 2400);
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.KE.calcPAYE(e),
        type: "tax"
      }, {
        name: "NSSF (6%)",
        amount: Math.min(.06 * e, 2160),
        type: "pension"
      }, {
        name: "SHIF (2.75%)",
        amount: Math.max(.0275 * e, 300),
        type: "health"
      }, {
        name: "AHL (1.5%)",
        amount: .015 * e,
        type: "other"
      } ];
    }
  }, a.ZA = {
    calcPAYE: function(e) {
      for (var n = 12 * e, a = 0, t = 0, o = [ [ 237100, .18 ], [ 370500, .26 ], [ 512800, .31 ], [ 673e3, .36 ], [ 857900, .39 ], [ 1817e3, .41 ], [ 1 / 0, .45 ] ], r = 0; r < o.length; r++) {
        var c = Math.min(n, o[r][0]) - t;
        if (c > 0 && (a += c * o[r][1]), t = o[r][0], n <= o[r][0]) {
          break;
        }
      }
      return Math.max(0, a - 17235) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.ZA.calcPAYE(e),
        type: "tax"
      }, {
        name: "UIF (1%)",
        amount: Math.min(.01 * e, 177.12),
        type: "other"
      } ];
    }
  }, a.GH = {
    calcPAYE: function(e) {
      return n(e, [ [ 402, 0 ], [ 110, .05 ], [ 130, .1 ], [ 3034, .175 ], [ 16e3, .25 ], [ 1 / 0, .3 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.GH.calcPAYE(e),
        type: "tax"
      }, {
        name: "SSNIT Tier 1 (5.5%)",
        amount: .055 * e,
        type: "pension"
      } ];
    }
  }, a.TZ = {
    calcPAYE: function(e) {
      return n(e, [ [ 27e4, 0 ], [ 25e4, .08 ], [ 24e4, .2 ], [ 24e4, .25 ], [ 1 / 0, .3 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.TZ.calcPAYE(e),
        type: "tax"
      }, {
        name: "NSSF (10%)",
        amount: .1 * e,
        type: "pension"
      } ];
    }
  }, a.UG = {
    calcPAYE: function(e) {
      return n(e, [ [ 235e3, 0 ], [ 1e5, .1 ], [ 75e3, .2 ], [ 13423333, .3 ], [ 1 / 0, .4 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.UG.calcPAYE(e),
        type: "tax"
      }, {
        name: "NSSF (5%)",
        amount: .05 * e,
        type: "pension"
      } ];
    }
  }, a.ET = {
    calcPAYE: function(e) {
      return n(e, [ [ 600, 0 ], [ 1050, .1 ], [ 1550, .15 ], [ 2050, .2 ], [ 2550, .25 ], [ 3100, .3 ], [ 1 / 0, .35 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.ET.calcPAYE(e),
        type: "tax"
      }, {
        name: "Pension (7%)",
        amount: .07 * e,
        type: "pension"
      } ];
    }
  }, a.RW = {
    calcPAYE: function(e) {
      return n(e, [ [ 3e4, 0 ], [ 7e4, .2 ], [ 1 / 0, .3 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.RW.calcPAYE(e),
        type: "tax"
      }, {
        name: "RSSB Pension (6%)",
        amount: .06 * e,
        type: "pension"
      } ];
    }
  }, a.CM = {
    calcPAYE: function(e) {
      var a = Math.min(.042 * e, 31500);
      return n(Math.max(0, 12 * e - 12 * a), [ [ 2e6, .11 ], [ 1e6, .165 ], [ 2e6, .275 ], [ 1 / 0, .385 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IRPP Tax",
        amount: a.CM.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNPS Pension (4.2%)",
        amount: Math.min(.042 * e, 31500),
        type: "pension"
      } ];
    }
  }, a.CI = {
    calcPAYE: function(e) {
      return n(12 * e * .8, [ [ 6e5, 0 ], [ 6e5, .015 ], [ 12e5, .05 ], [ 24e5, .15 ], [ 36e5, .2 ], [ 6e6, .25 ], [ 1 / 0, .35 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IS Tax",
        amount: a.CI.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNPS Pension (6.3%)",
        amount: Math.min(.063 * e, 170100),
        type: "pension"
      } ];
    }
  }, a.SN = {
    calcPAYE: function(e) {
      var a = 12 * e, t = Math.min(.3 * a, 9e5);
      return n(Math.max(0, a - t), [ [ 63e4, 0 ], [ 87e4, .2 ], [ 25e5, .3 ], [ 4e6, .35 ], [ 56e5, .37 ], [ 1 / 0, .4 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IRPP Tax",
        amount: a.SN.calcPAYE(e),
        type: "tax"
      }, {
        name: "IPRES Pension (5.6%)",
        amount: .056 * e,
        type: "pension"
      } ];
    }
  }, a.MA = {
    calcPAYE: function(e) {
      var a = 12 * e, t = Math.min(.2 * a, 3e4), o = 12 * Math.min(.0448 * e, 268.8), r = .0226 * e * 12;
      return n(Math.max(0, a - t - o - r), [ [ 3e4, 0 ], [ 2e4, .1 ], [ 1e4, .2 ], [ 2e4, .3 ], [ 1e5, .34 ], [ 1 / 0, .38 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IR Tax",
        amount: a.MA.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNSS (4.48%)",
        amount: Math.min(.0448 * e, 268.8),
        type: "pension"
      }, {
        name: "AMO (2.26%)",
        amount: .0226 * e,
        type: "health"
      } ];
    }
  }, a.EG = {
    calcPAYE: function(e) {
      var a = Math.min(.11 * e, 1386);
      return n(Math.max(0, 12 * e - 12 * a), [ [ 4e4, 0 ], [ 15e3, .1 ], [ 15e3, .15 ], [ 13e4, .2 ], [ 2e5, .225 ], [ 8e5, .25 ], [ 1 / 0, .275 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "Income Tax",
        amount: a.EG.calcPAYE(e),
        type: "tax"
      }, {
        name: "NOSI (11%)",
        amount: Math.min(.11 * e, 1386),
        type: "pension"
      } ];
    }
  }, a.DZ = {
    calcPAYE: function(e) {
      var a = Math.min(.25 * e, 1500), t = .09 * e;
      return n(Math.max(0, e - a - t), [ [ 15e3, 0 ], [ 5e3, .2 ], [ 1e4, .24 ], [ 2e4, .27 ], [ 7e4, .3 ], [ 1 / 0, .35 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "IRG Tax",
        amount: a.DZ.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNAS (9%)",
        amount: .09 * e,
        type: "pension"
      } ];
    }
  }, a.TN = {
    calcPAYE: function(e) {
      var a = 12 * e, t = Math.min(.1 * a, 2e3), o = .0918 * e * 12;
      return n(Math.max(0, a - t - o), [ [ 5e3, 0 ], [ 15e3, .26 ], [ 1e4, .28 ], [ 2e4, .32 ], [ 1 / 0, .35 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IRPP Tax",
        amount: a.TN.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNSS (9.18%)",
        amount: .0918 * e,
        type: "pension"
      } ];
    }
  }, a.BW = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 48e3, 0 ], [ 36e3, .05 ], [ 36e3, .125 ], [ 36e3, .1875 ], [ 1 / 0, .25 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.BW.calcPAYE(e),
        type: "tax"
      }, {
        name: "BPOPF Pension (7.5%)",
        amount: .075 * e,
        type: "pension"
      } ];
    }
  }, a.NA = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 5e4, 0 ], [ 5e4, .18 ], [ 2e5, .25 ], [ 2e5, .28 ], [ 3e5, .3 ], [ 7e5, .32 ], [ 1 / 0, .37 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.NA.calcPAYE(e),
        type: "tax"
      }, {
        name: "SSC (0.9%)",
        amount: Math.min(.009 * e, 81),
        type: "other"
      } ];
    }
  }, a.ZM = {
    calcPAYE: function(e) {
      return n(e, [ [ 4800, 0 ], [ 3200, .2 ], [ 4100, .3 ], [ 1 / 0, .375 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.ZM.calcPAYE(e),
        type: "tax"
      }, {
        name: "NAPSA (5%)",
        amount: Math.min(.05 * e, 255),
        type: "pension"
      } ];
    }
  }, a.ZW = {
    calcPAYE: function(e) {
      return 1.03 * n(12 * e, [ [ 12e4, 0 ], [ 24e4, .2 ], [ 36e4, .25 ], [ 72e4, .3 ], [ 1 / 0, .4 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.ZW.calcPAYE(e),
        type: "tax"
      }, {
        name: "NSSA (4.5%)",
        amount: .045 * e,
        type: "pension"
      } ];
    }
  }, a.MU = {
    calcPAYE: function(e) {
      var n = 12 * e;
      return n <= 325e3 ? 0 : .15 * (n - 325e3) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "Income Tax (15%)",
        amount: a.MU.calcPAYE(e),
        type: "tax"
      }, {
        name: "NSF (1%)",
        amount: .01 * e,
        type: "pension"
      }, {
        name: "CSG (3%)",
        amount: e < 5e4 ? .03 * e : 0,
        type: "health"
      } ];
    }
  }, a.MG = {
    calcPAYE: function(e) {
      return n(e, [ [ 35e4, 0 ], [ 5e4, .05 ], [ 1e5, .1 ], [ 3e5, .15 ], [ 1 / 0, .2 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "IRSA Tax",
        amount: a.MG.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNaPS (1%)",
        amount: .01 * e,
        type: "pension"
      } ];
    }
  }, a.MW = {
    calcPAYE: function(e) {
      return n(e, [ [ 1e5, 0 ], [ 3e5, .15 ], [ 4e5, .25 ], [ 2e5, .3 ], [ 1 / 0, .35 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.MW.calcPAYE(e),
        type: "tax"
      } ];
    }
  }, a.SZ = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 41500, 0 ], [ 58500, .2 ], [ 5e4, .25 ], [ 5e4, .3 ], [ 1 / 0, .33 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.SZ.calcPAYE(e),
        type: "tax"
      }, {
        name: "SNPF (5%)",
        amount: .05 * e,
        type: "pension"
      } ];
    }
  }, a.LS = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 59136, .2 ], [ 1 / 0, .3 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.LS.calcPAYE(e),
        type: "tax"
      }, {
        name: "LNPF (10%)",
        amount: .1 * e,
        type: "pension"
      } ];
    }
  }, a.AO = {
    calcPAYE: function(e) {
      return n(e, [ [ 1e5, 0 ], [ 5e4, .07 ], [ 5e4, .11 ], [ 1e5, .13 ], [ 2e5, .16 ], [ 5e5, .18 ], [ 1 / 0, .19 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "IRT Tax",
        amount: a.AO.calcPAYE(e),
        type: "tax"
      }, {
        name: "INSS (3%)",
        amount: .03 * e,
        type: "pension"
      } ];
    }
  }, a.MZ = {
    calcPAYE: function(e) {
      return n(e, [ [ 3500, 0 ], [ 10500, .1 ], [ 28e3, .15 ], [ 84e3, .2 ], [ 126e3, .25 ], [ 1 / 0, .32 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "IRPS Tax",
        amount: a.MZ.calcPAYE(e),
        type: "tax"
      }, {
        name: "INSS (3%)",
        amount: .03 * e,
        type: "pension"
      } ];
    }
  }, a.CD = {
    calcPAYE: function(e) {
      return n(e, [ [ 524160, 0 ], [ 261840, .15 ], [ 913800, .3 ], [ 1 / 0, .4 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "IPR Tax",
        amount: a.CD.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNSS (5%)",
        amount: .05 * e,
        type: "pension"
      } ];
    }
  }, a.CG = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 464e3, .01 ], [ 6e5, .2 ], [ 12936e3, .4 ], [ 1 / 0, .45 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IRPP Tax",
        amount: a.CG.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNSS (4%)",
        amount: .04 * e,
        type: "pension"
      } ];
    }
  }, a.GA = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 15e5, 0 ], [ 5e5, .05 ], [ 5e5, .1 ], [ 5e5, .15 ], [ 2e6, .2 ], [ 3e6, .25 ], [ 4e6, .3 ], [ 1 / 0, .35 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IRPP Tax",
        amount: a.GA.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNSS (2.5%)",
        amount: Math.min(.025 * e, 37500),
        type: "pension"
      }, {
        name: "CNAMGS Health (2%)",
        amount: .02 * e,
        type: "health"
      } ];
    }
  }, a.BF = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 3e5, 0 ], [ 3e5, .12 ], [ 3e5, .14 ], [ 6e5, .18 ], [ 15e5, .23 ], [ 1 / 0, .275 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IUTS Tax",
        amount: a.BF.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNSS (5.5%)",
        amount: Math.min(.055 * e, 33e3),
        type: "pension"
      } ];
    }
  }, a.ML = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 6e5, 0 ], [ 6e5, .1 ], [ 12e5, .18 ], [ 24e5, .26 ], [ 48e5, .33 ], [ 1 / 0, .4 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "ITS Tax",
        amount: a.ML.calcPAYE(e),
        type: "tax"
      }, {
        name: "INPS (3.6%)",
        amount: .036 * e,
        type: "pension"
      } ];
    }
  }, a.NE = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 6e5, 0 ], [ 3e5, .08 ], [ 6e5, .14 ], [ 12e5, .2 ], [ 18e5, .26 ], [ 1 / 0, .35 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IUTS Tax",
        amount: a.NE.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNSS (5.25%)",
        amount: .0525 * e,
        type: "pension"
      } ];
    }
  }, a.GN = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 12e5, 0 ], [ 6e5, .05 ], [ 12e5, .1 ], [ 24e5, .15 ], [ 6e6, .2 ], [ 88e5, .25 ], [ 1 / 0, .35 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "ITS Tax",
        amount: a.GN.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNSS (5%)",
        amount: .05 * e,
        type: "pension"
      } ];
    }
  }, a.TG = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 6e5, 0 ], [ 6e5, .07 ], [ 12e5, .12 ], [ 24e5, .22 ], [ 1 / 0, .35 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IRPP Tax",
        amount: a.TG.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNSS (4%)",
        amount: .04 * e,
        type: "pension"
      } ];
    }
  }, a.BJ = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 6e5, 0 ], [ 6e5, .13 ], [ 12e5, .22 ], [ 24e5, .3 ], [ 1 / 0, .35 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IRPP Tax",
        amount: a.BJ.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNSS (3.6%)",
        amount: .036 * e,
        type: "pension"
      } ];
    }
  }, a.SL = {
    calcPAYE: function(e) {
      return n(e, [ [ 5e5, 0 ], [ 5e5, .15 ], [ 5e5, .2 ], [ 1e6, .25 ], [ 1 / 0, .3 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.SL.calcPAYE(e),
        type: "tax"
      }, {
        name: "NASSIT (5%)",
        amount: .05 * e,
        type: "pension"
      } ];
    }
  }, a.LR = {
    calcPAYE: function(e) {
      return n(e, [ [ 5e3, 0 ], [ 5e3, .05 ], [ 5e3, .1 ], [ 5e3, .15 ], [ 5e3, .2 ], [ 1 / 0, .25 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.LR.calcPAYE(e),
        type: "tax"
      }, {
        name: "NASSCORP (3%)",
        amount: .03 * e,
        type: "pension"
      } ];
    }
  }, a.GM = {
    calcPAYE: function(e) {
      return n(e, [ [ 22e3, 0 ], [ 8e3, .1 ], [ 2e4, .15 ], [ 2e4, .2 ], [ 3e4, .25 ], [ 1 / 0, .3 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "PAYE Tax",
        amount: a.GM.calcPAYE(e),
        type: "tax"
      }, {
        name: "SSHFC (5%)",
        amount: .05 * e,
        type: "pension"
      } ];
    }
  }, a.GW = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 9e5, 0 ], [ 9e5, .1 ], [ 24e5, .2 ], [ 1 / 0, .35 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IRPS Tax",
        amount: a.GW.calcPAYE(e),
        type: "tax"
      }, {
        name: "INSS (5%)",
        amount: .05 * e,
        type: "pension"
      } ];
    }
  }, a.CV = {
    calcPAYE: function(e) {
      return n(e, [ [ 22e3, 0 ], [ 18e3, .165 ], [ 3e4, .231 ], [ 2e4, .26 ], [ 3e4, .275 ], [ 1 / 0, .35 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "IUR Tax",
        amount: a.CV.calcPAYE(e),
        type: "tax"
      }, {
        name: "INPS (8%)",
        amount: .08 * e,
        type: "pension"
      } ];
    }
  }, a.MR = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 18e4, 0 ], [ 36e4, .15 ], [ 54e4, .25 ], [ 1 / 0, .4 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "ITS Tax",
        amount: a.MR.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNAM Health (1%)",
        amount: .01 * e,
        type: "health"
      } ];
    }
  }, a.ST = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 72e3, 0 ], [ 12e4, .1 ], [ 2e5, .15 ], [ 1 / 0, .25 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IRS Tax",
        amount: a.ST.calcPAYE(e),
        type: "tax"
      }, {
        name: "INSS (5%)",
        amount: .05 * e,
        type: "pension"
      } ];
    }
  }, a.BI = {
    calcPAYE: function(e) {
      return n(e, [ [ 15e4, 0 ], [ 15e4, .2 ], [ 2e5, .25 ], [ 1 / 0, .35 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "IPR Tax",
        amount: a.BI.calcPAYE(e),
        type: "tax"
      }, {
        name: "INSS (5%)",
        amount: .05 * e,
        type: "pension"
      } ];
    }
  }, a.SO = {
    calcPAYE: function(e) {
      return e <= 5e5 ? .05 * e : .1 * e;
    },
    deductions: function(e) {
      return [ {
        name: "Income Tax",
        amount: a.SO.calcPAYE(e),
        type: "tax"
      } ];
    }
  }, a.SS = {
    calcPAYE: function(e) {
      return n(e, [ [ 5e3, 0 ], [ 5e3, .1 ], [ 1e4, .15 ], [ 1 / 0, .2 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "PITA Tax",
        amount: a.SS.calcPAYE(e),
        type: "tax"
      }, {
        name: "Pension (8%)",
        amount: .08 * e,
        type: "pension"
      } ];
    }
  }, a.ER = {
    calcPAYE: function(e) {
      return n(e, [ [ 500, .02 ], [ 500, .05 ], [ 1e3, .1 ], [ 1e3, .15 ], [ 2e3, .2 ], [ 1 / 0, .3 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "Income Tax",
        amount: a.ER.calcPAYE(e),
        type: "tax"
      }, {
        name: "SSC (6%)",
        amount: .06 * e,
        type: "pension"
      } ];
    }
  }, a.DJ = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 48e4, 0 ], [ 48e4, .08 ], [ 96e4, .18 ], [ 1 / 0, .3 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IRPP Tax",
        amount: a.DJ.calcPAYE(e),
        type: "tax"
      }, {
        name: "ONSS (4%)",
        amount: .04 * e,
        type: "pension"
      } ];
    }
  }, a.KM = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 36e4, 0 ], [ 48e4, .1 ], [ 6e5, .15 ], [ 1 / 0, .3 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IGR Tax",
        amount: a.KM.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNPS (6%)",
        amount: .06 * e,
        type: "pension"
      } ];
    }
  }, a.LY = {
    calcPAYE: function() {
      return 0;
    },
    deductions: function(e) {
      return [ {
        name: "Social Security (3.75%)",
        amount: .0375 * e,
        type: "pension"
      } ];
    }
  }, a.SD = {
    calcPAYE: function(e) {
      return n(e, [ [ 500, 0 ], [ 500, .05 ], [ 4e3, .1 ], [ 5e3, .15 ], [ 1e4, .2 ], [ 1 / 0, .3 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "Income Tax",
        amount: a.SD.calcPAYE(e),
        type: "tax"
      }, {
        name: "NSIF (8%)",
        amount: .08 * e,
        type: "pension"
      } ];
    }
  }, a.SC = {
    calcPAYE: function(e) {
      return n(e, [ [ 8555, 0 ], [ 74945, .15 ], [ 1 / 0, .2 ] ]);
    },
    deductions: function(e) {
      return [ {
        name: "Income Tax",
        amount: a.SC.calcPAYE(e),
        type: "tax"
      }, {
        name: "Social Security (2.5%)",
        amount: .025 * e,
        type: "pension"
      } ];
    }
  }, a.GQ = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 1e6, 0 ], [ 1e6, .1 ], [ 3e6, .2 ], [ 1 / 0, .35 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IRPF Tax",
        amount: a.GQ.calcPAYE(e),
        type: "tax"
      }, {
        name: "INSESO (5%)",
        amount: .05 * e,
        type: "pension"
      } ];
    }
  }, a.CF = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 6e5, 0 ], [ 6e5, .1 ], [ 18e5, .2 ], [ 3e6, .3 ], [ 1 / 0, .4 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IRPP Tax",
        amount: a.CF.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNSS (5%)",
        amount: .05 * e,
        type: "pension"
      } ];
    }
  }, a.TD = {
    calcPAYE: function(e) {
      return n(12 * e, [ [ 8e5, 0 ], [ 8e5, .08 ], [ 24e5, .2 ], [ 1 / 0, .3 ] ]) / 12;
    },
    deductions: function(e) {
      return [ {
        name: "IRPP Tax",
        amount: a.TD.calcPAYE(e),
        type: "tax"
      }, {
        name: "CNPS (3.5%)",
        amount: .035 * e,
        type: "pension"
      } ];
    }
  }, window.AfroTools.PayslipEngine = {
    COUNTRIES: e,
    TAX: a,
    calculate: function(n) {
      var t = n.country, o = e[t];
      if (!o) {
        return null;
      }
      var r = o.symbol, c = +n.basic || 0, u = +n.housing || 0, i = +n.transport || 0, s = +n.other || 0, m = +n.overtime || 0, l = +n.bonus || 0, f = c + u + i + s + m + l, A = a[t] ? a[t].deductions(f) : [];
      n.customDeductions && n.customDeductions.forEach(function(e) {
        e.label && +e.amount > 0 && A.push({
          name: e.label,
          amount: +e.amount,
          type: "custom"
        });
      });
      var y = A.reduce(function(e, n) {
        return e + n.amount;
      }, 0), p = f - y, d = [ {
        name: "Basic Salary",
        amount: c
      }, {
        name: "Housing Allowance",
        amount: u
      }, {
        name: "Transport Allowance",
        amount: i
      } ];
      return s > 0 && d.push({
        name: "Other Allowances",
        amount: s
      }), m > 0 && d.push({
        name: "Overtime",
        amount: m
      }), l > 0 && d.push({
        name: "Bonus",
        amount: l
      }), d = d.filter(function(e) {
        return e.amount > 0;
      }), {
        country: t,
        countryName: o.name,
        currency: o.currency,
        symbol: r,
        fmt: function(e) {
          return r + " " + Math.round(e).toLocaleString("en-US");
        },
        company: n.company || "",
        address: n.address || "",
        empName: n.empName || "",
        empId: n.empId || "",
        period: n.period || "",
        dept: n.dept || "",
        jobTitle: n.jobTitle || "",
        taxId: n.taxId || "",
        earnings: d,
        deductions: A,
        gross: f,
        totalDeductions: y,
        net: p,
        fxEnabled: n.fxEnabled || !1,
        fxBase: n.fxBase || "USD",
        fxRate: +n.fxRate || 1,
        leaveEnabled: n.leaveEnabled || !1,
        leaveDays: n.leaveDays || 0,
        style: n.style || "corporate"
      };
    },
    optimizeHousing: function(e) {
      var n = e.country, t = a[n];
      if (!t || !t.calcPAYE) {
        return null;
      }
      for (var o = +e.transport || 0, r = +e.other || 0, c = +e.overtime || 0, u = +e.bonus || 0, i = (+e.basic || 0) + (+e.housing || 0), s = i + o + r + c + u, m = t.calcPAYE(s), l = null, f = 1 / 0, A = 10; A <= 90; A += 5) {
        var y = 1e3 * Math.round(i * A / 100 / 1e3), p = i - y, d = t.calcPAYE(y + p + o + r + c + u);
        d < f && (f = d, l = {
          basic: y,
          housing: p,
          paye: d
        });
      }
      return !l || l.paye >= m ? null : {
        currentBasic: +e.basic || 0,
        currentHousing: +e.housing || 0,
        currentPAYE: m,
        optimalBasic: l.basic,
        optimalHousing: l.housing,
        optimalPAYE: l.paye,
        monthlySavings: m - l.paye,
        annualSavings: 12 * (m - l.paye)
      };
    }
  };
}();
