#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const taxonomy = require(path.join(root, 'assets/js/components/education-taxonomy.js'));
const registrySource = fs.readFileSync(path.join(root, 'assets/js/components/tool-registry.js'), 'utf8');
const registry = vm.runInNewContext(registrySource + ';AFRO_TOOLS', { console });
const tools = taxonomy.getRegistryTools(registry);
const byId = Object.fromEntries(tools.map((tool) => [tool.id, tool]));
const bucketById = Object.fromEntries(taxonomy.getBuckets(registry).flatMap((bucket) => bucket.allTools.map((tool) => [tool.id, bucket])));
const start = '<!-- education-tool-journey:start -->';
const end = '<!-- education-tool-journey:end -->';
const css = '/assets/css/education-tool-journey.css';
const journeys = {
  'ssce-practice': { tip: 'Choose the exam, subject and year that match your revision goal. Review missed questions before moving on.', next: 'exam-timetable', reason: 'Put your next practice session beside the dates that matter.' },
  'flashcard-maker': { tip: 'Turn topics you missed into short, editable cards that you can revisit.', next: 'study-planner', reason: 'Give those review sessions a realistic place in your week.' },
  'exam-countdown': { tip: 'Confirm the date and time with the exam owner before using a countdown.', next: 'exam-timetable', reason: 'Keep all confirmed exam dates and revision blocks together.' },
  'exam-timetable': { tip: 'Enter confirmed dates first, then place practice and rest around them.', next: 'ssce-practice', reason: 'Use one scheduled block for subject practice.' },
  'university-admission': { tip: 'Start with the exact programme and institution requirements, then record what evidence is still missing.', next: 'school-fees', reason: 'Compare written costs for the options that remain.' },
  'waec-calculator': { tip: 'Enter the subjects and grades on your result. Verify programme rules with the institution.', next: 'university-admission', reason: 'Turn the result check into a programme evidence checklist.' },
  'jamb-aggregate': { tip: 'Use the weighting published by your target institution, not a generic admission cut-off.', next: 'university-admission', reason: 'Check the institution and programme requirements next.' },
  'kcse-calculator': { tip: 'Check your subject grades against the current course rules from the relevant institution.', next: 'university-admission', reason: 'Collect the programme requirements and application evidence.' },
  'matric-points': { tip: 'Keep the national admission route separate from each university\'s own APS or FPS formula.', next: 'university-admission', reason: 'Review the institution-specific entry path.' },
  'gpa-calculator': { tip: 'Select the scale your institution actually uses and enter course credits as stated.', next: 'course-load', reason: 'Audit remaining credits and the next term\'s workload.' },
  'school-fees': { tip: 'Bring written quotes for the same school year and check what each one includes.', next: 'student-budget', reason: 'See how the chosen quote fits a monthly budget.' },
  'student-budget': { tip: 'Use your own recurring costs and funding amounts; keep one-off expenses visible.', next: 'edu-savings', reason: 'Set a savings target for the gap you found.' },
  'boarding-school': { tip: 'List tuition, boarding, transport and extras from each school\'s written terms.', next: 'school-fees', reason: 'Compare the full fee picture side by side.' },
  'edu-savings': { tip: 'Set a target amount and deadline from a real fee or study-cost estimate.', next: 'student-budget', reason: 'Test the monthly contribution against your full budget.' },
  'student-loan-repay': { tip: 'Model the balance, rate and term shown in your agreement or statement.', next: 'student-budget', reason: 'Check whether the modelled payment is workable each month.' },
  'ke-helb': { tip: 'Start from your current HELB statement balance and the deduction or payment you control.', next: 'student-budget', reason: 'Place the repayment beside your other monthly costs.' },
  'scholarship-finder': { tip: 'Open the funder\'s current eligibility rules and deadline before shortlisting.', next: 'study-abroad-cost', reason: 'Calculate the costs that an award would still leave uncovered.' },
  'study-abroad-cost': { tip: 'Keep tuition, living, visa and travel amounts in one verified currency.', next: 'degree-checker', reason: 'Check which authority decides qualification recognition.' },
  'degree-checker': { tip: 'Identify the recognition decision owner and collect the documents it asks for.', next: 'university-ranking', reason: 'Compare programmes using official links and open questions.' },
  'university-ranking': { tip: 'Compare programmes you selected; add official links, dates and same-currency costs.', next: 'scholarship-finder', reason: 'Search for funding tied to the shortlisted programmes.' },
  'ielts-calculator': { tip: 'Use your actual section bands and the minimum score stated by the programme.', next: 'study-abroad-cost', reason: 'Include test and application costs in the destination budget.' },
  'study-planner': { tip: 'Start with the hours you can really use this week, then place the hardest tasks first.', next: 'flashcard-maker', reason: 'Build a reusable review deck for one scheduled topic.' },
  'course-load': { tip: 'Use your institution\'s credit rules and your own remaining-course list.', next: 'study-planner', reason: 'Turn the chosen course load into weekly study time.' },
  'citation-generator': { tip: 'Keep each source\'s author, title, date and URL beside the citation for final verification.', next: 'word-counter', reason: 'Check the finished draft against the assignment limit.' },
  'word-counter': { tip: 'Enter the real assignment limit and check your draft locally before submission.', next: 'citation-generator', reason: 'Review the reference list while you finish the draft.' },
  'plagiarism-pct': { tip: 'Use the local repetition check to spot wording you may want to revise; it cannot compare external sources.', next: 'citation-generator', reason: 'Verify that quoted and paraphrased sources are cited.' },
  'periodic-table': { tip: 'Search the element and review its source-backed properties before quiz practice.', next: 'flashcard-maker', reason: 'Save the concepts you want to recall later.' },
  'algebra-solver': { tip: 'Choose a supported equation form and inspect each checked step.', next: 'study-planner', reason: 'Schedule a short practice block for the method you missed.' },
  'statistics-calc': { tip: 'Decide whether the data is a sample or population before comparing results.', next: 'word-counter', reason: 'Check your written interpretation against the assignment limit.' },
  'fraction-calc': { tip: 'Review the exact simplification steps before applying the answer elsewhere.', next: 'percentage-calc', reason: 'Convert the fraction into a percentage scenario when needed.' },
  'percentage-calc': { tip: 'Choose the correct percentage question and confirm which value is the base.', next: 'statistics-calc', reason: 'Summarise a set of results with explicit conventions.' },
  'scientific-calc': { tip: 'Confirm degree or radian mode before evaluating an expression.', next: 'algebra-solver', reason: 'Work through supported equation types with checked steps.' },
  'roman-numerals': { tip: 'Use conventional notation and check the converted number before practice.', next: 'flashcard-maker', reason: 'Make cards for the forms you want to remember.' },
  'binary-converter': { tip: 'Set the input and output bases explicitly and review repeating-fraction precision.', next: 'scientific-calc', reason: 'Continue with supported arithmetic and functions.' },
  'teacher-salary': { tip: 'Use an actual offer and check pay, deductions and teaching hours separately.', next: 'classroom-size', reason: 'Review the room layout and constraints for the role.' },
  'tutoring-rate': { tip: 'Build a quote from your costs, available hours and income target.', next: 'teacher-salary', reason: 'Compare the quote with a teaching offer or workload.' },
  'classroom-size': { tip: 'Measure the space and source the constraints that apply locally.', next: 'teacher-salary', reason: 'Review teaching workload alongside the planned classroom.' },
  'cert-roi': { tip: 'Use a real course cost and an income scenario you can explain.', next: 'coding-bootcamp', reason: 'Compare another training route with the same assumptions.' },
  'coding-bootcamp': { tip: 'Use source-dated programme details and separate direct costs from time away from work.', next: 'cert-roi', reason: 'Test the cost and payback scenario for the preferred option.' },
  'interview-prep': { tip: 'Choose the role and employer type, then adapt the checklist to the interview invitation.', next: 'cert-roi', reason: 'Review whether a qualification investment fits your career plan.' },
  'nysc-allowance': { tip: 'Enter the allowance and support you actually expect, with paid months kept separate.', next: 'student-budget', reason: 'Check your wider monthly costs against the service-period plan.' },
  'national-service-gh': { tip: 'Use the official allowance you were told and reconcile due and received months.', next: 'student-budget', reason: 'Plan recurring costs from the cash you can confirm.' },
  'education-hub': { tip: 'Continue plans, shortlists and dates that you saved on this device.', next: 'study-planner', reason: 'Build or revise the weekly plan you want to keep.' }
};

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function panel(tool) {
  const flow = journeys[tool.id];
  const next = byId[flow.next];
  const bucket = bucketById[tool.id];
  return `${start}
<section class="education-tool-journey" aria-labelledby="education-journey-${esc(tool.id)}">
  <div class="education-tool-journey__inner">
    <div class="education-tool-journey__copy">
      <p class="education-tool-journey__eyebrow">${esc(bucket.title)} · Next step</p>
      <h2 id="education-journey-${esc(tool.id)}">Keep your study work moving</h2>
      <p>${esc(flow.tip)}</p>
    </div>
    <nav class="education-tool-journey__links" aria-label="After ${esc(tool.name)}">
      <a class="education-tool-journey__next" href="${esc(next.href)}"><span>A useful next tool</span><strong>${esc(next.name)} <span aria-hidden="true">→</span></strong><small>${esc(flow.reason)}</small></a>
      <a class="education-tool-journey__all" href="/education/">Browse all Education tools <span aria-hidden="true">→</span></a>
    </nav>
  </div>
</section>
${end}`;
}
function ensureMainLandmark(html, toolId) {
  if (/<main\b/i.test(html)) {
    if (/<main\b[^>]*\bid=["']main-content["']/i.test(html)) return html;
    return html.replace(/<main\b/i, '<main id="main-content"');
  }
  if ((html.match(/<\/afro-navbar>/gi) || []).length !== 1) throw new Error('Unexpected navbar shape: ' + toolId);
  return html
    .replace(/<\/afro-navbar>/i, '</afro-navbar>\n<main id="main-content" class="education-tool-main">')
    .replace(start, `</main>\n${start}`);
}

const extra = Object.keys(journeys).filter((id) => !byId[id]);
const missing = tools.filter((tool) => !journeys[tool.id]).map((tool) => tool.id);
if (extra.length || missing.length) throw new Error('Education journey map differs from registry: ' + JSON.stringify({ extra, missing }));
for (const tool of tools) {
  if (!byId[journeys[tool.id].next] || journeys[tool.id].next === tool.id) throw new Error('Invalid next tool for ' + tool.id);
  const file = path.join(root, tool.href.slice(1), 'index.html');
  if (!fs.existsSync(file)) throw new Error('Missing route: ' + file);
  const html = fs.readFileSync(file, 'utf8');
  const existing = html.match(/<!-- education-tool-journey:start -->[\s\S]*?<!-- education-tool-journey:end -->/g) || [];
  const stylesheet = /<link[^>]+href=["']\/assets\/css\/education-tool-journey\.css(?:\?[^"']*)?["'][^>]*>/i;
  const expected = panel(tool);
  if (process.argv.includes('--check')) {
    if (existing.length !== 1 || existing[0] !== expected || !stylesheet.test(html) || !/<main\b[^>]*\bid=["']main-content["']/i.test(html)) {
      console.error('Stale Education journey: ' + tool.id);
      process.exitCode = 1;
    }
    continue;
  }
  if ((html.match(/<afro-footer\b/gi) || []).length !== 1 || !/<\/head>/i.test(html)) throw new Error('Unexpected page shape: ' + tool.id);
  let output = html.replace(/\s*<!-- education-tool-journey:start -->[\s\S]*?<!-- education-tool-journey:end -->/g, '');
  if (!stylesheet.test(output)) output = output.replace(/<\/head>/i, `<link rel="stylesheet" href="${css}">\n</head>`);
  output = output.replace(/<afro-footer\b/i, `${expected}\n<afro-footer`);
  output = ensureMainLandmark(output, tool.id);
  if (output !== html) {
    fs.writeFileSync(file, output, 'utf8');
    console.log('Wrote ' + path.relative(root, file));
  }
}
