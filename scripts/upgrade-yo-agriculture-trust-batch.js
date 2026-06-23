const fs = require('fs');

const pages = [
  {
    file: 'yo/awon-ise/eso-irugbin/index.html',
    toolName: 'Afiyesi eso irugbin Naijiria',
    dataFiles: '/data/agriculture/crop-database.js, /data/agriculture/ng-agri-data.js',
    engine: '/engines/crop-yield-engine.js',
    method: 'eto naa n darapo irugbin, agbegbe, iwọn oko, iru ile, omi, ajile, iru irugbin ati akoko gbigbin lati fun ni afiyesi ikore ati owo tita.',
  },
  {
    file: 'yo/awon-ise/iwon-ajile/index.html',
    toolName: 'Iwon ajile Naijiria',
    dataFiles: '/data/agriculture/crop-database.js, /data/agriculture/ng-agri-data.js',
    engine: '/engines/fertilizer-engine.js',
    method: 'eto naa n darapo irugbin, agbegbe, iwọn oko, ibi-afede ikore, iru ile, irugbin tele ati idanwo ile ti olumulo ba ni lati fun ni N, P, K ati atoko rira.',
  },
  {
    file: 'yo/awon-ise/sise-rogo/index.html',
    toolName: 'Sise rogo Naijiria',
    dataFiles: '/data/agriculture/cassava-processing-data.js',
    engine: '/engines/cassava-processing-engine.js',
    method: 'eto naa n darapo ona sise rogo, tonnu rogo tuntun, iye ọja, owo ise, ipele ero, ijinna si oja ati iye iyipo lati fi owo wole, inawo ati ere han.',
  },
  {
    file: 'yo/awon-ise/isuna-ogbin/index.html',
    toolName: 'Isuna ogbin Naijiria',
    dataFiles: 'oju-iwe yii n lo awọn iye ti olumulo tẹ ati eto iṣiro agbegbe oju-iwe',
    engine: 'inline budget calculator',
    method: 'eto naa n ka owo irugbin, ajile, ise, ero oko, oko, ipamo, owo afikun ewu ati owo ti o le wole lati se isuna imurasile.',
  },
  {
    file: 'yo/awon-ise/agbon-oja/index.html',
    toolName: 'Agbon oja ounje',
    dataFiles: 'oju-iwe yii n lo awọn iye ọja ti olumulo tẹ ati eto iṣiro agbegbe oju-iwe',
    engine: 'inline basket calculator',
    method: 'eto naa n darapo iye ohun elo ninu agbon, owo kọọkan ati iye eniyan tabi ọsẹ lati fihan iye lapapọ fun igbaradi rira.',
  },
  {
    file: 'yo/awon-ise/owo-oja-ogbin/index.html',
    toolName: 'Iye oja ogbin',
    dataFiles: 'oju-iwe yii n lo awọn iye ọja ti olumulo tẹ ati eto iṣiro agbegbe oju-iwe',
    engine: 'inline market-price calculator',
    method: 'eto naa n darapo iye ọja, opoiye, inawo gbigbe tabi ọja ati asayan tita lati fihan owo wole ati iye ti o yẹ ki olumulo tun ṣayẹwo.',
  },
  {
    file: 'yo/awon-ise/ere-oko-eja/index.html',
    toolName: 'Ere oko eja Naijiria',
    dataFiles: 'oju-iwe yii n lo data oko eja ati awọn iye ti olumulo tẹ',
    engine: 'fish-farming profit calculator',
    method: 'eto naa n darapo iye eja, iwuwo tita, iye owo fun kilo, iwalaaye, owo ounje ati inawo miiran lati fihan owo wole, inawo ati ere.',
  },
  {
    file: 'yo/awon-ise/ounje-eranko/index.html',
    toolName: 'Ounje eranko Naijiria',
    dataFiles: 'oju-iwe yii n lo awọn iye ounje ati eranko ti olumulo tẹ',
    engine: 'livestock feed calculator',
    method: 'eto naa n darapo iru eranko, iye eranko, ipin ounje ati iye owo lati fi aini ounje ati isuna rira han.',
  },
];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, html) {
  fs.writeFileSync(file, html);
}

function insertBefore(html, marker, snippet) {
  if (!html.includes(marker)) throw new Error(`Missing marker ${marker}`);
  return html.replace(marker, `${snippet}\n${marker}`);
}

function trustSection(page) {
  return `<section class="card" data-tool-verification-panel data-yo-agriculture-batch="trust">
<h2>Orisun, ona isiro ati opin</h2>
<p><strong>Orisun ati alabapade:</strong> oju-iwe yii lo ${page.dataFiles}. A tun sayewo oju-iwe yii ni 22 June 2026. Owo ọja, ojo, irugbin, ajile, gbigbe, arun, kokoro ati wiwa olura le yipada.</p>
<p><strong>Ona isiro:</strong> ${page.method}</p>
<p><strong>Sayewo:</strong> fi abajade we iye ọja agbegbe, ADP tabi extension officer, ẹgbẹ agbẹ, olutaja, olura gidi ati iwe adehun ṣaaju ki o to ra ohun elo tabi gba gbese.</p>
<p><strong>Asiri ati opin:</strong> awọn iye ti o tẹ wa ninu browser yii. AfroTools ko fi data oko rẹ ranṣẹ si server. Eyi jẹ irinṣẹ eto ati afiyesi nikan; kii ṣe idiyele ọja osise, ijẹrisi ijọba, imọran inawo, tabi ileri ere.</p>
</section>`;
}

function exportSection(page) {
  return `<section class="card" data-yo-agriculture-batch="export">
<h2>Gbe abajade jade</h2>
<p class="muted">Da akopọ tabi gba faili TXT fun ijiroro pẹlu agbẹ, olutaja, ẹgbẹ oko tabi olura. Ohun gbogbo n ṣiṣẹ local-first ninu browser yii.</p>
<div class="yo-p1-buttons">
  <button type="button" data-yo-agri-copy>Da abajade kopi</button>
  <button type="button" data-yo-agri-download>Gba TXT</button>
  <span class="yo-p1-status" data-yo-agri-status aria-live="polite"></span>
</div>
</section>`;
}

function exportScript(page) {
  const fileName = page.file
    .replace(/^yo\/awon-ise\//, 'yo-agriculture-')
    .replace(/\/index\.html$/, '-akopo.txt')
    .replace(/\//g, '-');
  return `<script data-yo-agriculture-batch="export-js">
(function(){
  function text(sel){var el=document.querySelector(sel);return el?(el.innerText||el.textContent||'').trim():'';}
  function values(){
    return Array.prototype.slice.call(document.querySelectorAll('main input, main select, main textarea')).map(function(el){
      var label=document.querySelector('label[for="'+el.id+'"]');
      var name=(label?(label.innerText||label.textContent):el.name||el.id||'Field').trim();
      var value=el.tagName==='SELECT'&&el.selectedOptions[0]?el.selectedOptions[0].textContent:el.value;
      return '- '+name+': '+(value||'ko kun');
    }).slice(0,30);
  }
  function resultLines(){
    var lines=[];
    ['#resultsPanel','#budgetResult','#result','#fishResult','.result'].forEach(function(sel){
      var body=text(sel);
      if(body&&lines.indexOf(body)===-1) lines.push(body);
    });
    return lines.join('\\n\\n').slice(0,4000)||'Abajade ko tii han. Tẹ bọtini isiro ki o tun daakọ.';
  }
  function brief(){
    var lines=[${JSON.stringify(page.toolName)},'Ọjọ igbaradi: 22 June 2026','','Awọn iye ti a tẹ:'];
    lines=lines.concat(values());
    lines.push('','Abajade:',resultLines(),'','Orisun: ${page.dataFiles}; engine: ${page.engine}.','Opin: afiyesi eto nikan; kii ṣe idiyele ọja osise, ijẹrisi ijọba, imọran inawo tabi ileri ere.');
    return lines.join('\\n');
  }
  function status(msg){var el=document.querySelector('[data-yo-agri-status]');if(el)el.textContent=msg;}
  function fallbackCopy(value){var ta=document.createElement('textarea');ta.value=value;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');status('Akopo ti daako.');}catch(e){status('Daakọ kuna; lo TXT.');}document.body.removeChild(ta);}
  function copy(){var value=brief();if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(value).then(function(){status('Akopo ti daako.');},function(){fallbackCopy(value);});}else fallbackCopy(value);}
  function download(){var blob=new Blob([brief()],{type:'text/plain'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=${JSON.stringify(fileName)};document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href);},250);status('Faili TXT ti setan.');}
  document.addEventListener('DOMContentLoaded',function(){
    var c=document.querySelector('[data-yo-agri-copy]');
    var d=document.querySelector('[data-yo-agri-download]');
    if(c)c.addEventListener('click',copy);
    if(d)d.addEventListener('click',download);
  });
})();
</script>`;
}

function upgrade(page) {
  let html = read(page.file);
  const before = html;

  if (!html.includes('data-yo-agriculture-batch="export"')) {
    html = insertBefore(html, '<afro-footer></afro-footer>', `${exportSection(page)}\n${trustSection(page)}`);
  }

  if (!html.includes('data-yo-agriculture-batch="export-js"')) {
    html = insertBefore(html, '</body>', exportScript(page));
  }

  if (html !== before) {
    write(page.file, html);
    return true;
  }
  return false;
}

let updated = 0;
for (const page of pages) {
  if (upgrade(page)) updated += 1;
}

console.log(`Done. Updated ${updated} of ${pages.length} Yoruba agriculture pages.`);
