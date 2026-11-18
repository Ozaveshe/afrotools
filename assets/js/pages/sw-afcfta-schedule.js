(function () {
  'use strict';
  const eTariff = 'https://etariff.au-afcfta.org/mapsearch';
  const unctad = 'https://afcfta.unctad.org/tariffs';
  const regionNames = new Intl.DisplayNames(['sw'], { type: 'region' });
  const hsPattern = /^(?:\d{4}(?:\d{2}){0,4}|\d{4}(?:\.\d{2}){1,4})$/;
  function validate(input, data) {
    if (!input || !Object.hasOwn(data.memberStates,input.origin) || !Object.hasOwn(data.memberStates,input.destination) || input.origin === input.destination)
      throw Error('Chagua nchi mbili tofauti zilizo kwenye orodha.');
    if (!hsPattern.test(String(input.hsCode ?? '').trim())) throw Error('Ingiza msimbo wa HS wa tarakimu 4, 6, 8, 10 au 12. Nukta zinaweza kutenganisha mafungu baada ya tarakimu nne za kwanza.');
    if (!/^\d{4}$/.test(String(input.year))) throw Error('Ingiza mwaka wenye tarakimu nne.');
  }
  function findHeading(code, database) {
    const chapter = database.chapters.find(item => item.chapter === code.slice(0,2));
    const heading = chapter?.headings.find(item => item.code === code.slice(0,4));
    if (!heading) return null;
    const sub = heading.subheadings.find(item => item.code.replace(/\./g,'') === code.slice(0,6));
    return {code:sub?.code || heading.code, description:sub?.description || heading.description};
  }
  function sensitivity(code, state) {
    for (const text of state.sensitiveProducts || []) {
      const match = /\(HS (\d{2}(?:\d{2})?)(?:-(\d{2}(?:\d{2})?))?\)/.exec(text);
      if (!match) continue;
      const prefix = code.slice(0,match[1].length);
      if (prefix >= match[1] && prefix <= (match[2] || match[1])) return text;
    }
    return null;
  }
  function snapshot(code, state) {
    return {code,name:state.name,ratified:state.ratified,scheduleFiled:state.scheduleFiled,tradingStatus:state.tradingStatus};
  }
  function calculate(input, data, database) {
    validate(input,data);
    const origin = data.memberStates[input.origin], destination = data.memberStates[input.destination];
    const code = String(input.hsCode).trim().replace(/\./g,'');
    return {
      origin:snapshot(input.origin,origin), destination:snapshot(input.destination,destination),
      hsCode:code, year:Number(input.year), categoryAReductionPercent:destination.reductionSchedule?.catA?.[input.year] ?? null,
      scheduleCountry:input.destination, productDutyPercent:null,
      classificationReference:findHeading(code,database), sensitiveProductHint:sensitivity(code,destination),
      bothActiveGti:origin.tradingStatus==='active_GTI' && destination.tradingStatus==='active_GTI', datasetOverview:data.overview,
      sourceWarning:'Ratiba ya jumla ya kundi A la nchi inayoagiza. Hakuna kiwango cha ushuru cha bidhaa kilichothibitishwa hapa.',
      officialTariffBook:eTariff, tariffOffersAndRules:unctad
    };
  }
  function formMarkup(data) {
    const options = selected => Object.keys(data.memberStates).sort((a,b)=>regionNames.of(a).localeCompare(regionNames.of(b),'sw')).map(code=>
      '<option value="'+code+'"'+(selected===code?' selected':'')+'>'+regionNames.of(code)+'</option>').join('');
    return '<p>Linganisha ratiba ya jumla ya nchi inayoagiza na marejeo ya msimbo wa bidhaa. Thibitisha mstari wa ushuru na kanuni ya asili katika <a href="'+eTariff+'">kitabu rasmi cha ushuru cha AfCFTA</a> au <a href="'+unctad+'">orodha ya viwango na kanuni za asili ya UNCTAD</a>. Katika UNCTAD, chagua nchi inayoagiza kama “Reporter”, nchi ya asili kama “Partner”, kisha tafuta msimbo wa HS.</p>'+
      '<form data-trade-form data-afcfta-form><label>Nchi ya asili<select name="origin">'+options('KE')+'</select></label>'+
      '<label>Nchi inayoagiza<select name="destination">'+options('GH')+'</select></label>'+
      '<label>Msimbo wa bidhaa (HS)<input name="hsCode" type="text" inputmode="text" value="0901" required aria-describedby="hs-help"></label><p id="hs-help">Hifadhi sifuri za mwanzo. Mfano: 0901 au 0901.11.</p>'+
      '<label>Mwaka wa ratiba<input name="year" type="number" min="1000" max="9999" step="1" value="2026" required></label>';
  }
  function rows(r) {
    const market = regionNames.of(r.destination.code);
    const output = [
      ['Njia ya biashara',regionNames.of(r.origin.code)+' → '+market],['Msimbo ulioingiza',r.hsCode],
      ['Kiwango cha ushuru cha bidhaa','Hakijathibitishwa. Angalia mstari wa ushuru wa '+market+' na kanuni za asili.'],
      ['Punguzo la jumla la kundi A · '+market+' · '+r.year,r.categoryAReductionPercent===null?'Hakuna thamani ya mwaka huu katika data ya ndani.':r.categoryAReductionPercent+'% ya kupunguza ushuru wa msingi katika ratiba ya jumla. Kundi la bidhaa hii halijathibitishwa.']
    ];
    if (r.classificationReference) {
      const heading = r.classificationReference;
      const name = {'0901':'Kahawa','8502':'Seti za kuzalisha umeme'}[heading.code] || heading.description;
      output.push(['Rejea ya uainishaji iliyopatikana','HS '+heading.code+' · '+name]);
    } else output.push(['Rejea ya uainishaji','Hakuna kichwa kinacholingana katika orodha hii ndogo.']);
    if (r.sensitiveProductHint) output.push(['Bidhaa nyeti kulingana na orodha ya ndani',r.sensitiveProductHint+' · Thibitisha kundi la mstari husika na forodha.']);
    output.push(['Kitabu rasmi cha ushuru cha AfCFTA',r.officialTariffBook],['Viwango na kanuni za asili (UNCTAD)',r.tariffOffersAndRules]);
    return output;
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports={calculate,formMarkup,rows}; return; }
  const form = document.querySelector('[data-afcfta-form]');
  const readInput=()=>({origin:form.elements.origin.value,destination:form.elements.destination.value,hsCode:form.elements.hsCode.value.trim(),year:Number(form.elements.year.value)});
  function setInput(input) {
    for (const key of ['origin','destination','hsCode','year']) form.elements[key].value=input[key];
  }
  window.swAfcftaSchedule = input => calculate(input,AFCFTA_DATA,HS_DATABASE);
  window.swTradeForm={readInput,setInput,validate:input=>validate(input,AFCFTA_DATA),rows};
}());
