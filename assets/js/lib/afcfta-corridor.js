(function () {
  'use strict';
  function assess(destination, category, year, hs) {
    const entered = String(hs || '').trim();
    const validCode = !entered || /^(?:\d{4}(?:\d{2}){0,4}|\d{4}(?:\.\d{2}){1,4})$/.test(entered);
    const digits = entered.replace(/\./g, '');
    const schedule = destination.reductionSchedule?.['cat' + category];
    const reduction = schedule?.[year];
    const sensitive = validCode && digits ? (destination.sensitiveProducts || []).filter(item => {
      const range = /\(HS (\d{2}(?:\d{2})?)(?:-(\d{2}(?:\d{2})?))?\)/.exec(item);
      if (!range) return false;
      const prefix = digits.slice(0, range[1].length);
      return prefix >= range[1] && prefix <= (range[2] || range[1]);
    }) : [];
    return { validCode, reduction: Number.isFinite(reduction) ? reduction : null, sensitive };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { assess };
  else window.AfCftaCorridor = { assess };
}());
