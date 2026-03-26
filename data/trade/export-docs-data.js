/* AfroTools — Export Documentation Data /data/trade/export-docs-data.js */
var EXPORT_DOCS = (function() {
  'use strict';

  var universal = [
    { id: 'commercial_invoice', name: 'Commercial Invoice', description: 'Itemised list of goods with value, currency, Incoterms. Minimum 3 copies.', category: 'financial', mandatory: true, tips: 'Must match LC terms exactly if LC payment. Show FOB and CIF values.' },
    { id: 'packing_list', name: 'Packing List', description: 'Detailed list of contents per package/carton. Include gross/net weights and dimensions.', category: 'shipping', mandatory: true },
    { id: 'bill_of_lading', name: 'Bill of Lading (B/L) or Airway Bill (AWB)', description: 'Transport document from shipping line or airline. Original B/L for sea, AWB for air.', category: 'shipping', mandatory: true, tips: 'Clean B/L (no damage noted) required for LC. 3 originals standard.' },
    { id: 'certificate_of_origin', name: 'Certificate of Origin', description: 'Confirms country of manufacture/production. Required for preferential tariff treatment.', category: 'trade', mandatory: true, tips: 'For AfCFTA preferential rates, use AfCFTA-specific COO form.' },
    { id: 'insurance_certificate', name: 'Insurance Certificate', description: 'Marine/cargo insurance policy. CIF terms require seller to provide.', category: 'financial', mandatory: 'if_CIF' }
  ];

  var countries = {
    NG: {
      name: 'Nigeria', flag: '🇳🇬',
      exportAuthority: 'Nigerian Export Promotion Council (NEPC)',
      customsAuthority: 'Nigeria Customs Service (NCS)',
      currency: 'NGN',
      requiredDocs: [
        { id: 'nepc_registration', name: 'NEPC Registration Certificate', description: 'All Nigerian exporters must register with NEPC. Valid for 1 year.', fee: '₦50,000 – ₦100,000', timeline: '3–10 business days', mandatory: true },
        { id: 'ness_report', name: 'NESS Clean Report of Findings', description: 'Pre-shipment inspection report. Required for exports >$50,000.', mandatory: true, applicableTo: 'goods > $50,000' },
        { id: 'sgd', name: 'Single Goods Declaration (SGD)', description: 'NCS customs declaration form for all exports.', mandatory: true },
        { id: 'ccvo', name: 'Combined Certificate of Value and Origin (CCVO)', description: 'NCS form combining value declaration and origin certification.', mandatory: true },
        { id: 'nafdac_export', name: 'NAFDAC Export Certificate', description: 'Required for food, drugs, cosmetics, chemicals.', mandatory: 'if_applicable', applicableTo: 'food, beverages, pharmaceuticals, cosmetics' },
        { id: 'phytosanitary', name: 'Phytosanitary Certificate', description: 'Plant health certificate from NAQS for agricultural products.', mandatory: 'if_applicable', applicableTo: 'agricultural products, plants, seeds' },
        { id: 'son_cert', name: 'SON Product Certificate', description: 'Standards Organisation of Nigeria conformity certificate for regulated goods.', mandatory: 'if_applicable' }
      ],
      prohibitedExports: ['Raw timber and rough wood', 'Unprocessed rubber latex', 'Raw hides and skins', 'Scrap metals (without permit)', 'Antiquities and cultural artifacts', 'Wildlife products (without CITES permit)'],
      tips: ['Register on the NCS NICIS II portal for electronic declarations', 'Export Processing Zone (EPZ) goods have simplified procedures', 'AfCFTA COO available from NEPC for intra-African exports']
    },
    KE: {
      name: 'Kenya', flag: '🇰🇪',
      exportAuthority: 'Kenya Export Promotion and Branding Agency (KEPROBA)',
      customsAuthority: 'Kenya Revenue Authority (KRA)',
      currency: 'KES',
      requiredDocs: [
        { id: 'kra_pin', name: 'KRA PIN Certificate', description: 'Kenya Revenue Authority tax registration. Required for all exporters.', mandatory: true },
        { id: 'export_license', name: 'Export License (if applicable)', description: 'Specific products require an export license from the relevant ministry.', mandatory: 'if_applicable' },
        { id: 'kephis', name: 'KEPHIS Certificate', description: 'Kenya Plant Health Inspectorate Service certificate for plant products.', mandatory: 'if_applicable', applicableTo: 'flowers, tea, coffee, vegetables, fruits' },
        { id: 'pvoc', name: 'PVoC Certificate', description: 'Pre-export Verification of Conformity from KEBS for regulated goods.', mandatory: 'if_applicable' },
        { id: 'dvs', name: 'DVS Health Certificate', description: 'Directorate of Veterinary Services certificate for animal products.', mandatory: 'if_applicable', applicableTo: 'meat, fish, dairy, hides' },
        { id: 'eac_coo', name: 'EAC Certificate of Origin', description: 'For exports to EAC partner states. Issued by KRA Customs.', mandatory: 'if_applicable', fee: 'KES 1,000' }
      ],
      prohibitedExports: ['Ivory and wildlife products (without CITES)', 'Miraa/khat (restricted to some destinations)', 'Charcoal'],
      tips: ['KEBS manages conformity assessment for exports to regulated markets', 'EAC members get preferential tariffs — use EAC COO']
    },
    ZA: {
      name: 'South Africa', flag: '🇿🇦',
      exportAuthority: 'Department of Trade, Industry and Competition (dtic)',
      customsAuthority: 'SARS Customs',
      currency: 'ZAR',
      requiredDocs: [
        { id: 'sars_registration', name: 'SARS Customs Registration (RCG10)', description: 'Register as exporter with SARS Customs. One-time registration.', mandatory: true },
        { id: 'itac_permit', name: 'Export Permit (ITAC)', description: 'International Trade Administration Commission permit for controlled goods.', mandatory: 'if_applicable', applicableTo: 'metals, minerals, military goods, cultural objects' },
        { id: 'sadc_coo', name: 'SADC Certificate of Origin', description: 'For preferential access to SADC markets. Issued free by SARS.', mandatory: 'if_applicable', fee: 'Free' },
        { id: 'ppecb', name: 'PPECB Certificate', description: 'Perishable Products Export Control Board — mandatory for fresh produce.', mandatory: 'if_applicable', applicableTo: 'fruit, vegetables, flowers' },
        { id: 'daff_permit', name: 'DAFF Phytosanitary Certificate', description: 'Department of Agriculture plant health certificate.', mandatory: 'if_applicable', applicableTo: 'plants, seeds, agricultural products' }
      ],
      prohibitedExports: ['Unprocessed diamonds (without KP certificate)', 'Cultural artifacts (without DAC permit)', 'Protected species (without CITES)'],
      tips: ['South Africa has simplified customs — register once on SARS eFiling', 'SADC and AfCFTA COOs can be obtained simultaneously', 'ANC compliance vital for platinum, gold, diamonds']
    },
    GH: {
      name: 'Ghana', flag: '🇬🇭',
      exportAuthority: 'Ghana Export Promotion Authority (GEPA)',
      customsAuthority: 'Ghana Revenue Authority (GRA) Customs Division',
      currency: 'GHS',
      requiredDocs: [
        { id: 'gepa_registration', name: 'GEPA Registration', description: 'All Ghanaian exporters must register with GEPA.', fee: 'GHS 500 – GHS 2,000', mandatory: true },
        { id: 'gra_export_dec', name: 'GRA Export Declaration', description: 'Customs export declaration submitted via GRA portal.', mandatory: true },
        { id: 'cocobod', name: 'COCOBOD License', description: 'Ghana Cocoa Board license for cocoa exports.', mandatory: 'if_applicable', applicableTo: 'cocoa beans, cocoa products' },
        { id: 'epa_permit', name: 'EPA Export Permit', description: 'Environmental Protection Agency permit for controlled substances.', mandatory: 'if_applicable' },
        { id: 'fda_certificate', name: 'FDA Health Certificate', description: 'Food and Drugs Authority certificate for food and pharmaceutical exports.', mandatory: 'if_applicable', applicableTo: 'food, beverages, drugs, cosmetics' },
        { id: 'minerals_comm', name: 'Minerals Commission License', description: 'Required for export of minerals, gold, and mining products.', mandatory: 'if_applicable', applicableTo: 'gold, diamonds, bauxite, manganese' }
      ],
      prohibitedExports: ['Unrefined gold (without Ghana Gold Board permit)', 'Timber without logging license', 'Wildlife products without CITES'],
      tips: ['Register on GRA\'s ICUMS system for electronic export declarations', 'COCOBOD controls all cocoa — must go through their process', 'GEPA offers export financing referrals']
    },
    EG: {
      name: 'Egypt', flag: '🇪🇬',
      exportAuthority: 'General Organization for Export and Import Control (GOEIC)',
      customsAuthority: 'Egyptian Customs Authority',
      currency: 'EGP',
      requiredDocs: [
        { id: 'goeic_card', name: 'GOEIC Exporter Card', description: 'All Egyptian exporters must register with GOEIC.', mandatory: true },
        { id: 'chamber_cert', name: 'Chamber of Commerce Certificate', description: 'Certificate of origin from local Chamber of Commerce.', mandatory: true, fee: 'Variable' },
        { id: 'norms_cert', name: 'Egyptian Norms Certificate', description: 'EOS/NQIS standards conformity certificate for regulated products.', mandatory: 'if_applicable' },
        { id: 'health_cert', name: 'Health/Sanitary Certificate', description: 'Ministry of Agriculture/Health certificate for food and agricultural exports.', mandatory: 'if_applicable', applicableTo: 'food, agricultural products' }
      ],
      prohibitedExports: ['Antiquities', 'Raw cotton (periodically)', 'Fertilizers (periodically)', 'Scrap metals (without permit)'],
      tips: ['Egypt has active export promotion — GOEIC can advise on incentives', 'EU-Egypt Association Agreement gives preferential access — use EUR.1 form']
    },
    ET: {
      name: 'Ethiopia', flag: '🇪🇹',
      exportAuthority: 'Ethiopian Investment Holdings (EIH)',
      customsAuthority: 'Ethiopian Customs Commission (ERCA)',
      currency: 'ETB',
      requiredDocs: [
        { id: 'moti_license', name: 'Ministry of Trade Export License', description: 'Required for all Ethiopian exporters.', mandatory: true },
        { id: 'ecx_clearance', name: 'ECX Clearance (if commodity)', description: 'Ethiopia Commodity Exchange clearance for coffee, sesame, etc.', mandatory: 'if_applicable', applicableTo: 'coffee, sesame, haricot beans, white pea beans' },
        { id: 'coffee_cert', name: 'Coffee & Tea Authority Certificate', description: 'Quality certification for coffee exports. Ethiopia = Africa\'s largest coffee exporter.', mandatory: 'if_applicable', applicableTo: 'coffee' },
        { id: 'nbp_permit', name: 'National Bank Permit', description: 'National Bank of Ethiopia FX permit for proceeds repatriation.', mandatory: true }
      ],
      prohibitedExports: ['Raw hides and skins (processed only)', 'Live animals (without veterinary cert)', 'Cultural heritage items'],
      tips: ['ECX is mandatory for major commodities — allows price discovery', 'Coffee must be graded and certified before export', 'Ethiopia Commodity Exchange: www.ecx.com.et']
    },
    TZ: {
      name: 'Tanzania', flag: '🇹🇿',
      exportAuthority: 'Tanzania Export Development Board (TEDB)',
      customsAuthority: 'Tanzania Revenue Authority (TRA)',
      currency: 'TZS',
      requiredDocs: [
        { id: 'tra_registration', name: 'TRA Taxpayer Registration', description: 'Register with TRA for a Taxpayer Identification Number (TIN).', mandatory: true },
        { id: 'tra_export_dec', name: 'TRA Export Declaration', description: 'Filed via TANCIS (Tanzania Customs Integrated System).', mandatory: true },
        { id: 'tfda_cert', name: 'TFDA Certificate', description: 'Tanzania Food and Drugs Authority certificate for regulated products.', mandatory: 'if_applicable', applicableTo: 'food, drugs, cosmetics' },
        { id: 'phytosanitary_tz', name: 'Phytosanitary Certificate', description: 'TPHPA plant health certificate for agricultural exports.', mandatory: 'if_applicable', applicableTo: 'plants, seeds, coffee, tea, sisal' }
      ],
      prohibitedExports: ['Raw cashew nuts (periodic restrictions)', 'Wildlife products without CITES', 'Uncut gemstones (without permit)'],
      tips: ['EAC member — EAC COO available for intra-regional exports', 'Zanzibar has separate trade regulations for spice exports']
    },
    UG: {
      name: 'Uganda', flag: '🇺🇬',
      exportAuthority: 'Uganda Export Promotions Board (UEPB)',
      customsAuthority: 'Uganda Revenue Authority (URA)',
      currency: 'UGX',
      requiredDocs: [
        { id: 'ura_registration', name: 'URA Taxpayer Registration', description: 'TIN from Uganda Revenue Authority.', mandatory: true },
        { id: 'uwec_cert', name: 'Uganda Wildlife Education Centre Permit', description: 'Required for export of wildlife or wildlife products.', mandatory: 'if_applicable', applicableTo: 'wildlife products' },
        { id: 'phytosanitary_ug', name: 'MAAIF Phytosanitary Certificate', description: 'Ministry of Agriculture plant health certificate.', mandatory: 'if_applicable', applicableTo: 'coffee, tea, fruits, vegetables' },
        { id: 'unbs_cert', name: 'UNBS Standards Certificate', description: 'Uganda National Bureau of Standards certificate for manufactured goods.', mandatory: 'if_applicable' }
      ],
      prohibitedExports: ['Raw mineral ores (some restrictions)', 'Fish maw without DFR permit'],
      tips: ['Uganda is landlocked — plan for Kenya/Tanzania port clearance', 'Coffee dominates exports — Uganda Coffee Development Authority certification important']
    },
    RW: {
      name: 'Rwanda', flag: '🇷🇼',
      exportAuthority: 'Rwanda Development Board (RDB)',
      customsAuthority: 'Rwanda Revenue Authority (RRA)',
      currency: 'RWF',
      requiredDocs: [
        { id: 'rra_registration', name: 'RRA Taxpayer Registration', description: 'Register with RRA for export clearance.', mandatory: true },
        { id: 'rdb_export_permit', name: 'RDB Export Permit', description: 'Rwanda Development Board permit for controlled exports.', mandatory: 'if_applicable' },
        { id: 'naeb_cert', name: 'NAEB Certificate', description: 'National Agricultural Export Development Board certificate for agricultural exports.', mandatory: 'if_applicable', applicableTo: 'coffee, tea, pyrethrum, horticulture' },
        { id: 'rbs_cert', name: 'RBS Standards Certificate', description: 'Rwanda Bureau of Standards conformity certificate.', mandatory: 'if_applicable' }
      ],
      prohibitedExports: ['Minerals without RMB permit', 'Timber without forestry permit'],
      tips: ['Rwanda has one of the most business-friendly customs in Africa (WB ranking)', 'EAC COO issued by RRA', 'Single Window System speeds clearance significantly']
    },
    CI: {
      name: 'Côte d\'Ivoire', flag: '🇨🇮',
      exportAuthority: 'Centre de Promotion des Exportations (APEX-CI)',
      customsAuthority: 'Direction Générale des Douanes de Côte d\'Ivoire',
      currency: 'XOF',
      requiredDocs: [
        { id: 'apex_registration', name: 'APEX-CI Registration', description: 'Register with the export promotion agency.', mandatory: true },
        { id: 'dde', name: 'Déclaration de Détail d\'Exportation', description: 'Customs export declaration (form DDE).', mandatory: true },
        { id: 'conseil_cafe_cacao', name: 'Conseil Café-Cacao License', description: 'Mandatory for all cocoa and coffee exports. CI is world\'s largest cocoa producer.', mandatory: 'if_applicable', applicableTo: 'cocoa, coffee' },
        { id: 'phytosanitary_ci', name: 'Phytosanitary Certificate', description: 'ANADER plant health certificate for agricultural exports.', mandatory: 'if_applicable', applicableTo: 'agricultural products' }
      ],
      prohibitedExports: ['Cocoa without Conseil Café-Cacao authorization', 'Timber without MINESUDD permit'],
      tips: ['Côte d\'Ivoire = world\'s #1 cocoa exporter — Conseil Café-Cacao is key authority', 'ECOWAS member — ECOWAS COO for intra-West African trade', 'Documentation primarily in French']
    },
    SN: {
      name: 'Senegal', flag: '🇸🇳',
      exportAuthority: 'Agence Sénégalaise de Promotion des Exportations (ASEPEX)',
      customsAuthority: 'Direction Générale des Douanes (DGD)',
      currency: 'XOF',
      requiredDocs: [
        { id: 'asepex_card', name: 'Exporter Card (ASEPEX)', description: 'Register as exporter with ASEPEX.', mandatory: true },
        { id: 'dae', name: 'Déclaration d\'Exportation (DAE)', description: 'Customs export declaration via GAINDE 2000 system.', mandatory: true },
        { id: 'cert_conformite', name: 'Certificate of Conformity', description: 'ASN (Senegal Standards) conformity certificate for regulated goods.', mandatory: 'if_applicable' },
        { id: 'phytosanitary_sn', name: 'Phytosanitary Certificate', description: 'DISEM plant health certificate for agricultural exports.', mandatory: 'if_applicable', applicableTo: 'peanuts, fish, vegetables, fruits' }
      ],
      prohibitedExports: ['Unprocessed groundnuts (periodic restrictions)', 'Fish (seasonal bans on certain species)'],
      tips: ['ECOWAS member — ECOWAS COO available', 'GAINDE 2000 is the electronic single window — speeds clearance', 'Dakar Port is major regional hub']
    },
    CM: {
      name: 'Cameroon', flag: '🇨🇲',
      exportAuthority: 'Centre de Promotion des Investissements en Côte d\'Ivoire (CEPICI)',
      customsAuthority: 'Direction Générale des Douanes du Cameroun (DGTCFM)',
      currency: 'XAF',
      requiredDocs: [
        { id: 'mincommerce_cert', name: 'MINCOMMERCE Exporter Registration', description: 'Register with Ministry of Commerce.', mandatory: true },
        { id: 'customs_dec_cm', name: 'Customs Export Declaration', description: 'Filed via SYDONIA World system.', mandatory: true },
        { id: 'cocobod_cm', name: 'ONCC Certificate', description: 'Cocoa and Coffee Inter-professional Board certificate for cocoa/coffee exports.', mandatory: 'if_applicable', applicableTo: 'cocoa, coffee' },
        { id: 'phytosanitary_cm', name: 'Phytosanitary Certificate', description: 'MINADER plant health certificate.', mandatory: 'if_applicable', applicableTo: 'agricultural products' }
      ],
      prohibitedExports: ['Precious wood without forestry permit', 'Wildlife without CITES permit'],
      tips: ['Cameroon has both French and English speaking business communities', 'Douala is Central Africa\'s major port — congestion common', 'CEMAC rules apply for trade within Central Africa']
    },
    MA: {
      name: 'Morocco', flag: '🇲🇦',
      exportAuthority: 'Maroc Export (Centre Marocain de Promotion des Exportations)',
      customsAuthority: 'Administration des Douanes et Impôts Indirects (ADII)',
      currency: 'MAD',
      requiredDocs: [
        { id: 'rc_maroc', name: 'Registre du Commerce (RC)', description: 'Commercial register — required for all exporters.', mandatory: true },
        { id: 'de_maroc', name: 'Déclaration d\'Exportation', description: 'Export declaration via BADR system.', mandatory: true },
        { id: 'onssa_cert', name: 'ONSSA Sanitary Certificate', description: 'Office National de Sécurité Sanitaire certificate for food exports.', mandatory: 'if_applicable', applicableTo: 'food, agricultural products, fish' },
        { id: 'ompic_cert', name: 'OMPIC IP Certificate', description: 'Intellectual property compliance for branded goods.', mandatory: 'if_applicable' }
      ],
      prohibitedExports: ['Phosphate without OCP authorization', 'Cultural heritage without MCC permit'],
      tips: ['Morocco has free trade agreements with EU, US, GCC — major advantage', 'Tanger Med is Africa\'s busiest container port', 'ADII offers advance rulings on tariff classifications']
    },
    TN: {
      name: 'Tunisia', flag: '🇹🇳',
      exportAuthority: 'Centre de Promotion des Exportations (CEPEX)',
      customsAuthority: 'Direction Générale des Douanes',
      currency: 'TND',
      requiredDocs: [
        { id: 'cepex_registration', name: 'CEPEX Registration', description: 'Register as exporter with CEPEX.', mandatory: true },
        { id: 'customs_dec_tn', name: 'Export Declaration (SINDA)', description: 'Filed via Tunisia Customs SINDA system.', mandatory: true },
        { id: 'inorpi_cert', name: 'INNORPI Standards Certificate', description: 'Tunisian Standards Institute conformity certificate.', mandatory: 'if_applicable' },
        { id: 'health_cert_tn', name: 'Health Certificate', description: 'Ministry of Agriculture/Health certificate for food exports.', mandatory: 'if_applicable', applicableTo: 'olive oil, dates, fish, food products' }
      ],
      prohibitedExports: ['Archaeological artifacts', 'Currency > threshold without permission'],
      tips: ['Tunisia-EU Association Agreement — EUR.1 for preferential tariffs', 'Offshore companies have streamlined export procedures', 'CEPEX provides market intelligence and export financing support']
    },
    AO: {
      name: 'Angola', flag: '🇦🇴',
      exportAuthority: 'Agência Angolana de Promoção do Investimento e Exportações (AIPEX)',
      customsAuthority: 'Serviço Nacional das Alfândegas (SNA)',
      currency: 'AOA',
      requiredDocs: [
        { id: 'aipex_registration', name: 'AIPEX Registration', description: 'Register as exporter with AIPEX.', mandatory: true },
        { id: 'customs_dec_ao', name: 'Customs Export Declaration (DU)', description: 'Filed via Angola Customs Single Document.', mandatory: true },
        { id: 'banco_angola', name: 'National Bank FX Authorization', description: 'National Bank of Angola authorization for FX proceeds.', mandatory: true },
        { id: 'sonangol_permit', name: 'Sonangol Permit', description: 'Required for any petroleum-related exports.', mandatory: 'if_applicable', applicableTo: 'oil, petroleum products' }
      ],
      prohibitedExports: ['Diamonds without SODIAM authorization', 'Cultural artifacts without MCTA permit'],
      tips: ['Angola relies heavily on oil — non-oil exports growing but still bureaucratic', 'Portuguese is the business language', 'SADC member — SADC COO for preferential trade']
    },
    ZM: {
      name: 'Zambia', flag: '🇿🇲',
      exportAuthority: 'Zambia Development Agency (ZDA)',
      customsAuthority: 'Zambia Revenue Authority (ZRA)',
      currency: 'ZMW',
      requiredDocs: [
        { id: 'zda_registration', name: 'ZDA Exporter Registration', description: 'Register with Zambia Development Agency.', mandatory: true },
        { id: 'zra_export_dec', name: 'ZRA Export Declaration', description: 'Filed via ASYCUDA World system.', mandatory: true },
        { id: 'mcm_permit', name: 'MCM Mining Permit', description: 'Ministry of Mines permit for copper and mineral exports.', mandatory: 'if_applicable', applicableTo: 'copper, cobalt, emeralds, other minerals' },
        { id: 'phytosanitary_zm', name: 'MACO Phytosanitary Certificate', description: 'Ministry of Agriculture certificate for crop exports.', mandatory: 'if_applicable', applicableTo: 'maize, soya, tobacco, cotton' }
      ],
      prohibitedExports: ['Maize (periodic export bans)', 'Unprocessed copper ore', 'Game meat without permits'],
      tips: ['Zambia is landlocked — uses Dar es Salaam, Durban, Beira ports', 'COMESA and SADC member — two COO types available', 'Copper accounts for ~70% of exports']
    },
    ZW: {
      name: 'Zimbabwe', flag: '🇿🇼',
      exportAuthority: 'Zimbabwe Export Processing Zones Authority (ZEPZA) / ZimTrade',
      customsAuthority: 'Zimbabwe Revenue Authority (ZIMRA)',
      currency: 'ZWG',
      requiredDocs: [
        { id: 'zimra_registration', name: 'ZIMRA Exporter Registration', description: 'Register with Zimbabwe Revenue Authority.', mandatory: true },
        { id: 'zimra_export_dec', name: 'ZIMRA Export Declaration (IM/EX)', description: 'Filed via ASYCUDA World.', mandatory: true },
        { id: 'rba_permit', name: 'RBA Export Permit', description: 'Reserve Bank authorization for FX proceeds.', mandatory: true },
        { id: 'phytosanitary_zw', name: 'PPRI Phytosanitary Certificate', description: 'Plant Protection Research Institute certificate.', mandatory: 'if_applicable', applicableTo: 'tobacco, cotton, horticulture, flowers' }
      ],
      prohibitedExports: ['Chrome ore (smelted only)', 'Unprocessed diamonds', 'Rhino horn, ivory (banned)'],
      tips: ['Tobacco dominates exports — must use TIMB (Tobacco Industry & Marketing Board)', 'ZimTrade provides export development support', 'COMESA and SADC member']
    }
  };

  var destinationRequirements = {
    AFRICA_AFCFTA: { name: 'AfCFTA Member States', code: 'AFRICA_AFCFTA', requirements: ['AfCFTA Certificate of Origin (from designated authority)', 'Proof of direct consignment (not routed through non-member)', 'Product must meet AfCFTA Rules of Origin (WO, CTH, or 35-40% VA)', 'Customs declaration with AfCFTA preference claim'] },
    EU: { name: 'European Union', code: 'EU', requirements: ['EUR.1 Movement Certificate or REX self-certification (for ACP/EPA countries)', 'CE marking (for applicable products)', 'HACCP certification (food products)', 'Phytosanitary certificate (fresh produce)', 'EU-approved health certificate (animal products)', 'Registration in TRACES system (animal/plant products)', 'FLEGT license (timber products)'] },
    US: { name: 'United States', code: 'US', requirements: ['AGOA Certificate of Origin (for eligible countries/products)', 'FDA Prior Notice (food, drugs, cosmetics, devices)', 'ISF 10+2 filing (security filing, 24hrs before loading)', 'USDA APHIS certificate (agricultural products)', 'FCC certification (electronics)', 'EPA compliance certificate (vehicles, chemicals)'] },
    CHINA: { name: 'China', code: 'CHINA', requirements: ['China CIQ Inspection Certificate (for food/agricultural goods)', 'GB standards conformity certificate', 'Pre-registration with GACC (General Administration of Customs China) — food products', 'Certificate of Origin (preferential under APTA/bilateral agreements)', 'Chinese import label compliance'] },
    ECOWAS: { name: 'ECOWAS Member States', code: 'ECOWAS', requirements: ['ECOWAS Certificate of Origin', 'Minimum 30% local value added OR change in tariff heading', 'Product cannot be from prohibited list', 'ECOWAS Trade Liberalization Scheme (ETLS) approval for manufacturer'] },
    EAC: { name: 'EAC Member States', code: 'EAC', requirements: ['EAC Certificate of Origin (Form C)', 'CIF value of non-originating materials ≤60% of total cost, OR CTH', 'Issued by KRA/TRA/URA/RRA customs authority'] },
    SADC: { name: 'SADC Member States', code: 'SADC', requirements: ['SADC Certificate of Origin', 'Generally 35% local value added', 'Product-specific rules may apply', 'Issued by customs authority of exporting country'] },
    OTHER: { name: 'Rest of World', code: 'OTHER', requirements: ['Standard Certificate of Origin (Chamber of Commerce)', 'Bilateral trade agreement form if applicable', 'Consular legalization may be required for some destinations', 'Apostille on notarized documents if required'] }
  };

  var productCategories = [
    { id: 'agri_general', name: 'Agriculture (General)', extraDocs: ['phytosanitary', 'certificate_of_origin'] },
    { id: 'coffee_tea', name: 'Coffee & Tea', extraDocs: ['phytosanitary', 'quality_cert', 'certificate_of_origin'] },
    { id: 'cocoa', name: 'Cocoa & Chocolate', extraDocs: ['cocoa_board_cert', 'phytosanitary', 'certificate_of_origin'] },
    { id: 'seafood', name: 'Fish & Seafood', extraDocs: ['health_cert', 'catch_certificate', 'phytosanitary'] },
    { id: 'textiles', name: 'Textiles & Apparel', extraDocs: ['certificate_of_origin'] },
    { id: 'minerals', name: 'Minerals & Metals', extraDocs: ['mineral_export_permit', 'certificate_of_origin'] },
    { id: 'pharmaceuticals', name: 'Pharmaceuticals', extraDocs: ['regulatory_cert', 'gmp_cert', 'health_cert'] },
    { id: 'manufactured', name: 'Manufactured Goods', extraDocs: ['certificate_of_origin', 'standards_cert'] },
    { id: 'petroleum', name: 'Petroleum Products', extraDocs: ['energy_ministry_permit', 'certificate_of_origin'] },
    { id: 'food_processed', name: 'Processed Food & Beverages', extraDocs: ['food_safety_cert', 'health_cert', 'certificate_of_origin'] }
  ];

  return { universal: universal, countries: countries, destinationRequirements: destinationRequirements, productCategories: productCategories };
})();

if (typeof module !== 'undefined') module.exports = { EXPORT_DOCS: EXPORT_DOCS };
