(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ArabicNumeralsEngine = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var WESTERN = '0123456789';
  var ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
  var EASTERN_ARABIC_INDIC = '۰۱۲۳۴۵۶۷۸۹';

  function familyDigits(family) {
    if (family === 'arabic-indic') return ARABIC_INDIC;
    if (family === 'eastern-arabic-indic') return EASTERN_ARABIC_INDIC;
    return WESTERN;
  }
  function toWestern(value) {
    return Array.from(String(value || '')).map(function (character) {
      var index = ARABIC_INDIC.indexOf(character);
      if (index < 0) index = EASTERN_ARABIC_INDIC.indexOf(character);
      return index < 0 ? character : WESTERN[index];
    }).join('');
  }
  function convertDigits(value, family) {
    var target = familyDigits(family);
    return Array.from(toWestern(value)).map(function (character) {
      var index = WESTERN.indexOf(character);
      return index < 0 ? character : target[index];
    }).join('');
  }
  function detectFamilies(value) {
    var text = String(value || '');
    var families = [];
    if (/[0-9]/.test(text)) families.push('western');
    if (/[\u0660-\u0669]/.test(text)) families.push('arabic-indic');
    if (/[\u06f0-\u06f9]/.test(text)) families.push('eastern-arabic-indic');
    return families;
  }
  return {
    WESTERN: WESTERN,
    ARABIC_INDIC: ARABIC_INDIC,
    EASTERN_ARABIC_INDIC: EASTERN_ARABIC_INDIC,
    toWestern: toWestern,
    convertDigits: convertDigits,
    detectFamilies: detectFamilies
  };
}));
