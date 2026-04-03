/* ═══════════════════════════════════════════════════
   STAFF COST ENGINE — AfroTools
   All 54 African countries · 2026 tax laws
   ═══════════════════════════════════════════════════ */
var StaffCostEngine = (function() {
'use strict';

function parseNum(s){return parseFloat(String(s).replace(/[^0-9.\-]/g,''))||0}

// ── ALL 54 COUNTRIES ──
// custom:1 = detailed PAYE calc; er/ee/pr = generic employer/employee/paye rates
var COUNTRIES = {
  // NORTH AFRICA
  DZ:{name:'Algeria',flag:'\u{1F1E9}\u{1F1FF}',currency:'DZD',symbol:'DA ',usdRate:135,region:'North Africa',er:.26,ee:.09,pr:.20,erL:'CNAS Employer (26%)',eeL:'CNAS Employee (9%)'},
  EG:{name:'Egypt',flag:'\u{1F1EA}\u{1F1EC}',currency:'EGP',symbol:'E\u00A3',usdRate:50,region:'North Africa',custom:1},
  LY:{name:'Libya',flag:'\u{1F1F1}\u{1F1FE}',currency:'LYD',symbol:'LD ',usdRate:4.8,region:'North Africa',er:.1125,ee:.0375,pr:.10,erL:'SSO Employer (11.25%)',eeL:'SSO Employee (3.75%)'},
  MA:{name:'Morocco',flag:'\u{1F1F2}\u{1F1E6}',currency:'MAD',symbol:'MAD ',usdRate:10,region:'North Africa',custom:1},
  SD:{name:'Sudan',flag:'\u{1F1F8}\u{1F1E9}',currency:'SDG',symbol:'SDG ',usdRate:600,region:'North Africa',er:.17,ee:.08,pr:.15,erL:'SSAS Employer (17%)',eeL:'SSAS Employee (8%)'},
  TN:{name:'Tunisia',flag:'\u{1F1F9}\u{1F1F3}',currency:'TND',symbol:'TND ',usdRate:3.1,region:'North Africa',er:.1657,ee:.0918,pr:.20,erL:'CNSS Employer (16.57%)',eeL:'CNSS Employee (9.18%)'},
  // WEST AFRICA
  BJ:{name:'Benin',flag:'\u{1F1E7}\u{1F1EF}',currency:'XOF',symbol:'CFA ',usdRate:600,region:'West Africa',er:.154,ee:.036,pr:.12,erL:'CNSS Employer (15.4%)',eeL:'CNSS Employee (3.6%)'},
  BF:{name:'Burkina Faso',flag:'\u{1F1E7}\u{1F1EB}',currency:'XOF',symbol:'CFA ',usdRate:600,region:'West Africa',er:.16,ee:.055,pr:.15,erL:'CNSS Employer (16%)',eeL:'CNSS Employee (5.5%)'},
  CV:{name:'Cabo Verde',flag:'\u{1F1E8}\u{1F1FB}',currency:'CVE',symbol:'CVE ',usdRate:105,region:'West Africa',er:.16,ee:.085,pr:.18,erL:'INPS Employer (16%)',eeL:'INPS Employee (8.5%)'},
  CI:{name:"C\u00f4te d'Ivoire",flag:'\u{1F1E8}\u{1F1EE}',currency:'XOF',symbol:'CFA ',usdRate:600,region:'West Africa',custom:1},
  GM:{name:'Gambia',flag:'\u{1F1EC}\u{1F1F2}',currency:'GMD',symbol:'GMD ',usdRate:70,region:'West Africa',er:.10,ee:.05,pr:.15,erL:'SSHFC Employer (10%)',eeL:'SSHFC Employee (5%)'},
  GH:{name:'Ghana',flag:'\u{1F1EC}\u{1F1ED}',currency:'GHS',symbol:'GH\u20B5',usdRate:15,region:'West Africa',custom:1},
  GN:{name:'Guinea',flag:'\u{1F1EC}\u{1F1F3}',currency:'GNF',symbol:'GNF ',usdRate:8600,region:'West Africa',er:.18,ee:.05,pr:.15,erL:'CNSS Employer (18%)',eeL:'CNSS Employee (5%)'},
  GW:{name:'Guinea-Bissau',flag:'\u{1F1EC}\u{1F1FC}',currency:'XOF',symbol:'CFA ',usdRate:600,region:'West Africa',er:.14,ee:.03,pr:.10,erL:'INSS Employer (14%)',eeL:'INSS Employee (3%)'},
  LR:{name:'Liberia',flag:'\u{1F1F1}\u{1F1F7}',currency:'LRD',symbol:'LRD ',usdRate:195,region:'West Africa',er:.05,ee:.05,pr:.15,erL:'NSS Employer (5%)',eeL:'NSS Employee (5%)'},
  ML:{name:'Mali',flag:'\u{1F1F2}\u{1F1F1}',currency:'XOF',symbol:'CFA ',usdRate:600,region:'West Africa',er:.18,ee:.036,pr:.15,erL:'INPS Employer (18%)',eeL:'INPS Employee (3.6%)'},
  MR:{name:'Mauritania',flag:'\u{1F1F2}\u{1F1F7}',currency:'MRU',symbol:'MRU ',usdRate:40,region:'West Africa',er:.15,ee:.01,pr:.15,erL:'CNSS Employer (15%)',eeL:'CNSS Employee (1%)'},
  NE:{name:'Niger',flag:'\u{1F1F3}\u{1F1EA}',currency:'XOF',symbol:'CFA ',usdRate:600,region:'West Africa',er:.204,ee:.05,pr:.15,erL:'CNSS Employer (20.4%)',eeL:'CNSS Employee (5%)'},
  NG:{name:'Nigeria',flag:'\u{1F1F3}\u{1F1EC}',currency:'NGN',symbol:'\u20A6',usdRate:1600,region:'West Africa',custom:1},
  SN:{name:'Senegal',flag:'\u{1F1F8}\u{1F1F3}',currency:'XOF',symbol:'CFA ',usdRate:600,region:'West Africa',custom:1},
  SL:{name:'Sierra Leone',flag:'\u{1F1F8}\u{1F1F1}',currency:'SLE',symbol:'SLE ',usdRate:22,region:'West Africa',er:.10,ee:.05,pr:.15,erL:'NASSIT Employer (10%)',eeL:'NASSIT Employee (5%)'},
  TG:{name:'Togo',flag:'\u{1F1F9}\u{1F1EC}',currency:'XOF',symbol:'CFA ',usdRate:600,region:'West Africa',er:.175,ee:.04,pr:.15,erL:'CNSS Employer (17.5%)',eeL:'CNSS Employee (4%)'},
  // CENTRAL AFRICA
  AO:{name:'Angola',flag:'\u{1F1E6}\u{1F1F4}',currency:'AOA',symbol:'Kz ',usdRate:900,region:'Central Africa',custom:1},
  CM:{name:'Cameroon',flag:'\u{1F1E8}\u{1F1F2}',currency:'XAF',symbol:'FCFA ',usdRate:600,region:'Central Africa',custom:1},
  CF:{name:'Central African Republic',flag:'\u{1F1E8}\u{1F1EB}',currency:'XAF',symbol:'FCFA ',usdRate:600,region:'Central Africa',er:.10,ee:.04,pr:.12,erL:'CNSS Employer (10%)',eeL:'CNSS Employee (4%)'},
  TD:{name:'Chad',flag:'\u{1F1F9}\u{1F1E9}',currency:'XAF',symbol:'FCFA ',usdRate:600,region:'Central Africa',er:.165,ee:.035,pr:.15,erL:'CNPS Employer (16.5%)',eeL:'CNPS Employee (3.5%)'},
  CG:{name:'Congo (Brazzaville)',flag:'\u{1F1E8}\u{1F1EC}',currency:'XAF',symbol:'FCFA ',usdRate:600,region:'Central Africa',er:.205,ee:.045,pr:.18,erL:'CNSS Employer (20.5%)',eeL:'CNSS Employee (4.5%)'},
  CD:{name:'DR Congo',flag:'\u{1F1E8}\u{1F1E9}',currency:'CDF',symbol:'CDF ',usdRate:2800,region:'Central Africa',er:.09,ee:.035,pr:.15,erL:'INSS Employer (9%)',eeL:'INSS Employee (3.5%)'},
  GQ:{name:'Equatorial Guinea',flag:'\u{1F1EC}\u{1F1F6}',currency:'XAF',symbol:'FCFA ',usdRate:600,region:'Central Africa',er:.215,ee:.045,pr:.15,erL:'INSESO Employer (21.5%)',eeL:'INSESO Employee (4.5%)'},
  GA:{name:'Gabon',flag:'\u{1F1EC}\u{1F1E6}',currency:'XAF',symbol:'FCFA ',usdRate:600,region:'Central Africa',er:.201,ee:.025,pr:.18,erL:'CNSS Employer (20.1%)',eeL:'CNSS Employee (2.5%)'},
  ST:{name:'S\u00e3o Tom\u00e9 and Pr\u00edncipe',flag:'\u{1F1F8}\u{1F1F9}',currency:'STN',symbol:'STN ',usdRate:22,region:'Central Africa',er:.11,ee:.08,pr:.10,erL:'INSS Employer (11%)',eeL:'INSS Employee (8%)'},
  // EAST AFRICA
  BI:{name:'Burundi',flag:'\u{1F1E7}\u{1F1EE}',currency:'BIF',symbol:'BIF ',usdRate:2900,region:'East Africa',er:.065,ee:.04,pr:.15,erL:'INSS Employer (6.5%)',eeL:'INSS Employee (4%)'},
  KM:{name:'Comoros',flag:'\u{1F1F0}\u{1F1F2}',currency:'KMF',symbol:'KMF ',usdRate:450,region:'East Africa',er:.10,ee:.06,pr:.10,erL:'CNPS Employer (10%)',eeL:'CNPS Employee (6%)'},
  DJ:{name:'Djibouti',flag:'\u{1F1E9}\u{1F1EF}',currency:'DJF',symbol:'DJF ',usdRate:177,region:'East Africa',er:.07,ee:.04,pr:.15,erL:'ONSS Employer (7%)',eeL:'ONSS Employee (4%)'},
  ER:{name:'Eritrea',flag:'\u{1F1EA}\u{1F1F7}',currency:'ERN',symbol:'ERN ',usdRate:15,region:'East Africa',er:.04,ee:.02,pr:.10,erL:'Social Insurance (4%)',eeL:'Social Insurance (2%)'},
  ET:{name:'Ethiopia',flag:'\u{1F1EA}\u{1F1F9}',currency:'ETB',symbol:'ETB ',usdRate:130,region:'East Africa',custom:1},
  KE:{name:'Kenya',flag:'\u{1F1F0}\u{1F1EA}',currency:'KES',symbol:'KSh ',usdRate:130,region:'East Africa',custom:1},
  MG:{name:'Madagascar',flag:'\u{1F1F2}\u{1F1EC}',currency:'MGA',symbol:'Ar ',usdRate:4500,region:'East Africa',er:.18,ee:.01,pr:.12,erL:'CNaPS+OSIE Employer (18%)',eeL:'CNaPS Employee (1%)'},
  MW:{name:'Malawi',flag:'\u{1F1F2}\u{1F1FC}',currency:'MWK',symbol:'MK ',usdRate:1750,region:'East Africa',er:.10,ee:.05,pr:.18,erL:'MASM Employer (10%)',eeL:'MASM Employee (5%)'},
  MU:{name:'Mauritius',flag:'\u{1F1F2}\u{1F1FA}',currency:'MUR',symbol:'Rs ',usdRate:45,region:'East Africa',er:.085,ee:.03,pr:.15,erL:'NPF+NSF Employer (8.5%)',eeL:'NPF Employee (3%)'},
  RW:{name:'Rwanda',flag:'\u{1F1F7}\u{1F1FC}',currency:'RWF',symbol:'RF ',usdRate:1250,region:'East Africa',custom:1},
  SC:{name:'Seychelles',flag:'\u{1F1F8}\u{1F1E8}',currency:'SCR',symbol:'SCR ',usdRate:14,region:'East Africa',er:.10,ee:.035,pr:.18,erL:'SPF Employer (10%)',eeL:'SPF Employee (3.5%)'},
  SO:{name:'Somalia',flag:'\u{1F1F8}\u{1F1F4}',currency:'SOS',symbol:'SOS ',usdRate:570,region:'East Africa',er:.05,ee:.03,pr:.10,erL:'Social Security (5%)',eeL:'Social Security (3%)'},
  SS:{name:'South Sudan',flag:'\u{1F1F8}\u{1F1F8}',currency:'SSP',symbol:'SSP ',usdRate:1300,region:'East Africa',er:.05,ee:.03,pr:.10,erL:'Social Security (5%)',eeL:'Social Security (3%)'},
  TZ:{name:'Tanzania',flag:'\u{1F1F9}\u{1F1FF}',currency:'TZS',symbol:'TSh ',usdRate:2500,region:'East Africa',custom:1},
  UG:{name:'Uganda',flag:'\u{1F1FA}\u{1F1EC}',currency:'UGX',symbol:'USh ',usdRate:3800,region:'East Africa',custom:1},
  // SOUTHERN AFRICA
  BW:{name:'Botswana',flag:'\u{1F1E7}\u{1F1FC}',currency:'BWP',symbol:'P',usdRate:14,region:'Southern Africa',custom:1},
  SZ:{name:'Eswatini',flag:'\u{1F1F8}\u{1F1FF}',currency:'SZL',symbol:'SZL ',usdRate:18,region:'Southern Africa',er:.052,ee:.05,pr:.15,erL:'SNPF+SDL Employer (5.2%)',eeL:'SNPF Employee (5%)'},
  LS:{name:'Lesotho',flag:'\u{1F1F1}\u{1F1F8}',currency:'LSL',symbol:'LSL ',usdRate:18,region:'Southern Africa',er:.10,ee:.06,pr:.20,erL:'LNPF Employer (10%)',eeL:'LNPF Employee (6%)'},
  MZ:{name:'Mozambique',flag:'\u{1F1F2}\u{1F1FF}',currency:'MZN',symbol:'MT ',usdRate:63,region:'Southern Africa',custom:1},
  NA:{name:'Namibia',flag:'\u{1F1F3}\u{1F1E6}',currency:'NAD',symbol:'N$',usdRate:18,region:'Southern Africa',er:.059,ee:.009,pr:.20,erL:'SS+Pension Employer (5.9%)',eeL:'SS Employee (0.9%)'},
  ZA:{name:'South Africa',flag:'\u{1F1FF}\u{1F1E6}',currency:'ZAR',symbol:'R',usdRate:18,region:'Southern Africa',custom:1},
  ZM:{name:'Zambia',flag:'\u{1F1FF}\u{1F1F2}',currency:'ZMW',symbol:'ZK ',usdRate:26,region:'Southern Africa',er:.05,ee:.05,pr:.20,erL:'NAPSA Employer (5%)',eeL:'NAPSA Employee (5%)'},
  ZW:{name:'Zimbabwe',flag:'\u{1F1FF}\u{1F1FC}',currency:'USD',symbol:'US$',usdRate:1,region:'Southern Africa',custom:1}
};

// ── SIDEBAR INFO (17 custom countries) ──
var SIDEBAR_INFO = {
  NG:'<p><strong>Pension (Employer):</strong> 10% of basic + housing + transport</p><p><strong>Pension (Employee):</strong> 8%</p><p><strong>NHF:</strong> 2.5% of basic (employee)</p><p><strong>NSITF:</strong> 1% of gross (employer)</p><p><strong>ITF:</strong> 1% of gross (employer)</p><p><strong>PAYE (NTA 2025):</strong> 0% up to \u20A6800K, then 15%-25%</p><p class="sc-info-note">NTA 2025 rates effective Jan 2026. CRA abolished, replaced with Rent Relief.</p>',
  KE:'<p><strong>NSSF (Year 4):</strong> 6% each, Tier I cap KES 9,000, Tier II cap KES 108,000</p><p><strong>SHIF:</strong> 2.75% of gross (employee)</p><p><strong>Housing Levy:</strong> 1.5% each (employer + employee)</p><p><strong>PAYE:</strong> 10%-35% progressive (5 bands)</p><p><strong>Personal Relief:</strong> KES 2,400/month</p><p class="sc-info-note">NSSF Year 4 rates effective Feb 2026. SHIF, NSSF, AHL are tax-deductible.</p>',
  ZA:'<p><strong>UIF (Employer):</strong> 1% capped at R17,712/mo</p><p><strong>UIF (Employee):</strong> 1% capped at R17,712/mo</p><p><strong>SDL:</strong> 1% of payroll (employer only)</p><p><strong>PAYE:</strong> 18%-45% progressive</p><p><strong>Primary Rebate:</strong> R17,235/year</p><p class="sc-info-note">2025/2026 tax year. Brackets unchanged from prior year.</p>',
  GH:'<p><strong>SSNIT (Employer):</strong> 13% of basic salary</p><p><strong>SSNIT (Employee):</strong> 5.5%</p><p><strong>Tier 2 Pension:</strong> 5% of basic (employer)</p><p><strong>PAYE:</strong> 0%-35% progressive</p><p><strong>SSNIT Cap:</strong> GHS 61,000/month</p><p class="sc-info-note">2025/2026 rates. Employee SSNIT deducted before PAYE.</p>',
  EG:'<p><strong>Social Insurance (Employer):</strong> 18.75% (capped)</p><p><strong>Social Insurance (Employee):</strong> 11% (capped)</p><p><strong>Ceiling:</strong> EGP 16,700/month (2026)</p><p><strong>Minimum Wage:</strong> EGP 7,000/month</p><p class="sc-info-note">Social insurance caps increase 15% annually through 2027.</p>',
  TZ:'<p><strong>NSSF (Employer):</strong> 10% of gross</p><p><strong>NSSF (Employee):</strong> 10%</p><p><strong>WCF:</strong> 0.5% (employer)</p><p><strong>SDL:</strong> 3.5% (employer, 10+ staff)</p><p><strong>PAYE:</strong> 0%-37% progressive</p><p class="sc-info-note">Employee NSSF is deductible before PAYE. SDL applies to 10+ staff.</p>',
  UG:'<p><strong>NSSF (Employer):</strong> 10% of gross</p><p><strong>NSSF (Employee):</strong> 5%</p><p><strong>PAYE:</strong> 0%-40% progressive</p><p><strong>Tax-free:</strong> UGX 235,000/month</p><p class="sc-info-note">10% surtax on monthly income above UGX 10,000,000.</p>',
  RW:'<p><strong>Pension (Employer):</strong> 6% of gross</p><p><strong>Pension (Employee):</strong> 6%</p><p><strong>Maternity:</strong> 0.3% each</p><p><strong>Occupational Hazard:</strong> 2% (employer)</p><p><strong>PAYE:</strong> 0%-30% progressive</p><p class="sc-info-note">Pension doubled to 12% total Jan 2025. Will increase 2%/year from 2027.</p>',
  ET:'<p><strong>Pension (Employer):</strong> 11% (capped at ETB 15,000)</p><p><strong>Pension (Employee):</strong> 7%</p><p><strong>PAYE:</strong> 0%-35% progressive</p><p class="sc-info-note">Pension cap is ETB 15,000/month. New tax bands effective July 2025.</p>',
  CM:'<p><strong>CNPS (Employer):</strong> ~12.5% (pension + family + accident)</p><p><strong>CNPS (Employee):</strong> 4.2% (capped at XAF 750K)</p><p><strong>Housing Fund:</strong> 1.5% (employer)</p><p><strong>FNE:</strong> 1% (employer)</p><p class="sc-info-note">Accident rate varies by industry (1.75%-5%). Ceiling: XAF 750,000/month.</p>',
  SN:'<p><strong>IPRES Pension (Employer):</strong> 8.4%</p><p><strong>Family Benefits:</strong> 7% (employer)</p><p><strong>Accident Insurance:</strong> 1%-5% (employer)</p><p><strong>Payroll Tax:</strong> 3% (employer)</p><p class="sc-info-note">Total employer cost ~20-27% on top of salary depending on industry.</p>',
  CI:'<p><strong>CNPS Retirement (Employer):</strong> 7.7%</p><p><strong>Family Allowance:</strong> 5.75% (employer)</p><p><strong>Accident Insurance:</strong> 2%-5% (employer)</p><p><strong>FDFP Training:</strong> 2% (employer)</p><p class="sc-info-note">Payroll tax: 2.8% local, 12% expatriate. CNPS ceiling: XOF 3,375,000/month.</p>',
  MA:'<p><strong>CNSS (Employer):</strong> ~20.7% total</p><p><strong>CNSS (Employee):</strong> ~6.5%</p><p><strong>Social allocation cap:</strong> MAD 6,000/month</p><p><strong>Income Tax:</strong> 0%-37% progressive</p><p class="sc-info-note">New hires may be exempt from income tax for first 36 months (until Dec 2026).</p>',
  AO:'<p><strong>INSS (Employer):</strong> 8% of gross</p><p><strong>INSS (Employee):</strong> 3%</p><p><strong>IRT (Income Tax):</strong> 0%-25% progressive</p><p class="sc-info-note">8% employer rate applies. Training levy of 1% may also apply.</p>',
  MZ:'<p><strong>INSS (Employer):</strong> 4% of gross</p><p><strong>INSS (Employee):</strong> 3%</p><p><strong>IRPS (Income Tax):</strong> 10%-32% progressive</p><p class="sc-info-note">One of the lowest employer contribution rates in Africa. No INSS cap.</p>',
  ZW:'<p><strong>NSSA (Employer):</strong> 4.5% (cap US$700/mo)</p><p><strong>NSSA (Employee):</strong> 4.5%</p><p><strong>AIDS Levy:</strong> 3% of PAYE due</p><p><strong>PAYE:</strong> 0%-40% progressive</p><p class="sc-info-note">Dual currency system (USD & ZWG). Calculator uses USD brackets.</p>',
  BW:'<p><strong>No mandatory social security</strong> (voluntary pension)</p><p><strong>PAYE:</strong> 0%-25% progressive</p><p><strong>Tax-free:</strong> BWP 48,000/year</p><p class="sc-info-note">Botswana has no mandatory employer social security contributions.</p>'
};

// ── TERMINATION DATA ──
// [notice_weeks, severance_weeks_per_year, leave_days_per_year, law_reference]
var TERM_DATA = {
  NG:[4,4,6,'Labour Act Cap L1'],KE:[4,2.14,21,'Employment Act 2007'],
  ZA:[4,1,15,'BCEA / LRA S.189'],GH:[4,2,15,'Labour Act 2003 S.65'],
  EG:[8,8,21,'Labour Law No. 12/2003'],TZ:[4,2,28,'Employment & Labour Relations Act 2004'],
  UG:[4,2,21,'Employment Act 2006'],RW:[4,2,18,'Labour Law No. 66/2018'],
  ET:[4,4,16,'Labour Proclamation 1156/2019'],CM:[4,3,18,'OHADA / Labour Code'],
  SN:[4,3,24,'OHADA Labour Code'],CI:[4,3,24,'OHADA Labour Code'],
  MA:[8,4,18,'Labour Code (Mudawwana)'],AO:[8,4,22,'General Labour Law'],
  MZ:[4,2,12,'Labour Act 23/2007'],ZW:[4,2,22,'Labour Act Cap 28:01'],
  BW:[4,1,15,'Employment Act Cap 47:01'],DZ:[4,4,30,'Labour Law 90-11'],
  TN:[4,3,18,'Labour Code'],
  _ohada:[4,3,24,'OHADA Labour Code'],_anglophone:[4,2,21,'Local Labour Act'],
  _north:[8,4,21,'Labour Code'],_southern:[4,1,15,'Local Labour Act'],
  _default:[4,2,21,'Local Labour Law']
};

// ── SECTOR ADDITIONAL COSTS ──
var SECTORS = {
  oil:[{l:'Danger Pay (8%)',r:.08},{l:'Accommodation Allowance (5%)',r:.05},{l:'Expatriate Levy (3%)',r:.03}],
  mining:[{l:'Shift Allowance (5%)',r:.05},{l:'Danger Pay (3%)',r:.03},{l:'Occupational Medical (4%)',r:.04}],
  construction:[{l:'Safety Levy (3%)',r:.03},{l:'COID Insurance (2%)',r:.02}],
  agriculture:[]
};

// ── PAYE FUNCTIONS ──

function calcNigeriaPAYE(annual, pensionDed, nhfDed, rentRelief) {
  var deductions = pensionDed + nhfDed + rentRelief;
  var taxable = Math.max(0, annual - deductions);
  var bands = [[800000,0],[2200000,.15],[4000000,.18],[13000000,.21],[30000000,.23],[Infinity,.25]];
  var tax = 0, remaining = taxable;
  for (var i = 0; i < bands.length; i++) {
    var amt = Math.min(remaining, bands[i][0]);
    tax += amt * bands[i][1]; remaining -= amt;
    if (remaining <= 0) break;
  }
  return tax;
}

function calcKenyaPAYE(monthlyTaxable) {
  var bands = [[24000,.10],[8333,.25],[467667,.30],[300000,.325],[Infinity,.35]];
  var tax = 0, remaining = monthlyTaxable;
  for (var i = 0; i < bands.length; i++) {
    var amt = Math.min(remaining, bands[i][0]);
    tax += amt * bands[i][1]; remaining -= amt;
    if (remaining <= 0) break;
  }
  return Math.max(0, tax - 2400);
}

function calcSAPAYE(annual) {
  var bands = [[237100,.18],[133400,.26],[142300,.31],[160200,.36],[184900,.39],[Infinity,.45]];
  var tax = 0, remaining = annual;
  for (var i = 0; i < bands.length; i++) {
    var amt = Math.min(remaining, bands[i][0]);
    tax += amt * bands[i][1]; remaining -= amt;
    if (remaining <= 0) break;
  }
  return Math.max(0, tax - 17235);
}

function calcGhanaPAYE(monthly) {
  var bands = [[490,0],[110,.05],[130,.10],[3166.67,.175],[16000,.25],[30520,.30],[Infinity,.35]];
  var tax = 0, remaining = monthly;
  for (var i = 0; i < bands.length; i++) {
    var amt = Math.min(remaining, bands[i][0]);
    tax += amt * bands[i][1]; remaining -= amt;
    if (remaining <= 0) break;
  }
  return tax;
}

function calcTanzaniaPAYE(monthly) {
  var bands = [[270000,0],[250000,.08],[240000,.16],[280000,.24],[2080000,.32],[Infinity,.37]];
  var tax = 0, remaining = monthly;
  for (var i = 0; i < bands.length; i++) {
    var amt = Math.min(remaining, bands[i][0]);
    tax += amt * bands[i][1]; remaining -= amt;
    if (remaining <= 0) break;
  }
  return tax;
}

function calcUgandaPAYE(monthly) {
  if (monthly <= 235000) return 0;
  var tax = 0;
  if (monthly <= 335000) tax = (monthly - 235000) * 0.10;
  else if (monthly <= 410000) tax = 10000 + (monthly - 335000) * 0.20;
  else if (monthly <= 10000000) tax = 25000 + (monthly - 410000) * 0.30;
  else tax = 25000 + (10000000 - 410000) * 0.30 + (monthly - 10000000) * 0.40;
  return tax;
}

function calcRwandaPAYE(monthly) {
  var bands = [[60000,0],[40000,.10],[100000,.20],[Infinity,.30]];
  var tax = 0, remaining = monthly;
  for (var i = 0; i < bands.length; i++) {
    var amt = Math.min(remaining, bands[i][0]);
    tax += amt * bands[i][1]; remaining -= amt;
    if (remaining <= 0) break;
  }
  return tax;
}

function calcEthiopiaPAYE(monthly) {
  var bands = [[2000,0],[2000,.15],[3000,.20],[3000,.25],[4000,.30],[Infinity,.35]];
  var tax = 0, remaining = monthly;
  for (var i = 0; i < bands.length; i++) {
    var amt = Math.min(remaining, bands[i][0]);
    tax += amt * bands[i][1]; remaining -= amt;
    if (remaining <= 0) break;
  }
  return tax;
}

function calcZimbabwePAYE(annual) {
  var bands = [[1200,0],[6000,.20],[4800,.25],[24000,.30],[Infinity,.40]];
  var tax = 0, remaining = annual;
  for (var i = 0; i < bands.length; i++) {
    var amt = Math.min(remaining, bands[i][0]);
    tax += amt * bands[i][1]; remaining -= amt;
    if (remaining <= 0) break;
  }
  return tax;
}

function calcBotswanaPAYE(annual) {
  var bands = [[48000,0],[36000,.05],[36000,.125],[36000,.1875],[Infinity,.25]];
  var tax = 0, remaining = annual;
  for (var i = 0; i < bands.length; i++) {
    var amt = Math.min(remaining, bands[i][0]);
    tax += amt * bands[i][1]; remaining -= amt;
    if (remaining <= 0) break;
  }
  return tax;
}

function bandPAYE(annual, bands) {
  var tax = 0, remaining = annual;
  for (var i = 0; i < bands.length; i++) {
    var amt = Math.min(remaining, bands[i][0]);
    tax += amt * bands[i][1]; remaining -= amt;
    if (remaining <= 0) break;
  }
  return tax;
}

// ── CUSTOM COUNTRY CALCULATION ──
// Returns {rows, employerCosts, employeeDeductions}
function calcCustom(code, gross, salary, transport, housing) {
  var rows = [], employerCosts = 0, employeeDeductions = 0;
  rows.push({item:'Gross Salary',amount:gross,type:'base'});

  if (code === 'NG') {
    var pensionBase = salary + housing + transport;
    var erPension = pensionBase * 0.10, eePension = pensionBase * 0.08;
    var nsitf = gross * 0.01, itf = gross * 0.01, nhf = salary * 0.025;
    var annualGross = gross * 12;
    var rentRelief = Math.min(annualGross * 0.20, 500000);
    var paye = calcNigeriaPAYE(annualGross, eePension * 12, nhf * 12, rentRelief) / 12;
    rows.push({item:'Employer Pension (10%)',amount:erPension,type:'employer'});
    rows.push({item:'NSITF (1%)',amount:nsitf,type:'employer'});
    rows.push({item:'ITF (1%)',amount:itf,type:'employer'});
    rows.push({item:'Employee Pension (8%)',amount:eePension,type:'employee'});
    rows.push({item:'NHF (2.5%)',amount:nhf,type:'employee'});
    rows.push({item:'PAYE Tax (NTA 2025)',amount:paye,type:'employee'});
    employerCosts = erPension + nsitf + itf;
    employeeDeductions = eePension + nhf + paye;

  } else if (code === 'KE') {
    var nssf = Math.min(gross * 0.06, 6480);
    var shif = Math.max(gross * 0.0275, 300);
    var hl = gross * 0.015;
    var taxMo = Math.max(0, gross - nssf - shif - hl);
    var paye = calcKenyaPAYE(taxMo);
    rows.push({item:'NSSF Employer (6%, max 6,480)',amount:nssf,type:'employer'});
    rows.push({item:'Housing Levy Employer (1.5%)',amount:hl,type:'employer'});
    rows.push({item:'NSSF Employee (6%, max 6,480)',amount:nssf,type:'employee'});
    rows.push({item:'SHIF (2.75%)',amount:shif,type:'employee'});
    rows.push({item:'Housing Levy Employee (1.5%)',amount:hl,type:'employee'});
    rows.push({item:'PAYE Tax',amount:paye,type:'employee'});
    employerCosts = nssf + hl;
    employeeDeductions = nssf + shif + hl + paye;

  } else if (code === 'ZA') {
    var uifCeil = 17712;
    var uif = Math.min(gross * 0.01, uifCeil * 0.01);
    var sdl = gross * 0.01;
    var paye = calcSAPAYE(gross * 12) / 12;
    rows.push({item:'UIF Employer (1%)',amount:uif,type:'employer'});
    rows.push({item:'SDL (1%)',amount:sdl,type:'employer'});
    rows.push({item:'UIF Employee (1%)',amount:uif,type:'employee'});
    rows.push({item:'PAYE Tax',amount:paye,type:'employee'});
    employerCosts = uif + sdl;
    employeeDeductions = uif + paye;

  } else if (code === 'GH') {
    var ssnitCap = 61000, ssnitBase = Math.min(salary, ssnitCap);
    var ssnit13 = ssnitBase * 0.13, tier2 = ssnitBase * 0.05, ssnit55 = ssnitBase * 0.055;
    var paye = calcGhanaPAYE(Math.max(0, gross - ssnit55));
    rows.push({item:'SSNIT Employer (13%)',amount:ssnit13,type:'employer'});
    rows.push({item:'Tier 2 Pension (5%)',amount:tier2,type:'employer'});
    rows.push({item:'SSNIT Employee (5.5%)',amount:ssnit55,type:'employee'});
    rows.push({item:'PAYE Tax',amount:paye,type:'employee'});
    employerCosts = ssnit13 + tier2;
    employeeDeductions = ssnit55 + paye;

  } else if (code === 'EG') {
    var siCeil = 16700, siBase = Math.min(gross, siCeil);
    var erSI = siBase * 0.1875, eeSI = siBase * 0.11;
    var annual = gross * 12, taxable = Math.max(0, annual - eeSI * 12);
    var egBands = [[40000,0],[15000,.10],[15000,.15],[130000,.20],[200000,.225],[200000,.25],[100000,.275],[Infinity,.275]];
    var paye = bandPAYE(taxable, egBands) / 12;
    rows.push({item:'Social Insurance Employer (18.75%)',amount:erSI,type:'employer'});
    rows.push({item:'Social Insurance Employee (11%)',amount:eeSI,type:'employee'});
    rows.push({item:'PAYE Tax (Est.)',amount:paye,type:'employee'});
    employerCosts = erSI;
    employeeDeductions = eeSI + paye;

  } else if (code === 'TZ') {
    var nssf = gross * 0.10, wcf = gross * 0.005, sdl = gross * 0.035;
    var eeNSSF = gross * 0.10;
    var paye = calcTanzaniaPAYE(Math.max(0, gross - eeNSSF));
    rows.push({item:'NSSF Employer (10%)',amount:nssf,type:'employer'});
    rows.push({item:'WCF (0.5%)',amount:wcf,type:'employer'});
    rows.push({item:'SDL (3.5%)',amount:sdl,type:'employer'});
    rows.push({item:'NSSF Employee (10%)',amount:eeNSSF,type:'employee'});
    rows.push({item:'PAYE Tax',amount:paye,type:'employee'});
    employerCosts = nssf + wcf + sdl;
    employeeDeductions = eeNSSF + paye;

  } else if (code === 'UG') {
    var erNSSF = gross * 0.10, eeNSSF = gross * 0.05;
    var paye = calcUgandaPAYE(Math.max(0, gross - eeNSSF));
    rows.push({item:'NSSF Employer (10%)',amount:erNSSF,type:'employer'});
    rows.push({item:'NSSF Employee (5%)',amount:eeNSSF,type:'employee'});
    rows.push({item:'PAYE Tax',amount:paye,type:'employee'});
    employerCosts = erNSSF;
    employeeDeductions = eeNSSF + paye;

  } else if (code === 'RW') {
    var pen = gross * 0.06, mat = gross * 0.003, occ = gross * 0.02;
    var eePen = gross * 0.06, eeMat = gross * 0.003;
    var paye = calcRwandaPAYE(Math.max(0, gross - eePen - eeMat));
    rows.push({item:'Pension Employer (6%)',amount:pen,type:'employer'});
    rows.push({item:'Maternity Employer (0.3%)',amount:mat,type:'employer'});
    rows.push({item:'Occupational Hazard (2%)',amount:occ,type:'employer'});
    rows.push({item:'Pension Employee (6%)',amount:eePen,type:'employee'});
    rows.push({item:'Maternity Employee (0.3%)',amount:eeMat,type:'employee'});
    rows.push({item:'PAYE Tax',amount:paye,type:'employee'});
    employerCosts = pen + mat + occ;
    employeeDeductions = eePen + eeMat + paye;

  } else if (code === 'ET') {
    var penCap = 15000, penBase = Math.min(gross, penCap);
    var erPen = penBase * 0.11, eePen = penBase * 0.07;
    var paye = calcEthiopiaPAYE(Math.max(0, gross - eePen));
    rows.push({item:'Pension Employer (11%)',amount:erPen,type:'employer'});
    rows.push({item:'Pension Employee (7%)',amount:eePen,type:'employee'});
    rows.push({item:'PAYE Tax',amount:paye,type:'employee'});
    employerCosts = erPen;
    employeeDeductions = eePen + paye;

  } else if (code === 'CM') {
    var cnpsCeil = 750000, cnpsBase = Math.min(gross, cnpsCeil);
    var cnpsEr = cnpsBase * 0.125, cnpsEe = cnpsBase * 0.042;
    var hf = gross * 0.015, fne = gross * 0.01;
    var paye = gross * 12 * 0.15 / 12;
    rows.push({item:'CNPS Employer (~12.5%)',amount:cnpsEr,type:'employer'});
    rows.push({item:'Housing Fund (1.5%)',amount:hf,type:'employer'});
    rows.push({item:'FNE (1%)',amount:fne,type:'employer'});
    rows.push({item:'CNPS Employee (4.2%)',amount:cnpsEe,type:'employee'});
    rows.push({item:'PAYE Tax (Est.)',amount:paye,type:'employee'});
    employerCosts = cnpsEr + hf + fne;
    employeeDeductions = cnpsEe + paye;

  } else if (code === 'SN') {
    var ipres = gross * 0.084, fam = gross * 0.07, acc = gross * 0.03, pt = gross * 0.03;
    var eeIPRES = gross * 0.056;
    var paye = gross * 12 * 0.18 / 12;
    rows.push({item:'IPRES Pension Employer (8.4%)',amount:ipres,type:'employer'});
    rows.push({item:'Family Benefits (7%)',amount:fam,type:'employer'});
    rows.push({item:'Accident Insurance (3%)',amount:acc,type:'employer'});
    rows.push({item:'Payroll Tax (3%)',amount:pt,type:'employer'});
    rows.push({item:'IPRES Employee (5.6%)',amount:eeIPRES,type:'employee'});
    rows.push({item:'PAYE Tax (Est.)',amount:paye,type:'employee'});
    employerCosts = ipres + fam + acc + pt;
    employeeDeductions = eeIPRES + paye;

  } else if (code === 'CI') {
    var cnps = gross * 0.077, fa = gross * 0.0575, ai = gross * 0.035, fdfp = gross * 0.02, prt = gross * 0.028;
    var eeCNPS = gross * 0.063;
    var paye = gross * 12 * 0.15 / 12;
    rows.push({item:'CNPS Retirement (7.7%)',amount:cnps,type:'employer'});
    rows.push({item:'Family Allowance (5.75%)',amount:fa,type:'employer'});
    rows.push({item:'Accident Insurance (3.5%)',amount:ai,type:'employer'});
    rows.push({item:'FDFP Training (2%)',amount:fdfp,type:'employer'});
    rows.push({item:'Payroll Tax (2.8%)',amount:prt,type:'employer'});
    rows.push({item:'CNPS Employee (6.3%)',amount:eeCNPS,type:'employee'});
    rows.push({item:'PAYE Tax (Est.)',amount:paye,type:'employee'});
    employerCosts = cnps + fa + ai + fdfp + prt;
    employeeDeductions = eeCNPS + paye;

  } else if (code === 'MA') {
    var cnssBase = Math.min(gross, 6000);
    var cf = gross * 0.064, cs = cnssBase * 0.086, ct = gross * 0.016, ca = gross * 0.0411;
    var eeS = cnssBase * 0.0429, eeA = gross * 0.0226;
    var maBands = [[40000,0],[20000,.10],[10000,.20],[10000,.30],[40000,.34],[Infinity,.37]];
    var paye = bandPAYE(gross * 12, maBands) / 12;
    rows.push({item:'CNSS Family (6.4%)',amount:cf,type:'employer'});
    rows.push({item:'CNSS Social (8.6%, cap 6K)',amount:cs,type:'employer'});
    rows.push({item:'CNSS Training (1.6%)',amount:ct,type:'employer'});
    rows.push({item:'AMO Employer (4.11%)',amount:ca,type:'employer'});
    rows.push({item:'CNSS Employee (4.29%, cap 6K)',amount:eeS,type:'employee'});
    rows.push({item:'AMO Employee (2.26%)',amount:eeA,type:'employee'});
    rows.push({item:'Income Tax (Est.)',amount:paye,type:'employee'});
    employerCosts = cf + cs + ct + ca;
    employeeDeductions = eeS + eeA + paye;

  } else if (code === 'AO') {
    var inssEr = gross * 0.08, inssEe = gross * 0.03;
    var taxable = Math.max(0, gross - 100000);
    var aoBands = [[50000,.10],[100000,.15],[200000,.20],[Infinity,.25]];
    var tax = bandPAYE(taxable, aoBands);
    rows.push({item:'INSS Employer (8%)',amount:inssEr,type:'employer'});
    rows.push({item:'INSS Employee (3%)',amount:inssEe,type:'employee'});
    rows.push({item:'IRT Tax (Est.)',amount:tax,type:'employee'});
    employerCosts = inssEr;
    employeeDeductions = inssEe + tax;

  } else if (code === 'MZ') {
    var inssEr = gross * 0.04, inssEe = gross * 0.03;
    var mzBands = [[42000,0],[42000,.10],[168000,.15],[504000,.20],[1512000,.25],[Infinity,.32]];
    var paye = bandPAYE(gross * 12, mzBands) / 12;
    rows.push({item:'INSS Employer (4%)',amount:inssEr,type:'employer'});
    rows.push({item:'INSS Employee (3%)',amount:inssEe,type:'employee'});
    rows.push({item:'IRPS Tax (Est.)',amount:paye,type:'employee'});
    employerCosts = inssEr;
    employeeDeductions = inssEe + paye;

  } else if (code === 'ZW') {
    var nssaCeil = 700, nssaBase = Math.min(gross, nssaCeil);
    var nssaEr = nssaBase * 0.045, nssaEe = nssaBase * 0.045;
    var paye = calcZimbabwePAYE(gross * 12) / 12;
    var aids = paye * 0.03;
    rows.push({item:'NSSA Employer (4.5%, cap $700)',amount:nssaEr,type:'employer'});
    rows.push({item:'NSSA Employee (4.5%, cap $700)',amount:nssaEe,type:'employee'});
    rows.push({item:'PAYE Tax',amount:paye,type:'employee'});
    rows.push({item:'AIDS Levy (3% of PAYE)',amount:aids,type:'employee'});
    employerCosts = nssaEr;
    employeeDeductions = nssaEe + paye + aids;

  } else if (code === 'BW') {
    var paye = calcBotswanaPAYE(gross * 12) / 12;
    rows.push({item:'PAYE Tax',amount:paye,type:'employee'});
    employerCosts = 0;
    employeeDeductions = paye;
  }

  return {rows:rows, employerCosts:employerCosts, employeeDeductions:employeeDeductions};
}

// ── GENERIC COUNTRY CALCULATION ──
function calcGeneric(code, gross) {
  var c = COUNTRIES[code];
  var rows = [{item:'Gross Salary',amount:gross,type:'base'}];
  var erCost = gross * c.er;
  var eeCost = gross * c.ee;
  rows.push({item:c.erL,amount:erCost,type:'employer'});
  rows.push({item:c.eeL,amount:eeCost,type:'employee'});
  var taxable = Math.max(0, gross - eeCost);
  var paye = taxable * c.pr;
  rows.push({item:'Income Tax (Est.)',amount:paye,type:'employee'});
  return {rows:rows, employerCosts:erCost, employeeDeductions:eeCost + paye};
}

// ── EMPLOYER BURDEN (quick calc for comparison/multi-country) ──
function calcEmployerBurden(code, gross) {
  var c = COUNTRIES[code];
  if (!c) return {er:0, total:gross};
  if (!c.custom) {
    var er = gross * c.er;
    return {er:er, total:gross + er};
  }
  var er = 0;
  if (code === 'NG') er = gross * 0.10 + gross * 0.01 + gross * 0.01;
  else if (code === 'KE') er = Math.min(gross * 0.06, 6480) + gross * 0.015;
  else if (code === 'ZA') er = Math.min(gross * 0.01, 177.12) + gross * 0.01;
  else if (code === 'GH') { var b = Math.min(gross, 61000); er = b * 0.13 + b * 0.05; }
  else if (code === 'EG') er = Math.min(gross, 16700) * 0.1875;
  else if (code === 'TZ') er = gross * 0.10 + gross * 0.005 + gross * 0.035;
  else if (code === 'UG') er = gross * 0.10;
  else if (code === 'RW') er = gross * 0.06 + gross * 0.003 + gross * 0.02;
  else if (code === 'ET') er = Math.min(gross, 15000) * 0.11;
  else if (code === 'CM') er = Math.min(gross, 750000) * 0.125 + gross * 0.015 + gross * 0.01;
  else if (code === 'SN') er = gross * (0.084 + 0.07 + 0.03 + 0.03);
  else if (code === 'CI') er = gross * (0.077 + 0.0575 + 0.035 + 0.02 + 0.028);
  else if (code === 'MA') er = gross * 0.064 + Math.min(gross, 6000) * 0.086 + gross * 0.016 + gross * 0.0411;
  else if (code === 'AO') er = gross * 0.08;
  else if (code === 'MZ') er = gross * 0.04;
  else if (code === 'ZW') er = Math.min(gross, 700) * 0.045;
  else if (code === 'BW') er = 0;
  return {er:er, total:gross + er};
}

// ── GET SIDEBAR HTML ──
function getSidebar(code) {
  if (SIDEBAR_INFO[code]) return SIDEBAR_INFO[code];
  var c = COUNTRIES[code];
  if (!c) return '';
  return '<p><strong>' + c.erL + '</strong></p>' +
    '<p><strong>' + c.eeL + '</strong></p>' +
    '<p><strong>Income Tax:</strong> ~' + (c.pr * 100).toFixed(0) + '% effective rate (estimated)</p>' +
    '<p class="sc-info-note">Rates are approximate for 2026. Consult local tax authorities for exact figures.</p>';
}

// ── GET TERMINATION DATA ──
function getTermData(code) {
  if (TERM_DATA[code]) return TERM_DATA[code];
  var c = COUNTRIES[code];
  if (!c) return TERM_DATA._default;
  var region = c.region;
  if (/West|Central/.test(region) && !c.custom) return TERM_DATA._ohada;
  if (/North/.test(region)) return TERM_DATA._north;
  if (/Southern/.test(region)) return TERM_DATA._southern;
  return TERM_DATA._default;
}

// ── FORMAT HELPERS ──
function fmt(n, code) {
  var c = null;
  var keys = Object.keys(COUNTRIES);
  for (var i = 0; i < keys.length; i++) {
    if (COUNTRIES[keys[i]].currency === code) { c = COUNTRIES[keys[i]]; break; }
  }
  return (c ? c.symbol : '') + Math.round(n).toLocaleString('en');
}

function fmtUsd(n) { return '$' + Math.round(n).toLocaleString('en'); }

// ── POPULATE COUNTRY SELECT ──
function populateCountrySelect(sel) {
  if (typeof sel === 'string') sel = document.getElementById(sel);
  if (!sel) return;
  var regions = {};
  var entries = Object.keys(COUNTRIES).map(function(k) { return [k, COUNTRIES[k]]; });
  entries.forEach(function(e) {
    var r = e[1].region;
    if (!regions[r]) regions[r] = [];
    regions[r].push(e);
  });
  var order = ['North Africa','West Africa','Central Africa','East Africa','Southern Africa'];
  order.forEach(function(r) {
    if (!regions[r]) return;
    var og = document.createElement('optgroup');
    og.label = r;
    regions[r].sort(function(a,b){return a[1].name.localeCompare(b[1].name)}).forEach(function(e) {
      var opt = document.createElement('option');
      opt.value = e[0];
      opt.textContent = e[1].flag + ' ' + e[1].name + ' (' + e[1].currency + ')';
      og.appendChild(opt);
    });
    sel.appendChild(og);
  });
}

// ── SVG DONUT CHART ──
function renderChart(container, rows, gross, employerCosts, employeeDeductions, takeHome) {
  if (!container) return;
  var employerItems = rows.filter(function(r){return r.type === 'employer'});
  var segments = [
    {label:'Take-Home Pay',value:Math.max(0,takeHome),color:'#D97706'}
  ];
  var colors = ['#ef4444','#f97316','#eab308','#ec4899','#a855f7','#6366f1','#14b8a6','#84cc16','#f43f5e'];
  employerItems.forEach(function(r,i) {
    segments.push({label:r.item,value:Math.round(r.amount),color:colors[i % colors.length]});
  });
  segments.push({label:'Employee Deductions',value:Math.round(employeeDeductions),color:'#92400E'});
  segments = segments.filter(function(s){return s.value > 0});

  var total = segments.reduce(function(a,s){return a + s.value},0);
  if (total <= 0) { container.innerHTML = ''; return; }

  var cx = 120, cy = 120, R = 100, r = 60;
  var angle = -Math.PI / 2;
  var paths = '';
  segments.forEach(function(seg) {
    var frac = seg.value / total;
    var a1 = angle, a2 = angle + frac * Math.PI * 2;
    var large = frac > 0.5 ? 1 : 0;
    var x1o = cx + R * Math.cos(a1), y1o = cy + R * Math.sin(a1);
    var x2o = cx + R * Math.cos(a2), y2o = cy + R * Math.sin(a2);
    var x1i = cx + r * Math.cos(a2), y1i = cy + r * Math.sin(a2);
    var x2i = cx + r * Math.cos(a1), y2i = cy + r * Math.sin(a1);
    paths += '<path d="M'+x1o+','+y1o+' A'+R+','+R+' 0 '+large+' 1 '+x2o+','+y2o+' L'+x1i+','+y1i+' A'+r+','+r+' 0 '+large+' 0 '+x2i+','+y2i+' Z" fill="'+seg.color+'" stroke="#fff" stroke-width="2"><title>'+seg.label+': '+(frac*100).toFixed(1)+'%</title></path>';
    angle = a2;
  });

  var multiplier = total > 0 && gross > 0 ? (total / gross).toFixed(2) : '0';
  var centerText = '<text x="'+cx+'" y="'+(cy-6)+'" text-anchor="middle" font-size="22" font-weight="800" fill="#0f172a" font-family="inherit">'+multiplier+'x</text>' +
    '<text x="'+cx+'" y="'+(cy+14)+'" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b" font-family="inherit">MULTIPLIER</text>';

  var svg = '<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">' + paths + centerText + '</svg>';
  var legend = '<div class="sc-legend">';
  segments.forEach(function(seg) {
    var pct = ((seg.value / total) * 100).toFixed(1);
    legend += '<span class="sc-legend-item"><span class="sc-legend-dot" style="background:'+seg.color+'"></span>'+seg.label+' ('+pct+'%)</span>';
  });
  legend += '</div>';
  container.innerHTML = svg + legend;
}

// ── PUBLIC API ──
return {
  COUNTRIES: COUNTRIES,
  SIDEBAR_INFO: SIDEBAR_INFO,
  TERM_DATA: TERM_DATA,
  SECTORS: SECTORS,
  parseNum: parseNum,
  calcCustom: calcCustom,
  calcGeneric: calcGeneric,
  calcEmployerBurden: calcEmployerBurden,
  getSidebar: getSidebar,
  getTermData: getTermData,
  fmt: fmt,
  fmtUsd: fmtUsd,
  populateCountrySelect: populateCountrySelect,
  renderChart: renderChart
};

})();
