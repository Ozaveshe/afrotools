// /data/hr/minimum-wages.js
// Minimum wage data for all 54 African countries
// Source: National labour laws, ILO, WageIndicator (2024-2026)

var MINIMUM_WAGES = {
  NG: {
    name: "Nigeria", currency: "NGN", symbol: "\u20A6", flag: "\uD83C\uDDF3\uD83C\uDDEC",
    nationalMinimum: { monthly: 70000, daily: 2333, hourly: 292, effectiveDate: "2024-07-01", law: "National Minimum Wage (Amendment) Act 2024" },
    sectorRates: null,
    previousRates: [
      { amount: 30000, period: "2019-2024" },
      { amount: 18000, period: "2011-2019" }
    ],
    livingWage: { estimated: 150000, source: "WageIndicator 2025", gap: "Minimum wage covers ~47% of estimated living wage" },
    notes: "Public sector must comply. Private sector with <25 employees may be exempt. States can set higher \u2014 Lagos proposed \u20A685,000.",
    compliance: "Federal Ministry of Labour and Employment"
  },
  KE: {
    name: "Kenya", currency: "KES", symbol: "KES", flag: "\uD83C\uDDF0\uD83C\uDDEA",
    nationalMinimum: { monthly: 16114, daily: 620, hourly: 77, effectiveDate: "2022-05-01", law: "Regulation of Wages and Conditions of Employment Act" },
    sectorRates: [
      { sector: "Unskilled - Cities (Nairobi, Mombasa, Kisumu)", monthly: 16114 },
      { sector: "Unskilled - Municipalities", monthly: 14575 },
      { sector: "Unskilled - Other areas", monthly: 11009 },
      { sector: "Skilled - Cities (artisans, drivers)", monthly: 17854 },
      { sector: "Agriculture - Unskilled", monthly: 8847 },
      { sector: "Agriculture - Skilled", monthly: 10167 },
      { sector: "Heavy commercial vehicle drivers", monthly: 32800 }
    ],
    notes: "Kenya has one of the most complex minimum wage systems in Africa with 56 different rates across sectors and locations.",
    compliance: "Ministry of Labour and Social Protection"
  },
  ZA: {
    name: "South Africa", currency: "ZAR", symbol: "R", flag: "\uD83C\uDDFF\uD83C\uDDE6",
    nationalMinimum: { hourly: 27.58, daily: 220.64, monthly: 5960, effectiveDate: "2024-03-01", law: "National Minimum Wage Act 9 of 2018" },
    sectorRates: [
      { sector: "General workers", hourly: 27.58 },
      { sector: "Farm workers", hourly: 27.58, notes: "Equalized with general workers in 2024" },
      { sector: "Domestic workers", hourly: 27.58, notes: "Equalized with general workers in 2024" },
      { sector: "Expanded Public Works Programme (EPWP)", hourly: 15.16 },
      { sector: "Learnership allowance (no matric)", hourly: 16.57 }
    ],
    previousRates: [
      { amount: 25.42, unit: "hourly", period: "2023-2024" },
      { amount: 23.19, unit: "hourly", period: "2022-2023" }
    ],
    notes: "National Minimum Wage Commission reviews annually. Farm and domestic worker rates equalized from 2024.",
    compliance: "Department of Employment and Labour"
  },
  GH: {
    name: "Ghana", currency: "GHS", symbol: "GHS", flag: "\uD83C\uDDEC\uD83C\uDDED",
    nationalMinimum: { daily: 18.15, monthly: 490, effectiveDate: "2024-01-01", law: "Labour Act 651 of 2003" },
    notes: "Set by National Tripartite Committee. Monthly = daily x 27 working days. Under review for 2026.",
    compliance: "National Tripartite Committee / Ministry of Employment"
  },
  EG: {
    name: "Egypt", currency: "EGP", symbol: "EGP", flag: "\uD83C\uDDEA\uD83C\uDDEC",
    nationalMinimum: { monthly: 6000, effectiveDate: "2024-05-01", law: "Labour Law 12 of 2003" },
    sectorRates: [
      { sector: "Private sector", monthly: 6000 },
      { sector: "Public sector/civil service", monthly: 7000, notes: "Higher minimum for government employees" }
    ],
    notes: "National Wages Council sets rates. Reviewed frequently due to inflation and EGP depreciation."
  },
  ET: {
    name: "Ethiopia", currency: "ETB", symbol: "ETB", flag: "\uD83C\uDDEA\uD83C\uDDF9",
    nationalMinimum: { monthly: null, notes: "NO NATIONAL MINIMUM WAGE. Wages set by collective bargaining or sector." },
    sectorRates: [
      { sector: "Civil servants (lowest grade)", monthly: 1300, notes: "Government pay scale only" },
      { sector: "Private sector", monthly: null, notes: "No legal minimum. Market-determined." }
    ],
    notes: "Ethiopia is one of few African countries without a legally mandated minimum wage. Wage board proposed but not enacted as of 2026.",
    noMinimumWage: true
  },
  TZ: {
    name: "Tanzania", currency: "TZS", symbol: "TZS", flag: "\uD83C\uDDF9\uD83C\uDDFF",
    nationalMinimum: { monthly: 100000, effectiveDate: "2024-07-01", law: "Labour Institutions Act 2004 / Wage Order 2024" },
    sectorRates: [
      { sector: "Agriculture", monthly: 100000 },
      { sector: "Domestic workers", monthly: 120000 },
      { sector: "Commercial/Retail", monthly: 200000 },
      { sector: "Mining", monthly: 450000 },
      { sector: "Telecommunications", monthly: 400000 },
      { sector: "Financial services", monthly: 500000 }
    ],
    notes: "Tanzania has sector-based minimum wages set by Wage Boards. Mining and finance sectors have highest minimums."
  },
  UG: {
    name: "Uganda", currency: "UGX", symbol: "UGX", flag: "\uD83C\uDDFA\uD83C\uDDEC",
    nationalMinimum: { monthly: 130000, effectiveDate: "2024-06-01", law: "Minimum Wages Act / Minimum Wages Advisory Board" },
    notes: "Uganda raised minimum wage in 2024 after decades without adjustment. Previously no enforced minimum since 1984."
  },
  RW: {
    name: "Rwanda", currency: "RWF", symbol: "RWF", flag: "\uD83C\uDDF7\uD83C\uDDFC",
    nationalMinimum: { monthly: null, notes: "NO FORMAL NATIONAL MINIMUM WAGE. Ministerial Order sets civil service pay. Private sector market-driven." },
    sectorRates: [
      { sector: "Civil servants (lowest)", monthly: 20000, notes: "Approximately $14/month \u2014 one of lowest in Africa" }
    ],
    noMinimumWage: true,
    notes: "Rwanda relies on market forces. Government has indicated willingness to introduce minimum wage but no law enacted."
  },
  CI: {
    name: "C\u00F4te d'Ivoire", currency: "XOF", symbol: "FCFA", flag: "\uD83C\uDDE8\uD83C\uDDEE",
    nationalMinimum: { monthly: 75000, hourly: 450, effectiveDate: "2023-01-01", law: "Code du Travail" },
    notes: "SMIG (Salaire Minimum Interprofessionnel Garanti). Applies to all sectors. Agricultural SMAG may differ."
  },
  SN: {
    name: "Senegal", currency: "XOF", symbol: "FCFA", flag: "\uD83C\uDDF8\uD83C\uDDF3",
    nationalMinimum: { hourly: 333, monthly: 56000, effectiveDate: "2018-06-01", law: "Code du Travail" },
    notes: "SMIG hourly rate. Monthly calculated at 40hr/week x 4.33 weeks. Last revised 2018 \u2014 review overdue."
  },
  CM: {
    name: "Cameroon", currency: "XAF", symbol: "FCFA", flag: "\uD83C\uDDE8\uD83C\uDDF2",
    nationalMinimum: { monthly: 41875, hourly: 242, effectiveDate: "2023-07-01", law: "Code du Travail" },
    notes: "SMIG raised to 41,875 XAF/month in 2023. Previously 36,270 since 2014."
  },
  MA: {
    name: "Morocco", currency: "MAD", symbol: "MAD", flag: "\uD83C\uDDF2\uD83C\uDDE6",
    nationalMinimum: { hourly: 17.13, monthly: 3111, effectiveDate: "2024-01-01", law: "Code du Travail" },
    sectorRates: [
      { sector: "Industrial/Commercial (SMIG)", hourly: 17.13, monthly: 3111 },
      { sector: "Agricultural (SMAG)", daily: 93.01 }
    ],
    notes: "Morocco has Africa's highest minimum wage. SMIG for industrial workers, SMAG for agricultural. Annual reviews."
  },
  TN: {
    name: "Tunisia", currency: "TND", symbol: "TND", flag: "\uD83C\uDDF9\uD83C\uDDF3",
    nationalMinimum: { monthly: 480, hourly: 2.5, effectiveDate: "2023-05-01", law: "Code du Travail" },
    sectorRates: [
      { sector: "SMIG (48hr regime)", monthly: 480 },
      { sector: "SMIG (40hr regime)", monthly: 400 },
      { sector: "SMAG (Agricultural)", daily: 17.5 }
    ]
  },
  AO: { name: "Angola", currency: "AOA", symbol: "Kz", flag: "\uD83C\uDDE6\uD83C\uDDF4", nationalMinimum: { monthly: 70000, effectiveDate: "2023-07-01" } },
  ZM: { name: "Zambia", currency: "ZMW", symbol: "ZMW", flag: "\uD83C\uDDFF\uD83C\uDDF2", nationalMinimum: { monthly: 2025, effectiveDate: "2024-01-01" }, sectorRates: [
    { sector: "Domestic workers", monthly: 1350 },
    { sector: "Shop workers", monthly: 2025 },
    { sector: "General workers", monthly: 2025 }
  ]},
  ZW: { name: "Zimbabwe", currency: "ZWG", symbol: "ZWG", flag: "\uD83C\uDDFF\uD83C\uDDFC", nationalMinimum: { monthly: 400, currency: "USD", notes: "Zimbabwe uses USD effectively. ZWG minimum exists but most workers paid in USD." } },
  MU: { name: "Mauritius", currency: "MUR", symbol: "MUR", flag: "\uD83C\uDDF2\uD83C\uDDFA", nationalMinimum: { monthly: 15000, effectiveDate: "2024-01-01", notes: "MUR 15,000/month. One of highest in Africa." } },
  BW: { name: "Botswana", currency: "BWP", symbol: "BWP", flag: "\uD83C\uDDE7\uD83C\uDDFC", nationalMinimum: { hourly: 8.35, monthly: 1444, effectiveDate: "2024-01-01" } },
  NA: { name: "Namibia", currency: "NAD", symbol: "N$", flag: "\uD83C\uDDF3\uD83C\uDDE6", nationalMinimum: { monthly: null, notes: "NO universal minimum wage. Sector-specific wages set by Wages Commission." }, noMinimumWage: true, sectorRates: [
    { sector: "Farm workers", monthly: 1850 },
    { sector: "Domestic workers", monthly: 1850 },
    { sector: "Construction", monthly: 4200 },
    { sector: "Security guards", monthly: 3200 }
  ]},
  MW: { name: "Malawi", currency: "MWK", symbol: "MWK", flag: "\uD83C\uDDF2\uD83C\uDDFC", nationalMinimum: { daily: 3500, monthly: 77000, effectiveDate: "2024-01-01" } },
  MZ: { name: "Mozambique", currency: "MZN", symbol: "MZN", flag: "\uD83C\uDDF2\uD83C\uDDFF", nationalMinimum: { monthly: 6726, effectiveDate: "2024-04-01" }, sectorRates: [
    { sector: "Agriculture", monthly: 5570 },
    { sector: "Manufacturing", monthly: 6726 },
    { sector: "Mining", monthly: 13700 },
    { sector: "Financial services", monthly: 17800 }
  ]},
  MG: { name: "Madagascar", currency: "MGA", symbol: "MGA", flag: "\uD83C\uDDF2\uD83C\uDDEC", nationalMinimum: { monthly: 250000, effectiveDate: "2023-01-01" } },
  LS: { name: "Lesotho", currency: "LSL", symbol: "LSL", flag: "\uD83C\uDDF1\uD83C\uDDF8", nationalMinimum: { monthly: 2400, effectiveDate: "2023-01-01" } },
  SZ: { name: "Eswatini", currency: "SZL", symbol: "SZL", flag: "\uD83C\uDDF8\uD83C\uDDFF", nationalMinimum: { monthly: 2200, effectiveDate: "2023-01-01" } },
  BJ: { name: "Benin", currency: "XOF", symbol: "FCFA", flag: "\uD83C\uDDE7\uD83C\uDDEF", nationalMinimum: { monthly: 52000, effectiveDate: "2023-01-01" } },
  BF: { name: "Burkina Faso", currency: "XOF", symbol: "FCFA", flag: "\uD83C\uDDE7\uD83C\uDDEB", nationalMinimum: { monthly: 45000, effectiveDate: "2023-01-01" } },
  ML: { name: "Mali", currency: "XOF", symbol: "FCFA", flag: "\uD83C\uDDF2\uD83C\uDDF1", nationalMinimum: { monthly: 40000, effectiveDate: "2023-01-01" } },
  NE: { name: "Niger", currency: "XOF", symbol: "FCFA", flag: "\uD83C\uDDF3\uD83C\uDDEA", nationalMinimum: { monthly: 42000, effectiveDate: "2023-01-01" } },
  TG: { name: "Togo", currency: "XOF", symbol: "FCFA", flag: "\uD83C\uDDF9\uD83C\uDDEC", nationalMinimum: { monthly: 52500, effectiveDate: "2024-01-01" } },
  GN: { name: "Guinea", currency: "GNF", symbol: "GNF", flag: "\uD83C\uDDEC\uD83C\uDDF3", nationalMinimum: { monthly: 550000, effectiveDate: "2023-01-01" } },
  SL: { name: "Sierra Leone", currency: "SLE", symbol: "SLE", flag: "\uD83C\uDDF8\uD83C\uDDF1", nationalMinimum: { monthly: 800, effectiveDate: "2023-01-01", notes: "New Leone (SLE). Previously 600,000 old Leones." } },
  LR: { name: "Liberia", currency: "LRD", symbol: "LRD", flag: "\uD83C\uDDF1\uD83C\uDDF7", nationalMinimum: { hourly: 1.00, currency: "USD", notes: "USD $1/hour for skilled. LRD 15/hour for unskilled." } },
  GM: { name: "Gambia", currency: "GMD", symbol: "GMD", flag: "\uD83C\uDDEC\uD83C\uDDF2", nationalMinimum: { daily: 150, monthly: 3300, effectiveDate: "2024-01-01" } },
  GW: { name: "Guinea-Bissau", currency: "XOF", symbol: "FCFA", flag: "\uD83C\uDDEC\uD83C\uDDFC", nationalMinimum: { monthly: 28000, notes: "Not updated since 1988. One of lowest in world." } },
  CV: { name: "Cabo Verde", currency: "CVE", symbol: "CVE", flag: "\uD83C\uDDE8\uD83C\uDDFB", nationalMinimum: { monthly: 14000, effectiveDate: "2023-01-01" } },
  MR: { name: "Mauritania", currency: "MRU", symbol: "MRU", flag: "\uD83C\uDDF2\uD83C\uDDF7", nationalMinimum: { monthly: 6000, effectiveDate: "2023-01-01" } },
  DJ: { name: "Djibouti", currency: "DJF", symbol: "DJF", flag: "\uD83C\uDDE9\uD83C\uDDEF", nationalMinimum: { monthly: 35000, effectiveDate: "2023-01-01" } },
  KM: { name: "Comoros", currency: "KMF", symbol: "KMF", flag: "\uD83C\uDDF0\uD83C\uDDF2", nationalMinimum: { monthly: 55000, effectiveDate: "2023-01-01" } },
  SC: { name: "Seychelles", currency: "SCR", symbol: "SCR", flag: "\uD83C\uDDF8\uD83C\uDDE8", nationalMinimum: { hourly: 42.17, monthly: 7300, effectiveDate: "2024-01-01" } },
  SO: { name: "Somalia", currency: "SOS", symbol: "SOS", flag: "\uD83C\uDDF8\uD83C\uDDF4", nationalMinimum: { monthly: null, notes: "NO minimum wage law. Somalia has no functioning labour regulation." }, noMinimumWage: true },
  SD: { name: "Sudan", currency: "SDG", symbol: "SDG", flag: "\uD83C\uDDF8\uD83C\uDDE9", nationalMinimum: { monthly: 21000, notes: "Highly unstable due to conflict. Actual value negligible at black market rates." } },
  SS: { name: "South Sudan", currency: "SSP", symbol: "SSP", flag: "\uD83C\uDDF8\uD83C\uDDF8", nationalMinimum: { monthly: null, notes: "NO enforced minimum wage." }, noMinimumWage: true },
  LY: { name: "Libya", currency: "LYD", symbol: "LYD", flag: "\uD83C\uDDF1\uD83C\uDDFE", nationalMinimum: { monthly: 450, effectiveDate: "2023-01-01" } },
  DZ: { name: "Algeria", currency: "DZD", symbol: "DZD", flag: "\uD83C\uDDE9\uD83C\uDDFF", nationalMinimum: { monthly: 20000, effectiveDate: "2021-06-01" } },
  TD: { name: "Chad", currency: "XAF", symbol: "FCFA", flag: "\uD83C\uDDF9\uD83C\uDDE9", nationalMinimum: { monthly: 60000, effectiveDate: "2018-01-01" } },
  CF: { name: "Central African Republic", currency: "XAF", symbol: "FCFA", flag: "\uD83C\uDDE8\uD83C\uDDEB", nationalMinimum: { monthly: 35000, notes: "Enforcement minimal due to conflict." } },
  CG: { name: "Republic of Congo", currency: "XAF", symbol: "FCFA", flag: "\uD83C\uDDE8\uD83C\uDDEC", nationalMinimum: { monthly: 90000, effectiveDate: "2017-01-01" } },
  CD: { name: "DR Congo", currency: "CDF", symbol: "CDF", flag: "\uD83C\uDDE8\uD83C\uDDE9", nationalMinimum: { daily: 7075, monthly: 183950, effectiveDate: "2023-01-01" } },
  GA: { name: "Gabon", currency: "XAF", symbol: "FCFA", flag: "\uD83C\uDDEC\uD83C\uDDE6", nationalMinimum: { monthly: 150000, effectiveDate: "2023-01-01", notes: "Highest SMIG in CEMAC zone." } },
  GQ: { name: "Equatorial Guinea", currency: "XAF", symbol: "FCFA", flag: "\uD83C\uDDEC\uD83C\uDDF6", nationalMinimum: { monthly: 129035, effectiveDate: "2023-01-01" } },
  ST: { name: "S\u00E3o Tom\u00E9 & Pr\u00EDncipe", currency: "STN", symbol: "STN", flag: "\uD83C\uDDF8\uD83C\uDDF9", nationalMinimum: { monthly: 2800, effectiveDate: "2023-01-01" } },
  BI: { name: "Burundi", currency: "BIF", symbol: "BIF", flag: "\uD83C\uDDE7\uD83C\uDDEE", nationalMinimum: { daily: 440, monthly: 10560, notes: "One of lowest in Africa." } },
  ER: { name: "Eritrea", currency: "ERN", symbol: "ERN", flag: "\uD83C\uDDEA\uD83C\uDDF7", nationalMinimum: { monthly: null, notes: "NO minimum wage. National service dominates labour force." }, noMinimumWage: true }
};

// AI observations for the minimum wage checker
var MW_OBSERVATIONS = {
  NG: "Nigeria's minimum wage is \u20A670,000/month (since July 2024). At current inflation, real purchasing power is approximately \u20A635,000 in 2019 terms.",
  KE: "Kenya has 56 different minimum wage rates across sectors and cities. The highest (skilled workers in Nairobi) is 3x the lowest (unskilled agriculture).",
  ZA: "South Africa's minimum wage is R27.58/hour (2025). Domestic workers and farm workers now receive the same rate after 2024 equalization.",
  MA: "Morocco has the highest minimum wage in Africa at ~$374/month. Ethiopia, Eritrea, and Somalia have NO legally mandated minimum wage.",
  GH: "Ghana's minimum wage of GHS 18.15/day is set by the National Tripartite Committee. Monthly equivalent of ~GHS 490 based on 27 working days.",
  EG: "Egypt raised its minimum wage to EGP 6,000/month in May 2024. Public sector workers receive EGP 7,000. Frequent adjustments due to inflation.",
  TZ: "Tanzania uses sector-based minimum wages. Financial services workers earn 5x the agricultural minimum. Mining sector is also significantly higher.",
  ET: "Ethiopia has NO legally mandated minimum wage \u2014 one of only a few countries in Africa without one. Wages are determined by market forces and collective bargaining.",
  CI: "C\u00F4te d'Ivoire's SMIG is 75,000 FCFA/month. As a CFA franc zone country, the minimum wage is relatively stable against the Euro."
};
