/* ════════════════════════════════════════════════════════════
   Francophone Africa PAYE Engine
   Configurable per country — covers WAEMU (XOF), CEMAC (XAF),
   Morocco (MAD), DRC (CDF), and standalone francophone nations.
   TODO: Verify exact 2026 rates before production deployment
   ════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  var COUNTRY_CONFIG = {

    /* ── CÔTE D'IVOIRE ──────────────────────────────────── */
    'CI': {
      name:             "C\u00f4te d'Ivoire",
      nameLocal:        "C\u00f4te d'Ivoire",
      slug:             'cote-divoire',
      flag:             '\uD83C\uDDE8\uD83C\uDDEE',
      currency:         'XOF',
      currencySymbol:   'FCFA',
      taxAuthority:     'DGI',
      taxAuthorityFull: "Direction G\u00e9n\u00e9rale des Imp\u00f4ts",
      /* IS (Impôt sur les Salaires) — progressive annual bands */
      incomeTaxBands: [
        { min: 0,        max: 300000,   rate: 0 },
        { min: 300001,   max: 526000,   rate: 0.016 },
        { min: 526001,   max: 942000,   rate: 0.0367 },
        { min: 942001,   max: 1620000,  rate: 0.075 },
        { min: 1620001,  max: 2700000,  rate: 0.14 },
        { min: 2700001,  max: 4860000,  rate: 0.185 },
        { min: 4860001,  max: 9000000,  rate: 0.25 },
        { min: 9000001,  max: 15000000, rate: 0.30 },
        { min: 15000001, max: Infinity,  rate: 0.35 }
      ],
      socialSecurity: {
        name: 'CNPS',
        employeeRate: 0.063,
        ceiling: 70000 * 12
      },
      additionalTaxes: [
        { name: 'Contribution Nationale (CN)', rate: 0.015, onTax: false }
      ]
    },

    /* ── SENEGAL ─────────────────────────────────────────── */
    'SN': {
      name:             'Senegal',
      nameLocal:        'S\u00e9n\u00e9gal',
      slug:             'senegal',
      flag:             '\uD83C\uDDF8\uD83C\uDDF3',
      currency:         'XOF',
      currencySymbol:   'FCFA',
      taxAuthority:     'DGID',
      taxAuthorityFull: "Direction G\u00e9n\u00e9rale des Imp\u00f4ts et des Domaines",
      incomeTaxBands: [
        { min: 0,        max: 630000,    rate: 0 },
        { min: 630001,   max: 1500000,   rate: 0.20 },
        { min: 1500001,  max: 4000000,   rate: 0.30 },
        { min: 4000001,  max: 8000000,   rate: 0.35 },
        { min: 8000001,  max: 13500000,  rate: 0.37 },
        { min: 13500001, max: Infinity,   rate: 0.40 }
      ],
      socialSecurity: {
        name: 'IPRES',
        employeeRate: 0.056,
        ceiling: 0
      },
      additionalTaxes: [
        { name: 'CSS (Caisse de S\u00e9curit\u00e9 Sociale)', rate: 0.056, onTax: false }
      ]
    },

    /* ── CAMEROON ────────────────────────────────────────── */
    'CM': {
      name:             'Cameroon',
      nameLocal:        'Cameroun',
      slug:             'cameroun',
      flag:             '\uD83C\uDDE8\uD83C\uDDF2',
      currency:         'XAF',
      currencySymbol:   'FCFA',
      taxAuthority:     'DGI',
      taxAuthorityFull: "Direction G\u00e9n\u00e9rale des Imp\u00f4ts",
      incomeTaxBands: [
        { min: 0,        max: 2000000,  rate: 0.10 },
        { min: 2000001,  max: 3000000,  rate: 0.15 },
        { min: 3000001,  max: 5000000,  rate: 0.25 },
        { min: 5000001,  max: Infinity,  rate: 0.35 }
      ],
      socialSecurity: {
        name: 'CNPS',
        employeeRate: 0.042,
        ceiling: 750000 * 12
      },
      additionalTaxes: [
        { name: 'Centimes Additionnels Communaux (CAC)', rate: 0.10, onTax: true }
      ]
    },

    /* ── DRC (RD Congo) ─────────────────────────────────── */
    'CD': {
      name:             'DR Congo',
      nameLocal:        'R\u00e9publique D\u00e9mocratique du Congo',
      slug:             'rdc',
      flag:             '\uD83C\uDDE8\uD83C\uDDE9',
      currency:         'CDF',
      currencySymbol:   'FC',
      taxAuthority:     'DGI',
      taxAuthorityFull: "Direction G\u00e9n\u00e9rale des Imp\u00f4ts",
      incomeTaxBands: [
        { min: 0,          max: 524160,    rate: 0.03 },
        { min: 524161,     max: 1428000,   rate: 0.15 },
        { min: 1428001,    max: 2700000,   rate: 0.30 },
        { min: 2700001,    max: Infinity,   rate: 0.40 }
      ],
      socialSecurity: {
        name: 'CNSS',
        employeeRate: 0.05,
        ceiling: 0
      },
      additionalTaxes: []
    },

    /* ── MOROCCO ─────────────────────────────────────────── */
    'MA': {
      name:             'Morocco',
      nameLocal:        'Maroc',
      slug:             'maroc',
      flag:             '\uD83C\uDDF2\uD83C\uDDE6',
      currency:         'MAD',
      currencySymbol:   'MAD',
      taxAuthority:     'DGI',
      taxAuthorityFull: "Direction G\u00e9n\u00e9rale des Imp\u00f4ts",
      incomeTaxBands: [
        { min: 0,       max: 30000,   rate: 0 },
        { min: 30001,   max: 50000,   rate: 0.10 },
        { min: 50001,   max: 60000,   rate: 0.20 },
        { min: 60001,   max: 80000,   rate: 0.30 },
        { min: 80001,   max: 180000,  rate: 0.34 },
        { min: 180001,  max: Infinity, rate: 0.38 }
      ],
      socialSecurity: {
        name: 'CNSS',
        employeeRate: 0.0448,
        ceiling: 6000 * 12
      },
      additionalTaxes: []
    },

    /* ── ALGERIA ──────────────────────────────────────────── */
    'DZ': {
      name:             'Algeria',
      nameLocal:        'Alg\u00e9rie',
      slug:             'algerie',
      flag:             '\uD83C\uDDE9\uD83C\uDDFF',
      currency:         'DZD',
      currencySymbol:   'DA',
      taxAuthority:     'DGI',
      taxAuthorityFull: "Direction G\u00e9n\u00e9rale des Imp\u00f4ts",
      incomeTaxBands: [
        { min: 0,        max: 240000,   rate: 0 },
        { min: 240001,   max: 480000,   rate: 0.23 },
        { min: 480001,   max: 960000,   rate: 0.27 },
        { min: 960001,   max: 1920000,  rate: 0.30 },
        { min: 1920001,  max: 3840000,  rate: 0.33 },
        { min: 3840001,  max: Infinity,  rate: 0.35 }
      ],
      socialSecurity: {
        name: 'CNAS',
        employeeRate: 0.09,
        ceiling: 0
      },
      additionalTaxes: []
    },

    /* ── TUNISIA ──────────────────────────────────────────── */
    'TN': {
      name:             'Tunisia',
      nameLocal:        'Tunisie',
      slug:             'tunisie',
      flag:             '\uD83C\uDDF9\uD83C\uDDF3',
      currency:         'TND',
      currencySymbol:   'DT',
      taxAuthority:     'DGI',
      taxAuthorityFull: "Direction G\u00e9n\u00e9rale des Imp\u00f4ts",
      incomeTaxBands: [
        { min: 0,       max: 5000,    rate: 0 },
        { min: 5001,    max: 20000,   rate: 0.26 },
        { min: 20001,   max: 30000,   rate: 0.28 },
        { min: 30001,   max: 50000,   rate: 0.32 },
        { min: 50001,   max: Infinity, rate: 0.35 }
      ],
      socialSecurity: {
        name: 'CNSS',
        employeeRate: 0.0918,
        ceiling: 0
      },
      additionalTaxes: []
    },

    /* ── MALI ─────────────────────────────────────────────── */
    'ML': {
      name:             'Mali',
      nameLocal:        'Mali',
      slug:             'mali',
      flag:             '\uD83C\uDDF2\uD83C\uDDF1',
      currency:         'XOF',
      currencySymbol:   'FCFA',
      taxAuthority:     'DGI',
      taxAuthorityFull: "Direction G\u00e9n\u00e9rale des Imp\u00f4ts",
      incomeTaxBands: [
        { min: 0,        max: 330000,   rate: 0 },
        { min: 330001,   max: 630000,   rate: 0.05 },
        { min: 630001,   max: 1500000,  rate: 0.13 },
        { min: 1500001,  max: 3600000,  rate: 0.30 },
        { min: 3600001,  max: Infinity,  rate: 0.40 }
      ],
      socialSecurity: {
        name: 'INPS',
        employeeRate: 0.036,
        ceiling: 0
      },
      additionalTaxes: []
    },

    /* ── BURKINA FASO ─────────────────────────────────────── */
    'BF': {
      name:             'Burkina Faso',
      nameLocal:        'Burkina Faso',
      slug:             'burkina-faso',
      flag:             '\uD83C\uDDE7\uD83C\uDDEB',
      currency:         'XOF',
      currencySymbol:   'FCFA',
      taxAuthority:     'DGI',
      taxAuthorityFull: "Direction G\u00e9n\u00e9rale des Imp\u00f4ts",
      incomeTaxBands: [
        { min: 0,        max: 300000,   rate: 0 },
        { min: 300001,   max: 600000,   rate: 0.0825 },
        { min: 600001,   max: 900000,   rate: 0.1375 },
        { min: 900001,   max: 1500000,  rate: 0.165 },
        { min: 1500001,  max: 3000000,  rate: 0.22 },
        { min: 3000001,  max: Infinity,  rate: 0.275 }
      ],
      socialSecurity: {
        name: 'CNSS',
        employeeRate: 0.055,
        ceiling: 600000 * 12
      },
      additionalTaxes: []
    },

    /* ── NIGER ─────────────────────────────────────────────── */
    'NE': {
      name:             'Niger',
      nameLocal:        'Niger',
      slug:             'niger',
      flag:             '\uD83C\uDDF3\uD83C\uDDEA',
      currency:         'XOF',
      currencySymbol:   'FCFA',
      taxAuthority:     'DGI',
      taxAuthorityFull: "Direction G\u00e9n\u00e9rale des Imp\u00f4ts",
      incomeTaxBands: [
        { min: 0,        max: 300000,   rate: 0 },
        { min: 300001,   max: 550000,   rate: 0.01 },
        { min: 550001,   max: 1000000,  rate: 0.10 },
        { min: 1000001,  max: 1600000,  rate: 0.15 },
        { min: 1600001,  max: 4000000,  rate: 0.25 },
        { min: 4000001,  max: Infinity,  rate: 0.35 }
      ],
      socialSecurity: {
        name: 'CNSS',
        employeeRate: 0.0417,
        ceiling: 0
      },
      additionalTaxes: []
    },

    /* ── GUINEA (Conakry) ─────────────────────────────────── */
    'GN': {
      name:             'Guinea',
      nameLocal:        'Guin\u00e9e',
      slug:             'guinee',
      flag:             '\uD83C\uDDEC\uD83C\uDDF3',
      currency:         'GNF',
      currencySymbol:   'FG',
      taxAuthority:     'DNI',
      taxAuthorityFull: "Direction Nationale des Imp\u00f4ts",
      incomeTaxBands: [
        { min: 0,          max: 5000000,   rate: 0 },
        { min: 5000001,    max: 10000000,  rate: 0.05 },
        { min: 10000001,   max: 15000000,  rate: 0.10 },
        { min: 15000001,   max: 20000000,  rate: 0.15 },
        { min: 20000001,   max: 50000000,  rate: 0.20 },
        { min: 50000001,   max: 100000000, rate: 0.25 },
        { min: 100000001,  max: Infinity,   rate: 0.35 }
      ],
      socialSecurity: {
        name: 'CNSS',
        employeeRate: 0.05,
        ceiling: 0
      },
      additionalTaxes: []
    },

    /* ── CONGO-BRAZZAVILLE ────────────────────────────────── */
    'CG': {
      name:             'Congo',
      nameLocal:        'Congo-Brazzaville',
      slug:             'congo',
      flag:             '\uD83C\uDDE8\uD83C\uDDEC',
      currency:         'XAF',
      currencySymbol:   'FCFA',
      taxAuthority:     'DGI',
      taxAuthorityFull: "Direction G\u00e9n\u00e9rale des Imp\u00f4ts",
      incomeTaxBands: [
        { min: 0,        max: 464000,   rate: 0.01 },
        { min: 464001,   max: 1000000,  rate: 0.10 },
        { min: 1000001,  max: 3000000,  rate: 0.25 },
        { min: 3000001,  max: 8000000,  rate: 0.40 },
        { min: 8000001,  max: Infinity,  rate: 0.45 }
      ],
      socialSecurity: {
        name: 'CNSS',
        employeeRate: 0.04,
        ceiling: 0
      },
      additionalTaxes: []
    },

    /* ── GABON ─────────────────────────────────────────────── */
    'GA': {
      name:             'Gabon',
      nameLocal:        'Gabon',
      slug:             'gabon',
      flag:             '\uD83C\uDDEC\uD83C\uDDE6',
      currency:         'XAF',
      currencySymbol:   'FCFA',
      taxAuthority:     'DGI',
      taxAuthorityFull: "Direction G\u00e9n\u00e9rale des Imp\u00f4ts",
      incomeTaxBands: [
        { min: 0,        max: 1500000,  rate: 0 },
        { min: 1500001,  max: 1920000,  rate: 0.05 },
        { min: 1920001,  max: 2500000,  rate: 0.10 },
        { min: 2500001,  max: 3500000,  rate: 0.15 },
        { min: 3500001,  max: 5000000,  rate: 0.20 },
        { min: 5000001,  max: 7500000,  rate: 0.25 },
        { min: 7500001,  max: 10000000, rate: 0.30 },
        { min: 10000001, max: Infinity,  rate: 0.35 }
      ],
      socialSecurity: {
        name: 'CNSS',
        employeeRate: 0.025,
        ceiling: 1500000 * 12
      },
      additionalTaxes: [
        { name: 'CNAMGS (Assurance maladie)', rate: 0.02, onTax: false }
      ]
    },

    /* ── TOGO ──────────────────────────────────────────────── */
    'TG': {
      name:             'Togo',
      nameLocal:        'Togo',
      slug:             'togo',
      flag:             '\uD83C\uDDF9\uD83C\uDDEC',
      currency:         'XOF',
      currencySymbol:   'FCFA',
      taxAuthority:     'OTR',
      taxAuthorityFull: "Office Togolais des Recettes",
      incomeTaxBands: [
        { min: 0,        max: 900000,   rate: 0 },
        { min: 900001,   max: 4000000,  rate: 0.07 },
        { min: 4000001,  max: 6000000,  rate: 0.15 },
        { min: 6000001,  max: 10000000, rate: 0.25 },
        { min: 10000001, max: Infinity,  rate: 0.35 }
      ],
      socialSecurity: {
        name: 'CNSS',
        employeeRate: 0.04,
        ceiling: 0
      },
      additionalTaxes: []
    }
  };

  /* ── Generic PAYE calculation ──────────────────────────── */
  function calculate(countryCode, grossAnnual) {
    var config = COUNTRY_CONFIG[countryCode];
    if (!config) return { error: 'Country not configured' };

    /* Social security */
    var ssBase = grossAnnual;
    if (config.socialSecurity.ceiling > 0) {
      ssBase = Math.min(grossAnnual, config.socialSecurity.ceiling);
    }
    var socialSecurityAnnual = ssBase * config.socialSecurity.employeeRate;

    /* Taxable income = gross minus social security */
    var taxableAnnual = Math.max(0, grossAnnual - socialSecurityAnnual);

    /* Income tax — progressive bands */
    var taxAnnual = 0;
    var bandBreakdown = [];
    for (var i = 0; i < config.incomeTaxBands.length; i++) {
      var band = config.incomeTaxBands[i];
      if (taxableAnnual > band.min) {
        var top = (band.max === Infinity) ? taxableAnnual : Math.min(taxableAnnual, band.max);
        var taxableInBand = top - band.min;
        var bandTax = taxableInBand * band.rate;
        taxAnnual += bandTax;
        bandBreakdown.push({ rate: band.rate, income: taxableInBand, tax: bandTax });
      }
    }

    /* Additional taxes */
    var additionalTaxAnnual = 0;
    var additionalBreakdown = [];
    for (var j = 0; j < config.additionalTaxes.length; j++) {
      var addTax = config.additionalTaxes[j];
      var amount;
      if (addTax.onTax) {
        amount = taxAnnual * addTax.rate;
      } else {
        amount = grossAnnual * addTax.rate;
      }
      additionalTaxAnnual += amount;
      additionalBreakdown.push({ name: addTax.name, annual: amount, monthly: amount / 12 });
    }

    var totalTaxAnnual = taxAnnual + additionalTaxAnnual;
    var totalDeductionsAnnual = socialSecurityAnnual + totalTaxAnnual;
    var netAnnual = grossAnnual - totalDeductionsAnnual;

    return {
      country:          config.name,
      countryLocal:     config.nameLocal,
      countryCode:      countryCode,
      currency:         config.currency,
      currencySymbol:   config.currencySymbol,
      taxAuthority:     config.taxAuthority,
      taxAuthorityFull: config.taxAuthorityFull,
      flag:             config.flag,
      grossAnnual:      grossAnnual,
      grossMonthly:     grossAnnual / 12,
      socialSecurity: {
        name:    config.socialSecurity.name,
        rate:    config.socialSecurity.employeeRate,
        annual:  socialSecurityAnnual,
        monthly: socialSecurityAnnual / 12
      },
      taxableAnnual:    taxableAnnual,
      incomeTax: {
        annual:  taxAnnual,
        monthly: taxAnnual / 12
      },
      bandBreakdown:    bandBreakdown,
      additionalTaxes:  additionalBreakdown,
      totalTax: {
        annual:  totalTaxAnnual,
        monthly: totalTaxAnnual / 12
      },
      totalDeductions: {
        annual:  totalDeductionsAnnual,
        monthly: totalDeductionsAnnual / 12
      },
      netAnnual:        netAnnual,
      netMonthly:       netAnnual / 12,
      effectiveRate:    grossAnnual > 0 ? totalTaxAnnual / grossAnnual : 0
    };
  }

  /* Expose */
  window.FrancoPayeEngine = { calculate: calculate, COUNTRY_CONFIG: COUNTRY_CONFIG };
})();
