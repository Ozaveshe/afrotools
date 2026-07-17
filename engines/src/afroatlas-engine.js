var AfroAtlas = function() {
  "use strict";
  var e = {
    oil: {
      emoji: "🛢️",
      label: "Crude Oil",
      color: "#1a1a2e"
    },
    gas: {
      emoji: "🔥",
      label: "Natural Gas",
      color: "#e94560"
    },
    gold: {
      emoji: "🥇",
      label: "Gold",
      color: "#F5A623"
    },
    diamond: {
      emoji: "💎",
      label: "Diamonds",
      color: "#60A5FA"
    },
    copper: {
      emoji: "🔶",
      label: "Copper",
      color: "#B45309"
    },
    cobalt: {
      emoji: "⚡",
      label: "Cobalt",
      color: "#3B82F6"
    },
    iron: {
      emoji: "⛏️",
      label: "Iron Ore",
      color: "#78716C"
    },
    uranium: {
      emoji: "☢️",
      label: "Uranium",
      color: "#84CC16"
    },
    platinum: {
      emoji: "✨",
      label: "Platinum",
      color: "#E5E7EB"
    },
    bauxite: {
      emoji: "🟠",
      label: "Bauxite",
      color: "#EA580C"
    },
    phosphate: {
      emoji: "🧪",
      label: "Phosphates",
      color: "#14B8A6"
    },
    coal: {
      emoji: "⬛",
      label: "Coal",
      color: "#343a40"
    },
    chromium: {
      emoji: "🔗",
      label: "Chromium",
      color: "#495057"
    },
    manganese: {
      emoji: "🔧",
      label: "Manganese",
      color: "#6d6875"
    },
    lithium: {
      emoji: "🔋",
      label: "Lithium",
      color: "#80ed99"
    },
    coltan: {
      emoji: "📱",
      label: "Coltan/Tantalum",
      color: "#5e60ce"
    },
    timber: {
      emoji: "🪵",
      label: "Timber",
      color: "#166534"
    },
    fish: {
      emoji: "🐟",
      label: "Fisheries",
      color: "#0077b6"
    },
    farm: {
      emoji: "🌾",
      label: "Arable Land",
      color: "#588157"
    },
    cocoa: {
      emoji: "🍫",
      label: "Cocoa",
      color: "#92400E"
    },
    coffee: {
      emoji: "☕",
      label: "Coffee",
      color: "#78350F"
    },
    mineral: {
      emoji: "⛏️",
      label: "Other Minerals",
      color: "#8d99ae"
    }
  }, o = {
    west: {
      name: "West Africa",
      codes: [ "NG", "GH", "SN", "CI", "CM", "ML", "BF", "GN", "NE", "TG", "BJ", "SL", "LR", "GM", "GW", "CV", "MR" ]
    },
    east: {
      name: "East Africa",
      codes: [ "KE", "TZ", "ET", "UG", "RW", "MZ", "MG", "ZM", "ZW", "MW", "SO", "BI", "DJ", "ER", "SS" ]
    },
    south: {
      name: "Southern Africa",
      codes: [ "ZA", "BW", "NA", "LS", "SZ", "AO" ]
    },
    central: {
      name: "Central Africa",
      codes: [ "CD", "CG", "GA", "CF", "TD", "GQ", "ST" ]
    },
    north: {
      name: "North Africa",
      codes: [ "EG", "MA", "DZ", "TN", "LY", "SD" ]
    },
    island: {
      name: "Island Nations",
      codes: [ "MU", "SC", "KM" ]
    }
  }, r = {
    NG: {
      name: "Nigeria",
      slug: "nigeria",
      flag: "🇳🇬",
      region: "west",
      capital: "Abuja",
      population: 2238e5,
      popGrowth: 2.4,
      gdp: 363e9,
      gdpPpp: 127e10,
      gdpPC: 1621,
      gdpPCppp: 5675,
      gdpGrowth: 3.3,
      gdpHist: {
        1990: 308e8,
        2e3: 464e8,
        2010: 3691e8,
        2015: 4868e8,
        2020: 4323e8,
        2024: 363e9
      },
      currency: {
        code: "NGN",
        name: "Nigerian Naira",
        sym: "₦"
      },
      resources: [ {
        type: "oil",
        rank: 1,
        prod: "1.25M bpd",
        share: 25,
        global: 11,
        note: "Africa's largest oil producer"
      }, {
        type: "gas",
        rank: 1,
        prod: "49.3 bcm/yr",
        share: 35,
        global: 9,
        note: "Largest gas reserves in Africa"
      }, {
        type: "farm",
        rank: 3,
        prod: "34M hectares",
        share: 12,
        global: 14,
        note: "65% of land is arable"
      }, {
        type: "iron",
        rank: 3,
        prod: "3M tonnes/yr",
        share: 8,
        global: null,
        note: "Kogi and Enugu states"
      }, {
        type: "cocoa",
        rank: 4,
        prod: "350K tonnes/yr",
        share: 9,
        global: 4,
        note: "Was once world's largest cocoa producer"
      } ],
      exports: [ {
        p: "Crude Petroleum",
        v: 42e9,
        s: 72
      }, {
        p: "Petroleum Gas",
        v: 65e8,
        s: 11
      }, {
        p: "Cocoa Beans",
        v: 8e8,
        s: 1.4
      }, {
        p: "Rubber",
        v: 4e8,
        s: .7
      }, {
        p: "Sesame Seeds",
        v: 35e7,
        s: .6
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 13e9,
        s: 22
      }, {
        p: "Wheat",
        v: 32e8,
        s: 5.5
      }, {
        p: "Cars",
        v: 28e8,
        s: 4.8
      }, {
        p: "Medicines",
        v: 21e8,
        s: 3.6
      }, {
        p: "Plastics",
        v: 18e8,
        s: 3.1
      } ],
      totalExports: 58e9,
      totalImports: 585e8,
      hdi: .535,
      hdiRank: 163,
      gini: 35.1,
      inflation: 28.9,
      unemployment: 33.3,
      debtGdp: 38.8,
      fdi: 31e8,
      electricity: 62,
      internet: 55,
      lifeExp: 52.7,
      literacy: 62,
      rrs: 78,
      tagline: "The Oil Giant That Could Feed a Continent",
      paradox: "Nigeria earns $42B/year from oil yet 40% lives below the poverty line. With 84M hectares of arable land, it imports $3.2B in wheat annually.",
      tools: [ {
        n: "Nigeria PAYE Calculator",
        p: "/nigeria/ng-salary-tax"
      }, {
        n: "Nigeria VAT Calculator",
        p: "/tools/vat-calculator/vat-calc"
      } ]
    },
    GH: {
      name: "Ghana",
      slug: "ghana",
      flag: "🇬🇭",
      region: "west",
      capital: "Accra",
      population: 335e5,
      popGrowth: 2.1,
      gdp: 76e9,
      gdpPpp: 236e9,
      gdpPC: 2268,
      gdpPCppp: 7043,
      gdpGrowth: 2.9,
      gdpHist: {
        1990: 59e8,
        2e3: 498e7,
        2010: 322e8,
        2015: 492e8,
        2020: 685e8,
        2024: 76e9
      },
      currency: {
        code: "GHS",
        name: "Ghanaian Cedi",
        sym: "₵"
      },
      resources: [ {
        type: "gold",
        rank: 1,
        prod: "130 tonnes/yr",
        share: 27,
        global: 6,
        note: "Africa's largest gold producer since 2019"
      }, {
        type: "oil",
        rank: 5,
        prod: "148K bpd",
        share: 3,
        global: 38,
        note: "Jubilee field discovered 2007"
      }, {
        type: "cocoa",
        rank: 2,
        prod: "800K tonnes/yr",
        share: 15,
        global: 2,
        note: "World's second-largest cocoa producer"
      }, {
        type: "bauxite",
        rank: 3,
        prod: "1.2M tonnes/yr",
        share: 3,
        global: 11,
        note: "Awaso and Nyinahin deposits"
      }, {
        type: "manganese",
        rank: 3,
        prod: "2.2M tonnes/yr",
        share: 5,
        global: 5,
        note: "Nsuta mine"
      } ],
      exports: [ {
        p: "Gold",
        v: 85e8,
        s: 38
      }, {
        p: "Crude Petroleum",
        v: 52e8,
        s: 23
      }, {
        p: "Cocoa Beans",
        v: 38e8,
        s: 17
      }, {
        p: "Cocoa Paste",
        v: 8e8,
        s: 3.6
      }, {
        p: "Manganese Ore",
        v: 6e8,
        s: 2.7
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 28e8,
        s: 15
      }, {
        p: "Cars",
        v: 11e8,
        s: 5.9
      }, {
        p: "Rice",
        v: 9e8,
        s: 4.8
      }, {
        p: "Medicines",
        v: 6e8,
        s: 3.2
      }, {
        p: "Cement",
        v: 5e8,
        s: 2.7
      } ],
      totalExports: 224e8,
      totalImports: 186e8,
      hdi: .602,
      hdiRank: 142,
      gini: 43.5,
      inflation: 23.2,
      unemployment: 14.7,
      debtGdp: 88.1,
      fdi: 26e8,
      electricity: 85,
      internet: 68,
      lifeExp: 63.8,
      literacy: 79,
      rrs: 72,
      tagline: "Gold Coast Reborn as Africa's Democratic Model",
      paradox: "Africa's top gold producer and 2nd-largest cocoa exporter, yet debt-to-GDP exceeds 88%.",
      tools: [ {
        n: "Ghana PAYE Calculator",
        p: "/ghana/gh-paye"
      } ]
    },
    CI: {
      name: "Côte d'Ivoire",
      slug: "cote-divoire",
      flag: "🇨🇮",
      region: "west",
      capital: "Yamoussoukro",
      population: 286e5,
      popGrowth: 2.5,
      gdp: 78e9,
      gdpPpp: 199e9,
      gdpPC: 2728,
      gdpPCppp: 6960,
      gdpGrowth: 6.5,
      gdpHist: {
        1990: 108e8,
        2e3: 104e8,
        2010: 249e8,
        2015: 364e8,
        2020: 613e8,
        2024: 78e9
      },
      currency: {
        code: "XOF",
        name: "West African CFA Franc",
        sym: "CFA"
      },
      resources: [ {
        type: "cocoa",
        rank: 1,
        prod: "2.2M tonnes/yr",
        share: 40,
        global: 1,
        note: "World's largest cocoa producer — 40% of global supply"
      }, {
        type: "gold",
        rank: 5,
        prod: "48 tonnes/yr",
        share: 10,
        global: 16,
        note: "Rapidly expanding gold sector"
      }, {
        type: "oil",
        rank: 7,
        prod: "30K bpd",
        share: .6,
        global: null,
        note: "Modest offshore production"
      }, {
        type: "farm",
        rank: 2,
        prod: "Cashew: 1M tonnes/yr",
        share: 45,
        global: 1,
        note: "World's top cashew producer"
      } ],
      exports: [ {
        p: "Cocoa Beans",
        v: 58e8,
        s: 30
      }, {
        p: "Gold",
        v: 32e8,
        s: 16
      }, {
        p: "Refined Petroleum",
        v: 25e8,
        s: 13
      }, {
        p: "Rubber",
        v: 18e8,
        s: 9.2
      }, {
        p: "Cashew Nuts",
        v: 12e8,
        s: 6.1
      } ],
      imports: [ {
        p: "Crude Petroleum",
        v: 35e8,
        s: 16
      }, {
        p: "Rice",
        v: 14e8,
        s: 6.4
      }, {
        p: "Medicines",
        v: 8e8,
        s: 3.7
      }, {
        p: "Fish",
        v: 7e8,
        s: 3.2
      }, {
        p: "Wheat",
        v: 6e8,
        s: 2.8
      } ],
      totalExports: 195e8,
      totalImports: 218e8,
      hdi: .534,
      hdiRank: 164,
      gini: 37.2,
      inflation: 4.4,
      unemployment: 3.4,
      debtGdp: 56.8,
      fdi: 16e8,
      electricity: 70,
      internet: 45,
      lifeExp: 58.6,
      literacy: 47,
      rrs: 68,
      tagline: "The Chocolate Empire That Sweetens the World",
      paradox: "Produces 40% of the world's cocoa yet captures less than 6% of the $130B chocolate market.",
      tools: [ {
        n: "Côte d'Ivoire PAYE",
        p: "/cote-divoire/ci-paye"
      } ]
    },
    SN: {
      name: "Senegal",
      slug: "senegal",
      flag: "🇸🇳",
      region: "west",
      capital: "Dakar",
      population: 179e5,
      popGrowth: 2.7,
      gdp: 311e8,
      gdpPpp: 774e8,
      gdpPC: 1738,
      gdpPCppp: 4328,
      gdpGrowth: 8.8,
      gdpHist: {
        1990: 57e8,
        2e3: 47e8,
        2010: 129e8,
        2015: 186e8,
        2020: 244e8,
        2024: 311e8
      },
      currency: {
        code: "XOF",
        name: "West African CFA Franc",
        sym: "CFA"
      },
      resources: [ {
        type: "phosphate",
        rank: 3,
        prod: "2.8M tonnes/yr",
        share: 8,
        global: 11,
        note: "Thiès region"
      }, {
        type: "gas",
        rank: 5,
        prod: "Greater Tortue Ahmeyim",
        share: 0,
        global: null,
        note: "Massive offshore gas, first production 2024"
      }, {
        type: "fish",
        rank: 2,
        prod: "500K tonnes/yr",
        share: 12,
        global: 25,
        note: "Major fishing industry"
      }, {
        type: "gold",
        rank: 7,
        prod: "18 tonnes/yr",
        share: 3.7,
        global: null,
        note: "Sabodala mine"
      } ],
      exports: [ {
        p: "Gold",
        v: 38e8,
        s: 28
      }, {
        p: "Phosphoric Acid",
        v: 12e8,
        s: 8.9
      }, {
        p: "Fish",
        v: 11e8,
        s: 8.1
      }, {
        p: "Refined Petroleum",
        v: 9e8,
        s: 6.7
      }, {
        p: "Cement",
        v: 5e8,
        s: 3.7
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 32e8,
        s: 18
      }, {
        p: "Rice",
        v: 9e8,
        s: 5.1
      }, {
        p: "Wheat",
        v: 5e8,
        s: 2.8
      }, {
        p: "Medicines",
        v: 45e7,
        s: 2.6
      }, {
        p: "Cars",
        v: 4e8,
        s: 2.3
      } ],
      totalExports: 135e8,
      totalImports: 176e8,
      hdi: .511,
      hdiRank: 170,
      gini: 40.3,
      inflation: 3.7,
      unemployment: 22,
      debtGdp: 76.4,
      fdi: 27e8,
      electricity: 67,
      internet: 58,
      lifeExp: 68.2,
      literacy: 52,
      rrs: 58,
      tagline: "West Africa's Newest Oil & Gas Frontier",
      paradox: "Poised to become a major hydrocarbons producer yet currently imports 90% of its energy.",
      tools: [ {
        n: "Senegal PAYE Calculator",
        p: "/senegal/sn-paye"
      } ]
    },
    CM: {
      name: "Cameroon",
      slug: "cameroon",
      flag: "🇨🇲",
      region: "west",
      capital: "Yaoundé",
      population: 286e5,
      popGrowth: 2.6,
      gdp: 443e8,
      gdpPpp: 115e9,
      gdpPC: 1548,
      gdpPCppp: 4020,
      gdpGrowth: 3.8,
      gdpHist: {
        1990: 112e8,
        2e3: 93e8,
        2010: 236e8,
        2015: 321e8,
        2020: 408e8,
        2024: 443e8
      },
      currency: {
        code: "XAF",
        name: "Central African CFA Franc",
        sym: "FCFA"
      },
      resources: [ {
        type: "oil",
        rank: 6,
        prod: "53K bpd",
        share: 1.1,
        global: 44,
        note: "Declining mature fields"
      }, {
        type: "timber",
        rank: 2,
        prod: "2.3M m³/yr",
        share: 15,
        global: null,
        note: "Second-largest tropical forest in Africa"
      }, {
        type: "bauxite",
        rank: 2,
        prod: "1.5M tonnes/yr",
        share: 4,
        global: 12,
        note: "Minim-Martap deposits"
      }, {
        type: "cocoa",
        rank: 3,
        prod: "280K tonnes/yr",
        share: 5,
        global: 5,
        note: "5th-largest cocoa producer globally"
      } ],
      exports: [ {
        p: "Crude Petroleum",
        v: 32e8,
        s: 31
      }, {
        p: "Cocoa Beans",
        v: 11e8,
        s: 10.7
      }, {
        p: "Sawn Wood",
        v: 9e8,
        s: 8.7
      }, {
        p: "Bananas",
        v: 4e8,
        s: 3.9
      }, {
        p: "Aluminum",
        v: 35e7,
        s: 3.4
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 18e8,
        s: 14
      }, {
        p: "Rice",
        v: 7e8,
        s: 5.4
      }, {
        p: "Medicines",
        v: 5e8,
        s: 3.9
      }, {
        p: "Wheat",
        v: 45e7,
        s: 3.5
      }, {
        p: "Machinery",
        v: 4e8,
        s: 3.1
      } ],
      totalExports: 103e8,
      totalImports: 129e8,
      hdi: .576,
      hdiRank: 151,
      gini: 46.6,
      inflation: 7.4,
      unemployment: 6.1,
      debtGdp: 46.3,
      fdi: 9e8,
      electricity: 65,
      internet: 36,
      lifeExp: 59.3,
      literacy: 77,
      rrs: 62,
      tagline: "Africa in Miniature — From Sahel to Sea",
      paradox: "Holds the continent's 2nd-largest tropical forest yet refining capacity is near zero.",
      tools: [ {
        n: "Cameroon PAYE Calculator",
        p: "/cameroon/cm-paye"
      } ]
    },
    ML: {
      name: "Mali",
      slug: "mali",
      flag: "🇲🇱",
      region: "west",
      capital: "Bamako",
      population: 226e5,
      popGrowth: 3,
      gdp: 205e8,
      gdpPpp: 562e8,
      gdpPC: 907,
      gdpPCppp: 2487,
      gdpGrowth: 4.5,
      gdpHist: {
        1990: 24e8,
        2e3: 26e8,
        2010: 106e8,
        2015: 131e8,
        2020: 175e8,
        2024: 205e8
      },
      currency: {
        code: "XOF",
        name: "West African CFA Franc",
        sym: "CFA"
      },
      resources: [ {
        type: "gold",
        rank: 3,
        prod: "66 tonnes/yr",
        share: 13.6,
        global: 14,
        note: "Third-largest gold producer in Africa"
      }, {
        type: "farm",
        rank: 6,
        prod: "Cotton/rice/millet",
        share: 3,
        global: null,
        note: "Agriculture employs 80%"
      } ],
      exports: [ {
        p: "Gold",
        v: 48e8,
        s: 80
      }, {
        p: "Raw Cotton",
        v: 6e8,
        s: 10
      }, {
        p: "Live Animals",
        v: 12e7,
        s: 2
      }, {
        p: "Sesame Seeds",
        v: 8e7,
        s: 1.3
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 12e8,
        s: 17
      }, {
        p: "Medicines",
        v: 4e8,
        s: 5.7
      }, {
        p: "Cement",
        v: 3e8,
        s: 4.3
      }, {
        p: "Rice",
        v: 28e7,
        s: 4
      } ],
      totalExports: 6e9,
      totalImports: 7e9,
      hdi: .41,
      hdiRank: 188,
      gini: 33,
      inflation: 2.8,
      unemployment: 7.5,
      debtGdp: 52,
      fdi: 6e8,
      electricity: 50,
      internet: 33,
      lifeExp: 59.3,
      literacy: 31,
      rrs: 52,
      tagline: "The Golden Landlocked Giant of the Sahel",
      paradox: "Africa's 3rd-largest gold producer at $4.8B/yr yet literacy is just 31%.",
      tools: [ {
        n: "Mali PAYE Calculator",
        p: "/mali/ml-paye"
      } ]
    },
    BF: {
      name: "Burkina Faso",
      slug: "burkina-faso",
      flag: "🇧🇫",
      region: "west",
      capital: "Ouagadougou",
      population: 227e5,
      popGrowth: 2.5,
      gdp: 194e8,
      gdpPpp: 551e8,
      gdpPC: 855,
      gdpPCppp: 2427,
      gdpGrowth: 5,
      gdpHist: {
        1990: 31e8,
        2e3: 26e8,
        2010: 101e8,
        2015: 12e9,
        2020: 179e8,
        2024: 194e8
      },
      currency: {
        code: "XOF",
        name: "West African CFA Franc",
        sym: "CFA"
      },
      resources: [ {
        type: "gold",
        rank: 4,
        prod: "57 tonnes/yr",
        share: 11.7,
        global: 16,
        note: "Fastest-growing gold sector in Africa"
      }, {
        type: "farm",
        rank: 7,
        prod: "Cotton/shea nuts",
        share: 5,
        global: 2,
        note: "World's 2nd-largest shea nut producer"
      } ],
      exports: [ {
        p: "Gold",
        v: 56e8,
        s: 75
      }, {
        p: "Raw Cotton",
        v: 9e8,
        s: 12
      }, {
        p: "Zinc Ore",
        v: 3e8,
        s: 4
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 13e8,
        s: 16
      }, {
        p: "Medicines",
        v: 4e8,
        s: 4.9
      }, {
        p: "Rice",
        v: 35e7,
        s: 4.3
      } ],
      totalExports: 75e8,
      totalImports: 81e8,
      hdi: .438,
      hdiRank: 185,
      gini: 35.3,
      inflation: 1.4,
      unemployment: 5.3,
      debtGdp: 55.8,
      fdi: 1e8,
      electricity: 22,
      internet: 21,
      lifeExp: 59.2,
      literacy: 41,
      rrs: 55,
      tagline: "Cotton Fields and Gold Mines in the Heart of the Sahel",
      paradox: "Africa's largest cotton and 4th-largest gold producer, yet only 22% have electricity.",
      tools: [ {
        n: "Burkina Faso PAYE",
        p: "/burkina-faso/bf-paye"
      } ]
    },
    GN: {
      name: "Guinea",
      slug: "guinea",
      flag: "🇬🇳",
      region: "west",
      capital: "Conakry",
      population: 142e5,
      popGrowth: 2.8,
      gdp: 215e8,
      gdpPpp: 478e8,
      gdpPC: 1514,
      gdpPCppp: 3366,
      gdpGrowth: 5.6,
      gdpHist: {
        1990: 27e8,
        2e3: 3e9,
        2010: 68e8,
        2015: 88e8,
        2020: 157e8,
        2024: 215e8
      },
      currency: {
        code: "GNF",
        name: "Guinean Franc",
        sym: "FG"
      },
      resources: [ {
        type: "bauxite",
        rank: 1,
        prod: "100M tonnes/yr",
        share: 70,
        global: 1,
        note: "World's largest bauxite reserves and #1 exporter"
      }, {
        type: "iron",
        rank: 2,
        prod: "Simandou — 2B+ tonnes reserves",
        share: 0,
        global: null,
        note: "World's largest untapped iron ore deposit"
      }, {
        type: "gold",
        rank: 6,
        prod: "25 tonnes/yr",
        share: 5.1,
        global: null,
        note: "Growing mining sector"
      }, {
        type: "diamond",
        rank: 5,
        prod: "300K carats/yr",
        share: .6,
        global: null,
        note: "Alluvial deposits"
      } ],
      exports: [ {
        p: "Bauxite",
        v: 55e8,
        s: 61
      }, {
        p: "Gold",
        v: 24e8,
        s: 27
      }, {
        p: "Aluminum Ore",
        v: 5e8,
        s: 5.6
      }, {
        p: "Fish",
        v: 2e8,
        s: 2.2
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 15e8,
        s: 19
      }, {
        p: "Rice",
        v: 8e8,
        s: 10
      }, {
        p: "Medicines",
        v: 35e7,
        s: 4.4
      }, {
        p: "Machinery",
        v: 3e8,
        s: 3.8
      } ],
      totalExports: 9e9,
      totalImports: 79e8,
      hdi: .465,
      hdiRank: 182,
      gini: 29.6,
      inflation: 8.2,
      unemployment: 6.2,
      debtGdp: 37.6,
      fdi: 4e8,
      electricity: 44,
      internet: 35,
      lifeExp: 58.9,
      literacy: 32,
      rrs: 74,
      tagline: "The Bauxite Behemoth Sitting on Iron Gold",
      paradox: "Holds a third of the world's bauxite and the richest untapped iron deposit (Simandou), yet 44% electricity access.",
      tools: [ {
        n: "Guinea PAYE Calculator",
        p: "/guinea/gn-paye"
      } ]
    },
    NE: {
      name: "Niger",
      slug: "niger",
      flag: "🇳🇪",
      region: "west",
      capital: "Niamey",
      population: 262e5,
      popGrowth: 3.7,
      gdp: 166e8,
      gdpPpp: 436e8,
      gdpPC: 634,
      gdpPCppp: 1664,
      gdpGrowth: 6,
      gdpHist: {
        1990: 25e8,
        2e3: 18e8,
        2010: 57e8,
        2015: 76e8,
        2020: 137e8,
        2024: 166e8
      },
      currency: {
        code: "XOF",
        name: "West African CFA Franc",
        sym: "CFA"
      },
      resources: [ {
        type: "uranium",
        rank: 1,
        prod: "2020 tonnes/yr",
        share: 60,
        global: 5,
        note: "Africa's largest uranium producer — fuels French nuclear plants"
      }, {
        type: "oil",
        rank: 8,
        prod: "20K bpd",
        share: .4,
        global: null,
        note: "Agadem block"
      }, {
        type: "gold",
        rank: 8,
        prod: "15 tonnes/yr",
        share: 3.1,
        global: null,
        note: "Artisanal and Samira Hill mine"
      } ],
      exports: [ {
        p: "Uranium",
        v: 6e8,
        s: 25
      }, {
        p: "Gold",
        v: 5e8,
        s: 21
      }, {
        p: "Crude Petroleum",
        v: 4e8,
        s: 17
      }, {
        p: "Onions",
        v: 15e7,
        s: 6.3
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 6e8,
        s: 14
      }, {
        p: "Rice",
        v: 3e8,
        s: 7
      }, {
        p: "Machinery",
        v: 28e7,
        s: 6.5
      }, {
        p: "Medicines",
        v: 25e7,
        s: 5.8
      } ],
      totalExports: 24e8,
      totalImports: 43e8,
      hdi: .394,
      hdiRank: 189,
      gini: 32.9,
      inflation: 3.7,
      unemployment: .5,
      debtGdp: 50.2,
      fdi: 6e8,
      electricity: 19,
      internet: 17,
      lifeExp: 62,
      literacy: 35,
      rrs: 48,
      tagline: "The Uranium Heartbeat of Europe's Nuclear Grid",
      paradox: "Produces the uranium powering France's reactors, yet only 19% of Nigeriens have electricity.",
      tools: [ {
        n: "Niger PAYE Calculator",
        p: "/niger/ne-paye"
      } ]
    },
    TG: {
      name: "Togo",
      slug: "togo",
      flag: "🇹🇬",
      region: "west",
      capital: "Lomé",
      population: 885e4,
      popGrowth: 2.3,
      gdp: 91e8,
      gdpPpp: 232e8,
      gdpPC: 1028,
      gdpPCppp: 2621,
      gdpGrowth: 5.3,
      gdpHist: {
        1990: 16e8,
        2e3: 13e8,
        2010: 34e8,
        2015: 47e8,
        2020: 76e8,
        2024: 91e8
      },
      currency: {
        code: "XOF",
        name: "West African CFA Franc",
        sym: "CFA"
      },
      resources: [ {
        type: "phosphate",
        rank: 2,
        prod: "1.5M tonnes/yr",
        share: 4,
        global: 15,
        note: "Once the world's 5th-largest phosphate producer"
      } ],
      exports: [ {
        p: "Refined Petroleum",
        v: 12e8,
        s: 24
      }, {
        p: "Phosphate Rock",
        v: 4e8,
        s: 8
      }, {
        p: "Cement",
        v: 35e7,
        s: 7
      }, {
        p: "Cotton",
        v: 2e8,
        s: 4
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 14e8,
        s: 18
      }, {
        p: "Rice",
        v: 35e7,
        s: 4.5
      }, {
        p: "Cars",
        v: 3e8,
        s: 3.9
      } ],
      totalExports: 5e9,
      totalImports: 77e8,
      hdi: .539,
      hdiRank: 162,
      gini: 42.4,
      inflation: 3.5,
      unemployment: 3.9,
      debtGdp: 67.5,
      fdi: 3e8,
      electricity: 55,
      internet: 35,
      lifeExp: 61.6,
      literacy: 64,
      rrs: 35,
      tagline: "West Africa's Phosphate Port and Transit Hub",
      paradox: "Port of Lomé is the only deepwater port in West Africa, yet 45% live below the poverty line.",
      tools: [ {
        n: "Togo PAYE Calculator",
        p: "/togo/tg-paye"
      } ]
    },
    BJ: {
      name: "Benin",
      slug: "benin",
      flag: "🇧🇯",
      region: "west",
      capital: "Porto-Novo",
      population: 134e5,
      popGrowth: 2.6,
      gdp: 196e8,
      gdpPpp: 543e8,
      gdpPC: 1463,
      gdpPCppp: 4052,
      gdpGrowth: 6,
      gdpHist: {
        1990: 18e8,
        2e3: 24e8,
        2010: 66e8,
        2015: 93e8,
        2020: 157e8,
        2024: 196e8
      },
      currency: {
        code: "XOF",
        name: "West African CFA Franc",
        sym: "CFA"
      },
      resources: [ {
        type: "farm",
        rank: null,
        prod: "Cotton/cashew",
        share: 3,
        global: null,
        note: "Cotton is 80% of export revenue"
      } ],
      exports: [ {
        p: "Raw Cotton",
        v: 15e8,
        s: 33
      }, {
        p: "Cashew Nuts",
        v: 7e8,
        s: 15
      }, {
        p: "Gold",
        v: 35e7,
        s: 7.7
      } ],
      imports: [ {
        p: "Rice",
        v: 8e8,
        s: 10
      }, {
        p: "Refined Petroleum",
        v: 7e8,
        s: 8.9
      }, {
        p: "Cars",
        v: 5e8,
        s: 6.4
      } ],
      totalExports: 45e8,
      totalImports: 79e8,
      hdi: .504,
      hdiRank: 173,
      gini: 37.8,
      inflation: 2.8,
      unemployment: 1.5,
      debtGdp: 54.3,
      fdi: 3e8,
      electricity: 42,
      internet: 34,
      lifeExp: 60,
      literacy: 42,
      rrs: 28,
      tagline: "Cotton Kingdom and Gateway to the Sahel",
      paradox: "Economy depends on cotton for 80% of exports, extremely vulnerable to commodity shocks.",
      tools: [ {
        n: "Benin PAYE Calculator",
        p: "/benin/bj-paye"
      } ]
    },
    SL: {
      name: "Sierra Leone",
      slug: "sierra-leone",
      flag: "🇸🇱",
      region: "west",
      capital: "Freetown",
      population: 86e5,
      popGrowth: 2.1,
      gdp: 42e8,
      gdpPpp: 162e8,
      gdpPC: 488,
      gdpPCppp: 1884,
      gdpGrowth: 3.5,
      gdpHist: {
        1990: 65e7,
        2e3: 64e7,
        2010: 26e8,
        2015: 42e8,
        2020: 41e8,
        2024: 42e8
      },
      currency: {
        code: "SLL",
        name: "Sierra Leonean Leone",
        sym: "Le"
      },
      resources: [ {
        type: "diamond",
        rank: 4,
        prod: "600K carats/yr",
        share: 1.2,
        global: 10,
        note: "Famous for gem diamonds"
      }, {
        type: "iron",
        rank: 5,
        prod: "4M tonnes/yr",
        share: 1,
        global: null,
        note: "Tonkolili mine"
      }, {
        type: "bauxite",
        rank: 4,
        prod: "1.3M tonnes/yr",
        share: .8,
        global: 13,
        note: "Sierra Minerals"
      } ],
      exports: [ {
        p: "Iron Ore",
        v: 8e8,
        s: 37
      }, {
        p: "Diamonds",
        v: 3e8,
        s: 14
      }, {
        p: "Titanium Ore",
        v: 25e7,
        s: 12
      }, {
        p: "Bauxite",
        v: 2e8,
        s: 9.3
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 5e8,
        s: 16
      }, {
        p: "Rice",
        v: 4e8,
        s: 13
      }, {
        p: "Medicines",
        v: 2e8,
        s: 6.5
      } ],
      totalExports: 215e7,
      totalImports: 31e8,
      hdi: .477,
      hdiRank: 181,
      gini: 35.7,
      inflation: 44,
      unemployment: 4.6,
      debtGdp: 70.1,
      fdi: 2e8,
      electricity: 26,
      internet: 24,
      lifeExp: 55.9,
      literacy: 43,
      rrs: 45,
      tagline: "Blood Diamonds to Peace — A Nation Rebuilding",
      paradox: "Diamonds fueled Africa's bloodiest civil war. Two decades later, mineral wealth barely reaches citizens.",
      tools: [ {
        n: "Sierra Leone PAYE",
        p: "/sierra-leone/sl-paye"
      } ]
    },
    LR: {
      name: "Liberia",
      slug: "liberia",
      flag: "🇱🇷",
      region: "west",
      capital: "Monrovia",
      population: 53e5,
      popGrowth: 2.4,
      gdp: 4e9,
      gdpPpp: 93e8,
      gdpPC: 755,
      gdpPCppp: 1755,
      gdpGrowth: 4.8,
      gdpHist: {
        1990: 38e7,
        2e3: 53e7,
        2010: 16e8,
        2015: 32e8,
        2020: 3e9,
        2024: 4e9
      },
      currency: {
        code: "LRD",
        name: "Liberian Dollar",
        sym: "L$"
      },
      resources: [ {
        type: "iron",
        rank: 4,
        prod: "5M tonnes/yr",
        share: 1.5,
        global: null,
        note: "ArcelorMittal Yekepa mine"
      }, {
        type: "timber",
        rank: 3,
        prod: "1M m³/yr",
        share: 7,
        global: null,
        note: "43% forest cover"
      } ],
      exports: [ {
        p: "Iron Ore",
        v: 6e8,
        s: 36
      }, {
        p: "Gold",
        v: 4e8,
        s: 24
      }, {
        p: "Rubber",
        v: 2e8,
        s: 12
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 4e8,
        s: 17
      }, {
        p: "Rice",
        v: 3e8,
        s: 13
      }, {
        p: "Cement",
        v: 15e7,
        s: 6.4
      } ],
      totalExports: 165e7,
      totalImports: 235e7,
      hdi: .487,
      hdiRank: 178,
      gini: 35.3,
      inflation: 9.2,
      unemployment: 3.6,
      debtGdp: 49.5,
      fdi: 3e8,
      electricity: 28,
      internet: 30,
      lifeExp: 60.7,
      literacy: 48,
      rrs: 40,
      tagline: "Africa's Oldest Republic, Rebuilding From Ruin",
      paradox: "World's largest shipping registry by tonnage, yet own infrastructure is among Africa's least developed.",
      tools: [ {
        n: "Liberia PAYE Calculator",
        p: "/liberia/lr-paye"
      } ]
    },
    GM: {
      name: "Gambia",
      slug: "gambia",
      flag: "🇬🇲",
      region: "west",
      capital: "Banjul",
      population: 264e4,
      popGrowth: 2.9,
      gdp: 23e8,
      gdpPpp: 74e8,
      gdpPC: 871,
      gdpPCppp: 2803,
      gdpGrowth: 5.3,
      gdpHist: {
        1990: 3e8,
        2e3: 42e7,
        2010: 95e7,
        2015: 14e8,
        2020: 18e8,
        2024: 23e8
      },
      currency: {
        code: "GMD",
        name: "Gambian Dalasi",
        sym: "D"
      },
      resources: [ {
        type: "fish",
        rank: 5,
        prod: "60K tonnes/yr",
        share: 1.4,
        global: null,
        note: "Shrimp and cuttlefish exports"
      }, {
        type: "farm",
        rank: null,
        prod: "Groundnuts: 200K tonnes/yr",
        share: 3,
        global: null,
        note: "Primary cash crop"
      } ],
      exports: [ {
        p: "Groundnuts",
        v: 1e8,
        s: 20
      }, {
        p: "Fish",
        v: 8e7,
        s: 16
      }, {
        p: "Cashew Nuts",
        v: 5e7,
        s: 10
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 2e8,
        s: 16
      }, {
        p: "Rice",
        v: 12e7,
        s: 9.6
      }, {
        p: "Sugar",
        v: 8e7,
        s: 6.4
      } ],
      totalExports: 5e8,
      totalImports: 125e7,
      hdi: .5,
      hdiRank: 174,
      gini: 35.9,
      inflation: 17,
      unemployment: 11.2,
      debtGdp: 83,
      fdi: 8e7,
      electricity: 62,
      internet: 40,
      lifeExp: 62.6,
      literacy: 51,
      rrs: 18,
      tagline: "The Smiling Coast Where the River Runs Deep",
      paradox: "Africa's smallest mainland country receives 500K tourists/yr — 20% of GDP from tourism.",
      tools: [ {
        n: "Gambia PAYE Calculator",
        p: "/gambia/gm-paye"
      } ]
    },
    GW: {
      name: "Guinea-Bissau",
      slug: "guinea-bissau",
      flag: "🇬🇼",
      region: "west",
      capital: "Bissau",
      population: 21e5,
      popGrowth: 2.4,
      gdp: 19e8,
      gdpPpp: 51e8,
      gdpPC: 905,
      gdpPCppp: 2429,
      gdpGrowth: 4.5,
      gdpHist: {
        1990: 24e7,
        2e3: 34e7,
        2010: 85e7,
        2015: 12e8,
        2020: 15e8,
        2024: 19e8
      },
      currency: {
        code: "XOF",
        name: "West African CFA Franc",
        sym: "CFA"
      },
      resources: [ {
        type: "farm",
        rank: null,
        prod: "Cashew: 200K tonnes/yr",
        share: 10,
        global: 5,
        note: "Cashew nuts = 90% of export earnings"
      } ],
      exports: [ {
        p: "Cashew Nuts",
        v: 25e7,
        s: 76
      }, {
        p: "Fish",
        v: 4e7,
        s: 12
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 12e7,
        s: 16
      }, {
        p: "Rice",
        v: 1e8,
        s: 13
      } ],
      totalExports: 33e7,
      totalImports: 75e7,
      hdi: .483,
      hdiRank: 179,
      gini: 34.8,
      inflation: 6,
      unemployment: 6.8,
      debtGdp: 78.5,
      fdi: 2e7,
      electricity: 35,
      internet: 22,
      lifeExp: 59.4,
      literacy: 46,
      rrs: 22,
      tagline: "The Cashew Capital Trapped by Instability",
      paradox: "90% of export income from raw cashew nuts, yet processes less than 5% domestically.",
      tools: [ {
        n: "Guinea-Bissau PAYE",
        p: "/guinea-bissau/gw-paye"
      } ]
    },
    CV: {
      name: "Cape Verde",
      slug: "cape-verde",
      flag: "🇨🇻",
      region: "west",
      capital: "Praia",
      population: 598e3,
      popGrowth: 1,
      gdp: 25e8,
      gdpPpp: 51e8,
      gdpPC: 4181,
      gdpPCppp: 8528,
      gdpGrowth: 5.1,
      gdpHist: {
        1990: 34e7,
        2e3: 54e7,
        2010: 17e8,
        2015: 17e8,
        2020: 17e8,
        2024: 25e8
      },
      currency: {
        code: "CVE",
        name: "Cape Verdean Escudo",
        sym: "$"
      },
      resources: [ {
        type: "fish",
        rank: 4,
        prod: "30K tonnes/yr",
        share: .7,
        global: null,
        note: "Tuna and lobster"
      } ],
      exports: [ {
        p: "Canned Fish",
        v: 12e7,
        s: 40
      }, {
        p: "Fish Fillets",
        v: 6e7,
        s: 20
      }, {
        p: "Clothing",
        v: 3e7,
        s: 10
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 2e8,
        s: 14
      }, {
        p: "Food Products",
        v: 18e7,
        s: 13
      }, {
        p: "Machinery",
        v: 1e8,
        s: 7.1
      } ],
      totalExports: 3e8,
      totalImports: 14e8,
      hdi: .662,
      hdiRank: 128,
      gini: 42.4,
      inflation: 3.2,
      unemployment: 12.4,
      debtGdp: 125,
      fdi: 1e8,
      electricity: 95,
      internet: 70,
      lifeExp: 74.1,
      literacy: 87,
      rrs: 12,
      tagline: "The Atlantic Islands That Defied Geography",
      paradox: "No natural resources and imports 80% of food, yet achieved middle-income status through tourism and good governance.",
      tools: [ {
        n: "Cape Verde PAYE",
        p: "/cape-verde/cv-paye"
      } ]
    },
    MR: {
      name: "Mauritania",
      slug: "mauritania",
      flag: "🇲🇷",
      region: "west",
      capital: "Nouakchott",
      population: 49e5,
      popGrowth: 2.7,
      gdp: 104e8,
      gdpPpp: 316e8,
      gdpPC: 2122,
      gdpPCppp: 6449,
      gdpGrowth: 4.8,
      gdpHist: {
        1990: 1e9,
        2e3: 11e8,
        2010: 48e8,
        2015: 51e8,
        2020: 81e8,
        2024: 104e8
      },
      currency: {
        code: "MRU",
        name: "Mauritanian Ouguiya",
        sym: "UM"
      },
      resources: [ {
        type: "iron",
        rank: 1,
        prod: "13M tonnes/yr",
        share: 10,
        global: 15,
        note: "SNIM Zouérat mines"
      }, {
        type: "gold",
        rank: 5,
        prod: "30 tonnes/yr",
        share: 6.2,
        global: null,
        note: "Tasiast mine"
      }, {
        type: "fish",
        rank: 1,
        prod: "900K tonnes/yr",
        share: 20,
        global: 20,
        note: "Richest fishing grounds — Atlantic upwelling zone"
      }, {
        type: "copper",
        rank: 4,
        prod: "35K tonnes/yr",
        share: 2,
        global: null,
        note: "Guelb Moghrein mine"
      } ],
      exports: [ {
        p: "Iron Ore",
        v: 22e8,
        s: 33
      }, {
        p: "Gold",
        v: 18e8,
        s: 27
      }, {
        p: "Fish",
        v: 15e8,
        s: 23
      }, {
        p: "Copper",
        v: 4e8,
        s: 6
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 11e8,
        s: 17
      }, {
        p: "Wheat",
        v: 4e8,
        s: 6.2
      }, {
        p: "Machinery",
        v: 35e7,
        s: 5.4
      } ],
      totalExports: 66e8,
      totalImports: 65e8,
      hdi: .54,
      hdiRank: 161,
      gini: 32.6,
      inflation: 5,
      unemployment: 11.3,
      debtGdp: 48.7,
      fdi: 12e8,
      electricity: 47,
      internet: 40,
      lifeExp: 64.4,
      literacy: 53,
      rrs: 60,
      tagline: "Where the Sahara Meets the Atlantic's Richest Waters",
      paradox: "Atlantic coast is among the world's most productive fishing zones, yet foreign fleets capture most of the catch.",
      tools: [ {
        n: "Mauritania PAYE",
        p: "/mauritania/mr-paye"
      } ]
    },
    KE: {
      name: "Kenya",
      slug: "kenya",
      flag: "🇰🇪",
      region: "east",
      capital: "Nairobi",
      population: 551e5,
      popGrowth: 1.7,
      gdp: 113e9,
      gdpPpp: 315e9,
      gdpPC: 2050,
      gdpPCppp: 5720,
      gdpGrowth: 5.6,
      gdpHist: {
        1990: 86e8,
        2e3: 127e8,
        2010: 4e10,
        2015: 638e8,
        2020: 1007e8,
        2024: 113e9
      },
      currency: {
        code: "KES",
        name: "Kenyan Shilling",
        sym: "KSh"
      },
      resources: [ {
        type: "farm",
        rank: 3,
        prod: "Tea, flowers, coffee",
        share: 26,
        global: 1,
        note: "World's largest tea exporter"
      }, {
        type: "coffee",
        rank: 5,
        prod: "50K tonnes/yr",
        share: 4,
        global: null,
        note: "Premium Arabica from highlands"
      }, {
        type: "fish",
        rank: 6,
        prod: "148K tonnes/yr",
        share: 3,
        global: null,
        note: "Lake Victoria & Indian Ocean"
      } ],
      exports: [ {
        p: "Tea",
        v: 15e8,
        s: 19
      }, {
        p: "Cut Flowers",
        v: 11e8,
        s: 14
      }, {
        p: "Coffee",
        v: 3e8,
        s: 4
      }, {
        p: "Vegetables",
        v: 4e8,
        s: 5
      }, {
        p: "Petroleum Products",
        v: 6e8,
        s: 8
      } ],
      imports: [ {
        p: "Petroleum",
        v: 45e8,
        s: 22
      }, {
        p: "Machinery",
        v: 28e8,
        s: 14
      }, {
        p: "Iron & Steel",
        v: 15e8,
        s: 7
      }, {
        p: "Vehicles",
        v: 12e8,
        s: 6
      }, {
        p: "Cereals",
        v: 9e8,
        s: 4
      } ],
      totalExports: 78e8,
      totalImports: 205e8,
      hdi: .575,
      hdiRank: 152,
      gini: 40.8,
      inflation: 6.9,
      unemployment: 5.7,
      debtGdp: 68.5,
      fdi: 13e8,
      electricity: 75,
      internet: 40,
      lifeExp: 61.4,
      literacy: 81.5,
      rrs: 42,
      tagline: "East Africa's Innovation and Financial Hub",
      paradox: "M-Pesa revolutionized mobile money yet 36% live below the poverty line.",
      tools: [ {
        n: "Kenya PAYE Calculator",
        p: "/kenya/ke-paye"
      } ]
    },
    TZ: {
      name: "Tanzania",
      slug: "tanzania",
      flag: "🇹🇿",
      region: "east",
      capital: "Dodoma",
      population: 655e5,
      popGrowth: 2.9,
      gdp: 79e9,
      gdpPpp: 218e9,
      gdpPC: 1200,
      gdpPCppp: 3330,
      gdpGrowth: 5.1,
      gdpHist: {
        1990: 43e8,
        2e3: 102e8,
        2010: 314e8,
        2015: 474e8,
        2020: 624e8,
        2024: 79e9
      },
      currency: {
        code: "TZS",
        name: "Tanzanian Shilling",
        sym: "TSh"
      },
      resources: [ {
        type: "gold",
        rank: 4,
        prod: "50 tonnes/yr",
        share: 10,
        global: null,
        note: "Geita, Bulyanhulu mines"
      }, {
        type: "gas",
        rank: 5,
        prod: "57 TCF reserves",
        share: 0,
        global: null,
        note: "Deep-sea discoveries"
      }, {
        type: "diamond",
        rank: 3,
        prod: "Tanzanite unique",
        share: 0,
        global: null,
        note: "Only source of tanzanite on Earth"
      }, {
        type: "farm",
        rank: 4,
        prod: "Cashews, tobacco, coffee",
        share: 24,
        global: null,
        note: "Agriculture employs 65%"
      } ],
      exports: [ {
        p: "Gold",
        v: 29e8,
        s: 30
      }, {
        p: "Tobacco",
        v: 5e8,
        s: 5
      }, {
        p: "Cashew Nuts",
        v: 4e8,
        s: 4
      }, {
        p: "Coffee",
        v: 3e8,
        s: 3
      }, {
        p: "Precious Stones",
        v: 6e8,
        s: 6
      } ],
      imports: [ {
        p: "Petroleum",
        v: 28e8,
        s: 18
      }, {
        p: "Machinery",
        v: 19e8,
        s: 12
      }, {
        p: "Iron & Steel",
        v: 12e8,
        s: 8
      }, {
        p: "Vehicles",
        v: 14e8,
        s: 9
      } ],
      totalExports: 97e8,
      totalImports: 155e8,
      hdi: .549,
      hdiRank: 160,
      gini: 40.5,
      inflation: 4.4,
      unemployment: 2.6,
      debtGdp: 42.3,
      fdi: 11e8,
      electricity: 42,
      internet: 32,
      lifeExp: 66.2,
      literacy: 77.9,
      rrs: 55,
      tagline: "Gold, Gas and Safari Giant of East Africa",
      paradox: "Hosts Kilimanjaro and unique tanzanite yet remains one of the least developed nations.",
      tools: [ {
        n: "Tanzania PAYE",
        p: "/tanzania/tz-paye"
      } ]
    },
    ET: {
      name: "Ethiopia",
      slug: "ethiopia",
      flag: "🇪🇹",
      region: "east",
      capital: "Addis Ababa",
      population: 1265e5,
      popGrowth: 2.5,
      gdp: 156e9,
      gdpPpp: 393e9,
      gdpPC: 1230,
      gdpPCppp: 3110,
      gdpGrowth: 6.1,
      gdpHist: {
        1990: 73e8,
        2e3: 82e8,
        2010: 299e8,
        2015: 646e8,
        2020: 1076e8,
        2024: 156e9
      },
      currency: {
        code: "ETB",
        name: "Ethiopian Birr",
        sym: "Br"
      },
      resources: [ {
        type: "coffee",
        rank: 1,
        prod: "500K tonnes/yr",
        share: 30,
        global: 5,
        note: "Birthplace of Arabica coffee"
      }, {
        type: "gold",
        rank: 6,
        prod: "12 tonnes/yr",
        share: 12,
        global: null,
        note: "Expanding mining sector"
      }, {
        type: "farm",
        rank: 2,
        prod: "Flowers, oilseeds, pulses",
        share: 35,
        global: 2,
        note: "Agriculture employs 70%"
      } ],
      exports: [ {
        p: "Coffee",
        v: 14e8,
        s: 30
      }, {
        p: "Oilseeds",
        v: 6e8,
        s: 13
      }, {
        p: "Cut Flowers",
        v: 55e7,
        s: 12
      }, {
        p: "Khat",
        v: 4e8,
        s: 9
      }, {
        p: "Gold",
        v: 35e7,
        s: 7
      } ],
      imports: [ {
        p: "Petroleum",
        v: 35e8,
        s: 19
      }, {
        p: "Machinery",
        v: 32e8,
        s: 17
      }, {
        p: "Vehicles",
        v: 21e8,
        s: 11
      }, {
        p: "Iron & Steel",
        v: 15e8,
        s: 8
      } ],
      totalExports: 47e8,
      totalImports: 185e8,
      hdi: .498,
      hdiRank: 175,
      gini: 35,
      inflation: 28.7,
      unemployment: 3.5,
      debtGdp: 37.8,
      fdi: 33e8,
      electricity: 54,
      internet: 25,
      lifeExp: 65,
      literacy: 51.8,
      rrs: 38,
      tagline: "Africa's Second-Most Populous Nation and Coffee Birthplace",
      paradox: "One of Africa's fastest-growing economies yet massive trade deficit and only 52% literacy.",
      tools: [ {
        n: "Ethiopia PAYE Calculator",
        p: "/ethiopia/et-paye"
      } ]
    },
    UG: {
      name: "Uganda",
      slug: "uganda",
      flag: "🇺🇬",
      region: "east",
      capital: "Kampala",
      population: 486e5,
      popGrowth: 3,
      gdp: 5e10,
      gdpPpp: 13e10,
      gdpPC: 1030,
      gdpPCppp: 2670,
      gdpGrowth: 5.3,
      gdpHist: {
        1990: 43e8,
        2e3: 62e8,
        2010: 202e8,
        2015: 305e8,
        2020: 374e8,
        2024: 5e10
      },
      currency: {
        code: "UGX",
        name: "Ugandan Shilling",
        sym: "USh"
      },
      resources: [ {
        type: "oil",
        rank: 7,
        prod: "6.5B barrels reserves",
        share: 0,
        global: null,
        note: "Lake Albert basin, production expected 2025"
      }, {
        type: "coffee",
        rank: 2,
        prod: "380K tonnes/yr",
        share: 20,
        global: null,
        note: "Major Robusta producer"
      }, {
        type: "gold",
        rank: 5,
        prod: "Trade hub",
        share: 40,
        global: null,
        note: "Significant gold re-export trade"
      } ],
      exports: [ {
        p: "Gold",
        v: 25e8,
        s: 40
      }, {
        p: "Coffee",
        v: 9e8,
        s: 14
      }, {
        p: "Fish Products",
        v: 2e8,
        s: 3
      }, {
        p: "Tea",
        v: 1e8,
        s: 2
      } ],
      imports: [ {
        p: "Petroleum",
        v: 18e8,
        s: 18
      }, {
        p: "Machinery",
        v: 12e8,
        s: 12
      }, {
        p: "Vehicles",
        v: 9e8,
        s: 9
      }, {
        p: "Iron & Steel",
        v: 8e8,
        s: 8
      } ],
      totalExports: 63e8,
      totalImports: 102e8,
      hdi: .525,
      hdiRank: 166,
      gini: 42.7,
      inflation: 5.4,
      unemployment: 2.8,
      debtGdp: 48.4,
      fdi: 15e8,
      electricity: 47,
      internet: 26,
      lifeExp: 62.7,
      literacy: 76.5,
      rrs: 48,
      tagline: "Pearl of Africa with Untapped Oil Wealth",
      paradox: "Sitting on 6.5B barrels of oil yet remains one of the world's poorest countries.",
      tools: [ {
        n: "Uganda PAYE Calculator",
        p: "/uganda/ug-paye"
      } ]
    },
    RW: {
      name: "Rwanda",
      slug: "rwanda",
      flag: "🇷🇼",
      region: "east",
      capital: "Kigali",
      population: 141e5,
      popGrowth: 2.3,
      gdp: 14e9,
      gdpPpp: 38e9,
      gdpPC: 990,
      gdpPCppp: 2690,
      gdpGrowth: 8.2,
      gdpHist: {
        1990: 25e8,
        2e3: 17e8,
        2010: 58e8,
        2015: 83e8,
        2020: 103e8,
        2024: 14e9
      },
      currency: {
        code: "RWF",
        name: "Rwandan Franc",
        sym: "FRw"
      },
      resources: [ {
        type: "coltan",
        rank: 2,
        prod: "700 tonnes/yr",
        share: 10,
        global: 2,
        note: "Critical for electronics"
      }, {
        type: "mineral",
        rank: 4,
        prod: "Tin, tungsten (3Ts)",
        share: 25,
        global: null,
        note: "Conflict-free certified"
      }, {
        type: "coffee",
        rank: 6,
        prod: "22K tonnes/yr",
        share: 15,
        global: null,
        note: "Award-winning Arabica"
      } ],
      exports: [ {
        p: "Gold",
        v: 45e7,
        s: 23
      }, {
        p: "Tin Ore",
        v: 2e8,
        s: 10
      }, {
        p: "Coffee",
        v: 18e7,
        s: 9
      }, {
        p: "Tea",
        v: 12e7,
        s: 6
      }, {
        p: "Coltan",
        v: 1e8,
        s: 5
      } ],
      imports: [ {
        p: "Petroleum",
        v: 5e8,
        s: 14
      }, {
        p: "Machinery",
        v: 4e8,
        s: 11
      }, {
        p: "Iron & Steel",
        v: 3e8,
        s: 8
      }, {
        p: "Vehicles",
        v: 35e7,
        s: 10
      } ],
      totalExports: 19e8,
      totalImports: 36e8,
      hdi: .534,
      hdiRank: 165,
      gini: 43.7,
      inflation: 11.2,
      unemployment: 15.6,
      debtGdp: 66.2,
      fdi: 4e8,
      electricity: 49,
      internet: 33,
      lifeExp: 66.1,
      literacy: 73.2,
      rrs: 35,
      tagline: "Africa's Cleanest City and Digital Governance Leader",
      paradox: "Transformed from genocide to Africa's fastest reformer yet 50% still in subsistence farming.",
      tools: [ {
        n: "Rwanda PAYE Calculator",
        p: "/rwanda/rw-paye"
      } ]
    },
    MZ: {
      name: "Mozambique",
      slug: "mozambique",
      flag: "🇲🇿",
      region: "east",
      capital: "Maputo",
      population: 339e5,
      popGrowth: 2.7,
      gdp: 19e9,
      gdpPpp: 48e9,
      gdpPC: 560,
      gdpPCppp: 1420,
      gdpGrowth: 4.2,
      gdpHist: {
        1990: 25e8,
        2e3: 43e8,
        2010: 102e8,
        2015: 148e8,
        2020: 14e9,
        2024: 19e9
      },
      currency: {
        code: "MZN",
        name: "Mozambican Metical",
        sym: "MT"
      },
      resources: [ {
        type: "gas",
        rank: 2,
        prod: "127+ TCF reserves",
        share: 0,
        global: 3,
        note: "Rovuma Basin LNG mega-projects"
      }, {
        type: "coal",
        rank: 2,
        prod: "8M tonnes/yr",
        share: 20,
        global: null,
        note: "Tete Province coking coal"
      }, {
        type: "mineral",
        rank: 5,
        prod: "Rubies, graphite, titanium",
        share: 0,
        global: null,
        note: "World-class ruby deposits at Montepuez"
      } ],
      exports: [ {
        p: "Coal",
        v: 13e8,
        s: 22
      }, {
        p: "Aluminium",
        v: 11e8,
        s: 19
      }, {
        p: "Natural Gas",
        v: 5e8,
        s: 9
      }, {
        p: "Prawns",
        v: 25e7,
        s: 4
      } ],
      imports: [ {
        p: "Petroleum",
        v: 15e8,
        s: 17
      }, {
        p: "Machinery",
        v: 12e8,
        s: 13
      }, {
        p: "Vehicles",
        v: 8e8,
        s: 9
      } ],
      totalExports: 58e8,
      totalImports: 9e9,
      hdi: .461,
      hdiRank: 183,
      gini: 54,
      inflation: 7.1,
      unemployment: 3.5,
      debtGdp: 100.2,
      fdi: 51e8,
      electricity: 35,
      internet: 17,
      lifeExp: 59.3,
      literacy: 63.4,
      rrs: 58,
      tagline: "Africa's Next LNG Superpower",
      paradox: "Holds 127+ TCF of gas worth hundreds of billions yet 74% live on under $2/day.",
      tools: [ {
        n: "Mozambique PAYE",
        p: "/mozambique/mz-paye"
      } ]
    },
    MG: {
      name: "Madagascar",
      slug: "madagascar",
      flag: "🇲🇬",
      region: "east",
      capital: "Antananarivo",
      population: 303e5,
      popGrowth: 2.4,
      gdp: 16e9,
      gdpPpp: 53e9,
      gdpPC: 530,
      gdpPCppp: 1750,
      gdpGrowth: 4,
      gdpHist: {
        1990: 31e8,
        2e3: 39e8,
        2010: 87e8,
        2015: 102e8,
        2020: 131e8,
        2024: 16e9
      },
      currency: {
        code: "MGA",
        name: "Malagasy Ariary",
        sym: "Ar"
      },
      resources: [ {
        type: "mineral",
        rank: 3,
        prod: "Nickel, cobalt, ilmenite",
        share: 35,
        global: null,
        note: "Ambatovy — world's largest nickel laterite mines"
      }, {
        type: "farm",
        rank: 2,
        prod: "Vanilla (80%+ global)",
        share: 80,
        global: 1,
        note: "Dominates global vanilla market"
      }, {
        type: "cobalt",
        rank: 3,
        prod: "3500 tonnes/yr",
        share: 5,
        global: null,
        note: "Nickel mining by-product"
      } ],
      exports: [ {
        p: "Vanilla",
        v: 6e8,
        s: 18
      }, {
        p: "Nickel & Cobalt",
        v: 8e8,
        s: 24
      }, {
        p: "Cloves",
        v: 25e7,
        s: 8
      }, {
        p: "Clothing",
        v: 5e8,
        s: 15
      } ],
      imports: [ {
        p: "Petroleum",
        v: 11e8,
        s: 18
      }, {
        p: "Rice",
        v: 4e8,
        s: 7
      }, {
        p: "Machinery",
        v: 6e8,
        s: 10
      } ],
      totalExports: 33e8,
      totalImports: 59e8,
      hdi: .487,
      hdiRank: 177,
      gini: 42.6,
      inflation: 9.9,
      unemployment: 1.8,
      debtGdp: 53.4,
      fdi: 4e8,
      electricity: 34,
      internet: 22,
      lifeExp: 64.5,
      literacy: 76.7,
      rrs: 52,
      tagline: "Island of Vanilla and Unique Biodiversity",
      paradox: "Supplies 80%+ of world's vanilla yet is among the poorest countries.",
      tools: [ {
        n: "Madagascar PAYE",
        p: "/madagascar/mg-paye"
      } ]
    },
    ZM: {
      name: "Zambia",
      slug: "zambia",
      flag: "🇿🇲",
      region: "east",
      capital: "Lusaka",
      population: 206e5,
      popGrowth: 2.8,
      gdp: 29e9,
      gdpPpp: 75e9,
      gdpPC: 1410,
      gdpPCppp: 3640,
      gdpGrowth: 4.3,
      gdpHist: {
        1990: 33e8,
        2e3: 36e8,
        2010: 203e8,
        2015: 212e8,
        2020: 181e8,
        2024: 29e9
      },
      currency: {
        code: "ZMW",
        name: "Zambian Kwacha",
        sym: "ZK"
      },
      resources: [ {
        type: "copper",
        rank: 2,
        prod: "830K tonnes/yr",
        share: 70,
        global: 7,
        note: "Copperbelt Province"
      }, {
        type: "cobalt",
        rank: 2,
        prod: "5000 tonnes/yr",
        share: 5,
        global: 4,
        note: "Major cobalt by-product"
      } ],
      exports: [ {
        p: "Copper",
        v: 85e8,
        s: 70
      }, {
        p: "Cobalt",
        v: 4e8,
        s: 3
      }, {
        p: "Gold",
        v: 3e8,
        s: 2
      } ],
      imports: [ {
        p: "Machinery",
        v: 15e8,
        s: 16
      }, {
        p: "Petroleum",
        v: 13e8,
        s: 14
      }, {
        p: "Vehicles",
        v: 8e8,
        s: 9
      } ],
      totalExports: 122e8,
      totalImports: 93e8,
      hdi: .565,
      hdiRank: 154,
      gini: 57.1,
      inflation: 10.3,
      unemployment: 5.3,
      debtGdp: 77.8,
      fdi: 16e8,
      electricity: 47,
      internet: 27,
      lifeExp: 61.2,
      literacy: 86.7,
      rrs: 62,
      tagline: "Africa's Copper Heartland",
      paradox: "World's #7 copper producer earning billions yet 54% live in poverty.",
      tools: [ {
        n: "Zambia PAYE Calculator",
        p: "/zambia/zm-paye"
      } ]
    },
    ZW: {
      name: "Zimbabwe",
      slug: "zimbabwe",
      flag: "🇿🇼",
      region: "east",
      capital: "Harare",
      population: 163e5,
      popGrowth: 1.5,
      gdp: 24e9,
      gdpPpp: 42e9,
      gdpPC: 1470,
      gdpPCppp: 2580,
      gdpGrowth: 3.5,
      gdpHist: {
        1990: 88e8,
        2e3: 67e8,
        2010: 12e9,
        2015: 198e8,
        2020: 184e8,
        2024: 24e9
      },
      currency: {
        code: "ZWL",
        name: "Zimbabwe Gold (ZiG)",
        sym: "ZiG"
      },
      resources: [ {
        type: "platinum",
        rank: 2,
        prod: "15 tonnes/yr",
        share: 12,
        global: 2,
        note: "Great Dyke deposits"
      }, {
        type: "diamond",
        rank: 5,
        prod: "3.5M carats/yr",
        share: 4,
        global: null,
        note: "Marange fields"
      }, {
        type: "gold",
        rank: 3,
        prod: "35 tonnes/yr",
        share: 25,
        global: null,
        note: "Historically major producer"
      }, {
        type: "chromium",
        rank: 2,
        prod: "1.3M tonnes ore/yr",
        share: 10,
        global: 3,
        note: "Great Dyke chromite"
      }, {
        type: "lithium",
        rank: 1,
        prod: "Bikita & Arcadia",
        share: 0,
        global: null,
        note: "Africa's top lithium deposit"
      } ],
      exports: [ {
        p: "Gold",
        v: 25e8,
        s: 26
      }, {
        p: "Tobacco",
        v: 9e8,
        s: 9
      }, {
        p: "Platinum",
        v: 12e8,
        s: 12
      }, {
        p: "Diamonds",
        v: 4e8,
        s: 4
      }, {
        p: "Ferrochrome",
        v: 5e8,
        s: 5
      } ],
      imports: [ {
        p: "Petroleum",
        v: 15e8,
        s: 15
      }, {
        p: "Machinery",
        v: 12e8,
        s: 12
      }, {
        p: "Chemicals",
        v: 8e8,
        s: 8
      } ],
      totalExports: 97e8,
      totalImports: 101e8,
      hdi: .55,
      hdiRank: 159,
      gini: 44.3,
      inflation: 47.6,
      unemployment: 16.5,
      debtGdp: 97.1,
      fdi: 35e7,
      electricity: 53,
      internet: 35,
      lifeExp: 59.3,
      literacy: 89.7,
      rrs: 68,
      tagline: "Mineral-Rich Land of Platinum, Lithium and the Great Dyke",
      paradox: "Holds Africa's largest lithium reserves and #2 platinum yet hyperinflation devastates living standards.",
      tools: [ {
        n: "Zimbabwe PAYE",
        p: "/zimbabwe/zw-paye"
      } ]
    },
    MW: {
      name: "Malawi",
      slug: "malawi",
      flag: "🇲🇼",
      region: "east",
      capital: "Lilongwe",
      population: 209e5,
      popGrowth: 2.6,
      gdp: 13e9,
      gdpPpp: 35e9,
      gdpPC: 620,
      gdpPCppp: 1670,
      gdpGrowth: 2,
      gdpHist: {
        1990: 19e8,
        2e3: 17e8,
        2010: 54e8,
        2015: 64e8,
        2020: 121e8,
        2024: 13e9
      },
      currency: {
        code: "MWK",
        name: "Malawian Kwacha",
        sym: "MK"
      },
      resources: [ {
        type: "uranium",
        rank: 3,
        prod: "Kayelekera (suspended)",
        share: 0,
        global: null,
        note: "Kayelekera uranium deposit"
      }, {
        type: "farm",
        rank: 8,
        prod: "Tobacco, tea, sugar",
        share: 30,
        global: 1,
        note: "#1 Africa burley tobacco"
      } ],
      exports: [ {
        p: "Tobacco",
        v: 7e8,
        s: 50
      }, {
        p: "Tea",
        v: 11e7,
        s: 8
      }, {
        p: "Sugar",
        v: 1e8,
        s: 7
      } ],
      imports: [ {
        p: "Petroleum",
        v: 5e8,
        s: 17
      }, {
        p: "Fertilizers",
        v: 3e8,
        s: 10
      }, {
        p: "Machinery",
        v: 35e7,
        s: 12
      } ],
      totalExports: 14e8,
      totalImports: 3e9,
      hdi: .508,
      hdiRank: 172,
      gini: 38.5,
      inflation: 28.6,
      unemployment: 5.7,
      debtGdp: 65.4,
      fdi: 1e8,
      electricity: 15,
      internet: 13,
      lifeExp: 62.9,
      literacy: 62.1,
      rrs: 22,
      tagline: "Warm Heart of Africa Built on Tobacco and Tea",
      paradox: "Tobacco = 50% of exports yet contributes to deforestation and health crises.",
      tools: [ {
        n: "Malawi PAYE Calculator",
        p: "/malawi/mw-paye"
      } ]
    },
    SO: {
      name: "Somalia",
      slug: "somalia",
      flag: "🇸🇴",
      region: "east",
      capital: "Mogadishu",
      population: 181e5,
      popGrowth: 2.9,
      gdp: 81e8,
      gdpPpp: 24e9,
      gdpPC: 450,
      gdpPCppp: 1330,
      gdpGrowth: 3.7,
      gdpHist: {
        1990: 15e8,
        2e3: 11e8,
        2010: 46e8,
        2015: 62e8,
        2020: 7e9,
        2024: 81e8
      },
      currency: {
        code: "SOS",
        name: "Somali Shilling",
        sym: "SSh"
      },
      resources: [ {
        type: "fish",
        rank: 2,
        prod: "3025 km coastline",
        share: 0,
        global: null,
        note: "One of Africa's longest coastlines"
      }, {
        type: "farm",
        rank: 10,
        prod: "Livestock, bananas",
        share: 65,
        global: 1,
        note: "Largest camel herding economy"
      } ],
      exports: [ {
        p: "Livestock",
        v: 6e8,
        s: 40
      }, {
        p: "Bananas",
        v: 8e7,
        s: 5
      }, {
        p: "Charcoal",
        v: 1e8,
        s: 7
      } ],
      imports: [ {
        p: "Cereals",
        v: 5e8,
        s: 13
      }, {
        p: "Sugar",
        v: 4e8,
        s: 10
      }, {
        p: "Petroleum",
        v: 6e8,
        s: 15
      } ],
      totalExports: 15e8,
      totalImports: 39e8,
      hdi: .38,
      hdiRank: 192,
      gini: 36.8,
      inflation: 6.1,
      unemployment: 19.8,
      debtGdp: 38.2,
      fdi: 47e7,
      electricity: 18,
      internet: 12,
      lifeExp: 55.4,
      literacy: 40,
      rrs: 25,
      tagline: "Pastoralist Nation with the World's Largest Camel Economy",
      paradox: "Strategic Horn of Africa with 3000+ km coastline yet decades of conflict block development.",
      tools: [ {
        n: "Somalia PAYE",
        p: "/somalia/so-paye"
      } ]
    },
    BI: {
      name: "Burundi",
      slug: "burundi",
      flag: "🇧🇮",
      region: "east",
      capital: "Gitega",
      population: 132e5,
      popGrowth: 2.7,
      gdp: 36e8,
      gdpPpp: 11e9,
      gdpPC: 270,
      gdpPCppp: 830,
      gdpGrowth: 3.3,
      gdpHist: {
        1990: 11e8,
        2e3: 7e8,
        2010: 2e9,
        2015: 28e8,
        2020: 28e8,
        2024: 36e8
      },
      currency: {
        code: "BIF",
        name: "Burundian Franc",
        sym: "FBu"
      },
      resources: [ {
        type: "coltan",
        rank: 4,
        prod: "Small-scale",
        share: 0,
        global: null,
        note: "Artisanal coltan mining"
      }, {
        type: "coffee",
        rank: 4,
        prod: "15K tonnes/yr",
        share: 60,
        global: null,
        note: "Coffee is economic lifeblood"
      } ],
      exports: [ {
        p: "Coffee",
        v: 8e7,
        s: 53
      }, {
        p: "Tea",
        v: 3e7,
        s: 20
      }, {
        p: "Gold",
        v: 15e6,
        s: 10
      } ],
      imports: [ {
        p: "Petroleum",
        v: 2e8,
        s: 20
      }, {
        p: "Machinery",
        v: 15e7,
        s: 15
      }, {
        p: "Vehicles",
        v: 12e7,
        s: 12
      } ],
      totalExports: 15e7,
      totalImports: 1e9,
      hdi: .426,
      hdiRank: 187,
      gini: 38.6,
      inflation: 26.9,
      unemployment: 1.4,
      debtGdp: 66.3,
      fdi: 1e7,
      electricity: 12,
      internet: 8,
      lifeExp: 61.6,
      literacy: 68.4,
      rrs: 18,
      tagline: "Coffee-Dependent Heart of the Great Lakes",
      paradox: "Premium Arabica brings $5/cup abroad yet farmers earn under $1/day.",
      tools: [ {
        n: "Burundi PAYE Calculator",
        p: "/burundi/bi-paye"
      } ]
    },
    DJ: {
      name: "Djibouti",
      slug: "djibouti",
      flag: "🇩🇯",
      region: "east",
      capital: "Djibouti",
      population: 11e5,
      popGrowth: 1.4,
      gdp: 4e9,
      gdpPpp: 7e9,
      gdpPC: 3640,
      gdpPCppp: 6370,
      gdpGrowth: 6,
      gdpHist: {
        1990: 5e8,
        2e3: 6e8,
        2010: 11e8,
        2015: 2e9,
        2020: 33e8,
        2024: 4e9
      },
      currency: {
        code: "DJF",
        name: "Djiboutian Franc",
        sym: "Fdj"
      },
      resources: [ {
        type: "mineral",
        rank: 12,
        prod: "Salt, geothermal",
        share: 0,
        global: null,
        note: "Lac Assal salt deposits"
      } ],
      exports: [ {
        p: "Re-exports",
        v: 2e8,
        s: 45
      }, {
        p: "Hides & Skins",
        v: 25e6,
        s: 6
      } ],
      imports: [ {
        p: "Food & Beverages",
        v: 5e8,
        s: 22
      }, {
        p: "Petroleum",
        v: 4e8,
        s: 17
      } ],
      totalExports: 44e7,
      totalImports: 23e8,
      hdi: .509,
      hdiRank: 171,
      gini: 41.6,
      inflation: 3.5,
      unemployment: 26.3,
      debtGdp: 68.3,
      fdi: 2e8,
      electricity: 65,
      internet: 59,
      lifeExp: 62.3,
      literacy: 70,
      rrs: 12,
      tagline: "Strategic Red Sea Gateway Hosting Foreign Military Bases",
      paradox: "Hosts US, China, France and Japan military bases yet 21% live in extreme poverty.",
      tools: [ {
        n: "Djibouti PAYE",
        p: "/djibouti/dj-paye"
      } ]
    },
    ER: {
      name: "Eritrea",
      slug: "eritrea",
      flag: "🇪🇷",
      region: "east",
      capital: "Asmara",
      population: 37e5,
      popGrowth: 1.2,
      gdp: 26e8,
      gdpPpp: 75e8,
      gdpPC: 700,
      gdpPCppp: 2030,
      gdpGrowth: 2.9,
      gdpHist: {
        1990: 5e8,
        2e3: 6e8,
        2010: 21e8,
        2015: 26e8,
        2020: 21e8,
        2024: 26e8
      },
      currency: {
        code: "ERN",
        name: "Eritrean Nakfa",
        sym: "Nfk"
      },
      resources: [ {
        type: "gold",
        rank: 8,
        prod: "Bisha mine 5+ tonnes/yr",
        share: 30,
        global: null,
        note: "Bisha gold-copper-zinc mines"
      }, {
        type: "copper",
        rank: 6,
        prod: "Bisha mine",
        share: 25,
        global: null,
        note: "Copper-zinc at Bisha"
      } ],
      exports: [ {
        p: "Gold",
        v: 3e8,
        s: 35
      }, {
        p: "Zinc & Copper",
        v: 2e8,
        s: 24
      }, {
        p: "Livestock",
        v: 5e7,
        s: 6
      } ],
      imports: [ {
        p: "Machinery",
        v: 25e7,
        s: 18
      }, {
        p: "Petroleum",
        v: 2e8,
        s: 14
      }, {
        p: "Food & Cereals",
        v: 3e8,
        s: 21
      } ],
      totalExports: 85e7,
      totalImports: 14e8,
      hdi: .492,
      hdiRank: 176,
      gini: null,
      inflation: 5,
      unemployment: 6.5,
      debtGdp: 165.1,
      fdi: 5e7,
      electricity: 52,
      internet: 8,
      lifeExp: 66.3,
      literacy: 76.6,
      rrs: 32,
      tagline: "Red Sea Mining Frontier with Potash Potential",
      paradox: "Major gold and copper mines yet isolation keeps development frozen.",
      tools: [ {
        n: "Eritrea PAYE",
        p: "/eritrea/er-paye"
      } ]
    },
    SS: {
      name: "South Sudan",
      slug: "south-sudan",
      flag: "🇸🇸",
      region: "east",
      capital: "Juba",
      population: 114e5,
      popGrowth: 1.2,
      gdp: 53e8,
      gdpPpp: 19e9,
      gdpPC: 470,
      gdpPCppp: 1670,
      gdpGrowth: -.6,
      gdpHist: {
        1990: 0,
        2e3: 0,
        2010: 0,
        2015: 98e8,
        2020: 36e8,
        2024: 53e8
      },
      currency: {
        code: "SSP",
        name: "South Sudanese Pound",
        sym: "SSP"
      },
      resources: [ {
        type: "oil",
        rank: 3,
        prod: "150K bpd",
        share: 3,
        global: null,
        note: "Third-largest oil reserves in Sub-Saharan Africa"
      } ],
      exports: [ {
        p: "Crude Oil",
        v: 42e8,
        s: 91
      }, {
        p: "Gold",
        v: 1e8,
        s: 2
      } ],
      imports: [ {
        p: "Food & Cereals",
        v: 8e8,
        s: 25
      }, {
        p: "Petroleum Products",
        v: 6e8,
        s: 19
      } ],
      totalExports: 46e8,
      totalImports: 32e8,
      hdi: .381,
      hdiRank: 191,
      gini: 44.1,
      inflation: 13.2,
      unemployment: 12.7,
      debtGdp: 52.6,
      fdi: 2e8,
      electricity: 8,
      internet: 8,
      lifeExp: 55,
      literacy: 34.5,
      rrs: 45,
      tagline: "World's Newest Nation Built on Oil",
      paradox: "Oil is 90%+ of revenue yet civil conflict has displaced 4 million people.",
      tools: [ {
        n: "South Sudan PAYE",
        p: "/south-sudan/ss-paye"
      } ]
    },
    ZA: {
      name: "South Africa",
      slug: "south-africa",
      flag: "🇿🇦",
      region: "south",
      capital: "Pretoria",
      population: 604e5,
      popGrowth: .8,
      gdp: 373e9,
      gdpPpp: 953e9,
      gdpPC: 6170,
      gdpPCppp: 15780,
      gdpGrowth: .6,
      gdpHist: {
        1990: 112e9,
        2e3: 132e9,
        2010: 375e9,
        2015: 317e9,
        2020: 301e9,
        2024: 373e9
      },
      currency: {
        code: "ZAR",
        name: "South African Rand",
        sym: "R"
      },
      resources: [ {
        type: "gold",
        rank: 1,
        prod: "100 tonnes/yr",
        share: 28,
        global: 6,
        note: "Witwatersrand Basin, deepest mines globally"
      }, {
        type: "platinum",
        rank: 1,
        prod: "130 tonnes/yr",
        share: 72,
        global: 70,
        note: "Bushveld Complex holds 80% of world reserves"
      }, {
        type: "chromium",
        rank: 1,
        prod: "18M tonnes/yr",
        share: 70,
        global: 44,
        note: "Largest chromite reserves globally"
      }, {
        type: "manganese",
        rank: 1,
        prod: "7.2M tonnes/yr",
        share: 55,
        global: 36,
        note: "Kalahari Manganese Field"
      }, {
        type: "coal",
        rank: 1,
        prod: "248M tonnes/yr",
        share: 48,
        global: 3,
        note: "Mpumalanga coalfields"
      }, {
        type: "diamond",
        rank: 4,
        prod: "7.2M carats/yr",
        share: 8,
        global: 5,
        note: "Kimberley, Cullinan heritage mines"
      }, {
        type: "iron",
        rank: 2,
        prod: "61M tonnes/yr",
        share: 15,
        global: 2,
        note: "Sishen & Kumba mines"
      } ],
      exports: [ {
        p: "Platinum Group Metals",
        v: 221e8,
        s: 20.5
      }, {
        p: "Gold",
        v: 118e8,
        s: 10.9
      }, {
        p: "Iron Ore",
        v: 102e8,
        s: 9.4
      }, {
        p: "Coal",
        v: 98e8,
        s: 9.1
      }, {
        p: "Motor Vehicles",
        v: 89e8,
        s: 8.2
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 126e8,
        s: 11.8
      }, {
        p: "Crude Petroleum",
        v: 93e8,
        s: 8.7
      }, {
        p: "Motor Vehicles",
        v: 71e8,
        s: 6.6
      }, {
        p: "Machinery",
        v: 68e8,
        s: 6.4
      } ],
      totalExports: 108e9,
      totalImports: 107e9,
      hdi: .713,
      hdiRank: 109,
      gini: 63,
      inflation: 4.4,
      unemployment: 32.9,
      debtGdp: 73,
      fdi: 91e8,
      electricity: 86,
      internet: 72,
      lifeExp: 62.3,
      literacy: 95,
      rrs: 92,
      tagline: "Africa's Most Industrialized Economy and Mineral Superpower",
      paradox: "Holds 70% of global platinum yet 32.9% unemployment — the most unequal country by Gini.",
      tools: [ {
        n: "South Africa PAYE",
        p: "/south-africa/za-paye"
      } ]
    },
    BW: {
      name: "Botswana",
      slug: "botswana",
      flag: "🇧🇼",
      region: "south",
      capital: "Gaborone",
      population: 263e4,
      popGrowth: 1.5,
      gdp: 194e8,
      gdpPpp: 472e8,
      gdpPC: 7380,
      gdpPCppp: 17950,
      gdpGrowth: 3.2,
      gdpHist: {
        1990: 38e8,
        2e3: 56e8,
        2010: 137e8,
        2015: 132e8,
        2020: 151e8,
        2024: 194e8
      },
      currency: {
        code: "BWP",
        name: "Botswana Pula",
        sym: "P"
      },
      resources: [ {
        type: "diamond",
        rank: 1,
        prod: "25M carats/yr",
        share: 28,
        global: 17,
        note: "Jwaneng — richest diamond mine by value globally"
      } ],
      exports: [ {
        p: "Diamonds",
        v: 65e8,
        s: 82
      }, {
        p: "Copper-Nickel",
        v: 4e8,
        s: 5
      }, {
        p: "Beef",
        v: 2e8,
        s: 2.5
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 11e8,
        s: 14
      }, {
        p: "Machinery",
        v: 8e8,
        s: 10
      }, {
        p: "Motor Vehicles",
        v: 7e8,
        s: 8.8
      } ],
      totalExports: 79e8,
      totalImports: 79e8,
      hdi: .693,
      hdiRank: 117,
      gini: 53.3,
      inflation: 3.2,
      unemployment: 26,
      debtGdp: 22,
      fdi: 3e8,
      electricity: 72,
      internet: 76,
      lifeExp: 61.1,
      literacy: 88,
      rrs: 72,
      tagline: "Diamond-Fueled Success Story and Africa's Governance Exemplar",
      paradox: "Transformed from one of the poorest nations to upper-middle income via diamonds, yet HIV prevalence remains among world's highest.",
      tools: [ {
        n: "Botswana PAYE",
        p: "/botswana/bw-paye"
      } ]
    },
    NA: {
      name: "Namibia",
      slug: "namibia",
      flag: "🇳🇦",
      region: "south",
      capital: "Windhoek",
      population: 26e5,
      popGrowth: 1.8,
      gdp: 124e8,
      gdpPpp: 287e8,
      gdpPC: 4770,
      gdpPCppp: 11040,
      gdpGrowth: 3,
      gdpHist: {
        1990: 24e8,
        2e3: 39e8,
        2010: 113e8,
        2015: 117e8,
        2020: 106e8,
        2024: 124e8
      },
      currency: {
        code: "NAD",
        name: "Namibian Dollar",
        sym: "N$"
      },
      resources: [ {
        type: "uranium",
        rank: 1,
        prod: "5600 tonnes/yr",
        share: 55,
        global: 11,
        note: "Rössing & Husab — two of world's largest uranium mines"
      }, {
        type: "diamond",
        rank: 3,
        prod: "2.1M carats/yr",
        share: 2.4,
        global: 1.5,
        note: "Marine diamonds off Skeleton Coast"
      } ],
      exports: [ {
        p: "Diamonds",
        v: 13e8,
        s: 15
      }, {
        p: "Uranium",
        v: 11e8,
        s: 12.7
      }, {
        p: "Fish & Seafood",
        v: 9e8,
        s: 10.4
      }, {
        p: "Zinc",
        v: 6e8,
        s: 6.9
      }, {
        p: "Gold",
        v: 5e8,
        s: 5.8
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 12e8,
        s: 14
      }, {
        p: "Motor Vehicles",
        v: 7e8,
        s: 8.1
      }, {
        p: "Machinery",
        v: 6e8,
        s: 6.9
      } ],
      totalExports: 87e8,
      totalImports: 86e8,
      hdi: .61,
      hdiRank: 139,
      gini: 59.1,
      inflation: 4.8,
      unemployment: 33.4,
      debtGdp: 68,
      fdi: 11e8,
      electricity: 55,
      internet: 53,
      lifeExp: 59.3,
      literacy: 92,
      rrs: 68,
      tagline: "Uranium Giant with Transformative Offshore Oil Frontier",
      paradox: "Africa's top uranium producer yet second-most unequal nation on Earth by Gini.",
      tools: [ {
        n: "Namibia PAYE",
        p: "/namibia/na-paye"
      } ]
    },
    LS: {
      name: "Lesotho",
      slug: "lesotho",
      flag: "🇱🇸",
      region: "south",
      capital: "Maseru",
      population: 233e4,
      popGrowth: .7,
      gdp: 25e8,
      gdpPpp: 65e8,
      gdpPC: 1070,
      gdpPCppp: 2790,
      gdpGrowth: 2.2,
      gdpHist: {
        1990: 8e8,
        2e3: 9e8,
        2010: 22e8,
        2015: 23e8,
        2020: 21e8,
        2024: 25e8
      },
      currency: {
        code: "LSL",
        name: "Lesotho Loti",
        sym: "L"
      },
      resources: [ {
        type: "diamond",
        rank: 6,
        prod: "0.4M carats/yr",
        share: .5,
        global: null,
        note: "Letšeng — highest dollar-per-carat mine in the world"
      } ],
      exports: [ {
        p: "Diamonds",
        v: 4e8,
        s: 37
      }, {
        p: "Textiles & Apparel",
        v: 3e8,
        s: 28
      }, {
        p: "Water Royalties",
        v: 8e7,
        s: 7.4
      } ],
      imports: [ {
        p: "Food Products",
        v: 4e8,
        s: 22
      }, {
        p: "Refined Petroleum",
        v: 2e8,
        s: 11
      }, {
        p: "Machinery",
        v: 15e7,
        s: 8.3
      } ],
      totalExports: 108e7,
      totalImports: 18e8,
      hdi: .514,
      hdiRank: 168,
      gini: 44.9,
      inflation: 6,
      unemployment: 24.6,
      debtGdp: 55,
      fdi: 3e7,
      electricity: 47,
      internet: 34,
      lifeExp: 50.7,
      literacy: 79,
      rrs: 28,
      tagline: "Mountain Kingdom with the World's Highest-Value Diamond Mine",
      paradox: "Sells water to Africa's richest economy yet remains one of the continent's poorest.",
      tools: [ {
        n: "Lesotho PAYE",
        p: "/lesotho/ls-paye"
      } ]
    },
    SZ: {
      name: "Eswatini",
      slug: "eswatini",
      flag: "🇸🇿",
      region: "south",
      capital: "Mbabane",
      population: 12e5,
      popGrowth: .8,
      gdp: 49e8,
      gdpPpp: 126e8,
      gdpPC: 4080,
      gdpPCppp: 10500,
      gdpGrowth: 3.5,
      gdpHist: {
        1990: 12e8,
        2e3: 15e8,
        2010: 4e9,
        2015: 41e8,
        2020: 39e8,
        2024: 49e8
      },
      currency: {
        code: "SZL",
        name: "Swazi Lilangeni",
        sym: "E"
      },
      resources: [ {
        type: "coal",
        rank: null,
        prod: "150K tonnes/yr",
        share: 0,
        global: null,
        note: "Maloma Colliery anthracite"
      }, {
        type: "timber",
        rank: null,
        prod: "Commercial plantations",
        share: 0,
        global: null,
        note: "Pine/eucalyptus for pulp"
      } ],
      exports: [ {
        p: "Sugar",
        v: 45e7,
        s: 21
      }, {
        p: "Soft Drink Concentrates",
        v: 42e7,
        s: 20
      }, {
        p: "Textiles & Apparel",
        v: 25e7,
        s: 12
      }, {
        p: "Wood Pulp",
        v: 18e7,
        s: 8.5
      } ],
      imports: [ {
        p: "Motor Vehicles",
        v: 32e7,
        s: 13
      }, {
        p: "Refined Petroleum",
        v: 28e7,
        s: 11
      }, {
        p: "Machinery",
        v: 22e7,
        s: 8.9
      } ],
      totalExports: 212e7,
      totalImports: 247e7,
      hdi: .597,
      hdiRank: 143,
      gini: 54.6,
      inflation: 4.8,
      unemployment: 33.3,
      debtGdp: 42,
      fdi: 8e7,
      electricity: 78,
      internet: 47,
      lifeExp: 57.1,
      literacy: 88,
      rrs: 22,
      tagline: "Africa's Last Absolute Monarchy Powered by Sugar and Coca-Cola",
      paradox: "Coca-Cola concentrate plant generates 20% of exports while a third faces food insecurity.",
      tools: [ {
        n: "Eswatini PAYE",
        p: "/eswatini/sz-paye"
      } ]
    },
    AO: {
      name: "Angola",
      slug: "angola",
      flag: "🇦🇴",
      region: "south",
      capital: "Luanda",
      population: 367e5,
      popGrowth: 3.2,
      gdp: 921e8,
      gdpPpp: 224e9,
      gdpPC: 2510,
      gdpPCppp: 6100,
      gdpGrowth: 2.8,
      gdpHist: {
        1990: 103e8,
        2e3: 91e8,
        2010: 838e8,
        2015: 102e9,
        2020: 536e8,
        2024: 921e8
      },
      currency: {
        code: "AOA",
        name: "Angolan Kwanza",
        sym: "Kz"
      },
      resources: [ {
        type: "oil",
        rank: 2,
        prod: "1.1M bpd",
        share: 10,
        global: null,
        note: "Deepwater pre-salt blocks"
      }, {
        type: "diamond",
        rank: 2,
        prod: "9.7M carats/yr",
        share: 11,
        global: 7,
        note: "Catoca mine — 4th largest kimberlite globally"
      }, {
        type: "gas",
        rank: 3,
        prod: "8 bcm/yr",
        share: 4,
        global: null,
        note: "Angola LNG plant"
      }, {
        type: "iron",
        rank: 3,
        prod: "5M tonnes/yr",
        share: 1.2,
        global: null,
        note: "Cassinga deposits"
      } ],
      exports: [ {
        p: "Crude Petroleum",
        v: 335e8,
        s: 92
      }, {
        p: "Diamonds",
        v: 18e8,
        s: 5
      }, {
        p: "Natural Gas",
        v: 5e8,
        s: 1.4
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 38e8,
        s: 18
      }, {
        p: "Food Products",
        v: 26e8,
        s: 12.3
      }, {
        p: "Machinery",
        v: 22e8,
        s: 10.4
      } ],
      totalExports: 364e8,
      totalImports: 211e8,
      hdi: .586,
      hdiRank: 148,
      gini: 51.3,
      inflation: 13.8,
      unemployment: 30,
      debtGdp: 84.9,
      fdi: 36e8,
      electricity: 46,
      internet: 36,
      lifeExp: 62,
      literacy: 72,
      rrs: 80,
      tagline: "Sub-Saharan Africa's Second-Largest Oil Producer",
      paradox: "Africa's #2 oil exporter yet imports 94% of its food.",
      tools: [ {
        n: "Angola PAYE",
        p: "/angola/ao-paye"
      } ]
    },
    CD: {
      name: "DR Congo",
      slug: "dr-congo",
      flag: "🇨🇩",
      region: "central",
      capital: "Kinshasa",
      population: 1023e5,
      popGrowth: 3.2,
      gdp: 664e8,
      gdpPpp: 154e9,
      gdpPC: 649,
      gdpPCppp: 1510,
      gdpGrowth: 6.2,
      gdpHist: {
        1990: 93e8,
        2e3: 43e8,
        2010: 216e8,
        2015: 379e8,
        2020: 487e8,
        2024: 664e8
      },
      currency: {
        code: "CDF",
        name: "Congolese Franc",
        sym: "FC"
      },
      resources: [ {
        type: "cobalt",
        rank: 1,
        prod: "170K tonnes/yr",
        share: 95,
        global: 73,
        note: "Katanga — irreplaceable for EV batteries"
      }, {
        type: "copper",
        rank: 1,
        prod: "2.8M tonnes/yr",
        share: 52,
        global: 12,
        note: "Kamoa-Kakula, Tenke Fungurume"
      }, {
        type: "coltan",
        rank: 1,
        prod: "700 tonnes/yr",
        share: 60,
        global: 40,
        note: "Eastern DRC, conflict mineral concerns"
      }, {
        type: "diamond",
        rank: 2,
        prod: "12M carats/yr",
        share: 14,
        global: 8,
        note: "Kasai provinces"
      }, {
        type: "gold",
        rank: 3,
        prod: "30 tonnes/yr",
        share: 5,
        global: null,
        note: "Ituri, Kivu artisanal"
      } ],
      exports: [ {
        p: "Copper",
        v: 192e8,
        s: 55
      }, {
        p: "Cobalt",
        v: 105e8,
        s: 30
      }, {
        p: "Crude Petroleum",
        v: 14e8,
        s: 4
      }, {
        p: "Diamonds",
        v: 8e8,
        s: 2.3
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 28e8,
        s: 16
      }, {
        p: "Machinery",
        v: 21e8,
        s: 12
      }, {
        p: "Food Products",
        v: 19e8,
        s: 11
      } ],
      totalExports: 348e8,
      totalImports: 175e8,
      hdi: .479,
      hdiRank: 179,
      gini: 42.1,
      inflation: 19.9,
      unemployment: 4.3,
      debtGdp: 21,
      fdi: 42e8,
      electricity: 21,
      internet: 27,
      lifeExp: 60.7,
      literacy: 77,
      rrs: 97,
      tagline: "The Geological Scandal — Mineral Colossus Powering the Energy Transition",
      paradox: "Supplies 73% of global cobalt for EVs and smartphones yet 62% live on under $2.15/day.",
      tools: [ {
        n: "DR Congo PAYE",
        p: "/dr-congo/cd-paye"
      } ]
    },
    CG: {
      name: "Republic of Congo",
      slug: "congo",
      flag: "🇨🇬",
      region: "central",
      capital: "Brazzaville",
      population: 61e5,
      popGrowth: 2.4,
      gdp: 153e8,
      gdpPpp: 298e8,
      gdpPC: 2510,
      gdpPCppp: 4890,
      gdpGrowth: 2.5,
      gdpHist: {
        1990: 28e8,
        2e3: 32e8,
        2010: 12e9,
        2015: 86e8,
        2020: 101e8,
        2024: 153e8
      },
      currency: {
        code: "XAF",
        name: "Central African CFA Franc",
        sym: "FCFA"
      },
      resources: [ {
        type: "oil",
        rank: 4,
        prod: "260K bpd",
        share: 2.5,
        global: null,
        note: "Offshore Pointe-Noire fields"
      }, {
        type: "timber",
        rank: 2,
        prod: "2.5M m³/yr",
        share: 12,
        global: null,
        note: "Northern rainforest"
      } ],
      exports: [ {
        p: "Crude Petroleum",
        v: 78e8,
        s: 82
      }, {
        p: "Timber",
        v: 5e8,
        s: 5.3
      }, {
        p: "Refined Petroleum",
        v: 3e8,
        s: 3.2
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 9e8,
        s: 16
      }, {
        p: "Food Products",
        v: 6e8,
        s: 10.6
      }, {
        p: "Machinery",
        v: 5e8,
        s: 8.8
      } ],
      totalExports: 95e8,
      totalImports: 57e8,
      hdi: .571,
      hdiRank: 150,
      gini: 48.9,
      inflation: 3.5,
      unemployment: 22.1,
      debtGdp: 95,
      fdi: 35e8,
      electricity: 50,
      internet: 33,
      lifeExp: 64,
      literacy: 81,
      rrs: 58,
      tagline: "Oil-Rich Congo Basin Nation",
      paradox: "One of Africa's most oil-dependent economies at 82% export concentration.",
      tools: [ {
        n: "Congo PAYE",
        p: "/congo/cg-paye"
      } ]
    },
    GA: {
      name: "Gabon",
      slug: "gabon",
      flag: "🇬🇦",
      region: "central",
      capital: "Libreville",
      population: 24e5,
      popGrowth: 2.4,
      gdp: 211e8,
      gdpPpp: 402e8,
      gdpPC: 8790,
      gdpPCppp: 16750,
      gdpGrowth: 2.3,
      gdpHist: {
        1990: 59e8,
        2e3: 51e8,
        2010: 144e8,
        2015: 143e8,
        2020: 153e8,
        2024: 211e8
      },
      currency: {
        code: "XAF",
        name: "Central African CFA Franc",
        sym: "FCFA"
      },
      resources: [ {
        type: "manganese",
        rank: 2,
        prod: "8.5M tonnes/yr",
        share: 30,
        global: 21,
        note: "Moanda — world's largest manganese deposit"
      }, {
        type: "oil",
        rank: 5,
        prod: "200K bpd",
        share: 1.9,
        global: null,
        note: "Mature fields declining"
      }, {
        type: "timber",
        rank: 1,
        prod: "3.5M m³/yr",
        share: 17,
        global: null,
        note: "88% forest cover, okoumé specialty"
      } ],
      exports: [ {
        p: "Crude Petroleum",
        v: 62e8,
        s: 56
      }, {
        p: "Manganese",
        v: 28e8,
        s: 25
      }, {
        p: "Timber",
        v: 8e8,
        s: 7.2
      } ],
      imports: [ {
        p: "Machinery",
        v: 12e8,
        s: 17
      }, {
        p: "Refined Petroleum",
        v: 6e8,
        s: 8.6
      }, {
        p: "Food Products",
        v: 5e8,
        s: 7.1
      } ],
      totalExports: 111e8,
      totalImports: 7e9,
      hdi: .706,
      hdiRank: 112,
      gini: 38,
      inflation: 2.3,
      unemployment: 20.4,
      debtGdp: 56,
      fdi: 15e8,
      electricity: 92,
      internet: 72,
      lifeExp: 66.5,
      literacy: 85,
      rrs: 74,
      tagline: "Central Africa's Wealthiest Per Capita Nation",
      paradox: "Highest GDP per capita in Central Africa with 88% forest cover, yet 33% live in poverty.",
      tools: [ {
        n: "Gabon PAYE",
        p: "/gabon/ga-paye"
      } ]
    },
    CF: {
      name: "Central African Republic",
      slug: "car",
      flag: "🇨🇫",
      region: "central",
      capital: "Bangui",
      population: 555e4,
      popGrowth: 1.8,
      gdp: 26e8,
      gdpPpp: 56e8,
      gdpPC: 468,
      gdpPCppp: 1010,
      gdpGrowth: 1,
      gdpHist: {
        1990: 15e8,
        2e3: 1e9,
        2010: 2e9,
        2015: 17e8,
        2020: 23e8,
        2024: 26e8
      },
      currency: {
        code: "XAF",
        name: "Central African CFA Franc",
        sym: "FCFA"
      },
      resources: [ {
        type: "diamond",
        rank: 5,
        prod: "300K carats/yr",
        share: .3,
        global: null,
        note: "Alluvial deposits"
      }, {
        type: "gold",
        rank: null,
        prod: "2 tonnes/yr",
        share: 0,
        global: null,
        note: "Artisanal, largely informal"
      }, {
        type: "timber",
        rank: null,
        prod: "800K m³/yr",
        share: 4,
        global: null,
        note: "Southwestern rainforests"
      } ],
      exports: [ {
        p: "Timber",
        v: 1e8,
        s: 38
      }, {
        p: "Diamonds",
        v: 5e7,
        s: 19
      }, {
        p: "Cotton",
        v: 3e7,
        s: 11
      } ],
      imports: [ {
        p: "Food Products",
        v: 12e7,
        s: 22
      }, {
        p: "Refined Petroleum",
        v: 8e7,
        s: 14.5
      } ],
      totalExports: 264e6,
      totalImports: 55e7,
      hdi: .387,
      hdiRank: 191,
      gini: 56.2,
      inflation: 3.2,
      unemployment: 6,
      debtGdp: 48,
      fdi: 3e7,
      electricity: 15,
      internet: 11,
      lifeExp: 53.1,
      literacy: 37,
      rrs: 35,
      tagline: "Mineral-Rich Yet Conflict-Trapped Heart of Africa",
      paradox: "Sits on diamonds, uranium, and gold but ranks second-lowest on HDI globally.",
      tools: [ {
        n: "CAR PAYE",
        p: "/car/cf-paye"
      } ]
    },
    TD: {
      name: "Chad",
      slug: "chad",
      flag: "🇹🇩",
      region: "central",
      capital: "N'Djamena",
      population: 183e5,
      popGrowth: 3.1,
      gdp: 126e8,
      gdpPpp: 303e8,
      gdpPC: 688,
      gdpPCppp: 1660,
      gdpGrowth: 3,
      gdpHist: {
        1990: 17e8,
        2e3: 14e8,
        2010: 107e8,
        2015: 101e8,
        2020: 101e8,
        2024: 126e8
      },
      currency: {
        code: "XAF",
        name: "Central African CFA Franc",
        sym: "FCFA"
      },
      resources: [ {
        type: "oil",
        rank: 6,
        prod: "120K bpd",
        share: 1.2,
        global: null,
        note: "Doba Basin, Chad-Cameroon pipeline"
      }, {
        type: "gold",
        rank: null,
        prod: "3 tonnes/yr",
        share: 0,
        global: null,
        note: "Artisanal mining"
      } ],
      exports: [ {
        p: "Crude Petroleum",
        v: 35e8,
        s: 83
      }, {
        p: "Gold",
        v: 2e8,
        s: 4.8
      }, {
        p: "Cotton",
        v: 12e7,
        s: 2.9
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 5e8,
        s: 14
      }, {
        p: "Machinery",
        v: 4e8,
        s: 11.1
      }, {
        p: "Food Products",
        v: 3e8,
        s: 8.3
      } ],
      totalExports: 42e8,
      totalImports: 36e8,
      hdi: .394,
      hdiRank: 190,
      gini: 37.5,
      inflation: 7,
      unemployment: 2.1,
      debtGdp: 42,
      fdi: 6e8,
      electricity: 11,
      internet: 16,
      lifeExp: 52.5,
      literacy: 26,
      rrs: 42,
      tagline: "Sahel Oil Producer and Africa's Strategic Military Crossroads",
      paradox: "Oil since 2003 has barely moved human development — literacy at 26% is among the lowest globally.",
      tools: [ {
        n: "Chad PAYE",
        p: "/chad/td-paye"
      } ]
    },
    GQ: {
      name: "Equatorial Guinea",
      slug: "equatorial-guinea",
      flag: "🇬🇶",
      region: "central",
      capital: "Malabo",
      population: 174e4,
      popGrowth: 3.2,
      gdp: 123e8,
      gdpPpp: 254e8,
      gdpPC: 7070,
      gdpPCppp: 14600,
      gdpGrowth: -5.2,
      gdpHist: {
        1990: 13e7,
        2e3: 13e8,
        2010: 156e8,
        2015: 122e8,
        2020: 1e10,
        2024: 123e8
      },
      currency: {
        code: "XAF",
        name: "Central African CFA Franc",
        sym: "FCFA"
      },
      resources: [ {
        type: "oil",
        rank: 3,
        prod: "90K bpd",
        share: .9,
        global: null,
        note: "Zafiro, Ceiba — declining"
      }, {
        type: "gas",
        rank: 2,
        prod: "6.2 bcm/yr",
        share: 3,
        global: null,
        note: "EG LNG terminal"
      } ],
      exports: [ {
        p: "Crude Petroleum",
        v: 45e8,
        s: 55
      }, {
        p: "Natural Gas & LNG",
        v: 2e9,
        s: 24
      }, {
        p: "Methanol",
        v: 9e8,
        s: 11
      } ],
      imports: [ {
        p: "Machinery",
        v: 11e8,
        s: 21
      }, {
        p: "Motor Vehicles",
        v: 5e8,
        s: 9.6
      }, {
        p: "Food Products",
        v: 4e8,
        s: 7.7
      } ],
      totalExports: 82e8,
      totalImports: 52e8,
      hdi: .596,
      hdiRank: 144,
      gini: null,
      inflation: 2.3,
      unemployment: 8.6,
      debtGdp: 32,
      fdi: 14e8,
      electricity: 67,
      internet: 54,
      lifeExp: 60.6,
      literacy: 95,
      rrs: 55,
      tagline: "Petro-State Facing Production Cliff",
      paradox: "Was once wealthiest African per capita yet most citizens never benefited — no diversification plan.",
      tools: [ {
        n: "Equatorial Guinea PAYE",
        p: "/eq-guinea/gq-paye"
      } ]
    },
    ST: {
      name: "São Tomé & Príncipe",
      slug: "sao-tome",
      flag: "🇸🇹",
      region: "central",
      capital: "São Tomé",
      population: 23e4,
      popGrowth: 1.7,
      gdp: 64e7,
      gdpPpp: 14e8,
      gdpPC: 2780,
      gdpPCppp: 6090,
      gdpGrowth: 1.8,
      gdpHist: {
        1990: 6e7,
        2e3: 7e7,
        2010: 22e7,
        2015: 34e7,
        2020: 47e7,
        2024: 64e7
      },
      currency: {
        code: "STN",
        name: "São Tomé Dobra",
        sym: "Db"
      },
      resources: [ {
        type: "cocoa",
        rank: null,
        prod: "3.5K tonnes/yr",
        share: 0,
        global: null,
        note: "Organic fine-flavour cocoa"
      }, {
        type: "fish",
        rank: null,
        prod: "4K tonnes/yr",
        share: 0,
        global: null,
        note: "Tuna-rich EEZ"
      } ],
      exports: [ {
        p: "Cocoa",
        v: 18e6,
        s: 67
      }, {
        p: "Copra & Palm Oil",
        v: 3e6,
        s: 11
      }, {
        p: "Fish",
        v: 2e6,
        s: 7.4
      } ],
      imports: [ {
        p: "Food Products",
        v: 6e7,
        s: 28
      }, {
        p: "Refined Petroleum",
        v: 3e7,
        s: 14
      }, {
        p: "Machinery",
        v: 2e7,
        s: 9.3
      } ],
      totalExports: 27e6,
      totalImports: 215e6,
      hdi: .618,
      hdiRank: 136,
      gini: 40.7,
      inflation: 20,
      unemployment: 14,
      debtGdp: 68,
      fdi: 4e7,
      electricity: 75,
      internet: 36,
      lifeExp: 67.8,
      literacy: 93,
      rrs: 10,
      tagline: "Africa's Second-Smallest Nation Betting on Cocoa and Ecotourism",
      paradox: "Exports premium organic cocoa to European chocolatiers while importing 28% of needs as food.",
      tools: []
    },
    EG: {
      name: "Egypt",
      slug: "egypt",
      flag: "🇪🇬",
      region: "north",
      capital: "Cairo",
      population: 1057e5,
      popGrowth: 1.6,
      gdp: 395e9,
      gdpPpp: 181e10,
      gdpPC: 3740,
      gdpPCppp: 17130,
      gdpGrowth: 3.8,
      gdpHist: {
        1990: 431e8,
        2e3: 998e8,
        2010: 219e9,
        2015: 332e9,
        2020: 365e9,
        2024: 395e9
      },
      currency: {
        code: "EGP",
        name: "Egyptian Pound",
        sym: "E£"
      },
      resources: [ {
        type: "gas",
        rank: 1,
        prod: "67 bcm/yr",
        share: 28,
        global: null,
        note: "Zohr — largest Mediterranean gas discovery"
      }, {
        type: "oil",
        rank: 4,
        prod: "550K bpd",
        share: 5.3,
        global: null,
        note: "Gulf of Suez, Western Desert"
      }, {
        type: "phosphate",
        rank: 1,
        prod: "5.5M tonnes/yr",
        share: 35,
        global: 2,
        note: "Red Sea coast, Nile Valley"
      }, {
        type: "gold",
        rank: 2,
        prod: "15 tonnes/yr",
        share: 3,
        global: null,
        note: "Sukari mine"
      } ],
      exports: [ {
        p: "Petroleum & Gas",
        v: 135e8,
        s: 29
      }, {
        p: "Fertilizers",
        v: 32e8,
        s: 6.9
      }, {
        p: "Textiles",
        v: 28e8,
        s: 6
      }, {
        p: "Plastics",
        v: 21e8,
        s: 4.5
      }, {
        p: "Fruit & Vegetables",
        v: 19e8,
        s: 4.1
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 78e8,
        s: 10
      }, {
        p: "Wheat",
        v: 42e8,
        s: 5.4
      }, {
        p: "Machinery",
        v: 39e8,
        s: 5
      }, {
        p: "Iron & Steel",
        v: 35e8,
        s: 4.5
      }, {
        p: "Motor Vehicles",
        v: 31e8,
        s: 4
      } ],
      totalExports: 465e8,
      totalImports: 78e9,
      hdi: .728,
      hdiRank: 105,
      gini: 31.5,
      inflation: 33.9,
      unemployment: 7.1,
      debtGdp: 92.7,
      fdi: 98e8,
      electricity: 100,
      internet: 72,
      lifeExp: 70.2,
      literacy: 73,
      rrs: 75,
      tagline: "Africa's Largest Economy by Population with Suez Canal Leverage",
      paradox: "Controls 12% of global trade via the Suez yet runs a $31B trade deficit and imports more wheat than any nation.",
      tools: [ {
        n: "Egypt PAYE Calculator",
        p: "/egypt/eg-paye"
      } ]
    },
    MA: {
      name: "Morocco",
      slug: "morocco",
      flag: "🇲🇦",
      region: "north",
      capital: "Rabat",
      population: 378e5,
      popGrowth: 1,
      gdp: 141e9,
      gdpPpp: 363e9,
      gdpPC: 3730,
      gdpPCppp: 9600,
      gdpGrowth: 3,
      gdpHist: {
        1990: 304e8,
        2e3: 37e9,
        2010: 932e8,
        2015: 101e9,
        2020: 114e9,
        2024: 141e9
      },
      currency: {
        code: "MAD",
        name: "Moroccan Dirham",
        sym: "MAD"
      },
      resources: [ {
        type: "phosphate",
        rank: 1,
        prod: "40M tonnes/yr",
        share: 60,
        global: 18,
        note: "OCP Group — 72% of global phosphate reserves"
      }, {
        type: "cobalt",
        rank: 2,
        prod: "2.3K tonnes/yr",
        share: 2.3,
        global: null,
        note: "Bou Azzer — only primary cobalt mine globally"
      }, {
        type: "fish",
        rank: 1,
        prod: "1.5M tonnes/yr",
        share: 28,
        global: null,
        note: "Largest in Africa, sardine superpower"
      } ],
      exports: [ {
        p: "Phosphates & Fertilizers",
        v: 98e8,
        s: 19
      }, {
        p: "Motor Vehicles",
        v: 85e8,
        s: 16.5
      }, {
        p: "Textiles",
        v: 52e8,
        s: 10.1
      }, {
        p: "Electronics",
        v: 48e8,
        s: 9.3
      }, {
        p: "Fish & Seafood",
        v: 31e8,
        s: 6
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 85e8,
        s: 12
      }, {
        p: "Crude Petroleum",
        v: 42e8,
        s: 5.9
      }, {
        p: "Wheat",
        v: 28e8,
        s: 3.9
      }, {
        p: "Machinery",
        v: 36e8,
        s: 5.1
      } ],
      totalExports: 516e8,
      totalImports: 711e8,
      hdi: .698,
      hdiRank: 116,
      gini: 39.5,
      inflation: 1.3,
      unemployment: 13,
      debtGdp: 69.5,
      fdi: 21e8,
      electricity: 100,
      internet: 88,
      lifeExp: 74,
      literacy: 75,
      rrs: 82,
      tagline: "Phosphate Kingdom and Africa's Industrial Diversification Champion",
      paradox: "Holds 72% of global phosphate reserves — the world depends on Morocco to eat — yet imports most of its energy.",
      tools: [ {
        n: "Morocco PAYE",
        p: "/morocco/ma-paye"
      } ]
    },
    DZ: {
      name: "Algeria",
      slug: "algeria",
      flag: "🇩🇿",
      region: "north",
      capital: "Algiers",
      population: 463e5,
      popGrowth: 1.5,
      gdp: 24e10,
      gdpPpp: 632e9,
      gdpPC: 5180,
      gdpPCppp: 13650,
      gdpGrowth: 3.8,
      gdpHist: {
        1990: 62e9,
        2e3: 547e8,
        2010: 161e9,
        2015: 166e9,
        2020: 145e9,
        2024: 24e10
      },
      currency: {
        code: "DZD",
        name: "Algerian Dinar",
        sym: "DA"
      },
      resources: [ {
        type: "gas",
        rank: 2,
        prod: "100 bcm/yr",
        share: 42,
        global: 2,
        note: "Hassi R'Mel — Africa's largest gas field"
      }, {
        type: "oil",
        rank: 3,
        prod: "970K bpd",
        share: 9.3,
        global: null,
        note: "Hassi Messaoud, OPEC member"
      }, {
        type: "iron",
        rank: 1,
        prod: "3.5M tonnes/yr",
        share: 9,
        global: null,
        note: "Gara Djebilet — massive untapped deposit"
      }, {
        type: "phosphate",
        rank: 2,
        prod: "1.8M tonnes/yr",
        share: 12,
        global: null,
        note: "Djebel Onk deposits"
      } ],
      exports: [ {
        p: "Crude Petroleum",
        v: 205e8,
        s: 44
      }, {
        p: "Natural Gas & LNG",
        v: 178e8,
        s: 38
      }, {
        p: "Refined Petroleum",
        v: 31e8,
        s: 6.7
      }, {
        p: "Ammonia & Fertilizers",
        v: 18e8,
        s: 3.9
      } ],
      imports: [ {
        p: "Machinery",
        v: 65e8,
        s: 14
      }, {
        p: "Motor Vehicles",
        v: 38e8,
        s: 8.2
      }, {
        p: "Iron & Steel",
        v: 32e8,
        s: 6.9
      }, {
        p: "Food Products",
        v: 3e9,
        s: 6.5
      } ],
      totalExports: 464e8,
      totalImports: 463e8,
      hdi: .745,
      hdiRank: 91,
      gini: 27.6,
      inflation: 7.7,
      unemployment: 11.7,
      debtGdp: 47.7,
      fdi: 11e8,
      electricity: 100,
      internet: 71,
      lifeExp: 76.4,
      literacy: 81,
      rrs: 78,
      tagline: "Africa's Largest Country and OPEC Gas Giant",
      paradox: "97% of exports from hydrocarbons yet sits on untapped iron at Gara Djebilet.",
      tools: [ {
        n: "Algeria PAYE",
        p: "/algeria/dz-paye"
      } ]
    },
    TN: {
      name: "Tunisia",
      slug: "tunisia",
      flag: "🇹🇳",
      region: "north",
      capital: "Tunis",
      population: 125e5,
      popGrowth: .8,
      gdp: 463e8,
      gdpPpp: 145e9,
      gdpPC: 3700,
      gdpPCppp: 11600,
      gdpGrowth: 1.6,
      gdpHist: {
        1990: 123e8,
        2e3: 215e8,
        2010: 441e8,
        2015: 41e9,
        2020: 392e8,
        2024: 463e8
      },
      currency: {
        code: "TND",
        name: "Tunisian Dinar",
        sym: "DT"
      },
      resources: [ {
        type: "phosphate",
        rank: 3,
        prod: "3.8M tonnes/yr",
        share: 24,
        global: null,
        note: "Gafsa basin — mining since 1897"
      }, {
        type: "farm",
        rank: null,
        prod: "Olive oil: 240K tonnes/yr",
        share: 65,
        global: 7,
        note: "Second-largest olive oil exporter globally"
      } ],
      exports: [ {
        p: "Electrical Equipment",
        v: 58e8,
        s: 28
      }, {
        p: "Textiles",
        v: 36e8,
        s: 17
      }, {
        p: "Olive Oil",
        v: 16e8,
        s: 7.7
      }, {
        p: "Phosphates",
        v: 14e8,
        s: 6.7
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 32e8,
        s: 12.8
      }, {
        p: "Machinery",
        v: 28e8,
        s: 11.2
      }, {
        p: "Iron & Steel",
        v: 16e8,
        s: 6.4
      }, {
        p: "Wheat",
        v: 13e8,
        s: 5.2
      } ],
      totalExports: 207e8,
      totalImports: 25e9,
      hdi: .732,
      hdiRank: 101,
      gini: 32.8,
      inflation: 7.1,
      unemployment: 15.8,
      debtGdp: 80.2,
      fdi: 7e8,
      electricity: 100,
      internet: 79,
      lifeExp: 76.7,
      literacy: 82,
      rrs: 45,
      tagline: "Arab Spring Birthplace with Phosphates and Olive Oil",
      paradox: "Most educated workforce in North Africa yet 15.8% unemployment — a talent export machine.",
      tools: [ {
        n: "Tunisia PAYE",
        p: "/tunisia/tn-paye"
      } ]
    },
    LY: {
      name: "Libya",
      slug: "libya",
      flag: "🇱🇾",
      region: "north",
      capital: "Tripoli",
      population: 7e6,
      popGrowth: 1.2,
      gdp: 444e8,
      gdpPpp: 814e8,
      gdpPC: 6340,
      gdpPCppp: 11630,
      gdpGrowth: 8,
      gdpHist: {
        1990: 288e8,
        2e3: 339e8,
        2010: 748e8,
        2015: 292e8,
        2020: 254e8,
        2024: 444e8
      },
      currency: {
        code: "LYD",
        name: "Libyan Dinar",
        sym: "LD"
      },
      resources: [ {
        type: "oil",
        rank: 1,
        prod: "1.2M bpd",
        share: 11.5,
        global: null,
        note: "Africa's largest proven reserves at 48.4B bbl"
      }, {
        type: "gas",
        rank: 3,
        prod: "12.4 bcm/yr",
        share: 5.2,
        global: null,
        note: "Pipeline to Italy"
      } ],
      exports: [ {
        p: "Crude Petroleum",
        v: 258e8,
        s: 93
      }, {
        p: "Natural Gas",
        v: 1e9,
        s: 3.6
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 35e8,
        s: 21
      }, {
        p: "Food Products",
        v: 28e8,
        s: 17
      }, {
        p: "Machinery",
        v: 18e8,
        s: 10.8
      } ],
      totalExports: 277e8,
      totalImports: 167e8,
      hdi: .718,
      hdiRank: 104,
      gini: null,
      inflation: 2.1,
      unemployment: 19.6,
      debtGdp: null,
      fdi: null,
      electricity: 70,
      internet: 84,
      lifeExp: 72,
      literacy: 91,
      rrs: 70,
      tagline: "Africa's Largest Oil Reserve Holder",
      paradox: "More proven oil than any African nation yet output swings between 0 and 1.2M bpd by faction control.",
      tools: [ {
        n: "Libya PAYE",
        p: "/libya/ly-paye"
      } ]
    },
    SD: {
      name: "Sudan",
      slug: "sudan",
      flag: "🇸🇩",
      region: "north",
      capital: "Khartoum",
      population: 481e5,
      popGrowth: 2.5,
      gdp: 26e9,
      gdpPpp: 176e9,
      gdpPC: 540,
      gdpPCppp: 3660,
      gdpGrowth: -12,
      gdpHist: {
        1990: 124e8,
        2e3: 123e8,
        2010: 656e8,
        2015: 816e8,
        2020: 343e8,
        2024: 26e9
      },
      currency: {
        code: "SDG",
        name: "Sudanese Pound",
        sym: "SDG"
      },
      resources: [ {
        type: "gold",
        rank: 2,
        prod: "80 tonnes/yr",
        share: 14,
        global: null,
        note: "Africa's #2 gold producer"
      }, {
        type: "farm",
        rank: null,
        prod: "Gum arabic: 88K tonnes/yr",
        share: 60,
        global: 60,
        note: "Global monopoly — in every can of Coca-Cola"
      } ],
      exports: [ {
        p: "Gold",
        v: 28e8,
        s: 65
      }, {
        p: "Livestock",
        v: 5e8,
        s: 11.6
      }, {
        p: "Sesame Seeds",
        v: 3e8,
        s: 7
      }, {
        p: "Gum Arabic",
        v: 15e7,
        s: 3.5
      } ],
      imports: [ {
        p: "Wheat & Food",
        v: 12e8,
        s: 19
      }, {
        p: "Refined Petroleum",
        v: 8e8,
        s: 12.7
      }, {
        p: "Machinery",
        v: 6e8,
        s: 9.5
      } ],
      totalExports: 43e8,
      totalImports: 63e8,
      hdi: .508,
      hdiRank: 170,
      gini: 34.2,
      inflation: 171,
      unemployment: 11.4,
      debtGdp: 183.9,
      fdi: 1e8,
      electricity: 54,
      internet: 30,
      lifeExp: 65.3,
      literacy: 61,
      rrs: 55,
      tagline: "Gold Rush Nation Supplying 60% of the World's Gum Arabic",
      paradox: "Produces 60% of gum arabic (in every Coca-Cola) and is #2 gold producer, yet civil war has collapsed GDP.",
      tools: [ {
        n: "Sudan PAYE",
        p: "/sudan/sd-paye"
      } ]
    },
    MU: {
      name: "Mauritius",
      slug: "mauritius",
      flag: "🇲🇺",
      region: "island",
      capital: "Port Louis",
      population: 127e4,
      popGrowth: .1,
      gdp: 148e8,
      gdpPpp: 334e8,
      gdpPC: 11650,
      gdpPCppp: 26300,
      gdpGrowth: 4.9,
      gdpHist: {
        1990: 27e8,
        2e3: 46e8,
        2010: 1e10,
        2015: 117e8,
        2020: 109e8,
        2024: 148e8
      },
      currency: {
        code: "MUR",
        name: "Mauritian Rupee",
        sym: "Rs"
      },
      resources: [ {
        type: "fish",
        rank: 1,
        prod: "2.3M km² EEZ",
        share: 0,
        global: null,
        note: "Indian Ocean tuna hub"
      } ],
      exports: [ {
        p: "Textiles & Apparel",
        v: 11e8,
        s: 25
      }, {
        p: "Fish & Seafood",
        v: 5e8,
        s: 11.4
      }, {
        p: "Sugar & Rum",
        v: 3e8,
        s: 6.8
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 13e8,
        s: 16
      }, {
        p: "Fish (processing)",
        v: 5e8,
        s: 6.2
      }, {
        p: "Machinery",
        v: 4e8,
        s: 4.9
      } ],
      totalExports: 44e8,
      totalImports: 81e8,
      hdi: .796,
      hdiRank: 72,
      gini: 36.8,
      inflation: 7,
      unemployment: 6.1,
      debtGdp: 80.4,
      fdi: 5e8,
      electricity: 100,
      internet: 68,
      lifeExp: 74.1,
      literacy: 92,
      rrs: 18,
      tagline: "Africa's Highest HDI Island — The Singapore of the Indian Ocean",
      paradox: "Zero natural resources at independence, now highest HDI in Africa through services and governance.",
      tools: [ {
        n: "Mauritius PAYE",
        p: "/mauritius/mu-paye"
      } ]
    },
    SC: {
      name: "Seychelles",
      slug: "seychelles",
      flag: "🇸🇨",
      region: "island",
      capital: "Victoria",
      population: 107e3,
      popGrowth: .6,
      gdp: 22e8,
      gdpPpp: 4e9,
      gdpPC: 20560,
      gdpPCppp: 37380,
      gdpGrowth: 4.2,
      gdpHist: {
        1990: 37e7,
        2e3: 61e7,
        2010: 97e7,
        2015: 14e8,
        2020: 12e8,
        2024: 22e8
      },
      currency: {
        code: "SCR",
        name: "Seychellois Rupee",
        sym: "Rs"
      },
      resources: [ {
        type: "fish",
        rank: 2,
        prod: "1.4M km² EEZ",
        share: 0,
        global: null,
        note: "Port Victoria — largest tuna canning port in Indian Ocean"
      } ],
      exports: [ {
        p: "Canned Tuna",
        v: 42e7,
        s: 70
      }, {
        p: "Fresh Fish",
        v: 8e7,
        s: 13
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 35e7,
        s: 20
      }, {
        p: "Food Products",
        v: 2e8,
        s: 11.4
      } ],
      totalExports: 6e8,
      totalImports: 175e7,
      hdi: .785,
      hdiRank: 76,
      gini: 32.1,
      inflation: 1,
      unemployment: 3,
      debtGdp: 63,
      fdi: 25e7,
      electricity: 100,
      internet: 79,
      lifeExp: 73.4,
      literacy: 96,
      rrs: 12,
      tagline: "Africa's Richest Per Capita — 115 Islands of Tuna and Tourism",
      paradox: "Highest GDP per capita in Africa yet 70% of exports = canned tuna.",
      tools: [ {
        n: "Seychelles PAYE",
        p: "/seychelles/sc-paye"
      } ]
    },
    KM: {
      name: "Comoros",
      slug: "comoros",
      flag: "🇰🇲",
      region: "island",
      capital: "Moroni",
      population: 85e4,
      popGrowth: 2.2,
      gdp: 13e8,
      gdpPpp: 3e9,
      gdpPC: 1530,
      gdpPCppp: 3530,
      gdpGrowth: 3,
      gdpHist: {
        1990: 26e7,
        2e3: 2e8,
        2010: 56e7,
        2015: 59e7,
        2020: 11e8,
        2024: 13e8
      },
      currency: {
        code: "KMF",
        name: "Comorian Franc",
        sym: "CF"
      },
      resources: [ {
        type: "farm",
        rank: null,
        prod: "Ylang-ylang: 80% global",
        share: 80,
        global: 80,
        note: "World's dominant producer — base note in Chanel No. 5"
      }, {
        type: "farm",
        rank: null,
        prod: "Vanilla",
        share: 0,
        global: null,
        note: "High-quality bourbon vanilla"
      } ],
      exports: [ {
        p: "Cloves",
        v: 32e6,
        s: 45
      }, {
        p: "Ylang-Ylang",
        v: 15e6,
        s: 21
      }, {
        p: "Vanilla",
        v: 12e6,
        s: 17
      } ],
      imports: [ {
        p: "Rice",
        v: 65e6,
        s: 19
      }, {
        p: "Refined Petroleum",
        v: 5e7,
        s: 14.5
      }, {
        p: "Meat & Poultry",
        v: 3e7,
        s: 8.7
      } ],
      totalExports: 71e6,
      totalImports: 345e6,
      hdi: .596,
      hdiRank: 142,
      gini: 45.3,
      inflation: 1,
      unemployment: 8.5,
      debtGdp: 31,
      fdi: 1e7,
      electricity: 84,
      internet: 21,
      lifeExp: 64.3,
      literacy: 59,
      rrs: 14,
      tagline: "Volcanic Perfume Islands Producing 80% of the World's Ylang-Ylang",
      paradox: "Produces the base note of the world's most expensive perfumes yet GDP per capita is just $1,530.",
      tools: [ {
        n: "Comoros PAYE",
        p: "/comoros/km-paye"
      } ]
    }
  }, a = {
    US: {
      name: "United States",
      slug: "united-states",
      flag: "🇺🇸",
      region: "ref",
      capital: "Washington D.C.",
      population: 335e6,
      popGrowth: .5,
      gdp: 2736e10,
      gdpPpp: 2736e10,
      gdpPC: 81630,
      gdpPCppp: 81630,
      gdpGrowth: 2.5,
      gdpHist: {
        1990: 596e10,
        2e3: 1025e10,
        2010: 1499e10,
        2015: 1824e10,
        2020: 2106e10,
        2024: 2736e10
      },
      currency: {
        code: "USD",
        name: "US Dollar",
        sym: "$"
      },
      resources: [ {
        type: "oil",
        rank: null,
        prod: "13M bpd",
        share: 0,
        global: 1,
        note: "World's largest oil producer"
      } ],
      exports: [ {
        p: "Refined Petroleum",
        v: 12e10,
        s: 7
      } ],
      imports: [ {
        p: "Crude Petroleum",
        v: 15e10,
        s: 5
      } ],
      totalExports: 18e11,
      totalImports: 31e11,
      hdi: .921,
      hdiRank: 20,
      gini: 39.8,
      inflation: 3.4,
      unemployment: 3.7,
      debtGdp: 123,
      fdi: 285e9,
      electricity: 100,
      internet: 92,
      lifeExp: 77.5,
      literacy: 99,
      rrs: 85,
      tagline: "World's largest economy",
      paradox: null,
      tools: [],
      isRef: !0
    },
    CN: {
      name: "China",
      slug: "china",
      flag: "🇨🇳",
      region: "ref",
      capital: "Beijing",
      population: 1412e6,
      popGrowth: 0,
      gdp: 1779e10,
      gdpPpp: 3529e10,
      gdpPC: 12600,
      gdpPCppp: 24990,
      gdpGrowth: 5.2,
      gdpHist: {
        1990: 39e10,
        2e3: 121e10,
        2010: 609e10,
        2015: 1106e10,
        2020: 1472e10,
        2024: 1779e10
      },
      currency: {
        code: "CNY",
        name: "Chinese Yuan",
        sym: "¥"
      },
      resources: [ {
        type: "coal",
        rank: null,
        prod: "4.7B tonnes/yr",
        share: 0,
        global: 1,
        note: "World's largest coal producer"
      } ],
      exports: [ {
        p: "Electronics",
        v: 8e11,
        s: 15
      } ],
      imports: [ {
        p: "Crude Petroleum",
        v: 3e11,
        s: 10
      } ],
      totalExports: 35e11,
      totalImports: 26e11,
      hdi: .788,
      hdiRank: 75,
      gini: 38.2,
      inflation: .2,
      unemployment: 5.1,
      debtGdp: 83.6,
      fdi: 163e9,
      electricity: 100,
      internet: 73,
      lifeExp: 78.2,
      literacy: 97,
      rrs: 70,
      tagline: "World's manufacturing superpower",
      paradox: null,
      tools: [],
      isRef: !0
    },
    IN: {
      name: "India",
      slug: "india",
      flag: "🇮🇳",
      region: "ref",
      capital: "New Delhi",
      population: 1429e6,
      popGrowth: .8,
      gdp: 357e10,
      gdpPpp: 1459e10,
      gdpPC: 2500,
      gdpPCppp: 10210,
      gdpGrowth: 7.8,
      gdpHist: {
        1990: 32e10,
        2e3: 47e10,
        2010: 168e10,
        2015: 21e11,
        2020: 267e10,
        2024: 357e10
      },
      currency: {
        code: "INR",
        name: "Indian Rupee",
        sym: "₹"
      },
      resources: [ {
        type: "coal",
        rank: null,
        prod: "900M tonnes/yr",
        share: 0,
        global: 2,
        note: "Second-largest coal producer"
      } ],
      exports: [ {
        p: "Refined Petroleum",
        v: 6e10,
        s: 14
      } ],
      imports: [ {
        p: "Crude Petroleum",
        v: 15e10,
        s: 20
      } ],
      totalExports: 43e10,
      totalImports: 714e9,
      hdi: .644,
      hdiRank: 134,
      gini: 35.7,
      inflation: 5.4,
      unemployment: 3.1,
      debtGdp: 83.2,
      fdi: 49e9,
      electricity: 99,
      internet: 52,
      lifeExp: 67.2,
      literacy: 74,
      rrs: 55,
      tagline: "World's most populous nation",
      paradox: null,
      tools: [],
      isRef: !0
    },
    NO: {
      name: "Norway",
      slug: "norway",
      flag: "🇳🇴",
      region: "ref",
      capital: "Oslo",
      population: 55e5,
      popGrowth: .6,
      gdp: 485e9,
      gdpPpp: 429e9,
      gdpPC: 88230,
      gdpPCppp: 78020,
      gdpGrowth: .5,
      gdpHist: {
        1990: 117e9,
        2e3: 171e9,
        2010: 428e9,
        2015: 386e9,
        2020: 362e9,
        2024: 485e9
      },
      currency: {
        code: "NOK",
        name: "Norwegian Krone",
        sym: "kr"
      },
      resources: [ {
        type: "oil",
        rank: null,
        prod: "1.9M bpd",
        share: 0,
        global: 14,
        note: "North Sea oil, $1.7T sovereign wealth fund"
      } ],
      exports: [ {
        p: "Crude Petroleum",
        v: 6e10,
        s: 35
      } ],
      imports: [ {
        p: "Motor Vehicles",
        v: 1e10,
        s: 8
      } ],
      totalExports: 172e9,
      totalImports: 12e10,
      hdi: .961,
      hdiRank: 1,
      gini: 27.7,
      inflation: 5.5,
      unemployment: 3.6,
      debtGdp: 44.3,
      fdi: 12e9,
      electricity: 100,
      internet: 98,
      lifeExp: 83.3,
      literacy: 99,
      rrs: 65,
      tagline: "Oil nation with world's largest sovereign wealth fund",
      paradox: null,
      tools: [],
      isRef: !0
    },
    SA: {
      name: "Saudi Arabia",
      slug: "saudi-arabia",
      flag: "🇸🇦",
      region: "ref",
      capital: "Riyadh",
      population: 369e5,
      popGrowth: 1.6,
      gdp: 107e10,
      gdpPpp: 211e10,
      gdpPC: 29e3,
      gdpPCppp: 57200,
      gdpGrowth: .8,
      gdpHist: {
        1990: 117e9,
        2e3: 189e9,
        2010: 528e9,
        2015: 655e9,
        2020: 7e11,
        2024: 107e10
      },
      currency: {
        code: "SAR",
        name: "Saudi Riyal",
        sym: "﷼"
      },
      resources: [ {
        type: "oil",
        rank: null,
        prod: "10.5M bpd",
        share: 0,
        global: 2,
        note: "OPEC leader, Vision 2030 diversification"
      } ],
      exports: [ {
        p: "Crude Petroleum",
        v: 2e11,
        s: 65
      } ],
      imports: [ {
        p: "Motor Vehicles",
        v: 2e10,
        s: 8
      } ],
      totalExports: 31e10,
      totalImports: 25e10,
      hdi: .875,
      hdiRank: 35,
      gini: null,
      inflation: 2.3,
      unemployment: 5.6,
      debtGdp: 26.2,
      fdi: 1e10,
      electricity: 100,
      internet: 99,
      lifeExp: 77.6,
      literacy: 97,
      rrs: 75,
      tagline: "OPEC's de facto leader",
      paradox: null,
      tools: [],
      isRef: !0
    },
    AU: {
      name: "Australia",
      slug: "australia",
      flag: "🇦🇺",
      region: "ref",
      capital: "Canberra",
      population: 265e5,
      popGrowth: 1.3,
      gdp: 172e10,
      gdpPpp: 169e10,
      gdpPC: 64920,
      gdpPCppp: 63780,
      gdpGrowth: 2,
      gdpHist: {
        1990: 31e10,
        2e3: 4e11,
        2010: 125e10,
        2015: 135e10,
        2020: 136e10,
        2024: 172e10
      },
      currency: {
        code: "AUD",
        name: "Australian Dollar",
        sym: "A$"
      },
      resources: [ {
        type: "iron",
        rank: null,
        prod: "900M tonnes/yr",
        share: 0,
        global: 1,
        note: "World's largest iron ore exporter"
      } ],
      exports: [ {
        p: "Iron Ore",
        v: 1e11,
        s: 25
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 2e10,
        s: 5
      } ],
      totalExports: 4e11,
      totalImports: 38e10,
      hdi: .946,
      hdiRank: 4,
      gini: 34.3,
      inflation: 5.6,
      unemployment: 3.7,
      debtGdp: 52.7,
      fdi: 3e10,
      electricity: 100,
      internet: 96,
      lifeExp: 83.3,
      literacy: 99,
      rrs: 85,
      tagline: "Mining superpower",
      paradox: null,
      tools: [],
      isRef: !0
    },
    BR: {
      name: "Brazil",
      slug: "brazil",
      flag: "🇧🇷",
      region: "ref",
      capital: "Brasília",
      population: 216e6,
      popGrowth: .5,
      gdp: 213e10,
      gdpPpp: 405e10,
      gdpPC: 9870,
      gdpPCppp: 18760,
      gdpGrowth: 2.9,
      gdpHist: {
        1990: 462e9,
        2e3: 655e9,
        2010: 221e10,
        2015: 18e11,
        2020: 145e10,
        2024: 213e10
      },
      currency: {
        code: "BRL",
        name: "Brazilian Real",
        sym: "R$"
      },
      resources: [ {
        type: "oil",
        rank: null,
        prod: "3.4M bpd",
        share: 0,
        global: 7,
        note: "Pre-salt deepwater"
      } ],
      exports: [ {
        p: "Iron Ore",
        v: 3e10,
        s: 10
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 15e9,
        s: 5
      } ],
      totalExports: 34e10,
      totalImports: 3e11,
      hdi: .76,
      hdiRank: 87,
      gini: 48.9,
      inflation: 4.6,
      unemployment: 7.8,
      debtGdp: 74.4,
      fdi: 66e9,
      electricity: 99,
      internet: 81,
      lifeExp: 76,
      literacy: 93,
      rrs: 78,
      tagline: "Latin America's largest economy",
      paradox: null,
      tools: [],
      isRef: !0
    },
    RU: {
      name: "Russia",
      slug: "russia",
      flag: "🇷🇺",
      region: "ref",
      capital: "Moscow",
      population: 144e6,
      popGrowth: -.2,
      gdp: 202e10,
      gdpPpp: 551e10,
      gdpPC: 14030,
      gdpPCppp: 38290,
      gdpGrowth: 3.6,
      gdpHist: {
        1990: 517e9,
        2e3: 26e10,
        2010: 152e10,
        2015: 136e10,
        2020: 148e10,
        2024: 202e10
      },
      currency: {
        code: "RUB",
        name: "Russian Ruble",
        sym: "₽"
      },
      resources: [ {
        type: "gas",
        rank: null,
        prod: "701 bcm/yr",
        share: 0,
        global: 2,
        note: "World's 2nd-largest gas producer"
      } ],
      exports: [ {
        p: "Crude Petroleum",
        v: 12e10,
        s: 25
      } ],
      imports: [ {
        p: "Machinery",
        v: 4e10,
        s: 10
      } ],
      totalExports: 47e10,
      totalImports: 4e11,
      hdi: .821,
      hdiRank: 56,
      gini: 36,
      inflation: 7.4,
      unemployment: 3.2,
      debtGdp: 18.9,
      fdi: 25e9,
      electricity: 100,
      internet: 88,
      lifeExp: 73.4,
      literacy: 99,
      rrs: 90,
      tagline: "Energy superpower",
      paradox: null,
      tools: [],
      isRef: !0
    },
    DE: {
      name: "Germany",
      slug: "germany",
      flag: "🇩🇪",
      region: "ref",
      capital: "Berlin",
      population: 832e5,
      popGrowth: .1,
      gdp: 446e10,
      gdpPpp: 568e10,
      gdpPC: 53570,
      gdpPCppp: 68200,
      gdpGrowth: -.3,
      gdpHist: {
        1990: 159e10,
        2e3: 195e10,
        2010: 342e10,
        2015: 336e10,
        2020: 389e10,
        2024: 446e10
      },
      currency: {
        code: "EUR",
        name: "Euro",
        sym: "€"
      },
      resources: [],
      exports: [ {
        p: "Motor Vehicles",
        v: 25e10,
        s: 15
      } ],
      imports: [ {
        p: "Crude Petroleum",
        v: 4e10,
        s: 3
      } ],
      totalExports: 17e11,
      totalImports: 15e11,
      hdi: .942,
      hdiRank: 7,
      gini: 31.7,
      inflation: 2.2,
      unemployment: 3,
      debtGdp: 63.7,
      fdi: 36e9,
      electricity: 100,
      internet: 93,
      lifeExp: 80.6,
      literacy: 99,
      rrs: 15,
      tagline: "Europe's industrial engine",
      paradox: null,
      tools: [],
      isRef: !0
    },
    GB: {
      name: "United Kingdom",
      slug: "united-kingdom",
      flag: "🇬🇧",
      region: "ref",
      capital: "London",
      population: 677e5,
      popGrowth: .4,
      gdp: 334e10,
      gdpPpp: 387e10,
      gdpPC: 49350,
      gdpPCppp: 57170,
      gdpGrowth: .1,
      gdpHist: {
        1990: 109e10,
        2e3: 166e10,
        2010: 248e10,
        2015: 293e10,
        2020: 276e10,
        2024: 334e10
      },
      currency: {
        code: "GBP",
        name: "Pound Sterling",
        sym: "£"
      },
      resources: [ {
        type: "oil",
        rank: null,
        prod: "700K bpd",
        share: 0,
        global: 21,
        note: "North Sea, declining"
      } ],
      exports: [ {
        p: "Financial Services",
        v: 8e10,
        s: 10
      } ],
      imports: [ {
        p: "Motor Vehicles",
        v: 6e10,
        s: 5
      } ],
      totalExports: 87e10,
      totalImports: 95e10,
      hdi: .929,
      hdiRank: 15,
      gini: 35.1,
      inflation: 3.9,
      unemployment: 4,
      debtGdp: 100,
      fdi: 6e10,
      electricity: 100,
      internet: 96,
      lifeExp: 80.7,
      literacy: 99,
      rrs: 30,
      tagline: "Financial capital of Europe",
      paradox: null,
      tools: [],
      isRef: !0
    },
    JP: {
      name: "Japan",
      slug: "japan",
      flag: "🇯🇵",
      region: "ref",
      capital: "Tokyo",
      population: 124e6,
      popGrowth: -.5,
      gdp: 429e10,
      gdpPpp: 649e10,
      gdpPC: 34600,
      gdpPCppp: 52350,
      gdpGrowth: 1.9,
      gdpHist: {
        1990: 313e10,
        2e3: 489e10,
        2010: 576e10,
        2015: 439e10,
        2020: 504e10,
        2024: 429e10
      },
      currency: {
        code: "JPY",
        name: "Japanese Yen",
        sym: "¥"
      },
      resources: [],
      exports: [ {
        p: "Motor Vehicles",
        v: 12e10,
        s: 15
      } ],
      imports: [ {
        p: "Crude Petroleum",
        v: 7e10,
        s: 8
      } ],
      totalExports: 8e11,
      totalImports: 9e11,
      hdi: .92,
      hdiRank: 22,
      gini: 32.9,
      inflation: 3.2,
      unemployment: 2.6,
      debtGdp: 261.3,
      fdi: 12e9,
      electricity: 100,
      internet: 93,
      lifeExp: 84.8,
      literacy: 99,
      rrs: 10,
      tagline: "Tech innovator with minimal resources",
      paradox: null,
      tools: [],
      isRef: !0
    },
    KR: {
      name: "South Korea",
      slug: "south-korea",
      flag: "🇰🇷",
      region: "ref",
      capital: "Seoul",
      population: 517e5,
      popGrowth: 0,
      gdp: 171e10,
      gdpPpp: 292e10,
      gdpPC: 33080,
      gdpPCppp: 56470,
      gdpGrowth: 1.4,
      gdpHist: {
        1990: 279e9,
        2e3: 562e9,
        2010: 109e10,
        2015: 138e10,
        2020: 164e10,
        2024: 171e10
      },
      currency: {
        code: "KRW",
        name: "South Korean Won",
        sym: "₩"
      },
      resources: [],
      exports: [ {
        p: "Semiconductors",
        v: 12e10,
        s: 18
      } ],
      imports: [ {
        p: "Crude Petroleum",
        v: 6e10,
        s: 10
      } ],
      totalExports: 68e10,
      totalImports: 64e10,
      hdi: .929,
      hdiRank: 17,
      gini: 31.4,
      inflation: 3.6,
      unemployment: 2.7,
      debtGdp: 54.3,
      fdi: 18e9,
      electricity: 100,
      internet: 97,
      lifeExp: 83.7,
      literacy: 99,
      rrs: 10,
      tagline: "From war ruins to tech powerhouse",
      paradox: null,
      tools: [],
      isRef: !0
    },
    SG: {
      name: "Singapore",
      slug: "singapore",
      flag: "🇸🇬",
      region: "ref",
      capital: "Singapore",
      population: 59e5,
      popGrowth: .8,
      gdp: 497e9,
      gdpPpp: 69e10,
      gdpPC: 84250,
      gdpPCppp: 116930,
      gdpGrowth: 1.1,
      gdpHist: {
        1990: 368e8,
        2e3: 96e9,
        2010: 236e9,
        2015: 307e9,
        2020: 345e9,
        2024: 497e9
      },
      currency: {
        code: "SGD",
        name: "Singapore Dollar",
        sym: "S$"
      },
      resources: [],
      exports: [ {
        p: "Electronics",
        v: 15e10,
        s: 20
      } ],
      imports: [ {
        p: "Electronics",
        v: 12e10,
        s: 15
      } ],
      totalExports: 73e10,
      totalImports: 67e10,
      hdi: .939,
      hdiRank: 9,
      gini: 37.9,
      inflation: 4.8,
      unemployment: 2.1,
      debtGdp: 168,
      fdi: 141e9,
      electricity: 100,
      internet: 96,
      lifeExp: 83.9,
      literacy: 97,
      rrs: 5,
      tagline: "Tiny island, global financial hub",
      paradox: null,
      tools: [],
      isRef: !0
    },
    AE: {
      name: "UAE",
      slug: "uae",
      flag: "🇦🇪",
      region: "ref",
      capital: "Abu Dhabi",
      population: 94e5,
      popGrowth: .6,
      gdp: 509e9,
      gdpPpp: 82e10,
      gdpPC: 54150,
      gdpPCppp: 87230,
      gdpGrowth: 3.4,
      gdpHist: {
        1990: 507e8,
        2e3: 104e9,
        2010: 289e9,
        2015: 358e9,
        2020: 349e9,
        2024: 509e9
      },
      currency: {
        code: "AED",
        name: "UAE Dirham",
        sym: "د.إ"
      },
      resources: [ {
        type: "oil",
        rank: null,
        prod: "3.2M bpd",
        share: 0,
        global: 7,
        note: "Abu Dhabi reserves"
      } ],
      exports: [ {
        p: "Crude Petroleum",
        v: 7e10,
        s: 25
      } ],
      imports: [ {
        p: "Machinery",
        v: 3e10,
        s: 8
      } ],
      totalExports: 28e10,
      totalImports: 38e10,
      hdi: .911,
      hdiRank: 26,
      gini: 26,
      inflation: 2.3,
      unemployment: 2.9,
      debtGdp: 30,
      fdi: 23e9,
      electricity: 100,
      internet: 99,
      lifeExp: 78.7,
      literacy: 98,
      rrs: 60,
      tagline: "Oil wealth diversified into tourism and finance",
      paradox: null,
      tools: [],
      isRef: !0
    },
    CA: {
      name: "Canada",
      slug: "canada",
      flag: "🇨🇦",
      region: "ref",
      capital: "Ottawa",
      population: 405e5,
      popGrowth: 1.8,
      gdp: 214e10,
      gdpPpp: 238e10,
      gdpPC: 52880,
      gdpPCppp: 58770,
      gdpGrowth: 1.1,
      gdpHist: {
        1990: 593e9,
        2e3: 744e9,
        2010: 161e10,
        2015: 156e10,
        2020: 164e10,
        2024: 214e10
      },
      currency: {
        code: "CAD",
        name: "Canadian Dollar",
        sym: "C$"
      },
      resources: [ {
        type: "oil",
        rank: null,
        prod: "5.6M bpd",
        share: 0,
        global: 4,
        note: "Oil sands"
      } ],
      exports: [ {
        p: "Crude Petroleum",
        v: 1e11,
        s: 18
      } ],
      imports: [ {
        p: "Motor Vehicles",
        v: 4e10,
        s: 8
      } ],
      totalExports: 56e10,
      totalImports: 53e10,
      hdi: .935,
      hdiRank: 11,
      gini: 33.3,
      inflation: 3.9,
      unemployment: 5.4,
      debtGdp: 107.5,
      fdi: 4e10,
      electricity: 100,
      internet: 97,
      lifeExp: 82.7,
      literacy: 99,
      rrs: 80,
      tagline: "Resource-rich northern giant",
      paradox: null,
      tools: [],
      isRef: !0
    },
    MY: {
      name: "Malaysia",
      slug: "malaysia",
      flag: "🇲🇾",
      region: "ref",
      capital: "Kuala Lumpur",
      population: 343e5,
      popGrowth: 1.1,
      gdp: 399e9,
      gdpPpp: 117e10,
      gdpPC: 11630,
      gdpPCppp: 34100,
      gdpGrowth: 3.7,
      gdpHist: {
        1990: 44e9,
        2e3: 938e8,
        2010: 255e9,
        2015: 296e9,
        2020: 337e9,
        2024: 399e9
      },
      currency: {
        code: "MYR",
        name: "Malaysian Ringgit",
        sym: "RM"
      },
      resources: [ {
        type: "oil",
        rank: null,
        prod: "570K bpd",
        share: 0,
        global: 25,
        note: "Petronas"
      } ],
      exports: [ {
        p: "Electronics",
        v: 8e10,
        s: 20
      } ],
      imports: [ {
        p: "Electronics",
        v: 6e10,
        s: 15
      } ],
      totalExports: 34e10,
      totalImports: 3e11,
      hdi: .803,
      hdiRank: 63,
      gini: 41.2,
      inflation: 2.5,
      unemployment: 3.3,
      debtGdp: 65.6,
      fdi: 18e9,
      electricity: 100,
      internet: 96,
      lifeExp: 76.1,
      literacy: 95,
      rrs: 50,
      tagline: "Tiger economy that diversified from tin and rubber",
      paradox: null,
      tools: [],
      isRef: !0
    },
    TH: {
      name: "Thailand",
      slug: "thailand",
      flag: "🇹🇭",
      region: "ref",
      capital: "Bangkok",
      population: 72e6,
      popGrowth: .1,
      gdp: 515e9,
      gdpPpp: 156e10,
      gdpPC: 7150,
      gdpPCppp: 21670,
      gdpGrowth: 1.9,
      gdpHist: {
        1990: 856e8,
        2e3: 126e9,
        2010: 341e9,
        2015: 401e9,
        2020: 5e11,
        2024: 515e9
      },
      currency: {
        code: "THB",
        name: "Thai Baht",
        sym: "฿"
      },
      resources: [ {
        type: "farm",
        rank: null,
        prod: "Rice: 20M tonnes/yr",
        share: 0,
        global: 2,
        note: "World's 2nd-largest rice exporter"
      } ],
      exports: [ {
        p: "Electronics",
        v: 4e10,
        s: 12
      } ],
      imports: [ {
        p: "Crude Petroleum",
        v: 3e10,
        s: 8
      } ],
      totalExports: 3e11,
      totalImports: 29e10,
      hdi: .8,
      hdiRank: 66,
      gini: 34.9,
      inflation: 1.2,
      unemployment: 1,
      debtGdp: 61.7,
      fdi: 1e10,
      electricity: 100,
      internet: 85,
      lifeExp: 79.3,
      literacy: 94,
      rrs: 30,
      tagline: "Southeast Asian manufacturing hub",
      paradox: null,
      tools: [],
      isRef: !0
    },
    ID: {
      name: "Indonesia",
      slug: "indonesia",
      flag: "🇮🇩",
      region: "ref",
      capital: "Jakarta",
      population: 277e6,
      popGrowth: .8,
      gdp: 137e10,
      gdpPpp: 44e11,
      gdpPC: 4950,
      gdpPCppp: 15880,
      gdpGrowth: 5.1,
      gdpHist: {
        1990: 114e9,
        2e3: 165e9,
        2010: 755e9,
        2015: 861e9,
        2020: 106e10,
        2024: 137e10
      },
      currency: {
        code: "IDR",
        name: "Indonesian Rupiah",
        sym: "Rp"
      },
      resources: [ {
        type: "coal",
        rank: null,
        prod: "775M tonnes/yr",
        share: 0,
        global: 3,
        note: "Major coal exporter"
      } ],
      exports: [ {
        p: "Palm Oil",
        v: 25e9,
        s: 10
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 2e10,
        s: 5
      } ],
      totalExports: 26e10,
      totalImports: 24e10,
      hdi: .713,
      hdiRank: 112,
      gini: 37.9,
      inflation: 3.7,
      unemployment: 5.3,
      debtGdp: 39,
      fdi: 21e9,
      electricity: 97,
      internet: 66,
      lifeExp: 67.6,
      literacy: 96,
      rrs: 65,
      tagline: "World's largest archipelago and nickel superpower",
      paradox: null,
      tools: [],
      isRef: !0
    },
    MX: {
      name: "Mexico",
      slug: "mexico",
      flag: "🇲🇽",
      region: "ref",
      capital: "Mexico City",
      population: 13e7,
      popGrowth: .6,
      gdp: 179e10,
      gdpPpp: 305e10,
      gdpPC: 13770,
      gdpPCppp: 23470,
      gdpGrowth: 3.2,
      gdpHist: {
        1990: 263e9,
        2e3: 684e9,
        2010: 105e10,
        2015: 117e10,
        2020: 108e10,
        2024: 179e10
      },
      currency: {
        code: "MXN",
        name: "Mexican Peso",
        sym: "$"
      },
      resources: [ {
        type: "oil",
        rank: null,
        prod: "1.6M bpd",
        share: 0,
        global: 12,
        note: "Pemex, declining fields"
      } ],
      exports: [ {
        p: "Motor Vehicles",
        v: 8e10,
        s: 12
      } ],
      imports: [ {
        p: "Refined Petroleum",
        v: 3e10,
        s: 5
      } ],
      totalExports: 58e10,
      totalImports: 59e10,
      hdi: .781,
      hdiRank: 74,
      gini: 45.4,
      inflation: 4.7,
      unemployment: 2.8,
      debtGdp: 55.5,
      fdi: 36e9,
      electricity: 99,
      internet: 76,
      lifeExp: 75,
      literacy: 95,
      rrs: 50,
      tagline: "NAFTA manufacturing powerhouse",
      paradox: null,
      tools: [],
      isRef: !0
    },
    CL: {
      name: "Chile",
      slug: "chile",
      flag: "🇨🇱",
      region: "ref",
      capital: "Santiago",
      population: 195e5,
      popGrowth: .5,
      gdp: 335e9,
      gdpPpp: 588e9,
      gdpPC: 17180,
      gdpPCppp: 30150,
      gdpGrowth: 2,
      gdpHist: {
        1990: 331e8,
        2e3: 793e8,
        2010: 218e9,
        2015: 243e9,
        2020: 253e9,
        2024: 335e9
      },
      currency: {
        code: "CLP",
        name: "Chilean Peso",
        sym: "$"
      },
      resources: [ {
        type: "copper",
        rank: null,
        prod: "5.3M tonnes/yr",
        share: 0,
        global: 1,
        note: "World's largest copper producer — Escondida mine"
      } ],
      exports: [ {
        p: "Copper",
        v: 5e10,
        s: 50
      } ],
      imports: [ {
        p: "Crude Petroleum",
        v: 1e10,
        s: 8
      } ],
      totalExports: 1e11,
      totalImports: 95e9,
      hdi: .86,
      hdiRank: 42,
      gini: 44.9,
      inflation: 7.6,
      unemployment: 8.5,
      debtGdp: 38,
      fdi: 21e9,
      electricity: 100,
      internet: 90,
      lifeExp: 80.2,
      literacy: 97,
      rrs: 60,
      tagline: "Copper giant and Latin America's freest economy",
      paradox: null,
      tools: [],
      isRef: !0
    }
  };
  function t(e) {
    if (!e) {
      return null;
    }
    var o = e.toUpperCase();
    if (r[o]) {
      return r[o];
    }
    for (var a = e.toLowerCase(), t = Object.keys(r), n = 0; n < t.length; n++) {
      if (r[t[n]].slug === a) {
        return r[t[n]];
      }
    }
    return null;
  }
  function n() {
    return Object.values(r);
  }
  function p(e) {
    if (!e) {
      return null;
    }
    var o = e.toUpperCase();
    if (a[o]) {
      return a[o];
    }
    for (var r = e.toLowerCase(), t = Object.keys(a), n = 0; n < t.length; n++) {
      if (a[t[n]].slug === r) {
        return a[t[n]];
      }
    }
    return null;
  }
  function i(e, o) {
    for (var r = o.split("."), a = e, t = 0; t < r.length; t++) {
      if (null == a) {
        return null;
      }
      a = a[r[t]];
    }
    return a;
  }
  function l(e) {
    for (var o = Object.keys(r), a = 0; a < o.length; a++) {
      if (r[o[a]] === e) {
        return o[a];
      }
    }
    return null;
  }
  function s(e, o) {
    var r = t(e) || p(e), a = t(o) || p(o);
    if (!r || !a) {
      return null;
    }
    for (var n = [ "gdp", "gdpPC", "gdpPCppp", "population", "hdi", "gini", "inflation", "unemployment", "debtGdp", "electricity", "internet", "lifeExp", "literacy", "rrs", "totalExports", "totalImports" ], i = {}, l = 0; l < n.length; l++) {
      var s = n[l], d = r[s], c = a[s];
      "number" == typeof d && "number" == typeof c && 0 !== c && (i[s] = {
        a: d,
        b: c,
        ratio: +(d / c).toFixed(2)
      });
    }
    return {
      c1: r,
      c2: a,
      metrics: i
    };
  }
  return {
    getCountry: t,
    getAllCountries: n,
    getWorldRef: p,
    rankCountries: function(e, o) {
      var r = n().filter(function(o) {
        var r = i(o, e);
        return "number" == typeof r && !isNaN(r);
      });
      return r.sort(function(o, r) {
        return (i(r, e) || 0) - (i(o, e) || 0);
      }), o && o > 0 && (r = r.slice(0, o)), r.map(function(o, r) {
        return {
          rank: r + 1,
          code: l(o),
          country: o,
          value: i(o, e)
        };
      });
    },
    countriesByResource: function(e) {
      if (!e) {
        return [];
      }
      for (var o = e.toLowerCase(), a = [], t = Object.keys(r), n = 0; n < t.length; n++) {
        var p = r[t[n]];
        if (p.resources) {
          for (var i = 0; i < p.resources.length; i++) {
            if (p.resources[i].type === o) {
              a.push({
                code: t[n],
                country: p,
                resource: p.resources[i]
              });
              break;
            }
          }
        }
      }
      return a.sort(function(e, o) {
        return (null != e.resource.rank ? e.resource.rank : 999) - (null != o.resource.rank ? o.resource.rank : 999);
      }), a;
    },
    compareCountries: s,
    generateInsights: function(e, o) {
      var r = s(e, o);
      if (!r) {
        return [ "Unable to compare: one or both countries not found." ];
      }
      var a = r.c1, t = r.c2, n = r.metrics, p = [];
      if (n.gdp) {
        var i = n.gdp.a > n.gdp.b ? a.name : t.name, l = n.gdp.a > n.gdp.b ? n.gdp.ratio : +(n.gdp.b / n.gdp.a).toFixed(1);
        p.push(i + "'s economy is " + l + "x larger by nominal GDP.");
      }
      if (n.gdpPC) {
        var d = n.gdpPC.a > n.gdpPC.b ? a.name : t.name, c = n.gdpPC.a > n.gdpPC.b ? t.name : a.name, g = Math.abs(n.gdpPC.a - n.gdpPC.b);
        p.push(d + " earns $" + g.toLocaleString() + " more per capita than " + c + ".");
      }
      if (n.hdi) {
        var u = n.hdi.a > n.hdi.b ? a.name : t.name;
        p.push(u + " ranks higher on the Human Development Index (" + Math.max(n.hdi.a, n.hdi.b).toFixed(3) + " vs " + Math.min(n.hdi.a, n.hdi.b).toFixed(3) + ").");
      }
      if (n.population) {
        var m = (a.population / 1e6).toFixed(1), h = (t.population / 1e6).toFixed(1);
        p.push(a.name + " has " + m + "M people vs " + t.name + "'s " + h + "M.");
      }
      return n.electricity && p.push("Electricity access: " + a.name + " " + a.electricity + "% vs " + t.name + " " + t.electricity + "%."),
      n.lifeExp && p.push("Life expectancy: " + a.name + " " + a.lifeExp + " years vs " + t.name + " " + t.lifeExp + " years."),
      n.unemployment && p.push("Unemployment: " + a.name + " " + a.unemployment + "% vs " + t.name + " " + t.unemployment + "%."),
      p.slice(0, 7);
    },
    calculateResourceScore: function(e) {
      var o = t(e);
      if (!o || !o.resources || 0 === o.resources.length) {
        return 0;
      }
      for (var r = 30 * Math.min(o.resources.length / 5, 1), a = 0, n = 0, p = 0; p < o.resources.length; p++) {
        var i = o.resources[p];
        "number" == typeof i.share && (a += Math.min(i.share, 50)), "number" == typeof i.global && i.global > 0 && (n += Math.max(0, 20 - i.global));
      }
      return a = Math.min(a / o.resources.length * 1.5, 40), n = Math.min(n / o.resources.length * 2, 30),
      Math.round(Math.min(r + a + n, 100));
    },
    getParadoxes: function() {
      return n().filter(function(e) {
        return null != e.paradox;
      }).sort(function(e, o) {
        return (o.rrs || 0) - (e.rrs || 0);
      }).map(function(e) {
        return {
          name: e.name,
          flag: e.flag,
          rrs: e.rrs,
          paradox: e.paradox,
          tagline: e.tagline
        };
      });
    },
    getGdpTimeline: function(e) {
      var o = t(e) || p(e);
      return o && o.gdpHist ? o.gdpHist : null;
    },
    searchCountries: function(o) {
      if (!o) {
        return [];
      }
      var r = o.toLowerCase();
      return n().filter(function(o) {
        if (-1 !== o.name.toLowerCase().indexOf(r)) {
          return !0;
        }
        if (-1 !== o.slug.toLowerCase().indexOf(r)) {
          return !0;
        }
        if (-1 !== o.capital.toLowerCase().indexOf(r)) {
          return !0;
        }
        if (o.resources) {
          for (var a = 0; a < o.resources.length; a++) {
            var t = o.resources[a];
            if (-1 !== t.type.toLowerCase().indexOf(r)) {
              return !0;
            }
            if (t.note && -1 !== t.note.toLowerCase().indexOf(r)) {
              return !0;
            }
            var n = e[t.type];
            if (n && -1 !== n.label.toLowerCase().indexOf(r)) {
              return !0;
            }
          }
        }
        return !(!o.tagline || -1 === o.tagline.toLowerCase().indexOf(r));
      });
    },
    getAggregateStats: function() {
      for (var r = n(), a = 0, t = 0, p = 0, i = 0, l = 0, s = 0, d = 0; d < r.length; d++) {
        var c = r[d];
        "number" == typeof c.gdp && (a += c.gdp), "number" == typeof c.population && (t += c.population),
        "number" == typeof c.hdi && (p += c.hdi, i++), "number" == typeof c.totalExports && (l += c.totalExports),
        "number" == typeof c.totalImports && (s += c.totalImports);
      }
      return {
        totalCountries: r.length,
        totalGDP: a,
        totalPopulation: t,
        avgHDI: i > 0 ? +(p / i).toFixed(3) : 0,
        totalExports: l,
        totalImports: s,
        regions: Object.keys(o).length,
        resourceTypes: Object.keys(e).length
      };
    },
    getRegions: function() {
      return o;
    },
    getResourceTypes: function() {
      return e;
    },
    COUNTRIES: r,
    WORLD_REF: a,
    RESOURCE_TYPES: e,
    REGIONS: o
  };
}();
