/**
 * crop-insurance-data.js
 * AfroTools Crop Insurance Premium Calculator — Country Data
 * Covers 15 African countries: NG, KE, ZA, GH, EG, ET, TZ, UG, RW, CI, CM, SN, MA, TN, AO
 */
!function () {
  'use strict';
  window.AfroTools = window.AfroTools || {};

  window.AfroTools.cropInsuranceData = {

    // ── INSURANCE TYPE DESCRIPTIONS ──────────────────────────────────────
    insuranceTypes: {
      multi_peril: {
        name: 'Multi-Peril Crop Insurance (MPCI)',
        short: 'MPCI',
        desc: 'Traditional indemnity-based. Insures against multiple risks — drought, flood, hail, pest, disease. Pays based on actual farm-level loss assessment.',
        pros: 'Covers actual farm-level losses. Payout based on real damage.',
        cons: 'Higher premiums. Requires field assessment (slow payouts 4–8 weeks). Moral hazard risk.'
      },
      area_yield_index: {
        name: 'Area Yield Index Insurance',
        short: 'Area Yield',
        desc: 'Pays when the AVERAGE yield in an area falls below a threshold. No individual farm assessment needed.',
        pros: 'Cheaper. Faster payouts. Less moral hazard.',
        cons: 'Basis risk — your farm may lose but area average is fine (no payout).'
      },
      weather_index: {
        name: 'Weather Index Insurance (WII)',
        short: 'Weather Index',
        desc: 'Pays when a weather parameter (rainfall, temperature) crosses a threshold using satellite or station data. No farm visit required.',
        pros: 'Fastest payouts — often automatic via mobile money within 2 weeks. Cheapest to administer.',
        cons: 'Basis risk — weather at station may differ from your farm. Does not cover all risks (e.g. pests).'
      },
      livestock_index: {
        name: 'Index-Based Livestock Insurance (IBLI)',
        short: 'Livestock Index',
        desc: 'Covers livestock mortality due to drought using NDVI satellite vegetation index. No individual animal assessment.',
        pros: 'Covers pastoralists with large herds. Satellite-triggered payouts within 2 weeks.',
        cons: 'Basis risk. Only covers drought-related deaths, not disease or accident.'
      }
    },

    // ── COUNTRY DATA ─────────────────────────────────────────────────────
    countries: {

      'NG': {
        name: 'Nigeria',
        currency: 'NGN',
        symbol: '₦',
        crops: ['Maize', 'Rice', 'Cassava', 'Sorghum', 'Yam', 'Cowpea', 'Groundnut', 'Cotton', 'Cocoa', 'Oil Palm'],
        livestock: ['Cattle', 'Sheep', 'Goat', 'Poultry (100 birds)'],
        // Approximate market prices (NGN per tonne / per head for livestock)
        prices: {
          'Maize': 280000, 'Rice': 450000, 'Cassava': 120000, 'Sorghum': 250000,
          'Yam': 400000, 'Cowpea': 800000, 'Groundnut': 900000, 'Cotton': 350000,
          'Cocoa': 3500000, 'Oil Palm': 300000,
          'Cattle': 800000, 'Sheep': 80000, 'Goat': 70000, 'Poultry (100 birds)': 250000
        },
        // Typical input cost per hectare (NGN)
        inputCostPerHa: {
          'Maize': 150000, 'Rice': 220000, 'Cassava': 100000, 'Sorghum': 120000,
          'Yam': 280000, 'Cowpea': 90000, 'Groundnut': 130000, 'Cotton': 200000,
          'Cocoa': 400000, 'Oil Palm': 350000
        },
        // Typical yield (tonnes/ha)
        typicalYield: {
          'Maize': 1.5, 'Rice': 2.0, 'Cassava': 12.0, 'Sorghum': 1.2,
          'Yam': 10.0, 'Cowpea': 0.8, 'Groundnut': 1.0, 'Cotton': 0.9,
          'Cocoa': 0.5, 'Oil Palm': 8.0
        },
        programs: [
          {
            name: 'NAIC Agricultural Insurance',
            provider: 'Nigerian Agricultural Insurance Corporation (NAIC)',
            type: 'area_yield_index',
            premiumRate: 5.0,
            govSubsidy: 50,
            deductible: 20,
            coverage: ['Drought', 'Flood', 'Fire', 'Pest', 'Disease'],
            payoutTimeline: '4–8 weeks after loss assessment',
            website: 'naic.gov.ng',
            enrollHow: 'Visit NAIC state offices or Bank of Agriculture (BOA) branches. Compulsory for government loan recipients.',
            notes: 'Covers crops and livestock. Government pays 50% of your premium. Compulsory for farmers accessing BOA/government loans.'
          },
          {
            name: 'Pula (formerly ACRE Africa)',
            provider: 'Pula Advisors',
            type: 'weather_index',
            premiumRate: 5.0,
            govSubsidy: 0,
            deductible: 0,
            coverage: ['Drought', 'Excess rainfall'],
            payoutTimeline: '1–2 weeks (automatic M-Pesa/OPay)',
            website: 'pula-advisors.com',
            enrollHow: 'Often bundled with certified seed or fertilizer purchases. Ask your agro-dealer.',
            notes: 'Satellite-based. Payout triggered automatically — no claim form needed. Premium sometimes embedded in input price.'
          }
        ]
      },

      'KE': {
        name: 'Kenya',
        currency: 'KES',
        symbol: 'KSh',
        crops: ['Maize', 'Tea', 'Coffee', 'Common Bean', 'Wheat', 'Potato', 'Sorghum', 'Avocado'],
        livestock: ['Cattle', 'Sheep', 'Goat', 'Camel'],
        prices: {
          'Maize': 45000, 'Tea': 200000, 'Coffee': 350000, 'Common Bean': 100000,
          'Wheat': 50000, 'Potato': 30000, 'Sorghum': 35000, 'Avocado': 80000,
          'Cattle': 80000, 'Sheep': 12000, 'Goat': 10000, 'Camel': 150000
        },
        inputCostPerHa: {
          'Maize': 30000, 'Tea': 120000, 'Coffee': 100000, 'Common Bean': 22000,
          'Wheat': 35000, 'Potato': 60000, 'Sorghum': 18000, 'Avocado': 80000
        },
        typicalYield: {
          'Maize': 2.5, 'Tea': 3.0, 'Coffee': 0.8, 'Common Bean': 1.2,
          'Wheat': 2.8, 'Potato': 15.0, 'Sorghum': 1.5, 'Avocado': 5.0
        },
        programs: [
          {
            name: 'ACRE Africa / Pula',
            provider: 'ACRE Africa (Pula)',
            type: 'weather_index',
            premiumRate: 5.0,
            govSubsidy: 50,
            deductible: 0,
            coverage: ['Drought (rainfall deficit)', 'Excess rainfall'],
            payoutTimeline: '1–2 weeks via M-Pesa (automatic)',
            website: 'acre-africa.com',
            enrollHow: 'Purchase certified seed bundled with insurance, or enroll via M-Pesa Insurance menu. Kenya Agricultural Insurance Programme (KAIP) subsidizes premium.',
            notes: 'Over 2M farmers covered. Satellite rainfall data — no farm visit. Government subsidizes 50% through KAIP.'
          },
          {
            name: 'IBLI — Index-Based Livestock Insurance',
            provider: 'ILRI / Takaful Insurance of Africa',
            type: 'livestock_index',
            premiumRate: 5.0,
            govSubsidy: 40,
            deductible: 0,
            coverage: ['Livestock mortality due to drought (NDVI-triggered)'],
            payoutTimeline: '2 weeks (satellite-triggered)',
            website: 'ibli.ilri.org',
            enrollHow: 'Available for pastoralists in Turkana, Marsabit, Isiolo, Wajir counties through Takaful Insurance branches.',
            notes: 'Landmark program. Global model for pastoralist insurance. Covers cattle, camels, shoats (sheep + goats).'
          }
        ]
      },

      'ZA': {
        name: 'South Africa',
        currency: 'ZAR',
        symbol: 'R',
        crops: ['Maize', 'Wheat', 'Soybean', 'Sugar Cane', 'Citrus', 'Avocado', 'Sunflower', 'Potato'],
        livestock: ['Cattle', 'Sheep', 'Goat', 'Pigs'],
        prices: {
          'Maize': 4500, 'Wheat': 5200, 'Soybean': 8000, 'Sugar Cane': 500,
          'Citrus': 6000, 'Avocado': 25000, 'Sunflower': 7000, 'Potato': 4000,
          'Cattle': 12000, 'Sheep': 2200, 'Goat': 1800, 'Pigs': 3500
        },
        inputCostPerHa: {
          'Maize': 7000, 'Wheat': 8000, 'Soybean': 6000, 'Sugar Cane': 12000,
          'Citrus': 25000, 'Avocado': 35000, 'Sunflower': 5500, 'Potato': 55000
        },
        typicalYield: {
          'Maize': 5.5, 'Wheat': 3.5, 'Soybean': 2.0, 'Sugar Cane': 60.0,
          'Citrus': 25.0, 'Avocado': 8.0, 'Sunflower': 1.5, 'Potato': 35.0
        },
        programs: [
          {
            name: 'Multi-Peril Crop Insurance (MPCI)',
            provider: 'Santam Agri / Old Mutual Agriculture / Mutual & Federal',
            type: 'multi_peril',
            premiumRate: 8.0,
            govSubsidy: 0,
            deductible: 15,
            coverage: ['Drought', 'Hail', 'Flood', 'Frost', 'Fire', 'Pest', 'Disease'],
            payoutTimeline: '3–6 weeks after assessment',
            website: 'santam.co.za/agri',
            enrollHow: 'Contact Santam Agri, Old Mutual Agriculture, or Mutual & Federal brokers. Most commercial farmers use short-term insurers.',
            notes: 'Most developed agri-insurance market in Africa. No government subsidy — fully commercial. High penetration among commercial farmers.'
          },
          {
            name: 'Crop Hail Insurance',
            provider: 'Various short-term insurers',
            type: 'multi_peril',
            premiumRate: 3.5,
            govSubsidy: 0,
            deductible: 10,
            coverage: ['Hail damage'],
            payoutTimeline: '1–3 weeks after assessment',
            website: 'santam.co.za/agri',
            enrollHow: 'Available through agricultural brokers. Very common in Highveld maize/wheat belt where hail is frequent.',
            notes: 'Narrow cover but very cost-effective for hail-prone regions. Often combined with MPCI.'
          }
        ]
      },

      'GH': {
        name: 'Ghana',
        currency: 'GHS',
        symbol: 'GH₵',
        crops: ['Cocoa', 'Maize', 'Rice', 'Cassava', 'Yam', 'Plantain', 'Soybean', 'Groundnut'],
        livestock: ['Cattle', 'Sheep', 'Goat', 'Poultry (100 birds)'],
        prices: {
          'Cocoa': 25000, 'Maize': 4500, 'Rice': 8000, 'Cassava': 1500,
          'Yam': 5000, 'Plantain': 3000, 'Soybean': 7000, 'Groundnut': 9000,
          'Cattle': 5000, 'Sheep': 800, 'Goat': 700, 'Poultry (100 birds)': 2500
        },
        inputCostPerHa: {
          'Cocoa': 5000, 'Maize': 2000, 'Rice': 3500, 'Cassava': 1200,
          'Yam': 4500, 'Plantain': 3000, 'Soybean': 1800, 'Groundnut': 1500
        },
        typicalYield: {
          'Cocoa': 0.5, 'Maize': 2.0, 'Rice': 2.5, 'Cassava': 14.0,
          'Yam': 12.0, 'Plantain': 8.0, 'Soybean': 1.5, 'Groundnut': 1.2
        },
        programs: [
          {
            name: 'GAIP — Ghana Agricultural Insurance Programme',
            provider: 'Ghana Agricultural Insurance Pool (consortium of licensed insurers)',
            type: 'area_yield_index',
            premiumRate: 5.0,
            govSubsidy: 50,
            deductible: 20,
            coverage: ['Drought', 'Flood', 'Fire', 'Pest', 'Disease'],
            payoutTimeline: '3–6 weeks after assessment',
            website: 'mofa.gov.gh',
            enrollHow: 'Enroll through banks linked to Planting for Food & Jobs programme, or GAIP member insurance companies.',
            notes: 'Government subsidizes 50% of premium through the Ministry of Food & Agriculture. Linked to PFJ agri-input subsidy programme.'
          }
        ]
      },

      'EG': {
        name: 'Egypt',
        currency: 'EGP',
        symbol: 'E£',
        crops: ['Wheat', 'Maize', 'Rice', 'Cotton', 'Tomato', 'Potato', 'Sugar Cane', 'Citrus'],
        livestock: ['Cattle', 'Buffalo', 'Sheep', 'Goat'],
        prices: {
          'Wheat': 12000, 'Maize': 8000, 'Rice': 10000, 'Cotton': 25000,
          'Tomato': 8000, 'Potato': 7000, 'Sugar Cane': 1800, 'Citrus': 9000,
          'Cattle': 80000, 'Buffalo': 100000, 'Sheep': 12000, 'Goat': 10000
        },
        inputCostPerHa: {
          'Wheat': 15000, 'Maize': 12000, 'Rice': 18000, 'Cotton': 22000,
          'Tomato': 30000, 'Potato': 35000, 'Sugar Cane': 20000, 'Citrus': 40000
        },
        typicalYield: {
          'Wheat': 6.5, 'Maize': 7.0, 'Rice': 9.0, 'Cotton': 1.5,
          'Tomato': 35.0, 'Potato': 25.0, 'Sugar Cane': 100.0, 'Citrus': 22.0
        },
        programs: [
          {
            name: 'PBDAC Crop Insurance',
            provider: 'Principal Bank for Development and Agricultural Credit (PBDAC) + insurance companies',
            type: 'multi_peril',
            premiumRate: 3.0,
            govSubsidy: 70,
            deductible: 15,
            coverage: ['Drought', 'Flood', 'Hail', 'Frost', 'Pest', 'Disease', 'Fire'],
            payoutTimeline: '3–5 weeks after field assessment',
            website: 'pbdac.com.eg',
            enrollHow: 'Bundled automatically with PBDAC agricultural crop loans. Standalone enrollment at PBDAC branches across Egypt.',
            notes: 'Egypt has the oldest agri-insurance program in Africa. Significant government subsidy — farmers pay only ~30% of gross premium. Covers Nile Valley and Delta irrigated farms.'
          }
        ]
      },

      'ET': {
        name: 'Ethiopia',
        currency: 'ETB',
        symbol: 'Br',
        crops: ['Teff', 'Maize', 'Wheat', 'Sorghum', 'Coffee', 'Chickpea', 'Barley', 'Common Bean'],
        livestock: ['Cattle', 'Sheep', 'Goat', 'Camel'],
        prices: {
          'Teff': 45000, 'Maize': 25000, 'Wheat': 28000, 'Sorghum': 20000,
          'Coffee': 150000, 'Chickpea': 30000, 'Barley': 22000, 'Common Bean': 35000,
          'Cattle': 60000, 'Sheep': 8000, 'Goat': 7000, 'Camel': 150000
        },
        inputCostPerHa: {
          'Teff': 18000, 'Maize': 22000, 'Wheat': 25000, 'Sorghum': 15000,
          'Coffee': 35000, 'Chickpea': 14000, 'Barley': 16000, 'Common Bean': 12000
        },
        typicalYield: {
          'Teff': 1.5, 'Maize': 2.8, 'Wheat': 2.5, 'Sorghum': 1.8,
          'Coffee': 0.8, 'Chickpea': 1.2, 'Barley': 1.8, 'Common Bean': 1.0
        },
        programs: [
          {
            name: 'R4 Rural Resilience Initiative',
            provider: 'WFP + Oxfam + Ethiopian Insurance Corporation',
            type: 'weather_index',
            premiumRate: 0,
            govSubsidy: 100,
            deductible: 0,
            coverage: ['Drought (rainfall deficit)'],
            payoutTimeline: '2–4 weeks (satellite-triggered)',
            website: 'wfp.org/r4',
            enrollHow: 'Join community groups in Tigray, Amhara, SNNPR that participate in WFP\'s R4 programme. Premium is paid through community work (food-for-work).',
            notes: 'Innovative — farmers pay premium through community labor on watershed rehabilitation. No cash needed. Limited to R4 programme areas.'
          },
          {
            name: 'EAIC Crop Insurance',
            provider: 'Ethiopian Agricultural Insurance Company (EAIC)',
            type: 'area_yield_index',
            premiumRate: 5.0,
            govSubsidy: 40,
            deductible: 20,
            coverage: ['Drought', 'Flood', 'Hail', 'Frost', 'Pest'],
            payoutTimeline: '4–8 weeks after assessment',
            website: 'eaic.com.et',
            enrollHow: 'Apply at EAIC offices or through banks linked to Ethiopian agricultural credit programs.',
            notes: 'Government-backed. Linked to ADLI agricultural development program. Premium subsidy varies by region.'
          }
        ]
      },

      'TZ': {
        name: 'Tanzania',
        currency: 'TZS',
        symbol: 'TSh',
        crops: ['Maize', 'Rice', 'Cashew', 'Coffee', 'Cotton', 'Cassava', 'Banana', 'Sisal'],
        livestock: ['Cattle', 'Sheep', 'Goat', 'Poultry (100 birds)'],
        prices: {
          'Maize': 600000, 'Rice': 1200000, 'Cashew': 3500000, 'Coffee': 8000000,
          'Cotton': 1500000, 'Cassava': 300000, 'Banana': 800000, 'Sisal': 1200000,
          'Cattle': 1500000, 'Sheep': 200000, 'Goat': 180000, 'Poultry (100 birds)': 800000
        },
        inputCostPerHa: {
          'Maize': 600000, 'Rice': 1000000, 'Cashew': 1200000, 'Coffee': 2000000,
          'Cotton': 900000, 'Cassava': 400000, 'Banana': 1500000, 'Sisal': 1800000
        },
        typicalYield: {
          'Maize': 1.8, 'Rice': 2.5, 'Cashew': 0.6, 'Coffee': 0.7,
          'Cotton': 0.8, 'Cassava': 12.0, 'Banana': 10.0, 'Sisal': 3.0
        },
        programs: [
          {
            name: 'ACRE Africa Tanzania',
            provider: 'ACRE Africa (Pula)',
            type: 'weather_index',
            premiumRate: 5.0,
            govSubsidy: 40,
            deductible: 0,
            coverage: ['Drought (rainfall deficit)', 'Excess rainfall'],
            payoutTimeline: '2 weeks via mobile money (M-Pesa)',
            website: 'acre-africa.com',
            enrollHow: 'Bundled with certified seeds at agro-dealers, or via M-Pesa insurance menu. Government of Tanzania subsidizes through ASDP.',
            notes: 'Active in maize and rice belts of Dodoma, Iringa, Morogoro. Satellite-based — no field assessment needed.'
          },
          {
            name: 'Tanzania Agricultural Development Bank (TADB) Crop Insurance',
            provider: 'TADB + National Insurance Corporation (NIC)',
            type: 'area_yield_index',
            premiumRate: 6.0,
            govSubsidy: 30,
            deductible: 25,
            coverage: ['Drought', 'Flood', 'Pest', 'Disease'],
            payoutTimeline: '4–6 weeks',
            website: 'tadb.co.tz',
            enrollHow: 'Apply through TADB branches when accessing agricultural loans. Also available through NIC Tanzania offices.',
            notes: 'Linked to TADB agricultural credit. Subsidy provided through Ministry of Agriculture.'
          }
        ]
      },

      'UG': {
        name: 'Uganda',
        currency: 'UGX',
        symbol: 'USh',
        crops: ['Coffee', 'Maize', 'Banana', 'Cassava', 'Common Bean', 'Tea', 'Cotton', 'Millet'],
        livestock: ['Cattle', 'Sheep', 'Goat', 'Poultry (100 birds)'],
        prices: {
          'Coffee': 12000000, 'Maize': 1200000, 'Banana': 1000000, 'Cassava': 700000,
          'Common Bean': 2500000, 'Tea': 3000000, 'Cotton': 2000000, 'Millet': 1500000,
          'Cattle': 2500000, 'Sheep': 300000, 'Goat': 280000, 'Poultry (100 birds)': 1200000
        },
        inputCostPerHa: {
          'Coffee': 4000000, 'Maize': 1500000, 'Banana': 3000000, 'Cassava': 800000,
          'Common Bean': 900000, 'Tea': 5000000, 'Cotton': 1800000, 'Millet': 700000
        },
        typicalYield: {
          'Coffee': 0.8, 'Maize': 2.0, 'Banana': 12.0, 'Cassava': 10.0,
          'Common Bean': 1.2, 'Tea': 2.5, 'Cotton': 0.7, 'Millet': 1.2
        },
        programs: [
          {
            name: 'Uganda Agricultural Insurance Scheme (UAIS)',
            provider: 'Uganda Insurers Association (UIA) + MAAIF',
            type: 'area_yield_index',
            premiumRate: 5.0,
            govSubsidy: 50,
            deductible: 20,
            coverage: ['Drought', 'Flood', 'Hail', 'Pest', 'Disease'],
            payoutTimeline: '4–6 weeks after assessment',
            website: 'maaif.go.ug',
            enrollHow: 'Apply through UAIS member insurance companies or at Ministry of Agriculture (MAAIF) offices. Linked to government agricultural loans.',
            notes: 'Government subsidizes 50% of premium. Available for food crops and coffee. Penetration still low — only ~3% of Ugandan farmers insured.'
          },
          {
            name: 'ACRE Africa Uganda',
            provider: 'ACRE Africa (Pula)',
            type: 'weather_index',
            premiumRate: 5.0,
            govSubsidy: 0,
            deductible: 0,
            coverage: ['Drought', 'Excess rainfall'],
            payoutTimeline: '2 weeks (satellite, automatic)',
            website: 'acre-africa.com',
            enrollHow: 'Bundled with agri-inputs at participating agro-dealers. Ask your seed or fertilizer dealer.',
            notes: 'Active in eastern Uganda (maize, common bean). Payout via MTN Mobile Money or Airtel Money.'
          }
        ]
      },

      'RW': {
        name: 'Rwanda',
        currency: 'RWF',
        symbol: 'RWF',
        crops: ['Coffee', 'Tea', 'Maize', 'Common Bean', 'Potato', 'Sorghum', 'Banana', 'Rice'],
        livestock: ['Cattle', 'Sheep', 'Goat', 'Pigs'],
        prices: {
          'Coffee': 2500000, 'Tea': 1800000, 'Maize': 450000, 'Common Bean': 900000,
          'Potato': 350000, 'Sorghum': 350000, 'Banana': 400000, 'Rice': 900000,
          'Cattle': 500000, 'Sheep': 80000, 'Goat': 70000, 'Pigs': 200000
        },
        inputCostPerHa: {
          'Coffee': 600000, 'Tea': 800000, 'Maize': 250000, 'Common Bean': 180000,
          'Potato': 500000, 'Sorghum': 150000, 'Banana': 400000, 'Rice': 350000
        },
        typicalYield: {
          'Coffee': 0.8, 'Tea': 3.0, 'Maize': 2.5, 'Common Bean': 1.5,
          'Potato': 15.0, 'Sorghum': 1.2, 'Banana': 10.0, 'Rice': 4.5
        },
        programs: [
          {
            name: 'ACRE Africa Rwanda',
            provider: 'ACRE Africa (Pula)',
            type: 'weather_index',
            premiumRate: 4.0,
            govSubsidy: 25,
            deductible: 0,
            coverage: ['Drought', 'Excess rainfall'],
            payoutTimeline: '2 weeks (satellite, via MTN MoMo)',
            website: 'acre-africa.com',
            enrollHow: 'Available through SACCOs, cooperatives, and agro-dealers. Rwanda Agriculture Board (RAB) partners with ACRE for distribution.',
            notes: 'Active in Northern and Eastern Province for maize and common bean. 25% subsidy through RAB. Payout via MTN Mobile Money.'
          },
          {
            name: 'Rwanda Cooperative Crop Insurance',
            provider: 'SONARWA / Radiant Insurance + cooperatives',
            type: 'area_yield_index',
            premiumRate: 5.0,
            govSubsidy: 30,
            deductible: 20,
            coverage: ['Drought', 'Flood', 'Hail', 'Pest', 'Disease'],
            payoutTimeline: '3–5 weeks',
            website: 'minagri.gov.rw',
            enrollHow: 'Through farming cooperatives (Imirenge cooperatives). Enroll at cooperative office with land title or imidugudu membership.',
            notes: 'Government subsidizes 30%. Available through cooperative system — most Rwanda farmers are in cooperatives.'
          }
        ]
      },

      'CI': {
        name: "Côte d'Ivoire",
        currency: 'XOF',
        symbol: 'CFA',
        crops: ['Cocoa', 'Coffee', 'Cashew', 'Rubber', 'Oil Palm', 'Cassava', 'Rice', 'Cotton'],
        livestock: ['Cattle', 'Sheep', 'Goat', 'Poultry (100 birds)'],
        prices: {
          'Cocoa': 1800000, 'Coffee': 1200000, 'Cashew': 700000, 'Rubber': 900000,
          'Oil Palm': 400000, 'Cassava': 100000, 'Rice': 300000, 'Cotton': 500000,
          'Cattle': 500000, 'Sheep': 80000, 'Goat': 70000, 'Poultry (100 birds)': 250000
        },
        inputCostPerHa: {
          'Cocoa': 500000, 'Coffee': 400000, 'Cashew': 200000, 'Rubber': 800000,
          'Oil Palm': 600000, 'Cassava': 120000, 'Rice': 250000, 'Cotton': 300000
        },
        typicalYield: {
          'Cocoa': 0.5, 'Coffee': 0.6, 'Cashew': 0.8, 'Rubber': 1.5,
          'Oil Palm': 12.0, 'Cassava': 12.0, 'Rice': 2.5, 'Cotton': 1.0
        },
        programs: [
          {
            name: 'Planet Guarantee / AXA CI Agricultural Insurance',
            provider: 'Planet Guarantee (AXA partner) + NSIA Côte d\'Ivoire',
            type: 'weather_index',
            premiumRate: 6.0,
            govSubsidy: 30,
            deductible: 0,
            coverage: ['Drought', 'Excess rainfall', 'Pest outbreaks'],
            payoutTimeline: '2–3 weeks (satellite-triggered)',
            website: 'planetguarantee.com',
            enrollHow: 'Through Conseil du Café-Cacao for cocoa farmers, or ANADER rural extension services. Ask your cooperative about insurance bundled with inputs.',
            notes: 'CIMA regional framework governs agricultural insurance in Côte d\'Ivoire. Government subsidizes 30% via Ministère de l\'Agriculture.'
          }
        ]
      },

      'CM': {
        name: 'Cameroon',
        currency: 'XAF',
        symbol: 'CFA',
        crops: ['Cocoa', 'Coffee', 'Cotton', 'Cassava', 'Maize', 'Banana', 'Oil Palm', 'Rubber'],
        livestock: ['Cattle', 'Sheep', 'Goat', 'Poultry (100 birds)'],
        prices: {
          'Cocoa': 2000000, 'Coffee': 1400000, 'Cotton': 600000, 'Cassava': 120000,
          'Maize': 200000, 'Banana': 300000, 'Oil Palm': 450000, 'Rubber': 1000000,
          'Cattle': 600000, 'Sheep': 90000, 'Goat': 80000, 'Poultry (100 birds)': 280000
        },
        inputCostPerHa: {
          'Cocoa': 550000, 'Coffee': 450000, 'Cotton': 300000, 'Cassava': 130000,
          'Maize': 180000, 'Banana': 400000, 'Oil Palm': 700000, 'Rubber': 900000
        },
        typicalYield: {
          'Cocoa': 0.6, 'Coffee': 0.7, 'Cotton': 1.0, 'Cassava': 13.0,
          'Maize': 2.0, 'Banana': 15.0, 'Oil Palm': 12.0, 'Rubber': 1.5
        },
        programs: [
          {
            name: 'NSIA Cameroun Agricultural Insurance',
            provider: 'NSIA Cameroun Assurances',
            type: 'area_yield_index',
            premiumRate: 6.0,
            govSubsidy: 25,
            deductible: 20,
            coverage: ['Drought', 'Flood', 'Pest', 'Disease', 'Fire'],
            payoutTimeline: '4–6 weeks after assessment',
            website: 'nsia-cameroun.com',
            enrollHow: 'Apply at NSIA Cameroun offices in Yaoundé, Douala, and regional towns. Also through MINADER agricultural extension offices.',
            notes: 'CIMA framework. Bilingual service (French/English). Government subsidizes 25% via MINADER. Covers cocoa, coffee, and food crops.'
          },
          {
            name: 'Pula / ACRE Africa Cameroon',
            provider: 'Pula Advisors',
            type: 'weather_index',
            premiumRate: 5.0,
            govSubsidy: 0,
            deductible: 0,
            coverage: ['Drought', 'Excess rainfall'],
            payoutTimeline: '2 weeks (satellite, mobile money)',
            website: 'pula-advisors.com',
            enrollHow: 'Through agro-dealers selling certified seeds. Often bundled — ask when buying Syngenta, Pioneer, or CropLife seeds.',
            notes: 'Expanding in northern Cameroon cotton belt and Centre/West cocoa zones.'
          }
        ]
      },

      'SN': {
        name: 'Senegal',
        currency: 'XOF',
        symbol: 'CFA',
        crops: ['Groundnut', 'Millet', 'Rice', 'Cotton', 'Maize', 'Sorghum', 'Cowpea', 'Tomato'],
        livestock: ['Cattle', 'Sheep', 'Goat', 'Poultry (100 birds)'],
        prices: {
          'Groundnut': 400000, 'Millet': 200000, 'Rice': 300000, 'Cotton': 500000,
          'Maize': 220000, 'Sorghum': 180000, 'Cowpea': 600000, 'Tomato': 250000,
          'Cattle': 500000, 'Sheep': 80000, 'Goat': 70000, 'Poultry (100 birds)': 220000
        },
        inputCostPerHa: {
          'Groundnut': 200000, 'Millet': 100000, 'Rice': 250000, 'Cotton': 280000,
          'Maize': 180000, 'Sorghum': 90000, 'Cowpea': 120000, 'Tomato': 400000
        },
        typicalYield: {
          'Groundnut': 1.0, 'Millet': 0.9, 'Rice': 3.0, 'Cotton': 1.0,
          'Maize': 1.5, 'Sorghum': 0.9, 'Cowpea': 0.8, 'Tomato': 20.0
        },
        programs: [
          {
            name: 'Planet Guarantee / AXA Assurances Sénégal',
            provider: 'Planet Guarantee + AXA Assurances Sénégal',
            type: 'weather_index',
            premiumRate: 5.0,
            govSubsidy: 40,
            deductible: 0,
            coverage: ['Drought (rainfall deficit)', 'Excess rainfall'],
            payoutTimeline: '2 weeks (satellite-triggered)',
            website: 'planetguarantee.com',
            enrollHow: 'Through SODAGRI, ANCAR (agri extension), and rural banking institutions. MAER (Ministère de l\'Agriculture) subsidizes 40% of premium.',
            notes: 'Active in groundnut, millet, and rice belts of Thiès, Diourbel, Kaolack. Payout via Orange Money or Wari.'
          },
          {
            name: 'CNAAS Agricultural Insurance',
            provider: 'Compagnie Nationale d\'Assurance Agricole du Sénégal (CNAAS)',
            type: 'multi_peril',
            premiumRate: 6.0,
            govSubsidy: 40,
            deductible: 20,
            coverage: ['Drought', 'Flood', 'Hail', 'Pest', 'Disease', 'Fire'],
            payoutTimeline: '3–5 weeks',
            website: 'cnaas.sn',
            enrollHow: 'State-owned — apply at CNAAS offices in Dakar, Thiès, Kaolack, Ziguinchor.',
            notes: 'State-owned specialized agricultural insurer. Covers all major crops. MAER co-finances premiums.'
          }
        ]
      },

      'MA': {
        name: 'Morocco',
        currency: 'MAD',
        symbol: 'MAD',
        crops: ['Wheat', 'Barley', 'Citrus', 'Olive', 'Tomato', 'Potato', 'Sugar Cane', 'Dates'],
        livestock: ['Cattle', 'Sheep', 'Goat', 'Poultry (100 birds)'],
        prices: {
          'Wheat': 3800, 'Barley': 3200, 'Citrus': 5000, 'Olive': 4500,
          'Tomato': 3000, 'Potato': 2500, 'Sugar Cane': 800, 'Dates': 8000,
          'Cattle': 15000, 'Sheep': 3000, 'Goat': 2500, 'Poultry (100 birds)': 6000
        },
        inputCostPerHa: {
          'Wheat': 2500, 'Barley': 2000, 'Citrus': 18000, 'Olive': 6000,
          'Tomato': 25000, 'Potato': 22000, 'Sugar Cane': 12000, 'Dates': 8000
        },
        typicalYield: {
          'Wheat': 3.5, 'Barley': 2.8, 'Citrus': 22.0, 'Olive': 3.5,
          'Tomato': 45.0, 'Potato': 28.0, 'Sugar Cane': 80.0, 'Dates': 8.0
        },
        programs: [
          {
            name: 'MAMDA Multi-Peril Crop Insurance',
            provider: 'Mutuelle Agricole Marocaine d\'Assurances (MAMDA)',
            type: 'multi_peril',
            premiumRate: 3.5,
            govSubsidy: 80,
            deductible: 15,
            coverage: ['Drought', 'Flood', 'Hail', 'Frost', 'Sandstorm', 'Pest', 'Disease'],
            payoutTimeline: '2–4 weeks after assessment',
            website: 'mamda.ma',
            enrollHow: 'Apply at MAMDA branches across Morocco or through Credit Agricole du Maroc. Government (MAPMDREF) subsidizes 80% of premium.',
            notes: 'MAMDA is the largest agricultural insurer in Africa — over 700,000 policies. Strongest government support on continent: 80% subsidy. Strategic pillar of Plan Maroc Vert and Generation Green 2020-2030.'
          },
          {
            name: 'Assurance Multirisque Climatique (AMC)',
            provider: 'MAMDA + MCMA',
            type: 'weather_index',
            premiumRate: 2.0,
            govSubsidy: 80,
            deductible: 0,
            coverage: ['Drought', 'Excess rainfall', 'Frost', 'Hail'],
            payoutTimeline: '1–2 weeks (index-triggered)',
            website: 'mamda.ma',
            enrollHow: 'Through MAMDA and Crédit Agricole du Maroc branches. Available for cereal farmers.',
            notes: 'Very affordable due to 80% subsidy. Index-based — faster payouts than traditional MPCI.'
          }
        ]
      },

      'TN': {
        name: 'Tunisia',
        currency: 'TND',
        symbol: 'TND',
        crops: ['Olive', 'Wheat', 'Barley', 'Tomato', 'Citrus', 'Dates', 'Potato', 'Grape'],
        livestock: ['Cattle', 'Sheep', 'Goat', 'Poultry (100 birds)'],
        prices: {
          'Olive': 2500, 'Wheat': 700, 'Barley': 550, 'Tomato': 800,
          'Citrus': 1800, 'Dates': 3500, 'Potato': 900, 'Grape': 2000,
          'Cattle': 6000, 'Sheep': 800, 'Goat': 650, 'Poultry (100 birds)': 2500
        },
        inputCostPerHa: {
          'Olive': 800, 'Wheat': 700, 'Barley': 550, 'Tomato': 3500,
          'Citrus': 4000, 'Dates': 2500, 'Potato': 4500, 'Grape': 3000
        },
        typicalYield: {
          'Olive': 2.5, 'Wheat': 2.0, 'Barley': 1.8, 'Tomato': 40.0,
          'Citrus': 20.0, 'Dates': 7.0, 'Potato': 22.0, 'Grape': 8.0
        },
        programs: [
          {
            name: 'CTAMA Crop Insurance',
            provider: 'Caisse Tunisienne des Assurances Mutuelles Agricoles (CTAMA)',
            type: 'multi_peril',
            premiumRate: 4.0,
            govSubsidy: 65,
            deductible: 15,
            coverage: ['Drought', 'Flood', 'Hail', 'Frost', 'Wind', 'Pest', 'Disease'],
            payoutTimeline: '2–4 weeks after field assessment',
            website: 'ctama.com.tn',
            enrollHow: 'Apply at CTAMA offices throughout Tunisia. Also accessible through BNA (Banque Nationale Agricole) and BFPME branches.',
            notes: 'State-backed mutual insurer. Government subsidizes 65% of premium through Ministry of Agriculture. Long-established program covering olive, cereal, and vegetable sectors.'
          },
          {
            name: 'CTAMA Weather Index (Céréales)',
            provider: 'CTAMA',
            type: 'weather_index',
            premiumRate: 2.5,
            govSubsidy: 65,
            deductible: 0,
            coverage: ['Drought', 'Excess rainfall', 'Frost'],
            payoutTimeline: '1–2 weeks (station-based index)',
            website: 'ctama.com.tn',
            enrollHow: 'Available for wheat and barley farmers through CTAMA and BNA. Specifically designed for smallholder cereal growers.',
            notes: 'Index-based product for cereal farmers. Faster payouts. Highly subsidized — farmer pays only 35% of premium.'
          }
        ]
      },

      'AO': {
        name: 'Angola',
        currency: 'AOA',
        symbol: 'Kz',
        crops: ['Cassava', 'Maize', 'Coffee', 'Common Bean', 'Sweet Potato', 'Millet', 'Cotton', 'Sugar Cane'],
        livestock: ['Cattle', 'Sheep', 'Goat', 'Pigs'],
        prices: {
          'Cassava': 120000, 'Maize': 150000, 'Coffee': 800000, 'Common Bean': 350000,
          'Sweet Potato': 180000, 'Millet': 130000, 'Cotton': 400000, 'Sugar Cane': 60000,
          'Cattle': 800000, 'Sheep': 120000, 'Goat': 100000, 'Pigs': 300000
        },
        inputCostPerHa: {
          'Cassava': 80000, 'Maize': 120000, 'Coffee': 400000, 'Common Bean': 90000,
          'Sweet Potato': 100000, 'Millet': 70000, 'Cotton': 200000, 'Sugar Cane': 350000
        },
        typicalYield: {
          'Cassava': 10.0, 'Maize': 1.8, 'Coffee': 0.7, 'Common Bean': 0.9,
          'Sweet Potato': 8.0, 'Millet': 0.8, 'Cotton': 0.8, 'Sugar Cane': 60.0
        },
        programs: [
          {
            name: 'ENSA Angola Agricultural Insurance',
            provider: 'ENSA — Empresa Nacional de Seguros e Resseguros de Angola',
            type: 'area_yield_index',
            premiumRate: 7.0,
            govSubsidy: 30,
            deductible: 25,
            coverage: ['Drought', 'Flood', 'Fire', 'Pest', 'Disease'],
            payoutTimeline: '4–8 weeks after assessment',
            website: 'ensa.ao',
            enrollHow: 'Apply at ENSA offices in Luanda, Huambo, Huíla, or Malanje. Linked to Instituto de Desenvolvimento Agrário (IDA) credit programs.',
            notes: 'Angola\'s agricultural insurance sector is nascent. Government is actively building the market under the PRODESI diversification program. Premium subsidy of 30% provided through MINAGRIF (Ministério da Agricultura).'
          }
        ]
      }

    } // end countries
  }; // end cropInsuranceData

}();
