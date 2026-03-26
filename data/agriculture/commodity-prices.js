// /data/agriculture/commodity-prices.js
// African Agricultural Commodity Price Tracker
// Source: FEWS NET, FAO FPMA, WFP VAM, national market information systems
// Update lastUpdated + prices monthly

var COMMODITY_PRICES = {
  lastUpdated: "2026-03-01",
  source: "FEWS NET, FAO FPMA, WFP VAM, national market information systems",

  // === CURRENCY SYMBOLS ===
  currencySymbols: {
    NGN: "₦", KES: "KSh", ETB: "Br", GHS: "₵", ZAR: "R",
    TZS: "TSh", MWK: "MK", ZMW: "K", UGX: "USh", MZN: "MT",
    XOF: "CFA", XAF: "CFA", EGP: "E£", MGA: "Ar",
    SDG: "SDG", RWF: "RF"
  },

  // === COUNTRY NAMES ===
  countryNames: {
    NG: "Nigeria", KE: "Kenya", ET: "Ethiopia", GH: "Ghana", ZA: "South Africa",
    TZ: "Tanzania", MW: "Malawi", ZM: "Zambia", UG: "Uganda", MZ: "Mozambique",
    SN: "Senegal", MG: "Madagascar", EG: "Egypt", ML: "Mali", SD: "Sudan",
    BF: "Burkina Faso", NE: "Niger", CI: "Côte d'Ivoire", CM: "Cameroon",
    RW: "Rwanda"
  },

  // === COMMODITIES ===
  commodities: {
    "maize": {
      name: "Maize (Corn)",
      icon: "🌽",
      unit: "per tonne",
      globalBenchmark: { exchange: "SAFEX (JSE)", price_USD: 220, notes: "South African white maize — Africa's reference price" },
      countryPrices: {
        "NG": { currency: "NGN", market: "Kano/Dawanau", price: 380000, monthAgo: 420000, yearAgo: 320000, trend: "declining", notes: "Post-harvest season — prices falling from 2025 highs" },
        "KE": { currency: "KES", market: "Nairobi/Eldoret", price: 45000, monthAgo: 48000, yearAgo: 52000, trend: "stable", notes: "Government imports stabilizing prices" },
        "ET": { currency: "ETB", market: "Addis Ababa", price: 16000, monthAgo: 17000, yearAgo: 14000, trend: "declining", notes: "Meher harvest season — seasonal decline" },
        "GH": { currency: "GHS", market: "Techiman/Tamale", price: 3200, monthAgo: 3500, yearAgo: 2800, trend: "declining", notes: "" },
        "ZA": { currency: "ZAR", market: "SAFEX (Randfontein)", price: 4100, monthAgo: 4200, yearAgo: 3800, trend: "stable", notes: "" },
        "TZ": { currency: "TZS", market: "Dar es Salaam", price: 700000, monthAgo: 750000, yearAgo: 600000, trend: "declining", notes: "" },
        "MW": { currency: "MWK", market: "Lilongwe/Lunzu", price: 350000, monthAgo: 380000, yearAgo: 280000, trend: "elevated", notes: "Drought recovery — prices still above average" },
        "ZM": { currency: "ZMW", market: "Lusaka", price: 3500, monthAgo: 3800, yearAgo: 4500, trend: "declining", notes: "" },
        "UG": { currency: "UGX", market: "Kampala", price: 900000, monthAgo: 950000, yearAgo: 800000, trend: "stable", notes: "" },
        "MZ": { currency: "MZN", market: "Maputo/Nampula", price: 18000, monthAgo: 19000, yearAgo: 15000, trend: "stable", notes: "" }
      },
      seasonalPattern: "Prices highest March–July (lean season). Lowest August–November (post-harvest).",
      regionalFlows: "South Africa exports to SADC. Tanzania exports to Kenya/DRC. Nigeria imports when in deficit."
    },
    "rice": {
      name: "Rice (local milled)",
      icon: "🍚",
      unit: "per tonne",
      globalBenchmark: { exchange: "Thailand 5% broken", price_USD: 430, notes: "" },
      countryPrices: {
        "NG": { currency: "NGN", market: "Lagos/Kano", price: 900000, monthAgo: 950000, yearAgo: 750000, trend: "declining", notes: "Kebbi/Ebonyi local rice. Imported rice higher." },
        "SN": { currency: "XOF", market: "Dakar/St Louis", price: 350000, monthAgo: 340000, yearAgo: 380000, trend: "stable", notes: "Mix of local (Senegal River) and imported Thai/Indian rice" },
        "GH": { currency: "GHS", market: "Accra/Tamale", price: 6500, monthAgo: 6800, yearAgo: 5500, trend: "stable", notes: "" },
        "TZ": { currency: "TZS", market: "Mbeya/Dar", price: 2500000, monthAgo: 2400000, yearAgo: 2200000, trend: "rising", notes: "" },
        "MG": { currency: "MGA", market: "Antananarivo", price: 2800000, monthAgo: 2700000, yearAgo: 2500000, trend: "stable", notes: "Madagascar is self-sufficient in rice most years" },
        "EG": { currency: "EGP", market: "Cairo", price: 22000, monthAgo: 23000, yearAgo: 18000, trend: "declining", notes: "" },
        "ML": { currency: "XOF", market: "Bamako/Niono", price: 380000, monthAgo: 400000, yearAgo: 350000, trend: "declining", notes: "Office du Niger irrigated rice" }
      },
      seasonalPattern: "Prices peak during lean season. Imported rice provides a price floor.",
      regionalFlows: "West Africa imports $4B+ of rice annually. Senegal, Nigeria, Côte d'Ivoire, Ghana import heavily."
    },
    "sorghum": {
      name: "Sorghum",
      icon: "🌾",
      unit: "per tonne",
      globalBenchmark: null,
      countryPrices: {
        "NG": { currency: "NGN", market: "Kano/Maiduguri", price: 350000, monthAgo: 380000, yearAgo: 300000, trend: "declining", notes: "" },
        "ET": { currency: "ETB", market: "Dire Dawa/Harar", price: 14000, monthAgo: 15000, yearAgo: 12000, trend: "declining", notes: "" },
        "SD": { currency: "SDG", market: "Gedaref/Khartoum", price: 25000, monthAgo: 28000, yearAgo: 18000, trend: "elevated", notes: "Conflict disrupting markets" },
        "BF": { currency: "XOF", market: "Ouagadougou", price: 220000, monthAgo: 240000, yearAgo: 200000, trend: "declining", notes: "" },
        "NE": { currency: "XOF", market: "Niamey/Maradi", price: 250000, monthAgo: 270000, yearAgo: 230000, trend: "declining", notes: "" }
      },
      seasonalPattern: "Similar to maize. Peak during lean season (May–Aug in Sahel). Low post-harvest (Oct–Dec).",
      regionalFlows: "Mostly consumed within producing countries. Cross-border trade in Sahel belt."
    },
    "millet": {
      name: "Pearl Millet",
      icon: "🌾",
      unit: "per tonne",
      globalBenchmark: null,
      countryPrices: {
        "NE": { currency: "XOF", market: "Niamey/Maradi", price: 280000, monthAgo: 300000, yearAgo: 260000, trend: "declining", notes: "" },
        "NG": { currency: "NGN", market: "Kano/Sokoto", price: 400000, monthAgo: 430000, yearAgo: 350000, trend: "declining", notes: "" },
        "ML": { currency: "XOF", market: "Bamako/Mopti", price: 260000, monthAgo: 280000, yearAgo: 240000, trend: "declining", notes: "" },
        "BF": { currency: "XOF", market: "Ouagadougou", price: 250000, monthAgo: 270000, yearAgo: 230000, trend: "declining", notes: "" }
      },
      seasonalPattern: "Most volatile cereal in the Sahel. Can double in price during the lean season.",
      regionalFlows: "Trade flows within Sahel region — Niger to Nigeria, Mali to Senegal/Mauritania."
    },
    "cowpea": {
      name: "Cowpea (Black-eyed Pea)",
      icon: "🫘",
      unit: "per tonne",
      globalBenchmark: null,
      countryPrices: {
        "NE": { currency: "XOF", market: "Maradi/Zinder", price: 450000, monthAgo: 480000, yearAgo: 400000, trend: "declining", notes: "Niger is world's #2 cowpea exporter" },
        "NG": { currency: "NGN", market: "Kano/Maiduguri", price: 600000, monthAgo: 650000, yearAgo: 500000, trend: "declining", notes: "" },
        "BF": { currency: "XOF", market: "Ouagadougou", price: 400000, monthAgo: 420000, yearAgo: 380000, trend: "stable", notes: "" }
      },
      seasonalPattern: "Post-harvest lows October–December. Lean season highs May–August.",
      regionalFlows: "Niger and Nigeria dominate. Flows south to coastal countries (Ghana, Benin, Togo)."
    },
    "cassava_garri": {
      name: "Garri (processed cassava)",
      icon: "🥣",
      unit: "per tonne",
      globalBenchmark: null,
      countryPrices: {
        "NG": { currency: "NGN", market: "Lagos/Ibadan/Aba", price: 800000, monthAgo: 850000, yearAgo: 600000, trend: "elevated", notes: "White garri. Yellow garri 10–20% higher." },
        "GH": { currency: "GHS", market: "Accra/Kumasi", price: 5000, monthAgo: 5200, yearAgo: 4200, trend: "stable", notes: "" }
      },
      seasonalPattern: "Less seasonal than cereals — cassava can be harvested year-round.",
      regionalFlows: "Nigeria is the dominant producer. Some cross-border trade to Benin, Ghana."
    },
    "cocoa": {
      name: "Cocoa beans (dried)",
      icon: "🍫",
      unit: "per tonne",
      globalBenchmark: { exchange: "ICE London", price_USD: 8500, notes: "Highly volatile — was $12,000 in early 2025" },
      countryPrices: {
        "CI": { currency: "XOF", market: "Farm-gate (CCC fixed)", price: 1000000, monthAgo: 1000000, yearAgo: 825000, trend: "stable", notes: "Government-fixed price per tonne" },
        "GH": { currency: "GHS", market: "Farm-gate (COCOBOD)", price: 48000, monthAgo: 48000, yearAgo: 40000, trend: "stable", notes: "Per tonne. COCOBOD fixed." },
        "NG": { currency: "NGN", market: "Ondo/Akure", price: 3500000, monthAgo: 3200000, yearAgo: 2800000, trend: "rising", notes: "Market-determined. No fixed price." },
        "CM": { currency: "XAF", market: "Douala/Kumba", price: 1200000, monthAgo: 1150000, yearAgo: 950000, trend: "rising", notes: "Liberalized. ONCC reference price." }
      },
      seasonalPattern: "Main crop (Oct–Mar) and mid-crop (Apr–Sep). Prices often move inversely with supply.",
      regionalFlows: "60%+ of world cocoa flows from West Africa (CI + GH) to Europe and US for chocolate."
    },
    "coffee_arabica": {
      name: "Coffee (Arabica green)",
      icon: "☕",
      unit: "per tonne",
      globalBenchmark: { exchange: "ICE New York (C contract)", price_USD: 5500, notes: "" },
      countryPrices: {
        "ET": { currency: "ETB", market: "ECX Addis", price: 450000, monthAgo: 430000, yearAgo: 380000, trend: "rising", notes: "Varies hugely by grade. G2 Yirgacheffe commands premium." },
        "KE": { currency: "KES", market: "Nairobi Coffee Exchange", price: 600000, monthAgo: 580000, yearAgo: 500000, trend: "rising", notes: "AA grade. AB is lower." },
        "TZ": { currency: "TZS", market: "Moshi auction", price: 12000000, monthAgo: 11500000, yearAgo: 10000000, trend: "rising", notes: "AA grade Kilimanjaro" },
        "UG": { currency: "UGX", market: "UCDA Kampala", price: 12000000, monthAgo: 11800000, yearAgo: 10500000, trend: "rising", notes: "Bugisu arabica" },
        "RW": { currency: "RWF", market: "NAEB auction", price: 3500000, monthAgo: 3400000, yearAgo: 3000000, trend: "rising", notes: "Fully washed specialty" }
      },
      seasonalPattern: "Main harvest Oct–Jan (East Africa). Prices track ICE C contract closely.",
      regionalFlows: "East African arabica commands specialty premiums in EU, US, and Japan markets."
    },
    "sesame": {
      name: "Sesame seed",
      icon: "🌱",
      unit: "per tonne",
      globalBenchmark: { exchange: "International", price_USD: 1800, notes: "" },
      countryPrices: {
        "ET": { currency: "ETB", market: "Humera/Metema", price: 80000, monthAgo: 78000, yearAgo: 72000, trend: "rising", notes: "" },
        "SD": { currency: "SDG", market: "Gedaref", price: 35000, monthAgo: 32000, yearAgo: 25000, trend: "rising", notes: "Sudan is Africa's #1 producer" },
        "NG": { currency: "NGN", market: "Nasarawa/Benue", price: 1200000, monthAgo: 1150000, yearAgo: 1000000, trend: "rising", notes: "" },
        "TZ": { currency: "TZS", market: "Dar es Salaam", price: 3500000, monthAgo: 3400000, yearAgo: 3000000, trend: "rising", notes: "" }
      },
      seasonalPattern: "Harvest October–December. Prices typically soften post-harvest.",
      regionalFlows: "Africa is a major sesame exporter. China, Japan, Turkey are the biggest buyers."
    },
    "groundnut": {
      name: "Groundnut (shelled)",
      icon: "🥜",
      unit: "per tonne",
      globalBenchmark: null,
      countryPrices: {
        "NG": { currency: "NGN", market: "Kano", price: 800000, monthAgo: 820000, yearAgo: 700000, trend: "stable", notes: "" },
        "SN": { currency: "XOF", market: "Kaolack", price: 400000, monthAgo: 410000, yearAgo: 380000, trend: "stable", notes: "" },
        "MW": { currency: "MWK", market: "Lilongwe", price: 500000, monthAgo: 510000, yearAgo: 450000, trend: "stable", notes: "" },
        "GH": { currency: "GHS", market: "Tamale", price: 8000, monthAgo: 8200, yearAgo: 7200, trend: "declining", notes: "" }
      },
      seasonalPattern: "Post-harvest lows November–January. Lean season highs June–September.",
      regionalFlows: "Senegal (groundnut basin) and Nigeria are major producers. Significant oil extraction trade."
    }
  },

  // === SEASONAL PRICE PATTERNS ===
  seasonalPatterns: {
    cereals_unimodal: {
      description: "Single rainy season (Sahel, Southern Africa)",
      months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      indexValues: [115, 118, 125, 130, 140, 145, 145, 130, 100, 90, 88, 95]
    },
    cereals_bimodal: {
      description: "Two rainy seasons (East Africa highlands, Southern Nigeria)",
      months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      indexValues: [95, 90, 105, 115, 130, 120, 110, 100, 90, 95, 105, 100]
    },
    coffee_arabica: {
      description: "East African arabica (harvest Oct–Jan)",
      months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      indexValues: [95, 98, 102, 108, 112, 115, 118, 120, 115, 100, 92, 90]
    },
    cocoa_westafrica: {
      description: "West African cocoa (main crop Oct–Mar)",
      months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      indexValues: [105, 108, 110, 115, 118, 120, 122, 118, 110, 100, 95, 98]
    }
  },

  // === TRADE FLOW PATTERNS ===
  tradeFlows: [
    { from: "ZA", to: "Zimbabwe, Mozambique, Malawi", commodity: "Maize", notes: "South Africa is SADC's granary. White maize exports to SADC neighbours." },
    { from: "TZ", to: "Kenya, DRC, Rwanda, Burundi", commodity: "Maize", notes: "Tanzania exports surplus maize to neighbours, especially DRC and Kenya." },
    { from: "Asia (Thailand, India)", to: "Nigeria, Senegal, Côte d'Ivoire, Ghana", commodity: "Rice", notes: "West Africa imports $4B+ of rice annually from Asia." },
    { from: "Côte d'Ivoire, Ghana", to: "EU, US, Japan", commodity: "Cocoa", notes: "60%+ of world cocoa flows from West Africa to Europe and US for chocolate." },
    { from: "Ethiopia, Kenya, Uganda, Tanzania", to: "EU, US, Japan", commodity: "Coffee (Arabica)", notes: "East African arabica commands specialty premiums globally." },
    { from: "Niger, Nigeria", to: "Ghana, Benin, Togo", commodity: "Cowpea", notes: "Niger and Nigeria dominate. Flows south to coastal countries." },
    { from: "Ethiopia, Sudan, Tanzania, Nigeria", to: "China, Japan, Turkey", commodity: "Sesame", notes: "Africa is a major sesame exporter — China and Japan are biggest buyers." }
  ]
};
