const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const pages = [
  {
    file: 'yo/awon-ise/kalkuletan-waec-neco/index.html',
    title: 'WAEC/NECO calculator',
    source: '/tools/waec-calculator/',
    prompt: 'WAEC/NECO grades, best five total, credits and next study action',
    official: 'Verify final WAEC, NECO, school and admission requirements from the official exam body, school portal or admissions office.',
    method: 'The page maps each grade to points, picks the best five where relevant, and counts credit-grade subjects for planning.',
    limit: 'This is an education planning estimate, not an official result checker, certificate validation, or admission decision.'
  },
  {
    file: 'yo/awon-ise/kalkuletan-jamb/index.html',
    title: 'JAMB aggregate calculator',
    source: '/tools/jamb-aggregate/',
    prompt: 'UTME score, Post-UTME score, O-Level inputs, formula and cutoff planning',
    official: 'Confirm current JAMB rules, school formulas, cut-offs, subject combinations and admission notices with JAMB or the institution.',
    method: 'The page applies the selected formula to UTME, Post-UTME and optional O-Level inputs, then compares against a planning cutoff.',
    limit: 'This is a planning calculator, not an official JAMB portal, admission offer, cut-off guarantee or school-specific ruling.'
  },
  {
    file: 'yo/awon-ise/alawus-na-nysc/index.html',
    title: 'NYSC allowance calculator',
    source: '/tools/nysc-allowance/',
    prompt: 'NYSC allowance, state top-up, side income, expenses and monthly savings plan',
    official: 'Verify allowance, state top-up, posting rules, PPA rules and payment notices with NYSC, the state or your PPA.',
    method: 'The page totals federal allowance, selected state top-up and side income, then subtracts monthly expenses to show surplus or gap.',
    limit: 'This is a budget estimate, not an official NYSC payment notice, employment rule, financial advice or guarantee of state allowance.'
  },
  {
    file: 'ha/kayan-aiki/neman-tallafin-karatu/index.html',
    title: 'Mai nemo tallafin karatu',
    source: '/tools/scholarship-finder/',
    prompt: 'scholarship level, field, country, documents, deadline and verification checklist',
    official: 'Verify scholarship status, eligibility, deadlines, fees, documents and submission channels with the official funder or school.',
    method: 'The page captures study level, field and destination, then prepares a document and verification checklist for the source workflow.',
    limit: 'This is application preparation support, not a scholarship award, official listing, eligibility guarantee or payment request.'
  },
  {
    file: 'ha/jamb/kimiyya/index.html',
    title: 'JAMB Kimiyya',
    source: '/jamb/chemistry/',
    prompt: 'chemistry topics, weak areas, past-question practice and timed revision plan',
    official: 'Confirm the current syllabus, exam dates, subject requirements and admission rules with JAMB or the school.',
    method: 'The page captures the learner focus and routes to the matching AfroJAMB Chemistry practice workflow.',
    limit: 'This is revision support, not an official question bank, exam score, admission promise or malpractice tool.'
  },
  {
    file: 'ha/jamb/fisiks/index.html',
    title: 'JAMB Fisiks',
    source: '/jamb/physics/',
    prompt: 'physics topics, formulas, weak areas, diagrams and timed revision plan',
    official: 'Confirm the current syllabus, exam dates, subject requirements and admission rules with JAMB or the school.',
    method: 'The page captures the learner focus and routes to the matching AfroJAMB Physics practice workflow.',
    limit: 'This is revision support, not an official question bank, exam score, admission promise or malpractice tool.'
  },
  {
    file: 'ha/kayan-aiki/alawus-na-nysc/index.html',
    title: 'Kalkuletan alawus na NYSC',
    source: '/tools/nysc-allowance/',
    prompt: 'NYSC allowance, state top-up, side income, expenses and monthly savings plan',
    official: 'Verify allowance, state top-up, posting rules, PPA rules and payment notices with NYSC, the state or your PPA.',
    method: 'The page totals federal allowance, selected state top-up and side income, then subtracts monthly expenses to show surplus or gap.',
    limit: 'This is a budget estimate, not an official NYSC payment notice, employment rule, financial advice or guarantee of state allowance.'
  },
  {
    file: 'ha/kayan-aiki/kasafin-dalibi/index.html',
    title: 'Kasafin dalibi',
    source: '/tools/student-budget/',
    prompt: 'student income, fees, rent, food, transport, books and remaining budget',
    official: 'Verify tuition, hostel, transport, scholarship, bursary and deadline details with the school, sponsor or student affairs office.',
    method: 'The page totals the entered student expenses, subtracts them from available income, and prepares a shareable budget brief.',
    limit: 'This is a student planning estimate, not an official fee invoice, bursary approval, loan advice or payment instruction.'
  }
];

function escHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function styleBlock() {
  return `
<style data-mixed-education-batch="style">
.mixed-education-export,.mixed-education-trust{width:min(1080px,calc(100% - 32px));margin:22px auto;border:1px solid #dbeafe;border-radius:14px;background:#fff;padding:18px;box-shadow:0 10px 26px rgba(15,23,42,.05);color:#0f172a}
.mixed-education-export{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;background:linear-gradient(135deg,#f8fafc 0%,#fff 62%,#eff6ff 100%)}
.mixed-education-export h2,.mixed-education-trust h2{margin:0 0 8px;font-size:1.12rem;line-height:1.25}
.mixed-education-export p,.mixed-education-trust p{margin:0;color:#475569;line-height:1.6}
.mixed-education-kicker{display:inline-block;margin-bottom:6px;color:#1d4ed8;font-size:.76rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
.mixed-education-actions{display:flex;flex-wrap:wrap;gap:9px;align-items:center;justify-content:flex-end}
.mixed-education-actions button{min-height:44px;border:0;border-radius:999px;padding:10px 14px;background:#0f172a;color:#fff;font:inherit;font-weight:900;cursor:pointer}
.mixed-education-actions button:first-child{background:#0057b8}
.mixed-education-actions span{font-size:.86rem;color:#475569}
.mixed-education-trust-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:12px}
.mixed-education-trust-grid p{border-left:4px solid #2563eb;background:#f8fafc;border-radius:10px;padding:10px 12px}
.mixed-education-trust a{color:#0057b8;font-weight:800}
@media(max-width:720px){.mixed-education-export{grid-template-columns:1fr}.mixed-education-actions{justify-content:stretch}.mixed-education-actions button{width:100%}}
</style>`;
}

function section(page) {
  return `
<section class="mixed-education-export" data-mixed-education-batch="export" data-education-title="${escHtml(page.title)}" data-education-source="${escHtml(page.source)}" data-education-prompt="${escHtml(page.prompt)}" data-education-limit="${escHtml(page.limit)}">
  <div>
    <span class="mixed-education-kicker">Local-first export</span>
    <h2>Ajiye shirin ko sakamako</h2>
    <p>Capture ${escHtml(page.prompt)}. The brief is generated in this browser so you can copy or download it for study, school, sponsor or budget follow-up.</p>
  </div>
  <div class="mixed-education-actions">
    <button type="button" data-education-copy>Copy brief</button>
    <button type="button" data-education-download>Download .txt</button>
    <span data-education-status aria-live="polite"></span>
  </div>
</section>
<section class="mixed-education-trust" data-tool-verification-panel data-mixed-education-batch="trust">
  <span class="mixed-education-kicker">Source / freshness / methodology</span>
  <h2>Verification, freshness and limits</h2>
  <div class="mixed-education-trust-grid">
    <p><strong>Source:</strong> Based on the AfroTools workflow at <a href="${escHtml(page.source)}">${escHtml(page.source)}</a>.</p>
    <p><strong>Official verification:</strong> ${escHtml(page.official)}</p>
    <p><strong>Methodology:</strong> ${escHtml(page.method)}</p>
    <p><strong>Limitations:</strong> ${escHtml(page.limit)}</p>
  </div>
</section>`;
}

function scriptBlock() {
  return `
<script data-mixed-education-batch="export-js">
(function(){
  function fieldLines(){
    return Array.prototype.slice.call(document.querySelectorAll('label')).map(function(label){
      var target = label.getAttribute('for') ? document.getElementById(label.getAttribute('for')) : label.querySelector('input,select,textarea');
      if(!target || target.type === 'hidden') return '';
      var labelText = label.textContent.replace(/\\s+/g, ' ').trim();
      var value = target.tagName === 'SELECT' && target.selectedOptions.length ? target.selectedOptions[0].textContent : target.value;
      value = String(value || '').replace(/\\s+/g, ' ').trim();
      return value ? labelText + ': ' + value : '';
    }).filter(Boolean);
  }
  function resultLines(){
    return Array.prototype.slice.call(document.querySelectorAll('#result,#aidResult,#budgetResult,#nysc-result,.ha-result,.result-box')).map(function(el){
      var visible = el.offsetParent !== null || el.classList.contains('show') || el.style.display === 'block';
      if(!visible && !el.textContent.trim()) return '';
      return el.textContent.replace(/\\s+/g, ' ').trim();
    }).filter(Boolean);
  }
  function brief(panel){
    var title = panel.getAttribute('data-education-title') || 'Education tool';
    var source = panel.getAttribute('data-education-source') || location.pathname;
    var prompt = panel.getAttribute('data-education-prompt') || 'education planning';
    var limit = panel.getAttribute('data-education-limit') || '';
    var lines = ['AfroTools - ' + title, 'Route: ' + location.pathname, 'Workflow: ' + source, 'Focus: ' + prompt, ''];
    var fields = fieldLines();
    if(fields.length) lines.push('Inputs', fields.join('\\n'), '');
    var results = resultLines();
    if(results.length) lines.push('Current result', results.join('\\n\\n'), '');
    lines.push('Verification', 'Confirm official dates, fees, rules, eligibility, scores or payment details with the responsible exam body, school, funder, NYSC office or official portal.');
    if(limit) lines.push('', 'Limitations', limit);
    lines.push('', 'Privacy: generated locally in this browser.');
    return lines.join('\\n');
  }
  function downloadText(filename, text){
    var blob = new Blob([text], {type:'text/plain;charset=utf-8'});
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 800);
  }
  document.querySelectorAll('[data-mixed-education-batch="export"]').forEach(function(panel){
    var status = panel.querySelector('[data-education-status]');
    var title = (panel.getAttribute('data-education-title') || 'education-brief').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'education-brief';
    var copy = panel.querySelector('[data-education-copy]');
    var download = panel.querySelector('[data-education-download]');
    if(copy) copy.addEventListener('click', function(){
      var text = brief(panel);
      function done(){ if(status) status.textContent = 'Copied locally.'; }
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(done).catch(function(){ if(status) status.textContent = text; });
      } else if(status) {
        status.textContent = text;
      }
    });
    if(download) download.addEventListener('click', function(){
      downloadText('afrotools-' + title + '.txt', brief(panel));
      if(status) status.textContent = 'Downloaded locally.';
    });
  });
})();
</script>`;
}

let updated = 0;

for (const page of pages) {
  const fullPath = path.join(ROOT, page.file);
  let html = fs.readFileSync(fullPath, 'utf8');
  if (html.includes('data-mixed-education-batch="export"')) {
    console.log(`Skip existing mixed education batch: ${page.file}`);
    continue;
  }
  if (!html.includes('data-mixed-education-batch="style"')) {
    html = html.replace('</head>', `${styleBlock()}\n</head>`);
  }
  const insert = section(page);
  if (html.includes('<afro-footer></afro-footer>')) {
    html = html.replace('<afro-footer></afro-footer>', `${insert}\n<afro-footer></afro-footer>`);
  } else {
    throw new Error(`No footer anchor found in ${page.file}`);
  }
  const bodyClose = html.lastIndexOf('</body>');
  if (bodyClose === -1) throw new Error(`No closing body tag found in ${page.file}`);
  html = html.slice(0, bodyClose) + scriptBlock() + '\n' + html.slice(bodyClose);
  fs.writeFileSync(fullPath, html);
  updated += 1;
}

console.log(`Done. Updated ${updated} of ${pages.length} mixed education pages.`);
