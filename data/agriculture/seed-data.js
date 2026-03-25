// /data/agriculture/seed-data.js
// Seed-specific parameters for Africa's major crops — extends crop-database.js
// Used by /engines/seed-rate-engine.js and /agriculture/seed-rate/* pages
!function(){"use strict";

window.AfroTools = window.AfroTools || {};

window.AfroTools.seedData = {

  // ═══════════════════════════════════════
  //  CEREALS
  // ═══════════════════════════════════════

  "maize": {
    seedWeightPer1000: 300,
    seedWeightRange: [250, 400],
    propagation: "seed",
    plantingMethod: ["drilling", "dibbling"],
    defaultSpacing: { row_cm: 75, plant_cm: 25 },
    seedsPerHole: 2,
    typicalSeedRate: { min: 20, max: 25, unit: "kg/ha" },
    bagSize_kg: 25,
    daysToEmergence: [5, 10],
    shelfLife_months: 12,
    storageNotes: "Store in cool, dry place. Keep below 13% moisture. Treat with seed dressing (thiram/metalaxyl). Avoid contact with moisture.",
    countryOverrides: {
      "NG": { spacing: { row_cm: 75, plant_cm: 25 }, seedRate: 20, seedsPerHole: 2 },
      "KE": { spacing: { row_cm: 75, plant_cm: 30 }, seedRate: 25, seedsPerHole: 1 },
      "ZA": { spacing: { row_cm: 91, plant_cm: 20 }, seedRate: 20, seedsPerHole: 1 },
      "ET": { spacing: { row_cm: 75, plant_cm: 30 }, seedRate: 25, seedsPerHole: 1 },
      "GH": { spacing: { row_cm: 80, plant_cm: 40 }, seedRate: 20, seedsPerHole: 2 },
      "EG": { spacing: { row_cm: 70, plant_cm: 25 }, seedRate: 25, seedsPerHole: 1 },
      "TZ": { spacing: { row_cm: 75, plant_cm: 25 }, seedRate: 25, seedsPerHole: 1 },
      "UG": { spacing: { row_cm: 75, plant_cm: 30 }, seedRate: 20, seedsPerHole: 2 },
      "ZM": { spacing: { row_cm: 90, plant_cm: 30 }, seedRate: 22, seedsPerHole: 2 },
      "MW": { spacing: { row_cm: 90, plant_cm: 30 }, seedRate: 20, seedsPerHole: 2 },
      "MZ": { spacing: { row_cm: 90, plant_cm: 30 }, seedRate: 20, seedsPerHole: 2 }
    }
  },

  "rice": {
    seedWeightPer1000: 28,
    seedWeightRange: [22, 38],
    propagation: "seed",
    plantingMethod: ["transplanting", "direct_seeding_broadcast", "direct_seeding_drill"],
    defaultSpacing: { row_cm: 20, plant_cm: 20 },
    seedsPerHole: 3,
    typicalSeedRate: {
      transplanted: { min: 40, max: 60 },
      broadcast: { min: 80, max: 120 },
      drilled: { min: 60, max: 80 }
    },
    bagSize_kg: 25,
    daysToEmergence: [5, 8],
    shelfLife_months: 6,
    storageNotes: "Rice seed viability drops quickly. Use within one season if possible. Store at <14% moisture in sealed containers. Refrigerate if storing longer.",
    nurseryInfo: {
      nurseryArea_m2_per_ha: 500,
      nurseryDays: [21, 30],
      seedForNursery_kg_per_ha: 50
    },
    countryOverrides: {
      "NG": { method: "transplanting", seedRate: 50 },
      "SN": { method: "direct_seeding_drill", seedRate: 80, notes: "Senegal River Valley irrigated scheme" },
      "ML": { method: "transplanting", seedRate: 50, notes: "Office du Niger irrigated" },
      "EG": { method: "transplanting", seedRate: 60, spacing: { row_cm: 20, plant_cm: 15 } },
      "MG": { method: "transplanting", seedRate: 60, notes: "SRI method: 25×25 cm, 1 seedling/hill, 5-8 kg/ha" },
      "TZ": { method: "transplanting", seedRate: 50 },
      "GH": { method: "direct_seeding_broadcast", seedRate: 100 },
      "GN": { method: "direct_seeding_broadcast", seedRate: 100, notes: "Inland valley swamp rice" },
      "CD": { method: "transplanting", seedRate: 60 }
    }
  },

  "sorghum": {
    seedWeightPer1000: 30,
    propagation: "seed",
    plantingMethod: ["drilling", "dibbling", "broadcasting"],
    defaultSpacing: { row_cm: 75, plant_cm: 20 },
    seedsPerHole: 3,
    typicalSeedRate: { min: 8, max: 15, unit: "kg/ha" },
    bagSize_kg: 25,
    daysToEmergence: [4, 8],
    shelfLife_months: 24,
    storageNotes: "Sorghum has excellent shelf life. Store in airtight containers at <12% moisture. Treat with grain protectant if storing >6 months.",
    countryOverrides: {
      "NG": { spacing: { row_cm: 75, plant_cm: 25 }, seedRate: 10 },
      "BF": { spacing: { row_cm: 80, plant_cm: 40 }, seedRate: 8, notes: "Wider spacing in Sahel" },
      "SD": { spacing: { row_cm: 70, plant_cm: 20 }, seedRate: 12 },
      "ET": { spacing: { row_cm: 75, plant_cm: 15 }, seedRate: 10 },
      "ML": { spacing: { row_cm: 80, plant_cm: 30 }, seedRate: 10 },
      "NE": { spacing: { row_cm: 90, plant_cm: 40 }, seedRate: 8, notes: "Sahel semi-arid adaptation" },
      "SO": { spacing: { row_cm: 75, plant_cm: 25 }, seedRate: 10 }
    }
  },

  "millet": {
    seedWeightPer1000: 10,
    propagation: "seed",
    plantingMethod: ["drilling", "dibbling", "broadcasting"],
    defaultSpacing: { row_cm: 75, plant_cm: 25 },
    seedsPerHole: 5,
    typicalSeedRate: { min: 3, max: 8, unit: "kg/ha" },
    bagSize_kg: 10,
    daysToEmergence: [3, 7],
    shelfLife_months: 24,
    storageNotes: "Millet stores well. Keep dry (<12% moisture). Treat with neem leaf powder or ash for local storage. Germination drops after 2 years.",
    countryOverrides: {
      "NE": { spacing: { row_cm: 100, plant_cm: 100 }, seedRate: 5, seedsPerHole: 8, notes: "Traditional wide spacing in Sahel (1m × 1m)" },
      "NG": { spacing: { row_cm: 75, plant_cm: 25 }, seedRate: 5 },
      "ML": { spacing: { row_cm: 100, plant_cm: 50 }, seedRate: 4 },
      "BF": { spacing: { row_cm: 80, plant_cm: 40 }, seedRate: 5 },
      "SD": { spacing: { row_cm: 90, plant_cm: 30 }, seedRate: 5 },
      "GM": { spacing: { row_cm: 90, plant_cm: 30 }, seedRate: 4 },
      "SN": { spacing: { row_cm: 90, plant_cm: 90 }, seedRate: 4, notes: "Sahel traditional spacing" }
    }
  },

  "wheat": {
    seedWeightPer1000: 40,
    propagation: "seed",
    plantingMethod: ["drilling", "broadcasting"],
    defaultSpacing: { row_cm: 20, plant_cm: "continuous" },
    seedsPerHole: 1,
    typicalSeedRate: {
      drilled: { min: 100, max: 130 },
      broadcast: { min: 130, max: 170 }
    },
    bagSize_kg: 50,
    daysToEmergence: [5, 10],
    shelfLife_months: 12,
    storageNotes: "Wheat seed loses viability quickly. Use certified seed within 12 months. Store at <12% moisture, 15°C or below if possible.",
    countryOverrides: {
      "EG": { method: "drilling", seedRate: 120, notes: "Irrigated Nile valley — high-input systems" },
      "ET": { method: "broadcasting", seedRate: 150, notes: "Highland broadcast is traditional practice" },
      "MA": { method: "drilling", seedRate: 120 },
      "KE": { method: "drilling", seedRate: 110, notes: "Rift Valley/Narok wheat belt" },
      "ZA": { method: "drilling", seedRate: 100, notes: "Precision agriculture — GPS-guided" },
      "SD": { method: "drilling", seedRate: 120, notes: "Irrigated Gezira scheme" },
      "DZ": { method: "drilling", seedRate: 120 },
      "TN": { method: "drilling", seedRate: 110 }
    }
  },

  "barley": {
    seedWeightPer1000: 40,
    propagation: "seed",
    plantingMethod: ["broadcasting", "drilling"],
    defaultSpacing: { row_cm: 20, plant_cm: "continuous" },
    seedsPerHole: 1,
    typicalSeedRate: {
      broadcast: { min: 100, max: 140 },
      drilled: { min: 80, max: 110 }
    },
    bagSize_kg: 50,
    daysToEmergence: [5, 10],
    shelfLife_months: 12,
    storageNotes: "Store at low moisture (<12%). Barley is sensitive to high temperatures during storage.",
    countryOverrides: {
      "ET": { seedRate: 125, method: "broadcasting", notes: "Highland areas — major producer" },
      "MA": { seedRate: 100, method: "drilling" },
      "DZ": { seedRate: 100, method: "drilling" },
      "TN": { seedRate: 100, method: "drilling" },
      "ER": { seedRate: 110, method: "broadcasting" }
    }
  },

  "teff": {
    seedWeightPer1000: 0.35,
    propagation: "seed",
    plantingMethod: ["broadcasting"],
    defaultSpacing: null,
    seedsPerHole: 1,
    typicalSeedRate: { min: 3, max: 5, unit: "kg/ha" },
    bagSize_kg: 5,
    daysToEmergence: [2, 5],
    shelfLife_months: 12,
    storageNotes: "Teff seeds are extremely tiny — handle carefully to avoid losses. Store in airtight containers. Mix with sand for even broadcast.",
    notes: "World's smallest cultivated grain. Almost exclusively grown in Ethiopia and Eritrea. Broadcast sowing is traditional. Research recommends 2-3 kg/ha row-planted but farmer adoption is low.",
    countryOverrides: {
      "ET": { seedRate: 5, method: "broadcasting", notes: "Traditional broadcast. Row planting (2-3 kg/ha) gives higher yields but adoption is low" },
      "ER": { seedRate: 5, method: "broadcasting" }
    }
  },

  "fonio": {
    seedWeightPer1000: 0.6,
    propagation: "seed",
    plantingMethod: ["broadcasting"],
    defaultSpacing: null,
    seedsPerHole: 1,
    typicalSeedRate: { min: 5, max: 10, unit: "kg/ha" },
    bagSize_kg: 10,
    daysToEmergence: [3, 5],
    shelfLife_months: 18,
    notes: "Ancient West African grain. Broadcasting is the standard traditional practice. Mix seed with sand for uniform distribution.",
    countryOverrides: {
      "GN": { seedRate: 8 },
      "ML": { seedRate: 7 },
      "BF": { seedRate: 8 },
      "NG": { seedRate: 8, notes: "Plateau State, Kaduna" },
      "SN": { seedRate: 7 },
      "SL": { seedRate: 8 },
      "TG": { seedRate: 7 }
    }
  },

  // ═══════════════════════════════════════
  //  LEGUMES / PULSES
  // ═══════════════════════════════════════

  "groundnut": {
    seedWeightPer1000: 450,
    propagation: "seed",
    plantingMethod: ["drilling", "dibbling"],
    defaultSpacing: { row_cm: 50, plant_cm: 15 },
    seedsPerHole: 2,
    typicalSeedRate: { min: 60, max: 100, unit: "kg/ha" },
    bagSize_kg: 50,
    daysToEmergence: [5, 10],
    shelfLife_months: 6,
    storageNotes: "Shelled groundnut seed has very short viability. Use within one season. Store in cool, dry conditions. Watch for aflatoxin — never plant mouldy seed.",
    notes: "Rate is for shelled weight. If planting in-shell, multiply by 1.5. Spreading types need wider spacing (60×15 cm).",
    countryOverrides: {
      "NG": { spacing: { row_cm: 50, plant_cm: 15 }, seedRate: 80, notes: "Shell before planting" },
      "SN": { spacing: { row_cm: 50, plant_cm: 15 }, seedRate: 90, notes: "Groundnut basin — Senegal's historic cash crop" },
      "ML": { spacing: { row_cm: 40, plant_cm: 15 }, seedRate: 80 },
      "MW": { spacing: { row_cm: 50, plant_cm: 10 }, seedRate: 90, notes: "CG7 variety popular" },
      "GH": { spacing: { row_cm: 40, plant_cm: 10 }, seedRate: 90 },
      "SD": { spacing: { row_cm: 60, plant_cm: 20 }, seedRate: 75 },
      "GM": { spacing: { row_cm: 50, plant_cm: 15 }, seedRate: 85 }
    }
  },

  "cowpea": {
    seedWeightPer1000: 150,
    propagation: "seed",
    plantingMethod: ["drilling", "dibbling"],
    defaultSpacing: { row_cm: 60, plant_cm: 20 },
    seedsPerHole: 2,
    typicalSeedRate: { min: 15, max: 30, unit: "kg/ha" },
    bagSize_kg: 25,
    daysToEmergence: [4, 8],
    shelfLife_months: 12,
    storageNotes: "Cowpea seed viability 1-2 years if stored dry. Treat with insecticide (pirimiphos-methyl) or hermetic bags to prevent weevil damage.",
    notes: "Often intercropped with millet or sorghum in the Sahel. As intercrop, use 50-75% of sole crop rate.",
    countryOverrides: {
      "NE": { seedRate: 20, notes: "Intercropped with millet — use 15 kg/ha as intercrop" },
      "NG": { seedRate: 25, spacing: { row_cm: 60, plant_cm: 20 } },
      "BF": { seedRate: 20 },
      "GH": { seedRate: 25 },
      "BW": { seedRate: 20 },
      "NA": { seedRate: 20 }
    }
  },

  "soybean": {
    seedWeightPer1000: 150,
    propagation: "seed",
    plantingMethod: ["drilling"],
    defaultSpacing: { row_cm: 50, plant_cm: 5 },
    seedsPerHole: 1,
    typicalSeedRate: { min: 60, max: 80, unit: "kg/ha" },
    bagSize_kg: 50,
    daysToEmergence: [5, 10],
    shelfLife_months: 6,
    storageNotes: "Soybean seed loses viability quickly. Use certified seed within 6 months. Inoculate with Bradyrhizobium japonicum before planting for nitrogen fixation.",
    notes: "Inoculate with Bradyrhizobium if first time planting in a field. Never plant old or discoloured seed.",
    countryOverrides: {
      "NG": { seedRate: 70, spacing: { row_cm: 50, plant_cm: 5 } },
      "ZA": { seedRate: 60, spacing: { row_cm: 45, plant_cm: 5 }, notes: "Precision planted — GPS guidance" },
      "ZM": { seedRate: 70 },
      "ZW": { seedRate: 65 },
      "ET": { seedRate: 70 },
      "MW": { seedRate: 70 }
    }
  },

  "common_bean": {
    seedWeightPer1000: 300,
    propagation: "seed",
    plantingMethod: ["drilling", "dibbling"],
    defaultSpacing: { row_cm: 50, plant_cm: 10 },
    seedsPerHole: 2,
    typicalSeedRate: { min: 60, max: 100, unit: "kg/ha" },
    bagSize_kg: 25,
    daysToEmergence: [5, 10],
    shelfLife_months: 12,
    storageNotes: "Store in cool, dry conditions. Hermetic storage prevents weevil damage. Germination drops after 18 months.",
    countryOverrides: {
      "KE": { seedRate: 80, spacing: { row_cm: 50, plant_cm: 10 }, notes: "Climbing: 40×20 cm, Bush: 50×10 cm" },
      "RW": { seedRate: 80, spacing: { row_cm: 40, plant_cm: 10 }, notes: "Major food security crop" },
      "ET": { seedRate: 75, notes: "Haricot bean — Rift Valley and eastern lowlands" },
      "TZ": { seedRate: 80 },
      "UG": { seedRate: 80 },
      "BI": { seedRate: 75 },
      "CD": { seedRate: 80 }
    }
  },

  "pigeon_pea": {
    seedWeightPer1000: 120,
    propagation: "seed",
    plantingMethod: ["drilling", "dibbling"],
    defaultSpacing: { row_cm: 100, plant_cm: 30 },
    seedsPerHole: 3,
    typicalSeedRate: { min: 10, max: 20, unit: "kg/ha" },
    bagSize_kg: 25,
    daysToEmergence: [7, 14],
    shelfLife_months: 18,
    storageNotes: "Pigeon pea seed stores well for 1-2 years if kept dry. Avoid direct sunlight.",
    countryOverrides: {
      "KE": { seedRate: 15, notes: "Eastern/semi-arid counties: Machakos, Kitui, Makueni" },
      "TZ": { seedRate: 12 },
      "MW": { seedRate: 12 },
      "MZ": { seedRate: 15 },
      "IN": { seedRate: 15 }
    }
  },

  "chickpea": {
    seedWeightPer1000: 280,
    propagation: "seed",
    plantingMethod: ["drilling"],
    defaultSpacing: { row_cm: 30, plant_cm: 10 },
    seedsPerHole: 1,
    typicalSeedRate: { min: 80, max: 120, unit: "kg/ha" },
    bagSize_kg: 50,
    daysToEmergence: [7, 12],
    shelfLife_months: 18,
    storageNotes: "Store dry. Chickpea is prone to bruchid weevil damage in storage — use hermetic bags or treat with grain protectant.",
    countryOverrides: {
      "ET": { seedRate: 100, notes: "Desi type in highlands, Kabuli in Rift Valley — major African producer" },
      "TZ": { seedRate: 80 },
      "ER": { seedRate: 90 }
    }
  },

  "lentils": {
    seedWeightPer1000: 35,
    propagation: "seed",
    plantingMethod: ["broadcasting", "drilling"],
    defaultSpacing: { row_cm: 30, plant_cm: 5 },
    seedsPerHole: 1,
    typicalSeedRate: { min: 30, max: 60, unit: "kg/ha" },
    bagSize_kg: 25,
    daysToEmergence: [7, 14],
    shelfLife_months: 24,
    storageNotes: "Lentil seed stores well. Keep below 12% moisture. Viability maintained for 2+ years in good conditions.",
    countryOverrides: {
      "ET": { seedRate: 50, method: "broadcasting", notes: "Highland crop — Africa's major lentil producer" },
      "ER": { seedRate: 45, method: "broadcasting" }
    }
  },

  // ═══════════════════════════════════════
  //  VEGETATIVELY PROPAGATED CROPS
  // ═══════════════════════════════════════

  "cassava": {
    propagation: "vegetative",
    plantingMaterial: "stem_cuttings",
    materialLabel: "stem cuttings",
    cuttingLength_cm: [20, 25],
    plantsPerHa: { min: 10000, max: 12500 },
    defaultSpacing: { row_cm: 100, plant_cm: 100 },
    daysToSprouting: [7, 14],
    notes: "Select healthy, mature stems (8-12 months old). Each plant provides 5-8 cuttings. Plant at 45° angle, 2/3 underground. 250-300 bundles of 40 cuttings per hectare.",
    costBasis: "priced_per_bundle",
    countryOverrides: {
      "NG": { spacing: { row_cm: 100, plant_cm: 100 }, plantsPerHa: 10000, notes: "TME 419, IITA varieties widely planted" },
      "GH": { spacing: { row_cm: 100, plant_cm: 80 }, plantsPerHa: 12500, notes: "Bankye Hemaa, Afisiafi varieties" },
      "TZ": { spacing: { row_cm: 100, plant_cm: 100 }, plantsPerHa: 10000 },
      "MZ": { spacing: { row_cm: 100, plant_cm: 80 }, plantsPerHa: 12500 },
      "CD": { spacing: { row_cm: 100, plant_cm: 100 }, plantsPerHa: 10000 },
      "UG": { spacing: { row_cm: 100, plant_cm: 100 }, plantsPerHa: 10000, notes: "NARO varieties — Narocass 1, Narocass 2" },
      "ET": { spacing: { row_cm: 100, plant_cm: 100 }, plantsPerHa: 10000 }
    }
  },

  "yam": {
    propagation: "vegetative",
    plantingMaterial: "seed_yam_tubers",
    materialLabel: "seed yam tubers",
    tuberWeight_g: [200, 300],
    plantsPerHa: { min: 10000, max: 10000 },
    defaultSpacing: { row_cm: 100, plant_cm: 100 },
    seedYamPerHa_kg: { min: 2000, max: 3000 },
    notes: "Seed yam is 40-60% of total yam production cost — a critical investment. IITA minisett technique: cut tubers into 25-50g pieces, treat with fungicide, reduce seed cost by 60%.",
    countryOverrides: {
      "NG": { seedYamPerHa_kg: 2500, notes: "Seed yam shortage is common — plan ahead. IITA minisett available from ADPs" },
      "GH": { seedYamPerHa_kg: 2000, notes: "Puna, Laribako varieties" },
      "CI": { seedYamPerHa_kg: 2500 },
      "BJ": { seedYamPerHa_kg: 2000 },
      "TG": { seedYamPerHa_kg: 2000 }
    }
  },

  "sweet_potato": {
    propagation: "vegetative",
    plantingMaterial: "vine_cuttings",
    materialLabel: "vine cuttings",
    cuttingLength_cm: [25, 30],
    plantsPerHa: { min: 33000, max: 40000 },
    defaultSpacing: { row_cm: 60, plant_cm: 30 },
    notes: "Cut vines from healthy disease-free mother plants. Each cutting should have 4-5 nodes. Plant 2/3 of cutting underground. Water immediately after planting.",
    countryOverrides: {
      "UG": { spacing: { row_cm: 60, plant_cm: 30 }, plantsPerHa: 33000, notes: "OFSP (Vitamin A) varieties promoted — SPK004 (Kakamega)" },
      "RW": { spacing: { row_cm: 60, plant_cm: 30 }, plantsPerHa: 33000, notes: "Major food crop — Nyamucurunzi, Gihingamukungu" },
      "MW": { spacing: { row_cm: 75, plant_cm: 30 }, plantsPerHa: 44000 },
      "ET": { spacing: { row_cm: 60, plant_cm: 25 }, plantsPerHa: 40000 },
      "TZ": { spacing: { row_cm: 60, plant_cm: 30 }, plantsPerHa: 33000 }
    }
  },

  "potato": {
    propagation: "vegetative",
    plantingMaterial: "seed_tubers",
    materialLabel: "seed tubers",
    tuberWeight_g: [40, 60],
    plantsPerHa: { min: 40000, max: 44000 },
    defaultSpacing: { row_cm: 75, plant_cm: 30 },
    seedTubersPerHa_kg: { min: 2000, max: 2500 },
    notes: "Use certified, virus-free seed tubers. Pre-sprout (chit) for 2-3 weeks before planting. Each tuber should have 2-3 eyes (sprouts). Cut large tubers — treat cuts with ash or fungicide.",
    countryOverrides: {
      "KE": { seedTubersPerHa_kg: 2000, spacing: { row_cm: 75, plant_cm: 30 }, notes: "KALRO certified seed from Tigoni. Shangi, Dutch Robyjn varieties dominate" },
      "ET": { seedTubersPerHa_kg: 2000, spacing: { row_cm: 75, plant_cm: 30 }, notes: "Gudene, Jalenie, Belete varieties" },
      "RW": { seedTubersPerHa_kg: 2000, notes: "ISAR varieties — Kinigi, Gashonga, Kirundo" },
      "ZA": { seedTubersPerHa_kg: 2500, spacing: { row_cm: 90, plant_cm: 25 }, notes: "Commercial: Mondial, Sifra varieties. Precision agriculture" },
      "EG": { seedTubersPerHa_kg: 2500, notes: "Imported seed tubers from Netherlands common for export quality" },
      "TZ": { seedTubersPerHa_kg: 2000 },
      "MG": { seedTubersPerHa_kg: 2000 }
    }
  },

  "plantain": {
    propagation: "vegetative",
    plantingMaterial: "suckers",
    materialLabel: "sword suckers",
    plantsPerHa: { min: 1600, max: 2500 },
    defaultSpacing: { row_cm: 300, plant_cm: 200 },
    notes: "Use sword suckers (1-1.5m tall, 2-4 kg) from healthy mother plants. Pare corm to remove dead roots and damaged tissue. Treat with hot water (52°C for 20 min) to control nematodes and banana weevil.",
    countryOverrides: {
      "GH": { plantsPerHa: 1600, spacing: { row_cm: 300, plant_cm: 200 } },
      "NG": { plantsPerHa: 1600, notes: "High demand in SW Nigeria. Use IITA tissue culture plantlets for disease-free planting" },
      "CM": { plantsPerHa: 2000, notes: "Major export crop — Cameroon is Africa's top plantain producer" },
      "CD": { plantsPerHa: 1600 },
      "CG": { plantsPerHa: 1600 }
    }
  },

  "banana": {
    propagation: "vegetative",
    plantingMaterial: "suckers_or_tissue_culture",
    materialLabel: "suckers / TC plantlets",
    plantsPerHa: { min: 1600, max: 2500 },
    defaultSpacing: { row_cm: 300, plant_cm: 200 },
    notes: "Tissue culture (TC) plantlets give more uniform plants and are disease-free. Higher initial cost but better long-term performance. Suckers from healthy mother plants are the traditional option.",
    countryOverrides: {
      "UG": { plantsPerHa: 1600, notes: "Matooke/East African Highland banana. Suckers traditional, TC expanding via NARO" },
      "KE": { plantsPerHa: 1800, notes: "TC from JKUAT, Kenya Plant Health Inspectorate Service (KEPHIS) certified" },
      "TZ": { plantsPerHa: 1600, notes: "Kagera and Kilimanjaro regions — major production" },
      "RW": { plantsPerHa: 1600 },
      "ET": { plantsPerHa: 1600 }
    }
  },

  "sugar_cane": {
    propagation: "vegetative",
    plantingMaterial: "setts",
    materialLabel: "3-bud setts",
    settsPerHa: { min: 30000, max: 40000 },
    defaultSpacing: { row_cm: 150, plant_cm: 30 },
    notes: "Use 3-bud setts from healthy 8-10 month old cane. Treat setts with hot water (50°C, 30 minutes) to control ratoon stunting disease. Plant setts end-to-end in furrows.",
    countryOverrides: {
      "ZA": { notes: "SASRI certified seed cane. Highly mechanised commercial operations. Varieties: N19, N31" },
      "KE": { notes: "Mumias, Chemelil, West Kenya Sugar Companies provide certified seed cane" },
      "EG": { notes: "Upper Egypt cane zone. 2-bud setts more common in smallholder plots" },
      "SZ": { notes: "Sugar is Eswatini's #1 export. Illovo and RSA Sugar estates manage seed cane" },
      "MG": { notes: "SIRAMA sugar zone. Ambilobe and Morondava regions" }
    }
  },

  "enset": {
    propagation: "vegetative",
    plantingMaterial: "corms",
    materialLabel: "corm divisions",
    plantsPerHa: { min: 1100, max: 1600 },
    defaultSpacing: { row_cm: 250, plant_cm: 250 },
    notes: "Ethiopian unique crop. Takes 4-7 years to mature. Split corms from mother plant. Kocho (starchy fermented product) is a staple for 20+ million Ethiopians in southern highlands.",
    countryOverrides: {
      "ET": { plantsPerHa: 1100, notes: "Grown exclusively in southern Ethiopian highlands — Gurage, Sidama, Hadiya, Wolayita zones" }
    }
  },

  // ═══════════════════════════════════════
  //  CASH CROPS
  // ═══════════════════════════════════════

  "cotton": {
    seedWeightPer1000: 100,
    propagation: "seed",
    plantingMethod: ["drilling", "dibbling"],
    defaultSpacing: { row_cm: 90, plant_cm: 30 },
    seedsPerHole: 3,
    typicalSeedRate: { min: 15, max: 25, unit: "kg/ha" },
    bagSize_kg: 25,
    daysToEmergence: [7, 14],
    shelfLife_months: 12,
    storageNotes: "Cotton seed should be used within the same season. Delinted seed: treat with fungicide before planting. Store away from moisture.",
    countryOverrides: {
      "BF": { seedRate: 20, notes: "SOFITEX provides certified seed — register early before season" },
      "ML": { seedRate: 20, notes: "CMDT cotton company coordinates seed distribution" },
      "BJ": { seedRate: 20, notes: "SONAPRA manages cotton input supply" },
      "TZ": { seedRate: 20, notes: "TANSEED International provides certified seed" },
      "ZM": { seedRate: 18 },
      "ZW": { seedRate: 18 },
      "CI": { seedRate: 20 }
    }
  },

  "sesame": {
    seedWeightPer1000: 3,
    propagation: "seed",
    plantingMethod: ["broadcasting", "drilling"],
    defaultSpacing: { row_cm: 40, plant_cm: 10 },
    seedsPerHole: 1,
    typicalSeedRate: {
      broadcast: { min: 5, max: 8 },
      drilled: { min: 3, max: 5 }
    },
    bagSize_kg: 10,
    daysToEmergence: [3, 7],
    shelfLife_months: 18,
    storageNotes: "Sesame seed is tiny — handle carefully. Mix with dry sand for even broadcast distribution. Store in airtight containers to prevent oil rancidity.",
    countryOverrides: {
      "SD": { seedRate: 5, notes: "Sudan is Africa's #1 sesame producer — Gedaref, Blue Nile, Sennar states" },
      "ET": { seedRate: 4, notes: "Humera, Metema lowlands — major export" },
      "NG": { seedRate: 5, notes: "Nasarawa, Benue, Jigawa states" },
      "TZ": { seedRate: 4 },
      "BF": { seedRate: 5 },
      "ML": { seedRate: 4 }
    }
  },

  "sunflower": {
    seedWeightPer1000: 65,
    propagation: "seed",
    plantingMethod: ["drilling", "dibbling"],
    defaultSpacing: { row_cm: 75, plant_cm: 30 },
    seedsPerHole: 1,
    typicalSeedRate: { min: 5, max: 8, unit: "kg/ha" },
    bagSize_kg: 10,
    daysToEmergence: [5, 10],
    shelfLife_months: 12,
    storageNotes: "Sunflower seed viability drops at high temperatures. Use certified hybrid seed each season for high oil content.",
    countryOverrides: {
      "ZA": { seedRate: 5, spacing: { row_cm: 90, plant_cm: 25 }, notes: "Precision planting — Pioneer, Pannar hybrids" },
      "TZ": { seedRate: 6, spacing: { row_cm: 75, plant_cm: 30 } },
      "UG": { seedRate: 6 },
      "ET": { seedRate: 6 },
      "KE": { seedRate: 6, notes: "Rift Valley production areas" },
      "SD": { seedRate: 5 }
    }
  },

  // ═══════════════════════════════════════
  //  LOCAL CERTIFIED SEED PRICING
  //  (per kg in local currency — updated 2025)
  // ═══════════════════════════════════════
  "seedPricing": {
    "NG": { currency: "NGN", maize: 2500, rice: 3000, sorghum: 1500, millet: 1200, cowpea: 2000, groundnut: 3500, soybean: 2000, common_bean: 2500, sesame: 1800, cotton: 2000, sunflower: 2200 },
    "KE": { currency: "KES", maize: 500, common_bean: 300, wheat: 120, sorghum: 200, soybean: 250, sunflower: 300, cotton: 250, sesame: 200 },
    "ET": { currency: "ETB", teff: 80, wheat: 50, maize: 60, sorghum: 40, barley: 45, chickpea: 70, lentils: 60, common_bean: 55, sesame: 55, sunflower: 50 },
    "GH": { currency: "GHS", maize: 30, rice: 40, cowpea: 25, groundnut: 35, soybean: 30, fonio: 20, sesame: 25 },
    "ZA": { currency: "ZAR", maize: 140, wheat: 240, soybean: 300, sunflower: 160, cotton: 200 },
    "EG": { currency: "EGP", wheat: 15, rice: 20, maize: 18, cotton: 25, barley: 12 },
    "TZ": { currency: "TZS", maize: 3000, rice: 4000, common_bean: 2500, sorghum: 2000, sunflower: 2500, sesame: 2000, cotton: 2500 },
    "UG": { currency: "UGX", maize: 5000, common_bean: 4000, sunflower: 4500, sorghum: 3500, rice: 5000 },
    "SN": { currency: "XOF", groundnut: 1200, millet: 800, rice: 1000, cowpea: 900, sesame: 900 },
    "MA": { currency: "MAD", wheat: 5, barley: 4, maize: 8, sunflower: 10 },
    "SD": { currency: "SDG", sorghum: 500, millet: 450, sesame: 600, groundnut: 700, wheat: 400, cotton: 550 },
    "ML": { currency: "XOF", millet: 700, sorghum: 650, cowpea: 800, groundnut: 900, fonio: 600, cotton: 750, rice: 850 },
    "BF": { currency: "XOF", millet: 700, sorghum: 650, cowpea: 800, sesame: 750, cotton: 800, fonio: 600 },
    "RW": { currency: "RWF", maize: 500, common_bean: 600, sorghum: 400, wheat: 350, rice: 550 },
    "ZM": { currency: "ZMW", maize: 40, soybean: 55, groundnut: 60, cotton: 50, wheat: 35 },
    "MG": { currency: "MGA", rice: 8000, maize: 7000, cowpea: 6000, groundnut: 9000 },
    "ZW": { currency: "ZWG", maize: 25, soybean: 35, wheat: 20, cotton: 28, groundnut: 40 },
    "MW": { currency: "MWK", maize: 2500, common_bean: 2000, groundnut: 3000, soybean: 2500, pigeon_pea: 1800, cotton: 2200 }
  }

};

}();
