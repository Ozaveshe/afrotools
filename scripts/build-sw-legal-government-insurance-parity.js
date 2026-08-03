'use strict';

const fs = require('fs');
const path = require('path');
const { localizedGeneratorEquivalent } = require('./lib/localized-generator-equivalence');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://afrotools.com';
const WRITE = process.argv.includes('--write');
const LEGAL_MANIFEST = path.join(ROOT, 'data', 'registry', 'french-mortgage-property.json');
const GOVERNMENT_MANIFEST = path.join(ROOT, 'data', 'government', 'fr-parity-apps.json');
const INSURANCE_MANIFEST = path.join(ROOT, 'data', 'insurance', 'assumption-contract.json');
const SW_LEGAL_OUTPUT = path.join(ROOT, 'data', 'registry', 'swahili-legal-property-gaps.json');
const PARITY_INVENTORY = path.join(ROOT, 'reports', 'swahili-free-app-parity-inventory.json');

const LEGAL = {
  'tenancy-deposit': {
    route: '/sw/zana/amana-ya-upangaji/',
    name: 'Kikokotoo cha amana na gharama za kuhamia',
    description: 'Jumlisha pango la mbele, amana, ada ya wakala, ada ya mkataba na huduma kwa maingizo yako; thibitisha sheria na masharti ya eneo kabla ya kulipa.',
    sourceLabel: 'Jimbo la Lagos — rasilimali rasmi na Tenancy Law',
    clearStaleOnInput: true,
    parserValidPdf: true,
    control: 'Kokotoa gharama za kuhamia',
    initialValues: {
      country: 'ng',
      rent: '500000',
      advanceMonths: '12',
      depositMonths: '1',
      agentFee: '10',
      legalFee: '5',
      serviceCharge: '0'
    },
    testValues: {
      country: 'ng',
      rent: '500000',
      advanceMonths: '12',
      depositMonths: '1',
      agentFee: '10',
      legalFee: '5',
      serviceCharge: '0'
    },
    countryPresets: {
      ng: { rent: '500000', advanceMonths: '12', depositMonths: '1', agentFee: '10', legalFee: '5', serviceCharge: '0' },
      ke: { rent: '50000', advanceMonths: '1', depositMonths: '1', agentFee: '8.33', legalFee: '0', serviceCharge: '0' },
      za: { rent: '12000', advanceMonths: '1', depositMonths: '2', agentFee: '0', legalFee: '0', serviceCharge: '0' },
      gh: { rent: '3000', advanceMonths: '12', depositMonths: '1', agentFee: '10', legalFee: '5', serviceCharge: '0' }
    },
    jurisdictionSources: {
      ng: {
        jurisdiction: 'Nigeria — Jimbo la Lagos',
        availability: 'official-source',
        url: 'https://lagosstate.gov.ng/resources/',
        label: 'Jimbo la Lagos — rasilimali rasmi na Tenancy Law',
        checkedAt: '2026-07-29',
        confidence: 'Chanzo hiki kinahusu Nigeria, Jimbo la Lagos pekee. Hesabu ni thabiti kwa maingizo; thibitisha masharti na sheria ya sasa kabla ya kulipa.'
      },
      ke: {
        jurisdiction: 'Kenya',
        availability: 'planning-default',
        url: '',
        label: 'Kenya — thamani za mwanzo za kupanga; hakuna chanzo rasmi kilichounganishwa',
        checkedAt: '',
        confidence: 'Hizi ni thamani za mwanzo za kupanga, si ada, desturi au sheria rasmi ya Kenya. Thibitisha mwenyewe kwa mamlaka au mtaalamu wa eneo.'
      },
      za: {
        jurisdiction: 'Afrika Kusini',
        availability: 'planning-default',
        url: '',
        label: 'Afrika Kusini — thamani za mwanzo za kupanga; hakuna chanzo rasmi kilichounganishwa',
        checkedAt: '',
        confidence: 'Hizi ni thamani za mwanzo za kupanga, si ada, desturi au sheria rasmi ya Afrika Kusini. Thibitisha mwenyewe kwa mamlaka au mtaalamu wa eneo.'
      },
      gh: {
        jurisdiction: 'Ghana',
        availability: 'planning-default',
        url: '',
        label: 'Ghana — thamani za mwanzo za kupanga; hakuna chanzo rasmi kilichounganishwa',
        checkedAt: '',
        confidence: 'Hizi ni thamani za mwanzo za kupanga, si ada, desturi au sheria rasmi ya Ghana. Thibitisha mwenyewe kwa mamlaka au mtaalamu wa eneo.'
      }
    },
    fieldOverrides: {
      advanceMonths: {
        type: 'select',
        options: [['12', 'Miezi 12'], ['6', 'Miezi 6'], ['3', 'Miezi 3'], ['2', 'Miezi 2'], ['1', 'Mwezi 1']]
      },
      depositMonths: {
        type: 'select',
        options: [['0', 'Hakuna'], ['1', 'Mwezi 1'], ['2', 'Miezi 2'], ['3', 'Miezi 3']]
      },
      agentFee: {
        type: 'select',
        options: [['0', 'Hakuna wakala'], ['5', '5%'], ['10', '10%'], ['15', '15%'], ['8.33', 'Pango la mwezi 1 (8.33%)']]
      },
      legalFee: {
        type: 'select',
        options: [['0', 'Hakuna'], ['5', '5% ya pango la mwaka'], ['10', '10% ya pango la mwaka'], ['flat50000', 'Kiasi maalumu cha eneo']]
      }
    },
    labels: {
      country: 'Nchi',
      rent: 'Pango la mwezi',
      advanceMonths: 'Miezi ya pango la mbele',
      depositMonths: 'Miezi ya amana',
      agentFee: 'Ada ya wakala (%)',
      legalFee: 'Ada ya mkataba au wakili',
      serviceCharge: 'Ada ya huduma kwa mwezi'
    },
    result: {
      avance: 'Pango la mbele',
      depot: 'Amana',
      honorairesAgent: 'Ada ya wakala',
      fraisJuridiques: 'Ada ya mkataba au wakili',
      chargesService: 'Ada ya huduma',
      coutEntree: 'Jumla ya gharama za kuhamia',
      devise: 'Sarafu'
    }
  },
  'rent-affordability': {
    route: '/sw/zana/uwezo-wa-kulipa-pango/',
    name: 'Kikokotoo cha uwezo wa kulipa pango',
    description: 'Linganisha pango uliloingiza na kikomo chako cha bajeti, kisha panga pango la mbele bila kudai kiwango cha lazima au uamuzi wa mwenye nyumba.',
    sourceLabel: 'UN-Habitat — mfumo wa kupima uwezo wa kumudu makazi',
    clearStaleOnInput: true,
    parserValidPdf: true,
    control: 'Kokotoa kwa maingizo yangu',
    initialValues: {
      currency: 'sarafu yako',
      income: '',
      rent: '',
      ratio: '',
      advance: ''
    },
    testValues: {
      currency: 'XOF',
      income: '5000',
      rent: '1200',
      ratio: '30',
      advance: '2'
    },
    fieldOverrides: {
      currency: { required: true },
      income: { min: '0.01', step: 'any', required: true },
      rent: { min: '0', step: 'any', required: true },
      ratio: { min: '0', max: '100', step: 'any', required: true },
      advance: { min: '0', step: 'any', required: true }
    },
    source: {
      url: '',
      label: 'UN-Habitat — kiungo cha chanzo cha nje hakipatikani; uthibitishaji wa mkono unahitajika',
      availability: 'unavailable',
      checkedAt: '2026-08-02',
      confidence: 'Hesabu ni thabiti kwa maingizo yako. Chanzo cha UN-Habitat kilirudisha 403 wakati wa ukaguzi; usichukulie uwiano kama kiwango kilichothibitishwa, cha kisheria, cha benki au cha kila mahali.'
    },
    labels: {
      currency: 'Sarafu',
      income: 'Mapato halisi ya mwezi',
      rent: 'Pango la mwezi',
      ratio: 'Kikomo cha bajeti (%)',
      advance: 'Miezi ya pango la mbele'
    },
    result: {
      loyer: 'Pango uliloingiza',
      plafond: 'Kikomo cha bajeti',
      avance: 'Pango la mbele',
      devise: 'Sarafu'
    }
  },
  'leave-days': {
    route: '/sw/zana/siku-za-likizo-za-kisheria/',
    name: 'Mwongozo wa siku za likizo za kisheria',
    description: 'Chagua nchi na uandae ukaguzi wa haki za likizo bila kudai kiwango, ustahiki au uamuzi rasmi.',
    control: 'Onyesha maeneo ya kuthibitisha',
    labels: { country: 'Nchi' },
    result: { pays: 'Nchi', droitsAnnuels: 'Likizo ya mwaka', congeMaladie: 'Likizo ya ugonjwa', congeMaternite: 'Likizo ya uzazi', joursFeries: 'Sikukuu za umma' }
  },
  'stamp-duty': {
    route: '/sw/zana/kikokotoo-ushuru-wa-stampu/',
    name: 'Kikokotoo cha ushuru wa stampu',
    description: 'Kokotoa makisio kwa thamani, kiwango na ada ulizoingiza; hakuna kiwango cha kisheria kinachopakiwa.',
    control: 'Kokotoa kwa makisio yangu',
    labels: { currency: 'Sarafu', value: 'Thamani ya muamala', rate: 'Kiwango ulichoingiza (%)', fixed: 'Ada isiyobadilika' },
    result: { total: 'Jumla ya makisio', devise: 'Sarafu' }
  },
  'rent-intelligence': {
    route: '/sw/zana/taarifa-za-soko-la-pango/',
    name: 'Kichujio cha taarifa za soko la pango',
    description: 'Chuja rekodi zilizoidhinishwa bila kuunda bei ya pango, upatikanaji au tathmini ya soko.',
    control: 'Chuja rekodi zilizothibitishwa',
    labels: { countryCode: 'Nchi', city: 'Jiji', propertyType: 'Aina ya mali', bedrooms: 'Vyumba vya kulala' },
    result: { pays: 'Nchi', ville: 'Jiji', typeBien: 'Aina ya mali', chambres: 'Vyumba', annoncesVerifiees: 'Rekodi zilizothibitishwa' }
  },
  'lease-risk-check': {
    route: '/sw/zana/ukaguzi-wa-hatari-za-mkataba-wa-pango/',
    name: 'Ukaguzi wa ishara za hatari za upangaji',
    description: 'Chuja ishara zilizoidhinishwa bila kumhukumu mpangaji, mwenye nyumba au mkataba.',
    control: 'Chuja ishara zilizoidhinishwa',
    labels: { countryCode: 'Nchi ya taarifa', city: 'Jiji', minimumRisk: 'Kiwango cha chini cha hatari' },
    result: { pays: 'Nchi', ville: 'Jiji', risqueMinimum: 'Hatari ya chini', signauxPublies: 'Ishara zilizochapishwa', statut: 'Hali' }
  },
  'rental-agreement': {
    route: '/sw/zana/kizalishaji-mkataba-wa-kupangisha/',
    name: 'Kizalishaji cha rasimu ya mkataba wa upangaji',
    description: 'Tengeneza rasimu ya ndani ya upangaji kwa mapitio ya wahusika na mwanasheria; si mkataba uliothibitishwa.',
    control: 'Tengeneza rasimu ya upangaji',
    labels: { currency: 'Sarafu', landlord: 'Jina la mwenye nyumba', tenant: 'Jina la mpangaji', address: 'Anwani ya mali', start: 'Tarehe ya kuanza', duration: 'Muda (miezi)', rent: 'Pango', deposit: 'Amana' },
    result: { bailleur: 'Mwenye nyumba', locataire: 'Mpangaji', dateDebut: 'Tarehe ya kuanza', dureeMois: 'Miezi', loyer: 'Pango', depot: 'Amana' }
  },
  'survey-cost': {
    route: '/sw/zana/gharama-za-upimaji-ardhi/',
    name: 'Kikokotoo cha gharama za upimaji ardhi',
    description: 'Kadiria gharama kwa eneo, bei ya kipimo, ada na akiba ulizoingiza; si quotation ya mpimaji.',
    control: 'Kokotoa makisio yangu',
    labels: { currency: 'Sarafu', quantity: 'Eneo au kiasi', unitCost: 'Gharama kwa kipimo', fixed: 'Ada isiyobadilika', contingency: 'Akiba ya tahadhari (%)' },
    result: { coutTotal: 'Jumla ya makisio', devise: 'Sarafu' }
  },
  'plot-converter': {
    route: '/sw/zana/kigeuzi-cha-eneo-la-kiwanja/',
    name: 'Kigeuzi cha eneo la kiwanja',
    description: 'Geuza mita za mraba, hekta, ekari na futi za mraba kwa hesabu ya ndani.',
    control: 'Geuza eneo',
    labels: { value: 'Thamani', from: 'Kipimo cha mwanzo', to: 'Kipimo cha mwisho' },
    result: { valeurSaisie: 'Thamani uliyoingiza', uniteDepart: 'Kipimo cha mwanzo', valeurConvertie: 'Thamani iliyogeuzwa', uniteArrivee: 'Kipimo cha mwisho' }
  },
  'ng-nhf': {
    route: '/sw/zana/kikokotoo-nhf-nigeria/',
    name: 'Kikokotoo cha NHF Nigeria',
    description: 'Kadiria mchango na mkopo wa NHF kwa viwango vya injini ya Kiingereza, kisha thibitisha kwa FMBN au PML.',
    control: 'Kokotoa mchango na mkopo',
    labels: { basic: 'Mshahara wa msingi kwa mwezi (NGN)', yearsContributed: 'Miaka ya michango', loan: 'Kiasi cha mkopo (NGN)', tenure: 'Muda wa mkopo (miaka)', gross: 'Mshahara ghafi kwa mwezi (NGN)' },
    result: { contributionMensuelleNGN: 'Mchango wa mwezi (NGN)', contributionAnnuelleNGN: 'Mchango wa mwaka (NGN)', totalContribueNGN: 'Michango yote (NGN)', mensualiteNGN: 'Malipo ya mwezi (NGN)', interetsTotauxNGN: 'Riba yote (NGN)', abordable: 'Ndani ya kikomo cha makisio' }
  },
  'ip-rights-africa': {
    route: '/sw/zana/haki-miliki-afrika/',
    name: 'Mpangaji wa haki miliki Afrika',
    description: 'Panga maswali ya alama ya biashara, uvumbuzi, kazi bunifu au siri bila kudai usajili au ulinzi.',
    control: 'Tengeneza mpango wa ukaguzi',
    labels: { assetType: 'Mali bunifu ya kulinda', markets: 'Eneo la ulinzi', publicDisclosure: 'Tayari imewekwa wazi kwa umma' },
    result: { actif: 'Mali', voiePrioritaire: 'Njia ya kipaumbele', portee: 'Eneo', divulgationPublique: 'Imewekwa wazi', urgence: 'Kipaumbele' }
  },
  'inheritance-tax': {
    route: '/sw/zana/kikokotoo-kodi-ya-urithi/',
    name: 'Kikokotoo cha makisio ya urithi',
    description: 'Kadiria kwa injini iliyopo na uelewe kwamba kodi, probate, deni na haki hutegemea mamlaka na kesi.',
    control: 'Kokotoa makisio ya urithi',
    labels: { country: 'Nchi', estateValue: 'Thamani ghafi ya mali', relationship: 'Uhusiano na marehemu', debts: 'Madeni na dhima', funeralExpenses: 'Gharama za mazishi' },
    result: { pays: 'Nchi', successionBrute: 'Mali ghafi', successionNette: 'Mali halisi', lien: 'Uhusiano', droitsEstimes: 'Kodi ya makisio', fraisSuccession: 'Gharama za probate', netApresFrais: 'Salio baada ya gharama' }
  },
  'ip-protection': {
    route: '/sw/zana/mpango-wa-ulinzi-wa-mali-bunifu/',
    name: 'Mpango wa ulinzi wa mali bunifu',
    description: 'Panga utafutaji, ushahidi wa umiliki na njia ya uwasilishaji bila kuahidi uhalali au idhini.',
    control: 'Tengeneza mkakati wa ukaguzi',
    labels: { asset: 'Mali bunifu', exposure: 'Imewekwa wazi kwa umma', markets: 'Masoko yanayolengwa', ownershipDocs: 'Ushahidi wa umiliki upo' },
    result: { actif: 'Mali', marches: 'Masoko', divulgation: 'Imewekwa wazi', preuvesPropriete: 'Ushahidi wa umiliki', actionPrioritaire: 'Hatua ya kipaumbele' }
  }
};

const GOVERNMENT = {
  'national-pension': ['/sw/zana/makisio-ya-pensheni-ya-taifa/', 'Makisio ya pensheni ya taifa', 'Kadiria michango na ukuaji kwa thamani ulizoingiza; si kiwango, faida, umri au ustahiki rasmi.', 'pension'],
  'marriage-cert': ['/sw/zana/cheti-cha-ndoa/', 'Mpangaji wa ukaguzi wa cheti cha ndoa', 'Andaa maswali ya usajili, nakala au marekebisho bila kuamua uhalali wa ndoa au athari zake.', 'planner'],
  'foi-template': ['/sw/zana/rasimu-ya-ombi-la-taarifa/', 'Rasimu ya ombi la kupata taarifa', 'Andika rasimu ya ndani baada ya kuthibitisha sheria, mamlaka, ada, vizuizi na njia ya rufaa.', 'foi'],
  'gov-scholarship': ['/sw/zana/ufadhili-wa-serikali/', 'Mpangaji wa ufadhili wa serikali', 'Andaa ukaguzi wa tangazo la ufadhili bila kudai kufunguliwa, tarehe, kiasi, ustahiki au uchaguzi.', 'planner'],
  'social-welfare': ['/sw/zana/msaada-wa-kijamii/', 'Mpangaji wa msaada wa kijamii', 'Andaa maswali ya mpango wa jamii bila kuamua ustahiki, kiasi, kipaumbele, malipo au idhini.', 'planner'],
  'work-permit-cost': ['/sw/zana/gharama-za-kibali-cha-kazi/', 'Makisio ya gharama za kibali cha kazi', 'Jumlisha ada na gharama ulizothibitisha bila kutabiri idhini, muda, sifa au haki ya kufanya kazi.', 'permit']
};

const INSURANCE = {
  'insurance-fraud-checker': ['/sw/zana/ukaguzi-wa-ishara-za-udanganyifu-wa-bima/', 'Ukaguzi wa ishara za tahadhari za bima', 'Kagua ishara bila kumshutumu mtu au kuamua kwamba udanganyifu umetokea.'],
  'marine-insurance': ['/sw/zana/kikokotoo-bima-ya-bahari/', 'Mpangaji wa bima ya mizigo baharini', 'Kadiria kwa thamani, kiwango na ada ulizoingiza bila kuahidi ulinzi, bei rasmi au malipo ya dai.']
};

const SW_OPTIONS = {
  'Sénégal': 'Senegal', 'Côte d’Ivoire': "Côte d'Ivoire", 'Afrique du Sud': 'Afrika Kusini',
  'Algérie': 'Algeria', 'Oui': 'Ndiyo', 'Non': 'Hapana', 'Conjoint': 'Mwenzi',
  'Enfant': 'Mtoto', 'Autre parent': 'Ndugu mwingine', 'Sans lien de parenté': 'Asiye ndugu',
  'Marque et nom': 'Alama ya biashara na jina', 'Invention': 'Uvumbuzi', 'Œuvre créative': 'Kazi bunifu',
  'Savoir-faire': 'Maarifa ya biashara', 'Un pays': 'Nchi moja', 'Plusieurs pays africains': 'Nchi kadhaa za Afrika',
  'International': 'Kimataifa', 'Marque': 'Alama ya biashara', 'Contenu': 'Maudhui',
  'Secret commercial': 'Siri ya biashara', 'pied carré': 'futi ya mraba',
  'Aucun': 'Hakuna', '5 % du loyer annuel': '5% ya pango la mwaka',
  '10 % du loyer annuel': '10% ya pango la mwaka', 'Forfait local': 'Ada ya kudumu ya eneo'
};
const SW_COPY_OVERRIDES = {
  'kenya-dpa': {
    name: 'Ukaguzi wa sheria ya ulinzi wa data Kenya',
    description: 'Kagua wajibu wa usajili wa ODPC, msingi wa kisheria, haki za watu, afisa wa ulinzi wa data, taarifa ya uvujaji na uhamishaji wa data kuvuka mipaka.'
  }
};
const RECIPROCAL_LOCALE_OWNERS = {
  'tenancy-deposit': ['/fr/tools/caution-locative/'],
  'rent-affordability': ['/fr/tools/capacite-loyer/'],
  'leave-days': ['/fr/tools/calculateur-conges/'],
  'stamp-duty': ['/fr/tools/droits-enregistrement/'],
  'rent-intelligence': ['/fr/tools/intelligence-loyer/'],
  'lease-risk-check': ['/fr/tools/verification-risque-bail/'],
  'rental-agreement': ['/fr/tools/contrat-location/'],
  'survey-cost': ['/fr/tools/cout-geometre/'],
  'plot-converter': ['/fr/tools/convertisseur-parcelle/'],
  'ng-nhf': ['/fr/tools/ng-nhf/', '/ha/kayan-aiki/nhf-najeriya/'],
  'ip-rights-africa': ['/fr/tools/propriete-intellectuelle/'],
  'inheritance-tax': ['/fr/tools/inheritance-tax/'],
  'ip-protection': ['/fr/tools/guide-protection-pi/'],
  'national-pension': ['/fr/tools/national-pension/'],
  'marriage-cert': ['/fr/tools/guide-certificat-mariage/'],
  'foi-template': ['/fr/tools/modele-demande-acces-information/'],
  'gov-scholarship': ['/fr/tools/bourses-gouvernementales/'],
  'social-welfare': ['/fr/tools/eligibilite-aide-sociale/'],
  'work-permit-cost': ['/fr/tools/cout-permis-travail/'],
  'insurance-fraud-checker': ['/fr/tools/signaux-fraude-assurance/'],
  'marine-insurance': ['/fr/tools/assurance-maritime-cargo/']
};

function esc(value) {
  return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function fileForRoute(route) {
  return path.join(ROOT, route.replace(/^\/+|\/+$/g, ''), 'index.html');
}

function legalContracts() {
  const french = JSON.parse(fs.readFileSync(LEGAL_MANIFEST, 'utf8'));
  return Object.entries(LEGAL).map(([id, sw]) => {
    const owner = french.rows.find((row) => row.englishId === id);
    if (!owner) throw new Error(`Missing legal owner contract: ${id}`);
    const fields = owner.fields.map((field) => {
      const override = (sw.fieldOverrides && sw.fieldOverrides[field.name]) || {};
      const localized = {
        ...field,
        ...override,
        label: sw.labels[field.name] || `Sehemu ya ${field.name}`,
        options: (override.options || field.options || []).map((option) => [
          option[0],
          SW_OPTIONS[option[1]] || option[1]
        ])
      };
      if (sw.initialValues && Object.prototype.hasOwnProperty.call(sw.initialValues, field.name)) {
        localized.initialValue = sw.initialValues[field.name];
        localized.testFixtureValue = sw.testValues[field.name];
        delete localized.fixtureValue;
      }
      return localized;
    });
    return {
      ...owner,
      name: sw.name,
      description: sw.description,
      swahiliRoute: sw.route,
      ...(sw.clearStaleOnInput ? { clearStaleOnInput: true } : {}),
      ...(sw.parserValidPdf ? { parserValidPdf: true } : {}),
      ...(sw.countryPresets ? { countryPresets: sw.countryPresets } : {}),
      ...(sw.jurisdictionSources ? { jurisdictionSources: sw.jurisdictionSources } : {}),
      workflowControl: sw.control,
      resultIntro: `${sw.name}: matokeo yametolewa na injini ileile ya mmiliki wa Kiingereza kwa maingizo yaliyo hapa.`,
      fields,
      resultLabels: sw.result,
      source: sw.source || {
        url: owner.source && owner.source.url,
        label: sw.sourceLabel || (owner.source && owner.source.title ? owner.source.title : 'Chanzo rasmi au ukaguzi wa mtaalamu unahitajika'),
        checkedAt: owner.source && owner.source.checkedAt,
        confidence: 'Hesabu ni thabiti kwa maingizo; matumizi halisi lazima yathibitishwe kwa mamlaka au mtaalamu.'
      }
    };
  });
}

function head(app, category, imageId) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: app.name,
    description: app.description,
    url: SITE + app.route,
    inLanguage: 'sw',
    applicationCategory: category,
    operatingSystem: 'Any',
    isAccessibleForFree: true,
    isBasedOn: SITE + app.englishRoute,
    image: `${SITE}/assets/img/tools/${imageId}.webp`,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
  };
  return `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="afrotools-content-id" content="sw-legal-government-insurance:${esc(imageId)}">
  <meta name="afrotools-source-owner" content="${esc(app.sourceOwner || 'scripts/build-sw-legal-government-insurance-parity.js')}">
  <title>${esc(app.name)} | AfroTools</title>
  <meta name="description" content="${esc(app.description)}">
  <link rel="canonical" href="${SITE}${app.route}">
  <link rel="alternate" hreflang="en" href="${SITE}${app.englishRoute}">
  ${app.frenchRoute ? `<link rel="alternate" hreflang="fr" href="${SITE}${app.frenchRoute}">` : ''}${app.additionalAlternates && app.additionalAlternates.length
    ? `\n  ${app.additionalAlternates.map((alternate) => `<link rel="alternate" hreflang="${alternate.lang}" href="${SITE}${alternate.route}">`).join('\n  ')}`
    : ''}
  <link rel="alternate" hreflang="sw" href="${SITE}${app.route}">
  <link rel="alternate" hreflang="x-default" href="${SITE}${app.englishRoute}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="sw_KE">
  <meta property="og:title" content="${esc(app.name)} | AfroTools">
  <meta property="og:description" content="${esc(app.description)}">
  <meta property="og:url" content="${SITE}${app.route}">
  <meta property="og:image" content="${SITE}/assets/img/tools/${imageId}.webp">
  <script type="application/ld+json">${safeJson(schema)}</script>`;
}

function ownedSourcePanel(contract) {
  const source = (contract.jurisdictionSources && contract.jurisdictionSources.ng) || contract.source;
  const availability = source.availability === 'official-source'
    ? 'Chanzo rasmi kimeunganishwa kwa mamlaka hii pekee.'
    : source.availability === 'external-reference'
      ? 'Rejea ya nje imeunganishwa; thibitisha mamlaka, sheria na masharti ya sasa kabla ya kuitumia.'
    : source.availability === 'planning-default'
      ? 'Thamani hizi ni za kupanga tu; hakuna chanzo rasmi kilichounganishwa kwa mamlaka hii.'
      : 'Kiungo cha chanzo cha nje hakipatikani; uthibitishaji wa mkono unahitajika.';
  return `<aside class="mp-card mp-source" data-tool-verification-panel><h2>Chanzo, uhalali na mipaka</h2>
        <p data-source-jurisdiction${source.jurisdiction ? '' : ' hidden'}><strong>Mamlaka iliyochaguliwa:</strong> <span>${esc(source.jurisdiction || '')}</span></p>
        <p><a data-source-link href="${esc(source.url || '#')}" target="_blank" rel="noopener noreferrer"${source.url ? '' : ' hidden'}>${esc(source.label)}</a><span data-source-label${source.url ? ' hidden' : ''}>${esc(source.label)}</span></p>
        <p data-source-availability data-source-state="${esc(source.availability || 'unavailable')}">${esc(availability)}</p>
        <p data-source-checked><strong>Tarehe ya ukaguzi:</strong> <span>${esc(source.checkedAt || 'Haijathibitishwa')}</span></p>
        <p data-source-confidence>${esc(source.confidence)}</p>
        <p><strong>Muhimu:</strong> si ushauri wa kisheria, uwasilishaji rasmi, uthibitisho wa hati, haki, ada, idhini au matokeo.</p></aside>`;
}

function ownedControlContrastCss() {
  return `  <style>
    [data-result][hidden],[data-export-bar][hidden]{display:none!important}
    .mp-page{--sw-mp-control-bg:#ffffff;--sw-mp-control-text:#172033;--sw-mp-control-border:#64748b;--sw-mp-focus:#111827;--sw-mp-primary:#0f766e}
    .mp-page .mp-hero h1{color:var(--mp-text)}
    body.mp-page .mp-card .mp-fields input,body.mp-page .mp-card .mp-fields select{border:2px solid var(--sw-mp-control-border)!important;background:var(--sw-mp-control-bg)!important;color:var(--sw-mp-control-text)!important;-webkit-text-fill-color:var(--sw-mp-control-text)!important;opacity:1!important}
    body.mp-page .mp-card .mp-fields select option{background:var(--sw-mp-control-bg)!important;color:var(--sw-mp-control-text)!important}
    body.mp-page .mp-card .mp-actions button,body.mp-page .mp-card .mp-export-bar button{border:2px solid var(--sw-mp-control-border)!important;background:var(--sw-mp-control-bg)!important;color:var(--sw-mp-control-text)!important;-webkit-text-fill-color:var(--sw-mp-control-text)!important;opacity:1!important}
    body.mp-page .mp-card .mp-actions button[type="submit"],body.mp-page .mp-card .mp-actions button[type="submit"]:hover,body.mp-page .mp-card .mp-actions button[type="submit"]:active{border-color:var(--sw-mp-primary)!important;background:var(--sw-mp-primary)!important;color:#fff!important;-webkit-text-fill-color:#fff!important}
    body.mp-page .mp-card .mp-actions button:focus-visible,body.mp-page .mp-card .mp-export-bar button:focus-visible,body.mp-page .mp-card .mp-fields input:focus-visible,body.mp-page .mp-card .mp-fields select:focus-visible{outline:3px solid var(--sw-mp-focus)!important;outline-offset:3px!important;box-shadow:none!important}
    html[data-theme="dark"] .mp-page,body.theme-dark.mp-page{--sw-mp-control-bg:#111b2d;--sw-mp-control-text:#f8fafc;--sw-mp-control-border:#76869c;--sw-mp-focus:#fde047;--sw-mp-primary:#0f766e}
    @media(prefers-color-scheme:dark){html:not([data-theme="light"]) .mp-page{--sw-mp-control-bg:#111b2d;--sw-mp-control-text:#f8fafc;--sw-mp-control-border:#76869c;--sw-mp-focus:#fde047;--sw-mp-primary:#0f766e}}
  </style>\n`;
}

function legalPage(contract) {
  const sourceOwner = contract.sourceOwner || 'scripts/build-sw-legal-government-insurance-parity.js';
  const categoryHub = contract.categoryHub || '/sw/nyumba-na-ardhi/';
  const categoryLabel = contract.categoryLabel || 'Nyumba na ardhi';
  const app = {
    name: contract.name,
    description: contract.description,
    route: contract.swahiliRoute,
    englishRoute: contract.englishRoute + '/',
    frenchRoute: `${contract.frenchRoute.replace(/\/$/, '')}/`,
    sourceOwner,
    additionalAlternates: [
      ...(contract.additionalAlternates || []),
      ...(contract.englishId === 'ng-nhf' ? [{ lang: 'ha', route: '/ha/kayan-aiki/nhf-najeriya/' }] : [])
    ]
  };
  return `<!doctype html>
<!-- Generated by ${esc(sourceOwner)}. -->
<html lang="sw"><head>
  ${head(app, 'FinanceApplication', contract.englishId)}
  <link rel="stylesheet" href="/assets/css/tokens.min.css">
  <link rel="stylesheet" href="/assets/css/global.min.css">
  <link rel="stylesheet" href="/assets/css/french-mortgage-property.css">
${contract.clearStaleOnInput ? `${ownedControlContrastCss()}  <script src="/assets/js/supabase.min.js"></script>\n` : ''}</head><body${contract.parserValidPdf ? ' class="mp-page"' : ''}>
  <a class="mp-skip" href="#sw-gap-form">Ruka hadi kwenye zana</a>
  <afro-navbar active="legal"></afro-navbar>
  <main class="mp-shell" data-sw-legal-property-app data-english-id="${esc(contract.englishId)}"${contract.contractManifest ? ` data-contract-manifest="${esc(contract.contractManifest)}"` : ''}>
    <nav class="mp-breadcrumb" aria-label="Mfuatano"><a href="/sw/">Mwanzo</a> / <a href="${esc(categoryHub)}">${esc(categoryLabel)}</a> / ${esc(contract.name)}</nav>
    <header class="mp-hero"><div><p class="mp-kicker">Mtiririko asilia wa Kiswahili · hufanya kazi ndani ya kivinjari</p><h1>${esc(contract.name)}</h1><p>${esc(contract.description)}</p></div>
      <figure class="mp-artwork"><img src="/assets/img/tools/${esc(contract.englishId)}.webp" alt="Mchoro wa ${esc(contract.name)}" width="800" height="450"></figure></header>
    <section class="mp-grid"><article class="mp-card"><h2>Kamilisha mtiririko</h2>
      <form id="sw-gap-form" data-workflow-form novalidate><div class="mp-fields" data-fields><p>Inapakia mkataba wa njia…</p></div>
        <div class="mp-actions"><button type="submit" data-workflow-control>Endelea</button><button type="button" data-action="reset">Weka upya</button></div></form>
      <p data-status role="status" aria-live="polite">Inathibitisha mkataba wa njia…</p>
      <section class="mp-result" data-result tabindex="-1" aria-live="polite" hidden></section>
      <div class="mp-export-bar" data-export-bar hidden aria-label="Vipakuliwa vya ndani"><button type="button" data-action="copy">Nakili</button><button type="button" data-action="txt">Pakua TXT</button><button type="button" data-action="json">Pakua JSON</button><button type="button" data-action="import">Fungua JSON</button><input type="file" data-import-json accept="application/json,.json" hidden><button type="button" data-action="pdf">Pakua PDF</button><button type="button" data-action="print">Chapisha</button></div>
      <p class="mp-privacy"><strong>Faragha:</strong> maingizo, hesabu na vipakuliwa vinabaki kwenye kivinjari. Hakuna akaunti, barua pepe, AI wala kutumwa kwa data kunakohitajika.</p></article>
      ${contract.parserValidPdf ? ownedSourcePanel(contract) : `<aside class="mp-card mp-source" data-tool-verification-panel><h2>Chanzo, uhalali na mipaka</h2>
        <p><a href="${esc(contract.source.url || contract.englishRoute)}" target="_blank" rel="noopener noreferrer">${esc(contract.source.label)}</a></p>
        <p><strong>Tarehe ya ukaguzi:</strong> ${esc(contract.source.checkedAt || 'Haijathibitishwa')}</p>
        <p>${esc(contract.source.confidence)}</p>
        <p><strong>Muhimu:</strong> si ushauri wa kisheria, uwasilishaji rasmi, uthibitisho wa hati, haki, ada, idhini au matokeo.</p></aside>`}</section>
  </main><afro-footer></afro-footer>
  <script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
  <script src="/engines/legal-engine.js"></script><script src="/assets/js/engines/property-assumption.js"></script>
  <script src="/assets/js/lib/french-mortgage-property-presentation.js"></script><script src="/assets/js/engines/mortgage-property-english-owner.js"></script>
  <script src="/assets/js/engines/french-mortgage-property.js"></script>${contract.parserValidPdf ? `${contract.sourceOwner === 'scripts/build-sw-legal-remaining-parity.js' ? '<script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>' : ''}<script src="/assets/vendor/pdf-lib/pdf-lib.min.js"></script><script src="/assets/js/lib/swahili-local-pdf.js"></script>` : ''}<script src="/assets/js/pages/sw-legal-property-gap-app.js" defer></script>
  <script src="/assets/js/lib/sw-accessibility.js" defer></script><script src="/assets/js/lazy-analytics.js" defer></script>
</body></html>\n`;
}

function governmentConfig(id, raw) {
  const [route, name, description, mode, frenchRoute] = raw;
  return {
    id, route, name, description, mode, frenchRoute, englishRoute: `/tools/${id}/`, highRisk: true,
    checks: [
      { id: 'authority', label: 'Mamlaka na njia rasmi zimethibitishwa' },
      { id: 'requirements', label: 'Sifa na nyaraka za sasa zimethibitishwa' },
      { id: 'cost', label: 'Ada, muda na njia ya malipo zimethibitishwa' },
      { id: 'result', label: 'Uamuzi, marekebisho na rufaa zimethibitishwa' }
    ]
  };
}

function governmentPage(config) {
  const app = { ...config, englishRoute: config.englishRoute };
  return `<!doctype html>
<!-- Generated by scripts/build-sw-legal-government-insurance-parity.js. -->
<html lang="sw"><head>
  ${head(app, 'GovernmentApplication', config.id)}
  <link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/fr-government-parity.css">
  <style>html,body{max-width:100%;overflow-x:clip}.fg-page *{min-width:0;overflow-wrap:anywhere}.fg-result pre{white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:760px){.fg-grid{grid-template-columns:minmax(0,1fr)}}</style>
</head><body class="fg-page"><a class="fg-skip" href="#sw-government-form">Ruka hadi kwenye zana</a><afro-navbar active="government"></afro-navbar>
  <header class="fg-hero"><div class="fg-wrap"><nav class="fg-breadcrumb"><a href="/sw/">Mwanzo</a> / <a href="/sw/serikali-na-nyaraka/">Serikali na nyaraka</a> / ${esc(config.name)}</nav>
    <p class="fg-kicker">Zana huru · si huduma rasmi ya serikali</p><h1>${esc(config.name)}</h1><p class="fg-lead">${esc(config.description)}</p></div></header>
  <main class="fg-main" data-sw-government-app><div class="fg-wrap fg-grid">
    <section class="fg-panel"><h2>Andaa ukaguzi wako</h2><form id="sw-government-form" novalidate><div class="fg-fields" data-fields></div>
      <div class="fg-actions"><button class="fg-button" type="submit">Tengeneza risiti</button><button class="fg-button secondary" type="reset" data-action="reset">Weka upya</button></div></form>
      <p><strong>Faragha:</strong> usiweke majina, namba za utambulisho au taarifa nyeti. Maingizo hayahifadhiwi wala kutumwa. AI haitumiki.</p><p data-status role="status" aria-live="polite"></p></section>
    <aside class="fg-panel" data-tool-verification-panel><h2>Chanzo, upya na uhakika</h2><div class="fg-source-card" data-source-card data-source-state="unavailable"><a data-source-link href="#" target="_blank" rel="noopener" hidden>Fungua chanzo rasmi</a><p data-source-meta>Inapakia rejista ya vyanzo…</p></div><p>Chanzo kilichopatikana hakithibitishi ada, sifa, muda, uamuzi au matokeo.</p></aside>
    <section class="fg-panel fg-result" data-result-panel><h2>Risiti ya ndani</h2><pre data-result tabindex="-1" aria-live="polite" hidden></pre><div class="fg-actions" data-export-bar hidden><button class="fg-button secondary" type="button" data-export="json">Pakua JSON</button><button class="fg-button secondary" type="button" data-export="txt">Pakua TXT</button></div><label>Fungua tena risiti ya JSON<input data-import type="file" accept="application/json,.json"></label></section>
  </div></main><afro-footer></afro-footer>
  <script id="sw-government-config" type="application/json">${safeJson(config)}</script>
  <script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
  <script src="/assets/js/engines/government-parity-engine.js"></script><script src="/assets/js/pages/sw-government-gap-app.js" defer></script>
  <script src="/assets/js/lib/sw-accessibility.js" defer></script><script src="/assets/js/lazy-analytics.js" defer></script>
</body></html>\n`;
}

function insurancePage(id, raw, owner) {
  const [route, name, description] = raw;
  const mode = owner.mode;
  const currency = '<label>Sarafu<input name="currency" value="USD" required></label>';
  const forms = {
    warning: '<fieldset><legend>Ishara za kukagua</legend><label><input type="checkbox" name="signal1"> Leseni au utambulisho hauwezi kuthibitishwa</label><label><input type="checkbox" name="signal2"> Malipo yanaombwa kwenye njia isiyo rasmi</label><label><input type="checkbox" name="signal3"> Nyaraka zina taarifa zinazokinzana</label></fieldset>',
    need: currency + '<label>Mapato ya mwaka yanayohitaji kulindwa<input name="annual" type="number" value="12000" min="0" required></label><label>Miaka ya kupanga<input name="years" type="number" value="10" min="1" required></label><label>Madeni<input name="debts" type="number" value="1000" min="0" required></label><label>Gharama za elimu<input name="education" type="number" value="1000" min="0" required></label><label>Mahitaji mengine<input name="other" type="number" value="0" min="0" required></label><label>Rasilimali zilizopo<input name="available" type="number" value="5000" min="0" required></label>',
    compare: currency + '<fieldset><legend>Mpango A</legend><label>Malipo ya mwaka<input name="aPremium" type="number" value="500" min="0" required></label><label>Kiasi cha kujilipia<input name="aExcess" type="number" value="100" min="0" required></label><label>Kikomo cha mwaka<input name="aLimit" type="number" value="10000" min="1" required></label></fieldset><fieldset><legend>Mpango B</legend><label>Malipo ya mwaka<input name="bPremium" type="number" value="450" min="0" required></label><label>Kiasi cha kujilipia<input name="bExcess" type="number" value="200" min="0" required></label><label>Kikomo cha mwaka<input name="bLimit" type="number" value="12000" min="1" required></label></fieldset>',
    contribution: currency + '<label>Msingi wa mchango kwa kipindi<input name="base" type="number" value="1000" min="0" required></label><label>Kiwango cha mfanyakazi (%)<input name="employee" type="number" value="2" min="0" max="100" required></label><label>Kiwango cha mwajiri (%)<input name="employer" type="number" value="3" min="0" max="100" required></label><label>Idadi ya vipindi<input name="months" type="number" value="12" min="1" required></label>',
    claim: '<label>Tarehe ya tukio<input name="incident" type="date" value="2026-07-01" required></label><label>Tarehe ya taarifa iliyopangwa<input name="planned" type="date" value="2026-07-03" required></label><label>Muda wa taarifa uliothibitisha kwenye mkataba (siku)<input name="windowDays" type="number" value="7" min="1" required></label>'
  };
  const form = forms[mode] || currency + '<label>Thamani au mzigo unaolindwa<input name="exposure" type="number" value="10000" min="0" required></label><label>Kiwango ulichoingiza (%)<input name="rate" type="number" value="2" min="0" max="100" required></label><label>Ada isiyobadilika<input name="fixed" type="number" value="50" min="0" required></label><label>Akiba ya tahadhari (%)<input name="contingency" type="number" value="10" min="0" max="100" required></label>';
  const app = { name, description, route, englishRoute: owner.englishRoute, frenchRoute: owner.frenchRoute };
  return `<!doctype html>
<!-- Generated by scripts/build-sw-legal-government-insurance-parity.js. -->
<html lang="sw"><head>${head(app, 'FinanceApplication', id)}
  <link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/insurance-assumption-workflow.css">
  <style>html,body{max-width:100%;overflow-x:clip}.insurance-workflow,.insurance-workflow *{min-width:0;overflow-wrap:anywhere}</style>
</head><body><afro-navbar active="insurance"></afro-navbar><main class="insurance-workflow" data-insurance-workflow data-locale="sw" data-app-id="${esc(id)}" data-mode="${esc(mode)}" data-currency="USD" data-source-date="2026-03-29">
  <nav><a href="/sw/">Mwanzo</a> / <a href="/sw/bima/">Bima</a> / ${esc(name)}</nav><header><h1>${esc(name)}</h1><p>${esc(description)}</p></header>
  <section class="insurance-workflow__panel"><h2>Karatasi ya makisio</h2><form novalidate>${form}<div class="insurance-workflow__actions"><button type="submit">Kokotoa</button><button type="button" data-action="reset">Weka upya</button></div></form><output data-result tabindex="-1" role="status" aria-live="polite"></output>
    <div class="insurance-workflow__actions insurance-workflow__exports"><button type="button" data-export="copy" disabled>Nakili</button><button type="button" data-export="json" disabled>Pakua JSON</button><button type="button" data-export="pdf" disabled>Chapisha / hifadhi PDF</button></div><p data-export-status role="status" aria-live="polite"></p>
    <p><strong>Faragha:</strong> maingizo na vipakuliwa vinabaki kwenye kivinjari. Hakuna akaunti, barua pepe au AI inayohitajika.</p></section>
  <section class="insurance-workflow__source" data-tool-verification-panel><h2>Chanzo, upya na uhakika</h2><p><strong>Tarehe ya msingi:</strong> 29 Machi 2026. <span data-source-age></span></p><p>Rejista ya AfroTools ya vyanzo vya bima haiwezi kuthibitisha premium, mtoa huduma, ulinzi, sifa au dai. Thibitisha kwa mdhibiti na kampuni yenye leseni.</p></section>
  <p><strong>Mipaka:</strong> zana hii haitoi bei rasmi, mkataba, ulinzi, uamuzi wa dai, hitimisho la udanganyifu au ushauri rasmi.</p>
  </main><afro-footer></afro-footer><script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script><script src="/assets/js/pages/insurance-assumption-workflow.js" defer></script><script src="/assets/js/lib/sw-accessibility.js" defer></script><script src="/assets/js/lazy-analytics.js" defer></script>
</body></html>\n`;
}

function registryRows(allApps) {
  return allApps.map((app) => `  { id: '${app.id}-sw-parity', name: '${app.name.replace(/'/g, "\\'")}', icon: 'SW', desc: '${app.description.replace(/'/g, "\\'")}', href: '${app.route}', category: '${app.category}', tier: 'T2', status: 'live', phase: 'LIVE', countries: ['ALL'], revenue: 'Free', estTraffic: 0, estRevenue: 0, priority: 72, lang: 'sw', sourceId: '${app.id}', imageId: '${app.id}' },`).join('\n');
}

function scopedInventoryRows() {
  const inventory = JSON.parse(fs.readFileSync(PARITY_INVENTORY, 'utf8'));
  const rows = inventory.rows.filter((row) => ['legal', 'government', 'insurance'].includes(row.categoryKey));
  if (rows.length !== 97) throw new Error(`Expected 97 scoped parity rows, found ${rows.length}`);
  return rows;
}

function routePattern(route) {
  const withoutSlash = route.replace(/\/$/, '');
  return new RegExp(`href:\\s*['"]${withoutSlash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/?['"]`);
}

function pageIdentity(row) {
  const html = fs.readFileSync(path.join(ROOT, row.primarySwahiliFile), 'utf8');
  const title = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [null, row.englishName])[1]
    .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const description = (html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) || [null, row.englishName])[1];
  return {
    id: row.englishId,
    route: `${row.primarySwahiliRoute.replace(/\/$/, '')}/`,
    name: title,
    description,
    category: row.categoryKey
  };
}

function updateRegistry(generatedApps, allRows) {
  const file = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');
  let text = fs.readFileSync(file, 'utf8');
  const start = '  // SW LEGAL GOVERNMENT INSURANCE PARITY START';
  const end = '  // SW LEGAL GOVERNMENT INSURANCE PARITY END';
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}\\n?`);
  text = text.replace(pattern, '');

  const ownershipOnly = [];
  for (const row of allRows) {
    const routeRegex = routePattern(row.primarySwahiliRoute);
    const lines = text.split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => routeRegex.test(line) && /lang:\s*['"]sw['"]/.test(line));
    if (lineIndex === -1) {
      ownershipOnly.push(pageIdentity(row));
      continue;
    }
    if (!new RegExp(`sourceId:\\s*['"]${row.englishId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`).test(lines[lineIndex])) {
      lines[lineIndex] = lines[lineIndex].replace(/\s*},\s*$/, `, sourceId: '${row.englishId}' },`);
      text = lines.join('\n');
    }
  }

  const block = `${start}\n${registryRows(ownershipOnly)}\n${end}\n`;
  text = text.replace(/\n\];/, `\n${block}];`);
  return [file, text];
}

function normalizeScopedPage(row) {
  const file = path.join(ROOT, row.primarySwahiliFile);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/"inLanguage"\s*:\s*"https:\/\/afrotools\.com\/sw\/"/g, '"inLanguage":"sw"');
  if (!/"inLanguage"\s*:\s*"sw"/.test(html)) {
    html = html.replace(/"applicationCategory"\s*:/, '"inLanguage":"sw","applicationCategory":');
  }
  if (!/"inLanguage"\s*:\s*"sw"/.test(html)) {
    html = html.replace(
      /(<script\s+type="application\/ld\+json">)(\{[\s\S]*?\})(<\/script>)/i,
      (match, open, payload, close) => {
        const schema = JSON.parse(payload);
        schema.inLanguage = 'sw';
        return `${open}${safeJson(schema)}${close}`;
      }
    );
  }
  return [file, html];
}

function addReciprocalAlternate(app) {
  const file = fileForRoute(app.englishRoute);
  let html = fs.readFileSync(file, 'utf8');
  const tag = `<link rel="alternate" hreflang="sw" href="${SITE}${app.route}">`;
  if (!html.includes(tag)) {
    const marker = /<link rel="alternate" hreflang="x-default"[^>]*>/;
    html = marker.test(html) ? html.replace(marker, `${tag}\n$&`) : html.replace('</head>', `${tag}\n</head>`);
  }
  return [file, html];
}

function addScopedLocaleReciprocal(app, ownerRoute) {
  const file = fileForRoute(ownerRoute);
  let html = fs.readFileSync(file, 'utf8');
  const tag = `<link rel="alternate" hreflang="sw" href="${SITE}${app.route}">`;
  if (!html.includes(tag)) {
    const marker = /<link rel="alternate" hreflang="x-default"[^>]*>/;
    html = marker.test(html) ? html.replace(marker, `${tag}\n$&`) : html.replace('</head>', `${tag}\n</head>`);
  }
  return [file, html];
}

function checkOrWrite(outputs) {
  const drift = [];
  for (const [file, content] of outputs) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (current !== null && localizedGeneratorEquivalent(current, content)) continue;
    drift.push(path.relative(ROOT, file).replace(/\\/g, '/'));
    if (WRITE) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content, 'utf8');
    }
  }
  if (!WRITE && drift.length) {
    throw new Error(`Swahili parity generated output drift:\n${drift.join('\n')}`);
  }
  return drift;
}

function main() {
  const allRows = scopedInventoryRows();
  const scopedById = new Map(allRows.map((row) => [row.englishId, row]));
  const legalRows = legalContracts();
  const governmentSource = JSON.parse(fs.readFileSync(GOVERNMENT_MANIFEST, 'utf8')).apps;
  const govRows = governmentSource.map((owner) => {
    const row = scopedById.get(owner.id);
    if (!row) throw new Error(`Missing scoped government row: ${owner.id}`);
    const identity = pageIdentity(row);
    const copy = SW_COPY_OVERRIDES[owner.id] || identity;
    return governmentConfig(owner.id, [
      identity.route,
      copy.name,
      copy.description,
      owner.mode === 'election' ? 'planner' : owner.mode,
      owner.route
    ]);
  });
  const insuranceSource = JSON.parse(fs.readFileSync(INSURANCE_MANIFEST, 'utf8')).apps;
  const insuranceRows = insuranceSource.map((owner) => {
    const row = scopedById.get(owner.id);
    if (!row) throw new Error(`Missing scoped insurance row: ${owner.id}`);
    const identity = pageIdentity(row);
    return { id: owner.id, route: identity.route, name: identity.name, description: identity.description, englishRoute: owner.englishRoute, owner };
  });
  const outputs = [
    [SW_LEGAL_OUTPUT, JSON.stringify({ schemaVersion: 1, owner: 'scripts/build-sw-legal-government-insurance-parity.js', count: legalRows.length, rows: legalRows }, null, 2) + '\n'],
    ...legalRows.map((row) => [fileForRoute(row.swahiliRoute), legalPage(row)]),
    ...govRows.map((row) => [fileForRoute(row.route), governmentPage(row)]),
    ...insuranceRows.map((row) => [fileForRoute(row.route), insurancePage(row.id, [row.route, row.name, row.description], row.owner)])
  ];
  const registryApps = [
    ...legalRows.map((row) => ({ id: row.englishId, route: row.swahiliRoute, name: row.name, description: row.description, category: 'legal', englishRoute: row.englishRoute + '/' })),
    ...govRows.map((row) => ({ ...row, category: 'government' })),
    ...insuranceRows.map((row) => ({ ...row, category: 'insurance' }))
  ];
  outputs.push(updateRegistry(registryApps, allRows));
  for (const row of allRows) {
    if (!registryApps.some((app) => app.id === row.englishId)) outputs.push(normalizeScopedPage(row));
  }
  for (const app of registryApps) outputs.push(addReciprocalAlternate(app));
  for (const app of registryApps) {
    for (const ownerRoute of RECIPROCAL_LOCALE_OWNERS[app.id] || []) {
      outputs.push(addScopedLocaleReciprocal(app, ownerRoute));
    }
  }
  const drift = checkOrWrite(outputs);
  process.stdout.write(`${WRITE ? 'Built' : 'Checked'} Swahili Legal/Government/Insurance maintained owners: ${legalRows.length + govRows.length + insuranceRows.length}/44; ${drift.length} changed outputs.\n`);
}

if (require.main === module) main();

module.exports = {
  LEGAL,
  GOVERNMENT,
  INSURANCE,
  RECIPROCAL_LOCALE_OWNERS,
  legalContracts,
  governmentConfig,
  legalPage,
  checkOrWrite,
  fileForRoute
};
