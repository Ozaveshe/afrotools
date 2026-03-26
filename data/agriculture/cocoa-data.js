/**
 * cocoa-data.js
 * AfroTools Cocoa Yield & Export Price Tracker — Data Module
 * Source: ICCO 2024/25 season data, Cocoa Barometer 2024, national cocoa boards
 */

var COCOA_DATA = {

  // ═══════════════════════════════════════════════════════
  // PRODUCTION BY COUNTRY (ICCO 2024/25)
  // ═══════════════════════════════════════════════════════
  countries: {
    "CI": {
      name: "Côte d'Ivoire",
      flag: "🇨🇮",
      currency: "XOF",
      currencySymbol: "CFA",
      production_tonnes: 1850000,
      worldShare_pct: 38,
      area_ha: 4000000,
      avgYield_kg_ha: 450,
      potentialYield_kg_ha: 1500,
      farmersCount: 600000,
      avgFarmSize_ha: 3,
      regions: [
        { id: "ci_sw",  name: "South-West (Soubré, San-Pédro)",           share_pct: 40, yield_kg_ha: 500, notes: "Highest producing region" },
        { id: "ci_w",   name: "West (Man, Daloa, Gagnoa)",                 share_pct: 25, yield_kg_ha: 450 },
        { id: "ci_se",  name: "South-East (Abengourou, Agnibilékrou)",     share_pct: 20, yield_kg_ha: 400 },
        { id: "ci_c",   name: "Central (Bouaflé, Yamoussoukro)",           share_pct: 15, yield_kg_ha: 380 }
      ],
      seasons: {
        main: { name: "Main crop (Grande traite)", months: "Oct–Mar", share_pct: 70 },
        mid:  { name: "Mid crop (Petite traite)",  months: "Apr–Sep", share_pct: 30 }
      },
      farmGatePrice_per_kg:  1000,
      exportPrice_per_kg:    4500,
      govBody:       "Conseil du Café-Cacao (CCC)",
      pricingSystem: "Fixed farm-gate price set by government before each season",
      subsidies:     "Subsidized fertilizer and pesticide through CCC. Free seedlings from CNRA.",
      minWageAnnual: 1260000,
      minWageNote:   "SMIG ~105,000 CFA/month",
      diseases:  ["Black pod (Phytophthora megakarya)", "Cocoa Swollen Shoot Virus (CSSV)", "Mirids/Capsids"],
      varieties: ["Forastero (dominant)", "Ghana variety", "Mercedes/improved hybrids from CNRA"]
    },
    "GH": {
      name: "Ghana",
      flag: "🇬🇭",
      currency: "GHS",
      currencySymbol: "GH₵",
      production_tonnes: 600000,
      worldShare_pct: 12,
      area_ha: 1600000,
      avgYield_kg_ha: 400,
      potentialYield_kg_ha: 1500,
      farmersCount: 800000,
      avgFarmSize_ha: 2.5,
      regions: [
        { id: "gh_wr", name: "Western Region (Sefwi, Juabeso)",  share_pct: 55, yield_kg_ha: 450 },
        { id: "gh_ar", name: "Ashanti Region",                    share_pct: 20, yield_kg_ha: 380 },
        { id: "gh_er", name: "Eastern Region",                    share_pct: 15, yield_kg_ha: 350 },
        { id: "gh_br", name: "Brong Ahafo",                       share_pct: 10, yield_kg_ha: 370 }
      ],
      seasons: {
        main:  { name: "Main season", months: "Oct–Mar", share_pct: 70 },
        light: { name: "Light crop",  months: "Jun–Aug", share_pct: 30 }
      },
      farmGatePrice_per_kg:  48,
      exportPrice_per_kg:    150,
      govBody:       "Ghana Cocoa Board (COCOBOD)",
      pricingSystem: "Fixed farm-gate price set by COCOBOD. Target: 70% of FOB price to farmer.",
      subsidies:     "COCOBOD mass spraying programme (free), subsidized fertilizer, hybrid seedlings from CRIG",
      minWageAnnual: 4200,
      minWageNote:   "Minimum wage ~GH₵ 19.97/day (2025)",
      diseases:  ["CSSV (Swollen Shoot — most severe in Ghana)", "Black pod", "Mirids"],
      varieties: ["Amazonia (dominant)", "Hybrid varieties from CRIG", "CRIG Series II"]
    },
    "NG": {
      name: "Nigeria",
      flag: "🇳🇬",
      currency: "NGN",
      currencySymbol: "₦",
      production_tonnes: 350000,
      worldShare_pct: 7,
      area_ha: 1400000,
      avgYield_kg_ha: 300,
      potentialYield_kg_ha: 1500,
      farmersCount: 350000,
      avgFarmSize_ha: 2,
      regions: [
        { id: "ng_ondo",   name: "Ondo State",                            share_pct: 30, yield_kg_ha: 350, notes: "Nigeria's cocoa capital" },
        { id: "ng_cross",  name: "Cross River State",                     share_pct: 20, yield_kg_ha: 320 },
        { id: "ng_osun",   name: "Osun State",                            share_pct: 15, yield_kg_ha: 280 },
        { id: "ng_ogun",   name: "Ogun State",                            share_pct: 10, yield_kg_ha: 300 },
        { id: "ng_ekiti",  name: "Ekiti State",                           share_pct: 10, yield_kg_ha: 270 },
        { id: "ng_others", name: "Others (Edo, Oyo, Kwara, Abia)",        share_pct: 15, yield_kg_ha: 250 }
      ],
      seasons: {
        main:  { name: "Main crop",  months: "Sep–Feb", share_pct: 75 },
        light: { name: "Light crop", months: "Mar–Jun", share_pct: 25 }
      },
      farmGatePrice_per_kg:  3500,
      exportPrice_per_kg:    8000,
      govBody:       "Cocoa Research Institute of Nigeria (CRIN)",
      pricingSystem: "Market-determined — no government price fixing. Middlemen set farm-gate prices.",
      subsidies:     "Limited — CRIN provides improved seedlings. ADP extension services.",
      minWageAnnual: 360000,
      minWageNote:   "National minimum wage ₦30,000/month",
      diseases:  ["Black pod", "Mirids", "CSSV (emerging)", "Rodents"],
      varieties: ["Upper Amazon", "F3 Amazon hybrids", "CRIN TC-series (improved)"]
    },
    "CM": {
      name: "Cameroon",
      flag: "🇨🇲",
      currency: "XAF",
      currencySymbol: "CFA",
      production_tonnes: 320000,
      worldShare_pct: 6.5,
      area_ha: 600000,
      avgYield_kg_ha: 500,
      potentialYield_kg_ha: 1500,
      farmersCount: 400000,
      avgFarmSize_ha: 2,
      regions: [
        { id: "cm_sw", name: "South-West (Meme, Fako, Kupe-Manenguba)",  share_pct: 40, yield_kg_ha: 550 },
        { id: "cm_c",  name: "Centre (Lékié, Nyong-et-Kéllé)",           share_pct: 30, yield_kg_ha: 480 },
        { id: "cm_s",  name: "South (Dja-et-Lobo, Mvila)",               share_pct: 20, yield_kg_ha: 450 },
        { id: "cm_e",  name: "East",                                      share_pct: 10, yield_kg_ha: 400 }
      ],
      seasons: {
        main:  { name: "Main crop", months: "Oct–Feb", share_pct: 70 },
        light: { name: "Light crop", months: "Mar–Jul", share_pct: 30 }
      },
      farmGatePrice_per_kg:  1200,
      exportPrice_per_kg:    5000,
      govBody:       "ONCC (Office National du Cacao et du Café)",
      pricingSystem: "Liberalized market — no fixed price. Reference price published by ONCC.",
      subsidies:     "IRAD research seedlings, limited government input subsidies",
      minWageAnnual: 756000,
      minWageNote:   "SMIG ~63,000 CFA/month",
      diseases:  ["Black pod (P. megakarya — worst in SW Region)", "Mirids", "CSSV"],
      varieties: ["Trinitario (dominant)", "Forastero", "IRAD improved hybrids"]
    },
    "TG": {
      name: "Togo",
      flag: "🇹🇬",
      currency: "XOF",
      currencySymbol: "CFA",
      production_tonnes: 15000,
      worldShare_pct: 0.3,
      area_ha: 50000,
      avgYield_kg_ha: 300,
      potentialYield_kg_ha: 1200,
      farmersCount: 30000,
      avgFarmSize_ha: 1.5,
      regions: [
        { id: "tg_plateaux", name: "Plateaux Region (Kloto, Danyi)", share_pct: 80, yield_kg_ha: 320 },
        { id: "tg_central",  name: "Central Region",                  share_pct: 20, yield_kg_ha: 270 }
      ],
      seasons: {
        main:  { name: "Main crop", months: "Oct–Feb", share_pct: 75 },
        light: { name: "Light crop", months: "Apr–Jun", share_pct: 25 }
      },
      farmGatePrice_per_kg:  900,
      exportPrice_per_kg:    4000,
      govBody:       "ITRA (Institut Togolais de Recherche Agronomique)",
      pricingSystem: "Market-determined. Note: significant smuggling corridor from Ghana attracts cross-border trade.",
      subsidies:     "Limited — ITRA extension support",
      minWageAnnual: 708000,
      minWageNote:   "SMIG ~59,000 CFA/month",
      diseases:  ["Black pod", "Mirids"],
      varieties: ["Local Forastero", "Improved hybrids (limited)"],
      notes:     "Small producer. Significant smuggling corridor from Ghana (higher prices attract cross-border trade)."
    },
    "SL": {
      name: "Sierra Leone",
      flag: "🇸🇱",
      currency: "SLE",
      currencySymbol: "Le",
      production_tonnes: 20000,
      worldShare_pct: 0.4,
      area_ha: 80000,
      avgYield_kg_ha: 250,
      potentialYield_kg_ha: 1000,
      farmersCount: 50000,
      avgFarmSize_ha: 1.5,
      regions: [
        { id: "sl_kenema",   name: "Kenema District",              share_pct: 40, yield_kg_ha: 280 },
        { id: "sl_kailahun", name: "Kailahun District",            share_pct: 30, yield_kg_ha: 260 },
        { id: "sl_others",   name: "Others (Bo, Bonthe, Pujehun)", share_pct: 30, yield_kg_ha: 220 }
      ],
      seasons: {
        main:  { name: "Main crop", months: "Oct–Jan", share_pct: 80 },
        light: { name: "Light crop", months: "Apr–Jun", share_pct: 20 }
      },
      farmGatePrice_per_kg:  18000,
      exportPrice_per_kg:    55000,
      govBody:       "Sierra Leone Produce Marketing Board (SLPMB)",
      pricingSystem: "Market-determined. Post-conflict recovery phase.",
      subsidies:     "SLARI improved seedlings, GoSL rehabilitation grants for replanting",
      minWageAnnual: 6000000,
      minWageNote:   "Minimum wage ~Le 500,000/month",
      diseases:  ["Black pod", "Mirids", "Rodents"],
      varieties: ["Local Forastero (aging trees)", "Improved varieties (SLARI)"],
      notes:     "Post-conflict recovery. Production rebuilding. Quality potential but infrastructure weak."
    }
  },

  // ═══════════════════════════════════════════════════════
  // COCOA AGRONOMICS
  // ═══════════════════════════════════════════════════════
  agronomy: {
    treeLifespan_years: 50,
    productiveYears: { start: 3, peak: 8, decline: 25 },
    treesPerHa: { traditional: 800, recommended: 1100, intensive: 1600 },
    podsPerTree: {
      young_3_5yr:     10,
      productive_8_15yr: 50,
      aging_20_30yr:   25,
      old_above_30yr:  10
    },
    beansPerPod:        35,
    wetBeanWeight_g:   120,
    dryBeanWeight_g:    45,
    fermentationDays:  { min: 5, max: 7 },
    dryingDays:        { sun: [7, 14], mechanical: [2, 3] },

    yieldFactors: {
      treeAge: {
        "young_3_5":    0.20,
        "prime_6_15":   1.00,
        "mature_16_25": 0.75,
        "old_26_35":    0.45,
        "very_old_35p": 0.20
      },
      variety: {
        "local_forastero":    0.70,
        "improved_hybrid":    1.00,
        "high_yielding_clone": 1.30
      },
      management: {
        "no_inputs":           0.50,
        "minimal_pruning":     0.65,
        "moderate_fert_spray": 0.85,
        "full_recommended":    1.00
      },
      shade: {
        "heavy_shade":          0.70,
        "moderate_shade":       1.00,
        "no_shade":             0.80,
        "agroforestry_opt":     1.05
      },
      disease: {
        "no_control":       0.50,
        "some_control":     0.75,
        "good_ipm":         0.90,
        "full_chemical":    0.95
      }
    },

    // Production cost estimates per ha/year (USD, converted at runtime)
    productionCosts_USD_per_ha: {
      labor: {
        pruning:               50,
        weeding:               80,
        harvesting:            60,
        fermentation_drying:   40,
        total:                230
      },
      inputs: {
        fertilizer:            60,
        fungicide:             40,
        insecticide:           30,
        seedlings_replacement: 20,
        total:                150
      },
      tools:     20,
      transport: 30,
      total:    430
    }
  },

  // ═══════════════════════════════════════════════════════
  // QUALITY GRADES & PRICE PREMIUMS
  // ═══════════════════════════════════════════════════════
  qualityGrades: {
    "grade_1": {
      name: "Grade 1 / Superior",
      defects_max_pct: 3,
      moisture_max_pct: 7.5,
      premiumOverBase_pct: 10,
      description: "Well-fermented, uniform brown colour, low defects, good flavour profile"
    },
    "grade_2": {
      name: "Grade 2 / Good Fermented",
      defects_max_pct: 6,
      moisture_max_pct: 8,
      premiumOverBase_pct: 0,
      description: "Standard export quality. Most African cocoa falls here."
    },
    "grade_3": {
      name: "Grade 3 / Fair Fermented",
      defects_max_pct: 10,
      moisture_max_pct: 8,
      premiumOverBase_pct: -5,
      description: "Some defects, under-fermented beans present"
    },
    "substandard": {
      name: "Substandard / Reject",
      defects_max_pct: 999,
      premiumOverBase_pct: -20,
      description: "High defects, mould, insect damage. Sold locally at discount."
    }
  },

  certifications: {
    "none":              { label: "None", premiumPct: 0,  premiumUSD_t: 0 },
    "rainforest":        { label: "Rainforest Alliance / UTZ", premiumPct: 5, premiumUSD_t: 0,   notes: "Most common sustainability cert in West Africa" },
    "fairtrade":         { label: "Fairtrade",                 premiumPct: 0, premiumUSD_t: 240, notes: "Fairtrade minimum price + $240/tonne premium" },
    "organic":           { label: "Organic",                   premiumPct: 30, premiumUSD_t: 0,  notes: "Certification required. Growing demand." }
  },

  // ═══════════════════════════════════════════════════════
  // WORLD PRICE REFERENCE
  // ═══════════════════════════════════════════════════════
  worldPrice: {
    currentPerTonne_USD:          8500,
    historicalRange: { low_2020: 2300, high_2025: 12000 },
    priceDeterminant:             "London (ICE Futures Europe) and New York (ICE Futures US) commodity exchanges",
    livingIncomeRef_USD_per_tonne: 2900,
    lidPremium_USD_per_tonne:      400,
    notes: "Cocoa prices extremely volatile 2023–2026 due to West African supply shortfall. CI & Ghana introduced $400/tonne Living Income Differential (LID) in 2020."
  },

  // Approximate USD exchange rates (used for cost calculations — indicative only)
  usdRates: {
    XOF: 610,
    XAF: 610,
    GHS: 15,
    NGN: 1600,
    SLE: 22000
  }
};
