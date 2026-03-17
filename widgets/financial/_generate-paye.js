#!/usr/bin/env node
/**
 * AfroTools PAYE Widget Generator
 * Generates widget JS files for all 44 remaining African countries.
 * Tax bands extracted from real tool pages in the codebase.
 *
 * Run: node widgets/financial/_generate-paye.js
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname);

// ══════════════════════════════════════════════════════════════
// COUNTRY DEFINITIONS — REAL tax bands from each tool page
// ══════════════════════════════════════════════════════════════

const COUNTRIES = [
  // --- SENEGAL ---
  {
    id: 'sn-paye', fn: 'sn_paye', flag: '\uD83C\uDDF8\uD83C\uDDF3',
    name: 'Senegal', currency: 'XOF', currencySymbol: 'XOF ',
    authority: 'DGID', period: 'annual',
    placeholder: '12,000,000',
    bands: [
      { limit: 630000, rate: 0 },
      { limit: 870000, rate: 0.20 },
      { limit: 2500000, rate: 0.30 },
      { limit: 4000000, rate: 0.35 },
      { limit: 5500000, rate: 0.37 },
      { limit: Infinity, rate: 0.40 }
    ],
    socialSecurity: { name: 'CSS', empRate: 0.056, employerRate: 0.094, deductible: true, cap: null },
  },
  // --- COTE D'IVOIRE ---
  {
    id: 'ci-paye', fn: 'ci_paye', flag: '\uD83C\uDDE8\uD83C\uDDEE',
    name: "C\u00f4te d'Ivoire", currency: 'XOF', currencySymbol: 'XOF ',
    authority: 'DGI', period: 'monthly',
    placeholder: '1,000,000',
    bands: [
      { limit: 300000, rate: 0 },
      { limit: 300000, rate: 0.10 },
      { limit: 300000, rate: 0.15 },
      { limit: 600000, rate: 0.20 },
      { limit: Infinity, rate: 0.25 }
    ],
    socialSecurity: { name: 'CNPS', empRate: 0.063, employerRate: 0.1575, deductible: true, cap: null },
  },
  // --- CAMEROON ---
  {
    id: 'cm-paye', fn: 'cm_paye', flag: '\uD83C\uDDE8\uD83C\uDDF2',
    name: 'Cameroon', currency: 'XAF', currencySymbol: 'XAF ',
    authority: 'DGI', period: 'annual',
    placeholder: '6,000,000',
    bands: [
      { limit: 2000000, rate: 0.10 },
      { limit: 1000000, rate: 0.15 },
      { limit: 2000000, rate: 0.25 },
      { limit: Infinity, rate: 0.35 }
    ],
    socialSecurity: { name: 'CNPS', empRate: 0.042, employerRate: 0.112, deductible: true, cap: null },
  },
  // --- ALGERIA ---
  {
    id: 'dz-paye', fn: 'dz_paye', flag: '\uD83C\uDDE9\uD83C\uDDFF',
    name: 'Algeria', currency: 'DZD', currencySymbol: 'DZD ',
    authority: 'DGI', period: 'annual',
    placeholder: '3,000,000',
    bands: [
      { limit: 240000, rate: 0 },
      { limit: 240000, rate: 0.20 },
      { limit: 480000, rate: 0.30 },
      { limit: Infinity, rate: 0.35 }
    ],
    socialSecurity: { name: 'CNAS', empRate: 0.09, employerRate: 0.26, deductible: true, cap: null },
  },
  // --- TUNISIA ---
  {
    id: 'tn-paye', fn: 'tn_paye', flag: '\uD83C\uDDF9\uD83C\uDDF3',
    name: 'Tunisia', currency: 'TND', currencySymbol: 'TND ',
    authority: 'DGF', period: 'annual',
    placeholder: '30,000',
    bands: [
      { limit: 300000, rate: 0 },
      { limit: 300000, rate: 0.02 },
      { limit: 600000, rate: 0.05 },
      { limit: 1200000, rate: 0.10 },
      { limit: 2400000, rate: 0.15 },
      { limit: 4800000, rate: 0.20 },
      { limit: Infinity, rate: 0.25 }
    ],
    socialSecurity: { name: 'CNSS', empRate: 0.0918, employerRate: 0.1657, deductible: true, cap: null },
    note: 'TND amounts in millimes (1 TND = 1000 millimes). Bands in millimes.'
  },
  // --- LIBYA ---
  {
    id: 'ly-paye', fn: 'ly_paye', flag: '\uD83C\uDDF1\uD83C\uDDFE',
    name: 'Libya', currency: 'LYD', currencySymbol: 'LYD ',
    authority: 'MoF', period: 'monthly',
    placeholder: '5,000',
    flatRate: 0.10,
    jihadTax: 0.03,
    stampDuty: 0.01,
    bands: null,
    socialSecurity: { name: 'Social Security', empRate: 0.0375, employerRate: 0.1125, deductible: true, cap: null },
  },
  // --- SUDAN ---
  {
    id: 'sd-paye', fn: 'sd_paye', flag: '\uD83C\uDDF8\uD83C\uDDE9',
    name: 'Sudan', currency: 'SDG', currencySymbol: 'SDG ',
    authority: 'MoF', period: 'monthly',
    placeholder: '100,000',
    bands: [
      { limit: 10000, rate: 0 },
      { limit: 30000, rate: 0.05 },
      { limit: 30000, rate: 0.10 },
      { limit: Infinity, rate: 0.15 }
    ],
    socialSecurity: { name: 'NSIF', empRate: 0.08, employerRate: 0.17, deductible: true, cap: null },
  },
  // --- ANGOLA ---
  {
    id: 'ao-paye', fn: 'ao_paye', flag: '\uD83C\uDDE6\uD83C\uDDF4',
    name: 'Angola', currency: 'AOA', currencySymbol: 'AOA ',
    authority: 'AGT', period: 'monthly',
    placeholder: '500,000',
    bands: [
      { limit: 100000, rate: 0 },
      { limit: 50000, rate: 0.10 },
      { limit: 50000, rate: 0.15 },
      { limit: 100000, rate: 0.20 },
      { limit: 200000, rate: 0.215 },
      { limit: 500000, rate: 0.225 },
      { limit: 500000, rate: 0.235 },
      { limit: 500000, rate: 0.245 },
      { limit: Infinity, rate: 0.25 }
    ],
    socialSecurity: { name: 'INSS', empRate: 0.03, employerRate: 0.08, deductible: true, cap: null },
  },
  // --- MOZAMBIQUE ---
  {
    id: 'mz-paye', fn: 'mz_paye', flag: '\uD83C\uDDF2\uD83C\uDDFF',
    name: 'Mozambique', currency: 'MZN', currencySymbol: 'MZN ',
    authority: 'AT', period: 'monthly',
    placeholder: '150,000',
    bands: [
      { limit: 42000, rate: 0 },
      { limit: 58000, rate: 0.10 },
      { limit: 125000, rate: 0.15 },
      { limit: 275000, rate: 0.20 },
      { limit: 625000, rate: 0.25 },
      { limit: Infinity, rate: 0.32 }
    ],
    socialSecurity: { name: 'INSS', empRate: 0.03, employerRate: 0.04, deductible: true, cap: null },
  },
  // --- ZAMBIA ---
  {
    id: 'zm-paye', fn: 'zm_paye', flag: '\uD83C\uDDFF\uD83C\uDDF2',
    name: 'Zambia', currency: 'ZMW', currencySymbol: 'K',
    authority: 'ZRA', period: 'annual',
    placeholder: '150,000',
    bands: [
      { limit: 57600, rate: 0 },
      { limit: 24000, rate: 0.20 },
      { limit: 34800, rate: 0.30 },
      { limit: Infinity, rate: 0.375 }
    ],
    socialSecurity: { name: 'NAPSA', empRate: 0.05, employerRate: 0.05, deductible: true, cap: 14661.60 },
  },
  // --- ZIMBABWE ---
  {
    id: 'zw-paye', fn: 'zw_paye', flag: '\uD83C\uDDFF\uD83C\uDDFC',
    name: 'Zimbabwe', currency: 'USD', currencySymbol: '$',
    authority: 'ZIMRA', period: 'annual',
    placeholder: '24,000',
    bands: [
      { limit: 6000, rate: 0 },
      { limit: 6000, rate: 0.20 },
      { limit: 24000, rate: 0.25 },
      { limit: 24000, rate: 0.30 },
      { limit: 60000, rate: 0.35 },
      { limit: Infinity, rate: 0.40 }
    ],
    socialSecurity: { name: 'NSSA', empRate: 0.035, employerRate: 0.035, deductible: true, cap: null },
  },
  // --- BOTSWANA ---
  {
    id: 'bw-paye', fn: 'bw_paye', flag: '\uD83C\uDDE7\uD83C\uDDFC',
    name: 'Botswana', currency: 'BWP', currencySymbol: 'P',
    authority: 'BURS', period: 'annual',
    placeholder: '200,000',
    bands: [
      { limit: 48000, rate: 0 },
      { limit: 24000, rate: 0.05 },
      { limit: 24000, rate: 0.125 },
      { limit: 24000, rate: 0.1875 },
      { limit: Infinity, rate: 0.25 }
    ],
    socialSecurity: null,
  },
  // --- NAMIBIA ---
  {
    id: 'na-paye', fn: 'na_paye', flag: '\uD83C\uDDF3\uD83C\uDDE6',
    name: 'Namibia', currency: 'NAD', currencySymbol: 'N$',
    authority: 'NamRA', period: 'annual',
    placeholder: '300,000',
    bands: [
      { limit: 100000, rate: 0 },
      { limit: 50000, rate: 0.18 },
      { limit: 100000, rate: 0.25 },
      { limit: 250000, rate: 0.28 },
      { limit: 500000, rate: 0.30 },
      { limit: 500000, rate: 0.32 },
      { limit: Infinity, rate: 0.37 }
    ],
    socialSecurity: { name: 'SSC', empRate: null, employerRate: null, deductible: true, cap: null, flat: 81 },
    note: 'SSC is flat N$81/month employee + N$81/month employer'
  },
  // --- ESWATINI ---
  {
    id: 'sz-paye', fn: 'sz_paye', flag: '\uD83C\uDDF8\uD83C\uDDFF',
    name: 'Eswatini', currency: 'SZL', currencySymbol: 'E',
    authority: 'SRA', period: 'annual',
    placeholder: '150,000',
    bands: [
      { limit: 41000, rate: 0.20 },
      { limit: 39000, rate: 0.25 },
      { limit: 20000, rate: 0.30 },
      { limit: Infinity, rate: 0.33 }
    ],
    taxRebate: 8200,
    socialSecurity: { name: 'SNPF', empRate: 0.05, employerRate: 0.05, deductible: false, cap: 600 },
    note: 'SNPF capped E600/month. Tax rebate E8,200/year.'
  },
  // --- LESOTHO ---
  {
    id: 'ls-paye', fn: 'ls_paye', flag: '\uD83C\uDDF1\uD83C\uDDF8',
    name: 'Lesotho', currency: 'LSL', currencySymbol: 'M',
    authority: 'LRA', period: 'annual',
    placeholder: '150,000',
    bands: [
      { limit: 72000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 }
    ],
    taxCredit: 10560,
    socialSecurity: null,
    note: 'Tax credit M10,560/year.'
  },
  // --- MALAWI ---
  {
    id: 'mw-paye', fn: 'mw_paye', flag: '\uD83C\uDDF2\uD83C\uDDFC',
    name: 'Malawi', currency: 'MWK', currencySymbol: 'MWK ',
    authority: 'MRA', period: 'monthly',
    placeholder: '500,000',
    bands: [
      { limit: 100000, rate: 0 },
      { limit: 300000, rate: 0.25 },
      { limit: 1100000, rate: 0.30 },
      { limit: Infinity, rate: 0.35 }
    ],
    socialSecurity: null,
  },
  // --- MADAGASCAR ---
  {
    id: 'mg-paye', fn: 'mg_paye', flag: '\uD83C\uDDF2\uD83C\uDDEC',
    name: 'Madagascar', currency: 'MGA', currencySymbol: 'MGA ',
    authority: 'DGI', period: 'monthly',
    placeholder: '1,000,000',
    bands: [
      { limit: 350000, rate: 0 },
      { limit: Infinity, rate: 0.20 }
    ],
    socialSecurity: { name: 'CNaPS', empRate: 0.01, employerRate: 0.13, deductible: true, cap: 1610000 },
    note: 'CNaPS capped MGA 1,610,000/month.'
  },
  // --- MAURITIUS ---
  {
    id: 'mu-paye', fn: 'mu_paye', flag: '\uD83C\uDDF2\uD83C\uDDFA',
    name: 'Mauritius', currency: 'MUR', currencySymbol: 'MUR ',
    authority: 'MRA', period: 'annual',
    placeholder: '1,200,000',
    bands: [
      { limit: 390000, rate: 0 },
      { limit: 260000, rate: 0.10 },
      { limit: 350000, rate: 0.125 },
      { limit: Infinity, rate: 0.15 }
    ],
    socialSecurity: { name: 'CSG', empRate: 0.03, employerRate: 0.06, deductible: false, cap: null },
  },
  // --- SEYCHELLES ---
  {
    id: 'sc-paye', fn: 'sc_paye', flag: '\uD83C\uDDF8\uD83C\uDDE8',
    name: 'Seychelles', currency: 'SCR', currencySymbol: 'SCR ',
    authority: 'SRC', period: 'monthly',
    placeholder: '30,000',
    bands: [
      { limit: 8555.50, rate: 0 },
      { limit: Infinity, rate: 0.15 }
    ],
    socialSecurity: { name: 'SSF', empRate: 0.025, employerRate: 0.025, deductible: false, cap: null },
  },
  // --- BURUNDI ---
  {
    id: 'bi-paye', fn: 'bi_paye', flag: '\uD83C\uDDE7\uD83C\uDDEE',
    name: 'Burundi', currency: 'BIF', currencySymbol: 'BIF ',
    authority: 'OBR', period: 'monthly',
    placeholder: '500,000',
    bands: [
      { limit: 150000, rate: 0 },
      { limit: 50000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 }
    ],
    socialSecurity: { name: 'INSS', empRate: 0.04, employerRate: 0.06, deductible: true, cap: null },
  },
  // --- DR CONGO ---
  {
    id: 'cd-paye', fn: 'cd_paye', flag: '\uD83C\uDDE8\uD83C\uDDE9',
    name: 'DR Congo', currency: 'CDF', currencySymbol: 'CDF ',
    authority: 'DGI', period: 'annual',
    placeholder: '20,000,000',
    bands: [
      { limit: 524160, rate: 0 },
      { limit: 903840, rate: 0.03 },
      { limit: 1272000, rate: 0.05 },
      { limit: 1920000, rate: 0.10 },
      { limit: 2640000, rate: 0.15 },
      { limit: 3000000, rate: 0.20 },
      { limit: 3648000, rate: 0.25 },
      { limit: 2916000, rate: 0.30 },
      { limit: 4344000, rate: 0.35 },
      { limit: Infinity, rate: 0.40 }
    ],
    socialSecurity: { name: 'INSS', empRate: 0.05, employerRate: 0.05, deductible: true, cap: null },
  },
  // --- REPUBLIC OF CONGO ---
  {
    id: 'cg-paye', fn: 'cg_paye', flag: '\uD83C\uDDE8\uD83C\uDDEC',
    name: 'Republic of Congo', currency: 'XAF', currencySymbol: 'XAF ',
    authority: 'DGI', period: 'annual',
    placeholder: '5,000,000',
    bands: [
      { limit: 464000, rate: 0 },
      { limit: 536000, rate: 0.01 },
      { limit: 2000000, rate: 0.10 },
      { limit: 5000000, rate: 0.25 },
      { limit: 5500000, rate: 0.40 },
      { limit: Infinity, rate: 0.45 }
    ],
    socialSecurity: { name: 'CNSS', empRate: 0.04, employerRate: 0.2203, deductible: true, cap: null },
  },
  // --- GABON ---
  {
    id: 'ga-paye', fn: 'ga_paye', flag: '\uD83C\uDDEC\uD83C\uDDE6',
    name: 'Gabon', currency: 'XAF', currencySymbol: 'XAF ',
    authority: 'DGI', period: 'annual',
    placeholder: '10,000,000',
    bands: [
      { limit: 1500000, rate: 0 },
      { limit: 1380000, rate: 0.05 },
      { limit: 2100000, rate: 0.15 },
      { limit: 2520000, rate: 0.25 },
      { limit: Infinity, rate: 0.35 }
    ],
    socialSecurity: { name: 'CNSS', empRate: 0.025, employerRate: 0.166, deductible: true, cap: null },
  },
  // --- EQUATORIAL GUINEA ---
  {
    id: 'gq-paye', fn: 'gq_paye', flag: '\uD83C\uDDEC\uD83C\uDDF6',
    name: 'Equatorial Guinea', currency: 'XAF', currencySymbol: 'XAF ',
    authority: 'DGI', period: 'annual',
    placeholder: '10,000,000',
    bands: [
      { limit: 1000000, rate: 0 },
      { limit: 2000000, rate: 0.10 },
      { limit: 2000000, rate: 0.15 },
      { limit: 5000000, rate: 0.20 },
      { limit: 5000000, rate: 0.25 },
      { limit: 10000000, rate: 0.30 },
      { limit: Infinity, rate: 0.35 }
    ],
    socialSecurity: { name: 'Social Security', empRate: 0.045, employerRate: 0.215, deductible: true, cap: null },
  },
  // --- CENTRAL AFRICAN REPUBLIC ---
  {
    id: 'cf-paye', fn: 'cf_paye', flag: '\uD83C\uDDE8\uD83C\uDDEB',
    name: 'Central African Republic', currency: 'XAF', currencySymbol: 'XAF ',
    authority: 'DGI', period: 'annual',
    placeholder: '3,000,000',
    bands: [
      { limit: 200000, rate: 0 },
      { limit: 300000, rate: 0.10 },
      { limit: 500000, rate: 0.15 },
      { limit: 2000000, rate: 0.25 },
      { limit: 5000000, rate: 0.40 },
      { limit: Infinity, rate: 0.50 }
    ],
    socialSecurity: { name: 'CNSS', empRate: 0.03, employerRate: 0.18, deductible: true, cap: null },
  },
  // --- CHAD ---
  {
    id: 'td-paye', fn: 'td_paye', flag: '\uD83C\uDDF9\uD83C\uDDE9',
    name: 'Chad', currency: 'XAF', currencySymbol: 'XAF ',
    authority: 'DGI', period: 'annual',
    placeholder: '5,000,000',
    bands: [
      { limit: 290580, rate: 0 },
      { limit: 317040, rate: 0.10 },
      { limit: 712980, rate: 0.15 },
      { limit: 1188300, rate: 0.20 },
      { limit: 2376600, rate: 0.25 },
      { limit: 4753200, rate: 0.30 },
      { limit: 4753200, rate: 0.35 },
      { limit: Infinity, rate: 0.40 }
    ],
    socialSecurity: { name: 'CNPS', empRate: 0.035, employerRate: 0.165, deductible: true, cap: null },
  },
  // --- NIGER ---
  {
    id: 'ne-paye', fn: 'ne_paye', flag: '\uD83C\uDDF3\uD83C\uDDEA',
    name: 'Niger', currency: 'XOF', currencySymbol: 'XOF ',
    authority: 'DGI', period: 'annual',
    placeholder: '5,000,000',
    bands: [
      { limit: 300000, rate: 0 },
      { limit: 300000, rate: 0.02 },
      { limit: 600000, rate: 0.05 },
      { limit: 1200000, rate: 0.10 },
      { limit: 2400000, rate: 0.15 },
      { limit: 4800000, rate: 0.20 },
      { limit: Infinity, rate: 0.25 }
    ],
    socialSecurity: { name: 'CNSS', empRate: 0.055, employerRate: 0.165, deductible: true, cap: null },
  },
  // --- MALI ---
  {
    id: 'ml-paye', fn: 'ml_paye', flag: '\uD83C\uDDF2\uD83C\uDDF1',
    name: 'Mali', currency: 'XOF', currencySymbol: 'XOF ',
    authority: 'DGI', period: 'annual',
    placeholder: '5,000,000',
    bands: [
      { limit: 300000, rate: 0 },
      { limit: 300000, rate: 0.02 },
      { limit: 600000, rate: 0.05 },
      { limit: 1200000, rate: 0.10 },
      { limit: 2400000, rate: 0.15 },
      { limit: 4800000, rate: 0.20 },
      { limit: Infinity, rate: 0.25 }
    ],
    socialSecurity: { name: 'INPS', empRate: 0.036, employerRate: 0.204, deductible: true, cap: null },
  },
  // --- BURKINA FASO ---
  {
    id: 'bf-paye', fn: 'bf_paye', flag: '\uD83C\uDDE7\uD83C\uDDEB',
    name: 'Burkina Faso', currency: 'XOF', currencySymbol: 'XOF ',
    authority: 'DGI', period: 'annual',
    placeholder: '5,000,000',
    bands: [
      { limit: 300000, rate: 0 },
      { limit: 300000, rate: 0.02 },
      { limit: 600000, rate: 0.05 },
      { limit: 1200000, rate: 0.10 },
      { limit: 2400000, rate: 0.15 },
      { limit: 4800000, rate: 0.20 },
      { limit: Infinity, rate: 0.25 }
    ],
    socialSecurity: { name: 'CNSS', empRate: 0.055, employerRate: 0.165, deductible: true, cap: null },
  },
  // --- GUINEA ---
  {
    id: 'gn-paye', fn: 'gn_paye', flag: '\uD83C\uDDEC\uD83C\uDDF3',
    name: 'Guinea', currency: 'GNF', currencySymbol: 'GNF ',
    authority: 'DNI', period: 'annual',
    placeholder: '50,000,000',
    bands: [
      { limit: 5000000, rate: 0 },
      { limit: 5000000, rate: 0.05 },
      { limit: 10000000, rate: 0.10 },
      { limit: 10000000, rate: 0.15 },
      { limit: 20000000, rate: 0.20 },
      { limit: Infinity, rate: 0.25 }
    ],
    socialSecurity: { name: 'CNSS', empRate: 0.05, employerRate: 0.18, deductible: true, cap: null },
  },
  // --- GUINEA-BISSAU ---
  {
    id: 'gw-paye', fn: 'gw_paye', flag: '\uD83C\uDDEC\uD83C\uDDFC',
    name: 'Guinea-Bissau', currency: 'XOF', currencySymbol: 'XOF ',
    authority: 'DGCI', period: 'monthly',
    placeholder: '200,000',
    bands: [
      { limit: 25000, rate: 0 },
      { limit: 25000, rate: 0.10 },
      { limit: 50000, rate: 0.15 },
      { limit: 100000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 }
    ],
    socialSecurity: { name: 'INSS', empRate: 0.08, employerRate: 0.14, deductible: true, cap: null },
  },
  // --- SIERRA LEONE ---
  {
    id: 'sl-paye', fn: 'sl_paye', flag: '\uD83C\uDDF8\uD83C\uDDF1',
    name: 'Sierra Leone', currency: 'SLE', currencySymbol: 'SLE ',
    authority: 'NRA', period: 'monthly',
    placeholder: '5,000,000',
    bands: [
      { limit: 600000, rate: 0 },
      { limit: 600000, rate: 0.15 },
      { limit: 600000, rate: 0.20 },
      { limit: 600000, rate: 0.25 },
      { limit: Infinity, rate: 0.30 }
    ],
    socialSecurity: { name: 'NASSIT', empRate: 0.05, employerRate: 0.10, deductible: true, cap: null },
  },
  // --- LIBERIA ---
  {
    id: 'lr-paye', fn: 'lr_paye', flag: '\uD83C\uDDF1\uD83C\uDDF7',
    name: 'Liberia', currency: 'LRD', currencySymbol: 'LRD ',
    authority: 'LRA', period: 'annual',
    placeholder: '500,000',
    bands: [
      { limit: 70000, rate: 0 },
      { limit: 130000, rate: 0.05 },
      { limit: 200000, rate: 0.15 },
      { limit: 200000, rate: 0.20 },
      { limit: Infinity, rate: 0.25 }
    ],
    socialSecurity: { name: 'NASSCORP', empRate: 0.03, employerRate: 0.03, deductible: true, cap: null },
  },
  // --- MAURITANIA ---
  {
    id: 'mr-paye', fn: 'mr_paye', flag: '\uD83C\uDDF2\uD83C\uDDF7',
    name: 'Mauritania', currency: 'MRU', currencySymbol: 'MRU ',
    authority: 'DGI', period: 'monthly',
    placeholder: '50,000',
    bands: [
      { limit: 6000, rate: 0 },
      { limit: 9000, rate: 0.15 },
      { limit: 6000, rate: 0.25 },
      { limit: 9000, rate: 0.30 },
      { limit: Infinity, rate: 0.40 }
    ],
    socialSecurity: { name: 'CNSS', empRate: 0.01, employerRate: 0.15, deductible: true, cap: null },
  },
  // --- GAMBIA ---
  {
    id: 'gm-paye', fn: 'gm_paye', flag: '\uD83C\uDDEC\uD83C\uDDF2',
    name: 'Gambia', currency: 'GMD', currencySymbol: 'GMD ',
    authority: 'GRA', period: 'annual',
    placeholder: '300,000',
    bands: [
      { limit: 24000, rate: 0 },
      { limit: 12000, rate: 0.05 },
      { limit: 12000, rate: 0.10 },
      { limit: 12000, rate: 0.15 },
      { limit: 12000, rate: 0.20 },
      { limit: 28000, rate: 0.25 },
      { limit: Infinity, rate: 0.30 }
    ],
    socialSecurity: { name: 'SSHFC', empRate: 0.05, employerRate: 0.10, deductible: true, cap: null },
  },
  // --- CAPE VERDE ---
  {
    id: 'cv-paye', fn: 'cv_paye', flag: '\uD83C\uDDE8\uD83C\uDDFB',
    name: 'Cape Verde', currency: 'CVE', currencySymbol: 'CVE ',
    authority: 'DGCI', period: 'annual',
    placeholder: '3,000,000',
    bands: [
      { limit: 200000, rate: 0 },
      { limit: 250000, rate: 0.165 },
      { limit: 250000, rate: 0.215 },
      { limit: 300000, rate: 0.235 },
      { limit: Infinity, rate: 0.275 }
    ],
    socialSecurity: { name: 'INPS', empRate: 0.085, employerRate: 0.16, deductible: true, cap: null },
  },
  // --- SAO TOME & PRINCIPE ---
  {
    id: 'st-paye', fn: 'st_paye', flag: '\uD83C\uDDF8\uD83C\uDDF9',
    name: 'S\u00e3o Tom\u00e9 & Pr\u00edncipe', currency: 'STN', currencySymbol: 'STN ',
    authority: 'DGTF', period: 'annual',
    placeholder: '15,000,000',
    bands: [
      { limit: 2500000, rate: 0 },
      { limit: 2500000, rate: 0.10 },
      { limit: 5000000, rate: 0.15 },
      { limit: 10000000, rate: 0.20 },
      { limit: Infinity, rate: 0.25 }
    ],
    socialSecurity: { name: 'INSS', empRate: 0.06, employerRate: 0.06, deductible: true, cap: null },
  },
  // --- TOGO ---
  {
    id: 'tg-paye', fn: 'tg_paye', flag: '\uD83C\uDDF9\uD83C\uDDEC',
    name: 'Togo', currency: 'XOF', currencySymbol: 'XOF ',
    authority: 'OTR', period: 'annual',
    placeholder: '5,000,000',
    bands: [
      { limit: 300000, rate: 0 },
      { limit: 300000, rate: 0.02 },
      { limit: 600000, rate: 0.05 },
      { limit: 1200000, rate: 0.10 },
      { limit: 2400000, rate: 0.15 },
      { limit: 4800000, rate: 0.20 },
      { limit: Infinity, rate: 0.25 }
    ],
    socialSecurity: { name: 'CNSS', empRate: 0.04, employerRate: 0.175, deductible: true, cap: null },
  },
  // --- BENIN ---
  {
    id: 'bj-paye', fn: 'bj_paye', flag: '\uD83C\uDDE7\uD83C\uDDEF',
    name: 'Benin', currency: 'XOF', currencySymbol: 'XOF ',
    authority: 'DGI', period: 'annual',
    placeholder: '5,000,000',
    bands: [
      { limit: 300000, rate: 0 },
      { limit: 300000, rate: 0.02 },
      { limit: 600000, rate: 0.05 },
      { limit: 1200000, rate: 0.10 },
      { limit: 2400000, rate: 0.15 },
      { limit: 4800000, rate: 0.20 },
      { limit: Infinity, rate: 0.25 }
    ],
    socialSecurity: { name: 'CNSS', empRate: 0.036, employerRate: 0.154, deductible: true, cap: null },
  },
  // --- SOMALIA ---
  {
    id: 'so-paye', fn: 'so_paye', flag: '\uD83C\uDDF8\uD83C\uDDF4',
    name: 'Somalia', currency: 'SOS', currencySymbol: 'SOS ',
    authority: 'MoF', period: 'monthly',
    placeholder: '5,000,000',
    flatRate: 0.05,
    bands: null,
    socialSecurity: null,
    note: 'Flat 5% on all employment income. No formal social security.'
  },
  // --- DJIBOUTI ---
  {
    id: 'dj-paye', fn: 'dj_paye', flag: '\uD83C\uDDE9\uD83C\uDDEF',
    name: 'Djibouti', currency: 'DJF', currencySymbol: 'DJF ',
    authority: 'DGI', period: 'monthly',
    placeholder: '200,000',
    bands: [
      { limit: 50000, rate: 0 },
      { limit: 100000, rate: 0.02 },
      { limit: 350000, rate: 0.15 },
      { limit: 500000, rate: 0.18 },
      { limit: 1000000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 }
    ],
    socialSecurity: { name: 'Social Security', empRate: 0.04, employerRate: 0.157, deductible: true, cap: null },
  },
  // --- ERITREA ---
  {
    id: 'er-paye', fn: 'er_paye', flag: '\uD83C\uDDEA\uD83C\uDDF7',
    name: 'Eritrea', currency: 'ERN', currencySymbol: 'ERN ',
    authority: 'MoF', period: 'monthly',
    placeholder: '10,000',
    bands: [
      { limit: 600, rate: 0 },
      { limit: 900, rate: 0.02 },
      { limit: 4500, rate: 0.05 },
      { limit: 9000, rate: 0.10 },
      { limit: 21000, rate: 0.15 },
      { limit: 24000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 }
    ],
    socialSecurity: null,
  },
  // --- SOUTH SUDAN ---
  {
    id: 'ss-paye', fn: 'ss_paye', flag: '\uD83C\uDDF8\uD83C\uDDF8',
    name: 'South Sudan', currency: 'SSP', currencySymbol: 'SSP ',
    authority: 'NRA', period: 'monthly',
    placeholder: '100,000',
    bands: [
      { limit: 30000, rate: 0 },
      { limit: 20000, rate: 0.10 },
      { limit: 30000, rate: 0.15 },
      { limit: Infinity, rate: 0.20 }
    ],
    socialSecurity: { name: 'NSIF', empRate: 0.04, employerRate: 0.17, deductible: true, cap: null },
  },
  // --- COMOROS ---
  {
    id: 'km-paye', fn: 'km_paye', flag: '\uD83C\uDDF0\uD83C\uDDF2',
    name: 'Comoros', currency: 'KMF', currencySymbol: 'KMF ',
    authority: 'DGI', period: 'annual',
    placeholder: '5,000,000',
    bands: [
      { limit: 300000, rate: 0 },
      { limit: 300000, rate: 0.02 },
      { limit: 600000, rate: 0.05 },
      { limit: 1200000, rate: 0.10 },
      { limit: 2400000, rate: 0.15 },
      { limit: 4800000, rate: 0.20 },
      { limit: Infinity, rate: 0.25 }
    ],
    socialSecurity: { name: 'CNPS', empRate: 0.025, employerRate: 0.095, deductible: true, cap: null },
  },
];

// ══════════════════════════════════════════════════════════════
// WIDGET TEMPLATE GENERATOR
// ══════════════════════════════════════════════════════════════

function generateWidget(c) {
  const isFlat = !!c.flatRate && !c.bands;
  const isLy = c.id === 'ly-paye';
  const ss = c.socialSecurity;
  const hasSS = ss && ss.empRate;
  const hasFlatSS = ss && ss.flat;
  const periodLabel = c.period === 'monthly' ? 'Monthly' : 'Annual';
  const periodInputLabel = c.period === 'monthly' ? 'Monthly Gross Salary' : 'Annual Gross Salary';
  const divisor = c.period === 'monthly' ? 1 : 12;
  const multiplier = c.period === 'monthly' ? 12 : 1;

  // Build bands array string
  let bandsCode = '';
  if (c.bands) {
    const bandsArr = c.bands.map(b => {
      const lim = isFinite(b.limit) ? b.limit : 'Infinity';
      return `{ limit: ${lim}, rate: ${b.rate} }`;
    });
    bandsCode = `    var BANDS = [\n      ${bandsArr.join(',\n      ')}\n    ];\n`;
  }

  // Social security cap code
  let ssCapCode = '';
  if (hasSS && ss.cap) {
    ssCapCode = `Math.min(gross * ${ss.empRate}, ${ss.cap})`;
  } else if (hasSS) {
    ssCapCode = `gross * ${ss.empRate}`;
  } else if (hasFlatSS) {
    ssCapCode = `${ss.flat}`;
  }

  // Build tax calc for flat-rate countries
  let calcBody;
  if (isLy) {
    calcBody = `
      var incomeTax = gross * ${c.flatRate};
      var jihadTax = gross * ${c.jihadTax};
      var stampDuty = gross * ${c.stampDuty};
      var totalTax = incomeTax + jihadTax + stampDuty;`;
  } else if (isFlat) {
    calcBody = `
      var totalTax = gross * ${c.flatRate};`;
  } else {
    calcBody = `
      var totalTax = 0, rem = taxable;
      for (var i = 0; i < BANDS.length; i++) {
        if (rem <= 0) break;
        var b = BANDS[i];
        var chunk = Math.min(rem, isFinite(b.limit) ? b.limit : rem);
        totalTax += chunk * b.rate;
        rem -= chunk;
      }`;
  }

  // Tax credit / rebate handling
  let creditCode = '';
  let creditRow = '';
  if (c.taxCredit) {
    creditCode = `\n      totalTax = Math.max(0, totalTax - ${c.taxCredit});`;
    creditRow = `\n          '<div class="aw-result-row"><span>Tax Credit</span><span>-' + fmt(${c.taxCredit}) + '</span></div>' +`;
  }
  if (c.taxRebate) {
    creditCode = `\n      totalTax = Math.max(0, totalTax - ${c.taxRebate});`;
    creditRow = `\n          '<div class="aw-result-row"><span>Tax Rebate</span><span>-' + fmt(${c.taxRebate}) + '</span></div>' +`;
  }

  // Build SS row
  let ssRow = '';
  let ssCalcLine = '';
  let taxableCalcLine;
  if (hasSS) {
    const ssLabel = `${ss.name} (${(ss.empRate * 100).toFixed(1)}%${ss.cap ? ', capped' : ''})`;
    ssCalcLine = `      var ss = includeSS ? ${ssCapCode} : 0;`;
    if (ss.deductible) {
      taxableCalcLine = `      var taxable = Math.max(0, gross - ss);`;
    } else {
      taxableCalcLine = `      var taxable = gross;`;
    }
    ssRow = `\n          '<div class="aw-result-row"><span>${ssLabel}</span><span>-' + fmt(ss) + '</span></div>' +`;
  } else if (hasFlatSS) {
    ssCalcLine = `      var ss = ${ssCapCode};`;
    taxableCalcLine = ss.deductible ? `      var taxable = Math.max(0, gross - ss);` : `      var taxable = gross;`;
    ssRow = `\n          '<div class="aw-result-row"><span>${ss.name} (flat)</span><span>-' + fmt(ss) + '</span></div>' +`;
  } else {
    ssCalcLine = `      var ss = 0;`;
    taxableCalcLine = `      var taxable = gross;`;
  }

  // Libya special rows
  let lyRows = '';
  if (isLy) {
    lyRows = `
          '<div class="aw-result-row"><span>Income Tax (10%)</span><span style="color:#dc2626">-' + fmt(incomeTax) + '</span></div>' +
          '<div class="aw-result-row"><span>Jihad Tax (3%)</span><span style="color:#dc2626">-' + fmt(jihadTax) + '</span></div>' +
          '<div class="aw-result-row"><span>Stamp Duty (1%)</span><span style="color:#dc2626">-' + fmt(stampDuty) + '</span></div>' +`;
  }

  const uid = c.id.replace(/-/g, '');

  return `/**
 * AfroTools \u2014 ${c.name} PAYE Widget (${c.authority} ${c.period === 'monthly' ? '2025/26' : '2025'})
 * Real tax bands from ${c.id.replace('-paye','')}-paye.html
 */
(function(){
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};

  window.AfroWidgets.${c.fn} = function(container, opts) {
    opts = opts || {};
    var fmt = function(n){ return '${c.currencySymbol}' + Math.round(n).toLocaleString('en'); };
    var pct = function(r){ return r.toFixed(1) + '%'; };

${bandsCode}
    function calculate(gross, includeSS) {
${ssCalcLine}
${taxableCalcLine}
${calcBody}${creditCode}
      var net = gross - ss - totalTax;
      return { gross: gross, ss: ss, taxable: taxable, tax: totalTax, net: net, effectiveRate: gross > 0 ? totalTax / gross * 100 : 0${isLy ? ', incomeTax: incomeTax, jihadTax: jihadTax, stampDuty: stampDuty' : ''} };
    }

    container.innerHTML =
      '<div class="aw-title">${c.flag} ${c.name} PAYE Calculator</div>' +
      '<div class="aw-field"><label class="aw-label">${periodInputLabel} (${c.currency})</label>' +
        '<input class="aw-input" id="aw${uid}G" type="text" inputmode="numeric" placeholder="e.g. ${c.placeholder}">' +
      '</div>' +
      '<button class="aw-btn aw-btn--primary" id="aw${uid}C">Calculate PAYE</button>' +
      '<div id="aw${uid}R"></div>' +
      (opts.footerHTML || '');

    container.querySelector('#aw${uid}C').addEventListener('click', function() {
      var gross = parseFloat((container.querySelector('#aw${uid}G').value || '').replace(/[^0-9.]/g, '')) || 0;
      if (!gross) return;
      var R = calculate(gross, true);
      container.querySelector('#aw${uid}R').innerHTML =
        '<div class="aw-result-box">' +
          '<div class="aw-result-label">${periodLabel} Take-Home (${c.authority} ${c.period === 'monthly' ? '2025/26' : '2025'})</div>' +
          '<div class="aw-result-main">' + fmt(R.net${c.period === 'annual' ? ' / 12' : ''}) + '/mo</div>' +
        '</div>' +
        '<div style="margin-top:12px">' +
          '<div class="aw-result-row"><span>${periodLabel} Gross</span><span>' + fmt(R.gross) + '</span></div>' +${ssRow}${isLy ? lyRows : `
          '<div class="aw-result-row"><span>Taxable Income</span><span>' + fmt(R.taxable) + '</span></div>' +`}${creditRow}
          '<hr class="aw-divider">' +${isLy ? '' : `
          '<div class="aw-result-row"><span>PAYE Tax</span><span style="color:#dc2626">-' + fmt(R.tax) + '</span></div>' +`}
          '<div class="aw-result-row"><span>Effective Rate</span><span>' + pct(R.effectiveRate) + '</span></div>' +
          '<hr class="aw-divider">' +
          '<div class="aw-result-row" style="font-weight:700"><span>${periodLabel} Net</span><span style="color:#007AFF">' + fmt(R.net) + '</span></div>' +
          '<div class="aw-result-row" style="font-weight:700"><span>${c.period === 'monthly' ? 'Annual' : 'Monthly'} Net</span><span style="color:#007AFF">' + fmt(R.net ${c.period === 'monthly' ? '* 12' : '/ 12'}) + '</span></div>' +
        '</div>';
    });

    container.querySelector('#aw${uid}G').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') container.querySelector('#aw${uid}C').click();
    });
  };
})();
`;
}

// ══════════════════════════════════════════════════════════════
// GENERATE ALL FILES
// ══════════════════════════════════════════════════════════════

let generated = 0;
let errors = [];

for (const c of COUNTRIES) {
  try {
    const code = generateWidget(c);
    const filePath = path.join(OUT_DIR, `${c.id}.js`);

    // Skip if already exists (top 10 hand-written)
    if (fs.existsSync(filePath)) {
      console.log(`SKIP (exists): ${c.id}.js`);
      continue;
    }

    fs.writeFileSync(filePath, code, 'utf8');
    const size = Buffer.byteLength(code, 'utf8');
    console.log(`WROTE: ${c.id}.js (${(size / 1024).toFixed(1)} KB)`);
    generated++;
  } catch (err) {
    errors.push({ id: c.id, error: err.message });
    console.error(`ERROR: ${c.id} — ${err.message}`);
  }
}

console.log(`\n=== DONE: ${generated} widgets generated, ${errors.length} errors ===`);
if (errors.length) console.log('Errors:', errors);
