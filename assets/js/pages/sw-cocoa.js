(() => {
  'use strict';
  const form=document.getElementById('cocoa-form'),data=window.COCOA_DATA,engine=window.AfroTools?.CocoaEngine;
  if(!form||!data||!engine)return;
  const get=id=>document.getElementById(id),f=form.elements;
  const names={young_3_5:'Miti michanga (miaka 3–5)',prime_6_15:'Miaka 6–15',mature_16_25:'Miaka 16–25',old_26_35:'Miaka 26–35',very_old_35p:'Zaidi ya miaka 35',local_forastero:'Forastero ya asili',improved_hybrid:'Mseto ulioboreshwa',high_yielding_clone:'Kizazi cha mavuno mengi',no_inputs:'Bila pembejeo',minimal_pruning:'Upogoaji mdogo',moderate_fert_spray:'Mbolea na unyunyiziaji wa wastani',full_recommended:'Matunzo kamili katika mfano',heavy_shade:'Kivuli kingi',moderate_shade:'Kivuli cha wastani',no_shade:'Bila kivuli',agroforestry_opt:'Kilimo mseto cha miti',no_control:'Bila udhibiti',some_control:'Udhibiti wa kiasi',good_ipm:'Udhibiti jumuishi',full_chemical:'Udhibiti wa kemikali',grade_1:'Daraja la 1',grade_2:'Daraja la 2',grade_3:'Daraja la 3',substandard:'Chini ya kiwango',none:'Hakuna',rainforest:'Rainforest Alliance',fairtrade:'Fairtrade',organic:'Kilimo hai'};
  const preset={treeAge:'prime_6_15',variety:'improved_hybrid',management:'full_recommended',shade:'moderate_shade',disease:'good_ipm',qualityGrade:'grade_2',certification:'none'};
  for(const [id,country] of Object.entries(data.countries))f.countryCode.add(new Option(country.name,id,id==='GH',id==='GH'));
  for(const [key,selected] of Object.entries(preset)){
    const source=data.agronomy.yieldFactors[key] || (key==='qualityGrade'?data.qualityGrades:data.certifications);
    for(const id of Object.keys(source))f[key].add(new Option(names[id]||id,id,id===selected,id===selected));
  }
  let saved;
  function clear(){saved=null;get('cocoa-results').hidden=true;get('cocoa-status').textContent='';}
  function country(){
    clear();const c=data.countries[f.countryCode.value];f.regionId.replaceChildren(new Option('Wastani wa nchi',''));
    for(const r of c.regions)f.regionId.add(new Option(r.name,r.id));
    const box=get('cocoa-price');box.replaceChildren();
    if(c.producerPriceSource){
      const ref=c.producerPriceSource;
      box.append('Ghana, msimu '+ref.season+', kuanzia '+ref.effectiveDate+': GHS '+ref.perTonne.toLocaleString('sw')+' kwa tani (GHS '+c.farmGatePrice_per_kg.toFixed(2)+'/kg kwa hesabu ya mavuno). COCOBOD pia ilitangaza GHS '+ref.perBag.toLocaleString('sw')+' kwa gunia la kilo '+ref.bagKg+' kama bei tofauti ya mauzo. ');
      const a=document.createElement('a');a.href=ref.url;a.textContent='Soma tangazo la COCOBOD';box.append(a);
    }else box.textContent='Bei ya kupanga katika data ya mfano: '+c.currency+' '+c.farmGatePrice_per_kg+'/kg. Tarehe ya bei haijaandikwa.';
  }
  function calculate(){
    clear();if(!form.reportValidity())return;
    const input=Object.fromEntries(new FormData(form));input.regionId=input.regionId||null;input.farmSizeHa=Number(input.farmSizeHa);
    const outputs=engine.calculate(input);const a=outputs.modeA,b=outputs.modeB,c=outputs.modeC,d=outputs.modeD;
    const currency=data.countries[input.countryCode].currency;
    const entries=[['Mavuno kwa hektari','kg/ha',a.yieldPerHa],['Mavuno ya shamba','kg',a.totalYield],['Bei ya mkulima kwa kilo',currency+'/kg',a.farmGatePrice],
      ['Mapato kabla ya gharama',currency,a.revenue],['Gharama za msimu katika mfano',currency,b.totalCosts],['Faida baada ya gharama',''+currency,b.netProfit],
      ['Mapato kwa makisio ya daraja na uthibitisho',currency,c.totalRevenue],['Sehemu ya bei ya mfano ya kusafirisha nje','%',Number(d.sharePct)]];
    if(entries.some(([,unit,v])=>!Number.isFinite(v))){get('cocoa-status').textContent='Thamani hizi haziwezi kukokotolewa. Angalia ingizo.';return;}
    const dl=get('cocoa-values');dl.replaceChildren();const fmt=new Intl.NumberFormat('sw',{maximumFractionDigits:2});
    for(const [label,unit,value] of entries){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=fmt.format(value)+' '+unit;dl.append(dt,dd);}
    const source=get('cocoa-price').textContent+' '+(data.countries[input.countryCode].producerPriceSource?.url||'');
    saved={schemaVersion:1,tool:'cocoa-tracker',locale:'sw',input,result:{entries,source},source:'data/agriculture/cocoa-data.js'};
    get('cocoa-results').hidden=false;get('cocoa-status').textContent='Makisio yako yako tayari.';
  }
  form.addEventListener('input',clear);form.addEventListener('change',clear);f.countryCode.addEventListener('change',country);form.addEventListener('submit',e=>{e.preventDefault();calculate();});form.addEventListener('reset',()=>setTimeout(country,0));
  get('cocoa-results').addEventListener('click',async e=>{
    const k=e.target.dataset.file;if(!k||!saved)return;const txt=get('cocoa-values').innerText+'\n'+saved.result.source;
    if(k==='copy'){try{await navigator.clipboard.writeText(txt);get('cocoa-status').textContent='Imenakiliwa.';}catch{get('cocoa-status').textContent='Pakua TXT au nakili maandishi.';}return;}
    if(k==='pdf'){if(!window.jspdf){get('cocoa-status').textContent='PDF haipatikani. Pakua TXT.';return;}const p=new window.jspdf.jsPDF();p.text(p.splitTextToSize(txt,175),15,20);p.save('mapato-ya-kakao.pdf');return;}
    const rows=[['kipengele','kipimo','thamani'],...saved.result.entries,['Chanzo','',saved.result.source]];const csv=rows.map(r=>r.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\r\n');
    const content=k==='json'?JSON.stringify(saved,null,2):k==='csv'?csv:txt;const url=URL.createObjectURL(new Blob([content],{type:{txt:'text/plain',csv:'text/csv',json:'application/json'}[k]}));const link=document.createElement('a');link.href=url;link.download='mapato-ya-kakao.'+k;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  get('cocoa-import').addEventListener('change',async e=>{
    try{clear();const file=e.target.files[0];if(!file)return;const p=JSON.parse(await file.text()),v=p.input;
      if(p.tool!=='cocoa-tracker'||p.locale!=='sw'||!v||!Object.hasOwn(data.countries,v.countryCode)||!Number.isFinite(v.farmSizeHa)||v.farmSizeHa<=0)throw Error();
      f.countryCode.value=v.countryCode;country();f.regionId.value=v.regionId||'';if(f.regionId.selectedIndex<0)throw Error();
      for(const key of Object.keys(preset)){f[key].value=v[key];if(f[key].selectedIndex<0)throw Error();}f.farmSizeHa.value=v.farmSizeHa;calculate();
    }catch{get('cocoa-status').textContent='Faili haina hesabu halali ya kakao.';}e.target.value='';
  });
  country();form.querySelector('[type=submit]').disabled=false;
})();
