/**
 * AfroTools Insurance Category — Page Generator
 * Generates all 15 tool engines + all HTML pages (index + country pages)
 * Run: node scripts/generate-insurance-pages.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── Country Lists ──
const ALL_54 = [
  {code:'NG',name:'Nigeria',slug:'nigeria',flag:'🇳🇬',region:'west_africa'},
  {code:'GH',name:'Ghana',slug:'ghana',flag:'🇬🇭',region:'west_africa'},
  {code:'SN',name:'Senegal',slug:'senegal',flag:'🇸🇳',region:'west_africa'},
  {code:'CI',name:"Côte d'Ivoire",slug:'cote-d-ivoire',flag:'🇨🇮',region:'west_africa'},
  {code:'BJ',name:'Benin',slug:'benin',flag:'🇧🇯',region:'west_africa'},
  {code:'BF',name:'Burkina Faso',slug:'burkina-faso',flag:'🇧🇫',region:'west_africa'},
  {code:'CV',name:'Cabo Verde',slug:'cabo-verde',flag:'🇨🇻',region:'west_africa'},
  {code:'GM',name:'Gambia',slug:'gambia',flag:'🇬🇲',region:'west_africa'},
  {code:'GN',name:'Guinea',slug:'guinea',flag:'🇬🇳',region:'west_africa'},
  {code:'GW',name:'Guinea-Bissau',slug:'guinea-bissau',flag:'🇬🇼',region:'west_africa'},
  {code:'LR',name:'Liberia',slug:'liberia',flag:'🇱🇷',region:'west_africa'},
  {code:'ML',name:'Mali',slug:'mali',flag:'🇲🇱',region:'west_africa'},
  {code:'MR',name:'Mauritania',slug:'mauritania',flag:'🇲🇷',region:'west_africa'},
  {code:'NE',name:'Niger',slug:'niger',flag:'🇳🇪',region:'west_africa'},
  {code:'SL',name:'Sierra Leone',slug:'sierra-leone',flag:'🇸🇱',region:'west_africa'},
  {code:'TG',name:'Togo',slug:'togo',flag:'🇹🇬',region:'west_africa'},
  {code:'KE',name:'Kenya',slug:'kenya',flag:'🇰🇪',region:'east_africa'},
  {code:'TZ',name:'Tanzania',slug:'tanzania',flag:'🇹🇿',region:'east_africa'},
  {code:'UG',name:'Uganda',slug:'uganda',flag:'🇺🇬',region:'east_africa'},
  {code:'RW',name:'Rwanda',slug:'rwanda',flag:'🇷🇼',region:'east_africa'},
  {code:'ET',name:'Ethiopia',slug:'ethiopia',flag:'🇪🇹',region:'east_africa'},
  {code:'BI',name:'Burundi',slug:'burundi',flag:'🇧🇮',region:'east_africa'},
  {code:'DJ',name:'Djibouti',slug:'djibouti',flag:'🇩🇯',region:'east_africa'},
  {code:'ER',name:'Eritrea',slug:'eritrea',flag:'🇪🇷',region:'east_africa'},
  {code:'KM',name:'Comoros',slug:'comoros',flag:'🇰🇲',region:'east_africa'},
  {code:'MG',name:'Madagascar',slug:'madagascar',flag:'🇲🇬',region:'east_africa'},
  {code:'MU',name:'Mauritius',slug:'mauritius',flag:'🇲🇺',region:'east_africa'},
  {code:'MW',name:'Malawi',slug:'malawi',flag:'🇲🇼',region:'east_africa'},
  {code:'SC',name:'Seychelles',slug:'seychelles',flag:'🇸🇨',region:'east_africa'},
  {code:'SO',name:'Somalia',slug:'somalia',flag:'🇸🇴',region:'east_africa'},
  {code:'SS',name:'South Sudan',slug:'south-sudan',flag:'🇸🇸',region:'east_africa'},
  {code:'CM',name:'Cameroon',slug:'cameroon',flag:'🇨🇲',region:'central_africa'},
  {code:'AO',name:'Angola',slug:'angola',flag:'🇦🇴',region:'central_africa'},
  {code:'CD',name:'DR Congo',slug:'dr-congo',flag:'🇨🇩',region:'central_africa'},
  {code:'CG',name:'Congo-Brazzaville',slug:'congo-brazzaville',flag:'🇨🇬',region:'central_africa'},
  {code:'CF',name:'Central African Republic',slug:'central-african-republic',flag:'🇨🇫',region:'central_africa'},
  {code:'TD',name:'Chad',slug:'chad',flag:'🇹🇩',region:'central_africa'},
  {code:'GA',name:'Gabon',slug:'gabon',flag:'🇬🇦',region:'central_africa'},
  {code:'GQ',name:'Equatorial Guinea',slug:'equatorial-guinea',flag:'🇬🇶',region:'central_africa'},
  {code:'ST',name:'São Tomé and Príncipe',slug:'sao-tome-and-principe',flag:'🇸🇹',region:'central_africa'},
  {code:'ZA',name:'South Africa',slug:'south-africa',flag:'🇿🇦',region:'southern_africa'},
  {code:'BW',name:'Botswana',slug:'botswana',flag:'🇧🇼',region:'southern_africa'},
  {code:'NA',name:'Namibia',slug:'namibia',flag:'🇳🇦',region:'southern_africa'},
  {code:'ZM',name:'Zambia',slug:'zambia',flag:'🇿🇲',region:'southern_africa'},
  {code:'ZW',name:'Zimbabwe',slug:'zimbabwe',flag:'🇿🇼',region:'southern_africa'},
  {code:'MZ',name:'Mozambique',slug:'mozambique',flag:'🇲🇿',region:'southern_africa'},
  {code:'SZ',name:'Eswatini',slug:'eswatini',flag:'🇸🇿',region:'southern_africa'},
  {code:'LS',name:'Lesotho',slug:'lesotho',flag:'🇱🇸',region:'southern_africa'},
  {code:'EG',name:'Egypt',slug:'egypt',flag:'🇪🇬',region:'north_africa'},
  {code:'MA',name:'Morocco',slug:'morocco',flag:'🇲🇦',region:'north_africa'},
  {code:'TN',name:'Tunisia',slug:'tunisia',flag:'🇹🇳',region:'north_africa'},
  {code:'DZ',name:'Algeria',slug:'algeria',flag:'🇩🇿',region:'north_africa'},
  {code:'LY',name:'Libya',slug:'libya',flag:'🇱🇾',region:'north_africa'},
  {code:'SD',name:'Sudan',slug:'sudan',flag:'🇸🇩',region:'north_africa'},
];

const TOP_15 = ALL_54.filter(c => ['NG','KE','ZA','GH','EG','ET','TZ','UG','RW','CI','CM','SN','MA','TN','AO'].includes(c.code));

const REGIONS = {west_africa:'West Africa',east_africa:'East Africa',central_africa:'Central Africa',southern_africa:'Southern Africa',north_africa:'North Africa'};
const REGION_ORDER = ['west_africa','east_africa','central_africa','southern_africa','north_africa'];

// ── Helpers ──
function mkdirp(dir) { fs.mkdirSync(dir, {recursive: true}); }
function writeFile(fp, content) {
  mkdirp(path.dirname(fp));
  fs.writeFileSync(fp, content, 'utf8');
}
function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── Tool definitions ──
const TOOLS = [
  {
    id: 'car-insurance', name: 'Car Insurance Premium Estimator', icon: '🚗',
    desc: 'Enter vehicle value, age, type, driver profile to get estimated premium ranges for third-party and comprehensive cover.',
    countries: ALL_54, engineId: 'carInsurance',
    formFields: [
      {id:'vehicleValue',label:'Vehicle Value',type:'number',placeholder:'e.g. 5000000'},
      {id:'vehicleAge',label:'Vehicle Age (years)',type:'number',placeholder:'e.g. 3'},
      {id:'vehicleType',label:'Vehicle Type',type:'select',options:['Sedan/Saloon','SUV/4x4','Pickup/Truck','Minibus/Van','Motorcycle','Commercial']},
      {id:'driverAge',label:'Driver Age',type:'number',placeholder:'e.g. 35'},
      {id:'yearsLicensed',label:'Years Licensed',type:'number',placeholder:'e.g. 10'},
      {id:'claimHistory',label:'Claims in Last 3 Years',type:'select',options:['0','1','2','3+']},
    ],
    resultFields: ['thirdPartyPremium','comprehensivePremium','excessAmount','annualSavingTip'],
    seoTitle: c => `${c.name} Car Insurance Calculator — Estimate Your Premium | AfroTools`,
    seoDesc: c => `Free car insurance premium estimator for ${c.name}. Calculate third-party and comprehensive motor insurance costs with ${c.name}'s top providers.`,
  },
  {
    id: 'health-insurance-compare', name: 'Health Insurance Plan Comparator', icon: '🏥',
    desc: 'Compare health plans side-by-side: coverage, premium, network, exclusions. Data for top providers per country.',
    countries: TOP_15, engineId: 'healthCompare',
    formFields: [
      {id:'coverType',label:'Cover Type',type:'select',options:['Individual','Family (couple)','Family (couple + children)']},
      {id:'age',label:'Primary Member Age',type:'number',placeholder:'e.g. 35'},
      {id:'dependents',label:'Number of Dependents',type:'number',placeholder:'e.g. 2'},
      {id:'budgetLevel',label:'Budget Level',type:'select',options:['Basic / Economy','Standard / Mid-Range','Premium / Comprehensive']},
      {id:'preExisting',label:'Pre-existing Conditions?',type:'select',options:['None','Mild (managed)','Significant']},
    ],
    resultFields: ['plans','monthlyPremium','annualPremium','coverageLevel'],
    seoTitle: c => `${c.name} Health Insurance Comparison — Compare Plans | AfroTools`,
    seoDesc: c => `Compare health insurance plans in ${c.name} side-by-side. Premium ranges, coverage, network hospitals, and exclusions for top HMOs and medical aid schemes.`,
  },
  {
    id: 'life-insurance-calc', name: 'Life Insurance Needs Calculator', icon: '💚',
    desc: 'How much life insurance do you need? Based on dependents, debts, income replacement years, education costs.',
    countries: TOP_15, engineId: 'lifeInsurance',
    formFields: [
      {id:'annualIncome',label:'Annual Income',type:'number',placeholder:'e.g. 3000000'},
      {id:'incomeYears',label:'Years of Income to Replace',type:'number',placeholder:'e.g. 15'},
      {id:'totalDebts',label:'Total Outstanding Debts',type:'number',placeholder:'e.g. 5000000'},
      {id:'childrenEducation',label:'Education Fund Needed',type:'number',placeholder:'e.g. 10000000'},
      {id:'funeralCost',label:'Estimated Funeral Cost',type:'number',placeholder:'e.g. 500000'},
      {id:'existingCover',label:'Existing Life Cover',type:'number',placeholder:'e.g. 0'},
      {id:'age',label:'Your Age',type:'number',placeholder:'e.g. 35'},
    ],
    resultFields: ['totalNeed','gap','estimatedPremium','termRecommendation'],
    seoTitle: c => `${c.name} Life Insurance Calculator — How Much Do You Need? | AfroTools`,
    seoDesc: c => `Calculate your life insurance needs in ${c.name}. Factor in dependents, debts, education costs, and income replacement to find the right sum assured.`,
  },
  {
    id: 'funeral-insurance', name: 'Funeral / Burial Insurance Calculator', icon: '🕯️',
    desc: 'Estimated funeral costs by country and tradition, plus funeral cover premium ranges.',
    countries: TOP_15, engineId: 'funeralInsurance',
    formFields: [
      {id:'funeralType',label:'Funeral Type',type:'select',options:['Simple / Basic','Standard / Traditional','Premium / Elaborate']},
      {id:'coverAmount',label:'Desired Cover Amount',type:'number',placeholder:'e.g. 500000'},
      {id:'age',label:'Your Age',type:'number',placeholder:'e.g. 40'},
      {id:'familyMembers',label:'Family Members to Cover',type:'number',placeholder:'e.g. 4'},
    ],
    resultFields: ['estimatedFuneralCost','monthlyPremium','annualPremium','waitingPeriod'],
    seoTitle: c => `${c.name} Funeral Insurance Calculator — Cover & Costs | AfroTools`,
    seoDesc: c => `Estimate funeral costs and funeral insurance premiums in ${c.name}. Compare funeral cover plans from top providers. Free calculator.`,
  },
  {
    id: 'travel-insurance', name: 'Travel Insurance Cost Estimator', icon: '✈️',
    desc: 'Estimated premium for African travelers by destination, duration, and coverage level.',
    countries: null, engineId: 'travelInsurance', // single page
    formFields: [
      {id:'origin',label:'Your Country',type:'countrySelect'},
      {id:'destination',label:'Destination Zone',type:'select',options:['Within Africa','Europe','North America','Asia','Worldwide']},
      {id:'duration',label:'Trip Duration (days)',type:'number',placeholder:'e.g. 14'},
      {id:'travelers',label:'Number of Travelers',type:'number',placeholder:'e.g. 2'},
      {id:'coverLevel',label:'Cover Level',type:'select',options:['Basic (medical only)','Standard (medical + baggage)','Premium (all risks + cancellation)']},
      {id:'age',label:'Age of Oldest Traveler',type:'number',placeholder:'e.g. 45'},
    ],
    resultFields: ['estimatedPremium','medicalCover','baggageCover','cancellationCover'],
    seoTitle: () => 'Travel Insurance Calculator for Africans — Estimate Your Premium | AfroTools',
    seoDesc: () => 'Free travel insurance cost estimator for African travelers. Calculate premiums for trips within Africa, to Europe, Americas, Asia or worldwide.',
  },
  {
    id: 'business-insurance', name: 'Business Insurance Estimator', icon: '🏢',
    desc: 'Estimate cover needs for SMEs: fire, theft, public liability, professional indemnity, goods in transit.',
    countries: TOP_15, engineId: 'businessInsurance',
    formFields: [
      {id:'businessType',label:'Business Type',type:'select',options:['Retail / Shop','Office / Professional','Manufacturing','Restaurant / Food','Transport / Logistics','Agriculture','Construction']},
      {id:'annualRevenue',label:'Annual Revenue',type:'number',placeholder:'e.g. 20000000'},
      {id:'propertyValue',label:'Property / Equipment Value',type:'number',placeholder:'e.g. 10000000'},
      {id:'employees',label:'Number of Employees',type:'number',placeholder:'e.g. 15'},
      {id:'stockValue',label:'Average Stock Value',type:'number',placeholder:'e.g. 5000000'},
    ],
    resultFields: ['fireInsurance','burglaryInsurance','publicLiability','totalPremium'],
    seoTitle: c => `${c.name} Business Insurance Calculator — SME Cover Estimator | AfroTools`,
    seoDesc: c => `Estimate business insurance costs in ${c.name}. Calculate fire, theft, public liability, and goods in transit premiums for your SME.`,
  },
  {
    id: 'crop-insurance-calc', name: 'Crop Insurance Calculator', icon: '🌾',
    desc: 'Premium estimates for crop insurance by region and crop type.',
    countries: TOP_15, engineId: 'cropInsuranceCalc',
    formFields: [
      {id:'cropType',label:'Crop Type',type:'select',options:['Maize / Corn','Rice','Wheat','Cassava','Sorghum','Millet','Groundnuts','Cotton','Coffee','Cocoa','Tea','Tobacco','Sugarcane','Vegetables']},
      {id:'farmSize',label:'Farm Size (hectares)',type:'number',placeholder:'e.g. 5'},
      {id:'expectedYield',label:'Expected Yield (tonnes/ha)',type:'number',placeholder:'e.g. 2.5'},
      {id:'pricePerTonne',label:'Market Price per Tonne',type:'number',placeholder:'e.g. 250000'},
      {id:'insuranceType',label:'Insurance Type',type:'select',options:['Multi-Peril Crop Insurance','Weather Index Insurance','Area Yield Index','Revenue Insurance']},
    ],
    resultFields: ['sumInsured','estimatedPremium','govSubsidy','farmerPays'],
    seoTitle: c => `${c.name} Crop Insurance Calculator — Farm Premium Estimator | AfroTools`,
    seoDesc: c => `Calculate crop insurance premiums in ${c.name}. Estimate costs for multi-peril, weather index, and area yield insurance by crop type and farm size.`,
  },
  {
    id: 'motor-third-party', name: 'Motor Vehicle Third-Party Premium', icon: '🛣️',
    desc: 'Mandatory motor insurance costs per country. What you must legally have to drive.',
    countries: ALL_54, engineId: 'motorThirdParty',
    formFields: [
      {id:'vehicleType',label:'Vehicle Type',type:'select',options:['Private Car','Commercial Vehicle','Motorcycle','Minibus / Matatu','Truck / Lorry','Bus']},
      {id:'engineCapacity',label:'Engine Capacity',type:'select',options:['Below 1000cc','1000-1500cc','1500-2000cc','2000-3000cc','Above 3000cc']},
      {id:'usage',label:'Vehicle Usage',type:'select',options:['Private','Commercial','Hire / Taxi']},
    ],
    resultFields: ['minimumPremium','maximumPremium','mandatoryStatus','regulatorInfo'],
    seoTitle: c => `${c.name} Motor Third-Party Insurance — Mandatory Premium | AfroTools`,
    seoDesc: c => `Check mandatory motor third-party insurance costs in ${c.name}. Legal requirements, minimum premiums, and what's covered under third-party liability.`,
  },
  {
    id: 'professional-indemnity', name: 'Professional Indemnity Calculator', icon: '💼',
    desc: 'For consultants, lawyers, accountants, doctors, engineers. Estimate PI cover premium.',
    countries: null, engineId: 'professionalIndemnity',
    formFields: [
      {id:'profession',label:'Profession',type:'select',options:['Lawyer / Legal','Accountant / Auditor','Doctor / Medical','Engineer / Architect','IT Consultant','Management Consultant','Insurance Broker','Estate Agent','Financial Advisor','Other Professional']},
      {id:'country',label:'Country',type:'countrySelect'},
      {id:'annualRevenue',label:'Annual Revenue / Fees',type:'number',placeholder:'e.g. 10000000'},
      {id:'coverLimit',label:'Cover Limit Required',type:'number',placeholder:'e.g. 50000000'},
      {id:'yearsExperience',label:'Years in Practice',type:'number',placeholder:'e.g. 10'},
      {id:'priorClaims',label:'Prior Claims',type:'select',options:['None','1 claim','2+ claims']},
    ],
    resultFields: ['estimatedPremium','rateApplied','excessAmount','keyExclusions'],
    seoTitle: () => 'Professional Indemnity Insurance Calculator for Africa | AfroTools',
    seoDesc: () => 'Estimate professional indemnity insurance premiums for African professionals — lawyers, doctors, accountants, engineers, consultants. Free calculator.',
  },
  {
    id: 'fire-insurance', name: 'Fire Insurance Premium Estimator', icon: '🔥',
    desc: 'Estimate fire insurance for buildings based on property value, construction type, and location.',
    countries: null, engineId: 'fireInsurance',
    formFields: [
      {id:'country',label:'Country',type:'countrySelect'},
      {id:'propertyValue',label:'Property / Building Value',type:'number',placeholder:'e.g. 50000000'},
      {id:'constructionType',label:'Construction Type',type:'select',options:['Concrete / Block (Class 1)','Mixed (concrete + wood) (Class 2)','Timber / Wood (Class 3)','Thatch / Traditional (Class 4)']},
      {id:'propertyUse',label:'Property Use',type:'select',options:['Residential','Office / Commercial','Retail / Shop','Industrial / Factory','Warehouse / Storage']},
      {id:'fireProtection',label:'Fire Protection',type:'select',options:['Full (sprinklers + alarms + extinguishers)','Partial (alarms + extinguishers)','Basic (extinguishers only)','None']},
    ],
    resultFields: ['estimatedPremium','rateApplied','sumInsured','discounts'],
    seoTitle: () => 'Fire Insurance Calculator for Africa — Building Cover Estimator | AfroTools',
    seoDesc: () => 'Estimate fire insurance premiums for buildings across Africa. Calculate based on property value, construction type, and fire protection measures.',
  },
  {
    id: 'marine-insurance', name: 'Marine / Cargo Insurance Calculator', icon: '🚢',
    desc: 'Cargo insurance premium for imports/exports based on CIF value, cargo type, and route.',
    countries: null, engineId: 'marineInsurance',
    formFields: [
      {id:'country',label:'Your Country',type:'countrySelect'},
      {id:'cifValue',label:'CIF Value of Cargo',type:'number',placeholder:'e.g. 100000'},
      {id:'cifCurrency',label:'CIF Currency',type:'select',options:['USD','EUR','GBP','Local Currency']},
      {id:'cargoType',label:'Cargo Type',type:'select',options:['Containerised (general)','Bulk (grain, ore)','Break-Bulk (palletised)','Refrigerated / Perishable','Hazardous / Chemical']},
      {id:'coverType',label:'Cover Type',type:'select',options:['ICC(A) — All Risks','ICC(B) — Named Perils','ICC(C) — Basic']},
      {id:'route',label:'Route',type:'select',options:['Intra-Africa','Africa to Europe','Africa to Asia','Africa to Americas','Worldwide']},
    ],
    resultFields: ['estimatedPremium','rateApplied','sumInsured','warRiskSurcharge'],
    seoTitle: () => 'Marine & Cargo Insurance Calculator for Africa | AfroTools',
    seoDesc: () => 'Calculate cargo insurance premiums for African imports and exports. Estimate costs by CIF value, cargo type, and shipping route.',
  },
  {
    id: 'microinsurance', name: 'Microinsurance Premium Calculator', icon: '📱',
    desc: 'Low-cost insurance for informal sector. Mobile money-linked microinsurance products.',
    countries: TOP_15, engineId: 'microinsurance',
    formFields: [
      {id:'productType',label:'Product Type',type:'select',options:['Hospital Cash','Personal Accident','Funeral Micro-Cover','Crop Micro-Insurance','Mobile Device Insurance','Health Outpatient']},
      {id:'coverAmount',label:'Cover Amount',type:'number',placeholder:'e.g. 100000'},
      {id:'paymentMethod',label:'Payment Method',type:'select',options:['Mobile Money','Bank Debit','Cash (agent)']},
      {id:'age',label:'Your Age',type:'number',placeholder:'e.g. 30'},
    ],
    resultFields: ['dailyPremium','weeklyPremium','monthlyPremium','providers'],
    seoTitle: c => `${c.name} Microinsurance Calculator — Low-Cost Cover | AfroTools`,
    seoDesc: c => `Calculate microinsurance premiums in ${c.name}. Mobile money-linked insurance for informal sector — hospital cash, personal accident, funeral cover from as low as ${c.flag}.`,
  },
  {
    id: 'claim-tracker', name: 'Insurance Claim Tracker / Checklist', icon: '📋',
    desc: 'Step-by-step checklist for filing insurance claims. Required documents, deadlines, follow-up.',
    countries: null, engineId: 'claimTracker',
    formFields: [
      {id:'claimType',label:'Type of Claim',type:'select',options:['Motor / Car Accident','Health / Medical','Life / Death Benefit','Property / Fire','Theft / Burglary','Travel','Workers Compensation','Crop / Agriculture']},
      {id:'country',label:'Country',type:'countrySelect'},
    ],
    resultFields: ['checklist','timeline','documents','tips'],
    seoTitle: () => 'Insurance Claim Checklist for Africa — Step-by-Step Guide | AfroTools',
    seoDesc: () => 'Free insurance claim tracker and checklist for African policyholders. Required documents, deadlines, and follow-up tips for motor, health, life, and property claims.',
  },
  {
    id: 'workers-comp', name: 'Workers Compensation Calculator', icon: '👷',
    desc: 'Employer-side: calculate workers compensation contributions and potential claim payouts.',
    countries: ALL_54, engineId: 'workersComp',
    formFields: [
      {id:'annualPayroll',label:'Annual Payroll',type:'number',placeholder:'e.g. 50000000'},
      {id:'employees',label:'Number of Employees',type:'number',placeholder:'e.g. 25'},
      {id:'industry',label:'Industry',type:'select',options:['Office / Admin','Retail / Hospitality','Manufacturing','Construction','Mining','Agriculture','Transport','Healthcare']},
      {id:'claimHistory',label:'Claims in Last 3 Years',type:'select',options:['0','1-2','3-5','6+']},
    ],
    resultFields: ['annualContribution','rateApplied','perEmployeeCost','claimExample'],
    seoTitle: c => `${c.name} Workers Compensation Calculator — Employer Insurance | AfroTools`,
    seoDesc: c => `Calculate workers compensation insurance contributions in ${c.name}. Estimate employer costs by industry, payroll, and number of employees.`,
  },
  {
    id: 'health-contribution', name: 'NHIF / NHIS / SHIF Contribution Calculator', icon: '🩺',
    desc: 'Country-specific health insurance contribution calculator.',
    countries: ALL_54, engineId: 'healthContribution',
    formFields: [
      {id:'grossSalary',label:'Monthly Gross Salary',type:'number',placeholder:'e.g. 250000'},
      {id:'employmentType',label:'Employment Type',type:'select',options:['Formal / Employed','Self-Employed','Voluntary Contributor']},
      {id:'familySize',label:'Family Size',type:'number',placeholder:'e.g. 4'},
    ],
    resultFields: ['employeeContribution','employerContribution','totalContribution','schemeName'],
    seoTitle: c => `${c.name} Health Insurance Contribution Calculator | AfroTools`,
    seoDesc: c => `Calculate your health insurance contributions in ${c.name}. Free NHIF, NHIS, SHIF, Mutuelle, CNAM calculator for employees and self-employed.`,
  },
];

// ── Engine Generator ──
function generateEngine(tool) {
  const id = tool.engineId;
  const ID = id.charAt(0).toUpperCase() + id.slice(1);
  return `!function(){"use strict";window.AfroTools=window.AfroTools||{};
var D=window.AfroTools.insuranceData;
window.AfroTools.${ID}Engine={
calculate:function(inputs,cc){
var cd=D&&D.countries&&D.countries[cc]?D.countries[cc]:null;
if(!cd){return{error:"Country data not available"};}
var sym=cd.symbol||"",cur=cd.currency||"";
function fmt(n){if(n==null)return sym+"0";return sym+Math.round(n).toLocaleString();}
function pct(n){return(n||0).toFixed(1)+"%";}
var r={country:cd.name,currency:cur,symbol:sym};
${getCalcBody(tool)}
return r;
}
};
}();
`;
}

function getCalcBody(tool) {
  switch(tool.id) {
    case 'car-insurance': return `
var vv=parseFloat(inputs.vehicleValue)||0;
var va=parseFloat(inputs.vehicleAge)||0;
var da=parseFloat(inputs.driverAge)||30;
var yl=parseFloat(inputs.yearsLicensed)||1;
var ch=parseInt(inputs.claimHistory)||0;
var tp=cd.motor||{};
var tpMin=tp.thirdParty?tp.thirdParty.min:5000;
var tpMax=tp.thirdParty?tp.thirdParty.max:15000;
var cmpMin=(tp.comprehensive?tp.comprehensive.rateMin:3)/100;
var cmpMax=(tp.comprehensive?tp.comprehensive.rateMax:8)/100;
var ageFactor=va>10?1.3:va>5?1.15:va>2?1:0.95;
var driverFactor=da<25?1.25:da>55?1.1:1;
var expFactor=yl<2?1.2:yl<5?1.05:0.95;
var claimFactor=ch==0?0.9:ch==1?1:ch==2?1.2:1.4;
var factor=ageFactor*driverFactor*expFactor*claimFactor;
var compLow=Math.round(vv*cmpMin*factor);
var compHigh=Math.round(vv*cmpMax*factor);
var tpLow=Math.round(tpMin*factor);
var tpHigh=Math.round(tpMax*factor);
r.thirdPartyMin=fmt(tpLow);r.thirdPartyMax=fmt(tpHigh);
r.comprehensiveMin=fmt(compLow);r.comprehensiveMax=fmt(compHigh);
r.thirdPartyMandatory=tp.thirdParty?!!tp.thirdParty.mandatory:true;
r.providers=(tp.providers||[]).join(", ");
r.excess=fmt(vv*0.01);
r.savingTip=ch==0?"Your clean record saves you ~10% (No Claim Discount).":"Consider defensive driving courses to reduce premiums.";
r.annualThirdParty=fmt((tpLow+tpHigh)/2);
r.annualComprehensive=fmt((compLow+compHigh)/2);`;

    case 'health-insurance-compare': return `
var ct=inputs.coverType||"Individual";
var age=parseFloat(inputs.age)||35;
var deps=parseInt(inputs.dependents)||0;
var bl=inputs.budgetLevel||"Standard / Mid-Range";
var hp=cd.health||{};
var prem=hp.premium||{individual:{min:50000,max:250000},family:{min:150000,max:800000}};
var isFamily=ct.indexOf("Family")>=0;
var base=isFamily?prem.family:prem.individual;
var bMin=base.min||50000;var bMax=base.max||250000;
var ageFactor=age>55?1.4:age>45?1.2:age>35?1.05:1;
var blFactor=bl.indexOf("Basic")>=0?0.6:bl.indexOf("Premium")>=0?1.5:1;
var depFactor=1+deps*0.15;
var preEx=inputs.preExisting||"None";
var preFactor=preEx=="None"?1:preEx.indexOf("Mild")>=0?1.15:1.35;
var low=Math.round(bMin*ageFactor*blFactor*depFactor*preFactor);
var high=Math.round(bMax*ageFactor*blFactor*depFactor*preFactor);
r.annualPremiumMin=fmt(low);r.annualPremiumMax=fmt(high);
r.monthlyPremiumMin=fmt(Math.round(low/12));r.monthlyPremiumMax=fmt(Math.round(high/12));
r.schemeName=hp.scheme||"Private Health Insurance";
r.schemeContribution=hp.contribution?hp.contribution.rate+" "+hp.contribution.unit:"Varies";
r.providers=(hp.hmos||[]).join(", ");
r.coverLevel=bl;
r.plans=[];
var hmos=hp.hmos||[];
for(var i=0;i<Math.min(hmos.length,5);i++){
  var spread=high-low;var pLow=low+Math.round(spread*i*0.15);var pHigh=pLow+Math.round(spread*0.3);
  r.plans.push({name:hmos[i],annualMin:fmt(pLow),annualMax:fmt(pHigh),monthlyMin:fmt(Math.round(pLow/12)),monthlyMax:fmt(Math.round(pHigh/12))});
}`;

    case 'life-insurance-calc': return `
var inc=parseFloat(inputs.annualIncome)||0;
var yrs=parseFloat(inputs.incomeYears)||10;
var debts=parseFloat(inputs.totalDebts)||0;
var edu=parseFloat(inputs.childrenEducation)||0;
var fun=parseFloat(inputs.funeralCost)||0;
var exist=parseFloat(inputs.existingCover)||0;
var age=parseFloat(inputs.age)||35;
var totalNeed=inc*yrs+debts+edu+fun;
var gap=Math.max(0,totalNeed-exist);
var lf=cd.life||{};
var tpm=lf.termPerMillion||{min:2000,max:8000};
var ageFactor=age>55?2.5:age>45?1.8:age>35?1.3:1;
var millions=gap/1000000;
var premLow=Math.round(millions*tpm.min*ageFactor);
var premHigh=Math.round(millions*tpm.max*ageFactor);
r.totalNeed=fmt(totalNeed);r.existingCover=fmt(exist);r.gap=fmt(gap);
r.estimatedPremiumMin=fmt(premLow);r.estimatedPremiumMax=fmt(premHigh);
r.monthlyPremiumMin=fmt(Math.round(premLow/12));r.monthlyPremiumMax=fmt(Math.round(premHigh/12));
r.incomeReplacement=fmt(inc*yrs);r.debtCover=fmt(debts);r.educationFund=fmt(edu);
r.termRecommendation=yrs<=10?"10-year term":yrs<=20?"20-year term":"25-30 year term or whole life";
r.groupLifeRate=lf.groupLifeRate?pct(lf.groupLifeRate.min)+" - "+pct(lf.groupLifeRate.max):"0.5% - 2% of payroll";`;

    case 'funeral-insurance': return `
var ft=inputs.funeralType||"Standard / Traditional";
var ca=parseFloat(inputs.coverAmount)||0;
var age=parseFloat(inputs.age)||40;
var fm=parseInt(inputs.familyMembers)||1;
var lf=cd.life||{};var fu=lf.funeral||{monthlyMin:1000,monthlyMax:5000,coverMin:200000,coverMax:2000000};
var costFactor=ft.indexOf("Simple")>=0?0.6:ft.indexOf("Premium")>=0?1.8:1;
var avgCost=(fu.coverMin+fu.coverMax)/2*costFactor;
if(ca<=0)ca=avgCost;
var ageFactor=age>60?2:age>50?1.5:age>40?1.2:1;
var memFactor=1+(fm-1)*0.3;
var monthlyLow=Math.round(fu.monthlyMin*ageFactor*memFactor*(ca/fu.coverMin));
var monthlyHigh=Math.round(fu.monthlyMax*ageFactor*memFactor*(ca/fu.coverMax));
r.estimatedFuneralCost=fmt(avgCost);
r.coverAmount=fmt(ca);
r.monthlyPremiumMin=fmt(monthlyLow);r.monthlyPremiumMax=fmt(monthlyHigh);
r.annualPremiumMin=fmt(monthlyLow*12);r.annualPremiumMax=fmt(monthlyHigh*12);
r.waitingPeriod="6-12 months (natural death); immediate for accidental death";
r.familyMembers=fm;`;

    case 'travel-insurance': return `
var dest=inputs.destination||"Within Africa";
var dur=parseFloat(inputs.duration)||7;
var trav=parseInt(inputs.travelers)||1;
var cl=inputs.coverLevel||"Standard (medical + baggage)";
var age=parseFloat(inputs.age)||35;
var tz=D.travelZones||{};
var zone=dest.indexOf("Africa")>=0?tz.intraAfrica:dest.indexOf("Europe")>=0?tz.toEurope:dest.indexOf("America")>=0?tz.toNorthAmerica:dest.indexOf("Asia")>=0?tz.toAsia:tz.worldwide;
if(!zone)zone={daily:{min:5,max:15},currency:"USD"};
var clFactor=cl.indexOf("Basic")>=0?0.7:cl.indexOf("Premium")>=0?1.6:1;
var ageFactor=age>65?2:age>55?1.5:age>45?1.2:1;
var low=Math.round(zone.daily.min*dur*trav*clFactor*ageFactor);
var high=Math.round(zone.daily.max*dur*trav*clFactor*ageFactor);
r.estimatedPremiumMin="$"+low;r.estimatedPremiumMax="$"+high;
r.dailyRateMin="$"+zone.daily.min;r.dailyRateMax="$"+zone.daily.max;
r.medicalCover=cl.indexOf("Basic")>=0?"$10,000-$25,000":cl.indexOf("Premium")>=0?"$100,000-$500,000":"$25,000-$100,000";
r.baggageCover=cl.indexOf("Basic")>=0?"Not included":"$500-$2,000";
r.cancellationCover=cl.indexOf("Premium")>=0?"Up to trip cost":"Not included";
r.destination=dest;r.duration=dur+" days";r.travelers=trav;`;

    case 'business-insurance': return `
var bt=inputs.businessType||"Office / Professional";
var rev=parseFloat(inputs.annualRevenue)||0;
var pv=parseFloat(inputs.propertyValue)||0;
var emp=parseInt(inputs.employees)||1;
var sv=parseFloat(inputs.stockValue)||0;
var bi=cd.business||{};
var fr=bi.fireRate||{min:0.1,max:0.5};
var br=bi.burglaryRate||{min:0.4,max:1.5};
var plr=bi.publicLiabilityRate||{min:0.25,max:0.8};
var pir=bi.professionalIndemnityRate||{min:0.8,max:3};
var gtr=bi.goodsInTransitRate||{min:0.4,max:1.2};
var riskFactor=bt.indexOf("Construction")>=0||bt.indexOf("Manufacturing")>=0?1.4:bt.indexOf("Retail")>=0||bt.indexOf("Restaurant")>=0?1.15:1;
var fireLow=Math.round(pv*fr.min/100*riskFactor);var fireHigh=Math.round(pv*fr.max/100*riskFactor);
var burgLow=Math.round((pv+sv)*br.min/100*riskFactor);var burgHigh=Math.round((pv+sv)*br.max/100*riskFactor);
var plLow=Math.round(rev*plr.min/100);var plHigh=Math.round(rev*plr.max/100);
var piLow=Math.round(rev*pir.min/100);var piHigh=Math.round(rev*pir.max/100);
var gtLow=Math.round(sv*gtr.min/100);var gtHigh=Math.round(sv*gtr.max/100);
var totalLow=fireLow+burgLow+plLow;var totalHigh=fireHigh+burgHigh+plHigh;
r.firePremiumMin=fmt(fireLow);r.firePremiumMax=fmt(fireHigh);
r.burglaryPremiumMin=fmt(burgLow);r.burglaryPremiumMax=fmt(burgHigh);
r.publicLiabilityMin=fmt(plLow);r.publicLiabilityMax=fmt(plHigh);
r.professionalIndemnityMin=fmt(piLow);r.professionalIndemnityMax=fmt(piHigh);
r.goodsInTransitMin=fmt(gtLow);r.goodsInTransitMax=fmt(gtHigh);
r.totalPremiumMin=fmt(totalLow);r.totalPremiumMax=fmt(totalHigh);
r.monthlyMin=fmt(Math.round(totalLow/12));r.monthlyMax=fmt(Math.round(totalHigh/12));`;

    case 'crop-insurance-calc': return `
var ct=inputs.cropType||"Maize / Corn";
var fs=parseFloat(inputs.farmSize)||1;
var ey=parseFloat(inputs.expectedYield)||2;
var ppt=parseFloat(inputs.pricePerTonne)||250000;
var it=inputs.insuranceType||"Multi-Peril Crop Insurance";
var sumInsured=fs*ey*ppt;
var baseRate=it.indexOf("Multi-Peril")>=0?5:it.indexOf("Weather")>=0?3.5:it.indexOf("Area")>=0?3:4;
var grossPrem=Math.round(sumInsured*baseRate/100);
var govSub=Math.round(grossPrem*0.4);
var farmerPays=grossPrem-govSub;
r.sumInsured=fmt(sumInsured);r.grossPremium=fmt(grossPrem);
r.govSubsidy=fmt(govSub);r.farmerPays=fmt(farmerPays);
r.premiumRate=pct(baseRate);r.subsidyRate="40%";
r.perHectare=fmt(Math.round(farmerPays/fs));
r.scenarios=[];
[25,50,75,100].forEach(function(l){r.scenarios.push({lossPct:l+"%",payout:fmt(Math.round(sumInsured*l/100))});});`;

    case 'motor-third-party': return `
var vt=inputs.vehicleType||"Private Car";
var ec=inputs.engineCapacity||"1500-2000cc";
var us=inputs.usage||"Private";
var tp=cd.motor?cd.motor.thirdParty:{min:5000,max:15000,mandatory:true};
var tpMin=tp.min||5000;var tpMax=tp.max||15000;
var vtFactor=vt.indexOf("Motorcycle")>=0?0.5:vt.indexOf("Truck")>=0||vt.indexOf("Bus")>=0?2:vt.indexOf("Minibus")>=0?1.5:vt.indexOf("Commercial")>=0?1.3:1;
var ecFactor=ec.indexOf("Below 1000")>=0?0.7:ec.indexOf("1000-1500")>=0?0.85:ec.indexOf("2000-3000")>=0?1.15:ec.indexOf("Above 3000")>=0?1.3:1;
var usFactor=us.indexOf("Commercial")>=0?1.3:us.indexOf("Hire")>=0||us.indexOf("Taxi")>=0?1.5:1;
var factor=vtFactor*ecFactor*usFactor;
r.minimumPremium=fmt(Math.round(tpMin*factor));
r.maximumPremium=fmt(Math.round(tpMax*factor));
r.mandatoryStatus=tp.mandatory!==false?"Mandatory by law":"Not mandatory for private vehicles";
r.regulator=cd.regulator||"National Insurance Regulator";
r.providers=(cd.motor&&cd.motor.providers||[]).join(", ");
r.notes=tp.notes||"Motor third-party liability insurance is legally required to drive on public roads.";`;

    case 'professional-indemnity': return `
var prof=inputs.profession||"Other Professional";
var rev=parseFloat(inputs.annualRevenue)||0;
var cl=parseFloat(inputs.coverLimit)||0;
var ye=parseFloat(inputs.yearsExperience)||5;
var pc=inputs.priorClaims||"None";
var bi=cd.business||{};
var pir=bi.professionalIndemnityRate||{min:0.8,max:3};
var profFactor=prof.indexOf("Doctor")>=0||prof.indexOf("Medical")>=0?1.5:prof.indexOf("Lawyer")>=0?1.3:prof.indexOf("Engineer")>=0||prof.indexOf("Architect")>=0?1.2:1;
var expFactor=ye>15?0.85:ye>10?0.9:ye>5?1:1.15;
var claimFactor=pc=="None"?0.9:pc.indexOf("1")>=0?1.2:1.5;
var base=cl>0?cl:rev*3;
var premLow=Math.round(base*pir.min/100*profFactor*expFactor*claimFactor);
var premHigh=Math.round(base*pir.max/100*profFactor*expFactor*claimFactor);
r.estimatedPremiumMin=fmt(premLow);r.estimatedPremiumMax=fmt(premHigh);
r.monthlyMin=fmt(Math.round(premLow/12));r.monthlyMax=fmt(Math.round(premHigh/12));
r.rateApplied=pct(pir.min)+" - "+pct(pir.max);
r.coverLimit=fmt(base);
r.excess=fmt(Math.round(base*0.02));`;

    case 'fire-insurance': return `
var pv=parseFloat(inputs.propertyValue)||0;
var ct=inputs.constructionType||"Concrete / Block (Class 1)";
var pu=inputs.propertyUse||"Residential";
var fp=inputs.fireProtection||"Basic (extinguishers only)";
var bi=cd.business||{};
var fr=bi.fireRate||{min:0.1,max:0.5};
var ctFactor=ct.indexOf("Class 1")>=0||ct.indexOf("Concrete")>=0?0.8:ct.indexOf("Class 2")>=0||ct.indexOf("Mixed")>=0?1:ct.indexOf("Class 3")>=0||ct.indexOf("Timber")>=0?1.5:2;
var puFactor=pu.indexOf("Industrial")>=0||pu.indexOf("Factory")>=0?1.5:pu.indexOf("Warehouse")>=0?1.3:pu.indexOf("Retail")>=0?1.1:pu.indexOf("Office")>=0?1:0.85;
var fpDiscount=fp.indexOf("Full")>=0?0.75:fp.indexOf("Partial")>=0?0.85:fp.indexOf("Basic")>=0?0.95:1.1;
var premLow=Math.round(pv*fr.min/100*ctFactor*puFactor*fpDiscount);
var premHigh=Math.round(pv*fr.max/100*ctFactor*puFactor*fpDiscount);
r.estimatedPremiumMin=fmt(premLow);r.estimatedPremiumMax=fmt(premHigh);
r.monthlyMin=fmt(Math.round(premLow/12));r.monthlyMax=fmt(Math.round(premHigh/12));
r.rateApplied=pct(fr.min*ctFactor*puFactor*fpDiscount)+" - "+pct(fr.max*ctFactor*puFactor*fpDiscount);
r.sumInsured=fmt(pv);
r.discount=fpDiscount<1?Math.round((1-fpDiscount)*100)+"% fire protection discount":"No discount — consider installing fire protection";`;

    case 'marine-insurance': return `
var cv=parseFloat(inputs.cifValue)||0;
var ct=inputs.cargoType||"Containerised (general)";
var cvt=inputs.coverType||"ICC(A) — All Risks";
var rt=inputs.route||"Intra-Africa";
var mr=D.marineRates||{};
var typeRates=ct.indexOf("Container")>=0?mr.containerised:ct.indexOf("Bulk")>=0?mr.bulk:ct.indexOf("Break")>=0?mr.breakBulk:ct.indexOf("Refriger")>=0?mr.refrigerated:mr.hazardous;
if(!typeRates)typeRates={rateMin:0.3,rateMax:0.8};
var coverFactor=cvt.indexOf("ICC(A)")>=0?1.3:cvt.indexOf("ICC(B)")>=0?1:0.7;
var routeFactor=rt.indexOf("Intra-Africa")>=0?1.1:rt.indexOf("Europe")>=0?1:rt.indexOf("Asia")>=0?1.05:rt.indexOf("America")>=0?1.1:1.15;
var warRisk=rt.indexOf("Intra-Africa")>=0?0.05:0.02;
var premLow=Math.round(cv*typeRates.rateMin/100*coverFactor*routeFactor);
var premHigh=Math.round(cv*typeRates.rateMax/100*coverFactor*routeFactor);
var warSurcharge=Math.round(cv*warRisk/100);
r.estimatedPremiumMin=fmt(premLow+warSurcharge);r.estimatedPremiumMax=fmt(premHigh+warSurcharge);
r.basePremiumMin=fmt(premLow);r.basePremiumMax=fmt(premHigh);
r.warRiskSurcharge=fmt(warSurcharge);
r.rateApplied=pct(typeRates.rateMin*coverFactor*routeFactor)+" - "+pct(typeRates.rateMax*coverFactor*routeFactor);
r.sumInsured=fmt(cv*1.1);r.cifValue=fmt(cv);`;

    case 'microinsurance': return `
var pt=inputs.productType||"Hospital Cash";
var ca=parseFloat(inputs.coverAmount)||0;
var age=parseFloat(inputs.age)||30;
var mi=cd.micro||{};
var minPrem=mi.minPremium||500;
var mobileLinked=mi.mobileLinked||false;
var providers=mi.providers||[];
var ageFactor=age>50?1.3:age>40?1.1:1;
var ptFactor=pt.indexOf("Hospital")>=0?1:pt.indexOf("Accident")>=0?0.8:pt.indexOf("Funeral")>=0?0.9:pt.indexOf("Crop")>=0?1.2:pt.indexOf("Device")>=0?1.5:0.7;
var monthlyPrem=Math.max(minPrem,Math.round(ca*0.003*ageFactor*ptFactor));
r.monthlyPremium=fmt(monthlyPrem);
r.weeklyPremium=fmt(Math.round(monthlyPrem/4));
r.dailyPremium=fmt(Math.round(monthlyPrem/30));
r.annualPremium=fmt(monthlyPrem*12);
r.coverAmount=fmt(ca||Math.round(monthlyPrem*200));
r.mobileLinked=mobileLinked?"Yes — pay via mobile money":"Cash or bank payment";
r.providers=providers.length?providers.join(", "):"Contact local insurance agents";
r.productType=pt;`;

    case 'claim-tracker': return `
var ct=inputs.claimType||"Motor / Car Accident";
var checklists={
"Motor / Car Accident":["Police report / accident report","Photos of damage and accident scene","Driver's license copy","Vehicle registration / insurance certificate","Repair estimate from approved garage","Completed claim form from insurer","Witness statements (if available)","Medical report (if injuries)"],
"Health / Medical":["Hospital discharge summary","Doctor's report and diagnosis","Itemized hospital bill / receipts","Insurance card / membership number","Completed claim form","Prescription copies","Lab test results","Referral letter (if specialist)"],
"Life / Death Benefit":["Certified death certificate","Policy document","Claimant's ID / passport","Proof of relationship to deceased","Completed claim form","Bank details for payout","Medical report (cause of death)","Police report (if unnatural death)"],
"Property / Fire":["Fire brigade report","Police report","Photos of damage","Property ownership documents","List of damaged/lost items with values","Insurance policy document","Completed claim form","Repair / replacement quotes"],
"Theft / Burglary":["Police report (case number)","List of stolen items with values","Photos of break-in / damage","Insurance policy document","Proof of ownership (receipts)","Completed claim form","Security report (if applicable)"],
"Travel":["Travel itinerary / tickets","Medical receipts (if medical claim)","Police report (if theft)","Baggage irregularity report (airline)","Completed claim form","Insurance policy / certificate","Proof of expenses","Cancellation confirmation (if trip cancelled)"],
"Workers Compensation":["Employer's incident report","Medical report / certificate","Employee's statement","Witness statements","Completed WC claim form","Payslips (last 3 months)","Employment contract","Photos of injury / incident"],
"Crop / Agriculture":["Crop assessment report","Weather data / reports","Farm records (planting dates, inputs)","Insurance policy document","Photos of crop damage","Completed claim form","GPS coordinates of farm","Harvest records (if partial loss)"]
};
var timelines={
"Motor / Car Accident":"Report within 48 hours. Claim processed in 2-6 weeks.",
"Health / Medical":"Submit within 30-90 days of treatment. Processing: 1-4 weeks.",
"Life / Death Benefit":"Submit within 6 months of death. Processing: 4-12 weeks.",
"Property / Fire":"Report within 24-48 hours. Assessment in 1-2 weeks. Settlement: 4-8 weeks.",
"Theft / Burglary":"Report to police immediately. Insurer within 48 hours. Processing: 3-6 weeks.",
"Travel":"Report within 24 hours if possible. Submit claim within 30 days of return.",
"Workers Compensation":"Report within 7 days. Medical assessment required. Processing: 4-12 weeks.",
"Crop / Agriculture":"Report at first sign of loss. Assessment before harvest. Processing: 4-8 weeks."
};
r.checklist=checklists[ct]||checklists["Motor / Car Accident"];
r.timeline=timelines[ct]||"Report promptly. Processing typically 2-8 weeks.";
r.claimType=ct;
r.tips=["Keep copies of ALL documents submitted","Follow up weekly by phone and email","Get claim reference number at filing","Note names of all staff you speak to","Request written acknowledgment of claim receipt"];`;

    case 'workers-comp': return `
var ap=parseFloat(inputs.annualPayroll)||0;
var emp=parseInt(inputs.employees)||1;
var ind=inputs.industry||"Office / Admin";
var ch=inputs.claimHistory||"0";
var wc=cd.workers||{};
var rateMin=wc.rate?wc.rate.min:1;
var rateMax=wc.rate?wc.rate.max:3.5;
var indFactor=ind.indexOf("Mining")>=0?2.5:ind.indexOf("Construction")>=0?2:ind.indexOf("Manufacturing")>=0?1.5:ind.indexOf("Transport")>=0?1.3:ind.indexOf("Agriculture")>=0?1.2:ind.indexOf("Healthcare")>=0?1.1:ind.indexOf("Retail")>=0?1:0.7;
var claimFactor=ch=="0"?0.9:ch.indexOf("1-2")>=0?1.1:ch.indexOf("3-5")>=0?1.3:1.5;
var contribLow=Math.round(ap*rateMin/100*indFactor*claimFactor);
var contribHigh=Math.round(ap*rateMax/100*indFactor*claimFactor);
r.annualContributionMin=fmt(contribLow);r.annualContributionMax=fmt(contribHigh);
r.monthlyContributionMin=fmt(Math.round(contribLow/12));r.monthlyContributionMax=fmt(Math.round(contribHigh/12));
r.perEmployeeMin=fmt(Math.round(contribLow/emp));r.perEmployeeMax=fmt(Math.round(contribHigh/emp));
r.rateApplied=pct(rateMin*indFactor*claimFactor)+" - "+pct(rateMax*indFactor*claimFactor);
r.basis=wc.basis||"annual payroll";
r.regulator=cd.regulator||"Insurance Regulator";`;

    case 'health-contribution': return `
var gs=parseFloat(inputs.grossSalary)||0;
var et=inputs.employmentType||"Formal / Employed";
var hp=cd.health||{};
var sch=hp.scheme||"None";
var cont=hp.contribution||{rate:0,unit:"N/A"};
var rate=parseFloat(cont.rate)||0;
var empCont=0,erCont=0;
if(rate>0&&rate<100){
  empCont=Math.round(gs*rate/100);
  erCont=Math.round(gs*rate*1.5/100);
} else if(rate>=100){
  empCont=rate;erCont=0;
}
if(et.indexOf("Self")>=0){erCont=0;empCont=empCont||Math.round(gs*0.03);}
r.schemeName=sch;r.contributionBasis=cont.unit||"N/A";
r.employeeContribution=fmt(empCont);r.employerContribution=fmt(erCont);
r.totalContribution=fmt(empCont+erCont);
r.monthlyTotal=fmt(empCont+erCont);
r.annualTotal=fmt((empCont+erCont)*12);
r.providers=(hp.hmos||[]).join(", ");
r.mandatory=(rate>0)?"Mandatory":"Voluntary";`;

    default: return `r.error="Calculator not implemented";`;
  }
}

// ── HTML Generators ──

function hubPage(tool) {
  const countries = tool.countries || [];
  const grouped = {};
  REGION_ORDER.forEach(r => { grouped[r] = []; });
  countries.forEach(c => { if(grouped[c.region]) grouped[c.region].push(c); });

  const countryCards = REGION_ORDER.map(r => {
    if (!grouped[r].length) return '';
    return `<div class="ins-region"><div class="ins-region-label">${REGIONS[r]}</div><div class="ins-country-grid">${
      grouped[r].map(c => `<a href="/tools/${tool.id}/${c.slug}" class="ins-country-card"><span class="flag">${c.flag}</span><span class="name">${esc(c.name)}</span><span class="arrow">&rarr;</span></a>`).join('')
    }</div></div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(tool.name)} — ${countries.length} African Countries | AfroTools</title>
<meta name="description" content="${esc(tool.desc)} Free calculator for ${countries.length} African countries.">
<link rel="canonical" href="https://afrotools.com/tools/${tool.id}/">
<meta property="og:title" content="${esc(tool.name)} — AfroTools">
<meta property="og:description" content="${esc(tool.desc)}">
<meta property="og:url" content="https://afrotools.com/tools/${tool.id}/">
<meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"CollectionPage","name":"${esc(tool.name)}","description":"${esc(tool.desc)}","url":"https://afrotools.com/tools/${tool.id}/","provider":{"@type":"Organization","name":"AfroTools","url":"https://afrotools.com"},"numberOfItems":${countries.length}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://afrotools.com/"},{"@type":"ListItem","position":2,"name":"Insurance","item":"https://afrotools.com/insurance/"},{"@type":"ListItem","position":3,"name":"${esc(tool.name)}","item":"https://afrotools.com/tools/${tool.id}/"}]}</script>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/insurance.css">
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',system-ui,sans-serif;background:#F8FAFD;color:#0f172a;-webkit-font-smoothing:antialiased}a{text-decoration:none;color:inherit}</style>
</head>
<body>
<afro-navbar theme="dark" active="insurance"></afro-navbar>
<section class="ins-hero"><div class="ins-hero-inner">
<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> <span>›</span> <a href="/insurance/">Insurance</a> <span>›</span> ${esc(tool.name)}</nav>
<h1>${tool.icon} <em>${esc(tool.name)}</em></h1>
<p>${esc(tool.desc)}</p>
<div class="ins-badges"><span class="ins-badge">${tool.icon} ${countries.length} Countries</span><span class="ins-badge">&#x1f4b0; Free</span></div>
</div></section>
<main class="ins-main">
<p style="text-align:center;color:#6b7280;margin-bottom:1rem;font-size:.9rem">Select your country to get started:</p>
${countryCards}
</main>
<afro-footer></afro-footer>
</body>
</html>`;
}

function singlePage(tool) {
  return countryPage(tool, null);
}

function countryPage(tool, country) {
  const isSingle = !country;
  const c = country || {code:'',name:'Africa',slug:'',flag:'🌍'};
  const title = isSingle ? tool.seoTitle(c) : tool.seoTitle(c);
  const desc = isSingle ? tool.seoDesc(c) : tool.seoDesc(c);
  const canonical = isSingle ? `https://afrotools.com/tools/${tool.id}/` : `https://afrotools.com/tools/${tool.id}/${c.slug}`;
  const breadcrumb = isSingle
    ? `<a href="/">Home</a> <span>›</span> <a href="/insurance/">Insurance</a> <span>›</span> ${esc(tool.name)}`
    : `<a href="/">Home</a> <span>›</span> <a href="/insurance/">Insurance</a> <span>›</span> <a href="/tools/${tool.id}/">${esc(tool.name)}</a> <span>›</span> ${esc(c.name)}`;
  const h1Text = isSingle ? `${tool.icon} <em>${esc(tool.name)}</em>` : `${c.flag} ${esc(c.name)} <em>${esc(tool.name)}</em>`;
  const ccLine = isSingle ? `var CC=null;` : `var CC='${c.code}';`;

  // Build form HTML
  let formHtml = '';
  tool.formFields.forEach(f => {
    if (f.type === 'countrySelect') {
      if (isSingle) {
        formHtml += `<div class="ins-field"><label class="ins-f-label" for="${f.id}">${f.label}</label><select class="ins-f-select" id="${f.id}"></select></div>`;
      }
      // skip for country pages - country is fixed
    } else if (f.type === 'select') {
      const opts = f.options.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('');
      formHtml += `<div class="ins-field"><label class="ins-f-label" for="${f.id}">${f.label}</label><select class="ins-f-select" id="${f.id}">${opts}</select></div>`;
    } else {
      formHtml += `<div class="ins-field"><label class="ins-f-label" for="${f.id}">${f.label}</label><input class="ins-f-input" type="${f.type}" id="${f.id}" placeholder="${f.placeholder||''}" inputmode="${f.type==='number'?'numeric':'text'}"></div>`;
    }
  });

  // Build results HTML based on tool type
  const resultsHtml = getResultsHtml(tool);

  const breadcrumbSchema = isSingle
    ? `[{"@type":"ListItem","position":1,"name":"Home","item":"https://afrotools.com/"},{"@type":"ListItem","position":2,"name":"Insurance","item":"https://afrotools.com/insurance/"},{"@type":"ListItem","position":3,"name":"${esc(tool.name)}","item":"${canonical}"}]`
    : `[{"@type":"ListItem","position":1,"name":"Home","item":"https://afrotools.com/"},{"@type":"ListItem","position":2,"name":"Insurance","item":"https://afrotools.com/insurance/"},{"@type":"ListItem","position":3,"name":"${esc(tool.name)}","item":"https://afrotools.com/tools/${tool.id}/"},{"@type":"ListItem","position":4,"name":"${esc(c.name)}","item":"${canonical}"}]`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"${esc(title)}","description":"${esc(desc)}","url":"${canonical}","applicationCategory":"FinanceApplication","provider":{"@type":"Organization","name":"AfroTools","url":"https://afrotools.com"},"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":${breadcrumbSchema}}</script>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/tokens.min.css"><link rel="stylesheet" href="/assets/css/global.min.css"><link rel="stylesheet" href="/assets/css/insurance.css">
<script src="/assets/js/components/navbar.min.js" defer></script><script src="/assets/js/components/footer.min.js" defer></script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',system-ui,sans-serif;background:#F8FAFD;color:#0f172a;-webkit-font-smoothing:antialiased}a{text-decoration:none;color:inherit}</style>
</head>
<body>
<afro-navbar theme="dark" active="insurance"></afro-navbar>
<section class="ins-tool-hero"><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb">${breadcrumb}</nav>
<h1>${h1Text}</h1>
<p class="ins-tool-hero-sub">${esc(desc)}</p>
</div></section>
<main class="ins-main">
<div class="ins-card"><div class="ins-card-head" onclick="var b=this.nextElementSibling;b.classList.toggle('collapsed');this.setAttribute('aria-expanded',b.classList.contains('collapsed')?'false':'true')" aria-expanded="true"><span>${tool.icon}</span><h2>Calculate Your Estimate</h2><span class="ins-card-toggle">&#x25BE;</span></div>
<div class="ins-card-body"><div class="ins-form-grid">${formHtml}</div>
<button class="ins-calc-btn" id="calcBtn" type="button">Calculate Estimate</button></div></div>
<div class="ins-results" id="results">${resultsHtml}</div>
<section class="ins-seo">
<h2>${isSingle ? esc(tool.name) : esc(c.name)+' '+esc(tool.name)} — What You Need to Know</h2>
<p>${esc(desc)} Use this free calculator to get a quick estimate before contacting insurance providers.</p>
<p>Insurance penetration in Africa remains below 3% on average, yet the need for financial protection is immense. ${isSingle ? 'This tool covers multiple African countries.' : esc(c.name)+"'s insurance market is regulated by "+esc(isSingle?'national regulators':'the national insurance authority')+'.'}</p>
<p><strong>Disclaimer:</strong> These are estimates based on market data and published rates. Actual premiums depend on individual circumstances, insurer assessment, and negotiation. Always get formal quotes from licensed providers.</p>
</section>
</main>
<afro-footer></afro-footer>
<script src="/data/insurance/country-insurance-index.js"></script>
<script src="/engines/${tool.id}-engine.js"></script>
<script>
!function(){
"use strict";
${ccLine}
var D=window.AfroTools.insuranceData;
var E=window.AfroTools.${tool.engineId.charAt(0).toUpperCase()+tool.engineId.slice(1)}Engine;
${isSingle ? buildCountrySelectInit(tool) : ''}
document.getElementById("calcBtn").addEventListener("click",function(){
var inputs={};
${tool.formFields.map(f => {
  if (f.type === 'countrySelect' && !isSingle) return '';
  return `inputs.${f.id}=document.getElementById("${f.id}")?document.getElementById("${f.id}").value:"";`;
}).join('\n')}
var cc=CC${isSingle && tool.formFields.some(f=>f.type==='countrySelect') ? '||inputs.country||"NG"' : '||"NG"'};
var r=E.calculate(inputs,cc);
if(r.error){alert(r.error);return;}
${getResultsBinding(tool)}
document.getElementById("results").classList.add("on");
document.getElementById("results").scrollIntoView({behavior:"smooth",block:"start"});
});
}();
</script>
</body>
</html>`;
}

function buildCountrySelectInit(tool) {
  if (!tool.formFields.some(f => f.type === 'countrySelect')) return '';
  return `
var selFields=document.querySelectorAll("select");
selFields.forEach(function(sel){
  if(sel.id&&(sel.id==="country"||sel.id==="origin")){
    var countries=D.countries;
    for(var k in countries){
      if(countries.hasOwnProperty(k)){
        var o=document.createElement("option");
        o.value=k;o.textContent=countries[k].flag+" "+countries[k].name;
        sel.appendChild(o);
      }
    }
  }
});`;
}

function getResultsHtml(tool) {
  switch(tool.id) {
    case 'car-insurance': return `
<div class="ins-res-hero accent" id="resHero"><div class="ins-res-hero-label">Estimated Annual Premium Range</div><div class="ins-res-hero-amount" id="resAmount">—</div><div class="ins-res-hero-sub" id="resSub">Comprehensive cover</div></div>
<div class="ins-card"><div class="ins-card-body">
<table class="ins-summary-table"><thead><tr><th>Cover Type</th><th>Estimated Range</th></tr></thead><tbody>
<tr><td>Third-Party (mandatory)</td><td id="resTP">—</td></tr>
<tr><td>Comprehensive</td><td id="resComp">—</td></tr>
<tr><td>Typical Excess</td><td id="resExcess">—</td></tr>
</tbody></table></div></div>
<div class="ins-metrics"><div class="ins-metric"><div class="ins-metric-val" id="resProviders">—</div><div class="ins-metric-label">Top Providers</div></div></div>
<div class="ins-tip" id="resTip">—</div>`;

    case 'health-insurance-compare': return `
<div class="ins-res-hero accent"><div class="ins-res-hero-label">Annual Premium Range</div><div class="ins-res-hero-amount" id="resAmount">—</div><div class="ins-res-hero-sub" id="resSub">Monthly: —</div></div>
<div class="ins-card"><div class="ins-card-body"><div id="resPlans"></div></div></div>
<div class="ins-info" id="resScheme">—</div>`;

    case 'life-insurance-calc': return `
<div class="ins-res-hero accent"><div class="ins-res-hero-label">Life Insurance Gap</div><div class="ins-res-hero-amount" id="resAmount">—</div><div class="ins-res-hero-sub">Amount you need beyond existing cover</div></div>
<div class="ins-card"><div class="ins-card-body">
<table class="ins-summary-table"><thead><tr><th>Component</th><th>Amount</th></tr></thead><tbody>
<tr><td>Income Replacement</td><td id="resIncome">—</td></tr>
<tr><td>Debt Coverage</td><td id="resDebt">—</td></tr>
<tr><td>Education Fund</td><td id="resEdu">—</td></tr>
<tr><td>Total Need</td><td id="resTotal" class="highlight">—</td></tr>
<tr><td>Existing Cover</td><td id="resExisting">—</td></tr>
<tr><td><strong>Gap (Insurance Needed)</strong></td><td id="resGap" class="highlight">—</td></tr>
</tbody></table></div></div>
<div class="ins-metrics"><div class="ins-metric"><div class="ins-metric-val" id="resPremMin">—</div><div class="ins-metric-label">Annual Premium (Low)</div></div>
<div class="ins-metric"><div class="ins-metric-val" id="resPremMax">—</div><div class="ins-metric-label">Annual Premium (High)</div></div>
<div class="ins-metric"><div class="ins-metric-val" id="resTerm">—</div><div class="ins-metric-label">Recommended Term</div></div></div>`;

    case 'funeral-insurance': return `
<div class="ins-res-hero accent"><div class="ins-res-hero-label">Monthly Premium Range</div><div class="ins-res-hero-amount" id="resAmount">—</div><div class="ins-res-hero-sub" id="resSub">Funeral cover</div></div>
<div class="ins-card"><div class="ins-card-body">
<table class="ins-summary-table"><thead><tr><th>Detail</th><th>Estimate</th></tr></thead><tbody>
<tr><td>Average Funeral Cost</td><td id="resFunCost">—</td></tr>
<tr><td>Cover Amount</td><td id="resCover">—</td></tr>
<tr><td>Monthly Premium</td><td id="resMonthly">—</td></tr>
<tr><td>Annual Premium</td><td id="resAnnual">—</td></tr>
<tr><td>Waiting Period</td><td id="resWait">—</td></tr>
</tbody></table></div></div>`;

    case 'travel-insurance': return `
<div class="ins-res-hero accent"><div class="ins-res-hero-label">Estimated Travel Insurance Premium</div><div class="ins-res-hero-amount" id="resAmount">—</div><div class="ins-res-hero-sub" id="resSub">—</div></div>
<div class="ins-metrics">
<div class="ins-metric"><div class="ins-metric-val" id="resMedical">—</div><div class="ins-metric-label">Medical Cover</div></div>
<div class="ins-metric"><div class="ins-metric-val" id="resBaggage">—</div><div class="ins-metric-label">Baggage Cover</div></div>
<div class="ins-metric"><div class="ins-metric-val" id="resCancel">—</div><div class="ins-metric-label">Cancellation Cover</div></div>
</div>`;

    case 'business-insurance': return `
<div class="ins-res-hero accent"><div class="ins-res-hero-label">Total Annual Business Insurance</div><div class="ins-res-hero-amount" id="resAmount">—</div><div class="ins-res-hero-sub" id="resSub">Monthly: —</div></div>
<div class="ins-card"><div class="ins-card-body">
<table class="ins-summary-table"><thead><tr><th>Cover Type</th><th>Premium Range</th></tr></thead><tbody>
<tr><td>Fire Insurance</td><td id="resFire">—</td></tr>
<tr><td>Burglary / Theft</td><td id="resBurg">—</td></tr>
<tr><td>Public Liability</td><td id="resPL">—</td></tr>
<tr><td>Professional Indemnity</td><td id="resPI">—</td></tr>
<tr><td>Goods in Transit</td><td id="resGIT">—</td></tr>
<tr><td class="highlight"><strong>Total</strong></td><td id="resTot" class="highlight">—</td></tr>
</tbody></table></div></div>`;

    case 'crop-insurance-calc': return `
<div class="ins-res-hero accent"><div class="ins-res-hero-label">Farmer Pays (After Subsidy)</div><div class="ins-res-hero-amount" id="resAmount">—</div><div class="ins-res-hero-sub" id="resSub">—</div></div>
<div class="ins-card"><div class="ins-card-body">
<table class="ins-summary-table"><thead><tr><th>Detail</th><th>Amount</th></tr></thead><tbody>
<tr><td>Sum Insured</td><td id="resSI">—</td></tr>
<tr><td>Gross Premium</td><td id="resGross">—</td></tr>
<tr><td>Government Subsidy</td><td id="resSub2">—</td></tr>
<tr><td class="highlight">Farmer Pays</td><td id="resFarmer" class="highlight">—</td></tr>
<tr><td>Per Hectare</td><td id="resPerHa">—</td></tr>
</tbody></table></div></div>
<div class="ins-scenarios" id="resScenarios"></div>`;

    case 'motor-third-party': return `
<div class="ins-res-hero accent"><div class="ins-res-hero-label">Third-Party Premium Range</div><div class="ins-res-hero-amount" id="resAmount">—</div><div class="ins-res-hero-sub" id="resSub">—</div></div>
<div class="ins-card"><div class="ins-card-body">
<table class="ins-summary-table"><thead><tr><th>Detail</th><th>Info</th></tr></thead><tbody>
<tr><td>Minimum Premium</td><td id="resMin">—</td></tr>
<tr><td>Maximum Premium</td><td id="resMax">—</td></tr>
<tr><td>Legal Status</td><td id="resStatus">—</td></tr>
<tr><td>Regulator</td><td id="resReg">—</td></tr>
</tbody></table></div></div>
<div class="ins-info" id="resNotes">—</div>`;

    case 'professional-indemnity':
    case 'fire-insurance': return `
<div class="ins-res-hero accent"><div class="ins-res-hero-label">Estimated Annual Premium</div><div class="ins-res-hero-amount" id="resAmount">—</div><div class="ins-res-hero-sub" id="resSub">Monthly: —</div></div>
<div class="ins-card"><div class="ins-card-body">
<table class="ins-summary-table"><thead><tr><th>Detail</th><th>Value</th></tr></thead><tbody>
<tr><td>Premium Range</td><td id="resRange">—</td></tr>
<tr><td>Rate Applied</td><td id="resRate">—</td></tr>
<tr><td>Cover / Sum Insured</td><td id="resCover">—</td></tr>
<tr><td>Discount / Notes</td><td id="resNotes2">—</td></tr>
</tbody></table></div></div>`;

    case 'marine-insurance': return `
<div class="ins-res-hero accent"><div class="ins-res-hero-label">Total Cargo Insurance Premium</div><div class="ins-res-hero-amount" id="resAmount">—</div><div class="ins-res-hero-sub" id="resSub">Including war risk surcharge</div></div>
<div class="ins-card"><div class="ins-card-body">
<table class="ins-summary-table"><thead><tr><th>Detail</th><th>Amount</th></tr></thead><tbody>
<tr><td>CIF Value</td><td id="resCIF">—</td></tr>
<tr><td>Sum Insured (CIF + 10%)</td><td id="resSI">—</td></tr>
<tr><td>Base Premium</td><td id="resBase">—</td></tr>
<tr><td>War Risk Surcharge</td><td id="resWar">—</td></tr>
<tr><td>Rate Applied</td><td id="resRate">—</td></tr>
</tbody></table></div></div>`;

    case 'microinsurance': return `
<div class="ins-res-hero accent"><div class="ins-res-hero-label">Monthly Microinsurance Premium</div><div class="ins-res-hero-amount" id="resAmount">—</div><div class="ins-res-hero-sub" id="resSub">—</div></div>
<div class="ins-metrics">
<div class="ins-metric"><div class="ins-metric-val" id="resDaily">—</div><div class="ins-metric-label">Daily</div></div>
<div class="ins-metric"><div class="ins-metric-val" id="resWeekly">—</div><div class="ins-metric-label">Weekly</div></div>
<div class="ins-metric"><div class="ins-metric-val" id="resAnnual">—</div><div class="ins-metric-label">Annual</div></div>
</div>
<div class="ins-info" id="resProviders">—</div>`;

    case 'claim-tracker': return `
<div class="ins-res-hero accent"><div class="ins-res-hero-label">Claim Checklist</div><div class="ins-res-hero-amount" id="resAmount">📋</div><div class="ins-res-hero-sub" id="resSub">—</div></div>
<div class="ins-card"><div class="ins-card-body"><ul class="ins-checklist" id="resChecklist"></ul></div></div>
<div class="ins-info" id="resTimeline">—</div>
<div class="ins-tip" id="resTips">—</div>`;

    case 'workers-comp': return `
<div class="ins-res-hero accent"><div class="ins-res-hero-label">Annual Workers Comp Contribution</div><div class="ins-res-hero-amount" id="resAmount">—</div><div class="ins-res-hero-sub" id="resSub">Monthly: —</div></div>
<div class="ins-card"><div class="ins-card-body">
<table class="ins-summary-table"><thead><tr><th>Detail</th><th>Amount</th></tr></thead><tbody>
<tr><td>Annual Contribution</td><td id="resAnnual">—</td></tr>
<tr><td>Monthly Contribution</td><td id="resMonthly">—</td></tr>
<tr><td>Per Employee (Annual)</td><td id="resPerEmp">—</td></tr>
<tr><td>Rate Applied</td><td id="resRate">—</td></tr>
<tr><td>Basis</td><td id="resBasis">—</td></tr>
</tbody></table></div></div>`;

    case 'health-contribution': return `
<div class="ins-res-hero accent"><div class="ins-res-hero-label">Monthly Health Contribution</div><div class="ins-res-hero-amount" id="resAmount">—</div><div class="ins-res-hero-sub" id="resSub">—</div></div>
<div class="ins-card"><div class="ins-card-body">
<table class="ins-summary-table"><thead><tr><th>Detail</th><th>Amount</th></tr></thead><tbody>
<tr><td>Scheme</td><td id="resScheme">—</td></tr>
<tr><td>Employee Contribution</td><td id="resEmpCont">—</td></tr>
<tr><td>Employer Contribution</td><td id="resErCont">—</td></tr>
<tr><td class="highlight">Total Monthly</td><td id="resTotal" class="highlight">—</td></tr>
<tr><td>Annual Total</td><td id="resAnnual">—</td></tr>
<tr><td>Status</td><td id="resMandatory">—</td></tr>
</tbody></table></div></div>`;

    default: return `<div class="ins-info">Results will appear here after calculation.</div>`;
  }
}

function getResultsBinding(tool) {
  switch(tool.id) {
    case 'car-insurance': return `
document.getElementById("resAmount").textContent=r.comprehensiveMin+" — "+r.comprehensiveMax;
document.getElementById("resSub").textContent="Comprehensive cover (per year)";
document.getElementById("resTP").textContent=r.thirdPartyMin+" — "+r.thirdPartyMax;
document.getElementById("resComp").textContent=r.comprehensiveMin+" — "+r.comprehensiveMax;
document.getElementById("resExcess").textContent=r.excess;
document.getElementById("resProviders").textContent=r.providers||"Contact local providers";
document.getElementById("resTip").textContent=r.savingTip;`;

    case 'health-insurance-compare': return `
document.getElementById("resAmount").textContent=r.annualPremiumMin+" — "+r.annualPremiumMax;
document.getElementById("resSub").textContent="Monthly: "+r.monthlyPremiumMin+" — "+r.monthlyPremiumMax;
var ph=document.getElementById("resPlans");ph.innerHTML="";
if(r.plans&&r.plans.length){
  var t='<table class="ins-compare-table"><thead><tr><th>Provider</th><th>Annual Range</th><th>Monthly Range</th></tr></thead><tbody>';
  r.plans.forEach(function(p){t+='<tr><td>'+p.name+'</td><td>'+p.annualMin+' — '+p.annualMax+'</td><td>'+p.monthlyMin+' — '+p.monthlyMax+'</td></tr>';});
  t+='</tbody></table>';ph.innerHTML=t;
}
document.getElementById("resScheme").textContent="National scheme: "+r.schemeName+". Contribution: "+r.schemeContribution+". Providers: "+r.providers;`;

    case 'life-insurance-calc': return `
document.getElementById("resAmount").textContent=r.gap;
document.getElementById("resIncome").textContent=r.incomeReplacement;
document.getElementById("resDebt").textContent=r.debtCover;
document.getElementById("resEdu").textContent=r.educationFund;
document.getElementById("resTotal").textContent=r.totalNeed;
document.getElementById("resExisting").textContent=r.existingCover;
document.getElementById("resGap").textContent=r.gap;
document.getElementById("resPremMin").textContent=r.estimatedPremiumMin;
document.getElementById("resPremMax").textContent=r.estimatedPremiumMax;
document.getElementById("resTerm").textContent=r.termRecommendation;`;

    case 'funeral-insurance': return `
document.getElementById("resAmount").textContent=r.monthlyPremiumMin+" — "+r.monthlyPremiumMax;
document.getElementById("resSub").textContent="per month for "+r.familyMembers+" family member(s)";
document.getElementById("resFunCost").textContent=r.estimatedFuneralCost;
document.getElementById("resCover").textContent=r.coverAmount;
document.getElementById("resMonthly").textContent=r.monthlyPremiumMin+" — "+r.monthlyPremiumMax;
document.getElementById("resAnnual").textContent=r.annualPremiumMin+" — "+r.annualPremiumMax;
document.getElementById("resWait").textContent=r.waitingPeriod;`;

    case 'travel-insurance': return `
document.getElementById("resAmount").textContent=r.estimatedPremiumMin+" — "+r.estimatedPremiumMax;
document.getElementById("resSub").textContent=r.destination+" | "+r.duration+" | "+r.travelers+" traveler(s)";
document.getElementById("resMedical").textContent=r.medicalCover;
document.getElementById("resBaggage").textContent=r.baggageCover;
document.getElementById("resCancel").textContent=r.cancellationCover;`;

    case 'business-insurance': return `
document.getElementById("resAmount").textContent=r.totalPremiumMin+" — "+r.totalPremiumMax;
document.getElementById("resSub").textContent="Monthly: "+r.monthlyMin+" — "+r.monthlyMax;
document.getElementById("resFire").textContent=r.firePremiumMin+" — "+r.firePremiumMax;
document.getElementById("resBurg").textContent=r.burglaryPremiumMin+" — "+r.burglaryPremiumMax;
document.getElementById("resPL").textContent=r.publicLiabilityMin+" — "+r.publicLiabilityMax;
document.getElementById("resPI").textContent=r.professionalIndemnityMin+" — "+r.professionalIndemnityMax;
document.getElementById("resGIT").textContent=r.goodsInTransitMin+" — "+r.goodsInTransitMax;
document.getElementById("resTot").textContent=r.totalPremiumMin+" — "+r.totalPremiumMax;`;

    case 'crop-insurance-calc': return `
document.getElementById("resAmount").textContent=r.farmerPays;
document.getElementById("resSub").textContent="Premium rate: "+r.premiumRate+" | Subsidy: "+r.subsidyRate;
document.getElementById("resSI").textContent=r.sumInsured;
document.getElementById("resGross").textContent=r.grossPremium;
document.getElementById("resSub2").textContent=r.govSubsidy;
document.getElementById("resFarmer").textContent=r.farmerPays;
document.getElementById("resPerHa").textContent=r.perHectare;
var sc=document.getElementById("resScenarios");sc.innerHTML="";
if(r.scenarios){r.scenarios.forEach(function(s){sc.innerHTML+='<div class="ins-scenario"><div class="ins-scenario-label">'+s.lossPct+' Loss</div><div class="ins-scenario-val">'+s.payout+'</div></div>';});}`;

    case 'motor-third-party': return `
document.getElementById("resAmount").textContent=r.minimumPremium+" — "+r.maximumPremium;
document.getElementById("resSub").textContent=r.mandatoryStatus;
document.getElementById("resMin").textContent=r.minimumPremium;
document.getElementById("resMax").textContent=r.maximumPremium;
document.getElementById("resStatus").textContent=r.mandatoryStatus;
document.getElementById("resReg").textContent=r.regulator;
document.getElementById("resNotes").textContent=r.notes+(" Providers: "+r.providers);`;

    case 'professional-indemnity':
    case 'fire-insurance': return `
document.getElementById("resAmount").textContent=r.estimatedPremiumMin+" — "+r.estimatedPremiumMax;
document.getElementById("resSub").textContent="Monthly: "+r.monthlyMin+" — "+r.monthlyMax;
document.getElementById("resRange").textContent=r.estimatedPremiumMin+" — "+r.estimatedPremiumMax;
document.getElementById("resRate").textContent=r.rateApplied;
document.getElementById("resCover").textContent=r.coverLimit||r.sumInsured||"—";
document.getElementById("resNotes2").textContent=r.discount||r.excess||"—";`;

    case 'marine-insurance': return `
document.getElementById("resAmount").textContent=r.estimatedPremiumMin+" — "+r.estimatedPremiumMax;
document.getElementById("resCIF").textContent=r.cifValue;
document.getElementById("resSI").textContent=r.sumInsured;
document.getElementById("resBase").textContent=r.basePremiumMin+" — "+r.basePremiumMax;
document.getElementById("resWar").textContent=r.warRiskSurcharge;
document.getElementById("resRate").textContent=r.rateApplied;`;

    case 'microinsurance': return `
document.getElementById("resAmount").textContent=r.monthlyPremium;
document.getElementById("resSub").textContent=r.productType+" | "+r.mobileLinked;
document.getElementById("resDaily").textContent=r.dailyPremium;
document.getElementById("resWeekly").textContent=r.weeklyPremium;
document.getElementById("resAnnual").textContent=r.annualPremium;
document.getElementById("resProviders").textContent="Providers: "+r.providers;`;

    case 'claim-tracker': return `
document.getElementById("resAmount").textContent="\\u{1F4CB}";
document.getElementById("resSub").textContent=r.claimType+" Claim";
var cl=document.getElementById("resChecklist");cl.innerHTML="";
if(r.checklist){r.checklist.forEach(function(item){cl.innerHTML+='<li><span class="ins-check" onclick="this.classList.toggle(\\'done\\')">\\u2713</span><span>'+item+'</span></li>';});}
document.getElementById("resTimeline").textContent="Timeline: "+r.timeline;
document.getElementById("resTips").textContent="Tips: "+r.tips.join(" | ");`;

    case 'workers-comp': return `
document.getElementById("resAmount").textContent=r.annualContributionMin+" — "+r.annualContributionMax;
document.getElementById("resSub").textContent="Monthly: "+r.monthlyContributionMin+" — "+r.monthlyContributionMax;
document.getElementById("resAnnual").textContent=r.annualContributionMin+" — "+r.annualContributionMax;
document.getElementById("resMonthly").textContent=r.monthlyContributionMin+" — "+r.monthlyContributionMax;
document.getElementById("resPerEmp").textContent=r.perEmployeeMin+" — "+r.perEmployeeMax;
document.getElementById("resRate").textContent=r.rateApplied;
document.getElementById("resBasis").textContent=r.basis;`;

    case 'health-contribution': return `
document.getElementById("resAmount").textContent=r.totalContribution;
document.getElementById("resSub").textContent=r.schemeName+" | "+r.mandatory;
document.getElementById("resScheme").textContent=r.schemeName;
document.getElementById("resEmpCont").textContent=r.employeeContribution;
document.getElementById("resErCont").textContent=r.employerContribution;
document.getElementById("resTotal").textContent=r.totalContribution;
document.getElementById("resAnnual").textContent=r.annualTotal;
document.getElementById("resMandatory").textContent=r.mandatory;`;

    default: return '';
  }
}

// ── Main Generation ──
let totalFiles = 0;

TOOLS.forEach(tool => {
  // 1. Generate engine
  const enginePath = path.join(ROOT, 'engines', `${tool.id}-engine.js`);
  writeFile(enginePath, generateEngine(tool));
  totalFiles++;
  console.log(`  Engine: engines/${tool.id}-engine.js`);

  // 2. Generate pages
  const toolDir = path.join(ROOT, 'tools', tool.id);
  mkdirp(toolDir);

  if (!tool.countries) {
    // Single-page tool
    writeFile(path.join(toolDir, 'index.html'), singlePage(tool));
    totalFiles++;
    console.log(`  Page: tools/${tool.id}/index.html (single)`);
  } else {
    // Hub page + country pages
    writeFile(path.join(toolDir, 'index.html'), hubPage(tool));
    totalFiles++;
    console.log(`  Hub: tools/${tool.id}/index.html (${tool.countries.length} countries)`);

    tool.countries.forEach(c => {
      writeFile(path.join(toolDir, `${c.slug}.html`), countryPage(tool, c));
      totalFiles++;
    });
    console.log(`  Country pages: ${tool.countries.length} generated`);
  }
});

console.log(`\nDone! Generated ${totalFiles} files total.`);
