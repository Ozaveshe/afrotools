/**
 * storage-data.js
 * AfroTools Grain Storage Loss Calculator — Pan-African Data
 * Sources: World Bank "Missing Food" report, APHLIS, PMC research papers, PICS project
 */

var STORAGE_DATA = {

  // ── POST-HARVEST LOSS RATES BY CROP AND STORAGE METHOD ──────────────────────
  // Loss rates are % weight loss over typical storage period (3–8 months)

  lossRates: {

    maize: {
      label: 'Maize (Corn)',
      flag: '🌽',
      defaultHarvestPrice_USD: 200,
      aflatoxinRisk: true,
      methods: {
        traditional_granary:      { label: 'Traditional granary (thatch/wood)',       loss_pct: 20, period_months: 6,  notes: 'Insect damage primary cause (weevils, larger grain borer). Rodents also significant.' },
        polypropylene_bags:       { label: 'Polypropylene (PP) bags',                  loss_pct: 15, period_months: 6,  notes: 'Standard woven PP bags. Common but poor protection against insects.' },
        pp_bags_with_chemical:    { label: 'PP bags + chemical treatment',             loss_pct: 8,  period_months: 6,  notes: 'Actellic/Phostoxin. Effective but health concerns if misused.' },
        hermetic_bags_PICS:       { label: 'Hermetic PICS bags (triple-layer)',        loss_pct: 1,  period_months: 9,  notes: 'Purdue Improved Crop Storage bags. 95–100% insect mortality. Near-zero loss.' },
        hermetic_bags_other:      { label: 'Other hermetic bags (GrainPro, AgroZ)',    loss_pct: 2,  period_months: 9,  notes: 'Similar to PICS — single ultra-hermetic liner + outer bag.' },
        metal_silo:               { label: 'Metal silo (galvanized steel)',             loss_pct: 0.5,period_months: 12, notes: 'Best long-term storage. Hermetic when sealed. Reusable 10–20 years.' },
        warehouse_fumigated:      { label: 'Commercial warehouse (fumigated)',          loss_pct: 2,  period_months: 12, notes: 'Professional fumigation. Usually only accessible to larger operations.' }
      }
    },

    sorghum: {
      label: 'Sorghum',
      flag: '🌾',
      defaultHarvestPrice_USD: 180,
      aflatoxinRisk: false,
      methods: {
        traditional_granary:      { label: 'Traditional granary (thatch/wood)',       loss_pct: 12, period_months: 6,  notes: 'Lower losses than maize due to harder seed coat.' },
        polypropylene_bags:       { label: 'Polypropylene (PP) bags',                  loss_pct: 10, period_months: 6,  notes: 'Reasonable protection compared to open storage.' },
        hermetic_bags_PICS:       { label: 'Hermetic PICS bags',                       loss_pct: 1,  period_months: 9,  notes: 'Excellent protection. Suitable for 100 kg bags.' },
        metal_silo:               { label: 'Metal silo (galvanized steel)',             loss_pct: 0.5,period_months: 12, notes: 'Best option for multi-season storage.' }
      }
    },

    millet: {
      label: 'Millet (Pearl/Finger)',
      flag: '🌾',
      defaultHarvestPrice_USD: 220,
      aflatoxinRisk: false,
      methods: {
        traditional_granary:      { label: 'Traditional granary (thatch/wood)',       loss_pct: 17, period_months: 6,  notes: 'Trogoderma granarium (khapra beetle) is an emerging pest in the Sahel.' },
        polypropylene_bags:       { label: 'Polypropylene (PP) bags',                  loss_pct: 12, period_months: 6,  notes: 'Moderate protection.' },
        hermetic_bags_PICS:       { label: 'Hermetic PICS bags',                       loss_pct: 0,  period_months: 6,  notes: 'PICS trials in Niger showed ZERO weight loss for millet.' },
        metal_silo:               { label: 'Metal silo (galvanized steel)',             loss_pct: 0.5,period_months: 12, notes: 'Excellent long-term option.' }
      }
    },

    rice_paddy: {
      label: 'Rice (Paddy)',
      flag: '🍚',
      defaultHarvestPrice_USD: 300,
      aflatoxinRisk: false,
      methods: {
        traditional:              { label: 'Traditional storage (heap/granary)',       loss_pct: 10, period_months: 4,  notes: 'Paddy rice is relatively pest-resistant due to husk protection.' },
        polypropylene_bags:       { label: 'Polypropylene (PP) bags',                  loss_pct: 6,  period_months: 4,  notes: 'Standard woven bags. Adequate for short-term storage.' },
        hermetic_bags_PICS:       { label: 'Hermetic bags (PICS/GrainPro)',            loss_pct: 1,  period_months: 9,  notes: 'Hermetic storage also maintains milling quality of paddy.' },
        metal_silo:               { label: 'Metal silo (galvanized steel)',             loss_pct: 0.5,period_months: 12, notes: 'Maintains milling quality over long periods.' }
      }
    },

    cowpea: {
      label: 'Cowpea (Black-eyed pea)',
      flag: '🫘',
      defaultHarvestPrice_USD: 450,
      aflatoxinRisk: false,
      methods: {
        traditional:              { label: 'Traditional storage (pots/bags)',          loss_pct: 30, period_months: 4,  notes: 'Cowpea bruchid (Callosobruchus maculatus) causes devastating losses — can render entire stock inedible within 3 months.' },
        polypropylene_bags:       { label: 'Polypropylene (PP) bags',                  loss_pct: 25, period_months: 4,  notes: 'PP bags offer minimal protection against bruchids.' },
        hermetic_bags_PICS:       { label: 'Hermetic PICS bags (RECOMMENDED)',         loss_pct: 0,  period_months: 6,  notes: 'PICS bags were ORIGINALLY DEVELOPED for cowpea. Near-perfect protection. Bruchid larvae suffocate inside sealed bag.' },
        metal_silo:               { label: 'Metal silo (galvanized steel)',             loss_pct: 0.5,period_months: 12, notes: 'Excellent but overkill for most smallholders storing cowpea.' }
      }
    },

    wheat: {
      label: 'Wheat',
      flag: '🌾',
      defaultHarvestPrice_USD: 250,
      aflatoxinRisk: false,
      methods: {
        polypropylene_bags:       { label: 'Polypropylene (PP) bags',                  loss_pct: 8,  period_months: 6,  notes: 'Wheat weevil (Sitophilus granarius) is the main pest.' },
        hermetic_bags_PICS:       { label: 'Hermetic PICS/GrainPro bags',              loss_pct: 1,  period_months: 9,  notes: 'Excellent protection.' },
        metal_silo:               { label: 'Metal silo (galvanized steel)',             loss_pct: 0.5,period_months: 12, notes: 'Best for long-term or large quantities.' }
      }
    },

    common_bean: {
      label: 'Common Bean (Kidney/Haricot)',
      flag: '🫘',
      defaultHarvestPrice_USD: 400,
      aflatoxinRisk: false,
      methods: {
        traditional:              { label: 'Traditional storage (bags/pots)',          loss_pct: 15, period_months: 4,  notes: 'Bean bruchid (Acanthoscelides obtectus) is the main pest.' },
        polypropylene_bags:       { label: 'Polypropylene (PP) bags',                  loss_pct: 12, period_months: 4,  notes: 'Moderate protection.' },
        hermetic_bags_PICS:       { label: 'Hermetic PICS bags',                       loss_pct: 1,  period_months: 6,  notes: 'Very effective against bruchid beetles.' },
        metal_silo:               { label: 'Metal silo (galvanized steel)',             loss_pct: 0.5,period_months: 12, notes: 'Best option if storing multiple crops.' }
      }
    },

    groundnut: {
      label: 'Groundnut (Peanut)',
      flag: '🥜',
      defaultHarvestPrice_USD: 500,
      aflatoxinRisk: true,
      methods: {
        traditional:              { label: 'Traditional storage (in-shell)',           loss_pct: 15, period_months: 4,  notes: 'WARNING: Poor storage promotes Aspergillus flavus mold → aflatoxin contamination. Not just weight loss — a food safety crisis.' },
        polypropylene_bags:       { label: 'Polypropylene (PP) bags (shelled)',        loss_pct: 12, period_months: 4,  notes: 'Moderate physical protection but does not prevent aflatoxin.' },
        hermetic_bags_PICS:       { label: 'Hermetic bags (oxygen-limiting)',          loss_pct: 2,  period_months: 6,  notes: 'Hermetic storage limits oxygen, reducing Aspergillus growth and aflatoxin development significantly.' },
        metal_silo:               { label: 'Metal silo (galvanized steel)',             loss_pct: 1,  period_months: 12, notes: 'Best protection against both physical loss and aflatoxin.' }
      }
    }

  },

  // ── STORAGE TECHNOLOGY COSTS ─────────────────────────────────────────────────

  technologies: {
    pics_bag_100kg: {
      name: 'PICS Bag (100 kg)',
      shortName: 'PICS Bag',
      capacity_kg: 100,
      cost_USD: 2.50,
      lifespan_uses: 3,
      costPerUse_USD: 1.00,
      icon: '🛍️'
    },
    metal_silo_500kg: {
      name: 'Metal Silo (500 kg)',
      shortName: 'Metal Silo (0.5t)',
      capacity_kg: 500,
      cost_USD: 100,
      lifespan_years: 15,
      costPerYear_USD: 7,
      icon: '🏭'
    },
    metal_silo_1000kg: {
      name: 'Metal Silo (1 tonne)',
      shortName: 'Metal Silo (1t)',
      capacity_kg: 1000,
      cost_USD: 180,
      lifespan_years: 15,
      costPerYear_USD: 12,
      icon: '🏭'
    },
    metal_silo_3000kg: {
      name: 'Metal Silo (3 tonnes)',
      shortName: 'Metal Silo (3t)',
      capacity_kg: 3000,
      cost_USD: 400,
      lifespan_years: 15,
      costPerYear_USD: 27,
      icon: '🏭'
    }
  },

  // ── SEASONAL PRICE INCREASE (harvest → lean season) ──────────────────────────

  seasonalPriceIncrease: {
    maize:       50,
    sorghum:     40,
    millet:      60,
    rice_paddy:  30,
    cowpea:      50,
    wheat:       25,
    common_bean: 40,
    groundnut:   35
  },

  // ── COUNTRY CURRENCIES & CONVERSION RATES ───────────────────────────────────
  // Exchange rates are approximate (2025). Update periodically.

  countries: {
    'ALL': { name: 'Show in USD',         flag: '🌍', currency: 'USD', symbol: '$',    rate: 1,       pics_bag: 2.50, silo_500kg: 100,   silo_1000kg: 180   },
    'NG':  { name: 'Nigeria',             flag: '🇳🇬', currency: 'NGN', symbol: '₦',    rate: 1600,    pics_bag: 3500, silo_500kg: 80000, silo_1000kg: 150000 },
    'KE':  { name: 'Kenya',               flag: '🇰🇪', currency: 'KES', symbol: 'KSh', rate: 130,     pics_bag: 350,  silo_500kg: 12000, silo_1000kg: 22000  },
    'ET':  { name: 'Ethiopia',            flag: '🇪🇹', currency: 'ETB', symbol: 'Br',  rate: 110,     pics_bag: 250,  silo_500kg: 8000,  silo_1000kg: 15000  },
    'GH':  { name: 'Ghana',               flag: '🇬🇭', currency: 'GHS', symbol: 'GH₵', rate: 14,      pics_bag: 25,   silo_500kg: 800,   silo_1000kg: 1500   },
    'TZ':  { name: 'Tanzania',            flag: '🇹🇿', currency: 'TZS', symbol: 'TSh', rate: 2600,    pics_bag: 5000, silo_500kg: 200000,silo_1000kg: 350000 },
    'ZA':  { name: 'South Africa',        flag: '🇿🇦', currency: 'ZAR', symbol: 'R',   rate: 18,      pics_bag: 40,   silo_500kg: 1600,  silo_1000kg: 3000   },
    'UG':  { name: 'Uganda',              flag: '🇺🇬', currency: 'UGX', symbol: 'USh', rate: 3700,    pics_bag: 8000, silo_500kg: 350000,silo_1000kg: 650000 },
    'ZM':  { name: 'Zambia',              flag: '🇿🇲', currency: 'ZMW', symbol: 'ZK',  rate: 26,      pics_bag: 50,   silo_500kg: 1500,  silo_1000kg: 2800   },
    'MW':  { name: 'Malawi',              flag: '🇲🇼', currency: 'MWK', symbol: 'MK',  rate: 1700,    pics_bag: 5000, silo_500kg: 150000,silo_1000kg: 280000 },
    'MZ':  { name: 'Mozambique',          flag: '🇲🇿', currency: 'MZN', symbol: 'MT',  rate: 64,      pics_bag: 150,  silo_500kg: 5500,  silo_1000kg: 10000  },
    'RW':  { name: 'Rwanda',              flag: '🇷🇼', currency: 'RWF', symbol: 'RWF', rate: 1300,    pics_bag: 3000, silo_500kg: 110000,silo_1000kg: 200000 },
    'BF':  { name: 'Burkina Faso',        flag: '🇧🇫', currency: 'XOF', symbol: 'CFA', rate: 600,     pics_bag: 1500, silo_500kg: 60000, silo_1000kg: 110000 },
    'NE':  { name: 'Niger',               flag: '🇳🇪', currency: 'XOF', symbol: 'CFA', rate: 600,     pics_bag: 1500, silo_500kg: 60000, silo_1000kg: 110000 },
    'ML':  { name: 'Mali',                flag: '🇲🇱', currency: 'XOF', symbol: 'CFA', rate: 600,     pics_bag: 1500, silo_500kg: 60000, silo_1000kg: 110000 },
    'SN':  { name: 'Senegal',             flag: '🇸🇳', currency: 'XOF', symbol: 'CFA', rate: 600,     pics_bag: 1500, silo_500kg: 60000, silo_1000kg: 110000 },
    'CI':  { name: "Côte d'Ivoire",       flag: '🇨🇮', currency: 'XOF', symbol: 'CFA', rate: 600,     pics_bag: 1500, silo_500kg: 60000, silo_1000kg: 110000 },
    'CM':  { name: 'Cameroon',            flag: '🇨🇲', currency: 'XAF', symbol: 'FCFA',rate: 600,     pics_bag: 1500, silo_500kg: 60000, silo_1000kg: 110000 },
    'MA':  { name: 'Morocco',             flag: '🇲🇦', currency: 'MAD', symbol: 'DH',  rate: 10,      pics_bag: 25,   silo_500kg: 900,   silo_1000kg: 1700   },
    'EG':  { name: 'Egypt',               flag: '🇪🇬', currency: 'EGP', symbol: 'E£',  rate: 50,      pics_bag: 100,  silo_500kg: 4500,  silo_1000kg: 8000   },
    'TN':  { name: 'Tunisia',             flag: '🇹🇳', currency: 'TND', symbol: 'DT',  rate: 3.1,     pics_bag: 8,    silo_500kg: 310,   silo_1000kg: 560    },
    'SD':  { name: 'Sudan',               flag: '🇸🇩', currency: 'SDG', symbol: 'SDG', rate: 600,     pics_bag: 1500, silo_500kg: 60000, silo_1000kg: 110000 },
    'SS':  { name: 'South Sudan',         flag: '🇸🇸', currency: 'SSP', symbol: 'SSP', rate: 1300,    pics_bag: 3000, silo_500kg: 120000,silo_1000kg: 220000 },
    'ZW':  { name: 'Zimbabwe',            flag: '🇿🇼', currency: 'USD', symbol: '$',   rate: 1,       pics_bag: 2.50, silo_500kg: 100,   silo_1000kg: 180    },
    'AO':  { name: 'Angola',              flag: '🇦🇴', currency: 'AOA', symbol: 'Kz',  rate: 830,     pics_bag: 2000, silo_500kg: 82000, silo_1000kg: 150000 },
    'TG':  { name: 'Togo',                flag: '🇹🇬', currency: 'XOF', symbol: 'CFA', rate: 600,     pics_bag: 1500, silo_500kg: 60000, silo_1000kg: 110000 },
    'BJ':  { name: 'Benin',               flag: '🇧🇯', currency: 'XOF', symbol: 'CFA', rate: 600,     pics_bag: 1500, silo_500kg: 60000, silo_1000kg: 110000 },
    'GH_extra': null
  },

  // ── DEFAULT HARVEST PRICES (local currency per tonne) ──────────────────────
  // Approximate farm-gate prices at harvest (glut period)

  harvestPrices: {
    'NG':  { maize: 320000, sorghum: 280000, millet: 350000, rice_paddy: 480000, cowpea: 720000, wheat: 400000, common_bean: 640000, groundnut: 800000 },
    'KE':  { maize: 26000,  sorghum: 22000,  millet: 28000,  rice_paddy: 60000,  cowpea: 90000,  wheat: 32000,  common_bean: 80000,  groundnut: 100000 },
    'ET':  { maize: 22000,  sorghum: 18000,  millet: 24000,  rice_paddy: 33000,  cowpea: 49500,  wheat: 27500,  common_bean: 44000,  groundnut: 55000  },
    'GH':  { maize: 2800,   sorghum: 2400,   millet: 3100,   rice_paddy: 4200,   cowpea: 6300,   wheat: 3500,   common_bean: 5600,   groundnut: 7000   },
    'TZ':  { maize: 520000, sorghum: 468000, millet: 572000, rice_paddy: 780000, cowpea: 1170000,wheat: 650000, common_bean: 1040000,groundnut: 1300000},
    'ZA':  { maize: 3600,   sorghum: 3200,   millet: 3960,   rice_paddy: 5400,   cowpea: 8100,   wheat: 4500,   common_bean: 7200,   groundnut: 9000   },
    'UG':  { maize: 740000, sorghum: 666000, millet: 814000, rice_paddy: 1110000,cowpea: 1665000,wheat: 925000, common_bean: 1480000,groundnut: 1850000},
    'ZM':  { maize: 5200,   sorghum: 4680,   millet: 5720,   rice_paddy: 7800,   cowpea: 11700,  wheat: 6500,   common_bean: 10400,  groundnut: 13000  },
    'MW':  { maize: 340000, sorghum: 306000, millet: 374000, rice_paddy: 510000, cowpea: 765000, wheat: 425000, common_bean: 680000, groundnut: 850000 },
    'BF':  { maize: 120000, sorghum: 108000, millet: 132000, rice_paddy: 180000, cowpea: 270000, wheat: 150000, common_bean: 240000, groundnut: 300000 },
    'NE':  { maize: 120000, sorghum: 108000, millet: 132000, rice_paddy: 180000, cowpea: 270000, wheat: 150000, common_bean: 240000, groundnut: 300000 },
    'ALL': { maize: 200,    sorghum: 180,    millet: 220,    rice_paddy: 300,    cowpea: 450,    wheat: 250,    common_bean: 400,    groundnut: 500    }
  }
};
