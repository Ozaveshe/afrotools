const fs = require('fs');
const path = require('path');

const root = process.cwd();
const generatedAt = new Date().toISOString();
const lastChecked = '2026-05-20';

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function ensureDir(rel) {
  fs.mkdirSync(path.join(root, rel), { recursive: true });
}

function evaluateObjectLiteral(literal) {
  // The audited files are plain first-party JS. This evaluates only extracted
  // object/array literals from the current repo so the audit matches the app.
  return Function(`"use strict"; return (${literal});`)();
}

function extractBetween(source, startToken, endToken) {
  const start = source.indexOf(startToken);
  if (start < 0) throw new Error(`Missing token ${startToken}`);
  const end = source.indexOf(endToken, start + startToken.length);
  if (end < 0) throw new Error(`Missing end token ${endToken}`);
  return source.slice(start + startToken.length, end);
}

global.window = {};
global.document = {
  readyState: 'loading',
  addEventListener() {},
  querySelector() { return null; },
  getElementById() { return null; }
};

require(path.join(root, 'tools/study-abroad-cost/study-abroad-cost.js'));
const heroDestinations = window.AfroStudyAbroadModel.DESTINATIONS;

const backboneSource = read('tools/study-abroad-cost/study-abroad-backbone.js');
const fxRates = evaluateObjectLiteral(extractBetween(backboneSource, 't=', ',i='));
const regionProfiles = evaluateObjectLiteral(extractBetween(backboneSource, ',i=', '},r=') + '}');
const countryLiteral = extractBetween(backboneSource, 'var u=', '],l=') + ']';
const countries = Function(`
  "use strict";
  function c(e,a,n,t,i,r,o){
    return { key:e, name:a, region:n, currency:t, profile:i||n, confidence:r||(("Middle East"===n||"Latin America"===n)?"low":"medium"), heroKey:o||"" };
  }
  return (${countryLiteral});
`)();

const sources = {
  ukMoney: {
    url: 'https://www.gov.uk/student-visa/money',
    title: 'GOV.UK Student visa: Money you need',
    date: null,
    type: 'OFFICIAL_GOVERNMENT'
  },
  ukFinancialEvidence: {
    url: 'https://www.gov.uk/guidance/financial-evidence-for-student-and-child-student-route-applicants',
    title: 'GOV.UK Financial evidence for Student and Child Student visa applicants',
    date: '2025-12-31',
    type: 'OFFICIAL_GOVERNMENT'
  },
  ukIhs: {
    url: 'https://www.gov.uk/healthcare-immigration-application/how-much-pay',
    title: 'GOV.UK Pay for UK healthcare as part of your immigration application',
    date: null,
    type: 'OFFICIAL_GOVERNMENT'
  },
  ukFees: {
    url: 'https://www.gov.uk/student-visa/money',
    title: 'GOV.UK Student visa application steps and fee',
    date: null,
    type: 'OFFICIAL_GOVERNMENT'
  },
  canadaFunds: {
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html',
    title: 'Canada.ca Proof of financial support for study permit',
    date: '2026-01-26',
    type: 'OFFICIAL_GOVERNMENT'
  },
  canadaFees: {
    url: 'https://www.ircc.canada.ca/english/information/fees/fees.asp',
    title: 'IRCC Citizenship and immigration application fees',
    date: '2026-04-30',
    type: 'OFFICIAL_GOVERNMENT'
  },
  australiaVisa: {
    url: 'https://www.studyaustralia.gov.au/en/plan-your-move/visa-application-process',
    title: 'Study Australia How to apply for your visa',
    date: null,
    type: 'OFFICIAL_GOVERNMENT'
  },
  australiaFee: {
    url: 'https://www.studyaustralia.gov.au/en/tools-and-resources/news/student-visa-application-charge-increase',
    title: 'Study Australia Student Visa Application Charge increase',
    date: '2025-07-02',
    type: 'OFFICIAL_GOVERNMENT'
  },
  usVisa: {
    url: 'https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html',
    title: 'U.S. Department of State Student Visa',
    date: null,
    type: 'OFFICIAL_GOVERNMENT'
  },
  usSevis: {
    url: 'https://www.ice.gov/sevis/i901',
    title: 'U.S. ICE I-901 SEVIS Fee',
    date: '2024-12-10',
    type: 'OFFICIAL_GOVERNMENT'
  },
  usEducation: {
    url: 'https://educationusa.state.gov/your-5-steps-us-study/finance-your-studies',
    title: 'EducationUSA Finance Your U.S. Studies',
    date: null,
    type: 'OFFICIAL_EDUCATION'
  },
  germanyBlocked: {
    url: 'https://www.auswaertiges-amt.de/en/visa-service/visabestimmungen-node/sperrkonto-seite',
    title: 'German Federal Foreign Office blocked account for students',
    date: '2024-07-26',
    type: 'OFFICIAL_GOVERNMENT'
  },
  germanyVisaFee: {
    url: 'https://www.auswaertiges-amt.de/en/visa-service/215870-215870',
    title: 'German Federal Foreign Office Visas for Germany',
    date: '2026-04-17',
    type: 'OFFICIAL_GOVERNMENT'
  },
  daadCosts: {
    url: 'https://www.daad.de/en/study-and-research-in-germany/plan-your-studies/costs-of-education-and-living/',
    title: 'DAAD Costs of education and living',
    date: null,
    type: 'OFFICIAL_EDUCATION'
  }
};

const currentOfficial = {
  ukLivingOutside: 1171 * 9,
  ukLivingLondon: 1529 * 9,
  ukDependantOutside: 680 * 9,
  ukDependantLondon: 845 * 9,
  ukVisaFee: 558,
  ukIhsAnnual: 776,
  canadaLivingApplicant: 22895,
  canadaFamily2: 28502,
  canadaFamily3: 35040,
  canadaStudyPermit: 150,
  canadaBiometrics: 85,
  australiaFinancialCapacity: 29710,
  australiaStudentVisaCharge: 2000,
  usVisaFee: 185,
  usSevisFee: 350,
  germanyBlockedAnnualDaad: 11904,
  germanyBlockedMonthlyDaad: 992,
  germanyNationalVisa: 75
};

const categoryType = {
  visa_requirement: 'visa requirement',
  tuition: 'tuition',
  living_estimate: 'living estimate',
  travel_estimate: 'travel estimate',
  optional_cost: 'optional cost'
};

function numberOrRange(value) {
  if (Array.isArray(value)) return value;
  return value;
}

function costRow(opts) {
  const src = opts.source || {};
  const issues = opts.issues || [];
  const sourceUrl = opts.sourceUrl || src.url || null;
  const sourceDate = opts.sourceDate !== undefined ? opts.sourceDate : (src.date || null);
  if (opts.sourceType === 'OFFICIAL_GOVERNMENT' && !sourceUrl) {
    issues.push('Official government value needs an app-level source URL.');
  }
  if ((opts.sourceType === 'ESTIMATE_MARKET' || opts.sourceType === 'UNKNOWN_OR_UNVERIFIED') && !sourceUrl) {
    issues.push('No source URL is attached to this app value; keep the display label as estimate or needs verification.');
  }
  if (sourceDate && isStaleSource(sourceDate, opts.costKind, opts.sourceType)) {
    issues.push('Source date is stale under the audit rules; recheck before release.');
  }
  if ((opts.sourceType || '').includes('ESTIMATE') && /flight|travel/i.test(opts.field || '') && /official/i.test(opts.displayLabel || '')) {
    issues.push('Travel estimate must not be labeled official.');
  }
  return {
    field: opts.field,
    value: numberOrRange(opts.value),
    period: opts.period || null,
    durationCapMonths: opts.durationCapMonths || null,
    sourceType: opts.sourceType,
    sourceUrl,
    sourceTitle: opts.sourceTitle || src.title || null,
    sourceDate,
    lastChecked,
    sourceCategory: opts.sourceCategory || sourceCategoryFromType(opts.sourceType),
    supportsExactValue: Boolean(opts.supportsExactValue),
    currentFor2026: Boolean(opts.currentFor2026),
    costKind: opts.costKind || null,
    confidence: opts.confidence || 'unknown',
    displayLabel: opts.displayLabel,
    action: opts.action,
    recommendedDisplayLabel: opts.recommendedDisplayLabel || opts.displayLabel,
    recommendedAction: opts.recommendedAction || opts.action,
    notes: opts.notes || '',
    issues
  };
}

function isStaleSource(sourceDate, costKind, sourceType) {
  const checked = new Date(`${lastChecked}T00:00:00Z`);
  const date = new Date(`${sourceDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  const ageDays = (checked.getTime() - date.getTime()) / 86400000;
  if (sourceType === 'OFFICIAL_GOVERNMENT' || costKind === categoryType.visa_requirement) return ageDays > 365;
  if (costKind === categoryType.tuition || costKind === categoryType.living_estimate) return ageDays > 730;
  return false;
}

function sourceCategoryFromType(sourceType) {
  if (sourceType === 'OFFICIAL_GOVERNMENT') return 'official government';
  if (sourceType === 'OFFICIAL_EDUCATION') return 'official education';
  if (sourceType === 'VERIFIED_INSTITUTION') return 'university';
  if (sourceType === 'ESTIMATE_MARKET') return 'market estimate';
  return 'unknown';
}

function heroCurrency(country) {
  return country.symbol || country.currencyLabel;
}

function addTuitionRows(costs, destination) {
  Object.keys(destination.tuition || {}).forEach((level) => {
    Object.keys(destination.tuition[level] || {}).forEach((field) => {
      costs.push(costRow({
        field: `tuition_${level}_${field}`,
        value: destination.tuition[level][field],
        period: 'year',
        sourceType: 'ESTIMATE_MARKET',
        sourceCategory: 'market estimate',
        supportsExactValue: false,
        currentFor2026: false,
        costKind: categoryType.tuition,
        confidence: 'low',
        displayLabel: 'Typical tuition range, verify with the university',
        action: 'add official education or university source before presenting as factual',
        notes: 'The app uses broad AfroTools ranges. No linked institution, course page, or official national tuition dataset supports the exact range.'
      }));
    });
  });
}

function addCommonHeroRows(costs, destination) {
  costs.push(costRow({
    field: 'living_range_market_reference',
    value: destination.livingRange,
    period: 'year',
    sourceType: 'ESTIMATE_MARKET',
    supportsExactValue: false,
    currentFor2026: false,
    costKind: categoryType.living_estimate,
    confidence: 'low',
    displayLabel: 'Estimated annual living range, not official',
    action: 'keep only with estimate label and add market/source methodology',
    notes: 'The broad living range is useful for planning but is not tied to a named current market or official source.'
  }));

  costs.push(costRow({
    field: 'setup_travel_arrival_cost',
    value: destination.setupCost,
    period: 'one_time',
    sourceType: 'ESTIMATE_MARKET',
    supportsExactValue: false,
    currentFor2026: false,
    costKind: categoryType.travel_estimate,
    confidence: 'low',
    displayLabel: 'Estimated flight and arrival setup cost',
    action: 'keep only as estimate; add origin/city/date methodology or ticket quote timestamp',
    notes: destination.setupNote || 'Flight/setup costs are not official unless sourced from a ticket quote API with a timestamp.'
  }));

  costs.push(costRow({
    field: 'dependents_multiplier',
    value: { spouse: 1.35, children: 1.55, spouse_and_children: 1.8 },
    period: null,
    sourceType: 'UNKNOWN_OR_UNVERIFIED',
    supportsExactValue: false,
    currentFor2026: false,
    costKind: categoryType.optional_cost,
    confidence: 'low',
    displayLabel: 'Dependents adjustment needs verification',
    action: 'replace country-specific dependent costs where official values exist; otherwise show as estimate',
    notes: 'The upgraded engine uses generic multipliers rather than country-specific official dependant funding rules.'
  }));

  costs.push(costRow({
    field: `static_fx_${heroCurrency(destination)}_to_usd`,
    value: fxRates[heroCurrency(destination)],
    period: null,
    sourceType: 'UNKNOWN_OR_UNVERIFIED',
    supportsExactValue: false,
    currentFor2026: false,
    costKind: categoryType.optional_cost,
    confidence: 'unknown',
    displayLabel: 'FX estimate, rate date/source missing',
    action: 'add FX provider/date or mark all local/USD conversions as estimate',
    notes: 'CurrencyDisplay can label estimates, but the static FX table has no source URL, timestamp, or refresh policy.'
  }));
}

function buildHero(countryKey) {
  const destination = heroDestinations[countryKey];
  const costs = [];
  addTuitionRows(costs, destination);
  addCommonHeroRows(costs, destination);

  if (countryKey === 'uk') {
    costs.push(costRow({
      field: 'living_requirement_outside_london_current_app',
      value: destination.livingOfficial.min,
      period: '9_months',
      durationCapMonths: 9,
      sourceType: 'UNKNOWN_OR_UNVERIFIED',
      sourceUrl: destination.livingOfficial.source,
      sourceTitle: 'UKCISA maintenance requirements news',
      sourceDate: '2025-01-02',
      sourceCategory: 'unknown',
      supportsExactValue: false,
      currentFor2026: false,
      costKind: categoryType.visa_requirement,
      confidence: 'low',
      displayLabel: 'Needs verification: UK proof-of-funds value is stale',
      action: 'replace with GOV.UK GBP 1,171/month outside London for up to 9 months',
      notes: `Current app value is GBP ${destination.livingOfficial.min}. GOV.UK currently gives GBP ${currentOfficial.ukLivingOutside} for 9 months outside London.`
    }));
    costs.push(costRow({
      field: 'living_requirement_london_current_app',
      value: destination.livingOfficial.max,
      period: '9_months',
      durationCapMonths: 9,
      sourceType: 'UNKNOWN_OR_UNVERIFIED',
      sourceUrl: destination.livingOfficial.source,
      sourceTitle: 'UKCISA maintenance requirements news',
      sourceDate: '2025-01-02',
      sourceCategory: 'unknown',
      supportsExactValue: false,
      currentFor2026: false,
      costKind: categoryType.visa_requirement,
      confidence: 'low',
      displayLabel: 'Needs verification: UK London proof-of-funds value is stale',
      action: 'replace with GOV.UK GBP 1,529/month in London for up to 9 months',
      notes: `Current app value is GBP ${destination.livingOfficial.max}. GOV.UK currently gives GBP ${currentOfficial.ukLivingLondon} for 9 months in London.`
    }));
    costs.push(costRow({
      field: 'student_visa_application_fee',
      value: destination.governmentFees[0].amount,
      period: 'one_time',
      sourceType: 'OFFICIAL_GOVERNMENT',
      source: sources.ukFees,
      supportsExactValue: destination.governmentFees[0].amount === currentOfficial.ukVisaFee,
      currentFor2026: true,
      costKind: categoryType.visa_requirement,
      confidence: 'high',
      displayLabel: 'Official UK student visa fee',
      action: 'keep',
      notes: 'Current app value matches the GOV.UK student visa application fee.'
    }));
    costs.push(costRow({
      field: 'immigration_health_surcharge_annual',
      value: destination.healthcare.annualEquivalent,
      period: 'year',
      sourceType: 'OFFICIAL_GOVERNMENT',
      source: sources.ukIhs,
      supportsExactValue: destination.healthcare.annualEquivalent === currentOfficial.ukIhsAnnual,
      currentFor2026: true,
      costKind: categoryType.optional_cost,
      confidence: 'high',
      displayLabel: 'Official UK student IHS annual rate',
      action: 'keep but add source URL to app data',
      notes: 'The app stores the value and note, but not the source URL on the healthcare object.'
    }));
    costs.push(costRow({
      field: 'uk_dependant_living_requirement_missing',
      value: null,
      period: '9_months',
      durationCapMonths: 9,
      sourceType: 'OFFICIAL_GOVERNMENT',
      source: sources.ukFinancialEvidence,
      supportsExactValue: false,
      currentFor2026: true,
      costKind: categoryType.visa_requirement,
      confidence: 'medium',
      displayLabel: 'Official UK dependant funds exist but are not modeled exactly',
      action: 'add country-specific dependant requirement or mark dependent risk approximate',
      notes: `GOV.UK uses GBP ${currentOfficial.ukDependantLondon} in London or GBP ${currentOfficial.ukDependantOutside} outside London for 9 months per dependant. The app currently uses generic multipliers.`
    }));
  }

  if (countryKey === 'canada') {
    costs.push(costRow({
      field: 'proof_of_funds_living_outside_quebec',
      value: destination.livingOfficial.min,
      period: 'year',
      sourceType: 'OFFICIAL_GOVERNMENT',
      source: sources.canadaFunds,
      supportsExactValue: destination.livingOfficial.min === currentOfficial.canadaLivingApplicant,
      currentFor2026: true,
      costKind: categoryType.visa_requirement,
      confidence: 'high',
      displayLabel: 'Official Canada living expense threshold outside Quebec',
      action: 'keep, but clarify excludes tuition and transportation',
      notes: 'Canada.ca says this amount excludes tuition and transportation costs and is updated yearly.'
    }));
    destination.governmentFees.forEach((fee) => {
      const isBiometrics = /bio/i.test(fee.label);
      costs.push(costRow({
        field: isBiometrics ? 'biometrics_fee' : 'study_permit_fee',
        value: fee.amount,
        period: 'one_time',
        sourceType: 'OFFICIAL_GOVERNMENT',
        source: sources.canadaFees,
        supportsExactValue: fee.amount === (isBiometrics ? currentOfficial.canadaBiometrics : currentOfficial.canadaStudyPermit),
        currentFor2026: true,
        costKind: categoryType.visa_requirement,
        confidence: 'high',
        displayLabel: isBiometrics ? 'Official Canada biometrics fee' : 'Official Canada study permit fee',
        action: 'keep',
        notes: isBiometrics ? 'IRCC fee list shows CAD 85 per individual.' : 'IRCC fee list shows CAD 150 for a study permit.'
      }));
    });
    costs.push(costRow({
      field: 'annual_insurance_reference',
      value: destination.annualInsurance,
      period: 'year',
      sourceType: 'ESTIMATE_MARKET',
      supportsExactValue: false,
      currentFor2026: false,
      costKind: categoryType.optional_cost,
      confidence: 'low',
      displayLabel: 'Estimated health insurance cost',
      action: 'keep only as estimate and add province/institution source strategy',
      notes: destination.insuranceNote
    }));
  }

  if (countryKey === 'australia') {
    costs.push(costRow({
      field: 'student_visa_financial_capacity',
      value: destination.livingOfficial.min,
      period: 'application',
      sourceType: 'OFFICIAL_GOVERNMENT',
      source: sources.australiaVisa,
      supportsExactValue: destination.livingOfficial.min === currentOfficial.australiaFinancialCapacity,
      currentFor2026: true,
      costKind: categoryType.visa_requirement,
      confidence: 'high',
      displayLabel: 'Official Australia student visa financial capacity requirement',
      action: 'keep, but warn actual living costs may be higher',
      notes: 'Study Australia says applicants must prove at least AUD 29,710 and that living costs vary by location.'
    }));
    costs.push(costRow({
      field: 'student_visa_application_charge',
      value: destination.governmentFees[0].amount,
      period: 'one_time',
      sourceType: 'OFFICIAL_GOVERNMENT',
      source: sources.australiaFee,
      supportsExactValue: destination.governmentFees[0].amount === currentOfficial.australiaStudentVisaCharge,
      currentFor2026: true,
      costKind: categoryType.visa_requirement,
      confidence: 'high',
      displayLabel: 'Official Australia student visa application charge',
      action: 'keep',
      notes: 'Study Australia states the primary applicant VAC increased to AUD 2,000 from 1 July 2025.'
    }));
    costs.push(costRow({
      field: 'oshc_annual_reference',
      value: destination.annualInsurance,
      period: 'year',
      sourceType: 'ESTIMATE_MARKET',
      supportsExactValue: false,
      currentFor2026: false,
      costKind: categoryType.optional_cost,
      confidence: 'low',
      displayLabel: 'Estimated OSHC premium',
      action: 'keep only as estimate; add provider quote/source strategy',
      notes: destination.insuranceNote
    }));
  }

  if (countryKey === 'usa') {
    destination.governmentFees.forEach((fee) => {
      const isSevis = /SEVIS/i.test(fee.label);
      costs.push(costRow({
        field: isSevis ? 'sevis_i901_fee' : 'student_visa_mrv_fee',
        value: fee.amount,
        period: 'one_time',
        sourceType: 'OFFICIAL_GOVERNMENT',
        source: isSevis ? sources.usSevis : sources.usVisa,
        supportsExactValue: fee.amount === (isSevis ? currentOfficial.usSevisFee : currentOfficial.usVisaFee),
        currentFor2026: true,
        costKind: categoryType.visa_requirement,
        confidence: 'high',
        displayLabel: isSevis ? 'Official SEVIS I-901 fee' : 'Official U.S. student visa application fee',
        action: 'keep',
        notes: isSevis ? 'ICE/SEVIS fee list supports USD 350 for F/M applicants.' : 'State Department student visa page supports USD 185 application fee.'
      }));
    });
    costs.push(costRow({
      field: 'institution_specific_i20_cost_strategy',
      value: null,
      period: 'application',
      sourceType: 'OFFICIAL_EDUCATION',
      source: sources.usEducation,
      supportsExactValue: false,
      currentFor2026: true,
      costKind: categoryType.visa_requirement,
      confidence: 'medium',
      displayLabel: 'Institution-specific I-20/COA required',
      action: 'add warning that U.S. tuition and living proof vary by school and Form I-20',
      notes: 'EducationUSA says U.S. living and study costs vary greatly; the app should not present one national tuition/living requirement as official.'
    }));
    costs.push(costRow({
      field: 'annual_insurance_reference',
      value: destination.annualInsurance,
      period: 'year',
      sourceType: 'ESTIMATE_MARKET',
      supportsExactValue: false,
      currentFor2026: false,
      costKind: categoryType.optional_cost,
      confidence: 'low',
      displayLabel: 'Estimated student insurance cost',
      action: 'keep only as estimate and add university insurance source strategy',
      notes: destination.insuranceNote
    }));
  }

  if (countryKey === 'germany') {
    costs.push(costRow({
      field: 'blocked_account_reference_current_app',
      value: destination.livingOfficial.min,
      period: 'year',
      sourceType: 'OFFICIAL_EDUCATION',
      source: sources.daadCosts,
      supportsExactValue: destination.livingOfficial.min === currentOfficial.germanyBlockedAnnualDaad,
      currentFor2026: true,
      costKind: categoryType.visa_requirement,
      confidence: 'medium',
      displayLabel: 'DAAD proof-of-funds planning reference',
      action: 'relabel as official education reference and add mission/Consular Services Portal verification before calling it official government',
      notes: 'DAAD supports EUR 992/month from 2025, but the Federal Foreign Office says the exact blocked amount must be checked with the competent mission or Consular Services Portal.'
    }));
    costs.push(costRow({
      field: 'blocked_account_mission_verification_needed',
      value: null,
      period: 'application',
      sourceType: 'OFFICIAL_GOVERNMENT',
      source: sources.germanyBlocked,
      supportsExactValue: false,
      currentFor2026: true,
      costKind: categoryType.visa_requirement,
      confidence: 'medium',
      displayLabel: 'Germany proof-of-funds value needs official mission verification',
      action: 'add mission/portal source field for exact blocked-account amount by applicant country',
      notes: 'Federal Foreign Office confirms blocked account logic but points applicants to the competent mission or Consular Services Portal for the exact amount.'
    }));
    costs.push(costRow({
      field: 'national_visa_fee',
      value: destination.governmentFees[0].amount,
      period: 'one_time',
      sourceType: 'OFFICIAL_GOVERNMENT',
      source: sources.germanyVisaFee,
      supportsExactValue: destination.governmentFees[0].amount === currentOfficial.germanyNationalVisa,
      currentFor2026: true,
      costKind: categoryType.visa_requirement,
      confidence: 'high',
      displayLabel: 'Official Germany national visa fee',
      action: 'keep and replace German-language URL with English Federal Foreign Office URL where possible',
      notes: 'The app value matches the Federal Foreign Office national visa fee.'
    }));
    costs.push(costRow({
      field: 'annual_health_insurance_reference',
      value: destination.annualInsurance,
      period: 'year',
      sourceType: 'ESTIMATE_MARKET',
      supportsExactValue: false,
      currentFor2026: false,
      costKind: categoryType.optional_cost,
      confidence: 'low',
      displayLabel: 'Estimated German student health insurance cost',
      action: 'keep only as estimate and add public/private insurer source strategy',
      notes: destination.insuranceNote
    }));
  }

  return {
    country: destination.name,
    key: countryKey,
    region: countries.find((country) => country.heroKey === countryKey)?.region || null,
    destinationCityOrTier: countryKey === 'uk' ? 'London / outside London' : 'national model',
    currency: heroCurrency(destination),
    status: costs.some((row) => row.confidence === 'low' || row.sourceType === 'UNKNOWN_OR_UNVERIFIED') ? 'not_ready' : 'ready_with_warnings',
    costs
  };
}

function buildRegional(country) {
  const profile = regionProfiles[country.profile || country.region];
  const costs = [];
  Object.keys(profile.tuition || {}).forEach((level) => {
    costs.push(costRow({
      field: `regional_tuition_${level}`,
      value: profile.tuition[level],
      period: 'year',
      sourceType: 'ESTIMATE_MARKET',
      supportsExactValue: false,
      currentFor2026: false,
      costKind: categoryType.tuition,
      confidence: country.confidence === 'low' ? 'low' : 'medium',
      displayLabel: 'Estimated regional tuition reference',
      action: 'add destination-specific official education or university source before presenting as country fact',
      notes: `Uses the ${country.profile || country.region} regional profile, not destination-specific sourced data.`
    }));
  });
  [
    ['regional_living', profile.living, 'year', categoryType.living_estimate],
    ['regional_insurance', profile.insurance, 'year', categoryType.optional_cost],
    ['regional_visa_government_estimate', profile.government, 'one_time', categoryType.visa_requirement],
    ['regional_setup_travel_arrival_estimate', profile.setup, 'one_time', categoryType.travel_estimate]
  ].forEach(([field, value, period, kind]) => {
    costs.push(costRow({
      field,
      value,
      period,
      sourceType: 'ESTIMATE_MARKET',
      supportsExactValue: false,
      currentFor2026: false,
      costKind: kind,
      confidence: country.confidence === 'low' ? 'low' : 'medium',
      displayLabel: field.includes('travel') ? 'Estimated travel/setup cost' : 'Estimated regional planning value',
      action: 'add official destination source or keep visibly marked as estimate',
      notes: `Uses the ${country.profile || country.region} regional profile. No source URL or last-checked date is present in the app data.`
    }));
  });
  costs.push(costRow({
    field: `static_fx_${country.currency}_to_usd`,
    value: fxRates[country.currency],
    period: null,
    sourceType: 'UNKNOWN_OR_UNVERIFIED',
    supportsExactValue: false,
    currentFor2026: false,
    costKind: categoryType.optional_cost,
    confidence: 'unknown',
    displayLabel: 'FX estimate, rate date/source missing',
    action: 'add FX provider/date or mark all local/USD conversions as estimate',
    notes: 'Static FX table has no source URL, timestamp, or refresh policy.'
  }));
  return {
    country: country.name,
    key: country.key,
    region: country.region,
    destinationCityOrTier: `${country.profile || country.region} regional profile`,
    currency: country.currency,
    status: 'ready_with_warnings',
    costs
  };
}

const heroKeys = ['uk', 'canada', 'australia', 'usa', 'germany'];
const heroAudits = heroKeys.map(buildHero);
const regionalAudits = countries
  .filter((country) => !country.heroKey)
  .map(buildRegional);

const destinations = heroAudits.concat(regionalAudits);
const allCosts = destinations.flatMap((destination) => destination.costs.map((cost) => ({ destination, cost })));
const counts = allCosts.reduce((acc, item) => {
  acc[item.cost.sourceType] = (acc[item.cost.sourceType] || 0) + 1;
  return acc;
}, {});

const criticalIssues = [
  {
    severity: 'critical',
    issue: 'UK proof-of-funds values are stale',
    currentAppValue: 'GBP 10,224 outside London and GBP 13,347 London',
    verifiedCurrentValue: 'GBP 10,539 outside London and GBP 13,761 London for up to 9 months',
    sourceUrl: sources.ukMoney.url,
    action: 'Replace UK livingOfficial min/max and source with GOV.UK before presenting these as official.'
  },
  {
    severity: 'critical',
    issue: 'Expanded destination regional values have no source URLs or last-checked dates',
    currentAppValue: 'Regional profiles drive up to 100 country estimates',
    verifiedCurrentValue: null,
    sourceUrl: null,
    action: 'Keep visible estimate labels and add source methodology before advertising as reliable country data.'
  },
  {
    severity: 'high',
    issue: 'Static FX table has no provider, timestamp, or refresh policy',
    currentAppValue: 'Hardcoded FX rates in study-abroad-backbone.js',
    verifiedCurrentValue: null,
    sourceUrl: null,
    action: 'Show FX date/source or keep CurrencyDisplay in estimate mode for all USD/local conversions.'
  },
  {
    severity: 'high',
    issue: 'Tuition ranges are not tied to official education or university sources',
    currentAppValue: 'Broad ranges by level and field',
    verifiedCurrentValue: null,
    sourceUrl: null,
    action: 'Label as typical ranges and prioritize official Study in country portals or named university tuition pages.'
  },
  {
    severity: 'high',
    issue: 'Germany blocked-account amount is not verified from the competent mission/portal in app data',
    currentAppValue: 'EUR 11,904 from DAAD planning guidance',
    verifiedCurrentValue: 'Federal Foreign Office says exact amount varies by purpose and should be checked with competent mission or Consular Services Portal',
    sourceUrl: sources.germanyBlocked.url,
    action: 'Do not label Germany proof-of-funds as official government exact value until a mission/portal source is attached.'
  }
];

const riskEngineValidation = {
  verdict: 'ready_with_warnings',
  findings: [
    'Risk considers budget vs upfront and first-year cost, funding source, scholarship reliance, duration, dependents, and destination confidence.',
    'Risk depends on low-confidence regional estimates for non-hero destinations and should display: "Risk estimate is approximate because some costs need verification."',
    'UK risk currently inherits stale GOV.UK financial requirement values through the hero model.',
    'Canada upfront/risk copy should clarify that CAD 22,895 excludes tuition and transportation, so tuition must remain part of first-year affordability pressure.',
    'Dependents are modeled with generic multipliers rather than country-specific official dependent requirements.'
  ]
};

const uiSourceLabelValidation = {
  verdict: 'partial',
  findings: [
    'The shared LastUpdatedSourceInfo component can display last checked, source link, confidence, and status.',
    'CurrencyDisplay already marks values as estimates when called with estimate:true, but does not expose FX source/date.',
    'Study Abroad assumption cards include one source link per destination, not per cost field.',
    'No structured sourceType/sourceUrl/confidence model exists for every Study Abroad cost category yet.'
  ],
  requiredLabels: [
    'Official visa requirement',
    'Official education source',
    'University source',
    'Estimated market cost',
    'Needs verification',
    'Last checked date',
    'Source link',
    'Confidence level'
  ]
};

const audit = {
  generatedAt,
  verdict: 'not_ready',
  destinationsAudited: destinations.length,
  costFieldsAudited: allCosts.length,
  officialGovernmentFields: counts.OFFICIAL_GOVERNMENT || 0,
  officialEducationFields: counts.OFFICIAL_EDUCATION || 0,
  verifiedInstitutionFields: counts.VERIFIED_INSTITUTION || 0,
  marketEstimateFields: counts.ESTIMATE_MARKET || 0,
  unknownOrUnverifiedFields: counts.UNKNOWN_OR_UNVERIFIED || 0,
  criticalIssues,
  sourceHierarchyUsed: [
    'Government immigration/visa sources',
    'Official education portals',
    'University/institution pages',
    'Clearly labeled estimates'
  ],
  heroDestinationsAudited: heroAudits.map((destination) => destination.country),
  riskEngineValidation,
  uiSourceLabelValidation,
  destinations
};

function valueText(value) {
  if (Array.isArray(value)) return `${value[0]}-${value[1]}`;
  if (value && typeof value === 'object') return Object.entries(value).map(([k, v]) => `${k}:${v}`).join('; ');
  if (value === null || value === undefined) return 'not modeled';
  return String(value);
}

function mdTable(rows) {
  return rows.join('\n');
}

const destinationSummary = destinations.map((destination) => {
  const localCounts = destination.costs.reduce((acc, cost) => {
    acc[cost.sourceType] = (acc[cost.sourceType] || 0) + 1;
    return acc;
  }, {});
  return `| ${destination.country} | ${destination.currency} | ${destination.status} | ${destination.costs.length} | ${localCounts.OFFICIAL_GOVERNMENT || 0} | ${localCounts.OFFICIAL_EDUCATION || 0} | ${localCounts.ESTIMATE_MARKET || 0} | ${localCounts.UNKNOWN_OR_UNVERIFIED || 0} |`;
});

const heroRows = heroAudits.flatMap((destination) => destination.costs.map((cost) => {
  const source = cost.sourceUrl ? `[${cost.sourceTitle || 'source'}](${cost.sourceUrl})` : 'missing';
  return `| ${destination.country} | ${cost.field} | ${valueText(cost.value)} | ${cost.sourceType} | ${source} | ${cost.supportsExactValue ? 'yes' : 'no'} | ${cost.currentFor2026 ? 'yes' : 'no'} | ${cost.confidence} | ${cost.recommendedDisplayLabel} | ${cost.recommendedAction} |`;
}));

const expandedRows = regionalAudits.map((destination) => {
  const lowOrUnknown = destination.costs.filter((cost) => cost.confidence === 'low' || cost.confidence === 'unknown').length;
  return `| ${destination.country} | ${destination.region} | ${destination.currency} | ${destination.destinationCityOrTier} | ${destination.costs.length} | ${lowOrUnknown} | ${destination.costs.map((cost) => cost.field).join(', ')} |`;
});

const sourceReliabilityRows = [
  ['GOV.UK Student visa money', sources.ukMoney.url, 'high', 'Official government source supports current UK visa fee and financial requirement values.'],
  ['GOV.UK financial evidence guidance', sources.ukFinancialEvidence.url, 'high', 'Official government source supports UK dependant funds and evidence rules.'],
  ['IRCC/Canada.ca proof of financial support', sources.canadaFunds.url, 'high', 'Official government source supports Canada living threshold and family amounts outside Quebec.'],
  ['IRCC fee list', sources.canadaFees.url, 'high', 'Official government source supports study permit and biometrics fees.'],
  ['Study Australia visa process', sources.australiaVisa.url, 'high', 'Official government education/visa surface supports AUD 29,710 financial capacity and warning that real living costs vary.'],
  ['Study Australia VAC increase', sources.australiaFee.url, 'high', 'Official source supports AUD 2,000 primary student visa charge from 1 July 2025.'],
  ['U.S. Department of State student visa page', sources.usVisa.url, 'high', 'Official source supports USD 185 MRV/application fee.'],
  ['U.S. ICE SEVIS I-901', sources.usSevis.url, 'high', 'Official source supports USD 350 F/M I-901 fee.'],
  ['EducationUSA finance guide', sources.usEducation.url, 'medium', 'Official education source supports strategy warning that costs vary by institution/location, not a single exact value.'],
  ['German Federal Foreign Office blocked account page', sources.germanyBlocked.url, 'medium', 'Official government source confirms proof logic but delegates exact amount to mission/portal.'],
  ['DAAD cost guide', sources.daadCosts.url, 'medium', 'Official education source supports EUR 992/month as planning guidance, but not a mission-specific exact visa source.'],
  ['Regional AfroTools estimates', 'missing', 'low', 'No source URL, source title, or last-checked date in app data.']
].map((row) => `| ${row[0]} | ${row[1] === 'missing' ? 'missing' : `[source](${row[1]})`} | ${row[2]} | ${row[3]} |`);

const markdown = `# Study Abroad Cost Data Quality Audit

Generated: ${generatedAt}

## Overall verdict

**Not ready.**

The tool is useful as a planning engine, but the current data layer is not yet safe to present as fully source-backed 2026 cost truth. Official visa-fee and proof-of-funds fields exist for the five hero destinations, but UK living/proof values are stale, Germany proof-of-funds needs mission/portal verification, tuition ranges are not institution-backed, regional data is unsourced, and FX rates have no source/date.

## Summary counts

| Metric | Count |
| --- | ---: |
| Destinations audited | ${audit.destinationsAudited} |
| Cost fields audited | ${audit.costFieldsAudited} |
| Official government fields | ${audit.officialGovernmentFields} |
| Official education fields | ${audit.officialEducationFields} |
| Verified institution fields | ${audit.verifiedInstitutionFields} |
| Market estimate fields | ${audit.marketEstimateFields} |
| Unknown or unverified fields | ${audit.unknownOrUnverifiedFields} |

## Critical blockers

${criticalIssues.map((issue, index) => `${index + 1}. **${issue.issue}.** ${issue.action}`).join('\n')}

## Source reliability

| Source | Link | Reliability | Use in audit |
| --- | --- | --- | --- |
${sourceReliabilityRows.join('\n')}

## Destination summary

| Destination | Currency | Status | Fields | Government | Education | Estimates | Unknown |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
${destinationSummary.join('\n')}

## Hero destination field audit

| Destination | Cost field | Current value used | Source type | Source | Exact value supported | Current for 2026 | Confidence | Display label | Recommended action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${heroRows.join('\n')}

## Expanded destination estimate audit

The expanded selector uses regional profiles for non-hero countries. These rows are valuable for discovery, but they must stay visibly labeled as estimates until destination-specific source URLs and last-checked dates exist.

| Destination | Region | Currency | City/tier | Fields audited | Low/unknown confidence fields | Fields |
| --- | --- | --- | --- | ---: | ---: | --- |
${expandedRows.join('\n')}

## Hero destination findings

### United Kingdom

- Current app values for UK living support use GBP 1,136/month outside London and GBP 1,483/month London from UKCISA guidance. Current GOV.UK values are GBP 1,171/month outside London and GBP 1,529/month London, each for up to 9 months.
- Student visa fee GBP 558 and IHS GBP 776/year are source-backed by GOV.UK.
- Dependant funds are not modeled exactly; GOV.UK has country-specific dependant amounts.
- Tuition ranges remain typical estimates and must point users to CAS/university pricing.

### Canada

- CAD 22,895 outside Quebec is source-backed for one applicant from 1 September 2025.
- Canada.ca explicitly says this amount excludes tuition and transportation costs. Risk/upfront copy must not imply the proof floor alone covers the first-year plan.
- Study permit CAD 150 and biometrics CAD 85 are source-backed by IRCC.
- Quebec needs an explicit exception note and separate source path.

### Australia

- AUD 29,710 financial capacity and AUD 2,000 primary student visa charge are source-backed.
- Study Australia warns actual living costs vary and may be higher than the visa minimum.
- OSHC and tuition remain estimates unless tied to provider/course sources.

### USA

- USD 185 student visa fee and USD 350 SEVIS I-901 fee are source-backed.
- Tuition, living, and proof strategy must remain institution-specific because Form I-20/COA varies by school.
- EducationUSA supports the warning that cost varies by institution and location; it does not support a single official national tuition number.

### Germany

- EUR 11,904 / EUR 992 per month is supported by DAAD as official education planning guidance, but the Federal Foreign Office page says applicants should verify the blocked-account amount with the competent mission or Consular Services Portal.
- EUR 75 national visa fee is source-backed by the Federal Foreign Office.
- Health insurance, semester contribution, and tuition by state/institution need explicit estimate or university/source labels.

## UI/source-label validation

Verdict: **${uiSourceLabelValidation.verdict}**

${uiSourceLabelValidation.findings.map((finding) => `- ${finding}`).join('\n')}

Required safe labels:

${uiSourceLabelValidation.requiredLabels.map((label) => `- ${label}`).join('\n')}

## Risk engine validation

Verdict: **${riskEngineValidation.verdict}**

${riskEngineValidation.findings.map((finding) => `- ${finding}`).join('\n')}

If any low-confidence or regional estimate contributes to a result, the UI should show: **Risk estimate is approximate because some costs need verification.**

## Safe display logic

- Government visa, proof-of-funds, IHS, biometrics, SEVIS, and blocked-account values should display as official only when their exact value is tied to an official government URL and a last-checked date.
- Tuition ranges should display as **Typical tuition range, verify with the university** unless tied to an official education portal or named university page.
- Flights, arrival setup, rent, groceries, local transport, insurance estimates, and regional averages should display as **Estimated market cost, not official**.
- FX conversions should display as estimates unless the rate source and FX date are shown.
- Germany blocked-account copy should say **Proof-of-funds value needs official mission verification** until the exact mission/portal source is stored.
- If an official source says actual living costs may be higher than the visa minimum, the result should repeat that warning near the risk display.

## Recommended next actions

1. Update UK livingOfficial min/max and source to GOV.UK.
2. Add structured source metadata per cost row: sourceType, sourceUrl, sourceTitle, sourceDate, lastChecked, confidence, supportsExactValue.
3. Add FX provider/date or keep all USD/local conversions in estimate mode with visible FX caveat.
4. Add country-specific dependant rules for UK, Canada, Australia, and any country where official dependant requirements exist.
5. Split official visa/proof values from market living estimates in the result model.
6. Start enrichment with the five hero destinations before claiming source-backed data for the expanded 100-country selector.

## Commands and evidence

- Read current implementation: tools/study-abroad-cost/index.html, tools/study-abroad-cost/study-abroad-cost.js, tools/study-abroad-cost/study-abroad-backbone.js, tools/study-abroad-cost/study-abroad-upgrade.css, assets/js/components/product-backbone.js, tools/scholarship-finder/scholarship-finder-upgrade.js.
- Verified current official source pages on ${lastChecked}.
- Machine-readable details are in audit-results/study-abroad-cost-data-quality.json.
`;

ensureDir('audit-results');
fs.writeFileSync(path.join(root, 'audit-results/study-abroad-cost-data-quality.json'), JSON.stringify(audit, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'audit-results/study-abroad-cost-data-quality.md'), markdown);

console.log(JSON.stringify({
  generatedAt,
  verdict: audit.verdict,
  destinationsAudited: audit.destinationsAudited,
  costFieldsAudited: audit.costFieldsAudited
}, null, 2));
