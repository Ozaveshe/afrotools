'use strict';

module.exports = function labelPage(html) {
  const input = (key, label, optional = false) => `<label for="${key}">${label}</label><input id="${key}" name="${key}" type="number" min="0" step="any"${optional ? '' : ' required'}>`;
  const sources = `<section aria-labelledby="label-guide"><h2 id="label-guide">Soma lebo kabla ya kuhesabu</h2><p>Linganisha jina na namba ya usajili, zao, kisumbufu na matumizi yaliyoidhinishwa kwa nchi yako. Nakili kiwango cha bidhaa na kipimo chake kutoka kwenye lebo. Asilimia ya kiambato hai si kiwango cha matumizi.</p>
<p>Kwa Kenya, tafuta bidhaa na ufungue safu ya lebo katika <a href="https://www.pcpb.go.ke/crops/">rejista ya PCPB</a>. Kwa Tanzania, angalia <a href="https://psms.tphpa.go.tz/">mfumo wa TPHPA</a>. Kwa nchi nyingine, tumia <a href="https://www.fao.org/pesticide-registration-toolkit/information-sources/approved-labels/en">mwongozo wa FAO wa kupata lebo zilizoidhinishwa</a>.</p>
<p>Fuata lebo kuhusu vifaa vya kujikinga, muda wa kusubiri kuingia shambani tena na muda wa kusubiri kabla ya kuvuna. Ikiwa lebo haijasomeka au vipimo havilingani, simama na muulize afisa ugani au mamlaka husika. <a href="https://www.fao.org/4/i7721en/I7721EN.pdf">Mwongozo wa FAO kuhusu kujikinga</a>.</p></section>`;
  const fields = `<label for="label-kind">Aina ya matumizi kwenye lebo</label><select name="kind" id="label-kind"><option value="spray">Kwa eneo la shamba</option><option value="seed-treatment">Kwa uzito wa mbegu</option></select>
${input('rate','Kiwango kilichoandikwa kwenye lebo')}
<label for="label-unit">Kipimo cha kiwango hicho</label><select id="label-unit" name="unitLabel" required></select>
<fieldset id="label-field"><legend>Eneo na vifaa</legend>${input('areaHa','Eneo la shamba (ha)')}${input('waterPerHa','Kiasi cha maji kilichothibitishwa (L/ha, hiari)',true)}
<label for="sprayerKey">Aina ya kifaa (hiari)</label><select id="sprayerKey" name="sprayerKey"><option value="">Chagua</option><option value="knapsack">Pampu ya mgongoni</option><option value="motorized">Pampu yenye mota</option><option value="boom">Kinyunyizio cha mikono mirefu</option></select>
${input('tankSize','Ujazo halisi wa tanki lako (L, hiari)',true)}</fieldset>
<fieldset id="label-seed" hidden disabled><legend>Mbegu</legend>${input('seedKg','Uzito wa mbegu (kg)')}</fieldset>
<details><summary>Gharama na muda uliotajwa kwenye lebo (hiari)</summary>
<label for="pricePerUnit" id="price-label">Bei kwa kipimo cha bidhaa</label><input id="pricePerUnit" name="pricePerUnit" type="number" min="0" step="any"><label for="currency">Sarafu ya bei</label><input id="currency" name="currency" maxlength="3" pattern="[A-Za-z]{3}" placeholder="KES">
${input('reentryHours','Muda wa kusubiri kabla ya kuingia tena (saa)',true)}${input('preHarvestDays','Muda wa kusubiri kabla ya kuvuna (siku)',true)}</details>`;
  return html.replace(/<p>Sehemu hapa chini ni rekodi wazi[^<]*<\/p>/,sources)
    .replace(/<label for="scenario">[^<]*<\/label><textarea[^>]*>[\s\S]*?<\/textarea>/,fields)
    .replace(/<label class="swa-file">Fungua JSON<input[^>]+data-import><\/label>/,'')
    .replace('</form>','</form><label class="swa-file">Fungua ripoti ya JSON<input type="file" accept="application/json,.json" data-import></label>')
    .replace('<h2>Matokeo ya injini</h2><pre data-output></pre>','<h2>Hesabu kutoka kwenye lebo</h2><dl id="label-results"></dl><details><summary>Data ya hesabu (JSON)</summary><pre data-output></pre></details>')
    .replace(/<script src="\/assets\/js\/pages\/sw-agriculture-assigned-parity\.js[^"]*"><\/script>/,'<script src="/assets/js/pages/sw-pesticide-label.js"></script>')
    .replace('</head>','<style>#label-results dt{font-weight:650}#label-results dd{margin:0 0 .6rem}fieldset{min-width:0}input,select{max-width:100%}#label-guide{margin-top:1rem}</style></head>');
};
