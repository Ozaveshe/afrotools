const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const pages = [
  {
    file: 'fr/tools/suivi-hawala/index.html',
    lang: 'fr',
    title: 'Suivi transferts Hawala',
    type: 'finance',
    source: 'Cadre de planification AfroTools, comparaison avec canaux formels, frais declares par l utilisateur et verification locale.',
    limitations: 'Ne remplace pas une institution financiere, un avis juridique, une verification AML/KYC ou une preuve de transfert.'
  },
  {
    file: 'fr/tools/afroatlas/index.html',
    lang: 'fr',
    title: 'AfroAtlas',
    type: 'reference',
    source: 'Jeux de donnees publics et couches internes AfroTools disponibles dans l outil source.',
    limitations: 'Les cartes et classements servent a explorer. Verifiez la date, la methode et la source avant de citer ou publier.'
  },
  {
    file: 'fr/tools/guide-diaspora/index.html',
    lang: 'fr',
    title: 'Guide de la diaspora',
    type: 'diaspora',
    source: 'Guides AfroTools, liens officiels, donnees de planification et informations a confirmer par pays.',
    limitations: 'Ne remplace pas un conseiller fiscal, juridique, consulaire, immobilier ou financier.'
  },
  {
    file: 'fr/tools/calendrier-semis/index.html',
    lang: 'fr',
    title: 'Calendrier de semis',
    type: 'agriculture',
    source: 'Calendrier agricole AfroTools, zones agro-climatiques, cultures courantes et hypotheses saisonnieres.',
    limitations: 'Controlez la pluie locale, la variete, le sol, les ravageurs et les conseils d extension agricole avant de semer.'
  },
  {
    file: 'fr/tools/compteur-calories/index.html',
    lang: 'fr',
    title: 'Compteur de calories africain',
    type: 'health',
    source: 'Base nutritionnelle AfroTools et valeurs indicatives de portions/recettes.',
    limitations: 'Repere nutritionnel uniquement. Ne remplace pas un professionnel de sante, surtout grossesse, diabete, maladie renale ou trouble alimentaire.'
  },
  {
    file: 'yo/ilera/index.html',
    lang: 'yo',
    title: 'Ilera Yoruba',
    type: 'health',
    source: 'AfroTools health hub, linked Yoruba health tools and safety notes.',
    limitations: 'Alaye nikan ni. Ko ropo dokita, onimo oogun, yara idanwo tabi itoju pajawiri.'
  },
  {
    file: 'sw/zana/tafsiri-ripoti-daktari/index.html',
    lang: 'sw',
    title: 'Tafsiri ya Ripoti ya Daktari',
    type: 'health-sensitive',
    source: 'Injini ya ripoti ya matibabu ya AfroTools, marejeo ya vipimo vya kawaida na maandishi ya mtumiaji yanayochakatwa ndani ya browser.',
    limitations: 'Kwa elimu tu. Si utambuzi, si ushauri wa matibabu, na haipaswi kuongoza maamuzi ya dharura au dawa.'
  },
  {
    file: 'sw/zana/gharama-za-visa/index.html',
    lang: 'sw',
    title: 'Gharama za Visa Afrika',
    type: 'travel',
    source: 'Makadirio ya AfroTools, bloc za kikanda na taarifa za kupanga ambazo lazima zithibitishwe kwenye portal rasmi.',
    limitations: 'Si huduma rasmi ya serikali, si uamuzi wa visa, si quote ya mwisho, na haihakikishi approval.'
  },
  {
    file: 'fr/tools/calculateur-age/index.html',
    lang: 'fr',
    title: 'Calculateur d age exact',
    type: 'date',
    source: 'Calcul local de dates dans le navigateur avec date de naissance et date de reference saisies par l utilisateur.',
    limitations: 'Pour les dossiers officiels, controlez les dates sur les pieces d identite et documents administratifs.'
  },
  {
    file: 'fr/tools/qualite-eau/index.html',
    lang: 'fr',
    title: 'Qualite de l eau',
    type: 'health-safety',
    source: 'Repere AfroTools pour pH, turbidite, chlore et contaminants; a confirmer par test ou autorite locale.',
    limitations: 'Ne certifie pas que l eau est potable. Confirmez avec laboratoire, service d eau, autorite locale ou professionnel qualifie.'
  }
];

const text = {
  fr: {
    kicker: 'Sortie utile',
    heading: 'Copier ou telecharger le brief',
    intro: 'Utilisez ce panneau apres avoir prepare ou consulte l outil. Le texte exporte reste simple a partager avec un conseiller, un proche ou une equipe.',
    copy: 'Copier le brief',
    download: 'Telecharger TXT',
    ready: 'Pret a exporter.',
    copied: 'Brief copie.',
    downloaded: 'Brief telecharge.',
    privacy: 'Saisie locale: ce panneau genere le brief dans votre navigateur. Ne collez pas de donnees sensibles si vous n en avez pas besoin.',
    trust: 'Sources, fraicheur et limites',
    freshness: 'Controle 2026: les frais, regles, donnees, saisons et sources peuvent changer. Verifiez avant decision.',
    method: 'Methode: combinez le contexte saisi, le resultat de l outil et les notes de verification. Ce n est pas une preuve officielle.',
    fallback: 'Ajoutez un contexte ou utilisez l outil avant de partager le brief.'
  },
  sw: {
    kicker: 'Matokeo ya kutumia',
    heading: 'Nakili au pakua muhtasari',
    intro: 'Tumia paneli hii baada ya kukagua zana. Muhtasari ni rahisi kushiriki na mtaalamu, ndugu au timu.',
    copy: 'Nakili muhtasari',
    download: 'Pakua TXT',
    ready: 'Tayari kusafirisha.',
    copied: 'Muhtasari umenakiliwa.',
    downloaded: 'Muhtasari umepakuliwa.',
    privacy: 'Faragha ya ndani: muhtasari hutengenezwa kwenye browser yako. Usibandike taarifa nyeti isipokuwa ni lazima.',
    trust: 'Vyanzo, muda na mipaka',
    freshness: 'Ukaguzi wa 2026: ada, sheria, data na portals hubadilika. Thibitisha kabla ya uamuzi.',
    method: 'Mbinu: unganisha taarifa ulizoingiza, matokeo ya zana na maelezo ya uthibitisho. Si uthibitisho rasmi.',
    fallback: 'Ongeza muktadha au tumia zana kabla ya kushiriki muhtasari.'
  },
  yo: {
    kicker: 'Abajade to wulo',
    heading: 'Da tabi gba akopo',
    intro: 'Lo paneli yii leyin lilo oju yii. Akopo naa rorun lati pin pelu dokita, ebi tabi egbe.',
    copy: 'Da akopo kopi',
    download: 'Gba TXT',
    ready: 'Setan fun gbigba.',
    copied: 'Akopo ti daako.',
    downloaded: 'Akopo ti gba.',
    privacy: 'Asiri agbegbe: paneli yii n se akopo ninu browser re. Ma fi alaye ikoko kun ti ko ba ye.',
    trust: 'Orisun, akoko ati opin',
    freshness: 'Ayewo 2026: ofin, owo, data ati orisun le yipada. Sayewo saaju ipinnu.',
    method: 'Ona: darapo alaye ti o fi kun, abajade irinse ati awon ikilo. Ko je eri osise.',
    fallback: 'Fi alaye kun tabi lo oju yii ki o to pin akopo.'
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
  return `<style data-mixed-localized-p3-batch="style">
.mixed-p3-panel{max-width:980px;margin:1.5rem auto;padding:0 1rem}
.mixed-p3-card{background:#fff;border:1px solid #dbeafe;border-radius:14px;box-shadow:0 10px 28px rgba(15,23,42,.07);padding:1.1rem;margin-bottom:1rem}
.mixed-p3-kicker{display:block;font-size:.74rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#1d4ed8;margin-bottom:.35rem}
.mixed-p3-card h2{font-size:1.12rem;line-height:1.25;margin:0 0 .45rem;color:#0f172a}
.mixed-p3-card p{margin:.35rem 0;color:#475569;line-height:1.6}
.mixed-p3-actions{display:flex;flex-wrap:wrap;gap:.65rem;align-items:center;margin-top:.85rem}
.mixed-p3-actions button{border:0;border-radius:999px;background:#0f172a;color:#fff;font:inherit;font-weight:850;padding:.72rem 1rem;cursor:pointer}
.mixed-p3-actions button:first-child{background:#0057b8}
.mixed-p3-actions button:focus-visible{outline:3px solid #93c5fd;outline-offset:2px}
.mixed-p3-status{font-size:.86rem;color:#64748b;min-height:1.2em}
.mixed-p3-local{border-left:4px solid #16a34a;background:#f0fdf4;border-radius:10px;padding:.8rem;margin-top:.85rem;color:#365346}
.mixed-p3-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:.75rem;margin-top:.85rem}
.mixed-p3-item{border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;padding:.85rem}
.mixed-p3-item strong{display:block;color:#0f172a;margin-bottom:.3rem}
@media(max-width:640px){.mixed-p3-actions button{width:100%}.mixed-p3-card{padding:1rem}}
</style>`;
}

function panel(page) {
  const t = text[page.lang];
  return `<section class="mixed-p3-panel" data-mixed-localized-p3-batch="panel" data-mixed-p3-type="${esc(page.type)}">
  <div class="mixed-p3-card">
    <span class="mixed-p3-kicker">${esc(t.kicker)}</span>
    <h2>${esc(t.heading)}</h2>
    <p>${esc(t.intro)}</p>
    <div class="mixed-p3-actions">
      <button type="button" data-mixed-p3-copy>${esc(t.copy)}</button>
      <button type="button" data-mixed-p3-download>${esc(t.download)}</button>
      <span class="mixed-p3-status" data-mixed-p3-status aria-live="polite">${esc(t.ready)}</span>
    </div>
    <p class="mixed-p3-local"><strong>Local-first:</strong> ${esc(t.privacy)}</p>
  </div>
  <div class="mixed-p3-card" data-tool-verification-panel>
    <span class="mixed-p3-kicker">${esc(t.trust)}</span>
    <div class="mixed-p3-grid">
      <p class="mixed-p3-item"><strong>Source</strong>${esc(page.source)}</p>
      <p class="mixed-p3-item"><strong>Freshness</strong>${esc(t.freshness)}</p>
      <p class="mixed-p3-item"><strong>Methodology</strong>${esc(t.method)}</p>
      <p class="mixed-p3-item"><strong>Limitations</strong>${esc(page.limitations)}</p>
    </div>
  </div>
</section>`;
}

function scriptBlock(page) {
  const t = text[page.lang];
  return `<script data-mixed-localized-p3-batch="script">
(function(){
  'use strict';
  var labels = ${JSON.stringify({
    title: page.title,
    fallback: t.fallback,
    copied: t.copied,
    downloaded: t.downloaded
  })};
  function clean(value){ return (value || '').replace(/\\s+/g, ' ').trim(); }
  function fieldLines(){
    return Array.prototype.slice.call(document.querySelectorAll('label')).map(function(label){
      var id = label.getAttribute('for');
      var field = id ? document.getElementById(id) : label.querySelector('input,select,textarea');
      if (!field) return '';
      var value = field.options ? field.options[field.selectedIndex].text : field.value;
      value = clean(value);
      if (!value) return '';
      return clean(label.textContent) + ': ' + value;
    }).filter(Boolean).slice(0, 12);
  }
  function visibleResult(){
    var selectors = ['#result', '.result.on', '.mr-results.on', '[aria-live="polite"]', 'output'];
    var out = [];
    selectors.forEach(function(selector){
      document.querySelectorAll(selector).forEach(function(node){
        var value = clean(node.innerText || node.textContent);
        if (value && out.indexOf(value) === -1) out.push(value);
      });
    });
    return out.join('\\n').slice(0, 2400);
  }
  function summary(){
    var lines = ['AfroTools - ' + labels.title, 'Generated locally in this browser.', ''];
    var fields = fieldLines();
    if (fields.length) lines.push('Inputs:\\n' + fields.join('\\n'));
    var result = visibleResult();
    lines.push('', 'Result / brief:', result || labels.fallback);
    lines.push('', 'Verification: confirm sources, dates, fees, health/safety details or official requirements before acting.');
    return lines.join('\\n');
  }
  function setStatus(value){
    var status = document.querySelector('[data-mixed-p3-status]');
    if (status) status.textContent = value;
  }
  function saveFile(value){
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
    var copy = event.target.closest('[data-mixed-p3-copy]');
    var download = event.target.closest('[data-mixed-p3-download]');
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
      saveFile(value);
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

  if (!html.includes('data-mixed-localized-p3-batch="style"')) {
    html = insertBeforeLast(html, '</head>', styleBlock() + '\n', page.file);
  }
  if (!html.includes('data-mixed-localized-p3-batch="panel"')) {
    html = insertBeforeLast(html, '<afro-footer', panel(page) + '\n', page.file);
  }
  if (!html.includes('data-mixed-localized-p3-batch="script"')) {
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

console.log(`Mixed localized P3 trust batch complete: ${changed} file(s) changed.`);
