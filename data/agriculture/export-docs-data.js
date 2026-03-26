// /data/agriculture/export-docs-data.js
// AfroTools — Agricultural Export Documentation Data
// Covers all 54 African countries
// ═══════════════════════════════════════════════════════════
(function () {
  'use strict';
  window.AfroTools = window.AfroTools || {};

  // ── Crop key → export product label ──────────────────────
  var CROP_LABELS = {
    cocoa: 'Cocoa Beans',
    coffee_arabica: 'Coffee (Arabica)',
    coffee_robusta: 'Coffee (Robusta)',
    cashew: 'Cashew Nuts (Raw)',
    cotton: 'Raw Cotton',
    sesame: 'Sesame Seeds',
    groundnut: 'Groundnuts / Peanuts',
    maize: 'Maize / Corn',
    rice: 'Rice',
    cassava: 'Cassava / Dried Cassava',
    yam: 'Yam',
    oil_palm: 'Palm Oil / Palm Kernel',
    rubber: 'Natural Rubber',
    sugar_cane: 'Sugar / Raw Sugar',
    tea: 'Tea (Made)',
    tobacco: 'Tobacco Leaf',
    citrus: 'Citrus Fruits',
    avocado: 'Avocado',
    mango: 'Mango',
    banana: 'Banana',
    plantain: 'Plantain',
    vanilla: 'Vanilla Beans',
    clove: 'Cloves',
    dates: 'Dates',
    soybean: 'Soybeans',
    sunflower: 'Sunflower Seeds',
    wheat: 'Wheat',
    sorghum: 'Sorghum',
    millet: 'Millet',
    potato: 'Potatoes',
    tomato: 'Tomatoes',
    grape: 'Grapes / Wine',
    olive: 'Olives / Olive Oil',
    pineapple: 'Pineapple',
    cowpea: 'Cowpea / Black-eyed Peas',
    teff: 'Teff',
    lentils: 'Lentils',
    enset: 'Enset',
    fonio: 'Fonio',
    pigeon_pea: 'Pigeon Peas',
    sisal: 'Sisal',
    coconut: 'Coconut / Copra',
    common_bean: 'Dried Beans',
    sweet_potato: 'Sweet Potato',
    barley: 'Barley',
    chickpea: 'Chickpeas'
  };

  // ── Documents always required (all 54 countries) ──────────
  var COMMON_DOCS = [
    {
      id: 'business_reg',
      name: 'Business Registration Certificate',
      description: 'Proof your company/business is legally registered in the country.',
      category: 'business',
      typicalCost: '$50–500 (varies)',
      timeToObtain: '1–4 weeks',
      issuedBy: 'Company registrar / business registration authority',
      tips: 'Get this first — almost every other document requires it. Ensure your business is registered for trading activities, not just general services.'
    },
    {
      id: 'export_license',
      name: 'Export License / Export Permit',
      description: 'Government authorisation to export goods commercially. May be commodity-specific.',
      category: 'trade',
      typicalCost: '$50–200',
      timeToObtain: '1–2 weeks',
      issuedBy: 'Ministry of Trade / Export Promotion Agency',
      tips: 'Some countries issue a general export license; others require separate permits per commodity (e.g., cocoa, coffee, cashew).'
    },
    {
      id: 'phytosanitary',
      name: 'Phytosanitary Certificate',
      description: 'Certifies agricultural products are free from pests and diseases. Mandatory under WTO/SPS Agreement.',
      category: 'quality',
      typicalCost: '$20–100 per shipment',
      timeToObtain: '2–5 days after inspection',
      issuedBy: 'National Plant Protection Organisation (NPPO) / Plant Quarantine Service',
      tips: 'Inspector visits warehouse or port to inspect goods. EU has the strictest requirements — ensure compliance with EU MRLs (Maximum Residue Levels) if exporting to Europe.'
    },
    {
      id: 'certificate_of_origin',
      name: 'Certificate of Origin (Standard)',
      description: 'Certifies where the product was grown/produced. Needed for customs and tariff classification.',
      category: 'trade',
      typicalCost: '$10–50',
      timeToObtain: '1–3 days',
      issuedBy: 'Chamber of Commerce or Ministry of Trade',
      tips: 'A standard CoO is for non-preferential trade. For reduced tariffs under AfCFTA, ECOWAS, EAC or SADC, you need the specific preferential CoO for that agreement.'
    },
    {
      id: 'customs_declaration',
      name: 'Customs Export Declaration (SAD)',
      description: 'Formal declaration of goods being exported — quantity, HS code, value, destination.',
      category: 'customs',
      timeToObtain: '1–2 days',
      issuedBy: 'National Customs Authority (via licensed customs broker)',
      tips: 'Must be filed electronically in most countries. Use a licensed customs agent. The HS code determines whether export duties apply and must match your invoice exactly.'
    },
    {
      id: 'commercial_invoice',
      name: 'Commercial Invoice',
      description: "Seller's invoice to the buyer showing product, quantity, unit price, total value, and Incoterms.",
      category: 'commercial',
      timeToObtain: 'Self-prepared',
      issuedBy: 'Exporter (you)',
      tips: 'Must match the customs declaration exactly. Include: buyer/seller full names and addresses, product HS code, Incoterms (FOB/CIF), currency, and payment terms.'
    },
    {
      id: 'packing_list',
      name: 'Packing List',
      description: 'Detailed inventory of every package/container: weight, dimensions, and number of bags or boxes.',
      category: 'commercial',
      timeToObtain: 'Self-prepared',
      issuedBy: 'Exporter (you)',
      tips: 'Each package should be numbered. Net weight, gross weight and dimensions per package. Customs will cross-check against the invoice.'
    },
    {
      id: 'bill_of_lading',
      name: 'Bill of Lading (ocean) / Airway Bill (air)',
      description: 'Transport document issued by the shipping line or airline. Proof of shipment and title to goods.',
      category: 'transport',
      timeToObtain: 'Issued after loading',
      issuedBy: 'Shipping line / freight forwarder / airline',
      tips: 'Negotiate "clean" Bill of Lading (no remarks about cargo condition). Keep originals — buyer needs them to collect cargo at destination.'
    },
    {
      id: 'quality_cert',
      name: 'Quality / Grade Certificate',
      description: 'Certifies the quality and grade of the agricultural product after inspection.',
      category: 'quality',
      typicalCost: '$30–150',
      timeToObtain: '1–3 days after inspection',
      issuedBy: 'National standards bureau / commodity board / SGS / Bureau Veritas',
      tips: 'Buyers often specify the minimum grade. Cocoa: 1st/2nd grade. Coffee: G1–G5 (specialty vs. commercial). Cashew: KOR (kernel out-turn ratio) tested.'
    },
    {
      id: 'fumigation_cert',
      name: 'Fumigation Certificate',
      description: 'Certifies goods have been fumigated (treated for pests). Required by many importing countries.',
      category: 'quality',
      typicalCost: '$100–400 per container',
      timeToObtain: '1–2 days',
      issuedBy: 'Licensed fumigation company',
      tips: 'Phosphine (aluminium phosphide) is most common for grains/nuts. Wood packaging must comply with ISPM 15 standard. Book in advance — fumigation must occur before container sealing.'
    },
    {
      id: 'weight_cert',
      name: 'Weight Certificate',
      description: 'Certified weight of the shipment from an accredited weighbridge or surveyor.',
      category: 'quality',
      typicalCost: '$20–80',
      timeToObtain: '1 day',
      issuedBy: 'Certified weighbridge operator / licensed surveyor',
      tips: 'Required for payment calculations — buyers pay on certified weight. Use government-certified weighbridges for credibility.'
    },
    {
      id: 'insurance_cert',
      name: 'Insurance Certificate',
      description: 'Proof the shipment is insured against loss/damage during transit.',
      category: 'commercial',
      typicalCost: '0.5%–1.5% of cargo value',
      timeToObtain: '1–2 days',
      issuedBy: 'Licensed marine insurance company',
      tips: 'Required if selling CIF (Cost, Insurance, Freight). Cover should be at least 110% of CIF value. Keep policy in export file.'
    }
  ];

  // ── AfCFTA preferential CoO ───────────────────────────────
  var AFCFTA_DOC = {
    id: 'afcfta_coo',
    name: 'AfCFTA Certificate of Origin (Preferential)',
    description: 'Special CoO to qualify for zero or reduced tariffs under the African Continental Free Trade Area (AfCFTA).',
    category: 'trade',
    typicalCost: '$10–30',
    timeToObtain: '1–3 days',
    issuedBy: 'Designated AfCFTA issuing authority (customs or trade ministry)',
    tips: 'Product must meet Rules of Origin — typically 40% local value added or a Change in Tariff Heading. AfCFTA is operational since Jan 2021 and can eliminate import duties worth 5–35% for intra-African trade. Ask your customs broker specifically about AfCFTA CoO.'
  };

  // ── Destination-specific additional docs ─────────────────
  var DESTINATION_DOCS = {
    eu: [
      {
        id: 'eu_mrl',
        name: 'EU MRL Compliance Test Report',
        description: 'Laboratory test confirming pesticide residues are below EU Maximum Residue Levels (MRLs).',
        category: 'quality',
        typicalCost: '$200–600 per commodity',
        timeToObtain: '5–10 days',
        issuedBy: 'Accredited laboratory (SGS, Intertek, Bureau Veritas)',
        tips: 'EU MRLs are the strictest in the world. Test for the specific pesticides common in your country. Your buyer may specify which lab to use. Failing MRL tests = cargo rejection at EU port.'
      },
      {
        id: 'eu_traces',
        name: 'EU TRACES NT Entry Document',
        description: 'EU electronic system notification for plant products entering the EU. Filed by EU importer.',
        category: 'customs',
        timeToObtain: 'Filed by buyer/importer',
        issuedBy: 'EU importer through TRACES NT system',
        tips: 'Your EU buyer handles this, but you need to provide correct product details (HS code, quantities, origin, phytosanitary certificate number) well in advance of shipment.'
      }
    ],
    us: [
      {
        id: 'us_fda',
        name: 'US FDA Prior Notice',
        description: 'Mandatory advance notification to FDA for food products entering the US. Filed 2–8 hours before arrival.',
        category: 'customs',
        timeToObtain: 'Filed by US importer',
        issuedBy: 'US importer through FDA system',
        tips: 'Your US buyer handles filing, but you need to provide: product description, HS code, manufacturer details, shipper info, and country of origin. Failure = cargo held or refused.'
      },
      {
        id: 'us_cbp',
        name: 'US CBP Entry Documentation',
        description: 'US Customs and Border Protection formal entry documents for commercial imports.',
        category: 'customs',
        timeToObtain: 'Filed by US customs broker',
        issuedBy: 'US licensed customs broker',
        tips: 'Your US buyer\'s customs broker handles this. Ensure your commercial invoice, packing list and CoO are accurate — CBP may examine cargo.'
      }
    ],
    middle_east: [
      {
        id: 'halal_cert',
        name: 'Halal Certificate (if applicable)',
        description: 'Required for processed food products exported to GCC countries (Saudi Arabia, UAE, etc.).',
        category: 'quality',
        typicalCost: '$300–800',
        timeToObtain: '2–4 weeks',
        issuedBy: 'Accredited Islamic certification body',
        tips: 'Required for processed/slaughtered products. Not needed for raw grains, nuts, or beans. Check with your buyer whether they require Halal certification for your specific product.'
      },
      {
        id: 'arab_coo',
        name: 'Arab League Certificate of Origin',
        description: 'CoO for preferential tariffs within Arab League member states.',
        category: 'trade',
        typicalCost: '$10–30',
        timeToObtain: '1–2 days',
        issuedBy: 'Chamber of Commerce',
        tips: 'Relevant for North African countries exporting to Arab League markets.'
      }
    ]
  };

  // ── Country-specific data (all 54 countries) ─────────────
  var COUNTRY_SPECIFIC = {
    // ═══ WEST AFRICA ════════════════════════════════════════
    'NG': {
      tradeBloc: 'ECOWAS',
      currency: 'NGN',
      exportAgency: 'Nigeria Export Promotion Council (NEPC)',
      additionalDocs: [
        { id: 'nepc_reg', name: 'NEPC Exporter Registration', description: 'Mandatory registration with Nigeria Export Promotion Council for all Nigerian exporters.', issuedBy: 'NEPC', cost: '₦10,000–50,000', time: '1–2 weeks', tips: 'Register at nepc.gov.ng. You will receive an NEPC export certificate valid for 2 years.' },
        { id: 'nxp_form', name: 'Form NXP (Export Proceeds Declaration)', description: 'Central Bank of Nigeria form for declaring and repatriating export revenue.', issuedBy: 'Commercial bank / CBN', time: '1–2 days', tips: 'Open at your commercial bank before shipping. You must repatriate export proceeds within 90 days of shipment. Non-compliance = penalties.' },
        { id: 'naqs_phyto', name: 'NAQS Phytosanitary Certificate', description: 'Nigeria Agricultural Quarantine Service phytosanitary inspection and certification.', issuedBy: 'NAQS (Nigeria Agricultural Quarantine Service)', cost: '₦5,000–20,000', time: '2–3 days', tips: 'NAQS inspectors visit at port of export. Book inspection at least 5 days before shipment date.' }
      ],
      commodityDocs: {
        cocoa: [{ id: 'ccri', name: 'Clean Certificate of Inspection (CCRI)', description: 'Pre-shipment inspection certificate for cocoa. Required since 1986.', issuedBy: 'Authorised inspection agents (SGS, Cotecna, Bureau Veritas)', tips: 'Inspection covers quality grading, moisture, bean count. Only Grade 1 and Grade 2 cocoa can be exported.' }],
        cashew: [{ id: 'cashew_reg', name: 'Raw Cashew Export Permit', description: 'NEPC/FMARD authorisation to export raw cashew nuts.', issuedBy: 'NEPC / Federal Ministry of Agriculture', tips: 'Nigeria periodically restricts raw cashew exports to promote local processing.' }],
        sesame: [{ id: 'sesame_q', name: 'Sesame Quality Test Report', description: 'Laboratory test for free fatty acid, moisture, purity and oil content.', issuedBy: 'SON / accredited lab', tips: 'China and Japan require strict quality testing. Use a lab pre-approved by the destination country.' }]
      }
    },
    'GH': {
      tradeBloc: 'ECOWAS',
      currency: 'GHS',
      exportAgency: 'Ghana Export Promotion Authority (GEPA)',
      additionalDocs: [
        { id: 'gepa_reg', name: 'GEPA Exporter Registration', description: 'Registration with Ghana Export Promotion Authority.', issuedBy: 'GEPA', cost: 'GHS 200–500', time: '3–5 days', tips: 'Register at gepaghana.org. Needed to access export incentives and trade finance.' },
        { id: 'pprsd_phyto', name: 'PPRSD Phytosanitary Certificate', description: 'Plant Protection & Regulatory Services Directorate phytosanitary inspection.', issuedBy: 'PPRSD (Ministry of Food and Agriculture)', time: '2–4 days', tips: 'PPRSD is responsible for all plant health inspections. Book at least 3 days before shipment.' }
      ],
      commodityDocs: {
        cocoa: [
          { id: 'cocobod_lic', name: 'COCOBOD Export Licence', description: 'Only COCOBOD-licensed buying companies (LBCs) can export cocoa from Ghana.', issuedBy: 'Ghana Cocoa Board (COCOBOD)', tips: 'Individual farmers cannot export cocoa directly — must sell to a licensed buyer. The licensed exporter handles the COCOBOD quality grading certificate.' },
          { id: 'cocobod_grade', name: 'COCOBOD Quality / Grading Certificate', description: 'COCOBOD QC division sealing and grading certificate — Grade 1 or Grade 2.', issuedBy: 'COCOBOD Quality Control Division', tips: 'Sealed jute bags are marked with COCOBOD seal. Do not tamper with sealed bags.' }
        ],
        cashew: [{ id: 'cashew_test', name: 'Cashew KOR Test Report', description: 'Kernel Out-Turn Ratio (KOR) quality testing report.', issuedBy: 'Authorised grading laboratory', tips: 'KOR measures the weight of kernels obtained per 80kg bag of raw cashew. Buyers pay premium for KOR above 48 lbs.' }]
      }
    },
    'CI': {
      tradeBloc: 'ECOWAS',
      currency: 'XOF',
      exportAgency: 'Conseil du Café-Cacao (CCC) / CEPICI',
      additionalDocs: [
        { id: 'ccc_auth', name: 'CCC Export Authorisation (Cocoa/Coffee)', description: 'Mandatory export authorisation from Conseil du Café-Cacao for cocoa and coffee.', issuedBy: 'Conseil du Café-Cacao (CCC)', tips: 'Côte d\'Ivoire controls cocoa and coffee exports through CCC. Only CCC-registered exporters may export.' },
        { id: 'occ_cert', name: 'OCC Quality Certificate', description: 'Quality grading certificate for cocoa issued by the Office de Certification de Cacao.', issuedBy: 'OCC (Office de Certification de Cacao)', tips: 'Must accompany all cocoa shipments. GS-1 and GS-2 grades available.' },
        { id: 'dv_douane', name: 'Déclaration en Douane (Customs Declaration)', description: 'Formal customs export declaration.', issuedBy: 'Direction Générale des Douanes', tips: 'Work with an agréé en douane (licensed customs agent). All declarations in French.' }
      ],
      commodityDocs: {
        cashew: [{ id: 'aca_cashew', name: 'Cashew Quality Certificate', description: 'Quality test report for raw cashew nuts (humidity, KOR).', issuedBy: 'Accredited laboratory / ACA member', tips: 'Côte d\'Ivoire is the world\'s largest cashew producer. Buyers expect rigorous quality documentation.' }]
      }
    },
    'SN': {
      tradeBloc: 'ECOWAS',
      currency: 'XOF',
      exportAgency: 'APIX (Agence de Promotion des Investissements et des Grands Travaux)',
      additionalDocs: [
        { id: 'mcom_permit', name: 'Autorisation d\'Exportation', description: 'Export authorisation from the Ministry of Commerce for controlled agricultural products.', issuedBy: 'Ministère du Commerce', time: '3–5 days' },
        { id: 'dpv_phyto', name: 'DPV Certificat Phytosanitaire', description: 'Phytosanitary certificate from Direction de la Protection des Végétaux.', issuedBy: 'DPV (Direction de la Protection des Végétaux)', time: '2–3 days' }
      ],
      commodityDocs: {
        groundnut: [{ id: 'sonacos_cert', name: 'Groundnut Quality Certificate', description: 'Quality grading certificate for groundnuts.', issuedBy: 'SONACOS / accredited lab' }]
      }
    },
    'ML': {
      tradeBloc: 'ECOWAS',
      currency: 'XOF',
      exportAgency: 'APEX-Mali (Agence pour la Promotion des Exportations du Mali)',
      additionalDocs: [
        { id: 'apex_reg', name: 'APEX-Mali Exporter Registration', description: 'Registration with Mali\'s export promotion agency.', issuedBy: 'APEX-Mali', time: '1–2 weeks' },
        { id: 'mali_phyto', name: 'Certificat Phytosanitaire', description: 'Plant health certificate for agricultural exports.', issuedBy: 'Direction Nationale de l\'Agriculture (DNA)' }
      ],
      commodityDocs: {
        cotton: [{ id: 'cmdt_cert', name: 'CMDT Export Permit (Cotton)', description: 'Compagnie Malienne pour le Développement du Textile authorisation for cotton exports.', issuedBy: 'CMDT' }],
        sesame: [{ id: 'sesame_grade', name: 'Sesame Grade Certificate', description: 'Quality grading for sesame seeds.', issuedBy: 'Accredited laboratory' }]
      }
    },
    'BF': {
      tradeBloc: 'ECOWAS',
      currency: 'XOF',
      exportAgency: 'APEX-Burkina (Agence Burkinabè de Promotion des Exportations)',
      additionalDocs: [
        { id: 'apex_bf', name: 'APEX-Burkina Exporter Registration', description: 'Registration with Burkina Faso\'s export promotion agency.', issuedBy: 'APEX-Burkina', time: '1–2 weeks' },
        { id: 'dpvc_phyto', name: 'DPVC Phytosanitary Certificate', description: 'Plant health certificate from Direction de la Production Végétale et du Conditionnement.', issuedBy: 'DPVC' }
      ],
      commodityDocs: {
        cotton: [{ id: 'sofitex_cert', name: 'SOFITEX Export Authorisation (Cotton)', description: 'Export authorisation for cotton from SOFITEX.', issuedBy: 'SOFITEX' }],
        cashew: [{ id: 'cashew_bf', name: 'Cashew Quality Certificate', description: 'Quality testing for raw cashew nuts.', issuedBy: 'Accredited laboratory' }]
      }
    },
    'NE': {
      tradeBloc: 'ECOWAS',
      currency: 'XOF',
      exportAgency: 'Chambre de Commerce, d\'Industrie et d\'Artisanat du Niger (CCIAN)',
      additionalDocs: [
        { id: 'mcom_ne', name: 'Autorisation d\'Exportation', description: 'Export permit from Ministry of Commerce.', issuedBy: 'Ministère du Commerce du Niger' },
        { id: 'inran_phyto', name: 'Certificat Phytosanitaire', description: 'Phytosanitary certificate from INRAN.', issuedBy: 'INRAN (Institut National de Recherches Agronomiques du Niger)' }
      ],
      commodityDocs: {
        cowpea: [{ id: 'cowpea_grade', name: 'Cowpea Grade Certificate', description: 'Quality certificate for dried cowpea / niébé.', issuedBy: 'Accredited laboratory' }],
        onion: [{ id: 'onion_grade', name: 'Onion Grading Certificate', description: 'Grading and quality certificate for onion exports.', issuedBy: 'Direction de l\'Agriculture' }]
      }
    },
    'GN': {
      tradeBloc: 'ECOWAS',
      currency: 'GNF',
      exportAgency: 'APIP-Guinée (Agence de Promotion des Investissements Privés)',
      additionalDocs: [
        { id: 'apip_reg', name: 'APIP-Guinée Exporter Registration', description: 'Registration with Guinea\'s investment and trade promotion agency.', issuedBy: 'APIP-Guinée', time: '1–2 weeks' },
        { id: 'spv_phyto', name: 'Certificat Phytosanitaire SPV', description: 'Phytosanitary certificate from Service de la Protection des Végétaux.', issuedBy: 'SPV (Service de la Protection des Végétaux)' }
      ],
      commodityDocs: {
        coffee_robusta: [{ id: 'coffee_gn', name: 'Coffee Export Licence', description: 'Export permit for coffee through the Ministry of Agriculture.', issuedBy: 'Ministère de l\'Agriculture de Guinée' }],
        cashew: [{ id: 'cashew_gn', name: 'Cashew Quality Certificate', description: 'Quality testing certificate for cashew nuts.', issuedBy: 'Accredited laboratory' }]
      }
    },
    'BJ': {
      tradeBloc: 'ECOWAS',
      currency: 'XOF',
      exportAgency: 'CePEPE (Centre de Promotion et d\'Encadrement des PME)',
      additionalDocs: [
        { id: 'cepec_reg', name: 'CePEPE Exporter Registration', description: 'Registration with Benin\'s export promotion centre.', issuedBy: 'CePEPE' },
        { id: 'anpc_phyto', name: 'ANPC Phytosanitary Certificate', description: 'Phytosanitary certificate from Agence Nationale de la Protection des Plantes et du Contrôle de la qualité.', issuedBy: 'ANPC' }
      ],
      commodityDocs: {
        cotton: [{ id: 'sonapra_cert', name: 'SONAPRA Cotton Export Authorisation', description: 'Cotton export authorisation from SONAPRA.', issuedBy: 'SONAPRA' }],
        cashew: [{ id: 'cashew_bj', name: 'Cashew Quality Certificate', description: 'Quality test for raw cashew nuts.', issuedBy: 'Accredited laboratory' }]
      }
    },
    'TG': {
      tradeBloc: 'ECOWAS',
      currency: 'XOF',
      exportAgency: 'OPE-Togo (Office de Promotion des Exportations)',
      additionalDocs: [
        { id: 'ope_reg', name: 'OPE-Togo Exporter Registration', description: 'Registration with Togo\'s export promotion office.', issuedBy: 'OPE-Togo', time: '1 week' },
        { id: 'itra_phyto', name: 'ITRA Phytosanitary Certificate', description: 'Phytosanitary inspection by Institut Togolais de Recherche Agronomique.', issuedBy: 'ITRA' }
      ],
      commodityDocs: {
        cocoa: [{ id: 'cocoa_tg', name: 'CSTT Cocoa Export Authorisation', description: 'Cocoa/Coffee Sector Board export authorisation.', issuedBy: 'Caisse de Stabilisation des Prix des Produits Agricoles (CSPP)' }],
        coffee_robusta: [{ id: 'coffee_tg', name: 'Coffee Export Authorisation', description: 'Export authorisation for coffee.', issuedBy: 'CSPP / Ministry of Agriculture' }]
      }
    },
    'SL': {
      tradeBloc: 'ECOWAS',
      currency: 'SLL',
      exportAgency: 'SLEPA (Sierra Leone Export Promotion Agency)',
      additionalDocs: [
        { id: 'slepa_reg', name: 'SLEPA Exporter Registration', description: 'Registration with Sierra Leone Export Promotion Agency.', issuedBy: 'SLEPA', time: '1–2 weeks' },
        { id: 'slari_phyto', name: 'SLARI Phytosanitary Certificate', description: 'Phytosanitary inspection by Sierra Leone Agricultural Research Institute.', issuedBy: 'SLARI' }
      ],
      commodityDocs: {
        cocoa: [{ id: 'slcb_lic', name: 'Sierra Leone Cocoa Board Licence', description: 'Export licence from Sierra Leone Cocoa Board for cocoa exports.', issuedBy: 'Sierra Leone Cocoa Board (SLCB)' }],
        coffee_robusta: [{ id: 'coffee_sl', name: 'Coffee Export Licence', description: 'Export licence from Ministry of Agriculture for coffee.', issuedBy: 'Ministry of Agriculture, Sierra Leone' }]
      }
    },
    'LR': {
      tradeBloc: 'ECOWAS',
      currency: 'LRD',
      exportAgency: 'Liberia Business Registry / MOCI',
      additionalDocs: [
        { id: 'moci_reg', name: 'MOCI Export Permit', description: 'Export permit from Ministry of Commerce and Industry.', issuedBy: 'Ministry of Commerce and Industry (MOCI), Liberia' },
        { id: 'moa_phyto', name: 'MOA Phytosanitary Certificate', description: 'Phytosanitary certification from Ministry of Agriculture.', issuedBy: 'Ministry of Agriculture, Liberia' }
      ],
      commodityDocs: {
        rubber: [{ id: 'lrdc_cert', name: 'Rubber Quality Certificate', description: 'Quality grading certificate for natural rubber exports.', issuedBy: 'Liberia Rubber Development Corporation (LRDC)' }],
        cocoa: [{ id: 'cocoa_lr', name: 'Cocoa Export Permit', description: 'Ministry of Agriculture permit for cocoa exports.', issuedBy: 'Ministry of Agriculture, Liberia' }]
      }
    },
    'MR': {
      tradeBloc: 'ECOWAS',
      currency: 'MRU',
      exportAgency: 'Chambre de Commerce de Mauritanie (CCM)',
      additionalDocs: [
        { id: 'cimdet_permit', name: 'CIMDET Export Permit', description: 'Export permit from the Centre d\'Information et de Management de la Douane et du Commerce.', issuedBy: 'CIMDET' },
        { id: 'mdr_phyto', name: 'Certificat Phytosanitaire', description: 'Phytosanitary certificate from Ministry of Rural Development.', issuedBy: 'Ministère du Développement Rural' }
      ],
      commodityDocs: {}
    },
    'GM': {
      tradeBloc: 'ECOWAS',
      currency: 'GMD',
      exportAgency: 'GIEPA (Gambia Investment and Export Promotion Agency)',
      additionalDocs: [
        { id: 'giepa_reg', name: 'GIEPA Exporter Registration', description: 'Registration with Gambia Investment and Export Promotion Agency.', issuedBy: 'GIEPA' },
        { id: 'nari_phyto', name: 'NARI Phytosanitary Certificate', description: 'Phytosanitary certification from National Agricultural Research Institute.', issuedBy: 'NARI (National Agricultural Research Institute)' }
      ],
      commodityDocs: {
        groundnut: [{ id: 'gmc_cert', name: 'Gambia Groundnut Quality Certificate', description: 'Quality grading for groundnuts by Gambia Groundnut Corporation.', issuedBy: 'GGC' }]
      }
    },
    'GW': {
      tradeBloc: 'ECOWAS',
      currency: 'XOF',
      exportAgency: 'ANJE (Agência Nacional de Promoção do Investimento e das Exportações)',
      additionalDocs: [
        { id: 'anje_reg', name: 'ANJE Exporter Registration', description: 'Registration with Guinea-Bissau\'s investment and export agency.', issuedBy: 'ANJE' },
        { id: 'dppv_phyto', name: 'DPPV Phytosanitary Certificate', description: 'Phytosanitary certificate from Direcção de Produção e Protecção Vegetal.', issuedBy: 'DPPV' }
      ],
      commodityDocs: {
        cashew: [{ id: 'cashew_gw', name: 'Cashew Quality Certificate', description: 'Quality test for raw cashew (humidity, KOR). Guinea-Bissau is Africa\'s largest cashew exporter per capita.', issuedBy: 'Accredited laboratory / ANJE' }]
      }
    },
    'CV': {
      tradeBloc: 'ECOWAS',
      currency: 'CVE',
      exportAgency: 'ADEI (Agência para o Desenvolvimento Empresarial e a Inovação)',
      additionalDocs: [
        { id: 'adei_reg', name: 'ADEI Exporter Registration', description: 'Registration with Cabo Verde\'s business development agency.', issuedBy: 'ADEI' },
        { id: 'dgasp_phyto', name: 'DGASP Phytosanitary Certificate', description: 'Phytosanitary certificate from Direcção Geral da Agricultura, Silvicultura e Pecuária.', issuedBy: 'DGASP' }
      ],
      commodityDocs: {}
    },

    // ═══ EAST AFRICA ════════════════════════════════════════
    'KE': {
      tradeBloc: 'EAC',
      currency: 'KES',
      exportAgency: 'Export Promotion Council (EPC) Kenya',
      additionalDocs: [
        { id: 'kephis_cert', name: 'KEPHIS Phytosanitary Certificate', description: 'Kenya Plant Health Inspectorate Service certificate. KEPHIS is very strict — Kenya\'s EU horticulture exports depend on this.', issuedBy: 'KEPHIS', cost: 'KES 5,000–20,000', time: '1–3 days', tips: 'Book KEPHIS inspection in advance. Kenya has a Zero Tolerance policy on pests for EU exports. Rejected shipments cost far more than prevention.' },
        { id: 'hcda_lic', name: 'HCDA Export Licence (Horticulture)', description: 'Horticultural Crops Directorate Authority export licence for fresh fruits, vegetables, and flowers.', issuedBy: 'HCDA', time: '1–2 weeks', tips: 'Annual licence. Required for any fresh produce exporter. HCDA also provides market intelligence.' }
      ],
      commodityDocs: {
        tea: [{ id: 'ktda_num', name: 'Tea Sale Number / KTDA Documentation', description: 'Tea sold through Mombasa auction gets a sale number. Exporters buying at auction need auction purchase documents.', issuedBy: 'KTDA / East Africa Tea Trade Association' }],
        coffee_arabica: [{ id: 'afa_coffee', name: 'Coffee Board Export Licence', description: 'Coffee Directorate (under AFA) export licence and auction lot documentation.', issuedBy: 'Agriculture and Food Authority (AFA) — Coffee Directorate' }],
        avocado: [{ id: 'globalgap_ke', name: 'GlobalGAP Certification', description: 'Required by EU supermarkets for fresh produce. Third-party farm audit against Good Agricultural Practices.', issuedBy: 'Accredited certification body (Control Union, SGS, etc.)', cost: '$500–2,000', tips: 'Increasingly required for EU and UK markets. Farm audit covers food safety, environment, and worker welfare.' }]
      }
    },
    'ET': {
      tradeBloc: 'IGAD',
      currency: 'ETB',
      exportAgency: 'ECTA (Ethiopian Coffee and Tea Authority) / EIC',
      additionalDocs: [
        { id: 'ecx_receipt', name: 'ECX Warehouse Receipt', description: 'For commodities (coffee, sesame) traded through the Ethiopian Commodity Exchange — a warehouse receipt is required.', issuedBy: 'ECX (Ethiopian Commodity Exchange)', tips: 'ECX is mandatory for domestic coffee and sesame trade. The warehouse receipt is your proof of ownership.' },
        { id: 'nbe_permit', name: 'NBE Foreign Exchange Export Permit', description: 'National Bank of Ethiopia permit for exporting goods and repatriating foreign exchange.', issuedBy: 'NBE (National Bank of Ethiopia)', tips: 'Open a foreign currency account at a commercial bank. Export proceeds must be repatriated within 30 days.' }
      ],
      commodityDocs: {
        coffee_arabica: [
          { id: 'ecta_grade', name: 'ECTA Coffee Grade Certificate (G1–G5)', description: 'Ethiopian coffee grading by Ethiopian Coffee and Tea Authority. G1 = specialty, G5 = commercial.', issuedBy: 'ECTA' },
          { id: 'clu_cert', name: 'CLU Liquoring Certificate', description: 'Coffee Liquoring Unit cupping and sensory quality report.', issuedBy: 'CLU / ECTA', tips: 'Specialty coffee buyers (specialty grade G1/G2) require CLU certificate and detailed cupping notes.' }
        ],
        sesame: [{ id: 'sesame_et', name: 'Sesame Grade Certificate', description: 'ECX warehouse grading certificate for sesame seeds.', issuedBy: 'ECX' }]
      }
    },
    'TZ': {
      tradeBloc: 'EAC',
      currency: 'TZS',
      exportAgency: 'Tanzania Export Promotion Centre (TanTrade)',
      additionalDocs: [
        { id: 'tantrade_reg', name: 'TanTrade Exporter Registration', description: 'Registration with Tanzania Trade Development Authority.', issuedBy: 'TanTrade (Tanzania Trade Development Authority)', time: '1–2 weeks' },
        { id: 'tpri_phyto', name: 'TPRI Phytosanitary Certificate', description: 'Phytosanitary certificate from Tropical Pesticides Research Institute.', issuedBy: 'TPRI / Ministry of Agriculture' },
        { id: 'tbs_cert', name: 'TBS Quality Certificate', description: 'Tanzania Bureau of Standards product quality certificate for processed agricultural goods.', issuedBy: 'TBS (Tanzania Bureau of Standards)', tips: 'Required for processed/value-added products. Raw commodities may not require TBS cert but quality grading still applies.' }
      ],
      commodityDocs: {
        coffee_arabica: [{ id: 'tcb_cert', name: 'Tanzania Coffee Board Export Licence', description: 'Export licence and auction documentation from Tanzania Coffee Board.', issuedBy: 'TCB (Tanzania Coffee Board)' }],
        cashew: [{ id: 'btre_cert', name: 'BTRE Cashew Export Certificate', description: 'Board of Trustees for Revenue of Exports cashew quality certification.', issuedBy: 'BTRE / Ministry of Agriculture' }]
      }
    },
    'UG': {
      tradeBloc: 'EAC',
      currency: 'UGX',
      exportAgency: 'Uganda Export Promotion Board (UEPB)',
      additionalDocs: [
        { id: 'uepb_reg', name: 'UEPB Exporter Registration', description: 'Registration with Uganda Export Promotion Board.', issuedBy: 'UEPB', time: '1–2 weeks' },
        { id: 'maaif_phyto', name: 'MAAIF Phytosanitary Certificate', description: 'Phytosanitary inspection by Ministry of Agriculture, Animal Industry and Fisheries.', issuedBy: 'MAAIF (Ministry of Agriculture, Animal Industry and Fisheries)' },
        { id: 'unbs_cert', name: 'UNBS Quality Certificate', description: 'Uganda National Bureau of Standards product certification.', issuedBy: 'UNBS' }
      ],
      commodityDocs: {
        coffee_robusta: [{ id: 'ucda_lic', name: 'UCDA Coffee Export Licence', description: 'Uganda Coffee Development Authority export licence and grading certificate.', issuedBy: 'UCDA (Uganda Coffee Development Authority)' }],
        tea: [{ id: 'utga_cert', name: 'UTGA Tea Export Documentation', description: 'Uganda Tea Growers Association documentation for tea exports.', issuedBy: 'UTGA' }]
      }
    },
    'RW': {
      tradeBloc: 'EAC',
      currency: 'RWF',
      exportAgency: 'NAEB (National Agricultural Export Development Board)',
      additionalDocs: [
        { id: 'naeb_reg', name: 'NAEB Exporter Registration', description: 'Mandatory registration with National Agricultural Export Development Board.', issuedBy: 'NAEB', time: '1–2 weeks', tips: 'NAEB manages coffee, tea, horticulture and other agricultural export promotion.' },
        { id: 'rbs_cert', name: 'RBS Quality Certificate', description: 'Rwanda Standards Board certification for exported products.', issuedBy: 'RBS (Rwanda Standards Board)' }
      ],
      commodityDocs: {
        coffee_arabica: [{ id: 'naeb_coffee', name: 'NAEB Coffee Export Permit', description: 'NAEB permit and cupping report for coffee exports.', issuedBy: 'NAEB' }],
        tea: [{ id: 'naeb_tea', name: 'NAEB Tea Export Permit', description: 'NAEB authorisation for tea exports.', issuedBy: 'NAEB' }]
      }
    },
    'BI': {
      tradeBloc: 'EAC',
      currency: 'BIF',
      exportAgency: 'API-BURUNDI (Agence de Promotion des Investissements)',
      additionalDocs: [
        { id: 'mcom_bi', name: 'Export Permit (Ministère du Commerce)', description: 'Export permit from Ministry of Commerce.', issuedBy: 'Ministère du Commerce du Burundi' },
        { id: 'dpse_phyto', name: 'DPSE Phytosanitary Certificate', description: 'Phytosanitary certificate from Direction de la Protection Sanitaire des Végétaux et des Écosystèmes.', issuedBy: 'DPSE' }
      ],
      commodityDocs: {
        coffee_arabica: [{ id: 'intercafe_lic', name: 'INTERCAFE Coffee Export Licence', description: 'Export licence from INTERCAFE for Burundi coffee exports.', issuedBy: 'INTERCAFE (Interprofessional Coffee Authority of Burundi)' }],
        tea: [{ id: 'obj_tea', name: 'OTB Tea Export Documentation', description: 'Office du Thé du Burundi documentation for tea exports.', issuedBy: 'OTB (Office du Thé du Burundi)' }]
      }
    },
    'SO': {
      tradeBloc: 'IGAD',
      currency: 'SOS',
      exportAgency: 'Ministry of Commerce and Industry, Somalia',
      additionalDocs: [
        { id: 'moci_so', name: 'MoCI Export Permit', description: 'Export permit from Ministry of Commerce and Industry.', issuedBy: 'Ministry of Commerce and Industry, Somalia' },
        { id: 'moa_so', name: 'MoA Phytosanitary Certificate', description: 'Phytosanitary certificate from Ministry of Agriculture.', issuedBy: 'Ministry of Agriculture, Irrigation and Rural Development' }
      ],
      commodityDocs: {}
    },
    'DJ': {
      tradeBloc: 'IGAD',
      currency: 'DJF',
      exportAgency: 'PAID (Port Autonome International de Djibouti)',
      additionalDocs: [
        { id: 'mcom_dj', name: 'Export Declaration (Customs)', description: 'Customs export declaration at Port of Djibouti.', issuedBy: 'Direction Générale des Douanes de Djibouti' },
        { id: 'maep_phyto', name: 'MAEP Phytosanitary Certificate', description: 'Phytosanitary certificate from Ministry of Agriculture.', issuedBy: 'MAEP (Ministère de l\'Agriculture)' }
      ],
      commodityDocs: {}
    },
    'ER': {
      tradeBloc: 'IGAD',
      currency: 'ERN',
      exportAgency: 'Ministry of Trade and Industry, Eritrea',
      additionalDocs: [
        { id: 'mhit_permit', name: 'MHIT Export Permit', description: 'Export permit from Ministry of Trade and Industry.', issuedBy: 'Ministry of Trade and Industry (MHIT), Eritrea' },
        { id: 'moa_er', name: 'MoA Phytosanitary Certificate', description: 'Phytosanitary certificate from Ministry of Agriculture.', issuedBy: 'Ministry of Agriculture, Eritrea' }
      ],
      commodityDocs: {}
    },
    'SS': {
      tradeBloc: 'EAC',
      currency: 'SSP',
      exportAgency: 'Ministry of Trade, Industry and East African Community Affairs',
      additionalDocs: [
        { id: 'mtiea_permit', name: 'Export Permit (Ministry of Trade)', description: 'Export permit from Ministry of Trade.', issuedBy: 'Ministry of Trade, Industry and EAC Affairs, South Sudan' },
        { id: 'marf_phyto', name: 'MARF Phytosanitary Certificate', description: 'Phytosanitary certificate from Ministry of Agriculture.', issuedBy: 'Ministry of Agriculture and Rural Development, South Sudan' }
      ],
      commodityDocs: {
        sesame: [{ id: 'sesame_ss', name: 'Sesame Quality Certificate', description: 'Quality grading for sesame seeds.', issuedBy: 'Accredited laboratory' }]
      }
    },

    // ═══ CENTRAL AFRICA ═════════════════════════════════════
    'CD': {
      tradeBloc: 'SADC',
      currency: 'CDF',
      exportAgency: 'OGEAC (Office de Gestion du Fret Multimodal)',
      additionalDocs: [
        { id: 'occ_cert', name: 'OCC Certification', description: 'Office Congolais de Contrôle quality and quantity certification — mandatory for most agricultural exports from DRC.', issuedBy: 'OCC (Office Congolais de Contrôle)', tips: 'OCC is one of the most important agencies for DRC exports. They certify quality, quantity, and weight at point of export.' },
        { id: 'dgda_decl', name: 'DGDA Customs Declaration', description: 'Direction Générale des Douanes et Accises export declaration.', issuedBy: 'DGDA (Direction Générale des Douanes et Accises)' }
      ],
      commodityDocs: {
        coffee_robusta: [{ id: 'ocibu_cd', name: 'OCIBU/ONC Coffee Export Permit', description: 'Coffee export authorisation from Office National du Café.', issuedBy: 'ONC (Office National du Café)' }]
      }
    },
    'CM': {
      tradeBloc: 'CEMAC',
      currency: 'XAF',
      exportAgency: 'CDE (Centre de Développement des Entreprises)',
      additionalDocs: [
        { id: 'mincommerce_cm', name: 'MINCOMMERCE Export Authorisation', description: 'Export authorisation from Ministry of Commerce.', issuedBy: 'MINCOMMERCE (Ministry of Commerce, Cameroon)' },
        { id: 'oncc_lic', name: 'ONCC Export Licence (Cocoa/Coffee)', description: 'Export licence from Office National du Cacao et du Café for cocoa and coffee.', issuedBy: 'ONCC (Office National du Cacao et du Café)' }
      ],
      commodityDocs: {
        cocoa: [{ id: 'oncc_grade', name: 'ONCC Grade Certificate', description: 'Cocoa grading certificate — Grade 1 and Grade 2 from ONCC.', issuedBy: 'ONCC' }],
        coffee_robusta: [{ id: 'oncc_coffee', name: 'ONCC Coffee Export Licence', description: 'Coffee export licence and grading certificate from ONCC.', issuedBy: 'ONCC' }]
      }
    },
    'CG': {
      tradeBloc: 'CEMAC',
      currency: 'XAF',
      exportAgency: 'CCIAM (Chambre de Commerce, d\'Industrie, d\'Agriculture et des Métiers du Congo)',
      additionalDocs: [
        { id: 'dgce_auth', name: 'DGCE Export Authorisation', description: 'Export authorisation from Direction Générale du Commerce Extérieur.', issuedBy: 'DGCE' },
        { id: 'minagri_cg', name: 'Certificat Phytosanitaire', description: 'Phytosanitary certificate from Ministry of Agriculture.', issuedBy: 'Ministère de l\'Agriculture du Congo' }
      ],
      commodityDocs: {}
    },
    'GA': {
      tradeBloc: 'CEMAC',
      currency: 'XAF',
      exportAgency: 'ANPI-Gabon (Agence Nationale de Promotion des Investissements)',
      additionalDocs: [
        { id: 'dgce_ga', name: 'DGCE Export Permit', description: 'Direction Générale du Commerce Extérieur export permit.', issuedBy: 'DGCE (Direction Générale du Commerce Extérieur), Gabon' },
        { id: 'dgapag_phyto', name: 'DGAPAG Phytosanitary Certificate', description: 'Phytosanitary certificate from Direction Générale de l\'Agriculture.', issuedBy: 'DGAPAG' }
      ],
      commodityDocs: {
        rubber: [{ id: 'siat_cert', name: 'Rubber Quality Certificate', description: 'Natural rubber quality grading certificate.', issuedBy: 'Accredited laboratory / SIAT Gabon' }]
      }
    },
    'GQ': {
      tradeBloc: 'CEMAC',
      currency: 'XAF',
      exportAgency: 'CAMEX (Cámara de Comercio Agrícola y Forestal del Bioko)',
      additionalDocs: [
        { id: 'camex_reg', name: 'CAMEX Exporter Registration', description: 'Registration with Equatorial Guinea\'s Chamber of Agricultural and Forestry Commerce.', issuedBy: 'CAMEX' },
        { id: 'minagri_gq', name: 'Phytosanitary Certificate', description: 'Phytosanitary certificate from Ministry of Agriculture and Forestry.', issuedBy: 'Ministerio de Agricultura y Montes' }
      ],
      commodityDocs: {
        cocoa: [{ id: 'cocoa_gq', name: 'Cocoa Export Permit', description: 'Ministry of Agriculture permit for cocoa exports.', issuedBy: 'Ministerio de Agricultura' }]
      }
    },
    'CF': {
      tradeBloc: 'CEMAC',
      currency: 'XAF',
      exportAgency: 'Chambre de Commerce de la République Centrafricaine',
      additionalDocs: [
        { id: 'mepci_permit', name: 'MEPCI Export Authorisation', description: 'Export authorisation from Ministry of Economy.', issuedBy: 'MEPCI (Ministère de l\'Économie)' },
        { id: 'minagri_cf', name: 'Certificat Phytosanitaire', description: 'Phytosanitary certificate from Ministry of Agriculture.', issuedBy: 'Ministère de l\'Agriculture de la RCA' }
      ],
      commodityDocs: {
        coffee_robusta: [{ id: 'coffee_cf', name: 'Coffee Export Permit', description: 'Export permit for coffee.', issuedBy: 'Ministry of Agriculture, CAR' }]
      }
    },
    'TD': {
      tradeBloc: 'CEMAC',
      currency: 'XAF',
      exportAgency: 'Chambre de Commerce du Tchad (CCT)',
      additionalDocs: [
        { id: 'ane_permit', name: 'ANE Export Permit', description: 'Export permit from Agence Nationale des Exportations.', issuedBy: 'ANE (Agence Nationale des Exportations), Chad' },
        { id: 'dpai_phyto', name: 'DPAI Phytosanitary Certificate', description: 'Phytosanitary certificate from Direction de la Production Agricole et de l\'Inspection.', issuedBy: 'DPAI' }
      ],
      commodityDocs: {
        cotton: [{ id: 'cotontchad', name: 'Coton Tchad Export Permit', description: 'Export permit from Coton Tchad for cotton exports.', issuedBy: 'Coton Tchad / ANE' }],
        sesame: [{ id: 'sesame_td', name: 'Sesame Quality Certificate', description: 'Quality grading for sesame seeds.', issuedBy: 'Accredited laboratory' }]
      }
    },
    'ST': {
      tradeBloc: 'CEMAC',
      currency: 'STN',
      exportAgency: 'CECAB (Cooperativa dos Exportadores de Cacau e Café de São Tomé)',
      additionalDocs: [
        { id: 'cecab_lic', name: 'CECAB Export Licence (Cocoa/Coffee)', description: 'CECAB cooperative export licence for cocoa and coffee.', issuedBy: 'CECAB' },
        { id: 'sdca_cert', name: 'SDCA Customs Declaration', description: 'Customs declaration at Serviço das Alfândegas de São Tomé.', issuedBy: 'Serviço das Alfândegas' }
      ],
      commodityDocs: {
        cocoa: [{ id: 'cocoa_st', name: 'CECAB Cocoa Quality Certificate', description: 'Cocoa quality grading from CECAB — Sao Tome cocoa is premium (PDO).', issuedBy: 'CECAB', tips: 'Sao Tome cocoa has PDO (Protected Designation of Origin) status — use this to command premium prices.' }]
      }
    },

    // ═══ SOUTHERN AFRICA ════════════════════════════════════
    'ZA': {
      tradeBloc: 'SADC',
      currency: 'ZAR',
      exportAgency: 'dtic (Department of Trade, Industry and Competition)',
      additionalDocs: [
        { id: 'ppecb_cert', name: 'PPECB Inspection Certificate (Perishables)', description: 'Perishable Products Export Control Board certificate — mandatory for all fresh produce exports from South Africa.', issuedBy: 'PPECB', cost: 'ZAR 200–800 per consignment', tips: 'PPECB inspectors are at all major export points. Cold chain compliance is scrutinised. Book 48 hours in advance.' },
        { id: 'dalrrd_permit', name: 'DALRRD Export Permit', description: 'Department of Agriculture, Land Reform and Rural Development export permit for controlled products.', issuedBy: 'DALRRD' }
      ],
      commodityDocs: {
        citrus: [
          { id: 'cga_reg', name: 'CGA Registration', description: 'Citrus Growers Association of Southern Africa registration.', issuedBy: 'CGA (Citrus Growers Association)', tips: 'CGA registration required to export citrus. Strict EU compliance for Citrus Black Spot (CBS) fungus.' },
          { id: 'ppecb_cold', name: 'PPECB Cold Chain Certificate', description: 'Verification of cold chain management for citrus exports.', issuedBy: 'PPECB' }
        ],
        avocado: [{ id: 'ppecb_avo', name: 'PPECB Avocado Export Certificate', description: 'PPECB quality inspection certificate for avocado exports.', issuedBy: 'PPECB' }],
        grape: [{ id: 'wosb_cert', name: 'Wine and Spirit Board Seal (Wine)', description: 'WOSB seal of origin and quality for wine exports.', issuedBy: 'Wine and Spirits Board (WSB)', tips: 'Each wine export requires the SA Wine Seal (certification). Register with WOSA for market access.' }]
      }
    },
    'MZ': {
      tradeBloc: 'SADC',
      currency: 'MZN',
      exportAgency: 'IPEX (Instituto para a Promoção das Exportações)',
      additionalDocs: [
        { id: 'ipex_reg', name: 'IPEX Exporter Registration', description: 'Registration with Mozambique\'s export promotion institute.', issuedBy: 'IPEX', time: '1–2 weeks' },
        { id: 'iiam_phyto', name: 'IIAM Phytosanitary Certificate', description: 'Phytosanitary certificate from Instituto de Investigação Agrária de Moçambique.', issuedBy: 'IIAM' }
      ],
      commodityDocs: {
        cashew: [{ id: 'cashew_mz', name: 'Cashew Export Permit', description: 'Ministry of Industry and Commerce permit for cashew nut exports.', issuedBy: 'MIC (Ministry of Industry and Commerce)' }],
        tobacco: [{ id: 'tobacco_mz', name: 'Tobacco Export Permit', description: 'Export permit for tobacco leaf from Mozambique Leaf Tobacco.', issuedBy: 'Instituto Nacional do Tabaco' }]
      }
    },
    'ZM': {
      tradeBloc: 'SADC',
      currency: 'ZMW',
      exportAgency: 'Zambia Export Growers Association (ZEGA)',
      additionalDocs: [
        { id: 'zabs_cert', name: 'ZABS Quality Certificate', description: 'Zambia Bureau of Standards certification for exported products.', issuedBy: 'ZABS (Zambia Bureau of Standards)' },
        { id: 'maco_permit', name: 'MACO Export Permit', description: 'Ministry of Agriculture and Cooperatives export permit.', issuedBy: 'MACO (Ministry of Agriculture, Zambia)' },
        { id: 'zpqsi_phyto', name: 'ZPQSI Phytosanitary Certificate', description: 'Phytosanitary certificate from Zambia Plant Quarantine and Seed Inspectorate.', issuedBy: 'ZPQSI' }
      ],
      commodityDocs: {
        tobacco: [{ id: 'tobacco_zm', name: 'Tobacco Export Documentation', description: 'Tobacco Marketing Board documentation for tobacco leaf exports.', issuedBy: 'Tobacco Board of Zambia' }]
      }
    },
    'ZW': {
      tradeBloc: 'SADC',
      currency: 'ZWG',
      exportAgency: 'ZimTrade (Zimbabwe Trade Authority)',
      additionalDocs: [
        { id: 'zimtrade_reg', name: 'ZimTrade Exporter Registration', description: 'Registration with Zimbabwe Trade Authority.', issuedBy: 'ZimTrade', time: '1–2 weeks', tips: 'ZimTrade provides market intelligence, trade missions, and exporter training.' },
        { id: 'saz_cert', name: 'SAZ Quality Certificate', description: 'Standards Association of Zimbabwe certification.', issuedBy: 'SAZ (Standards Association of Zimbabwe)' },
        { id: 'pvs_phyto', name: 'PVS Phytosanitary Certificate', description: 'Phytosanitary certificate from Plant Quarantine Services.', issuedBy: 'PVS (Plant Quarantine Services), Zimbabwe' }
      ],
      commodityDocs: {
        tobacco: [{ id: 'gmb_tobacco', name: 'Tobacco Industry & Marketing Board Permit', description: 'Export permit for tobacco leaf from TIMB.', issuedBy: 'TIMB (Tobacco Industry and Marketing Board)' }]
      }
    },
    'MW': {
      tradeBloc: 'SADC',
      currency: 'MWK',
      exportAgency: 'MITC (Malawi Investment and Trade Centre)',
      additionalDocs: [
        { id: 'mitc_reg', name: 'MITC Exporter Registration', description: 'Registration with Malawi Investment and Trade Centre.', issuedBy: 'MITC' },
        { id: 'mbs_cert', name: 'MBS Quality Certificate', description: 'Malawi Bureau of Standards certification.', issuedBy: 'MBS (Malawi Bureau of Standards)' },
        { id: 'dapqm_phyto', name: 'DAPQM Phytosanitary Certificate', description: 'Phytosanitary certificate from Department of Agricultural and Food Technology / Plant Quarantine.', issuedBy: 'DAPQM' }
      ],
      commodityDocs: {
        tea: [{ id: 'tama_cert', name: 'TAMA Tea Export Documentation', description: 'Tea Association of Malawi documentation for tea exports.', issuedBy: 'TAMA (Tea Association of Malawi)' }],
        tobacco: [{ id: 'tcc_permit', name: 'TCC Tobacco Export Permit', description: 'Tobacco Control Commission permit for tobacco leaf exports.', issuedBy: 'TCC (Tobacco Control Commission)' }]
      }
    },
    'AO': {
      tradeBloc: 'SADC',
      currency: 'AOA',
      exportAgency: 'INAPEM (Instituto Nacional de Apoio às Micro, Pequenas e Médias Empresas)',
      additionalDocs: [
        { id: 'mincom_ao', name: 'MINCO Export Licence', description: 'Ministry of Commerce export licence.', issuedBy: 'MINCO (Ministério do Comércio de Angola)' },
        { id: 'minagri_ao', name: 'Certificado Fitossanitário', description: 'Phytosanitary certificate from Ministry of Agriculture.', issuedBy: 'Ministério da Agricultura de Angola' }
      ],
      commodityDocs: {
        coffee_robusta: [{ id: 'cafe_ao', name: 'Coffee Export Authorisation', description: 'Export authorisation for coffee through Ministry of Agriculture.', issuedBy: 'Ministry of Agriculture, Angola' }],
        banana: [{ id: 'banana_ao', name: 'Banana Quality Certificate', description: 'Quality grading for banana exports.', issuedBy: 'Accredited laboratory' }]
      }
    },
    'NA': {
      tradeBloc: 'SADC',
      currency: 'NAD',
      exportAgency: 'NEF (Namibia Equity Brokers / Namibia Trade Directory)',
      additionalDocs: [
        { id: 'mawf_permit', name: 'MAWF Export Permit', description: 'Export permit from Ministry of Agriculture, Water and Forestry.', issuedBy: 'MAWF (Ministry of Agriculture, Water and Forestry)' },
        { id: 'dirpss_phyto', name: 'DIRPSS Phytosanitary Certificate', description: 'Phytosanitary certificate from Directorate of Plant Protection Services.', issuedBy: 'DIRPSS (Directorate of Plant Protection Services)' }
      ],
      commodityDocs: {
        grape: [{ id: 'napha_cert', name: 'NamPost / Wine Export Documentation', description: 'Documentation for table grape and wine exports.', issuedBy: 'Namibia Grapes Association' }]
      }
    },
    'BW': {
      tradeBloc: 'SADC',
      currency: 'BWP',
      exportAgency: 'BEDIA (Botswana Export Development and Investment Authority)',
      additionalDocs: [
        { id: 'bedia_reg', name: 'BEDIA Exporter Registration', description: 'Registration with Botswana Export Development and Investment Authority.', issuedBy: 'BEDIA' },
        { id: 'dapfs_phyto', name: 'DAPFS Phytosanitary Certificate', description: 'Phytosanitary certificate from Department of Agricultural Production and Food Security.', issuedBy: 'DAPFS' }
      ],
      commodityDocs: {}
    },
    'LS': {
      tradeBloc: 'SADC',
      currency: 'LSL',
      exportAgency: 'LNDC (Lesotho National Development Corporation)',
      additionalDocs: [
        { id: 'lndc_reg', name: 'LNDC Exporter Registration', description: 'Registration with Lesotho National Development Corporation.', issuedBy: 'LNDC' },
        { id: 'doa_phyto', name: 'DOA Phytosanitary Certificate', description: 'Phytosanitary certificate from Department of Agriculture.', issuedBy: 'Department of Agriculture, Lesotho' }
      ],
      commodityDocs: {}
    },
    'SZ': {
      tradeBloc: 'SADC',
      currency: 'SZL',
      exportAgency: 'ESDC (Eswatini Small Enterprise Development Company)',
      additionalDocs: [
        { id: 'mti_permit', name: 'MTI Export Permit', description: 'Export permit from Ministry of Commerce, Industry and Trade.', issuedBy: 'MTI (Ministry of Commerce, Industry and Trade), Eswatini' },
        { id: 'swade_cert', name: 'SWADE Phytosanitary Certificate', description: 'Phytosanitary inspection by Swaziland Water and Agricultural Development Enterprise.', issuedBy: 'SWADE / Ministry of Agriculture' }
      ],
      commodityDocs: {
        sugar_cane: [{ id: 'rssa_cert', name: 'Royal Swaziland Sugar Corporation Documentation', description: 'Sugar export documentation from RSSC.', issuedBy: 'RSSC (Royal Swaziland Sugar Corporation)' }],
        citrus: [{ id: 'swazican_cert', name: 'Swazican Citrus Export Documentation', description: 'Citrus export documentation from Swazican.', issuedBy: 'Swazican' }]
      }
    },

    // ═══ NORTH AFRICA ════════════════════════════════════════
    'EG': {
      tradeBloc: 'COMESA',
      currency: 'EGP',
      exportAgency: 'GOEIC (General Organization for Import and Export Control)',
      additionalDocs: [
        { id: 'goeic_cert', name: 'GOEIC Conformity Certificate', description: 'General Organization for Import and Export Control conformity certification — mandatory for agricultural exports.', issuedBy: 'GOEIC', tips: 'GOEIC must inspect and certify all agricultural exports. Their certificate is required alongside the phytosanitary certificate.' },
        { id: 'eca_card', name: 'ECA Exporter Registration Card', description: 'Egyptian Commercial Register export card — proves legal authority to export.', issuedBy: 'ECA (Egyptian Commercial Authority)', time: '1–2 weeks' },
        { id: 'ma_phyto', name: 'Central Administration of Plant Quarantine Certificate', description: 'Phytosanitary inspection and certificate from CAPQ, Ministry of Agriculture.', issuedBy: 'CAPQ (Central Administration of Plant Quarantine)' }
      ],
      commodityDocs: {
        cotton: [{ id: 'egca_cert', name: 'EGCA Cotton Grade Certificate', description: 'Egyptian cotton grading certificate — Egypt\'s Extra-Long Staple (ELS) cotton commands premium.', issuedBy: 'Egyptian Cotton Association' }],
        citrus: [{ id: 'hcdc_cert', name: 'HCDC Citrus Export Certificate', description: 'Horticultural Crops Development Administration certificate for citrus.', issuedBy: 'HCDA (Horticultural Crops Development Administration)' }]
      }
    },
    'MA': {
      tradeBloc: 'AFCFTA',
      currency: 'MAD',
      exportAgency: 'CMPE (Centre Marocain de Promotion des Exportations) / AMDIE',
      additionalDocs: [
        { id: 'eacce_cert', name: 'EACCE Export Certificate (Fresh Produce/Processed)', description: 'Etablissement Autonome de Contrôle et de Coordination des Exportations — mandatory for fresh produce and processed food exports.', issuedBy: 'EACCE', tips: 'EACCE conducts quality, packaging, and labelling inspections before clearance. Citrus, tomatoes, and olive oil are major products regulated by EACCE.' },
        { id: 'onssa_phyto', name: 'ONSSA Phytosanitary Certificate', description: 'Phytosanitary certificate from Office National de Sécurité Sanitaire des Produits Alimentaires.', issuedBy: 'ONSSA' }
      ],
      commodityDocs: {
        citrus: [{ id: 'citruma_cert', name: 'CITRUMA Orange / Clementine Grading Certificate', description: 'Grading and sizing certificate for citrus exports.', issuedBy: 'CITRUMA / EACCE' }],
        olive: [{ id: 'interprolive_cert', name: 'INTERPROLIVE Quality Certificate', description: 'Olive oil grade certificate — extra virgin, virgin, ordinary.', issuedBy: 'INTERPROLIVE / accredited lab' }]
      }
    },
    'DZ': {
      tradeBloc: 'UMA',
      currency: 'DZD',
      exportAgency: 'ALGEX (Agence Nationale de Promotion du Commerce Extérieur)',
      additionalDocs: [
        { id: 'algex_reg', name: 'ALGEX Exporter Registration', description: 'Registration with Algeria\'s national export promotion agency.', issuedBy: 'ALGEX', time: '1–2 weeks' },
        { id: 'cacqe_cert', name: 'CACQE Quality Certificate', description: 'Centre Algérien de Contrôle de la Qualité et de l\'Emballage quality certification.', issuedBy: 'CACQE' },
        { id: 'madr_phyto', name: 'MADR Phytosanitary Certificate', description: 'Phytosanitary certificate from Ministry of Agriculture and Rural Development.', issuedBy: 'MADR (Ministère de l\'Agriculture)' }
      ],
      commodityDocs: {
        dates: [{ id: 'dates_dz', name: 'Dates Quality Grade Certificate', description: 'Grading and quality certificate for date palm exports.', issuedBy: 'Chambre Algérienne du Commerce et d\'Industrie / CACQE', tips: 'Algeria\'s Deglet Nour dates are world-famous. Proper grading and packaging documentation commands higher prices.' }]
      }
    },
    'TN': {
      tradeBloc: 'UMA',
      currency: 'TND',
      exportAgency: 'CEPEX (Centre de Promotion des Exportations)',
      additionalDocs: [
        { id: 'cepex_reg', name: 'CEPEX Exporter Registration', description: 'Registration with Tunisia\'s export promotion centre.', issuedBy: 'CEPEX', time: '1–2 weeks' },
        { id: 'dgab_auth', name: 'DGAB Export Authorisation', description: 'Export authorisation from Direction Générale des Affaires Basiques.', issuedBy: 'DGAB / Ministry of Trade' },
        { id: 'dppv_tn', name: 'DPPV Phytosanitary Certificate', description: 'Phytosanitary certificate from Direction de la Protection et du Contrôle de la Qualité des Végétaux.', issuedBy: 'DPPV' }
      ],
      commodityDocs: {
        olive: [{ id: 'coh_cert', name: 'COH Olive Oil Quality Certificate', description: 'Conseil Oléicole de Tunisie quality certification for olive oil exports.', issuedBy: 'Conseil Oléicole Tunisien' }],
        dates: [{ id: 'dates_tn', name: 'Dates Quality Certificate', description: 'Quality and grading certificate for date palm exports.', issuedBy: 'CEPEX / accredited lab' }]
      }
    },
    'LY': {
      tradeBloc: 'UMA',
      currency: 'LYD',
      exportAgency: 'General Authority for Foreign Trade and Export Promotion',
      additionalDocs: [
        { id: 'gaep_permit', name: 'GAEP Export Permit', description: 'Export permit from the General Authority for Export Promotion.', issuedBy: 'General Authority for Export Promotion, Libya' },
        { id: 'moa_ly', name: 'MOA Phytosanitary Certificate', description: 'Phytosanitary certificate from Ministry of Agriculture.', issuedBy: 'Ministry of Agriculture, Libya' }
      ],
      commodityDocs: {}
    },
    'SD': {
      tradeBloc: 'COMESA',
      currency: 'SDG',
      exportAgency: 'Sudan Export Promotion Council (SEPC)',
      additionalDocs: [
        { id: 'sepc_reg', name: 'SEPC Exporter Registration', description: 'Registration with Sudan Export Promotion Council.', issuedBy: 'SEPC' },
        { id: 'ssmo_cert', name: 'SSMO Quality Certificate', description: 'Sudanese Standards and Metrology Organisation quality certification.', issuedBy: 'SSMO' },
        { id: 'moa_sd', name: 'MOA Phytosanitary Certificate', description: 'Phytosanitary certificate from Ministry of Agriculture.', issuedBy: 'Ministry of Agriculture and Forestry, Sudan' }
      ],
      commodityDocs: {
        sesame: [{ id: 'sesame_sd', name: 'Sesame Quality Certificate', description: 'Quality grading and purity test for sesame seeds. Sudan is Africa\'s top sesame exporter.', issuedBy: 'SSMO / accredited lab', tips: 'Sudan sesame commands premium prices in Asian markets. Ensure moisture <8%, FFA <2%.' }],
        cotton: [{ id: 'sca_cert', name: 'SCA Cotton Grade Certificate', description: 'Sudan Cotton Company grading certificate.', issuedBy: 'SCA (Sudan Cotton Company)' }]
      }
    },

    // ═══ ISLAND NATIONS ══════════════════════════════════════
    'MG': {
      tradeBloc: 'SADC',
      currency: 'MGA',
      exportAgency: 'EDBM (Economic Development Board of Madagascar)',
      additionalDocs: [
        { id: 'edbm_reg', name: 'EDBM Exporter Registration', description: 'Registration with Economic Development Board of Madagascar.', issuedBy: 'EDBM' },
        { id: 'dsv_phyto', name: 'DSV Phytosanitary Certificate', description: 'Phytosanitary certificate from Direction de la Santé des Végétaux.', issuedBy: 'DSV (Direction de la Santé des Végétaux)' }
      ],
      commodityDocs: {
        vanilla: [{ id: 'vanilla_quota', name: 'Vanilla Export Quota Certificate', description: 'Madagascar regulates vanilla exports with annual quotas to stabilise prices. Quota certificate required.', issuedBy: 'Ministry of Trade / GTVM (Groupement des Exportateurs de Vanille de Madagascar)', tips: 'Madagascar supplies ~80% of world vanilla. GTVM sets minimum export prices annually — selling below this is illegal.' }],
        clove: [{ id: 'clove_cert', name: 'Clove Export Certificate', description: 'Quality certificate for clove exports.', issuedBy: 'Ministry of Agriculture / accredited lab' }],
        cocoa: [{ id: 'cocoa_mg', name: 'Cocoa Quality Certificate', description: 'Quality grading for Madagascar cocoa — premium origin.', issuedBy: 'Accredited laboratory' }]
      }
    },
    'MU': {
      tradeBloc: 'SADC',
      currency: 'MUR',
      exportAgency: 'MCCI (Mauritius Chamber of Commerce and Industry)',
      additionalDocs: [
        { id: 'mcci_coo', name: 'MCCI Certificate of Origin', description: 'Certificate of Origin from Mauritius Chamber of Commerce and Industry.', issuedBy: 'MCCI', time: '1–2 days' },
        { id: 'mcia_cert', name: 'MCIA Food Certification', description: 'Mauritius Commercial Intelligence Audit food quality certification.', issuedBy: 'MCIA' },
        { id: 'farei_phyto', name: 'FAREI Phytosanitary Certificate', description: 'Phytosanitary certificate from Food and Agricultural Research and Extension Institute.', issuedBy: 'FAREI' }
      ],
      commodityDocs: {
        sugar_cane: [{ id: 'mspa_cert', name: 'MSPA Sugar Export Documentation', description: 'Mauritius Sugar Producers Association documentation for sugar exports.', issuedBy: 'MSPA' }],
        tea: [{ id: 'bimtt_cert', name: 'BIMTT Tea Export Certificate', description: 'Bois Cheri / BIMTT documentation for Mauritius tea exports.', issuedBy: 'Board of Investment / BIMTT' }]
      }
    },
    'SC': {
      tradeBloc: 'COMESA',
      currency: 'SCR',
      exportAgency: 'STA (Seychelles Trade Authority)',
      additionalDocs: [
        { id: 'sta_reg', name: 'STA Exporter Registration', description: 'Registration with Seychelles Trade Authority.', issuedBy: 'STA (Seychelles Trade Authority)' },
        { id: 'moa_sc', name: 'MOA Phytosanitary Certificate', description: 'Phytosanitary certificate from Ministry of Agriculture, Climate Change and Environment.', issuedBy: 'Ministry of Agriculture, Seychelles' }
      ],
      commodityDocs: {
        coconut: [{ id: 'coconut_sc', name: 'Coconut / Copra Quality Certificate', description: 'Quality grading for coconut and copra exports.', issuedBy: 'Accredited laboratory' }]
      }
    },
    'KM': {
      tradeBloc: 'COMESA',
      currency: 'KMF',
      exportAgency: 'ANPI-Comores (Agence Nationale pour la Promotion des Investissements)',
      additionalDocs: [
        { id: 'anpi_reg', name: 'ANPI-Comores Exporter Registration', description: 'Registration with Comoros investment and export promotion agency.', issuedBy: 'ANPI-Comores' },
        { id: 'mpa_phyto', name: 'Certificat Phytosanitaire', description: 'Phytosanitary certificate from Ministry of Agriculture.', issuedBy: 'Ministère de l\'Agriculture des Comores' }
      ],
      commodityDocs: {
        vanilla: [{ id: 'vanilla_km', name: 'Vanilla Export Certificate', description: 'Quality and origin certificate for vanilla exports.', issuedBy: 'Ministry of Agriculture / accredited lab', tips: 'Comoros vanilla is premium quality. Document origin carefully for EU/US premium markets.' }],
        clove: [{ id: 'clove_km', name: 'Clove Quality Certificate', description: 'Quality grading for clove exports — Comoros is a top producer.', issuedBy: 'Accredited laboratory' }]
      }
    }
  };

  // ── Trade bloc CoO labels ─────────────────────────────────
  var TRADE_BLOC_COO = {
    'ECOWAS': { name: 'ECOWAS Trade Liberalisation Scheme (TLS) CoO', notes: 'For intra-ECOWAS trade with reduced/zero duties under the ECOWAS TLS. Issued by Chamber of Commerce.' },
    'EAC':    { name: 'EAC Certificate of Origin', notes: 'For zero-tariff trade among EAC partner states (Kenya, Uganda, Tanzania, Rwanda, Burundi, South Sudan, DRC). Issued by customs authority.' },
    'SADC':   { name: 'SADC Certificate of Origin', notes: 'For preferential tariffs among SADC member states. Issued by Chamber of Commerce or customs authority.' },
    'CEMAC':  { name: 'CEMAC Certificate of Origin', notes: 'For preferential tariffs within the Central African Economic and Monetary Community (CEMAC) zone.' },
    'UMA':    { name: 'UMA / Arab Maghreb Union CoO', notes: 'For preferential tariffs within the Arab Maghreb Union (Morocco, Algeria, Tunisia, Libya, Mauritania).' },
    'COMESA': { name: 'COMESA Certificate of Origin', notes: 'For preferential tariffs under the Common Market for Eastern and Southern Africa (COMESA).' },
    'IGAD':   { name: 'IGAD / Standard Certificate of Origin', notes: 'IGAD does not have a comprehensive free trade agreement yet — use standard CoO.' },
    'AFCFTA': { name: 'Standard Certificate of Origin', notes: 'Use AfCFTA CoO for intra-African preferential trade.' }
  };

  window.AfroTools.exportDocsData = {
    commonDocs: COMMON_DOCS,
    afcftaDoc: AFCFTA_DOC,
    destinationDocs: DESTINATION_DOCS,
    countrySpecific: COUNTRY_SPECIFIC,
    tradeBlocCoo: TRADE_BLOC_COO,
    cropLabels: CROP_LABELS
  };

}());
