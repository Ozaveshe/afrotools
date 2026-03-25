// /data/agriculture/aquaculture-data.js
// AfroTools Fish Farming ROI Calculator — Aquaculture Data
// Countries: NG, KE, ZA, GH, EG, ET, TZ, UG, RW, CI, CM, SN, MA, TN, AO

(function () {
  'use strict';

  // ─── SPECIES DATA ─────────────────────────────────────────────────────────
  var SPECIES = {

    catfish: {
      id: 'catfish',
      name: 'African Catfish',
      scientificName: 'Clarias gariepinus',
      icon: '🐟',
      localNames: { NG: 'Eja aro (Yoruba), Tarwada (Hausa)', GH: 'Catfish', UG: 'Emale', KE: 'Kamongo', TZ: 'Kambale', CM: 'Poisson-chat', CI: 'Silure', SN: 'Silure africain' },
      growthProfile: { 1: 50, 2: 150, 3: 300, 4: 500, 5: 700, 6: 900, 7: 1050, 8: 1200 },
      marketSize_kg: { min: 0.7, typical: 1.0, premium: 1.5 },
      growOutPeriod_months: { min: 5, typical: 6, max: 8 },
      feedConversionRatio: { excellent: 1.2, good: 1.5, average: 1.8, poor: 2.5 },
      feedProtein_pct: { fingerling: 42, juvenile: 35, growout: 30, broodstock: 35 },
      feedingRate_pct_bw: { fingerling: 5.0, juvenile: 3.0, growout: 2.0, finishing: 1.5 },
      stockingDensity: {
        earthen_pond: { low: 5, medium: 10, high: 20 },
        concrete_tank: { low: 20, medium: 40, high: 80 },
        tarpaulin_tank: { low: 15, medium: 30, high: 50 },
        cage: { low: 10, medium: 20, high: 40 }
      },
      survivalRate_pct: { good: 85, average: 75, poor: 60 },
      optimalTemp_C: { min: 25, optimal: 28, max: 32 },
      notes: 'Hardiest fish for African conditions. Tolerates poor water quality. Breathes air (labyrinth organ). Raised in concrete tanks, tarpaulin ponds, or earthen ponds.'
    },

    tilapia: {
      id: 'tilapia',
      name: 'Nile Tilapia',
      scientificName: 'Oreochromis niloticus',
      icon: '🐠',
      localNames: { KE: 'Ngege / Sato', EG: 'Bolti', GH: 'Tilapia', NG: 'Eja (Yoruba)', TZ: 'Sato', UG: 'Nkeje', MA: 'Tilapia du Nil', TN: 'Tilapia' },
      growthProfile: { 1: 20, 2: 60, 3: 120, 4: 200, 5: 280, 6: 350, 7: 400, 8: 450 },
      marketSize_kg: { min: 0.25, typical: 0.35, premium: 0.5 },
      growOutPeriod_months: { min: 5, typical: 6, max: 8 },
      feedConversionRatio: { excellent: 1.4, good: 1.6, average: 1.8, poor: 2.2 },
      feedProtein_pct: { fingerling: 35, juvenile: 30, growout: 25, broodstock: 30 },
      feedingRate_pct_bw: { fingerling: 5.0, juvenile: 3.0, growout: 2.0, finishing: 1.5 },
      stockingDensity: {
        earthen_pond: { low: 2, medium: 4, high: 8 },
        concrete_tank: { low: 15, medium: 30, high: 60 },
        tarpaulin_tank: { low: 10, medium: 20, high: 40 },
        cage: { low: 20, medium: 50, high: 100 }
      },
      survivalRate_pct: { good: 90, average: 80, poor: 65 },
      optimalTemp_C: { min: 22, optimal: 28, max: 34 },
      breedingNote: 'Use all-male populations to prevent overcrowding. Hand-sexed or hormone-reversed. Critical management step.',
      notes: 'World\'s 2nd most farmed fish. Egypt is Africa\'s #1 producer. Kenya (Victory Farms) and Ghana growing fast.'
    },

    trout: {
      id: 'trout',
      name: 'Rainbow Trout',
      scientificName: 'Oncorhynchus mykiss',
      icon: '🐡',
      localNames: { ZA: 'Trout', KE: 'Trout', ET: 'Trout', MA: 'Truite arc-en-ciel' },
      growthProfile: { 1: 30, 2: 80, 3: 150, 4: 220, 5: 300, 6: 380, 7: 450, 8: 520, 9: 580, 10: 630 },
      marketSize_kg: { min: 0.25, typical: 0.35, premium: 0.5 },
      growOutPeriod_months: { min: 8, typical: 10, max: 12 },
      feedConversionRatio: { excellent: 1.2, good: 1.4, average: 1.6, poor: 2.0 },
      feedProtein_pct: { fingerling: 50, juvenile: 45, growout: 40, broodstock: 45 },
      feedingRate_pct_bw: { fingerling: 4.0, juvenile: 2.5, growout: 1.8, finishing: 1.2 },
      stockingDensity: {
        earthen_pond: { low: 5, medium: 10, high: 20 },
        concrete_tank: { low: 20, medium: 40, high: 80 },
        tarpaulin_tank: { low: 10, medium: 20, high: 40 },
        cage: { low: 15, medium: 30, high: 60 }
      },
      survivalRate_pct: { good: 92, average: 82, poor: 68 },
      optimalTemp_C: { min: 10, optimal: 15, max: 18 },
      notes: 'Cold water ONLY. Viable above 1500m altitude. South Africa (Mpumalanga, KZN), Kenya (Mt Kenya), Ethiopia (highlands), Morocco (Atlas). Requires clean, cold, oxygen-rich water.'
    }
  };

  // ─── COUNTRY COST DATA ────────────────────────────────────────────────────
  var COSTS = {

    NG: {
      currency: 'NGN', symbol: '₦',
      dominantSpecies: ['catfish', 'tilapia'],
      fingerling: { catfish: 50, tilapia: 30 },
      feed_per_kg: { imported: 900, local_float: 600, local_sink: 400, farm_made: 250 },
      selling_per_kg: { catfish_live: 2500, catfish_smoked: 4500, catfish_dried: 5000, tilapia_fresh: 2000, tilapia_smoked: 3800 },
      labor_per_day: 3500,
      labor_days_cycle: 90,
      electricity_monthly: 25000,
      water_monthly: 8000,
      medications_cycle: 15000,
      transport_per_kg: 80,
      infrastructure: { earthen_pond_m2: 5000, concrete_tank_m2: 25000, tarpaulin_1000L: 30000, tarpaulin_5000L: 80000, borehole: 500000, pump: 120000, aerator: 45000, nets_scales: 25000 },
      infra_lifespan_years: { earthen_pond: 10, concrete_tank: 20, tarpaulin: 3, equipment: 5 },
      processing_cost_pct: 12,
      notes: 'Africa\'s #1 catfish producer. 1M+ catfish farmers. Demand consistently exceeds supply. Tarpaulin tanks popular in urban areas.'
    },

    KE: {
      currency: 'KES', symbol: 'KSh',
      dominantSpecies: ['tilapia', 'catfish', 'trout'],
      fingerling: { tilapia: 10, catfish: 15, trout: 30 },
      feed_per_kg: { imported: 150, local_float: 120, local_sink: 80, farm_made: 50 },
      selling_per_kg: { tilapia_fresh: 450, tilapia_fillet: 700, catfish_fresh: 400, trout_fresh: 800, trout_smoked: 1400 },
      labor_per_day: 600,
      labor_days_cycle: 90,
      electricity_monthly: 5000,
      water_monthly: 2000,
      medications_cycle: 3000,
      transport_per_kg: 15,
      infrastructure: { earthen_pond_m2: 800, concrete_tank_m2: 5000, tarpaulin_1000L: 8000, tarpaulin_5000L: 18000, borehole: 120000, pump: 25000, aerator: 12000, nets_scales: 6000 },
      infra_lifespan_years: { earthen_pond: 10, concrete_tank: 20, tarpaulin: 3, equipment: 5 },
      processing_cost_pct: 10,
      notes: 'Government Fish Farming Programme built 69,000 ponds. Victory Farms (Lake Victoria cages) is Africa\'s largest tilapia producer. Trout farming in highlands.'
    },

    ZA: {
      currency: 'ZAR', symbol: 'R',
      dominantSpecies: ['tilapia', 'trout', 'catfish'],
      fingerling: { tilapia: 2, trout: 5, catfish: 3 },
      feed_per_kg: { imported: 30, local_float: 20, local_sink: 15, farm_made: 10 },
      selling_per_kg: { tilapia_fresh: 45, tilapia_fillet: 80, trout_fresh: 90, trout_smoked: 160, catfish_fresh: 40 },
      labor_per_day: 400,
      labor_days_cycle: 90,
      electricity_monthly: 800,
      water_monthly: 300,
      medications_cycle: 600,
      transport_per_kg: 3,
      infrastructure: { earthen_pond_m2: 200, concrete_tank_m2: 1200, tarpaulin_1000L: 1500, tarpaulin_5000L: 4000, borehole: 30000, pump: 8000, aerator: 4000, nets_scales: 2000 },
      infra_lifespan_years: { earthen_pond: 10, concrete_tank: 20, tarpaulin: 3, equipment: 5 },
      processing_cost_pct: 8,
      notes: 'RAS (Recirculating Aquaculture Systems) growing. Trout in KZN/Mpumalanga highlands. Strong retail/restaurant market for trout.'
    },

    GH: {
      currency: 'GHS', symbol: 'GH₵',
      dominantSpecies: ['tilapia', 'catfish'],
      fingerling: { tilapia: 1, catfish: 2 },
      feed_per_kg: { imported: 18, local_float: 12, local_sink: 8, farm_made: 5 },
      selling_per_kg: { tilapia_fresh: 35, tilapia_fillet: 60, catfish_fresh: 32, catfish_smoked: 55 },
      labor_per_day: 50,
      labor_days_cycle: 90,
      electricity_monthly: 200,
      water_monthly: 80,
      medications_cycle: 150,
      transport_per_kg: 1.5,
      infrastructure: { earthen_pond_m2: 80, concrete_tank_m2: 800, tarpaulin_1000L: 1200, tarpaulin_5000L: 3000, borehole: 8000, pump: 2000, aerator: 1200, nets_scales: 600 },
      infra_lifespan_years: { earthen_pond: 10, concrete_tank: 20, tarpaulin: 3, equipment: 5 },
      processing_cost_pct: 10,
      notes: 'Lake Volta cage culture growing. Yalelo and other operators expanding. Feed cost is primary challenge. Tilapia demand strong.'
    },

    EG: {
      currency: 'EGP', symbol: 'E£',
      dominantSpecies: ['tilapia', 'catfish'],
      fingerling: { tilapia: 1, catfish: 2 },
      feed_per_kg: { imported: 35, local_float: 22, local_sink: 16, farm_made: 12 },
      selling_per_kg: { tilapia_fresh: 55, tilapia_fillet: 95, catfish_fresh: 65, catfish_smoked: 110 },
      labor_per_day: 200,
      labor_days_cycle: 90,
      electricity_monthly: 800,
      water_monthly: 250,
      medications_cycle: 500,
      transport_per_kg: 4,
      infrastructure: { earthen_pond_m2: 300, concrete_tank_m2: 2500, tarpaulin_1000L: 3500, tarpaulin_5000L: 9000, borehole: 40000, pump: 12000, aerator: 6000, nets_scales: 2500 },
      infra_lifespan_years: { earthen_pond: 10, concrete_tank: 20, tarpaulin: 3, equipment: 5 },
      processing_cost_pct: 9,
      notes: 'Africa\'s #1 aquaculture producer — 1.6M tonnes/year. Nile Delta fish farms. Government policy supports expansion. Tilapia production dominates.'
    },

    ET: {
      currency: 'ETB', symbol: 'Br',
      dominantSpecies: ['tilapia', 'trout'],
      fingerling: { tilapia: 6, catfish: 8, trout: 18 },
      feed_per_kg: { imported: 55, local_float: 42, local_sink: 30, farm_made: 20 },
      selling_per_kg: { tilapia_fresh: 130, tilapia_fillet: 220, trout_fresh: 280, trout_smoked: 480, catfish_fresh: 110 },
      labor_per_day: 350,
      labor_days_cycle: 90,
      electricity_monthly: 1200,
      water_monthly: 400,
      medications_cycle: 800,
      transport_per_kg: 8,
      infrastructure: { earthen_pond_m2: 600, concrete_tank_m2: 5500, tarpaulin_1000L: 7000, tarpaulin_5000L: 16000, borehole: 80000, pump: 20000, aerator: 10000, nets_scales: 5000 },
      infra_lifespan_years: { earthen_pond: 10, concrete_tank: 20, tarpaulin: 3, equipment: 5 },
      processing_cost_pct: 11,
      notes: 'Lake Tana and Rift Valley lakes support tilapia. Highland areas (>1500m) support trout. Government aquaculture development program expanding.'
    },

    TZ: {
      currency: 'TZS', symbol: 'TSh',
      dominantSpecies: ['tilapia', 'catfish'],
      fingerling: { tilapia: 200, catfish: 300 },
      feed_per_kg: { imported: 3500, local_float: 2500, local_sink: 1800, farm_made: 1100 },
      selling_per_kg: { tilapia_fresh: 9000, tilapia_fillet: 15000, catfish_fresh: 8000, catfish_smoked: 13000 },
      labor_per_day: 12000,
      labor_days_cycle: 90,
      electricity_monthly: 120000,
      water_monthly: 40000,
      medications_cycle: 80000,
      transport_per_kg: 250,
      infrastructure: { earthen_pond_m2: 25000, concrete_tank_m2: 220000, tarpaulin_1000L: 280000, tarpaulin_5000L: 650000, borehole: 3500000, pump: 800000, aerator: 400000, nets_scales: 200000 },
      infra_lifespan_years: { earthen_pond: 10, concrete_tank: 20, tarpaulin: 3, equipment: 5 },
      processing_cost_pct: 10,
      notes: 'Lake Victoria, Lake Tanganyika and Lake Nyasa support production. Government hatcheries provide fingerlings. Growing export market to Dar es Salaam restaurants.'
    },

    UG: {
      currency: 'UGX', symbol: 'USh',
      dominantSpecies: ['tilapia', 'catfish'],
      fingerling: { tilapia: 300, catfish: 500 },
      feed_per_kg: { imported: 4500, local_float: 3200, local_sink: 2200, farm_made: 1400 },
      selling_per_kg: { tilapia_fresh: 13000, tilapia_fillet: 22000, catfish_fresh: 11000, catfish_smoked: 18000 },
      labor_per_day: 15000,
      labor_days_cycle: 90,
      electricity_monthly: 150000,
      water_monthly: 50000,
      medications_cycle: 100000,
      transport_per_kg: 300,
      infrastructure: { earthen_pond_m2: 30000, concrete_tank_m2: 280000, tarpaulin_1000L: 350000, tarpaulin_5000L: 800000, borehole: 4000000, pump: 900000, aerator: 450000, nets_scales: 220000 },
      infra_lifespan_years: { earthen_pond: 10, concrete_tank: 20, tarpaulin: 3, equipment: 5 },
      processing_cost_pct: 10,
      notes: 'Lake Victoria is primary fish farming region. Government support includes subsidized fingerlings. Growing urban demand in Kampala drives profitability.'
    },

    RW: {
      currency: 'RWF', symbol: 'RF',
      dominantSpecies: ['tilapia', 'catfish'],
      fingerling: { tilapia: 100, catfish: 150 },
      feed_per_kg: { imported: 1500, local_float: 1100, local_sink: 800, farm_made: 500 },
      selling_per_kg: { tilapia_fresh: 4000, tilapia_fillet: 6500, catfish_fresh: 3500, catfish_smoked: 5500 },
      labor_per_day: 5000,
      labor_days_cycle: 90,
      electricity_monthly: 40000,
      water_monthly: 12000,
      medications_cycle: 25000,
      transport_per_kg: 80,
      infrastructure: { earthen_pond_m2: 8000, concrete_tank_m2: 75000, tarpaulin_1000L: 95000, tarpaulin_5000L: 220000, borehole: 1200000, pump: 280000, aerator: 140000, nets_scales: 70000 },
      infra_lifespan_years: { earthen_pond: 10, concrete_tank: 20, tarpaulin: 3, equipment: 5 },
      processing_cost_pct: 10,
      notes: 'Government hatcheries provide subsidized fingerlings. Fish farming part of Vision 2050 agricultural development. Kigali hotel/restaurant demand growing rapidly.'
    },

    CI: {
      currency: 'XOF', symbol: 'CFA',
      dominantSpecies: ['tilapia', 'catfish'],
      fingerling: { tilapia: 50, catfish: 75 },
      feed_per_kg: { imported: 700, local_float: 520, local_sink: 370, farm_made: 230 },
      selling_per_kg: { tilapia_fresh: 2200, tilapia_fillet: 3600, catfish_fresh: 2000, catfish_smoked: 3300 },
      labor_per_day: 4500,
      labor_days_cycle: 90,
      electricity_monthly: 35000,
      water_monthly: 11000,
      medications_cycle: 20000,
      transport_per_kg: 70,
      infrastructure: { earthen_pond_m2: 6000, concrete_tank_m2: 55000, tarpaulin_1000L: 70000, tarpaulin_5000L: 160000, borehole: 700000, pump: 160000, aerator: 80000, nets_scales: 40000 },
      infra_lifespan_years: { earthen_pond: 10, concrete_tank: 20, tarpaulin: 3, equipment: 5 },
      processing_cost_pct: 11,
      notes: 'Coastal and lagoon aquaculture growing. MINADER supports development. Strong Abidjan consumer market. Tilapia and catfish both in demand.'
    },

    CM: {
      currency: 'XAF', symbol: 'FCFA',
      dominantSpecies: ['catfish', 'tilapia'],
      fingerling: { catfish: 80, tilapia: 60 },
      feed_per_kg: { imported: 750, local_float: 560, local_sink: 400, farm_made: 250 },
      selling_per_kg: { catfish_fresh: 2800, catfish_smoked: 4500, tilapia_fresh: 2400, tilapia_smoked: 3800 },
      labor_per_day: 4000,
      labor_days_cycle: 90,
      electricity_monthly: 30000,
      water_monthly: 10000,
      medications_cycle: 18000,
      transport_per_kg: 65,
      infrastructure: { earthen_pond_m2: 5500, concrete_tank_m2: 50000, tarpaulin_1000L: 65000, tarpaulin_5000L: 150000, borehole: 650000, pump: 150000, aerator: 75000, nets_scales: 38000 },
      infra_lifespan_years: { earthen_pond: 10, concrete_tank: 20, tarpaulin: 3, equipment: 5 },
      processing_cost_pct: 11,
      notes: 'Government aquaculture stations in Kribi and Yaoundé. Center-South and Littoral regions most active. Bilingual market supports broader fish product range.'
    },

    SN: {
      currency: 'XOF', symbol: 'CFA',
      dominantSpecies: ['tilapia', 'catfish'],
      fingerling: { tilapia: 50, catfish: 70 },
      feed_per_kg: { imported: 650, local_float: 490, local_sink: 350, farm_made: 220 },
      selling_per_kg: { tilapia_fresh: 2400, tilapia_fillet: 3900, catfish_fresh: 2200, catfish_smoked: 3500 },
      labor_per_day: 3500,
      labor_days_cycle: 90,
      electricity_monthly: 28000,
      water_monthly: 9000,
      medications_cycle: 15000,
      transport_per_kg: 60,
      infrastructure: { earthen_pond_m2: 5000, concrete_tank_m2: 48000, tarpaulin_1000L: 62000, tarpaulin_5000L: 145000, borehole: 620000, pump: 145000, aerator: 72000, nets_scales: 36000 },
      infra_lifespan_years: { earthen_pond: 10, concrete_tank: 20, tarpaulin: 3, equipment: 5 },
      processing_cost_pct: 11,
      notes: 'Saint-Louis and Casamance regions lead inland aquaculture. ANCAR and government programs support pond construction. Dakar demand strong year-round.'
    },

    MA: {
      currency: 'MAD', symbol: 'MAD',
      dominantSpecies: ['tilapia', 'trout'],
      fingerling: { tilapia: 1.5, trout: 4.0, catfish: 2.5 },
      feed_per_kg: { imported: 30, local_float: 22, local_sink: 16, farm_made: 10 },
      selling_per_kg: { tilapia_fresh: 40, tilapia_fillet: 70, trout_fresh: 65, trout_smoked: 120, catfish_fresh: 35 },
      labor_per_day: 200,
      labor_days_cycle: 90,
      electricity_monthly: 700,
      water_monthly: 250,
      medications_cycle: 500,
      transport_per_kg: 3.5,
      infrastructure: { earthen_pond_m2: 250, concrete_tank_m2: 2200, tarpaulin_1000L: 3000, tarpaulin_5000L: 7500, borehole: 35000, pump: 9000, aerator: 5000, nets_scales: 2200 },
      infra_lifespan_years: { earthen_pond: 10, concrete_tank: 20, tarpaulin: 3, equipment: 5 },
      processing_cost_pct: 9,
      notes: 'HALIEUTIS strategy supports aquaculture. Atlas Mountain trout farms. Tilapia in Souss-Massa region. Access to EU export markets a key opportunity.'
    },

    TN: {
      currency: 'TND', symbol: 'DT',
      dominantSpecies: ['tilapia', 'catfish'],
      fingerling: { tilapia: 0.6, catfish: 0.9 },
      feed_per_kg: { imported: 4.5, local_float: 3.2, local_sink: 2.2, farm_made: 1.4 },
      selling_per_kg: { tilapia_fresh: 10, tilapia_fillet: 17, catfish_fresh: 13, catfish_smoked: 21 },
      labor_per_day: 35,
      labor_days_cycle: 90,
      electricity_monthly: 120,
      water_monthly: 40,
      medications_cycle: 80,
      transport_per_kg: 0.5,
      infrastructure: { earthen_pond_m2: 40, concrete_tank_m2: 380, tarpaulin_1000L: 500, tarpaulin_5000L: 1200, borehole: 6000, pump: 1500, aerator: 800, nets_scales: 400 },
      infra_lifespan_years: { earthen_pond: 10, concrete_tank: 20, tarpaulin: 3, equipment: 5 },
      processing_cost_pct: 9,
      notes: 'Freshwater aquaculture growing in central and southern regions. Government subsidies for pond construction available. Tunis urban market within easy reach.'
    },

    AO: {
      currency: 'AOA', symbol: 'Kz',
      dominantSpecies: ['tilapia', 'catfish'],
      fingerling: { tilapia: 300, catfish: 450 },
      feed_per_kg: { imported: 3500, local_float: 2600, local_sink: 1800, farm_made: 1100 },
      selling_per_kg: { tilapia_fresh: 1400, tilapia_fillet: 2300, catfish_fresh: 1200, catfish_smoked: 2000 },
      labor_per_day: 8000,
      labor_days_cycle: 90,
      electricity_monthly: 80000,
      water_monthly: 25000,
      medications_cycle: 50000,
      transport_per_kg: 120,
      infrastructure: { earthen_pond_m2: 15000, concrete_tank_m2: 140000, tarpaulin_1000L: 180000, tarpaulin_5000L: 420000, borehole: 2200000, pump: 500000, aerator: 250000, nets_scales: 120000 },
      infra_lifespan_years: { earthen_pond: 10, concrete_tank: 20, tarpaulin: 3, equipment: 5 },
      processing_cost_pct: 12,
      notes: 'MINAGRI program supports aquaculture. Malanje, Huambo and Benguela provinces most active. Luanda demand high. Oil-sector wealth drives premium fish demand.'
    }
  };

  // ─── COUNTRY META ─────────────────────────────────────────────────────────
  var COUNTRY_META = {
    NG: { code: 'NG', name: 'Nigeria',        flag: '🇳🇬', slug: 'nigeria',        region: 'west_africa' },
    KE: { code: 'KE', name: 'Kenya',          flag: '🇰🇪', slug: 'kenya',          region: 'east_africa' },
    ZA: { code: 'ZA', name: 'South Africa',   flag: '🇿🇦', slug: 'south-africa',   region: 'southern_africa' },
    GH: { code: 'GH', name: 'Ghana',          flag: '🇬🇭', slug: 'ghana',          region: 'west_africa' },
    EG: { code: 'EG', name: 'Egypt',          flag: '🇪🇬', slug: 'egypt',          region: 'north_africa' },
    ET: { code: 'ET', name: 'Ethiopia',       flag: '🇪🇹', slug: 'ethiopia',       region: 'east_africa' },
    TZ: { code: 'TZ', name: 'Tanzania',       flag: '🇹🇿', slug: 'tanzania',       region: 'east_africa' },
    UG: { code: 'UG', name: 'Uganda',         flag: '🇺🇬', slug: 'uganda',         region: 'east_africa' },
    RW: { code: 'RW', name: 'Rwanda',         flag: '🇷🇼', slug: 'rwanda',         region: 'east_africa' },
    CI: { code: 'CI', name: "Côte d'Ivoire",  flag: '🇨🇮', slug: 'cote-d-ivoire',  region: 'west_africa' },
    CM: { code: 'CM', name: 'Cameroon',       flag: '🇨🇲', slug: 'cameroon',       region: 'central_africa' },
    SN: { code: 'SN', name: 'Senegal',        flag: '🇸🇳', slug: 'senegal',        region: 'west_africa' },
    MA: { code: 'MA', name: 'Morocco',        flag: '🇲🇦', slug: 'morocco',        region: 'north_africa' },
    TN: { code: 'TN', name: 'Tunisia',        flag: '🇹🇳', slug: 'tunisia',        region: 'north_africa' },
    AO: { code: 'AO', name: 'Angola',         flag: '🇦🇴', slug: 'angola',         region: 'southern_africa' }
  };

  // ─── PRODUCTION SYSTEM LABELS ─────────────────────────────────────────────
  var SYSTEMS = {
    earthen_pond:   { id: 'earthen_pond',  label: 'Earthen Pond',    unit: 'm²', infra_key: 'earthen_pond_m2' },
    concrete_tank:  { id: 'concrete_tank', label: 'Concrete Tank',   unit: 'm²', infra_key: 'concrete_tank_m2' },
    tarpaulin_tank: { id: 'tarpaulin_tank',label: 'Tarpaulin Tank',  unit: 'L',  infra_key: null },
    cage:           { id: 'cage',          label: 'Lake/Pond Cage',  unit: 'm²', infra_key: null }
  };

  // ─── FEED TYPE LABELS ─────────────────────────────────────────────────────
  var FEED_TYPES = {
    imported:    { label: 'Imported Commercial (best quality)', key: 'imported' },
    local_float: { label: 'Local Commercial Floating',         key: 'local_float' },
    local_sink:  { label: 'Local Commercial Sinking',          key: 'local_sink' },
    farm_made:   { label: 'Farm-made / Self-formulated',       key: 'farm_made' }
  };

  if (typeof window !== 'undefined') {
    window.AquaData = { SPECIES: SPECIES, COSTS: COSTS, COUNTRY_META: COUNTRY_META, SYSTEMS: SYSTEMS, FEED_TYPES: FEED_TYPES };
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SPECIES: SPECIES, COSTS: COSTS, COUNTRY_META: COUNTRY_META, SYSTEMS: SYSTEMS, FEED_TYPES: FEED_TYPES };
  }

})();
