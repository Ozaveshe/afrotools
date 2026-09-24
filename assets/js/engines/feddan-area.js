(function (root) {
  'use strict';
  var ACRE_M2 = 4046.8564224;
  function convert(amount, direction, squareMetresPerFeddan) {
    amount = Number(amount);
    squareMetresPerFeddan = Number(squareMetresPerFeddan);
    if (!Number.isFinite(amount) || amount < 0) throw new RangeError('Enter a non-negative area.');
    if (!Number.isFinite(squareMetresPerFeddan) || squareMetresPerFeddan <= 0) throw new RangeError('Enter a positive feddan area in square metres.');
    if (direction !== 'feddan-to-acre' && direction !== 'acre-to-feddan') throw new RangeError('Select a conversion direction.');
    var squareMetres = amount * (direction === 'feddan-to-acre' ? squareMetresPerFeddan : ACRE_M2);
    if (!Number.isFinite(squareMetres)) throw new RangeError('This area is too large to calculate.');
    var result = { feddans: squareMetres / squareMetresPerFeddan, acres: squareMetres / ACRE_M2, squareMetres: squareMetres, hectares: squareMetres / 10000 };
    if (!Object.values(result).every(Number.isFinite)) throw new RangeError('The result is too large. Check the area and feddan basis.');
    return result;
  }
  var api = { convert: convert, acreSquareMetres: ACRE_M2, referenceFeddanSquareMetres: 4200 };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.AfroTools = root.AfroTools || {}; root.AfroTools.feddanArea = api; }
}(typeof window === 'undefined' ? globalThis : window));
