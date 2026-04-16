(function (window) {
  'use strict';

  var AfroTools = (window.AfroTools = window.AfroTools || {});
  var E = AfroTools.HREngine;
  if (!E || AfroTools.__hrSwOverlayApplied) return;
  AfroTools.__hrSwOverlayApplied = true;

  var RULE_CACHE = {};

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

  AfroTools.HRSwOverlay = {
    getRule: localizeRule,
    getObservation: getObservation,
    getLawLabel: getLawLabel,
    getLegalFallback: getLegalFallback
  };
})(window);
