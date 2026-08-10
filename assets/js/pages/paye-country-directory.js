(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.PayeCountryDirectory = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var countries = [
    ['NG', 'Nigeria', '/nigeria/ng-salary-tax'],
    ['GH', 'Ghana', '/ghana/gh-paye'],
    ['SN', 'Senegal', '/senegal/sn-paye', '/fr/senegal/calculateur-salaire-net'],
    ['CI', "Côte d'Ivoire", '/cote-divoire/ci-paye', '/fr/cote-divoire/calculateur-salaire-net'],
    ['ML', 'Mali', '/mali/ml-paye'],
    ['BF', 'Burkina Faso', '/burkina-faso/bf-paye'],
    ['NE', 'Niger', '/niger/ne-paye', '/fr/niger/ne-paye/'],
    ['GN', 'Guinea', '/guinea/gn-paye', '/fr/guinea/gn-paye/'],
    ['SL', 'Sierra Leone', '/sierra-leone/sl-paye'],
    ['LR', 'Liberia', '/liberia/lr-paye'],
    ['TG', 'Togo', '/togo/tg-paye'],
    ['BJ', 'Benin', '/benin/bj-paye', '/fr/benin/calculateur-salaire-net/'],
    ['GM', 'Gambia', '/gambia/gm-paye'],
    ['GW', 'Guinea-Bissau', '/guinea-bissau/gw-paye'],
    ['CV', 'Cape Verde', '/cape-verde/cv-paye', '/fr/cape-verde/cv-paye/'],
    ['KE', 'Kenya', '/kenya/ke-paye'],
    ['TZ', 'Tanzania', '/tanzania/tz-paye'],
    ['UG', 'Uganda', '/uganda/ug-paye'],
    ['ET', 'Ethiopia', '/ethiopia/et-paye'],
    ['RW', 'Rwanda', '/rwanda/rw-paye'],
    ['BI', 'Burundi', '/burundi/bi-paye', '/fr/burundi/calculateur-salaire-net/'],
    ['SS', 'South Sudan', '/south-sudan/ss-paye'],
    ['SO', 'Somalia', '/somalia/so-paye'],
    ['ER', 'Eritrea', '/eritrea/er-paye'],
    ['DJ', 'Djibouti', '/djibouti/dj-paye', '/fr/djibouti/calculateur-salaire-net/'],
    ['KM', 'Comoros', '/comoros/km-paye', '/fr/comores/calculateur-salaire-net/'],
    ['MG', 'Madagascar', '/madagascar/mg-paye', '/fr/madagascar/calculateur-salaire-net/'],
    ['MU', 'Mauritius', '/mauritius/mu-paye'],
    ['SC', 'Seychelles', '/seychelles/sc-paye'],
    ['EG', 'Egypt', '/egypt/eg-paye'],
    ['MA', 'Morocco', '/morocco/ma-paye', '/fr/maroc/calculateur-salaire-net'],
    ['DZ', 'Algeria', '/algeria/dz-paye', '/fr/algerie/calculateur-salaire-net'],
    ['TN', 'Tunisia', '/tunisia/tn-paye', '/fr/tunisie/calculateur-salaire-net'],
    ['LY', 'Libya', '/libya/ly-paye'],
    ['SD', 'Sudan', '/sudan/sd-paye'],
    ['ZA', 'South Africa', '/south-africa/za-paye'],
    ['ZM', 'Zambia', '/zambia/zm-paye'],
    ['ZW', 'Zimbabwe', '/zimbabwe/zw-paye'],
    ['MZ', 'Mozambique', '/mozambique/mz-paye'],
    ['MW', 'Malawi', '/malawi/mw-paye'],
    ['NA', 'Namibia', '/namibia/na-paye'],
    ['BW', 'Botswana', '/botswana/bw-paye'],
    ['LS', 'Lesotho', '/lesotho/ls-paye'],
    ['SZ', 'Eswatini', '/eswatini/sz-paye'],
    ['MR', 'Mauritania', '/mauritania/mr-paye', '/fr/mauritanie/calculateur-salaire-net/'],
    ['CM', 'Cameroon', '/cameroon/cm-paye', '/fr/cameroun/calculateur-salaire-net'],
    ['CD', 'DR Congo', '/dr-congo/cd-paye', '/fr/dr-congo/cd-paye/'],
    ['CG', 'Congo', '/congo/cg-paye', '/fr/congo/cg-paye/'],
    ['GA', 'Gabon', '/gabon/ga-paye', '/fr/gabon/ga-paye/'],
    ['CF', 'Central African Republic', '/car/cf-paye', '/fr/centrafrique/calculateur-salaire-net/'],
    ['TD', 'Chad', '/chad/td-paye', '/fr/tchad/calculateur-salaire-net/'],
    ['GQ', 'Equatorial Guinea', '/eq-guinea/gq-paye', '/fr/eq-guinea/gq-paye/'],
    ['ST', 'São Tomé and Príncipe', '/sao-tome/st-paye'],
    ['AO', 'Angola', '/angola/ao-paye']
  ].map(function (row) {
    return { code: row[0], name: row[1], route: row[2], frRoute: row[3] || null };
  });

  var frenchNames = {
    NG: 'Nigéria', GH: 'Ghana', SN: 'Sénégal', CI: "Côte d’Ivoire", ML: 'Mali', BF: 'Burkina Faso',
    NE: 'Niger', GN: 'Guinée', SL: 'Sierra Leone', LR: 'Libéria', TG: 'Togo', BJ: 'Bénin',
    GM: 'Gambie', GW: 'Guinée-Bissau', CV: 'Cap-Vert', KE: 'Kenya', TZ: 'Tanzanie', UG: 'Ouganda',
    ET: 'Éthiopie', RW: 'Rwanda', BI: 'Burundi', SS: 'Soudan du Sud', SO: 'Somalie', ER: 'Érythrée',
    DJ: 'Djibouti', KM: 'Comores', MG: 'Madagascar', MU: 'Maurice', SC: 'Seychelles', EG: 'Égypte',
    MA: 'Maroc', DZ: 'Algérie', TN: 'Tunisie', LY: 'Libye', SD: 'Soudan', ZA: 'Afrique du Sud',
    ZM: 'Zambie', ZW: 'Zimbabwe', MZ: 'Mozambique', MW: 'Malawi', NA: 'Namibie', BW: 'Botswana',
    LS: 'Lesotho', SZ: 'Eswatini', MR: 'Mauritanie', CM: 'Cameroun', CD: 'RDC', CG: 'Congo',
    GA: 'Gabon', CF: 'République centrafricaine', TD: 'Tchad', GQ: 'Guinée équatoriale',
    ST: 'São Tomé-et-Príncipe', AO: 'Angola'
  };

  var swahiliNames = {
    NG: 'Nigeria', GH: 'Ghana', SN: 'Senegal', CI: 'Côte d’Ivoire', ML: 'Mali', BF: 'Burkina Faso',
    NE: 'Niger', GN: 'Guinea', SL: 'Sierra Leone', LR: 'Liberia', TG: 'Togo', BJ: 'Benin', GM: 'Gambia',
    GW: 'Guinea-Bissau', CV: 'Cape Verde', KE: 'Kenya', TZ: 'Tanzania', UG: 'Uganda', ET: 'Ethiopia',
    RW: 'Rwanda', BI: 'Burundi', SS: 'Sudan Kusini', SO: 'Somalia', ER: 'Eritrea', DJ: 'Djibouti',
    KM: 'Komoro', MG: 'Madagaska', MU: 'Morisi', SC: 'Shelisheli', EG: 'Misri', MA: 'Morocco',
    DZ: 'Algeria', TN: 'Tunisia', LY: 'Libya', SD: 'Sudan', ZA: 'Afrika Kusini', ZM: 'Zambia',
    ZW: 'Zimbabwe', MZ: 'Msumbiji', MW: 'Malawi', NA: 'Namibia', BW: 'Botswana', LS: 'Lesotho',
    SZ: 'Eswatini', MR: 'Mauritania', CM: 'Kamerun', CD: 'Jamhuri ya Kidemokrasia ya Kongo',
    CG: 'Kongo', GA: 'Gabon', CF: 'Jamhuri ya Afrika ya Kati', TD: 'Chad', GQ: 'Guinea ya Ikweta',
    ST: 'São Tomé na Príncipe', AO: 'Angola'
  };

  var swahiliRoutes = {
    NG: '/sw/nigeria/kikokotoo-kodi-mshahara/', GH: '/sw/ghana/kikokotoo-kodi-mshahara/', SN: '/sw/senegal/kikokotoo-kodi-mshahara/',
    CI: '/sw/cote-divoire/kikokotoo-kodi-mshahara/', ML: '/sw/mali/kikokotoo-kodi-mshahara/', BF: '/sw/burkina-faso/kikokotoo-kodi-mshahara/',
    NE: '/sw/niger/kikokotoo-kodi-mshahara/', GN: '/sw/guinea/kikokotoo-kodi-mshahara/', SL: '/sw/sierra-leone/kikokotoo-kodi-mshahara/',
    LR: '/sw/liberia/kikokotoo-kodi-mshahara/', TG: '/sw/togo/kikokotoo-kodi-mshahara/', BJ: '/sw/benin/kikokotoo-kodi-mshahara/',
    GM: '/sw/gambia/kikokotoo-kodi-mshahara/', GW: '/sw/guinea-bissau/kikokotoo-kodi-mshahara/', CV: '/sw/cape-verde/kikokotoo-kodi-mshahara/',
    KE: '/sw/kenya/kikokotoo-kodi-mshahara/', TZ: '/sw/tanzania/kikokotoo-kodi-mshahara/', UG: '/sw/uganda/kikokotoo-kodi-mshahara/',
    ET: '/sw/ethiopia/kikokotoo-kodi-mshahara/', RW: '/sw/rwanda/kikokotoo-kodi-mshahara/', BI: '/sw/burundi/kikokotoo-kodi-mshahara/',
    SS: '/sw/south-sudan/kikokotoo-kodi-mshahara/', SO: '/sw/somalia/kikokotoo-kodi-mshahara/', ER: '/sw/eritrea/kikokotoo-kodi-mshahara/',
    DJ: '/sw/djibouti/kikokotoo-kodi-mshahara/', KM: '/sw/comoros/kikokotoo-kodi-mshahara/', MG: '/sw/madagascar/kikokotoo-kodi-mshahara/',
    MU: '/sw/mauritius/kikokotoo-kodi-mshahara/', SC: '/sw/seychelles/kikokotoo-kodi-mshahara/', EG: '/sw/egypt/kikokotoo-kodi-mshahara/',
    MA: '/sw/morocco/kikokotoo-kodi-mshahara/', DZ: '/sw/algeria/kikokotoo-kodi-mshahara/', TN: '/sw/tunisia/kikokotoo-kodi-mshahara/',
    LY: '/sw/libya/kikokotoo-kodi-mshahara/', SD: '/sw/sudan/kikokotoo-kodi-mshahara/', ZA: '/sw/south-africa/kikokotoo-kodi-mshahara/',
    ZM: '/sw/zambia/kikokotoo-kodi-mshahara/', ZW: '/sw/zimbabwe/kikokotoo-kodi-mshahara/', MZ: '/sw/mozambique/kikokotoo-kodi-mshahara/',
    MW: '/sw/malawi/kikokotoo-kodi-mshahara/', NA: '/sw/namibia/kikokotoo-kodi-mshahara/', BW: '/sw/botswana/kikokotoo-kodi-mshahara/',
    LS: '/sw/lesotho/kikokotoo-kodi-mshahara/', SZ: '/sw/eswatini/kikokotoo-kodi-mshahara/', MR: '/sw/mauritania/kikokotoo-kodi-mshahara/',
    CM: '/sw/cameroon/kikokotoo-kodi-mshahara/', CD: '/sw/dr-congo/kikokotoo-kodi-mshahara/', CG: '/sw/congo/kikokotoo-kodi-mshahara/',
    GA: '/sw/gabon/kikokotoo-kodi-mshahara/', CF: '/sw/central-african-republic/kikokotoo-kodi-mshahara/', TD: '/sw/chad/kikokotoo-kodi-mshahara/',
    GQ: '/sw/equatorial-guinea/kikokotoo-kodi-mshahara/', ST: '/sw/sao-tome/kikokotoo-kodi-mshahara/', AO: '/sw/angola/kikokotoo-kodi-mshahara/'
  };

  function resolveCountry(code, language) {
    var country = countries.find(function (item) { return item.code === String(code || '').toUpperCase(); });
    if (!country) return null;
    var normalizedLanguage = String(language || '').toLowerCase();
    var isFrench = normalizedLanguage.indexOf('fr') === 0;
    var isSwahili = normalizedLanguage.indexOf('sw') === 0;
    var localizedRoute = isFrench ? country.frRoute : (isSwahili ? swahiliRoutes[country.code] : null);
    return {
      code: country.code,
      name: country.name,
      supported: Boolean(country.route),
      route: country.route ? (localizedRoute || country.route) : null,
      localized: Boolean(localizedRoute),
      languageFallback: Boolean((isFrench || isSwahili) && country.route && !localizedRoute)
    };
  }

  function init(documentRef) {
    var doc = documentRef || (typeof document !== 'undefined' ? document : null);
    if (!doc) return;
    var select = doc.getElementById('paye-country');
    var result = doc.getElementById('paye-country-result');
    var link = doc.getElementById('paye-country-open');
    if (!select || !result || !link) return;

    var lang = doc.documentElement.lang || 'en';
    var normalizedLang = lang.toLowerCase();
    var french = normalizedLang.indexOf('fr') === 0;
    var swahili = normalizedLang.indexOf('sw') === 0;
    countries.forEach(function (country) {
      var option = doc.createElement('option');
      option.value = country.code;
      option.textContent = french ? (frenchNames[country.code] || country.name) : (swahili ? (swahiliNames[country.code] || country.name) : country.name);
      select.appendChild(option);
    });

    function update() {
      var match = resolveCountry(select.value, lang);
      link.hidden = true;
      link.removeAttribute('href');
      if (!match) {
        result.textContent = french
          ? 'Choisissez un pays pour ouvrir le calculateur fiscal correspondant.'
          : (swahili ? 'Chagua nchi ili kufungua kikokotoo chake cha kodi ya mshahara.' : 'Choose a country to open its country-specific tax calculator.');
        return;
      }
      if (!match.supported) {
        result.textContent = french
          ? "Aucun calculateur PAYE avec sources vérifiées n'est publié pour ce pays. Aucun résultat générique n'est inventé."
          : (swahili ? 'Hakuna kikokotoo cha PAYE chenye chanzo kilichokaguliwa kwa nchi hii. Hatubuni makadirio ya jumla.' : 'No source-backed PAYE calculator is published for this country. No generic estimate is shown.');
        return;
      }
      result.textContent = french
        ? (match.localized
          ? 'Calculateur national en français disponible. Vérifiez la date des sources et les hypothèses sur la page suivante.'
          : 'Calculateur national disponible en anglais. Vérifiez la date des sources et les hypothèses sur la page suivante.')
        : (swahili
          ? (match.localized ? 'Kikokotoo cha nchi kwa Kiswahili kinapatikana. Kagua tarehe ya chanzo na assumptions kwenye ukurasa unaofuata.' : 'Kikokotoo cha nchi kinapatikana kwa Kiingereza. Kagua tarehe ya chanzo na assumptions kwenye ukurasa unaofuata.')
          : 'Country-specific calculator available. Check its source date and assumptions before relying on the estimate.');
      link.href = match.route;
      link.textContent = french
        ? (match.localized ? 'Ouvrir le calculateur en français' : 'Ouvrir le calculateur en anglais')
        : (swahili ? (match.localized ? 'Fungua kikokotoo kwa Kiswahili' : 'Fungua kikokotoo kwa Kiingereza') : 'Open the country calculator');
      link.hidden = false;
    }

    select.addEventListener('change', update);
    update();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(document); });
    else init(document);
  }

  return { countries: countries, frenchNames: frenchNames, swahiliNames: swahiliNames, swahiliRoutes: swahiliRoutes, resolveCountry: resolveCountry, init: init };
});
