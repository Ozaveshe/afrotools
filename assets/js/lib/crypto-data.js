/**
 * AfroCrypto Data Layer
 * Fetches crypto prices from CoinGecko API (free, no key needed for basic endpoints)
 * Caches in localStorage with TTL to avoid hitting rate limits
 */
(function () {
  'use strict';

  var COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

  var CryptoData = {
    // Supported African currencies for price conversion
    AFRICAN_CURRENCIES: [
      { code: 'ngn', name: 'Nigerian Naira',       symbol: '\u20A6', flag: '\uD83C\uDDF3\uD83C\uDDEC' },
      { code: 'kes', name: 'Kenyan Shilling',      symbol: 'KSh',   flag: '\uD83C\uDDF0\uD83C\uDDEA' },
      { code: 'zar', name: 'South African Rand',   symbol: 'R',     flag: '\uD83C\uDDFF\uD83C\uDDE6' },
      { code: 'ghs', name: 'Ghanaian Cedi',        symbol: 'GH\u20B5', flag: '\uD83C\uDDEC\uD83C\uDDED' },
      { code: 'egp', name: 'Egyptian Pound',        symbol: 'E\u00A3', flag: '\uD83C\uDDEA\uD83C\uDDEC' },
      { code: 'tzs', name: 'Tanzanian Shilling',   symbol: 'TSh',   flag: '\uD83C\uDDF9\uD83C\uDDFF' },
      { code: 'ugx', name: 'Ugandan Shilling',     symbol: 'USh',   flag: '\uD83C\uDDFA\uD83C\uDDEC' },
      { code: 'xof', name: 'CFA Franc (West)',     symbol: 'CFA',   flag: '\uD83C\uDDF8\uD83C\uDDF3' },
      { code: 'xaf', name: 'CFA Franc (Central)',  symbol: 'FCFA',  flag: '\uD83C\uDDE8\uD83C\uDDF2' },
      { code: 'etb', name: 'Ethiopian Birr',       symbol: 'Br',    flag: '\uD83C\uDDEA\uD83C\uDDF9' },
      { code: 'rwf', name: 'Rwandan Franc',        symbol: 'FRw',   flag: '\uD83C\uDDF7\uD83C\uDDFC' },
      { code: 'mzn', name: 'Mozambican Metical',   symbol: 'MT',    flag: '\uD83C\uDDF2\uD83C\uDDFF' },
      { code: 'zmw', name: 'Zambian Kwacha',       symbol: 'ZK',    flag: '\uD83C\uDDFF\uD83C\uDDF2' },
      { code: 'mwk', name: 'Malawian Kwacha',      symbol: 'MK',    flag: '\uD83C\uDDF2\uD83C\uDDFC' },
      { code: 'bwp', name: 'Botswana Pula',        symbol: 'P',     flag: '\uD83C\uDDE7\uD83C\uDDFC' },
      { code: 'nad', name: 'Namibian Dollar',       symbol: 'N$',    flag: '\uD83C\uDDF3\uD83C\uDDE6' },
      { code: 'mad', name: 'Moroccan Dirham',       symbol: 'MAD',   flag: '\uD83C\uDDF2\uD83C\uDDE6' },
      { code: 'tnd', name: 'Tunisian Dinar',        symbol: 'DT',    flag: '\uD83C\uDDF9\uD83C\uDDF3' },
      { code: 'dzd', name: 'Algerian Dinar',        symbol: 'DA',    flag: '\uD83C\uDDE9\uD83C\uDDFF' },
    ],

    // Top coins to track
    COINS: ['bitcoin','ethereum','tether','usd-coin','binancecoin','solana','ripple','cardano','dogecoin','tron'],

    // Coin display metadata
    COIN_META: {
      'bitcoin':      { symbol: 'BTC',  name: 'Bitcoin',     color: '#F7931A' },
      'ethereum':     { symbol: 'ETH',  name: 'Ethereum',    color: '#627EEA' },
      'tether':       { symbol: 'USDT', name: 'Tether',      color: '#26A17B' },
      'usd-coin':     { symbol: 'USDC', name: 'USD Coin',    color: '#2775CA' },
      'binancecoin':  { symbol: 'BNB',  name: 'BNB',         color: '#F3BA2F' },
      'solana':       { symbol: 'SOL',  name: 'Solana',      color: '#9945FF' },
      'ripple':       { symbol: 'XRP',  name: 'XRP',         color: '#23292F' },
      'cardano':      { symbol: 'ADA',  name: 'Cardano',     color: '#0033AD' },
      'dogecoin':     { symbol: 'DOGE', name: 'Dogecoin',    color: '#C2A633' },
      'tron':         { symbol: 'TRX',  name: 'TRON',        color: '#FF0013' },
    },

    // Get prices for top coins in a specific African currency
    getPrices: function (currency) {
      currency = currency || 'ngn';
      var cacheKey = 'crypto-prices-' + currency;
      var cached = this._getCache(cacheKey, 60);
      if (cached) return Promise.resolve(cached);

      var self = this;
      var ids = this.COINS.join(',');
      return fetch(COINGECKO_BASE + '/simple/price?ids=' + ids + '&vs_currencies=' + currency + ',usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true')
        .then(function (res) { return res.json(); })
        .then(function (data) {
          self._setCache(cacheKey, data);
          return data;
        })
        .catch(function (err) {
          console.warn('CoinGecko fetch failed:', err);
          return self._getCache(cacheKey) || null;
        });
    },

    // Get market data for coin list (price, mcap, volume, sparkline)
    getMarkets: function (currency, perPage) {
      currency = currency || 'ngn';
      perPage = perPage || 50;
      var cacheKey = 'crypto-markets-' + currency + '-' + perPage;
      var cached = this._getCache(cacheKey, 60);
      if (cached) return Promise.resolve(cached);

      var self = this;
      return fetch(COINGECKO_BASE + '/coins/markets?vs_currency=' + currency + '&order=market_cap_desc&per_page=' + perPage + '&sparkline=true&price_change_percentage=24h,7d')
        .then(function (res) { return res.json(); })
        .then(function (data) {
          self._setCache(cacheKey, data);
          return data;
        })
        .catch(function (err) {
          console.warn('CoinGecko markets fetch failed:', err);
          return self._getCache(cacheKey) || null;
        });
    },

    // Get historical price data for charts
    getHistory: function (coinId, currency, days) {
      currency = currency || 'ngn';
      days = days || 30;
      var cacheKey = 'crypto-history-' + coinId + '-' + currency + '-' + days;
      var cached = this._getCache(cacheKey, 300);
      if (cached) return Promise.resolve(cached);

      var self = this;
      return fetch(COINGECKO_BASE + '/coins/' + coinId + '/market_chart?vs_currency=' + currency + '&days=' + days)
        .then(function (res) { return res.json(); })
        .then(function (data) {
          self._setCache(cacheKey, data);
          return data;
        })
        .catch(function (err) {
          return self._getCache(cacheKey) || null;
        });
    },

    // Get coin details
    getCoinDetail: function (coinId) {
      var cacheKey = 'crypto-detail-' + coinId;
      var cached = this._getCache(cacheKey, 300);
      if (cached) return Promise.resolve(cached);

      var self = this;
      return fetch(COINGECKO_BASE + '/coins/' + coinId + '?localization=false&tickers=false&community_data=false&developer_data=false')
        .then(function (res) { return res.json(); })
        .then(function (data) {
          self._setCache(cacheKey, data);
          return data;
        })
        .catch(function (err) {
          return self._getCache(cacheKey) || null;
        });
    },

    // Get trending coins
    getTrending: function () {
      var cacheKey = 'crypto-trending';
      var cached = this._getCache(cacheKey, 600);
      if (cached) return Promise.resolve(cached);

      var self = this;
      return fetch(COINGECKO_BASE + '/search/trending')
        .then(function (res) { return res.json(); })
        .then(function (data) {
          self._setCache(cacheKey, data);
          return data;
        })
        .catch(function (err) {
          return self._getCache(cacheKey) || null;
        });
    },

    // Cache helpers
    _getCache: function (key, maxAgeSeconds) {
      try {
        var item = JSON.parse(localStorage.getItem(key));
        if (!item) return null;
        if (maxAgeSeconds && (Date.now() - item.ts) > maxAgeSeconds * 1000) return null;
        return item.data;
      } catch (e) { return null; }
    },

    _setCache: function (key, data) {
      try {
        localStorage.setItem(key, JSON.stringify({ data: data, ts: Date.now() }));
      } catch (e) { /* localStorage full */ }
    },

    // Format price for display
    formatPrice: function (amount, currency, decimals) {
      if (decimals === undefined) decimals = 2;
      var symbols = {
        NGN: '\u20A6', KES: 'KSh', ZAR: 'R', GHS: 'GH\u20B5', EGP: 'E\u00A3', TZS: 'TSh',
        UGX: 'USh', XOF: 'CFA', XAF: 'FCFA', ETB: 'Br', RWF: 'FRw', MZN: 'MT',
        ZMW: 'ZK', MWK: 'MK', BWP: 'P', NAD: 'N$', MAD: 'MAD', TND: 'DT', DZD: 'DA',
        USD: '$', EUR: '\u20AC', GBP: '\u00A3'
      };
      var sym = symbols[(currency || 'NGN').toUpperCase()] || currency + ' ';
      if (amount >= 1000000) {
        return sym + (amount / 1000000).toFixed(1) + 'M';
      }
      if (amount >= 100000) {
        return sym + Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      }
      return sym + Number(amount).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    },

    // Format percentage change
    formatChange: function (pct) {
      if (pct === null || pct === undefined) return '<span style="color:#94A3B8">--</span>';
      var sign = pct >= 0 ? '+' : '';
      var color = pct >= 0 ? '#34C759' : '#FF3B30';
      return '<span style="color:' + color + ';font-weight:600">' + sign + pct.toFixed(2) + '%</span>';
    },

    // Format large numbers (market cap, volume)
    formatLargeNumber: function (num, currency) {
      var symbols = { NGN: '\u20A6', KES: 'KSh', ZAR: 'R', GHS: 'GH\u20B5', USD: '$' };
      var sym = symbols[(currency || 'NGN').toUpperCase()] || '';
      if (!num) return sym + '0';
      if (num >= 1e12) return sym + (num / 1e12).toFixed(1) + 'T';
      if (num >= 1e9) return sym + (num / 1e9).toFixed(1) + 'B';
      if (num >= 1e6) return sym + (num / 1e6).toFixed(1) + 'M';
      if (num >= 1e3) return sym + (num / 1e3).toFixed(1) + 'K';
      return sym + num.toFixed(0);
    }
  };

  window.CryptoData = CryptoData;
})();
