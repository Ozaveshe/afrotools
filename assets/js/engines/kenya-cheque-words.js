/* English cheque wording for an amount returned by the exact-decimal parser. */
(function (root) {
  'use strict';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  function numWords(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? '-' + ones[n%10] : '');
    if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' and ' + numWords(n%100) : '');
    if (n < 1000000) return numWords(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + numWords(n%1000) : '');
    if (n < 1000000000) return numWords(Math.floor(n/1000000)) + ' Million' + (n%1000000 ? ' ' + numWords(n%1000000) : '');
    return numWords(Math.floor(n/1000000000)) + ' Billion' + (n%1000000000 ? ' ' + numWords(n%1000000000) : '');
  }

  function kenyaWords(amount) {
    const shillings = amount.major;
    const cents = amount.minor;

    let words = '';
    if (shillings === 0 && cents === 0) return 'Zero Kenya Shillings Only';

    if (shillings > 0) {
      words = (shillings === 1 ? 'Kenya Shilling ' : 'Kenya Shillings ') + numWords(shillings);
    }
    if (cents > 0) {
      words += (shillings > 0 ? ' and ' : '') + (cents === 1 ? 'Cent ' : 'Cents ');
      words += numWords(cents);
    }
    words += ' Only';
    return words;
  }
  if (typeof module === 'object' && module.exports) module.exports = kenyaWords;
  else {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.kenyaChequeWords = kenyaWords;
  }
})(typeof window === 'undefined' ? globalThis : window);
