const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const ROOT = process.cwd();
const REVIEW_DATE = '27 April 2026';

const sourceBank = {
  bmi: ['CDC BMI categories', 'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html'],
  healthyDiet: ['WHO healthy diet', 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet'],
  physicalActivity: ['WHO physical activity', 'https://www.who.int/news-room/fact-sheets/detail/physical-activity'],
  antenatal: ['WHO antenatal care recommendations', 'https://www.who.int/publications/i/item/9789241549912'],
  breastfeeding: ['WHO breastfeeding', 'https://www.who.int/health-topics/breastfeeding'],
  immunization: ['WHO immunization coverage', 'https://www.who.int/news-room/fact-sheets/detail/immunization-coverage'],
  childGrowth: ['WHO child growth standards', 'https://www.who.int/tools/child-growth-standards'],
  malaria: ['WHO malaria', 'https://www.who.int/news-room/fact-sheets/detail/malaria'],
  water: ['WHO drinking water', 'https://www.who.int/news-room/fact-sheets/detail/drinking-water'],
  hypertension: ['WHO hypertension', 'https://www.who.int/news-room/fact-sheets/detail/hypertension'],
  diabetes: ['WHO diabetes', 'https://www.who.int/news-room/fact-sheets/detail/diabetes'],
  hiv: ['WHO HIV', 'https://www.who.int/news-room/fact-sheets/detail/hiv-aids'],
  tb: ['WHO tuberculosis', 'https://www.who.int/news-room/fact-sheets/detail/tuberculosis'],
  cholera: ['WHO cholera', 'https://www.who.int/news-room/fact-sheets/detail/cholera'],
  ebola: ['WHO Ebola disease', 'https://www.who.int/news-room/fact-sheets/detail/ebola-virus-disease'],
  hepatitisB: ['WHO hepatitis B', 'https://www.who.int/news-room/fact-sheets/detail/hepatitis-b'],
  mentalHealth: ['WHO mental health response', 'https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response'],
  sickle: ['CDC sickle cell disease', 'https://www.cdc.gov/sickle-cell/about/index.html'],
  medicines: ['WHO essential medicines', 'https://www.who.int/groups/expert-committee-on-selection-and-use-of-essential-medicines/essential-medicines-lists'],
  medicalTourism: ['CDC medical tourism', 'https://wwwnc.cdc.gov/travel/page/medical-tourism'],
};

const bucketById = {
  'bmi-calculator': 'vitals',
  'blood-pressure': 'vitals',
  'diabetes-risk': 'vitals',
  'waist-hip-ratio': 'vitals',
  'water-intake': 'vitals',
  'bmi-calc-tools': 'vitals',
  'medical-report': 'labs',
  'genotype-checker': 'labs',
  'blood-group': 'labs',
  'sickle-cell': 'labs',
  'calorie-counter': 'nutrition',
  'african-meal-plan': 'nutrition',
  'home-workout': 'nutrition',
  'gym-cost-compare': 'nutrition',
  'calorie-counter-tools': 'nutrition',
  'due-date': 'family',
  'ovulation-calc': 'family',
  'maternal-mortality': 'family',
  'childbirth-cost': 'family',
  'csection-vs-natural': 'family',
  'pregnancy-nutrition': 'family',
  'child-growth': 'family',
  'breastfeeding-tracker': 'family',
  'vaccine-schedule': 'family',
  'due-date-tools': 'family',
  'hospital-cost': 'costs',
  'clinic-costs': 'costs',
  'pharmacy-prices': 'costs',
  'dental-cost': 'costs',
  'drug-price-compare': 'costs',
  'traditional-vs-western': 'costs',
  'medical-tourism': 'costs',
  'eye-care-cost': 'costs',
  'mental-health-cost': 'costs',
  'drug-dosage': 'clinical',
  'malaria-risk': 'clinical',
  'water-quality': 'clinical',
  'hiv-treatment-cost': 'clinical',
  'tb-tracker': 'clinical',
  'cholera-risk': 'clinical',
  'ebola-checklist': 'clinical',
  'hep-b-screening': 'clinical',
};

const bucketProfiles = {
  vitals: {
    summary: 'Use this as a screening and trend tool, not a diagnosis. The useful output is a number, a context band, and a clear next step for a clinic conversation.',
    decisions: ['Whether the reading is worth tracking over time', 'Which lifestyle or follow-up question to raise with a clinician', 'Whether another health tool should be opened next'],
    checklist: ['Enter recent measurements and repeat them under similar conditions', 'Save the result with date, units, and context such as activity or illness', 'Use the result to prepare better questions for a health worker'],
    redFlags: ['Severe symptoms with an abnormal reading', 'Repeated high or low readings without follow-up', 'Using one calculator result to start, stop, or change treatment'],
    sources: ['bmi', 'hypertension', 'diabetes', 'physicalActivity'],
    related: ['bmi-calculator', 'blood-pressure', 'diabetes-risk', 'waist-hip-ratio'],
  },
  labs: {
    summary: 'These tools help turn technical health information into plain-language questions. They should make the user better prepared, not more confident than their clinician.',
    decisions: ['Which result or compatibility issue needs a doctor, lab, or genetic counsellor', 'Which family or partner conversation needs documented evidence', 'Which records to bring to the next appointment'],
    checklist: ['Use verified lab reports or confirmed genotype/blood group records', 'Write down questions before acting on the result', 'Keep personal health data private and avoid posting raw reports publicly'],
    redFlags: ['A result marked critical, very high, or very low', 'Symptoms that do not match a reassuring calculator output', 'Marriage, pregnancy, or transfusion decisions without professional counselling'],
    sources: ['sickle', 'medicines', 'antenatal'],
    related: ['medical-report', 'genotype-checker', 'blood-group', 'sickle-cell'],
  },
  nutrition: {
    summary: 'These apps are strongest when they translate local foods and everyday activity into a practical plan the user can repeat for a week.',
    decisions: ['Whether the meal, budget, or activity plan matches a realistic daily routine', 'Which local foods can improve protein, fibre, hydration, or calorie balance', 'Whether a paid gym or home routine gives the better habit loop'],
    checklist: ['Pick foods the household actually eats', 'Adjust targets for pregnancy, illness, hard labour, or clinician advice', 'Review progress weekly instead of chasing a perfect single day'],
    redFlags: ['Very low calorie targets', 'Rapid weight loss plans during pregnancy or illness', 'Exercise with chest pain, fainting, severe breathlessness, or injury'],
    sources: ['healthyDiet', 'physicalActivity', 'breastfeeding'],
    related: ['calorie-counter', 'african-meal-plan', 'home-workout', 'gym-cost-compare'],
  },
  family: {
    summary: 'Family-health tools should turn dates, costs, growth, feeding, and vaccine questions into safer preparation for antenatal, paediatric, and community health visits.',
    decisions: ['Which appointment, vaccine, or milestone needs attention next', 'What the household should budget or prepare before care is needed', 'Which warning signs should move the family from planning to urgent care'],
    checklist: ['Record dates, facility name, and provider instructions', 'Bring the result to antenatal, delivery, paediatric, or immunisation visits', 'Use local clinic guidance as the final authority'],
    redFlags: ['Bleeding, severe headache, fever, reduced fetal movement, or seizures in pregnancy', 'A child with lethargy, dehydration, breathing difficulty, or persistent fever', 'Missed vaccines or growth concerns without a clinic follow-up plan'],
    sources: ['antenatal', 'immunization', 'childGrowth', 'breastfeeding'],
    related: ['due-date', 'vaccine-schedule', 'child-growth', 'pregnancy-nutrition'],
  },
  costs: {
    summary: 'Cost tools are most useful when they separate medical urgency from financial planning. They should help compare quotes and coverage without delaying needed care.',
    decisions: ['Which care quote, pharmacy price, or coverage option needs verification', 'What out-of-pocket cost may remain after insurance or public coverage', 'Which documents, invoices, or proof should be saved'],
    checklist: ['Replace defaults with current local quotes before deciding', 'Check what is included, excluded, and refundable', 'Save facility name, date, currency, and proof source'],
    redFlags: ['Delaying emergency care because a cost estimate is incomplete', 'Buying medicines from unverifiable sources', 'Choosing treatment abroad without follow-up and complication plans'],
    sources: ['medicines', 'medicalTourism', 'mentalHealth'],
    related: ['hospital-cost', 'clinic-costs', 'pharmacy-prices', 'drug-price-compare'],
  },
  clinical: {
    summary: 'Clinical utilities must stay conservative. They should help the user organise prevention, adherence, water safety, and escalation signals without replacing clinical judgement.',
    decisions: ['Whether prevention or follow-up steps are missing', 'Which dates, doses, symptoms, or exposure details should be documented', 'When the situation should move from self-checking to urgent care'],
    checklist: ['Use the tool as a checklist or tracker, not a treatment order', 'Confirm medication, test, vaccine, and outbreak guidance locally', 'Save the result for a clinician or community health worker'],
    redFlags: ['Severe dehydration, confusion, breathing difficulty, bleeding, or high fever', 'Missed treatment doses without clinic guidance', 'Known outbreak exposure with symptoms'],
    sources: ['malaria', 'water', 'hiv', 'tb', 'cholera', 'ebola', 'hepatitisB'],
    related: ['drug-dosage', 'malaria-risk', 'water-quality', 'tb-tracker'],
  },
};

const profileOverrides = {
  'medical-report': {
    summary: 'The interpreter already parses common biomarkers. The upgrade adds a safer decision layer around privacy, doctor questions, red flags, and source-backed interpretation limits.',
    decisions: ['Which marker is outside the reference range', 'Which result needs a repeat test or clinician explanation', 'Which questions to ask before changing diet, supplements, or medication'],
  },
  'drug-dosage': {
    summary: 'Dosage tools are high-risk, so the added layer pushes verification, age/weight checks, formulation awareness, and professional confirmation before use.',
    redFlags: ['Infants, pregnancy, liver or kidney disease, allergies, or multiple medicines', 'Dose units that do not match the bottle, tablet, or suspension strength', 'Any overdose, poisoning concern, or severe reaction'],
  },
  'clinic-costs': {
    summary: 'The community feed is now positioned as proof-backed market intelligence with care-context prompts, not just a raw price board.',
    sources: ['medicines', 'mentalHealth'],
  },
  'pharmacy-prices': {
    summary: 'The pharmacy feed now emphasises generic comparison, pack-size proof, expiry checks, and safe purchasing signals.',
    redFlags: ['No NAFDAC, PPB, SAHPRA, FDA, or local regulator markings where required', 'Prices that seem unusually low for a controlled or specialist medicine', 'Medicine substitutions without pharmacist or prescriber confirmation'],
  },
};

const generatedApps = {
  'hiv-treatment-cost': {
    type: 'cost-estimator',
    buttonLabel: 'Estimate HIV Care Budget',
    defaultCurrency: 'USD',
    intro: 'Plan an annual HIV care budget from your own clinic quote. Keep ART, labs, visits, transport, and coverage separate so the real out-of-pocket number is visible.',
    nextAction: 'Confirm medicine supply, viral-load schedule, refill timing, and emergency contacts with your HIV clinic.',
    fields: [
      { id: 'currency', type: 'text', label: 'Currency code', value: 'USD' },
      { id: 'baseCost', type: 'number', label: 'Monthly medicine or clinic cost', value: '0', min: '0' },
      { id: 'units', type: 'number', label: 'Months to plan', value: '12', min: '1', max: '24' },
      { id: 'transport', type: 'number', label: 'Annual transport and refill trips', value: '0', min: '0' },
      { id: 'addOn', type: 'number', label: 'Annual labs or extra tests', value: '0', min: '0' },
      { id: 'coverage', type: 'number', label: 'Coverage or subsidy percent', value: '0', min: '0', max: '100' },
    ],
  },
  'tb-tracker': {
    type: 'schedule-tracker',
    buttonLabel: 'Build TB Tracker',
    intro: 'Track the treatment timeline you were given and prepare better adherence questions for your clinic.',
    defaultMonths: 6,
    fields: [
      { id: 'startDate', type: 'date', label: 'Treatment start date' },
      { id: 'months', type: 'number', label: 'Planned treatment months', value: '6', min: '1', max: '24' },
      { id: 'completedDays', type: 'number', label: 'Treatment days completed', value: '0', min: '0' },
      { id: 'missedDoses', type: 'number', label: 'Missed doses to discuss', value: '0', min: '0' },
    ],
  },
  'cholera-risk': {
    type: 'risk-checklist',
    buttonLabel: 'Assess Cholera Risk',
    intro: 'Use this as a prevention and escalation checklist when there is unsafe water, flooding, an outbreak alert, or symptoms.',
    mediumAt: 2,
    highAt: 5,
    immediateStep: 'Use safe water, handwashing, sanitation, and oral rehydration while seeking care for symptoms.',
    escalate: 'Severe dehydration, lethargy, inability to drink, persistent vomiting, or watery diarrhoea in a child needs urgent care.',
    checks: [
      { label: 'Recent local cholera alert, flooding, or contaminated water warning', weight: 2 },
      { label: 'Household water is untreated or stored uncovered', weight: 1 },
      { label: 'No reliable soap or handwashing station near toilet or food area', weight: 1 },
      { label: 'Watery diarrhoea or vomiting is present', weight: 3 },
      { label: 'Signs of dehydration such as very little urine, dizziness, sunken eyes, or weakness', weight: 3 },
    ],
  },
  'ebola-checklist': {
    type: 'risk-checklist',
    buttonLabel: 'Run Ebola Preparedness Check',
    intro: 'A conservative preparedness checklist for communities and health workers in areas with an official alert or known exposure risk.',
    mediumAt: 2,
    highAt: 4,
    immediateStep: 'Follow local outbreak instructions, reduce contact, and call the designated health line for exposure or symptoms.',
    escalate: 'Known contact with a confirmed case plus fever, bleeding, vomiting, diarrhoea, or weakness needs immediate official guidance.',
    checks: [
      { label: 'Official Ebola alert or confirmed case in the area', weight: 2 },
      { label: 'Direct contact with body fluids, bedding, clothing, or burial handling for a suspected case', weight: 3 },
      { label: 'Fever, severe weakness, vomiting, diarrhoea, or unexplained bleeding', weight: 3 },
      { label: 'No isolation plan or contact list for the household or facility', weight: 1 },
      { label: 'Health worker or caregiver without appropriate protective supplies and training', weight: 2 },
    ],
  },
  'hep-b-screening': {
    type: 'cost-estimator',
    buttonLabel: 'Estimate Hepatitis B Screening Cost',
    defaultCurrency: 'USD',
    intro: 'Plan HBsAg screening, confirmatory tests, vaccination doses, household screening, and follow-up with editable local prices.',
    nextAction: 'Ask the clinic which test is being used, whether vaccination is needed, and whether household contacts should be screened.',
    fields: [
      { id: 'currency', type: 'text', label: 'Currency code', value: 'USD' },
      { id: 'baseCost', type: 'number', label: 'Screening or vaccine dose price', value: '0', min: '0' },
      { id: 'units', type: 'number', label: 'Number of tests or doses', value: '3', min: '1', max: '20' },
      { id: 'transport', type: 'number', label: 'Transport and visit costs', value: '0', min: '0' },
      { id: 'addOn', type: 'number', label: 'Follow-up or household tests', value: '0', min: '0' },
      { id: 'coverage', type: 'number', label: 'Coverage or subsidy percent', value: '0', min: '0', max: '100' },
    ],
  },
  'medical-tourism': {
    type: 'compare',
    buttonLabel: 'Compare Treatment Options',
    defaultCurrency: 'USD',
    intro: 'Compare a local treatment quote with a destination quote, then add travel, stay, companion, and complication buffer.',
    nextAction: 'Verify the surgeon, facility accreditation, follow-up care, complication plan, visa, and travel insurance before paying.',
    fields: [
      { id: 'currency', type: 'text', label: 'Currency code', value: 'USD' },
      { id: 'firstCost', type: 'number', label: 'Destination procedure quote', value: '0', min: '0' },
      { id: 'firstRepeat', type: 'number', label: 'Destination quote multiplier', value: '1', min: '1' },
      { id: 'travel', type: 'number', label: 'Flights, visa, hotel, companion', value: '0', min: '0' },
      { id: 'buffer', type: 'number', label: 'Follow-up or complication buffer', value: '0', min: '0' },
      { id: 'secondCost', type: 'number', label: 'Local treatment quote', value: '0', min: '0' },
      { id: 'secondRepeat', type: 'number', label: 'Local quote multiplier', value: '1', min: '1' },
    ],
  },
  'eye-care-cost': {
    type: 'cost-estimator',
    buttonLabel: 'Estimate Eye Care Cost',
    defaultCurrency: 'USD',
    intro: 'Estimate eye exam, glasses, contact lenses, cataract surgery, or follow-up costs using your own local quote.',
    nextAction: 'Confirm diagnosis, lens/procedure details, follow-up visits, and emergency signs with an eye-care professional.',
    fields: [
      { id: 'currency', type: 'text', label: 'Currency code', value: 'USD' },
      { id: 'baseCost', type: 'number', label: 'Procedure or item quote', value: '0', min: '0' },
      { id: 'units', type: 'number', label: 'Quantity or visits', value: '1', min: '1' },
      { id: 'transport', type: 'number', label: 'Transport and follow-up', value: '0', min: '0' },
      { id: 'addOn', type: 'number', label: 'Medicine, lenses, or tests', value: '0', min: '0' },
      { id: 'coverage', type: 'number', label: 'Coverage percent', value: '0', min: '0', max: '100' },
    ],
  },
  'mental-health-cost': {
    type: 'cost-estimator',
    buttonLabel: 'Estimate Monthly Mental Health Cost',
    defaultCurrency: 'USD',
    intro: 'Plan therapy, psychiatry, medication, transport, and coverage for one month so care is easier to sustain.',
    nextAction: 'Ask about session frequency, crisis contacts, medication review dates, and lower-cost community or telehealth options.',
    fields: [
      { id: 'currency', type: 'text', label: 'Currency code', value: 'USD' },
      { id: 'baseCost', type: 'number', label: 'Therapy or counselling session cost', value: '0', min: '0' },
      { id: 'units', type: 'number', label: 'Sessions per month', value: '4', min: '1', max: '31' },
      { id: 'transport', type: 'number', label: 'Monthly transport or data cost', value: '0', min: '0' },
      { id: 'addOn', type: 'number', label: 'Medication or psychiatry cost', value: '0', min: '0' },
      { id: 'coverage', type: 'number', label: 'Coverage percent', value: '0', min: '0', max: '100' },
    ],
  },
  'pregnancy-nutrition': {
    type: 'nutrition',
    buttonLabel: 'Estimate Pregnancy Nutrition Targets',
    intro: 'Estimate practical daily energy and protein targets from weight, trimester, and activity, then translate them into African food choices.',
    fields: [
      { id: 'weightKg', type: 'number', label: 'Current weight in kg', value: '70', min: '35', max: '180' },
      { id: 'trimester', type: 'select', label: 'Trimester', options: [{ value: '1', label: 'First trimester' }, { value: '2', label: 'Second trimester' }, { value: '3', label: 'Third trimester' }] },
      { id: 'activity', type: 'select', label: 'Activity level', options: [{ value: 'low', label: 'Low activity' }, { value: 'moderate', label: 'Moderate activity' }, { value: 'high', label: 'High activity or physical work' }] },
    ],
  },
  'breastfeeding-tracker': {
    type: 'feeding-tracker',
    buttonLabel: 'Log Feeding Session',
    intro: 'Track feeding side and duration on this device. Use the log to support conversations with a nurse, midwife, lactation counsellor, or paediatric clinic.',
    fields: [
      { id: 'side', type: 'select', label: 'Side or method', options: ['Left', 'Right', 'Both', 'Expressed milk', 'Formula supplement'] },
      { id: 'minutes', type: 'number', label: 'Duration in minutes', value: '15', min: '1', max: '120' },
    ],
  },
  'gym-cost-compare': {
    type: 'compare',
    buttonLabel: 'Compare Gym vs Home Cost',
    defaultCurrency: 'USD',
    intro: 'Compare a gym membership with a home-workout setup, including transport and once-off equipment.',
    nextAction: 'Choose the option you can repeat safely for months, not the one that looks cheapest on day one.',
    fields: [
      { id: 'currency', type: 'text', label: 'Currency code', value: 'USD' },
      { id: 'firstCost', type: 'number', label: 'Monthly gym fee', value: '0', min: '0' },
      { id: 'firstRepeat', type: 'number', label: 'Months to compare', value: '12', min: '1', max: '24' },
      { id: 'travel', type: 'number', label: 'Monthly transport cost', value: '0', min: '0' },
      { id: 'buffer', type: 'number', label: 'Joining fee or trainer cost', value: '0', min: '0' },
      { id: 'secondCost', type: 'number', label: 'Home equipment once-off', value: '0', min: '0' },
      { id: 'secondRepeat', type: 'number', label: 'Home equipment multiplier', value: '1', min: '1' },
    ],
  },
  'home-workout': {
    type: 'activity',
    buttonLabel: 'Estimate Calories Burned',
    intro: 'Estimate calories from common home workouts and everyday African activities, then use the number for planning rather than punishment.',
    fields: [
      { id: 'weightKg', type: 'number', label: 'Weight in kg', value: '70', min: '25', max: '250' },
      { id: 'minutes', type: 'number', label: 'Minutes', value: '30', min: '1', max: '300' },
      { id: 'activity', type: 'select', label: 'Activity', options: [{ value: '3.5', label: 'Brisk walking' }, { value: '5', label: 'Home aerobics or dance' }, { value: '6', label: 'Bodyweight circuit' }, { value: '4.5', label: 'Farming or heavy household work' }, { value: '7', label: 'Running or football drills' }] },
    ],
  },
};

function htmlEscape(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function list(items) {
  return items.map((item) => `<li>${htmlEscape(item)}</li>`).join('');
}

function loadRegistry() {
  const code = fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8');
  const doc = {
    addEventListener() {},
    dispatchEvent() {},
    getElementById() { return null; },
    createElement() { return { style: {}, setAttribute() {}, appendChild() {}, innerHTML: '' }; },
    head: { appendChild() {} },
  };
  const ctx = { window: {}, document: doc, CustomEvent: function CustomEvent() {}, console };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return ctx.AFRO_TOOLS || ctx.window.AFRO_TOOLS || [];
}

function fileForHref(href) {
  let page = href.split('?')[0].replace(/^\//, '');
  if (page.endsWith('/')) page += 'index.html';
  else if (!page.endsWith('.html')) {
    if (fs.existsSync(path.join(ROOT, page, 'index.html'))) page += '/index.html';
    else page += '.html';
  }
  return path.join(ROOT, page);
}

function sourceLinks(keys) {
  return keys
    .map((key) => sourceBank[key])
    .filter(Boolean)
    .map(([label, href]) => `<a href="${htmlEscape(href)}">${htmlEscape(label)}</a>`)
    .join('');
}

function relatedLinks(ids, registryById) {
  return ids
    .map((id) => registryById[id])
    .filter(Boolean)
    .map((tool) => `<a href="${htmlEscape(tool.href)}">${htmlEscape(tool.name)}</a>`)
    .join('');
}

function profileFor(tool) {
  const bucket = bucketById[tool.id] || 'clinical';
  const base = bucketProfiles[bucket];
  const override = profileOverrides[tool.id] || {};
  return {
    id: tool.id,
    title: tool.name,
    href: tool.href,
    bucket,
    summary: override.summary || base.summary,
    decisions: override.decisions || base.decisions,
    checklist: override.checklist || base.checklist,
    redFlags: override.redFlags || base.redFlags,
    sources: override.sources || base.sources,
    related: override.related || base.related,
    generated: Boolean(generatedApps[tool.id]),
  };
}

function buildDeepSection(profile, registryById) {
  return [
    '<!-- HEALTH-DEEP-IMPROVEMENT:START -->',
    '<section class="health-deep" aria-labelledby="health-deep-title">',
    `<span class="health-deep-kicker">Deep Review - ${htmlEscape(REVIEW_DATE)}</span>`,
    `<h2 id="health-deep-title">Use ${htmlEscape(profile.title)} in a safer care workflow</h2>`,
    `<p class="health-deep-lead">${htmlEscape(profile.summary)}</p>`,
    '<div class="health-deep-grid">',
    `<div class="health-deep-block"><h3>Use It To Decide</h3><ul>${list(profile.decisions)}</ul></div>`,
    `<div class="health-deep-block"><h3>Better Workflow</h3><ul>${list(profile.checklist)}</ul></div>`,
    `<div class="health-deep-block warning"><h3>Do Not Ignore</h3><ul>${list(profile.redFlags)}</ul></div>`,
    '</div>',
    '<div class="health-source-row">',
    `<div><span>Official Context</span><div class="health-source-links">${sourceLinks(profile.sources)}</div></div>`,
    `<div><span>Related AfroTools</span><div class="health-source-links internal">${relatedLinks(profile.related, registryById)}</div></div>`,
    '</div>',
    '</section>',
    '<!-- HEALTH-DEEP-IMPROVEMENT:END -->',
  ].join('\n');
}

function upsertBlock(html, start, end, block, markers) {
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end);
  if (startIndex !== -1 && endIndex !== -1) {
    return html.slice(0, startIndex) + block + html.slice(endIndex + end.length);
  }
  const marker = markers
    .map((value) => ({ value, index: html.indexOf(value) }))
    .filter((item) => item.index !== -1)
    .sort((a, b) => a.index - b.index)[0];
  if (!marker) throw new Error('No insertion marker found');
  return html.slice(0, marker.index) + block + '\n' + html.slice(marker.index);
}

function ensureHealthCss(html) {
  const href = '/assets/css/health-enhancements.css';
  if (html.includes(href)) return html;
  const link = '<link rel="stylesheet" href="/assets/css/health-enhancements.css">';
  if (html.includes('</head>')) return html.replace('</head>', `${link}\n</head>`);
  return html;
}

function assetHash(relPath) {
  const file = path.join(ROOT, relPath);
  if (!fs.existsSync(file)) return null;
  const content = fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n');
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

function ensureRegistryScript(html) {
  const hash = assetHash('assets/js/components/tool-registry.min.js');
  const src = `/assets/js/components/tool-registry.min.js${hash ? `?v=${hash}` : ''}`;
  const tag = `<script src="${src}" defer></script>`;
  if (/\/assets\/js\/components\/tool-registry\.min\.js(?:\?v=[a-f0-9]+)?/.test(html)) {
    return html.replace(/<script src="\/assets\/js\/components\/tool-registry\.min\.js(?:\?v=[a-f0-9]+)?" defer><\/script>/, tag);
  }
  if (html.includes('<script src="/assets/js/components/health-taxonomy.js')) {
    return html.replace('<script src="/assets/js/components/health-taxonomy.js', `${tag}\n<script src="/assets/js/components/health-taxonomy.js`);
  }
  return html;
}

function updateExistingTool(tool, profile, registryById) {
  const file = fileForHref(tool.href);
  if (!fs.existsSync(file)) return false;
  const current = fs.readFileSync(file, 'utf8');
  let next = ensureHealthCss(current);
  next = upsertBlock(
    next,
    '<!-- HEALTH-DEEP-IMPROVEMENT:START -->',
    '<!-- HEALTH-DEEP-IMPROVEMENT:END -->',
    buildDeepSection(profile, registryById),
    ['<afro-footer', '<script defer src="https://www.googletagmanager.com', '</body>']
  );
  if (next !== current) fs.writeFileSync(file, next);
  return next !== current;
}

function buildGeneratedPage(tool, profile, app, registryById) {
  const canonical = `https://afrotools.com${tool.href}`;
  const badges = [
    profile.bucket.replace(/-/g, ' '),
    app.type.replace(/-/g, ' '),
    'informational',
  ].map((badge) => `<span class="health-app-badge">${htmlEscape(badge)}</span>`).join('');
  const config = {
    id: tool.id,
    type: app.type,
    buttonLabel: app.buttonLabel,
    defaultCurrency: app.defaultCurrency,
    intro: app.intro,
    nextAction: app.nextAction,
    disclaimer: 'Health information only. Confirm medical decisions, medicines, tests, outbreak actions, and emergency care with qualified local health services.',
    fields: app.fields,
    checks: app.checks,
    mediumAt: app.mediumAt,
    highAt: app.highAt,
    immediateStep: app.immediateStep,
    escalate: app.escalate,
    note: app.note,
  };
  return [
    '<!DOCTYPE html>',
    '<html data-chat-bundle="/assets/js/bundles/chat.e57fe38a.min.js" lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<meta name="view-transition" content="same-origin">',
    `<title>${htmlEscape(tool.name)} | AfroTools</title>`,
    `<meta name="description" content="${htmlEscape(tool.desc)}">`,
    `<link rel="canonical" href="${htmlEscape(canonical)}">`,
    '<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">',
    '<link rel="stylesheet" href="/assets/css/tokens.min.css?v=6977389f">',
    '<link rel="stylesheet" href="/assets/css/global.min.css?v=c94dde91">',
    '<link rel="stylesheet" href="/assets/css/health-enhancements.css">',
    '<script src="/assets/js/components/navbar.min.js?v=43e4d9b2" defer></script>',
    '<script src="/assets/js/components/footer.min.js?v=d0d64671" defer></script>',
    `<meta property="og:title" content="${htmlEscape(tool.name)} | AfroTools">`,
    `<meta property="og:description" content="${htmlEscape(tool.desc)}">`,
    '<meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">',
    `<meta property="og:url" content="${htmlEscape(canonical)}">`,
    '<meta property="og:type" content="website">',
    `<meta name="tool-id" content="${htmlEscape(tool.id)}">`,
    '<script type="application/ld+json">' + JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.name,
      description: tool.desc,
      url: canonical,
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' },
    }) + '</script>',
    '</head>',
    '<body class="health-app-page">',
    '<afro-navbar active="health"></afro-navbar>',
    '<div class="health-app-wrap"><nav class="health-app-breadcrumb" aria-label="Breadcrumb"><a href="/">AfroTools</a> / <a href="/health/">Health</a> / <span>' + htmlEscape(tool.name) + '</span></nav></div>',
    '<section class="health-app-hero"><div class="health-app-wrap">',
    '<span class="health-app-kicker">Health Tool</span>',
    `<h1>${htmlEscape(tool.name)}</h1>`,
    `<p>${htmlEscape(tool.desc)}</p>`,
    `<div class="health-app-badges">${badges}</div>`,
    '</div></section>',
    '<main class="health-app-wrap">',
    '<section class="health-app-shell" aria-labelledby="health-app-title">',
    '<span class="health-app-kicker">Interactive Planner</span>',
    `<h2 id="health-app-title">${htmlEscape(app.buttonLabel || 'Use Tool')}</h2>`,
    '<div id="health-app-root"></div>',
    '</section>',
    buildDeepSection(profile, registryById),
    '</main>',
    '<afro-footer></afro-footer>',
    '<script>window.HEALTH_TOOL_CONFIG=' + JSON.stringify(config) + ';</script>',
    '<script src="/assets/js/health-tool-runtime.js"></script>',
    '<script defer src="https://www.googletagmanager.com/gtag/js?id=G-D859CGF391"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","G-D859CGF391");</script>',
    '</body>',
    '</html>',
  ].join('\n');
}

function writeGeneratedTool(tool, profile, registryById) {
  const app = generatedApps[tool.id];
  if (!app) return false;
  const file = fileForHref(tool.href);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const next = buildGeneratedPage(tool, profile, app, registryById);
  if (next !== current) fs.writeFileSync(file, next);
  return next !== current;
}

function updateRegistry() {
  const file = path.join(ROOT, 'assets/js/components/tool-registry.js');
  const current = fs.readFileSync(file, 'utf8');
  let next = current
    .replace("desc: '40 registry-backed health tools across vitals, lab interpretation, nutrition, family health, costs, and clinical utilities.'", "desc: '42 registry-backed health tools across vitals, lab interpretation, nutrition, family health, costs, community price feeds, and clinical utilities.'");
  Object.keys(generatedApps).forEach((id) => {
    const lineRegex = new RegExp(`(id: '${id}'[\\s\\S]*?status: ')queued(', phase: ')QUEUED(')`);
    next = next.replace(lineRegex, `$1live$2LIVE$3`);
  });
  if (next !== current) fs.writeFileSync(file, next);
  return next !== current;
}

function updateHealthHub() {
  const files = [
    path.join(ROOT, 'health/index.html'),
    path.join(ROOT, 'health/costs/index.html'),
    path.join(ROOT, 'health/insurance/index.html'),
  ];
  let changed = 0;
  files.forEach((file) => {
    const current = fs.readFileSync(file, 'utf8');
    let next = ensureRegistryScript(ensureHealthCss(current))
      .replace(/40 Registry Tools/g, '42 Registry Tools')
      .replace(/40 registry-backed/g, '42 registry-backed')
      .replace(/40 registry tools/g, '42 registry tools')
      .replace(/40 tools/g, '42 tools')
      .replace(/40<\/div>\s*<div class="health-route-hero-stat-label">Total Health registry tools/g, '42</div>\n        <div class="health-route-hero-stat-label">Total Health registry tools')
      .replace(/Health registry total: <strong>40 tools<\/strong>/g, 'Health registry total: <strong>42 tools</strong>')
      .replace(/hospital, dental, medicine, mental-health/g, 'hospital, clinic, pharmacy, dental, medicine, mental-health');
    if (next !== current) {
      fs.writeFileSync(file, next);
      changed += 1;
    }
  });
  return changed;
}

function writeHealthTaxonomy() {
  const file = path.join(ROOT, 'assets/js/components/health-taxonomy.js');
  const buckets = [
    {
      key: 'vitals-body-metrics',
      title: 'Vitals & Body Metrics',
      icon: '📏',
      description: 'BMI, waist ratio, hydration, blood pressure, and diabetes-risk tools used for everyday body metrics and monitoring.',
      toolIds: ['bmi-calculator', 'blood-pressure', 'diabetes-risk', 'waist-hip-ratio', 'water-intake', 'bmi-calc-tools'],
      featuredIds: ['bmi-calculator', 'blood-pressure', 'diabetes-risk', 'waist-hip-ratio', 'water-intake'],
    },
    {
      key: 'lab-reports-medical-interpretation',
      title: 'Lab Reports & Medical Interpretation',
      icon: '🩺',
      description: 'AI interpretation and screening-style tools for lab results, genotype, blood group, and sickle-cell compatibility.',
      toolIds: ['medical-report', 'genotype-checker', 'blood-group', 'sickle-cell'],
      featuredIds: ['medical-report', 'genotype-checker', 'blood-group', 'sickle-cell'],
    },
    {
      key: 'nutrition-fitness',
      title: 'Nutrition & Fitness',
      icon: '🥗',
      description: 'African-food calorie tools, meal planning, and activity-focused wellness tools for diet and fitness routines.',
      toolIds: ['calorie-counter', 'african-meal-plan', 'home-workout', 'gym-cost-compare', 'calorie-counter-tools'],
      featuredIds: ['calorie-counter', 'african-meal-plan', 'home-workout', 'gym-cost-compare'],
    },
    {
      key: 'womens-family-health',
      title: "Women's & Family Health",
      icon: '👶',
      description: 'Fertility, pregnancy, childbirth, child growth, breastfeeding, and family-planning tools for ongoing family-health decisions.',
      toolIds: ['due-date', 'ovulation-calc', 'maternal-mortality', 'childbirth-cost', 'csection-vs-natural', 'pregnancy-nutrition', 'child-growth', 'breastfeeding-tracker', 'vaccine-schedule', 'due-date-tools'],
      featuredIds: ['due-date', 'ovulation-calc', 'childbirth-cost', 'child-growth', 'pregnancy-nutrition', 'maternal-mortality'],
    },
    {
      key: 'health-costs-insurance',
      title: 'Health Costs & Insurance',
      icon: '💳',
      description: 'Cost comparison and care-planning tools for hospital visits, clinic prices, pharmacy prices, treatment choices, mental health, dental work, and travel-for-care decisions.',
      toolIds: ['hospital-cost', 'clinic-costs', 'pharmacy-prices', 'dental-cost', 'drug-price-compare', 'traditional-vs-western', 'medical-tourism', 'eye-care-cost', 'mental-health-cost'],
      featuredIds: ['hospital-cost', 'clinic-costs', 'pharmacy-prices', 'drug-price-compare', 'dental-cost', 'medical-tourism', 'mental-health-cost'],
    },
    {
      key: 'clinical-professional-utilities',
      title: 'Clinical / Professional Utilities',
      icon: '🧪',
      description: 'More operational health tools for dosage, prevention, water safety, infectious-disease risk, and treatment tracking.',
      toolIds: ['drug-dosage', 'malaria-risk', 'water-quality', 'hiv-treatment-cost', 'tb-tracker', 'cholera-risk', 'ebola-checklist', 'hep-b-screening'],
      featuredIds: ['drug-dosage', 'malaria-risk', 'water-quality', 'hiv-treatment-cost', 'tb-tracker'],
    },
  ];
  const flagships = [
    { key: 'medical-report', registryId: 'medical-report', title: 'Medical Report Interpreter', href: '/tools/medical-report/', summary: 'AI-first surface for CBC, lipid, liver, kidney, thyroid, and diabetes report interpretation.', surfaceType: 'Registry flagship', mode: 'AI report tool', audience: 'Clinical + personal' },
    { key: 'bmi-calculator', registryId: 'bmi-calculator', title: 'BMI Calculator for Africans', href: '/health/bmi-calculator/', summary: 'Flagship vitals surface with BMI, waist context, and African body-composition framing.', surfaceType: 'Registry flagship', mode: 'Calculator', audience: 'Personal wellness' },
    { key: 'calorie-counter', registryId: 'calorie-counter', title: 'Calorie Counter (African Foods)', href: '/health/calorie-counter/', summary: 'Flagship nutrition surface with 200+ local foods, macros, and meal-tracking flows.', surfaceType: 'Registry flagship', mode: 'Tracker / calculator', audience: 'Personal wellness' },
    { key: 'due-date', registryId: 'due-date', title: 'Pregnancy Due Date Calculator', href: '/health/pregnancy-due-date/', summary: 'Flagship family-health surface for due date, milestones, and delivery-planning context.', surfaceType: 'Registry flagship', mode: 'Calculator + planner', audience: "Women's & family health" },
    { key: 'health-insurance-compare', registryId: 'health-insurance-compare', title: 'Health Insurance Comparator', href: '/tools/health-insurance-compare/', summary: 'Connected insurance surface for comparing coverage, premiums, and plan structure across African markets.', surfaceType: 'Connected surface', mode: 'Comparator', audience: 'Costs & coverage' },
  ];
  const overlapGroups = [
    { key: 'bmi-surfaces', label: 'BMI surfaces', toolIds: ['bmi-calculator', 'bmi-calc-tools'] },
    { key: 'calorie-surfaces', label: 'Calorie-counter surfaces', toolIds: ['calorie-counter', 'calorie-counter-tools'] },
    { key: 'due-date-surfaces', label: 'Pregnancy due-date surfaces', toolIds: ['due-date', 'due-date-tools'] },
    { key: 'genetics-screening', label: 'Genetics and compatibility tools', toolIds: ['genotype-checker', 'blood-group', 'sickle-cell'] },
    { key: 'care-cost-planning', label: 'Care cost-planning tools', toolIds: ['hospital-cost', 'clinic-costs', 'pharmacy-prices', 'childbirth-cost', 'csection-vs-natural', 'dental-cost', 'medical-tourism'] },
  ];
  const subhubs = {
    costs: {
      key: 'costs',
      title: 'Health Costs & Treatment Planning',
      eyebrow: 'Health Costs & Insurance',
      description: 'Use this route when the job is comparing treatment costs, clinic prices, pharmacy prices, procedure tradeoffs, and likely out-of-pocket care expenses.',
      primaryLabel: 'Focused health tools',
      connectedLabel: 'Connected coverage tools',
      toolIds: ['hospital-cost', 'clinic-costs', 'pharmacy-prices', 'dental-cost', 'drug-price-compare', 'traditional-vs-western', 'medical-tourism', 'eye-care-cost', 'mental-health-cost'],
      connectedIds: ['health-insurance-compare', 'health-contribution'],
      relatedLinks: [{ label: 'Health hub', href: '/health/' }, { label: 'Insurance & contribution planning', href: '/health/insurance/' }, { label: 'Medical Report Interpreter', href: '/tools/medical-report/' }],
      note: 'Coverage tools are surfaced separately because they live in the Insurance category and are not part of the Health registry count.',
    },
    insurance: {
      key: 'insurance',
      title: 'Health Insurance & Contribution Planning',
      eyebrow: 'Connected Insurance Surfaces',
      description: 'Start here when you need plan comparison, national health-contribution guidance, and the cost tools that make coverage decisions tangible.',
      primaryLabel: 'Related health tools',
      connectedLabel: 'Insurance-category surfaces',
      toolIds: ['hospital-cost', 'clinic-costs', 'pharmacy-prices', 'drug-price-compare', 'due-date', 'childbirth-cost', 'medical-tourism'],
      connectedIds: ['health-insurance-compare', 'health-contribution'],
      relatedLinks: [{ label: 'Health hub', href: '/health/' }, { label: 'Health costs & treatment planning', href: '/health/costs/' }, { label: 'Pregnancy due-date surface', href: '/health/pregnancy-due-date/' }],
      note: 'Health Insurance Comparator and Health Contribution are linked here for navigation, but they remain outside the Health registry total because their registry home is Insurance.',
    },
  };
  const next = `'use strict';\n(function(){\n  function registry(){return (typeof AFRO_TOOLS !== 'undefined' ? AFRO_TOOLS : []).filter(function(tool){return (tool.lang || 'en') === 'en';});}\n  function healthTools(){return registry().filter(function(tool){return tool.category === 'health';});}\n  function byId(){var map={};registry().forEach(function(tool){map[tool.id]=tool;});return map;}\n  function clone(items){return (items || []).slice();}\n  function pick(ids,map){return ids.map(function(id){return map[id];}).filter(Boolean);}\n  var buckets=${JSON.stringify(buckets, null, 2)};\n  var flagships=${JSON.stringify(flagships, null, 2)};\n  var overlapGroups=${JSON.stringify(overlapGroups, null, 2)};\n  var subhubs=${JSON.stringify(subhubs, null, 2)};\n  window.AfroHealth={\n    getBuckets:function(){var map=byId();return buckets.map(function(bucket){var all=pick(bucket.toolIds,map);var featured=pick(bucket.featuredIds,map);return {key:bucket.key,title:bucket.title,icon:bucket.icon,description:bucket.description,registryCount:all.length,featuredCount:featured.length,allTools:all,featuredTools:featured};});},\n    getFlagshipSurfaces:function(){var map=byId();return flagships.map(function(surface){var tool=surface.registryId ? map[surface.registryId] : null;return {key:surface.key,title:surface.title,href:surface.href,summary:surface.summary,surfaceType:surface.surfaceType,mode:surface.mode,audience:surface.audience,registryTool:tool,inHealthRegistry:!!(tool && tool.category === 'health'),icon:tool ? tool.icon : '🏥'};});},\n    getRegistryCount:function(){return healthTools().length;},\n    getRegistryTools:healthTools,\n    getSubhub:function(key){var subhub=subhubs[key];if(!subhub)return null;var map=byId();return {key:subhub.key,title:subhub.title,eyebrow:subhub.eyebrow,description:subhub.description,primaryLabel:subhub.primaryLabel,connectedLabel:subhub.connectedLabel,relatedLinks:clone(subhub.relatedLinks),note:subhub.note,tools:pick(subhub.toolIds,map),connectedTools:pick(subhub.connectedIds,map)};},\n    getOverlapGroups:function(){var map=byId();return overlapGroups.map(function(group){return {key:group.key,label:group.label,tools:pick(group.toolIds,map)};});},\n    auditTaxonomy:function(){var health=healthTools();var assigned={};var duplicates=[];var known={};health.forEach(function(tool){known[tool.id]=true;});buckets.forEach(function(bucket){bucket.toolIds.forEach(function(id){if(assigned[id])duplicates.push(id);assigned[id]=bucket.key;});});var missing=Object.keys(known).filter(function(id){return !assigned[id];});return {registryCount:health.length,assignedCount:Object.keys(assigned).length,duplicateIds:duplicates,missingIds:missing};}\n  };\n})();\n`;
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (next !== current) fs.writeFileSync(file, next);
  return next !== current;
}

function writeSummary(profiles, generatedIds) {
  const file = path.join(ROOT, 'docs/HEALTH-SECTION-IMPROVEMENT-LOG.md');
  const rows = profiles.map((profile) => {
    const kind = generatedIds.includes(profile.id) ? 'Generated functional app' : 'Improved existing app';
    return `| ${profile.title} | ${profile.bucket} | ${kind} | Added source-backed workflow, red flags, and related next steps. |`;
  }).join('\n');
  const content = [
    '# Health Section Improvement Log',
    '',
    `Review date: ${REVIEW_DATE}`,
    '',
    'Scope: English Health category at `/health/`, including all 42 registry-backed health tools.',
    '',
    'System issues fixed:',
    '',
    '- Updated Health counts from 40 to 42 after `clinic-costs` and `pharmacy-prices` were found in the live registry but missing from the Health taxonomy.',
    '- Created functional static pages for 12 registry-visible tools that previously pointed to missing source pages.',
    '- Added a shared care-workflow panel to every existing Health app with official context links, safer-use guidance, red flags, and related AfroTools routes.',
    '- Promoted the formerly queued generated tools to live registry status because the source pages now exist and provide usable informational planners.',
    '',
    'Per-tool pass:',
    '',
    '| Tool | Bucket | Change | Summary |',
    '| --- | --- | --- | --- |',
    rows,
    '',
    'Validation notes should be refreshed whenever health taxonomy, registry status, or generated app pages change.',
    '',
  ].join('\n');
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (content !== current) fs.writeFileSync(file, content);
  return content !== current;
}

const registry = loadRegistry();
const registryById = Object.fromEntries(registry.map((tool) => [tool.id, tool]));
const healthTools = registry.filter((tool) => tool.category === 'health');
const profiles = healthTools.map(profileFor);

let generatedChanged = 0;
let existingChanged = 0;
for (const tool of healthTools) {
  const profile = profileFor(tool);
  if (generatedApps[tool.id]) {
    if (writeGeneratedTool(tool, profile, registryById)) generatedChanged += 1;
  }
}
for (const tool of healthTools) {
  const profile = profileFor(tool);
  if (updateExistingTool(tool, profile, registryById)) existingChanged += 1;
}

const registryChanged = updateRegistry();
const hubChanged = updateHealthHub();
const taxonomyChanged = writeHealthTaxonomy();
const summaryChanged = writeSummary(profiles, Object.keys(generatedApps));

console.log(JSON.stringify({
  healthTools: healthTools.length,
  generatedChanged,
  existingChanged,
  registryChanged,
  hubChanged,
  taxonomyChanged,
  summaryChanged,
}, null, 2));
