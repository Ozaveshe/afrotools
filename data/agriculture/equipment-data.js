// /data/agriculture/equipment-data.js
// AfroTools — Tractor / Equipment Lease vs Buy Data
// Equipment types, hire rates, financing options for 7 key African markets

var EQUIPMENT_DATA = {

  // ─── COUNTRIES ──────────────────────────────────────────────────────────────
  countries: {
    "NG": { name: "Nigeria",       flag: "🇳🇬", currency: "NGN", symbol: "₦",    usdRate: 1550 },
    "KE": { name: "Kenya",         flag: "🇰🇪", currency: "KES", symbol: "KSh",  usdRate: 130  },
    "ZA": { name: "South Africa",  flag: "🇿🇦", currency: "ZAR", symbol: "R",    usdRate: 18   },
    "ET": { name: "Ethiopia",      flag: "🇪🇹", currency: "ETB", symbol: "Br",   usdRate: 57   },
    "GH": { name: "Ghana",         flag: "🇬🇭", currency: "GHS", symbol: "GH₵",  usdRate: 15   },
    "EG": { name: "Egypt",         flag: "🇪🇬", currency: "EGP", symbol: "E£",   usdRate: 50   },
    "TZ": { name: "Tanzania",      flag: "🇹🇿", currency: "TZS", symbol: "TSh",  usdRate: 2500 }
  },

  // ─── EQUIPMENT TYPES ────────────────────────────────────────────────────────
  equipment: {
    "tractor_small": {
      name: "Small Tractor (25–50 HP)",
      examples: "Mahindra 275, John Deere 3028EN, TAFE 35DI, Sonalika DI-35",
      typicalHP: 35,
      purchasePrice_USD: { min: 8000, typical: 15000, max: 25000 },
      lifespan_years: 15,
      annualMaintenance_pct: 5,
      fuelConsumption_L_hr: 4,
      operatingHours_per_year: 600,
      resaleValue_pct_after_10yr: 30,
      suitableFor: "Small-medium farms (5–20 ha). Ploughing, harrowing, ridging, transport.",
      areaCapacity_ha_per_day: { ploughing: 1.5, harrowing: 3, ridging: 2 }
    },
    "tractor_medium": {
      name: "Medium Tractor (50–80 HP)",
      examples: "Massey Ferguson 375, John Deere 5055E, New Holland TT55",
      typicalHP: 65,
      purchasePrice_USD: { min: 20000, typical: 35000, max: 50000 },
      lifespan_years: 15,
      annualMaintenance_pct: 5,
      fuelConsumption_L_hr: 7,
      operatingHours_per_year: 800,
      resaleValue_pct_after_10yr: 35,
      suitableFor: "Medium-large farms (20–100 ha). Commercial farming, contract services.",
      areaCapacity_ha_per_day: { ploughing: 3, harrowing: 6, ridging: 4 }
    },
    "tractor_large": {
      name: "Large Tractor (80–120+ HP)",
      examples: "John Deere 6120M, Massey Ferguson 6713, Case IH Farmall 110A",
      typicalHP: 100,
      purchasePrice_USD: { min: 40000, typical: 65000, max: 100000 },
      lifespan_years: 20,
      annualMaintenance_pct: 4,
      fuelConsumption_L_hr: 12,
      operatingHours_per_year: 1000,
      resaleValue_pct_after_10yr: 40,
      suitableFor: "Large commercial farms (100+ ha). Estate farming, sugarcane, wheat.",
      areaCapacity_ha_per_day: { ploughing: 6, harrowing: 12, ridging: 8 }
    },
    "power_tiller": {
      name: "Power Tiller / Walking Tractor (8–15 HP)",
      examples: "Kubota RT140, VST Shakti, Chinese two-wheel tractors",
      typicalHP: 12,
      purchasePrice_USD: { min: 1500, typical: 3000, max: 5000 },
      lifespan_years: 8,
      annualMaintenance_pct: 8,
      fuelConsumption_L_hr: 1.5,
      operatingHours_per_year: 400,
      resaleValue_pct_after_10yr: 20,
      suitableFor: "Smallholder farms (0.5–5 ha). Rice paddies, vegetable plots. Popular in Tanzania, Madagascar.",
      areaCapacity_ha_per_day: { ploughing: 0.4, harrowing: 0.8, ridging: 0.5 }
    },
    "combine_harvester": {
      name: "Combine Harvester",
      examples: "John Deere S660, CLAAS Tucano, New Holland TC5060",
      typicalHP: 200,
      purchasePrice_USD: { min: 80000, typical: 150000, max: 300000 },
      lifespan_years: 15,
      annualMaintenance_pct: 6,
      fuelConsumption_L_hr: 25,
      operatingHours_per_year: 350,
      resaleValue_pct_after_10yr: 35,
      suitableFor: "Large-scale wheat, rice, maize. South Africa, Egypt, Kenya Rift Valley.",
      areaCapacity_ha_per_day: { harvesting: 10 }
    }
  },

  // ─── HIRE / RENTAL RATES (country-specific, local currency) ─────────────────
  hireRates: {
    "NG": {
      tractor_ploughing_per_ha: 25000,
      tractor_harrowing_per_ha: 18000,
      tractor_ridging_per_ha: 20000,
      combine_per_ha: null,
      power_tiller_per_ha: null,
      diesel_per_litre: 1200,
      availability: "moderate",
      wait_time: "2–4 weeks during planting season",
      providers: "State ADP tractor services, private operators, AMREC mechanization centers",
      notes: "Tractor services scarce in rural areas. Long queues at planting time. Government subsidized rates lower but harder to access."
    },
    "KE": {
      tractor_ploughing_per_ha: 5000,
      tractor_harrowing_per_ha: 3500,
      tractor_ridging_per_ha: 4000,
      combine_per_ha: 8000,
      power_tiller_per_ha: null,
      diesel_per_litre: 185,
      availability: "moderate_to_good",
      wait_time: "1–3 weeks",
      providers: "County government tractor hire, private contractors, Uasin Gishu machinery owners"
    },
    "ZA": {
      tractor_ploughing_per_ha: 1500,
      tractor_harrowing_per_ha: 1000,
      tractor_ridging_per_ha: 1200,
      combine_per_ha: 2500,
      power_tiller_per_ha: null,
      diesel_per_litre: 24,
      availability: "good",
      wait_time: "< 1 week",
      providers: "Private contractors, John Deere/AGCO dealers with service contracts"
    },
    "ET": {
      tractor_ploughing_per_ha: 3000,
      tractor_harrowing_per_ha: 2000,
      tractor_ridging_per_ha: null,
      combine_per_ha: null,
      power_tiller_per_ha: null,
      ox_ploughing_per_ha: 1500,
      diesel_per_litre: 70,
      availability: "limited",
      wait_time: "3–6 weeks",
      providers: "Government tractor rental services, private operators in highland areas",
      notes: "90%+ of highland farmers use ox plough (maresha). Government tractor rental expanding but coverage <5%."
    },
    "GH": {
      tractor_ploughing_per_ha: 350,
      tractor_harrowing_per_ha: 250,
      tractor_ridging_per_ha: 280,
      combine_per_ha: null,
      power_tiller_per_ha: null,
      diesel_per_litre: 15,
      availability: "moderate",
      wait_time: "2–4 weeks",
      providers: "AMSEC (Agricultural Mechanization Service Enterprise Centres), private operators"
    },
    "EG": {
      tractor_ploughing_per_ha: 1500,
      tractor_harrowing_per_ha: 1000,
      tractor_ridging_per_ha: null,
      combine_per_ha: 3000,
      power_tiller_per_ha: null,
      diesel_per_litre: 10,
      availability: "good",
      wait_time: "< 1 week",
      notes: "Well-mechanized. Government subsidy on diesel for agriculture."
    },
    "TZ": {
      tractor_ploughing_per_ha: 80000,
      tractor_harrowing_per_ha: 55000,
      tractor_ridging_per_ha: 60000,
      combine_per_ha: null,
      power_tiller_per_ha: 50000,
      diesel_per_litre: 3200,
      availability: "limited",
      wait_time: "3–5 weeks",
      providers: "Government SUMA JKT programme, private operators",
      notes: "Power tillers popular for rice. Tractor services expanding through government programmes."
    }
  },

  // ─── FINANCING OPTIONS ───────────────────────────────────────────────────────
  financing: {
    "NG": {
      options: [
        { name: "CBN Anchor Borrowers Programme", rate_pct: 9,  term_years: 5, notes: "Government agricultural credit scheme" },
        { name: "Bank of Agriculture",             rate_pct: 12, term_years: 7 },
        { name: "Commercial bank agri-loan",       rate_pct: 22, term_years: 5 },
        { name: "Equipment leasing company",       rate_pct: 28, term_years: 3, notes: "Higher rate but no collateral needed" }
      ]
    },
    "KE": {
      options: [
        { name: "Agricultural Finance Corp (AFC)", rate_pct: 8,  term_years: 7 },
        { name: "Equity Bank agri-loan",           rate_pct: 13, term_years: 5 },
        { name: "SACCOS / Cooperative loan",       rate_pct: 12, term_years: 3 }
      ]
    },
    "ZA": {
      options: [
        { name: "Land Bank",                       rate_pct: 10, term_years: 10 },
        { name: "ABSA AgriBusiness",               rate_pct: 11, term_years: 7  },
        { name: "Standard Bank Agriculture",       rate_pct: 11, term_years: 7  },
        { name: "John Deere Financial",            rate_pct: 12, term_years: 5, notes: "Equipment-specific financing" }
      ]
    },
    "ET": {
      options: [
        { name: "Development Bank of Ethiopia",    rate_pct: 8,  term_years: 7  },
        { name: "Commercial Bank of Ethiopia",     rate_pct: 14, term_years: 5  },
        { name: "Cooperative / Iqub savings",      rate_pct: 0,  term_years: 3, notes: "Interest-free rotating savings" }
      ]
    },
    "GH": {
      options: [
        { name: "Agricultural Development Bank",   rate_pct: 20, term_years: 5 },
        { name: "Rural Community Banks",           rate_pct: 25, term_years: 3 },
        { name: "GIRSAL / Agri-loan guarantee",    rate_pct: 18, term_years: 5, notes: "Government guarantee reduces risk" }
      ]
    },
    "EG": {
      options: [
        { name: "Principal Bank for Development",  rate_pct: 9,  term_years: 7  },
        { name: "National Bank of Egypt",          rate_pct: 12, term_years: 5  },
        { name: "AGROBANK initiative",             rate_pct: 5,  term_years: 5, notes: "Subsidized agricultural loans" }
      ]
    },
    "TZ": {
      options: [
        { name: "Tanzania Agricultural Dev Bank",  rate_pct: 10, term_years: 7  },
        { name: "NMB Bank — Kilimo loan",          rate_pct: 15, term_years: 5  },
        { name: "CRDB Bank — agricultural",        rate_pct: 16, term_years: 5  }
      ]
    }
  }

};
