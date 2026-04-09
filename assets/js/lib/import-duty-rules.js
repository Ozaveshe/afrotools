(function () {
  const PRODUCT_PROFILES = [
    { key: 'smartphone', label: 'Smartphone / iPhone', hsCode: '8517.13.00', baseCategory: 'Electronics', duty: '0-25%', refFob: 500, refShipping: 120 },
    { key: 'laptop', label: 'Laptop / Desktop', hsCode: '8471.30.00', baseCategory: 'Electronics', duty: '0-10%', refFob: 800, refShipping: 140 },
    { key: 'solar-panel', label: 'Solar Panel', hsCode: '8541.43.00', baseCategory: 'Machinery', duty: '0-10%', refFob: 120, refShipping: 40 },
    { key: 'generator', label: 'Generator', hsCode: '8502.20.00', baseCategory: 'Machinery', duty: '5-15%', refFob: 700, refShipping: 180 },
    { key: 'rice', label: 'Rice', hsCode: '1006.30.00', baseCategory: 'Food', duty: '20-35%', refFob: 35, refShipping: 10 },
    { key: 'cement', label: 'Cement', hsCode: '2523.29.00', baseCategory: 'Building', duty: '5-20%', refFob: 8, refShipping: 2 },
    { key: 'clothing-bale', label: 'Clothing Bale / Textiles', hsCode: '6309.00.00', baseCategory: 'Clothing', duty: '20-45%', refFob: 350, refShipping: 90 },
    { key: 'cosmetics-kit', label: 'Cosmetics / Beauty Products', hsCode: '3304.99.00', baseCategory: 'Cosmetics', duty: '15-25%', refFob: 250, refShipping: 70 },
    { key: 'used-sedan', label: 'Used Car - Sedan', hsCode: '8703.23.90', baseCategory: 'Vehicles', duty: '20-75%', refFob: 4500, refShipping: 1200, vehicleType: 'sedan' },
    { key: 'new-sedan', label: 'New Car - Sedan', hsCode: '8703.23.10', baseCategory: 'Vehicles', duty: '20-75%', refFob: 18000, refShipping: 1800, vehicleType: 'sedan' },
    { key: 'used-suv', label: 'Used Car - SUV', hsCode: '8703.33.90', baseCategory: 'Vehicles', duty: '20-75%', refFob: 9500, refShipping: 1500, vehicleType: 'suv' },
    { key: 'pickup', label: 'Pickup / Light Truck', hsCode: '8704.21.00', baseCategory: 'Vehicles', duty: '20-60%', refFob: 12000, refShipping: 1700, vehicleType: 'pickup' },
    { key: 'motorcycle', label: 'Motorcycle', hsCode: '8711.20.00', baseCategory: 'Vehicles', duty: '20-35%', refFob: 1500, refShipping: 450, vehicleType: 'motorcycle' }
  ];

  const HS_CODES = PRODUCT_PROFILES.map((profile) => ({
    product: profile.label,
    code: profile.hsCode,
    category: profile.key,
    displayCategory: profile.baseCategory,
    duty: profile.duty
  }));

  function sumAmounts(items) {
    return items.reduce((sum, item) => sum + item.amount, 0);
  }

  function defaultVatBase(cif, duty, totalLevies) {
    return cif + duty + totalLevies;
  }

  const VEHICLE_RULES = {
    Nigeria: {
      rate: 1600,
      symbol: 'NGN',
      currency: 'NGN',
      authority: 'NCS',
      source: 'Nigeria vehicle customs model based on NCS levy structure used across the shared import-duty engine.',
      levies: (cif, fob) => [
        { name: 'Import Duty (35% CIF)', amount: cif * 0.35 },
        { name: 'Import Levy (35% CIF)', amount: cif * 0.35 },
        { name: 'ECOWAS Levy (5% CIF)', amount: cif * 0.05 }
      ],
      vatRate: 7.5,
      vatBase: (cif, duty, totalLevies) => cif + duty + totalLevies
    },
    Ghana: {
      rate: 16,
      symbol: 'GHS',
      currency: 'GHS',
      authority: 'GRA',
      source: 'Ghana vehicle customs model uses the trade.gov Ghana customs valuation overview and current import VAT structure.',
      levies: (cif) => [
        { name: 'Import Duty (20% CIF)', amount: cif * 0.20 },
        { name: 'ECOWAS Levy (0.5% CIF)', amount: cif * 0.005 }
      ],
      vatRate: 20,
      vatBase: (cif, duty, totalLevies) => cif + duty + totalLevies
    },
    Kenya: {
      rate: 130,
      symbol: 'KES',
      currency: 'KES',
      authority: 'KRA',
      source: 'Kenya vehicle customs model follows EAC vehicle duty plus IDF, RDL, and VAT structure.',
      levies: (cif) => [
        { name: 'Import Duty (25% CIF)', amount: cif * 0.25 },
        { name: 'Excise Duty (20% CIF)', amount: cif * 0.20 },
        { name: 'IDF (3.5% CIF)', amount: cif * 0.035 },
        { name: 'RDL (2.5% CIF)', amount: cif * 0.025 }
      ],
      vatRate: 16,
      vatBase: (cif, duty, totalLevies) => cif + duty + totalLevies
    },
    'South Africa': {
      rate: 18.5,
      symbol: 'ZAR',
      currency: 'ZAR',
      authority: 'SARS',
      source: 'South Africa vehicle customs model uses the SARS import VAT uplift and standard motor vehicle customs duty treatment.',
      levies: (cif) => [{ name: 'Import Duty (25% CIF)', amount: cif * 0.25 }],
      vatRate: 15,
      vatBase: (cif, duty, totalLevies) => (cif * 1.10) + duty + totalLevies
    },
    Egypt: {
      rate: 30,
      symbol: 'EGP',
      currency: 'EGP',
      authority: 'ECA',
      source: 'Egypt vehicle customs model reflects the published higher-duty market structure used in the AfroTools Egypt import-duty engine.',
      levies: (cif) => [{ name: 'Import Duty (40% CIF)', amount: cif * 0.40 }],
      vatRate: 14,
      vatBase: (cif, duty, totalLevies) => cif + duty + totalLevies
    },
    Ethiopia: {
      rate: 140,
      symbol: 'ETB',
      currency: 'ETB',
      authority: 'ECC',
      source: 'Ethiopia trade.gov guidance says ICE imports face 15% VAT, up to 100% excise, 10% surtax, and 3% withholding, while fully assembled EVs only face 15% customs duty and imported EVs are VAT exempt.',
      levies: (cif, fob, isElectric) => {
        if (isElectric) {
          return [{ name: 'Customs Duty (15% CIF)', amount: cif * 0.15 }];
        }
        return [
          { name: 'Customs Duty (35% CIF)', amount: cif * 0.35 },
          { name: 'Excise Duty (100% CIF)', amount: cif * 1.00 },
          { name: 'Surtax (10% CIF)', amount: cif * 0.10 },
          { name: 'Withholding Tax (3% CIF)', amount: cif * 0.03 }
        ];
      },
      vatRate: 15,
      vatBase: (cif, duty, totalLevies, isElectric) => isElectric ? 0 : (cif + duty + totalLevies)
    },
    Tanzania: {
      rate: 2600,
      symbol: 'TZS',
      currency: 'TZS',
      authority: 'TRA',
      source: 'Tanzania trade.gov guidance confirms EAC vehicle duty treatment and 18% VAT on non-EAC imports.',
      levies: (cif, fob, isElectric) => [
        { name: 'Import Duty (' + (isElectric ? '10' : '25') + '% CIF)', amount: cif * (isElectric ? 0.10 : 0.25) }
      ],
      vatRate: 18,
      vatBase: (cif, duty, totalLevies) => cif + duty + totalLevies
    },
    Uganda: {
      rate: 3800,
      symbol: 'UGX',
      currency: 'UGX',
      authority: 'URA',
      source: 'Uganda trade.gov and URA guidance support 25% vehicle duty, 18% VAT, 6% import withholding tax, and a 1.5% infrastructure levy on dutiable imports.',
      levies: (cif, fob, isElectric) => [
        { name: 'Import Duty (' + (isElectric ? '10' : '25') + '% CIF)', amount: cif * (isElectric ? 0.10 : 0.25) },
        { name: 'Infrastructure Levy (1.5% CIF)', amount: cif * 0.015 },
        { name: 'Withholding Tax (6% CIF)', amount: cif * 0.06 }
      ],
      vatRate: 18,
      vatBase: (cif, duty, totalLevies) => cif + duty + totalLevies
    },
    Rwanda: {
      rate: 1400,
      symbol: 'RWF',
      currency: 'RWF',
      authority: 'RRA',
      source: 'Rwanda trade.gov guidance supports EAC finished-goods duty at 35%, plus 1.5% infrastructure development levy, 0.2% African Union levy, and 18% VAT. The same rule is used here for EVs until a cleaner official EV customs line is confirmed.',
      levies: (cif) => [
        { name: 'Import Duty (35% CIF)', amount: cif * 0.35 },
        { name: 'Infrastructure Development Levy (1.5% CIF)', amount: cif * 0.015 },
        { name: 'African Union Levy (0.2% CIF)', amount: cif * 0.002 }
      ],
      vatRate: 18,
      vatBase: (cif, duty, totalLevies) => cif + duty + totalLevies
    },
    Zambia: {
      rate: 28,
      symbol: 'ZMW',
      currency: 'ZMW',
      authority: 'ZRA',
      source: 'Zambia trade.gov guidance supports 25% vehicle duty, 16% VAT, and a fixed carbon emission surtax on imported vehicles rather than an ad valorem carbon percentage.',
      levies: (cif, fob, isElectric) => {
        const items = [
          { name: 'Import Duty (' + (isElectric ? '15' : '25') + '% CIF)', amount: cif * (isElectric ? 0.15 : 0.25) }
        ];
        if (!isElectric) items.push({ name: 'Carbon Emission Surtax (approx.)', amount: 8 });
        return items;
      },
      vatRate: 16,
      vatBase: (cif, duty, totalLevies) => cif + duty + totalLevies
    },
    Morocco: {
      rate: 10,
      symbol: 'MAD',
      currency: 'MAD',
      authority: 'ADII',
      source: 'Morocco vehicle customs model reflects the tariff-range treatment already used in the shared import-duty engine.',
      levies: (cif) => [{ name: 'Import Duty (30% CIF)', amount: cif * 0.30 }],
      vatRate: 20,
      vatBase: (cif, duty, totalLevies) => cif + duty + totalLevies
    }
  };

  const COUNTRY_PRODUCT_RULES = {
    Nigeria: {
      rate: 1600,
      symbol: 'NGN',
      currency: 'NGN',
      authority: 'NCS',
      vatRate: 7.5,
      vatBase: defaultVatBase,
      defaultLevies: (cif, fob) => [
        { name: 'CISS (1% FOB)', amount: fob * 0.01 },
        { name: 'ETLS (0.5% CIF)', amount: cif * 0.005 }
      ],
      products: {
        smartphone: { dutyRate: 20, source: 'Nigeria CET finished-goods band inferred from NCS/Trade Portal tariff structure.' },
        laptop: { dutyRate: 5, source: 'Nigeria CET capital-goods band inferred from NCS/Trade Portal tariff structure.' },
        'solar-panel': { dutyRate: 0, vatRate: 0, source: 'Nigeria Customs RE/EE handbook annex lists HS 8541.43.00 at 0% duty and 0% VAT.' },
        generator: { dutyRate: 5, source: 'Nigeria CET capital-goods band inferred from NCS/Trade Portal tariff structure.' },
        rice: {
          dutyRate: 35,
          levies: (cif, fob) => [
            { name: 'Rice Supplementary Levy (30% CIF)', amount: cif * 0.30 },
            { name: 'CISS (1% FOB)', amount: fob * 0.01 },
            { name: 'ETLS (0.5% CIF)', amount: cif * 0.005 }
          ],
          source: 'Nigeria trade guide reports rice at roughly 70% effective import duty in the 2022-2026 CET framework; this rule models a 35% tariff plus 30% supplementary levy before VAT. Import access may still be affected by separate policy restrictions.'
        },
        cement: {
          dutyRate: 10,
          levies: (cif, fob) => [
            { name: 'Cement Supplementary Levy (45% CIF)', amount: cif * 0.45 },
            { name: 'CISS (1% FOB)', amount: fob * 0.01 },
            { name: 'ETLS (0.5% CIF)', amount: cif * 0.005 }
          ],
          source: 'Nigeria trade guide reports cement at roughly 55% effective duty in the mining/building-materials sector; this rule models that with a 10% tariff plus 45% supplementary levy. Bagged cement can also face import restrictions.'
        },
        'clothing-bale': { dutyRate: 20, source: 'Nigeria CET finished-goods band inferred from tariff structure.' },
        'cosmetics-kit': { dutyRate: 20, source: 'Nigeria CET finished-goods band inferred from tariff structure; cosmetics also require Nigerian regulatory compliance and labeling review on import.' }
      }
    },
    Ghana: {
      rate: 16,
      symbol: 'GHS',
      currency: 'GHS',
      authority: 'GRA',
      vatRate: 20,
      vatBase: defaultVatBase,
      defaultLevies: (cif) => [
        { name: 'ECOWAS Levy (0.5% CIF)', amount: cif * 0.005 }
      ],
      products: {
        smartphone: { dutyRate: 20, source: 'Ghana CET consumer-goods band.' },
        laptop: { dutyRate: 5, source: 'Ghana CET capital-goods band.' },
        'solar-panel': { dutyRate: 5, source: 'Ghana CET capital-equipment band.' },
        generator: { dutyRate: 5, source: 'Ghana CET machinery/capital-equipment band.' },
        rice: {
          dutyRate: 20,
          levies: (cif) => [
            { name: 'ECOWAS Levy (0.5% CIF)', amount: cif * 0.005 },
            { name: 'FDA Food Importer Fee (0.8% CIF)', amount: cif * 0.008 }
          ],
          source: 'Ghana CET consumer-goods band plus FDA importer fee guidance for food products.'
        },
        cement: { dutyRate: 20, source: 'Ghana CET finished-goods band.' },
        'clothing-bale': { dutyRate: 20, source: 'Ghana CET consumer-goods band.' },
        'cosmetics-kit': {
          dutyRate: 20,
          levies: (cif) => [
            { name: 'ECOWAS Levy (0.5% CIF)', amount: cif * 0.005 },
            { name: 'FDA Cosmetics Importer Fee (0.5% CIF)', amount: cif * 0.005 }
          ],
          source: 'Ghana CET consumer-goods band plus FDA importer fee guidance for cosmetics.'
        }
      }
    },
    Kenya: {
      rate: 130,
      symbol: 'KES',
      currency: 'KES',
      authority: 'KRA',
      vatRate: 16,
      vatBase: defaultVatBase,
      defaultLevies: (cif) => [
        { name: 'IDF (3.5% CIF)', amount: cif * 0.035 },
        { name: 'RDL (2.5% CIF)', amount: cif * 0.025 }
      ],
      products: {
        laptop: {
          dutyRate: 0,
          vatRate: 0,
          levies: (cif) => [{ name: 'IDF (2% CIF)', amount: cif * 0.02 }],
          source: 'KRA importing FAQ states computers, printers, and parts only attract IDF at 2% of cost.'
        },
        'solar-panel': {
          dutyRate: 0,
          vatRate: 0,
          levies: () => [],
          source: 'KRA exemption list includes solar panels and related solar equipment.'
        },
        smartphone: { dutyRate: 25, source: 'EAC CET finished-goods band applied to finished telecom devices.' },
        generator: { dutyRate: 10, source: 'EAC CET intermediate/capital-goods band applied to generators.' },
        rice: { dutyRate: 25, source: 'Fallback EAC CET consumer-goods band in absence of corridor-specific sensitive-duty data.' },
        cement: { dutyRate: 25, source: 'EAC CET finished-goods band.' },
        'clothing-bale': { dutyRate: 25, source: 'EAC CET finished-goods band.' },
        'cosmetics-kit': { dutyRate: 25, source: 'EAC CET finished-goods band.' }
      }
    },
    'South Africa': {
      rate: 18.5,
      symbol: 'ZAR',
      currency: 'ZAR',
      authority: 'SARS',
      vatRate: 15,
      vatBase: (cif, duty, totalLevies) => (cif * 1.10) + duty + totalLevies,
      defaultLevies: () => [],
      products: {
        smartphone: { dutyRate: 0, source: 'SARS tariff book commonly places smartphones at free rate.' },
        laptop: { dutyRate: 0, source: 'SARS tariff book commonly places portable computers at free rate.' },
        'solar-panel': { dutyRate: 10, source: 'ITAC/SARS tariff note for photovoltaic modules at 10% customs duty.' },
        generator: { dutyRate: 5, source: 'Machinery fallback aligned to existing SARS broad tariff treatment.' },
        rice: { dutyRate: 0, source: 'Rice often enters under low or free customs rate, excluding anti-dumping or permit issues.' },
        cement: { dutyRate: 0, source: 'Cement customs rate excludes trade-remedy duties not modeled here.' },
        'clothing-bale': { dutyRate: 45, source: 'Clothing remains a protected tariff line in South Africa.' },
        'cosmetics-kit': { dutyRate: 20, source: 'Cosmetics follow standard ad valorem customs lines before any luxury ad valorem tax.' }
      }
    },
    Egypt: {
      rate: 30,
      symbol: 'EGP',
      currency: 'EGP',
      authority: 'ECA',
      vatRate: 14,
      vatBase: defaultVatBase,
      defaultLevies: () => [],
      products: {
        smartphone: { dutyRate: 10, source: 'Egypt product-specific rate is a conservative tariff-band inference within the post-Decree 419/2018 consumer-electronics schedule.' },
        laptop: { dutyRate: 5, source: 'Egypt laptop rate is modeled as a lower capital-goods/computing tariff band under the published tariff framework.' },
        'solar-panel': { dutyRate: 10, source: 'Egypt solar-panel rate is modeled as a reduced industrial-energy equipment tariff band; exact line-item confirmation still recommended.' },
        generator: { dutyRate: 5, source: 'Egypt generator rate is modeled as a machinery/capital-equipment tariff band.' },
        rice: { dutyRate: 20, source: 'Egypt rice rate is modeled as a protected food-products band and should be verified against the active customs line and any quota or permit rules.' },
        cement: { dutyRate: 20, source: 'Egypt cement rate is modeled using the published lower-than-50% glass/panel/building-material tariff trend from the 2018 customs schedule revision.' },
        'clothing-bale': { dutyRate: 30, source: 'Egypt clothing/textile rate is modeled as a protected consumer-goods band in the current tariff framework.' },
        'cosmetics-kit': { dutyRate: 20, source: 'Egypt cosmetics rate is modeled as a mid-band consumer-products tariff under the current customs framework.' }
      }
    },
    Morocco: {
      rate: 10,
      symbol: 'MAD',
      currency: 'MAD',
      authority: 'ADII',
      vatRate: 20,
      vatBase: defaultVatBase,
      defaultLevies: () => [],
      products: {
        smartphone: { dutyRate: 10, source: 'Morocco smartphone rate is modeled inside the 2.5%-35% tariff range reported in the official Morocco import guide; exact ADII line should still be verified.' },
        laptop: { dutyRate: 2.5, source: 'Morocco laptop rate is modeled as a lower industrial/computing tariff line within the official 2.5%-35% range.' },
        'solar-panel': { dutyRate: 2.5, source: 'Morocco solar-panel rate is modeled as a low industrial-equipment tariff line pending exact ADII line verification.' },
        generator: { dutyRate: 10, source: 'Morocco generator rate is modeled as a mid-band machinery tariff line within the official tariff range.' },
        rice: { dutyRate: 25, source: 'Morocco rice rate is modeled as a protected food-products band within the official tariff range and may vary with quotas or corridor rules.' },
        cement: { dutyRate: 10, source: 'Morocco cement rate is modeled as a mid-band building-materials tariff line.' },
        'clothing-bale': { dutyRate: 25, source: 'Morocco clothing/textile rate is modeled as a protected consumer-goods tariff line.' },
        'cosmetics-kit': { dutyRate: 17.5, source: 'Morocco cosmetics rate is modeled as a mid-band consumer-products tariff line within the official tariff range.' }
      }
    }
  };

  function getProfile(key) {
    return PRODUCT_PROFILES.find((profile) => profile.key === key) || null;
  }

  function buildResult(countryName, profile, fob, shipping, config) {
    const cif = fob + shipping;
    const dutyRate = (config.dutyRate || 0) / 100;
    const duty = cif * dutyRate;
    const levyItems = (config.levies || (() => []))(cif, fob, duty, profile) || [];
    const totalLevies = sumAmounts(levyItems);
    const vatRate = config.vatRate == null ? 0 : config.vatRate;
    const vatBase = (config.vatBase || defaultVatBase)(cif, duty, totalLevies, profile);
    const vat = vatBase * (vatRate / 100);
    const totalUSD = cif + duty + totalLevies + vat;
    const totalLocal = totalUSD * config.rate;
    return {
      countryName: countryName,
      category: profile.label,
      categoryKey: profile.key,
      hsCode: profile.hsCode,
      fob: fob,
      shipping: shipping,
      cif: cif,
      dutyRate: dutyRate,
      duty: duty,
      levyItems: levyItems,
      totalLevies: totalLevies,
      vat: vat,
      vatRate: vatRate,
      totalUSD: totalUSD,
      totalLocal: totalLocal,
      currency: config.currency,
      symbol: config.symbol,
      rate: config.rate,
      authority: config.authority,
      profileLabel: profile.label,
      baseCategory: profile.baseCategory,
      sourceNote: config.source || '',
      flag: ''
    };
  }

  function computeVehicle(countryName, profile, fob, shipping) {
    const rules = VEHICLE_RULES[countryName];
    if (!rules || !profile || !profile.vehicleType) return null;
    const levies = (cif, origFob) => {
      const levyItems = rules.levies(cif, origFob, profile.vehicleType === 'electric');
      const firstDutyItem = levyItems.find((item) => item.name.toLowerCase().includes('duty'));
      return levyItems.map((item) => Object.assign({}, item, {
        isPrimaryDuty: firstDutyItem && item.name === firstDutyItem.name
      }));
    };
    const result = buildResult(countryName, profile, fob, shipping, {
      rate: rules.rate,
      symbol: rules.symbol,
      currency: rules.currency,
      authority: rules.authority,
      dutyRate: 0,
      levies: levies,
      vatRate: rules.vatRate,
      vatBase: function (cif, duty, totalLevies) {
        return rules.vatBase(cif, duty, totalLevies, profile.vehicleType === 'electric');
      },
      source: rules.source
    });
    const firstDutyItem = result.levyItems.find((item) => item.isPrimaryDuty);
    result.duty = firstDutyItem ? firstDutyItem.amount : 0;
    result.dutyRate = result.cif > 0 ? result.duty / result.cif : 0;
    result.levyItems = result.levyItems.map((item) => {
      const clone = Object.assign({}, item);
      delete clone.isPrimaryDuty;
      return clone;
    });
    return result;
  }

  function computeGoods(countryName, profile, fob, shipping) {
    const country = COUNTRY_PRODUCT_RULES[countryName];
    if (!country || !profile || profile.vehicleType) return null;
    const product = country.products[profile.key];
    if (!product) return null;
    return buildResult(countryName, profile, fob, shipping, {
      rate: country.rate,
      symbol: country.symbol,
      currency: country.currency,
      authority: country.authority,
      dutyRate: product.dutyRate,
      levies: product.levies || country.defaultLevies,
      vatRate: product.vatRate == null ? country.vatRate : product.vatRate,
      vatBase: product.vatBase || country.vatBase,
      source: product.source
    });
  }

  window.AfroImportDutyRules = {
    profiles: PRODUCT_PROFILES,
    hsCodes: HS_CODES,
    getProfile: getProfile,
    compute: function (countryName, categoryKey, fob, shipping) {
      const profile = getProfile(categoryKey);
      if (!profile) return null;
      return computeVehicle(countryName, profile, fob, shipping) || computeGoods(countryName, profile, fob, shipping);
    }
  };
})();
