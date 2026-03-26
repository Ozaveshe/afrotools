/* AfroTools — EAC Common External Tariff Engine /engines/eac-cet-engine.js */
var EacCetEngine = (function () {
  'use strict';

  /* ── Member States ───────────────────────────────────── */
  var MEMBER_STATES = [
    { code: 'KE', name: 'Kenya',       joined: 2000, authority: 'KRA',  flag: '🇰🇪' },
    { code: 'TZ', name: 'Tanzania',    joined: 2000, authority: 'TRA',  flag: '🇹🇿' },
    { code: 'UG', name: 'Uganda',      joined: 2000, authority: 'URA',  flag: '🇺🇬' },
    { code: 'RW', name: 'Rwanda',      joined: 2007, authority: 'RRA',  flag: '🇷🇼' },
    { code: 'BI', name: 'Burundi',     joined: 2007, authority: 'OBR',  flag: '🇧🇮' },
    { code: 'SS', name: 'South Sudan', joined: 2016, authority: 'NRA',  flag: '🇸🇸', note: 'Contact NRA for current rates' },
    { code: 'CD', name: 'DR Congo',    joined: 2022, authority: 'DGDA', flag: '🇨🇩', note: 'Transitional — full CET adoption by 2027' }
  ];

  /* ── Tariff Bands ───────────────────────────────────── */
  var TARIFF_BANDS = [
    {
      band: 0, rate: 0, color: '#34C759', label: 'Band 0',
      description: 'Raw materials, capital goods, agricultural inputs',
      examples: ['Crude oil', 'Industrial machinery', 'Agricultural tractors', 'Fertilizers', 'Seeds', 'Coffee beans (raw)', 'Iron ore']
    },
    {
      band: 10, rate: 10, color: '#007AFF', label: 'Band 10',
      description: 'Semi-processed / intermediate goods',
      examples: ['Cotton yarn', 'Semi-processed steel', 'Pharmaceutical ingredients', 'Refined petroleum', 'Paper pulp']
    },
    {
      band: 25, rate: 25, color: '#FF9F0A', label: 'Band 25',
      description: 'Finished goods (standard)',
      examples: ['Cement', 'Motorcycles', 'Electronic appliances', 'New clothing', 'Processed foods', 'Passenger vehicles']
    },
    {
      band: 35, rate: 35, color: '#FF3B30', label: 'Band 35',
      description: 'Finished goods (extra protection)',
      examples: ['Used clothing / mitumba ($0.40/kg)', 'Certain furniture', 'Some plasticware']
    }
  ];

  /* ── Sensitive Items ─────────────────────────────────── */
  var SENSITIVE_ITEMS = [
    {
      category: 'Dairy Products',
      hsRange: '0401–0406',
      hsCodes: ['04'],
      cetRate: 60,
      color: '#FF3B30',
      description: 'Milk, cheese, butter and other dairy. Highest protection to safeguard EAC dairy farmers.',
      notes: 'Rate can reach 60% to protect local dairy industries. Some exemptions for infant formula.',
      examples: ['Fresh milk', 'Powdered milk', 'Cheese', 'Butter', 'Yoghurt', 'Cream', 'Whey']
    },
    {
      category: 'Cereals & Grain',
      hsRange: '1001–1008',
      hsCodes: ['10'],
      cetRate: 75,
      color: '#FF3B30',
      description: 'Wheat, rice, maize, sorghum. Rates 25–75% depending on product and season.',
      notes: 'Rice (HS 1006) faces up to 75% or specific duty. Wheat 35%. Maize 50% when domestic supply is adequate.',
      examples: ['Wheat', 'Rice', 'Maize/Corn', 'Barley', 'Sorghum', 'Millet', 'Oats']
    },
    {
      category: 'Sugar',
      hsRange: '1701–1703',
      hsCodes: ['17'],
      cetRate: 100,
      color: '#8B0000',
      description: 'Cane sugar and refined sugar. Highest CET rate at 100% or $200/tonne (whichever is higher).',
      notes: 'Sugar attracts EAC\'s maximum protection. Applied as 100% ad valorem or USD 200/tonne specific duty.',
      examples: ['Raw cane sugar', 'Refined white sugar', 'Brown sugar', 'Molasses', 'Sugar confectionery']
    },
    {
      category: 'Textiles & Apparel',
      hsRange: '5001–6309',
      hsCodes: ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63'],
      cetRate: 35,
      color: '#FF9F0A',
      description: 'Fabrics, yarn, new and used clothing. New garments 25–35%; used clothing (mitumba) $0.40/kg.',
      notes: 'Used clothing (HS 6309) subject to specific duty of USD 0.40/kg. New garments 25–35% ad valorem.',
      examples: ['Cotton fabric', 'New shirts', 'New dresses', 'Used clothing (mitumba)', 'Yarn', 'Kanga/Kitenge', 'Blankets']
    },
    {
      category: 'Passenger Vehicles',
      hsRange: '8703',
      hsCodes: ['87'],
      cetRate: 25,
      color: '#FF9F0A',
      description: 'Cars and passenger automobiles. Standard 25% CET applies. Used vehicles attract additional age levies.',
      notes: 'New passenger cars 25%. Used vehicles may attract additional charges by individual member states.',
      examples: ['New passenger cars', 'SUVs', 'Minivans', 'Used vehicles', 'Electric vehicles', 'Hybrid cars']
    },
    {
      category: 'Cement',
      hsRange: '2523',
      hsCodes: ['25'],
      cetRate: 25,
      color: '#FF9F0A',
      description: 'Portland cement, alumina cement and similar. Protected at 25% to support local cement industries.',
      notes: 'Clinker (HS 2523.10) may qualify for Band 0 (0%) when imported for local cement production.',
      examples: ['Portland cement', 'Bagged cement', 'Bulk cement', 'Cement clinker', 'Alumina cement']
    },
    {
      category: 'Iron, Steel & Products',
      hsRange: '7201–7326',
      hsCodes: ['72', '73'],
      cetRate: 25,
      color: '#007AFF',
      description: 'Iron ore, steel billets and finished steel products. Rates 0–25% depending on processing level.',
      notes: 'Iron ore (HS 2601) Band 0 (0%). Steel billets/ingots 10%. Finished steel bars/rods 25%.',
      examples: ['Iron ore', 'Steel billets', 'Steel bars/rods', 'Steel sheets', 'Wire rod', 'Structural steel', 'Pipes']
    }
  ];

  /* ── Duty Remission ──────────────────────────────────── */
  var DUTY_REMISSION = {
    description: 'The EAC Duty Remission Scheme allows manufacturers to import raw materials and intermediate goods at 0% customs duty, provided the finished product will be exported from the EAC region or qualifies for domestic production incentives.',
    legalBasis: 'EAC Customs Management Act, Section 140 and EAC Duty Remission Regulations',
    categories: [
      {
        name: 'Pharmaceutical Manufacturing',
        rate: 0,
        eligible: 'Active pharmaceutical ingredients (APIs), excipients, packaging materials',
        hsCodes: ['29', '30'],
        conditions: 'Finished medicines must be sold within EAC or exported. GMP-certified facility required.',
        benefit: '0% duty on qualifying inputs; saves 10–25% of CIF value'
      },
      {
        name: 'Textile & Apparel Manufacturing',
        rate: 0,
        eligible: 'Cotton yarn, synthetic fibers, fabric, zips, buttons, labels',
        hsCodes: ['52', '54', '55', '96'],
        conditions: 'At least 25% value addition in EAC. EAC Certificate of Origin required on finished goods.',
        benefit: '0% duty on fabric inputs; enables competitive export pricing'
      },
      {
        name: 'Packaging Materials',
        rate: 0,
        eligible: 'Printed packaging, cartons, plastic containers, glass bottles (for export products)',
        hsCodes: ['39', '48', '70'],
        conditions: 'Packaging must be for goods to be exported from EAC.',
        benefit: '0% on packaging inputs for export-bound production'
      },
      {
        name: 'Industrial Machinery & Parts',
        rate: 0,
        eligible: 'Capital machinery, tools, spare parts for manufacturing operations',
        hsCodes: ['84', '85'],
        conditions: 'Must be for use in a registered manufacturing operation. Bond may be required.',
        benefit: '0% duty saving vs. standard 0–10% CET band rates'
      },
      {
        name: 'Agricultural Processing',
        rate: 0,
        eligible: 'Food processing equipment, cold chain, packaging for agro-processing',
        hsCodes: ['84', '39', '48'],
        conditions: 'Agro-processor registered with relevant national authority.',
        benefit: '0% on processing equipment; supports value addition'
      }
    ],
    process: [
      { step: 1, title: 'Register with Revenue Authority', detail: 'Apply to national customs authority (KRA/TRA/URA/RRA/OBR) for Duty Remission status. Present business registration, manufacturing licence and premises details.' },
      { step: 2, title: 'Submit Application with HS Codes', detail: 'List all raw materials and inputs with their HS codes and estimated annual quantities. Provide the finished product HS code and intended market.' },
      { step: 3, title: 'Approval & Bond Execution', detail: 'Authority reviews application (typically 2–4 weeks). If approved, a customs bond equal to the duty foregone may be required.' },
      { step: 4, title: 'Import Under Remission', detail: 'Each import consignment is declared under Duty Remission permit. Customs verifies against approved list of goods.' },
      { step: 5, title: 'Annual Reconciliation', detail: 'Submit production records annually showing inputs used vs. finished goods produced. Unutilised imports may attract duty payment.' }
    ],
    cooRequirements: {
      title: 'EAC Certificate of Origin (COO)',
      description: 'Goods manufactured in an EAC member state qualify for duty-free trade within the EAC — provided they meet rules of origin criteria.',
      criteria: [
        'Wholly Obtained: Goods entirely grown, mined or manufactured in the EAC (e.g., fresh produce, minerals)',
        'Value Addition: At least 35% of the ex-factory price is value added within the EAC',
        'Change of Tariff Heading (CTH): The HS chapter or heading of the finished product differs from all non-EAC inputs',
        'Specific Process Rule: Certain goods (textiles, chemicals) must undergo specific processes within the EAC'
      ],
      issuingAuthority: 'National Chambers of Commerce or Revenue Authorities in each member state',
      validity: '12 months from date of issue',
      benefit: '0% import duty on intra-EAC trade (vs. 0–100% on extra-EAC imports)'
    }
  };

  /* ── Additional Charges by Country ──────────────────── */
  var ADDITIONAL_CHARGES = {
    KE: [
      { name: 'Import Declaration Fee (IDF)', rate: 3.5, base: 'cif' },
      { name: 'Railway Development Levy (RDL)', rate: 2.5, base: 'cif' },
      { name: 'VAT', rate: 16, base: 'cif_duty_levies', isVat: true }
    ],
    TZ: [
      { name: 'Import Declaration Fee', rate: 1.0, base: 'cif' },
      { name: 'Railway Development Levy', rate: 1.5, base: 'cif' },
      { name: 'VAT', rate: 18, base: 'cif_duty_levies', isVat: true }
    ],
    UG: [
      { name: 'Import Declaration Fee', rate: 2.0, base: 'cif' },
      { name: 'Infrastructure Levy', rate: 1.5, base: 'cif' },
      { name: 'Withholding Tax (commercial)', rate: 6.0, base: 'cif', note: 'Creditable against income tax' },
      { name: 'VAT', rate: 18, base: 'cif_duty_levies', isVat: true }
    ],
    RW: [
      { name: 'Infrastructure Development Surcharge', rate: 1.5, base: 'cif' },
      { name: 'AU Levy', rate: 0.2, base: 'cif' },
      { name: 'VAT', rate: 18, base: 'cif_duty_levies', isVat: true }
    ],
    BI: [
      { name: 'Transaction Tax', rate: 1.0, base: 'cif' },
      { name: 'VAT', rate: 18, base: 'cif_duty_levies', isVat: true }
    ]
  };

  /* ── Products Array (~50 products) ──────────────────── */
  var PRODUCTS = [
    /* Band 0 — Raw materials / capital goods */
    { name: 'Agricultural Tractors',         hsChapter: 87, hsRange: '8701', cetRate: 0,  band: 0,  category: 'Agriculture & Machinery' },
    { name: 'Fertilizers (Compound NPK)',     hsChapter: 31, hsRange: '3105', cetRate: 0,  band: 0,  category: 'Agricultural Inputs' },
    { name: 'Seeds (Maize, Wheat, Veg)',      hsChapter: 12, hsRange: '1209', cetRate: 0,  band: 0,  category: 'Agricultural Inputs' },
    { name: 'Crude Petroleum Oil',            hsChapter: 27, hsRange: '2709', cetRate: 0,  band: 0,  category: 'Energy & Fuels' },
    { name: 'Iron Ore & Concentrates',        hsChapter: 26, hsRange: '2601', cetRate: 0,  band: 0,  category: 'Minerals & Metals' },
    { name: 'Industrial Machinery (General)', hsChapter: 84, hsRange: '8479', cetRate: 0,  band: 0,  category: 'Machinery & Equipment' },
    { name: 'Medical / Lab Equipment',        hsChapter: 90, hsRange: '9018', cetRate: 0,  band: 0,  category: 'Healthcare' },
    { name: 'Coffee Beans (Raw/Green)',        hsChapter: 9,  hsRange: '0901', cetRate: 0,  band: 0,  category: 'Agriculture & Food' },
    { name: 'Tea Leaves (Unprocessed)',        hsChapter: 9,  hsRange: '0902', cetRate: 0,  band: 0,  category: 'Agriculture & Food' },
    { name: 'Pesticides & Herbicides',        hsChapter: 38, hsRange: '3808', cetRate: 0,  band: 0,  category: 'Agricultural Inputs' },
    { name: 'Printing Machinery',             hsChapter: 84, hsRange: '8443', cetRate: 0,  band: 0,  category: 'Machinery & Equipment' },
    { name: 'Dairy Processing Equipment',     hsChapter: 84, hsRange: '8434', cetRate: 0,  band: 0,  category: 'Machinery & Equipment' },
    { name: 'Electric Generators',            hsChapter: 85, hsRange: '8502', cetRate: 0,  band: 0,  category: 'Energy & Electrical' },
    { name: 'Solar Panels (Photovoltaic)',     hsChapter: 85, hsRange: '8541', cetRate: 0,  band: 0,  category: 'Energy & Electrical' },

    /* Band 10 — Intermediate / semi-processed */
    { name: 'Refined Petroleum (Diesel)',     hsChapter: 27, hsRange: '2710', cetRate: 10, band: 10, category: 'Energy & Fuels' },
    { name: 'Cotton Yarn',                    hsChapter: 52, hsRange: '5205', cetRate: 10, band: 10, category: 'Textiles & Apparel' },
    { name: 'Steel Billets & Ingots',         hsChapter: 72, hsRange: '7207', cetRate: 10, band: 10, category: 'Iron & Steel' },
    { name: 'Pharmaceutical Ingredients (API)', hsChapter: 29, hsRange: '2941', cetRate: 0, band: 0,  category: 'Healthcare' },
    { name: 'Paper Pulp',                     hsChapter: 47, hsRange: '4703', cetRate: 10, band: 10, category: 'Paper & Packaging' },
    { name: 'Aluminium Ingots',               hsChapter: 76, hsRange: '7601', cetRate: 10, band: 10, category: 'Minerals & Metals' },
    { name: 'Copper Wire (Uninsulated)',       hsChapter: 74, hsRange: '7408', cetRate: 10, band: 10, category: 'Minerals & Metals' },
    { name: 'Synthetic Fibers (Polyester)',    hsChapter: 54, hsRange: '5402', cetRate: 10, band: 10, category: 'Textiles & Apparel' },
    { name: 'Flat-Rolled Steel (Hot Rolled)',  hsChapter: 72, hsRange: '7208', cetRate: 10, band: 10, category: 'Iron & Steel' },
    { name: 'Plastic Granules (Polyethylene)', hsChapter: 39, hsRange: '3901', cetRate: 10, band: 10, category: 'Plastics & Chemicals' },
    { name: 'Vegetable Oils (Crude Palm)',     hsChapter: 15, hsRange: '1511', cetRate: 10, band: 10, category: 'Agriculture & Food' },

    /* Band 25 — Finished goods (standard) */
    { name: 'Portland Cement',                hsChapter: 25, hsRange: '2523', cetRate: 25, band: 25, category: 'Building Materials' },
    { name: 'Motorcycles (New)',               hsChapter: 87, hsRange: '8711', cetRate: 25, band: 25, category: 'Vehicles & Transport' },
    { name: 'Passenger Vehicles (New)',        hsChapter: 87, hsRange: '8703', cetRate: 25, band: 25, category: 'Vehicles & Transport' },
    { name: 'Commercial Trucks & Lorries',     hsChapter: 87, hsRange: '8704', cetRate: 25, band: 25, category: 'Vehicles & Transport' },
    { name: 'Refrigerators & Freezers',        hsChapter: 84, hsRange: '8418', cetRate: 25, band: 25, category: 'Electronics & Appliances' },
    { name: 'Television Sets',                 hsChapter: 85, hsRange: '8528', cetRate: 25, band: 25, category: 'Electronics & Appliances' },
    { name: 'Mobile Phones / Smartphones',     hsChapter: 85, hsRange: '8517', cetRate: 25, band: 25, category: 'Electronics & Appliances' },
    { name: 'New Clothing (Woven)',             hsChapter: 62, hsRange: '6201', cetRate: 25, band: 25, category: 'Textiles & Apparel' },
    { name: 'Footwear (Leather)',               hsChapter: 64, hsRange: '6403', cetRate: 25, band: 25, category: 'Footwear & Accessories' },
    { name: 'Processed Foods (Canned)',         hsChapter: 16, hsRange: '1602', cetRate: 25, band: 25, category: 'Agriculture & Food' },
    { name: 'Sugar (Refined White)',            hsChapter: 17, hsRange: '1701', cetRate: 100, band: 35, category: 'Agriculture & Food' },
    { name: 'Biscuits & Pastries',              hsChapter: 19, hsRange: '1905', cetRate: 25, band: 25, category: 'Agriculture & Food' },
    { name: 'Mineral Water / Soft Drinks',      hsChapter: 22, hsRange: '2202', cetRate: 25, band: 25, category: 'Beverages' },
    { name: 'Beer & Malt Beverages',            hsChapter: 22, hsRange: '2203', cetRate: 25, band: 25, category: 'Beverages' },
    { name: 'Cigarettes & Tobacco Products',    hsChapter: 24, hsRange: '2402', cetRate: 25, band: 25, category: 'Tobacco' },
    { name: 'Steel Bars & Rods (Reinforcing)',  hsChapter: 72, hsRange: '7214', cetRate: 25, band: 25, category: 'Iron & Steel' },
    { name: 'Ceramic Tiles',                    hsChapter: 69, hsRange: '6907', cetRate: 25, band: 25, category: 'Building Materials' },
    { name: 'Glass (Float / Plate)',             hsChapter: 70, hsRange: '7005', cetRate: 25, band: 25, category: 'Building Materials' },
    { name: 'Plastic Pipes & Fittings',         hsChapter: 39, hsRange: '3917', cetRate: 25, band: 25, category: 'Plastics & Chemicals' },
    { name: 'Paints & Varnishes',               hsChapter: 32, hsRange: '3210', cetRate: 25, band: 25, category: 'Plastics & Chemicals' },
    { name: 'Household Furniture (Wood)',        hsChapter: 94, hsRange: '9403', cetRate: 25, band: 25, category: 'Furniture & Household' },
    { name: 'Mattresses & Bedding',             hsChapter: 94, hsRange: '9404', cetRate: 25, band: 25, category: 'Furniture & Household' },
    { name: 'Packaged Pharmaceuticals',         hsChapter: 30, hsRange: '3004', cetRate: 0,  band: 0,  category: 'Healthcare' },

    /* Band 35 — Finished goods (extra protection) */
    { name: 'Used Clothing (Mitumba)',          hsChapter: 63, hsRange: '6309', cetRate: 35, band: 35, category: 'Textiles & Apparel' },
    { name: 'Used Footwear (Second-hand)',       hsChapter: 64, hsRange: '6404', cetRate: 35, band: 35, category: 'Footwear & Accessories' },
    { name: 'Plastic Tableware & Kitchenware',  hsChapter: 39, hsRange: '3924', cetRate: 35, band: 35, category: 'Plastics & Chemicals' },
    { name: 'Dairy Products (Milk/Cheese)',      hsChapter: 4,  hsRange: '0402', cetRate: 60, band: 35, category: 'Agriculture & Food' },
    { name: 'Rice (Milled)',                     hsChapter: 10, hsRange: '1006', cetRate: 75, band: 35, category: 'Agriculture & Food' },
    { name: 'Wheat Flour',                       hsChapter: 11, hsRange: '1101', cetRate: 35, band: 35, category: 'Agriculture & Food' }
  ];

  /* ── Engine Functions ────────────────────────────────── */

  function search(query) {
    if (!query || query.trim() === '') return PRODUCTS;
    var q = query.trim().toLowerCase();
    var results = [];
    var scored = PRODUCTS.map(function (p) {
      var nameMatch   = p.name.toLowerCase().indexOf(q) !== -1;
      var hsMatch     = p.hsRange.indexOf(q) !== -1;
      var catMatch    = p.category.toLowerCase().indexOf(q) !== -1;
      var chapterMatch = String(p.hsChapter).indexOf(q) !== -1;
      var score = 0;
      if (p.name.toLowerCase().startsWith(q))   score += 10;
      else if (nameMatch)                        score += 6;
      if (p.hsRange.startsWith(q))               score += 8;
      else if (hsMatch)                          score += 4;
      if (catMatch)                              score += 2;
      if (chapterMatch)                          score += 1;
      return { product: p, score: score };
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.filter(function (s) { return s.score > 0; }).map(function (s) { return s.product; });
  }

  function calculate(params) {
    var cifValue    = parseFloat(params.cifValue) || 0;
    var cetRate     = parseFloat(params.cetRate)  || 0;
    var countryCode = params.countryCode || 'KE';
    var charges     = ADDITIONAL_CHARGES[countryCode] || ADDITIONAL_CHARGES.KE;

    var cetDuty = cifValue * cetRate / 100;
    var breakdown = [];
    breakdown.push({ name: 'CIF Value', amount: cifValue, rate: null, note: 'Cost, Insurance & Freight' });
    breakdown.push({ name: 'EAC Common External Tariff (' + cetRate + '%)', amount: cetDuty, rate: cetRate, note: 'Applied to CIF value' });

    var nonVatLeviesTotal = 0;
    var vatCharge = null;

    charges.forEach(function (charge) {
      if (charge.isVat) {
        vatCharge = charge;
      } else {
        var amt = cifValue * charge.rate / 100;
        nonVatLeviesTotal += amt;
        breakdown.push({
          name: charge.name + ' (' + charge.rate + '%)',
          amount: amt,
          rate: charge.rate,
          note: charge.note || ''
        });
      }
    });

    var vatBase = cifValue + cetDuty + nonVatLeviesTotal;
    var vatAmount = 0;
    if (vatCharge) {
      vatAmount = vatBase * vatCharge.rate / 100;
      breakdown.push({
        name: vatCharge.name + ' (' + vatCharge.rate + '%)',
        amount: vatAmount,
        rate: vatCharge.rate,
        note: 'Applied on CIF + duty + levies'
      });
    }

    var totalDuty   = cetDuty;
    var totalLevies = nonVatLeviesTotal;
    var totalLanded = cifValue + cetDuty + nonVatLeviesTotal + vatAmount;
    var effectiveRate = cifValue > 0 ? ((totalLanded - cifValue) / cifValue * 100) : 0;

    return {
      breakdown:     breakdown,
      cetDuty:       cetDuty,
      totalDuty:     totalDuty,
      totalLevies:   totalLevies,
      vatAmount:     vatAmount,
      totalLanded:   totalLanded,
      effectiveRate: effectiveRate
    };
  }

  function compareCountries(cifValue, cetRate) {
    var countries = ['KE', 'TZ', 'UG', 'RW', 'BI'];
    var countryNames = { KE: 'Kenya', TZ: 'Tanzania', UG: 'Uganda', RW: 'Rwanda', BI: 'Burundi' };
    var flags = { KE: '🇰🇪', TZ: '🇹🇿', UG: '🇺🇬', RW: '🇷🇼', BI: '🇧🇮' };

    return countries.map(function (code) {
      var result = calculate({ cifValue: cifValue, cetRate: cetRate, countryCode: code });
      var charges = ADDITIONAL_CHARGES[code] || [];
      var levyItems = charges.filter(function (c) { return !c.isVat; }).map(function (c) {
        return { name: c.name, amount: cifValue * c.rate / 100, rate: c.rate };
      });
      var leviesSubtotal = levyItems.reduce(function (sum, l) { return sum + l.amount; }, 0);
      return {
        code:          code,
        name:          countryNames[code],
        flag:          flags[code],
        cetDuty:       result.cetDuty,
        levies:        levyItems,
        leviesSubtotal: leviesSubtotal,
        vat:           result.vatAmount,
        totalLanded:   result.totalLanded,
        effectiveRate: result.effectiveRate
      };
    });
  }

  function getSensitiveItems() {
    return SENSITIVE_ITEMS;
  }

  function getDutyRemission() {
    return DUTY_REMISSION;
  }

  function getMemberStates() {
    return MEMBER_STATES;
  }

  function getTariffBands() {
    return TARIFF_BANDS;
  }

  function getProductByHs(hsChapter) {
    var ch = parseInt(hsChapter, 10);
    return PRODUCTS.find(function (p) { return p.hsChapter === ch; }) || null;
  }

  /* ── Public API ──────────────────────────────────────── */
  return {
    search:           search,
    calculate:        calculate,
    compareCountries: compareCountries,
    getSensitiveItems: getSensitiveItems,
    getDutyRemission: getDutyRemission,
    getMemberStates:  getMemberStates,
    getTariffBands:   getTariffBands,
    getProductByHs:   getProductByHs,
    PRODUCTS:         PRODUCTS
  };

})();
