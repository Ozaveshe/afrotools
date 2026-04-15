(function (window) {
  'use strict';

  var AfroTools = window.AfroTools = window.AfroTools || {};
  var E = AfroTools.MinWageEngine;
  if (!E || AfroTools.__minWageSwOverlayApplied) return;
  AfroTools.__minWageSwOverlayApplied = true;

  var LAW_OVERRIDES = {
    'Code du Travail — SMIG/SMAG Review': 'Kanuni ya Kazi — mapitio ya SMIG/SMAG',
    'Decent Work Act': 'Sheria ya Kazi Yenye Staha',
    'Decree on Minimum Wage (SMIG/SMAG)': 'Amri kuhusu kima cha chini cha mshahara (SMIG/SMAG)',
    'Employment Act — Minimum Wage Order': 'Sheria ya Ajira — amri ya kima cha chini cha mshahara',
    'Employment Act — Minimum Wages Order': 'Sheria ya Ajira — amri ya viwango vya kima cha chini cha mshahara',
    'Employment Act — Wages Order': 'Sheria ya Ajira — amri ya mishahara',
    'Labour Act 2017 (minimum wage provision not implemented)': 'Sheria ya Kazi ya 2017 (kipengele cha kima cha chini cha mshahara hakijatekelezwa)',
    'Labour Act — Minimum Wage Order': 'Sheria ya Kazi — amri ya kima cha chini cha mshahara',
    'Labour Code Order — Minimum Wage': 'Amri ya Kanuni ya Kazi — kima cha chini cha mshahara',
    'Labour Code — Minimum Wage Decree': 'Kanuni ya Kazi — amri ya kima cha chini cha mshahara',
    'Labour Institutions Act (Revised 2022)': 'Sheria ya Taasisi za Kazi (marekebisho ya 2022)',
    'Labour Law — Public Sector Salary Scale': 'Sheria ya Kazi — kiwango cha mishahara ya sekta ya umma',
    'Labour Proclamation': 'Tangazo la Sheria ya Kazi',
    'Minimum Wage Act': 'Sheria ya Kima cha Chini cha Mshahara',
    'Minimum Wage Decree': 'Amri ya Kima cha Chini cha Mshahara',
    'Minimum Wage Order under the Labour Act': 'Amri ya kima cha chini cha mshahara chini ya Sheria ya Kazi',
    'Minimum Wage by Sector — Annual Gazette': 'Kima cha chini cha mshahara kwa sekta — gazeti la kila mwaka',
    'Minimum Wages Advisory Board Act (1957)': 'Sheria ya Bodi ya Ushauri wa Kima cha Chini cha Mshahara (1957)',
    'Minimum Wages and Conditions of Employment Act': 'Sheria ya Kima cha Chini cha Mshahara na Masharti ya Ajira',
    'National Daily Minimum Wage Declaration': 'Tamko la Kima cha Chini cha Mshahara wa Siku la Taifa',
    'National Employment Council Agreements': 'Makubaliano ya Baraza la Taifa la Ajira',
    'National Minimum Wage (Amendment) Act 2024': 'Sheria ya Kima cha Chini cha Mshahara ya Taifa (marekebisho) 2024',
    'National Minimum Wage Act (2018), amendment effective 1 March 2026': 'Sheria ya Kima cha Chini cha Mshahara ya Taifa (2018), marekebisho yalianza 1 Machi 2026',
    'National Minimum Wage Decree': 'Amri ya Kitaifa ya Kima cha Chini cha Mshahara',
    'National Minimum Wage Regulations': 'Kanuni za Kitaifa za Kima cha Chini cha Mshahara',
    'National Wages Council Decision': 'Uamuzi wa Baraza la Taifa la Mishahara',
    'No comprehensive national minimum wage': 'Hakuna kima cha chini cha mshahara cha taifa chenye ufunikaji mpana',
    'No effective minimum wage legislation': 'Hakuna sheria inayotekelezeka ya kima cha chini cha mshahara',
    'No national minimum wage legislation (private sector)': 'Hakuna sheria ya kima cha chini cha mshahara ya taifa kwa sekta binafsi',
    'Presidential Decree on National Minimum Wage': 'Amri ya Rais kuhusu kima cha chini cha mshahara cha taifa',
    'SMIG': 'SMIG',
    'SMIG (Salaire Minimum Interprofessionnel Garanti)': 'SMIG (mshahara wa chini wa taaluma mbalimbali uliothibitishwa)',
    'SMIG — Inter-professional Guaranteed Minimum Wage': 'SMIG — mshahara wa chini wa taaluma mbalimbali uliothibitishwa',
    'SNMG (Salaire National Minimum Garanti)': 'SNMG (mshahara wa chini wa taifa uliothibitishwa)',
    'Salaire Minimum Interprofessionnel Garanti (SMIG)': 'Mshahara wa chini wa taaluma mbalimbali uliothibitishwa (SMIG)',
    'Wage Order under the Employment and Labour Relations Act': 'Amri ya mishahara chini ya Sheria ya Ajira na Mahusiano Kazini'
  };

  var SECTOR_NAME_OVERRIDES = {
    'Agriculture': 'Kilimo',
    'Agriculture (Unskilled)': 'Kilimo (wasio na ujuzi maalumu)',
    'Commerce / Industry': 'Biashara / viwanda',
    'Domestic Workers': 'Wafanyakazi wa majumbani',
    'Expanded Public Works (EPWP)': 'Kazi za umma zilizopanuliwa (EPWP)',
    'Export Processing Zone': 'Eneo la usindikaji wa mauzo ya nje',
    'Farm Workers': 'Wafanyakazi wa mashambani',
    'Federal / Large Employers (25+ employees)': 'Shirikisho / waajiri wakubwa (wafanyakazi 25+)',
    'Financial Services': 'Huduma za kifedha',
    'Formal Sector': 'Sekta rasmi',
    'Garment / Textile': 'Nguo / nguo za viwandani',
    'General': 'Kawaida',
    'General (USD)': 'Kawaida (USD)',
    'General Workers': 'Wafanyakazi wa kawaida',
    'General — Nairobi / Mombasa': 'Kawaida — Nairobi / Mombasa',
    'General — Other Areas': 'Kawaida — maeneo mengine',
    'Government Employees': 'Wafanyakazi wa serikali',
    'Manufacturing': 'Uzalishaji',
    'Mining': 'Madini',
    'National Daily Minimum': 'Kima cha chini cha siku cha taifa',
    'National Minimum': 'Kima cha chini cha taifa',
    'National Minimum Wage (General)': 'Kima cha chini cha mshahara cha taifa (kawaida)',
    'Other Sectors': 'Sekta nyingine',
    'Private Sector': 'Sekta binafsi',
    'Private Sector (<25 employees)': 'Sekta binafsi (chini ya wafanyakazi 25)',
    'Public Sector': 'Sekta ya umma',
    'SMAG (Agriculture)': 'SMAG (kilimo)',
    'SMIG': 'SMIG',
    'SMIG (40hr regime)': 'SMIG (utaratibu wa saa 40)',
    'SMIG (48hr regime)': 'SMIG (utaratibu wa saa 48)',
    'SMIG (General)': 'SMIG (kawaida)',
    'SMIG (Non-Agricultural)': 'SMIG (isiyo ya kilimo)',
    'SNMG': 'SNMG',
    'Security Guards': 'Walinda usalama',
    'Service & Commerce': 'Huduma na biashara',
    'Services': 'Huduma',
    'Shop Workers': 'Wafanyakazi wa madukani',
    'Tea Sector': 'Sekta ya chai',
    'Telecommunications': 'Mawasiliano ya simu',
    'Transport': 'Usafiri'
  };

  var STATE_NOTE_OVERRIDES = {
    'Governor mandated higher floor': 'Gavana ameweka kiwango cha juu zaidi',
    'Government relief workers - lower statutory rate': 'Wafanyakazi wa mpango wa msaada wa serikali - kiwango cha kisheria ni cha chini zaidi'
  };

  var STATE_NAME_OVERRIDES = {
    ZA: {
      'National Minimum (General)': 'Kima cha chini cha taifa (kawaida)',
      'Farm Workers': 'Wafanyakazi wa mashambani',
      'Domestic Workers': 'Wafanyakazi wa majumbani',
      'EPWP (Expanded Public Works Programme)': 'EPWP (mpango uliopanuliwa wa kazi za umma)'
    }
  };

  var COUNTRY_OVERRIDES = {
    KE: {
      notes: 'Kenya ina mfumo wa viwango vya kima cha chini kulingana na eneo na aina ya kazi. Nairobi na Mombasa hulipa zaidi kuliko maeneo mengine, huku wafanyakazi wa kilimo wakibaki chini ya viwango vya mijini. Waziri wa Kazi hukagua viwango kwa notisi za gazeti la serikali kila baada ya takribani miaka miwili.',
      observation: 'Mfumo wa Kenya wa kuzingatia eneo una maana kwamba wafanyakazi wa mijini hulipwa zaidi kuliko walio vijijini. Pengo kati ya KES 16,114 ya Nairobi na Mombasa na makadirio ya gharama ya maisha ya karibu KES 35,000 bado ni kubwa, hasa kwa gharama za nyumba. Migogoro ya mishahara mara nyingi hushughulikiwa na mahakama za kazi.'
    },
    TZ: {
      notes: 'Tanzania ilikaa miaka 11 bila marekebisho ya kima cha chini cha mshahara kati ya 2013 na 2024. Marekebisho ya 2024 yaliongeza karibu viwango vyote maradufu, huku madini na mawasiliano ya simu yakibaki juu zaidi. Mfumo wa bodi za mishahara kwa sekta unafunika takribani sekta 12.',
      observation: 'Mapitio ya 2024 yalikatiza pengo refu la miaka 11 bila marekebisho. Wafanyakazi wa madini hupokea zaidi ya mara mbili ya kiwango cha kilimo, jambo linaloonyesha tofauti kubwa za sekta. Mfumo wa bodi za mishahara una faida ya utofauti wa sekta lakini ni mgumu kutekeleza.'
    },
    NG: {
      notes: 'Kiwango cha Naira 70,000 kilisainiwa Aprili 2024 baada ya majadiliano ya pande tatu. Majimbo yalitakiwa kutekeleza ndani ya miezi sita, huku Rivers ikitangaza kiwango cha juu zaidi. Kwa biashara ndogo zenye wafanyakazi chini ya 25, kiwango cha rejea bado ni Naira 50,000. NSIWC ndiyo inayosimamia utekelezaji.',
      observation: 'Nigeria ilipandisha kima cha chini kutoka Naira 30,000 hadi Naira 70,000 mwaka 2024, ongezeko kubwa sana kwa majina. Hata hivyo, mfumuko mkubwa wa bei umeondoa sehemu ya nguvu ya ongezeko hilo. Makadirio ya gharama ya maisha ya familia ya watu 4 Lagos yako juu sana kuliko kiwango cha kisheria.'
    },
    ZA: {
      notes: 'Afrika Kusini ilipandisha kima cha chini cha taifa hadi R30.23 kwa saa kuanzia 1 Machi 2026. Wafanyakazi wa EPWP bado wako chini ya utaratibu tofauti wa R16.62 kwa saa. Tume ya Kima cha Chini hupitia kiwango kila mwaka kwa kuzingatia mfumuko wa bei, uzalishaji na uwezo wa waajiri.',
      observation: 'Afrika Kusini ina mfumo ulioratibiwa vizuri wenye mapitio ya kila mwaka. Kuingizwa kwa wafanyakazi wa mashambani na wa majumbani kwenye mfumo mmoja wa taifa kulikuwa hatua muhimu ya usawa. Kutokufuata sheria kunaweza kusababisha amri za malipo, faini na adhabu kubwa zaidi kwa wanaorudia kosa.'
    },
    ET: {
      notes: 'Ethiopia haina kima cha chini cha mshahara cha taifa kwa sekta binafsi. Wafanyakazi wa serikali pekee ndio wana kiwango cha rejea cha karibu ETB 765 kwa mwezi. Muswada wa kima cha chini cha mshahara umejadiliwa kwa miaka kadhaa bila kupitishwa.',
      observation: 'Kutokuwepo kwa kima cha chini cha mshahara kwa sekta binafsi kumeifanya Ethiopia kuvutia baadhi ya uwekezaji wa viwanda vya nguo, lakini pia kumeibua ukosoaji kutoka kwa watetezi wa haki za wafanyakazi. Mjadala wa kisheria bado haujafikia utekelezaji.',
      noMinimumWageExplanation: 'Sekta binafsi ya Ethiopia haina kima cha chini cha mshahara cha taifa kilichowekwa kwa sasa. Tumia viwango vya sekta au masharti ya mkataba kama marejeo, na kumbuka kwamba wafanyakazi wa serikali wana kiwango tofauti cha msingi.'
    },
    RW: {
      notes: 'Rwanda haina kima cha chini cha mshahara cha taifa kinachofunika sekta zote. Baadhi ya amri za wizara huweka viwango kwa sekta maalumu kama chai, wakati serikali ikisisitiza zaidi ujuzi na nguvu za soko katika kupanga mishahara.',
      observation: 'Rwanda hutegemea zaidi mfumo wa soko kuliko sheria ya jumla ya kima cha chini cha mshahara. Sekta chache tu kama chai zina viwango vya gazeti la serikali, huku mjadala wa ulinzi wa wafanyakazi ukiendelea pamoja na ukuaji wa uchumi.',
      noMinimumWageExplanation: 'Rwanda haina kima cha chini cha mshahara cha taifa cha jumla kwa sekta zote. Angalia viwango vya sekta maalumu vilivyopo, kama vya chai, au masharti ya mkataba wa kazi kwa rejea.'
    }
  };

  function localizeLaw(law) {
    return LAW_OVERRIDES[law] || law;
  }

  function localizePeriod(period) {
    if (period === 'month') return 'mwezi';
    if (period === 'day') return 'siku';
    if (period === 'hour') return 'saa';
    return period;
  }

  function localizeRateText(rate) {
    if (rate === 'Not set') return 'Hakijawekwa';
    return rate;
  }

  function localizeSectorName(name) {
    return SECTOR_NAME_OVERRIDES[name] || name;
  }

  function localizeStateName(countryCode, name) {
    var overrides = STATE_NAME_OVERRIDES[countryCode];
    return overrides && overrides[name] ? overrides[name] : name;
  }

  function localizeStateNote(note) {
    if (!note) return note;
    return STATE_NOTE_OVERRIDES[note] || note;
  }

  function fmt(value, symbol) {
    return E && E.fmt ? E.fmt(value, symbol) : (symbol || '') + value;
  }

  function buildGenericNotes(country) {
    if (!country) return '';

    if (!country.monthly) {
      var noMinParts = [
        'Kwa sasa hakuna kima cha chini cha mshahara cha taifa kinachotumika kikamilifu kwa sekta binafsi.'
      ];
      if (country.sectors && country.sectors.length) {
        noMinParts.push('Baadhi ya sekta au makundi maalumu bado yanaweza kuwa na viwango vya marejeo vilivyotajwa hapa chini.');
      }
      if (country.law) {
        noMinParts.push('Msingi uliorekodiwa ni ' + country.law + '.');
      }
      return noMinParts.join(' ');
    }

    var parts = [
      'Taarifa hii inaakisi kiwango cha chini cha mshahara kilichorekodiwa kwa ' + country.effectiveDate + '.'
    ];
    if (country.sectors && country.sectors.length > 1) {
      parts.push('Baadhi ya sekta zina viwango maalumu vilivyoorodheshwa hapa chini.');
    }
    if (country.law) {
      parts.push('Msingi wa kisheria uliorekodiwa ni ' + country.law + '.');
    }
    return parts.join(' ');
  }

  function buildGenericObservation(country) {
    if (!country) return '';

    if (!country.monthly) {
      var noMinParts = [
        'Hakuna kima cha chini cha mshahara cha taifa kinachotumika kwa upana katika sekta binafsi.'
      ];
      if (country.sectors && country.sectors.length) {
        noMinParts.push('Hata hivyo, baadhi ya sekta maalumu au taasisi za umma zinaweza kuwa na viwango vya marejeo.');
      }
      if (country.effectiveDate && country.effectiveDate !== 'N/A') {
        noMinParts.push('Marejeo yaliyopo yanaonyesha tarehe ya ' + country.effectiveDate + '.');
      }
      return noMinParts.join(' ');
    }

    var parts = [
      'Kiwango kilichorekodiwa hapa ni ' + fmt(country.monthly, country.symbol) + ' kwa mwezi.'
    ];
    if (country.livingWage > 0) {
      parts.push('Makadirio ya gharama ya maisha kwa mtu mmoja ni ' + fmt(country.livingWage, country.symbol) + ' kwa mwezi.');
    }
    if (country.sectors && country.sectors.length > 1) {
      parts.push('Muundo wa sekta unaonyesha kuwa viwango vinaweza kutofautiana kulingana na kazi au eneo.');
    }
    if (country.effectiveDate && country.effectiveDate !== 'N/A') {
      parts.push('Tarehe ya kuanza kutumika iliyorekodiwa ni ' + country.effectiveDate + '.');
    }
    return parts.join(' ');
  }

  function localizeCountry(country) {
    if (!country) return country;

    var override = COUNTRY_OVERRIDES[country.code] || {};
    var localized = Object.assign({}, country);

    localized.law = override.law || localizeLaw(country.law);
    localized.sectors = (country.sectors || []).map(function (sector) {
      return Object.assign({}, sector, {
        name: (override.sectors && override.sectors[sector.name]) || localizeSectorName(sector.name),
        period: localizePeriod(sector.period),
        rate: localizeRateText(sector.rate)
      });
    });
    localized.notes = override.notes || buildGenericNotes(localized);
    localized.observation = override.observation || buildGenericObservation(localized);

    return localized;
  }

  function getNoMinimumWageExplanation(code, country) {
    var override = COUNTRY_OVERRIDES[code] || {};
    if (override.noMinimumWageExplanation) return override.noMinimumWageExplanation;
    if (country && country.sectors && country.sectors.length) {
      return 'Hakuna kima cha chini cha mshahara cha taifa kinachotumika kwa upana. Tumia viwango vya sekta vilivyoorodheshwa hapa kama marejeo ya karibu.';
    }
    return 'Hakuna kima cha chini cha mshahara cha taifa kinachotumika kwa upana. Malipo hutegemea mkataba wa ajira, soko la kazi au kanuni za sekta husika.';
  }

  var originalGetCountry = E.getCountry.bind(E);
  var originalGetStateRates = E.getStateRates.bind(E);
  var originalCheckCompliance = E.checkCompliance.bind(E);

  E.getCountry = function (code) {
    return localizeCountry(originalGetCountry(code));
  };

  E.getStateRates = function (code) {
    var stateRates = originalGetStateRates(code);
    if (!stateRates) return stateRates;
    return stateRates.map(function (stateRate) {
      return Object.assign({}, stateRate, {
        name: localizeStateName(code, stateRate.name),
        note: localizeStateNote(stateRate.note)
      });
    });
  };

  E.checkCompliance = function (code, salary) {
    var result = originalCheckCompliance(code, salary);
    if (!result) return result;
    if (result.law) result.law = localizeLaw(result.law);
    if (result.noMinWage) {
      result.noMinWageExplanation = getNoMinimumWageExplanation(code, originalGetCountry(code));
    }
    return result;
  };

  AfroTools.MinWageSwOverlay = {
    localizeCountry: localizeCountry,
    getNoMinimumWageExplanation: getNoMinimumWageExplanation
  };
})(window);
