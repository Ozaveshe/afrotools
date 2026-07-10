const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const pages = [
  ['ha/jamb/cbt/index.html', 'JAMB CBT', '/jamb/cbt/', 'yanayin atisaye, lokaci, gajerun hanyoyin madannai da shirin dubawa'],
  ['ha/jamb/lissafi/index.html', 'JAMB Lissafi', '/jamb/mathematics/', 'batutuwan lissafi, wuraren rauni, atisayen lokaci da shirin bita'],
  ['ha/jamb/tutor/index.html', 'Mai taimakon JAMB', '/jamb/tutor/', 'tambayar karatu, darasi, batu mai rauni da bin diddigin malami'],
  ['ha/jamb/halittu/index.html', 'JAMB Halittu', '/jamb/biology/', 'batutuwan halittu, tsoffin tambayoyi da shirin bita'],
  ['ha/jamb/tattalin-arziki/index.html', 'JAMB Tattalin Arziki', '/jamb/economics/', "batutuwan tattalin arziki, ma\'anoni, zane-zane da atisayen lokaci"],
  ['ha/jamb/gwamnati/index.html', 'JAMB Gwamnati', '/jamb/government/', 'batutuwan gwamnati, ilimin dan kasa da atisayen tsoffin tambayoyi'],
  ['ha/jamb/kasuwanci/index.html', 'JAMB Kasuwanci', '/jamb/commerce/', 'batutuwan kasuwanci, kalmomin kasuwanci da atisayen lokaci'],
  ['ha/jamb/adabi/index.html', 'JAMB Adabi', '/jamb/literature/', 'rubutun adabi, jigogi, salon rubutu da shirin bita'],
  ['ha/jamb/tarihi/index.html', 'JAMB Tarihi', '/jamb/history/', 'batutuwan tarihi, ranaku, dalilai da shirin bita'],
  ['ha/jamb/crk/index.html', 'JAMB CRK', '/jamb/crk/', 'batutuwan CRK, sassan littafi, jigogi da shirin bita']
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
    <span class="ha-jamb-kicker">Fitar da takaitaccen shirin karatu</span>
    <h2>Ajiye shirin karatu</h2>
    <p>Rubuta ko sabunta ${escHtml(page.prompt)}. Takaitawar tana zama a burauzarka kuma za ka iya kwafa ko sauke ta a matsayin TXT.</p>
  </div>
  <div class="ha-jamb-actions">
    <button type="button" data-jamb-copy>Kwafi shirin</button>
    <button type="button" data-jamb-download>Sauke .txt</button>
    <span data-jamb-status aria-live="polite"></span>
  </div>
</section>
<section class="ha-jamb-trust" data-tool-verification-panel data-ha-jamb-batch="trust">
  <span class="ha-jamb-kicker">Tushe, sabuntawa da hanyar aiki</span>
  <h2>Tushe, sabuntawa da iyaka</h2>
  <div class="ha-jamb-trust-grid">
    <p><strong>Tushe:</strong> Wannan jagorar Hausa tana kai ka zuwa hanyar AfroJAMB a <a href="${escHtml(page.source)}">${escHtml(page.source)}</a>. Ba portal din JAMB na hukuma ba ne.</p>
    <p><strong>Tabbacin hukuma:</strong> Ka tabbatar da ranar jarrabawa, manhaja, hadin darussa, kaidar rajista, iyakar admission da umarnin cibiya daga JAMB, makaranta ko mai ba da shawara da aka amince da shi.</p>
    <p><strong>Hanyar aiki:</strong> Shafin yana tattara darasin dalibi, burinsa da wuraren rauni, sannan ya kai shi hanyar atisayen AfroJAMB ko jagorar da ta dace.</p>
    <p><strong>Iyaka:</strong> Wannan taimakon bita ne kawai. Ba makin hukuma ba ne, ba alkawarin admission ba ne, ba kayan magudin jarrabawa ba ne, kuma ba ya maye gurbin malami.</p>
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
    var title = panel.getAttribute('data-jamb-title') || 'Shirin karatun JAMB';
    var source = panel.getAttribute('data-jamb-source') || location.pathname;
    var prompt = panel.getAttribute('data-jamb-prompt') || 'shirin karatu';
    var lines = ['AfroTools Hausa - ' + title, 'Hanya: ' + location.pathname, 'Hanyar atisaye: ' + source, 'Abin da za a maida hankali a kai: ' + prompt, ''];
    var fields = fieldLines();
    if(fields.length) lines.push('Bayanan dalibi', fields.join('\\n'), '');
    lines.push('Tabbatarwa', 'Ka tabbatar da ranakun hukuma, manhaja, kaidar rajista, hadin darussa da bukatun admission daga JAMB ko makaranta.');
    lines.push('', 'Sirri: an gina wannan a cikin burauzarka.');
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
