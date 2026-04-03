// engines/payslip-engine.js — AfroTools Payslip Engine
// All 54 African countries: PAYE, pension, social security calculations
// Exposed as window.AfroTools.PayslipEngine
(function () {
  "use strict";
  window.AfroTools = window.AfroTools || {};

  // ─── COUNTRY METADATA ──────────────────────────────────────────────────────
  var COUNTRIES = {
    // West Africa
    NG: { name: "Nigeria",         currency: "NGN", symbol: "₦",    flag: "🇳🇬", region: "West Africa",    defaults: { basic: 500000,  housing: 100000, transport: 50000  } },
    GH: { name: "Ghana",           currency: "GHS", symbol: "GH₵",  flag: "🇬🇭", region: "West Africa",    defaults: { basic: 4000,    housing: 800,    transport: 400    } },
    SN: { name: "Senegal",         currency: "XOF", symbol: "FCFA", flag: "🇸🇳", region: "West Africa",    defaults: { basic: 300000,  housing: 60000,  transport: 30000  } },
    CI: { name: "Côte d'Ivoire",   currency: "XOF", symbol: "FCFA", flag: "🇨🇮", region: "West Africa",    defaults: { basic: 300000,  housing: 60000,  transport: 30000  } },
    ML: { name: "Mali",            currency: "XOF", symbol: "FCFA", flag: "🇲🇱", region: "West Africa",    defaults: { basic: 150000,  housing: 30000,  transport: 15000  } },
    BF: { name: "Burkina Faso",    currency: "XOF", symbol: "FCFA", flag: "🇧🇫", region: "West Africa",    defaults: { basic: 150000,  housing: 30000,  transport: 15000  } },
    NE: { name: "Niger",           currency: "XOF", symbol: "FCFA", flag: "🇳🇪", region: "West Africa",    defaults: { basic: 150000,  housing: 30000,  transport: 15000  } },
    GN: { name: "Guinea",          currency: "GNF", symbol: "GNF",  flag: "🇬🇳", region: "West Africa",    defaults: { basic: 2000000, housing: 400000, transport: 200000 } },
    TG: { name: "Togo",            currency: "XOF", symbol: "FCFA", flag: "🇹🇬", region: "West Africa",    defaults: { basic: 200000,  housing: 40000,  transport: 20000  } },
    BJ: { name: "Benin",           currency: "XOF", symbol: "FCFA", flag: "🇧🇯", region: "West Africa",    defaults: { basic: 150000,  housing: 30000,  transport: 15000  } },
    SL: { name: "Sierra Leone",    currency: "SLE", symbol: "NLe",  flag: "🇸🇱", region: "West Africa",    defaults: { basic: 2000000, housing: 400000, transport: 200000 } },
    LR: { name: "Liberia",         currency: "LRD", symbol: "L$",   flag: "🇱🇷", region: "West Africa",    defaults: { basic: 30000,   housing: 6000,   transport: 3000   } },
    GM: { name: "Gambia",          currency: "GMD", symbol: "D",    flag: "🇬🇲", region: "West Africa",    defaults: { basic: 30000,   housing: 6000,   transport: 3000   } },
    GW: { name: "Guinea-Bissau",   currency: "XOF", symbol: "FCFA", flag: "🇬🇼", region: "West Africa",    defaults: { basic: 150000,  housing: 30000,  transport: 15000  } },
    CV: { name: "Cabo Verde",      currency: "CVE", symbol: "Esc",  flag: "🇨🇻", region: "West Africa",    defaults: { basic: 50000,   housing: 10000,  transport: 5000   } },
    MR: { name: "Mauritania",      currency: "MRU", symbol: "MRU",  flag: "🇲🇷", region: "West Africa",    defaults: { basic: 50000,   housing: 10000,  transport: 5000   } },
    ST: { name: "São Tomé & Príncipe", currency: "STN", symbol: "Db", flag: "🇸🇹", region: "West Africa", defaults: { basic: 10000,   housing: 2000,   transport: 1000   } },
    // East Africa
    KE: { name: "Kenya",           currency: "KES", symbol: "KES",  flag: "🇰🇪", region: "East Africa",    defaults: { basic: 80000,   housing: 20000,  transport: 10000  } },
    ET: { name: "Ethiopia",        currency: "ETB", symbol: "ETB",  flag: "🇪🇹", region: "East Africa",    defaults: { basic: 8000,    housing: 2000,   transport: 1000   } },
    UG: { name: "Uganda",          currency: "UGX", symbol: "USh",  flag: "🇺🇬", region: "East Africa",    defaults: { basic: 1800000, housing: 400000, transport: 200000 } },
    TZ: { name: "Tanzania",        currency: "TZS", symbol: "TSh",  flag: "🇹🇿", region: "East Africa",    defaults: { basic: 1200000, housing: 300000, transport: 150000 } },
    RW: { name: "Rwanda",          currency: "RWF", symbol: "RWF",  flag: "🇷🇼", region: "East Africa",    defaults: { basic: 300000,  housing: 70000,  transport: 35000  } },
    BI: { name: "Burundi",         currency: "BIF", symbol: "FBu",  flag: "🇧🇮", region: "East Africa",    defaults: { basic: 1500000, housing: 300000, transport: 150000 } },
    SO: { name: "Somalia",         currency: "SOS", symbol: "SOS",  flag: "🇸🇴", region: "East Africa",    defaults: { basic: 2000000, housing: 400000, transport: 200000 } },
    SS: { name: "South Sudan",     currency: "SSP", symbol: "SSP",  flag: "🇸🇸", region: "East Africa",    defaults: { basic: 30000,   housing: 6000,   transport: 3000   } },
    ER: { name: "Eritrea",         currency: "ERN", symbol: "Nkf",  flag: "🇪🇷", region: "East Africa",    defaults: { basic: 3000,    housing: 600,    transport: 300    } },
    DJ: { name: "Djibouti",        currency: "DJF", symbol: "DJF",  flag: "🇩🇯", region: "East Africa",    defaults: { basic: 80000,   housing: 16000,  transport: 8000   } },
    KM: { name: "Comoros",         currency: "KMF", symbol: "CF",   flag: "🇰🇲", region: "East Africa",    defaults: { basic: 80000,   housing: 16000,  transport: 8000   } },
    // North Africa
    EG: { name: "Egypt",           currency: "EGP", symbol: "EGP",  flag: "🇪🇬", region: "North Africa",   defaults: { basic: 15000,   housing: 3000,   transport: 1500   } },
    MA: { name: "Morocco",         currency: "MAD", symbol: "MAD",  flag: "🇲🇦", region: "North Africa",   defaults: { basic: 8000,    housing: 2000,   transport: 1000   } },
    DZ: { name: "Algeria",         currency: "DZD", symbol: "DZD",  flag: "🇩🇿", region: "North Africa",   defaults: { basic: 60000,   housing: 12000,  transport: 6000   } },
    TN: { name: "Tunisia",         currency: "TND", symbol: "TND",  flag: "🇹🇳", region: "North Africa",   defaults: { basic: 2000,    housing: 400,    transport: 200    } },
    LY: { name: "Libya",           currency: "LYD", symbol: "LD",   flag: "🇱🇾", region: "North Africa",   defaults: { basic: 3000,    housing: 600,    transport: 300    } },
    SD: { name: "Sudan",           currency: "SDG", symbol: "SDG",  flag: "🇸🇩", region: "North Africa",   defaults: { basic: 80000,   housing: 16000,  transport: 8000   } },
    // Southern Africa
    ZA: { name: "South Africa",    currency: "ZAR", symbol: "R",    flag: "🇿🇦", region: "Southern Africa", defaults: { basic: 25000,  housing: 5000,   transport: 2500   } },
    BW: { name: "Botswana",        currency: "BWP", symbol: "BWP",  flag: "🇧🇼", region: "Southern Africa", defaults: { basic: 8000,   housing: 2000,   transport: 1000   } },
    NA: { name: "Namibia",         currency: "NAD", symbol: "N$",   flag: "🇳🇦", region: "Southern Africa", defaults: { basic: 20000,  housing: 4000,   transport: 2000   } },
    ZM: { name: "Zambia",          currency: "ZMW", symbol: "ZMW",  flag: "🇿🇲", region: "Southern Africa", defaults: { basic: 8000,   housing: 2000,   transport: 1000   } },
    ZW: { name: "Zimbabwe",        currency: "ZWG", symbol: "ZWG",  flag: "🇿🇼", region: "Southern Africa", defaults: { basic: 3000,   housing: 600,    transport: 300    } },
    MW: { name: "Malawi",          currency: "MWK", symbol: "MWK",  flag: "🇲🇼", region: "Southern Africa", defaults: { basic: 200000, housing: 40000,  transport: 20000  } },
    MZ: { name: "Mozambique",      currency: "MZN", symbol: "MZN",  flag: "🇲🇿", region: "Southern Africa", defaults: { basic: 30000,  housing: 6000,   transport: 3000   } },
    SZ: { name: "Eswatini",        currency: "SZL", symbol: "SZL",  flag: "🇸🇿", region: "Southern Africa", defaults: { basic: 8000,   housing: 1600,   transport: 800    } },
    LS: { name: "Lesotho",         currency: "LSL", symbol: "LSL",  flag: "🇱🇸", region: "Southern Africa", defaults: { basic: 8000,   housing: 1600,   transport: 800    } },
    MU: { name: "Mauritius",       currency: "MUR", symbol: "MUR",  flag: "🇲🇺", region: "Southern Africa", defaults: { basic: 30000,  housing: 6000,   transport: 3000   } },
    MG: { name: "Madagascar",      currency: "MGA", symbol: "Ar",   flag: "🇲🇬", region: "Southern Africa", defaults: { basic: 500000, housing: 100000, transport: 50000  } },
    SC: { name: "Seychelles",      currency: "SCR", symbol: "SR",   flag: "🇸🇨", region: "Southern Africa", defaults: { basic: 15000,  housing: 3000,   transport: 1500   } },
    // Central Africa
    CM: { name: "Cameroon",        currency: "XAF", symbol: "FCFA", flag: "🇨🇲", region: "Central Africa",  defaults: { basic: 300000, housing: 60000,  transport: 30000  } },
    CD: { name: "DR Congo",        currency: "CDF", symbol: "FC",   flag: "🇨🇩", region: "Central Africa",  defaults: { basic: 1000000,housing: 200000, transport: 100000 } },
    CG: { name: "Congo",           currency: "XAF", symbol: "FCFA", flag: "🇨🇬", region: "Central Africa",  defaults: { basic: 300000, housing: 60000,  transport: 30000  } },
    GA: { name: "Gabon",           currency: "XAF", symbol: "FCFA", flag: "🇬🇦", region: "Central Africa",  defaults: { basic: 500000, housing: 100000, transport: 50000  } },
    GQ: { name: "Equatorial Guinea", currency: "XAF", symbol: "FCFA", flag: "🇬🇶", region: "Central Africa", defaults: { basic: 500000, housing: 100000, transport: 50000 } },
    CF: { name: "Central African Republic", currency: "XAF", symbol: "FCFA", flag: "🇨🇫", region: "Central Africa", defaults: { basic: 200000, housing: 40000, transport: 20000 } },
    TD: { name: "Chad",            currency: "XAF", symbol: "FCFA", flag: "🇹🇩", region: "Central Africa",  defaults: { basic: 200000, housing: 40000,  transport: 20000  } },
    AO: { name: "Angola",          currency: "AOA", symbol: "Kz",   flag: "🇦🇴", region: "Central Africa",  defaults: { basic: 200000, housing: 40000,  transport: 20000  } }
  };

  // ─── HELPERS ───────────────────────────────────────────────────────────────
  // Apply progressive tax bands: [[limit, rate], ...] — limit=Infinity for top band
  function applyBands(amount, bands) {
    var tax = 0, rem = amount;
    for (var i = 0; i < bands.length; i++) {
      if (rem <= 0) break;
      var t = Math.min(rem, bands[i][0]);
      tax += t * bands[i][1];
      rem -= t;
    }
    return tax;
  }

  // ─── TAX CALCULATIONS: all 54 countries ───────────────────────────────────
  var TAX = {};

  // ── 1. NIGERIA ─────────────────────────────────────────────────────────────
  // PITA: CRA = 200k + 20% gross (higher of this or 1% gross). Pension deductible.
  TAX.NG = {
    calcPAYE: function (gross) {
      var annual = gross * 12;
      var pension = annual * 0.08;
      var cra = 200000 + annual * 0.20; // Consolidated Relief Allowance (PITA)
      var taxable = Math.max(0, annual - pension - cra);
      return applyBands(taxable, [[300000, .07], [300000, .11], [500000, .15], [500000, .19], [1600000, .21], [Infinity, .24]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.NG.calcPAYE(g), type: "tax" },
        { name: "Pension (8%)", amount: g * 0.08, type: "pension" },
        { name: "NHF (2.5%)", amount: g * 0.025, type: "other" }
      ];
    }
  };

  // ── 2. KENYA ───────────────────────────────────────────────────────────────
  // NSSF (6%, max KES 2,160) is pre-tax deductible. Personal relief KES 2,400/month.
  TAX.KE = {
    calcPAYE: function (gross) {
      var nssf = Math.min(gross * 0.06, 2160);
      var taxable = gross - nssf;
      var tax = applyBands(taxable, [[24000, .10], [8333, .25], [467667, .30], [300000, .325], [Infinity, .35]]);
      return Math.max(0, tax - 2400);
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.KE.calcPAYE(g), type: "tax" },
        { name: "NSSF (6%)", amount: Math.min(g * 0.06, 2160), type: "pension" },
        { name: "SHIF (2.75%)", amount: g * 0.0275, type: "health" },
        { name: "AHL (1.5%)", amount: g * 0.015, type: "other" }
      ];
    }
  };

  // ── 3. SOUTH AFRICA ────────────────────────────────────────────────────────
  // SARS 7-band annual. Primary rebate R17,235. UIF 1% max R177.12/month.
  TAX.ZA = {
    calcPAYE: function (gross) {
      var annual = gross * 12, tax = 0, prev = 0;
      var bands = [[237100, .18], [370500, .26], [512800, .31], [673000, .36], [857900, .39], [1817000, .41], [Infinity, .45]];
      for (var i = 0; i < bands.length; i++) {
        var t = Math.min(annual, bands[i][0]) - prev;
        if (t > 0) tax += t * bands[i][1];
        prev = bands[i][0];
        if (annual <= bands[i][0]) break;
      }
      return Math.max(0, tax - 17235) / 12;
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.ZA.calcPAYE(g), type: "tax" },
        { name: "UIF (1%)", amount: Math.min(g * 0.01, 177.12), type: "other" }
      ];
    }
  };

  // ── 4. GHANA ───────────────────────────────────────────────────────────────
  TAX.GH = {
    calcPAYE: function (g) {
      return applyBands(g, [[402, 0], [110, .05], [130, .10], [3034, .175], [16000, .25], [Infinity, .30]]);
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.GH.calcPAYE(g), type: "tax" },
        { name: "SSNIT Tier 1 (5.5%)", amount: g * 0.055, type: "pension" }
      ];
    }
  };

  // ── 5. TANZANIA ────────────────────────────────────────────────────────────
  TAX.TZ = {
    calcPAYE: function (g) {
      return applyBands(g, [[270000, 0], [250000, .08], [240000, .20], [240000, .25], [Infinity, .30]]);
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.TZ.calcPAYE(g), type: "tax" },
        { name: "NSSF (10%)", amount: g * 0.10, type: "pension" }
      ];
    }
  };

  // ── 6. UGANDA ──────────────────────────────────────────────────────────────
  TAX.UG = {
    calcPAYE: function (g) {
      return applyBands(g, [[235000, 0], [100000, .10], [75000, .20], [13423333, .30], [Infinity, .40]]);
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.UG.calcPAYE(g), type: "tax" },
        { name: "NSSF (5%)", amount: g * 0.05, type: "pension" }
      ];
    }
  };

  // ── 7. ETHIOPIA ────────────────────────────────────────────────────────────
  TAX.ET = {
    calcPAYE: function (g) {
      return applyBands(g, [[600, 0], [1050, .10], [1550, .15], [2050, .20], [2550, .25], [3100, .30], [Infinity, .35]]);
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.ET.calcPAYE(g), type: "tax" },
        { name: "Pension (7%)", amount: g * 0.07, type: "pension" }
      ];
    }
  };

  // ── 8. RWANDA ──────────────────────────────────────────────────────────────
  TAX.RW = {
    calcPAYE: function (g) {
      return applyBands(g, [[30000, 0], [70000, .20], [Infinity, .30]]);
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.RW.calcPAYE(g), type: "tax" },
        { name: "RSSB Pension (6%)", amount: g * 0.06, type: "pension" }
      ];
    }
  };

  // ── 9. CAMEROON ────────────────────────────────────────────────────────────
  // IRPP on annual. CNPS 4.2% deductible. Cap at 750k XAF/month insurable.
  TAX.CM = {
    calcPAYE: function (g) {
      var cnps = Math.min(g * 0.042, 31500);
      var taxable = Math.max(0, g * 12 - cnps * 12);
      return applyBands(taxable, [[2000000, .11], [1000000, .165], [2000000, .275], [Infinity, .385]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IRPP Tax", amount: TAX.CM.calcPAYE(g), type: "tax" },
        { name: "CNPS Pension (4.2%)", amount: Math.min(g * 0.042, 31500), type: "pension" }
      ];
    }
  };

  // ── 10. CÔTE D'IVOIRE ──────────────────────────────────────────────────────
  // IS on annual income. ~20% professional deduction. CNPS 6.3%.
  TAX.CI = {
    calcPAYE: function (g) {
      var taxable = g * 12 * 0.80;
      return applyBands(taxable, [[600000, 0], [600000, .015], [1200000, .05], [2400000, .15], [3600000, .20], [6000000, .25], [Infinity, .35]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IS Tax", amount: TAX.CI.calcPAYE(g), type: "tax" },
        { name: "CNPS Pension (6.3%)", amount: Math.min(g * 0.063, 170100), type: "pension" }
      ];
    }
  };

  // ── 11. SENEGAL ────────────────────────────────────────────────────────────
  // IRPP on annual. 30% professional deduction (max 900k XOF). IPRES 5.6%.
  TAX.SN = {
    calcPAYE: function (g) {
      var annual = g * 12;
      var proD = Math.min(annual * 0.30, 900000);
      return applyBands(Math.max(0, annual - proD), [[630000, 0], [870000, .20], [2500000, .30], [4000000, .35], [5600000, .37], [Infinity, .40]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IRPP Tax", amount: TAX.SN.calcPAYE(g), type: "tax" },
        { name: "IPRES Pension (5.6%)", amount: g * 0.056, type: "pension" }
      ];
    }
  };

  // ── 12. MOROCCO ────────────────────────────────────────────────────────────
  // IR on annual. 20% professional deduction (max 30k MAD). CNSS 4.48% (cap 6k/mo). AMO 2.26%.
  TAX.MA = {
    calcPAYE: function (g) {
      var annual = g * 12;
      var proD = Math.min(annual * 0.20, 30000);
      var cnss = Math.min(g * 0.0448, 6000 * 0.0448) * 12;
      var amo = g * 0.0226 * 12;
      var taxable = Math.max(0, annual - proD - cnss - amo);
      return applyBands(taxable, [[30000, 0], [20000, .10], [10000, .20], [20000, .30], [100000, .34], [Infinity, .38]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IR Tax", amount: TAX.MA.calcPAYE(g), type: "tax" },
        { name: "CNSS (4.48%)", amount: Math.min(g * 0.0448, 6000 * 0.0448), type: "pension" },
        { name: "AMO (2.26%)", amount: g * 0.0226, type: "health" }
      ];
    }
  };

  // ── 13. EGYPT ──────────────────────────────────────────────────────────────
  // Annual income tax. NOSI 11% (capped at EGP 12,600/month insurable).
  TAX.EG = {
    calcPAYE: function (g) {
      var nosi = Math.min(g * 0.11, 12600 * 0.11);
      var taxable = Math.max(0, g * 12 - nosi * 12);
      return applyBands(taxable, [[40000, 0], [15000, .10], [15000, .15], [130000, .20], [200000, .225], [800000, .25], [Infinity, .275]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "Income Tax", amount: TAX.EG.calcPAYE(g), type: "tax" },
        { name: "NOSI (11%)", amount: Math.min(g * 0.11, 12600 * 0.11), type: "pension" }
      ];
    }
  };

  // ── 14. ALGERIA ────────────────────────────────────────────────────────────
  // IRG monthly. 25% professional deduction (max 1,500 DZD/month). CNAS 9%.
  TAX.DZ = {
    calcPAYE: function (g) {
      var proD = Math.min(g * 0.25, 1500);
      var cnas = g * 0.09;
      var taxable = Math.max(0, g - proD - cnas);
      return applyBands(taxable, [[15000, 0], [5000, .20], [10000, .24], [20000, .27], [70000, .30], [Infinity, .35]]);
    },
    deductions: function (g) {
      return [
        { name: "IRG Tax", amount: TAX.DZ.calcPAYE(g), type: "tax" },
        { name: "CNAS (9%)", amount: g * 0.09, type: "pension" }
      ];
    }
  };

  // ── 15. TUNISIA ────────────────────────────────────────────────────────────
  // IRPP on annual. 10% professional deduction (max 2k TND/year). CNSS 9.18%.
  TAX.TN = {
    calcPAYE: function (g) {
      var annual = g * 12;
      var proD = Math.min(annual * 0.10, 2000);
      var cnss = g * 0.0918 * 12;
      var taxable = Math.max(0, annual - proD - cnss);
      return applyBands(taxable, [[5000, 0], [15000, .26], [10000, .28], [20000, .32], [Infinity, .35]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IRPP Tax", amount: TAX.TN.calcPAYE(g), type: "tax" },
        { name: "CNSS (9.18%)", amount: g * 0.0918, type: "pension" }
      ];
    }
  };

  // ── 16. BOTSWANA ───────────────────────────────────────────────────────────
  TAX.BW = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[48000, 0], [36000, .05], [36000, .125], [36000, .1875], [Infinity, .25]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.BW.calcPAYE(g), type: "tax" },
        { name: "BPOPF Pension (7.5%)", amount: g * 0.075, type: "pension" }
      ];
    }
  };

  // ── 17. NAMIBIA ────────────────────────────────────────────────────────────
  TAX.NA = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[50000, 0], [50000, .18], [200000, .25], [200000, .28], [300000, .30], [700000, .32], [Infinity, .37]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.NA.calcPAYE(g), type: "tax" },
        { name: "SSC (0.9%)", amount: Math.min(g * 0.009, 81), type: "other" }
      ];
    }
  };

  // ── 18. ZAMBIA ─────────────────────────────────────────────────────────────
  TAX.ZM = {
    calcPAYE: function (g) {
      return applyBands(g, [[4800, 0], [3200, .20], [4100, .30], [Infinity, .375]]);
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.ZM.calcPAYE(g), type: "tax" },
        { name: "NAPSA (5%)", amount: Math.min(g * 0.05, 255), type: "pension" }
      ];
    }
  };

  // ── 19. ZIMBABWE ───────────────────────────────────────────────────────────
  // ZWG (Gold-backed currency). AIDS levy 3% on income tax.
  TAX.ZW = {
    calcPAYE: function (g) {
      var tax = applyBands(g * 12, [[120000, 0], [240000, .20], [360000, .25], [720000, .30], [Infinity, .40]]);
      return (tax * 1.03) / 12; // +3% AIDS levy
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.ZW.calcPAYE(g), type: "tax" },
        { name: "NSSA (4.5%)", amount: g * 0.045, type: "pension" }
      ];
    }
  };

  // ── 20. MAURITIUS ──────────────────────────────────────────────────────────
  // 15% flat on income > MUR 325,000/year. NSF 1%. CSG 3% if < MUR 50k/month.
  TAX.MU = {
    calcPAYE: function (g) {
      var annual = g * 12;
      return annual <= 325000 ? 0 : (annual - 325000) * 0.15 / 12;
    },
    deductions: function (g) {
      return [
        { name: "Income Tax (15%)", amount: TAX.MU.calcPAYE(g), type: "tax" },
        { name: "NSF (1%)", amount: g * 0.01, type: "pension" },
        { name: "CSG (3%)", amount: g < 50000 ? g * 0.03 : 0, type: "health" }
      ];
    }
  };

  // ── 21. MADAGASCAR ─────────────────────────────────────────────────────────
  // IRSA: monthly progressive. Approximate. CNaPS 1%.
  TAX.MG = {
    calcPAYE: function (g) {
      return applyBands(g, [[350000, 0], [50000, .05], [100000, .10], [300000, .15], [Infinity, .20]]);
    },
    deductions: function (g) {
      return [
        { name: "IRSA Tax", amount: TAX.MG.calcPAYE(g), type: "tax" },
        { name: "CNaPS (1%)", amount: g * 0.01, type: "pension" }
      ];
    }
  };

  // ── 22. MALAWI ─────────────────────────────────────────────────────────────
  // No mandatory social security in private sector.
  TAX.MW = {
    calcPAYE: function (g) {
      return applyBands(g, [[100000, 0], [300000, .15], [400000, .25], [200000, .30], [Infinity, .35]]);
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.MW.calcPAYE(g), type: "tax" }
      ];
    }
  };

  // ── 23. ESWATINI ───────────────────────────────────────────────────────────
  TAX.SZ = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[41500, 0], [58500, .20], [50000, .25], [50000, .30], [Infinity, .33]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.SZ.calcPAYE(g), type: "tax" },
        { name: "SNPF (5%)", amount: g * 0.05, type: "pension" }
      ];
    }
  };

  // ── 24. LESOTHO ────────────────────────────────────────────────────────────
  TAX.LS = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[59136, .20], [Infinity, .30]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.LS.calcPAYE(g), type: "tax" },
        { name: "LNPF (10%)", amount: g * 0.10, type: "pension" }
      ];
    }
  };

  // ── 25. ANGOLA ─────────────────────────────────────────────────────────────
  // IRT: monthly progressive (AOA). INSS 3%.
  TAX.AO = {
    calcPAYE: function (g) {
      return applyBands(g, [[100000, 0], [50000, .07], [50000, .11], [100000, .13], [200000, .16], [500000, .18], [Infinity, .19]]);
    },
    deductions: function (g) {
      return [
        { name: "IRT Tax", amount: TAX.AO.calcPAYE(g), type: "tax" },
        { name: "INSS (3%)", amount: g * 0.03, type: "pension" }
      ];
    }
  };

  // ── 26. MOZAMBIQUE ─────────────────────────────────────────────────────────
  // IRPS: monthly. INSS 3%.
  TAX.MZ = {
    calcPAYE: function (g) {
      return applyBands(g, [[3500, 0], [10500, .10], [28000, .15], [84000, .20], [126000, .25], [Infinity, .32]]);
    },
    deductions: function (g) {
      return [
        { name: "IRPS Tax", amount: TAX.MZ.calcPAYE(g), type: "tax" },
        { name: "INSS (3%)", amount: g * 0.03, type: "pension" }
      ];
    }
  };

  // ── 27. DR CONGO ───────────────────────────────────────────────────────────
  // IPR: progressive on monthly gross (CDF). CNSS 5%.
  TAX.CD = {
    calcPAYE: function (g) {
      return applyBands(g, [[524160, 0], [261840, .15], [913800, .30], [Infinity, .40]]);
    },
    deductions: function (g) {
      return [
        { name: "IPR Tax", amount: TAX.CD.calcPAYE(g), type: "tax" },
        { name: "CNSS (5%)", amount: g * 0.05, type: "pension" }
      ];
    }
  };

  // ── 28. REPUBLIC OF CONGO ──────────────────────────────────────────────────
  TAX.CG = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[464000, .01], [600000, .20], [12936000, .40], [Infinity, .45]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IRPP Tax", amount: TAX.CG.calcPAYE(g), type: "tax" },
        { name: "CNSS (4%)", amount: g * 0.04, type: "pension" }
      ];
    }
  };

  // ── 29. GABON ──────────────────────────────────────────────────────────────
  // IRPP on annual. CNSS 2.5% (cap 37,500 XAF/mo). CNAMGS 2% (health).
  TAX.GA = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[1500000, 0], [500000, .05], [500000, .10], [500000, .15], [2000000, .20], [3000000, .25], [4000000, .30], [Infinity, .35]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IRPP Tax", amount: TAX.GA.calcPAYE(g), type: "tax" },
        { name: "CNSS (2.5%)", amount: Math.min(g * 0.025, 37500), type: "pension" },
        { name: "CNAMGS Health (2%)", amount: g * 0.02, type: "health" }
      ];
    }
  };

  // ── 30. BURKINA FASO ───────────────────────────────────────────────────────
  // IUTS on annual. CNSS 5.5% (cap 600k/month).
  TAX.BF = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[300000, 0], [300000, .12], [300000, .14], [600000, .18], [1500000, .23], [Infinity, .275]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IUTS Tax", amount: TAX.BF.calcPAYE(g), type: "tax" },
        { name: "CNSS (5.5%)", amount: Math.min(g * 0.055, 33000), type: "pension" }
      ];
    }
  };

  // ── 31. MALI ───────────────────────────────────────────────────────────────
  TAX.ML = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[600000, 0], [600000, .10], [1200000, .18], [2400000, .26], [4800000, .33], [Infinity, .40]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "ITS Tax", amount: TAX.ML.calcPAYE(g), type: "tax" },
        { name: "INPS (3.6%)", amount: g * 0.036, type: "pension" }
      ];
    }
  };

  // ── 32. NIGER ──────────────────────────────────────────────────────────────
  TAX.NE = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[600000, 0], [300000, .08], [600000, .14], [1200000, .20], [1800000, .26], [Infinity, .35]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IUTS Tax", amount: TAX.NE.calcPAYE(g), type: "tax" },
        { name: "CNSS (5.25%)", amount: g * 0.0525, type: "pension" }
      ];
    }
  };

  // ── 33. GUINEA ─────────────────────────────────────────────────────────────
  TAX.GN = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[1200000, 0], [600000, .05], [1200000, .10], [2400000, .15], [6000000, .20], [8800000, .25], [Infinity, .35]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "ITS Tax", amount: TAX.GN.calcPAYE(g), type: "tax" },
        { name: "CNSS (5%)", amount: g * 0.05, type: "pension" }
      ];
    }
  };

  // ── 34. TOGO ───────────────────────────────────────────────────────────────
  TAX.TG = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[600000, 0], [600000, .07], [1200000, .12], [2400000, .22], [Infinity, .35]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IRPP Tax", amount: TAX.TG.calcPAYE(g), type: "tax" },
        { name: "CNSS (4%)", amount: g * 0.04, type: "pension" }
      ];
    }
  };

  // ── 35. BENIN ──────────────────────────────────────────────────────────────
  TAX.BJ = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[600000, 0], [600000, .13], [1200000, .22], [2400000, .30], [Infinity, .35]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IRPP Tax", amount: TAX.BJ.calcPAYE(g), type: "tax" },
        { name: "CNSS (3.6%)", amount: g * 0.036, type: "pension" }
      ];
    }
  };

  // ── 36. SIERRA LEONE ───────────────────────────────────────────────────────
  TAX.SL = {
    calcPAYE: function (g) {
      return applyBands(g, [[500000, 0], [500000, .15], [500000, .20], [1000000, .25], [Infinity, .30]]);
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.SL.calcPAYE(g), type: "tax" },
        { name: "NASSIT (5%)", amount: g * 0.05, type: "pension" }
      ];
    }
  };

  // ── 37. LIBERIA ────────────────────────────────────────────────────────────
  TAX.LR = {
    calcPAYE: function (g) {
      return applyBands(g, [[5000, 0], [5000, .05], [5000, .10], [5000, .15], [5000, .20], [Infinity, .25]]);
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.LR.calcPAYE(g), type: "tax" },
        { name: "NASSCORP (3%)", amount: g * 0.03, type: "pension" }
      ];
    }
  };

  // ── 38. GAMBIA ─────────────────────────────────────────────────────────────
  TAX.GM = {
    calcPAYE: function (g) {
      return applyBands(g, [[22000, 0], [8000, .10], [20000, .15], [20000, .20], [30000, .25], [Infinity, .30]]);
    },
    deductions: function (g) {
      return [
        { name: "PAYE Tax", amount: TAX.GM.calcPAYE(g), type: "tax" },
        { name: "SSHFC (5%)", amount: g * 0.05, type: "pension" }
      ];
    }
  };

  // ── 39. GUINEA-BISSAU ──────────────────────────────────────────────────────
  TAX.GW = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[900000, 0], [900000, .10], [2400000, .20], [Infinity, .35]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IRPS Tax", amount: TAX.GW.calcPAYE(g), type: "tax" },
        { name: "INSS (5%)", amount: g * 0.05, type: "pension" }
      ];
    }
  };

  // ── 40. CABO VERDE ─────────────────────────────────────────────────────────
  TAX.CV = {
    calcPAYE: function (g) {
      return applyBands(g, [[22000, 0], [18000, .165], [30000, .231], [20000, .26], [30000, .275], [Infinity, .35]]);
    },
    deductions: function (g) {
      return [
        { name: "IUR Tax", amount: TAX.CV.calcPAYE(g), type: "tax" },
        { name: "INPS (8%)", amount: g * 0.08, type: "pension" }
      ];
    }
  };

  // ── 41. MAURITANIA ─────────────────────────────────────────────────────────
  TAX.MR = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[180000, 0], [360000, .15], [540000, .25], [Infinity, .40]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "ITS Tax", amount: TAX.MR.calcPAYE(g), type: "tax" },
        { name: "CNAM Health (1%)", amount: g * 0.01, type: "health" }
      ];
    }
  };

  // ── 42. SÃO TOMÉ & PRÍNCIPE ────────────────────────────────────────────────
  TAX.ST = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[72000, 0], [120000, .10], [200000, .15], [Infinity, .25]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IRS Tax", amount: TAX.ST.calcPAYE(g), type: "tax" },
        { name: "INSS (5%)", amount: g * 0.05, type: "pension" }
      ];
    }
  };

  // ── 43. BURUNDI ────────────────────────────────────────────────────────────
  TAX.BI = {
    calcPAYE: function (g) {
      return applyBands(g, [[150000, 0], [150000, .20], [200000, .25], [Infinity, .35]]);
    },
    deductions: function (g) {
      return [
        { name: "IPR Tax", amount: TAX.BI.calcPAYE(g), type: "tax" },
        { name: "INSS (5%)", amount: g * 0.05, type: "pension" }
      ];
    }
  };

  // ── 44. SOMALIA ────────────────────────────────────────────────────────────
  // Simplified (no fully formalised progressive system documented).
  TAX.SO = {
    calcPAYE: function (g) {
      return g <= 500000 ? g * 0.05 : g * 0.10;
    },
    deductions: function (g) {
      return [
        { name: "Income Tax", amount: TAX.SO.calcPAYE(g), type: "tax" }
      ];
    }
  };

  // ── 45. SOUTH SUDAN ────────────────────────────────────────────────────────
  TAX.SS = {
    calcPAYE: function (g) {
      return applyBands(g, [[5000, 0], [5000, .10], [10000, .15], [Infinity, .20]]);
    },
    deductions: function (g) {
      return [
        { name: "PITA Tax", amount: TAX.SS.calcPAYE(g), type: "tax" },
        { name: "Pension (8%)", amount: g * 0.08, type: "pension" }
      ];
    }
  };

  // ── 46. ERITREA ────────────────────────────────────────────────────────────
  TAX.ER = {
    calcPAYE: function (g) {
      return applyBands(g, [[500, .02], [500, .05], [1000, .10], [1000, .15], [2000, .20], [Infinity, .30]]);
    },
    deductions: function (g) {
      return [
        { name: "Income Tax", amount: TAX.ER.calcPAYE(g), type: "tax" },
        { name: "SSC (6%)", amount: g * 0.06, type: "pension" }
      ];
    }
  };

  // ── 47. DJIBOUTI ───────────────────────────────────────────────────────────
  TAX.DJ = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[480000, 0], [480000, .08], [960000, .18], [Infinity, .30]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IRPP Tax", amount: TAX.DJ.calcPAYE(g), type: "tax" },
        { name: "ONSS (4%)", amount: g * 0.04, type: "pension" }
      ];
    }
  };

  // ── 48. COMOROS ────────────────────────────────────────────────────────────
  TAX.KM = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[360000, 0], [480000, .10], [600000, .15], [Infinity, .30]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IGR Tax", amount: TAX.KM.calcPAYE(g), type: "tax" },
        { name: "CNPS (6%)", amount: g * 0.06, type: "pension" }
      ];
    }
  };

  // ── 49. LIBYA ──────────────────────────────────────────────────────────────
  // No personal income tax in Libya.
  TAX.LY = {
    calcPAYE: function () { return 0; },
    deductions: function (g) {
      return [
        { name: "Social Security (3.75%)", amount: g * 0.0375, type: "pension" }
      ];
    }
  };

  // ── 50. SUDAN ──────────────────────────────────────────────────────────────
  TAX.SD = {
    calcPAYE: function (g) {
      return applyBands(g, [[500, 0], [500, .05], [4000, .10], [5000, .15], [10000, .20], [Infinity, .30]]);
    },
    deductions: function (g) {
      return [
        { name: "Income Tax", amount: TAX.SD.calcPAYE(g), type: "tax" },
        { name: "NSIF (8%)", amount: g * 0.08, type: "pension" }
      ];
    }
  };

  // ── 51. SEYCHELLES ─────────────────────────────────────────────────────────
  TAX.SC = {
    calcPAYE: function (g) {
      return applyBands(g, [[8555, 0], [74945, .15], [Infinity, .20]]);
    },
    deductions: function (g) {
      return [
        { name: "Income Tax", amount: TAX.SC.calcPAYE(g), type: "tax" },
        { name: "Social Security (2.5%)", amount: g * 0.025, type: "pension" }
      ];
    }
  };

  // ── 52. EQUATORIAL GUINEA ──────────────────────────────────────────────────
  TAX.GQ = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[1000000, 0], [1000000, .10], [3000000, .20], [Infinity, .35]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IRPF Tax", amount: TAX.GQ.calcPAYE(g), type: "tax" },
        { name: "INSESO (5%)", amount: g * 0.05, type: "pension" }
      ];
    }
  };

  // ── 53. CENTRAL AFRICAN REPUBLIC ───────────────────────────────────────────
  TAX.CF = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[600000, 0], [600000, .10], [1800000, .20], [3000000, .30], [Infinity, .40]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IRPP Tax", amount: TAX.CF.calcPAYE(g), type: "tax" },
        { name: "CNSS (5%)", amount: g * 0.05, type: "pension" }
      ];
    }
  };

  // ── 54. CHAD ───────────────────────────────────────────────────────────────
  TAX.TD = {
    calcPAYE: function (g) {
      return applyBands(g * 12, [[800000, 0], [800000, .08], [2400000, .20], [Infinity, .30]]) / 12;
    },
    deductions: function (g) {
      return [
        { name: "IRPP Tax", amount: TAX.TD.calcPAYE(g), type: "tax" },
        { name: "CNPS (3.5%)", amount: g * 0.035, type: "pension" }
      ];
    }
  };

  // ─── MAIN CALCULATE FUNCTION ───────────────────────────────────────────────
  function calculate(inputs) {
    var c = inputs.country;
    var country = COUNTRIES[c];
    if (!country) return null;
    var sym = country.symbol;

    var basic     = +inputs.basic     || 0;
    var housing   = +inputs.housing   || 0;
    var transport = +inputs.transport || 0;
    var other     = +inputs.other     || 0;
    var overtime  = +inputs.overtime  || 0;
    var bonus     = +inputs.bonus     || 0;
    var gross = basic + housing + transport + other + overtime + bonus;

    var deductions = TAX[c] ? TAX[c].deductions(gross) : [];

    // Append custom deductions
    if (inputs.customDeductions) {
      inputs.customDeductions.forEach(function (cd) {
        if (cd.label && +cd.amount > 0) {
          deductions.push({ name: cd.label, amount: +cd.amount, type: "custom" });
        }
      });
    }

    var totalDed = deductions.reduce(function (s, d) { return s + d.amount; }, 0);
    var net = gross - totalDed;

    var earnings = [
      { name: "Basic Salary",      amount: basic     },
      { name: "Housing Allowance", amount: housing   },
      { name: "Transport Allowance", amount: transport }
    ];
    if (other    > 0) earnings.push({ name: "Other Allowances", amount: other    });
    if (overtime > 0) earnings.push({ name: "Overtime",         amount: overtime });
    if (bonus    > 0) earnings.push({ name: "Bonus",            amount: bonus    });
    earnings = earnings.filter(function (e) { return e.amount > 0; });

    return {
      country: c, countryName: country.name,
      currency: country.currency, symbol: sym,
      fmt: function (n) { return sym + " " + Math.round(n).toLocaleString("en-US"); },
      company:   inputs.company   || "",
      address:   inputs.address   || "",
      empName:   inputs.empName   || "",
      empId:     inputs.empId     || "",
      period:    inputs.period    || "",
      dept:      inputs.dept      || "",
      jobTitle:  inputs.jobTitle  || "",
      taxId:     inputs.taxId     || "",
      earnings:  earnings,
      deductions: deductions,
      gross: gross, totalDeductions: totalDed, net: net,
      fxEnabled: inputs.fxEnabled || false,
      fxBase:    inputs.fxBase    || "USD",
      fxRate:    +inputs.fxRate   || 1,
      leaveEnabled: inputs.leaveEnabled || false,
      leaveDays:    inputs.leaveDays    || 0,
      style: inputs.style || "corporate"
    };
  }

  // ─── HOUSING ALLOWANCE OPTIMIZER ──────────────────────────────────────────
  function optimizeHousing(inputs) {
    var c = inputs.country;
    var taxObj = TAX[c];
    if (!taxObj || !taxObj.calcPAYE) return null;

    var transport = +inputs.transport || 0;
    var other     = +inputs.other     || 0;
    var overtime  = +inputs.overtime  || 0;
    var bonus     = +inputs.bonus     || 0;
    var pool = (+inputs.basic || 0) + (+inputs.housing || 0);
    var curGross = pool + transport + other + overtime + bonus;
    var curPAYE = taxObj.calcPAYE(curGross);

    var best = null, bestPAYE = Infinity;
    for (var pct = 10; pct <= 90; pct += 5) {
      var basic   = Math.round(pool * pct / 100 / 1000) * 1000;
      var housing = pool - basic;
      var paye    = taxObj.calcPAYE(basic + housing + transport + other + overtime + bonus);
      if (paye < bestPAYE) { bestPAYE = paye; best = { basic: basic, housing: housing, paye: paye }; }
    }

    if (!best || best.paye >= curPAYE) return null;
    return {
      currentBasic:   +inputs.basic   || 0,
      currentHousing: +inputs.housing || 0,
      currentPAYE:    curPAYE,
      optimalBasic:   best.basic,
      optimalHousing: best.housing,
      optimalPAYE:    best.paye,
      monthlySavings: curPAYE - best.paye,
      annualSavings:  (curPAYE - best.paye) * 12
    };
  }

  // ─── EXPORT ───────────────────────────────────────────────────────────────
  window.AfroTools.PayslipEngine = {
    COUNTRIES:      COUNTRIES,
    TAX:            TAX,
    calculate:      calculate,
    optimizeHousing: optimizeHousing
  };

}());
