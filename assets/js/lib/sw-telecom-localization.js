(function initSwahiliTelecomLocalization(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.swTelecomLocalization = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createSwahiliTelecomLocalization() {
  'use strict';

  var COUNTRY_NAMES = Object.freeze({
    CI: 'Cote d Ivoire', EG: 'Misri', ET: 'Ethiopia', GH: 'Ghana', KE: 'Kenya',
    MA: 'Morocco', NG: 'Nigeria', RW: 'Rwanda', SN: 'Senegal', TZ: 'Tanzania',
    UG: 'Uganda', ZA: 'Afrika Kusini'
  });

  var PORTABILITY = Object.freeze({
    'Dial *PORT*{number}# to your new operator. Processing: 48 hours.':
      'Piga *PORT*{number}# kwa mtoa huduma mpya. Uchakataji: saa 48.',
    'SMS PORT to 3535. Processing: 24 hours.':
      'Tuma PORT kwa SMS kwenda 3535. Uchakataji: saa 24.',
    'Send PORT to 600 from new SIM. Processing: 24-48 hours.':
      'Tuma PORT kwenda 600 kutoka SIM mpya. Uchakataji: saa 24 hadi 48.',
    'Send PORT to 7676. Processing: 72 hours.':
      'Tuma PORT kwenda 7676. Uchakataji: saa 72.',
    'Send PORTABILITE to 1212': 'Tuma PORTABILITE kwenda 1212.',
    'Send request via operator portal/store. Processing: 24 hours.':
      'Tuma ombi kupitia portal au duka la mtoa huduma. Uchakataji: saa 24.',
    'Submit porting request via new provider. Processing: 24 hours.':
      'Wasilisha ombi kwa mtoa huduma mpya. Uchakataji: saa 24.',
    'Text PORT to new operator number. Processing: 48 hours.':
      'Tuma PORT kwa namba ya mtoa huduma mpya. Uchakataji: saa 48.',
    'Visit new operator with ID': 'Tembelea mtoa huduma mpya ukiwa na kitambulisho.',
    'Visit new operator with ID. Processing: 2 business days.':
      'Tembelea mtoa huduma mpya ukiwa na kitambulisho. Uchakataji: siku 2 za kazi.',
    'Not yet available': 'Bado haipatikani.',
    'Not yet implemented in Tanzania': 'Bado haijatekelezwa Tanzania.'
  });

  var SIM_TEXT = Object.freeze({
    "CIN (Carte d'Identite Nationale)": 'CIN (kitambulisho cha taifa)',
    CNI: 'CNI',
    "CNI (Carte Nationale d'Identite)": 'CNI (kitambulisho cha taifa)',
    'Ghana Card (National ID)': 'Ghana Card (kitambulisho cha taifa)',
    'NIN-SIM linkage': 'Kuunganisha NIN na SIM',
    'National ID': 'Kitambulisho cha taifa',
    'National ID / Fayda': 'Kitambulisho cha taifa / Fayda',
    'National ID / Huduma Namba': 'Kitambulisho cha taifa / Huduma Namba',
    'National ID / Irembo': 'Kitambulisho cha taifa / Irembo',
    'National ID / NIDA': 'Kitambulisho cha taifa / NIDA',
    'National ID card': 'Kadi ya kitambulisho cha taifa',
    'RICA (Regulation of Interception of Communications Act)': 'RICA (sheria ya mawasiliano)',
    'Contact provider': 'Wasiliana na mtoa huduma',
    'Send ID number to 1000': 'Tuma namba ya kitambulisho kwenda 1000',
    'Ongoing enforcement': 'Utekelezaji unaendelea',
    'Line deactivation': 'Kuzima laini',
    'Line disconnection': 'Kukatwa kwa laini',
    'Line suspension': 'Kusimamishwa kwa laini',
    'SIM deactivation': 'Kuzima SIM'
  });

  var REGULATORS = Object.freeze({
    'CA (Communications Authority of Kenya)': 'CA (Mamlaka ya Mawasiliano Kenya)',
    'NCC (Nigerian Communications Commission)': 'NCC (Tume ya Mawasiliano Nigeria)'
  });

  var TV_NAMES = Object.freeze({
    Access: 'Access', Compact: 'Compact', 'Compact Plus': 'Compact Plus', Confam: 'Confam',
    Family: 'Familia', Jinja: 'Jinja', Jolli: 'Jolli', Lite: 'Msingi', Max: 'Max',
    Mobile: 'Simu', Padi: 'Padi', Plus: 'Plus', Premium: 'Premium', Pro: 'Pro',
    'Pro (Premier League)': 'Pro (Premier League)', Smallie: 'Smallie', Standard: 'Standard',
    Supa: 'Supa', Yanga: 'Yanga'
  });

  var TV_NOTES = Object.freeze({
    '2 devices, HD': 'Vifaa 2, HD',
    'Sports + entertainment': 'Michezo na burudani',
    'Streaming only, 1 device': 'Streaming pekee, kifaa 1'
  });

  function mapped(map, value) {
    var text = String(value || '');
    return Object.prototype.hasOwnProperty.call(map, text) ? map[text] : text;
  }

  function countryName(code, fallback) { return COUNTRY_NAMES[code] || String(fallback || code || ''); }
  function dataVolume(value) {
    return String(value || '').replace(/\bUnlimited\b/gi, 'Bila kikomo')
      .replace(/(\d+(?:\.\d+)?)\s*GB\b/gi, '$1 GB').replace(/(\d+(?:\.\d+)?)\s*MB\b/gi, '$1 MB');
  }
  function planName(value) {
    return dataVolume(value).replace(/\b(\d+)-Day\b/gi, 'Siku $1')
      .replace(/\bDaily\b/gi, 'Kila siku').replace(/\bWeekly\b/gi, 'Kila wiki').replace(/\bMonthly\b/gi, 'Kila mwezi');
  }
  function validity(value) {
    return String(value || '').replace(/\b1 day\b/gi, 'Siku 1').replace(/\b2 days\b/gi, 'Siku 2')
      .replace(/\b7 days\b/gi, 'Siku 7').replace(/\b30 days\b/gi, 'Siku 30').replace(/\b24 hrs\b/gi, 'Saa 24');
  }
  function networkType(value) { return String(value || '').replace(/\bMobile Data\b/g, 'Data ya simu').replace(/\bFiber\b/g, 'Fibre'); }
  function speed(value) { return String(value || '').replace(/(\d)\s*-\s*(\d)/g, '$1-$2').replace(/(\d)\s*Mbps\b/g, '$1 Mbps'); }
  function businessName(value) { return String(value || '').replace(/\bMobile Data\b/g, 'Data ya simu'); }

  return Object.freeze({
    countryNames: COUNTRY_NAMES, countryName: countryName, dataVolume: dataVolume,
    planName: planName, validity: validity,
    portability: function (value) { return mapped(PORTABILITY, value); },
    sim: function (value) { return mapped(SIM_TEXT, value); },
    regulator: function (value) { return mapped(REGULATORS, value); },
    networkType: networkType, speed: speed, businessName: businessName,
    tvNames: TV_NAMES, tvName: function (value) { return mapped(TV_NAMES, value); },
    tvNote: function (value) { return mapped(TV_NOTES, value); }
  });
});
