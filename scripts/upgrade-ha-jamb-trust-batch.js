const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const pages = [
  ['ha/jamb/cbt/index.html', 'JAMB CBT', '/jamb/cbt/', 'practice mode, time, keyboard shortcuts and review plan'],
  ['ha/jamb/lissafi/index.html', 'JAMB Lissafi', '/jamb/mathematics/', 'math topics, weak areas, timed practice and revision plan'],
  ['ha/jamb/tutor/index.html', 'Mai taimakon JAMB', '/jamb/tutor/', 'study prompt, subject, weak topic and teacher follow-up'],
  ['ha/jamb/halittu/index.html', 'JAMB Biology', '/jamb/biology/', 'biology topics, past questions and revision plan'],
  ['ha/jamb/tattalin-arziki/index.html', 'JAMB Economics', '/jamb/economics/', 'economics topics, definitions, diagrams and timed practice'],
  ['ha/jamb/gwamnati/index.html', 'JAMB Government', '/jamb/government/', 'government topics, civic concepts and past-question practice'],
  ['ha/jamb/kasuwanci/index.html', 'JAMB Commerce', '/jamb/commerce/', 'commerce topics, business terms and timed practice'],
  ['ha/jamb/adabi/index.html', 'JAMB Literature', '/jamb/literature/', 'literature texts, themes, devices and revision plan'],
  ['ha/jamb/tarihi/index.html', 'JAMB History', '/jamb/history/', 'history topics, dates, causes and revision plan'],
  ['ha/jamb/crk/index.html', 'JAMB CRK', '/jamb/crk/', 'CRK topics, passages, themes and revision plan']
].map(([file, title, source, prompt]) => ({ file, title, source, prompt }));

function escHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function styleBlock() {
  return `
<style data-ha-jamb-batch="style">
.ha-jamb-export,.ha-jamb-trust{width:min(1120px,calc(100% - 32px));margin:22px auto;border:1px solid #dbeafe;border-radius:14px;background:#fff;padding:18px;box-shadow:0 10px 26px rgba(15,23,42,.05);color:#0f172a}
.ha-jamb-export{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;background:linear-gradient(135deg,#f8fafc 0%,#fff 62%,#eff6ff 100%)}
.ha-jamb-export h2,.ha-jamb-trust h2{margin:0 0 8px;font-size:1.12rem;line-height:1.25}
.ha-jamb-export p,.ha-jamb-trust p{margin:0;color:#475569;line-height:1.6}
.ha-jamb-kicker{display:inline-block;margin-bottom:6px;color:#1d4ed8;font-size:.76rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
.ha-jamb-actions{display:flex;flex-wrap:wrap;gap:9px;align-items:center;justify-content:flex-end}
.ha-jamb-actions button{min-height:44px;border:0;border-radius:999px;padding:10px 14px;background:#0f172a;color:#fff;font:inherit;font-weight:900;cursor:pointer}
.ha-jamb-actions button:first-child{background:#0057b8}
.ha-jamb-actions span{font-size:.86rem;color:#475569}
.ha-jamb-trust-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:12px}
.ha-jamb-trust-grid p{border-left:4px solid #2563eb;background:#f8fafc;border-radius:10px;padding:10px 12px}
.ha-jamb-trust a{color:#0057b8;font-weight:800}
@media(max-width:720px){.ha-jamb-export{grid-template-columns:1fr}.ha-jamb-actions{justify-content:stretch}.ha-jamb-actions button{width:100%}}
</style>`;
}

function section(page) {
  return `
<section class="ha-jamb-export" data-ha-jamb-batch="export" data-jamb-title="${escHtml(page.title)}" data-jamb-source="${escHtml(page.source)}" data-jamb-prompt="${escHtml(page.prompt)}">
  <div>
    <span class="ha-jamb-kicker">Study brief export</span>
    <h2>Ajiye shirin karatu</h2>
    <p>Rubuta ko sabunta ${escHtml(page.prompt)}. Takaitawar tana zama a browser kuma za ka iya kwafi ko sauke ta a matsayin .txt.</p>
  </div>
  <div class="ha-jamb-actions">
    <button type="button" data-jamb-copy>Kwafi shirin</button>
    <button type="button" data-jamb-download>Sauke .txt</button>
    <span data-jamb-status aria-live="polite"></span>
  </div>
</section>
<section class="ha-jamb-trust" data-tool-verification-panel data-ha-jamb-batch="trust">
  <span class="ha-jamb-kicker">Source / freshness / methodology</span>
  <h2>Tushe, sabuntawa da iyaka</h2>
  <div class="ha-jamb-trust-grid">
    <p><strong>Source:</strong> This Hausa guide points to the AfroJAMB workflow at <a href="${escHtml(page.source)}">${escHtml(page.source)}</a>. It is not the official JAMB portal.</p>
    <p><strong>Official verification:</strong> Confirm exam dates, syllabus, subject combinations, registration rules, admission cut-offs and centre instructions with JAMB, the school, or an approved adviser.</p>
    <p><strong>Methodology:</strong> The page captures the student's subject, goal and weak areas, then links to the matching AfroJAMB practice or guide route for study planning.</p>
    <p><strong>Limitations:</strong> This is revision support only. It is not an official score, admission promise, malpractice tool, or replacement for a teacher.</p>
  </div>
</section>`;
}

function scriptBlock() {
  return `
<script data-ha-jamb-batch="export-js">
(function(){
  function fieldLines(){
    return Array.prototype.slice.call(document.querySelectorAll('label')).map(function(label){
      var target = label.getAttribute('for') ? document.getElementById(label.getAttribute('for')) : label.querySelector('input,select,textarea');
      if(!target) return '';
      var labelText = label.textContent.replace(/\\s+/g, ' ').trim();
      var value = target.tagName === 'SELECT' && target.selectedOptions.length ? target.selectedOptions[0].textContent : target.value;
      value = String(value || '').replace(/\\s+/g, ' ').trim();
      return value ? labelText + ': ' + value : '';
    }).filter(Boolean);
  }
  function brief(panel){
    var title = panel.getAttribute('data-jamb-title') || 'JAMB study plan';
    var source = panel.getAttribute('data-jamb-source') || location.pathname;
    var prompt = panel.getAttribute('data-jamb-prompt') || 'study plan';
    var lines = ['AfroTools Hausa - ' + title, 'Route: ' + location.pathname, 'Practice workflow: ' + source, 'Focus: ' + prompt, ''];
    var fields = fieldLines();
    if(fields.length) lines.push('Student notes', fields.join('\\n'), '');
    lines.push('Verification', 'Confirm official dates, syllabus, registration rules, subject combinations and admission requirements with JAMB or the school.');
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
  document.querySelectorAll('[data-ha-jamb-batch="export"]').forEach(function(panel){
    var status = panel.querySelector('[data-jamb-status]');
    var title = (panel.getAttribute('data-jamb-title') || 'jamb-plan').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'jamb-plan';
    var copy = panel.querySelector('[data-jamb-copy]');
    var download = panel.querySelector('[data-jamb-download]');
    if(copy) copy.addEventListener('click', function(){
      var text = brief(panel);
      function done(){ if(status) status.textContent = 'An kwafi shirin.'; }
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(done).catch(function(){ if(status) status.textContent = text; });
      } else if(status) {
        status.textContent = text;
      }
    });
    if(download) download.addEventListener('click', function(){
      downloadText('afrotools-' + title + '.txt', brief(panel));
      if(status) status.textContent = 'An sauke shirin.';
    });
  });
})();
</script>`;
}

let updated = 0;

for (const page of pages) {
  const fullPath = path.join(ROOT, page.file);
  let html = fs.readFileSync(fullPath, 'utf8');
  if (html.includes('data-ha-jamb-batch="export"')) {
    console.log(`Skip existing Hausa JAMB batch: ${page.file}`);
    continue;
  }
  if (!html.includes('data-ha-jamb-batch="style"')) {
    html = html.replace('</head>', `${styleBlock()}\n</head>`);
  }
  const insert = section(page);
  if (html.includes('<afro-footer></afro-footer>')) {
    html = html.replace('<afro-footer></afro-footer>', `${insert}\n<afro-footer></afro-footer>`);
  } else {
    html = html.replace('<afro-footer></afro-footer><script', `${insert}\n<afro-footer></afro-footer><script`);
  }
  const bodyClose = html.lastIndexOf('</body>');
  if (bodyClose === -1) throw new Error(`No closing body tag found in ${page.file}`);
  html = html.slice(0, bodyClose) + scriptBlock() + '\n' + html.slice(bodyClose);
  fs.writeFileSync(fullPath, html);
  updated += 1;
}

console.log(`Done. Updated ${updated} of ${pages.length} Hausa JAMB pages.`);
