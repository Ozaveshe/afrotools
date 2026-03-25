/**
 * farm-costs.js
 * AfroTools Agriculture Suite — Farm Cost Data for all 54 African countries
 *
 * Sets window.AfroTools.farmCosts keyed by ISO 3166-1 alpha-2 country code.
 *
 * Fields per country:
 *   currency                — ISO 4217 currency code
 *   currencySymbol          — display symbol
 *   labor                   — daily wage, man-days/ha for full season, family labor discount
 *   mechanization           — tractor ploughing cost/ha, availability category
 *   agrochemicals           — herbicide, pesticide, fungicide cost per ha
 *   landCost                — seasonal rental per ha, communal land flag
 *   transport               — cost per tonne per km farm-to-market, market fees as % of sale
 *   storage                 — post-harvest loss rates (%) by commodity group
 *   finance                 — prevailing interest rate, government scheme rate (null if N/A)
 *
 * Sources: regional FAO estimates, World Bank agricultural surveys, national
 * ministry data and AfroTools research (2024–2025). Values are representative
 * averages and should be treated as indicative, not definitive.
 */
!function () {
  "use strict";

  window.AfroTools = window.AfroTools || {};

  window.AfroTools.farmCosts = {

    // -------------------------------------------------------------------------
    // WEST AFRICA
    // -------------------------------------------------------------------------

    "NG": {
      currency: "NGN",
      currencySymbol: "₦",
      labor: {
        dailyWageRate: 3000,
        manDaysPerHa_simplified: 100,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 25000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 8000,
        pesticide_perHa: 5000,
        fungicide_perHa: 4000
      },
      landCost: {
        rental_perHa_perSeason: 25000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 100,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 20,
          roots_tubers: 30,
          fruits_vegetables: 40,
          pulses: 15
        }
      },
      finance: {
        averageInterestRate_percent: 15,
        govSchemeRate_percent: 9
      }
    },

    "GH": {
      currency: "GHS",
      currencySymbol: "GH₵",
      labor: {
        dailyWageRate: 40,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 350,
        availability: "moderate"
      },
      agrochemicals: {
        herbicide_perHa: 150,
        pesticide_perHa: 100,
        fungicide_perHa: 80
      },
      landCost: {
        rental_perHa_perSeason: 350,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 3,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 18,
          roots_tubers: 30,
          fruits_vegetables: 40,
          pulses: 14
        }
      },
      finance: {
        averageInterestRate_percent: 28,
        govSchemeRate_percent: 10
      }
    },

    "CI": {
      currency: "XOF",
      currencySymbol: "CFA",
      labor: {
        dailyWageRate: 2000,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 35000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 5000,
        pesticide_perHa: 3500,
        fungicide_perHa: 2500
      },
      landCost: {
        rental_perHa_perSeason: 30000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 5,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 20,
          roots_tubers: 30,
          fruits_vegetables: 40,
          pulses: 15
        }
      },
      finance: {
        averageInterestRate_percent: 15,
        govSchemeRate_percent: 8
      }
    },

    "SN": {
      currency: "XOF",
      currencySymbol: "CFA",
      labor: {
        dailyWageRate: 2500,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 35000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 5000,
        pesticide_perHa: 3500,
        fungicide_perHa: 2500
      },
      landCost: {
        rental_perHa_perSeason: 25000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 4,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 18,
          roots_tubers: 28,
          fruits_vegetables: 38,
          pulses: 13
        }
      },
      finance: {
        averageInterestRate_percent: 14,
        govSchemeRate_percent: 7
      }
    },

    "ML": {
      currency: "XOF",
      currencySymbol: "CFA",
      labor: {
        dailyWageRate: 1800,
        manDaysPerHa_simplified: 100,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 30000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 4000,
        pesticide_perHa: 3000,
        fungicide_perHa: 2000
      },
      landCost: {
        rental_perHa_perSeason: 20000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 5,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 22,
          roots_tubers: 30,
          fruits_vegetables: 40,
          pulses: 15
        }
      },
      finance: {
        averageInterestRate_percent: 16,
        govSchemeRate_percent: 8
      }
    },

    "BF": {
      currency: "XOF",
      currencySymbol: "CFA",
      labor: {
        dailyWageRate: 1800,
        manDaysPerHa_simplified: 100,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 30000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 4000,
        pesticide_perHa: 3000,
        fungicide_perHa: 2000
      },
      landCost: {
        rental_perHa_perSeason: 20000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 5,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 22,
          roots_tubers: 30,
          fruits_vegetables: 40,
          pulses: 15
        }
      },
      finance: {
        averageInterestRate_percent: 15,
        govSchemeRate_percent: 8
      }
    },

    "NE": {
      currency: "XOF",
      currencySymbol: "CFA",
      labor: {
        dailyWageRate: 1500,
        manDaysPerHa_simplified: 105,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 28000,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 3500,
        pesticide_perHa: 2500,
        fungicide_perHa: 2000
      },
      landCost: {
        rental_perHa_perSeason: 15000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 6,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 25,
          roots_tubers: 30,
          fruits_vegetables: 42,
          pulses: 18
        }
      },
      finance: {
        averageInterestRate_percent: 17,
        govSchemeRate_percent: 9
      }
    },

    "GN": {
      currency: "GNF",
      currencySymbol: "FG",
      labor: {
        dailyWageRate: 15000,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 100000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 40000,
        pesticide_perHa: 30000,
        fungicide_perHa: 25000
      },
      landCost: {
        rental_perHa_perSeason: 200000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 500,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 20,
          roots_tubers: 30,
          fruits_vegetables: 40,
          pulses: 15
        }
      },
      finance: {
        averageInterestRate_percent: 20,
        govSchemeRate_percent: null
      }
    },

    "BJ": {
      currency: "XOF",
      currencySymbol: "CFA",
      labor: {
        dailyWageRate: 2000,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 32000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 4500,
        pesticide_perHa: 3200,
        fungicide_perHa: 2500
      },
      landCost: {
        rental_perHa_perSeason: 22000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 4,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 20,
          roots_tubers: 28,
          fruits_vegetables: 38,
          pulses: 14
        }
      },
      finance: {
        averageInterestRate_percent: 15,
        govSchemeRate_percent: 8
      }
    },

    "TG": {
      currency: "XOF",
      currencySymbol: "CFA",
      labor: {
        dailyWageRate: 2000,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 32000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 4500,
        pesticide_perHa: 3200,
        fungicide_perHa: 2500
      },
      landCost: {
        rental_perHa_perSeason: 22000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 4,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 20,
          roots_tubers: 28,
          fruits_vegetables: 38,
          pulses: 14
        }
      },
      finance: {
        averageInterestRate_percent: 16,
        govSchemeRate_percent: 8
      }
    },

    "SL": {
      currency: "SLL",
      currencySymbol: "Le",
      labor: {
        dailyWageRate: 25000,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 200000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 80000,
        pesticide_perHa: 60000,
        fungicide_perHa: 45000
      },
      landCost: {
        rental_perHa_perSeason: 300000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 1000,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 22,
          roots_tubers: 32,
          fruits_vegetables: 42,
          pulses: 16
        }
      },
      finance: {
        averageInterestRate_percent: 20,
        govSchemeRate_percent: null
      }
    },

    "LR": {
      currency: "LRD",
      currencySymbol: "L$",
      labor: {
        dailyWageRate: 500,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 4000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 1500,
        pesticide_perHa: 1200,
        fungicide_perHa: 900
      },
      landCost: {
        rental_perHa_perSeason: 8000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 20,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 22,
          roots_tubers: 32,
          fruits_vegetables: 42,
          pulses: 16
        }
      },
      finance: {
        averageInterestRate_percent: 18,
        govSchemeRate_percent: null
      }
    },

    "MR": {
      currency: "MRU",
      currencySymbol: "UM",
      labor: {
        dailyWageRate: 300,
        manDaysPerHa_simplified: 80,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 2500,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 800,
        pesticide_perHa: 600,
        fungicide_perHa: 400
      },
      landCost: {
        rental_perHa_perSeason: 3000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 10,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 20,
          roots_tubers: 28,
          fruits_vegetables: 38,
          pulses: 15
        }
      },
      finance: {
        averageInterestRate_percent: 18,
        govSchemeRate_percent: null
      }
    },

    "GM": {
      currency: "GMD",
      currencySymbol: "D",
      labor: {
        dailyWageRate: 200,
        manDaysPerHa_simplified: 85,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 1500,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 600,
        pesticide_perHa: 450,
        fungicide_perHa: 300
      },
      landCost: {
        rental_perHa_perSeason: 5000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 8,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 20,
          roots_tubers: 28,
          fruits_vegetables: 38,
          pulses: 14
        }
      },
      finance: {
        averageInterestRate_percent: 18,
        govSchemeRate_percent: null
      }
    },

    "GW": {
      currency: "XOF",
      currencySymbol: "CFA",
      labor: {
        dailyWageRate: 2000,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 30000,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 4000,
        pesticide_perHa: 3000,
        fungicide_perHa: 2000
      },
      landCost: {
        rental_perHa_perSeason: 20000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 5,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 22,
          roots_tubers: 30,
          fruits_vegetables: 40,
          pulses: 16
        }
      },
      finance: {
        averageInterestRate_percent: 20,
        govSchemeRate_percent: null
      }
    },

    "CV": {
      currency: "CVE",
      currencySymbol: "Esc",
      labor: {
        dailyWageRate: 900,
        manDaysPerHa_simplified: 80,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 7000,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 2800,
        pesticide_perHa: 2000,
        fungicide_perHa: 1500
      },
      landCost: {
        rental_perHa_perSeason: 12000,
        communalLand: false
      },
      transport: {
        farmToMarket_perTonne_perKm: 30,
        marketFees_percentOfSale: 4
      },
      storage: {
        postHarvestLossRate: {
          cereals: 12,
          roots_tubers: 20,
          fruits_vegetables: 30,
          pulses: 10
        }
      },
      finance: {
        averageInterestRate_percent: 12,
        govSchemeRate_percent: null
      }
    },

    // -------------------------------------------------------------------------
    // EAST AFRICA
    // -------------------------------------------------------------------------

    "KE": {
      currency: "KES",
      currencySymbol: "KSh",
      labor: {
        dailyWageRate: 500,
        manDaysPerHa_simplified: 85,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 5000,
        availability: "moderate"
      },
      agrochemicals: {
        herbicide_perHa: 3000,
        pesticide_perHa: 2500,
        fungicide_perHa: 2000
      },
      landCost: {
        rental_perHa_perSeason: 10000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 15,
        marketFees_percentOfSale: 4
      },
      storage: {
        postHarvestLossRate: {
          cereals: 15,
          roots_tubers: 25,
          fruits_vegetables: 35,
          pulses: 12
        }
      },
      finance: {
        averageInterestRate_percent: 13,
        govSchemeRate_percent: 8
      }
    },

    "ET": {
      currency: "ETB",
      currencySymbol: "Br",
      labor: {
        dailyWageRate: 200,
        manDaysPerHa_simplified: 120,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 3000,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 800,
        pesticide_perHa: 600,
        fungicide_perHa: 500
      },
      landCost: {
        rental_perHa_perSeason: 3000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 8,
        marketFees_percentOfSale: 2
      },
      storage: {
        postHarvestLossRate: {
          cereals: 20,
          roots_tubers: 25,
          fruits_vegetables: 35,
          pulses: 15
        }
      },
      finance: {
        averageInterestRate_percent: 14,
        govSchemeRate_percent: 10
      }
    },

    "TZ": {
      currency: "TZS",
      currencySymbol: "TSh",
      labor: {
        dailyWageRate: 8000,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 60000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 20000,
        pesticide_perHa: 15000,
        fungicide_perHa: 12000
      },
      landCost: {
        rental_perHa_perSeason: 80000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 50,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 18,
          roots_tubers: 28,
          fruits_vegetables: 38,
          pulses: 13
        }
      },
      finance: {
        averageInterestRate_percent: 16,
        govSchemeRate_percent: 9
      }
    },

    "UG": {
      currency: "UGX",
      currencySymbol: "USh",
      labor: {
        dailyWageRate: 15000,
        manDaysPerHa_simplified: 85,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 120000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 40000,
        pesticide_perHa: 30000,
        fungicide_perHa: 20000
      },
      landCost: {
        rental_perHa_perSeason: 150000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 100,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 17,
          roots_tubers: 26,
          fruits_vegetables: 36,
          pulses: 12
        }
      },
      finance: {
        averageInterestRate_percent: 18,
        govSchemeRate_percent: 10
      }
    },

    "RW": {
      currency: "RWF",
      currencySymbol: "RF",
      labor: {
        dailyWageRate: 2000,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 15000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 5000,
        pesticide_perHa: 4000,
        fungicide_perHa: 3000
      },
      landCost: {
        rental_perHa_perSeason: 25000,
        communalLand: false
      },
      transport: {
        farmToMarket_perTonne_perKm: 80,
        marketFees_percentOfSale: 4
      },
      storage: {
        postHarvestLossRate: {
          cereals: 15,
          roots_tubers: 24,
          fruits_vegetables: 35,
          pulses: 12
        }
      },
      finance: {
        averageInterestRate_percent: 16,
        govSchemeRate_percent: 8
      }
    },

    "BI": {
      currency: "BIF",
      currencySymbol: "FBu",
      labor: {
        dailyWageRate: 2500,
        manDaysPerHa_simplified: 100,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 20000,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 6000,
        pesticide_perHa: 4500,
        fungicide_perHa: 3500
      },
      landCost: {
        rental_perHa_perSeason: 30000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 100,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 20,
          roots_tubers: 28,
          fruits_vegetables: 38,
          pulses: 15
        }
      },
      finance: {
        averageInterestRate_percent: 18,
        govSchemeRate_percent: null
      }
    },

    "SO": {
      currency: "SOS",
      currencySymbol: "Sh.So.",
      labor: {
        dailyWageRate: 15000,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 100000,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 30000,
        pesticide_perHa: 25000,
        fungicide_perHa: 0
      },
      landCost: {
        rental_perHa_perSeason: 80000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 500,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 25,
          roots_tubers: 30,
          fruits_vegetables: 42,
          pulses: 18
        }
      },
      finance: {
        averageInterestRate_percent: 25,
        govSchemeRate_percent: null
      }
    },

    "DJ": {
      currency: "DJF",
      currencySymbol: "Fdj",
      labor: {
        dailyWageRate: 3000,
        manDaysPerHa_simplified: 60,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 25000,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 8000,
        pesticide_perHa: 6000,
        fungicide_perHa: 4000
      },
      landCost: {
        rental_perHa_perSeason: 50000,
        communalLand: false
      },
      transport: {
        farmToMarket_perTonne_perKm: 100,
        marketFees_percentOfSale: 4
      },
      storage: {
        postHarvestLossRate: {
          cereals: 15,
          roots_tubers: 22,
          fruits_vegetables: 32,
          pulses: 12
        }
      },
      finance: {
        averageInterestRate_percent: 18,
        govSchemeRate_percent: null
      }
    },

    "ER": {
      currency: "ERN",
      currencySymbol: "Nkf",
      labor: {
        dailyWageRate: 150,
        manDaysPerHa_simplified: 100,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 1200,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 400,
        pesticide_perHa: 300,
        fungicide_perHa: 200
      },
      landCost: {
        rental_perHa_perSeason: 2000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 6,
        marketFees_percentOfSale: 2
      },
      storage: {
        postHarvestLossRate: {
          cereals: 18,
          roots_tubers: 25,
          fruits_vegetables: 35,
          pulses: 14
        }
      },
      finance: {
        averageInterestRate_percent: 14,
        govSchemeRate_percent: null
      }
    },

    "SS": {
      currency: "SSP",
      currencySymbol: "£",
      labor: {
        dailyWageRate: 3000,
        manDaysPerHa_simplified: 100,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 25000,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 8000,
        pesticide_perHa: 6000,
        fungicide_perHa: 4000
      },
      landCost: {
        rental_perHa_perSeason: 20000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 150,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 25,
          roots_tubers: 32,
          fruits_vegetables: 42,
          pulses: 18
        }
      },
      finance: {
        averageInterestRate_percent: 25,
        govSchemeRate_percent: null
      }
    },

    // -------------------------------------------------------------------------
    // CENTRAL AFRICA
    // -------------------------------------------------------------------------

    "CD": {
      currency: "CDF",
      currencySymbol: "FC",
      labor: {
        dailyWageRate: 5000,
        manDaysPerHa_simplified: 100,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 40000,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 12000,
        pesticide_perHa: 9000,
        fungicide_perHa: 7000
      },
      landCost: {
        rental_perHa_perSeason: 30000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 200,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 22,
          roots_tubers: 32,
          fruits_vegetables: 42,
          pulses: 16
        }
      },
      finance: {
        averageInterestRate_percent: 20,
        govSchemeRate_percent: null
      }
    },

    "CM": {
      currency: "XAF",
      currencySymbol: "FCFA",
      labor: {
        dailyWageRate: 2500,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 40000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 6000,
        pesticide_perHa: 4500,
        fungicide_perHa: 3500
      },
      landCost: {
        rental_perHa_perSeason: 30000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 6,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 20,
          roots_tubers: 30,
          fruits_vegetables: 40,
          pulses: 15
        }
      },
      finance: {
        averageInterestRate_percent: 15,
        govSchemeRate_percent: 8
      }
    },

    "CG": {
      currency: "XAF",
      currencySymbol: "FCFA",
      labor: {
        dailyWageRate: 3000,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 45000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 7000,
        pesticide_perHa: 5000,
        fungicide_perHa: 3500
      },
      landCost: {
        rental_perHa_perSeason: 35000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 8,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 22,
          roots_tubers: 30,
          fruits_vegetables: 40,
          pulses: 16
        }
      },
      finance: {
        averageInterestRate_percent: 18,
        govSchemeRate_percent: null
      }
    },

    "GA": {
      currency: "XAF",
      currencySymbol: "FCFA",
      labor: {
        dailyWageRate: 5000,
        manDaysPerHa_simplified: 80,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 50000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 8000,
        pesticide_perHa: 6000,
        fungicide_perHa: 4000
      },
      landCost: {
        rental_perHa_perSeason: 50000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 8,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 18,
          roots_tubers: 28,
          fruits_vegetables: 38,
          pulses: 14
        }
      },
      finance: {
        averageInterestRate_percent: 14,
        govSchemeRate_percent: null
      }
    },

    "GQ": {
      currency: "XAF",
      currencySymbol: "FCFA",
      labor: {
        dailyWageRate: 4000,
        manDaysPerHa_simplified: 80,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 45000,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 7000,
        pesticide_perHa: 5000,
        fungicide_perHa: 3500
      },
      landCost: {
        rental_perHa_perSeason: 40000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 10,
        marketFees_percentOfSale: 4
      },
      storage: {
        postHarvestLossRate: {
          cereals: 20,
          roots_tubers: 28,
          fruits_vegetables: 38,
          pulses: 15
        }
      },
      finance: {
        averageInterestRate_percent: 18,
        govSchemeRate_percent: null
      }
    },

    "CF": {
      currency: "XAF",
      currencySymbol: "FCFA",
      labor: {
        dailyWageRate: 2000,
        manDaysPerHa_simplified: 100,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 35000,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 5000,
        pesticide_perHa: 4000,
        fungicide_perHa: 3000
      },
      landCost: {
        rental_perHa_perSeason: 20000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 8,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 25,
          roots_tubers: 32,
          fruits_vegetables: 42,
          pulses: 18
        }
      },
      finance: {
        averageInterestRate_percent: 20,
        govSchemeRate_percent: null
      }
    },

    "TD": {
      currency: "XAF",
      currencySymbol: "FCFA",
      labor: {
        dailyWageRate: 1800,
        manDaysPerHa_simplified: 105,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 30000,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 4500,
        pesticide_perHa: 3500,
        fungicide_perHa: 2500
      },
      landCost: {
        rental_perHa_perSeason: 15000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 7,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 25,
          roots_tubers: 32,
          fruits_vegetables: 42,
          pulses: 18
        }
      },
      finance: {
        averageInterestRate_percent: 18,
        govSchemeRate_percent: null
      }
    },

    "ST": {
      currency: "STN",
      currencySymbol: "Db",
      labor: {
        dailyWageRate: 600,
        manDaysPerHa_simplified: 80,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 4500,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 1500,
        pesticide_perHa: 1200,
        fungicide_perHa: 900
      },
      landCost: {
        rental_perHa_perSeason: 8000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 25,
        marketFees_percentOfSale: 4
      },
      storage: {
        postHarvestLossRate: {
          cereals: 18,
          roots_tubers: 28,
          fruits_vegetables: 38,
          pulses: 14
        }
      },
      finance: {
        averageInterestRate_percent: 20,
        govSchemeRate_percent: null
      }
    },

    // -------------------------------------------------------------------------
    // SOUTHERN AFRICA
    // -------------------------------------------------------------------------

    "ZA": {
      currency: "ZAR",
      currencySymbol: "R",
      labor: {
        dailyWageRate: 250,
        manDaysPerHa_simplified: 30,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 1500,
        availability: "widely_available"
      },
      agrochemicals: {
        herbicide_perHa: 800,
        pesticide_perHa: 600,
        fungicide_perHa: 500
      },
      landCost: {
        rental_perHa_perSeason: 3000,
        communalLand: false
      },
      transport: {
        farmToMarket_perTonne_perKm: 2,
        marketFees_percentOfSale: 5
      },
      storage: {
        postHarvestLossRate: {
          cereals: 5,
          roots_tubers: 15,
          fruits_vegetables: 20,
          pulses: 5
        }
      },
      finance: {
        averageInterestRate_percent: 11,
        govSchemeRate_percent: null
      }
    },

    "MZ": {
      currency: "MZN",
      currencySymbol: "MT",
      labor: {
        dailyWageRate: 200,
        manDaysPerHa_simplified: 95,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 1500,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 500,
        pesticide_perHa: 400,
        fungicide_perHa: 300
      },
      landCost: {
        rental_perHa_perSeason: 3000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 8,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 18,
          roots_tubers: 28,
          fruits_vegetables: 38,
          pulses: 14
        }
      },
      finance: {
        averageInterestRate_percent: 22,
        govSchemeRate_percent: null
      }
    },

    "ZM": {
      currency: "ZMW",
      currencySymbol: "K",
      labor: {
        dailyWageRate: 150,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 1200,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 400,
        pesticide_perHa: 300,
        fungicide_perHa: 250
      },
      landCost: {
        rental_perHa_perSeason: 3000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 6,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 15,
          roots_tubers: 25,
          fruits_vegetables: 35,
          pulses: 12
        }
      },
      finance: {
        averageInterestRate_percent: 20,
        govSchemeRate_percent: 9
      }
    },

    "ZW": {
      currency: "USD",
      currencySymbol: "$",
      labor: {
        dailyWageRate: 10,
        manDaysPerHa_simplified: 80,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 80,
        availability: "moderate"
      },
      agrochemicals: {
        herbicide_perHa: 30,
        pesticide_perHa: 25,
        fungicide_perHa: 20
      },
      landCost: {
        rental_perHa_perSeason: 150,
        communalLand: false
      },
      transport: {
        farmToMarket_perTonne_perKm: 0.5,
        marketFees_percentOfSale: 4
      },
      storage: {
        postHarvestLossRate: {
          cereals: 12,
          roots_tubers: 22,
          fruits_vegetables: 32,
          pulses: 10
        }
      },
      finance: {
        averageInterestRate_percent: 15,
        govSchemeRate_percent: null
      }
    },

    "MW": {
      currency: "MWK",
      currencySymbol: "MK",
      labor: {
        dailyWageRate: 2500,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 20000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 6000,
        pesticide_perHa: 4500,
        fungicide_perHa: 3500
      },
      landCost: {
        rental_perHa_perSeason: 25000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 80,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 15,
          roots_tubers: 25,
          fruits_vegetables: 35,
          pulses: 12
        }
      },
      finance: {
        averageInterestRate_percent: 20,
        govSchemeRate_percent: 8
      }
    },

    "AO": {
      currency: "AOA",
      currencySymbol: "Kz",
      labor: {
        dailyWageRate: 1500,
        manDaysPerHa_simplified: 95,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 12000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 4000,
        pesticide_perHa: 3000,
        fungicide_perHa: 2500
      },
      landCost: {
        rental_perHa_perSeason: 20000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 50,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 22,
          roots_tubers: 30,
          fruits_vegetables: 40,
          pulses: 16
        }
      },
      finance: {
        averageInterestRate_percent: 18,
        govSchemeRate_percent: null
      }
    },

    "NA": {
      currency: "NAD",
      currencySymbol: "N$",
      labor: {
        dailyWageRate: 200,
        manDaysPerHa_simplified: 60,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 1500,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 500,
        pesticide_perHa: 400,
        fungicide_perHa: 300
      },
      landCost: {
        rental_perHa_perSeason: 5000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 4,
        marketFees_percentOfSale: 4
      },
      storage: {
        postHarvestLossRate: {
          cereals: 10,
          roots_tubers: 20,
          fruits_vegetables: 30,
          pulses: 8
        }
      },
      finance: {
        averageInterestRate_percent: 13,
        govSchemeRate_percent: null
      }
    },

    "BW": {
      currency: "BWP",
      currencySymbol: "P",
      labor: {
        dailyWageRate: 150,
        manDaysPerHa_simplified: 65,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 1200,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 400,
        pesticide_perHa: 300,
        fungicide_perHa: 250
      },
      landCost: {
        rental_perHa_perSeason: 3000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 4,
        marketFees_percentOfSale: 4
      },
      storage: {
        postHarvestLossRate: {
          cereals: 12,
          roots_tubers: 22,
          fruits_vegetables: 32,
          pulses: 10
        }
      },
      finance: {
        averageInterestRate_percent: 12,
        govSchemeRate_percent: null
      }
    },

    "LS": {
      currency: "LSL",
      currencySymbol: "M",
      labor: {
        dailyWageRate: 150,
        manDaysPerHa_simplified: 80,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 1200,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 400,
        pesticide_perHa: 300,
        fungicide_perHa: 250
      },
      landCost: {
        rental_perHa_perSeason: 2000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 5,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 15,
          roots_tubers: 25,
          fruits_vegetables: 35,
          pulses: 12
        }
      },
      finance: {
        averageInterestRate_percent: 14,
        govSchemeRate_percent: null
      }
    },

    "SZ": {
      currency: "SZL",
      currencySymbol: "E",
      labor: {
        dailyWageRate: 200,
        manDaysPerHa_simplified: 75,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 1500,
        availability: "moderate"
      },
      agrochemicals: {
        herbicide_perHa: 500,
        pesticide_perHa: 400,
        fungicide_perHa: 300
      },
      landCost: {
        rental_perHa_perSeason: 4000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 3,
        marketFees_percentOfSale: 4
      },
      storage: {
        postHarvestLossRate: {
          cereals: 12,
          roots_tubers: 22,
          fruits_vegetables: 32,
          pulses: 10
        }
      },
      finance: {
        averageInterestRate_percent: 12,
        govSchemeRate_percent: null
      }
    },

    // -------------------------------------------------------------------------
    // NORTH AFRICA
    // -------------------------------------------------------------------------

    "EG": {
      currency: "EGP",
      currencySymbol: "E£",
      labor: {
        dailyWageRate: 200,
        manDaysPerHa_simplified: 80,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 1500,
        availability: "widely_available"
      },
      agrochemicals: {
        herbicide_perHa: 600,
        pesticide_perHa: 500,
        fungicide_perHa: 400
      },
      landCost: {
        rental_perHa_perSeason: 20000,
        communalLand: false
      },
      transport: {
        farmToMarket_perTonne_perKm: 5,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 10,
          roots_tubers: 18,
          fruits_vegetables: 25,
          pulses: 8
        }
      },
      finance: {
        averageInterestRate_percent: 20,
        govSchemeRate_percent: 5
      }
    },

    "MA": {
      currency: "MAD",
      currencySymbol: "DH",
      labor: {
        dailyWageRate: 150,
        manDaysPerHa_simplified: 75,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 1200,
        availability: "moderate"
      },
      agrochemicals: {
        herbicide_perHa: 400,
        pesticide_perHa: 300,
        fungicide_perHa: 250
      },
      landCost: {
        rental_perHa_perSeason: 5000,
        communalLand: false
      },
      transport: {
        farmToMarket_perTonne_perKm: 4,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 10,
          roots_tubers: 18,
          fruits_vegetables: 28,
          pulses: 8
        }
      },
      finance: {
        averageInterestRate_percent: 12,
        govSchemeRate_percent: 4
      }
    },

    "DZ": {
      currency: "DZD",
      currencySymbol: "DA",
      labor: {
        dailyWageRate: 1200,
        manDaysPerHa_simplified: 70,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 10000,
        availability: "moderate"
      },
      agrochemicals: {
        herbicide_perHa: 3000,
        pesticide_perHa: 2500,
        fungicide_perHa: 2000
      },
      landCost: {
        rental_perHa_perSeason: 40000,
        communalLand: false
      },
      transport: {
        farmToMarket_perTonne_perKm: 30,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 10,
          roots_tubers: 18,
          fruits_vegetables: 28,
          pulses: 8
        }
      },
      finance: {
        averageInterestRate_percent: 8,
        govSchemeRate_percent: 4
      }
    },

    "TN": {
      currency: "TND",
      currencySymbol: "DT",
      labor: {
        dailyWageRate: 35,
        manDaysPerHa_simplified: 70,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 280,
        availability: "moderate"
      },
      agrochemicals: {
        herbicide_perHa: 90,
        pesticide_perHa: 70,
        fungicide_perHa: 55
      },
      landCost: {
        rental_perHa_perSeason: 800,
        communalLand: false
      },
      transport: {
        farmToMarket_perTonne_perKm: 4,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 8,
          roots_tubers: 16,
          fruits_vegetables: 25,
          pulses: 7
        }
      },
      finance: {
        averageInterestRate_percent: 8,
        govSchemeRate_percent: 4
      }
    },

    "LY": {
      currency: "LYD",
      currencySymbol: "LD",
      labor: {
        dailyWageRate: 30,
        manDaysPerHa_simplified: 65,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 250,
        availability: "moderate"
      },
      agrochemicals: {
        herbicide_perHa: 80,
        pesticide_perHa: 60,
        fungicide_perHa: 45
      },
      landCost: {
        rental_perHa_perSeason: 500,
        communalLand: false
      },
      transport: {
        farmToMarket_perTonne_perKm: 3,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 10,
          roots_tubers: 18,
          fruits_vegetables: 28,
          pulses: 8
        }
      },
      finance: {
        averageInterestRate_percent: 10,
        govSchemeRate_percent: null
      }
    },

    "SD": {
      currency: "SDG",
      currencySymbol: "LS",
      labor: {
        dailyWageRate: 3000,
        manDaysPerHa_simplified: 90,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 25000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 8000,
        pesticide_perHa: 6000,
        fungicide_perHa: 4000
      },
      landCost: {
        rental_perHa_perSeason: 20000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 100,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 20,
          roots_tubers: 28,
          fruits_vegetables: 38,
          pulses: 15
        }
      },
      finance: {
        averageInterestRate_percent: 18,
        govSchemeRate_percent: null
      }
    },

    // -------------------------------------------------------------------------
    // INDIAN OCEAN ISLANDS
    // -------------------------------------------------------------------------

    "MG": {
      currency: "MGA",
      currencySymbol: "Ar",
      labor: {
        dailyWageRate: 5000,
        manDaysPerHa_simplified: 95,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 40000,
        availability: "limited"
      },
      agrochemicals: {
        herbicide_perHa: 12000,
        pesticide_perHa: 10000,
        fungicide_perHa: 8000
      },
      landCost: {
        rental_perHa_perSeason: 80000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 200,
        marketFees_percentOfSale: 3
      },
      storage: {
        postHarvestLossRate: {
          cereals: 20,
          roots_tubers: 28,
          fruits_vegetables: 38,
          pulses: 15
        }
      },
      finance: {
        averageInterestRate_percent: 22,
        govSchemeRate_percent: null
      }
    },

    "MU": {
      currency: "MUR",
      currencySymbol: "Rs",
      labor: {
        dailyWageRate: 800,
        manDaysPerHa_simplified: 60,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 6000,
        availability: "moderate"
      },
      agrochemicals: {
        herbicide_perHa: 2000,
        pesticide_perHa: 1500,
        fungicide_perHa: 1200
      },
      landCost: {
        rental_perHa_perSeason: 20000,
        communalLand: false
      },
      transport: {
        farmToMarket_perTonne_perKm: 15,
        marketFees_percentOfSale: 4
      },
      storage: {
        postHarvestLossRate: {
          cereals: 8,
          roots_tubers: 15,
          fruits_vegetables: 22,
          pulses: 7
        }
      },
      finance: {
        averageInterestRate_percent: 6,
        govSchemeRate_percent: null
      }
    },

    "SC": {
      currency: "SCR",
      currencySymbol: "SR",
      labor: {
        dailyWageRate: 400,
        manDaysPerHa_simplified: 55,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 3000,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 1200,
        pesticide_perHa: 900,
        fungicide_perHa: 700
      },
      landCost: {
        rental_perHa_perSeason: 15000,
        communalLand: false
      },
      transport: {
        farmToMarket_perTonne_perKm: 20,
        marketFees_percentOfSale: 5
      },
      storage: {
        postHarvestLossRate: {
          cereals: 8,
          roots_tubers: 15,
          fruits_vegetables: 22,
          pulses: 7
        }
      },
      finance: {
        averageInterestRate_percent: 8,
        govSchemeRate_percent: null
      }
    },

    "KM": {
      currency: "KMF",
      currencySymbol: "CF",
      labor: {
        dailyWageRate: 1500,
        manDaysPerHa_simplified: 80,
        familyLaborDiscount: 0.5
      },
      mechanization: {
        tractorPloughing_perHa: 12000,
        availability: "rare"
      },
      agrochemicals: {
        herbicide_perHa: 4000,
        pesticide_perHa: 3000,
        fungicide_perHa: 2500
      },
      landCost: {
        rental_perHa_perSeason: 30000,
        communalLand: true
      },
      transport: {
        farmToMarket_perTonne_perKm: 80,
        marketFees_percentOfSale: 4
      },
      storage: {
        postHarvestLossRate: {
          cereals: 20,
          roots_tubers: 28,
          fruits_vegetables: 38,
          pulses: 15
        }
      },
      finance: {
        averageInterestRate_percent: 18,
        govSchemeRate_percent: null
      }
    }

  };

}();
