const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const pages = [
  {
    file: 'ha/kayan-aiki/kudin-asibiti/index.html',
    title: 'Kudin asibiti',
    source: '/tools/hospital-cost/',
    prompt: 'kwatanta asibiti, aikin lafiya, farashi da tambayoyin da za a yi',
    note: 'Kiyasin farashi ne kawai. Farashin gaskiya ya danganta da asibiti, gari, inshora, gwaje-gwaje, magani da yanayin mara lafiya.',
    exportTitle: 'Fitar da takaitaccen shirin asibiti',
    copy: 'Kwafi shirin',
    download: 'Sauke .txt',
    trustTitle: 'Tushe, sabuntawa da iyaka',
    privacy: 'Bayananka yana zama a burauzarka. Ba mu tura bayanan lafiya ko kudi zuwa uwar garke daga wannan shafi ba.',
    methodology: 'Hanyar lissafi: shafin yana amfani da jadawalin farashi na AfroTools don kasa, irin asibiti da aikin lafiya, sannan ya nuna kwatance tsakanin wurare.',
    freshness: 'Sabuntawa: farashin lafiya yana canzawa. Tabbatar da farashi kai tsaye da asibiti, cibiyar lafiya, HMO ko kamfanin inshora kafin biya.',
    limitations: 'Iyaka: ba takardar kudi ba ce, ba shawarar likita ba ce, kuma ba ta maye gurbin kulawar gaggawa ko ganewar cuta ba.'
  },
  {
    file: 'yo/awon-ise/owo-ile-iwosan/index.html',
    title: 'Owo ile iwosan',
    source: '/tools/hospital-cost/',
    prompt: 'afiwe owo iwosan, ibi itoju, iru ise ati ibeere fun clinic',
    note: 'Afiyesi owo nikan ni. Owo gidi le yato nitori ilu, ile iwosan, idanwo, oogun, insurance ati ipo alaisan.',
    exportTitle: 'Fi eto owo ile iwosan pamo',
    copy: 'Kopi eto',
    download: 'Gba .txt',
    trustTitle: 'Orisun, igba imudojuiwon ati opin',
    privacy: 'Alaye re wa ninu browser nikan. Oju iwe yii ko ran alaye ilera tabi owo si server.',
    methodology: 'Methodology: oju iwe n lo tabili owo AfroTools fun orile-ede, iru ile iwosan ati ise itoju, leyin naa o fi afiwe han.',
    freshness: 'Freshness: owo ilera n yipada. Jerisi owo pelu ile iwosan, clinic tabi insurance ki o to sanwo.',
    limitations: 'Limitations: kii se invoice osise, kii se medical advice, ko si ropo emergency care tabi diagnosis.'
  },
  {
    file: 'ha/kayan-aiki/duba-genotype/index.html',
    title: 'Duba genotype da rukunin jini',
    source: '/tools/genotype-checker/',
    prompt: 'genotype, Rh, blood group, sakamakon Punnett da tambayoyin lab',
    note: 'Bayani ne kawai. Tabbatar da genotype, Rh ko rukunin jini da lab mai inganci da kwararren lafiya.',
    exportTitle: 'Fitar da takaitaccen genotype',
    copy: 'Kwafi sakamako',
    download: 'Sauke .txt',
    trustTitle: 'Tushe, sabuntawa da iyaka',
    privacy: 'Bayananka yana zama a burauzarka. Kada ka saka cikakken sunan mutum ko sakamakon lab na sirri idan kana rabawa.',
    methodology: 'Hanyar lissafi: shafin yana amfani da jadawalin Punnett don hada alleles daga genotype biyu, sannan ya nuna yiwuwar kaso-kaso.',
    freshness: 'Sabuntawa: kaidojin gado ba sa canzawa sau da yawa, amma fassarar lafiya da shawarwari na iya bukatar kwararren likita.',
    limitations: 'Iyaka: ba sakamakon lab ba ne, ba ganewar cuta ba ne, kuma ba shawarar aure, ciki ko magani ba ce.'
  },
  {
    file: 'yo/awon-ise/duba-genotype/index.html',
    title: 'Duba genotype ati blood group',
    source: '/tools/genotype-checker/',
    prompt: 'genotype, Rh, blood group, Punnett ati ibeere fun lab',
    note: 'Alaye nikan ni. Jerisi genotype, Rh tabi blood group pelu yara idanwo ati onisegun.',
    exportTitle: 'Fi abajade genotype pamo',
    copy: 'Kopi abajade',
    download: 'Gba .txt',
    trustTitle: 'Orisun, igba imudojuiwon ati opin',
    privacy: 'Alaye re wa ninu browser nikan. Ma se fi oruko kikun tabi iwe idanwo elomiran sinu ohun ti o pin.',
    methodology: 'Methodology: oju iwe n lo Punnett square lati da alleles genotype meji po, leyin naa o fi ipin seese han.',
    freshness: 'Freshness: ofin inheritance ko yipada lojoojumo, sugbon itumo ilera ye ki onisegun tabi genetic counsellor salaye.',
    limitations: 'Limitations: kii se lab result, kii se diagnosis, ko si ropo medical advice, oyun advice tabi counselling.'
  },
  {
    file: 'ha/kayan-aiki/sickle-cell/index.html',
    title: 'Jagorar genotype da sikila',
    source: '/tools/sickle-cell/',
    prompt: 'genotype, yiwuwar SS ko SC, Punnett da tambayoyin shawarar kwararre',
    note: 'Bayani ne kawai. Idan akwai S ko C a genotype, tattauna da mai ba da shawara kan kwayoyin gado ko likita.',
    exportTitle: 'Fitar da takaitaccen shirin sikila',
    copy: 'Kwafi sakamako',
    download: 'Sauke .txt',
    trustTitle: 'Tushe, sabuntawa da iyaka',
    privacy: 'Bayananka yana zama a burauzarka. Kar a saka bayanan sirri na yara, iyali ko sakamakon lab idan za a raba takaitawa.',
    methodology: 'Hanyar lissafi: jadawalin Punnett yana hada genotype biyu, yana kirga kaso na AA, AS, SS, AC, SC ko CC a kowane ciki.',
    freshness: 'Sabuntawa: tsarin gado na genotype yana da karko, amma shawarar kula da lafiya da gwaje-gwaje na bukatar kwararren lafiya.',
    limitations: 'Iyaka: ba ganewar cuta ba ce, ba sakamakon lab ba ce, kuma ba ta maye gurbin genetic counselling ko kulawar likita ba.'
  },
  {
    file: 'ha/kayan-aiki/kudin-haihuwa/index.html',
    title: 'Kudin haihuwa',
    source: '/tools/childbirth-cost/',
    prompt: 'ANC, haihuwa, C-section, inshora da tambayoyin antenatal',
    note: 'Kiyasin kasafi ne kawai. Idan akwai alamar gaggawa, neman kulawar lafiya ya fi lissafin kudi muhimmanci.',
    exportTitle: 'Fitar da shirin kasafin haihuwa',
    copy: 'Kwafi shirin',
    download: 'Sauke .txt',
    trustTitle: 'Tushe, sabuntawa da iyaka',
    privacy: 'Bayananka yana zama a burauzarka. Ba mu tura bayanan ciki, haihuwa, lafiya ko kudi zuwa uwar garke daga wannan shafi ba.',
    methodology: 'Hanyar lissafi: shafin yana tara ziyarar antenatal, kudin haihuwa, kiyasin magani da kulawar bayan haihuwa bisa kasa da irin asibiti.',
    freshness: 'Sabuntawa: farashin haihuwa, tsarin inshora da abin da asibiti ke rufewa suna canzawa. Tabbatar da cibiyar kula da masu ciki ko asibiti.',
    limitations: 'Iyaka: ba shawarar likita ba ce, ba ta zabar irin haihuwa ba, kuma ba ta maye gurbin kulawar antenatal ko gaggawa ba.'
  },
  {
    file: 'ha/kayan-aiki/abincin-afirka/index.html',
    title: 'Tsarin abincin Afirka',
    source: '/tools/african-meal-plan/',
    prompt: 'calories, BMR, TDEE, burin abinci, jerin siyayya da gargadin lafiya',
    note: 'Tsarin abinci ne na tsarawa kawai. Idan kana da wata matsalar lafiya ko ciki, tattauna da likita ko masanin abinci.',
    exportTitle: 'Fitar da tsarin abinci',
    copy: 'Kwafi tsarin',
    download: 'Sauke .txt',
    trustTitle: 'Tushe, sabuntawa da iyaka',
    privacy: 'Bayananka yana zama a burauzarka. Ba mu tura nauyi, tsayi, buri ko bayanan lafiya zuwa uwar garke daga wannan shafi ba.',
    methodology: 'Hanyar lissafi: shafin yana kiyasta BMR/TDEE, ya daidaita calories bisa buri, sannan ya zabi abincin Afirka da jerin siyayya.',
    freshness: 'Sabuntawa: lissafin kuzarin abinci da manyan sinadarai kiyasi ne. Girman abinci, girki, mai, sukari da gishiri suna sauya sakamako.',
    limitations: 'Iyaka: ba tsarin abinci na likita ba ne, ba tsarin maganin ciwon sukari ba ne, kuma ba ya maye gurbin masanin abinci ko likita.'
  }
];

function escHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function section(page) {
  const ha = page.file.startsWith('ha/');
  const copy = ha ? {
    kicker: 'Fitarwa a cikin burauza',
    trustKicker: 'Tushe, sabuntawa da hanyar aiki',
    source: 'Tushe',
    sourceLead: 'An tsara shi bisa hanyar asalin AfroTools a',
    verify: 'Ka tabbatar da duk shawarar lafiya, gwaji, asibiti, inshora ko farashi daga kwararren maikacin lafiya.',
    freshness: 'Sabuntawa',
    methodology: 'Hanyar aiki',
    limitations: 'Iyaka'
  } : {
    kicker: 'Local-first export',
    trustKicker: 'Source / freshness / methodology',
    source: 'Source',
    sourceLead: 'Based on the AfroTools source workflow at',
    verify: 'Verify any health, lab, facility, insurance or price decision with a qualified provider.',
    freshness: 'Freshness',
    methodology: 'Methodology',
    limitations: 'Limitations'
  };
  return `
<section class="localized-health-export" data-localized-health-batch="export" data-health-lang="${ha ? 'ha' : 'yo'}" data-health-title="${escHtml(page.title)}" data-health-source="${escHtml(page.source)}" data-health-note="${escHtml(page.note)}">
  <div class="localized-health-export__copy">
    <span class="localized-health-kicker">${escHtml(copy.kicker)}</span>
    <h2>${escHtml(page.exportTitle)}</h2>
    <p>${escHtml(page.prompt)}. ${escHtml(page.privacy)}</p>
  </div>
  <div class="localized-health-actions">
    <button type="button" data-health-copy>${escHtml(page.copy)}</button>
    <button type="button" data-health-download>${escHtml(page.download)}</button>
    <span data-health-status aria-live="polite"></span>
  </div>
</section>
<section class="localized-health-trust" data-tool-verification-panel data-localized-health-batch="trust">
  <span class="localized-health-kicker">${escHtml(copy.trustKicker)}</span>
  <h2>${escHtml(page.trustTitle)}</h2>
  <div class="localized-health-trust-grid">
    <p><strong>${escHtml(copy.source)}:</strong> ${escHtml(copy.sourceLead)} <a href="${escHtml(page.source)}">${escHtml(page.source)}</a>. ${escHtml(copy.verify)}</p>
    <p><strong>${escHtml(copy.freshness)}:</strong> ${escHtml(page.freshness)}</p>
    <p><strong>${escHtml(copy.methodology)}:</strong> ${escHtml(page.methodology)}</p>
    <p><strong>${escHtml(copy.limitations)}:</strong> ${escHtml(page.limitations)}</p>
  </div>
</section>`;
}

function styleBlock() {
  return `
<style data-localized-health-batch="style">
.localized-health-export,.localized-health-trust{max-width:1080px;margin:22px auto;border:1px solid #dbeafe;border-radius:14px;background:#fff;padding:18px;box-shadow:0 10px 26px rgba(15,23,42,.05);color:#0f172a}
.localized-health-export{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;background:linear-gradient(135deg,#f8fafc 0%,#fff 62%,#ecfdf5 100%)}
.localized-health-export h2,.localized-health-trust h2{margin:0 0 8px;font-size:1.12rem;line-height:1.25}
.localized-health-export p,.localized-health-trust p{margin:0;color:#475569;line-height:1.6}
.localized-health-kicker{display:inline-block;margin-bottom:6px;color:#0f766e;font-size:.76rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
.localized-health-actions{display:flex;flex-wrap:wrap;gap:9px;align-items:center;justify-content:flex-end}
.localized-health-actions button{min-height:44px;border:0;border-radius:999px;padding:10px 14px;background:#0f172a;color:#fff;font:inherit;font-weight:900;cursor:pointer}
.localized-health-actions button:first-child{background:#0057b8}
.localized-health-actions span{font-size:.86rem;color:#475569}
.localized-health-trust-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:12px}
.localized-health-trust-grid p{border-left:4px solid #14b8a6;background:#f8fafc;border-radius:10px;padding:10px 12px}
.localized-health-trust a{color:#0057b8;font-weight:800}
@media(max-width:720px){.localized-health-export{grid-template-columns:1fr}.localized-health-actions{justify-content:stretch}.localized-health-actions button{width:100%}}
</style>`;
}

function scriptBlock() {
  return `
<script data-localized-health-batch="export-js">
(function(){
  function textOf(root, selector){
    var el = root.querySelector(selector);
    return el ? el.textContent.replace(/\\s+/g, ' ').trim() : '';
  }
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
    return Array.prototype.slice.call(document.querySelectorAll('.ha-results.on,.result.on,#results.on,#mp-results.on')).map(function(el){
      return el.textContent.replace(/\\s+/g, ' ').trim();
    }).filter(Boolean);
  }
  function brief(panel){
    var ha = panel.getAttribute('data-health-lang') === 'ha';
    var title = panel.getAttribute('data-health-title') || textOf(document, 'h1') || 'AfroTools health tool';
    var note = panel.getAttribute('data-health-note') || '';
    var source = panel.getAttribute('data-health-source') || location.pathname;
    var lines = ha
      ? ['AfroTools - ' + title, 'Hanya: ' + location.pathname, 'Hanyar tushe: ' + source, '']
      : ['AfroTools - ' + title, 'Route: ' + location.pathname, 'Source workflow: ' + source, ''];
    var fields = fieldLines();
    if(fields.length) lines.push(ha ? 'Bayanan da aka shigar' : 'Inputs', fields.join('\\n'), '');
    var results = resultLines();
    if(results.length) lines.push(ha ? 'Sakamakon yanzu' : 'Current result', results.join('\\n\\n'), '');
    lines.push(ha ? 'Zato da iyaka' : 'Assumptions and limits', note, ha
      ? 'Wannan kiyasin shiri ko takaitaccen bayani ne, ba shawarar hukuma ta likita, dakin gwaji, biyan kudi, inshora, doka ko gaggawa ba ce.'
      : 'This is a planning estimate or educational summary, not official medical, lab, billing, insurance, legal or emergency advice.');
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
  document.querySelectorAll('[data-localized-health-batch="export"]').forEach(function(panel){
    var status = panel.querySelector('[data-health-status]');
    var title = (panel.getAttribute('data-health-title') || 'health-brief').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'health-brief';
    var copy = panel.querySelector('[data-health-copy]');
    var download = panel.querySelector('[data-health-download]');
    if(copy) copy.addEventListener('click', function(){
      var text = brief(panel);
      function done(){ if(status) status.textContent = panel.getAttribute('data-health-lang') === 'ha' ? 'An kwafa takaitawar.' : 'Copied locally.'; }
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(done).catch(function(){ if(status) status.textContent = text; });
      } else if(status) {
        status.textContent = text;
      }
    });
    if(download) download.addEventListener('click', function(){
      downloadText('afrotools-' + title + '.txt', brief(panel));
      if(status) status.textContent = panel.getAttribute('data-health-lang') === 'ha' ? 'An sauke takaitawar.' : 'Downloaded locally.';
    });
  });
})();
</script>`;
}

let updated = 0;

for (const page of pages) {
  const fullPath = path.join(ROOT, page.file);
  let html = fs.readFileSync(fullPath, 'utf8');

  if (html.includes('data-localized-health-batch="export"')) {
    console.log(`Skip existing localized health batch: ${page.file}`);
    continue;
  }

  if (!html.includes('data-localized-health-batch="style"')) {
    html = html.replace('</head>', `${styleBlock()}\n</head>`);
  }

  const insert = section(page);
  if (html.includes('<afro-footer></afro-footer>')) {
    html = html.replace('<afro-footer></afro-footer>', `${insert}\n<afro-footer></afro-footer>`);
  } else if (html.includes('</main>')) {
    html = html.replace('</main>', `${insert}\n</main>`);
  } else {
    throw new Error(`No insertion anchor found in ${page.file}`);
  }

  html = html.replace('</body>', `${scriptBlock()}\n</body>`);
  fs.writeFileSync(fullPath, html);
  updated += 1;
}

const mealPlanPath = path.join(ROOT, 'ha/kayan-aiki/abincin-afirka/index.html');
let mealPlanHtml = fs.readFileSync(mealPlanPath, 'utf8');
let brokenPrintStart = mealPlanHtml.indexOf("function printShoppingList(){var content=document.getElementById('shop-list').innerText;var win=window.open('','_blank');win.document.write('<html><head><title>AfroTools Shopping List");
if (brokenPrintStart === -1) {
  brokenPrintStart = mealPlanHtml.indexOf("function printShoppingList(){var content=document.getElementById('shop-list').innerText;var win=window.open('','_blank');var safe=");
}
const haOverridesStart = brokenPrintStart === -1 ? -1 : mealPlanHtml.indexOf("GOAL_MACROS.balanced.note=", brokenPrintStart);
if (brokenPrintStart !== -1 && haOverridesStart !== -1) {
  const safePrint = "function printShoppingList(){var content=document.getElementById('shop-list').innerText;var win=window.open('','_blank');var safe=String(content||'').replace(/[&<>]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[ch];});win.document.write('<html><head><title>AfroTools Shopping List</title><style>body{font-family:sans-serif;padding:20px}h1{font-size:18px}pre{white-space:pre-wrap}</style></head><body><h1>AfroTools Weekly Shopping List</h1><pre>'+safe+'</pre></body></html>');win.print();}\n";
  mealPlanHtml = mealPlanHtml.slice(0, brokenPrintStart) + safePrint + mealPlanHtml.slice(haOverridesStart);
  if (!mealPlanHtml.includes('data-localized-health-batch="export-js"')) {
    const bodyClose = mealPlanHtml.lastIndexOf('</body>');
    if (bodyClose === -1) throw new Error('No closing body tag found in Hausa meal-plan page.');
    mealPlanHtml = mealPlanHtml.slice(0, bodyClose) + scriptBlock() + '\n' + mealPlanHtml.slice(bodyClose);
  }
  fs.writeFileSync(mealPlanPath, mealPlanHtml);
  console.log('Repaired Hausa meal-plan print helper script boundary.');
}

console.log(`Done. Updated ${updated} of ${pages.length} localized health pages.`);
