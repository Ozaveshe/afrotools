'use strict';

const FAMILY_ALTS = Object.freeze({
  'crop-yield': {
    hub: 'Illustration de l’outil agricole : Rendement des cultures',
    country: 'Illustration du calculateur de rendement',
    separator: ' pour ',
  },
  fertilizer: {
    hub: 'Illustration de l’outil agricole : Engrais NPK',
    country: 'Illustration du calculateur d’engrais NPK',
    separator: ' — ',
  },
  irrigation: {
    hub: 'Illustration de l’outil agricole : Irrigation',
    country: 'Illustration du calculateur d’irrigation',
    separator: ' — ',
  },
  'farm-profit': {
    hub: 'Illustration de l’outil agricole : Rentabilité agricole',
    country: 'Illustration du calculateur de rentabilité agricole',
    separator: ' — ',
  },
  'seed-rate': {
    hub: 'Illustration de l’outil agricole : Semences',
    country: 'Illustration du calculateur de quantité de semences',
    separator: ' — ',
  },
  'fish-farming': {
    hub: 'Illustration de l’outil agricole : Pisciculture',
    country: 'Illustration du calculateur de rentabilité piscicole',
    separator: ' — ',
  },
  greenhouse: {
    hub: 'Illustration de l’outil agricole : Serres',
    country: 'Illustration du calculateur de coût et de rentabilité d’une serre',
    separator: ' — ',
  },
  'cassava-processing': {
    hub: 'Illustration de l’outil agricole : Transformation du manioc',
    country: 'Illustration du calculateur de transformation du manioc',
    separator: ' — ',
  },
  'livestock-feed': {
    hub: 'Illustration de l’outil agricole : Ration animale',
    country: 'Illustration du calculateur de ration animale',
    separator: ' — ',
  },
  'farm-payroll': {
    hub: 'Illustration de l’outil agricole : Paie agricole',
    country: 'Illustration du calculateur de paie agricole',
    separator: ' — ',
  },
  'input-prices': {
    hub: 'Illustration de l’outil agricole : Prix des intrants',
    country: 'Illustration du comparateur de prix des intrants agricoles',
    separator: ' — ',
  },
  'farm-loans': {
    hub: 'Illustration de l’outil agricole : Prêts agricoles',
    country: 'Illustration du calculateur de prêt agricole',
    separator: ' — ',
  },
});

const SINGLETON_ALTS = Object.freeze({
  'planting-calendar': 'Illustration du calendrier de semis et des saisons agricoles',
  'fertilizer-calc': 'Illustration du calcul des besoins en engrais NPK',
  'farm-budget': "Illustration de l’outil agricole : Budget d'exploitation",
  'poultry-roi-calculator': 'Illustration de l’outil agricole : Rentabilité avicole',
  'pesticide-dosage-calculator': 'Illustration de l’outil agricole : Dosage pesticide',
  'soil-ph-calculator': 'Illustration de l’outil agricole : pH du sol',
  'farm-size-converter': 'Illustration de l’outil agricole : Surface agricole',
  'harvest-date-estimator': 'Illustration de l’outil agricole : Date de récolte',
  'coffee-calculator': 'Illustration de l’outil agricole : Café',
  'cocoa-tracker': 'Illustration de l’outil agricole : Cacao',
  'storage-loss': 'Illustration de l’outil agricole : Pertes de stockage',
  'crop-rotation-planner': 'Illustration de l’outil agricole : Rotation des cultures',
  'vaccination-schedule': 'Illustration de l’outil agricole : Vaccination de l’élevage',
  'commodity-prices': 'Illustration de l’outil agricole : Prix agricoles',
  'cooperative-calculator': 'Illustration de l’outil agricole : Répartition coopérative',
  'warehouse-receipt': 'Illustration de l’outil agricole : Récépissé d’entrepôt',
  'agric-profit': 'Illustration du calcul de la marge et du profit agricole',
  'crop-yield': "Illustration de l'estimation du rendement d'une culture",
  'export-docs': 'Illustration de l’outil agricole : Documents d’exportation',
  'tractor-calculator': 'Illustration de l’outil agricole : Calculateur tracteur',
  'crop-insurance': 'Illustration de l’outil agricole : Assurance récolte',
});

function expectedArtworkAlt(row) {
  if (row.family === 'singleton') {
    const singletonAlt = SINGLETON_ALTS[row.english.id];
    if (!singletonAlt) throw new Error(`Missing singleton artwork alt contract: ${row.english.id}`);
    return singletonAlt;
  }
  const familyAlt = FAMILY_ALTS[row.family];
  if (!familyAlt) throw new Error(`Missing family artwork alt contract: ${row.family}`);
  return row.country
    ? `${familyAlt.country}${familyAlt.separator}${row.country.frenchName}`
    : familyAlt.hub;
}

module.exports = {
  FAMILY_ALTS,
  SINGLETON_ALTS,
  expectedArtworkAlt,
};
