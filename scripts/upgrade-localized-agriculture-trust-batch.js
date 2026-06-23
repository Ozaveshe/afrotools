const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const pages = [
  {
    file: 'ha/kayan-aiki/sarrafa-rogo/index.html',
    lang: 'ha',
    title: 'Sarrafa rogo',
    type: 'cassava',
    source: 'Bayanan FAO, IITA da bayanan kasuwar gida da ke cikin tsarin AfroTools.'
  },
  {
    file: 'ha/noma/yawan-iri-najeriya/index.html',
    lang: 'ha',
    title: 'Yawan iri Najeriya',
    type: 'seed',
    source: 'Bayanan amfanin gona, tazarar shuka da farashin iri daga tsarin noma na AfroTools.'
  },
  {
    file: 'ha/kayan-aiki/ribar-gona/index.html',
    lang: 'ha',
    title: 'Ribar gona Najeriya',
    type: 'profit',
    source: 'Bayanan FAOSTAT, ILO, WFP, APHLIS da bayanan noma na kasa a cikin AfroTools.'
  },
  {
    file: 'sw/kilimo/mavuno/tanzania/index.html',
    lang: 'sw',
    title: 'Mavuno Tanzania',
    type: 'yield',
    source: 'Data za FAOSTAT, CGIAR, takwimu za kitaifa na kilimo na Tanzania na ndani ya AfroTools.'
  },
  {
    file: 'sw/kilimo/mavuno/uganda/index.html',
    lang: 'sw',
    title: 'Mavuno Uganda',
    type: 'yield',
    source: 'Data za FAOSTAT, CGIAR na takwimu za kitaifa za Uganda zilizo katika AfroTools.'
  },
  {
    file: 'sw/kilimo/umwagiliaji/burundi/index.html',
    lang: 'sw',
    title: 'Umwagiliaji Burundi',
    type: 'irrigation',
    source: 'Mbinu ya FAO Penman-Monteith na data za hali ya hewa/mazao zilizohifadhiwa ndani ya AfroTools.'
  },
  {
    file: 'sw/kilimo/umwagiliaji/kenya/index.html',
    lang: 'sw',
    title: 'Umwagiliaji Kenya',
    type: 'irrigation',
    source: 'Mbinu ya FAO Penman-Monteith na data za hali ya hewa/mazao za Kenya zilizohifadhiwa ndani ya AfroTools.'
  },
  {
    file: 'sw/kilimo/umwagiliaji/rwanda/index.html',
    lang: 'sw',
    title: 'Umwagiliaji Rwanda',
    type: 'irrigation',
    source: 'Mbinu ya FAO Penman-Monteith na data za hali ya hewa/mazao za Rwanda zilizohifadhiwa ndani ya AfroTools.'
  },
  {
    file: 'sw/kilimo/umwagiliaji/tanzania/index.html',
    lang: 'sw',
    title: 'Umwagiliaji Tanzania',
    type: 'irrigation',
    source: 'Mbinu ya FAO Penman-Monteith na data za hali ya hewa/mazao za Tanzania zilizohifadhiwa ndani ya AfroTools.'
  },
  {
    file: 'sw/kilimo/umwagiliaji/uganda/index.html',
    lang: 'sw',
    title: 'Umwagiliaji Uganda',
    type: 'irrigation',
    source: 'Mbinu ya FAO Penman-Monteith na data za hali ya hewa/mazao za Uganda zilizohifadhiwa ndani ya AfroTools.'
  }
];

const copy = {
  ha: {
    kicker: 'Ajiye sakamako',
    heading: 'Fitar da tsarin noma',
    intro: 'Bayan ka yi lissafi, kwafi ko sauke takaitaccen sakamakon domin raba shi da mai ba da shawarar noma, abokin kasuwanci ko mai saye.',
    copy: 'Kwafi sakamako',
    download: 'Sauke TXT',
    statusReady: 'A shirye don fitarwa.',
    copied: 'An kwafi takaitawa.',
    downloaded: 'An sauke takaitawa.',
    fallback: 'Sakamako bai bayyana ba tukuna. Yi lissafi ko duba shigar da bayanai.',
    privacyTitle: 'Sirri',
    privacy: 'Bayanan da ka shigar suna aiki a browser dinka. Ba a aika farashin gona, girman gona ko kudin aiki zuwa sabar AfroTools daga wannan panel.',
    trustTitle: 'Tushen bayanai da iyaka',
    source: 'Source',
    freshness: 'Freshness',
    methodology: 'Methodology',
    limitations: 'Limitations',
    freshnessText: 'An tsara wannan a matsayin kiyasin 2026; farashin kasuwa, yanayi, kwari, kudi da dokokin gida na iya canzawa.',
    methodologyText: 'Injin lissafi yana hada shigar da mai amfani da bayanan gona da aka ajiye a AfroTools. Sakamako yana taimakawa wajen tsara aiki, ba wai shawarar hukuma ba.',
    limitationsText: 'Tabbatar da farashi, iri, taki, ruwa, kasar gona, yanayi da shawarar jamiin fadakar da manoma kafin kashe kudi mai yawa.'
  },
  sw: {
    kicker: 'Hifadhi matokeo',
    heading: 'Toa muhtasari wa shamba',
    intro: 'Baada ya kukokotoa, nakili au pakua matokeo ili uyashiriki na afisa ugani, mshirika wa biashara au mnunuzi.',
    copy: 'Nakili matokeo',
    download: 'Pakua TXT',
    statusReady: 'Tayari kutoa muhtasari.',
    copied: 'Muhtasari umenakiliwa.',
    downloaded: 'Muhtasari umepakuliwa.',
    fallback: 'Matokeo hayajaonekana bado. Kokotoa kwanza au angalia taarifa ulizoingiza.',
    privacyTitle: 'Faragha',
    privacy: 'Taarifa unazoingiza zinachakatwa kwenye browser yako. Paneli hii haitumi bei, ukubwa wa shamba au gharama zako kwa seva ya AfroTools.',
    trustTitle: 'Vyanzo na mipaka',
    source: 'Source',
    freshness: 'Freshness',
    methodology: 'Methodology',
    limitations: 'Limitations',
    freshnessText: 'Hii ni makadirio ya kupanga mwaka 2026; bei za soko, hali ya hewa, wadudu, gharama na sheria za eneo zinaweza kubadilika.',
    methodologyText: 'Injini ya kikokotoo huunganisha taarifa za mtumiaji na data za kilimo zilizohifadhiwa ndani ya AfroTools. Matokeo ni ya kupanga, si ushauri rasmi.',
    limitationsText: 'Thibitisha bei, mbegu, mbolea, maji, udongo, hali ya hewa na ushauri wa afisa ugani kabla ya kutumia fedha nyingi.'
  }
};

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function styleBlock() {
  return `<style data-localized-agriculture-batch="style">
.agri-export-panel{max-width:1100px;margin:1.5rem auto;padding:0 1rem}
.agri-export-card{background:#fff;border:1px solid #dbeafe;border-radius:14px;box-shadow:0 10px 28px rgba(15,23,42,.07);padding:1.1rem;margin-bottom:1rem}
.agri-export-kicker{display:block;font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#1d4ed8;margin-bottom:.35rem}
.agri-export-card h2{font-size:1.15rem;line-height:1.25;margin:0 0 .45rem;color:#0f172a}
.agri-export-card p{color:#475569;line-height:1.58;margin:.35rem 0}
.agri-export-actions{display:flex;flex-wrap:wrap;gap:.65rem;margin-top:.85rem;align-items:center}
.agri-export-actions button{border:0;border-radius:999px;background:#0f172a;color:#fff;font:inherit;font-weight:800;padding:.72rem 1rem;cursor:pointer}
.agri-export-actions button:first-child{background:#0057b8}
.agri-export-actions button:focus-visible{outline:3px solid #93c5fd;outline-offset:2px}
.agri-export-status{font-size:.86rem;color:#64748b;min-height:1.2em}
.agri-trust-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:.75rem;margin-top:.85rem}
.agri-trust-item{border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;padding:.85rem}
.agri-trust-item strong{display:block;color:#0f172a;margin-bottom:.3rem}
.agri-local-note{border-left:4px solid #16a34a;background:#f0fdf4;border-radius:10px;padding:.8rem;margin-top:.8rem;color:#365346}
@media(max-width:640px){.agri-export-actions button{width:100%}.agri-export-card{padding:1rem}}
</style>`;
}

function panel(page) {
  const t = copy[page.lang];
  return `<section class="agri-export-panel" data-localized-agriculture-batch="export" data-agri-page-type="${esc(page.type)}">
  <div class="agri-export-card">
    <span class="agri-export-kicker">${esc(t.kicker)}</span>
    <h2>${esc(t.heading)}</h2>
    <p>${esc(t.intro)}</p>
    <div class="agri-export-actions">
      <button type="button" data-agri-copy>${esc(t.copy)}</button>
      <button type="button" data-agri-download>${esc(t.download)}</button>
      <span class="agri-export-status" data-agri-status aria-live="polite">${esc(t.statusReady)}</span>
    </div>
    <p class="agri-local-note"><strong>${esc(t.privacyTitle)}:</strong> ${esc(t.privacy)}</p>
  </div>
  <div class="agri-export-card" data-tool-verification-panel>
    <span class="agri-export-kicker">${esc(t.trustTitle)}</span>
    <div class="agri-trust-grid">
      <p class="agri-trust-item"><strong>${esc(t.source)}</strong>${esc(page.source)}</p>
      <p class="agri-trust-item"><strong>${esc(t.freshness)}</strong>${esc(t.freshnessText)}</p>
      <p class="agri-trust-item"><strong>${esc(t.methodology)}</strong>${esc(t.methodologyText)}</p>
      <p class="agri-trust-item"><strong>${esc(t.limitations)}</strong>${esc(t.limitationsText)}</p>
    </div>
  </div>
</section>`;
}

function scriptBlock(page) {
  const t = copy[page.lang];
  return `<script data-localized-agriculture-batch="export-js">
(function(){
  'use strict';
  var labels = ${JSON.stringify({
    title: page.title,
    fallback: t.fallback,
    copied: t.copied,
    downloaded: t.downloaded
  })};
  function text(selector){
    var node = document.querySelector(selector);
    return node ? (node.innerText || node.textContent || '').replace(/\\s+/g,' ').trim() : '';
  }
  function inputs(){
    return Array.prototype.slice.call(document.querySelectorAll('label')).map(function(label){
      var id = label.getAttribute('for');
      if (!id) return '';
      var field = document.getElementById(id);
      if (!field) return '';
      var value = field.options ? field.options[field.selectedIndex].text : field.value;
      if (value === undefined || value === null || String(value).trim() === '') return '';
      return label.textContent.replace(/\\s+/g,' ').trim() + ': ' + String(value).trim();
    }).filter(Boolean).slice(0, 14);
  }
  function results(){
    var selectors = ['#resultsPanel', '.results-wrap.on', '.ir-results.visible', '.ha-results.on', '.ha-results', '.ir-results', '.results-wrap'];
    var out = [];
    selectors.forEach(function(selector){
      var value = text(selector);
      if (value && out.indexOf(value) === -1) out.push(value);
    });
    return out.join('\\n').slice(0, 2800);
  }
  function summary(){
    var lines = ['AfroTools - ' + labels.title, 'Generated locally in this browser.', ''];
    var data = inputs();
    if (data.length) lines.push('Inputs:\\n' + data.join('\\n'));
    var result = results();
    lines.push('', 'Results:', result || labels.fallback);
    lines.push('', 'Note: planning estimate only. Verify local prices, weather, soil, water, buyer terms and extension advice before spending.');
    return lines.join('\\n');
  }
  function setStatus(msg){
    var status = document.querySelector('[data-agri-status]');
    if (status) status.textContent = msg;
  }
  function downloadText(textValue){
    var blob = new Blob([textValue], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = labels.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '-afrotools-summary.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  }
  document.addEventListener('click', function(event){
    var copyBtn = event.target.closest('[data-agri-copy]');
    var downloadBtn = event.target.closest('[data-agri-download]');
    if (!copyBtn && !downloadBtn) return;
    var value = summary();
    if (copyBtn) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function(){ setStatus(labels.copied); }).catch(function(){ setStatus(value); });
      } else {
        setStatus(value);
      }
    }
    if (downloadBtn) {
      downloadText(value);
      setStatus(labels.downloaded);
    }
  });
})();
</script>`;
}

function insertBeforeClosing(html, marker, block, file) {
  const index = html.lastIndexOf(marker);
  if (index === -1) {
    throw new Error(`Could not find ${marker} in ${file}`);
  }
  return html.slice(0, index) + block + '\n' + html.slice(index);
}

let changed = 0;

for (const page of pages) {
  const abs = path.join(ROOT, page.file);
  let html = fs.readFileSync(abs, 'utf8');
  const original = html;

  if (!html.includes('data-localized-agriculture-batch="style"')) {
    html = insertBeforeClosing(html, '</head>', styleBlock() + '\n', page.file);
  }

  if (!html.includes('data-localized-agriculture-batch="export"')) {
    html = insertBeforeClosing(html, '<afro-footer>', panel(page) + '\n', page.file);
  }

  if (!html.includes('data-localized-agriculture-batch="export-js"')) {
    html = insertBeforeClosing(html, '</body>', scriptBlock(page) + '\n', page.file);
  }

  if (html !== original) {
    fs.writeFileSync(abs, html, 'utf8');
    changed += 1;
    console.log(`Updated ${page.file}`);
  } else {
    console.log(`Already current ${page.file}`);
  }
}

console.log(`Localized agriculture batch complete: ${changed} file(s) changed.`);
