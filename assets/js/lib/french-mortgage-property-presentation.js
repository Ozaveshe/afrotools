(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.FrenchMortgagePropertyPresentation = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var COMMON = Object.freeze({
    yes: 'Oui',
    no: 'Non',
    NG: 'Nigeria',
    SN: 'Sénégal',
    CI: 'Côte d’Ivoire',
    ZA: 'Afrique du Sud',
    KE: 'Kenya'
  });

  var ROUTES = Object.freeze({
    'cac-cost': {
      entityType: {
        bn: 'Nom commercial',
        llc: 'Société à responsabilité limitée',
        llp: 'Société de personnes à responsabilité limitée',
        ngo: 'Organisation à but non lucratif',
        plc: 'Société anonyme'
      },
      useAgent: { self: 'Dépôt direct', agent: 'Agent ou avocat accrédité' },
      express: COMMON
    },
    'cipc-cost': {
      entityType: {
        pty: 'Société privée (Pty Ltd)',
        inc: 'Société à responsabilité personnelle',
        npc: 'Société à but non lucratif (NPC)',
        coop: 'Coopérative',
        ext: 'Société étrangère'
      },
      method: { online: 'En ligne', manual: 'Manuel' },
      processingTime: { '1-3 days': '1 à 3 jours', '7-21 days': '7 à 21 jours' }
    },
    'data-compliance': {
      jurisdiction: {
        NDPA: 'Loi nigériane NDPA',
        POPIA: 'Loi sud-africaine POPIA',
        other: 'Autre cadre africain'
      }
    },
    'tenancy-deposit': {
      country: { ng: 'Nigeria', ke: 'Kenya', za: 'Afrique du Sud', gh: 'Ghana' },
      legalFee: { none: 'Aucun', 'annual-five': '5 % du loyer annuel', 'annual-ten': '10 % du loyer annuel', flat50000: 'Forfait local' }
    },
    'lease-risk-check': {
      countryCode: { DZ: 'Algérie', NG: 'Nigeria' }
    },
    'property-tax': {
      country: COMMON,
      city: { lagos: 'Lagos', dakar: 'Dakar', abidjan: 'Abidjan', johannesburg: 'Johannesburg' },
      use: { residential: 'Résidentiel', rental: 'Location', commercial: 'Commercial', industrial: 'Industriel' }
    },
    'visa-cost': {
      visaType: {
        evisa: 'Visa électronique',
        tourism: 'Tourisme',
        business: 'Affaires',
        transit: 'Transit'
      }
    },
    'rent-intelligence': {
      countryCode: { DZ: 'Algérie', NG: 'Nigeria' }
    },
    'plot-converter': {
      from: {
        sqm: 'm²',
        hectare: 'hectare',
        acre: 'acre',
        sqft: 'pied carré'
      },
      to: {
        sqm: 'm²',
        hectare: 'hectare',
        acre: 'acre',
        sqft: 'pied carré'
      }
    },
    'cac-checker': {
      entityType: {
        'business-name': 'Nom commercial',
        limited: 'Société à responsabilité limitée',
        ngo: 'Organisation à but non lucratif'
      },
      regulatedWord: COMMON
    },
    'ip-rights-africa': {
      assetType: {
        brand: 'Marque et nom',
        invention: 'Invention',
        work: 'Œuvre créative',
        knowhow: 'Savoir-faire'
      },
      markets: {
        national: 'Un pays',
        regional: 'Plusieurs pays africains',
        global: 'International'
      },
      publicDisclosure: COMMON
    },
    'business-registration': {
      country: COMMON,
      entityType: {
        sole: 'Entreprise individuelle',
        limited: 'Société à responsabilité limitée',
        ngo: 'Organisation à but non lucratif'
      },
      employees: COMMON
    },
    'company-type-selector': {
      limitedLiability: COMMON,
      outsideInvestment: COMMON
    },
    'child-support': {
      country: COMMON,
      custody: {
        sole: 'Garde principale',
        joint: 'Garde conjointe',
        shared: 'Garde alternée'
      },
      special: {
        none: 'Aucun',
        medical: 'Besoins médicaux',
        educational: 'Besoins éducatifs'
      }
    },
    'court-fees': {
      country: COMMON,
      courtLevel: {
        magistrate: 'Tribunal de première instance',
        high: 'Haute cour',
        appeal: 'Cour d’appel'
      },
      claimType: {
        debt: 'Dette',
        contract: 'Contrat',
        injury: 'Préjudice corporel',
        property: 'Bien',
        family: 'Famille',
        other: 'Autre'
      }
    },
    'divorce-settlement': {
      country: COMMON,
      custodian: { A: 'Partie A', B: 'Partie B', shared: 'Garde partagée' }
    },
    'annual-returns': {
      country: COMMON,
      recordsReady: COMMON,
      filingStatus: {
        pending: 'À préparer',
        filed: 'Déposé',
        late: 'En retard'
      }
    },
    'bail-calculator': {
      country: COMMON,
      offenceCategory: {
        minor: 'Mineure',
        moderate: 'Intermédiaire',
        serious: 'Grave'
      },
      priorRecord: COMMON,
      flightRisk: COMMON
    },
    'business-license': {
      country: COMMON,
      activity: {
        retail: 'Commerce de détail',
        trade: 'Commerce',
        services: 'Services',
        regulated: 'Activité réglementée'
      },
      premises: COMMON
    },
    'cookie-consent': {
      analytics: COMMON,
      marketing: COMMON
    },
    'foreign-company-reg': {
      country: COMMON,
      presence: {
        branch: 'Succursale',
        subsidiary: 'Filiale locale',
        representative: 'Bureau de représentation'
      },
      localHiring: COMMON
    },
    'gdpr-vs-africa': {
      africanLaw: {
        NDPA: 'Loi nigériane NDPA',
        POPIA: 'Loi sud-africaine POPIA',
        DPAKE: 'Loi kényane sur la protection des données'
      },
      topic: {
        breach: 'Notification de violation',
        rights: 'Droits des personnes',
        transfer: 'Transferts internationaux'
      },
      euResidents: COMMON
    },
    'inheritance-tax': {
      country: COMMON,
      relationship: {
        spouse: 'Conjoint',
        child: 'Enfant',
        other: 'Autre parent',
        nonrelative: 'Sans lien de parenté'
      }
    },
    'ip-protection': {
      asset: {
        brand: 'Marque',
        invention: 'Invention',
        content: 'Contenu',
        secret: 'Secret commercial'
      },
      exposure: COMMON,
      ownershipDocs: COMMON
    },
    'legal-aid': {
      country: COMMON,
      matter: {
        criminal: 'Pénale',
        family: 'Familiale',
        land: 'Foncière',
        employment: 'Emploi',
        civil: 'Civile',
        other: 'Autre'
      }
    },
    'statutory-declaration': {
      purpose: {
        'name-change': 'Changement de nom',
        'lost-document': 'Document perdu',
        address: 'Confirmation d’adresse'
      }
    },
    'tin-guide': {
      country: COMMON,
      applicantType: {
        individual: 'Particulier',
        business: 'Entreprise',
        nonresident: 'Non-résident'
      },
      registeredBusiness: COMMON,
      onlinePreferred: COMMON
    },
    'trademark-registration': {
      country: COMMON,
      routeType: {
        national: 'Voie nationale',
        OAPI: 'OAPI',
        ARIPO: 'ARIPO'
      },
      priorSearch: COMMON
    },
    'winding-up': {
      country: COMMON,
      routeType: {
        voluntary: 'Dissolution volontaire',
        creditors: 'Liquidation par les créanciers',
        strikeoff: 'Radiation administrative'
      },
      solvent: COMMON,
      taxClearance: COMMON
    }
  });

  var RESULT_FIELD_SOURCES = Object.freeze({
    'cac-cost': { formeCAC: 'entityType' },
    'cipc-cost': { formeCIPC: 'entityType', delai: 'processingTime' },
    'data-compliance': { cadre: 'jurisdiction' },
    'visa-cost': { typeVoyage: 'visaType' },
    'rent-intelligence': { etatBien: 'condition' },
    'plot-converter': { uniteDepart: 'from', uniteArrivee: 'to' },
    'cac-checker': { forme: 'entityType' },
    'ip-rights-africa': { actif: 'assetType', portee: 'markets' },
    'business-registration': { forme: 'entityType' },
    'child-support': { pays: 'country', garde: 'custody' },
    'court-fees': { pays: 'country', niveauJuridiction: 'courtLevel', typeDemande: 'claimType' },
    'divorce-settlement': { pays: 'country' },
    'annual-returns': { etatDepot: 'filingStatus' },
    'bail-calculator': { categorieInfraction: 'offenceCategory' },
    'business-license': { activite: 'activity' },
    'foreign-company-reg': { presence: 'presence' },
    'gdpr-vs-africa': { loiAfricaine: 'africanLaw', sujet: 'topic' },
    'inheritance-tax': { pays: 'country', lien: 'relationship' },
    'ip-protection': { actif: 'asset' },
    'legal-aid': { pays: 'country', typeAffaire: 'matter' },
    'statutory-declaration': { objet: 'purpose' },
    'tin-guide': { demandeur: 'applicantType' },
    'trademark-registration': { voieDepot: 'routeType' },
    'winding-up': { voie: 'routeType' }
  });

  function text(value) {
    return value === null || value === undefined ? '' : String(value);
  }

  function routeFields(englishId) {
    return ROUTES[englishId] || {};
  }

  function fieldMap(englishId, fieldName) {
    return routeFields(englishId)[fieldName] || {};
  }

  function label(englishId, fieldName, rawValue, fallback) {
    var value = text(rawValue);
    var labels = fieldMap(englishId, fieldName);
    return Object.prototype.hasOwnProperty.call(labels, value)
      ? labels[value]
      : (Object.prototype.hasOwnProperty.call(COMMON, value) ? COMMON[value] : text(fallback || value));
  }

  function presentFields(englishId, fields) {
    return (fields || []).map(function (field) {
      var copy = Object.assign({}, field);
      if (Array.isArray(field.options)) {
        copy.options = field.options.map(function (option) {
          return [option[0], label(englishId, field.name, option[0], option[1])];
        });
      }
      return copy;
    });
  }

  function routePairs(englishId) {
    var pairs = [];
    Object.keys(routeFields(englishId)).forEach(function (fieldName) {
      var labels = fieldMap(englishId, fieldName);
      Object.keys(labels).forEach(function (rawValue) {
        if (labels[rawValue] !== rawValue) pairs.push([rawValue, labels[rawValue]]);
      });
    });
    return pairs.sort(function (left, right) { return right[0].length - left[0].length; });
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function presentText(englishId, value) {
    var output = text(value);
    routePairs(englishId).forEach(function (pair) {
      if (output.indexOf(pair[1]) !== -1) return;
      var expression = new RegExp('(^|[^A-Za-z0-9-])(' + escapeRegExp(pair[0]) + ')(?=$|[^A-Za-z0-9-])', 'g');
      output = output.replace(expression, function (_, prefix) { return prefix + pair[1]; });
    });
    return output;
  }

  function findRouteLabel(englishId, rawValue) {
    var found = null;
    Object.keys(routeFields(englishId)).some(function (fieldName) {
      var labels = fieldMap(englishId, fieldName);
      if (!Object.prototype.hasOwnProperty.call(labels, rawValue)) return false;
      found = labels[rawValue];
      return true;
    });
    return found;
  }

  function presentValue(englishId, fieldName, value) {
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (Array.isArray(value)) {
      return value.map(function (item) { return presentValue(englishId, fieldName, item); });
    }
    if (typeof value !== 'string') return value;
    var sourceField = (RESULT_FIELD_SOURCES[englishId] || {})[fieldName] || fieldName;
    var contextualLabels = fieldMap(englishId, sourceField);
    if (Object.prototype.hasOwnProperty.call(contextualLabels, value)) {
      return contextualLabels[value];
    }
    var routeLabel = findRouteLabel(englishId, value);
    return routeLabel || presentText(englishId, value);
  }

  function presentInputs(englishId, fields, values) {
    var output = {};
    (fields || []).forEach(function (field) {
      var value = values ? values[field.name] : undefined;
      output[field.name] = field.type === 'select'
        ? label(englishId, field.name, value, value)
        : (typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : value);
    });
    return output;
  }

  function presentResult(englishId, result) {
    if (!result || !result.ok) return result;
    var output = Object.assign({}, result, {
      summary: presentText(englishId, result.summary),
      resultFields: {}
    });
    Object.keys(result.resultFields || {}).forEach(function (fieldName) {
      output.resultFields[fieldName] = presentValue(englishId, fieldName, result.resultFields[fieldName]);
    });
    return output;
  }

  function residualTokens(englishId, value) {
    var source = text(value);
    return routePairs(englishId).filter(function (pair) {
      if (source.indexOf(pair[1]) !== -1) return false;
      return new RegExp('(^|[^A-Za-z0-9-])' + escapeRegExp(pair[0]) + '(?=$|[^A-Za-z0-9-])').test(source);
    }).map(function (pair) { return pair[0]; });
  }

  return Object.freeze({
    label: label,
    presentFields: presentFields,
    presentInputs: presentInputs,
    presentResult: presentResult,
    presentText: presentText,
    presentValue: presentValue,
    residualTokens: residualTokens
  });
}));
