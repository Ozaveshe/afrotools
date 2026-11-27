(() => {
  'use strict';
  const form=document.getElementById('tractor-form'), data=window.EQUIPMENT_DATA;
  const engine=window.AfroTools && window.AfroTools.TractorCalculatorEngine;
  if(!form || !data || !engine)return;
  const f=form.elements, el=id=>document.getElementById(id);
  const rateKeys=['tractor_ploughing_per_ha','tractor_harrowing_per_ha','tractor_ridging_per_ha'];
  const rates=['plough','harrow','ridge'];
  const perHa=10000/4046.8564224;
  const machineNames={tractor_medium:'Trekta ya ukubwa wa kati',tractor_small:'Trekta ndogo',tractor_large:'Trekta kubwa',power_tiller:'Trekta ya magurudumu mawili'};
  for(const [k,v] of Object.entries(data.countries))f.countryCode.add(new Option(v.name+' ('+v.currency+')',k,k==='KE',k==='KE'));
  for(const [k,v] of Object.entries(data.equipment))f.equipmentKey.add(new Option(machineNames[k]||v.name||k,k,k==='tractor_medium',k==='tractor_medium'));
  let saved,previousUnit='ha',countyReference=false;
  const format=new Intl.NumberFormat('sw',{maximumFractionDigits:2});
  function clear(){saved=null;el('tractor-results').hidden=true;el('tractor-status').textContent='';}
  function updateFields(){
    f.harrow.disabled=Number(f.passes.value)<2;f.ridge.disabled=Number(f.passes.value)<3;
    el('finance-fields').hidden=f.financeType.value==='cash';
    el('contract-fields').hidden=!f.doContract.checked;
    el('county-example').hidden=f.countryCode.value!=='KE';
  }
  function defaults(){
    countyReference=false;
    const record=data.hireRates[f.countryCode.value]||{};
    rates.forEach((name,i)=>{f[name].value=record[rateKeys[i]]??'';});
    f.diesel.value=record.diesel_per_litre??'';f.rateUnit.value=previousUnit='ha';
    const model=engine.defaults(f.countryCode.value,f.equipmentKey.value,data);if(model.ok)f.price.value=model.price;
    updateFields();clear();
  }
  function unitChange(unit){
    if(unit===previousUnit)return;
    for(const name of rates)if(f[name].value!=='')f[name].value=Number((Number(f[name].value)*(unit==='acre'?1/perHa:perHa)).toPrecision(14));
    previousUnit=unit;
  }
  f.countryCode.addEventListener('change',defaults);
  f.equipmentKey.addEventListener('change',()=>{const model=engine.defaults(f.countryCode.value,f.equipmentKey.value,data);if(model.ok)f.price.value=model.price;});
  f.rateUnit.addEventListener('change',()=>unitChange(f.rateUnit.value));
  form.addEventListener('input',e=>{if(e.target===f.plough)countyReference=false;clear();});form.addEventListener('change',()=>{clear();updateFields();});
  form.addEventListener('reset',()=>setTimeout(defaults,0));
  el('county-apply').addEventListener('click',()=>{f.rateUnit.value='acre';unitChange('acre');f.passes.value='1';f.plough.value='2300';countyReference=true;updateFields();clear();});
  function calculate(){
    clear();if(!form.reportValidity())return;
    const input={countryCode:f.countryCode.value,equipmentKey:f.equipmentKey.value,financeType:f.financeType.value,doContract:f.doContract.checked};
    for(const k of ['price','farmHa','passes','years','rate','term','downPct','contractHa','contractRate'])input[k]=Number(f[k].value);
    if(!input.doContract)input.contractHa=input.contractRate=0;
    const unit=f.rateUnit.value,quote=Object.fromEntries(rates.map(k=>[k,Number(f[k].value)]));
    const hireRates={...data.hireRates[input.countryCode],diesel_per_litre:Number(f.diesel.value)};
    rateKeys.forEach((k,i)=>{hireRates[k]=quote[rates[i]]*(unit==='acre'?perHa:1);});
    const scenarioData={...data,hireRates:{...data.hireRates,[input.countryCode]:hireRates}};
    const output=engine.calculate(input,scenarioData);if(!output.ok){el('tractor-status').textContent='Angalia ingizo lako.';return;}
    // Explicit zero-priced operations must stay zero; the legacy engine infers missing rates.
    const annualHire=input.farmHa*rateKeys.slice(0,input.passes).reduce((sum,k)=>sum+hireRates[k],0);
    const money=v=>output.country.currency+' '+format.format(v);
    const rows=[['Kukodi kwa mwaka',annualHire],['Kukodi kwa miaka '+input.years,annualHire*input.years],
      ['Mafuta ya mashine kwa mwaka',output.buy.annualFuel],['Matengenezo kwa mwaka',output.buy.annualMaint],['Kuendesha mashine yako kwa mwaka',output.buy.annualOp],['Thamani inayokadiriwa mwishoni mwa kipindi',output.buy.residual],
      ['Kununua: gharama ya miaka '+input.years+' baada ya kuondoa thamani iliyobaki',output.buy.totalCost],
      ['Kununua: wastani kwa mwaka',output.buy.totalCost/input.years]];
    if(output.lease)rows.push(['Ufadhili: malipo ya awali',output.lease.capitalRequired],['Ufadhili: malipo kwa mwezi',output.lease.monthlyPayment],['Ufadhili: jumla ya malipo kwa miaka '+input.term+' (bila gharama za uendeshaji)',output.lease.totalCost]);
    if(input.doContract)rows.push(['Mapato ya kazi za wateja kwa mwaka, kabla ya gharama',output.contract.annualIncome]);
    if(rows.some(([,value])=>!Number.isFinite(value))){el('tractor-status').textContent='Thamani hizi ni kubwa mno. Angalia ingizo.';return;}
    const countyNote=countyReference && input.countryCode==='KE' && Math.abs(hireRates[rateKeys[0]]/perHa-2300)<1e-6 ? ' Laikipia: kulima shamba jipya, KES 2,300/ekari, Sheria ya Fedha ya Kaunti ya 2025, uk. 67 wa PDF. '+el('county-example').querySelector('a').href : '';
    const sourceNote='Makisio: '+input.farmHa+' ha, '+input.passes+' kazi kwa mwaka, bei kwa '+(unit==='ha'?'hektari':'ekari')+
      ' ('+output.country.currency+'): '+rates.slice(0,input.passes).map((k,i)=>['kulima','kuvuruga udongo','matuta'][i]+' '+quote[k]).join(', ')+
      '; dizeli kwa lita '+money(hireRates.diesel_per_litre)+'. Uendeshaji na thamani iliyobaki ni makadirio ya mfano wa mashine.'+countyNote;
    const summary=el('tractor-summary');summary.replaceChildren();
    const dl=document.createElement('dl');rows.forEach(([label,value])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=money(value);dl.append(dt,dd);});summary.append(dl);
    const note=document.createElement('p');note.textContent=sourceNote;summary.append(note);
    saved={schemaVersion:1,tool:'tractor-calculator',locale:'sw',input:{...input,countyReference:Boolean(countyNote),rateUnit:unit,quote,diesel:hireRates.diesel_per_litre},result:{currency:output.country.currency,rows,sourceNote}};
    el('tractor-results').hidden=false;el('tractor-status').textContent='Mpango umekokotolewa.';
  }
  form.addEventListener('submit',e=>{e.preventDefault();calculate();});
  el('tractor-results').addEventListener('click',async e=>{
    const kind=e.target.dataset.kind;if(!kind||!saved)return;
    const text=el('tractor-summary').innerText;
    if(kind==='copy'){try{await navigator.clipboard.writeText(text);el('tractor-status').textContent='Imenakiliwa.';}catch{el('tractor-status').textContent='Pakua TXT au nakili maandishi.';}return;}
    if(kind==='pdf'){if(!window.jspdf){el('tractor-status').textContent='PDF haipatikani. Pakua TXT.';return;}const p=new window.jspdf.jsPDF();p.text(p.splitTextToSize(text,175),15,20);p.save('mpango-wa-trekta.pdf');return;}
    const csv='kipengele,sarafu,kiasi\r\n'+saved.result.rows.map(([label,v])=>'"'+label+'",'+saved.result.currency+','+v).join('\r\n');
    const content=kind==='csv'?csv:kind==='json'?JSON.stringify(saved,null,2):text;
    const u=URL.createObjectURL(new Blob([content],{type:{csv:'text/csv',txt:'text/plain',json:'application/json'}[kind]}));
    const a=document.createElement('a');a.href=u;a.download='mpango-wa-trekta.'+kind;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
  });
  el('tractor-import').addEventListener('change',async e=>{
    try{clear();const file=e.target.files[0];if(!file)return;const old=JSON.parse(await file.text()),v=old.input;
      if(old.tool!=='tractor-calculator'||old.locale!=='sw'||!v||!Object.hasOwn(data.countries,v.countryCode)||!Object.hasOwn(data.equipment,v.equipmentKey))throw Error();
      f.countryCode.value=v.countryCode;f.equipmentKey.value=v.equipmentKey;defaults();
      for(const k of ['price','farmHa','passes','years','financeType','rate','term','downPct','contractHa','contractRate'])if(v[k]!=null)f[k].value=v[k];
      f.doContract.checked=v.doContract===true;
      if(v.quote){countyReference=v.countyReference===true;f.rateUnit.value=previousUnit=v.rateUnit;for(const k of rates)f[k].value=v.quote[k];f.diesel.value=v.diesel;}
      updateFields();calculate();
    }catch{el('tractor-status').textContent='Faili haina mpango halali wa trekta.';}e.target.value='';
  });
  defaults();form.querySelector('[type=submit]').disabled=false;
})();
