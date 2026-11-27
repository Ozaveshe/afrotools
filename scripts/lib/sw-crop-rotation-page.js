'use strict';
module.exports = function rotationPage(html) {
  const upload = '<label class="swa-file">Fungua mpango wa JSON<input type="file" accept="application/json,.json" data-import></label>';
  return html
    .replace(/<p>Sehemu hapa chini ni rekodi wazi[^<]*<\/p>/, '<p>Chagua zao lililopita na mazao yanayopatikana shambani. Linganisha mpango kwa kubadili lengo au hali ya udongo.</p>')
    .replace(/<label for="scenario">[^<]*<\/label><textarea[^>]*>[\s\S]*?<\/textarea>/, `<label for="rotation-country">Nchi</label><select id="rotation-country"></select>
<label for="rotation-previous">Zao lililopandwa msimu uliopita</label><select id="rotation-previous"></select>
<label for="rotation-seasons">Idadi ya misimu ya kupanga</label><input id="rotation-seasons" type="number" min="1" step="1" required>
<label for="rotation-goal">Lengo la mzunguko</label><select id="rotation-goal"><option value="maximize_yield">Kuongeza mavuno</option><option value="restore_soil">Kuboresha udongo</option><option value="minimize_pests">Kupunguza wadudu na magonjwa</option><option value="maximize_profit">Kuongeza faida</option></select>
<label for="rotation-soil">Hali ya udongo kabla ya kuanza</label><select id="rotation-soil"><option value="depleted">Uliochoka</option><option value="average">Wastani</option><option value="good">Nzuri</option><option value="excellent">Nzuri sana</option></select>
<fieldset><legend>Mazao yanayopatikana</legend><p>Chagua yanayoweza kupandwa. Usipochagua zao, modeli itatumia mazao yote katika orodha.</p><details><summary>Badili orodha ya mazao</summary><p><button type="button" id="rotation-country-crops">Chagua mazao ya nchi hii</button></p><div id="rotation-pool"></div></details><p id="rotation-selected" aria-live="polite"></p></fieldset>`)
    .replace(/<label class="swa-file">Fungua JSON<input[^>]+data-import><\/label>/, '')
    .replace('</form>', '</form>' + upload)
    .replace('<h2>Matokeo ya injini</h2><pre data-output></pre>', '<h2>Mpango wa misimu</h2><p id="rotation-summary"></p><ol id="rotation-sequence"></ol><p id="rotation-limit">Haya ni makadirio ya modeli. Angalia hali ya shamba, mbegu na ushauri wa mtaalamu kabla ya kupanda.</p><details><summary>Data kamili ya modeli (JSON)</summary><pre data-output></pre></details>')
    .replace(/<script src="\/assets\/js\/pages\/sw-agriculture-assigned-parity\.js[^"]*"><\/script>/, '<script src="/data/agriculture/country-index.js"></script><script src="/assets/js/pages/sw-crop-rotation.js"></script>')
    .replace('</head>', '<style>#rotation-pool{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,10rem),1fr));gap:.35rem}#rotation-pool label{display:flex;align-items:center;gap:.4rem}#rotation-pool input{width:auto}#rotation-sequence li{margin-bottom:1rem}fieldset{min-width:0}#rotation-pool label{overflow-wrap:anywhere}</style></head>');
};
