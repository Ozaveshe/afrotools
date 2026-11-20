(function () {
  'use strict';
  var paths = { fr: '/fr/tools/suivi-carburant/', sw: '/sw/zana/ufuatiliaji-bei-za-mafuta/' };
  function normalize(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function find(query, locale, tools) {
    var words = normalize(query);
    var topic = (locale === 'fr' && /^carburants?$/.test(words)) || (locale === 'sw' && words === 'mafuta');
    if (!topic && (!/\b(prix|tarif|tarifs|bei)\b/.test(words) || !/\b(carburants?|essence|petrol|petroli|diesel|gasoil|gazole|dizeli|mafuta)\b/.test(words))) return null;
    var matches = [];
    (window.AFRICAN_COUNTRIES || []).forEach(function (country) {
      var names = [country.name, country.displayNames && country.displayNames[locale], country.slug];
      names.forEach(function (name) {
        name = normalize(name);
        if (name && (' ' + words + ' ').includes(' ' + name + ' ')) matches.push({ name: name, code: country.code });
      });
    });
    matches.sort(function (a, b) { return b.name.length - a.name.length; });
    var country = matches[0];
    var intent = country ? (' ' + words + ' ').replace(' ' + country.name + ' ', ' ') : words;
    var allowed = /^(prix|tarifs?|bei|carburants?|essence|petrol|petroli|diesel|gasoil|gazole|dizeli|mafuta|du|des|de|d|l|la|les|le|en|au|aux|a|par|litre|ya|za|kwa|nchini|leo|aujourd|hui)$/;
    if (!intent.trim().split(/\s+/).every(function (token) { return allowed.test(token); })) return null;
    var finder = tools.find(function (tool) { return String(tool.href || '').replace(/\/?$/, '/') === paths[locale]; });
    if (!finder) return null;
    var params = new URLSearchParams();
    if (country) params.set('country', country.code);
    if (/\b(diesel|gasoil|gazole|dizeli)\b/.test(intent)) params.set('fuel', 'diesel');
    else if (/\b(essence|petrol|petroli)\b/.test(intent)) params.set('fuel', 'petrol');
    return Object.assign({}, finder, { href: paths[locale] + (params.size ? '?' + params : '') + '#fuel-finder' });
  }
  window.AfroFuelDirectoryResult = find;
})();
