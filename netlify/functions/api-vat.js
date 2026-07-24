/**
 * AfroVAT API — VAT Calculation Endpoint
 * POST: Calculate VAT (add to amount or extract from amount)
 * GET:  Country VAT info or list all supported countries
 * Auth: x-api-key header or api_key query param
 */
const { getStore } = require('@netlify/blobs');
const { getAllowedOrigin } = require('./utils/cors');
const { checkRateLimit, getRemaining } = require('./_shared/rate-limit');
const { getApiPlanLimit, normalizeApiTier } = require('./_shared/api-plans');

const CORS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Content-Type': 'application/json'
};

/* ========================================================================
   Full African VAT Database — 54 countries
   ======================================================================== */
const VAT_DB = {
  NG: {
    name: 'Nigeria', currency: 'NGN', rate: 7.5, reducedRates: [],
    authority: 'Nigeria Revenue Service (NRS)',
    exemptions: ['See Nigeria Tax Act 2025 section 186; do not treat the separate section 187 zero-rated list as exempt'],
    notes: 'Standard rate 7.5% under Nigeria Tax Act 2025 section 148. Confirm zero-rated supplies under section 187 and exempt supplies under section 186 at invoice level.',
    lastUpdated: '2026-07-22', source: 'Nigeria Tax Act 2025 and Nigeria Revenue Service'
  },
  KE: {
    name: 'Kenya', currency: 'KES', rate: 16, reducedRates: [{ rate: 8, label: 'Petroleum products' }],
    authority: 'Kenya Revenue Authority (KRA)',
    exemptions: ['Unprocessed foodstuffs', 'Agricultural inputs', 'Medical equipment', 'Educational materials'],
    notes: 'Standard rate of 16%. Zero-rated supplies include exports and international transport.',
    lastUpdated: '2024-01-01', source: 'KRA'
  },
  ZA: {
    name: 'South Africa', currency: 'ZAR', rate: 15, reducedRates: [],
    authority: 'South African Revenue Service (SARS)',
    exemptions: ['19 basic food items (brown bread, maize meal, rice, etc.)', 'Fuel levy goods', 'International transport', 'Educational services'],
    notes: 'Increased from 14% to 15% in April 2018. Zero-rated basic foodstuffs protect low-income households.',
    lastUpdated: '2024-01-01', source: 'SARS'
  },
  GH: {
    name: 'Ghana', currency: 'GHS', rate: 21.9, reducedRates: [{ rate: 15, label: 'Standard VAT (before levies)' }],
    authority: 'Ghana Revenue Authority (GRA)',
    exemptions: ['Basic foodstuffs', 'Agricultural inputs', 'Medical supplies', 'Educational materials'],
    notes: 'Effective rate of 21.9% includes: 15% standard VAT + 2.5% NHIL + 2.5% GETFund + 1% COVID levy + 1% KWEF levy.',
    lastUpdated: '2024-01-01', source: 'GRA'
  },
  TZ: {
    name: 'Tanzania', currency: 'TZS', rate: 18, reducedRates: [],
    authority: 'Tanzania Revenue Authority (TRA)',
    exemptions: ['Unprocessed foodstuffs', 'Agricultural inputs', 'Medical services', 'Educational services'],
    notes: 'Standard rate of 18%. Special relief for agricultural sector.',
    lastUpdated: '2024-01-01', source: 'TRA'
  },
  RW: {
    name: 'Rwanda', currency: 'RWF', rate: 18, reducedRates: [],
    authority: 'Rwanda Revenue Authority (RRA)',
    exemptions: ['Basic foodstuffs', 'Agricultural inputs', 'Medical supplies', 'Educational materials'],
    notes: 'Standard rate of 18%. Strong digital tax infrastructure with EBM (Electronic Billing Machine) requirement.',
    lastUpdated: '2024-01-01', source: 'RRA'
  },
  UG: {
    name: 'Uganda', currency: 'UGX', rate: 18, reducedRates: [],
    authority: 'Uganda Revenue Authority (URA)',
    exemptions: ['Unprocessed foodstuffs', 'Agricultural inputs', 'Medical supplies', 'Educational materials', 'Financial services'],
    notes: 'Standard rate of 18%. Rental income is exempt from VAT.',
    lastUpdated: '2024-01-01', source: 'URA'
  },
  ET: {
    name: 'Ethiopia', currency: 'ETB', rate: 15, reducedRates: [],
    authority: 'Ministry of Finance',
    exemptions: [],
    notes: 'VAT Proclamation 1341/2024 Article 8 applies 15% to taxable supplies other than exact Schedule 1 zero-rated supplies. A 0% custom rate requires acceptable Article 9 documentary evidence; this API does not infer exemptions, registration, turnover tax, withholding or product classification.',
    lastUpdated: '2026-07-22', source: 'Ethiopia Ministry of Finance VAT Proclamation 1341/2024',
    sourceUrl: 'https://www.mofed.gov.et/media/filer_public/af/45/af45af2f-7959-4e8b-b736-9494dda9f017/vat_proclamation_no_1341-2016_with_annex.pdf'
  },
  EG: {
    name: 'Egypt', currency: 'EGP', rate: 14, reducedRates: [{ rate: 5, label: 'Machinery and equipment' }],
    authority: 'Egyptian Tax Authority (ETA)',
    exemptions: ['Basic foodstuffs', 'Health services', 'Educational services', 'Banking and financial services'],
    notes: 'Standard rate of 14%. Table tax applies to certain goods at different rates.',
    lastUpdated: '2024-01-01', source: 'ETA'
  },
  MA: {
    name: 'Morocco', currency: 'MAD', rate: 20, reducedRates: [{ rate: 10, label: 'Exact CGI 2026 Article 99-B item with retained classification evidence' }],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: [],
    notes: 'CGI 2026 has 20% and exact listed 10% treatments. Former 14% and 7% bands are retired. Article 92 qualifying exports are exempt with deduction, not generic zero-rated supplies.',
    lastUpdated: '2026-07-22', source: 'https://www.finances.gov.ma/Publication/dgi/2025/CGI-2026-FR.pdf'
  },
  DZ: {
    name: 'Algeria', currency: 'DZD', rate: 19, reducedRates: [{ rate: 9, label: 'Basic goods and services' }],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: ['Basic foodstuffs (bread, milk, cereals)', 'Medical products', 'Educational materials'],
    notes: 'Standard rate of 19% with reduced rate of 9% for essential goods.',
    lastUpdated: '2024-01-01', source: 'DGI'
  },
  TN: {
    name: 'Tunisia', currency: 'TND', rate: 19, reducedRates: [],
    authority: 'Direction Generale des Impots',
    exemptions: [],
    notes: 'The current Ministry of Finance tax overview states a 19% general VAT rate. This API calculates general-rate transactions only and does not infer reduced-rate eligibility, exemptions, exports, suspension regimes, withholding or other special treatments.',
    lastUpdated: '2026-07-23', source: 'Tunisia Ministry of Finance current tax overview and Finance Law 2026',
    sourceUrl: 'https://www.finances.gov.tn/ar/lmht-amwt'
  },
  CM: {
    name: 'Cameroon', currency: 'XAF', rate: 19.25, reducedRates: [{ rate: 10, label: 'Qualifying social-housing operations; evidence required' }],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: [],
    notes: 'Effective rate 19.25% (17.5% base VAT plus communal additional tax equal to 10% of base VAT). The 10% social-housing rate, zero-rating, exemptions and VAT withholding require current evidence and are not inferred by this API.',
    lastUpdated: '2026-07-22', source: 'DGI and MINFI Cameroon official 2026 material'
  },
  SN: {
    name: 'Senegal', currency: 'XOF', rate: 18, reducedRates: [10],
    authority: 'Direction Generale des Impots et des Domaines (DGID)',
    exemptions: [],
    notes: 'CGI Article 369 standard rate 18%. The 10% rate is limited to accommodation and restaurant services supplied by an approved tourist accommodation establishment and requires exact retained evidence. Exemptions, exports, registration thresholds, filing and other special regimes are not inferred.',
    lastUpdated: '2026-07-23', source: 'DGID laws hub and Ministry of Finance LFI 2026'
  },
  CI: {
    name: "Cote d'Ivoire", currency: 'XOF', rate: 18, reducedRates: [{ rate: 9, label: 'Exact current CGI Article 359 or Ordinance 2026-03 item; evidence required' }],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: [],
    notes: 'Common rate 18%. The 9% and exempt paths require an exact current legal item; broad product categories are not inferred. Ordinance 2026-03 applies 9% to four named groups from 17 January 2026.',
    lastUpdated: '2026-07-22', source: 'DGI Cote d\'Ivoire 2026 CGI resources and Ordinance 2026-03 communique'
  },
  AO: {
    name: 'Angola', currency: 'AOA', rate: 14, reducedRates: [{ rate: 5, label: 'Basic food basket items' }, { rate: 7, label: 'Hotels and tourism' }],
    authority: 'Administracao Geral Tributaria (AGT)',
    exemptions: ['Medical services', 'Educational services', 'Financial services'],
    notes: 'VAT introduced in October 2019 at 14%. Replaced consumption tax.',
    lastUpdated: '2024-01-01', source: 'AGT'
  },
  CD: {
    name: 'Democratic Republic of the Congo', currency: 'CDF', rate: 16, reducedRates: [{ rate: 8, label: 'Exact current reduced-rate item; evidence required' }],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: [],
    notes: 'DGI current general rate 16%. The 8% reduced lane and qualifying-export 0% require exact current evidence; broad categories are not inferred.',
    lastUpdated: '2026-07-22', source: 'DGI RDC and Ministry of Budget 2026 material',
    sourceUrl: 'https://dgi.gouv.cd/taxe-sur-la-valeur-ajoutee-tva/'
  },
  ZM: {
    name: 'Zambia', currency: 'ZMW', rate: 16, reducedRates: [],
    authority: 'Zambia Revenue Authority (ZRA)',
    exemptions: [],
    notes: 'ZRA current tax information sets the standard rate at 16%. ZRA invoice codes distinguish exports, LPO/project transactions, zero-rated-by-nature supplies and exempt supplies; this API calculates standard-rate transactions only and does not infer those treatments.',
    lastUpdated: '2026-07-23', source: 'ZRA tax information and VSDC API specification',
    sourceUrl: 'https://www.zra.org.zm/tax-information/'
  },
  ZW: {
    name: 'Zimbabwe', currency: 'ZWG', rate: 15.5, reducedRates: [],
    authority: 'Zimbabwe Revenue Authority (ZIMRA)',
    exemptions: [],
    notes: 'Finance Act 7 of 2025 section 34 and ZIMRA Notice 07 of 2026 apply the 15.5% standard rate from 1 January 2026. This API preserves an explicit ZWG or USD input currency without FX conversion and does not infer zero-rated, exempt or other special treatment.',
    lastUpdated: '2026-07-23', source: 'ZIMRA Notice 07 of 2026 and Finance Act 7 of 2025',
    sourceUrl: 'https://www.zimra.co.zw/public-notices?download=4441%3Apublic-notice-07-of-2026-change-of-vat-rate-on-submission-of-return-category-a'
  },
  BW: {
    name: 'Botswana', currency: 'BWP', rate: 14, reducedRates: [],
    authority: 'Botswana Unified Revenue Service (BURS)',
    exemptions: ['Basic foodstuffs', 'Medical services', 'Educational services', 'Financial services', 'Residential rent'],
    notes: 'Standard rate of 14%. Well-administered VAT system.',
    lastUpdated: '2024-01-01', source: 'BURS'
  },
  NA: {
    name: 'Namibia', currency: 'NAD', rate: 15, reducedRates: [],
    authority: 'Namibia Revenue Agency (NamRA)',
    exemptions: [],
    notes: 'VAT Act section 6 standard 15%. Exact Schedule III zero-rating and Schedule IV exemption require retained evidence. Act 5 of 2024 raised compulsory registration above N$1 million over 12 months.',
    lastUpdated: '2026-07-23', source: 'NamRA consolidated VAT Act and Act 5 of 2024'
  },
  MZ: {
    name: 'Mozambique', currency: 'MZN', rate: 16, reducedRates: [],
    authority: 'Autoridade Tributaria de Mocambique (AT)',
    exemptions: [],
    notes: 'Law 22/2022 standard rate 16%. Exact private health or education services at 5% and qualifying exports require retained evidence. Law 10/2025 removed former special exemption and simplified regimes from 1 January 2026.',
    lastUpdated: '2026-07-23', source: 'Mozambique Law 22/2022 and Law 10/2025'
  },
  MW: {
    name: 'Malawi', currency: 'MWK', rate: 17.5, reducedRates: [],
    authority: 'Malawi Revenue Authority (MRA)',
    exemptions: [],
    notes: 'Act 37 of 2025 replaces 16.5% with the current 17.5% standard rate. Older MRA EIS examples showing 16.5% are stale. Special treatments are not inferred.',
    lastUpdated: '2026-07-22', source: 'https://www.mra.mw/admin/storage/download_files/1767960417_Value%20Adde%20Tax%20%28Amendment%29%20%28NO.%202%29%20ACT.pdf'
  },
  MU: {
    name: 'Mauritius', currency: 'MUR', rate: 15, reducedRates: [],
    authority: 'Mauritius Revenue Authority (MRA)',
    exemptions: [],
    notes: 'Standard rate 15%. Zero-rating and exemption require an exact Fifth or First Schedule item; tourist services are not inferred as zero-rated.',
    lastUpdated: '2026-07-22', source: 'https://attorneygeneral.govmu.org/Documents/Laws%20of%20Mauritius/A-Z%20Acts/V/ValueAddedTaxActI9.pdf'
  },
  MG: {
    name: 'Madagascar', currency: 'MGA', rate: 20, reducedRates: [{ rate: 10, label: 'Butane gas or containers under tariff lines 2711.13 00 or 7311.00 00 with exact evidence' }],
    authority: 'Direction Generale des Impots',
    exemptions: [],
    notes: 'Article 06.01.12 sets 20% standard, 10% only for the stated butane tariff lines, and 0% for exports of goods or services. Special treatments require exact evidence; exemptions are not inferred.',
    lastUpdated: '2026-07-22', source: 'https://www.impots.mg/explorer?path=/legislation/Codes%20et%20Manuels/CDI-LFI%202026.pdf'
  },
  DJ: {
    name: 'Djibouti', currency: 'DJF', rate: 10, reducedRates: [],
    authority: 'Direction des Impots',
    exemptions: [],
    notes: 'Current standard rate 10%. Article 19 zero-rating and Article 8 exemptions require exact statutory and transaction evidence; broad categories are not inferred.',
    lastUpdated: '2026-07-22', source: 'Djibouti Official Journal VAT law and later finance laws'
  },
  SC: {
    name: 'Seychelles', currency: 'SCR', rate: 15, reducedRates: [],
    authority: 'Seychelles Revenue Commission (SRC)',
    exemptions: [],
    notes: 'Standard rate 15%. A 0% request requires an exact current Second Schedule zero-rated supply or exact current First Schedule exempt supply, with the treatments kept distinct. Compulsory and voluntary registration thresholds are SCR 2,000,000 and SCR 100,000 respectively; eligibility and approval are separate.',
    lastUpdated: '2026-07-23', source: 'SRC VAT legislation, Act 16 of 2024 and S.I. 97 of 2024'
  },
  SZ: {
    name: 'Eswatini', currency: 'SZL', rate: 15, reducedRates: [],
    authority: 'Eswatini Revenue Service (ERS)',
    exemptions: [],
    notes: 'ERS states that VAT applies to most goods and services at 15%. A 0% custom rate requires an exact current Second Schedule match and retained evidence; this API does not infer exemptions, registration, withholding, filing or product classification.',
    lastUpdated: '2026-07-22', source: 'ERS VAT Act 2011 and current amendment schedule',
    sourceUrl: 'https://www.ers.org.sz/LegalandPolicy/TaxLegislation'
  },
  LS: {
    name: 'Lesotho', currency: 'LSL', rate: 15, reducedRates: [{ rate: 10, label: 'Electricity only; current RSL evidence required' }],
    authority: 'Revenue Services Lesotho (RSL)', exemptions: [],
    notes: 'RSL publishes 15% for telecommunications and other goods and services, 10% for electricity, and 0% for exports and exact Fourth Schedule items. Special rates require evidence; exemptions stay separate.',
    lastUpdated: '2026-07-22', source: 'RSL tax rates, VAT return guidance and current publications', sourceUrl: 'https://www.rsl.org.ls/tax-rates'
  },
  CV: {
    name: 'Cabo Verde', currency: 'CVE', rate: 15, reducedRates: [8],
    authority: 'Direccao Nacional de Receitas do Estado (DNRE)',
    exemptions: [],
    notes: 'Standard IVA is 15%. The 8% rate is limited to electricity transmission and water supply to final consumers under Article 73 of the 2026 State Budget and requires explicit evidence. Tourism returned to 15% under the DNRE 2022 circular. Zero-rating, exemptions and withholding are not inferred by this API.',
    lastUpdated: '2026-07-22', source: 'Cabo Verde 2026 State Budget Article 73; DNRE IVA guidance and Circular 01/2022'
  },
  LR: {
    name: 'Liberia', currency: 'LRD', rate: 13, reducedRates: [],
    authority: 'Liberia Revenue Authority (LRA)',
    exemptions: [],
    notes: 'The December 2025 Tax Amendment Act sets 13% for taxable goods and services and 0% for exact exports of goods. Telecommunications is not modeled because the enacted 13% plus 5% surtax conflicts with the LRA notice stating 15%. No exemption, export, registration or filing treatment is inferred.',
    lastUpdated: '2026-07-22', source: 'LRA December 2025 Tax Amendment Act and April 2026 implementation notice', sourceUrl: 'https://revenue.lra.gov.lr/wp-content/uploads/2026/04/LRC-Amendment-December-2025.pdf'
  },
  SL: {
    name: 'Sierra Leone', currency: 'SLE', rate: 15, reducedRates: [],
    authority: 'National Revenue Authority (NRA)',
    exemptions: [],
    notes: 'Goods and Services Tax at 15%. Zero-rated First Schedule and exempt Second Schedule treatments require exact current evidence; Finance Act 2026 changes are not inferred as generic categories.',
    lastUpdated: '2026-07-23', source: 'NRA GST Act, Finance Act 2024 and Finance Act 2026', sourceUrl: 'https://nra.gov.sl/dtd/1'
  },
  GM: {
    name: 'Gambia', currency: 'GMD', rate: 15, reducedRates: [],
    authority: 'Gambia Revenue Authority (GRA)',
    exemptions: [],
    notes: 'GRA standard rate 15%. A 0% custom rate is limited to a confirmed export of goods or services with exact evidence. Exemptions are not treated as zero-rated.',
    lastUpdated: '2026-07-22', source: 'GRA Domestic Taxes FAQs and VAT guide',
    sourceUrl: 'https://www.gra.gm/domestic-faqs'
  },
  MR: {
    name: 'Mauritania', currency: 'MRU', rate: 16, reducedRates: [],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: [],
    notes: 'CGI Article 230: 16% normal; 18% telephony under enacted LFR 2023; 0% only for exports by a VAT-taxable person. Article 215 exemptions require exact item evidence.',
    lastUpdated: '2026-07-22', source: 'Mauritania Ministry of Finance CGI 2023, LFR 2023 and LF 2026',
    sourceUrl: 'https://finances.gov.mr/sites/default/files/2023-03/CGI-Fr-2023.pdf'
  },
  BJ: {
    name: 'Benin', currency: 'XOF', rate: 18, reducedRates: [],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs', 'Educational materials'],
    notes: 'Standard rate of 18%. Member of WAEMU.',
    lastUpdated: '2024-01-01', source: 'DGI Benin'
  },
  BF: {
    name: 'Burkina Faso', currency: 'XOF', rate: 18, reducedRates: [],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: ['Basic foodstuffs', 'Medical supplies', 'Agricultural inputs', 'Educational materials'],
    notes: 'Standard rate of 18%. Member of WAEMU.',
    lastUpdated: '2024-01-01', source: 'DGI Burkina Faso'
  },
  ML: {
    name: 'Mali', currency: 'XOF', rate: 18, reducedRates: [{ rate: 5, label: 'Only an exact CGI Point D tariff-table product with retained evidence' }],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: [],
    notes: 'CGI Article 229 sets 18% standard and 5% only for exact Point D products. Article 195 direct-export exemption requires evidence and is not generic zero-rating. Other exemptions are not inferred.',
    lastUpdated: '2026-07-23', source: 'https://www.dgi.gouv.ml/CGI/'
  },
    NE: {
      name: 'Niger', currency: 'XOF', rate: 19, reducedRates: [10, 5],
      authority: 'Direction Generale des Impots (DGI)',
      exemptions: ['Only exact operations listed by Finance Law 2026 Article 322'],
      notes: 'CGI Article 226: 19% standard, evidence-gated 10% land transport or hotel services, and evidence-gated 5% listed products. Article 322 exemptions are not a generic zero rate.',
      lastUpdated: '2026-07-23', source: 'DGI Niger CGI 2025 and Ordinance 2025-44'
  },
  TG: {
    name: 'Togo', currency: 'XOF', rate: 18, reducedRates: [],
    authority: 'Office Togolais des Recettes (OTR)',
    exemptions: [],
    notes: 'OTR General Tax Code Article 195 sets a single 18% standard rate, subject to Article 180 exemptions. This API calculates standard-rated transactions only and does not infer exemptions, exports, prepayment, leasing or later 2026 special measures.',
    lastUpdated: '2026-07-23', source: 'OTR General Tax Code updated 2025 and Fiscal Handbook 2026',
    sourceUrl: 'https://www.otr.tg/index.php/fr/documentation/sur-les-impots/code-general-des-impots/628-cahier-fiscal-2026.html'
  },
  GN: {
    name: 'Guinea', currency: 'GNF', rate: 18, reducedRates: [],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: [],
    notes: 'CGI Article 373 standard rate is 18%. A 0% custom rate requires exact Article 373 export or international-transport evidence. Exemptions are not zero-rated.',
    lastUpdated: '2026-07-22', source: 'Guinea DGI Code general des impots and current Ministry of Budget finance-law index',
    sourceUrl: 'https://dgi.gov.gn/code-general-des-impots/'
  },
  GW: {
    name: 'Guinea-Bissau', currency: 'XOF', rate: 19,
    reducedRates: [{ rate: 10, label: 'Exact CIVA Article 18 Annex I entry; evidence required' }],
    authority: 'Direcao-Geral das Contribuicoes e Impostos (DGCI)',
    exemptions: [],
    notes: 'CIVA Article 18 applies 19% generally, 10% only to exact Annex I entries and 0% to exports. Special rates require retained evidence; exemptions are separate.',
    lastUpdated: '2026-07-22', source: 'Guinea-Bissau DGCI Kontaktu and CIVA Law 4/2022',
    sourceUrl: 'https://kontaktu.mef.gw/'
  },
  TD: {
    name: 'Chad', currency: 'XAF', rate: 19.25, reducedRates: [{ rate: 9.9, label: 'Effective invoice rate for Article 238 listed supplies, including centimes additionnels' }],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: [],
    notes: 'Effective invoice rates include provincial and communal centimes additionnels equal to 10% of base VAT: 19.25% on the 17.5% base and 9.9% on the 9% Article 238 base. Exact evidence remains required for 9%, zero-rating and exemptions.',
    lastUpdated: '2026-07-22', source: 'Chad Ministry of Finance 2024 application circular, CGI 2025 and 2026 application circular',
    sourceUrl: 'https://www.finances.gouv.td/index.php/le-ministere/le-ministre/item/download/404_2503d5c174528169afd3a9cd827c3cb0'
  },
  GA: {
    name: 'Gabon', currency: 'XAF', rate: 18, reducedRates: [{ rate: 10, label: 'Exact Article 221 listed operation; evidence required' }, { rate: 5, label: 'Exact Article 221 listed operation; evidence required' }, { rate: 0, label: 'Exact Article 221 zero-rated operation; evidence required' }],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: [],
    notes: '2026 standard rate 18%. Rates of 10%, 5% and 0% require an exact Article 221 match and retained evidence. Article 220 floors the taxable base to the nearest XAF 1,000.',
    lastUpdated: '2026-07-22', source: 'Gabon Finance Law 2026 and DGI CGI 2025',
    sourceUrl: 'https://journal-officiel.ga/22265-041-2025-/'
  },
  CG: {
    name: 'Republic of the Congo', currency: 'XAF', rate: 18.9, reducedRates: [{ rate: 5.25, label: 'Effective invoice burden for confirmed Annex 5 goods (5% VAT plus centimes)' }],
    authority: 'Direction Generale des Impots (DGI)',
    exemptions: [],
    notes: 'The standard invoice burden is 18.9%: 18% VAT plus centimes additionnels equal to 5% of VAT. The confirmed Annex 5 treatment has a 5.25% invoice burden. Exact evidence is required for Annex 5, zero-rated and exempt treatment.',
    lastUpdated: '2026-07-22', source: 'Congo Journal officiel, Finance Laws 2024 and 2026',
    sourceUrl: 'https://sgg.cg/JO/2026/congo-jo-2026-3-3.pdf'
  },
  GQ: {
    name: 'Equatorial Guinea', currency: 'XAF', rate: 15,
    reducedRates: [{ rate: 5, label: 'Exact Article 13 imported-product line; evidence required' }],
    authority: 'Dirección General de Impuestos y Contribuciones (DGIC)',
    exemptions: [],
    notes: 'General IVA rate 15%. The 2026 State Budget Article 13 import treatments at 5% and 0% require an exact listed-product match and evidence. No generic exemption, export, threshold, withholding or custom-rate treatment is inferred.',
    lastUpdated: '2026-07-22', source: 'General Tax Law 1/2024 and 2026 State Budget Article 13'
  },
  CF: {
    name: 'Central African Republic', currency: 'XAF', rate: 19, reducedRates: [5],
    authority: 'Direction Generale des Impots et des Domaines (DGID)',
    exemptions: [],
    notes: 'General rate 19%. The 5% tariff-list rate and 0% qualifying export treatment require exact statutory evidence; no generic exemption or withholding treatment is inferred.',
    lastUpdated: '2026-07-22', source: 'DGID CGI updated 2023, Articles 247, 257, 268 and 275'
  },
  ST: {
    name: 'Sao Tome and Principe', currency: 'STN', rate: 15, reducedRates: [7.5],
    authority: 'Direccao dos Impostos',
    exemptions: [],
    notes: 'CIVA standard rate 15%. The 7.5% rate requires an exact Annex I basic-basket line. Generic exemptions and the illustrative 16% manual example are not accepted.',
    lastUpdated: '2026-07-23', source: 'National Assembly CIVA records'
  },
  SD: {
    name: 'Sudan', currency: 'SDG', rate: 17, reducedRates: [],
    authority: 'Sudan Tax Authority / Taxation Chamber',
    exemptions: [],
    notes: 'The Tax Authority confirmed on 28 March 2026 that Article 22 of the 2001 VAT Law applies a fixed 17% rate. This API models standard-rate arithmetic only and does not infer exemptions, zero-rating, registration, filing, invoice compliance or input-tax eligibility.',
    lastUpdated: '2026-07-23', source: 'Sudan Tax Authority official clarification and VAT guidance',
    sourceUrl: 'https://tax.gov.sd/en/newsen/'
  },
  SS: {
    name: 'South Sudan', currency: 'SSP', rate: 18, reducedRates: [],
    authority: 'National Revenue Authority (NRA)',
    exemptions: ['Basic foodstuffs', 'Medical supplies'],
    notes: 'Standard rate of 18%. VAT system still developing.',
    lastUpdated: '2024-01-01', source: 'NRA South Sudan'
  },
  BI: {
    name: 'Burundi', currency: 'BIF', rate: 18, reducedRates: [{ rate: 10, label: 'Exact VAT Law 2020 Article 15 intermediate-rate supply; evidence required' }],
    authority: 'Office Burundais des Recettes (OBR)',
    exemptions: [],
    notes: 'Standard rate 18%. The 10% intermediate rate and 0% treatment require an exact Article 15 classification and retained evidence. Compulsory registration is at taxable turnover of at least BIF 25,000,000 since FY2025; OBR requires VAT charging from 1 July 2026 and monthly declaration by the 15th. Exemptions and withholding are not inferred.',
    lastUpdated: '2026-07-23', source: 'OBR current VAT law guide and 2026/27 registration communique',
    sourceUrl: 'https://www.obr.bi/index.php/communiques/2528-communique-aux-contribuables-ayant-un-chiffre-d-affaires-de-25-millions-de-fbu'
  },
  KM: {
    name: 'Comoros', currency: 'KMF', rate: 10, reducedRates: [{ rate: 3, label: 'Confirmed Article 152 water, electricity or inter-island transport ticket' }, { rate: 5, label: 'Confirmed Article 152 restaurant, banking, fixed telephone or international transport ticket' }, { rate: 7.5, label: 'Confirmed Article 152 mobile voice/data recharge' }, { rate: 25, label: 'Confirmed Article 152 casino activity' }],
    authority: 'Direction Generale des Impots',
    exemptions: [],
    notes: 'Officially Taxe sur la Consommation (TC), not VAT. Reference rate 10%. Article 152 special rates and the exact ministerial essential-product list require explicit evidence; broad exemptions are not inferred. The separate Article 152 additional tax of KMF 50 per minute on incoming-call termination is quantity-based and is not calculated by this amount API.',
    knownExclusions: ['Article 152 incoming-call termination additional tax of KMF 50 per minute'],
    lastUpdated: '2026-07-22', source: 'Comoros DGI CGI 2023 and Ministry fiscal-expenditure report for 2024',
    sourceUrl: 'https://finances.gouv.km/wp-content/uploads/2026/02/Rapport-sur-les-Depenses-Fiscales-2024-1-1-5.pdf'
  },
  SO: {
    name: 'Somalia', currency: null, rate: null, reducedRates: [],
    authority: 'Federal Government of Somalia Ministry of Finance',
    exemptions: [],
    calculable: false,
    statusCode: 'NO_VERIFIED_NATIONAL_VAT',
    notes: 'No current nationwide VAT rate is verified from the federal primary sources reviewed. FY2026 evidence lists named sector sales taxes; the separate 2023 USD turnover-tax table is not treated as a current VAT or liability rule.',
    lastUpdated: '2026-07-23', source: 'Federal MoF FY2026 Budget Policy Framework and 2023 Turnover Tax policy', sourceUrl: 'https://mof.gov.so/publications/fiscal-year-2026-budget-policy-framework-paper'
  },
  ER: {
    name: 'Eritrea', currency: 'ERN', rate: null, reducedRates: [0, 5, 10, 12],
    authority: 'Ministry of Finance / Inland Revenue administration',
    exemptions: [],
    notes: 'No conventional VAT system is evidenced. The latest authoritative public summary located is historical (as of December 2002) and reports single-stage sales-tax bands. Calculation therefore requires an explicit 0%, 5%, 10% or 12% rate plus the exact schedule/service-list evidence type; no default current rate is inferred.',
    lastUpdated: '2026-07-22', source: 'IMF summaries of Proclamation 64/1994, Legal Notice 22/1995 and the tax system as of December 2002'
  },
  LY: {
    name: 'Libya', currency: 'LYD', rate: 0, reducedRates: [],
    authority: 'Tax Authority of Libya',
    exemptions: [],
    notes: 'No VAT system currently in place.',
    lastUpdated: '2024-01-01', source: 'Tax Authority'
  }
};

/* ========================================================================
   Helpers
   ======================================================================== */

function respond(status, body, extra = {}) {
  return { statusCode: status, headers: { ...CORS, ...extra }, body: JSON.stringify(body) };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function validateComorosRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null;
  if (!hasCustomRate) return { ok: true, rate: VAT_DB.KM.rate };
  const rate = Number(body.customRate);
  const evidenceTypesByRate = {
    0: 'article-152-essential-list',
    3: 'article-152-utilities-interisland',
    5: 'article-152-five-percent-supply',
    7.5: 'article-152-mobile-recharge',
    25: 'article-152-casino'
  };
  const expectedEvidenceType = evidenceTypesByRate[rate];
  if (body.rateEvidenceConfirmed !== true || !expectedEvidenceType || body.rateEvidenceType !== expectedEvidenceType) {
    return {
      ok: false,
      statusCode: 400,
      error: 'Comoros customRate requires rateEvidenceConfirmed=true and the exact Article 152 evidence type for 3%, 5%, 7.5%, 25% or 0%.',
      code: 'RATE_EVIDENCE_REQUIRED'
    };
  }
  return { ok: true, rate, rateEvidenceType: expectedEvidenceType };
}

function validateCongoRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null;
  if (!hasCustomRate) return { ok: true, rate: VAT_DB.CG.rate };
  const rate = Number(body.customRate);
  const evidenceTypesByRate = { 0: 'article-22-zero-case', 5.25: 'annex-5-tariff-line' };
  const expectedEvidenceType = evidenceTypesByRate[rate];
  if (body.rateEvidenceConfirmed !== true || !expectedEvidenceType || body.rateEvidenceType !== expectedEvidenceType) {
    return { ok: false, statusCode: 400, error: 'Congo customRate requires exact evidence: 5.25% with rateEvidenceType=annex-5-tariff-line or 0% with rateEvidenceType=article-22-zero-case.', code: 'RATE_EVIDENCE_REQUIRED' };
  }
  return { ok: true, rate, rateEvidenceType: expectedEvidenceType };
}

function validateCoteDIvoireRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null;
  if (!hasCustomRate) return { ok: true, rate: VAT_DB.CI.rate };
  const rate = Number(body.customRate);
  const allowedEvidence = rate === 9 ? ['cgi-article-359-item', 'ordinance-2026-03-item'] : rate === 0 ? ['cgi-article-355-item'] : [];
  if (body.rateEvidenceConfirmed !== true || !allowedEvidence.includes(body.rateEvidenceType)) {
    return { ok: false, statusCode: 400, error: "Cote d'Ivoire customRate requires exact evidence: 9% with a current Article 359 or Ordinance 2026-03 item, or 0% with an exact Article 355 exemption.", code: 'RATE_EVIDENCE_REQUIRED' };
  }
  return { ok: true, rate, rateEvidenceType: body.rateEvidenceType };
}

function validateDjiboutiRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null;
  if (!hasCustomRate) return { ok: true, rate: VAT_DB.DJ.rate };
  const rate = Number(body.customRate);
  const allowedEvidence = rate === 0 ? ['customs-export-declaration', 'article-19-international-trade-proof', 'article-8-exemption-item'] : [];
  if (body.rateEvidenceConfirmed !== true || !allowedEvidence.includes(body.rateEvidenceType)) {
    return { ok: false, statusCode: 400, error: 'Djibouti customRate is limited to 0% with an exact Article 8, 12 or 19 evidence type.', code: 'RATE_EVIDENCE_REQUIRED' };
  }
  return { ok: true, rate, rateEvidenceType: body.rateEvidenceType };
}

function validateDrCongoRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null;
  if (!hasCustomRate) return { ok: true, rate: VAT_DB.CD.rate };
  const rate = Number(body.customRate);
  const expectedEvidenceType = rate === 8 ? 'current-dgi-eight-percent-item' : rate === 0 ? 'customs-export-declaration' : null;
  if (body.rateEvidenceConfirmed !== true || !expectedEvidenceType || body.rateEvidenceType !== expectedEvidenceType) {
    return { ok: false, statusCode: 400, error: 'DR Congo customRate requires exact evidence: 8% with rateEvidenceType=current-dgi-eight-percent-item or 0% with rateEvidenceType=customs-export-declaration.', code: 'RATE_EVIDENCE_REQUIRED' };
  }
  return { ok: true, rate, rateEvidenceType: expectedEvidenceType };
}

function validateEquatorialGuineaRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null;
  if (!hasCustomRate) return { ok: true, rate: VAT_DB.GQ.rate };
  const rate = Number(body.customRate);
  const expectedEvidenceType = rate === 5
    ? 'lpge-2026-article-13-five-import-line'
    : rate === 0
      ? 'lpge-2026-article-13-zero-import-line'
      : null;
  if (body.rateEvidenceConfirmed !== true || !expectedEvidenceType || body.rateEvidenceType !== expectedEvidenceType) {
    return { ok: false, statusCode: 400, error: 'Equatorial Guinea customRate requires an exact 2026 State Budget Article 13 import match: 5% with rateEvidenceType=lpge-2026-article-13-five-import-line or 0% with rateEvidenceType=lpge-2026-article-13-zero-import-line.', code: 'RATE_EVIDENCE_REQUIRED' };
  }
  return { ok: true, rate, rateEvidenceType: expectedEvidenceType };
}

function validateEritreaRateRequest(body) {
  const rate = Number(body.customRate);
  const expectedByRate = {
    0: ['listed-zero-or-exempt-case'],
    5: ['listed-goods-five-percent', 'listed-services-five-percent'],
    10: ['listed-services-ten-percent'],
    12: ['residual-goods-twelve-percent']
  };
  const allowed = expectedByRate[rate] || [];
  if (body.customRate === undefined || body.customRate === null || body.rateEvidenceConfirmed !== true || !allowed.includes(body.rateEvidenceType)) {
    return {
      ok: false,
      statusCode: 400,
      error: 'Eritrea has no inferred default VAT rate. Supply an evidence-matched historical sales-tax rate: 0%, 5%, 10% or 12% with its exact schedule or service-list evidence type.',
      code: 'RATE_EVIDENCE_REQUIRED'
    };
  }
  return { ok: true, rate, rateEvidenceType: body.rateEvidenceType };
}

function validateEthiopiaRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null;
  if (!hasCustomRate || Number(body.customRate) === 15) return { ok: true, rate: VAT_DB.ET.rate };
  const rate = Number(body.customRate);
  const exactZeroEvidence = rate === 0
    && body.rateEvidenceConfirmed === true
    && body.rateEvidenceType === 'proclamation-1341-schedule-1-zero-rated-supply';
  if (!exactZeroEvidence) {
    return {
      ok: false,
      statusCode: 400,
      error: 'Ethiopia customRate is limited to 0% with an exact VAT Proclamation 1341/2024 Schedule 1 match and acceptable Article 9 documentary evidence.',
      code: 'RATE_EVIDENCE_REQUIRED'
    };
  }
  return { ok: true, rate: 0, rateEvidenceType: body.rateEvidenceType };
}

function validateEswatiniRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null;
  if (!hasCustomRate || Number(body.customRate) === 15) return { ok: true, rate: VAT_DB.SZ.rate };
  const exactZeroEvidence = Number(body.customRate) === 0
    && body.rateEvidenceConfirmed === true
    && body.rateEvidenceType === 'vat-act-current-second-schedule-zero-rated-supply';
  if (!exactZeroEvidence) {
    return { ok: false, statusCode: 400, error: 'Eswatini customRate is limited to 0% with an exact current VAT Act Second Schedule match and retained transaction evidence.', code: 'RATE_EVIDENCE_REQUIRED' };
  }
  return { ok: true, rate: 0, rateEvidenceType: body.rateEvidenceType };
}

function validateBurundiRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === 18) return { ok: true, rate: 18, treatment: 'taxable-standard' };
  const rate = Number(body.customRate);
  const intermediateEvidence = [
    'obr-vat-2020-article-15-agricultural-input',
    'obr-vat-2020-article-15-locally-transformed-agricultural-product',
    'obr-vat-2020-article-15-minister-listed-foodstuff',
    'obr-vat-2020-article-15-hotel-product-or-service'
  ];
  const zeroEvidence = [
    'obr-vat-2020-article-15-export-or-assimilated-operation',
    'obr-vat-2020-article-15-non-accessory-international-transport',
    'obr-vat-2020-article-15-export-intermediary-transaction'
  ];
  const intermediate = rate === 10
    && body.rateEvidenceConfirmed === true
    && intermediateEvidence.includes(body.rateEvidenceType);
  const zero = rate === 0
    && body.rateEvidenceConfirmed === true
    && zeroEvidence.includes(body.rateEvidenceType);
  if (!intermediate && !zero) {
    return { ok: false, statusCode: 400, code: 'RATE_EVIDENCE_REQUIRED', error: 'Burundi customRate requires an exact VAT Law 2020 Article 15 intermediate-rate supply for 10%, or an exact Article 15 zero-rated operation for 0%, with retained evidence.' };
  }
  return { ok: true, rate, treatment: zero ? 'zero-rated' : 'taxable-intermediate', rateEvidenceType: body.rateEvidenceType };
}

function validateGabonRateRequest(body) {
  if (body.customRate === undefined || body.customRate === null || Number(body.customRate) === 18) return { ok: true, rate: 18 };
  const rate = Number(body.customRate);
  const evidenceByRate = { 10: 'finance-law-2026-article-221-ten-percent-listed-supply', 5: 'finance-law-2026-article-221-five-percent-listed-supply', 0: 'finance-law-2026-article-221-zero-rated-operation' };
  if (body.rateEvidenceConfirmed === true && evidenceByRate[rate] && body.rateEvidenceType === evidenceByRate[rate]) return { ok: true, rate, rateEvidenceType: evidenceByRate[rate] };
  return { ok: false, statusCode: 400, error: 'Gabon customRate is limited to 10%, 5% or 0% with the exact 2026 Article 221 evidence type and rateEvidenceConfirmed=true', code: 'RATE_EVIDENCE_REQUIRED' };
}

function validateGambiaRateRequest(body) {
  if (body.customRate === undefined || body.customRate === null || Number(body.customRate) === 15) return { ok: true, rate: 15 };
  if (Number(body.customRate) === 0 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'gra-current-export-of-goods-or-services') return { ok: true, rate: 0, rateEvidenceType: body.rateEvidenceType };
  return { ok: false, statusCode: 400, error: 'Gambia customRate is limited to 0% for a confirmed export of goods or services with rateEvidenceType=gra-current-export-of-goods-or-services', code: 'RATE_EVIDENCE_REQUIRED' };
}

function validateGuineaRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate) return { ok: true, rate: 18 };
  const rate = Number(body.customRate);
  const confirmedZero = rate === 0 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'dgi-cgi-article-373-export-or-international-transport';
  if (!confirmedZero) return { ok: false, statusCode: 400, code: 'RATE_EVIDENCE_REQUIRED', error: 'Guinea customRate supports only 0% with exact CGI Article 373 evidence.' };
  return { ok: true, rate: 0 };
}

function validateGuineaBissauRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate) return { ok: true, rate: 19 };
  const rate = Number(body.customRate);
  const confirmedReduced = rate === 10 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'civa-article-18-annex-1-exact-line';
  const confirmedZero = rate === 0 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'civa-article-18-export-evidence';
  if (!confirmedReduced && !confirmedZero) return { ok: false, statusCode: 400, code: 'RATE_EVIDENCE_REQUIRED', error: 'Guinea-Bissau customRate requires exact CIVA Article 18 evidence for 10% or 0%.' };
  return { ok: true, rate };
}

function validateLesothoRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate) return { ok: true, rate: 15 };
  const rate = Number(body.customRate);
  const electricity = rate === 10 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'rsl-current-electricity-treatment';
  const zero = rate === 0 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'rsl-fourth-schedule-or-export-evidence';
  if (!electricity && !zero) return { ok: false, statusCode: 400, code: 'RATE_EVIDENCE_REQUIRED', error: 'Lesotho customRate requires exact RSL evidence for electricity 10% or a Fourth Schedule/export 0% treatment.' };
  return { ok: true, rate };
}

function validateMadagascarRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === 20) return { ok: true, rate: 20 };
  const rate = Number(body.customRate);
  const butane = rate === 10 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'dgi-article-06-01-12-butane-tariff-line';
  const zero = rate === 0 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'dgi-article-06-01-12-export-goods-or-services';
  if (!butane && !zero) return { ok: false, statusCode: 400, code: 'RATE_EVIDENCE_REQUIRED', error: 'Madagascar customRate requires exact DGI Article 06.01.12 evidence for a listed butane tariff line or an export of goods or services.' };
  return { ok: true, rate };
}

function validateMalawiRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === 17.5) return { ok: true, rate: 17.5 };
  return { ok: false, statusCode: 400, code: 'RATE_EVIDENCE_REQUIRED', error: 'Malawi custom rates are blocked. Act 37 of 2025 sets 17.5%; special treatments require current exact statutory evidence.' };
}

function validateMaliRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === 18) return { ok: true, rate: 18 };
  const rate = Number(body.customRate);
  const reduced = rate === 5 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'dgi-cgi-article-229-point-d-exact-tariff-line';
  const exemptExport = rate === 0 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'dgi-cgi-article-195-i-1-direct-export-evidence';
  if (!reduced && !exemptExport) return { ok: false, statusCode: 400, code: 'RATE_EVIDENCE_REQUIRED', error: 'Mali customRate requires exact DGI CGI Point D evidence for 5%, or Article 195 I.1 direct-export exemption evidence for 0 VAT.' };
  return { ok: true, rate, treatment: exemptExport ? 'exempt' : 'taxable' };
}

function validateMauritaniaRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === 16) return { ok: true, rate: 16, treatment: 'taxable' };
  const rate = Number(body.customRate);
  const telephony = rate === 18 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'lfr-2023-article-230-telephony-supply';
  const exportZero = rate === 0 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'cgi-article-230-export-by-vat-taxpayer';
  const article215Exempt = rate === 0 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'cgi-article-215-exact-exemption-item';
  if (!telephony && !exportZero && !article215Exempt) {
    return { ok: false, statusCode: 400, code: 'RATE_EVIDENCE_REQUIRED', error: 'Mauritania customRate requires exact evidence: LFR 2023 Article 230 telephony for 18%, CGI Article 230 export by a VAT-taxable person for 0%, or an exact CGI Article 215 exemption item.' };
  }
  return { ok: true, rate, treatment: article215Exempt ? 'exempt' : exportZero ? 'zero-rated' : 'taxable' };
}

function validateMauritiusRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === 15) return { ok: true, rate: 15, treatment: 'taxable' };
  const rate = Number(body.customRate);
  const zero = rate === 0 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'vat-act-fifth-schedule-exact-zero-rated-supply';
  const exempt = rate === 0 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'vat-act-first-schedule-exact-exempt-supply';
  if (!zero && !exempt) return { ok: false, statusCode: 400, code: 'RATE_EVIDENCE_REQUIRED', error: 'Mauritius customRate requires an exact VAT Act Fifth Schedule zero-rated supply or First Schedule exempt supply. Tourist services are not a generic zero-rated category.' };
  return { ok: true, rate: 0, treatment: exempt ? 'exempt' : 'zero-rated' };
}

function validateMoroccoRateRequest(body) {
  const hasCustomRate=body.customRate!==undefined&&body.customRate!==null&&body.customRate!=='';
  if(!hasCustomRate||Number(body.customRate)===20)return {ok:true,rate:20,treatment:'taxable'};
  const rate=Number(body.customRate);
  const reduced=rate===10&&body.rateEvidenceConfirmed===true&&body.rateEvidenceType==='cgi-2026-article-99-b-exact-10-percent-item';
  const exportExempt=rate===0&&body.rateEvidenceConfirmed===true&&body.rateEvidenceType==='cgi-2026-article-92-i-1-qualified-export-evidence';
  if(!reduced&&!exportExempt)return {ok:false,statusCode:400,code:'RATE_EVIDENCE_REQUIRED',error:'Morocco customRate requires an exact CGI 2026 Article 99-B item for 10%, or Article 92 I.1 qualifying export evidence for exemption with deduction. Former 14% and 7% rates are retired.'};
  return {ok:true,rate:rate,treatment:exportExempt?'exempt-with-deduction':'taxable'};
}

function validateMozambiqueRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === 16) return { ok: true, rate: 16, treatment: 'taxable' };
  const rate = Number(body.customRate);
  const privateService = rate === 5 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'civa-private-health-or-education-exact-five-percent-service';
  const exportTreatment = rate === 0 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'civa-qualified-export-with-retained-customs-evidence';
  if (!privateService && !exportTreatment) return { ok: false, statusCode: 400, code: 'RATE_EVIDENCE_REQUIRED', error: 'Mozambique customRate requires an exact private health or education service for 5%, or a qualifying CIVA export with retained transaction evidence for 0%. The old 17% rate and blanket exemptions are not accepted.' };
  return { ok: true, rate, treatment: privateService ? 'taxable-no-input-deduction' : 'exempt-with-deduction' };
}

function validateNamibiaRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === 15) return { ok: true, rate: 15, treatment: 'taxable' };
  const rate = Number(body.customRate);
  const zero = rate === 0 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'vat-act-schedule-iii-exact-supply-documentary-proof';
  const exempt = rate === 0 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'vat-act-schedule-iv-exact-exempt-supply';
  if (!zero && !exempt) return { ok: false, statusCode: 400, code: 'RATE_EVIDENCE_REQUIRED', error: 'Namibia customRate is limited to an exact Schedule III zero-rated supply with documentary proof or an exact Schedule IV exempt supply. Generic exports, diplomatic, medical, education, financial or accommodation labels are not accepted.' };
  return { ok: true, rate: 0, treatment: zero ? 'zero-rated' : 'exempt' };
}

function validateNigerRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === 19) return { ok: true, rate: 19, treatment: 'taxable-standard' };
  const rate = Number(body.customRate);
  const reducedTen = rate === 10 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'cgi-2025-art-226-exact-transport-or-hotel-service';
  const reducedFive = rate === 5 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'cgi-2025-art-226-exact-listed-product';
  const exempt = rate === 0 && body.rateEvidenceConfirmed === true && body.rateEvidenceType === 'lf-2026-art-322-exact-exempt-operation';
  if (!reducedTen && !reducedFive && !exempt) return { ok: false, statusCode: 400, code: 'RATE_EVIDENCE_REQUIRED', error: 'Niger customRate is limited to an exact CGI Article 226 10% service, exact Article 226 5% listed product, or exact Finance Law 2026 Article 322 exemption with retained transaction evidence. A generic zero rate is not accepted.' };
  return { ok: true, rate, treatment: exempt ? 'exempt' : 'taxable-reduced' };
}

function validateLiberiaRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === 13) return { ok: true, rate: 13 };
  const zero = Number(body.customRate) === 0
    && body.rateEvidenceConfirmed === true
    && body.rateEvidenceType === 'lra-section-1000-export-of-goods';
  if (!zero) return { ok: false, statusCode: 400, code: 'RATE_EVIDENCE_REQUIRED', error: 'Liberia customRate is limited to 0% for an exact Section 1000 export of goods with retained transaction evidence. Telecommunications is not modeled because current LRA sources conflict.' };
  return { ok: true, rate: 0, rateEvidenceType: body.rateEvidenceType };
}

function validateSaoTomeRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === 15) return { ok: true, rate: 15, treatment: 'taxable-standard' };
  const reduced = Number(body.customRate) === 7.5
    && body.rateEvidenceConfirmed === true
    && body.rateEvidenceType === 'civa-2023-annex-1-exact-basic-basket-line';
  if (!reduced) return { ok: false, statusCode: 400, code: 'RATE_EVIDENCE_REQUIRED', error: 'Sao Tome customRate is limited to 7.5% with an exact CIVA Annex I basic-basket line and retained invoice evidence. Generic exemptions, zero rates and the illustrative 16% manual example are not accepted.' };
  return { ok: true, rate: 7.5, treatment: 'taxable-reduced' };
}

function validateSenegalRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === 18) {
    return { ok: true, rate: 18, treatment: 'taxable-standard' };
  }
  const reducedTouristService = Number(body.customRate) === 10
    && body.rateEvidenceConfirmed === true
    && body.rateEvidenceType === 'cgi-article-369-approved-tourist-establishment-service';
  if (!reducedTouristService) {
    return {
      ok: false,
      statusCode: 400,
      code: 'RATE_EVIDENCE_REQUIRED',
      error: 'Senegal customRate is limited to 10% for an accommodation or restaurant service supplied by an approved tourist accommodation establishment, with exact Article 369 evidence retained.'
    };
  }
  return { ok: true, rate: 10, treatment: 'taxable-reduced', rateEvidenceType: body.rateEvidenceType };
}

function validateSeychellesRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === 15) {
    return { ok: true, rate: 15, treatment: 'taxable-standard' };
  }
  const zeroRated = Number(body.customRate) === 0
    && body.rateEvidenceConfirmed === true
    && body.rateEvidenceType === 'vat-act-current-second-schedule-zero-rated-supply';
  const exempt = Number(body.customRate) === 0
    && body.rateEvidenceConfirmed === true
    && body.rateEvidenceType === 'vat-act-current-first-schedule-exempt-supply';
  if (!zeroRated && !exempt) {
    return {
      ok: false,
      statusCode: 400,
      code: 'RATE_EVIDENCE_REQUIRED',
      error: 'Seychelles customRate is limited to 0% with an exact current Second Schedule zero-rated supply or First Schedule exempt supply and retained transaction evidence.'
    };
  }
  return { ok: true, rate: 0, treatment: zeroRated ? 'zero-rated' : 'exempt', rateEvidenceType: body.rateEvidenceType };
}

function validateSierraLeoneRateRequest(body) {
  if (body.currency && String(body.currency).toUpperCase() !== 'SLE') {
    return { ok: false, statusCode: 400, code: 'STALE_CURRENCY', error: 'Sierra Leone GST uses SLE (new leone / NLe); stale SLL values are not accepted.' };
  }
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === 15) {
    return { ok: true, rate: 15, treatment: 'taxable-standard' };
  }
  const zeroRated = Number(body.customRate) === 0
    && body.rateEvidenceConfirmed === true
    && body.rateEvidenceType === 'gst-act-current-first-schedule-zero-rated-supply';
  const exempt = Number(body.customRate) === 0
    && body.rateEvidenceConfirmed === true
    && body.rateEvidenceType === 'gst-act-current-second-schedule-exempt-supply';
  if (!zeroRated && !exempt) {
    return {
      ok: false,
      statusCode: 400,
      code: 'RATE_EVIDENCE_REQUIRED',
      error: 'Sierra Leone customRate is limited to 0% with exact current First Schedule zero-rated or Second Schedule exempt evidence.'
    };
  }
  return { ok: true, rate: 0, treatment: zeroRated ? 'zero-rated' : 'exempt', rateEvidenceType: body.rateEvidenceType };
}

function validateSomaliaRateRequest() {
  return {
    ok: false,
    statusCode: 422,
    code: 'NO_VERIFIED_NATIONAL_VAT',
    error: 'No current nationwide Somalia VAT rate is verified from federal primary sources; API calculation is disabled.'
  };
}

function validateSudanRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === VAT_DB.SD.rate) {
    return { ok: true, rate: VAT_DB.SD.rate, treatment: 'standard-rate-only' };
  }
  return {
    ok: false,
    statusCode: 400,
    code: 'STANDARD_RATE_ONLY',
    error: 'Sudan customRate must remain at the official fixed standard rate of 17%; special treatments are outside this API calculation contract.'
  };
}

function validateTogoRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === VAT_DB.TG.rate) {
    return { ok: true, rate: VAT_DB.TG.rate, treatment: 'standard-rate-only' };
  }
  return {
    ok: false,
    statusCode: 400,
    code: 'STANDARD_RATE_ONLY',
    error: 'Togo customRate must remain at the official fixed standard rate of 18%; Article 180 exemptions and other special treatments are outside this API calculation contract.'
  };
}

function validateTunisiaRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === VAT_DB.TN.rate) {
    return { ok: true, rate: VAT_DB.TN.rate, treatment: 'general-rate-only' };
  }
  return {
    ok: false,
    statusCode: 400,
    code: 'GENERAL_RATE_ONLY',
    error: 'Tunisia customRate must remain at the official general rate of 19%; reduced rates and other special treatments require current transaction-specific Ministry or tax-administration verification.'
  };
}

function validateZambiaRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (!hasCustomRate || Number(body.customRate) === VAT_DB.ZM.rate) {
    return { ok: true, rate: VAT_DB.ZM.rate, treatment: 'standard-rate-only' };
  }
  return {
    ok: false,
    statusCode: 400,
    code: 'STANDARD_RATE_ONLY',
    error: 'Zambia customRate must remain at the official fixed standard rate of 16%; zero-rated, exempt and other special ZRA transaction codes require exact current statutory and invoice evidence outside this API calculation contract.'
  };
}

function validateZimbabweRateRequest(body) {
  const hasCustomRate = body.customRate !== undefined && body.customRate !== null && body.customRate !== '';
  if (hasCustomRate && Number(body.customRate) !== VAT_DB.ZW.rate) {
    return {
      ok: false, statusCode: 400, code: 'STANDARD_RATE_ONLY',
      error: 'Zimbabwe customRate must remain at the official 15.5% standard rate effective 1 January 2026; zero-rated, exempt and other special treatments require exact current statutory evidence outside this API contract.'
    };
  }
  const currency = String(body.currency || VAT_DB.ZW.currency).toUpperCase();
  if (currency !== 'ZWG' && currency !== 'USD') {
    return {
      ok: false, statusCode: 400, code: currency === 'ZWL' ? 'STALE_CURRENCY' : 'UNSUPPORTED_CURRENCY',
      error: 'Zimbabwe currency must be explicitly ZWG (ZiG) or USD; legacy ZWL is not accepted and no FX conversion is performed.'
    };
  }
  return { ok: true, rate: VAT_DB.ZW.rate, treatment: 'standard-rate-only', currency };
}

function calculateGabonVatResult(amount, rate, operation) {
  const roundedBase = value => Math.floor((value + Number.EPSILON) / 1000) * 1000;
  if (operation === 'add') {
    const base = roundedBase(amount); const vatAmount = Math.round(base * rate / 100);
    return { operation, amountExclusive: Math.round(amount), taxableBase: base, vatRate: rate, vatAmount, amountInclusive: Math.round(amount + vatAmount), currency: 'XAF', rounding: 'taxable-base-down-to-xaf-1000' };
  }
  if (operation !== 'extract') return null;
  let resolved = null; const guess = Math.floor(amount / (1000 * (1 + rate / 100)));
  for (let k = Math.max(0, guess - 2); k <= guess + 2; k += 1) { const net = amount - k * 1000 * rate / 100; if (net >= k * 1000 && net < (k + 1) * 1000) { resolved = { net, base: k * 1000 }; break; } }
  if (!resolved) return null;
  const vatAmount = Math.round(resolved.base * rate / 100);
  return { operation, amountExclusive: Math.round(resolved.net), taxableBase: resolved.base, vatRate: rate, vatAmount, amountInclusive: Math.round(amount), currency: 'XAF', rounding: 'taxable-base-down-to-xaf-1000' };
}

function calculateBurundiVatResult(amount, rate, operation) {
  const maxMoney = 1000000000000000;
  if (!Number.isFinite(amount) || amount < 0 || amount > maxMoney || (operation !== 'add' && operation !== 'extract')) return null;
  const amountExclusive = operation === 'extract' ? amount / (1 + rate / 100) : amount;
  const vatAmount = operation === 'extract' ? amount - amountExclusive : amountExclusive * rate / 100;
  const amountInclusive = operation === 'extract' ? amount : amountExclusive + vatAmount;
  if (!Number.isFinite(amountInclusive) || amountInclusive > maxMoney) return null;
  return {
    operation, amountExclusive, taxableBase: amountExclusive, vatRate: rate, vatAmount, amountInclusive,
    currency: 'BIF', rounding: 'full-precision; nearest-whole-BIF display is an AfroTools UI rule only',
    displayed: {
      amountExclusive: Math.round(amountExclusive),
      vatAmount: Math.round(vatAmount),
      amountInclusive: Math.round(amountInclusive)
    }
  };
}

function calculateVatResult(amount, rate, operation, currency) {
  const op = (operation || 'add').toLowerCase();
  if (op === 'add' || op === 'inclusive') {
    const vatAmount = round2(amount * (rate / 100));
    return {
      operation: 'add',
      amountExclusive: round2(amount),
      vatRate: rate,
      vatAmount,
      amountInclusive: round2(amount + vatAmount),
      currency
    };
  }
  if (op === 'extract' || op === 'remove' || op === 'exclusive') {
    const amountExclusive = round2(amount / (1 + rate / 100));
    return {
      operation: 'extract',
      amountInclusive: round2(amount),
      vatRate: rate,
      vatAmount: round2(amount - amountExclusive),
      amountExclusive,
      currency
    };
  }
  return null;
}

async function validateApiKey(apiKey) {
  if (!apiKey) return { valid: false };

  // Sandbox keys use deterministic data and their own free-tier limits.
  if (apiKey.startsWith('afro_test_')) {
    const freeLimits = getApiPlanLimit('free');
    const key = 'sandbox:vat:' + apiKey;
    if (!checkRateLimit(key, freeLimits.day)) {
      return { valid: true, tier: 'sandbox', sandbox: true, remaining: 0, limit: freeLimits.day, resetAt: 'midnight UTC' };
    }
    return { valid: true, tier: 'sandbox', sandbox: true, remaining: getRemaining(key, freeLimits.day), limit: freeLimits.day };
  }

  try {
    const store = getStore('apikeys');
    const data = await store.get(apiKey, { type: 'json' });
    if (!data) return { valid: false };

    const tier = normalizeApiTier(data.tier || 'free');
    const limits = getApiPlanLimit(tier);
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);

    if (!data.usage) data.usage = {};
    if (!data.usage[today]) data.usage[today] = 0;
    if (!data.usage[month]) data.usage[month] = 0;

    const dailyUsage = data.usage[today];
    const monthlyUsage = data.usage[month];

    if (limits.day !== -1 && dailyUsage >= limits.day) {
      return { valid: true, tier, remaining: 0, limit: limits.day, resetAt: 'midnight UTC' };
    }
    if (limits.month !== -1 && monthlyUsage >= limits.month) {
      return { valid: true, tier, remaining: 0, limit: limits.month, resetAt: 'end of month' };
    }

    data.usage[today] = dailyUsage + 1;
    data.usage[month] = monthlyUsage + 1;
    data.lastUsed = new Date().toISOString();
    await store.setJSON(apiKey, data);

    return {
      valid: true,
      tier,
      remaining: limits.day === -1 ? 999999 : limits.day - dailyUsage - 1,
      limit: limits.day
    };
  } catch (err) {
    console.error('Key validation error:', err.message);
    return { valid: false };
  }
}

/* ========================================================================
   Handler
   ======================================================================== */

exports.handler = async (event) => {
  CORS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  /* ---- CORS preflight ---- */
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS };

  /* ---- Authenticate ---- */
  const apiKey =
    event.headers['x-api-key'] ||
    event.headers['X-Api-Key'] ||
    (event.queryStringParameters || {}).api_key;

  const auth = await validateApiKey(apiKey);

  if (!auth.valid) {
    return respond(401, {
      error: 'Invalid or missing API key',
      code: 'INVALID_API_KEY',
      docs: 'https://afrotools.com/docs/api/authentication'
    });
  }

  if (auth.remaining <= 0) {
    return respond(
      429,
      {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        limit: auth.limit,
        resetAt: auth.resetAt
      },
      { 'Retry-After': '3600' }
    );
  }

  /* ---- GET: country VAT info / list all ---- */
  if (event.httpMethod === 'GET') {
    const country = ((event.queryStringParameters || {}).country || '').toUpperCase();

    if (auth.sandbox) {
      const sandboxCountry = {
        code: 'NG',
        name: 'Nigeria Sandbox',
        currency: 'NGN',
        rate: 7.5,
        hasReducedRates: false,
        sandbox: true,
        data_policy: 'deterministic sandbox data'
      };
      if (!country) {
        return respond(200, { status: 'success', total: 1, countries: [sandboxCountry], sandbox: true });
      }
      return respond(200, {
        status: 'success',
        country: 'NG',
        name: 'Nigeria Sandbox',
        currency: 'NGN',
        rate: 7.5,
        reducedRates: [],
        authority: 'AfroTools Sandbox',
        exemptions: [],
        notes: 'Deterministic sandbox data for development.',
        lastUpdated: '2026-01-01',
        source: 'AfroTools sandbox data',
        sandbox: true,
        data_policy: 'deterministic sandbox data'
      });
    }

    if (!country) {
      // Return all countries with VAT summary
      const countries = Object.entries(VAT_DB).map(([code, c]) => ({
        code,
        name: c.name,
        currency: c.currency,
        rate: c.rate,
        hasReducedRates: c.reducedRates.length > 0
      }));
      return respond(200, {
        status: 'success',
        total: countries.length,
        countries
      });
    }

    const info = VAT_DB[country];
    if (!info) {
      return respond(404, {
        error: `Country '${country}' not supported`,
        code: 'INVALID_COUNTRY',
        supported: Object.keys(VAT_DB)
      });
    }

    return respond(200, {
      status: 'success',
      country: country,
      ...info
    });
  }

  /* ---- POST: calculate VAT ---- */
  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return respond(400, { error: 'Invalid JSON body', code: 'INVALID_JSON' });
    }

    const { country, amount, operation, customRate, rateEvidenceConfirmed, rateEvidenceType } = body;

    if (auth.sandbox) {
      const numAmount = Number(amount || 1000);
      const vatAmount = round2(numAmount * 0.075);
      return respond(200, {
        status: 'success',
        country: String(country || 'NG').toUpperCase(),
        countryName: 'Nigeria Sandbox',
        operation: operation || 'add',
        amountExclusive: round2(numAmount),
        vatRate: 7.5,
        vatAmount,
        amountInclusive: round2(numAmount + vatAmount),
        currency: 'NGN',
        sandbox: true,
        data_policy: 'deterministic sandbox data',
        _meta: {
          api: 'AfroVAT',
          version: 'v1',
          timestamp: new Date().toISOString(),
          sandbox: true,
          docs: 'https://afrotools.com/docs/api/vat'
        }
      });
    }

    if (!country) {
      return respond(400, {
        error: 'Missing required field: country',
        code: 'MISSING_REQUIRED_FIELD'
      });
    }

    const countryCode = country.toUpperCase();
    const info = VAT_DB[countryCode];
    if (!info) {
      return respond(404, {
        error: `Country '${countryCode}' not supported`,
        code: 'INVALID_COUNTRY',
        supported: Object.keys(VAT_DB)
      });
    }

    if (countryCode === 'SO') {
      const validation = validateSomaliaRateRequest();
      return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }

    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return respond(400, {
        error: 'Missing or invalid required field: amount (must be a number)',
        code: 'MISSING_REQUIRED_FIELD'
      });
    }

    const numAmount = Number(amount);
    if (numAmount < 0) {
      return respond(400, {
        error: 'Amount must be a positive number',
        code: 'INVALID_VALUE'
      });
    }

    if (countryCode === 'ER') {
      const validation = validateEritreaRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'ET') {
      const validation = validateEthiopiaRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'SZ') {
      const validation = validateEswatiniRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'BI') {
      const validation = validateBurundiRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'GA') {
      const validation = validateGabonRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'GM') {
      const validation = validateGambiaRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'GN') {
      const validation = validateGuineaRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'GW') {
      const validation = validateGuineaBissauRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'LS') {
      const validation = validateLesothoRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'LR') {
      const validation = validateLiberiaRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'MG') {
      const validation = validateMadagascarRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'MW') {
      const validation = validateMalawiRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'ML') {
      const validation = validateMaliRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'MR') {
      const validation = validateMauritaniaRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'MU') {
      const validation = validateMauritiusRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'MA') {
      const validation=validateMoroccoRateRequest(body);
      if(!validation.ok)return respond(validation.statusCode,{error:validation.error,code:validation.code});
    }
    if (countryCode === 'MZ') {
      const validation = validateMozambiqueRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'NA') {
      const validation = validateNamibiaRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'NE') {
      const validation = validateNigerRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'ST') {
      const validation = validateSaoTomeRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'SN') {
      const validation = validateSenegalRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'SC') {
      const validation = validateSeychellesRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'SL') {
      const validation = validateSierraLeoneRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'SD') {
      const validation = validateSudanRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'TG') {
      const validation = validateTogoRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'TN') {
      const validation = validateTunisiaRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'ZM') {
      const validation = validateZambiaRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'ZW') {
      const validation = validateZimbabweRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }

    // Use custom rate if provided, otherwise country standard rate
    const hasCustomRate = customRate !== undefined && customRate !== null;
    const rate = hasCustomRate ? Number(customRate) : info.rate;
    if (isNaN(rate) || rate < 0) {
      return respond(400, {
        error: 'customRate must be a non-negative number',
        code: 'INVALID_VALUE'
      });
    }
    if (countryCode === 'CM' && hasCustomRate && !(rate === 10 && rateEvidenceConfirmed === true)) {
      return respond(400, {
        error: 'Cameroon customRate is limited to the qualifying 10% social-housing scenario and requires rateEvidenceConfirmed=true',
        code: 'RATE_EVIDENCE_REQUIRED'
      });
    }
    if (countryCode === 'CV' && hasCustomRate && !(rate === 8 && rateEvidenceConfirmed === true)) {
      return respond(400, {
        error: 'Cabo Verde customRate is limited to the qualifying 8% final-consumer water/electricity scenario and requires rateEvidenceConfirmed=true',
        code: 'RATE_EVIDENCE_REQUIRED'
      });
    }
    if (countryCode === 'CF' && hasCustomRate) {
      const confirmedListedGoods = rate === 5 && rateEvidenceConfirmed === true && rateEvidenceType === 'tariff-listed-goods';
      const confirmedExport = rate === 0 && rateEvidenceConfirmed === true && rateEvidenceType === 'qualifying-export-customs-proof';
      if (!confirmedListedGoods && !confirmedExport) {
        return respond(400, {
          error: 'Central African Republic customRate requires exact evidence: 5% with rateEvidenceType=tariff-listed-goods or 0% with rateEvidenceType=qualifying-export-customs-proof',
          code: 'RATE_EVIDENCE_REQUIRED'
        });
      }
    }
    if (countryCode === 'TD' && hasCustomRate) {
      const confirmedReduced = rate === 9.9 && rateEvidenceConfirmed === true && rateEvidenceType === 'article-238-listed-supply';
      const confirmedZero = rate === 0 && rateEvidenceConfirmed === true && rateEvidenceType === 'article-238-zero-case';
      if (!confirmedReduced && !confirmedZero) {
        return respond(400, {
          error: 'Chad customRate requires exact Article 238 evidence: effective 9.9% with rateEvidenceType=article-238-listed-supply or 0% with rateEvidenceType=article-238-zero-case',
          code: 'RATE_EVIDENCE_REQUIRED'
        });
      }
    }
    if (countryCode === 'KM' && hasCustomRate) {
      const validation = validateComorosRateRequest(body);
      if (!validation.ok) {
        return respond(validation.statusCode, {
          error: validation.error,
          code: validation.code
        });
      }
    }
    if (countryCode === 'CG' && hasCustomRate) {
      const validation = validateCongoRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'CI' && hasCustomRate) {
      const validation = validateCoteDIvoireRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'DJ' && hasCustomRate) {
      const validation = validateDjiboutiRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'CD' && hasCustomRate) {
      const validation = validateDrCongoRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }
    if (countryCode === 'GQ' && hasCustomRate) {
      const validation = validateEquatorialGuineaRateRequest(body);
      if (!validation.ok) return respond(validation.statusCode, { error: validation.error, code: validation.code });
    }

    const op = (operation || 'add').toLowerCase();
    const startTime = Date.now();
    const resultCurrency = countryCode === 'ZW' ? String(body.currency || info.currency).toUpperCase() : info.currency;
    const result = countryCode === 'GA'
      ? calculateGabonVatResult(numAmount, rate, op)
      : countryCode === 'BI'
        ? calculateBurundiVatResult(numAmount, rate, op)
        : calculateVatResult(numAmount, rate, op, resultCurrency);

    if (!result) {
      return respond(400, {
        error: "Invalid operation. Use 'add' (amount is net, add VAT) or 'extract' (amount is gross, extract VAT).",
        code: 'INVALID_OPERATION'
      });
    }

    return respond(200, {
      status: 'success',
      country: countryCode,
      countryName: info.name,
      ...result,
      _meta: {
        api: 'AfroVAT',
        version: '1.0',
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
        sandbox: auth.sandbox || false,
        docs: 'https://afrotools.com/docs/api/vat'
      }
    });
  }

  /* ---- Anything else ---- */
  return respond(405, {
    error: 'Method not allowed. Use GET or POST.',
    code: 'METHOD_NOT_ALLOWED'
  });
};

exports.handler = require('./_shared/with-api').withApi(exports.handler, { name: 'api-vat' });
exports._test = Object.freeze({
  calculateVatResult,
  calculateBurundiVatResult,
  validateComorosRateRequest,
  validateCongoRateRequest,
  validateCoteDIvoireRateRequest,
  validateDjiboutiRateRequest,
  validateDrCongoRateRequest,
  validateEquatorialGuineaRateRequest,
  validateEritreaRateRequest,
  validateEthiopiaRateRequest,
  validateEswatiniRateRequest
  ,validateBurundiRateRequest
  ,validateGabonRateRequest
  ,calculateGabonVatResult
  ,validateGambiaRateRequest
  ,validateGuineaRateRequest
  ,validateGuineaBissauRateRequest
  ,validateLesothoRateRequest
  ,validateLiberiaRateRequest
  ,validateMadagascarRateRequest
  ,validateMalawiRateRequest
  ,validateMaliRateRequest
  ,validateMauritaniaRateRequest
  ,validateMauritiusRateRequest
  ,validateMoroccoRateRequest
  ,validateMozambiqueRateRequest
  ,validateNamibiaRateRequest
  ,validateNigerRateRequest
  ,validateSaoTomeRateRequest
  ,validateSenegalRateRequest
  ,validateSeychellesRateRequest
  ,validateSierraLeoneRateRequest
  ,validateSomaliaRateRequest
  ,validateSudanRateRequest
  ,validateTogoRateRequest
  ,validateTunisiaRateRequest
  ,validateZambiaRateRequest
  ,validateZimbabweRateRequest
});
