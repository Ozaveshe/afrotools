(function (window) {
  'use strict';

  var MS_PER_DAY = 24 * 60 * 60 * 1000;
  var DEFAULT_TIME_ZONE = 'Africa/Lagos';

  var DAY_DETAILS = [
    {
      index: 0,
      id: 'eke',
      name: 'Eke',
      alias: 'Eke',
      color: '#0f6fe8',
      accent: 'rgba(15, 111, 232, 0.14)',
      note: 'Often treated as the opening turn of the four-day Igbo cycle.'
    },
    {
      index: 1,
      id: 'orie',
      name: 'Orie',
      alias: 'Orie / Oye',
      color: '#b7791f',
      accent: 'rgba(183, 121, 31, 0.14)',
      note: 'Also written as Oye in some communities and calendars.'
    },
    {
      index: 2,
      id: 'afor',
      name: 'Afor',
      alias: 'Afor / Afo',
      color: '#1f6fb2',
      accent: 'rgba(31, 111, 178, 0.14)',
      note: 'Often linked to produce and movement between nearby market towns.'
    },
    {
      index: 3,
      id: 'nkwo',
      name: 'Nkwo',
      alias: 'Nkwo',
      color: '#b83280',
      accent: 'rgba(184, 50, 128, 0.14)',
      note: 'Many famous urban markets still preserve Nkwo in their historic names.'
    }
  ];

  var REFERENCE_POINT = {
    isoDate: '2026-01-01',
    dayIndex: 1,
    label: '2026-01-01 = Orie',
    summary: 'Cross-checked against current published Igbo calendars and event listings.',
    sources: [
      {
        label: 'Amujzi / Mkomigbo 2026 Igbo Calendar',
        url: 'https://mkomigbo.com/igbo-calendar/?y=2026',
        supports: 'Shows 1 Jan 2026 as Orie and 4 Jan 2026 as Eke.'
      },
      {
        label: 'Igbozuruoke market-day listing',
        url: 'https://igbozuru.com/events/orie-ukwu-2026-01-05/',
        supports: 'Keeps 5 Jan 2026 aligned to Orie and matches live 2026 feed updates.'
      },
      {
        label: 'The Igbo Calendar',
        url: 'https://igbocalendar.com/',
        supports: 'Background on the continuity and structure of the four-day Igbo calendar.'
      }
    ]
  };

  var MARKET_DIRECTORY = [
    {
      id: 'eke-awka',
      name: 'Eke Awka',
      town: 'Awka',
      state: 'Anambra',
      dayIndex: 0,
      descriptor: 'Awka\'s largest traditional market.',
      operatingPattern: 'Named market day; now functions as a daily urban market.',
      sourceLabel: 'Awka (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Awka'
    },
    {
      id: 'nkwo-amaenyi',
      name: 'Nkwo Amaenyi',
      town: 'Awka',
      state: 'Anambra',
      dayIndex: 3,
      descriptor: 'Secondary Awka market on the Amaenyi axis.',
      operatingPattern: 'Named market day with smaller daily activity.',
      sourceLabel: 'Awka (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Awka'
    },
    {
      id: 'otu-nkwo-onitsha',
      name: 'Otu Nkwo / Main Market Onitsha',
      town: 'Onitsha',
      state: 'Anambra',
      dayIndex: 3,
      descriptor: 'Historic Onitsha market that originally opened on Nkwo days.',
      operatingPattern: 'Historic Nkwo market; now a full daily commercial center.',
      sourceLabel: 'Main Market, Onitsha (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Main_Market,_Onitsha'
    },
    {
      id: 'nkwo-nnewi',
      name: 'Nkwo Nnewi',
      town: 'Nnewi',
      state: 'Anambra',
      dayIndex: 3,
      descriptor: 'Major wholesale and general-market hub in Nnewi.',
      operatingPattern: 'Historic Nkwo market expanded into daily trading clusters.',
      sourceLabel: 'Nnewi (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Nnewi'
    },
    {
      id: 'afor-nkpor',
      name: 'Afor Nkpor',
      town: 'Nkpor',
      state: 'Anambra',
      dayIndex: 2,
      descriptor: 'One of Nkpor\'s traditional named markets.',
      operatingPattern: 'Traditional market-day identity still used locally.',
      sourceLabel: 'Nkpor (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Nkpor'
    },
    {
      id: 'eke-nkpor',
      name: 'Eke Nkpor',
      town: 'Nkpor',
      state: 'Anambra',
      dayIndex: 0,
      descriptor: 'Traditional Nkpor market tied to the Eke turn of the cycle.',
      operatingPattern: 'Traditional market-day identity still used locally.',
      sourceLabel: 'Nkpor (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Nkpor'
    },
    {
      id: 'orie-emene',
      name: 'Orie Emene',
      town: 'Emene',
      state: 'Enugu',
      dayIndex: 1,
      descriptor: 'Well-known community market in the Emene axis.',
      operatingPattern: 'Named market day; now part of a busy urban corridor.',
      sourceLabel: 'THISDAYLIVE',
      sourceUrl: 'https://www.thisdaylive.com/2019/05/18/enugu-closes-orie-emene-market-over-airport-security/'
    },
    {
      id: 'orie-orba',
      name: 'Orie Orba',
      town: 'Orba',
      state: 'Enugu',
      dayIndex: 1,
      descriptor: 'Large periodic market in the Nsukka corridor.',
      operatingPattern: 'Periodic market still described as Orie-based in agricultural studies.',
      sourceLabel: 'IJAEB study',
      sourceUrl: 'https://ijaeb.org/uploads/AEB_02_32.pdf'
    },
    {
      id: 'eke-akiyi',
      name: 'Eke Akiyi',
      town: 'Umulokpa',
      state: 'Enugu',
      dayIndex: 0,
      descriptor: 'Wholesale farm-produce market serving the Uzo-Uwani area.',
      operatingPattern: 'Reported as opening every four days.',
      sourceLabel: 'Umulokpa (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Umulokpa'
    },
    {
      id: 'nkwo-ogidi',
      name: 'Nkwo Ogidi',
      town: 'Ogidi',
      state: 'Anambra',
      dayIndex: 3,
      descriptor: 'Ogidi market remembered by its Nkwo identity.',
      operatingPattern: 'Named market; daily activity varies by section.',
      sourceLabel: 'Culture Intelligence',
      sourceUrl: 'https://cultureintelligence.ynaija.com/places/nkwo-ogidi-market/'
    },
    {
      id: 'eke-otuocha',
      name: 'Eke Market Otuocha',
      town: 'Otuocha',
      state: 'Anambra',
      dayIndex: 0,
      descriptor: 'Riverine market on the Omambala axis and a yam transit point.',
      operatingPattern: 'Named Eke market serving the Anambra East trading corridor.',
      sourceLabel: 'Otuocha (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Otuocha'
    },
    {
      id: 'eke-umuomaku',
      name: 'Eke Umuomaku',
      town: 'Umuomaku',
      state: 'Anambra',
      dayIndex: 0,
      descriptor: 'Town market identified directly with Umuomaku\'s Eke day.',
      operatingPattern: 'The town\'s market day is described as Eke.',
      sourceLabel: 'Umuomaku (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Umuomaku'
    },
    {
      id: 'eke-amaetiti',
      name: 'Eke Amaetiti',
      town: 'Amaetiti',
      state: 'Anambra',
      dayIndex: 0,
      descriptor: 'One of Amaetiti\'s three named community markets.',
      operatingPattern: 'Named traditional market within a town that also keeps Afor and Nkwo.',
      sourceLabel: 'Amaetiti (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Amaetiti'
    },
    {
      id: 'afor-amaetiti',
      name: 'Afor Amaetiti',
      town: 'Amaetiti',
      state: 'Anambra',
      dayIndex: 2,
      descriptor: 'Amaetiti market tied to the Afor turn of the local cycle.',
      operatingPattern: 'Part of Amaetiti\'s three-market traditional pattern.',
      sourceLabel: 'Amaetiti (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Amaetiti'
    },
    {
      id: 'nkwo-amaetiti',
      name: 'Nkwo Amaetiti',
      town: 'Amaetiti',
      state: 'Anambra',
      dayIndex: 3,
      descriptor: 'Amaetiti market attached to the Nkwo turn of the cycle.',
      operatingPattern: 'Part of Amaetiti\'s three-market traditional pattern.',
      sourceLabel: 'Amaetiti (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Amaetiti'
    },
    {
      id: 'eke-nomeh',
      name: 'Eke Nomeh',
      town: 'Nomeh Unateze',
      state: 'Enugu',
      dayIndex: 0,
      descriptor: 'Town market day for Nomeh Unateze in Nkanu East.',
      operatingPattern: 'Eke is described as the town market day within the full four-day cycle.',
      sourceLabel: 'Nomeh Unateze (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Nomeh_Unateze'
    },
    {
      id: 'eke-imoha',
      name: 'Eke Imoha',
      town: 'Onueke',
      state: 'Ebonyi',
      dayIndex: 0,
      descriptor: 'Large Ezza market described as one of the oldest and biggest in Ebonyi.',
      operatingPattern: 'Held every four days and treated as the first and biggest local market.',
      sourceLabel: 'Onueke (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Onueke'
    },
    {
      id: 'eke-obodoukwu',
      name: 'Eke Obodoukwu',
      town: 'Obodoukwu',
      state: 'Imo',
      dayIndex: 0,
      descriptor: 'Main marketplace in Obodoukwu.',
      operatingPattern: 'The town\'s largest market is named Eke.',
      sourceLabel: 'Obodoukwu (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Obodoukwu'
    },
    {
      id: 'nkwo-naze',
      name: 'Nkwo Naze',
      town: 'Naze',
      state: 'Imo',
      dayIndex: 3,
      descriptor: 'Historic Naze market formerly known as Amara-Isu.',
      operatingPattern: 'Named Nkwo market that still defines the town\'s market identity.',
      sourceLabel: 'Naze, Imo (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Naze,_Imo'
    },
    {
      id: 'eke-itu',
      name: 'Eke Itu',
      town: 'Itu',
      state: 'Imo',
      dayIndex: 0,
      descriptor: 'Central community market in Itu, Ezinihitte Mbaise.',
      operatingPattern: 'Community market commonly referred to as Eke Itu.',
      sourceLabel: 'Itu, Imo State (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Itu,_Imo_State'
    },
    {
      id: 'nkwo-mbaise',
      name: 'Nkwo Mbaise',
      town: 'Itu / Ezinihitte Mbaise',
      state: 'Imo',
      dayIndex: 3,
      descriptor: 'Popular boundary market serving Itu, Eziudo, Amumara, and Okpofe.',
      operatingPattern: 'Regional Nkwo market at a multi-community boundary.',
      sourceLabel: 'Itu, Imo State (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Itu,_Imo_State'
    },
    {
      id: 'nkwo-otulu',
      name: 'Nkwo Otulu',
      town: 'Otulu',
      state: 'Imo',
      dayIndex: 3,
      descriptor: 'Large community market in Otulu, Ahiara.',
      operatingPattern: 'Named Nkwo market used as the village\'s main commercial center.',
      sourceLabel: 'Otulu, Ahiara (Wikipedia)',
      sourceUrl: 'https://en.wikipedia.org/wiki/Otulu,_Ahiara'
    }
  ];

  function mod(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function isValidDateKey(dateKey) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
  }

  function parseDateKey(dateKey) {
    if (!isValidDateKey(dateKey)) {
      throw new Error('Invalid date key: ' + dateKey);
    }

    var parts = dateKey.split('-');
    return new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  }

  function toDateKey(date) {
    return [
      date.getUTCFullYear(),
      pad(date.getUTCMonth() + 1),
      pad(date.getUTCDate())
    ].join('-');
  }

  function normalizeDateLike(dateLike) {
    if (typeof dateLike === 'string') {
      return parseDateKey(dateLike);
    }

    if (dateLike instanceof Date && !isNaN(dateLike.getTime())) {
      return new Date(Date.UTC(
        dateLike.getUTCFullYear(),
        dateLike.getUTCMonth(),
        dateLike.getUTCDate()
      ));
    }

    throw new Error('Unsupported date input');
  }

  function addDays(dateLike, delta) {
    var date = normalizeDateLike(dateLike);
    return new Date(date.getTime() + (delta * MS_PER_DAY));
  }

  function getTimeZoneDateParts(timeZone, now) {
    var formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || DEFAULT_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    var parts = formatter.formatToParts(now || new Date());
    var values = {};
    var index = 0;

    for (index = 0; index < parts.length; index += 1) {
      if (parts[index].type !== 'literal') {
        values[parts[index].type] = parts[index].value;
      }
    }

    return {
      year: Number(values.year),
      month: Number(values.month),
      day: Number(values.day)
    };
  }

  function getTodayDateKey(timeZone, now) {
    var parts = getTimeZoneDateParts(timeZone, now);
    return [
      parts.year,
      pad(parts.month),
      pad(parts.day)
    ].join('-');
  }

  function formatDate(dateLike, options) {
    var date = normalizeDateLike(dateLike);
    return new Intl.DateTimeFormat('en-NG', Object.assign({
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }, options || {})).format(date);
  }

  function getMarketDayIndex(dateLike) {
    var date = normalizeDateLike(dateLike);
    var referenceDate = parseDateKey(REFERENCE_POINT.isoDate);
    var diffDays = Math.round((date.getTime() - referenceDate.getTime()) / MS_PER_DAY);
    return mod(REFERENCE_POINT.dayIndex + diffDays, DAY_DETAILS.length);
  }

  function getMarketDay(dateLike) {
    return DAY_DETAILS[getMarketDayIndex(dateLike)];
  }

  function getUpcomingDates(dateLike, targetDayIndex, count) {
    var cursor = normalizeDateLike(dateLike);
    var results = [];

    while (results.length < count) {
      if (getMarketDayIndex(cursor) === targetDayIndex) {
        results.push(new Date(cursor.getTime()));
      }
      cursor = addDays(cursor, 1);
    }

    return results;
  }

  function getUniqueStates() {
    var lookup = {};
    var results = [];
    var index = 0;

    for (index = 0; index < MARKET_DIRECTORY.length; index += 1) {
      if (!lookup[MARKET_DIRECTORY[index].state]) {
        lookup[MARKET_DIRECTORY[index].state] = true;
        results.push(MARKET_DIRECTORY[index].state);
      }
    }

    return results.sort();
  }

  function getSourceList() {
    var seen = {};
    var sources = [];
    var index = 0;

    for (index = 0; index < REFERENCE_POINT.sources.length; index += 1) {
      if (!seen[REFERENCE_POINT.sources[index].url]) {
        seen[REFERENCE_POINT.sources[index].url] = true;
        sources.push(REFERENCE_POINT.sources[index]);
      }
    }

    for (index = 0; index < MARKET_DIRECTORY.length; index += 1) {
      if (!seen[MARKET_DIRECTORY[index].sourceUrl]) {
        seen[MARKET_DIRECTORY[index].sourceUrl] = true;
        sources.push({
          label: MARKET_DIRECTORY[index].sourceLabel,
          url: MARKET_DIRECTORY[index].sourceUrl,
          supports: MARKET_DIRECTORY[index].name + ' in ' + MARKET_DIRECTORY[index].town
        });
      }
    }

    return sources;
  }

  function filterMarkets(filters) {
    var query = filters && filters.query ? String(filters.query).toLowerCase().trim() : '';
    var state = filters && filters.state ? filters.state : 'all';
    var day = filters && typeof filters.day !== 'undefined' ? String(filters.day) : 'all';

    return MARKET_DIRECTORY.filter(function (market) {
      var haystack;

      if (state !== 'all' && market.state !== state) {
        return false;
      }

      if (day !== 'all' && String(market.dayIndex) !== day) {
        return false;
      }

      if (!query) {
        return true;
      }

      haystack = [
        market.name,
        market.town,
        market.state,
        DAY_DETAILS[market.dayIndex].name,
        market.descriptor,
        market.operatingPattern
      ].join(' ').toLowerCase();

      return haystack.indexOf(query) !== -1;
    });
  }

  function isValidTimeZone(timeZone) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timeZone }).format(new Date());
      return true;
    } catch (error) {
      return false;
    }
  }

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.igboMarketDays = {
    id: 'igbo-market-days',
    country: 'Nigeria',
    defaultTimeZone: DEFAULT_TIME_ZONE,
    dayDetails: DAY_DETAILS,
    referencePoint: REFERENCE_POINT,
    marketDirectory: MARKET_DIRECTORY,
    getUniqueStates: getUniqueStates,
    getSourceList: getSourceList,
    isValidDateKey: isValidDateKey,
    isValidTimeZone: isValidTimeZone,
    parseDateKey: parseDateKey,
    toDateKey: toDateKey,
    addDays: addDays,
    getTodayDateKey: getTodayDateKey,
    formatDate: formatDate,
    getMarketDayIndex: getMarketDayIndex,
    getMarketDay: getMarketDay,
    getUpcomingDates: getUpcomingDates,
    filterMarkets: filterMarkets
  };
})(window);
