'use strict';
const crops = {maize:'Mahindi', rice:'Mpunga', sorghum:'Mtama', millet:'Uwele', cassava:'Muhogo', yam:'Viazi vikuu', sweet_potato:'Viazi vitamu', cowpea:'Kunde', groundnut:'Karanga', soybean:'Soya', common_bean:'Maharagwe', wheat:'Ngano', tomato:'Nyanya', onion:'Vitunguu', cotton:'Pamba', sunflower:'Alizeti', sesame:'Ufuta'};
const months = ['Januari','Februari','Machi','Aprili','Mei','Juni','Julai','Agosti','Septemba','Oktoba','Novemba','Desemba'];
function options(choices, selected) {
  return Object.entries(choices).map(([id,label]) => `<option value="${id}"${id===selected?' selected':''}>${label}</option>`).join('');
}
function fields(input) {
  const select = (key,label,choices) => `<label>${label}<select data-key="${key}">${options(choices,String(input[key]))}</select></label>`;
  const row = `<fieldset data-crop><legend>Zao <span data-number></span></legend><label>Aina ya zao<select data-kind>${options(crops,'maize')}</select></label><label>Eneo (hekta)<input type="number" data-area inputmode="decimal" min="0.000001" step="any" required value="1"></label><button type="button" data-remove>Ondoa zao hili</button></fieldset>`;
  return [
    select('countryCode','Nchi na sarafu',{KE:'Kenya (KES)'}),
    select('startMonth','Mwezi wa kwanza wa bajeti ya miezi sita',Object.fromEntries(months.map((m,i)=>[i+1,m]))),
    '<p data-reference role="status"></p><div data-crops>'+row+'</div><template data-row>'+row+'</template><button type="button" data-add>Ongeza zao</button>',
    select('landMode','Matumizi ya ardhi',{own:'Ardhi yangu',rent:'Ninakodisha',communal:'Ardhi ya jamii'}),
    '<label data-rent hidden>Kodi kwa hekta kwa msimu (hiari)<input data-key="rentOverride" type="number" inputmode="decimal" min="0.000001" step="any"></label>',
    select('laborMode','Wafanyakazi',{hired:'Wa kuajiriwa',family:'Familia',mixed:'Familia na wa kuajiriwa'}),
    select('mechanizationMode','Utayarishaji wa ardhi',{manual:'Kwa mikono',ox:'Kwa wanyama kazi',tractor:'Kwa trekta'}),
    select('financeMode','Ufadhili',{cash:'Fedha zangu',loan:'Mkopo'}),
    '<fieldset data-loan hidden><legend>Masharti ya mkopo</legend><p>Hesabu hutumia riba rahisi kwenye gharama kabla ya akiba ya dharura. Ukiacha sehemu wazi, hutumia kiwango cha mfano cha nchi na miezi sita.</p><label>Riba kwa mwaka (%, hiari)<input data-key="loanRate" type="number" inputmode="decimal" min="0.000001" step="any"></label><label>Muda wa mkopo (miezi, hiari)<input data-key="loanTerm" type="number" min="1" step="1"></label></fieldset>'
  ].join('\n');
}
module.exports = {fields};
