(function (window) {
  'use strict';

  var AfroTools = (window.AfroTools = window.AfroTools || {});
  var E = AfroTools.HREngine;
  if (!E || AfroTools.__hrSwOverlayApplied) return;
  AfroTools.__hrSwOverlayApplied = true;

  var RULE_CACHE = {};
  var SOCIAL_SECURITY_CACHE = {};
  var LEAVE_CACHE = {};

  var LAW_OVERRIDES = {
    'Labour Act Cap L1 LFN 2004': 'Sheria ya Kazi Cap L1 LFN 2004',
    'Employment Act 2007, S.27': 'Sheria ya Ajira 2007, Kif. 27',
    'Basic Conditions of Employment Act (BCEA) S.9-10':
      'Sheria ya Masharti ya Msingi ya Ajira (BCEA) Kif. 9-10',
    'Labour Act 651 of 2003, S.33-37': 'Sheria ya Kazi 651 ya 2003, Kif. 33-37',
    'Labour Law 12 of 2003': 'Sheria ya Kazi 12 ya 2003',
    'Employment and Labour Relations Act 2004':
      'Sheria ya Ajira na Mahusiano Kazini 2004',
    'Employment Act 2006': 'Sheria ya Ajira 2006',
    'Law No. 66/2018 Regulating Labour': 'Sheria Na. 66/2018 inayosimamia kazi',
    'Code du Travail': 'Kanuni ya Kazi',
    'Code du Travail 1992': 'Kanuni ya Kazi 1992',
    'Code du Travail 1996': 'Kanuni ya Kazi 1996',
    'Code du Travail 2004': 'Kanuni ya Kazi 2004',
    'Labour Proclamation No. 118/2001': 'Tangazo la Sheria ya Kazi Na. 118/2001',
    'Labour Act 2017': 'Sheria ya Kazi 2017',
    'Lei do Trabalho': 'Sheria ya Kazi',
    'Lei Geral do Trabalho': 'Sheria Kuu ya Kazi',
    'Labour Act 2007': 'Sheria ya Kazi 2007',
    'Codigo Laboral': 'Kanuni ya Kazi',
    'C\u00f3digo Laboral': 'Kanuni ya Kazi',
    'Labour Code Order 1992': 'Amri ya Kanuni ya Kazi 1992',
    'Employment Act 1980': 'Sheria ya Ajira 1980',
    'Labour Act 2023': 'Sheria ya Kazi 2023',
    'Employment Act (Cap 69)': 'Sheria ya Ajira (Cap 69)',
    'Decent Work Act 2015': 'Sheria ya Kazi Yenye Staha 2015'
  };

  var NOTE_OVERRIDES = {
    'OT is voluntary \u2014 employer cannot compel overtime.':
      'Muda wa ziada ni wa hiari; mwajiri hawezi kumlazimisha mfanyakazi kufanya OT.',
    'Egypt uses 35% premium for day OT and 70% for night OT \u2014 unusual compared to other countries.':
      'Misri hutumia nyongeza ya 35% kwa OT ya mchana na 70% kwa OT ya usiku, jambo ambalo ni tofauti na nchi nyingi nyingine.',
    'Francophone countries use tiered OT: first 8 extra hours at 15%, next 8 at 50%. Night and Sunday premiums stack.':
      'Nchi nyingi za kifaransa hutumia OT ya ngazi: saa 8 za kwanza za ziada kwa 15%, saa 8 zinazofuata kwa 50%, kisha nyongeza za usiku au Jumapili huongezwa juu yake.',
    'Limited enforcement capacity. Somaliland and Puntland may apply different local rules.':
      'Utekelezaji wake bado ni dhaifu, na Somaliland pamoja na Puntland wanaweza kutumia taratibu za ndani zinazotofautiana.',
    'Francophone OT structure \u2014 tiered premiums.':
      'Muundo wa OT wa nchi za kifaransa hutumia nyongeza za ngazi tofauti.',
    'OHADA member. Tiered OT structure.':
      'Nchi hii iko kwenye mfumo wa OHADA na hutumia muundo wa OT wenye ngazi tofauti.',
    'ECOWAS/OHADA mixed legal framework.':
      'Mfumo wake wa kazi unachanganya marejeo ya ECOWAS na OHADA.',
    'Francophone civil law OT structure.':
      'Muundo wa OT hapa unafuata mfumo wa sheria ya kiraia ya nchi za kifaransa.',
    "Africa's shortest standard work week at 35 hours.":
      'Hii ni miongoni mwa wiki fupi zaidi za kazi barani Afrika, saa 35 kwa wiki.'
  };

  var MAX_NOTE_OVERRIDES = {
    'Not strictly codified but industry standard':
      'Hakijaandikwa kwa ukali katika sheria, lakini ndilo zoea la kawaida la sekta.',
    'No more than 4 hours OT per day': 'OT isizidi saa 4 kwa siku.',
    'Max 10 hours OT per week. Max 3 hours per day.':
      'OT isizidi saa 10 kwa wiki na saa 3 kwa siku.',
    'No weekly cap specified but must be voluntary':
      'Hakuna kikomo cha wiki kilichotajwa wazi, lakini OT lazima iwe ya hiari.'
  };

  var EXEMPTION_OVERRIDES = {
    'Managerial/supervisory staff': 'Wafanyakazi wa usimamizi au usupervaiza',
    'Workers with irregular hours by nature of employment':
      'Wafanyakazi ambao saa zao hubadilika kwa asili ya kazi yao',
    'Employees earning above BCEA threshold (R254,371.67/year in 2025)':
      'Wafanyakazi wanaopata zaidi ya kiwango cha BCEA (R254,371.67 kwa mwaka mwaka 2025)',
    'Senior management': 'Uongozi wa juu'
  };

  var REST_DAY_ENTITLEMENT_OVERRIDES = {
    '1 day per week (minimum)': 'angalau siku 1 ya mapumziko kwa wiki',
    '1 day per week': 'siku 1 ya mapumziko kwa wiki',
    'Sunday or agreed day off': 'Jumapili au siku nyingine ya mapumziko iliyokubaliwa'
  };

  var REST_DAY_NOTE_OVERRIDES = {
    "Employee who normally works Sunday: 1.5x. Who doesn't normally work Sunday: 2x":
      'Mfanyakazi anayefanya kazi Jumapili kawaida hulipwa 1.5x, na asiyeifanya kawaida hulipwa 2x.'
  };

  var NIGHT_DEFINITION_OVERRIDES = {
    '10pm to 6am': '10 jioni hadi 6 asubuhi',
    '6:30pm to 6:30am': '6:30 jioni hadi 6:30 asubuhi',
    '6pm to 6am': '6 jioni hadi 6 asubuhi'
  };

  var NIGHT_PREMIUM_OVERRIDES = {
    'No statutory premium but transport/allowance often required':
      'Hakuna nyongeza ya lazima kisheria, lakini usafiri au posho mara nyingi huhitajika.'
  };

  var TIME_OFF_OVERRIDES = {
    'Employee may agree to take paid time off instead of OT pay \u2014 90 minutes off for every hour of OT':
      'Mfanyakazi anaweza kukubaliana kuchukua mapumziko ya kulipwa badala ya malipo ya OT; kila saa 1 ya OT inaweza kubadilishwa kuwa dakika 90 za mapumziko.'
  };

  var OBSERVATION_OVERRIDES = {
    NG: 'Nchini Nigeria, muda wa ziada ni wa hiari na mwajiri hawezi kulazimisha OT. Kiwango cha kawaida ni 1.5x kwa siku ya kazi na 2x kwa wikendi au sikukuu za umma.',
    KE: 'Kenya hupunguza OT hadi saa 4 kwa siku. Wiki ya kazi ya saa 45 ni miongoni mwa viwango virefu zaidi Afrika Mashariki, hivyo msingi wa saa huathiri kiasi cha OT kinacholipwa.',
    ZA: 'Afrika Kusini hutumia BCEA, lakini wafanyakazi wanaopata juu ya kiwango kilichowekwa hawalindwi kikamilifu na sheria za OT. Pia kuna chaguo la kubadilisha OT na mapumziko ya kulipwa kwa uwiano wa dakika 90 kwa kila saa 1 ya OT.',
    GH: 'Ghana ina mojawapo ya viwango vya juu zaidi vya OT kwa sikukuu za umma, 2.5x. OT ya siku ya kazi kwa kawaida hubaki 1.5x.',
    EG: 'Misri hutumia mfumo tofauti: OT ya mchana hulipwa kwa nyongeza ya 35% na ya usiku kwa 70%, badala ya kizidishi rahisi kinachotumiwa na nchi nyingi nyingine.',
    CI: 'Nchi za kifaransa kama Cote d\'Ivoire hutumia OT ya ngazi: saa 8 za kwanza za ziada kwa 15%, saa 8 zinazofuata kwa 50%, huku nyongeza za usiku au Jumapili zikiongezwa juu yake.',
    TZ: 'Tanzania ina kikomo cha saa 50 za OT kwa mwezi. Wiki ya kazi ya saa 45 na tofauti za sekta huathiri jinsi malipo ya OT yanavyokokotolewa.',
    ET: 'Ethiopia ina kiwango cha juu cha 2.5x kwa OT ya sikukuu za umma, lakini OT ya siku ya kazi huanzia 1.25x, chini ya nchi nyingi nyingine barani.',
    SZ: 'Eswatini hutaka 3x kwa kazi ya sikukuu ya umma, mojawapo ya viwango vya juu zaidi barani Afrika. Wiki ya saa 48 ndiyo msingi wake wa kawaida.',
    SC: 'Shelisheli ina wiki fupi sana ya kazi, saa 35 pekee kwa wiki. OT huanza baada ya saa 7 kwa siku na sikukuu hulipwa 2.5x.',
    CV: 'Cabo Verde hutumia mfumo wa ngazi: saa 2 za kwanza za OT kwa 1.25x, kisha zinazofuata kwa 1.5x. Kazi ya sikukuu ya umma hulipwa 3x.',
    SS: 'Sudan Kusini ina haki za OT zilizoainishwa wazi chini ya Sheria ya Kazi ya 2017. Kikomo kilichorekodiwa ni saa 12 kwa wiki, ingawa utekelezaji bado unaweza kutofautiana.',
    LS: 'Lesotho hulipa 1.5x kwa siku ya kazi na 2x kwa siku ya mapumziko. Kanuni yake ya kazi pia inajulikana kwa ulinzi wake wa uzazi na dhidi ya kufukuzwa isivyo haki.',
    MR: 'Mauritania ina nyongeza ya usiku ya 1.75x, juu kuliko kiwango cha mchana cha 1.25x kwa saa 8 za kwanza za OT.',
    BI: 'Burundi hufuata mfumo wa kawaida wa wiki ya saa 40 na OT ya 1.5x kwa siku ya kazi, lakini nguvu halisi ya mshahara inaweza kutofautiana sana kutokana na mfumuko wa bei wa BIF.',
    CG: 'Congo Brazzaville hutumia muundo wa OT wa ngazi nne unaoweza kufika 1.6x kwa saa zilizoongezeka, huku Jumapili au sikukuu zikifika 2x.'
  };

  var SOCIAL_SECURITY_LAW_OVERRIDES = {
    'Pension Reform Act 2014': 'Sheria ya Mageuzi ya Pensheni 2014',
    'National Housing Fund Act': 'Sheria ya Mfuko wa Taifa wa Makazi',
    'NSSF Act 2013': 'Sheria ya NSSF 2013',
    'Social Health Insurance Act 2023': 'Sheria ya Bima ya Afya ya Jamii 2023',
    'Affordable Housing Act 2024': 'Sheria ya Makazi Nafuu 2024',
    'Unemployment Insurance Act': 'Sheria ya Bima ya Ukosefu wa Ajira',
    'Skills Development Levies Act': 'Sheria ya Tozo za Maendeleo ya Ujuzi',
    'National Pensions Act 766': 'Sheria ya Pensheni ya Taifa 766',
    'Social Insurance Law 148/2019': 'Sheria ya Bima ya Jamii 148/2019',
    'NSSF Act 1985': 'Sheria ya NSSF 1985'
  };

  var SOCIAL_SECURITY_SCHEME_NAME_OVERRIDES = {
    'Pension (PRA 2014)': 'Pensheni (PRA 2014)',
    'AHL (Housing Levy)': 'AHL (Ushuru wa Makazi)',
    'Retirement Fund': 'Mfuko wa Kustaafu',
    'SSNIT First Tier': 'SSNIT Ngazi ya Kwanza',
    'Tier 2 Occupational Pension': 'Pensheni ya Kikazi ya Ngazi ya 2',
    'Tier 3 (Voluntary)': 'Ngazi ya 3 (Hiari)',
    'Social Insurance (NOSI)': 'Bima ya Jamii (NOSI)',
    'No mandatory social security': 'Hakuna mpango wa lazima wa hifadhi ya jamii',
    Pension: 'Pensheni',
    'RSSB Pension': 'Pensheni ya RSSB',
    'RSSB Maternity': 'Mfuko wa Uzazi wa RSSB',
    'RSSB Occupational Hazards': 'Hatari za Kazi za RSSB'
  };

  var SOCIAL_SECURITY_NOTE_OVERRIDES = {
    'Contributory pension. RSA based. Min 8% EE + 10% ER of basic+housing+transport.':
      'Pensheni ya michango kupitia RSA. Kiwango cha chini ni 8% kwa mfanyakazi na 10% kwa mwajiri juu ya msingi, makazi na usafiri.',
    '2.5% of basic salary. Deducted from employee.':
      '2.5% ya mshahara wa msingi, hukatwa kwa mfanyakazi.',
    'National Health Insurance Scheme. 5% total.':
      'Mpango wa Taifa wa Bima ya Afya. Jumla ya mchango ni 5%.',
    'Industrial Training Fund. Employer only. Companies with 5+ employees or turnover >N50M.':
      'Mfuko wa Mafunzo ya Viwandani. Hulipwa na mwajiri pekee kwa kampuni zenye wafanyakazi 5+ au mauzo yanayozidi N50M.',
    'Employee Compensation Act. Employer only. 1% of total emoluments.':
      'Sheria ya Fidia ya Wafanyakazi. Hulipwa na mwajiri pekee kwa 1% ya malipo yote yanayostahili.',
    'Year 4 rates from February 1, 2026. 6% each on earnings up to KES 9,000.':
      'Viwango vya mwaka wa 4 kuanzia 1 Februari 2026. 6% kila upande kwa mapato hadi KES 9,000.',
    'Additional 6% each on earnings between KES 9,000 and KES 108,000.':
      '6% ya ziada kila upande kwa sehemu ya mapato kati ya KES 9,000 na KES 108,000.',
    '2.75% of gross salary, subject to the statutory minimum contribution.':
      '2.75% ya mshahara ghafi, chini ya kiwango cha chini cha kisheria cha mchango.',
    '1.5% each for employer and employee.':
      '1.5% kila upande kwa mwajiri na mfanyakazi.',
    '1% each capped at earnings of R17,712/month.':
      '1% kila upande hadi kikomo cha mapato ya R17,712 kwa mwezi.',
    '1% of total remuneration. Employer only. Exempt if annual payroll <R500,000.':
      '1% ya malipo yote. Hulipwa na mwajiri pekee. Husamehewa kama malipo ya mwaka ni chini ya R500,000.',
    'Compensation for Occupational Injuries. Rate depends on industry (0.11%-8.26%). Using 1.5% average.':
      'Fidia ya majeraha kazini. Kiwango hutegemea sekta (0.11%-8.26%); hapa tunatumia wastani wa 1.5%.',
    'Not legally mandatory but practically universal. Up to 27.5% tax deductible.':
      'Sio lazima moja kwa moja kisheria, lakini karibu waajiri wote wa sekta rasmi huitumia. Michango inaweza kupunguziwa kodi hadi 27.5%.',
    'Employee 5.5% and employer 8% make up the 13.5% first-tier remittance. SSNIT diverts 2.5% of the capped salary to NHIA from this remittance.':
      'Mfanyakazi 5.5% na mwajiri 8% huunda remittance ya 13.5% ya ngazi ya kwanza. SSNIT hutenga 2.5% ya mshahara wenye kikomo kwenda NHIA kutoka kwenye remittance hiyo.',
    'Employer-funded second-tier occupational pension. 2026 contribution ceiling: GHS 69,000/month.':
      'Pensheni ya kikazi ya ngazi ya pili inayolipwa na mwajiri. Kikomo cha michango cha 2026 ni GHS 69,000 kwa mwezi.',
    'Up to 16.5% tax-deductible. Voluntary.':
      'Hadi 16.5% inaweza kupunguziwa kodi. Ni ya hiari.',
    'Both 10% of gross salary. Mandatory for all formal employees.':
      '10% kila upande ya mshahara ghafi. Ni lazima kwa wafanyakazi wote wa sekta rasmi.',
    'Skills Development Levy. Employer pays 3.5%.':
      'Tozo ya Maendeleo ya Ujuzi. Mwajiri hulipa 3.5%.',
    'Workers Compensation Fund. 0.5% of payroll.':
      'Mfuko wa Fidia kwa Wafanyakazi. 0.5% ya malipo ya mshahara.',
    'Employee 5% + employer 10% = 15% total.':
      'Mfanyakazi 5% na mwajiri 10%; jumla 15%.',
    'Doubled from 3%+3% to 6%+6% in January 2025.':
      'Kimeongezeka kutoka 3%+3% hadi 6%+6% kuanzia Januari 2025.',
    'Maternity benefits fund.':
      'Mfuko wa mafao ya uzazi.',
    'Employer only.':
      'Mwajiri pekee.',
    'Employer only. 1% of total remuneration.':
      'Mwajiri pekee kwa 1% ya malipo yote.',
    'Social security 11% total.':
      'Hifadhi ya jamii yenye jumla ya 11%.',
    "Workers' Compensation + Pension.":
      'Fidia ya wafanyakazi pamoja na pensheni.',
    'Botswana has no mandatory social security contributions. Severance pay acts as de facto social protection.':
      'Botswana haina michango ya lazima ya hifadhi ya jamii. Malipo ya kuachishwa kazi hutumika kama ulinzi wa kijamii kwa vitendo.',
    'Malawi has no mandatory social security scheme for private sector.':
      'Malawi haina mpango wa lazima wa hifadhi ya jamii kwa sekta binafsi.',
    '7% employee + 11% employer of basic salary.':
      '7% kwa mfanyakazi na 11% kwa mwajiri juu ya mshahara wa msingi.'
  };

  var SOCIAL_SECURITY_OBSERVATION_OVERRIDES = {
    KE: 'Kenya ina muundo mpana wa michango ya hifadhi ya jamii: NSSF ya ngazi mbili kwa pensheni, SHIF kwa afya, na AHL kwa makazi. Kwa waajiri wa sekta rasmi, mzigo mkuu wa lazima sasa unatokana na mchanganyiko huo wa pensheni, afya na ushuru wa makazi.',
    GH: 'Ghana hutumia mfumo wa pensheni wa ngazi tatu unaoongozwa na SSNIT. Mchango wa lazima hulenga ngazi ya kwanza na pensheni ya kikazi ya ngazi ya pili, huku kikomo cha mshahara kinapunguza mzigo kwa mapato ya juu.',
    ZA: 'Afrika Kusini ina kiwango cha chini cha moja kwa moja kwa UIF, lakini gharama halisi ya ajira mara nyingi huongezeka kwa SDL, COIDA na michango ya mifuko ya kustaafu ya waajiri.',
    BW: 'Botswana ni tofauti kwa sababu haina mpango wa lazima wa kitaifa wa hifadhi ya jamii kwa sekta binafsi. Waajiri wengi hutegemea mafao ya ndani ya kampuni au mipango ya hiari ya pensheni.',
    AO: 'Angola hutumia muundo rahisi wa INSS wenye kiwango cha wastani cha 3% kwa mfanyakazi na 8% kwa mwajiri, hivyo kuwa moja ya mifumo yenye gharama ya kati lakini iliyo wazi zaidi katika kundi hili.'
  };

  function clone(value) {
    return value ? JSON.parse(JSON.stringify(value)) : value;
  }

  function localizeLaw(law) {
    if (!law) return law;
    return LAW_OVERRIDES[law] || law;
  }

  function localizeNote(text) {
    if (!text) return text;
    return NOTE_OVERRIDES[text] || text;
  }

  function localizeMaxNote(text) {
    if (!text) return text;
    return MAX_NOTE_OVERRIDES[text] || text;
  }

  function localizeExemption(text) {
    if (!text) return text;
    return EXEMPTION_OVERRIDES[text] || text;
  }

  function localizeRestDay(restDay) {
    if (!restDay) return restDay;
    var localized = Object.assign({}, restDay);
    if (localized.entitlement) {
      localized.entitlement =
        REST_DAY_ENTITLEMENT_OVERRIDES[localized.entitlement] || localized.entitlement;
    }
    if (localized.notes) {
      localized.notes = REST_DAY_NOTE_OVERRIDES[localized.notes] || localized.notes;
    }
    return localized;
  }

  function localizeNightWork(nightWork) {
    if (!nightWork) return nightWork;
    var localized = Object.assign({}, nightWork);
    if (localized.definition) {
      localized.definition =
        NIGHT_DEFINITION_OVERRIDES[localized.definition] || localized.definition;
    }
    if (localized.premium && typeof localized.premium === 'string') {
      localized.premium =
        NIGHT_PREMIUM_OVERRIDES[localized.premium] || localized.premium;
    }
    return localized;
  }

  function localizeTimeOff(text) {
    if (!text) return text;
    return TIME_OFF_OVERRIDES[text] || text;
  }

  function localizeSocialSecurityLaw(law) {
    if (!law) return law;
    return SOCIAL_SECURITY_LAW_OVERRIDES[law] || law;
  }

  function localizeSocialSecuritySchemeName(name) {
    if (!name) return name;
    return SOCIAL_SECURITY_SCHEME_NAME_OVERRIDES[name] || name;
  }

  function localizeSocialSecurityNote(text, code, schemeName) {
    if (!text && schemeName === 'Hakuna mpango wa lazima wa hifadhi ya jamii') {
      return 'Nchi hii haina mchango wa lazima wa hifadhi ya jamii kwa sekta binafsi.';
    }
    if (!text) return text;
    return SOCIAL_SECURITY_NOTE_OVERRIDES[text] || text;
  }

  function getSocialSecurityCapValue(cap) {
    if (!cap) return null;
    if (typeof cap === 'number') return cap;
    if (typeof cap.monthly === 'number') return cap.monthly;
    return null;
  }

  function localizeSocialSecurityCountry(code) {
    if (SOCIAL_SECURITY_CACHE[code]) return SOCIAL_SECURITY_CACHE[code];
    if (!window.SOCIAL_SECURITY || !window.SOCIAL_SECURITY[code]) return null;

    var localized = clone(window.SOCIAL_SECURITY[code]);
    localized.schemes = (localized.schemes || []).map(function (scheme) {
      var localizedScheme = Object.assign({}, scheme);
      localizedScheme.name = localizeSocialSecuritySchemeName(localizedScheme.name);
      localizedScheme.law = localizeSocialSecurityLaw(localizedScheme.law);
      localizedScheme.notes = localizeSocialSecurityNote(
        localizedScheme.notes || localizedScheme.note || '',
        code,
        localizedScheme.name
      );
      localizedScheme.note = localizedScheme.notes;
      return localizedScheme;
    });

    SOCIAL_SECURITY_CACHE[code] = localized;
    return localized;
  }

  function buildGenericSocialSecurityObservation(code) {
    var data = localizeSocialSecurityCountry(code);
    if (!data) {
      return 'Chagua nchi ili uone muhtasari wa michango ya hifadhi ya jamii, viwango vya mfanyakazi na mwajiri, pamoja na maelezo ya mifuko muhimu.';
    }

    var schemes = data.schemes || [];
    if (!schemes.length) {
      return data.name + ' ina data ndogo ya hifadhi ya jamii kwenye seti hii ya sasa.';
    }

    if (
      schemes.some(function (scheme) {
        return scheme.name === 'Hakuna mpango wa lazima wa hifadhi ya jamii';
      })
    ) {
      return (
        data.name +
        ' haina mpango wa lazima wa taifa wa hifadhi ya jamii kwa sekta binafsi. Waajiri na wafanyakazi hutegemea mafao ya kampuni, pensheni za hiari au kanuni za fidia ya kuachishwa kazi.'
      );
    }

    var employeeRate = 0;
    var employerRate = 0;
    var cappedCount = 0;
    var schemeNames = [];
    schemes.forEach(function (scheme) {
      employeeRate += typeof scheme.employeeRate === 'number' ? scheme.employeeRate : 0;
      employerRate += typeof scheme.employerRate === 'number' ? scheme.employerRate : 0;
      if (getSocialSecurityCapValue(scheme.cap)) cappedCount += 1;
      if (scheme.name && schemeNames.length < 2) schemeNames.push(scheme.name);
    });

    var parts = [
      data.name +
        ' ina mzigo wa takriban ' +
        employeeRate.toFixed(2).replace(/\.00$/, '') +
        '% kwa mfanyakazi na ' +
        employerRate.toFixed(2).replace(/\.00$/, '') +
        '% kwa mwajiri.'
    ];

    if (schemeNames.length) {
      parts.push('Mifuko muhimu ni ' + schemeNames.join(' na ') + '.');
    }

    if (cappedCount > 0) {
      parts.push('Baadhi ya michango ina kikomo cha mshahara kinachotumika kabla ya kukokotoa makato.');
    } else {
      parts.push('Kwenye seti hii ya data, michango mingi hukokotolewa moja kwa moja juu ya mshahara bila kikomo cha juu.');
    }

    return parts.join(' ');
  }

  function getSocialSecurityObservation(code) {
    return SOCIAL_SECURITY_OBSERVATION_OVERRIDES[code] || buildGenericSocialSecurityObservation(code);
  }

  function getSocialSecurityNoDataExplanation(code) {
    var data = localizeSocialSecurityCountry(code);
    if (!data) {
      return 'Data ya nchi hii bado ni ndogo. Angalia sheria za ndani au taasisi ya taifa ya hifadhi ya jamii kwa uthibitisho zaidi.';
    }

    var schemes = data.schemes || [];
    if (
      schemes.some(function (scheme) {
        return scheme.name === 'Hakuna mpango wa lazima wa hifadhi ya jamii';
      })
    ) {
      return 'Nchi hii haina mpango wa lazima wa hifadhi ya jamii kwa sekta binafsi, hivyo gharama za ajira hutegemea zaidi mafao ya kampuni au mipango ya hiari.';
    }

    return 'Data ya nchi hii ni nyembamba kwenye seti hii. Tumia mgawanyo uliopo kama mwongozo wa haraka, kisha hakiki viwango na taasisi ya kitaifa husika.';
  }

  var LEAVE_COUNTRY_NAME_OVERRIDES = {
    CF: 'Jamhuri ya Afrika ya Kati',
    CG: 'Kongo-Brazzaville',
    EG: 'Misri',
    GQ: 'Guinea ya Ikweta',
    MG: 'Madagaska',
    MZ: 'Msumbiji',
    SC: 'Shelisheli',
    SS: 'Sudan Kusini',
    ST: 'Sao Tome na Principe',
    ZA: 'Afrika Kusini'
  };

  var LEAVE_OBSERVATION_OVERRIDES = {
    KE: 'Kenya ina siku 21 za likizo ya mwaka, wiki 13 za likizo ya uzazi na siku 14 za likizo ya baba. Hii inaifanya kuwa miongoni mwa mifumo yenye uwiano mzuri zaidi wa likizo ya kazi katika Afrika Mashariki.',
    NG: 'Nigeria ina kiwango cha chini cha kisheria cha siku 6 za likizo ya mwaka, lakini waajiri wengi wa sekta rasmi hutoa zaidi kwa mkataba. Hakuna likizo ya baba iliyowekwa kisheria kwenye mfumo wa taifa.',
    ZA: 'Afrika Kusini hutumia siku 21 mfululizo za likizo ya mwaka, ambazo mara nyingi ni karibu siku 15 za kazi kwa wiki ya siku tano. Likizo ya uzazi ni ndefu, lakini malipo hutegemea zaidi UIF kuliko mwajiri wa moja kwa moja.',
    TZ: 'Tanzania ina moja ya mifumo yenye ulinzi mkubwa wa likizo ya ugonjwa katika kanda, pamoja na siku 126 kwa mzunguko wa miaka mitatu. Likizo ya mwaka hutolewa kama siku 28 mfululizo chini ya sheria ya ajira.',
    CI: 'Cote d’Ivoire hufuata muundo mpana wa Afrika ya kifaransa wenye siku 24 za likizo ya mwaka na wiki 14 za likizo ya uzazi. Viongezeko vya uzoefu wa kazi na haki za wazazi vinaweza kufanya kifurushi hiki kiwe bora zaidi kadri miaka inavyoongezeka.',
    DZ: 'Algeria ina moja ya viwango vya juu zaidi vya likizo ya mwaka barani Afrika kwa siku 30 za kalenda. Pamoja na sikukuu nyingi za umma, jumla ya siku za mapumziko ya kulipwa huwa juu sana.',
    ET: 'Ethiopia ina likizo ya uzazi ndefu kuliko nchi nyingi za Afrika, huku sheria za 2019 zikiboreshwa zaidi. Likizo ya mwaka huongezeka polepole kwa kadri ya miaka ya huduma.',
    RW: 'Rwanda hutumia muundo wa kisasa zaidi wa kazi baada ya mageuzi ya 2018. Likizo ya uzazi ina mgawanyo wa malipo kati ya mwajiri na RSSB, na likizo ya mwaka inaweza kuhamishwa kwa muda maalumu.'
  };

  function replaceTextPairs(text, pairs) {
    if (!text) return text;
    var localized = text;
    for (var i = 0; i < pairs.length; i += 1) {
      localized = localized.replace(pairs[i][0], pairs[i][1]);
    }
    return localized;
  }

  function localizeLeaveCountryName(name, code) {
    if (!name) return name;
    return LEAVE_COUNTRY_NAME_OVERRIDES[code] || name;
  }

  function localizeLeaveLaw(law) {
    if (!law) return law;

    var localized = localizeLaw(law);
    if (localized !== law) return localized;

    localized = replaceTextPairs(law, [
      [/Basic Conditions of Employment Act/g, 'Sheria ya Masharti ya Msingi ya Ajira'],
      [/Employment and Labour Relations Act/g, 'Sheria ya Ajira na Mahusiano Kazini'],
      [/Workers' Rights Act/g, 'Sheria ya Haki za Wafanyakazi'],
      [/Labour Relations Law/g, 'Sheria ya Mahusiano Kazini'],
      [/Labour Relations Act/g, 'Sheria ya Mahusiano Kazini'],
      [/Labour Proclamation/g, 'Tangazo la Sheria ya Kazi'],
      [/Labour Act/g, 'Sheria ya Kazi'],
      [/Employment Act/g, 'Sheria ya Ajira'],
      [/Labour Law/g, 'Sheria ya Kazi'],
      [/Labour Code/g, 'Kanuni ya Kazi'],
      [/Law No\./g, 'Sheria Na.'],
      [/Workers' Rights/g, 'Haki za Wafanyakazi']
    ]);

    localized = localized.replace(/\bS\.\s?/g, 'Kif. ');
    return localized;
  }

  function translateLeaveText(text) {
    if (!text) return text;

    return replaceTextPairs(text, [
      [/After 12 months continuous service/g, 'Baada ya miezi 12 ya huduma endelevu'],
      [/After 12 months/g, 'Baada ya miezi 12'],
      [/After 1 year continuous service/g, 'Baada ya mwaka 1 wa huduma endelevu'],
      [/After 1 year of service/g, 'Baada ya mwaka 1 wa ajira'],
      [/After 1 year/g, 'Baada ya mwaka 1'],
      [/After 2 months/g, 'Baada ya miezi 2'],
      [/continuous service/g, 'huduma endelevu'],
      [/continuous employment/g, 'ajira endelevu'],
      [/working days/g, 'siku za kazi'],
      [/calendar days/g, 'siku za kalenda'],
      [/consecutive days/g, 'siku mfululizo'],
      [/per year/g, 'kwa mwaka'],
      [/per month/g, 'kwa mwezi'],
      [/per 3-year cycle/g, 'kwa mzunguko wa miaka 3'],
      [/public holidays/g, 'sikukuu za umma'],
      [/Public holidays/g, 'Sikukuu za umma'],
      [/social security/g, 'hifadhi ya jamii'],
      [/Social security/g, 'Hifadhi ya jamii'],
      [/social insurance/g, 'bima ya jamii'],
      [/Social insurance/g, 'Bima ya jamii'],
      [/collective agreement/g, 'makubaliano ya pamoja'],
      [/collective agreements/g, 'makubaliano ya pamoja'],
      [/employer policy/g, 'sera ya mwajiri'],
      [/depends on employer policy/g, 'hutegemea sera ya mwajiri'],
      [/No statutory minimum specified\. Typically governed by employer policy or collective agreement\./g, 'Hakuna kiwango cha chini kilichobainishwa kisheria; mara nyingi suala hili huongozwa na sera ya mwajiri au makubaliano ya pamoja.'],
      [/No statutory provision/g, 'Hakuna sharti la kisheria'],
      [/No statutory paternity leave/g, 'Hakuna likizo ya baba iliyowekwa kisheria'],
      [/Not statutory/g, 'Si wa lazima kisheria'],
      [/Not specified/g, 'Haijabainishwa'],
      [/Full pay/g, 'Malipo kamili'],
      [/full pay/g, 'malipo kamili'],
      [/Half pay/g, 'Nusu malipo'],
      [/half pay/g, 'nusu malipo'],
      [/with medical certificate/g, 'kwa cheti cha daktari'],
      [/medical certificate/g, 'cheti cha daktari'],
      [/No qualifying period/g, 'hakuna kipindi cha kusubiri'],
      [/All female employees/g, 'waajiriwa wote wa kike'],
      [/contributions/g, 'michango'],
      [/employment/g, 'ajira'],
      [/Unpaid by employer\. UIF pays 66%\./g, 'Mwajiri hailipi moja kwa moja; UIF hulipa karibu 66%.'],
      [/Unpaid/g, 'Hailipwi'],
      [/Birth, illness, or death of immediate family\./g, 'Kuzaliwa, ugonjwa au kifo cha mwanafamilia wa karibu.'],
      [/Many employers offer 15-21 by contract\./g, 'Waajiri wengi hutoa kati ya siku 15 na 21 kwa mkataba.']
    ]);
  }

  function localizeLeaveAccrual(text) {
    return translateLeaveText(text);
  }

  function localizeLeavePay(text) {
    if (!text) return text;
    return replaceTextPairs(translateLeaveText(text), [
      [/\bPaid\b/g, 'Hulipwa'],
      [/\bpaid\b/g, 'hulipwa'],
      [/\bwages\b/g, 'mshahara']
    ]);
  }

  function localizeLeaveEligibility(text) {
    return translateLeaveText(text);
  }

  function localizeLeavePeriod(text) {
    return translateLeaveText(text);
  }

  function buildLeaveAnnualNotes(section) {
    if (!section) return 'Data ya likizo ya mwaka bado ni chache kwenye seti hii ya data.';
    var parts = [];
    if (section.accrual) parts.push('Upatikanaji: ' + section.accrual + '.');
    if (section.notes) parts.push(section.notes);
    if (!parts.length && typeof section.days === 'number' && section.days > 0) {
      parts.push('Kiwango cha chini cha kisheria ni siku ' + section.days + ' za likizo ya mwaka.');
    }
    return parts.join(' ');
  }

  function buildLeaveSickNotes(section) {
    if (!section) return 'Data ya likizo ya ugonjwa bado ni chache kwenye seti hii ya data.';
    var parts = [];
    if (typeof section.days === 'number' && section.days > 0) {
      parts.push(
        'Marejeo ya muda ni siku ' +
          section.days +
          (section.per ? ' ' + section.per : '') +
          '.'
      );
    }
    if (section.pay) parts.push('Malipo: ' + section.pay + '.');
    if (section.notes) parts.push(section.notes);
    if (!parts.length) parts.push('Sheria ya nchi hii haijatoa maelezo mengi kuhusu likizo ya ugonjwa kwenye seti hii ya data.');
    return parts.join(' ');
  }

  function buildLeaveMaternityNotes(section) {
    if (!section) return 'Data ya likizo ya uzazi bado ni chache kwenye seti hii ya data.';
    var parts = [];
    if (typeof section.weeks === 'number' && section.weeks > 0) {
      parts.push('Muda wa kisheria ni wiki ' + section.weeks + '.');
    }
    if (section.pay) parts.push('Malipo: ' + section.pay + '.');
    if (section.eligibility) parts.push('Ustahiki: ' + section.eligibility + '.');
    if (section.notes) parts.push(section.notes);
    if (!parts.length) parts.push('Likizo ya uzazi ipo, lakini maelezo ya kina ya malipo au ustahiki hayajatajwa wazi kwenye seti hii ya data.');
    return parts.join(' ');
  }

  function buildLeavePaternityNotes(section) {
    if (!section) return 'Data ya likizo ya baba bado ni chache kwenye seti hii ya data.';
    if (!section.days) {
      return section.notes || 'Hakuna likizo ya baba iliyowekwa kisheria kwenye seti hii ya data.';
    }
    var parts = ['Likizo ya baba ya kisheria ni siku ' + section.days + '.'];
    if (section.pay) parts.push('Malipo: ' + section.pay + '.');
    if (section.notes) parts.push(section.notes);
    return parts.join(' ');
  }

  function buildLeaveOtherNotes(section, fallbackTitle) {
    if (!section) return '';
    var parts = [];
    if (typeof section.days === 'number' && section.days > 0) {
      parts.push(fallbackTitle + ': siku ' + section.days + '.');
    }
    if (section.notes) parts.push(section.notes);
    if (section.law) parts.push('Sheria: ' + section.law + '.');
    return parts.join(' ');
  }

  function localizeLeaveSection(section, kind) {
    if (!section) return section;

    var localized = clone(section);
    if (localized.law) localized.law = localizeLeaveLaw(localized.law);
    if (localized.accrual) localized.accrual = localizeLeaveAccrual(localized.accrual);
    if (localized.pay) localized.pay = localizeLeavePay(localized.pay);
    if (localized.eligibility) localized.eligibility = localizeLeaveEligibility(localized.eligibility);
    if (localized.per) localized.per = localizeLeavePeriod(localized.per);
    if (localized.notes) localized.notes = translateLeaveText(localized.notes);

    if (kind === 'annual') localized.notes = buildLeaveAnnualNotes(localized);
    if (kind === 'sick') localized.notes = buildLeaveSickNotes(localized);
    if (kind === 'maternity') localized.notes = buildLeaveMaternityNotes(localized);
    if (kind === 'paternity') localized.notes = buildLeavePaternityNotes(localized);
    if (kind === 'family') localized.notes = buildLeaveOtherNotes(localized, 'Likizo ya wajibu wa familia');
    if (kind === 'compassionate') localized.notes = buildLeaveOtherNotes(localized, 'Likizo ya maombolezo au huruma');

    return localized;
  }

  function buildGenericLeaveObservation(code, dataOverride) {
    var data =
      dataOverride ||
      LEAVE_CACHE[code] ||
      (window.LEAVE_ENTITLEMENTS && window.LEAVE_ENTITLEMENTS[code]
        ? clone(window.LEAVE_ENTITLEMENTS[code])
        : null);
    if (!data) {
      return 'Chagua nchi ili uone muhtasari wa likizo ya mwaka, uzazi, ugonjwa na sikukuu za umma.';
    }

    if (data.name) data.name = localizeLeaveCountryName(data.name, code);
    var parts = [];
    var name = data.name || code;
    var annualDays = data.annualLeave && data.annualLeave.days;
    var maternityWeeks = data.maternityLeave && data.maternityLeave.weeks;
    var paternityDays = data.paternityLeave && data.paternityLeave.days;

    if (annualDays) {
      parts.push(name + ' ina kiwango cha chini cha siku ' + annualDays + ' za likizo ya mwaka.');
    }
    if (maternityWeeks) {
      parts.push('Likizo ya uzazi ni wiki ' + maternityWeeks + '.');
    }
    if (paternityDays) {
      parts.push('Likizo ya baba ni siku ' + paternityDays + '.');
    } else {
      parts.push('Likizo ya baba haijatajwa sana au haijawekwa wazi katika seti hii ya data.');
    }
    if (typeof data.publicHolidays === 'number' && data.publicHolidays > 0) {
      parts.push('Sikukuu za umma za kawaida ni takriban ' + data.publicHolidays + ' kwa mwaka.');
    }

    return parts.join(' ');
  }

  function getLeaveObservation(code, dataOverride) {
    if (LEAVE_OBSERVATION_OVERRIDES[code]) return LEAVE_OBSERVATION_OVERRIDES[code];
    if (window.LEAVE_OBSERVATIONS && window.LEAVE_OBSERVATIONS[code]) {
      return translateLeaveText(window.LEAVE_OBSERVATIONS[code]);
    }
    return buildGenericLeaveObservation(code, dataOverride);
  }

  function getLeaveNoDataExplanation(code, dataOverride) {
    var data =
      dataOverride ||
      LEAVE_CACHE[code] ||
      (window.LEAVE_ENTITLEMENTS && window.LEAVE_ENTITLEMENTS[code]
        ? clone(window.LEAVE_ENTITLEMENTS[code])
        : null);
    if (!data) {
      return 'Data ya nchi hii bado ni nyembamba. Hakiki na sheria ya kazi ya ndani au taasisi ya taifa ya kazi kwa uthibitisho zaidi.';
    }

    if (data.name) data.name = localizeLeaveCountryName(data.name, code);
    var signals = 0;
    if (data.annualLeave && (data.annualLeave.law || data.annualLeave.notes)) signals += 1;
    if (data.sickLeave && (data.sickLeave.days || data.sickLeave.notes || data.sickLeave.pay)) signals += 1;
    if (data.maternityLeave && (data.maternityLeave.weeks || data.maternityLeave.notes || data.maternityLeave.pay)) signals += 1;
    if (data.paternityLeave && (data.paternityLeave.days || data.paternityLeave.notes)) signals += 1;

    if (signals <= 2) {
      return 'Seti hii ina muhtasari wa msingi tu kwa nchi hii. Tumia matokeo kama mwongozo wa haraka, kisha hakiki sheria ya ndani kabla ya kufanya maamuzi ya HR au malipo.';
    }

    return 'Data ya nchi hii inapatikana kwenye kiwango cha muhtasari. Angalia sheria ya kazi na sera ya mwajiri kwa maelezo ya mwisho kuhusu malipo, uhamishaji wa siku na ustahiki.';
  }

  function localizeLeaveCountry(code) {
    if (LEAVE_CACHE[code]) return LEAVE_CACHE[code];
    if (!window.LEAVE_ENTITLEMENTS || !window.LEAVE_ENTITLEMENTS[code]) return null;

    var localized = clone(window.LEAVE_ENTITLEMENTS[code]);
    localized.name = localizeLeaveCountryName(localized.name, code);
    localized.annualLeave = localizeLeaveSection(localized.annualLeave, 'annual');
    localized.sickLeave = localizeLeaveSection(localized.sickLeave, 'sick');
    localized.maternityLeave = localizeLeaveSection(localized.maternityLeave, 'maternity');
    localized.paternityLeave = localizeLeaveSection(localized.paternityLeave, 'paternity');
    localized.compassionateLeave = localizeLeaveSection(localized.compassionateLeave, 'compassionate');
    localized.familyResponsibility = localizeLeaveSection(localized.familyResponsibility, 'family');
    localized.observation = getLeaveObservation(code, localized);
    localized.noDataExplanation = getLeaveNoDataExplanation(code, localized);

    LEAVE_CACHE[code] = localized;
    return localized;
  }

  function getPrimaryRateLabel(rate) {
    if (!rate) return '';
    if (typeof rate.weekday === 'number') return rate.weekday + 'x kwa siku ya kazi';
    if (typeof rate.daytime === 'number') return rate.daytime + 'x kwa OT ya mchana';
    if (typeof rate.day === 'number') return rate.day + 'x kwa kazi ya mchana';
    if (typeof rate.first8hrs === 'number') return rate.first8hrs + 'x kwa saa 8 za kwanza za ziada';
    if (typeof rate.first2hrs === 'number') return rate.first2hrs + 'x kwa saa 2 za kwanza za ziada';
    if (typeof rate.first === 'number') return rate.first + 'x kwa kiwango cha kwanza cha OT';
    return '';
  }

  function getSecondaryRateLabel(rate) {
    if (!rate) return '';
    if (typeof rate.publicHoliday === 'number') return rate.publicHoliday + 'x kwa sikukuu ya umma';
    if (typeof rate.sundayOrHoliday === 'number') return rate.sundayOrHoliday + 'x kwa Jumapili au sikukuu';
    if (typeof rate.restDay === 'number') return rate.restDay + 'x kwa siku ya mapumziko';
    if (typeof rate.weekend === 'number') return rate.weekend + 'x kwa wikendi';
    return '';
  }

  function buildLimitSummary(maxOvertime) {
    if (!maxOvertime) return '';
    var parts = [];
    if (maxOvertime.daily) parts.push('saa ' + maxOvertime.daily + ' kwa siku');
    if (maxOvertime.weekly) parts.push('saa ' + maxOvertime.weekly + ' kwa wiki');
    if (maxOvertime.monthly) parts.push('saa ' + maxOvertime.monthly + ' kwa mwezi');
    return parts.join(', ');
  }

  function buildGenericNotes(rule) {
    if (!rule) return '';
    var parts = [];
    if (rule.maxOvertime && rule.maxOvertime.notes) {
      parts.push(localizeMaxNote(rule.maxOvertime.notes));
    }
    if (rule.timeOff) {
      parts.push(localizeTimeOff(rule.timeOff));
    }
    if (rule.exemptions && rule.exemptions.length) {
      parts.push('Baadhi ya makundi ya wafanyakazi yanaweza kutengwa na ulinzi huu wa OT.');
    }
    if (!parts.length && rule.standardHours && rule.standardHours.law) {
      parts.push('Marejeo ya msingi ya sheria ya kazi hapa ni ' + localizeLaw(rule.standardHours.law) + '.');
    }
    if (!parts.length) {
      parts.push('Maelezo ya ziada ya nchi hii hayajatajwa wazi kwenye seti hii ya data.');
    }
    return parts.join(' ');
  }

  function buildGenericObservation(code, rule) {
    if (!rule) {
      return 'Chagua nchi uone muhtasari wa sheria za kazi, saa za kawaida na viwango vya muda wa ziada.';
    }

    var name = rule.name || code;
    var parts = [];
    if (rule.standardHours && rule.standardHours.weekly) {
      parts.push(name + ' hutumia wiki ya kazi ya saa ' + rule.standardHours.weekly + '.');
    } else {
      parts.push(name + ' ina viwango vya muda wa ziada kwenye seti hii ya data, lakini saa za kawaida za wiki hazijatajwa wazi.');
    }

    var primaryRate = getPrimaryRateLabel(rule.overtimeRate);
    var secondaryRate = getSecondaryRateLabel(rule.overtimeRate);
    if (primaryRate && secondaryRate) {
      parts.push('Kiwango cha kawaida ni ' + primaryRate + ', huku ' + secondaryRate + '.');
    } else if (primaryRate) {
      parts.push('Kiwango cha kawaida ni ' + primaryRate + '.');
    } else if (secondaryRate) {
      parts.push('Kwa siku maalumu, kiwango ni ' + secondaryRate + '.');
    }

    var limitSummary = buildLimitSummary(rule.maxOvertime);
    if (limitSummary) {
      parts.push('Kikomo kilichorekodiwa ni ' + limitSummary + '.');
    }

    if (!rule.standardHours || !rule.standardHours.law) {
      parts.push('Msingi wa kisheria wa moja kwa moja haujatajwa wazi kwenye seti hii ya data.');
    }

    return parts.join(' ');
  }

  function localizeRule(code) {
    if (RULE_CACHE[code]) return RULE_CACHE[code];
    if (!window.OVERTIME_RULES || !window.OVERTIME_RULES[code]) return null;

    var localized = clone(window.OVERTIME_RULES[code]);
    if (localized.standardHours && localized.standardHours.law) {
      localized.standardHours.law = localizeLaw(localized.standardHours.law);
    }
    if (localized.notes) {
      localized.notes = localizeNote(localized.notes);
    } else {
      localized.notes = buildGenericNotes(localized);
    }
    if (localized.maxOvertime && localized.maxOvertime.notes) {
      localized.maxOvertime.notes = localizeMaxNote(localized.maxOvertime.notes);
    }
    if (localized.restDay) {
      localized.restDay = localizeRestDay(localized.restDay);
    }
    if (localized.nightWork) {
      localized.nightWork = localizeNightWork(localized.nightWork);
    }
    if (localized.exemptions && localized.exemptions.length) {
      localized.exemptions = localized.exemptions.map(localizeExemption);
    }
    if (localized.timeOff) {
      localized.timeOff = localizeTimeOff(localized.timeOff);
    }

    RULE_CACHE[code] = localized;
    return localized;
  }

  function getObservation(code) {
    if (OBSERVATION_OVERRIDES[code]) return OBSERVATION_OVERRIDES[code];
    return buildGenericObservation(code, localizeRule(code));
  }

  function getLawLabel(code) {
    var rule = localizeRule(code);
    if (rule && rule.standardHours && rule.standardHours.law) {
      return 'Sheria: ' + rule.standardHours.law;
    }
    return 'Msingi wa kisheria: rejea ya moja kwa moja haijatajwa kwenye seti hii ya data.';
  }

  function getLegalFallback(code) {
    var rule = localizeRule(code);
    if (rule && rule.notes) return rule.notes;
    return 'Maelezo ya ziada ya nchi hii hayajatajwa wazi kwenye seti hii ya data.';
  }

  var originalCalculateOvertime = E.calculateOvertime.bind(E);
  E.calculateOvertime = function (input) {
    var result = originalCalculateOvertime(input);
    if (!result || !input || !input.country) return result;

    var rule = localizeRule(input.country);
    if (!rule) return result;

    return Object.assign({}, result, {
      notes: rule.notes || result.notes || '',
      exemptions: rule.exemptions || result.exemptions || null,
      timeOff: rule.timeOff || result.timeOff || null,
      maxOvertime: rule.maxOvertime || result.maxOvertime || null,
      law: rule.standardHours && rule.standardHours.law ? rule.standardHours.law : '',
      observation: getObservation(input.country)
    });
  };

  if (typeof E.calculateSocialSecurity === 'function') {
    var originalCalculateSocialSecurity = E.calculateSocialSecurity.bind(E);
    E.calculateSocialSecurity = function (code, monthlySalary) {
      var result = originalCalculateSocialSecurity(code, monthlySalary);
      if (!result || !code) return result;

      var localizedCountry = localizeSocialSecurityCountry(code);
      if (!localizedCountry) {
        return Object.assign({}, result, {
          observation: getSocialSecurityObservation(code),
          noDataExplanation: getSocialSecurityNoDataExplanation(code)
        });
      }

      var breakdown = (result.breakdown || []).map(function (item, index) {
        var localizedScheme = localizedCountry.schemes && localizedCountry.schemes[index];
        var localizedName = localizedScheme && localizedScheme.name
          ? localizedScheme.name
          : localizeSocialSecuritySchemeName(item.name);
        var localizedNotes = localizedScheme && localizedScheme.notes
          ? localizedScheme.notes
          : localizeSocialSecurityNote(item.notes || item.note || '', code, localizedName);
        var localizedLaw = localizedScheme && localizedScheme.law
          ? localizedScheme.law
          : localizeSocialSecurityLaw(item.law);

        return Object.assign({}, item, {
          name: localizedName,
          notes: localizedNotes,
          note: localizedNotes,
          law: localizedLaw,
          cap: localizedScheme && localizedScheme.cap ? localizedScheme.cap : item.cap || null
        });
      });

      return Object.assign({}, result, {
        breakdown: breakdown,
        observation: getSocialSecurityObservation(code),
        noDataExplanation: getSocialSecurityNoDataExplanation(code)
      });
    };
  }

  if (typeof E.getLeaveEntitlements === 'function') {
    var originalGetLeaveEntitlements = E.getLeaveEntitlements.bind(E);
    E.getLeaveEntitlements = function (code) {
      var result = originalGetLeaveEntitlements(code);
      if (!result || !code) return result;

      var localizedCountry = localizeLeaveCountry(code);
      if (!localizedCountry) {
        return Object.assign({}, result, {
          observation: getLeaveObservation(code),
          noDataExplanation: getLeaveNoDataExplanation(code)
        });
      }

      return Object.assign({}, result, {
        country: localizedCountry.name,
        annualLeave: localizedCountry.annualLeave || result.annualLeave,
        sickLeave: localizedCountry.sickLeave || result.sickLeave,
        maternityLeave: localizedCountry.maternityLeave || result.maternityLeave,
        paternityLeave: localizedCountry.paternityLeave || result.paternityLeave,
        compassionateLeave: localizedCountry.compassionateLeave || result.compassionateLeave,
        familyResponsibility: localizedCountry.familyResponsibility || result.familyResponsibility,
        publicHolidays:
          typeof localizedCountry.publicHolidays === 'number'
            ? localizedCountry.publicHolidays
            : result.publicHolidays,
        totalDaysOff:
          (localizedCountry.annualLeave && localizedCountry.annualLeave.days
            ? localizedCountry.annualLeave.days
            : result.annualLeave && result.annualLeave.days
              ? result.annualLeave.days
              : 0) +
          (typeof localizedCountry.publicHolidays === 'number'
            ? localizedCountry.publicHolidays
            : result.publicHolidays || 0),
        observation: localizedCountry.observation || getLeaveObservation(code),
        noDataExplanation:
          localizedCountry.noDataExplanation || getLeaveNoDataExplanation(code)
      });
    };
  }

  AfroTools.HRSwOverlay = {
    getRule: localizeRule,
    getObservation: getObservation,
    getLawLabel: getLawLabel,
    getLegalFallback: getLegalFallback,
    getSocialSecurityCountry: localizeSocialSecurityCountry,
    getSocialSecurityObservation: getSocialSecurityObservation,
    getSocialSecurityNoDataExplanation: getSocialSecurityNoDataExplanation,
    getLeaveCountry: localizeLeaveCountry,
    getLeaveObservation: getLeaveObservation,
    getLeaveNoDataExplanation: getLeaveNoDataExplanation
  };
})(window);
