"use strict";

const REVIEWED_AT = "2026-03-01";

const FRENCH_ENERGY_APPS = Object.freeze([
  {
    id: "electricity-tariff",
    frSlug: "tarifs-electricite",
    title: "Calculateur de tarifs d’électricité",
    description: "Estimez une facture d’électricité avec les tarifs, frais fixes, taxes et paliers du pays sélectionné.",
    intent: "facture",
    reviewedAt: "2026-08-15",
    sourceLabel: "Tarifs officiels actuels par fournisseur et catégorie",
    confidence: "Confiance élevée pour les tarifs automatiques qui passent le contrôle de fraîcheur",
  },
  {
    id: "solar-roi",
    frSlug: "roi-solaire",
    title: "Calculateur de rentabilité solaire",
    description: "Comparez solaire, batterie, réseau et générateur avec investissement, économies, financement et délai de retour.",
    intent: "solaire",
  },
  {
    id: "prepaid-meter",
    buildSourceId: "electricity-tariff",
    standaloneLocalizedAlias: true,
    frSlug: "compteur-prepaye",
    title: "Calculateur de compteur prépayé",
    description: "Estimez les kWh, frais, taxes et jours d’autonomie obtenus avec une recharge prépayée.",
    intent: "facture",
    reviewedAt: "2026-08-15",
    sourceLabel: "Tarifs officiels actuels par fournisseur et catégorie",
    confidence: "Confiance élevée pour les tarifs automatiques qui passent le contrôle de fraîcheur",
  },
  {
    id: "solar-vs-generator",
    frSlug: "solaire-vs-generateur",
    title: "Comparateur solaire ou générateur",
    description: "Comparez le coût total du solaire et du générateur avec carburant, entretien, batterie et financement.",
    intent: "comparaison",
  },
  {
    id: "electricity-bill-verify",
    frSlug: "verifier-facture-electricite",
    title: "Vérificateur de facture d’électricité",
    description: "Contrôlez les relevés, tarifs, frais et écarts d’une facture d’électricité avant réclamation.",
    intent: "facture",
  },
  {
    id: "water-bill",
    frSlug: "calculateur-facture-eau",
    title: "Calculateur de facture d’eau",
    description: "Estimez une facture d’eau à partir du volume, des paliers, des frais fixes et des taxes locales.",
    intent: "eau",
  },
  {
    id: "gas-lpg-cost",
    frSlug: "cout-gaz-lpg",
    title: "Calculateur du coût du gaz GPL",
    description: "Estimez le coût mensuel du gaz GPL selon la bouteille, la recharge, la consommation et le pays.",
    intent: "cuisson",
  },
  {
    id: "paygo-solar",
    frSlug: "solaire-paygo",
    title: "Calculateur solaire PayGo",
    description: "Comparez acompte, mensualités, durée, coût total et option d’achat d’une offre solaire PayGo.",
    intent: "solaire",
  },
  {
    id: "outage-cost",
    frSlug: "cout-coupure-entreprise",
    title: "Estimateur du coût des coupures",
    description: "Estimez les ventes perdues, salaires improductifs, pertes de stock et coûts de secours pendant les coupures.",
    intent: "entreprise",
  },
  {
    id: "solar-sizing",
    frSlug: "dimensionnement-solaire",
    title: "Calculateur de dimensionnement solaire",
    description: "Dimensionnez panneaux, batterie et onduleur à partir des appareils, heures d’usage et hypothèses solaires locales.",
    intent: "dimensionnement",
  },
  {
    id: "battery-sizing",
    frSlug: "dimensionnement-batterie-onduleur",
    title: "Dimensionnement batterie et onduleur",
    description: "Estimez la batterie utile, l’onduleur et l’autonomie avec rendement, profondeur de décharge et marge de sécurité.",
    intent: "dimensionnement",
  },
  {
    id: "energy-audit",
    frSlug: "audit-energie-maison",
    title: "Audit énergétique du logement",
    description: "Inventoriez les appareils, estimez la consommation et classez les économies d’énergie possibles.",
    intent: "audit",
  },
  {
    id: "appliance-power",
    frSlug: "consommation-appareils",
    title: "Calculateur de consommation des appareils",
    description: "Calculez watts, kWh, coût d’usage et charge de pointe pour les appareils du logement ou de l’entreprise.",
    intent: "audit",
  },
  {
    id: "backup-duration",
    frSlug: "autonomie-secours",
    title: "Calculateur d’autonomie de secours",
    description: "Estimez l’autonomie d’une batterie ou d’un onduleur selon la charge, le rendement et la capacité utile.",
    intent: "secours",
  },
  {
    id: "diesel-vs-solar-farm",
    frSlug: "diesel-vs-solaire-ferme",
    title: "Diesel ou solaire pour l’exploitation agricole",
    description: "Comparez pompage diesel et solaire avec carburant, entretien, production, investissement et retour.",
    intent: "agriculture",
  },
  {
    id: "mini-grid-feasibility",
    frSlug: "faisabilite-mini-reseau",
    title: "Étude de faisabilité d’un mini-réseau",
    description: "Estimez demande, capacité, coûts, tarif d’équilibre et viabilité d’un mini-réseau communautaire.",
    intent: "entreprise",
  },
  {
    id: "carbon-footprint-energy",
    frSlug: "empreinte-carbone-energie",
    title: "Empreinte carbone de l’énergie",
    description: "Estimez les émissions du réseau, du diesel et de l’essence avec facteurs clairement affichés.",
    intent: "climat",
  },
  {
    id: "ev-charging",
    frSlug: "cout-recharge-ev",
    title: "Calculateur du coût de recharge d’un véhicule électrique",
    description: "Estimez énergie, coût par recharge, coût mensuel et comparaison avec un véhicule thermique.",
    intent: "mobilite",
  },
  {
    id: "biogas-roi",
    frSlug: "roi-biogaz",
    title: "Calculateur de rentabilité du biogaz",
    description: "Estimez production de biogaz, économies de combustible, coûts d’installation et délai de retour.",
    intent: "cuisson",
  },
  {
    id: "generator-fuel",
    frSlug: "carburant-generateur",
    title: "Calculateur de carburant pour générateur",
    description: "Estimez litres, coût quotidien et mensuel, entretien et coût du kWh selon le générateur et le pays.",
    intent: "secours",
  },
].map((app) => Object.freeze({
  ...app,
  enRoute: `/tools/${app.id}/`,
  sourceRoute: `/tools/${app.buildSourceId || app.id}/`,
  frRoute: `/fr/tools/${app.frSlug}/`,
  image: `/assets/img/tools/${app.id}.webp`,
  reviewedAt: app.reviewedAt || REVIEWED_AT,
  sourceLabel: app.sourceLabel || "Registre de formules et références énergie AfroTools",
  confidence: app.confidence || "Indication de planification — vérification locale requise",
})));

function findFrenchEnergyApp(id) {
  return FRENCH_ENERGY_APPS.find((app) => app.id === id) || null;
}

module.exports = {
  FRENCH_ENERGY_APPS,
  REVIEWED_AT,
  findFrenchEnergyApp,
};
