'use strict';

const fs = require('fs');
const path = require('path');
const { legalPage, fileForRoute } = require('./build-sw-legal-government-insurance-parity');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const OWNER = 'scripts/build-sw-legal-remaining-parity.js';
const INVENTORY = require('../reports/swahili-free-app-parity-inventory.json');
const ENGLISH_CONTRACTS = require('../data/registry/french-mortgage-property.json').rows;
const COPY_PATH = path.join(ROOT, 'data/localization/sw-legal-remaining-copy.json');
const CONTRACT_PATH = path.join(ROOT, 'data/registry/swahili-legal-remaining-parity.json');
const HUB_PATH = path.join(ROOT, 'sw/biashara-na-uzingatiaji/index.html');

const LEGAL_IDS = [
  'cac-cost', 'cipc-cost', 'data-compliance', 'contract-gen', 'visa-cost',
  'property-tax', 'rental-yield', 'land-title-check', 'property-valuation',
  'tenant-screening', 'property-mgmt-fees', 'dev-feasibility', 'property-cgt',
  'service-charge', 'short-let-calc', 'agent-commission', 'building-permit',
  'diaspora-property', 'offplan-vs-ready', 'tenancy-agreement',
  'employment-contract', 'cac-checker', 'business-registration',
  'company-type-selector', 'nda-generator', 'privacy-policy-gen',
  'will-generator', 'ndpa-checker', 'popia-checker', 'child-support',
  'court-fees', 'affidavit-generator', 'annual-returns', 'bail-calculator',
  'board-resolution', 'breach-notification', 'business-license',
  'cookie-consent', 'divorce-settlement', 'dpa-generator', 'dpia-tool',
  'foreign-company-reg', 'gdpr-vs-africa', 'legal-aid',
  'partnership-agreement', 'power-of-attorney', 'shareholder-agreement',
  'statutory-declaration', 'tin-guide', 'trademark-registration', 'winding-up'
];

const ADDITIONAL_ALTERNATES = {
  'business-registration': [{ lang: 'yo', route: '/yo/awon-ise/forukosile-owo-ise/' }],
  'tin-guide': [{ lang: 'yo', route: '/yo/awon-ise/tin-naijiria/' }]
};

const FIELD_LABELS = {
  accountability: 'Uwajibikaji umeandikwa', activity: 'Shughuli ya biashara', addAnnualReturns: 'Ongeza marejesho ya mwaka', addScuml: 'Ongeza usajili wa SCUML', addStatusReport: 'Ongeza ripoti ya hali ya kampuni', addTin: 'Ongeza TIN baada ya usajili', adjustment: 'Marekebisho (%)', affected: 'Idadi ya watu wanaoweza kuathirika', africanLaw: 'Sheria ya Afrika ya kulinganisha', agent: 'Mwakilishi', analytics: 'Vidakuzi vya uchanganuzi', annexure: 'Kiambatisho', anniversaryDate: 'Tarehe ya kumbukumbu ya usajili', annual: 'Gharama ya mwaka', annualTurnover: 'Mauzo yanayotarajiwa kwa mwaka', applicantType: 'Aina ya mwombaji', area: 'Eneo', asset: 'Mali', basis: 'Gharama ya msingi', bbbee: 'Ongeza kiapo cha B-BBEE', beneficiary: 'Mnufaika', breach72h: 'Mpango wa taarifa ya uvujaji kwa wakati', breachPlan: 'Mpango wa kujibu uvujaji umejaribiwa', budget: 'Bajeti', build: 'Gharama ya ujenzi', business: 'Shughuli ya ubia', carrying: 'Gharama za kubeba mradi', chair: 'Mwenyekiti', check1: 'Ukaguzi wa kwanza umethibitishwa', check2: 'Ukaguzi wa pili umethibitishwa', check3: 'Ukaguzi wa tatu umethibitishwa', check4: 'Ukaguzi wa nne umethibitishwa', children: 'Idadi ya watoto', city: 'Jiji au eneo', claimAmount: 'Kiasi cha madai', claimType: 'Aina ya madai', classes: 'Idadi ya madarasa ya Nice', coida: 'Ongeza usajili wa COIDA', company: 'Jina la kampuni', comparable: 'Bei linganishi kwa kipimo', consentExpiry: 'Muda wa idhini kwa siku', contact: 'Mawasiliano ya haki za data', contributionA: 'Mchango wa mbia A', contributionB: 'Mchango wa mbia B', controller: 'Mdhibiti wa data', costs: 'Gharama za mwaka', country: 'Nchi', courtLevel: 'Ngazi ya mahakama', crossBorder: 'Uhamisho wa data kuvuka mipaka', currency: 'Sarafu', custodialIncome: 'Mapato ya mzazi mlezi', custodian: 'Mpangilio wa ulezi', custody: 'Aina ya ulezi', dataCategories: 'Aina za data zinazokusanywa', dataTypes: 'Aina za data zinazochakatwa', date: 'Tarehe', decision: 'Uamuzi wa bodi', declarant: 'Mtoa tamko', delay: 'Muda wa kuchelewa', dependants: 'Idadi ya wategemezi', deponent: 'Mtoa kiapo', deposit: 'Amana', destination: 'Nchi ya kwenda', directors: 'Idadi ya wakurugenzi', discloser: 'Mtoa taarifa', dpia: 'DPIA imefanywa inapohitajika', dpo: 'DPO au jukumu la faragha limeteuliwa', duration: 'Muda', durationMonths: 'Muda wa ulinzi kwa miezi', employee: 'Mfanyakazi', employees: 'Wafanyakazi wanaoathirika', employer: 'Mwajiri', endDate: 'Tarehe ya mwisho', entityType: 'Aina ya taasisi', euResidents: 'Je, watu walio EU wanahusika?', executor: 'Msimamizi wa mirathi', exemption: 'Msamaha unaotumika', expenses: 'Gharama', express: 'Huduma ya haraka', facts: 'Ukweli unaotamkwa', filingStatus: 'Hali ya uwasilishaji', finance: 'Gharama ya ufadhili', fixed: 'Ada isiyobadilika', flightRisk: 'Hatari ya kutofika mahakamani', founders: 'Idadi ya waanzilishi', fx: 'Kiwango cha ubadilishaji', homeCountry: 'Nchi ya asili', incidentDate: 'Tarehe ya kugundua tukio', jobTitle: 'Cheo cha kazi', jurisdiction: 'Mamlaka ya kisheria ya kuthibitisha', land: 'Gharama ya ardhi', landlord: 'Mwenye nyumba', largeScale: 'Uchakataji wa kiwango kikubwa', lawfulBasis: 'Msingi halali umeandikwa', limitedLiability: 'Dhima ndogo inahitajika', localHiring: 'Ajira ya ndani inapangwa', marketing: 'Vidakuzi vya matangazo', marriageDuration: 'Muda wa ndoa kwa miaka', matter: 'Aina ya shauri', measures: 'Hatua zilizochukuliwa', meetingDate: 'Tarehe ya kikao', method: 'Njia ya kuwasilisha', monthlyIncome: 'Mapato ya mwezi', municipality: 'Manispaa au mamlaka ya eneo', nameRes: 'Hifadhi jina la kampuni', nightly: 'Bei kwa usiku', nights: 'Usiku unaotarajiwa', nonCustodialIncome: 'Mapato ya mzazi asiye mlezi', obligation: 'Wajibu mkuu', offenceCategory: 'Kundi la tuhuma', officialFee: 'Ada rasmi uliyothibitisha', offplan: 'Bei ya mradi wa ramani', onlinePreferred: 'Njia ya mtandaoni inapendelewa', openness: 'Uwazi na taarifa vimeandaliwa', other: 'Gharama nyingine', outsideInvestment: 'Uwekezaji wa nje unapangwa', partnerA: 'Mbia A', partnerB: 'Mbia B', partyA: 'Mhusika A', partyAIncome: 'Mapato ya mhusika A', partyAName: 'Jina la mhusika A', partyB: 'Mhusika B', partyBIncome: 'Mapato ya mhusika B', partyBName: 'Jina la mhusika B', passport: 'Nchi ya pasipoti', payment: 'Malipo yaliyokubaliwa', place: 'Mahali', powers: 'Mamlaka yanayotolewa', premises: 'Je, eneo la biashara linapokea umma?', presence: 'Muundo unaopangwa', price: 'Bei ya mali', principal: 'Mtoaji wa mamlaka', priorRecord: 'Rekodi ya awali imetajwa', priorSearch: 'Utafutaji wa awali umefanywa', privacyNotice: 'Taarifa ya faragha imetolewa', privacyUrl: 'URL ya sera ya faragha', probationMonths: 'Miezi ya majaribio', processor: 'Mchakataji wa data', professional: 'Ada za wataalamu', profitSplit: 'Mgawanyo wa faida', property: 'Mali inayopangishwa', propertyValue: 'Thamani ya mali', proposedName: 'Jina linalopendekezwa', purpose: 'Madhumuni', quorum: 'Idadi ya wajumbe waliokuwepo', rate: 'Kiwango (%)', ready: 'Bei ya nyumba tayari', recipient: 'Mpokeaji wa taarifa', recordsReady: 'Rekodi za kampuni ziko tayari', registeredBusiness: 'Biashara tayari imesajiliwa', regulatedWord: 'Jina lina neno lenye masharti', rent: 'Pango', reserve: 'Akiba ya matengenezo', reservedMatter: 'Uamuzi unaohitaji idhini maalum', retention: 'Muda wa kuhifadhi data umeandikwa', revenue: 'Mapato yanayotarajiwa', routeType: 'Njia inayopangwa', salary: 'Mshahara', sale: 'Bei ya kuuza', security: 'Hatua za usalama', sensitiveData: 'Data nyeti inahusika', serviceFee: 'Ada ya huduma uliyoweka', shareA: 'Hisa za mwanahisa A (%)', shareB: 'Hisa za mwanahisa B (%)', shareCapital: 'Mtaji wa hisa', shareholderA: 'Mwanahisa A', shareholderB: 'Mwanahisa B', solvent: 'Kampuni inaweza kulipa madeni', special: 'Mahitaji maalum ya mtoto', startDate: 'Tarehe ya kuanza', systematicMonitoring: 'Ufuatiliaji wa utaratibu unafanyika', tax: 'Kodi', taxClearance: 'Uthibitisho wa kodi umepatikana', taxReg: 'Ongeza usajili wa SARS', tenant: 'Mpangaji', testator: 'Mtoa wosia', topic: 'Mada ya kulinganisha', totalAssets: 'Jumla ya mali', uif: 'Ongeza usajili wa UIF', units: 'Idadi ya vitengo', use: 'Matumizi ya mali', useAgent: 'Tumia wakala aliyethibitishwa', value: 'Thamani', visaType: 'Aina ya safari au visa', website: 'Tovuti au huduma'
};

const OPTION_LABELS = {
  'Activité réglementée': 'Shughuli yenye udhibiti', Affaires: 'Biashara', 'Afrique du Sud': 'Afrika Kusini', 'Agent ou avocat accrédité': 'Wakala au wakili aliyeidhinishwa', Aucun: 'Hakuna', Autre: 'Nyingine', 'Autre cadre africain': 'Mfumo mwingine wa Afrika', 'Besoins médicaux': 'Mahitaji ya matibabu', 'Besoins éducatifs': 'Mahitaji ya elimu', Bien: 'Mali', 'Bureau de représentation': 'Ofisi ya uwakilishi', 'Changement de nom': 'Mabadiliko ya jina', Civile: 'Madai ya kiraia', Commerce: 'Biashara', 'Commerce de détail': 'Rejareja', Commercial: 'Biashara', 'Confirmation d’adresse': 'Uthibitisho wa anwani', Contrat: 'Mkataba', Coopérative: 'Ushirika', 'Cour d’appel': 'Mahakama ya rufaa', "Côte d’Ivoire": "Côte d’Ivoire", Dakar: 'Dakar', Dette: 'Deni', 'Dissolution volontaire': 'Kufunga kwa hiari', 'Document perdu': 'Hati iliyopotea', 'Droits des personnes': 'Haki za watu', Déposé: 'Imewasilishwa', 'Dépôt direct': 'Uwasilishaji wa moja kwa moja', Emploi: 'Ajira', 'En ligne': 'Mtandaoni', 'En retard': 'Imechelewa', Entreprise: 'Biashara', 'Entreprise individuelle': 'Biashara ya mtu binafsi', Familiale: 'Familia', Famille: 'Familia', 'Filiale locale': 'Kampuni tanzu ya ndani', Foncière: 'Ardhi', 'Garde alternée': 'Ulezi wa kupokezana', 'Garde conjointe': 'Ulezi wa pamoja', 'Garde partagée': 'Ulezi wa pamoja', 'Garde principale': 'Ulezi mkuu', Grave: 'Kubwa', 'Haute cour': 'Mahakama kuu', Industriel: 'Viwanda', Intermédiaire: 'Wastani', Johannesburg: 'Johannesburg', Kenya: 'Kenya', Lagos: 'Lagos', 'Liquidation par les créanciers': 'Kufungwa kwa njia ya wadai', Location: 'Upangishaji', 'Loi kényane sur la protection des données': 'Sheria ya Ulinzi wa Data ya Kenya', 'Loi nigériane NDPA': 'Sheria ya NDPA ya Nigeria', 'Loi sud-africaine POPIA': 'Sheria ya POPIA ya Afrika Kusini', Manuel: 'Kwa mkono', Mineure: 'Ndogo', Nigeria: 'Nigeria', 'Nom commercial': 'Jina la biashara', Non: 'Hapana', 'Non-résident': 'Asiye mkazi', 'Notification de violation': 'Taarifa ya uvujaji wa data', OAPI: 'OAPI', 'Organisation à but non lucratif': 'Shirika lisilo la faida', Oui: 'Ndiyo', Particulier: 'Mtu binafsi', 'Partie A': 'Mhusika A', 'Partie B': 'Mhusika B', 'Préjudice corporel': 'Jeraha la mwili', Pénale: 'Jinai', 'Radiation administrative': 'Kuondolewa kwenye rejista', Résidentiel: 'Makazi', Services: 'Huduma', 'Société anonyme': 'Kampuni ya umma', 'Société de personnes à responsabilité limitée': 'Ubia wenye dhima ndogo', 'Société privée (Pty Ltd)': 'Kampuni binafsi (Pty Ltd)', 'Société à but non lucratif (NPC)': 'Kampuni isiyo ya faida (NPC)', 'Société à responsabilité limitée': 'Kampuni yenye dhima ndogo', 'Société à responsabilité personnelle': 'Kampuni yenye dhima binafsi', 'Société étrangère': 'Kampuni ya kigeni', Succursale: 'Tawi', Sénégal: 'Senegal', Tourisme: 'Utalii', 'Transferts internationaux': 'Uhamisho wa kimataifa', Transit: 'Kupitia njiani', 'Tribunal de première instance': 'Mahakama ya mwanzo', 'Visa électronique': 'E-visa', 'Voie nationale': 'Njia ya kitaifa', 'À préparer': 'Inahitaji kuandaliwa', ARIPO: 'ARIPO', Abidjan: 'Abidjan'
};

const RESULT_LABELS = {
  actifsSousSeuil: 'Mali iko chini ya kikomo', actionnaireA: 'Mwanahisa A', actionnaireB: 'Mwanahisa B', activite: 'Shughuli', affaireCouverte: 'Shauri linafunikwa', annexe: 'Kiambatisho', antecedentDeclare: 'Rekodi ya awali iliyotajwa', apportA: 'Mchango wa A', apportB: 'Mchango wa B', autoritesAVerifier: 'Mamlaka za kuthibitisha', bailleur: 'Mwenye nyumba', beneficiaire: 'Mnufaika', besoin: 'Kiasi kinachohitajika', bienLoue: 'Mali inayopangishwa', budgetLocal: 'Bajeti ya ndani', cadre: 'Mfumo', categorieInfraction: 'Kundi la tuhuma', categories: 'Aina', categoriesDonnees: 'Aina za data', chargeParUnite: 'Ada kwa kila kitengo', chiffreAffairesPrevu: 'Mauzo yanayotarajiwa', classesNice: 'Madarasa ya Nice', classification: 'Uainishaji', commissionTotale: 'Kamisheni yote', commune: 'Manispaa', conditionsValides: 'Masharti yaliyothibitishwa', conservation: 'Muda wa kuhifadhi', contactDroits: 'Mawasiliano ya haki', contributionMensuelle: 'Mchango wa mwezi', controlesValides: 'Vidhibiti vilivyothibitishwa', coutPret: 'Gharama ya nyumba tayari', coutSurPlan: 'Gharama ya mradi wa ramani', coutTotal: 'Jumla ya gharama', coutTotalNGN: 'Jumla ya gharama (NGN)', coutTotalUSD: 'Jumla ya gharama (USD)', coutTotalZAR: 'Jumla ya gharama (ZAR)', date: 'Tarehe', dateAnniversaire: 'Tarehe ya kumbukumbu', dateDebut: 'Tarehe ya kuanza', dateIncident: 'Tarehe ya tukio', dateProjet: 'Tarehe ya rasimu', dateReunion: 'Tarehe ya kikao', debut: 'Mwanzo', decision: 'Uamuzi', decisionReservee: 'Uamuzi maalum', declarant: 'Mtoa tamko', delai: 'Muda', demandeur: 'Mwombaji', depot: 'Amana', destinataire: 'Mpokeaji', destination: 'Nchi ya kwenda', devise: 'Sarafu', difference: 'Tofauti', divulgateur: 'Mtoa taarifa', donnees: 'Data', donneesConcernees: 'Data inayohusika', doubleCadrePossible: 'Mifumo miwili inaweza kutumika', duree: 'Muda', dureeMois: 'Muda kwa miezi', eligible: 'Inaweza kujaribu kuomba', embaucheLocale: 'Ajira ya ndani', employeur: 'Mwajiri', entrepriseImmatriculee: 'Biashara imesajiliwa', equivalentUSD: 'Sawa na USD', essaiMois: 'Miezi ya majaribio', etapePrioritaire: 'Hatua ya kipaumbele', etapeSuivante: 'Hatua inayofuata', etatDepot: 'Hali ya uwasilishaji', executeur: 'Msimamizi wa mirathi', expirationJours: 'Muda wa idhini kwa siku', facteursRisque: 'Sababu za hatari', facteursTotal: 'Jumla ya sababu', faits: 'Ukweli', fin: 'Mwisho', finalite: 'Madhumuni', fondateurs: 'Waanzilishi', forme: 'Aina ya taasisi', formeCAC: 'Aina ya CAC', formeCIPC: 'Aina ya CIPC', fraisCIPCZAR: 'Ada ya CIPC (ZAR)', fraisDepot: 'Ada ya kuwasilisha', fraisGestion: 'Ada ya usimamizi', fraisOfficielsUSD: 'Ada rasmi (USD)', fraisServiceUSD: 'Ada ya huduma (USD)', fraisSignification: 'Ada ya kuhudumia nyaraka', garde: 'Ulezi', impotScenario: 'Kodi ya makadirio', investissementExterne: 'Uwekezaji wa nje', juridiction: 'Mamlaka ya kisheria', legs: 'Mgao wa mali', lieu: 'Mahali', lignesDeFrais: 'Vipengele vya gharama', localPublic: 'Eneo linapokea umma', locataire: 'Mpangaji', loiAfricaine: 'Sheria ya Afrika', loyer: 'Pango', mandant: 'Mtoaji wa mamlaka', mandataire: 'Mwakilishi', margeScenario: 'Pengo la makadirio', mesures: 'Hatua zilizochukuliwa', montantDemande: 'Kiasi cha madai', motReglemente: 'Neno lenye masharti', moteurJuridiqueAnglais: 'Injini ya mmiliki wa Kiingereza', niveau: 'Kiwango', niveauJuridiction: 'Ngazi ya mahakama', niveauRisque: 'Kiwango cha hatari', nomPropose: 'Jina linalopendekezwa', objet: 'Madhumuni ya tamko', obligation: 'Wajibu', organisation: 'Shirika', paiement: 'Malipo', parEnfant: 'Kiasi kwa mtoto', parcours: 'Njia ya kufuata', partAPourcent: 'Sehemu ya A (%)', partBPourcent: 'Sehemu ya B (%)', partageBenefices: 'Mgawanyo wa faida', partenaireA: 'Mbia A', partenaireB: 'Mbia B', participationA: 'Hisa za A (%)', participationB: 'Hisa za B (%)', partieA: 'Mhusika A', partieB: 'Mhusika B', passeport: 'Pasipoti', pays: 'Nchi', paysAccueil: 'Nchi ya mwenyeji', paysOrigine: 'Nchi ya asili', paysPrincipal: 'Nchi kuu', personnesPotentielles: 'Watu wanaoweza kuathirika', personnesUE: 'Watu walio EU', plusValue: 'Faida ya mtaji', pointsComparer: 'Mambo ya kulinganisha', pointsConfirmes: 'Vipengele vilivyothibitishwa', pointsTotal: 'Jumla ya vipengele', politique: 'Sera ya faragha', poste: 'Cheo cha kazi', pouvoirs: 'Mamlaka', preferenceEnLigne: 'Njia ya mtandaoni inapendelewa', presence: 'Muundo wa uwepo', president: 'Mwenyekiti', priorite: 'Kipaumbele', prochaineAction: 'Hatua inayofuata', quitusFiscal: 'Uthibitisho wa kodi', quorumDeclare: 'Akidi iliyotajwa', rechercheAnterieure: 'Utafutaji wa awali', recommandation: 'Pendekezo la kupanga', refusDisponible: 'Njia ya kukataa ipo', registresPrets: 'Rekodi ziko tayari', rendementNetPourcent: 'Faida halisi (%)', responsabiliteLimitee: 'Dhima ndogo', responsable: 'Mdhibiti wa data', resultatAnnuelNet: 'Matokeo halisi ya mwaka', revenuAnnuelNet: 'Mapato halisi ya mwaka', revenuSousSeuil: 'Mapato yako chini ya kikomo', risqueNonComparution: 'Hatari ya kutofika', salaire: 'Mshahara', salarie: 'Mfanyakazi', salaries: 'Wafanyakazi', salariesPrevus: 'Wafanyakazi wanaopangwa', scoreNDPA: 'Alama ya NDPA', scorePOPIA: 'Alama ya POPIA', scorePourcent: 'Alama (%)', securite: 'Usalama', securiteDeclaree: 'Usalama uliotajwa', service: 'Huduma', seuilRevenuAjuste: 'Kikomo cha mapato kilichorekebishwa', site: 'Tovuti', societe: 'Kampuni', solvable: 'Inaweza kulipa madeni', sousTraitant: 'Mchakataji wa data', statut: 'Hali', sujet: 'Mada', tauxEffectifPourcent: 'Kiwango kinachotumika (%)', tauxPourcent: 'Kiwango (%)', taxeAnnuelle: 'Kodi ya mwaka', taxeMensuelle: 'Kodi ya mwezi', testateur: 'Mtoa wosia', total: 'Jumla', totalAnnuel: 'Jumla ya mwaka', typeAffaire: 'Aina ya shauri', typeDemande: 'Aina ya madai', typeVoyage: 'Aina ya safari', valeurA: 'Thamani ya A', valeurB: 'Thamani ya B', valeurBien: 'Thamani ya mali', valeurScenario: 'Thamani ya makadirio', voie: 'Njia', voieDepot: 'Njia ya kuwasilisha'
};

function strip(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}

function bootstrapCopy(rows) {
  return {
    schemaVersion: 1,
    locale: 'sw',
    owner: OWNER,
    count: rows.length,
    rows: rows.map((row) => {
      const html = fs.readFileSync(path.join(ROOT, row.primarySwahiliFile), 'utf8');
      const name = strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]);
      const description = strip((html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)/i) || [])[1]);
      if (!name || !description || /[âÃ�]/.test(name + description)) {
        throw new Error(`Unreviewed Swahili copy for ${row.englishId}`);
      }
      return { englishId: row.englishId, swahiliRoute: `${row.primarySwahiliRoute.replace(/\/$/, '')}/`, name, description };
    })
  };
}

function sourceFor(owner) {
  let host = 'chanzo cha nje';
  try { host = new URL(owner.source.url).hostname.replace(/^www\./, ''); } catch (_) {}
  return {
    url: owner.source.url || '',
    label: `Rejea ya ${host} iliyounganishwa na mmiliki wa Kiingereza`,
    availability: owner.source.url ? 'external-reference' : 'unavailable',
    checkedAt: owner.source.checkedAt || 'Haijathibitishwa',
    confidence: 'Injini inarudia tabia ya mmiliki wa Kiingereza kwa maingizo haya. Sheria, ada, mamlaka, ustahiki na kukubalika hubadilika; thibitisha chanzo rasmi au mtaalamu katika eneo husika kabla ya hatua yoyote.'
  };
}

function localizedFields(owner) {
  return owner.fields.map((field) => {
    if (!FIELD_LABELS[field.name]) throw new Error(`Missing Swahili field label ${owner.englishId}.${field.name}`);
    return {
      ...field,
      label: FIELD_LABELS[field.name],
      options: (field.options || []).map((option) => {
        if (!Object.hasOwn(OPTION_LABELS, option[1])) throw new Error(`Missing Swahili option ${owner.englishId}: ${option[1]}`);
        return [option[0], OPTION_LABELS[option[1]]];
      })
    };
  });
}

function fixtureInput(owner) {
  return Object.fromEntries(owner.fields.map((field) => [
    field.name,
    field.type === 'checkbox' ? field.fixtureValue === 'true' : field.fixtureValue
  ]));
}

function changedFixture(owner, engine, legalEngine, baseline) {
  const original = fixtureInput(owner);
  const baselineResult = JSON.stringify(baseline.resultFields || {});
  for (const field of owner.fields) {
    const candidate = { ...original };
    if (field.type === 'checkbox') {
      candidate[field.name] = !Boolean(candidate[field.name]);
    } else if (field.type === 'select') {
      const alternative = (field.options || []).find((option) => String(option[0]) !== String(candidate[field.name]));
      if (!alternative) continue;
      candidate[field.name] = alternative[0];
    } else if (field.type === 'number') {
      const current = Number(candidate[field.name]);
      const step = Number(field.step === 'any' || field.step == null ? 1 : field.step);
      const up = current + (Number.isFinite(step) && step > 0 ? step : 1);
      const down = current - (Number.isFinite(step) && step > 0 ? step : 1);
      candidate[field.name] = field.max == null || up <= Number(field.max) ? String(up) : String(down);
    } else if (field.type === 'date') {
      const date = new Date(`${candidate[field.name]}T00:00:00Z`);
      if (Number.isNaN(date.getTime())) continue;
      date.setUTCDate(date.getUTCDate() + 1);
      candidate[field.name] = date.toISOString().slice(0, 10);
    } else {
      candidate[field.name] = `${candidate[field.name] || 'jaribio'} tofauti`;
    }
    const changed = engine.run(owner, candidate, { legalEngine });
    if (changed && changed.ok && JSON.stringify(changed.resultFields || {}) !== baselineResult) return candidate;
  }
  throw new Error(`No input-dependent output oracle found for ${owner.englishId}`);
}

function buildContracts(copy) {
  global.window = {};
  delete require.cache[require.resolve('../engines/src/legal-engine.js')];
  require('../engines/src/legal-engine.js');
  const legalEngine = global.window.AfroTools.LegalEngine;
  const engine = require('../assets/js/engines/french-mortgage-property.js');
  const copyById = new Map(copy.rows.map((row) => [row.englishId, row]));
  const ownerById = new Map(ENGLISH_CONTRACTS.map((row) => [row.englishId, row]));
  const contracts = LEGAL_IDS.map((englishId) => {
    const owner = ownerById.get(englishId);
    const sw = copyById.get(englishId);
    if (!owner || !sw) throw new Error(`Missing exact Legal owner/copy for ${englishId}`);
    const proof = engine.run(owner, fixtureInput(owner), { legalEngine });
    if (!proof || !proof.ok) throw new Error(`English-owner engine refused fixture for ${englishId}`);
    const resultLabels = {};
    for (const key of Object.keys(proof.resultFields || {})) {
      if (!RESULT_LABELS[key]) throw new Error(`Missing Swahili result label ${englishId}.${key}`);
      resultLabels[key] = RESULT_LABELS[key];
    }
    return {
      ...owner,
      name: sw.name,
      description: sw.description,
      swahiliRoute: sw.swahiliRoute,
      workflowControl: /generator|agreement|contract|policy|will|affidavit|declaration|resolution|notification|attorney|nda|dpa/i.test(englishId)
        ? 'Tengeneza rasimu ya kupanga'
        : 'Kokotoa au kagua maingizo',
      resultIntro: `${sw.name}: matokeo yametolewa na injini ileile ya mmiliki wa Kiingereza kwa maingizo yaliyo hapa.`,
      fields: localizedFields(owner),
      resultLabels,
      mutationFixture: changedFixture(owner, engine, legalEngine, proof),
      source: sourceFor(owner),
      clearStaleOnInput: true,
      parserValidPdf: true,
      sourceOwner: OWNER,
      additionalAlternates: ADDITIONAL_ALTERNATES[englishId] || [],
      contractManifest: '/data/registry/swahili-legal-remaining-parity.json',
      categoryHub: '/sw/biashara-na-uzingatiaji/',
      categoryLabel: 'Biashara na uzingatiaji'
    };
  });
  delete global.window;
  return contracts;
}

function hubOutput(copy) {
  let html = fs.readFileSync(HUB_PATH, 'utf8');
  html = html.replace(/\n?<!-- SW LEGAL REMAINING START -->[\s\S]*?<!-- SW LEGAL REMAINING END -->\n?/g, '\n');
  const missing = copy.rows.filter((row) => !new RegExp(`href=["']${row.swahiliRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(html));
  const cards = missing.map((row) => `<a class="sw-card" href="${row.swahiliRoute}"><div class="sw-kicker">Sheria na uzingatiaji</div><h3>${row.name}</h3><p>${row.description}</p><span class="sw-cta">Fungua &rarr;</span></a>`).join('\n');
  const section = `<!-- SW LEGAL REMAINING START -->\n<style>.sw-main .sw-card{display:block!important;min-width:0!important;max-width:100%;overflow-wrap:anywhere}@media(max-width:760px){[data-sw-legal-remaining-discovery] .sw-grid{grid-template-columns:minmax(0,1fr)!important}}</style><section class="sw-section" data-sw-legal-remaining-discovery><div class="sw-wrap"><div class="sw-kicker">Zana zilizooanishwa</div><h2>Njia nyingine za sheria na uzingatiaji</h2><p class="sw-muted">Fungua zana ya kupanga, kisha thibitisha matokeo na mamlaka au mtaalamu anayefaa.</p><div class="sw-grid">${cards}</div></div></section>\n<!-- SW LEGAL REMAINING END -->`;
  return html.replace('</main>', `${section}\n</main>`);
}

function checkOrWriteExact(outputs) {
  const drift = [];
  for (const [file, content] of outputs) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (current === content) continue;
    drift.push(path.relative(ROOT, file).replace(/\\/g, '/'));
    if (WRITE) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content, 'utf8');
    }
  }
  if (!WRITE && drift.length) throw new Error(`Exact Swahili Legal output drift:\n${drift.join('\n')}`);
  return drift;
}

function main() {
  const inventoryRows = INVENTORY.rows.filter((row) => LEGAL_IDS.includes(row.englishId));
  if (LEGAL_IDS.length !== 51 || inventoryRows.length !== 51 || new Set(LEGAL_IDS).size !== 51) {
    throw new Error(`Legal remaining denominator drift: ${LEGAL_IDS.length}/${inventoryRows.length}`);
  }
  if (inventoryRows.some((row) => row.categoryKey !== 'legal')) throw new Error('Non-Legal row entered the Legal lane.');
  const copy = fs.existsSync(COPY_PATH) ? JSON.parse(fs.readFileSync(COPY_PATH, 'utf8')) : bootstrapCopy(inventoryRows);
  if (copy.count !== 51 || copy.rows.length !== 51) throw new Error('Swahili Legal copy contract must contain exactly 51 rows.');
  const contracts = buildContracts(copy);
  const outputs = [
    [COPY_PATH, `${JSON.stringify(copy, null, 2)}\n`],
    [CONTRACT_PATH, `${JSON.stringify({ schemaVersion: 1, locale: 'sw', owner: OWNER, count: contracts.length, rows: contracts }, null, 2)}\n`],
    ...contracts.map((contract) => [fileForRoute(contract.swahiliRoute), legalPage(contract)]),
    [HUB_PATH, hubOutput(copy)]
  ];
  const drift = checkOrWriteExact(outputs);
  process.stdout.write(`${WRITE ? 'Built' : 'Checked'} exact Swahili Legal remaining owners: ${contracts.length}/51; hub separate; ${drift.length} changed outputs.\n`);
}

if (require.main === module) main();

module.exports = { LEGAL_IDS, ADDITIONAL_ALTERNATES, FIELD_LABELS, OPTION_LABELS, RESULT_LABELS, buildContracts };
