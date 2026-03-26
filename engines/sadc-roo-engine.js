var SadcRooEngine = (function () {
  'use strict';

  /* ── embedded data ───────────────────────────────────── */
  var MEMBER_STATES = [
    { code: 'ZA', name: 'South Africa',  sacuMember: true,  flag: '🇿🇦' },
    { code: 'BW', name: 'Botswana',      sacuMember: true,  flag: '🇧🇼' },
    { code: 'LS', name: 'Lesotho',       sacuMember: true,  flag: '🇱🇸' },
    { code: 'NA', name: 'Namibia',       sacuMember: true,  flag: '🇳🇦' },
    { code: 'SZ', name: 'Eswatini',      sacuMember: true,  flag: '🇸🇿' },
    { code: 'MZ', name: 'Mozambique',    sacuMember: false, flag: '🇲🇿' },
    { code: 'ZM', name: 'Zambia',        sacuMember: false, flag: '🇿🇲' },
    { code: 'ZW', name: 'Zimbabwe',      sacuMember: false, flag: '🇿🇼' },
    { code: 'MW', name: 'Malawi',        sacuMember: false, flag: '🇲🇼' },
    { code: 'TZ', name: 'Tanzania',      sacuMember: false, flag: '🇹🇿' },
    { code: 'AO', name: 'Angola',        sacuMember: false, flag: '🇦🇴' },
    { code: 'CD', name: 'DR Congo',      sacuMember: false, flag: '🇨🇩' },
    { code: 'MG', name: 'Madagascar',    sacuMember: false, flag: '🇲🇬' },
    { code: 'MU', name: 'Mauritius',     sacuMember: false, flag: '🇲🇺' },
    { code: 'SC', name: 'Seychelles',    sacuMember: false, flag: '🇸🇨' },
    { code: 'KM', name: 'Comoros',       sacuMember: false, flag: '🇰🇲' }
  ];

  var GENERAL_RULE = {
    description: 'Products qualify for SADC preferential treatment if:',
    criteria: [
      { label: 'Wholly Obtained (WO)', detail: 'Minerals, agriculture, fish and products manufactured entirely from SADC materials.' },
      { label: 'Value Added (VA) Rule', detail: 'Maximum 65% of ex-works price from non-SADC materials (i.e., minimum 35% SADC value added).' },
      { label: 'Change of Tariff Heading (CTH)', detail: 'Materials from outside SADC change to a different 4-digit HS heading after processing.' },
      { label: 'Sufficient Transformation', detail: 'Processing must be beyond simple operations (mixing, packing, labelling, assembly without change of heading).' }
    ]
  };

  var PRODUCT_RULES = [
    { id: 'animals',   hsRange: '01–05',  hsMin: 1,  hsMax: 5,  rule: 'WO',            ruleLabel: 'Wholly Obtained',                       description: 'Live animals & animal products' },
    { id: 'vegetal',   hsRange: '06–14',  hsMin: 6,  hsMax: 14, rule: 'WO',            ruleLabel: 'Wholly Obtained',                       description: 'Vegetable products' },
    { id: 'fats',      hsRange: '15',     hsMin: 15, hsMax: 15, rule: 'CTH or VA35',   ruleLabel: 'CTH or 35% Value Added',                description: 'Animal/vegetable fats and oils' },
    { id: 'food',      hsRange: '16–24',  hsMin: 16, hsMax: 24, rule: 'CTH_VA65',      ruleLabel: 'CTH + max 65% non-originating inputs',  description: 'Prepared foods, beverages, tobacco' },
    { id: 'minerals',  hsRange: '25–27',  hsMin: 25, hsMax: 27, rule: 'WO or CTH',     ruleLabel: 'Wholly Obtained or CTH',                description: 'Mineral products, fuels' },
    { id: 'chemicals', hsRange: '28–38',  hsMin: 28, hsMax: 38, rule: 'CTH',           ruleLabel: 'Change of Tariff Heading (4-digit)',    description: 'Chemicals and allied products' },
    { id: 'plastics',  hsRange: '39–40',  hsMin: 39, hsMax: 40, rule: 'CTH_VA65',      ruleLabel: 'CTH + max 65% non-originating inputs',  description: 'Plastics and rubber' },
    { id: 'textiles',  hsRange: '50–63',  hsMin: 50, hsMax: 63, rule: 'FABRIC_FWD',    ruleLabel: 'Fabric Forward (weaving + finishing in SADC)', description: 'Textiles and clothing — STRICT rules' },
    { id: 'metals',    hsRange: '72–83',  hsMin: 72, hsMax: 83, rule: 'CTH or VA35',   ruleLabel: 'CTH or 35% Value Added',                description: 'Base metals and articles' },
    { id: 'machinery', hsRange: '84–85',  hsMin: 84, hsMax: 85, rule: 'CTH_VA60',      ruleLabel: 'CTH or max 60% non-originating inputs', description: 'Machinery and electrical equipment' },
    { id: 'vehicles',  hsRange: '87',     hsMin: 87, hsMax: 87, rule: 'VA60_ASSEMBLY',  ruleLabel: 'Max 60% non-originating + assembly requirements', description: 'Vehicles — very specific rules apply' }
  ];

  var DOCUMENTATION = [
    { doc: 'SADC Certificate of Origin (EUR.1 format)', required: true,  note: 'Issued by authorised body in exporting country' },
    { doc: 'Invoice with origin declaration',           required: true,  note: 'Must state country of origin and HS code' },
    { doc: 'Proof of manufacturing process',            required: true,  note: 'Process description, BOM, factory audit if requested' },
    { doc: 'Material cost breakdown (VA calculation)',  required: true,  note: 'Shows split of SADC vs non-SADC material costs' },
    { doc: 'Supplier declarations for non-SADC inputs', required: false, note: 'Needed if questioned at customs or for VA verification' }
  ];

  /* ── helpers ──────────────────────────────────────────── */
  function getProductRule(hsChapter) {
    var ch = parseInt(hsChapter);
    return PRODUCT_RULES.find(function (r) { return ch >= r.hsMin && ch <= r.hsMax; }) || null;
  }

  /* ── check origin compliance ─────────────────────────── */
  function checkOrigin(params) {
    var hsChapter     = parseInt(params.hsChapter) || 0;
    var exportCountry = (params.exportCountry || '').toUpperCase();
    var importCountry = (params.importCountry || '').toUpperCase();
    var exWorksPrice  = parseFloat(params.exWorksPrice) || 0;
    var nonSadcCost   = parseFloat(params.nonSadcCost) || 0;
    var hasFabricFwd  = params.hasFabricFwd === true;
    var hasCTH        = params.hasCTH === true;
    var whollyObtained = params.whollyObtained === true;

    var exportMember = MEMBER_STATES.find(function (m) { return m.code === exportCountry; });
    var importMember = MEMBER_STATES.find(function (m) { return m.code === importCountry; });
    var isMember = !!exportMember;
    var isDestMember = !!importMember;

    var rule = getProductRule(hsChapter);
    var result = { hsChapter: hsChapter, exportCountry: exportCountry, importCountry: importCountry, rule: rule, isMember: isMember, isDestMember: isDestMember, checks: [], eligible: false };

    if (!isMember) {
      result.checks.push({ label: 'Exporting country', pass: false, detail: exportCountry + ' is not a SADC member state — no preferential access.' });
      result.eligible = false;
      return result;
    }
    result.checks.push({ label: 'Exporting country', pass: true, detail: (exportMember.flag || '') + ' ' + exportMember.name + ' is a SADC member state ✅' });

    if (!isDestMember) {
      result.checks.push({ label: 'Importing country', pass: false, detail: importCountry + ' is not a SADC member — SADC preferential rate does not apply.' });
      result.eligible = false;
      return result;
    }
    result.checks.push({ label: 'Importing country', pass: true, detail: (importMember.flag || '') + ' ' + importMember.name + ' is a SADC member state ✅' });

    if (!rule) {
      result.checks.push({ label: 'HS Chapter rule', pass: false, detail: 'Chapter ' + hsChapter + ' not found. Check your HS code.' });
      result.eligible = false;
      return result;
    }
    result.checks.push({ label: 'Applicable rule', pass: true, detail: 'HS ' + rule.hsRange + ': ' + rule.ruleLabel });

    // Evaluate by rule type
    var nonSadcPct = exWorksPrice > 0 ? (nonSadcCost / exWorksPrice) * 100 : 0;
    var sadcVA     = 100 - nonSadcPct;
    result.nonSadcPct = nonSadcPct.toFixed(1);
    result.sadcVA     = sadcVA.toFixed(1);

    var rulePass = false;
    var ruleDetail = '';

    if (rule.rule === 'WO') {
      rulePass = whollyObtained;
      ruleDetail = whollyObtained ? '✅ Wholly obtained in SADC — qualifies.' : '❌ Must be wholly obtained. No non-SADC materials permitted for this HS range.';
    } else if (rule.rule === 'CTH' || rule.rule === 'WO or CTH') {
      rulePass = whollyObtained || hasCTH;
      ruleDetail = rulePass ? '✅ CTH or wholly obtained satisfied.' : '❌ Non-SADC materials must change tariff heading (4-digit) after processing in SADC.';
    } else if (rule.rule === 'CTH or VA35') {
      var va35 = sadcVA >= 35;
      rulePass = hasCTH || va35 || whollyObtained;
      ruleDetail = rulePass ? '✅ CTH or 35% VA satisfied (SADC VA: ' + sadcVA.toFixed(1) + '%).' : '❌ Need CTH or at least 35% SADC value added (currently ' + sadcVA.toFixed(1) + '%).';
    } else if (rule.rule === 'CTH_VA65') {
      var va65 = nonSadcPct <= 65;
      rulePass = hasCTH && va65;
      ruleDetail = rulePass ? '✅ CTH + VA requirement met (non-SADC: ' + nonSadcPct.toFixed(1) + '% ≤ 65%).' : '❌ Need CTH AND non-SADC inputs ≤ 65% (currently ' + nonSadcPct.toFixed(1) + '%).';
    } else if (rule.rule === 'CTH_VA60' || rule.rule === 'VA60_ASSEMBLY') {
      var va60 = nonSadcPct <= 60;
      rulePass = va60 && (hasCTH || rule.rule === 'VA60_ASSEMBLY');
      ruleDetail = rulePass ? '✅ VA requirement met (non-SADC: ' + nonSadcPct.toFixed(1) + '% ≤ 60%).' : '❌ Non-SADC inputs must not exceed 60% of ex-works price (currently ' + nonSadcPct.toFixed(1) + '%).';
      if (rule.rule === 'VA60_ASSEMBLY') ruleDetail += ' Note: Vehicle-specific assembly requirements also apply.';
    } else if (rule.rule === 'FABRIC_FWD') {
      rulePass = hasFabricFwd;
      ruleDetail = hasFabricFwd ? '✅ Fabric forward requirement met — weaving and finishing done in SADC.' : '❌ Textiles require fabric-forward processing: yarn must be woven AND finished in SADC. Imported fabric does not qualify.';
    }

    result.checks.push({ label: 'Origin rule check', pass: rulePass, detail: ruleDetail });
    result.eligible = rulePass;
    result.certificate = rulePass ? getCertificateGuidance(exportCountry) : null;
    result.observations = getObservations(rule, result);
    return result;
  }

  /* ── certificate guidance ────────────────────────────── */
  function getCertificateGuidance(countryCode) {
    var authorities = {
      ZA: 'International Trade Administration Commission (ITAC)',
      BW: 'Botswana Unified Revenue Service (BURS)',
      MZ: 'Instituto de Promoção de Exportações (IPEX)',
      ZM: 'Zambia Revenue Authority (ZRA)',
      ZW: 'Zimbabwe Revenue Authority (ZIMRA)',
      TZ: 'Tanzania Revenue Authority (TRA)',
      MU: 'Mauritius Revenue Authority',
      MW: 'Malawi Revenue Authority (MRA)'
    };
    return {
      form: 'SADC Certificate of Origin (EUR.1 format)',
      issuingAuthority: authorities[countryCode] || 'National Customs / Trade Authority',
      validity: '10 months from date of issue',
      copies: '4 copies (original + 3)',
      notes: 'Apply BEFORE shipment. Certificate must accompany goods. Retrospective certificates only in exceptional circumstances.'
    };
  }

  /* ── observations ────────────────────────────────────── */
  function getObservations(rule, result) {
    var obs = [];
    if (result.eligible) {
      obs.push('✅ This product qualifies for SADC preferential tariff rates. Present the SADC Certificate of Origin (EUR.1) at destination customs.');
      obs.push('💡 Cumulation: Under SADC full cumulation, materials and processing from ANY SADC member state count as originating — you can split production across SADC countries.');
    } else {
      obs.push('❌ This product does not currently meet SADC rules of origin. Consider: (a) sourcing more inputs from SADC, or (b) increasing value-added processing within SADC.');
    }
    if (rule && rule.id === 'textiles') {
      obs.push('👗 Textiles note: The "fabric forward" rule is strict. Even if you sew in SADC, if the fabric was imported from outside SADC, it may not qualify. Key exception: Lesotho, Eswatini, and Mauritius have benefited from AGOA cumulation for textiles.');
    }
    if (rule && rule.id === 'vehicles') {
      obs.push('🚗 Vehicles: South Africa\'s automotive sector benefits from the SADC FTA but specific assembly content requirements apply per vehicle type. Consult ITAC for product-specific advice.');
    }
    obs.push('📋 SADC-COMESA-EAC Tripartite FTA: Some diagonal cumulation provisions allow combining production across SADC, COMESA and EAC member states — expanding origin options further.');
    return obs;
  }

  return {
    checkOrigin: checkOrigin,
    getProductRule: getProductRule,
    getMemberStates: function () { return MEMBER_STATES; },
    getGeneralRule: function () { return GENERAL_RULE; },
    getProductRules: function () { return PRODUCT_RULES; },
    getDocumentation: function () { return DOCUMENTATION; }
  };
})();
