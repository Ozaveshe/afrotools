const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const pages = [
  {
    file: 'sw/dr-congo/index.html',
    title: 'Zana za Jamhuri ya Kidemokrasia ya Kongo',
    type: 'country-payroll',
    source: 'Registry ya AfroTools, viungo vya PAYE/VAT/FX na mamlaka za kodi au ajira zinazopaswa kuthibitishwa kabla ya filing.',
    limitations: 'Kituo hiki hakitoi ushauri wa kodi, payroll rasmi, filing au uthibitisho wa uzingatiaji.'
  },
  {
    file: 'sw/madagascar/index.html',
    title: 'Kitovu cha Mishahara Madagaska',
    type: 'country-payroll',
    source: 'Registry ya AfroTools, zana za PAYE, mishahara, CNaPS/social security na viungo vya kanda ya Bahari ya Hindi.',
    limitations: 'Thibitisha viwango vya kodi, michango, likizo na ajira na mamlaka rasmi au mshauri mwenye sifa.'
  },
  {
    file: 'sw/seychelles/index.html',
    title: 'Njia ya Mishahara Shelisheli',
    type: 'country-payroll',
    source: 'Registry ya AfroTools, zana za PAYE, salary hub na viungo vya Shelisheli/Bahari ya Hindi.',
    limitations: 'Ni daraja la kupanga mishahara. Si payroll rasmi, si filing, na si uthibitisho wa sheria za ajira.'
  },
  {
    file: 'sw/zana/kalenda-ya-mitandao-ya-kijamii/index.html',
    title: 'Kalenda ya Mitandao ya Kijamii',
    type: 'creator-planning',
    source: 'Mchanganyiko wa maudhui wa AfroTools, ratiba ya mtumiaji, platform na timezone iliyochaguliwa.',
    limitations: 'Haihakikishi reach, followers, virality, brand deals, CPM, approval ya platform au mapato.'
  },
  {
    file: 'sw/zana/mtafsiri-wa-kiamhari/index.html',
    title: 'Mtafsiri wa Kiamhari',
    type: 'language',
    source: 'Phrasebook ya AfroTools, mifano ya Kiamhari/Ge ez, romanization na maelezo ya kujifunza.',
    limitations: 'Si tafsiri iliyothibitishwa. Hakiki hati rasmi, afya, mahakama, shule, visa au mikataba na mtafsiri au mtaalamu.'
  }
];

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function styleBlock() {
  return `<style data-final-localized-p3-batch="style">
.final-p3-panel{max-width:1100px;margin:1.5rem auto;padding:0 1rem}
.final-p3-card{background:#fff;border:1px solid #dbeafe;border-radius:14px;box-shadow:0 10px 28px rgba(15,23,42,.07);padding:1.1rem;margin-bottom:1rem}
.final-p3-kicker{display:block;font-size:.74rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#1d4ed8;margin-bottom:.35rem}
.final-p3-card h2{font-size:1.12rem;line-height:1.25;margin:0 0 .45rem;color:#0f172a}
.final-p3-card p{margin:.35rem 0;color:#475569;line-height:1.6}
.final-p3-actions{display:flex;flex-wrap:wrap;gap:.65rem;align-items:center;margin-top:.85rem}
.final-p3-actions button{border:0;border-radius:999px;background:#0f172a;color:#fff;font:inherit;font-weight:850;padding:.72rem 1rem;cursor:pointer}
.final-p3-actions button:first-child{background:#0057b8}
.final-p3-actions button:focus-visible{outline:3px solid #93c5fd;outline-offset:2px}
.final-p3-status{font-size:.86rem;color:#64748b;min-height:1.2em}
.final-p3-local{border-left:4px solid #16a34a;background:#f0fdf4;border-radius:10px;padding:.8rem;margin-top:.85rem;color:#365346}
.final-p3-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:.75rem;margin-top:.85rem}
.final-p3-item{border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;padding:.85rem}
.final-p3-item strong{display:block;color:#0f172a;margin-bottom:.3rem}
@media(max-width:640px){.final-p3-actions button{width:100%}.final-p3-card{padding:1rem}}
</style>`;
}

function panel(page) {
  return `<section class="final-p3-panel" data-final-localized-p3-batch="panel" data-final-p3-type="${esc(page.type)}">
  <div class="final-p3-card">
    <span class="final-p3-kicker">Muhtasari wa kutumia</span>
    <h2>Nakili au pakua hatua inayofuata</h2>
    <p>Tumia paneli hii baada ya kuchagua zana au kutengeneza matokeo. Inatoa muhtasari mfupi unaoweza kushirikiwa na timu, mshauri au mtaalamu.</p>
    <div class="final-p3-actions">
      <button type="button" data-final-p3-copy>Nakili muhtasari</button>
      <button type="button" data-final-p3-download>Pakua TXT</button>
      <span class="final-p3-status" data-final-p3-status aria-live="polite">Tayari kusafirisha.</span>
    </div>
    <p class="final-p3-local"><strong>Local-first:</strong> Muhtasari hutengenezwa kwenye browser yako. Usiongeze data nyeti, namba za kodi, salary ya mtu, hati rasmi au taarifa binafsi isipokuwa ni muhimu.</p>
  </div>
  <div class="final-p3-card" data-tool-verification-panel>
    <span class="final-p3-kicker">Vyanzo, muda na mipaka</span>
    <div class="final-p3-grid">
      <p class="final-p3-item"><strong>Source</strong>${esc(page.source)}</p>
      <p class="final-p3-item"><strong>Freshness</strong>Ukaguzi wa 2026: viwango, portals, sheria, sera za platform na data za lugha zinaweza kubadilika.</p>
      <p class="final-p3-item"><strong>Methodology</strong>Unganisha maelezo ya ukurasa, chaguo za mtumiaji na viungo vya zana. Matokeo ni planning aid, si ushahidi rasmi.</p>
      <p class="final-p3-item"><strong>Limitations</strong>${esc(page.limitations)}</p>
    </div>
  </div>
</section>`;
}

function scriptBlock(page) {
  return `<script data-final-localized-p3-batch="script">
(function(){
  'use strict';
  var labels = ${JSON.stringify({
    title: page.title,
    copied: 'Muhtasari umenakiliwa.',
    downloaded: 'Muhtasari umepakuliwa.',
    fallback: 'Chagua zana, jaza fomu au soma ukurasa kabla ya kushiriki muhtasari.'
  })};
  function clean(value){ return (value || '').replace(/\\s+/g, ' ').trim(); }
  function selectedFields(){
    return Array.prototype.slice.call(document.querySelectorAll('label')).map(function(label){
      var field = label.querySelector('input,select,textarea');
      if (!field) {
        var id = label.getAttribute('for');
        field = id ? document.getElementById(id) : null;
      }
      if (!field) return '';
      var value = field.options ? field.options[field.selectedIndex].text : field.value;
      value = clean(value);
      if (!value) return '';
      return clean(label.textContent) + ': ' + value;
    }).filter(Boolean).slice(0, 12);
  }
  function visibleOutput(){
    var selectors = ['#result', '#results', '#detail', '[data-country-output]', '[aria-live="polite"]'];
    var parts = [];
    selectors.forEach(function(selector){
      document.querySelectorAll(selector).forEach(function(node){
        var value = clean(node.innerText || node.textContent);
        if (value && parts.indexOf(value) === -1) parts.push(value);
      });
    });
    return parts.join('\\n').slice(0, 2400);
  }
  function summary(){
    var lines = ['AfroTools - ' + labels.title, 'Generated locally in this browser.', ''];
    var fields = selectedFields();
    if (fields.length) lines.push('Inputs:\\n' + fields.join('\\n'));
    lines.push('', 'Result / brief:', visibleOutput() || labels.fallback);
    lines.push('', 'Verification: confirm official rules, source dates, platform policies or language/country details before acting.');
    return lines.join('\\n');
  }
  function setStatus(value){
    var status = document.querySelector('[data-final-p3-status]');
    if (status) status.textContent = value;
  }
  function downloadText(value){
    var blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = labels.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-afrotools-brief.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  }
  document.addEventListener('click', function(event){
    var copy = event.target.closest('[data-final-p3-copy]');
    var download = event.target.closest('[data-final-p3-download]');
    if (!copy && !download) return;
    var value = summary();
    if (copy) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function(){ setStatus(labels.copied); }).catch(function(){ setStatus(value); });
      } else {
        setStatus(value);
      }
    }
    if (download) {
      downloadText(value);
      setStatus(labels.downloaded);
    }
  });
})();
</script>`;
}

function insertBeforeLast(html, marker, block, file) {
  const index = html.lastIndexOf(marker);
  if (index === -1) throw new Error(`Could not find ${marker} in ${file}`);
  return html.slice(0, index) + block + '\n' + html.slice(index);
}

let changed = 0;

for (const page of pages) {
  const abs = path.join(ROOT, page.file);
  let html = fs.readFileSync(abs, 'utf8');
  const original = html;

  if (!html.includes('data-final-localized-p3-batch="style"')) {
    html = insertBeforeLast(html, '</head>', styleBlock() + '\n', page.file);
  }
  if (!html.includes('data-final-localized-p3-batch="panel"')) {
    html = insertBeforeLast(html, '<afro-footer', panel(page) + '\n', page.file);
  }
  if (!html.includes('data-final-localized-p3-batch="script"')) {
    html = insertBeforeLast(html, '</body>', scriptBlock(page) + '\n', page.file);
  }

  if (html !== original) {
    fs.writeFileSync(abs, html, 'utf8');
    changed += 1;
    console.log(`Updated ${page.file}`);
  } else {
    console.log(`Already current ${page.file}`);
  }
}

console.log(`Final localized P3 trust batch complete: ${changed} file(s) changed.`);
