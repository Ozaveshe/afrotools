(function () {
  'use strict';
    function normalizeSearchText(value) {
      return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
    }
    var countryPayePages = {
      'algeria': 'dz-paye', 'angola': 'ao-paye', 'benin': 'bj-paye', 'botswana': 'bw-paye',
      'burkina-faso': 'bf-paye', 'burundi': 'bi-paye', 'cameroon': 'cm-paye', 'cape-verde': 'cv-paye',
      'car': 'cf-paye', 'chad': 'td-paye', 'comoros': 'km-paye', 'congo': 'cg-paye',
      'cote-divoire': 'ci-paye', 'djibouti': 'dj-paye', 'dr-congo': 'cd-paye', 'egypt': 'eg-paye',
      'eq-guinea': 'gq-paye', 'eritrea': 'er-paye', 'eswatini': 'sz-paye', 'ethiopia': 'et-paye',
      'gabon': 'ga-paye', 'gambia': 'gm-paye', 'ghana': 'gh-paye', 'guinea': 'gn-paye',
      'guinea-bissau': 'gw-paye', 'kenya': 'ke-paye', 'lesotho': 'ls-paye', 'liberia': 'lr-paye',
      'libya': 'ly-paye', 'madagascar': 'mg-paye', 'malawi': 'mw-paye', 'mali': 'ml-paye',
      'mauritania': 'mr-paye', 'mauritius': 'mu-paye', 'morocco': 'ma-paye', 'mozambique': 'mz-paye',
      'namibia': 'na-paye', 'niger': 'ne-paye', 'rwanda': 'rw-paye', 'sao-tome': 'st-paye',
      'senegal': 'sn-paye', 'seychelles': 'sc-paye', 'sierra-leone': 'sl-paye', 'somalia': 'so-paye',
      'south-africa': 'za-paye', 'south-sudan': 'ss-paye', 'sudan': 'sd-paye', 'tanzania': 'tz-paye',
      'togo': 'tg-paye', 'tunisia': 'tn-paye', 'uganda': 'ug-paye', 'zambia': 'zm-paye',
      'zimbabwe': 'zw-paye', 'nigeria': 'ng-salary-tax'
    };

    var taxReferenceNames = {
      'bf-paye': 'Burkina Faso Payroll — Review Required',
      'st-paye': 'São Tomé Payroll Contributions Checker (INSS)',
      'er-paye': 'Eritrea Employment Income Tax — Statutory Reference',
      'km-paye': 'Comoros Employment Income Tax — Statutory Reference',
      'so-vat': 'Somalia VAT Status and Consumption Tax Evidence'
    };

    function countryTaxIntent(query) {
      var text = normalizeSearchText(query);
      var suffix = text.match(/^(.+?) (paye|pay as you earn|income tax|vat|tax)(?: calculator)?$/);
      var prefix = text.match(/^(paye|income tax|vat|tax) calculator (?:for |in )?(.+)$/);
      if (!suffix && !prefix) return null;
      var country = suffix ? suffix[1] : prefix[2];
      var kind = suffix ? suffix[2] : prefix[1];
      var generic = kind === 'tax';
      var aliases = {
        'central african republic': 'car', 'equatorial guinea': 'eq-guinea', 'cote d ivoire': 'cote-divoire',
        'ivory coast': 'cote-divoire', 'sao tome and principe': 'sao-tome', 'cabo verde': 'cape-verde',
        'republic of the congo': 'congo', 'republic of congo': 'congo', 'democratic republic of the congo': 'dr-congo'
      };
      var slug = aliases[country] || country.replace(/ /g, '-');
      if (!Object.prototype.hasOwnProperty.call(countryPayePages, slug)) return null;
      var ambiguous = country === 'congo';
      var choices = [];
      (ambiguous ? ['congo', 'dr-congo'] : [slug]).forEach(function(code) {
        var title = code === 'congo' ? 'Republic of the Congo' : code === 'dr-congo' ? 'DR Congo' : country.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
        var paye = countryPayePages[code];
        (generic ? ['PAYE', 'VAT'] : [kind === 'vat' ? 'VAT' : 'PAYE']).forEach(function(type) {
          var id = type === 'VAT' ? paye.slice(0, 2) + '-vat' : paye;
          choices.push({ id: id, category: 'financial', name: taxReferenceNames[id] || title + ' ' + type + ' Calculator', href: '/' + code + '/' + id, status: 'live', icon: '🧮' });
        });
      });
      return { choices: choices, generic: generic, ambiguous: ambiguous, prefix: '/' + slug + '/', hub: slug !== 'car' && slug !== 'eq-guinea' };
    }

  window.AfroToolsCountryTax = { detect: countryTaxIntent, referenceNames: taxReferenceNames };
})();
