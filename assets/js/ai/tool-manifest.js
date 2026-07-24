/**
 * AfroTools AI tool manifest.
 *
 * Normalizes the existing generated tool directory into a router-safe manifest
 * without changing public routes. CommonJS is used for tests/server tooling;
 * the browser build exposes window.AfroToolsAIToolManifest when loaded after
 * the existing registry.
 */
(function initToolManifest(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    root.AfroToolsAIToolManifest = factory(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createApi(root) {
  'use strict';

  /**
   * @typedef {"browser_local"|"server_required"|"ai_optional"|"account_optional"} PrivacyMode
   * @typedef {"route_only"|"prefill"|"explain"|"generate_document"|"compare"|"export"} AICapability
   * @typedef {"number"|"table"|"shortlist"|"cv"|"pdf"|"checklist"|"json"|"report"|"image"|"map"} OutputType
   * @typedef {"official"|"reviewed"|"estimated"|"user_input"|"mixed"} SourcePolicy
   * @typedef {"tax"|"immigration"|"legal"|"health"|"finance"|"employment"|"education"|"energy"|"none"} HighStakesDomain
   * @typedef {"sponsored_slot"|"pro_export"|"api"|"widget"|"lead_opt_in"} MonetizationSurface
   *
   * @typedef {Object} ToolManifestEntry
   * @property {string} id
   * @property {string} slug
   * @property {string} route
   * @property {string} title
   * @property {string} shortDescription
   * @property {string} category
   * @property {string} subcategory
   * @property {string[]} countriesSupported
   * @property {string[]} languagesSupported
   * @property {string[]} currencySupport
   * @property {string[]} userIntents
   * @property {string[]} exampleQueries
   * @property {Array<{name:string,label:string,type:string,required?:boolean,sensitive?:boolean}>} requiredInputs
   * @property {Array<{name:string,label:string,type:string,required?:boolean,sensitive?:boolean}>} optionalInputs
   * @property {PrivacyMode} privacyMode
   * @property {AICapability[]} aiCapabilities
   * @property {OutputType[]} outputTypes
   * @property {SourcePolicy} sourcePolicy
   * @property {HighStakesDomain} highStakesDomain
   * @property {MonetizationSurface[]} monetizationSurfaces
   */

  var ALLOWED_VALUES = { privacyMode: ['browser_local', 'server_required', 'ai_optional', 'account_optional'], aiCapabilities: ['route_only', 'prefill', 'explain', 'generate_document', 'compare', 'export'], outputTypes: ['number', 'table', 'shortlist', 'cv', 'pdf', 'checklist', 'json', 'report', 'image', 'map'], sourcePolicy: ['official', 'reviewed', 'estimated', 'user_input', 'mixed'], highStakesDomain: ['tax', 'immigration', 'legal', 'health', 'finance', 'employment', 'education', 'energy', 'none'], monetizationSurfaces: ['sponsored_slot', 'pro_export', 'api', 'widget', 'lead_opt_in'] };

  var TOOL_MANIFEST_SCHEMA = { schemaVersion: 1, requiredFields: ['id', 'slug', 'route', 'title', 'shortDescription', 'category', 'subcategory', 'countriesSupported', 'languagesSupported', 'currencySupport', 'userIntents', 'exampleQueries', 'requiredInputs', 'optionalInputs', 'privacyMode', 'aiCapabilities', 'outputTypes', 'sourcePolicy', 'highStakesDomain', 'monetizationSurfaces'], enums: ALLOWED_VALUES };

  function input(name, label, type, options) {
    return Object.assign({ name: name, label: label, type: type }, options || {});
  }

  var INPUTS = { country: input('country', 'Country', 'country', { required: true }), targetCountry: input('targetCountry', 'Target country', 'country', { required: true }), destinationCountry: input('destinationCountry', 'Destination country', 'country', { required: true }), originCountry: input('originCountry', 'Origin country', 'country'), grossPay: input('grossPay', 'Gross pay', 'number', { required: true, sensitive: true }), payPeriod: input('payPeriod', 'Pay period', 'select', { required: true }), itemCategory: input('itemCategory', 'Item category', 'text', { required: true }), itemValue: input('itemValue', 'Item value', 'number', { required: true, sensitive: true }), purchasePrice: input('purchasePrice', 'Purchase price', 'number', { required: true, sensitive: true }), shippingCost: input('shippingCost', 'Shipping or freight', 'number', { sensitive: true }), fxRate: input('fxRate', 'FX rate', 'number', { sensitive: true }), foreignAmount: input('amount', 'Foreign-currency amount', 'number', { required: true, sensitive: true }), currencyCode: input('currency', 'Three-letter currency code', 'text', { required: true }), cbkMeanRate: input('rate', 'Dated CBK Mean rate in KES', 'number', { required: true }), quotedUnits: input('units', 'Quoted foreign units', 'select', { required: true }), sourceDate: input('sourceDate', 'CBK source date', 'date', { required: true }), companyTurnover: input('turnover', 'Annual gross turnover', 'number', { required: true, sensitive: true }), companyFixedAssets: input('fixedAssets', 'Total fixed assets', 'number', { required: true, sensitive: true }), totalProfits: input('totalProfits', 'Total profits for CIT', 'number', { required: true, sensitive: true }), assessableProfits: input('assessableProfits', 'Assessable profits for development levy', 'number', { required: true, sensitive: true }), professionalServices: input('professionalServices', 'Professional-services business', 'boolean', { required: true }), mneGroup: input('mneGroup', 'MNE group constituent', 'boolean'), sellerType: input('sellerType', 'Individual or company seller', 'select', { required: true }), assetType: input('assetType', 'Asset treatment', 'select', { required: true }), disposalProceeds: input('proceeds', 'Disposal proceeds', 'number', { required: true, sensitive: true }), acquisitionCost: input('acquisitionCost', 'Acquisition cost or tax residue', 'number', { required: true, sensitive: true }), disposalCosts: input('disposalCosts', 'Qualifying disposal costs', 'number', { required: true, sensitive: true }), otherChargeableIncome: input('otherChargeableIncome', 'Other chargeable income', 'number', { sensitive: true }), vatAmount: input('amount', 'Amount', 'number', { required: true, sensitive: true }), vatMode: input('mode', 'Add or extract VAT', 'select', { required: true }), vatRateKind: input('rateKind', 'Normal, confirmed reduced, or planning scenario', 'select', { required: true }), taxpayerRegime: input('regime', 'Known taxpayer regime', 'select'), vehicleMake: input('make', 'Vehicle make', 'text'), vehicleModel: input('model', 'Vehicle model', 'text'), vehicleYear: input('year', 'Vehicle year', 'text'), invoiceAmount: input('amount', 'Invoice amount', 'number', { sensitive: true }), vatTreatment: input('vatTreatment', 'VAT treatment', 'select'), studyLevel: input('studyLevel', 'Study level', 'select', { required: true }), budget: input('budget', 'Budget', 'number', { sensitive: true }), monthlyBudget: input('monthlyBudget', 'Monthly budget', 'number', { sensitive: true }), householdSize: input('householdSize', 'Household size', 'number'), city: input('city', 'City', 'text'), targetRole: input('targetRole', 'Target role', 'text'), documentFile: input('documentFile', 'Document', 'file', { sensitive: true }), pdfAction: input('pdfAction', 'PDF action', 'select'), monthlyBill: input('monthlyBill', 'Monthly power bill', 'number', { required: true, sensitive: true }), generatorSize: input('generatorSizeKva', 'Generator size', 'number'), generatorHours: input('generatorHoursPerDay', 'Generator hours per day', 'number'), clientName: input('clientName', 'Client name', 'text', { sensitive: true }), gradeBand: input('gradeBand', 'Grade band', 'text'), gpaScale: input('gpaScale', 'GPA scale', 'select'), examSubjects: input('subjects', 'Subjects', 'text'), ieltsScore: input('ieltsScore', 'IELTS score', 'number'), roomSize: input('roomSize', 'Room size', 'text'), plotSize: input('plotSize', 'Plot size', 'text'), buildingType: input('buildingType', 'Building type', 'text'), materialPreference: input('materialPreference', 'Material preference', 'text'), outputDesired: input('outputDesired', 'Output desired', 'select'), crop: input('crop', 'Crop', 'text'), farmSize: input('farmSize', 'Farm size', 'number'), birdCount: input('birdCount', 'Bird count', 'number'), fishCount: input('fishCount', 'Fish or fingerling count', 'number'), livestockCount: input('livestockCount', 'Livestock count', 'number'), creatorName: input('creatorName', 'Creator name', 'text') };

  var MAJOR_TOOL_OVERRIDES = { 'cv-builder': major('career-documents', ['write cv', 'build resume', 'improve cv', 'ats cv'], ['Help me build a CV for a finance role in Kenya'], [], [INPUTS.targetRole], 'browser_local', ['route_only', 'prefill', 'explain', 'generate_document', 'export'], ['cv', 'pdf', 'json'], 'user_input', 'employment', ['pro_export']), 'cover-letter': major('career-documents', ['write cover letter', 'job application letter', 'application pack'], ['Write a cover letter for an NGO program officer role'], [], [INPUTS.targetRole], 'browser_local', ['route_only', 'generate_document', 'export'], ['report', 'pdf', 'json'], 'user_input', 'employment', ['pro_export']), 'scholarship-finder': major('scholarships', ['find scholarships', 'scholarship eligibility', 'study funding'], ["Find scholarships for a Nigerian master's student in Canada"], [INPUTS.country, INPUTS.studyLevel], [INPUTS.targetCountry], 'account_optional', ['route_only', 'prefill', 'explain', 'compare', 'export'], ['shortlist', 'checklist', 'json'], 'mixed', 'education', ['lead_opt_in']), 'study-abroad-cost': major('study-abroad', ['study abroad cost', 'student budget abroad'], ['Estimate study abroad costs from Ghana to the UK'], [INPUTS.country, INPUTS.targetCountry, INPUTS.studyLevel], [INPUTS.budget], 'browser_local', ['route_only', 'prefill', 'explain', 'compare', 'export'], ['number', 'table', 'checklist', 'report'], 'estimated', 'education', ['lead_opt_in']), 'import-duty': major('customs-duty', ['import duty', 'customs duty', 'landed cost'], ['Estimate import duty for phones shipped to Nigeria'], [INPUTS.destinationCountry, INPUTS.itemCategory, INPUTS.itemValue], [INPUTS.originCountry], 'browser_local', ['route_only', 'prefill', 'explain', 'export'], ['number', 'table', 'report'], 'mixed', 'finance', ['api', 'lead_opt_in']), 'cbk-rates': Object.assign(major('exchange-rates', ['use a dated CBK mean rate', 'manual KES conversion', 'understand the CBK indicative table'], ['Open the official CBK table and help me enter its dated Mean rate', 'Convert with a CBK Mean value I already have'], [INPUTS.foreignAmount, INPUTS.currencyCode, INPUTS.cbkMeanRate, INPUTS.quotedUnits, INPUTS.sourceDate], [], 'browser_local', ['route_only', 'prefill', 'explain'], ['number', 'report'], 'user_input', 'finance', []), { title: 'CBK Rate Guide & Manual KES Converter', shortDescription: 'Enter a dated Mean rate from the official CBK table and calculate locally. The tool supplies no current or bundled rate.', countriesSupported: ['KENYA'], languagesSupported: ['en', 'fr', 'sw'], currencySupport: ['KES'] }), 'ng-cit': Object.assign(major('corporate-income-tax', ['nigeria company income tax', 'nigeria cit 2026', 'development levy nigeria', 'small company tax nigeria'], ['Estimate 2026 CIT for a Nigerian company using reviewed statutory profit bases'], [INPUTS.companyTurnover, INPUTS.companyFixedAssets, INPUTS.totalProfits, INPUTS.assessableProfits, INPUTS.professionalServices], [INPUTS.mneGroup], 'browser_local', ['route_only', 'explain'], ['number', 'report'], 'official', 'tax', []), { title: 'Nigeria CIT Calculator', shortDescription: 'Estimate 2026 CIT and development levy after checking every NTA 2025 small-company condition; no filing or effective-tax-rate top-up is produced.', countriesSupported: ['NIGERIA'], languagesSupported: ['en', 'fr', 'ha', 'yo'], currencySupport: ['NGN'] }), 'ng-cgt': Object.assign(major('capital-gains-tax', ['nigeria capital gains tax', 'nigeria cgt 2026', 'nigeria asset disposal tax', 'nigeria share gain tax'], ['Estimate 2026 Nigeria tax on an asset disposal under the NTA 2025 rules'], [INPUTS.sellerType, INPUTS.assetType, INPUTS.disposalProceeds, INPUTS.acquisitionCost, INPUTS.disposalCosts], [INPUTS.otherChargeableIncome, INPUTS.companyTurnover, INPUTS.companyFixedAssets, INPUTS.professionalServices], 'browser_local', ['route_only', 'explain', 'export'], ['number', 'report'], 'official', 'tax', []), { title: 'Nigeria CGT Calculator', shortDescription: 'Estimate a scoped 2026 disposal gain and incremental tax under NTA 2025; complex transactions, filing and official assessment remain outside the tool.', countriesSupported: ['NIGERIA'], languagesSupported: ['en', 'fr', 'ha'], currencySupport: ['NGN'] }), 'ke-cgt': Object.assign(major('capital-gains-tax', ['kenya capital gains tax', 'kenya cgt 2026', 'kra cgt calculator', 'kenya property gain tax'], ['Estimate Kenya CGT from net transfer value and documented adjusted cost'], [INPUTS.disposalProceeds, INPUTS.acquisitionCost, INPUTS.disposalCosts], [], 'browser_local', ['route_only', 'explain', 'export'], ['number', 'report'], 'official', 'tax', []), { title: 'Kenya Capital Gains Tax Calculator', shortDescription: 'Estimate the general 15% Kenya CGT after separating transfer costs and adjusted cost; exemption eligibility, filing and official assessment remain outside the tool.', countriesSupported: ['KENYA'], languagesSupported: ['en', 'fr'], currencySupport: ['KES'] }), 'za-cgt': Object.assign(major('capital-gains-tax', ['south africa capital gains tax', 'south africa cgt 2027', 'sars cgt calculator', 'south africa property gain tax'], ['Estimate a South African taxable capital gain for the 2027 assessment year'], [INPUTS.sellerType, INPUTS.assetType, INPUTS.disposalProceeds, INPUTS.acquisitionCost, INPUTS.disposalCosts], [INPUTS.otherChargeableIncome], 'browser_local', ['route_only', 'explain', 'export'], ['number', 'report'], 'official', 'tax', []), { title: 'South Africa CGT Calculator', shortDescription: 'Estimate a scoped SARS 2027 capital gain, exclusions, losses, taxable capital gain and incremental normal tax; filing and official assessment stay outside the tool.', countriesSupported: ['SOUTH AFRICA'], languagesSupported: ['en'], currencySupport: ['ZAR'] }), 'dz-vat': Object.assign(major('vat-business-tax', ['algeria vat', 'algeria tva 19', 'extract algeria vat', 'algeria reduced vat'], ['Add Algeria VAT to a DZD amount', 'Extract Algeria VAT from a tax-inclusive total'], [INPUTS.vatAmount, INPUTS.vatMode, INPUTS.vatRateKind], [INPUTS.taxpayerRegime], 'browser_local', ['route_only', 'explain', 'export'], ['number', 'table', 'pdf'], 'official', 'tax', []), { title: 'Algeria VAT Calculator', shortDescription: 'Add or extract 19% VAT, use 9% only after article 23 confirmation, and keep IFU regime screening separate from the calculation.', countriesSupported: ['ALGERIA'], languagesSupported: ['en', 'fr', 'sw'], currencySupport: ['DZD'] }), 'ao-vat': Object.assign(major('vat-business-tax', ['angola vat', 'angola iva 14', 'extract angola vat', 'angola simplified vat', 'cabinda vat'], ['Add Angola IVA to an AOA amount', 'Extract Angola IVA from a tax-inclusive total'], [INPUTS.vatAmount, INPUTS.vatMode, INPUTS.vatRateKind], [INPUTS.taxpayerRegime], 'browser_local', ['route_only', 'explain', 'export'], ['number', 'table', 'pdf'], 'official', 'tax', []), { title: 'Angola VAT Calculator', shortDescription: 'Add or extract 14% IVA; use the 7%, 5% or eligible Cabinda 1% treatments only after confirming the statutory facts and taxpayer regime.', countriesSupported: ['ANGOLA'], languagesSupported: ['en', 'fr', 'sw'], currencySupport: ['AOA'] }), 'bj-vat': Object.assign(major('vat-business-tax', ['benin vat', 'benin tva 18', 'extract benin vat', 'benin vat invoice'], ['Add Benin VAT to an XOF amount', 'Extract Benin VAT from a tax-inclusive total'], [INPUTS.vatAmount, INPUTS.vatMode, INPUTS.vatRateKind], [], 'browser_local', ['route_only', 'explain', 'export'], ['number', 'table', 'pdf'], 'official', 'tax', []), { title: 'Benin VAT Calculator', shortDescription: 'Add or extract 18% VAT; confirm export zero-rating, Article 229 classification and the current Article 228 threshold before filing.', countriesSupported: ['BENIN'], languagesSupported: ['en', 'fr', 'sw'], currencySupport: ['XOF'] }), 'bw-vat': Object.assign(major('vat-business-tax', ['botswana vat', 'botswana vat 14', 'extract botswana vat', 'burs vat registration', 'botswana digital vat'], ['Add Botswana VAT to a BWP amount', 'Extract Botswana VAT from a tax-inclusive total', 'Screen Botswana VAT registration turnover'], [INPUTS.vatAmount, INPUTS.vatMode, INPUTS.vatRateKind], [], 'browser_local', ['route_only', 'explain', 'export'], ['number', 'table', 'pdf'], 'official', 'tax', []), { title: 'Botswana VAT Calculator', shortDescription: 'Add or extract the current 14% standard VAT, check one invoice line and screen BURS registration bands; zero-rating, exemptions and digital-services treatment remain confirmation-only.', countriesSupported: ['BOTSWANA'], languagesSupported: ['en', 'fr', 'sw'], currencySupport: ['BWP'] }), 'car-import-cost': major('vehicle-import', ['car import cost', 'vehicle import duty', 'landed car cost'], ['How much duty will I pay to import a 2016 Toyota Axio into Nigeria?'], [INPUTS.destinationCountry, INPUTS.itemCategory], [INPUTS.purchasePrice, INPUTS.shippingCost, INPUTS.fxRate, INPUTS.vehicleMake, INPUTS.vehicleModel, INPUTS.vehicleYear, INPUTS.originCountry], 'browser_local', ['route_only', 'prefill', 'explain', 'compare', 'export'], ['number', 'table', 'report'], 'mixed', 'finance', ['api', 'lead_opt_in']), 'vat-calc-pan-african': major('vat-business-tax', ['vat calculator', 'vat invoice', 'sales tax africa'], ['Create a VAT invoice in Ghana'], [INPUTS.country], [INPUTS.invoiceAmount, INPUTS.vatTreatment], 'browser_local', ['route_only', 'prefill', 'explain', 'export'], ['number', 'table', 'pdf'], 'mixed', 'tax', ['api', 'widget', 'lead_opt_in']), 'solar-roi': major('solar-roi', ['solar roi', 'solar payback', 'replace generator'], ['Will solar pay back for a shop in Lagos?'], [INPUTS.country, INPUTS.monthlyBill], [], 'browser_local', ['route_only', 'prefill', 'explain', 'compare', 'export'], ['number', 'table', 'report'], 'mixed', 'energy', ['lead_opt_in']), 'fuel-tracker': major('fuel-prices', ['fuel price', 'petrol price', 'diesel price'], ['Show current petrol price context for Kenya'], [], [INPUTS.country], 'browser_local', ['route_only', 'prefill', 'explain', 'compare'], ['table', 'report'], 'mixed', 'energy', ['api', 'widget']), 'generator-fuel': major('generator-cost', ['generator fuel cost', 'diesel generator cost', 'petrol generator spend'], ['Estimate generator fuel cost for a shop in Lagos'], [INPUTS.country], [INPUTS.generatorSize, INPUTS.generatorHours], 'browser_local', ['route_only', 'prefill', 'explain', 'export'], ['number', 'table', 'report'], 'mixed', 'energy', ['widget', 'lead_opt_in']), 'cost-of-living': major('cost-of-living', ['cost of living', 'rent affordability', 'monthly budget'], ['Can I live in Accra on GHS 8000 per month?'], [INPUTS.country], [INPUTS.city, INPUTS.monthlyBudget, INPUTS.householdSize], 'browser_local', ['route_only', 'explain', 'compare', 'export'], ['number', 'table', 'checklist', 'report'], 'estimated', 'finance', ['api', 'lead_opt_in']), 'japa-calculator': major('relocation-planning', ['japa cost', 'relocation budget', 'move abroad cost'], ['How much should I save before moving from Lagos to Nairobi?'], [INPUTS.country, INPUTS.targetCountry], [INPUTS.budget, INPUTS.householdSize], 'browser_local', ['route_only', 'explain', 'export'], ['number', 'checklist', 'report'], 'estimated', 'immigration', ['lead_opt_in']), 'invoice-generator': major('invoices', ['create invoice', 'download invoice', 'bill client'], ['Create an invoice for a design project in Ghana cedis'], [], [INPUTS.clientName], 'browser_local', ['route_only', 'prefill', 'generate_document', 'export'], ['pdf', 'json', 'report'], 'user_input', 'finance', ['pro_export']), 'paye-calculator': major('salary-tax', ['calculate paye', 'salary tax', 'net pay'], ['Calculate monthly PAYE for a salary in Nigeria'], [INPUTS.country, INPUTS.grossPay, INPUTS.payPeriod], [], 'browser_local', ['route_only', 'prefill', 'explain', 'export'], ['number', 'table', 'pdf'], 'mixed', 'tax', ['pro_export']), 'ao-paye': major('salary-tax', ['angola paye', 'angola salary tax', 'irt inss', 'net pay in angola'], ['Calculate monthly salary tax for AOA 1000000 in Angola'], [INPUTS.country, INPUTS.grossPay, INPUTS.payPeriod], [], 'browser_local', ['route_only', 'prefill', 'explain', 'export'], ['number', 'table', 'pdf'], 'mixed', 'tax', ['pro_export']), 'pdf-workspace': major('pdf-tools', ['merge pdf', 'split pdf', 'compress pdf'], ['Merge these PDFs without uploading them'], [], [INPUTS.pdfAction, INPUTS.documentFile], 'browser_local', ['route_only', 'prefill', 'export'], ['pdf', 'json'], 'user_input', 'none', ['pro_export']), 'gpa-calculator': major('academic-grades', ['gpa calculator', 'cgpa calculator', 'convert grades'], ['Calculate my GPA from university grades'], [INPUTS.country], [INPUTS.gradeBand, INPUTS.gpaScale], 'browser_local', ['route_only', 'explain', 'export'], ['number', 'table'], 'estimated', 'education', []), 'waec-calculator': major('waec-neco-grades', ['waec calculator', 'neco grade calculator', 'o level grades'], ['Calculate WAEC grade points for my subjects'], [INPUTS.country], [INPUTS.examSubjects], 'browser_local', ['route_only', 'explain', 'export'], ['number', 'table'], 'estimated', 'education', []), 'ielts-calculator': major('ielts-pathway', ['ielts score', 'english test score', 'study visa english'], ['Check whether IELTS 7 is enough for Canada study plans'], [INPUTS.country], [INPUTS.ieltsScore, INPUTS.targetCountry, INPUTS.studyLevel], 'browser_local', ['route_only', 'explain', 'export'], ['number', 'checklist'], 'estimated', 'education', ['lead_opt_in']), 'business-planner': major('business-planning', ['business plan', 'start a business', 'registration checklist'], ['Build a market-entry plan for a salon in Accra'], [INPUTS.country], [], 'ai_optional', ['route_only', 'prefill', 'explain', 'generate_document', 'export'], ['checklist', 'report', 'pdf'], 'mixed', 'finance', ['pro_export', 'lead_opt_in']), 'medical-report': major('health-explainer', ['explain lab report', 'medical report'], ['Explain what these CBC results mean'], [], [INPUTS.documentFile], 'ai_optional', ['route_only', 'explain', 'export'], ['report', 'pdf'], 'user_input', 'health', ['pro_export']), 'afroplan-floor-planner': major('floor-planning', ['floor plan', 'room layout', 'house plan'], ['Draft a two-bedroom layout for a narrow plot'], [], [INPUTS.plotSize, INPUTS.roomSize, INPUTS.buildingType], 'ai_optional', ['route_only', 'explain', 'export'], ['image', 'json', 'report'], 'user_input', 'none', ['pro_export', 'lead_opt_in']), afrodraft: major('cad-drafting', ['cad plan', 'technical drawing', 'afrodraft'], ['Create a CAD-like concept plan for a shop'], [], [INPUTS.plotSize, INPUTS.buildingType, INPUTS.outputDesired], 'browser_local', ['route_only', 'explain', 'export'], ['image', 'json', 'pdf'], 'user_input', 'none', ['pro_export']), 'building-materials': major('construction-materials', ['estimate blocks', 'cement bags', 'building materials'], ['Estimate blocks and cement for a small room'], [], [INPUTS.country, INPUTS.roomSize, INPUTS.materialPreference], 'browser_local', ['route_only', 'explain', 'export'], ['number', 'table', 'report'], 'estimated', 'legal', ['lead_opt_in', 'pro_export']), 'boq-generator': major('construction-boq', ['boq', 'bill of quantities', 'quantity takeoff'], ['Prepare a BOQ for a 3 bedroom bungalow'], [], [INPUTS.country, INPUTS.plotSize, INPUTS.buildingType], 'browser_local', ['route_only', 'explain', 'export'], ['table', 'pdf', 'json'], 'estimated', 'legal', ['pro_export', 'lead_opt_in']), 'land-size': major('land-measurement', ['land size', 'plot size', 'plot conversion'], ['Convert a 50 by 100 plot'], [], [INPUTS.country, INPUTS.plotSize], 'browser_local', ['route_only', 'prefill', 'explain'], ['number', 'table'], 'estimated', 'none', []), 'construction-budget': major('construction-budget', ['building cost', 'construction budget', 'house budget'], ['Estimate construction budget for a bungalow'], [], [INPUTS.country, INPUTS.plotSize, INPUTS.buildingType], 'browser_local', ['route_only', 'prefill', 'explain', 'export'], ['number', 'table', 'report'], 'estimated', 'finance', ['pro_export', 'lead_opt_in']), 'crop-yield-estimator': major('crop-yield', ['crop yield', 'maize farm', 'harvest estimate'], ['Estimate maize yield for 2 hectares in Nigeria'], [], [INPUTS.country, INPUTS.crop, INPUTS.farmSize], 'browser_local', ['route_only', 'explain', 'export'], ['number', 'table', 'report'], 'mixed', 'none', ['lead_opt_in']), 'farm-profit-calculator': major('farm-profit', ['farm profit', 'farm roi', 'farm margin'], ['Is a maize farm profitable in Nigeria?'], [], [INPUTS.country, INPUTS.crop, INPUTS.farmSize, INPUTS.budget], 'browser_local', ['route_only', 'explain', 'export'], ['number', 'table', 'report'], 'mixed', 'finance', ['lead_opt_in', 'pro_export']), 'poultry-roi-calculator': major('poultry-roi', ['poultry roi', 'broiler profit', 'layer farm'], ['Calculate poultry ROI for 500 broilers in Ghana'], [], [INPUTS.country, INPUTS.birdCount, INPUTS.budget], 'browser_local', ['route_only', 'explain', 'export'], ['number', 'table', 'report'], 'mixed', 'finance', ['lead_opt_in', 'pro_export']), 'fish-farming-roi': major('fish-farming-roi', ['fish farming roi', 'catfish profit', 'tilapia farm'], ['Plan fish farming ROI for tilapia in Kenya'], [], [INPUTS.country, INPUTS.fishCount, INPUTS.budget], 'browser_local', ['route_only', 'prefill', 'explain', 'export'], ['number', 'table', 'report'], 'mixed', 'finance', ['lead_opt_in', 'pro_export']), 'livestock-feed-calculator': major('livestock-feed', ['livestock feed', 'feed ration', 'cattle feed'], ['Estimate livestock feed cost for goats'], [], [INPUTS.country, INPUTS.livestockCount, INPUTS.budget], 'browser_local', ['route_only', 'prefill', 'explain', 'export'], ['number', 'table', 'report'], 'mixed', 'finance', ['lead_opt_in']), 'fertilizer-calculator': major('fertilizer-inputs', ['fertilizer', 'npk', 'urea'], ['Estimate fertilizer needs for maize'], [], [INPUTS.country, INPUTS.crop, INPUTS.farmSize], 'browser_local', ['route_only', 'prefill', 'explain', 'export'], ['number', 'table', 'report'], 'mixed', 'finance', ['lead_opt_in']), 'input-prices': major('agri-input-prices', ['input prices', 'seed prices', 'fertilizer prices'], ['Compare fertilizer and seed prices in Ghana'], [], [INPUTS.country, INPUTS.crop], 'browser_local', ['route_only', 'prefill', 'explain', 'compare', 'export'], ['table', 'report'], 'mixed', 'finance', ['api', 'lead_opt_in']), 'irrigation-calculator': major('irrigation-planning', ['irrigation', 'water pump', 'drip irrigation'], ['Plan irrigation for onions in Senegal'], [], [INPUTS.country, INPUTS.crop, INPUTS.farmSize], 'browser_local', ['route_only', 'prefill', 'explain', 'export'], ['number', 'table', 'report'], 'mixed', 'none', ['lead_opt_in']), 'storage-loss': major('post-harvest-storage', ['storage loss', 'post harvest', 'grain storage'], ['Estimate maize storage losses'], [], [INPUTS.country, INPUTS.crop, INPUTS.farmSize], 'browser_local', ['route_only', 'prefill', 'explain', 'export'], ['number', 'table', 'report'], 'mixed', 'finance', ['lead_opt_in']), 'commodity-prices': major('market-prices', ['commodity prices', 'market price', 'farm gate price'], ['Check maize market price planning'], [], [INPUTS.country, INPUTS.crop], 'browser_local', ['route_only', 'prefill', 'explain', 'compare', 'export'], ['table', 'report'], 'mixed', 'finance', ['api', 'lead_opt_in']), 'cocoa-tracker': major('cocoa-market', ['cocoa', 'farm gate cocoa', 'cocoa export'], ["Plan cocoa farm-gate pricing in Cote d'Ivoire"], [], [INPUTS.country, INPUTS.crop, INPUTS.farmSize], 'browser_local', ['route_only', 'prefill', 'explain', 'compare', 'export'], ['number', 'table', 'report'], 'mixed', 'finance', ['lead_opt_in']), afroatlas: major('country-intelligence', ['compare countries', 'africa data', 'country profile'], ['Compare Kenya and Ghana for a small ecommerce launch'], [], [INPUTS.country], 'browser_local', ['route_only', 'explain', 'compare', 'export'], ['map', 'table', 'report'], 'mixed', 'none', ['api', 'lead_opt_in']), afrostream: major('creator-intelligence', ['find streamers', 'creator news', 'african streamers'], ['Find Nigerian streamers with recent creator news'], [], [INPUTS.country, INPUTS.creatorName], 'browser_local', ['route_only', 'explain', 'compare', 'export'], ['shortlist', 'table', 'report'], 'mixed', 'none', ['sponsored_slot', 'lead_opt_in']) };

  MAJOR_TOOL_OVERRIDES['crypto-dca'] = Object.assign(
    major(
      'historical-market-replay',
      ['historical crypto dca replay', 'replay bitcoin purchase schedule', 'replay ethereum purchase schedule'],
      ['Open the historical BTC DCA replay', 'Open the historical ETH purchase schedule replay'],
      [],
      [],
      'server_required',
      ['route_only'],
      ['number', 'table', 'json', 'pdf'],
      'mixed',
      'finance',
      []
    ),
    {
      title: 'Historical Crypto DCA Schedule Replay',
      shortDescription: 'Replay a BTC or ETH schedule over up to 365 completed UTC days with validated CoinGecko daily reference points, explicit costs, missed rows and a source receipt.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['NGN', 'ZAR', 'USD']
    }
  );

  MAJOR_TOOL_OVERRIDES['crypto-cgt'] = Object.assign(
    major(
      'capital-gains-tax',
      ['crypto tax calculator', 'african crypto capital gains tax'],
      ['Open the reviewed crypto capital-gains calculator'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['number', 'report', 'pdf'],
      'reviewed',
      'tax',
      []
    ),
    {
      title: 'Crypto Capital Gains Calculator',
      shortDescription: 'Fail-closed individual crypto capital-gains estimate for Nigeria, Kenya, South Africa and Ghana using reviewed country contracts.',
      route: '/tools/crypto-tax/',
      countriesSupported: ['NIGERIA', 'KENYA', 'SOUTH AFRICA', 'GHANA'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['NGN', 'KES', 'ZAR', 'GHS']
    }
  );

  MAJOR_TOOL_OVERRIDES['crypto-profit'] = Object.assign(
    major(
      'crypto-profit-arithmetic',
      ['crypto profit calculator', 'crypto loss calculator', 'crypto roi worksheet', 'crypto break even'],
      ['Open the local crypto profit or loss worksheet'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['number', 'table', 'json', 'pdf'],
      'user_input',
      'finance',
      ['widget']
    ),
    {
      title: 'Crypto Profit or Loss Worksheet',
      shortDescription: 'Open a private worksheet for user-entered buy price, sell price, quantity and separate fees. It has no live price, conversion, forecast, API or AI prefill.',
      route: '/crypto/profit-calculator/',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['user-entered display currency']
    }
  );

  MAJOR_TOOL_OVERRIDES['crypto-mining'] = Object.assign(
    major(
      'crypto-mining-operating-arithmetic',
      ['crypto mining operating margin', 'mining electricity cost', 'mining break even price', 'mining hardware payback'],
      ['Open the private crypto mining operating margin worksheet'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['number', 'table', 'json', 'pdf'],
      'user_input',
      'finance',
      []
    ),
    {
      title: 'Crypto Mining Operating Margin Worksheet',
      shortDescription: 'Open a private worksheet using user-entered pool output, coin price, uptime, electricity and operating costs. It has no live price, difficulty, country preset, prediction or AI prefill.',
      route: '/crypto/mining-calculator/',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['user-entered display currency']
    }
  );

  MAJOR_TOOL_OVERRIDES['crypto-scam'] = Object.assign(
    major(
      'crypto-incident-evidence-organization',
      ['crypto incident evidence checklist', 'organize crypto scam evidence', 'crypto red flag checklist'],
      ['Open the private crypto incident evidence organizer'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['checklist', 'json', 'pdf', 'report'],
      'user_input',
      'finance',
      []
    ),
    {
      title: 'Crypto Scam Red-Flag Checklist & Evidence Pack',
      shortDescription: 'Open a private local organizer for generic red flags, evidence items, timeline notes and user-entered loss entries. It performs no database lookup, submission, safety decision, verification or AI prefill.',
      route: '/crypto/scam-checker/',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['user-entered display currency']
    }
  );

  MAJOR_TOOL_OVERRIDES['crypto-contract'] = Object.assign(
    major(
      'contract-address-evidence',
      ['contract address syntax', 'evm address evidence', 'reviewed contract address record'],
      ['Open the local contract address evidence check'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['report'],
      'reviewed',
      'finance',
      []
    ),
    {
      title: 'Contract Address Evidence Check',
      shortDescription: 'Open a browser-local EVM syntax and exact reviewed-record check. No address prefill, blockchain or address API lookup, wallet action, storage, safety score or verdict.',
      route: '/crypto/contract-scanner/',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['N/A']
    }
  );

  MAJOR_TOOL_OVERRIDES['crypto-quiz'] = Object.assign(
    major(
      'crypto-education',
      ['crypto concepts quiz', 'wallet safety quiz', 'test crypto knowledge'],
      ['Open the browser-local crypto knowledge check'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['report', 'pdf'],
      'reviewed',
      'none',
      []
    ),
    {
      title: 'Crypto Concepts & Wallet Safety Knowledge Check',
      shortDescription: 'Route to an untimed browser-local EN/FR educational quiz with reviewed sources and local answer-review exports. The assistant cannot prefill, answer, score, receive or store quiz responses.',
      route: '/crypto/quiz/',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['N/A']
    }
  );

  MAJOR_TOOL_OVERRIDES['markup-calc'] = Object.assign(
    major(
      'business-calculation',
      ['calculate markup', 'calculate selling price', 'convert markup to margin', 'calculate price from target margin'],
      ['Calculate a selling price from cost and markup', 'Calculate a selling price from a target margin'],
      [
        input('cost', 'Cost', 'number', { required: true, sensitive: true }),
        input('percentage', 'Markup or target margin percentage', 'number', { required: true, sensitive: true })
      ],
      [input('unit', 'Display-only currency or unit', 'text')],
      'browser_local',
      ['route_only', 'explain', 'compare', 'export'],
      ['number', 'table', 'pdf', 'report'],
      'user_input',
      'finance',
      ['widget']
    ),
    {
      title: 'Markup & Selling Price Calculator',
      shortDescription: 'Use formula-only local arithmetic to calculate selling price from user-entered markup or target margin.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr', 'sw', 'ha'],
      currencySupport: ['display-only']
    }
  );

  MAJOR_TOOL_OVERRIDES['break-even'] = Object.assign(
    major(
      'business-calculation',
      ['calculate break even', 'break-even units', 'break-even revenue', 'target profit units'],
      ['Calculate exact and whole break-even units', 'Compare my planned units with break-even'],
      [
        input('fixedCosts', 'Fixed costs', 'number', { required: true, sensitive: true }),
        input('sellingPrice', 'Selling price per unit', 'number', { required: true, sensitive: true }),
        input('variableCost', 'Variable cost per unit', 'number', { required: true, sensitive: true })
      ],
      [
        input('plannedUnits', 'Planned units', 'number', { sensitive: true }),
        input('targetProfit', 'Target profit', 'number', { sensitive: true }),
        input('unit', 'Display-only currency or unit', 'text')
      ],
      'browser_local',
      ['route_only', 'explain', 'compare', 'export'],
      ['number', 'table', 'pdf', 'report'],
      'user_input',
      'finance',
      ['widget']
    ),
    {
      title: 'Break-Even Calculator',
      shortDescription: 'Use formula-only local arithmetic to separate exact thresholds from whole units to sell.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr', 'sw', 'ha'],
      currencySupport: ['display-only']
    }
  );

  MAJOR_TOOL_OVERRIDES.inventory = Object.assign(
    major(
      'inventory-reorder-planning',
      ['local inventory worksheet', 'reorder worksheet', 'track stock locally', 'plan stock reorders'],
      ['Open the local inventory and reorder worksheet', 'Track my stock locally and prepare a reorder report'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['table', 'pdf', 'json', 'report'],
      'user_input',
      'finance',
      []
    ),
    {
      title: 'Inventory Calculator & Local Stock Tracker',
      shortDescription: 'Use a browser-local inventory and reorder worksheet for user-entered stock, low-stock checks, stock values and optional target-stock reorder quantities.',
      route: '/tools/inventory/',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr', 'sw'],
      currencySupport: ['local']
    }
  );

  MAJOR_TOOL_OVERRIDES['shipping-calc'] = Object.assign(
    major(
      'shipping-cost-planning',
      ['shipping cost worksheet', 'chargeable weight planner', 'volumetric weight worksheet', 'plan shipping assumptions'],
      ['Open the private chargeable weight planner', 'Plan shipping cost from my confirmed divisor and provider quote'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['number', 'table', 'pdf', 'json', 'report'],
      'user_input',
      'finance',
      []
    ),
    {
      title: 'Shipping Cost & Chargeable Weight Planner',
      shortDescription: 'Calculate chargeable weight and a transparent planning total locally from user-confirmed divisors, rates and fee assumptions; no carrier quote, route availability, customs or tax is supplied.',
      route: '/tools/shipping-calc/',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr', 'sw'],
      currencySupport: ['display-only']
    }
  );

  MAJOR_TOOL_OVERRIDES['discount-calc'] = Object.assign(
    major(
      'discount-scenario',
      ['discount calculator', 'stacked discount calculator', 'sequential discounts', 'price after discount', 'discount savings'],
      ['Open the private discount calculator', 'Calculate sequential discounts from my values'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['number', 'table', 'pdf', 'json', 'report'],
      'user_input',
      'finance',
      []
    ),
    {
      title: 'Discount Calculator',
      shortDescription: 'Calculate quantity totals, up to five sequential discounts, pre-tax savings and an optional user-entered post-discount tax scenario locally; no VAT rate, retailer offer, price feed or currency conversion is supplied.',
      route: '/tools/discount-calc/',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr', 'sw'],
      currencySupport: ['display-only']
    }
  );

  MAJOR_TOOL_OVERRIDES['business-name-gen'] = Object.assign(
    major(
      'brand-shortlist',
      ['business name ideas', 'african business name shortlist', 'brand naming workshop', 'company name ideas', 'name verification checklist'],
      ['Open a private workshop to build a business-name shortlist', 'Create reproducible business-name prompts from my brief'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['shortlist', 'table', 'pdf', 'json', 'report'],
      'user_input',
      'none',
      []
    ),
    {
      title: 'African Business Name Shortlist Workshop',
      shortDescription: 'Create deterministic name prompts locally from a user-supplied brief, compare a transparent readability heuristic and export a verification checklist; no availability, trademark, domain or linguistic claim is made.',
      route: '/tools/business-name-gen/',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr', 'sw'],
      currencySupport: ['not-applicable']
    }
  );

  MAJOR_TOOL_OVERRIDES['business-plan-builder'] = Object.assign(
    major(
      'sme-business-plan-draft',
      ['sme business plan draft', 'private business plan worksheet', 'business funding gap', 'business break even draft'],
      ['Open a private SME business-plan draft workshop', 'Structure my own evidence and financial assumptions locally'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['table', 'pdf', 'json', 'report'],
      'user_input',
      'finance',
      []
    ),
    {
      title: 'SME Business Plan Draft Workshop',
      shortDescription: 'Structure user-entered evidence and assumptions locally, calculate contribution, operating profit, funding gap and same-mix break-even, then export a planning draft; no funding terms, eligibility or approval claim is supplied.',
      route: '/tools/business-plan-builder/',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr', 'sw'],
      currencySupport: ['display-only']
    }
  );

  MAJOR_TOOL_OVERRIDES['paystack-calculator'] = Object.assign(
    major(
      'paystack-merchant-fee-planning',
      ['paystack fee calculator', 'paystack merchant net', 'paystack target net price', 'paystack monthly fees'],
      ['Open the source-dated Paystack merchant fee planner', 'Estimate a supported Paystack fee scenario locally'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['number', 'table', 'pdf', 'json', 'report'],
      'mixed',
      'finance',
      []
    ),
    {
      title: 'Paystack Merchant Fee Planner',
      shortDescription: 'Calculate reviewed Paystack transaction-fee combinations locally with country-locked currency, explicit source dates, a 90-day stale-rate block and no inferred payout, tax, FX or settlement assumptions.',
      route: '/tools/paystack-calculator/',
      countriesSupported: ['NG', 'GH', 'KE', 'ZA'],
      languagesSupported: ['en', 'fr', 'ha'],
      currencySupport: ['NGN', 'GHS', 'KES', 'ZAR']
    }
  );

  MAJOR_TOOL_OVERRIDES['idea-board'] = Object.assign(
    major(
      'business-idea-evidence',
      ['african business idea evidence', 'compare submitted business ideas', 'business idea source gaps', 'local idea shortlist'],
      ['Open the African Business Idea Evidence Explorer', 'Compare submitted idea records without treating estimates as verified'],
      [],
      [],
      'server_required',
      ['route_only'],
      ['table', 'shortlist', 'pdf', 'json', 'report'],
      'mixed',
      'finance',
      []
    ),
    {
      title: 'African Business Idea Evidence Explorer',
      shortDescription: 'Filter normalized submitted records, disclose missing source and freshness fields, and compare up to six planning estimates in an explicit local shortlist; no profitability, recommendation, AI advice or verified-return claim is supplied.',
      route: '/tools/idea-board/',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['record-supplied']
    }
  );

  MAJOR_TOOL_OVERRIDES['market-stall-profit'] = Object.assign(
    major(
      'market-day-profit',
      ['market stall profit', 'daily market profit', 'stock spoilage cost', 'market break even revenue'],
      ['Open the private market-day profit planner', 'Plan a market day from my own sales and costs'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['number', 'table', 'pdf', 'json', 'report'],
      'user_input',
      'finance',
      []
    ),
    {
      title: 'Market Stall Daily Profit Planner',
      shortDescription: 'Calculate sold-stock cost, stock loss, user-entered expenses, contribution, daily profit and same-mix break-even locally; no fees, rates or price data are supplied.',
      route: '/tools/market-stall-profit/',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr', 'sw'],
      currencySupport: ['display-only']
    }
  );

  MAJOR_TOOL_OVERRIDES['crypto-prices'] = Object.assign(
    major(
      'crypto-market-snapshot',
      ['crypto prices in naira', 'bitcoin price in rand', 'fresh coin market snapshot', 'coingecko ngn prices'],
      ['Show a fresh crypto market snapshot in Nigerian Naira', 'Check CoinGecko market rows in South African Rand'],
      [],
      [INPUTS.currencyCode],
      'server_required',
      ['route_only', 'explain', 'compare', 'export'],
      ['table', 'json'],
      'reviewed',
      'finance',
      ['api']
    ),
    {
      title: 'Crypto Market Snapshot',
      shortDescription: 'Inspect CoinGecko market rows in NGN or ZAR only; every displayed row must be no more than 30 minutes old and exports carry source and time receipts.',
      countriesSupported: ['NIGERIA', 'SOUTH AFRICA'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['NGN', 'ZAR']
    }
  );

  MAJOR_TOOL_OVERRIDES['crypto-stablecoins'] = Object.assign(
    major(
      'stablecoin-reference-snapshot',
      ['stablecoin prices in naira', 'usdt price in rand', 'usdc reference price', 'dai peg distance'],
      ['Show fresh USDT, USDC and DAI reference prices in Nigerian Naira', 'Check the USD peg distance in a fresh CoinGecko snapshot'],
      [],
      [INPUTS.currencyCode],
      'server_required',
      ['route_only', 'explain', 'compare', 'export'],
      ['table', 'json'],
      'reviewed',
      'finance',
      ['api']
    ),
    {
      title: 'Stablecoin Reference Snapshot',
      shortDescription: 'Inspect CoinGecko USDT, USDC and DAI reference prices in NGN or ZAR; rows older than 30 minutes are withheld and exports carry source and time receipts.',
      countriesSupported: ['NIGERIA', 'SOUTH AFRICA'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['NGN', 'ZAR']
    }
  );

  MAJOR_TOOL_OVERRIDES['za-dividend-tax'] = Object.assign(
    major(
      'dividends-withholding-tax',
      ['south africa dividends tax', 'sars dividends withholding', 'south africa dividend dta'],
      ['Open the reviewed South Africa dividends-tax calculator'],
      [],
      [],
      'browser_local',
      ['route_only', 'explain'],
      ['number', 'report'],
      'official',
      'tax',
      [],
    ),
    {
      title: 'South Africa Dividends Tax Calculator',
      shortDescription: 'Estimate an in-scope cash-dividend withholding amount at 20%; treaty and exemption eligibility remain confirmation-only.',
      countriesSupported: ['SOUTH AFRICA'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['ZAR'],
    },
  );
  MAJOR_TOOL_OVERRIDES['cm-vat'] = Object.assign(
    major(
      'vat-business-tax',
      ['cameroon vat', 'cameroon tva 19.25', 'extract cameroon vat', 'cameroon social housing vat'],
      ['Open the reviewed Cameroon VAT calculator'],
      [],
      [],
      'browser_local',
      ['route_only', 'explain'],
      ['number', 'report'],
      'official',
      'tax',
      [],
    ),
    {
      title: 'Cameroon VAT Calculator',
      shortDescription: 'Add or extract the reviewed 19.25% VAT; social-housing, classification and withholding treatments require explicit evidence.',
      countriesSupported: ['CAMEROON'],
      languagesSupported: ['en', 'fr', 'sw'],
      currencySupport: ['XAF'],
    },
  );
  MAJOR_TOOL_OVERRIDES['cv-vat'] = Object.assign(
    major(
      'vat-business-tax',
      ['cabo verde vat', 'cape verde iva 15', 'cabo verde water electricity vat'],
      ['Open the reviewed Cabo Verde VAT calculator'],
      [],
      [],
      'browser_local',
      ['route_only', 'explain'],
      ['number', 'report'],
      'official',
      'tax',
      [],
    ),
    {
      title: 'Cabo Verde VAT Calculator',
      shortDescription: 'Add or extract 15% IVA; the 2026 8% final-consumer water/electricity path requires explicit qualification.',
      countriesSupported: ['CABO VERDE'],
      languagesSupported: ['en', 'fr', 'sw'],
      currencySupport: ['CVE'],
    },
  );
  MAJOR_TOOL_OVERRIDES['cf-vat'] = Object.assign(
    major(
      'vat-business-tax',
      ['central african republic vat', 'car tva 19', 'centrafrique tva 5'],
      ['Open the reviewed Central African Republic VAT calculator'],
      [],
      [],
      'browser_local',
      ['route_only', 'explain'],
      ['number', 'report'],
      'official',
      'tax',
      [],
    ),
    {
      title: 'Central African Republic VAT Calculator',
      shortDescription: 'Add or extract 19% TVA; 5% tariff-list and 0% export treatments require exact evidence and fail closed otherwise.',
      countriesSupported: ['CENTRAL AFRICAN REPUBLIC'],
      languagesSupported: ['en', 'fr', 'sw'],
      currencySupport: ['XAF'],
    },
  );
  MAJOR_TOOL_OVERRIDES['td-vat'] = Object.assign(
    major(
      'vat-business-tax',
      ['chad vat', 'tchad tva 19.25', 'chad tva 9.9', 'chad article 238 vat'],
      ['Open the reviewed Chad VAT calculator'],
      [],
      [],
      'browser_local',
      ['route_only', 'explain'],
      ['number', 'report'],
      'official',
      'tax',
      [],
    ),
    {
      title: 'Chad VAT Calculator',
      shortDescription: 'Add or extract Chad’s effective 19.25% invoice rate; the effective 9.9% Article 238 rate and 0% treatment require exact evidence. The displayed rates already include the 10% provincial and communal centimes applied to the 17.5% and 9% bases.',
      countriesSupported: ['CHAD'],
      languagesSupported: ['en', 'fr', 'sw'],
      currencySupport: ['XAF'],
    },
  );
  MAJOR_TOOL_OVERRIDES['km-vat'] = Object.assign(
    major(
      'vat-business-tax',
      [
        'comoros consumption tax',
        'comoros tc 10',
        'comoros article 152 tax',
        'comoros taxe sur la consommation',
      ],
      ['Open the reviewed Comoros consumption-tax calculator'],
      [],
      [],
      'browser_local',
      ['route_only', 'explain'],
      ['number', 'report', 'pdf'],
      'official',
      'tax',
      [],
    ),
    {
      title: 'Comoros Consumption Tax Calculator',
      shortDescription: 'Add or extract the 10% TC reference rate. Every Article 152 special rate requires the exact supply, explicit confirmation and matching evidence type. The separate KMF 50-per-minute incoming-call termination tax is not calculated.',
      countriesSupported: ['COMOROS'],
      languagesSupported: ['en', 'fr', 'sw'],
      currencySupport: ['KMF'],
    },
  );
  MAJOR_TOOL_OVERRIDES['za-uif'] = Object.assign(
    major(
      'social-insurance-benefits',
      ['south africa uif contribution', 'uif unemployment benefit', 'uif maternity benefit'],
      ['Open the reviewed South Africa UIF calculator'],
      [],
      [],
      'browser_local',
      ['route_only', 'explain'],
      ['number', 'report'],
      'official',
      'employment',
      [],
    ),
    {
      title: 'South Africa UIF Calculator',
      shortDescription: 'Calculate capped employee and employer contributions or make a bounded planning estimate for ordinary unemployment and maternity benefits; UIF decides credits, eligibility and approved payments.',
      countriesSupported: ['SOUTH AFRICA'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['ZAR'],
    },
  );
  MAJOR_TOOL_OVERRIDES['contractor-vs-employee'] = Object.assign(
    major(
      'worker-cost-comparison',
      ['contractor vs employee cost', 'employee or contractor cost', 'hiring model cost comparison'],
      ['Open the private contractor versus employee cost calculator'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['number', 'report', 'pdf'],
      'user_input',
      'employment',
      [],
    ),
    {
      title: 'Contractor vs Employee Cost Calculator',
      shortDescription: 'Compare user-entered employee and contractor costs locally, without treating price as a worker-classification verdict. AfroTools AI can open the calculator but cannot prefill it, and no pay, cost or contract field is sent to AI.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en'],
      currencySupport: ['local'],
    },
  );
  MAJOR_TOOL_OVERRIDES['domestic-worker'] = Object.assign(
    major(
      'domestic-worker-pay-planning',
      ['domestic worker pay calculator', 'household worker employer cost', 'domestic worker wage floor plan'],
      ['Open the private domestic worker pay and cost calculator'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['number', 'report', 'pdf'],
      'user_input',
      'employment',
      [],
    ),
    {
      title: 'Domestic Worker Pay and Cost Calculator',
      shortDescription: 'Build a local pay-and-employer-cost plan from user-entered terms and a dated wage-floor source. AfroTools AI can open the calculator but cannot prefill it, and no pay, work-pattern, source or contract-readiness field is sent to AI.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en'],
      currencySupport: ['local'],
    },
  );
  MAJOR_TOOL_OVERRIDES['gratuity-calculator'] = Object.assign(
    major(
      'gratuity-final-pay-planning',
      ['gratuity calculator', 'final pay estimate', 'severance planning calculator'],
      ['Open the private gratuity and final-pay planning calculator'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['number', 'report', 'pdf'],
      'user_input',
      'employment',
      [],
    ),
    {
      title: 'Gratuity and Final-Pay Planning Calculator',
      shortDescription: 'Build a local final-pay estimate from user-entered pay, service, eligible days, payroll divisor, adjustments, and dated rule evidence. AfroTools AI can open the calculator but cannot prefill it, and no pay, service, adjustment or rule-source field is sent to AI.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en'],
      currencySupport: ['local'],
    },
  );
  MAJOR_TOOL_OVERRIDES['maternity-leave'] = Object.assign(
    major(
      'parental-leave-pay-planning',
      ['maternity leave calculator', 'parental leave pay estimate', 'paternity leave planning'],
      ['Open the private parental leave pay planning calculator'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['number', 'report', 'pdf'],
      'user_input',
      'employment',
      [],
    ),
    {
      title: 'Parental Leave Pay Planning Calculator',
      shortDescription: 'Build a local leave and pay estimate from user-entered official-rule, salary, date, leave-day, replacement-rate, employer-policy, and HR-note values. AfroTools AI can open the planner but cannot prefill it, and no leave, pay, source or notes field is sent to AI.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en'],
      currencySupport: ['local'],
    },
  );
  MAJOR_TOOL_OVERRIDES['retrenchment-calculator'] = Object.assign(
    major(
      'retrenchment-package-planning',
      ['retrenchment calculator', 'severance package estimate', 'redundancy final package planning'],
      ['Open the private retrenchment package planning calculator'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['number', 'report', 'pdf'],
      'user_input',
      'employment',
      [],
    ),
    {
      title: 'Retrenchment Package Planning Calculator',
      shortDescription: 'Build a local package estimate from user-entered pay, service, severance weeks, notice, leave, additions, deductions, and dated rule evidence. AfroTools AI can open the calculator but cannot prefill it, and no pay, service, package or rule-source field is sent to AI.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en'],
      currencySupport: ['local'],
    },
  );
  MAJOR_TOOL_OVERRIDES['employee-cost'] = Object.assign(
    major(
      'employee-cost-planning',
      ['employee cost calculator', 'total employer cost', 'hiring cost budget'],
      ['Open the private employee cost planning calculator'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['number', 'report', 'pdf'],
      'user_input',
      'employment',
      [],
    ),
    {
      title: 'Employee Cost Planning Calculator',
      shortDescription: 'Build a local hiring-cost brief from user-entered salary, employer costs and dated source evidence. AfroTools AI can open the calculator but cannot prefill it, and no salary, cost or source field is sent to AI.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['local'],
    },
  );
  MAJOR_TOOL_OVERRIDES['investment-return'] = Object.assign(
    major(
      'investment-projection',
      ['investment return calculator', 'compound growth projection', 'inflation adjusted investment return'],
      ['Open the private investment return calculator'],
      [],
      [],
      'browser_local',
      ['route_only', 'explain', 'export'],
      ['number', 'table', 'pdf'],
      'official',
      'finance',
      ['widget'],
    ),
    {
      title: 'Investment Return Calculator',
      shortDescription: 'Project compound growth and inflation-adjusted value from user-entered assumptions; no live rate, forecast, suitability verdict or guaranteed return.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en'],
      currencySupport: ['NGN', 'KES', 'ZAR', 'GHS', 'EGP', 'TZS', 'UGX', 'XOF', 'ETB', 'RWF', 'MUR', 'BWP', 'MAD', 'USD'],
    },
  );
  MAJOR_TOOL_OVERRIDES['property-roi'] = Object.assign(
    major(
      'property-investment-reconciliation',
      ['property ROI calculator', 'property investment profit', 'property entry holding exit analysis'],
      ['Open the private property ROI calculator'],
      [],
      [],
      'browser_local',
      ['route_only', 'explain', 'export'],
      ['number', 'report', 'pdf', 'json'],
      'user_input',
      'finance',
      []
    ),
    {
      title: 'Property ROI Calculator',
      shortDescription: 'Reconcile user-entered purchase, holding-income, expense and sale amounts; no city yield, appreciation, tax rate, mortgage balance or market forecast is supplied.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr', 'sw'],
      currencySupport: ['MULTI']
    }
  );
  MAJOR_TOOL_OVERRIDES['property-transfer-cost'] = Object.assign(
    major(
      'property-transfer-quote-reconciliation',
      ['property transfer costs', 'closing cost quote total', 'property legal and registry fees'],
      ['Open the private property transfer quote worksheet'],
      [],
      [],
      'browser_local',
      ['route_only', 'explain', 'export'],
      ['number', 'report', 'pdf', 'json'],
      'user_input',
      'finance',
      []
    ),
    {
      title: 'Property Transfer Quote Reconciler',
      shortDescription: 'Add written duty, legal, registry, valuation, agent and lender quotes; no country rate, exemption, legal classification or filing result is supplied.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr', 'sw'],
      currencySupport: ['MULTI']
    }
  );
  MAJOR_TOOL_OVERRIDES['rent-vs-buy'] = Object.assign(
    major(
      'rent-buy-entered-scenario',
      ['rent vs buy comparison', 'compare entered rent and ownership cash flows', 'equal horizon housing scenario'],
      ['Open the private rent vs buy scenario worksheet'],
      [],
      [],
      'browser_local',
      ['route_only', 'explain', 'export'],
      ['number', 'report', 'pdf', 'json'],
      'user_input',
      'finance',
      []
    ),
    {
      title: 'Rent vs Buy Scenario Comparison',
      shortDescription: 'Compare only user-entered rent and buy cash flows over one equal horizon; no market defaults, break-even forecast or housing recommendation is supplied.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr', 'sw'],
      currencySupport: ['MULTI']
    }
  );
  MAJOR_TOOL_OVERRIDES['tithe-offering'] = Object.assign(
    major(
      'private-giving-plan',
      ['tithe calculator', 'offering planner', 'private giving plan'],
      ['Open the private user-directed giving planner'],
      [],
      [],
      'browser_local',
      ['route_only', 'explain', 'export'],
      ['number', 'report', 'pdf', 'json'],
      'user_input',
      'finance',
      []
    ),
    {
      title: 'Private Tithe & Offering Giving Planner',
      shortDescription: 'Add a user-chosen percentage, offering and pledge allocation without a prescribed rate, doctrinal obligation, outcome promise or tax claim.',
      route: '/tools/tithe-calculator/',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr', 'sw'],
      currencySupport: ['MULTI']
    }
  );
  MAJOR_TOOL_OVERRIDES['compound-interest'] = Object.assign(
    major(
      'regular-savings-projection',
      ['compound interest calculator', 'regular savings projection', 'monthly contribution growth'],
      ['Open the private compound interest and regular savings calculator'],
      [],
      [],
      'browser_local',
      ['route_only', 'export'],
      ['number', 'table', 'pdf', 'report'],
      'user_input',
      'finance',
      ['widget'],
    ),
    {
      title: 'Compound Interest & Regular Savings Calculator',
      shortDescription: 'Project a starting amount and monthly contributions with an entered nominal rate, compounding frequency and contribution timing. No live rates, forecast, suitability verdict, guarantee or AI prefill.',
      route: '/tools/compound-interest/',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['NGN', 'KES', 'ZAR', 'GHS', 'XOF', 'USD'],
    },
  );
  MAJOR_TOOL_OVERRIDES['crypto-p2p'] = Object.assign(
    major(
      'p2p-quote-comparison',
      ['compare executable p2p quotes', 'compare p2p buy fees', 'compare p2p sell proceeds'],
      ['Open the private P2P quote comparator'],
      [],
      [],
      'browser_local',
      ['route_only', 'compare', 'export'],
      ['number', 'table', 'pdf', 'json'],
      'user_input',
      'finance',
      [],
    ),
    {
      title: 'P2P Quote Comparator',
      shortDescription: 'Compare two or three executable quotes entered by the user, with explicit checked-at times and costs. No live rate feed, platform ranking, merchant recommendation or AI prefill.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['MULTI'],
    },
  );
  MAJOR_TOOL_OVERRIDES['crypto-remittance'] = Object.assign(
    major(
      'remittance-quote-comparison',
      ['compare remittance quote receipts', 'compare amount received for the same total debit', 'check whether remittance quotes are comparable'],
      ['Open the private remittance quote comparator'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['number', 'table', 'pdf', 'json'],
      'user_input',
      'finance',
      [],
    ),
    {
      title: 'Remittance Quote Comparator',
      shortDescription: 'Compare two or three user-obtained quote receipts only when currencies and total debit match; expired entries are excluded. No live quote, provider ranking, recommendation or AI prefill.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['MULTI'],
    },
  );
  MAJOR_TOOL_OVERRIDES['crypto-arbitrage'] = Object.assign(
    major(
      'two-leg-crypto-arbitrage-feasibility',
      ['check a two-leg crypto route from executable receipts', 'calculate a crypto route break-even from my receipts', 'open the local crypto arbitrage feasibility worksheet'],
      ['Open the private two-leg crypto arbitrage feasibility worksheet'],
      [
        input('assetCode', 'Asset code', 'text', { required: true }),
        input('assetAmount', 'Exact asset amount on both receipts', 'number', { required: true, sensitive: true }),
        input('buyDebit', 'All-in buy debit in NGN', 'number', { required: true, sensitive: true }),
        input('sellCredit', 'All-in sell credit in NGN', 'number', { required: true, sensitive: true }),
        input('buyCheckedAt', 'Buy receipt checked at', 'datetime-local', { required: true }),
        input('sellCheckedAt', 'Sell receipt checked at', 'datetime-local', { required: true }),
        input('confirmation', 'Same asset amount and all-in receipts confirmed', 'boolean', { required: true }),
      ],
      [
        input('externalCosts', 'External costs not included in the receipts', 'number', { sensitive: true }),
        input('buyExpiry', 'Buy receipt expiry', 'datetime-local'),
        input('sellExpiry', 'Sell receipt expiry', 'datetime-local'),
        input('buyRouteLabel', 'Generic buy route label', 'text'),
        input('sellRouteLabel', 'Generic sell route label', 'text'),
      ],
      'browser_local',
      ['route_only'],
      ['number', 'table', 'pdf', 'json', 'report'],
      'user_input',
      'finance',
      [],
    ),
    {
      route: '/crypto/arbitrage/',
      title: 'Two-leg Crypto Arbitrage Feasibility Worksheet',
      shortDescription: 'Check one two-leg route from user-entered executable receipts and expiry only. No provider feed, rate, venue ranking, recommendation, AI prefill or monetized handoff.',
      countriesSupported: ['NIGERIA'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['NGN'],
    },
  );
  MAJOR_TOOL_OVERRIDES['crypto-portfolio'] = Object.assign(
    major(
      'local-crypto-portfolio-snapshot',
      ['open a private crypto portfolio worksheet', 'track separate crypto acquisition lots locally', 'value my local crypto lots in ngn or zar'],
      ['Open the local crypto portfolio snapshot'],
      [],
      [],
      'browser_local',
      ['route_only'],
      ['number', 'table', 'pdf', 'json'],
      'reviewed',
      'finance',
      [],
    ),
    {
      route: '/crypto/portfolio/',
      title: 'Local Crypto Portfolio Snapshot',
      shortDescription: 'A device-only, lot-based worksheet using freshness-checked CoinGecko rows in NGN or ZAR. No AI prefill, cloud sync, conversion, tax output, scoring or recommendation.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['NGN', 'ZAR'],
    },
  );
  MAJOR_TOOL_OVERRIDES['ng-wht'] = Object.assign(
    major(
      'withholding-tax',
      ['nigeria withholding tax', 'nigeria wht schedule', 'nigeria deduction at source'],
      ['Open the reviewed Nigeria WHT calculator'],
      [],
      [],
      'browser_local',
      ['route_only', 'explain'],
      ['number', 'report'],
      'official',
      'tax',
      [],
    ),
    {
      title: 'Nigeria WHT Calculator',
      shortDescription: 'Estimate supported deduction-at-source payments from the official Schedule; Tax ID, treaty and exemption paths fail closed without evidence.',
      countriesSupported: ['NIGERIA'],
      languagesSupported: ['en', 'fr', 'ha', 'yo'],
      currencySupport: ['NGN'],
    },
  );
  MAJOR_TOOL_OVERRIDES['ke-wht'] = Object.assign(
    major(
      'withholding-tax',
      ['kenya withholding tax', 'kra wht rates', 'kenya resident non resident wht'],
      ['Open the reviewed Kenya WHT calculator'],
      [],
      [],
      'browser_local',
      ['route_only', 'explain'],
      ['number', 'report'],
      'official',
      'tax',
      [],
    ),
    {
      title: 'Kenya WHT Calculator',
      shortDescription: 'Estimate supported KRA withholding rows; thresholds, residential MRI, EAC, treaty and exemption paths require exact evidence.',
      countriesSupported: ['KENYA'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['KES'],
    },
  );
  MAJOR_TOOL_OVERRIDES['transfer-pricing'] = Object.assign(
    major(
      'tax-planning',
      ['transfer pricing comparability', 'tnmm range worksheet', 'cost plus comparable range'],
      ['Open the transfer-pricing comparability planner'],
      [],
      [],
      'browser_local',
      ['route_only', 'explain'],
      ['number', 'table', 'json', 'report'],
      'official',
      'tax',
      [],
    ),
    {
      title: 'Transfer Pricing Comparability Planner',
      shortDescription: 'Compute a transparent method indicator and compare it with a range supplied and documented by the user; no compliance or arm\'s-length verdict.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['MULTI'],
    },
  );

  MAJOR_TOOL_OVERRIDES['paye-calculator'] = Object.assign(
    major(
      'salary-tax',
      ['find country paye calculator', 'salary tax by country', 'country payroll deductions'],
      ['Find the PAYE calculator for Kenya', 'Show me the salary tax calculator for Senegal'],
      [INPUTS.country],
      [INPUTS.grossPay, INPUTS.payPeriod],
      'browser_local',
      ['route_only', 'prefill'],
      ['shortlist'],
      'mixed',
      'tax',
      []
    ),
    {
      title: 'PAYE Calculator Country Directory',
      shortDescription: 'Routes country input to a source-backed PAYE calculator and never applies a generic pan-African tax formula.',
      countriesSupported: ['ALL'],
      languagesSupported: ['en', 'fr'],
      currencySupport: ['MULTI']
    }
  );

  function major(subcategory, intents, examples, required, optional, privacy, capabilities, outputs, source, stakes, monetization) {
    return { subcategory: subcategory, userIntents: intents, exampleQueries: examples, requiredInputs: required, optionalInputs: optional, privacyMode: privacy, aiCapabilities: capabilities, outputTypes: outputs, sourcePolicy: source, highStakesDomain: stakes, monetizationSurfaces: monetization };
  }

  function text(value, fallback) {
    return String(value || fallback || '').trim();
  }

  function array(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function unique(values) {
    return Array.from(new Set(array(values).filter(Boolean)));
  }

  function normalizeRoute(route, id) {
    var clean = text(route, id ? '/tools/' + id + '/' : '/').split(/[?#]/)[0];
    if (!clean.startsWith('/')) clean = '/' + clean;
    return clean.replace(/\/index\.html$/i, '/');
  }

  function routeKey(route) {
    var clean = normalizeRoute(route);
    return clean.length > 1 && clean.endsWith('/') ? clean.slice(0, -1).toLowerCase() : clean.toLowerCase();
  }

  var SEARCH_STOP_WORDS = { a: true, about: true, all: true, an: true, and: true, any: true, app: true, are: true, as: true, be: true, build: true, calculate: true, calculator: true, can: true, check: true, checker: true, create: true, do: true, for: true, from: true, get: true, give: true, help: true, how: true, i: true, in: true, into: true, is: true, make: true, me: true, my: true, need: true, of: true, on: true, open: true, or: true, plan: true, planner: true, please: true, should: true, show: true, tell: true, the: true, this: true, to: true, tool: true, use: true, what: true, will: true, with: true };

  var GEOGRAPHY_SEARCH_TERMS = { abidjan: true, abuja: true, accra: true, africa: true, african: true, cameroon: true, dakar: true, douala: true, egypt: true, ethiopia: true, ghana: true, ibadan: true, kenya: true, kigali: true, lagos: true, morocco: true, nairobi: true, nigeria: true, rwanda: true, senegal: true, tanzania: true, uganda: true, zambia: true, zimbabwe: true };

  function normalizeSearchText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenizeToolQuery(value, options) {
    var opts = options || {};
    var minLength = Number(opts.minLength || 3);
    var limit = Number(opts.limit || 80);
    var tokens = normalizeSearchText(value)
      .split(/\s+/)
      .filter(function keepToken(token) {
        return token && token.length >= minLength && !SEARCH_STOP_WORDS[token];
      });
    return unique(tokens).slice(0, limit);
  }

  function toolSearchFields(tool) {
    var entry = tool || {};
    return [
      { name: 'id', weight: 10, value: entry.id },
      { name: 'slug', weight: 10, value: entry.slug },
      { name: 'title', weight: 9, value: entry.title },
      { name: 'intent', weight: 8, value: array(entry.userIntents).join(' ') },
      { name: 'example', weight: 5, value: array(entry.exampleQueries).join(' ') },
      { name: 'description', weight: 3, value: entry.shortDescription },
      { name: 'category', weight: 3, value: entry.category },
      { name: 'subcategory', weight: 4, value: entry.subcategory },
      { name: 'alias', weight: 7, value: array(entry.aliases).join(' ') },
    ].map(function normalizeField(field) {
      return Object.assign({}, field, { normalized: normalizeSearchText(field.value) });
    });
  }

  function containsSearchToken(fieldText, token) {
    if (!fieldText || !token) return false;
    var padded = ' ' + String(fieldText).replace(/-/g, ' ') + ' ';
    return padded.indexOf(' ' + token + ' ') !== -1;
  }

  function phraseScore(queryText, fields) {
    var score = 0;
    if (!queryText) return score;
    fields.forEach(function scoreField(field) {
      if (!field.normalized || field.normalized.length < 4) return;
      if (queryText.indexOf(field.normalized) !== -1) score += field.weight * 3;
      if (field.normalized.indexOf(queryText) !== -1 && queryText.length >= 6) score += field.weight * 2;
    });
    return score;
  }

  function rankToolCandidates(query, manifest, options) {
    var opts = options || {};
    var tools = array(Array.isArray(manifest) ? manifest : loadDefaultToolManifest());
    var limit = Number(opts.limit || 25);
    var minScore = Number(opts.minScore || 8);
    var queryText = normalizeSearchText(query);
    var tokens = tokenizeToolQuery(query, { limit: opts.tokenLimit || 80 });
    var deterministicToolId = text(opts.selectedToolId || opts.deterministicToolId);

    var ranked = tools
      .map(function scoreTool(tool) {
        var fields = toolSearchFields(tool);
        var matchedFields = {};
        var matchedTerms = {};
        var score = phraseScore(queryText, fields);

        if (deterministicToolId && (tool.id === deterministicToolId || tool.slug === deterministicToolId || array(tool.aliases).indexOf(deterministicToolId) !== -1)) {
          score += 1000;
          matchedFields.deterministic = true;
        }

        tokens.forEach(function scoreToken(token, tokenIndex) {
          fields.forEach(function scoreField(field) {
            if (!containsSearchToken(field.normalized, token)) return;
            score += field.weight + (token.length > 5 ? 2 : 0);
            if ((field.name === 'id' || field.name === 'slug' || field.name === 'title') && tokenIndex < 3) score += 8 - tokenIndex * 2;
            matchedFields[field.name] = true;
            matchedTerms[token] = true;
          });
        });

        if (array(tool.aiCapabilities).indexOf('prefill') !== -1) score += 1;
        if (array(tool.aiCapabilities).indexOf('route_only') !== -1) score += 0.5;
        var matchedTermList = Object.keys(matchedTerms);
        if (
          matchedTermList.length &&
          matchedTermList.every(function isGeographyOnly(term) {
            return GEOGRAPHY_SEARCH_TERMS[term] === true;
          })
        ) {
          score = Math.min(score, 5);
        }

        return { tool: tool, score: Math.round(score * 100) / 100, matchedFields: Object.keys(matchedFields), matchedTerms: matchedTermList };
      })
      .filter(function keepCandidate(candidate) {
        return candidate.score >= minScore;
      })
      .sort(function sortCandidate(left, right) {
        return right.score - left.score || String(left.tool.id).localeCompare(String(right.tool.id));
      });

    return { queryTokenCount: tokens.length, catalogSize: tools.length, candidates: limit > 0 ? ranked.slice(0, limit) : ranked };
  }

  function slugFromRoute(route, id) {
    var parts = routeKey(route)
      .replace(/^\/+|\/+$/g, '')
      .split('/')
      .filter(Boolean);
    return parts[0] === 'tools' && parts[1] ? parts[1] : parts[parts.length - 1] || id;
  }

  function normalizeCountries(countries) {
    var values = Array.isArray(countries) ? countries : [countries];
    var normalized = values
      .map(function mapCountry(country) {
        var value = text(country);
        return value === 'All African countries' || value === 'Pan-African' ? 'ALL' : value.toUpperCase();
      })
      .filter(Boolean);
    return unique(normalized.length ? normalized : ['ALL']);
  }

  function registryToDirectory(tool) {
    return { id: tool.id, name: tool.name, description: tool.desc || tool.description || '', category_key: tool.category || 'uncategorized', category: tool.category || 'Uncategorized', countries: tool.countries || tool.country || ['ALL'], language: tool.lang || 'en', url: tool.href || '/tools/' + tool.id + '/', priority: Number(tool.priority || 0), status: tool.status || 'Live' };
  }

  function haystack(record) {
    return [record.id, record.name, record.description, record.category_key, record.category].join(' ').toLowerCase();
  }

  function inferHighStakes(record) {
    var h = haystack(record);
    if (/paye|tax|vat|irs|firs|sars|withholding|wht/.test(h)) return 'tax';
    if (/immigration|visa|japa|passport|study abroad/.test(h)) return 'immigration';
    if (/legal|contract|compliance|permit|cac|privacy policy|data protection/.test(h)) return 'legal';
    if (/health|medical|hospital|genotype|sickle|drug|medicine|hiv|mental/.test(h)) return 'health';
    if (/cv|resume|cover letter|job|career|employment|payroll|minimum wage|leave|overtime/.test(h)) return 'employment';
    if (/scholarship|school|student|jamb|gpa|study/.test(h)) return 'education';
    if (/solar|fuel|electric|power|energy|generator/.test(h)) return 'energy';
    if (/finance|loan|mortgage|insurance|bank|fee|import duty|cost|price|fx|currency/.test(h)) return 'finance';
    return 'none';
  }

  function inferPrivacy(record, stakes) {
    var h = haystack(record);
    if (/files never leave|browser|local-only|pdf|cv|resume|cover letter|invoice|document/.test(h)) return 'browser_local';
    if (/ai|advisor|interpreter|planner|chat/.test(h) || stakes === 'health') return 'ai_optional';
    if (/workspace|save|account|pro|subscription/.test(h)) return 'account_optional';
    return 'browser_local';
  }

  function inferSource(record, stakes) {
    var h = haystack(record);
    if (/cv|resume|cover letter|pdf|invoice|document|floor plan/.test(h)) return 'user_input';
    if (/official|government|source|verified|gazette/.test(h)) return 'official';
    if (stakes === 'tax' || stakes === 'legal' || stakes === 'energy') return 'mixed';
    if (/estimate|calculator|cost|price|roi|budget/.test(h)) return 'estimated';
    return 'reviewed';
  }

  function inferCapabilities(record) {
    var h = haystack(record);
    var out = ['route_only'];
    if (/calculator|estimate|cost|paye|tax|vat|invoice|scholarship|study|solar|fuel|import|planner|cv|resume|cover/.test(h)) out.push('prefill');
    if (/ai|advisor|explain|interpreter|calculator|estimate|tracker|finder|compare|atlas|stream/.test(h)) out.push('explain');
    if (/cv|resume|cover|invoice|plan|letter|document|pdf|generator/.test(h)) out.push('generate_document');
    if (/compare|versus|vs|finder|tracker|atlas|market|directory|scholarship/.test(h)) out.push('compare');
    if (/pdf|export|download|report|invoice|cv|resume|checklist|generator|calculator/.test(h)) out.push('export');
    return unique(out);
  }

  function inferOutputs(record, stakes) {
    var h = haystack(record);
    var out = [];
    if (/calculator|cost|price|roi|tax|vat|paye|fee|loan|mortgage|salary|fuel/.test(h)) out.push('number');
    if (/tracker|compare|directory|finder|atlas|market|rates|scholarship/.test(h)) out.push('table');
    if (/finder|scholarship|directory|stream|creator/.test(h)) out.push('shortlist');
    if (/cv|resume/.test(h)) out.push('cv');
    if (/pdf|invoice|cv|resume|cover|report|planner|generator/.test(h)) out.push('pdf');
    if (/checklist|permit|registration|compliance|setup/.test(h)) out.push('checklist');
    if (/api|data|atlas|workspace|export/.test(h)) out.push('json');
    if (/report|advisor|interpreter|planner|business/.test(h)) out.push('report');
    if (/image|design|floor|map/.test(h)) out.push('image');
    if (/atlas|map|route/.test(h)) out.push('map');
    return unique(out.length ? out : [stakes === 'none' ? 'report' : 'checklist']);
  }

  function inferRequired(record, stakes) {
    var h = haystack(record);
    if (/paye|salary tax|take home pay/.test(h)) return [INPUTS.country, INPUTS.grossPay, INPUTS.payPeriod];
    if (/import duty|customs|landed cost/.test(h)) return [INPUTS.destinationCountry, INPUTS.itemCategory, INPUTS.itemValue];
    if (/solar|power cost|generator|study abroad|scholarship/.test(h)) return [INPUTS.country];
    if (stakes === 'tax' || stakes === 'legal' || stakes === 'education') return [INPUTS.country];
    return [];
  }

  function inferMonetization(record) {
    var h = haystack(record);
    var out = [];
    if (/sponsor|partner|affiliate/.test(h)) out.push('sponsored_slot');
    if (/premium|pro|pdf|export|download/.test(h)) out.push('pro_export');
    if (/api|data|rates|forex|market/.test(h)) out.push('api');
    if (/widget|embed/.test(h)) out.push('widget');
    if (/quote|partner|business|lead|service|supplier/.test(h)) out.push('lead_opt_in');
    return unique(out);
  }

  function makeInput(raw) {
    return { name: text(raw && raw.name), label: text(raw && raw.label, raw && raw.name), type: text(raw && raw.type, 'text'), required: Boolean(raw && raw.required), sensitive: Boolean(raw && raw.sensitive) };
  }

  function makeEntry(record, overrides) {
    var id = text(record.id);
    var route = normalizeRoute(record.url || record.href, id);
    var countries = normalizeCountries(record.countries);
    var stakes = inferHighStakes(record);
    var base = { id: id, slug: slugFromRoute(route, id), route: route, title: text(record.name, id), shortDescription: text(record.description || record.desc, 'AfroTools workflow'), category: text(record.category_key || record.category, 'uncategorized'), subcategory: text(record.category_key || record.category, 'general'), countriesSupported: countries, languagesSupported: unique([text(record.language || record.lang, 'en').toLowerCase()]), currencySupport: unique(countries.indexOf('ALL') !== -1 || /forex|currency|fx|import|remittance|japa|study|travel|crypto/.test(haystack(record)) ? ['local', 'USD'] : ['local']), userIntents: unique([text(record.name, id).toLowerCase(), id.replace(/-/g, ' '), 'open ' + text(record.name, id).toLowerCase(), text(record.category_key, 'tools').replace(/-/g, ' ') + ' tool']), exampleQueries: ['Open ' + text(record.name, id), 'Help me use ' + text(record.name, id)], requiredInputs: inferRequired(record, stakes), optionalInputs: [], privacyMode: inferPrivacy(record, stakes), aiCapabilities: inferCapabilities(record), outputTypes: inferOutputs(record, stakes), sourcePolicy: inferSource(record, stakes), highStakesDomain: stakes, monetizationSurfaces: inferMonetization(record), aliases: array(record.aliases), status: text(record.status, 'Live'), priority: Number(record.priority || 0) };
    return normalizeEntry(Object.assign({}, base, overrides[id] || {}));
  }

  function normalizeEntry(entry) {
    entry.countriesSupported = unique(entry.countriesSupported);
    entry.languagesSupported = unique(entry.languagesSupported);
    entry.currencySupport = unique(entry.currencySupport);
    entry.userIntents = unique(entry.userIntents);
    entry.exampleQueries = unique(entry.exampleQueries);
    entry.requiredInputs = array(entry.requiredInputs).map(makeInput);
    entry.optionalInputs = array(entry.optionalInputs).map(makeInput);
    entry.aiCapabilities = unique(entry.aiCapabilities);
    entry.outputTypes = unique(entry.outputTypes);
    entry.monetizationSurfaces = unique(entry.monetizationSurfaces);
    entry.aliases = unique(entry.aliases);
    return entry;
  }

  function mergeByRoute(existing, incoming) {
    var winner = incoming.priority > existing.priority ? incoming : existing;
    var alias = winner === incoming ? existing : incoming;
    winner.aliases = unique(array(winner.aliases).concat(alias.id, array(alias.aliases)));
    winner.userIntents = unique(array(winner.userIntents).concat(alias.userIntents));
    winner.exampleQueries = unique(array(winner.exampleQueries).concat(alias.exampleQueries));
    return normalizeEntry(winner);
  }

  function buildToolManifest(directoryEntries, options) {
    var overrides = Object.assign({}, MAJOR_TOOL_OVERRIDES, options && options.overrides);
    var byRoute = new Map();
    array(directoryEntries).forEach(function addRecord(raw) {
      if (!raw || !raw.id) return;
      var record = raw.href ? registryToDirectory(raw) : raw;
      var entry = makeEntry(record, overrides);
      var key = routeKey(entry.route);
      byRoute.set(key, byRoute.has(key) ? mergeByRoute(byRoute.get(key), entry) : entry);
    });
    return Array.from(byRoute.values()).sort(function sortTools(left, right) {
      return right.priority - left.priority || left.id.localeCompare(right.id);
    });
  }

  function validateInputList(entry, field, errors) {
    if (!Array.isArray(entry[field])) {
      errors.push(entry.id + '.' + field + ' must be an array');
      return;
    }
    entry[field].forEach(function validateInput(inputItem, index) {
      ['name', 'label', 'type'].forEach(function requireInputField(inputField) {
        if (!text(inputItem && inputItem[inputField])) {
          errors.push(entry.id + '.' + field + '[' + index + '].' + inputField + ' is required');
        }
      });
    });
  }

  function allAllowed(values, allowed) {
    return (
      Array.isArray(values) &&
      values.every(function isAllowed(value) {
        return allowed.indexOf(value) !== -1;
      })
    );
  }

  function validateToolManifest(manifest) {
    var errors = [];
    var routes = new Map();
    if (!Array.isArray(manifest)) errors.push('manifest must be an array');
    array(manifest).forEach(function validateEntry(entry, index) {
      if (!entry || typeof entry !== 'object') {
        errors.push('entry[' + index + '] must be an object');
        return;
      }
      TOOL_MANIFEST_SCHEMA.requiredFields.forEach(function requireField(field) {
        if (entry[field] === undefined || entry[field] === null || entry[field] === '') {
          errors.push((entry.id || 'entry[' + index + ']') + '.' + field + ' is required');
        }
      });
      ['id', 'slug', 'route', 'title', 'shortDescription', 'category', 'subcategory'].forEach(function requireString(field) {
        if (!text(entry[field])) errors.push((entry.id || 'entry[' + index + ']') + '.' + field + ' must be a non-empty string');
      });
      if (!String(entry.route || '').startsWith('/')) errors.push(entry.id + '.route must start with /');
      var key = routeKey(entry.route);
      if (routes.has(key)) errors.push('duplicate route ' + key + ' for ' + routes.get(key) + ' and ' + entry.id);
      routes.set(key, entry.id);
      ['countriesSupported', 'languagesSupported', 'currencySupport', 'userIntents', 'exampleQueries'].forEach(function requireArray(field) {
        if (!Array.isArray(entry[field]) || !entry[field].length) errors.push(entry.id + '.' + field + ' must be a non-empty array');
      });
      validateInputList(entry, 'requiredInputs', errors);
      validateInputList(entry, 'optionalInputs', errors);
      if (ALLOWED_VALUES.privacyMode.indexOf(entry.privacyMode) === -1) errors.push(entry.id + '.privacyMode is invalid');
      if (!allAllowed(entry.aiCapabilities, ALLOWED_VALUES.aiCapabilities)) errors.push(entry.id + '.aiCapabilities contains invalid values');
      if (!allAllowed(entry.outputTypes, ALLOWED_VALUES.outputTypes)) errors.push(entry.id + '.outputTypes contains invalid values');
      if (ALLOWED_VALUES.sourcePolicy.indexOf(entry.sourcePolicy) === -1) errors.push(entry.id + '.sourcePolicy is invalid');
      if (ALLOWED_VALUES.highStakesDomain.indexOf(entry.highStakesDomain) === -1) errors.push(entry.id + '.highStakesDomain is invalid');
      if (!allAllowed(entry.monetizationSurfaces, ALLOWED_VALUES.monetizationSurfaces)) errors.push(entry.id + '.monetizationSurfaces contains invalid values');
    });
    return { valid: errors.length === 0, errors: errors };
  }

  function loadDefaultDirectoryEntries() {
    if (root && Array.isArray(root.AFROTOOLS_TOOL_DIRECTORY)) return root.AFROTOOLS_TOOL_DIRECTORY;
    if (root && Array.isArray(root.AFRO_TOOLS)) return root.AFRO_TOOLS.map(registryToDirectory);
    if (typeof require !== 'function') return [];
    var fs = require('fs');
    var path = require('path');
    return JSON.parse(fs.readFileSync(path.join(path.resolve(__dirname, '../../..'), 'data', 'tool-directory.json'), 'utf8'));
  }

  function loadDefaultToolManifest(options) {
    return buildToolManifest(loadDefaultDirectoryEntries(), options);
  }

  function getToolManifestForRouter(manifest) {
    return array(Array.isArray(manifest) ? manifest : loadDefaultToolManifest()).map(function pick(entry) {
      return { id: entry.id, slug: entry.slug, route: entry.route, title: entry.title, shortDescription: entry.shortDescription, category: entry.category, subcategory: entry.subcategory, countriesSupported: array(entry.countriesSupported), languagesSupported: array(entry.languagesSupported), currencySupport: array(entry.currencySupport), userIntents: array(entry.userIntents), exampleQueries: array(entry.exampleQueries), requiredInputs: array(entry.requiredInputs).map(makeInput), optionalInputs: array(entry.optionalInputs).map(makeInput), privacyMode: entry.privacyMode, aiCapabilities: array(entry.aiCapabilities), outputTypes: array(entry.outputTypes), sourcePolicy: entry.sourcePolicy, highStakesDomain: entry.highStakesDomain, aliases: array(entry.aliases) };
    });
  }

  function buildToolInvocation(tool, options) {
    var entry = tool || {};
    var opts = options || {};
    var capabilities = unique(entry.aiCapabilities);
    var canPrefill = capabilities.indexOf('prefill') !== -1;
    return { type: 'existing_tool_call', action: canPrefill ? 'prefill_existing_tool' : 'open_existing_tool', toolId: text(entry.id, 'tool-search'), route: normalizeRoute(entry.route || '/search/', entry.id || 'tool-search'), title: text(entry.title, 'Search AfroTools'), category: text(entry.category, 'search'), subcategory: text(entry.subcategory, 'search'), invocationMode: canPrefill ? 'session_prefill' : 'route_only', canPrefill: canPrefill, inputSchema: { requiredInputs: array(entry.requiredInputs).map(makeInput), optionalInputs: array(entry.optionalInputs).map(makeInput) }, providedInputNames: unique(opts.providedInputNames), missingInputNames: unique(opts.missingInputNames), privacyMode: text(entry.privacyMode, 'browser_local'), sourcePolicy: text(entry.sourcePolicy, 'reviewed'), safetyDomain: text(entry.highStakesDomain, 'none'), capabilities: capabilities, outputTypes: unique(entry.outputTypes) };
  }

  function getToolInvocationManifest(manifest, options) {
    var opts = options || {};
    var tools = array(Array.isArray(manifest) ? manifest : loadDefaultToolManifest());
    var category = text(opts.category).toLowerCase();
    var limit = Number(opts.limit || 0);
    var calls = tools
      .filter(function keepTool(entry) {
        if (!entry || !entry.id) return false;
        if (!category) return true;
        return String(entry.category || '').toLowerCase() === category || String(entry.subcategory || '').toLowerCase() === category;
      })
      .map(function mapTool(entry) {
        return buildToolInvocation(entry);
      });
    return limit > 0 ? calls.slice(0, limit) : calls;
  }

  return { ALLOWED_VALUES: ALLOWED_VALUES, TOOL_MANIFEST_SCHEMA: TOOL_MANIFEST_SCHEMA, MAJOR_TOOL_OVERRIDES: MAJOR_TOOL_OVERRIDES, buildToolManifest: buildToolManifest, validateToolManifest: validateToolManifest, loadDefaultToolManifest: loadDefaultToolManifest, getToolManifestForRouter: getToolManifestForRouter, buildToolInvocation: buildToolInvocation, getToolInvocationManifest: getToolInvocationManifest, tokenizeToolQuery: tokenizeToolQuery, rankToolCandidates: rankToolCandidates };
});
