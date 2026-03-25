/**
 * AfroTools — Pesticide Data
 * Common agrochemical products used across Africa
 * Rates, safety intervals, regional names
 */
(function(global) {
  'use strict';

  var PesticideData = {

    /* ─── Country → Region mapping ─────────────────────────────── */
    countryRegions: {
      nigeria:'west_africa', ghana:'west_africa', senegal:'west_africa',
      'cote-d-ivoire':'west_africa', mali:'west_africa', burkina_faso:'west_africa',
      guinea:'west_africa', 'sierra-leone':'west_africa', liberia:'west_africa',
      gambia:'west_africa', 'guinea-bissau':'west_africa', togo:'west_africa',
      benin:'west_africa', niger:'west_africa', 'cape-verde':'west_africa',
      mauritania:'west_africa',
      kenya:'east_africa', tanzania:'east_africa', uganda:'east_africa',
      ethiopia:'east_africa', rwanda:'east_africa', burundi:'east_africa',
      somalia:'east_africa', djibouti:'east_africa', eritrea:'east_africa',
      'south-sudan':'east_africa',
      'south-africa':'southern_africa', zimbabwe:'southern_africa',
      zambia:'southern_africa', malawi:'southern_africa', mozambique:'southern_africa',
      botswana:'southern_africa', namibia:'southern_africa', eswatini:'southern_africa',
      lesotho:'southern_africa', madagascar:'southern_africa',
      egypt:'north_africa', morocco:'north_africa', tunisia:'north_africa',
      algeria:'north_africa', libya:'north_africa', sudan:'north_africa',
      cameroon:'central_africa', chad:'central_africa', gabon:'central_africa',
      congo:'central_africa', 'dr-congo':'central_africa', 'central-african-republic':'central_africa',
      'equatorial-guinea':'central_africa', 'sao-tome':'central_africa',
      angola:'southern_africa', mauritius:'southern_africa', seychelles:'east_africa',
      comoros:'east_africa'
    },

    /* ─── Sprayer types ─────────────────────────────────────────── */
    sprayers: {
      knapsack: {
        name: 'Knapsack Sprayer (16L)',
        tankSize: 16,
        waterPerHaMin: 200,
        waterPerHaMax: 300,
        icon: '🎒'
      },
      motorized: {
        name: 'Motorized Knapsack (20L)',
        tankSize: 20,
        waterPerHaMin: 150,
        waterPerHaMax: 200,
        icon: '⚙️'
      },
      boom: {
        name: 'Boom Sprayer (400–1000L)',
        tankSize: 600,
        waterPerHaMin: 100,
        waterPerHaMax: 200,
        icon: '🚜'
      }
    },

    /* ─── Herbicides ────────────────────────────────────────────── */
    herbicides: [
      {
        id: 'glyphosate-360',
        name: 'Roundup / Glycel (Glyphosate 360 SL)',
        activeIngredient: 'Glyphosate',
        concentration: '360 g/L',
        formulation: 'SL',
        unit: 'L',
        rateMin: 2, rateMax: 4,
        crops: 'All crops — pre-plant burndown, land clearing',
        applicationTiming: 'Pre-plant (2–4 weeks before planting) or post-harvest',
        reentryHours: 4,
        phiDays: 14,
        bestTimeOfDay: 'Early morning or late afternoon',
        weatherNote: 'No rain within 6 hours; wind below 15 km/h; avoid application above 30°C',
        modeOfAction: 'Systemic, non-selective — translocated to roots. Allow 5–7 days for full effect before tillage.',
        localNames: {
          west_africa: 'Glycel, Weedmaster, Force-Up, Glyfos',
          east_africa: 'Roundup, Touchdown, Fozat, Clear-Up',
          southern_africa: 'Roundup, Credit 41, Glyfos, Wipe-Out',
          north_africa: 'Roundup, Basta, Spark',
          central_africa: 'Glycel, Roundup, Clearance'
        }
      },
      {
        id: 'atrazine-500sc',
        name: 'Atrazine 500 SC',
        activeIngredient: 'Atrazine',
        concentration: '500 g/L',
        formulation: 'SC',
        unit: 'L',
        rateMin: 3, rateMax: 4,
        crops: 'Maize, sorghum, sugarcane',
        applicationTiming: 'Pre-emergence (within 3 days of planting)',
        reentryHours: 12,
        phiDays: 60,
        bestTimeOfDay: 'Any time with sufficient soil moisture',
        weatherNote: 'Requires light rain or irrigation within 7 days for activation; avoid on slopes',
        modeOfAction: 'Residual soil herbicide — absorbed through roots. Effective for 6–8 weeks.',
        localNames: {
          west_africa: 'Atrazine 500, Gesaprim, Primagram',
          east_africa: 'Atrazine, Gesaprim Gold, Calaris',
          southern_africa: 'Atrazine 500, Gesaprim, Lumax',
          north_africa: 'Atrazine 500, Primagram, Gesaprim',
          central_africa: 'Atrazine 500, Gesaprim'
        }
      },
      {
        id: 'butachlor-50ec',
        name: 'Butachlor 50 EC',
        activeIngredient: 'Butachlor',
        concentration: '500 g/L',
        formulation: 'EC',
        unit: 'L',
        rateMin: 2, rateMax: 3,
        crops: 'Rice (paddy and upland)',
        applicationTiming: 'Pre-emergence in puddled rice; apply 3–5 days after transplanting',
        reentryHours: 12,
        phiDays: 60,
        bestTimeOfDay: 'Early morning; ensure standing water in paddy',
        weatherNote: 'Keep water level at 5 cm for 3–5 days after application',
        modeOfAction: 'Selective pre-emergence — inhibits root and shoot development of grasses.',
        localNames: {
          west_africa: 'Machete, Butanil, Sumo',
          east_africa: 'Butanil, Machete, Rifit',
          southern_africa: 'Machete, Butachlor 500',
          north_africa: 'Machete, Butanil',
          central_africa: 'Butanil, Machete'
        }
      },
      {
        id: '2-4-d-amine',
        name: '2,4-D Amine (720 g/L)',
        activeIngredient: '2,4-D',
        concentration: '720 g/L',
        formulation: 'SL',
        unit: 'L',
        rateMin: 1, rateMax: 2,
        crops: 'Maize, wheat, sorghum (broadleaf weed control)',
        applicationTiming: 'Post-emergence: maize at 3–5 leaf stage; wheat at tillering',
        reentryHours: 12,
        phiDays: 30,
        bestTimeOfDay: 'Early morning, avoid windy conditions',
        weatherNote: 'Do NOT spray near broadleaf crops — vapour drift risk; no rain within 4 hours',
        modeOfAction: 'Selective systemic — mimics plant growth hormone. Kills broadleaf weeds without harming grasses.',
        localNames: {
          west_africa: '2,4-D Amine, Fernoxone, Weed-Rid',
          east_africa: '2,4-D Amine, DMA 6, Fernoxone',
          southern_africa: 'Fernoxone, 2,4-D LV4, U46D',
          north_africa: 'Fernoxone, 2,4-D 720, Amine Sel',
          central_africa: 'Fernoxone, 2,4-D Amine'
        }
      },
      {
        id: 'paraquat-200',
        name: 'Gramoxone / Paraquat 200 SL',
        activeIngredient: 'Paraquat',
        concentration: '200 g/L',
        formulation: 'SL',
        unit: 'L',
        rateMin: 2, rateMax: 3,
        crops: 'All crops — pre-plant or inter-row contact burndown',
        applicationTiming: 'Pre-plant burndown or inter-row weeding; use shields to protect crops',
        reentryHours: 24,
        phiDays: 7,
        bestTimeOfDay: 'Morning when weeds are actively growing',
        weatherNote: 'No rain within 30 minutes (very fast action); highly toxic — use full PPE',
        modeOfAction: 'Contact, non-selective — destroys green tissue on contact. No soil activity. Very fast.',
        localNames: {
          west_africa: 'Gramoxone, Cekuquat, Paraquat',
          east_africa: 'Gramoxone, Weedol, Para-col',
          southern_africa: 'Gramoxone, Paraquat-L, Dexuron',
          north_africa: 'Gramoxone, Paraquat 200',
          central_africa: 'Gramoxone, Paraquat'
        }
      },
      {
        id: 'nicosulfuron-40sc',
        name: 'Nicosulfuron 40 SC (Accent)',
        activeIngredient: 'Nicosulfuron',
        concentration: '40 g/L',
        formulation: 'SC',
        unit: 'L',
        rateMin: 1, rateMax: 1.5,
        crops: 'Maize only (selective)',
        applicationTiming: 'Post-emergence: maize at 3–6 leaf stage (up to 60 cm tall)',
        reentryHours: 12,
        phiDays: 60,
        bestTimeOfDay: 'Early morning; avoid stress conditions',
        weatherNote: 'Do NOT apply when maize is under drought or heat stress; no rain within 4 hours',
        modeOfAction: 'Selective systemic — controls grasses and broadleaves in maize. Do NOT use on popcorn or sweet corn.',
        localNames: {
          west_africa: 'Accent, Nicogan, Milagro',
          east_africa: 'Accent, Samson, Motivell',
          southern_africa: 'Accent, Samson, Milagro',
          north_africa: 'Accent, Nicosulfuron',
          central_africa: 'Accent, Milagro'
        }
      }
    ],

    /* ─── Insecticides ──────────────────────────────────────────── */
    insecticides: [
      {
        id: 'cypermethrin-10ec',
        name: 'Cypermethrin 10 EC',
        activeIngredient: 'Cypermethrin',
        concentration: '100 g/L',
        formulation: 'EC',
        unit: 'L',
        rateMin: 0.5, rateMax: 1,
        crops: 'Maize, cotton, vegetables, soybean, sorghum',
        applicationTiming: 'At first sign of pest; repeat after 7–14 days if needed',
        reentryHours: 24,
        phiDays: 7,
        bestTimeOfDay: 'Early morning or late afternoon (avoid bee activity)',
        weatherNote: 'No rain within 2 hours; avoid high temperatures (>30°C)',
        modeOfAction: 'Contact and stomach poison — knockdown effect. Broad-spectrum pyrethroid.',
        localNames: {
          west_africa: 'Cypermethrin 10, Sherpa, Ripcord',
          east_africa: 'Cypermethrin 10, Sherpa, Cypeforce',
          southern_africa: 'Cypermethrin, Cyperkill, Sherpamix',
          north_africa: 'Cypermethrin 10, Sherpa, Arrivo',
          central_africa: 'Cypermethrin 10, Ripcord'
        }
      },
      {
        id: 'lambda-cyhalothrin',
        name: 'Lambda-cyhalothrin (Karate 5 EC)',
        activeIngredient: 'Lambda-cyhalothrin',
        concentration: '50 g/L',
        formulation: 'EC',
        unit: 'L',
        rateMin: 0.3, rateMax: 0.5,
        crops: 'Maize, cotton, vegetables, legumes, cereals',
        applicationTiming: 'At pest threshold; repeat every 10–14 days',
        reentryHours: 24,
        phiDays: 7,
        bestTimeOfDay: 'Early morning or evening; avoid daytime bee activity',
        weatherNote: 'No rain within 2 hours; highly toxic to bees and fish',
        modeOfAction: 'Contact and ingestion — pyrethroid with repellent action. Fast knockdown.',
        localNames: {
          west_africa: 'Karate, Ninja, Lambdacol',
          east_africa: 'Karate, Lambda-C, Cymbush',
          southern_africa: 'Karate Zeon, Lambdex, Nexide',
          north_africa: 'Karate, Lambda 5 EC',
          central_africa: 'Karate, Ninja, Lambda-C'
        }
      },
      {
        id: 'chlorpyrifos-48ec',
        name: 'Chlorpyrifos 480 EC (Dursban)',
        activeIngredient: 'Chlorpyrifos',
        concentration: '480 g/L',
        formulation: 'EC',
        unit: 'L',
        rateMin: 1, rateMax: 2,
        crops: 'Maize, cotton, vegetables, citrus, cocoa',
        applicationTiming: 'At pest emergence; soil application for armyworm/stalk borer',
        reentryHours: 24,
        phiDays: 14,
        bestTimeOfDay: 'Morning application preferred',
        weatherNote: 'No rain within 4 hours; toxic to fish and birds — keep away from water',
        modeOfAction: 'Contact and systemic organophosphate. Broad-spectrum. Also effective in soil for stem borers.',
        localNames: {
          west_africa: 'Dursban, Pyrinex, Chlorpyrifos 480',
          east_africa: 'Dursban, Chlorban, Pyrinex',
          southern_africa: 'Dursban, Chlorpyrifos 480, Coroban',
          north_africa: 'Dursban, Pyrifos, Chlorpyrifos',
          central_africa: 'Dursban, Pyrinex'
        }
      },
      {
        id: 'emamectin-benzoate',
        name: 'Emamectin Benzoate 1.9 EC (Voliam)',
        activeIngredient: 'Emamectin benzoate',
        concentration: '18.6 g/L',
        formulation: 'EC',
        unit: 'L',
        rateMin: 0.3, rateMax: 0.5,
        crops: 'Vegetables, maize, cotton (caterpillars, armyworm)',
        applicationTiming: 'At egg hatch or early instar larvae; very effective against fall armyworm',
        reentryHours: 12,
        phiDays: 3,
        bestTimeOfDay: 'Morning or evening when larvae are active',
        weatherNote: 'No rain within 2 hours; UV degradation — spray in evening for extended residual',
        modeOfAction: 'Ingestion insecticide — disrupts nerve signals. Highly effective on caterpillars. Low mammalian toxicity.',
        localNames: {
          west_africa: 'Voliam Targo, Proclaim, Emacot',
          east_africa: 'Proclaim, Voliam, Emaben',
          southern_africa: 'Proclaim, Voliam Targo, Affirm',
          north_africa: 'Proclaim, Emamectin',
          central_africa: 'Proclaim, Emaben'
        }
      },
      {
        id: 'neem-oil',
        name: 'Neem Oil (Azadirachtin 0.03%)',
        activeIngredient: 'Azadirachtin',
        concentration: '0.03%',
        formulation: 'EC',
        unit: 'L',
        rateMin: 2, rateMax: 5,
        crops: 'All crops — organic option',
        applicationTiming: 'Preventive or at first sign of pest; repeat every 5–7 days',
        reentryHours: 4,
        phiDays: 0,
        bestTimeOfDay: 'Evening (UV sensitive — avoid midday sun)',
        weatherNote: 'Apply in evening for best residual; no rain within 4 hours; mix with soap emulsifier',
        modeOfAction: 'Organic insecticide/repellent — disrupts insect growth and feeding. Safe for beneficials when dry.',
        localNames: {
          west_africa: 'Neem oil, NeemAzal, Neemix',
          east_africa: 'Neem oil, Ecobio-Neem, NeemAzal',
          southern_africa: 'Neem oil, Bioneem, NeemAzal',
          north_africa: 'Huile de neem, Neem oil',
          central_africa: 'Neem oil, NeemAzal'
        }
      }
    ],

    /* ─── Fungicides ────────────────────────────────────────────── */
    fungicides: [
      {
        id: 'mancozeb-80wp',
        name: 'Mancozeb 80 WP (Dithane)',
        activeIngredient: 'Mancozeb',
        concentration: '800 g/kg',
        formulation: 'WP',
        unit: 'kg',
        rateMin: 2, rateMax: 3,
        crops: 'Tomato, potato, maize, onion, grapes (broad-spectrum)',
        applicationTiming: 'Preventive — begin before disease onset; repeat every 7–14 days',
        reentryHours: 24,
        phiDays: 7,
        bestTimeOfDay: 'Morning or late afternoon',
        weatherNote: 'No rain within 2 hours; protectant only — does not cure existing infection',
        modeOfAction: 'Multi-site contact protectant — no systemic activity. Low resistance risk.',
        localNames: {
          west_africa: 'Dithane M-45, Mancosol, Penncozeb',
          east_africa: 'Dithane M-45, Mancozeb, Oshothane',
          southern_africa: 'Dithane M-45, Mancozeb 750 WP, Oshothane',
          north_africa: 'Dithane M-45, Mancozeb 80',
          central_africa: 'Dithane M-45, Mancozeb'
        }
      },
      {
        id: 'ridomil-gold',
        name: 'Ridomil Gold MZ (Metalaxyl-M + Mancozeb)',
        activeIngredient: 'Metalaxyl-M + Mancozeb',
        concentration: '4% + 64%',
        formulation: 'WP',
        unit: 'kg',
        rateMin: 2, rateMax: 2.5,
        crops: 'Tomato, potato, pepper, cucumber (late blight, downy mildew)',
        applicationTiming: 'Preventive to curative — apply before or at first symptoms; repeat every 10–14 days',
        reentryHours: 12,
        phiDays: 7,
        bestTimeOfDay: 'Morning for best coverage',
        weatherNote: 'No rain within 2 hours; systemic — rain fastness after 1 hour partial absorption',
        modeOfAction: 'Systemic (metalaxyl) + contact (mancozeb) combination. Effective against Phytophthora and Peronospora.',
        localNames: {
          west_africa: 'Ridomil Gold, Folio Gold, Mancofol',
          east_africa: 'Ridomil Gold, Folio Gold, Manfil',
          southern_africa: 'Ridomil Gold, Folio Gold MZ',
          north_africa: 'Ridomil Gold, Folio Gold',
          central_africa: 'Ridomil Gold, Folio Gold'
        }
      },
      {
        id: 'carbendazim-50wp',
        name: 'Carbendazim 50 WP (Bavistin)',
        activeIngredient: 'Carbendazim',
        concentration: '500 g/kg',
        formulation: 'WP',
        unit: 'kg',
        rateMin: 0.5, rateMax: 1,
        crops: 'Cereals, banana, coffee, vegetables (stem rot, crown rot, anthracnose)',
        applicationTiming: 'Curative or preventive; repeat every 14 days',
        reentryHours: 12,
        phiDays: 14,
        bestTimeOfDay: 'Any time of day',
        weatherNote: 'No rain within 2 hours; also used as soil drench for root diseases',
        modeOfAction: 'Systemic benzimidazole — inhibits cell division. Absorbed by roots and leaves. Curative effect.',
        localNames: {
          west_africa: 'Bavistin, Derosal, Carbendazim 50',
          east_africa: 'Bavistin, Derosal, Funginil',
          southern_africa: 'Derosal Plus, Bavistin, Carbendazim 500',
          north_africa: 'Bavistin, Derosal, MBC 50',
          central_africa: 'Bavistin, Derosal'
        }
      },
      {
        id: 'copper-oxychloride',
        name: 'Copper Oxychloride 50 WP (Cuproxat)',
        activeIngredient: 'Copper oxychloride',
        concentration: '500 g/kg',
        formulation: 'WP',
        unit: 'kg',
        rateMin: 2, rateMax: 3,
        crops: 'Tomato, coffee, cocoa, citrus, potatoes (bacterial and fungal diseases)',
        applicationTiming: 'Preventive from early season; repeat every 7–10 days in wet conditions',
        reentryHours: 24,
        phiDays: 14,
        bestTimeOfDay: 'Morning or afternoon',
        weatherNote: 'No rain within 2 hours; may cause phytotoxicity on young leaves — avoid hot, humid conditions',
        modeOfAction: 'Inorganic protectant — copper ions destroy fungal and bacterial cells. Multi-site, low resistance risk.',
        localNames: {
          west_africa: 'Cuproxat, Kocide, Virikop',
          east_africa: 'Kocide 101, Cuproxat, Virikop',
          southern_africa: 'Kocide 2000, Cuproxat, Copper-Flo',
          north_africa: 'Cuproxat, Kocide, Bouillie bordelaise',
          central_africa: 'Cuproxat, Kocide'
        }
      }
    ],

    /* ─── Seed Treatments ───────────────────────────────────────── */
    seedTreatments: [
      {
        id: 'thiram-80wp',
        name: 'Thiram 80 WP (Fernasan)',
        activeIngredient: 'Thiram',
        concentration: '800 g/kg',
        formulation: 'WP',
        unit: 'g',          /* per kg of seed */
        rateMin: 2, rateMax: 3,
        rateUnit: 'g/kg seed',
        crops: 'Maize, soybean, sorghum, vegetables',
        applicationTiming: 'At planting — treat seed 24 hours before or on day of planting',
        reentryHours: 24,
        phiDays: 0,
        notes: 'Protects against seed and soil-borne pathogens. Mix thoroughly to coat all seeds.',
        localNames: {
          west_africa: 'Fernasan, Thiram 80, Thiraflo',
          east_africa: 'Fernasan, Thiram D, Anchor',
          southern_africa: 'Fernasan D, Thiram 80, Tiuram',
          north_africa: 'Fernasan, Thiram 80',
          central_africa: 'Fernasan, Thiram 80'
        }
      },
      {
        id: 'vitavax-200',
        name: 'Vitavax 200 WP (Carboxin + Thiram)',
        activeIngredient: 'Carboxin 37.5% + Thiram 37.5%',
        concentration: '37.5% + 37.5%',
        formulation: 'WP',
        unit: 'g',
        rateMin: 3, rateMax: 3,
        rateUnit: 'g/kg seed',
        crops: 'Maize, wheat, sorghum, sunflower, soybean',
        applicationTiming: 'Apply to seed at planting; Vitavax is standard for most cereal seeds',
        reentryHours: 12,
        phiDays: 0,
        notes: 'Controls smut, bunt, and damping-off. Systemic (carboxin) + contact (thiram) protection.',
        localNames: {
          west_africa: 'Vitavax 200, Carboxin-Thiram, Vitmab',
          east_africa: 'Vitavax 200, Anchor Plus, Panoctine',
          southern_africa: 'Vitavax 200 FF, Panoctine, Carboxin-Thiram',
          north_africa: 'Vitavax 200, Carboxin-Thiram',
          central_africa: 'Vitavax 200, Carboxin'
        }
      },
      {
        id: 'imidacloprid-70ws',
        name: 'Imidacloprid 70 WS (Gaucho)',
        activeIngredient: 'Imidacloprid',
        concentration: '700 g/kg',
        formulation: 'WS',
        unit: 'g',
        rateMin: 7, rateMax: 10,
        rateUnit: 'g/kg seed',
        crops: 'Maize, sorghum, sunflower (seed dressing for soil insects)',
        applicationTiming: 'Dress seed before planting; protects seedlings for 4–6 weeks',
        reentryHours: 48,
        phiDays: 0,
        notes: 'Controls wireworm, aphids, termites in early growth. Systemic — absorbed by growing plant.',
        localNames: {
          west_africa: 'Gaucho, Confidor WS, Imida 70',
          east_africa: 'Gaucho, Imidacloprid 70, Confidor',
          southern_africa: 'Gaucho 350, Confidor 700 WS, Imidastar',
          north_africa: 'Gaucho, Confidor WS',
          central_africa: 'Gaucho, Confidor WS'
        }
      },
      {
        id: 'metalaxyl-35ws',
        name: 'Apron Star 42 WS (Metalaxyl + Thiram)',
        activeIngredient: 'Metalaxyl-M + Thiram',
        concentration: '7% + 35%',
        formulation: 'WS',
        unit: 'g',
        rateMin: 3, rateMax: 6,
        rateUnit: 'g/kg seed',
        crops: 'Maize, sorghum, millet (damping off, seed rot)',
        applicationTiming: 'Apply to seed at planting; standard dressing for tropical maize',
        reentryHours: 12,
        phiDays: 0,
        notes: 'Controls Pythium and Phytophthora seed rot. Systemic metalaxyl + contact thiram.',
        localNames: {
          west_africa: 'Apron Star, Apron Plus, Metalaxyl WS',
          east_africa: 'Apron Star 42, Apron Plus, Ridomil Gold ST',
          southern_africa: 'Apron Star, Apron XL, Metalaxyl-Thiram',
          north_africa: 'Apron Star, Apron Plus',
          central_africa: 'Apron Star, Apron Plus'
        }
      }
    ],

    /* ─── Safety guidelines (always display) ───────────────────── */
    safety: {
      ppe: [
        'Wear chemical-resistant gloves (nitrile or rubber)',
        'Wear a dust/vapour respirator or face mask',
        'Wear safety goggles or face shield',
        'Wear long-sleeved shirt, long trousers, and rubber boots',
        'Change and wash clothing immediately after spraying'
      ],
      during: [
        'Never eat, drink, or smoke while handling pesticides',
        'Keep children and animals away from treated area',
        'Always spray with wind at your back',
        'Do not spray when wind speed exceeds 15 km/h',
        'Spray in early morning or late afternoon — avoid heat'
      ],
      storage: [
        'Store in original labelled container with tight lid',
        'Keep in cool, dry, locked location away from food and water',
        'Store out of reach of children and animals',
        'Do not store near heat sources or open flames'
      ],
      disposal: [
        'Triple-rinse empty containers, then puncture to prevent reuse',
        'Do not burn pesticide containers',
        'Do not dump containers near water sources or in fields',
        'Return empty containers to collection points where available'
      ],
      waterSafety: 'NEVER spray within 30 metres of rivers, streams, ponds, or wells. Pesticides are highly toxic to fish and aquatic life.'
    }
  };

  /* Public accessor */
  global.PesticideData = PesticideData;

})(typeof window !== 'undefined' ? window : this);
