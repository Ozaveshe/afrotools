'use strict';

const FAMILY_ACTIONS = Object.freeze({
  'crop-yield': {
    form: '#yieldForm',
    submitName: 'Calculer l’estimation',
    result: '#resultPanel',
  },
  fertilizer: {
    form: '#fertilizerForm',
    submitName: 'Calculer les besoins NPK',
    result: '#resultPanel',
  },
  irrigation: {
    form: '#irrigationForm',
    submitName: 'Calculer les besoins en eau',
    result: '#resultPanel',
  },
  'farm-profit': {
    form: '#profitForm',
    submitName: 'Calculer le bénéfice ou la perte',
    result: '#resultPanel',
  },
  'seed-rate': {
    form: '#seedForm',
    submitName: 'Calculer la quantité',
    result: '#resultPanel',
  },
  'fish-farming': {
    form: '#fishForm',
    submitName: 'Calculer la rentabilité',
    result: '#resultPanel',
  },
  greenhouse: {
    form: '#greenhouseForm',
    submitName: 'Calculer le coût et le ROI',
    result: '#resultPanel',
  },
  'cassava-processing': {
    form: '#cassavaForm',
    submitName: 'Calculer le bénéfice',
    result: '#resultPanel',
  },
  'livestock-feed': {
    form: '#feedForm',
    submitName: 'Formuler la ration',
    result: '#resultPanel',
  },
  'farm-payroll': {
    form: '#payrollForm',
    submitName: 'Calculer la paie',
    result: '#resultPanel',
  },
  'input-prices': {
    form: '#inputPricesForm',
    submitName: 'Comparer les prix',
    result: '#resultPanel',
  },
  'farm-loans': {
    form: '#loanForm',
    submitName: 'Vérifier mon éligibilité',
    result: '#resultPanel',
  },
});

const SINGLETON_ACTIONS = Object.freeze({
  'planting-calendar': {
    form: '#plantingForm',
    submitName: 'Générer le calendrier',
    result: '#plantingResults',
  },
  'fertilizer-calc': {
    form: '#fertForm',
    submitName: 'Calculer les besoins',
    result: '#fertActionsPanel',
  },
  'farm-budget': {
    form: '#budgetForm',
    submitName: 'Calculer le budget',
    result: '#resultPanel',
    prepare: [{ type: 'select-index', label: 'Pays', index: 1 }],
  },
  'poultry-roi-calculator': {
    form: '#poultryForm',
    submitName: 'Calculer la rentabilité',
    result: '#resultPanel',
    prepare: [{ type: 'select-index', label: 'Pays', index: 1 }],
  },
  'pesticide-dosage-calculator': {
    form: '#dosageForm',
    submitName: 'Calculer la dose',
    result: '#resultPanel',
    prepare: [
      { type: 'select-index', label: 'Produit', index: 1 },
      { type: 'fill', label: 'Surface (ha)', value: '1' },
    ],
  },
  'soil-ph-calculator': {
    form: '#soilForm',
    submitName: 'Calculer le besoin',
    result: '#resultPanel',
    prepare: [{ type: 'fill', label: 'pH actuel du sol', value: '6' }],
  },
  'farm-size-converter': {
    form: '#farmSizeForm',
    submitName: 'Convertir',
    result: '#resultPanel',
  },
  'harvest-date-estimator': {
    form: '#harvestForm',
    submitName: 'Estimer la date',
    result: '#resultPanel',
  },
  'coffee-calculator': {
    form: '#yieldForm',
    submitName: 'Calculer rendement et revenu',
    result: '#resultPanel',
  },
  'cocoa-tracker': {
    form: '#cocoaForm',
    submitName: 'Calculer la performance cacao',
    result: '#resultPanel',
  },
  'storage-loss': {
    form: '#storageForm',
    submitName: 'Estimer les pertes',
    result: '#resultPanel',
  },
  'crop-rotation-planner': {
    form: '#rotationForm',
    submitName: 'Générer la rotation',
    result: '#resultPanel',
    prepare: [
      { type: 'select-index', label: 'Pays', index: 1 },
      { type: 'select-index', label: 'Culture actuelle ou précédente', index: 1 },
    ],
  },
  'vaccination-schedule': {
    form: '#vaccinationForm',
    submitName: 'Générer le calendrier',
    result: '#resultPanel',
  },
  'commodity-prices': {
    form: '#priceForm',
    submitName: 'Afficher le scénario',
    result: '#resultPanel',
  },
  'cooperative-calculator': {
    form: '#coopForm',
    submitName: 'Calculer ma part',
    result: '#resultPanel',
  },
  'warehouse-receipt': {
    form: '#wrsForm',
    submitName: 'Comparer les scénarios',
    result: '#resultPanel',
  },
  'agric-profit': {
    form: '#farmForm',
    submitName: 'Calculer le profit',
    result: '#profitSummary',
  },
  'crop-yield': {
    form: '#yieldForm',
    submitName: 'Calculer rendement et profit',
    result: '#yieldSummary',
  },
  'export-docs': {
    action: 'select-index',
    selector: '#country',
    label: 'Pays',
    index: 1,
    result: '#resultPanel',
  },
  'tractor-calculator': {
    form: '#tractorForm',
    submitName: 'Comparer achat, location et financement',
    result: '#resultPanel',
  },
  'crop-insurance': {
    form: '#insuranceForm',
    submitName: 'Estimer la prime et la part à charge',
    result: '#resultPanel',
  },
});

function isResultCapable(row) {
  return row.family === 'singleton' || Boolean(row.country);
}

function resultActionContract(row) {
  const contract = row.family === 'singleton'
    ? SINGLETON_ACTIONS[row.english.id]
    : FAMILY_ACTIONS[row.family];
  if (!contract) {
    throw new Error(`Missing French Agriculture result action contract: ${row.french.route}`);
  }
  return contract;
}

module.exports = {
  FAMILY_ACTIONS,
  SINGLETON_ACTIONS,
  isResultCapable,
  resultActionContract,
};
