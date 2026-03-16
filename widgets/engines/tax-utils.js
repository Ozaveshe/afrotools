/**
 * AfroTools Widget Tax Utilities
 * Common tax calculation helpers shared across PAYE/VAT widgets
 */
var AfroWidgetTax = (function() {
  'use strict';

  /**
   * Calculate progressive tax from bands
   * @param {number} taxable - Taxable income
   * @param {Array} bands - [{min, max, rate}] where max can be Infinity
   * @returns {number} Total tax
   */
  function progressiveTax(taxable, bands) {
    if (taxable <= 0) return 0;
    var tax = 0;
    for (var i = 0; i < bands.length; i++) {
      var b = bands[i];
      var lo = b.min || 0;
      var hi = b.max === undefined || b.max === null ? Infinity : b.max;
      if (taxable <= lo) break;
      var chunk = Math.min(taxable, hi) - lo;
      if (chunk > 0) tax += chunk * (b.rate / 100);
    }
    return tax;
  }

  /**
   * Calculate VAT
   * @param {number} amount - Base amount
   * @param {number} rate - VAT rate as percentage (e.g. 15)
   * @param {string} mode - 'exclusive' (add VAT) or 'inclusive' (extract VAT)
   * @returns {{base:number, vat:number, total:number}}
   */
  function calcVAT(amount, rate, mode) {
    if (mode === 'inclusive') {
      var base = amount / (1 + rate / 100);
      return { base: base, vat: amount - base, total: amount };
    }
    var vat = amount * (rate / 100);
    return { base: amount, vat: vat, total: amount + vat };
  }

  /**
   * Format currency with locale
   * @param {number} n - Number to format
   * @param {string} currency - Currency code (NGN, KES, etc.)
   * @param {number} decimals - Decimal places (default 2)
   */
  function fmtCurrency(n, currency, decimals) {
    if (decimals === undefined) decimals = 2;
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency', currency: currency,
        minimumFractionDigits: decimals, maximumFractionDigits: decimals
      }).format(n);
    } catch(e) {
      return currency + ' ' + n.toLocaleString('en', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
    }
  }

  /**
   * Format number with commas
   */
  function fmtNum(n, dec) {
    if (dec === undefined) dec = 2;
    return Number(n).toLocaleString('en', {minimumFractionDigits: dec, maximumFractionDigits: dec});
  }

  /**
   * Format percentage
   */
  function fmtPct(n, dec) {
    if (dec === undefined) dec = 1;
    return Number(n).toFixed(dec) + '%';
  }

  return {
    progressiveTax: progressiveTax,
    calcVAT: calcVAT,
    fmtCurrency: fmtCurrency,
    fmtNum: fmtNum,
    fmtPct: fmtPct
  };
})();

if (typeof module !== 'undefined') module.exports = AfroWidgetTax;
