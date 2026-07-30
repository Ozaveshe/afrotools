'use strict';

const presentation = require('../../assets/js/lib/french-mortgage-property-presentation');

const PROPERTY_MODES = {
  'stamp-duty': 'stamp-duty',
  'rental-yield': 'rental-yield',
  'land-title-check': 'land-title-check',
  'property-valuation': 'property-valuation',
  'rent-affordability': 'rent-affordability',
  'tenant-screening': 'tenant-screening',
  'rental-agreement': 'rental-agreement',
  'property-mgmt-fees': 'property-mgmt-fees',
  'building-materials': 'building-materials',
  'construction-budget': 'construction-budget',
  'dev-feasibility': 'dev-feasibility',
  'survey-cost': 'survey-cost',
  'property-cgt': 'property-cgt',
  'service-charge': 'service-charge',
  'short-let-calc': 'short-let-calc',
  'agent-commission': 'agent-commission',
  'plot-converter': 'plot-converter',
  'building-permit': 'building-permit',
  'diaspora-property': 'diaspora-property',
  'offplan-vs-ready': 'offplan-vs-ready'
};

const MODE_BY_ID = {
  'cac-cost': 'rate-total',
  'cipc-cost': 'rate-total',
  'data-compliance': 'score',
  'contract-gen': 'document',
  'tenancy-deposit': 'deposit',
  'leave-days': 'leave',
  'visa-cost': 'reference',
  'property-tax': 'rate-total',
  'rent-intelligence': 'rent-metrics',
  'lease-risk-check': 'score',
  'ng-nhf': 'nhf',
  'tenancy-agreement': 'document',
  'employment-contract': 'document',
  'cac-checker': 'reference',
  'ip-rights-africa': 'reference',
  'business-registration': 'reference',
  'company-type-selector': 'reference',
  'nda-generator': 'document',
  'privacy-policy-gen': 'document',
  'will-generator': 'document',
  'ndpa-checker': 'score',
  'popia-checker': 'score',
  'child-support': 'child-support',
  'court-fees': 'court-fees',
  'affidavit-generator': 'document',
  'annual-returns': 'reference',
  'bail-calculator': 'reference',
  'board-resolution': 'document',
  'breach-notification': 'document',
  'business-license': 'reference',
  'cookie-consent': 'document',
  'divorce-settlement': 'divorce',
  'dpa-generator': 'document',
  'dpia-tool': 'score',
  'foreign-company-reg': 'reference',
  'gdpr-vs-africa': 'reference',
  'inheritance-tax': 'inheritance',
  'ip-protection': 'reference',
  'legal-aid': 'legal-aid',
  'partnership-agreement': 'document',
  'power-of-attorney': 'document',
  'shareholder-agreement': 'document',
  'statutory-declaration': 'document',
  'tin-guide': 'reference',
  'trademark-registration': 'reference',
  'winding-up': 'reference'
};

const MISSING_FRENCH_ROUTES = {
  'statutory-declaration': '/fr/tools/declaration-solennelle',
  'tin-guide': '/fr/tools/guide-nif',
  'trademark-registration': '/fr/tools/enregistrement-marque',
  'winding-up': '/fr/tools/dissolution-societe'
};

const MISSING_FRENCH_NAMES = {
  'statutory-declaration': 'Générateur de déclaration solennelle',
  'tin-guide': 'Guide du numéro d’identification fiscale (NIF)',
  'trademark-registration': 'Guide d’enregistrement de marque',
  'winding-up': 'Checklist de dissolution d’entreprise'
};

const REFERENCE_LABELS = {
  'visa-cost': ['Visa électronique', 'Visa à l’arrivée', 'Visa requis'],
  'cac-checker': ['Nom distinctif', 'Nom descriptif', 'Mot réglementé'],
  'ip-rights-africa': ['Marque', 'Brevet', 'Droit d’auteur'],
  'business-registration': ['Entreprise individuelle', 'SARL / Ltd', 'Société par actions'],
  'company-type-selector': ['Activité individuelle', 'Petite équipe', 'Levée de capitaux'],
  'annual-returns': ['Dépôt à jour', 'Échéance proche', 'Dépôt en retard'],
  'bail-calculator': ['Infraction mineure', 'Infraction intermédiaire', 'Infraction grave'],
  'business-license': ['Commerce', 'Services', 'Activité réglementée'],
  'foreign-company-reg': ['Succursale', 'Filiale locale', 'Bureau de représentation'],
  'gdpr-vs-africa': ['RGPD', 'Nigeria NDPA', 'Afrique du Sud POPIA'],
  'ip-protection': ['Marque', 'Brevet', 'Secret commercial'],
  'tin-guide': ['Particulier', 'Entreprise', 'Non-résident'],
  'trademark-registration': ['Dépôt national', 'OAPI', 'ARIPO'],
  'winding-up': ['Dissolution volontaire', 'Liquidation par créanciers', 'Radiation administrative']
};

const DOCUMENT_SUBJECTS = {
  'contract-gen': 'Objet du contrat',
  'tenancy-agreement': 'Bien loué',
  'employment-contract': 'Poste et responsabilités',
  'nda-generator': 'Informations confidentielles',
  'privacy-policy-gen': 'Traitements de données',
  'will-generator': 'Instructions successorales',
  'affidavit-generator': 'Faits déclarés',
  'board-resolution': 'Décision du conseil',
  'breach-notification': 'Incident et mesures',
  'cookie-consent': 'Catégories de cookies',
  'dpa-generator': 'Traitement sous-traité',
  'partnership-agreement': 'Objet du partenariat',
  'power-of-attorney': 'Pouvoirs confiés',
  'shareholder-agreement': 'Gouvernance et cession',
  'statutory-declaration': 'Faits déclarés sous serment'
};

function field(name, label, type, value, extra = {}) {
  return { name, label, type, fixtureValue: String(value), ...extra };
}

function propertyFields(mode) {
  const currency = field('currency', 'Devise', 'text', 'XOF');
  const map = {
    'stamp-duty': [currency, field('value', 'Valeur de la transaction', 'number', 100000), field('rate', 'Taux saisi (%)', 'number', 2.5), field('fixed', 'Frais fixes', 'number', 500)],
    'rental-yield': [currency, field('value', 'Valeur du bien', 'number', 100000), field('rent', 'Loyer mensuel', 'number', 1000), field('costs', 'Charges annuelles', 'number', 2000)],
    'property-valuation': [currency, field('area', 'Surface', 'number', 100), field('comparable', 'Prix comparable par unité', 'number', 1500), field('adjustment', 'Ajustement (%)', 'number', 10)],
    'rent-affordability': [currency, field('income', 'Revenu net mensuel', 'number', 5000), field('rent', 'Loyer mensuel', 'number', 1200), field('ratio', 'Ratio budgétaire (%)', 'number', 30), field('advance', 'Mois de loyer d’avance', 'number', 2)],
    'rental-agreement': [currency, field('landlord', 'Nom du bailleur', 'text', 'Awa Test'), field('tenant', 'Nom du locataire', 'text', 'Moussa Test'), field('address', 'Adresse du bien', 'text', '12 rue Exemple'), field('start', 'Date de début', 'date', '2026-08-01'), field('duration', 'Durée (mois)', 'number', 12), field('rent', 'Loyer', 'number', 1000), field('deposit', 'Dépôt', 'number', 2000)],
    'property-mgmt-fees': [currency, field('rent', 'Loyer par période', 'number', 2000), field('rate', 'Taux de gestion (%)', 'number', 8), field('fixed', 'Frais fixes', 'number', 50)],
    'building-materials': [currency, field('quantity', 'Quantité ou surface', 'number', 10), field('unitCost', 'Coût unitaire', 'number', 100), field('fixed', 'Coûts fixes', 'number', 50), field('contingency', 'Imprévus (%)', 'number', 10)],
    'construction-budget': [currency, field('quantity', 'Quantité ou surface', 'number', 10), field('unitCost', 'Coût unitaire', 'number', 100), field('fixed', 'Coûts fixes', 'number', 50), field('contingency', 'Imprévus (%)', 'number', 10)],
    'survey-cost': [currency, field('quantity', 'Quantité ou surface', 'number', 10), field('unitCost', 'Coût unitaire', 'number', 100), field('fixed', 'Coûts fixes', 'number', 50), field('contingency', 'Imprévus (%)', 'number', 10)],
    'dev-feasibility': [currency, field('revenue', 'Recettes attendues', 'number', 500000), field('land', 'Coût du terrain', 'number', 100000), field('build', 'Coût de construction', 'number', 200000), field('professional', 'Honoraires professionnels', 'number', 20000), field('finance', 'Coût du financement', 'number', 15000), field('other', 'Autres coûts', 'number', 5000)],
    'property-cgt': [currency, field('sale', 'Prix de vente', 'number', 300000), field('basis', 'Coût de base', 'number', 180000), field('costs', 'Frais de vente et travaux', 'number', 20000), field('exemption', 'Exonération saisie', 'number', 10000), field('rate', 'Taux d’imposition saisi (%)', 'number', 10)],
    'service-charge': [currency, field('annual', 'Coûts communs annuels', 'number', 12000), field('units', 'Nombre d’unités', 'number', 10), field('reserve', 'Réserve (%)', 'number', 10)],
    'short-let-calc': [currency, field('nightly', 'Tarif par nuit', 'number', 100), field('nights', 'Nuits occupées par an', 'number', 200), field('expenses', 'Dépenses annuelles', 'number', 5000)],
    'agent-commission': [currency, field('value', 'Valeur de la transaction', 'number', 200000), field('rate', 'Commission (%)', 'number', 5), field('tax', 'Taxe sur commission (%)', 'number', 10)],
    'plot-converter': [field('value', 'Valeur', 'number', 1), field('from', 'Unité de départ', 'select', 'hectare', { options: [['sqm', 'm²'], ['hectare', 'hectare'], ['acre', 'acre'], ['sqft', 'pied carré']] }), field('to', 'Unité d’arrivée', 'select', 'sqm', { options: [['sqm', 'm²'], ['hectare', 'hectare'], ['acre', 'acre'], ['sqft', 'pied carré']] })],
    'diaspora-property': [currency, field('budget', 'Budget en devise étrangère', 'number', 100000), field('fx', 'Taux local par unité étrangère', 'number', 15), field('price', 'Prix du bien en monnaie locale', 'number', 1200000), field('costs', 'Autres coûts d’acquisition', 'number', 100000)],
    'offplan-vs-ready': [currency, field('ready', 'Coût du bien prêt', 'number', 250000), field('offplan', 'Prix sur plan', 'number', 200000), field('carrying', 'Coûts de portage', 'number', 10000), field('delay', 'Retard supposé (mois)', 'number', 6), field('rent', 'Loyer pendant le retard', 'number', 2000)]
  };
  if (['land-title-check', 'tenant-screening', 'building-permit'].includes(mode)) {
    const labels = {
      'land-title-check': ['Identité et pouvoir du vendeur', 'Recherche officielle au registre', 'Référence parcellaire concordante', 'Charges et litiges examinés'],
      'tenant-screening': ['Consentement du candidat obtenu', 'Identité vérifiée de façon cohérente', 'Capacité financière documentée', 'Références contrôlées avec consentement'],
      'building-permit': ['Autorité d’urbanisme identifiée', 'Liste officielle des pièces obtenue', 'Plans et signatures professionnelles prêts', 'Inspections et étapes confirmées']
    }[mode];
    return labels.map((label, index) => field(`check${index + 1}`, label, 'checkbox', index < 3 ? 'true' : 'false'));
  }
  return map[mode];
}

const COUNTRY_OPTIONS = [['NG', 'Nigeria'], ['SN', 'Sénégal'], ['CI', 'Côte d’Ivoire'], ['ZA', 'Afrique du Sud']];
const yesNo = [['yes', 'Oui'], ['no', 'Non']];
const select = (name, label, value, options) => field(name, label, 'select', value, { options });
const check = (name, label, value = true) => field(name, label, 'checkbox', String(value));

function specialFields(englishId) {
  const schemas = {
    'cac-cost': [
      select('entityType', 'Forme CAC', 'bn', [['bn', 'Business Name'], ['llc', 'Limited Company'], ['llp', 'Limited Liability Partnership'], ['ngo', 'Incorporated Trustee'], ['plc', 'Public Limited Company']]),
      field('shareCapital', 'Capital social (NGN)', 'number', 1000000, { min: 10000, step: 10000 }),
      field('directors', 'Nombre d’administrateurs', 'number', 2, { min: 1, max: 20, step: 1 }),
      select('useAgent', 'Mode de dépôt', 'self', [['self', 'Dépôt direct'], ['agent', 'Agent ou avocat accrédité']]),
      select('express', 'Traitement express', 'no', yesNo),
      check('addTin', 'NIF après immatriculation'),
      check('addScuml', 'Inscription SCUML', false),
      check('addAnnualReturns', 'Déclaration annuelle de première année', false),
      check('addStatusReport', 'Rapport de statut de la société', false)
    ],
    'cipc-cost': [
      select('entityType', 'Forme CIPC', 'pty', [['pty', 'Pty Ltd'], ['inc', 'Personal Liability Company'], ['npc', 'NPC'], ['coop', 'Co-operative'], ['ext', 'External Company']]),
      select('method', 'Mode de dépôt', 'online', [['online', 'En ligne'], ['manual', 'Manuel']]),
      check('nameRes', 'Réserver le nom'),
      check('bbbee', 'Ajouter l’affidavit B-BBEE', false),
      check('taxReg', 'Ajouter l’inscription SARS', false),
      check('uif', 'Ajouter l’inscription UIF', false),
      check('coida', 'Ajouter l’inscription COIDA', false),
      check('useAgent', 'Utiliser un agent', false)
    ],
    'data-compliance': [
      check('lawfulBasis', 'Base légale documentée'),
      check('privacyNotice', 'Notice de confidentialité fournie'),
      check('retention', 'Durée de conservation définie'),
      check('breachPlan', 'Procédure de violation testée'),
      select('jurisdiction', 'Cadre principal', 'POPIA', [['NDPA', 'Nigeria NDPA'], ['POPIA', 'Afrique du Sud POPIA'], ['other', 'Autre cadre africain']])
    ],
    'contract-gen': [
      field('partyA', 'Partie A', 'text', 'Awa Exemple'),
      field('partyB', 'Partie B', 'text', 'Moussa Exemple'),
      field('obligation', 'Obligation principale', 'text', 'Livraison du service test'),
      field('payment', 'Paiement convenu', 'text', 'XOF 250 000'),
      field('startDate', 'Date de début', 'date', '2026-08-01'),
      field('jurisdiction', 'Juridiction à vérifier', 'text', 'Sénégal')
    ],
    'tenancy-deposit': [
      select('country', 'Pays', 'ng', [['ng', 'Nigeria'], ['ke', 'Kenya'], ['za', 'Afrique du Sud'], ['gh', 'Ghana']]),
      field('rent', 'Loyer mensuel', 'number', 500000),
      field('advanceMonths', 'Mois d’avance', 'number', 12),
      field('depositMonths', 'Mois de dépôt', 'number', 1),
      field('agentFee', 'Commission de l’agent (%)', 'number', 10),
      select('legalFee', 'Frais juridiques', 'annual-five', [['none', 'Aucun'], ['annual-five', '5 % du loyer annuel'], ['annual-ten', '10 % du loyer annuel'], ['flat50000', 'Forfait local']]),
      field('serviceCharge', 'Charge mensuelle de service', 'number', 1000)
    ],
    'leave-days': [
      select('country', 'Pays', 'NG', COUNTRY_OPTIONS)
    ],
    'visa-cost': [
      select('passport', 'Passeport', 'NG', COUNTRY_OPTIONS),
      select('destination', 'Destination', 'KE', COUNTRY_OPTIONS.concat([['KE', 'Kenya']])),
      select('visaType', 'Type de voyage', 'evisa', [['evisa', 'Visa électronique'], ['tourism', 'Tourisme'], ['business', 'Affaires'], ['transit', 'Transit']]),
      field('officialFee', 'Frais officiels confirmés (USD)', 'number', 30),
      field('serviceFee', 'Frais de service saisis (USD)', 'number', 0)
    ],
    'property-tax': [
      select('country', 'Pays', 'NG', COUNTRY_OPTIONS),
      select('city', 'Ville ou région', 'lagos', [['lagos', 'Lagos'], ['dakar', 'Dakar'], ['abidjan', 'Abidjan'], ['johannesburg', 'Johannesburg']]),
      select('use', 'Usage du bien', 'residential', [['residential', 'Résidentiel'], ['rental', 'Location'], ['commercial', 'Commercial'], ['industrial', 'Industriel']]),
      field('propertyValue', 'Valeur du bien', 'number', 50000000)
    ],
    'rent-intelligence': [
      select('countryCode', 'Pays', 'DZ', [['DZ', 'Algérie'], ['NG', 'Nigeria']]),
      field('city', 'Ville', 'text', 'Synthetic mdCity'),
      field('propertyType', 'Type de bien', 'text', 'Synthetic mdPropertyType'),
      field('bedrooms', 'Chambres', 'text', 'Synthetic mdBedrooms')
    ],
    'lease-risk-check': [
      select('countryCode', 'Pays du signal', 'DZ', [['DZ', 'Algérie'], ['NG', 'Nigeria']]),
      field('city', 'Ville', 'text', 'Synthetic mdCity'),
      field('minimumRisk', 'Niveau de risque minimal', 'text', 'Synthetic mdMinRisk')
    ],
    'ng-nhf': [
      field('basic', 'Salaire mensuel de base (NGN)', 'number', 350000),
      field('yearsContributed', 'Années de contribution', 'number', 5),
      field('loan', 'Montant du prêt (NGN)', 'number', 15000000),
      field('tenure', 'Durée du prêt (années)', 'number', 15),
      field('gross', 'Salaire mensuel brut (NGN)', 'number', 500000)
    ],
    'tenancy-agreement': [
      field('landlord', 'Bailleur', 'text', 'Synthetic llName'),
      field('tenant', 'Locataire', 'text', 'Synthetic tName'),
      field('property', 'Bien loué', 'text', 'Synthetic propAddress'),
      field('startDate', 'Début du bail', 'date', '2026-08-01'),
      field('rent', 'Loyer et devise', 'text', '1000'),
      field('deposit', 'Dépôt et devise', 'text', '1000')
    ],
    'employment-contract': [
      field('employer', 'Employeur', 'text', 'Synthetic compName'),
      field('employee', 'Salarié', 'text', 'Synthetic empName'),
      field('jobTitle', 'Poste', 'text', 'Synthetic jobTitle'),
      field('salary', 'Salaire et devise', 'text', '1000'),
      field('startDate', 'Date de début', 'date', '2026-08-01'),
      field('probationMonths', 'Période d’essai (mois)', 'number', 3)
    ],
    'cac-checker': [
      field('proposedName', 'Nom proposé', 'text', 'Synthetic bizName'),
      select('entityType', 'Forme visée', 'limited', [['business-name', 'Business Name'], ['limited', 'Limited Company'], ['ngo', 'Incorporated Trustee']]),
      select('regulatedWord', 'Mot réglementé présent', 'no', yesNo)
    ],
    'ip-rights-africa': [
      select('assetType', 'Actif à protéger', 'brand', [['brand', 'Marque et nom'], ['invention', 'Invention'], ['work', 'Œuvre créative'], ['knowhow', 'Savoir-faire']]),
      select('markets', 'Portée', 'national', [['national', 'Un pays'], ['regional', 'Plusieurs pays africains'], ['global', 'International']]),
      select('publicDisclosure', 'Déjà rendu public', 'no', yesNo)
    ],
    'business-registration': [
      select('country', 'Pays', 'NG', COUNTRY_OPTIONS),
      select('entityType', 'Forme envisagée', 'limited', [['sole', 'Entreprise individuelle'], ['limited', 'Société à responsabilité limitée'], ['ngo', 'Organisation sans but lucratif']]),
      field('founders', 'Nombre de fondateurs', 'number', 2),
      select('employees', 'Salariés au démarrage', 'yes', yesNo)
    ],
    'company-type-selector': [
      field('founders', 'Nombre de fondateurs', 'number', 1),
      select('limitedLiability', 'Responsabilité limitée souhaitée', 'yes', yesNo),
      select('outsideInvestment', 'Investisseurs externes prévus', 'yes', yesNo),
      field('annualTurnover', 'Chiffre d’affaires prévu', 'number', 5000000)
    ],
    'nda-generator': [
      field('discloser', 'Partie divulgatrice', 'text', 'Synthetic partyA'),
      field('recipient', 'Partie destinataire', 'text', 'Synthetic partyB'),
      field('purpose', 'Finalité de la divulgation', 'text', 'Synthetic English owner fixture statement.'),
      field('durationMonths', 'Durée de confidentialité (mois)', 'number', 24),
      field('jurisdiction', 'Juridiction à vérifier', 'text', 'Nigeria')
    ],
    'privacy-policy-gen': [
      field('controller', 'Responsable du traitement', 'text', 'Synthetic ppOrgName'),
      field('website', 'Site ou service', 'text', 'Synthetic ppUrl'),
      field('dataCategories', 'Catégories de données', 'text', 'Contact et préférences'),
      field('retention', 'Durée de conservation', 'text', 'Synthetic ppRetention'),
      field('contact', 'Contact droits des personnes', 'text', 'Synthetic ppEmail')
    ],
    'will-generator': [
      field('testator', 'Testateur', 'text', 'Synthetic testatorName'),
      field('executor', 'Exécuteur proposé', 'text', 'Synthetic executorName'),
      field('beneficiary', 'Bénéficiaire', 'text', 'Fatou Exemple'),
      field('asset', 'Bien ou legs', 'text', 'Synthetic residuaryEstate'),
      field('date', 'Date du projet', 'date', '2026-08-01')
    ],
    'ndpa-checker': [
      check('lawfulBasis', 'Base légale et finalité documentées', false),
      check('dpo', 'Responsable ou DPO identifié', false),
      check('dpia', 'DPIA réalisée pour les risques élevés', false),
      check('breach72h', 'Procédure de notification de violation', false)
    ],
    'popia-checker': [
      check('accountability', 'Responsabilité attribuée', false),
      check('purpose', 'Finalité et minimisation documentées', false),
      check('openness', 'Information des personnes assurée', false),
      check('security', 'Mesures de sécurité et notification', false)
    ],
    'child-support': [
      select('country', 'Pays', 'NG', COUNTRY_OPTIONS),
      field('nonCustodialIncome', 'Revenu mensuel du parent non gardien', 'number', 1000),
      field('custodialIncome', 'Revenu mensuel du parent gardien', 'number', 1000),
      field('children', 'Nombre d’enfants', 'number', 1),
      select('custody', 'Organisation de garde', 'sole', [['sole', 'Garde principale'], ['joint', 'Garde conjointe'], ['shared', 'Garde alternée']]),
      select('special', 'Besoins particuliers', 'none', [['none', 'Aucun'], ['medical', 'Médicaux'], ['educational', 'Éducatifs']])
    ],
    'court-fees': [
      select('country', 'Pays', 'NG', COUNTRY_OPTIONS),
      field('claimAmount', 'Montant de la demande', 'number', 1000),
      select('courtLevel', 'Niveau de juridiction', 'magistrate', [['magistrate', 'Magistrate'], ['high', 'Haute cour'], ['appeal', 'Appel']]),
      select('claimType', 'Type de demande', 'debt', [['debt', 'Dette'], ['contract', 'Contrat'], ['injury', 'Préjudice corporel'], ['property', 'Bien'], ['family', 'Famille'], ['other', 'Autre']])
    ],
    'affidavit-generator': [
      field('deponent', 'Déclarant', 'text', 'Synthetic deponentName'),
      field('facts', 'Faits attestés', 'text', 'Synthetic English owner fixture statement.'),
      field('place', 'Lieu de déclaration', 'text', 'Synthetic courtName'),
      field('date', 'Date', 'date', '2026-08-01'),
      field('annexure', 'Pièce jointe mentionnée', 'text', 'Synthetic subject')
    ],
    'annual-returns': [
      select('country', 'Pays', 'NG', COUNTRY_OPTIONS),
      field('anniversaryDate', 'Date anniversaire', 'date', '2026-08-15'),
      select('recordsReady', 'Registres et comptes prêts', 'yes', yesNo),
      select('filingStatus', 'État du dépôt', 'pending', [['pending', 'À préparer'], ['filed', 'Déposé'], ['late', 'En retard']])
    ],
    'bail-calculator': [
      select('country', 'Pays', 'NG', COUNTRY_OPTIONS),
      select('offenceCategory', 'Catégorie d’infraction', 'minor', [['minor', 'Mineure'], ['moderate', 'Intermédiaire'], ['serious', 'Grave']]),
      select('priorRecord', 'Antécédent déclaré', 'no', yesNo),
      select('flightRisk', 'Risque de non-comparution', 'no', yesNo)
    ],
    'board-resolution': [
      field('company', 'Société', 'text', 'Synthetic compName'),
      field('meetingDate', 'Date de réunion', 'date', '2026-08-01'),
      field('decision', 'Décision', 'text', 'Synthetic English owner fixture statement.'),
      field('chair', 'Président de séance', 'text', 'Synthetic chairperson'),
      field('quorum', 'Administrateurs présents', 'number', 3)
    ],
    'breach-notification': [
      field('controller', 'Organisation', 'text', 'Synthetic bOrgName'),
      field('incidentDate', 'Date de l’incident', 'date', '2026-08-01'),
      field('dataTypes', 'Données concernées', 'text', 'Synthetic English owner fixture statement.'),
      field('affected', 'Personnes potentiellement touchées', 'number', 25),
      field('measures', 'Mesures prises', 'text', 'Synthetic English owner fixture statement.')
    ],
    'business-license': [
      select('country', 'Pays', 'NG', COUNTRY_OPTIONS),
      select('activity', 'Activité', 'retail', [['retail', 'Commerce de détail'], ['trade', 'Commerce'], ['services', 'Services'], ['regulated', 'Activité réglementée']]),
      field('municipality', 'Ville ou commune', 'text', 'Dakar'),
      select('premises', 'Local ouvert au public', 'yes', yesNo)
    ],
    'cookie-consent': [
      field('website', 'Site', 'text', 'Synthetic siteName'),
      select('analytics', 'Cookies analytiques', 'yes', yesNo),
      select('marketing', 'Cookies marketing', 'yes', yesNo),
      field('privacyUrl', 'Lien de confidentialité', 'text', '/privacy-policy'),
      field('consentExpiry', 'Durée du consentement (jours)', 'number', 180)
    ],
    'divorce-settlement': [
      select('country', 'Pays', 'NG', COUNTRY_OPTIONS),
      field('totalAssets', 'Total des actifs matrimoniaux', 'number', 1000),
      field('marriageDuration', 'Durée du mariage (années)', 'number', 1000),
      field('children', 'Enfants concernés', 'number', 1000),
      select('custodian', 'Garde principale', 'A', [['A', 'Partie A'], ['B', 'Partie B'], ['shared', 'Garde partagée']]),
      field('partyAName', 'Nom de la partie A', 'text', 'Synthetic partyAName'),
      field('partyAIncome', 'Revenu de la partie A', 'number', 1000),
      field('partyBName', 'Nom de la partie B', 'text', 'Synthetic partyBName'),
      field('partyBIncome', 'Revenu de la partie B', 'number', 1000)
    ],
    'dpa-generator': [
      field('controller', 'Responsable du traitement', 'text', 'Synthetic ctrlName'),
      field('processor', 'Sous-traitant', 'text', 'Synthetic procName'),
      field('purpose', 'Finalité du traitement', 'text', 'Synthetic English owner fixture statement.'),
      field('dataTypes', 'Données traitées', 'text', 'Synthetic dataSubjects'),
      field('duration', 'Durée', 'text', 'Synthetic duration'),
      field('security', 'Mesures de sécurité', 'text', 'Chiffrement et accès limité')
    ],
    'dpia-tool': [
      check('largeScale', 'Traitement à grande échelle'),
      check('sensitiveData', 'Données sensibles concernées'),
      check('systematicMonitoring', 'Surveillance systématique'),
      check('crossBorder', 'Transfert transfrontalier', false),
      field('purpose', 'Finalité évaluée', 'text', 'Scoring locatif de test')
    ],
    'foreign-company-reg': [
      select('country', 'Pays d’accueil', 'NG', COUNTRY_OPTIONS),
      select('presence', 'Présence envisagée', 'branch', [['branch', 'Succursale'], ['subsidiary', 'Filiale'], ['representative', 'Bureau de représentation']]),
      field('homeCountry', 'Pays d’origine', 'text', 'France'),
      select('localHiring', 'Embauche locale prévue', 'yes', yesNo)
    ],
    'gdpr-vs-africa': [
      select('africanLaw', 'Loi africaine', 'NDPA', [['NDPA', 'Nigeria NDPA'], ['POPIA', 'Afrique du Sud POPIA'], ['DPAKE', 'Kenya DPA']]),
      select('topic', 'Sujet comparé', 'breach', [['breach', 'Notification de violation'], ['rights', 'Droits des personnes'], ['transfer', 'Transferts internationaux']]),
      select('euResidents', 'Personnes dans l’UE concernées', 'yes', yesNo)
    ],
    'inheritance-tax': [
      select('country', 'Pays', 'NG', COUNTRY_OPTIONS),
      field('estateValue', 'Valeur brute de la succession', 'number', 1000),
      select('relationship', 'Lien avec le défunt', 'spouse', [['spouse', 'Conjoint'], ['child', 'Enfant'], ['other', 'Autre parent'], ['nonrelative', 'Sans lien de parenté']]),
      field('debts', 'Dettes et passifs', 'number', 1000),
      field('funeralExpenses', 'Frais funéraires', 'number', 1000)
    ],
    'ip-protection': [
      select('asset', 'Actif', 'brand', [['brand', 'Marque'], ['invention', 'Invention'], ['content', 'Contenu'], ['secret', 'Secret commercial']]),
      select('exposure', 'Divulgation publique', 'no', yesNo),
      field('markets', 'Marchés visés', 'text', 'Sénégal et Côte d’Ivoire'),
      select('ownershipDocs', 'Preuves de propriété disponibles', 'yes', yesNo)
    ],
    'legal-aid': [
      select('country', 'Pays', 'NG', COUNTRY_OPTIONS),
      field('monthlyIncome', 'Revenu mensuel', 'number', 1000),
      field('totalAssets', 'Total des actifs', 'number', 1000),
      field('dependants', 'Personnes à charge', 'number', 1000),
      select('matter', 'Type d’affaire', 'criminal', [['criminal', 'Pénale'], ['family', 'Familiale'], ['land', 'Foncier'], ['employment', 'Emploi'], ['civil', 'Civile'], ['other', 'Autre']])
    ],
    'partnership-agreement': [
      field('partnerA', 'Partenaire A', 'text', 'Synthetic partnerA'),
      field('partnerB', 'Partenaire B', 'text', 'Synthetic partnerB'),
      field('business', 'Activité commune', 'text', 'Synthetic English owner fixture statement.'),
      field('contributionA', 'Apport A', 'text', 'XOF 600 000'),
      field('contributionB', 'Apport B', 'text', 'XOF 400 000'),
      field('profitSplit', 'Partage des bénéfices', 'text', '50/50')
    ],
    'power-of-attorney': [
      field('principal', 'Mandant', 'text', 'Synthetic principalName'),
      field('agent', 'Mandataire', 'text', 'Synthetic attorneyName'),
      field('powers', 'Pouvoirs confiés', 'text', 'Synthetic English owner fixture statement.'),
      field('startDate', 'Début', 'date', '2026-08-01'),
      field('endDate', 'Fin', 'date', '2026-12-31'),
      field('jurisdiction', 'Juridiction à vérifier', 'text', 'Nigeria')
    ],
    'shareholder-agreement': [
      field('company', 'Société', 'text', 'Synthetic compName'),
      field('shareholderA', 'Actionnaire A', 'text', 'Synthetic founderA'),
      field('shareholderB', 'Actionnaire B', 'text', 'Synthetic founderB'),
      field('shareA', 'Participation A (%)', 'number', 50),
      field('shareB', 'Participation B (%)', 'number', 50),
      field('reservedMatter', 'Décision réservée', 'text', 'Synthetic English owner fixture statement.')
    ],
    'statutory-declaration': [
      field('declarant', 'Déclarant', 'text', 'Synthetic declarantName'),
      select('purpose', 'Objet', 'name-change', [['name-change', 'Changement de nom'], ['lost-document', 'Document perdu'], ['address', 'Confirmation d’adresse']]),
      field('facts', 'Faits déclarés', 'text', 'Synthetic English owner fixture statement.'),
      field('place', 'Lieu', 'text', 'Dakar'),
      field('date', 'Date', 'date', '2026-08-01')
    ],
    'tin-guide': [
      select('country', 'Pays', 'NG', COUNTRY_OPTIONS),
      select('applicantType', 'Demandeur', 'business', [['individual', 'Particulier'], ['business', 'Entreprise'], ['nonresident', 'Non-résident']]),
      select('registeredBusiness', 'Entreprise déjà immatriculée', 'yes', yesNo),
      select('onlinePreferred', 'Démarche en ligne préférée', 'yes', yesNo)
    ],
    'trademark-registration': [
      select('country', 'Pays principal', 'NG', COUNTRY_OPTIONS),
      select('routeType', 'Voie de dépôt', 'OAPI', [['national', 'Nationale'], ['OAPI', 'OAPI'], ['ARIPO', 'ARIPO']]),
      field('classes', 'Nombre de classes de Nice', 'number', 2),
      select('priorSearch', 'Recherche d’antériorité faite', 'yes', yesNo)
    ],
    'winding-up': [
      select('country', 'Pays', 'NG', COUNTRY_OPTIONS),
      select('routeType', 'Voie envisagée', 'voluntary', [['voluntary', 'Dissolution volontaire'], ['creditors', 'Liquidation par créanciers'], ['strikeoff', 'Radiation administrative']]),
      select('solvent', 'Société solvable', 'yes', yesNo),
      field('employees', 'Salariés concernés', 'number', 4),
      select('taxClearance', 'Quitus fiscal obtenu', 'no', yesNo)
    ]
  };
  const result = schemas[englishId];
  if (!result) throw new Error(`No route-specific fields for ${englishId}`);
  return result;
}

const KINDS = {
  document: new Set(['contract-gen', 'tenancy-agreement', 'employment-contract', 'nda-generator', 'privacy-policy-gen', 'will-generator', 'affidavit-generator', 'board-resolution', 'breach-notification', 'cookie-consent', 'dpa-generator', 'partnership-agreement', 'power-of-attorney', 'shareholder-agreement', 'statutory-declaration']),
  reference: new Set(['leave-days', 'visa-cost', 'rent-intelligence', 'cac-checker', 'ip-rights-africa', 'business-registration', 'company-type-selector', 'annual-returns', 'bail-calculator', 'business-license', 'foreign-company-reg', 'gdpr-vs-africa', 'ip-protection', 'tin-guide', 'trademark-registration', 'winding-up']),
  checklist: new Set(['data-compliance', 'lease-risk-check', 'ndpa-checker', 'popia-checker', 'dpia-tool'])
};

const OWNER_CALCULATORS = new Set([
  'cac-cost', 'cipc-cost', 'tenancy-deposit', 'property-tax', 'ng-nhf',
  'child-support', 'court-fees', 'divorce-settlement', 'inheritance-tax', 'legal-aid'
]);

const WORKFLOW_CONTROLS = {
  'cac-cost': 'Calculer le coût CAC',
  'cipc-cost': 'Calculer le coût CIPC',
  'data-compliance': 'Évaluer la conformité',
  'contract-gen': 'Générer le contrat',
  'tenancy-deposit': 'Calculer le coût d’entrée',
  'leave-days': 'Afficher les droits légaux',
  'visa-cost': 'Comparer le parcours de visa',
  'property-tax': 'Calculer la taxe foncière',
  'rent-intelligence': 'Filtrer les loyers vérifiés',
  'lease-risk-check': 'Filtrer les signaux approuvés',
  'ng-nhf': 'Calculer la contribution et le prêt',
  'tenancy-agreement': 'Générer le projet de bail',
  'employment-contract': 'Générer le contrat de travail',
  'cac-checker': 'Analyser le nom proposé',
  'ip-rights-africa': 'Construire le plan de protection',
  'business-registration': 'Construire le plan de dépôt',
  'company-type-selector': 'Recommander une forme',
  'nda-generator': 'Générer le NDA',
  'privacy-policy-gen': 'Générer la politique',
  'will-generator': 'Générer le projet de testament',
  'ndpa-checker': 'Calculer le score NDPA',
  'popia-checker': 'Calculer le score POPIA',
  'child-support': 'Estimer la contribution',
  'court-fees': 'Calculer les frais de tribunal',
  'affidavit-generator': 'Générer l’affidavit',
  'annual-returns': 'Construire la fiche de déclaration',
  'bail-calculator': 'Afficher la fiche de caution',
  'board-resolution': 'Générer la résolution',
  'breach-notification': 'Générer la notification',
  'business-license': 'Construire le plan de licence',
  'cookie-consent': 'Générer la configuration de consentement',
  'divorce-settlement': 'Calculer le scénario de partage',
  'dpa-generator': 'Générer le DPA',
  'dpia-tool': 'Évaluer le risque DPIA',
  'foreign-company-reg': 'Construire le plan d’implantation',
  'gdpr-vs-africa': 'Comparer les obligations',
  'inheritance-tax': 'Calculer les droits saisis',
  'ip-protection': 'Construire la stratégie PI',
  'legal-aid': 'Pré-évaluer l’éligibilité',
  'partnership-agreement': 'Générer l’accord de partenariat',
  'power-of-attorney': 'Générer la procuration',
  'shareholder-agreement': 'Générer le pacte',
  'statutory-declaration': 'Générer la déclaration',
  'tin-guide': 'Afficher le parcours NIF',
  'trademark-registration': 'Construire le plan de marque',
  'winding-up': 'Construire la checklist de dissolution'
};

function contractFor(englishId) {
  const propertyMode = PROPERTY_MODES[englishId];
  if (propertyMode) {
    const checklist = ['land-title-check', 'tenant-screening', 'building-permit'].includes(englishId);
    return {
      workflowKind: englishId === 'rental-agreement' ? 'document' : checklist ? 'checklist' : 'calculation',
      engineMode: propertyMode,
      fields: presentation.presentFields(englishId, propertyFields(propertyMode)),
      workflowControl: englishId === 'rental-agreement' ? 'Générer le projet de location' : checklist ? 'Évaluer la checklist' : 'Calculer avec mes hypothèses',
      sourceFamily: checklist ? 'property-checklist' : englishId === 'rental-agreement' ? 'property-document' : 'property-user-input'
    };
  }
  if (!MODE_BY_ID[englishId]) throw new Error(`Missing workflow mode for ${englishId}`);
  const kind = KINDS.document.has(englishId) ? 'document' : KINDS.reference.has(englishId) ? 'reference' : KINDS.checklist.has(englishId) ? 'checklist' : 'calculation';
  return {
    workflowKind: kind,
    engineMode: englishId,
    fields: presentation.presentFields(englishId, specialFields(englishId)),
    workflowControl: WORKFLOW_CONTROLS[englishId],
    sourceFamily: OWNER_CALCULATORS.has(englishId) ? 'hard-coded-owner-calculator' : `${kind}-english-owner`
  };
}

module.exports = {
  contractFor,
  MISSING_FRENCH_NAMES,
  MISSING_FRENCH_ROUTES,
  MODE_BY_ID,
  PROPERTY_MODES,
  OWNER_CALCULATORS
};
