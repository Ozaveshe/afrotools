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
    lang: 'ha',
    prompt: 'matakin tallafin karatu, fanni, kasa, takardu, ranar karshe da jerin tabbatarwa',
    official: 'Ka tabbatar da matsayin tallafin, cancanta, ranar karshe, caji, takardu da hanyar mikawa daga mai bayar da tallafin ko makaranta ta hukuma.',
    method: 'Shafin yana tattara matakin karatu, fanni da kasar da ake nema, sannan ya shirya jerin takardu da matakan tabbatarwa.',
    limit: 'Wannan taimakon shirya neman tallafi ne, ba bayar da tallafi ba ne, ba jerin hukuma ba ne, ba tabbacin cancanta ko neman biyan kudi ba ne.'
  },
  {
    file: 'ha/jamb/kimiyya/index.html',
    title: 'JAMB Kimiyya',
    source: '/jamb/chemistry/',
    lang: 'ha',
    prompt: 'batutuwan kimiyya, wuraren rauni, atisayen tsoffin tambayoyi da shirin bita mai lokaci',
    official: 'Ka tabbatar da sabuwar manhaja, ranar jarrabawa, bukatun darasi da kaidar admission daga JAMB ko makaranta.',
    method: 'Shafin yana tattara abin da dalibi yake son karantawa sannan ya kai shi atisayen Kimiyya na AfroJAMB da ya dace.',
    limit: 'Wannan taimakon bita ne, ba ajiyar tambayoyin hukuma ba ne, ba makin jarrabawa ko alkawarin admission ba ne, kuma ba kayan magudi ba ne.'
  },
  {
    file: 'ha/jamb/fisiks/index.html',
    title: 'JAMB Fisiks',
    source: '/jamb/physics/',
    lang: 'ha',
    prompt: 'batutuwan fisiks, kaidoji, wuraren rauni, zane-zane da shirin bita mai lokaci',
    official: 'Ka tabbatar da sabuwar manhaja, ranar jarrabawa, bukatun darasi da kaidar admission daga JAMB ko makaranta.',
    method: 'Shafin yana tattara abin da dalibi yake son karantawa sannan ya kai shi atisayen Fisiks na AfroJAMB da ya dace.',
    limit: 'Wannan taimakon bita ne, ba ajiyar tambayoyin hukuma ba ne, ba makin jarrabawa ko alkawarin admission ba ne, kuma ba kayan magudi ba ne.'
  },
  {
    file: 'ha/kayan-aiki/alawus-na-nysc/index.html',
    title: 'Kalkuletan alawus na NYSC',
    source: '/tools/nysc-allowance/',
    lang: 'ha',
    prompt: 'alawus na NYSC, karin kudin jiha, karin samun kudi, kashe kudi da shirin ajiyar wata',
    official: 'Ka tabbatar da alawus, karin kudin jiha, dokar posting, kaidar PPA da sanarwar biyan kudi daga NYSC, jiha ko PPA dinka.',
    method: 'Shafin yana tara alawus na tarayya, karin kudin jihar da aka zaba da sauran samun kudi, sannan ya cire kashe kudin wata domin nuna ragi ko gibi.',
    limit: 'Wannan kiyasin kasafi ne, ba sanarwar biyan kudi ta NYSC ba ce, ba dokar aiki ko shawarar kudi ba ce, kuma ba tabbacin karin kudin jiha ba ne.'
  },
  {
    file: 'ha/kayan-aiki/kasafin-dalibi/index.html',
    title: 'Kasafin dalibi',
    source: '/tools/student-budget/',
    lang: 'ha',
    prompt: 'kudin shiga na dalibi, kudin makaranta, haya, abinci, sufuri, littattafai da ragowar kasafi',
    official: 'Ka tabbatar da kudin makaranta, masauki, sufuri, tallafin karatu da ranar karshe daga makaranta, mai daukar nauyi ko ofishin kula da dalibai.',
    method: 'Shafin yana tara kudaden dalibi da aka shigar, ya cire su daga kudin da ake da shi, sannan ya shirya takaitaccen kasafi da za a iya rabawa.',
    limit: 'Wannan kiyasin shirin dalibi ne, ba takardar kudin hukuma ba ce, ba amincewar tallafi ba ce, ba shawarar bashi ko umarnin biya ba ne.'
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
  const ha = page.lang === 'ha';
  const copy = ha ? {
    kicker: 'Fitarwa a cikin burauza',
    title: 'Ajiye shirin ko sakamako',
    intro: `Rubuta ${page.prompt}. Ana gina takaitawar a burauzarka domin ka kwafa ko sauke ta.`,
    copy: 'Kwafi takaitawa',
    download: 'Sauke TXT',
    trustKicker: 'Tushe, sabuntawa da hanyar aiki',
    trustTitle: 'Tabbatarwa, sabuntawa da iyaka',
    source: 'Tushe',
    sourceLead: 'An tsara shi bisa hanyar AfroTools a',
    official: 'Tabbacin hukuma',
    method: 'Hanyar aiki',
    limit: 'Iyaka'
  } : {
    kicker: 'Local-first export',
    title: 'Ajiye shirin ko sakamako',
    intro: `Capture ${page.prompt}. The brief is generated in this browser so you can copy or download it for study, school, sponsor or budget follow-up.`,
    copy: 'Copy brief',
    download: 'Download .txt',
    trustKicker: 'Source / freshness / methodology',
    trustTitle: 'Verification, freshness and limits',
    source: 'Source',
    sourceLead: 'Based on the AfroTools workflow at',
    official: 'Official verification',
    method: 'Methodology',
    limit: 'Limitations'
  };
  return `
<section class="mixed-education-export" data-mixed-education-batch="export" data-education-lang="${ha ? 'ha' : 'yo'}" data-education-title="${escHtml(page.title)}" data-education-source="${escHtml(page.source)}" data-education-prompt="${escHtml(page.prompt)}" data-education-limit="${escHtml(page.limit)}">
  <div>
    <span class="mixed-education-kicker">${escHtml(copy.kicker)}</span>
    <h2>${escHtml(copy.title)}</h2>
    <p>${escHtml(copy.intro)}</p>
  </div>
  <div class="mixed-education-actions">
    <button type="button" data-education-copy>${escHtml(copy.copy)}</button>
    <button type="button" data-education-download>${escHtml(copy.download)}</button>
    <span data-education-status aria-live="polite"></span>
  </div>
</section>
<section class="mixed-education-trust" data-tool-verification-panel data-mixed-education-batch="trust">
  <span class="mixed-education-kicker">${escHtml(copy.trustKicker)}</span>
  <h2>${escHtml(copy.trustTitle)}</h2>
  <div class="mixed-education-trust-grid">
    <p><strong>${escHtml(copy.source)}:</strong> ${escHtml(copy.sourceLead)} <a href="${escHtml(page.source)}">${escHtml(page.source)}</a>.</p>
    <p><strong>${escHtml(copy.official)}:</strong> ${escHtml(page.official)}</p>
    <p><strong>${escHtml(copy.method)}:</strong> ${escHtml(page.method)}</p>
    <p><strong>${escHtml(copy.limit)}:</strong> ${escHtml(page.limit)}</p>
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
    var ha = panel.getAttribute('data-education-lang') === 'ha';
    var title = panel.getAttribute('data-education-title') || 'Education tool';
    var source = panel.getAttribute('data-education-source') || location.pathname;
    var prompt = panel.getAttribute('data-education-prompt') || 'education planning';
    var limit = panel.getAttribute('data-education-limit') || '';
    var lines = ha
      ? ['AfroTools - ' + title, 'Hanya: ' + location.pathname, 'Tsarin aiki: ' + source, 'Abin da za a maida hankali a kai: ' + prompt, '']
      : ['AfroTools - ' + title, 'Route: ' + location.pathname, 'Workflow: ' + source, 'Focus: ' + prompt, ''];
    var fields = fieldLines();
    if(fields.length) lines.push(ha ? 'Bayanan da aka shigar' : 'Inputs', fields.join('\\n'), '');
    var results = resultLines();
    if(results.length) lines.push(ha ? 'Sakamakon yanzu' : 'Current result', results.join('\\n\\n'), '');
    lines.push(ha ? 'Tabbatarwa' : 'Verification', ha
      ? 'Ka tabbatar da ranaku, caji, dokoki, cancanta, maki ko bayanin biya daga hukumar jarrabawa, makaranta, mai bayar da tallafi, ofishin NYSC ko portal na hukuma.'
      : 'Confirm official dates, fees, rules, eligibility, scores or payment details with the responsible exam body, school, funder, NYSC office or official portal.');
    if(limit) lines.push('', ha ? 'Iyaka' : 'Limitations', limit);
    lines.push('', ha ? 'Sirri: an gina wannan a cikin burauzarka.' : 'Privacy: generated locally in this browser.');
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
      function done(){ if(status) status.textContent = panel.getAttribute('data-education-lang') === 'ha' ? 'An kwafa takaitawar.' : 'Copied locally.'; }
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(done).catch(function(){ if(status) status.textContent = text; });
      } else if(status) {
        status.textContent = text;
      }
    });
    if(download) download.addEventListener('click', function(){
      downloadText('afrotools-' + title + '.txt', brief(panel));
      if(status) status.textContent = panel.getAttribute('data-education-lang') === 'ha' ? 'An sauke takaitawar.' : 'Downloaded locally.';
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
