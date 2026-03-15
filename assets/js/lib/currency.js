/**
 * AFROTOOLS — Currency Formatting Library
 * ===================================================================
 * Comprehensive currency formatting for all 54 African countries
 * plus major international currencies.
 *
 * Usage:
 *   AfroTools.currency.format('NGN', 3500000)    // '₦3,500,000'
 *   AfroTools.currency.format('KES', 50000)      // 'KSh 50,000'
 *   AfroTools.currency.format('ZAR', 12000)      // 'R12,000'
 *   AfroTools.currency.format('USD', 1200.50)    // '$1,200.50'
 *   AfroTools.currency.symbol('NGN')             // '₦'
 *   AfroTools.currency.name('NGN')               // 'Nigerian Naira'
 *   AfroTools.currency.list()                    // [{code,symbol,name,country},...]
 * ===================================================================
 */

(function (window) {
  'use strict';

  /**
   * Currency database — all 54 African countries + major international
   * Fields: symbol, name, decimals (default 2), locale (fallback 'en'),
   *         position ('prefix'|'suffix', default 'prefix'), space (bool, default false)
   */
  const CURRENCIES = {
    // ── AFRICA ──────────────────────────────────────
    NGN: { symbol: '\u20A6', name: 'Nigerian Naira',            decimals: 0, locale: 'en-NG' },
    KES: { symbol: 'KSh',   name: 'Kenyan Shilling',           decimals: 0, locale: 'en-KE', space: true },
    GHS: { symbol: 'GH\u20B5',name: 'Ghanaian Cedi',           decimals: 2, locale: 'en-GH' },
    ZAR: { symbol: 'R',     name: 'South African Rand',        decimals: 2, locale: 'en-ZA' },
    EGP: { symbol: 'E\u00A3',name: 'Egyptian Pound',           decimals: 2, locale: 'en-EG' },
    TZS: { symbol: 'TSh',   name: 'Tanzanian Shilling',        decimals: 0, locale: 'en-TZ', space: true },
    UGX: { symbol: 'USh',   name: 'Ugandan Shilling',          decimals: 0, locale: 'en-UG', space: true },
    ETB: { symbol: 'Br',    name: 'Ethiopian Birr',            decimals: 2, locale: 'en-ET', space: true },
    MAD: { symbol: 'MAD',   name: 'Moroccan Dirham',           decimals: 2, locale: 'fr-MA', space: true },
    TND: { symbol: 'DT',    name: 'Tunisian Dinar',            decimals: 3, locale: 'fr-TN', space: true },
    DZD: { symbol: 'DA',    name: 'Algerian Dinar',            decimals: 2, locale: 'fr-DZ', space: true },
    XOF: { symbol: 'CFA',   name: 'West African CFA Franc',    decimals: 0, locale: 'fr-SN', space: true },
    XAF: { symbol: 'FCFA',  name: 'Central African CFA Franc', decimals: 0, locale: 'fr-CM', space: true },
    RWF: { symbol: 'FRw',   name: 'Rwandan Franc',             decimals: 0, locale: 'en-RW', space: true },
    BIF: { symbol: 'FBu',   name: 'Burundian Franc',           decimals: 0, locale: 'fr-BI', space: true },
    CDF: { symbol: 'FC',    name: 'Congolese Franc',           decimals: 2, locale: 'fr-CD', space: true },
    AOA: { symbol: 'Kz',    name: 'Angolan Kwanza',            decimals: 2, locale: 'pt-AO', space: true },
    MZN: { symbol: 'MT',    name: 'Mozambican Metical',        decimals: 2, locale: 'pt-MZ', space: true },
    ZMW: { symbol: 'ZK',    name: 'Zambian Kwacha',            decimals: 2, locale: 'en-ZM', space: true },
    MWK: { symbol: 'MK',    name: 'Malawian Kwacha',           decimals: 2, locale: 'en-MW', space: true },
    BWP: { symbol: 'P',     name: 'Botswana Pula',             decimals: 2, locale: 'en-BW' },
    NAD: { symbol: 'N$',    name: 'Namibian Dollar',            decimals: 2, locale: 'en-NA' },
    SZL: { symbol: 'E',     name: 'Eswatini Lilangeni',        decimals: 2, locale: 'en-SZ' },
    LSL: { symbol: 'M',     name: 'Lesotho Loti',              decimals: 2, locale: 'en-LS' },
    ZWL: { symbol: 'Z$',    name: 'Zimbabwean Dollar',         decimals: 2, locale: 'en-ZW' },
    MGA: { symbol: 'Ar',    name: 'Malagasy Ariary',           decimals: 0, locale: 'fr-MG', space: true },
    SCR: { symbol: 'SR',    name: 'Seychellois Rupee',         decimals: 2, locale: 'en-SC', space: true },
    MUR: { symbol: 'Rs',    name: 'Mauritian Rupee',           decimals: 2, locale: 'en-MU', space: true },
    KMF: { symbol: 'CF',    name: 'Comorian Franc',            decimals: 0, locale: 'fr-KM', space: true },
    GMD: { symbol: 'D',     name: 'Gambian Dalasi',            decimals: 2, locale: 'en-GM' },
    SLL: { symbol: 'Le',    name: 'Sierra Leonean Leone',      decimals: 0, locale: 'en-SL', space: true },
    GNF: { symbol: 'FG',    name: 'Guinean Franc',             decimals: 0, locale: 'fr-GN', space: true },
    LRD: { symbol: 'L$',    name: 'Liberian Dollar',           decimals: 2, locale: 'en-LR' },
    CVE: { symbol: 'Esc',   name: 'Cape Verdean Escudo',       decimals: 2, locale: 'pt-CV', space: true },
    STN: { symbol: 'Db',    name: 'Sao Tome Dobra',            decimals: 2, locale: 'pt-ST', space: true },
    MRU: { symbol: 'UM',    name: 'Mauritanian Ouguiya',       decimals: 2, locale: 'fr-MR', space: true },
    DJF: { symbol: 'Fdj',   name: 'Djiboutian Franc',          decimals: 0, locale: 'fr-DJ', space: true },
    ERN: { symbol: 'Nfk',   name: 'Eritrean Nakfa',            decimals: 2, locale: 'en-ER', space: true },
    SOS: { symbol: 'Sh',    name: 'Somali Shilling',           decimals: 0, locale: 'so-SO', space: true },
    SDG: { symbol: 'SDG',   name: 'Sudanese Pound',            decimals: 2, locale: 'ar-SD', space: true },
    SSP: { symbol: 'SSP',   name: 'South Sudanese Pound',      decimals: 2, locale: 'en-SS', space: true },
    LYD: { symbol: 'LD',    name: 'Libyan Dinar',              decimals: 3, locale: 'ar-LY', space: true },
    GQE: { symbol: 'FCFA',  name: 'Equatorial Guinea CFA',     decimals: 0, locale: 'es-GQ', space: true },

    // CFA zone countries — use XOF
    // Benin, Burkina Faso, Cote d'Ivoire, Guinea-Bissau, Mali, Niger, Senegal, Togo → XOF
    // Cameroon, Central African Republic, Chad, Congo, Equatorial Guinea, Gabon → XAF

    // ── INTERNATIONAL ──────────────────────────────
    USD: { symbol: '$',      name: 'US Dollar',                 decimals: 2, locale: 'en-US' },
    EUR: { symbol: '\u20AC', name: 'Euro',                      decimals: 2, locale: 'en-IE' },
    GBP: { symbol: '\u00A3', name: 'British Pound',             decimals: 2, locale: 'en-GB' },
    AED: { symbol: 'AED',   name: 'UAE Dirham',                decimals: 2, locale: 'en-AE', space: true },
    CAD: { symbol: 'CA$',   name: 'Canadian Dollar',           decimals: 2, locale: 'en-CA' },
    AUD: { symbol: 'A$',    name: 'Australian Dollar',         decimals: 2, locale: 'en-AU' },
    CNY: { symbol: '\u00A5', name: 'Chinese Yuan',             decimals: 2, locale: 'zh-CN' },
    INR: { symbol: '\u20B9', name: 'Indian Rupee',             decimals: 2, locale: 'en-IN' },
    SAR: { symbol: 'SAR',   name: 'Saudi Riyal',               decimals: 2, locale: 'ar-SA', space: true },
    JPY: { symbol: '\u00A5', name: 'Japanese Yen',             decimals: 0, locale: 'ja-JP' },
    CHF: { symbol: 'CHF',   name: 'Swiss Franc',               decimals: 2, locale: 'de-CH', space: true },
  };

  /**
   * CFA zone country-to-currency mappings
   */
  const CFA_MAP = {
    BJ: 'XOF', BF: 'XOF', CI: 'XOF', GW: 'XOF', ML: 'XOF', NE: 'XOF', SN: 'XOF', TG: 'XOF',
    CM: 'XAF', CF: 'XAF', TD: 'XAF', CG: 'XAF', GQ: 'XAF', GA: 'XAF',
  };

  /**
   * Format a number as a currency string
   * @param {string} code - ISO 4217 currency code (e.g., 'NGN')
   * @param {number} amount - The number to format
   * @param {Object} [opts] - Options
   * @param {number} [opts.decimals] - Override decimal places
   * @param {boolean} [opts.compact] - Use compact notation (1.5M)
   * @param {boolean} [opts.abs] - Use absolute value
   * @returns {string} Formatted currency string
   */
  function format(code, amount, opts = {}) {
    const c = CURRENCIES[code];
    if (!c) return code + ' ' + Number(amount).toLocaleString();

    const val = opts.abs ? Math.abs(amount) : amount;
    const decimals = opts.decimals !== undefined ? opts.decimals : c.decimals;

    // Compact notation
    if (opts.compact) {
      const compacted = compactNumber(val);
      return _prefix(c, compacted);
    }

    // Standard formatting
    const formatted = formatFixed(val, decimals);
    return _prefix(c, formatted);
  }

  /**
   * Build the prefix/suffix string
   */
  function _prefix(currencyDef, numberStr) {
    const sep = currencyDef.space ? ' ' : '';
    if (currencyDef.position === 'suffix') {
      return numberStr + sep + currencyDef.symbol;
    }
    return currencyDef.symbol + sep + numberStr;
  }

  /**
   * Format number with locale-aware thousand separators and fixed decimals
   */
  function formatFixed(num, decimals) {
    if (decimals === 0) {
      return Math.round(num).toLocaleString('en');
    }
    return Number(num).toLocaleString('en', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  /**
   * Compact a number: 1,200,000 -> '1.2M'
   */
  function compactNumber(n) {
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e12) return sign + (abs / 1e12).toFixed(1) + 'T';
    if (abs >= 1e9)  return sign + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6)  return sign + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3)  return sign + (abs / 1e3).toFixed(1) + 'K';
    return sign + Math.round(abs).toString();
  }

  /**
   * Get just the currency symbol
   * @param {string} code
   * @returns {string}
   */
  function symbol(code) {
    return CURRENCIES[code] ? CURRENCIES[code].symbol : code;
  }

  /**
   * Get the currency name
   * @param {string} code
   * @returns {string}
   */
  function name(code) {
    return CURRENCIES[code] ? CURRENCIES[code].name : code;
  }

  /**
   * Get the number of decimal places for a currency
   * @param {string} code
   * @returns {number}
   */
  function decimals(code) {
    return CURRENCIES[code] ? CURRENCIES[code].decimals : 2;
  }

  /**
   * Resolve a country code to its currency code
   * @param {string} countryCode - ISO 3166-1 alpha-2 code
   * @returns {string} Currency code
   */
  function fromCountry(countryCode) {
    const upper = (countryCode || '').toUpperCase();
    // CFA zone mapping
    if (CFA_MAP[upper]) return CFA_MAP[upper];
    // Direct match (country code often matches currency suffix)
    const directMap = {
      NG: 'NGN', KE: 'KES', GH: 'GHS', ZA: 'ZAR', EG: 'EGP',
      TZ: 'TZS', UG: 'UGX', ET: 'ETB', MA: 'MAD', TN: 'TND',
      DZ: 'DZD', RW: 'RWF', BI: 'BIF', CD: 'CDF', AO: 'AOA',
      MZ: 'MZN', ZM: 'ZMW', MW: 'MWK', BW: 'BWP', NA: 'NAD',
      SZ: 'SZL', LS: 'LSL', ZW: 'ZWL', MG: 'MGA', SC: 'SCR',
      MU: 'MUR', KM: 'KMF', GM: 'GMD', SL: 'SLL', GN: 'GNF',
      LR: 'LRD', CV: 'CVE', ST: 'STN', MR: 'MRU', DJ: 'DJF',
      ER: 'ERN', SO: 'SOS', SD: 'SDG', SS: 'SSP', LY: 'LYD',
      US: 'USD', GB: 'GBP', AE: 'AED', CA: 'CAD', AU: 'AUD',
      CN: 'CNY', IN: 'INR', SA: 'SAR', JP: 'JPY', CH: 'CHF',
    };
    return directMap[upper] || null;
  }

  /**
   * List all available currencies
   * @param {string} [region] - 'africa' | 'international' | null (all)
   * @returns {Array<{code, symbol, name}>}
   */
  function list(region) {
    const africanCodes = new Set([
      'NGN','KES','GHS','ZAR','EGP','TZS','UGX','ETB','MAD','TND','DZD',
      'XOF','XAF','RWF','BIF','CDF','AOA','MZN','ZMW','MWK','BWP','NAD',
      'SZL','LSL','ZWL','MGA','SCR','MUR','KMF','GMD','SLL','GNF','LRD',
      'CVE','STN','MRU','DJF','ERN','SOS','SDG','SSP','LYD','GQE',
    ]);

    return Object.entries(CURRENCIES)
      .filter(([code]) => {
        if (region === 'africa') return africanCodes.has(code);
        if (region === 'international') return !africanCodes.has(code);
        return true;
      })
      .map(([code, c]) => ({ code, symbol: c.symbol, name: c.name }));
  }

  // ── EXPOSE ─────────────────────────────────────
  const currency = { format, symbol, name, decimals, fromCountry, list, CURRENCIES, CFA_MAP };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.currency = currency;

})(window);
