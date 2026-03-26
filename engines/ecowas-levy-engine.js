var EcowasLevyEngine = (function () {
  'use strict';

  /* ── embedded data ───────────────────────────────────── */
  var TARIFF_BANDS = [
    { band: 0, rate: 0,  label: 'Band 0 — Essential Goods',  description: 'Essential social goods', examples: 'Essential medicines, medical equipment, textbooks, agricultural inputs (seeds, fertilisers)' },
    { band: 1, rate: 5,  label: 'Band 1 — Raw Materials',    description: 'Raw materials, capital goods, equipment', examples: 'Raw materials, industrial machinery, spare parts, IT equipment' },
    { band: 2, rate: 10, label: 'Band 2 — Intermediate',     description: 'Intermediate goods', examples: 'Semi-processed inputs, construction materials (cement, iron rods), chemicals' },
    { band: 3, rate: 20, label: 'Band 3 — Consumer Goods',   description: 'Consumer goods', examples: 'Finished consumer products, electronics, clothing, furniture, vehicles' },
    { band: 4, rate: 35, label: 'Band 4 — Special Dev.',     description: 'Specific goods for economic development', examples: 'Frozen poultry, rice, sugar, tomato paste, vegetable oils' }
  ];

  var LEVIES = {
    communityLevy:  { name: 'ECOWAS Community Levy', rate: 0.5,  base: 'CIF', label: 'CL' },
    solidarityLevy: { name: 'ECOWAS Solidarity Levy', rate: 0.0, base: 'CIF', label: 'SL' },
    statisticalFee: { name: 'Statistical Fee',        rate: 1.0, base: 'CIF', label: 'SF' }
  };

  var COUNTRY_SUPPLEMENTS = {
    NG: {
      name: 'Nigeria', flag: '🇳🇬',
      extras: [
        { name: 'CISS',     rate: 1.0,  base: 'fob',         description: 'Comprehensive Import Supervision Scheme' },
        { name: 'ETLS',     rate: 0.5,  base: 'cif',         description: 'ECOWAS Trade Liberalisation Scheme levy' },
        { name: 'Surcharge',rate: 7.0,  base: 'duty',        description: '7% surcharge on customs duty' },
        { name: 'VAT',      rate: 7.5,  base: 'cif_duty_levy', description: 'Value Added Tax' }
      ],
      specialRates: {
        '1006': { rate: 50, notes: 'Rice — supplementary protection above CET Band 4' },
        '8703': { rate: 35, notes: 'Vehicles — additional NAC levy applies' },
        '2523': { rate: 45, notes: 'Cement — import ban or prohibitive tariff' }
      }
    },
    GH: {
      name: 'Ghana', flag: '🇬🇭',
      extras: [
        { name: 'NHIL',        rate: 2.5,  base: 'cif_duty', description: 'National Health Insurance Levy' },
        { name: 'GETFund',     rate: 2.5,  base: 'cif_duty', description: 'Ghana Education Trust Fund Levy' },
        { name: 'AU Levy',     rate: 0.2,  base: 'cif',      description: 'African Union levy' },
        { name: 'Processing',  rate: 2.0,  base: 'cif',      description: 'Examination / processing fee' },
        { name: 'VAT',         rate: 15,   base: 'cif_duty_levy', description: 'Value Added Tax' }
      ],
      specialRates: {}
    },
    CI: {
      name: 'Côte d\'Ivoire', flag: '🇨🇮',
      extras: [
        { name: 'PCS',                  rate: 0.75, base: 'cif',      description: 'Port & Customs Stamp' },
        { name: 'Redevance Statistique',rate: 1.0,  base: 'cif',      description: 'Statistical fee' },
        { name: 'TVA',                  rate: 18,   base: 'cif_duty_levy', description: 'Value Added Tax (TVA)' }
      ],
      specialRates: {}
    },
    SN: {
      name: 'Senegal', flag: '🇸🇳',
      extras: [
        { name: 'Redevance Statistique', rate: 1.0,  base: 'cif',      description: 'Statistical fee' },
        { name: 'TVA',                   rate: 18,   base: 'cif_duty_levy', description: 'Value Added Tax (TVA)' },
        { name: 'COSEC',                 rate: 0.2,  base: 'cif',      description: 'Conseil Sénégalais des Chargeurs' }
      ],
      specialRates: {}
    }
  };

  var MEMBER_STATES = ['BJ','BF','CV','CI','GM','GH','GN','GW','LR','ML','NE','NG','SN','SL','TG'];
  var MEMBER_NAMES  = { BJ:'Benin',BF:'Burkina Faso',CV:'Cabo Verde',CI:"Côte d'Ivoire",GM:'The Gambia',GH:'Ghana',GN:'Guinea',GW:'Guinea-Bissau',LR:'Liberia',ML:'Mali',NE:'Niger',NG:'Nigeria',SN:'Senegal',SL:'Sierra Leone',TG:'Togo' };

  /* ── helpers ──────────────────────────────────────────── */
  function fmt(n, dp) { return Number(n).toFixed(dp === undefined ? 2 : dp); }

  /* ── main calculation ────────────────────────────────── */
  function calculate(params) {
    var cifValue  = parseFloat(params.cifValue) || 0;
    var fobValue  = parseFloat(params.fobValue) || cifValue * 0.95;
    var cetBand   = parseInt(params.cetBand);
    var countryCode = params.countryCode || 'NG';
    var hsCode    = (params.hsCode || '').replace(/\./g, '').substring(0, 4);
    var isEtls    = params.isEtls === true;

    if (isNaN(cetBand) || cetBand < 0 || cetBand > 4) cetBand = 3;

    var result = { cifValue: cifValue, fobValue: fobValue, cetBand: cetBand, countryCode: countryCode, breakdown: [] };

    // Check HS-code special rate for country
    var countryData = COUNTRY_SUPPLEMENTS[countryCode];
    var specialRate = null;
    if (hsCode && countryData && countryData.specialRates && countryData.specialRates[hsCode]) {
      specialRate = countryData.specialRates[hsCode];
    }

    // If ECOWAS origin + ETLS, duty = 0 (but levies still apply)
    var cetRate  = isEtls ? 0 : (specialRate ? specialRate.rate : TARIFF_BANDS[cetBand].rate);
    var cetDuty  = cifValue * (cetRate / 100);

    result.breakdown.push({ label: isEtls ? 'CET Duty (ETLS — WAIVED)' : ('CET Duty (Band ' + cetBand + ' — ' + cetRate + '%)'), amount: cetDuty, rate: cetRate, base: 'CIF', highlight: true });
    if (specialRate) result.specialRateNote = specialRate.notes;

    // Community Levy 0.5% on CIF
    var cl = cifValue * (LEVIES.communityLevy.rate / 100);
    result.breakdown.push({ label: 'ECOWAS Community Levy (0.5%)', amount: cl, rate: 0.5, base: 'CIF' });

    // Statistical Fee 1% on CIF
    var sf = cifValue * (LEVIES.statisticalFee.rate / 100);
    result.breakdown.push({ label: 'Statistical Fee (1.0%)', amount: sf, rate: 1.0, base: 'CIF' });

    var subTotal = cetDuty + cl + sf;
    result.subTotal = subTotal;

    // Country-specific supplements
    var countryExtras = 0;
    if (countryData) {
      countryData.extras.forEach(function (ex) {
        var base = 0;
        if (ex.base === 'fob') base = fobValue;
        else if (ex.base === 'cif') base = cifValue;
        else if (ex.base === 'duty') base = cetDuty;
        else if (ex.base === 'cif_duty') base = cifValue + cetDuty;
        else if (ex.base === 'cif_duty_levy') base = cifValue + subTotal;
        var amt = base * (ex.rate / 100);
        countryExtras += amt;
        result.breakdown.push({ label: ex.name + ' (' + ex.rate + '%) — ' + ex.description, amount: amt, rate: ex.rate, base: ex.base.toUpperCase().replace(/_/g, '+') });
      });
    }

    result.countryExtras = countryExtras;
    result.totalCharges  = subTotal + countryExtras;
    result.totalLandedCost = cifValue + result.totalCharges;
    result.effectiveRate   = fmt(result.totalCharges / cifValue * 100);
    result.isEtls = isEtls;
    result.observations = getObservations(cetBand, countryCode, isEtls, result);
    return result;
  }

  /* ── ETLS eligibility checker ────────────────────────── */
  function checkEtls(params) {
    var originCountry = params.originCountry || '';
    var isMember = MEMBER_STATES.includes(originCountry.toUpperCase());
    var meetsVA   = (parseFloat(params.localValuePct) || 0) >= 30;
    var hasCOO    = params.hasCOO === true;
    var hasCTH    = params.hasCTH === true;
    var eligible  = isMember && (hasCOO || hasCTH) && meetsVA;
    return {
      eligible: eligible,
      isMember: isMember,
      meetsVA: meetsVA,
      hasCOO: hasCOO,
      hasCTH: hasCTH,
      notes: eligible
        ? '✅ Product qualifies for ETLS — zero CET duty applies. Levies (CL, Statistical Fee) still apply.'
        : '❌ Product does not qualify for ETLS. Standard CET duty applies. Check: ECOWAS membership, COO certificate, and 30% local value added.',
      requirements: [
        isMember ? '✅ Origin country is ECOWAS member' : '❌ Origin country is not an ECOWAS member',
        hasCOO ? '✅ ECOWAS Certificate of Origin held' : '❌ Certificate of Origin required',
        meetsVA ? '✅ Local value added ≥ 30%' : '❌ Local value added < 30% (minimum required)'
      ]
    };
  }

  /* ── observations ────────────────────────────────────── */
  function getObservations(band, countryCode, isEtls, result) {
    var obs = [];
    if (isEtls) {
      obs.push('🌍 ETLS exemption applied — this product from an ECOWAS member state circulates duty-free. Ensure your ECOWAS Certificate of Origin is presented at customs.');
    }
    if (band === 4) obs.push('⚠️ Band 4 goods (35%) are "sensitive products" — items like rice, poultry, and sugar that compete with local production. Some countries impose additional protection.');
    if (band === 0) obs.push('💊 Band 0 (0%) covers essential social goods. Verify your HS code classification — wrong classification can result in re-assessment at higher duty.');
    if (countryCode === 'NG') {
      obs.push('🇳🇬 Nigeria: Beyond CET, check for import prohibition list. Some goods require NAFDAC, SON, or other pre-clearance approvals before shipment.');
      obs.push('💰 Nigeria\'s effective tax burden on imports is among the highest in ECOWAS when CISS + Surcharge + VAT are combined.');
    }
    if (countryCode === 'GH') obs.push('🇬🇭 Ghana: NHIL and GETFund levies (2.5% each) significantly increase cost on consumer goods beyond the headline CET rate.');
    if (countryCode === 'CI' || countryCode === 'SN') obs.push('🇫🇷 CFA zone countries (CI, SN): TVA rate is 18% — higher than Nigeria\'s 7.5% VAT. Factor this into landed cost calculations.');
    obs.push('📦 All calculations are indicative. Actual duties may vary based on precise HS code classification and customs officer discretion. Always confirm with a licensed customs broker.');
    return obs;
  }

  return {
    calculate: calculate,
    checkEtls: checkEtls,
    getTariffBands: function () { return TARIFF_BANDS; },
    getMemberStates: function () {
      return MEMBER_STATES.map(function (c) { return { code: c, name: MEMBER_NAMES[c] }; });
    },
    getCountrySupplements: function (code) { return COUNTRY_SUPPLEMENTS[code] || null; },
    getSupportedCountries: function () {
      return Object.keys(COUNTRY_SUPPLEMENTS).map(function (code) {
        return { code: code, name: COUNTRY_SUPPLEMENTS[code].name, flag: COUNTRY_SUPPLEMENTS[code].flag };
      });
    }
  };
})();
