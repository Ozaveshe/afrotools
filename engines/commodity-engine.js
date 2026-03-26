var CommodityEngine = (function () {
  'use strict';

  function fmt(n) { return Number(n).toLocaleString('en-US'); }

  /* ── get country summary ──────────────────────────────── */
  function getCountrySummary(countryCode) {
    var c = CommodityTradeData.getCountry(countryCode);
    if (!c) return null;
    return {
      code: countryCode,
      name: c.name,
      flag: c.flag,
      region: c.region,
      totalExports: c.totalExports || 0,
      totalImports: c.totalImports || 0,
      tradeBalance: c.tradeBalance || 0,
      topExports: c.topExports || [],
      topImports: c.topImports || [],
      topPartners: c.topPartners || {},
      observations: getCountryObservations(countryCode, c)
    };
  }

  /* ── get top exports/imports with ranking ─────────────── */
  function getRankedList(countryCode, type, category) {
    var items = CommodityTradeData.getCommoditiesForCountry(countryCode, type, category);
    return items.map(function (item, idx) {
      return Object.assign({}, item, { rank: idx + 1, valueFormatted: fmt(item.value) + ' M USD' });
    });
  }

  /* ── trade balance summary ────────────────────────────── */
  function getTradeBalance(countryCode) {
    var c = CommodityTradeData.getCountry(countryCode);
    if (!c) return null;
    var balance = c.tradeBalance || 0;
    return {
      exports: c.totalExports || 0,
      imports: c.totalImports || 0,
      balance: balance,
      status: balance >= 0 ? 'surplus' : 'deficit',
      statusLabel: balance >= 0 ? 'Trade Surplus' : 'Trade Deficit',
      statusColor: balance >= 0 ? '#34C759' : '#FF3B30',
      absBalance: Math.abs(balance)
    };
  }

  /* ── find which countries export a commodity ─────────── */
  function findCommodityTraders(keyword) {
    var results = CommodityTradeData.getCommodityByName(keyword);
    return results.sort(function (a, b) { return b.item.value - a.item.value; });
  }

  /* ── observations ────────────────────────────────────── */
  function getCountryObservations(code, c) {
    var obs = [];
    var balance = c.tradeBalance || 0;
    if (code === 'NG') {
      obs.push('🛢️ Nigeria\'s exports are 90%+ hydrocarbons. Diversification into agriculture and manufacturing is a key national priority.');
      obs.push('⚠️ The high import dependency for refined petroleum (despite crude oil production) reflects refinery capacity constraints.');
    } else if (code === 'GH') {
      obs.push('🏅 Ghana is the world\'s 2nd largest cocoa producer. Gold + cocoa + oil = the "Big 3" that dominate Ghana\'s export basket.');
      obs.push('💡 Ghana\'s trade surplus driven by commodity exports — vulnerable to global commodity price swings.');
    } else if (code === 'KE') {
      obs.push('🌹 Kenya leads Africa in cut flower exports — the Naivasha lake region supplies 35%+ of EU flower imports.');
      obs.push('☕ Kenyan AA coffee commands premium prices. Mombasa Tea Auction is the largest in the world by volume.');
    } else if (code === 'ZA') {
      obs.push('💎 South Africa holds 80% of global platinum group metal reserves — unique export dominance in precious metals.');
      obs.push('🚗 SA is Africa\'s leading vehicle manufacturer (BMW, VW, Mercedes assembly) — vehicles are both top export and import.');
    } else if (code === 'CI') {
      obs.push('🍫 Côte d\'Ivoire is the world\'s #1 cocoa producer, accounting for ~40% of global supply. Cocoa price volatility is a major economic risk.');
    } else if (code === 'ET') {
      obs.push('☕ Ethiopia is the birthplace of coffee. Its specialty Yirgacheffe, Sidamo and Harrar coffees command premium prices globally.');
      obs.push('🌼 Ethiopia is Africa\'s largest flower exporter, with Addis Ababa\'s altitude ideal for year-round cultivation.');
    }
    if (balance > 0) obs.push('✅ ' + c.name + ' runs a trade surplus of $' + fmt(Math.abs(balance)) + 'M — exports exceed imports.');
    else obs.push('📊 ' + c.name + ' runs a trade deficit of $' + fmt(Math.abs(balance)) + 'M — higher import dependency typical for developing economies.');
    return obs;
  }

  /* ── commodity price context ──────────────────────────── */
  function getPriceContext() {
    return Object.entries(CommodityTradeData.commodityPrices).map(function (entry) {
      var k = entry[0]; var v = entry[1];
      return { id: k, name: v.name, unit: v.unit, currency: v.currency, source: v.source, refPrice: v.refPrice };
    });
  }

  return {
    getCountrySummary: getCountrySummary,
    getRankedList: getRankedList,
    getTradeBalance: getTradeBalance,
    findCommodityTraders: findCommodityTraders,
    getPriceContext: getPriceContext,
    getAllCountries: function () { return CommodityTradeData.getAllCountries(); },
    getCategories: function () { return CommodityTradeData.categories; }
  };
})();
