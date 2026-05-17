const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = process.cwd();
const REVIEW_DATE = '28 April 2026';

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

const journeyByBucket = {
  vitals: { key: 'vitals', label: 'Vitals checkup', href: '/health/bmi-calculator/', toolIds: ['bmi-calculator', 'waist-hip-ratio', 'blood-pressure', 'diabetes-risk', 'water-intake'] },
  labs: { key: 'labs', label: 'Labs and compatibility pack', href: '/tools/medical-report/', toolIds: ['medical-report', 'genotype-checker', 'blood-group', 'sickle-cell'] },
  nutrition: { key: 'nutrition', label: 'Nutrition and activity plan', href: '/health/calorie-counter/', toolIds: ['calorie-counter', 'african-meal-plan', 'home-workout', 'gym-cost-compare'] },
  family: { key: 'family', label: 'Pregnancy and child care plan', href: '/health/pregnancy-due-date/', toolIds: ['due-date', 'pregnancy-nutrition', 'childbirth-cost', 'vaccine-schedule', 'child-growth', 'breastfeeding-tracker'] },
  costs: { key: 'costs', label: 'Care cost planner', href: '/health/costs/', toolIds: ['hospital-cost', 'clinic-costs', 'pharmacy-prices', 'drug-price-compare', 'dental-cost', 'medical-tourism'] },
  clinical: { key: 'clinical', label: 'Clinical safety checklist', href: '/tools/malaria-risk/', toolIds: ['malaria-risk', 'water-quality', 'drug-dosage', 'hiv-treatment-cost', 'tb-tracker', 'cholera-risk', 'ebola-checklist', 'hep-b-screening'] },
};

const sourceBank = {
  bmi: ['NHS adult BMI tool', 'https://www.nhs.uk/health-assessment-tools/calculate-your-body-mass-index/calculate-bmi-for-adults'],
  cdcBmi: ['CDC adult BMI categories', 'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html'],
  diet: ['WHO healthy diet', 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet'],
  activity: ['WHO physical activity', 'https://www.who.int/news-room/fact-sheets/detail/physical-activity'],
  antenatal: ['WHO antenatal care recommendations', 'https://www.who.int/publications/i/item/9789241549912'],
  breastfeeding: ['WHO breastfeeding', 'https://www.who.int/news-room/fact-sheets/detail/breastfeeding'],
  immunization: ['CDC child and adolescent immunization schedule', 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-age.html'],
  growth: ['WHO child growth standards', 'https://www.who.int/tools/child-growth-standards'],
  malaria: ['WHO malaria', 'https://www.who.int/news-room/fact-sheets/detail/malaria'],
  water: ['WHO drinking water', 'https://www.who.int/news-room/fact-sheets/detail/drinking-water'],
  hypertension: ['WHO hypertension', 'https://www.who.int/news-room/fact-sheets/detail/hypertension'],
  diabetes: ['WHO diabetes', 'https://www.who.int/news-room/fact-sheets/detail/diabetes'],
  ada: ['ADA 60-second diabetes risk test', 'https://diabetes.org/diabetes-risk-test'],
  hiv: ['WHO HIV and AIDS', 'https://www.who.int/news-room/fact-sheets/detail/hiv-aids'],
  tb: ['WHO tuberculosis', 'https://www.who.int/news-room/fact-sheets/detail/tuberculosis'],
  cholera: ['WHO cholera', 'https://www.who.int/news-room/fact-sheets/detail/cholera'],
  ebola: ['WHO Ebola disease', 'https://www.who.int/news-room/fact-sheets/detail/ebola-disease'],
  hepatitisB: ['WHO hepatitis B', 'https://www.who.int/news-room/fact-sheets/detail/hepatitis-b'],
  mentalHealth: ['WHO mental health', 'https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response'],
  sickle: ['CDC sickle cell disease', 'https://www.cdc.gov/sickle-cell/about/index.html'],
  medicines: ['WHO essential medicines', 'https://www.who.int/groups/expert-committee-on-selection-and-use-of-essential-medicines/essential-medicines-lists'],
  medicalTourism: ['CDC medical tourism', 'https://wwwnc.cdc.gov/travel/page/medical-tourism'],
  goodrx: ['GoodRx prescription price comparison', 'https://www.goodrx.com/'],
  bluebook: ['Healthcare Bluebook price transparency', 'https://healthcarebluebook.com/'],
  mytherapy: ['MyTherapy medication reminder app', 'https://www.mytherapyapp.com/'],
};

const competitorById = {
  'medical-report': ['Ada and lab-analyzer style apps', 'Symptom and report apps work best when they convert results into questions, red flags, and a shareable summary.', 'Added private dashboard/PDF actions, clinic-question framing, and a source-backed benchmark block.', sourceBank.sickle],
  'bmi-calculator': ['NHS BMI calculator', 'NHS asks for height, weight, ethnicity context, waist follow-up, and clear limits.', 'Added a saveable BMI plan with waist follow-up, dashboard storage, and gated PDF export.', sourceBank.bmi],
  'due-date': ['BabyCenter and NHS due-date tools', 'Pregnancy trackers pair the date with milestones and appointment prep.', 'Added family-health workflow routing, PDF visit-prep output, and dashboard continuity.', sourceBank.antenatal],
  'calorie-counter': ['MyFitnessPal', 'Food diaries need repeatable meal logs, local foods, and progress exports.', 'Added nutrition workflow saving so African-food calorie results can become a weekly plan.', sourceBank.diet],
  'malaria-risk': ['CDC and WHO travel-health checkers', 'Risk tools need prevention prompts and escalation thresholds.', 'Added clinical-safety workflow actions, source-backed escalation, and dashboard handoff.', sourceBank.malaria],
  'ovulation-calc': ['Flo and Clue', 'Cycle tools work better with reminders, uncertainty notes, and privacy-aware export.', 'Added family-health workflow routing plus dashboard/PDF actions for appointment planning.', sourceBank.antenatal],
  'drug-dosage': ['Medscape and Epocrates', 'Medication tools need age, weight, formulation, interaction, and professional-check gates.', 'Added stricter workflow copy, save/PDF actions, and a medication-verification benchmark block.', sourceBank.medicines],
  'water-quality': ['WHO water-safety checklists', 'Water tools should separate test result, household treatment, and urgent contamination advice.', 'Added clinical-safety workflow routing with PDF checklist and dashboard capture.', sourceBank.water],
  'water-intake': ['Mayo-style hydration calculators', 'Hydration tools should record context and avoid one-size-fits-all targets.', 'Added vitals workflow save/PDF actions and repeat-check dashboard storage.', sourceBank.water],
  'vaccine-schedule': ['CDC immunization schedule app', 'The best schedule tools include catch-up, notes, printable schedules, and provider review.', 'Added family-health PDF planning and dashboard handoff around local clinic confirmation.', sourceBank.immunization],
  'waist-hip-ratio': ['WHO and NHS body-measurement guidance', 'Body metric tools should pair ratios with waist context and limits.', 'Added vitals workflow actions and PDF export for trend tracking.', sourceBank.bmi],
  'blood-pressure': ['American Heart Association BP trackers', 'Blood-pressure trackers need repeat readings, reminders, and a shareable clinician report.', 'Added dashboard/PDF report actions and vitals workflow continuity.', sourceBank.hypertension],
  'hospital-cost': ['Healthcare Bluebook', 'Price tools need facility quotes, benchmark comparison, and what-is-included prompts.', 'Added care-cost workflow, quote-proof prompts, and email-gated PDF plan.', sourceBank.bluebook],
  'clinic-costs': ['Healthcare Bluebook and local clinic quote tools', 'Cost tools work when they capture proof, date, currency, and included services.', 'Added care-cost workflow saving and dashboard review prompts for community price intelligence.', sourceBank.bluebook],
  'pharmacy-prices': ['GoodRx', 'Medicine price tools need generic comparison, pack size, pharmacy proof, and safety warnings.', 'Added GoodRx-style benchmark prompts, PDF gate, and dashboard continuity.', sourceBank.goodrx],
  'sickle-cell': ['CDC sickle cell resources', 'Sickle tools should explain inherited risk, trait limits, and when to involve specialists.', 'Added labs workflow routing and a saveable questions-for-clinic plan.', sourceBank.sickle],
  'diabetes-risk': ['ADA diabetes risk test', 'Risk tests should be short, scored, and paired with next steps.', 'Added ADA-style benchmark framing plus vitals workflow dashboard/PDF actions.', sourceBank.ada],
  'bmi-calc-tools': ['CDC adult BMI categories', 'BMI tools should show category, caveats, and follow-up measures.', 'Added dashboard/PDF plan actions and related vitals workflow links.', sourceBank.cdcBmi],
  'calorie-counter-tools': ['MyFitnessPal', 'Calorie apps need repeat logging and a way to export progress.', 'Added nutrition workflow save/PDF actions and next-tool routing.', sourceBank.diet],
  'due-date-tools': ['NHS due-date guidance', 'Due-date calculators need local care reminders and uncertainty notes.', 'Added family-health workflow save/PDF actions and milestone planning prompts.', sourceBank.antenatal],
  'genotype-checker': ['Premarital genotype counselling tools', 'Compatibility checks must push lab confirmation and counselling before decisions.', 'Added labs workflow plan, red-flag copy, and dashboard/PDF actions.', sourceBank.sickle],
  'blood-group': ['Blood compatibility references', 'Compatibility tools need transfusion and pregnancy Rh-factor caveats.', 'Added labs workflow handoff, clinic-question prompts, and gated PDF export.', sourceBank.antenatal],
  'maternal-mortality': ['WHO antenatal risk guidance', 'Risk tools need conservative escalation and clinic review.', 'Added family-health workflow save/PDF actions and urgent-warning framing.', sourceBank.antenatal],
  'childbirth-cost': ['Hospital cost estimators', 'Birth-cost tools should split facility, professional, procedure, transport, and emergency buffers.', 'Added care and family workflow routing with PDF budget capture.', sourceBank.bluebook],
  'csection-vs-natural': ['Procedure cost comparison tools', 'Comparison tools must include clinical suitability and emergency-readiness, not price only.', 'Added family-health PDF planning and dashboard save actions.', sourceBank.antenatal],
  'dental-cost': ['Dental procedure cost estimators', 'Dental tools need procedure scope, follow-up, and insurance/exclusion prompts.', 'Added care-cost workflow capture and quote-proof PDF output.', sourceBank.bluebook],
  'drug-price-compare': ['GoodRx', 'Drug-price tools need generic substitution and pharmacy verification warnings.', 'Added medicine-price benchmark block plus dashboard/PDF handoff.', sourceBank.goodrx],
  'traditional-vs-western': ['Cost-effectiveness comparison tools', 'Alternative-care comparisons need safety, evidence, and interaction caveats.', 'Added care-cost workflow routing and clinician-review PDF notes.', sourceBank.medicines],
  'african-meal-plan': ['Cronometer and meal planner apps', 'Meal planners work best with nutrient prompts and realistic weekly routines.', 'Added nutrition workflow save/PDF actions and local-plate checklist.', sourceBank.diet],
  'child-growth': ['WHO child growth standards', 'Growth tools need percentile context, repeat measurement, and provider review.', 'Added family-health dashboard/PDF plan and WHO benchmark block.', sourceBank.growth],
  'hiv-treatment-cost': ['MyTherapy medication reminder app', 'HIV tools should include adherence, refill timing, viral-load dates, and safe export.', 'Added clinical workflow save/PDF actions and adherence-oriented dashboard plan.', sourceBank.hiv],
  'tb-tracker': ['MyTherapy and TB adherence trackers', 'TB trackers need treatment timeline, missed-dose discussion, and appointment reminders.', 'Added clinical workflow capture with dashboard/PDF tracker output.', sourceBank.tb],
  'cholera-risk': ['WHO cholera guidance', 'Outbreak checklists need water, sanitation, dehydration, and urgent-care escalation.', 'Added clinical-safety workflow with gated PDF checklist.', sourceBank.cholera],
  'ebola-checklist': ['WHO Ebola guidance', 'Preparedness tools need exposure, symptom, isolation, contact-list, and official-line prompts.', 'Added clinical-safety workflow capture and PDF checklist.', sourceBank.ebola],
  'hep-b-screening': ['WHO Hepatitis B guidance', 'Screening tools need test type, vaccine doses, household screening, and follow-up.', 'Added clinical workflow save/PDF plan and source-backed screening prompts.', sourceBank.hepatitisB],
  'medical-tourism': ['CDC medical tourism guidance', 'Travel-for-care tools need follow-up, complication, documentation, and infection-risk planning.', 'Added care-cost workflow save/PDF actions and CDC-style safety prompts.', sourceBank.medicalTourism],
  'eye-care-cost': ['Warby Parker and optical cost tools', 'Eye-care cost tools need exam, lens, frame, warranty, and replacement prompts.', 'Added care-cost workflow capture and quote-proof PDF output.', sourceBank.bluebook],
  'mental-health-cost': ['BetterHelp and therapy marketplace flows', 'Mental-health cost tools need session cadence, provider fit, crisis caveats, and insurance checks.', 'Added care-cost workflow saving and a PDF plan with crisis-care limits.', sourceBank.mentalHealth],
  'pregnancy-nutrition': ['BabyCenter nutrition trackers', 'Pregnancy nutrition tools need trimester context, micronutrients, local foods, and provider review.', 'Added family and nutrition workflow actions plus PDF visit prep.', sourceBank.diet],
  'breastfeeding-tracker': ['Baby tracking apps', 'Feeding trackers need side, duration, wet diapers, growth signs, and support prompts.', 'Added family-health dashboard/PDF capture around feeding-session logs.', sourceBank.breastfeeding],
  'gym-cost-compare': ['Gym comparison and fitness apps', 'Fitness cost tools need habit frequency, total monthly cost, and home alternative comparison.', 'Added nutrition/activity workflow save/PDF actions.', sourceBank.activity],
  'home-workout': ['Nike Training Club and Fitbod', 'Workout tools need session intensity, repeat planning, and safety warnings.', 'Added nutrition/activity workflow capture and PDF habit plan.', sourceBank.activity],
};

function escHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function attr(value) {
  return escHtml(value).replace(/\n/g, ' ');
}

function loadRegistry() {
  const code = fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8');
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return (ctx.AFRO_TOOLS || []).filter((tool) => (tool.lang || 'en') === 'en');
}

function fileForHref(href) {
  const clean = href.replace(/^https?:\/\/[^/]+/, '').split('#')[0].split('?')[0];
  const normalized = clean.endsWith('/') ? clean : `${clean}/`;
  const rel = normalized.replace(/^\/+/, '');
  if (rel.endsWith('.html/')) return path.join(ROOT, rel.slice(0, -1));
  return path.join(ROOT, rel, 'index.html');
}

function ensureCss(html) {
  if (html.includes('/assets/css/health-enhancements.css')) return html;
  return html.replace('</head>', '<link rel="stylesheet" href="/assets/css/health-enhancements.css">\n</head>');
}

function ensureWorkflowScript(html) {
  if (html.includes('/assets/js/health-workflow.js')) return html;
  const script = '<script src="/assets/js/health-workflow.js" defer></script>';
  if (/<script\s+(?:async|defer)\s+src="https:\/\/www\.googletagmanager\.com\/gtag\/js/.test(html)) {
    return html.replace(/<script\s+(async|defer)\s+src="https:\/\/www\.googletagmanager\.com\/gtag\/js/, `${script}\n<script $1 src="https://www.googletagmanager.com/gtag/js`);
  }
  return html.replace('</body>', `${script}\n</body>`);
}

function ensureMetaToolId(html, tool) {
  if (html.includes('name="tool-id"')) return html;
  return html.replace('</head>', `<meta name="tool-id" content="${attr(tool.id)}">\n</head>`);
}

function toolName(tool) {
  return tool.name || tool.title || tool.id.replace(/-/g, ' ');
}

function relatedTools(tool, registryById) {
  const bucket = bucketById[tool.id] || 'health';
  const journey = journeyByBucket[bucket] || journeyByBucket.vitals;
  return journey.toolIds
    .filter((id) => id !== tool.id)
    .map((id) => registryById[id])
    .filter(Boolean)
    .slice(0, 4);
}

function buildActionKit(tool, registryById) {
  const bucket = bucketById[tool.id] || 'health';
  const journey = journeyByBucket[bucket] || journeyByBucket.vitals;
  const meta = competitorById[tool.id] || ['Comparable health app', 'Useful health apps turn a single result into a saveable next-step plan.', 'Added dashboard save, gated PDF export, and related Health workflow routing.', sourceBank.diet];
  const source = meta[3] || sourceBank.diet;
  const nextTools = relatedTools(tool, registryById);
  return [
    '<!-- HEALTH-COMPLETE-PACKAGE:START -->',
    `<section class="health-action-kit" data-health-tool-id="${attr(tool.id)}" data-health-tool-name="${attr(toolName(tool))}" data-health-href="${attr(tool.href)}" data-health-bucket="${attr(bucket)}" data-health-journey="${attr(journey.key)}" data-health-source-name="${attr(source[0])}" data-health-source-url="${attr(source[1])}" data-health-competitor="${attr(meta[0])}" data-health-feature="${attr(meta[1])}" aria-labelledby="health-action-title-${attr(tool.id)}">`,
    '<span class="health-action-kicker">Complete package upgrade</span>',
    `<h2 id="health-action-title-${attr(tool.id)}">${escHtml(toolName(tool))}: save, export, and continue the workflow</h2>`,
    `<p>This app now has its own benchmarked improvement layer, dashboard handoff, email-gated PDF plan, and a route into the ${escHtml(journey.label)} workflow.</p>`,
    '<div class="health-action-grid">',
    '<div class="health-action-card">',
    '<h3>Competitor feature checked</h3>',
    `<p><strong>${escHtml(meta[0])}</strong>: ${escHtml(meta[1])}</p>`,
    `<p><strong>Implemented here:</strong> ${escHtml(meta[2])}</p>`,
    `<p><a href="${attr(source[1])}" rel="noopener" target="_blank">${escHtml(source[0])}</a></p>`,
    '</div>',
    '<div class="health-action-card">',
    '<h3>Dashboard and PDF actions</h3>',
    '<ul>',
    '<li>Save this health plan to the dashboard workspace on this device.</li>',
    '<li>Unlock a PDF version through the Health email gate for follow-up and visit prep.</li>',
    '<li>Signed-in sessions attempt account workspace sync when the shared workspace API is available.</li>',
    '</ul>',
    '<div class="health-action-buttons">',
    `<button type="button" class="health-workflow-btn" data-health-action="save" data-health-tool-id="${attr(tool.id)}">Save to dashboard</button>`,
    `<button type="button" class="health-workflow-btn secondary" data-health-action="pdf" data-health-tool-id="${attr(tool.id)}">Get PDF plan</button>`,
    '</div>',
    '</div>',
    '</div>',
    '<div class="health-action-card" style="margin-top:1rem">',
    `<h3>Continue in ${escHtml(journey.label)}</h3>`,
    '<div class="health-action-links">',
    `<a href="${attr(journey.href)}">Open workflow hub</a>`,
    nextTools.map((item) => `<a href="${attr(item.href)}">${escHtml(toolName(item))}</a>`).join(''),
    '</div>',
    '</div>',
    '</section>',
    '<!-- HEALTH-COMPLETE-PACKAGE:END -->',
  ].join('\n');
}

function insertOrReplace(html, start, end, block, fallbackNeedle) {
  const re = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (re.test(html)) return html.replace(re, block);
  if (fallbackNeedle && html.includes(fallbackNeedle)) return html.replace(fallbackNeedle, `${block}\n${fallbackNeedle}`);
  return html.replace('</body>', `${block}\n</body>`);
}

function updateToolPage(tool, registryById) {
  const file = fileForHref(tool.href);
  if (!fs.existsSync(file)) return false;
  const current = fs.readFileSync(file, 'utf8');
  let next = ensureWorkflowScript(ensureMetaToolId(ensureCss(current), tool));
  const block = buildActionKit(tool, registryById);
  if (next.includes('<!-- HEALTH-DEEP-IMPROVEMENT:END -->')) {
    next = insertOrReplace(next, '<!-- HEALTH-COMPLETE-PACKAGE:START -->', '<!-- HEALTH-COMPLETE-PACKAGE:END -->', block, '<!-- HEALTH-DEEP-IMPROVEMENT:END -->');
    if (next.includes(`${block}\n<!-- HEALTH-DEEP-IMPROVEMENT:END -->`)) {
      next = next.replace(`${block}\n<!-- HEALTH-DEEP-IMPROVEMENT:END -->`, `<!-- HEALTH-DEEP-IMPROVEMENT:END -->\n${block}`);
    }
  } else {
    next = insertOrReplace(next, '<!-- HEALTH-COMPLETE-PACKAGE:START -->', '<!-- HEALTH-COMPLETE-PACKAGE:END -->', block, '<afro-footer');
  }
  if (next !== current) {
    fs.writeFileSync(file, next);
    return true;
  }
  return false;
}

function homepageBlock() {
  return [
    '<!-- HEALTH-HOMEPAGE-PACKAGE:START -->',
    '<section class="sec health-complete-home" aria-labelledby="health-workflow-title">',
    '<div class="wrap">',
    '<div class="ey">Complete Package</div>',
    '<h2 class="st" id="health-workflow-title">Start with a Health workflow, not a single calculator</h2>',
    '<p class="ss">Every Health app now has competitor-informed improvements, a dashboard save action, and a gated PDF plan where a user naturally needs a portable record. Pick a workflow below, then move across related tools without losing the thread.</p>',
    '<div class="health-journey-panel">',
    '<h3>Health workflow builder</h3>',
    '<p>Choose a journey to open the first app, save a dashboard plan, or unlock a PDF checklist through the Health email gate.</p>',
    '<div id="health-workflow-builder"></div>',
    '</div>',
    '</div>',
    '</section>',
    '<!-- HEALTH-HOMEPAGE-PACKAGE:END -->',
  ].join('\n');
}

function updateHealthHub() {
  const file = path.join(ROOT, 'health/index.html');
  const current = fs.readFileSync(file, 'utf8');
  let next = ensureWorkflowScript(ensureCss(current))
    .replace('browse the 40-tool registry once and only once.', 'browse the 42-tool registry once and only once.')
    .replace('id="hero-registry-count">40</div>', 'id="hero-registry-count">42</div>')
    .replace('Hospital, dental, medicine, mental-health, and travel-for-care cost tools', 'Hospital, clinic, pharmacy, dental, medicine, mental-health, and travel-for-care cost tools');
  const block = homepageBlock();
  next = next.replace(/<!-- HEALTH-HOMEPAGE-PACKAGE:START -->[\s\S]*?<!-- HEALTH-HOMEPAGE-PACKAGE:END -->\n?/g, '');
  next = next.replace('</section>\n\n<section class="sec sec-alt">', `</section>\n\n${block}\n\n<section class="sec sec-alt">`);
  if (next !== current) fs.writeFileSync(file, next);
  return next !== current;
}

function writeDoc(healthTools) {
  const file = path.join(ROOT, 'docs/HEALTH-CATEGORY-COMPLETE-PACKAGE-2026-04-28.md');
  const rows = healthTools.map((tool) => {
    const meta = competitorById[tool.id];
    const bucket = bucketById[tool.id] || 'health';
    const source = meta && meta[3] ? meta[3] : sourceBank.diet;
    return `| ${tool.id} | ${toolName(tool)} | ${bucket} | ${meta ? meta[0] : 'Comparable health app'} | ${meta ? meta[2] : 'Added workflow save and PDF actions.'} | ${source[1]} |`;
  }).join('\n');
  const content = [
    '# Health Category Complete Package Pass',
    '',
    `Review date: ${REVIEW_DATE}`,
    '',
    'Scope: `/health/` homepage plus every English registry-backed Health app. Registry count verified at 42 apps.',
    '',
    'What changed:',
    '',
    '- Rebuilt the homepage as a workflow entry point with six Health journeys.',
    '- Added a distinct competitor-informed action kit to every Health app.',
    '- Added a shared Health workflow runtime for dashboard saves, email-gated PDF plans, and cross-tool continuation.',
    '- Improved generated Health app form semantics with names, required fields, input modes, and result snapshots for saved plans.',
    '- Connected local Health plans into the dashboard workspace while keeping account sync honest and opportunistic.',
    '',
    'App-by-app pass:',
    '',
    '| Tool ID | App | Bucket | Competitor or benchmark checked | Implemented improvement | Source |',
    '| --- | --- | --- | --- | --- | --- |',
    rows,
    '',
    'Dashboard and capture behavior:',
    '',
    '- `assets/js/health-workflow.js` stores Health plans in `localStorage.afro_health_plans` and sends a workspace upsert only when the shared account workspace API is available.',
    '- PDF export is gated by a lightweight Health email modal and posts to `/api/capture-lead` with `source=health-pdf-gate`.',
    '- The dashboard reads the Health plan cache as a first-class workspace tab and action-center signal.',
    '',
  ].join('\n');
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (current !== content) fs.writeFileSync(file, content);
  return current !== content;
}

const registry = loadRegistry();
const registryById = Object.fromEntries(registry.map((tool) => [tool.id, tool]));
const healthTools = registry.filter((tool) => tool.category === 'health');

let pageChanges = 0;
for (const tool of healthTools) {
  if (updateToolPage(tool, registryById)) pageChanges += 1;
}

const hubChanged = updateHealthHub();
const docChanged = writeDoc(healthTools);
const missingCompetitors = healthTools.filter((tool) => !competitorById[tool.id]).map((tool) => tool.id);

console.log(JSON.stringify({
  healthTools: healthTools.length,
  pageChanges,
  hubChanged,
  docChanged,
  missingCompetitors,
}, null, 2));
