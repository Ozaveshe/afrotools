/**
 * AfroTools Widget Currency Utilities
 * Currency data, formatting, and API fetch with caching
 */
var AfroWidgetCurrency = (function() {
  'use strict';

  var CURRENCIES = {
    NGN:{name:'Nigerian Naira',symbol:'₦',dec:2},KES:{name:'Kenyan Shilling',symbol:'KSh',dec:2},
    GHS:{name:'Ghanaian Cedi',symbol:'GH₵',dec:2},ZAR:{name:'South African Rand',symbol:'R',dec:2},
    EGP:{name:'Egyptian Pound',symbol:'E£',dec:2},TZS:{name:'Tanzanian Shilling',symbol:'TSh',dec:0},
    UGX:{name:'Ugandan Shilling',symbol:'USh',dec:0},RWF:{name:'Rwandan Franc',symbol:'FRw',dec:0},
    ETB:{name:'Ethiopian Birr',symbol:'Br',dec:2},XOF:{name:'CFA Franc BCEAO',symbol:'CFA',dec:0},
    XAF:{name:'CFA Franc BEAC',symbol:'FCFA',dec:0},MAD:{name:'Moroccan Dirham',symbol:'MAD',dec:2},
    DZD:{name:'Algerian Dinar',symbol:'DA',dec:2},TND:{name:'Tunisian Dinar',symbol:'DT',dec:3},
    AOA:{name:'Angolan Kwanza',symbol:'Kz',dec:2},MZN:{name:'Mozambican Metical',symbol:'MT',dec:2},
    ZMW:{name:'Zambian Kwacha',symbol:'ZK',dec:2},ZWL:{name:'Zimbabwe Dollar',symbol:'Z$',dec:2},
    BWP:{name:'Botswana Pula',symbol:'P',dec:2},NAD:{name:'Namibian Dollar',symbol:'N$',dec:2},
    MUR:{name:'Mauritian Rupee',symbol:'Rs',dec:2},MWK:{name:'Malawian Kwacha',symbol:'MK',dec:2},
    MGA:{name:'Malagasy Ariary',symbol:'Ar',dec:0},SCR:{name:'Seychellois Rupee',symbol:'SR',dec:2},
    SZL:{name:'Swazi Lilangeni',symbol:'E',dec:2},LSL:{name:'Lesotho Loti',symbol:'L',dec:2},
    GMD:{name:'Gambian Dalasi',symbol:'D',dec:2},CVE:{name:'Cape Verdean Escudo',symbol:'$',dec:0},
    USD:{name:'US Dollar',symbol:'$',dec:2},EUR:{name:'Euro',symbol:'€',dec:2},
    GBP:{name:'British Pound',symbol:'£',dec:2},BIF:{name:'Burundian Franc',symbol:'FBu',dec:0},
    CDF:{name:'Congolese Franc',symbol:'FC',dec:2},SDG:{name:'Sudanese Pound',symbol:'SDG',dec:2},
    LYD:{name:'Libyan Dinar',symbol:'LD',dec:3},SOS:{name:'Somali Shilling',symbol:'Sh',dec:0},
    DJF:{name:'Djiboutian Franc',symbol:'Fdj',dec:0},ERN:{name:'Eritrean Nakfa',symbol:'Nfk',dec:2},
    SSP:{name:'South Sudanese Pound',symbol:'SSP',dec:2},KMF:{name:'Comorian Franc',symbol:'CF',dec:0},
    STN:{name:'São Tomé Dobra',symbol:'Db',dec:2}
  };

  var CACHE_KEY = 'aw_fx_cache';
  var CACHE_TTL = 600000; // 10 minutes

  function getCached(pair) {
    try {
      var c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}');
      if (c[pair] && Date.now() - c[pair].t < CACHE_TTL) return c[pair].r;
    } catch(e) {}
    return null;
  }

  function setCache(pair, rate) {
    try {
      var c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}');
      c[pair] = { r: rate, t: Date.now() };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(c));
    } catch(e) {}
  }

  function fetchRate(from, to) {
    var pair = from + '_' + to;
    var cached = getCached(pair);
    if (cached) return Promise.resolve(cached);

    return fetch('https://open.er-api.com/v6/latest/' + from)
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.rates && d.rates[to]) {
          setCache(pair, d.rates[to]);
          return d.rates[to];
        }
        throw new Error('Rate not found');
      });
  }

  function format(amount, code) {
    var c = CURRENCIES[code];
    if (!c) return code + ' ' + Number(amount).toLocaleString('en');
    return c.symbol + Number(amount).toLocaleString('en', {
      minimumFractionDigits: c.dec, maximumFractionDigits: c.dec
    });
  }

  return {
    CURRENCIES: CURRENCIES,
    fetchRate: fetchRate,
    format: format,
    getCached: getCached
  };
})();

if (typeof module !== 'undefined') module.exports = AfroWidgetCurrency;
