(function initFrenchTelecomLocalization(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.frTelecomLocalization = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createFrenchTelecomLocalization() {
  'use strict';

  var COUNTRY_NAMES = Object.freeze({
    CI: 'Côte d’Ivoire',
    EG: 'Égypte',
    ET: 'Éthiopie',
    GH: 'Ghana',
    KE: 'Kenya',
    MA: 'Maroc',
    NG: 'Nigéria',
    RW: 'Rwanda',
    SN: 'Sénégal',
    TZ: 'Tanzanie',
    UG: 'Ouganda',
    ZA: 'Afrique du Sud'
  });

  var PORTABILITY = Object.freeze({
    'Dial *PORT*{number}# to your new operator. Processing: 48 hours.':
      'Composez *PORT*{number}# auprès de votre nouvel opérateur. Traitement : 48 heures.',
    'SMS PORT to 3535. Processing: 24 hours.':
      'Envoyez PORT par SMS au 3535. Traitement : 24 heures.',
    'Send PORT to 600 from new SIM. Processing: 24-48 hours.':
      'Envoyez PORT au 600 depuis la nouvelle SIM. Traitement : 24 à 48 heures.',
    'Send PORT to 7676. Processing: 72 hours.':
      'Envoyez PORT au 7676. Traitement : 72 heures.',
    'Send PORTABILITE to 1212':
      'Envoyez PORTABILITE au 1212.',
    'Send request via operator portal/store. Processing: 24 hours.':
      'Envoyez la demande via le portail ou l’agence de l’opérateur. Traitement : 24 heures.',
    'Submit porting request via new provider. Processing: 24 hours.':
      'Déposez la demande de portabilité auprès du nouvel opérateur. Traitement : 24 heures.',
    'Text PORT to new operator number. Processing: 48 hours.':
      'Envoyez PORT par SMS au numéro du nouvel opérateur. Traitement : 48 heures.',
    'Visit new operator with ID':
      'Rendez-vous chez le nouvel opérateur avec une pièce d’identité.',
    'Visit new operator with ID. Processing: 2 business days.':
      'Rendez-vous chez le nouvel opérateur avec une pièce d’identité. Traitement : 2 jours ouvrables.',
    'Not yet available': 'Pas encore disponible.',
    'Not yet implemented in Tanzania': 'Pas encore mis en œuvre en Tanzanie.'
  });

  var SIM_TEXT = Object.freeze({
    'CIN (Carte d\'Identite Nationale)': 'CIN (carte d’identité nationale)',
    CNI: 'CNI',
    'CNI (Carte Nationale d\'Identite)': 'CNI (carte nationale d’identité)',
    'Ghana Card (National ID)': 'Ghana Card (carte nationale d’identité)',
    'NIN-SIM linkage': 'Liaison NIN–SIM',
    'National ID': 'Carte nationale d’identité',
    'National ID / Fayda': 'Carte nationale d’identité / Fayda',
    'National ID / Huduma Namba': 'Carte nationale d’identité / Huduma Namba',
    'National ID / Irembo': 'Carte nationale d’identité / Irembo',
    'National ID / NIDA': 'Carte nationale d’identité / NIDA',
    'National ID card': 'Carte nationale d’identité',
    'RICA (Regulation of Interception of Communications Act)':
      'RICA (loi sur la réglementation de l’interception des communications)',
    'Contact provider': 'Contacter l’opérateur',
    'Send ID number to 1000': 'Envoyer le numéro de la pièce d’identité au 1000',
    'Ongoing enforcement': 'Application en cours',
    'Line deactivation': 'Désactivation de la ligne',
    'Line disconnection': 'Déconnexion de la ligne',
    'Line suspension': 'Suspension de la ligne',
    'SIM deactivation': 'Désactivation de la SIM'
  });

  var REGULATORS = Object.freeze({
    'CA (Communications Authority of Kenya)': 'CA (Autorité des communications du Kenya)',
    'NCC (Nigerian Communications Commission)': 'NCC (Commission nigériane des communications)'
  });

  var TV_NAMES = Object.freeze({
    Access: 'Accès',
    Compact: 'Compact',
    'Compact Plus': 'Compact Plus',
    Confam: 'Confam',
    Family: 'Famille',
    Jinja: 'Jinja',
    Jolli: 'Jolli',
    Lite: 'Essentiel',
    Max: 'Max',
    Mobile: 'Mobile',
    Padi: 'Padi',
    Plus: 'Plus',
    Premium: 'Premium',
    Pro: 'Pro',
    'Pro (Premier League)': 'Pro (Premier League)',
    Smallie: 'Smallie',
    Standard: 'Standard',
    Supa: 'Supa',
    Yanga: 'Yanga'
  });

  var TV_NOTES = Object.freeze({
    '2 devices, HD': '2 appareils, HD',
    'Sports + entertainment': 'Sport et divertissement',
    'Streaming only, 1 device': 'Streaming uniquement, 1 appareil'
  });

  function mapped(map, value) {
    var text = String(value || '');
    return Object.prototype.hasOwnProperty.call(map, text) ? map[text] : text;
  }

  function countryName(code, fallback) {
    return COUNTRY_NAMES[code] || String(fallback || code || '');
  }

  function dataVolume(value) {
    return String(value || '')
      .replace(/\bUnlimited\b/gi, 'Illimité')
      .replace(/(\d+(?:\.\d+)?)\s*GB\b/gi, '$1 Go')
      .replace(/(\d+(?:\.\d+)?)\s*MB\b/gi, '$1 Mo');
  }

  function planName(value) {
    return dataVolume(value)
      .replace(/\b(\d+)-Day\b/gi, '$1 jours')
      .replace(/\bDaily\b/gi, 'quotidien')
      .replace(/\bWeekly\b/gi, 'hebdomadaire')
      .replace(/\bMonthly\b/gi, 'mensuel');
  }

  function validity(value) {
    return String(value || '')
      .replace(/\b1 day\b/gi, '1 jour')
      .replace(/\b2 days\b/gi, '2 jours')
      .replace(/\b7 days\b/gi, '7 jours')
      .replace(/\b30 days\b/gi, '30 jours')
      .replace(/\b24 hrs\b/gi, '24 h');
  }

  function portability(value) {
    return mapped(PORTABILITY, value);
  }

  function sim(value) {
    return mapped(SIM_TEXT, value);
  }

  function regulator(value) {
    return mapped(REGULATORS, value);
  }

  function networkType(value) {
    return String(value || '')
      .replace(/\bMobile Data\b/g, 'Données mobiles')
      .replace(/\bFiber\b/g, 'Fibre');
  }

  function speed(value) {
    return String(value || '')
      .replace(/(\d)\s*-\s*(\d)/g, '$1–$2')
      .replace(/(\d)\s*Mbps\b/g, '$1 Mbit/s');
  }

  function businessName(value) {
    return String(value || '').replace(/\bMobile Data\b/g, 'Données mobiles');
  }

  function tvName(value) {
    return mapped(TV_NAMES, value);
  }

  function tvNote(value) {
    return mapped(TV_NOTES, value);
  }

  return Object.freeze({
    countryNames: COUNTRY_NAMES,
    countryName: countryName,
    dataVolume: dataVolume,
    planName: planName,
    validity: validity,
    portability: portability,
    sim: sim,
    regulator: regulator,
    networkType: networkType,
    speed: speed,
    businessName: businessName,
    tvNames: TV_NAMES,
    tvName: tvName,
    tvNote: tvNote
  });
});
